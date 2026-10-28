// =====================================================================
//  DUNGEON BREAK — js/cinematics/HeroCinematic.js
//  Authoritative Master Hero Ending Cinematic (Surgical Refinement):
//  TWO EMOTIONAL HALVES: REWARD & PEACE -> SECRET PRIVATE REVELATION
//
//  STORY CANON:
//  - Rowan was abandoned by deserters and sealed in a 10-floor dungeon.
//  - The dungeon was a deliberate crucible/trial by an unknown entity.
//  - Rowan retains his humanity, defeats the Abyss Warden, and emerges into daylight.
//  - HALF 1 (THE REWARD): Daylight, open sky, civilization, guards, the King, celebration,
//    gratitude, peace. Survivors physically emerge from the dungeon portal. Rowan is free.
//  - HALF 2 (THE SECRET REVELATION): After the public celebration, the King quietly departs
//    and walks to a secret hidden stone chamber deep within the citadel.
//    There, the approved Shattered Mind pixel red eye awaits him in an altar alcove.
//    Rowan remains outside with his people.
//    The King stands before the eye and reports privately:
//    "He came back from the Abyss."
//    (pause)
//    "The preparations you asked for are finished."
//  - Camera zooms onto the eye. Direct stare. BLINK.
//  - CUT TO BLACK. Clean handoff to Credits.start('hero').
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T, clamp, easeInOut } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { EventBus } from '../core/EventBus.js';
import { MusicManager } from '../audio/MusicManager.js';
import { Credits } from './Credits.js';
import { EpilogueCinematic } from './EpilogueCinematic.js';
import { CinematicSafety } from './CinematicSafety.js';
import { SaveSystem } from '../systems/SaveSystem.js';

let _activeHeroCinematic = null;
let _heroFinished = false;
let _heroFastForwarding = false;

function playSnd(name) {
  if (_heroFastForwarding) return;
  SoundManager.snd(name);
}

// ─────────────────────────────────────────────────────────────
// MASTER TIMELINE CONFIGURATION (Surgical Polish Flow)
// ─────────────────────────────────────────────────────────────
export const HERO_TIMELINE = {
  OUTSIDE_REVEAL: 7.00,        // 0.00 – 7.00s: Rowan emerges alone into daylight; freedom moment; survivors emerge from dungeon portal
  PEOPLE_NOTICE: 13.50,        // 7.00 – 13.50s: Survivors reach avenue; townsfolk welcome them; guards march in physical cadence
  KING_ARRIVAL: 19.50,         // 13.50 – 19.50s: The King arrives along the paved avenue with vanguard & halberdiers
  KING_GREETING: 29.50,        // 19.50 – 29.50s: King greets Rowan warmly: "Rowan." -> "You returned." -> "You saved them." -> "The people of the dungeon owe you their lives."
  CELEBRATION: 36.50,          // 29.50 – 36.50s: Peaceful community celebration & Rowan's emotional beat among his people (pure daylight harmony)
  KING_DEPARTURE_LINE: 41.50,  // 36.50 – 41.50s: King turns to Rowan: "I have some things to attend to, Rowan. Have fun here. I will meet you soon."
  KING_WALKS_AWAY: 46.00,      // 41.50 – 46.00s: King turns and physically walks away along avenue; camera gently follows; Rowan & crowd remain
  TRANSITION_TO_CHAMBER: 48.50,// 46.00 – 48.50s: King enters citadel portal; daylight dims into stone corridor shadow; smooth transition
  CHAMBER_REVEAL: 52.50,       // 48.50 – 52.50s: Establishing shot of secret chamber; King walks inside, approaches the central Eye and stops
  SECRET_LINE_1: 56.00,        // 52.50 – 56.00s: King speaks: "He came back from the Abyss." -> pause
  SECRET_LINE_2: 60.00,        // 56.00 – 60.00s: King speaks: "The preparations you asked for are finished."
  EYE_CLOSEUP: 63.75,          // 60.00 – 63.75s: Slow cinematic push onto the Eye; room darkens; direct camera stare; BLINK at 63.35s - 63.75s
  BLACK_HOLD: 66.75            // 63.75 – 66.75s: Cut to pure black; hold silence; clean transition to Credits.start('hero')
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
// PIXEL-ART TILE & ARCHITECTURE DRAWING HELPERS (SHATTERED MIND SPEC)
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
  lg.addColorStop(0, 'rgba(249, 115, 22, 0.28)');
  lg.addColorStop(0.45, 'rgba(234, 88, 12, 0.12)');
  lg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(px + 16, py + 10, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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

/** Build the Standalone Secret Chamber (Recreating Shattered Mind Arena environment) */
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

// ─────────────────────────────────────────────────────────────
// ENVIRONMENT GENERATION: THE OUTSIDE WORLD & SETTLEMENT
// ─────────────────────────────────────────────────────────────
function _buildOutsideWorld(cx, cy) {
  const tiles = [];
  const roadTiles = [];
  const trees = [];

  const spanR = 10;
  const spanC = 28;

  // Grid setup:
  // cy is the stone avenue row.
  // Rows cy-1, cy, cy+1 form the stone road:
  // - dc < -2: ancient dark dungeon pathway emerging from the cliff threshold
  // - -2 <= dc <= 0: transitional stone pavers
  // - dc > 0: royal paved cobblestone avenue extending east into citadel
  // Left cliff bluff (dc <= -6): mountain rockface where the dungeon portal is carved.
  // Open horizon & meadow (dc > -6): ground exists from dr = -2 down to dr = +7.
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
        roadTiles.push({ r: tr, c: tc, type: roadType, seed });
      } else if (isArchCliff) {
        tiles.push({ r: tr, c: tc, type: 'bluff', seed });
      } else if (isMeadowGround) {
        let groundType = 'grass';
        if (dc <= -3) groundType = 'dungeon_scree'; // Dark slate scree, pebbles & damp soil
        else if (dc <= 0) groundType = 'transition_ground'; // Subtle merge into grass
        tiles.push({ r: tr, c: tc, type: groundType, seed });
      }

      // Trees: Only in foreground meadow (away from dungeon threshold) and high atop cliff ridge
      if (isMeadowGround && dc >= 1 && dr >= 5 && dr <= 7 && dc <= 14) {
        if (seed % 4 === 0) {
          trees.push({
            r: tr,
            c: tc,
            layer: 'fg',
            h: 38 + (seed % 3) * 6,
            w: 26 + (seed % 2) * 4
          });
        }
      } else if (isArchCliff && dr <= -4 && dc <= -8) {
        if (seed % 3 === 0) {
          trees.push({
            r: tr,
            c: tc,
            layer: 'cliff',
            h: 32 + (seed % 3) * 4,
            w: 22 + (seed % 2) * 4
          });
        }
      }
    }
  }

  // Sort trees back-to-front by row
  trees.sort((a, b) => a.r - b.r);

  // Settlement Props (Banners, Lanterns)
  const banners = [
    { c: Math.round(cx) - 3, r: Math.round(cy) - 2.0, color: '#f59e0b', crest: '#1e3a8a' },
    { c: Math.round(cx) + 2, r: Math.round(cy) - 2.0, color: '#f59e0b', crest: '#1e3a8a' },
    { c: Math.round(cx) + 7, r: Math.round(cy) - 2.0, color: '#f59e0b', crest: '#1e3a8a' },
    { c: Math.round(cx) + 12, r: Math.round(cy) - 2.0, color: '#f59e0b', crest: '#1e3a8a' }
  ];

  const lanterns = [
    { c: Math.round(cx) - 6.5, r: Math.round(cy) - 1.8 },
    { c: Math.round(cx) - 6.5, r: Math.round(cy) + 1.8 },
    { c: Math.round(cx) + 0.5, r: Math.round(cy) - 1.8 },
    { c: Math.round(cx) + 0.5, r: Math.round(cy) + 1.8 },
    { c: Math.round(cx) + 8.5, r: Math.round(cy) - 1.8 },
    { c: Math.round(cx) + 8.5, r: Math.round(cy) + 1.8 }
  ];

  // Distant clouds
  const clouds = Array.from({ length: 8 }, (_, i) => ({
    x: (i * 180) % 1400 - 200,
    y: -300 + (i % 3) * 36,
    w: 130 + (i % 4) * 35,
    h: 44 + (i % 3) * 12,
    speed: 7 + (i % 3) * 4
  }));

  // Ambient Birds soaring in the sky
  const birds = Array.from({ length: 5 }, (_, i) => ({
    x: 80 + i * 220,
    y: -220 + (i % 4) * 28,
    speed: 26 + i * 8,
    flapPhase: i * 1.5
  }));

  // Pollen / golden daylight motes
  const motes = Array.from({ length: 45 }, () => ({
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

// ─────────────────────────────────────────────────────────────
// ACTOR DEFINITIONS (Grounded physically on scene geometry)
// ─────────────────────────────────────────────────────────────

class HeroGuard {
  constructor(cfg) {
    this.id = cfg.id;
    this.role = cfg.role || 'swordsman'; // 'swordsman' or 'halberd'
    this.startX = cfg.startX;
    this.startY = cfg.startY;
    this.targetX = cfg.targetX;
    this.targetY = cfg.targetY;
    this.x = cfg.startX;
    this.y = cfg.startY;
    this.facing = cfg.facing || -1; // facing left toward Rowan
    this.moveStart = cfg.moveStart || 7.5;
    this.moveEnd = cfg.moveEnd || 12.5;
    this.state = 'offscreen';
    this.walkCycle = 0;
    this.bannerPhase = Math.random() * Math.PI * 2;
  }

  update(dt, t) {
    if (t < this.moveStart) {
      this.state = 'offscreen';
      this.x = this.startX;
      this.y = this.startY;
      return;
    }

    if (t < this.moveEnd) {
      this.state = 'walk';
      const p = easeInOut((t - this.moveStart) / (this.moveEnd - this.moveStart));
      this.x = this.startX + (this.targetX - this.startX) * p;
      this.y = this.startY + (this.targetY - this.startY) * p;
      this.walkCycle += dt * 7.5;
    } else {
      this.state = 'salute';
      this.x = this.targetX;
      this.y = this.targetY;
      this.walkCycle = 0;
    }
  }

  draw(ctx) {
    if (this.state === 'offscreen') return;

    const px = this.x * T;
    const py = this.y * T;

    ctx.save();
    ctx.translate(px, py);

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 11, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const facing = this.facing;
    const legSwing = (this.state === 'walk') ? Math.sin(this.walkCycle) * 3.5 : 0;

    // 1. Citadel Cloak (Deep Royal Navy / Charcoal)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(-facing * 5, -8);
    ctx.lineTo(-facing * 12, 6 + Math.sin(this.walkCycle + 1) * 2);
    ctx.lineTo(-facing * 7, 13);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();

    // 2. Greaves & Sabatons
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5 - legSwing, 6, 3.5, 7);
    ctx.fillRect(1.5 + legSwing, 6, 3.5, 7);

    // 3. Gothic Cuirass
    ctx.fillStyle = '#334155';
    ctx.fillRect(-7, -9, 14, 15);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-6, -8, 12, 7);

    // Gilded breastplate trims
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-6, -2, 12, 1.5);

    // 4. Pauldrons
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-10, -9, 3.5, 6);
    ctx.fillRect(6.5, -9, 3.5, 6);

    // 5. Great Helmet & Flowing Crest
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -15, 6, 0, Math.PI * 2);
    ctx.fill();

    // Plume (Crimson honor feather)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(-facing * 2, -22, 5, 2.5, facing * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Visor slit
    ctx.fillStyle = '#020617';
    ctx.fillRect(facing === 1 ? 0 : -4.5, -15, 4.5, 1.5);

    // 6. Weapon & Shield
    if (this.role === 'swordsman') {
      // Tower Kite Shield held outward
      ctx.save();
      ctx.translate(-facing * 6, 0);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-3, -11);
      ctx.lineTo(4, -11);
      ctx.lineTo(5, 3);
      ctx.lineTo(0, 14);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Golden chevron
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(3, -1);
      ctx.lineTo(0, 4);
      ctx.lineTo(-3, -1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Sword in salute / sheath
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(facing * 6, -16, 2, 20);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(facing * 6 - 2, -4, 6, 2);
    } else {
      // Halberd / Long Spear held tall in honor salute
      ctx.fillStyle = '#451a03';
      ctx.fillRect(facing * 5, -34, 2.5, 46);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(facing * 5 + 1.25, -42);
      ctx.lineTo(facing * 5 + 6, -34);
      ctx.lineTo(facing * 5 - 4, -34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(facing * 5 + 2, -33, 8 + Math.sin(this.bannerPhase + this.walkCycle) * 3, 3);
    }

    ctx.restore();
  }
}

