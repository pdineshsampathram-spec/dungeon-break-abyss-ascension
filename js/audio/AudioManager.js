// =====================================================================
//  DUNGEON BREAK — js/audio/AudioManager.js
//  Web Audio API Synthesizer, Dynamic Stems, & Master Sound Engine
// =====================================================================

import { GameState } from '../core/GameState.js';
import { isBossFloor } from '../data/floors.js';

let ctx = null;
let ready = false;
let masterGain = null;
let reverbNode = null;
let hbTimer = 0;

const SND_CD = {
  melee_hit: 0.07, bow_shoot: 0.10, enemy_death: 0.06,
  player_hurt: 0.25, item_pickup: 0.15, portal_enter: 0.8,
  shield_activate: 0.5, boss_roar: 1.2,
  soul_pickup: 0.04, talent_unlock: 0.15, shockwave: 0.25, miniboss_roar: 0.8,
  menu_hover: 0.04, menu_select: 0.10, menu_press: 0.08,
  panel_open: 0.15, panel_close: 0.12, error_disabled: 0.15
};
const SND_LAST = {};

let _masterVolume = 0.8;
let _sfxVolume = 0.8;
let _isMuted = false;

export const SoundManager = {
  init() {
    if (ready) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
      if (!ctx) return;

      masterGain = ctx.createGain();
      this.updateMasterGain();
      masterGain.connect(ctx.destination);

      try {
        const delay = ctx.createDelay(0.5);
        const feedback = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        delay.delayTime.value = 0.22;
        feedback.gain.value = 0.28;
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);
        delay.connect(masterGain);
        reverbNode = delay;
      } catch (e) {
        reverbNode = null;
      }

      ready = true;
    } catch (e) {
      ready = false;
    }
  },

  setMasterVolume(vol) {
    _masterVolume = Math.max(0, Math.min(1, vol));
    this.updateMasterGain();
  },

  getMasterVolume() {
    return _masterVolume;
  },

  setSfxVolume(vol) {
    _sfxVolume = Math.max(0, Math.min(1, vol));
    this.updateMasterGain();
  },

  getSfxVolume() {
    return _sfxVolume;
  },

  setMuted(muted) {
    _isMuted = !!muted;
    this.updateMasterGain();
  },

  isMuted() {
    return _isMuted;
  },

  updateMasterGain() {
    if (!masterGain) return;
    const effective = _isMuted ? 0 : (_masterVolume * _sfxVolume * 0.72);
    try {
      if (ctx && ctx.currentTime) {
        masterGain.gain.setValueAtTime(effective, ctx.currentTime);
      } else {
        masterGain.gain.value = effective;
      }
    } catch (e) {
      masterGain.gain.value = effective;
    }
  },

  playSFX(name) {
    this.snd(name);
  },

  playTone(freq, type, dur, vol, freqEnd) {
    if (!ready || !ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 2200;

      osc.connect(filt);
      filt.connect(gain);
      gain.connect(masterGain);

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + dur);

      const safeVol = Math.min(vol || 0.15, 0.22);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(safeVol, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur + 0.03);
    } catch (e) {}
  },

  snd(name) {
    if (!ready || !ctx) return;
    const now = ctx.currentTime;
    const cd = SND_CD[name] || 0.08;
    if (SND_LAST[name] !== undefined && now - SND_LAST[name] < cd) return;
    SND_LAST[name] = now;

    if (name === 'melee_hit') {
      this.playTone(200, 'sawtooth', 0.07, 0.14, 100);
      setTimeout(() => this.playTone(180, 'sine', 0.05, 0.06), 30);
    } else if (name === 'bow_shoot') {
      this.playTone(900, 'sine', 0.10, 0.10, 450);
    } else if (name === 'enemy_death') {
      this.playTone(170, 'sawtooth', 0.16, 0.16, 55);
      setTimeout(() => this.playTone(80, 'sine', 0.12, 0.08), 60);
    } else if (name === 'player_hurt') {
      this.playTone(150, 'square', 0.13, 0.18, 75);
    } else if (name === 'item_pickup') {
      this.playTone(660, 'sine', 0.06, 0.11);
      setTimeout(() => this.playTone(880, 'sine', 0.06, 0.09), 75);
      setTimeout(() => this.playTone(1100, 'sine', 0.05, 0.07), 140);
    } else if (name === 'portal_enter') {
      this.playTone(440, 'sine', 0.13, 0.13);
      setTimeout(() => this.playTone(660, 'sine', 0.18, 0.13, 880), 140);
      setTimeout(() => this.playTone(1000, 'sine', 0.22, 0.10), 280);
    } else if (name === 'shield_activate') {
      this.playTone(700, 'sine', 0.18, 0.16, 1100);
      setTimeout(() => this.playTone(900, 'sine', 0.15, 0.10, 1300), 100);
    } else if (name === 'boss_roar') {
      this.playTone(55, 'sawtooth', 0.5, 0.20, 35);
      setTimeout(() => this.playTone(80, 'square', 0.3, 0.12, 50), 200);
    } else if (name === 'soul_pickup') {
      this.playTone(880, 'sine', 0.08, 0.12, 1320);
      setTimeout(() => this.playTone(1320, 'sine', 0.07, 0.08, 1760), 40);
    } else if (name === 'talent_unlock') {
      this.playTone(440, 'triangle', 0.12, 0.14);
      setTimeout(() => this.playTone(554, 'triangle', 0.12, 0.14), 75);
      setTimeout(() => this.playTone(659, 'triangle', 0.15, 0.16), 150);
      setTimeout(() => this.playTone(880, 'sine', 0.22, 0.18, 1100), 225);
    } else if (name === 'shockwave') {
      this.playTone(85, 'sawtooth', 0.22, 0.20, 40);
      setTimeout(() => this.playTone(50, 'square', 0.25, 0.16, 25), 45);
    } else if (name === 'miniboss_roar') {
      this.playTone(75, 'sawtooth', 0.45, 0.18, 45);
      setTimeout(() => this.playTone(110, 'square', 0.25, 0.14, 60), 120);
    } else if (name === 'weapon_clang') {
      this.playTone(1200, 'triangle', 0.25, 0.22, 380);
      setTimeout(() => this.playTone(780, 'sine', 0.35, 0.15), 40);
    } else if (name === 'heartbeat') {
      this.playTone(55, 'sine', 0.18, 0.35, 35);
      setTimeout(() => this.playTone(45, 'sine', 0.22, 0.28, 30), 130);
    } else if (name === 'impact_hit') {
      this.playTone(95, 'sawtooth', 0.28, 0.26, 40);
      setTimeout(() => this.playTone(50, 'square', 0.30, 0.22), 30);
    } else if (name === 'footstep') {
      this.playTone(85, 'sine', 0.05, 0.08, 40);
    } else if (name === 'iron_scrape') {
      this.playTone(190, 'sawtooth', 0.14, 0.09, 110);
    } else if (name === 'menu_hover') {
      this.playTone(520, 'sine', 0.045, 0.06, 680);
    } else if (name === 'menu_select' || name === 'menu_press') {
      this.playTone(280, 'triangle', 0.12, 0.15, 140);
      setTimeout(() => this.playTone(560, 'sine', 0.10, 0.10, 720), 25);
    } else if (name === 'panel_open') {
      this.playTone(320, 'sine', 0.15, 0.12, 640);
      setTimeout(() => this.playTone(800, 'triangle', 0.18, 0.08, 960), 40);
    } else if (name === 'panel_close') {
      this.playTone(580, 'sine', 0.13, 0.10, 220);
    } else if (name === 'error_disabled') {
      this.playTone(120, 'square', 0.10, 0.09, 65);
    } else if (name === 'eldritch_whisper') {
      this.playTone(432, 'sine', 0.45, 0.12, 426);
      setTimeout(() => this.playTone(216, 'triangle', 0.60, 0.09, 210), 60);
    } else if (name === 'sanity_drone') {
      this.playTone(42, 'sawtooth', 0.9, 0.18, 36);
      setTimeout(() => this.playTone(55, 'sine', 0.8, 0.14, 48), 120);
    } else if (name === 'eye_awaken') {
      this.playTone(840, 'sine', 0.35, 0.08, 620);
      setTimeout(() => this.playTone(1240, 'sine', 0.25, 0.05), 45);
    } else if (name === 'memory_fracture') {
      this.playTone(110, 'sawtooth', 0.18, 0.22, 45);
      setTimeout(() => this.playTone(420, 'square', 0.12, 0.14, 80), 30);
    } else if (name === 'campfire_crackle') {
      const crackFreq = 1600 + Math.random() * 800;
      this.playTone(crackFreq, 'triangle', 0.035, 0.045, crackFreq * 0.4);
      if (Math.random() > 0.5) {
        setTimeout(() => this.playTone(crackFreq * 0.7, 'square', 0.025, 0.03), 20);
      }
    } else if (name === 'reality_snap') {
      this.playTone(75, 'sawtooth', 0.4, 0.32, 28);
      setTimeout(() => this.playTone(920, 'square', 0.18, 0.22, 140), 20);
      setTimeout(() => this.playTone(2400, 'triangle', 0.12, 0.16, 380), 40);
    } else if (name === 'battlefield_roar') {
      this.playTone(45, 'sawtooth', 0.85, 0.26, 32);
      setTimeout(() => this.playTone(68, 'square', 0.65, 0.18, 40), 100);
      setTimeout(() => this.playTone(110, 'sine', 0.50, 0.14, 55), 220);
    } else if (name === 'void_swell') {
      this.playTone(55, 'sine', 1.5, 0.24, 110);
      setTimeout(() => this.playTone(82.5, 'triangle', 1.2, 0.16, 165), 180);
    } else if (name === 'outside_breeze') {
      this.playTone(180, 'sine', 1.2, 0.08, 90);
      setTimeout(() => this.playTone(120, 'triangle', 1.4, 0.06, 60), 200);
    } else if (name === 'birds_ambient') {
      const bFreq = 2200 + Math.random() * 800;
      this.playTone(bFreq, 'sine', 0.09, 0.05, bFreq + 400);
      setTimeout(() => this.playTone(bFreq + 500, 'sine', 0.07, 0.04, bFreq + 200), 80);
      setTimeout(() => this.playTone(bFreq + 300, 'sine', 0.11, 0.05, bFreq - 150), 160);
    } else if (name === 'crowd_cheer') {
      this.playTone(330, 'triangle', 0.8, 0.12, 392);
      setTimeout(() => this.playTone(440, 'sine', 0.9, 0.14, 523), 60);
      setTimeout(() => this.playTone(523, 'triangle', 0.7, 0.11, 659), 120);
      setTimeout(() => this.playTone(659, 'sine', 0.85, 0.13, 784), 180);
    } else if (name === 'royal_fanfare') {
      this.playTone(261.6, 'triangle', 0.25, 0.18);
      setTimeout(() => this.playTone(329.6, 'triangle', 0.25, 0.18), 160);
      setTimeout(() => this.playTone(392.0, 'triangle', 0.35, 0.20), 320);
      setTimeout(() => this.playTone(523.2, 'sawtooth', 0.65, 0.22, 659.2), 520);
    } else if (name === 'ominous_drone') {
      this.playTone(38, 'sawtooth', 1.8, 0.26, 32);
      setTimeout(() => this.playTone(44, 'sine', 1.6, 0.22, 36), 140);
    } else if (name === 'eye_blink') {
      this.playTone(360, 'sine', 0.08, 0.22, 90);
      setTimeout(() => this.playTone(180, 'triangle', 0.06, 0.18, 50), 30);
    } else if (name === 'trap_click') {
      this.playTone(940, 'triangle', 0.045, 0.15, 380);
      setTimeout(() => this.playTone(480, 'sine', 0.035, 0.10, 220), 20);
    } else if (name === 'flame_ignite') {
      this.playTone(140, 'triangle', 0.20, 0.18, 340);
      setTimeout(() => this.playTone(260, 'sine', 0.25, 0.14, 110), 35);
    }
  },

  // Deprecated monolith oscillator layers — completely removed in favor of authoritative MusicManager MP3 themes
  _startLayer(name) {},
  updateMusicLayers(dt) {},
  setLayer(name, vol) {},

  tickHeartbeat(dt) {
    if (!ready || GameState.P.san > 30) { hbTimer = 0; return; }
    const interval = Math.max(0.20, GameState.P.san / 120);
    hbTimer = Math.max(0, hbTimer) + dt;
    if (hbTimer >= interval) {
      hbTimer = 0;
      this.playTone(58, 'sine', 0.16, 0.06, 38);
    }
  },

  playSFX(name) {
    this.snd(name);
  }
};

export const AudioManager = SoundManager;

if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
}
