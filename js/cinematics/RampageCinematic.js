// =====================================================================
//  DUNGEON BREAK — js/cinematics/RampageCinematic.js
//  RAMPAGE / UNCROWNED ABYSS KING — AUTHORITATIVE APPROVED CINEMATIC
//
//  STRICT VISUAL STYLE LOCK & CANONICAL PIPELINE:
//  - Exact Lord Rowan renderer from approved Hero & Betrayal cinematics
//    (Crimson cape #991b1b, plate armor #334155 / #475569 with gold trim #ca8a04,
//     great helmet #0f172a with glowing azure visor slit #38bdf8, sabatons #1e293b)
//  - Authentic in-game Bow (curved stave #34d399, steel bowstring #e2e8f0, real arrow projectile)
//  - Authentic in-game Sword (steel blade #cbd5e1 with #f8fafc edge, gold crossguard #ca8a04)
//  - Exact Citadel Guards from Betrayal (cloak #1e1b4b, cuirass #334155, helm #0f172a, plume #dc2626)
//  - Exact King from Betrayal (velvet cloak #1e1b4b with ermine trim #f8fafc, robes #312e81, crown #ca8a04)
//  - Exact Shattered Mind pixel-art Absolute Eye (_drawPixelEye) & blink
//  - Exact Hero-style outside world (cliff with slate strata, dungeon scree verge, road, meadow, portal arch)
//  - Standalone palace throne room transforming in real-time into ancient dungeon chamber
//  - Grounded continuous combat with primary attacker rule, blood & clash sparks
//  - King dissolves before final strike; pitch black word-by-word revelation:
//    "LOOKS" ... "CAN" ... "BE" ... "DECEIVING..."
//  - Push toward Absolute Eye; eye blinks closed; snap to black; handoff to Credits
//  - Zero actor teleportations; zero camera whipping; smooth continuous easing.
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T, clamp, easeInOut } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { EventBus } from '../core/EventBus.js';
import { MusicManager } from '../audio/MusicManager.js';
import { Credits } from './Credits.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';

let _activeRampageCinematic = null;
let _rampageFastForwarding = false;
let _rampageFinished = false;

function playSnd(name) {
  if (_rampageFastForwarding) return;
  SoundManager.snd(name);
}

function smoothstep(x) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

function triggerHitStop(duration = 0.06) {
  if (_rampageFastForwarding) return;
  if (_activeRampageCinematic) {
    _activeRampageCinematic.hitStopTimer = duration;
  }
}

// ─────────────────────────────────────────────────────────────
// RAMPAGE MASTER TIMELINE (74.00s Total Cinematic)
// ─────────────────────────────────────────────────────────────
export const RAMPAGE_TIMELINE = {
  // PHASE 1: OUTSIDE RETURN ALONE (0.00 – 11.00s)
  ROWAN_RETURN: 4.50,            // 0.00 – 4.50s: Rowan emerges alone from ancient dungeon portal (Hero outside world)
  KING_RECOGNITION: 7.50,        // 4.50 – 7.50s: King's distant presence / Subtitle: “So... you returned.”
  GUARDS_APPROACH: 11.00,        // 7.50 – 11.00s: Guards approach visibly along stone avenue & flanks (no spawning)

  // PHASE 2: COMBAT SEQUENCE (BOW + SWORD) (11.00 – 26.50s)
  BOW_AIM_1: 11.80,              // Rowan turns, draws Bow, aims at distant Scout 1
  BOW_FIRE_1: 12.30,             // Arrow fired, travels, impacts Scout 1; Scout 1 dissolves
  BOW_AIM_2: 13.50,              // Rowan pivots, draws Bow, aims at flank Scout 2
  BOW_FIRE_2: 14.00,             // Arrow fired, hits Scout 2; Scout 2 dissolves
  SWORD_TRANSITION: 15.20,       // Vanguard crosses into melee; Rowan smoothly stows Bow, draws Sword
  VANGUARD_CLASH: 16.40,         // Vanguard strikes; Rowan blocks (clash sparks); counter-slash (blood spray)
  SPEAR_DODGE: 18.60,            // Spearman thrusts halberd; Rowan ducks; spin-cleaves Vanguard down
  SPEAR_PARRY: 21.00,            // Spearman second thrust; Rowan parries blade; riposte downs Spearman
  CAPTAIN_CLIMAX: 24.20,         // Citadel Captain heavy charge; Rowan 360-degree whirlwind cleave
  COMBAT_AFTERMATH: 26.50,       // All guards dissolved into embers; Rowan stands victorious; quiet hold
  ROWAN_WALKS_AWAY: 28.50,       // Rowan turns, walks toward citadel along stone road

  // PHASE 3: SEAMLESS TRANSITION TO STANDALONE PALACE (28.50 – 33.00s)
  DUSK_FADE_START: 28.50,        // Dusk & shadow envelop meadow
  FADE_TO_BLACK: 30.80,          // Controlled smooth fade to 100% solid black
  SOLID_BLACK_HOLD: 31.40,       // Solid black hold; camera seamlessly set to Throne Room (NO CAMERA SWEEP)
  PALACE_REVEAL: 33.00,          // Palace fades in from black; Rowan enters along scarlet carpet

  // PHASE 4: CONFRONTATION & DIALOGUE (33.00 – 44.50s)
  CONFRONTATION_WALK: 35.00,     // Rowan walks down aisle, halts before royal dais
  CONFRONTATION_1: 37.50,        // King: “You came all this way for me?”
  CONFRONTATION_2: 39.80,        // Rowan: “You sent them.”
  CONFRONTATION_3: 42.00,        // King: “And you survived.”
  CONFRONTATION_PAUSE: 42.60,    // Dramatic pause
  CONFRONTATION_4: 44.50,        // Rowan: “This ends now.”

  // PHASE 5: CHARGE, STRIKE & KING DISSOLUTION (44.50 – 48.50s)
  ROWAN_CHARGE: 46.20,           // Rowan charges up dais stairs with sword poised!
  KING_DISSOLVE: 47.50,          // King destabilizes with violet glitch & dissolves into void motes!
  EMPTY_THRONE_HOLD: 48.50,      // Rowan's blade strikes empty air; Rowan freezes, recoils in shock

  // PHASE 6: PITCH BLACK MEMORY FLASH (WORD BY WORD) (48.50 – 55.00s)
  WORD_LOOKS: 49.90,             // 49.20 – 49.90s: "LOOKS"
  GAP_1: 50.30,                  // 49.90 – 50.30s: (pause)
  WORD_CAN: 51.00,               // 50.30 – 51.00s: "CAN"
  GAP_2: 51.40,                  // 51.00 – 51.40s: (pause)
  WORD_BE: 52.10,                // 51.40 – 52.10s: "BE"
  GAP_3: 52.50,                  // 52.10 – 52.50s: (pause)
  WORD_DECEIVING: 54.50,         // 52.50 – 54.50s: "DECEIVING..."
  BLACK_BEFORE_TRANSFORM: 55.00, // 54.50 – 55.00s: (pause)

  // PHASE 7: PALACE TRANSFORMATION (NOT A HARD CUT) (55.00 – 63.50s)
  TRANSFORM_START: 55.00,        // Return to throne room; Rowan standing grounded; spatial ripple begins
  TRANSFORM_TORCHES: 57.50,      // Torches morph from amber to violet flame
  TRANSFORM_CARPET: 60.00,       // Royal carpet decays away; gold trims dissolve
  TRANSFORM_STONE: 62.00,        // Floor tiles crack into ancient basalt; walls weather
  TRANSFORM_SETTLED: 63.50,      // Pillars become ancient monoliths; throne morphs into ancient altar

  // PHASE 8: THE ABSOLUTE REVEAL, CAMERA PUSH, BLINK & BLACK (63.50 – 74.00s)
  EYE_AWAKEN: 64.50,             // Approved pixel-art Eye awakens above altar
  EYE_PUSH: 70.50,               // Slow, breathtaking camera push toward Eye (Rowan in foreground)
  EYE_BLINK_START: 70.50,        // Eye eyelid smoothly closes (70.50 – 71.00s)
  BLACK_SNAP: 71.00,             // Snap to 100% pure black!
  BLACK_HOLD: 74.00              // Dead silence hold; handoff to Credits.start('rampage')
};

// ─────────────────────────────────────────────────────────────
// LOCKED APPROVED PIXEL-ART RED EYE DESIGN (FROM SHATTERED MIND)
// ─────────────────────────────────────────────────────────────
function _drawPixelEye(ctx, cx, cy, scale, blinkProg, timer) {
  ctx.save();
  const P = Math.max(2, Math.round(scale * 1.5)); // chunky pixel unit
  const effectiveOpen = Math.max(0, 1.0 - blinkProg);

  // Outer dark aura glow (smooth radial gradient behind pixel eye)
  if (effectiveOpen > 0.1) {
    ctx.save();
    const auraR = 26 * P;
    const auraGrad = ctx.createRadialGradient(cx, cy, 4 * P, cx, cy, auraR);
    auraGrad.addColorStop(0, 'rgba(220, 38, 38, 0.35)');
    auraGrad.addColorStop(0.35, 'rgba(153, 27, 27, 0.20)');
    auraGrad.addColorStop(0.7, 'rgba(69, 10, 10, 0.06)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(cx - auraR, cy - auraR, auraR * 2, auraR * 2);
    ctx.restore();
  }

  if (effectiveOpen < 0.06) {
    // Eye fully closed — just a dark crimson slit
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(Math.round(cx - 24 * P), Math.round(cy - P), 48 * P, 2 * P);
    ctx.restore();
    return;
  }

  // Pixel Almond Sclera & Crimson Outline
  const halfW = 20; // in P units
  const maxHalfH = Math.max(1, Math.round(10 * effectiveOpen));

  // 1. Black/Crimson Sclera Interior
  ctx.fillStyle = '#150205';
  for (let ry = -maxHalfH; ry <= maxHalfH; ry++) {
    const norm = Math.abs(ry) / maxHalfH;
    const span = Math.round(halfW * (1.0 - norm * norm * 0.9));
    if (span > 0) {
      ctx.fillRect(Math.round(cx - span * P), Math.round(cy + ry * P), span * 2 * P, P);
    }
  }

  // 2. Chunky Pixel Red Outline
  ctx.fillStyle = '#dc2626';
  for (let ry = -maxHalfH; ry <= maxHalfH; ry++) {
    const norm = Math.abs(ry) / maxHalfH;
    const span = Math.round(halfW * (1.0 - norm * norm * 0.9));
    if (span > 0) {
      ctx.fillRect(Math.round(cx - (span + 1) * P), Math.round(cy + ry * P), P, P);
      ctx.fillRect(Math.round(cx + span * P), Math.round(cy + ry * P), P, P);
    }
  }
  // Top & bottom caps
  ctx.fillRect(Math.round(cx - 3 * P), Math.round(cy - (maxHalfH + 1) * P), 6 * P, P);
  ctx.fillRect(Math.round(cx - 3 * P), Math.round(cy + (maxHalfH + 1) * P), 6 * P, P);

  // 3. Iris (Chunky concentric pixel rings)
  if (effectiveOpen > 0.15) {
    const irisR = Math.min(maxHalfH, 7); // P units
    for (let iy = -irisR; iy <= irisR; iy++) {
      const inorm = Math.abs(iy) / irisR;
      const ispan = Math.round(Math.sqrt(Math.max(0, 1 - inorm * inorm)) * irisR * 1.2);
      if (ispan > 0) {
        // Dark outer iris
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(Math.round(cx - ispan * P), Math.round(cy + iy * P), ispan * 2 * P, P);
        // Fiery bright inner iris
        const innerSpan = Math.max(0, ispan - 1);
        if (innerSpan > 0 && Math.abs(iy) < irisR - 1) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(Math.round(cx - innerSpan * P), Math.round(cy + iy * P), innerSpan * 2 * P, P);
        }
      }
    }

    // 4. Slit Pupil (Vertical black column)
    const pupilW = Math.max(1, Math.round(1.5 * scale));
    const pupilH = Math.round((irisR + 1) * P);
    ctx.fillStyle = '#050002';
    ctx.fillRect(Math.round(cx - pupilW / 2), Math.round(cy - pupilH), pupilW, pupilH * 2);

    // 5. Specular Highlights (Chunky white/pink pixel blocks)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(cx - 3 * P), Math.round(cy - 3 * P), 2 * P, 2 * P);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(Math.round(cx - P), Math.round(cy - 2 * P), P, P);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// COMBAT PARTICLES: BLOOD, SPARKS, DISSOLUTION & ARROWS
// ─────────────────────────────────────────────────────────────
function _spawnCombatBlood(cine, x, y, dirAngle, severity = 'medium', groundY = null) {
  if (!cine || !cine.bloodParticles) return;
  const count = (severity === 'heavy') ? 14 : (severity === 'strong' ? 9 : 6);
  const baseSpd = (severity === 'heavy') ? 95 : 65;
  const cols = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626'];
  const actualGroundY = groundY !== null ? groundY : y + 14;

  for (let i = 0; i < count; i++) {
    const ang = dirAngle + (Math.random() - 0.5) * 0.70;
    const spd = baseSpd + (Math.random() - 0.5) * 35;
    const pLife = 0.28 + Math.random() * 0.12;
    cine.bloodParticles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - (Math.random() * 20),
      r: (severity === 'heavy') ? 1.5 + Math.random() * 0.8 : 1.2 + Math.random() * 0.6,
      col: cols[Math.floor(Math.random() * cols.length)],
      life: pLife,
      maxLife: pLife,
      groundY: actualGroundY + (Math.random() - 0.5) * 4
    });
  }

  // Ground blood decals
  if (cine.bloodDecals) {
    const numDecals = (severity === 'heavy') ? 3 : 1;
    for (let i = 0; i < numDecals; i++) {
      cine.bloodDecals.push({
        x: x + Math.cos(dirAngle) * (6 + Math.random() * 10),
        y: actualGroundY + (Math.random() - 0.5) * 3,
        r: 1.2 + Math.random() * 0.7,
        col: Math.random() < 0.6 ? '#450a0a' : '#7f1d1d',
        alpha: 0.75,
        decay: 0.08
      });
    }
  }
}

