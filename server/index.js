// OPD Saathi server: holds the shared hospital state and pushes every change to every
// open screen (phones, laptops, the TV board) within a second, using Socket.io.
//
// - Patients and the board get the public view only (tokens, no names or phone numbers).
// - Only sockets that sent the right staff PIN can call, move or remove patients.
//   A real hospital needs a proper staff login per person; the PIN is a prototype stand-in.
// - The state is saved to server/state.json, so restarting the server keeps the queues.
// - It also serves the built app (dist/), so one link opens everything.

import express from 'express';
import compression from 'compression';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import {
  reduce, tick, publicView, normaliseState, createInitialState, PUBLIC_ACTIONS, STAFF_ACTIONS,
} from '../shared/engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const STAFF_PIN = String(process.env.STAFF_PIN || '4321');
const STATE_FILE = process.env.STATE_FILE || path.join(__dirname, 'state.json');
const DIST = path.join(__dirname, '..', 'dist');

// ---------- state ----------

function loadState() {
  try {
    return normaliseState(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')));
  } catch {
    return createInitialState();
  }
}

let state = loadState();
let saveTimer = null;
function saveNow() {
  clearTimeout(saveTimer);
  try {
    // Write to a temp file, then rename, so a crash never leaves a half-written file.
    fs.writeFileSync(`${STATE_FILE}.tmp`, JSON.stringify(state));
    fs.renameSync(`${STATE_FILE}.tmp`, STATE_FILE);
  } catch (err) {
    console.error('Could not save state:', err.message);
  }
}
/** Patient and staff actions are saved at once; clock ticks are batched. */
function persist(immediate = false) {
  if (immediate) return saveNow();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 1000);
  return undefined;
}
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    saveNow();
    process.exit(0);
  });
}

// ---------- web server ----------

const app = express();
app.disable('x-powered-by');
app.use(compression()); // smaller downloads on weak hospital connections
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ app: 'opd-saathi', ok: true, rev: state.rev, time: Date.now() });
});

app.get('/api/public', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ state: publicView(state), serverNow: Date.now() });
});

if (fs.existsSync(DIST)) {
  // Hashed files can be cached for a long time; index.html and the service worker must not be.
  app.use(express.static(DIST, {
    setHeaders(res, file) {
      if (/\/assets\//.test(file.replace(/\\/g, '/'))) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else res.setHeader('Cache-Control', 'no-cache');
    },
  }));
  // Any other page (e.g. /turn/MED-042 after a refresh) gets the app, not a 404.
  app.get(/^\/(?!api\/|socket\.io\/).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST, 'index.html'));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 10000,
  pingTimeout: 8000,
});

function broadcast() {
  const serverNow = Date.now();
  io.to('staff').emit('state', { state, serverNow, staff: true });
  io.to('public').emit('state', { state: publicView(state), serverNow, staff: false });
}

function sendTo(socket) {
  const staff = Boolean(socket.data.staff);
  socket.emit('state', { state: staff ? state : publicView(state), serverNow: Date.now(), staff });
}

function setStaff(socket, on) {
  socket.data.staff = on;
  socket.leave(on ? 'public' : 'staff');
  socket.join(on ? 'staff' : 'public');
}

// Simple per-connection limits so one phone can't flood the queue.
const LIMITS = { register: 10, 'flag.raise': 6, 'flag.update': 20, 'staff:login': 8 };
function allowed(socket, kind) {
  const nowMin = Math.floor(Date.now() / 60000);
  const bucket = socket.data.rate || (socket.data.rate = {});
  if (bucket.min !== nowMin) {
    socket.data.rate = { min: nowMin };
    return allowed(socket, kind);
  }
  bucket[kind] = (bucket[kind] || 0) + 1;
  return !LIMITS[kind] || bucket[kind] <= LIMITS[kind];
}

io.on('connection', (socket) => {
  const pin = socket.handshake.auth?.pin;
  setStaff(socket, pin != null && String(pin) === STAFF_PIN);
  sendTo(socket);

  socket.on('staff:login', (p, ack) => {
    if (typeof ack !== 'function') return;
    if (!allowed(socket, 'staff:login')) return ack({ ok: false, error: 'too-many' });
    const ok = String(p) === STAFF_PIN;
    if (ok) {
      setStaff(socket, true);
      sendTo(socket);
    }
    return ack({ ok });
  });

  socket.on('staff:logout', () => {
    setStaff(socket, false);
    sendTo(socket);
  });

  socket.on('action', (action, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') return reply({ error: 'bad-action' });
    const isStaffAction = STAFF_ACTIONS.has(action.type);
    if (!isStaffAction && !PUBLIC_ACTIONS.has(action.type)) return reply({ error: 'unknown-action' });
    if (isStaffAction && !socket.data.staff) return reply({ error: 'forbidden' });
    if (!isStaffAction && !allowed(socket, action.type)) return reply({ error: 'too-many' });
    try {
      const out = reduce(state, action, { realNow: Date.now() });
      state = out.state;
      persist(true);
      broadcast();
      return reply({ result: out.result });
    } catch (err) {
      return reply({ error: err.message || 'error' });
    }
  });
});

// The hospital clock: ends breaks on time and runs the demo queues when switched on.
setInterval(() => {
  const next = tick(state, { realNow: Date.now() });
  if (next) {
    state = next;
    persist();
    broadcast();
  }
}, 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`OPD Saathi server on http://localhost:${PORT}  (staff PIN ${STAFF_PIN === '4321' ? '4321 (default)' : 'set from STAFF_PIN'})`);
  if (!fs.existsSync(DIST)) console.log('No dist/ folder yet: run "npm run build" to serve the app from this server too.');
});
