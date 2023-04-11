interface IScript {
  Card: any;
  CardSet: any;
  Engrave: any;
  Equip: any;
  GemSkillEffect: any;
  Skill: any;
}

interface IGem {
  name: string;
  imageUri: string;
  slot: number;
  level: number;
  tier: number;
  skill: string;
  class: string;
  rate: number;
  effectType: string;
  direction: string;
}
interface IGear {
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

interface IAccessory {
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
interface IEngraving {
  name: string;
  classYn: 'Y' | 'N';
  imageUri: string;
  info: string;
}

interface ISkill {
  name: string;
  class: string;
  imageUri: string;
  level: number;
  counterYn: string; //ICounterYn;
  superArmor: string;
  weakPoint: string;
  staggerValue: string;
  attackType: string;
  tripods: Array<ITripod> | null | undefined;
  rune: any | null | undefined;
}
interface ISkillAdd {
  name: string;
  class: string;
  tripods: Array<ITripod>;
  rune: any;
}

interface ITripod {
  name: string;
  imageUri: string;
  level: number;
  tier: number;
  slot: number;
}

interface ICharacter {
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
    engraving: any;
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
