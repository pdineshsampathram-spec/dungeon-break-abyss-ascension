// =====================================================================
//  DUNGEON BREAK — js/cinematics/ShatteredMindCinematic.js
//  Authoritative In-Engine Shattered Mind Ending Cinematic
//  Psychological Sanity-Zero Collapse & World Erasure
//  ENVIRONMENT FIRST — Architectural Arena, Layered Forest, Burning Battlefield
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T, ROWS, COLS } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { CharacterRenderer } from '../rendering/CharacterRenderer.js';
import { quitToMainMenu } from '../ui/PauseMenu.js';
import { CINEMATIC_W, CINEMATIC_H } from './CinematicRenderer.js';
import { RunResetManager } from '../systems/RunResetManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { CinematicSafety } from './CinematicSafety.js';

// ─────────────────────────────────────────────────────────────
// Cinematic Timeline Phases (Deliberate Pacing: Total ~57.5s)
// ─────────────────────────────────────────────────────────────
export const SHATTERED_MIND_TIMELINE = {
  BLACK_INTRO: 2.00,          // 0.00 – 2.00s: Pure black void & silence (beat to register)
  RED_EYE: 3.80,              // 2.00 – 3.80s: The approved red pixel eye appears, stares, and blinks
  EMPTY_ARENA: 9.20,          // 3.80 – 9.20s: Enormous strange dungeon arena with pillars, torches, and central eye
  MEMORY_FLASH_1: 14.20,      // 9.20 – 14.20s: Word-by-word edited memory: "YOU WERE NEVER TRAPPED INSIDE."
  CAMPFIRE_MEMORY: 21.00,     // 14.20 – 21.00s: Peaceful layered pine forest, campfire illumination, lively companions
  EYE_FLASH_2: 27.20,         // 21.00 – 27.20s: Sudden red eye interruption + Word-by-word: "ILLUSIONS CAN BE DECEIVING. BEHOLD THE REALITY."
  TRANSFORMATION: 33.50,      // 27.20 – 33.50s: Memory corrupts: music detunes, companions freeze, fire dims, ground scars
  BATTLEFIELD_FIRE: 41.00,    // 33.50 – 41.00s: TREES CATCH FIRE progressively, battlefield reveal, bodies dissolve
  RETURN_DUNGEON_SNAP: 42.50, // 41.00 – 42.50s: Hard snap back to real dungeon floor & brief quiet silence
  BLACK_FOG: 51.50,           // 42.50 – 51.50s: World-space black fog expands, dims torches, dissolves enemies/boss
  FINAL_BLACK: 53.50,         // 51.50 – 53.50s: Complete blackness & silence
  TITLE_STANDALONE: 57.50,    // 53.50 – 57.50s: Standalone cinematic "SHATTERED MIND" title card
  END_CARD: 57.50             // 57.50s+: Subtitle, quote, and interactive buttons fade in
};

let _activeCinematic = null;
let _cinematicStarted = false;

// ─────────────────────────────────────────────────────────────
// Pixel-Art Tile & Architecture Drawing Helpers (reusing T=32 grid)
// ─────────────────────────────────────────────────────────────

/** Draw a single dungeon flagstone floor tile at pixel position (px, py) */
function _drawFloorTile(ctx, px, py, seed, palette) {
  const fc = palette || ['#0c1526', '#0d1628', '#0b1422', '#0e1830'];
  const colIdx = seed % fc.length;
  ctx.fillStyle = fc[colIdx];
  ctx.fillRect(px, py, T, T);

  // Grout perimeter
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);

  // Top-left specular bevel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 1, py + T - 2);
  ctx.lineTo(px + 1, py + 1);
  ctx.lineTo(px + T - 2, py + 1);
  ctx.stroke();

  // Procedural stone weathering
  const detailSeed = seed % 19;
  if (detailSeed === 0) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 6);
    ctx.lineTo(px + 14, py + 16);
    ctx.lineTo(px + 24, py + 13);
    ctx.stroke();
  } else if (detailSeed === 5) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(px + 3, py + 3, 3, 3);
    ctx.fillRect(px + T - 6, py + 3, 3, 3);
  } else if (detailSeed === 11) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(px + 10, py + 14, 12, 4);
  }
}

/** Draw a single 2.5D dungeon wall tile at pixel position (px, py) */
function _drawWallTile(ctx, px, py, row, hasSouth, palette) {
  const wc = palette || ['#1e293b', '#334155'];
  if (!hasSouth) {
    // Top cap
    ctx.fillStyle = wc[1];
    ctx.fillRect(px, py, T, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(px, py, T, 1.5);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(px + 15, py, 1.2, 10);
    ctx.fillRect(px, py + 9, T, 1.2);

    // Vertical front face
    const frontGrad = ctx.createLinearGradient(px, py + 10, px, py + T);
    frontGrad.addColorStop(0, wc[0]);
    frontGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = frontGrad;
    ctx.fillRect(px, py + 10, T, T - 10);

    // Masonry courses
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 21);
    ctx.lineTo(px + T, py + 21);
    const stagger = (row % 2 === 0) ? 16 : 8;
    ctx.moveTo(px + stagger, py + 10);
    ctx.lineTo(px + stagger, py + 21);
    ctx.moveTo(px + ((stagger + 16) % 32), py + 21);
    ctx.lineTo(px + ((stagger + 16) % 32), py + T);
    ctx.stroke();

    // Bottom shadow cast onto floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(px, py + T - 3, T, 3);
  } else {
    // Solid interior wall block
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = wc[1];
    ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
  }
}

/** Draw a massive 2x2 carved stone architectural pillar with torch */
function _drawArchitecturalPillar(ctx, px, py, timer) {
  const pW = T * 2;
  const pH = T * 2.5;

  // Cast base shadow onto floor
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(px + pW / 2, py + pH + 2, pW * 0.7, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stone base pedestal
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px - 4, py + pH - 16, pW + 8, 16);
  ctx.fillStyle = '#334155';
  ctx.fillRect(px - 2, py + pH - 14, pW + 4, 3);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(px - 4, py + pH - 2, pW + 8, 2);

  // Column shaft with vertical fluting
  const colGrad = ctx.createLinearGradient(px, py, px + pW, py);
  colGrad.addColorStop(0, '#0f172a');
  colGrad.addColorStop(0.2, '#334155');
  colGrad.addColorStop(0.5, '#475569');
  colGrad.addColorStop(0.8, '#334155');
  colGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = colGrad;
  ctx.fillRect(px, py + 12, pW, pH - 28);

  // Vertical fluting lines
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(px + 10, py + 14, 3, pH - 32);
  ctx.fillRect(px + pW / 2 - 1.5, py + 14, 3, pH - 32);
  ctx.fillRect(px + pW - 13, py + 14, 3, pH - 32);

  // Carved stone capital / top ledge
  ctx.fillStyle = '#334155';
  ctx.fillRect(px - 6, py, pW + 12, 12);
  ctx.fillStyle = '#475569';
  ctx.fillRect(px - 4, py + 2, pW + 8, 3);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(px - 6, py + 10, pW + 12, 2);

  // Wall iron sconce & flame on pillar face
  _drawTorch(ctx, px + pW / 2 - T / 2, py + pH / 2 - 12, timer);
}

/** Draw an authentic pixel-art wall torch with flame & light */
function _drawTorch(ctx, px, py, timer) {
  // Iron sconce bracket
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(px + 14, py + 12, 4, 10);
  ctx.fillRect(px + 12, py + 10, 8, 3);

  // Flickering pixel flame blocks
  const flicker = Math.sin(timer * 11.0 + px) * 2;
  const fH = Math.max(4, Math.round(7 + flicker));

  // Orange flame body
  ctx.fillStyle = '#f97316';
  ctx.fillRect(px + 13, py + 10 - fH, 6, fH);
  // Yellow intense core
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(px + 14, py + 11 - Math.round(fH * 0.7), 4, Math.round(fH * 0.7));
  // White spark tip
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px + 15, py + 9 - fH, 2, 2);

  // Warm light pool
  ctx.save();
  const lg = ctx.createRadialGradient(px + 16, py + 10, 2, px + 16, py + 10, 48);
  lg.addColorStop(0, 'rgba(251, 146, 60, 0.18)');
  lg.addColorStop(0.5, 'rgba(234, 88, 12, 0.08)');
  lg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = lg;
  ctx.fillRect(px - 32, py - 38, 96, 96);
  ctx.restore();
}

/** Draw a companion deserter in one of three expressive poses */
function _drawCompanion(ctx, px, py, pose, facing, animTimer, alpha, freeze) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  ctx.translate(px, py);
  if (facing === -1) ctx.scale(-1, 1);

  const t = freeze ? 0 : animTimer;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (pose === 'sit_drink') {
    // Companion sitting on a hewn wooden log with an ale mug
    ctx.fillStyle = '#3f2e22';
    ctx.fillRect(-12, 6, 24, 8);
    // Legs bent sitting
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, 4, 12, 7);
    ctx.fillRect(-8, 9, 6, 5);
    ctx.fillRect(2, 9, 6, 5);
    // Torso in blue deserter tunic
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(-6, -7, 12, 12);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-5, -6, 10, 5);
    // Head with leather cap
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-4, -15, 8, 8);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-5, -17, 10, 4);
    // Mug raising to drink
    const drinkCycle = Math.sin(t * 2.0);
    const mugBob = drinkCycle > 0.3 ? (drinkCycle - 0.3) * 4 : 0;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(6, -11 - mugBob, 5, 7);
    ctx.fillStyle = '#fef08a'; // foam
    ctx.fillRect(6, -12 - mugBob, 5, 2);
  } else if (pose === 'clap_laugh') {
    // Companion standing, rhythmically clapping and laughing
    const clap = Math.sin(t * 5.0) * 2;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, 2, 5, 10);
    ctx.fillRect(1, 2, 5, 10);
    ctx.fillStyle = '#3f2e22';
    ctx.fillRect(-7, -10, 14, 14);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-4, -18, 8, 8);
    // Clapping hands
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-3 + clap, -6, 3, 3);
    ctx.fillRect(0 - clap, -6, 3, 3);
  } else if (pose === 'dance') {
    // Companion merrily dancing, stepping left/right with raised arms
    const step = Math.sin(t * 4.5);
    ctx.translate(0, -Math.abs(step) * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, 2 + step * 2, 5, 9);
    ctx.fillRect(1, 2 - step * 2, 5, 9);
    ctx.fillStyle = '#3f2e22';
    ctx.fillRect(-7, -11, 14, 14);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-4, -19, 8, 8);
    // Raised dancing arms
    ctx.fillStyle = '#3f2e22';
    ctx.fillRect(-10, -14 + step * 2, 4, 3);
    ctx.fillRect(6, -14 - step * 2, 4, 3);
  }

  ctx.restore();
}

