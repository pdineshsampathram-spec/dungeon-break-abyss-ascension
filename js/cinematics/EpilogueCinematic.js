// =====================================================================
//  DUNGEON BREAK — js/cinematics/EpilogueCinematic.js
//  THE UNMEASURED HOUR — BESPOKE POST-ENDING CANONICAL EPILOGUE
//
//  Authoritative Canonical Revelation:
//  - Executes ONLY after genuine completion of one of the 3 Warden endings:
//      * Hero (Savior of the Depths)
//      * Betrayal (Hollow Throne)
//      * Rampage (Abyss King)
//  - Never triggers on normal deaths, boss intros, pause menus, or Shattered Mind
//  - Strictly Canvas 2D procedural rendering (cyclopean vault, obsidian stele,
//    approved small red pixel-art eye, temporal particles, 13th chime resonance)
//  - Transitions seamlessly into the existing Credits flow with correct
//    background variant, music, and return-to-title / New Game+ behavior
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { Credits } from './Credits.js';
import { CinematicSafety } from './CinematicSafety.js';
import { SaveSystem } from '../systems/SaveSystem.js';

// ─────────────────────────────────────────────────────────────
// LOCKED APPROVED PIXEL-ART RED EYE (THE ABSOLUTE)
// Reused identically from approved Hero/Betrayal/Rampage/ShatteredMind spec
// ─────────────────────────────────────────────────────────────
function _drawPixelEye(ctx, cx, cy, scale, blinkProg, timer) {
  ctx.save();
  const P = Math.max(2, Math.round(scale * 1.5)); // chunky pixel unit
  const effectiveOpen = Math.max(0, 1.0 - blinkProg);

  // Outer dark aura glow (smooth radial gradient behind pixel eye)
  if (effectiveOpen > 0.1) {
    ctx.save();
    const auraR = 28 * P;
    const auraGrad = ctx.createRadialGradient(cx, cy, 4 * P, cx, cy, auraR);
    auraGrad.addColorStop(0, 'rgba(220, 38, 38, 0.45)');
    auraGrad.addColorStop(0.35, 'rgba(153, 27, 27, 0.25)');
    auraGrad.addColorStop(0.7, 'rgba(69, 10, 10, 0.10)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(cx - auraR, cy - auraR, auraR * 2, auraR * 2);
    ctx.restore();
  }

  if (effectiveOpen <= 0.05) {
    ctx.restore();
    return;
  }

  // Pixel Almond Sclera & Crimson Outline
  const halfW = 20; // in P units
  const maxHalfH = Math.max(1, Math.round(10 * effectiveOpen));

  // 1. Black/Crimson Sclera Interior
  ctx.fillStyle = '#150205';
  for (let ry = -maxHalfH; ry <= maxHalfH; ry++) {
    const norm = Math.abs(ry) / maxHalfH;
    const span = Math.round(halfW * (1.0 - norm * norm * 0.9));
    if (span > 0) {
      ctx.fillRect(Math.round(cx - span * P), Math.round(cy + ry * P), span * 2 * P, P);
    }
  }

  // 2. Chunky Pixel Red Outline
  ctx.fillStyle = '#dc2626';
  for (let ry = -maxHalfH; ry <= maxHalfH; ry++) {
    const norm = Math.abs(ry) / maxHalfH;
    const span = Math.round(halfW * (1.0 - norm * norm * 0.9));
    if (span > 0) {
      ctx.fillRect(Math.round(cx - (span + 1) * P), Math.round(cy + ry * P), P, P);
      ctx.fillRect(Math.round(cx + span * P), Math.round(cy + ry * P), P, P);
    }
  }
  // Top & bottom caps
  ctx.fillRect(Math.round(cx - 3 * P), Math.round(cy - (maxHalfH + 1) * P), 6 * P, P);
  ctx.fillRect(Math.round(cx - 3 * P), Math.round(cy + (maxHalfH + 1) * P), 6 * P, P);

  // 3. Iris (Chunky concentric pixel rings)
  if (effectiveOpen > 0.15) {
    const irisR = Math.min(maxHalfH, 7); // P units
    for (let iy = -irisR; iy <= irisR; iy++) {
      const inorm = Math.abs(iy) / irisR;
      const ispan = Math.round(Math.sqrt(Math.max(0, 1 - inorm * inorm)) * irisR * 1.2);
      if (ispan > 0) {
        // Dark outer iris
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(Math.round(cx - ispan * P), Math.round(cy + iy * P), ispan * 2 * P, P);
        // Fiery bright inner iris
        const innerSpan = Math.max(0, ispan - 1);
        if (innerSpan > 0 && Math.abs(iy) < irisR - 1) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(Math.round(cx - innerSpan * P), Math.round(cy + iy * P), innerSpan * 2 * P, P);
        }
      }
    }

    // 4. Slit Pupil (Vertical black column)
    const pupilW = Math.max(1, Math.round(1.5 * scale));
    const pupilH = Math.round((irisR + 1) * P);
    ctx.fillStyle = '#050002';
    ctx.fillRect(Math.round(cx - pupilW / 2), Math.round(cy - pupilH), pupilW, pupilH * 2);

    // 5. Specular Highlights (Chunky white/pink pixel blocks)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(cx - 3 * P), Math.round(cy - 3 * P), 2 * P, 2 * P);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(Math.round(cx - P), Math.round(cy - 2 * P), P, P);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// EPILOGUE TIMELINE PHASES (Total Duration: ~22.5s)
// ─────────────────────────────────────────────────────────────
export const EPILOGUE_TIMELINE = {
  VOID_HOLD: 3.20,       // 0.00 – 3.20s: Natural fade from ending resolution & breathing hold in silence
  VAULT_REVEAL: 8.50,    // 3.20 – 8.50s: Ancient cyclopean vault fades in (pillars, bronze arches, dust)
  RECORD_REVEAL: 13.80,  // 8.50 – 13.80s: Surviving Record progressively chiseled onto obsidian stele
  EYE_AWAKEN: 17.20,     // 13.80 – 17.20s: The Absolute's Eye opens in cold cosmic observation
  CHIME_PROPHECY: 21.20, // 17.20 – 21.20s: Thirteenth chime strikes. Eye narrows. Proclamation revealed.
  FINAL_DISSOLVE: 22.60  // 21.20 – 22.60s: Eye closes, vault dissolves into violet blackness, handoff to Credits
};

let _epilogueDispatchedRunId = -1;

export const EpilogueCinematic = {
  active: false,
  finished: false,
  timer: 0,
  branch: 'hero',
  onComplete: null,

  // Audio cue state tracking
  soundCues: {
    dronePlayed: false,
    eyeAwakenPlayed: false,
    chimePlayed: false
  },

  // Atmospheric motes
  dustMotes: [],
  temporalSparks: [],

  initParticles() {
    this.dustMotes = Array.from({ length: 42 }, () => ({
      x: Math.random() * LW,
      y: Math.random() * LH,
      r: 0.8 + Math.random() * 1.6,
      vx: 4 + Math.random() * 8,
      vy: (Math.random() - 0.5) * 3,
      alpha: 0.15 + Math.random() * 0.35,
      phase: Math.random() * 6.28
    }));

    this.temporalSparks = Array.from({ length: 26 }, () => ({
      x: Math.random() * LW,
      y: LH * 0.4 + Math.random() * (LH * 0.55),
      r: 1.2 + Math.random() * 1.8,
      vy: -(8 + Math.random() * 16),
      vx: (Math.random() - 0.5) * 6,
      alpha: 0.25 + Math.random() * 0.55,
      phase: Math.random() * 6.28,
      isAnomalous: Math.random() < 0.35 // Hesitates in time
    }));
  },

  isActive() {
    return this.active;
  },

  suppressRealWorld() {
    return this.active;
  },

  start(branch = 'hero', onComplete = null) {
    const currentRunId = GameState.RUN_ID || 1;

    // Reject duplicate triggers within the exact same run
    if (this.active) {
      console.warn('[EpilogueCinematic] Already active. Ignoring start.');
      return;
    }
    if (_epilogueDispatchedRunId === currentRunId && !CinematicSafety.isReplay()) {
      console.log(`[EpilogueCinematic] Epilogue already completed for run ${currentRunId}. Skipping straight to Credits.`);
      if (onComplete) onComplete();
      else Credits.start(branch);
      return;
    }

    _epilogueDispatchedRunId = currentRunId;
    this.active = true;
    this.finished = false;
    this.timer = 0;
    this.branch = branch || 'hero';
    this.onComplete = onComplete;

    this.soundCues = {
      dronePlayed: false,
      eyeAwakenPlayed: false,
      chimePlayed: false
    };

    this.initParticles();

    // Set cinematic state
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    GameState.BOSS_AI_ACTIVE = false;

    // Fade out previous ending music to allow silence & subsonic drone
    MusicManager.fadeOut(1.8);

    console.log(`[EpilogueCinematic] Started The Unmeasured Hour post-ending epilogue (branch: ${this.branch.toUpperCase()}).`);
  },

  tick(dt) {
    if (!this.active) return;
    this.timer += dt;
    const t = this.timer;

    // ─────────────────────────────────────────────────────────
    // AUDIO CUES
    // ─────────────────────────────────────────────────────────
    // Beat A: Subsonic 42Hz drone fades in after initial silence
    if (t >= 1.60 && !this.soundCues.dronePlayed) {
      this.soundCues.dronePlayed = true;
      try {
        SoundManager.playTone(42, 'sine', 3.8, 0.18, 40);
        setTimeout(() => {
          try { SoundManager.snd('sanity_drone'); } catch (e) {}
        }, 120);
      } catch (e) {}
    }

    // Beat D: The Absolute's Eye awakens
    if (t >= 13.80 && !this.soundCues.eyeAwakenPlayed) {
      this.soundCues.eyeAwakenPlayed = true;
      try {
        SoundManager.snd('eye_awaken');
        setTimeout(() => {
          try { SoundManager.snd('eye_blink'); } catch (e) {}
        }, 220);
      } catch (e) {}
    }

    // Beat E: The Thirteenth Chime strikes
    if (t >= 17.20 && !this.soundCues.chimePlayed) {
      this.soundCues.chimePlayed = true;
      try {
        // Resonant deep astronomical clock chime (fundamental 392Hz + sub-octave 196Hz)
        SoundManager.playTone(392, 'triangle', 4.5, 0.22, 388);
        SoundManager.playTone(196, 'sine', 5.2, 0.20, 194);
        setTimeout(() => {
          try { SoundManager.playTone(784, 'sine', 3.0, 0.08, 770); } catch (e) {}
        }, 40);
      } catch (e) {}
    }

    // ─────────────────────────────────────────────────────────
    // PARTICLES TICK
    // ─────────────────────────────────────────────────────────
    this.dustMotes.forEach(m => {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x > LW + 20) m.x = -20;
      if (m.y < -10) m.y = LH + 10;
      if (m.y > LH + 10) m.y = -10;
    });

    this.temporalSparks.forEach(s => {
      let stepDt = dt;
      // Temporal hesitation: motes pause momentarily at peak of sine rhythm
      if (s.isAnomalous && Math.sin(t * 4.5 + s.phase) > 0.90) {
        stepDt = dt * 0.08;
      }
      s.y += s.vy * stepDt;
      s.x += s.vx * stepDt;
      if (s.y < 80) {
        s.y = LH * 0.85 + Math.random() * (LH * 0.15);
        s.x = Math.random() * LW;
      }
    });

    // ─────────────────────────────────────────────────────────
    // COMPLETION TRANSITION
    // ─────────────────────────────────────────────────────────
    if (t >= EPILOGUE_TIMELINE.FINAL_DISSOLVE) {
      this.finish();
    }
  },

  canSkip() {
    // Unskippable during the first 3.0s to allow the ending aftermath hold to register
    return this.active && this.timer >= 3.0;
  },

  skip() {
    if (!this.canSkip()) return;
    console.log('[EpilogueCinematic] Player advanced/skipped epilogue.');
    this.finish();
  },

  finish() {
    if (!this.active) return;
    this.active = false;
    this.finished = true;
    GameState.CINEMATIC_ACTIVE = false;

    // Record epilogue view in SaveSystem
    try {
      SaveSystem.recordCinematicUnlock('epilogue_unmeasured_hour');
      SaveSystem.recordCompletionMilestone('epilogue_unmeasured_hour', {
        branch: this.branch,
        timestamp: Date.now()
      });
      SaveSystem.saveProfile();
    } catch (e) {
      console.warn('[EpilogueCinematic] Could not record epilogue milestone:', e);
    }

    const branch = this.branch || 'hero';
    console.log(`[EpilogueCinematic] Epilogue completed. Transitioning smoothly into Credits (${branch.toUpperCase()}).`);

    if (this.onComplete) {
      const cb = this.onComplete;
      this.onComplete = null;
      cb();
    } else {
      Credits.start(branch);
    }
  },

  handleClick(mx, my) {
    if (!this.active) return false;
    if (this.canSkip()) {
      this.skip();
      return true;
    }
    return true; // Absorb click during epilogue
  },

  handleKeyDown(k) {
    if (!this.active) return false;
    if (k === ' ' || k === 'Enter' || k === 'Escape') {
      if (this.canSkip()) {
        this.skip();
        return true;
      }
      return true;
    }
    return false;
  },

  reset() {
    this.active = false;
    this.finished = false;
    this.timer = 0;
    this.branch = 'hero';
    this.onComplete = null;
    _epilogueDispatchedRunId = -1;
  },

  // ─────────────────────────────────────────────────────────────
  // MASTER PROCEDURAL CANVAS 2D DRAWING
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!this.active) return;
    const t = this.timer;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 1. BEAT A: VOID HOLD (0.00 – 3.20s)
    // Deep absolute blackness with gentle breathing hold
    if (t < EPILOGUE_TIMELINE.VOID_HOLD) {
      ctx.fillStyle = '#020106';
      ctx.fillRect(0, 0, LW, LH);
      ctx.restore();
      return;
    }

    // Vault emergence alpha: smoothly fades up from 3.20s to 5.80s
    const vaultAlpha = Math.min(1.0, (t - EPILOGUE_TIMELINE.VOID_HOLD) / 2.60);

    // 2. BEAT B: ANCIENT CYCLOPEAN VAULT BACKGROUND
    // Deep subterranean cosmic chamber
    ctx.fillStyle = '#020106';
    ctx.fillRect(0, 0, LW, LH);

    ctx.save();
    ctx.globalAlpha = vaultAlpha;

    // Atmospheric Abyss Back-Gradient
    const bgGrad = ctx.createRadialGradient(LW / 2, 240, 40, LW / 2, 280, 560);
    bgGrad.addColorStop(0, '#150d28');
    bgGrad.addColorStop(0.45, '#0b0616');
    bgGrad.addColorStop(0.85, '#05020a');
    bgGrad.addColorStop(1, '#020106');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, LW, LH);

    // Distant Vault Cyclopean Wall Courses (Faint ancient stone blocks)
    ctx.strokeStyle = 'rgba(76, 56, 114, 0.12)';
    ctx.lineWidth = 1.0;
    for (let y = 60; y < LH - 120; y += 44) {
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.lineTo(LW - 110, y);
      ctx.stroke();

      // Vertical mortar joints
      const xStagger = (y % 88 === 0) ? 0 : 40;
      for (let x = 110 + xStagger; x < LW - 110; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 44);
        ctx.stroke();
      }
    }

    // Great Vault Astronomical Arch (Curved monumental bronze arch across top)
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 90, 40, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.ellipse(LW / 2, 180, 360, 160, 0, Math.PI, 0);
    ctx.stroke();

    // Arch Specular Inner Rim & Clock Segment Notches
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(LW / 2, 180, 353, 153, 0, Math.PI, 0);
    ctx.stroke();

    // Astronomical Hour Notches (12 perimeter tick marks)
    ctx.fillStyle = '#d97706';
    for (let i = 0; i <= 12; i++) {
      const ang = Math.PI + (i / 12) * Math.PI;
      const nx = LW / 2 + Math.cos(ang) * 360;
      const ny = 180 + Math.sin(ang) * 160;
      ctx.fillRect(Math.round(nx) - 2, Math.round(ny) - 2, 4, 4);
    }
    ctx.restore();

    // Chasm Crevices & Violet Abyss Light at Bottom
    const fissureY = LH - 130;
    const abyssGrad = ctx.createLinearGradient(0, fissureY, 0, LH);
    abyssGrad.addColorStop(0, 'rgba(147, 51, 234, 0)');
    abyssGrad.addColorStop(0.35, 'rgba(147, 51, 234, 0.18)');
    abyssGrad.addColorStop(0.7, 'rgba(219, 39, 119, 0.12)');
    abyssGrad.addColorStop(1, 'rgba(15, 2, 28, 0.95)');
    ctx.fillStyle = abyssGrad;
    ctx.fillRect(0, fissureY, LW, LH - fissureY);

    // Jagged Floor Fissure Lines
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(80, LH - 90);
    ctx.lineTo(240, LH - 96);
    ctx.lineTo(390, LH - 88);
    ctx.lineTo(520, LH - 94);
    ctx.lineTo(680, LH - 89);
    ctx.lineTo(820, LH - 93);
    ctx.stroke();

    // Left Colossal Fluted Pillar
    this._drawPillar(ctx, 30, 0, 110, LH);
    // Right Colossal Fluted Pillar
    this._drawPillar(ctx, LW - 140, 0, 110, LH);

    // Floating Dust & Temporal Sparks
    this.dustMotes.forEach(m => {
      ctx.fillStyle = `rgba(148, 163, 184, ${m.alpha * vaultAlpha})`;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), m.r, m.r);
    });

    this.temporalSparks.forEach(s => {
      const sparkAlpha = s.alpha * vaultAlpha * (0.6 + 0.4 * Math.sin(t * 3.0 + s.phase));
      ctx.fillStyle = `rgba(192, 132, 252, ${sparkAlpha})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.r, s.r);
      // Faint glowing cross-star highlight
      if (s.isAnomalous) {
        ctx.fillStyle = `rgba(254, 240, 138, ${sparkAlpha * 0.7})`;
        ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y), 3, 1);
        ctx.fillRect(Math.round(s.x), Math.round(s.y) - 1, 1, 3);
      }
    });

    // 3. BEAT C: THE OBSIDIAN STELE & SURVIVING RECORD
    // A colossal carved basalt stele rising in the center of the vault
    const steleX = LW / 2 - 270;
    const steleY = 220;
    const steleW = 540;
    const steleH = 340;

    // Stele Shadow & Ambient Occlusion
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(steleX - 8, steleY - 8, steleW + 16, steleH + 16);

    // Stele Basalt Face
    const steleGrad = ctx.createLinearGradient(steleX, steleY, steleX, steleY + steleH);
    steleGrad.addColorStop(0, '#100c1e');
    steleGrad.addColorStop(0.5, '#0c0818');
    steleGrad.addColorStop(1, '#07040f');
    ctx.fillStyle = steleGrad;
    roundRect(ctx, steleX, steleY, steleW, steleH, 6);
    ctx.fill();

    // Stele Weathered Bronze Bevel & Runic Grooves
    ctx.strokeStyle = 'rgba(180, 130, 50, 0.40)';
    ctx.lineWidth = 2.0;
    roundRect(ctx, steleX + 2, steleY + 2, steleW - 4, steleH - 4, 4);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(90, 60, 130, 0.35)';
    ctx.lineWidth = 1.0;
    roundRect(ctx, steleX + 10, steleY + 10, steleW - 20, steleH - 20, 2);
    ctx.stroke();

    // Corner Ornaments
    ctx.fillStyle = '#b45309';
    ctx.fillRect(steleX + 12, steleY + 12, 6, 6);
    ctx.fillRect(steleX + steleW - 18, steleY + 12, 6, 6);
    ctx.fillRect(steleX + 12, steleY + steleH - 18, 6, 6);
    ctx.fillRect(steleX + steleW - 18, steleY + steleH - 18, 6, 6);

    // ─────────────────────────────────────────────────────────
    // PROGRESSIVE ANCIENT RECORD INSCRIPTION
    // ─────────────────────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Subtitle Header on Stele (Carved in stone)
    const headerAlpha = Math.min(1.0, Math.max(0, (t - 6.0) / 1.5));
    if (headerAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = vaultAlpha * headerAlpha * 0.65;
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#94a3b8';
      ctx.letterSpacing = '3px';
      ctx.fillText('— ANCIENT RUNIC RECORD · EXCERPT FROM THE FIRST VAULT —', LW / 2, steleY + 36);
      ctx.restore();
    }

    // Line 1: "Steel has endured the iron. Flesh has survived the void."
    const line1Alpha = Math.min(1.0, Math.max(0, (t - 8.60) / 1.4));
    if (line1Alpha > 0) {
      ctx.save();
      ctx.globalAlpha = vaultAlpha * line1Alpha;
      ctx.font = '500 16px Cinzel, serif';
      ctx.fillStyle = '#fde68a';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fillText('Steel has endured the iron. Flesh has survived the void.', LW / 2, steleY + 82);
      ctx.restore();
    }

    // Line 2: "Yet the pendulum has not ceased its swing."
    const line2Alpha = Math.min(1.0, Math.max(0, (t - 10.80) / 1.4));
    if (line2Alpha > 0) {
      ctx.save();
      ctx.globalAlpha = vaultAlpha * line2Alpha;
      ctx.font = '500 16px Cinzel, serif';
      ctx.fillStyle = '#fde68a';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fillText('Yet the pendulum has not ceased its swing.', LW / 2, steleY + 120);
      ctx.restore();
    }

    // Line 3: "The ten floors were but the threshold."
    const line3Alpha = Math.min(1.0, Math.max(0, (t - 12.60) / 1.4));
    if (line3Alpha > 0) {
      ctx.save();
      ctx.globalAlpha = vaultAlpha * line3Alpha;
      ctx.font = 'italic 16px Cinzel, serif';
      ctx.fillStyle = '#fed7aa';
      ctx.shadowColor = 'rgba(217, 119, 6, 0.6)';
      ctx.shadowBlur = 10;
      ctx.fillText('The ten floors were but the threshold.', LW / 2, steleY + 158);
      ctx.restore();
    }

    // Horizontal Inlaid Divider Bar
    if (line3Alpha > 0.4) {
      ctx.strokeStyle = `rgba(180, 130, 50, ${vaultAlpha * line3Alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LW / 2 - 140, steleY + 188);
      ctx.lineTo(LW / 2 + 140, steleY + 188);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(LW / 2 - 3, steleY + 186, 6, 4);
    }

    // ─────────────────────────────────────────────────────────
    // BEAT D: THE ABSOLUTE'S OBSERVATION (The Approved Pixel Red Eye)
    // Suspended in the upper vault apex (13.80s+)
    // ─────────────────────────────────────────────────────────
    if (t >= 13.80) {
      const eyeTimer = t - 13.80;
      // Opening progression (0.0 -> 1.0 within 1.0s)
      const openProg = Math.min(1.0, eyeTimer / 1.0);
      let blinkProg = 1.0 - openProg;

      // At Beat E (17.20s+), the eye narrows in calculation
      if (t >= 17.20 && t < 21.20) {
        // Narrows from 0.0 to 0.52
        const narrowProg = Math.min(1.0, (t - 17.20) / 0.85);
        blinkProg = 0.52 * narrowProg;
      } else if (t >= 21.20) {
        // Final close into slit (21.20s – 22.40s)
        const closeProg = Math.min(1.0, (t - 21.20) / 1.20);
        blinkProg = 0.52 + (1.0 - 0.52) * closeProg;
      }

      const eyeY = 136;
      _drawPixelEye(ctx, LW / 2, eyeY, 2.1, blinkProg, eyeTimer);
    }

    // ─────────────────────────────────────────────────────────
    // BEAT E: THE UNMEASURED HOUR & CORE PROCLAMATION (17.20s+)
    // ─────────────────────────────────────────────────────────
    if (t >= 17.20) {
      const procAlpha = Math.min(1.0, (t - 17.20) / 1.20);
      ctx.save();
      ctx.globalAlpha = vaultAlpha * procAlpha;

      // Primary Proclamation: "THE DESCENT WAS ONLY THE FIRST TRIAL."
      ctx.font = 'bold 21px Cinzel, serif';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.75)';
      ctx.shadowBlur = 18;
      ctx.fillText('“THE DESCENT WAS ONLY THE FIRST TRIAL.”', LW / 2, steleY + 224);

      // Secondary Proclamation: "THE UNMEASURED HOUR AWAITS."
      const subAlpha = Math.min(1.0, Math.max(0, (t - 18.60) / 1.0));
      if (subAlpha > 0) {
        ctx.globalAlpha = vaultAlpha * subAlpha;
        ctx.font = 'bold 15px Cinzel, serif';
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = 'rgba(168, 85, 247, 0.85)';
        ctx.shadowBlur = 14;
        ctx.letterSpacing = '2px';
        ctx.fillText('THE UNMEASURED HOUR AWAITS.', LW / 2, steleY + 266);
      }

      ctx.restore();
    }

    // ─────────────────────────────────────────────────────────
    // BEAT F: FINAL DISSOLVE TO VIOLET BLACKNESS (21.20s – 22.60s)
    // ─────────────────────────────────────────────────────────
    if (t >= 21.20) {
      const fadeOutProg = Math.min(1.0, (t - 21.20) / 1.40);
      const fadeGrad = ctx.createRadialGradient(LW / 2, LH / 2, 80, LW / 2, LH / 2, 540);
      fadeGrad.addColorStop(0, `rgba(18, 6, 32, ${fadeOutProg * 0.95})`);
      fadeGrad.addColorStop(0.65, `rgba(8, 2, 16, ${fadeOutProg * 0.98})`);
      fadeGrad.addColorStop(1, `rgba(2, 1, 6, ${fadeOutProg})`);
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, 0, LW, LH);
    }

    ctx.restore(); // Restore vaultAlpha

    // ─────────────────────────────────────────────────────────
    // SKIP / ADVANCE PROMPT (Unlocks at t >= 3.0s)
    // ─────────────────────────────────────────────────────────
    if (this.canSkip() && t < 21.20) {
      const promptPulse = 0.55 + 0.45 * Math.sin(t * 3.2);
      ctx.save();
      ctx.globalAlpha = 0.55 * promptPulse;
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'right';
      ctx.fillText('[ SPACE / ENTER / CLICK TO CONTINUE ]', LW - 32, LH - 24);
      ctx.restore();
    }

    ctx.restore();
  },

  // Helper: Draw monolithic classical fluted stone pillar
  _drawPillar(ctx, px, py, pw, ph) {
    ctx.save();

    // Pillar Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(px - 4, py, pw + 8, ph);

    // Pillar Granite Core
    const colGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
    colGrad.addColorStop(0, '#1a1329');
    colGrad.addColorStop(0.25, '#2d2244');
    colGrad.addColorStop(0.65, '#201833');
    colGrad.addColorStop(1, '#0e0918');
    ctx.fillStyle = colGrad;
    ctx.fillRect(px, py, pw, ph);

    // Fluted Vertical Channels (3 flutes)
    const fluteW = Math.round(pw * 0.18);
    [0.15, 0.42, 0.69].forEach(frac => {
      const fx = px + Math.round(pw * frac);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.fillRect(fx, py + 28, fluteW, ph - 56);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(fx, py + 28, 1.5, ph - 56);
    });

    // Inlaid Glowing Violet Runic Channel
    const runeX = px + Math.round(pw * 0.5);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(runeX, py + 60);
    ctx.lineTo(runeX, ph - 60);
    ctx.stroke();

    // Pillar Capital (Top)
    ctx.fillStyle = '#3f3258';
    ctx.fillRect(px - 6, py, pw + 12, 16);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.fillRect(px - 6, py + 14, pw + 12, 2.5);

    // Pillar Base (Bottom)
    ctx.fillStyle = '#3f3258';
    ctx.fillRect(px - 6, ph - 24, pw + 12, 24);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.fillRect(px - 6, ph - 24, pw + 12, 2.5);

    ctx.restore();
  }
};

// Global window registration
if (typeof window !== 'undefined') {
  window.EpilogueCinematic = EpilogueCinematic;
}
