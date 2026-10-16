// =====================================================================
//  DUNGEON BREAK — js/player/PlayerStats.js
//  Dynamic Player Stat Aggregation (Talents, Legacy Perks, Relics, Weapon Buffs)
// =====================================================================

import { GameState } from '../core/GameState.js';

export const PlayerStats = {
  getEffectiveMaxHp() {
    const vitalityRank = (GameState.TALENTS && GameState.TALENTS.vitality) || 0;
    const legacyDefRank = (GameState.LEGACY_TALENTS && GameState.LEGACY_TALENTS.legacy_defense) || 0;
    return 10 + vitalityRank * 2 + legacyDefRank * 15;
  },

  getEffectiveSpeed() {
    const hasteRank = (GameState.TALENTS && GameState.TALENTS.haste) || 0;
    return 4.0 * (1 + hasteRank * 0.08);
  },

  getEffectiveDamageMultiplier(weaponId = null) {
    const furyRank = (GameState.TALENTS && GameState.TALENTS.fury) || 0;
    let baseMult = 1 + furyRank * 0.15;

    // Weapon-specific Soul Talents
    if (weaponId === 'bow') {
      const hRank = (GameState.TALENTS && GameState.TALENTS.hunters_focus) || 0;
      baseMult *= (1 + hRank * 0.12);
    } else if (weaponId === 'dagger') {
      const dRank = (GameState.TALENTS && GameState.TALENTS.rift_discipline) || 0;
      baseMult *= (1 + dRank * 0.08);
    } else if (weaponId === 'axe') {
      const aRank = (GameState.TALENTS && GameState.TALENTS.explosive_might) || 0;
      baseMult *= (1 + aRank * 0.12);
    } else if (weaponId === 'spear') {
      const sRank = (GameState.TALENTS && GameState.TALENTS.lance_precision) || 0;
      baseMult *= (1 + sRank * 0.10);
    }

    const boost = (GameState.P && GameState.P.dmgBoost) ? GameState.P.dmgBoost : 1.0;
    return baseMult * boost;
  },

  getDamageResistance() {
    const ironRank = (GameState.TALENTS && GameState.TALENTS.iron_skin) || 0;
    const legacyDefRank = (GameState.LEGACY_TALENTS && GameState.LEGACY_TALENTS.legacy_defense) || 0;
    // Capped at 50% max flat damage mitigation
    return Math.min(0.50, ironRank * 0.05 + legacyDefRank * 0.10);
  },

  getCriticalChance(weaponId = null) {
    const furyRank = (GameState.TALENTS && GameState.TALENTS.fury) || 0;
    const legacyMastery = (GameState.LEGACY_TALENTS && GameState.LEGACY_TALENTS.legacy_mastery) || 0;
    return 0.08 + furyRank * 0.08 + legacyMastery * 0.10;
  },

  getSpecialCooldown() {
    const techRank = (GameState.TALENTS && GameState.TALENTS.technique_mastery) || 0;
    const legMastery = (GameState.LEGACY_TALENTS && GameState.LEGACY_TALENTS.legacy_mastery) || 0;
    return Math.max(2.5, 5.0 - techRank * 0.4 - legMastery * 1.0);
  },

  getTrapDamageResistance() {
    const resilienceRank = (GameState.TALENTS && GameState.TALENTS.resilience) || 0;
    return Math.min(0.60, resilienceRank * 0.15);
  },

  getEffectiveMaxSanity() {
    const resilienceRank = (GameState.TALENTS && GameState.TALENTS.resilience) || 0;
    return 100 + resilienceRank * 10;
  }
};