/** Draw recognizable fallen campfire companion with ground contact shadow and pixel-art dissolution */
function _drawCorpse(ctx, px, py, soldierIdx, alpha, timer) {
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  // 1. Soft grounded contact shadow (fades in direct proportion with alpha)
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.38})`;
  ctx.beginPath();
  ctx.ellipse(px, py + 7, 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Subtle supernatural instability jitter when dissolving
  if (alpha < 0.95) {
    const jitterX = (Math.random() - 0.5) * (alpha < 0.6 ? 1.4 : 0.8);
    const jitterY = (Math.random() - 0.5) * (alpha < 0.6 ? 0.8 : 0.4);
    px += jitterX;
    py += jitterY;
  }

  if (soldierIdx === 0) {
    // Companion 0: Slumped forward over his charred wooden log in blue deserter tunic
    // Charred log
    ctx.fillStyle = '#271c15';
    ctx.fillRect(px - 13, py + 3, 26, 7);
    ctx.fillStyle = '#1c1511';
    ctx.fillRect(px - 11, py + 5, 22, 4);

    // Dark trousers and limp boots
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 8, py + 4, 6, 6);
    ctx.fillRect(px - 1, py + 4, 6, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 9, py + 8, 5, 3);
    ctx.fillRect(px, py + 8, 5, 3);

    // Torso in recognizable blue deserter tunic with highlight
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(px - 7, py - 4, 14, 9);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(px - 5, py - 3, 10, 4);
    ctx.fillStyle = '#451a03'; // leather belt
    ctx.fillRect(px - 6, py + 2, 12, 2);

    // Slumped head with leather cap
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px - 4, py - 11, 8, 7);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px - 5, py - 13, 10, 4);

    // Limp arm
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(px + 5, py - 1, 4, 7);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 5, py + 5, 3, 3);

    // Tipped wooden ale mug in the ash
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(px + 9, py + 5, 5, 4);
  } else if (soldierIdx === 1) {
    // Companion 1: Collapsed prone on earth in warm leather/brown tunic
    // Legs stretched horizontally in dark trousers
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 13, py + 1, 10, 5);
    ctx.fillRect(px - 9, py + 3, 8, 4);
    ctx.fillStyle = '#0f172a'; // boots
    ctx.fillRect(px - 15, py + 2, 4, 4);

    // Torso in recognizable warm brown/leather tunic
    ctx.fillStyle = '#3f2e22';
    ctx.fillRect(px - 5, py - 3, 14, 9);
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(px - 3, py - 2, 10, 5);
    ctx.fillStyle = '#271810'; // belt
    ctx.fillRect(px - 5, py + 1, 14, 2);

    // Fallen head resting on the soil
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 8, py - 2, 7, 7);
    ctx.fillStyle = '#451a03'; // brown hair
    ctx.fillRect(px + 9, py - 4, 7, 3);

    // Limp outstretched arms
    ctx.fillStyle = '#3f2e22';
    ctx.fillRect(px - 1, py + 3, 8, 3);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 6, py + 3, 3, 3);
  } else {
    // Companion 2: Collapsed on side in russet tunic with knees drawn
    // Legs bent in dark trousers
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 12, py + 2, 10, 5);
    ctx.fillRect(px - 7, py + 4, 8, 5);
    ctx.fillStyle = '#0f172a'; // boots
    ctx.fillRect(px - 14, py + 3, 4, 4);

    // Torso in russet tunic and shoulder mantle
    ctx.fillStyle = '#3f2e22';
    ctx.fillRect(px - 4, py - 4, 13, 9);
    ctx.fillStyle = '#4a382a';
    ctx.fillRect(px - 2, py - 3, 9, 6);

    // Head tilted in repose
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 8, py - 4, 7, 7);
    ctx.fillStyle = '#261b15'; // dark hair
    ctx.fillRect(px + 7, py - 6, 8, 3);

    // Limp folded arm
    ctx.fillStyle = '#3f2e22';
    ctx.fillRect(px, py + 2, 6, 4);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 5, py + 3, 3, 3);
  }

  ctx.restore();
}

/** Draw broken battlefield weapons stuck in earth */
function _drawBrokenWeapon(ctx, px, py, type) {
  ctx.save();
  if (type === 'spear') {
    // Wooden spear planted diagonally into ground
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(px, py - 20, 3, 26);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(px - 1, py - 24, 5, 6);
    ctx.fillRect(px, py - 26, 3, 3);
  } else if (type === 'sword') {
    // Broken broadsword stuck upright
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(px, py - 12, 3, 14);
    ctx.fillStyle = '#475569';
    ctx.fillRect(px - 4, py - 14, 11, 3);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px, py - 18, 3, 5);
  } else if (type === 'shield') {
    // Dented iron shield resting on earth
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 6, py - 4, 12, 14);
    ctx.fillStyle = '#475569';
    ctx.fillRect(px - 4, py - 2, 8, 10);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(px - 2, py, 4, 6);
  }
  ctx.restore();
}

/** Blood pools removed to avoid graphic gore and leftover ground marks */
function _drawBloodPools(ctx, pools) {
  // Deliberately no-op: clean uncanny battlefield without graphic gore or lingering ground marks
}

// ─────────────────────────────────────────────────────────────
// LOCKED APPROVED PIXEL-ART RED EYE DESIGN (DO NOT REDESIGN)
// ─────────────────────────────────────────────────────────────

export function drawPixelEye(ctx, cx, cy, scale, blinkProg, timer) {
  ctx.save();
  const P = Math.max(2, Math.round(scale * 1.5)); // chunky pixel unit
  const effectiveOpen = Math.max(0, 1.0 - blinkProg);

  // Outer dark aura glow (smooth radial gradient behind pixel eye)
  if (effectiveOpen > 0.1) {
    ctx.save();
    const auraR = 26 * P;
    const auraGrad = ctx.createRadialGradient(cx, cy, 4 * P, cx, cy, auraR);
    auraGrad.addColorStop(0, 'rgba(220, 38, 38, 0.30)');
    auraGrad.addColorStop(0.35, 'rgba(153, 27, 27, 0.16)');
    auraGrad.addColorStop(0.7, 'rgba(69, 10, 10, 0.05)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(cx - auraR, cy - auraR, auraR * 2, auraR * 2);
    ctx.restore();
  }

  if (effectiveOpen < 0.08) {
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
const _drawPixelEye = drawPixelEye;

// ─────────────────────────────────────────────────────────────
// Environment Builders
// ─────────────────────────────────────────────────────────────

/** Build the "Strange Dungeon Arena" — large architectural hall with pillars */
function _buildStrangeArena(cx, cy) {
  const tiles = [];
  const torchPositions = [];
  const pillars = [
    { c: Math.round(cx) - 7, r: Math.round(cy) - 4 },
    { c: Math.round(cx) + 5, r: Math.round(cy) - 4 },
    { c: Math.round(cx) - 7, r: Math.round(cy) + 2 },
    { c: Math.round(cx) + 5, r: Math.round(cy) + 2 }
  ];

  const spanR = 9;
  const spanC = 14;

  for (let dr = -spanR; dr <= spanR; dr++) {
    for (let dc = -spanC; dc <= spanC; dc++) {
      const tr = Math.round(cy) + dr;
      const tc = Math.round(cx) + dc;
      const isPerimeter = (dr === -spanR || dr === spanR || dc === -spanC || dc === spanC);
      const isWall = isPerimeter;

      if (isWall) {
        const hasSouth = (dr < spanR);
        tiles.push({ r: tr, c: tc, type: 'wall', hasSouth, seed: Math.abs(tr * 13 + tc * 29) % 23 });
        if (dr === -spanR && Math.abs(dc) % 6 === 0) {
          torchPositions.push({ r: tr, c: tc });
        }
      } else {
        tiles.push({ r: tr, c: tc, type: 'floor', seed: Math.abs(tr * 7 + tc * 19) % 31 });
      }
    }
  }

  const palette = {
    fc: ['#0f172a', '#111827', '#0c1222', '#141e33'],
    wc: ['#1e293b', '#334155']
  };

  return { tiles, torchPositions, pillars, palette };
}

/** Build the "Peaceful Forest Clearing" — layered pine trees framing a green meadow */
function _buildCampClearing(cx, cy) {
  const tiles = [];
  const trees = [];
  const spanR = 11;
  const spanC = 16;

  for (let dr = -spanR; dr <= spanR; dr++) {
    for (let dc = -spanC; dc <= spanC; dc++) {
      const dist = Math.sqrt(dr * dr * 1.35 + dc * dc);
      const tr = Math.round(cy) + dr;
      const tc = Math.round(cx) + dc;

      if (dist <= 6.8) {
        // Lush grass clearing
        tiles.push({ r: tr, c: tc, type: 'grass', seed: Math.abs(tr * 11 + tc * 37) % 29 });
      } else if (dist <= 10.5) {
        // Clearing perimeter pine trees
        tiles.push({ r: tr, c: tc, type: 'grass', seed: Math.abs(tr * 11 + tc * 37) % 29 });
        if ((Math.abs(dr * 7 + dc * 13) % 4) !== 0) {
          trees.push({
            r: tr,
            c: tc,
            layer: 'mid',
            h: 36 + ((Math.abs(tr * 5 + tc) % 4) * 4),
            w: 26 + ((Math.abs(tc * 3 + tr) % 3) * 3),
            fireStage: 0,
            fireIgniteDelay: 0.5 + Math.random() * 4.5
          });
        }
      } else {
        // Background deep forest silhouettes
        tiles.push({ r: tr, c: tc, type: 'grass', seed: 0 });
        trees.push({
          r: tr,
          c: tc,
          layer: 'bg',
          h: 42 + ((Math.abs(tr * 9 + tc) % 5) * 4),
          w: 28,
          fireStage: 0,
          fireIgniteDelay: 0.2 + Math.random() * 3.5
        });
      }
    }
  }

  // Sort trees back-to-front by row
  trees.sort((a, b) => a.r - b.r);

  return { tiles, trees };
}

// ─────────────────────────────────────────────────────────────
// Environment Renderers
// ─────────────────────────────────────────────────────────────

function _renderStrangeArena(ctx, arena, timer) {
  const { tiles, torchPositions, pillars, palette } = arena;

  // 1. Floor & Wall tiles
  tiles.forEach(tile => {
    const px = tile.c * T;
    const py = tile.r * T;
    if (tile.type === 'floor') {
      _drawFloorTile(ctx, px, py, tile.seed, palette.fc);
    } else if (tile.type === 'wall') {
      _drawWallTile(ctx, px, py, tile.r, tile.hasSouth, palette.wc);
    }
  });

  // 2. Wall torches
  torchPositions.forEach(tp => {
    _drawTorch(ctx, tp.c * T, tp.r * T, timer);
  });

  // 3. Four Massive Carved Stone Pillars
  pillars.forEach(p => {
    _drawArchitecturalPillar(ctx, p.c * T, p.r * T, timer);
  });
}

/** Color interpolation helper between two hex colors */
function _interpolateHex(c1, c2, factor) {
  const f = Math.max(0, Math.min(1, factor));
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * f);
  const g = Math.round(g1 + (g2 - g1) * f);
  const b = Math.round(b1 + (b2 - b1) * f);
  return `rgb(${r},${g},${b})`;
}

// Ground Palettes for Progressive Corruption: Living Forest -> Withered Moss -> Scorched Peat -> Ruined Battlefield Ash
const LIVING_FOREST_GREENS = ['#1b3a1e', '#234726', '#173319', '#2a532d', '#1f4122'];
const WITHERED_MOSS_GREENS = ['#2b3720', '#343a23', '#25301c', '#383b25', '#2d3321'];
const SCORCHED_PEAT_EARTHS = ['#221914', '#281d17', '#1a1410', '#2d2019', '#201814'];
const RUINED_BATTLEFIELD_ASH = ['#161413', '#1b1715', '#131110', '#1e1816', '#171413'];

function _renderForestFloor(ctx, camp, corruptionT) {
  const { tiles } = camp;

  tiles.forEach(tile => {
    const px = tile.c * T;
    const py = tile.r * T;

    // Smooth organic spatial distribution for connected patch corruption
    const patchNoise = (Math.sin(tile.c * 0.42 + 1.1) * Math.cos(tile.r * 0.42 - 0.7) * 0.35)
                     + (Math.sin(tile.c * 0.85 - tile.r * 0.6) * 0.15)
                     + 0.5; // [0.0, 1.0]

    let localT = 0;
    if (corruptionT > 0) {
      const threshold = patchNoise * 0.52;
      localT = Math.max(0, Math.min(1.0, (corruptionT - threshold) / (1.0 - threshold * 0.68)));
    }

    // 1. Multi-stage color blending for floor tile
    const seedIdx = tile.seed % LIVING_FOREST_GREENS.length;
    let tileColor;
    if (localT <= 0) {
      tileColor = LIVING_FOREST_GREENS[seedIdx];
    } else if (localT < 0.35) {
      tileColor = _interpolateHex(LIVING_FOREST_GREENS[seedIdx], WITHERED_MOSS_GREENS[seedIdx], localT / 0.35);
    } else if (localT < 0.75) {
      tileColor = _interpolateHex(WITHERED_MOSS_GREENS[seedIdx], SCORCHED_PEAT_EARTHS[seedIdx], (localT - 0.35) / 0.40);
    } else {
      tileColor = _interpolateHex(SCORCHED_PEAT_EARTHS[seedIdx], RUINED_BATTLEFIELD_ASH[seedIdx], (localT - 0.75) / 0.25);
    }

    ctx.fillStyle = tileColor;
    ctx.fillRect(px, py, T, T);

    // 2. Clear, restrained floor-tile boundaries matching existing world geometry
    const seamAlpha = 0.12 + localT * 0.12;
    ctx.strokeStyle = `rgba(0, 0, 0, ${seamAlpha})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);

    // 3. Living grass blade details (wither and fade out as ground scorches)
    if (tile.seed % 3 === 0 && localT < 0.45) {
      const bladeAlpha = (1.0 - localT / 0.45) * 0.12;
      ctx.strokeStyle = `rgba(134, 239, 172, ${bladeAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 6, py + T);
      ctx.lineTo(px + 8, py + T - 6);
      ctx.moveTo(px + 22, py + T);
      ctx.lineTo(px + 20, py + T - 5);
      ctx.stroke();
    }

    // 4. Wildflowers (wither early in transition)
    if (localT < 0.30) {
      const flowerAlpha = 1.0 - localT / 0.30;
      if (tile.seed % 7 === 1) {
        ctx.fillStyle = `rgba(254, 240, 138, ${flowerAlpha})`; // daisy
        ctx.fillRect(px + 10, py + 12, 2, 2);
      } else if (tile.seed % 11 === 2) {
        ctx.fillStyle = `rgba(192, 132, 252, ${flowerAlpha})`; // lavender
        ctx.fillRect(px + 18, py + 8, 2, 2);
      }
    }

    // 5. Scorched ash patches on transitioning tiles
    if (tile.seed % 5 === 0 && localT >= 0.45) {
      const ashAlpha = Math.min(0.38, (localT - 0.45) * 0.75);
      ctx.fillStyle = `rgba(15, 12, 10, ${ashAlpha})`;
      ctx.fillRect(px + 4, py + 5, 10, 6);
    }

    // 6. Restrained hairline battle damage / cracks on occasional tiles (no loud red marks)
    if (tile.seed % 8 === 2 && localT >= 0.65) {
      const crackAlpha = Math.min(0.50, (localT - 0.65) * 1.4);
      ctx.strokeStyle = `rgba(10, 8, 7, ${crackAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 6);
      ctx.lineTo(px + 14, py + 16);
      ctx.lineTo(px + 22, py + 14);
      ctx.stroke();
    }

    // 7. Sparse micro-ember specks on rare tiles
    if (tile.seed % 17 === 0 && localT >= 0.85) {
      ctx.fillStyle = 'rgba(234, 88, 12, 0.45)';
      ctx.fillRect(px + 14, py + 18, 1, 1);
    }
  });
}

