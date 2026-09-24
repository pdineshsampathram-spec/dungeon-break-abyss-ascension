// =====================================================================
//  DUNGEON BREAK — js/weapons/WeaponFactory.js
//  Procedural Weapon Generator with Rarity & Level Scaling
// =====================================================================

import { WEAPON_TYPES } from './WeaponRegistry.js';
import { RARITIES, rollAffix } from '../data/weapons.js';

export const WeaponFactory = {
  create(id, rarityName = 'Common', affixes = [], level = 1) {
    const base = WEAPON_TYPES[id] || WEAPON_TYPES.sword;
    const rar = RARITIES.find(r => r.name.toLowerCase() === (rarityName || 'common').toLowerCase()) || RARITIES[0];
    const dmgMul = rar.name === 'Legendary' ? 2.2 : rar.name === 'Epic' ? 1.6 : rar.name === 'Rare' ? 1.25 : 1.0;

    let weaponAffixes = affixes;
    if (!weaponAffixes || weaponAffixes.length === 0) {
      const rolled = rollAffix(rar);
      weaponAffixes = [];
      if (rolled.prefix) weaponAffixes.push(rolled.prefix);
      if (rolled.suffix) weaponAffixes.push(rolled.suffix);
    }

    return {
      id: base.id,
      name: base.name,
      type: base.type,
      damage: Math.round(base.damage * dmgMul * (1 + (level - 1) * 0.08)),
      range: base.range,
      cooldown: base.cooldown,
      rarity: rar,
      affixes: weaponAffixes,
      level: level,
      icon: base.icon,
      col: base.col,
      trailCol: base.trailCol
    };
  }
};

export const createWeapon = WeaponFactory.create;

if (typeof window !== 'undefined') {
  window.createWeapon = createWeapon;
}
