import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SkillTripodModel {
  @Field(() => Int, { nullable: false, description: '' })
  Tier: number;

  @Field(() => Int, { nullable: false, description: '' })
  Slot: number;

  @Field(() => String, { nullable: false, description: '' })
  Name: string;

  @Field(() => String, { nullable: false, description: '' })
  Icon: string;

  @Field(() => Int, { nullable: false, description: '' })
  Level: number;

  @Field(() => Boolean, { nullable: false, description: '' })
  IsSelected: boolean;

  @Field(() => String, { nullable: false, description: '' })
  Tooltip: string;
}
