// =====================================================================
//  DUNGEON BREAK — js/bosses/Gorgaroth.js
//  Floor 3 Mini-Boss: Gorgaroth, The Iron Jailer
// =====================================================================

import { GameState } from '../core/GameState.js';
import { BOSS_CONFIGS } from '../data/bosses.js';
import { dealDamage } from '../combat/DamageSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { TARGET_FPS } from '../core/Constants.js';

let _gorgarothAttackId = 3000;

export const Gorgaroth = {
  config: BOSS_CONFIGS.gorgaroth,

  tick(boss, dt) {
    const { P } = GameState;
    if (!boss || !boss.alive) return;

    const dx = P.x - boss.x;
    const dy = P.y - boss.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Phase threshold: Enraged below 50% HP
    const prevPhase = boss.phase;
    boss.phase = (boss.hp / boss.maxHp) <= 0.5 ? 2 : 1;
    if (boss.phase > prevPhase) {
      GameState.CAM.shk = 16;
      SoundManager.snd('boss_roar');
      ParticleRenderer.spawnRing(boss.x, boss.y, '#f97316');
      ParticleRenderer.spawnP(boss.x, boss.y, 20, { col: '#fb923c', spd: 2.2, r: 3.5 });
    }

    const moveSpd = boss.phase === 2 ? 1.35 : 1.0;

    // Movement: Aggressive Melee Stalking
    if (!boss.charging && !boss.slamming) {
      if (dist > 1.4) {
        boss.vx += (dx / dist) * moveSpd * 0.18 * dt * TARGET_FPS;
        boss.vy += (dy / dist) * moveSpd * 0.18 * dt * TARGET_FPS;
      }
    }

    // ─────────────────────────────────────────────────────────
    // Attack 1: Melee Pillar Strike (Normal Hit — 3 HP) & Earth Slam (Heavy Hit — 5 HP)
    // ─────────────────────────────────────────────────────────
    if (dist < 2.6 && boss.atkC <= 0 && !boss.charging && !boss.slamming && !boss.swiping) {
      // In close quarters, alternate between quick pillar strike and earth slam
      const preferSwipe = dist < 1.7 && Math.random() < 0.55;
      if (preferSwipe) {
        boss.atkC = boss.phase === 2 ? 1.1 : 1.5;
        boss.swiping = true;
        boss.swipeTimer = 0.35;
        boss.swipeAttackId = ++_gorgarothAttackId;
        SoundManager.snd('weapon_clang');
      } else {
        boss.atkC = boss.phase === 2 ? 1.5 : 2.2;
        boss.slamAnim = 0.55;
        boss.slamming = true;
        boss.slamWarning = {
          x: P.x,
          y: P.y,
          timer: 0.55,
          fired: false,
          attackId: ++_gorgarothAttackId
        };
        GameState.CAM.shk = 6;
        SoundManager.snd('melee_hit');
      }
    }

    // Tick Melee Pillar Strike (3 HP Normal Hit)
    if (boss.swiping) {
      boss.swipeTimer -= dt;
      if (boss.swipeTimer <= 0) {
        boss.swiping = false;
        GameState.CAM.shk = 8;
        SoundManager.snd('melee_hit');
        ParticleRenderer.spawnRing(boss.x + (dx / dist) * 1.0, boss.y + (dy / dist) * 1.0, '#fb923c');
        if (dist < 2.0) {
          dealDamage({ isBoss: true, attackId: boss.swipeAttackId, x: boss.x, y: boss.y }, P, 3, 'melee');
        }
      }
    }

    // Tick Earth Slam (5 HP Heavy Hit)
    if (boss.slamWarning && !boss.slamWarning.fired) {
      boss.slamWarning.timer -= dt;
      if (boss.slamWarning.timer <= 0) {
        boss.slamWarning.fired = true;
        boss.slamming = false;
        GameState.CAM.shk = 16;
        SoundManager.snd('shockwave');
        ParticleRenderer.spawnRing(boss.slamWarning.x, boss.slamWarning.y, '#f97316');
        ParticleRenderer.spawnP(boss.slamWarning.x, boss.slamWarning.y, 16, { col: '#ea580c', spd: 1.8, r: 3 });

        if (Math.hypot(P.x - boss.slamWarning.x, P.y - boss.slamWarning.y) < 2.2) {
          dealDamage({ isBoss: true, attackId: boss.slamWarning.attackId, x: boss.slamWarning.x, y: boss.slamWarning.y }, P, 5, 'heavy');
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // Attack 2: Rage Charge (Phase 2 Only — Major Attack — 8 HP)
    // ─────────────────────────────────────────────────────────
    if (boss.phase === 2 && !boss.charging && !boss.slamming && !boss.swiping && (boss.chargeCooldown || 0) <= 0 && dist > 3.0) {
      boss.charging = true;
      boss.chargeTimer = 0.75;
      boss.chargeDirX = dx / dist;
      boss.chargeDirY = dy / dist;
      boss.chargeAttackId = ++_gorgarothAttackId;
      boss.chargeCooldown = 4.0;
      SoundManager.snd('boss_roar');
      GameState.CAM.shk = 10;
    }

    if (boss.chargeCooldown > 0) boss.chargeCooldown -= dt;

    if (boss.charging) {
      boss.chargeTimer -= dt;
      boss.vx = boss.chargeDirX * 8.5;
      boss.vy = boss.chargeDirY * 8.5;
      ParticleRenderer.spawnP(boss.x, boss.y, 3, { col: '#ea580c', spd: 0.8, r: 2.5 });

      if (dist < 1.6) {
        dealDamage({ isBoss: true, attackId: boss.chargeAttackId, x: boss.x, y: boss.y }, P, 8, 'heavy');
      }

      if (boss.chargeTimer <= 0) {
        boss.charging = false;
        boss.vx = 0;
        boss.vy = 0;
        GameState.CAM.shk = 14;
        SoundManager.snd('shockwave');
      }
    }
  }
};
