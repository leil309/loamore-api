import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EffectModel {
  @Field(() => String, { nullable: false, description: '카드 이름' })
  Name: string;

  @Field(() => String, { nullable: false, description: '아이콘' })
  Description: string;
}
