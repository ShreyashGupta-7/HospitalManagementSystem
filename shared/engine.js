// OPD Saathi queue engine.
//
// This one file is used by BOTH the Node server and the browser (local mode), so the
// rules for tokens, positions and waiting times can never disagree between them.
// It has no dependencies and never touches the network or storage.
//
// Time: the hospital runs on its own clock ("hospital minutes since midnight") so the
// demo can be sped up 10x and every device shows the same time, whatever its time zone.

import { DEPARTMENTS, DEPT_BY_ID, ROOM_TO_DEPT, ALL_ROOMS, WAITING_AREAS } from '../src/data/departments.js';
import { SAMPLE_PATIENTS } from '../src/data/patients.js';

export const ENGINE_VERSION = 3;
const LAST_N = 10; // consultations used for the average
const MAX_LOG = 25;

// Actions anyone may send. Everything else needs staff rights.
export const PUBLIC_ACTIONS = new Set(['register', 'flag.raise', 'flag.update']);
export const STAFF_ACTIONS = new Set([
  'callNext', 'recall', 'noShow', 'toEnd', 'move', 'setDoctor', 'flag.seen', 'counterRegister',
  'demo.addSamples', 'demo.speed', 'demo.auto', 'demo.reset', 'finish',
]);

// ---------- clock ----------

function istMinutesNow(realNow) {
  const d = new Date(realNow);
  return (d.getUTCHours() * 60 + d.getUTCMinutes() + 330) % 1440; // India is UTC+5:30
}

export function startMinutes(realNow) {
  const m = istMinutesNow(realNow);
  return m >= 9 * 60 && m <= 13 * 60 + 30 ? m : 9 * 60 + 30;
}

/** Hospital time in minutes since midnight (can have decimals). */
export function simNow(state, realNow = Date.now()) {
  const c = state.clock;
  return c.baseMin + ((realNow - c.baseReal) / 60000) * c.speed;
}

export function fmtClock(min) {
  const m = Math.floor(min) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function parseClock(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// ---------- state ----------

export function createInitialState(realNow = Date.now()) {
  const rooms = {};
  const serving = {};
  for (const r of ALL_ROOMS) {
    rooms[r.id] = { status: 'available', until: null, lateMin: 0 };
    serving[r.id] = null;
  }
  const queues = {};
  const counters = {};
  const consults = {};
  for (const d of DEPARTMENTS) {
    queues[d.id] = [];
    counters[d.id] = 0;
    consults[d.id] = [];
  }
  return {
    engine: ENGINE_VERSION,
    rev: 1,
    updatedAt: realNow,
    clock: { baseReal: realNow, baseMin: startMinutes(realNow), speed: 1 },
    auto: false,
    seq: 0,
    counters,
    patients: {},
    queues,
    serving,
    rooms,
    consults,
    flags: [],
    log: [],
    refs: {}, // clientRef -> token, so an offline registration sent twice is only added once
  };
}

const clone = (x) => (typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x)));

// ---------- helpers ----------

