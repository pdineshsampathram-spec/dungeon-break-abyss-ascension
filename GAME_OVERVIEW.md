# 🏰 DUNGEON BREAK: OMNI ASCENSION (v10.0) — MASTER GAME DESIGN BIBLE & COMPLETE OVERVIEW

> **Game Title**: *Dungeon Break: Omni Ascension*  
> **Version**: 10.0 (Play Store Production Ready — Cinematic & Terrain Overhaul)  
> **Lead Designer & Director**: Dinesh Polimera  
> **Engine**: Pure Vanilla HTML5 Canvas + Web Audio API Synthesis (Zero external asset dependencies, 100% offline capable)  
> **Platform**: Web Desktop, Mobile Browsers & Android (via Capacitor)  
> **Target Frame Rate**: Locked 60 FPS  

---

## 1. 🌟 EXECUTIVE SUMMARY & GAME IDENTITY

*Dungeon Break: Omni Ascension* is an intense, atmospheric top-down roguelite action-RPG built from the ground up to deliver AAA-grade responsiveness, deep tactical combat, psychological horror, and an emotional father-daughter narrative arc—all contained within an ultra-optimized, zero-dependency codebase.

Drawing inspiration from *Hades*, *Dead Cells*, and *Darkest Dungeon*, the player assumes the role of **Lord Rowan**, a fallen paladin who plunges through 10 perilous subterranean floors into the Maw of the Abyss to rescue his abducted daughter, **Lyra**, from the clutches of the ancient **Abyss Warden**.

---

## 2. 🎭 THE NARRATIVE & LORE UNIVERSE

### The Core Story Arc: Lord Rowan & Lyra
Before the cataclysm, Lord Rowan commanded the Citadel Guard. When the shadow cult of the Inquisitor breached the sacred sanctum, Rowan’s daughter Lyra was dragged into the underworld to serve as the living vessel for the ancient Abyss Warden. Stripped of his titles and armed only with his blade and unbroken resolve, Rowan descends into the lightless abyss.

### 4 Interactive Memory Echoes (Narrative Dilemmas)
Throughout the descent, Rowan discovers glowing celestial fragments of his daughter’s memory, forcing him to choose between preserving his humanity or succumbing to abyssal bloodlust:

1. **Floor 2 — Echo I: The Broken Music Box**
   - *Memory*: A small brass music cylinder etched with starlight melodies Lyra wound during citadel storms.
   - *Dialogue*: *"Papa, the music box stopped... Can you wind it again before the shadows reach the window?"*
   - **Choice A (Mercy)**: 🕊️ *Wind the Music Box* (+30 Sanity & +2 Max HP)
   - **Choice B (Vengeance)**: ⚔️ *Channel the Vow* (+15 Abyss Souls & +20% ATK DMG)

2. **Floor 4 — Echo II: The Golden Locket**
   - *Memory*: Warm gold encasing a single strand of amber hair, pulsing in rhythm with Rowan's heartbeat.
   - *Dialogue*: *"Wear this, father. As long as you breathe, I know you will come for me. Even at the bottom of the world."*
   - **Choice A (Mercy)**: 🕊️ *Press it to Your Heart* (+40 Sanity & Full HP Heal)
   - **Choice B (Vengeance)**: ⚔️ *Swear the Blood Oath* (+25 Souls & 15s Aegis Shield)

3. **Floor 7 — Echo III: The Obsidian Thorn**
   - *Memory*: A petrified shard of void-glass dropped during the ritual of betrayal.
   - *Dialogue*: *"The Inquisitor lied... He said you chose your oath over me. But I saw the light of your blade in the dark."*
   - **Choice A (Mercy)**: 🕊️ *Forgive the Memory* (+35 Sanity & +15% Speed)
   - **Choice B (Vengeance)**: ⚔️ *Let Fury Ignite* (+35 Souls & Vampiric Fury)

4. **Floor 9 — Echo IV: The Starlight Whisper**
   - *Memory*: The final ethereal imprint right before the Warden's throne room.
   - *Dialogue*: *"Do not weep for what is broken, father. Slay the Warden... and let our souls fly home."*
   - **Choice A (Mercy)**: 🕊️ *Embrace the Oracle's Blessing* (+50 Sanity, +4 Max HP, 20s Shield)
   - **Choice B (Vengeance)**: ⚔️ *Awaken the God-Slayer* (+50 Souls & +50% ATK DMG)

