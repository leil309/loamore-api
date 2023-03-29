import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as cheerio from 'cheerio';
import { ApolloError } from 'apollo-server-express';
import * as https from 'https';
import axios from 'axios';
import { gem } from '../@generated/gem/gem.model';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  async findCharacter(name: string) {
    return this.prisma.character.findFirst({
      include: {
        character_accessory: true,
        character_gear: true,
        character_gem: {
          include: {
            gem: true,
          },
        },
      },
      where: {
        name: name,
      },
    });
  }

  async upsert(name: string) {
    const isCharacter = await this.prisma.character.count({
      where: {
        name: name,
      },
    });

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
          stats: {
            basic: undefined,
            battle: undefined,
            virtues: undefined,
            engraving: undefined,
          },
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

        character.gemList = Object.entries(scriptJson.Equip)
          .filter((obj) => obj[0].match('Gem'))
          .map((obj: any, index: number) => {
            const regex =
              /\[([^\]]+)\] ([^0-9]+) (재사용 대기시간|피해) ([0-9.]+)% (감소|증가)/g;
            const data: string = JSON.stringify(obj[1]).replace(reg, '');
            const gemInfo = regex.exec(
              obj[1].Element_004.value.Element_001.replace(reg, ''),
            );

            const levelRegex = /(\d+)레벨/;
            const imageUriRegex = /"iconPath":"(.*?)"/;

            const levelMatch = levelRegex.exec(data);
            const imageMatch = imageUriRegex.exec(data);

            let gem: IGem = {
              name: obj[1].Element_000.value.replace(reg, ''),
              imageUri: imageMatch ? imageMatch[1] : '',
              slot: index,
              level: levelMatch ? parseInt(levelMatch[1]) : 0,
              tier: parseInt(
                JSON.stringify(obj[1].Element_001.value).match(
                  /아이템 티어 (\d+)/,
                )[1],
              ),
              class: gemInfo[1].trim(),
              skill: gemInfo[2].trim(),
              effectType: gemInfo[3].trim(),
              rate: parseFloat(gemInfo[4]),
              direction: gemInfo[5].trim(),
            };
            return gem;
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

            const itemNameRegex = /"type":"NameTagBox","value":"([^"]+)"/;
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
              name: data.match(itemNameRegex)[1],
              imageUri: imageMatch ? imageMatch[1] : '',
              slot: index,
              quality: parseInt(data.match(qualityRegex)[1]),
              level: parseInt(data.match(itemLevelRegex)[1]),
              tier: parseInt(data.match(itemTierRegex)[1]),
              setName: setName,
              setEffect: setEffect,
              baseEffect: baseEffectRegex
                .exec(data)[1]
                .split(/(?<=\d)(?=[가-힣])/),
              additionalEffect: additionalEffectRegex
                .exec(data)[1]
                .split(/(?<=\d)(?=[가-힣])/),
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
        engraving: JSON.stringify(dt.stats.engraving),
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
        engraving: JSON.stringify(dt.stats.engraving),
        image_uri: dt.imageUri,
        upd_date: new Date(),
      },
    });

    // 2. 보석
    const characterGemList = await this.prisma.character_gem.findMany({
      where: {
        character_id: character.id,
      },
    });
    const gemList = await this.prisma.gem.findMany({
      where: {
        id: { in: characterGemList.map((x) => x.gem_id) },
      },
    });
    dt.gemList.map(async (x) => {
      const gem = await this.prisma.gem.upsert({
        where: {
          name_skill: {
            name: x.name,
            skill: x.skill,
          },
        },
        create: {
          name: x.name,
          image_uri: x.imageUri,
          skill: x.skill,
          level: x.level,
          tier: x.tier,
          class: x.class,
          rate: x.rate,
          effect_type: x.effectType,
          direction: x.direction,
        },
        update: {
          name: x.name,
          image_uri: x.imageUri,
          skill: x.skill,
          level: x.level,
          tier: x.tier,
          class: x.class,
          rate: x.rate,
          effect_type: x.effectType,
          direction: x.direction,
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
          gem_id: gem.id,
          slot: x.slot,
        },
        update: {
          gem_id: gem.id,
        },
      });
    });

    // 3. 장비
    dt.gearList.map(async (x) => {
      await this.prisma.character_gear.upsert({
        where: {
          character_id_slot: {
            character_id: character.id,
            slot: x.slot,
          },
        },
        create: {
          character_id: character.id,
          slot: x.slot,
          name: x.name,
          image_uri: x.imageUri,
          tier: x.tier,
          quality: x.quality,
          set_name: x.setName,
          base_effect: JSON.stringify(x.baseEffect),
          additional_effect: JSON.stringify(x.additionalEffect),
        },
        update: {
          name: x.name,
          image_uri: x.imageUri,
          tier: x.tier,
          quality: x.quality,
          set_name: x.setName,
          base_effect: JSON.stringify(x.baseEffect),
          additional_effect: JSON.stringify(x.additionalEffect),
        },
      });
    });

    // 4.악세사리
    dt.accessoryList.map(async (x) => {
      await this.prisma.character_accessory.upsert({
        where: {
          character_id_slot: {
            character_id: character.id,
            slot: x.slot,
          },
        },
        create: {
          character_id: character.id,
          slot: x.slot,
          name: x.name,
          image_uri: x.imageUri,
          tier: x.tier,
          quality: x.quality,
          base_effect: JSON.stringify(x.baseEffect),
          additional_effect: JSON.stringify(x.additionalEffect),
          engraving: JSON.stringify(x.engraving),
          bracelet_effect: JSON.stringify(x.braceletEffect),
        },
        update: {
          name: x.name,
          image_uri: x.imageUri,
          tier: x.tier,
          quality: x.quality,
          base_effect: JSON.stringify(x.baseEffect),
          additional_effect: JSON.stringify(x.additionalEffect),
          engraving: JSON.stringify(x.engraving),
          bracelet_effect: JSON.stringify(x.braceletEffect),
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
      '#profile-ability > div.profile-ability-engrave > div > div.swiper-wrapper',
    )
      .text()
      .replace(/\t/gi, '')
      .replace(/\n/gi, '')
      .replace(/\\n/gi, '')
      .replace(/\\t/gi, '')
      .replace(/;/gi, '');
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
