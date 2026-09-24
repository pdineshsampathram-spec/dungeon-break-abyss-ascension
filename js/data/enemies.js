// =====================================================================
//  DUNGEON BREAK — Enemies Data & Definitions
// =====================================================================

export const ENEMY_TYPES = {
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton Warrior',
    icon: '💀',
    col: '#94a3b8',
    baseHp: 3,
    speed: 1.1,
    threat: 'Low',
    desc: 'Ancient reanimated foot soldier. Attacks with crude bone blades.',
    weakness: 'Heavy knockback; easily lured into traps.'
  },
  ghoul: {
    id: 'ghoul',
    name: 'Crypt Ghoul',
    icon: '🧟',
    col: '#4ade80',
    baseHp: 5,
    speed: 1.45,
    threat: 'Medium',
    desc: 'Carrion feeder driven mad by subterranean necrotides.',
    weakness: 'Glacial chill interrupts its frenzied lunges.'
  },
  demon: {
    id: 'demon',
    name: 'Infernal Demon',
    icon: '😈',
    col: '#f87171',
    baseHp: 7,
    speed: 1.0,
    threat: 'High',
    desc: 'Brimstone fiend spitting explosive magma projectiles.',
    weakness: 'Vulnerable while casting; circle-strafe to evade bolts.'
  },
  wraith: {
    id: 'wraith',
    name: 'Shadow Wraith',
    icon: '👻',
    col: '#c084fc',
    baseHp: 6,
    speed: 1.3,
    threat: 'Lethal',
    desc: 'Ethereal entity that glides through darkness to drain sanity.',
    weakness: 'Avoid unlit corners; bright torch halos force it back.'
  },
  elite: {
    id: 'elite',
    name: 'Elite Sentinel',
    icon: '💀',
    col: '#ef4444',
    baseHp: 18,
    speed: 1.25,
    threat: 'Elite',
    desc: 'An armored sentinel radiating dark fury and increased durability.',
    weakness: 'Bait heavy attacks, then flank from behind.'
  }
};

export const BESTIARY_INFO = [
  { id: 'skeleton', name: 'Skeleton Warrior', icon: '💀', col: '#94a3b8', threat: 'Low', desc: 'Ancient reanimated foot soldier. Attacks with crude bone blades.', weakness: 'Heavy knockback; easily lured into traps.' },
  { id: 'ghoul', name: 'Crypt Ghoul', icon: '🧟', col: '#4ade80', threat: 'Medium', desc: 'Carrion feeder driven mad by subterranean necrotides.', weakness: 'Glacial chill interrupts its frenzied lunges.' },
  { id: 'demon', name: 'Infernal Demon', icon: '😈', col: '#f87171', threat: 'High', desc: 'Brimstone fiend spitting explosive magma projectiles.', weakness: 'Vulnerable while casting; circle-strafe to evade bolts.' },
  { id: 'wraith', name: 'Shadow Wraith', icon: '👻', col: '#c084fc', threat: 'Lethal', desc: 'Ethereal entity that glides through darkness to drain sanity.', weakness: 'Avoid unlit corners; bright torch halos force it back.' },
  { id: 'gorgaroth', name: 'Gorgaroth, Breaker of Chains', icon: '👹', col: '#fb923c', threat: 'Mini-Boss', desc: 'Colossal jailer wielding an iron pillar. Slams create earth fissures.', weakness: 'Watch for the ground-charge telegraph; dodge outward immediately.' },
  { id: 'malakor', name: 'Malakor, The Void Reaver', icon: '👾', col: '#a855f7', threat: 'Mini-Boss', desc: 'Void sorcerer who shifts through reality and summons soul missiles.', weakness: 'Punish with burst damage during the 1-second recovery after teleporting.' },
  { id: 'warden', name: 'The Abyss Warden', icon: '👑', col: '#ef4444', threat: 'Arch-Demon', desc: 'Lord of the Sunken Citadel. Commander of darkness and the lightless rifts.', weakness: 'Extinguish summoning wards and maintain max distance during rage whirl.' }
];

export function getEnemyRollForFloor(lv) {
  const roll = Math.random();
  if (lv <= 2) return roll < 0.6 ? 'skeleton' : 'ghoul';
  if (lv <= 4) return roll < 0.4 ? 'skeleton' : roll < 0.75 ? 'ghoul' : 'demon';
  if (lv <= 7) return roll < 0.25 ? 'skeleton' : roll < 0.55 ? 'ghoul' : roll < 0.82 ? 'demon' : 'wraith';
  return roll < 0.15 ? 'skeleton' : roll < 0.4 ? 'ghoul' : roll < 0.68 ? 'demon' : 'wraith';
}
