# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Уютные блоки" (Cozy Blocks) — a casual block-puzzle browser game in Russian. Players place tetromino-like shapes onto a 10x10 grid to fill complete rows/columns, which clear for points. Features: levels, achievements, skin shop, character dialogue, combo streaks, hold/swap piece, undo, block rotation, bomb power-ups, particle effects, screen shake. Target platform: Yandex Games (browser, desktop + mobile).

## Running the Game

No build system or package manager. Open `index.html` directly in a browser or serve with any static HTTP server:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

There are no tests, linters, or build steps.

## Architecture

Vanilla JavaScript with HTML5 Canvas rendering. No frameworks or bundlers. Scripts are loaded via `<script>` tags in `index.html` in dependency order:

1. **config.js** — `CONFIG` constants (grid size, scoring, streak multipliers, bomb chance), `THEMES` (with glow colors), `ASSETS` paths, `PIECE_SKINS` catalog
2. **shapes.js** — `SHAPES` array (tetromino definitions as `'0'`/`'1'` string matrices), `getRandomShape()` (with bomb chance), `rotateShapeCW()`, `shapeWidth()`, `shapeHeight()`
3. **game.js** — `Game` object: grid state, shape placement/validation, line clearing, level progression, game-over detection, combo counter, hold/swap, undo, bomb power-up
4. **progress.js** — `Progress` object: persistent player data via `localStorage` (coins, levels, achievements, skins, combos)
5. **achievements.js** — `ACHIEVEMENTS_LIST` with condition functions; `Achievements` checks conditions against progress data, unlocks themes/characters
6. **dialogue.js** — `Dialogue` object: character messages triggered by game events, with GSAP slide-in/out animations
7. **render.js** — `Render` object: Canvas drawing with dark theme, neon glow effects, rounded rects, hold/current/next shape canvases, block skin loading
8. **particles.js** — `Particles` object: particle effect system for line clears, runs on `#particle-canvas` overlay with requestAnimationFrame
9. **juice.js** — `Juice` object: screen shake, floating score text, pulse animations via GSAP
10. **dragdrop.js** — `DragDrop` object: drag-and-drop via GSAP Draggable, with placement preview overlay and snap-back animation
11. **main.js** — Entry point: screen management with GSAP transitions, button handlers, game loop orchestration, feature integration (IIFE)

All modules are global objects/functions (no ES modules). They reference each other directly.

## Key Patterns

- **Shapes** are 2D arrays of `'1'`/`'0'` strings (not numbers) — cell checks use `=== '1'`
- **Grid cells** use numbers: `0` = empty, `1` = filled
- **Bomb shapes** have a `.isBomb = true` flag on the array object; clears 3x3 area on placement
- **Screens** are `<div>` elements toggled via `.active` CSS class, with GSAP fade+scale transitions
- **Block skins** are single PNG images drawn into each cell using object-fit contain logic
- **Characters** have mood-based avatars (`happy.png`, `sad.png`, `default.png`) in numbered folders (`assets/characters/1/`, `2/`, `3/`)
- **Progress** is saved to `localStorage` under key `uyutnye_bloki_progress`
- **placeShape()** returns `{ placed, linesCleared, clearedCells, points, isBomb }` — clearedCells array is used for particle effects
- **Visual theme** is "Neon Cozy" — dark glassmorphism with pink/purple/cyan neon accents

## External Dependencies

- **GSAP + Draggable** (CDN) — animations and drag-and-drop
- **Google Fonts: Inter** — UI font

## Language

All UI text and comments are in Russian.
