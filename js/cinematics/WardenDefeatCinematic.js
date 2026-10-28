// =====================================================================
//  DUNGEON BREAK — js/cinematics/WardenDefeatCinematic.js
//  REBUILT FROM SCRATCH: THE ABYSS WARDEN DEFEAT + PORTAL CINEMATIC
//
//  Continuous, Grounded, In-Engine Story Sequence:
//  1. Fatal hit connects with exact equipped weapon & hit-stop
//  2. Warden staggers, drops Dreadblade, collapses prone onto floor
//  3. Brief silence & subtle room reaction (torches flicker, light rumble)
//  4. Warden dissolves into abyss particles flowing into a central point
//  5. The gathered energy tears open a persistent living cosmic portal AT THE DEATH SPOT
//  6. Rowan stands grounded, observes the newly formed portal
//  7. Rowan takes deliberate grounded steps straight into the portal
//  8. Portal reacts, engulfs Rowan, and transitions into Hero / Betrayal / Rampage
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { EventBus } from '../core/EventBus.js';
import { EndingCinematics, EndingDispatcher } from './EndingCinematics.js';
import { CharacterDefinitions } from '../rendering/CharacterDefinitions.js';
import { BossArenaGenerator } from '../world/BossArenaGenerator.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PortalTransition, PORTAL_CONTEXTS } from './PortalTransition.js';
import { CinematicSafety } from './CinematicSafety.js';

// ─────────────────────────────────────────────────────────────
// Cinematic Timeline Phases (Total ~14.5s)
// ─────────────────────────────────────────────────────────────
export const WARDEN_TIMELINE = {
  HIT_STOP: 0.10,          // 0.00 – 0.10s: Micro hit-stop freeze (100ms)
  IMPACT_RECOIL: 1.00,     // 0.10 – 1.00s: Weapon follow-through, Warden recoil & fissure glow
  STAGGER_COLLAPSE: 3.00,  // 1.00 – 3.00s: Heavy stagger, weapon slips/drops, collapse prone, silence
  DISSOLUTION: 6.00,       // 3.00 – 6.00s: Body breaks apart, particles stream to central singularity
  PORTAL_FORMING: 8.00,    // 6.00 – 8.00s: Singularity compresses, tears open, expands into living portal
  ROWAN_REACTION: 9.50,    // 8.00 – 9.50s: Portal stabilizes, Rowan grounded observation beat
  ROWAN_WALK: 12.00,       // 9.50 – 12.00s: Deliberate grounded steps into portal center
  PORTAL_TRAVERSAL: 14.50, // 12.00 – 14.50s: Event horizon engulfs player, branch transition cues
  HANDOFF: 14.50           // 14.50s: Seamless handoff to Hero, Betrayal, or Rampage
};

// ─────────────────────────────────────────────────────────────
// One-Shot State Guards & Active Context
// ─────────────────────────────────────────────────────────────
let _wardenDefeatStarted = false;
let _portalCreatedInWorld = false;
let _endingBranchLocked = false;
let _endingHandoffTriggered = false;
let _activeCinematic = null;

// Letterbox state (screen-space)
const LETTERBOX = {
  amount: 0,
  target: 1.0,
  maxHeight: 44
};

// Persistent arrays for controlled cinematic entities
let DISSOLUTION_PARTICLES = [];
let COMBAT_SPARKS = [];
let BLOOD_DECALS = [];
let PORTAL_INWARD_MOTES = [];

// ─────────────────────────────────────────────────────────────
// Ending Branch Determination Helper (from live run state)
// ─────────────────────────────────────────────────────────────
export function calculateEndingBranch() {
  const { P, SANITY } = GameState;
  let san = 50;
  if (SANITY !== undefined && SANITY < 40) san = SANITY;
  else if (P && P.san !== undefined && P.san < 40) san = P.san;
  else if (SANITY !== undefined) san = SANITY;
  else if (P && P.san !== undefined) san = P.san;

  const saved = (P && P.saved !== undefined) ? P.saved : 0;

  if (saved >= 1 && san >= 40) {
    return 'hero';
  } else if (saved >= 1 && san < 40) {
    return 'betrayal';
  } else {
    return 'rampage';
  }
}

