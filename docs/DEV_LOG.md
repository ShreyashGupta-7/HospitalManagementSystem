# OPD Saathi — Development Log

A running record of everything done, in order, with the reasons. Use it for the project report.
Times are approximate (start: 24 Oct 2026, evening, IST).

---

## Phase 0 — Setup (≈0:30)

**What**
- Checked the machine: Node 24, npm 11, Git 2.56, Chrome 156 and Edge installed. Project folder was empty.
- Wrote the plan: `docs/PLAN.md` (features, technology choices with reasons, 11 phases, time budget).
- `git init`, branch `main`, remote `origin` = github.com/ShreyashGupta-7/HospitalManagementSystem.
  Git name/email set for this repo only (Shreyash Gupta), so commits are credited to the owner.
- One `package.json` for both the app and the server (one install, one deploy).
- Installed: React 18, React Router 6, Vite 5, Tailwind 3, vite-plugin-pwa, Express 4, Socket.io 4,
  socket.io-client, qrcode-generator, concurrently, playwright-core (testing with the installed Chrome — no browser download).
- Config: `vite.config.js` (PWA manifest + Workbox, dev proxy `/api` and `/socket.io` → server on :3001),
  `tailwind.config.js` (colours from CSS variables so high-contrast mode swaps everything), `postcss.config.js`, `index.html`.

**Decisions**
- Plain JavaScript + React + Vite + Tailwind + React Router, as the brief asks.
- Single package instead of two (client/server) to keep the hackathon setup to one `npm install`.

## Phase 1 — Hospital data and English text (≈1:00)

**What**
- `src/data/hospital.js`: City District Hospital, 3 floors on a 400 × 300 grid (1 unit = 0.25 m).
  31 places (each with name, floor, x/y door point, drawing box, one visible landmark, search tags),
  21 corridor junctions, and the path graph (walking metres computed from the plan; stairs/lift between floors
  with fixed costs; entrance has "steps" and a longer "ramp" path).
- `src/data/departments.js`: 7 departments (General Medicine has 2 rooms), doctor names, OPD hours 09:00–14:00,
  sample average consultation times, 2 waiting areas with seat counts for crowding.
- `src/data/patients.js`: 20 made-up sample patients (first names only).
- `src/i18n/en.js`: every interface sentence. Place names/landmarks/doctor names in English stay in `src/data`
  (as the brief asks), with Hindi/Tamil versions in `hi.js` / `ta.js`.

**Decisions**
- Landmarks are written as "things you can see" so they read naturally after "Look for …".
- Medicine's two rooms share one queue (whoever is free calls next), like a real OPD.

## Phase 2 — Queue engine and shared state (≈1:00)

**What**
- `shared/engine.js` — one file used by both the browser and the server:
  tokens (`MED-042`), queue order, call next, no-show, send to end, move department (keeps the patient's
  place by arrival time), doctor status (available / break until a time / late by N min), urgent flags,
  demo actions (20 samples, 1x/10x/30x clock, auto-run, reset), and the **public view** (no names, ages or numbers).
- **Waiting time** = people ahead × average of the last 10 consultations ÷ doctors working + the doctor's delay,
  rounded to 5 minutes ("about 25 minutes"). Starts from the sample average in departments.js.
- **Hospital clock**: minutes since midnight in India time, so the demo can run at 10x and every device shows the same time.
- `src/store/store.js`: chooses the sync mode automatically —
  server (Socket.io) if `/api/health` answers, otherwise local (localStorage + BroadcastChannel, one tab runs the
  clock using the Web Locks API). Offline registrations and urgent alerts go into an outbox and are sent later.
- `src/store/visits.js`: the patient's own tokens, kept only on their phone.
- Tested in Node (`scripts/engine-test.mjs`): registration, samples, delays, moving, 5 minutes at 10x with auto-run,
  crowding, and that the public view contains no names.

## Phase 3 — Patient screens (≈2:30)

**What**
- Layout: top bar (Back, Home, Listen, Settings — icon + word each), one-line offline notice,
  and a fixed bottom bar on every patient screen: **Emergency** + **I need urgent help**.
- Home: four big buttons (Register / I have my slip / Find a place / Emergency); first visit asks for a
  language, each shown in its own script; current token card.
