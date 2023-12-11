import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GemEffectModel {
  @Field(() => Int, { nullable: false, description: '장착 슬롯' })
  GemSlot: number;

  @Field(() => String, { nullable: false, description: '카드 이름' })
  Name: string;

  @Field(() => String, { nullable: false, description: '설명' })
  Description: string;

  @Field(() => String, { nullable: false, description: '아이콘' })
  Icon: string;

  @Field(() => String, { nullable: false, description: '툴팁' })
  Tooltip: string;
}
