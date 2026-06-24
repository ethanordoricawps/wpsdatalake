# The WPS Data Lake — Interactive

A browser experience for WPS: a cinematic rainforest intro that swoops down to an
aerial lake, where the lake's four basins are the four WPS **data functions**. The
jungle is photoreal video; the data layer is interactive on top of the water.

> **Content honesty:** the data-state is illustrative and **unconfirmed until the
> discovery questionnaires return** — every surfaced answer keeps the
> "Illustrative — pending discovery" disclaimer. Don't present this as final data.

## Run

```bash
npm install
npm run dev      # http://localhost:5173   (add -- --host to expose on the network)
npm run build    # production build -> dist/
npm run preview  # serve the production build
```

Click **Enter the lake** to start (the gate is the autoplay/interaction trigger).

**URL flags**
- `?mode=3d` — the archived real-time React-Three-Fiber scene (lazy-loaded; kept as a fallback/reference).

## How it works

The experience is **video + an interactive data overlay**, not real-time 3D:

1. **Start** — `public/video/start.mp4` (ground-level rainforest) loops behind the Enter gate.
2. **Swoop** — on Enter, `public/video/swoop.mp4` plays once and **freezes on its final frame**.
3. **Aerial** — that final frame (`public/img/lake_still.jpg`) is held as the interactive
   background; the four function basins glow **on the real water**, with hover, click /
   "Ask the lake", ripples, and live query counts.

### The data overlay (the key idea)

The lake was **segmented from the still image** (not hand-drawn): a brightness flood-fill
finds the water, which is then carved into four organic sections + an inflow arm. That bake
produces, in `public/img/`:

- `zone_<k>.png` — per-section **feathered glow** (center-weighted, fades at seams/shoreline)
- `zone_<k>_fill.png` — per-section **uniform fill** (used for the even hover brighten)
- `lake_zones.json` — hit-test grid + section centroids + inflow path

`LakeOverlay` composites those glow layers over the held still (color-tint + additive passes,
per-section pulse, hover crossfades glow→uniform-fill), ripples are clipped to each section
(they bend around its borders), and pointer hits resolve via the grid. `SectionLabels` anchors
each function's name + live count to its section centroid.

### Regenerating the segmentation

The bake scripts live in the session scratchpad (`.shots/segment.js`, `.shots/export_layers.js`)
and read `public/img/lake_still.jpg`. If the lake still changes, re-run `export_layers.js`
(needs `jpeg-js` + `pngjs`) to regenerate the glow masks + `lake_zones.json`. Tunables
(brightness threshold, section seeds, inflow neck cut, feather) are constants at the top.

## Architecture

```
src/
  App.jsx              phases (start -> swoop -> aerial), counts, hover/click, auto-life
  data/zones.js        SOURCE OF TRUTH — ZONES, START_COUNTS, ASK_MAP (verbatim from the 2D file)
  lake-state.js        shared ripple/hover state (read in the overlay draw loop)
  ui/
    VideoStage.jsx     start/swoop videos + held still; freezes the swoop on its final frame
    LakeOverlay.jsx    canvas: section glows + section-clipped ripples + hit-test
    SectionLabels.jsx  name + live count anchored to each section centroid
    Overlay.jsx        header + demo pill + "Ask the lake" + legibility scrims
    EnterGate.jsx      tap-to-enter
  App3D.jsx, scene/    archived real-time R3F scene (?mode=3d, lazy-loaded)
public/
  video/  start.mp4 swoop.mp4 (+ aerial.mp4)   # AI-generated (Veo), gitignored — drop-in
  img/    lake_still.jpg, zone_*.png, lake_zones.json, posters, favicon
```

## Notes

- **Video clips** are AI-generated (Veo) and **not versioned** (see `.gitignore`); drop them in
  `public/video/`. They're 1920×1080 H.264; cropped to remove baked black bars and re-encoded lean.
- **Audio** is currently off (the clips' tracks are muted).
- **Performance:** only the active phase's video decodes; the aerial is a static still + a light
  canvas overlay (DPR 1); three.js is code-split out of the main bundle.
- `prefers-reduced-motion` skips the swoop and holds the still (no looping motion).
- See `ATTRIBUTIONS.md` for asset provenance (CC0 fonts; AI-generated video).
