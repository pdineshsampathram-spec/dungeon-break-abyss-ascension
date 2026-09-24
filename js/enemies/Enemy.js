// =====================================================================
//  DUNGEON BREAK — js/enemies/Enemy.js
//  Enemy entity data structure & constructor
// =====================================================================

export class Enemy {
  constructor(x, y, type = 'skeleton', hp = 3, isElite = false) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.alive = true;
    this.hp = hp;
    this.maxHp = hp;
    this.type = type;
    this.alertT = 0;
    this.atkC = 0;
    this.ph = Math.random() * 6.28;
    this.dAnim = 0.4;
    this.hitFlash = 0;
    this.animState = 'idle';
    this.animTimer = 0;
    this.walkCycle = 0;
    this.isElite = isElite;
    this.telegraphing = false;
    this.telegraphTimer = 0;
  }
}
