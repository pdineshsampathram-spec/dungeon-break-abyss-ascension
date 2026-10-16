// =====================================================================
//  DUNGEON BREAK — js/systems/AbyssDissolution.js
//  Abyss Dissolution Death Presentation System
//
//  Replaces corpse/blood-heavy death with a clean supernatural
//  disintegration effect. Enemies: hit → reaction → death → brief
//  hold → dissolve → particles → final spark → remove.
//
//  Integration points:
//    • EnemyManager.tick() — calls AbyssDissolution.tick()
//    • CharacterRenderer.drawEnemy() — delegates dead enemy rendering
//    • RampageCinematic guard.draw() — calls for cinematic guards
// =====================================================================

import { GameState } from '../core/GameState.js';
import { T } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';

// ─────────────────────────────────────────────────────────────
// ENEMY-SPECIFIC DISSOLUTION COLOR PALETTES
// ─────────────────────────────────────────────────────────────
const DISSOLUTION_COLORS = {
  skeleton: {
    fragments: ['#cbd5e1', '#94a3b8', '#e2e8f0'],
    dust:      ['#64748b', '#475569', '#9ca3af'],
    energy:    ['#f1f5f9', '#e2e8f0', '#cbd5e1'],
    core:      '#e2e8f0'
  },
  ghoul: {
    fragments: ['#4ade80', '#166534', '#334155'],
    dust:      ['#14532d', '#1e293b', '#374151'],
    energy:    ['#16a34a', '#064e3b', '#1e293b'],
    core:      '#4ade80'
  },
  demon: {
    fragments: ['#f97316', '#b91c1c', '#18181b'],
    dust:      ['#7c2d12', '#1c1917', '#292524'],
    energy:    ['#ea580c', '#dc2626', '#0c0a09'],
    core:      '#fb923c'
  },
  wraith: {
    fragments: ['#c084fc', '#6b21a8', '#1e293b'],
    dust:      ['#3b0764', '#1e1b4b', '#0f172a'],
    energy:    ['#a855f7', '#7c3aed', '#4c1d95'],
    core:      '#d8b4fe'
  },
  guard: {
    fragments: ['#94a3b8', '#64748b', '#475569'],
    dust:      ['#334155', '#1e293b', '#0f172a'],
    energy:    ['#cbd5e1', '#ef4444', '#94a3b8'],
    core:      '#e2e8f0'
  },
  elite: {
    fragments: ['#facc15', '#f59e0b', '#1e293b'],
    dust:      ['#92400e', '#0f172a', '#1c1917'],
    energy:    ['#fbbf24', '#d97706', '#451a03'],
    core:      '#fef08a'
  },
  // Fallback
  default: {
    fragments: ['#94a3b8', '#64748b', '#475569'],
    dust:      ['#334155', '#1e293b', '#0f172a'],
    energy:    ['#ef4444', '#dc2626', '#7f1d1d'],
    core:      '#fca5a5'
  }
};

// ─────────────────────────────────────────────────────────────
// TIMING CONSTANTS
// ─────────────────────────────────────────────────────────────
const NORMAL_HOLD_DURATION   = 0.36;   // Brief grounded hold after death motion (timing 0.00-0.40s)
const NORMAL_DISSOLVE_DURATION = 0.58; // Body breakup phase (0.40-0.98s)
const NORMAL_SPARK_DURATION  = 0.16;   // Final spark + fade (0.98-1.14s)
// Total normal: ~1.10s (fits 0.8-1.3s budget)

const CINEMATIC_HOLD_DURATION   = 0.25;
const CINEMATIC_DISSOLVE_DURATION = 0.70;
const CINEMATIC_SPARK_DURATION  = 0.20;
// Total cinematic: ~1.15s

const MINIBOSS_HOLD_DURATION   = 0.25;
const MINIBOSS_DISSOLVE_DURATION = 1.0;
const MINIBOSS_SPARK_DURATION  = 0.25;
// Total miniboss: ~1.5s

