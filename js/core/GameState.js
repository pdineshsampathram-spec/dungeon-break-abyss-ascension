// =====================================================================
//  DUNGEON BREAK — js/core/GameState.js
//  Authoritative Central Game State Container & State Machine
// =====================================================================

import { EventBus } from './EventBus.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';

export const GameStates = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'pause',
  BOSS_INTRO: 'boss_intro',
  CINEMATIC: 'cinematic',
  WARP: 'warp',
  SANCTUM: 'sanctum',
  CODEX: 'codex',
  SETTINGS: 'settings',
  ACHIEVEMENTS: 'achievements',
  VICTORY: 'victory',
  GAME_OVER: 'game_over',
  DYING: 'dying',
  DEATH_NORMAL: 'death_normal',
  DEATH_SANITY: 'death_sanity',
  DEATH_RESULTS: 'death_results',
  WEAPON_REPLACE: 'weapon_replace',
  MEMORY: 'memory',
  CREDITS: 'credits',
  BOSS_DEFEAT_CINEMATIC: 'boss_defeat_cinematic',
  LAST_EMBER: 'last_ember',
  CINEMATIC_ARCHIVE: 'cinematic_archive',
  DEVELOPER_SANCTUM: 'developer_sanctum'
};

export const GameState = {
  // Primary state machine
  STATE: GameStates.TITLE,
  PREV_STATE: null,

  // Floor & Progression
  LV: 1,
  LEVEL_TIMER: 0,
  LEVEL_TIME_STR: '00:00',
  LEVEL_TOOK_DAMAGE: false,
  PORTAL_USED: false,
  PORTAL_DISCOVERED: false,
  levelTransitionActive: false,
  transitionStarted: false,
  transitionComplete: false,

  // Master frame & timing
  F: 0,
  DT: 0.016,
  FREEZE_TIME: 0,
  FADE: 0,
  FADEIN: false,
  GAME_SPEED: 1.0,
  SCREEN_SHAKE_ENABLED: true,
  REDUCED_MOTION: false,

  // Developer Sanctum & Expeditions (Temporary session in-memory only)
  IS_DEVELOPER_EXPEDITION: false,
  SANCTUM_TEMP_AUTHORIZED: false,
  CUSTOM_STARTING_WEAPON: null,
  CUSTOM_STARTING_MAX_HP: null,
  DEV_MODS: {
    enabled: false,
    weaponLevel: 1,
    bowDamageBonus: 0,
    meleeDamageBonus: 0,
    specialCooldownSec: null,
    bonusMaxHp: 0,
    damageResistanceBonus: 0
  },

  // Camera
  CAM: {
    x: 0,
    y: 0,
    z: 1,
    tx: 0,
    ty: 0,
    shk: 0,
    shkX: 0,
    shkY: 0,
    trauma: 0
  },

  // Master run tracking token for session safety
  RUN_ID: 1,

  // Player Model
  P: {
    x: 3,
    y: 3,
    vx: 0,
    vy: 0,
    spd: 4.0,
    hp: 10,
    maxHp: 10,
    displayHp: 10,
    ghostHp: 10,
    ghostHpTimer: 0,
    san: 100,
    qCooldown: 0,
    qMaxCooldown: 5.0,
    furyBuffTimer: 0,
    mindShieldTimer: 0,
    hasteBuffTimer: 0,
    wep: 'sword',
    wepRarity: { name: 'Common', col: '#94a3b8', glow: 'rgba(148,163,184,0.4)', weight: 50 },
    activePrefix: null,
    activeSuffix: null,
    saved: 0,
    killed: 0,
    icd: 0,
    acd: 0,
    aanim: 0,
    dcd: 0,
    hitFlash: 0,
    fx: 1,
    fy: 0,
    shieldActive: false,
    shieldTimer: 0,
    deathCause: null,
    dead: false,
    dying: false,
    nearTorch: false,
    relics: [],
    dmgBoost: 1,
    siphonBoost: false,
    animState: 'idle',
    animTimer: 0,
    walkCycle: 0,
    breathCycle: 0
  },

  // 3-Slot Weapon Inventory (Starts with Sword in Slot 1 and Hunter's Bow in Slot 2)
  weaponSlots: [
    { id: 'sword', name: '⚔️ Sword', damage: 3.5, dmg: 3.5, range: 1.5, cooldown: 0.32, cd: 0.32, rarity: { name: 'Common', col: '#94a3b8', glow: 'rgba(148,163,184,0.4)' }, prefix: null, suffix: null, sg: 6, projectile: false },
    { id: 'bow', name: "🏹 Hunter's Bow", damage: 3.5, dmg: 3.5, range: 12.0, cooldown: 0.42, cd: 0.42, projectile: true, projSpd: 9.5, projDmg: 3.5, projRange: 14, rarity: { name: 'Common', col: '#94a3b8', glow: 'rgba(148,163,184,0.4)' }, prefix: null, suffix: null, sg: 5 },
    null
  ],
  activeWeaponSlot: 0,
  pendingWeaponDrop: null,
  ACTIVE_WEAPON_REPLACE_MODAL: null,

  // World and Level collections
  MAP: [],
  ROOMS: [],
  CORRIDORS: [],
  ENE: [],
  ALLIES: [],
  ITEMS: [],
  TRAPS: [],
  TORCHES: [],
  SHRINES: [],
  BLOOD: [],
  PROJECTILES: [],
  PRT: [],
  SLASH_TRAILS: [],
  SURVIVORS: [],
  ECHOES: [],
  ACTIVE_SPEECH_BUBBLES: [],
  GATE: null,
  GATES: [],

  // Boss state
  BOSS: null,
  ACTIVE_MINIBOSS: null,
  BOSS_DEAD: false,
  BOSS_PORTAL_UNLOCKED: false,
  BOSS_AI_ACTIVE: false,
  BOSS_INTRO_ACTIVE: false,
  BOSS_INTRO_WING_SPREAD: 1.0,
  BOSS_INTRO_EYE_GLOW: 1.0,
  BOSS_PROJECTILES: [],
  BOSS_HAZARDS: [],

  // Cinematics & Special Sequences
  CINEMATIC_ACTIVE: false,
  WARP_ACTIVE: false,
  WARP_TIMER: 0,
  WARP_QUOTE: '',
  CURRENT_MUTATION: null,
  ACTIVE_LORE_MODAL: null,
  ACTIVE_MEMORY_ECHO: null,
  MINIMAP_VISIBLE: true,
  MAP_EXPANDED: false,

  // Meta Progression (Persisted)
  ABYSS_SOULS: 0,
  PRESTIGE_TOKENS: 0,
  RUN_PRESTIGE_AWARDED: false,
  NEW_GAME_PLUS: 0,
  TALENTS: {
    vitality: 0, clarity: 0, fury: 0, haste: 0, siphon: 0,
    iron_skin: 0, resilience: 0, hunters_focus: 0, rift_discipline: 0,
    explosive_might: 0, lance_precision: 0, technique_mastery: 0, soul_harvest: 0
  },
  LEGACY_TALENTS: {
    legacy_souls: 0, legacy_defense: 0, legacy_sanity: 0, legacy_defiance: 0, legacy_mastery: 0
  },
  UNLOCKED_LORE: {},
  UNLOCKED_MEMORIES: {},
  BESTIARY_KILLS: {
    skeleton: 0, ghoul: 0, demon: 0, wraith: 0,
    gorgaroth: 0, malakor: 0, warden: 0
  },
  BOW_KILLS: 0,
  PHASE3_GIFT_ELIGIBLE: false,
  PHASE3_INVITATION_DISMISSED: false,

  // Change state machine state cleanly
  setState(newState, payload = null) {
    if (this.STATE === newState) return;
    this.PREV_STATE = this.STATE;
    this.STATE = newState;
    EventBus.emit('state:change', { from: this.PREV_STATE, to: newState, payload });
  },

  // Reset player for new run
  resetPlayer() {
    const baseHp = 10;
    const vitHp = (this.TALENTS.vitality || 0) * 2;
    const legHp = (this.LEGACY_TALENTS.legacy_defense || 0) * 15;
    let initialHp = baseHp + vitHp + legHp;
    if (this.IS_DEVELOPER_EXPEDITION && this.DEV_MODS && this.DEV_MODS.enabled) {
      initialHp += (this.DEV_MODS.bonusMaxHp || 0);
    }
    this.P.hp = Math.min(50, initialHp);
    this.P.maxHp = this.P.hp;
    this.P.displayHp = this.P.hp;
    this.P.ghostHp = this.P.hp;
    const resRank = (this.TALENTS.resilience || 0);
    this.P.maxSan = 100 + resRank * 10;
    this.P.san = this.P.maxSan;
    this.P._defianceUsed = false;
    this.P.qCooldown = 0;
    this.P.qMaxCooldown = (typeof window !== 'undefined' && window.PlayerStats)
      ? window.PlayerStats.getSpecialCooldown()
      : Math.max(2.5, 5.0 - (this.TALENTS.technique_mastery || 0) * 0.4 - (this.LEGACY_TALENTS.legacy_mastery || 0) * 1.0);
    this.P.furyBuffTimer = 0;
    this.P.mindShieldTimer = 0;
    this.P.hasteBuffTimer = 0;
    this.P.vx = 0;
    this.P.vy = 0;
    this.P.saved = 0;
    this.P.killed = 0;
    this.P.icd = 0;
    this.P.acd = 0;
    this.P.aanim = 0;
    this.P.dcd = 0;
    this.P.hitFlash = 0;
    this.P.shieldActive = false;
    this.P.shieldTimer = 0;
    this.P.deathCause = null;
    this.P.dead = false;
    this.P.dying = false;
    this.P.nearTorch = false;
    this.P.relics = [];
    this.P.dmgBoost = 1;
    this.P.siphonBoost = false;
    this.P.cinematicPose = null;
    this.P.invulnerable = false;
    this.P._hitByAttacks = {};
    this.P.animState = 'idle';
    this.P.animTimer = 0;
    this.P.walkCycle = 0;
    this.P.breathCycle = 0;
    this.P.fx = 1;
    this.P.fy = 0;

    // Reset 3 weapon slots: Slot 1 Sword, Slot 2 Hunter's Bow, Slot 3 Empty
    const baseWepLevel = (this.IS_DEVELOPER_EXPEDITION && this.DEV_MODS && this.DEV_MODS.enabled && this.DEV_MODS.weaponLevel) ? this.DEV_MODS.weaponLevel : 1;
    this.weaponSlots = [
      { id: 'sword', name: '⚔️ Steel Sword', damage: 4.0, dmg: 4.0, range: 1.5, cooldown: 0.32, cd: 0.32, rarity: { name: 'Common', col: '#94a3b8', glow: 'rgba(148,163,184,0.4)' }, prefix: null, suffix: null, sg: 6, projectile: false, level: baseWepLevel },
      { id: 'bow', name: "🏹 Hunter's Bow", damage: 4.0, dmg: 4.0, range: 12.0, cooldown: 0.42, cd: 0.42, projectile: true, projSpd: 9.5, projDmg: 4.0, projRange: 14, rarity: { name: 'Common', col: '#94a3b8', glow: 'rgba(148,163,184,0.4)' }, prefix: null, suffix: null, sg: 5, level: baseWepLevel },
      null
    ];
    this.activeWeaponSlot = 0;
    this.pendingWeaponDrop = null;
    this.ACTIVE_WEAPON_REPLACE_MODAL = null;
    this.P.wep = 'sword';
    this.P.wepRarity = this.weaponSlots[0].rarity;
    this.P._hitByAttacks = {};

    // Apply developer starting maximum health and weapon overrides strictly on Developer Expeditions
    if (this.IS_DEVELOPER_EXPEDITION) {
      if (typeof this.CUSTOM_STARTING_MAX_HP === 'number' && !isNaN(this.CUSTOM_STARTING_MAX_HP) && isFinite(this.CUSTOM_STARTING_MAX_HP)) {
        const validatedHp = Math.max(1, Math.min(50, Math.round(this.CUSTOM_STARTING_MAX_HP)));
        this.P.maxHp = validatedHp;
        this.P.hp = validatedHp;
        this.P.displayHp = validatedHp;
        this.P.ghostHp = validatedHp;
      }

      if (this.CUSTOM_STARTING_WEAPON && this.CUSTOM_STARTING_WEAPON.id) {
        try {
          const customWep = WeaponFactory.create(this.CUSTOM_STARTING_WEAPON.id, this.CUSTOM_STARTING_WEAPON.rarity || 'Common', null, baseWepLevel);
          if (customWep) {
            this.weaponSlots[0] = customWep;
            this.P.wep = customWep.id;
            this.P.wepRarity = customWep.rarity;
          }
        } catch (err) {
          console.warn('[GameState] Failed to apply custom starting weapon:', err);
        }
      }
      if (this.weaponSlots[1] && this.weaponSlots[1].id === 'bow') {
        this.weaponSlots[1] = WeaponFactory.create('bow', 'Common', null, baseWepLevel);
      }
    } else {
      this.CUSTOM_STARTING_WEAPON = null;
      this.CUSTOM_STARTING_MAX_HP = null;
      if (this.DEV_MODS) {
        this.DEV_MODS.enabled = false;
      }
    }
  },

  // Authoritative run reset delegator
  resetRunState(options = {}) {
    if (typeof window !== 'undefined' && window.RunResetManager) {
      return window.RunResetManager.resetRun(options);
    }
    import('../systems/RunResetManager.js').then(m => m.RunResetManager.resetRun(options));
  },

  // Clear level transient entities
  clearLevelEntities() {
    this.ENE = [];
    this.ITEMS = [];
    this.TORCHES = [];
    this.TRAPS = [];
    this.PRT = [];
    this.BLOOD = [];
    this.SLASH_TRAILS = [];
    this.PROJECTILES = [];
    this.BOSS_PROJECTILES = [];
    this.BOSS_HAZARDS = [];
    this.ACTIVE_SPEECH_BUBBLES = [];
    this.SHRINES = [];
    this.GATE = null;
    this.GATES = [];
    this.BOSS = null;
    this.ACTIVE_MINIBOSS = null;
    this.BOSS_DEAD = false;
    this.BOSS_PORTAL_UNLOCKED = false;
    this.BOSS_AI_ACTIVE = false;
    this.BOSS_INTRO_ACTIVE = false;
    this.levelTransitionActive = false;
    this.PORTAL_USED = false;
    this.PORTAL_DISCOVERED = false;
    this.MAP_EXPANDED = false;
    this.LEVEL_TIMER = 0;
    this.LEVEL_TIME_STR = '00:00';
    this.LEVEL_TOOK_DAMAGE = false;
    if (this.P) {
      this.P._hitByAttacks = {};
    }
  }
};

// Global debug reference
if (typeof window !== 'undefined') {
  window.DB_STATE = GameState;
  window.GameState = GameState;
}
