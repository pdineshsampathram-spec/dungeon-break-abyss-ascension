// =====================================================================
//  DUNGEON BREAK — js/cinematics/BetrayalCinematic.js
//  Authoritative Master Betrayal Ending Cinematic (Screenplay & Lore Direction)
//
//  STORY CANON:
//  - Rowan was abandoned by deserters and sealed inside a 10-floor dungeon.
//  - The dungeon was a deliberate crucible/trial designed by THE ABSOLUTE.
//  - The Absolute communicates through minds and memories, not a physical NPC.
//  - The Absolute instructed the King beforehand to eliminate Rowan upon return.
//  - Rescued survivors carry fragments of the Abyss in their damaged memories.
//    The Absolute whispers through those fragments. The more survivors brought back,
//    the larger the network of influenced minds becomes. They genuinely believe
//    Rowan is the threat that must be stopped.
//  - The betrayal is planned, tragic, and chilling.
//
//  SEQUENCE OF BEATS (65–85s total):
//  1. Rowan emerges from ancient dungeon portal into daylight (0.00 – 5.00s)
//  2. Rescued survivors physically emerge and follow pathway (5.00 – 11.00s)
//  3. King greets Rowan warmly as a hero (11.00 – 17.00s)
//  4. Rowan confronts King: "Why was I sealed down there?" (17.00 – 23.50s)
//  5. King avoids question; quiet tension; survivors go cold (23.50 – 27.50s)
//  6. King gives order: "Guards. Take him." (27.50 – 30.50s)
//  7. Physical combat burst: guards attack, Rowan parries & defeats them; guards dissolve (30.50 – 39.00s)
//  8. Survivors slowly gather behind Rowan, chanting "Traitor..." at King (39.00 – 45.50s)
//  9. Rowan approaches King; King waits calmly: "You don't understand..." (45.50 – 49.50s)
//  10. Trusted survivor suddenly thrusts sword through Rowan from behind (49.50 – 52.50s)
//  11. Rowan staggers, looks down at blade, whispers "Why?" (52.50 – 55.00s)
//  12. King reveals: "Because the Absolute commanded it..." + Abyss soul lore (55.00 – 63.50s)
//  13. Rowan collapses in realization that his rescue was the trap (63.50 – 67.00s)
//  14. Screen snaps to pure black (67.00 – 69.00s)
//  15. True hidden dungeon chamber revealed with central Red Eye (69.00 – 74.00s)
//  16. Final camera zoom onto Eye; whisper: "He still doesn't know..." (74.00 – 78.00s)
//  17. Eye blinks at 77.20s; snap to black at 77.60s; hold to Credits (77.60 – 81.00s)
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T, clamp, easeInOut } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { EventBus } from '../core/EventBus.js';
import { MusicManager } from '../audio/MusicManager.js';
import { AbyssDissolution } from '../systems/AbyssDissolution.js';
import { Credits } from './Credits.js';
import { EpilogueCinematic } from './EpilogueCinematic.js';
import { CinematicSafety } from './CinematicSafety.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { triggerHitStop } from '../combat/HitStop.js';

let _activeBetrayalCinematic = null;
let _betrayalFastForwarding = false;

function playSnd(name) {
  if (_betrayalFastForwarding) return;
  SoundManager.snd(name);
}

function smoothstep(x) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

// ─────────────────────────────────────────────────────────────
// COMBAT IMPACT & DIRECTIONAL BLOOD PARTICLE SYSTEM
// Pixel-art visual language matching Dungeon Break's dark fantasy tone
// ─────────────────────────────────────────────────────────────
function _spawnCombatBlood(cine, x, y, dirAngle, severity = 'medium', groundY = null) {
  if (!cine || !cine.bloodParticles) return;
  // Hierarchy: 'minor' (3-5), 'medium'/'strong' (7-9), 'heavy'/'finishing' (10-12)
  let count = 8;
  let baseSpd = 70;
  let spdSpread = 35;
  let arcSpread = 0.65;
  let sizeBase = 1.3;
  let lifeBase = 0.32;
  let numDecals = 2;

  if (severity === 'minor') {
    count = 4;
    baseSpd = 45;
    spdSpread = 20;
    arcSpread = 0.50;
    sizeBase = 1.1;
    lifeBase = 0.24;
    numDecals = 1;
  } else if (severity === 'heavy' || severity === 'finishing') {
    count = 11;
    baseSpd = 92;
    spdSpread = 42;
    arcSpread = 0.75;
    sizeBase = 1.5;
    lifeBase = 0.38;
    numDecals = 3;
  }

  const cols = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626'];
  const actualGroundY = groundY !== null ? groundY : y + 16;

  for (let i = 0; i < count; i++) {
    const ang = dirAngle + (Math.random() - 0.5) * arcSpread;
    const spd = baseSpd + (Math.random() - 0.5) * spdSpread;
    const pLife = lifeBase + Math.random() * 0.10;
    cine.bloodParticles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - (Math.random() * 22),
      r: sizeBase + Math.random() * 0.7,
      col: cols[Math.floor(Math.random() * cols.length)],
      life: pLife,
      maxLife: pLife,
      groundY: actualGroundY + (Math.random() - 0.5) * 5
    });
  }

  // Subtle floor specks on stone
  if (cine.bloodDecals) {
    for (let i = 0; i < numDecals; i++) {
      const dx = x + Math.cos(dirAngle) * (6 + Math.random() * 12) + (Math.random() - 0.5) * 6;
      const dy = actualGroundY + (Math.random() - 0.5) * 3;
      cine.bloodDecals.push({
        x: dx,
        y: dy,
        r: (severity === 'minor') ? 1.0 + Math.random() * 0.4 : 1.3 + Math.random() * 0.8,
        col: Math.random() < 0.6 ? '#450a0a' : '#7f1d1d',
        alpha: 0.70 + Math.random() * 0.15,
        decay: 0.12
      });
    }
  }
}

function _spawnClashSparks(cine, x, y, count = 6, isArmor = false) {
  if (!cine || !cine.impactSparks) return;
  const cols = isArmor ? ['#fde047', '#facc15', '#f8fafc'] : ['#fef08a', '#fde047', '#ffffff'];
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 60;
    const life = 0.10 + Math.random() * 0.08;
    cine.impactSparks.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r: 1.0 + Math.random() * 1.2,
      col: cols[Math.floor(Math.random() * cols.length)],
      life,
      maxLife: life
    });
  }
}

function _updateCombatParticles(cine, dt) {
  if (!cine) return;
  // Blood particles: gravity + air resistance
  if (cine.bloodParticles) {
    for (let i = cine.bloodParticles.length - 1; i >= 0; i--) {
      const bp = cine.bloodParticles[i];
      bp.x += bp.vx * dt;
      bp.y += bp.vy * dt;
      bp.vy += 220 * dt;
      bp.vx *= Math.pow(0.85, dt * 60);
      bp.life -= dt;
      if (bp.y >= bp.groundY || bp.life <= 0) {
        cine.bloodParticles.splice(i, 1);
      }
    }
  }

  // Impact sparks
  if (cine.impactSparks) {
    for (let i = cine.impactSparks.length - 1; i >= 0; i--) {
      const sp = cine.impactSparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) {
        cine.impactSparks.splice(i, 1);
      }
    }
  }

  // Floor specks decay smoothly
  if (cine.bloodDecals) {
    for (let i = cine.bloodDecals.length - 1; i >= 0; i--) {
      const bd = cine.bloodDecals[i];
      bd.alpha -= bd.decay * dt;
      if (bd.alpha <= 0 || cine.timer >= 46.0) {
        cine.bloodDecals.splice(i, 1);
      }
    }
  }
}

