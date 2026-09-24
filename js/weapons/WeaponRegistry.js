// =====================================================================
//  DUNGEON BREAK — js/weapons/WeaponRegistry.js
//  Authoritative Base Weapon Archetypes & Definitions
// =====================================================================

export const WEAPON_TYPES = {
  sword:  { id: 'sword',  name: 'Steel Sword',       type: 'melee',  damage: 2, range: 1.5,  cooldown: 0.32, icon: '⚔️', col: '#facc15', trailCol: '#fde68a' },
  bow:    { id: 'bow',    name: "Hunter's Bow",      type: 'ranged', damage: 2, range: 8.0,  cooldown: 0.42, icon: '🏹', col: '#34d399', trailCol: '#6ee7b7' },
  axe:    { id: 'axe',    name: "Executioner's Axe", type: 'melee',  damage: 4, range: 1.8,  cooldown: 0.60, icon: '🪓', col: '#f97316', trailCol: '#ea580c' },
  dagger: { id: 'dagger', name: 'Shadow Dagger',     type: 'melee',  damage: 1, range: 1.2,  cooldown: 0.15, icon: '🗡️', col: '#c084fc', trailCol: '#a855f7' },
  spear:  { id: 'spear',  name: 'Obsidian Spear',    type: 'melee',  damage: 3, range: 2.5,  cooldown: 0.38, icon: '🔱', col: '#38bdf8', trailCol: '#0284c7' }
};

export const WEAPON_KEYS = Object.keys(WEAPON_TYPES);
