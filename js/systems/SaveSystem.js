// =====================================================================
//  DUNGEON BREAK — js/systems/SaveSystem.js
//  Authoritative LocalStorage Persistence & Profile Management
// =====================================================================

import { GameState } from '../core/GameState.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { TALENT_DEFS } from '../data/talents.js';

export const SaveSystem = {
  // Load all persisted data on startup
  loadAll() {
    this.loadSouls();
    this.loadTalents();
    this.loadAchievements();
    this.loadLore();
    this.loadBestiary();
    this.loadMemories();
  },

  // Run Save
  saveRun() {
    try {
      const data = {
        lv: GameState.LV,
        hp: GameState.P.hp,
        maxHp: GameState.P.maxHp,
        san: GameState.P.san,
        wep: GameState.P.wep,
        saved: GameState.P.saved,
        killed: GameState.P.killed,
        bowKills: GameState.BOW_KILLS,
        weaponSlots: GameState.weaponSlots,
        activeSlot: GameState.activeWeaponSlot,
        relics: GameState.P.relics
      };
      localStorage.setItem('db_save_v5', JSON.stringify(data));
    } catch (e) {
      console.warn('[SaveSystem] Failed to save run state:', e);
    }
  },

  loadRun() {
    try {
      const raw = localStorage.getItem('db_save_v5');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  clearRun() {
    try {
      localStorage.removeItem('db_save_v5');
    } catch (e) {}
  },

  // Souls & Prestige
  loadSouls() {
    try {
      const s = parseInt(localStorage.getItem('db_abyss_souls') || '0', 10);
      GameState.ABYSS_SOULS = isNaN(s) || s < 0 ? 0 : s;
      const p = parseInt(localStorage.getItem('db_prestige_tokens') || '0', 10);
      GameState.PRESTIGE_TOKENS = isNaN(p) || p < 0 ? 0 : p;
    } catch (e) {
      GameState.ABYSS_SOULS = 0;
      GameState.PRESTIGE_TOKENS = 0;
    }
  },

  saveSouls() {
    try {
      localStorage.setItem('db_abyss_souls', GameState.ABYSS_SOULS.toString());
      localStorage.setItem('db_prestige_tokens', GameState.PRESTIGE_TOKENS.toString());
    } catch (e) {}
  },

  // Talents
  loadTalents() {
    try {
      const savedT = JSON.parse(localStorage.getItem('db_talents_v8') || '{}');
      Object.keys(TALENT_DEFS).forEach(k => {
        if (typeof savedT[k] === 'number') {
          GameState.TALENTS[k] = Math.max(0, Math.min(TALENT_DEFS[k].max, savedT[k]));
        }
      });
    } catch (e) {}
  },

  saveTalents() {
    try {
      localStorage.setItem('db_talents_v8', JSON.stringify(GameState.TALENTS));
    } catch (e) {}
  },

  // Achievements
  loadAchievements() {
    try {
      const sv = JSON.parse(localStorage.getItem('db_achievements') || '{}');
      Object.keys(ACHIEVEMENTS).forEach(k => {
        if (sv[k] !== undefined) ACHIEVEMENTS[k].unlocked = !!sv[k];
      });
    } catch (e) {}
  },

  saveAchievements() {
    try {
      const o = {};
      Object.keys(ACHIEVEMENTS).forEach(k => { o[k] = ACHIEVEMENTS[k].unlocked; });
      localStorage.setItem('db_achievements', JSON.stringify(o));
    } catch (e) {}
  },

  // Codex / Lore
  loadLore() {
    try {
      GameState.UNLOCKED_LORE = JSON.parse(localStorage.getItem('db_codex_v9') || '{}');
    } catch (e) {
      GameState.UNLOCKED_LORE = {};
    }
  },

  saveLore() {
    try {
      localStorage.setItem('db_codex_v9', JSON.stringify(GameState.UNLOCKED_LORE));
    } catch (e) {}
  },

  // Bestiary
  loadBestiary() {
    try {
      const bk = JSON.parse(localStorage.getItem('db_bestiary_v9') || '{}');
      Object.keys(GameState.BESTIARY_KILLS).forEach(k => {
        if (typeof bk[k] === 'number') GameState.BESTIARY_KILLS[k] = bk[k];
      });
    } catch (e) {}
  },

  saveBestiary() {
    try {
      localStorage.setItem('db_bestiary_v9', JSON.stringify(GameState.BESTIARY_KILLS));
    } catch (e) {}
  },

  // Narrative Story Memories
  loadMemories() {
    try {
      GameState.UNLOCKED_MEMORIES = JSON.parse(localStorage.getItem('db_memories_v9') || '{}');
    } catch (e) {
      GameState.UNLOCKED_MEMORIES = {};
    }
  },

  saveMemories() {
    try {
      localStorage.setItem('db_memories_v9', JSON.stringify(GameState.UNLOCKED_MEMORIES));
    } catch (e) {}
  },

  init() {
    this.loadAll();
  },

  saveProfile() {
    this.saveSouls();
    this.saveTalents();
    this.saveAchievements();
    this.saveLore();
    this.saveBestiary();
    this.saveMemories();
  },

  loadProfile() {
    this.loadAll();
  }
};
