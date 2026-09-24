// =====================================================================
//  DUNGEON BREAK — js/world/FloorManager.js
//  Authoritative Floor Loading, Level Progression, & Population Coordinator
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { Config } from '../core/Config.js';
import { isBossFloor, getFloorBoss, FLOOR_CONFIG } from '../data/floors.js';
import { WK, rollRarity } from '../data/weapons.js';
import { DungeonGenerator, rndFloor } from './DungeonGenerator.js';
import { BossArenaGenerator } from './BossArenaGenerator.js';
import { BossManager } from '../bosses/BossManager.js';
import { RelicSystem } from '../systems/RelicSystem.js';
import { getStoryMemoryForFloor } from '../data/memories.js';
import { LORE_SCROLLS_DATA } from '../data/lore.js';
import { EventBus } from '../core/EventBus.js';

export const FloorManager = {
  loadLevel(lv) {
    if (lv !== undefined) GameState.LV = lv;
    const { P, LV } = GameState;

    GameState.clearLevelEntities();
    GameState.FADE = 1;
    GameState.FADEIN = true;

    const diff = Config.getDiff(LV);

    if (isBossFloor(LV)) {
      BossArenaGenerator.build(LV);
    } else {
      DungeonGenerator.build();
    }

    // Safe spawn: Arena placed player at bottom (cx, 24); normal map uses Room 0 center
    if (!isBossFloor(LV) && GameState.ROOMS[0]) {
      P.x = GameState.ROOMS[0].cx;
      P.y = GameState.ROOMS[0].cy;
    }
    P.vx = 0;
    P.vy = 0;
    P.icd = 1.5;
    P.acd = 0;
    P.aanim = 0;
    P.dcd = 0;
    P.hitFlash = 0;
    P.shieldActive = false;
    P.shieldTimer = 0;
    P.dead = false;
    P.animState = 'idle';
    P.animTimer = 0;

    // Relic trigger on entering new floor
    RelicSystem.onFloorEnter();

    // Populate Normal Floors
    GameState.ENE = [];
    if (!isBossFloor(LV)) {
      const BASE_HP = { skeleton: 3, ghoul: 4, demon: 6, wraith: 5 };
      const FLOOR_HP_MULT = 1 + (LV - 1) * 0.22;

      for (let i = 0; i < diff.ec; i++) {
        const pos = rndFloor(7);
        const roll = Math.random();
        let type = 'skeleton';
        if (LV <= 2) type = roll < 0.6 ? 'skeleton' : 'ghoul';
        else if (LV <= 4) type = roll < 0.4 ? 'skeleton' : roll < 0.75 ? 'ghoul' : 'demon';
        else if (LV <= 7) type = roll < 0.25 ? 'skeleton' : roll < 0.55 ? 'ghoul' : roll < 0.82 ? 'demon' : 'wraith';
        else type = roll < 0.15 ? 'skeleton' : roll < 0.4 ? 'ghoul' : roll < 0.68 ? 'demon' : 'wraith';

        let hp = Math.round(BASE_HP[type] * FLOOR_HP_MULT);
        let isElite = false;
        if (LV >= 4 && Math.random() < 0.15) {
          hp = Math.round(hp * 1.6);
          isElite = true;
        }

        GameState.ENE.push({
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
          alive: true,
          hp,
          maxHp: hp,
          type,
          alertT: 0,
          atkC: 0,
          ph: Math.random() * 6.28,
          dAnim: 0,
          hitFlash: 0,
          animState: 'idle',
          animTimer: 0,
          walkCycle: 0,
          isElite,
          telegraphing: false,
          telegraphTimer: 0
        });
      }
    }

    // Allies / Survivors
    GameState.ALLIES = [];
    for (let i = 0; i < 1 + Math.floor(LV / 3); i++) {
      const p = rndFloor(7);
      GameState.ALLIES.push({ x: p.x, y: p.y, rescued: false, ph: Math.random() * 6.28 });
    }

    // Items, Weapons, & Consumables
    GameState.ITEMS = [];
    {
      const p = rndFloor(4);
      const sub = WK[(Math.random() * WK.length) | 0];
      GameState.ITEMS.push({ x: p.x, y: p.y, taken: false, kind: 'weapon', sub, rarity: rollRarity() });
    }
    if (LV >= 3) {
      const p = rndFloor(5);
      const sub = WK[(Math.random() * WK.length) | 0];
      GameState.ITEMS.push({ x: p.x, y: p.y, taken: false, kind: 'weapon', sub, rarity: rollRarity() });
    }
    if (LV > 2 || Math.random() < 0.5) {
      const p = rndFloor(5);
      GameState.ITEMS.push({ x: p.x, y: p.y, taken: false, kind: 'health' });
    }
    if (LV >= 5 && Math.random() < 0.5) {
      const p = rndFloor(6);
      GameState.ITEMS.push({ x: p.x, y: p.y, taken: false, kind: 'health' });
    }
    if (LV >= 3 && Math.random() < 0.5) {
      const p = rndFloor(5);
      GameState.ITEMS.push({ x: p.x, y: p.y, taken: false, kind: 'sanity' });
    }
    if (Math.random() < (LV > 3 ? 0.55 : 0.25)) {
      const p = rndFloor(5);
      GameState.ITEMS.push({ x: p.x, y: p.y, taken: false, kind: 'shield' });
    }

    // Traps
    GameState.TRAPS = [];
    if (LV < 10) {
      for (let i = 0; i < diff.traps; i++) {
        const p = rndFloor(5);
        GameState.TRAPS.push({
          x: p.x,
          y: p.y,
          type: Math.random() < 0.5 ? 'spike' : 'fire',
          timer: Math.random() * 2.0
        });
      }
    }

    // Narrative Story Memories on specific floors
    const storyMem = getStoryMemoryForFloor(LV);
    if (storyMem) {
      const p = rndFloor(5);
      GameState.ITEMS.push({
        x: p.x,
        y: p.y,
        taken: false,
        kind: 'story_echo',
        echoData: storyMem
      });
    }

    // Lore Scroll
    if (Math.random() < 0.4) {
      const scroll = LORE_SCROLLS_DATA[Math.min(LV - 1, LORE_SCROLLS_DATA.length - 1)];
      if (scroll) {
        const p = rndFloor(6);
        GameState.ITEMS.push({
          x: p.x,
          y: p.y,
          taken: false,
          kind: 'lore_scroll',
          scrollData: scroll
        });
      }
    }

    // Boss floor spawning
    if (isBossFloor(LV)) {
      BossManager.spawnBoss(getFloorBoss(LV));
      EventBus.emit('boss:intro_requested', getFloorBoss(LV));
    }

    EventBus.emit('floor:loaded', { floor: LV, isBoss: isBossFloor(LV) });
  }
};

