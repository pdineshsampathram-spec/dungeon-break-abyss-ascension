// =====================================================================
//  DUNGEON BREAK — js/entities/Survivor.js
//  Entity representation for trapped dungeon survivors
// =====================================================================

export class Survivor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.rescued = false;
    this.ph = Math.random() * 6.28;
  }
}