### 8 Ancient Lore Scrolls
Hidden throughout secret dead-ends, these collectible scrolls reveal the world's deep history:
- **Scroll I: The Forgotten Seal** — The initial chaining of the abyss.
- **Scroll II: The Warden's Vow** — How the guardian became the tormentor.
- **Scroll III: The Living Stone** — Why the dungeon walls shift and regenerate.
- **Scroll IV: The Lightless Tide** — The cosmic horror that slumbers below.
- **Scroll V: The Lost Battalion** — The fate of Rowan’s predecessor knights.
- **Scroll VI: The Ancient Rite** — The ritual required to awaken the Sleeper.
- **Scroll VII: The Sleeper Awakens** — The corruption of divine power.
- **Scroll VIII: The Abyss King** — The origin of the throne.

### Survivor NPCs & Dynamic Speech Bubbles
Scattered throughout the dark cells are trapped survivors. Rescuing them restores sanity (`+14 Sanity`) and prompts dynamic overhead speech bubbles warning of upcoming traps, mini-bosses, and secret pathways.

### 3 Branching Endings
The ending dynamically calculates based on Rowan's final Sanity and the number of rescued survivors:
1. **🕊️ The True Hero (Sanity > 50% & Survivors Rescued $\ge 1$)**: Rowan slays the Warden, frees Lyra from the crystal throne, and escapes into the sunrise with the survivors.
2. **⚔️ The Insanity Rampage (Sanity < 50% & Survivors Rescued $< 4$)**: Corrupted by the void, Rowan slays the Warden but claims the dark throne for himself, becoming the new terror of the underworld.
3. **🗡️ The Betrayal (Survivors Rescued $> 4$ but Sanity Broken)**: Rowan saves his daughter, but the surviving deserters seal the entrance behind them, trapping Rowan in the abyss forever.

---

## 3. 🕹️ CORE GAMEPLAY LOOP & PROGRESSION

```
[ Title Screen / Living Hub ]
         │
         ▼
[ Floor Generation (1 to 10) ] ◄── Dynamic Dungeon Mutation Roll
         │
         ├── Explore Corridors & Manage Sanity (Torchlight & Shadow)
         ├── Combat & Weapon Switch (Melee, Ranged, Special)
         ├── Rescue Survivors & Collect Lore Scrolls / Memory Echoes
         │
         ▼
[ Floors 3 & 6: Mini-Boss Trials (Gorgaroth & Malakor) ]
         │
         ▼
[ Cosmic Portal Singularity (Tile 2) ]
         │
         ▼
[ Cosmic Rift Hyper-Warp Transition (Lightspeed streaks & Monologue) ]
         │
         ▼
[ Floor 10: The Abyss Warden Boss Encounter ]
         │
         ▼
[ Ending Cinematic & Meta-Progression (Abyss Sanctum Talents & NG+) ]
```

### The 10 Dungeon Floors:
- **Floors 1–2: Stone Keep** (Tutorial, Skeletons, Ghouls, Echo I).
- **Floor 3: Iron Fissure** (Mini-Boss: *Gorgaroth, Breaker of Chains*).
- **Floors 4–5: Sunken Crypt** (Traps, Demons, Echo II).
- **Floor 6: Void Rifts** (Mini-Boss: *Malakor, The Void Reaver*).
- **Floors 7–8: Molten Core** (Fire jets, Wraiths, Echo III).
- **Floor 9: The Threshold of Oblivion** (Final traps, high enemy density, Echo IV).
- **Floor 10: Throne of the Abyss Warden** (Epic multi-phase boss showdown).

### The Sanity System
- **Sanity Drain**: Constant psychological degradation (`getDiff(LV).sdrain * dt`), accelerated in unlit shadows.
- **Sanity Recovery**: Slain enemies drop sanity on weapon kills, rescuing survivors restores `+14%`, and memory choices grant massive sanity boosts.
- **Psychological Hallucinations**:
  - `Sanity < 35%`: Creeping corner tentacles and blinking phantom red eyes gaze out of dark hallways.
  - `Sanity <= 0%`: Instant psychological collapse death (*"Shattered Mind"*).

