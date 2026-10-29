// =====================================================================
//  DUNGEON BREAK — js/ui/PauseMenu.js
//  Phase 5.4: Master Dark-Fantasy Pause & Expedition Suspended Chamber
//  - Living Cathedral & Forged Metal visual aesthetic
//  - Authoritative live Hero Telemetry (HP, Sanity, Weapon, Souls)
//  - Handcrafted Forged-Metal Buttons (Resume, Settings, Deeds, Save & Quit, Abandon)
//  - Clean state transitions & caller preservation
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { FLOOR_CONFIG } from '../data/floors.js';
import { AudioManager, SoundManager } from '../audio/AudioManager.js';
import { SettingsUI, openSettings as openSettingsModal } from './SettingsUI.js';
import { AchievementsUI, openAchievements as openAchievementsModal } from './AchievementsUI.js';
import { InputManager } from '../core/InputManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { ButtonArtManager } from './ButtonArtManager.js?v=1.0';
import { DeveloperSanctumUI } from './DeveloperSanctumUI.js';
import { FullscreenHelper } from './FullscreenHelper.js';

let _pauseSlide = 0;
let _ambientTimer = 0;
let _confirmQuitTimer = 0;
let _abandonConfirmedOnce = false;
let _focusedBtnIndex = 0;

// Dynamic interactive hit zones populated each frame
const _zones = [];

export function pauseGame() {
  if (typeof window !== 'undefined') {
    if (window.CinematicSafety && (window.CinematicSafety.isReplay() || window.CinematicSafety.getActiveCinematicId())) {
      return;
    }
    if (window.CinematicReplayContext && window.CinematicReplayContext.isReplaying()) {
      return;
    }
    if (window.GorgarothCinematics && window.GorgarothCinematics.isActive && window.GorgarothCinematics.isActive()) {
      return;
    }
    if (window.WardenDefeatCinematic && window.WardenDefeatCinematic.isActive && window.WardenDefeatCinematic.isActive()) {
      return;
    }
  }
  if (GameState.CINEMATIC_ACTIVE || GameState.BOSS_INTRO_ACTIVE || GameState.STATE === GameStates.CINEMATIC || GameState.STATE === GameStates.BOSS_INTRO || GameState.STATE === GameStates.BOSS_DEFEAT_CINEMATIC || GameState.STATE === 'boss_defeat_cinematic') {
    return;
  }
  if (GameState.STATE === GameStates.PLAYING) {
    if (GameState.P && (GameState.P.dead || GameState.P.dying)) {
      return;
    }
    _pauseSlide = 0;
    _abandonConfirmedOnce = false;
    _confirmQuitTimer = 0;
    _focusedBtnIndex = 0;
    GameState.setState(GameStates.PAUSED);
    const sp = document.getElementById('ingame-speed-panel');
    if (sp) sp.style.display = 'none';
    SoundManager.snd('panel_open');
  }
}

export function resumeGame() {
  if (GameState.STATE === GameStates.PAUSED) {
    if (GameState.CINEMATIC_ACTIVE || (GameState.P && (GameState.P.dead || GameState.P.dying))) {
      console.warn('[PauseMenu] Cannot resume during death or cinematic transition');
      return;
    }
    if (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive && window.ShatteredMindCinematic.isActive()) {
      return;
    }
    _abandonConfirmedOnce = false;
    _confirmQuitTimer = 0;
    GameState.setState(GameStates.PLAYING);
    if (typeof document !== 'undefined') {
      const sp = document.getElementById('ingame-speed-panel');
      if (sp) sp.style.display = 'none';
    }
    SoundManager.snd('panel_close');
  }
}

export function quitToMainMenu() {
  _abandonConfirmedOnce = false;
  _confirmQuitTimer = 0;

  // If player is alive and in an active healthy run, save state before exiting (strictly non-developer runs)
  if (!GameState.IS_DEVELOPER_EXPEDITION && GameState.P && !GameState.P.dead && !GameState.P.dying && GameState.P.hp > 0 && GameState.P.san > 0) {
    SaveSystem.saveRun();
  }

  GameState.IS_DEVELOPER_EXPEDITION = false;
  if (GameState.DEV_MODS) GameState.DEV_MODS.enabled = false;

  GameState.setState(GameStates.TITLE);
  if (typeof document !== 'undefined') {
    const sp = document.getElementById('ingame-speed-panel');
    if (sp) sp.style.display = 'none';
  }
  AudioManager.updateMusicLayers(0);
  SoundManager.snd('menu_select');
}

