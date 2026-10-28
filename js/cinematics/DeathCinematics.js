// =====================================================================
//  DUNGEON BREAK — js/cinematics/DeathCinematics.js
//  Authoritative In-Engine 2.5D Cinematic Death Pipeline:
//  - "LAST BREATH" (Seamless Camera Glide, In-World Decals, Environmental Continuity)
//  - "SHATTERED MIND" (Eldritch Void Eyes, World-Space Hallucinations, Reality Fractures)
//  - Boss Execution Scenes (Gorgaroth, Malakor, Abyss Warden in Real Arenas)
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { EventBus } from '../core/EventBus.js';
import { CinematicRenderer, CINEMATIC_W, CINEMATIC_H } from './CinematicRenderer.js';
import { quitToMainMenu } from '../ui/PauseMenu.js';
import { FloorManager } from '../world/FloorManager.js';
import { Camera } from '../rendering/Camera.js';
import { InputManager, INPUT_KEYS, MOUSE_STATE } from '../core/InputManager.js';
import { UITransitionManager } from '../ui/UITransitionManager.js';
import { ShatteredMindCinematic } from './ShatteredMindCinematic.js';
import { HallucinationSystem } from '../systems/HallucinationSystem.js';
import { triggerCinematicBanner } from '../ui/HUD.js';
import { EndingDispatcher } from './EndingCinematics.js';
import { RunResetManager } from '../systems/RunResetManager.js';
import { GorgarothCinematics } from './GorgarothCinematics.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { CinematicSafety } from './CinematicSafety.js';

export let ACTIVE_DEATH_CINEMATIC = null;

let _deathRequested = false;
let _deathReason = null;
let _deathSource = null;
let _deathFloor = 1;
let _currentRunId = 1;

/**
 * Single authoritative, idempotent death transition function (Part 2, 4, 5, 62).
 * Every death source (health 0, sanity 0, trap, boss) must call this.
 * The first valid call wins. All later calls are ignored.
 */
export function requestDeath(reason = 'dungeon_normal', source = null) {
  const P = GameState.P;
  const isSanity = (reason === 'shattered_mind' || reason === 'sanity' || source === 'sanity' || (P && P.san <= 0));

  if (_deathRequested || 
      GameState.STATE === GameStates.DYING || 
      GameState.STATE === GameStates.DEATH_NORMAL || 
      GameState.STATE === GameStates.DEATH_SANITY || 
      GameState.STATE === GameStates.DEATH_RESULTS) {
    return false;
  }

  _deathRequested = true;
  _deathReason = isSanity ? 'shattered_mind' : (reason || 'dungeon_normal');
  _deathSource = isSanity ? 'sanity' : (source || (typeof reason === 'string' ? reason : 'unknown'));
  _deathFloor = GameState.LV || 1;

  console.log(`[DEATH] DEATH_REQUESTED: reason=${_deathReason}, source=${_deathSource}, floor=${_deathFloor}`);

  // Clear active saved run immediately upon death so dead state is never saved or resumable
  if (SaveSystem && SaveSystem.clearRun) {
    SaveSystem.clearRun();
  }

  // Authoritative Achievement Unlocks on Death
  const isWardenDeath = (_deathReason === 'warden' || _deathSource === 'warden' || _deathReason === 'boss_warden' || _deathReason === 'boss_abyss_warden' || (GameState.LV === 10 && GameState.BOSS && GameState.BOSS.id === 'abyss_warden'));

  const isTrapDeath = (typeof _deathReason === 'string' && (_deathReason.includes('trap') || _deathReason === 'spike' || _deathReason === 'fire')) ||
                      (typeof _deathSource === 'string' && (_deathSource.includes('trap') || _deathSource === 'spike' || _deathSource === 'fire')) ||
                      (typeof _deathSource === 'object' && _deathSource && (_deathSource.isTrap || _deathSource.environmental || (_deathSource.type && ['spike', 'fire', 'pit', 'chasm'].includes(_deathSource.type))));

  const isVoidOrDarkness = (typeof _deathReason === 'string' && (_deathReason.includes('void') || _deathReason.includes('darkness') || _deathReason.includes('chasm') || _deathReason.includes('pit') || _deathReason === 'insanity_rampage')) ||
                          (typeof _deathSource === 'string' && (_deathSource.includes('void') || _deathSource.includes('darkness') || _deathSource.includes('chasm') || _deathSource.includes('pit')));

  if (isSanity) {
    AchievementSystem.unlock('mind_break');
    SaveSystem.unlockMemory('memory_shattered_mind');
  } else if (isWardenDeath) {
    AchievementSystem.unlock('executed');
  } else if (isTrapDeath || isVoidOrDarkness) {
    AchievementSystem.unlock('consumed');
  } else {
    AchievementSystem.unlock('overwhelmed');
  }

  // Immediate terminal death lock (Part 3)
  if (P) {
    P.dead = true;
    P.dying = true;
    P.vx = 0;
    P.vy = 0;
    P.acd = 999;
    P.aanim = 0;
    P.dcd = 999;
    P.deathCause = _deathReason;
    P.invulnerable = true;
    if (isSanity) {
      P.san = 0;
      P.cinematicPose = 'hidden';
      P.attacking = false;
      P.dashing = false;
      P.weaponLowered = true;
    }
  }

  // Cancel any active transitions/warps
  FloorManager.resetTransitionLock();
  GameState.levelTransitionActive = false;
  GameState.WARP_ACTIVE = false;

  // Dispatch to appropriate cinematic
  const isGorgaroth = (!isSanity && (_deathReason === 'boss_gorgaroth' || _deathSource === 'gorgaroth' || (GameState.LV === 3 && GameState.BOSS && GameState.BOSS.id === 'gorgaroth')));
  if (isSanity) {
    DeathCinematics.startSanity();
  } else if (isGorgaroth) {
    GameState.setState(GameStates.DYING);
    GorgarothCinematics.startPlayerDeath(GameState.BOSS, _deathSource);
  } else {
    GameState.setState(GameStates.DYING);
    DeathCinematics.startNormal(_deathReason);
  }

  console.log(`[DEATH] DEATH_CINEMATIC_STARTED: type=${isSanity ? 'sanity' : 'normal'}`);
  return true;
}

export const triggerDeath = requestDeath;

