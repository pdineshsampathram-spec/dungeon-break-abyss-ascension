// =====================================================================
//  DUNGEON BREAK — js/systems/SanitySystem.js
//  Authoritative Sanity Drain, Mind Resilience, & Eldritch Hallucinations
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { Config } from '../core/Config.js';
import { EventBus } from '../core/EventBus.js';
import { SoundManager } from '../audio/AudioManager.js';

export const SanitySystem = {
  tick(dt) {
    const { P, LV, TALENTS } = GameState;
    if (P.dead || GameState.STATE !== GameStates.PLAYING) return;

    // Difficulty drain rate with Mind Sanctuary talent reduction
    const baseDrain = Config.getDiff(LV).sdrain;
    const clarityRank = (TALENTS && TALENTS.clarity) || 0;
    const talentReduction = clarityRank * 0.12;
    const effectiveDrain = Math.max(0.05, baseDrain * (1 - talentReduction));

    P.san = Math.max(0, P.san - effectiveDrain * dt);

    if (P.san <= 0 && !P.dead) {
      P.dead = true;
      this.triggerSanityDeath();
    }
  },

  restore(amount) {
    const { P } = GameState;
    if (P.dead) return;
    P.san = Math.min(100, P.san + amount);
    EventBus.emit('sanity:restore', { amount, current: P.san });
  },

  drain(amount) {
    const { P } = GameState;
    if (P.dead) return;
    P.san = Math.max(0, P.san - amount);
    EventBus.emit('sanity:drain', { amount, current: P.san });
    if (P.san <= 0 && !P.dead) {
      P.dead = true;
      this.triggerSanityDeath();
    }
  },

  triggerSanityDeath() {
    GameState.setState(GameStates.DEATH_SANITY);
    SoundManager.snd('boss_roar');
    GameState.CAM.shk = 18;
    EventBus.emit('player:death', { cause: 'sanity' });
  }
};
