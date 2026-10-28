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
    const w = GameState.weaponSlots[idx];
    if (!w) return;

    GameState.activeWeaponSlot = idx;
    GameState.currentWeapon = w;
    GameState.P.currentWeapon = w;
    GameState.P.wep = w.id;
    GameState.P.wepRarity = w.rarity;
    GameState.P.activePrefix = w.prefix || null;
    GameState.P.activeSuffix = w.suffix || null;

    // Equip feedback banner & audio
    GameState.equipFeedback = {
      name: w.name || w.id,
      rarity: w.rarity || { name: 'Common', col: '#94a3b8' },
      timer: 1.5,
      slot: idx
    };

    SoundManager.snd('item_pickup');
    EventBus.emit('weapon:switched', { slot: idx, weapon: w });
  },

  openReplaceModal(itemRef, mode = 'prompt') {
    if (!itemRef || itemRef.taken) return;
    const wId = itemRef.sub || 'sword';
    const rName = (itemRef.rarity && itemRef.rarity.name) ? itemRef.rarity.name : 'Common';
    const weaponObj = WeaponFactory.create(wId, rName, itemRef.affixes || [], GameState.LV || 1);

    ACTIVE_WEAPON_REPLACE_MODAL = {
      mode: mode, // 'prompt' for Arsenal Full equipment cache, 'selector' for 3-slot replacement
      newWeapon: weaponObj,
      itemRef: itemRef
    };
    GameState.pendingWeaponDrop = ACTIVE_WEAPON_REPLACE_MODAL;
    GameState.ACTIVE_WEAPON_REPLACE_MODAL = ACTIVE_WEAPON_REPLACE_MODAL;
    SoundManager.snd('talent_unlock');
    EventBus.emit('weapon:replace_modal_opened', ACTIVE_WEAPON_REPLACE_MODAL);
  },

  switchToSelector() {
    if (ACTIVE_WEAPON_REPLACE_MODAL) {
      ACTIVE_WEAPON_REPLACE_MODAL.mode = 'selector';
      SoundManager.snd('panel_open');
    }
  },

  pickupWeapon(droppedWep, itemRef) {
    let weaponObj = droppedWep;
    if (!weaponObj.damage && !weaponObj.dmg) {
      const wId = droppedWep.id || droppedWep.sub || 'sword';
      const rName = (droppedWep.rarity && droppedWep.rarity.name) ? droppedWep.rarity.name : 'Common';
      weaponObj = WeaponFactory.create(wId, rName, [], GameState.LV || 1);
    }

    const slots = GameState.weaponSlots;
    const emptyIdx = slots.findIndex(w => w === null);

    if (emptyIdx !== -1) {
      if (itemRef) itemRef.taken = true;
      slots[emptyIdx] = weaponObj;
      this.switchWeaponSlot(emptyIdx);
      SoundManager.snd('item_pickup');
      EventBus.emit('weapon:equipped', { slot: emptyIdx, weapon: weaponObj });
    } else {
      // Inventory full: open interactive weapon replacement modal in prompt mode
      this.openReplaceModal(itemRef || { sub: weaponObj.id, rarity: weaponObj.rarity, affixes: weaponObj.affixes }, 'prompt');
    }
  },

  replaceWeaponSlot(slotIdx, newWep) {
    if (slotIdx >= 0 && slotIdx < 3 && newWep) {
      let weaponObj = newWep;
      if (!weaponObj.damage && !weaponObj.dmg) {
        const wId = newWep.id || newWep.sub || 'sword';
        const rName = (newWep.rarity && newWep.rarity.name) ? newWep.rarity.name : 'Common';
        weaponObj = WeaponFactory.create(wId, rName, [], GameState.LV || 1);
      }

      const modal = ACTIVE_WEAPON_REPLACE_MODAL || GameState.pendingWeaponDrop;
      const groundItemRef = modal ? modal.itemRef : null;

      // 1. Consume ground weapon so it is TAKEN and CANNOT be cloned
      if (groundItemRef) {
        groundItemRef.taken = true;
      }

      // 2. Safely place the old weapon onto the ground at Rowan's feet
      const oldWep = GameState.weaponSlots[slotIdx];
      if (oldWep) {
        GameState.ITEMS.push({
          x: GameState.P.x + (Math.random() - 0.5) * 0.3,
          y: GameState.P.y + (Math.random() - 0.5) * 0.3,
          kind: 'weapon',
          sub: oldWep.id,
          name: oldWep.name,
          damage: oldWep.damage,
          dmg: oldWep.dmg,
          rarity: oldWep.rarity || { name: 'Common', col: '#94a3b8' },
          affixes: oldWep.affixes || [],
          taken: false,
          swapCooldown: 1.2,
          ph: Math.random() * 6.28
        });
      }

      // 3. Equip the new weapon into the chosen slot
      GameState.weaponSlots[slotIdx] = weaponObj;
      this.switchWeaponSlot(slotIdx);

      // 4. Destroy modal completely
      ACTIVE_WEAPON_REPLACE_MODAL = null;
      GameState.pendingWeaponDrop = null;
      GameState.ACTIVE_WEAPON_REPLACE_MODAL = null;

      SoundManager.snd('item_pickup');
      EventBus.emit('weapon:replaced', { slot: slotIdx, oldWeapon: oldWep, newWeapon: weaponObj });
    }
  },

  discardReplacementWeapon() {
    const modal = ACTIVE_WEAPON_REPLACE_MODAL || GameState.pendingWeaponDrop;
    if (modal && modal.itemRef) {
      modal.itemRef.taken = false;
      modal.itemRef.ignoredUntilStepAway = true;
      modal.itemRef.discardCooldown = 1.0;
    }
    ACTIVE_WEAPON_REPLACE_MODAL = null;
    GameState.pendingWeaponDrop = null;
    GameState.ACTIVE_WEAPON_REPLACE_MODAL = null;
    SoundManager.snd('panel_close');
    EventBus.emit('weapon:discarded');
  },

  swapActiveSlotWithGround(item) {
    if (!item || item.kind !== 'weapon' || item.taken) return;
    if (item.swapCooldown && item.swapCooldown > 0) return;

    const activeIdx = GameState.activeWeaponSlot || 0;
    const oldWep = GameState.weaponSlots[activeIdx];
    const newWep = WeaponFactory.create(
      item.sub || 'sword',
      item.rarity ? item.rarity.name : 'Common',
      item.affixes || [],
      GameState.LV || 1
    );

    // Equip into active slot
    GameState.weaponSlots[activeIdx] = newWep;
    this.switchWeaponSlot(activeIdx);

    // Swap ground item to become old weapon
    if (oldWep) {
      item.sub = oldWep.id;
      item.name = oldWep.name;
      item.rarity = oldWep.rarity || { name: 'Common', col: '#94a3b8' };
      item.damage = oldWep.damage;
      item.dmg = oldWep.dmg;
      item.affixes = oldWep.affixes || [];
      item.taken = false;
      item.swapCooldown = 1.0;
    } else {
      item.taken = true;
    }

    SoundManager.snd('item_pickup');
    EventBus.emit('weapon:swapped', { slot: activeIdx, oldWeapon: oldWep, newWeapon: newWep });
  }
};

