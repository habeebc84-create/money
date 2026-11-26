# Kaasu: student money tracker

Offline, on-device expense tracker in rupees. Next.js 16 static export, no backend, no account, no env vars.

## Run
    npm ci --ignore-scripts
    npm run dev          # http://localhost:3000
    npm test             # vitest unit tests (money, budget, recurring, CSV, backup)
    npm run lint && npm run typecheck
    npm run build        # static site in out/
    # browser checks (needs out/ served on :4173): (cd out && python3 -m http.server 4173) & node scripts/browser-check.mjs

## Free hosting (no card), you choose one
- Cloudflare Pages: Create project > Connect to Git > pick the repo. Framework preset: Next.js (Static HTML Export). Build command `npm run build`, output directory `out`. `public/_headers` sets the security headers.
- Vercel Hobby (non-commercial): Import the repo with the Next.js preset. `vercel.json` pins the framework and security headers; leave **Output Directory** unset (the default). Vercel detects `output: "export"` and publishes `out/` itself. If an imported project was saved with Output Directory `out`, reset it in Project Settings → Build and Deployment: with the Next.js preset that override makes Vercel look for `.next/routes-manifest.json` in the static export folder.

## Data
Stored in this browser's localStorage (`kaasu:data:v1`). Not synced. Clearing browser data deletes it: use Settings > Save full backup.
