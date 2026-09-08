# Lorebound

A creative world-building platform for crafting characters, places, lore, timelines, relationships, and interconnected fictional worlds.

Lorebound is a **personal story bible** that runs entirely in the browser. Create stories, keep character portraits, magic rules, laws, places and maps, chapter drafts, and a pocket notebook of scene ideas. It is meant to feel like a writer's studio, not an admin dashboard.

Live (once GitHub Pages is enabled): `https://veritycooper.github.io/Lorebound/`

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173/`).

Other scripts:

- `npm run build` — production build
- `npm run preview` — serve the production build
- `npm run typecheck` — TypeScript
- `npm test` — unit tests for persistence helpers

## How saving works

There is no account and no server in v1.

- **Autosave.** Edits are written to [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) in this browser (via Dexie), debounced as you type.
- **Refresh-safe.** Reload the tab; the library is still here.
- **Not cross-device.** Another computer, browser profile, or private window is a different library.
- **Export / Import.** Open a story → **Backup** to download JSON. Images are packed into the same file as data URLs. Import can merge alongside existing stories or replace the library.

Clearing site data for this origin deletes the local library. Export first if the work matters.

## Pinterest images

Lorebound does **not** scrape or hotlink Pinterest.

1. Save the image to your device from Pinterest (or anywhere else).
2. Upload that file on the character or place editor. It is stored as a blob in IndexedDB.
3. Optionally paste a Pinterest URL as a **reference link** on a character. The link is stored as text only.

## GitHub Pages

The Vite `base` path is `/Lorebound/` when `GITHUB_PAGES=true` (used by the deploy workflow), and `/` for local development.

A workflow at `.github/workflows/deploy.yml` builds and deploys on every push to `main` using `actions/upload-pages-artifact` and `actions/deploy-pages`.

**Enable Pages once** in the GitHub repo:

1. Settings → Pages
2. Source: **GitHub Actions**
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow)
4. Wait for the workflow, then visit `https://<user>.github.io/Lorebound/`

The build also copies `index.html` to `404.html` so in-app routes still load on a static host.

## What is in a story

Each story holds:

- Overview (title, summary, status)
- Characters (notes, relationships to people or places, uploaded portraits, optional Pinterest URL)
- Magic systems
- Legal systems and statutes
- Places, connections, and uploaded map images
- Graph of people and places (force-directed, from relationships)
- Chapters / drafts with word count
- Scene ideas inbox
