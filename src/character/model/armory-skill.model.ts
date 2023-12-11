import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SkillTripodModel } from 'src/character/model/skill-tripod.model';
import { SkillRuneModel } from 'src/character/model/skill-rune.model';

@ObjectType()
export class ArmorySkillModel {
  @Field(() => String, { nullable: false, description: '스킬 이름' })
  Name: string;

  @Field(() => String, { nullable: false, description: '아이콘' })
  Icon: string;

  @Field(() => Int, { nullable: false, description: '레벨' })
  Level: number;

  @Field(() => String, { nullable: false, description: '타입 [일반, 홀딩 등]' })
  Type: string;

  @Field(() => Boolean, { nullable: false, description: '각성기 여부' })
  IsAwakening: boolean;

  @Field(() => [SkillTripodModel], {
    nullable: false,
    description: '트라이포드',
  })
  Tripods: Array<SkillTripodModel>;

  @Field(() => SkillRuneModel, { nullable: true, description: '룬' })
  Rune: SkillRuneModel;

  @Field(() => String, { nullable: false, description: '툴팁' })
  Tooltip: string;
}