// ─────────────────────────────────────────────────────────────
// MASTER WARDEN DEFEAT CINEMATIC CONTROLLER
// ─────────────────────────────────────────────────────────────
export const WardenDefeatCinematic = {
  isActive() {
    return !!_activeCinematic;
  },

  getActiveCinematic() {
    return _activeCinematic;
  },

  isDefeated() {
    return _wardenDefeatStarted;
  },

  reset() {
    _wardenDefeatStarted = false;
    _portalCreatedInWorld = false;
    _endingBranchLocked = false;
    _endingHandoffTriggered = false;
    _activeCinematic = null;
    LETTERBOX.amount = 0;
    DISSOLUTION_PARTICLES = [];
    COMBAT_SPARKS = [];
    BLOOD_DECALS = [];
    PORTAL_INWARD_MOTES = [];
    if (GameState.P) {
      GameState.P.cinematicPose = null;
      GameState.P.alpha = 1.0;
      GameState.P.dead = false;
      GameState.P.weaponLowered = false;
    }
  },

  canSkip() {
    const cine = _activeCinematic;
    return !!cine && CinematicSafety.canSkip();
  },

  // ─────────────────────────────────────────────────────────────
  // 1. START — Confirmed Warden Death
  // ─────────────────────────────────────────────────────────────
  start(boss, hitInfo = {}, isDebug = false, options = {}) {
    const isReplay = (typeof options === 'boolean') ? options : !!(options.isReplay || hitInfo.isReplay || isDebug);
    CinematicSafety.startCinematic('boss_defeat_warden', typeof options === 'object' ? options : { isReplay });

    if (!isReplay && SaveSystem && SaveSystem.recordCinematicUnlock) {
      SaveSystem.recordCinematicUnlock('boss_defeat_warden');
    }

    if (isDebug || isReplay) {
      this.reset();
    } else {
      if (this.isActive()) return;
      if (_wardenDefeatStarted) return;
    }
    _wardenDefeatStarted = true;

    if (!isReplay) {
      AchievementSystem.unlock('boss_slayer');
      if (GameState.BESTIARY_KILLS) {
        GameState.BESTIARY_KILLS.warden = (GameState.BESTIARY_KILLS.warden || 0) + 1;
        SaveSystem.saveBestiary();
      }
    }

    const { P } = GameState;
    const bossRef = boss || GameState.BOSS;
    if (!bossRef) {
      if (isReplay) {
        CinematicSafety.finishReplay();
      }
      return;
    }

    // Halt gameplay controls, boss AI, and normal combat immediately
    GameState.BOSS_INTRO_ACTIVE = false;
    GameState.ACTIVE_BOSS_INTRO = null;
    GameState.BOSS_AI_ACTIVE = false;
    GameState.BOSS_DEAD = true;
    GameState.FADE = 0;
    GameState.FADEIN = false;
    bossRef.alive = false;
    bossRef.isDefeatedCinematic = true;
    bossRef.hp = 0;
    bossRef.vaporizeProg = 0;
    bossRef.collapseProg = 0;
    bossRef.kneeFallProg = 0;
    bossRef.weaponDropped = false;
    bossRef.recoilOffset = { x: 0, y: 0 };
    bossRef.eyeGlow = 1.0;
    GameState.BOSS_PORTAL_UNLOCKED = false;
    GameState.levelTransitionActive = false;

    // Capture exact combat positions & facing
    const px = P ? P.x : bossRef.x - 2.0;
    const py = P ? P.y : bossRef.y;
    const bx = bossRef.x;
    const by = bossRef.y;
    const dx = bx - px;
    const facing = dx >= 0 ? 1 : -1;

    // Rowan remains grounded in his combat spot — NO TELEPORTING
    if (P) {
      P.vx = 0;
      P.vy = 0;
      P.dead = false;
      P.dying = false;
      P.cinematicPose = null;
      P.alpha = 1.0;
      P.fx = facing;
      P.fy = 0;
      P.invulnerable = true;
      P.animState = 'idle';
      P.weaponLowered = false;
      P.walkCycle = 0;
    }

    const equippedWeapon = (P && (P.activeWeapon || P.equippedWeapon)) ? (P.activeWeapon || P.equippedWeapon) : (hitInfo.weapon || 'sword');

    // Portal emerges directly where the Warden falls
    const portalX = bx;
    const portalY = by - 0.15;

    // Clear particles
    DISSOLUTION_PARTICLES = [];
    COMBAT_SPARKS = [];
    BLOOD_DECALS = [];
    PORTAL_INWARD_MOTES = [];

    // Initial impact blood decal & combat sparks at the impact point
    BLOOD_DECALS.push({
      x: (bx + 0.5) * T - facing * 8,
      y: (by + 0.5) * T + 10,
      rx: 14,
      ry: 7
    });

    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * 6.28;
      const spd = 25 + Math.random() * 50;
      COMBAT_SPARKS.push({
        x: (bx + 0.5) * T - facing * 12,
        y: (by + 0.5) * T,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 1.0 + Math.random() * 1.8,
        col: Math.random() < 0.5 ? '#fde047' : '#f97316',
        life: 1.0
      });
    }

    // Initialize cinematic state machine
    _activeCinematic = {
      timer: 0,
      hitStopActive: true,
      hitStopDuration: WARDEN_TIMELINE.HIT_STOP,
      equippedWeapon,
      isCrit: !!hitInfo.isCrit,
      boss: bossRef,
      rowan: {
        startX: px,
        startY: py,
        currentX: px,
        currentY: py,
        facing,
        weaponLowered: false
      },
      portal: {
        x: portalX,
        y: portalY,
        radius: 0,
        targetRadius: 28,
        swirl: 0,
        pulse: 0,
        alpha: 0,
        isStable: false
      },
      camera: {
        targetX: (px + bx) / 2,
        targetY: (py + by) / 2,
        currentX: (px + bx) / 2,
        currentY: (py + by) / 2,
        zoom: 1.18,
        targetZoom: 1.18
      },
      branch: null,
      flashAlpha: 0.40,
      soundCues: {}
    };

    // Set authoritative game state
    GameState.setState(GameStates.BOSS_DEFEAT_CINEMATIC);

    // Initial audio cue: powerful final impact & weapon ring
    SoundManager.snd('impact_hit');
    SoundManager.snd('weapon_clang');
    if (GameState.CAM) GameState.CAM.shk = 6.0;

    EventBus.emit('cinematic:warden_defeat:started', { weapon: equippedWeapon });
  },

  // ─────────────────────────────────────────────────────────────
  // 2. TICK — Continuous Master Choreography
  // ─────────────────────────────────────────────────────────────
  tick(dt) {
    const cine = _activeCinematic;
    if (!cine) return;

    if (cine.paused) {
      if (GameState.CAM) {
        GameState.CAM.tx = cine.camera.targetX;
        GameState.CAM.ty = cine.camera.targetY;
        GameState.CAM.tz = cine.camera.targetZoom;
        GameState.CAM.x = cine.camera.currentX;
        GameState.CAM.y = cine.camera.currentY;
        GameState.CAM.z = cine.camera.zoom;
      }
      return;
    }

    // 0. Micro hit-stop freeze (100ms)
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
      cine.flashAlpha = Math.max(0, cine.flashAlpha - dt * 2.5);
    }

    // Letterbox interpolation
    LETTERBOX.amount += (LETTERBOX.target - LETTERBOX.amount) * Math.min(1, dt * 3.0);

    // Update combat sparks
    for (let i = COMBAT_SPARKS.length - 1; i >= 0; i--) {
      const sp = COMBAT_SPARKS[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt * 3.2;
      if (sp.life <= 0) COMBAT_SPARKS.splice(i, 1);
    }

    // ─────────────────────────────────────────────────────────
    // TIMELINE PHASES
    // ─────────────────────────────────────────────────────────

    // --- PHASE 1: FINAL HIT RECOIL (0.10s – 1.00s) ---
    if (t < WARDEN_TIMELINE.IMPACT_RECOIL) {
      const p1 = t / WARDEN_TIMELINE.IMPACT_RECOIL;
      cine.camera.targetX = (cine.rowan.currentX + boss.x) / 2;
      cine.camera.targetY = (cine.rowan.currentY + boss.y) / 2;
      cine.camera.targetZoom = 1.18;

      // Warden recoils back along impact line
      boss.recoilOffset = {
        x: cine.rowan.facing * Math.sin(p1 * Math.PI) * 0.35,
        y: 0
      };
      boss.crackedArmor = true;

      // Rowan remains grounded in combat follow-through
      if (P) {
        P.x = cine.rowan.currentX;
        P.y = cine.rowan.currentY;
        P.fx = cine.rowan.facing;
      }
    }

    // --- PHASE 2: WARDEN STAGGER & COLLAPSE (1.00s – 3.00s) ---
    else if (t >= WARDEN_TIMELINE.IMPACT_RECOIL && t < WARDEN_TIMELINE.STAGGER_COLLAPSE) {
      const p2 = (t - 1.00) / 2.00;
      boss.recoilOffset = { x: 0, y: 0 };

      // Camera slowly pans slightly toward the fallen Warden
      cine.camera.targetX = boss.x * 0.65 + cine.rowan.currentX * 0.35;
      cine.camera.targetY = boss.y * 0.65 + cine.rowan.currentY * 0.35;
      cine.camera.targetZoom = 1.15;

      // Warden weapon slips and hits the floor at t = 1.5s
      if (t >= 1.50 && !boss.weaponDropped) {
        boss.weaponDropped = true;
        SoundManager.snd('weapon_clang');
        SoundManager.snd('iron_scrape');
        if (GameState.CAM) GameState.CAM.shk = 3.5;
      }

      // Warden drops to one knee then collapses prone
      if (t >= 1.60 && t < 2.40) {
        boss.kneeFallProg = Math.min(1.0, (t - 1.60) / 0.80);
      } else if (t >= 2.40) {
        boss.kneeFallProg = 1.0;
        boss.collapseProg = Math.min(1.0, (t - 2.40) / 0.55);
      }

      // Rowan lowers weapon and breathes (grounded in place)
      if (t >= 2.20 && !cine.rowan.weaponLowered) {
        cine.rowan.weaponLowered = true;
        if (P) {
          P.weaponLowered = true;
          P.animState = 'idle';
        }
      }

      // Environmental subtle response: light rumble and torches flicker once
      if (t >= 2.00 && !cine.soundCues.roomResponse) {
        cine.soundCues.roomResponse = true;
        SoundManager.playTone(55, 'sine', 0.8, 0.15, 60);
        if (GameState.TORCHES) {
          GameState.TORCHES.forEach(tor => { tor.flicker = 1.0; });
        }
      }

      // Music ceases upon collapse for true dramatic silence hold
      if (t >= 2.50 && !cine.soundCues.stopMusic) {
        cine.soundCues.stopMusic = true;
        if (MusicManager && MusicManager.stop) MusicManager.stop(1.2);
      }
    }

    // --- PHASE 3: WARDEN DISSOLUTION (3.00s – 6.00s) ---
    else if (t >= WARDEN_TIMELINE.STAGGER_COLLAPSE && t < WARDEN_TIMELINE.DISSOLUTION) {
      const p3 = (t - 3.00) / 3.00;
      boss.kneeFallProg = 1.0;
      boss.collapseProg = 1.0;
      boss.vaporizeProg = Math.min(1.0, p3 * 1.1);

      // Camera gently pushes toward the dissolving body
      cine.camera.targetX = boss.x * 0.75 + cine.rowan.currentX * 0.25;
      cine.camera.targetY = boss.y * 0.75 + cine.rowan.currentY * 0.25;
      cine.camera.targetZoom = 1.20;

      // Rising supernatural sound
      if (!cine.soundCues.dissolveSound) {
        cine.soundCues.dissolveSound = true;
        SoundManager.playTone(280, 'sine', 0.85, 0.10, 160);
      }

      // Spawn controlled dissolution particles:
      // All particles detach from Warden body and flow inward to portal origin (cine.portal.x, cine.portal.y)
      const targetPX = (cine.portal.x + 0.5) * T;
      const targetPY = (cine.portal.y + 0.5) * T;

      if (DISSOLUTION_PARTICLES.length < 55 && Math.random() < 0.75) {
        const spreadX = (Math.random() - 0.5) * 44;
        const spreadY = (Math.random() - 0.5) * 32;
        const startX = (boss.x + 0.5) * T + spreadX;
        const startY = (boss.y + 0.5) * T + spreadY;
        const ang = Math.atan2(targetPY - startY, targetPX - startX) + (Math.random() - 0.5) * 0.8;
        const spd = 20 + Math.random() * 35;

        DISSOLUTION_PARTICLES.push({
          x: startX,
          y: startY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 1.2 + Math.random() * 2.0,
          alpha: 0.9,
          col: Math.random() < 0.4 ? '#c084fc' : Math.random() < 0.7 ? '#a855f7' : '#e0e7ff',
          life: 1.0
        });
      }

      // Update dissolution particles toward the central compression point
      for (let i = DISSOLUTION_PARTICLES.length - 1; i >= 0; i--) {
        const dp = DISSOLUTION_PARTICLES[i];
        const dx = targetPX - dp.x;
        const dy = targetPY - dp.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 4 || dp.life <= 0) {
          DISSOLUTION_PARTICLES.splice(i, 1);
          continue;
        }

        // Smooth gravitational curve toward the portal center
        dp.vx += (dx / dist) * 120 * dt;
        dp.vy += (dy / dist) * 120 * dt;
        dp.x += dp.vx * dt;
        dp.y += dp.vy * dt;
        dp.life -= dt * 0.75;
      }
    }

    // --- PHASE 4: PORTAL FORMATION (6.00s – 8.00s) ---
    else if (t >= WARDEN_TIMELINE.DISSOLUTION && t < WARDEN_TIMELINE.PORTAL_FORMING) {
      boss.vaporizeProg = 1.0;
      const p4 = (t - 6.00) / 2.00;

      // Camera pulls back to frame both Rowan and the growing portal
      cine.camera.targetX = (cine.rowan.currentX + cine.portal.x) / 2;
      cine.camera.targetY = (cine.rowan.currentY + cine.portal.y) / 2;
      cine.camera.targetZoom = 1.08;

      // Portal expands from singularity into full living portal
      cine.portal.radius = Math.min(cine.portal.targetRadius, p4 * cine.portal.targetRadius * 1.15);
      cine.portal.alpha = Math.min(1.0, p4 * 1.6);
      cine.portal.swirl += dt * 2.4;
      cine.portal.pulse = Math.sin(t * 4.0) * 1.5;

      // Energy pulse sound when portal opens
      if (!cine.soundCues.portalBurst) {
        cine.soundCues.portalBurst = true;
        SoundManager.snd('portal_enter');
        SoundManager.snd('shockwave');
        cine.flashAlpha = 0.55;
        if (GameState.CAM) GameState.CAM.shk = 5.0;

        // Distant torches briefly react to the gathering dark energy
        if (GameState.TORCHES) {
          GameState.TORCHES.forEach(tor => {
            tor.flicker = 1.0;
            tor.dim = 0.45;
          });
        }
      }

      this._tickPortalInwardMotes(dt, cine.portal.x, cine.portal.y);
    }

    // --- PHASE 5: ROWAN'S REACTION BEAT (8.00s – 9.50s) ---
    else if (t >= WARDEN_TIMELINE.PORTAL_FORMING && t < WARDEN_TIMELINE.ROWAN_REACTION) {
      cine.portal.isStable = true;
      cine.portal.radius = cine.portal.targetRadius;
      cine.portal.alpha = 1.0;
      cine.portal.swirl += dt * 2.2;
      cine.portal.pulse = Math.sin(t * 3.5) * 1.2;

      // Two-shot composition: Rowan grounded in foreground, living portal in front of him
      cine.camera.targetX = (cine.rowan.currentX + cine.portal.x) / 2;
      cine.camera.targetY = (cine.rowan.currentY + cine.portal.y) / 2;
      cine.camera.targetZoom = 1.05;

      // Rowan stands grounded in place, looking directly at the portal
      if (P) {
        P.animState = 'idle';
        P.weaponLowered = true;
        P.fx = cine.portal.x >= cine.rowan.currentX ? 1 : -1;
      }

      // Register portal as a real, persistent world object on floor
      if (!_portalCreatedInWorld) {
        _portalCreatedInWorld = true;
        GameState.BOSS_PORTAL_UNLOCKED = true;
      }

      this._tickPortalInwardMotes(dt, cine.portal.x, cine.portal.y);
    }

    // --- PHASE 6: ROWAN DELIBERATELY ENTERS PORTAL (9.50s – 12.00s) ---
    else if (t >= WARDEN_TIMELINE.ROWAN_REACTION && t < WARDEN_TIMELINE.ROWAN_WALK) {
      const walkProgress = Math.min(1.0, (t - 9.50) / 2.30);
      cine.portal.swirl += dt * (2.2 + walkProgress * 2.0); // accelerates as Rowan enters
      cine.portal.pulse = Math.sin(t * (3.5 + walkProgress * 3.0)) * 2.0;

      // Rowan takes deliberate grounded steps from his spot directly to portal center
      const startX = cine.rowan.startX;
      const startY = cine.rowan.startY;
      const endX = cine.portal.x;
      const endY = cine.portal.y;

      const curX = startX + (endX - startX) * walkProgress;
      const curY = startY + (endY - startY) * walkProgress;
      cine.rowan.currentX = curX;
      cine.rowan.currentY = curY;

      if (P) {
        P.x = curX;
        P.y = curY;
        P.fx = endX >= startX ? 1 : -1;
        P.animState = walkProgress < 0.95 ? 'walk' : 'idle';
        P.walkCycle = (P.walkCycle || 0) + dt * 7.5; // True footfall cycle
      }

      // Camera tracks Rowan as he approaches the threshold
      cine.camera.targetX = curX * 0.4 + endX * 0.6;
      cine.camera.targetY = curY * 0.4 + endY * 0.6;
      cine.camera.targetZoom = 1.12;

      // Portal reacts as Rowan crosses the boundary
      if (walkProgress >= 0.70 && !cine.soundCues.portalSwell) {
        cine.soundCues.portalSwell = true;
        SoundManager.playTone(180, 'sine', 1.0, 0.15, 320);
      }

      this._tickPortalInwardMotes(dt, cine.portal.x, cine.portal.y);
    }

    // --- PHASE 7: PORTAL TRAVERSAL & ENDING TRANSITION (12.00s – 14.50s) ---
    else if (t >= WARDEN_TIMELINE.ROWAN_WALK) {
      // Calculate and lock ending branch exactly once from run state
      if (!cine.branch) {
        cine.branch = calculateEndingBranch();
        _endingBranchLocked = true;
      }

      cine.portal.swirl += dt * 4.5;

      // Controlled aperture progression: deliberate hold beat at 13.80s - 14.40s
      if (t < 13.80) {
        cine.portal.radius = Math.min(32, cine.portal.radius + dt * 10);
      } else {
        // Deliberate ominous hold beat before handoff
        cine.portal.radius = 32 + Math.sin((t - 13.80) * 8.0) * 0.8;
      }

      // Keep Rowan positioned inside portal center
      if (P) {
        P.x = cine.portal.x;
        P.y = cine.portal.y;
        P.animState = 'idle';
      }

      cine.camera.targetX = cine.portal.x;
      cine.camera.targetY = cine.portal.y;
      cine.camera.targetZoom = 1.18;

      this._tickPortalInwardMotes(dt, cine.portal.x, cine.portal.y);

      // Complete to ending branch at 14.50s
      if (t >= WARDEN_TIMELINE.HANDOFF && !_endingHandoffTriggered) {
        _endingHandoffTriggered = true;
        this.completeToEnding(cine.branch);
        return;
      }
    }

    // Synchronize cinematic boss state to GameState.BOSS for CharacterRenderer
    if (GameState.BOSS) {
      GameState.BOSS.isDefeatedCinematic = true;
      GameState.BOSS.recoilOffset = boss.recoilOffset;
      GameState.BOSS.kneeFallProg = boss.kneeFallProg;
      GameState.BOSS.collapseProg = boss.collapseProg;
      GameState.BOSS.vaporizeProg = boss.vaporizeProg;
      GameState.BOSS.weaponDropped = boss.weaponDropped;
      GameState.BOSS.staggerAngle = boss.staggerAngle;
      GameState.BOSS.eyeGlow = Math.max(0, 1.0 - (boss.vaporizeProg || 0) * 1.5);
    }

    // Smooth camera interpolation
    cine.camera.currentX += (cine.camera.targetX - cine.camera.currentX) * dt * 3.5;
    cine.camera.currentY += (cine.camera.targetY - cine.camera.currentY) * dt * 3.5;
    cine.camera.zoom += (cine.camera.targetZoom - cine.camera.zoom) * dt * 2.8;

    if (GameState.CAM) {
      GameState.CAM.tx = cine.camera.targetX;
      GameState.CAM.ty = cine.camera.targetY;
      GameState.CAM.tz = cine.camera.targetZoom;
      GameState.CAM.x = cine.camera.currentX;
      GameState.CAM.y = cine.camera.currentY;
      GameState.CAM.z = cine.camera.zoom;
    }
  },

  completeToEnding(branch) {
    const targetBranch = branch || calculateEndingBranch();
    if (CinematicSafety.isReplay()) {
      _activeCinematic = null;
      LETTERBOX.amount = 0;
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }

    _activeCinematic = null;
    LETTERBOX.amount = 0;

    GameState.BOSS_PORTAL_UNLOCKED = true;
    GameState.BOSS_DEAD = true;

    EventBus.emit('cinematic:warden_defeat:finished', { branch: targetBranch });

    // Handoff authoritatively to the central ending dispatcher (exactly one canonical ending)
    EndingDispatcher.resolveAndStart(targetBranch);
  },

  // ─────────────────────────────────────────────────────────────
  // 4. SAFE SKIP (Preserves Portal, Position, & Run Branch)
  // ─────────────────────────────────────────────────────────────
  skip() {
    if (!this.isActive() || !this.canSkip()) return;
    if (CinematicSafety.isReplay()) {
      _activeCinematic = null;
      LETTERBOX.amount = 0;
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }
    const cine = _activeCinematic;
    const branch = cine.branch || calculateEndingBranch();

    // Fast-forward: Boss is dissolved, portal is created at (bx, by), Rowan enters
    cine.boss.weaponDropped = true;
    cine.boss.collapseProg = 1.0;
    cine.boss.vaporizeProg = 1.0;
    _portalCreatedInWorld = true;
    GameState.BOSS_PORTAL_UNLOCKED = true;

    if (GameState.P) {
      GameState.P.x = cine.portal.x;
      GameState.P.y = cine.portal.y;
      GameState.P.weaponLowered = true;
    }

    this.completeToEnding(branch);
  },

  // ─────────────────────────────────────────────────────────────
  // 5. DRAW FLOOR ENTITIES (Rendered under characters in world-space)
  // ─────────────────────────────────────────────────────────────
  drawFloorEntities(ctx) {
    const cine = _activeCinematic;
    if (!cine) return;

    const t = cine.timer;
    const boss = cine.boss;
    const bx = (boss.x + 0.5) * T;
    const by = (boss.y + 0.5) * T;

    // 1. Blood Decals on stone tiles
    BLOOD_DECALS.forEach(b => {
      ctx.save();
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 2. Fallen Dreadblade on stones
    if (boss.weaponDropped && t < WARDEN_TIMELINE.DISSOLUTION) {
      ctx.save();
      ctx.translate(bx + 24, by + 16);
      ctx.rotate(0.68);
      // Floor shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(-6, 3, 14, 82);
      // Obsidian Blade
      ctx.fillStyle = '#1c0404';
      ctx.fillRect(-6, -42, 12, 82);
      // Runic Core Groove
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-2, -38, 4, 74);
      // Crossguard
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-14, 26, 28, 7);
      ctx.restore();
    }

    // 3. Ground Glow under the Portal
    if (cine.portal.radius > 2) {
      ctx.save();
      const ppx = (cine.portal.x + 0.5) * T;
      const ppy = (cine.portal.y + 0.5) * T;
      const glowR = Math.max(3, cine.portal.radius * 1.5);

      const floorGlow = ctx.createRadialGradient(ppx, ppy + 4, 2, ppx, ppy + 4, glowR);
      floorGlow.addColorStop(0, `rgba(220, 38, 38, ${0.40 * cine.portal.alpha})`);
      floorGlow.addColorStop(0.55, `rgba(127, 29, 29, ${0.22 * cine.portal.alpha})`);
      floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = floorGlow;
      ctx.beginPath();
      ctx.ellipse(ppx, ppy + 4, glowR * 1.25, glowR * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Concentric floor patterns catching a faint, controlled red reflection (t >= 6.8s)
    if (t >= 6.8 && cine.portal.radius > 2) {
      const ppx = (cine.portal.x + 0.5) * T;
      const ppy = (cine.portal.y + 0.5) * T;
      const reflAlpha = Math.min(0.35, (t - 6.8) * 0.22) * (0.8 + Math.sin(t * 3.0) * 0.2);

      ctx.save();
      [30, 52, 74].forEach((r, idx) => {
        ctx.strokeStyle = `rgba(225, 29, 72, ${reflAlpha * (1.0 - idx * 0.25)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(ppx, ppy + 6, r, r * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    // 5. Outward dark-to-crimson wave across the nearby floor at portal activation (t >= 8.0s)
    if (t >= WARDEN_TIMELINE.PORTAL_FORMING) {
      const waveAge = (t - WARDEN_TIMELINE.PORTAL_FORMING);
      const waveProg = (waveAge % 2.5) / 2.5;
      const waveR = 8 + waveProg * 72;
      const waveAlpha = (1.0 - waveProg) * 0.42;
      const ppx = (cine.portal.x + 0.5) * T;
      const ppy = (cine.portal.y + 0.5) * T;

      ctx.save();
      ctx.strokeStyle = `rgba(220, 38, 38, ${waveAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(ppx, ppy + 4, waveR, waveR * 0.58, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(244, 63, 94, ${waveAlpha * 0.5})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(ppx, ppy + 4, Math.max(0, waveR - 6), Math.max(0, waveR - 6) * 0.58, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 6. DRAW WORLD ENTITIES (Rendered around characters in world-space)
  // ─────────────────────────────────────────────────────────────
  drawWorldEntities(ctx) {
    const cine = _activeCinematic;
    if (!cine) return;

    const t = cine.timer;

    // 1. Dissolution Particles streaming into the portal center
    DISSOLUTION_PARTICLES.forEach(dp => {
      ctx.save();
      ctx.globalAlpha = dp.alpha * (dp.life || 1.0);
      ctx.fillStyle = dp.col;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 2. Combat Sparks from final hit
    COMBAT_SPARKS.forEach(sp => {
      ctx.save();
      ctx.globalAlpha = sp.life;
      ctx.fillStyle = sp.col;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. The Real Animated Cosmic Portal
    if (cine.portal.radius > 0) {
      this._drawLivingPortal(ctx, cine.portal, t, cine.branch);
    }

    // 4. Portal energy wrapping around Rowan during entry (Ruby / crimson energy threads)
    if (t >= WARDEN_TIMELINE.ROWAN_WALK && GameState.P) {
      const ppx = (GameState.P.x + 0.5) * T;
      const ppy = (GameState.P.y + 0.5) * T;
      const wrapAlpha = Math.min(0.65, (t - WARDEN_TIMELINE.ROWAN_WALK) / 1.5);

      ctx.save();
      ctx.globalAlpha = wrapAlpha;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ppx, ppy, 16, cine.portal.swirl * 1.5, cine.portal.swirl * 1.5 + 4.2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Controlled ruby rim highlight on Rowan's silhouette during portal approach
    if (t >= WARDEN_TIMELINE.ROWAN_REACTION && GameState.P) {
      const ppx = (GameState.P.x + 0.5) * T;
      const ppy = (GameState.P.y + 0.5) * T;
      const rimAlpha = Math.min(0.55, (t - 9.5) / 1.5) * (0.85 + Math.sin(t * 4.0) * 0.15);

      ctx.save();
      ctx.globalAlpha = rimAlpha;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      // Facing contour rim
      const dir = (cine.portal.x >= cine.rowan.currentX) ? 1 : -1;
      ctx.arc(ppx, ppy - 4, 11, dir > 0 ? -0.8 : 2.3, dir > 0 ? 0.8 : 3.9);
      ctx.stroke();
      ctx.restore();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 7. DRAW SCREEN OVERLAYS (Screen-space letterbox, vignetting, skip)
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    const cine = _activeCinematic;
    if (!cine) return;

    const t = cine.timer;
    const barH = LETTERBOX.maxHeight * LETTERBOX.amount;

    ctx.save();

    // 1. Cinematic Screen Flash
    if (cine.flashAlpha > 0) {
      ctx.fillStyle = `rgba(243, 232, 255, ${cine.flashAlpha})`;
      ctx.fillRect(0, 0, LW, LH);
    }

    // 2. Arena Darkens Toward Edges & Ruby Atmospheric Light (t >= 6.8s)
    if (t >= 6.8) {
      const darkAlpha = Math.min(0.52, (t - 6.8) * 0.18);
      const edgeVignette = ctx.createRadialGradient(LW / 2, LH / 2, 75, LW / 2, LH / 2, LW * 0.72);
      edgeVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      edgeVignette.addColorStop(0.5, 'rgba(8, 2, 6, 0.2)');
      edgeVignette.addColorStop(1, `rgba(2, 1, 4, ${darkAlpha})`);
      ctx.fillStyle = edgeVignette;
      ctx.fillRect(0, barH, LW, LH - barH * 2);

      // Subtle atmospheric ruby light wash near portal base
      const rubyWash = ctx.createRadialGradient(LW / 2, LH * 0.62, 15, LW / 2, LH * 0.62, 110);
      rubyWash.addColorStop(0, `rgba(220, 38, 38, ${darkAlpha * 0.28})`);
      rubyWash.addColorStop(0.6, 'rgba(127, 29, 29, 0.08)');
      rubyWash.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rubyWash;
      ctx.fillRect(0, barH, LW, LH - barH * 2);
    }

    // 3. Top and Bottom Letterbox Bars
    if (barH > 0) {
      ctx.fillStyle = '#020205';
      ctx.fillRect(0, 0, LW, barH);
      ctx.fillRect(0, LH - barH, LW, barH);

      // Gold filigree edge lines on letterbox
      ctx.fillStyle = 'rgba(217, 119, 6, 0.40)';
      ctx.fillRect(0, barH - 1, LW, 1);
      ctx.fillRect(0, LH - barH, LW, 1);
    }

    // 3. Traversal Atmosphere Shift
    if (t >= WARDEN_TIMELINE.ROWAN_WALK) {
      const travProg = Math.min(1.0, (t - WARDEN_TIMELINE.ROWAN_WALK) / 2.5);
      const branch = cine.branch || 'hero';

      if (branch === 'hero') {
        // Warm golden dawn tint
        ctx.fillStyle = `rgba(251, 191, 36, ${0.18 * travProg})`;
        ctx.fillRect(0, barH, LW, LH - barH * 2);
      } else if (branch === 'betrayal') {
        // Cold eerie violet/blue tint
        ctx.fillStyle = `rgba(129, 140, 248, ${0.20 * travProg})`;
        ctx.fillRect(0, barH, LW, LH - barH * 2);
      } else {
        // Aggressive crimson tint
        ctx.fillStyle = `rgba(239, 68, 68, ${0.22 * travProg})`;
        ctx.fillRect(0, barH, LW, LH - barH * 2);
      }
    }

    // 4. Cinematic Narrative Subtitles
    let sub = '';
    if (t < 1.0) {
      sub = 'The fatal strike shatters the abyssal core...';
    } else if (t < 1.6) {
      sub = 'The Warden staggers... fighting against the inevitable.';
    } else if (t < 2.2) {
      sub = 'Torches flicker. Wall chains groan as the Sunken Citadel trembles.';
    } else if (t < 2.8) {
      sub = 'A final, defiant gaze through the cracked visor...';
    } else if (t < 3.4) {
      sub = 'The colossal dreadblade slips and crashes to the stones.';
    } else if (t < 4.2) {
      sub = 'The titan drops to one knee. Five centuries of guardianship ends.';
    } else if (t < 5.2) {
      sub = 'With a heavy crash, the titan collapses upon the dais.';
    } else if (t < 6.8) {
      sub = 'Silence blankets the throne room. The Abyss holds its breath.';
    } else if (t < 9.0) {
      sub = 'Dark energy dissolves inward into a collapsing singularity...';
    } else if (t < 11.5) {
      sub = 'The gateway tears open. The path beyond lies revealed.';
    } else if (t < 13.8) {
      sub = 'Rowan approaches the living cosmic threshold...';
    } else {
      sub = 'Destiny awaits beyond the void.';
    }
    if (sub) {
      this._drawCinematicSubtitle(ctx, sub, '#fed7aa', barH);
    }

    // 5. Subtle Skip Prompt (Shown only after 3.0s unskippable window)
    if (this.canSkip() && CinematicSafety.shouldShowSkipHint()) {
      const skipAlpha = Math.min(0.55, (t - 1.5) / 0.8);
      ctx.fillStyle = `rgba(201, 168, 76, ${skipAlpha})`;
      ctx.font = 'bold 9px "Cinzel", Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText('SPACE / CLICK TO SKIP', LW - 18, LH - barH - 8);
    }

    ctx.restore();
  },

  _drawCinematicSubtitle(ctx, text, col = '#fed7aa', barH = 0) {
    if (!text) return;
    const cx = LW / 2;
    const cy = LH - Math.max(22, barH + 12);

    ctx.save();
    ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
    const textW = ctx.measureText(text).width;
    const padX = 14;
    const padY = 5;
    const pillW = textW + padX * 2;
    const pillH = 18;

    ctx.fillStyle = 'rgba(2, 4, 10, 0.85)';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 1;
    ctx.fillRect(cx - pillW / 2, cy - pillH / 2, pillW, pillH);
    ctx.strokeRect(cx - pillW / 2, cy - pillH / 2, pillW, pillH);

    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = col;
    ctx.shadowBlur = 6;
    ctx.fillText(text, cx, cy);
    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // 8. PROCEDURAL LIVING PORTAL RENDERER
  // ─────────────────────────────────────────────────────────────
  _drawLivingPortal(ctx, portal, t, branch) {
    if (!portal) return;
    const ppx = portal.x * T;
    const ppy = portal.y * T;

    // Authoritative delegation to PortalTransition with Abyss Warden Ending Portal profile
    if (PortalTransition && PortalTransition.drawWorldPortal) {
      PortalTransition.drawWorldPortal(ctx, ppx, ppy, T, PORTAL_CONTEXTS.ABYSS_WARDEN_ENDING_PORTAL);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 9. INWARD PORTAL MOTES CONTROLLER
  // ─────────────────────────────────────────────────────────────
  _tickPortalInwardMotes(dt, portalX, portalY) {
    const targetX = (portalX + 0.5) * T;
    const targetY = (portalY + 0.5) * T;

    if (PORTAL_INWARD_MOTES.length < 24 && Math.random() < 0.65) {
      const ang = Math.random() * 6.28;
      const dist = 32 + Math.random() * 38;
      PORTAL_INWARD_MOTES.push({
        x: targetX + Math.cos(ang) * dist,
        y: targetY + Math.sin(ang) * dist * 0.75,
        targetX,
        targetY,
        spd: 35 + Math.random() * 45,
        r: 0.9 + Math.random() * 1.5,
        col: Math.random() < 0.35 ? '#fde047' : (Math.random() < 0.7 ? '#f43f5e' : '#dc2626')
      });
    }

    for (let i = PORTAL_INWARD_MOTES.length - 1; i >= 0; i--) {
      const m = PORTAL_INWARD_MOTES[i];
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 3) {
        PORTAL_INWARD_MOTES.splice(i, 1);
        continue;
      }

      m.x += (dx / dist) * m.spd * dt;
      m.y += (dy / dist) * m.spd * dt;
    }
  }
};

// ─────────────────────────────────────────────────────────────
// Global Window API & Developer Debug Suite (Parts 23 & Acceptance Test)
// ─────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.WardenDefeatCinematic = WardenDefeatCinematic;

  // Primary Debug Trigger
  window.triggerWardenDefeat = function(weapon = 'sword', isCrit = false) {
    WardenDefeatCinematic.reset();
    EndingDispatcher.reset();

    GameState.LV = 10;
    GameState.clearLevelEntities();
    if (BossArenaGenerator && BossArenaGenerator.build) {
      BossArenaGenerator.build(10);
    } else if (window.buildBossArena) {
      window.buildBossArena(10);
    } else if (window.DB_FLOOR && window.DB_FLOOR.loadLevel) {
      window.DB_FLOOR.loadLevel(10);
    }

    // Dismiss any boss intro, clear screen fade, and halt boss AI
    GameState.BOSS_INTRO_ACTIVE = false;
    GameState.ACTIVE_BOSS_INTRO = null;
    GameState.BOSS_AI_ACTIVE = false;
    GameState.FADE = 0;
    GameState.FADEIN = false;
    if (typeof window !== 'undefined' && window.BossIntros && window.BossIntros.skip) {
      try { window.BossIntros.skip(); } catch (e) {}
    }
    GameState.BOSS_INTRO_ACTIVE = false;
    GameState.ACTIVE_BOSS_INTRO = null;
    GameState.BOSS_AI_ACTIVE = false;
    GameState.FADE = 0;
    GameState.FADEIN = false;

    const rm = (GameState.ROOMS && GameState.ROOMS[0]) ? GameState.ROOMS[0] : null;
    const cx = rm ? rm.cx : 24;
    const cy = rm ? rm.cy : 16;
    const throneY = rm ? rm.throneY : (cy - 6);

    // Place Rowan in combat distance from the Warden
    GameState.P.x = cx - 1.8;
    GameState.P.y = throneY + 1.5;
    GameState.P.dead = false;
    GameState.P.dying = false;
    GameState.P.activeWeapon = weapon;
    GameState.P.weaponLowered = false;

    // Place Warden
    GameState.BOSS = {
      id: 'abyss_warden',
      x: cx,
      y: throneY + 1.5,
      hp: 0,
      maxHp: 1000,
      phase: 3,
      alive: true,
      eyeGlow: 1.0,
      collapseProg: 0,
      kneeFallProg: 0,
      vaporizeProg: 0,
      weaponDropped: false,
      isDefeatedCinematic: true
    };

    if (GameState.CAM) {
      GameState.CAM.tx = cx - 0.9;
      GameState.CAM.ty = throneY + 1.5;
      GameState.CAM.x = cx - 0.9;
      GameState.CAM.y = throneY + 1.5;
      GameState.CAM.z = 1.18;
      GameState.CAM.tz = 1.18;
      GameState.CAM.shk = 6.0;
    }

    WardenDefeatCinematic.start(GameState.BOSS, { weapon, isCrit }, true);
  };

  window.testWardenDefeat = function() {
    window.triggerWardenDefeat('sword', true);
  };

  window.testWardenDissolution = function() {
    window.triggerWardenDefeat('sword', true);
    const cine = WardenDefeatCinematic.getActiveCinematic();
    if (cine) {
      cine.hitStopActive = false;
      cine.timer = WARDEN_TIMELINE.STAGGER_COLLAPSE + 0.1;
    }
  };

  window.testPortal = function() {
    window.triggerWardenDefeat('sword', true);
    const cine = WardenDefeatCinematic.getActiveCinematic();
    if (cine) {
      cine.hitStopActive = false;
      cine.timer = WARDEN_TIMELINE.PORTAL_FORMING + 0.1;
      cine.boss.weaponDropped = true;
      cine.boss.collapseProg = 1.0;
      cine.boss.vaporizeProg = 1.0;
      cine.portal.radius = cine.portal.targetRadius;
      cine.portal.alpha = 1.0;
    }
  };

  window.testHeroBranch = function() {
    GameState.P.saved = 3;
    GameState.P.san = 85;
    GameState.SANITY = 85;
    window.triggerWardenDefeat('sword', true);
    const cine = WardenDefeatCinematic.getActiveCinematic();
    if (cine) {
      cine.hitStopActive = false;
      cine.timer = WARDEN_TIMELINE.ROWAN_WALK + 0.1;
      cine.branch = 'hero';
    }
  };

  window.testBetrayalBranch = function() {
    GameState.P.saved = 2;
    GameState.P.san = 20;
    GameState.SANITY = 20;
    window.triggerWardenDefeat('dagger', true);
    const cine = WardenDefeatCinematic.getActiveCinematic();
    if (cine) {
      cine.hitStopActive = false;
      cine.timer = WARDEN_TIMELINE.ROWAN_WALK + 0.1;
      cine.branch = 'betrayal';
    }
  };

  window.testRampageBranch = function() {
    GameState.P.saved = 0;
    GameState.P.san = 15;
    GameState.SANITY = 15;
    window.triggerWardenDefeat('axe', true);
    const cine = WardenDefeatCinematic.getActiveCinematic();
    if (cine) {
      cine.hitStopActive = false;
      cine.timer = WARDEN_TIMELINE.ROWAN_WALK + 0.1;
      cine.branch = 'rampage';
    }
  };

  window.pauseWardenCinematic = function() {
    const cine = WardenDefeatCinematic.getActiveCinematic();
    if (cine) cine.paused = true;
  };

  window.resumeWardenCinematic = function() {
    const cine = WardenDefeatCinematic.getActiveCinematic();
    if (cine) cine.paused = false;
  };

  window.testWardenShot = function(shotNum = 1, pause = false) {
    window.triggerWardenDefeat('sword', true);
    const cine = WardenDefeatCinematic.getActiveCinematic();
    if (!cine) return;

    const shotTimes = [
      0.05,  // 1: Hit-stop
      0.50,  // 2: Recoil
      1.80,  // 3: Stagger
      2.50,  // 4: Weapon drop & collapse
      3.50,  // 5: Dissolution starts
      5.00,  // 6: Dissolution midway
      6.80,  // 7: Portal forming
      8.50,  // 8: Rowan reaction beat
      10.50, // 9: Rowan deliberate walk
      12.50  // 10: Traversal transition
    ];

    const targetTime = shotTimes[Math.max(0, Math.min(shotTimes.length - 1, shotNum - 1))];
    cine.hitStopActive = false;
    cine.hitStopDuration = 0;
    cine.timer = targetTime;
    cine.paused = !!pause;

    // Fast-forward character & portal visual states to match the target timeline
    if (GameState.P) {
      GameState.P.cinematicPose = null;
      GameState.P.alpha = 1.0;
      GameState.P.dead = false;
    }
    if (targetTime >= 1.00 && targetTime < 3.00) {
      cine.boss.recoilOffset = { x: 0, y: 0 };
      if (targetTime >= 1.50) cine.boss.weaponDropped = true;
      if (targetTime >= 1.60 && targetTime < 2.40) {
        cine.boss.kneeFallProg = Math.min(1.0, (targetTime - 1.60) / 0.80);
      } else if (targetTime >= 2.40) {
        cine.boss.kneeFallProg = 1.0;
        cine.boss.collapseProg = Math.min(1.0, (targetTime - 2.40) / 0.55);
      }
      if (targetTime >= 2.20) {
        cine.rowan.weaponLowered = true;
        if (GameState.P) {
          GameState.P.weaponLowered = true;
          GameState.P.animState = 'idle';
        }
      }
    } else if (targetTime >= 3.00 && targetTime < 6.00) {
      cine.boss.kneeFallProg = 1.0;
      cine.boss.collapseProg = 1.0;
      cine.boss.weaponDropped = true;
      const p3 = (targetTime - 3.00) / 3.00;
      cine.boss.vaporizeProg = Math.min(1.0, p3 * 1.1);
    } else if (targetTime >= 6.00) {
      cine.boss.kneeFallProg = 1.0;
      cine.boss.collapseProg = 1.0;
      cine.boss.vaporizeProg = 1.0;
      cine.boss.weaponDropped = true;

      if (targetTime >= 8.00) {
        cine.portal.radius = cine.portal.targetRadius;
        cine.portal.alpha = 1.0;
        cine.portal.isStable = true;
      } else {
        const p4 = (targetTime - 6.00) / 2.00;
        cine.portal.radius = cine.portal.targetRadius * Math.min(1.0, p4 * 1.25);
        cine.portal.alpha = Math.min(1.0, p4 * 1.4);
      }

      if (targetTime >= 9.50 && targetTime < 12.00) {
        const walkProgress = Math.min(1.0, (targetTime - 9.50) / 2.30);
        const curX = cine.rowan.startX + (cine.portal.x - cine.rowan.startX) * walkProgress;
        const curY = cine.rowan.startY + (cine.portal.y - cine.rowan.startY) * walkProgress;
        cine.rowan.currentX = curX;
        cine.rowan.currentY = curY;
        if (GameState.P) {
          GameState.P.x = curX;
          GameState.P.y = curY;
          GameState.P.animState = 'walk';
        }
      } else if (targetTime >= 12.00) {
        cine.rowan.currentX = cine.portal.x;
        cine.rowan.currentY = cine.portal.y;
        if (GameState.P) {
          GameState.P.x = cine.portal.x;
          GameState.P.y = cine.portal.y;
        }
      }
    }

    if (GameState.BOSS) {
      GameState.BOSS.isDefeatedCinematic = true;
      GameState.BOSS.recoilOffset = cine.boss.recoilOffset;
      GameState.BOSS.kneeFallProg = cine.boss.kneeFallProg;
      GameState.BOSS.collapseProg = cine.boss.collapseProg;
      GameState.BOSS.vaporizeProg = cine.boss.vaporizeProg;
      GameState.BOSS.weaponDropped = cine.boss.weaponDropped;
      GameState.BOSS.staggerAngle = cine.boss.staggerAngle;
      GameState.BOSS.eyeGlow = Math.max(0, 1.0 - (cine.boss.vaporizeProg || 0) * 1.5);
    }
  };
}
