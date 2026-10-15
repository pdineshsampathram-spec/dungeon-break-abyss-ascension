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
import { isBossFloor } from '../data/floors.js';

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

export function drawMinimap(ctx) {
  if (GameState.MINIMAP_VISIBLE === false || GameState.STATE !== GameStates.PLAYING) return;
  const mw = 120, mh = 84;
  const mx = LW - mw - 14, my = 70;

  ctx.save();
  // Frame
  ctx.fillStyle = 'rgba(5,8,20,0.85)';
  ctx.strokeStyle = 'rgba(201,168,76,0.6)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, mx, my, mw, mh, 6);
  ctx.fill(); ctx.stroke();

  // Header tag
  ctx.fillStyle = 'rgba(201,168,76,0.9)';
  ctx.font = 'bold 8px Cinzel, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('MAP [M]', mx + 6, my + 6);

  // Map scale factors
  const scX = (mw - 16) / COLS;
  const scY = (mh - 22) / ROWS;
  const ox = mx + 8, oy = my + 16;

  // Draw explored rooms
  ctx.fillStyle = 'rgba(71,85,105,0.45)';
  const explored = GameState.EXPLORED_ROOMS || new Set();
  if (GameState.ROOMS) {
    GameState.ROOMS.forEach((r, idx) => {
      if (explored.has(idx) || GameState.LV === 10) {
        ctx.fillRect(ox + r.x * scX, oy + r.y * scY, r.w * scX, r.h * scY);
      }
    });
  }

  // Exit Portal blip
  if (GameState.PORTAL_DISCOVERED || GameState.LV === 10) {
    const prx = (GameState.ROOMS && GameState.ROOMS.length > 0) ? GameState.ROOMS[GameState.ROOMS.length - 1].cx : COLS / 2;
    const pry = (GameState.ROOMS && GameState.ROOMS.length > 0) ? GameState.ROOMS[GameState.ROOMS.length - 1].cy : ROWS / 2;
    const pulse = Math.sin(GameState.F * 0.15) * 0.4 + 0.6;
    ctx.fillStyle = `rgba(34,197,94,${pulse})`;
    ctx.beginPath();
    ctx.arc(ox + prx * scX, oy + pry * scY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mini-Boss / Boss blip
  if (GameState.ACTIVE_MINIBOSS && GameState.ACTIVE_MINIBOSS.alive) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ox + GameState.ACTIVE_MINIBOSS.x * scX, oy + GameState.ACTIVE_MINIBOSS.y * scY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (GameState.LV === 10 && GameState.BOSS && GameState.BOSS.alive) {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(ox + GameState.BOSS.x * scX, oy + GameState.BOSS.y * scY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemy blips
  ctx.fillStyle = 'rgba(239,68,68,0.7)';
  if (GameState.ENE) {
    GameState.ENE.forEach(e => {
      if (e.alive && Math.hypot(GameState.P.x - e.x, GameState.P.y - e.y) < 7) {
        ctx.fillRect(ox + e.x * scX - 1, oy + e.y * scY - 1, 2, 2);
      }
    });
  }

  // Player arrow
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#0ea5e9';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(ox + GameState.P.x * scX, oy + GameState.P.y * scY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// PIXEL-ART WEAPON SILHOUETTES
// ─────────────────────────────────────────────────────────────
function drawPixelWeaponIcon(ctx, weaponId, cx, cy, isActive, accentColor) {
  ctx.save();
  const id = (weaponId || '').toLowerCase();
  const mainCol = isActive ? '#ffffff' : (accentColor || '#cbd5e1');
  const glowCol = isActive ? (accentColor || '#fde68a') : '#475569';

  ctx.fillStyle = mainCol;

  if (id.includes('sword')) {
    // SWORD: Straight steel blade, crossguard quillons, hilt, pommel
    ctx.fillRect(cx - 1, cy - 8, 2, 10);
    ctx.fillRect(cx, cy - 9, 1, 1);
    ctx.fillStyle = glowCol;
    ctx.fillRect(cx - 4, cy + 2, 9, 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 1, cy + 4, 2, 3);
    ctx.fillStyle = glowCol;
    ctx.fillRect(cx - 2, cy + 7, 4, 2);
  } else if (id.includes('axe')) {
    // AXE: Angled wood haft, broad curved crescent blade head, poll spike
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 2, cy - 7, 2, 16);
    ctx.fillStyle = mainCol;
    ctx.fillRect(cx, cy - 6, 5, 2);
    ctx.fillRect(cx + 1, cy - 4, 6, 4);
    ctx.fillRect(cx, cy, 5, 2);
    ctx.fillStyle = glowCol;
    ctx.fillRect(cx + 6, cy - 5, 2, 5);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx - 5, cy - 3, 3, 2);
  } else if (id.includes('dagger')) {
    // DAGGER: Slender stiletto needle blade, curved quillon guard
    ctx.fillRect(cx, cy - 7, 1, 9);
    ctx.fillRect(cx - 1, cy - 4, 3, 4);
    ctx.fillStyle = glowCol;
    ctx.fillRect(cx - 3, cy + 2, 7, 1);
    ctx.fillRect(cx - 4, cy + 1, 2, 1);
    ctx.fillRect(cx + 3, cy + 1, 2, 1);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx, cy + 3, 1, 3);
    ctx.fillStyle = glowCol;
    ctx.fillRect(cx - 1, cy + 6, 3, 2);
  } else if (id.includes('bow')) {
    // BOW: Curved recurve wooden stave, bowstring, nocked arrow
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx - 4, cy - 7, 2, 3);
    ctx.fillRect(cx - 2, cy - 4, 2, 3);
    ctx.fillRect(cx - 1, cy - 1, 2, 3);
    ctx.fillRect(cx - 2, cy + 2, 2, 3);
    ctx.fillRect(cx - 4, cy + 5, 2, 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - 4, cy - 6, 1, 13);
    ctx.fillStyle = glowCol;
    ctx.fillRect(cx - 5, cy, 10, 1);
    ctx.fillRect(cx + 4, cy - 1, 2, 3);
  } else if (id.includes('spear') || id.includes('trident')) {
    // SPEAR / TRIDENT: Central spear shaft, trident triple-prong head
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx, cy - 2, 1, 11);
    ctx.fillStyle = glowCol;
    ctx.fillRect(cx - 3, cy - 3, 7, 2);
    ctx.fillStyle = mainCol;
    ctx.fillRect(cx, cy - 8, 1, 5);
    ctx.fillRect(cx - 3, cy - 7, 1, 4);
    ctx.fillRect(cx + 3, cy - 7, 1, 4);
  } else {
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// WEAPON HOTBAR & ARMORY DOCK (Unified Armoured Equipment)
// ─────────────────────────────────────────────────────────────
export function drawHUDWeaponSlots(ctx) {
  if (GameState.STATE !== GameStates.PLAYING) return;

  const dockX = 224;
  const dockY = LH - 74;
  const dockW = 210;
  const dockH = 62;

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
    const infoText = `${wName} [${rar.name.toUpperCase()}] · ${wDmg} DMG`;

    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rar.col || '#fde68a';
    ctx.fillText(infoText, dockX + 10, dockY + 11);

    // Attack cooldown progress micro-bar inside header rail
    const { P } = GameState;
    const wCd = activeW.cooldown || activeW.cd || 0.32;
    if (P && P.acd > 0) {
      const cdFrac = Math.max(0, Math.min(1, 1 - (P.acd / wCd)));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(dockX + dockW - 54, dockY + 9, 44, 4);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(dockX + dockW - 54, dockY + 9, Math.round(44 * cdFrac), 4);
    }
  }

  // 3. 3 Weapon Slots with Stepped Contours & Recessed Chassis
  const slotW = 39;
  const slotH = 34;
  const slotY = dockY + 20;
  const slotGap = 5;

  for (let i = 0; i < 3; i++) {
    const sx = dockX + 8 + i * (slotW + slotGap);
    const w = GameState.weaponSlots ? GameState.weaponSlots[i] : null;
    const isActive = (i === GameState.activeWeaponSlot);

    ctx.save();
    // Stepped inner recess background
    ctx.fillStyle = '#080c16';
    roundRect(ctx, sx, slotY, slotW, slotH, 3);
    ctx.fill();

    if (isActive) {
      ctx.fillStyle = 'rgba(201, 168, 76, 0.22)';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#fde68a';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.65)';
      ctx.lineWidth = 1.0;
      ctx.shadowBlur = 0;
    }
    roundRect(ctx, sx, slotY, slotW, slotH, 3);
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

    // Slot number shortcut tag [1], [2], [3]
    ctx.fillStyle = isActive ? '#fde68a' : '#64748b';
    ctx.font = 'bold 7.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(i + 1), sx + 4, slotY + 3);

    if (w) {
      const rarCol = (w.rarity && w.rarity.col) || '#94a3b8';
      // Center Pixel-Art Weapon Silhouette
      drawPixelWeaponIcon(ctx, w.id, sx + slotW / 2, slotY + 14, isActive, rarCol);

      // 3-letter weapon abbreviation tag
      const shortCodes = { sword: 'SWD', axe: 'AXE', dagger: 'DAG', bow: 'BOW', spear: 'SPR' };
      const code = shortCodes[w.id] || (w.id ? w.id.substring(0, 3).toUpperCase() : 'WEP');
      ctx.fillStyle = isActive ? '#fde68a' : rarCol;
      ctx.font = 'bold 7px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(code, sx + slotW / 2, slotY + slotH - 1);
    } else {
      ctx.fillStyle = '#334155';
      ctx.font = '8px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('—', sx + slotW / 2, slotY + slotH / 2);
    }
    ctx.restore();
  }

  // 4. Special Ability Slot [Q] (Faceted Stepped Recess)
  const { P } = GameState;
  const qx = dockX + 8 + 3 * (slotW + slotGap);
  const qw = 61;
  const qh = slotH;
  const isQReady = (P && P.qCooldown <= 0);

  ctx.save();
  // Recessed background
  ctx.fillStyle = '#080c16';
  roundRect(ctx, qx, slotY, qw, qh, 3);
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
  roundRect(ctx, qx, slotY, qw, qh, 3);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Key tag [Q]
  ctx.fillStyle = isQReady ? '#fef08a' : '#64748b';
  ctx.font = 'bold 7.5px Cinzel, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Q', qx + 4, slotY + 3);

  // Label & Status
  ctx.font = 'bold 7.5px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isQReady ? '#fef08a' : '#94a3b8';
  ctx.fillText('SPECIAL', qx + qw / 2 + 3, slotY + 9);

  if (isQReady) {
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.fillText('READY', qx + qw / 2 + 3, slotY + qh - 9);
  } else {
    const maxCd = P.qMaxCooldown || 5.0;
    const progress = Math.max(0, Math.min(1, 1 - (P.qCooldown / maxCd)));
    ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
    roundRect(ctx, qx + 4, slotY + qh - 6, (qw - 8) * progress, 3, 1);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.fillText(P.qCooldown.toFixed(1) + 's', qx + qw / 2 + 3, slotY + qh - 11);
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
// THE VANGUARD VITALITY CREST (Phase 5.3: Bespoke Handcrafted Reliquary)
// ─────────────────────────────────────────────────────────────
function _drawOriginalHUD(ctx) {
  const P = GameState.P;
  const maxHp = P.maxHp || 10;
  const curHp = Math.max(0, P.hp !== undefined ? P.hp : maxHp);
  const hpFrac = Math.max(0, Math.min(1, curHp / maxHp));
  const isLowHp = (curHp / maxHp) <= 0.25 || curHp <= 3;

  const crestX = 10;
  const crestY = LH - 74;
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
  ctx.fillStyle = 'rgba(9, 13, 22, 0.88)'; roundRect(ctx, LW - 165, 8, 155, 22, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Cinzel,serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('FLOOR ' + GameState.LV + ' · ' + (GameState.LEVEL_TIME_STR || '00:00') + ' · KILLS ' + P.killed, LW - 14, 19);

  // Speed badge
  const curSpeed = GameState.GAME_SPEED || 1.0;
  const spCol = curSpeed > 1.05 ? '#f97316' : curSpeed < 0.95 ? '#38bdf8' : '#94a3b8';
  ctx.fillStyle = 'rgba(9, 13, 22, 0.82)'; roundRect(ctx, LW - 165, 34, 155, 28, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = spCol; ctx.font = 'bold 10px Cinzel, serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('◈ SPEED: ' + curSpeed.toFixed(2) + 'x', LW - 14, 38);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.65)'; ctx.font = '8.5px Cinzel, serif'; ctx.textBaseline = 'top';
  ctx.fillText('O [▼]  P [▲] ADJUST', LW - 14, 49);

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
    drawCinematicBanner(ctx);
  },
  toggleMinimap() {
    GameState.MINIMAP_VISIBLE = !GameState.MINIMAP_VISIBLE;
  }
};

export function drawHUD(ctx) {
  HUD.draw(ctx);
}

