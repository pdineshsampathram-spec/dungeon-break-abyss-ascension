// =====================================================================
//  DUNGEON BREAK — js/entities/Trap.js
//  Entity representation for spikes, fire grates, and hazards
// =====================================================================

export class Trap {
  constructor(x, y, type = 'spike', timer = 0) {
    this.x = x;
    this.y = y;
    this.type = type; // 'spike' | 'fire'
    this.timer = timer;
  }

  isActive() {
    return this.type === 'spike' ? true : (this.timer % 2.0) < 0.92;
  }
}
