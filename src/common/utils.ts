const statsType = [
  { type: 'attack_power', name: '공격력' },
  { type: 'max_health', name: '최대 생명력' },
  { type: 'critical', name: '치명' },
  { type: 'specialization', name: '특화' },
  { type: 'swiftness', name: '신속' },
  { type: 'domination', name: '제압' },
  { type: 'endurance', name: '인내' },
  { type: 'expertise', name: '숙련' },
];
const tendenciesType = [
  { type: 'wisdom', name: '지성' },
  { type: 'courage', name: '담력' },
  { type: 'charisma', name: '매력' },
  { type: 'kindness', name: '친절' },
];

export const StatsNameToType = (name: string) => {
  return statsType.find((x) => x.name === name).type;
};
export const TendenciesNameToType = (name: string) => {
  return tendenciesType.find((x) => x.name === name).type;
};
