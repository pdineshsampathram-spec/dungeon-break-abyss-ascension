// =====================================================================
//  DUNGEON BREAK — js/bosses/BossStateMachine.js
//  Multi-phase state machine for Boss encounters
// =====================================================================

export const BossStateMachine = {
  updatePhase(boss) {
    if (!boss || !boss.alive) return;
    const hpFrac = boss.hp / boss.maxHp;

    if (hpFrac < 0.35 && boss.phase < 3) {
      boss.phase = 3;
      boss.rageWhirl = 3.5;
    } else if (hpFrac < 0.65 && boss.phase < 2) {
      boss.phase = 2;
    }
  }
};