class HeroVillager {
  constructor(cfg) {
    this.id = cfg.id || 'villager';
    this.isSurvivor = !!cfg.isSurvivor;
    this.type = cfg.type || 'survivor';
    this.startX = cfg.startX;
    this.startY = cfg.startY;
    this.targetX = cfg.targetX;
    this.targetY = cfg.targetY;
    this.x = this.startX;
    this.y = this.startY;
    this.facing = cfg.facing || (this.isSurvivor ? 1 : -1);
    this.cheerPhase = cfg.phase || Math.random() * Math.PI * 2;
    this.tunicColor = cfg.tunic || '#2563eb';
    this.hairColor = cfg.hair || '#78350f';
    this.emergeStart = cfg.emergeStart || 4.0;
    this.emergeEnd = cfg.emergeEnd || 10.0;
    this.state = 'hidden';
    this.walkCycle = 0;
    this.speed = cfg.speed || 1.0;
  }

  update(dt, t) {
    this.cheerPhase += dt * 4.5;

    if (t < this.emergeStart) {
      this.state = 'hidden';
      this.x = this.startX;
      this.y = this.startY;
      return;
    }

    if (t < this.emergeEnd) {
      this.state = 'walking';
      const dur = this.emergeEnd - this.emergeStart;
      const prog = clamp((t - this.emergeStart) / dur, 0, 1);
      const eased = easeInOut(prog);
      this.x = this.startX + (this.targetX - this.startX) * eased;
      this.y = this.startY + (this.targetY - this.startY) * eased;
      this.walkCycle += dt * 6.5 * this.speed;
      this.facing = (this.targetX >= this.startX) ? 1 : -1;
    } else {
      this.state = 'celebrating';
      this.x = this.targetX;
      this.y = this.targetY;
      this.walkCycle = 0;
      this.facing = (this.targetX < (this.targetX + 0.1)) ? 1 : -1;
    }
  }

  draw(ctx, t, archwayC) {
    if (this.state === 'hidden') return;

    // For dungeon survivors emerging from dark portal threshold,
    // fade in smoothly as they step across the threshold into the daylight!
    let alpha = 1.0;
    if (this.isSurvivor) {
      alpha = clamp((this.x - this.startX) / 1.5, 0, 1);
      if (alpha <= 0.03) return;
    }

    const px = this.x * T;
    const py = this.y * T;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 11, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const isCheering = (this.state === 'celebrating') && (t >= HERO_TIMELINE.PEOPLE_NOTICE);
    const legSwing = (this.state === 'walking') ? Math.sin(this.walkCycle) * 3.5 : 0;
    const hop = isCheering ? Math.abs(Math.sin(this.cheerPhase)) * 3 : 0;
    const armWave = isCheering ? Math.sin(this.cheerPhase) * 6 : 0;

    // Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-4 - legSwing, 4 - hop, 3.5, 7);
    ctx.fillRect(1 + legSwing, 4 - hop, 3.5, 7);

    // Tunic / Dress
    ctx.fillStyle = this.tunicColor;
    ctx.fillRect(-6, -7 - hop, 12, 12);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-4, -15 - hop, 8, 8);

    // Hair / Cap
    ctx.fillStyle = this.hairColor;
    ctx.fillRect(-5, -17 - hop, 10, 4);

    if (this.type === 'survivor_ally') {
      // Bandaged warrior, raising arms in triumph
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-4, -13 - hop, 8, 2);
      ctx.fillStyle = this.tunicColor;
      ctx.fillRect(-8, -12 - hop - armWave, 3, 9);
      ctx.fillRect(5, -12 - hop + armWave, 3, 9);
    } else if (this.type === 'survivor_injured') {
      // Bandaged shoulder, clutching arm in relief
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5, -6 - hop, 10, 2.5);
      ctx.fillStyle = this.tunicColor;
      ctx.fillRect(-6, -4 - hop, 4, 6);
      ctx.fillRect(3, -7 - hop - armWave * 0.4, 3, 7);
    } else if (this.type === 'villager_child') {
      // Holding up wild flower blossoms
      ctx.fillStyle = '#fde047';
      ctx.fillRect(this.facing * 5, -14 - hop - armWave, 3, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(this.facing * 5 + 1, -11 - hop - armWave, 1.5, 5);
    } else {
      // Clapping / waving arms
      ctx.fillStyle = this.tunicColor;
      ctx.fillRect(-7, -7 - hop - armWave * 0.5, 3, 7);
      ctx.fillRect(4, -7 - hop + armWave * 0.5, 3, 7);
    }

    ctx.restore();
  }
}

class HeroKing {
  constructor(cx, cy, chamberCX = cx + 80, chamberCY = cy) {
    this.startX = cx + 13.0; // Enters from far right off-screen along avenue
    this.startY = cy;
    this.greetingX = cx - 1.8;
    this.greetingY = cy;
    this.colonnadeExitX = cx + 10.0; // Citadel entrance portico
    this.chamberStartX = chamberCX - 7.5; // Enters secret chamber from left
    this.chamberStopX = chamberCX - 2.5; // Natural standing point before the Eye
    this.chamberY = chamberCY;

    this.x = this.startX;
    this.y = this.startY;
    this.facing = -1; // starts facing left toward Rowan
    this.walkCycle = 0;
    this.cloakWave = 0;
    this.pose = 'offscreen'; // 'offscreen', 'walk', 'greet', 'celebrate', 'private_report'
  }

