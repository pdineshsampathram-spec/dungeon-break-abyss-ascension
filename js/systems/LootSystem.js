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
import { SanitySystem } from './SanitySystem.js';
import { ProgressionSystem } from './ProgressionSystem.js';

export const LootSystem = {
  collectItems() {
    const { P, ITEMS, LV } = GameState;
    if (P.dead) return;

    const magnetRange = (P.relics && P.relics.includes('void_magnet')) ? 3.5 : 1.2;

    ITEMS.forEach(it => {
      if (it.taken) return;

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
          it.taken = true;
          const newWep = WeaponFactory.create(it.sub || 'sword', it.rarity ? it.rarity.name : 'Common', it.affixes || [], LV);
          WeaponInventory.pickupWeapon(newWep, it);
        } else if (it.kind === 'health') {
          it.taken = true;
          HealthSystem.healPlayer(2);
          SoundManager.snd('item_pickup');
          EventBus.emit('loot:collected', { kind: 'health', amount: 2 });
        } else if (it.kind === 'sanity') {
          it.taken = true;
          SanitySystem.restore(30);
          SoundManager.snd('item_pickup');
          EventBus.emit('loot:collected', { kind: 'sanity', amount: 30 });
        } else if (it.kind === 'shield') {
          it.taken = true;
          P.shieldActive = true;
          P.shieldTimer = 10;
          SoundManager.snd('shield_activate');
          EventBus.emit('loot:collected', { kind: 'shield', duration: 10 });
        } else if (it.kind === 'story_echo') {
          it.taken = true;
          EventBus.emit('story:echo_trigger', it.echoData);
        } else if (it.kind === 'lore_scroll') {
          it.taken = true;
          EventBus.emit('lore:scroll_trigger', it.scrollData);
        }
      }
    });
  }
};
