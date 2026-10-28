// =====================================================================
//  DUNGEON BREAK — js/cinematics/CinematicReplayContext.js
//  DEDICATED REPLAY SANDBOX & PRESENTATION SCENE CONTROLLER
//
//  Responsibilities:
//  1. Replay Isolation: Takes an immutable snapshot of GameState before replay.
//  2. Scene Construction: Reconstructs the authentic dungeon environment,
//     real tiles, arena geometry, torches, lighting, Rowan, and the exact boss.
//  3. Presentation Execution: Runs the authoritative in-engine cinematic sequence.
//  4. Clean Return & Teardown: On completion or Escape/skip, restores the snapshot,
//     cleans up temporary visual entities, and safely returns to the Archive.
//  5. ZERO gameplay leakage: Never changes floor, never damages live boss,
//     never spawns live portals, never overwrites active saved descents.
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { COLS, ROWS, T } from '../core/Constants.js';
import { CinematicSafety } from './CinematicSafety.js';
import { BossArenaGenerator } from '../world/BossArenaGenerator.js';
import { DungeonGenerator } from '../world/DungeonGenerator.js';
import { BossManager } from '../bosses/BossManager.js';
import { Camera } from '../rendering/Camera.js';
import { SoundManager } from '../audio/AudioManager.js';

import { CinematicDirector } from './CinematicDirector.js';
import { BossIntros } from './BossIntros.js';
import { GorgarothCinematics } from './GorgarothCinematics.js';
import { WardenDefeatCinematic } from './WardenDefeatCinematic.js';
import { ShatteredMindCinematic } from './ShatteredMindCinematic.js';
import { HeroCinematic } from './HeroCinematic.js';
import { BetrayalCinematic } from './BetrayalCinematic.js';
import { RampageCinematic } from './RampageCinematic.js';
import { LastEmberCinematic } from './LastEmberCinematic.js';
import { EpilogueCinematic } from './EpilogueCinematic.js';
import { Credits } from './Credits.js';

let _isReplaying = false;
let _activeReplayId = null;
let _snapshot = null;
let _onReplayComplete = null;

