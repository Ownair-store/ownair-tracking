# Ownair Order Tracking

Customer-facing shipment tracking page for Ownair, built on **Next.js (App Router)**.
Fetches live status from Delhivery via the `ownair-tracking-proxy` Cloudflare Worker.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — or http://localhost:3000/track/70411410010566 to auto-track an AWB.

## How it works

- `/` — tracking search page
- `/track/{AWB}` — shareable link that auto-tracks that AWB
- The page calls the Worker: `GET {WORKER_URL}/?awb={AWB}` and renders the timeline + details.

## Config

- **Worker URL** — in `components/TrackingApp.jsx`, const `WORKER_URL`.
- **Brand color** — in `app/globals.css`, the `--brand` variables at the top.
- **Logo** — the `ownair` text + `.brand-mark` square in `TrackingApp.jsx` / `globals.css`. Swap for a real logo image when ready.

## Deploy

Push to GitHub, import the repo in Vercel. No env vars needed (the Delhivery token lives only in the Cloudflare Worker).

Once the live domain (e.g. `track.ownair.in`) is set:
1. Point the domain to Vercel.
2. In the Worker, change `ALLOWED_ORIGIN` from `"*"` to `"https://track.ownair.in"` and set `SITE_BASE` to the same.
