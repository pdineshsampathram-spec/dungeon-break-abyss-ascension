// =====================================================================
//  DUNGEON BREAK — js/bosses/BossManager.js
//  Authoritative Boss Lifecycle, Spawning, AI Updates, & Defeat Pipeline
// =====================================================================

import { GameState } from '../core/GameState.js';
import { getFloorBoss, isBossFloor } from '../data/floors.js';
import { COLS, ROWS, TARGET_FPS } from '../core/Constants.js';
import { solidAt } from '../world/PathValidator.js';
import { dealDamage } from '../combat/DamageSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { EventBus } from '../core/EventBus.js';

let _bossAttackCounter = 0;

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

    GameState.BOSS = {
      id: bossId,
      x: cx,
      y: cy - 2,
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
      attacks: []
    };

    GameState.ACTIVE_MINIBOSS = GameState.BOSS;
    GameState.BOSS_DEAD = false;
    GameState.BOSS_PORTAL_UNLOCKED = false;
    GameState.BOSS_AI_ACTIVE = false;
    GameState.BOSS_INTRO_ACTIVE = true;
    GameState.BOSS_PROJECTILES = [];
    GameState.BOSS_HAZARDS = [];

    EventBus.emit('boss:spawned', GameState.BOSS);
  },

  tick(dt) {
    const { BOSS, P, PROJECTILES, LV } = GameState;
    if (!BOSS) return;

    if (!GameState.BOSS_AI_ACTIVE && BOSS.alive) {
      BOSS.ph += 0.03 * dt * TARGET_FPS;
      return;
    }

    // Death sequence
    if (!BOSS.alive) {
      BOSS.dAnim = Math.max(0, (BOSS.dAnim || 0) - dt);
      if (BOSS.dAnim <= 0 && !GameState.BOSS_PORTAL_UNLOCKED) {
        GameState.BOSS_PORTAL_UNLOCKED = true;
        GameState.BOSS_DEAD = true;
        GameState.CAM.shk = 18;

        if (BOSS.id === 'gorgaroth') AchievementSystem.unlock('jailbreaker');
        if (BOSS.id === 'malakor') AchievementSystem.unlock('void_conqueror');
        if (BOSS.id === 'abyss_warden') AchievementSystem.unlock('boss_slayer');

        SoundManager.snd('boss_roar');
        EventBus.emit('boss:defeated', BOSS);
      }
      return;
    }

    BOSS.ph += 0.03 * dt * TARGET_FPS;
    if (BOSS.atkC > 0) BOSS.atkC = Math.max(0, BOSS.atkC - dt);
    if (BOSS.hitFlash > 0) BOSS.hitFlash = Math.max(0, BOSS.hitFlash - dt);
    if (BOSS.icd > 0) BOSS.icd = Math.max(0, BOSS.icd - dt);
    if (BOSS.slamAnim > 0) BOSS.slamAnim = Math.max(0, BOSS.slamAnim - dt);
    if (BOSS.projC > 0) BOSS.projC = Math.max(0, BOSS.projC - dt);

    const hpPct = BOSS.hp / BOSS.maxHp;
    const prevPhase = BOSS.phase;
    if (hpPct <= 0.3) BOSS.phase = 3;
    else if (hpPct <= 0.65) BOSS.phase = 2;
    else BOSS.phase = 1;

    if (BOSS.phase > prevPhase) {
      GameState.CAM.shk = 16;
      SoundManager.snd('boss_roar');
      EventBus.emit('boss:phase_change', { boss: BOSS, phase: BOSS.phase });
    }

    const dx = P.x - BOSS.x;
    const dy = P.y - BOSS.y;
    const dist = Math.hypot(dx, dy) || 1;

    const spd =
      BOSS.type === 'iron_warden' ? (BOSS.phase === 3 ? 1.2 : 0.9) :
      BOSS.type === 'void_reaver' ? 1.3 :
      (BOSS.phase === 3 ? 1.6 : BOSS.phase === 2 ? 1.3 : 1.0);

    // Smooth physics steering with friction
    if (dist > 1.2) {
      BOSS.vx += (dx / dist) * spd * 0.15 * dt * TARGET_FPS;
      BOSS.vy += (dy / dist) * spd * 0.15 * dt * TARGET_FPS;
    }
    const curSpd = Math.hypot(BOSS.vx, BOSS.vy);
    if (curSpd > spd * dt * TARGET_FPS) {
      BOSS.vx = (BOSS.vx / curSpd) * spd * dt * TARGET_FPS;
      BOSS.vy = (BOSS.vy / curSpd) * spd * dt * TARGET_FPS;
    }
    BOSS.vx *= Math.pow(0.85, dt * TARGET_FPS);
    BOSS.vy *= Math.pow(0.85, dt * TARGET_FPS);

    const nx = BOSS.x + BOSS.vx;
    const ny = BOSS.y + BOSS.vy;
    if (!solidAt(nx, BOSS.y)) BOSS.x = nx; else BOSS.vx *= -0.5;
    if (!solidAt(BOSS.x, ny)) BOSS.y = ny; else BOSS.vy *= -0.5;

    // Melee Ground Slam Telegraph
    if (dist < 1.8 && BOSS.atkC <= 0) {
      BOSS.atkC = BOSS.phase === 3 ? 1.0 : 1.6;
      BOSS.slamAnim = 0.4;
      BOSS.slamWarning = {
        x: P.x,
        y: P.y,
        timer: 0.6,
        fired: false,
        attackId: ++_bossAttackCounter
      };
      GameState.CAM.shk = 6;
      SoundManager.snd('melee_hit');
    }

    if (BOSS.slamWarning && !BOSS.slamWarning.fired) {
      BOSS.slamWarning.timer = Math.max(0, BOSS.slamWarning.timer - dt);
      if (BOSS.slamWarning.timer <= 0) {
        BOSS.slamWarning.fired = true;
        GameState.CAM.shk = 14;
        if (Math.hypot(P.x - BOSS.slamWarning.x, P.y - BOSS.slamWarning.y) < 2.0) {
          dealDamage({ isBoss: true, attackId: BOSS.slamWarning.attackId, x: BOSS.slamWarning.x, y: BOSS.slamWarning.y }, P, 2, 'boss');
        }
      }
    }

    // Ranged Projectile Spreads
    if (BOSS.projC <= 0 && (BOSS.type === 'void_reaver' || BOSS.phase >= 2)) {
      BOSS.projC = BOSS.phase === 3 ? 1.2 : 2.0;
      const ang = Math.atan2(dy, dx);
      const count = BOSS.type === 'void_reaver' ? 4 : (BOSS.phase === 3 ? 3 : 1);
      const atkId = ++_bossAttackCounter;

      for (let i = -count; i <= count; i += 2) {
        const a = ang + i * 0.25;
        PROJECTILES.push({
          x: BOSS.x,
          y: BOSS.y,
          vx: Math.cos(a) * 8.5,
          vy: Math.sin(a) * 8.5,
          life: 0,
          maxLife: 4.5,
          damage: 1,
          fromPlayer: false,
          hit: false,
          isBoss: true,
          attackId: atkId
        });
      }
    }
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
