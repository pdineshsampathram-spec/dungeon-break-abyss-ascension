// =====================================================================
//  DUNGEON BREAK — js/cinematics/DeathCinematics.js
//  Authoritative Normal & Sanity Death Sequences, Banners, & Retry UI
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { EventBus } from '../core/EventBus.js';

export const DeathCinematics = {
  startNormal() {
    GameState.setState(GameStates.DEATH_NORMAL);
    SoundManager.snd('player_hurt');
    GameState.CAM.shk = 14;
    EventBus.emit('player:death', { cause: 'normal' });
  },

  startSanity() {
    GameState.setState(GameStates.DEATH_SANITY);
    SoundManager.snd('boss_roar');
    GameState.CAM.shk = 18;
    EventBus.emit('player:death', { cause: 'sanity' });
  },

  draw(ctx) {
    const isSanity = (GameState.STATE === GameStates.DEATH_SANITY);
    const { P, LV, ABYSS_SOULS } = GameState;

    ctx.save();
    const bg = ctx.createRadialGradient(LW / 2, LH / 2, 40, LW / 2, LH / 2, LW * 0.7);
    if (isSanity) {
      bg.addColorStop(0, 'rgba(30, 5, 50, 0.96)');
      bg.addColorStop(1, 'rgba(5, 0, 15, 1)');
    } else {
      bg.addColorStop(0, 'rgba(45, 5, 5, 0.96)');
      bg.addColorStop(1, 'rgba(10, 0, 0, 1)');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, LW, LH);

    const glowCol = isSanity ? '#a855f7' : '#dc2626';

    // Title
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = 24;
    ctx.fillStyle = isSanity ? '#f3e8ff' : '#fef2f2';
    ctx.font = 'bold 36px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSanity ? '🧠 SHATTERED MIND' : '💀 FALLEN IN THE ABYSS', LW / 2, 160);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = 'rgba(203, 213, 225, 0.88)';
    ctx.font = 'italic 15px Crimson Text, serif';
    const sub = isSanity
      ? '“The lightless depths shattered your mind. Reality dissolved into madness.”'
      : '“Your flesh gives way, but your resolve echoes forever in the deep.”';
    ctx.fillText(sub, LW / 2, 205);

    // Stats line
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LW * 0.2, 240);
    ctx.lineTo(LW * 0.8, 240);
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Cinzel, serif';
    ctx.fillText(
      'Floor Reached: ' + LV + '   ·   Enemies Slain: ' + P.killed + '   ·   Survivors Rescued: ' + P.saved + '   ·   Abyss Souls: ' + ABYSS_SOULS,
      LW / 2,
      268
    );

    // Buttons
    const btnW = 160, btnH = 46;
    const btn1X = LW / 2 - btnW - 15;
    const btn2X = LW / 2 + 15;
    const btnY = 320;

    // Button 1: RETRY
    ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.75)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, btn1X, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.fillText('⚔️ RETRY RUN', btn1X + btnW / 2, btnY + btnH / 2);

    // Button 2: TITLE
    ctx.fillStyle = 'rgba(201, 168, 76, 0.22)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.75)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, btn2X, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.fillText('🏰 TITLE SCREEN', btn2X + btnW / 2, btnY + btnH / 2);

    ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
    ctx.font = '10px Cinzel, serif';
    ctx.fillText('Press [ Enter ] or [ R ] to Retry   ·   Press [ Esc ] for Title', LW / 2, 400);

    ctx.restore();
  }
};

export const startNormalDeathSequence = () => DeathCinematics.startNormal();
export const startSanityDeathSequence = () => DeathCinematics.startSanity();
export const drawDeathScreen = (ctx) => DeathCinematics.draw(ctx);

if (typeof window !== 'undefined') {
  window.startNormalDeathSequence = startNormalDeathSequence;
  window.startSanityDeathSequence = startSanityDeathSequence;
  window.drawDeathScreen = drawDeathScreen;
}
