import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as cheerio from 'cheerio';
import { ApolloError } from 'apollo-server-express';
import * as https from 'https';
import axios from 'axios';

interface IScript {
  Card: any;
  CardSet: any;
  Engrave: any;
  Equip: any;
  GemSkillEffect: any;
  Skill: any;
}

interface IGem {
  name: string;
  tier: number;
  skill: string;
  job: string;
  rate: number;
  effectType: string;
  direction: string;
}
interface IGear {
  name: string;
  tier: number;
  level: number;
  quality: number;
  baseEffect: Array<string>;
  additionalEffect: Array<string>;
}

interface IAccessory {
  name: string;
  imageUri: string;
  tier: number;
  quality: number;
  baseEffect: Array<string>;
  additionalEffect: Array<string>;
  braceletEffect: Array<string>;
  engraving: Array<any>;
}

@Injectable()
export class ContentsService {
  constructor(private prisma: PrismaService) {}

  async getTestTableData(name: String) {
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
        let json: any = {};

        // 닉네임
        json.userName = $('.profile-character-info__name').text();

        if (!json.userName) {
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

        const gemList = Object.entries(scriptJson.Equip)
          .filter((obj) => obj[0].match('Gem'))
          .map((obj: any) => {
            const regex =
              /\[([^\]]+)\] ([^0-9]+) (재사용 대기시간|피해) ([0-9.]+)% (감소|증가)/g;
            const gemInfo = regex.exec(
              obj[1].Element_004.value.Element_001.replace(reg, ''),
            );

            let gem: IGem = {
              name: obj[1].Element_000.value.replace(reg, ''),
              tier: parseInt(
                JSON.stringify(obj[1].Element_001.value).match(
                  /아이템 티어 (\d+)/,
                )[1],
              ),
              job: gemInfo[1].trim(),
              skill: gemInfo[2].trim(),
              effectType: gemInfo[3].trim(),
              rate: parseFloat(gemInfo[4]),
              direction: gemInfo[5].trim(),
            };
            return gem;
          });

        const gearList = Object.entries(scriptJson.Equip)
          .filter((obj) => !obj[0].match('Gem'))
          .filter((obj) => {
            const num = parseInt(obj[0].split('_')[1]);
            return [0, 1, 2, 3, 4, 5].includes(num);
          })
          .map((obj: any) => {
            const data: string = JSON.stringify(obj[1]).replace(reg, '');
            // const setEffect = data.Element_009.value.Element_000.topStr

            const itemNameRegex = /"type":"NameTagBox","value":"([^"]+)"/;
            const itemLevelRegex = /"leftStr2":"아이템 레벨 (\d+)/;
            const itemTierRegex = /\(티어 ([\d]+)\)/;
            const qualityRegex = /"qualityValue":(\d+)/;
            const baseEffectRegex = /"기본 효과","[^"]+":"([^"]+)"/;
            const additionalEffectRegex = /"추가 효과","[^"]+":"([^"]+)"/;

            let gear: IGear = {
              name: data.match(itemNameRegex)[1],
              quality: parseInt(data.match(qualityRegex)[1]),
              level: parseInt(data.match(itemLevelRegex)[1]),
              tier: parseInt(data.match(itemTierRegex)[1]),
              baseEffect: baseEffectRegex
                .exec(data)[1]
                .split(/(?<=\d)(?=[가-힣])/),
              additionalEffect: additionalEffectRegex
                .exec(data)[1]
                .split(/(?<=\d)(?=[가-힣])/),
            };
            return gear;
          });

        const accessoryList = Object.entries(scriptJson.Equip)
          .filter((obj) => !obj[0].match('Gem'))
          .filter((obj) => {
            const num = parseInt(obj[0].split('_')[1]);
            return [6, 7, 8, 9, 10, 11, 26].includes(num);
          })
          .map((obj) => {
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
              const specialAbilities = braceletMatch[1]
                .match(specialAbilitiesRegex)
                .map((ability) => ability.slice(0, -1));
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
        json.level = $('.profile-character-info__lv').text();
        // 템렙
        $('.level-info2__item > span').each(function (index, item) {
          if (index === 1) json.itemLevel = $(this).text();
        });

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
        json.own_userName = temp;
        return json;
      });

    return '';
  }
}
