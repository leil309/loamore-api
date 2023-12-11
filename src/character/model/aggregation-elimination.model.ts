import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AggregationEliminationModel {
  @Field(() => Int, { nullable: false, description: '' })
  FirstWinCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  SecondWinCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  ThirdWinCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  FirstPlayCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  SecondPlayCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  ThirdPlayCount: number;

  @Field(() => Int, { nullable: false, description: '' })
  AllKillCount: number;

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
