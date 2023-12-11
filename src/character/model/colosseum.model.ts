import { Field, ObjectType } from '@nestjs/graphql';
import { AggregationTeamDeathMatchRankModel } from 'src/character/model/aggregation-team-death-match-rank.model';
import { AggregationModel } from 'src/character/model/aggregation.model';
import { AggregationEliminationModel } from 'src/character/model/aggregation-elimination.model';

@ObjectType()
export class ColosseumModel {
  @Field(() => String, { nullable: false, description: '시즌 이름' })
  SeasonName: string;

  @Field(() => AggregationTeamDeathMatchRankModel, {
    nullable: true,
    description: '',
  })
  Competitive: AggregationTeamDeathMatchRankModel;

  @Field(() => AggregationModel, { nullable: true, description: '' })
  TeamDeathmatch: AggregationModel;

  @Field(() => AggregationModel, { nullable: true, description: '' })
  Deathmatch: AggregationModel;

  @Field(() => AggregationEliminationModel, {
    nullable: true,
    description: '',
  })
  TeamElimination: AggregationEliminationModel;

  @Field(() => AggregationModel, { nullable: true, description: '' })
  CoOpBattle: AggregationModel;
}
