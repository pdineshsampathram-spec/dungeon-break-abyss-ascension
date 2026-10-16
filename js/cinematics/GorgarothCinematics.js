// =====================================================================
//  DUNGEON BREAK — js/cinematics/GorgarothCinematics.js
//  Authoritative Master Pipeline for Floor 3 Mini-Boss:
//  - Part 1: Epic Gorgaroth Defeat Cinematic
//  - Part 2 & 3: Single Portal System & Seamless World-Space Transition
//  - Part 4 & 5: Epic Gorgaroth Victory-Over-Player Death Cinematic
//  - Part 6: State Architecture & Zero Duplicate Portals
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T, COLS, ROWS, easeInOut } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { EventBus } from '../core/EventBus.js';
import { FloorManager } from '../world/FloorManager.js';
import { DeathCinematics } from './DeathCinematics.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { PortalTransition, PORTAL_CONTEXTS } from './PortalTransition.js';

// ─────────────────────────────────────────────────────────────
// Timeline Durations (Seconds)
// ─────────────────────────────────────────────────────────────
export const GORGAROTH_DEFEAT_TIMELINE = {
  HIT_STOP: 0.15,            // 0.00 – 0.15s: Micro hit-stop freeze & lethal sparks
  IMPACT_JERK: 0.50,         // 0.15 – 0.50s: Body jerks back, stance breaks, weapon wobbles, foot dust
  STAGGER_RESIST: 2.40,      // 0.50 – 2.40s: Staggers back, weapon drags, knee dips, colossal heave upright, pause
  FINAL_DEFIANCE: 3.20,      // 2.40 – 3.20s: Head raises toward Rowan, visor ember shifts from defiance to defeat
  WEAPON_DROP: 4.00,         // 3.20 – 4.00s: Grip lost, weapon tilts, falls, heavy clang on floor at 3.55s, dust burst
  KNEEL_BEAT: 4.80,          // 4.00 – 4.80s: Slowly sinks to one knee at 4.40s, motionless stillness hold
  FINAL_COLLAPSE: 5.50,      // 4.80 – 5.50s: Head lowers, shoulders drop, body slumps forward smoothly onto stones
  HOLD_DEAD_BODY: 7.20,      // 5.50 – 7.20s: Colossal ground impact at 5.50s, floor dust wave, dead body held for 1.7s
  DISSOLUTION: 10.20,        // 7.20 – 10.20s: Progressive dissolution - legs -> torso -> armor/weapon into ancient motes
  HOLD_EMPTY: 11.80,         // 10.20 – 11.80s: Final remnant motes disperse, empty arena silence (1.6s)
  PORTAL_FORMING: 14.00,     // 11.80 – 14.00s: Energy motes gather, core opens, rings form & stabilize (UNTOUCHED)
  ROWAN_APPROACH: 16.50,     // 14.00 – 16.50s: Rowan deliberate walk, portal reacts & wraps, camera pushes (UNTOUCHED)
  TRANSITION_COMPLETE: 17.50 // 16.50 – 17.50s: Energy engulfs frame, seamless handoff to Floor 4 (UNTOUCHED)
};

export const GORGAROTH_PLAYER_DEATH_TIMELINE = {
  HIT_STOP: 0.12,          // 0.00 – 0.12s: Crushing blow freeze
  RECOIL_STAGGER: 1.00,    // 0.12 – 1.00s: Heavy impact, weapon lowers/drops, Rowan staggers backwards
  FALL_PRONE: 3.00,        // 1.00 – 3.00s: Rowan collapses prone onto stone floor, camera lowers
  HOLD_COMPOSITION: 5.50,  // 3.00 – 5.50s: Final shot: Rowan on ground with Gorgaroth looming imposing above
  FADE_TO_BLACK: 7.50,     // 5.50 – 7.50s: Atmospheric fade to pure black, silence
  HANDOFF: 7.50            // 7.50s: Enter existing death results card
};

// ─────────────────────────────────────────────────────────────
// Portal Lifecycle States
// ─────────────────────────────────────────────────────────────
export const PORTAL_LIFECYCLE = {
  NOT_CREATED: 'NOT_CREATED',
  CREATING: 'CREATING',
  ACTIVE: 'ACTIVE',
  ROWAN_ENTERING: 'ROWAN_ENTERING',
  TRANSITIONING: 'TRANSITIONING',
  CLEANUP: 'CLEANUP'
};

// ─────────────────────────────────────────────────────────────
// Module Singletons & Guards
// ─────────────────────────────────────────────────────────────
let _defeatTriggered = false;
let _defeatCompleted = false;
let _playerDeathTriggered = false;
let _activeDefeat = null;
let _activePlayerDeath = null;

// Letterbox state
const LETTERBOX = {
  amount: 0,
  target: 1.0,
  maxHeight: 46
};

// Transient particles for defeat & portal
let COMBAT_SPARKS = [];
let DISSOLUTION_MOTES = [];
let PORTAL_INWARD_PARTICLES = [];
let ARENA_DUST_MOTES = [];

