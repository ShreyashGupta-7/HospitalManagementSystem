# 3-minute demo script — OPD Saathi

**Set-up (before you are called):** one laptop with three windows side by side, plus one real phone.

| Left (phone-size window, 360 px, or the real phone) | Middle | Right |
|---|---|---|
| Patient: `/` | Staff dashboard: `/staff` (unlocked, PIN 4321) | TV board: `/board` (tap "Tap to start" so sound works) |

Before you start: on the dashboard press **Reset everything**, then **Add 20 sample patients**. Leave the clock at **1x**. On the board, tick **English + हिंदी**. Turn the laptop volume up. Have the phone's language set to Hindi only after the opening line.

Judges score: ease of registration · language accessibility · inclusive design · queue-management efficiency · navigation accuracy · emergency handling · technical execution · real-world usefulness. Each part below says which one it shows, and the one sentence on the problem it solves.

---

### 0:00 – 0:20 · Opening (real-world usefulness)

> "This is Kamla. She's 62, she's alone, she reads a little Hindi, and she avoids stairs. Today she would stand in a registration line for an hour and then ask five people where Room 3 is. OPD Saathi fixes the whole visit — from the gate to the doctor's door."

Point at the red bar at the bottom: **"Emergency is on every screen, even before registering. We'll come back to it."**

### 0:20 – 1:05 · Register in Hindi, assisted mode (ease of registration · language · inclusive design)

1. Patient window: pick **हिंदी** in the language picker (each language is written in its own script).
2. Tap **रजिस्टर करें**. Show the signs list for one second: **"If any of these, go to Emergency now — no token needed."** Tap **इनमें से कुछ नहीं**.
3. Turn on **कोई मेरी मदद कर रहा है** (Someone is helping me): the text jumps to the biggest size, every question is read aloud, and stairs are avoided.
4. Name: tap the **microphone** and say "कमला" (or type Kamla). Age 62. Tap **महिला**. Tap **मेरे पास फ़ोन नहीं है — छोड़ें** or type a number.
5. Picture cards: tap **बच्चों के डॉक्टर** (or General Medicine). Tap **मेरा टोकन लें**.

> *Problem solved:* "Registration is one question per screen, in her language, with pictures and voice — a helper can do it with her, and Back never loses an answer."

The slip appears: token, room, floor, doctor, people ahead, "about 35 minutes", QR code. Tap **पढ़कर सुनाएँ** (read aloud) for two seconds.

### 1:05 – 1:20 · She appears everywhere (queue-management efficiency · technical execution)

Point at the middle and right windows: **Kamla's token is already on the staff dashboard**, and the board updates on its own.

> *Problem solved:* "One live queue across every phone, counter and TV — a change reaches every screen within a second, through our Socket.io server."

### 1:20 – 1:50 · Follow the avoid-stairs route (navigation accuracy)

Tap **कमरा 3 का रास्ता दिखाएँ**. Show:

- The **"no stairs on this route"** badge, the ramp at the entrance, the lift.
- The blue route on the **ground-floor and first-floor plans**.
- Steps with landmarks: *"Room 3 is the first door on your right. Look for a door with cartoon pictures, next to the blue chairs."* Tap the speaker on one step.
- Flip **Avoid stairs** off for a second: the route switches from the ramp to the entrance steps (shorter), and the badge says "This route uses stairs". Turn it back on. (For a bigger difference, pick *From: Room 6* → *To: Pharmacy*: with stairs allowed it takes the staircase; with Avoid stairs it walks to the lift.)

> *Problem solved:* "She doesn't need to read a map: shortest-path routing over the hospital graph turns into plain steps with things she can see, read aloud, and never uses stairs when she can't."

### 1:50 – 2:20 · The "3 ahead" alert and the call (queue-management · inclusive design)

1. Open **मेरी बारी देखें** (My turn) on the patient window.
2. On the dashboard press **Call next** on Room 3 a few times. Each press: the board highlights the new token and **announces it aloud in English and Hindi**.
3. When 3 people are ahead, the phone **vibrates, chimes, shows a banner and a simulated SMS**: *"आपकी बारी पास है। कृपया पहली मंज़िल पर कमरा 3 जाएँ।"*
4. One more Call next: the phone shows **"आपकी बारी आ गई!"** in huge type with directions.

