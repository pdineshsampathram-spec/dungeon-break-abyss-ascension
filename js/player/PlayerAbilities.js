// =====================================================================
//  DUNGEON BREAK — js/player/PlayerAbilities.js
//  Player abilities delegation facade
// =====================================================================

import { CombatSystem } from '../combat/CombatSystem.js';

export const PlayerAbilities = {
  triggerSpecial() {
    return CombatSystem.triggerWeaponAbility();
  }
};
