// =====================================================================
//  DUNGEON BREAK — Relics & Charms Data
// =====================================================================

export const RELIC_DEFS = {
  phoenix_feather: { id: 'phoenix_feather', name: 'Phoenix Feather', icon: '🪶', col: '#f97316', desc: 'Revive once per run with 50% HP' },
  shadow_cloak:    { id: 'shadow_cloak',    name: 'Shadow Cloak',    icon: '🧥', col: '#a855f7', desc: '2.5s invulnerability after 3 kills' },
  bone_charm:      { id: 'bone_charm',      name: 'Bone Charm',      icon: '🦴', col: '#fde68a', desc: 'Restores +2 HP on entering new floor' },
  blood_chalice:   { id: 'blood_chalice',   name: 'Blood Chalice',   icon: '🍷', col: '#ef4444', desc: '+50% Souls collected' },
  void_magnet:     { id: 'void_magnet',     name: 'Void Magnet',     icon: '🧲', col: '#818cf8', desc: '3x Soul Orb collection distance' },
  aegis_core:      { id: 'aegis_core',      name: 'Aegis Core',      icon: '🛡️', col: '#38bdf8', desc: 'Shield barrier auto-recharges every 25s' }
};

export const RELIC_KEYS = Object.keys(RELIC_DEFS);

export function getRandomRelic() {
  const k = RELIC_KEYS[(Math.random() * RELIC_KEYS.length) | 0];
  return RELIC_DEFS[k];
}