function _drawBloodDecals(ctx, decals) {
  if (!decals || decals.length === 0) return;
  for (const bd of decals) {
    if (bd.alpha <= 0.01) continue;
    ctx.save();
    ctx.fillStyle = bd.col || '#450a0a';
    ctx.globalAlpha = Math.max(0, Math.min(0.85, bd.alpha));
    ctx.beginPath();
    ctx.ellipse(bd.x, bd.y, bd.r * 1.2, bd.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function _drawCombatParticles(ctx, particles, sparks) {
  if (sparks && sparks.length > 0) {
    for (const sp of sparks) {
      const a = Math.max(0, Math.min(1.0, sp.life / sp.maxLife));
      ctx.save();
      ctx.fillStyle = sp.col;
      ctx.globalAlpha = a;
      ctx.fillRect(Math.round(sp.x - sp.r * 0.5), Math.round(sp.y - sp.r * 0.5), Math.max(1, Math.round(sp.r)), Math.max(1, Math.round(sp.r)));
      ctx.restore();
    }
  }

  if (particles && particles.length > 0) {
    for (const bp of particles) {
      const a = Math.min(1.0, bp.life / (bp.maxLife * 0.35));
      ctx.save();
      ctx.fillStyle = bp.col;
      ctx.globalAlpha = a;
      ctx.fillRect(Math.round(bp.x), Math.round(bp.y), Math.max(1, Math.round(bp.r)), Math.max(1, Math.round(bp.r)));
      ctx.restore();
    }
  }
}

// ─────────────────────────────────────────────────────────────
// TIMELINE BEATS (81.00s Total Cinematic)
// ─────────────────────────────────────────────────────────────
export const BETRAYAL_TIMELINE = {
  ROWAN_RETURN: 5.00,          // 0.00 – 5.00s: Rowan emerges alone from ancient dark dungeon portal into daylight
  SURVIVORS_EMERGE: 11.00,     // 5.00 – 11.00s: Rescued survivors physically emerge from portal, walk ancient pathway, gather
  KING_GREETING: 17.00,        // 11.00 – 17.00s: The King arrives along paved avenue, greets Rowan ("Rowan." -> "You came back.")
  ROWAN_QUESTIONS: 23.50,      // 17.00 – 23.50s: Rowan confronts King: "Why was I sealed down there?" -> "Why did you seal me inside?"
  TENSION_AND_CRACK: 27.50,    // 23.50 – 27.50s: King's ambiguous avoidance: "There are things you do not yet understand." Discomfort builds
  KING_ORDERS_GUARDS: 30.50,   // 27.50 – 30.50s: King gives simple chilling order: "Guards." -> pause -> "Take him."
  GUARD_COMBAT: 39.00,         // 30.50 – 39.00s: Combat burst! Guards rush Rowan, Rowan parries & counters, guards collapse & dissolve
  SURVIVORS_ACCUSE_KING: 45.50,// 39.00 – 45.50s: Survivors gather behind Rowan, accusing King: "Traitor... The King is the traitor..."
  ROWAN_APPROACHES: 49.50,     // 45.50 – 49.50s: Rowan steps toward King. King waits calmly: "You don't understand what came back with you."
  SWORD_BETRAYAL: 52.50,       // 49.50 – 52.50s: Rescued survivor directly behind Rowan suddenly steps forward and thrusts sword through Rowan!
  ROWAN_WHY: 55.00,            // 52.50 – 55.00s: Rowan staggers, looks down at blade, looks back: "Why?" (let it breathe)
  LORE_REVEAL: 63.50,          // 55.00 – 63.50s: King reveals: "Because the Absolute commanded it." -> "Every soul carried a piece of the Abyss."
  ROWAN_COLLAPSES: 67.00,      // 63.50 – 67.00s: Rowan weakens, falls to knees in realization, collapses onto stones
  BLACK_TRANSITION: 69.00,     // 67.00 – 69.00s: Complete pure black screen, dead silence
  ABSOLUTE_CHAMBER: 74.00,     // 69.00 – 74.00s: True hidden dungeon chamber revealed: 4 pillars, dais, central red Eye. Whisper heard
  FINAL_EYE_ZOOM: 78.00,       // 74.00 – 78.00s: Camera push onto Eye, room darkens into blackness, BLINK at 77.20s, cut to black at 77.60s
  BLACK_HOLD: 81.00            // 77.60 – 81.00s: Pure black hold, silence, handoff to Credits.start('betrayal')
};

// ─────────────────────────────────────────────────────────────
// LOCKED APPROVED PIXEL-ART RED EYE DESIGN (FROM SHATTERED MIND)
// ─────────────────────────────────────────────────────────────
function _drawPixelEye(ctx, cx, cy, scale, blinkProg, timer) {
  ctx.save();
  const P = Math.max(2, Math.round(scale * 1.5)); // chunky pixel unit
  const effectiveOpen = Math.max(0, 1.0 - blinkProg);

  // Outer dark aura glow
  if (effectiveOpen > 0.1) {
    ctx.save();
    const auraR = 28 * P;
    const auraGrad = ctx.createRadialGradient(cx, cy, 4 * P, cx, cy, auraR);
    auraGrad.addColorStop(0, 'rgba(220, 38, 38, 0.40)');
    auraGrad.addColorStop(0.35, 'rgba(153, 27, 27, 0.22)');
    auraGrad.addColorStop(0.7, 'rgba(69, 10, 10, 0.08)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(cx - auraR, cy - auraR, auraR * 2, auraR * 2);
    ctx.restore();
  }

  if (effectiveOpen <= 0.05) {
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

  // 3. Iris
  if (effectiveOpen > 0.15) {
    const irisR = Math.min(maxHalfH, 7);
    for (let iy = -irisR; iy <= irisR; iy++) {
      const inorm = Math.abs(iy) / irisR;
      const ispan = Math.round(Math.sqrt(Math.max(0, 1 - inorm * inorm)) * irisR * 1.2);
      if (ispan > 0) {
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(Math.round(cx - ispan * P), Math.round(cy + iy * P), ispan * 2 * P, P);
        const innerSpan = Math.max(0, ispan - 1);
        if (innerSpan > 0 && Math.abs(iy) < irisR - 1) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(Math.round(cx - innerSpan * P), Math.round(cy + iy * P), innerSpan * 2 * P, P);
        }
      }
    }

    // 4. Slit Pupil
    const pupilW = Math.max(1, Math.round(1.5 * scale));
    const pupilH = Math.round((irisR + 1) * P);
    ctx.fillStyle = '#050002';
    ctx.fillRect(Math.round(cx - pupilW / 2), Math.round(cy - pupilH), pupilW, pupilH * 2);

    // 5. Specular Highlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(cx - 4 * P), Math.round(cy - 4 * P), 2 * P, 2 * P);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(Math.round(cx + 3 * P), Math.round(cy + 2 * P), P, P);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// AUTHENTIC SHATTERED MIND CHAMBER HELPERS
// ─────────────────────────────────────────────────────────────
function _drawFloorTile(ctx, px, py, seed, colors) {
  ctx.fillStyle = colors[seed % colors.length];
  ctx.fillRect(px, py, T, T);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.40)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(px + 1, py + 1, T - 2, 1);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(px + 1, py + T - 2, T - 2, 1);

  if (seed % 4 === 0) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 8);
    ctx.lineTo(px + 14, py + 18);
    ctx.stroke();
  }
}

function _drawWallTile(ctx, px, py, r, hasSouth, colors) {
  ctx.fillStyle = colors[r % colors.length];
  ctx.fillRect(px, py, T, T);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(px, py + T / 2, T, 1);
  const offset = (r % 2 === 0) ? T / 2 : 0;
  ctx.fillRect(px + offset, py, 1, T / 2);
  ctx.fillRect(px + ((offset + T / 2) % T), py + T / 2, 1, T / 2);

  if (hasSouth) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
    ctx.fillRect(px, py + T - 6, T, 6);
  }
}

function _drawTorch(ctx, px, py, timer) {
  const bx = px + T / 2;
  const by = py + T / 2;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(bx - 3, by, 6, 12);
  ctx.fillStyle = '#475569';
  ctx.fillRect(bx - 4, by + 1, 8, 3);

  const flick = Math.sin(timer * 9.0 + px) * 2;
  const flameH = 9 + flick;
  const flameW = 5 + flick * 0.4;

  const tGrad = ctx.createRadialGradient(bx, by - 4, 1, bx, by - 4, 28);
  tGrad.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
  tGrad.addColorStop(0.4, 'rgba(220, 38, 38, 0.16)');
  tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = tGrad;
  ctx.fillRect(bx - 28, by - 32, 56, 56);

  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(bx, by - 2, flameW, flameH, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(bx, by - 1, flameW * 0.55, flameH * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
}

function _drawArchitecturalPillar(ctx, px, py, timer) {
  const pbx = px + T / 2;
  const pby = py + T / 2;

  // Base shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.beginPath();
  ctx.ellipse(pbx, pby + 28, 22, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stepped Plinth
  ctx.fillStyle = '#090d16';
  ctx.fillRect(pbx - 18, pby + 18, 36, 10);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(pbx - 14, pby + 10, 28, 8);
  ctx.strokeStyle = '#05070e';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(pbx - 18, pby + 18, 36, 10);

  // Fluted Column Shaft
  ctx.fillStyle = '#111827';
  ctx.fillRect(pbx - 11, pby - 48, 22, 58);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(pbx - 7, pby - 48, 4, 58);
  ctx.fillRect(pbx + 3, pby - 48, 4, 58);

  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(pbx - 11, pby - 48, 4, 58);
  ctx.fillRect(pbx + 7, pby - 48, 4, 58);

  // Capital / Crown
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(pbx - 15, pby - 56, 30, 8);
  ctx.fillStyle = '#334155';
  ctx.fillRect(pbx - 18, pby - 62, 36, 6);
  ctx.strokeStyle = '#05070e';
  ctx.strokeRect(pbx - 18, pby - 62, 36, 14);

  // Iron Torch Sconce mounted on pillar shaft
  const sconceY = pby - 12;
  ctx.fillStyle = '#05070e';
  ctx.fillRect(pbx - 4, sconceY, 8, 9);
  ctx.fillStyle = '#334155';
  ctx.fillRect(pbx - 5, sconceY + 1, 10, 3);

  const flick = Math.sin(timer * 8.5 + pbx * 2) * 2;
  const pGrad = ctx.createRadialGradient(pbx, sconceY - 4, 1, pbx, sconceY - 4, 24);
  pGrad.addColorStop(0, 'rgba(251, 191, 36, 0.40)');
  pGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.14)');
  pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = pGrad;
  ctx.fillRect(pbx - 24, sconceY - 28, 48, 48);

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(pbx, sconceY - 3, 3.5, 6 + flick, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffbeb';
  ctx.beginPath();
  ctx.ellipse(pbx, sconceY - 2, 2, 3.5 + flick * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function _buildSecretChamber(cx, cy) {
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

  return { cx, cy, tiles, torchPositions, pillars, palette };
}

function _renderSecretChamber(ctx, arena, timer) {
  const { cx, cy, tiles, torchPositions, pillars, palette } = arena;
  const scx = cx * T;
  const scy = cy * T;

  ctx.save();
  ctx.fillStyle = '#030206';
  ctx.fillRect(scx - 22 * T, scy - 16 * T, 44 * T, 32 * T);

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

  // 2. North wall torches
  torchPositions.forEach(tp => {
    _drawTorch(ctx, tp.c * T, tp.r * T, timer);
  });

  // 3. Central Stepped Stone Dais beneath the Eye
  const altarX = scx;
  const altarY = (cy - 1.0) * T;
  ctx.fillStyle = '#080511';
  ctx.fillRect(altarX - 64, altarY + 14, 128, 12);
  ctx.fillStyle = '#110d22';
  ctx.fillRect(altarX - 50, altarY + 4, 100, 10);
  ctx.fillStyle = '#1b1535';
  ctx.fillRect(altarX - 36, altarY - 4, 72, 8);
  ctx.strokeStyle = '#312e81';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(altarX - 36, altarY - 4, 72, 8);

  // 4. Four Massive Architectural Carved Pillars with Torches
  pillars.forEach(p => {
    _drawArchitecturalPillar(ctx, p.c * T, p.r * T, timer);
  });

  // 5. Rich atmospheric darkness & controlled shadow vignette framing the chamber
  const rGrad = ctx.createRadialGradient(scx, scy - 1.5 * T, 5 * T, scx, scy - 1.5 * T, 16 * T);
  rGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.40)');
  rGrad.addColorStop(1, 'rgba(3, 2, 7, 0.92)');
  ctx.fillStyle = rGrad;
  ctx.fillRect(scx - 18 * T, scy - 14 * T, 36 * T, 28 * T);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// ENVIRONMENT GENERATION: OUTSIDE WORLD & SETTLEMENT
// ─────────────────────────────────────────────────────────────
function _buildOutsideWorld(cx, cy) {
  const tiles = [];
  const roadTiles = [];
  const trees = [];

  const spanR = 10;
  const spanC = 28;

  for (let dr = -spanR; dr <= spanR; dr++) {
    for (let dc = -spanC; dc <= spanC; dc++) {
      const tr = Math.round(cy) + dr;
      const tc = Math.round(cx) + dc;
      const seed = Math.abs(tr * 17 + tc * 31) % 43;

      const isRoad = (dr >= -1 && dr <= 1) && (dc >= -8 && dc <= 26);
      const isArchCliff = (dc <= -6 && dr <= 4 && dr >= -7);
      const isMeadowGround = (dc > -6 && dc <= 16 && dr >= -2 && dr <= 7);

      if (isRoad) {
        let roadType = 'royal_avenue';
        if (dc < -2) roadType = 'ancient_path';
        else if (dc <= 0) roadType = 'transition_path';
        roadTiles.push({ r: tr, c: tc, seed, type: roadType });
      } else if (isArchCliff) {
        tiles.push({ r: tr, c: tc, type: 'bluff', seed });
      } else if (isMeadowGround) {
        let groundType = 'grass';
        if (dc <= -4 && Math.abs(dr) <= 3) {
          groundType = 'dungeon_scree';
        } else if (dc <= -2 && Math.abs(dr) <= 3) {
          groundType = 'transition_ground';
        }
        tiles.push({ r: tr, c: tc, type: groundType, seed });
      }
    }
  }

  // Pine trees framing road
  const treeCols = [-4.5, -1.5, 3.5, 7.5, 11.5, 15.5];
  treeCols.forEach((col, idx) => {
    trees.push({ c: cx + col, r: cy - 2.8, w: 26 + (idx % 3) * 4 });
    trees.push({ c: cx + col + 1.2, r: cy + 3.2, w: 28 + (idx % 2) * 4 });
  });
  trees.sort((a, b) => a.r - b.r);

  const banners = [
    { c: Math.round(cx) - 3, r: Math.round(cy) - 2.0, color: '#f59e0b', crest: '#1e3a8a' },
    { c: Math.round(cx) + 2, r: Math.round(cy) - 2.0, color: '#f59e0b', crest: '#1e3a8a' },
    { c: Math.round(cx) + 7, r: Math.round(cy) - 2.0, color: '#f59e0b', crest: '#1e3a8a' }
  ];

  const lanterns = [
    { c: Math.round(cx) - 6.5, r: Math.round(cy) - 1.8 },
    { c: Math.round(cx) - 6.5, r: Math.round(cy) + 1.8 },
    { c: Math.round(cx) + 0.5, r: Math.round(cy) - 1.8 },
    { c: Math.round(cx) + 0.5, r: Math.round(cy) + 1.8 }
  ];

  const clouds = Array.from({ length: 8 }, (_, i) => ({
    x: (i * 180) % 1400 - 200,
    y: -300 + (i % 3) * 36,
    w: 130 + (i % 4) * 35,
    h: 44 + (i % 3) * 12,
    speed: 7 + (i % 3) * 4
  }));

  const birds = Array.from({ length: 5 }, (_, i) => ({
    x: 80 + i * 220,
    y: -220 + (i % 4) * 28,
    speed: 26 + i * 8,
    flapPhase: i * 1.5
  }));

  const motes = Array.from({ length: 40 }, () => ({
    x: Math.random() * (spanC * 2 * T),
    y: Math.random() * (spanR * 2 * T) - 250,
    r: 1.0 + Math.random() * 1.8,
    spdY: -10 - Math.random() * 18,
    spdX: 12 + Math.random() * 20,
    alpha: 0.25 + Math.random() * 0.45,
    phase: Math.random() * Math.PI * 2
  }));

  return {
    tiles,
    roadTiles,
    trees,
    banners,
    lanterns,
    clouds,
    birds,
    motes,
    archway: {
      c: Math.round(cx) - 8.2,
      r: Math.round(cy)
    }
  };
}

function _renderOutsideWorld(ctx, world, timer, cx, cy) {
  const { tiles, roadTiles, trees, banners, lanterns, clouds, birds, motes, archway } = world;
  const worldCX = cx * T;
  const worldCY = cy * T;

  // 1. Sky Dome (Subtle cooler tint than pure golden Hero)
  const skyTop = worldCY - 440;
  const horizonY = worldCY - 80;
  const skyGrad = ctx.createLinearGradient(worldCX, skyTop, worldCX, horizonY);
  skyGrad.addColorStop(0, '#0369a1');
  skyGrad.addColorStop(0.35, '#0284c7');
  skyGrad.addColorStop(0.70, '#93c5fd');
  skyGrad.addColorStop(0.92, '#fef08a');
  skyGrad.addColorStop(1, '#fed7aa');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(worldCX - 800, skyTop, 1600, horizonY - skyTop + 30);

  // 2. Parallax Distant Ridges
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.moveTo(worldCX - 800, horizonY - 40);
  for (let x = -800; x <= 800; x += 60) {
    const hillY = horizonY - 45 + Math.sin(x * 0.005) * 28 + Math.cos(x * 0.009) * 16;
    ctx.lineTo(worldCX + x, hillY);
  }
  ctx.lineTo(worldCX + 800, horizonY + 20);
  ctx.lineTo(worldCX - 800, horizonY + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(worldCX - 800, horizonY - 15);
  for (let x = -800; x <= 800; x += 40) {
    const ridgeY = horizonY - 20 + Math.sin(x * 0.007 + 1.2) * 18;
    ctx.lineTo(worldCX + x, ridgeY);
  }
  ctx.lineTo(worldCX + 800, horizonY + 30);
  ctx.lineTo(worldCX - 800, horizonY + 30);
  ctx.closePath();
  ctx.fill();

  // 3. Drifting Clouds
  clouds.forEach(c => {
    const clx = worldCX + ((c.x + timer * c.speed) % 1600 - 800);
    const cly = worldCY + c.y;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.80)';
    ctx.beginPath();
    ctx.ellipse(clx, cly, c.w * 0.5, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(clx - c.w * 0.22, cly + 4, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.ellipse(clx + c.w * 0.22, cly + 2, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Birds
  birds.forEach(b => {
    const bx = worldCX + ((b.x + timer * b.speed) % 1400 - 700);
    const by = worldCY + b.y;
    const flap = Math.sin(timer * 8 + b.flapPhase) * 3;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + flap);
    ctx.quadraticCurveTo(bx - 2, by - 3, bx, by);
    ctx.quadraticCurveTo(bx + 2, by - 3, bx + 6, by + flap);
    ctx.stroke();
  });

  // 5. Sun & Rays
  const sunX = worldCX + 280;
  const sunY = worldCY - 280;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 260);
  sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  sunGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.50)');
  sunGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.15)');
  sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 260, 0, Math.PI * 2);
  ctx.fill();

  // 6. Meadow & Cliff Tiles
  tiles.forEach(tile => {
    const px = tile.c * T;
    const py = tile.r * T;

    if (tile.type === 'bluff') {
      const rocks = ['#0f172a', '#1e293b', '#090d16', '#18181b'];
      ctx.fillStyle = rocks[tile.seed % rocks.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
    } else if (tile.type === 'dungeon_scree') {
      const screeEarth = ['#111827', '#18181b', '#0f172a', '#1c1917'];
      ctx.fillStyle = screeEarth[tile.seed % screeEarth.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
    } else if (tile.type === 'transition_ground') {
      ctx.fillStyle = (tile.seed % 2 === 0) ? '#14532d' : '#1b3a1e';
      ctx.fillRect(px, py, T, T);
    } else {
      const greens = ['#15803d', '#16a34a', '#14532d', '#22c55e', '#166534'];
      ctx.fillStyle = greens[tile.seed % greens.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(134, 239, 172, 0.20)';
      ctx.lineWidth = 1;
      if (tile.seed % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(px + 4, py + T);
        ctx.lineTo(px + 6, py + T - 6);
        ctx.moveTo(px + 20, py + T);
        ctx.lineTo(px + 18, py + T - 7);
        ctx.stroke();
      }
    }
  });

  // 7. Ancient Dungeon Pathway -> Royal Avenue
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
    }
  });

  // 8. Ancient Intimidating Dungeon Cliff Portal
  const apx = archway.c * T;
  const apy = archway.r * T;
  ctx.save();
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

  // Keystone lintel beam
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(apx - 48, apy - 92, 120, 22);
  ctx.strokeStyle = '#070a12';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(apx - 48, apy - 92, 120, 22);

  // Sconces with cold-blue embers
  ctx.fillStyle = '#090d16';
  ctx.fillRect(apx - 24, apy - 32, 5, 14);
  ctx.fillRect(apx + 43, apy - 32, 5, 14);
  const blueFlicker = Math.sin(timer * 8.0) * 1.5;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(apx - 22, apy - 35, 2.5, 3.5 + blueFlicker, 0, 0, Math.PI * 2);
  ctx.ellipse(apx + 45, apy - 35, 2.5, 3.5 + blueFlicker, 0, 0, Math.PI * 2);
  ctx.fill();

  // Deep cavern interior void
  ctx.fillStyle = '#020104';
  ctx.fillRect(apx - 6, apy - 70, 36, 86);

  // Stepped stone threshold
  ctx.fillStyle = '#0b111e';
  ctx.fillRect(apx - 10, apy + 8, 44, 4);
  ctx.fillStyle = '#111827';
  ctx.fillRect(apx - 8, apy + 12, 40, 4);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(apx - 6, apy + 16, 36, 4);
  ctx.restore();

  // 9. Pine Trees
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

  // 10. Banners & Lanterns
  banners.forEach(b => {
    const bx = b.c * T;
    const by = b.r * T;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx + 4, by - 24, 3, 32);
    const wave = Math.sin(timer * 3.5 + b.c) * 4;
    ctx.fillStyle = b.color || '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(bx + 7, by - 22);
    ctx.lineTo(bx + 26 + wave, by - 16);
    ctx.lineTo(bx + 7, by - 4);
    ctx.closePath();
    ctx.fill();
  });

  lanterns.forEach(lt => {
    const lx = lt.c * T;
    const ly = lt.r * T;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(lx + 6, ly - 18, 3, 24);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx + 2, ly - 26, 11, 10);
  });
}

// ─────────────────────────────────────────────────────────────
// CHARACTER CLASSES FOR BETRAYAL CINEMATIC
// ─────────────────────────────────────────────────────────────

/** Lord Rowan with full combat, staggering, and collapse states */
class BetrayalRowanEntity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.facing = 1;
    this.pose = 'idle'; // 'walk_emerge', 'idle', 'question', 'combat_ready', 'block', 'evade', 'counter', 'recovery', 'walk_forward', 'stabbed', 'look_down', 'look_back', 'collapse'
    this.walkCycle = 0;
    this.stabProgress = 0;
    this.collapseProgress = 0;

    // Smooth animation blending and physical weight
    this.curSwordAngle = 0;    // radians
    this.curBodyShiftX = 0;    // pixels
    this.curBodyShiftY = 0;
    this.curBodyTilt = 0;      // radians
    this.curStance = 0;        // 0 = narrow, 1 = combat wide
    this.slashTrailAlpha = 0;
    this.lookDownProg = 0;
    this.lookBackProg = 0;
    this.hitFlashTimer = 0;
  }

  update(dt, t) {
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    }
    if (t < BETRAYAL_TIMELINE.ROWAN_RETURN) {
      this.pose = 'walk_emerge';
      this.walkCycle += dt * 3.5;
    } else if (t < BETRAYAL_TIMELINE.ROWAN_QUESTIONS) {
      this.pose = 'idle';
      this.walkCycle = 0;
    } else if (t < BETRAYAL_TIMELINE.TENSION_AND_CRACK) {
      this.pose = 'question';
    } else if (t < BETRAYAL_TIMELINE.KING_ORDERS_GUARDS) {
      // King orders guards at 27.50s; Rowan shifts alert at 29.20s when steel is drawn
      this.pose = (t >= 29.20) ? 'combat_ready' : 'idle';
    } else if (t < BETRAYAL_TIMELINE.GUARD_COMBAT) {
      // Redesigned Physical Combat Choreography (30.20s – 39.00s)
      if (t < 31.40) {
        // Beat 1: Grounded ready stance, tracks aggressive charge of Guard 1
        this.pose = 'combat_ready';
      } else if (t < 31.70) {
        // Beat 1: High angled block against Guard 1 overhead slash
        this.pose = 'block';
      } else if (t < 32.40) {
        // Beat 2: Immediate counter-slash striking Guard 1 across chest
        this.pose = 'counter';
      } else if (t < 32.80) {
        // Beat 2: Resets center of gravity, turns toward oncoming Guard 2
        this.pose = 'combat_ready';
      } else if (t < 33.60) {
        // Beat 3: Evades Guard 2 leaping high slash (ducks under blade)
        this.pose = 'evade';
      } else if (t < 34.20) {
        // Beat 3: Eyes low flank as Guard 1 recovers and returns into two-sided pressure
        this.pose = 'combat_ready';
      } else if (t < 35.10) {
        // Beat 4: Breaks formation! Steps inside Guard 1, delivers heavy spin-cleave
        this.pose = 'counter';
      } else if (t < 35.60) {
        // Beat 4: Pivots immediately toward oncoming flankers
        this.pose = 'combat_ready';
      } else if (t < 36.00) {
        // Beat 5: Parries Guard 2 leaping thrust
        this.pose = 'block';
      } else if (t < 36.30) {
        // Beat 5: Ducks low under Guard 4 long halberd thrust
        this.pose = 'evade';
      } else if (t < 36.80) {
        // Beat 5: Decisive counter-strike downing Guard 2
        this.pose = 'counter';
      } else if (t < 37.20) {
        // Beat 6: Deflects Guard 3 blade, channelling into 360 spin
        this.pose = 'block';
      } else if (t < 38.20) {
        // Beat 6: Decisive 360 whirlwind cleave through Guard 3 & Guard 4
        this.pose = 'counter';
      } else {
        // Beat 7: Aftermath — lowers blade, deep breathing, standing victorious
        this.pose = 'recovery';
      }
    } else if (t < BETRAYAL_TIMELINE.SURVIVORS_ACCUSE_KING) {
      this.pose = (t < 40.5) ? 'recovery' : 'idle';
    } else if (t < BETRAYAL_TIMELINE.ROWAN_APPROACHES) {
      // Rowan approaches King
      this.pose = 'walk_forward';
      this.walkCycle += dt * 2.8;
    } else if (t < 51.15) {
      // Arrives before King, listening
      this.pose = 'idle';
    } else if (t < 52.40) {
      // Impact spasm & physical shock!
      this.pose = 'stabbed';
      this.stabProgress = Math.min(1.0, this.stabProgress + dt * 4.0);
    } else if (t < 53.20) {
      // Slowly looks down at blade in chest
      this.pose = 'look_down';
    } else if (t < BETRAYAL_TIMELINE.ROWAN_COLLAPSES) {
      // Slowly turns head back toward betrayer / King ("Why?")
      this.pose = 'look_back';
    } else {
      this.pose = 'collapse';
      this.collapseProgress = Math.min(1.0, this.collapseProgress + dt * 0.65);
    }

    // Determine target animation blend values based on current pose
    let targetSwordAngle = 0;
    let targetShiftX = 0;
    let targetShiftY = 0;
    let targetTilt = 0;
    let targetStance = 0;

    const facing = this.facing;
    if (this.pose === 'combat_ready') {
      targetSwordAngle = -0.35;
      targetShiftX = 0;
      targetShiftY = 0.8;
      targetTilt = 0;
      targetStance = 1.0;
    } else if (this.pose === 'block') {
      targetSwordAngle = -0.85;
      targetShiftX = -facing * 1.0;
      targetShiftY = 1.0;
      targetTilt = -facing * 0.04;
      targetStance = 1.0;
    } else if (this.pose === 'evade') {
      targetSwordAngle = -0.40;
      targetShiftX = -facing * 1.5;
      targetShiftY = 0.8;
      targetTilt = -facing * 0.05;
      targetStance = 1.0;
    } else if (this.pose === 'counter') {
      targetSwordAngle = 0.25;
      targetShiftX = facing * 1.2;
      targetShiftY = 0.5;
      targetTilt = facing * 0.06;
      targetStance = 1.0;
      this.slashTrailAlpha = 0.85;
    } else if (this.pose === 'recovery') {
      targetSwordAngle = 0.65;
      targetShiftX = 0;
      targetShiftY = 0.4;
      targetTilt = facing * 0.02;
      targetStance = 0.5;
    } else if (this.pose === 'stabbed') {
      targetSwordAngle = 0;
      targetShiftX = -facing * 2.0;
      targetShiftY = 2.0;
      targetTilt = facing * 0.05;
      targetStance = 0.5;
    } else if (this.pose === 'look_down') {
      targetSwordAngle = 0;
      targetShiftX = -facing * 1.6;
      targetShiftY = 1.8;
      targetTilt = facing * 0.04;
      targetStance = 0.5;
      this.lookDownProg = Math.min(1.0, this.lookDownProg + dt * 2.5);
    } else if (this.pose === 'look_back') {
      targetSwordAngle = 0;
      targetShiftX = -facing * 1.4;
      targetShiftY = 1.5;
      targetTilt = 0;
      targetStance = 0.5;
      this.lookBackProg = Math.min(1.0, this.lookBackProg + dt * 2.2);
    } else if (this.pose === 'collapse') {
      targetSwordAngle = 0;
      targetShiftX = -facing * 2.0;
      targetShiftY = this.collapseProgress * 7;
      targetTilt = facing * 0.08;
      targetStance = 0;
    } else {
      // idle, walk_emerge, walk_forward, question
      targetSwordAngle = 0;
      targetShiftX = 0;
      targetShiftY = 0;
      targetTilt = (this.pose === 'walk_emerge' || this.pose === 'walk_forward') ? 0.02 : 0;
      targetStance = 0;
    }

    // Smoothly interpolate blend parameters
    const blendRate = Math.min(1.0, dt * 14.0);
    this.curSwordAngle += (targetSwordAngle - this.curSwordAngle) * blendRate;
    this.curBodyShiftX += (targetShiftX - this.curBodyShiftX) * blendRate;
    this.curBodyShiftY += (targetShiftY - this.curBodyShiftY) * blendRate;
    this.curBodyTilt += (targetTilt - this.curBodyTilt) * blendRate;
    this.curStance += (targetStance - this.curStance) * blendRate;
    this.slashTrailAlpha = Math.max(0, this.slashTrailAlpha - dt * 3.5);
  }

  draw(ctx, t) {
    const px = this.x * T;
    const py = this.y * T;

    ctx.save();
    ctx.translate(px, py);

    // Ground contact shadow
    const shadowAlpha = Math.max(0.2, 0.48 - this.collapseProgress * 0.2);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 11, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const breath = (this.pose === 'recovery')
      ? Math.sin(t * 5.0) * 1.6
      : (this.pose === 'collapse') ? Math.sin(t * 1.2) * 0.5 : Math.sin(t * 2.2) * 1.0;
    const capeBlow = Math.sin(t * 3.5) * 2.0;
    const facing = this.facing;
    const legSwing = (this.pose === 'walk_emerge' || this.pose === 'walk_forward') ? Math.sin(this.walkCycle) * 3.0 : 0;

    // Apply smoothly blended body translation & tilt
    ctx.translate(this.curBodyShiftX, this.curBodyShiftY);
    ctx.rotate(this.curBodyTilt);

    // 1. Lord Rowan Crimson Cape
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-facing * 6, -9);
    ctx.lineTo(-facing * 14, 5 + capeBlow);
    ctx.lineTo(-facing * 9, 14);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // 2. Steel Sabatons & Greaves (interpolated stance width)
    ctx.fillStyle = '#1e293b';
    if (this.pose === 'collapse') {
      ctx.fillRect(-7, 6, 7, 3.5);
      ctx.fillRect(0, 6, 7, 3.5);
    } else {
      const leftFootX = -5 - legSwing * (1.0 - this.curStance) - this.curStance * 1.0;
      const rightFootX = 1.5 + legSwing * (1.0 - this.curStance) + this.curStance * 0.8;
      const footW = 3.5 + this.curStance * 0.5;
      const footH = 7.0 - this.curStance * 0.5;
      ctx.fillRect(leftFootX, 5 + this.curStance * 0.5, footW, footH);
      ctx.fillRect(rightFootX, 5 + this.curStance * 0.5, footW, footH);
    }

    // 3. Plate Armor
    ctx.fillStyle = '#334155';
    ctx.fillRect(-7, -9 + breath * 0.3, 14, 14);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-6, -8 + breath * 0.3, 12, 6);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-5, -2, 10, 2);

    // 4. Pauldrons
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-10, -9 + breath * 0.3, 3.5, 6);
    ctx.fillRect(6.5, -9 + breath * 0.3, 3.5, 6);

    // 5. Great Helmet & Visor
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -15, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillRect(-5, -18, 10, 5);

    // Visor eye glow (fades out smoothly, tilts down or looks back)
    const visorAlpha = (this.pose === 'stabbed')
      ? 0.5 + Math.sin(t * 16.0) * 0.4
      : Math.max(0.1, 1.0 - this.collapseProgress * 0.9);
    ctx.fillStyle = `rgba(56, 189, 248, ${visorAlpha})`;

    let baseVisorX = (facing === 1 ? 0 : -4.5);
    let baseVisorY = -15;
    if (this.lookDownProg > 0) {
      baseVisorX -= this.lookDownProg * facing * 1.0;
      baseVisorY += this.lookDownProg * 1.5;
    }
    if (this.lookBackProg > 0) {
      baseVisorX -= this.lookBackProg * facing * 4.0;
    }
    ctx.fillRect(baseVisorX, baseVisorY, 4.5, 2.0);

    // 6. Weapon / Stabbing Presentation
    const isPierced = (this.pose === 'stabbed' || this.pose === 'look_down' || this.pose === 'look_back' || this.pose === 'collapse');
    if (isPierced) {
      // THE SWORD PIERCING THROUGH ROWAN'S TORSO!
      // Entry point at rear flank:
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-facing * 7, -3, 8, 2.5);

      // Steel blade protruding forward through breastplate with blood tip
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(facing * 4, -3, 10, 2.5);
      // Blood on blade tip
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(facing * 12, -3, 3, 2.5);

      // Blood drip down cuirass
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(facing * 5, -1, 1.5, 4);
      ctx.fillRect(0, -1, 3.5, 3.5);
      ctx.fillRect(-facing * 3, 2, 2, 3);
    } else if (Math.abs(this.curSwordAngle) > 0.05 || this.curStance > 0.2) {
      // Dynamic combat blade smoothly oriented by this.curSwordAngle
      ctx.save();
      ctx.translate(facing * 3, -6);
      ctx.rotate(this.curSwordAngle);

      // Hilt & crossguard
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-1.5, -3, 5, 2.5);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-1, -6, 2, 4);

      // Steel blade
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
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.slashTrailAlpha * 0.60})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(facing * 11, -9, 15, -0.6, 0.6);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Sheathed / resting at hip
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-facing * 7, -5, 2.5, 16);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-facing * 8, -8, 4.5, 3);
    }

    // Hit flash reaction on genuine impacts
    if (this.hitFlashTimer > 0) {
      ctx.save();
      ctx.fillStyle = (Math.sin(this.hitFlashTimer * 45) > 0) ? 'rgba(255, 255, 255, 0.45)' : 'rgba(220, 38, 38, 0.40)';
      ctx.fillRect(-8, -16, 16, 24);
      ctx.restore();
    }

    ctx.restore();
  }
}

