# Ownair Tracking (Next.js)

Customer order-tracking page for the Ownair store. A React (Next.js) app that
shows live shipment status from **Delhivery** — no CRM is involved. Matches the
Seznik tracking design, recoloured to the Ownair brand.

## How it works

Customer → this site (Next.js on Vercel) → `ownair-tracking-proxy` (Cloudflare
Worker) → **Delhivery Track API**. The Worker holds the Delhivery token as a
secret, calls Delhivery by AWB, normalises the response, and returns clean JSON.
The page only **reads** data by AWB and renders a status timeline — it never
writes anywhere.

## Routes
- `/` — manual tracking box
- `/track/{AWB}` — auto-tracks that AWB (built-in dynamic route, no `vercel.json` rewrite needed)

## Run locally
```
npm install
npm run dev     # http://localhost:3000
# try: http://localhost:3000/track/70411410010566
```

## Deploy (Vercel)
Push this repo to GitHub → import in Vercel. Vercel auto-detects Next.js.
No `vercel.json` needed — `/track/[awb]` is a real route.

## Cloudflare Worker (`ownair-tracking-proxy`)
- Secret `DELHIVERY_TOKEN` — the Delhivery API token. **Never** put it in the frontend.
- `ALLOWED_ORIGIN` — must match this site's domain (testing: `"*"`; production: `https://track.ownair.in`).
- `SITE_BASE` — used to build the shareable tracking link.
- Endpoint called: `GET https://track.delhivery.com/api/v1/packages/json/?waybill={AWB}`
  with header `Authorization: Token <DELHIVERY_TOKEN>`.

## What the page shows
Status timeline (Order Confirmed → In Transit → Out for Delivery → Delivered),
customer name, Order No., Destination, Current Location, Expected Delivery,
Tracking No., and a "View on Delhivery" link.

> Note: Delhivery's API returns courier data only — **no product name/image or
> case details** (those live in the CRM, which this site doesn't use). So the
> timeline uses an animated package box on the active step, not a product photo.

## Config
- Proxy Worker URL is set in `components/TrackingApp.jsx` (`WORKER_URL`).
- Brand accent is `--accent` in `app/globals.css` (Ownair lavender `#7c5cd6`).
- Logo is `public/ownair-logo.png`, shown in the nav.

## Custom domain
Point `track.ownair.in` to Vercel, then set the Worker's `ALLOWED_ORIGIN` and
`SITE_BASE` to `https://track.ownair.in`.

## Security
- Credentials never reach the browser: the Delhivery token lives **only** in the
  Cloudflare Worker secret, and the page talks only to the Worker.
- The flow is **read-only** — nothing on the page can change any data.
- Open item (not yet implemented): tracking links are public and AWB-based, so
  anyone with a valid AWB can *view* that shipment. A **signed token** in the
  link (a hash of AWB + a Worker-side secret, verified before returning data)
  would stop AWB guessing. Deferred for now.

## Project structure
```
app/
  page.jsx              # "/" — manual tracking
  track/[awb]/page.jsx  # "/track/{AWB}" — auto-track
  layout.jsx            # html shell + fonts
  globals.css           # styles (brand accent --accent here)
components/
  TrackingApp.jsx       # UI + fetch to WORKER_URL (set here)
public/
  ownair-logo.png       # nav logo
```
