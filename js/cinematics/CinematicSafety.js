// =====================================================================
//  DUNGEON BREAK — js/cinematics/CinematicSafety.js
//  CENTRAL CINEMATIC INPUT SAFETY, 3.0-SECOND PROTECTION & SAFE REPLAY CONTEXT
//
//  Responsibilities:
//  1. Central 3.0-second unskippable window based on REAL elapsed time (performance.now()),
//     unaffected by gameSpeed (0.5x or 2.0x).
//  2. Input Buffer Cleansing: Purges attack/movement/dash buffers on cinematic start.
//  3. Held-key protection: Keys held before/during the 3.0s window cannot skip.
//     Only a fresh intentional keydown after 3.0s is accepted.
//  4. Pointer/click protection: Clicks during the 3.0s window are strictly ignored.
//  5. Safe Replay Context: Presentation-only replay without gameplay side effects,
//     returning cleanly to the Cinematic Archive upon completion or skip.
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { InputManager } from '../core/InputManager.js';

let _activeCinematicId = null;
let _cinematicStartRealTime = 0;
let _isReplayMode = false;
let _onReplayComplete = null;
let _initialHeldKeys = new Set();
let _keysPressedDuringProtectedWindow = new Set();
let _lastSkipInputRealTime = 0;

export const CinematicSafety = {
  /**
   * Called at the exact moment any skippable or story cinematic begins.
   * Purges gameplay buffers and arms the 3.0s protection window.
   */
  startCinematic(cinematicId, options = {}) {
    _activeCinematicId = cinematicId;
    _cinematicStartRealTime = performance.now();
    _isReplayMode = !!options.isReplay;
    _onReplayComplete = options.onComplete || null;
    _initialHeldKeys.clear();
    _keysPressedDuringProtectedWindow.clear();
    _lastSkipInputRealTime = 0;

    // Snapshot any keys currently held down in InputManager so they cannot trigger skips
    if (InputManager && InputManager.INPUT_KEYS) {
      for (const k in InputManager.INPUT_KEYS) {
        if (InputManager.INPUT_KEYS[k]) {
          _initialHeldKeys.add(k);
        }
      }
    }

    // Purge player attack, movement, dash, and weapon buffers
    const P = GameState.P;
    if (P) {
      P.attacking = false;
      P.dashing = false;
      P.vx = 0;
      P.vy = 0;
      P.bufferedAttack = false;
      P.bufferedSpecial = false;
      P.attackCooldown = 0;
      P.bowDraw = 0;
    }
    if (InputManager && InputManager.MOUSE_STATE) {
      InputManager.MOUSE_STATE.isDown = false;
    }

    console.log(`[CinematicSafety] Cinematic started: ${cinematicId} (Replay: ${_isReplayMode})`);
  },

  /**
   * Real elapsed playback time in seconds (immune to simulation gameSpeed).
   */
  getRealElapsed() {
    if (!_cinematicStartRealTime) return 0;
    return (performance.now() - _cinematicStartRealTime) / 1000;
  },

  /**
   * Whether the cinematic has surpassed the 3.0-second unskippable window.
   */
  canSkip() {
    return this.getRealElapsed() >= 3.0;
  },

  /**
   * Returns true if skip hints should be rendered.
   * Visible skip hint must not suggest skipping before the protection window ends.
   */
  shouldShowSkipHint() {
    return this.canSkip();
  },

  /**
   * Whether the active cinematic is playing in safe presentation-only replay mode.
   */
  isReplay() {
    return _isReplayMode;
  },

  getActiveCinematicId() {
    return _activeCinematicId;
  },

  /**
   * Keyup tracker to release keys that were held before or during the 3.0s window.
   */
  handleKeyUp(k, c) {
    if (k) {
      _initialHeldKeys.delete(k);
      _initialHeldKeys.delete(k.toLowerCase());
      _initialHeldKeys.delete(k.toUpperCase());
      _keysPressedDuringProtectedWindow.delete(k);
      _keysPressedDuringProtectedWindow.delete(k.toLowerCase());
      _keysPressedDuringProtectedWindow.delete(k.toUpperCase());
    }
    if (c) {
      _initialHeldKeys.delete(c);
      _keysPressedDuringProtectedWindow.delete(c);
    }
  },

  /**
   * Central skip validator for keyboard events.
   * Returns true if and only if this is a fresh, deliberate keypress AFTER 3.0 seconds.
   */
  isValidSkipKey(k, c) {
    const elapsed = this.getRealElapsed();

    // 1. If still within the 3.0s protected window, record key as pressed during window and reject
    if (elapsed < 3.0) {
      if (k) _keysPressedDuringProtectedWindow.add(k);
      if (c) _keysPressedDuringProtectedWindow.add(c);
      return false;
    }

    // 2. Reject keys that were held before cinematic started
    if ((k && _initialHeldKeys.has(k)) || (c && _initialHeldKeys.has(c))) {
      return false;
    }

    // 3. Reject keys that were pressed during the 3.0s window and held continuously
    if ((k && _keysPressedDuringProtectedWindow.has(k)) || (c && _keysPressedDuringProtectedWindow.has(c))) {
      return false;
    }

    // 4. Rate-limit repeated skip requests (minimum 250ms debounce)
    const now = performance.now();
    if (now - _lastSkipInputRealTime < 250) {
      return false;
    }
    _lastSkipInputRealTime = now;

    return true;
  },

  /**
   * Central skip validator for mouse/pointer clicks.
   * Returns true if and only if click occurred after 3.0 seconds.
   */
  isValidSkipClick() {
    const elapsed = this.getRealElapsed();
    if (elapsed < 3.0) return false;

    const now = performance.now();
    if (now - _lastSkipInputRealTime < 250) {
      return false;
    }
    _lastSkipInputRealTime = now;
    return true;
  },

  /**
   * Safely completes or exits a cinematic in replay mode.
   * Returns true if replay mode was handled, false if this was a normal live run.
   */
  finishReplay() {
    if (typeof window !== 'undefined' && window.CinematicReplayContext && window.CinematicReplayContext.isReplaying()) {
      return window.CinematicReplayContext.finishReplay();
    }
    if (!_isReplayMode) return false;

    console.log(`[CinematicSafety] Replay finished: ${_activeCinematicId}. Returning to Archive.`);
    _isReplayMode = false;
    _cinematicStartRealTime = 0;
    _activeCinematicId = null;

    if (typeof _onReplayComplete === 'function') {
      const cb = _onReplayComplete;
      _onReplayComplete = null;
      cb();
    } else if (typeof window !== 'undefined' && window.CinematicArchiveUI && window.CinematicArchiveUI.open) {
      window.CinematicArchiveUI.open();
    } else {
      GameState.setState(GameStates.TITLE);
    }

    return true;
  },

  /**
   * Resets safety state.
   */
  reset() {
    _activeCinematicId = null;
    _cinematicStartRealTime = 0;
    _isReplayMode = false;
    _onReplayComplete = null;
    _initialHeldKeys.clear();
    _keysPressedDuringProtectedWindow.clear();
    _lastSkipInputRealTime = 0;
  }
};

// Global keyup listener to ensure held keys are cleared when released
if (typeof window !== 'undefined') {
  window.addEventListener('keyup', (e) => {
    CinematicSafety.handleKeyUp(e.key, e.code);
  }, { passive: true });

  window.CinematicSafety = CinematicSafety;
}
