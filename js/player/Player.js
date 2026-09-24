// =====================================================================
//  DUNGEON BREAK — js/player/Player.js
//  Authoritative Player Entity Setup & Lifecycle
// =====================================================================

import { GameState } from '../core/GameState.js';

export const Player = {
  reset() {
    GameState.resetPlayer();
  },

  spawn(x, y) {
    GameState.P.x = x;
    GameState.P.y = y;
    GameState.P.vx = 0;
    GameState.P.vy = 0;
  },

  get() {
    return GameState.P;
  }
};
