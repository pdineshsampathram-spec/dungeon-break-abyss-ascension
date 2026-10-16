// =====================================================================
//  DUNGEON BREAK — js/core/Config.js
//  Game speed, difficulty scaling curve, and runtime config
// =====================================================================

import { getBaseFloorDrain } from '../systems/SanitySystem.js';

export const Config = {
  GAME_SPEED: 1.25,
  GAME_SPEED_MIN: 0.5,
  GAME_SPEED_MAX: 2.0,
  GAME_SPEED_STEP: 0.25,
  DEBUG: false,

  setGameSpeed(v) {
    this.GAME_SPEED = Math.max(
      this.GAME_SPEED_MIN,
      Math.min(this.GAME_SPEED_MAX, Math.round(v / this.GAME_SPEED_STEP) * this.GAME_SPEED_STEP)
    );
  },

  getDiff(lv) {
    const floor = Math.max(1, lv || 1);
    return {
      espd: Math.min(1.0 + floor * 0.15, 3.0),
      // Progressive sanity drain: 0.25 on Floor 1 to 1.15 on Floor 10
      sdrain: getBaseFloorDrain(floor),
      ec: Math.min(12 + Math.floor(floor * 2.5), 32),
      traps: Math.min(floor, 8)
    };
  }
};
