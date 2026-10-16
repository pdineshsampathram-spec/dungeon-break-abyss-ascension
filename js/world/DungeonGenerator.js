// =====================================================================
//  DUNGEON BREAK — js/world/DungeonGenerator.js
//  Authoritative Insane Procedural Dungeon Generator, Archetypes, & BFS
// =====================================================================

import { GameState } from '../core/GameState.js';
import { ROWS, COLS } from '../core/Constants.js';

// Tile Legend:
// 0 = Standard Stone Floor
// 1 = Solid Wall
// 2 = Cosmic Exit Portal
// 3 = Subterranean Chasm / Abyss Pit (impassable for ground entities, open to projectiles)
// 4 = Stone Bridge / Arch Walkway
// 5 = Ornate Ceremonial Aisle / Royal Stone Runner

function setTile(r, c, map, tile = 0) {
  if (r > 1 && r < ROWS - 2 && c > 1 && c < COLS - 2) {
    // If carving a corridor over a subterranean chasm, build a stone bridge!
    if (map[r][c] === 3 && tile === 0) {
      map[r][c] = 4;
      return;
    }
    // Preserve existing bridges and ceremonial aisle runners
    if ((map[r][c] === 4 || map[r][c] === 5) && tile === 0) {
      return;
    }
    map[r][c] = tile;
  }
}

function carveCorridor(a, b, map, width = 2) {
  let x = a.cx, y = a.cy;
  const carvePoint = (cy, cx) => {
    for (let dy = 0; dy < width; dy++) {
      for (let dx = 0; dx < width; dx++) {
        setTile(cy + dy, cx + dx, map, 0);
      }
    }
  };

  if (Math.random() < 0.5) {
    // X first, then Y
    const stepX = x < b.cx ? 1 : -1;
    while (x !== b.cx) {
      carvePoint(y, x);
      x += stepX;
    }
    const stepY = y < b.cy ? 1 : -1;
    while (y !== b.cy) {
      carvePoint(y, x);
      y += stepY;
    }
  } else {
    // Y first, then X
    const stepY = y < b.cy ? 1 : -1;
    while (y !== b.cy) {
      carvePoint(y, x);
      y += stepY;
    }
    const stepX = x < b.cx ? 1 : -1;
    while (x !== b.cx) {
      carvePoint(y, x);
      x += stepX;
    }
  }
  carvePoint(b.cy, b.cx);
}