export function openSettings() {
  _abandonConfirmedOnce = false;
  openSettingsModal(GameStates.PAUSED);
}

export function openAchievements() {
  _abandonConfirmedOnce = false;
  openAchievementsModal(GameStates.PAUSED);
}

export { SettingsUI, AchievementsUI };

/** Helper to draw custom chamfered fantasy console plate */
function drawChamferedPanel(ctx, x, y, w, h, chamfer, fillStyle, strokeStyle, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + chamfer, y);
  ctx.lineTo(x + w - chamfer, y);
  ctx.lineTo(x + w, y + chamfer);
  ctx.lineTo(x + w, y + h - chamfer);
  ctx.lineTo(x + w - chamfer, y + h);
  ctx.lineTo(x + chamfer, y + h);
  ctx.lineTo(x, y + h - chamfer);
  ctx.lineTo(x, y + chamfer);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/** Helper to draw ornamental brass corner brackets and rivets */
function drawCornerBrackets(ctx, x, y, w, h, len = 14, col = 'rgba(217, 119, 6, 0.85)') {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.6;
  // Top-left
  ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len); ctx.stroke();

  // Brass corner rivets
  ctx.fillStyle = '#fde68a';
  const rivets = [
    [x + 4, y + 4], [x + w - 4, y + 4],
    [x + 4, y + h - 4], [x + w - 4, y + h - 4]
  ];
  rivets.forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/** Helper to draw hanging chains */
function drawHangingChains(ctx, x1, x2, startY, endY) {
  ctx.save();
  const linkH = 8;
  const linkW = 5;
  [x1, x2].forEach(cx => {
    // Top anchor clevis
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, startY, 4, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Alternating oval chain links
    for (let y = startY + 4; y < endY; y += linkH) {
      ctx.strokeStyle = (Math.floor(y / linkH) % 2 === 0) ? '#94a3b8' : '#475569';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(cx - linkW / 2, y, linkW, linkH - 1);
    }

    // Lower mounting shackle
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, endY, 4.5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  });
  ctx.restore();
}

