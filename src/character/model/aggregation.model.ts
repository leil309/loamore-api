import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AggregationModel {
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
