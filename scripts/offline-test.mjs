// Tests the production build served by the Node server:
//  - patients can't do staff actions; wrong PIN is refused
//  - when the server goes away the phone keeps the last known state with a "last updated" line
//  - a registration made offline is kept on the phone and confirmed when the server is back
//  - the app (and the saved slip) open with no connection, from the PWA cache
// Run "npm run build" first. Usage: node scripts/offline-test.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { io } from 'socket.io-client';
import { CHROME } from './chrome-path.mjs';
import en from '../src/i18n/en.js';

const PORT = 3099;
const BASE = `http://localhost:${PORT}`;
const STATE = path.join(os.tmpdir(), `opd-test-${Date.now()}.json`);
let server = null;
let n = 0;
const ok = (m) => console.log(`  ✓ ${++n}. ${m}`);
const fail = (m) => {
  console.log(`  ✗ ${m}`);
  process.exitCode = 1;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer() {
  server = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(PORT), STATE_FILE: STATE }, stdio: 'pipe' });
  for (let i = 0; i < 50; i += 1) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(100);
  }
  throw new Error('server did not start');
}
function stopServer() {
  return new Promise((res) => {
    server.once('exit', res);
    server.kill();
  });
}

await startServer();
ok('production server started and serves /api/health');

// ---- permissions, straight to the socket like a curious patient would ----
const sock = io(BASE, { transports: ['websocket'] });
await new Promise((r) => sock.on('connect', r));
const first = await new Promise((r) => sock.once('state', r));
if (first.staff || JSON.stringify(first.state).includes('firstName')) fail('patient socket got staff data');
else ok('a patient connection gets the public view only (no names)');
const call = await sock.timeout(3000).emitWithAck('action', { type: 'callNext', room: 'opd1' });
if (call.error === 'forbidden') ok('patient cannot "call next" (forbidden)');
else fail(`callNext without PIN was allowed: ${JSON.stringify(call)}`);
const reset = await sock.timeout(3000).emitWithAck('action', { type: 'demo.reset' });
if (reset.error === 'forbidden') ok('patient cannot reset the queues (forbidden)');
else fail('reset without PIN was allowed');
const bad = await sock.timeout(3000).emitWithAck('staff:login', '0000');
if (!bad.ok) ok('wrong staff PIN is refused');
else fail('wrong PIN accepted');
const flag = await sock.timeout(3000).emitWithAck('action', { type: 'flag.raise', who: 'patient' });
if (flag.result?.id) ok('a patient CAN raise an urgent flag');
else fail('patient could not raise a flag');
sock.close();

// ---- the phone ----
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 360, height: 760 }, serviceWorkers: 'allow' });
const errors = [];
const phone = await ctx.newPage();
phone.on('pageerror', (e) => errors.push(e.message));
await phone.addInitScript(() => {
  if (!localStorage.getItem('opd.settings')) localStorage.setItem('opd.settings', JSON.stringify({ lang: 'en', seenTerms: [] }));
});
await phone.goto(BASE);
await phone.getByRole('heading', { name: en.home.welcome }).waitFor();
// Wait for the service worker to take control, so the app is cached.
await phone.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  return Boolean(reg.active);
});
await phone.reload();
await phone.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 15000 });
ok('service worker installed and controls the page (app cached)');

async function register(name) {
  await phone.goto(`${BASE}/register`);
  await phone.getByRole('button', { name: en.reg.noneStart }).click();
  await phone.getByLabel(en.reg.nameQ).fill(name);
  await phone.getByRole('button', { name: en.common.next }).click();
  await phone.getByLabel(en.reg.ageQ).fill('62');
  await phone.getByRole('button', { name: en.common.next }).click();
  await phone.getByRole('button', { name: en.reg.female }).click();
  await phone.getByRole('button', { name: new RegExp(en.reg.noPhone) }).click();
  await phone.getByRole('button', { name: /General Medicine/ }).click();
  await phone.getByRole('button', { name: en.reg.submit }).click();
}

await register('Kamla');
await phone.getByRole('heading', { name: en.slip.title }).waitFor();
const token = (await phone.locator('[data-token]').innerText()).trim();
ok(`registered online, token ${token}`);
await phone.goto(`${BASE}/turn/${token}`);
await phone.getByRole('heading', { name: en.turn.title }).waitFor();

// ---- server goes away ----
await stopServer();
await phone.getByText(/No connection\. Your place in the line may be out of date/).waitFor({ timeout: 15000 });
const line = await phone.getByText(/Last updated/).first().innerText();
ok(`server down: phone keeps the last position and says "${line.slice(0, 90)}…"`);
if ((await phone.getByText(token).count()) === 0) fail('token vanished while offline');
else ok('token and queue position still shown while offline');

// ---- register while offline ----
await ctx.setOffline(true);
await register('Ramu');
await phone.getByText(en.slip.pendingTitle).first().waitFor();
await phone.screenshot({ path: 'test-results/offline-pending.png', fullPage: true });
ok('offline registration saved on the phone, slip says "Waiting to be confirmed"');

// ---- the app opens with no connection ----
await phone.goto(`${BASE}/slip/${token}`).catch(() => {});
await phone.getByRole('heading', { name: en.slip.title }).waitFor({ timeout: 8000 });
ok('with no connection, the app and the saved slip still open (from the cache)');
await phone.goto(`${BASE}/find?to=opd3`).catch(() => {});
await phone.getByText(/is the first door on your|is on your/).first().waitFor({ timeout: 8000 });
ok('with no connection, floor plans and directions still work');

// ---- connection back ----
await ctx.setOffline(false);
await startServer();
await phone.goto(`${BASE}/`);
const confirmed = await phone.waitForFunction(() => {
  const v = JSON.parse(localStorage.getItem('opd.visits') || '[]');
  return v.find((x) => x.firstName === 'Ramu' && x.token)?.token;
}, null, { timeout: 15000 }).then((h) => h.jsonValue()).catch(() => null);
if (confirmed) ok(`connection back: offline registration sent and confirmed as ${confirmed}`);
else fail('offline registration was not confirmed after reconnecting');
const r = await fetch(`${BASE}/api/public`).then((x) => x.json());
if (confirmed && r.state.patients[confirmed]) ok('server has the offline registration in its queue');
else fail('server does not have the offline registration');
const dupes = Object.values(r.state.patients).length;
if (dupes === 2) ok('no duplicates (2 patients on the server)');
else fail(`expected 2 patients on the server, found ${dupes}`);

await browser.close();
await stopServer();
fs.rmSync(STATE, { force: true });
if (errors.length) {
  console.log('page errors:', errors);
  process.exitCode = 1;
}
console.log(process.exitCode ? '\nOFFLINE TEST FAILED' : '\nOFFLINE TEST PASSED');
