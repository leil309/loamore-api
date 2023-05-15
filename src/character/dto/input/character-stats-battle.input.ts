import {Field, InputType} from "@nestjs/graphql";

@InputType()
export class CharacterStatsBattleInput {
  @Field(() => Number, { nullable: false })
  critical: number;

  @Field(() => Number, { nullable: false })
  specialization: number;

  @Field(() => Number, { nullable: false })
  domination: number;

  @Field(() => Number, { nullable: false })
  swiftness: number;

  @Field(() => Number, { nullable: false })
  endurance: number;

  @Field(() => Number, { nullable: false })
  expertise: number;
}
