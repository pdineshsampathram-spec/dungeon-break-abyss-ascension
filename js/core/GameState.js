// =====================================================================
//  DUNGEON BREAK — js/core/GameState.js
//  Authoritative Central Game State Container & State Machine
// =====================================================================

import { EventBus } from './EventBus.js';

export const GameStates = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'pause',
  BOSS_INTRO: 'boss_intro',
  CINEMATIC: 'cinematic',
  SANCTUM: 'sanctum',
  CODEX: 'codex',
  SETTINGS: 'settings',
  ACHIEVEMENTS: 'achievements',
  VICTORY: 'victory',
  GAME_OVER: 'game_over',
  DEATH_NORMAL: 'death_normal',
  DEATH_SANITY: 'death_sanity',
  WEAPON_REPLACE: 'weapon_replace',
  MEMORY: 'memory'
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

  // Master frame & timing
  F: 0,
  DT: 0.016,
  FREEZE_TIME: 0,
  FADE: 0,
  FADEIN: false,

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
    san: 15,
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
    deathCause: 'enemy',
    dead: false,
    relics: [],
    dmgBoost: 1,
    siphonBoost: false,
    animState: 'idle',
    animTimer: 0,
    walkCycle: 0,
    breathCycle: 0
  },

  // 3-Slot Weapon Inventory
  weaponSlots: [
    { id: 'sword', name: '⚔️ Sword', damage: 2, dmg: 2, range: 1.4, cooldown: 0.32, cd: 0.32, rarity: { name: 'Common', col: '#94a3b8', glow: 'rgba(148,163,184,0.4)' }, prefix: null, suffix: null, sg: 6, projectile: false },
    null,
    null
  ],
  activeWeaponSlot: 0,
  pendingWeaponDrop: null,

  // World and Level collections
  MAP: [],
  ROOMS: [],
  CORRIDORS: [],
  ENE: [],
  ALLIES: [],
  ITEMS: [],
  TRAPS: [],
  TORCHES: [],
  BLOOD: [],
  PROJECTILES: [],
  PRT: [],
  SLASH_TRAILS: [],
  SURVIVORS: [],
  ECHOES: [],
  ACTIVE_SPEECH_BUBBLES: [],

  // Boss state
  BOSS: null,
  ACTIVE_MINIBOSS: null,
  BOSS_DEAD: false,
  BOSS_PORTAL_UNLOCKED: false,
  BOSS_AI_ACTIVE: false,
  BOSS_INTRO_ACTIVE: false,
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

  // Meta Progression (Persisted)
  ABYSS_SOULS: 0,
  PRESTIGE_TOKENS: 0,
  TALENTS: { vitality: 0, clarity: 0, fury: 0, haste: 0, siphon: 0 },
  UNLOCKED_LORE: {},
  UNLOCKED_MEMORIES: {},
  BESTIARY_KILLS: {
    skeleton: 0, ghoul: 0, demon: 0, wraith: 0,
    gorgaroth: 0, malakor: 0, warden: 0
  },
  BOW_KILLS: 0,

  // Change state machine state cleanly
  setState(newState, payload = null) {
    if (this.STATE === newState) return;
    this.PREV_STATE = this.STATE;
    this.STATE = newState;
    EventBus.emit('state:change', { from: this.PREV_STATE, to: newState, payload });
  },

  // Reset player for new run
  resetPlayer() {
    this.P.hp = 10 + (this.TALENTS.vitality || 0) * 2;
    this.P.maxHp = this.P.hp;
    this.P.displayHp = this.P.hp;
    this.P.ghostHp = this.P.hp;
    this.P.ghostHpTimer = 0;
    this.P.san = 15;
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
    this.P.deathCause = 'enemy';
    this.P.dead = false;
    this.P.relics = [];
    this.P.dmgBoost = 1;
    this.P.siphonBoost = false;

    // Reset 3 weapon slots to initial sword
    this.weaponSlots = [
      { id: 'sword', name: '⚔️ Sword', damage: 2, dmg: 2, range: 1.4, cooldown: 0.32, cd: 0.32, rarity: { name: 'Common', col: '#94a3b8', glow: 'rgba(148,163,184,0.4)' }, prefix: null, suffix: null, sg: 6, projectile: false },
      null,
      null
    ];
    this.activeWeaponSlot = 0;
    this.pendingWeaponDrop = null;
    this.P.wep = 'sword';
    this.P.wepRarity = this.weaponSlots[0].rarity;
  },

  // Clear level transient entities
  clearLevelEntities() {
    this.PRT = [];
    this.BLOOD = [];
    this.SLASH_TRAILS = [];
    this.PROJECTILES = [];
    this.BOSS_PROJECTILES = [];
    this.BOSS_HAZARDS = [];
    this.ACTIVE_SPEECH_BUBBLES = [];
    this.BOSS = null;
    this.ACTIVE_MINIBOSS = null;
    this.BOSS_DEAD = false;
    this.BOSS_PORTAL_UNLOCKED = false;
    this.BOSS_AI_ACTIVE = false;
    this.BOSS_INTRO_ACTIVE = false;
    this.levelTransitionActive = false;
    this.PORTAL_USED = false;
    this.PORTAL_DISCOVERED = false;
    this.LEVEL_TIMER = 0;
    this.LEVEL_TIME_STR = '00:00';
    this.LEVEL_TOOK_DAMAGE = false;
  }
};

// Global debug reference
if (typeof window !== 'undefined') {
  window.DB_STATE = GameState;
}
