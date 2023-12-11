import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SkillRuneModel {
  @Field(() => String, { nullable: false, description: '' })
  Name: string;

  @Field(() => String, { nullable: false, description: '' })
  Icon: string;

  @Field(() => String, { nullable: false, description: '' })
  Grade: string;

  @Field(() => String, { nullable: false, description: '' })
  Tooltip: string;
}
