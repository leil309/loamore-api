import {Field, InputType} from "@nestjs/graphql";

@InputType()
export class CharacterStatsEngravingInput {
  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => Number, { nullable: false })
  level: number;
}
