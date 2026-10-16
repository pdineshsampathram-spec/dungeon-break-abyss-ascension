// =====================================================================
//  DUNGEON BREAK — js/data/talents.js
//  Authoritative Sanctum Soul Talents & Prestige Legacy Upgrades Data
// =====================================================================

export const TALENT_CATEGORIES = {
  survival: { id: 'survival', name: 'Survival', icon: '🛡️', col: '#38bdf8' },
  weapons:  { id: 'weapons',  name: 'Weapon Mastery', icon: '⚔️', col: '#facc15' },
  technique:{ id: 'technique',name: 'Technique', icon: '⚡', col: '#a855f7' },
  utility:  { id: 'utility',  name: 'Abyssal Utility', icon: '🔮', col: '#ec4899' },
  legacy:   { id: 'legacy',   name: 'Legacy Repertoire', icon: '👑', col: '#f59e0b' }
};

export const TALENT_DEFS = {
  // ─────────────────────────────────────────────────────────────
  // 1. SURVIVAL
  // ─────────────────────────────────────────────────────────────
  vitality: {
    id: 'vitality',
    category: 'survival',
    name: 'Bloodline Vigor',
    icon: '🩸',
    desc: '+2 Max HP per rank.',
    max: 5,
    costs: [5, 12, 25, 45, 75]
  },
  iron_skin: {
    id: 'iron_skin',
    category: 'survival',
    name: 'Defensive Mastery',
    icon: '🛡️',
    desc: '-5% incoming damage from all enemy attacks per rank.',
    max: 5,
    costs: [10, 22, 45, 80, 130]
  },
  resilience: {
    id: 'resilience',
    category: 'survival',
    name: 'Environmental Resilience',
    icon: '🌿',
    desc: '-15% trap & hazard damage and +10 starting sanity per rank.',
    max: 3,
    costs: [15, 35, 70]
  },

  // ─────────────────────────────────────────────────────────────
  // 2. WEAPON MASTERY
  // ─────────────────────────────────────────────────────────────
  hunters_focus: {
    id: 'hunters_focus',
    category: 'weapons',
    name: 'Hunter\'s Focus',
    icon: '🏹',
    desc: '+12% Arcane Bow damage and +15% arrow velocity per rank.',
    max: 5,
    costs: [8, 20, 40, 70, 115]
  },
  rift_discipline: {
    id: 'rift_discipline',
    category: 'weapons',
    name: 'Rift Discipline',
    icon: '🗡️',
    desc: '-10% Dagger attack cooldown and +15% shadow lunge distance per rank.',
    max: 5,
    costs: [8, 20, 40, 70, 115]
  },
  explosive_might: {
    id: 'explosive_might',
    category: 'weapons',
    name: 'Explosive Mastery',
    icon: '🪓',
    desc: '+15% Heavy War Axe shockwave radius and +12% heavy damage per rank.',
    max: 5,
    costs: [10, 24, 48, 85, 135]
  },
  lance_precision: {
    id: 'lance_precision',
    category: 'weapons',
    name: 'Reach and Precision',
    icon: '🔱',
    desc: '+15% Spear linear reach and +10% penetrating corridor damage per rank.',
    max: 5,
    costs: [8, 20, 40, 70, 115]
  },

  // ─────────────────────────────────────────────────────────────
  // 3. TECHNIQUE
  // ─────────────────────────────────────────────────────────────
  fury: {
    id: 'fury',
    category: 'technique',
    name: 'Abyssal Might',
    icon: '⚔️',
    desc: '+15% Attack damage and +8% critical strike chance per rank.',
    max: 5,
    costs: [8, 18, 35, 60, 100]
  },
  haste: {
    id: 'haste',
    category: 'technique',
    name: 'Phantom Haste',
    icon: '⚡',
    desc: '+8% Movement speed and rapid attack recovery per rank.',
    max: 5,
    costs: [8, 18, 35, 60, 100]
  },
  technique_mastery: {
    id: 'technique_mastery',
    category: 'technique',
    name: 'Technique Mastery',
    icon: '🌀',
    desc: 'Reduces Weapon Special (Q) cooldown by 0.4s per rank (5.0s down to 3.0s).',
    max: 5,
    costs: [12, 28, 55, 95, 150]
  },

  // ─────────────────────────────────────────────────────────────
  // 4. ABYSSAL UTILITY
  // ─────────────────────────────────────────────────────────────
  clarity: {
    id: 'clarity',
    category: 'utility',
    name: 'Mind Sanctuary',
    icon: '🧠',
    desc: '-12% Sanity drain rate in the deep floors per rank.',
    max: 5,
    costs: [5, 12, 25, 45, 75]
  },
  siphon: {
    id: 'siphon',
    category: 'utility',
    name: 'Vampiric Touch',
    icon: '👁️',
    desc: '5% chance on hit to restore 1 HP per rank.',
    max: 5,
    costs: [10, 25, 50, 85, 140]
  },
  soul_harvest: {
    id: 'soul_harvest',
    category: 'utility',
    name: 'Soul Harvest',
    icon: '🔮',
    desc: '+12% bonus Abyss Souls gained from all enemy and boss kills per rank.',
    max: 5,
    costs: [10, 25, 50, 90, 145]
  }
};

export const TALENT_KEYS = Object.keys(TALENT_DEFS);

// ─────────────────────────────────────────────────────────────
// 5. PRESTIGE LEGACY UPGRADES (Permanent Multi-Run Metaprogression)
// Earned strictly by completing a Warden ending (Hero, Betrayal, Rampage)
// ─────────────────────────────────────────────────────────────
export const LEGACY_DEFS = {
  legacy_souls: {
    id: 'legacy_souls',
    name: 'Soul\'s Due',
    icon: '🔮',
    desc: '+25% permanent Abyss Souls multiplier across all runs.',
    max: 3,
    costs: [1, 2, 3], // Prestige tokens
    detail: 'The void recognizes your conquest; fallen enemies yield 25% more souls per rank.'
  },
  legacy_defense: {
    id: 'legacy_defense',
    name: 'Iron Memory',
    icon: '🛡️',
    desc: '+15 Max HP and +10% flat damage resistance permanently.',
    max: 2,
    costs: [1, 2],
    detail: 'Your flesh remembers the impact of the Warden\'s hammer, hardening bone and muscle.'
  },
  legacy_sanity: {
    id: 'legacy_sanity',
    name: 'Echo Keeper',
    icon: '🧠',
    desc: '-25% base sanity drain and immunity to phantom mirages.',
    max: 2,
    costs: [1, 2],
    detail: 'Rowan retains his sense of self even when gazing into the celestial void eye.'
  },
  legacy_defiance: {
    id: 'legacy_defiance',
    name: 'Last Defiance',
    icon: '🔥',
    desc: 'Surviving lethal damage restores 35% HP & grants 3.5s shield (Once per run).',
    max: 1,
    costs: [2],
    detail: 'When struck with fatal force, the abyss refuses to let you die, triggering an instantaneous defensive surge.'
  },
  legacy_mastery: {
    id: 'legacy_mastery',
    name: 'Weapon Discipline',
    icon: '⚔️',
    desc: '-1.0s Weapon Special cooldown and +20% critical strike chance.',
    max: 2,
    costs: [1, 3],
    detail: 'Total mastery over the blood-forged weapons of the ancient bosses.'
  }
};

export const LEGACY_KEYS = Object.keys(LEGACY_DEFS);
