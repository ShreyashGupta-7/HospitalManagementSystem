# Requirement checklist — status

Status after the final pass. ✅ done · 🟡 done with a limit (explained) · ❌ missing.
"Tested" means covered by an automated test in `scripts/` (see the README).

## Core prototype

| Requirement | Status | Notes / where |
|---|---|---|
| Emergency button on every screen, with the way to Emergency, 112 and 108 | ✅ | Fixed bottom bar on every patient screen (`Layout.jsx`), also in the loading screen; `/emergency` shows route, 112, 108. The TV board has a pinned emergency line. Staff screens show urgent alerts instead. |
| Emergency signs list on the first registration screen | ✅ tested | `Register.jsx` step 0, "Any of these? Go to Emergency now. You don't need a token." |
| Urgent flags pinned to the top of the dashboard with a sound until marked seen | ✅ tested | Alarm every 3 s, tab title shows the count; reached the dashboard in 77 ms (tabs) / 236 ms (server). |
| Nothing makes an urgent case wait; the app never decides urgency | ✅ | No severity questions anywhere; Emergency needs no token; staff prompt says "Do not make them wait for a token". |
| Home: four big buttons, first-visit language choice in each script | ✅ tested | |
| Register: one question per screen, progress bar, picture cards, "Not sure?" → help desk | ✅ tested | |
| Register: microphone input where supported | 🟡 | Web Speech API; hidden where missing (e.g. Firefox). Needs HTTPS or localhost. Spoken numbers in Tamil words may not convert to digits — typing still works. |
| Register: assisted mode | ✅ tested | Biggest text, read aloud, avoid stairs, helper note. |
| Register: Back keeps answers | ✅ tested | Answers in sessionStorage; each step is in the URL so the phone's Back works. |
| OPD slip: token, room, floor, doctor, people ahead, wait, QR | ✅ tested | Medicine shows "Room 1 or 2" until called (two doctors share one queue). |
| Slip: save as image, print, read aloud, large type for staff | ✅ | Canvas PNG download; print-only CSS; large view in patient language + English. |
| My turn: place, now serving, doctor status | ✅ tested | |
| My turn: alert at 3 ahead (vibration, sound, banner, notification, simulated SMS) | 🟡 tested | All five fire. Vibration only on Android; system notifications need permission (and on iPhone only for an installed app). Banner, chime and SMS card always show. |
| My turn: called screen with directions | ✅ tested | |
| I have my slip: token entry + QR scan where supported | ✅ | Accepts "med 42"; BarcodeDetector (Chrome on Android); scan button hidden elsewhere. |
| Find a place: SVG plans, route drawn, landmark steps, Dijkstra, Avoid stairs, Listen, I'm lost | ✅ tested | All 961 place pairs routed; avoid-stairs never uses stairs. Plan labels are small on a 360 px phone — "Bigger map" doubles it. |
| Settings: language, text size, high contrast, read aloud, avoid stairs | ✅ tested | Plus assisted mode and Install app. Read aloud is hidden when the phone has no voice for the language. |
| Staff dashboard: queues, call next, no-show, end of queue, move department, doctor status, crowding colours | ✅ tested | Crowding uses colour + icon + words. |
| Registration counter | ✅ tested | Prints the slip in the patient's language. |
| Waiting-room board with spoken announcements, alternating languages | 🟡 | Works; sound needs one tap ("Tap to start") because browsers block autoplay. |
| Demo controls: 20 samples, 10x, reset | ✅ tested | Also 30x and "Run queues by themselves". |
| Estimated wait from the last 10 consultations + doctor's delay, rounded to 5 | ✅ tested | Divided by the number of doctors working (Medicine has two). |
| Live sync between tabs (BroadcastChannel + localStorage) | ✅ tested | Local mode. |
| All hospital data in `src/data`, all interface text in translation files | ✅ tested | English place/doctor names live in `src/data` (as the brief asks for the hospital file); Hindi/Tamil versions in `src/i18n`. |
| 360 px wide, largest text, after reload, no console errors | ✅ tested | `npm run test:screens` checks 21 routes × 3 setups. |

## Live across devices (server)

| Requirement | Status | Notes |
|---|---|---|
| Node + Express + Socket.io server holding queues, tokens, doctor status, flags | ✅ tested | `server/index.js`, state saved to disk after every action. |
| Every change reaches every screen within a second | ✅ tested | 105 ms (registration), 236 ms (urgent flag) across separate browser sessions. |
| Lost connection: keep last state, "Last updated …", reconnect, catch up | ✅ tested | |
| Patients see only their token and the public queue; only staff can call/move/remove | ✅ tested | Public view has no names; staff actions refused without the PIN. |
| Staff PIN + note that a real hospital needs proper logins | ✅ | Shown on the PIN screen and the dashboard. |
| How to run together and put online | ✅ | README + `docs/DEPLOY.md`. |

## Weak connection (PWA)

| Requirement | Status | Notes |
|---|---|---|
| PWA with vite-plugin-pwa; Install button only when the browser offers it | ✅ | iPhone Safari never offers it (uses "Add to Home Screen" instead). |
| App, floor plans, directions and the patient's slip open offline | ✅ tested | |
| Offline line with last-updated time; refresh when back | ✅ tested | |
| Offline registration kept and sent later; slip "waiting to be confirmed" | ✅ tested | No duplicates on resend. |
| How to test in DevTools and Lighthouse | ✅ | `docs/DEPLOY.md`. Our score: 97 / 100 / 100 / 100. |

## Tamil

| Requirement | Status | Notes |
|---|---|---|
| Every string, department cards, places, landmarks, directions, signs list, board announcements | ✅ tested | `npm test` checks every key and placeholder. |
| Simple words; OPD, Casualty, X-ray kept in brackets | 🟡 | Written by us; **should be checked by a native speaker** before real use (same for Hindi). |
| Language names in their own script | ✅ | |
| No English left on any screen; no layout breaks at 360 px or on the board | ✅ tested | Only intentional bracketed sign words remain. |
| Listen/announcements use a Tamil voice if present; else hide Listen and announce in Hindi + English | ✅ | |

## Submission

| Requirement | Status |
|---|---|
| README with every section asked for | ✅ |
| Step-by-step Vercel/Netlify (+ Render) deploy, with the no-404 setting | ✅ `docs/DEPLOY.md` |
| 3-minute demo script with one problem sentence per part | ✅ `docs/DEMO_SCRIPT.md` |
| Live-demo risks and how to avoid them | ✅ `docs/DEMO_SCRIPT.md` |

## Not finished / known limits

1. **Not deployed yet** — deploying needs your Render/Vercel/Netlify account (sign-in with GitHub). Steps are in `docs/DEPLOY.md`; it takes about 5 minutes.
2. **Translations not reviewed by native speakers** (Hindi and Tamil).
3. **Voices depend on the device**: if a phone has no Hindi/Tamil voice, Listen is hidden for that language.
4. **Free Render tier** sleeps when idle and forgets the queue on restart (fine for a demo).
5. **Floor-plan labels are small** on 360 px phones; use "Bigger map" or the step list.
6. **Not tested on a real Android phone or iPhone** from here (tested in desktop Chrome with phone-size screens and mobile emulation).