export function avgConsult(state, dept) {
  const list = state.consults[dept] || [];
  if (!list.length) return DEPT_BY_ID[dept]?.avgConsult || 6;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

/** How late a room is, in hospital minutes, right now. */
export function roomDelay(state, roomId, now) {
  const r = state.rooms[roomId];
  if (!r) return 0;
  if (r.status === 'late') return Math.max(0, r.lateMin || 0);
  if (r.status === 'break' && r.until != null) return Math.max(0, r.until - now);
  return 0;
}

/** The status patients see: an expired break counts as available. */
export function roomStatus(state, roomId, now) {
  const r = state.rooms[roomId];
  if (!r) return { status: 'available' };
  if (r.status === 'break' && (r.until == null || r.until <= now)) return { status: 'available' };
  return r;
}

export function roundTo5(min) {
  if (min <= 0) return 0;
  return Math.max(5, Math.round(min / 5) * 5);
}

/**
 * Estimated wait = people ahead x average of the last 10 consultations, shared by the
 * doctors who are seeing patients, plus the doctor's delay. Rounded to 5 minutes.
 */
export function estimateWait(state, dept, ahead, now) {
  const d = DEPT_BY_ID[dept];
  if (!d) return 0;
  const avg = avgConsult(state, dept);
  const roomIds = d.rooms.map((r) => r.id);
  const working = roomIds.filter((id) => roomStatus(state, id, now).status !== 'break').length || roomIds.length;
  const delay = Math.min(...roomIds.map((id) => roomDelay(state, id, now)));
  return roundTo5((ahead * avg) / working + delay);
}

export function deptStats(state, dept, now) {
  const d = DEPT_BY_ID[dept];
  const q = state.queues[dept] || [];
  const served = Object.values(state.patients).filter((p) => p.dept === dept && p.calledAt != null && p.status !== 'moved');
  const waits = served.map((p) => p.calledAt - p.createdAt).filter((x) => x >= 0);
  const avgActualWait = waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : null;
  return {
    dept,
    waiting: q.length,
    next: q.slice(0, 3),
    rooms: d.rooms.map((r) => ({
      id: r.id,
      serving: state.serving[r.id],
      ...roomStatus(state, r.id, now),
      delay: Math.round(roomDelay(state, r.id, now)),
    })),
    avgConsult: avgConsult(state, dept),
    newArrivalWait: estimateWait(state, dept, q.length, now),
    avgActualWait: avgActualWait == null ? null : roundTo5(avgActualWait),
    seenToday: served.filter((p) => p.status === 'done' || p.status === 'called').length,
  };
}

/** Everything a patient screen needs to know about one token. */
export function patientInfo(state, token, now) {
  let p = state.patients[token];
  let hops = 0;
  while (p && p.status === 'moved' && p.movedTo && hops < 5) {
    p = state.patients[p.movedTo];
    hops += 1;
  }
  if (!p) return null;
  const q = state.queues[p.dept] || [];
  const ahead = p.status === 'waiting' ? Math.max(0, q.indexOf(p.token)) : 0;
  const d = DEPT_BY_ID[p.dept];
  return {
    token: p.token,
    originalToken: token,
    moved: p.token !== token,
    dept: p.dept,
    status: p.status,
    room: p.room || d.rooms[0].id,
    assignedRoom: p.room,
    rooms: d.rooms.map((r) => r.id),
    ahead,
    waitMin: p.status === 'waiting' ? estimateWait(state, p.dept, ahead, now) : 0,
    nowServing: d.rooms.map((r) => ({ room: r.id, token: state.serving[r.id] })),
    doctors: d.rooms.map((r) => ({ room: r.id, ...roomStatus(state, r.id, now), delay: Math.round(roomDelay(state, r.id, now)) })),
    calledAt: p.calledAt,
    createdAt: p.createdAt,
  };
}

export function crowding(state) {
  return WAITING_AREAS.map((a) => {
    const waiting = a.depts.reduce((n, d) => n + (state.queues[d]?.length || 0), 0);
    const ratio = waiting / a.seats;
    const level = ratio >= 0.9 ? 'crowded' : ratio >= 0.6 ? 'busy' : 'calm';
    return { ...a, waiting, ratio, level };
  });
}

/** What patient phones and the TV board receive: no names, ages or phone numbers. */
export function publicView(state) {
  const patients = {};
  for (const [k, p] of Object.entries(state.patients)) {
    patients[k] = {
      token: p.token, dept: p.dept, status: p.status, room: p.room, order: p.order,
      movedTo: p.movedTo, createdAt: p.createdAt, calledAt: p.calledAt, doneAt: p.doneAt,
    };
  }
  return {
    ...state,
    patients,
    refs: {},
    flags: state.flags.map((f) => ({ id: f.id, seen: f.seen, at: f.at })),
    public: true,
  };
}

// ---------- reducer ----------

function sanitiseText(s, max = 40) {
  return String(s ?? '').replace(/[<>]/g, '').trim().slice(0, max);
}

function addLog(s, entry, realNow) {
  s.log.push({ id: `${realNow}-${Math.floor(Math.random() * 1e6)}`, at: realNow, ...entry });
  if (s.log.length > MAX_LOG) s.log = s.log.slice(-MAX_LOG);
}

function newToken(s, dept) {
  s.counters[dept] = (s.counters[dept] || 0) + 1;
  return `${dept}-${String(s.counters[dept]).padStart(3, '0')}`;
}

function insertByOrder(s, dept, token) {
  const q = s.queues[dept];
  const order = s.patients[token].order;
  const idx = q.findIndex((t) => (s.patients[t]?.order ?? 0) > order);
  if (idx === -1) q.push(token);
  else q.splice(idx, 0, token);
}

function removeFromQueue(s, token) {
  const p = s.patients[token];
  if (!p) return;
  s.queues[p.dept] = (s.queues[p.dept] || []).filter((t) => t !== token);
  for (const [room, t] of Object.entries(s.serving)) if (t === token) s.serving[room] = null;
}

function doRegister(s, a, now) {
  const dept = DEPT_BY_ID[a.dept] ? a.dept : null;
  if (!dept) throw new Error('bad-dept');
  const firstName = sanitiseText(a.firstName, 30) || 'Patient';
  if (a.clientRef && s.refs[a.clientRef]) return { token: s.refs[a.clientRef], duplicate: true };
  const token = newToken(s, dept);
  s.seq += 1;
  const age = Number.isFinite(Number(a.age)) ? Math.max(0, Math.min(120, Math.round(Number(a.age)))) : null;
  s.patients[token] = {
    token, dept, firstName, age,
    gender: ['female', 'male', 'other'].includes(a.gender) ? a.gender : null,
    mobile: a.mobile ? sanitiseText(a.mobile, 10).replace(/\D/g, '') : null,
    lang: sanitiseText(a.lang, 5) || 'en',
    assisted: Boolean(a.assisted),
    source: a.source || 'self',
    status: 'waiting',
    order: s.seq,
    createdAt: now,
    calledAt: null,
    doneAt: null,
    room: null,
  };
  s.queues[dept].push(token);
  if (a.clientRef) s.refs[a.clientRef] = token;
  return { token };
}

function finishServing(s, room, now) {
  const cur = s.serving[room];
  if (!cur) return;
  const p = s.patients[cur];
  if (p && p.status === 'called') {
    p.status = 'done';
    p.doneAt = now;
    const dur = Math.min(60, Math.max(1, now - (p.calledAt ?? now)));
    const list = s.consults[p.dept] || (s.consults[p.dept] = []);
    list.push(Math.round(dur * 10) / 10);
    if (list.length > LAST_N) list.splice(0, list.length - LAST_N);
  }
  s.serving[room] = null;
}

function doCallNext(s, room, now, realNow, random) {
  const dept = ROOM_TO_DEPT[room];
  if (!dept) throw new Error('bad-room');
  finishServing(s, room, now);
  const next = s.queues[dept].shift();
  if (!next) return { token: null };
  const p = s.patients[next];
  p.status = 'called';
  p.room = room;
  p.calledAt = now;
  // How long this simulated consultation will take (only used when the demo runs by itself).
  const avg = DEPT_BY_ID[dept].avgConsult;
  p.plannedMin = Math.round(avg * (0.6 + random() * 0.8) * 10) / 10;
  s.serving[room] = next;
  addLog(s, { type: 'called', token: next, room }, realNow);
  return { token: next };
}

export function reduce(prev, action, ctx = {}) {
  const realNow = ctx.realNow ?? Date.now();
  const random = ctx.random ?? Math.random;
  const s = clone(prev);
  const now = simNow(s, realNow);
  let result = { ok: true };

  switch (action.type) {
    case 'register':
    case 'counterRegister':
      result = doRegister(s, { ...action, source: action.type === 'counterRegister' ? 'counter' : action.source }, now);
      break;

    case 'callNext':
      result = doCallNext(s, action.room, now, realNow, random);
      break;

    case 'finish': // doctor finished with the current patient but nobody is called yet
      finishServing(s, action.room, now);
      break;

    case 'recall': {
      const t = s.serving[action.room];
      if (t) addLog(s, { type: 'called', token: t, room: action.room, again: true }, realNow);
      break;
    }

    case 'noShow': {
      const p = s.patients[action.token];
      if (!p) throw new Error('no-token');
      removeFromQueue(s, p.token);
      p.status = 'noshow';
      p.doneAt = now;
      break;
    }

    case 'toEnd': {
      const p = s.patients[action.token];
      if (!p) throw new Error('no-token');
      removeFromQueue(s, p.token);
      p.status = 'waiting';
      p.room = null;
      p.calledAt = null;
      s.seq += 1;
      p.order = s.seq;
      s.queues[p.dept].push(p.token);
      break;
    }

    case 'move': {
      const p = s.patients[action.token];
      if (!p || !DEPT_BY_ID[action.dept] || action.dept === p.dept) throw new Error('bad-move');
      removeFromQueue(s, p.token);
      const token = newToken(s, action.dept);
      s.patients[token] = { ...p, token, dept: action.dept, status: 'waiting', room: null, calledAt: null, movedFrom: p.token };
      p.status = 'moved';
      p.movedTo = token;
      insertByOrder(s, action.dept, token); // keeps their place by arrival time, so they don't lose their wait
      result = { token };
      break;
    }

    case 'setDoctor': {
      const r = s.rooms[action.room];
      if (!r) throw new Error('bad-room');
      r.status = ['available', 'break', 'late'].includes(action.status) ? action.status : 'available';
      r.until = r.status === 'break' ? parseClock(action.until) ?? Math.round(now + 15) : null;
      r.lateMin = r.status === 'late' ? Math.max(0, Math.min(180, Number(action.lateMin) || 0)) : 0;
      addLog(s, { type: 'doctor', room: action.room, status: r.status, until: r.until, lateMin: r.lateMin }, realNow);
      break;
    }

    case 'flag.raise': {
      const id = `F${realNow.toString(36)}${Math.floor(random() * 1e4)}`;
      s.flags.unshift({
        id, at: realNow, simAt: now, seen: false, seenAt: null,
        token: action.token ? sanitiseText(action.token, 10) : null,
        where: action.where ? sanitiseText(action.where, 20) : null,
        who: action.who === 'helper' ? 'helper' : 'patient',
        note: sanitiseText(action.note, 80) || null,
        lang: sanitiseText(action.lang, 5) || 'en',
      });
      s.flags = s.flags.slice(0, 50);
      result = { id };
      break;
    }

    case 'flag.update': { // the patient adds where they are, after sending the alert
      const f = s.flags.find((x) => x.id === action.id);
      if (f && !f.seen) {
        if (action.where) f.where = sanitiseText(action.where, 20);
        if (action.who) f.who = action.who === 'helper' ? 'helper' : 'patient';
      }
      break;
    }

    case 'flag.seen': {
      const f = s.flags.find((x) => x.id === action.id);
      if (f) { f.seen = true; f.seenAt = realNow; }
      break;
    }

    case 'demo.addSamples': {
      const n = Math.min(40, Math.max(1, Number(action.count) || 20));
      const shuffled = [...SAMPLE_PATIENTS].sort(() => random() - 0.5);
      for (let i = 0; i < n; i += 1) {
        const sp = shuffled[i % shuffled.length];
        doRegister(s, { ...sp, source: 'sample' }, now - (n - i) * 0.5);
      }
      // Start every free room so "now serving" isn't empty.
      for (const r of ALL_ROOMS) {
        if (!s.serving[r.id] && s.queues[r.dept].length) doCallNext(s, r.id, now, realNow, random);
      }
      break;
    }

    case 'demo.speed': {
      const speed = [1, 10, 30].includes(Number(action.speed)) ? Number(action.speed) : 1;
      s.clock = { baseReal: realNow, baseMin: now, speed };
      break;
    }

    case 'demo.auto':
      s.auto = Boolean(action.on);
      break;

    case 'demo.reset':
      return { state: { ...createInitialState(realNow), rev: prev.rev + 1 }, result };

    default:
      throw new Error('unknown-action');
  }

  s.rev = prev.rev + 1;
  s.updatedAt = realNow;
  return { state: s, result };
}

/**
 * Called about once a second by whoever runs the clock (the server, or one browser tab
 * in local mode). Ends doctors' breaks on time and, when the demo is set to run by
 * itself, moves the queues along. Returns null if nothing changed.
 */
export function tick(prev, ctx = {}) {
  const realNow = ctx.realNow ?? Date.now();
  const random = ctx.random ?? Math.random;
  const now = simNow(prev, realNow);
  let s = null;
  const edit = () => (s || (s = clone(prev)));

  for (const r of ALL_ROOMS) {
    const room = prev.rooms[r.id];
    if (room.status === 'break' && room.until != null && room.until <= now) {
      Object.assign(edit().rooms[r.id], { status: 'available', until: null });
      addLog(edit(), { type: 'doctor', room: r.id, status: 'available' }, realNow);
    }
  }

  if (prev.auto) {
    for (const r of ALL_ROOMS) {
      const cur = s || prev;
      if (roomStatus(cur, r.id, now).status === 'break') continue;
      const servingTok = cur.serving[r.id];
      const lateBy = cur.rooms[r.id].status === 'late' ? cur.rooms[r.id].lateMin * 0.3 : 0;
      if (servingTok) {
        const p = cur.patients[servingTok];
        if (p && now - p.calledAt >= (p.plannedMin || 6) + lateBy) doCallNext(edit(), r.id, now, realNow, random);
      } else if (cur.queues[r.dept].length) {
        doCallNext(edit(), r.id, now, realNow, random);
      }
    }
  }

  if (!s) return null;
  s.rev = prev.rev + 1;
  s.updatedAt = realNow;
  return s;
}

/** Makes sure a state loaded from storage/disk has every field (older saves, new rooms). */
export function normaliseState(raw, realNow = Date.now()) {
  if (!raw || raw.engine !== ENGINE_VERSION) return createInitialState(realNow);
  const base = createInitialState(realNow);
  return {
    ...base,
    ...raw,
    counters: { ...base.counters, ...raw.counters },
    queues: { ...base.queues, ...raw.queues },
    serving: { ...base.serving, ...raw.serving },
    rooms: { ...base.rooms, ...raw.rooms },
    consults: { ...base.consults, ...raw.consults },
    refs: raw.refs || {},
  };
}
