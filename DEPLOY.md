# Deploying to GitHub Pages

This app is a static client-side build (no server, no APIs, no secrets). It's
published to GitHub Pages automatically by `.github/workflows/deploy.yml` on
every push to `main`.

## How the build is made Pages-safe

- `vite.config.js` reads `base` from `VITE_BASE` (defaults to `/` for local dev).
- The workflow sets `VITE_BASE=/<repo>/` automatically from the repo name, so it
  works no matter what the repo is called.
- Runtime asset paths (videos, zone images, the zones JSON, 3D textures/fonts)
  are prefixed with `import.meta.env.BASE_URL`, so they resolve under the
  project subpath. The intro videos are committed to the repo (previously
  git-ignored) so the deploy is self-contained.

## One-time setup

1. Create a GitHub repo (public — Pages is free for public repos; private needs
   a paid plan). Don't add a README/license so the first push is clean.

2. From `~/wps-data-lake-3d`, point this local repo at it and push `main`:

   ```bash
   git branch -M main
   git remote add origin https://github.com/<owner>/<repo>.git
   git push -u origin main
   ```

   (Authenticate with a GitHub token/SSH, or install the `gh` CLI and run
   `gh auth login` first.)

3. In the repo on github.com: **Settings → Pages → Build and deployment →
   Source: "GitHub Actions"**. That's the only setting needed.

The workflow runs on that first push; when it finishes (~1–2 min) the site is at:

```
https://<owner>.github.io/<repo>/
```

## Updating

Just push to `main`. The workflow rebuilds and redeploys; the live site updates
in a minute or two. You can also trigger it manually from the repo's **Actions**
tab ("Deploy to GitHub Pages" → Run workflow).

## Notes

- Deep-link a walkthrough for a demo: `…/?scene=ranger` (`grant`/`repo`/`partner`).
- The archived real-time 3D scene is at `…/?mode=3d` (heavy; lazy-loaded).
- Nothing here calls a paid API. "Ask the lake" is a local keyword match, not an
  LLM. Zero recurring cost.
