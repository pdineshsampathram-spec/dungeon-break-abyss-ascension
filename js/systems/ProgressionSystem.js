// =====================================================================
//  DUNGEON BREAK — js/systems/ProgressionSystem.js
//  Authoritative Abyss Souls, Sanctum Talents, & Prestige Meta-Progression
// =====================================================================

import { GameState } from '../core/GameState.js';
import { TALENT_DEFS } from '../data/talents.js';
import { SaveSystem } from './SaveSystem.js';
import { AchievementSystem } from './AchievementSystem.js';
import { SoundManager } from '../audio/AudioManager.js';

export const ProgressionSystem = {
  addSouls(count) {
    if (count <= 0) return;
    const bonus = GameState.P.relics && GameState.P.relics.includes('blood_chalice') ? 1.5 : 1.0;
    const actual = Math.round(count * bonus);
    GameState.ABYSS_SOULS += actual;
    SaveSystem.saveSouls();

    if (GameState.ABYSS_SOULS >= 100) {
      AchievementSystem.unlock('soul_ascendant');
    }
  },

  getTalentRank(key) {
    return (GameState.TALENTS && GameState.TALENTS[key]) || 0;
  },

  canBuyTalent(key) {
    const def = TALENT_DEFS[key];
    if (!def) return false;
    const curRank = this.getTalentRank(key);
    if (curRank >= def.max) return false;
    const cost = def.costs[curRank];
    return GameState.ABYSS_SOULS >= cost;
  },

  buyTalent(key) {
    const def = TALENT_DEFS[key];
    if (!def) return false;
    const curRank = this.getTalentRank(key);
    if (curRank >= def.max) return false;
    const cost = def.costs[curRank];

    if (GameState.ABYSS_SOULS >= cost) {
      GameState.ABYSS_SOULS -= cost;
      GameState.TALENTS[key] = curRank + 1;
      SaveSystem.saveSouls();
      SaveSystem.saveTalents();
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
  }
};
