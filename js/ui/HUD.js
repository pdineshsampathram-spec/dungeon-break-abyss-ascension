// =====================================================================
//  DUNGEON BREAK — js/ui/HUD.js
//  Phase 5.2: The Vanguard Vitality Crest & Armory Equipment Dock
//  Bespoke Crest Silhouette · Bloodline Health · Crystal Sanity · Pixel Armory
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, COLS, ROWS, roundRect } from '../core/Constants.js';
import { WD, RARITIES } from '../data/weapons.js';
import { RELIC_DEFS } from '../data/relics.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';
import { BossBar } from './BossBar.js';
import { isBossFloor, FLOOR_CONFIG } from '../data/floors.js';
import { MobileControls } from './MobileControls.js';

export const CINEMATIC_BANNER = {
  active: false,
  timer: 0,
  duration: 3.5,
  title: '',
  subtitle: '',
  col: '#fde68a'
};

export function triggerCinematicBanner(title, subtitle, col = '#fde68a') {
  CINEMATIC_BANNER.active = true;
  CINEMATIC_BANNER.timer = 0;
  CINEMATIC_BANNER.title = title;
  CINEMATIC_BANNER.subtitle = subtitle;
  CINEMATIC_BANNER.col = col;
}

export function clearCinematicBanner() {
  CINEMATIC_BANNER.active = false;
  CINEMATIC_BANNER.timer = 0;
  CINEMATIC_BANNER.title = '';
  CINEMATIC_BANNER.subtitle = '';
}

export const showCinematicBanner = triggerCinematicBanner;
if (typeof window !== 'undefined') {
  window.clearCinematicBanner = clearCinematicBanner;
}

export function tickCinematicBanner(dt) {
  if (!CINEMATIC_BANNER.active) return;
  CINEMATIC_BANNER.timer += dt;
  if (CINEMATIC_BANNER.timer >= CINEMATIC_BANNER.duration) {
    CINEMATIC_BANNER.active = false;
  }
}

export function drawCinematicBanner(ctx) {
  if (!CINEMATIC_BANNER.active) return;
  const cb = CINEMATIC_BANNER;
  const t = cb.timer;
  let alpha = 1;
  if (t < 0.5) alpha = t / 0.5;
  else if (t > cb.duration - 0.6) alpha = (cb.duration - t) / 0.6;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  const lbH = 46;
  ctx.fillStyle = 'rgba(2,4,12,0.92)';
  ctx.fillRect(0, 0, LW, lbH);
  ctx.fillRect(0, LH - lbH, LW, lbH);

  const py = 76, pw = 480, ph = 58;
  const px = LW / 2 - pw / 2;
  const grad = ctx.createLinearGradient(px, py, px + pw, py);
  grad.addColorStop(0, 'rgba(10,12,24,0)');
  grad.addColorStop(0.2, 'rgba(15,20,40,0.95)');
  grad.addColorStop(0.8, 'rgba(15,20,40,0.95)');
  grad.addColorStop(1, 'rgba(10,12,24,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, pw, ph);

  ctx.strokeStyle = cb.col;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px + 40, py); ctx.lineTo(px + pw - 40, py);
  ctx.moveTo(px + 40, py + ph); ctx.lineTo(px + pw - 40, py + ph);
  ctx.stroke();

  ctx.shadowColor = cb.col;
  ctx.shadowBlur = 14;
  ctx.fillStyle = cb.col;
  ctx.font = 'bold 20px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cb.title, LW / 2, py + 22);

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(226,232,240,0.85)';
  ctx.font = 'italic 12px Crimson Text, serif';
  ctx.fillText(cb.subtitle, LW / 2, py + 44);

  ctx.restore();
}

export function getActiveExitPortal() {
  const { LV, MAP, BOSS_DEAD, BOSS_PORTAL_UNLOCKED } = GameState;
  if (!MAP || !MAP.length) return null;
  if (isBossFloor(LV)) {
    if (!BOSS_DEAD || !BOSS_PORTAL_UNLOCKED) return null;
  }
  for (let r = 0; r < MAP.length; r++) {
    const row = MAP[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 2) {
        return { x: c + 0.5, y: r + 0.5 };
      }
    }
  }
  return null;
}

export function getUnrescuedSurvivors() {
  const allies = GameState.ALLIES || [];
  return allies.filter(a => a && !a.rescued);
}

export function getActiveBoss() {
  if (GameState.BOSS && GameState.BOSS.alive) {
    return GameState.BOSS;
  }
  if (GameState.ACTIVE_MINIBOSS && GameState.ACTIVE_MINIBOSS.alive) {
    return GameState.ACTIVE_MINIBOSS;
  }
  return null;
}

