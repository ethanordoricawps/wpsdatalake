# The WPS Data Lake — Interactive 3D

A browser-based, cinematic 3D scene (React Three Fiber): open inside a rainforest,
swoop up through the canopy, flatten to an aerial view of an Amazonian lake whose
four basins **are** the four WPS data functions, then settle into a living idle
state. The 3D twin of the existing 2D canvas design (`The WPS Data Lake.html`).

> **Content honesty:** the data-state is illustrative and **unconfirmed until the
> discovery questionnaires return** — every surfaced answer keeps the
> "Illustrative — pending discovery" disclaimer. Don't present this as final data.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # serve the production build
```

Click **Enter the lake** to start (the tap-to-enter gate is the autoplay
workaround for ambient audio + the cinematic intro).

**URL flags:** `?auto=1` skips the gate and auto-starts the intro (used for
headless screenshots / tests).

## The experience

| t (s) | Phase |
|---|---|
| 0–4 | Forest interior, low, looking horizontal |
| 4–8 | Swoop up through the canopy |
| 8–10 | Flatten & settle to the aerial framing |
| 10–13 | Hero title "The WPS Data Lake" fades up from the sky |
| 13+ | Idle/live: clamped orbit, swaying canopy, drifting clouds, pulsing basins, inflow motes, auto-ripples; HTML overlay (zone cards, "Ask the lake") takes over |

- **Click a basin** or use **"Ask the lake"** (keyword → zone via `ASK_MAP`):
  ripples the basin, bumps its live query count, surfaces its two data sources.
- **Orbit** gently (clamped polar/azimuth/distance — can't break the framing).
- **HD/LO** toggle and a **sound** toggle sit bottom-right.
- **`prefers-reduced-motion`** → a clean static aerial, no swoop, no looping motion.

## Architecture

```
src/
  data/zones.js     SOURCE OF TRUTH — ZONES, START_COUNTS, PALETTE, FOLIAGE, ASK_MAP (verbatim from the 2D file)
  data/lake.js      lake geometry: lakeGeom / computeCells / shoreline wobble in world space; zoneAt()
  intro.js          shared intro-timeline clock (camera/text/audio sync)
  lake-state.js     non-React ripple + hover state (read in useFrame)
  audio.js          procedural WebAudio ambient bed (CC0-clean)
  scene/
    Scene.jsx       assembles the Canvas children
    Lighting, JungleFloor, WaterSurface (basin glows + channels + shimmer + sun pools, one shader),
    CanopyRing (instanced foliage + wind), Clouds, Inflow, RippleManager,
    CameraRig (cinematic timeline), SkyText (Troika title), Post (bloom + vignette)
  ui/
    EnterGate.jsx   tap-to-enter
    Overlay.jsx     header, demo pill, 4 zone cards, "Ask the lake", toggles
```

The four basins, their colors, relative sizes (`v`), glow weights (`bright`),
sources, and the `ASK_MAP` are carried over **verbatim** from the 2D file — see
`src/data/zones.js`. Geometry mirrors the 2D `computeCells` in world space.

## Notes

- **Stylized realism**, not photoreal — by design (it twins a flat 2D canvas).
- **All 3D geometry is procedural / CC0-clean** — no downloaded models. See
  `ATTRIBUTIONS.md` for the rationale (and how to swap in sourced GLB trees later).
- Fonts (Fraunces / Inter) are vendored locally in `public/fonts/`.
- Performance: single `InstancedMesh` canopy, capped particle pools, clamped dpr,
  HD/LO quality toggle (Low drops post-processing, clouds, half the canopy, dpr 1).
