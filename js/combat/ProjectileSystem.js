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
      if (pr.life > maxLife) {
        PROJECTILES.splice(i, 1);
        continue;
      }

      // Boss projectile hitting player
      if (pr.isBoss) {
        if (!P.dead && Math.hypot(pr.x - P.x, pr.y - P.y) < 0.6) {
          dealDamage({ isBoss: true, attackId: 'boss_proj_' + pr.id, x: pr.x, y: pr.y }, P, pr.damage, 'boss');
          pr.hit = true;
          PROJECTILES.splice(i, 1);
          continue;
        }
      }

      // Player arrow hitting enemies or boss
      if (pr.fromPlayer) {
        let didHit = false;

        // Check boss hit
        if (BOSS && BOSS.alive && isBossFloor(LV)) {
          if (Math.hypot(pr.x - BOSS.x, pr.y - BOSS.y) < 0.9) {
            dealDamage({ fromPlayer: true, attackId: 'arrow_' + pr.id, x: pr.x, y: pr.y }, BOSS, pr.damage, 'ranged');
            didHit = true;
          }
        }

        // Check normal enemies
        for (let j = ENE.length - 1; j >= 0 && !didHit; j--) {
          const e = ENE[j];
          if (!e.alive) continue;
          if (Math.hypot(pr.x - e.x, pr.y - e.y) < 0.6) {
            didHit = true;
            dealDamage({ fromPlayer: true, attackId: 'arrow_' + pr.id, x: pr.x, y: pr.y }, e, pr.damage, 'ranged');
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
        ctx.shadowColor = '#7c3aed';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = 'rgba(167,139,250,0.8)';
        ctx.beginPath();
        ctx.arc(px - 2, py - 2, 2.5, 0, 6.28);
        ctx.fill();
      } else {
        const ang = Math.atan2(pr.vy, pr.vx);
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.moveTo(7, -2.5);
        ctx.lineTo(13, 0);
        ctx.lineTo(7, 2.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
  }
};

export const spawnProjectile = (wx, wy, vx, vy, dmg, isBoss, fromPlayer) =>
  ProjectileSystem.spawnProjectile(wx, wy, vx, vy, dmg, isBoss, fromPlayer);

if (typeof window !== 'undefined') {
  window.spawnProjectile = spawnProjectile;
}
