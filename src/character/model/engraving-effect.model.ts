import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EngravingEffectModel {
  @Field(() => String, { nullable: false, description: '아이콘' })
  Icon: string;

  @Field(() => String, { nullable: false, description: '각인 이름' })
  Name: string;

  @Field(() => String, { nullable: false, description: '설명' })
  Description: string;
}
