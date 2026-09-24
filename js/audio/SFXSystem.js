// =====================================================================
//  DUNGEON BREAK — js/audio/SFXSystem.js
//  Semantic SFX triggers and helper methods
// =====================================================================

import { SoundManager } from './AudioManager.js';

export const SFXSystem = {
  playMeleeHit()      { SoundManager.snd('melee_hit'); },
  playBowShoot()      { SoundManager.snd('bow_shoot'); },
  playEnemyDeath()    { SoundManager.snd('enemy_death'); },
  playPlayerHurt()    { SoundManager.snd('player_hurt'); },
  playItemPickup()    { SoundManager.snd('item_pickup'); },
  playPortalEnter()   { SoundManager.snd('portal_enter'); },
  playShield()        { SoundManager.snd('shield_activate'); },
  playBossRoar()      { SoundManager.snd('boss_roar'); },
  playSoulPickup()    { SoundManager.snd('soul_pickup'); },
  playTalentUnlock()  { SoundManager.snd('talent_unlock'); },
  playShockwave()     { SoundManager.snd('shockwave'); },
  playMiniBossRoar()  { SoundManager.snd('miniboss_roar'); }
};