> *Problem solved:* "She can sit down instead of crowding the door — her phone and the TV tell her when to move, and staff see waiting times and crowding to balance the rooms."

(Optional, 5 seconds: on the dashboard set Room 3's doctor to **On a break until 11:30** — the patient screen and the board show it instantly, and the wait estimate grows.)

### 2:20 – 2:50 · Raise an urgent flag (emergency handling)

1. On the patient window tap **मुझे तुरंत मदद चाहिए** (I need urgent help) → **स्टाफ़ को सूचना भेजें**.
2. The dashboard **rings and pins a red alert at the top** with her token. Tap **Mark as seen** — the patient's screen turns green: "स्टाफ़ ने आपकी सूचना देख ली है।"

> *Problem solved:* "Urgent cases never wait for a token. The app never decides who is urgent — it only gets a qualified person to the patient fast, and points everyone to Casualty, 112 and 108."

### 2:50 – 3:00 · Close (technical execution · real-world usefulness)

> "It works on a ₹6,000 Android phone on a weak signal — it's an installable app that opens offline, keeps registrations made without signal and sends them later — and it has a counter mode for people with no phone. Three languages, every screen read aloud, Lighthouse accessibility 100. Thank you."

---

## If you have 30 seconds more

- **Tamil:** Settings → தமிழ் — every word, place name and direction switches.
- **Offline:** Chrome DevTools → Network → Offline → reload: still opens; register → "Waiting to be confirmed"; back online → confirmed.
- **Counter:** `/staff/counter` — register someone with no phone in 5 taps and print the slip.
- **10x clock + Run queues by themselves:** the whole hospital moves on its own.

---

# What could go wrong during the live demo — and how to avoid it

| Risk | How to avoid it |
|---|---|
| **The free Render server is asleep** (first load takes ~50 s) | Open the link 5 minutes before you are called, and again 1 minute before. Keep a tab open on `/api/health`. |
| **Venue Wi-Fi is slow or blocks WebSockets** | Socket.io falls back to long-polling by itself. If there's no internet at all, run the backup: `npm run build && npm start` on the laptop and open `http://localhost:3001` in all three windows — or local mode (`?mode=local`) which needs no server. |
| **No sound from the board or dashboard** | Browsers block sound until you tap. Tap **Tap to start** on the board and **Turn on alert sound** on the dashboard before the demo. Turn the laptop volume up, and unmute the tab. |
| **No Hindi voice on the laptop** (Listen button hidden) | Chrome on Windows/Android has "Google हिन्दी". Check Settings on the patient window before the demo: if the Listen button is missing in Hindi, use Chrome (not Edge/Firefox) or show read-aloud in English. |
| **Microphone doesn't work** | Voice input needs Chrome and HTTPS (or localhost) and permission. Allow the mic once before the demo. If it fails, just type — it's a bonus, not the main path. |
| **Notification permission prompt pops up mid-demo** | Tap "Turn on alerts" on My turn once during set-up and allow it. Even without it, the banner, sound, vibration and simulated SMS still appear. |
| **Old data on screen from rehearsal** | Dashboard → **Reset everything** (tap twice) → **Add 20 sample patients** right before you start. |
| **The phone shows "This device only"** (it was opened before the server, or with `?mode=local`) | Open the link with `?mode=server` once, or Settings shows the connection. On the laptop, use the same link in all three windows. |
| **The 3-ahead alert already fired during rehearsal** (it fires once per token) | Register a fresh patient for the real demo after Reset. |
| **Screen too small to show three windows** | Use Chrome's device toolbar (F12 → phone icon, 360 × 760) for the patient window, or use the real phone for the patient and the laptop for dashboard + board. |
| **Stuck in high contrast or biggest text from a previous test** | Settings → turn them off; or in the patient window run `localStorage.clear()` in DevTools and reload. |
| **Typing the token wrongly on "I have my slip"** | It accepts "med 42", "MED42" and "MED-042". Or tap the token under "Your recent tokens". |
| **Laptop sleeps or screen dims** | Plug in the charger; set "Turn off screen" to Never for the session. |
| **Judges' phones can't scan the QR** | QR scanning needs Chrome on Android with camera permission; otherwise they can type the token. The QR also works with any phone camera app — it simply opens the My turn link. |
