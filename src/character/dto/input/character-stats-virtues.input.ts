import {Field, InputType} from "@nestjs/graphql";

@InputType()
export class CharacterStatsVirtuesInput {
  @Field(() => Number, { nullable: false })
  wisdom: number;
  @Field(() => Number, { nullable: false })
  courage: number;
  @Field(() => Number, { nullable: false })
  charisma: number;
  @Field(() => Number, { nullable: false })
  kindness: number;
}
