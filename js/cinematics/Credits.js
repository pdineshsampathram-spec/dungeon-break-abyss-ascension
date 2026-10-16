// =====================================================================
//  DUNGEON BREAK — js/cinematics/Credits.js
//  CINEMATIC END CREDITS REDESIGN — REFERENCE-INSPIRED MINIMAL FILM CREDITS
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH } from '../core/Constants.js';
import { FloorManager } from '../world/FloorManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { InputManager, MOUSE_STATE, INPUT_KEYS } from '../core/InputManager.js';
import { UITransitionManager } from '../ui/UITransitionManager.js';
import { quitToMainMenu } from '../ui/PauseMenu.js';
import { Camera } from '../rendering/Camera.js';
import { EndingDispatcher } from './EndingCinematics.js';
import { triggerCinematicBanner } from '../ui/HUD.js';
import { RunResetManager } from '../systems/RunResetManager.js';

// ─────────────────────────────────────────────────────────────
// Data-Driven Credit Card Sequence (Part 12)
// ─────────────────────────────────────────────────────────────
export const CREDIT_CARDS = [
  {
    role: 'DUNGEON BREAK',
    name: 'ABYSS ASCENSION',
    isTitle: true
  },
  {
    role: 'DIRECTED & CONCEIVED BY',
    name: 'DINESH POLIMERA'
  },
  {
    role: 'GAME DESIGN & ARCHITECTURE',
    name: 'DUNGEON BREAK TEAM'
  },
  {
    role: 'COMBAT & ENGINE PROGRAMMING',
    name: 'DUNGEON BREAK TEAM'
  },
  {
    role: 'ART DIRECTION, SHADERS & LIGHTING',
    name: 'DUNGEON BREAK TEAM'
  },
  {
    role: 'CREATURE DESIGN & ENCOUNTERS',
    name: 'GORGAROTH · MALAKOR · THE ABYSS WARDEN'
  },
  {
    role: 'PROCEDURAL WORLD & LEVEL GENERATION',
    name: 'DUNGEON BREAK TEAM'
  },
  {
    role: 'CINEMATICS & LIGHTING',
    name: 'DUNGEON BREAK TEAM'
  },
  {
    role: 'ORIGINAL MUSIC',
    name: 'DUNGEON BREAK SOUNDTRACK'
  },
  {
    role: 'DUNGEON BREAK',
    name: 'A DARK DESCENT INTO THE ABYSS',
    isIntermission: true
  },
  {
    role: 'STORY',
    name: 'THE ABYSS REMEMBERS',
    isStory: true
  },
  {
    role: 'SPECIAL THANKS',
    name: 'THE SURVIVORS WHO REMEMBERED THE LIGHT'
  }
];

