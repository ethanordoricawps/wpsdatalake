# Attributions

## 3D assets

**All geometry in this scene is procedural** — generated at runtime from
primitives (planes, icospheres, cones, cylinders) and custom shaders. There are
**no third-party / downloaded 3D models**, so there is nothing to attribute and
no license to track for geometry.

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