---

## 4. ⚔️ COMBAT SYSTEM, WEAPONS & AFFIXES

### 5 Archetype Weapons
1. **Steel Sword**: Fast balanced slashing weapon with sweeping arc and knockback.
2. **Hunter's Bow**: Long-range projectile piercer with pinpoint accuracy.
3. **Executioner's Axe**: High cleave damage with wide arc and extended hit-stop freeze.
4. **Shadow Dagger**: Ultra-rapid flurry attacks with high critical strike bonus.
5. **Obsidian Spear**: Extended reach piercing weapon that skewers multiple enemies in a straight corridor.

### 3-Weapon Quick Hotbar
- Switch weapons instantly via **keys `1`, `2`, `3`** or by tapping on-screen weapon cards on mobile.
- Allows seamless switching between melee crowd control, long-range archery, and rapid boss execution.

### Procedural Weapon Affixes
Weapons drop with color-coded prefixes and suffixes:
- **Prefixes**:
  - 🔥 **Infernal**: Ignites enemies on hit with lingering fire damage over time.
  - ❄️ **Glacial**: 40% movement and attack slow on target.
  - 🩸 **Vampiric**: 15% chance to siphon health on strike.
  - ⚡ **Thunderous**: Arcs chain lightning to nearby foes.
  - 💀 **Cursed**: Massive +40% flat damage, but costs 1 Sanity per swing.
- **Suffixes**:
  - **of Swiftness**: -25% attack cooldown.
  - **of Force**: +100% heavy knockback.
  - **of Insight**: Restores +6 Sanity on kill.

---

## 5. 🛡️ PASSIVE RELICS & POWER-UPS

Relics are permanent artifact passives discovered in gilded treasure chambers:
1. 🔥 **Phoenix Feather**: Fatal damage is negated once per run; revives Rowan to 50% HP with a 3-second divine shield burst.
2. 🌑 **Shadow Cloak**: Every 3 enemy kills grants a 2.5-second complete invulnerability shield.
3. 🦴 **Bone Charm**: Restores +2 HP immediately upon stepping into each new floor.
4. 🍷 **Blood Chalice**: Increases soul orb drops by +50% from all fallen enemies.
5. 🧲 **Void Magnet**: Increases soul orb magnetic pull distance from 4 to 10 tiles.
6. 🛡️ **Aegis Core**: Recharges a protective energy shield automatically every 25 seconds.

---

## 6. 🔮 META-PROGRESSION: THE ABYSS SANCTUM

Persistent progression across deaths and victories through the **Abyss Sanctum** modal:
- **Currencies**:
  - 🔮 **Abyss Souls**: Dropped by slain enemies and mini-bosses.
  - 🪙 **Prestige Tokens**: Awarded for clearing Floor 10 or completing runs.
- **5-Branch Talent Tree**:
  1. 🩸 **Bloodline Vigor**: +2 Max HP per rank.
  2. 🧠 **Mind Sanctuary**: -12% Sanity drain per rank.
  3. ⚔️ **Abyssal Might**: +15% Weapon damage per rank.
  4. ⚡ **Phantom Haste**: +8% Move & attack speed per rank.
  5. 👁️ **Vampiric Touch**: +5% Lifesteal chance per rank.
- **Abyss Layers (New Game+)**:
  - Each completion unlocks the next Abyss Layer with scaling enemy speed, damage, and elite mutation spawn chances.

---

## 7. 🌋 DUNGEON MUTATIONS & HAZARDS

Each floor rolls a random modifier with custom color grading and HUD encounter banners:
- **Inferno Chamber**: Floor lava pools, warm ember particles, and increased demon damage.
- **Haunted Crypt**: Spectral mist, phantom wraith spawns, and accelerated sanity drain.
- **Elite Guard**: Monsters gain armor plating and 30% higher HP.
- **Abyssal Eclipse**: Total darkness; lantern illumination radius is halved.
- **Adrenaline Surge**: Player and monsters gain +25% move speed and attack speed.

