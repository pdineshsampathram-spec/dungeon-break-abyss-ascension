// =====================================================================
//  DUNGEON BREAK — Sanctum Talents Data
// =====================================================================

export const TALENT_DEFS = {
  vitality: { name: 'Bloodline Vigor', icon: '🩸', desc: '+2 Max HP per rank', max: 5, costs: [5, 12, 25, 45, 75] },
  clarity:  { name: 'Mind Sanctuary', icon: '🧠', desc: '-12% Sanity drain rate per rank', max: 5, costs: [5, 12, 25, 45, 75] },
  fury:     { name: 'Abyssal Might', icon: '⚔️', desc: '+15% Attack damage per rank', max: 5, costs: [8, 18, 35, 60, 100] },
  haste:    { name: 'Phantom Haste', icon: '⚡', desc: '+8% Movement & attack speed per rank', max: 5, costs: [8, 18, 35, 60, 100] },
  siphon:   { name: 'Vampiric Touch', icon: '👁️', desc: '5% chance on hit to restore 1 HP per rank', max: 5, costs: [10, 25, 50, 85, 140] },
};

export const TALENT_KEYS = Object.keys(TALENT_DEFS);
