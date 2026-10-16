// =====================================================================
//  DUNGEON BREAK — js/world/PathValidator.js
//  Authoritative Tile Collision & Spatial Validation
// =====================================================================

import { GameState } from '../core/GameState.js';
import { ROWS, COLS } from '../core/Constants.js';

export function solidAt(wx, wy, map = GameState.MAP, forProjectile = false) {
  const x1 = Math.floor(wx + 0.26);
  const y1 = Math.floor(wy + 0.26);
  const x2 = Math.floor(wx + 0.74);
  const y2 = Math.floor(wy + 0.74);

  const bad = (r, c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    if (!map[r] || map[r][c] === undefined) return true;
    const tile = map[r][c];
    if (tile === 1) return true; // Solid Wall
    if (!forProjectile && tile === 3) return true; // Chasm blocks walking entities!
    return false;
  };

  if (bad(y1, x1) || bad(y1, x2) || bad(y2, x1) || bad(y2, x2)) {
    return true;
  }

  // Authoritative Gate Entity Obstacle Check
  // Collision attaches only to the actual gate entity footprint when solid is enabled.
  const checkGate = (g) => {
    if (!g || !g.solid) return false;
    const gw = g.width !== undefined ? g.width : 1;
    const gh = g.height !== undefined ? g.height : 2;
    const ex1 = wx + 0.26, ex2 = wx + 0.74;
    const ey1 = wy + 0.26, ey2 = wy + 0.74;
    return ex2 > g.x && ex1 < g.x + gw && ey2 > g.y && ey1 < g.y + gh;
  };

  if (GameState.GATE && checkGate(GameState.GATE)) return true;
  if (GameState.GATES && GameState.GATES.length > 0 && GameState.GATES.some(checkGate)) return true;

  return false;
}

export const PathValidator = {
  solidAt
};

if (typeof window !== 'undefined') {
  window.solidAt = solidAt;
}
