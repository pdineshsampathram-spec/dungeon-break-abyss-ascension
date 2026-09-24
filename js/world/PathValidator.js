// =====================================================================
//  DUNGEON BREAK — js/world/PathValidator.js
//  Authoritative Tile Collision & Spatial Validation
// =====================================================================

import { GameState } from '../core/GameState.js';
import { ROWS, COLS } from '../core/Constants.js';

export function solidAt(wx, wy, map = GameState.MAP) {
  const x1 = Math.floor(wx + 0.26);
  const y1 = Math.floor(wy + 0.26);
  const x2 = Math.floor(wx + 0.74);
  const y2 = Math.floor(wy + 0.74);

  const bad = (r, c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    return !map[r] || map[r][c] === undefined || map[r][c] === 1;
  };

  return bad(y1, x1) || bad(y1, x2) || bad(y2, x1) || bad(y2, x2);
}

export const PathValidator = {
  solidAt
};

if (typeof window !== 'undefined') {
  window.solidAt = solidAt;
}
