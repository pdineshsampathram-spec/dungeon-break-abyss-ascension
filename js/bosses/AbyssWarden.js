// =====================================================================
//  DUNGEON BREAK — js/bosses/AbyssWarden.js
//  Floor 10 Arch-Demon: The Abyss Warden (3-Phase Final Encounter)
// =====================================================================

import { BOSS_CONFIGS } from '../data/bosses.js';

export const AbyssWarden = {
  config: BOSS_CONFIGS.abyss_warden,

  getAttackPatterns(phase) {
    if (phase === 3) return ['chaos_blades', 'abyssal_collapse', 'eternal_darkness'];
    if (phase === 2) return ['chaos_blades', 'abyssal_collapse'];
    return ['chaos_blades'];
  }
};
