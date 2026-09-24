// =====================================================================
//  DUNGEON BREAK — js/weapons/WeaponInventory.js
//  Authoritative 3-Slot Weapon Inventory & Hotbar Switcher
// =====================================================================

import { GameState } from '../core/GameState.js';
import { EventBus } from '../core/EventBus.js';
import { SoundManager } from '../audio/AudioManager.js';
import { WeaponFactory } from './WeaponFactory.js';

export let ACTIVE_WEAPON_REPLACE_MODAL = null;

export const WeaponInventory = {
  getActiveWeapon() {
    const slots = GameState.weaponSlots;
    const activeIdx = GameState.activeWeaponSlot;
    return slots[activeIdx] || slots[0] || WeaponFactory.create('sword', 'Common');
  },

  switchWeaponSlot(idx) {
    if (idx < 0 || idx >= 3) return;
    if (!GameState.weaponSlots[idx]) return;

    GameState.activeWeaponSlot = idx;
    const w = GameState.weaponSlots[idx];
    GameState.P.wep = w.id;
    GameState.P.wepRarity = w.rarity;

    SoundManager.snd('item_pickup');
    EventBus.emit('weapon:switched', { slot: idx, weapon: w });
  },

  pickupWeapon(droppedWep, itemRef) {
    const slots = GameState.weaponSlots;
    const emptyIdx = slots.findIndex(w => w === null);

    if (emptyIdx !== -1) {
      slots[emptyIdx] = droppedWep;
      this.switchWeaponSlot(emptyIdx);
      SoundManager.snd('item_pickup');
      EventBus.emit('weapon:equipped', { slot: emptyIdx, weapon: droppedWep });
    } else {
      // Inventory full: open interactive weapon replacement modal
      ACTIVE_WEAPON_REPLACE_MODAL = {
        newWeapon: droppedWep,
        itemRef: itemRef
      };
      GameState.pendingWeaponDrop = ACTIVE_WEAPON_REPLACE_MODAL;
      SoundManager.snd('talent_unlock');
      EventBus.emit('weapon:replace_modal_opened', ACTIVE_WEAPON_REPLACE_MODAL);
    }
  },

  replaceWeaponSlot(slotIdx, newWep) {
    if (slotIdx >= 0 && slotIdx < 3 && newWep) {
      const oldWep = GameState.weaponSlots[slotIdx];
      GameState.weaponSlots[slotIdx] = newWep;
      this.switchWeaponSlot(slotIdx);
      ACTIVE_WEAPON_REPLACE_MODAL = null;
      GameState.pendingWeaponDrop = null;
      SoundManager.snd('item_pickup');
      EventBus.emit('weapon:replaced', { slot: slotIdx, oldWeapon: oldWep, newWeapon: newWep });
    }
  },

  discardReplacementWeapon() {
    ACTIVE_WEAPON_REPLACE_MODAL = null;
    GameState.pendingWeaponDrop = null;
    EventBus.emit('weapon:discarded');
  }
};

// Aliases for regression tests and window access
export const getActiveWeapon = () => WeaponInventory.getActiveWeapon();
export const switchWeaponSlot = (idx) => WeaponInventory.switchWeaponSlot(idx);
export const pickupWeapon = (w, ref) => WeaponInventory.pickupWeapon(w, ref);
export const replaceWeaponSlot = (idx, w) => WeaponInventory.replaceWeaponSlot(idx, w);
export const discardReplacementWeapon = () => WeaponInventory.discardReplacementWeapon();

if (typeof window !== 'undefined') {
  window.getActiveWeapon = getActiveWeapon;
  window.switchWeaponSlot = switchWeaponSlot;
  window.pickupWeapon = pickupWeapon;
  window.replaceWeaponSlot = replaceWeaponSlot;
  window.discardReplacementWeapon = discardReplacementWeapon;
  Object.defineProperty(window, 'weaponSlots', {
    get: () => GameState.weaponSlots,
    set: (v) => { GameState.weaponSlots = v; },
    configurable: true
  });
  Object.defineProperty(window, 'activeWeaponSlot', {
    get: () => GameState.activeWeaponSlot,
    set: (v) => { GameState.activeWeaponSlot = v; },
    configurable: true
  });
  Object.defineProperty(window, 'ACTIVE_WEAPON_REPLACE_MODAL', {
    get: () => ACTIVE_WEAPON_REPLACE_MODAL,
    set: (v) => { ACTIVE_WEAPON_REPLACE_MODAL = v; },
    configurable: true
  });
}
