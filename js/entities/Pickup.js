// =====================================================================
//  DUNGEON BREAK — js/entities/Pickup.js
//  Entity representation for health, sanity, shield, weapon, and soul pickups
// =====================================================================

export class Pickup {
  constructor(x, y, kind, options = {}) {
    this.x = x;
    this.y = y;
    this.kind = kind; // 'health' | 'sanity' | 'shield' | 'weapon' | 'soul'
    this.taken = false;
    this.sub = options.sub || null;
    this.rarity = options.rarity || null;
    this.affixes = options.affixes || [];
    this.val = options.val || 1;
    this.echoData = options.echoData || null;
    this.scrollData = options.scrollData || null;
  }
}
