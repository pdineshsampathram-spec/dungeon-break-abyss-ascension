// =====================================================================
//  DUNGEON BREAK — js/enemies/EnemyManager.js
//  Authoritative Active Enemies Coordinator & Update Lifecycle
// =====================================================================

import { GameState } from '../core/GameState.js';
import { EnemyAI } from './EnemyAI.js';
import { AbyssDissolution } from '../systems/AbyssDissolution.js';

export const EnemyManager = {
  tick(dt) {
    const { ENE } = GameState;
    if (!ENE) return;

    for (let i = ENE.length - 1; i >= 0; i--) {
      const e = ENE[i];
      EnemyAI.tickEnemy(e, i, dt);

      // Dead enemy dissolution lifecycle
      if (!e.alive) {
        // Start dissolution effect (one-shot)
        if (!e._dissolveStarted) {
          AbyssDissolution.startDissolution(e, {
            type: e.type,
            isElite: e.isElite,
            isMiniBoss: e.isMiniBoss,
            isCinematic: false
          });
        }

        // Remove actor only after dissolution is fully complete
        if (AbyssDissolution.isDissolutionComplete(e)) {
          ENE.splice(i, 1);
        }
      }
    }
  }
};

export const tickENE = (dt) => EnemyManager.tick(dt);

if (typeof window !== 'undefined') {
  window.tickENE = tickENE;
}
