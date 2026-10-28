# MAIN MENU ART DIRECTION & COMPOSITIONAL SPECIFICATION
**Project:** Dungeon Break — Abyss Ascension  
**Subsystem:** Main Menu Cinematic Environment & UI Overhaul  
**Target Logical Canvas:** 896 × 640 (`LW = 896, LH = 640`, 16:10 / 16:9 responsive)

---

## 1. COMPOSITIONAL BALANCE & SCENIC GOLDEN RATIO

### The Problem
In the previous layout, the left menu column occupied `x ∈ [72, 342]`. The right scenic area spanned `x ∈ [342, 896]` (width = 554px, center = 619px). However, the cathedral archway and live portal were pinned at `x = 782`, only 114px from the right screen boundary. This caused severe right-edge crowding, left the center-right chasm unbalanced, and broke the sightline between Rowan (`x = 530`) and the gateway.

### The Solution
1. **Scenic Horizon Re-centering:**
   - The background illustration (`abyss_threshold_bg.png`) is widened to 1600px with matching atmospheric chasm and cyclopean basalt architecture, allowing the camera to pan the cathedral portal directly into the visual sweet spot of the scenic area (`x ≈ 640–652`).
   - Portal focal coordinates are shifted from `(782, 306)` to `(646, 298)`.
   - The monumental cathedral arch, flanking spires, and grand descending staircase now frame the portal symmetrically.
2. **Foreground Promontory & Character Anchor:**
   - Rowan is anchored at `x = 468, y = 462` (standing on the cantilevered precipice facing east toward the portal).
   - The ancient tripod brazier is anchored at `x = 388, y = 492`, casting a warm amber glow (`#fef08a` → `#ea580c`) across the flagstones.
   - The distance from the menu column (`x = 340`) to Rowan (`x = 468`) is 128px; from Rowan to Portal (`x = 646`) is 178px; from Portal to Right Edge (`x = 896`) is 250px. This creates a natural, rhythmic tripartite composition: **Interface Rail → Vanguard Anchor → Abyssal Singularity**.

---

## 2. COLOR PALETTE HARMONIZATION

| Layer / Element | Prior Conflicting Tone | New Harmonized Palette | Rationale |
| :--- | :--- | :--- | :--- |
| **Title Primary Lettering** | Intense Orange-Gold (`#f59e0b` / `#ea580c`) | Pale Aged Ivory & Warm Gold (`#fef3c7`, `#fde68a`, `#d97706`) | Dignified antique metalwork; matches Lord Rowan's cuirass inlays without screaming neon orange. |
| **Title Bevel & Shadow** | Generic amber blur | Deep abyssal charcoal & midnight navy (`#030712`, `#0b0f19`) | Provides crisp contrast against dark purple cavern sky. |
| **Subtitle ("ABYSS ASCENSION")** | Detached violet badge | Antique Brass & Muted Amethyst (`#e2d4be` with `#a855f7` diamond accents) | Integrates directly under "BREAK" as an inscribed architectural rubric. |
| **Button Frames** | Plain flat stroked rectangles | Forged Obsidian Core (`#090d16` to `#04060a`) with Antique Brass Mortise Brackets (`#ca8a04`, `#78350f`) | Tactile physical artifacts belonging to the Sunken Citadel. |
| **Hover / Focus State** | Thin bright line | Illuminated Antique Gold Rim (`#fde68a`), warm inner amber wash (`rgba(245,158,11,0.12)`), and glowing corner rivets | Instant, elegant tactile feedback. |
| **Primary Button ("START JOURNEY")** | Indistinguishable rectangle | Vanguard Regalia Plinth with elevated crown corners and golden runic filigree | Clear visual hierarchy indicating primary game entry. |

---

## 3. BUTTON ARTWORK ARCHITECTURE (NINE-SLICE PIXEL ART)

