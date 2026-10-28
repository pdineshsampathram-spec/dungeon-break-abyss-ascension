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

import { FloorManager } from './FloorManager.js';
import { EndingCinematics, EndingDispatcher } from '../cinematics/EndingCinematics.js';
import { WardenDefeatCinematic } from '../cinematics/WardenDefeatCinematic.js';
import { GorgarothCinematics } from '../cinematics/GorgarothCinematics.js';

export const Portal = {
  checkExit() {
    const { P, MAP, LV } = GameState;
    if (FloorManager.isTransitionActive() || GameState.levelTransitionActive || GameState.PORTAL_USED || P.dead || GameState.WARP_ACTIVE || EndingDispatcher.isDispatched() || (WardenDefeatCinematic && WardenDefeatCinematic.isActive()) || (GorgarothCinematics && GorgarothCinematics.isActive())) return;

    const tx = Math.round(P.x);
    const ty = Math.round(P.y);

    // Forgiving hit-testing: exact tile or within 1.35 tile radius of any portal tile
    let onPortal = (MAP[ty] && MAP[ty][tx] === 2);
    if (!onPortal) {
      for (let dr = -1; dr <= 1 && !onPortal; dr++) {
        for (let dc = -1; dc <= 1 && !onPortal; dc++) {
          const r = ty + dr, c = tx + dc;
          if (MAP[r] && MAP[r][c] === 2 && Math.hypot(P.x - c, P.y - r) < 1.35) {
            onPortal = true;
          }
        }
      }
    }
    if (!onPortal) return;
    if (isBossFloor(LV) && (!GameState.BOSS_DEAD || !GameState.BOSS_PORTAL_UNLOCKED)) return;

    // One-shot activation lock
    GameState.PORTAL_USED = true;
    SoundManager.snd('portal_enter');

    if (!GameState.LEVEL_TOOK_DAMAGE) {
      AchievementSystem.unlock('untouchable');
    }
    if (GameState.LEVEL_TIMER < 90) {
      AchievementSystem.unlock('speed_runner');
    }

    // Phase 6: Floor-Specific Speedrun Unlocks
    const activeFloorSec = GameState.FLOOR_ACTIVE_TIME || 0;
    if (!isBossFloor(LV)) {
      if (activeFloorSec <= 60) {
        AchievementSystem.unlock(`speed_floor_${LV}`);
      }
    } else {
      if (LV === 3 && activeFloorSec <= 90) {
        AchievementSystem.unlock('speed_floor_3');
      } else if (LV === 6 && activeFloorSec <= 120) {
        AchievementSystem.unlock('speed_floor_6');
      }
    }

    SaveSystem.saveRun();
    EventBus.emit('PORTAL_ENTERED', { fromFloor: LV });

    FloorManager.startTransition(LV);
  }
};

export const checkExit = () => Portal.checkExit();

if (typeof window !== 'undefined') {
  window.checkExit = checkExit;
  window.Portal = Portal;
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
