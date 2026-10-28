// =====================================================================
//  DUNGEON BREAK — js/combat/ProjectileSystem.js
//  Authoritative Projectile Physics, Lifetime, & Impact Resolution
// =====================================================================

import { GameState } from '../core/GameState.js';
import { WD } from '../data/weapons.js';
import { dealDamage } from './DamageSystem.js';
import { isBossFloor } from '../data/floors.js';
import { T } from '../core/Constants.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SanitySystem } from '../systems/SanitySystem.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';

let _projId = 0;

export const ProjectileSystem = {
  spawnProjectile(wx, wy, vx, vy, damage, isBoss = false, fromPlayer = true) {
    GameState.PROJECTILES.push({
      id: ++_projId,
      x: wx,
      y: wy,
      vx,
      vy,
      life: 0,
      damage,
      fromPlayer,
      hit: false,
      isBoss
    });
  },

  tick(dt, solidAt) {
    const { PROJECTILES, ENE, BOSS, P, LV } = GameState;
    const maxLife = (WD.bow.projRange || 14) / (WD.bow.projSpd || 8.5);

    for (let i = PROJECTILES.length - 1; i >= 0; i--) {
      const pr = PROJECTILES[i];
      if (pr.hit) {
        PROJECTILES.splice(i, 1);
        continue;
      }

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life += dt;

      // Wall collision
      if (solidAt && solidAt(pr.x, pr.y)) {
        PROJECTILES.splice(i, 1);
        continue;
      }

      // Max lifetime
      if (pr.life > (pr.maxLife || maxLife)) {
        PROJECTILES.splice(i, 1);
        continue;
      }

      // 1. Non-player projectile (Enemy or Boss) hitting player
      if (!pr.fromPlayer) {
        if (!P.dead && Math.hypot(pr.x - P.x, pr.y - P.y) < 0.65) {
          if (!pr.id) pr.id = ++_projId;
          const atkId = pr.attackId ? ('boss_atk_' + pr.attackId) : ('enemy_proj_' + pr.id);
          const didDamage = dealDamage({ isEnemy: true, isBoss: !!pr.isBoss, attackId: atkId, x: pr.x, y: pr.y }, P, pr.damage || 1, 'ranged');
          if (didDamage && pr.sanityDamage) {
            const now = GameState.TIME || (Date.now() / 1000);
            P._lastSanityDrainAtk = P._lastSanityDrainAtk || {};
            const burstKey = pr.attackId ? ('burst_' + pr.attackId) : 'burst_recent';
            if (!P._lastSanityDrainAtk[burstKey] || (now - P._lastSanityDrainAtk[burstKey] > 0.4)) {
              P._lastSanityDrainAtk[burstKey] = now;
              SanitySystem.drain(pr.sanityDamage);
            }
          }
          pr.hit = true;
          PROJECTILES.splice(i, 1);
          continue;
        }
      }

      // 2. Player arrow hitting enemies or boss
      if (pr.fromPlayer) {
        let didHit = false;
        if (!pr.id) pr.id = ++_projId;
        const atkId = 'arrow_' + pr.id;

        // Check boss hit with generous hitbox (1.4 tile radius)
        if (BOSS && BOSS.alive) {
          const bossR = BOSS.r || 1.4;
          if (Math.hypot(pr.x - BOSS.x, pr.y - BOSS.y) < bossR) {
            dealDamage({ isPlayer: true, fromPlayer: true, attackId: atkId, x: pr.x, y: pr.y }, BOSS, pr.damage, 'ranged');
            didHit = true;
          }
        }

        // Check normal enemies
        for (let j = ENE.length - 1; j >= 0 && !didHit; j--) {
          const e = ENE[j];
          if (!e.alive) continue;
          const er = e.r || 0.65;
          if (Math.hypot(pr.x - e.x, pr.y - e.y) < er) {
            didHit = true;
            dealDamage({ isPlayer: true, fromPlayer: true, attackId: atkId, x: pr.x, y: pr.y }, e, pr.damage, 'ranged');
            if (e.hp <= 0) {
              GameState.BOW_KILLS = (GameState.BOW_KILLS || 0) + 1;
              if (GameState.BOW_KILLS >= 10) {
                AchievementSystem.unlock('sharpshooter');
              }
            }
          }
        }

        if (didHit) {
          pr.hit = true;
          ParticleRenderer.spawnP(pr.x, pr.y, 4, { col: '#cbd5e1', spd: 0.9, r: 1.8 });
          PROJECTILES.splice(i, 1);
        }
      }
    }
  },

  draw(ctx) {
    GameState.PROJECTILES.forEach(pr => {
      const px = pr.x * T + T / 2;
      const py = pr.y * T + T / 2;
      ctx.save();

      if (pr.isBoss) {
        // Boss void/hellfire orb
        const glowCol = pr.col || '#7c3aed';
        ctx.shadowColor = glowCol;
        ctx.shadowBlur = 16;
        ctx.fillStyle = glowCol;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, 6.28);
        ctx.fill();
      } else if (!pr.fromPlayer) {
        // Red Enemy Fireball / Magic Missile
        const fCol = pr.col || '#ef4444';
        ctx.shadowColor = fCol;
        ctx.shadowBlur = 14;
        ctx.fillStyle = fCol;
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, 6.28);
        ctx.fill();
      } else {
        // Authentic Dark-Fantasy Arrow (Oak shaft, steel broadhead tip, pale fletching)
        const ang = Math.atan2(pr.vy, pr.vx);
        ctx.translate(px, py);
        ctx.rotate(ang);

        if (!GameState.REDUCED_MOTION) {
          ctx.shadowColor = 'rgba(203, 213, 225, 0.4)';
          ctx.shadowBlur = 4;
        }

        // Wooden Shaft
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(5, 0);
        ctx.stroke();

        // White Fletching (Tail)
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(-12, -2.5);
        ctx.lineTo(-7, 0);
        ctx.lineTo(-12, 2.5);
        ctx.closePath();
        ctx.fill();

        // Steel Broadhead Triangular Tip
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(5, -2.8);
        ctx.lineTo(12, 0);
        ctx.lineTo(5, 2.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });
  }
};

export const spawnProjectile = (wx, wy, vx, vy, dmg, isBoss, fromPlayer) =>
  ProjectileSystem.spawnProjectile(wx, wy, vx, vy, dmg, isBoss, fromPlayer);

if (typeof window !== 'undefined') {
  window.spawnProjectile = spawnProjectile;
  window.ProjectileSystem = ProjectileSystem;
}
