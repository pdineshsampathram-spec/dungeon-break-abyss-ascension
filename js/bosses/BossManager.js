// =====================================================================
//  DUNGEON BREAK — js/bosses/BossManager.js
//  Authoritative Boss Lifecycle, Spawning, AI Updates, & Defeat Pipeline
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { getFloorBoss, isBossFloor } from '../data/floors.js';
import { COLS, ROWS, TARGET_FPS } from '../core/Constants.js';
import { solidAt } from '../world/PathValidator.js';
import { SoundManager } from '../audio/AudioManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { BossIntros } from '../cinematics/BossIntros.js';
import { triggerCinematicBanner } from '../ui/HUD.js';
import { EventBus } from '../core/EventBus.js';

import { Gorgaroth } from './Gorgaroth.js';
import { Malakor } from './Malakor.js';
import { AbyssWarden } from './AbyssWarden.js';
import { EndingCinematics, EndingDispatcher } from '../cinematics/EndingCinematics.js';
import { WardenDefeatCinematic } from '../cinematics/WardenDefeatCinematic.js';
import { GorgarothCinematics } from '../cinematics/GorgarothCinematics.js';

export const BossManager = {
  spawnBoss(bossIdOverride = null) {
    const { LV } = GameState;
    const bossId = bossIdOverride || getFloorBoss(LV);
    if (!bossId) {
      GameState.BOSS = null;
      GameState.ACTIVE_MINIBOSS = null;
      return;
    }

    const cx = (COLS / 2) | 0;
    const cy = (ROWS / 2) | 0;

    let name = 'THE ABYSS WARDEN';
    let title = 'Scourge of the Sunken Citadel';
    let type = 'abyss_warden';
    let hp = 400;

    if (bossId === 'gorgaroth') {
      name = 'GORGAROTH';
      title = 'The Iron Jailer';
      type = 'iron_warden';
      hp = 180;
    } else if (bossId === 'malakor') {
      name = 'MALAKOR';
      title = 'The Void Sorcerer';
      type = 'void_reaver';
      hp = 240;
    }

    const spawnY = (bossId === 'abyss_warden') ? cy - 6 : cy - 2;

    GameState.BOSS = {
      id: bossId,
      x: cx,
      y: spawnY,
      name,
      title,
      type,
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      alive: true,
      phase: 1,
      atkC: 2.5,
      ph: 0,
      hitFlash: 0,
      icd: 0,
      dAnim: 0,
      slamAnim: 0,
      slamWarning: null,
      projC: 3.0,
      isBoss: true,
      teleportC: 0,
      vulnTimer: 0,
      attacks: []
    };

    GameState.ACTIVE_MINIBOSS = GameState.BOSS;
    GameState.BOSS_DEAD = false;
    GameState.BOSS_PORTAL_UNLOCKED = false;
    GameState.BOSS_AI_ACTIVE = false;
    GameState.BOSS_INTRO_ACTIVE = true;
    GameState.BOSS_PROJECTILES = [];
    GameState.BOSS_HAZARDS = [];

    if (bossId === 'abyss_warden' && WardenDefeatCinematic && WardenDefeatCinematic.reset) {
      WardenDefeatCinematic.reset();
    }
    if (bossId === 'gorgaroth' && GorgarothCinematics && GorgarothCinematics.reset) {
      GorgarothCinematics.reset();
    }

    BossIntros.start(bossId);
    EventBus.emit('boss:spawned', GameState.BOSS);
  },

  tick(dt) {
    const { BOSS, P, LV } = GameState;
    if (!BOSS) return;

    if (BOSS.hp <= 0) {
      if (BOSS.id === 'abyss_warden') {
        if (BOSS.alive && !WardenDefeatCinematic.isActive() && !WardenDefeatCinematic.isDefeated() && !EndingDispatcher.isDispatched()) {
          BOSS.alive = false;
          GameState.BOSS_DEAD = true;
          WardenDefeatCinematic.start(BOSS);
        }
        return;
      }
      if (BOSS.id === 'gorgaroth') {
        if (BOSS.alive && !GorgarothCinematics.isActive() && !GorgarothCinematics.isDefeated()) {
          BOSS.alive = false;
          BOSS.vx = 0;
          BOSS.vy = 0;
          BOSS.attacks = [];
          BOSS.slamWarning = null;
          GameState.BOSS_PROJECTILES = [];
          GameState.BOSS_HAZARDS = [];
          GameState.BOSS_DEAD = true;
          GameState.BOSS_PORTAL_UNLOCKED = false;
          GameState.BOSS_AI_ACTIVE = false;
          EventBus.emit('boss:defeated', BOSS);
          GorgarothCinematics.startDefeat(BOSS);
        }
        return;
      }
      if (BOSS.alive) {
        BOSS.alive = false;
        BOSS.vx = 0;
        BOSS.vy = 0;
        BOSS.attacks = [];
        BOSS.slamWarning = null;
        GameState.BOSS_PROJECTILES = [];
        GameState.BOSS_HAZARDS = [];
        GameState.BOSS_DEAD = true;
        GameState.BOSS_PORTAL_UNLOCKED = false;
        GameState.BOSS_AI_ACTIVE = false;
        EventBus.emit('boss:defeated', BOSS);
        BossIntros.startDefeat(BOSS);
        return;
      }
      return;
    }

    if (!GameState.BOSS_AI_ACTIVE && BOSS.alive) {
      BOSS.ph += 0.03 * dt * TARGET_FPS;
      return;
    }

    if (!BOSS.alive) {
      return;
    }

    // Tick timers
    BOSS.ph += 0.03 * dt * TARGET_FPS;
    if (BOSS.atkC > 0) BOSS.atkC = Math.max(0, BOSS.atkC - dt);
    if (BOSS.hitFlash > 0) BOSS.hitFlash = Math.max(0, BOSS.hitFlash - dt);
    if (BOSS.icd > 0) BOSS.icd = Math.max(0, BOSS.icd - dt);
    if (BOSS.slamAnim > 0) BOSS.slamAnim = Math.max(0, BOSS.slamAnim - dt);
    if (BOSS.projC > 0) BOSS.projC = Math.max(0, BOSS.projC - dt);

    // Delegate to individual boss modules
    if (BOSS.id === 'gorgaroth') {
      Gorgaroth.tick(BOSS, dt);
    } else if (BOSS.id === 'malakor') {
      Malakor.tick(BOSS, dt);
    } else {
      AbyssWarden.tick(BOSS, dt);
    }

    // Natural physics & collision resolution
    BOSS.vx *= Math.pow(0.85, dt * TARGET_FPS);
    BOSS.vy *= Math.pow(0.85, dt * TARGET_FPS);

    const nx = BOSS.x + BOSS.vx * dt;
    const ny = BOSS.y + BOSS.vy * dt;
    if (!solidAt(nx, BOSS.y)) BOSS.x = nx; else BOSS.vx *= -0.5;
    if (!solidAt(BOSS.x, ny)) BOSS.y = ny; else BOSS.vy *= -0.5;
  }
};

