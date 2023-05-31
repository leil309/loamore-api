import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLBigInt } from 'graphql-scalars';
import { class_yn } from '../../@generated/prisma/class-yn.enum';

@ObjectType()
export class EngravingOutput {
  @Field(() => GraphQLBigInt, { nullable: false })
  id!: bigint;

  @Field(() => String, { nullable: false })
  name!: string;

  @Field(() => Int, { nullable: false })
  level!: number;

  @Field(() => class_yn, { nullable: false, defaultValue: 'N' })
  class_yn!: keyof typeof class_yn;

  @Field(() => String, { nullable: false })
  image_uri!: string;
}
