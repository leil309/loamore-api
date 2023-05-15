import {Field, InputType} from "@nestjs/graphql";
import {Type} from "class-transformer";
import {GraphQLBigInt} from "graphql-scalars";
import {CharacterEngravingEngravingInput} from "./input/character-engraving-engraving.input";

@InputType()
export class CharacterEngravingInput {
  @Field(() => GraphQLBigInt, { nullable: false })
  id: number;

  @Field(() => Number, { nullable: false })
  level: number;

  @Field(() => Number, { nullable: false })
  slot: number;

  @Field(() => CharacterEngravingEngravingInput, { nullable: false })
  @Type(() => CharacterEngravingEngravingInput)
  engraving: CharacterEngravingEngravingInput;
}
