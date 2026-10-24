// Shared hospital state (queues, tokens, doctors, urgent flags) for every screen.
//
// Two ways to sync, chosen automatically:
//  - server mode: a Node + Socket.io server holds the state; every phone and laptop gets
//    changes within a second. If the connection drops we keep the last known state,
//    show when it was updated, reconnect by ourselves and catch up.
//  - local mode: no server answered, so the state lives in localStorage and open tabs in
//    this browser stay in sync with BroadcastChannel. Same rules (shared/engine.js).

import {
  reduce, tick, normaliseState, createInitialState, publicView, STAFF_ACTIONS, PUBLIC_ACTIONS,
} from '../../shared/engine.js';
import { load, save, sessionLoad, sessionSave } from '../lib/storage.js';

const LOCAL_KEY = 'opd.state.v3';
const SERVER_CACHE_KEY = 'opd.server.cache';
const OUTBOX_KEY = 'opd.outbox';
const MODE_KEY = 'opd.mode';
const DETECTED_KEY = 'opd.mode.detected';
const PIN_KEY = 'opd.staffPin';
const LOCAL_PIN = import.meta.env.VITE_STAFF_PIN || '4321';

let snapshot = {
  hospital: createInitialState(),
  conn: { mode: 'local', status: 'connecting', lastSync: null, isStaff: false, skew: 0, outbox: 0, ready: false },
};
const listeners = new Set();
const events = new EventTarget();
let socket = null;
let channel = null;
let pendingPin = sessionLoad(PIN_KEY, null);

function emit() {
  listeners.forEach((fn) => fn());
}

