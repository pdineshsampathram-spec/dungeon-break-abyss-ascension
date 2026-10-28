// =====================================================================
//  DUNGEON BREAK — js/audio/MusicManager.js
//  Authoritative Local Music Director:
//  - 7 Actual Local MP3 Themes (Menu, Exploration, Combat, High-Threat, 3 Bosses)
//  - Seamless Dual-Bus Crossfading & Volume Management
//  - Autoplay Policy Unlock on First Gesture
//  - State-Driven Gameplay Music Controller
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { isBossFloor } from '../data/floors.js';

export const MUSIC_TRACKS = {
  menu: './Background themes/Cathedral of Deep Navy.mp3',
  exploration: './Background themes/Untitled.mp3',
  combat: './Background themes/Ostinato di Ombra.mp3',
  highThreat: './Background themes/The Shadow\'s Toll.mp3',
  gorgaroth: './Background themes/Iron Chains of the Dark.mp3',
  boss_gorgaroth: './Background themes/Iron Chains of the Dark.mp3',
  malakor: './Background themes/Void Motif.mp3',
  boss_malakor: './Background themes/Void Motif.mp3',
  warden: './Background themes/The Ruler\'s Burden.mp3',
  boss_warden: './Background themes/The Ruler\'s Burden.mp3',
  credits: './Background themes/Void Motif.mp3',
  shatteredMind: './Background themes/Void Motif.mp3',
  heroEnding: './Background themes/wizard-2bfe5a8ff3d34ffab6cd0f6158393611-00-TRACK_01-audio_base64-82e2453909674687.wav',
  hero: './Background themes/wizard-2bfe5a8ff3d34ffab6cd0f6158393611-00-TRACK_01-audio_base64-82e2453909674687.wav',
  betrayal: './Background themes/Last_Steps_on_Cold_Stone.mp3',
  betrayalEnding: './Background themes/Last_Steps_on_Cold_Stone.mp3',
  rampage: './Background themes/Last_Steps_on_Cold_Stone.mp3',
  rampageEnding: './Background themes/Last_Steps_on_Cold_Stone.mp3'
};

let _masterVolume = 0.80;
let _musicVolume = 0.70;
let _isMuted = false;
let _currentTrackKey = null;
let _pendingTrack = null;
let _unlocked = false;

// Dual audio busses for seamless crossfading
let _primaryAudio = null;
let _secondaryAudio = null;

let _activeBus = 'primary'; // 'primary' or 'secondary'
let _fadeTimer = 0;
let _fadeDuration = 1.5;
let _targetVolume = 0.68;
let _isFading = false;
let _combatDebounceTimer = 0;

function createAudioBus() {
  const a = new Audio();
  a.preload = 'auto';
  a.loop = true;
  a.volume = 0;
  return a;
}

