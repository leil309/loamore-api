import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ICharacter, IGear, IStats, ITendencies } from '../common/interface';
import { class_yn } from '../@generated/prisma/class-yn.enum';
import { SortOrder } from '../@generated/prisma/sort-order.enum';
import { CharacterRankOutput } from './dto/characterRanking.output';
import { FindCursorCharacterRankingArgs } from './dto/characterRanking.args';
import { use_yn } from '../@generated/prisma/use-yn.enum';
import axios from 'axios';
import * as process from 'process';
import { ArmoryProfileModel } from 'src/character/model/armory-profile.model';
import { StatsNameToType, TendenciesNameToType } from 'src/common/utils';
import { CharacterArmoriesOutput } from 'src/character/dto/character-armories.output';

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
    const character = await this.prisma.character.findFirst({
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
    return {
      data: character,
    };
  }

  async update(characterName: string) {
    const character = await this.prisma.character.findFirst({
      where: {
        name: characterName,
      },
    });

    if (
      character &&
      (new Date().getTime() - character.upd_date.getTime()) / 1000 / 60 < 1
    ) {
      return character;
    }

    const regTags = /<[^>]*>?/g;
    const regSpaces = /\r\n/g;
    const characterArmories: CharacterArmoriesOutput = await axios
      .get(
        `${process.env.LOSTARK_API_URL}/armories/characters/${characterName}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: process.env.LOSTARK_API_JWT,
          },
        },
      )
      .then((res) => res.data);

    // 1. 캐릭터 프로필 업뎃
    const statsList: IStats = this.getStatList(
      characterArmories.ArmoryProfile.Stats,
      (x) => StatsNameToType(x['Type']),
      (x) => parseInt(x['Value']),
    );
    const tendenciesList: ITendencies = this.getStatList(
      characterArmories.ArmoryProfile.Tendencies,
      (x) => TendenciesNameToType(x['Type']),
      (x) => x['Point'],
    );
    await this.getProfileUpsert(
      characterName,
      characterArmories.ArmoryProfile,
      statsList,
      tendenciesList,
    );

    // 2. 캐릭터 장비 업뎃
    const gearList = this.getGearList(characterArmories, regTags, regSpaces);
    await this.setCharacterGear(character.id, gearList);

    return await this.prisma.character.findFirst({
      where: {
        name: characterName,
      },
    });
  }

  private getGearList(
    characterArmories: CharacterArmoriesOutput,
    regTags: RegExp,
    regSpaces: RegExp,
  ) {
    return characterArmories.ArmoryEquipment.filter((ft) =>
      ['무기', '투구', '상의', '하의', '장갑', '어깨'].includes(ft.Type),
    ).map((x, index) => {
      const data = x.Tooltip.replace(regTags, '')
        .replace(regSpaces, '')
        .replace(/\s\s/g, '');

      const nameMatch = x.Name.replace(/\+\d+/, '').trim();
      const honingMatch = x.Name.match(/\d+/);
      const levelMatch = data.match(/"leftStr2": "아이템 레벨 (\d+)/);
      const qualityMatch = data.match(/"qualityValue": (\d+)/);
      const tierMatch = data.match(/\(티어 (\d+)\)/);
      const setNameMatch = data.match(
        /"SetItemGroup","value": {"firstMsg": "([가-힣\s]+)"/,
      );
      const gradeMatch = data.match(/"iconGrade": (\d)/);

      const gear: IGear = {
        name: nameMatch,
        honing: honingMatch ? parseInt(honingMatch[0]) : 0,
        imageUri: x.Icon.replace('https://cdn-lostark.game.onstove.com/', ''),
        slot: index,
        quality: qualityMatch ? parseInt(qualityMatch[1]) : -1,
        level: levelMatch ? parseInt(levelMatch[1]) : -1,
        tier: tierMatch ? parseInt(tierMatch[1]) : -1,
        setName: setNameMatch ? setNameMatch[1] : '',
        setEffect: [''], //테이블 변경해야함
        baseEffect: [], //
        additionalEffect: [], //
        grade: gradeMatch ? parseInt(gradeMatch[1]) : 0,
      };

      return gear;
    });
  }

  private getStatList(
    arr: any[],
    keyExtractor: (x: any) => string,
    valueExtractor: (x: any) => any,
  ): any {
    if (arr) {
      const obj = {};
      for (const item of arr) {
        obj[keyExtractor(item)] = valueExtractor(item);
      }
      return obj;
    }
    return null;
  }

  private async setCharacterGear(id: bigint, gearList: IGear[]) {
    await this.prisma.character_gear.updateMany({
      where: {
        character_id: id,
      },
      data: {
        use_yn: 'N',
      },
    });
    await Promise.all(
      gearList.map(async (x) => {
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
              character_id: id,
              slot: x.slot,
            },
          },
          create: {
            item_id: gear.id,
            character_id: id,
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
  }

  private async getProfileUpsert(
    characterName: string,
    characterProfile: ArmoryProfileModel,
    statsList: IStats,
    tendenciesList: ITendencies,
  ) {
    return await this.prisma.character.upsert({
      where: {
        name: characterName,
      },
      create: {
        name: characterProfile.CharacterName,
        class: characterProfile.CharacterClassName,
        level: characterProfile.CharacterLevel,
        item_level: parseFloat(characterProfile.ItemAvgLevel.replace(',', '')),
        guild_name: characterProfile.GuildName,
        server_name: characterProfile.ServerName,
        image_uri: characterProfile.CharacterImage,
        ...statsList,
        ...tendenciesList,
        ins_date: new Date(),
        upd_date: new Date(),
      },
      update: {
        level: characterProfile.CharacterLevel,
        item_level: parseFloat(characterProfile.ItemAvgLevel.replace(',', '')),
        guild_name: characterProfile.GuildName,
        ...statsList,
        ...tendenciesList,
        image_uri: characterProfile.CharacterImage,
        upd_date: new Date(),
      },
    });
  }

  async upsertCharacter(dt: ICharacter) {
    const c = await this.prisma.character.findUnique({
      where: {
        name: dt.userName,
      },
    });

    if (c) {
      const min = (new Date().getTime() - c.upd_date.getTime()) / 1000 / 60;
      if (min <= 5) {
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

    const characterClass = await this.prisma.classJob.findFirst({
      where: {
        name: dt.class,
      },
    });
    if (characterClass === null) {
      await this.prisma.classJob.upsert({
        where: {
          name: dt.class,
        },
        create: {
          name: dt.class,
        },
        update: {
          name: dt.class,
        },
      });
    }

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
            image_uri: x.skillIcon,
          },
          update: {
            image_uri: x.skillIcon,
          },
        }),
      ),
    );

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
    const noneClassEngId = classEngraving.map((x) => x.id);

    const noneEngAnd: any[] =
      noneClassEngId && noneClassEngId.length > 0
        ? noneClassEngId.map((x) => {
            return {
              character_engraving: { none: { engraving_id: x } },
            };
          })
        : [];

    const someEngAnd: any[] =
      classEngravingId && classEngravingId.length > 0
        ? classEngravingId.map((x) => {
            return {
              character_engraving: { some: { engraving_id: x } },
            };
          })
        : [];

    const engAnd = {
      AND: noneEngAnd.concat(someEngAnd),
    };

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
    const noneClassEngId = classEngraving.map((x) => x.id);

    const noneEngAnd: any[] =
      noneClassEngId && noneClassEngId.length > 0
        ? noneClassEngId.map((x) => {
            return {
              character_engraving: { none: { engraving_id: x } },
            };
          })
        : [];

    const someEngAnd: any[] =
      classEngravingId && classEngravingId.length > 0
        ? classEngravingId.map((x) => {
            return {
              character_engraving: { some: { engraving_id: x } },
            };
          })
        : [];

    const engAnd = {
      AND: noneEngAnd.concat(someEngAnd),
    };

    const topRanker = await this.prisma.character.findMany({
      where: {
        ...engAnd,
        class: myCharacter.class,
      },
      select: {
        name: true,
        specialization: true,
        swiftness: true,
        critical: true,
        endurance: true,
        domination: true,
        expertise: true,
      },
      orderBy: [{ item_level: SortOrder.desc }],
      take: 100,
    });

    const ave = topRanker.map((x) => {
      const battleStats = [
        { value: x.critical, name: '치명' },
        { value: x.specialization, name: '특화' },
        { value: x.domination, name: '제압' },
        { value: x.swiftness, name: '신속' },
        { value: x.endurance, name: '인내' },
        { value: x.expertise, name: '숙련' },
      ];

      const mainStats = battleStats
        .filter((x) => x.value >= 150)
        .sort((a, b) => {
          return b.value - a.value;
        });

      const name = mainStats.map((y) => y.name).join('');
      const values = mainStats.map((y) => {
        return {
          name: y.name,
          value: y.value,
        };
      });
      return {
        name,
        values,
      };
    });

    // 이름별 사용 횟수를 저장할 객체
    const nameCount = {};

    // 가장 많이 사용되는 이름 찾기
    ave.forEach((item) => {
      const name = item.name;
      nameCount[name] = (nameCount[name] || 0) + 1;
    });

    // 가장 많이 사용된 이름 찾기
    let mostUsedName = '';
    let maxCount = 0;
    Object.entries(nameCount).forEach(([name, count]) => {
      if (count > maxCount) {
        mostUsedName = name;
        if (typeof count === 'number') {
          maxCount = count;
        }
      }
    });

    // 가장 많이 사용된 이름을 제외한 배열 필터링
    const filteredAve = ave.filter((item) => item.name === mostUsedName);

    const result = [];
    const resultMap = {};

    filteredAve.forEach((item) => {
      const name = item.name;
      const stats = item.values;

      if (!resultMap[name]) {
        resultMap[name] = { name, stats: [] };
        result.push(resultMap[name]);
      }

      stats.forEach((value) => {
        const valueName = value.name;
        const valueNumber = value.value;

        const existingValue = resultMap[name].stats.find(
          (v) => v.name === valueName,
        );

        if (existingValue) {
          existingValue.value = (existingValue.value + valueNumber) / 2;
        } else {
          resultMap[name].stats.push({ name: valueName, value: valueNumber });
        }
      });
    });

    return result;
  }

  async findAverageWeapon(name: string) {
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
    const topRanker = await this.prisma.character.findMany({
      where: {
        class: myCharacter.class,
        AND: {
          character_gear: {
            none: {
              item: {
                grade: {
                  equals: 7,
                },
              },
            },
          },
        },
      },
      select: {
        name: true,
        character_gear: true,
      },
      orderBy: [{ item_level: SortOrder.desc }],
      take: 100,
    });

    return (
      Number(
        topRanker
          ?.map((x) => x.character_gear[0].quality)
          ?.reduce((acc, cur) => acc + cur) / topRanker.length,
      )?.toFixed(0) || 0
    );
  }

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