export const DungeonGenerator = {
  build() {
    for (let attempt = 0; attempt < 60; attempt++) {
      const map = [];
      const rooms = [];
      for (let r = 0; r < ROWS; r++) {
        map.push(new Array(COLS).fill(1));
      }

      // Sprawling vast dungeon with 34 to 42 diverse architectural chambers (10x world scale)
      const targetRooms = 34 + Math.floor(Math.random() * 8);
      const archetypes = [
        'cathedral', 'chasm_cavern', 'sacrificial_sanctuary', 'crypt_vault',
        'ruined_labyrinth', 'grand_hall', 'cross_hub', 'treasure_vault', 'rect'
      ];

      for (let tries = 0; tries < 2000 && rooms.length < targetRooms; tries++) {
        // First room (Spawn) is clean and spacious
        const isFloor1 = (GameState.LV === 1);
        const isSpawn = rooms.length === 0;
        const rw = isSpawn ? (isFloor1 ? 10 : 9) : (7 + Math.floor(Math.random() * 10));
        const rh = isSpawn ? 8 : (6 + Math.floor(Math.random() * 8));
        let rx, ry;
        if (isFloor1) {
          if (isSpawn) {
            rx = 6;
            ry = 12;
          } else if (rooms.length === 1) {
            rx = 20 + Math.floor(Math.random() * 10);
            ry = 10 + Math.floor(Math.random() * 8);
          } else {
            rx = 2 + Math.floor(Math.random() * (COLS - rw - 4));
            ry = 2 + Math.floor(Math.random() * (ROWS - rh - 4));
          }
        } else {
          rx = isSpawn ? (5 + Math.floor(Math.random() * (COLS - rw - 10))) : (2 + Math.floor(Math.random() * (COLS - rw - 4)));
          ry = 2 + Math.floor(Math.random() * (ROWS - rh - 4));
        }

        let overlap = false;
        for (const rm of rooms) {
          if (rx < rm.x + rm.w + 2 && rx + rw + 2 > rm.x && ry < rm.y + rm.h + 2 && ry + rh + 2 > rm.y) {
            overlap = true;
            break;
          }
        }
        // Protect west surface tunnel on Floor 1 (x = 2..5, y = 14..17)
        if (isFloor1 && rx < 6 && ry < 18 && ry + rh > 14) {
          overlap = true;
        }

        if (!overlap) {
          let type;
          if (isSpawn) {
            type = 'rect';
          } else if (rooms.length === 1) {
            type = 'cathedral';
          } else if (rooms.length === 2) {
            type = 'chasm_cavern';
          } else if (rooms.length === 3) {
            type = 'sacrificial_sanctuary';
          } else if (rooms.length === 4) {
            type = 'crypt_vault';
          } else if (rooms.length === 5) {
            type = 'ruined_labyrinth';
          } else {
            type = archetypes[Math.floor(Math.random() * archetypes.length)];
          }
          const cx = (rx + rw / 2) | 0;
          const cy = (ry + rh / 2) | 0;
          const roomObj = { x: rx, y: ry, w: rw, h: rh, cx, cy, type, pillars: [] };
          rooms.push(roomObj);

          // Carve base room floor
          for (let r = ry; r < ry + rh; r++) {
            for (let c = rx; c < rx + rw; c++) {
              map[r][c] = 0;
            }
          }

          // On Floor 1, carve the west deserter escape tunnel behind Room 0 (x = 2..5)
          if (isSpawn && isFloor1) {
            for (let ex = 2; ex < rx; ex++) {
              map[15][ex] = 0;
              map[16][ex] = 0;
              map[14][ex] = 1;
              map[17][ex] = 1;
            }
            map[14][1] = 1; map[15][1] = 1; map[16][1] = 1; map[17][1] = 1;
          }

          // ─────────────────────────────────────────────────────────────
          // ARCHITECTURAL BLUEPRINTS
          // ─────────────────────────────────────────────────────────────

          // 1. GRAND CATHEDRAL BASILICA — Double colonnade + royal aisle runner
          if (type === 'cathedral' && rw >= 7 && rh >= 6) {
            // Paired stone columns flanking central aisle
            const colX1 = rx + 2;
            const colX2 = rx + rw - 3;
            for (let r = ry + 2; r <= ry + rh - 3; r += 2) {
              map[r][colX1] = 1;
              map[r][colX2] = 1;
              roomObj.pillars.push({ x: colX1, y: r });
              roomObj.pillars.push({ x: colX2, y: r });
            }
            // Royal Ceremonial Aisle Runner (Tile 5)
            for (let r = ry + 1; r < ry + rh - 1; r++) {
              if (map[r][cx] === 0) map[r][cx] = 5;
            }
          }

          // 2. CHASM CAVERN — Split by subterranean abyss with stone bridge
          else if (type === 'chasm_cavern' && rw >= 6 && rh >= 5) {
            const splitHoriz = rw > rh;
            if (splitHoriz) {
              // Vertical chasm channel cutting across room
              const chasmX1 = cx - 1;
              const chasmX2 = cx;
              for (let r = ry; r < ry + rh; r++) {
                map[r][chasmX1] = 3; // Chasm
                map[r][chasmX2] = 3;
              }
              // Central stone bridge spanning the chasm (Tile 4)
              map[cy - 1][chasmX1] = 4; map[cy - 1][chasmX2] = 4;
              map[cy][chasmX1] = 4;     map[cy][chasmX2] = 4;
              map[cy + 1][chasmX1] = 4; map[cy + 1][chasmX2] = 4;
            } else {
              // Horizontal chasm channel cutting across room
              const chasmY1 = cy - 1;
              const chasmY2 = cy;
              for (let c = rx; c < rx + rw; c++) {
                map[chasmY1][c] = 3;
                map[chasmY2][c] = 3;
              }
              // Central stone bridge spanning the chasm
              map[chasmY1][cx - 1] = 4; map[chasmY2][cx - 1] = 4;
              map[chasmY1][cx] = 4;     map[chasmY2][cx] = 4;
              map[chasmY1][cx + 1] = 4; map[chasmY2][cx + 1] = 4;
            }
          }

          // 3. SACRIFICIAL SANCTUARY — Octagonal rotunda with central altar dais
          else if (type === 'sacrificial_sanctuary' && rw >= 7 && rh >= 7) {
            // Cut corners for octagonal rotunda shape
            map[ry][rx] = 1;
            map[ry][rx + rw - 1] = 1;
            map[ry + rh - 1][rx] = 1;
            map[ry + rh - 1][rx + rw - 1] = 1;

            // Central ceremonial dais runner ring (Tile 5)
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                map[cy + dy][cx + dx] = 5;
              }
            }
          }

          // 4. CATACOMB CRYPT VAULTS — Recessed burial niches & stone sarcophagi
          else if (type === 'crypt_vault' && rw >= 8 && rh >= 6) {
            // Interior sarcophagus pillars
            map[ry + 2][rx + 2] = 1;
            map[ry + 2][rx + rw - 3] = 1;
            map[ry + rh - 3][rx + 2] = 1;
            map[ry + rh - 3][rx + rw - 3] = 1;
            roomObj.pillars.push({ x: rx + 2, y: ry + 2 });
            roomObj.pillars.push({ x: rx + rw - 3, y: ry + 2 });
            roomObj.pillars.push({ x: rx + 2, y: ry + rh - 3 });
            roomObj.pillars.push({ x: rx + rw - 3, y: ry + rh - 3 });
          }

          // 5. RUINED LABYRINTH — Broken interior L-walls providing dynamic cover
          else if (type === 'ruined_labyrinth' && rw >= 9 && rh >= 7) {
            // Top-left ruin barrier
            map[ry + 2][rx + 3] = 1;
            map[ry + 3][rx + 3] = 1;
            // Bottom-right ruin barrier
            map[ry + rh - 3][rx + rw - 4] = 1;
            map[ry + rh - 4][rx + rw - 4] = 1;
            roomObj.pillars.push({ x: rx + 3, y: ry + 2 });
            roomObj.pillars.push({ x: rx + rw - 4, y: ry + rh - 3 });
          }

          // 6. GRAND BASILICA HALL — Colonnade corridors and wide ceremonial floor
          else if (type === 'grand_hall' && rw >= 8 && rh >= 6) {
            const colX1 = rx + 2;
            const colX2 = rx + rw - 3;
            for (let r = ry + 2; r <= ry + rh - 3; r += 2) {
              map[r][colX1] = 1;
              map[r][colX2] = 1;
              roomObj.pillars.push({ x: colX1, y: r });
              roomObj.pillars.push({ x: colX2, y: r });
            }
            for (let c = rx + 2; c < rx + rw - 2; c++) {
              if (map[cy][c] === 0) map[cy][c] = 5;
            }
          }

          // 7. CROSSROAD HUB — 4-way intersection chamber with central raised dais
          else if (type === 'cross_hub' && rw >= 7 && rh >= 7) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                map[cy + dy][cx + dx] = 5;
              }
            }
          }

          // 8. TREASURE VAULT — Fortified sarcophagi and corner columns
          else if (type === 'treasure_vault' && rw >= 7 && rh >= 6) {
            map[ry + 2][rx + 2] = 1;
            map[ry + 2][rx + rw - 3] = 1;
            map[ry + rh - 3][rx + 2] = 1;
            map[ry + rh - 3][rx + rw - 3] = 1;
            roomObj.pillars.push({ x: rx + 2, y: ry + 2 });
            roomObj.pillars.push({ x: rx + rw - 3, y: ry + 2 });
            roomObj.pillars.push({ x: rx + 2, y: ry + rh - 3 });
            roomObj.pillars.push({ x: rx + rw - 3, y: ry + rh - 3 });
            if (map[cy][cx] === 0) map[cy][cx] = 5;
          }
        }
      }

      if (rooms.length < 24) continue;

      // Connect sequential rooms with wide, navigable corridors
      for (let i = 0; i < rooms.length - 1; i++) {
        if (GameState.LV === 1 && i === 0) {
          // Explicit east-heading forward corridor out of Room 0
          for (let x = rooms[0].x + rooms[0].w - 1; x <= rooms[1].cx; x++) {
            setTile(15, x, map, 0);
            setTile(16, x, map, 0);
          }
          const stepY = 15 < rooms[1].cy ? 1 : -1;
          let y = 15;
          while (y !== rooms[1].cy) {
            setTile(y, rooms[1].cx, map, 0);
            setTile(y, rooms[1].cx + 1, map, 0);
            y += stepY;
          }
          setTile(rooms[1].cy, rooms[1].cx, map, 0);
          setTile(rooms[1].cy, rooms[1].cx + 1, map, 0);
        } else {
          carveCorridor(rooms[i], rooms[i + 1], map, 2);
        }
      }

      // Add extra cross-corridors for multi-pathing and flanking loops across vast world
      const extraLoops = Math.min(18, Math.floor(rooms.length / 2));
      for (let i = 0; i < extraLoops; i++) {
        const a = (Math.random() * rooms.length) | 0;
        const b = (Math.random() * rooms.length) | 0;
        if (a !== b && Math.abs(a - b) > 1) {
          carveCorridor(rooms[a], rooms[b], map, 2);
        }
      }

      const start = rooms[0];
      // Place cosmic exit portal in the furthest room from spawn for expansive exploration
      let maxDist = 0;
      let goal = rooms[rooms.length - 1];
      for (let i = 0; i < rooms.length; i++) {
        rooms[i].isPortalRoom = false;
        if (i > 0) {
          const d = Math.hypot(rooms[i].cx - start.cx, rooms[i].cy - start.cy);
          if (d > maxDist) {
            maxDist = d;
            goal = rooms[i];
          }
        }
      }
      goal.isPortalRoom = true;
      map[goal.cy][goal.cx] = 2; // Portal Tile

      // BFS Reachability Verification across entire dungeon
      const visited = new Uint8Array(COLS * ROWS);
      const q = [[start.cx, start.cy]];
      visited[start.cy * COLS + start.cx] = 1;
      let reached = false;

      while (q.length > 0) {
        const [cx, cy] = q.shift();
        if (cx === goal.cx && cy === goal.cy) {
          reached = true;
          break;
        }
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny * COLS + nx]) {
            const t = map[ny][nx];
            // Walkable: Floor 0, Portal 2, Bridge 4, Runner 5 (Not Wall 1, Not Chasm 3)
            if (t !== 1 && t !== 3) {
              visited[ny * COLS + nx] = 1;
              q.push([nx, ny]);
            }
          }
        }
      }

      if (reached) {
        if (GameState.LV === 1) {
          GameState.GATE = {
            id: 'entrance_gate',
            type: 'iron_portcullis',
            x: 6,
            y: 15,
            width: 1,
            height: 2,
            state: 'open',
            dropProgress: 0.0,
            leverProgress: 0.0,
            dustExploded: false,
            solid: false
          };
          GameState.GATES = [GameState.GATE];
          GameState.P.x = 9.5;
          GameState.P.y = 15.5;
        } else {
          GameState.GATE = null;
          GameState.GATES = [];
          GameState.P.x = start.cx;
          GameState.P.y = start.cy;
        }
        GameState.MAP = map;
        GameState.ROOMS = rooms;
        GameState.P.vx = 0;
        GameState.P.vy = 0;

        if (GameState.LV === 1 && !this.validateOpeningScene()) {
          continue;
        }

        this.placeTorches();
        return;
      }
    }
  },

  placeTorches() {
    GameState.TORCHES = [];
    GameState.ROOMS.forEach(rm => {
      // 1. Pillar torches inside grand rooms
      if (rm.pillars && rm.pillars.length > 0) {
        rm.pillars.forEach(p => {
          if (Math.random() < 0.65) {
            GameState.TORCHES.push({ x: p.x, y: p.y, ph: Math.random() * 6.28, isPillar: true });
          }
        });
      }

      // 2. Perimeter wall sconces
      const wallCandidates = [
        { x: rm.x - 1, y: rm.cy },
        { x: rm.x + rm.w, y: rm.cy },
        { x: rm.cx, y: rm.y - 1 },
        { x: rm.cx, y: rm.y + rm.h }
      ];
      wallCandidates.forEach(c => {
        if (c.y >= 0 && c.y < ROWS && c.x >= 0 && c.x < COLS && GameState.MAP[c.y][c.x] === 1 && Math.random() < 0.6) {
          GameState.TORCHES.push({ x: c.x, y: c.y, ph: Math.random() * 6.28 });
        }
      });
    });
  },

  rndFloor(minDist = 3, allowBridge = false) {
    const { ROOMS, MAP, P } = GameState;
    // Walkable tile check helper: floor 0, or runner 5 (bridge 4 only if allowBridge is true)
    const isWalkable = (x, y) => {
      if (y < 0 || y >= ROWS || x < 0 || x >= COLS || !MAP[y]) return false;
      const t = MAP[y][x];
      if (t === 0 || t === 5) return true;
      if (allowBridge && t === 4) return true;
      return false;
    };

    for (let i = 0; i < 500; i++) {
      const rm = ROOMS[(Math.random() * ROOMS.length) | 0];
      const x = rm.x + 1 + ((Math.random() * Math.max(1, rm.w - 2)) | 0);
      const y = rm.y + 1 + ((Math.random() * Math.max(1, rm.h - 2)) | 0);
      if (isWalkable(x, y) && Math.hypot(x - P.x, y - P.y) >= minDist) {
        return { x, y };
      }
    }
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (isWalkable(c, r)) return { x: c, y: r };
      }
    }
    return { x: ROOMS[0] ? ROOMS[0].cx : 5, y: ROOMS[0] ? ROOMS[0].cy : 5 };
  },

  rndFloorOpen(minDist = 3) {
    const { ROOMS, MAP, P } = GameState;
    const isOpenFloor = (x, y) => {
      if (y < 1 || y >= ROWS - 1 || x < 1 || x >= COLS - 1 || !MAP[y]) return false;
      if (MAP[y][x] !== 0) return false;
      // Guarantee that all 8 neighbor tiles are solid floor (no walls, no chasms, no bridges)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const t = MAP[y + dy][x + dx];
          if (t !== 0 && t !== 5) return false;
        }
      }
      return true;
    };

    for (let i = 0; i < 500; i++) {
      const rm = ROOMS[(Math.random() * ROOMS.length) | 0];
      const x = rm.x + 2 + ((Math.random() * Math.max(1, rm.w - 4)) | 0);
      const y = rm.y + 2 + ((Math.random() * Math.max(1, rm.h - 4)) | 0);
      if (isOpenFloor(x, y) && Math.hypot(x - P.x, y - P.y) >= minDist) {
        return { x, y };
      }
    }
    for (let r = 2; r < ROWS - 2; r++) {
      for (let c = 2; c < COLS - 2; c++) {
        if (isOpenFloor(c, r) && Math.hypot(c - P.x, r - P.y) >= minDist) {
          return { x: c, y: r };
        }
      }
    }
    return this.rndFloor(minDist, false);
  },

  // ─────────────────────────────────────────────────────────────
  // AUTHORITATIVE OPENING SCENE VALIDATION (Part 34 & 35)
  // Ensures Floor 1 spawn geography guarantees:
  // 1. Gate exists and is behind Rowan (to the west)
  // 2. Doorway threshold is valid
  // 3. Deserter exit route exists to the west (x = 2..5)
  // 4. Forward path exists to the east
  // 5. Skeleton entry corridor exists at x = 18..22
  // 6. Dungeon path to goal portal is 100% reachable even with gate sealed
  // ─────────────────────────────────────────────────────────────
  validateOpeningScene() {
    const gate = GameState.GATE;
    const P = GameState.P;
    const map = GameState.MAP;
    const rooms = GameState.ROOMS;
    if (!gate || !P || !map || !rooms || rooms.length === 0) return false;

    // 1. Gate exists and is behind Rowan (West of Rowan)
    if (gate.x >= P.x) return false;

    // 2. Doorway threshold is valid
    if (gate.y < 2 || gate.y + (gate.height || 2) >= ROWS - 2) return false;

    // 3. Deserter exit route exists to the west (x = 2..5)
    for (let x = 2; x < gate.x; x++) {
      if (map[gate.y][x] === 1 || map[gate.y + 1][x] === 1) return false;
    }

    // 4. Forward path exists to the east
    const fwdX = Math.floor(P.x) + 4;
    const fwdY = Math.floor(P.y);
    if (map[fwdY][fwdX] === 1 && map[fwdY + 1][fwdX] === 1) return false;

    // 5. Skeleton corridor exists and has walkable floor at x = 18..22
    let skCorridorWalkable = false;
    for (let x = 18; x <= 22; x++) {
      if (map[15][x] === 0 || map[16][x] === 0) {
        skCorridorWalkable = true;
        break;
      }
    }
    if (!skCorridorWalkable) return false;

    // 6. Reachability to goal with gate closed (gate solid = true)
    const goal = rooms[rooms.length - 1];
    if (!goal) return false;

    const visited = new Uint8Array(COLS * ROWS);
    const q = [[Math.floor(P.x), Math.floor(P.y)]];
    visited[Math.floor(P.y) * COLS + Math.floor(P.x)] = 1;
    let reachedGoal = false;

    while (q.length > 0) {
      const [cx, cy] = q.shift();
      if (cx === goal.cx && cy === goal.cy) {
        reachedGoal = true;
        break;
      }
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = cx + dx, ny = cy + dy;
        // Sealed Gate blocks x = gate.x, y in [gate.y, gate.y + height]
        if (nx === gate.x && ny >= gate.y && ny < gate.y + (gate.height || 2)) {
          continue;
        }
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny * COLS + nx]) {
          const t = map[ny][nx];
          if (t !== 1 && t !== 3) {
            visited[ny * COLS + nx] = 1;
            q.push([nx, ny]);
          }
        }
      }
    }

    return reachedGoal;
  },

  rndTrapFloor(minDist = 4) {
    const { ROOMS, MAP, LV } = GameState;
    if (!ROOMS || ROOMS.length === 0) return null;
    const candidateRooms = ROOMS.length > 1 ? ROOMS.slice(1) : ROOMS;
    for (let i = 0; i < 200; i++) {
      const rm = candidateRooms[(Math.random() * candidateRooms.length) | 0];
      const x = rm.x + 1 + ((Math.random() * Math.max(1, rm.w - 2)) | 0);
      const y = rm.y + 1 + ((Math.random() * Math.max(1, rm.h - 2)) | 0);
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS && MAP[y]) {
        const t = MAP[y][x];
        if ((t === 0 || t === 5) && !isInOpeningSafeZone(x, y, LV)) {
          return { x, y };
        }
      }
    }
    for (let r = 2; r < ROWS - 2; r++) {
      for (let c = 2; c < COLS - 2; c++) {
        const t = MAP[r] ? MAP[r][c] : 1;
        if ((t === 0 || t === 5) && !isInOpeningSafeZone(c, r, LV)) {
          return { x: c, y: r };
        }
      }
    }
    return null;
  }
};

