// =====================================================================
//  DUNGEON BREAK — js/bosses/Malakor.js
//  Floor 6 Mini-Boss: Malakor, The Void Reaver
// =====================================================================

import { BOSS_CONFIGS } from '../data/bosses.js';

export const Malakor = {
  config: BOSS_CONFIGS.malakor,

  getAttackPatterns(phase) {
    return phase === 3
      ? ['void_teleport', 'soul_barrage', 'shadow_vortex']
      : ['void_teleport', 'soul_barrage'];
  }
};
