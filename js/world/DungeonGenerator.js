// =====================================================================
//  DUNGEON BREAK — js/world/DungeonGenerator.js
//  Authoritative Procedural Dungeon Generator, Corridors, & Path Validation
// =====================================================================

import { GameState } from '../core/GameState.js';
import { ROWS, COLS } from '../core/Constants.js';

function setFloor(r, c, map) {
  if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
    map[r][c] = 0;
  }
}

function carve2WCorr(a, b, map) {
  let x = a.cx, y = a.cy;
  if (Math.random() < 0.5) {
    while (x !== b.cx) {
      setFloor(y, x, map);
      setFloor(y + 1, x, map);
      x += x < b.cx ? 1 : -1;
    }
    while (y !== b.cy) {
      setFloor(y, x, map);
      setFloor(y, x + 1, map);
      y += y < b.cy ? 1 : -1;
    }
  } else {
    while (y !== b.cy) {
      setFloor(y, x, map);
      setFloor(y, x + 1, map);
      y += y < b.cy ? 1 : -1;
    }
    while (x !== b.cx) {
      setFloor(y, x, map);
      setFloor(y + 1, x, map);
      x += x < b.cx ? 1 : -1;
    }
  }
  setFloor(b.cy, b.cx, map);
}

export const DungeonGenerator = {
  build() {
    for (let attempt = 0; attempt < 50; attempt++) {
      const map = [];
      const rooms = [];
      for (let r = 0; r < ROWS; r++) {
        map.push(new Array(COLS).fill(1));
      }

      const targetRooms = 9 + Math.floor(Math.random() * 6);
      for (let tries = 0; tries < 350 && rooms.length < targetRooms; tries++) {
        const rw = 5 + Math.floor(Math.random() * 8);
        const rh = 4 + Math.floor(Math.random() * 6);
        const rx = 2 + Math.floor(Math.random() * (COLS - rw - 4));
        const ry = 2 + Math.floor(Math.random() * (ROWS - rh - 4));

        let overlap = false;
        for (const rm of rooms) {
          if (rx < rm.x + rm.w + 2 && rx + rw + 2 > rm.x && ry < rm.y + rm.h + 2 && ry + rh + 2 > rm.y) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          const type = Math.random() < 0.25 ? 'arena' : Math.random() < 0.25 ? 'cross' : 'rect';
          const cx = (rx + rw / 2) | 0;
          const cy = (ry + rh / 2) | 0;
          rooms.push({ x: rx, y: ry, w: rw, h: rh, cx, cy, type });

          for (let r = ry; r < ry + rh; r++) {
            for (let c = rx; c < rx + rw; c++) {
              map[r][c] = 0;
            }
          }

          if (type === 'arena' && rw >= 8 && rh >= 6) {
            map[ry + 2][rx + 2] = 1;
            map[ry + 2][rx + rw - 3] = 1;
            map[ry + rh - 3][rx + 2] = 1;
            map[ry + rh - 3][rx + rw - 3] = 1;
          } else if (type === 'cross' && rw >= 7 && rh >= 7) {
            map[ry][rx] = 1;
            map[ry][rx + rw - 1] = 1;
            map[ry + rh - 1][rx] = 1;
            map[ry + rh - 1][rx + rw - 1] = 1;
          }
        }
      }

      if (rooms.length < 8) continue;

      // Connect sequential rooms with 2-tile wide corridors
      for (let i = 0; i < rooms.length - 1; i++) {
        carve2WCorr(rooms[i], rooms[i + 1], map);
      }
      // Add extra interconnection branches for loops
      for (let i = 0; i < 4; i++) {
        const a = (Math.random() * rooms.length) | 0;
        const b = (Math.random() * rooms.length) | 0;
        if (a !== b) carve2WCorr(rooms[a], rooms[b], map);
      }

      const start = rooms[0];
      const goal = rooms[rooms.length - 1];
      map[goal.cy][goal.cx] = 2; // Portal tile

      // BFS reachability verification
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
            if (map[ny][nx] !== 1) {
              visited[ny * COLS + nx] = 1;
              q.push([nx, ny]);
            }
          }
        }
      }

      if (reached) {
        // Guaranteed path confirmed!
        GameState.MAP = map;
        GameState.ROOMS = rooms;
        GameState.P.x = start.cx;
        GameState.P.y = start.cy;
        GameState.P.vx = 0;
        GameState.P.vy = 0;
        this.placeTorches();
        return;
      }
    }
  },

  placeTorches() {
    GameState.TORCHES = [];
    GameState.ROOMS.forEach(rm => {
      [{ x: rm.x - 1, y: rm.cy }, { x: rm.x + rm.w, y: rm.cy }, { x: rm.cx, y: rm.y - 1 }, { x: rm.cx, y: rm.y + rm.h }].forEach(c => {
        if (c.y >= 0 && c.y < ROWS && c.x >= 0 && c.x < COLS && GameState.MAP[c.y][c.x] === 1 && Math.random() < 0.7) {
          GameState.TORCHES.push({ x: c.x, y: c.y, ph: Math.random() * 6.28 });
        }
      });
    });
  },

  rndFloor(minDist = 3) {
    const { ROOMS, MAP, P } = GameState;
    for (let i = 0; i < 500; i++) {
      const rm = ROOMS[(Math.random() * ROOMS.length) | 0];
      const x = rm.x + 1 + ((Math.random() * Math.max(1, rm.w - 2)) | 0);
      const y = rm.y + 1 + ((Math.random() * Math.max(1, rm.h - 2)) | 0);
      if (y > 0 && y < ROWS && x > 0 && x < COLS && MAP[y][x] === 0 && Math.hypot(x - P.x, y - P.y) >= minDist) {
        return { x, y };
      }
    }
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (MAP[r][c] === 0) return { x: c, y: r };
      }
    }
    return { x: ROOMS[0] ? ROOMS[0].cx : 5, y: ROOMS[0] ? ROOMS[0].cy : 5 };
  }
};

export const buildMap = () => DungeonGenerator.build();
export const rndFloor = (minDist) => DungeonGenerator.rndFloor(minDist);

if (typeof window !== 'undefined') {
  window.buildMap = buildMap;
  window.rndFloor = rndFloor;
}
