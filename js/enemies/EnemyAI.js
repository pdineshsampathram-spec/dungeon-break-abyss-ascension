// =====================================================================
//  DUNGEON BREAK — js/enemies/EnemyAI.js
//  Authoritative Velocity Steering, State Machine, Telegraphs & Separation
// =====================================================================

import { GameState } from '../core/GameState.js';
import { Config } from '../core/Config.js';
import { solidAt } from '../world/PathValidator.js';
import { dealDamage } from '../combat/DamageSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { TARGET_FPS } from '../core/Constants.js';

let _enemyAttackCounter = 0;

export const EnemyAI = {
  tickEnemy(e, ei, dt) {
    const { P, ENE, LV, PROJECTILES, ROOMS } = GameState;
    if (!e.alive) {
      e.dAnim = Math.max(0, (e.dAnim !== undefined ? e.dAnim : 0.45) - dt);
      return;
    }

    const diff = Config.getDiff(LV);
    e.ph = (e.ph || 0) + 0.04 * dt * TARGET_FPS;
    if (e.atkC > 0) e.atkC = Math.max(0, e.atkC - dt);
    if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

    const dx = P.x - e.x;
    const dy = P.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const isWraith = e.type === 'wraith';
    const isDemon = e.type === 'demon';
    const isGhoul = e.type === 'ghoul';
    const isElite = e.isElite || e.type === 'elite';

    // Room and proximity alertness check
    let playerInSameRoom = false;
    if (e.roomId && ROOMS && ROOMS[e.roomId]) {
      const rm = ROOMS[e.roomId];
      if (P.x >= rm.x && P.x <= rm.x + rm.w && P.y >= rm.y && P.y <= rm.y + rm.h) {
        playerInSameRoom = true;
      }
    }

    const sightR = isWraith ? 10.5 : isDemon ? 9.5 : isElite ? 9.0 : 7.5;
    if (playerInSameRoom || dist < sightR) {
      if (!e.isAlerted) {
        e.isAlerted = true;
        e.alertT = 0.35; // Brief alert pause before charge
      }
    }

    const maxSpd = diff.espd * (isWraith ? 1.4 : isGhoul ? 1.3 : isDemon ? 0.95 : isElite ? 0.85 : 1.0);
    const accel = 12.0;

    // Interrupt / cancel attack on heavy stagger
    if (e.hitFlash > 0.08) {
      e.aiState = 'HURT';
      e.telegraphing = false;
      e.telegraphTimer = 0;
    } else if (e.alertT > 0) {
      e.aiState = 'ALERT';
      e.alertT -= dt;
    } else if (e.isAlerted && !P.dead) {
      const attackRange = isDemon ? 5.5 : isGhoul ? 1.3 : 1.0;
      if (dist <= attackRange && e.atkC <= 0) {
        e.aiState = 'ATTACK';
      } else {
        e.aiState = 'CHASE';
      }
    } else {
      e.aiState = (e.vx || 0) * (e.vx || 0) + (e.vy || 0) * (e.vy || 0) > 0.05 ? 'PATROL' : 'IDLE';
    }

    let desiredVx = 0;
    let desiredVy = 0;

    // ─────────────────────────────────────────────────────────────
    // STATE: CHASE
    // ─────────────────────────────────────────────────────────────
    if (e.aiState === 'CHASE') {
      if (isDemon) {
        // Demon maintains ranged distance of ~4-5 tiles and circles
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
      } else if (isGhoul) {
        // Ghoul flanks at a slight angle
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const flankSign = (ei % 2 === 0) ? 1 : -1;
        desiredVx = ((dx / dist) * 0.75 + perpX * 0.45 * flankSign) * maxSpd;
        desiredVy = ((dy / dist) * 0.75 + perpY * 0.45 * flankSign) * maxSpd;
      } else {
        // Skeleton & Elite direct pursuit
        desiredVx = (dx / dist) * maxSpd;
        desiredVy = (dy / dist) * maxSpd;
      }
    }
    // ─────────────────────────────────────────────────────────────
    // STATE: ATTACK with Readable Telegraphs
    // ─────────────────────────────────────────────────────────────
    else if (e.aiState === 'ATTACK') {
      // 1. DEMON — Fireball projectile charge
      if (isDemon) {
        if (!e.telegraphing) {
          e.telegraphing = true;
          e.telegraphType = 'proj_charge';
          e.telegraphTimer = 0.60;
        } else {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.telegraphing = false;
            e.atkC = 2.4;
            const ang = Math.atan2(dy, dx);
            PROJECTILES.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(ang) * 7.0,
              vy: Math.sin(ang) * 7.0,
              life: 0,
              maxLife: 3.5,
              damage: isElite ? 2 : 1,
              fromPlayer: false,
              hit: false,
              isBoss: false,
              col: '#f97316'
            });
            SoundManager.snd('shockwave');
          }
        }
      }
      // 2. GHOUL — Crouches low with red glow, then leaps forward
      else if (isGhoul) {
        if (!e.telegraphing) {
          e.telegraphing = true;
          e.telegraphType = 'crouch_leap';
          e.telegraphTimer = 0.35;
        } else {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.telegraphing = false;
            e.atkC = 1.1;
            // Leap thrust
            e.vx += (dx / dist) * 6.5;
            e.vy += (dy / dist) * 6.5;
            if (dist < 1.1 && !P.shieldActive && P.dcd <= 0 && !P.dead) {
              dealDamage({ isEnemy: true, attackId: 'ghoul_' + ei + '_' + (++_enemyAttackCounter), x: e.x, y: e.y }, P, isElite ? 2 : 1, 'melee');
            }
          }
        }
      }
      // 3. WRAITH — Void glow then shadow strike
      else if (isWraith) {
        if (!e.telegraphing) {
          e.telegraphing = true;
          e.telegraphType = 'void_glow';
          e.telegraphTimer = 0.40;
        } else {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.telegraphing = false;
            e.atkC = 1.4;
            if (dist < 1.2 && !P.shieldActive && P.dcd <= 0 && !P.dead) {
              dealDamage({ isEnemy: true, attackId: 'wraith_' + ei + '_' + (++_enemyAttackCounter), x: e.x, y: e.y }, P, isElite ? 2 : 1, 'melee');
            }
          }
        }
      }
      // 4. ELITE — Red ground indicator then crushing blow
      else if (isElite) {
        if (!e.telegraphing) {
          e.telegraphing = true;
          e.telegraphType = 'ground_indicator';
          e.telegraphTimer = 0.55;
          e.groundTelegraph = { x: P.x, y: P.y, r: 1.3 };
        } else {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.telegraphing = false;
            e.atkC = 1.6;
            if (e.groundTelegraph && Math.hypot(P.x - e.groundTelegraph.x, P.y - e.groundTelegraph.y) < 1.35) {
              dealDamage({ isEnemy: true, attackId: 'elite_' + ei + '_' + (++_enemyAttackCounter), x: e.x, y: e.y }, P, 2, 'heavy');
            }
            e.groundTelegraph = null;
          }
        }
      }
      // 5. SKELETON — Weapon raises high with golden/white highlight
      else {
        if (!e.telegraphing) {
          e.telegraphing = true;
          e.telegraphType = 'weapon_raise';
          e.telegraphTimer = 0.45;
        } else {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.telegraphing = false;
            e.atkC = 1.3;
            if (dist < 1.05 && !P.shieldActive && P.dcd <= 0 && !P.dead) {
              dealDamage({ isEnemy: true, attackId: 'skel_' + ei + '_' + (++_enemyAttackCounter), x: e.x, y: e.y }, P, 1, 'melee');
            }
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────────────
    // STATE: PATROL
    // ─────────────────────────────────────────────────────────────
    else if (e.aiState === 'PATROL') {
      const hx = e.homeX || e.x;
      const hy = e.homeY || e.y;
      const toHomeX = hx - e.x;
      const toHomeY = hy - e.y;
      const homeDist = Math.hypot(toHomeX, toHomeY);

      if (homeDist > 2.5) {
        desiredVx = (toHomeX / homeDist) * maxSpd * 0.4;
        desiredVy = (toHomeY / homeDist) * maxSpd * 0.4;
      } else {
        desiredVx = Math.cos(e.ph * 0.6) * maxSpd * 0.35;
        desiredVy = Math.sin(e.ph * 0.6) * maxSpd * 0.35;
      }
    }
    // ─────────────────────────────────────────────────────────────
    // STATE: HURT
    // ─────────────────────────────────────────────────────────────
    else if (e.aiState === 'HURT') {
      desiredVx = 0;
      desiredVy = 0;
    }

    // Velocity-based steering
    e.vx = (e.vx || 0) + (desiredVx - (e.vx || 0)) * Math.min(1, dt * accel);
    e.vy = (e.vy || 0) + (desiredVy - (e.vy || 0)) * Math.min(1, dt * accel);

    // Natural separation forces (enemies maintain spacing and avoid stacking)
    ENE.forEach((o, oi) => {
      if (oi === ei || !o.alive) return;
      const ox = e.x - o.x;
      const oy = e.y - o.y;
      const sd = Math.hypot(ox, oy);
      const spacingRadius = (e.isElite || o.isElite) ? 1.25 : 0.95;
      if (sd < spacingRadius && sd > 0.001) {
        const push = ((spacingRadius - sd) / spacingRadius) * 4.0;
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

    // Wraith phase teleport on taking damage
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
    } else if (e.telegraphing) {
      e.animState = 'attack';
    } else if (isMoving) {
      e.animState = 'walk';
      e.walkCycle = (e.walkCycle || 0) + dt * 7.0;
    } else {
      e.animState = 'idle';
    }
    e.animTimer = (e.animTimer || 0) + dt;
  }
};
