// =====================================================================
//  DUNGEON BREAK — js/systems/LootSystem.js
//  Authoritative Drop Tables, Pickups, & Item Collection Pipeline
// =====================================================================

import { GameState } from '../core/GameState.js';
import { EventBus } from '../core/EventBus.js';
import { SoundManager } from '../audio/AudioManager.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';
import { HealthSystem } from './HealthSystem.js';
import { SanitySystem, SANITY_REWARDS } from './SanitySystem.js';
import { ProgressionSystem } from './ProgressionSystem.js';
import { AchievementSystem } from './AchievementSystem.js';
import { SaveSystem } from './SaveSystem.js';

export const LootSystem = {
  collectItems() {
    const { P, ITEMS, LV } = GameState;
    if (P.dead) return;

    const magnetRange = (P.relics && P.relics.includes('void_magnet')) ? 3.5 : 1.2;

    const dt = GameState.DT || 0.016;
    let nearestWeapon = null;
    let minWepDist = 1.4;

    ITEMS.forEach(it => {
      // Tick transient item cooldowns
      if (it.swapCooldown && it.swapCooldown > 0) {
        it.swapCooldown = Math.max(0, it.swapCooldown - dt);
      }
      if (it.discardCooldown && it.discardCooldown > 0) {
        it.discardCooldown = Math.max(0, it.discardCooldown - dt);
      }

      if (it.taken) return;

      if (it.kind === 'weapon') {
        const dist = Math.hypot(P.x - it.x, P.y - it.y);
        // Clear ignore flag once player walks away (>= 1.4 tiles)
        if (it.ignoredUntilStepAway && dist >= 1.4) {
          it.ignoredUntilStepAway = false;
        }

        const canInteract = (!it.swapCooldown || it.swapCooldown <= 0) &&
                            (!it.discardCooldown || it.discardCooldown <= 0) &&
                            !it.ignoredUntilStepAway;
        if (canInteract && dist < minWepDist) {
          nearestWeapon = it;
          minWepDist = dist;
        }
      }

      // Soul orb gravitational pull
      if (it.kind === 'soul') {
        const d = Math.hypot(P.x - it.x, P.y - it.y);
        if (d < magnetRange) {
          const spd = 6.0;
          it.x += ((P.x - it.x) / d) * spd * GameState.DT;
          it.y += ((P.y - it.y) / d) * spd * GameState.DT;
        }
        if (d < 0.6) {
          it.taken = true;
          ProgressionSystem.addSouls(it.val || 1);
          SoundManager.snd('soul_pickup');
          EventBus.emit('loot:collected', { kind: 'soul', val: it.val });
          return;
        }
      }

      // Standard pickup distance
      if (Math.abs(P.x - it.x) < 0.75 && Math.abs(P.y - it.y) < 0.75) {
        if (it.kind === 'weapon') {
          const hasEmpty = GameState.weaponSlots.some(w => w === null);
          const canInteract = (!it.swapCooldown || it.swapCooldown <= 0) &&
                              (!it.discardCooldown || it.discardCooldown <= 0) &&
                              !it.ignoredUntilStepAway;
          if (hasEmpty && canInteract) {
            it.taken = true;
            const newWep = WeaponFactory.create(it.sub || 'sword', it.rarity ? it.rarity.name : 'Common', it.affixes || [], LV);
            WeaponInventory.pickupWeapon(newWep, it);
          } else if (!hasEmpty && canInteract && !GameState.ACTIVE_WEAPON_REPLACE_MODAL) {
            // Case B: All 3 slots occupied -> Contextual ARSENAL FULL cache panel!
            WeaponInventory.openReplaceModal(it, 'prompt');
          }
        } else if (it.kind === 'health') {
          it.taken = true;
          HealthSystem.healPlayer(2);
          SoundManager.snd('item_pickup');
          EventBus.emit('loot:collected', { kind: 'health', amount: 2 });
        } else if (it.kind === 'sanity') {
          it.taken = true;
          const restoreAmount = SANITY_REWARDS.flask || 12;
          SanitySystem.restore(restoreAmount);
          SoundManager.snd('item_pickup');
          EventBus.emit('loot:collected', { kind: 'sanity', amount: restoreAmount });
        } else if (it.kind === 'shield') {
          it.taken = true;
          P.shieldActive = true;
          P.shieldTimer = 10;
          SoundManager.snd('shield_activate');
          AchievementSystem.unlock('shield_bearer');
          EventBus.emit('loot:collected', { kind: 'shield', duration: 10 });
        } else if (it.kind === 'story_echo') {
          it.taken = true;
          if (it.echoData && it.echoData.id) {
            SaveSystem.unlockMemory(it.echoData.id);
          }
          EventBus.emit('story:echo_trigger', it.echoData);
        } else if (it.kind === 'lore_scroll') {
          it.taken = true;
          if (it.scrollData && it.scrollData.id) {
            SaveSystem.unlockLore(it.scrollData.id);
            if (it.scrollData.legacyId) SaveSystem.unlockLore(it.scrollData.legacyId);
            GameState.ACTIVE_LORE_MODAL = it.scrollData;
            SoundManager.snd('item_pickup');
          }
          EventBus.emit('lore:scroll_trigger', it.scrollData);
        }
      }
    });

    GameState.nearestDroppedWeapon = nearestWeapon;
  }
};