/**
 * Authoritative Opening Safe Zone definition.
 * Strictly prevents traps from spawning, activating, or rendering inside the initial dungeon safe zone.
 *
 * Safe zone boundaries:
 * 1. Player spawn point & immediate movement radius (minDist: 6.5 tiles on Floor 1, 5.5 on normal floors)
 * 2. On Floor 1:
 *    - West deserter escape tunnel & portcullis gate (x: 2..7, y: 12..19)
 *    - Spawn chamber (Room 0) with 1-tile safety perimeter (x: rm0.x - 1 .. rm0.x + rm0.w, y: rm0.y - 1 .. rm0.y + rm0.h)
 *    - East introductory forward corridor leading to Room 1 entrance (x: rm0.x .. rm1.x, y: 13..18)
 * 3. On Normal Floors (2+):
 *    - Spawn chamber (Room 0) with 1-tile perimeter
 *    - Radial spawn sanctuary of 5.5 tiles around Room 0 center
 *
 * @param {number} x Tile X coordinate
 * @param {number} y Tile Y coordinate
 * @param {number} [lv] Floor level (defaults to GameState.LV || 1)
 * @returns {boolean} True if within safe zone
 */
export function isInOpeningSafeZone(x, y, lv = (GameState.LV || 1)) {
  const rooms = GameState.ROOMS;
  if (!rooms || rooms.length === 0) {
    // If rooms not generated yet, clearance around standard Floor 1 spawn
    return Math.hypot(x - 9.5, y - 15.5) < 6.5;
  }

  const rm0 = rooms[0];

  // 1. Authoritative Floor 1 Opening Dungeon Boundaries
  if (lv === 1) {
    // 1a. Rowan's initial spawn location and immediate surrounding movement area (9.5, 15.5)
    if (Math.hypot(x - 9.5, y - 15.5) < 6.5) {
      return true;
    }

    // 1b. West deserter escape tunnel & portcullis gate region (x <= 7, y: 12..19)
    if (x <= (rm0.x + 1) && y >= 12 && y <= 19) {
      return true;
    }

    // 1c. Opening chamber (Room 0) with 1-tile perimeter safety buffer
    if (x >= rm0.x - 1 && x <= (rm0.x + rm0.w) && y >= rm0.y - 1 && y <= (rm0.y + rm0.h)) {
      return true;
    }

    // 1d. East introductory forward corridor leading to Room 1 entrance
    const rm1 = rooms[1];
    const rm1StartX = rm1 ? rm1.x : 18;
    if (x >= rm0.x && x < rm1StartX && y >= 13 && y <= 18) {
      return true;
    }

    return false;
  }

  // 2. Normal dungeon floors (Floor 2+): Spawn chamber (Room 0) is protected sanctuary
  if (rm0) {
    // Immediate surrounding movement area around spawn center (rm0.cx, rm0.cy)
    if (Math.hypot(x - rm0.cx, y - rm0.cy) < 5.5) {
      return true;
    }
    // Room 0 bounds with 1-tile perimeter
    if (x >= rm0.x - 1 && x <= (rm0.x + rm0.w) && y >= rm0.y - 1 && y <= (rm0.y + rm0.h)) {
      return true;
    }
  }

  return false;
}

export const buildMap = () => DungeonGenerator.build();
export const rndFloor = (minDist, allowBridge) => DungeonGenerator.rndFloor(minDist, allowBridge);
export const rndFloorOpen = (minDist) => DungeonGenerator.rndFloorOpen(minDist);
export const rndTrapFloor = (minDist) => DungeonGenerator.rndTrapFloor(minDist);

if (typeof window !== 'undefined') {
  window.buildMap = buildMap;
  window.rndFloor = rndFloor;
  window.rndFloorOpen = rndFloorOpen;
  window.rndTrapFloor = rndTrapFloor;
  window.isInOpeningSafeZone = isInOpeningSafeZone;
}

