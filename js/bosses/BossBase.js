// =====================================================================
//  DUNGEON BREAK — js/bosses/BossBase.js
//  Base class / template for Boss encounters
// =====================================================================

export class BossBase {
  constructor(id, name, title, hp, type) {
    this.id = id;
    this.name = name;
    this.title = title;
    this.hp = hp;
    this.maxHp = hp;
    this.type = type;
    this.alive = true;
    this.phase = 1;
    this.vx = 0;
    this.vy = 0;
    this.atkC = 2.0;
    this.projC = 3.0;
    this.hitFlash = 0;
    this.rageWhirl = 0;
    this.slamAnim = 0;
    this.slamWarning = null;
  }
}