// ─────────────────────────────────────────────────────────────
// MASTER GORGAROTH CINEMATICS CONTROLLER
// ─────────────────────────────────────────────────────────────
export const GorgarothCinematics = {
  isActive() {
    return !!_activeDefeat || !!_activePlayerDeath;
  },
  isDefeatActive() {
    return !!_activeDefeat;
  },
  isPlayerDeathActive() {
    return !!_activePlayerDeath;
  },
  isDefeated() {
    return _defeatCompleted;
  },
  getPortal() {
    return _activeDefeat ? _activeDefeat.portal : null;
  },
  getActiveDefeat() {
    return _activeDefeat;
  },
  getActivePlayerDeath() {
    return _activePlayerDeath;
  },
  canSkip() {
    return !!_activeDefeat && (_activeDefeat.timer >= 0.25 || !_activeDefeat.hitStopActive);
  },
  skip() {
    if (!this.canSkip()) return;
    const cine = _activeDefeat;
    console.log('[GORGAROTH] Defeat cinematic skipped by player');
    if (cine.boss) {
      cine.boss.weaponDropped = true;
      cine.boss.collapseProg = 1.0;
      cine.boss.vaporizeProg = 1.0;
      cine.boss.weaponDissolveProg = 1.0;
      cine.boss.cinematicConsumed = true;
      cine.boss.alive = false;
    }
    AchievementSystem.unlock('jailbreaker');
    this.finishPortalFormation();
  },

  // ═════════════════════════════════════════════════════════════
  // PART 1: GORGAROTH DEFEAT TRIGGER
  // ═════════════════════════════════════════════════════════════
  startDefeat(boss, hitInfo = {}) {
    // 1. One-Shot Trigger Guard (Only triggers once when confirmed HP <= 0)
    if (_defeatTriggered || _defeatCompleted || _playerDeathTriggered) return false;
    _defeatTriggered = true;

    console.log('[GORGAROTH] Defeat cinematic initiated');

    const P = GameState.P;
    const room = (GameState.ROOMS && GameState.ROOMS[0]) || { x: ((COLS - 42) / 2) | 0, y: ((ROWS - 28) / 2) | 0, w: 42, h: 28, cx: (COLS / 2) | 0, cy: (ROWS / 2) | 0 };
    const defaultCx = room.cx || ((COLS / 2) | 0);
    const defaultCy = room.cy || ((ROWS / 2) | 0);
    const px = P ? P.x : defaultCx;
    const py = P ? P.y : (room.y + room.h - 3);
    const bx = boss ? boss.x : defaultCx;
    const by = boss ? boss.y : (defaultCy - 2);
    const facing = bx >= px ? 1 : -1;

    // 2. Lock Gameplay & Freeze normal interactions
    GameState.setState(GameStates.BOSS_DEFEAT_CINEMATIC);
    GameState.BOSS_AI_ACTIVE = false;
    GameState.BOSS_DEAD = true;
    GameState.BOSS_PORTAL_UNLOCKED = false; // Strictly locked until portal forms!
    GameState.BOSS_PROJECTILES = [];
    GameState.BOSS_HAZARDS = [];

    // Lock player: preserve exact position, facing, and weapon
    if (P) {
      P.dead = false;
      P.dying = false;
      P.invulnerable = true;
      P.vx = 0;
      P.vy = 0;
      P.acd = 0;
      P.aanim = 0;
      P.dcd = 999;
      P.fx = facing;
      P.animState = 'idle';
    }

    // Boss state initialization
    if (boss) {
      boss.hp = 0;
      boss.alive = false;
      boss.vx = 0;
      boss.vy = 0;
      boss.attacks = [];
      boss.slamWarning = null;
      boss.isDefeatedCinematic = true;
      boss.defeatState = 'unstable';
      boss.staggerAngle = 0;
      boss.collapseAngle = 0;
      boss.recoilOffset = { x: 0, y: 0 };
      boss.kneeDip = 0;
      boss.kneeFallProg = 0;
      boss.collapseProg = 0;
      boss.vaporizeProg = 0;
      boss.weaponDropped = false;
      boss.weaponTilt = 0;
      boss.weaponOffsetY = 0;
      boss.weaponOffsetX = 0;
      boss.weaponDissolveProg = 0;
      boss.headAngle = 0;
      boss.headRaiseProg = 0;
      boss.visorAlpha = 1.0;
      boss.shoulderDrop = 0;
      boss.dissolveStage = 'none';
      boss.cinematicConsumed = false;
    }

    // Spawn killing hit sparks
    COMBAT_SPARKS = [];
    DISSOLUTION_MOTES = [];
    PORTAL_INWARD_PARTICLES = [];
    ARENA_DUST_MOTES = [];

    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 65;
      COMBAT_SPARKS.push({
        x: (bx + 0.5) * T - facing * 14,
        y: (by + 0.5) * T,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 1.2 + Math.random() * 2.2,
        col: Math.random() < 0.6 ? '#f97316' : '#fde68a',
        life: 1.0
      });
    }

    // Foot dust reacting around Gorgaroth's boots upon fatal impact
    for (let i = 0; i < 16; i++) {
      ARENA_DUST_MOTES.push({
        x: (bx + 0.5) * T + (Math.random() - 0.5) * 36,
        y: (by + 0.9) * T,
        vy: -5 - Math.random() * 10,
        vx: (Math.random() - 0.5) * 18,
        r: 1.2 + Math.random() * 1.5,
        alpha: 0.85,
        life: 0.9
      });
    }

    // Portal location: Directly in the north dais center of the boss arena
    const portalX = defaultCx;
    const portalY = room.y + 2.0;

    _activeDefeat = {
      timer: 0,
      hitStopActive: true,
      hitStopDuration: GORGAROTH_DEFEAT_TIMELINE.HIT_STOP,
      boss,
      equippedWeapon: P ? (P.activeWeapon || P.equippedWeapon || 'sword') : 'sword',
      rowan: {
        startX: px,
        startY: py,
        currentX: px,
        currentY: py,
        facing,
        weaponLowered: false
      },
      // SINGLE PORTAL INSTANCE (Part 2 & 3)
      portal: {
        state: PORTAL_LIFECYCLE.NOT_CREATED,
        x: portalX,
        y: portalY,
        radius: 0,
        targetRadius: 30,
        swirl: 0,
        pulse: 0,
        alpha: 0,
        brightness: 1.0,
        motes: []
      },
      camera: {
        targetX: (px + bx) / 2,
        targetY: (py + by) / 2,
        currentX: (px + bx) / 2,
        currentY: (py + by) / 2,
        zoom: 1.22,
        targetZoom: 1.22
      },
      flashAlpha: 0.45,
      soundCues: {}
    };

    // Initial audio cue: lethal impact
    SoundManager.snd('impact_hit');
    SoundManager.snd('melee_hit');
    if (GameState.CAM) GameState.CAM.shk = 6.0;

    EventBus.emit('boss:defeated', boss);
    EventBus.emit('cinematic:gorgaroth_defeat:started');
    return true;
  },

  // ═════════════════════════════════════════════════════════════
  // PART 4: GORGAROTH KILLS ROWAN (PLAYER DEATH CINEMATIC)
  // ═════════════════════════════════════════════════════════════
  startPlayerDeath(boss, source = null) {
    if (_playerDeathTriggered || _defeatTriggered || _defeatCompleted) return false;
    _playerDeathTriggered = true;

    console.log('[GORGAROTH] Player death cinematic initiated');

    const P = GameState.P;
    const room = (GameState.ROOMS && GameState.ROOMS[0]) || { x: ((COLS - 42) / 2) | 0, y: ((ROWS - 28) / 2) | 0, w: 42, h: 28, cx: (COLS / 2) | 0, cy: (ROWS / 2) | 0 };
    const defaultCx = room.cx || ((COLS / 2) | 0);
    const defaultCy = room.cy || ((ROWS / 2) | 0);
    const px = P ? P.x : defaultCx;
    const py = P ? P.y : (room.y + room.h - 3);
    const bx = boss ? boss.x : defaultCx;
    const by = boss ? boss.y : (defaultCy - 2);
    const bossFacing = px >= bx ? 1 : -1;

    // Immediately take cinematic control & prevent generic death scenes
    GameState.setState(GameStates.DEATH_NORMAL);
    GameState.BOSS_AI_ACTIVE = false;
    GameState.BOSS_PORTAL_UNLOCKED = false; // ZERO portals after player death!

    if (P) {
      P.dead = true;
      P.dying = true;
      P.vx = 0;
      P.vy = 0;
      P.acd = 0;
      P.aanim = 0;
      P.dcd = 999;
      P.cinematicPose = 'stagger';
      P.deathCause = 'boss_gorgaroth';
    }

    if (boss) {
      boss.vx = 0;
      boss.vy = 0;
      boss.attacks = [];
      boss.slamWarning = null;
      boss.facing = bossFacing;
    }

    // Heavy killing blow sparks
    COMBAT_SPARKS = [];
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 55;
      COMBAT_SPARKS.push({
        x: (px + 0.5) * T,
        y: (py + 0.5) * T,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 1.2 + Math.random() * 2.0,
        col: Math.random() < 0.5 ? '#ef4444' : '#f97316',
        life: 1.0
      });
    }

    _activePlayerDeath = {
      timer: 0,
      hitStopActive: true,
      hitStopDuration: GORGAROTH_PLAYER_DEATH_TIMELINE.HIT_STOP,
      boss,
      rowan: {
        x: px,
        y: py,
        staggerX: px - bossFacing * 0.45,
        weaponDropped: false
      },
      camera: {
        targetX: (px * 0.65 + bx * 0.35),
        targetY: (py * 0.65 + by * 0.35),
        currentX: (px * 0.65 + bx * 0.35),
        currentY: (py * 0.65 + by * 0.35),
        zoom: 1.35,
        targetZoom: 1.35
      },
      flashAlpha: 0.55,
      fadeAlpha: 0,
      soundCues: {}
    };

    // Heavy audio impact & sound drop
    SoundManager.snd('impact_hit');
    SoundManager.snd('shockwave');
    if (GameState.CAM) GameState.CAM.shk = 12.0;

    EventBus.emit('player:death', { cause: 'boss_gorgaroth' });
    return true;
  },

  paused: false,

  seek(targetTime, andPause = false) {
    if (!_activeDefeat) {
      if (!GameState.BOSS || GameState.BOSS.id !== 'gorgaroth') {
        FloorManager.loadLevel(3);
      }
      this.startDefeat(GameState.BOSS);
    }
    if (_activeDefeat) {
      _activeDefeat.hitStopActive = false;
      _activeDefeat.hitStopDuration = 0;
      _activeDefeat.timer = targetTime;
      this.paused = andPause;
      this._tickDefeat(0.001);
    }
  },

  seekPlayerDeath(targetTime, andPause = false) {
    if (!_activePlayerDeath) {
      if (!GameState.BOSS || GameState.BOSS.id !== 'gorgaroth') {
        FloorManager.loadLevel(3);
      }
      this.startPlayerDeath(GameState.BOSS, 'boss_gorgaroth');
    }
    if (_activePlayerDeath) {
      _activePlayerDeath.hitStopActive = false;
      _activePlayerDeath.hitStopDuration = 0;
      _activePlayerDeath.timer = targetTime;
      this.paused = andPause;
      this._tickPlayerDeath(0.001);
    }
  },

  unpause() {
    this.paused = false;
  },

  // ═════════════════════════════════════════════════════════════
  // TICK MASTER DISPATCHER
  // ═════════════════════════════════════════════════════════════
  tick(dt) {
    if (this.paused) return;
    if (_activeDefeat) {
      this._tickDefeat(dt);
    } else if (_activePlayerDeath) {
      this._tickPlayerDeath(dt);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 1. TICK: GORGAROTH DEFEAT SEQUENCE
  // ─────────────────────────────────────────────────────────────
  _tickDefeat(dt) {
    const cine = _activeDefeat;
    if (!cine) return;

    // 0. Micro hit-stop freeze (120ms)
    if (cine.hitStopActive) {
      cine.hitStopDuration -= dt;
      if (cine.hitStopDuration <= 0) {
        cine.hitStopActive = false;
        SoundManager.snd('melee_hit');
      }
      return;
    }

    cine.timer += dt;
    const t = cine.timer;
    const P = GameState.P;
    const boss = cine.boss;

    // Screen flash decay
    if (cine.flashAlpha > 0) {
      cine.flashAlpha = Math.max(0, cine.flashAlpha - dt * 2.2);
    }

    // Letterbox interpolation
    LETTERBOX.amount += (LETTERBOX.target - LETTERBOX.amount) * Math.min(1, dt * 3.0);

    // Update combat sparks
    for (let i = COMBAT_SPARKS.length - 1; i >= 0; i--) {
      const sp = COMBAT_SPARKS[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt * 3.0;
      if (sp.life <= 0) COMBAT_SPARKS.splice(i, 1);
    }

    // Update environmental ceiling dust
    for (let i = ARENA_DUST_MOTES.length - 1; i >= 0; i--) {
      const d = ARENA_DUST_MOTES[i];
      d.y += d.vy * dt;
      d.life -= dt * 0.8;
      if (d.life <= 0) ARENA_DUST_MOTES.splice(i, 1);
    }

    // ─────────────────────────────────────────────────────────
    // PHASES OF GORGAROTH DEFEAT & PORTAL TRANSITION
    // ─────────────────────────────────────────────────────────

    // --- PHASE 1: FINAL HIT & IMPACT JERK (0.00s – 0.50s) ---
    if (t < GORGAROTH_DEFEAT_TIMELINE.IMPACT_JERK) {
      const p1 = Math.min(1.0, (t - GORGAROTH_DEFEAT_TIMELINE.HIT_STOP) / (GORGAROTH_DEFEAT_TIMELINE.IMPACT_JERK - GORGAROTH_DEFEAT_TIMELINE.HIT_STOP));
      cine.camera.targetX = (cine.rowan.currentX * 0.45 + boss.x * 0.55);
      cine.camera.targetY = (cine.rowan.currentY * 0.45 + boss.y * 0.55);
      cine.camera.targetZoom = 1.25;

      // Boss upper body jerks from lethal impact; stance breaks, weapon wobbles
      boss.defeatState = 'unstable';
      const jerk = Math.sin(Math.max(0, p1) * Math.PI);
      boss.recoilOffset = {
        x: cine.rowan.facing * jerk * 0.45,
        y: 0
      };
      boss.staggerAngle = cine.rowan.facing * jerk * 0.09;
      boss.weaponTilt = -cine.rowan.facing * jerk * 0.16;

      if (P) {
        P.x = cine.rowan.currentX;
        P.y = cine.rowan.currentY;
        P.fx = cine.rowan.facing;
      }
    }

    // --- PHASE 2: GORGAROTH TRIES TO STAY STANDING (0.50s – 2.40s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.IMPACT_JERK && t < GORGAROTH_DEFEAT_TIMELINE.STAGGER_RESIST) {
      boss.defeatState = 'unstable';
      cine.camera.targetX = boss.x * 0.70 + cine.rowan.currentX * 0.30;
      cine.camera.targetY = boss.y * 0.70 + cine.rowan.currentY * 0.30;
      cine.camera.targetZoom = 1.20;

      // Sub-beat A (0.50s – 1.00s): Staggers backward away from Rowan
      if (t < 1.00) {
        const pStag = (t - 0.50) / 0.50;
        boss.recoilOffset.x = cine.rowan.facing * (0.35 + (1 - pStag) * 0.20);
        boss.recoilOffset.y = 0;
        boss.staggerAngle = cine.rowan.facing * Math.sin(t * 9.0) * 0.08;
        boss.weaponTilt = Math.sin(t * 7.0) * 0.12;
      }
      // Sub-beat B (1.00s – 1.45s): Tries to regain balance, weapon drags against floor, one knee almost touches ground!
      else if (t >= 1.00 && t < 1.45) {
        const pDip = (t - 1.00) / 0.45;
        boss.recoilOffset.x = cine.rowan.facing * 0.35;
        boss.kneeDip = Math.sin(pDip * Math.PI * 0.5) * 0.85; // one knee almost touches ground
        boss.staggerAngle = cine.rowan.facing * 0.04;
        boss.weaponTilt = 0.55 * pDip; // weapon drags downward towards floor

        // Audio & visual: iron drags on stone floor with sparks
        if (!cine.soundCues.ironScrape) {
          cine.soundCues.ironScrape = true;
          SoundManager.snd('iron_scrape');
          for (let i = 0; i < 8; i++) {
            COMBAT_SPARKS.push({
              x: (boss.x + 0.9) * T,
              y: (boss.y + 0.85) * T,
              vx: (Math.random() - 0.5) * 28,
              vy: -10 - Math.random() * 20,
              r: 1.1 + Math.random() * 1.4,
              col: '#f97316',
              life: 0.65
            });
          }
        }
      }
      // Sub-beat C (1.45s – 1.95s): He forces himself back up! Colossal effort refusing to collapse!
      else if (t >= 1.45 && t < 1.95) {
        const pHeave = (t - 1.45) / 0.50;
        const heaveEase = easeInOut(pHeave);
        boss.recoilOffset.x = cine.rowan.facing * 0.35;
        boss.kneeDip = 0.85 * (1 - heaveEase); // forces knee back upright
        boss.weaponTilt = 0.55 * (1 - heaveEase); // pulls weapon back up
        boss.staggerAngle = cine.rowan.facing * (1 - heaveEase) * 0.04;

        if (!cine.soundCues.chainRattle) {
          cine.soundCues.chainRattle = true;
          SoundManager.snd('chain_rattle');
        }
      }
      // Sub-beat D (1.95s – 2.40s): Brief pause. Standing upright on two feet, refusing to fall!
      else {
        boss.recoilOffset.x = cine.rowan.facing * 0.35;
        boss.kneeDip = 0;
        boss.staggerAngle = 0;
        boss.weaponTilt = 0;
        // Heavy breathing heave
        boss.recoilOffset.y = Math.sin((t - 1.95) * 6.0) * 0.04;
      }

      // Rowan lowers weapon and catches breath during this beat
      if (t >= 2.00 && !cine.rowan.weaponLowered) {
        cine.rowan.weaponLowered = true;
        if (P) {
          P.weaponLowered = true;
          P.animState = 'idle';
        }
      }
    }

    // --- PHASE 3: FINAL MOMENT OF DEFIANCE (2.40s – 3.20s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.STAGGER_RESIST && t < GORGAROTH_DEFEAT_TIMELINE.FINAL_DEFIANCE) {
      boss.defeatState = 'defiance';
      boss.recoilOffset = { x: cine.rowan.facing * 0.35, y: 0 };
      boss.staggerAngle = 0;
      boss.kneeDip = 0;

      const pDefy = (t - 2.40) / 0.80;
      // Gorgaroth slowly raises his head toward Rowan
      boss.headAngle = -0.16 * Math.sin(pDefy * Math.PI * 0.5);
      boss.headRaiseProg = pDefy;

      // Visor communicates: Defiance (burning ember) -> Defeat (fading cold)
      if (t < 2.80) {
        boss.visorAlpha = 1.0;
        boss.weaponTilt = 0.05;
      } else {
        const pDefeat = (t - 2.80) / 0.40;
        boss.visorAlpha = Math.max(0, 1.0 - pDefeat);
        // Grip loosens, weapon begins tilting forward
        boss.weaponTilt = 0.05 + pDefeat * 0.15;
      }

      cine.camera.targetX = boss.x * 0.75 + cine.rowan.currentX * 0.25;
      cine.camera.targetY = boss.y * 0.75 + cine.rowan.currentY * 0.25;
      cine.camera.targetZoom = 1.24;
    }

    // --- PHASE 4: WEAPON DROP (3.20s – 4.00s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.FINAL_DEFIANCE && t < GORGAROTH_DEFEAT_TIMELINE.WEAPON_DROP) {
      boss.defeatState = 'weapon_falling';
      boss.recoilOffset = { x: cine.rowan.facing * 0.35, y: 0 };
      boss.staggerAngle = 0;
      boss.visorAlpha = 0;

      // Sub-beat: Weapon tilts and falls from grip (3.20s – 3.55s)
      if (t < 3.55) {
        const pDrop = (t - 3.20) / 0.35;
        boss.weaponTilt = 0.20 + pDrop * 0.72; // tilts down toward floor
        boss.weaponOffsetY = pDrop * 36;
        boss.weaponOffsetX = pDrop * -2;
      } else {
        // Heavy impact on stone floor!
        if (!boss.weaponDropped) {
          boss.weaponDropped = true;
          SoundManager.snd('weapon_clang');
          SoundManager.snd('impact_hit');
          if (GameState.CAM) GameState.CAM.shk = 5.0;

          // Small dust & impact burst on floor around fallen weapon
          for (let i = 0; i < 16; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 12 + Math.random() * 26;
            ARENA_DUST_MOTES.push({
              x: (boss.x + 0.9) * T + Math.cos(ang) * 12,
              y: (boss.y + 0.7) * T + Math.sin(ang) * 6,
              vy: -4 - Math.random() * 10,
              vx: Math.cos(ang) * spd * 0.4,
              r: 1.2 + Math.random() * 1.5,
              alpha: 0.8,
              life: 0.9
            });
          }
        }
      }

      cine.camera.targetX = boss.x * 0.70 + cine.rowan.currentX * 0.30;
      cine.camera.targetY = boss.y * 0.70 + cine.rowan.currentY * 0.30;
      cine.camera.targetZoom = 1.22;
    }

    // --- PHASE 5: KNEEL (4.00s – 4.80s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.WEAPON_DROP && t < GORGAROTH_DEFEAT_TIMELINE.KNEEL_BEAT) {
      boss.weaponDropped = true;
      boss.recoilOffset = { x: cine.rowan.facing * 0.35, y: 0 };
      boss.defeatState = 'knee';

      // Slowly drops to one knee (4.00s – 4.40s)
      const pKneel = Math.min(1.0, (t - 4.00) / 0.40);
      boss.kneeFallProg = easeInOut(pKneel);

      // Knee hits floor at 4.40s
      if (t >= 4.40 && !cine.soundCues.kneeImpact) {
        cine.soundCues.kneeImpact = true;
        SoundManager.snd('shockwave');
        if (GameState.CAM) GameState.CAM.shk = 4.0;
        // Dust puff at knee contact
        for (let i = 0; i < 12; i++) {
          ARENA_DUST_MOTES.push({
            x: (boss.x + 0.5) * T + (Math.random() - 0.5) * 20,
            y: (boss.y + 0.9) * T,
            vy: -4 - Math.random() * 8,
            vx: (Math.random() - 0.5) * 10,
            r: 1.4,
            alpha: 0.75,
            life: 0.8
          });
        }
      }

      // Emotional beat: Camera holds motionless kneeling boss (4.40s – 4.80s)
      cine.camera.targetX = boss.x * 0.65 + cine.rowan.currentX * 0.35;
      cine.camera.targetY = boss.y * 0.65 + cine.rowan.currentY * 0.35;
      cine.camera.targetZoom = 1.22;
    }

    // --- PHASE 6: FINAL COLLAPSE (4.80s – 5.50s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.KNEEL_BEAT && t < GORGAROTH_DEFEAT_TIMELINE.FINAL_COLLAPSE) {
      boss.weaponDropped = true;
      boss.kneeFallProg = 1.0;
      boss.defeatState = 'collapsed';

      const pCol = Math.min(1.0, (t - 4.80) / 0.70);
      const colEase = easeInOut(pCol);

      // Head lowers, shoulders drop, body loses strength and slumps forward smoothly
      boss.headAngle = 0.25 * colEase;
      boss.shoulderDrop = 6 * colEase;
      boss.collapseProg = colEase;
      boss.collapseAngle = colEase * 1.42 * (boss.facing || -1);

      // Slightly wider shot so entire fall is visible
      cine.camera.targetX = boss.x * 0.75 + cine.rowan.currentX * 0.25;
      cine.camera.targetY = boss.y * 0.75 + cine.rowan.currentY * 0.25;
      cine.camera.targetZoom = 1.18;
    }

    // --- PHASE 7: ENVIRONMENT REACTION & HOLD THE DEAD BOSS (5.50s – 7.20s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.FINAL_COLLAPSE && t < GORGAROTH_DEFEAT_TIMELINE.HOLD_DEAD_BODY) {
      boss.weaponDropped = true;
      boss.kneeFallProg = 1.0;
      boss.collapseProg = 1.0;
      boss.collapseAngle = 1.42 * (boss.facing || -1);
      boss.shoulderDrop = 6;
      boss.defeatState = 'corpse';
      boss.vaporizeProg = 0.0; // DO NOT DISSOLVE HIM YET! Hold body motionless on floor for 1.7s.

      // Colossal ground impact trigger at 5.50s
      if (!cine.soundCues.groundImpact) {
        cine.soundCues.groundImpact = true;
        SoundManager.snd('shockwave');
        SoundManager.snd('iron_scrape');
        SoundManager.playTone(42, 'sine', 0.90, 0.25, 45); // slight dungeon rumble
        if (GameState.CAM) GameState.CAM.shk = 7.0; // subtle screen impulse

        // Expanding radial floor dust wave
        for (let i = 0; i < 28; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 20 + Math.random() * 35;
          ARENA_DUST_MOTES.push({
            x: (boss.x + 0.5) * T + Math.cos(ang) * 18,
            y: (boss.y + 0.6) * T + Math.sin(ang) * 9,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd * 0.4,
            r: 1.8,
            alpha: 0.85,
            life: 1.1
          });
        }

        // Torches flicker from the dungeon rumble
        if (GameState.TORCHES) {
          GameState.TORCHES.forEach(tor => { tor.flicker = 1.0; });
        }

        // Gentle ceiling dust motes
        const room = (GameState.ROOMS && GameState.ROOMS[0]) || { x: ((COLS - 42) / 2) | 0, y: ((ROWS - 28) / 2) | 0, w: 42, h: 28 };
        for (let i = 0; i < 24; i++) {
          ARENA_DUST_MOTES.push({
            x: (room.x + Math.random() * room.w) * T,
            y: (room.y + Math.random() * 4) * T,
            vy: 10 + Math.random() * 18,
            vx: (Math.random() - 0.5) * 4,
            r: 1.0 + Math.random() * 1.5,
            alpha: 0.6,
            life: 1.2
          });
        }
      }

      // Stable cinematic shot: Camera slowly settles, letting the player process victory
      cine.camera.targetX = boss.x * 0.65 + cine.rowan.currentX * 0.35;
      cine.camera.targetY = boss.y * 0.65 + cine.rowan.currentY * 0.35;
      cine.camera.targetZoom = 1.16;
    }

    // --- PHASE 8: PROGRESSIVE DISSOLUTION (7.20s – 10.20s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.HOLD_DEAD_BODY && t < GORGAROTH_DEFEAT_TIMELINE.DISSOLUTION) {
      boss.weaponDropped = true;
      boss.kneeFallProg = 1.0;
      boss.collapseProg = 1.0;
      boss.collapseAngle = 1.42 * (boss.facing || -1);
      boss.shoulderDrop = 6;
      boss.defeatState = 'cracking';

      const pDissolve = (t - GORGAROTH_DEFEAT_TIMELINE.HOLD_DEAD_BODY) / 3.00;
      boss.vaporizeProg = Math.min(1.0, pDissolve);
      boss.weaponDissolveProg = Math.min(1.0, Math.max(0, (pDissolve - 0.4) * 1.7));

      // Gradual body stage dissolution
      if (t < 8.20) {
        boss.dissolveStage = 'legs';
      } else if (t < 9.20) {
        boss.dissolveStage = 'torso';
      } else {
        boss.dissolveStage = 'all';
      }

      if (!cine.soundCues.dissolveTone) {
        cine.soundCues.dissolveTone = true;
        SoundManager.playTone(180, 'sine', 1.0, 0.12, 100);
      }

      // Detaching amber and cosmic dissolution motes flowing to gathering point
      const gatherX = (cine.portal.x + 0.5) * T;
      const gatherY = (cine.portal.y + 0.5) * T;

      if (DISSOLUTION_MOTES.length < 60 && Math.random() < 0.70) {
        const spreadX = (Math.random() - 0.5) * 48;
        const spreadY = (Math.random() - 0.5) * 24;
        const startX = (boss.x + 0.5) * T + spreadX;
        const startY = (boss.y + 0.5) * T + spreadY;
        const ang = Math.atan2(gatherY - startY, gatherX - startX) + (Math.random() - 0.5) * 0.7;
        const spd = 22 + Math.random() * 40;

        DISSOLUTION_MOTES.push({
          x: startX,
          y: startY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 1.2 + Math.random() * 2.0,
          alpha: 0.9,
          col: Math.random() < 0.5 ? '#f97316' : Math.random() < 0.8 ? '#fde68a' : '#38bdf8',
          life: 1.0
        });
      }

      // Guide motes toward portal origin
      for (let i = DISSOLUTION_MOTES.length - 1; i >= 0; i--) {
        const m = DISSOLUTION_MOTES[i];
        const dx = gatherX - m.x;
        const dy = gatherY - m.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 4 || m.life <= 0) {
          DISSOLUTION_MOTES.splice(i, 1);
          continue;
        }

        m.vx += (dx / dist) * 110 * dt;
        m.vy += (dy / dist) * 110 * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life -= dt * 0.75;
      }

      // Camera slow subtle hold easing back toward arena
      cine.camera.targetX = (cine.rowan.currentX + cine.portal.x) / 2;
      cine.camera.targetY = (cine.rowan.currentY + cine.portal.y) / 2;
      cine.camera.targetZoom = 1.14;
    }

    // --- PHASE 9: FINAL REMNANT & EMPTY ARENA (10.20s – 11.80s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.DISSOLUTION && t < GORGAROTH_DEFEAT_TIMELINE.HOLD_EMPTY) {
      // Gorgaroth has completely dissolved!
      boss.vaporizeProg = 1.0;
      boss.weaponDissolveProg = 1.0;
      boss.cinematicConsumed = true;
      boss.alive = false;

      // Guide remaining remnant motes until dispersed
      const gatherX = (cine.portal.x + 0.5) * T;
      const gatherY = (cine.portal.y + 0.5) * T;
      for (let i = DISSOLUTION_MOTES.length - 1; i >= 0; i--) {
        const m = DISSOLUTION_MOTES[i];
        const dx = gatherX - m.x;
        const dy = gatherY - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4 || m.life <= 0) {
          DISSOLUTION_MOTES.splice(i, 1);
          continue;
        }
        m.vx += (dx / dist) * 110 * dt;
        m.vy += (dy / dist) * 110 * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life -= dt * 0.75;
      }

      // Arena is empty. Rowan stands in silence.
      cine.camera.targetX = (cine.rowan.currentX + cine.portal.x) / 2;
      cine.camera.targetY = (cine.rowan.currentY + cine.portal.y) / 2;
      cine.camera.targetZoom = 1.10;

      if (P) {
        P.animState = 'idle';
        P.weaponLowered = true;
      }
    }

    // --- PHASE 7: SINGLE PORTAL FORMATION (11.80s – 14.00s) ---
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.HOLD_EMPTY && t < GORGAROTH_DEFEAT_TIMELINE.PORTAL_FORMING) {
      boss.cinematicConsumed = true;
      const p7 = (t - 11.80) / 2.20;

      // Single portal lifecycle: CREATING
      cine.portal.state = PORTAL_LIFECYCLE.CREATING;
      cine.portal.radius = Math.min(cine.portal.targetRadius, p7 * cine.portal.targetRadius * 1.12);
      cine.portal.alpha = Math.min(1.0, p7 * 1.5);
      cine.portal.swirl += dt * 2.6;
      cine.portal.pulse = Math.sin(t * 4.5) * 1.5;

      // Energy pulse sound when portal opens
      if (!cine.soundCues.portalBirth) {
        cine.soundCues.portalBirth = true;
        SoundManager.snd('portal_enter');
        SoundManager.snd('shockwave');
        cine.flashAlpha = 0.45;
        if (GameState.CAM) GameState.CAM.shk = 6.0;
        AchievementSystem.unlock('jailbreaker');
      }

      this._tickPortalInwardMotes(dt, cine.portal.x, cine.portal.y);

      cine.camera.targetX = (cine.rowan.currentX + cine.portal.x) / 2;
      cine.camera.targetY = (cine.rowan.currentY + cine.portal.y) / 2;
      cine.camera.targetZoom = 1.10;
    }

    // --- PHASE 8: PORTAL FORMATION COMPLETE — RESTORE PLAYER CONTROL (14.00s+) ---
    // MANDATORY INTEGRATION CRITICAL RULE: Never auto-pull Rowan into the portal!
    // The iron gate has formed from Gorgaroth's dissolved remains and remains active in arena.
    // Rowan remains in FULL player control to explore and manually enter.
    else if (t >= GORGAROTH_DEFEAT_TIMELINE.PORTAL_FORMING) {
      this.finishPortalFormation();
      return;
    }

    // Synchronize camera
    cine.camera.currentX += (cine.camera.targetX - cine.camera.currentX) * dt * 3.5;
    cine.camera.currentY += (cine.camera.targetY - cine.camera.currentY) * dt * 3.5;
    cine.camera.zoom += (cine.camera.targetZoom - cine.camera.zoom) * dt * 3.0;

    if (GameState.CAM) {
      GameState.CAM.tx = cine.camera.targetX;
      GameState.CAM.ty = cine.camera.targetY;
      GameState.CAM.tz = cine.camera.targetZoom;
      GameState.CAM.x = cine.camera.currentX;
      GameState.CAM.y = cine.camera.currentY;
      GameState.CAM.z = cine.camera.zoom;
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 2. TICK: GORGAROTH KILLS ROWAN (PLAYER DEATH SEQUENCE)
  // ─────────────────────────────────────────────────────────────
  _tickPlayerDeath(dt) {
    const cine = _activePlayerDeath;
    if (!cine) return;

    // 0. Micro hit-stop freeze (120ms)
    if (cine.hitStopActive) {
      cine.hitStopDuration -= dt;
      if (cine.hitStopDuration <= 0) {
        cine.hitStopActive = false;
        SoundManager.snd('melee_hit');
      }
      return;
    }

    cine.timer += dt;
    const t = cine.timer;
    const P = GameState.P;
    const boss = cine.boss;

    if (cine.flashAlpha > 0) {
      cine.flashAlpha = Math.max(0, cine.flashAlpha - dt * 2.0);
    }

    // Update killing blow sparks
    for (let i = COMBAT_SPARKS.length - 1; i >= 0; i--) {
      const sp = COMBAT_SPARKS[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt * 2.8;
      if (sp.life <= 0) COMBAT_SPARKS.splice(i, 1);
    }

    // --- PHASE 1: IMPACT RECOIL & STAGGER (0.00s – 1.00s) ---
    if (t < GORGAROTH_PLAYER_DEATH_TIMELINE.RECOIL_STAGGER) {
      const p1 = t / GORGAROTH_PLAYER_DEATH_TIMELINE.RECOIL_STAGGER;
      if (P) {
        P.x = cine.rowan.x + (cine.rowan.staggerX - cine.rowan.x) * p1;
        P.cinematicPose = 'stagger';
      }
      if (!cine.rowan.weaponDropped && t >= 0.40) {
        cine.rowan.weaponDropped = true;
        SoundManager.snd('weapon_clang');
        if (GameState.CAM) GameState.CAM.shk = 5.0;
      }
    }

    // --- PHASE 2: ROWAN FALLS GROUNDED (1.00s – 3.00s) ---
    else if (t >= GORGAROTH_PLAYER_DEATH_TIMELINE.RECOIL_STAGGER && t < GORGAROTH_PLAYER_DEATH_TIMELINE.FALL_PRONE) {
      if (P) {
        P.x = cine.rowan.staggerX;
        P.cinematicPose = 'fallen';
        P.dead = true;
      }
      if (!cine.soundCues.bodyThud && t >= 1.60) {
        cine.soundCues.bodyThud = true;
        SoundManager.snd('heartbeat');
        if (GameState.CAM) GameState.CAM.shk = 4.0;
      }
    }

    // --- PHASE 3: COMPOSITION HOLD: ROWAN ON GROUND & GORGAROTH STANDING (3.00s – 5.50s) ---
    else if (t >= GORGAROTH_PLAYER_DEATH_TIMELINE.FALL_PRONE && t < GORGAROTH_PLAYER_DEATH_TIMELINE.HOLD_COMPOSITION) {
      if (P) {
        P.cinematicPose = 'fallen';
        P.dead = true;
      }
      // Boss remains standing imposing
      if (boss) {
        boss.alive = true;
        boss.vx = 0;
        boss.vy = 0;
      }

      // Camera gently centers both characters in a tragic, dignified frame
      const room = (GameState.ROOMS && GameState.ROOMS[0]) || { x: ((COLS - 42) / 2) | 0, y: ((ROWS - 28) / 2) | 0, cx: (COLS / 2) | 0, cy: (ROWS / 2) | 0 };
      const defaultCx = room.cx || ((COLS / 2) | 0);
      const defaultCy = room.cy || ((ROWS / 2) | 0);
      const midX = (cine.rowan.staggerX * 0.60 + (boss ? boss.x : defaultCx) * 0.40);
      const midY = (cine.rowan.y * 0.60 + (boss ? boss.y : defaultCy) * 0.40);
      cine.camera.targetX = midX;
      cine.camera.targetY = midY;
      cine.camera.targetZoom = 1.30;

      if (!cine.soundCues.ambientRumble && t >= 3.20) {
        cine.soundCues.ambientRumble = true;
        SoundManager.playTone(50, 'sine', 0.75, 0.10, 60);
      }
    }

    // --- PHASE 4: FADE TO BLACK & ENTER RESULTS (5.50s – 7.50s) ---
    else if (t >= GORGAROTH_PLAYER_DEATH_TIMELINE.HOLD_COMPOSITION) {
      const fadeProg = Math.min(1.0, (t - GORGAROTH_PLAYER_DEATH_TIMELINE.HOLD_COMPOSITION) / 1.80);
      cine.fadeAlpha = fadeProg;

      if (t >= GORGAROTH_PLAYER_DEATH_TIMELINE.HANDOFF && !cine.soundCues.resultsEntered) {
        cine.soundCues.resultsEntered = true;
        _activePlayerDeath = null;
        DeathCinematics.enterResults(false);
        return;
      }
    }

    // Smooth camera interpolation
    cine.camera.currentX += (cine.camera.targetX - cine.camera.currentX) * dt * 3.5;
    cine.camera.currentY += (cine.camera.targetY - cine.camera.currentY) * dt * 3.5;
    cine.camera.zoom += (cine.camera.targetZoom - cine.camera.zoom) * dt * 3.0;

    if (GameState.CAM) {
      GameState.CAM.tx = cine.camera.targetX;
      GameState.CAM.ty = cine.camera.targetY;
      GameState.CAM.tz = cine.camera.targetZoom;
      GameState.CAM.x = cine.camera.currentX;
      GameState.CAM.y = cine.camera.currentY;
      GameState.CAM.z = cine.camera.zoom;
    }
  },

  // ─────────────────────────────────────────────────────────────
  // Helper: Inward Motes for Single Living Portal
  // ─────────────────────────────────────────────────────────────
  _tickPortalInwardMotes(dt, portalX, portalY) {
    const pcx = (portalX + 0.5) * T;
    const pcy = (portalY + 0.5) * T;

    if (PORTAL_INWARD_PARTICLES.length < 35 && Math.random() < 0.65) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 38 + Math.random() * 26;
      PORTAL_INWARD_PARTICLES.push({
        x: pcx + Math.cos(ang) * dist,
        y: pcy + Math.sin(ang) * dist * 0.65,
        spd: 35 + Math.random() * 45,
        r: 1.0 + Math.random() * 1.5,
        col: Math.random() < 0.5 ? '#38bdf8' : Math.random() < 0.8 ? '#c084fc' : '#fde68a',
        life: 1.0
      });
    }

    for (let i = PORTAL_INWARD_PARTICLES.length - 1; i >= 0; i--) {
      const p = PORTAL_INWARD_PARTICLES[i];
      const dx = pcx - p.x;
      const dy = pcy - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 3 || p.life <= 0) {
        PORTAL_INWARD_PARTICLES.splice(i, 1);
        continue;
      }

      p.x += (dx / dist) * p.spd * dt;
      p.y += (dy / dist) * p.spd * dt;
      p.life -= dt * 1.2;
    }
  },

  // ═════════════════════════════════════════════════════════════
  // PART 3: WORLD-SPACE ENTITY RENDERING (The Single Cosmic Portal)
  // ═════════════════════════════════════════════════════════════
  drawWorldEntities(ctx) {
    // 1. Defeat Dissolution Motes
    DISSOLUTION_MOTES.forEach(m => {
      ctx.save();
      ctx.globalAlpha = m.alpha * (m.life || 1.0);
      ctx.fillStyle = m.col;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 2. Combat Sparks
    COMBAT_SPARKS.forEach(sp => {
      ctx.save();
      ctx.globalAlpha = sp.life;
      ctx.fillStyle = sp.col;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. Environmental Dust Motes
    ARENA_DUST_MOTES.forEach(d => {
      ctx.save();
      ctx.globalAlpha = d.alpha * d.life;
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Inward Portal Motes
    PORTAL_INWARD_PARTICLES.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life * 0.9;
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. THE SINGLE LIVING COSMIC PORTAL
    if (_activeDefeat && _activeDefeat.portal && _activeDefeat.portal.radius > 0) {
      this._drawLivingPortal(ctx, _activeDefeat.portal, _activeDefeat.timer);
    }

    // 6. Rowan Portal Entry Wrap
    if (_activeDefeat && _activeDefeat.timer >= GORGAROTH_DEFEAT_TIMELINE.PORTAL_FORMING && GameState.P) {
      const ppx = (GameState.P.x + 0.5) * T;
      const ppy = (GameState.P.y + 0.5) * T;
      const wrapAlpha = Math.min(0.70, (_activeDefeat.timer - GORGAROTH_DEFEAT_TIMELINE.PORTAL_FORMING) / 2.0);

      ctx.save();
      ctx.globalAlpha = wrapAlpha;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ppx, ppy, 16, _activeDefeat.portal.swirl * 1.5, _activeDefeat.portal.swirl * 1.5 + 4.2);
      ctx.stroke();
      ctx.restore();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // Physical In-Engine Portal Drawing (Single Instance)
  // ─────────────────────────────────────────────────────────────
  _drawLivingPortal(ctx, portal, timer) {
    if (!portal) return;
    const ppx = portal.x * T;
    const ppy = portal.y * T;

    // Authoritative delegation to PortalTransition with Gorgaroth Iron Gate profile
    if (PortalTransition && PortalTransition.drawWorldPortal) {
      PortalTransition.drawWorldPortal(ctx, ppx, ppy, T, PORTAL_CONTEXTS.GORGAROTH_DEATH_PORTAL);
    }
  },

  // ═════════════════════════════════════════════════════════════
  // PORTAL FORMATION COMPLETION & RESTORE PLAYER CONTROL
  // ═════════════════════════════════════════════════════════════
  finishPortalFormation() {
    if (!_activeDefeat) return;
    const cine = _activeDefeat;
    const pX = Math.round(cine.portal.x);
    const pY = Math.round(cine.portal.y);

    // Register active world portal tile on Floor 3 map
    if (GameState.MAP) {
      // Clear obstacle tiles in 3x3 radius around portal
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = pY + dr;
          const c = pX + dc;
          if (GameState.MAP[r] && GameState.MAP[r][c] === 1) {
            GameState.MAP[r][c] = 0;
          }
        }
      }
      if (GameState.MAP[pY]) {
        GameState.MAP[pY][pX] = 2;
      }
    }

    _defeatCompleted = true;
    _activeDefeat = null;

    GameState.BOSS_PORTAL_UNLOCKED = true;
    GameState.BOSS_DEAD = true;
    GameState.CINEMATIC_ACTIVE = false;
    GameState.ACTIVE_CINEMATIC_TYPE = null;

    // Restore player state and movement — Rowan retains FULL control!
    GameState.setState(GameStates.PLAYING);
    const P = GameState.P;
    if (P) {
      P.invulnerable = false;
      P.animState = 'idle';
      P.weaponLowered = false;
      P.vx = 0;
      P.vy = 0;
      P.portalScale = 1.0;
      P.portalAlpha = 1.0;
    }

    // Restore gameplay camera tracking Rowan
    if (GameState.CAM && P) {
      GameState.CAM.tx = P.x;
      GameState.CAM.ty = P.y;
      GameState.CAM.tz = 1.0;
    }

    // Trigger completion banner
    if (typeof window !== 'undefined' && window.triggerCinematicBanner) {
      window.triggerCinematicBanner(
        '✦ GORGAROTH VANQUISHED ✦',
        'The iron gate has formed from his dissolved remains. Enter when ready.',
        '#ea580c',
        3.5
      );
    }

    // Clear letterbox & transient particles
    LETTERBOX.amount = 0;
    COMBAT_SPARKS = [];
    DISSOLUTION_MOTES = [];
    PORTAL_INWARD_PARTICLES = [];
    ARENA_DUST_MOTES = [];

    EventBus.emit('cinematic:gorgaroth_portal_ready', { x: pX, y: pY });
  },

  // ═════════════════════════════════════════════════════════════
  // SCREEN-SPACE OVERLAYS (Letterbox, Screen Flash, Vignette)
  // ═════════════════════════════════════════════════════════════
  draw(ctx) {
    const barH = LETTERBOX.maxHeight * LETTERBOX.amount;

    ctx.save();

    // 1. Defeat Cinematic Screen Overlays
    if (_activeDefeat) {
      const cine = _activeDefeat;

      // Screen flash
      if (cine.flashAlpha > 0) {
        ctx.fillStyle = `rgba(254, 243, 199, ${cine.flashAlpha})`;
        ctx.fillRect(0, 0, LW, LH);
      }

      // Letterbox
      if (barH > 0) {
        ctx.fillStyle = '#020205';
        ctx.fillRect(0, 0, LW, barH);
        ctx.fillRect(0, LH - barH, LW, barH);

        // Gold filigree edge lines
        ctx.fillStyle = 'rgba(234, 88, 12, 0.40)';
        ctx.fillRect(0, barH - 1, LW, 1);
        ctx.fillRect(0, LH - barH, LW, 1);
      }

      // Skip prompt
      if (this.canSkip()) {
        const skipAlpha = Math.min(0.60, (cine.timer - 0.5) / 0.8);
        ctx.fillStyle = `rgba(251, 146, 60, ${skipAlpha})`;
        ctx.font = 'bold 9px "Cinzel", Georgia, serif';
        ctx.textAlign = 'right';
        ctx.fillText('SPACE / CLICK TO SKIP', LW - 18, LH - barH - 8);
      }

      // Traversal darkening at end
      if (cine.timer >= GORGAROTH_DEFEAT_TIMELINE.ROWAN_APPROACH) {
        const darkProg = Math.min(1.0, (cine.timer - GORGAROTH_DEFEAT_TIMELINE.ROWAN_APPROACH) / 1.0);
        ctx.fillStyle = `rgba(2, 6, 23, ${darkProg * 0.95})`;
        ctx.fillRect(0, 0, LW, LH);
      }
    }

    // 2. Player Death Screen Overlays
    if (_activePlayerDeath) {
      const cine = _activePlayerDeath;

      // Screen flash
      if (cine.flashAlpha > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${cine.flashAlpha * 0.5})`;
        ctx.fillRect(0, 0, LW, LH);
      }

      // Tragic letterbox
      if (barH > 0) {
        ctx.fillStyle = '#050202';
        ctx.fillRect(0, 0, LW, barH);
        ctx.fillRect(0, LH - barH, LW, barH);
      }

      // Vignette
      const vig = ctx.createRadialGradient(LW / 2, LH / 2, LW * 0.15, LW / 2, LH / 2, LW * 0.65);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(3, 1, 1, 0.85)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, LW, LH);

      // Final fade to black
      if (cine.fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${cine.fadeAlpha})`;
        ctx.fillRect(0, 0, LW, LH);
      }
    }

    ctx.restore();
  },

  // ═════════════════════════════════════════════════════════════
  // SEAMLESS TRANSITION TO FLOOR 4 & CLEANUP
  // ═════════════════════════════════════════════════════════════
  completeToNextFloor() {
    console.log('[GORGAROTH] Complete defeat transition to Floor 4');
    _defeatCompleted = true;
    _activeDefeat = null;

    // Clean up all transient particles and portal instances
    COMBAT_SPARKS = [];
    DISSOLUTION_MOTES = [];
    PORTAL_INWARD_PARTICLES = [];
    ARENA_DUST_MOTES = [];
    LETTERBOX.amount = 0;

    // Load Floor 4 directly
    FloorManager.loadLevel(4);
    GameState.setState(GameStates.PLAYING);

    // Camera reset
    if (GameState.P && GameState.CAM) {
      GameState.CAM.tx = GameState.P.x;
      GameState.CAM.ty = GameState.P.y;
      GameState.CAM.tz = 1.0;
      GameState.CAM.x = GameState.P.x;
      GameState.CAM.y = GameState.P.y;
      GameState.CAM.z = 1.0;
    }
  },

  // ═════════════════════════════════════════════════════════════
  // RESET / RECOVERY
  // ═════════════════════════════════════════════════════════════
  reset() {
    this.paused = false;
    _defeatTriggered = false;
    _defeatCompleted = false;
    _playerDeathTriggered = false;
    _activeDefeat = null;
    _activePlayerDeath = null;
    COMBAT_SPARKS = [];
    DISSOLUTION_MOTES = [];
    PORTAL_INWARD_PARTICLES = [];
    ARENA_DUST_MOTES = [];
    LETTERBOX.amount = 0;
  }
};

// Global shim for regression tests
if (typeof window !== 'undefined') {
  window.GorgarothCinematics = GorgarothCinematics;
}