- Register: step 0 lists the emergency signs ("Any of these? Go to Emergency now. You don't need a token."),
  then 5 questions, one per screen, with "Step n of 5" progress bar; mic button (Web Speech) where supported;
  "Someone is helping me" switch (assisted mode: biggest text, read aloud, avoid stairs, helper note);
  department picture cards in plain words; "Not sure? Ask at the help desk" → directions; answers kept in
  sessionStorage and in the URL (`?step=`), so the phone's Back button keeps every answer.
- OPD slip: token, name, department, room ("Room 1 or 2" for Medicine until called), floor, doctor, people ahead,
  waiting time, QR code (opens `/turn/TOKEN` on any phone). Save as picture (drawn on a canvas), Print (print-only CSS),
  Read aloud, Show to staff (large type, patient language + English).
- My turn: place in line, wait, now serving, each doctor's status, what to do next. At 3 ahead: vibration,
  chime, banner, system notification (through the service worker on Android) and a simulated SMS card.
  When called: big "It is your turn", room, and directions. After the visit: Pharmacy / Lab next steps.
- I have my slip: type the token (accepts "med 42"), speak it, or scan the QR (BarcodeDetector; button hidden where missing).
- Emergency: go now / tell any staff, 112 and 108, route on the map, the signs list, "This app never decides how urgent it is".
- Urgent help sheet: who is asking (patient/helper) → send → "A staff member is coming" → optional "Where are you?"
  → turns green when staff mark it seen.
- Settings: language, 3 text sizes, high contrast, read aloud, avoid stairs, assisted mode, Install app (only when offered).

## Phase 4 — Navigation (≈1:30)

**What**
- `src/lib/route.js`: Dijkstra's shortest path over the graph; "Avoid stairs" skips every path with steps;
  routes never pass *through* a room. Steps are data (start, walk, turn left/right with metres, reach the lift,
  take the lift up/down, come out of the lift, ramp, arrive "the 2nd door on your right"), counted from the plan geometry.
- `src/lib/directionsText.js`: turns steps into sentences in any language (so switching language re-words the same route).
- `FloorPlan.jsx`: SVG floor plans (rooms, corridors, blue chairs in Waiting hall A), animated route line,
  "You" and destination markers, "Bigger map" for small screens.
- `RouteView.jsx`: distance and walk time, "uses stairs / no stairs" badge, one map per floor on the route,
  numbered steps with a Listen button each and "Listen to all steps".
- Find a place (search + groups), I'm lost (nearest help desk + a big card for staff in two languages).
- Tested every pair of places (961 routes): all reachable, avoid-stairs never uses stairs, every route ends with "arrive".

## Phase 5 — Staff screens (≈1:30)

**What**
- `/staff`: PIN gate (prototype PIN 4321, with a note that a real hospital needs proper staff logins).
- Dashboard: urgent flags pinned on top (red, pulsing, alarm every 3 s, tab title shows the count, "Mark as seen");
  waiting-area crowding (calm / getting busy / overcrowded — colour + icon + words, never colour alone);
  each department: waiting count, average wait, wait for a new patient, average consult (last 10), seen today;
  each room: now serving, Call next, Call again, No-show, To end; doctor status (available / break until / late by);
  queue list with No-show, To end of line, Move to another department.
- Demo controls: add 20 sample patients, clock 1x/10x/30x, run queues by themselves, reset (tap twice), sync mode switch.
- `/staff/counter`: register a patient with no phone in a few taps (name, age, gender, doctor, language) → printable slip in the patient's language.
- `/board`: TV view, all departments, now serving + next three, delays, emergency line, rotating languages,
  spoken announcements ("Token M E D 42, please go to Room 1") with a chime; a start screen unlocks sound.

## Phase 6 — Server (≈1:00)

**What**
- `server/index.js`: Express + Socket.io. Holds the state, saves it to `server/state.json`, runs the hospital clock,
  pushes every change to every screen. Staff sockets (correct PIN) get the full state; patients and the board
  get the public view. Staff-only actions are refused without the PIN. Simple rate limits per connection.
  Also serves the built app with a catch-all route (no 404 on refresh).

## QA so far

- `scripts/smoke.mjs`: opens 21 routes at 360 px in 3 setups (English; Hindi biggest text; Tamil biggest + high contrast),
  reports console errors, page errors, anything wider than the screen, and leftover English words.
- First run found: React Router future-flag warnings (fixed by opting in) and a board crash (an effect returned a value) — fixed.
- English screens: no errors, nothing wider than 360 px.

