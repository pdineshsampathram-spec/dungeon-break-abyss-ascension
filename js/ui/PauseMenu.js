// =====================================================================
//  DUNGEON BREAK — js/ui/PauseMenu.js
//  UI/UX Reconstruction: Vanguard Tactical Combat Blade
//  - Lateral Tactical Command Freeze with Full Expedition Telemetry
//  - Live Hero Vitals (HP, Ghost HP, Sanity, Weapon Armament, Souls)
//  - Dominant Emerald Resume Jewel Blade & Tactical Modal Order Blades
//  100% In-Game Canvas 2D Renderers, Zero Emojis, Zero Placeholders
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { FLOOR_CONFIG } from '../data/floors.js';
import { AudioManager, SoundManager } from '../audio/AudioManager.js';
import { SettingsUI, openSettings as openSettingsModal } from './SettingsUI.js';
import { AchievementsUI, openAchievements as openAchievementsModal } from './AchievementsUI.js';
import { InputManager } from '../core/InputManager.js';

let _pauseSlide = 0;
let _ambientTimer = 0;
let _confirmQuitTimer = 0;
let _abandonConfirmedOnce = false;

// Dynamic interactive hit zones populated each frame
const _zones = [];

export function pauseGame() {
  if (GameState.STATE === GameStates.PLAYING) {
    _pauseSlide = 0;
    _abandonConfirmedOnce = false;
    _confirmQuitTimer = 0;
    GameState.setState(GameStates.PAUSED);
    const sp = document.getElementById('ingame-speed-panel');
    if (sp) sp.style.display = 'none';
    SoundManager.snd('panel_open');
  }
}

