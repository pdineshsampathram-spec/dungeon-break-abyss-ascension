# AGENTS.md — AI AGENT OPERATIONAL & ART DIRECTION GUIDELINES

## Project Overview
**Game:** Dungeon Break: Abyss Ascension (v8.0.0)  
**Architecture:** Modular ES6 JavaScript, HTML5 Canvas 2D Rendering Engine (`LW = 896, LH = 640` / `960 × 540`).

---

## MANDATORY ASSET & RENDERING RULE

> **CRITICAL RULE FOR ALL AI AGENTS:**  
> **Before creating or selecting Rowan, boss, enemy, or UI artwork, inspect the current production renderer and canonical asset guide. Do not revive deleted experimental variants, treat screenshots as production artwork, or replace approved visuals without explicit authorization.**

---

## Canonical Asset Specification
Always consult [`docs/DUNGEON_BREAK_CANONICAL_ASSETS.md`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/docs/DUNGEON_BREAK_CANONICAL_ASSETS.md) before making any visual, character, boss, or asset decisions.

### Key Visual Source of Truth
1. **Lord Rowan:** Rendered procedurally via [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`drawPlayer`) and [`js/cinematics/CinematicCharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/cinematics/CinematicCharacterRenderer.js) (`drawRowan`). Approved vector poses in `assets/cinematics/shattered-mind/rowan/*.svg`.
2. **Major Bosses:**
   - **Gorgaroth (Floor 3):** Procedural Canvas 2D in [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`drawGorgaroth`) & [`js/ui/BossBar.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/ui/BossBar.js).
   - **Malakor (Floor 6):** Procedural Canvas 2D in [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`drawMalakor`) & [`js/ui/BossBar.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/ui/BossBar.js).
   - **The Abyss Warden (Floor 10):** Procedural Canvas 2D in [`js/rendering/CharacterRenderer.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/rendering/CharacterRenderer.js) (`drawWarden`) & [`js/ui/BossBar.js`](file:///Users/ramteja/Downloads/Dungeon%20Break%20v2.0/js/ui/BossBar.js).
3. **No 3D Meshes:** Do not introduce 3D models (`.obj`, `.fbx`, `.gltf`, `.glb`) or raster atlases for procedural entities. All characters and bosses are drawn in Canvas 2D.
4. **No Screenshot Assets:** Never treat files in screenshots, test captures, or audit folders as production artwork.
