// =====================================================================
//  DUNGEON BREAK — Floors Configuration & Data
// =====================================================================

export const THEMES = [
  { name: 'Stone Keep',                 wc: ['#1e293b','#1a2540','#15202e','#243044'], fc: ['#0c1526','#0d1628','#0b1422','#0e1830'], tint: 'rgba(255,160,60,.12)',  fog: 'rgba(0,0,0,.90)' },
  { name: 'Forgotten Crypt',            wc: ['#201b0e','#251f10','#1b1509','#29210d'], fc: ['#110d05','#150f07','#0f0b03','#191305'], tint: 'rgba(200,170,60,.11)', fog: 'rgba(0,0,0,.91)' },
  { name: 'Iron Fissure',               wc: ['#2a1f18','#35241b','#1f1612','#302117'], fc: ['#140d0a','#1a110c','#100a08','#180f0c'], tint: 'rgba(239,68,68,.14)',  fog: 'rgba(10,2,0,.91)' },
  { name: 'Sunken Crypt',               wc: ['#0b1b29','#0d1f31','#09151f','#0f2333'], fc: ['#050b15','#060d19','#040911','#07101d'], tint: 'rgba(60,150,255,.09)',  fog: 'rgba(0,0,8,.92)'  },
  { name: 'Infernal Catacombs',         wc: ['#2e1212','#3b1506','#2b0f0f','#3e1b01'], fc: ['#160606','#1b0900','#140505','#1d0b01'], tint: 'rgba(255,80,20,.16)',  fog: 'rgba(10,2,0,.90)' },
  { name: 'Void Rift',                  wc: ['#1b1131','#231641','#150d29','#1f1339'], fc: ['#09061b','#0b071f','#070417','#0d0921'], tint: 'rgba(168,85,247,.13)', fog: 'rgba(2,0,8,.93)'  },
  { name: 'Molten Core',                wc: ['#381108','#45150a','#2b0c05','#4a190c'], fc: ['#1a0602','#220803','#150401','#210703'], tint: 'rgba(249,115,22,.17)', fog: 'rgba(12,2,0,.91)' },
  { name: 'Shadow Depths',              wc: ['#121219','#191921','#0f0f15','#1d1d25'], fc: ['#070709','#090911','#05050b','#0b0b0f'], tint: 'rgba(80,80,255,.08)',  fog: 'rgba(0,0,2,.95)'  },
  { name: 'Threshold of Oblivion',      wc: ['#170019','#210023','#130015','#1d001f'], fc: ['#08000b','#0a000d','#060009','#0c000f'], tint: 'rgba(255,0,220,.11)',  fog: 'rgba(3,0,5,.94)'  },
  { name: 'Throne of the Abyss Warden',  wc: ['#2b0101','#390001','#210000','#3d0909'], fc: ['#130000','#170000','#0f0000','#1b0303'], tint: 'rgba(255,30,0,.17)',   fog: 'rgba(8,0,0,.92)'  },
];

export const FLOOR_CONFIG = {
  1:  { biome: "stone_keep",         boss: null,            name: "Stone Keep" },
  2:  { biome: "forgotten_crypt",    boss: null,            name: "Forgotten Crypt" },
  3:  { biome: "iron_fissure",       boss: "gorgaroth",     name: "Iron Fissure" },
  4:  { biome: "sunken_crypt",       boss: null,            name: "Sunken Crypt" },
  5:  { biome: "infernal_catacombs", boss: null,            name: "Infernal Catacombs" },
  6:  { biome: "void_rift",          boss: "malakor",       name: "Void Rift" },
  7:  { biome: "molten_core",        boss: null,            name: "Molten Core" },
  8:  { biome: "shadow_depths",      boss: null,            name: "Shadow Depths" },
  9:  { biome: "threshold_oblivion", boss: null,            name: "Threshold of Oblivion" },
  10: { biome: "warden_throne",      boss: "abyss_warden",  name: "Throne of the Abyss Warden" }
};

export const FLOOR_WARP_QUOTES = [
  'The stone drinks tears... but my blade remembers the light of your eyes, Lyra.',
  'Gorgaroth stands at the gate. A brother-in-arms turned to iron and malice... forgive me.',
  'The iron gate shatters. The catacombs weep with old ghosts, but I will not turn back.',
  'Deeper still... The drowned halls whisper secrets I swore to forget.',
  'The air burns like ash. Infernal fires cannot cleanse what was done here.',
  'Malakor tears the sky of the deep. A creature of pure void... stand fast.',
  'The ground is molten glass. Every step forward costs blood, but I will pay it.',
  'Shadows walk beside me now. They speak with the voices of the fallen.',
  'The gates of Oblivion creak open. Hold on, Lyra... Father is here.',
  'Throne of the Abyss Warden. This ends now!'
];

export const MUTATION_DEFS = {
  inferno:    { id: 'inferno', name: '🔥 INFERNO CHAMBER', col: '#f97316', desc: 'Floor cracks spew flame geysers' },
  haunted:    { id: 'haunted', name: '👻 HAUNTED CRYPT', col: '#c084fc', desc: 'Wandering specters stalk corridors' },
  elite_guard:{ id: 'elite_guard', name: '💀 ELITE GUARD', col: '#ef4444', desc: 'An armored Elite foe guards this floor' },
  eclipse:    { id: 'eclipse', name: '🌑 ABYSSAL ECLIPSE', col: '#94a3b8', desc: 'Darkness falls; enemies move faster, +50% souls' },
  adrenaline: { id: 'adrenaline', name: '⚡ ADRENALINE SURGE', col: '#facc15', desc: 'Player & monsters move 30% faster' }
};

export function getTheme(lv) {
  return THEMES[Math.min(Math.max(1, lv) - 1, THEMES.length - 1)];
}

export function getFloorBoss(lv) {
  const cfg = FLOOR_CONFIG[lv];
  return cfg ? cfg.boss : null;
}

export function isBossFloor(lv) {
  return !!getFloorBoss(lv);
}
