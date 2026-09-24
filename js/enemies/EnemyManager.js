// =====================================================================
//  DUNGEON BREAK — js/enemies/EnemyManager.js
//  Authoritative Active Enemies Coordinator & Update Lifecycle
// =====================================================================

import { GameState } from '../core/GameState.js';
import { EnemyAI } from './EnemyAI.js';

export const EnemyManager = {
  tick(dt) {
    const { ENE } = GameState;
    if (!ENE) return;

    for (let i = ENE.length - 1; i >= 0; i--) {
      const e = ENE[i];
      EnemyAI.tickEnemy(e, i, dt);

      // Clean decayed corpses
      if (!e.alive && e.dAnim <= 0) {
        ENE.splice(i, 1);
      }
    }
  }
};

export const tickENE = (dt) => EnemyManager.tick(dt);

if (typeof window !== 'undefined') {
  window.tickENE = tickENE;
}
