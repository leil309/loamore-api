import {Field, InputType} from "@nestjs/graphql";
import {GraphQLBigInt} from "graphql-scalars";

@InputType()
export class CharacterGemInput {
  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => String, { nullable: false })
  imageUri: string;

  @Field(() => Number, { nullable: false })
  slot: number;

  @Field(() => Number, { nullable: false })
  level: number;

  @Field(() => Number, { nullable: false })
  tier: number;

  @Field(() => String, { nullable: false })
  class: string;

  @Field(() => String, { nullable: false })
  skill: string;

  @Field(() => Number, { nullable: false })
  rate: number;

  @Field(() => String, { nullable: false })
  effectType: string;

  @Field(() => String, { nullable: false })
  direction: string;

  @Field(() => String, { nullable: false })
  skillIcon?: string | undefined | null;

}
