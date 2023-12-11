import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArmoryAvatarModel {
  @Field(() => String, { nullable: false, description: '' })
  Type: string;

  @Field(() => String, { nullable: false, description: '' })
  Name: string;

  @Field(() => String, { nullable: false, description: '' })
  Icon: string;

  @Field(() => String, { nullable: false, description: '' })
  Grade: string;

  @Field(() => Boolean, { nullable: false, description: '' })
  IsSet: boolean;

  @Field(() => Boolean, { nullable: false, description: '' })
  IsInner: boolean;

  @Field(() => String, { nullable: false, description: '' })
  Tooltip: string;
}