export const CinematicReplayContext = {
  isReplaying() {
    return _isReplaying;
  },

  getActiveId() {
    return _activeReplayId;
  },

  /**
   * Starts a presentation-only replay of any of the 12 canonical story cinematics.
   * Isolates the runtime, populates the exact dungeon environment and boss,
   * and arms 3.0s input safety.
   */
  startReplay(cinematicId, options = {}) {
    console.log(`[CinematicReplayContext] Staging replay for: ${cinematicId}`);

    _isReplaying = true;
    _activeReplayId = cinematicId;
    _onReplayComplete = options.onComplete || null;

    // 1. Capture full GameState snapshot
    _snapshot = {
      state: GameState.STATE,
      map: GameState.MAP ? GameState.MAP.map(row => [...row]) : null,
      rooms: GameState.ROOMS ? JSON.parse(JSON.stringify(GameState.ROOMS)) : null,
      torches: GameState.TORCHES ? JSON.parse(JSON.stringify(GameState.TORCHES)) : null,
      gates: GameState.GATES ? JSON.parse(JSON.stringify(GameState.GATES)) : null,
      gate: GameState.GATE ? { ...GameState.GATE } : null,
      boss: GameState.BOSS ? { ...GameState.BOSS } : null,
      miniboss: GameState.ACTIVE_MINIBOSS ? { ...GameState.ACTIVE_MINIBOSS } : null,
      enemies: GameState.ENE ? [...GameState.ENE] : [],
      player: GameState.P ? { ...GameState.P } : null,
      floor: GameState.LV || 1,
      camera: { ...GameState.CAM },
      cinematicActive: GameState.CINEMATIC_ACTIVE,
      bossIntroActive: GameState.BOSS_INTRO_ACTIVE,
      bossDead: GameState.BOSS_DEAD,
      bossPortalUnlocked: GameState.BOSS_PORTAL_UNLOCKED,
      exploredRooms: GameState.EXPLORED_ROOMS ? new Set(GameState.EXPLORED_ROOMS) : null,
      activeCinematicType: GameState.ACTIVE_CINEMATIC_TYPE,
      fade: GameState.FADE,
      fadeIn: GameState.FADEIN
    };

    // 2. Clear any stray level entities for clean visual staging
    GameState.clearLevelEntities();
    GameState.FADE = 0;
    GameState.FADEIN = false;
    GameState.BOSS_PORTAL_UNLOCKED = false;

    // Ensure player entity exists and is in pristine visual state
    if (!GameState.P) {
      GameState.P = {
        x: 10, y: 10, vx: 0, vy: 0, spd: 4.0,
        hp: 10, maxHp: 10, san: 100,
        wep: 'sword',
        wepRarity: { name: 'Common', col: '#94a3b8' },
        animState: 'idle', fx: 1, fy: 0,
        walkCycle: 0, breathCycle: 0
      };
    }
    const P = GameState.P;
    P.dead = false;
    P.dying = false;
    P.invulnerable = true;
    P.vx = 0;
    P.vy = 0;
    P.acd = 0;
    P.aanim = 0;
    P.dcd = 0;
    P.hitFlash = 0;
    P.cinematicPose = null;
    P.portalAlpha = 1.0;
    P.portalScale = 1.0;
    P.weaponLowered = false;

    // 3. Construct specific authentic scene environment
    this._stageEnvironment(cinematicId);
  },

  /**
   * Builds the exact map geometry, lighting, boss, and actor coordinates
   * according to the cinematic requirements.
   */
  _stageEnvironment(cinematicId) {
    const P = GameState.P;
    const cx = (COLS / 2) | 0;
    const cy = (ROWS / 2) | 0;

    switch (cinematicId) {
      // ─────────────────────────────────────────────────────────
      // 1. THE DESCENT (Floor 1 Entrance Hall & Threshold)
      // ─────────────────────────────────────────────────────────
      case 'the_descent': {
        GameState.LV = 1;
        DungeonGenerator.build();
        GameState.EXPLORED_ROOMS = new Set([0]);

        const rm0 = (GameState.ROOMS && GameState.ROOMS[0]) || { x: 4, y: 10, w: 14, h: 10, cx: 10, cy: 15 };
        const px = rm0.cx || 10;
        const py = rm0.cy || 15;
        P.x = px;
        P.y = py;
        P.cinematicPose = 'kneel';
        P.fx = 1;

        // Portcullis gate behind Rowan
        const gateX = rm0.x;
        const gateY = rm0.cy;
        GameState.GATE = {
          id: 'entrance_gate',
          type: 'iron_portcullis',
          x: gateX,
          y: gateY,
          width: 1,
          height: 2,
          state: 'open',
          dropProgress: 0.0,
          leverProgress: 0.0,
          dustExploded: false,
          solid: false
        };
        GameState.GATES = [GameState.GATE];

        GameState.CAM.tx = px;
        GameState.CAM.ty = py;
        GameState.CAM.tz = 2.45;
        GameState.CAM.x = px;
        GameState.CAM.y = py;
        GameState.CAM.z = 2.45;

        CinematicDirector.startIntro({
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 2. GORGAROTH INTRO (Floor 3: Iron Jail Arena, Pillars, War Mace)
      // ─────────────────────────────────────────────────────────
      case 'boss_intro_gorgaroth': {
        GameState.LV = 3;
        BossArenaGenerator.buildGorgarothIronJail();
        BossManager.spawnBoss('gorgaroth', { skipIntro: true });
        GameState.EXPLORED_ROOMS = new Set([0]);

        // Position player at entrance threshold, boss at north center
        const rm = GameState.ROOMS[0];
        P.x = rm.cx;
        P.y = rm.y + rm.h - 3;
        P.fx = 0;
        P.fy = -1; // Facing North towards boss

        if (GameState.BOSS) {
          GameState.BOSS.x = rm.cx;
          GameState.BOSS.y = rm.cy - 2;
          GameState.BOSS.alive = true;
          GameState.BOSS.hp = GameState.BOSS.maxHp;
          GameState.BOSS.introRevealStage = 'hidden';
          GameState.BOSS.introWeaponAlpha = 0;
        }

        GameState.CAM.tx = P.x;
        GameState.CAM.ty = P.y;
        GameState.CAM.tz = 1.25;
        GameState.CAM.x = P.x;
        GameState.CAM.y = P.y;
        GameState.CAM.z = 1.25;

        BossIntros.start('gorgaroth', {
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 3. GORGAROTH DEFEAT (Floor 3: Collapse & Cosmic Portal Formation)
      // ─────────────────────────────────────────────────────────
      case 'boss_defeat_gorgaroth': {
        GameState.LV = 3;
        BossArenaGenerator.buildGorgarothIronJail();
        BossManager.spawnBoss('gorgaroth', { skipIntro: true });
        GameState.EXPLORED_ROOMS = new Set([0]);

        const rm = GameState.ROOMS[0];
        P.x = rm.cx;
        P.y = rm.cy + 5;
        P.fx = 0;
        P.fy = -1; // Facing North towards boss

        if (GameState.BOSS) {
          GameState.BOSS.x = rm.cx;
          GameState.BOSS.y = rm.cy - 2;
          GameState.BOSS.alive = false;
          GameState.BOSS.hp = 0;
          GameState.BOSS.defeatState = 'unstable';
          GameState.BOSS.isDefeatedCinematic = true;
        }

        GameState.CAM.tx = rm.cx;
        GameState.CAM.ty = rm.cy + 1;
        GameState.CAM.tz = 1.22;
        GameState.CAM.x = rm.cx;
        GameState.CAM.y = rm.cy + 1;
        GameState.CAM.z = 1.22;

        GorgarothCinematics.startDefeat(GameState.BOSS, {}, {
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 4. MALAKOR INTRO (Floor 6: Void Sanctum, Obelisks, Singularity)
      // ─────────────────────────────────────────────────────────
      case 'boss_intro_malakor': {
        GameState.LV = 6;
        BossArenaGenerator.buildMalakorVoidSanctum();
        BossManager.spawnBoss('malakor', { skipIntro: true });
        GameState.EXPLORED_ROOMS = new Set([0]);

        const rm = GameState.ROOMS[0];
        P.x = rm.cx;
        P.y = rm.y + rm.h - 3;
        P.fx = 0;
        P.fy = -1;

        if (GameState.BOSS) {
          GameState.BOSS.x = rm.cx;
          GameState.BOSS.y = rm.cy - 3;
          GameState.BOSS.alive = true;
          GameState.BOSS.hp = GameState.BOSS.maxHp;
          GameState.BOSS.introMaterialize = 0;
        }

        GameState.CAM.tx = P.x;
        GameState.CAM.ty = P.y;
        GameState.CAM.tz = 1.25;
        GameState.CAM.x = P.x;
        GameState.CAM.y = P.y;
        GameState.CAM.z = 1.25;

        BossIntros.start('malakor', {
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 5. MALAKOR DEFEAT (Floor 6: Void Singularity & Nether Collapse)
      // ─────────────────────────────────────────────────────────
      case 'boss_defeat_malakor': {
        GameState.LV = 6;
        BossArenaGenerator.buildMalakorVoidSanctum();
        BossManager.spawnBoss('malakor', { skipIntro: true });
        GameState.EXPLORED_ROOMS = new Set([0]);

        const rm = GameState.ROOMS[0];
        P.x = rm.cx;
        P.y = rm.cy + 4;
        P.fx = 0;
        P.fy = -1;

        if (GameState.BOSS) {
          GameState.BOSS.x = rm.cx;
          GameState.BOSS.y = rm.cy - 3;
          GameState.BOSS.alive = false;
          GameState.BOSS.hp = 0;
          GameState.BOSS.introMaterialize = 1.0;
        }

        GameState.CAM.tx = rm.cx;
        GameState.CAM.ty = rm.cy - 2;
        GameState.CAM.tz = 1.5;
        GameState.CAM.x = rm.cx;
        GameState.CAM.y = rm.cy - 2;
        GameState.CAM.z = 1.5;

        BossIntros.startDefeat(GameState.BOSS, {
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 6. ABYSS WARDEN INTRO (Floor 10: Circular Throne Chamber, Carpet)
      // ─────────────────────────────────────────────────────────
      case 'boss_intro_warden': {
        GameState.LV = 10;
        BossArenaGenerator.buildAbyssWardenThroneRoom();
        BossManager.spawnBoss('abyss_warden', { skipIntro: true });
        GameState.EXPLORED_ROOMS = new Set([0]);

        const rm = GameState.ROOMS[0];
        P.x = rm.cx;
        P.y = rm.y + rm.h - 4;
        P.fx = 0;
        P.fy = -1;

        if (GameState.BOSS) {
          GameState.BOSS.x = rm.cx;
          GameState.BOSS.y = rm.throneY || (rm.cy - 6);
          GameState.BOSS.alive = true;
          GameState.BOSS.hp = GameState.BOSS.maxHp;
          GameState.BOSS.introRevealStage = 'throne';
          GameState.BOSS.introWeaponAlpha = 0;
        }

        GameState.CAM.tx = P.x;
        GameState.CAM.ty = P.y;
        GameState.CAM.tz = 1.25;
        GameState.CAM.x = P.x;
        GameState.CAM.y = P.y;
        GameState.CAM.z = 1.25;

        BossIntros.start('abyss_warden', {
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 7. ABYSS WARDEN DEFEAT (Floor 10: Dreadblade Shatter & Ascension)
      // ─────────────────────────────────────────────────────────
      case 'boss_defeat_warden': {
        GameState.LV = 10;
        BossArenaGenerator.buildAbyssWardenThroneRoom();
        BossManager.spawnBoss('abyss_warden', { skipIntro: true });
        GameState.EXPLORED_ROOMS = new Set([0]);

        const rm = GameState.ROOMS[0];
        const throneY = rm.throneY || (rm.cy - 6);
        P.x = rm.cx;
        P.y = throneY + 4;
        P.fx = 0;
        P.fy = -1;

        if (GameState.BOSS) {
          GameState.BOSS.x = rm.cx;
          GameState.BOSS.y = throneY;
          GameState.BOSS.alive = false;
          GameState.BOSS.hp = 0;
          GameState.BOSS.isDefeatedCinematic = true;
        }

        GameState.CAM.tx = rm.cx;
        GameState.CAM.ty = throneY + 1.5;
        GameState.CAM.tz = 1.35;
        GameState.CAM.x = rm.cx;
        GameState.CAM.y = throneY + 1.5;
        GameState.CAM.z = 1.35;

        WardenDefeatCinematic.start(GameState.BOSS, {}, false, {
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 8. SHATTERED MIND (Sanity 0 Eldritch Breakdown)
      // ─────────────────────────────────────────────────────────
      case 'shattered_mind': {
        GameState.LV = 1;
        DungeonGenerator.build();
        GameState.EXPLORED_ROOMS = new Set([0]);

        const rm0 = (GameState.ROOMS && GameState.ROOMS[0]) || { cx: 10, cy: 15 };
        P.x = rm0.cx || 10;
        P.y = rm0.cy || 15;
        P.san = 0;

        GameState.CAM.tx = P.x;
        GameState.CAM.ty = P.y;
        GameState.CAM.tz = 1.35;
        GameState.CAM.x = P.x;
        GameState.CAM.y = P.y;
        GameState.CAM.z = 1.35;

        ShatteredMindCinematic.start({
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 9. HERO ENDING (Dawn Beyond the Abyss)
      // ─────────────────────────────────────────────────────────
      case 'ending_hero': {
        HeroCinematic.start({
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 10. BETRAYAL ENDING (The Hollow Throne)
      // ─────────────────────────────────────────────────────────
      case 'ending_betrayal': {
        BetrayalCinematic.start({
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 11. RAMPAGE ENDING (Uncrowned Abyss King)
      // ─────────────────────────────────────────────────────────
      case 'ending_rampage': {
        RampageCinematic.start({
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 12. THE LAST EMBER (Creator's Vision of Hope)
      // ─────────────────────────────────────────────────────────
      case 'the_last_ember': {
        LastEmberCinematic.start('archive', {
          isReplay: true,
          onComplete: () => this.finishReplay()
        });
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 12.5. THE UNMEASURED HOUR (Post-Ending Canonical Epilogue)
      // ─────────────────────────────────────────────────────────
      case 'epilogue_unmeasured_hour': {
        EpilogueCinematic.start('hero', () => this.finishReplay());
        break;
      }

      // ─────────────────────────────────────────────────────────
      // 13. FOUR DISTINCT ENDING CREDITS & MAIN MENU CREDITS
      // ─────────────────────────────────────────────────────────
      case 'credits_hero': {
        GameState.STATE = GameStates.CREDITS;
        Credits.init('hero', { isReplay: true, onComplete: () => this.finishReplay() });
        break;
      }
      case 'credits_betrayal': {
        GameState.STATE = GameStates.CREDITS;
        Credits.init('betrayal', { isReplay: true, onComplete: () => this.finishReplay() });
        break;
      }
      case 'credits_rampage': {
        GameState.STATE = GameStates.CREDITS;
        Credits.init('rampage', { isReplay: true, onComplete: () => this.finishReplay() });
        break;
      }
      case 'credits_shattered_mind': {
        GameState.STATE = GameStates.CREDITS;
        Credits.init('shattered_mind', { isReplay: true, onComplete: () => this.finishReplay() });
        break;
      }
      case 'credits_menu': {
        GameState.STATE = GameStates.CREDITS;
        Credits.init('menu', { isReplay: true, onComplete: () => this.finishReplay() });
        break;
      }

      default:
        console.warn(`[CinematicReplayContext] Unknown cinematicId: ${cinematicId}`);
        this.finishReplay();
        break;
    }
  },

  /**
   * Authoritative cleanup and restoration when replay finishes or is interrupted.
   */
  finishReplay() {
    if (!_isReplaying) return false;

    console.log(`[CinematicReplayContext] Teardown & Restoring snapshot from ${_activeReplayId}`);

    // 1. Reset all cinematic modules
    if (CinematicDirector.reset) CinematicDirector.reset();
    if (BossIntros.reset) BossIntros.reset();
    if (GorgarothCinematics.reset) GorgarothCinematics.reset();
    if (WardenDefeatCinematic.reset) WardenDefeatCinematic.reset();
    if (ShatteredMindCinematic.reset) ShatteredMindCinematic.reset();
    if (HeroCinematic && HeroCinematic.reset) HeroCinematic.reset();
    if (BetrayalCinematic && BetrayalCinematic.reset) BetrayalCinematic.reset();
    if (RampageCinematic && RampageCinematic.reset) RampageCinematic.reset();
    if (LastEmberCinematic && LastEmberCinematic.reset) LastEmberCinematic.reset();
    if (EpilogueCinematic && EpilogueCinematic.reset) EpilogueCinematic.reset();
    Credits.active = false;

    // 2. Restore GameState snapshot
    if (_snapshot) {
      GameState.MAP = _snapshot.map;
      GameState.ROOMS = _snapshot.rooms;
      GameState.TORCHES = _snapshot.torches;
      GameState.GATES = _snapshot.gates;
      GameState.GATE = _snapshot.gate;
      GameState.BOSS = _snapshot.boss;
      GameState.ACTIVE_MINIBOSS = _snapshot.miniboss;
      GameState.ENE = _snapshot.enemies;
      GameState.P = _snapshot.player;
      GameState.LV = _snapshot.floor;
      GameState.CAM = _snapshot.camera;
      GameState.CINEMATIC_ACTIVE = _snapshot.cinematicActive;
      GameState.BOSS_INTRO_ACTIVE = _snapshot.bossIntroActive;
      GameState.BOSS_DEAD = _snapshot.bossDead;
      GameState.BOSS_PORTAL_UNLOCKED = _snapshot.bossPortalUnlocked;
      GameState.EXPLORED_ROOMS = _snapshot.exploredRooms;
      GameState.ACTIVE_CINEMATIC_TYPE = _snapshot.activeCinematicType;
      GameState.FADE = _snapshot.fade;
      GameState.FADEIN = _snapshot.fadeIn;
      _snapshot = null;
    }

    _isReplaying = false;
    _activeReplayId = null;

    // Reset safety controller
    CinematicSafety.reset();

    // 3. Return cleanly to Cinematic Archive
    GameState.setState(GameStates.CINEMATIC_ARCHIVE);

    if (typeof _onReplayComplete === 'function') {
      const cb = _onReplayComplete;
      _onReplayComplete = null;
      try { cb(); } catch (err) { console.error('[CinematicReplayContext] Callback error:', err); }
    } else if (typeof window !== 'undefined' && window.CinematicArchiveUI && window.CinematicArchiveUI.open) {
      window.CinematicArchiveUI.open();
    }

    return true;
  }
};

if (typeof window !== 'undefined') {
  window.CinematicReplayContext = CinematicReplayContext;
}
