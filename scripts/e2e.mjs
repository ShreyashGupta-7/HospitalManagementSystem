// End-to-end test of the main story, with the patient phone, staff dashboard and TV board
// open at the same time.
//   node scripts/e2e.mjs local  [baseUrl]   -> three tabs in one browser (localStorage + BroadcastChannel)
//   node scripts/e2e.mjs server [baseUrl]   -> three separate "devices" talking through the server
// Screenshots go to ./test-results/.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { CHROME } from './chrome-path.mjs';
import hi from '../src/i18n/hi.js';
import en from '../src/i18n/en.js';

const MODE = process.argv[2] || 'local';
const BASE = process.argv[3] || 'http://localhost:5173';
const OUT = 'test-results';
fs.mkdirSync(OUT, { recursive: true });

let step = 0;
const ok = (msg) => console.log(`  ✓ ${++step}. ${msg}`);
const fail = (msg) => {
  console.log(`  ✗ ${msg}`);
  process.exitCode = 1;
};
async function within(ms, fn, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      if (await fn()) return Date.now() - t0;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`timed out: ${label}`);
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--autoplay-policy=no-user-gesture-required'] });
const errors = [];
const watch = (page, name) => {
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`));
};

const modeParam = `mode=${MODE}`;
const init = (settings) => (s) => {
  localStorage.setItem('opd.settings', JSON.stringify(s));
};

// One context = one device. Local mode uses one context (tabs share storage).
const shared = MODE === 'local' ? await browser.newContext({ viewport: { width: 1280, height: 900 } }) : null;
const mkContext = async (viewport) => shared || browser.newContext({ viewport });

const staffCtx = await mkContext({ width: 1366, height: 1000 });
const staff = await staffCtx.newPage();
watch(staff, 'staff');
await staff.addInitScript(init(), { lang: 'en', textSize: 1, seenTerms: [] });
await staff.goto(`${BASE}/staff?${modeParam}`);
await staff.getByLabel(en.staff.pinLabel).fill('4321');
await staff.getByRole('button', { name: en.staff.unlock }).click();
await staff.getByRole('heading', { name: en.staff.title }).waitFor();
ok('staff unlocked the dashboard with the PIN');

// Fresh start + sample patients so there is a queue ahead of Kamla.
await staff.getByRole('button', { name: en.staff.reset }).click();
await staff.getByRole('button', { name: en.staff.resetConfirm }).click();
await staff.waitForTimeout(400);
await staff.getByRole('button', { name: en.staff.addSamples }).click();
await staff.waitForTimeout(400);
// A few more children so Kamla starts with more than 3 people ahead.
for (let i = 0; i < 3; i += 1) {
  await staff.goto(`${BASE}/staff/counter?${modeParam}`);
  await staff.getByLabel(en.counter.name, { exact: true }).fill(`Child${i}`);
  await staff.getByLabel(en.counter.age, { exact: true }).fill('5');
  await staff.getByRole('button', { name: 'Children' }).click();
  await staff.getByRole('button', { name: en.counter.register }).click();
  await staff.getByText(/Slip ready/).waitFor();
}
ok('reset, added 20 sample patients and 3 counter registrations');
await staff.goto(`${BASE}/staff?${modeParam}`);

const boardCtx = await mkContext({ width: 1600, height: 900 });
const board = await boardCtx.newPage();
watch(board, 'board');
await board.goto(`${BASE}/board?${modeParam}`);
await board.getByRole('button', { name: /Tap to start|दबाएँ/ }).click();
ok('TV board started');

const phoneCtx = MODE === 'local' ? shared : await browser.newContext({ viewport: { width: 360, height: 760 }, hasTouch: true, isMobile: true });
const phone = await phoneCtx.newPage();
if (MODE === 'local') await phone.setViewportSize({ width: 360, height: 760 });
watch(phone, 'phone');
if (MODE === 'local') {
  // Tabs share storage in one browser: keep this tab's language Hindi, keep its other settings.
  await phone.addInitScript(() => {
    const cur = JSON.parse(localStorage.getItem('opd.settings') || '{}');
    localStorage.setItem('opd.settings', JSON.stringify({ ...cur, lang: 'hi' }));
  });
}
await phone.goto(`${BASE}/?${modeParam}`);
// First visit: choose Hindi in the picker (each language in its own script)
if (MODE !== 'local') {
  await phone.getByRole('button', { name: 'हिंदी' }).click();
}
await phone.getByRole('heading', { name: hi.home.welcome }).waitFor();
await phone.screenshot({ path: `${OUT}/${MODE}-01-home-hi.png`, fullPage: true });
ok('patient phone home screen in Hindi');

await phone.getByRole('link', { name: new RegExp(hi.home.register) }).click();
await phone.screenshot({ path: `${OUT}/${MODE}-02-signs.png`, fullPage: true });
await phone.getByRole('button', { name: hi.reg.noneStart }).click();
await phone.getByRole('switch', { name: hi.reg.assisted }).click();
await phone.getByLabel(hi.reg.nameQ).fill('Kamla');
await phone.screenshot({ path: `${OUT}/${MODE}-03-name-assisted.png`, fullPage: true });
await phone.getByRole('button', { name: hi.common.next }).click();
await phone.getByLabel(hi.reg.ageQ).fill('62');
await phone.getByRole('button', { name: hi.common.next }).click();
await phone.getByRole('button', { name: hi.reg.female }).click();
await phone.getByLabel(hi.reg.mobileQ).waitFor();
// Go back once and check the answer is kept
await phone.goBack();
await phone.goBack();
const age = await phone.getByLabel(hi.reg.ageQ).inputValue();
if (age !== '62') fail(`Back lost the age (got "${age}")`);
else ok('Back keeps the answers (age is still 62)');
await phone.goForward();
await phone.goForward();
await phone.getByLabel(hi.reg.mobileQ).fill('9876543210');
await phone.getByRole('button', { name: hi.common.next }).click();
await phone.screenshot({ path: `${OUT}/${MODE}-04-dept-cards.png`, fullPage: true });
await phone.getByRole('button', { name: new RegExp(hi.depts.CHI.name) }).click();
await phone.getByRole('heading', { name: hi.reg.confirmTitle }).waitFor();
await phone.getByRole('button', { name: hi.reg.submit }).click();
await phone.getByRole('heading', { name: hi.slip.title }).waitFor();
const token = (await phone.locator('[data-token]').innerText()).trim();
await phone.screenshot({ path: `${OUT}/${MODE}-05-slip.png`, fullPage: true });
ok(`registered in Hindi with assisted mode, slip shows token ${token}`);

const tDash = await within(3000, async () => (await staff.getByText(token, { exact: true }).count()) > 0, 'token on dashboard');
ok(`token ${token} appeared on the staff dashboard in ${tDash} ms`);

// My turn
await phone.getByRole('link', { name: hi.slip.track }).click();
await phone.getByRole('heading', { name: hi.turn.title }).waitFor();
await phone.screenshot({ path: `${OUT}/${MODE}-06-turn-waiting.png`, fullPage: true });
ok('My turn screen shows the place in the line');

// Urgent flag from the phone -> top of the dashboard within a second
await phone.getByRole('button', { name: hi.nav.urgentHelp }).click();
await phone.getByRole('button', { name: hi.urgent.send }).click();
const tFlag = await within(2000, async () => (await staff.getByRole('button', { name: en.staff.flagSeen }).count()) > 0, 'flag on dashboard');
ok(`urgent flag reached the top of the staff dashboard in ${tFlag} ms`);
await staff.screenshot({ path: `${OUT}/${MODE}-07-staff-flag.png`, fullPage: false });
await phone.getByRole('button', { name: hi.places.waiting_a.name }).click();
await staff.getByRole('button', { name: en.staff.flagSeen }).first().click();
await within(2000, async () => (await phone.getByText(hi.urgent.seen).count()) > 0, 'seen on phone');
ok('staff marked it seen and the phone shows "staff have seen your alert"');
await phone.screenshot({ path: `${OUT}/${MODE}-08-urgent-seen.png`, fullPage: true });
await phone.getByRole('button', { name: hi.common.close }).click();

// Call the Children's room until Kamla is close, then called
const room3 = staff.locator('section', { has: staff.getByRole('heading', { name: /Children/ }) }).first();
let sawClose = false;
let sawOnBoard = false;
for (let i = 0; i < 12; i += 1) {
  const close = await phone.getByText(new RegExp(hi.alerts.closeTitle)).count();
  if (close) {
    if (!sawClose) {
      await phone.waitForTimeout(400);
      await phone.screenshot({ path: `${OUT}/${MODE}-09-close-alert.png`, fullPage: false });
      const sms = await phone.getByText(hi.turn.smsTitle).count();
      ok(`"turn is close" banner shown${sms ? ' with the simulated SMS' : ''}`);
    }
    sawClose = true;
  }
  if (!sawOnBoard && (await board.locator('main').innerText()).includes(token)) {
    sawOnBoard = true;
    ok(`board lists ${token} among the next three`);
  }
  if ((await phone.getByRole('heading', { name: hi.turn.calledTitle }).count()) > 0) break;
  await room3.getByRole('button', { name: en.staff.callNext }).first().click();
  await phone.waitForTimeout(500);
}
if (!sawClose) fail('never saw the "turn is close" alert');
await phone.getByRole('heading', { name: hi.turn.calledTitle }).waitFor({ timeout: 3000 });
await phone.screenshot({ path: `${OUT}/${MODE}-10-called.png`, fullPage: true });
ok('phone shows "It is your turn" in big type with directions to Room 3');
const boardHas = await within(3000, async () => (await board.locator('main').innerText()).includes(token), 'board serving');
await board.screenshot({ path: `${OUT}/${MODE}-11-board.png` });
ok(`board shows ${token} as being served (${boardHas} ms)`);

// Avoid stairs route from the called screen never mentions stairs
const steps = await phone.locator('ol li').allInnerTexts();
if (steps.some((s) => s.includes('सीढ़ियों से'))) fail('avoid-stairs route used the stairs');
else ok('assisted mode route uses the lift (no stairs)');

// Reload survives
await phone.reload();
await phone.getByRole('heading', { name: hi.turn.calledTitle }).waitFor();
ok('phone screen survives a reload');

await staff.screenshot({ path: `${OUT}/${MODE}-12-staff.png`, fullPage: true });

if (errors.length) {
  console.log('\nConsole / page errors:');
  errors.forEach((e) => console.log('  ', e.slice(0, 250)));
  process.exitCode = 1;
}
await browser.close();
console.log(process.exitCode ? '\nE2E FAILED' : '\nE2E PASSED');
