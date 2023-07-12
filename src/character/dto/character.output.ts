import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLBigInt } from 'graphql-scalars';
import { character } from '../../@generated/character/character.model';

@ObjectType()
export class CharacterOutput {
  @Field(() => character, { nullable: true })
  data: character;
}
