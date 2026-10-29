// =====================================================================
//  DUNGEON BREAK — js/rendering/ParticleRenderer.js
//  Authoritative Particle Physics, Slash Trails, & Floating Combat Text
// =====================================================================

import { GameState } from '../core/GameState.js';
import { T, TARGET_FPS } from '../core/Constants.js';
import { WD } from '../data/weapons.js';

export const FLOATING_TEXTS = [];

export const ParticleRenderer = {
  spawnP(wx, wy, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const ang = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || 6.28) : Math.random() * 6.28;
      const s = (o.spd || 0.5) * (0.5 + Math.random());
      const life = (o.life || 0.5) * (0.7 + Math.random() * 0.6);
      GameState.PRT.push({
        wx,
        wy,
        vx: Math.cos(ang) * s,
        vy: Math.sin(ang) * s,
        life,
        ml: life,
        r: o.r || 3,
        col: o.col || '#ef4444',
        gv: o.gv || 0,
        star: !!o.star
      });
    }
    if (GameState.PRT.length > 250) {
      GameState.PRT.splice(0, GameState.PRT.length - 250);
    }
  },

  spawnRing(wx, wy, col) {
    GameState.SLASH_TRAILS.push({
      wx,
      wy,
      angle: 0,
      life: 0.23,
      ml: 0.23,
      col,
      arc: 6.28,
      range: 0.35,
      slashW: 2,
      slashGlow: 8,
      isRing: true
    });
  },

  spawnSlashTrail(wx, wy, angle, wep) {
    const w = WD[wep] || WD.sword;
    GameState.SLASH_TRAILS.push({
      wx,
      wy,
      angle,
      life: w.trailLen,
      ml: w.trailLen,
      col: w.trailCol,
      arc: w.arc,
      range: w.range,
      slashW: w.slashW,
      slashGlow: w.slashGlow,
      isRing: false
    });
  },

  showFloatingText(text, x, y, col = '#ffffff', sz = 13, isCrit = false) {
    FLOATING_TEXTS.push({
      text,
      x: (x + 0.5) * T + (Math.random() - 0.5) * 8,
      y: (y + 0.2) * T,
      vy: -1.3 - Math.random() * 0.7,
      life: 0.85,
      maxLife: 0.85,
      col,
      sz,
      isCrit,
      scale: 0.75
    });
  },

  tick(dt) {
    // Tick particles
    const prt = GameState.PRT;
    const isDeepFloor = (GameState.LV || 1) >= 4;
    for (let i = prt.length - 1; i >= 0; i--) {
      const p = prt[i];
      // Subtle temporal storytelling: isolated ambient/spark particles exhibit momentary micro-pause before resuming
      let stepDt = dt;
      if (isDeepFloor && (p.isTemporal || (i % 23 === 0 && p.r >= 2))) {
        const pausePhase = Math.sin((p.ml - p.life) * 5.2);
        if (pausePhase > 0.91) {
          stepDt = dt * 0.08;
        }
      }
      p.wx += p.vx * stepDt;
      p.wy += p.vy * stepDt;
      p.vx *= Math.pow(0.88, stepDt * TARGET_FPS);
      p.vy = p.vy * Math.pow(0.90, stepDt * TARGET_FPS) + p.gv * stepDt;
      p.life -= dt;
      if (p.life <= 0) prt.splice(i, 1);
    }

    // Tick slash trails
    const trails = GameState.SLASH_TRAILS;
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].life -= dt;
      if (trails[i].life <= 0) trails.splice(i, 1);
    }

    // Tick floating texts
    for (let i = FLOATING_TEXTS.length - 1; i >= 0; i--) {
      const ft = FLOATING_TEXTS[i];
      ft.life -= dt;
      ft.y += ft.vy * dt * TARGET_FPS;
      ft.scale = Math.min(1.25, ft.scale + dt * 4);
      if (ft.life <= 0) FLOATING_TEXTS.splice(i, 1);
    }
  },

  draw(ctx) {
    // Draw slash trails
    GameState.SLASH_TRAILS.forEach(tr => {
      const t2 = Math.max(0, tr.life / tr.ml);
      const sx = tr.wx * T + T / 2;
      const sy = tr.wy * T + T / 2;
      ctx.save();
      ctx.globalAlpha = t2 * 0.92;
      if (tr.isRing) {
        const rad = (1 - t2) * T * 0.95 + T * 0.18;
        ctx.strokeStyle = tr.col;
        ctx.lineWidth = 2.5 * t2;
        if (!GameState.REDUCED_MOTION && tr.slashGlow) {
          ctx.shadowColor = tr.col;
          ctx.shadowBlur = tr.slashGlow * t2;
        }
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, 6.28);
        ctx.stroke();
      } else if (tr.isSpear || tr.weaponId === 'spear') {
        // SPEAR / TRIDENT: Linear Forward Piercing Corridor Thrust
        const thrustLen = tr.range * T * 0.98;
        const ex = sx + Math.cos(tr.angle) * thrustLen;
        const ey = sy + Math.sin(tr.angle) * thrustLen;

        ctx.strokeStyle = tr.col || '#38bdf8';
        ctx.lineWidth = (tr.slashW || 3.2) * (1 + t2 * 0.7);
        ctx.lineCap = 'round';
        if (!GameState.REDUCED_MOTION && tr.slashGlow) {
          ctx.shadowColor = tr.col || '#38bdf8';
          ctx.shadowBlur = tr.slashGlow * t2;
        }
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Piercing Trident Diamond Head
        const headSz = 6 * (0.8 + t2 * 0.4);
        const normAng = tr.angle + Math.PI / 2;
        const nx = Math.cos(normAng) * headSz * 0.6;
        const ny = Math.sin(normAng) * headSz * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(ex + Math.cos(tr.angle) * headSz, ey + Math.sin(tr.angle) * headSz);
        ctx.lineTo(ex - nx, ey - ny);
        ctx.lineTo(ex - Math.cos(tr.angle) * (headSz * 0.4), ey - Math.sin(tr.angle) * (headSz * 0.4));
        ctx.lineTo(ex + nx, ey + ny);
        ctx.closePath();
        ctx.fill();

        // White specular shaft core
        ctx.globalAlpha = t2 * 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = (tr.slashW || 3.2) * 0.35;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else {
        // SWORD, AXE, DAGGER: Directional Swing Arcs
        const sa = tr.angle - tr.arc / 2;
        const ea = tr.angle + tr.arc / 2;
        const rad = tr.range * T * 0.92;

        ctx.strokeStyle = tr.col;
        ctx.lineWidth = tr.slashW * (1 + t2 * 0.6);
        ctx.lineCap = 'round';
        if (!GameState.REDUCED_MOTION && tr.slashGlow) {
          ctx.shadowColor = tr.col;
          ctx.shadowBlur = tr.slashGlow * t2;
        }
        ctx.beginPath();
        ctx.arc(sx, sy, rad, sa, ea);
        ctx.stroke();

        // Blade Edge Specular Highlight
        ctx.globalAlpha = t2 * 0.55;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, tr.slashW * 0.32);
        if (!GameState.REDUCED_MOTION) ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, sa, ea);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw particles
    GameState.PRT.forEach(p => {
      const t2 = Math.max(0, p.life / p.ml);
      ctx.save();
      ctx.globalAlpha = t2 * 0.85;
      ctx.fillStyle = p.col;
      const sx = p.wx * T + T / 2;
      const sy = p.wy * T + T / 2;

      if (p.star) {
        ctx.translate(sx, sy);
        ctx.rotate(GameState.F * 0.15 + p.ml);
        const r2 = Math.max(0.5, p.r * t2);
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          ctx.lineTo(Math.cos(j * 1.57) * r2, Math.sin(j * 1.57) * r2);
          ctx.lineTo(Math.cos(j * 1.57 + 0.785) * r2 * 0.35, Math.sin(j * 1.57 + 0.785) * r2 * 0.35);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.4, p.r * t2), 0, 6.28);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw floating texts
    FLOATING_TEXTS.forEach(ft => {
      const alpha = Math.min(1, ft.life / 0.28);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = (ft.isCrit ? 'bold ' : '') + Math.round(ft.sz * ft.scale) + 'px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (ft.isCrit) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = ft.col;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
};

export const spawnP = (wx, wy, n, o) => ParticleRenderer.spawnP(wx, wy, n, o);
export const spawnRing = (wx, wy, col) => ParticleRenderer.spawnRing(wx, wy, col);
export const spawnSlashTrail = (wx, wy, ang, wep) => ParticleRenderer.spawnSlashTrail(wx, wy, ang, wep);
export const showFloatingText = (t, x, y, c, s, cr) => ParticleRenderer.showFloatingText(t, x, y, c, s, cr);

if (typeof window !== 'undefined') {
  window.spawnP = spawnP;
  window.spawnRing = spawnRing;
  window.spawnSlashTrail = spawnSlashTrail;
  window.showFloatingText = showFloatingText;
  window.PRT = GameState.PRT;
  window.SLASH_TRAILS = GameState.SLASH_TRAILS;
}