function _spawnClashSparks(cine, x, y, count = 7) {
  if (!cine || !cine.impactSparks) return;
  const cols = ['#fef08a', '#fde047', '#ffffff'];
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 45 + Math.random() * 65;
    const life = 0.10 + Math.random() * 0.08;
    cine.impactSparks.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r: 1.0 + Math.random() * 1.2,
      col: cols[Math.floor(Math.random() * cols.length)],
      life, maxLife: life
    });
  }
}

function _spawnDissolutionParticles(cine, x, y, count = 16, color = '#94a3b8') {
  if (!cine || !cine.dissolveParticles) return;
  for (let i = 0; i < count; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const spd = 20 + Math.random() * 50;
    const life = 0.5 + Math.random() * 0.4;
    cine.dissolveParticles.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 20,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - (15 + Math.random() * 25),
      r: 1.2 + Math.random() * 1.6,
      col: (i % 2 === 0) ? color : '#334155',
      life, maxLife: life
    });
  }
}

class RampageArrow {
  constructor(x, y, targetX, targetY, speed = 340) {
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    const dx = targetX - x;
    const dy = targetY - y;
    this.angle = Math.atan2(dy, dx);
    this.speed = speed;
    this.vx = Math.cos(this.angle) * speed;
    this.vy = Math.sin(this.angle) * speed;
    this.active = true;
    this.hit = false;
    this.life = 1.2;
  }

  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    const distToTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);
    if (distToTarget < 14 || this.life <= 0) {
      this.active = false;
      this.hit = true;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Exact projectile styling from ProjectileSystem.js
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(7, 0);
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(7, -2.5);
    ctx.lineTo(13, 0);
    ctx.lineTo(7, 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function _updateRampageParticles(cine, dt) {
  if (!cine) return;

  // Blood particles with ground splat
  if (cine.bloodParticles) {
    for (let i = cine.bloodParticles.length - 1; i >= 0; i--) {
      const p = cine.bloodParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt; // gravity
      p.life -= dt;

      if (p.y >= p.groundY) {
        p.vy = 0;
        p.vx *= 0.3;
        p.y = p.groundY;
      }
      if (p.life <= 0) {
        cine.bloodParticles.splice(i, 1);
      }
    }
  }

  // Impact clash sparks
  if (cine.impactSparks) {
    for (let i = cine.impactSparks.length - 1; i >= 0; i--) {
      const s = cine.impactSparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        cine.impactSparks.splice(i, 1);
      }
    }
  }

  // Dissolution motes
  if (cine.dissolveParticles) {
    for (let i = cine.dissolveParticles.length - 1; i >= 0; i--) {
      const dp = cine.dissolveParticles[i];
      dp.x += dp.vx * dt;
      dp.y += dp.vy * dt;
      dp.life -= dt;
      if (dp.life <= 0) {
        cine.dissolveParticles.splice(i, 1);
      }
    }
  }

  // Blood decals fade slowly
  if (cine.bloodDecals) {
    for (let i = cine.bloodDecals.length - 1; i >= 0; i--) {
      const bd = cine.bloodDecals[i];
      bd.alpha = Math.max(0, bd.alpha - dt * bd.decay);
      if (bd.alpha <= 0) {
        cine.bloodDecals.splice(i, 1);
      }
    }
  }
}

function _drawRampageParticles(ctx, cine) {
  if (!cine) return;

  // Blood particles
  if (cine.bloodParticles) {
    cine.bloodParticles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.col;
      ctx.globalAlpha = Math.min(1.0, p.life / p.maxLife);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.r * 1.5, p.r * 1.5);
      ctx.restore();
    });
  }

  // Impact sparks
  if (cine.impactSparks) {
    cine.impactSparks.forEach(s => {
      ctx.save();
      ctx.fillStyle = s.col;
      ctx.globalAlpha = Math.min(1.0, s.life / s.maxLife);
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.r, s.r);
      ctx.restore();
    });
  }

  // Dissolution embers
  if (cine.dissolveParticles) {
    cine.dissolveParticles.forEach(dp => {
      ctx.save();
      ctx.fillStyle = dp.col;
      ctx.globalAlpha = Math.min(1.0, dp.life / dp.maxLife);
      ctx.fillRect(Math.round(dp.x), Math.round(dp.y), dp.r, dp.r);
      ctx.restore();
    });
  }
}

