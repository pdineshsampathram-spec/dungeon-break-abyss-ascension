// =====================================================================
//  DUNGEON BREAK — js/core/Config.js
//  Game speed, difficulty scaling curve, and runtime config
// =====================================================================

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
    return {
      espd: Math.min(1.0 + lv * 0.15, 3.0),
      sdrain: Math.min(0.4 + lv * 0.09, 1.4),
      ec: Math.min(3 + Math.floor(lv * 1.4), 16),
      traps: Math.min(lv, 8)
    };
  }
};
