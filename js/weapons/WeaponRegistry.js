// =====================================================================
//  DUNGEON BREAK — js/weapons/WeaponRegistry.js
//  Authoritative Base Weapon Archetypes & Definitions
// =====================================================================

export const WEAPON_TYPES = {
  dagger: { id: 'dagger', name: 'Shadow Dagger',     type: 'melee',  damage: 2,   dmg: 2,   range: 1.1,  cooldown: 0.15, cd: 0.15, arc: 0.70, icon: '🗡️', col: '#c084fc', trailCol: '#a855f7', shk: 2 },
  sword:  { id: 'sword',  name: 'Steel Sword',       type: 'melee',  damage: 3.5, dmg: 3.5, range: 1.5,  cooldown: 0.32, cd: 0.32, arc: 1.1,  icon: '⚔️', col: '#facc15', trailCol: '#fde68a', shk: 4 },
  bow:    { id: 'bow',    name: "Hunter's Bow",      type: 'ranged', damage: 3.5, dmg: 3.5, range: 12.0, cooldown: 0.42, cd: 0.42, arc: 0.5,  icon: '🏹', col: '#34d399', trailCol: '#6ee7b7', shk: 3 },
  spear:  { id: 'spear',  name: 'Obsidian Spear',    type: 'melee',  damage: 4.5, dmg: 4.5, range: 2.6,  cooldown: 0.38, cd: 0.38, arc: 0.55, icon: '🔱', col: '#38bdf8', trailCol: '#0284c7', shk: 6 },
  axe:    { id: 'axe',    name: "Executioner's Axe", type: 'melee',  damage: 7.0, dmg: 7.0, range: 1.9,  cooldown: 0.60, cd: 0.60, arc: 1.6,  icon: '🪓', col: '#f97316', trailCol: '#ea580c', shk: 14 }
};

export const WEAPON_KEYS = Object.keys(WEAPON_TYPES);
