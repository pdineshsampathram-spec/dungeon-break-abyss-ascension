// =====================================================================
//  DUNGEON BREAK — js/ui/CodexUI.js
//  Authoritative Codex, Bestiary, Lore Scrolls, & Memory Echo Modals
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { BESTIARY_INFO } from '../data/enemies.js';
import { LORE_SCROLLS_DATA } from '../data/lore.js';
import { STORY_MEMORIES } from '../data/memories.js';
import { AudioManager } from '../audio/AudioManager.js';

let CODEX_SLIDE = 0;
let CODEX_TAB = 'lore'; // 'lore' | 'bestiary' | 'memories'
let CODEX_SELECTED_LORE = 0;
let MEMORY_ECHO_ANIM_T = 0;

export function openCodex() {
  CODEX_SLIDE = 0;
  GameState.setState(GameStates.CODEX);
}

export function openLoreModal(scroll) {
  GameState.ACTIVE_LORE_MODAL = scroll;
}

export const CodexUI = {
  draw(ctx, dt = 0.016) {
    CODEX_SLIDE = Math.min(1, CODEX_SLIDE + dt * 4.5);
    const panW = 600, panH = 550;
    const panX = LW / 2 - panW / 2;
    const panY = LH / 2 - panH / 2 - (1 - CODEX_SLIDE) * 45;

    ctx.save();
    ctx.globalAlpha = CODEX_SLIDE;

    ctx.fillStyle = 'rgba(6,9,24,0.98)';
    ctx.strokeStyle = 'rgba(201,168,76,0.75)';
    ctx.lineWidth = 1.8;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#c9a84c';
    ctx.shadowBlur = 10;
    ctx.fillText('📜 THE ABYSS CODEX & BESTIARY', LW / 2, panY + 16);
    ctx.shadowBlur = 0;

    // Tabs Header
    const tabW = (panW - 64) / 3;
    const tab1X = panX + 20, tab2X = panX + 26 + tabW, tab3X = panX + 32 + tabW * 2;
    const tabY = panY + 44, tabH = 32;

    const unlockedLore = GameState.UNLOCKED_LORE || {};
    const unlockedMem = GameState.UNLOCKED_MEMORIES || {};

    // Tab 1: Lore
    ctx.fillStyle = CODEX_TAB === 'lore' ? 'rgba(201,168,76,0.25)' : 'rgba(15,23,42,0.6)';
    ctx.strokeStyle = CODEX_TAB === 'lore' ? '#fde68a' : 'rgba(71,85,105,0.5)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, tab1X, tabY, tabW, tabH, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CODEX_TAB === 'lore' ? '#fde68a' : '#94a3b8';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📜 CHRONICLES (' + Object.keys(unlockedLore).length + ')', tab1X + tabW / 2, tabY + tabH / 2);

    // Tab 2: Bestiary
    ctx.fillStyle = CODEX_TAB === 'bestiary' ? 'rgba(168,85,247,0.25)' : 'rgba(15,23,42,0.6)';
    ctx.strokeStyle = CODEX_TAB === 'bestiary' ? '#c084fc' : 'rgba(71,85,105,0.5)';
    roundRect(ctx, tab2X, tabY, tabW, tabH, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CODEX_TAB === 'bestiary' ? '#c084fc' : '#94a3b8';
    ctx.fillText('💀 BESTIARY (' + BESTIARY_INFO.length + ')', tab2X + tabW / 2, tabY + tabH / 2);

    // Tab 3: Memories
    ctx.fillStyle = CODEX_TAB === 'memories' ? 'rgba(245,158,11,0.25)' : 'rgba(15,23,42,0.6)';
    ctx.strokeStyle = CODEX_TAB === 'memories' ? '#f59e0b' : 'rgba(71,85,105,0.5)';
    roundRect(ctx, tab3X, tabY, tabW, tabH, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CODEX_TAB === 'memories' ? '#fde68a' : '#94a3b8';
    ctx.fillText('✨ MEMORIES (' + Object.keys(unlockedMem).length + '/4)', tab3X + tabW / 2, tabY + tabH / 2);

    const contentY = tabY + tabH + 12;

    if (CODEX_TAB === 'lore') {
      const itemH = 46, gap = 6;
      for (let i = 0; i < LORE_SCROLLS_DATA.length; i++) {
        const scroll = LORE_SCROLLS_DATA[i];
        const isUnlocked = !!unlockedLore[scroll.id];
        const isSel = CODEX_SELECTED_LORE === i;
        const iy = contentY + i * (itemH + gap);
        if (iy + itemH > panY + panH - 54) break;

        ctx.fillStyle = isSel ? 'rgba(201,168,76,0.18)' : 'rgba(15,23,42,0.7)';
        ctx.strokeStyle = isSel ? '#fde68a' : isUnlocked ? 'rgba(201,168,76,0.4)' : 'rgba(51,65,85,0.4)';
        roundRect(ctx, panX + 24, iy, panW - 48, itemH, 6); ctx.fill(); ctx.stroke();

        ctx.font = '16px serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(isUnlocked ? '📜' : '🔒', panX + 36, iy + itemH / 2);

        ctx.fillStyle = isUnlocked ? (isSel ? '#fde68a' : '#f1f5f9') : '#64748b';
        ctx.font = 'bold 12px Cinzel, serif';
        ctx.fillText(isUnlocked ? scroll.title : 'Encrypted Ancient Parchment', panX + 64, iy + 16);

        ctx.fillStyle = isUnlocked ? 'rgba(203,213,225,0.85)' : 'rgba(100,116,139,0.6)';
        ctx.font = 'italic 11px Crimson Text, serif';
        const prev = isUnlocked ? scroll.text : 'Explore secret dead ends in deep floors to decipher...';
        const trimmed = prev.length > 70 ? prev.substring(0, 67) + '...' : prev;
        ctx.fillText(trimmed, panX + 64, iy + 33);
      }
    } else if (CODEX_TAB === 'memories') {
      const itemH = 72, gap = 8;
      for (let i = 0; i < STORY_MEMORIES.length; i++) {
        const m = STORY_MEMORIES[i];
        const isUnlocked = !!unlockedMem[m.id];
        const iy = contentY + i * (itemH + gap);
        if (iy + itemH > panY + panH - 54) break;

        ctx.fillStyle = isUnlocked ? 'rgba(245,158,11,0.12)' : 'rgba(15,23,42,0.7)';
        ctx.strokeStyle = isUnlocked ? 'rgba(245,158,11,0.55)' : 'rgba(51,65,85,0.4)';
        roundRect(ctx, panX + 24, iy, panW - 48, itemH, 6); ctx.fill(); ctx.stroke();

        ctx.font = '20px serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(isUnlocked ? '✨' : '🔒', panX + 36, iy + itemH / 2);

        ctx.fillStyle = isUnlocked ? '#fde68a' : '#64748b';
        ctx.font = 'bold 12px Cinzel, serif';
        ctx.fillText(isUnlocked ? m.title : 'Undiscovered Memory Fragment', panX + 64, iy + 18);

        ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(100,116,139,0.6)';
        ctx.font = 'italic 11px Crimson Text, serif';
        const quoteText = isUnlocked ? m.quote : "Explore Floor " + m.floor + " to uncover Lyra's past...";
        const trimmedQ = quoteText.length > 74 ? quoteText.substring(0, 71) + '...' : quoteText;
        ctx.fillText(trimmedQ, panX + 64, iy + 36);

        ctx.fillStyle = isUnlocked ? 'rgba(203,213,225,0.8)' : 'rgba(71,85,105,0.5)';
        ctx.font = '10px Crimson Text, serif';
        const loreText = isUnlocked ? m.lore : 'The darkness guards what love created.';
        const trimmedL = loreText.length > 80 ? loreText.substring(0, 77) + '...' : loreText;
        ctx.fillText(trimmedL, panX + 64, iy + 54);
      }
    } else {
      const itemH = 54, gap = 6;
      const killsMap = GameState.BESTIARY_KILLS || {};
      for (let i = 0; i < BESTIARY_INFO.length; i++) {
        const b = BESTIARY_INFO[i];
        const kills = killsMap[b.id] || 0;
        const iy = contentY + i * (itemH + gap);
        if (iy + itemH > panY + panH - 54) break;

        ctx.fillStyle = 'rgba(15,23,42,0.75)';
        ctx.strokeStyle = b.col || '#94a3b8';
        ctx.lineWidth = 1;
        roundRect(ctx, panX + 24, iy, panW - 48, itemH, 6); ctx.fill(); ctx.stroke();

        ctx.font = '20px serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(b.icon || '💀', panX + 34, iy + itemH / 2);

        ctx.fillStyle = b.col || '#fde68a';
        ctx.font = 'bold 12px Cinzel, serif';
        ctx.fillText(b.name, panX + 64, iy + 16);

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.textAlign = 'right';
        ctx.fillText('Kills: ' + kills + '  |  Threat: ' + b.threat, panX + panW - 36, iy + 16);

        ctx.fillStyle = 'rgba(203,213,225,0.85)';
        ctx.font = '10px Crimson Text, serif';
        ctx.textAlign = 'left';
        const wText = '💡 Weakness: ' + b.weakness;
        const trimmedW = wText.length > 80 ? wText.substring(0, 77) + '...' : wText;
        ctx.fillText(trimmedW, panX + 64, iy + 36);
      }
    }

    // Close Button
    const closeBtnW = 180, closeBtnH = 34;
    const closeX = LW / 2 - closeBtnW / 2, closeY = panY + panH - 46;
    ctx.fillStyle = 'rgba(30,41,59,0.85)';
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, closeX, closeY, closeBtnW, closeBtnH, 6); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✖ Close Codex ( Esc )', LW / 2, closeY + closeBtnH / 2);

    ctx.restore();
  },

  handleClick(mx, my) {
    const panW = 600, panH = 550;
    const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;

    const closeBtnW = 180, closeBtnH = 34;
    const closeX = LW / 2 - closeBtnW / 2, closeY = panY + panH - 46;
    if (mx >= closeX && mx <= closeX + closeBtnW && my >= closeY && my <= closeY + closeBtnH) {
      GameState.setState(GameStates.TITLE);
      return true;
    }

    const tabW = (panW - 64) / 3;
    const tab1X = panX + 20, tab2X = panX + 26 + tabW, tab3X = panX + 32 + tabW * 2;
    const tabY = panY + 44, tabH = 32;

    if (mx >= tab1X && mx <= tab1X + tabW && my >= tabY && my <= tabY + tabH) {
      CODEX_TAB = 'lore';
      AudioManager.playSFX('talent_unlock');
      return true;
    }
    if (mx >= tab2X && mx <= tab2X + tabW && my >= tabY && my <= tabY + tabH) {
      CODEX_TAB = 'bestiary';
      AudioManager.playSFX('talent_unlock');
      return true;
    }
    if (mx >= tab3X && mx <= tab3X + tabW && my >= tabY && my <= tabY + tabH) {
      CODEX_TAB = 'memories';
      AudioManager.playSFX('talent_unlock');
      return true;
    }

    if (CODEX_TAB === 'lore') {
      const itemH = 46, gap = 6;
      const contentY = tabY + tabH + 12;
      const unlockedLore = GameState.UNLOCKED_LORE || {};
      for (let i = 0; i < LORE_SCROLLS_DATA.length; i++) {
        const iy = contentY + i * (itemH + gap);
        if (mx >= panX + 24 && mx <= panX + panW - 24 && my >= iy && my <= iy + itemH) {
          const scroll = LORE_SCROLLS_DATA[i];
          if (unlockedLore[scroll.id]) {
            CODEX_SELECTED_LORE = i;
            openLoreModal(scroll);
            return true;
          }
        }
      }
    }

    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      GameState.setState(GameStates.TITLE);
      return true;
    }
    return false;
  }
};