- **Directory:** `assets/menu/buttons/`
- **Native Resolution:** Built with a scalable 9-slice grid (12px fixed corners, repeatable 1px edges, tiled center).
- **Pixel Art Discipline:** 100% crisp pixel edges, 1px highlight bevels on top/left, 1px shadow bevels on bottom/right, 4 corner mechanical rivet studs, and runic bracket notches.
- **States:**
  1. `button_normal.png` (Base dark obsidian with weathered bronze corners)
  2. `button_hover.png` (Focused/hovered with radiant pale gold rim & glowing rivets)
  3. `button_pressed.png` (Compressed state with sunken shadow & darkened center)
  4. `button_disabled.png` (Desaturated cold slate with oxidized iron brackets)
  5. `button_primary_normal.png` (Ornate Vanguard crest corners & rich bronze-gold rim)
  6. `button_primary_hover.png` (Luminous Sunken Citadel gold regalia with amber ember aura)
  7. `button_primary_pressed.png` (Active pressed state for Start Journey)

---

## 4. TYPOGRAPHY & LEFT COLUMN HIERARCHY

- **Title Geometry:** Refined `Cinzel` lettering with exact typographic kerning, vertical baseline spacing (42px gap), and chiseled metallic bevels.
- **Unified Ornament:** Single architectural rubric band directly connecting the title to the menu rail, eliminating floating ornamental debris.
- **Vertical Rhythm:** 270px width, 28px standard button height (34px for Start Journey), 6px vertical spacing.
- **Status Plinth:** Souls and Prestige counters integrated into a compact, elegant dual-plaque at the base of the navigation rail.
- **Audio Awaken / Controls Hint:** Subtly positioned at `LH - 18`, unobtrusive yet immediately legible.

---

## 5. RECONSTRUCTED TITLE PLAQUE & HANGING CHAIN SYSTEM (v2.2)

- **Physical Integration:** Suspended from top canvas boundary (`y = 0`) via two sets of heavy forged-iron anchor chains (`x = 116` and `x = 308`) with 8px alternating vertical/horizontal links.
- **Hanging Mounting Rings:** Twin forged iron clevis eyelets (`x + 44`, `x + w - 44`) bolted directly to the top frame.
- **Outer Forged Casing:** 280 × 154 chamfered plaque casing (`#262f3d` to `#0e1218`) with 1.2px steel rim and four heavy brass bracket corner plates fastened with copper rivets.
- **Chiseled Lettering ("DUNGEON BREAK"):** Rendered via discrete 4-pass Canvas 2D shading:
  1. Deep chiseled drop shadow (`#010204`, +1.8px offset)
  2. Dark bronze under-bevel (`#451a03`, +1.0px offset)
  3. Antique ivory & gold gradient face (`#fffbeb` → `#fef3c7` → `#fde68a` → `#d97706` → `#78350f`)
  4. 1px top-left specular chiseled edge (`rgba(255, 255, 255, 0.55)`)
- **Secondary Plaque ("ABYSS ASCENSION EDITION"):** Attached via dual steel links beneath the main plaque; faceted hexagonal plate with end violet runic gemstones and chiseled gold typography.

---

## 6. BESPOKE PIXEL-ART INSIGNIAS (ZERO EMOJIS)

Each menu option features a handcrafted Canvas 2D pixel insignia housed inside a dedicated left chamber:

1. **START JOURNEY:** Slanted forged runic broadsword (`-42°` pitch) with gold pommel, leather grip, steel crossguard, and azure blade core with spark motes.
2. **CONTINUE:** Carved monolithic stone waypoint stele with inscribed downward spiral descent sigil.
3. **SURVIVAL GUIDE:** Sealed field manual grimoire with dark binding, brass corner clasps, and embossed navigation crest.
4. **ABYSS SANCTUM:** Astral soul crystal (octahedral faceted amethyst gem) with diamond highlight.
5. **CODEX & BESTIARY:** Ancient horned abyssal beast skull with deep eye sockets and fanged mandible.
6. **ACHIEVEMENTS:** Vanguard star medal with outer bronze ring, radiant 4-point star, and ruby core.
7. **SETTINGS:** Calibrated bronze horological gear with center axle and 8 radial teeth.
8. **VIEW CREDITS:** Open illuminated archival tome with dual vellum pages and golden silk bookmark ribbon.
9. **THE LAST EMBER (Conditional):** Sacred living flame teardrop encased in delicate gold filigree with dynamic ember breathing.

---

## 7. MOLTEN FORGE CRACKS & MICRO-INTERACTIONS