function unlockAudio() {
  _unlocked = true;
  if (_pendingTrack) {
    const t = _pendingTrack;
    _pendingTrack = null;
    MusicManager.play(t.key, t.opts);
  } else if (_currentTrackKey) {
    const active = _activeBus === 'primary' ? _primaryAudio : _secondaryAudio;
    if (active && active.paused) {
      active.play().catch(() => {});
    }
  } else if (typeof GameState !== 'undefined' && GameState.STATE === GameStates.TITLE) {
    MusicManager.fadeIn('menu', 1.2, 0.70);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

export const MusicManager = {
  init() {
    if (!_primaryAudio) _primaryAudio = createAudioBus();
    if (!_secondaryAudio) _secondaryAudio = createAudioBus();
  },

  applyVolume() {
    const active = _activeBus === 'primary' ? _primaryAudio : _secondaryAudio;
    if (active && !_isFading) {
      const scale = _isMuted ? 0 : (_masterVolume * _musicVolume);
      active.volume = Math.max(0, Math.min(1, _targetVolume * scale));
    }
  },

  setMasterVolume(vol) {
    _masterVolume = Math.max(0, Math.min(1, vol));
    this.applyVolume();
  },

  getMasterVolume() {
    return _masterVolume;
  },

  setMusicVolume(vol) {
    _musicVolume = Math.max(0, Math.min(1, vol));
    this.applyVolume();
  },

  getMusicVolume() {
    return _musicVolume;
  },

  setMuted(muted) {
    _isMuted = !!muted;
    this.applyVolume();
  },

  isMuted() {
    return _isMuted;
  },

  isUnlocked() {
    return _unlocked;
  },

  getCurrentTrack() {
    return _currentTrackKey;
  },

  play(trackKey, { loop = true, fade = 1.5, volume = 0.68 } = {}) {
    this.init();

    if (!_unlocked) {
      _pendingTrack = { key: trackKey, opts: { loop, fade, volume } };
      return;
    }

    if (_currentTrackKey === trackKey && !_isFading) {
      return; // Already playing this track
    }

    const src = MUSIC_TRACKS[trackKey];
    if (!src) {
      console.warn(`[MusicManager] Unknown track key: ${trackKey}`);
      return;
    }

    _currentTrackKey = trackKey;
    _targetVolume = volume;
    _fadeDuration = Math.max(0.1, fade);
    _fadeTimer = 0;
    _isFading = true;

    // Flip busses: fading out the old, fading in the new
    const incomingBus = _activeBus === 'primary' ? _secondaryAudio : _primaryAudio;
    const outgoingBus = _activeBus === 'primary' ? _primaryAudio : _secondaryAudio;
    _activeBus = _activeBus === 'primary' ? 'secondary' : 'primary';

    try {
      incomingBus.src = src;
      incomingBus.loop = loop;
      incomingBus.volume = 0;
      const playPromise = incomingBus.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Autoplay or decode issue
          console.warn('[MusicManager] Autoplay prevented or track load failed:', err.message);
        });
      }
    } catch (e) {
      console.warn('[MusicManager] Error playing track:', e);
    }
  },

  crossfade(toTrackKey, duration = 1.5, volume = 0.68) {
    this.play(toTrackKey, { loop: true, fade: duration, volume });
  },

  fadeIn(trackKey, duration = 2.0, volume = 0.68) {
    this.play(trackKey, { loop: true, fade: duration, volume });
  },

  fadeOut(duration = 1.5) {
    _currentTrackKey = null;
    _fadeDuration = Math.max(0.1, duration);
    _fadeTimer = 0;
    _isFading = true;
    _targetVolume = 0;
  },

  stop(duration = 0.8) {
    this.fadeOut(duration);
  },

  stopImmediate() {
    _currentTrackKey = null;
    _pendingTrack = null;
    _isFading = false;
    _fadeTimer = 0;
    [_primaryAudio, _secondaryAudio].forEach(bus => {
      if (bus) {
        try {
          bus.pause();
          bus.currentTime = 0;
          bus.volume = 0;
        } catch (e) {}
      }
    });
  },

  update(dt = 0.016) {
    if (!this.init) return;
    this.init();

    // 1. Handle Smooth Crossfading / Volume Interpolation
    if (_isFading) {
      _fadeTimer += dt;
      const progress = Math.min(1, _fadeTimer / _fadeDuration);

      const incoming = _activeBus === 'primary' ? _primaryAudio : _secondaryAudio;
      const outgoing = _activeBus === 'primary' ? _secondaryAudio : _primaryAudio;

      const scale = _isMuted ? 0 : (_masterVolume * _musicVolume);
      if (incoming && incoming.src) {
        incoming.volume = Math.max(0, Math.min(1, progress * _targetVolume * scale));
      }
      if (outgoing && outgoing.src) {
        outgoing.volume = Math.max(0, Math.min(1, (1 - progress) * scale));
      }

      if (progress >= 1) {
        _isFading = false;
        if (outgoing) {
          try {
            outgoing.pause();
            outgoing.currentTime = 0;
          } catch (e) {}
        }
      }
    }

    // 2. Authoritative Gameplay Music Director
    const state = GameState.STATE;

    if (state === GameStates.TITLE) {
      const active = _activeBus === 'primary' ? _primaryAudio : _secondaryAudio;
      const isPaused = !active || active.paused;
      if (_currentTrackKey !== 'menu' || (_unlocked && isPaused && !_isFading)) {
        const outgoingBus = _activeBus === 'primary' ? _primaryAudio : _secondaryAudio;
        if (outgoingBus && _currentTrackKey !== 'menu') {
          try {
            outgoingBus.pause();
            outgoingBus.currentTime = 0;
            outgoingBus.volume = 0;
          } catch (e) {}
        }
        this.fadeIn('menu', 1.2, 0.70);
      }
      return;
    }

    if (state === GameStates.CINEMATIC || state === GameStates.BOSS_DEFEAT_CINEMATIC || state === 'boss_defeat_cinematic') {
      // Handled explicitly by CinematicDirector / WardenDefeatCinematic / EndingCinematics
      return;
    }

    if (state === GameStates.CREDITS || state === 'credits') {
      if (typeof window !== 'undefined' && window.Credits && window.Credits.musicSilenced) {
        return;
      }
      if (_currentTrackKey !== 'credits') {
        this.fadeIn('credits', 2.0, 0.65);
      }
      return;
    }

    if (state === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
      // Handled explicitly by ShatteredMindCinematic with specialized volume dynamics
      return;
    }

    if (state === GameStates.DYING || state === GameStates.DEATH_NORMAL || state === GameStates.DEATH_RESULTS) {
      if (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isFinished() && _currentTrackKey === 'shatteredMind') {
        return; // Preserve haunting Shattered Mind ending music on the End Card
      }
      if (_currentTrackKey !== null && !_isFading) {
        this.fadeOut(0.8);
      }
      return;
    }

    if (state === GameStates.BOSS_INTRO) {
      const lv = GameState.LV || 1;
      let bossKey = 'gorgaroth';
      if (lv >= 10) bossKey = 'warden';
      else if (lv >= 6) bossKey = 'malakor';

      if (_currentTrackKey !== bossKey) {
        this.crossfade(bossKey, 1.2, 0.78);
      }
      return;
    }

    if (state === GameStates.PLAYING) {
      const { P, ENE, BOSS, LV } = GameState;
      const bossActive = isBossFloor(LV) && BOSS && BOSS.alive;

      if (bossActive) {
        let bossKey = 'gorgaroth';
        if (LV >= 10) bossKey = 'warden';
        else if (LV >= 6) bossKey = 'malakor';

        if (_currentTrackKey !== bossKey) {
          this.crossfade(bossKey, 1.5, 0.78);
        }
        return;
      }

      // Check combat proximity
      const inCombat = P && ENE && ENE.some(e => e.alive && Math.hypot(P.x - e.x, P.y - e.y) < 8.5);
      const isHighThreat = inCombat && (LV >= 7 || (ENE && ENE.some(e => e.alive && e.elite)));

      if (inCombat) {
        _combatDebounceTimer = 3.5; // Stay in combat music for at least 3.5s after battle
        const targetTrack = isHighThreat ? 'highThreat' : 'combat';
        if (_currentTrackKey !== targetTrack && _currentTrackKey !== 'highThreat') {
          this.crossfade(targetTrack, 1.2, 0.68);
        }
      } else {
        if (_combatDebounceTimer > 0) {
          _combatDebounceTimer -= dt;
        } else {
          // Return to serene / eerie exploration music
          if (_currentTrackKey !== 'exploration') {
            this.crossfade('exploration', 2.0, 0.65);
          }
        }
      }
    }
  },

  getBuses() {
    return {
      activeBus: _activeBus,
      primary: _primaryAudio ? { src: _primaryAudio.src, paused: _primaryAudio.paused, volume: _primaryAudio.volume, currentTime: _primaryAudio.currentTime, readyState: _primaryAudio.readyState, error: _primaryAudio.error } : null,
      secondary: _secondaryAudio ? { src: _secondaryAudio.src, paused: _secondaryAudio.paused, volume: _secondaryAudio.volume, currentTime: _secondaryAudio.currentTime, readyState: _secondaryAudio.readyState, error: _secondaryAudio.error } : null,
      isFading: _isFading,
      targetVolume: _targetVolume,
      unlocked: _unlocked,
      currentTrackKey: _currentTrackKey
    };
  }
};

if (typeof window !== 'undefined') {
  window.MusicManager = MusicManager;
}