// Particle counts per layer
const NORMAL_FRAGMENTS = 8;
const NORMAL_DUST      = 6;
const NORMAL_ENERGY    = 4;

const CINEMATIC_FRAGMENTS = 14;
const CINEMATIC_DUST      = 10;
const CINEMATIC_ENERGY    = 6;

const MINIBOSS_FRAGMENTS = 22;
const MINIBOSS_DUST      = 16;
const MINIBOSS_ENERGY    = 10;

// ─────────────────────────────────────────────────────────────
// DISSOLUTION PARTICLE POOL
// ─────────────────────────────────────────────────────────────
const MAX_POOL_SIZE = 300;
const _particlePool = [];
const _activeParticles = [];

function _acquireParticle() {
  if (_particlePool.length > 0) return _particlePool.pop();
  return {};
}

function _releaseParticle(p) {
  if (_particlePool.length < MAX_POOL_SIZE) _particlePool.push(p);
}

// ─────────────────────────────────────────────────────────────
// ACTIVE DISSOLUTION EFFECTS
// ─────────────────────────────────────────────────────────────
const _activeEffects = [];

// ─────────────────────────────────────────────────────────────
// DISSOLUTION EFFECT FACTORY
// ─────────────────────────────────────────────────────────────
function _getColors(type, isElite) {
  if (isElite) return DISSOLUTION_COLORS.elite;
  return DISSOLUTION_COLORS[type] || DISSOLUTION_COLORS.default;
}