- **START JOURNEY Frame:** When focused/selected, the inner frame illuminates with branching ember-orange forge fissures (`#ea580c` → `#f97316` → `#fef08a`), simulating inner heat glowing through ancient ironwork.
- **Right Directional Marker (`▶`):** Appears on selected/hovered buttons with subtle horizontal breathing (`±1px`).
- **Tactile Pressed State:** Clicking any button depresses the inner face by 1px down, tightens inner shading, and compresses the border highlight.
- **Disabled State:** CONTINUE displays `[No active descent]` with desaturated slate metalwork and muted iron rivets; attempts to activate trigger `error_disabled` sound without launching runs.
- **Reduced Motion Support:** When `GameState.REDUCED_MOTION = true`, specular sweep glints, flame pulsing, and marker breathing are automatically smoothed and restrained.

---

## 8. REGRESSION & FUNCTIONAL VERIFICATION MATRIX

| Test Case | Method | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **Plaque & Button Assets** | Server HTTP logs | All 9 button PNGs + title plaque PNG return 200 OK | **PASSED** |
| **Keyboard Navigation** | `navigateFocus(±1)` via Arrow keys | Focus moves cleanly; only 1 button selected at a time | **PASSED** |
| **Disabled CONTINUE** | `activateFocused()` on button 1 | Audio `error_disabled` triggers; no descent starts | **PASSED** |
| **START JOURNEY Activation**| Click / Enter on button 0 | Transitions to gameplay (`RunResetManager.resetRun`) | **PASSED** |
| **SURVIVAL GUIDE Modal** | Enter on button 2 | Opens field guide; Esc closes cleanly back to menu | **PASSED** |
| **Settings / Codex / Sanctum** | Click buttons 3, 4, 6 | Correct GameState transitions (`SETTINGS`, `CODEX`, `SANCTUM`)| **PASSED** |
| **Audio Initialization** | Click anywhere on canvas | `AudioManager.init()` and `MusicManager` awaken | **PASSED** |
| **Saved Currency Display** | Real `GameState` access | Displays exact saved Souls (1,458) and Prestige (1) | **PASSED** |
| **THE LAST EMBER Unlock** | `SaveSystem.isPhase3GiftEligible()` | Appears conditionally as 9th button only when eligible | **PASSED** |
| **Console Errors** | Browser console inspection | 0 errors, 0 warnings, clean execution | **PASSED** |

---

## 9. ART DIRECTION RESET (v4.0 UPGRADE)

### A. Focal Gate Restoration (Eliminating Duplicate Portal)
- The far-right background archway in `assets/menu/abyss_threshold_bg.png` (`x ∈ [1280, 1420]`) previously contained a duplicated glowing purple opening with mirrored energy stairs that competed with the primary portal.
- This area was completely repainted into shadowed basalt walls, ruined columns, and gothic masonry.
- The central cathedral gate (`x = 652, y = 306`) is now the single, unmistakable, dimensional singularity in the scene.

### B. Sculpted Title Plaque & Faceted Subtitle Plate
- Replaced the thin procedural border box with `assets/menu/title_plaque_sculpted.png` (`280 × 126`): sculpted dark violet granite, forged iron top loops, heavy chains descending from `y = 0`, antique bronze brackets, and recessed obsidian cartouche.
- Replaced the attached ribbon with `assets/menu/subtitle_plaque_sculpted.png` (`228 × 28`): elongated hexagonal nameplate flanked by radiant faceted purple amethyst gems.
- Rendered multi-pass carved 3D metallic relief for "DUNGEON BREAK" with gold-to-ivory gradients, dark bronze under-shadows, and specular highlights.

### C. Strict Single-Item Selection Exclusivity
- Corrected the selection bug where `isPrimary` caused START JOURNEY to remain highlighted even when another option was focused.
- Explicit state mapping:
  - When START JOURNEY is focused (index 0): START JOURNEY receives molten forge cracks, bright gold frame, and right arrow `▶`.
  - When any other button is focused (e.g. ABYSS SANCTUM): That button receives the radiant gold frame and right arrow `▶`, while START JOURNEY drops back to its calm unselected primary state (dark steel, copper corners, calm silver text, no arrow, no active cracks).
  - Exactly one eligible item is selected at any given moment.

