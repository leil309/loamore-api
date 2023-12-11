import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CollectiblePointModel {
  @Field(() => String, { nullable: false, description: '' })
  PointName: string;

  @Field(() => Int, { nullable: false, description: '' })
  Point: number;

  @Field(() => Int, { nullable: false, description: '' })
  MaxPoint: number;
}
