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
