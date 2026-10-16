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
    const life = GameState.REDUCED_MOTION ? 0.08 : (params.trailLen || 0.22);
    GameState.SLASH_TRAILS.push({
      wx: x,
      wy: y,
      angle: angle,
      life: life,
      ml: life,
      arc: params.arc || 1.1,
      range: params.range || 1.4,
      col: weapon.trailCol || params.trailCol || '#fde68a',
      slashW: params.slashW || 3,
      slashGlow: GameState.REDUCED_MOTION ? 0 : (params.slashGlow || 10),
      weaponId: weapon.id,
      isSpear: weapon.id === 'spear',
      isRing: false
    });
  }
};
