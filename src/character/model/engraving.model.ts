import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EngravingModel {
  @Field(() => Int, { nullable: false, description: '' })
  Slot: number;

  @Field(() => String, { nullable: false, description: '' })
  Name: string;

  @Field(() => String, { nullable: false, description: '' })
  Icon: string;

  @Field(() => String, { nullable: false, description: '' })
  Tooltip: string;
}
