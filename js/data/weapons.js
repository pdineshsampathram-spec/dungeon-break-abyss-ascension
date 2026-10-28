// =====================================================================
//  DUNGEON BREAK — Weapons Data & Affixes
// =====================================================================

export const WD = {
  dagger: { range: 1.1,  sg: 3, cd: 0.15, col: '#a78bfa', arc: 0.70, icon: '🗡️', label: '🗡️ Dagger',      shk: 2,  trailLen: 0.10, trailCol: '#c4b5fd', sparkCol: '#ede9fe', sparkN: 6,  slashW: 2, slashGlow: 7,  freezeT: 0.02,  projectile: false, dmg: 5.0, damage: 5.0 },
  sword:  { range: 1.5,  sg: 6, cd: 0.32, col: '#facc15', arc: 1.1,  icon: '⚔️', label: '⚔️ Sword',       shk: 4,  trailLen: 0.23, trailCol: '#fde68a', sparkCol: '#fff9c4', sparkN: 10, slashW: 3, slashGlow: 12, freezeT: 0.05,  projectile: false, dmg: 4.0, damage: 4.0 },
  bow:    { range: 12.0, sg: 5, cd: 0.42, col: '#34d399', arc: 0.5,  icon: '🏹', label: '🏹 Arcane Bow',   shk: 3,  trailLen: 0.13, trailCol: '#6ee7b7', sparkCol: '#a7f3d0', sparkN: 7,  slashW: 2, slashGlow: 8,  freezeT: 0.033, projectile: true, projSpd: 9.5, projDmg: 4.0, projRange: 14, dmg: 4.0, damage: 4.0 },
  spear:  { range: 2.6,  sg: 7, cd: 0.38, col: '#38bdf8', arc: 0.55, icon: '🔱', label: '🔱 Spear',        shk: 6,  trailLen: 0.25, trailCol: '#7dd3fc', sparkCol: '#e0f2fe', sparkN: 14, slashW: 2, slashGlow: 10, freezeT: 0.067, projectile: false, dmg: 4.5, damage: 4.5 },
  axe:    { range: 1.9,  sg: 10, cd: 0.60, col: '#f97316', arc: 1.6,  icon: '🪓', label: '🪓 Axe',          shk: 14, trailLen: 0.37, trailCol: '#fb923c', sparkCol: '#ff6b35', sparkN: 28, slashW: 5, slashGlow: 26, freezeT: 0.12,  projectile: false, dmg: 7.0, damage: 7.0, heavyDmg: 9 },
};

export const WK = Object.keys(WD);

export const RARITIES = [
  { name: 'Common',    col: '#94a3b8', glow: 'rgba(148,163,184,0.4)', weight: 50 },
  { name: 'Rare',      col: '#3b82f6', glow: 'rgba(59,130,246,0.6)',  weight: 28 },
  { name: 'Epic',      col: '#a855f7', glow: 'rgba(168,85,247,0.7)',  weight: 16 },
  { name: 'Legendary', col: '#f97316', glow: 'rgba(249,115,22,0.9)',  weight: 6 },
];

export function rollRarity() {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const r of RARITIES) {
    acc += r.weight;
    if (roll < acc) return r;
  }
  return RARITIES[0];
}

export function rarityDmgMult(r) {
  if (!r) return 1;
  const name = typeof r === 'string' ? r : r.name;
  if (name === 'Legendary') return 2.5;
  if (name === 'Epic') return 1.75;
  if (name === 'Rare') return 1.25;
  return 1;
}

export const PREFIX_DEFS = [
  { id: 'infernal', name: 'Infernal', col: '#f97316', desc: 'Burn DOT' },
  { id: 'glacial', name: 'Glacial', col: '#38bdf8', desc: 'Slows enemies' },
  { id: 'vampiric', name: 'Vampiric', col: '#ef4444', desc: '+15% Lifesteal' },
  { id: 'thunderous', name: 'Thunderous', col: '#facc15', desc: 'Chain lightning' },
  { id: 'cursed', name: 'Cursed', col: '#c084fc', desc: '+40% DMG, -1 Sanity/hit' }
];

export const SUFFIX_DEFS = [
  { id: 'swiftness', name: 'of Swiftness', desc: '-25% Cooldown' },
  { id: 'force', name: 'of Force', desc: '+100% Knockback' },
  { id: 'insight', name: 'of Insight', desc: '+Bonus Sanity on kill' }
];

export function rollAffix(rarity) {
  const rName = (rarity && rarity.name) ? rarity.name : 'Common';
  const rollChance = rName === 'Legendary' ? 0.9 : rName === 'Epic' ? 0.6 : 0.25;
  let p = null, s = null;
  if (Math.random() < rollChance) {
    p = PREFIX_DEFS[(Math.random() * PREFIX_DEFS.length) | 0];
  }
  if (Math.random() < rollChance * 0.75) {
    s = SUFFIX_DEFS[(Math.random() * SUFFIX_DEFS.length) | 0];
  }
  return { prefix: p, suffix: s };
}
