// =====================================================================
//  DUNGEON BREAK — js/rendering/WorldRenderer.js
//  Authoritative Tilemap, 2.5D Wall Depth, Portal Swirls, Items, & Minimap
// =====================================================================

import { GameState } from '../core/GameState.js';
import { T, ROWS, COLS, LW, LH, roundRect } from '../core/Constants.js';
import { getTheme, isBossFloor } from '../data/floors.js';
import { WD, RARITIES } from '../data/weapons.js';
import { isInOpeningSafeZone } from '../world/DungeonGenerator.js';
import { PortalTransition, PORTAL_CONTEXTS } from '../cinematics/PortalTransition.js';

export let MINIMAP_VISIBLE = true;

/**
 * Subtle Temporal Storytelling: Ancient Broken Temporal Glyphs (Floors 4–10)
 * Integrated seamlessly into stone flagstone masonry. Rare, weathered, and deliberate.
 */
function _drawTemporalStoneGlyph(ctx, x, y, lv, seed) {
  const cx = x + T / 2;
  const cy = y + T / 2;
  const r = 8.5;

  ctx.save();
  // Inlaid fractured circular clock / sundial arc
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -0.4, 3.8); // broken circular groove
  ctx.stroke();

  // Faint ancient astronomical violet/amber hue
  const depthFactor = Math.min(1.0, ((lv || 4) - 4) / 6);
  const glow = 0.08 + depthFactor * 0.08;
  ctx.strokeStyle = `rgba(168, 85, 247, ${glow})`;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -0.3, 3.7);
  ctx.stroke();

  // Fractured dial ticks (hour notches at ~10 and 2 o'clock)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(Math.round(cx - 1), Math.round(cy - r - 2), 2, 4);
  ctx.fillRect(Math.round(cx + r * 0.7 - 1), Math.round(cy - r * 0.7 - 1), 3, 2);

  // Central pivot point (faded runic pit)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(Math.round(cx) - 1.5, Math.round(cy) - 1.5, 3, 3);
  ctx.fillStyle = `rgba(216, 180, 254, ${glow * 1.3})`;
  ctx.fillRect(Math.round(cx) - 0.5, Math.round(cy) - 0.5, 1, 1);

  // Deeper floors (7–10): barely perceptible ambient pulse
  if (lv >= 7) {
    const pulse = 0.025 + Math.sin(GameState.F * 0.025 + seed) * 0.025;
    ctx.fillStyle = `rgba(245, 158, 11, ${pulse})`;
    ctx.fillRect(Math.round(cx) - 1, Math.round(cy - r + 2), 2, 2);
  }

  ctx.restore();
}

