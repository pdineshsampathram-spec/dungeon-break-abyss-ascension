// =====================================================================
//  DUNGEON BREAK — Narrative Story Memories Data
// =====================================================================

export const STORY_MEMORIES = [
  {
    floor: 2,
    id: 'echo_musicbox',
    title: 'Echo I: The Broken Music Box',
    quote: '"Papa, the music box stopped... Can you wind it again before the shadows reach the window?"',
    lore: 'A small brass cylinder etched with starlight melodies. Lyra used to turn the key whenever thunder shook the citadel towers. Even beneath miles of dark granite, the delicate chimes still echo.',
    choiceA: { label: '🕊️ Wind the Music Box', desc: '+30 Sanity & +2 Max HP' },
    choiceB: { label: '⚔️ Channel the Vow', desc: '+15 Abyss Souls & +20% ATK DMG' }
  },
  {
    floor: 4,
    id: 'echo_locket',
    title: 'Echo II: The Golden Locket',
    quote: '"Wear this, father. As long as you breathe, I know you will come for me. Even at the bottom of the world."',
    lore: 'Warm gold encasing a single strand of amber hair. It pulses in rhythm with Rowan\'s own heartbeat, growing warmer the deeper into the abyss he marches.',
    choiceA: { label: '🕊️ Press it to Your Heart', desc: '+40 Sanity & Full Heal' },
    choiceB: { label: '⚔️ Swear the Blood Oath', desc: '+25 Abyss Souls & Shield Core' }
  },
  {
    floor: 7,
    id: 'echo_thorn',
    title: 'Echo III: The Obsidian Thorn',
    quote: '"The Inquisitor lied... He said you chose your oath over me. But I saw the light of your blade in the dark."',
    lore: 'A shard of petrified void-glass dropped during the ritual of betrayal. Through the reflection, Rowan glimpses the high chamber of the palace where his daughter was bound.',
    choiceA: { label: '🕊️ Forgive the Memory', desc: '+35 Sanity & +15% Speed' },
    choiceB: { label: '⚔️ Let Fury Ignite', desc: '+35 Abyss Souls & Siphon Aura' }
  },
  {
    floor: 9,
    id: 'echo_starlight',
    title: 'Echo IV: The Starlight Whisper',
    quote: '"Do not weep for what is broken, father. Slay the Warden... and let our souls fly home."',
    lore: 'The final ethereal imprint before the Warden\'s throne room. Her voice is clear, luminous, and free of terror. She waits beyond the iron gates.',
    choiceA: { label: '🕊️ Embrace the Oracle\'s Blessing', desc: '+50 Sanity, +4 Max HP & Full Shield' },
    choiceB: { label: '⚔️ Awaken the God-Slayer', desc: '+50 Souls & +50% ATK DMG' }
  }
];

export function getStoryMemoryForFloor(lv) {
  return STORY_MEMORIES.find(m => m.floor === lv) || null;
}
