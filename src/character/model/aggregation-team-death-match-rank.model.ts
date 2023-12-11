import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AggregationTeamDeathMatchRankModel {
  @Field(() => Int, { nullable: false, description: '' })
  Rank: number;

  @Field(() => String, { nullable: false, description: '' })
  RankName: string;

  @Field(() => String, { nullable: false, description: '' })
  RankIcon: string;

  @Field(() => Int, { nullable: false, description: '' })
  RankLastMmr: number;

  @Field(() => Int, { nullable: false, description: '' })
  PlayCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  VictoryCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  LoseCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  TieCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  KillCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  AceCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  DeathCount: number;
}
