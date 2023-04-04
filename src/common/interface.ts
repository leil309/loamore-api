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
  imageUri: string;
  info: string;
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
  avatarList: Array<any>;
  cardList: Array<any>;
  elixir: Array<any>;
  ownUserName: Array<any>;
}