/** The King with welcoming, commanding, and sinister composed states */
class BetrayalKingEntity {
  constructor(cx, cy) {
    this.startX = cx + 13.0;
    this.greetingX = cx - 1.2;
    this.x = this.startX;
    this.y = cy;
    this.facing = -1;
    this.pose = 'offscreen'; // 'offscreen', 'walk', 'greet', 'order', 'calm_wait', 'reveal'
    this.walkCycle = 0;
    this.armGestureProg = 0; // 0 = hands behind back, 0.6 = greet, 1.0 = order
  }

  update(dt, t) {
    if (t < BETRAYAL_TIMELINE.SURVIVORS_EMERGE) {
      this.pose = 'offscreen';
      this.x = this.startX;
      return;
    }

    if (t < BETRAYAL_TIMELINE.KING_GREETING) {
      this.pose = 'walk';
      const moveDur = BETRAYAL_TIMELINE.KING_GREETING - BETRAYAL_TIMELINE.SURVIVORS_EMERGE;
      const p = easeInOut(clamp((t - BETRAYAL_TIMELINE.SURVIVORS_EMERGE) / moveDur, 0, 1));
      this.x = this.startX + (this.greetingX - this.startX) * p;
      this.walkCycle += dt * 5.0;
    } else if (t < BETRAYAL_TIMELINE.ROWAN_QUESTIONS) {
      this.pose = 'greet';
      this.x = this.greetingX;
      this.walkCycle = 0;
    } else if (t < BETRAYAL_TIMELINE.TENSION_AND_CRACK) {
      this.pose = 'calm_wait';
      this.x = this.greetingX;
    } else if (t < BETRAYAL_TIMELINE.KING_ORDERS_GUARDS) {
      this.pose = 'order'; // arm raised commanding guards
      this.x = this.greetingX;
    } else if (t < BETRAYAL_TIMELINE.SWORD_BETRAYAL) {
      this.pose = 'calm_wait'; // standing unmoved as guards fight
      this.x = this.greetingX;
    } else {
      this.pose = 'reveal'; // cold, calculated lore revelation
      this.x = this.greetingX;
    }

    // Smooth arm gesture transition
    let targetGesture = 0.0;
    if (this.pose === 'greet') {
      targetGesture = 0.6;
    } else if (this.pose === 'order') {
      targetGesture = (t >= 29.30) ? 1.0 : 0.8;
    } else {
      targetGesture = 0.0;
    }
    this.armGestureProg += (targetGesture - this.armGestureProg) * Math.min(1.0, dt * 5.5);
  }

  draw(ctx, t) {
    if (this.pose === 'offscreen') return;

    const px = this.x * T;
    const py = this.y * T;

    ctx.save();
    ctx.translate(px, py);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const facing = this.facing;
    const legSwing = (this.pose === 'walk') ? Math.sin(this.walkCycle) * 3.2 : 0;
    const cloakBreeze = Math.sin(t * 3.0) * 2.0;

    // 1. Royal Velvet Cloak
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
    ctx.fillRect(-5 - legSwing, 6, 3.5, 8);
    ctx.fillRect(1.5 + legSwing, 6, 3.5, 8);

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

    // 6. Arms / Gestures (interpolated)
    if (this.armGestureProg > 0.08) {
      const reach = 4 + this.armGestureProg * 6;
      const armY = -8 - this.armGestureProg * 3;
      ctx.fillStyle = '#312e81';
      ctx.fillRect(facing * 2, armY, reach, 4);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(facing * (2 + reach), armY - 1, 3.5, 3.5);
    } else {
      // Hands clasped behind back in sinister composure
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-facing * 4, -8, 5, 8);
    }

    ctx.restore();
  }
}

/** Rescued Survivors (Physical emergence from portal, chanting, and tragic betrayer stabbing) */
class BetrayalSurvivorEntity {
  constructor(cfg) {
    this.id = cfg.id;
    this.isBetrayer = !!cfg.isBetrayer;
    this.startX = cfg.startX;
    this.startY = cfg.startY;
    this.targetX = cfg.targetX;
    this.targetY = cfg.targetY;
    this.followX = cfg.followX || cfg.targetX;
    this.followY = cfg.followY || cfg.targetY;
    this.x = cfg.startX;
    this.y = cfg.startY;
    this.emergeStart = cfg.emergeStart;
    this.emergeEnd = cfg.emergeEnd;
    this.tunic = cfg.tunic || '#3b82f6';
    this.hair = cfg.hair || '#1e293b';
    this.facing = 1;
    this.state = 'waiting'; // 'waiting', 'emerge', 'stand', 'follow', 'approach', 'draw_weapon', 'lunge', 'contact_hold', 'trance'
    this.walkCycle = 0;
    this.cx = cfg.cx;
    this.cy = cfg.cy;
    this.drawProg = 0; // weapon drawing interpolation for betrayer

    // Stagger delays for organic crowd dynamics
    this.accuseDelay = cfg.accuseDelay || 0;
    this.followDelay = cfg.followDelay || 0;
  }

