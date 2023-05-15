import {ArgsType, Field, Float, Int} from "@nestjs/graphql";
import {GraphQLBigInt} from "graphql-scalars";
import {CharacterStatsInput} from "./character-stats.input";
import {Type} from "class-transformer";
import {CharacterEngravingInput} from "./character-engraving.input";
import {CharacterGemInput} from "./character-gem-input";

@ArgsType()
export class CharacterArgs {
  @Field(() => String, { nullable: true })
  class: string;

  @Field(() => String, { nullable: false })
  userName!: string;

  @Field(() => Number, { nullable: true })
  level: number;

  @Field(() => Float, { nullable: true })
  itemLevel: number;

  @Field(() => String, { nullable: true })
  guildName?: string | null | undefined;

  @Field(() => String, { nullable: true })
  serverName: string;

  @Field(() => CharacterStatsInput, { nullable: true })
  @Type(() => CharacterStatsInput)
  stats: CharacterStatsInput

  @Field(() => String, { nullable: true })
  imageUri: string;

  @Field(() => [CharacterEngravingInput], { nullable: true })
  @Type(() => CharacterEngravingInput)
  engraving: Array<CharacterEngravingInput>;

  @Field(() => [CharacterGemInput], { nullable: true })
  @Type(() => CharacterGemInput)
  gemList: Array<CharacterGemInput>;

  // @Field(() => [CharacterGearInput], { nullable: true })
  // @Type(() => CharacterGearInput)
  // gearList: Array<CharacterGearInput>;
  //
  // @Field(() => GraphQLBigInt, { nullable: true })
  // accessoryList: Array<IAccessory>;
  //
  // @Field(() => GraphQLBigInt, { nullable: true })
  // skillList: Array<ISkill>;
  //
  // @Field(() => GraphQLBigInt, { nullable: true })
  // skillAdditionalInfo: Array<ISkillAdd>;
  //
  // @Field(() => GraphQLBigInt, { nullable: true })
  // avatarList: Array<any>;
  //
  // @Field(() => GraphQLBigInt, { nullable: true })
  // cardList: Array<any>;
  //
  // @Field(() => GraphQLBigInt, { nullable: true })
  // elixir: Array<any>;
  //
  // @Field(() => GraphQLBigInt, { nullable: true })
  // ownUserName: Array<any>;
}
