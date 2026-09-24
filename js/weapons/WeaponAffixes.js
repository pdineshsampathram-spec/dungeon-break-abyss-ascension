// =====================================================================
//  DUNGEON BREAK — js/weapons/WeaponAffixes.js
//  Weapon Prefix & Suffix Affix Generator and Modifiers
// =====================================================================

import { PREFIX_DEFS, SUFFIX_DEFS, rollAffix } from '../data/weapons.js';

export const WeaponAffixes = {
  roll(rarity) {
    return rollAffix(rarity);
  },

  getAffixColor(affix) {
    return affix ? affix.col || '#fde68a' : null;
  },

  applyHitModifiers(weapon, target, damage) {
    let finalDmg = damage;
    if (!weapon || !weapon.affixes) return { damage: finalDmg, effects: [] };

    const effects = [];
    weapon.affixes.forEach(aff => {
      if (!aff) return;
      if (aff.id === 'cursed') {
        finalDmg = Math.round(finalDmg * 1.4);
        effects.push('cursed');
      } else if (aff.id === 'infernal') {
        effects.push('burn');
      } else if (aff.id === 'glacial') {
        effects.push('freeze');
      } else if (aff.id === 'vampiric') {
        effects.push('lifesteal');
      } else if (aff.id === 'thunderous') {
        effects.push('lightning');
      }
    });

    return { damage: finalDmg, effects };
  }
};
