import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CompareEngravingOutput {
  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => String, { nullable: true })
  imageUri?: string | undefined | null;

  @Field(() => String, { nullable: false })
  countByLevel: string;
}
