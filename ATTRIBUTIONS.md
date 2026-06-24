# Attributions

## Video (AI-generated, provided by WPS)

The cinematic clips in `public/video/` are AI-generated (Google Veo 3.1 via
ElevenLabs) and provided by WPS — not versioned in git (see `.gitignore`):

- `start.mp4` — ground-level rainforest loop (the landing view / Enter screen)
- `swoop.mp4` — the swoop from forest floor up to the aerial lake
- `aerial.mp4` (+ `aerial_alt.mp4`) — the aerial lake loop (interactive background)

Posters in `public/img/` are stills extracted from these clips (graceful
fallback + reduced-motion frame).


## Sourced CC0 assets (Poly Haven / ambientCG — all CC0, no attribution required)

- **`public/hdri/mossy_forest_2k.hdr`** — "Mossy Forest" HDRI, Poly Haven (CC0).
  Used as the scene's photographic skybox + image-based lighting.
  https://polyhaven.com/a/mossy_forest
- **`public/tex/forest_leaves_*`** — "Forest Leaves 02" texture (diffuse / normal /
  roughness), Poly Haven (CC0). Tiled onto the canopy for leafy surface detail.
  https://polyhaven.com/a/forest_leaves_02

These are CC0 (public domain), so attribution is optional — listed here for
provenance and easy swapping.

## 3D geometry

**All geometry is procedural** — generated at runtime from primitives (planes,
icospheres, cones) and custom shaders. There are **no third-party / downloaded
3D models** (the photographic realism comes from the HDRI + textures above on
procedural meshes).

### Why procedural instead of sourced CC0 GLB trees

The R3F build brief's asset shopping list prefers downloaded CC0 GLB tree models.
We deliberately diverged:

- This scene is the **3D twin of a flat, stylized 2D canvas** (`The WPS Data
  Lake.html`) whose canopy is rendered as soft radial-gradient "puffs." Photoreal
  or photoscanned tree models would clash with that stylized language.
- Procedural instanced canopy (low-poly faceted blobs tinted with the 2D file's
  `FOLIAGE` palette pairs) matches the source aesthetic precisely and is rendered
  via a single `InstancedMesh` per the brief's performance guidance.
- It keeps the project **100% CC0-clean** with zero external asset dependencies —
  nothing to license-check, nothing to break if an asset host goes away.

If sourced GLB trees are later desired, drop them in `public/models/` and swap the
`CanopyRing` instanced geometry; the placement ring + wind logic is asset-agnostic.

## Fonts

- **Fraunces**, **Inter**, **IBM Plex Mono** — Google Fonts (Open Font License),
  loaded via the Google Fonts CDN. Same families used in the 2D source file.

## Audio

- _TBD (Phase 8):_ ambient rainforest loop. Will be sourced CC0/CC-BY from
  Freesound and attributed here with the source link and author.