export function drawMinimap(ctx) {
  if (GameState.MINIMAP_VISIBLE === false || GameState.STATE !== GameStates.PLAYING) return;
  const mw = 138, mh = 96;
  const rightPad = MobileControls.isMobile() ? 116 : 14;
  const mx = LW - mw - rightPad, my = 70;

  ctx.save();
  // Outer obsidian plate
  ctx.fillStyle = 'rgba(6, 10, 22, 0.94)';
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.75)';
  ctx.lineWidth = 1.3;
  roundRect(ctx, mx, my, mw, mh, 6);
  ctx.fill(); ctx.stroke();

  // Inset border
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
  ctx.lineWidth = 1.0;
  roundRect(ctx, mx + 2, my + 2, mw - 4, mh - 4, 4);
  ctx.stroke();

  // Corner rivets
  ctx.fillStyle = '#fde68a';
  [[mx + 4, my + 4], [mx + mw - 4, my + 4], [mx + 4, my + mh - 4], [mx + mw - 4, my + mh - 4]].forEach(([rx, ry]) => {
    ctx.fillRect(rx - 1, ry - 1, 2, 2);
  });

  // Header tag with minimap toggle hint and floor stratum
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 8px Cinzel, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`MAP [M] · FL ${GameState.LV || 1}`, mx + 8, my + 6);

  // Compact legend indicators in header
  ctx.font = '7px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('🔷You 🟡Ally 🟢Exit', mx + mw - 7, my + 6);

  // Map scale factors
  const scX = (mw - 16) / COLS;
  const scY = (mh - 28) / ROWS;
  const ox = mx + 8, oy = my + 19;

  // Background map box
  ctx.fillStyle = 'rgba(2, 4, 10, 0.75)';
  ctx.fillRect(ox - 2, oy - 2, mw - 12, mh - 24);

  // Draw rooms (explored vs unexplored distinction)
  const explored = GameState.EXPLORED_ROOMS || new Set([0]);
  if (GameState.ROOMS) {
    GameState.ROOMS.forEach((r, idx) => {
      const isExp = explored.has(idx) || GameState.LV === 10;
      const rx = ox + r.x * scX;
      const ry = oy + r.y * scY;
      const rw = Math.max(3, r.w * scX);
      const rh = Math.max(3, r.h * scY);

      if (isExp) {
        ctx.fillStyle = 'rgba(51, 65, 85, 0.75)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 0.8;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);

        // Highlight Rowan's current room
        const { P } = GameState;
        if (P && P.x >= r.x && P.x < r.x + r.w && P.y >= r.y && P.y < r.y + r.h) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(rx - 0.5, ry - 0.5, rw + 1, rh + 1);
        }
      } else {
        // Faint unexplored blueprint outline
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
        ctx.lineWidth = 0.6;
        ctx.strokeRect(rx, ry, rw, rh);
      }
    });
  }

  // 1. Live Objective Marker: Unrescued Survivors
  const survivors = getUnrescuedSurvivors();
  const pulse = Math.sin(GameState.F * 0.14) * 0.35 + 0.65;
  survivors.forEach(s => {
    const sx = ox + s.x * scX;
    const sy = oy + s.y * scY;
    // Golden Diamond Pip
    ctx.save();
    ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 3.5);
    ctx.lineTo(sx + 3.5, sy);
    ctx.lineTo(sx, sy + 3.5);
    ctx.lineTo(sx - 3.5, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // 2. Live Objective Marker: Exit Portal (Strictly ONLY when real portal exists & unlocked)
  const portal = getActiveExitPortal();
  if (portal) {
    const px = ox + portal.x * scX;
    const py = oy + portal.y * scY;
    const pPulse = Math.sin(GameState.F * 0.18) * 0.4 + 0.6;
    ctx.save();
    ctx.strokeStyle = `rgba(34, 197, 94, ${pPulse})`;
    ctx.fillStyle = 'rgba(74, 222, 128, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 5.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Live Objective Marker: Floor Boss / Active Miniboss
  const boss = getActiveBoss();
  if (boss) {
    const bx = ox + boss.x * scX;
    const by = oy + boss.y * scY;
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(bx, by, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 4. Live Enemy radar blips near Rowan
  ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
  if (GameState.ENE && GameState.P) {
    GameState.ENE.forEach(e => {
      if (e.alive && Math.hypot(GameState.P.x - e.x, GameState.P.y - e.y) < 7.5) {
        ctx.fillRect(ox + e.x * scX - 1, oy + e.y * scY - 1, 2, 2);
      }
    });
  }

  // 5. Live Objective Marker: Rowan with Facing Pointer (Layered on top)
  if (GameState.P) {
    const px = ox + GameState.P.x * scX;
    const py = oy + GameState.P.y * scY;
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.0;
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(px, py, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Directional heading arrow
    const fx = GameState.P.fx || 1, fy = GameState.P.fy || 0;
    const ang = Math.atan2(fy, fx);
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(ang) * 5.8, py + Math.sin(ang) * 5.8);
    ctx.lineTo(px + Math.cos(ang + 2.4) * 3.2, py + Math.sin(ang + 2.4) * 3.2);
    ctx.lineTo(px + Math.cos(ang - 2.4) * 3.2, py + Math.sin(ang - 2.4) * 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawExpandedFloorMap(ctx) {
  const panW = Math.min(LW - 36, 680);
  const panH = Math.min(LH - 36, 440);
  const panX = Math.round((LW - panW) / 2);
  const panY = Math.round((LH - panH) / 2);

  ctx.save();
  // Semi-transparent atmospheric overlay with radial dark wash
  ctx.fillStyle = 'rgba(2, 4, 12, 0.94)';
  ctx.fillRect(0, 0, LW, LH);

  // Tactical parchment / obsidian frame
  ctx.fillStyle = 'rgba(8, 12, 24, 0.97)';
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1.8;
  roundRect(ctx, panX, panY, panW, panH, 8);
  ctx.fill();
  ctx.stroke();

  // Inner decorative border
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
  ctx.lineWidth = 1.0;
  roundRect(ctx, panX + 4, panY + 4, panW - 8, panH - 8, 6);
  ctx.stroke();

  // Corner rivets
  ctx.fillStyle = '#fde68a';
  const rivets = [
    [panX + 8, panY + 8], [panX + panW - 8, panY + 8],
    [panX + 8, panY + panH - 8], [panX + panW - 8, panY + panH - 8]
  ];
  rivets.forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Header Title
  const lv = GameState.LV || 1;
  const floorName = (FLOOR_CONFIG[lv] && FLOOR_CONFIG[lv].name) ? FLOOR_CONFIG[lv].name.toUpperCase() : 'ABYSS';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 13px Cinzel, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`FLOOR ${lv}: ${floorName} — TACTICAL ARCHIVAL MAP`, panX + 16, panY + 22);

  // Close button in top-right
  const closeBtnX = panX + panW - 82;
  const closeBtnY = panY + 12;
  ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1;
  roundRect(ctx, closeBtnX, closeBtnY, 68, 20, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 8.5px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLOSE [M]', closeBtnX + 34, closeBtnY + 10);

  // Subtitle status ribbon
  const totalRooms = GameState.ROOMS ? GameState.ROOMS.length : 1;
  const explored = GameState.EXPLORED_ROOMS || new Set([0]);
  const exploredCount = Math.min(totalRooms, Math.max(1, explored.size));
  const exploredPct = Math.round((exploredCount / totalRooms) * 100);
  const survivors = getUnrescuedSurvivors();
  const portal = getActiveExitPortal();
  const portalDist = (portal && GameState.P) ? Math.round(Math.hypot(GameState.P.x - portal.x, GameState.P.y - portal.y)) : null;
  const portalStatus = portal ? `ACTIVE (${portalDist}m)` : (isBossFloor(lv) ? 'LOCKED (DEFEAT BOSS)' : 'UNREVEALED');

  ctx.fillStyle = '#94a3b8';
  ctx.font = '9.5px Crimson Text, serif';
  ctx.textAlign = 'left';
  const survivorStatus = survivors.length > 0 ? `${survivors.length} REMAINING` : 'ALL LIBERATED';
  ctx.fillText(`EXPLORED: ${exploredCount}/${totalRooms} ROOMS (${exploredPct}%)   ·   SURVIVORS: ${survivorStatus}   ·   EXIT: ${portalStatus}`, panX + 16, panY + 40);

  // Map rendering canvas bounds
  const mapBoxX = panX + 14;
  const mapBoxY = panY + 54;
  const mapBoxW = panW - 28;
  const mapBoxH = panH - 96;

  // Map background
  ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
  ctx.lineWidth = 1;
  roundRect(ctx, mapBoxX, mapBoxY, mapBoxW, mapBoxH, 4);
  ctx.fill();
  ctx.stroke();

  // Grid transformation factors
  const scX = (mapBoxW - 24) / COLS;
  const scY = (mapBoxH - 24) / ROWS;
  const ox = mapBoxX + 12;
  const oy = mapBoxY + 12;

  // 1. Draw Rooms (Explored vs Unexplored with clean contrast)
  if (GameState.ROOMS) {
    GameState.ROOMS.forEach((r, idx) => {
      const isExp = explored.has(idx) || lv === 10;
      const rx = ox + r.x * scX;
      const ry = oy + r.y * scY;
      const rw = Math.max(3, r.w * scX);
      const rh = Math.max(3, r.h * scY);

      if (isExp) {
        ctx.fillStyle = 'rgba(45, 55, 75, 0.85)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.lineWidth = 1;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);

        // Highlight Rowan's current room
        const { P } = GameState;
        if (P && P.x >= r.x && P.x < r.x + r.w && P.y >= r.y && P.y < r.y + r.h) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.6;
          ctx.strokeRect(rx - 1, ry - 1, rw + 2, rh + 2);
        }
      } else {
        // Unexplored blueprint outline
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(rx, ry, rw, rh);
      }
    });
  }

  // 2. Draw Survivors with non-colliding distance labels
  const pPulse = Math.sin(GameState.F * 0.15) * 0.4 + 0.6;
  survivors.forEach((s, sIdx) => {
    const sx = ox + s.x * scX;
    const sy = oy + s.y * scY;
    const dist = Math.round(Math.hypot(GameState.P.x - s.x, GameState.P.y - s.y));

    // Outer beacon wave
    ctx.save();
    ctx.strokeStyle = `rgba(250, 204, 21, ${pPulse * 0.5})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx, sy, 7.5 * pPulse, 0, Math.PI * 2);
    ctx.stroke();

    // Diamond marker
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 5);
    ctx.lineTo(sx + 5, sy);
    ctx.lineTo(sx, sy + 5);
    ctx.lineTo(sx - 5, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Smart label placement (alternate above / below to prevent collision)
    const labelY = (sIdx % 2 === 0) ? (sy - 8) : (sy + 13);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SURVIVOR (${dist}m)`, sx, labelY);
    ctx.restore();
  });

  // 3. Draw Exit Portal (Strictly ONLY when real portal exists & is unlocked)
  if (portal) {
    const px = ox + portal.x * scX;
    const py = oy + portal.y * scY;
    const dist = portalDist !== null ? portalDist : Math.round(Math.hypot(GameState.P.x - portal.x, GameState.P.y - portal.y));

    ctx.save();
    ctx.strokeStyle = `rgba(34, 197, 94, ${pPulse})`;
    ctx.fillStyle = 'rgba(74, 222, 128, 0.9)';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, 9 * pPulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`EXIT PORTAL (${dist}m)`, px, py + 14);
    ctx.restore();
  }

  // 4. Draw Floor Boss / Active Miniboss
  const boss = getActiveBoss();
  if (boss) {
    const bx = ox + boss.x * scX;
    const by = oy + boss.y * scY;
    const bDist = Math.round(Math.hypot(GameState.P.x - boss.x, GameState.P.y - boss.y));

    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name ? `BOSS: ${boss.name} (${bDist}m)` : `BOSS (${bDist}m)`, bx, by - 9);
    ctx.restore();
  }

  // 5. Draw Rowan with heading beacon
  if (GameState.P) {
    const rowanX = ox + GameState.P.x * scX;
    const rowanY = oy + GameState.P.y * scY;
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(rowanX, rowanY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Direction arrow
    const fx = GameState.P.fx || 1, fy = GameState.P.fy || 0;
    const ang = Math.atan2(fy, fx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(rowanX + Math.cos(ang) * 9, rowanY + Math.sin(ang) * 9);
    ctx.lineTo(rowanX + Math.cos(ang + 2.5) * 4.5, rowanY + Math.sin(ang + 2.5) * 4.5);
    ctx.lineTo(rowanX + Math.cos(ang - 2.5) * 4.5, rowanY + Math.sin(ang - 2.5) * 4.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU (ROWAN)', rowanX, rowanY + 12);
    ctx.restore();
  }

  // Bottom Tactical Legend Bar
  ctx.fillStyle = '#c9a84c';
  ctx.font = 'bold 8.5px Cinzel, serif';
  ctx.textAlign = 'left';
  ctx.fillText('🔷 ROWAN (YOU)   ·   🟡 UNRESCUED SURVIVOR   ·   🟢 EXIT PORTAL   ·   🔴 HOSTILE BOSS   ·   ◻ EXPLORED ROOM   ·   ⬚ UNDISCOVERED', panX + 16, panY + panH - 22);

  ctx.fillStyle = '#64748b';
  ctx.font = '7.5px monospace';
  ctx.fillText('Click anywhere / [M] to dismiss map', panX + 16, panY + panH - 9);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('[ESC] CLOSE', panX + panW - 16, panY + panH - 12);

  ctx.restore();
}

export function handleExpandedMapClick(mx, my) {
  if (!GameState.MAP_EXPANDED) return false;
  // Any click while expanded map is active closes it
  GameState.MAP_EXPANDED = false;
  return true;
}

// ─────────────────────────────────────────────────────────────
// PIXEL-ART WEAPON SILHOUETTES
// ─────────────────────────────────────────────────────────────
export function drawPixelWeaponIcon(ctx, weaponId, cx, cy, isActive, accentColor, scale = 1.0) {
  ctx.save();
  ctx.translate(cx, cy);
  if (scale !== 1.0) {
    ctx.scale(scale, scale);
  }
  const id = (weaponId || '').toLowerCase();
  const mainCol = isActive ? '#ffffff' : (accentColor || '#cbd5e1');
  const glowCol = isActive ? (accentColor || '#fde68a') : '#475569';

  ctx.fillStyle = mainCol;

  if (id.includes('sword')) {
    // SWORD: Straight steel blade, crossguard quillons, hilt, pommel
    ctx.fillRect(-1, -8, 2, 10);
    ctx.fillRect(0, -9, 1, 1);
    ctx.fillStyle = glowCol;
    ctx.fillRect(-4, 2, 9, 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-1, 4, 2, 3);
    ctx.fillStyle = glowCol;
    ctx.fillRect(-2, 7, 4, 2);
  } else if (id.includes('axe')) {
    // AXE: Angled wood haft, broad curved crescent blade head, poll spike
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, -7, 2, 16);
    ctx.fillStyle = mainCol;
    ctx.fillRect(0, -6, 5, 2);
    ctx.fillRect(1, -4, 6, 4);
    ctx.fillRect(0, 0, 5, 2);
    ctx.fillStyle = glowCol;
    ctx.fillRect(6, -5, 2, 5);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-5, -3, 3, 2);
  } else if (id.includes('dagger')) {
    // DAGGER: Slender stiletto needle blade, curved quillon guard
    ctx.fillRect(0, -7, 1, 9);
    ctx.fillRect(-1, -4, 3, 4);
    ctx.fillStyle = glowCol;
    ctx.fillRect(-3, 2, 7, 1);
    ctx.fillRect(-4, 1, 2, 1);
    ctx.fillRect(3, 1, 2, 1);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 3, 1, 3);
    ctx.fillStyle = glowCol;
    ctx.fillRect(-1, 6, 3, 2);
  } else if (id.includes('bow')) {
    // BOW: Curved recurve wooden stave, bowstring, nocked arrow
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-4, -7, 2, 3);
    ctx.fillRect(-2, -4, 2, 3);
    ctx.fillRect(-1, -1, 2, 3);
    ctx.fillRect(-2, 2, 2, 3);
    ctx.fillRect(-4, 5, 2, 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-4, -6, 1, 13);
    ctx.fillStyle = glowCol;
    ctx.fillRect(-5, 0, 10, 1);
    ctx.fillRect(4, -1, 2, 3);
  } else if (id.includes('spear') || id.includes('trident')) {
    // SPEAR / TRIDENT: Central spear shaft, trident triple-prong head
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, -2, 1, 11);
    ctx.fillStyle = glowCol;
    ctx.fillRect(-3, -3, 7, 2);
    ctx.fillStyle = mainCol;
    ctx.fillRect(0, -8, 1, 5);
    ctx.fillRect(-3, -7, 1, 4);
    ctx.fillRect(3, -7, 1, 4);
  } else {
    ctx.fillRect(-3, -3, 6, 6);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// WEAPON HOTBAR & ARMORY DOCK (Unified Armoured Equipment)
// ─────────────────────────────────────────────────────────────
export function drawHUDWeaponSlots(ctx) {
  if (GameState.STATE !== GameStates.PLAYING) return;
  if (MobileControls.isMobile()) return;

  const dockW = 286;
  const dockX = Math.max(226, Math.round((LW - dockW) / 2));
  const dockY = LH - 76;
  const dockH = 68;

  ctx.save();

  // 1. Armoured Dock Stepped Outer Chassis Path (Multi-Layered Steel with Drop Shadow)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.beginPath();
  ctx.moveTo(dockX + 11, dockY + 2);
  ctx.lineTo(dockX + dockW - 9, dockY + 2);
  ctx.lineTo(dockX + dockW + 2, dockY + 12);
  ctx.lineTo(dockX + dockW + 2, dockY + dockH - 6);
  ctx.lineTo(dockX + dockW - 6, dockY + dockH + 2);
  ctx.lineTo(dockX + 10, dockY + dockH + 2);
  ctx.lineTo(dockX + 2, dockY + dockH - 6);
  ctx.lineTo(dockX + 2, dockY + 12);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  // Matching stepped shoulder slope on top edge
  ctx.moveTo(dockX + 10, dockY);
  ctx.lineTo(dockX + dockW - 10, dockY);
  ctx.lineTo(dockX + dockW, dockY + 10);
  ctx.lineTo(dockX + dockW, dockY + dockH - 8);
  ctx.lineTo(dockX + dockW - 8, dockY + dockH);
  ctx.lineTo(dockX + 8, dockY + dockH);
  ctx.lineTo(dockX, dockY + dockH - 8);
  ctx.lineTo(dockX, dockY + 10);
  ctx.closePath();

  ctx.fillStyle = 'rgba(10, 14, 24, 0.98)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.95)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Antique-gold corner fasteners with specular glints
  const dockRivets = [
    { x: dockX + 6, y: dockY + 4 },
    { x: dockX + dockW - 9, y: dockY + 4 },
    { x: dockX + 6, y: dockY + dockH - 7 },
    { x: dockX + dockW - 9, y: dockY + dockH - 7 }
  ];
  dockRivets.forEach(r => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(r.x - 1, r.y - 1, 4, 4);
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(r.x, r.y, 2, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(r.x, r.y, 1, 1);
  });

  // 2. Equipped Weapon Top Header Rail
  const activeW = WeaponInventory.getActiveWeapon();
  if (activeW) {
    const rar = activeW.rarity || { name: 'Common', col: '#94a3b8' };
    const wDmg = activeW.damage || activeW.dmg || 2;
    const wName = (activeW.name || activeW.id || 'Sword').toUpperCase();
    const infoText = `ARMORY DOCK: ${wName} [${rar.name.toUpperCase()}] · ${wDmg} DMG`;

    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rar.col || '#fde68a';
    ctx.fillText(infoText, dockX + 12, dockY + 10);

    // Attack cooldown progress micro-bar inside header rail
    const { P } = GameState;
    const wCd = activeW.cooldown || activeW.cd || 0.32;
    if (P && P.acd > 0) {
      const cdFrac = Math.max(0, Math.min(1, 1 - (P.acd / wCd)));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(dockX + dockW - 64, dockY + 8, 52, 4);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(dockX + dockW - 64, dockY + 8, Math.round(52 * cdFrac), 4);
    }
  }

  // 3. 3 Distinct Weapon Slots with Clear Names, Numbers, and Active Glow
  const slotW = 56;
  const slotH = 46;
  const slotY = dockY + 17;
  const slotGap = 6;

  for (let i = 0; i < 3; i++) {
    const sx = dockX + 10 + i * (slotW + slotGap);
    const w = GameState.weaponSlots ? GameState.weaponSlots[i] : null;
    const isActive = (i === GameState.activeWeaponSlot);

    ctx.save();
    // Stepped inner recess background
    ctx.fillStyle = '#080c16';
    roundRect(ctx, sx, slotY, slotW, slotH, 4);
    ctx.fill();

    if (isActive) {
      ctx.fillStyle = 'rgba(217, 119, 6, 0.22)';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#fde68a';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = w ? 'rgba(71, 85, 105, 0.75)' : 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1.0;
      ctx.shadowBlur = 0;
    }
    roundRect(ctx, sx, slotY, slotW, slotH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Active slot double-line corner accents
    if (isActive) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(sx + 2, slotY + 2, 2, 2);
      ctx.fillRect(sx + slotW - 4, slotY + 2, 2, 2);
      ctx.fillRect(sx + 2, slotY + slotH - 4, 2, 2);
      ctx.fillRect(sx + slotW - 4, slotY + slotH - 4, 2, 2);
    }

    // Visible Slot Number Badge [1], [2], [3]
    ctx.fillStyle = isActive ? '#fde68a' : '#94a3b8';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`[${i + 1}]`, sx + 4, slotY + 4);

    if (w) {
      const rarCol = (w.rarity && w.rarity.col) || '#94a3b8';
      // Center Pixel-Art Weapon Silhouette
      drawPixelWeaponIcon(ctx, w.id, sx + slotW / 2, slotY + 19, isActive, rarCol, 1.25);

      // Short, readable weapon name
      const weaponNames = {
        sword: 'SWORD',
        bow: 'BOW',
        axe: 'AXE',
        dagger: 'DAGGER',
        spear: 'TRIDENT'
      };
      const name = weaponNames[w.id] || (w.name ? w.name.split(' ')[0].toUpperCase() : 'WEAPON');
      ctx.fillStyle = isActive ? '#ffffff' : rarCol;
      ctx.font = 'bold 7.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(name, sx + slotW / 2, slotY + slotH - 2);
    } else {
      ctx.fillStyle = '#475569';
      ctx.font = 'italic 8px Crimson Text, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('[ EMPTY ]', sx + slotW / 2, slotY + slotH / 2 + 3);
    }
    ctx.restore();
  }

  // 4. Special Ability Slot [Q] (Faceted Stepped Recess)
  const { P } = GameState;
  const qx = dockX + 10 + 3 * (slotW + slotGap);
  const qw = 68;
  const qh = slotH;
  const isQReady = (P && P.qCooldown <= 0);

  ctx.save();
  // Recessed background
  ctx.fillStyle = '#080c16';
  roundRect(ctx, qx, slotY, qw, qh, 4);
  ctx.fill();

  if (isQReady) {
    const pulse = Math.sin(GameState.F * 0.12) * 3 + 6;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = pulse;
    ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.6;
  } else {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.65)';
    ctx.lineWidth = 1.0;
    ctx.shadowBlur = 0;
  }
  roundRect(ctx, qx, slotY, qw, qh, 4);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Key tag [Q]
  ctx.fillStyle = isQReady ? '#fef08a' : '#64748b';
  ctx.font = 'bold 8px Cinzel, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('[Q]', qx + 4, slotY + 4);

  // Label & Status
  ctx.font = 'bold 8px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isQReady ? '#fef08a' : '#94a3b8';
  ctx.fillText('SPECIAL', qx + qw / 2 + 4, slotY + 12);

  if (isQReady) {
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('READY', qx + qw / 2 + 4, slotY + qh - 11);
  } else {
    const maxCd = P.qMaxCooldown || 5.0;
    const progress = Math.max(0, Math.min(1, 1 - (P.qCooldown / maxCd)));
    ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
    roundRect(ctx, qx + 6, slotY + qh - 8, (qw - 12) * progress, 3, 1);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.fillText(P.qCooldown.toFixed(1) + 's', qx + qw / 2 + 4, slotY + qh - 14);
  }
  ctx.restore();

  ctx.restore();

  // Active buff badges
  let buffOffset = 0;
  const buffY = dockY - 24;

  if (P && P.furyBuffTimer > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    roundRect(ctx, dockX + buffOffset, buffY, 82, 18, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('FURY ' + Math.ceil(P.furyBuffTimer) + 's', dockX + buffOffset + 41, buffY + 9);
    ctx.restore();
    buffOffset += 88;
  }

  if (P && P.mindShieldTimer > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1;
    roundRect(ctx, dockX + buffOffset, buffY, 94, 18, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('WARDED ' + Math.ceil(P.mindShieldTimer) + 's', dockX + buffOffset + 47, buffY + 9);
    ctx.restore();
    buffOffset += 100;
  }

  if (P && P.hasteBuffTimer > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    roundRect(ctx, dockX + buffOffset, buffY, 82, 18, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('HASTE ' + Math.ceil(P.hasteBuffTimer) + 's', dockX + buffOffset + 41, buffY + 9);
    ctx.restore();
  }
}

export function drawLuxuryHUDExtensions(ctx) {
  if (GameState.STATE !== GameStates.PLAYING) return;

  if (GameState.CURRENT_MUTATION) {
    ctx.save();
    ctx.fillStyle = 'rgba(5,8,22,0.85)';
    ctx.strokeStyle = GameState.CURRENT_MUTATION.col || '#fb923c';
    ctx.lineWidth = 1;
    roundRect(ctx, 12, 12, 175, 24, 5);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = GameState.CURRENT_MUTATION.col || '#fb923c';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(GameState.CURRENT_MUTATION.name || 'Abyssal Mutation', 18, 24);
    ctx.restore();
  }

  const relics = GameState.P.relics || [];
  if (relics.length > 0) {
    const rx = LW / 2 - (relics.length * 28) / 2;
    const ry = LH - 88;
    relics.forEach((rId, idx) => {
      const rel = RELIC_DEFS[rId];
      if (!rel) return;
      const bx = rx + idx * 28;
      ctx.save();
      ctx.fillStyle = 'rgba(5,8,22,0.8)';
      ctx.strokeStyle = rel.col || '#fde68a';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, ry, 24, 24, 4);
      ctx.fill(); ctx.stroke();
      _drawRelicSigil(ctx, rId, bx + 12, ry + 12, rel.col || '#fde68a');
      ctx.restore();
    });
  }
}

function _drawRelicSigil(ctx, relId, cx, cy, col = '#fde68a') {
  ctx.save();
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.2;
  if (relId === 'phoenix_feather') {
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 5);
    ctx.quadraticCurveTo(cx - 3, cy - 3, cx + 5, cy - 6);
    ctx.quadraticCurveTo(cx + 1, cy + 1, cx - 5, cy + 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 4); ctx.lineTo(cx + 4, cy - 5);
    ctx.stroke();
  } else if (relId === 'shadow_cloak') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 6, cy + 5);
    ctx.lineTo(cx + 2, cy + 3);
    ctx.lineTo(cx, cy + 5);
    ctx.lineTo(cx - 2, cy + 3);
    ctx.lineTo(cx - 6, cy + 5);
    ctx.closePath();
    ctx.fill();
  } else if (relId === 'bone_charm') {
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx + 5, cy + 5);
    ctx.moveTo(cx + 5, cy - 5); ctx.lineTo(cx - 5, cy + 5);
    ctx.stroke();
    ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
  } else if (relId === 'blood_chalice') {
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 5);
    ctx.lineTo(cx + 5, cy - 5);
    ctx.quadraticCurveTo(cx + 4, cy + 1, cx, cy + 2);
    ctx.quadraticCurveTo(cx - 4, cy + 1, cx - 5, cy - 5);
    ctx.fill();
    ctx.fillRect(cx - 1, cy + 2, 2, 4);
    ctx.fillRect(cx - 4, cy + 6, 8, 1.5);
  } else if (relId === 'void_magnet') {
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 5, Math.PI, 0, false);
    ctx.lineTo(cx + 5, cy + 5);
    ctx.lineTo(cx + 2.5, cy + 5);
    ctx.lineTo(cx + 2.5, cy - 1);
    ctx.arc(cx, cy - 1, 2.5, 0, Math.PI, true);
    ctx.lineTo(cx - 2.5, cy + 5);
    ctx.lineTo(cx - 5, cy + 5);
    ctx.closePath();
    ctx.fill();
  } else if (relId === 'aegis_core') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 5, cy - 3);
    ctx.lineTo(cx + 4, cy + 3);
    ctx.lineTo(cx, cy + 7);
    ctx.lineTo(cx - 4, cy + 3);
    ctx.lineTo(cx - 5, cy - 3);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx + 5, cy);
    ctx.lineTo(cx, cy + 5);
    ctx.lineTo(cx - 5, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// LIVE SPEED SELECTOR (Mobile-Accessible Stone-and-Bronze Popout)
// ─────────────────────────────────────────────────────────────
export function drawLiveSpeedSelector(ctx, boxX, boxW) {
  if (!GameState.SPEED_SELECTOR_OPEN) return;

  const selectorW = 200;
  const selectorH = 34;
  const selectorX = boxX - selectorW - 8;
  const selectorY = 31;
  const curSpeed = GameState.GAME_SPEED || 1.0;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;

  // Background panel: Carved obsidian slab with deep violet undertone
  ctx.fillStyle = 'rgba(14, 11, 24, 0.96)';
  roundRect(ctx, selectorX, selectorY, selectorW, selectorH, 6);
  ctx.fill();

  // Antique bronze double border
  ctx.strokeStyle = 'rgba(202, 138, 4, 0.85)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, selectorX, selectorY, selectorW, selectorH, 6);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
  ctx.lineWidth = 1;
  roundRect(ctx, selectorX + 2, selectorY + 2, selectorW - 4, selectorH - 4, 4);
  ctx.stroke();

  // Connection pip towards the speed badge on the right
  ctx.fillStyle = 'rgba(202, 138, 4, 0.85)';
  ctx.beginPath();
  ctx.moveTo(selectorX + selectorW, selectorY + selectorH / 2 - 4);
  ctx.lineTo(selectorX + selectorW + 5, selectorY + selectorH / 2);
  ctx.lineTo(selectorX + selectorW, selectorY + selectorH / 2 + 4);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 4 Speed Presets: 0.50×, 1.00×, 1.50×, 2.00×
  const presets = [
    { spd: 0.5, label: '0.50×' },
    { spd: 1.0, label: '1.00×' },
    { spd: 1.5, label: '1.50×' },
    { spd: 2.0, label: '2.00×' }
  ];

  const btnW = 45;
  const btnH = 26;
  const btnGap = 4;
  const startX = selectorX + 4;
  const btnY = selectorY + 4;

  presets.forEach((p, i) => {
    const bx = startX + i * (btnW + btnGap);
    const isActive = Math.abs(curSpeed - p.spd) < 0.05;

    // Button background
    if (isActive) {
      ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
      roundRect(ctx, bx, btnY, btnW, btnH, 4);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top inner bevel
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 2, btnY + 1);
      ctx.lineTo(bx + btnW - 2, btnY + 1);
      ctx.stroke();

      // Active text
      ctx.fillStyle = '#fde68a';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, bx + btnW / 2, btnY + btnH / 2);
      ctx.shadowBlur = 0;

      // Small active amber pip at bottom
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx + 12, btnY + btnH - 2, btnW - 24, 2);
    } else {
      ctx.fillStyle = 'rgba(26, 20, 39, 0.85)';
      roundRect(ctx, bx, btnY, btnW, btnH, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, bx + btnW / 2, btnY + btnH / 2);
    }
  });

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// THE VANGUARD VITALITY CREST (Phase 5.3: Bespoke Handcrafted Reliquary)
// ─────────────────────────────────────────────────────────────
function _drawOriginalHUD(ctx) {
  const P = GameState.P;
  const maxHp = P.maxHp || 10;
  const curHp = Math.max(0, P.hp !== undefined ? P.hp : maxHp);
  const hpFrac = Math.max(0, Math.min(1, curHp / maxHp));
  const isLowHp = (curHp / maxHp) <= 0.25 || curHp <= 3;

  const isMobile = MobileControls && MobileControls.isMobile && MobileControls.isMobile();
  const crestX = isMobile ? 14 : 10;
  const crestY = isMobile ? 14 : (LH - 74);
  const crestW = 206;
  const crestH = 62;

  ctx.save();

  // 1. Bespoke Armoured Vanguard Crest Chassis (Multi-Layered Stepped Edging)
  // Drop shadow for tactile depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.beginPath();
  ctx.moveTo(crestX + 11, crestY + 8);
  ctx.lineTo(crestX + 47, crestY + 5);
  ctx.lineTo(crestX + 89, crestY + 3);
  ctx.lineTo(crestX + 103, crestY - 1);
  ctx.lineTo(crestX + 117, crestY + 3);
  ctx.lineTo(crestX + 159, crestY + 5);
  ctx.lineTo(crestX + crestW - 9, crestY + 8);
  ctx.lineTo(crestX + crestW + 2, crestY + 16);
  ctx.lineTo(crestX + crestW + 2, crestY + crestH - 12);
  ctx.lineTo(crestX + crestW - 10, crestY + crestH + 2);
  ctx.lineTo(crestX + 120, crestY + crestH + 2);
  ctx.lineTo(crestX + 103, crestY + crestH - 1);
  ctx.lineTo(crestX + 86, crestY + crestH + 2);
  ctx.lineTo(crestX + 14, crestY + crestH + 2);
  ctx.lineTo(crestX + 2, crestY + crestH - 12);
  ctx.lineTo(crestX + 2, crestY + 16);
  ctx.closePath();
  ctx.fill();

  // Outer Silhouette Path (Subtly Asymmetric Stepped Shoulders)
  const drawCrestPath = () => {
    ctx.beginPath();
    // Stepped shoulder top edge with central ridge peak
    ctx.moveTo(crestX + 10, crestY + 6);
    ctx.lineTo(crestX + 46, crestY + 3);
    ctx.lineTo(crestX + 88, crestY + 1);
    ctx.lineTo(crestX + 103, crestY - 3); // Central Vanguard Ridge Peak
    ctx.lineTo(crestX + 118, crestY + 1);
    ctx.lineTo(crestX + 160, crestY + 3);
    ctx.lineTo(crestX + crestW - 10, crestY + 6);
    // Clipped right corners with notch
    ctx.lineTo(crestX + crestW, crestY + 14);
    ctx.lineTo(crestX + crestW, crestY + crestH - 14);
    ctx.lineTo(crestX + crestW - 12, crestY + crestH);
    // Stepped keel bottom edge with central notch
    ctx.lineTo(crestX + 120, crestY + crestH);
    ctx.lineTo(crestX + 103, crestY + crestH - 3); // Keel notch
    ctx.lineTo(crestX + 86, crestY + crestH);
    ctx.lineTo(crestX + 12, crestY + crestH);
    // Clipped left corners
    ctx.lineTo(crestX, crestY + crestH - 14);
    ctx.lineTo(crestX, crestY + 14);
    ctx.closePath();
  };

  // Base Chassis Fill
  drawCrestPath();
  ctx.fillStyle = 'rgba(10, 14, 24, 0.98)';
  ctx.fill();

  // Layered Outer Metal Bevel
  ctx.strokeStyle = isLowHp ? 'rgba(239, 68, 68, 0.95)' : 'rgba(51, 65, 85, 0.95)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Inner Metallic Trim Rail (Forged Antique Brass Accent)
  ctx.strokeStyle = isLowHp ? 'rgba(185, 28, 28, 0.5)' : 'rgba(120, 93, 38, 0.45)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Asymmetric Left Shoulder Reinforcement Plate (Stepped Clamping Lug)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(crestX + 2, crestY + 18, 5, 8);
  ctx.fillStyle = '#334155';
  ctx.fillRect(crestX + 3, crestY + 19, 3, 6);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(crestX + 4, crestY + 20, 1, 1);
  ctx.fillRect(crestX + 4, crestY + 23, 1, 1);

  // Original Vanguard Sigil at Ridge Peak (Forged Obsidian Chevron with Gold Inlay)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(crestX + 99, crestY + 4);
  ctx.lineTo(crestX + 103, crestY - 4);
  ctx.lineTo(crestX + 107, crestY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isLowHp ? '#ef4444' : '#c9a84c';
  ctx.lineWidth = 1.0;
  ctx.stroke();
  // Gilded Inlay Chevron Rune
  ctx.fillStyle = isLowHp ? '#fca5a5' : '#fde68a';
  ctx.fillRect(crestX + 102, crestY - 1, 2, 3);
  ctx.fillRect(crestX + 101, crestY + 1, 4, 1);

  // Antique-Brass Corner Fastener Rivets with Specular Glints
  const rivets = [
    { x: crestX + 6, y: crestY + 10 },
    { x: crestX + crestW - 9, y: crestY + 10 },
    { x: crestX + 8, y: crestY + crestH - 8 },
    { x: crestX + crestW - 11, y: crestY + crestH - 8 }
  ];
  rivets.forEach(r => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(r.x - 1, r.y - 1, 4, 4);
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(r.x, r.y, 2, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(r.x, r.y, 1, 1); // Specular highlight
  });

  // ─────────────────────────────────────────────────────────────
  // 2. SANITY CHANNEL: FRACTURED AMETHYST CRYSTAL (Stepped Angular Facets)
  // ─────────────────────────────────────────────────────────────
  const sx = crestX + 16;
  const sy = crestY + 12;
  const sw = 174;
  const sh = 16;
  const maxSan = P.maxSan || 100;
  const curSan = Math.max(0, P.san !== undefined ? P.san : 100);
  const sanFrac = Math.max(0, Math.min(1, curSan / maxSan));
  const isLowSan = curSan < 35;

  // Stepped Faceted Crystal Cavity
  ctx.fillStyle = '#0a0518';
  ctx.fillRect(sx, sy, sw, sh);
  // Cut corner facets (angular 45-degree corner bevels)
  ctx.fillStyle = '#160b33';
  ctx.fillRect(sx + 1, sy + 1, sw - 2, sh - 2);

  // Facet seam lines in empty cavity
  ctx.fillStyle = 'rgba(76, 29, 149, 0.25)';
  ctx.fillRect(sx + 44, sy + 1, 1, sh - 2);
  ctx.fillRect(sx + 88, sy + 1, 1, sh - 2);
  ctx.fillRect(sx + 132, sy + 1, 1, sh - 2);

  // Sanity Crystal Fill (Luminous Amethyst with Angular Highlights & Diagonal Facets)
  if (sanFrac > 0) {
    const fillSw = Math.round(sw * sanFrac);
    const sg = ctx.createLinearGradient(sx, sy, sx + sw, sy);
    if (isLowSan) {
      const pulse = GameState.REDUCED_MOTION ? 0.82 : (Math.sin(GameState.F * 0.18) * 0.22 + 0.78);
      sg.addColorStop(0, `rgba(59, 7, 100, ${pulse})`);
      sg.addColorStop(0.5, `rgba(107, 33, 168, ${pulse})`);
      sg.addColorStop(1, `rgba(147, 51, 234, ${pulse})`);
    } else {
      sg.addColorStop(0, '#3b0764');
      sg.addColorStop(0.35, '#6b21a8');
      sg.addColorStop(0.75, '#9333ea');
      sg.addColorStop(1, '#c084fc');
    }
    ctx.fillStyle = sg;
    ctx.fillRect(sx, sy, fillSw, sh);

    // Specular diagonal crystal facet reflections
    ctx.fillStyle = 'rgba(245, 208, 254, 0.28)';
    ctx.fillRect(sx, sy, fillSw, 2);
    ctx.fillRect(sx, sy + sh - 2, fillSw, 1);

    // Internal facet breaks
    for (let fx = sx + 44; fx < sx + fillSw; fx += 44) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(fx, sy + 1, 1, sh - 2);
      ctx.fillStyle = 'rgba(59, 7, 100, 0.5)';
      ctx.fillRect(fx + 1, sy + 1, 1, sh - 2);
    }

    // Low sanity micro-fissures (visual only, restrained distress detail)
    if (isLowSan && !GameState.REDUCED_MOTION) {
      ctx.fillStyle = 'rgba(15, 7, 32, 0.7)';
      const crackX = sx + Math.round(fillSw * 0.6);
      ctx.fillRect(crackX, sy + 2, 1, 4);
      ctx.fillRect(crackX + 1, sy + 5, 2, 1);
      ctx.fillRect(crackX + 2, sy + 6, 1, 5);
    }
  }

  // Stepped Faceted Crystal Bevel Border
  ctx.strokeStyle = isLowSan ? 'rgba(168, 85, 247, 0.85)' : 'rgba(139, 92, 246, 0.55)';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(sx, sy, sw, sh);

  // Custom Sanity Talisman: Faceted Geometric Amethyst Prism (5x7 px)
  ctx.fillStyle = '#3b0764';
  ctx.fillRect(sx + 4, sy + 4, 6, 8);
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(sx + 5, sy + 5, 4, 6);
  ctx.fillStyle = '#f5d0fe';
  ctx.fillRect(sx + 5, sy + 5, 2, 2); // Specular prism glint

  // Dedicated Sanity Readout (Left-anchored: strictly away from status tag)
  ctx.fillStyle = '#e9d5ff';
  ctx.font = 'bold 8.5px Cinzel, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAN ' + Math.ceil(curSan) + '%', sx + 14, sy + sh / 2);

  // Dedicated Status Plaque (Right-anchored reserved 46px bracket: NEVER collides with SAN %)
  if (P.inVoidSafeArea) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fillRect(sx + sw - 48, sy + 2, 44, sh - 4);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(sx + sw - 48, sy + 2, 44, sh - 4);
    ctx.fillStyle = '#bae6fd';
    ctx.textAlign = 'center';
    ctx.fillText('WARD', sx + sw - 26, sy + sh / 2);
  } else if (P.nearTorch || (P.sanctuaryTimer && P.sanctuaryTimer > 0) || P.inSanctuary) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.fillRect(sx + sw - 64, sy + 2, 60, sh - 4);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(sx + sw - 64, sy + 2, 60, sh - 4);
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText('SANCTUARY', sx + sw - 34, sy + sh / 2);
  } else if (P.mindShieldTimer > 0) {
    ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
    ctx.fillRect(sx + sw - 56, sy + 2, 52, sh - 4);
    ctx.strokeStyle = '#c084fc';
    ctx.strokeRect(sx + sw - 56, sy + 2, 52, sh - 4);
    ctx.fillStyle = '#e9d5ff';
    ctx.textAlign = 'center';
    ctx.fillText('SHIELDED', sx + sw - 30, sy + sh / 2);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. HEALTH CHANNEL: BLOODLINE RELIQUARY (Stepped Iron Basin)
  // ─────────────────────────────────────────────────────────────
  const hx = crestX + 16;
  const hy = crestY + 34;
  const hw = 174;
  const hh = 19;

  // Trailing damage ghost HP bar
  if (P.ghostHp === undefined || P.ghostHp < curHp) {
    P.ghostHp = curHp;
  }
  if (GameState.REDUCED_MOTION) {
    P.ghostHp = curHp;
  } else if (P.ghostHp > curHp) {
    const dt = GameState.DT || 0.016;
    const decay = (P.ghostHp - curHp) * 3.5 * dt + dt * 4;
    P.ghostHp = Math.max(curHp, P.ghostHp - decay);
  }
  const ghostFrac = Math.max(0, Math.min(1, P.ghostHp / maxHp));

  // Deep carved iron blood basin background with textured depth
  ctx.fillStyle = '#140505';
  ctx.fillRect(hx, hy, hw, hh);
  ctx.fillStyle = '#220808';
  ctx.fillRect(hx + 1, hy + 1, hw - 2, hh - 2);

  // Stepped basin end brackets (cast iron crucible profile)
  ctx.fillStyle = '#0a0202';
  ctx.fillRect(hx, hy + 2, 2, hh - 4);
  ctx.fillRect(hx + hw - 2, hy + 2, 2, hh - 4);

  // Trailing Damage Segment (ghost bar)
  if (ghostFrac > hpFrac) {
    ctx.fillStyle = 'rgba(248, 113, 113, 0.75)';
    ctx.fillRect(hx, hy, Math.round(hw * ghostFrac), hh);
  }

  // Authoritative Living Bloodline Fill (Multi-Tone Arterial Crimson)
  if (hpFrac > 0) {
    const fillHw = Math.round(hw * hpFrac);
    const hg = ctx.createLinearGradient(hx, hy, hx + hw, hy);
    if (isLowHp) {
      const pulse = GameState.REDUCED_MOTION ? 0.85 : (Math.sin(GameState.F * 0.16) * 0.2 + 0.8);
      hg.addColorStop(0, `rgba(185, 28, 28, ${pulse})`);
      hg.addColorStop(0.6, `rgba(220, 38, 38, ${pulse})`);
      hg.addColorStop(1, `rgba(239, 68, 68, ${pulse})`);
    } else {
      hg.addColorStop(0, '#450a0a');
      hg.addColorStop(0.25, '#7f1d1d');
      hg.addColorStop(0.6, '#b91c1c');
      hg.addColorStop(0.85, '#dc2626');
      hg.addColorStop(1, '#ef4444');
    }
    ctx.fillStyle = hg;
    ctx.fillRect(hx, hy, fillHw, hh);

    // Specular top highlight sheen rail
    ctx.fillStyle = 'rgba(254, 202, 202, 0.38)';
    ctx.fillRect(hx, hy, fillHw, 2);

    // Internal arterial counter-current micro-highlights
    if (!GameState.REDUCED_MOTION) {
      const currentX = (GameState.F * 1.2) % fillHw;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(hx + currentX, hy + 4, Math.min(18, fillHw - currentX), 1);
    }

    // Stepped Meniscus Leading Edge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(hx + fillHw - 2, hy, 2, hh);
  }

  // Stepped Iron Crucible Border
  ctx.strokeStyle = isLowHp ? 'rgba(239, 68, 68, 0.92)' : 'rgba(51, 65, 85, 0.9)';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(hx, hy, hw, hh);

  // Custom Bloodstone Talisman Mark (Carved Stepped Hexagonal Blood Gem, 7x7 px)
  ctx.fillStyle = '#450a0a';
  ctx.fillRect(hx + 4, hy + 5, 8, 8);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(hx + 5, hy + 6, 6, 6);
  ctx.fillStyle = '#fca5a5';
  ctx.fillRect(hx + 5, hy + 6, 2, 2); // Specular glint

  // Dedicated Health Readout
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 9.5px Cinzel, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const hpLabel = isLowHp ? `CRITICAL · ${Math.ceil(curHp)} / ${maxHp}` : `HP ${Math.ceil(curHp)} / ${maxHp}`;
  ctx.fillText(hpLabel, hx + 15, hy + hh / 2);

  ctx.restore();

  // Temporary Equip Feedback Banner
  if (GameState.equipFeedback && GameState.equipFeedback.timer > 0) {
    GameState.equipFeedback.timer -= GameState.DT || 0.016;
    const ef = GameState.equipFeedback;
    const alpha = Math.min(1, ef.timer / 0.3);
    const efRarCol = (ef.rarity && ef.rarity.col) ? ef.rarity.col : '#fde68a';

    ctx.save();
    ctx.globalAlpha = alpha;
    const efW = 280, efH = 34;
    const efX = LW / 2 - efW / 2, efY = LH - 130;

    ctx.fillStyle = 'rgba(5, 8, 20, 0.88)';
    ctx.strokeStyle = efRarCol;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = efRarCol;
    ctx.shadowBlur = 12;
    roundRect(ctx, efX, efY, efW, efH, 6);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = efRarCol;
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`EQUIPPED: ${ef.name.toUpperCase()}`, LW / 2, efY + 17);
    ctx.restore();
  }

  // Active shield badge
  if (P.shieldActive) {
    const sp = Math.sin(GameState.F * 0.12) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(6,182,212,${0.18 + sp * 0.08})`; roundRect(ctx, 10, LH - 100, 206, 20, 5); ctx.fill();
    ctx.strokeStyle = `rgba(103,232,249,${0.6 + sp * 0.3})`; ctx.lineWidth = 1.2; ctx.strokeRect(10, LH - 100, 206, 20);
    ctx.fillStyle = '#67e8f9'; ctx.font = 'bold 9.5px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('SHIELD ACTIVE · ' + P.shieldTimer.toFixed(1) + 's', 18, LH - 90);
  }

  // Level, timer, kills (top-right)
  const rightPad = MobileControls.isMobile() ? 116 : 14;
  const boxW = 155;
  const boxX = LW - boxW - rightPad;
  ctx.fillStyle = 'rgba(9, 13, 22, 0.88)'; roundRect(ctx, boxX, 8, boxW, 22, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Cinzel,serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('FLOOR ' + GameState.LV + ' · ' + (GameState.LEVEL_TIME_STR || '00:00') + ' · KILLS ' + P.killed, boxX + boxW - 8, 19);

  // Speed badge
  const curSpeed = GameState.GAME_SPEED || 1.0;
  const spCol = curSpeed > 1.05 ? '#f97316' : curSpeed < 0.95 ? '#38bdf8' : '#94a3b8';
  ctx.fillStyle = 'rgba(9, 13, 22, 0.82)'; roundRect(ctx, boxX, 34, boxW, 28, 5); ctx.fill();
  ctx.strokeStyle = GameState.SPEED_SELECTOR_OPEN ? '#ffd700' : 'rgba(51, 65, 85, 0.6)';
  ctx.lineWidth = GameState.SPEED_SELECTOR_OPEN ? 1.5 : 1;
  ctx.stroke();

  ctx.fillStyle = spCol; ctx.font = 'bold 10px Cinzel, serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('◈ SPEED: ' + curSpeed.toFixed(2) + 'x', boxX + boxW - 8, 38);
  ctx.fillStyle = GameState.SPEED_SELECTOR_OPEN ? '#ffd700' : 'rgba(148, 163, 184, 0.65)';
  ctx.font = '8.5px Cinzel, serif'; ctx.textBaseline = 'top';
  ctx.fillText(MobileControls.isMobile() ? '[ TAP TO ADJUST ]' : 'O [▼]  P [▲] ADJUST', boxX + boxW - 8, 49);

  // Live speed selector popout
  drawLiveSpeedSelector(ctx, boxX, boxW);

  // Ingame message toast
  if (GameState.GAME_MSG && GameState.GAME_MSG_TIMER > 0) {
    const alpha = Math.min(1, GameState.GAME_MSG_TIMER / 0.6) * Math.min(1, GameState.GAME_MSG_TIMER);
    if (alpha > 0) {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,.75)'; roundRect(ctx, LW / 2 - 240, LH - 130, 480, 30, 8); ctx.fill();
      ctx.fillStyle = '#fde68a'; ctx.font = 'bold 12px Cinzel,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(GameState.GAME_MSG, LW / 2, LH - 115);
      ctx.restore();
    }
  }

  // Active Portal Ascension Prompt
  if (GameState.BOSS_DEAD || !isBossFloor(GameState.LV)) {
    const tx = Math.round(P.x);
    const ty = Math.round(P.y);
    let nearPortal = false;
    if (GameState.MAP) {
      for (let dr = -2; dr <= 2 && !nearPortal; dr++) {
        for (let dc = -2; dc <= 2 && !nearPortal; dc++) {
          const r = ty + dr, c = tx + dc;
          if (GameState.MAP[r] && GameState.MAP[r][c] === 2 && Math.hypot(P.x - c, P.y - r) < 2.5) {
            nearPortal = true;
          }
        }
      }
    }
    if (nearPortal) {
      const pulse = Math.sin(GameState.F * 0.12) * 0.25 + 0.75;
      ctx.save();
      ctx.globalAlpha = pulse;
      const bw = 380, bh = 30;
      const bx = LW / 2 - bw / 2;
      const by = LH - 130;
      ctx.fillStyle = 'rgba(5, 7, 20, 0.88)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      roundRect(ctx, bx, by, bw, bh, 6);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const promptText = (GameState.LV >= 10)
        ? '✦ STEP ON PORTAL TO ENTER ASCENSION ENDING ✦'
        : '✦ STEP ON PORTAL TO ADVANCE [SPACE / ENTER] ✦';
      ctx.fillText(promptText, LW / 2, by + bh / 2);
      ctx.restore();
    }
  }
}

export const HUD = {
  draw(ctx) {
    if (GameState.STATE !== GameStates.PLAYING) return;
    _drawOriginalHUD(ctx);
    drawHUDWeaponSlots(ctx);
    drawLuxuryHUDExtensions(ctx);
    BossBar.draw(ctx);
    drawMinimap(ctx);
    if (GameState.MAP_EXPANDED) {
      drawExpandedFloorMap(ctx);
    }
    drawCinematicBanner(ctx);
  },
  toggleMinimap() {
    if (GameState.STATE !== GameStates.PLAYING) return;
    GameState.MAP_EXPANDED = !GameState.MAP_EXPANDED;
  },
  handleExpandedMapClick,
  getActiveExitPortal,
  getUnrescuedSurvivors,
  getActiveBoss,
  drawExpandedFloorMap,
  drawLiveSpeedSelector
};

export function drawHUD(ctx) {
  HUD.draw(ctx);
}

if (typeof window !== 'undefined') {
  window.HUD = HUD;
}

