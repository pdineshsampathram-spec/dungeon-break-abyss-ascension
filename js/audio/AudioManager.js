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

const layers = {
  ambient: { gain: null, osc: null, target: 0, current: 0 },
  combat:  { gain: null, osc: null, target: 0, current: 0 },
  boss:    { gain: null, osc: null, target: 0, current: 0 },
  tension: { gain: null, osc: null, target: 0, current: 0 },
};

const SND_CD = {
  melee_hit: 0.07, bow_shoot: 0.10, enemy_death: 0.06,
  player_hurt: 0.25, item_pickup: 0.15, portal_enter: 0.8,
  shield_activate: 0.5, boss_roar: 1.2,
  soul_pickup: 0.04, talent_unlock: 0.15, shockwave: 0.25, miniboss_roar: 0.8
};
const SND_LAST = {};

export const SoundManager = {
  init() {
    if (ready) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
      if (!ctx) return;

      masterGain = ctx.createGain();
      masterGain.gain.value = 0.72;
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

      Object.keys(layers).forEach(name => {
        const g = ctx.createGain();
        g.gain.value = 0;
        g.connect(masterGain);
        layers[name].gain = g;
      });

      ready = true;
    } catch (e) {
      ready = false;
    }
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
    }
  },

  _startLayer(name) {
    if (!ready || layers[name].osc) return;
    const layer = layers[name];
    try {
      const freqs = { ambient: 55, combat: 110, boss: 40, tension: 220 };
      const types = { ambient: 'sawtooth', combat: 'square', boss: 'sawtooth', tension: 'sine' };
      const detunes = { ambient: 0, combat: 7, boss: -5, tension: 3 };

      const osc1 = ctx.createOscillator();
      const filtNode = ctx.createBiquadFilter();
      filtNode.type = 'lowpass';
      filtNode.frequency.value = name === 'ambient' ? 400 : name === 'boss' ? 300 : 600;
      filtNode.Q.value = 0.7;

      osc1.type = types[name];
      osc1.frequency.value = freqs[name];
      osc1.detune.value = detunes[name];
      osc1.connect(filtNode);
      filtNode.connect(layer.gain);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freqs[name] * 1.5;
      osc2.detune.value = detunes[name] - 3;
      const g2 = ctx.createGain();
      g2.gain.value = 0.3;
      osc2.connect(g2);
      g2.connect(layer.gain);

      if (name === 'ambient' && reverbNode) {
        const reverbSend = ctx.createGain();
        reverbSend.gain.value = 0.18;
        filtNode.connect(reverbSend);
        reverbSend.connect(reverbNode);
      }

      osc1.start();
      osc2.start();
      layer.osc = { stop: () => { try { osc1.stop(); osc2.stop(); } catch (e) {} } };
    } catch (e) {
      layer.osc = null;
    }
  },

  updateMusicLayers(dt) {
    if (!ready || !ctx) return;

    const { P, ENE, BOSS, LV } = GameState;
    const inCombat = ENE && ENE.some(e => e.alive && Math.hypot(P.x - e.x, P.y - e.y) < 8);
    const bossActive = isBossFloor(LV) && BOSS && BOSS.alive;
    const lowSan = P.san < 35;

    const targets = {
      ambient: bossActive ? 0.012 : 0.022,
      combat:  (inCombat && !bossActive) ? 0.028 : 0,
      boss:    bossActive ? 0.038 : 0,
      tension: lowSan ? 0.020 : 0,
    };

    const fadeSpeed = dt * 1.8;

    Object.keys(layers).forEach(name => {
      const layer = layers[name];
      const tgt = targets[name];

      if (tgt > 0 && !layer.osc) this._startLayer(name);

      if (layer.gain) {
        const cur = layer.gain.gain.value;
        const next = cur + (tgt - cur) * Math.min(1, fadeSpeed);
        layer.gain.gain.value = Math.max(0, Math.min(0.06, next));
        layer.current = next;
      }
    });
  },

  setLayer(name, vol) {
    if (layers[name]) {
      layers[name].target = vol;
    }
  },

  tickHeartbeat(dt) {
    if (!ready || GameState.P.san > 30) { hbTimer = 0; return; }
    const interval = Math.max(0.20, GameState.P.san / 120);
    hbTimer = Math.max(0, hbTimer) + dt;
    if (hbTimer >= interval) {
      hbTimer = 0;
      this.playTone(58, 'sine', 0.16, 0.06, 38);
    }
  }
};

export const AudioManager = SoundManager;

if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
}
