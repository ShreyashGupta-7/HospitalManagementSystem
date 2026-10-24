# Putting OPD Saathi online (so judges can open it on their phones)

There are two ways. **Option A is recommended**: one link, live queues across every phone.

| | Option A — Render (one service) | Option B — Vercel or Netlify (+ Render for the server) |
|---|---|---|
| Live queue across phones | ✅ | ✅ (needs the Render server too) |
| Links to share | 1 | 1 for the app (the server runs behind it) |
| Why | Vercel/Netlify can't keep a WebSocket server running; Render can, and it also serves the app | Use this if your team must show a Vercel/Netlify link |
| Free tier caveat | Sleeps after 15 min idle; first visit takes ~50 s to wake | Same for the Render part |

> Phones need **HTTPS** for the camera (QR scan), microphone, notifications and installing the app. All three hosts give you HTTPS automatically. Opening the laptop's IP address over plain `http://` on a phone works for the queue, but not for those features.

---

## Step 0 — Put the code on GitHub

The code is already at **https://github.com/ShreyashGupta-7/HospitalManagementSystem** (branch `main`). If you change something:

```bash
git add -A
git commit -m "Describe the change"
git push
```

---

## Option A — Render: app + live server on one link (recommended)

1. Go to **https://render.com** and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Choose the repository **HospitalManagementSystem**. Render reads `render.yaml` from the repo and shows a service called **opd-saathi**.
4. Click **Apply**. Render runs `npm ci --include=dev && npm run build`, then `npm start`.
5. Wait for "Live" (3–5 minutes). Your link looks like **https://opd-saathi.onrender.com**.
6. Check it: open `https://opd-saathi.onrender.com/api/health` — you should see `{"app":"opd-saathi","ok":true,...}`.
7. Share:
   - Patient: `https://opd-saathi.onrender.com`
   - Staff: `https://opd-saathi.onrender.com/staff` (PIN **4321**)
   - Board: `https://opd-saathi.onrender.com/board`

**Change the staff PIN:** Render → opd-saathi → **Environment** → `STAFF_PIN` → Save (the service restarts).

**If you prefer to click instead of using the blueprint:** New + → **Web Service** → pick the repo → Runtime **Node** → Build command `npm ci --include=dev && npm run build` → Start command `npm start` → Instance type **Free** → Create.

**Refresh without a 404:** already handled. The server sends the app for every page (`/turn/MED-042`, `/staff`, …) — see the catch-all route in `server/index.js`.

**Before the judging:** open the link 2 minutes early so the free service is awake (see the demo risks list). Free Render services also forget saved state when they restart; press *Add 20 sample patients* again if needed.

---

## Option B — Vercel or Netlify for the app

Do **Option A first** (you need the Render server for live queues). Then:

### Vercel

1. Go to **https://vercel.com** → sign in with GitHub → **Add New…** → **Project**.
2. Import **HospitalManagementSystem**. Framework preset: **Vite** (detected). Build command `npm run build`, output folder `dist` (both already in `vercel.json`).
3. Open **Environment Variables** and add:
   - `VITE_SERVER_URL` = `https://opd-saathi.onrender.com` (your Render link, no slash at the end)
4. Click **Deploy**. Your link looks like `https://hospital-management-system.vercel.app`.
5. **The setting that stops a refresh showing a 404** is the rewrite in `vercel.json`:
   ```json
   "rewrites": [{ "source": "/((?!assets/|sw.js|workbox-|manifest.webmanifest|icon-|favicon).*)", "destination": "/index.html" }]
   ```
   It sends every page address to `index.html`, so React Router can show the right screen.

### Netlify

1. Go to **https://app.netlify.com** → **Add new site** → **Import an existing project** → GitHub → pick the repo.
2. Build command `npm run build`, publish directory `dist` (already in `netlify.toml`).
3. **Site configuration → Environment variables** → add `VITE_SERVER_URL` = your Render link.
4. **Deploy site**.
5. **The setting that stops a refresh showing a 404** is in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
   (The same rule could also go in a `public/_redirects` file as `/*  /index.html  200`.)

> If you deploy to Vercel/Netlify **without** `VITE_SERVER_URL`, the app still works, but each phone keeps its own separate queue (local mode). Fine for showing screens, not for the live three-device demo.

---

## Running it on a laptop at the venue (backup plan, no internet needed)

1. Connect the laptop and the phones to the same Wi-Fi or the laptop's hotspot.
2. `npm run build` then `npm start`.
3. Find the laptop's IP address (`ipconfig` on Windows, look for IPv4, e.g. `192.168.137.1`).
4. On phones open `http://192.168.137.1:3001`. The queue, alerts and directions work; QR scanning, the microphone and notifications need HTTPS, so show those on the laptop instead.

## Testing offline in Chrome (DevTools → Network → Offline)

1. Open the deployed link (or `npm run build && npm start`, then http://localhost:3001) in Chrome.
2. Register a patient and open **My turn**.
3. Press **F12** → **Application** tab → **Service workers**: you should see `sw.js` "activated and is running". Under **Cache storage** you'll see the cached app files.
4. Go to the **Network** tab → change **No throttling** to **Offline**.
5. You will see one line: *"No connection. Your place in the line may be out of date. Last updated … ago."*
6. Reload the page: it still opens (from the cache). Open **Find a place**: maps and directions still work. Open your slip: it still shows.
7. Register another patient while offline: the slip says **"Waiting to be confirmed"**.
8. Switch back to **No throttling**: within a few seconds the line says *"Connection is back. Updated."* and the waiting slip gets its real token.

## Lighthouse report

1. Open the link in Chrome (an Incognito window, so extensions don't interfere).
2. **F12** → **Lighthouse** tab → Mode **Navigation**, Device **Mobile**, tick Performance, Accessibility, Best practices, SEO → **Analyze page load**.
3. Our result on the production build (simulated slow 4G phone): **Performance 97, Accessibility 100, Best Practices 100, SEO 100**. First Contentful Paint 1.8 s, Largest Contentful Paint 2.1 s.
4. From the command line instead: `npx lighthouse https://YOUR-LINK --form-factor=mobile --view`.
