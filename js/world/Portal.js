// =====================================================================
//  DUNGEON BREAK — js/world/Portal.js
//  Authoritative Exit Portal, Transition Lock, & Floor Advancement
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { MAX_LV } from '../core/Constants.js';
import { isBossFloor } from '../data/floors.js';
import { SoundManager } from '../audio/AudioManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { EventBus } from '../core/EventBus.js';

export const Portal = {
  checkExit() {
    const { P, MAP, LV } = GameState;
    if (GameState.levelTransitionActive || GameState.PORTAL_USED || P.dead || GameState.WARP_ACTIVE) return;

    const tx = Math.round(P.x);
    const ty = Math.round(P.y);
    if (!MAP[ty] || MAP[ty][tx] !== 2) return;
    if (isBossFloor(LV) && !GameState.BOSS_DEAD) return;

    GameState.levelTransitionActive = true;
    GameState.PORTAL_USED = true;
    SoundManager.snd('portal_enter');

    if (!GameState.LEVEL_TOOK_DAMAGE) {
      AchievementSystem.unlock('untouchable');
    }
    if (GameState.LEVEL_TIMER < 90) {
      AchievementSystem.unlock('speed_runner');
    }

    SaveSystem.saveRun();
    EventBus.emit('portal:activated', { fromFloor: LV });

    if (LV >= MAX_LV) {
      EventBus.emit('portal:victory', { floor: LV });
    } else {
      EventBus.emit('portal:warp_requested', { nextFloor: LV + 1 });
    }
  }
};

export const checkExit = () => Portal.checkExit();

if (typeof window !== 'undefined') {
  window.checkExit = checkExit;
  Object.defineProperty(window, 'levelTransitionActive', {
    get: () => GameState.levelTransitionActive,
    set: (v) => { GameState.levelTransitionActive = v; },
    configurable: true
  });
  Object.defineProperty(window, 'PORTAL_USED', {
    get: () => GameState.PORTAL_USED,
    set: (v) => { GameState.PORTAL_USED = v; },
    configurable: true
  });
}
