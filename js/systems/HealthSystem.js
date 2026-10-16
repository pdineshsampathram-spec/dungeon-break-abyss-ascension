// =====================================================================
//  DUNGEON BREAK — js/systems/HealthSystem.js
//  Authoritative Player Health, Ghost HP Delay, Shield, & Death Pipeline
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { EventBus } from '../core/EventBus.js';
import { SoundManager } from '../audio/AudioManager.js';
import { DeathCinematics, requestDeath } from '../cinematics/DeathCinematics.js';
import { PlayerStats } from '../player/PlayerStats.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';

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

    // Smooth Display HP & Ghost HP Bar animation
    if (GameState.REDUCED_MOTION) {
      P.displayHp = P.hp;
      P.ghostHp = P.hp;
      P.ghostHpTimer = 0;
    } else {
      if (P.displayHp !== P.hp) {
        P.displayHp += (P.hp - P.displayHp) * Math.min(1, dt * 10);
        if (Math.abs(P.displayHp - P.hp) < 0.05) P.displayHp = P.hp;
      }

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
    }
  },

  damagePlayer(amount, source = 'enemy') {
    const { P } = GameState;
    if (P.dead || P.dying || P.dcd > 0 || GameState.STATE === 'death_sanity' || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) return false;
    if (P.san <= 0) {
      requestDeath('shattered_mind', 'sanity');
      return false;
    }

    // Shield barrier absorption
    if (P.shieldActive) {
      SoundManager.snd('shield_activate');
      P.dcd = 0.5;
      ParticleRenderer.spawnRing(P.x, P.y, '#67e8f9');
      ParticleRenderer.showFloatingText('BLOCKED', P.x, P.y - 0.5, '#67e8f9', 12, false);
      EventBus.emit('player:shield_block', { amount });
      return false;
    }

    // Damage mitigation from Defensive Mastery & Legacy Iron Memory
    const res = PlayerStats.getDamageResistance();
    const isTrap = source === 'trap' || (typeof source === 'object' && (source.isTrap || source.environmental)) || (typeof source === 'string' && source.includes('trap'));

    let dmg;
    if (isTrap) {
      const trapRes = PlayerStats.getTrapDamageResistance ? PlayerStats.getTrapDamageResistance() : (((GameState.TALENTS && GameState.TALENTS.resilience) || 0) * 0.15);
      const combinedMult = (1 - res) * (1 - trapRes);
      const rawTrapDmg = amount * combinedMult;

      // Heavy armor and environmental resilience can deflect minor trap damage
      if (rawTrapDmg < 0.55) {
        SoundManager.snd('shield_activate');
        P.dcd = 0.5;
        EventBus.emit('player:trap_deflected', { amount, rawTrapDmg });
        return false;
      }
      dmg = Math.max(1, Math.round(rawTrapDmg));
    } else {
      dmg = Math.max(1, Math.round(amount * (1 - res)));
    }


    P.hp = Math.max(0, P.hp - dmg);
    P.dcd = 1.0;
    P.icd = 0.3;
    P.hitFlash = 0.25;
    P.ghostHpTimer = 0.8;
    GameState.LEVEL_TOOK_DAMAGE = true;
    GameState.CAM.shk = 8;

    SoundManager.snd('player_hurt');
    EventBus.emit('player:damage', { amount: dmg, source, currentHp: P.hp });

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

    // Check Legacy Last Defiance once-per-run survival surge
    const defianceRank = (GameState.LEGACY_TALENTS && GameState.LEGACY_TALENTS.legacy_defiance) || 0;
    if (P.hp <= 0 && defianceRank > 0 && !P._defianceUsed) {
      P._defianceUsed = true;
      P.hp = Math.max(1, Math.floor(P.maxHp * 0.35));
      P.displayHp = P.hp;
      P.ghostHp = P.hp;
      P.shieldActive = true;
      P.shieldTimer = 3.5;
      SoundManager.snd('talent_unlock');
      EventBus.emit('player:revive', { legacy: 'last_defiance' });
      return true;
    }

    // Fatal damage
    if (P.hp <= 0 && !P.dead && !P.dying) {
      P.hp = 0;
      if (P.san <= 0) {
        requestDeath('shattered_mind', 'sanity');
      } else {
        const cause = this.resolveDeathCause(source);
        requestDeath(cause, source);
      }
    }

    return true;
  },

  resolveDeathCause(source) {
    if (!source) return 'dungeon_normal';
    if (typeof source === 'string') {
      if (source.includes('gorgaroth')) return 'boss_gorgaroth';
      if (source.includes('malakor')) return 'boss_malakor';
      if (source.includes('warden') || source.includes('abyss')) return 'boss_abyss_warden';
      if (source.startsWith('trap_') || source === 'spike' || source === 'fire') return 'trap_' + (source.replace('trap_', ''));
      if (source.startsWith('enemy_')) return source;
      return 'dungeon_normal';
    }
    if (typeof source === 'object') {
      if (source.isBoss || source.bossId) {
        const id = source.bossId || (GameState.BOSS ? GameState.BOSS.id : 'abyss_warden');
        if (id === 'gorgaroth') return 'boss_gorgaroth';
        if (id === 'malakor') return 'boss_malakor';
        return 'boss_abyss_warden';
      }
      if (source.isTrap || source.trapType) {
        return 'trap_' + (source.trapType || 'spike');
      }
      if (source.enemyType) {
        return 'enemy_' + source.enemyType;
      }
    }
    // Check if player is currently fighting an alive boss
    if (GameState.BOSS && GameState.BOSS.alive) {
      if (GameState.BOSS.id === 'gorgaroth') return 'boss_gorgaroth';
      if (GameState.BOSS.id === 'malakor') return 'boss_malakor';
      if (GameState.BOSS.id === 'abyss_warden') return 'boss_abyss_warden';
    }
    return 'dungeon_normal';
  },

  healPlayer(amount) {
    const { P } = GameState;
    if (P.dead || P.dying) return;
    P.hp = Math.min(P.maxHp, P.hp + amount);
    EventBus.emit('player:heal', { amount, currentHp: P.hp });
  },

  triggerNormalDeath(cause = 'dungeon_normal', source = null) {
    requestDeath(cause, source);
  }
};
