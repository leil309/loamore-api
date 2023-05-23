import { Field, Int, ObjectType } from '@nestjs/graphql';
import { EngravingOutput } from 'src/character/dto/engraving.output';

@ObjectType()
export class AverageEngravingOutput {
  @Field(() => Int, { nullable: false })
  count: number;

  @Field(() => [EngravingOutput], { nullable: false })
  engraving: Array<EngravingOutput>;
}
