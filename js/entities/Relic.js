// =====================================================================
//  DUNGEON BREAK — js/entities/Relic.js
//  Entity representation for passive relic artifacts
// =====================================================================

import { RELIC_DEFS } from '../data/relics.js';
import { RelicSystem } from '../systems/RelicSystem.js';

export class Relic {
  constructor(id) {
    this.id = id;
    const def = RELIC_DEFS[id] || {};
    this.name = def.name || id;
    this.icon = def.icon || '💎';
    this.col = def.col || '#fde68a';
    this.desc = def.desc || '';
  }

  static has(id) {
    return RelicSystem.hasRelic(id);
  }
}
