import { Field, ObjectType } from '@nestjs/graphql';
import { GemModel } from 'src/character/model/gem.model';
import { GemEffectModel } from 'src/character/model/gem-effect.model';

@ObjectType()
export class ArmoryGemModel {
  @Field(() => [GemModel], { nullable: false, description: '보석' })
  Gems: Array<GemModel>;

  @Field(() => [GemEffectModel], { nullable: false, description: '보석 효과' })
  Effects: Array<GemEffectModel>;
}
