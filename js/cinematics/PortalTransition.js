// =====================================================================
//  DUNGEON BREAK — js/cinematics/PortalTransition.js
//  THE ABYSSAL THRESHOLD:
//  Authoritative In-World Portal Entity, Proximity Awakening, 5-Stage Entry,
//  Cosmic Void Traversal, & Destination Arrival Cinematic Sequence
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T, clamp, lerp } from '../core/Constants.js';
import { FLOOR_WARP_QUOTES, isBossFloor, FLOOR_CONFIG } from '../data/floors.js';
import { FloorManager } from '../world/FloorManager.js';
import { SoundManager } from '../audio/AudioManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { EventBus } from '../core/EventBus.js';

// Global / backward-compatible transition state
export let WARP_ACTIVE = false;
export let WARP_TIMER = 0;
export const WARP_DUR = 2.30; // 0.90s Entering + 0.80s Transit + 0.60s Arriving
export let WARP_QUOTE = '';
export let WARP_NEXT_LV = 1;
export let WARP_ON_COMPLETE = null;

// Stage durations
const DUR_ENTERING = 0.90;
const DUR_TRANSIT  = 0.80;
const DUR_ARRIVING = 0.60;

// Persistent particle pools
const MAX_PORTAL_MOTES = 24;
let _portalMotes = [];
let _transitDebris = [];
let _transitStreaks = [];

export const PORTAL_CONTEXTS = {
  STANDARD_FLOOR_EXIT: 'STANDARD_FLOOR_EXIT',
  GORGAROTH_DEATH_PORTAL: 'GORGAROTH_DEATH_PORTAL',
  MALAKOR_VOID_PORTAL: 'MALAKOR_VOID_PORTAL',
  ABYSS_WARDEN_ENDING_PORTAL: 'ABYSS_WARDEN_ENDING_PORTAL'
};

export const CONTEXT_PROFILES = {
  STANDARD_FLOOR_EXIT: {
    id: 'STANDARD_FLOOR_EXIT',
    name: 'The Abyssal Threshold',
    theme: 'cosmic',
    daisFill: '#0c0914',
    daisBorder: '#261a38',
    bracketShadow: '#3b2907',
    bracketBody: '#85601d',
    bracketHighlight: '#c9a84c',
    bracketRivet: '#fde68a',
    ambientColors: ['rgba(56, 189, 248, ', 'rgba(168, 85, 247, '],
    rippleColor: 'rgba(56, 189, 248, ',
    rippleSecondaryColor: 'rgba(192, 132, 252, ',
    runes: ['ᛟ', 'ᛉ', 'ᚦ', 'ᛏ', 'ᚱ', 'ᛋ'],
    runeDormantCol: '#7c3aed',
    runeFlareCol: '#38bdf8',
    runeActiveCol: '#c084fc',
    ringTeethCol: '#1e1430',
    ringTeethHighlight: 'rgba(56, 189, 248, ',
    shardCol: '#2d1b4e',
    shardEdgeCol: '#c084fc',
    voidCoreColors: ['#000000', '#05020c', '#1b092e', 'rgba(56, 189, 248, 0.4)'],
    fissureCol: '#38bdf8',
    fissureShadow: '#c084fc',
    moteColors: ['#38bdf8', '#c084fc', '#fde68a'],
    foregroundShardCol: '#1e1035',
    foregroundShardEdge: '#38bdf8',
    filamentCol: 'rgba(56, 189, 248, 0.45)',
    destApertureColors: ['#ffffff', '#38bdf8', '#7c3aed', 'rgba(2, 4, 12, 0)'],
    destIrisRing1: 'rgba(56, 189, 248, 0.75)',
    destIrisRing2: 'rgba(192, 132, 252, 0.55)',
    quoteLetterboxColor: 'rgba(2, 4, 12, 0.94)',
    quoteFiligreeColor: 'rgba(201, 168, 76, 0.7)',
    quoteTitle: 'LORD ROWAN — INNER MONOLOGUE',
    entryPolicy: 'manual'
  },
  GORGAROTH_DEATH_PORTAL: {
    id: 'GORGAROTH_DEATH_PORTAL',
    name: "Gorgaroth's Iron Gate",
    theme: 'iron',
    daisFill: '#18100c',
    daisBorder: '#3d281e',
    bracketShadow: '#260a04',
    bracketBody: '#7c2d12',
    bracketHighlight: '#ea580c',
    bracketRivet: '#fdba74',
    ambientColors: ['rgba(234, 88, 12, ', 'rgba(249, 115, 22, '],
    rippleColor: 'rgba(234, 88, 12, ',
    rippleSecondaryColor: 'rgba(251, 146, 60, ',
    runes: ['ᚦ', 'ᚱ', 'ᛏ', 'ᛋ', 'ᚺ', 'ᛗ'],
    runeDormantCol: '#9a3412',
    runeFlareCol: '#fde047',
    runeActiveCol: '#ea580c',
    ringTeethCol: '#2a1a12',
    ringTeethHighlight: 'rgba(251, 146, 60, ',
    shardCol: '#431407',
    shardEdgeCol: '#ea580c',
    voidCoreColors: ['#000000', '#0a0301', '#2c0d04', 'rgba(234, 88, 12, 0.45)'],
    fissureCol: '#fb923c',
    fissureShadow: '#ea580c',
    moteColors: ['#ea580c', '#f97316', '#fde047'],
    foregroundShardCol: '#26140d',
    foregroundShardEdge: '#f97316',
    filamentCol: 'rgba(249, 115, 22, 0.50)',
    destApertureColors: ['#fef08a', '#f97316', '#7c2d12', 'rgba(10, 3, 1, 0)'],
    destIrisRing1: 'rgba(234, 88, 12, 0.85)',
    destIrisRing2: 'rgba(253, 186, 116, 0.60)',
    quoteLetterboxColor: 'rgba(12, 6, 4, 0.96)',
    quoteFiligreeColor: 'rgba(234, 88, 12, 0.75)',
    quoteTitle: 'THE IRON COLLAPSE — ASCENSION DEEPER',
    entryPolicy: 'manual'
  },
  MALAKOR_VOID_PORTAL: {
    id: 'MALAKOR_VOID_PORTAL',
    name: "Malakor's Dimensional Rift",
    theme: 'void',
    daisFill: '#09061b',
    daisBorder: '#2e185b',
    bracketShadow: '#1e0538',
    bracketBody: '#3b0764',
    bracketHighlight: '#7e22ce',
    bracketRivet: '#c084fc',
    ambientColors: ['rgba(168, 85, 247, ', 'rgba(56, 189, 248, '],
    rippleColor: 'rgba(168, 85, 247, ',
    rippleSecondaryColor: 'rgba(56, 189, 248, ',
    runes: ['ᛉ', 'ᛋ', 'ᛟ', 'ᚹ', 'ᚦ', 'ᛞ'],
    runeDormantCol: '#581c87',
    runeFlareCol: '#38bdf8',
    runeActiveCol: '#a855f7',
    ringTeethCol: '#160b29',
    ringTeethHighlight: 'rgba(168, 85, 247, ',
    shardCol: '#3b0764',
    shardEdgeCol: '#c084fc',
    voidCoreColors: ['#000000', '#040008', '#1e0836', 'rgba(168, 85, 247, 0.45)'],
    fissureCol: '#38bdf8',
    fissureShadow: '#a855f7',
    moteColors: ['#a855f7', '#38bdf8', '#c084fc'],
    foregroundShardCol: '#1b0933',
    foregroundShardEdge: '#c084fc',
    filamentCol: 'rgba(168, 85, 247, 0.55)',
    destApertureColors: ['#ffffff', '#a855f7', '#1e0836', 'rgba(4, 1, 10, 0)'],
    destIrisRing1: 'rgba(168, 85, 247, 0.85)',
    destIrisRing2: 'rgba(56, 189, 248, 0.60)',
    quoteLetterboxColor: 'rgba(6, 3, 14, 0.96)',
    quoteFiligreeColor: 'rgba(168, 85, 247, 0.75)',
    quoteTitle: 'THE FRACTURED REACH — REALITY FOLDS',
    entryPolicy: 'manual'
  },
  ABYSS_WARDEN_ENDING_PORTAL: {
    id: 'ABYSS_WARDEN_ENDING_PORTAL',
    name: 'The Primordial Gateway of Ascension',
    theme: 'cathedral',
    daisFill: '#1a0404',
    daisBorder: '#450a0a',
    bracketShadow: '#2a0202',
    bracketBody: '#78350f',
    bracketHighlight: '#dc2626',
    bracketRivet: '#fde047',
    ambientColors: ['rgba(220, 38, 38, ', 'rgba(245, 158, 11, '],
    rippleColor: 'rgba(220, 38, 38, ',
    rippleSecondaryColor: 'rgba(245, 158, 11, ',
    runes: ['ᚦ', 'ᛏ', 'ᛟ', 'ᛉ', 'ᚱ', 'ᛋ'],
    runeDormantCol: '#7f1d1d',
    runeFlareCol: '#fde047',
    runeActiveCol: '#ef4444',
    ringTeethCol: '#2b0808',
    ringTeethHighlight: 'rgba(220, 38, 38, ',
    shardCol: '#450a0a',
    shardEdgeCol: '#ef4444',
    voidCoreColors: ['#000000', '#0a0101', '#280404', 'rgba(220, 38, 38, 0.5)'],
    fissureCol: '#fde047',
    fissureShadow: '#dc2626',
    moteColors: ['#dc2626', '#ef4444', '#fde047'],
    foregroundShardCol: '#2e0707',
    foregroundShardEdge: '#dc2626',
    filamentCol: 'rgba(220, 38, 38, 0.60)',
    destApertureColors: ['#ffffff', '#fde047', '#b91c1c', 'rgba(10, 0, 0, 0)'],
    destIrisRing1: 'rgba(220, 38, 38, 0.90)',
    destIrisRing2: 'rgba(245, 158, 11, 0.65)',
    quoteLetterboxColor: 'rgba(10, 2, 2, 0.96)',
    quoteFiligreeColor: 'rgba(217, 119, 6, 0.85)',
    quoteTitle: 'DESTINY BEYOND THE ABYSS',
    entryPolicy: 'scripted'
  }
};

