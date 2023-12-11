import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GemModel {
  @Field(() => Int, { nullable: false, description: '장착 슬롯' })
  Slot: number;

  @Field(() => String, { nullable: false, description: '카드 이름' })
  Name: string;

  @Field(() => String, { nullable: false, description: '아이콘' })
  Icon: string;

  @Field(() => Int, { nullable: false, description: '보석 레벨' })
  Level: number;

  @Field(() => String, { nullable: false, description: '등급' })
  Grade: string;

  @Field(() => String, { nullable: false, description: '툴팁' })
  Tooltip: string;
}
