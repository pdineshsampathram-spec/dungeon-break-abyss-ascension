// =====================================================================
//  DUNGEON BREAK — js/cinematics/CinematicDirector.js
//  Authoritative In-Engine Opening Cinematic V2: "THE DESCENT"
//  - Fully staged in the real Floor 1 dungeon environment
//  - Scripted Cinematic Actors with Grounding, Depth, and Realistic Acting
//  - Deserters realistically fleeing through the true doorway threshold
//  - Skeletons emerging, deliberate attack stances, dodge/parry, counter-cleaves
//  - Natural multi-frame collapses with persistent floor bodies
//  - Parallax foreground/background staging and seamless gameplay handover
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect, T } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { EventBus } from '../core/EventBus.js';
import { Camera } from '../rendering/Camera.js';
import { CharacterDefinitions } from '../rendering/CharacterDefinitions.js';
import { triggerCinematicBanner } from '../ui/HUD.js';
import { CINEMATIC_W, CINEMATIC_H } from './CinematicRenderer.js';
import { CinematicSafety } from './CinematicSafety.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export let THE_DESCENT = null;

// Legacy CI interface compatibility
export let CI = {
  type: 'intro',
  actors: [],
  lines: [],
  lineIdx: 0,
  lineFade: 0,
  lineLife: 0,
  letterbox: 0,
  done: false,
  typewriterText: '',
  typewriterTarget: '',
  typewriterTimer: 0
};

// ─────────────────────────────────────────────────────────────
// CINEMATIC ACTOR CLASS
// Distinct from gameplay entities; controlled purely by the timeline.
// ─────────────────────────────────────────────────────────────
export class CinematicActor {
  constructor(cfg) {
    this.id = cfg.id || Math.random();
    this.type = cfg.type; // 'rowan' | 'skeleton' | 'deserter'
    this.x = cfg.x;
    this.y = cfg.y;
    this.speed = cfg.speed || 2.0;
    this.facing = cfg.facing !== undefined ? cfg.facing : 1; // 1 = right, -1 = left

    // Grounding & Dimensions
    this.groundOffset = cfg.groundOffset !== undefined ? cfg.groundOffset : 13;
    this.shadowRadius = cfg.shadowRadius || 9;
    this.shadowScale = cfg.shadowScale || 1.0;

    // Animation & Posing
    this.state = cfg.state || 'idle'; // 'idle', 'walk', 'run', 'windup', 'swing', 'recoil', 'collapsed'
    this.walkCycle = Math.random() * 6.28;
    this.bodyBob = 0;
    this.armAngle = 0;
    this.weaponAngle = cfg.weaponAngle || 0.2;
    this.headAngle = 0;
    this.recoilOffset = 0;
    this.collapseProgress = 0;
    this.hitFlash = 0;
    this.eyeGlow = cfg.eyeGlow || 0;
    this.lookBack = cfg.lookBack || false;
    this.weaponKey = cfg.weaponKey || 'sword';

    // Scripted Waypoints
    this.waypoints = cfg.waypoints ? cfg.waypoints.map(w => ({ ...w })) : [];
    this.waypointIndex = 0;
    this.escaped = false;
  }

  addWaypoint(x, y, speed, facing, state) {
    this.waypoints.push({ x, y, speed, facing, state });
  }

  update(dt) {
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 3.5);

    if (this.state === 'collapsed') {
      this.collapseProgress = Math.min(1.0, (this.collapseProgress || 0) + dt * 4.0);
      return;
    }

    // Follow scripted waypoints with smooth interpolation
    if (this.waypointIndex < this.waypoints.length) {
      const wp = this.waypoints[this.waypointIndex];
      const dx = wp.x - this.x;
      const dy = wp.y - this.y;
      const dist = Math.hypot(dx, dy);
      const spd = wp.speed || this.speed;

      if (dist < 0.04 || spd * dt >= dist) {
        this.x = wp.x;
        this.y = wp.y;
        if (wp.facing !== undefined) this.facing = wp.facing;
        if (wp.state !== undefined) this.state = wp.state;
        if (wp.onReach) wp.onReach(this);
        this.waypointIndex++;
        if (this.waypointIndex >= this.waypoints.length && wp.escapes) {
          this.escaped = true;
        }
      } else {
        const step = Math.min(dist, spd * dt);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
        if (wp.facing !== undefined) {
          this.facing = wp.facing;
        } else if (Math.abs(dx) > 0.01) {
          this.facing = dx >= 0 ? 1 : -1;
        }
        if (!wp.state) {
          this.state = spd > 2.8 ? 'run' : 'walk';
        } else {
          this.state = wp.state;
        }
      }
    }

    // Dynamic animation oscillations based on movement state
    if (this.state === 'walk' || this.state === 'run') {
      const freq = this.state === 'run' ? 14 : 9;
      const prevStep = Math.floor(this.walkCycle / Math.PI);
      this.walkCycle += dt * freq;
      const nextStep = Math.floor(this.walkCycle / Math.PI);
      if (nextStep > prevStep && this.onFootstep) {
        this.onFootstep(this);
      }
      this.bodyBob = Math.sin(this.walkCycle) * (this.state === 'run' ? 1.8 : 1.1);
      this.armAngle = Math.cos(this.walkCycle) * 0.42;
    } else if (this.state === 'idle') {
      this.walkCycle += dt * 3.0;
      this.bodyBob = Math.sin(this.walkCycle) * 0.45;
      this.armAngle = 0;
    } else if (this.state === 'recoil') {
      this.recoilOffset = Math.max(0, this.recoilOffset - dt * 2.2);
    } else if (this.state === 'collapsed') {
      this.collapseProgress = Math.min(1.0, this.collapseProgress + dt * 4.0);
    }
  }
}