export const WorldRenderer = {
  drawVoidArenaEffects(ctx) {
    const room = GameState.ROOMS && GameState.ROOMS[0];
    if (!room || room.type !== 'malakor_arena') return;

    const boss = GameState.BOSS;
    const bossPhase = (boss && boss.id === 'malakor') ? (boss.phase || 1) : 1;
    const P = GameState.P;
    const san = (P && P.san !== undefined) ? P.san : 100;

    const rx = room.x * T;
    const ry = room.y * T;
    const rw = room.w * T;
    const rh = room.h * T;

    ctx.save();

    // 1. Deeper Shadows Toward Boundaries (atmospheric perimeter occlusion)
    const shadowBorder = 2.8 * T;
    const topGrad = ctx.createLinearGradient(0, ry, 0, ry + shadowBorder);
    topGrad.addColorStop(0, 'rgba(4, 1, 10, 0.45)');
    topGrad.addColorStop(1, 'rgba(4, 1, 10, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(rx, ry, rw, shadowBorder);

    const botGrad = ctx.createLinearGradient(0, ry + rh, 0, ry + rh - shadowBorder);
    botGrad.addColorStop(0, 'rgba(4, 1, 10, 0.45)');
    botGrad.addColorStop(1, 'rgba(4, 1, 10, 0)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(rx, ry + rh - shadowBorder, rw, shadowBorder);

    const leftGrad = ctx.createLinearGradient(rx, 0, rx + shadowBorder, 0);
    leftGrad.addColorStop(0, 'rgba(4, 1, 10, 0.40)');
    leftGrad.addColorStop(1, 'rgba(4, 1, 10, 0)');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(rx, ry, shadowBorder, rh);

    const rightGrad = ctx.createLinearGradient(rx + rw, 0, rx + rw - shadowBorder, 0);
    rightGrad.addColorStop(0, 'rgba(4, 1, 10, 0.40)');
    rightGrad.addColorStop(1, 'rgba(4, 1, 10, 0)');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(rx + rw - shadowBorder, ry, shadowBorder, rh);

    // 2. Ancient Stone Surface Markings & Arcane Boundary Sigils
    const edgeAlpha = 0.12 + bossPhase * 0.035;
    const fractures = [
      [room.x + 3, room.y + 3, 1], [room.x + room.w - 5, room.y + 4, -1],
      [room.x + 2, room.y + room.h - 6, -1], [room.x + room.w - 4, room.y + room.h - 5, 1],
      [room.cx - 11, room.cy, 1], [room.cx + 11, room.cy + 2, -1],
      [room.cx - 5, room.cy - 7, -1], [room.cx + 5, room.cy - 7, 1]
    ];
    ctx.strokeStyle = `rgba(147, 51, 234, ${edgeAlpha})`;
    ctx.lineWidth = 1.25;
    fractures.forEach(([tx, ty, direction], index) => {
      const px = (tx + 0.5) * T;
      const py = (ty + 0.5) * T;
      const flicker = Math.round(Math.sin(GameState.F * 0.055 + index * 1.7) * 2);
      ctx.beginPath();
      ctx.moveTo(px - 10 * direction, py - 7);
      ctx.lineTo(px + flicker, py);
      ctx.lineTo(px - 6 * direction, py + 9);
      ctx.stroke();
      ctx.fillStyle = `rgba(196, 181, 253, ${edgeAlpha * 0.75})`;
      ctx.fillRect(Math.round(px + flicker) - 1, Math.round(py) - 1, 3, 3);
    });

    // 3. Teleport Destination Arrival Shimmer (Clean transient telegraph, not a persistent portal)
    if (boss && boss.teleportState === 'windup' && boss.teleportDest) {
      const dtx = (boss.teleportDest.x + 0.5) * T;
      const dty = (boss.teleportDest.y + 0.5) * T;
      const prog = 1 - Math.max(0, (boss.teleportTimer || 0) / 0.62);
      ctx.save();
      ctx.strokeStyle = `rgba(216, 180, 254, ${0.25 + prog * 0.55})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(dtx, dty + 10, 18 * prog, 8 * prog, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(232, 121, 249, ${0.12 + prog * 0.28})`;
      ctx.fill();
      ctx.restore();
    }

    // 4. Inlaid Sanctuary Wards: Architecturally Integrated Safe Areas
    const safeAreas = room.voidSafeAreas || (room.voidSafeArea ? [room.voidSafeArea] : []);
    safeAreas.forEach(safe => {
      const sx = (safe.x + 0.5) * T;
      const sy = (safe.y + 0.5) * T;
      const sr = safe.r * T;
      const inSafe = !!(P && Math.hypot(P.x - safe.x, P.y - safe.y) <= safe.r);

      ctx.save();

      // Physical Inlaid Slate Medallion Floor Base
      ctx.fillStyle = inSafe ? '#1e2538' : '#141a27';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Flagstone Masonry Seams
      ctx.strokeStyle = inSafe ? 'rgba(71, 85, 105, 0.55)' : 'rgba(51, 65, 85, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 0.58, 0, Math.PI * 2);
      ctx.stroke();

      // Radial Stone Joints
      for (let i = 0; i < 8; i++) {
        const a = i * (Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * (sr * 0.22), sy + Math.sin(a) * (sr * 0.22));
        ctx.lineTo(sx + Math.cos(a) * (sr * 0.95), sy + Math.sin(a) * (sr * 0.95));
        ctx.stroke();
      }

      // Restrained Moonlight-Silver Stillness Fill (Does not obscure characters or projectiles)
      const calm = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      calm.addColorStop(0, inSafe ? 'rgba(224, 231, 255, 0.16)' : 'rgba(224, 231, 255, 0.06)');
      calm.addColorStop(0.75, inSafe ? 'rgba(147, 197, 253, 0.09)' : 'rgba(147, 197, 253, 0.03)');
      calm.addColorStop(1, 'rgba(147, 197, 253, 0)');
      ctx.fillStyle = calm;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();

      // Inlaid Carved Perimeter Curb Stones
      ctx.strokeStyle = inSafe ? 'rgba(224, 231, 255, 0.85)' : 'rgba(148, 184, 219, 0.40)';
      ctx.lineWidth = inSafe ? 2.0 : 1.25;
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 0.96, 0, Math.PI * 2);
      ctx.stroke();

      // Chiseled Cardinal & Ordinal Boundary Anchor Stones (Flush with floor)
      ctx.fillStyle = inSafe ? '#f8fafc' : '#94a3b8';
      for (let i = 0; i < 8; i++) {
        const a = i * (Math.PI / 4);
        const bx = sx + Math.cos(a) * (sr * 0.96);
        const by = sy + Math.sin(a) * (sr * 0.96);
        ctx.fillRect(Math.round(bx) - 1.5, Math.round(by) - 1.5, 3, 3);
      }

      // Delicate Settling Sanctuary Dust Motes (Resting downward within boundary)
      for (let i = 0; i < 5; i++) {
        const moteA = (i * 1.25) + GameState.F * 0.008;
        const moteD = (sr * 0.25) + ((i * 19) % Math.round(sr * 0.55));
        const myDrift = ((GameState.F * 0.28 + i * 17) % 20) - 10;
        const mx = sx + Math.cos(moteA) * moteD;
        const my = sy + Math.sin(moteA) * (moteD * 0.6) + myDrift * 0.25;
        ctx.fillStyle = inSafe ? 'rgba(255, 255, 255, 0.70)' : 'rgba(203, 213, 225, 0.35)';
        ctx.fillRect(Math.round(mx), Math.round(my), 1.5, 1.5);
      }

      ctx.restore();
    });

    // 5. Void Pressure Zone (Telegraphed Dangerous Spatial Rifts)
    const zone = boss && boss.voidPressureZone;
    if (zone && zone.state !== 'expired') {
      const zx = (zone.x + 0.5) * T;
      const zy = (zone.y + 0.5) * T;
      const zr = zone.r * T;
      const warning = zone.state === 'warning';
      const pulse = 0.5 + Math.sin(GameState.F * (warning ? 0.32 : 0.14)) * 0.5;

      ctx.fillStyle = warning ? `rgba(216, 180, 254, ${0.06 + pulse * 0.08})` : 'rgba(59, 7, 100, 0.26)';
      ctx.beginPath();
      ctx.arc(zx, zy, zr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = warning ? `rgba(232, 121, 249, ${0.40 + pulse * 0.40})` : 'rgba(192, 132, 252, 0.82)';
      ctx.lineWidth = warning ? 2 : 2.5;
      ctx.setLineDash(warning ? [6, 4] : []);
      ctx.beginPath();
      ctx.arc(zx, zy, zr * (warning ? (0.92 + pulse * 0.06) : 1), 0, Math.PI * 2);
      ctx.stroke();

      if (!warning) {
        // Jagged abyssal fracture lines inside active hazard
        for (let i = 0; i < 8; i++) {
          const a = GameState.F * 0.045 + i * (Math.PI * 2 / 8);
          const d = zr * (0.25 + ((i * 11) % 6) * 0.11);
          ctx.fillStyle = i % 2 ? '#c084fc' : '#e879f9';
          ctx.fillRect(Math.round(zx + Math.cos(a) * d) - 1, Math.round(zy + Math.sin(a) * d) - 1, 3, 3);
        }
      }
    }

    // 6. World-Space Sanity Pressure Signs (Subtle perimeter instability as sanity drops)
    if (san < 50) {
      const pressureFactor = (50 - san) / 50;
      const pPulse = Math.sin(GameState.F * 0.08) * 0.02;
      ctx.strokeStyle = `rgba(168, 85, 247, ${pressureFactor * 0.18 + pPulse})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(rx + 16, ry + 16, rw - 32, rh - 32);
    }

    ctx.restore();
  },

  drawTiles(ctx) {
    const { MAP, LV, CAM } = GameState;
    if (!MAP || MAP.length === 0) return;
    const theme = getTheme(LV);

    // High-performance viewport culling: only render tiles in camera view + 2-tile margin
    const camX = CAM ? CAM.x : (COLS / 2);
    const camY = CAM ? CAM.y : (ROWS / 2);
    const camZoom = CAM ? (CAM.z || 1.0) : 1.0;
    const halfW = (LW / 2) / (T * camZoom);
    const halfH = (LH / 2) / (T * camZoom);
    const minC = Math.max(0, Math.floor(camX - halfW) - 2);
    const maxC = Math.min(COLS - 1, Math.ceil(camX + halfW) + 2);
    const minR = Math.max(0, Math.floor(camY - halfH) - 2);
    const maxR = Math.min(ROWS - 1, Math.ceil(camY + halfH) + 2);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const tile = MAP[r] ? MAP[r][c] : 1;
        const x = c * T;
        const y = r * T;

        // 1. SOLID 2.5D WALL (True Physical Elevation, Front Face & Bevels)
        if (tile === 1) {
          const hasSouth = (r < ROWS - 1 && MAP[r + 1] && MAP[r + 1][c] === 1);
          const hasNorth = (r > 0 && MAP[r - 1] && MAP[r - 1][c] === 1);
          const hasWest  = (c > 0 && MAP[r][c - 1] === 1);
          const hasEast  = (c < COLS - 1 && MAP[r][c + 1] === 1);

          // Exposed Front Face Wall (wall faces downward into open room/corridor)
          if (!hasSouth) {
            // A. Top Cap (Horizontal surface of wall seen from slightly elevated 2.5D angle)
            ctx.fillStyle = theme.wc[1] || '#334155';
            ctx.fillRect(x, y, T, 10);

            // Top Cap North Specular Edge
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillRect(x, y, T, 1.5);

            // Cap Paver Seams
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.fillRect(x + 15, y, 1.2, 10);
            ctx.fillRect(x, y + 9, T, 1.2); // Crevice separating cap from vertical face

            // B. Vertical Front Face (Facing player)
            const frontGrad = ctx.createLinearGradient(x, y + 10, x, y + T);
            frontGrad.addColorStop(0, theme.wc[0] || '#1e293b');
            frontGrad.addColorStop(1, '#090d16');
            ctx.fillStyle = frontGrad;
            ctx.fillRect(x, y + 10, T, T - 10);

            // Layered Heavy Masonry Courses on Front Face
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(x, y + 18, T, 1.2);
            ctx.fillRect(x, y + 26, T, 1.2);

            // Staggered Vertical Mortar Grooves
            const sOffset = (r % 2 === 0) ? 8 : 20;
            ctx.fillRect(x + (sOffset % T), y + 10, 1.2, 8);
            ctx.fillRect(x + ((sOffset + 16) % T), y + 18, 1.2, 8);
            ctx.fillRect(x + ((sOffset + 8) % T), y + 26, 1.2, 6);

            // Subtle Bevel Highlight on Masonry Courses
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(x, y + 10.5, T, 1);
            ctx.fillRect(x, y + 18.5, T, 1);

            // C. Deep Ambient Occlusion Drop Shadow onto Floor Below
            ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
            ctx.fillRect(x, y + T - 6, T, 6);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.fillRect(x, y + T, T, 5); // Bleeds onto adjacent floor tile
          } else {
            // Interior Continuous Solid Wall Block
            ctx.fillStyle = theme.wc[0] || '#1e293b';
            ctx.fillRect(x, y, T, T);

            // Horizontal Mortar Seams
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(x, y + 10, T, 1.2);
            ctx.fillRect(x, y + 21, T, 1.2);

            // Vertical Mortar Joints
            const stagger = (r % 2 === 0) ? 14 : 0;
            ctx.fillRect(x + ((8 + stagger) % T), y, 1.2, 10);
            ctx.fillRect(x + ((24 + stagger) % T), y + 10, 1.2, 11);

            // Top Bevel Rim
            ctx.fillStyle = theme.wc[1] || '#334155';
            ctx.fillRect(x, y, T, 2.5);
          }

          // Exposed West Face Shadow Depth
          if (!hasWest) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(x, y, 3, T);
          }
          // Exposed East Face Highlight
          if (!hasEast) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(x + T - 2, y, 2, T);
          }
        }
        // 0. STANDARD DUNGEON FLAGSTONE FLOOR (2.5D Beveled Pavers)
        else if (tile === 0) {
          const colIdx = (r * 7 + c * 13) % (theme.fc.length || 1);
          ctx.fillStyle = theme.fc[colIdx] || '#0c1526';
          ctx.fillRect(x, y, T, T);

          // Deep Stone Grout Perimeter
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);

          // Inner Paver Top-Left Specular Bevel Highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 1, y + T - 2);
          ctx.lineTo(x + 1, y + 1);
          ctx.lineTo(x + T - 2, y + 1);
          ctx.stroke();

          // Procedural Weathered Masonry Detail
          const detailSeed = (r * 13 + c * 29) % 17;
          if (detailSeed === 0) {
            // Jagged stone fracture
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 6);
            ctx.lineTo(x + 14, y + 16);
            ctx.lineTo(x + 24, y + 13);
            ctx.stroke();
            // Fissure specular edge
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 7);
            ctx.lineTo(x + 15, y + 17);
            ctx.stroke();
          } else if (detailSeed === 5) {
            // Carved corner rune grooves
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(x + 3, y + 3, 3, 3);
            ctx.fillRect(x + T - 6, y + 3, 3, 3);
            ctx.fillStyle = 'rgba(147, 197, 253, 0.08)';
            ctx.fillRect(x + 3.5, y + 3.5, 2, 2);
          } else if (detailSeed === 11) {
            // Central chisel scuff
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.fillRect(x + 10, y + 14, 12, 4);
          }

          // Subtle Temporal Storytelling: Ancient Broken Temporal Glyphs (Floors 4–10)
          // Rare, weathered, integrated into stone masonry (roughly 1 in 85 floor tiles)
          const temporalSeed = (r * 37 + c * 59 + (GameState.LV || 1) * 23);
          if (GameState.LV >= 4 && temporalSeed % 89 === 0) {
            _drawTemporalStoneGlyph(ctx, x, y, GameState.LV, temporalSeed);
          }
        }
        // 2. COSMIC EXIT PORTAL
        else if (tile === 2) {
          if (GameState.LV === 6 && !GameState.BOSS_PORTAL_UNLOCKED) {
            // On Floor 6, portal remains dormant until Malakor is defeated
            ctx.fillStyle = '#06040d';
            ctx.fillRect(x, y, T, T);
            ctx.fillStyle = '#120b22';
            ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
            ctx.strokeStyle = 'rgba(147, 51, 234, 0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 3.5, y + 3.5, T - 7, T - 7);
            ctx.fillStyle = 'rgba(126, 34, 206, 0.4)';
            ctx.beginPath();
            ctx.arc(x + T / 2, y + T / 2, 4, 0, 6.28);
            ctx.fill();
            continue;
          }
          if (GameState.LV === 10 && !GameState.BOSS_PORTAL_UNLOCKED) {
            // On Floor 10, portal only renders once defeated & unlocked
            ctx.fillStyle = '#1c0505';
            ctx.fillRect(x, y, T, T);
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 3.5, y + 3.5, T - 7, T - 7);
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(x + T / 2, y + T / 2, 4, 0, 6.28);
            ctx.fill();
            continue;
          }

          if (PortalTransition && PortalTransition.drawWorldPortal) {
            let portalContext = (PORTAL_CONTEXTS && PORTAL_CONTEXTS.STANDARD_FLOOR_EXIT) || 'STANDARD_FLOOR_EXIT';
            if (GameState.LV === 3) portalContext = PORTAL_CONTEXTS.GORGAROTH_DEATH_PORTAL;
            else if (GameState.LV === 6) portalContext = PORTAL_CONTEXTS.MALAKOR_VOID_PORTAL;
            else if (GameState.LV === 10) portalContext = PORTAL_CONTEXTS.ABYSS_WARDEN_ENDING_PORTAL;
            PortalTransition.drawWorldPortal(ctx, x, y, T, portalContext);
          } else {
            ctx.fillStyle = '#050714';
            ctx.fillRect(x, y, T, T);
          }
        }
        // 3. SUBTERRANEAN CHASM / ABYSS PIT (Bottomless Hazard)
        else if (tile === 3) {
          // Bottomless pitch-black depth base
          ctx.fillStyle = '#020308';
          ctx.fillRect(x, y, T, T);

          // Deep vertical abyss gradient falling into infinite void
          const chasmGrad = ctx.createLinearGradient(x, y, x, y + T);
          chasmGrad.addColorStop(0, '#060913');
          chasmGrad.addColorStop(0.35, '#020308');
          chasmGrad.addColorStop(1, '#000000');
          ctx.fillStyle = chasmGrad;
          ctx.fillRect(x, y, T, T);

          // Deep vertical rock face striations (towering cliff fissures)
          ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
          ctx.fillRect(x + 7, y, 1.5, T);
          ctx.fillRect(x + 21, y, 1.2, T);

          // Multi-directional crumbling cliff rims & drop shadows
          // North cliff rim
          if (r > 0 && MAP[r - 1] && MAP[r - 1][c] !== 3) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
            ctx.fillRect(x, y, T, 6);
            // Jagged stone edge highlight
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x, y + 1.5);
            ctx.lineTo(x + T * 0.35, y + 3.2);
            ctx.lineTo(x + T * 0.7, y + 1.8);
            ctx.lineTo(x + T, y + 2.8);
            ctx.stroke();
          }

          // South cliff rim
          if (r < ROWS - 1 && MAP[r + 1] && MAP[r + 1][c] !== 3) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(x, y + T - 4, T, 4);
            ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y + T - 1); ctx.lineTo(x + T, y + T - 1);
            ctx.stroke();
          }

          // West cliff edge
          if (c > 0 && MAP[r][c - 1] !== 3) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(x, y, 5, T);
            ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + T);
            ctx.stroke();
          }

          // East cliff edge
          if (c < COLS - 1 && MAP[r][c + 1] !== 3) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(x + T - 5, y, 5, T);
            ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + T - 1, y); ctx.lineTo(x + T - 1, y + T);
            ctx.stroke();
          }

          // Subtle organic drifting void motes (seamless, never circular tiles)
          const moteSeed = (r * 13 + c * 7);
          const moteT = GameState.F * 0.02 + moteSeed;
          if (moteSeed % 3 === 0) {
            const mx = x + (Math.sin(moteT) * 0.4 + 0.5) * T;
            const my = y + (Math.cos(moteT * 0.8) * 0.4 + 0.5) * T;
            ctx.fillStyle = 'rgba(129, 140, 248, 0.22)';
            ctx.fillRect(mx - 1, my - 1, 2, 2);
          }
        }
        // 4. STONE BRIDGE WALKWAY (2.5D Heavy Masonry Arch Bridge)
        else if (tile === 4) {
          const isWestChasm = (c > 0 && MAP[r][c - 1] === 3);
          const isEastChasm = (c < COLS - 1 && MAP[r][c + 1] === 3);
          const isNorthChasm = (r > 0 && MAP[r - 1] && MAP[r - 1][c] === 3);
          const isSouthChasm = (r < ROWS - 1 && MAP[r + 1] && MAP[r + 1][c] === 3);

          // Solid Granite Deck Slabs
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y, T, T);

          // Alternating Masonry Pavers & Mortar Lines
          ctx.fillStyle = '#273549';
          ctx.fillRect(x + 3, y + 2, T - 6, T - 4);

          // Worn Center Walking Path
          ctx.fillStyle = '#334155';
          if (isWestChasm || isEastChasm) {
            // North-South Bridge: central worn strip
            ctx.fillRect(x + 9, y, T - 18, T);
            // Horizontal paver joints
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x + 3, y + 7, T - 6, 1.2);
            ctx.fillRect(x + 3, y + 17, T - 6, 1.2);
            ctx.fillRect(x + 3, y + 27, T - 6, 1.2);
          } else {
            // East-West Bridge: central worn strip
            ctx.fillRect(x, y + 9, T, T - 18);
            // Vertical paver joints
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x + 7, y + 3, 1.2, T - 6);
            ctx.fillRect(x + 17, y + 3, 1.2, T - 6);
            ctx.fillRect(x + 27, y + 3, 1.2, T - 6);
          }

          // 3D Stone Guardrails / Balustrades on Chasm-Facing Edges
          if (isWestChasm) {
            // Left Guardrail
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x - 3, y, 3, T); // Cast shadow onto chasm
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x, y, 4, T);
            ctx.fillStyle = '#475569';
            ctx.fillRect(x + 1, y, 2.5, T);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(x, y, 1.2, T);
            // Balustrade post caps
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(x, y + 4, 3, 3);
            ctx.fillRect(x, y + 18, 3, 3);
          }

          if (isEastChasm) {
            // Right Guardrail
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x + T, y, 3, T); // Cast shadow onto chasm
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x + T - 4, y, 4, T);
            ctx.fillStyle = '#475569';
            ctx.fillRect(x + T - 3.5, y, 2.5, T);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(x + T - 1.2, y, 1.2, T);
            // Balustrade post caps
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(x + T - 3, y + 4, 3, 3);
            ctx.fillRect(x + T - 3, y + 18, 3, 3);
          }

          if (isNorthChasm) {
            // Top Guardrail (for E-W bridges)
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x, y, T, 4);
            ctx.fillStyle = '#475569';
            ctx.fillRect(x, y + 1, T, 2);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(x, y, T, 1.2);
          }

          if (isSouthChasm) {
            // Bottom Guardrail (for E-W bridges)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(x, y + T, T, 4); // Drop shadow into chasm
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x, y + T - 4, T, 4);
            ctx.fillStyle = '#475569';
            ctx.fillRect(x, y + T - 3, T, 2);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(x, y + T - 1.2, T, 1.2);
          }

          // Abutment Anchors: Where bridge connects to solid stone floor
          const isTouchingSolidNorth = (r > 0 && MAP[r - 1] && (MAP[r - 1][c] === 0 || MAP[r - 1][c] === 5));
          const isTouchingSolidSouth = (r < ROWS - 1 && MAP[r + 1] && (MAP[r + 1][c] === 0 || MAP[r + 1][c] === 5));
          if (isTouchingSolidNorth) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x, y, T, 2.5);
            ctx.fillStyle = '#475569';
            ctx.fillRect(x + 2, y, 4, 3);
            ctx.fillRect(x + T - 6, y, 4, 3);
          }
          if (isTouchingSolidSouth) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x, y + T - 2.5, T, 2.5);
            ctx.fillStyle = '#475569';
            ctx.fillRect(x + 2, y + T - 3, 4, 3);
            ctx.fillRect(x + T - 6, y + T - 3, 4, 3);
          }
        }
        // 5. ORNATE CEREMONIAL RUNNER / ROYAL CARPET (Throne Room)
        else if (tile === 5) {
          // Drop Shadow onto Surrounding Stone Slabs
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(x, y, T, T);

          // Deep Crimson Woven Velvet Base
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(x + 1, y + 1, T - 2, T - 2);

          // Inner Velvet Plush Highlight
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(x + 3, y + 3, T - 6, T - 6);

          // Braided Gold Thread Border
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(x + 3.5, y + 3.5, T - 7, T - 7);

          // Ornate Diamond Heraldic Inlay
          ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
          ctx.beginPath();
          ctx.moveTo(x + T / 2, y + 7);
          ctx.lineTo(x + T - 7, y + T / 2);
          ctx.lineTo(x + T / 2, y + T - 7);
          ctx.lineTo(x + 7, y + T / 2);
          ctx.closePath();
          ctx.fill();

          // Center Ruby Accent
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.arc(x + T / 2, y + T / 2, 2.5, 0, 6.28);
          ctx.fill();
        }
      }
    }

    // 6. GORGAROTH'S IRON JAIL (Floor 3 Boss Arena Floor Details)
    if (GameState.ROOMS && GameState.ROOMS[0] && GameState.ROOMS[0].type === 'gorgaroth_arena') {
      this.drawGorgarothArena(ctx, GameState.ROOMS[0]);
    }
    // 7. ABYSS WARDEN'S THRONE ROOM (Floor 10 Final Boss Arena Floor Details)
    else if (GameState.ROOMS && GameState.ROOMS[0] && GameState.ROOMS[0].type === 'throne_room') {
      this.drawWardenThroneRoom(ctx, GameState.ROOMS[0]);
    }
  },

  drawGorgarothArena(ctx, room) {
    if (!room) return;
    const cx = room.cx * T;
    const cy = room.cy * T;

    ctx.save();

    // A. Ambient molten machinery heat glow under center dais
    const daisGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 180);
    daisGlow.addColorStop(0, 'rgba(249, 115, 22, 0.08)');
    daisGlow.addColorStop(0.5, 'rgba(194, 65, 12, 0.04)');
    daisGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = daisGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.fill();

    // B. Ancient concentric iron floor markings / restraint runes
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.arc(cx, cy, 128, 0, Math.PI * 2);
    ctx.arc(cx, cy, 192, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing amber rune inlays & radial notch lines
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.16)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // 8 Radial iron restraint spokes
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const x1 = cx + Math.cos(ang) * 48;
      const y1 = cy + Math.sin(ang) * 48;
      const x2 = cx + Math.cos(ang) * 192;
      const y2 = cy + Math.sin(ang) * 192;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.40)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // C. Broken prison mechanisms (winches / shattered cogwheels near pillars)
    if (room.winches) {
      room.winches.forEach(([wx, wy]) => {
        const px = wx * T + T / 2;
        const py = wy * T + T / 2;
        // Heavy rusted mounting bracket
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(px - 10, py - 10, 20, 20);
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 10, py - 10, 20, 20);
        // Broken cogwheel
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Iron bolts
        ctx.fillStyle = '#78716c';
        ctx.fillRect(px - 8, py - 8, 2, 2);
        ctx.fillRect(px + 6, py - 8, 2, 2);
        ctx.fillRect(px - 8, py + 6, 2, 2);
        ctx.fillRect(px + 6, py + 6, 2, 2);
      });
    }

    // D. Heavy wall-embedded iron chains
    if (room.wallChains) {
      room.wallChains.forEach(([cxT, cyT]) => {
        const px = cxT * T + T / 2;
        const py = cyT * T;
        // Wall ring eyebolt
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py + 8, 5, 0, Math.PI * 2);
        ctx.stroke();
        // Dangling chain links
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px, py + 13);
        ctx.lineTo(px - 1, py + 22);
        ctx.lineTo(px + 1, py + 32);
        ctx.lineTo(px, py + 42);
        ctx.stroke();
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    ctx.restore();
  },

  drawWardenThroneRoom(ctx, room) {
    if (!room) return;
    const cx = room.cx * T + T / 2;
    const cy = room.cy * T + T / 2;
    const tx = (room.throneX !== undefined ? room.throneX : room.cx) * T + T / 2;
    const ty = (room.throneY !== undefined ? room.throneY : room.cy - 6) * T + T / 2;

    ctx.save();

    // A. Ambient abyssal ember glow radiating from the arena center
    const arenaGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 240);
    arenaGlow.addColorStop(0, 'rgba(220, 38, 38, 0.09)');
    arenaGlow.addColorStop(0.45, 'rgba(147, 51, 234, 0.05)');
    arenaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = arenaGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.fill();

    // B. Ancient circular central combat ring with runic inlays
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.arc(cx, cy, 160, 0, Math.PI * 2);
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle crimson runic channels catching the firelight
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 8 Radial runic spokes pointing toward arena center
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const x1 = cx + Math.cos(ang) * 60;
      const y1 = cy + Math.sin(ang) * 60;
      const x2 = cx + Math.cos(ang) * 240;
      const y2 = cy + Math.sin(ang) * 240;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      ctx.strokeStyle = 'rgba(220, 38, 38, 0.14)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // C. The Monumental Obsidian Throne (Throne Dais at tx, ty)
    // 1. Raised Stone Dais Platform (3 stone steps)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tx - 44, ty - 18, 88, 48);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(tx - 40, ty - 15, 80, 42);
    ctx.fillStyle = '#334155';
    ctx.fillRect(tx - 36, ty - 12, 72, 36);

    // Stone step borders & specular bevels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx - 40, ty - 15, 80, 42);
    ctx.strokeRect(tx - 36, ty - 12, 72, 36);

    // 2. High-Backed Carved Obsidian Throne
    // Cast shadow on dais
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(tx, ty + 12, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Throne base seat block
    ctx.fillStyle = '#14031a';
    ctx.fillRect(tx - 20, ty - 6, 40, 22);
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tx - 20, ty - 6, 40, 22);

    // Left and right carved armrests with iron studs
    ctx.fillStyle = '#260633';
    ctx.fillRect(tx - 24, ty - 10, 8, 22);
    ctx.fillRect(tx + 16, ty - 10, 8, 22);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(tx - 23, ty - 9, 6, 4);
    ctx.fillRect(tx + 17, ty - 9, 6, 4);

    // Massive arched throne backrest
    ctx.fillStyle = '#0a010d';
    ctx.beginPath();
    ctx.moveTo(tx - 20, ty - 6);
    ctx.lineTo(tx - 22, ty - 42);
    // Horned crown crest arch
    ctx.lineTo(tx - 10, ty - 52);
    ctx.lineTo(tx, ty - 46);
    ctx.lineTo(tx + 10, ty - 52);
    ctx.lineTo(tx + 22, ty - 42);
    ctx.lineTo(tx + 20, ty - 6);
    ctx.closePath();
    ctx.fill();

    // Throne backrest runic outline
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Central demonic eye crest on throne back
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(tx, ty - 28, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09010a';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(tx, ty - 28, 1.2, 3.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // D. Heavy iron chains draped from pillars & throne sides
    if (room.wallChains) {
      room.wallChains.forEach(([cxT, cyT]) => {
        const px = cxT * T + T / 2;
        const py = cyT * T;
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py + 8, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px, py + 13);
        ctx.lineTo(px - 1, py + 24);
        ctx.lineTo(px + 1, py + 36);
        ctx.lineTo(px, py + 48);
        ctx.stroke();
      });
    }

    ctx.restore();
  },

  drawTorches(ctx) {
    if (!GameState.TORCHES || GameState.TORCHES.length === 0) return;

    GameState.TORCHES.forEach(t => {
      const px = t.x * T + T / 2;
      const py = t.y * T + T / 2;
      const flicker = Math.sin(GameState.F * 0.16 + t.ph) * 2.2;
      const isGrand = t.isGrand || t.isThrone;
      const isVoid = t.isVoid;

      ctx.save();

      // 1. Dynamic Floor Firelight Pool (Warm Radial Illumination)
      // Subtle repeating rhythm in environmental effects on deeper floors (1.0 Hz clock tick)
      const deepRhythm = (GameState.LV >= 6) ? Math.sin((GameState.F / 60) * Math.PI * 2) * 1.4 : 0;
      const lightRadius = (isGrand ? 38 : 26) + deepRhythm;
      const lightGrad = ctx.createRadialGradient(px, py + 4, 2, px, py + 4, lightRadius);
      if (isVoid) {
        lightGrad.addColorStop(0, 'rgba(192, 132, 252, 0.28)');
        lightGrad.addColorStop(0.5, 'rgba(126, 34, 206, 0.12)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        lightGrad.addColorStop(0, 'rgba(251, 191, 36, 0.32)');
        lightGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.14)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.ellipse(px, py + 6, lightRadius, lightRadius * 0.55, 0, 0, 6.28);
      ctx.fill();

      // 2. Hardware / Bracket Architecture
      if (isGrand) {
        // Monumental Ornate Footed Bronze/Iron Brazier
        // Base feet
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(px - 9, py + 6, 18, 4);
        ctx.fillStyle = '#44403c';
        ctx.fillRect(px - 7, py + 2, 14, 4);
        // Pedestal column
        ctx.fillStyle = '#78716c';
        ctx.fillRect(px - 3, py - 4, 6, 8);
        // Flared Brazier Bowl
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.moveTo(px - 11, py - 4);
        ctx.lineTo(px + 11, py - 4);
        ctx.lineTo(px + 7, py + 2);
        ctx.lineTo(px - 7, py + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        // Wrought-Iron Wall Sconce Bracket
        // Wall Mount Backplate
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - 4, py - 2, 8, 12);
        // Rivets
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px - 3, py - 1, 2, 2);
        ctx.fillRect(px + 1, py - 1, 2, 2);
        ctx.fillRect(px - 3, py + 7, 2, 2);
        ctx.fillRect(px + 1, py + 7, 2, 2);
        // Curved Iron Arm
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px, py + 6);
        ctx.quadraticCurveTo(px, py - 1, px, py - 4);
        ctx.stroke();
        // Torch Sconce Cup
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(px - 5, py - 4);
        ctx.lineTo(px + 5, py - 4);
        ctx.lineTo(px + 3, py - 1);
        ctx.lineTo(px - 3, py - 1);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Multi-Tier Dynamic Flame Simulation
      const flameBaseY = isGrand ? py - 4 : py - 4;
      const flameH = (isGrand ? 16 : 10) + flicker;
      const flameW = isGrand ? 8 : 4.5;

      // Outer Heat Corona
      ctx.shadowColor = isVoid ? '#c084fc' : '#f97316';
      ctx.shadowBlur = isGrand ? 20 : 12;

      // Outer Flame Body
      ctx.fillStyle = isVoid ? '#9333ea' : '#ea580c';
      ctx.beginPath();
      ctx.moveTo(px - flameW, flameBaseY);
      ctx.quadraticCurveTo(px - flameW * 0.8, flameBaseY - flameH * 0.5, px + (flicker * 0.6), flameBaseY - flameH);
      ctx.quadraticCurveTo(px + flameW * 0.8, flameBaseY - flameH * 0.5, px + flameW, flameBaseY);
      ctx.closePath();
      ctx.fill();

      // Middle Vibrant Flame Core
      ctx.fillStyle = isVoid ? '#e879f9' : '#f97316';
      ctx.beginPath();
      ctx.moveTo(px - flameW * 0.6, flameBaseY);
      ctx.quadraticCurveTo(px - flameW * 0.5, flameBaseY - flameH * 0.6, px + (flicker * 0.3), flameBaseY - flameH * 0.85);
      ctx.quadraticCurveTo(px + flameW * 0.5, flameBaseY - flameH * 0.6, px + flameW * 0.6, flameBaseY);
      ctx.closePath();
      ctx.fill();

      // Inner White-Hot Teardrop Core
      ctx.fillStyle = isVoid ? '#fae8ff' : '#fef08a';
      ctx.beginPath();
      ctx.arc(px, flameBaseY - flameH * 0.35, flameW * 0.4, 0, 6.28);
      ctx.fill();

      // 4. Floating Rising Ember Particles
      const emberSeed = t.ph * 10;
      for (let e = 0; e < 3; e++) {
        const et = (GameState.F * 0.05 + emberSeed + e * 2.1) % 1.0;
        const ey = flameBaseY - flameH - (et * (isGrand ? 24 : 14));
        const ex = px + Math.sin(et * 7 + e) * (flameW + 4);
        const eAlpha = (1 - et) * 0.8;
        ctx.fillStyle = isVoid ? `rgba(240, 171, 252, ${eAlpha})` : `rgba(254, 240, 138, ${eAlpha})`;
        ctx.fillRect(ex - 0.7, ey - 0.7, 1.4, 1.4);
      }

      ctx.restore();
    });
  },

  drawTraps(ctx) {
    if (!GameState.TRAPS || GameState.TRAPS.length === 0) return;

    const traps = GameState.TRAPS.filter(t => !isInOpeningSafeZone(t.x, t.y, GameState.LV || 1));
    if (traps.length === 0) return;

    const time = GameState.F * 0.05;

    traps.forEach(t => {
      const cx = (t.x + 0.5) * T;
      const cy = (t.y + 0.5) * T;
      const tx = t.x * T;
      const ty = t.y * T;
      const state = t.state || 'idle';
      const st = t.stateTimer || 0;
      const isSpike = t.type === 'spike';

      ctx.save();

      if (isSpike) {
        // ─────────────────────────────────────────────────────────────
        // SPIKE TRAP RENDERING (Stone Recess, Perforated Plate, 3D Spikes)
        // ─────────────────────────────────────────────────────────────
        const pad = 3;
        const plateW = T - pad * 2; // 26px
        const plateH = T - pad * 2; // 26px
        const px = tx + pad;
        const py = ty + pad;

        // 1. Recessed Floor Cavity (Dark stone cutout)
        ctx.fillStyle = '#090d16';
        ctx.fillRect(px - 1, py - 1, plateW + 2, plateH + 2);

        // 2. Iron Grate Base Plate
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, py, plateW, plateH);

        // Inner beveled stone border
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, plateW - 1, plateH - 1);

        // Corner Rivets
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 2, py + 2, 2, 2);
        ctx.fillRect(px + plateW - 4, py + 2, 2, 2);
        ctx.fillRect(px + 2, py + plateH - 4, 2, 2);
        ctx.fillRect(px + plateW - 4, py + plateH - 4, 2, 2);

        // 3. 3x3 Perforated Spike Apertures
        const holePositions = [];
        const offsets = [6, 13, 20];
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const hx = px + offsets[col];
            const hy = py + offsets[row];
            holePositions.push({ x: hx, y: hy });
            // Hole dark opening
            ctx.fillStyle = '#050811';
            ctx.fillRect(hx - 1.5, hy - 1.5, 3, 3);
            // Steel aperture rim
            ctx.fillStyle = '#475569';
            ctx.fillRect(hx - 1.5, hy - 1.5, 3, 0.8);
          }
        }

        // 4. State-Driven Spike Simulation & Telegraphs
        if (state === 'telegraph') {
          // Warning Phase: Mechanical click, amber warning floor perimeter, tips emerge
          const prog = Math.min(1.0, st / 0.45);
          const pulse = Math.sin(prog * Math.PI) * 0.35 + 0.15;

          // Danger Warning Tile Perimeter Indicator
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(tx + 1, ty + 1, T - 2, T - 2);

          // Subtle internal danger glow
          ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + pulse * 0.18})`;
          ctx.fillRect(px, py, plateW, plateH);

          // Protruding steel spike needle tips (1.5px - 3px)
          const tipEmergence = 1.5 + prog * 1.5;
          ctx.fillStyle = '#cbd5e1';
          holePositions.forEach(h => {
            ctx.fillRect(h.x - 1, h.y - 1 - tipEmergence, 2, tipEmergence);
            // Glistening metallic glint
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(h.x - 0.5, h.y - 1 - tipEmergence, 1, 1);
            ctx.fillStyle = '#cbd5e1';
          });
        } else if (state === 'active') {
          // Active Phase: Lethal Extended Needle Spikes (Full 14px height)
          const spikeH = 14;

          // Impact Danger Zone Ring
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 2;
          ctx.strokeRect(tx + 0.5, ty + 0.5, T - 1, T - 1);

          // Render 3D Needle Spikes for each aperture
          holePositions.forEach(h => {
            // Drop shadow cast onto plate
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.beginPath();
            ctx.ellipse(h.x + 2, h.y + 1, 3, 1.5, 0, 0, 6.28);
            ctx.fill();

            // Spike Blade Body (Triangle needle)
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(h.x - 1.8, h.y);
            ctx.lineTo(h.x, h.y - spikeH);
            ctx.lineTo(h.x + 1.8, h.y);
            ctx.closePath();
            ctx.fill();

            // Highlight side (Left specular edge)
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(h.x - 1.8, h.y);
            ctx.lineTo(h.x, h.y - spikeH);
            ctx.lineTo(h.x - 0.2, h.y);
            ctx.closePath();
            ctx.fill();

            // Shadow side (Right bevel)
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(h.x - 0.2, h.y);
            ctx.lineTo(h.x, h.y - spikeH);
            ctx.lineTo(h.x + 1.8, h.y);
            ctx.closePath();
            ctx.fill();

            // Puncture tip gleam
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(h.x - 0.6, h.y - spikeH - 0.5, 1.2, 1.5);
          });
        } else if (state === 'recovery') {
          // Recovery Phase: Spikes descending back into housing (14px down to 3px)
          const prog = Math.min(1.0, st / 0.25);
          const spikeH = Math.max(3, 14 * (1 - prog));

          holePositions.forEach(h => {
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.moveTo(h.x - 1.5, h.y);
            ctx.lineTo(h.x, h.y - spikeH);
            ctx.lineTo(h.x + 1.5, h.y);
            ctx.closePath();
            ctx.fill();

            // Specular edge
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(h.x - 0.8, h.y - spikeH, 1, spikeH);
          });
        } else if (state === 'cooldown') {
          // Cooldown Phase: Fully retracted, faint metallic lock state
          ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
          ctx.fillRect(px, py, plateW, plateH);
        }
      } else {
        // ─────────────────────────────────────────────────────────────
        // FIRE VENT TRAP RENDERING (Cast Iron Grille, Embers, Flame Plume)
        // ─────────────────────────────────────────────────────────────
        const rad = 12;

        // 1. Recessed circular burn pit
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(cx, cy, rad + 1, 0, 6.28);
        ctx.fill();

        // 2. Cast iron outer rim
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, 6.28);
        ctx.stroke();

        // 3. Radial iron vent slots
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(cx - Math.cos(ang) * (rad - 2), cy - Math.sin(ang) * (rad - 2));
          ctx.lineTo(cx + Math.cos(ang) * (rad - 2), cy + Math.sin(ang) * (rad - 2));
          ctx.stroke();
        }

        // Inner hub
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, 6.28);
        ctx.fill();

        // 4. Sub-grille pulsing magma embers (visible across idle/all states)
        const emberPulse = Math.sin(time * 2.5 + t.x * 3) * 0.15 + 0.35;
        const emberGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, rad - 2);
        emberGrad.addColorStop(0, `rgba(249, 115, 22, ${emberPulse + 0.2})`);
        emberGrad.addColorStop(0.7, `rgba(194, 65, 12, ${emberPulse * 0.7})`);
        emberGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = emberGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad - 2, 0, 6.28);
        ctx.fill();

        // 5. State-Driven Flame Vent Simulation & Telegraphs
        if (state === 'telegraph') {
          // Warning Phase: Expanding orange thermal warning ring & rising ignition sparks
          const prog = Math.min(1.0, st / 0.60);
          const warnRadius = rad + prog * 6;

          // Expanding thermal warning halo
          ctx.strokeStyle = `rgba(249, 115, 22, ${0.5 + Math.sin(prog * 12) * 0.3})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(cx, cy, warnRadius, 0, 6.28);
          ctx.stroke();

          // Intense core heat buildup
          ctx.fillStyle = `rgba(251, 146, 60, ${0.25 + prog * 0.45})`;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, 6.28);
          ctx.fill();

          // Rising sparks
          const sparkCount = 4;
          for (let sp = 0; sp < sparkCount; sp++) {
            const spProg = (prog * 2.5 + sp * 0.28) % 1.0;
            const spY = cy - spProg * 14;
            const spX = cx + Math.sin(spProg * 8 + sp) * (rad * 0.6);
            ctx.fillStyle = `rgba(254, 240, 138, ${1 - spProg})`;
            ctx.fillRect(spX - 0.8, spY - 0.8, 1.6, 1.6);
          }
        } else if (state === 'active') {
          // Active Phase: Roaring Multi-Layered Flame Column
          const flicker = Math.sin(GameState.F * 0.4) * 2.5;
          const flameH = 22 + flicker;
          const flameW = rad * 0.9;

          // Floor Heat Illumination Pool
          const lightGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 32);
          lightGrad.addColorStop(0, 'rgba(249, 115, 22, 0.40)');
          lightGrad.addColorStop(0.6, 'rgba(234, 88, 12, 0.15)');
          lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 32, 0, 6.28);
          ctx.fill();

          // Danger boundary ring
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, rad + 3, 0, 6.28);
          ctx.stroke();

          // Outer Roaring Flame Plume
          ctx.fillStyle = 'rgba(220, 38, 38, 0.82)';
          ctx.beginPath();
          ctx.moveTo(cx - flameW, cy);
          ctx.quadraticCurveTo(cx - flameW * 1.1, cy - flameH * 0.5, cx + flicker * 0.5, cy - flameH);
          ctx.quadraticCurveTo(cx + flameW * 1.1, cy - flameH * 0.5, cx + flameW, cy);
          ctx.closePath();
          ctx.fill();

          // Middle Vibrant Fire Jet
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(cx - flameW * 0.65, cy);
          ctx.quadraticCurveTo(cx - flameW * 0.6, cy - flameH * 0.6, cx + flicker * 0.3, cy - flameH * 0.85);
          ctx.quadraticCurveTo(cx + flameW * 0.6, cy - flameH * 0.6, cx + flameW * 0.65, cy);
          ctx.closePath();
          ctx.fill();

          // Core White-Hot Heat Spike
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(cx - flameW * 0.35, cy);
          ctx.quadraticCurveTo(cx - flameW * 0.25, cy - flameH * 0.4, cx, cy - flameH * 0.6);
          ctx.quadraticCurveTo(cx + flameW * 0.25, cy - flameH * 0.4, cx + flameW * 0.35, cy);
          ctx.closePath();
          ctx.fill();
        } else if (state === 'recovery') {
          // Recovery Phase: Dissipating Smoke Puffs & Dying Embers
          const prog = Math.min(1.0, st / 0.35);
          const smokeAlpha = (1 - prog) * 0.5;
          ctx.fillStyle = `rgba(100, 116, 139, ${smokeAlpha})`;
          ctx.beginPath();
          ctx.arc(cx + Math.sin(prog * 5) * 3, cy - 6 - prog * 8, 4 + prog * 4, 0, 6.28);
          ctx.fill();
        } else if (state === 'cooldown') {
          // Cooldown Phase: Dormant scorched vent
          ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, 6.28);
          ctx.fill();
        }
      }

      ctx.restore();
    });
  },

  drawItems(ctx) {
    const { ITEMS, P } = GameState;
    ITEMS.forEach(it => {
      if (it.taken) return;
      const px = (it.x + 0.5) * T;
      const py = (it.y + 0.5) * T;
      const bob = Math.sin(GameState.F * 0.08 + it.x + it.y) * 2;
      const ipy = py + bob;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(px, py + 12, 13, 5, 0, 0, 6.28);
      ctx.fill();

      if (it.kind === 'weapon') {
        const w = WD[it.sub] || WD.sword;
        const rar = it.rarity || RARITIES[0];
        ctx.save();
        ctx.shadowColor = rar.col;
        ctx.shadowBlur = 10;
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(w.icon, px, ipy);
        ctx.fillStyle = rar.col;
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.fillText(rar.name[0], px, ipy + 14);

        // Floating swap prompt if player is nearby
        const { P } = GameState;
        if (Math.hypot(P.x - it.x, P.y - it.y) < 1.35) {
          const hasEmpty = GameState.weaponSlots.some(s => s === null);
          const canInteract = (!it.swapCooldown || it.swapCooldown <= 0) && (!it.discardCooldown || it.discardCooldown <= 0);
          if (canInteract) {
            ctx.fillStyle = 'rgba(5, 8, 22, 0.92)';
            ctx.strokeStyle = rar.col;
            ctx.lineWidth = 1.0;
            const promptText = hasEmpty ? `[Walk / E] Collect ${w.label || it.sub}` : `[E] Swap Active   ·   [G] Choose Slot`;
            const pw = hasEmpty ? 130 : 180, ph = 20;
            roundRect(ctx, px - pw / 2, ipy - 30, pw, ph, 4);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fde68a';
            ctx.font = 'bold 8.5px Cinzel, serif';
            ctx.fillText(promptText, px, ipy - 20);
          }
        }
        ctx.restore();
      } else if (it.kind === 'health') {
        ctx.font = '15px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❤️', px, ipy);
      } else if (it.kind === 'sanity') {
        ctx.font = '15px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧠', px, ipy);
      } else if (it.kind === 'shield') {
        ctx.font = '17px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', px, ipy);
      } else if (it.kind === 'soul') {
        ctx.save();
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(px, ipy, 5, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#f3e8ff';
        ctx.beginPath();
        ctx.arc(px, ipy, 2.5, 0, 6.28);
        ctx.fill();
        ctx.restore();
      } else if (it.kind === 'story_echo') {
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✨', px, ipy);
      } else if (it.kind === 'lore_scroll') {
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📜', px, ipy);
      }
    });
  },

  drawShrines(ctx) {
    if (!GameState.SHRINES) return;
    const { P } = GameState;

    GameState.SHRINES.forEach(s => {
      const sx = (s.x + 0.5) * T;
      const sy = (s.y + 0.5) * T;
      const isNear = Math.hypot(P.x - s.x, P.y - s.y) < 1.35;

      ctx.save();
      // Stone Dais Base
      ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
      ctx.strokeStyle = s.used ? '#475569' : s.col;
      ctx.lineWidth = s.used ? 1.0 : 1.8;
      if (!s.used) {
        ctx.shadowColor = s.col;
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.ellipse(sx, sy + 6, 20, 11, 0, 0, 6.28);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner rune ring
      ctx.strokeStyle = s.used ? '#334155' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 6, 13, 7, 0, 0, 6.28);
      ctx.stroke();

      const bob = s.used ? 0 : Math.sin(GameState.F * 0.07 + (s.ph || 0)) * 3.5;
      const relicY = sy - 14 + bob;

      if (!s.used) {
        // Radiant pillar beam
        const beamGrad = ctx.createLinearGradient(sx, sy, sx, sy - 36);
        beamGrad.addColorStop(0, s.glow || 'rgba(201,168,76,0.35)');
        beamGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy + 4);
        ctx.lineTo(sx + 10, sy + 4);
        ctx.lineTo(sx + 5, sy - 36);
        ctx.lineTo(sx - 5, sy - 36);
        ctx.fill();

        // Glowing elemental orb icon
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = s.col;
        ctx.shadowBlur = 16;
        ctx.fillText(s.icon || '🔥', sx, relicY);
        ctx.shadowBlur = 0;

        // Rotating magical orbital spark
        const orbAng = GameState.F * 0.08 + (s.ph || 0);
        const ox = sx + Math.cos(orbAng) * 14;
        const oy = relicY + Math.sin(orbAng) * 6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 2.2, 0, 6.28);
        ctx.fill();

        // Subtle temporal echo: faint past-moment resonance around ancient magical relics
        if (Math.sin(GameState.F * 0.035 + (s.ph || 0)) > 0.93) {
          const lagAng = orbAng - 0.75;
          const lagOx = sx + Math.cos(lagAng) * 14;
          const lagOy = relicY + Math.sin(lagAng) * 6;
          ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
          ctx.beginPath();
          ctx.arc(lagOx, lagOy, 1.6, 0, 6.28);
          ctx.fill();
        }

        // Shrine Label Tag
        ctx.fillStyle = s.col;
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.name, sx, sy - 30 + bob);

        // Interaction Prompt when player is close
        if (isNear) {
          ctx.fillStyle = 'rgba(5, 8, 22, 0.92)';
          ctx.strokeStyle = s.col;
          ctx.lineWidth = 1.2;
          const pw = 164, ph = 22;
          roundRect(ctx, sx - pw / 2, sy - 58, pw, ph, 4);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px Cinzel, serif';
          ctx.fillText(`[ E / Walk ] ${s.desc}`, sx, sy - 47);
        }
      } else {
        // Dormant State
        ctx.fillStyle = '#64748b';
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏛️', sx, relicY);
        ctx.font = '8px Cinzel, serif';
        ctx.fillText('[Dormant Altar]', sx, sy - 24);
      }

      ctx.restore();
    });
  },

  drawAllies(ctx) {
    const { P } = GameState;
    GameState.ALLIES.forEach(a => {
      const ax = (a.x + 0.5) * T;
      const ay = (a.y + 0.5) * T;
      ctx.save();

      // If rescued, render ascending gratitude spirit & light particles
      if (a.rescued) {
        if (a.rescueAnim > 0) {
          const progress = 1.2 - a.rescueAnim;
          const ascY = ay - progress * 24;
          ctx.globalAlpha = Math.max(0, a.rescueAnim / 1.2);

          // Golden ascension aura
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(ax, ascY, 7, 0, 6.28);
          ctx.fill();

          ctx.font = 'bold 9px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText('🕊️ ASCENDED', ax, ascY - 14);
        }
        ctx.restore();
        return;
      }

      // UNRESCUED SURVIVOR: Kneeling Captive with Shivering Animation & Shackles
      const bob = Math.sin(GameState.F * 0.08 + a.ph) * 1.5;
      const isNear = Math.hypot(P.x - a.x, P.y - a.y) < 1.4;

      // Soft Ground Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(ax, ay + 10, 11, 4.5, 0, 0, 6.28);
      ctx.fill();

      // Tattered Cloak / Tunic (Forest green / slate cloak)
      ctx.fillStyle = '#1e392a';
      ctx.strokeStyle = '#2d5a42';
      ctx.lineWidth = 1;
      roundRect(ctx, ax - 8, ay - 4 + bob, 16, 13, 3);
      ctx.fill();
      ctx.stroke();

      // Bowed Head / Pale Face
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(ax, ay - 9 + bob, 5, 0, 6.28);
      ctx.fill();

      // Tattered Hood
      ctx.fillStyle = '#162e21';
      ctx.beginPath();
      ctx.arc(ax, ay - 10 + bob, 6, 3.14, 0);
      ctx.fill();

      // Chained Wrists & Iron Shackles
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(ax - 5, ay + 3 + bob, 10, 3);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(ax - 5, ay + 3 + bob, 10, 3);

      // Hanging Iron Chain Links
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(ax, ay + 6 + bob);
      ctx.lineTo(ax, ay + 11 + bob);
      ctx.stroke();

      // Pulsing "Help!" Speech Bubble Above Head
      const bubblePulse = Math.sin(GameState.F * 0.12 + a.ph) * 0.35 + 0.65;
      const bubY = ay - 24 + Math.sin(GameState.F * 0.07 + a.ph) * 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = isNear ? '#4ade80' : `rgba(34, 197, 94, ${bubblePulse})`;
      ctx.lineWidth = 1.2;
      roundRect(ctx, ax - 24, bubY, 48, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Tiny triangle tail pointing to captive
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.moveTo(ax - 3, bubY + 16);
      ctx.lineTo(ax + 3, bubY + 16);
      ctx.lineTo(ax, bubY + 20);
      ctx.fill();

      ctx.fillStyle = isNear ? '#86efac' : '#4ade80';
      ctx.font = 'bold 8px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isNear ? '💬 "HELP!"' : '⛓️ HELP', ax, bubY + 8);

      ctx.restore();
    });
  },

  drawMinimap(ctx) {
    if (!MINIMAP_VISIBLE) return;
    const { MAP, P, ENE, BOSS } = GameState;
    if (!MAP || MAP.length === 0) return;

    const mw = 120;
    const mh = 80;
    const mx = LW - mw - 14;
    const my = 70;

    ctx.save();
    ctx.fillStyle = 'rgba(5,8,22,0.85)';
    ctx.strokeStyle = 'rgba(201,168,76,0.6)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, mx, my, mw, mh, 6);
    ctx.fill();
    ctx.stroke();

    const scaleX = mw / COLS;
    const scaleY = mh / ROWS;

    // Floor and feature tiles
    ctx.fillStyle = 'rgba(100,116,139,0.3)';
    for (let r = 0; r < ROWS; r += 2) {
      for (let c = 0; c < COLS; c += 2) {
        if (!MAP[r]) continue;
        const t = MAP[r][c];
        if (t === 0 || t === 4) {
          ctx.fillRect(mx + c * scaleX, my + r * scaleY, scaleX * 2, scaleY * 2);
        } else if (t === 5) {
          // Ceremonial runner pip
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(mx + c * scaleX, my + r * scaleY, scaleX * 2, scaleY * 2);
          ctx.fillStyle = 'rgba(100,116,139,0.3)';
        } else if (t === 3) {
          // Chasm pit pip
          ctx.fillStyle = '#020617';
          ctx.fillRect(mx + c * scaleX, my + r * scaleY, scaleX * 2, scaleY * 2);
          ctx.fillStyle = 'rgba(100,116,139,0.3)';
        } else if (t === 2) {
          // Portal pip
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(mx + c * scaleX, my + r * scaleY, scaleX * 3, scaleY * 3);
          ctx.fillStyle = 'rgba(100,116,139,0.3)';
        }
      }
    }

    // Enemies pips
    ctx.fillStyle = '#ef4444';
    if (ENE) {
      ENE.forEach(e => {
        if (e.alive) {
          ctx.fillRect(mx + e.x * scaleX, my + e.y * scaleY, 2, 2);
        }
      });
    }

    // Boss pip
    if (BOSS && BOSS.alive) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(mx + BOSS.x * scaleX - 2, my + BOSS.y * scaleY - 2, 5, 5);
    }

    // Player pip
    ctx.fillStyle = '#facc15';
    ctx.fillRect(mx + P.x * scaleX - 1.5, my + P.y * scaleY - 1.5, 3.5, 3.5);

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // AUTHORITATIVE 2.5D GATE ENTITY RENDERING
  // Gate is a persistent physical entity with stone frame, dark iron portcullis,
  // wall lever, chain mechanism, bottom spikes, lock bolts, and wear.
  // Never converts to a generic wall tile.
  // ─────────────────────────────────────────────────────────────
  drawGates(ctx) {
    if (GameState.GATE) {
      this.drawGateEntity(ctx, GameState.GATE);
    }
    if (GameState.GATES && GameState.GATES.length > 0) {
      for (const g of GameState.GATES) {
        if (g !== GameState.GATE) this.drawGateEntity(ctx, g);
      }
    }
  },

  drawGateEntity(ctx, gate) {
    if (!gate) return;
    const gx = gate.x * T;
    const gy = gate.y * T;
    const gh = (gate.height || 2) * T;
    const gw = (gate.width || 1) * T;
    const drop = gate.dropProgress !== undefined ? gate.dropProgress : (gate.solid ? 1.0 : 0.0);
    const gateYOffset = -gh * (1.0 - drop);

    ctx.save();

    // 1. Massive Stone Framing & Deep Doorway Threshold
    // Heavy Masonry Side Columns / Jambs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gx - 8, gy - 20, 10, gh + 24);
    ctx.fillRect(gx + gw - 2, gy - 20, 10, gh + 24);

    // Stone Column Details & Mortar Seams
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gx - 9, gy - 12, 11, 2);
    ctx.fillRect(gx - 9, gy + 16, 11, 2);
    ctx.fillRect(gx - 9, gy + 44, 11, 2);
    ctx.fillRect(gx + gw - 3, gy - 12, 11, 2);
    ctx.fillRect(gx + gw - 3, gy + 16, 11, 2);
    ctx.fillRect(gx + gw - 3, gy + 44, 11, 2);

    // Massive Stone Lintel Beam (top archway)
    ctx.fillStyle = '#334155';
    ctx.fillRect(gx - 10, gy - 26, gw + 20, 14);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(gx - 10, gy - 26, gw + 20, 2); // Highlight
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gx - 10, gy - 13, gw + 20, 2); // Underside shadow

    // Threshold Floor Groove (where portcullis embeds into stone)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(gx, gy + gh - 4, gw, 6);

    // Lever Mechanism (mounted on west outer wall)
    const leverProg = gate.leverProgress || (gate.solid ? 1.0 : 0.0);
    ctx.fillStyle = '#475569';
    ctx.fillRect(gx - 14, gy + 12, 5, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gx - 13, gy + 14, 3, 10);
    // Lever Arm & Grip
    ctx.save();
    ctx.translate(gx - 11.5, gy + 19);
    ctx.rotate(leverProg * 1.35); // Rotates downward when pulled
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-1.5, -11, 3, 13);
    ctx.beginPath();
    ctx.arc(0, -11, 3, 0, Math.PI * 2); // Brass knob
    ctx.fill();
    ctx.restore();

    // Pulley & Heavy Chain System
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(gx - 4, gy - 18, 4, 0, Math.PI * 2); // Pulley wheel
    ctx.arc(gx + gw + 4, gy - 18, 4, 0, Math.PI * 2);
    ctx.fill();

    // Portcullis Grate (Dark Iron Bars, Cross Braces, Spikes, Rust Highlights)
    ctx.save();
    // Clip to doorway opening so gate rises cleanly into the lintel recess
    ctx.beginPath();
    ctx.rect(gx - 2, gy - 20, gw + 4, gh + 22);
    ctx.clip();

    ctx.translate(0, gateYOffset);

    // Dark Iron Portcullis Frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gx, gy - 16, gw, gh + 16);

    // Heavy Horizontal Iron Bands with Rivets
    ctx.fillStyle = '#334155';
    ctx.fillRect(gx, gy - 6, gw, 5);
    ctx.fillRect(gx, gy + 18, gw, 5);
    ctx.fillRect(gx, gy + 42, gw, 5);

    // Metallic Specular Highlights & Wear
    ctx.fillStyle = 'rgba(203, 213, 225, 0.22)';
    ctx.fillRect(gx, gy - 6, gw, 1.2);
    ctx.fillRect(gx, gy + 18, gw, 1.2);
    ctx.fillRect(gx, gy + 42, gw, 1.2);

    // Vertical Iron Bars
    const barCount = 5;
    for (let b = 0; b < barCount; b++) {
      const bx = gx + 3 + b * 6.5;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx, gy - 16, 3.5, gh + 16);
      ctx.fillStyle = '#475569';
      ctx.fillRect(bx + 0.8, gy - 16, 1.2, gh + 16); // Specular streak
      // Rivet heads at intersections
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(bx + 0.8, gy - 4.5, 1.8, 1.8);
      ctx.fillRect(bx + 0.8, gy + 19.5, 1.8, 1.8);
      ctx.fillRect(bx + 0.8, gy + 43.5, 1.8, 1.8);
    }

    // Heavy Portcullis Bottom Spikes
    ctx.fillStyle = '#475569';
    for (let b = 0; b < barCount; b++) {
      const bx = gx + 3 + b * 6.5;
      ctx.beginPath();
      ctx.moveTo(bx - 0.5, gy + gh);
      ctx.lineTo(bx + 4.0, gy + gh);
      ctx.lineTo(bx + 1.75, gy + gh + 8);
      ctx.closePath();
      ctx.fill();
    }

    // Deadbolt Locking Mechanism (shown when closed or near closed)
    if (drop > 0.85) {
      const lockProg = Math.min(1.0, (drop - 0.85) / 0.15);
      // Heavy iron bolt extending into stone jambs
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(gx - 4 * lockProg, gy + 28, gw + 8 * lockProg, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(gx + gw / 2 - 4, gy + 26, 8, 8); // Central padlock housing
    }

    ctx.restore(); // End clipping

    // Contact Shadow beneath closed gate
    if (drop > 0.5) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
      ctx.fillRect(gx - 2, gy + gh - 2, gw + 4, 6);
    }

    ctx.restore();
  }
};

export const drawShrines = (ctx) => WorldRenderer.drawShrines(ctx);
export const drawTraps = (ctx) => WorldRenderer.drawTraps(ctx);

if (typeof window !== 'undefined') {
  window.MINIMAP_VISIBLE = MINIMAP_VISIBLE;
  window.drawShrines = drawShrines;
  window.drawTraps = drawTraps;
}