## Phase 7 — Hindi and Tamil (≈1:30)

**What**
- `src/i18n/hi.js` and `src/i18n/ta.js`: every interface string, plus all 31 place names, short map labels and landmarks,
  7 department cards, 8 doctors' names, directions, the emergency signs list, SMS text and board announcements.
- Hospital-sign words kept as they are, in brackets: OPD, Casualty, X-ray, Pharmacy, Ramp, General Medicine, ENT.
- Tamil changes word endings ("to/on the first floor"), so floor names appear in brackets in those sentences to keep the grammar correct.
- `scripts/i18n-check.mjs`: fails if any language misses a key, a `{placeholder}`, a place, a department or a doctor.
- Voices: Listen is hidden when the phone has no voice for the chosen language; the board always announces in
  Hindi + English and adds Tamil only if a Tamil voice exists.

## Phase 8 — Testing and fixes (≈2:00)

**Automated tests written**
- `scripts/smoke.mjs` — 21 routes × (English normal; Hindi biggest text; Tamil biggest text + high contrast) at 360 px:
  console errors, page errors, anything wider than the screen, leftover English.
- `scripts/e2e.mjs` — the full story: staff unlock → reset → 20 samples → board started → patient registers **in Hindi with
  assisted mode** → Back keeps answers → token on dashboard → urgent flag → seen → "turn is close" banner + SMS →
  board lists token → called screen with directions → no stairs used → survives reload.
  Runs in two modes: three tabs in one browser (local) and three separate devices through the server.
- `scripts/offline-test.mjs` — production build: patient socket gets no names; patient can't call next or reset;
  wrong PIN refused; service worker caches the app; server killed → phone keeps last state with "Last updated";
  offline registration → "Waiting to be confirmed"; slip, maps and directions open with no connection;
  server back → registration confirmed, no duplicates.

**Bugs found by the tests and fixed**
1. React Router v7 warnings → opted into the future flags.
2. TV board crashed (an effect returned a value) → fixed.
3. Words split in the middle at the biggest text ("इमरजें सी") → normal word wrapping; boxes allowed to shrink
   (fieldsets, flex/grid items, headings with an icon) so long Tamil words wrap instead of widening the page.
4. Token wrapped onto two lines → tokens never wrap and scale with the screen width.
5. Two-column button rows were cramped at big text → become one column at bigger text sizes.
6. Dashboard showed only 5 waiting patients → 8, then "+N".
7. **Server lost the last registration if it stopped within 0.5 s** (it saved on a timer) → now saves immediately
   after every patient/staff action (write to temp file, then rename), and on shutdown.
8. The board's red emergency line could scroll off a short screen → pinned to the bottom.
9. "Where are you now?" dropdown cut off the floor name → short floor names.

**Results**
- All screens OK in 3 languages at 360 px; E2E passed in both modes; offline test passed (16 checks).
- Sync speed: new registration on the dashboard in 55–105 ms; urgent flag in 77–236 ms.

## Phase 9 — Performance (≈0:30)

- Lighthouse (mobile, simulated slow 4G) first run: Performance 84 (First Contentful Paint 3.2 s).
- Fixes: a tiny built-in loading screen in `index.html` that already shows the emergency message, 112 and 108
  (useful when the signal is bad); less-used screens load only when opened; gzip compression on the server;
  `robots.txt`.
- Result: **Performance 97, Accessibility 100, Best Practices 100, SEO 100**; FCP 1.8 s, LCP 2.1 s.

## Phase 10 — Submission documents (≈0:45)

- `README.md` — problem, users, one line per screen, emergency handling and why the app never decides urgency,
  design decisions, waiting-time formula, before/after comparison, how to run and test, what is simulated, next steps.
- `docs/DEPLOY.md` — Render (one link, recommended), Vercel and Netlify (with the rewrite/redirect that stops a refresh
  showing a 404), laptop-hotspot backup, offline testing in DevTools, Lighthouse.
- `docs/DEMO_SCRIPT.md` — 3-minute script (patient, dashboard and board side by side; Hindi + assisted mode;
  avoid-stairs route; 3-ahead alert; urgent flag) with one problem sentence per part, and a table of live-demo risks.
- `docs/CHECKLIST.md` — every requirement with its status and limits.
- `render.yaml`, `vercel.json`, `netlify.toml`, `.env.example`.
- Screenshots in `docs/screenshots/` (`npm run screenshots`).
