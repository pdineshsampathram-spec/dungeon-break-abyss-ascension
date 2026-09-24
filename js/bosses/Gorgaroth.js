// =====================================================================
//  DUNGEON BREAK — js/bosses/Gorgaroth.js
//  Floor 3 Mini-Boss: Gorgaroth, Breaker of Chains
// =====================================================================

import { BOSS_CONFIGS } from '../data/bosses.js';

export const Gorgaroth = {
  config: BOSS_CONFIGS.gorgaroth,

  getAttackPatterns(phase) {
    return phase === 3
      ? ['earth_slam', 'rage_charge', 'iron_cleave']
      : ['earth_slam', 'iron_cleave'];
  }
};
