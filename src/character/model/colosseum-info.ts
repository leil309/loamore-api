import { Field, ObjectType } from '@nestjs/graphql';
import { ColosseumModel } from 'src/character/model/colosseum.model';

@ObjectType()
export class ColosseumInfoModel {
  @Field(() => String, { nullable: false, description: '' })
  Rank: string;

  @Field(() => String, { nullable: false, description: '' })
  PreRank: string;

  @Field(() => String, { nullable: false, description: '' })
  Exp: string;

  @Field(() => [ColosseumModel], { nullable: false, description: '' })
  Colosseums: Array<ColosseumModel>;
}
