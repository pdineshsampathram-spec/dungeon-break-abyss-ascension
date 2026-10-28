# DUNGEON BREAK: ABYSS ASCENSION — CANONICAL ASSET & RENDERING SPECIFICATION

**Authoritative Source of Truth for Character, Boss, Environment, and UI Visuals**  
**Document Revision:** 1.0.0 (Post-Purge Canonical Reference)  
**Project:** Dungeon Break — Abyss Ascension (v8.0.0)  
**Render Engine:** Native HTML5 Canvas 2D (`LW = 896, LH = 640` / `960 × 540` logical viewports)

---

## 1. CORE VISUAL PHILOSOPHY & APPROVED ART DIRECTION

- **Approved Visual Style:** High-fidelity, atmospheric dark-fantasy pixel art and layered vector rendering executed via the native **Canvas 2D** rendering pipeline.
- **Rendering Architecture:** Zero external 3D engines (Three.js, Babylon, WebGL meshes), zero 3D models (`.fbx`, `.obj`, `.gltf`, `.glb`, `.blend`), and zero heavy raster sprite sheets. All characters, bosses, particle effects, and dynamic dungeon entities are rendered procedurally and deterministically in code via mathematical paths, layered lighting, gradients, pixel grids, and custom Canvas 2D drawing routines.
- **Color Palette & Atmosphere:** Deep abyssal navy (`#02040a`, `#0a0f1d`), cold dungeon stone, weathered iron, burnished antique gold accents (`#f59e0b`, `#fde68a`), incandescent volcanic orange (`#f97316`, `#ef4444`), cosmic void violet/amethyst (`#7c3aed`, `#a855f7`), and primordial ruby crimson (`#dc2626`, `#991b1b`).

---

## 2. LORD ROWAN — AUTHORITATIVE RENDERING SOURCES

Lord Rowan is the protagonist, Vanguard Knight of the Sunken Citadel.

### Primary Runtime Renderers
1. **Gameplay & Combat Renderer (Authoritative):**
   - **Source:** [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`CharacterRenderer.drawPlayer(ctx, options)`)
   - **Visual Elements:** Layered plate cuirass with pauldrons, antique brass trim, dark chainmail hauberk, visor slit with piercing interior glow, dynamic flowing crimson cloak reacting to movement velocity and wind, directional head/torso facing, footwork animation cycles (idle breathing bob, walk cycle bob, dodge roll compression), and active weapon rendering aligned with weapon inventory sockets.
2. **Cinematic Sequences Renderer:**
   - **Source:** [`js/cinematics/CinematicCharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/cinematics/CinematicCharacterRenderer.js) (`CinematicCharacterRenderer.drawRowan(ctx, x, y, scale, pose, options)`)
   - **Supported Poses:** `idle`, `walk`, `draw_sword`, `strike_sword`, `drawn_bow`, `fire_bow`, `cast_spell`, `kneel`, `prone_exhausted`, `defensive_brace`, `head_clutch`.
3. **Shattered Mind Vector Poses (Approved Runtime SVGs):**
   - **Source Directory:** [`assets/cinematics/shattered-mind/rowan/`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/assets/cinematics/shattered-mind/rowan/)
   - **Approved Files:**
     - `rowan_pose1_standing.svg`
     - `rowan_pose2_alert.svg`
     - `rowan_pose3_weapon_lowered.svg`
     - `rowan_pose4_defensive.svg`
     - `rowan_pose5_confused.svg`
     - `rowan_pose6_head_clutch.svg`
     - `rowan_pose7_kneeling.svg`
     - `rowan_pose8_collapsed.svg`
     - `rowan_shadow_duplicate.svg`
   - **Loader:** Loaded dynamically by [`js/cinematics/CinematicAssetManager.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/cinematics/CinematicAssetManager.js) specifically for the psychological memory sequence.

---

## 3. MAJOR BOSSES — AUTHORITATIVE RENDERING SOURCES

All three major bosses are implemented as production Canvas 2D procedural entities with bespoke phase telegraphs, particle auric fields, and living health reliquaries.

