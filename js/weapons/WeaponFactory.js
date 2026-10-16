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

    let displayName = base.name;
    const prefix = weaponAffixes.find(a => a && a.id && ['infernal', 'glacial', 'vampiric', 'thunderous', 'cursed'].includes(a.id));
    const suffix = weaponAffixes.find(a => a && a.id && ['swiftness', 'force', 'insight'].includes(a.id));
    if (prefix && prefix.name) displayName = `${prefix.name} ${displayName}`;
    if (suffix && suffix.name) displayName = `${displayName} ${suffix.name}`;

    const calculatedDmg = Math.max(1, Math.round(base.damage * dmgMul * (1 + (level - 1) * 0.08)));
    const calculatedCd = base.cooldown * (suffix && suffix.id === 'swiftness' ? 0.75 : 1.0);

    return {
      id: base.id,
      name: displayName,
      baseName: base.name,
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
  window.createWeapon = createWeapon;
}
