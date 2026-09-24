// =====================================================================
//  DUNGEON BREAK — js/ui/HUD.js
//  Authoritative Heads-Up Display: Vitality, Sanity, 3-Weapon Slots,
//  Relics, Floor Mutation, Minimap, and Cinematic Banners
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, COLS, ROWS, roundRect } from '../core/Constants.js';
import { WD, RARITIES } from '../data/weapons.js';
import { RELIC_DEFS } from '../data/relics.js';
import { BossBar } from './BossBar.js';

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

export function drawHUDWeaponSlots(ctx) {
  if (GameState.STATE !== GameStates.PLAYING) return;
  const hudSlotStartX = 200;
  const hudSlotY = LH - 44;
  const hudSlotW = 38;
  const hudSlotH = 36;
  const hudSlotGap = 6;

  for (let i = 0; i < 3; i++) {
    const sx = hudSlotStartX + i * (hudSlotW + hudSlotGap);
    const w = GameState.weaponSlots ? GameState.weaponSlots[i] : null;
    const isActive = (i === GameState.activeWeaponSlot);

    ctx.save();
    if (isActive) {
      ctx.shadowColor = '#fde68a';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(201, 168, 76, 0.32)';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2.0;
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 1.0;
    }
    roundRect(ctx, sx, hudSlotY, hudSlotW, hudSlotH, 5);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isActive ? '#fde68a' : '#64748b';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(String(i + 1), sx + 3, hudSlotY + 2);

    if (w) {
      ctx.font = '16px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const icon = (WD[w.id] && WD[w.id].icon) || w.icon || '⚔️';
      ctx.fillText(icon, sx + hudSlotW / 2, hudSlotY + hudSlotH / 2 + 2);
    } else {
      ctx.fillStyle = '#475569';
      ctx.font = '9px Cinzel, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('—', sx + hudSlotW / 2, hudSlotY + hudSlotH / 2 + 2);
    }
    ctx.restore();
  }
}

export function drawLuxuryHUDExtensions(ctx) {
  if (GameState.STATE !== GameStates.PLAYING) return;

  // Active Mutation Badge (top-left)
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

  // Active Relics Bar (bottom-center)
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
      ctx.font = '13px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rel.icon || '💎', bx + 12, ry + 12);
      ctx.restore();
    });
  }
}

