// The patient's own tokens, kept only on their phone. Lets the slip and "My turn" open
// with no connection, and holds offline registrations until the server confirms them.
import { useSyncExternalStore } from 'react';
import { load, save } from '../lib/storage.js';
import { onStoreEvent } from './store.js';

const KEY = 'opd.visits';
const listeners = new Set();
let visits = load(KEY, []);

function commit(next) {
  visits = next;
  save(KEY, visits);
  listeners.forEach((fn) => fn());
}

export function addVisit(v) {
  commit([{ ...v, at: Date.now() }, ...visits.filter((x) => x.ref !== v.ref || !v.ref)].slice(0, 10));
}

export function updateVisit(match, patch) {
  commit(visits.map((v) => (match(v) ? { ...v, ...patch } : v)));
}

export function forgetVisits() {
  commit([]);
}

export function currentVisit() {
  return visits[0] || null;
}

export function visitByToken(token) {
  return visits.find((v) => v.token === token) || null;
}

export function visitByRef(ref) {
  return visits.find((v) => v.ref === ref) || null;
}

export function useVisits() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => visits,
  );
}

// When an offline registration reaches the server, give the slip its real token.
onStoreEvent('confirmed', ({ clientRef, type, result }) => {
  if (type === 'register' && result?.token) {
    updateVisit((v) => v.ref === clientRef, { token: result.token, pending: false, confirmedAt: Date.now() });
  }
});

// Another tab registered or confirmed something.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    visits = load(KEY, []);
    listeners.forEach((fn) => fn());
  }
});