export const loadLevel = (lv) => FloorManager.loadLevel(lv);

if (typeof window !== 'undefined') {
  window.loadLevel = loadLevel;
  Object.defineProperty(window, 'LV', {
    get: () => GameState.LV,
    set: (v) => { GameState.LV = v; },
    configurable: true
  });
  Object.defineProperty(window, 'MAP', {
    get: () => GameState.MAP,
    set: (v) => { GameState.MAP = v; },
    configurable: true
  });
  Object.defineProperty(window, 'ROOMS', {
    get: () => GameState.ROOMS,
    set: (v) => { GameState.ROOMS = v; },
    configurable: true
  });
  Object.defineProperty(window, 'ENE', {
    get: () => GameState.ENE,
    set: (v) => { GameState.ENE = v; },
    configurable: true
  });
  Object.defineProperty(window, 'ALLIES', {
    get: () => GameState.ALLIES,
    set: (v) => { GameState.ALLIES = v; },
    configurable: true
  });
  Object.defineProperty(window, 'ITEMS', {
    get: () => GameState.ITEMS,
    set: (v) => { GameState.ITEMS = v; },
    configurable: true
  });
  Object.defineProperty(window, 'TRAPS', {
    get: () => GameState.TRAPS,
    set: (v) => { GameState.TRAPS = v; },
    configurable: true
  });
}