function _pickColor(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Start a dissolution effect for an enemy/guard actor.
 *
 * @param {object} actor - The enemy or cinematic guard
 * @param {object} opts  - { type, isElite, isCinematic, isMiniBoss, abyssX, abyssY }
 */
function startDissolution(actor, opts = {}) {
  // One-shot safety
  if (actor._dissolveStarted) return;
  actor._dissolveStarted = true;

  const type = opts.type || actor.type || 'default';
  const isElite = opts.isElite || actor.isElite;
  const isCinematic = !!opts.isCinematic;
  const isMiniBoss = !!opts.isMiniBoss || !!actor.isMiniBoss;

  const holdDur = isMiniBoss ? MINIBOSS_HOLD_DURATION :
                  isCinematic ? CINEMATIC_HOLD_DURATION :
                  NORMAL_HOLD_DURATION;
  const dissolveDur = isMiniBoss ? MINIBOSS_DISSOLVE_DURATION :
                      isCinematic ? CINEMATIC_DISSOLVE_DURATION :
                      NORMAL_DISSOLVE_DURATION;
  const sparkDur = isMiniBoss ? MINIBOSS_SPARK_DURATION :
                   isCinematic ? CINEMATIC_SPARK_DURATION :
                   NORMAL_SPARK_DURATION;

  const colors = _getColors(type, isElite);

  const effect = {
    actor,
    wx: actor.x,
    wy: actor.y,
    type,
    colors,
    isCinematic,
    isMiniBoss,

    // Phase timing
    holdDur,
    dissolveDur,
    sparkDur,
    totalDur: holdDur + dissolveDur + sparkDur,
    timer: 0,

    // State
    phase: 'hold', // 'hold' -> 'dissolve' -> 'spark' -> 'done'
    dissolveProgress: 0, // 0..1 upward breakup
    shadowAlpha: 1.0,
    bodyAlpha: 1.0,
    glowAlpha: 0,
    glowRadius: 0,
    sparkFired: false,
    soundPlayed: false,
    sparkSoundPlayed: false,
    particlesSpawned: false,
    removed: false,

    // Abyss drift target (particles drift toward this in abyss areas)
    abyssX: opts.abyssX !== undefined ? opts.abyssX : actor.x,
    abyssY: opts.abyssY !== undefined ? opts.abyssY : actor.y - 4,

    // Fragment count
    fragCount: isMiniBoss ? MINIBOSS_FRAGMENTS : isCinematic ? CINEMATIC_FRAGMENTS : NORMAL_FRAGMENTS,
    dustCount: isMiniBoss ? MINIBOSS_DUST : isCinematic ? CINEMATIC_DUST : NORMAL_DUST,
    energyCount: isMiniBoss ? MINIBOSS_ENERGY : isCinematic ? CINEMATIC_ENERGY : NORMAL_ENERGY
  };

  _activeEffects.push(effect);
  return effect;
}

// ─────────────────────────────────────────────────────────────
// PARTICLE SPAWN — Three Layers
// ─────────────────────────────────────────────────────────────
function _spawnDissolutionParticles(effect) {
  if (effect.particlesSpawned) return;
  effect.particlesSpawned = true;

  const { wx, wy, colors, fragCount, dustCount, energyCount, abyssX, abyssY, isMiniBoss } = effect;

  // Abyss drift direction
  const driftDx = abyssX - wx;
  const driftDy = abyssY - wy;
  const driftLen = Math.hypot(driftDx, driftDy) || 1;
  const driftNx = driftDx / driftLen;
  const driftNy = driftDy / driftLen;

  // LAYER 1: Body Fragments — peel from body, bottom-up
  for (let i = 0; i < fragCount; i++) {
    const p = _acquireParticle();
    const verticalOffset = (i / fragCount) * 0.6 - 0.1; // bottom-up distribution
    p.wx = wx + (Math.random() - 0.5) * 0.5;
    p.wy = wy + 0.3 - verticalOffset;
    p.vx = (Math.random() - 0.5) * 0.8 + driftNx * 0.3;
    p.vy = -0.6 - Math.random() * 0.8 + driftNy * 0.2;
    p.drag = 0.92 + Math.random() * 0.04;
    p.gravity = -0.15 - Math.random() * 0.1;
    p.turbulence = 0.3 + Math.random() * 0.2;
    p.angularDrift = (Math.random() - 0.5) * 2.0;
    p.rotation = Math.random() * 6.28;
    p.life = 0.6 + Math.random() * 0.4;
    p.maxLife = p.life;
    p.size = 2.5 + Math.random() * 2.5;
    p.col = _pickColor(colors.fragments);
    p.layer = 'fragment';
    p.delay = (i / fragCount) * 0.35; // stagger spawn bottom to top
    p.active = false;
    _activeParticles.push(p);
  }

  // LAYER 2: Abyss Dust — tiny rising motes around the body
  for (let i = 0; i < dustCount; i++) {
    const p = _acquireParticle();
    p.wx = wx + (Math.random() - 0.5) * 0.7;
    p.wy = wy + (Math.random() - 0.5) * 0.5;
    p.vx = (Math.random() - 0.5) * 0.4;
    p.vy = -0.3 - Math.random() * 0.5;
    p.drag = 0.95;
    p.gravity = -0.08 - Math.random() * 0.06;
    p.turbulence = 0.15 + Math.random() * 0.1;
    p.angularDrift = (Math.random() - 0.5) * 1.5;
    p.rotation = 0;
    p.life = 0.5 + Math.random() * 0.35;
    p.maxLife = p.life;
    p.size = 1.0 + Math.random() * 1.5;
    p.col = _pickColor(colors.dust);
    p.layer = 'dust';
    p.delay = Math.random() * 0.3;
    p.active = false;
    _activeParticles.push(p);
  }

  // LAYER 3: Energy Trail — fewer particles drifting toward abyssal source
  for (let i = 0; i < energyCount; i++) {
    const p = _acquireParticle();
    p.wx = wx + (Math.random() - 0.5) * 0.3;
    p.wy = wy + (Math.random() - 0.5) * 0.3;
    p.vx = driftNx * (0.8 + Math.random() * 0.6);
    p.vy = driftNy * (0.8 + Math.random() * 0.6) - 0.4;
    p.drag = 0.94;
    p.gravity = -0.05;
    p.turbulence = 0.08;
    p.angularDrift = (Math.random() - 0.5) * 0.8;
    p.rotation = 0;
    p.life = 0.7 + Math.random() * 0.4;
    p.maxLife = p.life;
    p.size = 1.5 + Math.random() * 1.0;
    p.col = _pickColor(colors.energy);
    p.layer = 'energy';
    p.delay = 0.1 + Math.random() * 0.2;
    p.active = false;
    p.glow = true;
    _activeParticles.push(p);
  }
}

// ─────────────────────────────────────────────────────────────
// TICK
// ─────────────────────────────────────────────────────────────
function tick(dt) {
  // Tick active effects
  for (let i = _activeEffects.length - 1; i >= 0; i--) {
    const fx = _activeEffects[i];
    fx.timer += dt;

    // Phase transitions
    if (fx.phase === 'hold' && fx.timer >= fx.holdDur) {
      fx.phase = 'dissolve';

      // Dissolution crackle sound — one shot
      if (!fx.soundPlayed) {
        fx.soundPlayed = true;
        // Soft magical disintegration: use a gentle descending tone
        SoundManager.playTone(320, 'sine', 0.35, 0.07, 120);
        setTimeout(() => SoundManager.playTone(180, 'triangle', 0.25, 0.04, 60), 80);
      }

      // Spawn dissolution particles
      _spawnDissolutionParticles(fx);
    }

    if (fx.phase === 'dissolve') {
      const dissolveT = (fx.timer - fx.holdDur) / fx.dissolveDur;
      fx.dissolveProgress = Math.min(1.0, dissolveT);
      fx.bodyAlpha = Math.max(0, 1.0 - dissolveT * 1.2);
      fx.shadowAlpha = Math.max(0, 1.0 - dissolveT);
      fx.glowAlpha = Math.sin(dissolveT * Math.PI) * 0.4;
      fx.glowRadius = dissolveT * 12;

      if (dissolveT >= 1.0) {
        fx.phase = 'spark';
      }
    }

    if (fx.phase === 'spark') {
      const sparkT = (fx.timer - fx.holdDur - fx.dissolveDur) / fx.sparkDur;

      if (!fx.sparkFired) {
        fx.sparkFired = true;
        // Final spark sound — tiny high-frequency shimmer
        if (!fx.sparkSoundPlayed) {
          fx.sparkSoundPlayed = true;
          SoundManager.playTone(1600, 'sine', 0.12, 0.05, 2400);
        }

        // Spawn final core particle
        const coreP = _acquireParticle();
        coreP.wx = fx.wx;
        coreP.wy = fx.wy - 0.15;
        coreP.vx = 0;
        coreP.vy = -0.6;
        coreP.drag = 0.96;
        coreP.gravity = -0.1;
        coreP.turbulence = 0;
        coreP.angularDrift = 0;
        coreP.rotation = 0;
        coreP.life = fx.sparkDur * 0.9;
        coreP.maxLife = coreP.life;
        coreP.size = fx.isMiniBoss ? 5 : 3.5;
        coreP.col = fx.colors.core;
        coreP.layer = 'core';
        coreP.delay = 0;
        coreP.active = true;
        coreP.glow = true;
        _activeParticles.push(coreP);
      }

      fx.glowAlpha = Math.max(0, (1.0 - sparkT) * 0.6);
      fx.glowRadius = 8 * (1.0 - sparkT);

      if (sparkT >= 1.0) {
        fx.phase = 'done';
      }
    }

    if (fx.phase === 'done' && !fx.removed) {
      fx.removed = true;
      _activeEffects.splice(i, 1);
    }
  }

  // Tick dissolution particles
  for (let i = _activeParticles.length - 1; i >= 0; i--) {
    const p = _activeParticles[i];

    // Delayed activation
    if (!p.active) {
      p.delay -= dt;
      if (p.delay <= 0) p.active = true;
      continue;
    }

    p.life -= dt;
    if (p.life <= 0) {
      _activeParticles.splice(i, 1);
      _releaseParticle(p);
      continue;
    }

    // Physics
    p.wx += p.vx * dt;
    p.wy += p.vy * dt;
    p.vx *= Math.pow(p.drag, dt * 60);
    p.vy *= Math.pow(p.drag, dt * 60);
    p.vy += p.gravity * dt;

    // Turbulence / spiral
    if (p.turbulence > 0) {
      const turbPhase = (1 - p.life / p.maxLife) * 8 + p.maxLife * 100;
      p.vx += Math.sin(turbPhase) * p.turbulence * dt;
      p.vy += Math.cos(turbPhase * 0.7) * p.turbulence * 0.5 * dt;
    }

    // Angular drift (spiral)
    if (p.angularDrift) {
      p.rotation += p.angularDrift * dt;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DRAW — Enemy Dissolving Body + Particles
// ─────────────────────────────────────────────────────────────

/**
 * Draw the dissolving body for a given actor.
 * Returns true if the effect is still active (caller should not draw normal corpse).
 * Returns false if no effect is active for this actor.
 */
function drawDissolving(ctx, actor) {
  const fx = _activeEffects.find(f => f.actor === actor);
  if (!fx) return false;

  const px = (fx.wx + 0.5) * T;
  const py = (fx.wy + 0.5) * T;

  // Contact shadow (fading)
  if (fx.shadowAlpha > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.35 * fx.shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(px, py + 12, actor.isElite ? 13 : 9, actor.isElite ? 6 : 4, 0, 0, 6.28);
    ctx.fill();
    ctx.restore();
  }

  // Dissolving body with progressive upward clip
  if (fx.bodyAlpha > 0.01 && fx.phase !== 'spark' && fx.phase !== 'done') {
    ctx.save();

    // Progressive dissolve clip: body erases bottom-to-top
    // Create a clipping region that shrinks upward as dissolveProgress increases
    const isMiniBoss = !!actor.isMiniBoss;
    const isElite = !!actor.isElite;
    const bodyTop = py - (isMiniBoss ? 35 : isElite ? 26 : 22);
    const bodyBot = py + (isMiniBoss ? 25 : isElite ? 20 : 16);
    const bodyH = bodyBot - bodyTop;
    const clipTop = bodyTop;
    const clipBot = bodyBot - fx.dissolveProgress * bodyH;

    if (clipBot > clipTop) {
      ctx.beginPath();
      ctx.rect(px - (isMiniBoss ? 45 : 35), clipTop, (isMiniBoss ? 90 : 70), clipBot - clipTop);
      ctx.clip();

      ctx.globalAlpha = fx.bodyAlpha;

      // Draw the original corpse form (simplified static body or custom callback)
      _drawStaticCorpse(ctx, px, py, actor, fx);
    }

    ctx.restore();
  }

  // Local dissolution glow
  if (fx.glowAlpha > 0.01) {
    ctx.save();
    const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, fx.glowRadius + T * 0.3);
    glowGrad.addColorStop(0, _hexToRgba(fx.colors.core, fx.glowAlpha * 0.6));
    glowGrad.addColorStop(1, _hexToRgba(fx.colors.core, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, fx.glowRadius + T * 0.3, 0, 6.28);
    ctx.fill();
    ctx.restore();
  }

  return true;
}

/**
 * Draw all active dissolution particles (called once per frame from render loop).
 */
function drawParticles(ctx) {
  for (let i = 0; i < _activeParticles.length; i++) {
    const p = _activeParticles[i];
    if (!p.active) continue;

    const t = Math.max(0, p.life / p.maxLife);
    const sx = (p.wx + 0.5) * T;
    const sy = (p.wy + 0.5) * T;

    ctx.save();

    if (p.glow) {
      ctx.shadowColor = p.col;
      ctx.shadowBlur = 6 * t;
    }

    ctx.globalAlpha = t * 0.85;
    ctx.fillStyle = p.col;

    if (p.layer === 'fragment') {
      // Angular fragment shapes
      ctx.translate(sx, sy);
      ctx.rotate(p.rotation);
      const sz = Math.max(0.5, p.size * t);
      ctx.beginPath();
      ctx.moveTo(-sz, -sz * 0.5);
      ctx.lineTo(sz * 0.3, -sz);
      ctx.lineTo(sz, sz * 0.4);
      ctx.lineTo(-sz * 0.4, sz);
      ctx.closePath();
      ctx.fill();
    } else if (p.layer === 'core') {
      // Bright core glow
      ctx.globalAlpha = t;
      const coreGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * t + 2);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, p.col);
      coreGrad.addColorStop(1, _hexToRgba(p.col, 0));
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * t + 2, 0, 6.28);
      ctx.fill();
    } else {
      // Dust and energy: small circles
      const r = Math.max(0.3, p.size * t);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, 6.28);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// STATIC CORPSE RENDERER (for dissolving body)
// Simplified in-place body that preserves enemy silhouette
// ─────────────────────────────────────────────────────────────
function _drawStaticCorpse(ctx, px, py, actor, fx) {
  if (typeof actor._drawCorpseCustom === 'function') {
    ctx.save();
    ctx.translate(px, py);
    actor._drawCorpseCustom(ctx, fx);
    ctx.restore();
    return;
  }

  const type = actor.type || fx.type || 'skeleton';

  ctx.save();
  ctx.translate(px, py);

  if (type === 'skeleton') {
    // Bone pile silhouette
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-1.5, -4, 3, 11);
    ctx.fillRect(-6, -2, 12, 1.5);
    ctx.fillRect(-5, 1, 10, 1.5);
    // Skull
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, -9, 5.5, 0, 6.28);
    ctx.fill();
    // Dim eyes
    ctx.fillStyle = '#ef4444';
    ctx.globalAlpha *= 0.5;
    ctx.beginPath();
    ctx.arc(-2, -9, 0.8, 0, 6.28);
    ctx.arc(2, -9, 0.8, 0, 6.28);
    ctx.fill();
  } else if (type === 'ghoul') {
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(0, -3, 8, 7, 0.3, 0, 6.28);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -6, 5, 0, 6.28);
    ctx.fill();
  } else if (type === 'demon') {
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, 6.28);
    ctx.fill();
    // Horns
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-6, -11); ctx.lineTo(-10, -18); ctx.lineTo(-3, -13);
    ctx.moveTo(6, -11); ctx.lineTo(10, -18); ctx.lineTo(3, -13);
    ctx.fill();
    // Dimmed core
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.arc(0, -3, 3.5, 0, 6.28);
    ctx.fill();
  } else if (type === 'wraith') {
    ctx.globalAlpha *= 0.7;
    ctx.fillStyle = '#6b21a8';
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.lineTo(5, 12);
    ctx.lineTo(-5, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.arc(0, -9, 6.5, 0, 6.28);
    ctx.fill();
  } else if (type === 'guard') {
    // Armored guard silhouette (for cinematic guards)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, -4, 16, 14);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-7, -3, 14, 6);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -9, 6.5, 0, 6.28);
    ctx.fill();
  } else {
    // Generic fallback
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, -2, 7, 0, 6.28);
    ctx.fill();
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────
function _hexToRgba(hex, alpha) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────
function isDissolvingActive(actor) {
  return _activeEffects.some(f => f.actor === actor);
}

function isDissolutionComplete(actor) {
  if (!actor._dissolveStarted) return false;
  return !_activeEffects.some(f => f.actor === actor);
}

function getActiveCount() {
  return _activeEffects.length;
}

// ─────────────────────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────────────────────
function reset() {
  _activeEffects.length = 0;
  _activeParticles.length = 0;
}

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────
export const AbyssDissolution = {
  startDissolution,
  tick,
  drawDissolving,
  drawParticles,
  isDissolvingActive,
  isDissolutionComplete,
  getActiveCount,
  reset,
  DISSOLUTION_COLORS
};

if (typeof window !== 'undefined') {
  window.AbyssDissolution = AbyssDissolution;
}
