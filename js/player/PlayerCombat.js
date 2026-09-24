// =====================================================================
//  DUNGEON BREAK — js/player/PlayerCombat.js
//  Player combat delegation facade
// =====================================================================

import { CombatSystem } from '../combat/CombatSystem.js';

export const PlayerCombat = {
  attack() {
    return CombatSystem.doAttack();
  },
  triggerAbility() {
    return CombatSystem.triggerWeaponAbility();
  }
};