export const Credits = {
  active: false,
  completed: false,
  endingType: 'hero',
  endingRecorded: false,
  musicSilenced: false,

  // State phases: 'cards' | 'logo' | 'stinger' | 'options'
  phase: 'cards',
  phaseTimer: 0,
  cardIndex: 0,
  timelineTimer: 0,
  selectedOption: 0, // 0: New Game+, 1: Title Screen

  // Multi-layered cinematic particle system
  bgMotes: [],
  midEmbers: [],
  fgBokeh: [],
  smokeClouds: [],

  init(endingType = 'hero') {
    this.active = true;
    this.completed = false;
    this.endingType = endingType || 'hero';
    this.musicSilenced = false;
    this.phase = 'cards';
    this.phaseTimer = 0;
    this.cardIndex = 0;
    this.timelineTimer = 0;
    this.selectedOption = 0;

    // 1. Authoritative Ending Discovery, Prestige Token Award & Achievement Unlock (Guarded against duplicate execution and menu viewing)
    if (this.endingType !== 'menu' && !this.endingRecorded) {
      this.endingRecorded = true;
      SaveSystem.recordEnding(this.endingType);

      // Award 1 Prestige Token for genuine Warden ending completion
      if (['hero', 'betrayal', 'rampage'].includes(this.endingType)) {
        SaveSystem.awardPrestigeToken(this.endingType);
      }

      if (this.endingType === 'hero') {
        AchievementSystem.unlock('true_hero');
        SaveSystem.unlockMemory('memory_ending_hero');
        SaveSystem.recordCompletionMilestone('ending_hero', { ending: 'hero' });
      } else if (this.endingType === 'betrayal') {
        AchievementSystem.unlock('betrayed');
        SaveSystem.unlockMemory('memory_ending_betrayal');
        SaveSystem.recordCompletionMilestone('ending_betrayal', { ending: 'betrayal' });
      } else if (this.endingType === 'rampage') {
        AchievementSystem.unlock('rampage');
        SaveSystem.unlockMemory('memory_ending_rampage');
        SaveSystem.recordCompletionMilestone('ending_rampage', { ending: 'rampage' });
      } else if (this.endingType === 'shattered_mind' || this.endingType === 'mind_break') {
        AchievementSystem.unlock('mind_break');
        SaveSystem.unlockMemory('memory_shattered_mind');
        SaveSystem.recordCompletionMilestone('death_shattered_mind', { ending: 'shattered_mind' });
      }

      SaveSystem.saveAchievements();
      SaveSystem.saveProfile();
    }

    // 2. Layered Ambient Particles
    // Background motes (subtle, dim, distant)
    this.bgMotes = Array.from({ length: 36 }, () => ({
      x: Math.random() * LW,
      y: Math.random() * LH,
      r: 0.6 + Math.random() * 0.8,
      speedY: 6 + Math.random() * 12,
      speedX: (Math.random() - 0.5) * 4,
      alpha: 0.12 + Math.random() * 0.22,
      phase: Math.random() * 6.28
    }));

    // Midground embers (crisp, warm gold/amber, sine swaying)
    this.midEmbers = Array.from({ length: 48 }, () => ({
      x: Math.random() * LW,
      y: Math.random() * LH,
      r: 1.4 + Math.random() * 1.5,
      speedY: 14 + Math.random() * 26,
      swayFreq: 1.2 + Math.random() * 1.8,
      swayAmp: 10 + Math.random() * 16,
      phase: Math.random() * 6.28,
      color: Math.random() > 0.18 ? '#f59e0b' : '#ef4444',
      baseAlpha: 0.45 + Math.random() * 0.45,
      flickerSpeed: 4 + Math.random() * 6
    }));

    // Foreground bokeh embers (large, defocused soft blur, passing close to camera)
    this.fgBokeh = Array.from({ length: 14 }, () => ({
      x: Math.random() * LW,
      y: Math.random() * LH,
      r: 4.5 + Math.random() * 3.5,
      speedY: 28 + Math.random() * 32,
      speedX: (Math.random() - 0.5) * 12,
      alpha: 0.24 + Math.random() * 0.28,
      phase: Math.random() * 6.28
    }));

    // Atmospheric smoke / haze clouds (slow horizontal drift across lower third)
    this.smokeClouds = [
      { x: 120, y: LH - 130, radiusX: 320, radiusY: 110, speed: 7, alpha: 0.05 },
      { x: 580, y: LH - 170, radiusX: 360, radiusY: 130, speed: -5, alpha: 0.06 },
      { x: 300, y: LH - 90, radiusX: 280, radiusY: 90, speed: 6, alpha: 0.045 },
      { x: 740, y: LH - 220, radiusX: 260, radiusY: 100, speed: -8, alpha: 0.04 }
    ];
  },

  reset() {
    this.active = false;
    this.completed = false;
    this.musicSilenced = false;
    this.phase = 'cards';
    this.phaseTimer = 0;
    this.cardIndex = 0;
    this.timelineTimer = 0;
    this.selectedOption = 0;
    this.endingRecorded = false;
  },

  start(endingType = 'hero') {
    GameState.CINEMATIC_ACTIVE = false;
    GameState.setState(GameStates.CREDITS || 'credits');
    this.init(endingType);
  },

  startNewGamePlus() {
    this.active = false;
    this.completed = true;
    this.musicSilenced = false;

    // Record NG+ cycle before clearing run state
    if (SaveSystem.startNGPlus) {
      SaveSystem.startNGPlus();
    } else {
      GameState.NEW_GAME_PLUS = (GameState.NEW_GAME_PLUS || 0) + 1;
      if (SaveSystem.saveNGPlus) SaveSystem.saveNGPlus();
      if (SaveSystem.clearRun) SaveSystem.clearRun();
    }

    UITransitionManager.transitionTo(() => {
      RunResetManager.resetRun({ playIntro: true });
    }, 0.5);
  },

  ascendIntoDungeon() {
    this.startNewGamePlus();
  },

  returnToTitle() {
    this.active = false;
    this.completed = true;
    GameState.CINEMATIC_ACTIVE = false;
    GameState.levelTransitionActive = false;
    GameState.PORTAL_USED = false;
    GameState.WARP_ACTIVE = false;
    FloorManager.resetTransitionLock();
    EndingDispatcher.reset();
    if (typeof window !== 'undefined' && window.WardenDefeatCinematic && window.WardenDefeatCinematic.reset) {
      window.WardenDefeatCinematic.reset();
    }
    this.musicSilenced = false;
    Camera.reset();
    UITransitionManager.transitionTo(() => {
      quitToMainMenu();
      MusicManager.fadeIn('menu', 2.0, 0.70);
    }, 0.5);
  },

  // Advance skip logic (Part 17)
  skip() {
    if (this.phase === 'cards') {
      this.startLogoPhase();
    } else if (this.phase === 'logo' || this.phase === 'stinger') {
      this.startOptionsPhase();
    }
  },

  startLogoPhase() {
    this.phase = 'logo';
    this.phaseTimer = 0;
    // Gradually reduce music so the upcoming stinger is dead quiet
    this.musicSilenced = true;
    MusicManager.fadeOut(2.5);
  },

  startStingerPhase() {
    this.phase = 'stinger';
    this.phaseTimer = 0;
    this.musicSilenced = true;
  },

  startOptionsPhase() {
    this.phase = 'options';
    this.phaseTimer = 0;
    this.completed = true;
  },

  tick(dt) {
    if (!this.active || this.freeze) return;

    this.timelineTimer += dt;
    this.phaseTimer += dt;

    // Phase Timeline Progression
    if (this.phase === 'cards') {
      const cardDuration = (this.cardIndex === 0) ? 5.2 : 4.2;
      if (this.phaseTimer >= cardDuration) {
        this.phaseTimer = 0;
        this.cardIndex++;
        if (this.cardIndex >= CREDIT_CARDS.length) {
          this.startLogoPhase();
        }
      }
    } else if (this.phase === 'logo') {
      if (this.phaseTimer >= 8.2) {
        this.startStingerPhase();
      }
    } else if (this.phase === 'stinger') {
      if (this.phaseTimer >= 8.5) {
        this.startOptionsPhase();
      }
    }

    // Update Particles
    this.bgMotes.forEach(m => {
      m.y -= m.speedY * dt;
      m.x += m.speedX * dt;
      if (m.y < -10) {
        m.y = LH + 10;
        m.x = Math.random() * LW;
      }
    });

    this.midEmbers.forEach(e => {
      e.y -= e.speedY * dt;
      e.x += Math.sin(this.timelineTimer * e.swayFreq + e.phase) * (e.swayAmp * dt);
      if (e.y < -15) {
        e.y = LH + 15;
        e.x = Math.random() * LW;
      }
    });

    this.fgBokeh.forEach(b => {
      b.y -= b.speedY * dt;
      b.x += b.speedX * dt;
      if (b.y < -30) {
        b.y = LH + 30;
        b.x = Math.random() * LW;
      }
    });

    this.smokeClouds.forEach(s => {
      s.x += s.speed * dt;
      if (s.speed > 0 && s.x - s.radiusX > LW) {
        s.x = -s.radiusX;
      } else if (s.speed < 0 && s.x + s.radiusX < 0) {
        s.x = LW + s.radiusX;
      }
    });
  },

  draw(ctx) {
    ctx.save();

    const cx = LW / 2;
    const cy = LH / 2;

    // Subconscious slow camera movement with parallax (Part 5 & Part 7)
    const camX = Math.sin(this.timelineTimer * 0.04) * 16;
    const camY = Math.cos(this.timelineTimer * 0.03) * 8;

    // 1. Ending-Specific Silhouette Background & Tone (Part 5)
    if (this.phase !== 'stinger' || this.phaseTimer > 7.5) {
      this.drawEndingBackdrop(ctx, cx, cy, camX, camY);
    } else {
      ctx.fillStyle = '#020307';
      ctx.fillRect(0, 0, LW, LH);
    }

    // 2. Multi-layered Ambient Smoke & Particles (Part 8)
    if (this.phase !== 'stinger' || this.phaseTimer > 7.5) {
      this.drawParticles(ctx, camX, camY);
    }

    // 3. Central Cinematic Presentation by Phase
    if (this.phase === 'cards') {
      this.drawCard(ctx, cx, cy);
    } else if (this.phase === 'logo') {
      this.drawFinalLogo(ctx, cx, cy);
    } else if (this.phase === 'stinger') {
      this.drawStinger(ctx, cx, cy);
    } else if (this.phase === 'options') {
      this.drawOptions(ctx, cx, cy);
    }

    // 4. Subtle Cinematic Skip Helper (Bottom Right)
    if (this.phase !== 'options') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('[ Space / Enter / Click to Skip ]', LW - 24, LH - 18);
      ctx.restore();
    }

    // 5. 16:9 Cinematic Border Vignette (Restraint & Negative Space)
    this.drawCinematicVignette(ctx);

    ctx.restore();
  },

  drawEndingBackdrop(ctx, cx, cy, camX, camY) {
    const end = this.endingType;

    if (end === 'hero') {
      // ── HERO: Cathedral vault silhouette with warm light spreading from distant exit
      const bgGrad = ctx.createLinearGradient(0, 0, 0, LH);
      bgGrad.addColorStop(0, '#0a0806');
      bgGrad.addColorStop(0.5, '#140c06');
      bgGrad.addColorStop(1, '#080503');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, LW, LH);

      // Distant radiant sunrise beam through the central archway
      const sunCenter = cx + camX * 0.25;
      const sunGrad = ctx.createRadialGradient(sunCenter, cy - 20 + camY * 0.25, 10, sunCenter, cy - 20, 320);
      sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.16)');
      sunGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.08)');
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, LW, LH);

      // Cathedral Archway & Vault Pillars in deep silhouette
      ctx.save();
      ctx.fillStyle = '#080605';
      const archX = cx + camX * 0.45;
      ctx.beginPath();
      ctx.moveTo(archX - 110, LH);
      ctx.lineTo(archX - 110, cy - 40);
      ctx.quadraticCurveTo(archX - 110, cy - 140, archX, cy - 190);
      ctx.quadraticCurveTo(archX + 110, cy - 140, archX + 110, cy - 40);
      ctx.lineTo(archX + 110, LH);
      ctx.lineTo(LW + 50, LH);
      ctx.lineTo(LW + 50, 0);
      ctx.lineTo(-50, 0);
      ctx.lineTo(-50, LH);
      ctx.closePath();
      ctx.fill();

      // Flanking cathedral columns
      ctx.fillStyle = '#0d0907';
      ctx.fillRect(archX - 280, 0, 50, LH);
      ctx.fillRect(archX + 230, 0, 50, LH);
      ctx.restore();

    } else if (end === 'betrayal') {
      // ── BETRAYAL: Cold abandoned throne room, broken weapons on floor, blue-gray shadows
      const coldGrad = ctx.createLinearGradient(0, 0, 0, LH);
      coldGrad.addColorStop(0, '#04070d');
      coldGrad.addColorStop(0.6, '#080e18');
      coldGrad.addColorStop(1, '#020408');
      ctx.fillStyle = coldGrad;
      ctx.fillRect(0, 0, LW, LH);

      // Faint cold ambient moonlight rim
      const moonX = cx + camX * 0.3;
      const moonGrad = ctx.createRadialGradient(moonX, cy - 50, 20, moonX, cy - 50, 360);
      moonGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      moonGrad.addColorStop(0.5, 'rgba(30, 41, 59, 0.05)');
      moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonGrad;
      ctx.fillRect(0, 0, LW, LH);

      // Abandoned throne silhouette in midground
      ctx.save();
      const throneX = cx + camX * 0.5;
      const throneY = cy + 40 + camY * 0.5;
      ctx.fillStyle = '#060a12';
      ctx.fillRect(throneX - 70, throneY + 80, 140, 16);
      ctx.fillRect(throneX - 55, throneY + 64, 110, 16);
      ctx.fillRect(throneX - 35, throneY - 10, 70, 74);
      ctx.beginPath();
      ctx.moveTo(throneX - 42, throneY - 10);
      ctx.lineTo(throneX - 35, throneY - 80);
      ctx.lineTo(throneX, throneY - 110);
      ctx.lineTo(throneX + 35, throneY - 80);
      ctx.lineTo(throneX + 42, throneY - 10);
      ctx.closePath();
      ctx.fill();

      // Broken weapons jutting out of cold stone floor
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(throneX - 160, LH - 40);
      ctx.lineTo(throneX - 130, LH - 90);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(throneX + 140, LH - 30);
      ctx.lineTo(throneX + 195, LH - 110);
      ctx.stroke();
      ctx.restore();

    } else if (end === 'rampage') {
      // ── RAMPAGE: Destroyed battlefield arena, dying fire, dark smoke, broken weapons
      const warGrad = ctx.createLinearGradient(0, 0, 0, LH);
      warGrad.addColorStop(0, '#0c0202');
      warGrad.addColorStop(0.5, '#160404');
      warGrad.addColorStop(1, '#050101');
      ctx.fillStyle = warGrad;
      ctx.fillRect(0, 0, LW, LH);

      // Smoldering ground fire glow along lower arena floor
      const fireGrad = ctx.createLinearGradient(0, LH, 0, LH - 200);
      fireGrad.addColorStop(0, 'rgba(220, 38, 38, 0.16)');
      fireGrad.addColorStop(0.4, 'rgba(234, 88, 12, 0.08)');
      fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fireGrad;
      ctx.fillRect(0, 0, LW, LH);

      // Shattered battlefield rubble, ruined pillars, and crossed weapons in silhouette
      ctx.save();
      const arenaX = cx + camX * 0.6;
      ctx.fillStyle = '#080202';
      ctx.fillRect(arenaX - 260, cy - 40, 55, LH);

      ctx.beginPath();
      ctx.moveTo(arenaX + 180, LH - 40);
      ctx.lineTo(arenaX + 270, LH - 95);
      ctx.lineTo(arenaX + 290, LH - 60);
      ctx.lineTo(arenaX + 200, LH - 5);
      ctx.closePath();
      ctx.fill();

      // War banner pole / spear
      ctx.strokeStyle = '#1a0505';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(arenaX - 90, LH - 20);
      ctx.lineTo(arenaX - 70, LH - 130);
      ctx.stroke();
      ctx.restore();

    } else {
      // ── SHATTERED MIND: Faint distorted dungeon, unstable purple haze, distant eyes
      const voidGrad = ctx.createLinearGradient(0, 0, 0, LH);
      voidGrad.addColorStop(0, '#06010a');
      voidGrad.addColorStop(0.5, '#10031c');
      voidGrad.addColorStop(1, '#030106');
      ctx.fillStyle = voidGrad;
      ctx.fillRect(0, 0, LW, LH);

      const voidX = cx + camX * 0.4;
      const voidPulse = Math.sin(this.timelineTimer * 0.8) * 0.04 + 0.10;
      const voidGlow = ctx.createRadialGradient(voidX, cy, 20, voidX, cy, 380);
      voidGlow.addColorStop(0, `rgba(168, 85, 247, ${voidPulse})`);
      voidGlow.addColorStop(0.6, 'rgba(88, 28, 135, 0.04)');
      voidGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = voidGlow;
      ctx.fillRect(0, 0, LW, LH);

      ctx.save();
      ctx.fillStyle = '#07010e';
      const warp = Math.sin(this.timelineTimer * 0.5) * 6;
      ctx.fillRect(voidX - 270 + warp, 0, 48, LH);
      ctx.fillRect(voidX + 220 - warp, 0, 48, LH);

      const eyeBlink = Math.sin(this.timelineTimer * 0.6) * 0.5 + 0.5;
      if (eyeBlink > 0.3) {
        const eyeAlpha = (eyeBlink - 0.3) * 0.7;
        this.drawEldritchEye(ctx, voidX - 180, cy - 80, 14, eyeAlpha);
        this.drawEldritchEye(ctx, voidX + 170, cy - 110, 11, eyeAlpha * 0.8);
      }
      ctx.restore();
    }
  },

  drawEldritchEye(ctx, x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.22, size * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  drawParticles(ctx, camX, camY) {
    // 1. Drifting Atmospheric Smoke / Haze
    this.smokeClouds.forEach(s => {
      ctx.save();
      const grad = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, s.radiusX);
      grad.addColorStop(0, `rgba(226, 232, 240, ${s.alpha})`);
      grad.addColorStop(0.6, `rgba(148, 163, 184, ${s.alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.radiusX, s.radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 2. Background Motes (Dim & Small)
    this.bgMotes.forEach(m => {
      ctx.fillStyle = `rgba(226, 232, 240, ${m.alpha})`;
      ctx.beginPath();
      ctx.arc(m.x + camX * 0.2, m.y + camY * 0.2, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Midground Glowing Embers (Warm Pale Orange/Gold, occasional Red)
    this.midEmbers.forEach(e => {
      const flicker = Math.sin(this.timelineTimer * e.flickerSpeed + e.phase) * 0.15;
      const alpha = Math.max(0, Math.min(1, e.baseAlpha + flicker));
      ctx.save();
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = e.color === '#ef4444'
        ? `rgba(239, 68, 68, ${alpha})`
        : `rgba(245, 158, 11, ${alpha})`;
      ctx.beginPath();
      ctx.arc(e.x + camX * 0.6, e.y + camY * 0.6, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Foreground Bokeh Embers (Large, Defocused Blur)
    this.fgBokeh.forEach(b => {
      ctx.save();
      ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(251, 191, 36, ${b.alpha})`;
      ctx.beginPath();
      ctx.arc(b.x + camX * 1.2, b.y + camY * 1.2, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  },

  drawCard(ctx, cx, cy) {
    const card = CREDIT_CARDS[this.cardIndex];
    if (!card) return;

    const t = this.phaseTimer;

    // Typographic Staggered Fade:
    let roleAlpha = 0;
    let nameAlpha = 0;

    if (card.isTitle) {
      // Opening Title Card: hold dark for first 1.2s, then fade in smoothly
      const startT = 1.2;
      const roleIn = Math.min(1, Math.max(0, (t - startT) / 0.8));
      const nameIn = Math.min(1, Math.max(0, (t - startT - 0.25) / 0.8));
      const fadeOut = t > 4.2 ? Math.max(0, 1 - (t - 4.2) / 0.8) : 1;
      roleAlpha = roleIn * fadeOut;
      nameAlpha = nameIn * fadeOut;
    } else {
      // Standard Cards: role in 0.0-0.65s, name in 0.25-0.9s, hold till 3.2s, fade out to 4.0s
      const roleIn = Math.min(1, Math.max(0, t / 0.65));
      const nameIn = Math.min(1, Math.max(0, (t - 0.25) / 0.65));
      const fadeOut = t > 3.2 ? Math.max(0, 1 - (t - 3.2) / 0.8) : 1;
      roleAlpha = roleIn * fadeOut;
      nameAlpha = nameIn * fadeOut;
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (card.isTitle) {
      // Opening Title Card: "DUNGEON BREAK" / "ABYSS ASCENSION"
      ctx.save();
      ctx.globalAlpha = roleAlpha;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 30px Cinzel, serif';
      ctx.fillText(card.role, cx, cy - 18);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = nameAlpha;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.fillText(card.name, cx, cy + 22);
      ctx.restore();

    } else if (card.isIntermission) {
      // Game Creation Card: "DUNGEON BREAK" / "A DARK DESCENT INTO THE ABYSS"
      ctx.save();
      ctx.globalAlpha = roleAlpha;
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 22px Cinzel, serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.fillText(card.role, cx, cy - 14);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = nameAlpha;
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 14px "Crimson Text", serif';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.3)';
      ctx.shadowBlur = 8;
      ctx.fillText(card.name, cx, cy + 18);
      ctx.restore();

    } else {
      // Standard Film Credit Card: ROLE (Small, Muted Gold) & NAME (Larger, Warm Ivory)
      // 1. Role
      ctx.save();
      ctx.globalAlpha = roleAlpha * 0.82;
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.fillText(card.role, cx, cy - 14);
      ctx.restore();

      // 2. Name
      ctx.save();
      ctx.globalAlpha = nameAlpha;
      ctx.fillStyle = '#fffdf0';
      ctx.font = 'bold 20px Cinzel, serif';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
      ctx.shadowBlur = 10;
      ctx.fillText(card.name, cx, cy + 18);
      ctx.restore();
    }

    ctx.restore();
  },

  drawFinalLogo(ctx, cx, cy) {
    const t = this.phaseTimer;

    // Fade in from 0.5s to 2.0s; fade out from 7.0s to 8.0s
    let logoAlpha = 0;
    if (t > 0.5 && t <= 2.0) {
      logoAlpha = (t - 0.5) / 1.5;
    } else if (t > 2.0 && t <= 7.0) {
      logoAlpha = 1.0;
    } else if (t > 7.0) {
      logoAlpha = Math.max(0, 1 - (t - 7.0) / 1.0);
    }

    if (logoAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = logoAlpha;

    // ─────────────────────────────────────────────────────────
    // DUNGEON BREAK LOGO (Identical visual language to Main Menu)
    // ─────────────────────────────────────────────────────────
    const logoY = cy - 28;

    // 1. Chiseled Drop Shadow
    ctx.fillStyle = '#010206';
    ctx.font = '900 44px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DUNGEON BREAK', cx + 2.5, logoY + 2.5);

    // 2. Luminous Ambient Glow
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 18;

    // 3. Metallic Gold Vertical Gradient Fill
    const goldGrad = ctx.createLinearGradient(cx, logoY - 26, cx, logoY + 26);
    goldGrad.addColorStop(0, '#fffdf0');
    goldGrad.addColorStop(0.25, '#fde68a');
    goldGrad.addColorStop(0.55, '#f59e0b');
    goldGrad.addColorStop(0.85, '#b45309');
    goldGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = goldGrad;
    ctx.fillText('DUNGEON BREAK', cx, logoY);
    ctx.shadowBlur = 0;

    // 4. Subtle Metallic Light Sweep Highlight (Part 13)
    if (t > 1.8 && t < 3.8) {
      const sweepT = (t - 1.8) / 2.0;
      const sweepX = cx - 220 + sweepT * 440;
      ctx.save();
      const sweepGrad = ctx.createLinearGradient(sweepX - 50, 0, sweepX + 50, 0);
      sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sweepGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
      sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillText('DUNGEON BREAK', cx, logoY);
      ctx.restore();
    }

    // 5. Subtitle: ABYSS ASCENSION (Part 14)
    if (t > 2.2) {
      const subAlpha = Math.min(1, (t - 2.2) / 0.8) * logoAlpha;
      ctx.save();
      ctx.globalAlpha = subAlpha;
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 12px Cinzel, serif';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 8;
      ctx.fillText('✧  ABYSS ASCENSION  ✧', cx, logoY + 38);
      ctx.restore();
    }

    // 6. Final Tagline: "THE ABYSS REMEMBERS." (Part 14)
    if (t > 3.4) {
      const tagAlpha = Math.min(1, (t - 3.4) / 1.0) * logoAlpha;
      ctx.save();
      ctx.globalAlpha = tagAlpha;
      ctx.fillStyle = '#fde68a';
      ctx.font = 'italic 16px "Crimson Text", serif';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.35)';
      ctx.shadowBlur = 10;
      ctx.fillText('“The abyss remembers.”', cx, logoY + 74);
      ctx.restore();
    }

    ctx.restore();
  },

  drawStinger(ctx, cx, cy) {
    const t = this.phaseTimer;

    // Pitch black backdrop
    ctx.fillStyle = '#010204';
    ctx.fillRect(0, 0, LW, LH);

    // 2.0s - 4.5s: Distant violet ethereal glow & whisper "Rowan..."
    if (t >= 2.0 && t < 4.8) {
      const glowIn = Math.min(1, (t - 2.0) / 0.8);
      const glowOut = t > 4.0 ? Math.max(0, 1 - (t - 4.0) / 0.8) : 1;
      const glowAlpha = glowIn * glowOut;

      // Soft purple orb
      const orbGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 140);
      orbGrad.addColorStop(0, `rgba(168, 85, 247, ${glowAlpha * 0.28})`);
      orbGrad.addColorStop(0.6, `rgba(88, 28, 135, ${glowAlpha * 0.08})`);
      orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, LW, LH);

      if (t >= 2.6) {
        const textIn = Math.min(1, (t - 2.6) / 0.7);
        const textOut = t > 3.8 ? Math.max(0, 1 - (t - 3.8) / 0.6) : 1;
        ctx.save();
        ctx.globalAlpha = textIn * textOut;
        ctx.fillStyle = '#e9d5ff';
        ctx.font = 'italic 19px "Crimson Text", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 12;
        ctx.fillText('“Rowan...”', cx, cy);
        ctx.restore();
      }
    }

    // 5.0s - 7.5s: "THE ABYSS IS NOT FINISHED."
    if (t >= 5.0 && t < 8.0) {
      const textIn = Math.min(1, (t - 5.0) / 0.9);
      const textOut = t > 7.0 ? Math.max(0, 1 - (t - 7.0) / 0.8) : 1;
      const alpha = textIn * textOut;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 14px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
      ctx.shadowBlur = 10;
      ctx.fillText('THE ABYSS IS NOT FINISHED.', cx, cy);
      ctx.restore();
    }
  },

  drawOptions(ctx, cx, cy) {
    const t = this.phaseTimer;
    const fade = Math.min(1, t / 0.8);

    ctx.save();
    ctx.globalAlpha = fade;

    // Header Title
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 20px Cinzel, serif';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    const titleText = this.endingType === 'menu' ? 'ARCHIVAL CREDITS' : 'JOURNEY COMPLETE';
    const subText = this.endingType === 'menu' ? 'Honoring the architects and explorers of the Abyss' : 'The lightless depths await your return';
    ctx.fillText(titleText, cx, cy - 80);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 13px "Crimson Text", serif';
    ctx.fillText(subText, cx, cy - 54);
    ctx.restore();

    // Text-First Dark-Fantasy Buttons (Part 15)
    const mouseX = (MOUSE_STATE && MOUSE_STATE.mx !== undefined) ? MOUSE_STATE.mx : ((InputManager && InputManager.MOUSE_STATE) ? InputManager.MOUSE_STATE.mx : -999);
    const mouseY = (MOUSE_STATE && MOUSE_STATE.my !== undefined) ? MOUSE_STATE.my : ((InputManager && InputManager.MOUSE_STATE) ? InputManager.MOUSE_STATE.my : -999);

    const btnW = 320, btnH = 46;
    const btnX = cx - btnW / 2;
    const btn1Y = cy - 12;
    const btn2Y = cy + 46;

    const hov0 = (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btn1Y && mouseY <= btn1Y + btnH) || (this.selectedOption === 0);
    const hov1 = (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btn2Y && mouseY <= btn2Y + btnH) || (this.selectedOption === 1);

    const opt0Label = this.endingType === 'menu' ? '◈  REPLAY CREDITS' : '◈  ASCEND INTO THE DUNGEON';
    const opt1Label = this.endingType === 'menu' ? '⚔  RETURN TO MAIN MENU' : '⚔  RETURN TO TITLE SCREEN';

    // Option 0
    this.drawTextButton(ctx, btnX, btn1Y, btnW, btnH, opt0Label, hov0, true);

    // Option 1
    this.drawTextButton(ctx, btnX, btn2Y, btnW, btnH, opt1Label, hov1, false);

    // Navigation Helper Prompt
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '10px Cinzel, serif';
    ctx.fillText('[ ↑ / ↓ ] TO SELECT   •   [ ENTER / SPACE / CLICK ] TO CONFIRM', cx, cy + 128);
    ctx.restore();

    ctx.restore();
  },

  drawTextButton(ctx, x, y, w, h, label, isHovered, isPrimary) {
    ctx.save();

    // Hover background wash
    if (isHovered) {
      const bgGrad = ctx.createLinearGradient(x, y, x + w, y);
      bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bgGrad.addColorStop(0.2, isPrimary ? 'rgba(245, 158, 11, 0.16)' : 'rgba(148, 163, 184, 0.12)');
      bgGrad.addColorStop(0.8, isPrimary ? 'rgba(245, 158, 11, 0.16)' : 'rgba(148, 163, 184, 0.12)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(x, y, w, h);
    }

    // Border line accents on hover
    if (isHovered) {
      ctx.strokeStyle = isPrimary ? 'rgba(245, 158, 11, 0.5)' : 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 20, y); ctx.lineTo(x + w - 20, y);
      ctx.moveTo(x + 20, y + h); ctx.lineTo(x + w - 20, y + h);
      ctx.stroke();
    }

    // Button text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isHovered) {
      ctx.shadowColor = isPrimary ? '#f59e0b' : '#94a3b8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = isPrimary ? '#fffdf0' : '#f8fafc';
    } else {
      ctx.fillStyle = isPrimary ? '#fde68a' : '#cbd5e1';
    }
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.fillText(label, x + w / 2, y + h / 2);

    ctx.restore();
  },

  drawCinematicVignette(ctx) {
    // Top & bottom subtle letterbox vignetting for 16:9 film feel
    const vigGrad = ctx.createLinearGradient(0, 0, 0, LH);
    vigGrad.addColorStop(0, 'rgba(1, 2, 4, 0.7)');
    vigGrad.addColorStop(0.08, 'rgba(1, 2, 4, 0)');
    vigGrad.addColorStop(0.92, 'rgba(1, 2, 4, 0)');
    vigGrad.addColorStop(1, 'rgba(1, 2, 4, 0.7)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, LW, LH);
  },

  handleClick(mx, my) {
    if (!this.active) return false;

    if (this.phase === 'options') {
      const cx = LW / 2;
      const cy = LH / 2;
      const btnW = 320, btnH = 46;
      const btnX = cx - btnW / 2;
      const btn1Y = cy - 12;
      const btn2Y = cy + 46;

      if (mx >= btnX && mx <= btnX + btnW && my >= btn1Y && my <= btn1Y + btnH) {
        SoundManager.snd('talent_unlock');
        if (this.endingType === 'menu') {
          this.init('menu');
        } else {
          this.startNewGamePlus();
        }
        return true;
      }

      if (mx >= btnX && mx <= btnX + btnW && my >= btn2Y && my <= btn2Y + btnH) {
        SoundManager.snd('menu_select');
        this.returnToTitle();
        return true;
      }
    } else {
      // Advance / skip to next major phase
      SoundManager.snd('menu_select');
      this.skip();
      return true;
    }

    return false;
  },

  handleKeyDown(k) {
    if (!this.active) return false;

    if (this.phase === 'options') {
      if (k === 'ArrowUp' || k === 'w' || k === 'W') {
        this.selectedOption = 0;
        SoundManager.snd('menu_hover');
        return true;
      }
      if (k === 'ArrowDown' || k === 's' || k === 'S') {
        this.selectedOption = 1;
        SoundManager.snd('menu_hover');
        return true;
      }
      if (k === 'Enter' || k === ' ' || k === 'Space') {
        if (this.selectedOption === 0) {
          SoundManager.snd('talent_unlock');
          if (this.endingType === 'menu') {
            this.init('menu');
          } else {
            this.startNewGamePlus();
          }
        } else {
          SoundManager.snd('menu_select');
          this.returnToTitle();
        }
        return true;
      }
      if (k === 'Escape') {
        SoundManager.snd('menu_select');
        this.returnToTitle();
        return true;
      }
    } else {
      // Space / Enter / Escape skips forward cleanly
      if (k === 'Enter' || k === ' ' || k === 'Space') {
        SoundManager.snd('menu_select');
        this.skip();
        return true;
      }
      if (k === 'Escape') {
        SoundManager.snd('menu_select');
        this.startOptionsPhase();
        return true;
      }
    }

    return false;
  }
};

export const startCredits = (endingType = 'hero') => Credits.start(endingType);

if (typeof window !== 'undefined') {
  window.Credits = Credits;
  window.startCredits = startCredits;
  window.CREDIT_CARDS = CREDIT_CARDS;
}