function _drawOriginalHUD(ctx) {
  const P = GameState.P;
  const hpFrac = Math.max(0, Math.min(1, P.displayHp / P.maxHp));
  const lowHp = P.hp <= 2;
  const hx = 12, hy = LH - 38, hw = 180, hh = 14;

  ctx.fillStyle = 'rgba(0,0,0,.7)'; roundRect(ctx, hx - 2, hy - 2, hw + 4, hh + 4, 5); ctx.fill();
  ctx.fillStyle = '#1e293b'; ctx.fillRect(hx, hy, hw, hh);

  const hg = ctx.createLinearGradient(hx, 0, hx + hw, 0);
  if (lowHp) {
    const pulse = Math.sin(GameState.F * 0.15) * 0.4 + 0.6;
    hg.addColorStop(0, `rgba(220,38,38,${pulse})`);
    hg.addColorStop(1, `rgba(239,68,68,${pulse * 0.7})`);
  } else {
    hg.addColorStop(0, '#22c55e');
    hg.addColorStop(0.6, '#16a34a');
    hg.addColorStop(1, '#15803d');
  }

  // Ghost HP bar (fighting game style lingering red/amber chunk)
  const ghostHp = P.ghostHp !== undefined ? P.ghostHp : P.displayHp;
  if (ghostHp > P.displayHp) {
    const ghostFrac = Math.min(1, Math.max(0, ghostHp / P.maxHp));
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(hx, hy, hw * ghostFrac, hh);
  }

  ctx.fillStyle = hg; ctx.fillRect(hx, hy, hw * hpFrac, hh);
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1; ctx.strokeRect(hx, hy, hw, hh);
  ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 10px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('❤ ' + Math.ceil(Math.max(0, P.displayHp)) + '/' + P.maxHp, hx + 5, hy + hh / 2);

  const sf = Math.max(0, Math.min(1, P.san / 100));
  const sx = 12, sy = LH - 58, sw2 = 180, seh = 10;
  ctx.fillStyle = 'rgba(0,0,0,.7)'; roundRect(ctx, sx - 2, sy - 2, sw2 + 4, seh + 4, 5); ctx.fill();
  ctx.fillStyle = '#1e1b4b'; ctx.fillRect(sx, sy, sw2, seh);
  const sg2 = ctx.createLinearGradient(sx, 0, sx + sw2, 0);
  if (P.san < 35) {
    const fp = Math.sin(GameState.F * 0.2) * 0.3 + 0.7;
    sg2.addColorStop(0, `rgba(139,92,246,${fp})`);
    sg2.addColorStop(1, `rgba(109,40,217,${fp * 0.7})`);
  } else {
    sg2.addColorStop(0, '#8b5cf6');
    sg2.addColorStop(1, '#7c3aed');
  }
  ctx.fillStyle = sg2; ctx.fillRect(sx, sy, sw2 * sf, seh);
  ctx.strokeStyle = 'rgba(139,92,246,.25)'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, sw2, seh);
  ctx.fillStyle = '#c4b5fd'; ctx.font = 'bold 9px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('🧠 ' + Math.floor(Math.max(0, P.san)) + '%', sx + 4, sy + seh / 2);

  // Active weapon badge
  if (P.wep && WD[P.wep]) {
    const w = WD[P.wep];
    const rar = P.wepRarity || RARITIES[0];
    ctx.fillStyle = 'rgba(0,0,0,.7)'; roundRect(ctx, 12, LH - 84, 180, 22, 5); ctx.fill();
    ctx.fillStyle = rar.col || '#94a3b8'; ctx.font = 'bold 10px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(w.label + ' [' + rar.name + ']', 16, LH - 73);
    if (P.acd > 0) {
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(12, LH - 65, 180 * (P.acd / w.cd), 4);
      ctx.fillStyle = '#fde68a'; ctx.fillRect(12, LH - 65, 180 * (1 - P.acd / w.cd), 4);
    }
  }

  // Active shield badge
  if (P.shieldActive) {
    const sp = Math.sin(GameState.F * 0.12) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(6,182,212,${0.18 + sp * 0.08})`; roundRect(ctx, 12, LH - 108, 180, 20, 5); ctx.fill();
    ctx.strokeStyle = `rgba(103,232,249,${0.6 + sp * 0.3})`; ctx.lineWidth = 1.5; ctx.strokeRect(12, LH - 108, 180, 20);
    ctx.fillStyle = '#67e8f9'; ctx.font = 'bold 10px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('🛡️ SHIELD ' + P.shieldTimer.toFixed(1) + 's', 16, LH - 98);
  }

  // Level, timer, kills, survivors
  ctx.fillStyle = 'rgba(0,0,0,.6)'; roundRect(ctx, LW - 160, 8, 150, 22, 5); ctx.fill();
  ctx.fillStyle = '#94a3b8'; ctx.font = '10px Cinzel,serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('LV' + GameState.LV + ' ⏱' + (GameState.LEVEL_TIME_STR || '00:00') + '  💀' + P.killed + '  🧍' + P.saved, LW - 12, 19);

  // Speed badge
  const curSpeed = GameState.GAME_SPEED || 1.0;
  const spCol = curSpeed > 1.05 ? '#f97316' : curSpeed < 0.95 ? '#38bdf8' : '#94a3b8';
  ctx.fillStyle = 'rgba(0,0,0,.6)'; roundRect(ctx, LW - 162, 34, 152, 30, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(100,116,139,.3)'; ctx.lineWidth = 1; ctx.strokeRect(LW - 162, 34, 152, 30);
  ctx.fillStyle = spCol; ctx.font = 'bold 11px Cinzel,serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('⚡ Speed: ' + curSpeed.toFixed(2) + 'x', LW - 10, 38);
  ctx.fillStyle = 'rgba(100,116,139,.65)'; ctx.font = '9px Cinzel,serif'; ctx.textBaseline = 'top';
  ctx.fillText('O ▼  P ▲ to adjust', LW - 10, 52);

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