function initParticlePools() {
  if (_portalMotes.length === 0) {
    for (let i = 0; i < MAX_PORTAL_MOTES; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 22;
      _portalMotes.push({
        angle: ang,
        dist: dist,
        baseDist: dist,
        speed: 0.8 + Math.random() * 1.4,
        size: Math.random() > 0.6 ? 2.2 : 1.5,
        col: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#c084fc' : '#fde68a',
        alpha: 0.4 + Math.random() * 0.6,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  if (_transitDebris.length === 0) {
    for (let i = 0; i < 36; i++) {
      _transitDebris.push({
        x: (Math.random() - 0.5) * LW * 1.4,
        y: (Math.random() - 0.5) * LH * 1.4,
        z: 0.1 + Math.random() * 0.9,
        size: 1.5 + Math.random() * 3.5,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 2.5,
        shape: Math.floor(Math.random() * 3), // 0: shard, 1: diamond, 2: slab
        col: i % 4 === 0 ? '#38bdf8' : i % 4 === 1 ? '#a855f7' : i % 4 === 2 ? '#64748b' : '#c9a84c'
      });
    }
  }

  if (_transitStreaks.length === 0) {
    for (let i = 0; i < 28; i++) {
      _transitStreaks.push({
        angle: (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
        rad: 30 + Math.random() * 180,
        len: 40 + Math.random() * 80,
        speed: 160 + Math.random() * 220,
        col: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#c084fc' : '#fde68a',
        alpha: 0.3 + Math.random() * 0.5
      });
    }
  }
}

export const PortalTransition = {
  // Authoritative state machine: 'dormant' | 'awakening' | 'entering' | 'transit' | 'arriving'
  state: 'dormant',
  activeContext: PORTAL_CONTEXTS.STANDARD_FLOOR_EXIT,
  awakenAlpha: 0.0,
  awakenPulse: 0.0,
  rippleRadius: 0,
  rippleAlpha: 0,
  floorSwapped: false,
  targetPortalTile: null,
  activePortalCenter: null,
  sourcePlayerPos: { x: 0, y: 0 },
  onLoadFloorCallback: null,
  onCompleteCallback: null,
  onHandoffEndingCallback: null,

  resolveContext(contextOverride = null) {
    if (contextOverride && CONTEXT_PROFILES[contextOverride]) {
      return contextOverride;
    }
    const lv = GameState.LV;
    if (lv === 3) return PORTAL_CONTEXTS.GORGAROTH_DEATH_PORTAL;
    if (lv === 6) return PORTAL_CONTEXTS.MALAKOR_VOID_PORTAL;
    if (lv === 10) return PORTAL_CONTEXTS.ABYSS_WARDEN_ENDING_PORTAL;
    return PORTAL_CONTEXTS.STANDARD_FLOOR_EXIT;
  },

  getProfile(contextOverride = null) {
    let ctxId = contextOverride;
    if (!ctxId) {
      ctxId = this.isTransitionActive() ? (this.activeContext || this.resolveContext()) : this.resolveContext();
    }
    return CONTEXT_PROFILES[ctxId] || CONTEXT_PROFILES[this.resolveContext()] || CONTEXT_PROFILES.STANDARD_FLOOR_EXIT;
  },

  init() {
    initParticlePools();
    this.reset();
  },

  reset() {
    this.state = 'dormant';
    this.activeContext = this.resolveContext();
    this.awakenAlpha = 0;
    this.awakenPulse = 0;
    this.rippleRadius = 0;
    this.rippleAlpha = 0;
    this.floorSwapped = false;
    this.targetPortalTile = null;
    this.activePortalCenter = null;
    this.onLoadFloorCallback = null;
    this.onCompleteCallback = null;
    this.onHandoffEndingCallback = null;
    WARP_ACTIVE = false;
    WARP_TIMER = 0;
    GameState.WARP_ACTIVE = false;
    GameState.WARP_TIMER = 0;
    const P = GameState.P;
    if (P) {
      P.portalScale = 1.0;
      P.portalAlpha = 1.0;
    }
  },

  isTransitionActive() {
    return WARP_ACTIVE || this.state === 'entering' || this.state === 'transit' || this.state === 'arriving';
  },

  isEntering() {
    return this.state === 'entering';
  },

  // Authoritative Transition Initiation
  start(arg1, arg2, arg3) {
    if (this.isTransitionActive()) {
      console.warn('[PORTAL] duplicate transition blocked');
      return;
    }

    initParticlePools();

    let from = GameState.LV;
    let next = from + 1;
    let onLoadFloor = null;
    let onComplete = null;
    let context = null;
    let onHandoffEnding = null;

    if (arg1 && typeof arg1 === 'object') {
      from = arg1.from !== undefined ? arg1.from : GameState.LV;
      next = arg1.next !== undefined ? arg1.next : (from + 1);
      onLoadFloor = arg1.onLoadFloor || null;
      onComplete = arg1.onComplete || null;
      context = arg1.context || null;
      onHandoffEnding = arg1.onHandoffEnding || null;
    } else if (typeof arg2 === 'object' && arg2 !== null) {
      from = (arg1 !== undefined) ? arg1 : GameState.LV;
      next = arg2.next !== undefined ? arg2.next : (from + 1);
      onLoadFloor = arg2.onLoadFloor || null;
      onComplete = arg2.onComplete || null;
      context = arg2.context || null;
      onHandoffEnding = arg2.onHandoffEnding || null;
    } else if (typeof arg3 === 'function') {
      from = (arg1 !== undefined) ? arg1 : GameState.LV;
      next = (arg2 !== undefined) ? arg2 : (from + 1);
      onComplete = arg3;
    } else if (typeof arg3 === 'object' && arg3 !== null) {
      from = (arg1 !== undefined) ? arg1 : GameState.LV;
      next = (arg2 !== undefined) ? arg2 : (from + 1);
      onLoadFloor = arg3.onLoadFloor || null;
      onComplete = arg3.onComplete || null;
      context = arg3.context || null;
      onHandoffEnding = arg3.onHandoffEnding || null;
    } else if (arg2 !== undefined) {
      from = arg1;
      next = arg2;
    } else if (arg1 !== undefined) {
      next = arg1;
    }

    this.activeContext = this.resolveContext(context);
    this.onHandoffEndingCallback = onHandoffEnding;

    // Immediately clear any old lingering cinematic banners
    if (typeof window !== 'undefined' && window.clearCinematicBanner) {
      window.clearCinematicBanner();
    }

    WARP_ACTIVE = true;
    WARP_TIMER = 0;
    WARP_NEXT_LV = next;
    WARP_QUOTE = FLOOR_WARP_QUOTES[Math.min(FLOOR_WARP_QUOTES.length - 1, Math.max(0, from - 1))] || '';

    this.state = 'entering';
    this.floorSwapped = false;
    this.onLoadFloorCallback = onLoadFloor;
    this.onCompleteCallback = onComplete;

    GameState.PORTAL_USED = true;
    GameState.WARP_ACTIVE = true;
    GameState.WARP_TIMER = 0;
    GameState.WARP_QUOTE = WARP_QUOTE;

    const P = GameState.P;
    if (P) {
      this.sourcePlayerPos = { x: P.x, y: P.y };
      P.vx = 0;
      P.vy = 0;
      P.portalScale = 1.0;
      P.portalAlpha = 1.0;
    }

    // Locate active world portal tile for camera tracking
    this.locateActivePortal();

    // Stage 1 Audio: Supernatural deep resonance
    SoundManager.snd('void_swell');

    SaveSystem.saveRun();
    EventBus.emit('warp:started', { fromFloor: from, nextFloor: next, context: this.activeContext });
  },

  locateActivePortal() {
    const map = GameState.MAP;
    if (!map) return;
    const P = GameState.P;
    let closest = null;
    let closestDist = 999999;

    for (let r = 0; r < map.length; r++) {
      if (!map[r]) continue;
      for (let c = 0; c < map[r].length; c++) {
        if (map[r][c] === 2) {
          const d = P ? Math.hypot(P.x - (c + 0.5), P.y - (r + 0.5)) : 0;
          if (d < closestDist) {
            closestDist = d;
            closest = { r, c, x: c * T, y: r * T, cx: (c + 0.5) * T, cy: (r + 0.5) * T };
          }
        }
      }
    }

    if (closest) {
      this.targetPortalTile = closest;
      this.activePortalCenter = { x: closest.cx, y: closest.cy };
    }
  },

  update(dt) {
    this.tick(dt);
  },

  tick(dt) {
    const F = GameState.F || 0;
    const P = GameState.P;
    const cam = GameState.CAM;
    const reduced = !!GameState.REDUCED_MOTION;

    // 1. In-World Proximity Detection (when not in transition)
    if (!WARP_ACTIVE) {
      if (!this.targetPortalTile || F % 30 === 0) {
        this.locateActivePortal();
      }

      if (this.targetPortalTile && P) {
        const portalTileX = (this.targetPortalTile.c + 0.5);
        const portalTileY = (this.targetPortalTile.r + 0.5);
        const dist = Math.hypot(P.x - portalTileX, P.y - portalTileY);

        if (dist <= 3.5) {
          // Gate Awakens: Proximity response
          this.state = 'awakening';
          this.awakenAlpha = Math.min(1.0, this.awakenAlpha + dt * 2.8);
          this.awakenPulse += dt * 4.2;
        } else {
          // Dormant state
          this.state = 'dormant';
          this.awakenAlpha = Math.max(0.0, this.awakenAlpha - dt * 2.0);
          this.awakenPulse += dt * 1.8;
        }
      }
      return;
    }

    // 2. Active Transition Sequence
    WARP_TIMER += dt;
    GameState.WARP_TIMER = WARP_TIMER;

    // --- PHASE 1: ENTERING (0.00s – 0.90s) ---
    if (WARP_TIMER < DUR_ENTERING) {
      this.state = 'entering';
      const enterProg = WARP_TIMER / DUR_ENTERING;
      this.awakenAlpha = 1.0;

      // Stage 2: Portal Responds (0.15s – 0.40s)
      if (WARP_TIMER >= 0.15 && WARP_TIMER < 0.40) {
        const s2Prog = (WARP_TIMER - 0.15) / 0.25;
        this.rippleRadius = 8 + s2Prog * 48;
        this.rippleAlpha = Math.sin(s2Prog * Math.PI) * 0.85;
        if (!this._stage2SoundFired) {
          SoundManager.snd('portal_enter');
          this._stage2SoundFired = true;
        }
      } else if (WARP_TIMER >= 0.40) {
        this.rippleAlpha = Math.max(0, this.rippleAlpha - dt * 4);
      }

      // Stage 3 & 4: Space Collapses & Rowan Drawn Inward (0.35s – 0.85s)
      if (this.targetPortalTile && P) {
        const targetX = this.targetPortalTile.c;
        const targetY = this.targetPortalTile.r;

        // Easing position to exact portal center
        if (WARP_TIMER >= 0.20) {
          const moveProg = Math.min(1.0, (WARP_TIMER - 0.20) / 0.55);
          const ease = moveProg * moveProg * (3 - 2 * moveProg);
          P.x = lerp(this.sourcePlayerPos.x, targetX, ease);
          P.y = lerp(this.sourcePlayerPos.y, targetY, ease);
        }

        // Camera push and zoom toward portal center
        if (cam) {
          cam.tx = this.targetPortalTile.c + 0.5;
          cam.ty = this.targetPortalTile.r + 0.5;
          if (!reduced) {
            const zoomProg = Math.min(1.0, enterProg * 1.2);
            cam.tz = lerp(1.0, 1.35, zoomProg);
          } else {
            cam.tz = 1.0;
          }
        }

        // Stage 4: Rowan drawn down into threshold (0.60s – 0.85s)
        if (WARP_TIMER >= 0.60) {
          const vanishProg = Math.min(1.0, (WARP_TIMER - 0.60) / 0.25);
          P.portalScale = Math.max(0.45, 1.0 - vanishProg * 0.55);
          P.portalAlpha = Math.max(0.0, 1.0 - vanishProg * 1.25);
        }
      }

      // Stage 5: Final pull & reality snap (0.85s – 0.90s)
      if (WARP_TIMER >= 0.85 && !this._stage5SoundFired) {
        SoundManager.snd('shockwave');
        this._stage5SoundFired = true;
      }
    }

    // --- PHASE 2: TRANSIT / TRAVERSING THE ABYSS (0.90s – 1.70s) ---
    else if (WARP_TIMER < DUR_ENTERING + DUR_TRANSIT) {
      this.state = 'transit';
      const transitT = WARP_TIMER - DUR_ENTERING;
      const transitProg = transitT / DUR_TRANSIT;

      // Update cosmic debris drifting through void
      for (let i = 0; i < _transitDebris.length; i++) {
        const d = _transitDebris[i];
        d.rot += d.rotSpd * dt;
        d.z += dt * 0.45;
        if (d.z > 1.2) {
          d.z = 0.1;
          d.x = (Math.random() - 0.5) * LW * 1.4;
          d.y = (Math.random() - 0.5) * LH * 1.4;
        }
      }

      // Midpoint Authoritative Floor Swap (0.40s into transit = 1.30s total)
      if (!this.floorSwapped && transitT >= 0.40) {
        this.floorSwapped = true;

        if (this.onHandoffEndingCallback) {
          this.completeSequence();
          this.onHandoffEndingCallback();
          return;
        } else if (this.onLoadFloorCallback) {
          this.onLoadFloorCallback();
        } else {
          GameState.LV = WARP_NEXT_LV;
          FloorManager.loadLevel(WARP_NEXT_LV);
        }

        // Initialize camera at destination spawn
        if (cam && GameState.P) {
          cam.x = GameState.P.x;
          cam.y = GameState.P.y;
          cam.tx = GameState.P.x;
          cam.ty = GameState.P.y;
          cam.tz = reduced ? 1.0 : 1.25;
        }

        // Reset player visual scale for destination floor
        if (GameState.P) {
          GameState.P.portalScale = 1.0;
          GameState.P.portalAlpha = 1.0;
        }

        // Special handling for Boss Floors (boss intros manage their own lifecycle)
        if (isBossFloor(GameState.LV)) {
          this.completeSequence();
          return;
        }
      }
    }

    // --- PHASE 3: ARRIVING ON NEXT FLOOR (1.70s – 2.30s) ---
    else if (WARP_TIMER < WARP_DUR) {
      this.state = 'arriving';
      const arriveT = WARP_TIMER - (DUR_ENTERING + DUR_TRANSIT);
      const arriveProg = arriveT / DUR_ARRIVING;

      // Smooth camera restoration from 1.25 back to 1.00
      if (cam && GameState.P) {
        cam.tx = GameState.P.x;
        cam.ty = GameState.P.y;
        if (!reduced) {
          cam.tz = lerp(1.25, 1.00, arriveProg);
        } else {
          cam.tz = 1.0;
        }
      }
    }

    // --- TRANSITION COMPLETION ---
    else {
      this.completeSequence();
    }
  },

  completeSequence() {
    this.state = 'complete';
    WARP_ACTIVE = false;
    GameState.WARP_ACTIVE = false;
    this._stage2SoundFired = false;
    this._stage5SoundFired = false;

    const cb = this.onCompleteCallback;
    this.onCompleteCallback = null;
    this.onLoadFloorCallback = null;
    this.onHandoffEndingCallback = null;

    if (cb) {
      cb();
    } else {
      FloorManager.completeTransition();
    }

    EventBus.emit('warp:finished', { floor: GameState.LV });
    this.reset();
  },

  // ─────────────────────────────────────────────────────────────
  // IN-WORLD PORTAL RENDERING (Dais, Gateways & Apertures)
  // Drawn during tilemap rendering underneath characters
  // ─────────────────────────────────────────────────────────────
  drawWorldPortal(ctx, tileX, tileY, tileSize = T, contextOverride = null) {
    const profile = this.getProfile(contextOverride || this.activeContext);
    const cx = tileX + tileSize / 2;
    const cy = tileY + tileSize / 2;
    const F = GameState.F || 0;
    const reduced = !!GameState.REDUCED_MOTION;

    // Cache center for coordinates
    this.activePortalCenter = { x: cx, y: cy };

    ctx.save();

    // Radial floor ripple (Entering Stage 2 shockwave across all profiles)
    if (this.rippleAlpha > 0.02 && this.rippleRadius > 0) {
      ctx.save();
      ctx.strokeStyle = `${profile.rippleColor}${this.rippleAlpha})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(cx, cy, this.rippleRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `${profile.rippleSecondaryColor}${this.rippleAlpha * 0.6})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, this.rippleRadius - 4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Branch to dedicated, genuinely distinct portal architectures
    if (profile.id === 'GORGAROTH_DEATH_PORTAL') {
      this._drawGorgarothForgePortal(ctx, cx, cy, tileSize, profile, F, reduced);
    } else if (profile.id === 'MALAKOR_VOID_PORTAL') {
      this._drawMalakorSpatialTear(ctx, cx, cy, tileSize, profile, F, reduced);
    } else if (profile.id === 'ABYSS_WARDEN_ENDING_PORTAL') {
      this._drawWardenRestoredPortal(ctx, cx, cy, tileSize, profile, F, reduced);
    } else {
      this._drawStandardPortal(ctx, cx, cy, tileSize, profile, F, reduced);
    }

    ctx.restore();
  },

  // ═════════════════════════════════════════════════════════════
  // 1. STANDARD FLOOR EXIT (Floors 1, 2, 4, 5, 7, 8, 9)
  // Stepped Weathered Obsidian Dais, Antique Gold Brackets & Glyphs
  // ═════════════════════════════════════════════════════════════
  _drawStandardPortal(ctx, cx, cy, tileSize, profile, F, reduced) {
    // Ambient illumination
    const ambientR = tileSize * 2.2;
    const glowAlpha = 0.12 + this.awakenAlpha * 0.18 + Math.sin(F * 0.05) * 0.04;
    const floorGlow = ctx.createRadialGradient(cx, cy, tileSize * 0.3, cx, cy, ambientR);
    floorGlow.addColorStop(0, `${profile.ambientColors[0]}${glowAlpha * 0.95})`);
    floorGlow.addColorStop(0.4, `${profile.ambientColors[1]}${glowAlpha * 0.65})`);
    floorGlow.addColorStop(1, 'rgba(3, 5, 15, 0)');
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, ambientR, 0, Math.PI * 2);
    ctx.fill();

    // Stepped Obsidian Dais
    const daisR = tileSize * 0.96;
    ctx.fillStyle = profile.daisFill;
    ctx.beginPath();
    const sides = 8;
    for (let i = 0; i < sides; i++) {
      const ang = (i / sides) * Math.PI * 2 + Math.PI / sides;
      const px = cx + Math.cos(ang) * daisR;
      const py = cy + Math.sin(ang) * daisR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = profile.daisBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Corner brackets
    const bracketDist = daisR * 0.82;
    for (let i = 0; i < 4; i++) {
      const bAng = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bx = cx + Math.cos(bAng) * bracketDist;
      const by = cy + Math.sin(bAng) * bracketDist;

      ctx.fillStyle = profile.bracketBody;
      ctx.fillRect(bx - 3, by - 3, 6, 6);
      ctx.fillStyle = profile.bracketHighlight;
      ctx.fillRect(bx - 2, by - 2, 4, 1);
      ctx.fillStyle = profile.bracketShadow;
      ctx.fillRect(bx - 2, by + 1, 4, 1);
      ctx.fillStyle = profile.bracketRivet;
      ctx.fillRect(bx - 1, by - 1, 2, 2);
    }

    // Carved ancient runes
    const runeR = tileSize * 0.68;
    for (let i = 0; i < 6; i++) {
      const rAng = (i / 6) * Math.PI * 2;
      const rx = cx + Math.cos(rAng) * runeR;
      const ry = cy + Math.sin(rAng) * runeR;

      let rAlpha = 0.35 + Math.sin(F * 0.06 + i * 1.05) * 0.15;
      let rCol = profile.runeDormantCol;

      if (this.state === 'awakening' || this.state === 'entering') {
        const seq = (this.awakenPulse + i * 0.8) % (Math.PI * 2);
        const flare = Math.max(0, Math.sin(seq));
        rAlpha = 0.5 + flare * 0.5;
        rCol = flare > 0.65 ? profile.runeFlareCol : profile.runeActiveCol;
      }

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rAng + Math.PI / 2);
      ctx.strokeStyle = rCol;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = rAlpha;
      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(-3, 3); ctx.lineTo(-1, -3); ctx.lineTo(1, -3); ctx.lineTo(3, 3);
        ctx.moveTo(-2, 0); ctx.lineTo(2, 0);
      } else if (i === 1) {
        ctx.moveTo(0, -3); ctx.lineTo(3, 0); ctx.lineTo(0, 3); ctx.lineTo(-3, 0); ctx.closePath();
        ctx.moveTo(-3, -3); ctx.lineTo(3, 3);
      } else if (i === 2) {
        ctx.moveTo(-3, -2); ctx.lineTo(0, 1); ctx.lineTo(3, -2);
        ctx.moveTo(-3, 1); ctx.lineTo(0, 4); ctx.lineTo(3, 1);
      } else if (i === 3) {
        ctx.moveTo(0, 4); ctx.lineTo(0, -3);
        ctx.moveTo(-3, -1); ctx.lineTo(0, 2); ctx.lineTo(3, -1);
      } else if (i === 4) {
        ctx.moveTo(-2, -3); ctx.lineTo(3, -1); ctx.lineTo(1, 3); ctx.lineTo(-3, 1); ctx.closePath();
      } else {
        ctx.arc(0, 0, 3, -1.2, 2.2);
        ctx.moveTo(0, 0); ctx.lineTo(3, 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Outer segmented teeth ring
    const ringSpeed = (this.state === 'entering' ? 0.08 : (this.state === 'awakening' ? 0.04 : 0.015));
    const ringRot = F * (reduced ? 0.01 : ringSpeed);
    const ringR = tileSize * 0.72;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ringRot);
    ctx.strokeStyle = profile.ringTeethCol;
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 4; i++) {
      const aStart = (i / 4) * Math.PI * 2 + 0.18;
      const aEnd   = aStart + 1.15;
      ctx.beginPath();
      ctx.arc(0, 0, ringR, aStart, aEnd);
      ctx.stroke();
    }
    ctx.restore();

    // Inner deep void aperture
    const apertureR = tileSize * 0.35;
    const voidG = ctx.createRadialGradient(cx, cy, 2, cx, cy, apertureR);
    voidG.addColorStop(0, profile.voidCoreColors[0]);
    voidG.addColorStop(0.5, profile.voidCoreColors[1]);
    voidG.addColorStop(0.85, profile.voidCoreColors[2]);
    voidG.addColorStop(1, profile.voidCoreColors[3]);
    ctx.fillStyle = voidG;
    ctx.beginPath();
    ctx.arc(cx, cy, apertureR, 0, Math.PI * 2);
    ctx.fill();

    // Central pitch black singularity
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, apertureR * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Inward motes
    this._drawInwardMotes(ctx, cx, cy, profile.moteColors, reduced);
  },

  // ═════════════════════════════════════════════════════════════
  // 2. GORGAROTH — THE FORGE-SEAL (Floor 3)
  // Heavy Stepped Rectangular Iron Forge Slab with Molten Seams & Clamps
  // ═════════════════════════════════════════════════════════════
  _drawGorgarothForgePortal(ctx, cx, cy, tileSize, profile, F, reduced) {
    const heat = 0.5 + Math.sin(F * 0.08) * 0.35 + this.awakenAlpha * 0.25;

    // 1. Broad Charcoal Ash Floor Scorching & Magma Heat Radiance
    const scorchGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 42);
    scorchGrad.addColorStop(0, `rgba(234, 88, 12, ${0.16 + this.awakenAlpha * 0.22})`);
    scorchGrad.addColorStop(0.45, 'rgba(45, 20, 10, 0.40)');
    scorchGrad.addColorStop(0.8, 'rgba(20, 10, 5, 0.20)');
    scorchGrad.addColorStop(1, 'rgba(10, 5, 2, 0)');
    ctx.fillStyle = scorchGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 46, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy Stepped Rectangular Iron Forge Base (56 x 42 px with chamfered 45-deg corners)
    ctx.fillStyle = '#141212'; // Blackened charcoal base slag
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 20);
    ctx.lineTo(cx + 24, cy - 20);
    ctx.lineTo(cx + 28, cy - 16);
    ctx.lineTo(cx + 28, cy + 16);
    ctx.lineTo(cx + 24, cy + 20);
    ctx.lineTo(cx - 24, cy + 20);
    ctx.lineTo(cx - 28, cy + 16);
    ctx.lineTo(cx - 28, cy - 16);
    ctx.closePath();
    ctx.fill();

    // Heavy iron rim border
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Offset Forged Iron Plates (Industrial Asymmetric Geometry)
    // Upper Plate (shifted slightly left: 44 x 15 px)
    ctx.fillStyle = '#282422';
    ctx.fillRect(cx - 23, cy - 17, 44, 15);
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 23, cy - 17, 44, 15);

    // Lower Plate (shifted slightly right: 44 x 15 px)
    ctx.fillStyle = '#211d1c';
    ctx.fillRect(cx - 21, cy + 2, 44, 15);
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 21, cy + 2, 44, 15);

    // 4. Molten Weld Seams (Glowing hairlines tracing between the heavy iron plates)
    ctx.save();
    ctx.strokeStyle = `rgba(234, 88, 12, ${0.65 + heat * 0.35})`;
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 1);
    ctx.lineTo(cx + 22, cy - 1); // Main horizontal weld
    ctx.moveTo(cx - 14, cy - 17);
    ctx.lineTo(cx - 14, cy + 17); // Left vertical weld
    ctx.moveTo(cx + 14, cy - 17);
    ctx.lineTo(cx + 14, cy + 17); // Right vertical weld
    ctx.stroke();

    // White-hot core highlight in weld center
    ctx.strokeStyle = `rgba(254, 240, 138, ${0.80 + heat * 0.20})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 1);
    ctx.lineTo(cx + 20, cy - 1);
    ctx.stroke();
    ctx.restore();

    // 5. Four Massive Cardinal Forged Industrial Clamps
    const clamps = [
      { x: cx - 6, y: cy - 23, w: 12, h: 6, rvx: cx, rvy: cy - 20 },
      { x: cx - 6, y: cy + 17, w: 12, h: 6, rvx: cx, rvy: cy + 20 },
      { x: cx - 30, y: cy - 6, w: 6, h: 12, rvx: cx - 27, rvy: cy },
      { x: cx + 24, y: cy - 6, w: 6, h: 12, rvx: cx + 27, rvy: cy }
    ];
    clamps.forEach(cl => {
      ctx.fillStyle = '#44403c';
      ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1;
      ctx.strokeRect(cl.x, cl.y, cl.w, cl.h);

      // Heated molten rivet
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cl.rvx - 1, cl.rvy - 1, 3, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cl.rvx, cl.rvy, 1, 1);
    });

    // Heavy plate corner bolts
    const cornerBolts = [
      [cx - 19, cy - 13], [cx + 18, cy - 13],
      [cx - 18, cy + 13], [cx + 19, cy + 13]
    ];
    cornerBolts.forEach(([bx, by]) => {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(bx - 1.5, by - 1.5, 3, 3);
      ctx.fillStyle = '#78716c';
      ctx.fillRect(bx - 1, by - 1, 2, 2);
    });

    // 6. The Forge Well (The Aperture: Heavy rectangular/anvil forge well)
    const wellW = 26;
    const wellH = 18;
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(cx - wellW / 2, cy - wellH / 2, wellW, wellH);

    // Deep burning magma pit gradient
    const pitG = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
    pitG.addColorStop(0, '#000000');
    pitG.addColorStop(0.35, '#1c0702');
    pitG.addColorStop(0.75, '#7c2d12');
    pitG.addColorStop(1, 'rgba(234, 88, 12, 0.75)');
    ctx.fillStyle = pitG;
    ctx.fillRect(cx - wellW / 2 + 1, cy - wellH / 2 + 1, wellW - 2, wellH - 2);

    // 7. Mechanical Sliding Iron Locking Teeth (Linear mechanical clamping, not spinning!)
    const lockOffset = Math.sin(F * (reduced ? 0.02 : 0.06)) * 1.5;
    ctx.fillStyle = '#292524';
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 1;
    // North tooth
    ctx.fillRect(cx - 5, cy - wellH / 2 - 1 + lockOffset, 10, 3);
    ctx.strokeRect(cx - 5, cy - wellH / 2 - 1 + lockOffset, 10, 3);
    // South tooth
    ctx.fillRect(cx - 5, cy + wellH / 2 - 2 - lockOffset, 10, 3);
    ctx.strokeRect(cx - 5, cy + wellH / 2 - 2 - lockOffset, 10, 3);
    // West tooth
    ctx.fillRect(cx - wellW / 2 - 1 + lockOffset, cy - 4, 3, 8);
    ctx.strokeRect(cx - wellW / 2 - 1 + lockOffset, cy - 4, 3, 8);
    // East tooth
    ctx.fillRect(cx + wellW / 2 - 2 - lockOffset, cy - 4, 3, 8);
    ctx.strokeRect(cx + wellW / 2 - 2 - lockOffset, cy - 4, 3, 8);

    // 8. Slag Cinders & Embers Swirling Inward
    const cinders = [
      { a: 0.2, d: 24, s: 2.2, col: '#f59e0b' },
      { a: 1.1, d: 18, s: 1.8, col: '#ea580c' },
      { a: 2.4, d: 22, s: 2.5, col: '#fef08a' },
      { a: 3.6, d: 16, s: 1.6, col: '#f97316' },
      { a: 4.8, d: 26, s: 2.0, col: '#ea580c' },
      { a: 5.5, d: 20, s: 2.8, col: '#fef08a' }
    ];
    cinders.forEach((c, idx) => {
      const curA = c.a + F * 0.025;
      const curD = c.d * (1.0 - ((F * 0.015 * c.s + idx * 0.16) % 1.0));
      const mx = cx + Math.cos(curA) * curD;
      const my = cy + Math.sin(curA) * curD * 0.7;
      ctx.fillStyle = c.col;
      ctx.globalAlpha = 0.6 + Math.sin(F * 0.1 + idx) * 0.3;
      ctx.fillRect(Math.floor(mx), Math.floor(my), 2, 2);
    });
    ctx.globalAlpha = 1.0;
  },

  // ═════════════════════════════════════════════════════════════
  // 3. MALAKOR — THE CONTROLLED SPATIAL TEAR (Floor 6)
  // Distinct Vertical Diamond Void Rift, Asymmetrical Obsidian Calipers,
  // Converging Floor-Grid Distortions & Cyan-Violet Reality Fissures
  // ═════════════════════════════════════════════════════════════
  _drawMalakorSpatialTear(ctx, cx, cy, tileSize, profile, F, reduced) {
    // 1. Local Floor-Grid Distortions Converging Toward Opening
    ctx.save();
    ctx.lineWidth = 1.0;
    const gridAlpha = 0.28 + Math.sin(F * 0.04) * 0.08;
    ctx.strokeStyle = `rgba(168, 85, 247, ${gridAlpha})`;

    // 6 warped grid lines pulled into the tear center
    // Horizontal lines warping inward
    [-24, 0, 24].forEach(dy => {
      ctx.beginPath();
      ctx.moveTo(cx - 38, cy + dy);
      ctx.quadraticCurveTo(cx - 16, cy + dy * 0.35, cx - 11, cy + dy * 0.15);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 38, cy + dy);
      ctx.quadraticCurveTo(cx + 16, cy + dy * 0.35, cx + 11, cy + dy * 0.15);
      ctx.stroke();
    });

    // Vertical lines warping inward
    [-28, 28].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(cx + dx, cy - 36);
      ctx.quadraticCurveTo(cx + dx * 0.35, cy - 14, cx + dx * 0.15, cy - 9);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + dx, cy + 36);
      ctx.quadraticCurveTo(cx + dx * 0.35, cy + 14, cx + dx * 0.15, cy + 9);
      ctx.stroke();
    });

    // Cyan grid coordinate node markers
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    [[-28, -20], [28, -20], [-28, 20], [28, 20], [-34, 0], [34, 0]].forEach(pt => {
      ctx.fillRect(cx + pt[0] - 1, cy + pt[1] - 1, 2, 2);
    });
    ctx.restore();

    // 2. Spatial Distortion Field (Vertically Oriented Tear Radiance)
    const riftPulse = Math.sin(F * 0.06) * 0.08 + 0.22;
    const voidGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 38);
    voidGlow.addColorStop(0, `rgba(168, 85, 247, ${riftPulse * 1.2})`);
    voidGlow.addColorStop(0.40, 'rgba(59, 7, 100, 0.32)');
    voidGlow.addColorStop(0.75, 'rgba(15, 23, 42, 0.14)');
    voidGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = voidGlow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 46, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Four Asymmetrical Obsidian Caliper Plates (Deliberately Holding Space Open)
    const plateShift = reduced ? 0 : Math.sin(F * 0.025) * 1.2;
    const plates = [
      // Plate 1: North-West Caliper (Gripping top-left rift lip)
      {
        ox: -8 + plateShift,
        oy: -12 - plateShift * 0.5,
        pts: [[-14, -14], [4, -16], [0, 2], [-18, 4]],
        fill: '#0d061a', stroke: '#581c87', hi: '#38bdf8'
      },
      // Plate 2: North-East Caliper (Offset higher, displaced right)
      {
        ox: 9 - plateShift,
        oy: -9 + plateShift * 0.6,
        pts: [[-2, -18], [16, -12], [10, 2], [-6, -2]],
        fill: '#15092a', stroke: '#6b21a8', hi: '#c084fc'
      },
      // Plate 3: South-East Caliper (Lower plate offset downward)
      {
        ox: 8 + plateShift * 0.7,
        oy: 12 + plateShift * 0.4,
        pts: [[-4, 0], [18, -2], [12, 16], [-10, 14]],
        fill: '#0a0416', stroke: '#4c1d95', hi: '#38bdf8'
      },
      // Plate 4: South-West Caliper (Undercut support bracket)
      {
        ox: -10 - plateShift * 0.8,
        oy: 10 - plateShift * 0.5,
        pts: [[-16, 2], [2, 4], [-2, 18], [-18, 14]],
        fill: '#120724', stroke: '#6d28d9', hi: '#c084fc'
      }
    ];

    plates.forEach(p => {
      ctx.save();
      ctx.translate(cx + p.ox, cy + p.oy);
      ctx.fillStyle = p.fill;
      ctx.beginPath();
      p.pts.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
      });
      ctx.closePath();
      ctx.fill();

      // Sharp crystalline bevel edges
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Specular cyan/violet highlight on lead grip edge
      ctx.strokeStyle = p.hi;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(p.pts[0][0], p.pts[0][1]);
      ctx.lineTo(p.pts[1][0], p.pts[1][1]);
      ctx.stroke();
      ctx.restore();
    });

    // 4. Sharp Spatial Fissures in the Caliper Gaps (Cyan & Violet Lightning Cracks)
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.1;
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 6);
    ctx.lineTo(cx - 5, cy - 1);
    ctx.lineTo(cx + 4, cy - 8);
    ctx.lineTo(cx + 15, cy - 2);
    ctx.moveTo(cx - 3, cy - 18);
    ctx.lineTo(cx + 2, cy + 2);
    ctx.lineTo(cx - 5, cy + 18);
    ctx.stroke();

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 0.9;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 10);
    ctx.lineTo(cx - 2, cy - 2);
    ctx.lineTo(cx + 14, cy + 4);
    ctx.stroke();
    ctx.restore();

    // 5. Substantially More Readable Central Void Aperture (Controlled Vertical Diamond Tear)
    // Tear dimensions: 26px width x 44px height (distinct vertical rhomboid silhouette)
    const tearH = 22;
    const tearW = 13;
    ctx.save();

    // Outer aperture boundary
    ctx.beginPath();
    ctx.moveTo(cx, cy - tearH);
    ctx.lineTo(cx + tearW, cy);
    ctx.lineTo(cx, cy + tearH);
    ctx.lineTo(cx - tearW, cy);
    ctx.closePath();

    const riftGrad = ctx.createLinearGradient(cx - tearW, cy - tearH, cx + tearW, cy + tearH);
    riftGrad.addColorStop(0, '#090117');
    riftGrad.addColorStop(0.3, '#020008');
    riftGrad.addColorStop(0.7, '#020008');
    riftGrad.addColorStop(1, '#1b0736');
    ctx.fillStyle = riftGrad;
    ctx.fill();

    // Dual-tone edge borders (Cyan left, Violet right)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - tearH);
    ctx.lineTo(cx - tearW, cy);
    ctx.lineTo(cx, cy + tearH);
    ctx.stroke();

    ctx.strokeStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(cx, cy - tearH);
    ctx.lineTo(cx + tearW, cy);
    ctx.lineTo(cx, cy + tearH);
    ctx.stroke();

    // Inner pure-black singularity diamond
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(cx, cy - tearH * 0.65);
    ctx.lineTo(cx + tearW * 0.60, cy);
    ctx.lineTo(cx, cy + tearH * 0.65);
    ctx.lineTo(cx - tearW * 0.60, cy);
    ctx.closePath();
    ctx.fill();

    // Horizontal spatial coordinate slice lines inside the aperture
    ctx.lineWidth = 1.0;
    [-9, 0, 9].forEach((dy, idx) => {
      const spanW = tearW * (1.0 - Math.abs(dy) / (tearH * 1.1)) * 0.75;
      ctx.strokeStyle = idx % 2 === 0 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(192, 132, 252, 0.85)';
      ctx.beginPath();
      ctx.moveTo(cx - spanW, cy + dy);
      ctx.lineTo(cx + spanW, cy + dy);
      ctx.stroke();
    });
    ctx.restore();

    // 6. Carefully Arranged Non-Euclidean Shards (Intentional Orbiting Caliper Fragments)
    const shards = [
      { radX: 19, radY: 26, spd: 0.035, size: 3.5, col: '#1e0836', edge: '#38bdf8' },
      { radX: 25, radY: 30, spd: -0.030, size: 4.5, col: '#130924', edge: '#c084fc' },
      { radX: 22, radY: 24, spd: 0.040, size: 3.0, col: '#2e1065', edge: '#a855f7' },
      { radX: 27, radY: 34, spd: -0.025, size: 4.0, col: '#170b2c', edge: '#38bdf8' }
    ];

    shards.forEach((sh, idx) => {
      const sAng = (idx / 4) * Math.PI * 2 + F * (reduced ? 0.008 : sh.spd);
      const sx = cx + Math.cos(sAng) * sh.radX;
      const sy = cy + Math.sin(sAng) * sh.radY;

      // Void shadow underneath
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.fillRect(sx - 1, sy + 3, sh.size, sh.size * 0.6);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(sAng + idx);
      ctx.fillStyle = sh.col;
      ctx.beginPath();
      ctx.moveTo(-sh.size, -sh.size * 0.6);
      ctx.lineTo(sh.size * 0.8, -sh.size * 0.2);
      ctx.lineTo(sh.size * 0.4, sh.size * 0.8);
      ctx.lineTo(-sh.size * 0.6, sh.size * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = sh.edge;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });

    // 7. Inward Particle Flow (Cyan & Violet Motes)
    this._drawInwardMotes(ctx, cx, cy, ['#a855f7', '#38bdf8', '#c084fc'], reduced);
  },

  _drawMalakorVoidPortal(ctx, cx, cy, tileSize, profile, F, reduced) {
    this._drawMalakorSpatialTear(ctx, cx, cy, tileSize, profile, F, reduced);
  },

  // ═════════════════════════════════════════════════════════════
  // 4. THE ABYSS WARDEN — RESTORED LIVING COSMIC PORTAL (Floor 10)
  // Exact Approved Living Portal Geometry + Atmospheric Intensification
  // ═════════════════════════════════════════════════════════════
  _drawWardenRestoredPortal(ctx, cx, cy, tileSize, profile, F, reduced) {
    // Exact original radius calculation with controlled breathing pulse
    const baseR = tileSize * 0.95;
    const pulse = Math.sin(F * 0.07) * 1.5;
    const pr = Math.max(3, baseR + pulse);
    const swirl = F * (reduced ? 0.01 : 0.035);

    ctx.save();

    // 1. Atmospheric Ruby Radiance (Restrained deep ruby glow on the floor)
    const rubyPulse = 0.22 + Math.sin(F * 0.05) * 0.06 + this.awakenAlpha * 0.15;
    const floorGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, pr * 1.9);
    floorGlow.addColorStop(0, `rgba(220, 38, 38, ${rubyPulse * 1.1})`);
    floorGlow.addColorStop(0.45, 'rgba(127, 29, 29, 0.28)');
    floorGlow.addColorStop(0.8, 'rgba(30, 4, 10, 0.15)');
    floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, pr * 1.9, pr * 1.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Central Event Horizon (Deep Pitch Black with Layered Ruby / Crimson Accretion Rim)
    const voidGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, pr);
    voidGrad.addColorStop(0, '#010004'); // Deep pitch-black core
    voidGrad.addColorStop(0.45, '#0a0106');
    voidGrad.addColorStop(0.70, '#2b030e');
    voidGrad.addColorStop(0.88, '#7f1d1d');
    voidGrad.addColorStop(0.96, '#dc2626');
    voidGrad.addColorStop(1.0, '#ef4444');

    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, pr, 0, Math.PI * 2);
    ctx.fill();

    // 3. Fine Pixel-Art Distortion Rings close to the opening
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(cx, cy, pr * 0.88, swirl * 0.8, swirl * 0.8 + Math.PI * 1.4);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(254, 205, 211, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, pr * 0.78, -swirl * 0.9, -swirl * 0.9 + Math.PI * 1.1);
    ctx.stroke();

    // 4. Rotating Outer Accretion Ribbon (Restored Exact Original Formula)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, pr * 0.95, swirl, swirl + 4.8);
    ctx.stroke();

    // 5. Counter-Rotating Inner Energy Ribbon (Restored Exact Original Formula)
    ctx.strokeStyle = '#fecdd3';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, pr * 0.65, -swirl * 1.3, -swirl * 1.3 + 4.2);
    ctx.stroke();

    // 6. Core Singularity Center Sparkle (Restored Exact Original Formula)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fda4af';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5 + Math.sin(F * 0.1) * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 7. Small Inward-Moving Crimson & Gold Fragments / Motes
    this._drawInwardMotes(ctx, cx, cy, ['#dc2626', '#f43f5e', '#fde047', '#991b1b'], reduced);

    ctx.restore();
  },

  _drawWardenCathedralPortal(ctx, cx, cy, tileSize, profile, F, reduced) {
    this._drawWardenRestoredPortal(ctx, cx, cy, tileSize, profile, F, reduced);
  },

  _drawInwardMotes(ctx, cx, cy, moteColors = ['#38bdf8', '#c084fc', '#fde68a'], reduced = false) {
    const F = GameState.F || 0;
    const moteCount = reduced ? 8 : (this.state === 'entering' ? 24 : 14);
    for (let i = 0; i < moteCount; i++) {
      const m = _portalMotes[i % _portalMotes.length];
      if (!m) continue;

      const currentAng = m.angle + F * (0.015 * m.speed);
      const spiralDist = m.baseDist * (1.0 - ((F * 0.01 * m.speed + i * 0.12) % 1.0));
      const mx = cx + Math.cos(currentAng) * spiralDist;
      const my = cy + Math.sin(currentAng) * spiralDist;

      const mAlpha = clamp(m.alpha * (spiralDist / m.baseDist) * (0.5 + this.awakenAlpha * 0.5), 0, 1);
      ctx.fillStyle = moteColors[i % moteColors.length];
      ctx.globalAlpha = mAlpha;
      ctx.fillRect(Math.floor(mx), Math.floor(my), m.size, m.size);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // IN-WORLD FOREGROUND ENTITY (Floating Shards & Depth Occlusion)
  // Drawn right above Rowan in world space
  // ─────────────────────────────────────────────────────────────
  drawWorldForeground(ctx, contextOverride = null) {
    if (!this.activePortalCenter) return;
    const profile = this.getProfile(contextOverride || this.activeContext);
    const { x: cx, y: cy } = this.activePortalCenter;
    const F = GameState.F || 0;
    const P = GameState.P;
    if (!P) return;

    const maxDist = T * 2.5;
    const distToPortal = Math.hypot((P.x + 0.5) * T - cx, (P.y + 0.5) * T - cy);
    if (distToPortal > maxDist && this.state !== 'entering') return;

    ctx.save();

    if (profile.id === 'GORGAROTH_DEATH_PORTAL') {
      // Gorgaroth Foreground: heavy lower clamp and rising heat sparks passing over Rowan's boots
      ctx.fillStyle = '#44403c';
      ctx.fillRect(cx - 6, cy + 17, 12, 6);
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 6, cy + 17, 12, 6);

      // Molten cinder sparks drifting in front of Rowan
      for (let i = 0; i < 4; i++) {
        const mx = cx - 12 + ((F * 0.8 + i * 14) % 24);
        const my = cy + 14 - ((F * 0.9 + i * 11) % 28);
        ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#fef08a';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(Math.floor(mx), Math.floor(my), 2, 2);
      }
    } else if (profile.id === 'MALAKOR_VOID_PORTAL') {
      // Malakor Foreground: 2 floating geometric shards drifting across Rowan with cyan specular edges
      const fSpeed = (this.state === 'entering' ? 0.06 : 0.02);
      for (let i = 0; i < 2; i++) {
        const ang = (i / 2) * Math.PI * 2 + F * fSpeed;
        const r = T * 0.55;
        const fx = cx + Math.cos(ang) * r;
        const fy = cy + Math.sin(ang) * (r * 0.7);

        ctx.fillStyle = '#170b2c';
        ctx.fillRect(fx - 2, fy - 2, 5, 4);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(fx - 2, fy - 2, 5, 4);
      }
    } else if (profile.id === 'ABYSS_WARDEN_ENDING_PORTAL') {
      // Restored Warden Living Portal Foreground: subtle drifting ruby embers and event horizon blend
      for (let i = 0; i < 4; i++) {
        const mx = cx - 14 + ((F * 0.7 + i * 12) % 28);
        const my = cy + 12 - ((F * 0.8 + i * 9) % 26);
        ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#fde047';
        ctx.globalAlpha = 0.65;
        ctx.fillRect(Math.floor(mx), Math.floor(my), 2, 2);
      }

      // Smooth event horizon blend as Rowan crosses into aperture
      if (this.state === 'entering' && WARP_TIMER >= 0.55) {
        const maskProg = (WARP_TIMER - 0.55) / 0.30;
        ctx.fillStyle = `rgba(1, 0, 4, ${Math.min(1.0, maskProg * 1.2)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Standard Foreground: 3 floating obsidian shards
      const fSpeed = (this.state === 'entering' ? 0.06 : 0.02);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(F * fSpeed);

      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 + 0.8;
        const r = T * 0.48;
        const fx = Math.cos(ang) * r;
        const fy = Math.sin(ang) * r;

        ctx.fillStyle = profile.foregroundShardCol;
        ctx.fillRect(fx - 2, fy - 2, 5, 4);
        ctx.strokeStyle = profile.foregroundShardEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(fx - 2, fy - 2, 5, 4);
      }
      ctx.restore();

      // Standard central depth mask
      if (this.state === 'entering' && WARP_TIMER >= 0.60) {
        const maskProg = (WARP_TIMER - 0.60) / 0.25;
        const maskR = T * 0.32 * Math.min(1.0, maskProg * 1.2);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(cx, cy, maskR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // SCREEN-SPACE CINEMATIC TRANSITION (Traversal, Quote & Iris)
  // Drawn after world rendering in screen coordinates
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!WARP_ACTIVE) return;
    const profile = this.getProfile(this.activeContext);
    const reduced = !!GameState.REDUCED_MOTION;
    const cx = LW / 2;
    const cy = LH / 2;

    ctx.save();

    // =========================================================
    // STAGE 5: FINAL INWARD CONTRACTION (Entering 0.85s – 0.90s)
    // =========================================================
    if (this.state === 'entering' && WARP_TIMER >= 0.80) {
      const snapProg = Math.min(1.0, (WARP_TIMER - 0.80) / 0.10);
      const snapAlpha = snapProg * 1.0;
      ctx.fillStyle = `rgba(0, 0, 0, ${snapAlpha})`;
      ctx.fillRect(0, 0, LW, LH);
      ctx.restore();
      return;
    }

    // =========================================================
    // TRAVERSING THE ABYSS (Transit 0.90s – 1.70s)
    // =========================================================
    if (this.state === 'transit') {
      const transitT = WARP_TIMER - DUR_ENTERING;
      const transitProg = transitT / DUR_TRANSIT;

      // 1. Deep dimensional cosmic backdrop
      ctx.fillStyle = '#02040c';
      ctx.fillRect(0, 0, LW, LH);

      // Dynamic nebulae themed to profile
      const nebG = ctx.createRadialGradient(cx, cy, 10, cx, cy, LW * 0.65);
      nebG.addColorStop(0, `${profile.ambientColors[0]}0.16)`);
      nebG.addColorStop(0.35, `${profile.ambientColors[1]}0.18)`);
      nebG.addColorStop(0.7, 'rgba(15, 23, 42, 0.5)');
      nebG.addColorStop(1, 'rgba(2, 4, 12, 0)');
      ctx.fillStyle = nebG;
      ctx.fillRect(0, 0, LW, LH);

      // 2. Cosmic Void Streaks
      ctx.lineWidth = 1.6;
      for (let i = 0; i < _transitStreaks.length; i++) {
        const s = _transitStreaks[i];
        const spd = reduced ? 80 : s.speed;
        const currentR = (s.rad + transitProg * spd) % (LW * 0.55);
        const x1 = cx + Math.cos(s.angle) * currentR;
        const y1 = cy + Math.sin(s.angle) * currentR;
        const x2 = cx + Math.cos(s.angle) * (currentR + s.len * 0.6);
        const y2 = cy + Math.sin(s.angle) * (currentR + s.len * 0.6);

        const strkG = ctx.createLinearGradient(x1, y1, x2, y2);
        strkG.addColorStop(0, 'rgba(0,0,0,0)');
        strkG.addColorStop(0.6, s.col);
        strkG.addColorStop(1, 'rgba(255,255,255,0.75)');

        ctx.strokeStyle = strkG;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 3. Tumbling Broken Slabs & Geometric Monoliths
      for (let i = 0; i < _transitDebris.length; i++) {
        const d = _transitDebris[i];
        const scale = d.z * 1.5;
        const dx = cx + d.x * (1.0 + transitProg * 0.4);
        const dy = cy + d.y * (1.0 + transitProg * 0.4);

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(d.rot);
        ctx.scale(scale, scale);

        ctx.fillStyle = d.col;
        ctx.globalAlpha = clamp(d.z * 0.85, 0.2, 0.9);

        if (d.shape === 0) { // Shard
          ctx.beginPath();
          ctx.moveTo(-4, -8); ctx.lineTo(6, -2); ctx.lineTo(2, 8); ctx.lineTo(-6, 2);
          ctx.closePath();
          ctx.fill();
        } else if (d.shape === 1) { // Diamond
          ctx.beginPath();
          ctx.moveTo(0, -7); ctx.lineTo(5, 0); ctx.lineTo(0, 7); ctx.lineTo(-5, 0);
          ctx.closePath();
          ctx.fill();
        } else { // Stepped slab
          ctx.fillRect(-6, -4, 12, 8);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(-6, -4, 12, 8);
        }
        ctx.restore();
      }

      // 4. Distant Destination Aperture Emerging
      const destR = 18 + transitProg * 48;
      const destG = ctx.createRadialGradient(cx, cy, 2, cx, cy, destR);
      destG.addColorStop(0, profile.destApertureColors[0]);
      destG.addColorStop(0.3, profile.destApertureColors[1]);
      destG.addColorStop(0.7, profile.destApertureColors[2]);
      destG.addColorStop(1, profile.destApertureColors[3]);
      ctx.fillStyle = destG;
      ctx.beginPath();
      ctx.arc(cx, cy, destR, 0, Math.PI * 2);
      ctx.fill();

      // 5. Narrative Quote Letterbox Banner
      const quoteAlpha = Math.sin(transitProg * Math.PI);
      if (quoteAlpha > 0.08 && WARP_QUOTE) {
        ctx.save();
        ctx.globalAlpha = quoteAlpha;

        const barH = 52 * quoteAlpha;
        ctx.fillStyle = profile.quoteLetterboxColor;
        ctx.fillRect(0, 0, LW, barH);
        ctx.fillRect(0, LH - barH, LW, barH);

        // Filigree edge borders
        ctx.strokeStyle = profile.quoteFiligreeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(LW * 0.12, barH); ctx.lineTo(LW * 0.88, barH);
        ctx.moveTo(LW * 0.12, LH - barH); ctx.lineTo(LW * 0.88, LH - barH);
        ctx.stroke();

        // Title and inner monologue text
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 12px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = profile.quoteFiligreeColor;
        ctx.shadowBlur = 8;
        ctx.fillText(profile.quoteTitle, LW / 2, cy - 36);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'italic 15px Crimson Text, serif';
        ctx.fillText('“' + WARP_QUOTE + '”', LW / 2, cy + 32);
        ctx.restore();
      }
    }

    // =========================================================
    // ARRIVAL ON NEXT FLOOR (Arriving 1.70s – 2.30s)
    // Darkness parts via an expanding circular abyssal aperture
    // =========================================================
    else if (this.state === 'arriving') {
      const arriveT = WARP_TIMER - (DUR_ENTERING + DUR_TRANSIT);
      const arriveProg = arriveT / DUR_ARRIVING;

      // Expanding circular aperture iris revealing the real destination floor
      const maxIrisR = Math.hypot(LW, LH) * 0.8;
      const irisR = arriveProg * maxIrisR;

      ctx.save();
      ctx.fillStyle = '#02040c';

      // Draw invert mask: fill outside the circle with darkness
      ctx.beginPath();
      ctx.rect(0, 0, LW, LH);
      ctx.arc(cx, cy, irisR, 0, Math.PI * 2, true);
      ctx.fill();

      // Glowing luminous iris boundary ring
      if (irisR < maxIrisR * 0.95) {
        ctx.strokeStyle = profile.destIrisRing1;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = profile.destIrisRing2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, irisR - 5), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }
};

export const startCosmicHyperWarp = (nextLv) => PortalTransition.start(nextLv);
export const tickCosmicHyperWarp = (dt) => PortalTransition.tick(dt);
export const drawCosmicHyperWarp = (ctx) => PortalTransition.draw(ctx);

if (typeof window !== 'undefined') {
  window.PortalTransition = PortalTransition;
  window.startCosmicHyperWarp = startCosmicHyperWarp;
  window.tickCosmicHyperWarp = tickCosmicHyperWarp;
  window.drawCosmicHyperWarp = drawCosmicHyperWarp;
  Object.defineProperty(window, 'WARP_ACTIVE', {
    get: () => WARP_ACTIVE,
    set: (v) => { WARP_ACTIVE = v; },
    configurable: true
  });
  Object.defineProperty(window, 'WARP_TIMER', {
    get: () => WARP_TIMER,
    set: (v) => { WARP_TIMER = v; },
    configurable: true
  });
}
