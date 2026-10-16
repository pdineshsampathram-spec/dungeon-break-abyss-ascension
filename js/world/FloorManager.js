// =====================================================================
//  DUNGEON BREAK — js/world/FloorManager.js
//  Authoritative Floor Loading, Level Progression, & Population Coordinator
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { Config } from '../core/Config.js';
import { isBossFloor, getFloorBoss, FLOOR_CONFIG } from '../data/floors.js';
import { WK, rollRarity } from '../data/weapons.js';
import { DungeonGenerator, rndFloor, rndFloorOpen, rndTrapFloor, isInOpeningSafeZone } from './DungeonGenerator.js';
import { BossArenaGenerator } from './BossArenaGenerator.js';
import { BossManager } from '../bosses/BossManager.js';
import { RelicSystem } from '../systems/RelicSystem.js';
import { getStoryMemoryForFloor } from '../data/memories.js';
import { LORE_SCROLLS_DATA } from '../data/lore.js';
import { EventBus } from '../core/EventBus.js';
import { MAX_LV, COLS, ROWS } from '../core/Constants.js';
import { EndingCinematics, EndingDispatcher } from '../cinematics/EndingCinematics.js';
import { PortalTransition } from '../cinematics/PortalTransition.js';
import { HallucinationSystem } from '../systems/HallucinationSystem.js';
import { DeathCinematics } from '../cinematics/DeathCinematics.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export const FloorManager = {
  levelTransitionActive: false,
  transitionStarted: false,
  transitionComplete: false,

  isTransitionActive() {
    return this.levelTransitionActive || GameState.levelTransitionActive;
  },

  startTransition(fromFloor) {
    if (this.isTransitionActive()) {
      console.warn('[WARNING] duplicate floor transition blocked');
      return false;
    }

    const from = (fromFloor !== undefined) ? fromFloor : GameState.LV;

    if (from >= MAX_LV) {
      this.levelTransitionActive = false;
      GameState.levelTransitionActive = false;
      GameState.PORTAL_USED = true;
      EventBus.emit('portal:victory', { floor: from });
      return true;
    }

    const nextFloor = from + 1;
    console.log(`[FLOOR] transition started: ${from} → ${nextFloor}`);

    this.levelTransitionActive = true;
    GameState.levelTransitionActive = true;
    this.transitionStarted = true;
    this.transitionComplete = false;
    GameState.transitionStarted = true;
    GameState.transitionComplete = false;
    GameState.PORTAL_USED = true;

    // Hard freeze of all gameplay systems: player movement, combat, enemy AI
    GameState.setState(GameStates.WARP);

    // Run transition cinematic
    PortalTransition.start(from, nextFloor, {
      onLoadFloor: () => {
        console.log(`[FLOOR] loading floor ${nextFloor}`);
        GameState.LV = nextFloor;
        FloorManager.loadLevel(nextFloor);
      },
      onComplete: () => {
        FloorManager.completeTransition();
      }
    });

    return true;
  },

  completeTransition() {
    console.log('[FLOOR] transition completed');
    this.levelTransitionActive = false;
    GameState.levelTransitionActive = false;
    this.transitionStarted = false;
    this.transitionComplete = true;
    GameState.transitionStarted = false;
    GameState.transitionComplete = true;
    GameState.PORTAL_USED = false;

    if (isBossFloor(GameState.LV)) {
      // Boss floor handles its own intro state
    } else {
      GameState.setState(GameStates.PLAYING);
      if (typeof window !== 'undefined' && window.triggerCinematicBanner && FLOOR_CONFIG[GameState.LV]) {
        const fc = FLOOR_CONFIG[GameState.LV];
        window.triggerCinematicBanner(
          `FLOOR ${GameState.LV}: ${fc.name.toUpperCase()}`,
          fc.desc || 'The darkness deepens. Stay vigilant.',
          '#38bdf8',
          2.5
        );
      }
    }
  },

  resetTransitionLock() {
    this.levelTransitionActive = false;
    GameState.levelTransitionActive = false;
    this.transitionStarted = false;
    this.transitionComplete = false;
    GameState.transitionStarted = false;
    GameState.transitionComplete = false;
    GameState.PORTAL_USED = false;
  },

  loadLevel(lv) {
    if (lv !== undefined) GameState.LV = lv;
    const { P, LV } = GameState;

    GameState.clearLevelEntities();
    GameState.FADE = 1;
    GameState.FADEIN = true;
    GameState.CINEMATIC_ACTIVE = false;
    GameState.ACTIVE_CINEMATIC_TYPE = null;
    GameState.PORTAL_USED = false;
    if (DeathCinematics && DeathCinematics.reset) DeathCinematics.reset();
    if (PortalTransition && PortalTransition.reset && !PortalTransition.isTransitionActive()) {
      PortalTransition.reset();
    }

    const diff = Config.getDiff(LV);

    if (isBossFloor(LV)) {
      BossArenaGenerator.build(LV);
    } else {
      DungeonGenerator.build();
    }

    // Safe spawn: Arena placed player at bottom (cx, 24); normal map uses Room 0 center
    if (!isBossFloor(LV) && GameState.ROOMS[0]) {
      if (LV === 1) {
        P.x = 9.5;
        P.y = 15.5;
      } else {
        P.x = GameState.ROOMS[0].cx;
        P.y = GameState.ROOMS[0].cy;
      }
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
    P.nearTorch = false;
    P.animState = 'idle';
    P.animTimer = 0;
    HallucinationSystem.reset();

    // Relic trigger on entering new floor
    RelicSystem.onFloorEnter();

    // Populate Normal Floors with Structured Encounter Groups across expanded 34-42 room dungeon
    GameState.ENE = [];
    if (!isBossFloor(LV) && GameState.ROOMS && GameState.ROOMS.length > 1) {
      // Calibrated enemy health baselines and progression curve
      const BASE_HP = { skeleton: 18, ghoul: 28, demon: 52, wraith: 60 };
      const FLOOR_HP_MULT = 1 + (LV - 1) * 0.22;

      // Available non-start rooms (Room 0 is strictly safe start)
      const encounterRooms = GameState.ROOMS.slice(1);
      const map = GameState.MAP;

      // Helper to check tile walkability and safety for enemy spawns
      const isSpawnTileValid = (x, y) => {
        const tx = Math.floor(x);
        const ty = Math.floor(y);
        if (ty < 1 || ty >= ROWS - 1 || tx < 1 || tx >= COLS - 1 || !map[ty]) return false;
        const t = map[ty][tx];
        if (t !== 0 && t !== 4 && t !== 5) return false;
        if (isInOpeningSafeZone(tx, ty, LV)) return false;
        if (Math.hypot(tx - P.x, ty - P.y) < (LV === 1 ? 6.5 : 4.5)) return false;
        for (let i = 0; i < GameState.ENE.length; i++) {
          if (Math.hypot(GameState.ENE[i].x - x, GameState.ENE[i].y - y) < 1.1) return false;
        }
        return true;
      };

      for (let rIdx = 0; rIdx < encounterRooms.length; rIdx++) {
        const rm = encounterRooms[rIdx];
        const isPortalRoom = !!rm.isPortalRoom || (map && map[rm.cy] && map[rm.cy][rm.cx] === 2);
        const rType = rm.type || 'rect';

        // Group composition based on floor level, room archetype, and exploration rhythm
        let groupTypes = [];
        let forceElite = false;

        // 1. FLOOR 1 SCRIPTED AMBUSH ROOM
        if (LV === 1 && rIdx === 0) {
          // Room 1: Authorship preserved — trio of ambush skeletons
          groupTypes = ['skeleton', 'skeleton', 'skeleton'];
        }
        // 2. PORTAL ROOM — Gatekeeper Stronghold
        else if (isPortalRoom) {
          if (LV === 1) {
            groupTypes = ['skeleton', 'skeleton', 'skeleton'];
          } else if (LV === 2) {
            groupTypes = ['ghoul', 'ghoul', 'skeleton', 'skeleton'];
          } else if (LV <= 4) {
            groupTypes = ['demon', 'ghoul', 'ghoul', 'skeleton'];
            forceElite = true;
          } else if (LV <= 7) {
            groupTypes = ['wraith', 'demon', 'demon', 'ghoul'];
            forceElite = true;
          } else {
            groupTypes = ['demon', 'wraith', 'wraith', 'ghoul', 'demon'];
            forceElite = true;
          }
        }
        // 3. ARCHETYPE-BASED ENCOUNTER PROFILES
        else if (rType === 'grand_hall') {
          // Colonnade nave: vanguard flanked by casters
          if (LV <= 2) {
            groupTypes = ['skeleton', 'skeleton', 'ghoul'];
          } else if (LV <= 4) {
            groupTypes = ['demon', 'ghoul', 'skeleton', 'ghoul'];
            if (Math.random() < 0.35) forceElite = true;
          } else if (LV <= 7) {
            groupTypes = ['demon', 'wraith', 'ghoul', 'demon'];
            if (Math.random() < 0.45) forceElite = true;
          } else {
            groupTypes = ['demon', 'wraith', 'demon', 'wraith', 'ghoul'];
            if (Math.random() < 0.55) forceElite = true;
          }
        }
        else if (rType === 'cross_hub') {
          // 4-way crossroad: multi-directional flanking sentries
          if (LV <= 2) {
            groupTypes = ['skeleton', 'ghoul', 'skeleton'];
          } else if (LV <= 4) {
            groupTypes = ['demon', 'ghoul', 'skeleton'];
          } else if (LV <= 7) {
            groupTypes = ['wraith', 'demon', 'ghoul'];
            if (Math.random() < 0.30) forceElite = true;
          } else {
            groupTypes = ['demon', 'wraith', 'demon', 'ghoul'];
            if (Math.random() < 0.40) forceElite = true;
          }
        }
        else if (rType === 'cathedral') {
          // Altar sanctuary
          if (LV <= 2) {
            groupTypes = ['skeleton', 'ghoul', 'skeleton'];
          } else if (LV <= 4) {
            groupTypes = ['demon', 'ghoul', 'skeleton'];
            if (Math.random() < 0.40) forceElite = true;
          } else if (LV <= 7) {
            groupTypes = ['demon', 'wraith', 'demon'];
            if (Math.random() < 0.45) forceElite = true;
          } else {
            groupTypes = ['demon', 'wraith', 'wraith', 'demon'];
            if (Math.random() < 0.50) forceElite = true;
          }
        }
        else if (rType === 'treasure_vault') {
          // Fortified cache vault: elite guardian + fast skirmishers
          if (LV <= 2) {
            groupTypes = ['ghoul', 'skeleton'];
          } else {
            groupTypes = ['demon', 'ghoul', 'wraith'];
            forceElite = true;
          }
        }
        else if (rType === 'crypt_vault') {
          // Sarcophagus ambushers
          if (LV <= 2) {
            groupTypes = ['skeleton', 'skeleton'];
          } else if (LV <= 4) {
            groupTypes = ['ghoul', 'skeleton'];
          } else {
            groupTypes = ['ghoul', 'wraith'];
          }
        }
        else if (rType === 'chasm_cavern') {
          // Tactical chasm crossfire
          if (LV <= 2) {
            groupTypes = ['skeleton', 'skeleton'];
          } else if (LV <= 4) {
            groupTypes = ['demon', 'ghoul'];
          } else {
            groupTypes = ['demon', 'wraith', 'ghoul'];
          }
        }
        else if (rType === 'ruined_labyrinth') {
          // Close-quarters ambush
          if (LV <= 2) {
            groupTypes = ['skeleton', 'ghoul'];
          } else if (LV <= 4) {
            groupTypes = ['ghoul', 'demon'];
          } else {
            groupTypes = ['wraith', 'ghoul'];
          }
        }
        // 4. STANDARD RECT CHAMBERS — EXPLORATION RHYTHM
        else {
          const rhythmRoll = (rIdx * 7 + LV * 3) % 10;
          if (rhythmRoll <= 1 && rIdx > 2) {
            // Quiet / Respite room (20%): traversal break, no enemies
            groupTypes = [];
          } else if (rhythmRoll <= 5) {
            // Small skirmish (40%): 1-2 scouts
            if (LV === 1) groupTypes = ['skeleton'];
            else if (LV <= 3) groupTypes = [Math.random() < 0.6 ? 'skeleton' : 'ghoul'];
            else if (LV <= 6) groupTypes = [Math.random() < 0.5 ? 'ghoul' : 'demon'];
            else groupTypes = [Math.random() < 0.5 ? 'demon' : 'wraith'];
          } else {
            // Standard combat encounter (40%): 2-3 enemies
            if (LV === 1) {
              groupTypes = ['skeleton', 'skeleton'];
            } else if (LV === 2) {
              groupTypes = ['skeleton', 'ghoul'];
            } else if (LV <= 4) {
              groupTypes = ['demon', 'ghoul', 'skeleton'];
            } else if (LV <= 7) {
              groupTypes = ['ghoul', 'demon', 'wraith'];
            } else {
              groupTypes = ['demon', 'wraith', 'ghoul'];
            }
          }
        }

        // Spawn allocated enemies safely within room boundary
        groupTypes.forEach((type, memberIdx) => {
          let placed = false;
          let ex = rm.cx;
          let ey = rm.cy;

          for (let attempt = 0; attempt < 30; attempt++) {
            const ox = ((memberIdx % 2 === 0 ? 1 : -1) * (1.2 + Math.floor(memberIdx / 2) * 1.1)) + (Math.random() - 0.5) * 1.5;
            const oy = ((memberIdx % 3 === 0 ? 1 : -1) * (1.1 + Math.floor(memberIdx / 3) * 1.0)) + (Math.random() - 0.5) * 1.5;
            const testX = Math.max(rm.x + 1.2, Math.min(rm.x + rm.w - 2.2, rm.cx + ox));
            const testY = Math.max(rm.y + 1.2, Math.min(rm.y + rm.h - 2.2, rm.cy + oy));
            if (isSpawnTileValid(testX, testY)) {
              ex = testX;
              ey = testY;
              placed = true;
              break;
            }
          }

          if (!placed && !isSpawnTileValid(ex, ey)) {
            for (let ry = rm.y + 1; ry < rm.y + rm.h - 1; ry++) {
              for (let rx = rm.x + 1; rx < rm.x + rm.w - 1; rx++) {
                if (isSpawnTileValid(rx + 0.5, ry + 0.5)) {
                  ex = rx + 0.5;
                  ey = ry + 0.5;
                  placed = true;
                  break;
                }
              }
              if (placed) break;
            }
          }

          if (!placed) return;

          let hp = Math.round(BASE_HP[type] * FLOOR_HP_MULT);
          let isElite = false;
          if (forceElite && memberIdx === 0) {
            hp = Math.round(hp * 2.5);
            isElite = true;
          } else if (LV >= 4 && Math.random() < 0.14 && memberIdx === 0) {
            hp = Math.round(hp * 2.5);
            isElite = true;
          }

          const basePoise = type === 'demon' ? 45 : (type === 'wraith' ? 35 : (type === 'ghoul' ? 25 : 15));
          const poise = isElite ? Math.round(basePoise * 2.5) : basePoise;
          const armor = isElite ? 0.20 : (type === 'wraith' ? 0.15 : (type === 'demon' ? 0.10 : (type === 'ghoul' ? 0.05 : 0.0)));

          GameState.ENE.push({
            x: ex,
            y: ey,
            homeX: ex,
            homeY: ey,
            vx: 0,
            vy: 0,
            alive: true,
            hp,
            maxHp: hp,
            armor,
            poise,
            currentPoise: poise,
            staggerCooldown: 0,
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
            roomId: rIdx + 1,
            isAlerted: false,
            telegraphing: false,
            telegraphTimer: 0,
            telegraphType: null
          });
        });
      }

      // 5. CORRIDOR SENTRIES (Floors 2+) — Solitary sentries holding passageways between distant wings
      if (LV >= 2 && map) {
        const numCorridorSentries = Math.min(8, 3 + LV);
        for (let cs = 0; cs < numCorridorSentries; cs++) {
          for (let attempt = 0; attempt < 100; attempt++) {
            const rx = 8 + Math.floor(Math.random() * (COLS - 16));
            const ry = 8 + Math.floor(Math.random() * (ROWS - 16));
            if (map[ry] && map[ry][rx] === 0) {
              const inAnyRoom = GameState.ROOMS.some(rm => rx >= rm.x && rx < rm.x + rm.w && ry >= rm.y && ry < rm.y + rm.h);
              if (!inAnyRoom && isSpawnTileValid(rx + 0.5, ry + 0.5)) {
                const sType = LV <= 3 ? (Math.random() < 0.7 ? 'skeleton' : 'ghoul') : (Math.random() < 0.5 ? 'ghoul' : 'demon');
                let hp = Math.round(BASE_HP[sType] * FLOOR_HP_MULT);
                const sPoise = sType === 'demon' ? 45 : (sType === 'ghoul' ? 25 : 15);
                GameState.ENE.push({
                  x: rx + 0.5,
                  y: ry + 0.5,
                  homeX: rx + 0.5,
                  homeY: ry + 0.5,
                  vx: 0,
                  vy: 0,
                  alive: true,
                  hp,
                  maxHp: hp,
                  armor: sType === 'demon' ? 0.10 : (sType === 'ghoul' ? 0.05 : 0.0),
                  poise: sPoise,
                  currentPoise: sPoise,
                  staggerCooldown: 0,
                  type: sType,
                  alertT: 0,
                  atkC: 0,
                  ph: Math.random() * 6.28,
                  dAnim: 0,
                  hitFlash: 0,
                  animState: 'idle',
                  animTimer: 0,
                  walkCycle: 0,
                  isElite: false,
                  roomId: 0,
                  isAlerted: false,
                  telegraphing: false,
                  telegraphTimer: 0,
                  telegraphType: null
                });
                break;
              }
            }
          }
        }
      }
    }

    // Allies / Survivors (Normal floors only)
    GameState.ALLIES = [];
    if (!isBossFloor(LV)) {
      for (let i = 0; i < 2 + Math.floor(LV / 3); i++) {
        const p = rndFloor(7);
        GameState.ALLIES.push({ x: p.x, y: p.y, rescued: false, rescueAnim: 0, ph: Math.random() * 6.28 });
      }
    }

    // Interactive Buff Shrines (Altar of Fury, Fountain of Vitality, Astral Obelisk, Wind Shrine)
    GameState.SHRINES = [];
    if (!isBossFloor(LV)) {
      const shrineTypes = [
        { type: 'fury', name: 'Altar of Fury', desc: '+50% Attack Damage (45s)', icon: '🔥', col: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
        { type: 'vitality', name: 'Fountain of Vitality', desc: 'Restore 5 HP & +2 Max HP', icon: '💧', col: '#10b981', glow: 'rgba(16,185,129,0.4)' },
        { type: 'astral', name: 'Astral Obelisk', desc: '+40 Sanity & Mind Shield (45s)', icon: '✨', col: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
        { type: 'wind', name: 'Shrine of Zephyr', desc: '+35% Move Speed & Fast Attack (45s)', icon: '💨', col: '#38bdf8', glow: 'rgba(56,189,248,0.4)' }
      ];
      const shrineCount = 2 + (Math.random() < 0.6 ? 2 : 1);
      for (let s = 0; s < shrineCount; s++) {
        const p = rndFloorOpen(6);
        const def = shrineTypes[(Math.random() * shrineTypes.length) | 0];
        GameState.SHRINES.push({
          x: p.x,
          y: p.y,
          type: def.type,
          name: def.name,
          desc: def.desc,
          icon: def.icon,
          col: def.col,
          glow: def.glow,
          used: false,
          ph: Math.random() * 6.28
        });
      }
    }

    // Items, Weapons, & Consumables (Normal floors only)
    GameState.ITEMS = [];
    if (!isBossFloor(LV)) {
      const p = rndFloor(4);
      const sub = WK[(Math.random() * WK.length) | 0];
      GameState.ITEMS.push({ x: p.x, y: p.y, taken: false, kind: 'weapon', sub, rarity: rollRarity() });
      if (LV >= 2) {
        const p2 = rndFloor(5);
        const sub2 = WK[(Math.random() * WK.length) | 0];
        GameState.ITEMS.push({ x: p2.x, y: p2.y, taken: false, kind: 'weapon', sub: sub2, rarity: rollRarity() });
      }
      if (LV >= 4) {
        const p3 = rndFloor(5);
        const sub3 = WK[(Math.random() * WK.length) | 0];
        GameState.ITEMS.push({ x: p3.x, y: p3.y, taken: false, kind: 'weapon', sub: sub3, rarity: rollRarity() });
      }
      // Health and Sanity recoveries throughout expanded exploration
      for (let h = 0; h < (LV >= 4 ? 3 : 2); h++) {
        const hpDrop = rndFloor(5);
        GameState.ITEMS.push({ x: hpDrop.x, y: hpDrop.y, taken: false, kind: 'health' });
      }
      for (let s = 0; s < (LV >= 3 ? 2 : 1); s++) {
        const sanDrop = rndFloor(5);
        GameState.ITEMS.push({ x: sanDrop.x, y: sanDrop.y, taken: false, kind: 'sanity' });
      }
      if (Math.random() < 0.5) {
        const p6 = rndFloor(5);
        GameState.ITEMS.push({ x: p6.x, y: p6.y, taken: false, kind: 'shield' });
      }
    }

    // Traps (Normal dungeon floors only — Opening Safe Zone strictly protected)
    GameState.TRAPS = [];
    if (!isBossFloor(LV)) {
      const candidateRooms = (GameState.ROOMS && GameState.ROOMS.length > 1)
        ? GameState.ROOMS.slice(1)
        : GameState.ROOMS;

      const trapTarget = Math.min(Math.round(diff.traps * 2.4), 28);
      for (let i = 0; i < trapTarget; i++) {
        let placed = false;
        for (let attempt = 0; attempt < 80; attempt++) {
          const rm = candidateRooms[(Math.random() * candidateRooms.length) | 0];
          const tx = rm.x + 1 + ((Math.random() * Math.max(1, rm.w - 2)) | 0);
          const ty = rm.y + 1 + ((Math.random() * Math.max(1, rm.h - 2)) | 0);

          const map = GameState.MAP;
          const isWalkable = map && map[ty] && (map[ty][tx] === 0 || map[ty][tx] === 5);
          if (isWalkable &&
              !isInOpeningSafeZone(tx, ty, LV) &&
              !GameState.TRAPS.some(t => Math.hypot(t.x - tx, t.y - ty) < 2.5)) {
            GameState.TRAPS.push({
              x: tx,
              y: ty,
              type: Math.random() < 0.5 ? 'spike' : 'fire',
              timer: Math.random() * 2.0
            });
            placed = true;
            break;
          }
        }

        if (!placed) {
          const p = rndTrapFloor(4);
          if (p && !isInOpeningSafeZone(p.x, p.y, LV) &&
              !GameState.TRAPS.some(t => Math.hypot(t.x - p.x, t.y - p.y) < 2.0)) {
            GameState.TRAPS.push({
              x: p.x,
              y: p.y,
              type: Math.random() < 0.5 ? 'spike' : 'fire',
              timer: Math.random() * 2.0
            });
            placed = true;
          }
        }
      }

      // Authoritative guarantee: strictly purge any candidate inside opening safe zone
      GameState.TRAPS = GameState.TRAPS.filter(t => !isInOpeningSafeZone(t.x, t.y, LV));
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

    // Boss floor spawning & 2.5D Cinematic Intro
    if (isBossFloor(LV)) {
      const bId = getFloorBoss(LV);
      // BossManager owns spawn + intro startup. Starting it again here reset
      // the same cinematic in-place and could desynchronise Floor 6's combat
      // activation from its visual reveal.
      BossManager.spawnBoss(bId);
      EventBus.emit('boss:intro_requested', bId);
    }

    // Authoritative Floor Chronicle Auto-Discovery (Floor 1-9 progressive reveal)
    const floorLore = LORE_SCROLLS_DATA.find(l => l.floor === LV && l.revealedAt !== 'endgame' && l.revealedAt !== 'legacy');
    if (floorLore) {
      SaveSystem.unlockLore(floorLore.id);
      if (floorLore.legacyId) SaveSystem.unlockLore(floorLore.legacyId);
    }

    // Auto-discover canonical journey memories tied to floor arrival
    if (LV === 1) SaveSystem.unlockMemory('memory_abandonment');
    if (LV === 2) SaveSystem.unlockMemory('memory_campfire');
    if (LV === 5) SaveSystem.unlockMemory('memory_battlefield');

    EventBus.emit('floor:loaded', { floor: LV, isBoss: isBossFloor(LV) });
    if (LV >= 5 && GameState.P && GameState.P.san > 70) {
      AchievementSystem.unlock('sanity_keeper');
    }
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
