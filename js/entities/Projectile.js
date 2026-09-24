// =====================================================================
//  DUNGEON BREAK — js/entities/Projectile.js
//  Entity representation for in-flight arrows, spells, and boss missiles
// =====================================================================

import { ProjectileSystem } from '../combat/ProjectileSystem.js';

export class Projectile {
  constructor(x, y, vx, vy, damage, isBoss = false, fromPlayer = true) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isBoss = isBoss;
    this.fromPlayer = fromPlayer;
    this.life = 0;
    this.hit = false;
  }

  static spawn(x, y, vx, vy, damage, isBoss = false, fromPlayer = true) {
    return ProjectileSystem.spawnProjectile(x, y, vx, vy, damage, isBoss, fromPlayer);
  }
}
