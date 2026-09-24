// =====================================================================
//  DUNGEON BREAK — js/cinematics/CinematicDirector.js
//  Authoritative Cinematic Director, Timeline Runner, & Screenplay Engine
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH } from '../core/Constants.js';
import { EventBus } from '../core/EventBus.js';

export let CI = {
  type: '',
  actors: [],
  lines: [],
  lineIdx: 0,
  lineFade: 0,
  lineLife: 0,
  phase: 0,
  letterbox: 0,
  done: false,
  typewriterText: '',
  typewriterTarget: '',
  typewriterTimer: 0,
};

export const CinematicDirector = {
  startIntro() {
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;

    CI = {
      type: 'intro',
      actors: [],
      lines: [
        { text: 'You wake.', dur: 1.4 },
        { text: 'Not from sleep.', dur: 1.4 },
        { text: 'From forgetting.', dur: 1.8 },
        { text: 'The dungeon remembers you.', dur: 1.6 },
        { text: 'Walk.', dur: 1.2 }
      ],
      lineIdx: 0,
      lineFade: 1,
      lineLife: 1.4,
      letterbox: 0,
      done: false,
      typewriterText: '',
      typewriterTarget: 'You wake.',
      typewriterTimer: 0
    };

    EventBus.emit('cinematic:intro_started');
  },

  endIntro() {
    CI.done = true;
    GameState.CINEMATIC_ACTIVE = false;
    GameState.setState(GameStates.PLAYING);
    EventBus.emit('cinematic:intro_ended');
  },

  advance() {
    if (CI.done) return;
    if (CI.type === 'intro') {
      this.endIntro();
      return;
    }

    CI.lineIdx++;
    if (CI.lineIdx >= CI.lines.length) {
      CI.done = true;
      GameState.CINEMATIC_ACTIVE = false;
      GameState.setState(GameStates.PLAYING);
    } else {
      const line = CI.lines[CI.lineIdx];
      CI.typewriterTarget = typeof line === 'string' ? line : line.text;
      CI.typewriterText = '';
      CI.typewriterTimer = 0;
      CI.lineLife = (line && line.dur) ? line.dur : 3.0;
    }
  },

  tick(dt) {
    if (!GameState.CINEMATIC_ACTIVE && GameState.STATE !== GameStates.CINEMATIC) return;

    // Smooth letterbox slide in
    if (CI.letterbox < 1) CI.letterbox = Math.min(1, CI.letterbox + dt * 2.0);

    // Typewriter effect
    CI.typewriterTimer += dt;
    const charsPerSec = 36;
    const targetLen = CI.typewriterTarget.length;
    const shownLen = Math.min(targetLen, Math.floor(CI.typewriterTimer * charsPerSec));
    CI.typewriterText = CI.typewriterTarget.substring(0, shownLen);

    // Auto-advance if line duration expires
    if (CI.lineLife > 0) {
      CI.lineLife -= dt;
      if (CI.lineLife <= 0) {
        this.advance();
      }
    }
  },

  draw(ctx) {
    if (!GameState.CINEMATIC_ACTIVE && GameState.STATE !== GameStates.CINEMATIC) return;

    ctx.save();

    // Cinematic Cinemascope Bars
    const barH = 55 * CI.letterbox;
    ctx.fillStyle = 'rgba(0,0,0,0.94)';
    ctx.fillRect(0, 0, LW, barH);
    ctx.fillRect(0, LH - barH, LW, barH);

    // Subtitle / Dialogue text
    if (CI.typewriterText) {
      ctx.font = 'italic 16px Crimson Text, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(CI.typewriterText, LW / 2, LH - barH / 2);
    }

    // Skip prompt
    ctx.font = '10px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(201,168,76,0.6)';
    ctx.fillText('Press [ Enter ] to Advance', LW - 24, LH - 16);

    ctx.restore();
  }
};

export const startIntroCinematic = () => CinematicDirector.startIntro();
export const endIntroCinematic = () => CinematicDirector.endIntro();
export const ciAdvance = () => CinematicDirector.advance();

if (typeof window !== 'undefined') {
  window.startIntroCinematic = startIntroCinematic;
  window.endIntroCinematic = endIntroCinematic;
  window.ciAdvance = ciAdvance;
  Object.defineProperty(window, 'CI', {
    get: () => CI,
    set: (v) => { CI = v; },
    configurable: true
  });
}
