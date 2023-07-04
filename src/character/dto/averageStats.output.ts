import { Field, Int, ObjectType } from '@nestjs/graphql';
import { EngravingOutput } from './engraving.output';
import { StatsOutput } from './stats.output';

@ObjectType()
export class AverageStatsOutput {
  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => [StatsOutput], { nullable: false })
  stats: Array<StatsOutput>;
}
