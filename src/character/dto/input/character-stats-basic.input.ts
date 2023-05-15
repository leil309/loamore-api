import {Field, InputType} from "@nestjs/graphql";

@InputType()
export class CharacterStatsBasicInput {
  @Field(() => Number, { nullable: false })
  attack_power: number;

  @Field(() => Number, { nullable: false })
  max_health: number;
}
