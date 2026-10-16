// =====================================================================
//  DUNGEON BREAK — js/systems/SaveSystem.js
//  Authoritative LocalStorage Persistence & Profile Management
// =====================================================================

import { GameState } from '../core/GameState.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { TALENT_DEFS, LEGACY_DEFS } from '../data/talents.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { AchievementSystem } from './AchievementSystem.js';

export const DEFAULT_SETTINGS = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  muted: false,
  screenShake: true,
  reducedMotion: false,
  gameSpeed: 1.0
};

export const SaveSystem = {
  // Load all persisted data on startup
  loadAll() {
    this.loadSettings();
    this.loadSouls();
    this.loadTalents();
    this.loadLegacyTalents();
    this.loadAchievements();
    this.loadLore();
    this.loadBestiary();
    this.loadSecretBestiary();
    this.loadMemories();
    this.loadNGPlus();
    this.loadEndings();
    this.loadMilestones();
    this.checkTheLastWitness(false);
    this.loadPhase3State();
  },

  // Settings Persistence
  loadSettings() {
    try {
      const raw = localStorage.getItem('db_settings_v8');
      const s = raw ? JSON.parse(raw) : {};
      const settings = {
        masterVolume: typeof s.masterVolume === 'number' ? s.masterVolume : DEFAULT_SETTINGS.masterVolume,
        musicVolume: typeof s.musicVolume === 'number' ? s.musicVolume : DEFAULT_SETTINGS.musicVolume,
        sfxVolume: typeof s.sfxVolume === 'number' ? s.sfxVolume : DEFAULT_SETTINGS.sfxVolume,
        muted: typeof s.muted === 'boolean' ? s.muted : DEFAULT_SETTINGS.muted,
        screenShake: typeof s.screenShake === 'boolean' ? s.screenShake : DEFAULT_SETTINGS.screenShake,
        reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
        gameSpeed: typeof s.gameSpeed === 'number' ? s.gameSpeed : DEFAULT_SETTINGS.gameSpeed
      };
      this.applySettings(settings);
      return settings;
    } catch (e) {
      this.applySettings(DEFAULT_SETTINGS);
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem('db_settings_v8', JSON.stringify(settings));
      this.applySettings(settings);
    } catch (e) {
      console.warn('[SaveSystem] Failed to save settings:', e);
    }
  },

  getSettings() {
    try {
      const raw = localStorage.getItem('db_settings_v8');
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {}
    return { ...DEFAULT_SETTINGS };
  },

  applySettings(settings) {
    if (!settings) return;
    if (MusicManager) {
      MusicManager.setMasterVolume(settings.masterVolume);
      MusicManager.setMusicVolume(settings.musicVolume);
      MusicManager.setMuted(settings.muted);
    }
    if (SoundManager) {
      SoundManager.setMasterVolume(settings.masterVolume);
      SoundManager.setSfxVolume(settings.sfxVolume);
      SoundManager.setMuted(settings.muted);
    }
    if (typeof settings.gameSpeed === 'number') {
      GameState.GAME_SPEED = Math.max(0.5, Math.min(2.0, settings.gameSpeed));
    }
    if (typeof settings.screenShake === 'boolean') {
      GameState.SCREEN_SHAKE_ENABLED = settings.screenShake;
    }
    if (typeof settings.reducedMotion === 'boolean') {
      GameState.REDUCED_MOTION = settings.reducedMotion;
    }
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

  // Prestige Legacy Talents
  loadLegacyTalents() {
    try {
      const savedL = JSON.parse(localStorage.getItem('db_legacy_v8') || '{}');
      if (!GameState.LEGACY_TALENTS) GameState.LEGACY_TALENTS = {};
      Object.keys(LEGACY_DEFS).forEach(k => {
        if (typeof savedL[k] === 'number') {
          GameState.LEGACY_TALENTS[k] = Math.max(0, Math.min(LEGACY_DEFS[k].max, savedL[k]));
        } else if (GameState.LEGACY_TALENTS[k] === undefined) {
          GameState.LEGACY_TALENTS[k] = 0;
        }
      });
    } catch (e) {}
  },

  saveLegacyTalents() {
    try {
      localStorage.setItem('db_legacy_v8', JSON.stringify(GameState.LEGACY_TALENTS));
    } catch (e) {}
  },

  // Authoritative Prestige Award Rule
  // 1 Token awarded genuinely on completing Warden endings (Hero, Betrayal, Rampage).
  // Strictly one-shot per run. Bypassed by menu credits, debug, deaths, or repeated callbacks.
  awardPrestigeToken(endingType) {
    if (endingType === 'menu') return false;
    if (GameState.IS_DEBUG_ENDING) return false;
    if (GameState.RUN_PRESTIGE_AWARDED) return false;
    if (!['hero', 'betrayal', 'rampage'].includes(endingType)) return false;

    GameState.RUN_PRESTIGE_AWARDED = true;
    GameState.PRESTIGE_TOKENS = (GameState.PRESTIGE_TOKENS || 0) + 1;
    this.saveSouls(); // saves db_prestige_tokens
    console.log(`[SaveSystem] Awarded 1 Prestige Token for ending: ${endingType}. Total: ${GameState.PRESTIGE_TOKENS}`);
    return true;
  },

  unlockLore(loreId) {
    if (!loreId) return;
    if (!GameState.UNLOCKED_LORE) GameState.UNLOCKED_LORE = {};
    if (!GameState.UNLOCKED_LORE[loreId]) {
      GameState.UNLOCKED_LORE[loreId] = true;
      this.saveLore();
    }
  },

  unlockMemory(memId) {
    if (!memId) return;
    if (!GameState.UNLOCKED_MEMORIES) GameState.UNLOCKED_MEMORIES = {};
    if (!GameState.UNLOCKED_MEMORIES[memId]) {
      GameState.UNLOCKED_MEMORIES[memId] = true;
      this.saveMemories();
    }
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

  // New Game+ Persistence
  loadNGPlus() {
    try {
      const ng = parseInt(localStorage.getItem('db_ng_plus') || '0', 10);
      GameState.NEW_GAME_PLUS = isNaN(ng) || ng < 0 ? 0 : ng;
    } catch (e) {
      GameState.NEW_GAME_PLUS = 0;
    }
  },

  saveNGPlus() {
    try {
      localStorage.setItem('db_ng_plus', (GameState.NEW_GAME_PLUS || 0).toString());
    } catch (e) {}
  },

  startNGPlus() {
    GameState.NEW_GAME_PLUS = (GameState.NEW_GAME_PLUS || 0) + 1;
    this.saveNGPlus();
    this.clearRun();
  },

  // Endings Discovered
  loadEndings() {
    try {
      GameState.ENDINGS_DISCOVERED = JSON.parse(localStorage.getItem('db_endings_v1') || '{}');
    } catch (e) {
      GameState.ENDINGS_DISCOVERED = {};
    }
  },

  recordEnding(type) {
    try {
      const endings = JSON.parse(localStorage.getItem('db_endings_v1') || '{}');
      endings[type] = true;
      localStorage.setItem('db_endings_v1', JSON.stringify(endings));
      GameState.ENDINGS_DISCOVERED = endings;
    } catch (e) {}
  },

  // Secret Bestiary Entries (e.g. 'absolute' unlocked via Shattered Mind)
  loadSecretBestiary() {
    try {
      GameState.SECRET_BESTIARY = JSON.parse(localStorage.getItem('db_secret_bestiary_v1') || '{}');
    } catch (e) {
      GameState.SECRET_BESTIARY = {};
    }
  },

  saveSecretBestiary() {
    try {
      localStorage.setItem('db_secret_bestiary_v1', JSON.stringify(GameState.SECRET_BESTIARY || {}));
    } catch (e) {}
  },

  unlockSecretBestiary(id) {
    if (!id) return;
    if (!GameState.SECRET_BESTIARY) GameState.SECRET_BESTIARY = {};
    if (!GameState.SECRET_BESTIARY[id]) {
      GameState.SECRET_BESTIARY[id] = true;
      this.saveSecretBestiary();
      console.log(`[SaveSystem] Secret Bestiary unlocked: ${id}`);
    }
  },

  isSecretBestiaryUnlocked(id) {
    return !!(GameState.SECRET_BESTIARY && GameState.SECRET_BESTIARY[id]);
  },

  // Authoritative Completion Milestones (The 8 Fates required for The Last Witness)
  loadMilestones() {
    try {
      GameState.COMPLETION_MILESTONES = JSON.parse(localStorage.getItem('db_milestones_v1') || '{}');
    } catch (e) {
      GameState.COMPLETION_MILESTONES = {};
    }
  },

  saveMilestones() {
    try {
      localStorage.setItem('db_milestones_v1', JSON.stringify(GameState.COMPLETION_MILESTONES || {}));
    } catch (e) {}
  },

  recordCompletionMilestone(id, context = {}) {
    if (!id || typeof id !== 'string') return false;
    const VALID_MILESTONES = [
      'death_normal_enemy',
      'death_gorgaroth',
      'death_malakor',
      'death_warden',
      'death_shattered_mind',
      'ending_hero',
      'ending_betrayal',
      'ending_rampage'
    ];
    if (!VALID_MILESTONES.includes(id)) {
      console.warn(`[SaveSystem] Invalid milestone ID: ${id}`);
      return false;
    }

    if (GameState.IS_DEBUG_ENDING) {
      console.log(`[SaveSystem] Debug mode active, milestone ignored: ${id}`);
      return false;
    }

    if (!GameState.COMPLETION_MILESTONES) GameState.COMPLETION_MILESTONES = {};
    const alreadyCompleted = !!GameState.COMPLETION_MILESTONES[id];

    if (!alreadyCompleted) {
      GameState.COMPLETION_MILESTONES[id] = true;
      this.saveMilestones();
      console.log(`[SaveSystem] Genuine milestone recorded: ${id}`, context);
    }

    // Check completion criteria for The Last Witness
    this.checkTheLastWitness(true);

    return !alreadyCompleted;
  },

  getMilestones() {
    return GameState.COMPLETION_MILESTONES || {};
  },

  checkTheLastWitness(triggerToast = true) {
    const m = GameState.COMPLETION_MILESTONES || {};
    const VALID_MILESTONES = [
      'death_normal_enemy',
      'death_gorgaroth',
      'death_malakor',
      'death_warden',
      'death_shattered_mind',
      'ending_hero',
      'ending_betrayal',
      'ending_rampage'
    ];
    const completedCount = VALID_MILESTONES.filter(k => !!m[k]).length;

    if (completedCount === VALID_MILESTONES.length) {
      if (!ACHIEVEMENTS.last_witness || !ACHIEVEMENTS.last_witness.unlocked) {
        if (triggerToast) {
          AchievementSystem.unlock('last_witness');
        } else {
          if (ACHIEVEMENTS.last_witness) ACHIEVEMENTS.last_witness.unlocked = true;
          this.saveAchievements();
        }
        console.log('[SaveSystem] All 8 milestones met! The Last Witness unlocked.');
      }
      // Authoritative Phase 3 Gift Eligibility (unlocked genuinely via all 8 milestones)
      localStorage.setItem('db_phase3_gift_eligible', 'true');
      GameState.PHASE3_GIFT_ELIGIBLE = true;
    } else if (ACHIEVEMENTS.last_witness && ACHIEVEMENTS.last_witness.unlocked) {
      // Also respect existing unlocked achievement state
      localStorage.setItem('db_phase3_gift_eligible', 'true');
      GameState.PHASE3_GIFT_ELIGIBLE = true;
    }
  },

  loadPhase3State() {
    try {
      const eligible = localStorage.getItem('db_phase3_gift_eligible') === 'true';
      const dismissed = localStorage.getItem('db_phase3_invitation_dismissed') === 'true';
      GameState.PHASE3_GIFT_ELIGIBLE = eligible || !!(ACHIEVEMENTS.last_witness && ACHIEVEMENTS.last_witness.unlocked);
      GameState.PHASE3_INVITATION_DISMISSED = dismissed;
    } catch (e) {
      GameState.PHASE3_GIFT_ELIGIBLE = false;
      GameState.PHASE3_INVITATION_DISMISSED = false;
    }
  },

  isPhase3GiftEligible() {
    if (GameState.PHASE3_GIFT_ELIGIBLE) return true;
    if (ACHIEVEMENTS.last_witness && ACHIEVEMENTS.last_witness.unlocked) return true;
    try {
      return localStorage.getItem('db_phase3_gift_eligible') === 'true';
    } catch (e) {
      return false;
    }
  },

  isPhase3InvitationDismissed() {
    if (GameState.PHASE3_INVITATION_DISMISSED) return true;
    try {
      return localStorage.getItem('db_phase3_invitation_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  },

  dismissPhase3Invitation() {
    GameState.PHASE3_INVITATION_DISMISSED = true;
    try {
      localStorage.setItem('db_phase3_invitation_dismissed', 'true');
    } catch (e) {}
  },

  init() {
    this.loadAll();
  },

  saveProfile() {
    this.saveSouls();
    this.saveTalents();
    this.saveLegacyTalents();
    this.saveAchievements();
    this.saveLore();
    this.saveBestiary();
    this.saveSecretBestiary();
    this.saveMemories();
    this.saveNGPlus();
    this.saveMilestones();
  },

  // Authoritative alias for saveProfile
  save() {
    this.saveProfile();
  },

  loadProfile() {
    this.loadAll();
  }
};
