import { Field, Int, ObjectType } from '@nestjs/graphql';
import { EffectModel } from 'src/character/model/effect.model';

@ObjectType()
export class CardEffectModel {
  @Field(() => Int, { nullable: false, description: '카드 이름' })
  Index: number;

  @Field(() => [Int], { nullable: false, description: '카드 이름' })
  CardSlots: Array<number>;

  @Field(() => [EffectModel], { nullable: false, description: '카드 이름' })
  Items: Array<EffectModel>;
}