---

## 10. SIGNATURE UI REBUILD & MOBILE INTEGRATION (v8.0.0)

### A. Bespoke Pixel-Art Title Wordmark
- Extracted and restored the monumental carved letterforms from the UI Kit header into `assets/menu/title_wordmark_stacked.png` (260 × 92):
  - Stacked "DUNGEON BREAK" layout matching the physical proportions of the sculpted plaque.
  - Ivory-to-gold chiseled gradient face with dark bronze under-bevel.
  - Purple ethereal flame motes rising from the letter rims.
  - High-res pixel-crisp rendering on `assets/menu/title_plaque_sculpted.png` with subtle ethereal purple radiance pulse (`sin(F * 0.05)`).
- Subtitle nameplate: "ABYSS ASCENSION EDITION" rendered on `assets/menu/subtitle_plaque_sculpted.png` with amethyst end-gems.
- 100% bundled locally with offline operation and zero external font dependencies.

### B. Custom 9-Slice Button System (v5.3)
- Seamless 9-slice textures generated in `assets/menu/buttons/`:
  - `button_normal.png`: Deep violet abyss basalt with forged metal corners and rivets from Section 3.
  - `button_hover.png`: Glowing gold corners and fiery orange frame from Section 3.
  - `button_pressed.png`: Depressed inset violet stone.
  - `button_disabled.png`: Muted, desaturated weathered basalt stone with `[No active descent]` badge.
  - `button_primary_normal.png`: Volcanic forged casing with dignified silver text.
  - `button_primary_hover.png`: Authentic raging magma flame crest along top border from Section 2 `START`.
  - `button_gift_normal.png` & `button_gift_hover.png`: Chained bronze metal plate with clean violet stone.
- **Single-Selection Exclusivity:** Mouse movement coordinates are tracked (`_lastMouseX`, `_lastMouseY`). Stationary mouse cursors never overwrite keyboard focus. Directional indicator `▶` is strictly exclusive to the single active keyboard-selected entry.

### C. True Architectural Portal Alignment
- Identified the actual circular gate aperture within the background artwork at `(1122, 331)` in background pixel coordinates.
- Dynamic alignment formula in `MainMenuScene.js`:
  ```javascript
  const gateX = Math.round(bgOffsetX + 1122 * imgScale);
  const gateY = Math.round(bgOffsetY + 331 * imgScale);
  const portR = Math.round(72 * imgScale);
  ```
- All animated concentric dials, accretion particles, runes, and central singularity emanate precisely from the stone archway center across all aspect ratios.

### D. Mobile Gameplay Movement & Combat Controls
- **3×3 D-Pad Cross:**
  - Distinct basalt-stone directional buttons: `assets/ui/dpad_up.png`, `dpad_down.png`, `dpad_left.png`, `dpad_right.png` with forged metal trim and magma accents.
  - Full 8-direction diagonal support: `|norm| > 0.38` enables diagonal movement without constraining free motion.
  - Input safety: `pointercancel`, `touchcancel`, and `window.blur` listeners guarantee movement directions reset cleanly to `(0, 0)`.
  - Pointer event filters (`e.pointerType === 'touch'`) prevent double-triggering on modern touchscreens.
- **Combat Touch Buttons:**
  - Handcrafted pixel-art buttons in magma frames:
    - Attack (`#atk-btn`): Forged Broadsword (`assets/ui/btn_attack.png`).
    - Shoot (`#shoot-btn`): Longbow & Arrow (`assets/ui/btn_shoot.png`).
    - Special (`#special-btn`): Golden Heraldic Shield (`assets/ui/btn_special.png`).
- **Responsive HUD Layout Adaptation:**
  - On mobile viewports (`MobileControls.isMobile()`), the Vanguard Vitality Crest (HP/Sanity) automatically shifts to the top-left (`crestX = 14, crestY = 14`).
  - This eliminates visual collision and ensures the D-pad in the lower-left has 100% unobstructed visibility and touch space.
  - On desktop, the Vitality Crest remains in its canonical lower-left location (`crestY = LH - 74`).