  update(dt, t) {
    if (t < this.emergeStart) {
      this.state = 'waiting';
      this.x = this.startX;
      this.y = this.startY;
      return;
    }

    if (t < this.emergeEnd) {
      this.state = 'emerge';
      const p = easeInOut(clamp((t - this.emergeStart) / (this.emergeEnd - this.emergeStart), 0, 1));
      this.x = this.startX + (this.targetX - this.startX) * p;
      this.y = this.startY + (this.targetY - this.startY) * p;
      this.facing = 1;
      this.walkCycle += dt * 4.5;
    } else if (t < BETRAYAL_TIMELINE.GUARD_COMBAT) {
      this.state = 'stand';
      this.x = this.targetX;
      this.y = this.targetY;
      this.walkCycle = 0;
    } else if (t < BETRAYAL_TIMELINE.SURVIVORS_ACCUSE_KING) {
      // Post-combat gathering (39.00s – 45.50s): organic hesitation then staggered advance
      const gatherStart = 40.50 + this.accuseDelay;
      const gatherDur = 2.40;
      if (t < gatherStart) {
        this.state = 'stand';
        this.x = this.targetX;
        this.y = this.targetY;
        this.walkCycle = 0;
      } else {
        this.state = 'stand';
        const p = easeInOut(clamp((t - gatherStart) / gatherDur, 0, 1));
        // Step forward 0.35 tiles towards Rowan in agitated crowd movement
        this.x = this.targetX + p * 0.35;
        this.y = this.targetY;
        if (p < 1.0) this.walkCycle += dt * 2.8;
      }
    } else if (t < 49.50) {
      // Survivors follow behind Rowan as Rowan walks toward the King (45.50s - 49.50s)
      const followStart = 45.50 + this.followDelay;
      const followDur = 49.50 - followStart;
      if (t < followStart) {
        this.state = 'stand';
        this.walkCycle = 0;
      } else {
        this.state = 'follow';
        const fProg = clamp((t - followStart) / followDur, 0, 1);
        const eased = easeInOut(fProg);
        const startX = this.targetX + 0.35;
        this.x = startX + (this.followX - startX) * eased;
        this.y = this.targetY + (this.followY - this.targetY) * eased;
        this.facing = 1;
        this.walkCycle += dt * 3.5;
      }
    } else {
      // 49.50s ONWARDS: THE BETRAYAL STABBING SEQUENCE
      if (!this.isBetrayer) {
        // Other survivors remain halted behind
        this.x = this.followX;
        this.y = this.followY;
        this.walkCycle = 0;
        this.state = (t >= 51.15) ? 'trance' : 'stand';
      } else {
        // Tragic Betrayer Ally physical choreography
        const cx = this.cx;
        const cy = this.cy;
        if (t < 50.40) {
          // 1. Closes distance subtly from behind Rowan (49.50s – 50.40s)
          this.state = 'approach';
          const p = easeInOut((t - 49.50) / 0.90);
          this.x = this.followX + ((cx - 2.95) - this.followX) * p;
          this.y = this.followY + ((cy + 0.12) - this.followY) * p;
          this.facing = 1;
          this.walkCycle += dt * 3.8;
        } else if (t < 50.80) {
          // 2. Reaches rear-side angle, brief hesitation, draws concealed weapon (50.40s – 50.80s)
          this.state = 'draw_weapon';
          this.x = cx - 2.95;
          this.y = cy + 0.12;
          this.facing = 1;
          this.walkCycle = 0;
          this.drawProg = clamp((t - 50.40) / 0.40, 0, 1);
        } else if (t < 51.15) {
          // 3. Full-body forward lunge (50.80s – 51.15s)
          this.state = 'lunge';
          this.drawProg = 1.0;
          const p = easeInOut((t - 50.80) / 0.35);
          this.x = (cx - 2.95) + ((cx - 2.85) - (cx - 2.95)) * p;
          this.y = (cy + 0.12) + ((cy + 0.10) - (cy + 0.12)) * p;
          this.facing = 1;
        } else {
          // 4. Physical contact & follow-through hold (51.15s – 67.00s)
          this.state = 'contact_hold';
          this.drawProg = 1.0;
          this.x = cx - 2.85;
          this.y = cy + 0.10;
          this.facing = 1;
          this.walkCycle = 0;
        }
      }
    }
  }

  draw(ctx, t, portalC) {
    if (this.state === 'waiting') return;

    const px = this.x * T;
    const py = this.y * T;

    // Portal exit shadow fade
    let shadowAlpha = 0.40;
    if (this.state === 'emerge') {
      const distFromMouth = this.x - portalC;
      shadowAlpha = clamp(distFromMouth / 2.0, 0.05, 0.40);
    }

    ctx.save();
    ctx.translate(px, py);

    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const legSwing = (this.state === 'emerge' || this.state === 'follow' || this.state === 'approach')
      ? Math.sin(this.walkCycle) * 2.8
      : 0;
    const facing = this.facing;

    // Legs
    ctx.fillStyle = '#1e293b';
    if (this.state === 'lunge') {
      ctx.fillRect(-6, 4, 3.5, 6);
      ctx.fillRect(3, 4, 3.5, 6);
    } else {
      ctx.fillRect(-3.5 - legSwing, 4, 3, 6);
      ctx.fillRect(1 + legSwing, 4, 3, 6);
    }

    // Tunic
    ctx.fillStyle = this.tunic;
    ctx.fillRect(-5, -6, 10, 11);

    // Belt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-5, 0, 10, 1.5);

    // Head & Hair
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-3.5, -14, 7, 7);
    ctx.fillStyle = this.hair;
    ctx.fillRect(-4, -16, 8, 4);

    // Eyes: red-tinged trance if influenced by the Absolute
    if (this.state === 'trance' || this.state === 'contact_hold') {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(facing === 1 ? 1 : -3, -12, 1.5, 1.5);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(facing === 1 ? 1 : -3, -12, 1.5, 1.5);
    }

    // Hands / Weapons
    if (this.isBetrayer) {
      if (this.state === 'draw_weapon') {
        // Hand drawing gleaming blade smoothly from under cloak
        const drawLen = 3 + this.drawProg * 5;
        ctx.fillStyle = this.tunic;
        ctx.fillRect(facing * 2, -6, 6, 3.5);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(facing * 7, -7, 3, 3);
        // Hilt
        ctx.fillStyle = '#78350f';
        ctx.fillRect(facing * 8, -8, 2, 5);
        // Gleaming blade sliding out
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 9, -9, drawLen, 2.5);
        // Specular glint
        if (this.drawProg > 0.4) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(facing * (8 + drawLen), -9, 2, 2);
        }
      } else if (this.state === 'lunge') {
        // Arms lunging forward with blade
        ctx.fillStyle = this.tunic;
        ctx.fillRect(facing * 3, -6, 8, 3.5);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(facing * 10, -7, 3, 3);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(facing * 11, -8, 2, 5);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 12, -9, 1.5, 7);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(facing * 13.5, -6, 14, 2.5);
      } else if (this.state === 'contact_hold') {
        // Physical contact hold: arms fully extended, gripping hilt firmly
        ctx.fillStyle = this.tunic;
        ctx.fillRect(facing * 3, -6, 8, 3.5);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(facing * 10, -7, 3, 3);
        // Crossguard & Hilt
        ctx.fillStyle = '#78350f';
        ctx.fillRect(facing * 11.5, -8, 2, 6);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 12.5, -9, 1.5, 8);
        // Blade seamlessly entering Rowan's torso
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(facing * 14, -6, 16, 2.5);
      }
    }

    ctx.restore();
  }
}

/** Royal Guard with physical pre-staging around King, alert responses, and grounded combat choreography */
class BetrayalGuardEntity {
  constructor(cfg) {
    this.id = cfg.id;
    this.role = cfg.role || 'swordsman'; // 'swordsman' or 'halberd'
    this.offsetX = cfg.offsetX;
    this.offsetY = cfg.offsetY;
    this.cx = cfg.cx;
    this.cy = cfg.cy;
    this.kingStartX = cfg.kingStartX;
    this.kingGreetX = cfg.kingGreetX;

    this.x = this.kingStartX + this.offsetX;
    this.y = this.cy + this.offsetY;
    this.facing = -1;
    this.state = 'offscreen'; // 'offscreen', 'escort', 'guard_stand', 'alert', 'weapon_ready', 'step_forward', 'charge', 'strike', 'recoil', 'circle_reposition', 'supporting_move', 'collapse', 'dissolving'
    this.walkCycle = 0;
    this.dissolveProg = 0;
    this._dissolved = false;
    this.breathOffset = (this.offsetX * 1.5 + this.offsetY * 2.0);
    this.drawProg = 0; // weapon draw animation blending
    this.hitFlashTimer = 0;
  }

  update(dt, t) {
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    }
    const cx = this.cx;
    const cy = this.cy;
    const rx = cx - 4.5; // Rowan grounded position
    const ry = cy;

    // 1. Offscreen before King emerges (0.00 – 5.00s)
    if (t < 5.00) {
      this.state = 'offscreen';
      this.x = this.kingStartX + this.offsetX;
      this.y = cy + this.offsetY;
      return;
    }

    // 2. Escorting King along the avenue (5.00 – 11.00s)
    if (t < 11.00) {
      this.state = 'escort';
      const p = easeInOut(clamp((t - 5.00) / 6.00, 0, 1));
      const startX = this.kingStartX + this.offsetX;
      const endX = this.kingGreetX + this.offsetX;
      this.x = startX + (endX - startX) * p;
      this.y = cy + this.offsetY;
      this.facing = -1;
      this.walkCycle += dt * 4.5;
      return;
    }

    // 3. Staged security detail around King during dialogue (11.00 – 27.50s)
    if (t < 27.50) {
      this.state = 'guard_stand';
      this.x = this.kingGreetX + this.offsetX;
      this.y = cy + this.offsetY;
      this.facing = (this.offsetX < 0) ? -1 : (this.id === 'guard_rear_top' ? -1 : 1);
      this.walkCycle = 0;
      this.drawProg = 0;
      return;
    }

    // 4. King's order: "Guards." -> "Take him." (27.50 – 30.50s)
    if (t < 30.50) {
      this.facing = -1;
      if (t < 28.20) {
        // "Guards." spoken: initial alert awareness
        this.state = 'guard_stand';
        this.drawProg = clamp((t - 27.50) / 0.70, 0, 0.25);
        this.x = this.kingGreetX + this.offsetX;
        this.y = cy + this.offsetY;
      } else if (t < 28.80) {
        // Alert reaction: grip tenses on weapons
        this.state = 'alert';
        this.drawProg = clamp(0.25 + (t - 28.20) / 0.60 * 0.40, 0.25, 0.65);
        this.x = this.kingGreetX + this.offsetX;
        this.y = cy + this.offsetY;
      } else if (t < 29.30) {
        // Brief pause: weapons fully drawn and readied
        this.state = 'weapon_ready';
        this.drawProg = clamp(0.65 + (t - 28.80) / 0.50 * 0.35, 0.65, 1.0);
        this.x = this.kingGreetX + this.offsetX;
        this.y = cy + this.offsetY;
      } else {
        // "Take him." spoken (29.20s): Guard 1 unsheathes and takes purposeful forward step
        this.state = 'step_forward';
        this.drawProg = 1.0;
        const p = easeInOut((t - 29.20) / 1.00);
        if (this.id === 'guard_front') {
          this.x = (this.kingGreetX + this.offsetX) - p * 0.60; // steps forward to cx - 3.20
        } else if (this.id === 'guard_top') {
          this.x = (this.kingGreetX + this.offsetX) - p * 0.25;
        } else {
          this.x = this.kingGreetX + this.offsetX;
        }
        this.y = cy + this.offsetY;
      }
      return;
    }

