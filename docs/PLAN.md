# OPD Saathi — Build Plan

Hackathon: Problem Statement 2 — Smart Queue Management and Accessible Navigation for Government Hospitals.
Time budget: 12 hours. Main user: Kamla, 62, reads a little Hindi, basic Android phone, avoids stairs.

## 1. What makes this stand out (out of ~500 teams)

1. **Emergency first, by design.** The Emergency button is on every screen, even before registration. The app never
   decides who is urgent; it only routes people to staff fast. Urgent flags ring on the staff dashboard until a human
   marks them as seen.
2. **Works with or without the internet.** One shared "queue engine" runs on the server *and* in the browser.
   With the server, every phone and laptop is live within a second. Without it (hall Wi-Fi down), the app keeps
   working on one device across tabs. Offline registrations are queued on the phone and sent later.
3. **Kamla can actually use it.** Assisted mode (bigger text, everything read aloud, helper fills it in),
   picture cards in plain words, voice input, three languages (English, हिंदी, தமிழ்), avoid-stairs routing,
   and a "show this to staff" card in two languages.
4. **Directions people understand.** Real shortest-path routing (Dijkstra) over a graph of the hospital, turned
   into steps with landmarks people can see ("opposite the blue chairs"), drawn on SVG floor plans.
5. **A demo that tells the story in 3 minutes.** Demo controls (20 sample patients, 10x clock, reset) and a TV
   board that speaks tokens aloud.

## 2. Technology and why

| Need | Choice | Why this, not the others |
|---|---|---|
| UI | **React 18 + Vite** | Required by brief. Vite gives sub-second reloads and a small, fast production build (good on weak 3G). CRA is deprecated; Next.js adds server rendering we don't need. |
| Styling | **Tailwind CSS 3** | Required. Utility classes keep sizes (18px text, 56px buttons) consistent everywhere; no CSS file to keep in sync; purges unused CSS, so the bundle stays tiny. |
| Routing | **React Router 6** | Required. Standard, small, supports deep links like `/turn/MED-042` from the QR code. |
| Language | **Plain JavaScript** | Required. Faster to write for a 12-hour hackathon. |
| Live sync (server) | **Node + Express + Socket.io** | No accounts or API keys (Firebase/Supabase need both, and their free tiers can sleep or rate-limit during a demo). Works on a laptop hotspot with no internet at all. The server enforces "only staff can call/move patients" in ~20 lines. Socket.io reconnects automatically and falls back to long-polling on networks that block WebSockets (common in hospitals/colleges). |
| Live sync (no server) | **localStorage + BroadcastChannel** | Built into every browser, zero bytes of library. Keeps the demo alive if the server or Wi-Fi fails. |
| Shared rules | **One queue engine file** (`shared/engine.js`) used by both server and browser | The same code computes tokens, positions and waits, so server mode and local mode can never disagree. |
| Offline / install | **vite-plugin-pwa (Workbox)** | Required. Generates the service worker and manifest from config; precaches the app, so floor plans, directions and the saved slip open with no signal. |
| QR code (make) | **qrcode-generator** (~20 KB, no dependencies) | Smallest reliable generator; outputs SVG, so the slip stays sharp when printed. |
| QR code (scan) | **Browser BarcodeDetector** | No library at all. Hidden where the browser doesn't have it (typed token still works). |
| Voice out / in | **Web Speech API** (speechSynthesis / SpeechRecognition) | Built in, free, works for hi-IN and ta-IN on Android Chrome. Hidden when no voice exists. |
| Maps | **Inline SVG** | Required. A few KB, scales to any screen, and the route can be drawn on top. No map library or image downloads. |
| Sound | **Web Audio API** | Generated beeps; no audio files to download. |
| Testing | **Playwright (with the Chrome already installed)** | Opens every screen at 360px, checks for console errors and checks the three-tab flow automatically. |
| Hosting | **Render (server + app in one service)**, or **Vercel/Netlify** for the app + Render for the server | Vercel/Netlify functions can't hold WebSockets open, so the Socket.io server needs a host like Render/Railway. Serving the built app from the same Express server gives the judges one link. |

## 3. Phases (with time budget)

| # | Phase | Time | Output |
|---|---|---|---|
| 0 | Setup: plan, dev log, git, Vite + Tailwind + Router scaffold | 0:30 | Running empty app |
| 1 | Data + i18n: hospital graph, departments, sample patients; English + Hindi strings | 1:00 | `src/data/*`, `src/i18n/*` |
| 2 | Queue engine + store: tokens, positions, waits (last 10 consults + delay, round to 5), local sync via localStorage + BroadcastChannel | 1:00 | `shared/engine.js`, store hooks |
| 3 | Patient screens: Home + language picker, Register (5 steps), OPD slip, My turn (alerts at 3 ahead, called screen), I have my slip (QR scan), Emergency, Settings, urgent flag | 2:30 | All patient screens |
| 4 | Navigation: Dijkstra, avoid stairs, step-by-step landmark directions, SVG floor plans with route, Listen, I'm lost | 1:30 | Find a place |
| 5 | Staff: dashboard (queues, call next, no-show, to end, move, doctor status, crowding, urgent flags + sound), counter, TV board with announcements, demo controls | 1:30 | `/staff`, `/counter`, `/board` |
| 6 | Server: Express + Socket.io, staff PIN, public vs staff views, reconnect + "last updated", catch-up | 1:00 | `server/` |
| 7 | PWA + offline: install button, caching, offline line, offline registration outbox | 0:45 | Installable app |
| 8 | Tamil as a third language + voice checks | 0:45 | `src/i18n/ta.js` |
| 9 | QA: automated checks at 360px / largest text / reload / three tabs; consistency pass on every screen | 0:45 | Fixes |
| 10 | Submission: README, deploy guide, 3-minute demo script, live-demo risks | 0:45 | `README.md`, `docs/*` |

Total ≈ 12 hours. Each phase ends with a commit and an entry in `docs/DEV_LOG.md`.

## 4. Extra features added (beyond the brief)

- **Hybrid sync**: server mode for many devices, automatic local mode when no server — the demo can't die.
- **"After the doctor" next steps**: when a consultation ends, the patient sees where to go next (Pharmacy, Lab) with directions.
- **Hospital clock**: when the demo runs at 10x, all screens show the same simulated time.
- **Staff "Show to staff" card**: destination in the patient's language and in English.
- **Print-friendly slip** and **save as image** drawn on a canvas (no library).
- **Staff stats**: patients seen today and average wait per department.
- **Automated test script** that opens every screen, so regressions are caught.

## 5. What is simulated

The hospital, doctors, patients, SMS messages and the clock speed-up. No real ID (Aadhaar/ABHA) is ever asked for.
The staff PIN is a prototype stand-in for a proper staff login.