export function drawLoreModal(ctx) {
  if (!GameState.ACTIVE_LORE_MODAL) return;
  const mw = 460, mh = 220;
  const mx = LW / 2 - mw / 2, my = LH / 2 - mh / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(5,7,18,0.96)';
  ctx.strokeStyle = 'rgba(201,168,76,0.8)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, mx, my, mw, mh, 10);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 15px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('📜 ' + GameState.ACTIVE_LORE_MODAL.title, LW / 2, my + 24);

  ctx.fillStyle = 'rgba(201,168,76,0.3)';
  ctx.fillRect(mx + 30, my + 44, mw - 60, 1);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'italic 13px Crimson Text, serif';
  const words = GameState.ACTIVE_LORE_MODAL.text.split(' ');
  let line = '', lines = [];
  words.forEach(w => {
    if (ctx.measureText(line + w).width > mw - 60) {
      lines.push(line); line = w + ' ';
    } else line += w + ' ';
  });
  lines.push(line);

  lines.forEach((l, i) => {
    ctx.fillText(l, LW / 2, my + 75 + i * 22);
  });

  ctx.fillStyle = 'rgba(148,163,184,0.6)';
  ctx.font = '10px Cinzel, serif';
  ctx.fillText('Click anywhere to close', LW / 2, my + mh - 16);
  ctx.restore();
}

