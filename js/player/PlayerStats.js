// =====================================================================
//  DUNGEON BREAK — js/player/PlayerStats.js
//  Dynamic Player Stat Aggregation (Talents, Relics, Weapon Buffs)
// =====================================================================

import { GameState } from '../core/GameState.js';

export const PlayerStats = {
  getEffectiveMaxHp() {
    const vitalityRank = (GameState.TALENTS && GameState.TALENTS.vitality) || 0;
    return 10 + vitalityRank * 2;
  },

  getEffectiveSpeed() {
    const hasteRank = (GameState.TALENTS && GameState.TALENTS.haste) || 0;
    return 4.0 * (1 + hasteRank * 0.08);
  },

  getEffectiveDamageMultiplier() {
    const furyRank = (GameState.TALENTS && GameState.TALENTS.fury) || 0;
    const baseMult = 1 + furyRank * 0.15;
    return baseMult * (GameState.P.dmgBoost || 1);
  }
};