### Dynamic Dungeon Traps:
- Retractable floor spikes (timed cycle).
- Fire spray vents.
- Wall poison dart launchers.
- Telegraphed mini-boss fissure slams.

---

## 8. 🎨 ADVANCED VISUALS, CINEMATICS & TERRAIN REBUILD

1. **Rebuilt Chasms & Subterranean Abyss Void**:
   - Zero circular polka-dot artifacts.
   - Deep obsidian `#020308` depth void with vertical gradient drops.
   - Dynamic 4-way cliff drop-shadows with jagged highlighted stone rims and vertical fissure striations.
   - Organic abyssal dust motes floating across void abysses.
2. **2.5D Heavy Masonry Bridges**:
   - Heavy granite slabs with alternating paver joints and worn center paths.
   - 3D stone balustrade guardrails with decorative post caps on chasm-facing sides.
   - Heavy abutment brackets anchoring into solid floor.
   - Dynamic contact drop-shadows cast down into the chasm abyss.
   - `rndFloorOpen` 8-neighbor clearance guarantees shrines and altars never spawn on chasms or bridges.
3. **Multi-Shot Playable Movie Sequences (Ruined Throne Room Staging)**:
   - All three endings staged in the ruined **Throne of the Abyss** (cracked floor, broken throne, toppled basalt pillars, dying braziers, floating ash particles, collapsing rift).
   - **🕊️ Hero Ending (7 Shots + Magic Moment, ~42s)**:
     - Boots close-up & armor clank -> Over-shoulder view of collapsing rift -> Slow entrance of limping survivors -> Rowan face close-up ("It's over") -> Rotating camera & warm gold light shift -> Ceiling flash & golden sunlight beam -> Wide cathedral reveal -> Walk into light -> White fade -> *"THE ABYSS RELEASED YOU"*.
   - **🗡️ Betrayal Ending (8 Shots + Attack, ~40s)**:
     - Cold blue-gray light -> Relieved survivors approach ("You really came back for us") -> Side profile tense silence -> Concealed dagger reveal -> Surrounded -> Rowan eye close-up ("...Why?") -> Lunge attack, RED FLASH, HIT-STOP, loud impact shake -> Rowan falls to one knee -> Wide dark silhouette -> *"TRUST WAS ANOTHER TRAP"*.
   - **⚔️ Rampage Ending (7 Shots + Battle Cuts, ~38s)**:
     - Floor sweep across bodies & blood -> Bloodied blade -> Distant doorway footsteps -> 1-2-4-8-15+ guard tension -> Massive army wide shot -> Rowan raises weapon ("Come") -> Overhead silhouette battle cuts -> Arrow thud beside Rowan -> Crowd engulfs -> *"THE ABYSS REMEMBERED THE BLOOD"*.
4. **Differentiated Death Sequences**:
   - **Normal Enemy / Boss Death (10s Multi-Phase Physical Collapse)**:
     - Hit-stop -> Weapon clang -> Stagger -> One knee -> Hands touch ground -> Collapse -> Heartbeat & red vignette -> *"FALLEN IN THE ABYSS"*.
   - **Shattered Mind Sanity Death (32s 8-Shot Psychological Horror)**:
     - Muffled void -> Second Rowan standing behind -> 2, 3, 5 asynchronous copies -> Red eyes in walls -> Breathing/distorted walls & head clutch -> Whispers ("You were never escaping / only going deeper") -> Subliminal rapid flashes -> Collapse -> *"SHATTERED MIND"*.
   - **3 Action Buttons**: **⚔️ RETRY RUN**, **🏛️ SANCTUM**, **🏰 TITLE SCREEN** with hotkeys (`Enter`/`Space`, `S`, `Esc`).
5. **Credits Presentation**:
   - Lead Design & Direction strictly attributed to **Dinesh Polimera** (zero Antigravity Team mentions).
   - Ending scene -> Silence -> Black screen -> Lore text -> DUNGEON BREAK logo -> Credits with dynamic world camera backdrop tracking through the world based on ending type.
6. **2.5D Ambient Occlusion & Wall Drop Shadows**:
   - Directional soft shadows (`0.55` top, `0.35` side) cast by walls onto adjacent floor tiles.
   - Chiselled top rims and bevels turn flat grid tiles into 3D dungeon corridors.