export const spawnBoss = (id) => BossManager.spawnBoss(id);
export const tickBoss = (dt) => BossManager.tick(dt);

if (typeof window !== 'undefined') {
  window.spawnBoss = spawnBoss;
  window.tickBoss = tickBoss;
  Object.defineProperty(window, 'BOSS', {
    get: () => GameState.BOSS,
    set: (v) => { GameState.BOSS = v; },
    configurable: true
  });
  Object.defineProperty(window, 'ACTIVE_MINIBOSS', {
    get: () => GameState.ACTIVE_MINIBOSS,
    set: (v) => { GameState.ACTIVE_MINIBOSS = v; },
    configurable: true
  });
  Object.defineProperty(window, 'BOSS_DEAD', {
    get: () => GameState.BOSS_DEAD,
    set: (v) => { GameState.BOSS_DEAD = v; },
    configurable: true
  });
  Object.defineProperty(window, 'BOSS_PORTAL_UNLOCKED', {
    get: () => GameState.BOSS_PORTAL_UNLOCKED,
    set: (v) => { GameState.BOSS_PORTAL_UNLOCKED = v; },
    configurable: true
  });
  Object.defineProperty(window, 'BOSS_AI_ACTIVE', {
    get: () => GameState.BOSS_AI_ACTIVE,
    set: (v) => { GameState.BOSS_AI_ACTIVE = v; },
    configurable: true
  });
}
