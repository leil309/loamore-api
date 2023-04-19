import { ArgsType, Field, Int } from '@nestjs/graphql';
import { GraphQLBigInt } from 'graphql-scalars';

@ArgsType()
export class FindCursorCharacterRankingArgs {
  @Field(() => GraphQLBigInt, { nullable: true })
  cursor?: bigint | number;

  @Field(() => Int, { nullable: true })
  take?: number;
}
