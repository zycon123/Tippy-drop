# Tippy Drop! v0.1 (prototype)

Tippy Drop! — Drop it. Stack it. Don't tip it.
by Zycon Studios

This is a mobile-first casual physics stacking game prototype built with Matter.js and a lightweight custom renderer.

Features
- Drag horizontally and release to drop objects (touch & mouse).
- 25+ distinct objects with different sizes, masses, friction, restitution, and compound shapes.
- Tippy Meter (STEADY / WOBBLY / TIPPY / PANIC) that reacts to stack instability.
- Panic events: EARTHQUAKE, WIND BLAST, LOW GRAVITY, GIANT DROP, DOUBLE TROUBLE, TINY PLATFORM.
- Combo system and scoring; BEST saved to localStorage.
- Simple generated audio for effects; sound/music toggles.
- Share score via Web Share API with clipboard fallback.
- Portrait mobile-first layout and touch optimizations.

How to run locally
1. Clone the repo:
   git clone https://github.com/zycon123/Tippy-drop
2. Serve locally with a simple static server (recommended):
   - Python 3:
     python -m http.server 8000
   - Then open: http://localhost:8000/
3. Open on mobile or desktop. For best results test on a mobile-sized viewport (360–480px wide).

Controls
- Touch / pointer: Drag the current object horizontally; release to drop.
- Buttons: PLAY, PLAY AGAIN, SHARE SCORE, sound/music toggles.

Implemented Tippy Events
- EARTHQUAKE — brief shaking forces applied.
- WIND BLAST — horizontal impulse on objects.
- LOW GRAVITY — gravity reduced temporarily.
- GIANT DROP — next object is oversized.
- DOUBLE TROUBLE — two objects arrive together.
- TINY PLATFORM — platform reduced temporarily (scene resets after).

Gameplay features
- Physics-based stacking with different object properties.
- Combo bonuses for centered placements.
- Visual near-collapse effects: camera shake, brief slow motion, subtle zoom.
- LocalStorage persistence for Best score and first-play tutorial.

Known limitations (v0.1)
- Visuals are canvas-drawn simple shapes (no sprite art).
- TinyPlatform currently resets the whole scene to restore platform to avoid complex scaling issues.
- Sound generation is minimal (sine oscillators), not full SFX pack.
- No particle system for impacts (placeholder comment in code).
- Accessibility and i18n not implemented.
- Some tuning (forces, friction) may need balancing per device for perfect feel.

Files in this commit
- index.html
- styles.css
- game.js
- README.md

Commit message
"Build Tippy Drop v0.1 playable prototype"
