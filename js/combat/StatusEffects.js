// =====================================================================
//  DUNGEON BREAK — js/combat/StatusEffects.js
//  Combat Status Effects: Burn, Slow, Freeze, Lifesteal, Bleed
// =====================================================================

import { dealDamage } from './DamageSystem.js';
import { HealthSystem } from '../systems/HealthSystem.js';

export const StatusEffects = {
  applyStatus(target, effectName, duration = 3.0) {
    if (!target) return;
    target.statusEffects = target.statusEffects || {};
    target.statusEffects[effectName] = duration;
  },

  tick(entities, dt) {
    if (!entities) return;
    entities.forEach(ent => {
      if (!ent.alive || !ent.statusEffects) return;

      Object.keys(ent.statusEffects).forEach(effect => {
        ent.statusEffects[effect] -= dt;

        if (effect === 'burn') {
          // Burn damage tick
          if (Math.random() < dt * 2) {
            dealDamage({ environmental: true }, ent, 1, 'burn');
          }
        } else if (effect === 'slow') {
          ent.speedMultiplier = 0.6;
        }

        if (ent.statusEffects[effect] <= 0) {
          delete ent.statusEffects[effect];
          if (effect === 'slow') ent.speedMultiplier = 1.0;
        }
      });
    });
  }
};
