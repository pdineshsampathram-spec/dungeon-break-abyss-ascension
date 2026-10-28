// =====================================================================
//  DUNGEON BREAK — Bosses Data & Definitions
// =====================================================================

export const BOSS_CONFIGS = {
  gorgaroth: {
    id: 'gorgaroth',
    floor: 3,
    name: 'GORGAROTH',
    title: 'The Iron Jailer',
    type: 'iron_warden',
    hp: 500,
    col: '#fb923c',
    icon: '👹',
    threat: 'Mini-Boss',
    desc: 'Colossal jailer wielding an iron pillar. Slams create earth fissures.',
    weakness: 'Watch for the ground-charge telegraph; dodge outward immediately.'
  },
  malakor: {
    id: 'malakor',
    floor: 6,
    name: 'MALAKOR',
    title: 'The Void Sorcerer',
    type: 'void_reaver',
    hp: 750,
    col: '#a855f7',
    icon: '👾',
    threat: 'Mini-Boss',
    desc: 'Void sorcerer who shifts through reality and summons soul missiles.',
    weakness: 'Punish with burst damage during the 1-second recovery after teleporting.'
  },
  abyss_warden: {
    id: 'abyss_warden',
    floor: 10,
    name: 'THE ABYSS WARDEN',
    title: 'Scourge of the Sunken Citadel',
    type: 'abyss_warden',
    hp: 1100,
    col: '#ef4444',
    icon: '👑',
    threat: 'Arch-Demon',
    desc: 'Lord of the Sunken Citadel. Commander of darkness and the lightless rifts.',
    weakness: 'Extinguish summoning wards and maintain max distance during rage whirl.'
  }
};

export function getBossConfig(id) {
  return BOSS_CONFIGS[id] || null;
}