    // 5. Redesigned Physical Combat Choreography (30.20 – 39.00s)
    this.drawProg = 1.0;
    if (this.id === 'guard_front') {
      // ── GUARD 1 (Aggressive frontline swordsman) ──
      // Beat 1: Charges Rowan aggressively and delivers high overhead slash (30.20 – 31.60s)
      if (t < 31.40) {
        this.state = 'charge';
        const p = easeInOut((t - 30.20) / 1.20);
        this.x = (cx - 3.20) + ((cx - 3.85) - (cx - 3.20)) * p;
        this.y = (cy + 0.55) + ((cy + 0.15) - (cy + 0.55)) * p;
        this.facing = -1;
        this.walkCycle += dt * 8.5;
      } else if (t < 31.60) {
        this.state = 'strike';
        this.x = cx - 3.85;
        this.y = cy + 0.15;
      }
      // Beat 2: Blocked by Rowan, deflected backward, then struck by Rowan's counter at 32.00s (31.60 – 32.80s)
      else if (t < 32.80) {
        this.state = 'recoil';
        const p = easeInOut((t - 31.60) / 1.20);
        this.x = (cx - 3.85) + 0.65 * p; // recoils to cx - 3.20
        this.y = (cy + 0.15) + 0.20 * p;
        this.walkCycle = 0;
      }
      // Beat 3: Recovers, shakes off impact, circles around low flank into two-sided pressure (32.80 – 34.20s)
      else if (t < 34.20) {
        this.state = 'circle_reposition';
        const p = easeInOut((t - 32.80) / 1.40);
        this.x = (cx - 3.20) - 0.65 * p; // circles in from cx - 3.20 to cx - 3.85
        this.y = (cy + 0.35) - 0.10 * Math.sin(p * Math.PI);
        this.facing = -1;
        this.walkCycle += dt * 5.0;
      }
      // Beat 4: Lunges in for second strike, met by Rowan's devastating spin-cleave at 34.70s! (34.20 – 35.40s)
      else if (t < 34.70) {
        this.state = 'strike';
        this.x = cx - 3.85;
        this.y = cy + 0.25;
      } else if (t < 35.10) {
        this.state = 'recoil';
        const p = easeInOut((t - 34.70) / 0.40);
        this.x = (cx - 3.85) + 0.85 * p; // pushed back violently to cx - 3.00
        this.y = cy + 0.25;
      } else if (t < 35.60) {
        this.state = 'collapse';
        this.x = cx - 3.00;
        this.y = cy + 0.25;
      } else if (t < 37.20) {
        this.state = 'dissolving';
        this.dissolveProg = Math.min(1.0, (t - 35.60) / 1.50);
      } else {
        this._dissolved = true;
      }
    } else if (this.id === 'guard_top') {
      // ── GUARD 2 (Agile upper flank swordsman) ──
      // Beat 1 & 2: While Rowan deals with Guard 1, Guard 2 steps forward and advances into high flank (30.20 – 32.80s)
      if (t < 32.80) {
        this.state = 'supporting_move';
        const p = easeInOut((t - 30.20) / 2.60);
        this.x = (cx - 2.45) + ((cx - 3.65) - (cx - 2.45)) * p;
        this.y = (cy - 0.70) + ((cy - 0.40) - (cy - 0.70)) * p;
        this.facing = -1;
        this.walkCycle += dt * 4.5;
      }
      // Beat 3: Charges down from high flank with leaping diagonal slash (32.80 – 34.20s)
      else if (t < 33.30) {
        this.state = 'charge';
        const p = easeInOut((t - 32.80) / 0.50);
        this.x = (cx - 3.65) + ((cx - 4.10) - (cx - 3.65)) * p;
        this.y = (cy - 0.40) + ((cy - 0.22) - (cy - 0.40)) * p;
        this.walkCycle += dt * 8.0;
      } else if (t < 33.70) {
        this.state = 'strike';
        this.x = cx - 4.10;
        this.y = cy - 0.22;
      } else if (t < 34.20) {
        this.state = 'circle_reposition';
        const p = easeInOut((t - 33.70) / 0.50);
        this.x = (cx - 4.10) + 0.35 * p; // recovers stance
        this.y = (cy - 0.22) - 0.10 * p;
      }
      // Beat 4: Watches Rowan fell Guard 1, then repositions for coordinated assault (34.20 – 35.40s)
      else if (t < 35.40) {
        this.state = 'supporting_move';
        const p = easeInOut((t - 34.20) / 1.20);
        this.x = (cx - 3.75) + ((cx - 3.85) - (cx - 3.75)) * p;
        this.y = (cy - 0.32) + ((cy - 0.18) - (cy - 0.32)) * p;
        this.walkCycle += dt * 5.0;
      }
      // Beat 5: Commits to leaping thrust at 35.60s, parried at 35.80s, struck by Rowan's riposte at 36.40s (35.40 – 36.80s)
      else if (t < 35.80) {
        this.state = 'strike';
        this.x = cx - 3.85;
        this.y = cy - 0.18;
      } else if (t < 36.40) {
        this.state = 'recoil'; // deflected by parry
        const p = easeInOut((t - 35.80) / 0.60);
        this.x = (cx - 3.85) + 0.25 * p;
        this.y = cy - 0.18;
      } else if (t < 36.80) {
        this.state = 'recoil'; // hit by Rowan's counter
        const p = easeInOut((t - 36.40) / 0.40);
        this.x = (cx - 3.60) + 0.50 * p; // pushes back to cx - 3.10
        this.y = (cy - 0.18) - 0.15 * p;
      } else if (t < 37.20) {
        this.state = 'collapse';
        this.x = cx - 3.10;
        this.y = cy - 0.33;
      } else if (t < 38.60) {
        this.state = 'dissolving';
        this.dissolveProg = Math.min(1.0, (t - 37.20) / 1.40);
      } else {
        this._dissolved = true;
      }
    } else if (this.id === 'guard_rear_top') {
      // ── GUARD 3 (Tactical rear-upper flank swordsman) ──
      // Beat 1–3: Guard 3 steps out from behind King, circles wide tactical perimeter (30.20 – 34.20s)
      if (t < 34.20) {
        this.state = 'supporting_move';
        const p = easeInOut((t - 30.20) / 4.00);
        this.x = (cx + 0.00) + ((cx - 2.80) - (cx + 0.00)) * p;
        this.y = (cy - 0.55) + ((cy - 0.30) - (cy - 0.55)) * p;
        this.facing = -1;
        this.walkCycle += dt * 4.0;
      }
      // Beat 4–5: Closes distance as front guards engage, moving into striking range (34.20 – 36.80s)
      else if (t < 36.80) {
        this.state = 'circle_reposition';
        const p = easeInOut((t - 34.20) / 2.60);
        this.x = (cx - 2.80) + ((cx - 3.60) - (cx - 2.80)) * p;
        this.y = (cy - 0.30) + ((cy - 0.15) - (cy - 0.30)) * p;
        this.walkCycle += dt * 5.5;
      }
      // Beat 6: Commits downward slash at 37.00s, deflected, caught in Rowan's 360 cleave at 37.40s (36.80 – 38.20s)
      else if (t < 37.40) {
        this.state = 'strike';
        this.x = cx - 3.75;
        this.y = cy - 0.15;
      } else if (t < 37.80) {
        this.state = 'recoil';
        const p = easeInOut((t - 37.40) / 0.40);
        this.x = (cx - 3.75) + 1.10 * p; // recoils to cx - 2.65
        this.y = cy - 0.20;
      } else if (t < 38.20) {
        this.state = 'collapse';
        this.x = cx - 2.65;
        this.y = cy - 0.20;
      } else if (t < 39.00) {
        this.state = 'dissolving';
        this.dissolveProg = Math.min(1.0, (t - 38.20) / 0.80);
      } else {
        this._dissolved = true;
      }
    } else if (this.id === 'guard_rear_bot') {
      // ── GUARD 4 (Heavy rear-lower flank halberdier) ──
      // Beat 1–3: Advances along lower stone path into pincer formation (30.20 – 34.20s)
      if (t < 34.20) {
        this.state = 'supporting_move';
        const p = easeInOut((t - 30.20) / 4.00);
        this.x = (cx + 0.20) + ((cx - 2.70) - (cx + 0.20)) * p;
        this.y = (cy + 0.65) + ((cy + 0.45) - (cy + 0.65)) * p;
        this.facing = -1;
        this.walkCycle += dt * 4.0;
      }
      // Beat 4–5: Closes distance and delivers long halberd thrust at 36.00 – 36.30s (Rowan ducks) (34.20 – 36.80s)
      else if (t < 36.00) {
        this.state = 'circle_reposition';
        const p = easeInOut((t - 34.20) / 1.80);
        this.x = (cx - 2.70) + ((cx - 3.40) - (cx - 2.70)) * p;
        this.y = (cy + 0.45) + ((cy + 0.25) - (cy + 0.45)) * p;
        this.walkCycle += dt * 5.0;
      } else if (t < 36.40) {
        this.state = 'strike'; // horizontal halberd thrust forward
        this.x = cx - 3.40;
        this.y = cy + 0.25;
      } else if (t < 36.80) {
        this.state = 'recoil'; // recovers halberd from whiff
        const p = easeInOut((t - 36.40) / 0.40);
        this.x = (cx - 3.40) + 0.15 * p;
        this.y = cy + 0.25;
      }
      // Beat 6: Coordinated final rush with Guard 3, struck by Rowan's 360 cleave at 37.40s (36.80 – 38.20s)
      else if (t < 37.40) {
        this.state = 'strike';
        this.x = cx - 3.65;
        this.y = cy + 0.20;
      } else if (t < 37.80) {
        this.state = 'recoil';
        const p = easeInOut((t - 37.40) / 0.40);
        this.x = (cx - 3.65) + 1.25 * p; // recoils to cx - 2.40
        this.y = cy + 0.25;
      } else if (t < 38.20) {
        this.state = 'collapse';
        this.x = cx - 2.40;
        this.y = cy + 0.25;
      } else if (t < 39.00) {
        this.state = 'dissolving';
        this.dissolveProg = Math.min(1.0, (t - 38.20) / 0.80);
      } else {
        this._dissolved = true;
      }
    }
  }

  draw(ctx, t) {
    if (this._dissolved || this.state === 'offscreen') return;

    let px = this.x * T;
    let py = this.y * T;

    // Continuous dynamic combat sway for supporting guards
    if (this.state === 'circle_reposition' || this.state === 'supporting_move') {
      px += Math.sin(t * 3.8 + this.breathOffset) * 2.5;
      py += Math.cos(t * 3.2 + this.breathOffset) * 1.8;
    }

    ctx.save();
    ctx.translate(px, py);

    // Dissolution alpha & disintegration
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
    const shadowAlpha = (this.state === 'collapse') ? 0.25 : 0.44;
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 11, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const facing = this.facing;
    const isMoving = (this.state === 'escort' || this.state === 'charge' || this.state === 'circle_reposition' || this.state === 'supporting_move');
    const legSwing = isMoving ? Math.sin(this.walkCycle) * 3.2 : 0;
    const breath = (this.state === 'guard_stand' || this.state === 'alert') ? Math.sin(t * 2.2 + this.breathOffset) * 0.8 : 0;

    // Body posture translations
    if (this.state === 'recoil') {
      ctx.translate(-facing * 2.0, 0);
    } else if (this.state === 'collapse') {
      ctx.translate(0, 5);
    }

    // 1. Cloak
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
    if (this.state === 'collapse') {
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

    // 5. Weapons
    if (this.role === 'swordsman') {
      if (this.state === 'guard_stand' && this.drawProg < 0.1) {
        // Resting sword sheathed at hip
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-facing * 6, -5, 2.5, 14);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-facing * 7, -7, 4, 2.5);
      } else if (this.state === 'guard_stand' || this.state === 'alert' || this.state === 'weapon_ready' || this.state === 'step_forward') {
        // Blended weapon drawing
        const scabbardY = -5;
        const drawnY = -14;
        const curY = scabbardY + (drawnY - scabbardY) * this.drawProg;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 5, curY, 2.5, 18);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 3, curY + 8, 6, 2.5);
      } else if (this.state === 'strike') {
        // Weapon in full downward attack arc
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 4, -8, 16, 3);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 2, -10, 2.5, 7);
      } else if (this.state === 'recoil') {
        // Weapon knocked back/upward
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 3, -20, 2.5, 18);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 1.5, -8, 5.5, 2.5);
      } else if (this.state === 'collapse') {
        // Sword dropped to ground
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 5, 9, 16, 2.5);
      } else {
        // charge / circle_reposition / supporting_move
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(facing * 5, -12, 14, 2.5);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(facing * 3, -13, 2.5, 5);
      }
    } else {
      // HALBERDIER
      if ((this.state === 'guard_stand' || this.state === 'escort') && this.drawProg < 0.1) {
        // Resting halberd held upright against shoulder
        ctx.fillStyle = '#451a03';
        ctx.fillRect(facing * 4, -30, 2.5, 42);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(facing * 4 + 1.25, -38);
        ctx.lineTo(facing * 4 + 6, -30);
        ctx.lineTo(facing * 4 - 4, -30);
        ctx.closePath();
        ctx.fill();
      } else if (this.state === 'alert' || this.state === 'weapon_ready' || this.state === 'step_forward') {
        // Blended lowering of halberd to combat ready angle
        const angle = this.drawProg * 0.45;
        ctx.save();
        ctx.translate(facing * 4, -10);
        ctx.rotate(-facing * angle);
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
      } else if (this.state === 'strike') {
        // Long horizontal halberd thrust forward!
        ctx.fillStyle = '#451a03';
        ctx.fillRect(facing * 2, -8, 28, 2.5);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(facing * 30, -7);
        ctx.lineTo(facing * 24, -12);
        ctx.lineTo(facing * 24, -2);
        ctx.closePath();
        ctx.fill();
      } else if (this.state === 'recoil') {
        // Halberd deflected back
        ctx.fillStyle = '#451a03';
        ctx.fillRect(facing * 2, -32, 2.5, 42);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(facing * 2 + 1.25, -40);
        ctx.lineTo(facing * 2 + 6, -32);
        ctx.lineTo(facing * 2 - 4, -32);
        ctx.closePath();
        ctx.fill();
      } else if (this.state === 'collapse') {
        // Dropped to stones
        ctx.fillStyle = '#451a03';
        ctx.fillRect(facing * 2, 9, 32, 2.5);
      } else {
        // ready / charge / supporting
        ctx.fillStyle = '#451a03';
        ctx.fillRect(facing * 3, -16, 22, 2.5);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(facing * 25, -15);
        ctx.lineTo(facing * 20, -19);
        ctx.lineTo(facing * 20, -11);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Hit flash reaction on combat impact
    if (this.hitFlashTimer > 0) {
      ctx.save();
      ctx.fillStyle = (Math.sin(this.hitFlashTimer * 45) > 0) ? 'rgba(255, 255, 255, 0.50)' : 'rgba(220, 38, 38, 0.40)';
      ctx.fillRect(-8, -16, 16, 24);
      ctx.restore();
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// SMOOTH CONTINUOUS CAMERA INTERPOLATION FOR BETRAYAL CINEMATIC
// ─────────────────────────────────────────────────────────────
function _getBetrayalCameraTarget(t, cx, cy, scx, scy) {
  // 1. BEAT 1: ROWAN RETURNS (0.00 – 5.00s)
  // Rowan emerges from dungeon portal into daylight, walking from cx - 6.2 to cx - 4.5
  if (t < 4.50) {
    const p = smoothstep(t / 4.50);
    return {
      x: (cx - 3.80) + p * 0.40, // cx - 3.80 -> cx - 3.40
      y: (cy - 0.70) + p * 0.20, // cy - 0.70 -> cy - 0.50
      z: 1.08 + p * 0.07         // 1.08 -> 1.15
    };
  }

  // 2. BEAT 2: SURVIVORS EMERGE (4.50 – 11.00s)
  // Camera widens to capture survivors emerging from portal and gathering
  if (t < 11.00) {
    const p = smoothstep((t - 4.50) / 6.50);
    return {
      x: (cx - 3.40) + p * 0.60, // cx - 3.40 -> cx - 2.80
      y: (cy - 0.50) + p * 0.30, // cy - 0.50 -> cy - 0.20
      z: 1.15 + p * 0.20         // 1.15 -> 1.35
    };
  }

  // 3. BEAT 3: KING GREETS ROWAN (11.00 – 17.00s)
  // Subtle organic breathing drift framing Rowan and King
  if (t < 17.00) {
    const p = smoothstep((t - 11.00) / 6.00);
    return {
      x: (cx - 2.80) - p * 0.05, // cx - 2.80 -> cx - 2.85
      y: (cy - 0.20) + p * 0.04, // cy - 0.20 -> cy - 0.16
      z: 1.35 + p * 0.02         // 1.35 -> 1.37
    };
  }

  // 4. BEAT 4: ROWAN QUESTIONS KING (17.00 – 23.50s)
  // Smoothly tightens over 1.5s into close two-shot
  if (t < 23.50) {
    const p = smoothstep(Math.min(1.0, (t - 17.00) / 1.50));
    return {
      x: (cx - 2.85) - p * 0.05, // cx - 2.85 -> cx - 2.90
      y: (cy - 0.16) + p * 0.06, // cy - 0.16 -> cy - 0.10
      z: 1.37 + p * 0.08         // 1.37 -> 1.45
    };
  }

  // 5. BEAT 5: TENSION & FIRST CRACK (23.50 – 27.50s)
  // Camera subtly eases back and reframes toward King's cold posture
  if (t < 27.50) {
    const p = smoothstep((t - 23.50) / 4.00);
    return {
      x: (cx - 2.90) + p * 0.35, // cx - 2.90 -> cx - 2.55
      y: (cy - 0.10) - p * 0.08, // cy - 0.10 -> cy - 0.18
      z: 1.45 - p * 0.07         // 1.45 -> 1.38
    };
  }

  // 6. BEAT 6: KING ORDERS GUARDS (27.50 – 30.50s)
  // Shot 1: Wide establishing betrayal (King + guards + Rowan)
  if (t < 30.20) {
    const p = smoothstep((t - 27.50) / 2.70);
    return {
      x: (cx - 2.55) - p * 0.15, // cx - 2.55 -> cx - 2.70
      y: (cy - 0.18) - p * 0.02, // cy - 0.18 -> cy - 0.20
      z: 1.38 - p * 0.06         // 1.38 -> 1.32 (Wide framing)
    };
  }

  // 7. BEAT 7: REDESIGNED CINEMATIC COMBAT SEQUENCE (30.20 – 39.00s)
  // Compact 10-shot coverage with smooth C0/C1 transitions (no snapping)
  if (t < 39.00) {
    if (t < 31.60) {
      // Shot 2 & 3: Guard 1 charges, Rowan blocks (30.20 – 31.60s)
      const p = smoothstep((t - 30.20) / 1.40);
      return {
        x: (cx - 2.70) - p * 0.90, // cx - 2.70 -> cx - 3.60
        y: (cy - 0.20) + p * 0.08, // cy - 0.20 -> cy - 0.12
        z: 1.32 + p * 0.13         // 1.32 -> 1.45 (Medium three-quarter push)
      };
    } else if (t < 32.80) {
      // Shot 4: Impact on Rowan's first counter; camera tilts slightly to high flank as Guard 2 advances (31.60 – 32.80s)
      const p = smoothstep((t - 31.60) / 1.20);
      return {
        x: (cx - 3.60) - p * 0.05, // cx - 3.60 -> cx - 3.65
        y: (cy - 0.12) - p * 0.04, // cy - 0.12 -> cy - 0.16
        z: 1.45 - p * 0.05         // 1.45 -> 1.40
      };
    } else if (t < 34.20) {
      // Shot 5 & 6: Wider tracking shot — two-direction pressure as Guard 2 attacks and Guard 1 circles (32.80 – 34.20s)
      const p = smoothstep((t - 32.80) / 1.40);
      return {
        x: (cx - 3.65) + p * 0.25, // cx - 3.65 -> cx - 3.40
        y: (cy - 0.16) + p * 0.02, // cy - 0.16 -> cy - 0.14
        z: 1.40 - p * 0.04         // 1.40 -> 1.36
      };
    } else if (t < 35.40) {
      // Shot 7: Impact close shot — Rowan breaks formation, felling Guard 1 (34.20 – 35.40s)
      const p = smoothstep((t - 34.20) / 1.20);
      return {
        x: (cx - 3.40) - p * 0.30, // cx - 3.40 -> cx - 3.70
        y: (cy - 0.14) + p * 0.04, // cy - 0.14 -> cy - 0.10
        z: 1.36 + p * 0.10         // 1.36 -> 1.46
      };
    } else if (t < 36.80) {
      // Shot 8: Dynamic combat tracking — escalation as Rowan parries Guard 2, ducks halberd, counters Guard 2 (35.40 – 36.80s)
      const p = smoothstep((t - 35.40) / 1.40);
      return {
        x: (cx - 3.70) + p * 0.15, // cx - 3.70 -> cx - 3.55
        y: (cy - 0.10) - p * 0.02, // cy - 0.10 -> cy - 0.12
        z: 1.46 - p * 0.04         // 1.46 -> 1.42
      };
    } else if (t < 38.20) {
      // Shot 9: Fast combat climax — Rowan's 360 whirlwind cleave through Guards 3 & 4 (36.80 – 38.20s)
      const p = smoothstep((t - 36.80) / 1.40);
      return {
        x: (cx - 3.55) + p * 0.15, // cx - 3.55 -> cx - 3.40
        y: (cy - 0.12) + p * 0.02, // cy - 0.12 -> cy - 0.10
        z: 1.42 - p * 0.02         // 1.42 -> 1.40
      };
    } else {
      // Shot 10: Smooth pull back to wide aftermath — Rowan standing victorious, guards dissolved, King watching (38.20 – 39.00s)
      const p = smoothstep((t - 38.20) / 0.80);
      return {
        x: (cx - 3.40) + p * 0.30, // cx - 3.40 -> cx - 3.10
        y: (cy - 0.10) - p * 0.05, // cy - 0.10 -> cy - 0.15
        z: 1.40 - p * 0.08         // 1.40 -> 1.32
      };
    }
  }

  // 8. BEAT 8: SURVIVORS ACCUSE KING (39.00 – 45.50s)
  // Camera gently reframes to capture Rowan and the gathering crowd
  if (t < 45.50) {
    const p = smoothstep(Math.min(1.0, (t - 39.00) / 1.80));
    return {
      x: (cx - 3.10) - p * 0.20, // cx - 3.10 -> cx - 3.30
      y: (cy - 0.15) - p * 0.05, // cy - 0.15 -> cy - 0.20
      z: 1.32 - p * 0.02         // 1.32 -> 1.30
    };
  }

  // 9. BEAT 9: ROWAN APPROACHES KING (45.50 – 49.50s)
  // Continuous tracking shot: camera tracks Rowan as he walks forward toward the King
  // Lands seamlessly at (cx - 2.45, cy - 0.20, 1.45) to match Beat 10 start exactly!
  if (t < 49.50) {
    const p = easeInOut(clamp((t - 45.50) / 4.00, 0, 1));
    return {
      x: (cx - 3.30) + p * 0.85, // cx - 3.30 -> cx - 2.45
      y: cy - 0.20,
      z: 1.30 + p * 0.15         // 1.30 -> 1.45
    };
  }

  // 10. BEAT 10: THE SWORD BETRAYAL (49.50 – 52.50s)
  // Stabbing approach (49.50 – 51.15s), 80ms hit-stop (51.15 – 51.23s), then follow-through
  if (t < 52.50) {
    if (t < 51.15) {
      // Betrayer draws weapon, camera gently tightens
      const p = smoothstep((t - 49.50) / 1.65);
      return {
        x: cx - 2.45,
        y: (cy - 0.20) - p * 0.02, // cy - 0.20 -> cy - 0.22
        z: 1.45 + p * 0.07         // 1.45 -> 1.52
      };
    } else if (t < 51.23) {
      // 80ms Hit-stop micro-impulse
      return {
        x: cx - 2.45,
        y: cy - 0.26,
        z: 1.62
      };
    } else {
      // Impact follow-through and settle
      const p = smoothstep((t - 51.23) / 1.27);
      return {
        x: (cx - 2.45) - p * 0.03, // cx - 2.45 -> cx - 2.48
        y: (cy - 0.26) + p * 0.04, // cy - 0.26 -> cy - 0.22
        z: 1.62 - p * 0.04         // 1.62 -> 1.58
      };
    }
  }

  // 11. BEAT 11: ROWAN'S REACTION: "WHY?" (52.50 – 55.00s)
  // Intimate steady composition with emotional breathing room
  if (t < 55.00) {
    const p = smoothstep((t - 52.50) / 2.50);
    return {
      x: (cx - 2.48) - p * 0.02, // cx - 2.48 -> cx - 2.50
      y: cy - 0.22,
      z: 1.58 + p * 0.02         // 1.58 -> 1.60
    };
  }

  // 12. BEAT 12: THE ABSOLUTE'S LORE REVELATION (55.00 – 63.50s)
  // Slow cinematic pull widening to show King standing over mortally wounded Rowan
  if (t < 63.50) {
    const p = smoothstep(Math.min(1.0, (t - 55.00) / 2.50));
    return {
      x: (cx - 2.50) + p * 0.40, // cx - 2.50 -> cx - 2.10
      y: (cy - 0.22) - p * 0.06, // cy - 0.22 -> cy - 0.28
      z: 1.60 - p * 0.15         // 1.60 -> 1.45
    };
  }

  // 13. BEAT 13: ROWAN COLLAPSES & FADE TO BLACK (63.50 – 67.50s)
  // Camera lowers slightly as Rowan collapses
  if (t < 67.50) {
    const p = smoothstep((t - 63.50) / 4.00);
    return {
      x: (cx - 2.10) - p * 0.15, // cx - 2.10 -> cx - 2.25
      y: (cy - 0.28) + p * 0.10, // cy - 0.28 -> cy - 0.18
      z: 1.45 - p * 0.07         // 1.45 -> 1.38
    };
  }

  // 14 & 15. BEAT 14 & 15: SECRET CHAMBER ENTRANCE & REVEAL (67.50 – 74.00s)
  // Camera steadily frames the dais, pillars, and central Red Eye
  if (t < 74.00) {
    return {
      x: scx,
      y: scy - 1.20,
      z: 1.30
    };
  }

  // 16. BEAT 16: FINAL EYE PUSH & BLINK (74.00 – 78.00s) [LOCKED APPROVED SPEC]
  if (t < 78.00) {
    const eyeWorldX = scx * T;
    const eyeWorldY = (scy - 2.8) * T;
    const zoomT = Math.min(1.0, (t - 74.00) / (77.60 - 74.00));
    return {
      x: eyeWorldX / T,
      y: eyeWorldY / T,
      z: 1.70 + zoomT * 1.50
    };
  }

  // 17. BEAT 17: PURE BLACK HOLD (78.00 – 81.00s) [LOCKED APPROVED SPEC]
  const eyeWorldX = scx * T;
  const eyeWorldY = (scy - 2.8) * T;
  return {
    x: eyeWorldX / T,
    y: eyeWorldY / T,
    z: 3.20
  };
}

// ─────────────────────────────────────────────────────────────
// MASTER BETRAYAL CINEMATIC CONTROLLER OBJECT
// ─────────────────────────────────────────────────────────────
export const BetrayalCinematic = {
  active: false,
  finished: false,
  timer: 0,
  shotIndex: 1,
  paused: false,

  start(opts = {}) {
    this.reset();
    const isReplay = !!opts.isReplay;
    CinematicSafety.startCinematic('ending_betrayal', typeof opts === 'object' ? opts : { isReplay });

    if (!isReplay && SaveSystem && SaveSystem.recordCinematicUnlock) {
      SaveSystem.recordCinematicUnlock('ending_betrayal');
    }

    this.active = true;
    this.finished = false;
    this.timer = 0;
    this.shotIndex = 1;
    this.paused = false;

    const P = GameState.P;
    if (P) {
      P.vx = 0;
      P.vy = 0;
      P.attacking = false;
      P.dashing = false;
      P.invulnerable = true;
      P.cinematicPose = 'hidden';
      P.weaponLowered = true;
    }

    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    GameState.ACTIVE_CINEMATIC_TYPE = 'betrayal';

    const curRoom = (GameState.ROOMS && GameState.ROOMS[0]) || { cx: 24, cy: 16 };
    const roomCenterX = P ? P.x : curRoom.cx;
    const roomCenterY = P ? P.y : curRoom.cy;

    const chamberCX = roomCenterX + 80;
    const chamberCY = roomCenterY;

    const outsideWorld = _buildOutsideWorld(roomCenterX, roomCenterY);
    const secretChamber = _buildSecretChamber(chamberCX, chamberCY);

    const rowan = new BetrayalRowanEntity(roomCenterX - 6.2, roomCenterY);
    const king = new BetrayalKingEntity(roomCenterX, roomCenterY);

    const portalC = outsideWorld.archway.c;

    // Rescued survivors with individual stagger delays for organic crowd dynamics
    const survivors = [
      // 1. Rescued ally who becomes the tragic betrayer
      new BetrayalSurvivorEntity({
        id: 'betrayer_ally',
        isBetrayer: true,
        startX: portalC + 0.3,
        startY: roomCenterY,
        targetX: roomCenterX - 3.2,
        targetY: roomCenterY - 0.4,
        followX: roomCenterX - 3.5,
        followY: roomCenterY + 0.15, // Follows Rowan toward King
        emergeStart: 4.8,
        emergeEnd: 8.5,
        tunic: '#3b82f6',
        hair: '#1e293b',
        cx: roomCenterX,
        cy: roomCenterY,
        accuseDelay: 0.0,
        followDelay: 0.0
      }),
      // 2. Rescued warrior (bandaged)
      new BetrayalSurvivorEntity({
        id: 'survivor_warrior',
        startX: portalC + 0.3,
        startY: roomCenterY - 0.3,
        targetX: roomCenterX - 3.8,
        targetY: roomCenterY + 2.0,
        followX: roomCenterX - 4.2,
        followY: roomCenterY + 1.2,
        emergeStart: 5.8,
        emergeEnd: 9.5,
        tunic: '#2563eb',
        hair: '#78350f',
        cx: roomCenterX,
        cy: roomCenterY,
        accuseDelay: 0.35,
        followDelay: 0.25
      }),
      // 3. Rescued elder
      new BetrayalSurvivorEntity({
        id: 'survivor_elder',
        startX: portalC + 0.3,
        startY: roomCenterY + 0.2,
        targetX: roomCenterX - 2.0,
        targetY: roomCenterY - 2.2,
        followX: roomCenterX - 3.8,
        followY: roomCenterY - 1.2,
        emergeStart: 6.8,
        emergeEnd: 10.5,
        tunic: '#15803d',
        hair: '#cbd5e1',
        cx: roomCenterX,
        cy: roomCenterY,
        accuseDelay: 0.70,
        followDelay: 0.50
      }),
      // 4. Rescued youth
      new BetrayalSurvivorEntity({
        id: 'survivor_youth',
        startX: portalC + 0.3,
        startY: roomCenterY + 0.1,
        targetX: roomCenterX - 1.2,
        targetY: roomCenterY + 2.4,
        followX: roomCenterX - 4.4,
        followY: roomCenterY - 0.2,
        emergeStart: 7.8,
        emergeEnd: 11.2,
        tunic: '#8b5cf6',
        hair: '#b45309',
        cx: roomCenterX,
        cy: roomCenterY,
        accuseDelay: 1.05,
        followDelay: 0.75
      })
    ];

    // Royal Guards pre-staged in natural protective formation around King
    const kingStartX = roomCenterX + 13.0;
    const kingGreetX = roomCenterX - 1.2;
    const guards = [
      // Guard 1: Front-lower flank (between King and Rowan) - Nearest attacker
      new BetrayalGuardEntity({
        id: 'guard_front',
        role: 'swordsman',
        offsetX: -1.40,
        offsetY: 0.55,
        cx: roomCenterX,
        cy: roomCenterY,
        kingStartX,
        kingGreetX
      }),
      // Guard 2: Front-upper flank
      new BetrayalGuardEntity({
        id: 'guard_top',
        role: 'swordsman',
        offsetX: -1.25,
        offsetY: -0.70,
        cx: roomCenterX,
        cy: roomCenterY,
        kingStartX,
        kingGreetX
      }),
      // Guard 3: Rear-upper flank
      new BetrayalGuardEntity({
        id: 'guard_rear_top',
        role: 'swordsman',
        offsetX: 1.20,
        offsetY: -0.55,
        cx: roomCenterX,
        cy: roomCenterY,
        kingStartX,
        kingGreetX
      }),
      // Guard 4: Rear-lower flank / path guard
      new BetrayalGuardEntity({
        id: 'guard_rear_bot',
        role: 'halberd',
        offsetX: 1.40,
        offsetY: 0.65,
        cx: roomCenterX,
        cy: roomCenterY,
        kingStartX,
        kingGreetX
      })
    ];

    _activeBetrayalCinematic = {
      timer: 0,
      roomCenterX,
      roomCenterY,
      chamberCX,
      chamberCY,
      outsideWorld,
      secretChamber,
      rowan,
      king,
      survivors,
      guards,
      bloodParticles: [],
      bloodDecals: [],
      impactSparks: [],
      hitStopTimer: 0,
      soundCues: {
        fanfare: false,
        drone: false,
        drawSteel: false,
        clash1: false,
        counter1: false,
        whiff1: false,
        cleave1: false,
        clash2: false,
        whiff2: false,
        counter2: false,
        clash3: false,
        counter3: false,
        stab: false,
        chamberDrone: false,
        eyeBlink: false
      },
      flashAlpha: 0,
      musicVol: 0.60,
      targetMusicVol: 0.60,
      letterbox: {
        amount: 1.0,
        height: 52
      },
      subtitles: {
        text: '',
        alpha: 0,
        isSecret: false
      }
    };

    const initialCam = _getBetrayalCameraTarget(0, roomCenterX, roomCenterY, chamberCX, chamberCY);
    GameState.CAM.tx = initialCam.x; GameState.CAM.ty = initialCam.y; GameState.CAM.tz = initialCam.z;
    GameState.CAM.x = initialCam.x; GameState.CAM.y = initialCam.y; GameState.CAM.z = initialCam.z;

    const touchOv = document.getElementById('touch-overlay');
    if (touchOv) touchOv.style.display = 'none';

    MusicManager.setMasterVolume(0.60);
    MusicManager.play('betrayal', { loop: true, fade: 2.0, volume: 0.60 });
    playSnd('outside_breeze');

    EventBus.emit('cinematic:betrayal_started');
  },

  isActive() {
    return this.active && !!_activeBetrayalCinematic;
  },

  isFinished() {
    return this.finished;
  },

  suppressRealWorld() {
    return this.active;
  },

  canSkip() {
    return this.active && !this.finished;
  },

  // ─────────────────────────────────────────────────────────────
  // 2. TICK: CAMERA CHOREOGRAPHY & SCREENPLAY BEATS
  // ─────────────────────────────────────────────────────────────
  tick(dt) {
    if (!this.active || !_activeBetrayalCinematic) return;
    const cine = _activeBetrayalCinematic;

    // Hit-stop pause on combat impacts (50 - 80ms)
    if (cine.hitStopTimer > 0) {
      cine.hitStopTimer = Math.max(0, cine.hitStopTimer - dt);
      return;
    }

    if (!this.paused) {
      cine.timer += dt;
      this.timer = cine.timer;
      _updateCombatParticles(cine, dt);
    }
    const t = cine.timer;
    const cx = cine.roomCenterX;
    const cy = cine.roomCenterY;
    const scx = cine.chamberCX;
    const scy = cine.chamberCY;

    if (cine.flashAlpha > 0) {
      cine.flashAlpha = Math.max(0, cine.flashAlpha - dt * 2.5);
    }

    // Update characters with continuous animation blending
    cine.rowan.update(dt, t);
    cine.king.update(dt, t);
    cine.survivors.forEach(s => s.update(dt, t));
    cine.guards.forEach(g => g.update(dt, t));

    // Continuous camera interpolation across all beats
    const camTgt = _getBetrayalCameraTarget(t, cx, cy, scx, scy);
    GameState.CAM.tx = camTgt.x;
    GameState.CAM.ty = camTgt.y;
    GameState.CAM.tz = camTgt.z;

    // Center camera under pitch black before secret chamber reveal
    if (t >= 67.50 && t < 68.20) {
      GameState.CAM.x = camTgt.x;
      GameState.CAM.y = camTgt.y;
      GameState.CAM.z = camTgt.z;
    }

    // ─────────────────────────────────────────────────────────
    // CONTINUOUS AUDIO VOLUME MODULATION & AUDIO BRIDGING
    // ─────────────────────────────────────────────────────────
    if (t < 23.50) {
      cine.targetMusicVol = 0.58;
    } else if (t < 27.50) {
      cine.targetMusicVol = 0.38; // Tension builds
    } else if (t < 30.50) {
      cine.targetMusicVol = 0.45; // King orders guards
    } else if (t < 38.50) {
      cine.targetMusicVol = 0.62; // Combat intensity
    } else if (t < 45.50) {
      cine.targetMusicVol = 0.35; // Combat intensity slowly drops, crowd ambience quiets
    } else if (t < 51.15) {
      cine.targetMusicVol = 0.26; // Rowan approach tension
    } else if (t < 55.00) {
      cine.targetMusicVol = 0.08; // Stabbing impact fades into stunned silence
    } else if (t < 63.50) {
      cine.targetMusicVol = 0.22; // Low ominous atmosphere during lore reveal
    } else if (t < 67.50) {
      cine.targetMusicVol = 0.12; // Sound fades as Rowan collapses
    } else if (t < 70.00) {
      cine.targetMusicVol = 0.32; // Low atmospheric tone fades in before chamber emerges
    } else if (t < 77.60) {
      cine.targetMusicVol = 0.40; // True Absolute chamber presence
    } else {
      cine.targetMusicVol = 0.0;
    }

    if (t >= 68.00 && !cine.soundCues.chamberDrone) {
      cine.soundCues.chamberDrone = true;
      playSnd('ominous_drone');
    }

    if (cine.musicVol == null) cine.musicVol = 0.60;
    cine.musicVol += (cine.targetMusicVol - cine.musicVol) * Math.min(1.0, dt * 2.5);
    MusicManager.setMasterVolume(cine.musicVol);

    // ─────────────────────────────────────────────────────────
    // BEAT 1: ROWAN RETURNS (0.00 – 5.00s)
    // ─────────────────────────────────────────────────────────
    if (t < BETRAYAL_TIMELINE.ROWAN_RETURN) {
      this.shotIndex = 1;
      const p = Math.min(1.0, t / 4.0);
      cine.rowan.x = (cx - 6.2) + p * 1.7; // walks smoothly to cx - 4.5
      cine.rowan.y = cy;
      cine.subtitles.alpha = 0;
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 2: SURVIVORS EMERGE (5.00 – 11.00s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.SURVIVORS_EMERGE) {
      this.shotIndex = 2;
      cine.rowan.x = cx - 4.5;
      cine.rowan.y = cy;
      cine.subtitles.alpha = 0;
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 3: KING GREETS ROWAN (11.00 – 17.00s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.KING_GREETING) {
      this.shotIndex = 3;
      cine.rowan.x = cx - 4.5;
      cine.rowan.y = cy;

      if (!cine.soundCues.fanfare) {
        cine.soundCues.fanfare = true;
        playSnd('royal_fanfare');
      }

      cine.subtitles.isSecret = false;
      if (t >= 11.5 && t < 13.0) {
        cine.subtitles.text = '“Rowan.”';
        cine.subtitles.alpha = (t < 11.8) ? (t - 11.5) / 0.3 : (t > 12.7) ? (13.0 - t) / 0.3 : 1.0;
      } else if (t >= 13.4 && t < 15.0) {
        cine.subtitles.text = '“You came back.”';
        cine.subtitles.alpha = (t < 13.7) ? (t - 13.4) / 0.3 : (t > 14.7) ? (15.0 - t) / 0.3 : 1.0;
      } else if (t >= 15.4 && t < 17.0) {
        cine.subtitles.text = '“The people are alive because of you.”';
        cine.subtitles.alpha = (t < 15.7) ? (t - 15.4) / 0.3 : (t > 16.7) ? (17.0 - t) / 0.3 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 4: ROWAN QUESTIONS THE KING (17.00 – 23.50s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.ROWAN_QUESTIONS) {
      this.shotIndex = 4;
      cine.rowan.x = cx - 4.5;
      cine.rowan.y = cy;

      cine.subtitles.isSecret = false;
      if (t >= 17.6 && t < 20.0) {
        cine.subtitles.text = '“Why was I sealed down there?”';
        cine.subtitles.alpha = (t < 18.0) ? (t - 17.6) / 0.4 : (t > 19.5) ? (20.0 - t) / 0.5 : 1.0;
      } else if (t >= 20.8 && t < 23.2) {
        cine.subtitles.text = '“Why did you seal me inside?”';
        cine.subtitles.alpha = (t < 21.2) ? (t - 20.8) / 0.4 : (t > 22.7) ? (23.2 - t) / 0.5 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 5: TENSION & FIRST CRACK (23.50 – 27.50s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.TENSION_AND_CRACK) {
      this.shotIndex = 5;
      cine.rowan.x = cx - 4.5;
      cine.rowan.y = cy;

      if (!cine.soundCues.drone) {
        cine.soundCues.drone = true;
        playSnd('ominous_drone');
      }

      cine.subtitles.isSecret = false;
      if (t >= 24.0 && t < 26.8) {
        cine.subtitles.text = '“There are things you do not yet understand.”';
        cine.subtitles.alpha = (t < 24.4) ? (t - 24.0) / 0.4 : (t > 26.3) ? (26.8 - t) / 0.5 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 6: KING ORDERS GUARDS (27.50 – 30.50s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.KING_ORDERS_GUARDS) {
      this.shotIndex = 6;
      cine.rowan.x = cx - 4.5;
      cine.rowan.y = cy;

      cine.subtitles.isSecret = false;
      if (t >= 27.8 && t < 28.8) {
        cine.subtitles.text = '“Guards.”';
        cine.subtitles.alpha = (t < 28.0) ? (t - 27.8) / 0.2 : (t > 28.6) ? (28.8 - t) / 0.2 : 1.0;
      } else if (t >= 29.2 && t < 30.5) {
        cine.subtitles.text = '“Take him.”';
        cine.subtitles.alpha = (t < 29.4) ? (t - 29.2) / 0.2 : (t > 30.2) ? (30.5 - t) / 0.3 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }

      if (t >= 29.20 && !cine.soundCues.drawSteel) {
        cine.soundCues.drawSteel = true;
        playSnd('sword_swing');
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 7: REDESIGNED CINEMATIC COMBAT SEQUENCE (30.20 – 39.00s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.GUARD_COMBAT) {
      this.shotIndex = 7;
      cine.subtitles.alpha = 0;

      // Rowan's dynamic footwork and physical positioning across the 7 beats:
      if (t < 31.60) {
        // Beat 1: Grounded ready & block at center
        cine.rowan.x = cx - 4.50;
        cine.rowan.y = cy;
      } else if (t < 32.80) {
        // Beat 2: Steps forward into counter-slash on Guard 1
        const p = easeInOut((t - 31.60) / 1.20);
        cine.rowan.x = (cx - 4.50) + 0.20 * Math.sin(p * Math.PI);
        cine.rowan.y = cy;
      } else if (t < 34.20) {
        // Beat 3: Evades Guard 2's high slash, shifts back and up
        const p = easeInOut((t - 32.80) / 1.40);
        cine.rowan.x = (cx - 4.50) - 0.15 * Math.sin(p * Math.PI);
        cine.rowan.y = cy - 0.15 * Math.sin(p * Math.PI);
      } else if (t < 35.40) {
        // Beat 4: Drives inside Guard 1, delivers devastating spin-cleave
        const p = easeInOut((t - 34.20) / 1.20);
        cine.rowan.x = (cx - 4.50) + 0.18 * Math.sin(p * Math.PI);
        cine.rowan.y = cy + 0.10 * Math.sin(p * Math.PI);
      } else if (t < 36.80) {
        // Beat 5: Parries Guard 2, ducks halberd, counters Guard 2
        const p = easeInOut((t - 35.40) / 1.40);
        cine.rowan.x = (cx - 4.50) + 0.15 * Math.sin(p * Math.PI);
        cine.rowan.y = cy - 0.08 * Math.sin(p * Math.PI);
      } else if (t < 38.20) {
        // Beat 6: 360 whirlwind cleave cutting through Guards 3 & 4
        const p = easeInOut((t - 36.80) / 1.40);
        cine.rowan.x = (cx - 4.50) + 0.25 * Math.sin(p * Math.PI);
        cine.rowan.y = cy;
      } else {
        // Beat 7: Settles back into victorious stance at starting coordinate
        cine.rowan.x = cx - 4.50;
        cine.rowan.y = cy;
      }

      // ── BEAT 1: CLASH 1 (31.40s) — Guard 1 strike blocked by Rowan ──
      if (t >= 31.40 && !cine.soundCues.clash1) {
        cine.soundCues.clash1 = true;
        playSnd('weapon_clang');
        const px = (cx - 4.10) * T;
        const py = (cy + 0.10) * T - 6;
        _spawnClashSparks(cine, px, py, 8, false);
        triggerHitStop(0.05);
        cine.hitStopTimer = 0.05;
      }

      // ── BEAT 2: COUNTER 1 (32.00s) — Rowan counters Guard 1 ──
      if (t >= 32.00 && !cine.soundCues.counter1) {
        cine.soundCues.counter1 = true;
        playSnd('enemy_hit');
        playSnd('sword_swing');
        const gx = (cx - 3.55) * T;
        const gy = (cy + 0.20) * T - 4;
        _spawnCombatBlood(cine, gx, gy, 0.25, 'strong', (cy + 0.20) * T + 12);
        _spawnClashSparks(cine, gx, gy, 4, true);
        const g1 = cine.guards.find(g => g.id === 'guard_front');
        if (g1) g1.hitFlashTimer = 0.20;
        triggerHitStop(0.06);
        cine.hitStopTimer = 0.06;
      }

      // ── BEAT 3: EVADE WHIFF (33.10s) — Guard 2 high slash misses ducking Rowan ──
      if (t >= 33.10 && !cine.soundCues.whiff1) {
        cine.soundCues.whiff1 = true;
        playSnd('sword_swing'); // whistling blade cuts empty air above Rowan, zero blood
      }

      // ── BEAT 4: FORMATION BREAK CLEAVE (34.70s) — Rowan spin-cleaves Guard 1 ──
      if (t >= 34.70 && !cine.soundCues.cleave1) {
        cine.soundCues.cleave1 = true;
        playSnd('enemy_hit');
        playSnd('sword_swing');
        const gx = (cx - 3.85) * T;
        const gy = (cy + 0.25) * T - 4;
        _spawnCombatBlood(cine, gx, gy, 0.15, 'heavy', (cy + 0.25) * T + 12);
        _spawnClashSparks(cine, gx, gy, 5, true);
        const g1 = cine.guards.find(g => g.id === 'guard_front');
        if (g1) g1.hitFlashTimer = 0.22;
        triggerHitStop(0.07);
        cine.hitStopTimer = 0.07;
      }

      // ── BEAT 5: PARRY GUARD 2 (35.80s) — Rowan parries Guard 2 thrust ──
      if (t >= 35.80 && !cine.soundCues.clash2) {
        cine.soundCues.clash2 = true;
        playSnd('weapon_clang');
        const px = (cx - 4.10) * T;
        const py = (cy - 0.15) * T - 6;
        _spawnClashSparks(cine, px, py, 7, false);
        triggerHitStop(0.05);
        cine.hitStopTimer = 0.05;
      }

      // ── BEAT 5: HALBERD WHIFF (36.20s) — Guard 4 polearm thrust misses ducking Rowan ──
      if (t >= 36.20 && !cine.soundCues.whiff2) {
        cine.soundCues.whiff2 = true;
        playSnd('sword_swing');
      }

      // ── BEAT 5: COUNTER GUARD 2 (36.40s) — Rowan counter-slashes Guard 2 ──
      if (t >= 36.40 && !cine.soundCues.counter2) {
        cine.soundCues.counter2 = true;
        playSnd('enemy_hit');
        playSnd('sword_swing');
        const gx = (cx - 3.60) * T;
        const gy = (cy - 0.20) * T - 4;
        _spawnCombatBlood(cine, gx, gy, -0.30, 'strong', (cy - 0.20) * T + 12);
        _spawnClashSparks(cine, gx, gy, 4, true);
        const g2 = cine.guards.find(g => g.id === 'guard_top');
        if (g2) g2.hitFlashTimer = 0.22;
        triggerHitStop(0.065);
        cine.hitStopTimer = 0.065;
      }

      // ── BEAT 6: DEFLECT GUARD 3 (37.10s) — Rowan deflects Guard 3 into 360 spin ──
      if (t >= 37.10 && !cine.soundCues.clash3) {
        cine.soundCues.clash3 = true;
        playSnd('weapon_clang');
        const px = (cx - 3.90) * T;
        const py = (cy - 0.12) * T - 6;
        _spawnClashSparks(cine, px, py, 6, false);
      }

      // ── BEAT 6: CLIMAX 360 CLEAVE (37.40s) — Rowan cleaves Guards 3 & 4 simultaneously ──
      if (t >= 37.40 && !cine.soundCues.counter3) {
        cine.soundCues.counter3 = true;
        playSnd('enemy_hit');
        playSnd('sword_swing');

        // Guard 3 (upper flank)
        const g3x = (cx - 3.75) * T;
        const g3y = (cy - 0.15) * T - 4;
        _spawnCombatBlood(cine, g3x, g3y, -0.45, 'heavy', (cy - 0.15) * T + 12);
        _spawnClashSparks(cine, g3x, g3y, 4, true);
        const g3 = cine.guards.find(g => g.id === 'guard_rear_top');
        if (g3) g3.hitFlashTimer = 0.24;

        // Guard 4 (lower flank)
        const g4x = (cx - 3.65) * T;
        const g4y = (cy + 0.20) * T - 4;
        _spawnCombatBlood(cine, g4x, g4y, 0.45, 'heavy', (cy + 0.20) * T + 12);
        _spawnClashSparks(cine, g4x, g4y, 4, true);
        const g4 = cine.guards.find(g => g.id === 'guard_rear_bot');
        if (g4) g4.hitFlashTimer = 0.24;

        triggerHitStop(0.08);
        cine.hitStopTimer = 0.08;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 8: SURVIVORS ACCUSE THE KING (39.00 – 45.50s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.SURVIVORS_ACCUSE_KING) {
      this.shotIndex = 8;
      cine.rowan.x = cx - 4.5;
      cine.rowan.y = cy;

      cine.subtitles.isSecret = false;
      if (t >= 39.5 && t < 41.2) {
        cine.subtitles.text = '“Traitor…”';
        cine.subtitles.alpha = (t < 39.8) ? (t - 39.5) / 0.3 : (t > 40.8) ? (41.2 - t) / 0.4 : 1.0;
      } else if (t >= 41.5 && t < 43.4) {
        cine.subtitles.text = '“The King is the traitor…”';
        cine.subtitles.alpha = (t < 41.8) ? (t - 41.5) / 0.3 : (t > 43.0) ? (43.4 - t) / 0.4 : 1.0;
      } else if (t >= 43.8 && t < 45.5) {
        cine.subtitles.text = '“He sealed him inside… The King lied…”';
        cine.subtitles.alpha = (t < 44.1) ? (t - 43.8) / 0.3 : (t > 45.1) ? (45.5 - t) / 0.4 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 9: ROWAN APPROACHES KING (45.50 – 49.50s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.ROWAN_APPROACHES) {
      this.shotIndex = 9;

      // Rowan walks smoothly from cx - 4.5 to cx - 2.5
      const walkT = (t - BETRAYAL_TIMELINE.SURVIVORS_ACCUSE_KING) / 4.0;
      const eased = easeInOut(clamp(walkT, 0, 1));
      cine.rowan.x = (cx - 4.5) + eased * 2.0;
      cine.rowan.y = cy;

      cine.subtitles.isSecret = false;
      if (t >= 46.2 && t < 47.9) {
        cine.subtitles.text = '“You still think this was about saving them.”';
        cine.subtitles.alpha = (t < 46.5) ? (t - 46.2) / 0.3 : (t > 47.5) ? (47.9 - t) / 0.4 : 1.0;
      } else if (t >= 48.2 && t < 49.5) {
        cine.subtitles.text = '“You don\'t understand what came back with you.”';
        cine.subtitles.alpha = (t < 48.5) ? (t - 48.2) / 0.3 : (t > 49.2) ? (49.5 - t) / 0.3 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 10: THE SWORD BETRAYAL (49.50 – 52.50s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.SWORD_BETRAYAL) {
      this.shotIndex = 10;
      cine.rowan.x = cx - 2.5;
      cine.rowan.y = cy;

      if (t >= 51.15 && !cine.soundCues.stab) {
        cine.soundCues.stab = true;
        playSnd('player_hurt');
        cine.flashAlpha = 0.70;
      }
      cine.subtitles.alpha = 0;
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 11: ROWAN'S REACTION: "WHY?" (52.50 – 55.00s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.ROWAN_WHY) {
      this.shotIndex = 11;
      cine.rowan.x = cx - 2.5;
      cine.rowan.y = cy;

      cine.subtitles.isSecret = false;
      if (t >= 53.2 && t < 54.4) {
        cine.subtitles.text = '“Why?”';
        cine.subtitles.alpha = (t < 53.5) ? (t - 53.2) / 0.3 : (t > 54.0) ? (54.4 - t) / 0.4 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 12: THE ABSOLUTE'S LORE REVELATION (55.00 – 63.50s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.LORE_REVEAL) {
      this.shotIndex = 12;
      cine.rowan.x = cx - 2.5;
      cine.rowan.y = cy;

      cine.subtitles.isSecret = true;
      if (t >= 55.4 && t < 57.8) {
        cine.subtitles.text = '“Because the Absolute commanded it.”';
        cine.subtitles.alpha = (t < 55.7) ? (t - 55.4) / 0.3 : (t > 57.4) ? (57.8 - t) / 0.4 : 1.0;
      } else if (t >= 58.2 && t < 60.8) {
        cine.subtitles.text = '“Every soul you brought out carried a piece of the Abyss.”';
        cine.subtitles.alpha = (t < 58.5) ? (t - 58.2) / 0.3 : (t > 60.4) ? (60.8 - t) / 0.4 : 1.0;
      } else if (t >= 61.2 && t < 63.4) {
        cine.subtitles.text = '“The more you saved… the stronger its voice became.”';
        cine.subtitles.alpha = (t < 61.5) ? (t - 61.2) / 0.3 : (t > 63.0) ? (63.4 - t) / 0.4 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 13: ROWAN COLLAPSES (63.50 – 67.00s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.ROWAN_COLLAPSES) {
      this.shotIndex = 13;
      cine.rowan.x = cx - 2.5;
      cine.rowan.y = cy;
      cine.subtitles.alpha = 0;
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 14: BLACK TRANSITION (67.00 – 69.00s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.BLACK_TRANSITION) {
      this.shotIndex = 14;
      cine.subtitles.alpha = 0;
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 15: TRUE HIDDEN DUNGEON CHAMBER REVEAL (69.00 – 74.00s)
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.ABSOLUTE_CHAMBER) {
      this.shotIndex = 15;

      cine.subtitles.isSecret = true;
      if (t >= 70.2 && t < 72.0) {
        cine.subtitles.text = '“He still doesn\'t know.”';
        cine.subtitles.alpha = (t < 70.5) ? (t - 70.2) / 0.3 : (t > 71.6) ? (72.0 - t) / 0.4 : 1.0;
      } else if (t >= 72.4 && t < 74.0) {
        cine.subtitles.text = '“Let him believe this was betrayal.”';
        cine.subtitles.alpha = (t < 72.7) ? (t - 72.4) / 0.3 : (t > 73.6) ? (74.0 - t) / 0.4 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 16: FINAL EYE PUSH & BLINK (74.00 – 78.00s) [LOCKED APPROVED SPEC]
    // ─────────────────────────────────────────────────────────
    else if (t < BETRAYAL_TIMELINE.FINAL_EYE_ZOOM) {
      this.shotIndex = 16;
      cine.subtitles.alpha = 0;

      if (t >= 77.20 && !cine.soundCues.eyeBlink) {
        cine.soundCues.eyeBlink = true;
        playSnd('eye_blink');
      }
    }

    // ─────────────────────────────────────────────────────────
    // BEAT 17: PURE BLACK HOLD & CREDITS (77.60 – 81.00s) [LOCKED APPROVED SPEC]
    // ─────────────────────────────────────────────────────────
    else {
      this.shotIndex = 17;
      cine.subtitles.alpha = 0;

      if (t >= BETRAYAL_TIMELINE.BLACK_HOLD && !this.finished) {
        this.finished = true;
        this.proceedToCredits();
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. DRAW WORLD ENTITIES
  // ─────────────────────────────────────────────────────────────
  drawWorldEntities(ctx) {
    if (!this.active || !_activeBetrayalCinematic) return;
    const cine = _activeBetrayalCinematic;
    const t = cine.timer;
    const cx = cine.roomCenterX;
    const cy = cine.roomCenterY;
    const scx = cine.chamberCX;
    const scy = cine.chamberCY;

    // SCENE 1: OUTSIDE WORLD (t < 67.50s)
    if (t < 67.50) {
      _renderOutsideWorld(ctx, cine.outsideWorld, t, cx, cy);

      // Floor decals: subtle blood droplets on ancient flagstones (drawn under characters)
      _drawBloodDecals(ctx, cine.bloodDecals);

      // Rescued Survivors
      cine.survivors.forEach(s => s.draw(ctx, t, cine.outsideWorld.archway.c));

      // Guards
      cine.guards.forEach(g => g.draw(ctx, t));

      // Rowan
      cine.rowan.draw(ctx, t);

      // The King
      cine.king.draw(ctx, t);

      // Directional combat blood spray & impact sparks (drawn in world space above characters)
      _drawCombatParticles(ctx, cine.bloodParticles, cine.impactSparks);

      // Hit-flash on betrayal stabbing
      if (cine.flashAlpha > 0.02) {
        ctx.save();
        ctx.fillStyle = `rgba(220, 38, 38, ${cine.flashAlpha * 0.45})`;
        ctx.fillRect((cx - 15) * T, (cy - 12) * T, 35 * T, 24 * T);
        ctx.restore();
      }
      return;
    }

    // SCENE 2: TRUE HIDDEN DUNGEON CHAMBER OF THE ABSOLUTE (t >= 67.50s)
    _renderSecretChamber(ctx, cine.secretChamber, t);

    // Gradual emergence of chamber atmosphere and lighting from deep shadow (68.20s – 70.00s)
    if (t >= 68.20 && t < 70.00) {
      const revealDarkness = 1.0 - smoothstep((t - 68.20) / 1.80);
      ctx.save();
      ctx.fillStyle = `rgba(3, 2, 7, ${revealDarkness * 0.85})`;
      ctx.fillRect((scx - 22) * T, (scy - 16) * T, 44 * T, 32 * T);
      ctx.restore();
    }

    const eyeWorldX = scx * T;
    const eyeWorldY = (scy - 2.8) * T;

    // In Shot 16 (74.00s – 77.60s), room darkens smoothly around the eye [LOCKED APPROVED SPEC]
    if (t >= 74.00 && t < 77.60) {
      const darkProg = Math.min(1.0, (t - 74.00) / (77.20 - 74.00));
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${darkProg * 0.94})`;
      ctx.fillRect((scx - 22) * T, (scy - 16) * T, 44 * T, 32 * T);
      ctx.restore();
    }

    // Blink animation [LOCKED APPROVED SPEC]
    let blinkProg = 0;
    if (t >= 77.20 && t < 77.60) {
      blinkProg = Math.min(1.0, (t - 77.20) / 0.38);
    }

    const pulse = 1.0 + Math.sin(t * 3.5) * 0.05;
    const eyeScale = (t >= 74.00)
      ? Math.min(3.2, 1.8 + (t - 74.00) * 0.38)
      : 1.8;

    // Eye awakens gently as chamber emerges, then operates in full glory until blink
    if (t >= 69.20 && t < 70.20) {
      const eyeAwaken = smoothstep((t - 69.20) / 1.00);
      _drawPixelEye(ctx, eyeWorldX, eyeWorldY, 1.8 * eyeAwaken, 0, t);
    } else if (t >= 70.20 && t < 77.60) {
      _drawPixelEye(ctx, eyeWorldX, eyeWorldY, eyeScale * pulse, blinkProg, t);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 4. DRAW SCREEN-SPACE OVERLAYS (Letterbox & Subtitles)
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!this.active || !_activeBetrayalCinematic) return;
    const cine = _activeBetrayalCinematic;
    const t = cine.timer;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 1. SMOOTH CONTROLLED FADES & BLACK TRANSITIONS
    // Rowan collapse into black (66.00s – 67.50s)
    if (t >= 66.00 && t < 67.50) {
      const fadeAlpha = smoothstep((t - 66.00) / 1.50);
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, LW, LH);
    }
    // Pure black hold while camera centers into secret chamber (67.50s – 68.20s)
    else if (t >= 67.50 && t < 68.20) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);
    }
    // Chamber emerges from black silhouette (68.20s – 70.00s)
    else if (t >= 68.20 && t < 70.00) {
      const chamberFade = 1.0 - smoothstep((t - 68.20) / 1.80);
      ctx.fillStyle = `rgba(0, 0, 0, ${chamberFade})`;
      ctx.fillRect(0, 0, LW, LH);
    }
    // Post-blink pure black hold (77.60s – 81.00s) [LOCKED APPROVED SPEC]
    else if (t >= 77.60) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);
      ctx.restore();
      return;
    }

    // 2. CINEMATIC LETTERBOX BARS
    const barH = cine.letterbox.height;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, LW, barH);
    ctx.fillRect(0, LH - barH, LW, barH);

    // Subtle crimson-violet separator lines for Betrayal
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.40)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(LW, barH);
    ctx.moveTo(0, LH - barH);
    ctx.lineTo(LW, LH - barH);
    ctx.stroke();

    // 3. CINEMATIC SUBTITLES
    if (cine.subtitles && cine.subtitles.alpha > 0.02 && cine.subtitles.text) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, Math.max(0, cine.subtitles.alpha));

      const subY = LH - Math.round(barH * 0.44);
      const isChamber = cine.subtitles.isSecret;

      ctx.font = 'italic 17px "Crimson Text", Georgia, serif';
      const textW = ctx.measureText(cine.subtitles.text).width;

      const padX = 28;
      const bgGrad = ctx.createRadialGradient(LW / 2, subY - 4, 10, LW / 2, subY - 4, textW / 2 + padX);
      bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
      bgGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.48)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(LW / 2 - textW / 2 - padX, subY - 18, textW + padX * 2, 26);

      ctx.fillStyle = '#000000';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(cine.subtitles.text, LW / 2, subY);

      // Text color: chilling silver-white for chamber/lore, warm gold for public dialogue
      ctx.fillStyle = isChamber ? '#f1f5f9' : '#fef3c7';
      ctx.shadowBlur = 0;
      ctx.fillText(cine.subtitles.text, LW / 2, subY);

      ctx.restore();
    }

    // 4. SUBTLE SKIP PROMPT
    if (this.canSkip() && CinematicSafety.shouldShowSkipHint() && t < BETRAYAL_TIMELINE.ROWAN_COLLAPSES) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.fillText(CinematicSafety.isReplay() ? '[ Esc / Click to Exit Archive ]' : '[ Space / Enter / Click to Skip ]', LW - 20, LH - 16);
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // 5. INPUT & SEEK HANDLERS
  // ─────────────────────────────────────────────────────────────
  canSkip() {
    return this.active && !this.finished && CinematicSafety.canSkip();
  },

  handleClick(mx, my) {
    if (!this.active) return false;
    if (CinematicSafety.isReplay()) {
      if (CinematicSafety.isValidSkipClick()) {
        this.reset();
        CinematicSafety.finishReplay();
      }
      return true;
    }
    if (CinematicSafety.isValidSkipClick()) {
      this.skip();
    }
    return true;
  },

  handleKey(key) {
    if (!this.active) return false;
    if (CinematicSafety.isReplay()) {
      if (key === 'Escape' || key === ' ' || key === 'Enter') {
        this.reset();
        CinematicSafety.finishReplay();
      }
      return true;
    }
    if (key === ' ' || key === 'Enter' || key === 'Escape') {
      if (CinematicSafety.isValidSkipKey(key)) {
        this.skip();
      }
      return true;
    }
    return true; // Consume keys
  },

  skip() {
    if (!this.active || this.finished) return;
    if (CinematicSafety.isReplay()) {
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }
    _betrayalFastForwarding = true;
    this.proceedToCredits();
  },

  seek(targetTime, andPause = false) {
    if (!this.active || !_activeBetrayalCinematic) {
      this.start();
    }
    if (GameState.P) {
      GameState.P.dead = false;
      GameState.P.dying = false;
      GameState.P.san = 100;
      GameState.P.hp = 10;
    }
    GameState.SANITY = 100;
    GameState.HP = 10;
    _activeBetrayalCinematic.timer = targetTime;
    this.timer = targetTime;
    this.paused = andPause;
    _activeBetrayalCinematic.hitStopTimer = 0;
    if (targetTime >= 40.0) {
      _activeBetrayalCinematic.bloodParticles = [];
      _activeBetrayalCinematic.bloodDecals = [];
      _activeBetrayalCinematic.impactSparks = [];
    }
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    _betrayalFastForwarding = true;
    _activeBetrayalCinematic.rowan.update(0.01, targetTime);
    _activeBetrayalCinematic.king.update(0.01, targetTime);
    _activeBetrayalCinematic.survivors.forEach(s => s.update(0.01, targetTime));
    _activeBetrayalCinematic.guards.forEach(g => g.update(0.01, targetTime));
    _betrayalFastForwarding = false;
    this.tick(0.001);
    GameState.CAM.x = GameState.CAM.tx;
    GameState.CAM.y = GameState.CAM.ty;
    GameState.CAM.z = GameState.CAM.tz;
  },

  unpause() {
    this.paused = false;
  },

  // ─────────────────────────────────────────────────────────────
  // 6. CREDITS HANDOFF & CLEANUP
  // ─────────────────────────────────────────────────────────────
  proceedToCredits() {
    this.active = false;
    this.finished = true;
    if (_activeBetrayalCinematic) {
      _activeBetrayalCinematic.bloodParticles = [];
      _activeBetrayalCinematic.bloodDecals = [];
      _activeBetrayalCinematic.impactSparks = [];
      _activeBetrayalCinematic.hitStopTimer = 0;
    }
    _activeBetrayalCinematic = null;
    _betrayalFastForwarding = false;

    GameState.CINEMATIC_ACTIVE = false;

    if (CinematicSafety.isReplay()) {
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }

    EpilogueCinematic.start('betrayal', () => {
      const touchOv = document.getElementById('touch-overlay');
      if (touchOv && typeof window !== 'undefined' && window.MobileControls && window.MobileControls.isMobile && window.MobileControls.isMobile()) {
        touchOv.style.display = 'block';
      }
      Credits.start('betrayal');
    });
  },

  reset() {
    this.active = false;
    this.finished = false;
    this.timer = 0;
    this.shotIndex = 1;
    if (_activeBetrayalCinematic) {
      _activeBetrayalCinematic.bloodParticles = [];
      _activeBetrayalCinematic.bloodDecals = [];
      _activeBetrayalCinematic.impactSparks = [];
      _activeBetrayalCinematic.hitStopTimer = 0;
    }
    _activeBetrayalCinematic = null;
    _betrayalFastForwarding = false;
  }
};

if (typeof window !== 'undefined') {
  window.BetrayalCinematic = BetrayalCinematic;
  window.betrayalSeek = (t, andPause = false) => BetrayalCinematic.seek(t, andPause);
  window.triggerBetrayalEnding = () => BetrayalCinematic.start();
  window.startBetrayalEnding = () => BetrayalCinematic.start();
}