### 3.1. Gorgaroth, The Iron Jailer (Floor 3)
- **Gameplay Renderer:** [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`CharacterRenderer.drawGorgaroth(ctx, boss, isFlashing, pulse)`)
- **Cinematics Renderer:** [`js/cinematics/CinematicCharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/cinematics/CinematicCharacterRenderer.js) (`CinematicCharacterRenderer.drawGorgaroth(ctx, x, y, scale, pose, options)`) & `drawGorgarothCleaver`
- **Bestiary Portrait:** [`js/rendering/BestiaryPortraitRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/BestiaryPortraitRenderer.js) (`_drawGorgaroth`) delegating to `CharacterRenderer.drawGorgaroth`.
- **Boss Health Reliquary UI:** [`js/ui/BossBar.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/ui/BossBar.js) — Heavy forged-iron clamps, corner rivets, molten thermal seams, and dense 7-layer volcanic living blood fluid.
- **Visual Features:** Massive basalt and iron armor plates, volcanic molten core glowing amber-orange through chest vents, twin horned iron helm, monolithic cleaver/granite war pillar, heavy ground-strike shockwaves, and molten slag dissipation upon defeat.

### 3.2. Malakor, The Void Reaver (Floor 6)
- **Gameplay Renderer:** [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`CharacterRenderer.drawMalakor(ctx, boss, isFlashing, pulse)`)
- **Cinematics Renderer:** [`js/cinematics/CinematicCharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/cinematics/CinematicCharacterRenderer.js) (`CinematicCharacterRenderer.drawMalakor(ctx, x, y, scale, pose, options)`)
- **Bestiary Portrait:** [`js/rendering/BestiaryPortraitRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/BestiaryPortraitRenderer.js) (`_drawMalakor`) delegating to `CharacterRenderer.drawMalakor`.
- **Boss Health Reliquary UI:** [`js/ui/BossBar.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/ui/BossBar.js) — Asymmetric jagged obsidian shards, outer frame fractures, cosmetic `fragShift` displacement, and cosmic amethyst essence.
- **Visual Features:** Faceless obsidian hood with a cyclopean pulsing amethyst void eye, tattered floating shadow cloak with cosmic starfield dust, detached floating obsidian arm shards, spatial teleportation glyphs, and non-Euclidean reality tear portals.

