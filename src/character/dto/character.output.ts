import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLBigInt, GraphQLDateTime } from 'graphql-scalars';
@ObjectType()
export class CharacterRankOutput {
  @Field(() => GraphQLBigInt, { nullable: false })
  id!: bigint;

  @Field(() => String, { nullable: false })
  name!: string;

  @Field(() => String, { nullable: false })
  class!: string;

  @Field(() => Float, { nullable: false })
  itemLevel!: number;

  @Field(() => String, { nullable: true })
  guildName!: string | null;

  @Field(() => String, { nullable: false })
  serverName!: string;

  @Field(() => String, { nullable: false })
  imageUri!: string;

  @Field(() => [String], { nullable: true })
  setItem?: Array<string>;

  @Field(() => [String], { nullable: true })
  classEngraving?: Array<string>;

  @Field(() => GraphQLDateTime, { nullable: false })
  insDate!: Date;

  @Field(() => GraphQLDateTime, { nullable: false })
  updDate!: Date;
}
