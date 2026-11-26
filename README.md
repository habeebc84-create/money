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
- Vercel Hobby (non-commercial): Import the repo; `vercel.json` already sets build `npm run build`, output `out`, and headers.

## Data
Stored in this browser's localStorage (`kaasu:data:v1`). Not synced. Clearing browser data deletes it: use Settings > Save full backup.
