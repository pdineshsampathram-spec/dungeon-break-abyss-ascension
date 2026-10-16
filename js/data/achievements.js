// =====================================================================
//  DUNGEON BREAK — Achievements Data
// =====================================================================

export const ACHIEVEMENTS = {
  first_blood:   { name: 'First Blood',   desc: 'Kill your first enemy',           icon: '🩸', unlocked: false },
  savior:        { name: 'Savior',         desc: 'Rescue 5 survivors',              icon: '🛡️', unlocked: false },
  untouchable:   { name: 'Untouchable',    desc: 'Complete a level without damage', icon: '✨', unlocked: false },
  sanity_keeper: { name: 'Sanity Keeper',  desc: 'Reach Level 5 with sanity >70',   icon: '🧠', unlocked: false },
  speed_runner:  { name: 'Speed Runner',   desc: 'Complete a level under 90s',      icon: '⚡', unlocked: false },
  boss_slayer:   { name: 'Boss Slayer',    desc: 'Defeat the Abyss Warden',         icon: '👑', unlocked: false },
  shield_bearer: { name: 'Shield Bearer',  desc: 'Activate the shield power',       icon: '🔷', unlocked: false },
  sharpshooter:  { name: 'Sharpshooter',   desc: 'Kill 10 enemies with bow',        icon: '🏹', unlocked: false },
  rampage:       { name: 'Mad King',       desc: 'Descend into madness and destroy the dungeon.', icon: '🔥', unlocked: false },
  betrayed:      { name: 'Untrusted Savior', desc: 'Save survivors but earn their fear.', icon: '⚖️', unlocked: false },
  true_hero:     { name: 'Light Bringer',  desc: 'Defeat the darkness without losing yourself.', icon: '🛡️', unlocked: false },
  mind_break:    { name: 'Mind Shattered', desc: 'Lose all sanity in the dungeon.', icon: '🧠', unlocked: false },
  overwhelmed:   { name: 'Swarmed',        desc: 'Fall to the endless horrors.', icon: '💀', unlocked: false },
  executed:      { name: 'Kneel Before the Abyss', desc: 'Be slain by the Abyss Warden.', icon: '👑', unlocked: false },
  consumed:      { name: 'Consumed by Darkness', desc: 'Become part of the dungeon.', icon: '🌑', unlocked: false },
  jailbreaker:   { name: 'Jailbreaker',    desc: 'Slay Gorgaroth the Iron Warden (Floor 3)', icon: '⛓️', unlocked: false },
  void_conqueror:{ name: 'Void Conqueror', desc: 'Vanquish Malakor the Void Reaver (Floor 6)', icon: '🌌', unlocked: false },
  soul_ascendant:{ name: 'Soul Ascendant', desc: 'Collect 100 total Abyss Souls', icon: '🔮', unlocked: false },
  maxed_talent:  { name: 'True Ascension', desc: 'Max out any talent rank in the Sanctum', icon: '⚡', unlocked: false },
  lore_master:   { name: 'Keeper of Lore', desc: 'Uncover all ancient lore scrolls in the dungeon', icon: '📜', unlocked: false },
  last_witness:  { name: 'The Last Witness', desc: 'You have seen every fate.', icon: '👁️', isUltimate: true, unlocked: false }
};

export const ACHIEVEMENT_KEYS = Object.keys(ACHIEVEMENTS);
