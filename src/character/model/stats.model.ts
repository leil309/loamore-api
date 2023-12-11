import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StatsModel {
  @Field(() => String, { nullable: false })
  Type!: string;

  @Field(() => String, { nullable: false })
  Value!: string;

  @Field(() => [String], { nullable: false })
  Tooltip!: Array<string>;
}
