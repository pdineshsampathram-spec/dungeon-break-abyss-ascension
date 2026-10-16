// =====================================================================
//  DUNGEON BREAK — js/world/BossArenaGenerator.js
//  Authoritative Dedicated Arenas: Gorgaroth, Malakor, & Abyss Warden Throne Room
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

    if (floor === 10) {
      this.buildAbyssWardenThroneRoom();
    } else if (floor === 6) {
      this.buildMalakorVoidSanctum();
    } else {
      this.buildGorgarothIronJail();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // FLOOR 3: GORGAROTH'S IRON JAIL (34x22)
  // ─────────────────────────────────────────────────────────────
  buildGorgarothIronJail() {
    const aw = 34, ah = 22;
    const ax = ((COLS - aw) / 2) | 0;
    const ay = ((ROWS - ah) / 2) | 0;
    const cx = ax + (aw / 2) | 0;
    const cy = ay + (ah / 2) | 0;

    // Carve main chamber
    for (let r = ay; r < ay + ah; r++) {
      for (let c = ax; c < ax + aw; c++) {
        GameState.MAP[r][c] = 0;
      }
    }

    // Heavy iron pillars
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

    // Wall-mounted torches for ancient vaulted atmosphere
    const wallTorches = [
      [cx - 7, ay + 1], [cx + 7, ay + 1],
      [ax + 1, cy - 4], [ax + 1, cy + 4],
      [ax + aw - 2, cy - 4], [ax + aw - 2, cy + 4],
      [cx - 3, ay + ah - 2], [cx + 3, ay + ah - 2]
    ];
    wallTorches.forEach(([c, r]) => {
      if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
        GameState.TORCHES.push({ x: c, y: r, ph: Math.random() * 6.28 });
      }
    });

    // Heavy iron entrance gate at south threshold (closed during intro Shot 2)
    const gateX = cx - 1;
    const gateY = ay + ah - 2;
    GameState.GATE = {
      id: 'gorgaroth_entrance_gate',
      type: 'iron_portcullis',
      x: gateX,
      y: gateY,
      width: 2,
      height: 2,
      state: 'open',
      dropProgress: 0.0,
      leverProgress: 0.0,
      dustExploded: false,
      solid: false
    };
    GameState.GATES = [GameState.GATE];

    // Exit portal at top dais (authored and spawned solely by GorgarothCinematics upon defeat)
    GameState.MAP[ay + 2][cx] = 0;
    GameState.ROOMS = [{
      x: ax, y: ay, w: aw, h: ah, cx, cy,
      type: 'gorgaroth_arena',
      floorRunes: true,
      wallChains: [
        [cx - 10, ay + 1], [cx + 10, ay + 1],
        [ax + 1, cy], [ax + aw - 2, cy]
      ],
      winches: [
        [cx - 10, cy - 5], [cx + 10, cy - 5]
      ]
    }];

    // Safe spawn separation: Player at bottom entrance, Boss in center
    GameState.P.x = cx;
    GameState.P.y = ay + ah - 3;
    GameState.P.vx = 0;
    GameState.P.vy = 0;
  },

  // ─────────────────────────────────────────────────────────────
  // FLOOR 6: MALAKOR'S VOID SANCTUM (36x24)
  // ─────────────────────────────────────────────────────────────
  buildMalakorVoidSanctum() {
    const aw = 36, ah = 24;
    const ax = ((COLS - aw) / 2) | 0;
    const ay = ((ROWS - ah) / 2) | 0;
    const cx = ax + (aw / 2) | 0;
    const cy = ay + (ah / 2) | 0;

    // Carve chamber with beveled corners
    for (let r = ay; r < ay + ah; r++) {
      for (let c = ax; c < ax + aw; c++) {
        // Corner bevels
        const isCorner =
          (r === ay && (c < ax + 3 || c > ax + aw - 4)) ||
          (r === ay + ah - 1 && (c < ax + 3 || c > ax + aw - 4));
        if (!isCorner) {
          GameState.MAP[r][c] = 0;
        }
      }
    }

    // Arcane obelisks with void sconces
    const obelisks = [
      [cx - 10, cy - 6], [cx + 10, cy - 6],
      [cx - 10, cy + 6], [cx + 10, cy + 6],
      [cx - 13, cy],     [cx + 13, cy]
    ];
    obelisks.forEach(([c, r]) => {
      if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
        GameState.MAP[r][c] = 1;
        GameState.TORCHES.push({ x: c, y: r, ph: Math.random() * 6.28, isVoid: true });
      }
    });

    GameState.MAP[ay + 2][cx] = 2;
    // A small stable pocket at the entrance: it only shelters Rowan from
    // Malakor's ambient pressure, never from his projectiles.
    GameState.ROOMS = [{
      x: ax, y: ay, w: aw, h: ah, cx, cy, type: 'malakor_arena',
      voidSafeArea: { x: cx, y: ay + ah - 4, r: 2.15 }
    }];

    GameState.P.x = cx;
    GameState.P.y = ay + ah - 3;
    GameState.P.vx = 0;
    GameState.P.vy = 0;
  },

  // ─────────────────────────────────────────────────────────────
  // FLOOR 10: THE ABYSS WARDEN'S THRONE CHAMBER (38x26)
  // ─────────────────────────────────────────────────────────────
  buildAbyssWardenThroneRoom() {
    const aw = 38, ah = 26;
    const ax = ((COLS - aw) / 2) | 0;
    const ay = ((ROWS - ah) / 2) | 0;
    const cx = ax + (aw / 2) | 0;
    const cy = ay + (ah / 2) | 0;

    // Carve massive circular/octagonal chamber
    for (let r = ay; r < ay + ah; r++) {
      for (let c = ax; c < ax + aw; c++) {
        // Circular distance mask for grand circular throne hall
        const dx = (c - cx) / (aw / 2 - 1);
        const dy = (r - cy) / (ah / 2 - 1);
        if (dx * dx + dy * dy < 0.96) {
          GameState.MAP[r][c] = 0;
        }
      }
    }

    // Colossal Pillars flanking the grand royal carpet
    const grandPillars = [
      [cx - 9, cy - 8],  [cx + 9, cy - 8],
      [cx - 11, cy - 3], [cx + 11, cy - 3],
      [cx - 11, cy + 3], [cx + 11, cy + 3],
      [cx - 9, cy + 8],  [cx + 9, cy + 8]
    ];
    grandPillars.forEach(([c, r]) => {
      if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
        GameState.MAP[r][c] = 1;
        GameState.TORCHES.push({ x: c, y: r, ph: Math.random() * 6.28, isGrand: true });
      }
    });

    // Central Stone Throne Dais where the Warden awaits
    const throneY = cy - 6;

    // Royal Ceremonial Carpet Runner leading from entrance directly to and across throne dais (3 tiles wide)
    for (let r = throneY - 2; r <= ay + ah - 3; r++) {
      if (GameState.MAP[r]) {
        GameState.MAP[r][cx - 1] = 5;
        GameState.MAP[r][cx] = 5;
        GameState.MAP[r][cx + 1] = 5;
      }
    }

    // Grand Braziers flanking the throne dais
    GameState.TORCHES.push({ x: cx - 3, y: throneY, ph: 0, isGrand: true, isThrone: true });
    GameState.TORCHES.push({ x: cx + 3, y: throneY, ph: 3.14, isGrand: true, isThrone: true });
    GameState.TORCHES.push({ x: cx - 2, y: throneY - 2, ph: 1.57, isThrone: true });
    GameState.TORCHES.push({ x: cx + 2, y: throneY - 2, ph: 4.71, isThrone: true });

    // Ascension Portal located directly upon the throne dais (revealed dynamically upon Warden defeat)
    GameState.MAP[throneY][cx] = 5;
    GameState.MAP[throneY - 1][cx] = 5;
    GameState.ROOMS = [{
      x: ax, y: ay, w: aw, h: ah, cx, cy, throneX: cx, throneY,
      type: 'throne_room',
      pillars: grandPillars,
      wallChains: [
        [cx - 8, ay + 2], [cx + 8, ay + 2],
        [ax + 3, cy - 4], [ax + aw - 4, cy - 4],
        [ax + 3, cy + 4], [ax + aw - 4, cy + 4]
      ]
    }];

    // Rowan enters at bottom archway; Warden is positioned at throne
    // Guaranteed separation: 16 full tiles!
    GameState.P.x = cx;
    GameState.P.y = ay + ah - 4;
    GameState.P.vx = 0;
    GameState.P.vy = 0;
  }
};

export const buildBossArena = (floor) => BossArenaGenerator.build(floor);

if (typeof window !== 'undefined') {
  window.buildBossArena = buildBossArena;
  window.generateBossArena = buildBossArena;
}