export const CinematicDirector = {
  isActive() {
    return GameState.STATE === GameStates.CINEMATIC && !!THE_DESCENT && !THE_DESCENT.done;
  },

  startIntro(options = {}) {
    const isReplay = (typeof options === 'boolean') ? options : !!options.isReplay;
    CinematicSafety.startCinematic('the_descent', typeof options === 'object' ? options : { isReplay });

    if (!isReplay && SaveSystem && SaveSystem.recordCinematicUnlock) {
      SaveSystem.recordCinematicUnlock('the_descent');
    }

    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;

    const P = GameState.P;
    const px = P ? P.x : 10;
    const py = P ? P.y : 10;

    // Isolate player entity during cinematic
    if (P) {
      P.cinematicPose = 'kneel';
      P.animState = 'idle';
      P.fx = 1;
      P.fy = 0;
      P.aanim = 0;
      P.vx = 0;
      P.vy = 0;
      P.invulnerable = true;
    }

    // Determine doorway coordinates at left wall of spawn room (behind Rowan)
    const rm0 = (GameState.ROOMS && GameState.ROOMS[0]) ? GameState.ROOMS[0] : null;
    const gateX = GameState.GATE ? GameState.GATE.x : (rm0 ? rm0.x : 6);
    const gateY = GameState.GATE ? GameState.GATE.y : (rm0 ? rm0.cy : 15);

    // Initialize or reset authoritative Gate entity
    if (!GameState.GATE) {
      GameState.GATE = {
        id: 'entrance_gate',
        type: 'iron_portcullis',
        x: gateX,
        y: gateY,
        width: 1,
        height: 2,
        state: 'open',
        dropProgress: 0.0,
        leverProgress: 0.0,
        dustExploded: false,
        solid: false
      };
      GameState.GATES = [GameState.GATE];
    } else {
      GameState.GATE.state = 'open';
      GameState.GATE.dropProgress = 0.0;
      GameState.GATE.leverProgress = 0.0;
      GameState.GATE.dustExploded = false;
      GameState.GATE.solid = false;
    }

    // Camera starts low and tight on Rowan
    GameState.CAM.tx = px;
    GameState.CAM.ty = py;
    GameState.CAM.tz = 2.45;
    GameState.CAM.x = px;
    GameState.CAM.y = py;
    GameState.CAM.z = 2.45;

    // Create 3 Deserter Actors with Waypoints passing through the real doorway
    const deserter1 = new CinematicActor({
      id: 'deserter_leader',
      type: 'deserter',
      x: gateX + 4.2,
      y: gateY + 0.35,
      speed: 2.2,
      facing: -1
    });
    // Leader runs past Rowan, arrives at doorway, crosses threshold, turns back to shout
    deserter1.addWaypoint(gateX + 2.0, gateY + 0.35, 2.2, -1, 'run');
    deserter1.addWaypoint(gateX + 0.4, gateY + 0.35, 2.0, -1, 'run');
    deserter1.addWaypoint(gateX - 1.2, gateY + 0.35, 1.8, -1, 'run'); // Crosses threshold into outer passage
    deserter1.addWaypoint(gateX - 1.5, gateY + 0.35, 1.0, 1, 'idle'); // Turns back to shout "SEAL THE GATE!"
    deserter1.addWaypoint(gateX - 4.5, gateY + 0.35, 3.2, -1, 'run'); // Escapes into outer corridor
    deserter1.waypoints[deserter1.waypoints.length - 1].escapes = true;

    const deserter2 = new CinematicActor({
      id: 'deserter_lever',
      type: 'deserter',
      x: gateX + 4.8,
      y: gateY + 0.75,
      speed: 2.2,
      facing: -1
    });
    // Second runner goes straight for outer wall lever
    deserter2.addWaypoint(gateX + 2.2, gateY + 0.75, 2.2, -1, 'run');
    deserter2.addWaypoint(gateX + 0.4, gateY + 0.75, 2.0, -1, 'run');
    deserter2.addWaypoint(gateX - 0.4, gateY + 0.75, 1.8, -1, 'run'); // Crosses to outer wall lever
    deserter2.addWaypoint(gateX - 0.4, gateY + 0.75, 0.6, -1, 'idle'); // Lever pull pause
    deserter2.addWaypoint(gateX - 4.2, gateY + 0.75, 3.0, -1, 'run'); // Escapes into outer corridor
    deserter2.waypoints[deserter2.waypoints.length - 1].escapes = true;

    const deserter3 = new CinematicActor({
      id: 'deserter_straggler',
      type: 'deserter',
      x: gateX + 5.5,
      y: gateY + 0.1,
      speed: 2.3,
      facing: -1
    });
    // Straggler scrambles behind and dives through before gate closes
    deserter3.addWaypoint(gateX + 2.8, gateY + 0.1, 2.2, -1, 'run');
    deserter3.addWaypoint(gateX + 0.4, gateY + 0.1, 2.2, -1, 'run');
    deserter3.addWaypoint(gateX - 1.0, gateY + 0.1, 2.4, -1, 'run'); // Dives through doorway threshold
    deserter3.addWaypoint(gateX - 4.8, gateY + 0.1, 3.2, -1, 'run'); // Escapes into outer corridor
    deserter3.waypoints[deserter3.waypoints.length - 1].escapes = true;

    // Create 3 Scripted Skeleton Combatants starting deep OFF-SCREEN in the forward east corridor (Part 8–15)
    const skeleton1 = new CinematicActor({
      id: 'skeleton_1',
      type: 'skeleton',
      x: px + 8.2, // Deep off-screen in forward corridor
      y: py - 0.05,
      speed: 1.8,
      facing: -1,
      eyeGlow: 0,
      weaponAngle: 0.2
    });
    // S1 advances along center lane from deep darkness, enters torchlight, raises blade
    skeleton1.addWaypoint(px + 4.8, py - 0.05, 1.8, -1, 'walk');
    skeleton1.addWaypoint(px + 2.6, py - 0.05, 1.6, -1, 'walk');
    skeleton1.addWaypoint(px + 2.6, py - 0.05, 1.0, -1, 'idle'); // Halts, raises weapon

    const skeleton2 = new CinematicActor({
      id: 'skeleton_2',
      type: 'skeleton',
      x: px + 10.2, // Farther back in corridor off-screen
      y: py - 0.95,
      speed: 1.9,
      facing: -1,
      eyeGlow: 0,
      weaponAngle: 0.2
    });
    // S2 moves into upper-flank position behind S1 several seconds later
    skeleton2.addWaypoint(px + 5.5, py - 0.95, 1.9, -1, 'walk');
    skeleton2.addWaypoint(px + 3.0, py - 0.85, 1.8, -1, 'walk');
    skeleton2.addWaypoint(px + 3.0, py - 0.85, 1.0, -1, 'idle');

    const skeleton3 = new CinematicActor({
      id: 'skeleton_3',
      type: 'skeleton',
      x: px + 12.0, // Deepest in corridor off-screen
      y: py + 0.85,
      speed: 2.2,
      facing: -1,
      eyeGlow: 0,
      weaponAngle: 0.2
    });
    // S3 advances along lower flank last, stages, then executes furious charge
    skeleton3.addWaypoint(px + 6.0, py + 0.85, 2.0, -1, 'walk');
    skeleton3.addWaypoint(px + 3.4, py + 0.65, 1.8, -1, 'idle');

    // Footstep audio synchronization for walking skeletons (Part 17)
    const playSkeletonFootstep = (sk) => {
      if (THE_DESCENT && THE_DESCENT.timer >= 19.5 && THE_DESCENT.timer < 32.5) {
        SoundManager.snd('footstep');
      }
    };
    skeleton1.onFootstep = playSkeletonFootstep;
    skeleton2.onFootstep = playSkeletonFootstep;
    skeleton3.onFootstep = playSkeletonFootstep;

    // Foreground parallax particles & chains
    const fgChains = [
      { x: px - 2.0, y: py - 1.6, len: 45, phase: 0 },
      { x: px + 1.8, y: py - 1.7, len: 60, phase: 1.2 },
      { x: px + 3.5, y: py - 1.5, len: 35, phase: 2.4 }
    ];

    const fgRubble = [];
    for (let i = 0; i < 8; i++) {
      fgRubble.push({
        x: (px - 2.5 + Math.random() * 6.5) * T,
        y: (py + 0.6 + Math.random() * 0.8) * T,
        r: 2 + Math.random() * 3,
        color: Math.random() < 0.5 ? '#1e293b' : '#334155'
      });
    }

    THE_DESCENT = {
      timer: 0,
      done: false,
      hitStopTimer: 0,
      flashAlpha: 0,
      letterbox: 0,
      soundCues: {},
      subtitle: '',
      subtitleSpeaker: '',
      subtitleAlpha: 0,

      // Doorway & Gate
      gate: {
        x: gateX,
        y: gateY,
        dropProgress: 0, // 0 = open, 1 = sealed
        leverProgress: 0, // 0 = upright, 1 = pulled down
        dustExploded: false,
        sealed: false
      },

      // Actors
      deserters: [deserter1, deserter2, deserter3],
      skeletons: [skeleton1, skeleton2, skeleton3],

      // Rowan Combat Overlay Poses
      rowan: {
        x: px,
        y: py,
        facing: 1,
        pose: 'kneel', // 'kneel', 'rising', 'guard', 'dodge', 'parry', 'counter', 'settle'
        slashAnim: 0,
        dodgeOffset: 0,
        weaponTrail: []
      },

      // World FX
      bloodDrop: {
        x: px + 0.2,
        y: py + 0.28,
        height: 28,
        landed: false
      },
      dustParticles: [],
      sparks: [],
      weaponTrails: [],
      bloodDecals: [],
      fgChains,
      fgRubble
    };

    CI.done = false;
    CI.letterbox = 0;
    EventBus.emit('cinematic:intro_started');
  },

  startIntroSequence(floor = 1) {
    this.startIntro();
  },

  reset() {
    THE_DESCENT = null;
    CI.done = true;
    CI.actors = [];
    CI.letterbox = 0;
    GameState.CINEMATIC_ACTIVE = false;
  },

  canSkip() {
    return CinematicSafety.canSkip();
  },

  endIntro() {
    if (!THE_DESCENT && CI.done) return;

    if (CinematicSafety.isReplay()) {
      if (THE_DESCENT) THE_DESCENT.done = true;
      CI.done = true;
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }

    if (THE_DESCENT) THE_DESCENT.done = true;
    CI.done = true;

    GameState.CINEMATIC_ACTIVE = false;
    const P = GameState.P;
    if (P) {
      P.cinematicPose = null;
      P.animState = 'idle';
      P.fx = 1;
      P.fy = 0;
      P.aanim = 0;
      P.vx = 0;
      P.vy = 0;
      P.invulnerable = false;
      GameState.CAM.tx = P.x;
      GameState.CAM.ty = P.y;
      GameState.CAM.tz = 1.0;
    }

    // Authoritative Gate Entity: remains visibly a closed gate and enforces obstacle bounds.
    // Note: Do NOT mutate GameState.MAP tiles into walls (Problem 1, 2 & Part 36).
    // The gate is a dedicated physical entity with solid bounds in PathValidator.
    if (GameState.GATE) {
      GameState.GATE.state = 'closed';
      GameState.GATE.dropProgress = 1.0;
      GameState.GATE.leverProgress = 1.0;
      GameState.GATE.solid = true;
    }
    if (THE_DESCENT && THE_DESCENT.gate) {
      THE_DESCENT.gate.dropProgress = 1.0;
      THE_DESCENT.gate.leverProgress = 1.0;
      THE_DESCENT.gate.sealed = true;
    }

    GameState.setState(GameStates.PLAYING);
    CinematicSafety.reset();
    EventBus.emit('cinematic:intro_ended');
    triggerCinematicBanner('FLOOR 1 — THE SUNKEN CRYPTS', 'Trapped in the deep. Ascend or perish.');
  },

  skip() {
    if (!this.canSkip()) return;
    this.endIntro();
  },

  advance() {
    this.skip();
  },

  handleClick(mx, my) {
    if (!this.isActive()) return false;
    if (CinematicSafety.isValidSkipClick()) {
      this.skip();
      return true;
    }
    return false;
  },

  update(dt) {
    this.tick(dt);
  },

  getIntroData() {
    return THE_DESCENT;
  },

  // ─────────────────────────────────────────────────────────────
  // MASTER TIMELINE RUNNER
  // ─────────────────────────────────────────────────────────────
  tick(dt) {
    if (!this.isActive()) return;
    const d = THE_DESCENT;
    const P = GameState.P;
    if (!P) return;

    // Hit-stop micro freeze for weight
    if (d.hitStopTimer > 0) {
      d.hitStopTimer = Math.max(0, d.hitStopTimer - dt);
      return;
    }

    if (!d.freeze) d.timer += dt;
    const t = d.timer;

    // Screen flash decay
    if (d.flashAlpha > 0) {
      d.flashAlpha = Math.max(0, d.flashAlpha - dt * 2.8);
    }

    // Letterbox slide in / slide out
    if (t < 40.0) {
      d.letterbox = Math.min(1.0, d.letterbox + dt * 2.2);
    } else {
      d.letterbox = Math.max(0.0, d.letterbox - dt * 1.5);
    }

    // Subtitle alpha fade
    d.subtitleAlpha = Math.min(1.0, (d.subtitleAlpha || 0) + dt * 3.0);

    // Update active particles
    this._tickParticles(dt);

    // Sync Authoritative Gate Entity with Timeline
    if (GameState.GATE && d.gate) {
      GameState.GATE.dropProgress = d.gate.dropProgress;
      GameState.GATE.leverProgress = d.gate.leverProgress;
      GameState.GATE.solid = d.gate.sealed;
      GameState.GATE.state = d.gate.sealed ? 'closed' : (d.gate.dropProgress > 0 ? 'closing' : 'open');
    }

    // Update deserters during flight sequence (7.5s - 15.0s)
    if (t >= 7.5 && t <= 15.0) {
      for (const des of d.deserters) des.update(dt);
    }

    // Staggered Skeleton Actor Updates: each enters corridor at distinct intervals (Part 10–15)
    if (t >= 19.5 && d.skeletons[0]) {
      d.skeletons[0].update(dt); // S1 emerges first
    }
    if (t >= 23.0 && d.skeletons[1]) {
      d.skeletons[1].update(dt); // S2 emerges several seconds later
    }
    if (t >= 26.5 && d.skeletons[2]) {
      d.skeletons[2].update(dt); // S3 emerges last along lower flank
    }

    const px = P.x;
    const py = P.y;

    // ─────────────────────────────────────────────────────────
    // SHOT 01 — BLACKNESS (0:00 – 0:02)
    // ─────────────────────────────────────────────────────────
    if (t < 2.0) {
      GameState.CAM.tx = px;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 2.45;
      P.cinematicPose = 'kneel';
      d.rowan.pose = 'kneel';

      if (t >= 0.5 && !d.soundCues.breath1) {
        d.soundCues.breath1 = true;
        SoundManager.snd('heartbeat');
      }
      if (t >= 1.1 && !d.soundCues.clang1) {
        d.soundCues.clang1 = true;
        SoundManager.snd('weapon_clang');
      }
      if (t >= 1.6 && !d.soundCues.grind1) {
        d.soundCues.grind1 = true;
        SoundManager.snd('shockwave');
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 02 — THE FLOOR & BLOOD DROP (0:02 – 0:05)
    // ─────────────────────────────────────────────────────────
    else if (t < 5.0) {
      const p2 = (t - 2.0) / 3.0;
      GameState.CAM.tx = px;
      GameState.CAM.ty = py + 0.35 - p2 * 0.2;
      GameState.CAM.tz = 2.45 - p2 * 0.15;
      P.cinematicPose = 'kneel';
      d.rowan.pose = 'kneel';

      // Blood drop falls onto stone floor
      if (t < 3.5) {
        const fallT = (t - 2.2) / 1.3;
        d.bloodDrop.height = Math.max(0, 28 * (1 - fallT * fallT));
      } else if (!d.bloodDrop.landed) {
        d.bloodDrop.landed = true;
        d.bloodDrop.height = 0;
        d.bloodDecals.push({ x: d.bloodDrop.x * T, y: d.bloodDrop.y * T, r: 6.5, alpha: 0.85 });
        d.soundCues.bloodDrip = true;
        SoundManager.snd('soul_pickup');
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 03 — ROWAN RISES (0:05 – 0:08)
    // ─────────────────────────────────────────────────────────
    else if (t < 8.0) {
      const p3 = (t - 5.0) / 3.0;
      GameState.CAM.tx = px;
      GameState.CAM.ty = py + 0.15 - p3 * 0.25;
      GameState.CAM.tz = 2.3 - p3 * 0.35;

      if (t < 6.4) {
        P.cinematicPose = 'kneel';
        d.rowan.pose = 'kneel';
      } else {
        P.cinematicPose = null; // Rowan stands up
        d.rowan.pose = 'rising';
        P.animState = 'idle';
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 04 — DESERTERS FLEE TOWARD DOORWAY (0:08 – 0:11.5)
    // ─────────────────────────────────────────────────────────
    else if (t < 11.5) {
      // Over the shoulder shot: Rowan looking west at the doorway
      GameState.CAM.tx = px - 1.2;
      GameState.CAM.ty = py - 0.2;
      GameState.CAM.tz = 1.6;
      P.fx = -1;
      d.rowan.facing = -1;
      d.rowan.pose = 'guard';

      if (t >= 8.2 && t < 9.8) {
        d.subtitle = '"Keep moving! Don\'t stop!"';
        d.subtitleSpeaker = 'DESERTER';
      } else if (t >= 9.8 && t < 11.5) {
        d.subtitle = '"Don\'t wait for him! We have to seal it!"';
        d.subtitleSpeaker = 'DESERTER';
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 05 — THE BETRAYAL & GATE SLAM (0:11.5 – 0:14.5)
    // ─────────────────────────────────────────────────────────
    else if (t < 14.5) {
      // Side profile: Deserters across threshold, lever pull, gate falls
      GameState.CAM.tx = d.gate.x + 0.8;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 1.7;
      P.fx = -1;
      d.rowan.facing = -1;

      // Lever pulled down by Deserter 2
      if (t >= 11.8) {
        d.gate.leverProgress = Math.min(1.0, (t - 11.8) / 0.4);
      }

      // Deserter shouts & Rowan reacts
      if (t >= 11.8 && t < 12.8) {
        d.subtitle = '"SEAL THE GATE! Leave him to the depths!"';
        d.subtitleSpeaker = 'DESERTER';
      } else if (t >= 12.8 && t < 13.8) {
        d.subtitle = '"Wait—!"';
        d.subtitleSpeaker = 'ROWAN';
      }

      // Stone portcullis drops rapidly between 12.2s and 13.5s
      if (t >= 12.2 && t <= 13.5) {
        const dropT = (t - 12.2) / 1.3;
        d.gate.dropProgress = Math.min(1.0, dropT * dropT);
      }

      // Slam impact at 13.5s
      if (t >= 13.5 && !d.gate.dustExploded) {
        d.gate.dustExploded = true;
        d.gate.dropProgress = 1.0;
        d.gate.sealed = true;
        d.soundCues.gateSlam = true;
        SoundManager.snd('shockwave');
        Camera.shake(16);
        d.flashAlpha = 0.45;
        this._spawnGateDust(d.gate.x * T, d.gate.y * T);
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 06 — SILENCE & WIDE ESTABLISHING (0:14.5 – 0:17.5)
    // ─────────────────────────────────────────────────────────
    else if (t < 17.5) {
      GameState.CAM.tx = px + 0.2;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 1.25;
      P.fx = -1;
      d.rowan.facing = -1;
      d.rowan.pose = 'settle';
      d.subtitle = '';
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 07 — THE MYSTERY HOOK & CORRIDOR REVEAL (0:17.5 – 0:20.5)
    // ─────────────────────────────────────────────────────────
    else if (t < 20.5) {
      const pTurn = (t - 17.5) / 3.0;
      // Rowan turns his head to face east corridor, camera smoothly pans forward into darkness
      GameState.CAM.tx = px + 0.8 + pTurn * 1.3;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 1.60;
      P.fx = 1;
      d.rowan.facing = 1;
      d.rowan.pose = 'guard';

      if (t >= 18.0 && !d.soundCues.whisper1) {
        d.soundCues.whisper1 = true;
        SoundManager.snd('portal_enter');
        d.subtitle = '“Rowan…”';
        d.subtitleSpeaker = 'VOICE IN THE DARK';
      }
      if (t >= 18.5 && !d.soundCues.distantFootstep1) {
        d.soundCues.distantFootstep1 = true;
        SoundManager.snd('footstep');
      }
      if (t >= 19.2 && !d.soundCues.ironScrape) {
        d.soundCues.ironScrape = true;
        SoundManager.snd('iron_scrape');
      }
      if (t >= 19.8 && !d.soundCues.distantFootstep2) {
        d.soundCues.distantFootstep2 = true;
        SoundManager.snd('footstep');
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 08 — SKELETON 1 EMERGES INTO TORCHLIGHT (0:20.5 – 0:24.0)
    // ─────────────────────────────────────────────────────────
    else if (t < 24.0) {
      GameState.CAM.tx = px + 1.6;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 1.62;
      P.fx = 1;
      d.rowan.facing = 1;
      d.rowan.pose = 'guard';

      // S1 eye glow ignites as it enters torchlight
      d.skeletons[0].eyeGlow = Math.min(1.0, (t - 20.8) / 1.2);

      // S1 reaches mid-range at 22.5s, halts, and raises blade
      if (t >= 22.5) {
        d.skeletons[0].weaponAngle = Math.min(1.4, (t - 22.5) * 1.2);
      }

      d.subtitle = 'Rattling iron echoes across the stone floor...';
      d.subtitleSpeaker = '';
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 09 & 10 — COMBAT 1: SKELETON 1 ATTACK & SKELETON 2 REVEAL (0:24.0 – 0:27.0)
    // ─────────────────────────────────────────────────────────
    else if (t < 27.0) {
      // Camera widens to show S2 entering upper flank behind S1
      GameState.CAM.tx = px + 1.2;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 1.5;

      // S2 eye glow ignites as it enters torchlight
      d.skeletons[1].eyeGlow = Math.min(1.0, (t - 23.8) / 1.2);

      // Skeleton 1 raises weapon high, steps in to attack at 24.6s
      if (t >= 24.6 && t < 25.4) {
        d.skeletons[0].weaponAngle = 2.4; // Downward chop
        d.skeletons[0].x = Math.max(px + 1.2, d.skeletons[0].x - dt * 2.5);
        d.rowan.pose = 'dodge';
        d.rowan.dodgeOffset = -0.35; // Rowan takes a step back
        if (!d.soundCues.dodgeClang) {
          d.soundCues.dodgeClang = true;
          SoundManager.snd('weapon_clang');
          Camera.shake(6);
          this._spawnSparks((px + 0.9) * T, (py + 0.05) * T);
        }
      }

      // Rowan counter-cleave connects at 25.8s
      if (t >= 25.8 && !d.soundCues.kill1) {
        d.soundCues.kill1 = true;
        SoundManager.snd('impact_hit');
        d.hitStopTimer = 0.12;
        Camera.shake(9);
        d.flashAlpha = 0.35;
        d.rowan.pose = 'counter';
        d.rowan.dodgeOffset = 0.15; // Rowan lunges forward into counter
        d.skeletons[0].state = 'collapsed';
        d.skeletons[0].hitFlash = 0.4;
        d.skeletons[0].recoilOffset = 0.4;
        d.skeletons[0].x = px + 1.35; // Knocked back by impact
        this._spawnSparks((px + 1.0) * T, (py - 0.05) * T);
        this._spawnBlood((px + 1.0) * T, (py - 0.05) * T);
        d.bloodDecals.push({ x: (px + 1.0) * T, y: (py - 0.05) * T, r: 8, alpha: 0.85 });
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 11 — COMBAT 2: SKELETON 2 FLANK & SKELETON 3 REVEAL (0:27.0 – 0:30.0)
    // ─────────────────────────────────────────────────────────
    else if (t < 30.0) {
      GameState.CAM.tx = px + 0.8;
      GameState.CAM.ty = py - 0.2;
      GameState.CAM.tz = 1.58;

      // S3 eye glow ignites along lower corridor
      d.skeletons[2].eyeGlow = Math.min(1.0, (t - 27.2) / 1.2);

      // Skeleton 2 moves in from upper flank and strikes at 27.6s
      if (t >= 27.4 && t < 28.5) {
        d.skeletons[1].x = Math.max(px + 1.05, d.skeletons[1].x - dt * 2.6);
        d.skeletons[1].y = Math.min(py - 0.65, d.skeletons[1].y + dt * 0.4);
      }
      if (t >= 27.8 && !d.soundCues.parry2) {
        d.soundCues.parry2 = true;
        SoundManager.snd('weapon_clang');
        Camera.shake(6);
        d.skeletons[1].weaponAngle = 1.8;
        d.rowan.pose = 'parry';
        d.rowan.dodgeOffset = 0;
        this._spawnSparks((px + 0.75) * T, (py - 0.45) * T);
      }

      // Rowan pivot counter-strike at 28.8s
      if (t >= 28.8 && !d.soundCues.kill2) {
        d.soundCues.kill2 = true;
        SoundManager.snd('impact_hit');
        d.hitStopTimer = 0.10;
        Camera.shake(8);
        d.rowan.pose = 'counter';
        d.rowan.dodgeOffset = 0.1;
        d.skeletons[1].state = 'collapsed';
        d.skeletons[1].hitFlash = 0.35;
        d.skeletons[1].recoilOffset = 0.35;
        d.skeletons[1].x = px + 1.25; // Knocked back
        this._spawnBlood((px + 0.8) * T, (py - 0.6) * T);
        d.bloodDecals.push({ x: (px + 0.8) * T, y: (py - 0.6) * T, r: 7.5, alpha: 0.85 });
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 12 — COMBAT 3: SKELETON 3 CHARGE (0:30.0 – 0:33.5)
    // ─────────────────────────────────────────────────────────
    else if (t < 33.5) {
      GameState.CAM.tx = px + 0.6;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 1.72;

      // Skeleton 3 desperate charge toward Rowan
      if (t < 31.4) {
        d.skeletons[2].state = 'run';
        d.skeletons[2].x = Math.max(px + 1.15, d.skeletons[2].x - dt * 3.4);
        d.skeletons[2].y = Math.max(py + 0.35, d.skeletons[2].y - dt * 0.5);
        d.rowan.pose = 'guard';
        d.rowan.dodgeOffset = 0;
      }

      // Decisive cleave at 31.4s
      if (t >= 31.4 && !d.soundCues.kill3) {
        d.soundCues.kill3 = true;
        SoundManager.snd('impact_hit');
        d.hitStopTimer = 0.14;
        Camera.shake(11);
        d.flashAlpha = 0.40;
        d.rowan.pose = 'counter';
        d.rowan.dodgeOffset = 0.22; // Step forward upward strike
        d.skeletons[2].state = 'collapsed';
        d.skeletons[2].hitFlash = 0.45;
        d.skeletons[2].recoilOffset = 0.5;
        d.skeletons[2].x = px + 1.35; // Struck back
        this._spawnBlood((px + 0.85) * T, (py + 0.35) * T);
        this._spawnSparks((px + 0.85) * T, (py + 0.35) * T);
        d.bloodDecals.push({ x: (px + 0.85) * T, y: (py + 0.35) * T, r: 8.5, alpha: 0.85 });
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 13 & 14 — AFTERMATH & SECOND WHISPER (0:33.5 – 0:37.0)
    // ─────────────────────────────────────────────────────────
    else if (t < 37.0) {
      const orbitT = (t - 33.5) * 0.35;
      GameState.CAM.tx = px + Math.sin(orbitT) * 0.25;
      GameState.CAM.ty = py + Math.cos(orbitT) * 0.12;
      GameState.CAM.tz = 1.5;
      d.rowan.pose = 'settle';
      d.rowan.dodgeOffset = 0;
      P.animState = 'idle';

      if (t >= 34.5 && !d.soundCues.whisper2) {
        d.soundCues.whisper2 = true;
        SoundManager.snd('portal_enter');
        d.subtitle = '“You came back.”';
        d.subtitleSpeaker = 'VOICE IN THE DARK';
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 15 & 16 — THE DARKNESS & TITLE REVEAL (0:37.0 – 0:41.0)
    // ─────────────────────────────────────────────────────────
    else if (t < 41.0) {
      const p15 = (t - 37.0) / 4.0;
      GameState.CAM.tx = px;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 1.5 - p15 * 0.35; // Slow pull back
      d.subtitle = '';
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 17 — TRANSITION INTO GAMEPLAY (0:41.0 – 0:44.0)
    // ─────────────────────────────────────────────────────────
    else if (t < 44.0) {
      const p17 = (t - 41.0) / 3.0;
      GameState.CAM.tx = px;
      GameState.CAM.ty = py;
      GameState.CAM.tz = 1.15 - p17 * 0.15; // Smooth return to 1.0
    } else {
      this.endIntro();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // WORLD-SPACE RENDERING (Inside Camera.apply — true game world)
  // ─────────────────────────────────────────────────────────────
  drawWorldEntities(ctx) {
    if (!this.isActive()) return;
    const d = THE_DESCENT;
    const P = GameState.P;
    if (!P) return;

    const px = (P.x + 0.5) * T;
    const py = (P.y + 0.5) * T;
    const t = d.timer;

    // 1. Blood Decals on Floor Flagstones
    for (const b of d.bloodDecals) {
      ctx.save();
      ctx.fillStyle = '#450a0a';
      ctx.globalAlpha = b.alpha || 0.85;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r, b.r * 0.48, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c0505';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r * 0.55, b.r * 0.28, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Falling Blood Drop (Shot 02)
    if (t >= 2.0 && t < 3.5 && !d.bloodDrop.landed) {
      ctx.save();
      const bdx = d.bloodDrop.x * T;
      const bdy = d.bloodDrop.y * T - d.bloodDrop.height;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bdx, bdy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Sealed Stone Portcullis & Wall Lever
    // The authoritative Gate entity is rendered persistently in the world pipeline via WorldRenderer.drawGates(ctx).

    // 4. Deserters Running & Escaping Through Doorway
    if (t >= 7.5 && t <= 14.5) {
      for (const des of d.deserters) {
        if (des.escaped) continue;
        const dx = des.x * T;
        const dy = des.y * T;

        // Ground Contact Shadow
        ctx.save();
        ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
        ctx.beginPath();
        ctx.ellipse(dx, dy + des.groundOffset, des.shadowRadius, des.shadowRadius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2.5D Layered Deserter Actor
        ctx.save();
        ctx.translate(dx, dy + des.bodyBob);

        // Billowing Travel Cloak
        ctx.fillStyle = '#3f2e22';
        ctx.beginPath();
        if (des.facing === -1) {
          ctx.moveTo(-4, -6);
          ctx.lineTo(12 + Math.sin(des.walkCycle) * 3, 4);
          ctx.lineTo(8 + Math.cos(des.walkCycle) * 2, 12);
          ctx.lineTo(-4, 10);
        } else {
          ctx.moveTo(4, -6);
          ctx.lineTo(-12 - Math.sin(des.walkCycle) * 3, 4);
          ctx.lineTo(-8 - Math.cos(des.walkCycle) * 2, 12);
          ctx.lineTo(4, 10);
        }
        ctx.closePath();
        ctx.fill();

        // Leather Doublet / Tunic
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-6, -6, 12, 14);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-5, -5, 10, 6);

        // Running Legs with Boots
        const legSwing = Math.sin(des.walkCycle) * 6;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-4 - (des.facing === -1 ? legSwing : -legSwing), 7, 3, 6);
        ctx.fillRect(1 + (des.facing === -1 ? legSwing : -legSwing), 7, 3, 6);

        // Arm Swing / Lever Pull
        ctx.fillStyle = '#475569';
        ctx.save();
        ctx.translate(des.facing * 4, -2);
        ctx.rotate(des.armAngle * (des.facing === -1 ? -1 : 1));
        ctx.fillRect(-1.5, 0, 3, 9);
        ctx.restore();

        // Head & Helmet
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(des.facing * 1, -11, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(des.facing * 1, -12, 5.2, Math.PI, 0);
        ctx.fill();

        // Panicked Eye Glance
        ctx.fillStyle = '#0f172a';
        if (des.facing === 1) {
          ctx.fillRect(2, -12, 1.5, 1.5);
        } else {
          ctx.fillRect(-3.5, -12, 1.5, 1.5);
        }
        ctx.restore();
      }
    }

    // 5. Rowan Custom Cinematic Actor & Poses
    this._drawCinematicRowan(ctx, px, py, d);

    // 6. The Three Skeletons (Emerging sequentially, Fighting, Collapsed on Floor)
    for (const sk of d.skeletons) {
      if (sk.state === 'collapsed' || sk.x < px + 7.8) {
        this._drawCinematicSkeleton(ctx, sk);
      }
    }

    // 7. Foreground Parallax Rubble & Drifting Dust
    for (const rub of d.fgRubble) {
      ctx.save();
      ctx.fillStyle = rub.color;
      ctx.beginPath();
      ctx.arc(rub.x, rub.y, rub.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8. Dynamic Weapon Sparks & Dust Clouds
    for (const spk of d.sparks) {
      ctx.save();
      ctx.fillStyle = spk.color || '#facc15';
      ctx.shadowColor = spk.color || '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(spk.x, spk.y, spk.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const dst of d.dustParticles) {
      ctx.save();
      ctx.fillStyle = dst.color || 'rgba(148, 163, 184, 0.4)';
      ctx.globalAlpha = dst.alpha || 0.5;
      ctx.beginPath();
      ctx.arc(dst.x, dst.y, dst.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 2.5D LAYERED ROWAN RENDERING
  // ─────────────────────────────────────────────────────────────
  _drawCinematicRowan(ctx, px, py, d) {
    const P = GameState.P;
    const pose = d.rowan.pose;
    const facing = d.rowan.facing || 1;
    const weaponKey = (P && P.activeWeapon) ? P.activeWeapon : 'sword';

    const rx = px + (d.rowan.dodgeOffset || 0) * T;
    const ry = py;

    ctx.save();
    ctx.translate(rx, ry);

    // Ground Contact Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 13, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (pose === 'kneel') {
      // Flowing Cloak pooling on stones
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(-11, -4);
      ctx.lineTo(11, -4);
      ctx.lineTo(14, 13);
      ctx.lineTo(-14, 13);
      ctx.closePath();
      ctx.fill();

      // Kneeling Greaves & Boots
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7, 5, 6, 7);
      ctx.fillRect(1, 3, 6, 7);

      // Dark Plate Torso & Armor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-8, -8, 16, 13);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7, -7, 14, 5);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-8, -1, 16, 1.8);

      // Steel Broadsword planted point-down into stone
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(7, -8, 3.5, 18);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(4, -8, 9.5, 3);
      ctx.fillStyle = '#334155';
      ctx.fillRect(7.5, -12, 2.5, 4);

      // Greathelm with Glowing Blue Visor Slit
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-5, -17, 10, 7);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.fillRect(-3.5, -14, 7, 2);
    } else {
      // Standing Combat Stance (guard, dodge, parry, counter)
      const bob = Math.sin(GameState.F * 0.08) * 0.8;
      ctx.translate(0, bob);

      // Flowing Crimson Cape
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(-facing * 6, -8);
      ctx.lineTo(-facing * 14, 6);
      ctx.lineTo(-facing * 8, 12);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();

      // Plate Greaves & Boots
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, 5, 4, 8);
      ctx.fillRect(1, 5, 4, 8);

      // Plate Cuirass & Gold Trim
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-8, -9, 16, 14);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7, -8, 14, 6);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-8, -2, 16, 1.8);

      // Shoulder Pauldrons
      ctx.fillStyle = '#475569';
      ctx.fillRect(-10, -9, 4, 6);
      ctx.fillRect(6, -9, 4, 6);

      // Greathelm
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -15, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(-5, -18, 10, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(facing === 1 ? -1 : -5, -15, 6, 2);

      // Equipped Weapon Representation
      ctx.save();
      ctx.translate(facing * 7, -4);
      if (pose === 'guard') {
        ctx.rotate(facing * 0.3);
      } else if (pose === 'dodge') {
        ctx.rotate(facing * -0.5);
      } else if (pose === 'parry') {
        ctx.rotate(facing * -1.1); // High diagonal block
      } else if (pose === 'counter') {
        ctx.rotate(facing * 1.4); // Sweeping slash
      }

      this._drawEquippedWeapon(ctx, weaponKey);
      ctx.restore();
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // SCRIPTED EQUIPPED WEAPON DRAWING (Preserves player weapon)
  // ─────────────────────────────────────────────────────────────
  _drawEquippedWeapon(ctx, weaponKey) {
    if (weaponKey === 'dagger') {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-1.5, -12, 3, 12);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-3, -1, 6, 2);
    } else if (weaponKey === 'spear') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1, -26, 2, 28);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(3, -26);
      ctx.lineTo(-3, -26);
      ctx.closePath();
      ctx.fill();
    } else if (weaponKey === 'axe') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1.5, -18, 3, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(5, -14, 7, -1.2, 1.2);
      ctx.lineTo(0, -14);
      ctx.closePath();
      ctx.fill();
    } else if (weaponKey === 'bow') {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 12, -1.2, 1.2);
      ctx.stroke();
    } else {
      // Default: Steel Broadsword
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-1.8, -18, 3.6, 18);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-1.2, -18, 1.2, 17); // Specular highlight
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-5, -2, 10, 3); // Crossguard
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-1, 1, 2, 4); // Grip
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(0, 6, 2, 0, Math.PI * 2); // Pommel
      ctx.fill();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 2.5D LAYERED SKELETON ACTOR RENDERING
  // ─────────────────────────────────────────────────────────────
  _drawCinematicSkeleton(ctx, sk) {
    const sx = sk.x * T;
    const sy = sk.y * T;

    // Contact Ground Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + sk.groundOffset, sk.shadowRadius, sk.shadowRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(sx, sy);

    if (sk.state === 'collapsed') {
      // Multi-Part Collapsed Bone Pile resting on the stone floor
      const prog = sk.collapseProgress || 1.0;
      ctx.translate(0, 6);

      // Rib fragments
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-7 * prog, 2, 14 * prog, 3);
      ctx.fillRect(-3 * prog, -2, 7 * prog, 4);

      // Broken Skull
      ctx.beginPath();
      ctx.arc(4 * prog, -1, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Broken Leg/Arm Bones
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-9 * prog, 4, 6 * prog, 2.5);
      ctx.fillRect(2 * prog, 3, 7 * prog, 2.5);

      // Fallen Rusty Sword
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-11 * prog, 5, 18 * prog, 3);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-4 * prog, 4, 3, 5);
      ctx.restore();
      return;
    }

    // Walking / Fighting Skeleton
    ctx.translate(sk.facing * sk.recoilOffset * 10, sk.bodyBob);

    // Dark Spine & Shadow Depth
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -6, 4, 10);

    // Layered Ivory Ribcage
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-5, -7, 10, 10);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-3, -5, 6, 1.8);
    ctx.fillRect(-3, -2, 6, 1.8);

    // Articulated Leg Bones
    const legSwing = Math.sin(sk.walkCycle) * 4.5;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-4 + (sk.facing === -1 ? legSwing : -legSwing), 4, 2.5, 9);
    ctx.fillRect(1.5 - (sk.facing === -1 ? legSwing : -legSwing), 4, 2.5, 9);

    // Skull with Cranium Highlight
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -13, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-4, -13, 8, 4);

    // Glowing Crimson Eye Sockets
    const eyeGlow = sk.eyeGlow || 1.0;
    ctx.fillStyle = `rgba(239, 68, 68, ${eyeGlow})`;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6 * eyeGlow;
    ctx.fillRect(sk.facing === 1 ? -1 : -3.5, -14, 2, 2);
    ctx.fillRect(sk.facing === 1 ? 2.5 : 0, -14, 2, 2);
    ctx.shadowBlur = 0;

    // Raised Rusty Blade
    ctx.save();
    ctx.translate(sk.facing * 5, -2);
    ctx.rotate(sk.facing * (sk.weaponAngle || 0.2));
    ctx.fillStyle = '#78716c';
    ctx.fillRect(-2, -18, 3.5, 18);
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(-1.5, -18, 1, 17); // Notch/reflection
    ctx.fillStyle = '#44403c';
    ctx.fillRect(-5, 0, 10, 2.5); // Hilt
    ctx.restore();

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // SCREEN-SPACE OVERLAYS (Letterbox, Vignettes, Subtitles, Title Banner)
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!this.isActive()) return;
    const d = THE_DESCENT;
    const t = d.timer;

    ctx.save();
    // High-Resolution 1280 × 720 Transform
    const sx = (ctx.canvas ? ctx.canvas.width : LW) / CINEMATIC_W;
    const sy = (ctx.canvas ? ctx.canvas.height : LH) / CINEMATIC_H;
    ctx.scale(sx, sy);

    const cx = CINEMATIC_W / 2;
    const cy = CINEMATIC_H / 2;

    // 1. Opening Blackness Fade (Shot 01)
    if (t < 2.8) {
      const blackAlpha = t < 2.0 ? 1.0 : Math.max(0, 1.0 - (t - 2.0) / 0.8);
      ctx.fillStyle = `rgba(0, 0, 0, ${blackAlpha})`;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);
    }

    // 2. Cinematic Atmospheric Vignette
    const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.22, cx, cy, CINEMATIC_W * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.7, 'rgba(3, 7, 18, 0.35)');
    vig.addColorStop(1, 'rgba(2, 4, 10, 0.90)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

    // 3. Screen Flash (Hit impacts & gate slam)
    if (d.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${d.flashAlpha})`;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);
    }

    // 4. Cinemascope Letterbox Bars
    const barHeight = 65 * d.letterbox;
    if (barHeight > 0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CINEMATIC_W, barHeight);
      ctx.fillRect(0, CINEMATIC_H - barHeight, CINEMATIC_W, barHeight);

      // Gold Trim Accent Lines
      ctx.fillStyle = 'rgba(202, 138, 4, 0.35)';
      ctx.fillRect(0, barHeight - 1, CINEMATIC_W, 1);
      ctx.fillRect(0, CINEMATIC_H - barHeight, CINEMATIC_W, 1);
    }

    // 5. Narrative Lore & Dialogue Subtitles
    if (d.subtitle && d.letterbox > 0.4) {
      this._drawSubtitle(ctx, cx, cy, d.subtitle, d.subtitleSpeaker);
    }

    // 6. Game Title Reveal (Shots 15 & 16)
    if (t >= 37.0 && t < 41.5) {
      const titleProg = Math.min(1.0, (t - 37.0) / 1.0);
      const titleFade = t < 40.0 ? titleProg : Math.max(0, 1.0 - (t - 40.0) / 1.5);

      ctx.save();
      ctx.globalAlpha = titleFade;

      // Soft Dark Backing Ribbon (Keeps environment visible behind it)
      const ribGrad = ctx.createLinearGradient(0, cy - 50, 0, cy + 50);
      ribGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
      ribGrad.addColorStop(0.5, 'rgba(2, 6, 23, 0.75)');
      ribGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = ribGrad;
      ctx.fillRect(0, cy - 50, CINEMATIC_W, 100);

      // Main Title Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 44px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 12;
      ctx.fillText('DUNGEON BREAK', cx, cy - 14);

      // Accent Divider
      ctx.fillStyle = 'rgba(202, 138, 4, 0.8)';
      ctx.fillRect(cx - 140, cy + 12, 280, 2);

      // Subtitle
      ctx.font = '700 18px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText('— ABYSS ASCENSION —', cx, cy + 28);

      ctx.restore();
    }

    // 7. Transition Control Prompt (Shot 17)
    if (t >= 41.0 && t < 44.0) {
      const promptProg = Math.min(1.0, (t - 41.0) / 1.0);
      ctx.save();
      ctx.globalAlpha = promptProg;
      ctx.textAlign = 'center';
      ctx.font = '700 13px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText('WASD / ARROWS — MOVE   ·   SPACE / CLICK — ATTACK', cx, CINEMATIC_H - 150);
      ctx.restore();
    }

    // 8. Skip Prompt in bottom-right corner (Shown only after 3.0s unskippable window)
    if (CinematicSafety.shouldShowSkipHint() && t < 41.0) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = '600 11px sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.fillText('[ SPACE / ENTER / CLICK TO SKIP ]', CINEMATIC_W - 40, CINEMATIC_H - 24);
      ctx.restore();
    }

    ctx.restore();
  },

  _drawSubtitle(ctx, cx, cy, text, speaker) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const subY = CINEMATIC_H - 140;

    // Subtitle background pill
    ctx.font = 'italic 16px Georgia, serif';
    const textW = ctx.measureText(text).width;
    const boxW = Math.max(260, textW + 50);

    ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
    ctx.strokeStyle = 'rgba(202, 138, 4, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx - boxW / 2, subY - 14, boxW, 30, 4);
    ctx.fill();
    ctx.stroke();

    if (speaker) {
      ctx.font = '700 11px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#ca8a04';
      ctx.fillText(speaker, cx, subY - 24);
    }

    ctx.font = 'italic 15px Georgia, serif';
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(text, cx, subY);

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // PARTICLE GENERATORS
  // ─────────────────────────────────────────────────────────────
  _spawnGateDust(x, y) {
    if (!THE_DESCENT) return;
    for (let i = 0; i < 35; i++) {
      const angle = (Math.random() * Math.PI) - (Math.PI / 2);
      const spd = 20 + Math.random() * 65;
      THE_DESCENT.dustParticles.push({
        x: x + 16 + (Math.random() * 24 - 12),
        y: y + 8,
        vx: Math.cos(angle) * spd,
        vy: -Math.abs(Math.sin(angle)) * spd * 0.7,
        r: 3 + Math.random() * 6,
        alpha: 0.75,
        color: Math.random() < 0.5 ? 'rgba(148, 163, 184, 0.65)' : 'rgba(203, 213, 225, 0.5)'
      });
    }
  },

  _spawnSparks(x, y) {
    if (!THE_DESCENT) return;
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 70;
      THE_DESCENT.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        r: 1.5 + Math.random() * 2,
        life: 0.35 + Math.random() * 0.25,
        color: Math.random() < 0.6 ? '#facc15' : '#fb923c'
      });
    }
  },

  _spawnBlood(x, y) {
    if (!THE_DESCENT) return;
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 15 + Math.random() * 45;
      THE_DESCENT.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        r: 2 + Math.random() * 2.5,
        life: 0.3 + Math.random() * 0.3,
        color: '#dc2626'
      });
    }
  },

  _tickParticles(dt) {
    const d = THE_DESCENT;
    if (!d) return;

    for (let i = d.sparks.length - 1; i >= 0; i--) {
      const sp = d.sparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) d.sparks.splice(i, 1);
    }

    for (let i = d.dustParticles.length - 1; i >= 0; i--) {
      const dp = d.dustParticles[i];
      dp.x += dp.vx * dt;
      dp.y += dp.vy * dt;
      dp.alpha -= dt * 0.45;
      dp.r += dt * 3.5;
      if (dp.alpha <= 0) d.dustParticles.splice(i, 1);
    }
  }
};

export const startIntroCinematic = () => CinematicDirector.startIntro();
export const endIntroCinematic = () => CinematicDirector.endIntro();
export const ciAdvance = () => CinematicDirector.advance();

if (typeof window !== 'undefined') {
  window.startIntroCinematic = startIntroCinematic;
  window.endIntroCinematic = endIntroCinematic;
  window.ciAdvance = ciAdvance;
  window.CinematicDirector = CinematicDirector;
  Object.defineProperty(window, 'CI', {
    get: () => CI,
    set: (v) => { CI = v; },
    configurable: true
  });
  Object.defineProperty(window, 'THE_DESCENT', {
    get: () => THE_DESCENT,
    set: (v) => { THE_DESCENT = v; },
    configurable: true
  });
}
