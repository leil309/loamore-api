import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StatsOutput } from 'src/character/dto/stats.output';
import { StatsModel } from 'src/character/model/stats.model';
import { TendenciesModel } from 'src/character/model/tendencies.model';

@ObjectType()
export class ArmoryProfileModel {
  @Field(() => String, { nullable: true, description: '캐릭터 이미지' })
  CharacterImage: string;

  @Field(() => Int, { nullable: false, description: '원정대 레벨' })
  ExpeditionLevel: number;

  @Field(() => String, { nullable: true, description: 'PVP 등급명' })
  PvpGradeName: string;

  @Field(() => Int, { nullable: true, description: '영지 레벨' })
  TownLevel: number;

  @Field(() => String, { nullable: false, description: '영지 이름' })
  TownName: string;

  @Field(() => String, { nullable: true, description: '칭호' })
  Title: string;

  @Field(() => String, { nullable: true, description: '길드내 등급' })
  GuildMemberGrade: string;

  @Field(() => String, { nullable: true, description: '길드명' })
  GuildName: string;

  @Field(() => String, { nullable: true, description: '사용 스킬 포인트' })
  UsingSkillPoint: string;

  @Field(() => String, { nullable: true, description: '총 스킬 포인트' })
  TotalSkillPoint: string;

  @Field(() => [StatsModel], { nullable: true })
  Stats: Array<StatsModel>;

  @Field(() => [TendenciesModel], { nullable: false })
  Tendencies: Array<TendenciesModel>;

  @Field(() => String, { nullable: false })
  ServerName: string;

  @Field(() => String, { nullable: false })
  CharacterName: string;

  @Field(() => Int, { nullable: false })
  CharacterLevel: number;

  @Field(() => String, { nullable: false })
  CharacterClassName: string;

  @Field(() => String, { nullable: false })
  ItemAvgLevel: string;

  @Field(() => String, { nullable: false })
  ItemMaxLevel: string;
}
