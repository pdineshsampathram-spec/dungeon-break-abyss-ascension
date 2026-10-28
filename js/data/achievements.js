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
  last_witness:  { name: 'The Last Witness', desc: 'You have seen every fate.', icon: '👁️', isUltimate: true, unlocked: false },

  // Phase 6: Tiered Survivor Progression
  savior_2:        { name: 'Savior II',            desc: 'Rescue 10 survivors cumulatively across expeditions', icon: '🛡️', unlocked: false },
  savior_3:        { name: 'Savior III',           desc: 'Rescue 15 survivors cumulatively across expeditions', icon: '🛡️', unlocked: false },
  perfect_rescue:  { name: 'No Soul Left Behind',  desc: 'Rescue every eligible survivor generated in a single completed expedition', icon: '✨', unlocked: false },

  // Phase 6: Lifetime Boss Defeat Progression
  gorgaroth_nemesis: { name: 'Chain Breaker\'s End', desc: 'Defeat Gorgaroth 5 times', icon: '⛓️', unlocked: false },
  malakor_nemesis:   { name: 'Void Exorcist',        desc: 'Defeat Malakor 5 times',   icon: '🌌', unlocked: false },
  warden_nemesis:    { name: 'Scourge of the Warden',desc: 'Defeat The Abyss Warden 5 times', icon: '👑', unlocked: false },

  // Phase 6: Lifetime Death Progression
  deaths_5:        { name: 'Ashen Novice',         desc: 'Succumb to the dungeon 5 times across runs', icon: '💀', unlocked: false },
  deaths_10:       { name: 'Crucible Veteran',      desc: 'Succumb to the dungeon 10 times across runs', icon: '💀', unlocked: false },
  deaths_25:       { name: 'Eternal Revenant',     desc: 'Succumb to the dungeon 25 times across runs', icon: '💀', unlocked: false },

  // Phase 6: Floor-Specific Speedrun Achievements
  speed_floor_1:   { name: 'Swift Passage I',      desc: 'Clear Floor 1 in under 60 seconds', icon: '⚡', unlocked: false },
  speed_floor_2:   { name: 'Swift Passage II',     desc: 'Clear Floor 2 in under 60 seconds', icon: '⚡', unlocked: false },
  speed_floor_3:   { name: 'Iron Executioner',     desc: 'Defeat Gorgaroth on Floor 3 in under 90 seconds', icon: '⚡', unlocked: false },
  speed_floor_4:   { name: 'Swift Passage IV',     desc: 'Clear Floor 4 in under 60 seconds', icon: '⚡', unlocked: false },
  speed_floor_5:   { name: 'Swift Passage V',      desc: 'Clear Floor 5 in under 60 seconds', icon: '⚡', unlocked: false },
  speed_floor_6:   { name: 'Void Purifier',        desc: 'Defeat Malakor on Floor 6 in under 120 seconds', icon: '⚡', unlocked: false },
  speed_floor_7:   { name: 'Swift Passage VII',    desc: 'Clear Floor 7 in under 60 seconds', icon: '⚡', unlocked: false },
  speed_floor_8:   { name: 'Swift Passage VIII',   desc: 'Clear Floor 8 in under 60 seconds', icon: '⚡', unlocked: false },
  speed_floor_9:   { name: 'Swift Passage IX',     desc: 'Clear Floor 9 in under 60 seconds', icon: '⚡', unlocked: false },
  speed_floor_10:  { name: 'Apotheosis Swift',     desc: 'Defeat The Abyss Warden on Floor 10 in under 180 seconds', icon: '⚡', unlocked: false }
};

export const ACHIEVEMENT_KEYS = Object.keys(ACHIEVEMENTS);