// ─────────────────────────────────────────────────────────────
// EXACT APPROVED LORD ROWAN ENTITY (HERO & BETRAYAL STYLE LOCK)
// ─────────────────────────────────────────────────────────────
class RampageRowanEntity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.facing = 1;
    this.mode = 'bow'; // 'bow' or 'sword'
    this.pose = 'emerge'; // 'emerge', 'idle', 'bow_aim', 'bow_fire', 'sword_draw', 'block', 'counter', 'evade', 'spin_cleave', 'recovery', 'walk_palace', 'charge', 'freeze_strike', 'recoil_shock', 'stand_before_eye'
    this.walkCycle = 0;
    this.hitFlashTimer = 0;
    this.slashTrailAlpha = 0;
    this.curSwordAngle = 0;
    this.curBodyShiftX = 0;
    this.curBodyShiftY = 0;
    this.curBodyTilt = 0;
    this.curStance = 0;
  }

  update(dt, t) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    const cx = _activeRampageCinematic ? _activeRampageCinematic.roomCenterX : 24;
    const cy = _activeRampageCinematic ? _activeRampageCinematic.roomCenterY : 16;
    const px = _activeRampageCinematic ? _activeRampageCinematic.palaceCX : cx + 80;
    const py = _activeRampageCinematic ? _activeRampageCinematic.palaceCY : cy;

    // ─────────────────────────────────────────────────────────
    // SOLE AUTHORITATIVE POSITION & POSE TRACKING (ZERO JUMPS)
    // ─────────────────────────────────────────────────────────
    if (t < RAMPAGE_TIMELINE.ROWAN_RETURN) {
      // 0.00 – 4.50s: Step out of the dungeon portal onto stepped threshold
      const p = easeInOut(t / RAMPAGE_TIMELINE.ROWAN_RETURN);
      this.x = (cx - 6.5) + p * 3.0; // cx - 6.5 -> cx - 3.5
      this.y = cy;
      this.pose = 'emerge';
      this.mode = 'bow';
      this.facing = 1;
      this.walkCycle += dt * 3.5;
    } else if (t < RAMPAGE_TIMELINE.GUARDS_APPROACH) {
      // 4.50 – 11.00s: Stand firm surveying open road; King's recognition
      this.x = cx - 3.5;
      this.y = cy;
      this.pose = 'idle';
      this.mode = 'bow';
      this.facing = 1;
      this.walkCycle = 0;
    } else if (t < RAMPAGE_TIMELINE.BOW_AIM_1) {
      // 11.00 – 11.80s: Spot distant Scout 1, pivot & raise Bow
      this.x = cx - 3.5;
      this.y = cy;
      this.pose = 'bow_aim';
      this.mode = 'bow';
      this.facing = 1;
    } else if (t < RAMPAGE_TIMELINE.BOW_FIRE_1 + 0.40) {
      // 11.80 – 12.70s: Fire arrow 1 at Scout 1
      this.x = cx - 3.5;
      this.y = cy;
      this.pose = 'bow_fire';
      this.mode = 'bow';
      this.facing = 1;
    } else if (t < RAMPAGE_TIMELINE.BOW_AIM_2) {
      // 12.70 – 13.50s: Pivot toward Scout 2 on flank, aim Bow
      this.x = cx - 3.5;
      this.y = cy;
      this.pose = 'bow_aim';
      this.mode = 'bow';
      this.facing = 1;
    } else if (t < RAMPAGE_TIMELINE.BOW_FIRE_2 + 0.40) {
      // 13.50 – 14.40s: Fire arrow 2 at Scout 2
      this.x = cx - 3.5;
      this.y = cy;
      this.pose = 'bow_fire';
      this.mode = 'bow';
      this.facing = 1;
    } else if (t < RAMPAGE_TIMELINE.SWORD_TRANSITION) {
      // 14.40 – 15.20s: Close-range vanguard reaches melee; smoothly stow Bow, draw Sword
      this.x = cx - 3.5;
      this.y = cy;
      this.pose = 'sword_draw';
      this.mode = 'sword';
      this.facing = 1;
    } else if (t < 16.00) {
      // 15.20 – 16.00s: Braced block as Vanguard charges in
      const p = easeInOut((t - 15.20) / 0.80);
      this.x = (cx - 3.5) + p * 0.7; // cx - 2.8
      this.y = cy;
      this.pose = 'block';
      this.mode = 'sword';
      this.facing = 1;
    } else if (t < 17.20) {
      // 16.00 – 17.20s: Counter-slash cutting across Vanguard's armor
      this.x = cx - 2.8;
      this.y = cy;
      this.pose = 'counter';
      this.mode = 'sword';
      this.slashTrailAlpha = 0.85;
      this.facing = 1;
    } else if (t < 18.20) {
      // 17.20 – 18.20s: Ducks beneath Spearman's high halberd thrust
      this.x = cx - 2.8;
      this.y = cy;
      this.pose = 'evade';
      this.mode = 'sword';
      this.facing = 1;
    } else if (t < 19.50) {
      // 18.20 – 19.50s: Devastating spin-cleave downing Vanguard!
      const p = easeInOut((t - 18.20) / 1.30);
      this.x = (cx - 2.8) + p * 0.6; // cx - 2.2
      this.y = cy;
      this.pose = 'spin_cleave';
      this.mode = 'sword';
      this.slashTrailAlpha = 1.0;
      this.facing = 1;
    } else if (t < 20.60) {
      // 19.50 – 20.60s: Parries Spearman's blade
      this.x = cx - 2.2;
      this.y = cy;
      this.pose = 'block';
      this.mode = 'sword';
      this.facing = 1;
    } else if (t < 22.00) {
      // 20.60 – 22.00s: Sharp counter-strike downing Spearman
      this.x = cx - 2.2;
      this.y = cy;
      this.pose = 'counter';
      this.mode = 'sword';
      this.slashTrailAlpha = 0.85;
      this.facing = 1;
    } else if (t < 24.20) {
      // 22.00 – 24.20s: Climax duel with Citadel Captain: 360 whirlwind cleave!
      const p = easeInOut((t - 22.00) / 2.20);
      this.x = (cx - 2.2) + p * 0.6; // cx - 1.6
      this.y = cy;
      this.pose = 'spin_cleave';
      this.mode = 'sword';
      this.slashTrailAlpha = 1.0;
      this.facing = 1;
    } else if (t < RAMPAGE_TIMELINE.COMBAT_AFTERMATH) {
      // 24.20 – 26.50s: Victorious recovery stance; lowering blade; deep breath
      this.x = cx - 1.6;
      this.y = cy;
      this.pose = 'recovery';
      this.mode = 'sword';
      this.facing = 1;
    } else if (t < RAMPAGE_TIMELINE.ROWAN_WALKS_AWAY) {
      // 26.50 – 28.50s: Rowan turns and walks east along road toward capital
      const p = easeInOut((t - 26.50) / 2.00);
      this.x = (cx - 1.6) + p * 2.8; // cx - 1.6 -> cx + 1.2
      this.y = cy;
      this.pose = 'emerge';
      this.mode = 'sword';
      this.facing = 1;
      this.walkCycle += dt * 3.5;
    } else if (t < RAMPAGE_TIMELINE.PALACE_REVEAL) {
      // 28.50 – 33.00s: Fading to black; Rowan arrives at palace entrance
      this.x = px - 6.5;
      this.y = py;
      this.pose = 'walk_palace';
      this.mode = 'sword';
      this.facing = 1;
      this.walkCycle += dt * 3.2;
    } else if (t < RAMPAGE_TIMELINE.CONFRONTATION_WALK) {
      // 33.00 – 35.00s: Rowan walks down palace red carpet toward the dais
      const p = easeInOut((t - 33.00) / 2.00);
      this.x = (px - 6.5) + p * 5.0; // px - 6.5 -> px - 1.5
      this.y = py;
      this.pose = 'walk_palace';
      this.mode = 'sword';
      this.facing = 1;
      this.walkCycle += dt * 3.2;
    } else if (t < RAMPAGE_TIMELINE.ROWAN_CHARGE) {
      // 35.00 – 44.50s: Rowan stands firm before the royal dais, facing King
      this.x = px - 1.5;
      this.y = py;
      this.pose = 'idle';
      this.mode = 'sword';
      this.facing = 1;
      this.walkCycle = 0;
    } else if (t < RAMPAGE_TIMELINE.ROWAN_CHARGE + 1.70) {
      // 44.50 – 46.20s: Rowan charges up dais stairs with blade raised high!
      const p = easeInOut((t - RAMPAGE_TIMELINE.ROWAN_CHARGE) / 1.70);
      this.x = (px - 1.5) + p * 3.5; // charges to px + 2.0 (right in front of throne at px + 3.8)
      this.y = py;
      this.pose = 'charge';
      this.mode = 'sword';
      this.facing = 1;
      this.walkCycle += dt * 7.5;
    } else if (t < RAMPAGE_TIMELINE.KING_DISSOLVE) {
      // 46.20 – 47.50s: Rowan brings sword down Poised to strike!
      this.x = px + 2.0;
      this.y = py;
      this.pose = 'freeze_strike';
      this.mode = 'sword';
      this.facing = 1;
    } else if (t < RAMPAGE_TIMELINE.EMPTY_THRONE_HOLD) {
      // 47.50 – 48.50s: King dissolves! Rowan cleaves empty air, recoils back in shock
      const p = easeInOut((t - 47.50) / 1.00);
      this.x = (px + 2.0) - p * 0.4; // steps back to px + 1.6
      this.y = py;
      this.pose = 'recoil_shock';
      this.mode = 'sword';
      this.facing = 1;
    } else {
      // 48.50s – 74.00s: Stays grounded at px + 1.6 before empty throne & Absolute Eye!
      // (ZERO TELEPORTATION across memory flash, transformation & eye sequence!)
      this.x = px + 1.6;
      this.y = py;
      this.pose = 'stand_before_eye';
      this.mode = 'sword';
      this.facing = 1;
      this.walkCycle = 0;
    }

    // Smoothly blend animation angles and physical shifts
    let targetAngle = 0;
    let targetShiftX = 0;
    let targetShiftY = 0;
    let targetTilt = 0;
    let targetStance = 0;

    if (this.pose === 'bow_aim') {
      targetAngle = -0.15;
      targetShiftX = -this.facing * 1.5;
      targetShiftY = 0.5;
      targetTilt = -this.facing * 0.04;
      targetStance = 0.8;
    } else if (this.pose === 'bow_fire') {
      targetAngle = 0.10;
      targetShiftX = this.facing * 2.0;
      targetShiftY = 0.3;
      targetTilt = this.facing * 0.05;
      targetStance = 1.0;
    } else if (this.pose === 'block') {
      targetAngle = -0.85;
      targetShiftX = -this.facing * 1.2;
      targetShiftY = 1.0;
      targetTilt = -this.facing * 0.05;
      targetStance = 1.0;
    } else if (this.pose === 'counter') {
      targetAngle = 0.30;
      targetShiftX = this.facing * 1.8;
      targetShiftY = 0.4;
      targetTilt = this.facing * 0.08;
      targetStance = 1.0;
    } else if (this.pose === 'evade') {
      targetAngle = -0.40;
      targetShiftX = -this.facing * 2.0;
      targetShiftY = 1.4;
      targetTilt = -this.facing * 0.08;
      targetStance = 1.0;
    } else if (this.pose === 'spin_cleave') {
      targetAngle = Math.PI * 1.2;
      targetShiftX = this.facing * 1.5;
      targetShiftY = 0.5;
      targetTilt = this.facing * 0.06;
      targetStance = 1.0;
    } else if (this.pose === 'recovery') {
      targetAngle = 0.65;
      targetShiftX = 0;
      targetShiftY = 0.4;
      targetStance = 0.6;
    } else if (this.pose === 'charge') {
      targetAngle = -0.75;
      targetShiftX = this.facing * 1.5;
      targetShiftY = -1.0;
      targetTilt = this.facing * 0.10;
      targetStance = 0.8;
    } else if (this.pose === 'freeze_strike') {
      targetAngle = 0.35; // Follow-through downward strike
      targetShiftX = this.facing * 2.2;
      targetShiftY = 1.2;
      targetTilt = this.facing * 0.14;
      targetStance = 1.0;
    } else if (this.pose === 'recoil_shock') {
      targetAngle = 0.45;
      targetShiftX = -this.facing * 1.0;
      targetShiftY = 0.2;
      targetTilt = -this.facing * 0.04;
      targetStance = 0.6;
    } else if (this.pose === 'stand_before_eye') {
      targetAngle = 0.60;
      targetShiftX = 0;
      targetShiftY = 0;
      targetTilt = 0;
      targetStance = 0.4;
    }

    const blendRate = Math.min(1.0, dt * 14.0);
    this.curSwordAngle += (targetAngle - this.curSwordAngle) * blendRate;
    this.curBodyShiftX += (targetShiftX - this.curBodyShiftX) * blendRate;
    this.curBodyShiftY += (targetShiftY - this.curBodyShiftY) * blendRate;
    this.curBodyTilt += (targetTilt - this.curBodyTilt) * blendRate;
    this.curStance += (targetStance - this.curStance) * blendRate;
    this.slashTrailAlpha = Math.max(0, this.slashTrailAlpha - dt * 3.5);
  }

  draw(ctx, t) {
    const px = this.x * T + this.curBodyShiftX;
    const py = this.y * T + this.curBodyShiftY;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.curBodyTilt);

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 11, 10 + this.curStance * 3, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const facing = this.facing;
    const breath = (this.pose === 'recovery') ? Math.sin(t * 5.0) * 1.5 : Math.sin(t * 2.2) * 1.0;
    const capeBlow = Math.sin(t * 3.5) * 2.5;
    const legSwing = (this.pose === 'emerge' || this.pose === 'walk_palace' || this.pose === 'charge')
      ? Math.sin(this.walkCycle) * 3.2
      : 0;

    // 1. Lord Rowan Crimson Cape (Exact Hero & Betrayal Style Lock)
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-facing * 6, -9);
    ctx.lineTo(-facing * 14, 5 + capeBlow);
    ctx.lineTo(-facing * 9, 14);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // 2. Steel Sabatons & Greaves
    ctx.fillStyle = '#1e293b';
    const leftFootX = -5 - legSwing * (1.0 - this.curStance) - this.curStance * 1.0;
    const rightFootX = 1.5 + legSwing * (1.0 - this.curStance) + this.curStance * 0.8;
    const footW = 3.5 + this.curStance * 0.5;
    const footH = 7.0 - this.curStance * 0.5;
    ctx.fillRect(leftFootX, 5 + this.curStance * 0.5, footW, footH);
    ctx.fillRect(rightFootX, 5 + this.curStance * 0.5, footW, footH);

    // 3. Lord Rowan Plate Armor (Charcoal steel with gilded trims)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-7, -9 + breath * 0.3, 14, 14);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-6, -8 + breath * 0.3, 12, 6);

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 3);
    ctx.stroke();

    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-5, -2, 10, 2);

    // 4. Pauldrons
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-10, -9 + breath * 0.3, 3.5, 6);
    ctx.fillRect(6.5, -9 + breath * 0.3, 3.5, 6);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-10, -4, 3.5, 1.5);
    ctx.fillRect(6.5, -4, 3.5, 1.5);

    // 5. Great Helmet & Glowing Azure Visor
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -15, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillRect(-5, -18, 10, 5);

    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 6;
    ctx.fillRect(facing === 1 ? 0 : -4.5, -15, 5, 2.0);
    ctx.restore();

    // 6. WEAPON PRESENTATION (Exact in-game Bow or Sword)
    if (this.mode === 'bow') {
      ctx.save();
      ctx.translate(facing * 4, -4);
      ctx.rotate(this.curSwordAngle);

      // In-game Arcane curved bow stave (matching CharacterRenderer.js)
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(6, 0, 8, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      // Gold tips
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(4, -8, 2.5, 2);
      ctx.fillRect(4, 6, 2.5, 2);

      // Steel bowstring
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(3, -7);
      if (this.pose === 'bow_aim') {
        ctx.lineTo(-4, 0); // drawn string
      } else {
        ctx.lineTo(3, 0);
      }
      ctx.lineTo(3, 7);
      ctx.stroke();

      // Nocked arrow when aiming
      if (this.pose === 'bow_aim') {
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.moveTo(12, -2);
        ctx.lineTo(16, 0);
        ctx.lineTo(12, 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    } else {
      // SWORD MODE
      if (Math.abs(this.curSwordAngle) > 0.05 || this.curStance > 0.2 || this.pose === 'charge' || this.pose === 'freeze_strike' || this.pose === 'stand_before_eye') {
        // Dynamic combat blade smoothly oriented by curSwordAngle (Exact Betrayal blade)
        ctx.save();
        ctx.translate(facing * 3, -6);
        ctx.rotate(this.curSwordAngle);

        // Hilt & crossguard
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-1.5, -3, 5, 2.5);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-1, -6, 2, 4);

        // Steel blade with bright edge highlight
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-1, 0, 2.5, 18);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 1, 18);

        // Parry sparks if blocking
        if (this.pose === 'block') {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(2, 6, 3, 3);
          ctx.fillRect(4, 9, 2.5, 2.5);
          ctx.fillRect(6, 4, 2, 2);
        }
        ctx.restore();

        // Sweeping slash trail arc
        if (this.slashTrailAlpha > 0.05) {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 255, 255, ${this.slashTrailAlpha * 0.65})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(facing * 11, -9, 16, -0.6, 0.6);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        // Sheathed / lowered at side (Exact Hero & Betrayal resting pose)
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-facing * 7, -5, 2.5, 16);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-facing * 8, -8, 4.5, 3);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-facing * 9, -5, 6.5, 1.5);
      }
    }

    // Hit flash reaction on impact
    if (this.hitFlashTimer > 0) {
      ctx.save();
      ctx.fillStyle = (Math.sin(this.hitFlashTimer * 45) > 0) ? 'rgba(255, 255, 255, 0.45)' : 'rgba(220, 38, 38, 0.40)';
      ctx.fillRect(-8, -16, 16, 24);
      ctx.restore();
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// EXACT APPROVED ROYAL GUARD COMBATANT (BETRAYAL STYLE LOCK)
// ─────────────────────────────────────────────────────────────
class RampageGuardEntity {
  constructor(cfg) {
    this.id = cfg.id;
    this.role = cfg.role || 'swordsman'; // 'scout_1', 'scout_2', 'vanguard', 'spearman', 'captain'
    this.x = cfg.x;
    this.y = cfg.y;
    this.startX = cfg.x;
    this.startY = cfg.y;
    this.targetX = cfg.targetX || cfg.x;
    this.targetY = cfg.targetY || cfg.y;
    this.facing = cfg.facing !== undefined ? cfg.facing : -1;
    this.state = 'idle'; // 'approaching', 'charging', 'striking', 'blocked', 'recoil', 'collapsed', 'dissolving'
    this.walkCycle = 0;
    this.hitFlashTimer = 0;
    this.dissolveProg = 0;
    this._dissolved = false;
    this.breathOffset = (cfg.x * 1.5 + cfg.y * 2.0);
  }

  update(dt, t) {
    this._dissolved = false;
    this.dissolveProg = 0;
    if (this.hitFlashTimer > 0) this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    if (this.role === 'scout_1') {
      // Advance from northeast path
      if (t < 12.30) {
        this.state = 'approaching';
        const p = easeInOut(clamp((t - 7.50) / 4.80, 0, 1));
        this.x = this.startX + (this.targetX - this.startX) * p;
        this.y = this.startY + (this.targetY - this.startY) * p;
        this.walkCycle += dt * 4.5;
      } else if (t < 13.00) {
        this.state = 'collapsed';
      } else if (t < 14.50) {
        this.state = 'dissolving';
        this.dissolveProg = Math.min(1.0, (t - 13.00) / 1.50);
      } else {
        this._dissolved = true;
      }
    } else if (this.role === 'scout_2') {
      // Advance along southeast flank
      if (t < 14.00) {
        this.state = 'approaching';
        const p = easeInOut(clamp((t - 8.00) / 6.00, 0, 1));
        this.x = this.startX + (this.targetX - this.startX) * p;
        this.y = this.startY + (this.targetY - this.startY) * p;
        this.walkCycle += dt * 4.2;
      } else if (t < 14.70) {
        this.state = 'collapsed';
      } else if (t < 16.20) {
        this.state = 'dissolving';
        this.dissolveProg = Math.min(1.0, (t - 14.70) / 1.50);
      } else {
        this._dissolved = true;
      }
    } else if (this.role === 'vanguard') {
      // Vanguard swordsman closing into melee
      if (t < 15.20) {
        this.state = 'charging';
        const p = easeInOut(clamp((t - 10.00) / 5.20, 0, 1));
        this.x = this.startX + (this.targetX - this.startX) * p;
        this.y = this.startY + (this.targetY - this.startY) * p;
        this.walkCycle += dt * 6.5;
      } else if (t < 15.80) {
        this.state = 'striking';
        this.x = this.targetX;
      } else if (t < 16.40) {
        this.state = 'blocked';
        const rp = (t - 15.80) / 0.60;
        this.x = this.targetX + rp * 0.8;
      } else if (t < 18.20) {
        this.state = 'charging'; // recovers, charges back in
        const cp = (t - 16.40) / 1.80;
        this.x = (this.targetX + 0.8) - cp * 0.8;
        this.walkCycle += dt * 5.0;
      } else if (t < 19.00) {
        this.state = 'recoil'; // struck by Rowan's spin-cleave
        const sp = (t - 18.20) / 0.80;
        this.x = this.targetX + sp * 1.5;
      } else if (t < 19.80) {
        this.state = 'collapsed';
        this.x = this.targetX + 1.5;
      } else if (t < 21.60) {
        this.state = 'dissolving';
        this.x = this.targetX + 1.5;
        this.dissolveProg = Math.min(1.0, (t - 19.80) / 1.80);
      } else {
        this._dissolved = true;
      }
    } else if (this.role === 'spearman') {
      // Flanking Spearman
      if (t < 17.20) {
        this.state = 'approaching';
        const p = easeInOut(clamp((t - 11.00) / 6.20, 0, 1));
        this.x = this.startX + (this.targetX - this.startX) * p;
        this.y = this.startY + (this.targetY - this.startY) * p;
        this.walkCycle += dt * 4.8;
      } else if (t < 18.00) {
        this.state = 'striking'; // thrusts halberd forward
        this.x = this.targetX;
      } else if (t < 19.50) {
        this.state = 'approaching'; // circles back
        const cp = (t - 18.00) / 1.50;
        this.x = this.targetX + cp * 0.5;
      } else if (t < 20.40) {
        this.state = 'blocked'; // parried by Rowan
        this.x = this.targetX + 0.5;
      } else if (t < 21.20) {
        this.state = 'recoil'; // counter struck
        const rp = (t - 20.40) / 0.80;
        this.x = (this.targetX + 0.5) + rp * 1.3;
      } else if (t < 21.80) {
        this.state = 'collapsed';
        this.x = this.targetX + 1.8;
      } else if (t < 23.60) {
        this.state = 'dissolving';
        this.x = this.targetX + 1.8;
        this.dissolveProg = Math.min(1.0, (t - 21.80) / 1.80);
      } else {
        this._dissolved = true;
      }
    } else if (this.role === 'captain') {
      // Citadel Captain charging for climax duel
      if (t < 21.50) {
        this.state = 'approaching';
        const p = easeInOut(clamp((t - 13.00) / 8.50, 0, 1));
        this.x = this.startX + (this.targetX - this.startX) * p;
        this.y = this.startY + (this.targetY - this.startY) * p;
        this.walkCycle += dt * 4.0;
      } else if (t < 22.80) {
        this.state = 'charging';
        const cp = (t - 21.50) / 1.30;
        this.x = this.startX + (this.targetX - this.startX) * (0.8 + cp * 0.2);
        this.walkCycle += dt * 7.0;
      } else if (t < 23.40) {
        this.state = 'striking';
        this.x = this.targetX;
      } else if (t < 24.20) {
        this.state = 'recoil'; // caught in Rowan's 360 cleave
        const rp = (t - 23.40) / 0.80;
        this.x = this.targetX + rp * 1.8;
      } else if (t < 25.00) {
        this.state = 'collapsed';
        this.x = this.targetX + 1.8;
      } else if (t < 26.50) {
        this.state = 'dissolving';
        this.x = this.targetX + 1.8;
        this.dissolveProg = Math.min(1.0, (t - 25.00) / 1.50);
      } else {
        this._dissolved = true;
      }
    }
  }

  draw(ctx, t) {
    if (this._dissolved) return;

    let px = this.x * T;
    let py = this.y * T;

    if (this.state === 'approaching') {
      px += Math.sin(t * 3.8 + this.breathOffset) * 1.5;
    }

    ctx.save();
    ctx.translate(px, py);

    // Dissolution alpha & embers (Betrayal Style Lock)
    if (this.state === 'dissolving') {
      ctx.globalAlpha = Math.max(0, 1.0 - this.dissolveProg);
      const numEmbers = 7;
      for (let i = 0; i < numEmbers; i++) {
        const ex = Math.sin(t * 8 + i * 2) * 12;
        const ey = -this.dissolveProg * 24 - (i * 5);
        ctx.fillStyle = (i % 2 === 0) ? '#94a3b8' : '#334155';
        ctx.fillRect(ex, ey, 2.5, 2.5);
      }
    }

    // Ground contact shadow
    const shadowAlpha = (this.state === 'collapsed') ? 0.25 : 0.44;
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 11, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const facing = this.facing;
    const isMoving = (this.state === 'approaching' || this.state === 'charging');
    const legSwing = isMoving ? Math.sin(this.walkCycle) * 3.2 : 0;
    const breath = Math.sin(t * 2.2 + this.breathOffset) * 0.8;

    if (this.state === 'recoil' || this.state === 'blocked') {
      ctx.translate(-facing * 2.0, 0);
    } else if (this.state === 'collapsed') {
      ctx.translate(0, 5);
    }

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = (Math.sin(this.hitFlashTimer * 45) > 0) ? '#ffffff' : '#dc2626';
      ctx.fillRect(-7, -15, 14, 25);
      ctx.restore();
      return;
    }

    // 1. Cloak (Royal Guard Velvet Cloak - Exact Betrayal Style Lock)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(-facing * 5, -8 + breath * 0.3);
    ctx.lineTo(-facing * 12, 6);
    ctx.lineTo(-facing * 7, 13);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();

    // 2. Greaves & Sabatons
    ctx.fillStyle = '#0f172a';
    if (this.state === 'collapsed') {
      ctx.fillRect(-6, 6, 6, 3);
      ctx.fillRect(1, 6, 6, 3);
    } else {
      ctx.fillRect(-5 - legSwing, 6, 3.5, 7);
      ctx.fillRect(1.5 + legSwing, 6, 3.5, 7);
    }

    // 3. Gothic Cuirass
    ctx.fillStyle = '#334155';
    ctx.fillRect(-7, -9 + breath * 0.3, 14, 15);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-6, -2 + breath * 0.3, 12, 1.5);

    // 4. Helmet & Red Plume
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -15 + breath * 0.3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(-facing * 2, -22 + breath * 0.3, 5, 2.5, facing * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 5. Weapons based on role
    if (this.role === 'spearman') {
      // HALBERD / SPEAR
      if (this.state === 'striking') {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(facing * 2, -8, 28, 2.5);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(facing * 30, -7);
        ctx.lineTo(facing * 24, -12);
        ctx.lineTo(facing * 24, -2);
        ctx.closePath();
        ctx.fill();
      } else if (this.state === 'recoil' || this.state === 'blocked') {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(facing * 2, -32, 2.5, 42);
        ctx.fillStyle = '#cbd5e1';
      } else if (this.state === 'collapsed') {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(facing * 2, 8, 30, 2);
      } else {
        ctx.save();
        ctx.translate(facing * 4, -10);
        ctx.rotate(-facing * 0.45);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-1.25, -24, 2.5, 38);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(5, -24);
        ctx.lineTo(-5, -24);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    } else {
      // SWORDSMAN
      if (this.state === 'striking') {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 4, -8, 16, 3);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 2, -10, 2.5, 7);
      } else if (this.state === 'recoil' || this.state === 'blocked') {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 3, -20, 2.5, 18);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 1.5, -8, 5.5, 2.5);
      } else if (this.state === 'collapsed') {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 5, 9, 16, 2.5);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 5, -12, 14, 2.5);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 3, -13, 2.5, 5);
      }
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// EXACT APPROVED KING ACTOR (BETRAYAL STYLE LOCK)
// ─────────────────────────────────────────────────────────────
class RampageKingEntity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.facing = -1;
    this.dissolved = false;
    this.dissolveProg = 0;
  }

  update(dt, t) {
    if (t < 46.20) {
      this.dissolved = false;
      this.dissolveProg = 0;
    } else if (t < RAMPAGE_TIMELINE.KING_DISSOLVE) {
      this.dissolved = false;
      const p = clamp((t - 46.20) / (RAMPAGE_TIMELINE.KING_DISSOLVE - 46.20), 0, 1);
      this.dissolveProg = p;
    } else {
      this.dissolved = true;
      this.dissolveProg = 1.0;
    }
  }

  draw(ctx, t) {
    if (this.dissolved) return;

    const px = this.x * T;
    const py = this.y * T;

    ctx.save();
    ctx.translate(px, py);

    // Supernatural void dissolution glitch & void motes
    if (this.dissolveProg > 0) {
      ctx.globalAlpha = Math.max(0, 1.0 - this.dissolveProg * 0.95);
      const glitchX = (Math.random() - 0.5) * this.dissolveProg * 6;
      const glitchY = (Math.random() - 0.5) * this.dissolveProg * 6;
      ctx.translate(glitchX, glitchY);
    }

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const facing = this.facing;
    const cloakBreeze = Math.sin(t * 3.0) * 2.0;

    // 1. Royal Velvet Cloak (Exact Betrayal Style Lock)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(-facing * 6, -11);
    ctx.lineTo(-facing * 15, 6 + cloakBreeze);
    ctx.lineTo(-facing * 10, 15);
    ctx.lineTo(0, 11);
    ctx.closePath();
    ctx.fill();

    // Ermine trim
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-facing * 12, 13, 8, 2.5);

    // 2. Regal Boots
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-5, 6, 3.5, 8);
    ctx.fillRect(1.5, 6, 3.5, 8);

    // 3. Royal Robes & Tunic
    ctx.fillStyle = '#312e81';
    ctx.fillRect(-8, -11, 16, 17);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-1.5, -11, 3, 17);
    ctx.fillRect(-7, 1, 14, 2.5);

    // 4. Fur Collar
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, -9, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Head, Beard & Crown
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-4.5, -20, 9, 9);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-5.5, -20, 2, 7);
    ctx.fillRect(3.5, -20, 2, 7);
    ctx.fillRect(-4.5, -14, 9, 6);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(facing === 1 ? 1.5 : -3.5, -17, 2, 1.5);

    // Golden 5-point crown with ruby gem
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-5.5, -23, 11, 4);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(-5.5, -23);
    ctx.lineTo(-4, -28);
    ctx.lineTo(-2, -23);
    ctx.lineTo(0, -29.5);
    ctx.lineTo(2, -23);
    ctx.lineTo(4, -28);
    ctx.lineTo(5.5, -23);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-1, -26, 2, 2.5);

    // 6. Sinister composed arms clasped regally on throne armrests
    ctx.fillStyle = '#312e81';
    ctx.fillRect(-facing * 4, -8, 5, 8);

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// ENVIRONMENT GENERATION: OUTSIDE WORLD (HERO CINEMATIC STYLE LOCK)
// ─────────────────────────────────────────────────────────────
function _buildRampageOutsideWorld(cx, cy) {
  const tiles = [];
  const roadTiles = [];
  const trees = [];
  const clouds = [];
  const birds = [];
  const lanterns = [];

  const spanR = 10;
  const spanC = 28;

  const archway = {
    c: Math.round(cx) - 8.2,
    r: Math.round(cy)
  };

  // Grid setup matching approved Hero Cinematic:
  // cy is the stone avenue row.
  // Rows cy-1, cy, cy+1 form the stone road.
  // Left cliff bluff (dc <= -6): mountain rockface enclosing dungeon portal with zero gaps.
  // Open horizon & meadow (dc > -6): ground extends from dr = -2 down to dr = +7.
  for (let dr = -spanR; dr <= spanR; dr++) {
    for (let dc = -spanC; dc <= spanC; dc++) {
      const tr = Math.round(cy) + dr;
      const tc = Math.round(cx) + dc;
      const seed = Math.abs(tr * 17 + tc * 31) % 43;

      const isRoad = (dr >= -1 && dr <= 1) && (dc >= -8 && dc <= 28);
      const isArchCliff = (dc <= -6 && dr <= 7 && dr >= -7);
      const isMeadowGround = (dc > -6 && dc <= 28 && dr >= -2 && dr <= 7);

      if (isRoad) {
        let roadType = 'royal_avenue';
        if (dc < -2) roadType = 'ancient_path';
        else if (dc <= 0) roadType = 'transition_path';
        roadTiles.push({ c: tc, r: tr, type: roadType, seed });
      } else if (isArchCliff) {
        tiles.push({ c: tc, r: tr, type: 'bluff', seed });
      } else if (isMeadowGround) {
        let groundType = 'grass';
        if (dc <= -3) groundType = 'dungeon_scree';
        else if (dc <= 0) groundType = 'transition_ground';
        tiles.push({ c: tc, r: tr, type: groundType, seed });
      }

      // Trees: in foreground meadow and high atop cliff ridge
      if (isMeadowGround && dc >= 1 && dr >= 5 && dr <= 7 && dc <= 24) {
        if (seed % 4 === 0) {
          trees.push({
            r: tr,
            c: tc,
            w: 26 + (seed % 2) * 4,
            h: 38 + (seed % 3) * 6
          });
        }
      } else if (isArchCliff && dr <= -4 && dc <= -8) {
        if (seed % 3 === 0) {
          trees.push({
            r: tr,
            c: tc,
            w: 22 + (seed % 2) * 4,
            h: 32 + (seed % 3) * 4
          });
        }
      }
    }
  }

  // Lantern posts along the stone road (matching Hero)
  lanterns.push({ c: Math.round(cx) - 6.5, r: Math.round(cy) - 1.8 });
  lanterns.push({ c: Math.round(cx) - 6.5, r: Math.round(cy) + 1.8 });
  lanterns.push({ c: Math.round(cx) + 0.5, r: Math.round(cy) - 1.8 });
  lanterns.push({ c: Math.round(cx) + 0.5, r: Math.round(cy) + 1.8 });
  lanterns.push({ c: Math.round(cx) + 8.5, r: Math.round(cy) - 1.8 });
  lanterns.push({ c: Math.round(cx) + 8.5, r: Math.round(cy) + 1.8 });

  // Clouds
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: -600 + i * 320,
      y: -220 + (i % 3) * 45,
      w: 120 + (i % 2) * 40,
      h: 46 + (i % 3) * 12,
      speed: 12 + (i % 3) * 4
    });
  }

  // Birds
  for (let i = 0; i < 3; i++) {
    birds.push({
      x: -300 + i * 280,
      y: -180 + (i % 2) * 40,
      speed: 28 + i * 8,
      flapPhase: i * 2.1
    });
  }

  trees.sort((a, b) => a.r - b.r);

  return { cx, cy, archway, tiles, roadTiles, trees, clouds, birds, lanterns };
}

