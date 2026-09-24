// =====================================================================
//  DUNGEON BREAK — js/player/PlayerInventory.js
//  Player inventory delegation facade
// =====================================================================

import { WeaponInventory } from '../weapons/WeaponInventory.js';

export const PlayerInventory = {
  getSlots() {
    return WeaponInventory.getSlots();
  },
  getActiveWeapon() {
    return WeaponInventory.getActiveWeapon();
  },
  switchSlot(idx) {
    return WeaponInventory.switchWeaponSlot(idx);
  },
  pickup(wep, itemRef) {
    return WeaponInventory.pickupWeapon(wep, itemRef);
  },
  replaceSlot(idx, wep) {
    return WeaponInventory.replaceWeaponSlot(idx, wep);
  }
};
