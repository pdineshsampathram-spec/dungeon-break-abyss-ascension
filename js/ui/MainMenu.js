// =====================================================================
//  DUNGEON BREAK — js/ui/MainMenu.js
//  Live Cinematic Main Menu, Cathedral Atmosphere, and Navigation
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { AudioManager } from '../audio/AudioManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { FloorManager } from '../world/FloorManager.js';
import { CinematicDirector } from '../cinematics/CinematicDirector.js';

let _titleBtns = [];
let _menuAmbientTimer = 10.0;
let _menuAmbientEvent = 'none';
let _menuAmbientEventTimer = 0;
let _TITLE_ANIM_T = 0;

export function startGame() {
  AudioManager.init();
  GameState.resetPlayer();
  GameState.LV = 1;
  FloorManager.loadLevel(1);
  CinematicDirector.startIntroSequence(1);
}

export function openTrainingDungeon() {
  AudioManager.init();
  GameState.setState('training');
}

export const MainMenu = {
  draw(ctx, dt = 0.016) {
    _titleBtns = [];

    // Ambient Director Timer
    _menuAmbientTimer -= dt;
    if (_menuAmbientTimer <= 0) {
      _menuAmbientTimer = 8.0 + Math.random() * 7.0;
      const events = ['torch_flare', 'dust_fall', 'portal_pulse', 'shadow_pass', 'chain_sway'];
      _menuAmbientEvent = events[Math.floor(Math.random() * events.length)];
      _menuAmbientEventTimer = 2.5;
    }
    if (_menuAmbientEventTimer > 0) _menuAmbientEventTimer -= dt;

    const F = GameState.F || 0;

    // Camera breathing and subtle parallax
    const camZoom = 1.0 + Math.sin(F * 0.015) * 0.015;
    const camX = Math.sin(F * 0.012) * 5;
    const camY = Math.cos(F * 0.014) * 3;

    ctx.save();
    ctx.translate(LW / 2 + camX, LH / 2 + camY);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-LW / 2, -LH / 2);

    // 1. Deep Cathedral Architecture (Gothic stone arches)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, LH);
    bgGrad.addColorStop(0, '#060712');
    bgGrad.addColorStop(0.5, '#0a0d1e');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-40, -40, LW + 80, LH + 80);

    // Distant corridor perspective lines
    ctx.strokeStyle = 'rgba(25,35,65,0.4)';
    ctx.lineWidth = 1.5;
    const vpX = 620, vpY = 240;
    for (let a = -1.2; a <= 1.2; a += 0.4) {
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(vpX + Math.sin(a) * 600, vpY + Math.cos(a) * 500);
      ctx.stroke();
    }

    // Distant Cosmic Abyss Portal
    const portPulse = Math.sin(F * 0.04) * 0.15 + 0.85;
    const portExtra = (_menuAmbientEvent === 'portal_pulse' && _menuAmbientEventTimer > 0) ? Math.sin(_menuAmbientEventTimer * Math.PI) * 15 : 0;
    const portR = 48 * portPulse + portExtra;
    const portX = 640, portY = 230;

    const portGlow = ctx.createRadialGradient(portX, portY, 5, portX, portY, portR * 2.2);
    portGlow.addColorStop(0, 'rgba(56,189,248,0.7)');
    portGlow.addColorStop(0.3, 'rgba(168,85,247,0.4)');
    portGlow.addColorStop(0.7, 'rgba(14,20,50,0.2)');
    portGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = portGlow;
    ctx.beginPath(); ctx.arc(portX, portY, portR * 2.2, 0, Math.PI * 2); ctx.fill();

    // Rotating Portal Rings
    ctx.save();
    ctx.translate(portX, portY);
    ctx.rotate(F * 0.02);
    ctx.strokeStyle = 'rgba(56,189,248,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, portR, 0, 4.5); ctx.stroke();
    ctx.rotate(-F * 0.035);
    ctx.strokeStyle = 'rgba(192,132,252,0.65)';
    ctx.beginPath(); ctx.arc(0, 0, portR * 0.7, 0, 4.0); ctx.stroke();
    ctx.restore();

    // Distant shadow creature passing
    if (_menuAmbientEvent === 'shadow_pass' && _menuAmbientEventTimer > 0) {
      const st = 1 - (_menuAmbientEventTimer / 2.5);
      const sx = 520 + st * 240;
      ctx.fillStyle = 'rgba(2,3,8,0.65)';
      ctx.beginPath();
      ctx.ellipse(sx, vpY + 20, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stone Gothic Pillars
    const pillars = [
      { x: 380, w: 32 }, { x: 500, w: 38 }, { x: 780, w: 42 }, { x: 890, w: 50 }
    ];
    pillars.forEach(p => {
      const pilG = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
      pilG.addColorStop(0, '#111526');
      pilG.addColorStop(0.3, '#1e2640');
      pilG.addColorStop(0.8, '#141a2e');
      pilG.addColorStop(1, '#090c17');
      ctx.fillStyle = pilG;
      ctx.fillRect(p.x, 0, p.w, LH);
      ctx.strokeStyle = 'rgba(201,168,76,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x + 2, 0); ctx.lineTo(p.x + 2, LH); ctx.stroke();
    });

    // Hanging Swaying Chains
    const chains = [
      { x: 440, y: 0, len: 140, phase: 0 },
      { x: 570, y: 0, len: 180, phase: 1.2 },
      { x: 740, y: 0, len: 160, phase: 2.1 }
    ];
    chains.forEach(ch => {
      const sway = Math.sin(F * 0.025 + ch.phase) * 6;
      ctx.strokeStyle = 'rgba(50,55,75,0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ch.x, ch.y);
      ctx.quadraticCurveTo(ch.x + sway * 0.5, ch.y + ch.len * 0.5, ch.x + sway, ch.y + ch.len);
      ctx.stroke();
    });

    // Wall Torches with dynamic flame and embers
    const torches = [
      { x: 400, y: 280, phase: 0 },
      { x: 520, y: 260, phase: 1.5 },
      { x: 790, y: 270, phase: 2.8 }
    ];
    torches.forEach(tc => {
      const flare = (_menuAmbientEvent === 'torch_flare' && _menuAmbientEventTimer > 0) ? Math.sin(_menuAmbientEventTimer * Math.PI) * 0.5 : 0;
      const fl = Math.sin(F * 0.2 + tc.phase) * 0.15 + 0.85 + flare;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(tc.x - 3, tc.y, 6, 12);
      const tg = ctx.createRadialGradient(tc.x, tc.y - 4, 2, tc.x, tc.y - 4, 45 * fl);
      tg.addColorStop(0, 'rgba(253,230,138,0.75)');
      tg.addColorStop(0.4, 'rgba(249,115,22,0.3)');
      tg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.arc(tc.x, tc.y - 4, 45 * fl, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(tc.x, tc.y - 6, 3.5 * fl, 6.5 * fl, 0, 0, Math.PI * 2); ctx.fill();
    });

    // Drifting Ash and Dust Particles
    for (let i = 0; i < 28; i++) {
      const px = ((i * 73 + F * 0.35) % (LW + 40)) - 20;
      const py = (LH - ((i * 47 + F * 0.55) % (LH + 40)));
      const pAlpha = (Math.sin(F * 0.05 + i) * 0.3 + 0.7) * 0.4;
      ctx.fillStyle = i % 2 === 0 ? `rgba(253,230,138,${pAlpha})` : `rgba(192,132,252,${pAlpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.2 + (i % 3) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rolling Floor Fog
    const fogG = ctx.createLinearGradient(0, LH - 130, 0, LH);
    fogG.addColorStop(0, 'rgba(5,8,20,0)');
    fogG.addColorStop(0.6, 'rgba(12,18,36,0.75)');
    fogG.addColorStop(1, 'rgba(6,9,18,0.95)');
    ctx.fillStyle = fogG;
    ctx.fillRect(0, LH - 130, LW, 130);

    // Crumbled flagstone steps
    ctx.fillStyle = '#0f1422';
    ctx.fillRect(340, LH - 60, LW - 340, 60);
    ctx.fillStyle = '#1e263d';
    ctx.fillRect(340, LH - 60, LW - 340, 3);

    // 2. Foreground ROWAN (Living detailed 2D Hero)
    const rowanX = 645;
    const rowanY = LH - 110;
    const breath = Math.sin(F * 0.04) * 2;
    const cloakSwing = Math.sin(F * 0.035) * 3;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(rowanX, rowanY + 22, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cloak
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(rowanX - 16, rowanY - 24 + breath);
    ctx.quadraticCurveTo(rowanX - 30 + cloakSwing, rowanY + 4, rowanX - 22 + cloakSwing, rowanY + 22);
    ctx.lineTo(rowanX + 18, rowanY + 22);
    ctx.quadraticCurveTo(rowanX + 24 - cloakSwing, rowanY + 4, rowanX + 16, rowanY - 24 + breath);
    ctx.closePath();
    ctx.fill();

    // Greaves
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rowanX - 11, rowanY + 4, 8, 16);
    ctx.fillRect(rowanX + 3, rowanY + 4, 8, 16);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rowanX - 13, rowanY + 16, 10, 6);
    ctx.fillRect(rowanX + 3, rowanY + 16, 10, 6);

    // Chestplate & Tunic
    ctx.fillStyle = '#334155';
    ctx.fillRect(rowanX - 14, rowanY - 18 + breath, 28, 24);
    ctx.fillStyle = '#475569';
    ctx.fillRect(rowanX - 11, rowanY - 16 + breath, 22, 10);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(rowanX - 14, rowanY + 2 + breath, 28, 3);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(rowanX - 3, rowanY + 1 + breath, 6, 5);

    // Pauldrons
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(rowanX - 15, rowanY - 16 + breath, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rowanX + 15, rowanY - 16 + breath, 8, 0, Math.PI * 2); ctx.fill();

    // Head / Sallet Helmet
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(rowanX, rowanY - 32 + breath, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillRect(rowanX - 10, rowanY - 30 + breath, 20, 6);
    const visorPulse = Math.sin(F * 0.08) * 0.2 + 0.8;
    ctx.save();
    ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10 * visorPulse;
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(rowanX - 7, rowanY - 32 + breath, 14, 3);
    ctx.restore();

    // Sword resting point-down
    const wX = rowanX + 22, wY = rowanY - 14 + breath;
    ctx.save();
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(wX, wY - 18); ctx.lineTo(wX, wY + 24); ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(wX - 8, wY - 16, 16, 3.5);
    ctx.beginPath(); ctx.arc(wX, wY - 20, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(wX, wY - 12); ctx.lineTo(wX, wY + 18); ctx.stroke();
    ctx.restore();

    ctx.restore(); // Restore camera breathing

    // 3. LEFT-ALIGNED MAIN MENU UI
    const leftX = 54;

    // Title: DUNGEON BREAK
    const titleGlow = Math.sin(F * 0.06) * 8 + 24;
    ctx.save();
    ctx.shadowColor = '#c9a84c'; ctx.shadowBlur = titleGlow;
    ctx.fillStyle = '#fde68a';
    ctx.font = '900 48px Cinzel,serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('DUNGEON', leftX, 105);
    ctx.fillText('BREAK', leftX, 155);
    ctx.restore();

    ctx.fillStyle = 'rgba(192,132,252,0.9)';
    ctx.font = 'italic 14px "Crimson Text",serif';
    ctx.textAlign = 'left';
    ctx.fillText('— Abyss Ascension Edition —', leftX + 2, 180);

    // Animated Menu Buttons
    _TITLE_ANIM_T = Math.min(_TITLE_ANIM_T + dt * 2.2, 1);
    const t = _TITLE_ANIM_T;

    function menuBtn(label, y, primary, delay, action) {
      const progress = Math.max(0, Math.min(1, (t - delay) / 0.35));
      const eased = 1 - Math.pow(1 - progress, 3);
      const slideX = leftX + (1 - eased) * -40;
      const alpha = eased;
      if (alpha <= 0) return;

      const bw = 240, bh = 42;
      _titleBtns.push({ x: leftX, y, w: bw, h: bh, action });

      ctx.save();
      ctx.globalAlpha = alpha;

      const bg = ctx.createLinearGradient(slideX, y, slideX + bw, y);
      if (primary) {
        bg.addColorStop(0, 'rgba(201,168,76,0.28)');
        bg.addColorStop(1, 'rgba(201,168,76,0.06)');
        ctx.strokeStyle = 'rgba(253,230,138,0.85)';
        ctx.lineWidth = 1.6;
      } else {
        bg.addColorStop(0, 'rgba(15,22,45,0.85)');
        bg.addColorStop(1, 'rgba(10,14,30,0.65)');
        ctx.strokeStyle = 'rgba(71,85,115,0.6)';
        ctx.lineWidth = 1.2;
      }
      ctx.fillStyle = bg;
      roundRect(ctx, slideX, y, bw, bh, 6);
      ctx.fill();
      ctx.stroke();

      if (primary) {
        ctx.save();
        ctx.shadowColor = '#c9a84c'; ctx.shadowBlur = 10;
      }
      ctx.fillStyle = primary ? '#fde68a' : '#cbd5e1';
      ctx.font = `bold ${primary ? 14 : 12.5}px Cinzel,serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, slideX + 16, y + bh / 2);
      if (primary) ctx.restore();

      ctx.restore();
    }

    menuBtn('▶  PLAY  ( Enter )', 205, true, 0, startGame);
    menuBtn('📖  How To Play', 255, false, 0.08, openTrainingDungeon);
    menuBtn('🔮  Abyss Sanctum', 305, false, 0.16, () => GameState.setState(GameStates.SANCTUM));
    menuBtn('📜  Codex & Bestiary', 355, false, 0.24, () => GameState.setState(GameStates.CODEX));
    menuBtn('🏆  Achievements', 405, false, 0.32, () => GameState.setState(GameStates.ACHIEVEMENTS));
    menuBtn('⚙  Settings', 455, false, 0.40, () => GameState.setState(GameStates.SETTINGS));

    const sv = SaveSystem.loadRun();
    if (sv && sv.lv) {
      ctx.fillStyle = 'rgba(253,230,138,0.7)';
      ctx.font = '11px Cinzel,serif';
      ctx.textAlign = 'left';
      ctx.fillText('[ R ] Resume saved run — Floor ' + sv.lv, leftX + 4, 520);
    }

    ctx.fillStyle = 'rgba(192,132,252,0.85)';
    ctx.font = 'bold 11px Cinzel,serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔮 Total Souls: ' + (GameState.ABYSS_SOULS || 0) + '   ·   👑 Prestige: ' + (GameState.PRESTIGE_TOKENS || 0), leftX + 4, 542);

    ctx.fillStyle = 'rgba(148,163,184,0.55)';
    ctx.font = '10px Cinzel,serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / Arrows — Move    Space — Attack    Esc — Pause    1-3 — Weapons', leftX + 4, LH - 18);
  },

  handleClick(mx, my) {
    for (const b of _titleBtns) {
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        b.action();
        return true;
      }
    }
    // Fallback click on central title area
    if (mx > LW / 2 - 120 && mx < LW / 2 + 120 && my > 200 && my < 300) {
      startGame();
      return true;
    }
    return false;
  }
};

export function drawTitle(ctx, dt) {
  MainMenu.draw(ctx, dt);
}
