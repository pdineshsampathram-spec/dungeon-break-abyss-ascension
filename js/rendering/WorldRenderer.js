// =====================================================================
//  DUNGEON BREAK — js/rendering/WorldRenderer.js
//  Authoritative Tilemap, 2.5D Wall Depth, Portal Swirls, Items, & Minimap
// =====================================================================

import { GameState } from '../core/GameState.js';
import { T, ROWS, COLS, LW, LH, roundRect } from '../core/Constants.js';
import { getTheme, isBossFloor } from '../data/floors.js';
import { WD, RARITIES } from '../data/weapons.js';

export let MINIMAP_VISIBLE = true;

export const WorldRenderer = {
  drawTiles(ctx) {
    const { MAP, LV } = GameState;
    if (!MAP || MAP.length === 0) return;
    const theme = getTheme(LV);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = MAP[r] ? MAP[r][c] : 1;
        const x = c * T;
        const y = r * T;

        if (tile === 1) {
          // 2.5D Wall Tile with Top Bevel & Shadow
          ctx.fillStyle = theme.wc[0] || '#1e293b';
          ctx.fillRect(x, y, T, T);

          // Top highlight
          ctx.fillStyle = theme.wc[1] || '#243044';
          ctx.fillRect(x, y, T, 4);

          // Bottom drop-shadow
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.fillRect(x, y + T - 6, T, 6);
        } else if (tile === 0) {
          // Floor Tile
          const colIdx = (r * 7 + c * 13) % (theme.fc.length || 1);
          ctx.fillStyle = theme.fc[colIdx] || '#0c1526';
          ctx.fillRect(x, y, T, T);

          // Subtle stone grout outline
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, T, T);
        } else if (tile === 2) {
          // Cosmic Portal Tile
          ctx.fillStyle = '#050714';
          ctx.fillRect(x, y, T, T);

          const cx = x + T / 2;
          const cy = y + T / 2;
          const swirl = GameState.F * 0.08;

          // Glowing Swirling Rift
          ctx.save();
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 12, swirl, swirl + 4.5);
          ctx.stroke();

          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(cx, cy, 8, -swirl, -swirl + 4.5);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  },

  drawTorches(ctx) {
    GameState.TORCHES.forEach(t => {
      const px = t.x * T + T / 2;
      const py = t.y * T + T / 2;
      const flicker = Math.sin(GameState.F * 0.15 + t.ph) * 1.5;

      // Iron bracket
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 2, py - 4, 4, 8);

      // Flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(px, py - 6 + flicker, 4, 0, 6.28);
      ctx.fill();

      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(px, py - 7 + flicker, 2, 0, 6.28);
      ctx.fill();
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

  drawAllies(ctx) {
    GameState.ALLIES.forEach(a => {
      if (a.rescued) return;
      const ax = (a.x + 0.5) * T;
      const ay = (a.y + 0.5) * T;
      ctx.save();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(ax, ay, 6, 0, 6.28);
      ctx.fill();
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

    // Floor tiles
    ctx.fillStyle = 'rgba(100,116,139,0.3)';
    for (let r = 0; r < ROWS; r += 2) {
      for (let c = 0; c < COLS; c += 2) {
        if (MAP[r] && MAP[r][c] === 0) {
          ctx.fillRect(mx + c * scaleX, my + r * scaleY, scaleX * 2, scaleY * 2);
        } else if (MAP[r] && MAP[r][c] === 2) {
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
  }
};

if (typeof window !== 'undefined') {
  window.MINIMAP_VISIBLE = MINIMAP_VISIBLE;
}