export const PauseMenu = {
  draw(ctx, dt = 0.016) {
    _ambientTimer += dt;
    _pauseSlide = Math.min(1.0, _pauseSlide + dt * 6.0);
    const eased = 1 - Math.pow(1 - _pauseSlide, 3);

    if (_confirmQuitTimer > 0) {
      _confirmQuitTimer -= dt;
      if (_confirmQuitTimer <= 0) {
        _abandonConfirmedOnce = false;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 1. ATMOSPHERIC DARKENING VIGNETTE (PRESERVES VISIBLE DUNGEON)
    // ─────────────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = eased;
    ctx.fillStyle = 'rgba(2, 4, 10, 0.78)';
    ctx.fillRect(0, 0, LW, LH);

    // Subtle tactical scanlines across screen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    for (let sy = 0; sy < LH; sy += 4) {
      ctx.fillRect(0, sy, LW, 1);
    }

    // Modal chassis dimensions
    const panW = Math.min(620, LW - 32);
    const panH = Math.min(510, LH - 32);
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 25);

    // Radial amber/violet furnace glow behind chassis
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.2);
    const bgGlow = ctx.createRadialGradient(panX + panW / 2, panY + 140, 20, panX + panW / 2, panY + 220, 380);
    bgGlow.addColorStop(0, `rgba(217, 119, 6, ${0.12 + pulse * 0.03})`);
    bgGlow.addColorStop(0.5, 'rgba(147, 51, 234, 0.06)');
    bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // ─────────────────────────────────────────────────────────────
    // 2. LAYERED OBSIDIAN & ANTIQUE BRONZE CHASSIS
    // ─────────────────────────────────────────────────────────────
    // Outer forged iron casing with chamfered profile
    drawChamferedPanel(ctx, panX, panY, panW, panH, 14, 'rgba(7, 11, 24, 0.97)', 'rgba(217, 119, 6, 0.85)', 1.8);

    // Inner etched bronze channel
    drawChamferedPanel(ctx, panX + 6, panY + 6, panW - 12, panH - 12, 10, 'rgba(10, 15, 28, 0.94)', 'rgba(201, 168, 76, 0.35)', 1);

    // Subtle Stone Texture Overlay (visibly violet masonry, restrained organic tone)
    const pat = ButtonArtManager.getStonePattern(ctx);
    if (pat) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = pat;
      drawChamferedPanel(ctx, panX + 6, panY + 6, panW - 12, panH - 12, 10);
      ctx.fill();
      ctx.restore();
    }

    // Corner filigree brackets & rivets
    drawCornerBrackets(ctx, panX + 8, panY + 8, panW - 16, panH - 16, 18, 'rgba(217, 119, 6, 0.9)');

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    // ─────────────────────────────────────────────────────────────
    // 3. SUSPENDED EXPEDITION TITLE PLAQUE
    // ─────────────────────────────────────────────────────────────
    const plaqueW = Math.min(380, panW - 48);
    const plaqueH = 54;
    const plaqueX = Math.round(panX + (panW - plaqueW) / 2);
    const plaqueY = panY + 16;

    // Hanging chains from top chassis frame
    drawHangingChains(ctx, plaqueX + 36, plaqueX + plaqueW - 36, panY + 6, plaqueY + 4);

    // Plaque background plate
    drawChamferedPanel(ctx, plaqueX, plaqueY, plaqueW, plaqueH, 8, 'rgba(12, 18, 36, 0.98)', 'rgba(217, 119, 6, 0.75)', 1.4);
    drawCornerBrackets(ctx, plaqueX + 3, plaqueY + 3, plaqueW - 6, plaqueH - 6, 10, 'rgba(245, 158, 11, 0.6)');

    // Chiseled 3D Metallic Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow
    ctx.fillStyle = '#02040a';
    ctx.font = 'bold 16px Cinzel, serif';
    ctx.fillText('◈ EXPEDITION SUSPENDED ◈', plaqueX + plaqueW / 2 + 1, plaqueY + 20);

    // Face text
    ctx.fillStyle = '#fde68a';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 8;
    ctx.fillText('◈ EXPEDITION SUSPENDED ◈', plaqueX + plaqueW / 2, plaqueY + 19);
    ctx.shadowBlur = 0;

    // Subtitle rubric
    const lv = GameState.LV || 1;
    const flCfg = FLOOR_CONFIG[lv] || { name: 'Cathedral of Deep Navy' };
    ctx.fillStyle = 'rgba(192, 132, 252, 0.9)';
    ctx.font = 'italic 10px "Crimson Text", serif';
    ctx.fillText(`FLOOR ${lv}: ${flCfg.name.toUpperCase()}  •  DESCENT HALTED`, plaqueX + plaqueW / 2, plaqueY + 38);

    // ─────────────────────────────────────────────────────────────
    // 4. AUTHORITATIVE LIVE TELEMETRY & STATUS PLINTH
    // ─────────────────────────────────────────────────────────────
    const telemY = plaqueY + plaqueH + 14;
    const telemW = panW - 36;
    const telemH = 92;
    const telemX = panX + 18;

    // Inset carved stone bay
    drawChamferedPanel(ctx, telemX, telemY, telemW, telemH, 6, 'rgba(12, 17, 32, 0.90)', 'rgba(71, 85, 105, 0.5)', 1);

    const P = GameState.P || { hp: 10, maxHp: 10, san: 100, maxSan: 100 };
    const curHp = Math.max(0, P.hp || 0);
    const maxHp = Math.max(1, P.maxHp || 10);
    const curSan = Math.max(0, Math.min(100, P.san !== undefined ? P.san : 100));
    const maxSan = P.maxSan || 100;

    // Col 1: Vitals (Health & Sanity Bars)
    const col1X = telemX + 18;
    const barW = Math.min(220, Math.round((telemW - 60) * 0.5));
    const barH = 14;

    // HP Bar
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`HEALTH  •  ${Math.round(curHp)} / ${maxHp}`, col1X, telemY + 14);

    const hpTrackY = telemY + 28;
    ctx.fillStyle = '#1e1014';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, col1X, hpTrackY, barW, barH, 3);
    ctx.fill(); ctx.stroke();

    const hpFrac = Math.max(0, Math.min(1, curHp / maxHp));
    if (hpFrac > 0) {
      const hpGrad = ctx.createLinearGradient(col1X, hpTrackY, col1X + barW * hpFrac, hpTrackY);
      hpGrad.addColorStop(0, '#991b1b');
      hpGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = hpGrad;
      roundRect(ctx, col1X + 1, hpTrackY + 1, (barW - 2) * hpFrac, barH - 2, 2);
      ctx.fill();
    }

    // Sanity Bar
    ctx.fillStyle = '#d8b4fe';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText(`SANITY  •  ${Math.round(curSan)}%`, col1X, telemY + 50);

    const sanTrackY = telemY + 64;
    ctx.fillStyle = '#171024';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, col1X, sanTrackY, barW, barH, 3);
    ctx.fill(); ctx.stroke();

    const sanFrac = Math.max(0, Math.min(1, curSan / maxSan));
    if (sanFrac > 0) {
      const sanGrad = ctx.createLinearGradient(col1X, sanTrackY, col1X + barW * sanFrac, sanTrackY);
      sanGrad.addColorStop(0, '#6b21a8');
      sanGrad.addColorStop(1, '#a855f7');
      ctx.fillStyle = sanGrad;
      roundRect(ctx, col1X + 1, sanTrackY + 1, (barW - 2) * sanFrac, barH - 2, 2);
      ctx.fill();
    }

    // Col 2: Armament & Harvest
    const col2X = col1X + barW + 28;
    const col2W = telemW - (col2X - telemX) - 18;

    // Active Weapon
    let activeWepName = 'Sword';
    let activeWepDmg = '3.5';
    let wepCol = '#94a3b8';
    if (GameState.weaponSlots && GameState.weaponSlots[GameState.activeWeaponSlot]) {
      const w = GameState.weaponSlots[GameState.activeWeaponSlot];
      activeWepName = w.name || w.id || 'Blade';
      activeWepDmg = (w.dmg || w.damage || 3.5).toFixed(1);
      wepCol = (w.rarity && w.rarity.col) || '#94a3b8';
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('ACTIVE ARMAMENT', col2X, telemY + 14);

    ctx.fillStyle = wepCol;
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillText(activeWepName, col2X, telemY + 28);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = '9px monospace';
    ctx.fillText(`POWER: ${activeWepDmg} DMG  •  SLOT ${GameState.activeWeaponSlot + 1}`, col2X, telemY + 44);

    // Abyss Souls
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('ABYSS HARVEST', col2X, telemY + 60);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11.5px Cinzel, serif';
    ctx.fillText(`◈ ${GameState.ABYSS_SOULS || 0} SOULS HARVESTED`, col2X, telemY + 73);

    // ─────────────────────────────────────────────────────────────
    // 5. HANDCRAFTED FORGED REGALIA COMMAND BUTTONS
    // ─────────────────────────────────────────────────────────────
    const btnStartY = telemY + telemH + 12;
    const btnW = panW - 48;
    const btnH = 32;
    const btnGap = 6;

    const buttonConfigs = [
      {
        id: 'resume',
        label: 'RESUME EXPEDITION',
        sub: 'Return to active combat  ·  [ ESC / ENTER ]',
        primary: true,
        isDanger: false,
        action: () => resumeGame()
      },
      {
        id: 'settings',
        label: 'CALIBRATION & SETTINGS',
        sub: 'Sound chambers, chronometric pace & visuals  ·  [ S ]',
        primary: false,
        isDanger: false,
        action: () => openSettings()
      },
      {
        id: 'achievements',
        label: 'MONUMENTS & WALL OF DEEDS',
        sub: 'Relic badges, apex eye & hero fates  ·  [ A ]',
        primary: false,
        isDanger: false,
        action: () => openAchievements()
      },
      {
        id: 'fullscreen',
        label: FullscreenHelper.isFullscreen() ? 'EXIT IMMERSIVE MODE (WINDOWED)' : 'ENTER IMMERSIVE MODE (FULLSCREEN)',
        sub: FullscreenHelper.isFullscreen() ? 'Restore browser toolbars & margins  ·  [ F ]' : 'Expand display to edge-to-edge screen  ·  [ F ]',
        primary: false,
        isDanger: false,
        action: () => {
          FullscreenHelper.toggle();
        }
      },
      {
        id: 'save_quit',
        label: 'SAVE & RETURN TO TITLE',
        sub: 'Safely suspend descent  ·  Resume from Sanctuary',
        primary: false,
        isDanger: false,
        action: () => quitToMainMenu()
      },
      ...( (GameState.IS_DEVELOPER_EXPEDITION || DeveloperSanctumUI.isAuthorized()) ? [{
        id: 'sanctum',
        label: 'RETURN TO DEVELOPER SANCTUM',
        sub: 'Reconfigure expedition parameters  ·  [ D ]',
        primary: false,
        isDanger: false,
        action: () => {
          DeveloperSanctumUI.openFromGameplay();
        }
      }] : [] ),
      {
        id: 'abandon',
        label: _abandonConfirmedOnce ? '⚠️ CONFIRM FORFEIT? CLICK AGAIN' : 'ABANDON EXPEDITION (FORFEIT DESCENT)',
        sub: _abandonConfirmedOnce ? 'WILL RETURN TO SANCTUARY  ·  DESCENT STATE CLEARED' : 'Surrender current descent  ·  [ Q ]',
        primary: false,
        isDanger: true,
        action: () => {
          if (!_abandonConfirmedOnce) {
            _abandonConfirmedOnce = true;
            _confirmQuitTimer = 4.0;
            SoundManager.snd('menu_hover');
          } else {
            SaveSystem.clearRun();
            GameState.IS_DEVELOPER_EXPEDITION = false;
            if (GameState.DEV_MODS) GameState.DEV_MODS.enabled = false;
            _abandonConfirmedOnce = false;
            _confirmQuitTimer = 0;
            GameState.setState(GameStates.TITLE);
            if (typeof document !== 'undefined') {
              const sp = document.getElementById('ingame-speed-panel');
              if (sp) sp.style.display = 'none';
            }
            AudioManager.updateMusicLayers(0);
            SoundManager.snd('menu_select');
          }
        }
      }
    ];

    buttonConfigs.forEach((b, idx) => {
      const by = btnStartY + idx * (btnH + btnGap);
      const isHovered = (mouseX >= panX + 24 && mouseX <= panX + 24 + btnW && mouseY >= by && mouseY <= by + btnH);
      const isPressed = isHovered && isMouseDown;
      const isDanger = b.isDanger;
      const isPrimary = b.primary;

      // 9-slice button rendering matching Living Cathedral
      const stateKey = ButtonArtManager.getStateKey(isPrimary, false, false, false, isHovered, isPressed, isDanger);
      const renderedFromImg = ButtonArtManager.drawButton(ctx, stateKey, panX + 24, by, btnW, btnH);

      if (!renderedFromImg) {
        // Procedural fallback matching Main Menu regalia buttons
        const btnGrad = ctx.createLinearGradient(panX + 24, by, panX + 24, by + btnH);
        if (isDanger) {
          btnGrad.addColorStop(0, _abandonConfirmedOnce ? '#450a0a' : (isHovered ? '#2d0606' : '#1a0505'));
          btnGrad.addColorStop(1, _abandonConfirmedOnce ? '#2a0505' : '#0d0202');
        } else if (isPrimary) {
          btnGrad.addColorStop(0, isHovered ? '#241406' : '#1a0e05');
          btnGrad.addColorStop(1, isHovered ? '#120a02' : '#0a0502');
        } else {
          btnGrad.addColorStop(0, isHovered ? '#161b2b' : '#0d111d');
          btnGrad.addColorStop(1, isHovered ? '#0a0d16' : '#06080e');
        }
        ctx.fillStyle = btnGrad;
        drawChamferedPanel(ctx, panX + 24, by, btnW, btnH, 5, btnGrad, isHovered ? '#fde68a' : (isDanger ? '#ef4444' : 'rgba(217, 119, 6, 0.6)'), isHovered ? 1.5 : 1);
      }

      // If danger button is armed, pulse border
      if (isDanger && _abandonConfirmedOnce) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8;
        drawChamferedPanel(ctx, panX + 24, by, btnW, btnH, 5, null, '#ef4444', 1.8);
      }

      // Button typography & layout
      const textX = panX + 44;
      const textY = by + btnH / 2 + (isPressed ? 1 : 0);

      // Icon / Bullet
      ctx.fillStyle = isDanger ? (_abandonConfirmedOnce ? '#f87171' : '#ef4444') : (isPrimary ? '#f59e0b' : '#d97706');
      ctx.font = '11px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const bullet = isDanger ? '☠' : (isPrimary ? '◈' : '✦');
      ctx.fillText(bullet, panX + 34, textY);

      // Primary Action Label
      ctx.fillStyle = isDanger ? (_abandonConfirmedOnce ? '#ffffff' : '#fca5a5') : (isHovered ? '#ffffff' : (isPrimary ? '#fde68a' : '#e2e8f0'));
      ctx.font = isPrimary ? 'bold 11.5px Cinzel, serif' : 'bold 10px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.fillText(b.label, panX + 48, textY);

      // Subtitle / Hotkey rubric
      ctx.fillStyle = isDanger ? 'rgba(252, 165, 165, 0.75)' : (isHovered ? 'rgba(253, 230, 138, 0.85)' : 'rgba(148, 163, 184, 0.65)');
      ctx.font = 'italic 9px "Crimson Text", serif';
      ctx.textAlign = 'right';
      ctx.fillText(b.sub, panX + 24 + btnW - 14, textY);

      _zones.push({
        id: b.id,
        x: panX + 24,
        y: by,
        w: btnW,
        h: btnH,
        action: b.action
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 6. BOTTOM NAVIGATION HINTS
    // ─────────────────────────────────────────────────────────────
    const botY = panY + panH - 22;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const isSanctumAvail = GameState.IS_DEVELOPER_EXPEDITION || DeveloperSanctumUI.isAuthorized();
    const rubricText = isSanctumAvail
      ? 'Hotkeys:  [ ESC / ENTER ] Resume   [ S ] Settings   [ A ] Deeds   [ D ] Sanctum   [ Q ] Forfeit'
      : 'Hotkeys:  [ ESC / ENTER ] Resume   [ S ] Settings   [ A ] Deeds   [ Q ] Forfeit';
    ctx.fillText(rubricText, panX + panW / 2, botY);

    ctx.restore();
  },

  handleClick(mx, my) {
    for (const z of _zones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (z.action) {
          z.action();
          return true;
        }
      }
    }

    // Click outside modal chassis resumes descent
    const panW = Math.min(620, LW - 32);
    const panH = Math.min(510, LH - 32);
    const panX = (LW - panW) / 2;
    const panY = (LH - panH) / 2;
    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      resumeGame();
      return true;
    }

    // Reset abandon confirmation if clicked inside empty chassis area
    if (_abandonConfirmedOnce) {
      _abandonConfirmedOnce = false;
      _confirmQuitTimer = 0;
    }

    return false;
  },

  handleKeyDown(key) {
    if (key === 'Escape' || key === 'Enter') {
      resumeGame();
      return true;
    }
    if (key === 's' || key === 'S') {
      openSettings();
      return true;
    }
    if (key === 'a' || key === 'A') {
      openAchievements();
      return true;
    }
    if (key === 'f' || key === 'F') {
      FullscreenHelper.toggle();
      return true;
    }
    if ((key === 'd' || key === 'D') && (GameState.IS_DEVELOPER_EXPEDITION || DeveloperSanctumUI.isAuthorized())) {
      DeveloperSanctumUI.openFromGameplay();
      return true;
    }
    if (key === 'q' || key === 'Q') {
      if (!_abandonConfirmedOnce) {
        _abandonConfirmedOnce = true;
        _confirmQuitTimer = 4.0;
        SoundManager.snd('menu_hover');
      } else {
        SaveSystem.clearRun();
        quitToMainMenu();
      }
      return true;
    }
    return false;
  }
};

PauseMenu._zones = _zones;

if (typeof window !== 'undefined') {
  window.PauseMenu = PauseMenu;
  window.pauseGame = pauseGame;
  window.resumeGame = resumeGame;
  window.quitToMainMenu = quitToMainMenu;
}
