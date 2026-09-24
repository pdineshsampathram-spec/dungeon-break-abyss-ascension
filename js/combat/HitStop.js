// =====================================================================
//  DUNGEON BREAK — js/combat/HitStop.js
//  Micro frame-freeze & impact pause timing
// =====================================================================

import { GameState } from '../core/GameState.js';

export let HIT_STOP_TIMER = 0;

export function triggerHitStop(dur = 0.06) {
  HIT_STOP_TIMER = Math.max(HIT_STOP_TIMER, dur);
  GameState.FREEZE_TIME = HIT_STOP_TIMER;
}

export function tickHitStop(dt) {
  if (HIT_STOP_TIMER > 0) {
    HIT_STOP_TIMER = Math.max(0, HIT_STOP_TIMER - dt);
    GameState.FREEZE_TIME = HIT_STOP_TIMER;
  }
}

if (typeof window !== 'undefined') {
  window.triggerHitStop = triggerHitStop;
}
