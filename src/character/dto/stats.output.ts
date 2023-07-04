import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLBigInt } from 'graphql-scalars';
import { class_yn } from '../../@generated/prisma/class-yn.enum';

@ObjectType()
export class StatsOutput {
  @Field(() => String, { nullable: false })
  name!: string;

  @Field(() => Float, { nullable: false })
  value!: number;
}
