// =====================================================================
//  DUNGEON BREAK — js/cinematics/EndingCinematics.js
//  Authoritative Ending Sequences: True Hero, Rampage, & Betrayed Endings
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { EventBus } from '../core/EventBus.js';

export const EndingCinematics = {
  decideEnding() {
    const { P } = GameState;
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    GameState.BOSS_AI_ACTIVE = false;
    GameState.TRAPS = [];
    if (GameState.ENE) {
      GameState.ENE.forEach(e => { e.alive = false; });
    }

    if (P.san < 50 && P.saved < 4) {
      this.triggerRampageEnding();
    } else if (P.saved > 4) {
      this.triggerBetrayedEnding();
    } else if (P.san > 50 && P.saved >= 1) {
      this.triggerTrueHeroEnding();
    } else {
      this.triggerTrueHeroEnding();
    }
  },

  triggerRampageEnding() {
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    AchievementSystem.unlock('rampage');
    EventBus.emit('ending:rampage');
  },

  triggerBetrayedEnding() {
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    AchievementSystem.unlock('betrayed');
    EventBus.emit('ending:betrayed');
  },

  triggerTrueHeroEnding() {
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    AchievementSystem.unlock('true_hero');
    EventBus.emit('ending:true_hero');
  }
};

export const triggerVictoryCinematic = () => EndingCinematics.decideEnding();
export const decideEnding = () => EndingCinematics.decideEnding();

if (typeof window !== 'undefined') {
  window.triggerVictoryCinematic = triggerVictoryCinematic;
  window.decideEnding = decideEnding;
  Object.defineProperty(window, 'CINEMATIC_ACTIVE', {
    get: () => GameState.CINEMATIC_ACTIVE,
    set: (v) => { GameState.CINEMATIC_ACTIVE = v; },
    configurable: true
  });
}
