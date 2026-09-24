// =====================================================================
//  DUNGEON BREAK — js/systems/HealthSystem.js
//  Authoritative Player Health, Ghost HP Delay, Shield, & Death Pipeline
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { EventBus } from '../core/EventBus.js';
import { SoundManager } from '../audio/AudioManager.js';

export const HealthSystem = {
  tick(dt) {
    const { P } = GameState;

    // Cooldown timers
    if (P.dcd > 0) P.dcd = Math.max(0, P.dcd - dt);
    if (P.icd > 0) P.icd = Math.max(0, P.icd - dt);
    if (P.hitFlash > 0) P.hitFlash = Math.max(0, P.hitFlash - dt);

    // Shield timer
    if (P.shieldActive) {
      P.shieldTimer -= dt;
      if (P.shieldTimer <= 0) {
        P.shieldActive = false;
        P.shieldTimer = 0;
      }
    }

    // Smooth Display HP
    if (P.displayHp !== P.hp) {
      P.displayHp += (P.hp - P.displayHp) * Math.min(1, dt * 10);
      if (Math.abs(P.displayHp - P.hp) < 0.05) P.displayHp = P.hp;
    }

    // Ghost HP Bar animation (smooth delay drop)
    if (P.ghostHpTimer > 0) {
      P.ghostHpTimer -= dt;
      if (P.ghostHpTimer < 0) {
        const dropDt = -P.ghostHpTimer;
        P.ghostHpTimer = 0;
        P.ghostHp = Math.max(P.hp, P.ghostHp - dropDt * 4);
      }
    } else if (P.ghostHp > P.hp) {
      P.ghostHp -= dt * 4;
      if (P.ghostHp < P.hp) P.ghostHp = P.hp;
    } else if (P.ghostHp < P.hp) {
      P.ghostHp = P.hp;
    }
  },

  damagePlayer(amount, source = 'enemy') {
    const { P } = GameState;
    if (P.dead || P.dcd > 0) return false;

    // Shield barrier absorption
    if (P.shieldActive) {
      SoundManager.snd('shield_activate');
      P.dcd = 0.5;
      EventBus.emit('player:shield_block', { amount });
      return false;
    }

    P.hp = Math.max(0, P.hp - amount);
    P.dcd = 1.0;
    P.icd = 0.3;
    P.hitFlash = 0.25;
    P.ghostHpTimer = 0.8;
    GameState.LEVEL_TOOK_DAMAGE = true;
    GameState.CAM.shk = 8;

    SoundManager.snd('player_hurt');
    EventBus.emit('player:damage', { amount, source, currentHp: P.hp });

    // Check Phoenix Feather relic revival
    if (P.hp <= 0 && P.relics && P.relics.includes('phoenix_feather')) {
      const idx = P.relics.indexOf('phoenix_feather');
      P.relics.splice(idx, 1);
      P.hp = Math.floor(P.maxHp * 0.5);
      P.displayHp = P.hp;
      P.ghostHp = P.hp;
      P.shieldActive = true;
      P.shieldTimer = 4.0;
      SoundManager.snd('talent_unlock');
      EventBus.emit('player:revive', { relic: 'phoenix_feather' });
      return true;
    }

    // Fatal damage
    if (P.hp <= 0 && !P.dead) {
      P.dead = true;
      P.hp = 0;
      this.triggerNormalDeath();
    }

    return true;
  },

  healPlayer(amount) {
    const { P } = GameState;
    if (P.dead) return;
    P.hp = Math.min(P.maxHp, P.hp + amount);
    EventBus.emit('player:heal', { amount, currentHp: P.hp });
  },

  triggerNormalDeath() {
    GameState.setState(GameStates.DEATH_NORMAL);
    SoundManager.snd('player_hurt');
    GameState.CAM.shk = 14;
    EventBus.emit('player:death', { cause: 'normal' });
  }
};
