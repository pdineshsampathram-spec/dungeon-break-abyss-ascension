// =====================================================================
//  DUNGEON BREAK — js/enemies/EnemyAI.js
//  Authoritative Velocity Steering, State Machine, & Separation Behaviors
// =====================================================================

import { GameState } from '../core/GameState.js';
import { Config } from '../core/Config.js';
import { solidAt } from '../world/PathValidator.js';
import { dealDamage } from '../combat/DamageSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { TARGET_FPS } from '../core/Constants.js';

export const EnemyAI = {
  tickEnemy(e, ei, dt) {
    const { P, ENE, LV, PROJECTILES } = GameState;
    if (!e.alive) {
      e.dAnim = Math.max(0, (e.dAnim !== undefined ? e.dAnim : 0.4) - dt);
      return;
    }

    const diff = Config.getDiff(LV);
    e.ph = (e.ph || 0) + 0.04 * dt * TARGET_FPS;
    if (e.atkC > 0) e.atkC = Math.max(0, e.atkC - dt);
    if (e.telegraphTimer > 0) e.telegraphTimer = Math.max(0, e.telegraphTimer - dt);
    if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

    const dx = P.x - e.x;
    const dy = P.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const isWraith = e.type === 'wraith';
    const isDemon = e.type === 'demon';
    const isGhoul = e.type === 'ghoul';
    const isElite = e.isElite || e.type === 'elite';

    const sightR = isWraith ? 10 : isDemon ? 9 : isElite ? 9 : 7.5;
    const maxSpd = diff.espd * (isWraith ? 1.4 : isGhoul ? 1.25 : isDemon ? 0.95 : isElite ? 0.85 : 1.0);
    const accel = 12.0;

    // AI state machine
    if (e.hitFlash > 0.08) {
      e.aiState = 'HURT';
    } else if (dist < sightR && !P.dead) {
      if (dist < (isDemon ? 5.5 : 0.9) && e.atkC <= 0) {
        e.aiState = 'ATTACK';
      } else {
        e.aiState = 'CHASE';
      }
    } else if (e.alertT > 0) {
      e.aiState = 'ALERT';
      e.alertT -= dt * 0.4;
    } else {
      e.aiState = (e.vx || 0) * (e.vx || 0) + (e.vy || 0) * (e.vy || 0) > 0.05 ? 'PATROL' : 'IDLE';
    }

    let desiredVx = 0;
    let desiredVy = 0;

    if (e.aiState === 'CHASE') {
      if (isDemon) {
        if (dist < 3.5) {
          desiredVx = -(dx / dist) * maxSpd;
          desiredVy = -(dy / dist) * maxSpd;
        } else if (dist > 5.5) {
          desiredVx = (dx / dist) * maxSpd;
          desiredVy = (dy / dist) * maxSpd;
        } else {
          desiredVx = -(dy / dist) * maxSpd * 0.6;
          desiredVy = (dx / dist) * maxSpd * 0.6;
        }
      } else {
        desiredVx = (dx / dist) * maxSpd;
        desiredVy = (dy / dist) * maxSpd;
      }
    } else if (e.aiState === 'ATTACK') {
      if (isDemon) {
        if (!e.telegraphing) {
          e.telegraphing = true;
          e.telegraphTimer = 0.6;
        } else if (e.telegraphTimer <= 0) {
          e.telegraphing = false;
          e.atkC = 2.2;
          const ang = Math.atan2(dy, dx);
          PROJECTILES.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(ang) * 6.5,
            vy: Math.sin(ang) * 6.5,
            life: 0,
            maxLife: 3.5,
            damage: 1,
            fromPlayer: false,
            hit: false,
            isBoss: false,
            col: '#f97316'
          });
          SoundManager.snd('shockwave');
        }
      } else {
        if (!e.telegraphing) {
          e.telegraphing = true;
          e.telegraphTimer = 0.35;
        } else if (e.telegraphTimer <= 0) {
          e.telegraphing = false;
          e.atkC = isGhoul ? 0.8 : 1.2;
          if (dist < 0.95 && !P.shieldActive && P.dcd <= 0 && !P.dead) {
            dealDamage({ isEnemy: true, attackId: 'ene_' + ei + '_' + Math.floor(e.ph * 4), x: e.x, y: e.y }, P, isElite ? 2 : 1, 'melee');
          }
        }
      }
    } else if (e.aiState === 'PATROL') {
      desiredVx = Math.cos(e.ph * 0.5) * maxSpd * 0.35;
      desiredVy = Math.sin(e.ph * 0.5) * maxSpd * 0.35;
    } else if (e.aiState === 'HURT') {
      desiredVx = 0;
      desiredVy = 0;
    }

    // Velocity-based steering
    e.vx = (e.vx || 0) + (desiredVx - (e.vx || 0)) * Math.min(1, dt * accel);
    e.vy = (e.vy || 0) + (desiredVy - (e.vy || 0)) * Math.min(1, dt * accel);

    // Natural separation forces
    ENE.forEach((o, oi) => {
      if (oi === ei || !o.alive) return;
      const ox = e.x - o.x;
      const oy = e.y - o.y;
      const sd = Math.hypot(ox, oy);
      if (sd < 0.95 && sd > 0.001) {
        const push = ((0.95 - sd) / 0.95) * 3.5;
        e.vx += (ox / sd) * push * dt;
        e.vy += (oy / sd) * push * dt;
      }
    });

    e.vx *= Math.pow(0.88, dt * TARGET_FPS);
    e.vy *= Math.pow(0.88, dt * TARGET_FPS);

    // Wall slide movement
    const stepX = e.vx * dt;
    const stepY = e.vy * dt;
    if (!solidAt(e.x + stepX, e.y)) e.x += stepX; else e.vx = 0;
    if (!solidAt(e.x, e.y + stepY)) e.y += stepY; else e.vy = 0;

    // Wraith phase teleport on hit
    if (isWraith && e.hitFlash > 0.18 && Math.random() < 0.35 && (!e.lastTeleport || e.ph - e.lastTeleport > 3.0)) {
      e.lastTeleport = e.ph;
      const ang = Math.random() * 6.28;
      const tx = P.x + Math.cos(ang) * 2.5;
      const ty = P.y + Math.sin(ang) * 2.5;
      if (!solidAt(tx, ty)) {
        e.x = tx;
        e.y = ty;
      }
    }

    // Animation cycle
    const isMoving = Math.hypot(e.vx, e.vy) > 0.02;
    if (!e.alive) {
      e.animState = 'death';
    } else if (e.hitFlash > 0) {
      e.animState = 'hurt';
    } else if (isMoving) {
      e.animState = 'walk';
      e.walkCycle = (e.walkCycle || 0) + dt * 7.0;
    } else {
      e.animState = 'idle';
    }
    e.animTimer = (e.animTimer || 0) + dt;
  }
};
