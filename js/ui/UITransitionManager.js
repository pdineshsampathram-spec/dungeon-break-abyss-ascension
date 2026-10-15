// =====================================================================
//  DUNGEON BREAK — js/ui/UITransitionManager.js
//  Cinematic Crossfades, State Dissolves, & Seamless UI Transitions
// =====================================================================

import { LW, LH } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';

let _phase = 'idle'; // 'idle', 'fading_out', 'fading_in'
let _progress = 0;   // 0 to 1
let _duration = 0.35;
let _onMidpoint = null;
let _onComplete = null;
let _color = '#02040a';

export const UITransitionManager = {
  transitionTo(callback, duration = 0.35, color = '#02040a') {
    _phase = 'fading_out';
    _progress = 0;
    _duration = Math.max(0.1, duration);
    _color = color;
    _onMidpoint = callback;
    _onComplete = null;
  },

  fadeAndExecute(onMidpoint, onComplete, duration = 0.35, color = '#02040a') {
    _phase = 'fading_out';
    _progress = 0;
    _duration = Math.max(0.1, duration);
    _color = color;
    _onMidpoint = onMidpoint;
    _onComplete = onComplete;
  },

  reset() {
    _phase = 'idle';
    _progress = 0;
    _onMidpoint = null;
    _onComplete = null;
  },

  isTransitioning() {
    return _phase !== 'idle';
  },

  tick(dt = 0.016) {
    if (_phase === 'idle') return;

    _progress += dt / (_duration * 0.5);

    if (_phase === 'fading_out') {
      if (_progress >= 1.0) {
        _progress = 1.0;
        const cb = _onMidpoint;
        _onMidpoint = null;
        _phase = 'fading_in';
        if (cb) {
          try {
            cb();
          } catch (e) {
            console.error('UITransitionManager midpoint error:', e);
          }
        }
      }
    } else if (_phase === 'fading_in') {
      if (_progress >= 2.0) {
        _phase = 'idle';
        _progress = 0;
        if (_onComplete) {
          try {
            _onComplete();
          } catch (e) {
            console.error('UITransitionManager complete error:', e);
          }
          _onComplete = null;
        }
      }
    }
  },

  draw(ctx) {
    if (_phase === 'idle') return;

    let alpha = 0;
    if (_phase === 'fading_out') {
      alpha = Math.min(1, Math.max(0, _progress));
    } else if (_phase === 'fading_in') {
      alpha = Math.min(1, Math.max(0, 2.0 - _progress));
    }

    if (alpha <= 0.001) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = _color;
    ctx.fillRect(0, 0, LW, LH);

    // Subtle dark fantasy vignette at the edge of the transition
    const vig = ctx.createRadialGradient(LW / 2, LH / 2, LH * 0.3, LW / 2, LH / 2, LW * 0.7);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, LW, LH);

    ctx.restore();
  }
};

if (typeof window !== 'undefined') {
  window.UITransitionManager = UITransitionManager;
}
