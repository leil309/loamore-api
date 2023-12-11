import { Field, ObjectType } from '@nestjs/graphql';
import { ArmoryProfileModel } from 'src/character/model/armory-profile.model';
import { ArmoryEquipmentModel } from 'src/character/model/armory-equipment.model';
import { ArmoryAvatarModel } from 'src/character/model/armory-avatar.model';
import { ArmorySkillModel } from 'src/character/model/armory-skill.model';
import { ArmoryEngravingModel } from 'src/character/model/armory-engraving.model';
import { ArmoryCardModel } from 'src/character/model/armory-card.model';
import { ArmoryGemModel } from 'src/character/model/armory-gem.model';
import { ColosseumInfoModel } from 'src/character/model/colosseum-info';
import { CollectibleModel } from 'src/character/model/collectible.model';

@ObjectType()
export class CharacterArmoriesOutput {
  @Field(() => ArmoryProfileModel, { nullable: false, description: '프로필' })
  ArmoryProfile: ArmoryProfileModel;

  @Field(() => [ArmoryEquipmentModel], { nullable: true, description: '장비' })
  ArmoryEquipment: Array<ArmoryEquipmentModel>;

  @Field(() => [ArmoryAvatarModel], { nullable: true, description: '아바타' })
  ArmoryAvatars: Array<ArmoryAvatarModel>;

  @Field(() => [ArmorySkillModel], { nullable: true, description: '스킬' })
  ArmorySkills: Array<ArmorySkillModel>;

  @Field(() => ArmoryEngravingModel, { nullable: true, description: '각인' })
  ArmoryEngraving: ArmoryEngravingModel;

  @Field(() => ArmoryCardModel, { nullable: true, description: '카드' })
  ArmoryCard: ArmoryCardModel;

  @Field(() => ArmoryGemModel, { nullable: true, description: '보석' })
  ArmoryGem: ArmoryGemModel;

  @Field(() => ColosseumInfoModel, {
    nullable: false,
    description: '증명의 전장',
  })
  ColosseumInfo: ColosseumInfoModel;

  @Field(() => [CollectibleModel], {
    nullable: false,
    description: '컬렉션',
  })
  Collectibles: Array<CollectibleModel>;
}
