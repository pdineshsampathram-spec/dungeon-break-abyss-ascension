// =====================================================================
//  DUNGEON BREAK — js/weapons/WeaponEffects.js
//  Weapon attack feel, swing trails, impact particles, & visual feel
// =====================================================================

import { GameState } from '../core/GameState.js';
import { WD } from '../data/weapons.js';

export const WeaponEffects = {
  getWeaponVisualParams(weaponId) {
    return WD[weaponId] || WD.sword;
  },

  addSwingTrail(x, y, angle, weapon) {
    const params = this.getWeaponVisualParams(weapon.id);
    GameState.SLASH_TRAILS.push({
      x,
      y,
      ang: angle,
      arc: params.arc || 1.1,
      r: params.range || 1.4,
      col: weapon.trailCol || params.trailCol || '#fde68a',
      t: 0,
      maxT: params.trailLen || 0.23,
      slashW: params.slashW || 3
    });
  }
};