function _renderRampageOutsideWorld(ctx, world, timer, cx, cy) {
  const { archway, tiles, roadTiles, trees, clouds, birds, lanterns } = world;
  const worldCX = cx * T;
  const worldCY = cy * T;

  // 1. SKY DOME: Overcast Slate to Cold Ominous Amber Horizon (Hero sky shader)
  const skyTop = worldCY - 440;
  const horizonY = worldCY - 80;
  const skyGrad = ctx.createLinearGradient(worldCX, skyTop, worldCX, horizonY);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(0.35, '#1e293b');
  skyGrad.addColorStop(0.70, '#334155');
  skyGrad.addColorStop(0.92, '#78350f');
  skyGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(worldCX - 1200, skyTop, 2400, horizonY - skyTop + 30);

  // 2. PARALLAX DISTANT ROLLING GREEN HILLS & MOUNTAIN RIDGES (Exact Hero Style)
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.moveTo(worldCX - 1200, horizonY - 40);
  for (let x = -1200; x <= 1200; x += 60) {
    const hillY = horizonY - 45 + Math.sin(x * 0.005) * 28 + Math.cos(x * 0.009) * 16;
    ctx.lineTo(worldCX + x, hillY);
  }
  ctx.lineTo(worldCX + 1200, horizonY + 20);
  ctx.lineTo(worldCX - 1200, horizonY + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(worldCX - 1200, horizonY - 15);
  for (let x = -1200; x <= 1200; x += 40) {
    const ridgeY = horizonY - 20 + Math.sin(x * 0.007 + 1.2) * 18;
    ctx.lineTo(worldCX + x, ridgeY);
  }
  ctx.lineTo(worldCX + 1200, horizonY + 30);
  ctx.lineTo(worldCX - 1200, horizonY + 30);
  ctx.closePath();
  ctx.fill();

  // 3. DRIFTING CUMULUS CLOUDS
  clouds.forEach(c => {
    const clx = worldCX + ((c.x + timer * c.speed) % 1600 - 800);
    const cly = worldCY + c.y;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.beginPath();
    ctx.ellipse(clx, cly, c.w * 0.5, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(clx - c.w * 0.22, cly + 4, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.ellipse(clx + c.w * 0.22, cly + 2, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. SOARING BIRDS
  birds.forEach(b => {
    const bx = worldCX + ((b.x + timer * b.speed) % 1400 - 700);
    const by = worldCY + b.y;
    const flap = Math.sin(timer * 8 + b.flapPhase) * 3;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + flap);
    ctx.quadraticCurveTo(bx - 2, by - 3, bx, by);
    ctx.quadraticCurveTo(bx + 2, by - 3, bx + 6, by + flap);
    ctx.stroke();
  });

  // 5. MEADOW GRASS, CLIFF & DUNGEON THRESHOLD SCREE TILES (Exact Hero Style)
  tiles.forEach(tile => {
    const px = tile.c * T;
    const py = tile.r * T;

    if (tile.type === 'bluff') {
      const rocks = ['#0f172a', '#1e293b', '#090d16', '#18181b'];
      ctx.fillStyle = rocks[tile.seed % rocks.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
      if (tile.seed % 3 === 0) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 5);
        ctx.lineTo(px + 15, py + 18);
        ctx.lineTo(px + 22, py + 26);
        ctx.stroke();
      }
      if (tile.seed % 4 === 1) {
        ctx.fillStyle = '#14532d';
        ctx.fillRect(px + 4, py + 4, 7, 3);
      }
    } else if (tile.type === 'dungeon_scree') {
      const screeEarth = ['#111827', '#18181b', '#0f172a', '#1c1917'];
      ctx.fillStyle = screeEarth[tile.seed % screeEarth.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 6, py + 8, 4, 3);
      ctx.fillRect(px + 18, py + 20, 5, 3);
    } else if (tile.type === 'transition_ground') {
      ctx.fillStyle = (tile.seed % 2 === 0) ? '#14532d' : '#1b3a1e';
      ctx.fillRect(px, py, T, T);
    } else {
      const greens = ['#15803d', '#16a34a', '#14532d', '#22c55e', '#166534'];
      ctx.fillStyle = greens[tile.seed % greens.length];
      ctx.fillRect(px, py, T, T);
    }
  });

  // 6. STONE ROAD TILES (Exact Hero Style)
  roadTiles.forEach(tile => {
    const px = tile.c * T;
    const py = tile.r * T;
    if (tile.type === 'ancient_path') {
      const basaltColors = ['#0a0f1d', '#0f172a', '#111827', '#090d16'];
      ctx.fillStyle = basaltColors[tile.seed % basaltColors.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
    } else if (tile.type === 'transition_path') {
      const transPavers = ['#1e293b', '#334155', '#162032', '#2d3748'];
      ctx.fillStyle = transPavers[tile.seed % transPavers.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
    } else {
      const pavers = ['#475569', '#334155', '#64748b', '#3b4252'];
      ctx.fillStyle = pavers[tile.seed % pavers.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
    }
  });

  // 7. DUNGEON CLIFF PORTAL & STEPPED THRESHOLD (Exact Hero Archway)
  const apx = archway.c * T;
  const apy = archway.r * T;

  ctx.save();
  // Buttresses
  ctx.fillStyle = '#090d16';
  ctx.fillRect(apx - 44, apy - 74, 40, 94);
  ctx.fillRect(apx + 28, apy - 74, 40, 94);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(apx - 38, apy - 70, 32, 86);
  ctx.fillRect(apx + 32, apy - 70, 32, 86);
  ctx.strokeStyle = '#05070e';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(apx - 44, apy - 74, 40, 94);
  ctx.strokeRect(apx + 28, apy - 74, 40, 94);

  // Lintel beam
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(apx - 48, apy - 92, 120, 22);
  ctx.strokeStyle = '#070a12';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(apx - 48, apy - 92, 120, 22);

  // Keystone seal
  ctx.fillStyle = '#92400e';
  ctx.fillRect(apx - 8, apy - 90, 16, 18);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(apx - 2, apy - 83, 4, 4);

  // Iron sconces with blue embers
  ctx.fillStyle = '#090d16';
  ctx.fillRect(apx - 24, apy - 32, 5, 14);
  ctx.fillRect(apx + 43, apy - 32, 5, 14);
  const blueFlicker = Math.sin(timer * 8.0) * 1.5;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(apx - 22, apy - 35, 2.5, 3.5 + blueFlicker, 0, 0, Math.PI * 2);
  ctx.ellipse(apx + 45, apy - 35, 2.5, 3.5 + blueFlicker, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cavern void interior
  ctx.fillStyle = '#020104';
  ctx.fillRect(apx - 6, apy - 70, 36, 86);

  // Stepped threshold
  ctx.fillStyle = '#0b111e';
  ctx.fillRect(apx - 10, apy + 8, 44, 4);
  ctx.fillStyle = '#111827';
  ctx.fillRect(apx - 8, apy + 12, 40, 4);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(apx - 6, apy + 16, 36, 4);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(apx - 10, apy + 8, 44, 12);
  ctx.restore();

  // 8. PINE TREES (Multi-tiered shading)
  trees.forEach(tr => {
    const tx = tr.c * T;
    const ty = tr.r * T;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(tx + T / 2 + 6, ty + T, tr.w * 0.45, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.fillRect(tx + T / 2 - 2.5, ty + T - 14, 5, 14);

    const tiers = [
      { yOff: 0, w: tr.w, h: 14, col: '#14532d' },
      { yOff: -10, w: tr.w * 0.8, h: 12, col: '#166534' },
      { yOff: -20, w: tr.w * 0.55, h: 10, col: '#15803d' }
    ];
    tiers.forEach(t => {
      ctx.fillStyle = t.col;
      ctx.beginPath();
      ctx.moveTo(tx + T / 2, ty + t.yOff - t.h);
      ctx.lineTo(tx + T / 2 + t.w / 2, ty + t.yOff);
      ctx.lineTo(tx + T / 2 - t.w / 2, ty + t.yOff);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  });

  // 9. LANTERNS ALONG ROAD
  lanterns.forEach(lt => {
    const lx = lt.c * T;
    const ly = lt.r * T;
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(lx + 6, ly - 18, 3, 24);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx + 2, ly - 26, 11, 10);
    const flick = Math.sin(timer * 7 + lt.c * 3) * 1.5;
    const lGrad = ctx.createRadialGradient(lx + 7, ly - 21, 2, lx + 7, ly - 21, 18);
    lGrad.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
    lGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
    lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.arc(lx + 7, ly - 21, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(lx + 7, ly - 21, 2.5 + flick * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ─────────────────────────────────────────────────────────────
// PIXEL-ART TILE & ARCHITECTURE DRAWING HELPERS (SHATTERED MIND SPEC)
// ─────────────────────────────────────────────────────────────
function _drawDungeonFloorTile(ctx, px, py, seed, palette) {
  const fc = palette || ['#0c1526', '#0d1628', '#0b1422', '#0e1830'];
  const colIdx = seed % fc.length;
  ctx.fillStyle = fc[colIdx];
  ctx.fillRect(px, py, T, T);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 1, py + T - 2);
  ctx.lineTo(px + 1, py + 1);
  ctx.lineTo(px + T - 2, py + 1);
  ctx.stroke();

  const detailSeed = seed % 19;
  if (detailSeed === 0) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 6);
    ctx.lineTo(px + 14, py + 16);
    ctx.lineTo(px + 24, py + 13);
    ctx.stroke();
  }
}

function _drawDungeonWallTile(ctx, px, py, row, hasSouth, palette) {
  const wc = palette || ['#1e293b', '#334155'];
  if (!hasSouth) {
    ctx.fillStyle = wc[1];
    ctx.fillRect(px, py, T, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(px, py, T, 1.5);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(px + 15, py, 1.2, 10);
    ctx.fillRect(px, py + 9, T, 1.2);

    const frontGrad = ctx.createLinearGradient(px, py + 10, px, py + T);
    frontGrad.addColorStop(0, wc[0]);
    frontGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = frontGrad;
    ctx.fillRect(px, py + 10, T, T - 10);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 21);
    ctx.lineTo(px + T, py + 21);
    const stagger = (row % 2 === 0) ? 16 : 8;
    ctx.moveTo(px + stagger, py + 10);
    ctx.lineTo(px + stagger, py + 21);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(px, py + T - 3, T, 3);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = wc[1];
    ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
  }
}

// ─────────────────────────────────────────────────────────────
// ENVIRONMENT GENERATION: STANDALONE ROYAL PALACE & TRANSFORMATION
// ─────────────────────────────────────────────────────────────
function _buildPalaceThroneRoom(px, py) {
  const tiles = [];
  const spanR = 7;
  const spanC = 12;

  for (let dr = -spanR; dr <= spanR; dr++) {
    for (let dc = -spanC; dc <= spanC; dc++) {
      const tr = Math.round(py) + dr;
      const tc = Math.round(px) + dc;
      const isWall = (dr === -spanR || dr === spanR || dc === -spanC || dc === spanC);
      const isCarpet = (dr >= -1 && dr <= 1) && (dc <= 3);
      const isDais = (dc >= 2 && dc <= 5) && (dr >= -2 && dr <= 2);

      tiles.push({
        r: tr,
        c: tc,
        dr, dc,
        isWall,
        hasSouth: dr > -spanR && dr < spanR,
        isCarpet,
        isDais,
        seed: Math.abs(tr * 13 + tc * 29) % 23
      });
    }
  }

  // 6 Grand Stone Columns flanking central aisle
  const pillars = [
    { c: Math.round(px) - 5, r: Math.round(py) - 3 },
    { c: Math.round(px) - 1, r: Math.round(py) - 3 },
    { c: Math.round(px) + 3, r: Math.round(py) - 3 },
    { c: Math.round(px) - 5, r: Math.round(py) + 3 },
    { c: Math.round(px) - 1, r: Math.round(py) + 3 },
    { c: Math.round(px) + 3, r: Math.round(py) + 3 }
  ];

  return { px, py, tiles, pillars };
}

function _renderTransformedPalace(ctx, palace, t, transformProg) {
  const px = palace.px;
  const py = palace.py;

  // Background Ambient Space
  ctx.save();
  const bgGrad = ctx.createRadialGradient(px * T, py * T, 40, px * T, py * T, 680);
  if (transformProg < 0.5) {
    bgGrad.addColorStop(0, '#1e1b4b');
    bgGrad.addColorStop(0.6, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
  } else {
    bgGrad.addColorStop(0, '#150824');
    bgGrad.addColorStop(0.6, '#080511');
    bgGrad.addColorStop(1, '#000000');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect((px - 36) * T, (py - 25) * T, 72 * T, 50 * T);

  // Palettes for transformation
  const palaceFC = ['#1e1b4b', '#1e293b', '#0f172a', '#312e81'];
  const dungeonFC = ['#0c1526', '#0d1628', '#0b1422', '#0e1830'];
  const curFC = (transformProg < 0.5) ? palaceFC : dungeonFC;

  const palaceWC = ['#334155', '#475569'];
  const dungeonWC = ['#0f172a', '#1e293b'];

  // Multi-stage continuous transformation progressions (Section 38 & 39)
  // 1. Torches: 55.00 – 57.50s
  const torchProg = clamp((t - RAMPAGE_TIMELINE.TRANSFORM_START) / (RAMPAGE_TIMELINE.TRANSFORM_TORCHES - RAMPAGE_TIMELINE.TRANSFORM_START), 0, 1);
  // 2. Carpet decay: 56.50 – 60.00s
  const carpetFade = clamp((t - 56.50) / (RAMPAGE_TIMELINE.TRANSFORM_CARPET - 56.50), 0, 1);
  // 3. Stone floor & walls weathering: 58.00 – 62.00s
  const stoneProg = clamp((t - 58.00) / (RAMPAGE_TIMELINE.TRANSFORM_STONE - 58.00), 0, 1);
  // 4. Throne morphing to Altar: 59.50 – 63.50s
  const altarProg = clamp((t - 59.50) / (RAMPAGE_TIMELINE.TRANSFORM_SETTLED - 59.50), 0, 1);

  // 1. Floor & Wall Tiles
  palace.tiles.forEach(tile => {
    const tx = tile.c * T;
    const ty = tile.r * T;

    if (tile.isWall) {
      _drawDungeonWallTile(ctx, tx, ty, tile.r, tile.hasSouth, palaceWC);
      if (stoneProg > 0) {
        ctx.save();
        ctx.globalAlpha = stoneProg;
        _drawDungeonWallTile(ctx, tx, ty, tile.r, tile.hasSouth, dungeonWC);
        ctx.restore();
      }
    } else {
      _drawDungeonFloorTile(ctx, tx, ty, tile.seed, palaceFC);
      if (stoneProg > 0) {
        ctx.save();
        ctx.globalAlpha = stoneProg;
        _drawDungeonFloorTile(ctx, tx, ty, tile.seed, dungeonFC);
        ctx.restore();
      }

      // Central Royal Red Carpet (Fades smoothly as palace transforms)
      if (tile.isCarpet && carpetFade < 1.0) {
        ctx.save();
        ctx.globalAlpha = 1.0 - carpetFade;
        ctx.fillStyle = (tile.r === Math.round(py)) ? '#991b1b' : '#7f1d1d';
        ctx.fillRect(tx, ty, T, T);

        // Gilded carpet border
        ctx.fillStyle = '#ca8a04';
        if (tile.r === Math.round(py) - 1) ctx.fillRect(tx, ty, T, 2.5);
        if (tile.r === Math.round(py) + 1) ctx.fillRect(tx, ty + T - 2.5, T, 2.5);
        ctx.restore();
      }

      // Dais Stone Steps
      if (tile.isDais) {
        const stepProg = clamp(stoneProg, 0, 1);
        ctx.fillStyle = (stepProg < 0.5) ? '#312e81' : '#1e1b4b';
        ctx.fillRect(tx + 2, ty + 2, T - 4, T - 4);
      }
    }
  });

  // 2. Pillars & Torches
  palace.pillars.forEach(pil => {
    const plx = pil.c * T;
    const ply = pil.r * T;
    ctx.save();

    // Pillar Shaft: Smooth transition from royal masonry to ancient monolith
    ctx.fillStyle = '#475569';
    ctx.fillRect(plx - 4, ply - 14, 20, 36);
    if (stoneProg > 0) {
      ctx.save();
      ctx.globalAlpha = stoneProg;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(plx - 4, ply - 14, 20, 36);
      ctx.strokeStyle = '#3b0764';
      ctx.strokeRect(plx - 4, ply - 14, 20, 36);
      ctx.restore();
    }

    // Capital
    if (stoneProg < 1.0) {
      ctx.save();
      ctx.globalAlpha = 1.0 - stoneProg;
      ctx.fillStyle = '#ca8a04'; // Golden capital
      ctx.fillRect(plx - 6, ply - 16, 24, 4);
      ctx.restore();
    }

    // Torch flame color smoothly shifts from royal amber (#f59e0b) to abyssal violet (#a855f7)
    const trR = Math.round(245 + (168 - 245) * torchProg);
    const trG = Math.round(158 + (85 - 158) * torchProg);
    const trB = Math.round(11 + (247 - 11) * torchProg);
    const torchCol = `rgb(${trR}, ${trG}, ${trB})`;

    const glR = Math.round(251 + (168 - 251) * torchProg);
    const glG = Math.round(191 + (85 - 191) * torchProg);
    const glB = Math.round(36 + (247 - 36) * torchProg);
    const torchGlow = `rgba(${glR}, ${glG}, ${glB}, 0.45)`;

    const tFlick = Math.sin(t * 8.0 + pil.c) * 1.5;

    ctx.save();
    ctx.fillStyle = torchGlow;
    ctx.beginPath();
    ctx.arc(plx + 6, ply, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = torchCol;
    ctx.beginPath();
    ctx.ellipse(plx + 6, ply, 3.5, 5 + tFlick * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  });

  // 3. Royal Throne / Ancient Stone Altar (At px + 3.8, py)
  const throneX = (px + 3.8) * T;
  const throneY = py * T;
  ctx.save();
  ctx.translate(throneX, throneY);

  if (altarProg < 1.0) {
    ctx.save();
    ctx.globalAlpha = 1.0 - altarProg;
    // Grand Obsidian Royal Throne with gold trim & velvet cushion
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12, -26, 24, 30);
    ctx.fillStyle = '#ca8a04';
    ctx.strokeRect(-12, -26, 24, 30);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-9, -4, 18, 10);
    ctx.restore();
  }

  if (altarProg > 0) {
    ctx.save();
    ctx.globalAlpha = altarProg;
    // Ancient Void Stone Altar
    ctx.fillStyle = '#030712';
    ctx.fillRect(-16, -10, 32, 16);
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-16, -10, 32, 16);

    // Altar runic inscription
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(-8, -4, 16, 2);
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// DIALOGUE & SUBTITLES PROVIDER (CANON APPROVED SCREENPLAY)
// ─────────────────────────────────────────────────────────────
function _getRampageSubtitle(t) {
  // King distant voice at emergence
  if (t >= RAMPAGE_TIMELINE.ROWAN_RETURN && t < RAMPAGE_TIMELINE.KING_RECOGNITION) {
    const p = Math.min(1.0, (t - RAMPAGE_TIMELINE.ROWAN_RETURN) / 0.8);
    return { text: '“So... you returned.”', alpha: p };
  } else if (t >= RAMPAGE_TIMELINE.KING_RECOGNITION && t < RAMPAGE_TIMELINE.GUARDS_APPROACH) {
    const p = Math.max(0, 1.0 - (t - RAMPAGE_TIMELINE.KING_RECOGNITION) / 0.8);
    return { text: '“So... you returned.”', alpha: p };
  }
  // Palace confrontation dialogue
  else if (t >= RAMPAGE_TIMELINE.CONFRONTATION_1 && t < RAMPAGE_TIMELINE.CONFRONTATION_2) {
    return { text: '“You came all this way for me?”', alpha: 1.0 };
  } else if (t >= RAMPAGE_TIMELINE.CONFRONTATION_2 && t < RAMPAGE_TIMELINE.CONFRONTATION_3) {
    return { text: '“You sent them.”', alpha: 1.0 };
  } else if (t >= RAMPAGE_TIMELINE.CONFRONTATION_3 && t < RAMPAGE_TIMELINE.CONFRONTATION_PAUSE) {
    return { text: '“And you survived.”', alpha: 1.0 };
  } else if (t >= RAMPAGE_TIMELINE.CONFRONTATION_4 && t < RAMPAGE_TIMELINE.ROWAN_CHARGE) {
    return { text: '“This ends now.”', alpha: 1.0 };
  }
  return { text: '', alpha: 0 };
}

// ─────────────────────────────────────────────────────────────
// SMOOTH CONTINUOUS CAMERA INTERPOLATION (ZERO DISCONTINUITIES)
// ─────────────────────────────────────────────────────────────
function _getRampageCameraTarget(t, cx, cy, px, py) {
  // Phase 1: Rowan Emerge & Survey (0.00 – 11.00s)
  if (t < RAMPAGE_TIMELINE.GUARDS_APPROACH) {
    const p = smoothstep(t / 11.00);
    return {
      x: (cx - 4.5) + p * 1.5,  // cx - 4.5 -> cx - 3.0
      y: cy,
      z: 1.35 - p * 0.10        // 1.35 -> 1.25
    };
  }

  // Phase 2: Combat Sequence (11.00 – 26.50s)
  if (t < RAMPAGE_TIMELINE.COMBAT_AFTERMATH) {
    if (t < RAMPAGE_TIMELINE.SWORD_TRANSITION) {
      // Long-range bow combat
      const p = smoothstep((t - 11.00) / 4.20);
      return {
        x: (cx - 3.0) + p * 0.5,
        y: cy - p * 0.1,
        z: 1.38
      };
    } else if (t < RAMPAGE_TIMELINE.CAPTAIN_CLIMAX) {
      // Melee sword duels
      const p = smoothstep((t - 15.20) / 9.00);
      return {
        x: (cx - 2.5) + p * 0.6,
        y: cy,
        z: 1.42
      };
    } else {
      // Climax cleave & recovery
      const p = smoothstep((t - 24.20) / 2.30);
      return {
        x: (cx - 1.9) + p * 0.3,
        y: cy,
        z: 1.40 - p * 0.10
      };
    }
  }

  // Rowan walks away along road (26.50 – 28.50s)
  if (t < RAMPAGE_TIMELINE.ROWAN_WALKS_AWAY) {
    const p = smoothstep((t - 26.50) / 2.00);
    return {
      x: (cx - 1.6) + p * 1.5,
      y: cy,
      z: 1.30
    };
  }

  // Phase 3: Transition to Standalone Palace (28.50 – 33.00s)
  // (Under pure black at 30.80 – 31.40s, camera smoothly set to Palace without whip)
  if (t < RAMPAGE_TIMELINE.SOLID_BLACK_HOLD) {
    return {
      x: cx - 0.1,
      y: cy,
      z: 1.28
    };
  }

  // Phase 4: Palace Entrance & Confrontation (31.40 – 44.50s)
  if (t < RAMPAGE_TIMELINE.ROWAN_CHARGE) {
    if (t < RAMPAGE_TIMELINE.CONFRONTATION_WALK) {
      const p = smoothstep((t - 31.40) / 3.60);
      return {
        x: (px - 4.5) + p * 3.5,  // px - 4.5 -> px - 1.0
        y: py - 0.1,
        z: 1.25 + p * 0.08
      };
    } else {
      const p = smoothstep((t - 35.00) / 9.50);
      return {
        x: (px - 1.0) + p * 1.5,  // px - 1.0 -> px + 0.5
        y: py - 0.1,
        z: 1.33
      };
    }
  }

  // Phase 5: Rowan Charge & King Dissolution (44.50 – 48.50s)
  if (t < RAMPAGE_TIMELINE.EMPTY_THRONE_HOLD) {
    const p = smoothstep((t - 44.50) / 4.00);
    return {
      x: (px + 0.5) + p * 2.2,  // Smooth push toward dais & throne
      y: py,
      z: 1.33 + p * 0.18
    };
  }

  // Phase 6: Pitch Black Word Flash (48.50 – 55.00s)
  if (t < RAMPAGE_TIMELINE.TRANSFORM_START) {
    return {
      x: px + 2.5,
      y: py - 0.1,
      z: 1.32
    };
  }

  // Phase 7: Palace Transformation (55.00 – 63.50s)
  if (t < RAMPAGE_TIMELINE.EYE_AWAKEN) {
    const p = smoothstep((t - 55.00) / 8.50);
    return {
      x: (px + 2.5) + p * 0.3,
      y: (py - 0.1) - p * 0.8,
      z: 1.32 - p * 0.04
    };
  }

  // Phase 8: The Absolute Reveal & Slow Controlled Push to Eye (63.50 – 74.00s)
  if (t < RAMPAGE_TIMELINE.BLACK_SNAP) {
    const p = smoothstep(clamp((t - 63.50) / 7.00, 0, 1));
    return {
      x: (px + 2.8) + p * 0.8,  // Slow deliberate push toward the eye
      y: (py - 0.9) - p * 1.4,
      z: 1.28 + p * 0.38
    };
  }

  // Pure black hold
  return {
    x: px + 3.6,
    y: py - 2.3,
    z: 1.66
  };
}

// ─────────────────────────────────────────────────────────────
// RAMPAGE CINEMATIC CONTROLLER OBJECT
// ─────────────────────────────────────────────────────────────
export const RampageCinematic = {
  active: false,
  finished: false,
  timer: 0,
  shotIndex: 1,
  paused: false,

  suppressRealWorld() {
    return this.active;
  },

  isActive() {
    return this.active && !_rampageFinished && !!_activeRampageCinematic;
  },

  isFinished() {
    return this.finished || _rampageFinished;
  },

  getActiveCinematic() {
    return _activeRampageCinematic;
  },

  canSkip() {
    return this.active && !this.finished;
  },

  skip() {
    if (!this.active || this.finished) return;
    this.seek(RAMPAGE_TIMELINE.BLACK_HOLD - 0.2);
  },

  seek(targetTime, andPause = false) {
    if (!this.active || !_activeRampageCinematic) {
      this.start();
    }
    if (!_activeRampageCinematic) return;

    _rampageFastForwarding = true;
    _activeRampageCinematic.timer = targetTime;
    this.timer = targetTime;
    this.paused = andPause;
    _activeRampageCinematic.hitStopTimer = 0;

    const dt = 0.01;
    _activeRampageCinematic.rowan.update(dt, targetTime);
    _activeRampageCinematic.king.update(dt, targetTime);
    _activeRampageCinematic.guards.forEach(g => g.update(dt, targetTime));

    const targetCam = _getRampageCameraTarget(
      targetTime,
      _activeRampageCinematic.roomCenterX,
      _activeRampageCinematic.roomCenterY,
      _activeRampageCinematic.palaceCX,
      _activeRampageCinematic.palaceCY
    );
    GameState.CAM.x = targetCam.x;
    GameState.CAM.y = targetCam.y;
    GameState.CAM.z = targetCam.z;
    GameState.CAM.tx = targetCam.x;
    GameState.CAM.ty = targetCam.y;
    GameState.CAM.tz = targetCam.z;

    _activeRampageCinematic.subtitles = _getRampageSubtitle(targetTime);

    _rampageFastForwarding = false;
  },

  start(opts = {}) {
    if (this.active) return;
    this.active = true;
    this.finished = false;
    _rampageFinished = false;
    this.timer = 0;
    this.shotIndex = 1;
    this.paused = false;

    // Freeze player input & make invulnerable
    if (GameState.P) {
      GameState.P.vx = 0;
      GameState.P.vy = 0;
      GameState.P.attacking = false;
      GameState.P.dashing = false;
      GameState.P.invulnerable = true;
      GameState.P.cinematicPose = 'hidden';
      GameState.P.weaponLowered = true;
    }

    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    GameState.ACTIVE_CINEMATIC_TYPE = 'rampage';

    // Hide dev triggers and touch overlay during cinematic
    const devBar = document.getElementById('rampage-cutscene-trigger-bar');
    if (devBar) devBar.style.display = 'none';
    const touchOv = document.getElementById('touch-overlay');
    if (touchOv) touchOv.style.display = 'none';

    // Grid centers
    const isFromTitle = !GameState.P || GameState.STATE === GameStates.TITLE || GameState.P.x < 10;
    const roomCenterX = isFromTitle ? 24 : GameState.P.x;
    const roomCenterY = isFromTitle ? 16 : GameState.P.y;
    const palaceCX = roomCenterX + 80;
    const palaceCY = roomCenterY;

    // Characters
    const rowan = new RampageRowanEntity(roomCenterX - 6.5, roomCenterY);
    const king = new RampageKingEntity(palaceCX + 3.8, palaceCY);

    // Guard Squad (Grounded physical approach from real paths)
    const guards = [
      new RampageGuardEntity({
        id: 'scout_1',
        role: 'scout_1',
        x: roomCenterX + 8.5,
        y: roomCenterY - 2.2,
        targetX: roomCenterX + 3.2,
        targetY: roomCenterY - 1.5,
        facing: -1
      }),
      new RampageGuardEntity({
        id: 'scout_2',
        role: 'scout_2',
        x: roomCenterX + 9.5,
        y: roomCenterY + 2.6,
        targetX: roomCenterX + 3.6,
        targetY: roomCenterY + 1.8,
        facing: -1
      }),
      new RampageGuardEntity({
        id: 'vanguard',
        role: 'vanguard',
        x: roomCenterX + 7.5,
        y: roomCenterY,
        targetX: roomCenterX - 2.0,
        targetY: roomCenterY,
        facing: -1
      }),
      new RampageGuardEntity({
        id: 'spearman',
        role: 'spearman',
        x: roomCenterX + 8.2,
        y: roomCenterY - 1.0,
        targetX: roomCenterX - 1.4,
        targetY: roomCenterY - 0.8,
        facing: -1
      }),
      new RampageGuardEntity({
        id: 'captain',
        role: 'captain',
        x: roomCenterX + 9.0,
        y: roomCenterY + 0.6,
        targetX: roomCenterX - 1.0,
        targetY: roomCenterY + 0.4,
        facing: -1
      })
    ];

    _activeRampageCinematic = {
      timer: 0,
      roomCenterX,
      roomCenterY,
      palaceCX,
      palaceCY,
      rowan,
      king,
      guards,
      arrows: [],
      bloodParticles: [],
      bloodDecals: [],
      impactSparks: [],
      dissolveParticles: [],
      hitStopTimer: 0,
      outsideWorld: _buildRampageOutsideWorld(roomCenterX, roomCenterY),
      palace: _buildPalaceThroneRoom(palaceCX, palaceCY),
      subtitles: { text: '', alpha: 0 },
      soundCues: {},
      musicVol: 0.55,
      targetMusicVol: 0.55
    };

    // Camera initial position
    const initCam = _getRampageCameraTarget(0, roomCenterX, roomCenterY, palaceCX, palaceCY);
    GameState.CAM.tx = initCam.x; GameState.CAM.ty = initCam.y; GameState.CAM.tz = initCam.z;
    GameState.CAM.x = initCam.x; GameState.CAM.y = initCam.y; GameState.CAM.z = initCam.z;

    // Start background theme Last_Steps_on_Cold_Stone.mp3
    MusicManager.setMasterVolume(0.55);
    MusicManager.play('rampage', { loop: true, fade: 2.0, volume: 0.55 });
    playSnd('outside_breeze');

    EventBus.emit('cinematic:rampage_started');
  },

  tick(dt) {
    if (!this.active || !_activeRampageCinematic) return;
    const cine = _activeRampageCinematic;

    // Hit-stop pause
    if (cine.hitStopTimer > 0) {
      cine.hitStopTimer = Math.max(0, cine.hitStopTimer - dt);
      return;
    }

    if (!this.paused) {
      cine.timer += dt;
      this.timer = cine.timer;
    }

    const t = cine.timer;
    const cx = cine.roomCenterX;
    const cy = cine.roomCenterY;
    const px = cine.palaceCX;
    const py = cine.palaceCY;

    // Update characters
    cine.rowan.update(dt, t);
    cine.king.update(dt, t);
    cine.guards.forEach(g => g.update(dt, t));
    cine.arrows.forEach(a => a.update(dt));

    // Update particles
    _updateRampageParticles(cine, dt);

    // Update Camera (Smooth unified interpolation)
    const camTgt = _getRampageCameraTarget(t, cx, cy, px, py);
    GameState.CAM.tx = camTgt.x;
    GameState.CAM.ty = camTgt.y;
    GameState.CAM.tz = camTgt.z;

    // Direct smooth lerp to eliminate rigid follower lag
    const camLerp = Math.min(1.0, dt * 8.0);
    GameState.CAM.x += (camTgt.x - GameState.CAM.x) * camLerp;
    GameState.CAM.y += (camTgt.y - GameState.CAM.y) * camLerp;
    GameState.CAM.z += (camTgt.z - GameState.CAM.z) * camLerp;

    // Solid black camera synchronization (Zero camera sweep across void)
    if (t >= RAMPAGE_TIMELINE.FADE_TO_BLACK && t < RAMPAGE_TIMELINE.SOLID_BLACK_HOLD) {
      GameState.CAM.x = camTgt.x;
      GameState.CAM.y = camTgt.y;
      GameState.CAM.z = camTgt.z;
    }

    // Dynamic audio modulation across cinematic beats
    if (t < RAMPAGE_TIMELINE.GUARDS_APPROACH) {
      cine.targetMusicVol = 0.50;
    } else if (t < RAMPAGE_TIMELINE.SWORD_TRANSITION) {
      cine.targetMusicVol = 0.65;
    } else if (t < RAMPAGE_TIMELINE.COMBAT_AFTERMATH) {
      cine.targetMusicVol = 0.78;
    } else if (t < RAMPAGE_TIMELINE.PALACE_REVEAL) {
      cine.targetMusicVol = 0.35;
    } else if (t < RAMPAGE_TIMELINE.ROWAN_CHARGE) {
      cine.targetMusicVol = 0.52;
    } else if (t < RAMPAGE_TIMELINE.EMPTY_THRONE_HOLD) {
      cine.targetMusicVol = 0.85;
    } else if (t < RAMPAGE_TIMELINE.TRANSFORM_START) {
      cine.targetMusicVol = 0.00; // Complete silence at word revelation
    } else if (t < RAMPAGE_TIMELINE.EYE_AWAKEN) {
      cine.targetMusicVol = 0.35;
    } else if (t < RAMPAGE_TIMELINE.BLACK_SNAP) {
      cine.targetMusicVol = 0.45;
    } else {
      cine.targetMusicVol = 0.00;
    }

    if (cine.musicVol == null) cine.musicVol = 0.55;
    cine.musicVol += (cine.targetMusicVol - cine.musicVol) * Math.min(1.0, dt * 2.5);
    MusicManager.setMasterVolume(cine.musicVol);

    // ─────────────────────────────────────────────────────────
    // SCRIPTED COMBAT EVENTS & SOUND CUES
    // ─────────────────────────────────────────────────────────
    // Subtitles (Canon Approved Screenplay)
    cine.subtitles = _getRampageSubtitle(t);

    // 1. Bow Shot 1 (11.80s)
    if (t >= RAMPAGE_TIMELINE.BOW_AIM_1 && !cine.soundCues.bowShot1) {
      cine.soundCues.bowShot1 = true;
      playSnd('bow_shoot');
      cine.arrows.push(new RampageArrow(
        (cine.rowan.x + 0.4) * T,
        cine.rowan.y * T - 4,
        (cx + 3.2) * T,
        (cy - 1.5) * T,
        340
      ));
    }
    // Arrow 1 impact on Scout 1 (12.30s)
    if (t >= RAMPAGE_TIMELINE.BOW_FIRE_1 && !cine.soundCues.arrowHit1) {
      cine.soundCues.arrowHit1 = true;
      playSnd('melee_hit');
      const g1 = cine.guards.find(g => g.id === 'scout_1');
      if (g1) {
        g1.hitFlashTimer = 0.20;
        _spawnCombatBlood(cine, g1.x * T, g1.y * T, 0.2, 'medium');
        _spawnDissolutionParticles(cine, g1.x * T, g1.y * T, 14);
      }
      triggerHitStop(0.05);
    }

    // 2. Bow Shot 2 (13.50s)
    if (t >= RAMPAGE_TIMELINE.BOW_AIM_2 && !cine.soundCues.bowShot2) {
      cine.soundCues.bowShot2 = true;
      playSnd('bow_shoot');
      cine.arrows.push(new RampageArrow(
        (cine.rowan.x + 0.4) * T,
        cine.rowan.y * T - 4,
        (cx + 3.6) * T,
        (cy + 1.8) * T,
        340
      ));
    }
    // Arrow 2 impact on Scout 2 (14.00s)
    if (t >= RAMPAGE_TIMELINE.BOW_FIRE_2 && !cine.soundCues.arrowHit2) {
      cine.soundCues.arrowHit2 = true;
      playSnd('melee_hit');
      const g2 = cine.guards.find(g => g.id === 'scout_2');
      if (g2) {
        g2.hitFlashTimer = 0.20;
        _spawnCombatBlood(cine, g2.x * T, g2.y * T, -0.2, 'medium');
        _spawnDissolutionParticles(cine, g2.x * T, g2.y * T, 14);
      }
      triggerHitStop(0.05);
    }

    // 3. Vanguard Clash (15.80s)
    if (t >= 15.80 && !cine.soundCues.vanguardClash) {
      cine.soundCues.vanguardClash = true;
      playSnd('weapon_clang');
      _spawnClashSparks(cine, (cine.rowan.x + 0.8) * T, (cine.rowan.y) * T - 4, 8);
      triggerHitStop(0.06);
    }
    // Rowan counter on Vanguard (16.40s)
    if (t >= RAMPAGE_TIMELINE.VANGUARD_CLASH && !cine.soundCues.vanguardCounter) {
      cine.soundCues.vanguardCounter = true;
      playSnd('melee_hit');
      const vg = cine.guards.find(g => g.id === 'vanguard');
      if (vg) {
        vg.hitFlashTimer = 0.22;
        _spawnCombatBlood(cine, vg.x * T, vg.y * T, 0.3, 'strong');
      }
      triggerHitStop(0.06);
    }

    // 4. Spearman thrust whiff (17.80s)
    if (t >= 17.80 && !cine.soundCues.spearWhiff) {
      cine.soundCues.spearWhiff = true;
      playSnd('outside_breeze');
    }
    // Spin-cleave downing Vanguard (18.60s)
    if (t >= RAMPAGE_TIMELINE.SPEAR_DODGE && !cine.soundCues.vanguardCleave) {
      cine.soundCues.vanguardCleave = true;
      playSnd('melee_hit');
      const vg = cine.guards.find(g => g.id === 'vanguard');
      if (vg) {
        vg.hitFlashTimer = 0.25;
        _spawnCombatBlood(cine, vg.x * T, vg.y * T, 0.45, 'heavy');
        _spawnDissolutionParticles(cine, vg.x * T, vg.y * T, 16);
      }
      triggerHitStop(0.07);
    }

    // 5. Parries Spearman (19.80s)
    if (t >= 19.80 && !cine.soundCues.spearParry) {
      cine.soundCues.spearParry = true;
      playSnd('weapon_clang');
      _spawnClashSparks(cine, (cine.rowan.x + 0.8) * T, (cine.rowan.y - 0.5) * T, 6);
    }
    // Counters Spearman (20.60s)
    if (t >= 20.60 && !cine.soundCues.spearCounter) {
      cine.soundCues.spearCounter = true;
      playSnd('melee_hit');
      const sp = cine.guards.find(g => g.id === 'spearman');
      if (sp) {
        sp.hitFlashTimer = 0.22;
        _spawnCombatBlood(cine, sp.x * T, sp.y * T, -0.35, 'strong');
        _spawnDissolutionParticles(cine, sp.x * T, sp.y * T, 16);
      }
      triggerHitStop(0.065);
    }

    // 6. Captain Charge & 360 Whirlwind Cleave (23.40s)
    if (t >= 23.40 && !cine.soundCues.climaxCleave) {
      cine.soundCues.climaxCleave = true;
      playSnd('melee_hit');
      const cap = cine.guards.find(g => g.id === 'captain');
      if (cap) {
        cap.hitFlashTimer = 0.26;
        _spawnCombatBlood(cine, cap.x * T, cap.y * T, 0.5, 'heavy');
        _spawnDissolutionParticles(cine, cap.x * T, cap.y * T, 20);
      }
      triggerHitStop(0.08);
    }



    // King supernatural dissolution (46.80s)
    if (t >= 46.80 && !cine.soundCues.kingDissolve) {
      cine.soundCues.kingDissolve = true;
      playSnd('reality_snap');
      _spawnDissolutionParticles(cine, (px + 3.8) * T, py * T - 8, 36, '#a855f7');
    }

    // Ominous drone before transformation & eye reveal
    if (t >= 55.50 && !cine.soundCues.droneAwaken) {
      cine.soundCues.droneAwaken = true;
      playSnd('eye_awaken');
    }

    // Final Eye Blink Sound (70.50s)
    if (t >= RAMPAGE_TIMELINE.EYE_BLINK_START && !cine.soundCues.eyeBlink) {
      cine.soundCues.eyeBlink = true;
      playSnd('portal_enter');
    }

    // Credits handoff at 74.00s
    if (t >= RAMPAGE_TIMELINE.BLACK_HOLD && !this.finished) {
      this.finished = true;
      this.proceedToCredits();
    }
  },

  proceedToCredits() {
    this.reset();
    SaveSystem.recordEnding('rampage');
    AchievementSystem.unlock('rampage');
    AchievementSystem.unlock('boss_slayer');
    if (typeof Credits !== 'undefined' && Credits.start) {
      Credits.start('rampage');
    }
  },

  // ─────────────────────────────────────────────────────────────
  // DRAW WORLD ENTITIES
  // ─────────────────────────────────────────────────────────────
  drawWorldEntities(ctx) {
    if (!this.active || !_activeRampageCinematic) return;
    const cine = _activeRampageCinematic;
    const t = cine.timer;
    const cx = cine.roomCenterX;
    const cy = cine.roomCenterY;
    const px = cine.palaceCX;
    const py = cine.palaceCY;

    // SCENE 1: OUTSIDE WORLD RETURN & COMBAT (t < 31.00s)
    if (t < RAMPAGE_TIMELINE.FADE_TO_BLACK) {
      _renderRampageOutsideWorld(ctx, cine.outsideWorld, t, cx, cy);

      // Floor blood decals
      if (cine.bloodDecals) {
        cine.bloodDecals.forEach(d => {
          ctx.save();
          ctx.fillStyle = d.col;
          ctx.globalAlpha = d.alpha;
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.r * 1.5, d.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // Flying arrows
      cine.arrows.forEach(a => a.draw(ctx));

      // Guards (Exact Citadel guards from Betrayal)
      cine.guards.forEach(g => g.draw(ctx, t));

      // Lord Rowan
      cine.rowan.draw(ctx, t);

      // Blood particles & impact sparks
      _drawRampageParticles(ctx, cine);

      return;
    }

    // SCENE 2: STANDALONE PALACE & TRANSFORMATION (t >= 31.00s)
    let transformProg = 0.0;
    if (t >= RAMPAGE_TIMELINE.TRANSFORM_START && t < RAMPAGE_TIMELINE.TRANSFORM_SETTLED) {
      transformProg = smoothstep((t - RAMPAGE_TIMELINE.TRANSFORM_START) / (RAMPAGE_TIMELINE.TRANSFORM_SETTLED - RAMPAGE_TIMELINE.TRANSFORM_START));
    } else if (t >= RAMPAGE_TIMELINE.TRANSFORM_SETTLED) {
      transformProg = 1.0;
    }

    // Render Palace / Transformed Chamber
    _renderTransformedPalace(ctx, cine.palace, t, transformProg);

    // The King on Throne
    cine.king.draw(ctx, t);

    // Lord Rowan
    cine.rowan.draw(ctx, t);

    // Dissolution particles in world
    _drawRampageParticles(ctx, cine);

    // THE ABSOLUTE PIXEL-ART EYE (Appears above altar at t >= 63.50s)
    if (t >= RAMPAGE_TIMELINE.TRANSFORM_SETTLED && t < RAMPAGE_TIMELINE.BLACK_SNAP) {
      const eyeWorldX = (px + 3.8) * T;
      const eyeWorldY = (py - 2.8) * T;

      let blinkProg = 0;
      if (t >= RAMPAGE_TIMELINE.EYE_BLINK_START) {
        blinkProg = Math.min(1.0, (t - RAMPAGE_TIMELINE.EYE_BLINK_START) / 0.45);
      }

      const pulse = 1.0 + Math.sin(t * 3.5) * 0.05;
      const eyeScale = (t >= RAMPAGE_TIMELINE.EYE_PUSH)
        ? Math.min(3.4, 2.0 + (t - RAMPAGE_TIMELINE.EYE_PUSH) * 0.42)
        : 2.0;

      _drawPixelEye(ctx, eyeWorldX, eyeWorldY, eyeScale * pulse, blinkProg, t);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // DRAW SCREEN-SPACE OVERLAYS (Black Transitions & Word Flashes)
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!this.active || !_activeRampageCinematic) return;
    const cine = _activeRampageCinematic;
    const t = cine.timer;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 1. Outside to Palace Smooth Fade Transition (28.50s – 33.00s)
    if (t >= RAMPAGE_TIMELINE.DUSK_FADE_START && t < RAMPAGE_TIMELINE.PALACE_REVEAL) {
      let fadeAlpha = 0;
      if (t < RAMPAGE_TIMELINE.FADE_TO_BLACK) {
        // Smoothly fade to pure black
        fadeAlpha = clamp((t - RAMPAGE_TIMELINE.DUSK_FADE_START) / (RAMPAGE_TIMELINE.FADE_TO_BLACK - RAMPAGE_TIMELINE.DUSK_FADE_START), 0, 1);
      } else if (t < RAMPAGE_TIMELINE.SOLID_BLACK_HOLD) {
        // Solid black hold
        fadeAlpha = 1.0;
      } else {
        // Smoothly fade in to palace
        fadeAlpha = clamp(1.0 - (t - RAMPAGE_TIMELINE.SOLID_BLACK_HOLD) / (RAMPAGE_TIMELINE.PALACE_REVEAL - RAMPAGE_TIMELINE.SOLID_BLACK_HOLD), 0, 1);
      }
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, LW, LH);
    }

    // 2. Pitch Black Hold & Word-by-Word Revelation (48.50s – 55.00s)
    if (t >= RAMPAGE_TIMELINE.EMPTY_THRONE_HOLD && t < RAMPAGE_TIMELINE.TRANSFORM_START) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);

      let word = '';
      if (t >= 49.20 && t < RAMPAGE_TIMELINE.WORD_LOOKS) word = 'LOOKS';
      else if (t >= RAMPAGE_TIMELINE.GAP_1 && t < RAMPAGE_TIMELINE.WORD_CAN) word = 'CAN';
      else if (t >= RAMPAGE_TIMELINE.GAP_2 && t < RAMPAGE_TIMELINE.WORD_BE) word = 'BE';
      else if (t >= RAMPAGE_TIMELINE.GAP_3 && t < RAMPAGE_TIMELINE.WORD_DECEIVING) word = 'DECEIVING...';

      if (word) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 28px Cinzel, "Cinematic Serif", serif';
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 16;
        ctx.fillText(word, LW / 2, LH / 2);
        ctx.restore();
      }
      ctx.restore();
      return;
    }

    // 3. Post-Blink Pure Black Hold (71.00s – 74.00s)
    if (t >= RAMPAGE_TIMELINE.BLACK_SNAP) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);
      ctx.restore();
      return;
    }

    // 4. Letterbox Bars (2.35:1 cinematic scope)
    const barH = 44;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, LW, barH);
    ctx.fillRect(0, LH - barH, LW, barH);

    // Subtle dark-amber cinematic separator line
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH); ctx.lineTo(LW, barH);
    ctx.moveTo(0, LH - barH); ctx.lineTo(LW, LH - barH);
    ctx.stroke();

    // 5. Cinematic Subtitles
    if (cine.subtitles && cine.subtitles.alpha > 0.01 && cine.subtitles.text) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, Math.max(0, cine.subtitles.alpha));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'italic 16px "Crimson Text", Georgia, serif';
      const subY = LH - Math.round(barH * 0.5);

      const textW = ctx.measureText(cine.subtitles.text).width;
      const bgGrad = ctx.createRadialGradient(LW / 2, subY, 6, LW / 2, subY, textW / 2 + 24);
      bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(LW / 2 - textW / 2 - 24, subY - 14, textW + 48, 28);

      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 8;
      ctx.fillText(cine.subtitles.text, LW / 2, subY);
      ctx.restore();
    }

    // 6. Fast-Forward Indicator (Only in Debug)
    if (this.paused) {
      ctx.save();
      ctx.fillStyle = 'rgba(234, 179, 8, 0.85)';
      ctx.font = '600 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`[PAUSED ${t.toFixed(1)}s]`, LW - 16, barH + 20);
      ctx.restore();
    }

    ctx.restore();
  },

  reset() {
    this.active = false;
    this.finished = false;
    _rampageFinished = true;
    this.timer = 0;
    this.shotIndex = 1;
    this.paused = false;

    GameState.CINEMATIC_ACTIVE = false;
    GameState.ACTIVE_CINEMATIC_TYPE = null;

    if (GameState.P) {
      GameState.P.cinematicPose = null;
      GameState.P.invulnerable = false;
      GameState.P.weaponLowered = false;
    }

    // Stop music
    MusicManager.fadeOut(1.0);

    if (_activeRampageCinematic) {
      _activeRampageCinematic.bloodParticles = [];
      _activeRampageCinematic.bloodDecals = [];
      _activeRampageCinematic.impactSparks = [];
      _activeRampageCinematic.dissolveParticles = [];
    }
    _activeRampageCinematic = null;
  }
};

// Global debugging interface
if (typeof window !== 'undefined') {
  window.RampageCinematic = RampageCinematic;
  window.rampageSeek = (t, andPause = false) => RampageCinematic.seek(t, andPause);
  window.triggerRampageEnding = () => RampageCinematic.start();
  window.startRampageEnding = () => RampageCinematic.start();
}
