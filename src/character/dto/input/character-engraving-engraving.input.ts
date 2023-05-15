import {Field, InputType} from "@nestjs/graphql";
import { GraphQLBigInt } from 'graphql-scalars';
import {class_yn} from "../../../@generated/prisma/class-yn.enum";

@InputType()
export class CharacterEngravingEngravingInput {
  @Field(() => class_yn, {nullable: false})
  class_yn: class_yn;

  @Field(() => GraphQLBigInt, { nullable: false })
  id: number;

  @Field(() => String, { nullable: false })
  image_uri: string;

  @Field(() => String, { nullable: false })
  info: string;

  @Field(() => String, { nullable: false })
  name: string;
}
