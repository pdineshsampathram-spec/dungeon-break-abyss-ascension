// =====================================================================
//  DUNGEON BREAK — js/rendering/CharacterRenderer.js
//  Authoritative Character Rendering: Lord Rowan, Enemies, Bosses, & NPCs
// =====================================================================

import { GameState } from '../core/GameState.js';
import { T } from '../core/Constants.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';

export const CharacterRenderer = {
  drawPlayer(ctx) {
    const { P } = GameState;
    const pp = (P.x + 0.5) * T;
    const pq = (P.y + 0.5) * T;
    const state = P.animState || 'idle';
    const breath = Math.sin(P.breathCycle || 0) * 0.6;
    const bodyBob = state === 'walk' ? Math.sin(P.walkCycle || 0) * 1.4 : breath * 0.5;
    const isDead = P.dead;

    // Shield aura
    if (P.shieldActive) {
      const sp = Math.sin(GameState.F * 0.12) * 0.35 + 0.65;
      ctx.save();
      ctx.globalAlpha = 0.32 * sp;
      const shieldGrad = ctx.createRadialGradient(pp, pq, T * 0.2, pp, pq, T * 0.6);
      shieldGrad.addColorStop(0, 'rgba(103,232,249,0.5)');
      shieldGrad.addColorStop(1, 'rgba(14,165,233,0)');
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(pp, pq, T * 0.6, 0, 6.28);
      ctx.fill();
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.55 * sp;
      ctx.beginPath();
      ctx.arc(pp, pq, T * 0.52, 0, 6.28);
      ctx.stroke();
      ctx.restore();
    }

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(pp, pq + 14, 9, 4, 0, 0, 6.28);
    ctx.fill();

    // Fallen death
    if (isDead) {
      ctx.save();
      ctx.translate(pp, pq + 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -5, 24, 12);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-12, -5, 24, 5);
      ctx.restore();
      return;
    }

    // Hit flash
    if (P.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, P.hitFlash / 0.23) * 0.45;
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(pp, pq, T * 0.38, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(pp, pq + bodyBob);

    // Cape
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(6, -2);
    ctx.lineTo(8, 14);
    ctx.lineTo(-8, 14);
    ctx.closePath();
    ctx.fill();

    // Steel Plate Armor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7, -4, 14, 14);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -3, 12, 5);

    // Gold Trim
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-7, 2, 14, 2);

    // Visored Helmet
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -9, 6.5, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = '#38bdf8'; // Glowing blue visor slit
    ctx.fillRect(P.fx >= 0 ? -1 : -4, -10, 5, 2);

    // Equipped Weapon in hand
    const activeW = WeaponInventory.getActiveWeapon();
    const wCol = activeW ? activeW.col : '#facc15';
    ctx.save();
    ctx.translate(P.fx * 9, 2);
    ctx.rotate(Math.atan2(P.fy, P.fx));
    ctx.fillStyle = wCol;
    ctx.fillRect(0, -1.5, 9, 3);
    ctx.restore();

    ctx.restore();
  },

  drawEnemy(ctx, e) {
    if (!e) return;
    const px = (e.x + 0.5) * T;
    const py = (e.y + 0.5) * T;
    const bob = Math.sin(GameState.F * 0.14 + e.ph) * 1.5;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px, py + 12, 9, 4, 0, 0, 6.28);
    ctx.fill();

    if (!e.alive) {
      // Fallen corpse
      ctx.save();
      ctx.globalAlpha = Math.max(0, e.dAnim / 0.45);
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 8, py + 4, 16, 6);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(px, py + bob);

    if (e.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = e.type === 'skeleton' ? '#94a3b8' :
                      e.type === 'ghoul' ? '#4ade80' :
                      e.type === 'demon' ? '#f87171' :
                      e.type === 'wraith' ? '#c084fc' : '#ef4444';
    }

    // Creature body
    ctx.beginPath();
    ctx.arc(0, -2, 7, 0, 6.28);
    ctx.fill();

    // Eyes
    ctx.fillStyle = e.type === 'demon' ? '#ea580c' : '#ffffff';
    ctx.beginPath();
    ctx.arc(-2.5, -3, 1.5, 0, 6.28);
    ctx.arc(2.5, -3, 1.5, 0, 6.28);
    ctx.fill();

    ctx.restore();

    // HP Bar
    if (e.maxHp > 1 && e.hp < e.maxHp) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 11, py - 16, 22, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px - 11, py - 16, 22 * (e.hp / e.maxHp), 3);
    }
  },

  drawBoss(ctx, boss) {
    if (!boss) return;
    const px = (boss.x + 0.5) * T;
    const py = (boss.y + 0.5) * T;
    const bob = Math.sin(GameState.F * 0.08) * 3;

    // Colossal shadow
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(px, py + 26, 26, 10, 0, 0, 6.28);
    ctx.fill();

    if (!boss.alive) return;

    ctx.save();
    ctx.translate(px, py + bob);

    // Boss Body
    ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' :
                    boss.type === 'iron_warden' ? '#fb923c' :
                    boss.type === 'void_reaver' ? '#a855f7' : '#ef4444';

    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, 6.28);
    ctx.fill();

    // Crown / Horns
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-16, -14);
    ctx.lineTo(0, -32);
    ctx.lineTo(16, -14);
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(-8, -4, 4, 0, 6.28);
    ctx.arc(8, -4, 4, 0, 6.28);
    ctx.fill();

    ctx.restore();
  }
};

export const AnimSystem = {
  drawPlayer: () => CharacterRenderer.drawPlayer(window.CX),
  drawEnemy: (e) => CharacterRenderer.drawEnemy(window.CX, e),
  drawBoss: (b) => CharacterRenderer.drawBoss(window.CX, b),
  tickPlayer: (dt) => {},
  tickEnemy: (e, dt) => {}
};

if (typeof window !== 'undefined') {
  window.CharacterRenderer = CharacterRenderer;
  window.AnimSystem = AnimSystem;
}
