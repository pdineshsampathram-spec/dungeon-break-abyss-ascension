// =====================================================================
//  DUNGEON BREAK — js/systems/ProgressionSystem.js
//  Authoritative Abyss Souls, Sanctum Talents, & Prestige Meta-Progression
// =====================================================================

import { GameState } from '../core/GameState.js';
import { TALENT_DEFS, LEGACY_DEFS } from '../data/talents.js';
import { SaveSystem } from './SaveSystem.js';
import { AchievementSystem } from './AchievementSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { PlayerStats } from '../player/PlayerStats.js';

let _lastBuyTime = 0;

export const ProgressionSystem = {
  addSouls(count) {
    if (count <= 0) return;
    const relicBonus = GameState.P?.relics && GameState.P.relics.includes('blood_chalice') ? 1.5 : 1.0;
    const harvestBonus = 1 + ((GameState.TALENTS?.soul_harvest || 0) * 0.12);
    const legacyBonus = 1 + ((GameState.LEGACY_TALENTS?.legacy_souls || 0) * 0.25);
    const totalGained = count * relicBonus * harvestBonus * legacyBonus + (GameState._fractionalSouls || 0);
    const actual = Math.floor(totalGained);
    GameState._fractionalSouls = totalGained - actual;

    if (actual > 0) {
      GameState.ABYSS_SOULS += actual;
      SaveSystem.saveSouls();

      if (GameState.ABYSS_SOULS >= 100) {
        AchievementSystem.unlock('soul_ascendant');
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // SOUL TALENTS
  // ─────────────────────────────────────────────────────────────
  getTalentRank(key) {
    return (GameState.TALENTS && GameState.TALENTS[key]) || 0;
  },

  canBuyTalent(key) {
    const def = TALENT_DEFS[key];
    if (!def) return false;
    const curRank = this.getTalentRank(key);
    if (curRank >= def.max) return false;
    const cost = def.costs[curRank];
    return (GameState.ABYSS_SOULS || 0) >= cost;
  },

  buyTalent(key) {
    const now = performance.now();
    if (now - _lastBuyTime < 200) return false; // Double-click debounce lock

    const def = TALENT_DEFS[key];
    if (!def) return false;
    const curRank = this.getTalentRank(key);
    if (curRank >= def.max) return false;
    const cost = def.costs[curRank];

    if ((GameState.ABYSS_SOULS || 0) >= cost) {
      _lastBuyTime = now;
      GameState.ABYSS_SOULS -= cost;
      if (!GameState.TALENTS) GameState.TALENTS = {};
      GameState.TALENTS[key] = curRank + 1;
      SaveSystem.saveSouls();
      SaveSystem.saveTalents();

      // Immediately synchronize live player stats if player exists
      if (GameState.P) {
        if (key === 'vitality') {
          const oldMax = GameState.P.maxHp || 10;
          GameState.P.maxHp = PlayerStats.getEffectiveMaxHp();
          GameState.P.hp = Math.min(GameState.P.maxHp, (GameState.P.hp || 10) + 2);
          GameState.P.displayHp = GameState.P.hp;
        } else if (key === 'technique_mastery') {
          GameState.P.qMaxCooldown = PlayerStats.getSpecialCooldown();
        }
      }

      SoundManager.snd('talent_unlock');

      if (curRank + 1 >= def.max) {
        AchievementSystem.unlock('maxed_talent');
      }
      return true;
    }
    return false;
  },

  upgradeTalent(key) {
    return this.buyTalent(key);
  },

  // ─────────────────────────────────────────────────────────────
  // PRESTIGE LEGACY UPGRADES
  // ─────────────────────────────────────────────────────────────
  getLegacyRank(key) {
    return (GameState.LEGACY_TALENTS && GameState.LEGACY_TALENTS[key]) || 0;
  },

  canBuyLegacy(key) {
    const def = LEGACY_DEFS[key];
    if (!def) return false;
    const curRank = this.getLegacyRank(key);
    if (curRank >= def.max) return false;
    const cost = def.costs[curRank];
    return (GameState.PRESTIGE_TOKENS || 0) >= cost;
  },

  buyLegacy(key) {
    const now = performance.now();
    if (now - _lastBuyTime < 200) return false; // Double-click debounce lock

    const def = LEGACY_DEFS[key];
    if (!def) return false;
    const curRank = this.getLegacyRank(key);
    if (curRank >= def.max) return false;
    const cost = def.costs[curRank];

    if ((GameState.PRESTIGE_TOKENS || 0) >= cost) {
      _lastBuyTime = now;
      GameState.PRESTIGE_TOKENS -= cost;
      if (!GameState.LEGACY_TALENTS) GameState.LEGACY_TALENTS = {};
      GameState.LEGACY_TALENTS[key] = curRank + 1;
      SaveSystem.saveSouls(); // saves db_prestige_tokens
      SaveSystem.saveLegacyTalents();

      // Immediately synchronize live player stats
      if (GameState.P) {
        if (key === 'legacy_defense') {
          GameState.P.maxHp = PlayerStats.getEffectiveMaxHp();
          GameState.P.hp = Math.min(GameState.P.maxHp, (GameState.P.hp || 10) + 15);
          GameState.P.displayHp = GameState.P.hp;
        } else if (key === 'legacy_mastery') {
          GameState.P.qMaxCooldown = PlayerStats.getSpecialCooldown();
        }
      }

      SoundManager.snd('talent_unlock');
      return true;
    }
    return false;
  },

  // ─────────────────────────────────────────────────────────────
  // AUTHORITATIVE STAT PREVIEW CALCULATIONS
  // ─────────────────────────────────────────────────────────────
  getStatPreview(key, rank) {
    switch (key) {
      case 'vitality': {
        const curHp = 10 + rank * 2;
        const nextHp = 10 + (rank + 1) * 2;
        return { current: `${curHp} Max HP`, next: `${nextHp} Max HP`, bonus: '+2 Max HP' };
      }
      case 'iron_skin': {
        const curRes = rank * 5;
        const nextRes = (rank + 1) * 5;
        return { current: `${curRes}% Damage Resistance`, next: `${nextRes}% Damage Resistance`, bonus: '+5% Resistance' };
      }
      case 'resilience': {
        const curTrap = rank * 15;
        const nextTrap = (rank + 1) * 15;
        return { current: `-${curTrap}% Trap Damage`, next: `-${nextTrap}% Trap Damage`, bonus: '-15% Trap Dmg & +10 Sanity' };
      }
      case 'hunters_focus': {
        const curDmg = Math.round((1 + rank * 0.12) * 100);
        const nextDmg = Math.round((1 + (rank + 1) * 0.12) * 100);
        return { current: `${curDmg}% Bow Power`, next: `${nextDmg}% Bow Power`, bonus: '+12% Bow Dmg & Velocity' };
      }
      case 'rift_discipline': {
        const curCd = Math.round((1 - rank * 0.10) * 100);
        const nextCd = Math.round((1 - (rank + 1) * 0.10) * 100);
        return { current: `${curCd}% Dagger CD`, next: `${nextCd}% Dagger CD`, bonus: '-10% Dagger CD & +15% Lunge' };
      }
      case 'explosive_might': {
        const curRad = Math.round((1 + rank * 0.15) * 100);
        const nextRad = Math.round((1 + (rank + 1) * 0.15) * 100);
        return { current: `${curRad}% Axe Radius`, next: `${nextRad}% Axe Radius`, bonus: '+15% Radius & +12% Dmg' };
      }
      case 'lance_precision': {
        const curRng = Math.round((1 + rank * 0.15) * 100);
        const nextRng = Math.round((1 + (rank + 1) * 0.15) * 100);
        return { current: `${curRng}% Spear Reach`, next: `${nextRng}% Spear Reach`, bonus: '+15% Reach & +10% Dmg' };
      }
      case 'fury': {
        const curDmg = Math.round((1 + rank * 0.15) * 100);
        const nextDmg = Math.round((1 + (rank + 1) * 0.15) * 100);
        return { current: `${curDmg}% Attack Power`, next: `${nextDmg}% Attack Power`, bonus: '+15% Attack Power' };
      }
      case 'haste': {
        const curSpd = (4.0 * (1 + rank * 0.08)).toFixed(1);
        const nextSpd = (4.0 * (1 + (rank + 1) * 0.08)).toFixed(1);
        return { current: `${curSpd} Speed`, next: `${nextSpd} Speed`, bonus: '+8% Movement Speed' };
      }
      case 'technique_mastery': {
        const curCd = (Math.max(2.5, 5.0 - rank * 0.4)).toFixed(1);
        const nextCd = (Math.max(2.5, 5.0 - (rank + 1) * 0.4)).toFixed(1);
        return { current: `${curCd}s Special CD`, next: `${nextCd}s Special CD`, bonus: '-0.4s Weapon Special CD' };
      }
      case 'clarity': {
        const curDrain = Math.round((1 - rank * 0.12) * 100);
        const nextDrain = Math.round((1 - (rank + 1) * 0.12) * 100);
        return { current: `${curDrain}% Sanity Drain`, next: `${nextDrain}% Sanity Drain`, bonus: '-12% Sanity Drain' };
      }
      case 'siphon': {
        const curRate = rank * 5;
        const nextRate = (rank + 1) * 5;
        return { current: `${curRate}% Leech Chance`, next: `${nextRate}% Leech Chance`, bonus: '+5% HP Leech on Hit' };
      }
      case 'soul_harvest': {
        const curHarv = rank * 12;
        const nextHarv = (rank + 1) * 12;
        return { current: `+${curHarv}% Souls Gain`, next: `+${nextHarv}% Souls Gain`, bonus: '+12% Souls on Kill' };
      }
      default:
        return { current: 'Rank ' + rank, next: 'Rank ' + (rank + 1), bonus: '' };
    }
  },

  getLegacyPreview(key, rank) {
    switch (key) {
      case 'legacy_souls': {
        const cur = rank * 25;
        const next = (rank + 1) * 25;
        return { current: `+${cur}% Permanent Souls`, next: `+${next}% Permanent Souls`, bonus: '+25% Souls All Runs' };
      }
      case 'legacy_defense': {
        const curHp = rank * 15;
        const nextHp = (rank + 1) * 15;
        return { current: `+${curHp} HP / +${rank * 10}% Res`, next: `+${nextHp} HP / +${(rank + 1) * 10}% Res`, bonus: '+15 Max HP & +10% Res' };
      }
      case 'legacy_sanity': {
        const cur = rank * 25;
        const next = (rank + 1) * 25;
        return { current: `-${cur}% Sanity Drain`, next: `-${next}% Sanity Drain`, bonus: '-25% Sanity Drain & Mirage Immunity' };
      }
      case 'legacy_defiance': {
        return { current: rank > 0 ? 'Surge Ready (Once/Run)' : 'Inactive', next: 'Surge Ready (Once/Run)', bonus: 'Lethal Revive + 3.5s Shield' };
      }
      case 'legacy_mastery': {
        const curCd = rank * 1.0;
        const nextCd = (rank + 1) * 1.0;
        return { current: `-${curCd.toFixed(1)}s CD / +${rank * 10}% Crit`, next: `-${nextCd.toFixed(1)}s CD / +${(rank + 1) * 10}% Crit`, bonus: '-1.0s Special CD & +10% Crit' };
      }
      default:
        return { current: 'Rank ' + rank, next: 'Rank ' + (rank + 1), bonus: '' };
    }
  }
};

if (typeof window !== 'undefined') {
  window.ProgressionSystem = ProgressionSystem;
}
