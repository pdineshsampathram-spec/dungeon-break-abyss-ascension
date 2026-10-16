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
    let weaponBonus = 0;

    // Weapon-specific Soul Talents (additive bonuses to prevent runaway compounding)
    if (weaponId === 'bow') {
      const hRank = (GameState.TALENTS && GameState.TALENTS.hunters_focus) || 0;
      weaponBonus = hRank * 0.08;
    } else if (weaponId === 'dagger') {
      const dRank = (GameState.TALENTS && GameState.TALENTS.rift_discipline) || 0;
      weaponBonus = dRank * 0.06;
    } else if (weaponId === 'axe') {
      const aRank = (GameState.TALENTS && GameState.TALENTS.explosive_might) || 0;
      weaponBonus = aRank * 0.08;
    } else if (weaponId === 'spear') {
      const sRank = (GameState.TALENTS && GameState.TALENTS.lance_precision) || 0;
      weaponBonus = sRank * 0.07;
    }

    const baseMult = 1 + (furyRank * 0.10) + weaponBonus;
    const boost = (GameState.P && GameState.P.dmgBoost) ? Math.min(1.5, GameState.P.dmgBoost) : 1.0;
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

if (typeof window !== 'undefined') {
  window.PlayerStats = PlayerStats;
}

