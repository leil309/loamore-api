import { Field, ObjectType } from '@nestjs/graphql';
import { CardModel } from 'src/character/model/card-model';
import { CardEffectModel } from 'src/character/model/card-effect.model';

@ObjectType()
export class ArmoryCardModel {
  @Field(() => [CardModel], { nullable: false, description: '장착 슬롯' })
  Cards: Array<CardModel>;

  @Field(() => [CardEffectModel], { nullable: false, description: '장착 슬롯' })
  Effects: Array<CardEffectModel>;
}