export function drawMemoryEchoModal(ctx, dt = 0.016) {
  if (!GameState.ACTIVE_MEMORY_ECHO) return;
  MEMORY_ECHO_ANIM_T = Math.min(1, MEMORY_ECHO_ANIM_T + dt * 4.0);

  const panW = 540, panH = 340;
  const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2 - (1 - MEMORY_ECHO_ANIM_T) * 40;

  ctx.save();
  ctx.globalAlpha = MEMORY_ECHO_ANIM_T;

  ctx.fillStyle = 'rgba(5,8,22,0.96)';
  ctx.strokeStyle = 'rgba(245,158,11,0.75)';
  ctx.lineWidth = 1.8;
  roundRect(ctx, panX, panY, panW, panH, 12);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 16px Cinzel, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 12;
  ctx.fillText('✨ ' + GameState.ACTIVE_MEMORY_ECHO.title, LW / 2, panY + 18);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(245,158,11,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panX + 30, panY + 44); ctx.lineTo(panX + panW - 30, panY + 44);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 14px Crimson Text, serif';
  const words = (GameState.ACTIVE_MEMORY_ECHO.quote || '').split(' ');
  let line = '', lines = [];
  words.forEach(w => {
    if (ctx.measureText(line + w).width > panW - 60) {
      lines.push(line); line = w + ' ';
    } else line += w + ' ';
  });
  lines.push(line);
  lines.forEach((l, i) => {
    ctx.fillText(l, LW / 2, panY + 62 + i * 22);
  });

  const loreStartY = panY + 62 + lines.length * 22 + 10;
  ctx.fillStyle = 'rgba(203,213,225,0.85)';
  ctx.font = '11px Crimson Text, serif';
  const lwords = (GameState.ACTIVE_MEMORY_ECHO.lore || '').split(' ');
  let lline = '', llines = [];
  lwords.forEach(w => {
    if (ctx.measureText(lline + w).width > panW - 60) {
      llines.push(lline); lline = w + ' ';
    } else lline += w + ' ';
  });
  llines.push(lline);
  llines.forEach((l, i) => {
    ctx.fillText(l, LW / 2, loreStartY + i * 18);
  });

  const btnW = 220, btnH = 60;
  const btn1X = panX + 30, btn2X = panX + panW - 30 - btnW;
  const btnY = panY + panH - 85;

  // Choice A
  if (GameState.ACTIVE_MEMORY_ECHO.choiceA) {
    ctx.fillStyle = 'rgba(14,165,233,0.18)';
    ctx.strokeStyle = 'rgba(56,189,248,0.7)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, btn1X, btnY, btnW, btnH, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceA.label, btn1X + btnW / 2, btnY + 12);
    ctx.fillStyle = 'rgba(226,232,240,0.85)';
    ctx.font = '10px Crimson Text, serif';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceA.desc, btn1X + btnW / 2, btnY + 34);
  }

  // Choice B
  if (GameState.ACTIVE_MEMORY_ECHO.choiceB) {
    ctx.fillStyle = 'rgba(168,85,247,0.18)';
    ctx.strokeStyle = 'rgba(192,132,252,0.7)';
    roundRect(ctx, btn2X, btnY, btnW, btnH, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceB.label, btn2X + btnW / 2, btnY + 12);
    ctx.fillStyle = 'rgba(226,232,240,0.85)';
    ctx.font = '10px Crimson Text, serif';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceB.desc, btn2X + btnW / 2, btnY + 34);
  }

  ctx.restore();
}

