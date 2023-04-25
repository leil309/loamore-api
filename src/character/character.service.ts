import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as cheerio from 'cheerio';
import { ApolloError } from 'apollo-server-express';
import * as https from 'https';
import axios from 'axios';
import * as _ from 'lodash';
import {
  CounterYn,
  IAccessory,
  ICharacter,
  IGear,
  IGem,
  IScript,
  ISkill,
  ISkillAdd,
  ITripod,
  SelectedYn,
} from '../common/interface';
import { class_yn } from 'src/@generated/prisma/class-yn.enum';
import { SortOrder } from 'src/@generated/prisma/sort-order.enum';
import { CharacterRankOutput } from 'src/character/dto/character.output';
import { FindCursorCharacterRankingArgs } from './dto/characterRanking.args';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  async findCharacterRanking({
    cursor,
    take,
    className,
  }: FindCursorCharacterRankingArgs) {
    let where = {
      item_level: {
        gte: 1340,
      },
    };
    if (className.length > 0) {
      where['class'] = {
        in: className,
      };
    }
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
          where: { use_yn: 'Y' },
        },
      },
      where: where,
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

  async upsertCharacter(name: string) {
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
          userName: '',
          class: '',
          level: undefined,
          itemLevel: undefined,
          guildName: undefined,
          serverName: undefined,
          imageUri: undefined,
          engraving: undefined,
          stats: {
            basic: undefined,
            battle: undefined,
            virtues: undefined,
            engraving: undefined,
          },
          skillList: undefined,
          skillAdditionalInfo: undefined,
          gearList: undefined,
          accessoryList: undefined,
          gemList: undefined,
          avatarList: undefined,
          cardList: undefined,
          elixir: undefined,
          ownUserName: undefined,
        };
        // 닉네임
        character.userName = $('.profile-character-info__name').text().trim();
        if (!character.userName) {
          throw new ApolloError('존재하지 않는 캐릭터입니다.');
        }
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

        const scriptJson: IScript = JSON.parse(script);
        if (!scriptJson) {
          throw new ApolloError('캐릭터 정보가 없습니다.');
        }

        const skillList = Object.entries(scriptJson.Skill).map((obj, index) => {
          const data: string = JSON.stringify(obj[1]).replace(reg, '  ');

          const nameRegex = /"type":"NameTagBox","value":"([^"]+)"/;
          const imageUriRegex = /"iconPath":"(.*?)"/;
          const levelRegex = /"type":"SingleTextBox","value":"스킬 레벨 (\d+)/;
          const weakPointRegex = /부위 파괴 : 레벨 (\d+)/;
          const staggerValueRegex = /무력화 : (\S+)/;
          const attackTypeRegex = /공격 타입 : (\S+)/;
          const counterYnRegex = /카운터 : (\S+)/;
          const superArmorRegex = /슈퍼아머 : ([^"]+)/;

          const nameMatch = nameRegex.exec(data);
          const imageUriMatch = imageUriRegex.exec(data);
          const levelMatch = levelRegex.exec(data);
          const weakPointMatch = weakPointRegex.exec(data);
          const staggerValueMatch = staggerValueRegex.exec(data);
          const attackTypeMatch = attackTypeRegex.exec(data);
          const counterYnMatch = counterYnRegex.exec(data);
          const superArmorMatch = superArmorRegex.exec(data);

          const skill: ISkill = {
            name: nameMatch ? nameMatch[1].trim() : '',
            class: character.class,
            imageUri: imageUriMatch ? imageUriMatch[1].trim() : '',
            level: levelMatch ? parseInt(levelMatch[1].trim()) : 0,
            counterYn: counterYnMatch ? CounterYn.Y : CounterYn.N,
            superArmor: superArmorMatch
              ? superArmorRegex
                  .exec(data)[1]
                  .replace('카운터 : 가능', '')
                  .trim()
              : '',
            weakPoint: weakPointMatch ? parseInt(weakPointMatch[1].trim()) : 0,
            staggerValue: staggerValueMatch ? staggerValueMatch[1].trim() : '',
            attackType: attackTypeMatch ? attackTypeMatch[1].trim() : '',
            tripods: null,
            rune: null,
          };
          return skill;
        });

        const tripodList = $(
          '#profile-skill > div.profile-skill-battle > div.profile-skill__list > div',
        )
          .children()
          .toArray()
          .map((obj: any, index: number) => {
            const data: any = JSON.parse(
              JSON.stringify(obj.attribs)
                .replace('data-classno', 'data_classno')
                .replace('data-classname', 'data_classname')
                .replace('data-skill', 'data_skill')
                .replace(/<[^>]*>?/g, ''),
            );

            const skillData = JSON.parse(data.data_skill);
            let rune;
            if (skillData.rune) {
              rune = {
                name: /"type":"NameTagBox","value":"([^"]+)"/.exec(
                  skillData.rune.tooltip,
                )[1],
                imageUri: skillData.rune.icon,
                grade: skillData.rune.grade,
              };
            }

            let tripods: ITripod[] = [];
            if (skillData.tripodList) {
              skillData.tripodList.map((x) => {
                tripods.push({
                  name: x.name,
                  imageUri: x.slotIcon,
                  tier: x.level,
                  slot: x.slot,
                  level: x.featureLevel,
                  skillName: skillData.name,
                  selected:
                    skillData.selectedTripodTier[x.level] &&
                    skillData.selectedTripodTier[x.level] === x.slot
                      ? SelectedYn.Y
                      : SelectedYn.N,
                });
              });
            }

            const skillInfo: ISkillAdd = {
              name: skillData.name,
              class: character.class,
              tripods: tripods,
              rune: rune,
            };
            return skillInfo;
          });

        character.skillList = _.values(
          _.merge(_.keyBy(skillList, 'name'), _.keyBy(tripodList, 'name')),
        );

        const gemList = Object.entries(scriptJson.Equip)
          .filter((obj) => obj[0].match('Gem'))
          .map((obj: any, index: number) => {
            const regex =
              /\[([^\]]+)\] ([^0-9]+) (재사용 대기시간|피해) ([0-9.]+)% (감소|증가)/g;
            const data: string = JSON.stringify(obj[1]).replace(reg, '');
            const gemInfo = regex.exec(data);

            const nameRegex = /"type":"NameTagBox","value":"([^"]+)"/;
            const levelRegex = /(\d+)레벨/;
            const imageUriRegex = /"iconPath":"(.*?)"/;

            const nameMatch = nameRegex.exec(data);
            const levelMatch = levelRegex.exec(data);
            const imageMatch = imageUriRegex.exec(data);

            const gem: IGem = {
              name: nameMatch ? nameMatch[1] : '',
              imageUri: imageMatch ? imageMatch[1] : '',
              slot: index,
              level: levelMatch ? parseInt(levelMatch[1]) : 0,
              tier: parseInt(
                JSON.stringify(obj[1].Element_001.value).match(
                  /아이템 티어 (\d+)/,
                )[1],
              ),
              class: gemInfo ? gemInfo[1].trim() : '',
              skill: gemInfo ? gemInfo[2].trim() : '',
              effectType: gemInfo ? gemInfo[3].trim() : '',
              rate: gemInfo ? parseFloat(gemInfo[4]) : 0,
              direction: gemInfo ? gemInfo[5].trim() : '',
            };
            return gem;
          });

        character.gemList = gemList.map((x) => {
          const aa = scriptJson.GemSkillEffect.find(
            (y) => y.SkillName === x.skill,
          );
          if (aa) {
            return {
              ...x,
              SkillIcon: aa.SkillIcon,
            };
          }
        });

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

            let gear: IGear = {
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
            };
            return gear;
          });

        character.accessoryList = Object.entries(scriptJson.Equip)
          .filter((obj) => !obj[0].match('Gem'))
          .filter((obj) => {
            const num = parseInt(obj[0].split('_')[1]);
            return [6, 7, 8, 9, 10, 11, 26].includes(num);
          })
          .map((obj, index) => {
            const data: string = JSON.stringify(obj[1]).replace(reg, '');

            const nameRegex = /"type":"NameTagBox","value":"([^"]+)"/;
            const imageUriRegex = /"iconPath":"(.*?)"/;
            const qualityRegex = /"qualityValue":(\d+)/;
            const itemTierRegex = /"아이템 티어 (\d+)"/;
            const baseEffectRegex =
              /"Element_000":"기본 효과","Element_001":"([^"]+)"/;
            const additionalEffectRegex = /"추가 효과","[^"]+":"([^"]+)"/;
            const engravingRegex = /"contentStr":"\[(.+?)\] 활성도 \+(\d+)"/g;
            const braceletEffectRegex =
              /"팔찌 효과","Element_001":"\s*(.+?)\s*"/;

            const basicStatsRegex =
              /(?:체력|힘|지력|민첩|신속|치명|특화|제압|숙련|인내)\s*\+\d+/g;
            const specialAbilitiesRegex = /\[([^\]]+)\].*?\./g;

            const nameMatch = nameRegex.exec(data);
            const imageMatch = imageUriRegex.exec(data);
            const tierMatch = itemTierRegex.exec(data);
            const qualityMatch = qualityRegex.exec(data);
            const baseEffectMatch = baseEffectRegex.exec(data);
            const additionalEffectMatch = additionalEffectRegex.exec(data);
            const braceletMatch = braceletEffectRegex.exec(data);

            let braceletEffect = [];
            if (braceletMatch) {
              const basicStats = braceletMatch[1].match(basicStatsRegex);
              const specialAbilities = braceletMatch[1].match(
                specialAbilitiesRegex,
              )
                ? braceletMatch[1]
                    .match(specialAbilitiesRegex)
                    .map((ability) => ability.slice(0, -1))
                : [];
              braceletEffect = basicStats.concat(specialAbilities);
            }
            let match;
            const engravingEffect = [];
            while ((match = engravingRegex.exec(data)) !== null) {
              engravingEffect.push({
                name: match[1],
                points: parseInt(match[2], 10),
              });
            }

            const accessory: IAccessory = {
              name: nameMatch ? nameMatch[1] : '',
              imageUri: imageMatch ? imageMatch[1] : '',
              slot: index,
              tier: tierMatch ? parseInt(data.match(itemTierRegex)[1]) : -1,
              quality: qualityMatch
                ? parseInt(data.match(qualityRegex)[1])
                : -1,
              baseEffect: baseEffectMatch
                ? baseEffectMatch[1].split(/(?<=\d)(?=[가-힣]+)/)
                : [],
              additionalEffect: additionalEffectMatch
                ? additionalEffectMatch[1].split(/(?<=\d)(?=[가-힣]+)/)
                : [],
              braceletEffect: braceletEffect,
              engraving: engravingEffect,
            };
            return accessory;
          });

        const engravingInfo = Object.entries(scriptJson.Engrave).map(
          (obj, index) => {
            const data: string = JSON.stringify(obj[1]).replace(reg, '');

            const nameRegex = /"value":"(.+?)"/;
            const isClassRegex = /name":"(.+?)"/;
            const effectRegex = /"레벨 별 효과보기","Element_001":"(.+?)"/;
            const imageUriRegex = /"iconPath":"(.*?)"/;
            const classRegex = /"forceMiddleText":"([^"]+)"/;

            const nameMatch = data.match(nameRegex);
            const isClassMatch = data.match(isClassRegex);
            const effectMatch = data.match(effectRegex);
            const imageMatch = data.match(imageUriRegex);
            const classMatch = data.match(classRegex);

            const name = nameMatch[1];
            const levelEffects = effectMatch
              ? effectMatch[1].split(/레벨 \d+ \(활성도 \d+\) - /)
              : [];

            if (levelEffects && levelEffects.length >= 4) {
              levelEffects.shift();
            }
            if (classMatch) {
              classMatch[1].replace(' 전용', '');
            }

            let res = {
              name: name,
              imageUri: imageMatch ? imageMatch[1] : '',
              info: levelEffects ? JSON.stringify(levelEffects.concat()) : '',
            };

            if (isClassMatch) {
              res['classYn'] = isClassMatch[1] === '직업' ? 'Y' : 'N';
            }
            if (classMatch) {
              res['className'] = classMatch[1].replace(' 전용', '');
            }

            return res;
          },
        );

        character.engraving = _.values(
          _.merge(
            _.keyBy(character.stats.engraving, 'name'),
            _.keyBy(engravingInfo, 'name'),
          ),
        );

        return character;
      });
    // 1. 캐릭터 기본 정보
    const character = await this.prisma.character.upsert({
      where: {
        name: name,
      },
      create: {
        name: name,
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
    await this.prisma.$transaction(
      dt.gemList.map((x) =>
        this.prisma.skill.upsert({
          where: {
            name_class: {
              name: x.skill,
              class: character.class,
            },
          },
          create: {
            name: x.skill,
            class: x.class,
            image_uri: x.SkillIcon,
          },
          update: {
            image_uri: x.SkillIcon,
          },
        }),
      ),
    );
    dt.skillList.map(async (skillInfo) => {
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
      });
    });

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
      const skillId = skillList
        ? skillList.find((y) => y.skill === x.skill).skillId
        : 0;

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
        },
        update: {
          item_id: gem.id,
          level: x.level,
          skill_id: x.skillId,
          rate: x.rate,
          effect_type: x.effectType,
          direction: x.direction,
          use_yn: 'Y',
        },
      });
    });

    // 4. 장비
    await this.prisma.character_gear.updateMany({
      where: {
        character_id: character.id,
      },
      data: {
        use_yn: 'N',
      },
    });
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
        },
        update: {
          image_uri: x.imageUri,
          tier: x.tier,
          set_name: x.setName,
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
    });

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
      let update = {};
      if (x.classYn) {
        update['class_yn'] = x.classYn;
      }
      let create = {
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