/** Render a single pine tree with clear pixel trunk, tiered canopy, and environmental fire */
function _drawPineTree(ctx, tree, timer, isBurning, burnProgress) {
  const px = tree.c * T;
  const py = tree.r * T;

  ctx.save();

  if (tree.layer === 'bg') {
    // Distant background silhouette
    ctx.fillStyle = isBurning ? '#261208' : '#08170c';
    ctx.beginPath();
    ctx.moveTo(px + T / 2, py - tree.h);
    ctx.lineTo(px + T / 2 + tree.w / 2, py + T);
    ctx.lineTo(px + T / 2 - tree.w / 2, py + T);
    ctx.closePath();
    ctx.fill();
  } else {
    // Cast shadow on grass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px + T / 2 + 4, py + T - 2, tree.w * 0.45, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wood trunk
    ctx.fillStyle = isBurning ? '#1c1917' : '#451a03';
    ctx.fillRect(px + T / 2 - 3, py + T - 14, 6, 14);

    // 3 Tiered Pine Canopies (bottom, middle, top)
    const tiers = [
      { yOffset: -2, w: tree.w, h: 14, col: '#14532d' },
      { yOffset: -12, w: tree.w * 0.8, h: 12, col: '#166534' },
      { yOffset: -22, w: tree.w * 0.55, h: 10, col: '#15803d' }
    ];

    tiers.forEach(tier => {
      const topY = py + T + tier.yOffset - tier.h;
      const botY = py + T + tier.yOffset;
      const halfW = tier.w / 2;

      ctx.fillStyle = isBurning ? '#181512' : tier.col;
      ctx.beginPath();
      ctx.moveTo(px + T / 2, topY);
      ctx.lineTo(px + T / 2 + halfW, botY);
      ctx.lineTo(px + T / 2 - halfW, botY);
      ctx.closePath();
      ctx.fill();

      // Highlight edge tip
      if (!isBurning) {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.18)';
        ctx.fillRect(px + T / 2 - 1, topY, 2, 3);
      }
    });
  }

  // Environmental fire attached directly to tree trunk and canopies
  if (isBurning && burnProgress > 0) {
    const fPulse = Math.sin(timer * 12.0 + px) * 2;
    const fAlpha = Math.min(1.0, burnProgress * 1.5);

    ctx.save();
    ctx.globalAlpha = fAlpha;

    // Trunk flames
    ctx.fillStyle = '#f97316';
    ctx.fillRect(px + T / 2 - 4, py + T - 12 - fPulse, 8, 8 + fPulse);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + T / 2 - 2, py + T - 10, 4, 5);

    // Canopy flames (eating into foliage)
    if (burnProgress > 0.3) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + T / 2 - 8, py + T - 20 - fPulse, 6, 9 + fPulse);
      ctx.fillRect(px + T / 2 + 2, py + T - 24 + fPulse, 7, 10 - fPulse);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + T / 2 - 6, py + T - 18, 3, 5);
      ctx.fillRect(px + T / 2 + 4, py + T - 22, 4, 6);
    }

    // Top crown fire
    if (burnProgress > 0.6) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(px + T / 2 - 4, py + T - 34 - fPulse, 8, 11 + fPulse);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + T / 2 - 1, py + T - 32, 2, 4);
    }

    // Environmental fire illumination cast onto surroundings
    const fireGlow = ctx.createRadialGradient(px + T / 2, py + T - 16, 4, px + T / 2, py + T - 16, 48);
    fireGlow.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
    fireGlow.addColorStop(0.6, 'rgba(220, 38, 38, 0.08)');
    fireGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fireGlow;
    ctx.fillRect(px + T / 2 - 48, py + T - 64, 96, 96);

    ctx.restore();
  }

  ctx.restore();
}