7. **Cosmic Portal Singularity & Hyper-Warp**:
   - Swirling wormhole on Tile 2 with dual counter-rotating celestial rings.
   - Lightspeed transition tunnel with 42 radial chromatic streaks, spinning gravitational rings, and Rowan's floor monologue.
8. **Hit-Stop Micro-Freeze & Chromatic Shockwaves**:
   - 40–80ms frame freeze on critical blows with expanding refractive ripple shockwaves (`spawnImpactShockwave`).
9. **Living Title Scene**:
   - Parallax drifting abyssal dust motes, breathing gold logo, and 6 animated menu cards.

---

## 9. 🎵 PURE WEB AUDIO API SYNTHESIZER

Zero external MP3/WAV files! Every audio element is synthesized procedurally in real-time:
- **Dynamic Adaptive Music Layers**:
  - Sub-bass drone oscillators.
  - Sinister arpeggiated synth plucks.
  - Tension percussion and tempo shifts during mini-boss and boss fights.
- **Procedural Sound Effects**:
  - Melee swooshes with white noise filters.
  - Heavy bone-crunching impact bursts.
  - Heartbeat bass thump at low HP.
  - Cosmic wormhole dimensional whooshes.
  - Level-up bells and parchment typewriter keystrokes.

---

## 10. 📖 THE ABYSS GRIMOIRE & BESTIARY (3 TABS)

Accessible anytime from Title or with hotkey `[C]`:
1. **📜 Chronicles**: Browser for all 8 discovered lore scrolls with typewriter reveal.
2. **💀 Bestiary**:
   - 💀 *Skeleton Warrior* (Threat: Low | Weakness: Heavy knockback)
   - 🧟 *Crypt Ghoul* (Threat: Medium | Weakness: Glacial chill)
   - 😈 *Infernal Demon* (Threat: High | Weakness: Circle-strafing during casting)
   - 👻 *Shadow Wraith* (Threat: Lethal | Weakness: Bright torch halos)
   - 👹 *Gorgaroth, Breaker of Chains* (Threat: Mini-Boss | Weakness: Outward dodge on telegraph)
   - 👾 *Malakor, The Void Reaver* (Threat: Mini-Boss | Weakness: Burst damage after teleport recovery)
   - 👑 *The Abyss Warden* (Threat: Boss | Weakness: Divine shield exploitation)
3. **✨ Memories**: Rowan and Lyra's unlocked memory fragments and quote archive.

---

## 11. 📱 MOBILE & GOOGLE PLAY STORE READINESS

- **100% Offline Capable**: Zero CDNs, zero remote fonts, zero external sound or texture files.
- **Customizable Virtual Touchpad**: On-screen dynamic joystick, attack button, shoot button, and special button. Includes an in-game Edit Mode to reposition and resize controls.
- **Hardware-Accelerated Fullscreen**:
  - Configured in `capacitor.config.json` with `androidScheme: "https"`, immersive fullscreen, and landscape lock.
  - Step-by-step export workflow documented in `PLAYSTORE_EXPORT_GUIDE.md`.

---

## 12. 🎮 CONTROLS CHEAT SHEET

| Action | Keyboard / Mouse | Touchscreen / Mobile |
|---|---|---|
| **Move** | `W, A, S, D` or `Arrow Keys` | Virtual Joystick (Left Thumb) |
| **Attack / Cleave** | `Space` or `Left Click` | ⚔️ Attack Button (Right Thumb) |
| **Shoot Arrow** | `Shift` or `Right Click` | 🏹 Shoot Button |
| **Special Ability** | `Q` | ✨ Special Button |
| **Switch Weapons** | `1`, `2`, `3` | Tap Weapon Slot 1, 2, or 3 |
| **Tactical Minimap** | `M` | Tap Minimap (Top-Right) |
| **Open Codex / Bestiary** | `C` | Tap Menu / Codex Button |
| **Open Abyss Sanctum** | `U` | Tap Sanctum Button |
| **Pause / Speed Adjust** | `Esc` or `P` | Tap ⏸ Button (Top-Right) |
| **Game Speed Modifier** | `[` / `]` or In-Game Panel | Speed Toggle (1.0x, 1.25x, 1.5x) |