### 3.3. The Abyss Warden (Floor 10)
- **Gameplay Renderer:** [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`CharacterRenderer.drawWarden(ctx, boss, isFlashing, pulse)`)
- **Telegraph Renderer:** [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`CharacterRenderer.drawWardenTelegraphs(ctx, boss)`)
- **Cinematics Renderer:** [`js/cinematics/CinematicCharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/cinematics/CinematicCharacterRenderer.js) (`CinematicCharacterRenderer.drawAbyssWarden(ctx, x, y, scale, pose, options)`)
- **Bestiary Portrait:** [`js/rendering/BestiaryPortraitRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/BestiaryPortraitRenderer.js) (`_drawWarden`) delegating to `CharacterRenderer.drawWarden`.
- **Boss Health Reliquary UI:** [`js/ui/BossBar.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/ui/BossBar.js) — Gothic cathedral 5-spire stepped crown upper silhouette, corner ruby pylon spires, and primordial ruby blood.
- **Visual Features:** Regal gothic full-plate armor in obsidian and antique silver, 5-spire crown helm, six unfurled demonic void wings with procedural membrane feathers, towering two-handed Dreadblade with blood-runes, and a pulsating ruby core at the sternum.

---

## 4. APPROVED ENVIRONMENT, UI, AND CINEMATIC ASSETS

### 4.1. Main Menu Scene
- **Authoritative Background Image:** [`assets/menu/abyss_threshold_bg.png`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/assets/menu/abyss_threshold_bg.png) (and fallback [`assets/menu/abyss_threshold_bg.jpg`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/assets/menu/abyss_threshold_bg.jpg))
- **Live Canvas Scene:** [`js/cinematics/MainMenuScene.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/cinematics/MainMenuScene.js) — Multi-layer parallax chasm motes, concentric rotating abyss accretion dial, brazier embers, deep volumetric fog, and promontory rim lighting.
- **UI Overlay:** [`js/ui/MainMenu.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/ui/MainMenu.js) — Bespoke abyssal regalia buttons, keyboard/mouse navigation, status plaques, and audio awakening prompt.

### 4.2. Shattered Mind Cinematic Vector Assets
Located in [`assets/cinematics/shattered-mind/`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/assets/cinematics/shattered-mind/):
- **Environment:** `environment/gothic_chamber_bg.svg`, `baroque_pillars_mid.svg`, `chains_and_debris_fg.svg`
- **Weapons:** `weapons/cinematic_sword.svg`, `cinematic_dagger.svg`, `cinematic_axe.svg`, `cinematic_spear.svg`, `cinematic_bow.svg`
- **Eyes:** `eyes/supernatural_eye_master.svg`, `eyes/eye_half_open.svg`, `eyes/eye_slit.svg`
- **Memories:** `memories/mem_sealed_gate.svg`, `mem_lyra_silhouette.svg`, `mem_warden_throne.svg`, `mem_blood_stones.svg`, `mem_abandoned_corridor.svg`, `mem_dungeon_entrance.svg`

### 4.3. Authoritative Background Audio Tracks
Located in [`Background themes/`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/Background%20themes/):
- `Cathedral of Deep Navy.mp3`
- `Iron Chains of the Dark.mp3`
- `Last_Steps_on_Cold_Stone.mp3`
- `Ostinato di Ombra.mp3`
- `The Ruler's Burden.mp3`
- `The Shadow's Toll.mp3`
- `Untitled.mp3`
- `Void Motif.mp3`
- `wizard-2bfe5a8ff3d34ffab6cd0f6158393611-00-TRACK_01-audio_base64-82e2453909674687.wav`

---

## 5. REMOVED OBSOLETE ASSETS INVENTORY

During the repository audit and canonical asset purge, the following non-production artifacts were permanently purged to eliminate developer confusion and reclaim disk space:
1. **`screenshots/` (233 PNG files, ~95 MB):** Obsolete development test captures, phase verification exports, baseline comparison shots, and outdated manual test screenshots.
2. **`scratch/*.png` (190 PNG files, ~88 MB):** Redundant screenshot dumps and before/after captures generated during automated browser tests.
3. **`test_screenshots/` (4 PNG files, ~4.6 MB):** Outdated temporary captures from preliminary manual game runs.

**Total Disk Space Reclaimed:** **~187.6 MB** (427 screenshot files removed).

---

## 6. DELIBERATELY PRESERVED ASSETS & ARTIFACTS

1. **`scratch/*.js` & `scratch/*.py`:** All 28 automated browser test suites, integration harnesses, and scene capture scripts were preserved to maintain full testing capabilities.
2. **`index.html.monolith_backup`:** Preserved historical monolithic architecture checkpoint.
3. **`assets/menu/abyss_threshold_bg.png` & `.jpg`:** Preserved active runtime Main Menu background image.
4. **`assets/cinematics/shattered-mind/**/*.svg`:** All 26 vector SVG assets preserved for runtime cinematic playback.
5. **`Background themes/*`:** All 9 audio files preserved.

---

## 7. MANDATORY AGENT INSTRUCTION & COMPLIANCE RULE

> **CRITICAL RULE FOR ALL FUTURE AI AGENTS:**  
> **Before creating or selecting Rowan, boss, enemy, or UI artwork, inspect the current production renderer and canonical asset guide. Do not revive deleted experimental variants, treat screenshots as production artwork, or replace approved visuals without explicit authorization.**  
>  
> Always respect that `Dungeon Break — Abyss Ascension` is built on a high-fidelity **Canvas 2D procedural rendering architecture**. There are no 3D meshes or external sprite atlases for gameplay entities. Any visual modifications must be made directly within the authoritative renderers documented in this file.
