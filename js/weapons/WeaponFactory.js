// =====================================================================
//  DUNGEON BREAK — js/weapons/WeaponFactory.js
//  Procedural Weapon Generator with Rarity & Level Scaling
// =====================================================================

import { WEAPON_TYPES } from './WeaponRegistry.js';
import { RARITIES, rollAffix } from '../data/weapons.js';

// Authoritative Canonical Weapon Naming Table per Weapon Class and Rarity Tier
export const CANONICAL_WEAPON_NAMES = {
  sword: {
    Common: 'Steel Sword',
    Rare: 'Runic Steel Sword',
    Epic: 'Abyssal Broadsword',
    Legendary: 'Consecrated Sunblade'
  },
  axe: {
    Common: "Executioner's Axe",
    Rare: "Heavy Executioner's Axe",
    Epic: 'Dread Cleaver',
    Legendary: 'Cataclysmic Greataxe'
  },
  dagger: {
    Common: 'Shadow Dagger',
    Rare: 'Serrated Shadow Dagger',
    Epic: 'Phantasmal Kris',
    Legendary: 'Nether Shadowfang'
  },
  bow: {
    Common: "Hunter's Bow",
    Rare: "Recurve Hunter's Bow",
    Epic: 'Composite Longbow',
    Legendary: 'Voidstrider Bow'
  },
  spear: {
    Common: 'Obsidian Spear',
    Rare: 'War Obsidian Spear',
    Epic: 'Trident of the Deep',
    Legendary: 'Lance of the Sunken King'
  }
};

export const WeaponFactory = {
  create(id, rarityName = 'Common', affixes = null, level = 1, options = {}) {
    const base = WEAPON_TYPES[id] || WEAPON_TYPES.sword;
    const rar = RARITIES.find(r => r.name.toLowerCase() === (rarityName || 'common').toLowerCase()) || RARITIES[0];
    const dmgMul = rar.name === 'Legendary' ? 2.2 : rar.name === 'Epic' ? 1.6 : rar.name === 'Rare' ? 1.25 : 1.0;

    let weaponAffixes = [];
    if (Array.isArray(affixes) && affixes.length > 0) {
      weaponAffixes = affixes;
    } else if (options && options.rollAffixes === true) {
      const rolled = rollAffix(rar);
      if (rolled.prefix) weaponAffixes.push(rolled.prefix);
      if (rolled.suffix) weaponAffixes.push(rolled.suffix);
    }

    const canonicalName = (CANONICAL_WEAPON_NAMES[base.id] && CANONICAL_WEAPON_NAMES[base.id][rar.name]) || base.name;
    let displayName = canonicalName;
    const prefix = weaponAffixes.find(a => a && a.id && ['infernal', 'glacial', 'vampiric', 'thunderous', 'cursed'].includes(a.id));
    const suffix = weaponAffixes.find(a => a && a.id && ['swiftness', 'force', 'insight'].includes(a.id));
    if (prefix && prefix.name) displayName = `${prefix.name} ${displayName}`;
    if (suffix && suffix.name) displayName = `${displayName} ${suffix.name}`;

    const calculatedDmg = Math.max(1, Math.round(base.damage * dmgMul * (1 + (level - 1) * 0.18)));
    const calculatedCd = base.cooldown * (suffix && suffix.id === 'swiftness' ? 0.75 : 1.0);

    return {
      id: base.id,
      name: displayName,
      baseName: canonicalName,
      type: base.type,
      damage: calculatedDmg,
      dmg: calculatedDmg,
      range: base.range,
      cooldown: calculatedCd,
      cd: calculatedCd,
      arc: base.arc || 1.1,
      shk: base.shk || 4,
      rarity: rar,
      affixes: weaponAffixes,
      prefix: prefix || null,
      suffix: suffix || null,
      level: level,
      icon: base.icon,
      col: base.col,
      trailCol: base.trailCol,
      projectile: base.type === 'ranged' || base.id === 'bow'
    };
  }
};

export const createWeapon = WeaponFactory.create;

if (typeof window !== 'undefined') {
  window.WeaponFactory = WeaponFactory;
  window.CANONICAL_WEAPON_NAMES = CANONICAL_WEAPON_NAMES;
  window.createWeapon = createWeapon;
}
