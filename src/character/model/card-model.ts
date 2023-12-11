import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CardModel {
  @Field(() => Int, { nullable: false, description: '장착 슬롯' })
  Slot: number;

  @Field(() => String, { nullable: false, description: '카드 이름' })
  Name: string;

  @Field(() => String, { nullable: false, description: '아이콘' })
  Icon: string;

  @Field(() => Int, { nullable: false, description: '카드 강화' })
  AwakeCount: number;

  @Field(() => Int, { nullable: false, description: '최대 카드 강화' })
  AwakeTotal: number;

  @Field(() => String, { nullable: false, description: '등급 [일반, 전설 등]' })
  Grade: string;

  @Field(() => String, { nullable: false, description: '툴팁' })
  Tooltip: string;
}