export const DeathCinematics = {
  selectedButtonIndex: 0,
  hoveredIndex: -1,
  lastActionTime: 0,

  getActiveCinematic() {
    return ACTIVE_DEATH_CINEMATIC;
  },
  isActive() {
    return !!ACTIVE_DEATH_CINEMATIC;
  },

  enterResults(instant = false) {
    if (GameState.STATE === GameStates.DEATH_RESULTS) return;
    GameState.setState(GameStates.DEATH_RESULTS);
    console.log('[DEATH] DEATH_CINEMATIC_FINISHED');
    console.log('[DEATH] DEATH_RESULTS_ENTERED');
    this.selectedButtonIndex = 0;
    this.hoveredIndex = -1;
    if (ACTIVE_DEATH_CINEMATIC) {
      ACTIVE_DEATH_CINEMATIC.resultsTimer = instant ? 1.5 : 0;
    }

    // Phase 6: Increment Lifetime Deaths & Check Death Progression Tiers
    SaveSystem.incrementLifetimeDeaths();

    // Authoritative Milestone Tracking for Physical Deaths (Group A Milestones 1-4)
    const isSanity = (_deathReason === 'shattered_mind' || _deathReason === 'sanity' || _deathSource === 'sanity');
    if (!isSanity && !GameState.IS_DEBUG_ENDING) {
      const isGorgaroth = (_deathReason === 'boss_gorgaroth' || _deathSource === 'gorgaroth' || (GameState.LV === 3 && GameState.BOSS && GameState.BOSS.id === 'gorgaroth'));
      const isMalakor = (_deathReason === 'boss_malakor' || _deathSource === 'malakor' || (GameState.LV === 6 && GameState.BOSS && GameState.BOSS.id === 'malakor'));
      const isWarden = (_deathReason === 'boss_abyss_warden' || _deathReason === 'warden' || _deathSource === 'warden' || (GameState.LV === 10 && GameState.BOSS && GameState.BOSS.id === 'abyss_warden'));
      const isTrap = (typeof _deathReason === 'string' && (_deathReason.startsWith('trap_') || _deathReason === 'trap' || _deathReason === 'void' || _deathReason === 'darkness' || _deathReason === 'spike' || _deathReason === 'fire'));

      if (isGorgaroth) {
        SaveSystem.recordCompletionMilestone('death_gorgaroth', { reason: _deathReason, floor: _deathFloor });
      } else if (isMalakor) {
        SaveSystem.recordCompletionMilestone('death_malakor', { reason: _deathReason, floor: _deathFloor });
      } else if (isWarden) {
        SaveSystem.recordCompletionMilestone('death_warden', { reason: _deathReason, floor: _deathFloor });
      } else if (!isTrap) {
        SaveSystem.recordCompletionMilestone('death_normal_enemy', { reason: _deathReason, source: _deathSource, floor: _deathFloor });
      }
    }
  },

  skipCinematic() {
    if (GameState.STATE === GameStates.DEATH_RESULTS) return;
    if (!CinematicSafety.canSkip()) return;
    if (GorgarothCinematics.isPlayerDeathActive()) {
      GorgarothCinematics.reset();
      this.enterResults(true);
      return;
    }
    const isSanity = (GameState.STATE === GameStates.DEATH_SANITY || _deathReason === 'sanity' || _deathReason === 'shattered_mind');
    if (isSanity) {
      ShatteredMindCinematic.skip();
    }
    this.enterResults(true);
  },

  startNormal(cause = 'dungeon_normal') {
    CinematicSafety.startCinematic('death_normal');
    GameState.setState(GameStates.DEATH_NORMAL);
    CinematicRenderer.resetCamera();

    if (GameState.P) {
      GameState.CAM.tx = GameState.P.x;
      GameState.CAM.ty = GameState.P.y;
      GameState.CAM.tz = 1.35;
    }
    Camera.shake(20);

    let sound = 'player_hurt';
    if (cause === 'boss_gorgaroth') sound = 'shockwave';
    else if (cause === 'boss_malakor') sound = 'portal_enter';
    else if (cause === 'boss_abyss_warden') sound = 'boss_roar';
    SoundManager.snd(sound);

    ACTIVE_DEATH_CINEMATIC = {
      runId: _currentRunId,
      type: 'normal',
      cause: cause,
      timer: 0,
      soundCues: {},
      flashAlpha: 0.9,
      fadeToBlack: 0,
      hitStopTimer: 0.15
    };
    GameState.ACTIVE_DEATH_CINEMATIC = ACTIVE_DEATH_CINEMATIC;

    EventBus.emit('player:death', { cause });
  },

  startSanity() {
    GameState.setState(GameStates.DEATH_SANITY);
    GameState.CINEMATIC_ACTIVE = true;
    GameState.ACTIVE_CINEMATIC_TYPE = 'shattered_mind';
    ACTIVE_DEATH_CINEMATIC = {
      runId: _currentRunId,
      type: 'sanity',
      cause: 'sanity',
      timer: 0,
      soundCues: {},
      flashAlpha: 0,
      fadeToBlack: 0,
      hitStopTimer: 0
    };
    GameState.ACTIVE_DEATH_CINEMATIC = ACTIVE_DEATH_CINEMATIC;

    ShatteredMindCinematic.start();
  },

  tick(dt) {
    // 0. Shattered Mind Master Cinematic Priority Tick
    if (GameState.STATE === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
      ShatteredMindCinematic.tick(dt);
      if (ACTIVE_DEATH_CINEMATIC) {
        ACTIVE_DEATH_CINEMATIC.timer = ShatteredMindCinematic.timer;
      }
      return;
    }

    // 0.1 Gorgaroth Player Death Master Cinematic Priority Tick
    if (GorgarothCinematics.isPlayerDeathActive()) {
      GorgarothCinematics.tick(dt);
      return;
    }

    if (GameState.STATE === GameStates.DEATH_RESULTS) {
      if (ACTIVE_DEATH_CINEMATIC) {
        ACTIVE_DEATH_CINEMATIC.resultsTimer = (ACTIVE_DEATH_CINEMATIC.resultsTimer || 0) + dt;
      }
      return;
    }
    if (!ACTIVE_DEATH_CINEMATIC) return;

    const d = ACTIVE_DEATH_CINEMATIC;
    if (d.runId && d.runId !== _currentRunId) return;

    // Hit-stop freeze
    if (d.hitStopTimer > 0) {
      const remainingHitStop = d.hitStopTimer;
      d.hitStopTimer = Math.max(0, d.hitStopTimer - dt);
      const leftoverDt = dt - remainingHitStop;
      if (leftoverDt <= 0) return;
      dt = leftoverDt;
    }

    d.timer += dt;
    CinematicRenderer.update(dt);
    const t = d.timer;
    const P = GameState.P;
    if (!P) return;

    // ─────────────────────────────────────────────────────────────
    // A. LAST BREATH CAMERA & AUDIO TIMELINE (11.5s sequence)
    // ─────────────────────────────────────────────────────────────
    if (d.type === 'normal') {
      // Sound & Haptic Cues
      if (!d.soundCues.weaponDrop && t >= 1.0) {
        d.soundCues.weaponDrop = true;
        SoundManager.snd('weapon_clang');
        Camera.shake(7);
      }
      if (!d.soundCues.kneeThud && t >= 3.6) {
        d.soundCues.kneeThud = true;
        SoundManager.snd('heartbeat');
        Camera.shake(4);
      }
      if (!d.soundCues.collapse && t >= 6.0) {
        d.soundCues.collapse = true;
        d.soundCues.lastHeartbeat = true;
        SoundManager.snd('heartbeat');
      }

      const isBossCause = d.cause && (d.cause.startsWith('boss_') || d.cause === 'boss');
      const boss = GameState.BOSS;
      const hasValidBossPos = boss && typeof boss.x === 'number' && typeof boss.y === 'number';

      if (d.cause === 'boss_gorgaroth') {
        // Gorgaroth Specific Cinematic Sequence:
        // Phase 1 (0.0s - 2.5s): Rowan staggers, weapon lowers, movement slows, camera follows closely
        if (t < 2.5) {
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.48;
          P.cinematicPose = 'stagger';
        }
        // Phase 2 (2.5s - 4.8s): Rowan falls naturally, camera holds on him briefly
        else if (t < 4.8) {
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y + 0.12;
          GameState.CAM.tz = 1.62;
          P.cinematicPose = 'fallen';
          P.dead = true;
        }
        // Phase 3 (4.8s - 7.0s): Pure BLACK SCREEN with subtle sound, no excessive text
        else if (t < 7.0) {
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.35;
          if (!d.soundCues.dungeonWhisper && t >= 4.9) {
            d.soundCues.dungeonWhisper = true;
            SoundManager.snd('heartbeat');
          }
        }
        // Phase 4 (7.0s - 10.2s): Reveal dark image of the dungeon "The dungeon won."
        else if (t < 10.2) {
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.35;
        }
        // Phase 5 (10.2s+): Transition into existing death screen
        else {
          if (GameState.STATE !== GameStates.DEATH_RESULTS) {
            this.enterResults(false);
          }
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.35;
        }
      } else if (isBossCause && hasValidBossPos) {
        // Boss Execution in-engine framing
        if (t < 3.0) {
          // Frame Rowan collapsing with boss looming in background
          GameState.CAM.tx = P.x * 0.75 + boss.x * 0.25;
          GameState.CAM.ty = P.y * 0.75 + boss.y * 0.25;
          GameState.CAM.tz = 1.45;
          P.cinematicPose = 'stagger';
        } else if (t < 7.0) {
          // Camera centers between boss and fallen Rowan
          GameState.CAM.tx = P.x * 0.55 + boss.x * 0.45;
          GameState.CAM.ty = P.y * 0.55 + boss.y * 0.45;
          GameState.CAM.tz = 1.6;
          P.cinematicPose = 'fallen';
          P.dead = true;
        } else if (t < 10.0) {
          // Close on fallen Rowan on the arena floor
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y + 0.15;
          GameState.CAM.tz = 1.65;
          P.cinematicPose = 'fallen';
          P.dead = true;
        } else {
          // Steady view
          if (GameState.STATE !== GameStates.DEATH_RESULTS) {
            this.enterResults(false);
          }
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.35;
          P.cinematicPose = 'fallen';
          P.dead = true;
        }
      } else {
        // Standard Dungeon Death Camera Direction
        if (t < 1.0) {
          // Shot 01: Final hit impact shock, camera focused on Rowan
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.38;
        } else if (t < 3.5) {
          // Shot 02: Camera slow push, Rowan staggers, weapon slips from hand
          GameState.CAM.tx = P.x - 0.2;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.55;
        } else if (t < 6.0) {
          // Shot 03: Lower side angle, drops to one knee, hand touches floor
          GameState.CAM.tx = P.x - 0.25;
          GameState.CAM.ty = P.y + 0.2;
          GameState.CAM.tz = 1.7;
        } else if (t < 9.0) {
          // Shot 04: Slow push closer, collapses prone on stone floor
          GameState.CAM.tx = P.x - 0.15;
          GameState.CAM.ty = P.y + 0.25;
          GameState.CAM.tz = 1.82;
        } else if (t < 11.5) {
          // Shot 05: Slow pull away, real dungeon architecture remains visible!
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.4;
        } else {
          // Shot 06: Steady view over the room with results card
          if (GameState.STATE !== GameStates.DEATH_RESULTS) {
            this.enterResults(false);
          }
          GameState.CAM.tx = P.x;
          GameState.CAM.ty = P.y;
          GameState.CAM.tz = 1.35;
          if (d.fadeToBlack < 1) {
            d.fadeToBlack = Math.min(1, d.fadeToBlack + dt * 1.5);
          }
        }
      }
    }

    if (d.flashAlpha > 0) {
      d.flashAlpha = Math.max(0, d.flashAlpha - dt * 2.2);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // WORLD ENTITIES (Inside Camera.apply — real world coordinates)
  // ─────────────────────────────────────────────────────────────
  drawWorldEntities(ctx) {
    const P = GameState.P;
    if (!P) return;
    const isSanity = (GameState.STATE === GameStates.DEATH_SANITY);
    const d = ACTIVE_DEATH_CINEMATIC;
    const t = d ? d.timer : 15.0;
    const cause = d ? d.cause : (isSanity ? 'sanity' : 'dungeon_normal');

    // Gorgaroth player death in-engine world rendering delegation
    if (GorgarothCinematics.isPlayerDeathActive()) {
      return;
    }

    // Shattered Mind in-engine world rendering delegation
    if (isSanity || cause === 'sanity' || ShatteredMindCinematic.isActive()) {
      ShatteredMindCinematic.drawWorldEntities(ctx);
      return;
    }

    const px = P.x * 32;
    const py = P.y * 32;

    // 1. Blood Pool / Dark Void Pool decal under Rowan
    if (isSanity || cause === 'sanity') {
      // Swirling purple abyss rift pool
      const voidRadius = Math.min(34, 6 + Math.min(12, t) * 2.3);
      ctx.save();
      ctx.fillStyle = '#090114';
      ctx.globalAlpha = Math.min(0.85, t * 0.35);
      ctx.beginPath();
      ctx.ellipse(px, py + 12, voidRadius, voidRadius * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swirling runic ring
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(px, py + 12, voidRadius * 0.82, voidRadius * 0.36, t * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // Expanding dark crimson blood decal on cold stones
      const bloodRadius = Math.min(28, 4 + Math.min(10, t) * 2.4);
      ctx.save();
      ctx.fillStyle = '#450a0a';
      ctx.globalAlpha = Math.min(0.85, t * 0.4);
      ctx.beginPath();
      ctx.ellipse(px + 4, py + 14, bloodRadius, bloodRadius * 0.42, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Deeper coagulated center
      ctx.fillStyle = '#1c0505';
      ctx.beginPath();
      ctx.ellipse(px + 2, py + 13, bloodRadius * 0.58, bloodRadius * 0.25, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Fallen Weapon on the Floor
    if (t >= 1.0) {
      const dropT = Math.min(1, (t - 1.0) / 0.8);
      ctx.save();
      ctx.translate(px + 18, py + 10 + dropT * 4);
      ctx.rotate(0.55 + dropT * 0.2);

      // Steel blade
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-2, -14, 4, 20);
      // Fuller groove
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-0.7, -13, 1.4, 16);
      // Gold Crossguard
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-6, 2, 12, 3);
      // Dark leather grip & pommel
      ctx.fillStyle = '#334155';
      ctx.fillRect(-1.5, 5, 3, 5);
      ctx.beginPath();
      ctx.arc(0, 11, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Subtle rune gleam
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(-0.8, -10, 1.6, 6);
      ctx.restore();
    }

    // 3. Shattered Mind: Eldritch Void Eyes manifested across the real room
    if (isSanity || cause === 'sanity') {
      if (t >= 8.0) {
        const eyeCount = Math.min(18, Math.floor((t - 8.0) * 2.5));
        for (let i = 0; i < eyeCount; i++) {
          const ang = (i * 1.37) + (i % 2 === 0 ? 0.35 : -0.35);
          const dist = 38 + ((i * 41) % 80);
          const ex = px + Math.cos(ang) * dist;
          const ey = py + Math.sin(ang) * dist * 0.6 - 12;
          const eyeBlink = Math.sin(t * 3.5 + i * 2.1) > -0.35;
          if (!eyeBlink) continue;

          ctx.save();
          ctx.translate(ex, ey);
          const isRed = (i % 3 === 0);
          ctx.fillStyle = isRed ? '#ef4444' : '#a855f7';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10;

          // Eye socket
          ctx.fillStyle = '#06010a';
          ctx.beginPath();
          ctx.ellipse(0, 0, 8.5, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Glowing iris
          ctx.fillStyle = isRed ? '#ef4444' : '#c084fc';
          ctx.beginPath();
          ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
          ctx.fill();

          // Vertical slit pupil
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.ellipse(0, 0, 1, 2.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Hallucination shadows orbiting Rowan (18s to 25s)
      if (t >= 18.0 && t <= 25.0) {
        for (let i = 0; i < 3; i++) {
          const orbitAng = (i / 3) * Math.PI * 2 + t * 0.8;
          const hx = px + Math.cos(orbitAng) * 48;
          const hy = py + Math.sin(orbitAng) * 24;
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = '#a855f7';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 12;
          // Phantom silhouette
          ctx.beginPath();
          ctx.arc(hx, hy - 14, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(hx - 5, hy - 8, 10, 14);
          ctx.restore();
        }
      }
    }

    // 4. Boss Execution Ground Decals
    if (cause === 'boss_gorgaroth') {
      // Molten fissures radiating across stone floor
      ctx.save();
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px, py + 8);
      ctx.lineTo(px - 22, py + 18);
      ctx.lineTo(px - 38, py + 12);
      ctx.moveTo(px, py + 8);
      ctx.lineTo(px + 24, py + 20);
      ctx.lineTo(px + 42, py + 16);
      ctx.stroke();
      ctx.restore();
    } else if (cause === 'boss_malakor') {
      // Void warp runes on stone floor
      ctx.save();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px, py + 10, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (cause === 'boss_abyss_warden') {
      // Abyssal corruption fissures and crimson runes radiating across stone floor
      ctx.save();
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px, py + 8);
      ctx.lineTo(px - 26, py + 20);
      ctx.lineTo(px - 42, py + 14);
      ctx.moveTo(px, py + 8);
      ctx.lineTo(px + 28, py + 22);
      ctx.lineTo(px + 48, py + 18);
      ctx.moveTo(px, py + 8);
      ctx.lineTo(px, py + 34);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(185, 28, 28, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(px, py + 12, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // SCREEN-SPACE DRAW (Letterbox, Vignettes, Subtitles, Results Card)
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (GameState.STATE === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
      ShatteredMindCinematic.draw(ctx);
      return;
    }
    if (GorgarothCinematics.isPlayerDeathActive()) {
      GorgarothCinematics.draw(ctx);
      return;
    }

    const isDeathResults = (GameState.STATE === GameStates.DEATH_RESULTS);
    const isSanity = (GameState.STATE === GameStates.DEATH_SANITY || _deathReason === 'sanity' || _deathReason === 'shattered_mind');
    const { P, LV, ABYSS_SOULS } = GameState;
    const lv = _deathFloor || LV || 1;
    const cause = _deathReason || (isSanity ? 'sanity' : 'dungeon_normal');

    // If already in DEATH_RESULTS, draw the results screen directly without cinematic overlays
    if (isDeathResults) {
      ctx.save();
      const sx = (ctx.canvas ? ctx.canvas.width : LW) / CINEMATIC_W;
      const sy = (ctx.canvas ? ctx.canvas.height : LH) / CINEMATIC_H;
      ctx.scale(sx, sy);

      if (isSanity || cause === 'sanity' || cause === 'shattered_mind') {
        this.drawStatsAndButtons(
          ctx,
          lv,
          P,
          ABYSS_SOULS,
          '#a855f7',
          'SHATTERED MIND',
          '— CONSUMED BY THE VOID —',
          '"The abyss did not need your blood. It needed your sanity."'
        );
      } else if (cause === 'boss_gorgaroth') {
        this.drawStatsAndButtons(ctx, lv, P, ABYSS_SOULS, '#ef4444', 'CRUSHED BENEATH THE HEAVY AXE', '— GORGAROTH SLAIN —', '"Your iron was no match for the executioner."');
      } else if (cause === 'boss_malakor') {
        this.drawStatsAndButtons(ctx, lv, P, ABYSS_SOULS, '#c084fc', 'DISSOLVED INTO THE VOID', '— MALAKOR CONSUMED —', '"The shadow had already claimed your reflection."');
      } else if (cause === 'boss_abyss_warden') {
        this.drawStatsAndButtons(ctx, lv, P, ABYSS_SOULS, '#dc2626', 'FELLED BY THE WARDEN', '— THRONE OF OBLIVION —', '"The gate remains sealed. Lyra will not be saved."');
      } else {
        const title = cause && cause.startsWith('trap_') ? 'IMPALED UPON THE ANCIENT TRAP' : 'YOU PERISHED IN THE DARK';
        const sub = cause && cause.startsWith('trap_') ? '— CORRIDORS OF IRON —' : '— DEEP CATACOMBS —';
        this.drawStatsAndButtons(ctx, lv, P, ABYSS_SOULS, '#ef4444', title, sub, '"The stone floors claim another wandering soul."');
      }
      ctx.restore();
      return;
    }

    if (!ACTIVE_DEATH_CINEMATIC) return;
    const timer = ACTIVE_DEATH_CINEMATIC.timer;

    if (isSanity || cause === 'sanity' || cause === 'shattered_mind') {
      ShatteredMindCinematic.draw(ctx);
      return;
    }

    ctx.save();
    // High-Resolution 1280 × 720 Transform
    const sx = (ctx.canvas ? ctx.canvas.width : LW) / CINEMATIC_W;
    const sy = (ctx.canvas ? ctx.canvas.height : LH) / CINEMATIC_H;
    ctx.scale(sx, sy);

    if (cause === 'boss_gorgaroth') {
      this.drawGorgarothExecution(ctx, timer, LV, P, ABYSS_SOULS);
    } else if (cause === 'boss_malakor') {
      this.drawMalakorExecution(ctx, timer, LV, P, ABYSS_SOULS);
    } else if (cause === 'boss_abyss_warden') {
      this.drawAbyssWardenExecution(ctx, timer, LV, P, ABYSS_SOULS);
    } else {
      this.drawLastBreath(ctx, timer, LV, P, ABYSS_SOULS, cause);
    }

    // Letterbox bars
    CinematicRenderer.drawLetterbox(ctx);

    // Skip Prompt during active cinematic
    const maxTime = (isSanity || cause === 'sanity') ? 31.0 : 11.5;
    if (timer > 0.8 && timer < maxTime) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '12px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.fillText('[ SPACE / ENTER / CLICK TO SKIP ]', CINEMATIC_W - 36, CINEMATIC_H - 24);
    }

    ctx.restore();
  },

  _drawCinematicSubtitle(ctx, text, col = '#fde68a') {
    if (!text) return;
    const cx = CINEMATIC_W / 2;
    const cy = CINEMATIC_H - 85;

    ctx.save();
    ctx.font = 'italic 16px "Crimson Text", Georgia, serif';
    const textW = ctx.measureText(text).width;
    const padX = 26;
    const padY = 9;
    const pillW = textW + padX * 2;
    const pillH = 34;

    ctx.fillStyle = 'rgba(2, 4, 10, 0.85)';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx - pillW / 2, cy - pillH / 2, pillW, pillH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.fillText(text, cx, cy);
    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // 1. LAST BREATH (6-SHOT NORMAL DEATH CINEMATIC)
  // ─────────────────────────────────────────────────────────────
  drawLastBreath(ctx, timer, lv, p, souls, cause) {
    const cx = CINEMATIC_W / 2, cy = CINEMATIC_H * 0.48;

    // Shot 01–05: The In-Engine Environmental Scene (0 to 11.5s)
    if (timer < 11.5) {
      // Atmospheric Somber Vignette (Center stays clear to show real world and Rowan)
      const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.18, cx, cy, CINEMATIC_W * 0.68);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.65, 'rgba(69, 10, 10, 0.22)');
      vig.addColorStop(1, 'rgba(3, 1, 4, 0.86)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      // Flash on hit
      if (ACTIVE_DEATH_CINEMATIC && ACTIVE_DEATH_CINEMATIC.flashAlpha > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${ACTIVE_DEATH_CINEMATIC.flashAlpha * 0.45})`;
        ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);
      }

      // Contextual Lore Subtitle
      let sub = '';
      if (timer < 2.0) {
        sub = 'A mortal blow strikes home. Rowan’s vision blurs as strength gives way...';
      } else if (timer < 4.5) {
        sub = 'The weapon slips from nerveless fingers onto the cold dungeon flagstones.';
      } else if (timer < 7.5) {
        sub = 'Breathing falters in the dark. The stone floor offers no comfort.';
      } else {
        sub = 'Silence returns to the sunken crypts. Another soul claimed by the depths.';
      }
      this._drawCinematicSubtitle(ctx, sub, '#fecaca');
    }
    // Shot 06: Cinematic complete -> Minimal Cinematic Overlay (Part 23 & 24)
    else {
      this.drawStatsAndButtons(
        ctx,
        lv,
        p,
        souls,
        '#ef4444',
        'FALLEN IN THE ABYSS',
        '— THE SUNKEN CRYPTS —',
        '"The dungeon took another name."'
      );
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 2. SHATTERED MIND (8-SHOT PSYCHOLOGICAL HORROR)
  // ─────────────────────────────────────────────────────────────
  drawSanityDeath(ctx, timer, lv, p, souls) {
    const cx = CINEMATIC_W / 2, cy = CINEMATIC_H * 0.46;

    if (timer < 31.0) {
      // Eldritch Void Vignette
      const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.16, cx, cy, CINEMATIC_W * 0.68);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.65, 'rgba(88, 28, 135, 0.25)');
      vig.addColorStop(1, 'rgba(4, 1, 10, 0.88)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      // Impact shock flash
      if (ACTIVE_DEATH_CINEMATIC && ACTIVE_DEATH_CINEMATIC.flashAlpha > 0) {
        ctx.fillStyle = `rgba(168, 85, 247, ${ACTIVE_DEATH_CINEMATIC.flashAlpha * 0.5})`;
        ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);
      }

      // Contextual Lore Subtitles
      let sub = '';
      if (timer < 4.0) {
        sub = 'The air grows freezing cold. The walls murmur in voices you used to know...';
      } else if (timer < 8.0) {
        sub = 'Shadows detach themselves from the stones, mimicking your every tremor.';
      } else if (timer < 14.0) {
        sub = 'Unblinking crimson eyes awaken in the dark, watching your unraveling mind.';
      } else if (timer < 20.0) {
        sub = '“You were never escaping. You were only descending deeper.”';
      } else if (timer < 28.0) {
        sub = 'Reality shatters into jagged splinters of grief and forgotten vows...';
      } else {
        sub = 'The abyss did not take your blood. It consumed your soul.';
      }
      this._drawCinematicSubtitle(ctx, sub, '#e9d5ff');
    } else {
      this.drawStatsAndButtons(
        ctx,
        lv,
        p,
        souls,
        '#a855f7',
        'SHATTERED MIND',
        '— THE LIGHTLESS ABYSS —',
        '"You forgot which voice was your own."'
      );
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. BOSS EXECUTION: GORGAROTH
  // ─────────────────────────────────────────────────────────────
  drawGorgarothExecution(ctx, timer, lv, p, souls) {
    const cx = CINEMATIC_W / 2, cy = CINEMATIC_H * 0.48;

    // Phase 1 (0.0s - 2.5s): Rowan staggers, weapon lowers, movement slows, edges darken
    if (timer < 2.5) {
      const darkAlpha = Math.min(0.92, 0.45 + timer * 0.2);
      const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.14, cx, cy, CINEMATIC_W * 0.62);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.55, 'rgba(40, 10, 5, 0.35)');
      vig.addColorStop(1, `rgba(5, 2, 2, ${darkAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      if (ACTIVE_DEATH_CINEMATIC && ACTIVE_DEATH_CINEMATIC.flashAlpha > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${ACTIVE_DEATH_CINEMATIC.flashAlpha * 0.5})`;
        ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);
      }
      this._drawCinematicSubtitle(ctx, 'The devastating blow shatters bone and iron alike. Vision darkens...', '#fecaca');
    }
    // Phase 2 (2.5s - 4.8s): Rowan falls naturally, camera holds on him
    else if (timer < 4.8) {
      const darkProgress = Math.min(1.0, (timer - 2.5) / 2.0);
      const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.10, cx, cy, CINEMATIC_W * 0.55);
      vig.addColorStop(0, `rgba(0, 0, 0, ${darkProgress * 0.45})`);
      vig.addColorStop(0.6, `rgba(20, 5, 5, ${0.4 + darkProgress * 0.5})`);
      vig.addColorStop(1, 'rgba(2, 1, 3, 0.98)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      this._drawCinematicSubtitle(ctx, 'Strength leaves your limbs. The cold stone receives you.', '#fed7aa');
    }
    // Phase 3 (4.8s - 7.0s): BLACK SCREEN with subtle sound, no excessive text
    else if (timer < 7.0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);
      // No excessive text, pure darkness and silence
    }
    // Phase 4 (7.0s - 10.2s): Reveal dark image of the dungeon with "The dungeon won."
    else if (timer < 10.2) {
      const sceneProg = Math.min(1.0, (timer - 7.0) / 1.2);
      ctx.save();
      ctx.globalAlpha = sceneProg;

      // Dark dungeon backdrop
      ctx.fillStyle = '#030509';
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      // Distant towering stone dungeon vault arches
      const archGrad = ctx.createLinearGradient(0, 0, 0, CINEMATIC_H);
      archGrad.addColorStop(0, '#0a0e18');
      archGrad.addColorStop(0.4, '#05070d');
      archGrad.addColorStop(1, '#020306');
      ctx.fillStyle = archGrad;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      // Subtle atmospheric masonry silhouettes (arch ribs and pillars)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      // Left pillar & arch
      ctx.beginPath();
      ctx.moveTo(120, CINEMATIC_H);
      ctx.lineTo(120, 160);
      ctx.quadraticCurveTo(240, 80, cx, 75);
      ctx.quadraticCurveTo(cx - 80, 85, 180, 180);
      ctx.lineTo(180, CINEMATIC_H);
      ctx.closePath();
      ctx.fill();

      // Right pillar & arch
      ctx.beginPath();
      ctx.moveTo(CINEMATIC_W - 120, CINEMATIC_H);
      ctx.lineTo(CINEMATIC_W - 120, 160);
      ctx.quadraticCurveTo(CINEMATIC_W - 240, 80, cx, 75);
      ctx.quadraticCurveTo(cx + 80, 85, CINEMATIC_W - 180, 180);
      ctx.lineTo(CINEMATIC_W - 180, CINEMATIC_H);
      ctx.closePath();
      ctx.fill();

      // Hanging iron chains in silhouette
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(260, 0); ctx.lineTo(260, 240);
      ctx.moveTo(CINEMATIC_W - 260, 0); ctx.lineTo(CINEMATIC_W - 260, 260);
      ctx.moveTo(cx - 160, 0); ctx.lineTo(cx - 160, 190);
      ctx.moveTo(cx + 160, 0); ctx.lineTo(cx + 160, 210);
      ctx.stroke();

      // Distant solitary flickering torch ember glow
      const emberPulse = Math.sin((timer - 7.0) * 4.0) * 0.15 + 0.85;
      const torchGlow = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 20, 320);
      torchGlow.addColorStop(0, `rgba(234, 88, 12, ${0.18 * emberPulse})`);
      torchGlow.addColorStop(0.5, `rgba(180, 83, 9, ${0.08 * emberPulse})`);
      torchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = torchGlow;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      // Perspective flagstone grid receding into distance
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + 40);
        ctx.lineTo(cx + i * 260, CINEMATIC_H);
        ctx.stroke();
      }

      // Vignette over dungeon image
      const innerVig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.15, cx, cy, CINEMATIC_W * 0.65);
      innerVig.addColorStop(0, 'rgba(0,0,0,0)');
      innerVig.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = innerVig;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      // Centered revelation text: "The dungeon won."
      const textAlpha = Math.min(1.0, (timer - 7.5) / 1.0);
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 34px Cinzel, serif';
      ctx.fillStyle = '#fde68a';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 24;
      ctx.fillText('THE DUNGEON WON.', cx, cy - 10);

      ctx.shadowBlur = 0;
      ctx.font = 'italic 16px "Crimson Text", Georgia, serif';
      ctx.fillStyle = 'rgba(254, 215, 170, 0.75)';
      ctx.fillText('Five centuries of iron and stone. No mortal breaks these walls.', cx, cy + 34);

      ctx.restore();
    }
    // Phase 5 (10.2s+): Existing death screen
    else {
      this.drawStatsAndButtons(
        ctx,
        lv,
        p,
        souls,
        '#ef4444',
        'CRUSHED BENEATH THE HEAVY AXE',
        '— GORGAROTH SLAIN —',
        '"Your iron was no match for the executioner."'
      );
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 4. BOSS EXECUTION: MALAKOR
  // ─────────────────────────────────────────────────────────────
  drawMalakorExecution(ctx, timer, lv, p, souls) {
    const cx = CINEMATIC_W / 2, cy = CINEMATIC_H * 0.48;

    if (timer < 10.0) {
      const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.18, cx, cy, CINEMATIC_W * 0.70);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.65, 'rgba(88, 28, 135, 0.24)');
      vig.addColorStop(1, 'rgba(3, 1, 8, 0.88)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      const sub = timer < 4.0
        ? 'Void singularities rend mortal armor and shatter flesh into dust.'
        : '“Your form returns to nothingness. There is no soul left to weep.”';
      this._drawCinematicSubtitle(ctx, sub, '#e9d5ff');
    } else {
      this.drawStatsAndButtons(
        ctx,
        lv,
        p,
        souls,
        '#a855f7',
        'FALLEN IN THE ABYSS',
        '— THE VOID NEXUS —',
        '"The Void Weaver erased your path."'
      );
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 5. BOSS EXECUTION: THE ABYSS WARDEN
  // ─────────────────────────────────────────────────────────────
  drawAbyssWardenExecution(ctx, timer, lv, p, souls) {
    const cx = CINEMATIC_W / 2, cy = CINEMATIC_H * 0.48;

    if (timer < 10.0) {
      const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.18, cx, cy, CINEMATIC_W * 0.70);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.65, 'rgba(127, 29, 29, 0.24)');
      vig.addColorStop(1, 'rgba(5, 1, 4, 0.88)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      const sub = timer < 4.0
        ? 'The Warden’s black blade strikes through the abyss with cold finality.'
        : '“The abyss cannot be escaped. The cycle of the Sunken Citadel remains unbroken.”';
      this._drawCinematicSubtitle(ctx, sub, '#fecaca');
    } else {
      this.drawStatsAndButtons(
        ctx,
        lv,
        p,
        souls,
        '#dc2626',
        'FELLED BY THE WARDEN',
        '— THRONE OF OBLIVION —',
        '"The gate remains sealed. Lyra will not be saved."'
      );
    }
  },

  // ─────────────────────────────────────────────────────────────
  // CLEAN IN-ENGINE RESULTS PANEL & TEXT-FIRST BUTTONS (Parts 24–31)
  // ─────────────────────────────────────────────────────────────
  drawStatsAndButtons(ctx, lv, p, souls, accentColor = '#ef4444', title = 'FALLEN IN THE ABYSS', subtitle = '— THE SUNKEN CRYPTS —', fateLine = '"The dungeon took another name."') {
    ctx.save();

    const d = ACTIVE_DEATH_CINEMATIC;
    const maxTime = (d && d.type === 'sanity') ? 55.0 : 11.5;
    let revT = 0;
    if (GameState.STATE === GameStates.DEATH_RESULTS) {
      revT = (d && d.resultsTimer !== undefined) ? d.resultsTimer : 1.5;
    } else {
      revT = Math.max(0, (d ? d.timer : maxTime) - maxTime);
    }

    // Staggered reveal alphas (Part 29: 1–1.5s total reveal)
    const vigAlpha = Math.min(1, revT * 3.0);
    const titleAlpha = Math.min(1, Math.max(0, (revT - 0.15) * 3.0));
    const subAlpha = Math.min(1, Math.max(0, (revT - 0.35) * 3.0));
    const statsAlpha = Math.min(1, Math.max(0, (revT - 0.55) * 3.0));
    const btnsAlpha = Math.min(1, Math.max(0, (revT - 0.85) * 3.0));

    const isSanity = (d && d.type === 'sanity');

    // 1. Translucent atmospheric radial vignette preserving the real dungeon world (Part 23 & 24)
    if (vigAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = vigAlpha;
      const vig = ctx.createRadialGradient(CINEMATIC_W / 2, CINEMATIC_H * 0.44, 100, CINEMATIC_W / 2, CINEMATIC_H * 0.44, CINEMATIC_W * 0.72);
      if (isSanity) {
        vig.addColorStop(0, 'rgba(12, 4, 24, 0.45)');
        vig.addColorStop(0.55, 'rgba(8, 2, 18, 0.76)');
        vig.addColorStop(1, 'rgba(4, 1, 10, 0.94)');
      } else {
        vig.addColorStop(0, 'rgba(6, 4, 8, 0.42)');
        vig.addColorStop(0.55, 'rgba(4, 2, 6, 0.75)');
        vig.addColorStop(1, 'rgba(2, 1, 3, 0.93)');
      }
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      // Subtle horizontal atmospheric aura band behind title & stats
      const aura = ctx.createRadialGradient(CINEMATIC_W / 2, 260, 20, CINEMATIC_W / 2, 260, 420);
      aura.addColorStop(0, isSanity ? 'rgba(168, 85, 247, 0.12)' : 'rgba(239, 68, 68, 0.09)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 70, CINEMATIC_W, 400);

      // Part 31: Subtle red unblinking eye appearances for Shattered Mind
      if (isSanity) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        const eyePulse = Math.sin(GameState.F * 0.04) * 0.15 + 0.3;
        ctx.globalAlpha = vigAlpha * eyePulse;
        ctx.fillRect(CINEMATIC_W * 0.18, 220, 4, 2);
        ctx.fillRect(CINEMATIC_W * 0.18 + 7, 220, 4, 2);
        ctx.fillRect(CINEMATIC_W * 0.82, 340, 4, 2);
        ctx.fillRect(CINEMATIC_W * 0.82 + 7, 340, 4, 2);
      }
      ctx.restore();
    }

    // 2. Dramatic Glowing Title (Part 25)
    if (titleAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      const titleGlow = Math.sin(GameState.F * 0.05) * 6 + 18;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = titleGlow;

      const titleGrad = ctx.createLinearGradient(CINEMATIC_W / 2, 85, CINEMATIC_W / 2, 135);
      if (accentColor === '#a855f7' || accentColor === '#c084fc') {
        titleGrad.addColorStop(0, '#ffffff');
        titleGrad.addColorStop(0.35, '#f3e8ff');
        titleGrad.addColorStop(0.75, '#c084fc');
        titleGrad.addColorStop(1, '#7e22ce');
      } else if (accentColor === '#ea580c') {
        titleGrad.addColorStop(0, '#ffffff');
        titleGrad.addColorStop(0.35, '#ffedd5');
        titleGrad.addColorStop(0.75, '#fb923c');
        titleGrad.addColorStop(1, '#c2410c');
      } else {
        titleGrad.addColorStop(0, '#ffffff');
        titleGrad.addColorStop(0.35, '#fee2e2');
        titleGrad.addColorStop(0.75, '#f87171');
        titleGrad.addColorStop(1, '#991b1b');
      }
      ctx.fillStyle = titleGrad;
      ctx.font = '900 42px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, CINEMATIC_W / 2, 110);
      ctx.restore();
    }

    // 3. Subtitle & Fate Line (Part 26)
    if (subAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = subAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Subtitle
      if (subtitle) {
        ctx.fillStyle = 'rgba(253, 230, 138, 0.85)';
        ctx.font = 'bold 13px Cinzel, serif';
        ctx.shadowColor = 'rgba(217, 119, 6, 0.4)';
        ctx.shadowBlur = 6;
        ctx.fillText(subtitle, CINEMATIC_W / 2, 154);
        ctx.shadowBlur = 0;
      }

      // Fate Line (Verbatim Part 26)
      if (fateLine) {
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'italic 18px "Crimson Text", Georgia, serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(fateLine, CINEMATIC_W / 2, 190);
        ctx.shadowBlur = 0;
      }

      // Symmetrical minimal divider line with center rune
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CINEMATIC_W / 2 - 200, 218);
      ctx.lineTo(CINEMATIC_W / 2 - 14, 218);
      ctx.moveTo(CINEMATIC_W / 2 + 14, 218);
      ctx.lineTo(CINEMATIC_W / 2 + 200, 218);
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.font = '10px Cinzel, serif';
      ctx.fillText('◈', CINEMATIC_W / 2, 218);
      ctx.restore();
    }

    // 4. Clean Stats Grid (Part 27: Small labels, large readable numbers, minimal borders)
    if (statsAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = statsAlpha;

      const fSec = Math.floor(GameState.FLOOR_ACTIVE_TIME || 0);
      const floorTimeStr = String(Math.floor(fSec / 60)).padStart(2, '0') + ':' + String(fSec % 60).padStart(2, '0');

      const rSec = Math.floor(GameState.RUN_ACTIVE_TIME || 0);
      const runTimeStr = String(Math.floor(rSec / 60)).padStart(2, '0') + ':' + String(rSec % 60).padStart(2, '0');

      const statGrid = [
        { label: 'FLOOR', val: String(lv).padStart(2, '0') },
        { label: 'FLOOR TIME', val: floorTimeStr },
        { label: 'DESCENT', val: runTimeStr },
        { label: 'SOULS', val: String(souls || 0) },
        { label: 'KILLS', val: String(p?.killed || 0) },
        { label: 'SURVIVORS', val: String(p?.saved || 0).padStart(2, '0') }
      ];

      const colW = 100;
      const colGap = 16;
      const totalGridW = statGrid.length * colW + (statGrid.length - 1) * colGap;
      const gridStartX = (CINEMATIC_W - totalGridW) / 2;
      const gridY = 244;

      statGrid.forEach((item, i) => {
        const itemAlpha = Math.min(1, Math.max(0, (revT - (0.55 + i * 0.1)) * 3.5));
        if (itemAlpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = statsAlpha * itemAlpha;
        const colX = gridStartX + i * (colW + colGap);

        // Thin column separator (except last)
        if (i < statGrid.length - 1) {
          ctx.strokeStyle = 'rgba(201, 168, 76, 0.18)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(colX + colW + colGap / 2, gridY + 6);
          ctx.lineTo(colX + colW + colGap / 2, gridY + 54);
          ctx.stroke();
        }

        // Small Label
        ctx.fillStyle = 'rgba(217, 119, 6, 0.9)';
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(item.label, colX + colW / 2, gridY + 6);

        // Readable Number / Time string
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px Cinzel, serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText(item.val, colX + colW / 2, gridY + 28);
        ctx.shadowBlur = 0;
        ctx.restore();
      });
      ctx.restore();
    }

    // 5. TEXT-FIRST Action Buttons (Part 28: Vertically stacked, text-first, gold/green marker)
    if (btnsAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = btnsAlpha;

      const buttons = [
        { id: 'retry', text: 'RETRY RUN', keyHint: 'ENTER / SPACE', color: '#22c55e' },
        { id: 'sanctum', text: 'ABYSS SANCTUM', keyHint: 'S', color: '#c084fc' },
        { id: 'title', text: 'TITLE SCREEN', keyHint: 'ESC', color: '#fde68a' }
      ];

      const btnW = 320;
      const btnH = 42;
      const startY = 360;
      const gapY = 52;

      // Mouse Coordinates in Cinematic Space
      const mouseState = MOUSE_STATE || (InputManager && InputManager.MOUSE_STATE) || { mx: 0, my: 0 };
      const cmx = ((mouseState.mx || 0) / LW) * CINEMATIC_W;
      const cmy = ((mouseState.my || 0) / LH) * CINEMATIC_H;

      let hovered = -1;
      buttons.forEach((btn, i) => {
        const by = startY + i * gapY;
        const bx = CINEMATIC_W / 2 - btnW / 2;
        if (cmx >= bx && cmx <= bx + btnW && cmy >= by - 6 && cmy <= by + btnH + 6) {
          hovered = i;
        }
      });

      if (this.lastMouseX !== cmx || this.lastMouseY !== cmy) {
        this.lastMouseX = cmx;
        this.lastMouseY = cmy;
        if (hovered !== -1 && hovered !== this.selectedButtonIndex) {
          this.hoveredIndex = hovered;
          this.selectedButtonIndex = hovered;
          SoundManager.snd('menu_hover');
        }
      }

      buttons.forEach((btn, i) => {
        const by = startY + i * gapY;
        const bx = CINEMATIC_W / 2;
        const isFocused = (this.selectedButtonIndex === i);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const glowBlur = isFocused ? 14 : 0;

        if (isFocused) {
          ctx.shadowColor = btn.color;
          ctx.shadowBlur = glowBlur;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px Cinzel, serif';

          // Text with left marker glyph ◈
          ctx.fillText(`◈  ${btn.text}`, bx, by + btnH / 2);

          // Subtle hairline illuminated underline
          ctx.strokeStyle = btn.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(bx - 100, by + btnH - 4);
          ctx.lineTo(bx + 100, by + btnH - 4);
          ctx.stroke();

          // Key hint right underneath
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.font = 'italic 10.5px "Crimson Text", Georgia, serif';
          ctx.fillText(`[ ${btn.keyHint} ]`, bx, by + btnH + 11);
        } else {
          ctx.fillStyle = 'rgba(226, 232, 240, 0.65)';
          ctx.font = '16px Cinzel, serif';
          ctx.fillText(btn.text, bx, by + btnH / 2);
        }
        ctx.restore();
      });

      // Bottom minimal navigation prompt
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.font = '11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('↑ / ↓  NAVIGATE   ·   ENTER / SPACE  SELECT   ·   ESC  TITLE', CINEMATIC_W / 2, 550);

      ctx.restore();
    }

    ctx.restore();
  },

  reset() {
    ACTIVE_DEATH_CINEMATIC = null;
    GameState.ACTIVE_DEATH_CINEMATIC = null;
    _deathRequested = false;
    this.selectedButtonIndex = 0;
    this.hoveredIndex = -1;
    this._actionTriggered = false;
    if (GorgarothCinematics && GorgarothCinematics.reset) {
      GorgarothCinematics.reset();
    }
  },

  handleKeyDown(key) {
    // 0. Shattered Mind Priority (handles active cutscene skip AND end card buttons/Escape)
    if (GameState.STATE === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
      if (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.handleKey) {
        const handled = window.ShatteredMindCinematic.handleKey(key);
        if (handled) return true;
      }
    }

    // 1. Cinematic Active Phase: space / enter / escape skips directly to DEATH_RESULTS (Part 11 & 31)
    const isCinematic = (GameState.STATE === GameStates.DEATH_NORMAL || GameState.STATE === GameStates.DEATH_SANITY || GameState.STATE === GameStates.DYING);
    if (isCinematic) {
      if (key === ' ' || key === 'Enter' || key === 'Escape') {
        if (CinematicSafety.isValidSkipKey(key)) {
          this.skipCinematic();
        }
        return true;
      }
      return true; // Consume keys during cinematic so gameplay buffers don't fire
    }

    // 2. Results Card Phase (Part 11: Only retry, sanctum, and title respond)
    if (GameState.STATE === GameStates.DEATH_RESULTS) {
      if (key === 'ArrowUp' || key === 'KeyW' || key === 'w' || key === 'W') {
        this.selectedButtonIndex = (this.selectedButtonIndex - 1 + 3) % 3;
        SoundManager.snd('menu_hover');
        return true;
      }
      if (key === 'ArrowDown' || key === 'KeyS' || key === 's' || key === 'S') {
        this.selectedButtonIndex = (this.selectedButtonIndex + 1) % 3;
        SoundManager.snd('menu_hover');
        return true;
      }
      if (key === 'Enter' || key === ' ' || key === 'Space') {
        this.activateSelected();
        return true;
      }
      if (key === 'Escape') {
        this.selectedButtonIndex = 2; // Title Screen
        this.activateSelected();
        return true;
      }
      return false;
    }

    return false;
  },

  /**
   * Authoritative Run Reset Pipeline (Part 8, 9, 10, 16, 17, 18, 59, 63, 64).
   * Fully resets all gameplay, camera, audio, player, and floor systems to Floor 1.
   */
  startNewRun(fromActivate = false) {
    if (this._actionTriggered && !fromActivate) return;
    const now = performance.now();
    if (!fromActivate && (now - this.lastActionTime < 300)) return;
    this.lastActionTime = now;
    this._actionTriggered = true;

    console.log('[RETRY] RETRY_REQUESTED');

    // 1. Debounce and stop current death cinematic & audio
    this.reset();
    ShatteredMindCinematic.reset();
    EndingDispatcher.reset();
    if (typeof window !== 'undefined' && window.WardenDefeatCinematic && window.WardenDefeatCinematic.reset) {
      window.WardenDefeatCinematic.reset();
    }
    _deathRequested = false;
    this._actionTriggered = true;

    // 2. Smooth single transition into fresh Floor 1 run via RunResetManager
    UITransitionManager.transitionTo(() => {
      this._actionTriggered = false;
      RunResetManager.resetRun({ playIntro: false });
    }, 0.35);
  },

  activateSelected() {
    if (this._actionTriggered) return;
    const now = performance.now();
    if (now - this.lastActionTime < 300) return;
    this.lastActionTime = now;
    this._actionTriggered = true;

    SoundManager.snd('menu_select');
    const idx = this.selectedButtonIndex;

    if (idx === 0) {
      this.startNewRun(true);
    } else if (idx === 1) {
      this.reset();
      this._actionTriggered = true;
      UITransitionManager.transitionTo(() => {
        this._actionTriggered = false;
        GameState.resetPlayer();
        GameState.setState(GameStates.SANCTUM);
      }, 0.35);
    } else {
      this.reset();
      this._actionTriggered = true;
      UITransitionManager.transitionTo(() => {
        this._actionTriggered = false;
        quitToMainMenu();
      }, 0.35);
    }
  },

  handleMouseMove(mx, my) {
    if (GameState.STATE === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
      if (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.handleMouseMove) {
        return window.ShatteredMindCinematic.handleMouseMove(mx, my);
      }
    }
    return false;
  },

  handleClick(mx, my) {
    if (GameState.STATE === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
      if (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.handleClick) {
        return window.ShatteredMindCinematic.handleClick(mx, my);
      }
    }

    // 1. Cinematic Phase: click skips to results only if permitted by CinematicSafety
    const isCinematic = (GameState.STATE === GameStates.DEATH_NORMAL || GameState.STATE === GameStates.DEATH_SANITY || GameState.STATE === GameStates.DYING);
    if (isCinematic) {
      if (CinematicSafety.isValidSkipClick()) {
        this.skipCinematic();
      }
      return true;
    }

    // 2. Results Phase: button hit testing
    if (GameState.STATE === GameStates.DEATH_RESULTS) {
      const cx = (mx / LW) * CINEMATIC_W;
      const cy = (my / LH) * CINEMATIC_H;

      const btnW = 320;
      const btnH = 42;
      const startY = 360;
      const gapY = 52;
      const bx = CINEMATIC_W / 2 - btnW / 2;

      for (let i = 0; i < 3; i++) {
        const by = startY + i * gapY;
        if (cx >= bx - 20 && cx <= bx + btnW + 20 && cy >= by - 8 && cy <= by + btnH + 12) {
          this.selectedButtonIndex = i;
          this.activateSelected();
          return true;
        }
      }
      return true;
    }

    return false;
  },

  handleKey(key) {
    return this.handleKeyDown(key);
  }
};

export const startNormalDeathSequence = (cause) => requestDeath(cause, 'test');
export const startSanityDeathSequence = () => requestDeath('shattered_mind', 'sanity');
export const drawDeathScreen = (ctx) => DeathCinematics.draw(ctx);
export const startNewRun = () => DeathCinematics.startNewRun();

if (typeof window !== 'undefined') {
  window.requestDeath = requestDeath;
  window.startNewRun = startNewRun;
  window.startNormalDeathSequence = startNormalDeathSequence;
  window.startSanityDeathSequence = startSanityDeathSequence;
  window.drawDeathScreen = drawDeathScreen;
  window.DeathCinematics = DeathCinematics;
}
