// =====================================================================
//  DUNGEON BREAK — Lore Scrolls & Survivor Dialogue Data
// =====================================================================

export const LORE_SCROLLS_DATA = [
  { id: 'seal', title: 'The Forgotten Seal', text: 'Before the kingdom crumbled into ashes, this labyrinth was carved not as a dungeon, but as a vault to lock away what sleeps below.' },
  { id: 'warden', title: 'The Warden\'s Vow', text: 'I swore to guard the dark gates until the sun died. The sun still shines above, yet eternal night has taken my eyes.' },
  { id: 'breath', title: 'The Living Stone', text: 'The walls have a pulse. Place your ear against the mortar in the silence, and you will hear them breathing.' },
  { id: 'void', title: 'The Lightless Tide', text: 'Sanity is only a veil. In the deepest dark, the illusion dissolves and the mind reflects the void.' },
  { id: 'deserters', title: 'The Lost Battalion', text: 'Those who tried to flee were not struck down. The halls simply shifted around them, forever closing the way back.' },
  { id: 'blood', title: 'The Ancient Rite', text: 'Blood remembers what steel forgets. Only through willing sacrifice do the inner sanctum gates open.' },
  { id: 'sovereign', title: 'The Sleeper Awakens', text: 'The Warden is only a gatekeeper. What stirs beneath his throne has waited ten thousand years.' },
  { id: 'crown', title: 'The Abyss King', text: 'He who defeats the darkness does not escape it. He takes up the mantle and becomes the new crown.' }
];

export const SURVIVOR_QUOTES = [
  'Thank the stars! The shadows were whispering my true name...',
  'Beware Floor 3! Gorgaroth\'s club will shatter the ground beneath you!',
  'The Warden fears light! Keep your torches close!',
  'There are relics hidden in the dead-end chambers... look for glowing seals.',
  'I heard weeping in the walls... it wasn\'t human.',
  'If your sanity fails, the dungeon will feast on your memories.'
];

export function getRandomSurvivorQuote() {
  return SURVIVOR_QUOTES[(Math.random() * SURVIVOR_QUOTES.length) | 0];
}
