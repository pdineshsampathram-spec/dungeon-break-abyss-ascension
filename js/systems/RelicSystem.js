// =====================================================================
//  DUNGEON BREAK — js/systems/RelicSystem.js
//  Authoritative Relic Inventory, Passives, & Charm Effects
// =====================================================================

import { GameState } from '../core/GameState.js';
import { RELIC_DEFS } from '../data/relics.js';
import { EventBus } from '../core/EventBus.js';
import { SoundManager } from '../audio/AudioManager.js';

let _shadowCloakKills = 0;
let _aegisCoreTimer = 0;

export const RelicSystem = {
  hasRelic(id) {
    return !!(GameState.P.relics && GameState.P.relics.includes(id));
  },

  addRelic(id) {
    if (!GameState.P.relics) GameState.P.relics = [];
    if (!GameState.P.relics.includes(id)) {
      GameState.P.relics.push(id);
      EventBus.emit('relic:acquired', { id, def: RELIC_DEFS[id] });
      SoundManager.snd('talent_unlock');
    }
  },

  onEnemyKill() {
    if (this.hasRelic('shadow_cloak')) {
      _shadowCloakKills++;
      if (_shadowCloakKills >= 3) {
        _shadowCloakKills = 0;
        GameState.P.dcd = 2.5;
        SoundManager.snd('shield_activate');
      }
    }
  },

  onFloorEnter() {
    if (this.hasRelic('bone_charm')) {
      GameState.P.hp = Math.min(GameState.P.maxHp, GameState.P.hp + 2);
      GameState.P.displayHp = GameState.P.hp;
      GameState.P.ghostHp = GameState.P.hp;
    }
  },

  tick(dt) {
    if (this.hasRelic('aegis_core')) {
      _aegisCoreTimer += dt;
      if (_aegisCoreTimer >= 25) {
        _aegisCoreTimer = 0;
        GameState.P.shieldActive = true;
        GameState.P.shieldTimer = 10;
        SoundManager.snd('shield_activate');
      }
    }
  }
};