export function handleMemoryEchoClick(mx, my) {
  if (!GameState.ACTIVE_MEMORY_ECHO) return false;
  const panW = 540, panH = 340;
  const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;
  const btnW = 220, btnH = 60;
  const btn1X = panX + 30, btn2X = panX + panW - 30 - btnW;
  const btnY = panY + panH - 85;

  if (mx >= btn1X && mx <= btn1X + btnW && my >= btnY && my <= btnY + btnH) {
    if (GameState.ACTIVE_MEMORY_ECHO.choiceA && GameState.ACTIVE_MEMORY_ECHO.choiceA.effect) {
      GameState.ACTIVE_MEMORY_ECHO.choiceA.effect();
    }
    GameState.ACTIVE_MEMORY_ECHO = null;
    AudioManager.playSFX('talent_unlock');
    return true;
  }
  if (mx >= btn2X && mx <= btn2X + btnW && my >= btnY && my <= btnY + btnH) {
    if (GameState.ACTIVE_MEMORY_ECHO.choiceB && GameState.ACTIVE_MEMORY_ECHO.choiceB.effect) {
      GameState.ACTIVE_MEMORY_ECHO.choiceB.effect();
    }
    GameState.ACTIVE_MEMORY_ECHO = null;
    AudioManager.playSFX('talent_unlock');
    return true;
  }
  return false;
}