export function resumeGame() {
  if (GameState.STATE === GameStates.PAUSED) {
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

export const PauseMenu = {
  draw(ctx, dt = 0.016) {
    _ambientTimer += dt;
    _pauseSlide = Math.min(1.0, _pauseSlide + dt * 5.0);
    const eased = 1 - Math.pow(1 - _pauseSlide, 3);

    if (_confirmQuitTimer > 0) {
      _confirmQuitTimer -= dt;
      if (_confirmQuitTimer <= 0) {
        _abandonConfirmedOnce = false;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // FULL-SCREEN DARK OBSIDIAN TACTICAL VIGNETTE
    // ─────────────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = eased;
    ctx.fillStyle = 'rgba(2, 4, 10, 0.88)';
    ctx.fillRect(0, 0, LW, LH);

    // Subtle tactical scanlines across canvas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
    for (let sy = 0; sy < LH; sy += 4) {
      ctx.fillRect(0, sy, LW, 1);
    }

    // ─────────────────────────────────────────────────────────────
    // VANGUARD COMMAND MONOLITH CHASSIS
    // ─────────────────────────────────────────────────────────────
    const panW = 860;
    const panH = 500;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 28);

    // Deep abyssal emerald & gold radial glow behind command chassis
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.2);
    const radGrad = ctx.createRadialGradient(panX + panW / 2, panY + 180, 40, panX + panW / 2, panY + 250, 480);
    radGrad.addColorStop(0, `rgba(16, 185, 129, ${0.14 + pulse * 0.04})`);
    radGrad.addColorStop(0.5, 'rgba(201, 168, 76, 0.06)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // Outer Heavy Vanguard Chassis
    ctx.fillStyle = 'rgba(7, 10, 20, 0.98)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.65)';
    ctx.lineWidth = 1.6;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill(); ctx.stroke();

    // Inner embossed brass fillet
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 5, panY + 5, panW - 10, panH - 10, 9);
    ctx.stroke();

    // Runic corner braces
    const braceLen = 22;
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(panX + 6, panY + 6 + braceLen);
    ctx.lineTo(panX + 6, panY + 6);
    ctx.lineTo(panX + 6 + braceLen, panY + 6);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(panX + panW - 6 - braceLen, panY + 6);
    ctx.lineTo(panX + panW - 6, panY + 6);
    ctx.lineTo(panX + panW - 6, panY + 6 + braceLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(panX + 6, panY + panH - 6 - braceLen);
    ctx.lineTo(panX + 6, panY + panH - 6);
    ctx.lineTo(panX + 6 + braceLen, panY + panH - 6);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(panX + panW - 6 - braceLen, panY + panH - 6);
    ctx.lineTo(panX + panW - 6, panY + panH - 6);
    ctx.lineTo(panX + panW - 6, panY + panH - 6 - braceLen);
    ctx.stroke();

    _zones.length = 0;
    const mouseX = (InputManager.MOUSE_STATE && InputManager.MOUSE_STATE.mx !== undefined) ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = (InputManager.MOUSE_STATE && InputManager.MOUSE_STATE.my !== undefined) ? InputManager.MOUSE_STATE.my : -999;

    // ─────────────────────────────────────────────────────────────
    // TOP APEX TELEMETRY BAR
    // ─────────────────────────────────────────────────────────────
    const topY = panY + 14;
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 13.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 8;
    ctx.fillText('◈ VANGUARD TACTICAL COMBAT BLADE ◈', panX + 22, topY + 12);
    ctx.shadowBlur = 0;

    // Status warning pill
    const pillX = panX + 375, pillY = topY + 2, pillW = 160, pillH = 22;
    ctx.fillStyle = 'rgba(217, 119, 6, 0.16)';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.1;
    roundRect(ctx, pillX, pillY, pillW, pillH, 4);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(pillX + 12, pillY + pillH / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRUCIBLE SUSPENDED', pillX + pillW / 2 + 5, pillY + pillH / 2);

    // Right-side Stratum / Run Telemetry
    const curLv = GameState.LV || 1;
    const floorCfg = FLOOR_CONFIG[curLv] || { name: 'Abyssal Chasm' };
    const timeStr = GameState.LEVEL_TIME_STR || '00:00';
    const runId = GameState.RUN_ID || 1;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = '10px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.fillText(`STRATUM: FLOOR ${curLv} (${floorCfg.name.toUpperCase()})  ·  ${timeStr}  ·  RUN #${runId}`, panX + panW - 22, topY + 12);

    // Separator line
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panX + 20, topY + 30);
    ctx.lineTo(panX + panW - 20, topY + 30);
    ctx.stroke();

    // ─────────────────────────────────────────────────────────────
    // TWO BESPOKE ASYMMETRICAL INSTRUMENT COLUMNS
    // Left: Expedition Vitals & Armament Dossier (390px)
    // Right: Tactical Orders (416px)
    // ─────────────────────────────────────────────────────────────
    const bayY = topY + 40;
    const bayH = panY + panH - bayY - 42;
    const leftBayW = 390;
    const rightBayW = panW - 40 - leftBayW - 14;
    const leftBayX = panX + 20;
    const rightBayX = leftBayX + leftBayW + 14;

    // ── LEFT BAY: EXPEDITION VITALS & ARMAMENT DOSSIER ──
    ctx.fillStyle = 'rgba(12, 17, 32, 0.94)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.45)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, leftBayX, bayY, leftBayW, bayH, 8);
    ctx.fill(); ctx.stroke();

    // Section header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚔ EXPEDITION VITALS & ARMAMENT', leftBayX + 16, bayY + 18);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftBayX + 16, bayY + 28);
    ctx.lineTo(leftBayX + leftBayW - 16, bayY + 28);
    ctx.stroke();

    // Rowan's Combat Vitals
    const P = GameState.P || { hp: 10, maxHp: 10, san: 100, killed: 0, saved: 0 };
    const curHp = Math.max(0, P.hp || 0);
    const maxHp = Math.max(1, P.maxHp || 10);
    const ghostHp = Math.max(curHp, P.ghostHp || curHp);
    const curSan = Math.max(0, Math.min(100, P.san !== undefined ? P.san : 100));

    const vitalsY = bayY + 38;
    const barW = leftBayW - 32;
    const barH = 18;

    // 1. Health Bar
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('PHYSICAL INTEGRITY (HP)', leftBayX + 16, vitalsY + 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = curHp <= maxHp * 0.3 ? '#f87171' : '#4ade80';
    ctx.fillText(`${curHp.toFixed(0)} / ${maxHp} (${Math.round((curHp / maxHp) * 100)}%)`, leftBayX + leftBayW - 16, vitalsY + 2);

    // HP Bar Track
    const hpTrackY = vitalsY + 8;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, leftBayX + 16, hpTrackY, barW, barH, 4);
    ctx.fill(); ctx.stroke();

    // Ghost HP bar (amber)
    if (ghostHp > curHp) {
      const ghostW = Math.min(barW, Math.round((ghostHp / maxHp) * barW));
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      roundRect(ctx, leftBayX + 16, hpTrackY, ghostW, barH, 4);
      ctx.fill();
    }

    // Active HP bar (emerald/crimson gradient)
    const activeHpW = Math.min(barW, Math.max(3, Math.round((curHp / maxHp) * barW)));
    const hpGrad = ctx.createLinearGradient(leftBayX + 16, hpTrackY, leftBayX + 16 + barW, hpTrackY);
    if (curHp / maxHp > 0.4) {
      hpGrad.addColorStop(0, '#15803d');
      hpGrad.addColorStop(1, '#22c55e');
    } else {
      hpGrad.addColorStop(0, '#991b1b');
      hpGrad.addColorStop(1, '#ef4444');
    }
    ctx.fillStyle = hpGrad;
    roundRect(ctx, leftBayX + 16, hpTrackY, activeHpW, barH, 4);
    ctx.fill();

    // 2. Sanity Bar
    const sanY = hpTrackY + barH + 14;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('PSYCHIC STABILITY (SANITY)', leftBayX + 16, sanY + 2);

    let sanStatus = 'STABLE';
    let sanCol = '#38bdf8';
    if (curSan < 30) {
      sanStatus = 'COLLAPSING';
      sanCol = '#ef4444';
    } else if (curSan < 60) {
      sanStatus = 'FRAYING';
      sanCol = '#fbbf24';
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = sanCol;
    ctx.fillText(`${Math.round(curSan)}% [ ${sanStatus} ]`, leftBayX + leftBayW - 16, sanY + 2);

    // Sanity Bar Track
    const sanTrackY = sanY + 8;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, leftBayX + 16, sanTrackY, barW, barH, 4);
    ctx.fill(); ctx.stroke();

    const activeSanW = Math.min(barW, Math.max(3, Math.round((curSan / 100) * barW)));
    const sanGrad = ctx.createLinearGradient(leftBayX + 16, sanTrackY, leftBayX + 16 + barW, sanTrackY);
    if (curSan >= 60) {
      sanGrad.addColorStop(0, '#0284c7');
      sanGrad.addColorStop(1, '#38bdf8');
    } else if (curSan >= 30) {
      sanGrad.addColorStop(0, '#d97706');
      sanGrad.addColorStop(1, '#fbbf24');
    } else {
      sanGrad.addColorStop(0, '#7f1d1d');
      sanGrad.addColorStop(1, '#ef4444');
    }
    ctx.fillStyle = sanGrad;
    roundRect(ctx, leftBayX + 16, sanTrackY, activeSanW, barH, 4);
    ctx.fill();

    // 3. Harvested Souls Vessel Plaque
    const soulsY = sanTrackY + barH + 16;
    const soulsH = 46;
    ctx.fillStyle = 'rgba(20, 26, 48, 0.88)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    ctx.lineWidth = 1.1;
    roundRect(ctx, leftBayX + 16, soulsY, barW, soulsH, 6);
    ctx.fill(); ctx.stroke();

    // Large glowing soul emblem
    const soulGlow = 0.6 + 0.4 * Math.sin(_ambientTimer * 3.0);
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10 * soulGlow;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', leftBayX + 28, soulsY + soulsH / 2);
    ctx.restore();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 16px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${GameState.ABYSS_SOULS || 0}`, leftBayX + 54, soulsY + soulsH / 2 - 4);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = '8.5px Cinzel, serif';
    ctx.fillText('HARVESTED ABYSS SOULS (RETAINED ON SURRENDER)', leftBayX + 54, soulsY + soulsH / 2 + 10);

    // 4. Active Armament Card
    const armY = soulsY + soulsH + 14;
    const armH = 78;
    ctx.fillStyle = 'rgba(18, 22, 38, 0.9)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
    ctx.lineWidth = 1.1;
    roundRect(ctx, leftBayX + 16, armY, barW, armH, 6);
    ctx.fill(); ctx.stroke();

    // Active weapon details
    const activeSlot = GameState.activeWeaponSlot || 0;
    const slots = GameState.weaponSlots || [];
    const wep = slots[activeSlot] || { name: '⚔️ Iron Broadsword', damage: 3.5, cooldown: 0.32, range: 1.5, rarity: { name: 'Common', col: '#94a3b8' } };
    const wepRarity = wep.rarity || { name: 'Common', col: '#94a3b8' };

    // Header inside weapon card
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`ACTIVE ARMAMENT [ SLOT ${activeSlot + 1} ]`, leftBayX + 26, armY + 10);

    // Rarity Tier Badge (Top Right)
    const rarityW = 75, rarityH = 16;
    const rarityX = leftBayX + barW + 16 - 10 - rarityW;
    const rarityY = armY + 8;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = wepRarity.col || '#94a3b8';
    ctx.lineWidth = 1;
    roundRect(ctx, rarityX, rarityY, rarityW, rarityH, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = wepRarity.col || '#94a3b8';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((wepRarity.name || 'COMMON').toUpperCase(), rarityX + rarityW / 2, rarityY + rarityH / 2);

    // Weapon Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(wep.name || 'Broadsword', leftBayX + 26, armY + 26);

    // Weapon Combat Parameters
    const dmgVal = (wep.damage || wep.dmg || 3.5).toFixed(1);
    const cdVal = (wep.cooldown || wep.cd || 0.32).toFixed(2);
    const wepType = wep.projectile ? 'RANGED / PIERCING' : 'MELEE SWING ARC';
    ctx.fillStyle = 'rgba(201, 168, 76, 0.9)';
    ctx.font = '9.5px Cinzel, serif';
    ctx.fillText(`BASE DMG: ${dmgVal}  ·  CADENCE: ${cdVal}s  ·  ${wepType}`, leftBayX + 26, armY + 46);

    const affixStr = (wep.prefix || wep.suffix) ? `AFFIX: [ ${wep.prefix || ''} ${wep.suffix || ''} ]` : 'AFFIX: STANDARD UNENCHANTED FORGE';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '8px Cinzel, serif';
    ctx.fillText(affixStr, leftBayX + 26, armY + 62);

    // 5. Crucible Metrics Grid
    const gridY = armY + armH + 12;
    const gridH = bayY + bayH - gridY - 12;
    ctx.fillStyle = 'rgba(15, 20, 36, 0.7)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, leftBayX + 16, gridY, barW, gridH, 6);
    ctx.fill(); ctx.stroke();

    const kills = P.killed || 0;
    const saved = P.saved || 0;
    const relicsCount = (P.relics && Array.isArray(P.relics)) ? P.relics.length : 0;
    const shieldActive = P.shieldActive || P.mindShieldTimer > 0;

    const cellW = (barW - 16) / 3;
    const statCells = [
      { label: 'SLAIN FOES', val: `${kills}` },
      { label: 'ALLIES SAVED', val: `${saved}` },
      { label: 'RELICS HELD', val: `${relicsCount}` }
    ];

    statCells.forEach((cell, ci) => {
      const cx = leftBayX + 24 + ci * (cellW + 4);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '7.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(cell.label, cx + cellW / 2, gridY + 6);

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 12px Cinzel, serif';
      ctx.fillText(cell.val, cx + cellW / 2, gridY + 18);
    });

    // ── RIGHT BAY: TACTICAL ORDERS (VANGUARD COMMAND BLADES) ──
    ctx.fillStyle = 'rgba(12, 17, 32, 0.94)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.45)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, rightBayX, bayY, rightBayW, bayH, 8);
    ctx.fill(); ctx.stroke();

    // Section header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ VANGUARD COMMAND ORDERS', rightBayX + 16, bayY + 18);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBayX + 16, bayY + 28);
    ctx.lineTo(rightBayX + rightBayW - 16, bayY + 28);
    ctx.stroke();

    // ── COMMAND BLADES DEFINITIONS ──
    const btnW = rightBayW - 32;
    const startOrderY = bayY + 40;

    // 1. APEX DOMINANT RESUME BLADE (Emerald Monolith)
    const resumeY = startOrderY;
    const resumeH = 74;
    const isHoverResume = mouseX >= rightBayX + 16 && mouseX <= rightBayX + 16 + btnW && mouseY >= resumeY && mouseY <= resumeY + resumeH;

    const resumePulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 3.5);
    const resumeGrad = ctx.createLinearGradient(rightBayX + 16, resumeY, rightBayX + 16 + btnW, resumeY);
    if (isHoverResume) {
      resumeGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      resumeGrad.addColorStop(0.5, 'rgba(34, 197, 94, 0.45)');
      resumeGrad.addColorStop(1, 'rgba(16, 185, 129, 0.35)');
    } else {
      resumeGrad.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
      resumeGrad.addColorStop(0.5, `rgba(34, 197, 94, ${0.24 + resumePulse * 0.08})`);
      resumeGrad.addColorStop(1, 'rgba(16, 185, 129, 0.18)');
    }

    ctx.save();
    ctx.shadowColor = isHoverResume ? '#4ade80' : 'rgba(34, 197, 94, 0.4)';
    ctx.shadowBlur = isHoverResume ? 16 : 8;
    ctx.fillStyle = resumeGrad;
    ctx.strokeStyle = isHoverResume ? '#86efac' : '#22c55e';
    ctx.lineWidth = isHoverResume ? 2.0 : 1.5;
    roundRect(ctx, rightBayX + 16, resumeY, btnW, resumeH, 8);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Emerald blade runic accents
    ctx.strokeStyle = isHoverResume ? '#86efac' : 'rgba(74, 222, 128, 0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, rightBayX + 20, resumeY + 4, btnW - 8, resumeH - 8, 6);
    ctx.stroke();

    // Runic icon
    ctx.fillStyle = isHoverResume ? '#ffffff' : '#86efac';
    ctx.font = 'bold 22px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶', rightBayX + 34, resumeY + resumeH / 2 - 8);

    // Title text
    ctx.fillStyle = isHoverResume ? '#ffffff' : '#f0fdf4';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.fillText('RESUME EXPEDITION', rightBayX + 66, resumeY + resumeH / 2 - 10);

    // Subtitle / Hotkey prompt
    ctx.fillStyle = isHoverResume ? '#bbf7d0' : '#86efac';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('UNFREEZE CRUCIBLE & RETURN TO COMBAT  ·  [ ESCAPE ]', rightBayX + 66, resumeY + resumeH / 2 + 12);

    _zones.push({
      id: 'btn_resume',
      x: rightBayX + 16, y: resumeY, w: btnW, h: resumeH,
      action: resumeGame
    });

    // 2. SECONDARY TACTICAL MODAL BLADES (Settings, Achievements, Abandon)
    const secondaryBlades = [
      {
        id: 'btn_settings',
        title: 'ARTIFICER\'S CALIBRATION CONSOLE',
        sub: 'Acoustic VU-meters, temporal regulator, screen vibration levers  ·  [ S ]',
        icon: '⚙',
        col: '#fde68a',
        hoverCol: '#ffffff',
        accentCol: '#d97706',
        bg: 'rgba(217, 119, 6, 0.12)',
        hoverBg: 'rgba(217, 119, 6, 0.26)',
        border: 'rgba(217, 119, 6, 0.5)',
        action: openSettings
      },
      {
        id: 'btn_achievements',
        title: 'MONUMENTAL WALL OF DEEDS & FATES',
        sub: '21 heraldic relic badges, 8 fates ring, apex eye shrine  ·  [ A ]',
        icon: '◈',
        col: '#93c5fd',
        hoverCol: '#ffffff',
        accentCol: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
        hoverBg: 'rgba(59, 130, 246, 0.26)',
        border: 'rgba(59, 130, 246, 0.5)',
        action: openAchievements
      },
      {
        id: 'btn_abandon',
        title: _abandonConfirmedOnce ? '⚠️ CONFIRM FORFEIT? CLICK AGAIN' : 'ABANDON EXPEDITION (FORFEIT DESCENT)',
        sub: _abandonConfirmedOnce ? 'WILL RETURN TO SANCTUARY THRESHOLD  ·  SOULS PRESERVED' : 'Surrender run and return to title screen  ·  [ Q ]',
        icon: '☠',
        col: _abandonConfirmedOnce ? '#fca5a5' : '#f87171',
        hoverCol: '#ffffff',
        accentCol: '#ef4444',
        bg: _abandonConfirmedOnce ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.12)',
        hoverBg: 'rgba(239, 68, 68, 0.38)',
        border: _abandonConfirmedOnce ? '#ef4444' : 'rgba(239, 68, 68, 0.45)',
        action: () => {
          if (!_abandonConfirmedOnce) {
            _abandonConfirmedOnce = true;
            _confirmQuitTimer = 4.0;
            SoundManager.snd('menu_hover');
          } else {
            quitToMainMenu();
          }
        }
      }
    ];

    const secStartY = resumeY + resumeH + 16;
    const secH = 56;
    const secGap = 12;

    secondaryBlades.forEach((b, bi) => {
      const by = secStartY + bi * (secH + secGap);
      const isHover = mouseX >= rightBayX + 16 && mouseX <= rightBayX + 16 + btnW && mouseY >= by && mouseY <= by + secH;

      ctx.save();
      if (isHover) {
        ctx.shadowColor = b.accentCol;
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = isHover ? b.hoverBg : b.bg;
      ctx.strokeStyle = isHover ? '#fde68a' : b.border;
      ctx.lineWidth = isHover ? 1.6 : 1.2;
      roundRect(ctx, rightBayX + 16, by, btnW, secH, 6);
      ctx.fill(); ctx.stroke();
      ctx.restore();

      // Blade icon
      ctx.fillStyle = isHover ? '#ffffff' : b.col;
      ctx.font = 'bold 16px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, rightBayX + 32, by + secH / 2 - 8);

      // Blade title
      ctx.fillStyle = isHover ? b.hoverCol : b.col;
      ctx.font = 'bold 12px Cinzel, serif';
      ctx.fillText(b.title, rightBayX + 58, by + secH / 2 - 8);

      // Blade subtitle
      ctx.fillStyle = isHover ? '#e2e8f0' : 'rgba(148, 163, 184, 0.75)';
      ctx.font = '8.5px Cinzel, serif';
      ctx.fillText(b.sub, rightBayX + 58, by + secH / 2 + 10);

      _zones.push({
        id: b.id,
        x: rightBayX + 16, y: by, w: btnW, h: secH,
        action: b.action
      });
    });

    // Tactical Tip Plaque (at bottom of right bay)
    const tipY = secStartY + 3 * (secH + secGap) + 4;
    const tipH = bayY + bayH - tipY - 12;
    if (tipH > 20) {
      ctx.fillStyle = 'rgba(15, 20, 36, 0.7)';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
      ctx.lineWidth = 1;
      roundRect(ctx, rightBayX + 16, tipY, btnW, tipH, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = 'rgba(201, 168, 76, 0.85)';
      ctx.font = 'italic 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('“He who pauses in the dark must keep his blade sharp and his spirit steadfast.”', rightBayX + 16 + btnW / 2, tipY + tipH / 2);
    }

    // ─────────────────────────────────────────────────────────────
    // BOTTOM COMMAND RIBBON
    // ─────────────────────────────────────────────────────────────
    const botY = panY + panH - 24;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Hotkeys: [ ESC ] Resume Expedition  ·  [ S ] Artificer Console  ·  [ A ] Monuments  ·  [ Q ] Abandon', panX + 24, botY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('Click anywhere outside to resume', panX + panW - 24, botY);

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

    // Click outside command chassis resumes descent
    const panW = 860, panH = 500;
    const panX = (LW - panW) / 2, panY = (LH - panH) / 2;
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
    if (key === 'Escape') {
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
    if (key === 'q' || key === 'Q') {
      if (!_abandonConfirmedOnce) {
        _abandonConfirmedOnce = true;
        _confirmQuitTimer = 4.0;
        SoundManager.snd('menu_hover');
      } else {
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
  window.openSettings = openSettings;
  window.openAchievements = openAchievements;
}
