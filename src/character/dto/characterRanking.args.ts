import { ArgsType, Field, Int } from '@nestjs/graphql';
import { GraphQLBigInt } from 'graphql-scalars';

@ArgsType()
export class FindCursorCharacterRankingArgs {
  @Field(() => GraphQLBigInt, { nullable: true })
  cursor?: bigint | number;

  @Field(() => Int, { nullable: true })
  take?: number;

  @Field(() => [String], { nullable: true })
  className?: Array<string>;

  @Field(() => [GraphQLBigInt], { nullable: true })
  engravingIds?: Array<bigint>;
}
