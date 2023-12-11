import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CollectiblePointModel } from 'src/character/model/collectible-point.model';

@ObjectType()
export class CollectibleModel {
  @Field(() => String, { nullable: false, description: '' })
  Type: string;

  @Field(() => String, { nullable: false, description: '' })
  Icon: string;

  @Field(() => Int, { nullable: false, description: '' })
  Point: number;

  @Field(() => Int, { nullable: false, description: '' })
  MaxPoint: number;

  @Field(() => [CollectiblePointModel], { nullable: false, description: '' })
  CollectiblePoints: Array<CollectiblePointModel>;
}
