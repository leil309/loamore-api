export interface IScript {
  Card: any;
  CardSet: any;
  Engrave: any;
  Equip: any;
  GemSkillEffect: any;
  Skill: any;
}

export interface IGem {
  name: string;
  imageUri: string;
  slot: number;
  level: number;
  tier: number;
  class: string;
  skill: string;
  rate: number;
  effectType: string;
  direction: string;
  EquipGemSlotIndex?: number | undefined | null;
  SkillDesc?: string | undefined | null;
  SkillIcon?: string | undefined | null;
  SkillName?: string | undefined | null;
  SkillSlotIndex?: number | undefined | null;
}
export interface IGear {
  name: string;
  honing: number;
  imageUri: string;
  slot: number;
  tier: number;
  level: number;
  quality: number;
  setName: string;
  setEffect: Array<string>;
  baseEffect: Array<string>;
  additionalEffect: Array<string>;
}

export interface IAccessory {
  name: string;
  imageUri: string;
  slot: number;
  tier: number;
  quality: number;
  baseEffect: Array<string>;
  additionalEffect: Array<string>;
  braceletEffect: Array<string>;
  engraving: Array<any>;
}
export interface IEngraving {
  className?: string | null | undefined;
  name: string;
  classYn: 'Y' | 'N';
  imageUri: string;
  info: string;
  level: number;
}

export interface IStatsEngraving {
  name: string;
  level: number;
}

export enum CounterYn {
  Y = 'Y',
  N = 'N',
}
export enum SelectedYn {
  Y = 'Y',
  N = 'N',
}

export interface ISkill {
  name: string;
  class: string;
  imageUri: string;
  level: number;
  counterYn: CounterYn; //ICounterYn;
  superArmor: string;
  weakPoint: number;
  staggerValue: string;
  attackType: string;
  tripods: Array<ITripod> | null | undefined;
  rune: any | null | undefined;
}

export interface ISkillAdd {
  name: string;
  class: string;
  tripods: Array<ITripod>;
  rune: any;
}

export interface ITripod {
  name: string;
  skillName: string;
  imageUri: string;
  level: number;
  tier: number;
  slot: number;
  selected: SelectedYn;
}

export interface ICharacter {
  class: string;
  userName: string;
  level: any;
  itemLevel: any;
  guildName: string;
  serverName: string;
  stats: {
    basic: {
      attack_power: number;
      max_health: number;
    };
    battle: {
      critical: number;
      specialization: number;
      domination: number;
      swiftness: number;
      endurance: number;
      expertise: number;
    };
    virtues: {
      wisdom: number;
      courage: number;
      charisma: number;
      kindness: number;
    };
    engraving?: Array<IStatsEngraving> | undefined | null;
  };
  imageUri: string;
  engraving: Array<IEngraving>;
  gemList: Array<IGem>;
  gearList: Array<IGear>;
  accessoryList: Array<IAccessory>;
  skillList: Array<ISkill>;
  skillAdditionalInfo: Array<ISkillAdd>;
  avatarList: Array<any>;
  cardList: Array<any>;
  elixir: Array<any>;
  ownUserName: Array<any>;
}
