import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArmoryEquipmentModel {
  @Field(() => String, { nullable: false, description: '부위' })
  Type: string;
  @Field(() => String, { nullable: false, description: '장비 이름' })
  Name: string;
  @Field(() => String, { nullable: false, description: '아이콘 주소' })
  Icon: string;
  @Field(() => String, { nullable: false, description: '등급명' })
  Grade: string;
  @Field(() => String, { nullable: false, description: '툴팁' })
  Tooltip: string;
}