/** Draw the central pixel-art campfire with animated flame and warm illumination */
function _drawCampfire(ctx, px, py, timer, isColdAsh) {
  if (isColdAsh) {
    // Collapsed cold charcoal ash
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(px, py + 4, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 10, py + 2, 20, 4);
    return;
  }

  // Stone ring (chunky stone blocks)
  const stones = [
    [-14, 2, 8, 6], [-8, 6, 8, 6], [0, 7, 8, 6], [8, 5, 8, 6], [14, 1, 7, 6],
    [-12, -4, 7, 5], [-6, -7, 6, 5], [2, -7, 6, 5], [9, -4, 6, 5]
  ];
  stones.forEach(([sx, sy, sw, sh]) => {
    ctx.fillStyle = '#475569';
    ctx.fillRect(px + sx, py + sy, sw, sh);
    ctx.fillStyle = '#334155';
    ctx.fillRect(px + sx + 1, py + sy + 1, sw - 2, sh - 2);
  });

  // Stacked firewood logs
  ctx.fillStyle = '#451a03';
  ctx.fillRect(px - 10, py - 1, 20, 5);
  ctx.fillStyle = '#291002';
  ctx.fillRect(px - 7, py - 4, 14, 4);

  // Animated Pixel Fire Core
  const f1 = Math.sin(timer * 10.0) * 3;
  const f2 = Math.cos(timer * 13.5) * 2.5;

  // Outer red-orange flame
  ctx.fillStyle = '#f97316';
  ctx.fillRect(px - 7, py - 12 - Math.round(f1), 14, 12 + Math.round(f1));
  ctx.fillRect(px - 9, py - 8, 18, 8);

  // Middle bright yellow flame
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(px - 5, py - 10 - Math.round(f2), 10, 10 + Math.round(f2));

  // Inner intense white core
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(px - 2, py - 7, 4, 7);

  // Warm Campfire Illumination Pool (casts warm light on characters, grass & trees)
  ctx.save();
  const fireLight = ctx.createRadialGradient(px, py, 6, px, py, 110);
  fireLight.addColorStop(0, 'rgba(251, 146, 60, 0.32)');
  fireLight.addColorStop(0.45, 'rgba(234, 88, 12, 0.14)');
  fireLight.addColorStop(0.8, 'rgba(180, 83, 9, 0.05)');
  fireLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = fireLight;
  ctx.fillRect(px - 110, py - 110, 220, 220);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// Master Cinematic Controller Object
// ─────────────────────────────────────────────────────────────

export const ShatteredMindCinematic = {
  active: false,
  finished: false,
  timer: 0,
  shotIndex: 1,

  // ─────────────────────────────────────────────────────────────
  // 1. START & RESET
  // ─────────────────────────────────────────────────────────────
  start(opts = {}) {
    if (this.active) return;
    const isReplay = !!opts.isReplay;
    CinematicSafety.startCinematic('shattered_mind', typeof opts === 'object' ? opts : { isReplay });

    if (!isReplay && SaveSystem && SaveSystem.recordCinematicUnlock) {
      SaveSystem.recordCinematicUnlock('shattered_mind');
    }

    this.active = true;
    this.finished = false;
    this.timer = 0;
    this.shotIndex = 1;

    const P = GameState.P;
    const CAM = GameState.CAM;

    // Freeze player input and combat
    if (P) {
      P.san = 0;
      P.dead = true;
      P.dying = true;
      P.vx = 0;
      P.vy = 0;
      P.acd = 999;
      P.dcd = 999;
      P.attacking = false;
      P.dashing = false;
      P.invulnerable = true;
      P.cinematicPose = 'hidden';
      P.weaponLowered = true;
    }

    // Set cinematic game state
    GameState.setState(GameStates.DEATH_SANITY);
    GameState.CINEMATIC_ACTIVE = true;
    GameState.ACTIVE_CINEMATIC_TYPE = 'shattered_mind';

    // Clear saved run immediately on genuine sanity collapse (never on archive replay)
    if (!isReplay && SaveSystem && SaveSystem.clearRun) {
      SaveSystem.clearRun();
    }

    // Room center coordinates
    const curRoom = (GameState.ROOMS && GameState.ROOMS[0]) || { cx: 24, cy: 16 };
    const roomCenterX = P ? P.x : curRoom.cx;
    const roomCenterY = P ? P.y : curRoom.cy;

    // Build rich pixel-art environments
    const strangeArena = _buildStrangeArena(roomCenterX, roomCenterY);
    const campClearing = _buildCampClearing(roomCenterX, roomCenterY);

    _activeCinematic = {
      timer: 0,
      roomCenterX,
      roomCenterY,
      strangeArena,
      campClearing,
      savedPlayerState: {
        x: P ? P.x : roomCenterX,
        y: P ? P.y : roomCenterY,
        fx: P ? (P.fx || 1) : 1,
        fy: P ? (P.fy || 0) : 0,
        weapon: P ? (P.activeWeapon || 'sword') : 'sword'
      },
      campfire: {
        deserters: [
          { xOffset: -2.2, yOffset: -0.2, pose: 'sit_drink', facing: 1, animTimer: 0 },
          { xOffset: 1.6, yOffset: -1.1, pose: 'clap_laugh', facing: -1, animTimer: 0.5 },
          { xOffset: 2.0, yOffset: 0.6, pose: 'dance', facing: -1, animTimer: 1.2 }
        ],
        sparks: []
      },
      battlefield: {
        corpseAlphas: [1.0, 1.0, 1.0],
        dissolveParticles: [],
        smokeParticles: [],
        emberParticles: []
      },
      fog: {
        radius: 0,
        maxRadius: 28,
        centerX: roomCenterX,
        centerY: roomCenterY
      },
      soundCues: {},
      selectedButtonIndex: 0,
      titleAlpha: 0,
      buttonsAlpha: 0,
      isDebug: !!opts.isDebug,
      outcomeCompleted: false
    };

    if (MusicManager) {
      MusicManager.stopImmediate();
    }
  },

  reset() {
    if (MusicManager && MusicManager.getCurrentTrack() === 'shatteredMind') {
      MusicManager.fadeOut(0.8);
    }
    this.active = false;
    this.finished = false;
    this.timer = 0;
    this.shotIndex = 1;
    _activeCinematic = null;
    GameState.CINEMATIC_ACTIVE = false;
    GameState.ACTIVE_CINEMATIC_TYPE = null;

    if (GameState.P) {
      GameState.P.cinematicPose = null;
      GameState.P.invulnerable = false;
      GameState.P.weaponLowered = false;
    }
  },

  isActive() {
    return this.active;
  },

  isFinished() {
    return this.finished;
  },

  seek(t, andPause = false) {
    if (!this.active || !_activeCinematic) return;
    _activeCinematic.timer = t;
    this.timer = t;
    if (andPause) _activeCinematic.paused = true;
    this.tick(0);
  },

  _onOutcomeCompleted() {
    const cine = _activeCinematic;
    if (!cine || cine.outcomeCompleted) return;
    cine.outcomeCompleted = true;

    // Genuine outcome recording (protected against debug, replay, and repeat calls)
    if (!cine.isDebug && !GameState.IS_DEBUG_ENDING && !CinematicSafety.isReplay()) {
      SaveSystem.unlockSecretBestiary('absolute');
      SaveSystem.unlockMemory('memory_shattered_mind');
      AchievementSystem.unlock('mind_break');
      SaveSystem.recordCompletionMilestone('death_shattered_mind', { source: 'shattered_mind' });
    }
  },

  getActiveCinematic() {
    return _activeCinematic;
  },

  suppressRealWorld() {
    if (!this.active || !_activeCinematic) return false;
    const t = _activeCinematic.timer;
    // Suppress real dungeon world during imaginary scenes (2.00s up to 41.00s)
    return (t >= SHATTERED_MIND_TIMELINE.BLACK_INTRO && t < SHATTERED_MIND_TIMELINE.BATTLEFIELD_FIRE);
  },

  shouldRenderRealWorldEntities() {
    if (!this.active || !_activeCinematic) return false;
    const t = _activeCinematic.timer;
    return t >= SHATTERED_MIND_TIMELINE.RETURN_DUNGEON_SNAP && t < SHATTERED_MIND_TIMELINE.BLACK_FOG;
  },

  // ─────────────────────────────────────────────────────────────
  // 2. TICK — Master Timeline Orchestration
  // ─────────────────────────────────────────────────────────────
  tick(dt) {
    if (!this.active || !_activeCinematic) return;
    const cine = _activeCinematic;

    if (cine.paused) {
      if (GameState.CAM) {
        GameState.CAM.x = GameState.CAM.tx;
        GameState.CAM.y = GameState.CAM.ty;
        GameState.CAM.z = GameState.CAM.tz;
      }
      return;
    }

    cine.timer += dt;
    this.timer = cine.timer;
    const t = cine.timer;
    const P = GameState.P;
    const CAM = GameState.CAM;
    if (!P) return;

    // ───────────────────────────────────────────────────────────
    // PHASE 1: PURE BLACK INTRO (0.00 – 2.00s)
    // ───────────────────────────────────────────────────────────
    if (t < SHATTERED_MIND_TIMELINE.BLACK_INTRO) {
      this.shotIndex = 1;
      P.cinematicPose = 'hidden';
      if (CAM) {
        CAM.tx = cine.savedPlayerState.x;
        CAM.ty = cine.savedPlayerState.y;
        CAM.tz = 1.0;
        CAM.shk = 0;
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 2: THE APPROVED RED PIXEL EYE (2.00 – 3.80s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.RED_EYE) {
      this.shotIndex = 2;
      P.cinematicPose = 'hidden';

      if (!cine.soundCues.redEye1) {
        cine.soundCues.redEye1 = true;
        SoundManager.playTone(55, 'sawtooth', 1.8, 0.28, 38);
        SoundManager.snd('void_swell');
        if (MusicManager) {
          MusicManager.fadeIn('shatteredMind', 2.2, 0.72);
        }
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 3: STRANGE DUNGEON ARENA & CENTRAL EYE (3.80 – 9.20s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.EMPTY_ARENA) {
      this.shotIndex = 3;
      const arenaT = t - SHATTERED_MIND_TIMELINE.RED_EYE;
      const arenaDuration = SHATTERED_MIND_TIMELINE.EMPTY_ARENA - SHATTERED_MIND_TIMELINE.RED_EYE;
      const arenaProgress = Math.min(1.0, arenaT / arenaDuration);

      // Rowan stands grounded in foreground facing the eye
      P.cinematicPose = null;
      P.x = cine.roomCenterX;
      P.y = cine.roomCenterY + 1.2;
      P.fx = 0;
      P.fy = -1;
      P.weaponLowered = false;
      P.animState = 'idle';

      // Slow cinematic camera push toward the eye
      if (CAM) {
        CAM.tx = cine.roomCenterX;
        CAM.ty = (cine.roomCenterY - 0.8) + (1.0 - arenaProgress) * 0.9;
        CAM.tz = 1.08 + arenaProgress * 0.16;
      }

      if (!cine.soundCues.arenaWhoosh) {
        cine.soundCues.arenaWhoosh = true;
        SoundManager.playTone(70, 'sine', 3.5, 0.22, 50);
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 4: FIRST MEMORY FLASH — WORD BY WORD (9.20 – 14.20s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.MEMORY_FLASH_1) {
      this.shotIndex = 4;
      P.cinematicPose = 'hidden';

      if (!cine.soundCues.memoryWord1) {
        cine.soundCues.memoryWord1 = true;
        SoundManager.playTone(180, 'triangle', 0.25, 0.25, 120);
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 5: PEACEFUL FOREST / CAMPFIRE MEMORY (14.20 – 21.00s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.CAMPFIRE_MEMORY) {
      this.shotIndex = 5;
      const campT = t - SHATTERED_MIND_TIMELINE.MEMORY_FLASH_1;

      // Rowan stands observing the campfire with lowered weapon
      P.cinematicPose = null;
      P.x = cine.roomCenterX - 1.8;
      P.y = cine.roomCenterY + 1.2;
      P.fx = 1;
      P.fy = -0.5;
      P.weaponLowered = true;
      P.animState = 'idle';

      // Camera gently drifts across the meadow
      if (CAM) {
        const drift = Math.sin(campT * 0.35) * 0.4;
        CAM.tx = cine.roomCenterX + drift;
        CAM.ty = cine.roomCenterY;
        CAM.tz = 1.15;
      }

      // Update companion animations
      cine.campfire.deserters.forEach(d => {
        d.animTimer += dt;
      });

      // Spawn campfire sparks
      if (Math.random() < 0.28) {
        cine.campfire.sparks.push({
          x: cine.roomCenterX + (Math.random() - 0.5) * 0.5,
          y: cine.roomCenterY - 0.2,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.6 - Math.random() * 0.5,
          life: 1.0,
          col: Math.random() < 0.5 ? '#fef08a' : '#f97316'
        });
      }

      // Update sparks
      for (let i = cine.campfire.sparks.length - 1; i >= 0; i--) {
        const s = cine.campfire.sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt * 1.1;
        if (s.life <= 0) cine.campfire.sparks.splice(i, 1);
      }

      if (!cine.soundCues.campfirePeace) {
        cine.soundCues.campfirePeace = true;
        SoundManager.playTone(220, 'sine', 2.0, 0.15, 260);
        if (MusicManager) {
          MusicManager.setMasterVolume(0.48); // Gently duck music for peaceful campfire memory
        }
      }

      // Campfire crackle SFX
      cine.campfireCrackleTimer = (cine.campfireCrackleTimer || 0) + dt;
      if (cine.campfireCrackleTimer > 0.45) {
        cine.campfireCrackleTimer = 0;
        if (Math.random() < 0.65) SoundManager.snd('campfire_crackle');
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 6: EYE INTERRUPTION & WORD-BY-WORD SECOND MESSAGE (21.00 – 27.20s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.EYE_FLASH_2) {
      this.shotIndex = 6;
      P.cinematicPose = 'hidden';

      if (!cine.soundCues.eyeInterrupt) {
        cine.soundCues.eyeInterrupt = true;
        SoundManager.snd('impact_hit');
        SoundManager.snd('reality_snap');
        SoundManager.snd('eye_awaken');
        SoundManager.playTone(45, 'sawtooth', 1.8, 0.35, 30);
        if (MusicManager) {
          MusicManager.setMasterVolume(0.80); // Surge back into full dramatic volume
        }
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 7: PEACE → BATTLEFIELD TRANSFORMATION (27.20 – 33.50s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.TRANSFORMATION) {
      this.shotIndex = 7;
      const transT = t - SHATTERED_MIND_TIMELINE.EYE_FLASH_2;
      const transProg = Math.min(1.0, transT / (SHATTERED_MIND_TIMELINE.TRANSFORMATION - SHATTERED_MIND_TIMELINE.EYE_FLASH_2));

      P.cinematicPose = null;
      P.x = cine.roomCenterX - 1.8;
      P.y = cine.roomCenterY + 1.2;
      P.fx = 1;
      P.fy = -0.5;
      P.weaponLowered = transProg < 0.6; // Rowan raises weapon in alarm

      if (CAM) {
        CAM.tx = cine.roomCenterX;
        CAM.ty = cine.roomCenterY;
        CAM.tz = 1.16;
      }

      // Freeze companion animations progressively
      const freeze = transProg > 0.35;
      cine.campfire.deserters.forEach(d => {
        if (!freeze) d.animTimer += dt * (1.0 - transProg);
      });

      if (!cine.soundCues.transRumble && transProg > 0.4) {
        cine.soundCues.transRumble = true;
        SoundManager.playTone(38, 'sawtooth', 2.5, 0.28, 28);
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 8: BURNING FOREST + BATTLEFIELD + DISSOLVING BODIES (33.50 – 41.00s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.BATTLEFIELD_FIRE) {
      this.shotIndex = 8;
      const fireT = t - SHATTERED_MIND_TIMELINE.TRANSFORMATION;

      P.cinematicPose = null;
      P.x = cine.roomCenterX - 1.8;
      P.y = cine.roomCenterY + 1.2;
      P.fx = 1;
      P.fy = -0.5;
      P.weaponLowered = false;

      if (CAM) {
        CAM.tx = cine.roomCenterX + Math.sin(fireT * 0.3) * 0.3;
        CAM.ty = cine.roomCenterY;
        CAM.tz = 1.18;
      }

      // Progressively ignite trees based on their individual delays
      cine.campClearing.trees.forEach(tr => {
        if (fireT >= tr.fireIgniteDelay) {
          tr.fireStage = Math.min(1.0, (fireT - tr.fireIgniteDelay) / 2.2);
        }
      });

      // Staggered companion dissolution (7-stage ash dispersal across individuals)
      const dissStartDelays = [3.2, 2.2, 4.0]; // Companion 1 (north) dissolves first, then 0 (log), then 2 (south)
      const dissDuration = 2.4;

      cine.campfire.deserters.forEach((d, idx) => {
        const startT = dissStartDelays[idx];
        let dissProg = 0;
        if (fireT >= startT) {
          dissProg = Math.min(1.0, (fireT - startT) / dissDuration);
        }

        // Alpha calculation: grounded initially, then progressive loss of coherence to 0
        const alpha = Math.max(0, 1.0 - dissProg);
        cine.battlefield.corpseAlphas[idx] = alpha;

        // Controlled fine ash pixel emission (never overwhelming, small 1-2px scale)
        if (dissProg > 0.15 && dissProg < 0.95 && Math.random() < 0.38) {
          const bodyColors = idx === 0
            ? ['#1e3a5f', '#2563eb', '#334155', '#475569', '#1c1917']
            : idx === 1
            ? ['#3f2e22', '#5c4033', '#1e293b', '#475569', '#1c1917']
            : ['#3f2e22', '#4a382a', '#1e293b', '#475569', '#1c1917'];

          cine.battlefield.dissolveParticles.push({
            x: cine.roomCenterX + d.xOffset + (Math.random() - 0.5) * 0.45,
            y: cine.roomCenterY + d.yOffset + (Math.random() - 0.5) * 0.25,
            vx: (Math.random() - 0.5) * 0.22,
            vy: -0.35 - Math.random() * 0.45,
            r: 1.0 + Math.random() * 0.9, // 1 to 2px
            life: 0.9 + Math.random() * 0.4,
            maxLife: 1.3,
            col: bodyColors[Math.floor(Math.random() * bodyColors.length)]
          });
        }
      });

      // Update fine ash dissolution motes
      for (let i = cine.battlefield.dissolveParticles.length - 1; i >= 0; i--) {
        const p = cine.battlefield.dissolveParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) cine.battlefield.dissolveParticles.splice(i, 1);
      }

      if (!cine.soundCues.fireCrackling) {
        cine.soundCues.fireCrackling = true;
        SoundManager.playTone(85, 'sawtooth', 3.0, 0.22, 60);
        SoundManager.snd('battlefield_roar');
        if (MusicManager) {
          MusicManager.setMasterVolume(0.82); // Peak intensity
        }
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 9: HARD SNAP BACK TO REAL DUNGEON & QUIET BEAT (41.00 – 42.50s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.RETURN_DUNGEON_SNAP) {
      this.shotIndex = 9;

      if (!cine.soundCues.returnSnap) {
        cine.soundCues.returnSnap = true;
        SoundManager.snd('heartbeat');
        SoundManager.snd('sanity_drone');
        if (MusicManager) {
          MusicManager.setMasterVolume(0.55); // Desolate pulling back as world dissolves
        }
      }

      // Rowan stands in his exact real dungeon position
      P.cinematicPose = null;
      P.x = cine.savedPlayerState.x;
      P.y = cine.savedPlayerState.y;
      P.fx = cine.savedPlayerState.fx;
      P.fy = cine.savedPlayerState.fy;
      P.weaponLowered = false;
      P.animState = 'idle';

      if (CAM) {
        CAM.tx = cine.savedPlayerState.x;
        CAM.ty = cine.savedPlayerState.y;
        CAM.tz = 1.15;
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 10: WORLD-SPACE BLACK FOG ERASURE (42.50 – 51.50s)
    // ───────────────────────────────────────────────────────────
    else if (t < SHATTERED_MIND_TIMELINE.BLACK_FOG) {
      this.shotIndex = 10;
      const fogT = t - SHATTERED_MIND_TIMELINE.RETURN_DUNGEON_SNAP;
      const fogDuration = SHATTERED_MIND_TIMELINE.BLACK_FOG - SHATTERED_MIND_TIMELINE.RETURN_DUNGEON_SNAP;
      const expandProgress = Math.min(1.0, fogT / fogDuration);

      P.cinematicPose = null;
      P.x = cine.savedPlayerState.x;
      P.y = cine.savedPlayerState.y;
      P.fx = cine.savedPlayerState.fx;
      P.fy = cine.savedPlayerState.fy;
      P.weaponLowered = false;

      // Smooth outward expansion from dungeon player position
      cine.fog.centerX = cine.savedPlayerState.x;
      cine.fog.centerY = cine.savedPlayerState.y;
      cine.fog.radius = cine.fog.maxRadius * Math.pow(expandProgress, 1.25);

      // Camera slowly pulls outward to reveal entire floor consumed
      if (CAM) {
        CAM.tx = cine.savedPlayerState.x;
        CAM.ty = cine.savedPlayerState.y;
        CAM.tz = 1.15 - expandProgress * 0.28;
      }

      if (!cine.soundCues.fogRumble) {
        cine.soundCues.fogRumble = true;
        SoundManager.playTone(32, 'sawtooth', 3.5, 0.32, 24);
      }

      // Consume real enemies within the fog radius (no XP, loot, or callbacks)
      if (GameState.ENE) {
        GameState.ENE.forEach(e => {
          if (!e.cinematicConsumed) {
            const dist = Math.hypot(e.x - cine.fog.centerX, e.y - cine.fog.centerY);
            if (dist <= cine.fog.radius) {
              e.fogConsumeTimer = (e.fogConsumeTimer || 0) + dt;
              e.fogConsumeAlpha = Math.max(0, 1.0 - (e.fogConsumeTimer / 0.8));
              if (e.fogConsumeAlpha <= 0) {
                e.cinematicConsumed = true;
                e.alive = false;
                e.vx = 0;
                e.vy = 0;
              }
            }
          }
        });
      }

      // Consume real boss if present
      if (GameState.BOSS && !GameState.BOSS.cinematicConsumed) {
        const b = GameState.BOSS;
        const dist = Math.hypot(b.x - cine.fog.centerX, b.y - cine.fog.centerY);
        if (dist <= cine.fog.radius) {
          b.fogConsumeTimer = (b.fogConsumeTimer || 0) + dt;
          b.fogConsumeAlpha = Math.max(0, 1.0 - (b.fogConsumeTimer / 1.2));
          if (b.fogConsumeAlpha <= 0) {
            b.cinematicConsumed = true;
            b.alive = false;
            b.vx = 0;
            b.vy = 0;
            b.attacks = [];
            b.voidPressureZone = null;
            GameState.BOSS_AI_ACTIVE = false;
            GameState.PROJECTILES = [];
            GameState.BOSS_PROJECTILES = [];
            GameState.BOSS_HAZARDS = [];
            GameState.ACTIVE_MINIBOSS = null;
          }
        }
      }
    }

    // ───────────────────────────────────────────────────────────
    // PHASE 11: FINAL BLACK SILENCE & STANDALONE TITLE (51.50s+)
    // ───────────────────────────────────────────────────────────
    else {
      this.shotIndex = 11;
      P.cinematicPose = 'hidden';

      if (!cine.soundCues.endCardMusic) {
        cine.soundCues.endCardMusic = true;
        if (MusicManager) {
          MusicManager.setMasterVolume(0.65); // Somber reflective volume
        }
      }

      // Title fades in after 2 seconds of silence (at 53.50s)
      if (t >= SHATTERED_MIND_TIMELINE.FINAL_BLACK) {
        const titleT = t - SHATTERED_MIND_TIMELINE.FINAL_BLACK;
        cine.titleAlpha = Math.min(1.0, titleT / 1.8);
      }

      // Buttons only fade in after standalone title breathes (at 57.50s)
      if (t >= SHATTERED_MIND_TIMELINE.TITLE_STANDALONE) {
        const btnT = t - SHATTERED_MIND_TIMELINE.TITLE_STANDALONE;
        cine.buttonsAlpha = Math.min(1.0, btnT / 1.2);
        this.finished = true;
        this._onOutcomeCompleted();
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. DRAW WORLD ENTITIES (Inside Camera.apply — World Coordinates)
  // ─────────────────────────────────────────────────────────────
  drawWorldEntities(ctx) {
    if (!this.active || !_activeCinematic) return;
    const cine = _activeCinematic;
    const t = cine.timer;

    // ───────────────────────────────────────────────────────────
    // A. Strange Dungeon Arena & Central Eye (Phase 3)
    // ───────────────────────────────────────────────────────────
    if (t >= SHATTERED_MIND_TIMELINE.RED_EYE && t < SHATTERED_MIND_TIMELINE.EMPTY_ARENA) {
      ctx.save();
      _renderStrangeArena(ctx, cine.strangeArena, t);

      // Central approved pixel eye naturally hovering in chamber
      const eyeCX = cine.roomCenterX * T;
      const eyeCY = (cine.roomCenterY - 2.8) * T;
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.04;
      _drawPixelEye(ctx, eyeCX, eyeCY, 2.8 * pulse, 0, t);

      // Rowan standing grounded in foreground watching the eye
      CharacterRenderer.drawPlayer(ctx, { isShatteredMindDraw: true });
      ctx.restore();
    }

    // ───────────────────────────────────────────────────────────
    // B. Peaceful Forest Clearing / Campfire Memory (Phase 5)
    // ───────────────────────────────────────────────────────────
    if (t >= SHATTERED_MIND_TIMELINE.MEMORY_FLASH_1 && t < SHATTERED_MIND_TIMELINE.EYE_FLASH_2) {
      ctx.save();
      _renderForestFloor(ctx, cine.campClearing, 0);

      // Background & midground pine trees
      cine.campClearing.trees.forEach(tr => {
        _drawPineTree(ctx, tr, t, false, 0);
      });

      // Campfire at center
      const firePx = (cine.roomCenterX + 0.5) * T;
      const firePy = (cine.roomCenterY + 0.5) * T;
      _drawCampfire(ctx, firePx, firePy, t, false);

      // Rising sparks
      cine.campfire.sparks.forEach(s => {
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.col;
        ctx.fillRect(Math.round(s.x * T) - 1, Math.round(s.y * T) - 1, 2, 2);
      });
      ctx.globalAlpha = 1.0;

      // Companions enjoying campfire
      cine.campfire.deserters.forEach(d => {
        const dx = (cine.roomCenterX + d.xOffset + 0.5) * T;
        const dy = (cine.roomCenterY + d.yOffset + 0.5) * T;
        _drawCompanion(ctx, dx, dy, d.pose, d.facing, d.animTimer, 1.0, false);
      });

      // Rowan observing peacefully
      CharacterRenderer.drawPlayer(ctx, { isShatteredMindDraw: true });
      ctx.restore();
    }

    // ───────────────────────────────────────────────────────────
    // C. Peace → Battlefield Transformation (Phase 7)
    // ───────────────────────────────────────────────────────────
    if (t >= SHATTERED_MIND_TIMELINE.EYE_FLASH_2 && t < SHATTERED_MIND_TIMELINE.TRANSFORMATION) {
      ctx.save();
      const transT = t - SHATTERED_MIND_TIMELINE.EYE_FLASH_2;
      const transProg = Math.min(1.0, transT / (SHATTERED_MIND_TIMELINE.TRANSFORMATION - SHATTERED_MIND_TIMELINE.EYE_FLASH_2));

      _renderForestFloor(ctx, cine.campClearing, transProg);

      // Pine trees
      cine.campClearing.trees.forEach(tr => {
        _drawPineTree(ctx, tr, t, false, 0);
      });

      // Campfire transitions from dying flame to cold ash
      const firePx = (cine.roomCenterX + 0.5) * T;
      const firePy = (cine.roomCenterY + 0.5) * T;
      _drawCampfire(ctx, firePx, firePy, t, transProg > 0.7);

      // Companions freeze and collapse as memory corrupts
      cine.campfire.deserters.forEach((d, idx) => {
        const dx = (cine.roomCenterX + d.xOffset + 0.5) * T;
        const dy = (cine.roomCenterY + d.yOffset + 0.5) * T;
        if (transProg < 0.70) {
          _drawCompanion(ctx, dx, dy, d.pose, d.facing, d.animTimer, 1.0, transProg > 0.35);
        } else if (transProg < 0.85) {
          // Tragic crossfade as companions shudder to the ground
          const f = (transProg - 0.70) / 0.15;
          ctx.save();
          ctx.globalAlpha = 1.0 - f;
          _drawCompanion(ctx, dx, dy, d.pose, d.facing, d.animTimer, 1.0, true);
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = f;
          _drawCorpse(ctx, dx, dy, idx, 1.0, t);
          ctx.restore();
        } else {
          _drawCorpse(ctx, dx, dy, idx, 1.0, t);
        }
      });

      CharacterRenderer.drawPlayer(ctx, { isShatteredMindDraw: true });
      ctx.restore();
    }

    // ───────────────────────────────────────────────────────────
    // D. Burning Forest + Battlefield + Dissolving Bodies (Phase 8)
    // ───────────────────────────────────────────────────────────
    if (t >= SHATTERED_MIND_TIMELINE.TRANSFORMATION && t < SHATTERED_MIND_TIMELINE.BATTLEFIELD_FIRE) {
      ctx.save();
      _renderForestFloor(ctx, cine.campClearing, 1.0);

      // Burning pine trees (locked approved animation)
      cine.campClearing.trees.forEach(tr => {
        _drawPineTree(ctx, tr, t, tr.fireStage > 0, tr.fireStage);
      });

      // Cold collapsed campfire
      const firePx = (cine.roomCenterX + 0.5) * T;
      const firePy = (cine.roomCenterY + 0.5) * T;
      _drawCampfire(ctx, firePx, firePy, t, true);

      // Broken battlefield weapons
      _drawBrokenWeapon(ctx, (cine.roomCenterX - 2.8) * T, (cine.roomCenterY - 1.2) * T, 'spear');
      _drawBrokenWeapon(ctx, (cine.roomCenterX + 2.8) * T, (cine.roomCenterY + 1.0) * T, 'sword');
      _drawBrokenWeapon(ctx, (cine.roomCenterX + 2.2) * T, (cine.roomCenterY - 1.8) * T, 'shield');

      // Fallen bodies with progressive 7-stage dissolution alpha
      cine.campfire.deserters.forEach((d, idx) => {
        const dx = (cine.roomCenterX + d.xOffset + 0.5) * T;
        const dy = (cine.roomCenterY + d.yOffset + 0.5) * T;
        const alpha = cine.battlefield.corpseAlphas[idx];
        if (alpha > 0) {
          _drawCorpse(ctx, dx, dy, idx, alpha, t);
        }
      });

      // Controlled fine ash dissolution particles
      cine.battlefield.dissolveParticles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life * 0.85);
        ctx.fillStyle = p.col;
        const pr = Math.max(1, Math.round(p.r));
        ctx.fillRect(Math.round(p.x * T) - pr, Math.round(p.y * T) - pr, pr * 2, pr * 2);
      });
      ctx.globalAlpha = 1.0;

      // Rowan witnessing the destruction
      CharacterRenderer.drawPlayer(ctx, { isShatteredMindDraw: true });
      ctx.restore();
    }

    // ───────────────────────────────────────────────────────────
    // E. Real Dungeon Fog Expansion (Phase 10)
    // ───────────────────────────────────────────────────────────
    if (t >= SHATTERED_MIND_TIMELINE.RETURN_DUNGEON_SNAP && t < SHATTERED_MIND_TIMELINE.BLACK_FOG) {
      if (cine.fog.radius > 0.5) {
        ctx.save();
        const fR = cine.fog.radius * T;
        const fCX = cine.fog.centerX * T;
        const fCY = cine.fog.centerY * T;

        // Solid expanding black circle consuming dungeon world
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(fCX, fCY, fR, 0, Math.PI * 2);
        ctx.fill();

        // Subtle dark purple edge border
        ctx.strokeStyle = 'rgba(88, 28, 135, 0.45)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 4. DRAW (Screen-Space Canvas Overlays & Word-by-Word Editing)
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!this.active || !_activeCinematic) return;
    const cine = _activeCinematic;
    const t = cine.timer;

    // ───────────────────────────────────────────────────────────
    // Phase 1: Pure Black Intro (0.00 – 2.00s)
    // ───────────────────────────────────────────────────────────
    if (t < SHATTERED_MIND_TIMELINE.BLACK_INTRO) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);
      return;
    }

    // ───────────────────────────────────────────────────────────
    // Phase 2: The Approved Red Pixel Eye (2.00 – 3.80s)
    // ───────────────────────────────────────────────────────────
    if (t < SHATTERED_MIND_TIMELINE.RED_EYE) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);

      const eyeT = t - SHATTERED_MIND_TIMELINE.BLACK_INTRO;
      const cx = LW / 2;
      const cy = LH / 2;

      // Eye blinks between 1.00s and 1.35s
      let blinkProg = 0;
      if (eyeT >= 1.00 && eyeT <= 1.35) {
        blinkProg = Math.sin(((eyeT - 1.00) / 0.35) * Math.PI);
      }

      _drawPixelEye(ctx, cx, cy, 2.0, blinkProg, t);
      return;
    }

    // ───────────────────────────────────────────────────────────
    // Phase 4: First Memory Flash — WORD BY WORD (9.20 – 14.20s)
    // "YOU WERE NEVER TRAPPED INSIDE."
    // ───────────────────────────────────────────────────────────
    if (t >= SHATTERED_MIND_TIMELINE.EMPTY_ARENA && t < SHATTERED_MIND_TIMELINE.MEMORY_FLASH_1) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);

      const relT = t - SHATTERED_MIND_TIMELINE.EMPTY_ARENA;

      // Word-by-word editing schedule:
      // YOU: 0.00-0.50 | gap: 0.50-0.65
      // WERE: 0.65-1.15 | gap: 1.15-1.30
      // NEVER: 1.30-1.80 | gap: 1.80-1.95
      // TRAPPED: 1.95-2.55 | gap: 2.55-2.70
      // INSIDE: 2.70-3.45 | gap: 3.45-3.70
      // Assembled: 3.70-4.30 | black hold: 4.30-5.00
      let activeWord = '';
      if (relT >= 0.00 && relT < 0.50) activeWord = 'YOU';
      else if (relT >= 0.65 && relT < 1.15) activeWord = 'WERE';
      else if (relT >= 1.30 && relT < 1.80) activeWord = 'NEVER';
      else if (relT >= 1.95 && relT < 2.55) activeWord = 'TRAPPED';
      else if (relT >= 2.70 && relT < 3.45) activeWord = 'INSIDE';
      else if (relT >= 3.70 && relT < 4.30) activeWord = 'YOU WERE NEVER TRAPPED INSIDE.';

      if (activeWord) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = activeWord.includes(' ') ? '600 20px Cinzel, "Cinematic Serif", serif' : '700 28px Cinzel, "Cinematic Serif", serif';
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 14;
        ctx.fillText(activeWord, LW / 2, LH / 2);
        ctx.restore();
      }
      return;
    }

    // ───────────────────────────────────────────────────────────
    // Phase 6: Eye Interruption & Word-by-Word Second Message (21.00 – 27.20s)
    // "ILLUSIONS CAN BE DECEIVING. BEHOLD THE REALITY."
    // ───────────────────────────────────────────────────────────
    if (t >= SHATTERED_MIND_TIMELINE.CAMPFIRE_MEMORY && t < SHATTERED_MIND_TIMELINE.EYE_FLASH_2) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);

      const relT = t - SHATTERED_MIND_TIMELINE.CAMPFIRE_MEMORY;

      // 0.00 – 0.40s: Brief sudden approved red pixel eye flash
      if (relT < 0.40) {
        ctx.save();
        const flashAlpha = Math.max(0, 1.0 - relT / 0.40);
        ctx.globalAlpha = flashAlpha;
        _drawPixelEye(ctx, LW / 2, LH / 2, 2.5, 0, t);
        ctx.restore();
        return;
      }

      // Word-by-word editing schedule for second revelation:
      // ILLUSIONS: 0.45-0.95 | gap: 0.95-1.10
      // CAN: 1.10-1.50 | gap: 1.50-1.65
      // BE: 1.65-2.05 | gap: 2.05-2.20
      // DECEIVING: 2.20-2.75 | gap: 2.75-2.90
      // BEHOLD: 2.90-3.40 | gap: 3.40-3.55
      // THE: 3.55-3.95 | gap: 3.95-4.10
      // REALITY: 4.10-4.85 | gap: 4.85-5.10
      // Full phrase: 5.10-5.85 | silence: 5.85-6.20
      let word = '';
      if (relT >= 0.45 && relT < 0.95) word = 'ILLUSIONS';
      else if (relT >= 1.10 && relT < 1.50) word = 'CAN';
      else if (relT >= 1.65 && relT < 2.05) word = 'BE';
      else if (relT >= 2.20 && relT < 2.75) word = 'DECEIVING';
      else if (relT >= 2.90 && relT < 3.40) word = 'BEHOLD';
      else if (relT >= 3.55 && relT < 3.95) word = 'THE';
      else if (relT >= 4.10 && relT < 4.85) word = 'REALITY';
      else if (relT >= 5.10 && relT < 5.85) word = 'ILLUSIONS CAN BE DECEIVING. BEHOLD THE REALITY.';

      if (word) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = word.includes(' ') ? '600 19px Cinzel, "Cinematic Serif", serif' : '700 27px Cinzel, "Cinematic Serif", serif';
        ctx.fillStyle = (word === 'REALITY' || word.includes('REALITY')) ? '#f87171' : '#e2e8f0';
        ctx.shadowColor = (word === 'REALITY' || word.includes('REALITY')) ? '#ef4444' : '#9333ea';
        ctx.shadowBlur = 14;
        ctx.fillText(word, LW / 2, LH / 2);
        ctx.restore();
      }
      return;
    }

    // ───────────────────────────────────────────────────────────
    // Phase 11: Total Black & Standalone SHATTERED MIND Title (51.50s+)
    // ───────────────────────────────────────────────────────────
    if (t >= SHATTERED_MIND_TIMELINE.BLACK_FOG) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);

      if (t >= SHATTERED_MIND_TIMELINE.FINAL_BLACK) {
        this._drawShatteredMindEndCard(ctx, cine.titleAlpha, cine.buttonsAlpha);
      }
      return;
    }

    // ───────────────────────────────────────────────────────────
    // Common Cinematic Framing: Letterbox Bars & Skip Prompt
    // ───────────────────────────────────────────────────────────
    this._drawLetterbox(ctx);

    if (this.canSkip() && CinematicSafety.shouldShowSkipHint()) {
      ctx.save();
      ctx.font = '11px Cinzel, serif';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.textAlign = 'right';
      ctx.fillText(CinematicSafety.isReplay() ? 'ESC / CLICK TO EXIT ARCHIVE' : 'SPACE / CLICK TO SKIP', LW - 24, LH - 16);
      ctx.restore();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 5. CINEMATIC UI: 2.39:1 LETTERBOX & STANDALONE END CARD
  // ─────────────────────────────────────────────────────────────
  _drawLetterbox(ctx) {
    const barHeight = Math.round((LH - (LW / (2.39))) / 2);
    const finalH = Math.max(28, barHeight);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, LW, finalH);
    ctx.fillRect(0, LH - finalH, LW, finalH);
  },

  _drawShatteredMindEndCard(ctx, titleAlpha, buttonsAlpha) {
    const cx = LW / 2;
    const cy = LH / 2;

    // A. Solitary Standalone Title (breathes on screen first)
    if (titleAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Subtle crimson/purple breathing glow
      const glow = Math.sin(this.timer * 2.0) * 4;
      ctx.font = '700 36px Cinzel, "Cinematic Serif", serif';
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 16 + glow;
      ctx.fillText('SHATTERED MIND', cx, cy - 20);
      ctx.restore();
    }

    // B. Subtitle, Quote, and Interactive Buttons (fade in after standalone title)
    if (buttonsAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = buttonsAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Subtitle
      ctx.font = '600 12px Cinzel, serif';
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#7e22ce';
      ctx.shadowBlur = 8;
      ctx.fillText('— CONSUMED BY THE ABYSS —', cx, cy + 16);

      // Quote
      ctx.font = 'italic 12px "Crimson Text", Georgia, serif';
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText('"The dungeon was not a prison. It was a mirror."', cx, cy + 44);

      // Interactive Buttons
      const cine = _activeCinematic;
      const btnW = 220;
      const btnH = 34;
      const btnX = cx - btnW / 2;
      const btnY1 = cy + 82;
      const btnY2 = cy + 126;

      const sel = cine ? cine.selectedButtonIndex : 0;

      // Button 1: RESTART RUN [ R ]
      ctx.fillStyle = sel === 0 ? 'rgba(88, 28, 135, 0.45)' : 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(btnX, btnY1, btnW, btnH);
      ctx.strokeStyle = sel === 0 ? '#c084fc' : 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = sel === 0 ? 1.8 : 1.0;
      ctx.strokeRect(btnX, btnY1, btnW, btnH);

      ctx.font = '600 11px Cinzel, serif';
      ctx.fillStyle = sel === 0 ? '#ffffff' : '#cbd5e1';
      ctx.fillText('RESTART RUN [ R ]', cx, btnY1 + btnH / 2);

      // Button 2: RETURN TO TITLE [ ESC ]
      ctx.fillStyle = sel === 1 ? 'rgba(88, 28, 135, 0.45)' : 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(btnX, btnY2, btnW, btnH);
      ctx.strokeStyle = sel === 1 ? '#c084fc' : 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = sel === 1 ? 1.8 : 1.0;
      ctx.strokeRect(btnX, btnY2, btnW, btnH);

      ctx.fillStyle = sel === 1 ? '#ffffff' : '#cbd5e1';
      ctx.fillText('RETURN TO TITLE [ ESC ]', cx, btnY2 + btnH / 2);

      ctx.restore();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 6. INPUT & ACTION HANDLERS
  // ─────────────────────────────────────────────────────────────
  handleKey(key) {
    if (!this.isActive() && GameState.STATE !== GameStates.DEATH_SANITY && GameState.STATE !== GameStates.DEATH_RESULTS) return false;
    const cine = _activeCinematic;

    // ESCAPE key: if replay, immediately return to archive; if running, skip if permitted; or return to title if on end card
    if (key === 'Escape') {
      if (CinematicSafety.isReplay()) {
        this.reset();
        CinematicSafety.finishReplay();
        return true;
      }
      if (this.isFinished() || GameState.STATE === GameStates.DEATH_RESULTS) {
        this.returnToMainMenu();
      } else if (CinematicSafety.canSkip()) {
        this.skip();
      }
      return true;
    }

    // During active cinematic: Space or Enter skips ONLY if allowed by CinematicSafety
    if (!this.isFinished() && GameState.STATE !== GameStates.DEATH_RESULTS) {
      if (key === 'Enter' || key === ' ' || key === 'Space') {
        if (CinematicSafety.isValidSkipKey(key)) {
          this.skip();
        }
        return true;
      }
      return true; // Consume any other key so gameplay buffers or shortcuts don't fire
    }

    // On final end card:
    if (this.isFinished() || GameState.STATE === GameStates.DEATH_RESULTS) {
      if (CinematicSafety.isReplay()) {
        if (key === 'Escape' || key === 'Enter' || key === ' ') {
          this.reset();
          CinematicSafety.finishReplay();
          return true;
        }
      }
      if (key === 'ArrowUp' || key === 'KeyW' || key === 'w' || key === 'W') {
        if (cine) cine.selectedButtonIndex = 0;
        SoundManager.snd('menu_hover');
        return true;
      }
      if (key === 'ArrowDown' || key === 'KeyS' || key === 's' || key === 'S') {
        if (cine) cine.selectedButtonIndex = 1;
        SoundManager.snd('menu_hover');
        return true;
      }
      if (key === 'Enter' || key === ' ') {
        if (!cine || cine.selectedButtonIndex === 0) {
          this.restartRun();
        } else {
          this.returnToMainMenu();
        }
        return true;
      }
      if (key === 'KeyR' || key === 'r' || key === 'R') {
        this.restartRun();
        return true;
      }
    }

    return true; // Consume inputs during cinematic
  },

  handleClick(mx, my) {
    if (!this.isActive() && GameState.STATE !== GameStates.DEATH_SANITY && GameState.STATE !== GameStates.DEATH_RESULTS) return false;

    // If cinematic is active and not yet finished:
    if (!this.isFinished() && GameState.STATE !== GameStates.DEATH_RESULTS) {
      if (CinematicSafety.isValidSkipClick()) {
        this.skip();
      }
      return true; // Always consume clicks during active cinematic
    }

    if (CinematicSafety.isReplay()) {
      this.reset();
      CinematicSafety.finishReplay();
      return true;
    }

    // If buttons are active on end card:
    const cx = LW / 2;
    const cy = LH / 2;
    const btnW = 220;
    const btnH = 34;
    const btnX = cx - btnW / 2;
    const btnY1 = cy + 82;
    const btnY2 = cy + 126;

    if (mx >= btnX && mx <= btnX + btnW && my >= btnY1 && my <= btnY1 + btnH) {
      this.restartRun();
      return true;
    }
    if (mx >= btnX && mx <= btnX + btnW && my >= btnY2 && my <= btnY2 + btnH) {
      this.returnToMainMenu();
      return true;
    }

    return false;
  },

  handleMouseMove(mx, my) {
    if (!this.isActive() || !this.isFinished()) return false;
    const cine = _activeCinematic;
    if (!cine) return false;

    const cx = LW / 2;
    const cy = LH / 2;
    const btnW = 220;
    const btnH = 34;
    const btnX = cx - btnW / 2;
    const btnY1 = cy + 82;
    const btnY2 = cy + 126;

    if (mx >= btnX && mx <= btnX + btnW && my >= btnY1 && my <= btnY1 + btnH) {
      if (cine.selectedButtonIndex !== 0) {
        cine.selectedButtonIndex = 0;
        SoundManager.snd('menu_hover');
      }
      return true;
    }
    if (mx >= btnX && mx <= btnX + btnW && my >= btnY2 && my <= btnY2 + btnH) {
      if (cine.selectedButtonIndex !== 1) {
        cine.selectedButtonIndex = 1;
        SoundManager.snd('menu_hover');
      }
      return true;
    }
    return false;
  },

  restartRun() {
    if (CinematicSafety.isReplay()) {
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }
    if (MusicManager) {
      MusicManager.fadeOut(0.8);
    }
    this.reset();
    RunResetManager.resetRun({ playIntro: false });
  },

  returnToMainMenu() {
    if (CinematicSafety.isReplay()) {
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }
    if (MusicManager) {
      MusicManager.crossfade('menu', 1.8, 0.70);
    }
    this.reset();
    quitToMainMenu();
  },

  canSkip() {
    return this.active && !this.finished && CinematicSafety.canSkip();
  },

  skip() {
    if (!this.active || this.finished) return;
    if (CinematicSafety.isReplay()) {
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }
    const cine = _activeCinematic;
    if (!cine) return;

    if (MusicManager) {
      MusicManager.play('shatteredMind', { loop: true, fade: 0.8, volume: 0.65 });
    }

    // Immediately advance to final title & end card
    cine.timer = SHATTERED_MIND_TIMELINE.TITLE_STANDALONE + 1.0;
    this.timer = cine.timer;
    cine.titleAlpha = 1.0;
    cine.buttonsAlpha = 1.0;
    this.finished = true;
    this.shotIndex = 11;
    this._onOutcomeCompleted();

    // Ensure entities are consumed
    if (GameState.ENE) {
      GameState.ENE.forEach(e => { e.alive = false; e.cinematicConsumed = true; });
    }
    if (GameState.BOSS) {
      GameState.BOSS.alive = false;
      GameState.BOSS.cinematicConsumed = true;
    }

    if (GameState.P) {
      GameState.P.cinematicPose = 'hidden';
    }

    SoundManager.snd('cinematic_reveal');
  }
};

// ─────────────────────────────────────────────────────────────
// Developer Debug & Testing Helpers
// ─────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.ShatteredMindCinematic = ShatteredMindCinematic;

  window.triggerShatteredMind = function(opts = {}) {
    ShatteredMindCinematic.reset();

    if (!GameState.P) {
      GameState.P = {
        x: 24, y: 16, fx: 1, fy: 0,
        san: 0, hp: 5, maxHp: 5,
        dead: false, dying: false,
        activeWeapon: opts.weapon || 'sword'
      };
    } else {
      GameState.P.san = 0;
      if (opts.weapon) GameState.P.activeWeapon = opts.weapon;
      if (opts.x !== undefined) GameState.P.x = opts.x;
      if (opts.y !== undefined) GameState.P.y = opts.y;
    }

    if (opts.boss) {
      GameState.BOSS = {
        id: typeof opts.boss === 'string' ? opts.boss : 'gorgaroth',
        x: GameState.P.x + 3.0,
        y: GameState.P.y,
        alive: true,
        hp: 500,
        maxHp: 500
      };
    } else if (opts.boss === false) {
      GameState.BOSS = null;
    }

    if (opts.enemies) {
      GameState.ENE = [
        { id: 'skel1', type: 'skeleton', x: GameState.P.x + 2.5, y: GameState.P.y - 1.5, alive: true, hp: 20 },
        { id: 'skel2', type: 'skeleton', x: GameState.P.x - 2.0, y: GameState.P.y + 1.8, alive: true, hp: 20 }
      ];
    } else if (opts.enemies === false) {
      GameState.ENE = [];
    }

    if (typeof window !== 'undefined' && window.DeathCinematics && window.DeathCinematics.startSanity) {
      window.DeathCinematics.startSanity();
    } else {
      GameState.STATE = GameStates.DEATH_SANITY;
      ShatteredMindCinematic.start({ isDebug: true });
    }
  };

  window.testShatteredMindShot = function(shotNum = 1, pause = false) {
    window.triggerShatteredMind();
    const cine = ShatteredMindCinematic.getActiveCinematic();
    if (!cine) return;

    const shotTimes = [
      0.80,   // 1: Pure Black Intro
      2.80,   // 2: The Approved Red Pixel Eye
      6.50,   // 3: Strange Dungeon Arena & Central Eye
      11.50,  // 4: Memory Flash 1 Word-by-Word
      17.50,  // 5: Peaceful Forest Clearing / Campfire Memory
      23.50,  // 6: Eye Interruption & Word-by-Word Revelation
      30.00,  // 7: Peace to Battlefield Transformation
      37.00,  // 8: Burning Forest & Dissolving Corpses
      41.80,  // 9: Snap Back to Real Dungeon
      47.00,  // 10: World-Space Black Fog Expansion
      54.50,  // 11: Standalone SHATTERED MIND Title
      58.00   // 12: Interactive End Card
    ];

    const targetTime = shotTimes[Math.max(0, Math.min(shotTimes.length - 1, shotNum - 1))];
    cine.timer = targetTime;
    cine.paused = !!pause;

    const isHiddenShot = (targetTime < 3.80) ||
      (targetTime >= 9.20 && targetTime < 14.20) ||
      (targetTime >= 21.00 && targetTime < 27.20) ||
      (targetTime >= 51.50);

    if (GameState.P) {
      GameState.P.cinematicPose = isHiddenShot ? 'hidden' : null;
      if (targetTime >= 3.80 && targetTime < 9.20) {
        GameState.P.x = cine.roomCenterX;
        GameState.P.y = cine.roomCenterY + 1.2;
        GameState.P.fx = 0;
        GameState.P.fy = -1;
        GameState.P.weaponLowered = false;
        if (GameState.CAM) {
          GameState.CAM.tx = cine.roomCenterX;
          GameState.CAM.ty = cine.roomCenterY - 0.8;
          GameState.CAM.tz = 1.15;
          GameState.CAM.x = cine.roomCenterX;
          GameState.CAM.y = cine.roomCenterY - 0.8;
          GameState.CAM.z = 1.15;
        }
      } else if (targetTime >= 14.20 && targetTime < 41.00) {
        GameState.P.x = cine.roomCenterX - 1.8;
        GameState.P.y = cine.roomCenterY + 1.2;
        GameState.P.fx = 1;
        GameState.P.fy = -0.5;
        GameState.P.weaponLowered = (targetTime < 27.20);
        if (GameState.CAM) {
          GameState.CAM.tx = cine.roomCenterX;
          GameState.CAM.ty = cine.roomCenterY;
          GameState.CAM.tz = 1.16;
          GameState.CAM.x = cine.roomCenterX;
          GameState.CAM.y = cine.roomCenterY;
          GameState.CAM.z = 1.16;
        }
      } else if (targetTime >= 41.00 && targetTime < 51.50) {
        GameState.P.x = cine.savedPlayerState.x;
        GameState.P.y = cine.savedPlayerState.y;
        GameState.P.fx = cine.savedPlayerState.fx;
        GameState.P.fy = cine.savedPlayerState.fy;
        if (GameState.CAM) {
          GameState.CAM.tx = cine.savedPlayerState.x;
          GameState.CAM.ty = cine.savedPlayerState.y;
          GameState.CAM.tz = 1.10;
          GameState.CAM.x = cine.savedPlayerState.x;
          GameState.CAM.y = cine.savedPlayerState.y;
          GameState.CAM.z = 1.10;
        }
        if (targetTime >= 42.50) {
          cine.fog.centerX = cine.savedPlayerState.x;
          cine.fog.centerY = cine.savedPlayerState.y;
          const fogProg = (targetTime - 42.50) / (51.50 - 42.50);
          cine.fog.radius = cine.fog.maxRadius * Math.pow(Math.min(1.0, fogProg), 1.25);
        }
      }
    }

    if (targetTime >= 51.50) {
      cine.titleAlpha = Math.min(1.0, (targetTime - 53.50) / 1.8);
      cine.buttonsAlpha = targetTime >= 57.50 ? 1.0 : 0.0;
    }

    if (MusicManager) {
      if (targetTime < 2.00) {
        MusicManager.stopImmediate();
      } else {
        const vol = (targetTime >= 14.20 && targetTime < 21.00) ? 0.48 :
                    (targetTime >= 21.00 && targetTime < 41.00) ? 0.80 :
                    (targetTime >= 41.00 && targetTime < 51.50) ? 0.55 : 0.65;
        MusicManager.play('shatteredMind', { loop: true, fade: 0.1, volume: vol });
        MusicManager.setMasterVolume(vol);
      }
    }
  };
}
