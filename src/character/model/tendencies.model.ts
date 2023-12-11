import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TendenciesModel {
  @Field(() => String, { nullable: false })
  Type!: string;

  @Field(() => Int, { nullable: false })
  Point!: number;

  @Field(() => Int, { nullable: false })
  MaxPoint!: number;
}