  update(dt, t) {
    this.cloakWave += dt * 3.2;

    if (t < HERO_TIMELINE.PEOPLE_NOTICE) {
      // King has not entered yet (Rowan freedom moment & people noticing)
      this.pose = 'offscreen';
      this.x = this.startX;
      this.y = this.startY;
      return;
    }

    if (t < HERO_TIMELINE.KING_ARRIVAL) {
      // Walking in along the cobblestone avenue
      const moveDur = HERO_TIMELINE.KING_ARRIVAL - HERO_TIMELINE.PEOPLE_NOTICE;
      const prog = clamp((t - HERO_TIMELINE.PEOPLE_NOTICE) / moveDur, 0, 1);
      const eased = easeInOut(prog);
      this.x = this.startX + (this.greetingX - this.startX) * eased;
      this.y = this.startY;
      this.facing = -1;
      this.pose = (prog < 0.98) ? 'walk' : 'greet';
      if (this.pose === 'walk') this.walkCycle += dt * 4.8;
    } else if (t < HERO_TIMELINE.KING_GREETING) {
      // Standing and greeting Rowan warmly
      this.x = this.greetingX;
      this.y = this.greetingY;
      this.facing = -1;
      this.pose = 'greet';
      this.walkCycle = 0;
    } else if (t < HERO_TIMELINE.CELEBRATION) {
      // Celebrating beside Rowan, proud ruler
      this.x = this.greetingX;
      this.y = this.greetingY;
      this.facing = -1;
      this.pose = 'celebrate';
      this.walkCycle = 0;
    } else if (t < HERO_TIMELINE.KING_DEPARTURE_LINE) {
      // KING DEPARTURE LINE: King turns to speak departure line calmly to Rowan
      this.x = this.greetingX;
      this.y = this.greetingY;
      this.facing = -1;
      this.pose = 'greet'; // friendly, calm conversation pose
      this.walkCycle = 0;
    } else if (t < HERO_TIMELINE.KING_WALKS_AWAY) {
      // KING WALKS AWAY: Turns right, visibly walks away eastward along avenue away from Rowan & crowd
      const walkDur = HERO_TIMELINE.KING_WALKS_AWAY - HERO_TIMELINE.KING_DEPARTURE_LINE;
      const prog = clamp((t - HERO_TIMELINE.KING_DEPARTURE_LINE) / walkDur, 0, 1);
      const eased = easeInOut(prog);
      this.x = this.greetingX + (this.colonnadeExitX - this.greetingX) * eased;
      this.y = this.startY;
      this.facing = 1; // Facing right toward citadel archway
      this.pose = 'walk';
      this.walkCycle += dt * 4.2;
    } else if (t < HERO_TIMELINE.TRANSITION_TO_CHAMBER) {
      // Steps into the citadel entrance portal
      this.x = this.colonnadeExitX;
      this.y = this.startY;
      this.facing = 1;
      this.pose = 'walk';
      this.walkCycle += dt * 3.5;
    } else if (t < HERO_TIMELINE.CHAMBER_REVEAL) {
      // Physically walks inside Secret Chamber toward central Eye
      const walkDur = HERO_TIMELINE.CHAMBER_REVEAL - HERO_TIMELINE.TRANSITION_TO_CHAMBER;
      const prog = clamp((t - HERO_TIMELINE.TRANSITION_TO_CHAMBER) / walkDur, 0, 1);
      const eased = easeInOut(prog);
      this.x = this.chamberStartX + (this.chamberStopX - this.chamberStartX) * eased;
      this.y = this.chamberY;
      this.facing = 1;
      this.pose = (prog < 0.95) ? 'walk' : 'private_report';
      if (this.pose === 'walk') this.walkCycle += dt * 3.8;
    } else {
      // Standing before the Eye: familiar, respectful, confident
      this.x = this.chamberStopX;
      this.y = this.chamberY;
      this.facing = 1;
      this.pose = 'private_report';
      this.walkCycle = 0;
    }
  }

