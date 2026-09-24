// =====================================================================
//  DUNGEON BREAK — js/world/Interactables.js
//  Traps, Survivors, Torches, & Environmental Interactions
// =====================================================================

import { GameState } from '../core/GameState.js';
import { dealDamage } from '../combat/DamageSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { EventBus } from '../core/EventBus.js';

export const Interactables = {
  tickTraps(dt) {
    const { TRAPS, P } = GameState;
    TRAPS.forEach(t => {
      t.timer = (t.timer || 0) + dt;
      const active = t.type === 'spike' ? true : (t.timer % 2.0) < 0.92;

      if (!active) return;
      if (!P.shieldActive && P.dcd <= 0 && !P.dead && Math.abs(P.x - t.x) < 0.55 && Math.abs(P.y - t.y) < 0.55) {
        dealDamage({ isTrap: true, attackId: 'trap_' + t.x + '_' + t.y + '_' + Math.floor(t.timer * 2), x: t.x, y: t.y }, P, 1, 'trap');
      }
    });
  },

  collectAllies() {
    const { ALLIES, P } = GameState;
    ALLIES.forEach(a => {
      if (a.rescued) return;
      if (Math.abs(P.x - a.x) < 0.85 && Math.abs(P.y - a.y) < 0.85) {
        a.rescued = true;
        P.saved++;
        P.san = Math.min(100, P.san + 14);
        SoundManager.snd('item_pickup');

        if (P.saved >= 5) {
          AchievementSystem.unlock('savior');
        }
        EventBus.emit('survivor:rescued', a);
      }
    });
  }
};

export const tickTraps = (dt) => Interactables.tickTraps(dt);
export const collectAllies = () => Interactables.collectAllies();

if (typeof window !== 'undefined') {
  window.tickTraps = tickTraps;
  window.collectAllies = collectAllies;
}