function set(patch) {
  snapshot = {
    hospital: patch.hospital ?? snapshot.hospital,
    conn: { ...snapshot.conn, ...(patch.conn || {}) },
  };
  emit();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSnapshot() {
  return snapshot;
}

/** Real time corrected to the server's clock, so every device shows the same hospital time. */
export function realNow() {
  return Date.now() + (snapshot.conn.skew || 0);
}

export function onStoreEvent(type, fn) {
  const h = (e) => fn(e.detail);
  events.addEventListener(type, h);
  return () => events.removeEventListener(type, h);
}

function fire(type, detail) {
  events.dispatchEvent(new CustomEvent(type, { detail }));
}

function makeRef() {
  return `R${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

// ---------------- local mode ----------------

function readLocal() {
  return normaliseState(load(LOCAL_KEY, null));
}

function writeLocal(state) {
  save(LOCAL_KEY, state);
  try {
    channel?.postMessage({ type: 'changed', rev: state.rev });
  } catch {
    /* ignore */
  }
}

function startLocal() {
  const state = readLocal();
  save(LOCAL_KEY, state);
  set({ hospital: state, conn: { mode: 'local', status: 'online', lastSync: Date.now(), skew: 0, ready: true } });
  if (pendingPin === LOCAL_PIN) set({ conn: { isStaff: true } });

  const refresh = () => {
    const s = readLocal();
    if (s.rev !== snapshot.hospital.rev || s.updatedAt !== snapshot.hospital.updatedAt) {
      set({ hospital: s, conn: { lastSync: Date.now() } });
    }
  };
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel('opd-saathi');
    channel.onmessage = refresh;
  }
  // Fallback for browsers without BroadcastChannel (and a safety net).
  window.addEventListener('storage', (e) => {
    if (e.key === LOCAL_KEY) refresh();
  });

  // Only one tab runs the hospital clock (breaks ending, demo auto-run).
  const runTicker = () => {
    const id = setInterval(() => {
      const cur = readLocal();
      const next = tick(cur, { realNow: Date.now() });
      if (next) {
        writeLocal(next);
        set({ hospital: next, conn: { lastSync: Date.now() } });
      }
    }, 1000);
    return id;
  };
  if (navigator.locks?.request) {
    navigator.locks.request('opd-saathi-clock', () => new Promise(() => runTicker())).catch(() => {});
  } else {
    runTicker();
  }
}

function dispatchLocal(action) {
  if (STAFF_ACTIONS.has(action.type) && !snapshot.conn.isStaff) return Promise.reject(new Error('forbidden'));
  const cur = readLocal();
  const { state, result } = reduce(cur, action, { realNow: Date.now() });
  writeLocal(state);
  set({ hospital: state, conn: { lastSync: Date.now() } });
  return Promise.resolve(result);
}

// ---------------- server mode ----------------

function outbox() {
  return load(OUTBOX_KEY, []);
}

function setOutbox(list) {
  save(OUTBOX_KEY, list);
  set({ conn: { outbox: list.length } });
}

async function flushOutbox() {
  const list = outbox();
  for (const item of list) {
    if (!socket?.connected) return;
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await emitAction(item.action);
      setOutbox(outbox().filter((x) => x.action.clientRef !== item.action.clientRef));
      fire('confirmed', { clientRef: item.action.clientRef, type: item.action.type, result });
    } catch (err) {
      if (err.message !== 'offline' && err.message !== 'timeout') {
        // The server refused it (bad data): drop it so it doesn't block the others.
        setOutbox(outbox().filter((x) => x.action.clientRef !== item.action.clientRef));
        fire('rejected', { clientRef: item.action.clientRef, error: err.message });
      }
      return;
    }
  }
}

function emitAction(action) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('offline'));
      return;
    }
    socket.timeout(8000).emit('action', action, (err, res) => {
      if (err) reject(new Error('timeout'));
      else if (!res || res.error) reject(new Error(res?.error || 'error'));
      else resolve(res.result);
    });
  });
}

async function startServer(url) {
  const cache = load(SERVER_CACHE_KEY, null);
  set({
    hospital: cache?.state ? normaliseState(cache.state) : snapshot.hospital,
    conn: {
      mode: 'server', status: 'connecting', lastSync: cache?.savedAt || null, skew: cache?.skew || 0,
      outbox: outbox().length, ready: Boolean(cache?.state),
    },
  });

  // Loaded only in server mode, so local mode stays tiny.
  const { io } = await import('socket.io-client');
  socket = io(url, {
    auth: (cb) => cb({ pin: pendingPin || undefined }),
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    set({ conn: { status: 'online' } });
    flushOutbox();
  });
  socket.on('disconnect', () => set({ conn: { status: 'offline' } }));
  socket.on('connect_error', () => set({ conn: { status: 'offline' } }));
  socket.on('state', ({ state, serverNow, staff }) => {
    const skew = serverNow ? serverNow - Date.now() : snapshot.conn.skew;
    const now = Date.now();
    set({ hospital: state, conn: { lastSync: now, skew, isStaff: Boolean(staff), ready: true, status: 'online' } });
    save(SERVER_CACHE_KEY, { state: staff ? publicView(state) : state, savedAt: now, skew });
  });

  window.addEventListener('online', () => {
    if (!socket.connected) socket.connect();
  });
}

function dispatchServer(action) {
  if (STAFF_ACTIONS.has(action.type) && !snapshot.conn.isStaff) return Promise.reject(new Error('forbidden'));
  if (socket?.connected) return emitAction(action);
  // Offline: keep registrations and urgent alerts on the phone and send them later.
  if (PUBLIC_ACTIONS.has(action.type) && action.type !== 'flag.update') {
    const withRef = { ...action, clientRef: action.clientRef || makeRef() };
    setOutbox([...outbox(), { action: withRef, at: Date.now() }]);
    return Promise.resolve({ pending: true, clientRef: withRef.clientRef });
  }
  return Promise.reject(new Error('offline'));
}

// ---------------- public API ----------------

export function dispatch(action) {
  if (snapshot.conn.mode === 'server') {
    const a = action.type === 'register' && !action.clientRef ? { ...action, clientRef: makeRef() } : action;
    return dispatchServer(a);
  }
  return dispatchLocal(action);
}

export async function staffLogin(pin) {
  const p = String(pin || '').trim();
  if (snapshot.conn.mode === 'local') {
    const ok = p === LOCAL_PIN;
    if (ok) {
      pendingPin = p;
      sessionSave(PIN_KEY, p);
      set({ conn: { isStaff: true } });
    }
    return ok;
  }
  if (!socket?.connected) throw new Error('offline');
  const ok = await new Promise((resolve) => {
    socket.timeout(5000).emit('staff:login', p, (err, res) => resolve(!err && res?.ok));
  });
  if (ok) {
    pendingPin = p;
    sessionSave(PIN_KEY, p);
    set({ conn: { isStaff: true } });
  }
  return ok;
}

export function staffLogout() {
  pendingPin = null;
  sessionSave(PIN_KEY, null);
  set({ conn: { isStaff: false } });
  if (socket?.connected) socket.emit('staff:logout');
}

/** Switch between server and local mode (from the demo controls). Reloads the page. */
export function setMode(mode) {
  save(MODE_KEY, mode);
  window.location.reload();
}

async function serverAnswers(url, ms = 2500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/health`, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) return false;
    const j = await res.json();
    return j && j.app === 'opd-saathi';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

let started = false;
export async function startStore() {
  if (started) return;
  started = true;
  const param = new URLSearchParams(window.location.search).get('mode');
  if (param === 'local' || param === 'server' || param === 'auto') save(MODE_KEY, param === 'auto' ? null : param);
  const forced = load(MODE_KEY, null);
  const envUrl = import.meta.env.VITE_SERVER_URL;
  const origin = window.location.origin;

  if (forced === 'local') return startLocal();
  if (envUrl) return startServer(envUrl);
  if (forced === 'server') return startServer(origin);

  // Automatic: use the server if it answers. Remember that, so a phone that later loses
  // its connection stays in server mode (showing the last known state) instead of
  // silently switching to a separate local queue.
  const remembered = load(DETECTED_KEY, null) === origin;
  if (remembered && !navigator.onLine) return startServer(origin);
  if (await serverAnswers(origin)) {
    save(DETECTED_KEY, origin);
    return startServer(origin);
  }
  const isLocalhost = /^(localhost|127\.|\[::1\])/.test(window.location.hostname);
  if (remembered && !isLocalhost) return startServer(origin);
  return startLocal();
}