  draw(ctx) {
    if (this.pose === 'offscreen') return;

    const px = this.x * T;
    const py = this.y * T;

    ctx.save();
    ctx.translate(px, py);

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const facing = this.facing;
    const legSwing = (this.pose === 'walk') ? Math.sin(this.walkCycle) * 3.2 : 0;
    const cloakBreeze = Math.sin(this.cloakWave) * 2;

    // 1. Royal Velvet Cloak with Ermine Lining (Deep Royal Indigo Velvet)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(-facing * 6, -11);
    ctx.lineTo(-facing * 15, 6 + cloakBreeze);
    ctx.lineTo(-facing * 10, 15);
    ctx.lineTo(0, 11);
    ctx.closePath();
    ctx.fill();

    // Broad snowy ermine fur trim on cloak hem
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-facing * 12, 13, 8, 2.5);
    // Ermine black tail flecks
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-facing * 11, 13.5, 1.5, 1.5);
    ctx.fillRect(-facing * 8, 13.5, 1.5, 1.5);

    // 2. Regal Legs / Boots (Gilded Leather Riding Boots)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-5 - legSwing, 6, 3.5, 8);
    ctx.fillRect(1.5 + legSwing, 6, 3.5, 8);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-5 - legSwing, 6, 3.5, 2);
    ctx.fillRect(1.5 + legSwing, 6, 3.5, 2);

    // 3. Royal Indigo Robes & Gilded Brocade Tunic
    ctx.fillStyle = '#312e81';
    ctx.fillRect(-8, -11, 16, 17);

    // Golden embroidered sash and chevron brocade
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-1.5, -11, 3, 17);
    ctx.fillRect(-7, 1, 14, 2.5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-2, 0.5, 4, 3.5);

    // 4. Ermine Fur Collar & Golden Chain of State
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, -9, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -10, 1.5, 1.5);
    ctx.fillRect(2.5, -10, 1.5, 1.5);
    ctx.fillRect(-1, -7.5, 1.5, 1.5);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -9, 6.5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // 5. King's Head, Silver Beard & Royal Crown
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-4.5, -20, 9, 9);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-5.5, -20, 2, 7);
    ctx.fillRect(3.5, -20, 2, 7);
    ctx.fillRect(-4.5, -14, 9, 6);
    ctx.beginPath();
    ctx.moveTo(-4.5, -8);
    ctx.lineTo(0, -5);
    ctx.lineTo(4.5, -8);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(facing === 1 ? 1.5 : -3.5, -17, 2, 1.5);

    // Grand Multi-Tiered Golden Crown with Ruby Cabochons
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

    // 6. Arm & Gesture
    ctx.save();
    if (this.pose === 'greet') {
      ctx.fillStyle = '#312e81';
      ctx.fillRect(facing * 3, -10, 8, 4);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(facing * 10, -11, 3.5, 4);
    } else if (this.pose === 'private_report') {
      // Solemn report: clasped hands, respectful posture before the presence
      ctx.fillStyle = '#312e81';
      ctx.fillRect(facing * 2, -6, 5, 8);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(facing * 4, 1, 3, 3);
    }
    ctx.restore();

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// ROWAN IN THE OUTSIDE WORLD (LORD ROWAN GROUNDED)
// ─────────────────────────────────────────────────────────────
function _drawOutsideRowan(ctx, x, y, t, facing = 1) {
  const px = x * T;
  const py = y * T;

  ctx.save();
  ctx.translate(px, py);

  // Ground contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  ctx.beginPath();
  ctx.ellipse(0, 11, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const breath = Math.sin(t * 2.2) * 1.0;
  const capeBlow = Math.sin(t * 3.5) * 2.5;

  // 1. Lord Rowan Crimson Cape (Blowing gently in the outside mountain air)
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
  ctx.fillRect(-5, 5, 3.5, 7);
  ctx.fillRect(1.5, 5, 3.5, 7);

  // 3. Lord Rowan Steel Plate Armor (Charcoal steel with gilded trims)
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

  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 6;
  ctx.fillRect(facing === 1 ? 0 : -4.5, -15, 5, 2.0);
  ctx.shadowBlur = 0;

  // 6. Sheathed Sword at Rowan's Side (Weapon lowered in peace)
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-facing * 7, -5, 2.5, 16);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-facing * 8, -8, 4.5, 3);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(-facing * 9, -5, 6.5, 1.5);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// WORLD RENDERING: VAST SKY, MOUNTAINS, STONE AVENUE & MEADOW
// ─────────────────────────────────────────────────────────────
function _renderOutsideWorld(ctx, world, timer, cx, cy) {
  const { tiles, roadTiles, trees, banners, lanterns, clouds, birds, motes, archway } = world;
  const worldCX = cx * T;
  const worldCY = cy * T;

  // 1. SKY DOME (High bright morning sky with cerulean into golden horizon)
  const skyTop = worldCY - 440;
  const horizonY = worldCY - 80;
  const skyGrad = ctx.createLinearGradient(worldCX, skyTop, worldCX, horizonY);
  skyGrad.addColorStop(0, '#0284c7');
  skyGrad.addColorStop(0.35, '#38bdf8');
  skyGrad.addColorStop(0.70, '#bae6fd');
  skyGrad.addColorStop(0.92, '#fef08a');
  skyGrad.addColorStop(1, '#fde68a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(worldCX - 800, skyTop, 1600, horizonY - skyTop + 30);

  // 2. PARALLAX DISTANT ROLLING GREEN HILLS & MOUNTAIN RIDGES
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

  // 3. DRIFTING WHITE CUMULUS CLOUDS
  clouds.forEach(c => {
    const clx = worldCX + ((c.x + timer * c.speed) % 1600 - 800);
    const cly = worldCY + c.y;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.beginPath();
    ctx.ellipse(clx, cly, c.w * 0.5, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(clx - c.w * 0.22, cly + 4, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.ellipse(clx + c.w * 0.22, cly + 2, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. SOARING BIRDS IN SKY
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

  // 5. SUN & GOLDEN GOD-RAYS
  const sunX = worldCX + 280;
  const sunY = worldCY - 280;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 260);
  sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
  sunGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.55)');
  sunGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.18)');
  sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(254, 240, 138, 0.12)';
  for (let r = -3; r <= 3; r++) {
    ctx.beginPath();
    ctx.moveTo(sunX + r * 28, sunY);
    ctx.lineTo(sunX + r * 140 - 280, worldCY + 250);
    ctx.lineTo(sunX + r * 140 - 180, worldCY + 250);
    ctx.closePath();
    ctx.fill();
  }

  // 6. MEADOW GRASS, CLIFF & DUNGEON THRESHOLD SCREE TILES
  tiles.forEach(tile => {
    const px = tile.c * T;
    const py = tile.r * T;

    if (tile.type === 'bluff') {
      // Rugged, ancient mountain rockface with dark slate strata
      const rocks = ['#0f172a', '#1e293b', '#090d16', '#18181b'];
      ctx.fillStyle = rocks[tile.seed % rocks.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
      // Chiseled fissure cracks in the rock
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
        ctx.fillStyle = '#14532d'; // ancient damp moss patch
        ctx.fillRect(px + 4, py + 4, 7, 3);
      }
    } else if (tile.type === 'dungeon_scree') {
      // Cold, ancient scree verge flanking the dungeon entrance: dark crushed slate, pebbles, and damp soil
      const screeEarth = ['#111827', '#18181b', '#0f172a', '#1c1917'];
      ctx.fillStyle = screeEarth[tile.seed % screeEarth.length];
      ctx.fillRect(px, py, T, T);

      // Dark grout & pebble clusters
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);

      // Scattered angular slate pebbles
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 6, py + 8, 4, 3);
      ctx.fillRect(px + 18, py + 20, 5, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 12, py + 14, 3, 3);
      ctx.fillRect(px + 22, py + 6, 4, 2);

      // Faint dark withered moss in damp cracks
      if (tile.seed % 3 === 0) {
        ctx.fillStyle = 'rgba(20, 83, 45, 0.45)';
        ctx.fillRect(px + 3, py + 22, 8, 4);
      }
    } else if (tile.type === 'transition_ground') {
      // Gradual natural transition from dark scree into green meadow
      ctx.fillStyle = (tile.seed % 2 === 0) ? '#14532d' : '#1b3a1e';
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(px + 2, py + 2, 8, 6);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(px + 14, py + 12, 10, 8);
    } else {
      // Lush, vibrant community meadow grass
      const greens = ['#15803d', '#16a34a', '#14532d', '#22c55e', '#166534'];
      ctx.fillStyle = greens[tile.seed % greens.length];
      ctx.fillRect(px, py, T, T);

      ctx.strokeStyle = 'rgba(134, 239, 172, 0.22)';
      ctx.lineWidth = 1;
      if (tile.seed % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(px + 4, py + T);
        ctx.lineTo(px + 6, py + T - 6);
        ctx.moveTo(px + 20, py + T);
        ctx.lineTo(px + 18, py + T - 7);
        ctx.stroke();
      }

      if (tile.seed % 9 === 1) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 12, py + 14, 2.5, 2.5);
      } else if (tile.seed % 11 === 2) {
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(px + 8, py + 10, 2.5, 2.5);
      }
    }
  });

  // 7. PATHWAY: ANCIENT DUNGEON BASALT PATHWAY -> TRANSITION -> ROYAL AVENUE
  roadTiles.forEach(tile => {
    const px = tile.c * T;
    const py = tile.r * T;

    if (tile.type === 'ancient_path') {
      // Ancient, dark, intimidating dungeon flagstones (worn by centuries of suffering)
      const basaltColors = ['#0a0f1d', '#0f172a', '#111827', '#090d16'];
      ctx.fillStyle = basaltColors[tile.seed % basaltColors.length];
      ctx.fillRect(px, py, T, T);

      // Deep weathered grout lines with heavy shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);

      // Aged specular bevel on stone edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 1, py + T - 2);
      ctx.lineTo(px + 1, py + 1);
      ctx.lineTo(px + T - 2, py + 1);
      ctx.stroke();

      // Deep cracks across the ancient basalt slabs
      const crackSeed = tile.seed % 7;
      if (crackSeed === 0) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 7);
        ctx.lineTo(px + 14, py + 17);
        ctx.lineTo(px + 28, py + 14);
        ctx.stroke();
      } else if (crackSeed === 3) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 2);
        ctx.lineTo(px + 18, py + 18);
        ctx.stroke();
      }
      // Cold slate edge chips
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(px + T - 4, py + 2, 3, 3);
    } else if (tile.type === 'transition_path') {
      // Believable interlocking transition: dark basalt stones mingling with dressed cobblestones
      const transPavers = ['#1e293b', '#334155', '#162032', '#2d3748'];
      ctx.fillStyle = transPavers[tile.seed % transPavers.length];
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
    } else {
      // Dressed royal avenue cobblestones
      const pavers = ['#475569', '#334155', '#64748b', '#3b4252'];
      ctx.fillStyle = pavers[tile.seed % pavers.length];
      ctx.fillRect(px, py, T, T);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(px, py, T, 1.5);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(px, py + T - 1.5, T, 1.5);
      ctx.fillRect(px + T - 1.5, py, 1.5, T);

      ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
      ctx.fillRect(px + 4, py + 4, T - 8, T - 8);
    }
  });

  // 8. ANCIENT & INTIMIDATING DUNGEON CLIFF PORTAL & STEPPED THRESHOLD
  const apx = archway.c * T;
  const apy = archway.r * T;

  ctx.save();
  // Heavy tiered buttresses flanking the cliff portal
  ctx.fillStyle = '#090d16';
  ctx.fillRect(apx - 44, apy - 74, 40, 94);
  ctx.fillRect(apx + 28, apy - 74, 40, 94);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(apx - 38, apy - 70, 32, 86);
  ctx.fillRect(apx + 32, apy - 70, 32, 86);

  // Heavy ashlar stone courses & chisel outlines
  ctx.strokeStyle = '#05070e';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(apx - 44, apy - 74, 40, 94);
  ctx.strokeRect(apx + 28, apy - 74, 40, 94);

  // Deep fissures carved in buttresses
  ctx.strokeStyle = '#020307';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(apx - 30, apy - 50);
  ctx.lineTo(apx - 18, apy - 24);
  ctx.moveTo(apx + 48, apy - 60);
  ctx.lineTo(apx + 38, apy - 30);
  ctx.stroke();

  // Colossal cyclopean keystone lintel beam
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(apx - 48, apy - 92, 120, 22);
  ctx.strokeStyle = '#070a12';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(apx - 48, apy - 92, 120, 22);

  // Ancient weathered keystone crest (Abyss Trial Seal)
  ctx.fillStyle = '#92400e';
  ctx.fillRect(apx - 8, apy - 90, 16, 18);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(apx - 5, apy - 86, 10, 10);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(apx - 2, apy - 83, 4, 4);

  // Weathered iron torch sconces with faint cold-blue embers
  ctx.fillStyle = '#090d16';
  ctx.fillRect(apx - 24, apy - 32, 5, 14);
  ctx.fillRect(apx + 43, apy - 32, 5, 14);
  const blueFlicker = Math.sin(timer * 8.0) * 1.5;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(apx - 22, apy - 35, 2.5, 3.5 + blueFlicker, 0, 0, Math.PI * 2);
  ctx.ellipse(apx + 45, apy - 35, 2.5, 3.5 + blueFlicker, 0, 0, Math.PI * 2);
  ctx.fill();

  // Deep cool radial glow from embers
  const blueGlowL = ctx.createRadialGradient(apx - 22, apy - 35, 1, apx - 22, apy - 35, 24);
  blueGlowL.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
  blueGlowL.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = blueGlowL;
  ctx.fillRect(apx - 46, apy - 59, 48, 48);

  // Ancient roots & hanging mountain ivy
  ctx.fillStyle = '#14532d';
  ctx.fillRect(apx - 32, apy - 70, 5, 26);
  ctx.fillRect(apx + 40, apy - 70, 5, 28);
  ctx.fillRect(apx - 16, apy - 72, 32, 4);

  // DEEP MULTI-TIERED INTERIOR CAVERN VOID (Where Rowan and survivors emerge)
  ctx.fillStyle = '#020104';
  ctx.fillRect(apx - 6, apy - 70, 36, 86);
  // Receding inner darkness gradient
  const voidGrad = ctx.createLinearGradient(apx + 12, apy - 70, apx + 12, apy + 16);
  voidGrad.addColorStop(0, '#000000');
  voidGrad.addColorStop(0.7, '#040711');
  voidGrad.addColorStop(1, '#090e1c');
  ctx.fillStyle = voidGrad;
  ctx.fillRect(apx - 4, apy - 66, 32, 82);

  // Cold pale mist trailing at the mouth of the cavern
  const mistBob = Math.sin(timer * 2.0) * 3;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.beginPath();
  ctx.ellipse(apx + 12 + mistBob, apy + 12, 28, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // STEPPED ANCIENT STONE THRESHOLD (Tiered flagstone steps emerging into the daylight)
  ctx.fillStyle = '#0b111e';
  ctx.fillRect(apx - 10, apy + 8, 44, 4);
  ctx.fillStyle = '#111827';
  ctx.fillRect(apx - 8, apy + 12, 40, 4);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(apx - 6, apy + 16, 36, 4);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(apx - 10, apy + 8, 44, 12);

  // COOL TRANSITIONAL SHADOW OVER THRESHOLD (reinforcing contrast between dark dungeon and warm outside)
  const threshShadow = ctx.createLinearGradient(apx - 80, apy, apx + 140, apy);
  threshShadow.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
  threshShadow.addColorStop(0.55, 'rgba(15, 23, 42, 0.28)');
  threshShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = threshShadow;
  ctx.fillRect(apx - 80, apy - 120, 220, 240);

  ctx.restore();

  // 8B. CITADEL ENTRANCE PORTICO (EAST END - WHERE KING EXITS THE PUBLIC SCENE)
  ctx.save();
  const cExitX = (world.archway.c + 18.2) * T;
  const cExitY = worldCY;

  // Citadel Stone Archway Portico
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cExitX - 20, cExitY - 84, 40, 96);
  ctx.fillStyle = '#090d16';
  ctx.fillRect(cExitX - 10, cExitY - 76, 20, 88);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(cExitX - 20, cExitY - 84, 40, 96);

  // Royal Citadel Crest above doorway
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(cExitX - 6, cExitY - 88, 12, 8);
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(cExitX - 3, cExitY - 86, 6, 4);

  // Twin Colonnade Pillars
  ctx.fillStyle = '#334155';
  ctx.fillRect(cExitX - 28, cExitY - 80, 8, 92);
  ctx.fillRect(cExitX + 20, cExitY - 80, 8, 92);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(cExitX - 30, cExitY - 82, 12, 4);
  ctx.fillRect(cExitX + 18, cExitY - 82, 12, 4);
  ctx.restore();

  // 9. SETTLEMENT HOUSES IN DISTANT MIDGROUND
  ctx.save();
  const settleX = (world.archway.c + 18) * T;
  const settleY = (world.archway.r - 4.2) * T;
  ctx.fillStyle = '#78350f';
  ctx.fillRect(settleX, settleY, 52, 34);
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(settleX - 6, settleY);
  ctx.lineTo(settleX + 26, settleY - 24);
  ctx.lineTo(settleX + 58, settleY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.fillRect(settleX + 36, settleY - 28, 7, 16);
  const smokeBob = Math.sin(timer * 2) * 4;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(settleX + 39 + smokeBob, settleY - 34, 5, 0, Math.PI * 2);
  ctx.arc(settleX + 42 + smokeBob * 1.5, settleY - 44, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 10. PINE TREES
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

  // 11. HERALDIC ROYAL BANNERS FLUTTERING
  banners.forEach(b => {
    const bx = b.c * T;
    const by = b.r * T;
    // Pole
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx + 4, by - 24, 3, 32);
    // Flag cloth waving
    const wave = Math.sin(timer * 3.5 + b.c) * 4;
    ctx.fillStyle = b.color || '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(bx + 7, by - 22);
    ctx.lineTo(bx + 26 + wave, by - 16);
    ctx.lineTo(bx + 7, by - 4);
    ctx.closePath();
    ctx.fill();
    // Crest
    ctx.fillStyle = b.crest || '#1e3a8a';
    ctx.beginPath();
    ctx.arc(bx + 14 + wave * 0.4, by - 14, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // 12. FESTIVE LANTERNS
  lanterns.forEach(lt => {
    const lx = lt.c * T;
    const ly = lt.r * T;
    // Lantern post
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(lx + 6, ly - 18, 3, 24);
    // Lantern cage
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx + 2, ly - 26, 11, 10);
    // Warm flame glow
    const flick = Math.sin(timer * 7 + lt.c * 3) * 1.5;
    const lGrad = ctx.createRadialGradient(lx + 7, ly - 21, 2, lx + 7, ly - 21, 18);
    lGrad.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
    lGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
    lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.arc(lx + 7, ly - 21, 18, 0, Math.PI * 2);
    ctx.fill();
    // Flame core
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(lx + 7, ly - 21, 2.5 + flick * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 13. GOLDEN DAYLIGHT MOTES
  motes.forEach(m => {
    const mx = (m.x + timer * m.spdX) % (28 * 2 * T);
    const my = (m.y + timer * m.spdY) % (10 * 2 * T);
    const alpha = m.alpha * (0.6 + 0.4 * Math.sin(timer * 2 + m.phase));
    ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
    ctx.beginPath();
    ctx.arc(mx, my, m.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ─────────────────────────────────────────────────────────────
// SECRET CHAMBER: PRIVATE SANCTUM DEEP WITHIN THE CITADEL
// (Exact Environmental Reference: Shattered Mind's Strange Arena)
// ─────────────────────────────────────────────────────────────
function _renderSecretChamber(ctx, arena, timer) {
  const { cx, cy, tiles, torchPositions, pillars, palette } = arena;
  const scx = cx * T;
  const scy = cy * T;

  // Fully enclosed dark stone void bounding box - guarantees 0% outside bleed
  ctx.save();
  ctx.fillStyle = '#030206';
  ctx.fillRect(scx - 22 * T, scy - 16 * T, 44 * T, 32 * T);

  // 1. Floor & Wall tiles (Authentic 2.5D dungeon masonry & weathered flagstones)
  tiles.forEach(tile => {
    const px = tile.c * T;
    const py = tile.r * T;
    if (tile.type === 'floor') {
      _drawFloorTile(ctx, px, py, tile.seed, palette.fc);
    } else if (tile.type === 'wall') {
      _drawWallTile(ctx, px, py, tile.r, tile.hasSouth, palette.wc);
    }
  });

  // 2. North wall torches with warm flickering light pools
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
// MASTER HERO CINEMATIC CONTROLLER OBJECT
// ─────────────────────────────────────────────────────────────
export const HeroCinematic = {
  active: false,
  finished: false,
  timer: 0,
  shotIndex: 1,

  // ─────────────────────────────────────────────────────────────
  // 1. START & INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  start(opts = {}) {
    this.reset();
    if (typeof window !== 'undefined' && window.ShatteredMindCinematic) {
      window.ShatteredMindCinematic.reset();
    }
    const isReplay = !!opts.isReplay;
    CinematicSafety.startCinematic('ending_hero', typeof opts === 'object' ? opts : { isReplay });

    if (!isReplay && SaveSystem && SaveSystem.recordCinematicUnlock) {
      SaveSystem.recordCinematicUnlock('ending_hero');
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
    GameState.ACTIVE_CINEMATIC_TYPE = 'hero';

    const curRoom = (GameState.ROOMS && GameState.ROOMS[0]) || { cx: 24, cy: 16 };
    const roomCenterX = P ? P.x : curRoom.cx;
    const roomCenterY = P ? P.y : curRoom.cy;

    const chamberCX = roomCenterX + 80;
    const chamberCY = roomCenterY;

    const outsideWorld = _buildOutsideWorld(roomCenterX, roomCenterY);
    const secretChamber = _buildSecretChamber(chamberCX, chamberCY);

    // Initial Rowan position (emerging from the stone portal archway into sunlight)
    const rowanEmergenceX = roomCenterX - 4.5;
    const rowanEmergenceY = roomCenterY;

    // Citadel Guards escort (marching in along the road starting at t=7.5s)
    const guards = [
      new HeroGuard({
        id: 'guard_vanguard_1',
        role: 'swordsman',
        startX: roomCenterX + 12.0,
        startY: roomCenterY - 0.8,
        targetX: roomCenterX - 0.5,
        targetY: roomCenterY - 0.8,
        facing: -1,
        moveStart: 7.5,
        moveEnd: 12.5
      }),
      new HeroGuard({
        id: 'guard_vanguard_2',
        role: 'swordsman',
        startX: roomCenterX + 12.0,
        startY: roomCenterY + 0.8,
        targetX: roomCenterX - 0.5,
        targetY: roomCenterY + 0.8,
        facing: -1,
        moveStart: 7.5,
        moveEnd: 12.5
      }),
      new HeroGuard({
        id: 'guard_halberd_1',
        role: 'halberd',
        startX: roomCenterX + 14.0,
        startY: roomCenterY - 1.2,
        targetX: roomCenterX + 1.2,
        targetY: roomCenterY - 1.2,
        facing: -1,
        moveStart: 8.5,
        moveEnd: 13.5
      }),
      new HeroGuard({
        id: 'guard_halberd_2',
        role: 'halberd',
        startX: roomCenterX + 14.0,
        startY: roomCenterY + 1.2,
        targetX: roomCenterX + 1.2,
        targetY: roomCenterY + 1.2,
        facing: -1,
        moveStart: 8.5,
        moveEnd: 13.5
      })
    ];

    // RESCUED SURVIVORS (Physically emerge from inside the dark dungeon portal!)
    // & GATHERING TOWNSFOLK (Approach from settlement side to meet them)
    const portalC = outsideWorld.archway.c;
    const villagers = [
      // 1. Rescued warrior (bandaged, emerges from darkness into light)
      new HeroVillager({
        id: 'survivor_1',
        isSurvivor: true,
        type: 'survivor_injured',
        startX: portalC + 0.3,
        startY: roomCenterY - 0.2,
        targetX: roomCenterX - 3.2,
        targetY: roomCenterY - 2.5,
        tunic: '#2563eb',
        hair: '#78350f',
        emergeStart: 3.2,
        emergeEnd: 8.5,
        speed: 0.95
      }),
      // 2. Rescued captive ally (emerges raising hands in relief)
      new HeroVillager({
        id: 'survivor_2',
        isSurvivor: true,
        type: 'survivor_ally',
        startX: portalC + 0.3,
        startY: roomCenterY + 0.2,
        targetX: roomCenterX - 2.0,
        targetY: roomCenterY + 2.5,
        tunic: '#3b82f6',
        hair: '#1e293b',
        emergeStart: 4.2,
        emergeEnd: 9.5,
        speed: 1.05
      }),
      // 3. Rescued elder (weary, shields eyes from sunlight)
      new HeroVillager({
        id: 'survivor_3',
        isSurvivor: true,
        type: 'survivor',
        startX: portalC + 0.3,
        startY: roomCenterY,
        targetX: roomCenterX - 0.8,
        targetY: roomCenterY - 2.6,
        tunic: '#15803d',
        hair: '#cbd5e1',
        emergeStart: 5.2,
        emergeEnd: 10.5,
        speed: 0.90
      }),
      // 4. Rescued youth (amazed by the open sky)
      new HeroVillager({
        id: 'survivor_4',
        isSurvivor: true,
        type: 'survivor_ally',
        startX: portalC + 0.3,
        startY: roomCenterY + 0.3,
        targetX: roomCenterX + 0.2,
        targetY: roomCenterY + 2.4,
        tunic: '#8b5cf6',
        hair: '#b45309',
        emergeStart: 6.2,
        emergeEnd: 11.5,
        speed: 1.0
      }),
      // 5. Settlement Flower child (approaches from settlement to welcome them)
      new HeroVillager({
        id: 'town_child',
        isSurvivor: false,
        type: 'villager_child',
        startX: roomCenterX + 9.0,
        startY: roomCenterY - 2.4,
        targetX: roomCenterX - 0.2,
        targetY: roomCenterY - 2.4,
        tunic: '#f43f5e',
        hair: '#ca8a04',
        emergeStart: 7.2,
        emergeEnd: 12.0,
        speed: 1.15
      }),
      // 6. Settlement Elder citizen
      new HeroVillager({
        id: 'town_elder',
        isSurvivor: false,
        type: 'villager',
        startX: roomCenterX + 8.5,
        startY: roomCenterY + 2.6,
        targetX: roomCenterX + 1.8,
        targetY: roomCenterY + 2.6,
        tunic: '#d97706',
        hair: '#451a03',
        emergeStart: 7.8,
        emergeEnd: 12.5,
        speed: 0.95
      }),
      // 7. Settlement townsfolk cheering
      new HeroVillager({
        id: 'town_citizen_1',
        isSurvivor: false,
        type: 'villager',
        startX: roomCenterX + 10.0,
        startY: roomCenterY - 2.6,
        targetX: roomCenterX + 2.2,
        targetY: roomCenterY - 2.6,
        tunic: '#059669',
        hair: '#78350f',
        emergeStart: 8.2,
        emergeEnd: 13.0,
        speed: 1.0
      }),
      // 8. Settlement townsfolk cheering
      new HeroVillager({
        id: 'town_citizen_2',
        isSurvivor: false,
        type: 'villager',
        startX: roomCenterX + 9.5,
        startY: roomCenterY + 2.7,
        targetX: roomCenterX + 3.0,
        targetY: roomCenterY + 2.7,
        tunic: '#0284c7',
        hair: '#172554',
        emergeStart: 8.5,
        emergeEnd: 13.2,
        speed: 1.05
      })
    ];

    const king = new HeroKing(roomCenterX, roomCenterY, chamberCX, chamberCY);

    _activeHeroCinematic = {
      timer: 0,
      roomCenterX,
      roomCenterY,
      chamberCX,
      chamberCY,
      outsideWorld,
      secretChamber,
      rowan: {
        x: rowanEmergenceX,
        y: rowanEmergenceY,
        facing: 1
      },
      guards,
      villagers,
      king,
      soundCues: {
        outsideBreeze: false,
        birdsChirp: false,
        crowdCheer: false,
        fanfare: false,
        drone: false,
        eyeBlink: false
      },
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

    MusicManager.setMasterVolume(0.68);
    MusicManager.play('heroEnding', { loop: true, fade: 2.0, volume: 0.65 });
    playSnd('outside_breeze');

    EventBus.emit('cinematic:hero_started');
  },

  isActive() {
    return this.active && !!_activeHeroCinematic;
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
  // 2. TICK: CAMERA CHOREOGRAPHY & STORY BEATS
  // ─────────────────────────────────────────────────────────────
  tick(dt) {
    if (!this.active || !_activeHeroCinematic) return;
    const cine = _activeHeroCinematic;
    if (!this.paused) {
      cine.timer += dt;
      this.timer = cine.timer;
    }
    const t = cine.timer;

    const cx = cine.roomCenterX;
    const cy = cine.roomCenterY;

    // Update characters
    cine.guards.forEach(g => g.update(dt, t));
    cine.villagers.forEach(v => v.update(dt, t));
    cine.king.update(dt, t);

    // ─────────────────────────────────────────────────────────
    // SHOT 1: OUTSIDE WORLD REVEAL & FREEDOM MOMENT (0.0s – 7.0s)
    // ─────────────────────────────────────────────────────────
    if (t < HERO_TIMELINE.OUTSIDE_REVEAL) {
      this.shotIndex = 1;
      if (!cine.soundCues.birdsChirp && t > 1.2) {
        cine.soundCues.birdsChirp = true;
        playSnd('birds_ambient');
      }

      // Rowan walks forward into the sunlight during the first 3.5s, then pauses in relief
      if (t < 3.5) {
        const p = t / 3.5;
        cine.rowan.x = (cx - 6.2) + p * 1.7; // emerges from portal to cx - 4.5
      } else {
        cine.rowan.x = cx - 4.5;
      }

      // Camera: Wide establishing shot of outside world and Rowan standing free
      const panT = Math.min(1.0, t / 4.5);
      const camX = cx - 3.4 + panT * 0.4;
      const camY = cy - 1.1;
      const camZ = 0.95 + panT * 0.12;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;
      GameState.CAM.x = camX;
      GameState.CAM.y = camY;
      GameState.CAM.z = camZ;

      cine.subtitles.alpha = 0;
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 2: SURVIVORS ARRIVE & GUARDS MARCH IN (7.0s – 13.5s)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.PEOPLE_NOTICE) {
      this.shotIndex = 2;
      cine.rowan.x = cx - 4.5;

      if (!cine.soundCues.crowdCheer) {
        cine.soundCues.crowdCheer = true;
        playSnd('crowd_cheer');
      }

      // Camera: Medium-wide tracking along cobblestone avenue
      const shotT = (t - HERO_TIMELINE.OUTSIDE_REVEAL) / (HERO_TIMELINE.PEOPLE_NOTICE - HERO_TIMELINE.OUTSIDE_REVEAL);
      const camX = cx - 3.2 + shotT * 0.8;
      const camY = cy - 0.4;
      const camZ = 1.15;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;

      cine.subtitles.alpha = 0;
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 3: THE KING'S ARRIVAL (13.5s – 19.5s)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.KING_ARRIVAL) {
      this.shotIndex = 3;
      cine.rowan.x = cx - 4.5;

      if (!cine.soundCues.fanfare) {
        cine.soundCues.fanfare = true;
        playSnd('royal_fanfare');
        playSnd('crowd_cheer');
      }

      // Camera pans with the King as he approaches Lord Rowan
      const shotT = (t - HERO_TIMELINE.PEOPLE_NOTICE) / (HERO_TIMELINE.KING_ARRIVAL - HERO_TIMELINE.PEOPLE_NOTICE);
      const camX = (cx + 2.0) - shotT * 4.2;
      const camY = cy - 0.2;
      const camZ = 1.25;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;

      cine.subtitles.alpha = 0;
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 4: THE KING GREETS ROWAN (19.5s – 29.5s)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.KING_GREETING) {
      this.shotIndex = 4;
      cine.rowan.x = cx - 4.5;

      // Medium two-shot: King and Rowan facing each other
      const camX = cx - 3.1;
      const camY = cy - 0.1;
      const camZ = 1.40;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;

      // CINEMATIC SUBTITLES: Clean, deliberate timing with distinct pauses
      cine.subtitles.isSecret = false;
      if (t >= 20.0 && t < 21.8) {
        cine.subtitles.text = '“Rowan.”';
        cine.subtitles.alpha = (t < 20.3) ? (t - 20.0) / 0.3 : (t > 21.5) ? (21.8 - t) / 0.3 : 1.0;
      } else if (t >= 22.4 && t < 24.2) {
        cine.subtitles.text = '“You returned.”';
        cine.subtitles.alpha = (t < 22.7) ? (t - 22.4) / 0.3 : (t > 23.9) ? (24.2 - t) / 0.3 : 1.0;
      } else if (t >= 24.8 && t < 26.8) {
        cine.subtitles.text = '“You saved them.”';
        cine.subtitles.alpha = (t < 25.1) ? (t - 24.8) / 0.3 : (t > 26.5) ? (26.8 - t) / 0.3 : 1.0;
      } else if (t >= 27.4 && t < 29.5) {
        cine.subtitles.text = '“The people of the dungeon owe you their lives.”';
        cine.subtitles.alpha = (t < 27.7) ? (t - 27.4) / 0.3 : (t > 29.2) ? (29.5 - t) / 0.3 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 5: PEACEFUL COMMUNITY CELEBRATION (29.5s – 37.0s)
    // (PURE DAYLIGHT HARMONY — NO SUPERNATURAL THREAT VISIBLE)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.CELEBRATION) {
      this.shotIndex = 5;
      cine.rowan.x = cx - 4.5;
      cine.subtitles.alpha = 0;

      // Wide celebration: Rowan with his people under the warm sun
      const shotT = (t - HERO_TIMELINE.KING_GREETING) / (HERO_TIMELINE.CELEBRATION - HERO_TIMELINE.KING_GREETING);
      const camX = cx - 2.8 + Math.sin(shotT * 1.5) * 0.3;
      const camY = cy - 0.3;
      const camZ = 1.15;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 6: KING DEPARTURE LINE (36.50s – 41.50s)
    // (KING TURNS TO ROWAN: CALM, FRIENDLY, COMPLETELY NORMAL)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.KING_DEPARTURE_LINE) {
      this.shotIndex = 6;
      cine.rowan.x = cx - 4.5;

      // Medium shot framing King and Rowan in the peaceful sunlight
      const camX = cx - 3.1;
      const camY = cy - 0.2;
      const camZ = 1.35;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;

      // CINEMATIC SUBTITLES: "I have some things to attend to, Rowan. Have fun here. I will meet you soon."
      cine.subtitles.isSecret = false;
      if (t >= 37.0 && t < 41.0) {
        cine.subtitles.text = '“I have some things to attend to, Rowan. Have fun here. I will meet you soon.”';
        cine.subtitles.alpha = (t < 37.4) ? (t - 37.0) / 0.4 : (t > 40.5) ? (41.0 - t) / 0.5 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 7: KING PHYSICALLY LEAVES (41.50s – 46.00s)
    // (KING WALKS AWAY EAST; ROWAN & CELEBRATION REMAIN BEHIND)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.KING_WALKS_AWAY) {
      this.shotIndex = 7;
      cine.rowan.x = cx - 4.5;
      cine.subtitles.alpha = 0;

      // Camera gently follows the King as he walks away along the avenue
      const walkDur = HERO_TIMELINE.KING_WALKS_AWAY - HERO_TIMELINE.KING_DEPARTURE_LINE;
      const walkT = clamp((t - HERO_TIMELINE.KING_DEPARTURE_LINE) / walkDur, 0, 1);
      const eased = easeInOut(walkT);
      const camX = (cx - 3.1) + eased * 10.5;
      const camY = cy - 0.2;
      const camZ = 1.30;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;

      // Subtle atmospheric shift as King separates from the crowd
      if (!cine.soundCues.drone && t >= 43.5) {
        cine.soundCues.drone = true;
        MusicManager.setMasterVolume(0.28);
        playSnd('ominous_drone');
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 8: ONE SMOOTH TRANSITION (46.00s – 48.50s)
    // (KING STEPS INTO CITADEL PORTAL; DAYLIGHT DIMS TO CORRIDOR SHADOW)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.TRANSITION_TO_CHAMBER) {
      this.shotIndex = 8;
      cine.rowan.x = cx - 4.5;
      cine.subtitles.alpha = 0;

      const transDur = HERO_TIMELINE.TRANSITION_TO_CHAMBER - HERO_TIMELINE.KING_WALKS_AWAY;
      const transT = clamp((t - HERO_TIMELINE.KING_WALKS_AWAY) / transDur, 0, 1);
      const camX = (cx + 7.4) + transT * 2.6;
      const camY = cy - 0.2;
      const camZ = 1.35;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 9: SECRET CHAMBER REVEAL (48.50s – 52.50s)
    // (ESTABLISHING SHOT: ENTIRE ENCLOSED VAULT + KING ENTERS + EYE)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.CHAMBER_REVEAL) {
      this.shotIndex = 9;
      cine.subtitles.alpha = 0;

      const scx = cine.chamberCX;
      const scy = cine.chamberCY;

      // Establishing wide composition: 3-4 seconds of silent, atmospheric awe
      const camX = scx;
      const camY = scy - 1.2;
      const camZ = 1.30;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 10: FIRST SECRET LINE (52.50s – 56.00s)
    // (KING ADDRESSES THE EYE: "He came back from the Abyss.")
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.SECRET_LINE_1) {
      this.shotIndex = 10;
      const scx = cine.chamberCX;
      const scy = cine.chamberCY;

      // Strong medium/wide composition framing King on left and Eye on center/right
      const camX = scx - 1.0;
      const camY = scy - 1.4;
      const camZ = 1.40;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;

      // CINEMATIC SUBTITLES: "He came back from the Abyss."
      cine.subtitles.isSecret = true;
      if (t >= 53.0 && t < 55.4) {
        cine.subtitles.text = '“He came back from the Abyss.”';
        cine.subtitles.alpha = (t < 53.3) ? (t - 53.0) / 0.3 : (t > 55.0) ? (55.4 - t) / 0.4 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 11: SECOND SECRET LINE (56.00s – 60.00s)
    // (KING SPEAKS: "The preparations you asked for are finished.")
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.SECRET_LINE_2) {
      this.shotIndex = 11;
      const scx = cine.chamberCX;
      const scy = cine.chamberCY;

      const camX = scx - 1.0;
      const camY = scy - 1.4;
      const camZ = 1.40;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;

      // CINEMATIC SUBTITLES: "The preparations you asked for are finished."
      cine.subtitles.isSecret = true;
      if (t >= 56.4 && t < 59.4) {
        cine.subtitles.text = '“The preparations you asked for are finished.”';
        cine.subtitles.alpha = (t < 56.8) ? (t - 56.4) / 0.4 : (t > 58.9) ? (59.4 - t) / 0.5 : 1.0;
      } else {
        cine.subtitles.alpha = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 12: FINAL EYE CLOSE-UP & BLINK (60.00s – 63.75s)
    // (LOCKED APPROVED FINAL SEQUENCE: PUSH, ROOM DARKEN, BLINK)
    // ─────────────────────────────────────────────────────────
    else if (t < HERO_TIMELINE.EYE_CLOSEUP) {
      this.shotIndex = 12;
      cine.subtitles.alpha = 0;

      const eyeWorldX = cine.chamberCX * T;
      const eyeWorldY = (cine.chamberCY - 2.8) * T;
      const zoomT = Math.min(1.0, (t - 60.00) / (63.75 - 60.00));

      const camX = eyeWorldX / T;
      const camY = eyeWorldY / T;
      const camZ = 1.7 + zoomT * 1.5;

      GameState.CAM.tx = camX;
      GameState.CAM.ty = camY;
      GameState.CAM.tz = camZ;

      // Eye Blinks at 63.35s
      if (t >= 63.35 && !cine.soundCues.eyeBlink) {
        cine.soundCues.eyeBlink = true;
        playSnd('eye_blink');
      }
    }

    // ─────────────────────────────────────────────────────────
    // SHOT 13: PURE BLACK HOLD & CREDITS HANDOFF (63.75s – 66.75s)
    // ─────────────────────────────────────────────────────────
    else {
      this.shotIndex = 13;
      cine.subtitles.alpha = 0;

      if (t >= HERO_TIMELINE.BLACK_HOLD && !this.finished) {
        this.finished = true;
        this.proceedToCredits();
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. DRAW WORLD ENTITIES (In-world camera space pass)
  // ─────────────────────────────────────────────────────────────
  drawWorldEntities(ctx) {
    if (!this.active || !_activeHeroCinematic) return;
    const cine = _activeHeroCinematic;
    const t = cine.timer;
    const cx = cine.roomCenterX;
    const cy = cine.roomCenterY;
    const scx = cine.chamberCX;
    const scy = cine.chamberCY;

    // ─────────────────────────────────────────────────────────
    // SCENE 1: OUTSIDE WORLD CELEBRATION (t < 48.50s)
    // ─────────────────────────────────────────────────────────
    if (t < HERO_TIMELINE.TRANSITION_TO_CHAMBER) {
      // 1. Outside World Environment (Vast Sky, Cliffs, Meadows, Ancient Pathway, Royal Avenue)
      _renderOutsideWorld(ctx, cine.outsideWorld, t, cx, cy);

      // 2. Villagers & Rescued Survivors (Physical emergence from ancient dungeon portal)
      cine.villagers.forEach(v => v.draw(ctx, t, cine.outsideWorld.archway.c));

      // 3. Citadel Royal Guards
      cine.guards.forEach(g => g.draw(ctx));

      // 4. Lord Rowan (Grounded in outside sunlight — remains in public meadow with his people)
      _drawOutsideRowan(ctx, cine.rowan.x, cine.rowan.y, t, cine.rowan.facing);

      // 5. The King (Approaching, greeting Rowan, celebrating, and physically walking away)
      cine.king.draw(ctx);

      // 6. Smooth Transition Overlay (King enters citadel portal corridor at t >= 46.0s)
      if (t >= HERO_TIMELINE.KING_WALKS_AWAY) {
        const transProg = clamp((t - HERO_TIMELINE.KING_WALKS_AWAY) / (HERO_TIMELINE.TRANSITION_TO_CHAMBER - HERO_TIMELINE.KING_WALKS_AWAY), 0, 1);
        ctx.save();
        ctx.fillStyle = `rgba(3, 2, 6, ${transProg * 0.98})`;
        ctx.fillRect((cx - 15) * T, (cy - 12) * T, 35 * T, 24 * T);
        ctx.restore();
      }
      return;
    }

    // ─────────────────────────────────────────────────────────
    // SCENE 2: COMPLETELY SEPARATE SECRET CHAMBER (t >= 48.50s)
    // (100% ENCLOSED CINEMATIC SANCTUM — 0% OUTSIDE BLEED)
    // ─────────────────────────────────────────────────────────
    // 1. Secret Chamber Architecture (Shattered Mind 2.5D stone walls, pillars, torches, dais)
    _renderSecretChamber(ctx, cine.secretChamber, t);

    // 2. The King (Physically enters chamber, approaches central Eye, stops before it)
    cine.king.draw(ctx);

    // 3. Central Approved Pixel Eye above Altar
    const eyeWorldX = scx * T;
    const eyeWorldY = (scy - 2.8) * T;

    // In Shot 12 (60.00s – 63.75s), surrounding room smoothly fades into deep darkness
    if (t >= 60.00 && t < 63.75) {
      const darkProg = Math.min(1.0, (t - 60.00) / (63.35 - 60.00));
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${darkProg * 0.94})`;
      ctx.fillRect((scx - 22) * T, (scy - 16) * T, 44 * T, 32 * T);
      ctx.restore();
    }

    // Blink animation calculation (smooth eyelid closure into snap to black)
    let blinkProg = 0;
    if (t >= 63.35 && t < 63.75) {
      blinkProg = Math.min(1.0, (t - 63.35) / 0.38);
    }

    const pulse = 1.0 + Math.sin(t * 3.5) * 0.05;
    const eyeScale = (t >= 60.00)
      ? Math.min(3.2, 1.8 + (t - 60.00) * 0.38)
      : 1.8;

    if (t < 63.75) {
      _drawPixelEye(ctx, eyeWorldX, eyeWorldY, eyeScale * pulse, blinkProg, t);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 4. DRAW SCREEN-SPACE OVERLAYS (Letterbox & Cinematic Subtitles)
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!this.active || !_activeHeroCinematic) return;
    const cine = _activeHeroCinematic;
    const t = cine.timer;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 1. COMPLETE BLACK (Post-Blink Hold)
    if (t >= 63.75) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);
      ctx.restore();
      return; // Absolute blackness, pure silence
    }

    // 2. CINEMATIC LETTERBOX BARS
    const barH = cine.letterbox.height;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, LW, barH);
    ctx.fillRect(0, LH - barH, LW, barH);

    // Subtle golden separator lines
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.40)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(LW, barH);
    ctx.moveTo(0, LH - barH);
    ctx.lineTo(LW, LH - barH);
    ctx.stroke();

    // 3. CINEMATIC SUBTITLES (ELEGANT DARK-FANTASY TYPOGRAPHY)
    if (cine.subtitles && cine.subtitles.alpha > 0.02 && cine.subtitles.text) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, Math.max(0, cine.subtitles.alpha));

      // Neatly centered in the bottom letterbox bar
      const subY = LH - Math.round(barH * 0.44);
      const isChamber = cine.subtitles.isSecret;

      ctx.font = 'italic 17px "Crimson Text", Georgia, serif';
      const textW = ctx.measureText(cine.subtitles.text).width;

      // Soft translucent backing vignette for maximum readability
      const padX = 28;
      const bgGrad = ctx.createRadialGradient(LW / 2, subY - 4, 10, LW / 2, subY - 4, textW / 2 + padX);
      bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0.70)');
      bgGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.45)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(LW / 2 - textW / 2 - padX, subY - 18, textW + padX * 2, 26);

      // Black text drop-shadow
      ctx.fillStyle = '#000000';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(cine.subtitles.text, LW / 2, subY);

      // Foreground text: warm gold for public scene, chilling silver-bone for secret chamber
      ctx.fillStyle = isChamber ? '#f1f5f9' : '#fef3c7';
      ctx.shadowBlur = 0;
      ctx.fillText(cine.subtitles.text, LW / 2, subY);

      ctx.restore();
    }

    // 4. SUBTLE SKIP PROMPT
    if (this.canSkip() && CinematicSafety.shouldShowSkipHint() && t < HERO_TIMELINE.CHAMBER_REVEAL) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.fillText(CinematicSafety.isReplay() ? '[ Esc / Click to Exit Archive ]' : '[ Space / Enter / Click to Skip ]', LW - 20, LH - 16);
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // 5. INPUT & SKIP HANDLERS
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
    _heroFastForwarding = true;
    this.proceedToCredits();
  },

  seek(targetTime, andPause = false) {
    if (typeof window !== 'undefined' && window.ShatteredMindCinematic) {
      window.ShatteredMindCinematic.reset();
    }
    if (!this.active || !_activeHeroCinematic) {
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
    _activeHeroCinematic.timer = targetTime;
    this.timer = targetTime;
    this.paused = andPause;
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    _heroFastForwarding = true;
    _activeHeroCinematic.guards.forEach(g => g.update(0.01, targetTime));
    _activeHeroCinematic.villagers.forEach(v => v.update(0.01, targetTime));
    _activeHeroCinematic.king.update(0.01, targetTime);
    _heroFastForwarding = false;
    this.tick(0.001);
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
    _activeHeroCinematic = null;
    _heroFastForwarding = false;

    GameState.CINEMATIC_ACTIVE = false;

    if (CinematicSafety.isReplay()) {
      this.reset();
      CinematicSafety.finishReplay();
      return;
    }

    EpilogueCinematic.start('hero', () => {
      Credits.start('hero');
    });
  },

  reset() {
    this.active = false;
    this.finished = false;
    this.timer = 0;
    this.shotIndex = 1;
    _activeHeroCinematic = null;
    _heroFastForwarding = false;
  }
};

if (typeof window !== 'undefined') {
  window.HeroCinematic = HeroCinematic;
  window.heroSeek = (t, andPause = false) => HeroCinematic.seek(t, andPause);
  window.triggerHeroEnding = () => HeroCinematic.start();
  window.startHeroEnding = () => HeroCinematic.start();
}
