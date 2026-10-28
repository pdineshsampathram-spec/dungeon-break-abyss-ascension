// =====================================================================
//  DUNGEON BREAK — js/cinematics/LastEmberCinematic.js
//  Phase 3.4 Visual Restoration: Authentic Pixel Art & Production Rendering
//  Lead Direction & Design: Dinesh Polimera
//
//  "DO NOT REDRAW THE GAME. FILM THE GAME."
//  Reuses the authoritative in-engine production rendering pipeline:
//  - WorldRenderer.drawTiles (Real 2.5D stone walls, caps, paver seams, floor weathering)
//  - WorldRenderer.drawTorches (Real wrought-iron brackets & flickering firelight)
//  - WorldRenderer.drawVoidArenaEffects (Real Sanctuary Ward & void fractures)
//  - CharacterRenderer.drawPlayer (Real Rowan with visor slit, cuirass, cloak, active weapon)
//  - CharacterRenderer.drawEnemy (Real Skeletons & Ghouls with hit reactions)
//  - CharacterRenderer.drawBoss (Real Gorgaroth, Malakor, and Abyss Warden)
//  - ProjectileSystem.draw & ParticleRenderer.draw (Real projectiles, trails & impact sparks)
//  - Camera.apply (Authentic smooth in-engine tracking camera)
//  - BossArenaGenerator (Real Floor 3, Floor 6, and Floor 10 arena layouts)
//
//  THE 9 CONNECTED SHOTS:
//  I.    THE LITTLE LIGHT (0–6s): Darkness, falling ember impacts real Stone Keep floor, torch wakes
//  II.   THE ENTRANCE & FORGOTTEN CORRIDORS (6–15s): Real Floor 1 corridor, real Rowan walk, Message 1
//  III.  THE DUNGEON COMES ALIVE (15–25s): Real Floor 2 crypt, real Skeleton & Ghoul, Message 2
//  IV.   THE COMBAT MONTAGE (25–39s): Real attack animations, hit sparks, dodge roll, arsenal showcase, Message 3
//  V.    GORGAROTH, THE IRON JAILER (39–48s): Real Floor 3 arena, authentic Gorgaroth & war pillar slam
//  VI.   MALAKOR AND THE VOID (48–57s): Real Floor 6 Void Sanctum, authentic Malakor, void projectiles, Message 4
//  VII.  THE ABYSS WARDEN (57–67s): Real Floor 10 Throne Hall, authentic Abyss Warden & Dreadblade strike
//  VIII. LEAVING THE DARKNESS (67–75s): Real corridor pulling back toward outer portal, daylight, Message 5
//  IX.   ROWAN AT SUNRISE & GOLDEN FINALE (75–90s): Mountain sunrise overlook, Rowan gazing at dawn,
//        Message 6, Creator Credit "A Game by Dinesh Polimera", golden sunlight wash to Title
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T, ROWS, COLS } from '../core/Constants.js';
import { MusicManager } from '../audio/MusicManager.js';
import { SoundManager, AudioManager } from '../audio/AudioManager.js';
import { MainMenu } from '../ui/MainMenu.js';
import { WorldRenderer } from '../rendering/WorldRenderer.js';
import { CharacterRenderer } from '../rendering/CharacterRenderer.js';
import { LightingRenderer } from '../rendering/LightingRenderer.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { ProjectileSystem } from '../combat/ProjectileSystem.js';
import { Camera } from '../rendering/Camera.js';
import { BossArenaGenerator } from '../world/BossArenaGenerator.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';
import { getTheme, THEMES } from '../data/floors.js';
import { AbyssDissolution } from '../systems/AbyssDissolution.js';
import { CinematicSafety } from './CinematicSafety.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export const LastEmberCinematic = {
  active: false,

  // Authoritative Stage State Machine
  _stage: 'INACTIVE',
  stageTimer: 0,
  totalTimer: 0,
  dawnProgress: 0, // 0.0 to 1.0 (emerges in Shot 8, completes in Shot 9 / Finale)
  exitFade: 0,
  isExiting: false,
  sourceContext: 'menu', // 'menu' | 'invitation'

  // Stage tracking to avoid redundant scene generation
  _activeShotStage: null,

  // Saved gameplay state for clean rollback upon exit
  _savedStateSnapshot: null,

  // Silky Smooth Offscreen Crossfade System
  _crossfadeCanvas: null,
  _crossfadeCtx: null,
  _currentFrameCanvas: null,
  _currentFrameCtx: null,
  crossfadeTimer: 0,
  crossfadeDuration: 0.75,

  // Dynamic Cinematic Camera
  camera: {
    zoom: 1.0,
    panX: 0,
    panY: 0
  },

  // Authoritative Positions
  sunPos: { x: Math.round(LW * 0.62), y: Math.round(LH * 0.50) },
  rowanOverlookPos: { x: Math.round(LW * 0.32), y: Math.round(LH * 0.60) },

  // Shot 1 Falling Ember
  initialEmber: {
    x: Math.round(LW * 0.50),
    y: -20,
    targetY: Math.round(LH * 0.58),
    settled: false,
    alpha: 0,
    sparks: []
  },

  // Atmospheric Particles
  dustMotes: [],
  distantBirds: [],
  foliageSwayTimer: 0,

  // Epic Storytelling Chronicle Chapters
  narrativeChronicles: {
    SHOT_1_LIGHT: {
      chapter: "THE FIRST SPARK",
      chronicle: "In the depth of the abyss, an ember remembers the light."
    },
    SHOT_2_CORRIDORS: {
      chapter: "THE DESCENT",
      chronicle: "A solitary warrior steps into corridors that time forgot."
    },
    SHOT_3_DUNGEON: {
      chapter: "THE AWAKENING CATACOMBS",
      chronicle: "Ancient stones stir as restless guardians rise to bar your way."
    },
    SHOT_4_COMBAT: {
      chapter: "THE CRUCIBLE OF STEEL",
      chronicle: "Four paths of malice converge; one unbroken blade cuts the dark."
    },
    SHOT_5_GORGAROTH: {
      chapter: "GORGAROTH, THE IRON JAILER",
      chronicle: "Chains forged to bind titans cannot shackle an indomitable soul."
    },
    SHOT_6_MALAKOR: {
      chapter: "MALAKOR AND THE VOID",
      chronicle: "When the void bends reality itself, resolute courage is the only anchor."
    },
    SHOT_7_WARDEN: {
      chapter: "THE ABYSS WARDEN",
      chronicle: "At the sovereign throne of shadow, the master of the deep awaits."
    },
    SHOT_8_EXIT: {
      chapter: "THE ASCENT",
      chronicle: "Through broken gates and ancient arches, the light calls you home."
    },
    SHOT_9_SUNRISE: {
      chapter: "THE NEW DAWN",
      chronicle: "Lord Rowan stands atop the mountain — the dungeon broken, the morning won."
    }
  },

  // The 6 Authoritative Gratitude Messages
  gratitudeMessages: [
    {
      shot: 'SHOT_2_CORRIDORS',
      text: "Well, you made it to the end.",
      start: 1.6,
      fade: 1.4,
      hold: 3.6
    },
    {
      shot: 'SHOT_3_DUNGEON',
      text: "I hope you had a good time exploring this little world.",
      start: 1.8,
      fade: 1.4,
      hold: 4.0
    },
    {
      shot: 'SHOT_4_COMBAT',
      text: "Thanks for exploring, trying things, and seeing where it all led.",
      start: 10.4,
      fade: 1.4,
      hold: 2.6
    },
    {
      shot: 'SHOT_6_MALAKOR',
      text: "I had a lot of fun bringing Dungeon Break to life. I'm glad you got to experience it.",
      start: 1.6,
      fade: 1.4,
      hold: 4.4
    },
    {
      shot: 'SHOT_8_EXIT',
      text: "I hope there's a little moment from this journey that stays with you.",
      start: 1.5,
      fade: 1.4,
      hold: 3.8
    },
    {
      shot: 'SHOT_9_SUNRISE',
      text: "That's all from me. Thanks for playing, genuinely.",
      start: 1.2,
      fade: 1.4,
      hold: 3.2
    }
  ],

  // Authoritative Final Attribution
  finalCredit: {
    title: "Thanks for playing Dungeon Break.",
    author: "A Game by Dinesh Polimera"
  },

  get creatorCredit() {
    return this.finalCredit;
  },

  // Buffer management for smooth broadcast crossfades
  initCrossfadeBuffers() {
    if (typeof document === 'undefined') return;
    if (!this._crossfadeCanvas) {
      this._crossfadeCanvas = document.createElement('canvas');
      this._crossfadeCanvas.width = LW;
      this._crossfadeCanvas.height = LH;
      this._crossfadeCtx = this._crossfadeCanvas.getContext('2d');
    }
    if (!this._currentFrameCanvas) {
      this._currentFrameCanvas = document.createElement('canvas');
      this._currentFrameCanvas.width = LW;
      this._currentFrameCanvas.height = LH;
      this._currentFrameCtx = this._currentFrameCanvas.getContext('2d');
    }
  },

  snapshotCurrentFrame(sourceCanvas) {
    if (!sourceCanvas) return;
    this.initCrossfadeBuffers();
    if (!this._currentFrameCtx) return;
    try {
      this._currentFrameCtx.clearRect(0, 0, LW, LH);
      this._currentFrameCtx.drawImage(sourceCanvas, 0, 0, LW, LH);
    } catch (e) {}
  },

  transitionToStage(nextStage, duration = 0.75) {
    if (this._stage === nextStage) return;
    this.initCrossfadeBuffers();

    // Snapshot retiring frame to offscreen crossfade buffer
    if (this._crossfadeCtx && this._currentFrameCanvas) {
      this._crossfadeCtx.clearRect(0, 0, LW, LH);
      this._crossfadeCtx.drawImage(this._currentFrameCanvas, 0, 0, LW, LH);
      this.crossfadeTimer = duration;
      this.crossfadeDuration = duration;
    } else {
      this.crossfadeTimer = 0;
    }

    this._stage = nextStage;
    this.stageTimer = 0;
    this.setupShot(nextStage);
  },

  // Stage getter/setter with backward-compatible aliases
  get stage() {
    return this._stage;
  },
  set stage(val) {
    if (val === 'EMBER' || val === 'OPENING_DARKNESS') this._stage = 'SHOT_1_LIGHT';
    else if (val === 'REVEAL' || val === 'WORLD_AWAKENS') this._stage = 'SHOT_2_CORRIDORS';
    else if (val === 'MESSAGES') this._stage = 'SHOT_4_COMBAT';
    else if (val === 'SUNRISE') this._stage = 'SHOT_9_SUNRISE';
    else if (val === 'FINALE') this._stage = 'GOLDEN_FLASH';
    else this._stage = val;
    this.crossfadeTimer = 0; // immediate when forced by external setter or test
    this.setupShot(this._stage);
  },

  isActive() {
    return this.active;
  },

  // ─────────────────────────────────────────────────────────────
  // Start Cinematic
  // ─────────────────────────────────────────────────────────────
  start(source = 'menu', opts = {}) {
    const isReplay = (source === 'archive') || !!opts.isReplay;
    CinematicSafety.startCinematic('the_last_ember', { isReplay, source });

    if (!isReplay && SaveSystem && SaveSystem.recordCinematicUnlock) {
      SaveSystem.recordCinematicUnlock('the_last_ember');
    }

    this.active = true;
    this.sourceContext = source;
    this._stage = 'SHOT_1_LIGHT';
    this.stageTimer = 0;
    this.totalTimer = 0;
    this.dawnProgress = 0;
    this.exitFade = 0;
    this.isExiting = false;
    this.foliageSwayTimer = 0;

    // Snapshot current game state to guarantee safe isolation
    this._saveGameStateSnapshot();

    const isReducedMotion = typeof window !== 'undefined' &&
      ((window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || GameState.REDUCED_MOTION);

    this.camera = {
      zoom: isReducedMotion ? 1.0 : 1.15,
      panX: 0,
      panY: 0
    };

    // Initialize Falling Ember
    this.initialEmber = {
      x: Math.round(LW * 0.50),
      y: -20,
      targetY: Math.round(LH * 0.58),
      settled: false,
      alpha: 1.0,
      sparks: []
    };

    // Switch state safely
    GameState.setState(GameStates.LAST_EMBER);

    // Hide dev debug overlay so it cannot break immersion
    this.setDebugOverlayVisible(false);

    // Initialize atmospheric particles
    this.initAtmosphere();

    // Start music: Authentic Shattered Mind soundtrack
    this.startAudio();

    // Setup initial scene for Shot 1
    this.setupShot('SHOT_1_LIGHT');

    console.log('[LastEmberCinematic] Phase 3.4 Visual Restoration started (Production Renderers & Shattered Mind track).');
  },

  setDebugOverlayVisible(visible) {
    if (typeof document !== 'undefined') {
      const panel = document.getElementById('ending-debug-panel');
      if (panel) {
        panel.style.display = visible ? 'flex' : 'none';
      }
    }
  },

  initAtmosphere() {
    this.dustMotes = [];
    for (let i = 0; i < 36; i++) {
      this.dustMotes.push({
        x: Math.random() * LW,
        y: Math.random() * LH,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.25,
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.distantBirds = [
      { x: LW * 0.55, y: LH * 0.28, vx: 0.45, vy: -0.06, scale: 0.7, flap: 0 },
      { x: LW * 0.62, y: LH * 0.25, vx: 0.50, vy: -0.04, scale: 0.85, flap: 1.2 },
      { x: LW * 0.68, y: LH * 0.30, vx: 0.42, vy: -0.05, scale: 0.6, flap: 2.4 }
    ];
  },

  // ─────────────────────────────────────────────────────────────
  // State Snapshot & Safe Isolation
  // ─────────────────────────────────────────────────────────────
  _saveGameStateSnapshot() {
    if (this._savedStateSnapshot) return;
    this._savedStateSnapshot = {
      MAP: GameState.MAP ? GameState.MAP.map(r => [...r]) : null,
      ROOMS: GameState.ROOMS ? JSON.parse(JSON.stringify(GameState.ROOMS)) : [],
      TORCHES: GameState.TORCHES ? JSON.parse(JSON.stringify(GameState.TORCHES)) : [],
      LV: GameState.LV || 1,
      P_x: GameState.P ? GameState.P.x : 15,
      P_y: GameState.P ? GameState.P.y : 11,
      P_pose: GameState.P ? GameState.P.cinematicPose : null,
      P_weapon: GameState.P ? GameState.P.currentWeapon : null,
      P_animState: GameState.P ? GameState.P.animState : 'idle',
      BOSS: GameState.BOSS ? { ...GameState.BOSS } : null,
      ENE: GameState.ENE ? [...GameState.ENE] : [],
      CAM_x: GameState.CAM ? GameState.CAM.x : 15,
      CAM_y: GameState.CAM ? GameState.CAM.y : 11,
      CAM_z: GameState.CAM ? GameState.CAM.z : 1.0
    };
  },

  _restoreGameStateSnapshot() {
    if (!this._savedStateSnapshot) return;
    const snap = this._savedStateSnapshot;
    if (snap.MAP) GameState.MAP = snap.MAP;
    GameState.ROOMS = snap.ROOMS || [];
    GameState.TORCHES = snap.TORCHES || [];
    GameState.LV = snap.LV || 1;
    if (GameState.P) {
      GameState.P.x = snap.P_x;
      GameState.P.y = snap.P_y;
      GameState.P.cinematicPose = snap.P_pose;
      GameState.P.currentWeapon = snap.P_weapon;
      GameState.P.animState = snap.P_animState || 'idle';
      GameState.P.aanim = 0;
      GameState.P.weaponLowered = false;
    }
    GameState.BOSS = snap.BOSS;
    GameState.ENE = snap.ENE || [];
    if (GameState.CAM) {
      GameState.CAM.x = snap.CAM_x;
      GameState.CAM.y = snap.CAM_y;
      GameState.CAM.z = snap.CAM_z;
      GameState.CAM.shk = 0;
      GameState.CAM.shkX = 0;
      GameState.CAM.shkY = 0;
    }
    GameState.PROJECTILES = [];
    GameState.PRT = [];
    GameState.SLASH_TRAILS = [];
    this._savedStateSnapshot = null;
  },

  // ─────────────────────────────────────────────────────────────
  // Production Scene Level Builders
  // ─────────────────────────────────────────────────────────────
  _buildHallMap(floor = 1) {
    GameState.MAP = [];
    GameState.TORCHES = [];
    GameState.ROOMS = [];
    for (let r = 0; r < ROWS; r++) {
      GameState.MAP.push(new Array(COLS).fill(1));
    }
    // Carve 28x14 chamber centered at (24, 16)
    const ax = 10, ay = 9, aw = 28, ah = 14;
    for (let r = ay; r < ay + ah; r++) {
      for (let c = ax; c < ax + aw; c++) {
        GameState.MAP[r][c] = 0;
      }
    }
    GameState.ROOMS = [{ x: ax, y: ay, w: aw, h: ah, cx: ax + aw / 2, cy: ay + ah / 2, type: 'stone_hall' }];
    // Torches mounted on north wall
    GameState.TORCHES = [
      { x: ax + 4, y: ay, ph: 0 },
      { x: ax + 14, y: ay, ph: 1.2 },
      { x: ax + aw - 5, y: ay, ph: 2.1 }
    ];
  },

  _buildCorridorMap(floor = 1) {
    GameState.MAP = [];
    GameState.TORCHES = [];
    GameState.ROOMS = [];
    for (let r = 0; r < ROWS; r++) {
      GameState.MAP.push(new Array(COLS).fill(1));
    }
    // Carve long horizontal corridor spanning full width of map, centered vertically at row 14..17
    const ay = 14, ah = 4;
    for (let r = ay; r < ay + ah; r++) {
      for (let c = 0; c < COLS; c++) {
        GameState.MAP[r][c] = 0;
      }
    }
    GameState.ROOMS = [{ x: 0, y: ay, w: COLS, h: ah, cx: COLS / 2, cy: ay + ah / 2, type: 'stone_corridor' }];
    // Authentic wall torches every 5 tiles along north wall face
    for (let c = 2; c < COLS; c += 5) {
      GameState.TORCHES.push({ x: c, y: ay, ph: Math.random() * 6.28 });
    }
  },

  _buildCryptMap() {
    GameState.MAP = [];
    GameState.TORCHES = [];
    GameState.ROOMS = [];
    for (let r = 0; r < ROWS; r++) {
      GameState.MAP.push(new Array(COLS).fill(1));
    }
    // Carve 28x16 crypt vault centered around (24, 16)
    const ax = 10, ay = 8, aw = 28, ah = 16;
    for (let r = ay; r < ay + ah; r++) {
      for (let c = ax; c < ax + aw; c++) {
        GameState.MAP[r][c] = 0;
      }
    }
    // Crypt stone pillars
    const pillars = [
      [ax + 6, ay + 4], [ax + aw - 7, ay + 4],
      [ax + 6, ay + ah - 5], [ax + aw - 7, ay + ah - 5]
    ];
    pillars.forEach(([c, r]) => {
      if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
        GameState.MAP[r][c] = 1;
        GameState.TORCHES.push({ x: c, y: r, ph: Math.random() * 6.28 });
      }
    });
    GameState.ROOMS = [{ x: ax, y: ay, w: aw, h: ah, cx: ax + aw / 2, cy: ay + ah / 2, type: 'crypt_vault' }];
  },

  _buildArenaChamberMap(floor = 4) {
    GameState.MAP = [];
    GameState.TORCHES = [];
    GameState.ROOMS = [];
    for (let r = 0; r < ROWS; r++) {
      GameState.MAP.push(new Array(COLS).fill(1));
    }
    const ax = 6, ay = 4, aw = 36, ah = 18;
    for (let r = ay; r < ay + ah; r++) {
      for (let c = ax; c < ax + aw; c++) {
        GameState.MAP[r][c] = 0;
      }
    }
    GameState.TORCHES = [
      { x: ax + 6, y: ay, ph: 0 },
      { x: ax + 18, y: ay, ph: 1.5 },
      { x: ax + aw - 7, y: ay, ph: 3.1 }
    ];
    GameState.ROOMS = [{ x: ax, y: ay, w: aw, h: ah, cx: ax + aw / 2, cy: ay + ah / 2, type: 'arena_chamber' }];
  },

  // ─────────────────────────────────────────────────────────────
  // Scene Orchestration Per Shot
  // ─────────────────────────────────────────────────────────────
  setupShot(stage) {
    this._activeShotStage = stage;

    // Reset combat transients and particle systems
    GameState.PROJECTILES = [];
    GameState.PRT = [];
    GameState.SLASH_TRAILS = [];
    GameState.ENE = [];
    GameState.BOSS = null;
    AbyssDissolution.reset();

    if (!GameState.P) {
      GameState.P = {
        x: 15, y: 11, vx: 0, vy: 0, fx: 1, fy: 0,
        hp: 100, maxHp: 100, san: 100, maxSan: 100,
        animState: 'idle', walkCycle: 0, breathCycle: 0, aanim: 0,
        currentWeapon: WeaponFactory.create('sword', 'Rare')
      };
    }
    if (!GameState.CAM) {
      GameState.CAM = { x: 15, y: 11, tx: 15, ty: 11, z: 1.0, tz: 1.0, rot: 0, shk: 0, shkX: 0, shkY: 0 };
    }

    switch (stage) {
      case 'SHOT_1_LIGHT': {
        GameState.LV = 1; // Floor 1 Stone Keep Theme
        this._buildHallMap(1);
        GameState.P.cinematicPose = 'hidden';
        GameState.CAM.x = 24;
        GameState.CAM.y = 16;
        GameState.CAM.z = 1.15;
        break;
      }

      case 'SHOT_2_CORRIDORS': {
        GameState.LV = 1;
        this._buildCorridorMap(1);
        GameState.P.cinematicPose = null;
        GameState.P.x = 16;
        GameState.P.y = 15.5;
        GameState.P.fx = 1;
        GameState.P.fy = 0;
        GameState.P.animState = 'walk';
        GameState.P.walkCycle = 0;
        GameState.P.weaponLowered = false;
        GameState.P.currentWeapon = WeaponFactory.create('sword', 'Rare');
        GameState.CAM.x = 17.5;
        GameState.CAM.y = 15.5;
        GameState.CAM.z = 1.15;
        break;
      }

      case 'SHOT_3_DUNGEON': {
        GameState.LV = 2; // Floor 2 Crypt Theme
        this._buildCryptMap();
        GameState.P.cinematicPose = null;
        GameState.P.x = 16;
        GameState.P.y = 16;
        GameState.P.fx = 1;
        GameState.P.fy = 0;
        GameState.P.animState = 'walk';
        GameState.P.currentWeapon = WeaponFactory.create('sword', 'Rare');

        // Genuine production Armored Skeleton and Crypt Ghoul
        GameState.ENE = [
          {
            id: 'cine_skel_1',
            type: 'skeleton',
            name: 'Skeleton Warrior',
            x: 25.5,
            y: 14.5,
            alive: true,
            ph: 0,
            fx: -1,
            hp: 20, maxHp: 20
          },
          {
            id: 'cine_ghoul_1',
            type: 'ghoul',
            name: 'Crypt Ghoul',
            x: 28.8,
            y: 17.5,
            alive: true,
            ph: 1.2,
            fx: -1,
            hp: 25, maxHp: 25
          }
        ];

        GameState.CAM.x = 22;
        GameState.CAM.y = 16;
        GameState.CAM.z = 1.15;
        break;
      }

      case 'SHOT_4_COMBAT': {
        GameState.LV = 4; // Floor 4 Sunken Reliquary Theme
        this._buildArenaChamberMap(4);
        GameState.P.cinematicPose = null;
        GameState.P.x = 21.2;
        GameState.P.y = 13.0;
        GameState.P.fx = 1;
        GameState.P.fy = 0;
        GameState.P.animState = 'idle';
        GameState.P.weaponLowered = false;
        GameState.P.rolling = false;
        GameState.P.currentWeapon = WeaponFactory.create('sword', 'Rare');

        // Genuine 4-enemy swarm surrounding Rowan from multiple angles
        GameState.ENE = [
          {
            id: 'combat_skel_1',
            type: 'skeleton',
            name: 'Skeleton Warrior',
            x: 23.6,
            y: 12.2,
            targetX: 23.6,
            targetY: 12.2,
            alive: true,
            ph: 0,
            fx: -1,
            hitFlash: 0,
            hp: 20, maxHp: 20
          },
          {
            id: 'combat_ghoul_1',
            type: 'ghoul',
            name: 'Crypt Ghoul',
            x: 23.8,
            y: 14.5,
            targetX: 23.8,
            targetY: 14.5,
            alive: true,
            ph: 1.2,
            fx: -1,
            hitFlash: 0,
            hp: 25, maxHp: 25
          },
          {
            id: 'combat_demon_1',
            type: 'demon',
            name: 'Infernal Demon',
            x: 25.4,
            y: 13.0,
            targetX: 25.4,
            targetY: 13.0,
            alive: true,
            ph: 2.1,
            fx: -1,
            hitFlash: 0,
            hp: 30, maxHp: 30
          },
          {
            id: 'combat_wraith_1',
            type: 'wraith',
            name: 'Shadow Wraith',
            x: 18.2,
            y: 12.8,
            targetX: 18.2,
            targetY: 12.8,
            alive: true,
            ph: 3.4,
            fx: 1,
            hitFlash: 0,
            hp: 25, maxHp: 25
          }
        ];

        GameState.CAM.x = 22.0;
        GameState.CAM.y = 13.0;
        GameState.CAM.z = 1.15;
        break;
      }

      case 'SHOT_5_GORGAROTH': {
        GameState.LV = 3; // Floor 3 Iron Fissure Theme
        BossArenaGenerator.buildGorgarothIronJail();
        const room = GameState.ROOMS[0];
        const cx = room ? room.cx : 24;
        const cy = room ? room.cy : 16;

        // Authoritative Boss Arena Placement:
        // Gorgaroth towers upon the elevated central dais at (cx, 14)
        GameState.BOSS = {
          id: 'gorgaroth',
          name: 'Gorgaroth, The Iron Jailer',
          x: cx,
          y: cy - 2.0, // (24, 14)
          alive: true,
          phase: 1,
          facing: 1, // Facing south towards Rowan
          ph: 0,
          hitFlash: 0,
          slamWarning: null
        };

        // Rowan stands at the authoritative south entrance gate threshold (24, 23.5)
        GameState.P.cinematicPose = null;
        GameState.P.x = cx;
        GameState.P.y = cy + 7.5; // (24, 23.5)
        GameState.P.fx = 0;
        GameState.P.fy = -1; // Facing north toward Gorgaroth on his dais
        GameState.P.animState = 'idle';
        GameState.P.currentWeapon = WeaponFactory.create('sword', 'Rare');

        // Cinematic camera frames the full vertical depth of the Iron Jail
        GameState.CAM.x = cx;
        GameState.CAM.y = cy + 2.2;
        GameState.CAM.z = 1.05;
        break;
      }

      case 'SHOT_6_MALAKOR': {
        GameState.LV = 6; // Floor 6 Void Sanctum Theme
        BossArenaGenerator.buildMalakorVoidSanctum();
        const room = GameState.ROOMS[0];
        const cx = room ? room.cx : 24;
        const cy = room ? room.cy : 16;

        // Malakor hovers at the center of the Void Sanctum vortex (24, 13.5)
        GameState.BOSS = {
          id: 'malakor',
          name: 'Malakor, The Void Weaver',
          x: cx,
          y: cy - 2.5, // (24, 13.5)
          alive: true,
          phase: 2,
          facing: 1, // Facing south towards Rowan
          ph: 0,
          hitFlash: 0,
          teleportState: null
        };

        // Rowan positioned within the protective Sanctuary Ward (24, 21.0)
        GameState.P.cinematicPose = null;
        GameState.P.x = cx;
        GameState.P.y = cy + 5.0; // (24, 21.0)
        GameState.P.fx = 0;
        GameState.P.fy = -1; // Facing north toward Malakor
        GameState.P.animState = 'idle';
        GameState.P.currentWeapon = WeaponFactory.create('sword', 'Rare');

        // Camera tracks the cosmic void rift and surrounding arcane obelisks
        GameState.CAM.x = cx;
        GameState.CAM.y = cy + 1.2;
        GameState.CAM.z = 1.05;
        break;
      }

      case 'SHOT_7_WARDEN': {
        GameState.LV = 10; // Floor 10 Throne of the Abyss Warden Theme
        BossArenaGenerator.buildAbyssWardenThroneRoom();
        const room = GameState.ROOMS[0];
        const cx = room ? room.cx : 24;
        const cy = room ? room.cy : 16;
        const throneY = (room && room.throneY !== undefined) ? room.throneY : 10;

        // The Abyss Warden stands directly upon the stone throne dais (24, 10)
        GameState.BOSS = {
          id: 'abyss_warden',
          name: 'The Abyss Warden',
          x: cx,
          y: throneY, // (24, 10)
          alive: true,
          phase: 2,
          facing: 1, // Facing south down the ceremonial runner
          ph: 0,
          hitFlash: 0,
          introRevealStage: 'emerging'
        };

        // Rowan stands upon the Royal Crimson Carpet Runner (24, 20)
        GameState.P.cinematicPose = null;
        GameState.P.x = cx;
        GameState.P.y = cy + 4.0; // (24, 20.0)
        GameState.P.fx = 0;
        GameState.P.fy = -1; // Facing north toward the Throne
        GameState.P.animState = 'idle';
        GameState.P.currentWeapon = WeaponFactory.create('sword', 'Rare');

        // Camera frames the grand standoff down the red carpet runner
        GameState.CAM.x = cx;
        GameState.CAM.y = cy - 1.0;
        GameState.CAM.z = 1.02;
        break;
      }

      case 'SHOT_8_EXIT': {
        GameState.LV = 1;
        this._buildCorridorMap(1);
        GameState.P.cinematicPose = null;
        GameState.P.x = 16;
        GameState.P.y = 15.5;
        GameState.P.fx = 1;
        GameState.P.fy = 0;
        GameState.P.animState = 'walk';
        GameState.P.currentWeapon = WeaponFactory.create('sword', 'Rare');
        GameState.CAM.x = 18;
        GameState.CAM.y = 15.5;
        GameState.CAM.z = 1.15;
        break;
      }

      case 'SHOT_9_SUNRISE':
      case 'STAGE_PASSWORD_REVEAL':
      case 'GOLDEN_FLASH': {
        GameState.P.cinematicPose = 'hidden';
        break;
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // Audio: Authentic Shattered Mind Soundtrack
  // ─────────────────────────────────────────────────────────────
  startAudio() {
    try {
      MusicManager.play('shatteredMind', { loop: true, fade: 2.0, volume: 0.65 });
    } catch (e) {
      console.warn('[LastEmberCinematic] Could not play shatteredMind music:', e);
    }
  },

  stopAudio() {
    try {
      MusicManager.fadeOut(0.8);
    } catch (e) {}
  },

  // ─────────────────────────────────────────────────────────────
  // Tick & Stage Progression (~88.5s total target)
  // ─────────────────────────────────────────────────────────────
  tick(dt = 0.016) {
    if (!this.active) return;

    this.totalTimer += dt;
    this.stageTimer += dt;
    this.foliageSwayTimer += dt;

    // Ensure dev debug overlay stays hidden
    this.setDebugOverlayVisible(false);

    // If stage was set externally (e.g. by test), ensure setup runs
    if (this._activeShotStage !== this._stage) {
      this.setupShot(this._stage);
    }

    const isReducedMotion = typeof window !== 'undefined' &&
      ((window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || GameState.REDUCED_MOTION);

    // Update crossfade timer for smooth dissolves
    if (this.crossfadeTimer > 0) {
      this.crossfadeTimer = Math.max(0, this.crossfadeTimer - dt);
    }

    // Update in-engine particle and dissolution systems
    ParticleRenderer.tick(dt);
    AbyssDissolution.tick(dt);
    if (GameState.PROJECTILES && GameState.PROJECTILES.length > 0) {
      for (let i = GameState.PROJECTILES.length - 1; i >= 0; i--) {
        const pr = GameState.PROJECTILES[i];
        pr.x += (pr.vx || 0) * dt;
        pr.y += (pr.vy || 0) * dt;
        pr.life = (pr.life || 0) + dt;
        if (pr.life > 3.0 || pr.x < 17.0 || pr.hit) {
          GameState.PROJECTILES.splice(i, 1);
        }
      }
    }

    // Update atmospheric motes
    this.dustMotes.forEach(m => {
      m.x += m.vx;
      m.y += m.vy;
      if (m.y < -10) { m.y = LH + 10; m.x = Math.random() * LW; }
      if (m.x < -10) m.x = LW + 10;
      if (m.x > LW + 10) m.x = -10;
    });

    // Update distant birds
    this.distantBirds.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.flap += dt * 4.5;
    });

    // ───────────────────────────────────────────────────────────
    // Stage Machine State Progression with Silky Crossfades
    // ───────────────────────────────────────────────────────────
    switch (this._stage) {
      // SHOT 1: THE LITTLE LIGHT (0–6s)
      case 'SHOT_1_LIGHT': {
        const t = this.stageTimer;
        const ember = this.initialEmber;

        if (!ember.settled) {
          const fallProgress = Math.min(1.0, t / 2.8);
          ember.y = -20 + (ember.targetY - (-20)) * Math.pow(fallProgress, 1.4);
          ember.x = LW * 0.50 + Math.sin(t * 3.0) * 12;

          if (fallProgress >= 1.0) {
            ember.settled = true;
            ember.y = ember.targetY;
            // Spawn impact sparks
            for (let i = 0; i < 8; i++) {
              const ang = (Math.PI / 8) * i + Math.PI;
              const spd = 0.8 + Math.random() * 1.5;
              ember.sparks.push({
                x: ember.x,
                y: ember.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd * 0.6,
                life: 1.2,
                maxLife: 1.2
              });
            }
            try { SoundManager.snd('flame_ignite'); } catch (e) {}
          }
        } else {
          ember.sparks.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.95;
            s.vy += 0.05;
            s.life -= dt;
          });
          ember.sparks = ember.sparks.filter(s => s.life > 0);
        }

        if (this.stageTimer >= 6.0) {
          this.transitionToStage('SHOT_2_CORRIDORS', 0.8);
        }
        break;
      }

      // SHOT 2: THE ENTRANCE AND FORGOTTEN CORRIDORS (6–15s: duration 9.0s)
      case 'SHOT_2_CORRIDORS': {
        const t = this.stageTimer;
        if (GameState.P) {
          GameState.P.x = 16 + (t / 9.0) * 12;
          GameState.P.walkCycle = t * 6.5;
          GameState.P.animState = 'walk';
          GameState.CAM.x = GameState.P.x + 1.2;
          GameState.CAM.y = 15.5;
        }

        if (this.stageTimer >= 9.0) {
          this.transitionToStage('SHOT_3_DUNGEON', 0.8);
        }
        break;
      }

      // SHOT 3: THE DUNGEON COMES ALIVE (15–25s: duration 10.0s)
      case 'SHOT_3_DUNGEON': {
        const t = this.stageTimer;
        if (GameState.P) {
          GameState.P.x = 16 + (t / 10.0) * 4;
          GameState.P.walkCycle = t * 5.0;
        }
        if (GameState.ENE) {
          GameState.ENE.forEach(e => { e.ph = t * 2.0; });
        }
        GameState.CAM.x = 22 + Math.sin(t * 0.3) * 1.5;
        GameState.CAM.y = 16;

        if (this.stageTimer >= 10.0) {
          this.transitionToStage('SHOT_4_COMBAT', 0.8);
        }
        break;
      }

      // SHOT 4: THE COMBAT MONTAGE (25–39s: duration 14.0s)
      // Authentic high-skill playthrough: 4-enemy swarm, slashes, dissolution & dodge roll
      case 'SHOT_4_COMBAT': {
        const t = this.stageTimer;
        const P = GameState.P;
        const enemies = GameState.ENE || [];
        const skel = enemies.find(e => e.id === 'combat_skel_1');
        const ghoul = enemies.find(e => e.id === 'combat_ghoul_1');
        const demon = enemies.find(e => e.id === 'combat_demon_1');
        const wraith = enemies.find(e => e.id === 'combat_wraith_1');

        // BEAT 1: The Swarm Closes In & Greatsword Cleave (0.0 to 4.2s)
        if (t < 4.2) {
          P.currentWeapon = WeaponFactory.create('sword', 'Rare');
          P.weaponLowered = false;
          P.animState = 'idle';

          // Swarm encircles Rowan
          if (skel && skel.alive) {
            skel.x = 23.6 - Math.min(0.6, t * 0.2);
            skel.y = 12.2 + Math.min(0.3, t * 0.1);
          }
          if (ghoul && ghoul.alive) {
            ghoul.x = 23.8 - Math.min(0.8, t * 0.25);
            ghoul.y = 14.5 - Math.min(0.5, t * 0.15);
          }
          if (demon && demon.alive) {
            demon.ph = t * 3.0;
          }
          if (wraith && wraith.alive) {
            wraith.x = 18.2 + Math.min(1.2, t * 0.4);
            wraith.ph = t * 2.5;
          }

          // Rowan executes sweeping Greatsword cleave at 2.0s
          if (t >= 2.0 && t <= 3.2) {
            P.aanim = Math.max(0, 0.40 - (t - 2.0) * 0.55);

            // Impact frame connecting with Skeleton and Ghoul
            if (t >= 2.2 && t <= 2.3) {
              if (skel && skel.alive) {
                skel.hitFlash = 0.35;
                ParticleRenderer.spawnP(skel.x * T, skel.y * T, 6, { col: '#fde68a' });
              }
              if (ghoul && ghoul.alive) {
                ghoul.hitFlash = 0.35;
                ParticleRenderer.spawnP(ghoul.x * T, ghoul.y * T, 6, { col: '#4ade80' });
              }
              ParticleRenderer.spawnSlashTrail(P.x * T, P.y * T, 0.1, 'sword');
              Camera.shake(6);
              try {
                SoundManager.snd('slash');
                SoundManager.snd('enemy_hit');
              } catch (e) {}
            }

            // Both Skeleton and Ghoul dissolve via authentic AbyssDissolution system
            if (t >= 2.4) {
              if (skel && skel.alive) {
                skel.alive = false;
                AbyssDissolution.startDissolution(skel, { type: 'skeleton', isCinematic: true });
              }
              if (ghoul && ghoul.alive) {
                ghoul.alive = false;
                AbyssDissolution.startDissolution(ghoul, { type: 'ghoul', isCinematic: true });
              }
            }
          }
        }

        // BEAT 2: Demon Projectile & Rowan's Tactical Dodge Roll (4.2 to 7.0s)
        else if (t < 7.0) {
          const bt = t - 4.2;
          const rollProgress = Math.min(1.0, bt / 2.2);

          // Demon charges and launches demonic projectile at 4.3s
          if (demon && demon.alive && bt < 0.6) {
            demon.hitFlash = 0.15;
            if (bt >= 0.25 && bt <= 0.30 && (!GameState.PROJECTILES || GameState.PROJECTILES.length === 0)) {
              GameState.PROJECTILES = GameState.PROJECTILES || [];
              GameState.PROJECTILES.push({
                id: 9991,
                x: demon.x - 0.4,
                y: demon.y,
                vx: -6.0,
                vy: 0,
                life: 0,
                fromPlayer: false,
                isBoss: false,
                col: '#ef4444'
              });
              try { SoundManager.snd('flame_ignite'); } catch (e) {}
            }
          }

          // Rowan executes high-skill combat roll diagonally through the attack
          P.x = 21.2 + Math.pow(rollProgress, 0.85) * 2.2;
          P.y = 13.0 + Math.sin(rollProgress * Math.PI) * 0.9;
          P.animState = 'roll';
          P.rolling = (rollProgress < 0.7);

          if (bt >= 0.25 && bt <= 0.35) {
            try { SoundManager.snd('dodge_roll'); } catch (e) {}
          }

          // Projectile impacts arena wall behind Rowan
          if (bt >= 1.2 && bt <= 1.35) {
            Camera.shake(4);
            ParticleRenderer.spawnP(17.5 * T, 13.0 * T, 8, { col: '#f97316' });
          }
        }

        // BEAT 3: Arsenal Switch to Legendary Axe & Devastating Counter-Cleave (7.0 to 10.2s)
        else if (t < 10.2) {
          const ct = t - 7.0;
          P.rolling = false;
          P.animState = 'idle';
          P.currentWeapon = WeaponFactory.create('axe', 'Legendary');

          // Heavy Axe lunging cleave
          if (ct >= 0.2 && ct <= 1.5) {
            P.aanim = Math.max(0, 0.46 - (ct - 0.2) * 0.45);

            // Strike connecting with Demon and Wraith at ct = 0.5s (t = 7.5s)
            if (ct >= 0.5 && ct <= 0.6) {
              if (demon && demon.alive) {
                demon.hitFlash = 0.40;
                ParticleRenderer.spawnP(demon.x * T, demon.y * T, 10, { col: '#f97316' });
              }
              if (wraith && wraith.alive) {
                wraith.hitFlash = 0.40;
                ParticleRenderer.spawnP(wraith.x * T, wraith.y * T, 10, { col: '#c084fc' });
              }
              ParticleRenderer.spawnSlashTrail(P.x * T, P.y * T, -0.2, 'axe');
              Camera.shake(8);
              try {
                SoundManager.snd('slash');
                SoundManager.snd('enemy_hit');
              } catch (e) {}
            }

            // Both Demon and Wraith dissolve in plumes of fiery/void energy
            if (ct >= 0.7) {
              if (demon && demon.alive) {
                demon.alive = false;
                AbyssDissolution.startDissolution(demon, { type: 'demon', isCinematic: true });
              }
              if (wraith && wraith.alive) {
                wraith.alive = false;
                AbyssDissolution.startDissolution(wraith, { type: 'wraith', isCinematic: true });
              }
            }
          }
        }

        // BEAT 4: Victory Poise Amidst Swirling Dissolution Embers (10.2 to 14.0s)
        else {
          P.currentWeapon = WeaponFactory.create('sword', 'Rare');
          P.weaponLowered = true;
          P.animState = 'idle';
          P.aanim = 0;
          P.rolling = false;
          // Active breathing & living subtle torso sway
          P.walkCycle = t * 1.5;
        }

        if (this.stageTimer >= 15.5) {
          this.transitionToStage('SHOT_5_GORGAROTH', 0.8);
        }
        break;
      }

      // SHOT 5: GORGAROTH, THE IRON JAILER (39–48s: duration 9.5s)
      // Authentic Floor 3 Iron Jail arena with War Pillar slam & shockwaves
      case 'SHOT_5_GORGAROTH': {
        const t = this.stageTimer;
        const boss = GameState.BOSS;
        const P = GameState.P;

        if (boss) {
          boss.ph = t;
          // War Pillar slam buildup & ground impact
          if (t >= 2.8 && t <= 4.2) {
            boss.slamWarning = { x: boss.x, y: boss.y + 1.2, timer: Math.max(0, 0.6 - (t - 2.8)), fired: t > 3.4 };
            if (t >= 3.2 && t <= 3.4) {
              Camera.shake(14);
              ParticleRenderer.spawnP(boss.x * T, (boss.y + 1.2) * T, 16, { col: '#ea580c' });
              try { SoundManager.snd('flame_ignite'); } catch (e) {}
            }
          } else {
            boss.slamWarning = null;
          }
        }

        // Rowan steps forward into resolute battle guard
        if (P) {
          if (t >= 4.0) {
            P.y = 23.5 - Math.min(0.8, (t - 4.0) * 0.4);
            P.weaponLowered = false;
          }
        }

        if (this.stageTimer >= 9.5) {
          this.transitionToStage('SHOT_6_MALAKOR', 0.8);
        }
        break;
      }

      // SHOT 6: MALAKOR AND THE VOID (48–57s: duration 10.0s)
      // Authentic Floor 6 Void Sanctum with Sanctuary Ward & void incursion
      case 'SHOT_6_MALAKOR': {
        const t = this.stageTimer;
        const boss = GameState.BOSS;
        const P = GameState.P;

        if (boss) {
          boss.ph = t;
          // Void teleport windup and energy discharge
          if (t >= 2.6 && t <= 4.0) {
            boss.teleportState = 'windup';
            boss.teleportTimer = 4.0 - t;
            boss.teleportAlpha = 0.5 + Math.sin(t * 12.0) * 0.4;
            if (t >= 3.1 && t <= 3.25) {
              Camera.shake(6);
              ParticleRenderer.spawnP(boss.x * T, boss.y * T, 12, { col: '#a855f7' });
            }
          } else {
            boss.teleportState = null;
            boss.teleportAlpha = 1.0;
          }
        }

        // Rowan holds ground with drawn blade in Sanctuary Ward
        if (P) {
          P.weaponLowered = false;
        }

        if (this.stageTimer >= 10.0) {
          this.transitionToStage('SHOT_7_WARDEN', 0.8);
        }
        break;
      }

      // SHOT 7: THE ABYSS WARDEN (57–67s: duration 10.0s)
      // Authentic Floor 10 Throne Room: Rowan on royal carpet runner, Warden on throne dais
      case 'SHOT_7_WARDEN': {
        const t = this.stageTimer;
        const boss = GameState.BOSS;
        const P = GameState.P;

        if (boss) {
          boss.ph = t;
          // Warden spreads wings and sweeps Dreadblade across the dais
          if (t >= 3.4 && t <= 5.2) {
            boss.cleaveAnim = Math.sin((t - 3.4) / 1.8 * Math.PI);
            if (t >= 4.0 && t <= 4.25) {
              Camera.shake(16);
              ParticleRenderer.spawnP(boss.x * T, (boss.y + 1.2) * T, 16, { col: '#ef4444' });
              try {
                SoundManager.snd('slash');
              } catch (e) {}
            }
          } else {
            boss.cleaveAnim = 0;
          }
        }

        // Rowan holds defensive sword stance on the royal runner
        if (P) {
          P.weaponLowered = false;
        }

        if (this.stageTimer >= 10.0) {
          this.transitionToStage('SHOT_8_EXIT', 0.8);
        }
        break;
      }

      // SHOT 8: LEAVING THE DARKNESS (67–75s: duration 9.0s)
      case 'SHOT_8_EXIT': {
        const t = this.stageTimer;
        this.dawnProgress = Math.min(0.65, (t / 9.0) * 0.65);
        if (GameState.P) {
          GameState.P.x = 16 + (t / 9.0) * 11;
          GameState.P.walkCycle = t * 6.0;
          GameState.P.animState = 'walk';
          GameState.CAM.x = GameState.P.x + 1.8;
          GameState.CAM.y = 15.5;
        }

        if (this.stageTimer >= 9.0) {
          this.transitionToStage('SHOT_9_SUNRISE', 1.0);
        }
        break;
      }

      // SHOT 9: ROWAN AT SUNRISE (75–89s: duration 14.5s)
      case 'SHOT_9_SUNRISE': {
        const t = this.stageTimer;
        this.dawnProgress = Math.min(1.0, 0.65 + (t / 10.0) * 0.35);

        if (this.stageTimer >= 14.5) {
          this.transitionToStage('STAGE_PASSWORD_REVEAL', 1.0);
        }
        break;
      }

      // FINAL SECRET PASSWORD REVEAL BEAT (duration: 6.5s)
      case 'STAGE_PASSWORD_REVEAL': {
        this.dawnProgress = 1.0;
        if (this.stageTimer >= 6.5) {
          this.transitionToStage('GOLDEN_FLASH', 1.2);
        }
        break;
      }

      // THE GOLDEN FINALE (85–88.5s: duration 3.5s)
      case 'GOLDEN_FLASH': {
        this.dawnProgress = 1.0;
        if (this.stageTimer >= 3.5 && !this.isExiting) {
          this.finishWithGoldenWash();
        }
        break;
      }

      case 'EXITING': {
        this.exitFade = Math.min(1.0, this.exitFade + dt * 2.5);
        if (this.exitFade >= 1.0) {
          this.cleanupAndReturn();
        }
        break;
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // Master Draw Orchestrator
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!ctx || !this.active) return;

    if (this._activeShotStage !== this._stage) {
      this.setupShot(this._stage);
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const isReducedMotion = typeof window !== 'undefined' &&
      ((window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || GameState.REDUCED_MOTION);

    // Render Active Scene via authentic production pipelines
    switch (this._stage) {
      case 'SHOT_1_LIGHT':
        this.drawShot1Light(ctx, this.stageTimer, isReducedMotion);
        break;
      case 'SHOT_2_CORRIDORS':
        this.drawShot2Corridors(ctx, this.stageTimer, isReducedMotion);
        break;
      case 'SHOT_3_DUNGEON':
        this.drawShot3Dungeon(ctx, this.stageTimer, isReducedMotion);
        break;
      case 'SHOT_4_COMBAT':
        this.drawShot4Combat(ctx, this.stageTimer, isReducedMotion);
        break;
      case 'SHOT_5_GORGAROTH':
        this.drawShot5Gorgaroth(ctx, this.stageTimer, isReducedMotion);
        break;
      case 'SHOT_6_MALAKOR':
        this.drawShot6Malakor(ctx, this.stageTimer, isReducedMotion);
        break;
      case 'SHOT_7_WARDEN':
        this.drawShot7Warden(ctx, this.stageTimer, isReducedMotion);
        break;
      case 'SHOT_8_EXIT':
        this.drawShot8Exit(ctx, this.stageTimer, isReducedMotion);
        break;
      case 'SHOT_9_SUNRISE':
      case 'STAGE_PASSWORD_REVEAL':
      case 'GOLDEN_FLASH':
        this.drawShot9Sunrise(ctx, this.stageTimer, isReducedMotion);
        break;
    }

    // ───────────────────────────────────────────────────────────
    // Silky Smooth Broadcast Crossfade Overlay across shot cuts
    if (this.crossfadeTimer > 0 && this._crossfadeCanvas) {
      const p = this.crossfadeTimer / this.crossfadeDuration;
      const alpha = p * p * (3 - 2 * p); // smoothstep easing
      if (alpha > 0.005) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.drawImage(this._crossfadeCanvas, 0, 0);
        ctx.restore();
      }
    }

    // Cache rendered visual world frame for subsequent silky smooth crossfade snapshots
    // CRITICAL: Snapshotted HERE BEFORE text overlays so text never burns into crossfade buffer!
    if (ctx && ctx.canvas) {
      this.snapshotCurrentFrame(ctx.canvas);
    }

    // ───────────────────────────────────────────────────────────
    // Overlays: Unified Center Screen Typography & Emotional Storytelling
    // ───────────────────────────────────────────────────────────
    this.drawCenterTypography(ctx);

    if (this._stage === 'GOLDEN_FLASH') {
      this.drawGoldenFlashWash(ctx, this.stageTimer);
    }

    // Skip prompt
    this.drawSkipPrompt(ctx);

    // Fade to black on manual Escape skip
    if (this.isExiting && this._stage === 'EXITING') {
      ctx.fillStyle = `rgba(2, 4, 8, ${this.exitFade})`;
      ctx.fillRect(0, 0, LW, LH);
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT I: THE LITTLE LIGHT (0–6s)
  // Reveals authentic Floor 1 Stone Keep floor tiles & wall torch
  // ─────────────────────────────────────────────────────────────
  drawShot1Light(ctx, t, isReducedMotion) {
    ctx.fillStyle = '#010204';
    ctx.fillRect(0, 0, LW, LH);

    const ember = this.initialEmber;
    const ex = ember.x;
    const ey = ember.y;
    const pulse = isReducedMotion ? 1.0 : (1.0 + Math.sin(t * 4.0) * 0.12);

    // When ember impacts, reveal genuine dungeon floor tiles beneath light pool
    if (t >= 2.8) {
      const poolTime = t - 2.8;
      const poolRadius = Math.min(150, poolTime * 50) * pulse;

      ctx.save();
      // Clip to circular expanding light pool (and torch pool at t >= 4.2)
      ctx.beginPath();
      ctx.ellipse(ex, ember.targetY + 4, poolRadius, poolRadius * 0.52, 0, 0, Math.PI * 2);

      const torchScreenX = Math.round(LW * 0.68);
      const torchScreenY = Math.round(LH * 0.38);
      if (t >= 4.2) {
        const torchProg = Math.min(1.0, (t - 4.2) / 1.0);
        ctx.arc(torchScreenX, torchScreenY, 85 * torchProg, 0, Math.PI * 2);
      }
      ctx.clip();

      // Render REAL production tiles and torches!
      ctx.save();
      Camera.apply(ctx);
      WorldRenderer.drawTiles(ctx);
      if (t >= 4.2) {
        WorldRenderer.drawTorches(ctx);
      }
      ctx.restore();

      // Warm radial illumination overlay on top of revealed real tiles
      const groundGrad = ctx.createRadialGradient(ex, ember.targetY + 4, 0, ex, ember.targetY + 4, poolRadius);
      groundGrad.addColorStop(0, 'rgba(251, 191, 36, 0.40)');
      groundGrad.addColorStop(0.4, 'rgba(217, 119, 6, 0.20)');
      groundGrad.addColorStop(1, 'rgba(1, 2, 4, 0.85)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 0, LW, LH);

      if (t >= 4.2) {
        const torchProg = Math.min(1.0, (t - 4.2) / 1.0);
        const torchGrad = ctx.createRadialGradient(torchScreenX, torchScreenY, 0, torchScreenX, torchScreenY, 85 * torchProg);
        torchGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
        torchGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.18)');
        torchGrad.addColorStop(1, 'rgba(1, 2, 4, 0)');
        ctx.fillStyle = torchGrad;
        ctx.fillRect(0, 0, LW, LH);
      }

      ctx.restore();
    }

    // Falling Ember Particle & Scatter Sparks
    ctx.save();
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12 * pulse;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ember.sparks.forEach(s => {
      ctx.fillStyle = '#fed7aa';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 6;
      ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
    });
    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT II: THE ENTRANCE AND FORGOTTEN CORRIDORS (6–15s)
  // Renders real Floor 1 Stone Keep corridor, torches, and Rowan
  // ─────────────────────────────────────────────────────────────
  drawShot2Corridors(ctx, t, isReducedMotion) {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, LW, LH);

    ctx.save();
    Camera.apply(ctx);
    WorldRenderer.drawTiles(ctx);
    WorldRenderer.drawTorches(ctx);
    CharacterRenderer.drawPlayer(ctx);
    ctx.restore();

    LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, GameState.CAM.z);
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT III: THE DUNGEON COMES ALIVE (15–25s)
  // Renders real Floor 2 crypt, real Skeleton & Ghoul, and Rowan
  // ─────────────────────────────────────────────────────────────
  drawShot3Dungeon(ctx, t, isReducedMotion) {
    ctx.fillStyle = '#050308';
    ctx.fillRect(0, 0, LW, LH);

    ctx.save();
    Camera.apply(ctx);
    WorldRenderer.drawTiles(ctx);
    WorldRenderer.drawTorches(ctx);
    if (GameState.ENE) {
      GameState.ENE.forEach(e => CharacterRenderer.drawEnemy(ctx, e));
    }
    CharacterRenderer.drawPlayer(ctx);
    ctx.restore();

    LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, GameState.CAM.z);
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT IV: THE COMBAT MONTAGE (25–39s)
  // Renders authentic high-skill playthrough: 4-enemy swarm,
  // Greatsword cleaves, AbyssDissolution particles & dodge roll
  // ─────────────────────────────────────────────────────────────
  drawShot4Combat(ctx, t, isReducedMotion) {
    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, LW, LH);

    ctx.save();
    Camera.apply(ctx);
    WorldRenderer.drawTiles(ctx);
    WorldRenderer.drawTorches(ctx);

    // Render all authentic enemies (alive or dissolving)
    if (GameState.ENE) {
      GameState.ENE.forEach(e => CharacterRenderer.drawEnemy(ctx, e));
    }

    // Render Lord Rowan executing playthrough combat
    CharacterRenderer.drawPlayer(ctx);

    // Render authentic AbyssDissolution ascending fragments, energy & dust
    AbyssDissolution.drawParticles(ctx);

    // Active projectiles & weapon trail sparks
    ProjectileSystem.draw(ctx);
    ParticleRenderer.draw(ctx);
    ctx.restore();

    LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, GameState.CAM.z);
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT V: GORGAROTH, THE IRON JAILER (39–48s)
  // Authentic Floor 3 Iron Jail: Rowan at south gate, Gorgaroth on central dais
  // ─────────────────────────────────────────────────────────────
  drawShot5Gorgaroth(ctx, t, isReducedMotion) {
    ctx.fillStyle = '#120b08';
    ctx.fillRect(0, 0, LW, LH);

    ctx.save();
    Camera.apply(ctx);
    WorldRenderer.drawTiles(ctx);
    WorldRenderer.drawTorches(ctx);

    // Render Boss & authentic War Pillar slam shockwave rings
    if (GameState.BOSS) {
      CharacterRenderer.drawBoss(ctx, GameState.BOSS);

      if (t >= 3.2 && t <= 5.0) {
        const shockP = (t - 3.2) / 1.8;
        const b = GameState.BOSS;
        ctx.save();
        ctx.strokeStyle = `rgba(234, 88, 12, ${Math.max(0, 0.75 * (1 - shockP))})`;
        ctx.lineWidth = 3.5 * (1 - shockP * 0.4);
        ctx.beginPath();
        ctx.ellipse((b.x + 0.5) * T, (b.y + 1.2) * T, shockP * 210, shockP * 95, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    CharacterRenderer.drawPlayer(ctx);
    ParticleRenderer.draw(ctx);
    ctx.restore();

    LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, GameState.CAM.z);
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT VI: MALAKOR AND THE VOID (48–57s)
  // Authentic Floor 6 Void Sanctum: Rowan in Sanctuary Ward, Malakor in void rift
  // ─────────────────────────────────────────────────────────────
  drawShot6Malakor(ctx, t, isReducedMotion) {
    ctx.fillStyle = '#0b0617';
    ctx.fillRect(0, 0, LW, LH);

    ctx.save();
    Camera.apply(ctx);
    WorldRenderer.drawTiles(ctx);
    WorldRenderer.drawVoidArenaEffects(ctx);
    WorldRenderer.drawTorches(ctx);

    if (GameState.BOSS) {
      CharacterRenderer.drawBoss(ctx, GameState.BOSS);

      // Void teleportation ripples
      if (t >= 2.6 && t <= 4.2) {
        const voidP = (t - 2.6) / 1.6;
        const b = GameState.BOSS;
        ctx.save();
        ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0, 0.65 * (1 - voidP))})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse((b.x + 0.5) * T, (b.y + 0.5) * T, voidP * 160, voidP * 75, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    CharacterRenderer.drawPlayer(ctx);
    ProjectileSystem.draw(ctx);
    ParticleRenderer.draw(ctx);
    ctx.restore();

    LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, GameState.CAM.z);
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT VII: THE ABYSS WARDEN (57–67s)
  // Authentic Floor 10 Throne Room: Rowan on royal runner, Warden on throne dais
  // ─────────────────────────────────────────────────────────────
  drawShot7Warden(ctx, t, isReducedMotion) {
    ctx.fillStyle = '#100305';
    ctx.fillRect(0, 0, LW, LH);

    ctx.save();
    Camera.apply(ctx);
    WorldRenderer.drawTiles(ctx);
    WorldRenderer.drawTorches(ctx);

    if (GameState.BOSS) {
      CharacterRenderer.drawBoss(ctx, GameState.BOSS);

      // Crimson Dreadblade ground flame wave down the royal carpet runner
      if (t >= 4.0 && t <= 5.8) {
        const flameP = (t - 4.0) / 1.8;
        const b = GameState.BOSS;
        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0, 0.85 * (1 - flameP))})`;
        ctx.lineWidth = 4.0 * (1 - flameP * 0.4);
        ctx.beginPath();
        ctx.ellipse((b.x + 0.5) * T, (b.y + 1.5) * T, flameP * 180, flameP * 85, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    CharacterRenderer.drawPlayer(ctx);
    ParticleRenderer.draw(ctx);
    ctx.restore();

    LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, GameState.CAM.z);
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT VIII: LEAVING THE DARKNESS (67–75s)
  // Pulling back from real stone corridor into morning sunlight
  // ─────────────────────────────────────────────────────────────
  drawShot8Exit(ctx, t, isReducedMotion) {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, LW, LH);

    // 1. Authentic Floor 1 Stone Keep Corridor & Torches & Rowan
    ctx.save();
    Camera.apply(ctx);
    WorldRenderer.drawTiles(ctx);
    WorldRenderer.drawTorches(ctx);
    CharacterRenderer.drawPlayer(ctx);

    // 2. Radiant Golden Morning Light Streaming through the Threshold ahead
    // Ahead at the threshold (x = 31 * T), warm morning light floods into the hall
    const p = Math.min(1.0, t / 8.0);
    const exitWorldX = 30.5 * T;
    const exitWorldY = 15.5 * T;

    // Golden sunbeams piercing backwards down the corridor
    const beamCount = 6;
    for (let i = 0; i < beamCount; i++) {
      const angle = -0.32 + (i / beamCount) * 0.64;
      const beamGrad = ctx.createLinearGradient(exitWorldX, exitWorldY, exitWorldX - 440, exitWorldY + Math.tan(angle) * 260);
      beamGrad.addColorStop(0, `rgba(254, 240, 138, ${0.45 * (0.4 + 0.6 * p)})`);
      beamGrad.addColorStop(0.35, `rgba(251, 191, 36, ${0.25 * (0.4 + 0.6 * p)})`);
      beamGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(exitWorldX, exitWorldY - 50);
      ctx.lineTo(exitWorldX, exitWorldY + 50);
      ctx.lineTo(exitWorldX - 440, exitWorldY + Math.tan(angle) * 260 + 40);
      ctx.lineTo(exitWorldX - 440, exitWorldY + Math.tan(angle) * 260 - 40);
      ctx.closePath();
      ctx.fill();
    }

    // Warm radial floor illumination around exit threshold
    const floorGlow = ctx.createRadialGradient(exitWorldX, exitWorldY, 30, exitWorldX, exitWorldY, 400 + p * 150);
    floorGlow.addColorStop(0, `rgba(254, 243, 199, ${0.60 * p})`);
    floorGlow.addColorStop(0.35, `rgba(251, 191, 36, ${0.35 * p})`);
    floorGlow.addColorStop(0.7, `rgba(245, 158, 11, ${0.15 * p})`);
    floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorGlow;
    ctx.fillRect(exitWorldX - 440, 12 * T, 520, 7 * T);

    ctx.restore();

    // 3. Ambient Lighting & Atmospheric Warm Glow
    LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, GameState.CAM.z);

    // Warm morning bloom washing over the frame as Rowan nears the exit
    if (p > 0.4) {
      const bloomAlpha = (p - 0.4) / 0.6 * 0.35;
      const bloomGrad = ctx.createRadialGradient(LW * 0.75, LH * 0.5, 0, LW * 0.75, LH * 0.5, LW * 0.7);
      bloomGrad.addColorStop(0, `rgba(254, 240, 138, ${bloomAlpha})`);
      bloomGrad.addColorStop(0.5, `rgba(251, 191, 36, ${bloomAlpha * 0.5})`);
      bloomGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = bloomGrad;
      ctx.fillRect(0, 0, LW, LH);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // SHOT IX: ROWAN AT SUNRISE (75–85s)
  // State-of-the-Art Mountain Overlook Vista: 7-stop dawn sky,
  // 4-tier mountain depth fog, drifting valley mist, volumetric god rays,
  // and Lord Rowan with billowing cloak & dawn rim-lighting
  // ─────────────────────────────────────────────────────────────
  drawShot9Sunrise(ctx, t, isReducedMotion) {
    const p = this.dawnProgress;
    const horizY = Math.round(LH * 0.56);

    // 1. Lush 7-Stop Dawn Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizY + 18);
    skyGrad.addColorStop(0.00, '#091224'); // Deep midnight navy zenith
    skyGrad.addColorStop(0.18, '#172554'); // Twilight indigo
    skyGrad.addColorStop(0.38, '#3b1847'); // Dusky violet
    skyGrad.addColorStop(0.58, '#831843'); // Morning rose / crimson edge
    skyGrad.addColorStop(0.76, '#b45309'); // Warm amber horizon
    skyGrad.addColorStop(0.90, '#f59e0b'); // Golden dawn fire
    skyGrad.addColorStop(1.00, '#fef08a'); // Radiant horizon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, LW, horizY + 18);

    // 2. Soft Upper Dawn Cloud Shelves (Wispy cirrus catching rose & gold under-glow)
    ctx.save();
    const cloud1 = ctx.createLinearGradient(0, LH * 0.16, 0, LH * 0.26);
    cloud1.addColorStop(0, 'rgba(244, 114, 182, 0)');
    cloud1.addColorStop(0.5, 'rgba(244, 114, 182, 0.18)');
    cloud1.addColorStop(1, 'rgba(254, 240, 138, 0.22)');
    ctx.fillStyle = cloud1;
    ctx.beginPath();
    ctx.ellipse(LW * 0.42, LH * 0.21, LW * 0.38, 14, 0.02, 0, Math.PI * 2);
    ctx.fill();

    const cloud2 = ctx.createLinearGradient(0, LH * 0.28, 0, LH * 0.36);
    cloud2.addColorStop(0, 'rgba(251, 146, 60, 0)');
    cloud2.addColorStop(0.5, 'rgba(251, 146, 60, 0.16)');
    cloud2.addColorStop(1, 'rgba(254, 240, 138, 0.20)');
    ctx.fillStyle = cloud2;
    ctx.beginPath();
    ctx.ellipse(LW * 0.70, LH * 0.32, LW * 0.28, 10, -0.01, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Rising Sun Disk, Atmospheric Corona & God Rays
    const sunX = this.sunPos.x;
    const sunY = Math.round(horizY + 8 - p * 44);

    // Atmospheric Horizon Halo / Corona
    const haloRadius = 180 + p * 180;
    const sunHalo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, haloRadius);
    sunHalo.addColorStop(0, `rgba(254, 243, 199, ${0.45 + p * 0.45})`);
    sunHalo.addColorStop(0.35, `rgba(251, 191, 36, ${0.28 + p * 0.30})`);
    sunHalo.addColorStop(0.7, `rgba(244, 114, 182, ${0.10 + p * 0.12})`);
    sunHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunHalo;
    ctx.fillRect(0, 0, LW, horizY + 18);

    // Radiant Solar Disc (Inner Pure White + Golden Outer Aura)
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Volumetric Crepuscular God Rays fanning across the valley
    if (!isReducedMotion) {
      ctx.save();
      const rayAngles = [-0.65, -0.42, -0.18, 0.10, 0.35];
      rayAngles.forEach((ang, idx) => {
        const rayAlpha = 0.08 + Math.sin(t * 1.5 + idx) * 0.03;
        ctx.fillStyle = `rgba(254, 240, 138, ${rayAlpha})`;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(ang - 0.08) * 800, sunY + Math.sin(ang - 0.08) * 800);
        ctx.lineTo(sunX + Math.cos(ang + 0.08) * 800, sunY + Math.sin(ang + 0.08) * 800);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    }

    // 4. Four-Tier Layered Mountain Ridges with Aerial Depth Fog
    // Tier 1: Far Alpine Peaks (Slate-lavender distance fog)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, horizY);
    ctx.lineTo(0, horizY - 36);
    ctx.lineTo(90, horizY - 65);
    ctx.lineTo(190, horizY - 42);
    ctx.lineTo(310, horizY - 78);
    ctx.lineTo(440, horizY - 58);
    ctx.lineTo(sunX - 35, horizY - 28);
    ctx.lineTo(620, horizY - 72);
    ctx.lineTo(760, horizY - 48);
    ctx.lineTo(LW, horizY - 60);
    ctx.lineTo(LW, horizY);
    ctx.closePath();
    ctx.fill();

    // Drifting Valley Mist (Soft morning haze between distant and mid ridges)
    ctx.save();
    const mist1 = ctx.createLinearGradient(0, horizY - 30, 0, horizY);
    mist1.addColorStop(0, 'rgba(254, 243, 199, 0)');
    mist1.addColorStop(0.5, 'rgba(254, 243, 199, 0.16)');
    mist1.addColorStop(1, 'rgba(254, 243, 199, 0.04)');
    ctx.fillStyle = mist1;
    ctx.fillRect(0, horizY - 30, LW, 30);
    ctx.restore();

    // Tier 2: Mid Mountain Ridge (Deep pine teal with saddle gaps)
    ctx.fillStyle = '#132822';
    ctx.beginPath();
    ctx.moveTo(0, horizY);
    ctx.lineTo(0, horizY - 22);
    ctx.lineTo(130, horizY - 45);
    ctx.lineTo(260, horizY - 26);
    ctx.lineTo(410, horizY - 50);
    ctx.lineTo(540, horizY - 20);
    ctx.lineTo(680, horizY - 42);
    ctx.lineTo(LW, horizY - 26);
    ctx.lineTo(LW, horizY);
    ctx.closePath();
    ctx.fill();

    // Tier 3: Near Forest Ridge with Pine Tree Silhouettes
    ctx.fillStyle = '#0e1f18';
    ctx.beginPath();
    ctx.moveTo(0, horizY);
    ctx.lineTo(0, horizY - 14);
    for (let px = 0; px <= LW; px += 35) {
      const ph = Math.sin(px * 0.03) * 8 + ((px % 70 === 0) ? -6 : 0);
      ctx.lineTo(px, horizY - 14 + ph);
    }
    ctx.lineTo(LW, horizY);
    ctx.closePath();
    ctx.fill();

    // 5. Overlook Promontory Ground & Crag
    this.drawOverlookRidge(ctx, horizY, p);

    // 6. Floating Dawn Pollen / Ember Motes (Continuity with Shot 1)
    if (!isReducedMotion) {
      ctx.save();
      for (let i = 0; i < 18; i++) {
        const mx = (LW * 0.20 + (i * 47 + t * 14)) % LW;
        const my = LH * 0.45 + (Math.sin(t * 1.5 + i * 2.0) * 35) - ((t * 8 + i * 20) % (LH * 0.45));
        ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 4;
        ctx.fillRect(mx, my, 1.5, 1.5);
      }
      ctx.restore();
    }

    // 7. Distant Birds gliding smoothly toward the sunrise
    this.distantBirds.forEach(b => {
      const wing = Math.sin(b.flap) * 2.5;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2 * b.scale;
      ctx.beginPath();
      ctx.moveTo(b.x - 5 * b.scale, b.y + wing);
      ctx.quadraticCurveTo(b.x, b.y - 1, b.x + 5 * b.scale, b.y + wing);
      ctx.stroke();
    });

    // 8. Heroic Lord Rowan on the Overlook promontory (Planted Greatsword, billowing cloak & dawn rim-light)
    const rx = this.rowanOverlookPos.x;
    const ry = this.rowanOverlookPos.y;
    this.drawRowanPixelSprite(ctx, rx, ry, 1.35, 1, p);
  },

  // ─────────────────────────────────────────────────────────────
  // Authentic Pixel Rowan Renderer for Sunrise Overlook
  // Preserves exact in-game palette, armor, helmet, cloak & proportions
  // Enhanced with planted Greatsword, multi-wave cape physics & specular rim-lighting
  // ─────────────────────────────────────────────────────────────
  drawRowanPixelSprite(ctx, x, y, scale = 1.0, facing = 1, dawnProgress = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const t = this.foliageSwayTimer;
    const breath = Math.sin(t * 2.2) * 0.9;
    // Multi-harmonic natural cape billowing in mountain wind
    const capeBlow = Math.sin(t * 3.4) * 2.8 + Math.cos(t * 5.1) * 1.2;

    // 1. Ground Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 11, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Lord Rowan Crimson Cloak (Blowing majestically in morning mountain air)
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-facing * 6, -9);
    ctx.lineTo(-facing * 15, 5 + capeBlow);
    ctx.lineTo(-facing * 10, 15);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4c0519';
    ctx.fillRect(-facing * 9, 4, 9, 8);

    // 3. Steel Sabatons & Greaves (Armored boots)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5, 5, 4, 8);
    ctx.fillRect(1.5, 5, 4, 8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, 11, 5, 3);
    ctx.fillRect(1, 11, 5, 3);

    // 4. Steel Plate Cuirass & Gold Inlay Trim
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7, -9 + breath * 0.3, 14, 14);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -8 + breath * 0.3, 12, 6);

    // Breastplate ridge highlight
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 3);
    ctx.stroke();

    // Gold inlay trim
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-6, -2, 12, 2);

    // 5. Pauldrons (Shoulder guards)
    ctx.fillStyle = '#475569';
    ctx.fillRect(-10, -9 + breath * 0.3, 4, 6);
    ctx.fillRect(6.5, -9 + breath * 0.3, 4, 6);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-10, -4, 4, 1.5);
    ctx.fillRect(6.5, -4, 4, 1.5);

    // 6. Visored Great Helm & Glowing Azure Visor
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -15, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillRect(-5, -18, 10, 5);

    // Glowing cyan visor slit gazing toward sunrise
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 6;
    ctx.fillRect(facing === 1 ? 0 : -4.5, -15, 5, 2.0);
    ctx.shadowBlur = 0;

    // 7. Greatsword Planted Vertically in Stone Crag (Right hand resting calmly on pommel)
    // Sword blade planted into stone
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(facing * 9, -2, 2.5, 14);
    // Sword point embedded in rock
    ctx.fillStyle = '#64748b';
    ctx.fillRect(facing * 9, 12, 2.5, 3);
    // Crossguard
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(facing * 6.5, -4, 7.5, 2);
    // Leather-wrapped hilt
    ctx.fillStyle = '#451a03';
    ctx.fillRect(facing * 9, -8, 2.5, 4);
    // Golden pommel beneath Rowan's gauntlet
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(facing * 10.2, -9, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Gauntleted right arm resting on pommel
    ctx.fillStyle = '#334155';
    ctx.fillRect(facing * 7, -9, 4, 3.5);

    // 8. Radiant Dawn Rim Lighting (Tracing the eastern contours struck by morning sunlight)
    if (dawnProgress > 0.1) {
      const rimAlpha = Math.min(1.0, dawnProgress * 1.25);
      ctx.save();
      ctx.strokeStyle = `rgba(254, 240, 138, ${0.90 * rimAlpha})`;
      ctx.lineWidth = 1.5;

      // Rim-light on Helmet
      ctx.beginPath();
      ctx.arc(0, -15, 6.8, -Math.PI * 0.25, Math.PI * 0.25);
      ctx.stroke();

      // Rim-light on eastern Pauldron & Arm
      ctx.beginPath();
      ctx.moveTo(9, -8);
      ctx.lineTo(9, -3);
      ctx.stroke();

      // Rim-light on planted Greatsword blade edge
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * rimAlpha})`;
      ctx.beginPath();
      ctx.moveTo(facing * 11.5, -4);
      ctx.lineTo(facing * 11.5, 12);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  },

  drawOverlookRidge(ctx, horizY, p) {
    const ridgeGrad = ctx.createLinearGradient(0, horizY - 10, 0, LH);
    ridgeGrad.addColorStop(0.0, '#102318');
    ridgeGrad.addColorStop(0.3, '#142c1d');
    ridgeGrad.addColorStop(0.7, '#183624');
    ridgeGrad.addColorStop(1.0, '#0d1d13');
    ctx.fillStyle = ridgeGrad;

    ctx.beginPath();
    ctx.moveTo(0, horizY - 8);
    ctx.bezierCurveTo(LW * 0.30, horizY - 12, LW * 0.55, horizY + 18, LW, horizY + 8);
    ctx.lineTo(LW, LH);
    ctx.lineTo(0, LH);
    ctx.closePath();
    ctx.fill();

    // Weathered Mountain Crag with rock strata under Rowan's boots
    const cx = this.rowanOverlookPos.x;
    const cy = this.rowanOverlookPos.y + 16;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 46, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Crag rock highlights and clumps of alpine turf
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy - 2);
    ctx.lineTo(cx + 24, cy - 3);
    ctx.stroke();

    // Windblown alpine grass tufts
    ctx.fillStyle = '#15803d';
    ctx.fillRect(cx - 36, cy - 6, 3, 5);
    ctx.fillRect(cx - 32, cy - 8, 2, 7);
    ctx.fillRect(cx + 28, cy - 5, 3, 5);
    ctx.fillRect(cx + 34, cy - 7, 2, 7);
  },

  // ─────────────────────────────────────────────────────────────
  // Smoothstep Easing Function: Eases gracefully in and out (3p² - 2p³)
  // ─────────────────────────────────────────────────────────────
  _computeSmoothAlpha(t, start, fade, hold) {
    if (t < start) return 0;
    const fadeInEnd = start + fade;
    const holdEnd = fadeInEnd + hold;
    const fadeOutEnd = holdEnd + fade;
    if (t > fadeOutEnd) return 0;

    let p = 0;
    if (t < fadeInEnd) {
      p = (t - start) / fade;
    } else if (t < holdEnd) {
      return 1.0;
    } else {
      p = 1.0 - (t - holdEnd) / fade;
    }
    const clamped = Math.max(0, Math.min(1, p));
    return clamped * clamped * (3 - 2 * clamped);
  },

  // ─────────────────────────────────────────────────────────────
  // Unified Center Screen Typography & Emotional Storytelling
  // Centers all messages, delivers slow cinematic fades, and preserves scene continuity
  // ─────────────────────────────────────────────────────────────
  drawCenterTypography(ctx) {
    if (this._stage === 'INACTIVE' || this._stage === 'GOLDEN_FLASH' || this.isExiting) return;

    const t = this.stageTimer;
    const cx = LW / 2;
    const cy = Math.round(LH * 0.48);

    // Shot 9 Creator Credit Phase (t >= 7.2s)
    if (this._stage === 'SHOT_9_SUNRISE' && t >= 7.2) {
      const creditAlpha = this._computeSmoothAlpha(t, 7.5, 1.5, 4.2);
      if (creditAlpha > 0.005) {
        this.drawFinalCreatorCredit(ctx, creditAlpha);
      }
      return;
    }

    // Secret Sanctum Password Reveal Phase (after creator credit)
    if (this._stage === 'STAGE_PASSWORD_REVEAL') {
      const alpha = this._computeSmoothAlpha(t, 0.4, 1.0, 4.8);
      if (alpha > 0.005) {
        this.drawPasswordRevealBeat(ctx, alpha);
      }
      return;
    }

    const gratitude = this.gratitudeMessages.find(m => m.shot === this._stage);
    const chronicle = this.narrativeChronicles[this._stage];
    if (!chronicle && !gratitude) return;

    let start = 1.5;
    let fade = 1.4;
    let hold = 3.8;
    let mainText = '';
    let chapterTitle = chronicle ? chronicle.chapter : '';

    if (gratitude) {
      start = gratitude.start;
      fade = gratitude.fade;
      hold = gratitude.hold;
      mainText = gratitude.text;
    } else if (chronicle) {
      if (this._stage === 'SHOT_1_LIGHT') {
        start = 1.8; fade = 1.3; hold = 2.0;
      } else if (this._stage === 'SHOT_5_GORGAROTH') {
        start = 1.4; fade = 1.4; hold = 4.2;
      } else if (this._stage === 'SHOT_7_WARDEN') {
        start = 1.4; fade = 1.4; hold = 4.5;
      }
      mainText = chronicle.chronicle;
    }

    const alpha = this._computeSmoothAlpha(t, start, fade, hold);
    if (alpha <= 0.005) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.textAlign = 'center';

    // Gentle weightless float upwards (4px) as it breathes into place
    const floatY = (1 - alpha) * 4;
    const textCenterY = cy - floatY;

    // Atmospheric center radial vignette for supreme contrast & cinematic presence
    const vig = ctx.createRadialGradient(cx, textCenterY, 15, cx, textCenterY, 360);
    vig.addColorStop(0, `rgba(4, 6, 14, ${0.72 * alpha})`);
    vig.addColorStop(0.55, `rgba(4, 6, 14, ${0.38 * alpha})`);
    vig.addColorStop(1, 'rgba(4, 6, 14, 0)');
    ctx.fillStyle = vig;
    ctx.fillRect(cx - 400, textCenterY - 140, 800, 280);

    ctx.font = 'italic 21px "Crimson Text", "Cinzel", Georgia, serif';
    const maxWidth = 700;
    const isLongText = ctx.measureText(mainText).width > maxWidth;

    const titleY = textCenterY - (isLongText ? 32 : 22);
    const quoteY = textCenterY + (isLongText ? 6 : 14);

    // 1. Chapter Title Header (e.g. —  THE CRUCIBLE OF STEEL  —)
    if (chapterTitle) {
      ctx.font = 'bold 12px "Cinzel", "Crimson Text", Georgia, serif';
      ctx.fillStyle = '#fde68a';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 1;
      ctx.fillText(`—  ${chapterTitle}  —`, cx, titleY);
    }

    // 2. Main Quote / Gratitude Text
    ctx.font = 'italic 21px "Crimson Text", "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fef3c7';

    if (isLongText) {
      const words = mainText.split(' ');
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');

      // Two-pass shadow: warm golden bloom + deep crisp silhouette
      ctx.shadowColor = 'rgba(217, 119, 6, 0.35)';
      ctx.shadowBlur = 12;
      ctx.fillText(line1, cx, quoteY);
      ctx.fillText(line2, cx, quoteY + 28);

      ctx.shadowColor = 'rgba(2, 4, 10, 0.95)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillText(line1, cx, quoteY);
      ctx.fillText(line2, cx, quoteY + 28);
    } else {
      ctx.shadowColor = 'rgba(217, 119, 6, 0.35)';
      ctx.shadowBlur = 12;
      ctx.fillText(mainText, cx, quoteY);

      ctx.shadowColor = 'rgba(2, 4, 10, 0.95)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillText(mainText, cx, quoteY);
    }

    ctx.restore();
  },

  drawNarrativeChronicle(ctx) {
    // Delegated to unified drawCenterTypography to guarantee pure center screen positioning
  },

  // ─────────────────────────────────────────────────────────────
  // THE GOLDEN FINALE WASH (85–88.5s)
  // ─────────────────────────────────────────────────────────────
  drawGoldenFlashWash(ctx, t) {
    const flashP = Math.min(1.0, t / 3.0);
    const sunX = this.sunPos.x;
    const sunY = this.sunPos.y;

    ctx.save();
    const rad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, LW * 1.2);
    rad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, flashP * 1.2)})`);
    rad.addColorStop(0.35, `rgba(254, 243, 199, ${Math.min(1, flashP * 1.1)})`);
    rad.addColorStop(0.7, `rgba(251, 191, 36, ${Math.min(1, flashP * 0.95)})`);
    rad.addColorStop(1, `rgba(255, 248, 231, ${flashP})`);
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, LW, LH);

    if (flashP > 0.45) {
      const whiteWash = (flashP - 0.45) / 0.55;
      ctx.fillStyle = `rgba(255, 248, 231, ${whiteWash})`;
      ctx.fillRect(0, 0, LW, LH);
    }
    ctx.restore();
  },

  drawActiveGratitudeMessage(ctx) {
    // Delegated to unified drawCenterTypography to guarantee pure center screen positioning
  },

  // ─────────────────────────────────────────────────────────────
  // Final Creator Credit: "A Game by Dinesh Polimera"
  // ─────────────────────────────────────────────────────────────
  drawFinalCreatorCredit(ctx, alpha = 1.0) {
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.textAlign = 'center';

    const cx = LW / 2;
    const cy = Math.round(LH * 0.48);

    // Subtle upward float
    const floatY = (1 - alpha) * 4;
    const creditCenterY = cy - floatY;

    // Soft atmospheric center vignette
    const vig = ctx.createRadialGradient(cx, creditCenterY, 20, cx, creditCenterY, 380);
    vig.addColorStop(0, `rgba(4, 6, 14, ${0.75 * alpha})`);
    vig.addColorStop(0.55, `rgba(4, 6, 14, ${0.40 * alpha})`);
    vig.addColorStop(1, 'rgba(4, 6, 14, 0)');
    ctx.fillStyle = vig;
    ctx.fillRect(cx - 400, creditCenterY - 140, 800, 280);

    // Title line: Thanks for playing Dungeon Break.
    ctx.font = '24px "Crimson Text", "Cinzel", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillText(this.finalCredit.title, cx, creditCenterY - 14);

    // Author line: A Game by Dinesh Polimera
    ctx.font = '17px "Crimson Text", "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fde68a';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;
    ctx.fillText(this.finalCredit.author, cx, creditCenterY + 24);

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // Final Secret Beat: Permanent Developer Sanctum Password Reveal
  // ─────────────────────────────────────────────────────────────
  drawPasswordRevealBeat(ctx, alpha = 1.0) {
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.textAlign = 'center';

    const cx = LW / 2;
    const cy = Math.round(LH * 0.48);

    // Center radial vignette
    const vig = ctx.createRadialGradient(cx, cy, 20, cx, cy, 380);
    vig.addColorStop(0, `rgba(4, 6, 14, ${0.85 * alpha})`);
    vig.addColorStop(0.55, `rgba(4, 6, 14, ${0.50 * alpha})`);
    vig.addColorStop(1, 'rgba(4, 6, 14, 0)');
    ctx.fillStyle = vig;
    ctx.fillRect(cx - 400, cy - 140, 800, 280);

    // Decorative chamfered plaque
    const pw = 420, ph = 110;
    const px = Math.round(cx - pw / 2), py = Math.round(cy - ph / 2);
    ctx.fillStyle = 'rgba(7, 10, 22, 0.94)';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(253, 230, 138, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 4, py + 4, pw - 8, ph - 8);

    // Header line
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;
    ctx.fillText('◈ SEALED SANCTUM CIPHER ◈', cx, cy - 26);
    ctx.shadowBlur = 0;

    // The Authoritative Permanent Password
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(217, 119, 6, 0.9)';
    ctx.shadowBlur = 12;
    ctx.fillText('SANCTUM10', cx, cy + 8);
    ctx.shadowBlur = 0;

    // Subtitle note
    ctx.font = 'italic 12px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('The threshold recognizes the Last Witness. Note this cipher for the Sealed Sanctum.', cx, cy + 34);

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // Skip Prompt
  // ─────────────────────────────────────────────────────────────
  drawSkipPrompt(ctx) {
    if (this._stage === 'GOLDEN_FLASH' || this.isExiting) return;
    if (!CinematicSafety.canSkip() || !CinematicSafety.shouldShowSkipHint()) return;

    ctx.save();
    ctx.globalAlpha = 0.50;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(CinematicSafety.isReplay() ? 'ESC / CLICK TO EXIT ARCHIVE' : 'ESC TO SKIP', LW - 24, LH - 20);
    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // Controls & Skip Handlers
  // ─────────────────────────────────────────────────────────────
  handleKeyDown(e) {
    if (!this.active) return false;
    const key = (typeof e === 'string') ? e : (e.key || e.code);

    if (key === 'Escape' || key === 'Esc') {
      if (CinematicSafety.isReplay()) {
        this.cleanupAndReturn(false);
        return true;
      }
      if (CinematicSafety.isValidSkipKey(key)) {
        this.finish();
      }
      return true;
    }

    if (key === ' ' || key === 'Enter') {
      if (this._stage === 'SHOT_9_SUNRISE' || this._stage === 'STAGE_PASSWORD_REVEAL') {
        this.finishWithGoldenWash();
        return true;
      }
    }

    return true; // Consume inputs during cinematic
  },

  handleClick(mx, my) {
    if (!this.active) return false;

    if (this._stage === 'SHOT_9_SUNRISE' || this._stage === 'STAGE_PASSWORD_REVEAL') {
      this.finishWithGoldenWash();
      return true;
    }

    if (CinematicSafety.isReplay()) {
      if (CinematicSafety.isValidSkipClick()) {
        this.cleanupAndReturn(false);
      }
      return true;
    }

    if (my >= LH - 44) {
      if (CinematicSafety.isValidSkipClick()) {
        this.finish();
      }
      return true;
    }

    return true;
  },

  finishWithGoldenWash() {
    if (this.isExiting) return;
    this.isExiting = true;
    this.stopAudio();
    // Record genuine completion of gift cinematic through its actual final frame
    SaveSystem.recordGiftCinematicCompleted();
    this.cleanupAndReturn(true);
  },

  finish() {
    if (this.isExiting) return;
    this.isExiting = true;
    this._stage = 'EXITING';
    this.exitFade = 0;
    this.stopAudio();
    try { SoundManager.snd('menu_select'); } catch (e) {}
  },

  cleanupAndReturn(useGoldenWash = false) {
    const isReplay = CinematicSafety.isReplay();
    this.active = false;
    this._stage = 'INACTIVE';
    this.isExiting = false;
    this.stopAudio();

    // Restore gameplay state safely
    this._restoreGameStateSnapshot();

    // Restore debug overlay for developer visibility upon return
    this.setDebugOverlayVisible(true);

    if (isReplay) {
      CinematicSafety.finishReplay();
      return;
    }

    // If finishing naturally via sunrise, trigger golden wash in title
    if (useGoldenWash && typeof MainMenu !== 'undefined' && MainMenu.triggerGoldenWash) {
      MainMenu.triggerGoldenWash();
    }

    // Return cleanly to title
    GameState.setState(GameStates.TITLE);

    // Resume menu theme music smoothly
    try {
      MusicManager.play('menu', { loop: true, fade: 1.5 });
    } catch (e) {}

    console.log('[LastEmberCinematic] Phase 3.4 Visual Restoration clean exit returned to Main Menu.');
  }
};

if (typeof window !== 'undefined') {
  window.LastEmberCinematic = LastEmberCinematic;
}
