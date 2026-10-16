// =====================================================================
//  DUNGEON BREAK — js/data/enemies.js
//  Authoritative Enemies & Bestiary Registry (Pixel-Art Rendered, No Emojis)
// =====================================================================

export const ENEMY_TYPES = {
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton Warrior',
    floors: 'Floors 1 – 4',
    col: '#94a3b8',
    baseHp: 3,
    speed: 1.1,
    threat: 'Low',
    desc: 'Ancient reanimated infantry. Advances in disciplined lines with crude bone blades.',
    tactics: 'Susceptible to knockback; easily pushed into floor spikes and chasm pits.'
  },
  ghoul: {
    id: 'ghoul',
    name: 'Crypt Ghoul',
    floors: 'Floors 2 – 6',
    col: '#4ade80',
    baseHp: 5,
    speed: 1.45,
    threat: 'Medium',
    desc: 'Feral carrion fiend driven mad by necrotides. Crouches before rapid leaping attacks.',
    tactics: 'Interrupt leap windups with heavy attacks or sidestep immediately.'
  },
  demon: {
    id: 'demon',
    name: 'Infernal Demon',
    floors: 'Floors 4 – 8',
    col: '#f87171',
    baseHp: 7,
    speed: 1.0,
    threat: 'High',
    desc: 'Horned brimstone arch-fiend. Gathers molten magma in its core to fire tracking explosive bolts.',
    tactics: 'Vulnerable while channeling; circle-strafe to evade magma orbs.'
  },
  wraith: {
    id: 'wraith',
    name: 'Shadow Wraith',
    floors: 'Floors 6 – 9',
    col: '#c084fc',
    baseHp: 6,
    speed: 1.3,
    threat: 'Lethal',
    desc: 'Phantasmal phantom cloaked in violet shadow. Glides through darkness to drain sanity directly.',
    tactics: 'Fight near lit torches; bright torch halos force wraiths back and dispel phased state.'
  },
  elite: {
    id: 'elite',
    name: 'Elite Sentinel',
    floors: 'Floors 5 – 9',
    col: '#f59e0b',
    baseHp: 18,
    speed: 1.25,
    threat: 'Elite',
    desc: 'Armored vanguard champion radiating dark fury, heavier armor, and area shockwaves.',
    tactics: 'Bait telegraph sweeps, then punish from behind during recovery.'
  }
};

export const BESTIARY_INFO = [
  {
    id: 'skeleton',
    name: 'Skeleton Warrior',
    category: 'Undead Legion',
    floors: 'Floors 1 – 4',
    col: '#94a3b8',
    threat: 'Low',
    desc: 'Ancient vanguard soldier buried beneath the upper vaults. Animated by ambient dark resonance, it mindlessly patrol stone corridors wielding rusted iron blades.',
    tactics: 'Maintain spacing. Its bone structure crumbles under heavy weapon knockback and trap hazards.'
  },
  {
    id: 'ghoul',
    name: 'Crypt Ghoul',
    category: 'Feral Horror',
    floors: 'Floors 2 – 6',
    col: '#4ade80',
    threat: 'Medium',
    desc: 'A wretched humanoid twisted by starvation and subterranean miasma. Hunts by scent and lunges aggressively when cornered.',
    tactics: 'Watch for the crouch telegraph. Sidestep the leap to strike its vulnerable flanks.'
  },
  {
    id: 'demon',
    name: 'Infernal Demon',
    category: 'Brimstone Fiend',
    floors: 'Floors 4 – 8',
    col: '#f87171',
    threat: 'High',
    desc: 'A horned predator summoned from the lower volcanic fissures. Channels scorching hellfire into explosive magma projectiles that shatter on impact.',
    tactics: 'Close the gap quickly. It cannot defend in close melee while charging its molten cores.'
  },
  {
    id: 'wraith',
    name: 'Shadow Wraith',
    category: 'Void Entity',
    floors: 'Floors 6 – 9',
    col: '#c084fc',
    threat: 'Lethal',
    desc: 'An incorporeal spirit born from the lightless tide. It drifts silently across tiles, bypassing conventional defense to chill blood and fray mortal sanity.',
    tactics: 'Keep torches illuminated. Stepping inside a torch\'s light radius prevents sanity siphon.'
  },
  {
    id: 'gorgaroth',
    name: 'Gorgaroth, Breaker of Chains',
    category: 'Ancient Titan (Mini-Boss)',
    floors: 'Floor 3 (Trial of Iron)',
    col: '#fb923c',
    threat: 'Mini-Boss',
    desc: 'The colossal iron jailer who tests strength on Floor 3. Armed with a shattered granite pillar and dragging spiked iron chains, his ground slams shatter the arena.',
    tactics: 'Dodge outward when he raises the pillar. Punish his extended ground recovery window.'
  },
  {
    id: 'malakor',
    name: 'Malakor, The Void Reaver',
    category: 'Dimensional Sorcerer (Boss)',
    floors: 'Floor 6 (Trial of the Void)',
    col: '#a855f7',
    threat: 'Major Boss',
    desc: 'A void-weaver who folds space to test mental resilience on Floor 6. Teleports instantaneously and summons tracking void orbs that warp reality around the challenger.',
    tactics: 'Do not panic during phase shifts. Deliver burst damage during the 1-second recovery after arrival.'
  },
  {
    id: 'warden',
    name: 'The Abyss Warden',
    category: 'Supreme Gatekeeper (Final Boss)',
    floors: 'Floor 10 (Sunken Citadel)',
    col: '#ef4444',
    threat: 'Arch-Demon',
    desc: 'Lord of the Sunken Citadel and conductor of the final trial. Wields dark abyssal pyres, sweeping dark cleaves, and ground cataclysms to test the candidate for apotheosis.',
    tactics: 'Extinguish summoning rifts immediately. Maintain maximum distance during his rage whirl.'
  },
  {
    id: 'absolute',
    name: 'The Absolute',
    category: 'Unrecorded Entity',
    floors: 'Fractured Sanity (Sanity Zero)',
    col: '#ef4444',
    threat: 'Observation Incomplete',
    isSecret: true,
    desc: 'No origin is recorded. No age is known. The form observed during the collapse of sanity is the only surviving account.',
    tactics: ''
  }
];

export function getEnemyRollForFloor(lv) {
  const roll = Math.random();
  if (lv <= 2) return roll < 0.6 ? 'skeleton' : 'ghoul';
  if (lv <= 4) return roll < 0.4 ? 'skeleton' : roll < 0.75 ? 'ghoul' : 'demon';
  if (lv <= 7) return roll < 0.25 ? 'skeleton' : roll < 0.55 ? 'ghoul' : roll < 0.82 ? 'demon' : 'wraith';
  return roll < 0.15 ? 'skeleton' : roll < 0.4 ? 'ghoul' : roll < 0.68 ? 'demon' : 'wraith';
}
