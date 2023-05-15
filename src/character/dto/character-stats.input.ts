import {Field, InputType, ObjectType} from "@nestjs/graphql";
import {Type} from "class-transformer";
import {CharacterStatsBasicInput} from "./input/character-stats-basic.input";
import {CharacterStatsBattleInput} from "./input/character-stats-battle.input";
import {CharacterStatsVirtuesInput} from "./input/character-stats-virtues.input";
import {CharacterStatsEngravingInput} from "./input/character-stats-engraving.input";

@InputType()
export class CharacterStatsInput {
  @Field(() => CharacterStatsBasicInput, { nullable: false })
  @Type(() => CharacterStatsBasicInput)
  basic: CharacterStatsBasicInput;

  @Field(() => CharacterStatsBattleInput, { nullable: false })
  @Type(() => CharacterStatsBattleInput)
  battle: CharacterStatsBattleInput;

  @Field(() => CharacterStatsVirtuesInput, { nullable: false })
  @Type(() => CharacterStatsVirtuesInput)
  virtues: CharacterStatsVirtuesInput;

  @Field(() => [CharacterStatsEngravingInput], { nullable: true })
  @Type(() => CharacterStatsEngravingInput)
  engraving?: Array<CharacterStatsEngravingInput> | Array<null> | null | undefined;
}
