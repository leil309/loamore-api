import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ICharacter } from '../common/interface';
import { class_yn } from '../@generated/prisma/class-yn.enum';
import { SortOrder } from '../@generated/prisma/sort-order.enum';
import { CharacterRankOutput } from './dto/character.output';
import { FindCursorCharacterRankingArgs } from './dto/characterRanking.args';
import { use_yn } from '../@generated/prisma/use-yn.enum';
import * as cheerio from 'cheerio';
import * as https from "https";
import axios from "axios";

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  async findCharacterRanking({
    cursor,
    take,
    className,
    engravingIds,
  }: FindCursorCharacterRankingArgs) {
    let nonEngIds = [];
    if (
      className &&
      className.length === 1 &&
      engravingIds &&
      engravingIds.length >= 1
    ) {
      const classId = await this.prisma.classJob.findFirst({
        where: {
          name: className[0],
        },
      });
      const classEngraving = await this.prisma.engraving.findMany({
        where: {
          class_id: classId.id,
          class_yn: class_yn.Y,
          id: {
            notIn: engravingIds,
          },
        },
      });
      nonEngIds = classEngraving.map((x) => x.id);
    }

    const where = {
      item_level: {
        gte: 1340,
      },
    };
    if (className.length > 0) {
      where['class'] = {
        in: className,
      };
    }

    const engAnd =
      engravingIds && engravingIds.length > 0
        ? {
            AND: {
              character_engraving: {
                none: {
                  engraving_id: {
                    in: nonEngIds,
                  },
                },
              },
            },
          }
        : {};

    const characterList = await this.prisma.character.findMany({
      take,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      include: {
        character_gear: {
          include: {
            item: true,
          },
          where: { use_yn: 'Y' },
        },
        character_engraving: {
          include: {
            engraving: true,
          },
        },
      },
      where: {
        ...where,
        ...engAnd,
      },
      orderBy: [{ item_level: SortOrder.desc }, { id: SortOrder.asc }],
    });

    const result: Array<CharacterRankOutput> = characterList.map(
      (character) => {
        const setList = Object.entries(
          character.character_gear
            .filter((cg) => !!cg.item.set_name)
            .map((cg) => cg.item.set_name)
            .reduce((ac, v) => ({ ...ac, [v]: (ac[v] || 0) + 1 }), {}),
        ).map((x) => x.toLocaleString().replace(',', ' '));
        const engravingList = character.character_engraving
          .filter((ce) => ce.engraving.class_yn === class_yn.Y)
          .map((ce) => ce.engraving.name);
        const res: CharacterRankOutput = {
          id: character.id,
          name: character.name,
          className: character.class,
          itemLevel: character.item_level,
          guildName: character.guild_name,
          serverName: character.server_name,
          imageUri: character.image_uri,
          setItem: setList,
          classEngraving: engravingList,
          insDate: character.ins_date,
          updDate: character.upd_date,
        };
        return res;
      },
    );
    return result;
  }
  async findCharacter(name: string) {
    return this.prisma.character.findFirst({
      include: {
        character_accessory: {
          where: {
            use_yn: 'Y',
          },
          include: {
            item: true,
          },
        },
        character_gear: {
          where: {
            use_yn: 'Y',
          },
          include: {
            item: true,
          },
        },
        character_gem: {
          where: {
            use_yn: 'Y',
          },
          include: {
            item: true,
            skill: true,
          },
          orderBy: [{ effect_type: 'desc' }],
        },
        character_engraving: {
          where: {
            use_yn: 'Y',
          },
          include: {
            engraving: true,
          },
        },
        character_skill: {
          where: {
            use_yn: 'Y',
          },
          include: {
            skill: {
              include: {
                tripod: true,
              },
            },
            character_skill_tripod: {
              where: {
                use_yn: 'Y',
              },
              include: {
                tripod: true,
              },
            },
          },
          orderBy: {
            level: 'desc',
          },
        },
      },
      where: {
        name: name,
      },
    });
  }

  async upsertJs(name: string) {
    const c = await this.prisma.character.findFirst({
      where: {
        name: name,
      },
    });

    if (c) {
      const min = (new Date().getTime() - c.upd_date.getTime()) / 1000 / 60;
      if (min < 1) {
        return true;
      }
    }

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const reg = /<[^>]*>?/g;
    const dt = await axios(
      `https://lostark.game.onstove.com/Profile/Character/${name}`,
      {
        method: 'get',
        httpsAgent: agent,
      },
    )
      .then((response) => response.data)
      .then((html) => {
        const $ = cheerio.load(html);
        let character: ICharacter = {
          accessoryList: undefined,
          avatarList: undefined,
          cardList: undefined,
          class: "",
          elixir: undefined,
          engraving: undefined,
          gearList: undefined,
          gemList: undefined,
          guildName: "",
          imageUri: "",
          itemLevel: undefined,
          level: undefined,
          ownUserName: undefined,
          serverName: "",
          skillList: undefined,
          stats: {
            basic: {attack_power: 0, max_health: 0},
            battle: {critical: 0, domination: 0, endurance: 0, expertise: 0, specialization: 0, swiftness: 0},
            virtues: {charisma: 0, courage: 0, kindness: 0, wisdom: 0}
          },
          userName: ""

        };
        // 레벨
        character.level = $('.profile-character-info__lv')
          .text()
          .replace('Lv.', '');
        // 템렙
        $('.level-info2__item > span').each(function (index, item) {
          if (index === 1)
            character.itemLevel = $(this).text().replace('Lv.', '');
        });
        // 기본스탯
        character.stats.basic = this.basicStats($);
        // 전투스탯
        character.stats.battle = this.battleStats($);
        // 성향
        character.stats.virtues = this.virtues($);
        // 각인
        character.stats.engraving = this.engraving($);

        // 보유 캐릭터 목록
        let count = 0;
        let temp = [];
        $('ul.profile-character-list__char > li > span > button').each(
          function (index, item) {
            temp[count] = $(this)
              .attr('onclick')
              ?.split('/')[3]
              .replace("'", '');
            count = count + 1;
          },
        );
        character.ownUserName = temp;
        character.class = $(
          '#lostark-wrapper > div > main > div > div.profile-character-info > img[src]',
        ).attr().alt;
        character.guildName = $(
          '#lostark-wrapper > div > main > div > div.profile-ingame > div.profile-info > div.game-info > div.game-info__guild > span:nth-child(2)',
        ).text();
        character.serverName = $(
          '#lostark-wrapper > div > main > div > div.profile-character-info > span.profile-character-info__server',
        )
          .text()
          .replace('@', '');
        character.imageUri = $(
          '#profile-equipment > div.profile-equipment__character > img',
        ).attr().src;

        const script = $('#profile-ability > script')
          .text()
          .replace('$.Profile = ', '')
          .replace(/\t/gi, '')
          .replace(/\n/gi, '')
          .replace(/\\n/gi, '')
          .replace(/\\t/gi, '')
          .replace(/;/gi, '');

        const scriptJson = JSON.parse(script);
        if (!scriptJson) {
          return;
        }

        character.gearList = Object.entries(scriptJson.Equip)
          .filter((obj) => !obj[0].match('Gem'))
          .filter((obj) => {
            const num = parseInt(obj[0].split('_')[1]);
            return [0, 1, 2, 3, 4, 5].includes(num);
          })
          .map((obj: any, index: number) => {
            const data: string = JSON.stringify(obj[1]).replace(reg, '');
            // const setEffect = data.Element_009.value.Element_000.topStr

            const itemNameRegex =
              /"type":"NameTagBox","value":"\+?(\d+)?([^"]+)"/; // /"type":"NameTagBox","value":"\+(\d+)?([^"]+)"/
            const itemLevelRegex = /"leftStr2":"아이템 레벨 (\d+)/;
            const itemTierRegex = /\(티어 (\d+)\)/;
            const qualityRegex = /"qualityValue":(\d+)/;
            const baseEffectRegex = /"기본 효과","[^"]+":"([^"]+)"/;
            const additionalEffectRegex = /"추가 효과","[^"]+":"([^"]+)"/;
            const imageUriRegex = /"iconPath":"(.*?)"/;
            const iconGrade = /"iconGrade":(\d)/;

            const setNameRegex = /"topStr":"([가-힣\s]+)"},"Element_001"/;
            const setEffectRegex =
              /"bPoint":(true|false),"contentStr":"[^}]*?([^}]*?)}},"topStr":"(\d) 세트 효과/g;

            const setNameMatch = setNameRegex.exec(data);
            const setName = setNameMatch ? setNameMatch[1] : '';

            let setEffect = [];
            let setEffectMatch;
            const imageMatch = imageUriRegex.exec(data);
            while ((setEffectMatch = setEffectRegex.exec(data)) !== null) {
              setEffect.push({
                bPoint: setEffectMatch[1] === 'true',
                piece: setEffectMatch[3],
                effect: setEffectMatch[2],
              });
            }

            let gear = {
              name: itemNameRegex.exec(data)[2].trim(),
              honing: itemNameRegex.exec(data)[1]
                ? parseInt(itemNameRegex.exec(data)[1])
                : 0,
              imageUri: imageMatch ? imageMatch[1] : '',
              slot: index,
              quality: data.match(qualityRegex)
                ? parseInt(data.match(qualityRegex)[1])
                : -1,
              level: data.match(itemLevelRegex)
                ? parseInt(data.match(itemLevelRegex)[1])
                : -1,
              tier: data.match(itemTierRegex)
                ? parseInt(data.match(itemTierRegex)[1])
                : -1,
              setName: setName,
              setEffect: setEffect,
              baseEffect: baseEffectRegex.exec(data)
                ? baseEffectRegex.exec(data)[1].split(/(?<=\d)(?=[가-힣])/)
                : [],
              additionalEffect: additionalEffectRegex.exec(data)
                ? additionalEffectRegex
                  .exec(data)[1]
                  .split(/(?<=\d)(?=[가-힣])/)
                : [],
              grade: iconGrade.exec(data) ? parseInt(iconGrade.exec(data)[1]) : 0
            };
            return gear;
          });

        return character;
      });
    return;
  }

  async upsertCharacter(dt: ICharacter) {
    const c = await this.prisma.character.findUnique({
      where: {
        name: dt.userName,
      },
    });

    if (c) {
      const min = (new Date().getTime() - c.upd_date.getTime()) / 1000 / 60;
      if (min <= 3) {
        return false;
      }
    }

    // 1. 캐릭터 기본 정보
    const character = await this.prisma.character.upsert({
      where: {
        name: dt.userName,
      },
      create: {
        name: dt.userName,
        class: dt.class,
        level: parseInt(dt.level),
        item_level: parseFloat(dt.itemLevel.replace(',', '')),
        guild_name: dt.guildName,
        server_name: dt.serverName,
        ...dt.stats.basic,
        ...dt.stats.battle,
        ...dt.stats.virtues,
        image_uri: dt.imageUri,
        ins_date: new Date(),
        upd_date: new Date(),
      },
      update: {
        level: parseInt(dt.level),
        item_level: parseFloat(dt.itemLevel.replace(',', '')),
        guild_name: dt.guildName,
        ...dt.stats.basic,
        ...dt.stats.battle,
        ...dt.stats.virtues,
        image_uri: dt.imageUri,
        upd_date: new Date(),
      },
    });

    // 2.스킬
    await this.prisma.character_skill.updateMany({
      where: {
        character_id: character.id,
      },
      data: {
        use_yn: 'N',
      },
    });
    const cs = await this.prisma.character_skill.findMany({
      where: {
        character_id: character.id,
      },
    });
    await this.prisma.character_skill_tripod.updateMany({
      where: {
        character_skill_id: {
          in: cs.map((x) => x.id),
        },
      },
      data: {
        use_yn: 'N',
      },
    });
    // await this.prisma.$transaction(
    //   dt.gemList.map((x) =>
    //     this.prisma.skill.upsert({
    //       where: {
    //         name_class: {
    //           name: x.skill,
    //           class: character.class,
    //         },
    //       },
    //       create: {
    //         name: x.skill,
    //         class: x.class,
    //         image_uri: x.skillIcon,
    //       },
    //       update: {
    //         image_uri: x.skillIcon,
    //       },
    //     }),
    //   ),
    // );

    const upsertSkill = async (skillInfo) => {
      const skill = await this.prisma.skill.upsert({
        where: {
          name_class: {
            name: skillInfo.name,
            class: skillInfo.class,
          },
        },
        create: {
          name: skillInfo.name,
          class: skillInfo.class,
          image_uri: skillInfo.imageUri,
        },
        update: {
          image_uri: skillInfo.imageUri,
        },
      });

      const characterSkill = await this.prisma.character_skill.upsert({
        where: {
          character_id_skill_id: {
            character_id: character.id,
            skill_id: skill.id,
          },
        },
        create: {
          character_id: character.id,
          skill_id: skill.id,
          level: skillInfo.level,
          counter_yn: skillInfo.counterYn,
          super_armor: skillInfo.superArmor,
          weak_point: skillInfo.weakPoint,
          stagger_value: skillInfo.staggerValue,
          attack_type: skillInfo.attackType,
          use_yn: 'Y',
        },
        update: {
          level: skillInfo.level,
          counter_yn: skillInfo.counterYn,
          super_armor: skillInfo.superArmor,
          weak_point: skillInfo.weakPoint,
          stagger_value: skillInfo.staggerValue,
          attack_type: skillInfo.attackType,
          use_yn: 'Y',
        },
      });

      await Promise.all(
        skillInfo.tripods.map(async (x) => {
          const tripod = await this.prisma.tripod.upsert({
            where: {
              name_skill_id: {
                name: x.name,
                skill_id: skill.id,
              },
            },
            create: {
              name: x.name,
              skill_id: skill.id,
              image_uri: x.imageUri,
              tier: x.tier,
              slot: x.slot,
            },
            update: {
              image_uri: x.imageUri,
              tier: x.tier,
              slot: x.slot,
            },
          });

          await this.prisma.character_skill_tripod.upsert({
            where: {
              character_skill_id_tripod_id: {
                character_skill_id: characterSkill.id,
                tripod_id: tripod.id,
              },
            },
            create: {
              character_skill_id: characterSkill.id,
              tripod_id: tripod.id,
              level: x.level,
              selected_yn: x.selected,
              use_yn: 'Y',
            },
            update: {
              level: x.level,
              selected_yn: x.selected,
              use_yn: 'Y',
            },
          });
        }),
      );
    };

    await Promise.all(dt.skillList.map(upsertSkill));

    const skillList = await this.prisma.skill
      .findMany({
        where: {
          name: {
            in: dt.gemList.map((x) => x.skill),
          },
        },
      })
      .then((x) => {
        return x.map((y) => {
          return {
            skillId: y.id,
            skill: y.name,
          };
        });
      });

    // 3. 보석
    const gemSkills = dt.gemList.map((x) => {
      const skillId = skillList?.find((y) => y.skill === x.skill)?.skillId || 0;

      return {
        ...x,
        skillId,
      };
    });

    await this.prisma.character_gem.updateMany({
      where: {
        character_id: character.id,
      },
      data: {
        use_yn: 'N',
      },
    });

    await Promise.all(
      gemSkills.map(async (x) => {
        const gem = await this.prisma.item.upsert({
          where: {
            name: x.name.trim(),
          },
          create: {
            name: x.name.trim(),
            image_uri: x.imageUri,
            tier: x.tier,
          },
          update: {
            image_uri: x.imageUri,
            tier: x.tier,
          },
        });

        await this.prisma.character_gem.upsert({
          where: {
            character_id_slot: {
              character_id: character.id,
              slot: x.slot,
            },
          },
          create: {
            character_id: character.id,
            item_id: gem.id,
            slot: x.slot,
            level: x.level,
            skill_id: x.skillId,
            rate: x.rate,
            effect_type: x.effectType,
            direction: x.direction,
            use_yn: 'Y',
            ins_date: new Date(),
            upd_date: new Date(),
          },
          update: {
            item_id: gem.id,
            level: x.level,
            skill_id: x.skillId,
            rate: x.rate,
            effect_type: x.effectType,
            direction: x.direction,
            use_yn: 'Y',
            upd_date: new Date(),
          },
        });
      }),
    );

    // 4. 장비
    await this.prisma.character_gear.updateMany({
      where: {
        character_id: character.id,
      },
      data: {
        use_yn: 'N',
      },
    });

    await Promise.all(
      dt.gearList.map(async (x) => {
        const gear = await this.prisma.item.upsert({
          where: {
            name: x.name,
          },
          create: {
            name: x.name,
            image_uri: x.imageUri,
            tier: x.tier,
            set_name: x.setName,
            grade: x.grade,
          },
          update: {
            image_uri: x.imageUri,
            tier: x.tier,
            set_name: x.setName,
            grade: x.grade,
          },
        });

        await this.prisma.character_gear.upsert({
          where: {
            character_id_slot: {
              character_id: character.id,
              slot: x.slot,
            },
          },
          create: {
            item_id: gear.id,
            character_id: character.id,
            slot: x.slot,
            honing: x.honing,
            quality: x.quality,
            base_effect: JSON.stringify(x.baseEffect),
            additional_effect: JSON.stringify(x.additionalEffect),
            use_yn: 'Y',
          },
          update: {
            item_id: gear.id,
            honing: x.honing,
            quality: x.quality,
            base_effect: JSON.stringify(x.baseEffect),
            additional_effect: JSON.stringify(x.additionalEffect),
            use_yn: 'Y',
          },
        });
      }),
    );

    // 5.악세사리
    await this.prisma.character_accessory.updateMany({
      where: {
        character_id: character.id,
      },
      data: {
        use_yn: 'N',
      },
    });
    dt.accessoryList.map(async (x) => {
      const accessory = await this.prisma.item.upsert({
        where: {
          name: x.name,
        },
        create: {
          name: x.name,
          image_uri: x.imageUri,
          tier: x.tier,
        },
        update: {
          image_uri: x.imageUri,
          tier: x.tier,
        },
      });

      await this.prisma.character_accessory.upsert({
        where: {
          character_id_slot: {
            character_id: character.id,
            slot: x.slot,
          },
        },
        create: {
          item_id: accessory.id,
          character_id: character.id,
          slot: x.slot,
          quality: x.quality,
          base_effect: JSON.stringify(x.baseEffect),
          additional_effect: JSON.stringify(x.additionalEffect),
          engraving: JSON.stringify(x.engraving),
          bracelet_effect: JSON.stringify(x.braceletEffect),
          use_yn: 'Y',
        },
        update: {
          item_id: accessory.id,
          quality: x.quality,
          base_effect: JSON.stringify(x.baseEffect),
          additional_effect: JSON.stringify(x.additionalEffect),
          engraving: JSON.stringify(x.engraving),
          bracelet_effect: JSON.stringify(x.braceletEffect),
          use_yn: 'Y',
        },
      });
    });

    // 6.각인
    await this.prisma.character_engraving.updateMany({
      where: {
        character_id: character.id,
      },
      data: {
        use_yn: 'N',
      },
    });
    dt.engraving.map(async (x, index) => {
      const update = {};
      if (x.classYn) {
        update['class_yn'] = x.classYn;
      }
      const create = {
        name: x.name,
        class_yn: x.classYn ? x.classYn : class_yn.N,
        image_uri: x.imageUri ? x.imageUri : '',
        info: x.info ? x.info : '',
      };
      if (x.className) {
        const classJob = await this.prisma.classJob.findFirst({
          where: {
            name: x.className,
          },
        });
        create['class_id'] = classJob.id;
        update['class_id'] = classJob.id;
      }
      if (x.imageUri) {
        update['image_uri'] = x.imageUri;
        update['info'] = x.info;
      }
      const engraving = await this.prisma.engraving.upsert({
        where: {
          name: x.name,
        },
        create: create,
        update: update,
      });
      await this.prisma.character_engraving.upsert({
        where: {
          character_id_slot: {
            character_id: character.id,
            slot: index,
          },
        },
        create: {
          character_id: character.id,
          engraving_id: engraving.id,
          level: x.level,
          slot: index,
          use_yn: 'Y',
        },
        update: {
          engraving_id: engraving.id,
          level: x.level,
          use_yn: 'Y',
        },
      });
    });
    return true;
  }

  async analyzeCharacter(name: string) {
    const myCharacter = await this.prisma.character.findFirst({
      where: { name: name },
      include: {
        character_engraving: {
          include: {
            engraving: true,
          },
        },
      },
    });

    const engravingAnd = myCharacter.character_engraving
      .filter((x) => x.engraving.class_yn === class_yn.Y)
      .map((y) => {
        return {
          character_engraving: {
            some: { level: y.level, engraving_id: y.engraving_id },
          },
        };
      });
    const noneId = myCharacter.character_engraving
      .filter((x) => x.engraving.class_yn === class_yn.Y)
      .map((y) => y.engraving_id);

    const topRanker = await this.prisma.character.findMany({
      where: {
        AND: engravingAnd,
        class: myCharacter.class,
      },
      select: {
        name: true,
        character_engraving: {
          select: {
            level: true,
            engraving: {
              select: {
                id: true,
                name: true,
                class_yn: true,
                image_uri: true,
              },
            },
          },
          where: {
            use_yn: use_yn.Y,
            engraving_id: {
              notIn: noneId,
            },
          },
        },
      },
      orderBy: [{ item_level: SortOrder.desc }],
      take: 50,
    });

    const countEngravingsByLevel = (
      characters: any,
    ): Map<string, { [level: number]: number }> => {
      const engravingCountByLevel: Map<
        string,
        { imageUri: string; [level: number]: number }
      > = new Map();

      for (const character of characters) {
        for (const engravingData of character.character_engraving) {
          const engravingName = engravingData.engraving.name;
          const imageUri = engravingData.engraving.image_uri || '';
          const level = engravingData.level;

          if (engravingCountByLevel.has(engravingName)) {
            if (engravingCountByLevel.get(engravingName)[level]) {
              engravingCountByLevel.get(engravingName)[level]++;
            } else {
              engravingCountByLevel.get(engravingName)[level] = 1;
            }
          } else {
            engravingCountByLevel.set(engravingName, {
              imageUri,
              [level]: 1,
            });
          }
        }
      }

      return engravingCountByLevel;
    };

    const engravingCountByLevel = countEngravingsByLevel(topRanker);

    return Array.from(engravingCountByLevel.entries()).map(([name, value]) => {
      const levelList = [];
      if (value[1]) {
        levelList.push({ level: 1, count: value[1] });
      }
      if (value[2]) {
        levelList.push({ level: 2, count: value[2] });
      }
      if (value[3]) {
        levelList.push({ level: 3, count: value[3] });
      }
      return {
        name,
        imageUri: value['imageUri'],
        countByLevel: JSON.stringify(levelList),
      };
    });
  }

  async findAverageEngraving(name: string) {
    const myCharacter = await this.prisma.character.findFirst({
      where: { name: name },
      include: {
        character_engraving: {
          include: {
            engraving: true,
          },
        },
      },
    });

    const engravingAnd = myCharacter.character_engraving
      .filter((x) => x.engraving.class_yn === class_yn.Y)
      .map((y) => {
        return {
          character_engraving: {
            some: { level: y.level, engraving_id: y.engraving_id },
          },
        };
      });
    const classEngravingId = myCharacter.character_engraving
      .filter((x) => x.engraving.class_yn === class_yn.Y)
      .map((y) => y.engraving_id);


    const classId = await this.prisma.classJob.findFirst({
      where: {
        name: myCharacter.class,
      },
    });
    const classEngraving = await this.prisma.engraving.findMany({
      where: {
        class_id: classId.id,
        class_yn: class_yn.Y,
        id: {
          notIn: classEngravingId,
        },
      },
    });
    const noneClassEngId = classEngraving.map(x => x.id)

    const noneEngAnd: any[] =
      noneClassEngId && noneClassEngId.length > 0 ?
        noneClassEngId.map(x => {
          return {
            character_engraving: { none: {engraving_id: x} }
          }
        }) : []

    const someEngAnd: any[] =
      classEngravingId && classEngravingId.length > 0 ?
        classEngravingId.map(x => {
          return {
                character_engraving: { some: {engraving_id: x} }
              }
            }) : []

    const engAnd =
      {
        AND: noneEngAnd.concat(someEngAnd)
      }


    const topRanker = await this.prisma.character.findMany({
      where: {
        ...engAnd,
        class: myCharacter.class,
      },
      select: {
        name: true,
        character_engraving: {
          select: {
            level: true,
            engraving: {
              select: {
                id: true,
                name: true,
                class_yn: true,
                image_uri: true,
              },
            },
          },
          where: {
            use_yn: use_yn.Y,
            engraving_id: {
              notIn: classEngravingId,
            },
          },
        },
      },
      orderBy: [{ item_level: SortOrder.desc }],
      take: 100,
    });

    const ave = topRanker.map((ch) => {
      return ch.character_engraving
        .map((ce) => {
          const engrave = {
            id: Number(ce.engraving.id),
            name: ce.engraving.name,
            class_yn: ce.engraving.class_yn,
            image_uri: ce.engraving.image_uri,
          };
          return JSON.stringify({
            level: ce.level,
            ...engrave,
          });
        })
        .sort()
        .join();
    });

    return Object.entries(
      ave.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {}),
    )
      .map((x: [any, number]) => {
        return {
          engraving: JSON.parse('[' + x[0] + ']').sort((a, b) => a.id - b.id),
          count: x[1],
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  async findAverageStats(name: string) {
    const myCharacter = await this.prisma.character.findFirst({
      where: { name: name },
      include: {
        character_engraving: {
          include: {
            engraving: true,
          },
        },
      },
    });

    const engravingAnd = myCharacter.character_engraving
      .filter((x) => x.engraving.class_yn === class_yn.Y)
      .map((y) => {
        return {
          character_engraving: {
            some: { level: y.level, engraving_id: y.engraving_id },
          },
        };
      });
    const noneId = myCharacter.character_engraving
      .filter((x) => x.engraving.class_yn === class_yn.Y)
      .map((y) => y.engraving_id);

    const topRanker = await this.prisma.character.findMany({
      where: {
        AND: engravingAnd,
        class: myCharacter.class,
      },
      select: {
        name: true,
        character_engraving: {
          select: {
            level: true,
            engraving: {
              select: {
                id: true,
                name: true,
                class_yn: true,
                image_uri: true,
              },
            },
          },
          where: {
            use_yn: use_yn.Y,
            engraving_id: {
              notIn: noneId,
            },
          },
        },
      },
      orderBy: [{ item_level: SortOrder.desc }],
      take: 100,
    });
  }

  async findAverageGem(name: string) {
    const myCharacter = await this.prisma.character.findFirst({
      where: { name: name },
      include: {
        character_engraving: {
          include: {
            engraving: true,
          },
        },
      },
    });
  }

  basicStats = ($) => {
    return {
      attack_power: parseInt(
        $(
          '#profile-ability > div.profile-ability-basic > ul > li:nth-child(1) > span:nth-child(2)',
        )
          .text()
          .trim(),
      ),
      max_health: parseInt(
        $(
          '#profile-ability > div.profile-ability-basic > ul > li:nth-child(2) > span:nth-child(2)',
        )
          .text()
          .trim(),
      ),
    };
  };
  battleStats = ($) => {
    return {
      critical: parseInt(
        $(
          '#profile-ability > div.profile-ability-battle > ul > li:nth-child(1) > span:nth-child(2)',
        )
          .text()
          .trim(),
      ),
      specialization: parseInt(
        $(
          '#profile-ability > div.profile-ability-battle > ul > li:nth-child(2) > span:nth-child(2)',
        )
          .text()
          .trim(),
      ),
      domination: parseInt(
        $(
          '#profile-ability > div.profile-ability-battle > ul > li:nth-child(3) > span:nth-child(2)',
        )
          .text()
          .trim(),
      ),
      swiftness: parseInt(
        $(
          '#profile-ability > div.profile-ability-battle > ul > li:nth-child(4) > span:nth-child(2)',
        )
          .text()
          .trim(),
      ),
      endurance: parseInt(
        $(
          '#profile-ability > div.profile-ability-battle > ul > li:nth-child(5) > span:nth-child(2)',
        )
          .text()
          .trim(),
      ),
      expertise: parseInt(
        $(
          '#profile-ability > div.profile-ability-battle > ul > li:nth-child(6) > span:nth-child(2)',
        )
          .text()
          .trim(),
      ),
    };
  };
  virtues = ($) => {
    const data = $('body > script:nth-child(13)').text().trim();
    const regex = /value:\s*\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]/;
    const match = data.match(regex);

    return {
      wisdom: parseInt(match[1]),
      courage: parseInt(match[2]),
      charisma: parseInt(match[3]),
      kindness: parseInt(match[4]),
    };
  };
  engraving = ($) => {
    const data = $(
      '#profile-ability > div.profile-ability-engrave > div > div.swiper-wrapper > ul > li > span',
    ).text();
    const regex = /([가-힣\s]+) Lv\. (\d)+/g;
    const engravings = [];

    let match;
    while ((match = regex.exec(data)) !== null) {
      engravings.push({
        name: match[1].trim(),
        level: parseInt(match[2]),
      });
    }

    return engravings;
  };
}
