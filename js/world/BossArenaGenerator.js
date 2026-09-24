// =====================================================================
//  DUNGEON BREAK — js/world/BossArenaGenerator.js
//  Authoritative Dedicated 34x22 Boss Arena Layout
// =====================================================================

import { GameState } from '../core/GameState.js';
import { ROWS, COLS } from '../core/Constants.js';

export const BossArenaGenerator = {
  build(floor) {
    GameState.MAP = [];
    GameState.ROOMS = [];
    GameState.TORCHES = [];

    for (let r = 0; r < ROWS; r++) {
      GameState.MAP.push(new Array(COLS).fill(1));
    }

    const aw = 34, ah = 22;
    const ax = ((COLS - aw) / 2) | 0;
    const ay = ((ROWS - ah) / 2) | 0;
    const cx = ax + (aw / 2) | 0;
    const cy = ay + (ah / 2) | 0;

    // Carve spacious central arena
    for (let r = ay; r < ay + ah; r++) {
      for (let c = ax; c < ax + aw; c++) {
        GameState.MAP[r][c] = 0;
      }
    }

    // Symmetrical ornamental pillars with torch sconces
    const pillars = [
      [cx - 8, cy - 5], [cx + 8, cy - 5],
      [cx - 8, cy + 5], [cx + 8, cy + 5],
      [cx - 12, cy],    [cx + 12, cy]
    ];
    pillars.forEach(([c, r]) => {
      if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
        GameState.MAP[r][c] = 1;
        GameState.TORCHES.push({ x: c, y: r, ph: Math.random() * 6.28 });
      }
    });

    // Exit portal at top of arena — locked until boss is slain
    GameState.MAP[ay + 2][cx] = 2;

    GameState.ROOMS = [{ x: ax, y: ay, w: aw, h: ah, cx, cy }];

    // Guaranteed safe spawn placement:
    // Player at bottom of arena: (cx, ay + ah - 3) = (24, 24)
    // Boss spawns at center: (cx, cy - 2) = (24, 14)
    // Safe distance = 10 tiles apart! Never spawns on player.
    GameState.P.x = cx;
    GameState.P.y = ay + ah - 3;
    GameState.P.vx = 0;
    GameState.P.vy = 0;
  }
};

export const buildBossArena = (floor) => BossArenaGenerator.build(floor);

if (typeof window !== 'undefined') {
  window.buildBossArena = buildBossArena;
  window.generateBossArena = buildBossArena;
}
