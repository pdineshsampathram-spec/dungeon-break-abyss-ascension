// =====================================================================
//  DUNGEON BREAK — js/cinematics/MainMenuScene.js
//  Live Dynamic Title Background, Cathedral Ambient Particles, & Bonfire Flicker
// =====================================================================

import { LW, LH } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';

export const MainMenuScene = {
  dustParticles: [],
  torchSparks: [],
  initialized: false,

  init() {
    this.dustParticles = [];
    this.torchSparks = [];
    for (let i = 0; i < 35; i++) {
      this.dustParticles.push({
        x: Math.random() * LW,
        y: Math.random() * LH,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.25 + 0.05,
        r: Math.random() * 2.0 + 0.6
      });
    }
    this.initialized = true;
  },

  tick(dt) {
    if (!this.initialized) this.init();

    // Move ambient cathedral dust
    this.dustParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = LW;
      if (p.x > LW) p.x = 0;
      if (p.y < 0) p.y = LH;
      if (p.y > LH) p.y = 0;
    });

    // Bonfire embers
    if (Math.random() < 0.3) {
      this.torchSparks.push({
        x: LW / 2 + (Math.random() - 0.5) * 160,
        y: LH * 0.72 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2.0 - 0.5,
        life: 1.0,
        col: Math.random() < 0.5 ? '#fde68a' : '#f97316',
        r: Math.random() * 2.5 + 1
      });
    }

    this.torchSparks.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03;
      s.life -= dt * 1.2;
    });
    this.torchSparks = this.torchSparks.filter(s => s.life > 0);
  },

  draw(ctx) {
    if (!this.initialized) this.init();

    // Dark cathedral backdrop
    ctx.fillStyle = '#03050c';
    ctx.fillRect(0, 0, LW, LH);

    // Stone columns and arches
    ctx.fillStyle = '#070b18';
    for (let i = 0; i < Math.ceil(LW / 40) + 1; i++) {
      const bx = i * 40;
      const bh = i % 2 === 0 ? 60 : 40;
      ctx.fillRect(bx, LH - bh, 36, bh);
    }
    ctx.fillRect(0, LH - 30, LW, 30);

    // Warm radial firelight glow from hearth
    const pulse = Math.sin(GameState.F * 0.08) * 0.05 + 0.95;
    const tg = ctx.createRadialGradient(LW / 2, LH * 0.72, 0, LW / 2, LH * 0.72, 320);
    tg.addColorStop(0, `rgba(249,115,22,${0.25 * pulse})`);
    tg.addColorStop(0.5, `rgba(201,168,76,${0.12 * pulse})`);
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, LW, LH);

    // Floating golden embers
    this.torchSparks.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.life * 0.85;
      ctx.fillStyle = s.col;
      ctx.shadowColor = s.col;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * s.life, 0, 6.28);
      ctx.fill();
      ctx.restore();
    });

    // Ambient floating dust
    this.dustParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#c9a84c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.28);
      ctx.fill();
      ctx.restore();
    });
  }
};
