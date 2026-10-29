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
    this.loadUnlockedCinematics();
    this.loadPhase3State();
    this.loadLifetimeMetrics();
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
  hasResumableRun() {
    try {
      const sv = this.loadRun();
      if (!sv || typeof sv.lv !== 'number' || sv.lv < 1) return false;
      if (sv.hp !== undefined && sv.hp <= 0) return false;
      if (sv.san !== undefined && sv.san <= 0) return false;
      return true;
    } catch (e) {
      return false;
    }
  },

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
        relics: GameState.P.relics,
        runActiveTime: GameState.RUN_ACTIVE_TIME || 0,
        floorActiveTime: GameState.FLOOR_ACTIVE_TIME || 0,
        currentRunSurvivors: GameState.CURRENT_RUN_SURVIVORS || { eligible: [], rescued: [] },
        isDeveloperExpedition: !!GameState.IS_DEVELOPER_EXPEDITION
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

  // ── Phase 6: Lifetime Progression & Speedrun Metrics ──
  loadLifetimeMetrics() {
    try {
      const d = parseInt(localStorage.getItem('db_lifetime_deaths_v1') || '0', 10);
      GameState.LIFETIME_DEATHS = isNaN(d) || d < 0 ? 0 : d;

      const bkRaw = localStorage.getItem('db_lifetime_boss_kills_v1');
      GameState.LIFETIME_BOSS_KILLS = bkRaw ? JSON.parse(bkRaw) : { gorgaroth: 0, malakor: 0, warden: 0 };
      if (typeof GameState.LIFETIME_BOSS_KILLS.gorgaroth !== 'number') GameState.LIFETIME_BOSS_KILLS.gorgaroth = 0;
      if (typeof GameState.LIFETIME_BOSS_KILLS.malakor !== 'number') GameState.LIFETIME_BOSS_KILLS.malakor = 0;
      if (typeof GameState.LIFETIME_BOSS_KILLS.warden !== 'number') GameState.LIFETIME_BOSS_KILLS.warden = 0;

      const s = parseInt(localStorage.getItem('db_cumulative_survivors_v1') || '0', 10);
      GameState.CUMULATIVE_SURVIVORS = isNaN(s) || s < 0 ? 0 : s;

      const btRaw = localStorage.getItem('db_best_run_time_v1');
      GameState.BEST_RUN_TIME = btRaw !== null ? parseFloat(btRaw) : null;
    } catch (e) {
      GameState.LIFETIME_DEATHS = 0;
      GameState.LIFETIME_BOSS_KILLS = { gorgaroth: 0, malakor: 0, warden: 0 };
      GameState.CUMULATIVE_SURVIVORS = 0;
      GameState.BEST_RUN_TIME = null;
    }
    // Deterministic check of sequential savior progression
    if (GameState.CUMULATIVE_SURVIVORS >= 5) AchievementSystem.unlock('savior');
    if (AchievementSystem.isUnlocked('savior') && GameState.CUMULATIVE_SURVIVORS >= 10) AchievementSystem.unlock('savior_2');
    if (AchievementSystem.isUnlocked('savior_2') && GameState.CUMULATIVE_SURVIVORS >= 15) AchievementSystem.unlock('savior_3');

    return {
      deaths: GameState.LIFETIME_DEATHS,
      bossKills: GameState.LIFETIME_BOSS_KILLS,
      survivors: GameState.CUMULATIVE_SURVIVORS,
      bestRunTime: GameState.BEST_RUN_TIME
    };
  },

  saveLifetimeMetrics() {
    try {
      localStorage.setItem('db_lifetime_deaths_v1', String(GameState.LIFETIME_DEATHS || 0));
      localStorage.setItem('db_lifetime_boss_kills_v1', JSON.stringify(GameState.LIFETIME_BOSS_KILLS || { gorgaroth: 0, malakor: 0, warden: 0 }));
      localStorage.setItem('db_cumulative_survivors_v1', String(GameState.CUMULATIVE_SURVIVORS || 0));
      if (GameState.BEST_RUN_TIME !== null && typeof GameState.BEST_RUN_TIME === 'number') {
        localStorage.setItem('db_best_run_time_v1', String(GameState.BEST_RUN_TIME));
      }
    } catch (e) {}
  },

  incrementLifetimeDeaths() {
    GameState.LIFETIME_DEATHS = (GameState.LIFETIME_DEATHS || 0) + 1;
    this.saveLifetimeMetrics();
    const count = GameState.LIFETIME_DEATHS;
    if (count >= 5) AchievementSystem.unlock('deaths_5');
    if (count >= 10) AchievementSystem.unlock('deaths_10');
    if (count >= 25) AchievementSystem.unlock('deaths_25');
    return count;
  },

  recordBossDefeat(bossId) {
    if (!GameState.LIFETIME_BOSS_KILLS) {
      GameState.LIFETIME_BOSS_KILLS = { gorgaroth: 0, malakor: 0, warden: 0 };
    }
    const bMap = {
      gorgaroth: 'gorgaroth',
      iron_warden: 'gorgaroth',
      malakor: 'malakor',
      void_reaver: 'malakor',
      abyss_warden: 'warden',
      warden: 'warden'
    };
    const key = bMap[bossId];
    if (key && typeof GameState.LIFETIME_BOSS_KILLS[key] === 'number') {
      GameState.LIFETIME_BOSS_KILLS[key]++;
      this.saveLifetimeMetrics();
      if (key === 'gorgaroth' && GameState.LIFETIME_BOSS_KILLS.gorgaroth >= 5) {
        AchievementSystem.unlock('gorgaroth_nemesis');
      } else if (key === 'malakor' && GameState.LIFETIME_BOSS_KILLS.malakor >= 5) {
        AchievementSystem.unlock('malakor_nemesis');
      } else if (key === 'warden' && GameState.LIFETIME_BOSS_KILLS.warden >= 5) {
        AchievementSystem.unlock('warden_nemesis');
      }
    }
  },

  recordSurvivorRescue(count = 1) {
    GameState.CUMULATIVE_SURVIVORS = (GameState.CUMULATIVE_SURVIVORS || 0) + count;
    this.saveLifetimeMetrics();
    const total = GameState.CUMULATIVE_SURVIVORS;
    if (total >= 5) AchievementSystem.unlock('savior');
    if (AchievementSystem.isUnlocked('savior') && total >= 10) AchievementSystem.unlock('savior_2');
    if (AchievementSystem.isUnlocked('savior_2') && total >= 15) AchievementSystem.unlock('savior_3');
    return total;
  },

  recordRunCompletion(elapsedSeconds) {
    if (GameState.IS_DEVELOPER_EXPEDITION) {
      console.log('[SaveSystem] Developer expedition run completion; personal best and speedrun recording bypassed.');
      return {
        time: elapsedSeconds,
        bestTime: this.getBestRunTime(),
        isNewPB: false,
        isDeveloperExpedition: true
      };
    }
    const prevBest = this.getBestRunTime();
    let isNewPB = false;
    if (typeof elapsedSeconds === 'number' && elapsedSeconds > 0) {
      if (prevBest === null || elapsedSeconds < prevBest) {
        GameState.BEST_RUN_TIME = elapsedSeconds;
        isNewPB = true;
        this.saveLifetimeMetrics();
      }
    }
    return {
      time: elapsedSeconds,
      bestTime: GameState.BEST_RUN_TIME !== null ? GameState.BEST_RUN_TIME : elapsedSeconds,
      isNewPB
    };
  },

  getBestRunTime() {
    if (GameState.BEST_RUN_TIME !== null && typeof GameState.BEST_RUN_TIME === 'number') {
      return GameState.BEST_RUN_TIME;
    }
    try {
      const bt = localStorage.getItem('db_best_run_time_v1');
      if (bt !== null) {
        const val = parseFloat(bt);
        if (!isNaN(val) && val > 0) {
          GameState.BEST_RUN_TIME = val;
          return val;
        }
      }
    } catch (e) {}
    return null;
  },

  getLifetimeDeaths() {
    if (typeof GameState !== 'undefined' && typeof GameState.LIFETIME_DEATHS === 'number') {
      return GameState.LIFETIME_DEATHS;
    }
    try {
      const d = parseInt(localStorage.getItem('db_lifetime_deaths_v1') || '0', 10);
      if (!isNaN(d) && d >= 0) {
        if (typeof GameState !== 'undefined') GameState.LIFETIME_DEATHS = d;
        return d;
      }
    } catch (e) {}
    return 0;
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
    // Check Lore Master achievement (requires all 10 canonical floor chronicles)
    const primaryChronicleIds = [
      'floor_1_seal', 'floor_2_deserters', 'floor_3_iron', 'floor_4_measure',
      'floor_5_dark', 'floor_6_void', 'floor_7_purpose', 'floor_8_blade',
      'floor_9_measure', 'floor_10_warden'
    ];
    const unlockedCount = primaryChronicleIds.filter(id => GameState.UNLOCKED_LORE[id]).length;
    if (unlockedCount >= 10) {
      AchievementSystem.unlock('lore_master');
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
      if (this.recordCinematicUnlock) {
        if (type === 'hero') this.recordCinematicUnlock('ending_hero');
        else if (type === 'betrayal') this.recordCinematicUnlock('ending_betrayal');
        else if (type === 'rampage') this.recordCinematicUnlock('ending_rampage');
      }
    } catch (e) {}
  },

  // ─────────────────────────────────────────────────────────────
  // Dedicated Cinematic Archive Persistence & Historical Recovery
  // ─────────────────────────────────────────────────────────────
  loadUnlockedCinematics() {
    try {
      let stored = JSON.parse(localStorage.getItem('db_unlocked_cinematics_v1') || '{}');
      if (typeof stored !== 'object' || stored === null) stored = {};

      // 1. Prologue descent is unlocked for any player who has played or started
      stored['the_descent'] = true;

      // 2. Authoritative historical unlock recovery from verified records only
      const ach = GameState.ACHIEVEMENTS || {};
      const ms = GameState.COMPLETION_MILESTONES || {};
      const end = GameState.ENDINGS_DISCOVERED || {};

      // Gorgaroth F3
      if ((ach.jailbreaker && ach.jailbreaker.unlocked) || ms.death_gorgaroth) {
        stored['boss_intro_gorgaroth'] = true;
        stored['boss_defeat_gorgaroth'] = true;
      }

      // Malakor F6
      if ((ach.void_shifter && ach.void_shifter.unlocked) || ms.death_malakor) {
        stored['boss_intro_malakor'] = true;
        stored['boss_defeat_malakor'] = true;
      }

      // Abyss Warden F10
      if ((ach.warden_slayer && ach.warden_slayer.unlocked) || (ach.boss_slayer && ach.boss_slayer.unlocked) || ms.death_warden) {
        stored['boss_intro_warden'] = true;
        stored['boss_defeat_warden'] = true;
      }

      // Shattered Mind (Sanity-0)
      if ((ach.lost_mind && ach.lost_mind.unlocked) || ms.death_shattered_mind) {
        stored['shattered_mind'] = true;
      }

      // Hero Ending
      if (end.hero || ms.ending_hero || (ach.hero && ach.hero.unlocked)) {
        stored['ending_hero'] = true;
        stored['boss_intro_warden'] = true;
        stored['boss_defeat_warden'] = true;
      }

      // Betrayal Ending
      if (end.betrayal || ms.ending_betrayal || (ach.betrayal && ach.betrayal.unlocked)) {
        stored['ending_betrayal'] = true;
        stored['boss_intro_warden'] = true;
        stored['boss_defeat_warden'] = true;
      }

      // Rampage Ending
      if (end.rampage || ms.ending_rampage || (ach.rampage && ach.rampage.unlocked)) {
        stored['ending_rampage'] = true;
        stored['boss_intro_warden'] = true;
        stored['boss_defeat_warden'] = true;
      }

      // The Unmeasured Hour Epilogue (Unlocked when any of the 3 Warden endings is completed)
      if (end.hero || end.betrayal || end.rampage || ms.ending_hero || ms.ending_betrayal || ms.ending_rampage || ms.epilogue_unmeasured_hour) {
        stored['epilogue_unmeasured_hour'] = true;
      }

      // The Last Ember Secret Gift
      if (this.isPhase3GiftEligible() || (ach.the_last_witness && ach.the_last_witness.unlocked)) {
        stored['the_last_ember'] = true;
      }

      // 3. Sanitize accidental badge/cheat unlocks: ensure only legitimately earned visions remain unlocked
      const kills = GameState.BESTIARY_KILLS || {};
      const hasGorgaroth = (kills.gorgaroth > 0) || ms.death_gorgaroth || (ach.jailbreaker && ach.jailbreaker.unlocked);
      const hasMalakor = (kills.malakor > 0) || ms.death_malakor || (ach.void_shifter && ach.void_shifter.unlocked);
      const hasWarden = (kills.warden > 0) || ms.death_warden || (ach.warden_slayer && ach.warden_slayer.unlocked) || (ach.boss_slayer && ach.boss_slayer.unlocked) || end.hero || end.betrayal || end.rampage;

      if (!hasGorgaroth) {
        delete stored['boss_intro_gorgaroth'];
        delete stored['boss_defeat_gorgaroth'];
      }
      if (!hasMalakor) {
        delete stored['boss_intro_malakor'];
        delete stored['boss_defeat_malakor'];
      }
      if (!hasWarden) {
        delete stored['boss_intro_warden'];
        delete stored['boss_defeat_warden'];
      }
      if (!end.hero && !ms.ending_hero && !(ach.hero && ach.hero.unlocked)) {
        delete stored['ending_hero'];
        delete stored['credits_hero'];
      }
      if (!end.betrayal && !ms.ending_betrayal && !(ach.betrayal && ach.betrayal.unlocked)) {
        delete stored['ending_betrayal'];
        delete stored['credits_betrayal'];
      }
      if (!end.rampage && !ms.ending_rampage && !(ach.rampage && ach.rampage.unlocked)) {
        delete stored['ending_rampage'];
        delete stored['credits_rampage'];
      }
      if (!end.hero && !end.betrayal && !end.rampage && !ms.epilogue_unmeasured_hour) {
        delete stored['epilogue_unmeasured_hour'];
        delete stored['credits_menu'];
      }
      if (!ms.death_shattered_mind && !(ach.lost_mind && ach.lost_mind.unlocked)) {
        delete stored['shattered_mind'];
        delete stored['credits_shattered_mind'];
      }
      if (!this.isPhase3GiftEligible() && !(ach.the_last_witness && ach.the_last_witness.unlocked)) {
        delete stored['the_last_ember'];
      }

      GameState.UNLOCKED_CINEMATICS = stored;
      localStorage.setItem('db_unlocked_cinematics_v1', JSON.stringify(stored));
      return stored;
    } catch (e) {
      GameState.UNLOCKED_CINEMATICS = { 'the_descent': true };
      return GameState.UNLOCKED_CINEMATICS;
    }
  },

  recordCinematicUnlock(id) {
    if (!id || typeof id !== 'string') return false;
    if (!GameState.UNLOCKED_CINEMATICS) this.loadUnlockedCinematics();
    if (!GameState.UNLOCKED_CINEMATICS[id]) {
      GameState.UNLOCKED_CINEMATICS[id] = true;
      try {
        localStorage.setItem('db_unlocked_cinematics_v1', JSON.stringify(GameState.UNLOCKED_CINEMATICS));
      } catch (e) {}
      console.log(`[SaveSystem] Cinematic genuinely unlocked: ${id}`);
      return true;
    }
    return false;
  },

  unlockCinematic(id) {
    return this.recordCinematicUnlock(id);
  },

  isCinematicUnlocked(id) {
    if (!GameState.UNLOCKED_CINEMATICS) this.loadUnlockedCinematics();
    return !!(GameState.UNLOCKED_CINEMATICS && GameState.UNLOCKED_CINEMATICS[id]);
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

    if (GameState.IS_DEBUG_ENDING || GameState.IS_DEVELOPER_EXPEDITION) {
      console.log(`[SaveSystem] Debug / developer expedition active, milestone ignored: ${id}`);
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

  // ── Developer Sanctum Persistence & Verification ──
  isSanctumFallbackConsumed() {
    try {
      return localStorage.getItem('db_sanctum_fallback_consumed') === 'true';
    } catch (e) {
      return false;
    }
  },

  consumeSanctumFallback() {
    try {
      localStorage.setItem('db_sanctum_fallback_consumed', 'true');
      console.log('[SaveSystem] Developer Sanctum one-time fallback consumed upon deployment.');
    } catch (e) {}
  },

  isGiftCinematicCompleted() {
    try {
      return localStorage.getItem('db_gift_cinematic_completed') === 'true';
    } catch (e) {
      return false;
    }
  },

  recordGiftCinematicCompleted() {
    try {
      localStorage.setItem('db_gift_cinematic_completed', 'true');
      console.log('[SaveSystem] The Last Ember gift cinematic watched completely through final frame.');
    } catch (e) {}
  },

  isTheLastWitnessUnlocked() {
    if (ACHIEVEMENTS.last_witness && ACHIEVEMENTS.last_witness.unlocked) return true;
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
    return VALID_MILESTONES.every(k => !!m[k]);
  },

  isSanctumPermanentEligible() {
    return this.isTheLastWitnessUnlocked() && this.isGiftCinematicCompleted();
  },

  isSanctumPermanentUnlocked() {
    try {
      return localStorage.getItem('db_sanctum_permanent_unlocked') === 'true' && this.isSanctumPermanentEligible();
    } catch (e) {
      return false;
    }
  },

  unlockSanctumPermanently() {
    try {
      localStorage.setItem('db_sanctum_permanent_unlocked', 'true');
      console.log('[SaveSystem] Developer Sanctum permanent access consecrated.');
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