// Aliases for regression tests and window access
export const getActiveWeapon = () => WeaponInventory.getActiveWeapon();
export const switchWeaponSlot = (idx) => WeaponInventory.switchWeaponSlot(idx);
export const pickupWeapon = (w, ref) => WeaponInventory.pickupWeapon(w, ref);
export const openReplaceModal = (ref, mode = 'prompt') => WeaponInventory.openReplaceModal(ref, mode);
export const switchToSelector = () => WeaponInventory.switchToSelector();
export const replaceWeaponSlot = (idx, w) => WeaponInventory.replaceWeaponSlot(idx, w);
export const discardReplacementWeapon = () => WeaponInventory.discardReplacementWeapon();
export const swapActiveSlotWithGround = (item) => WeaponInventory.swapActiveSlotWithGround(item);

if (typeof window !== 'undefined') {
  window.getActiveWeapon = getActiveWeapon;
  window.switchWeaponSlot = switchWeaponSlot;
  window.pickupWeapon = pickupWeapon;
  window.openReplaceModal = openReplaceModal;
  window.switchToSelector = switchToSelector;
  window.replaceWeaponSlot = replaceWeaponSlot;
  window.discardReplacementWeapon = discardReplacementWeapon;
  window.swapActiveSlotWithGround = swapActiveSlotWithGround;
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
