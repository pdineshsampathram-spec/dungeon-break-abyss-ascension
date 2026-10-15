// =====================================================================
//  DUNGEON BREAK — js/ui/PauseMenu.js
//  Authoritative In-Game Pause, Settings, & Achievements Modal Panels
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { AudioManager } from '../audio/AudioManager.js';
import { MobileControls } from './MobileControls.js';

import { SettingsUI, openSettings as openSettingsModal } from './SettingsUI.js';
import { AchievementsUI, openAchievements as openAchievementsModal } from './AchievementsUI.js';

import { MOUSE_STATE } from '../core/InputManager.js';

let _pauseBtns = [];

export function pauseGame() {
  if (GameState.STATE === GameStates.PLAYING) {
    GameState.setState(GameStates.PAUSED);
    const sp = document.getElementById('ingame-speed-panel');
    if (sp) sp.style.display = 'none';
  }
}

export function resumeGame() {
  if (GameState.STATE === GameStates.PAUSED) {
    GameState.setState(GameStates.PLAYING);
    if (typeof document !== 'undefined') {
      const sp = document.getElementById('ingame-speed-panel');
      if (sp) sp.style.display = 'none';
    }
  }
}

export function quitToMainMenu() {
  GameState.setState(GameStates.TITLE);
  if (typeof document !== 'undefined') {
    const sp = document.getElementById('ingame-speed-panel');
    if (sp) sp.style.display = 'none';
  }
  AudioManager.updateMusicLayers(0);
}

export function openSettings() {
  openSettingsModal(GameStates.PAUSED);
}

export function openAchievements() {
  openAchievementsModal(GameStates.PAUSED);
}

export { SettingsUI, AchievementsUI };

export const PauseMenu = {
  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,.75)';
    ctx.fillRect(0, 0, LW, LH);

    const panW = 340, panH = 250;
    const panX = Math.round(LW / 2 - panW / 2), panY = Math.round(LH / 2 - panH / 2);

    ctx.save();
    ctx.shadowColor = 'rgba(201, 168, 76, 0.25)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(5, 8, 22, 0.98)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.65)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Inner subtle filigree border
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 6, panY + 6, panW - 12, panH - 12, 8);
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = '#c9a84c'; ctx.shadowBlur = 14;
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 20px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('◈ PAUSED ◈', LW / 2, panY + 18);
    ctx.restore();

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panX + 24, panY + 48);
    ctx.lineTo(panX + panW - 24, panY + 48);
    ctx.stroke();

    const mouseX = MOUSE_STATE ? MOUSE_STATE.mx : -999;
    const mouseY = MOUSE_STATE ? MOUSE_STATE.my : -999;

    _pauseBtns.length = 0;
    const btnDefs = [
      { label: '◈  RESUME JOURNEY', col: '#4ade80', hoverCol: '#86efac', bg: 'rgba(34,197,94,0.14)', hoverBg: 'rgba(34,197,94,0.28)', border: 'rgba(34,197,94,0.5)', action: resumeGame },
      { label: '◈  SETTINGS & MIXER', col: '#fde68a', hoverCol: '#ffffff', bg: 'rgba(201,168,76,0.12)', hoverBg: 'rgba(201,168,76,0.26)', border: 'rgba(201,168,76,0.45)', action: openSettings },
      { label: '◈  QUIT TO MENU',     col: '#f87171', hoverCol: '#fca5a5', bg: 'rgba(239,68,68,0.12)',  hoverBg: 'rgba(239,68,68,0.26)',  border: 'rgba(239,68,68,0.45)',  action: quitToMainMenu },
    ];

    btnDefs.forEach((def, i) => {
      const bx = panX + 24, by = panY + 60 + i * 52;
      const bw = panW - 48, bh = 40;
      const isHover = mouseX >= bx && mouseX <= bx + bw && mouseY >= by && mouseY <= by + bh;

      ctx.fillStyle = isHover ? def.hoverBg : def.bg;
      ctx.strokeStyle = isHover ? '#fde68a' : def.border;
      ctx.lineWidth = isHover ? 1.6 : 1.2;
      roundRect(ctx, bx, by, bw, bh, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isHover ? def.hoverCol : def.col;
      ctx.font = 'bold 12.5px Cinzel, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(def.label, bx + bw / 2, by + bh / 2);

      _pauseBtns.push({ x: bx, y: by, w: bw, h: bh, action: def.action });
    });

    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)'; ctx.font = '9.5px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Esc to resume  ·  Click button to select', LW / 2, panY + panH - 12);
  },

  handleClick(mx, my) {
    for (const btn of _pauseBtns) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        btn.action();
        return true;
      }
    }
    return false;
  }
};



