import { Field, ObjectType } from '@nestjs/graphql';
import { EngravingModel } from 'src/character/model/engraving.model';
import { EngravingEffectModel } from 'src/character/model/engraving-effect.model';

@ObjectType()
export class ArmoryEngravingModel {
  @Field(() => [EngravingModel], {
    nullable: false,
    description: '장착한 각인',
  })
  Engravings: Array<EngravingModel>;

  @Field(() => [EngravingEffectModel], {
    nullable: false,
    description: '활성된 각인',
  })
  Effects: Array<EngravingEffectModel>;
}
