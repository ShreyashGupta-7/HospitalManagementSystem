// Saves phone-size screenshots of the main screens to docs/screenshots (for the README and report).
// Usage: node scripts/screens.mjs [baseUrl]   (uses local mode so it needs no server)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { CHROME } from './chrome-path.mjs';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = 'docs/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => {
  localStorage.setItem('opd.mode', '"local"');
});
const page = await ctx.newPage();
const set = (s) => page.evaluate((x) => localStorage.setItem('opd.settings', JSON.stringify({ seenTerms: [], ...x })), s);

// Seed a queue as staff (local mode PIN check happens in the page)
await page.goto(`${BASE}/staff`);
await set({ lang: 'en' });
await page.reload();
await page.getByLabel('Staff PIN').fill('4321');
await page.getByRole('button', { name: 'Unlock' }).click();
await page.getByRole('button', { name: 'Reset everything' }).click();
await page.getByRole('button', { name: 'Tap again to reset' }).click();
await page.getByRole('button', { name: 'Add 20 sample patients' }).click();
await page.waitForTimeout(300);

// Register Kamla for slip/turn screenshots
const reg = await page.evaluate(async () => {
  // eslint-disable-next-line no-undef
  return null;
});
void reg;

const shots = [
  ['01-language', '/', { lang: null }],
  ['02-home-en', '/', { lang: 'en' }],
  ['03-home-hi', '/', { lang: 'hi' }],
  ['04-signs-en', '/register', { lang: 'en' }],
  ['05-dept-cards-ta', '/register?step=5', { lang: 'ta' }],
  ['06-find-route-en', '/find?to=opd3&from=entrance', { lang: 'en', avoidStairs: true }],
  ['07-emergency-hi', '/emergency', { lang: 'hi' }],
  ['08-settings-en', '/settings', { lang: 'en' }],
  ['09-high-contrast', '/', { lang: 'hi', highContrast: true, textSize: 3 }],
];
for (const [name, route, s] of shots) {
  await page.goto(`${BASE}${route}`);
  await set(s);
  await page.reload();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: name.includes('find') || name.includes('cards') });
}

// Slip and turn screens for a fresh registration
await set({ lang: 'en' });
await page.goto(`${BASE}/register?step=1`);
await page.getByLabel('What is the patient\'s first name?').fill('Kamla');
await page.getByRole('button', { name: 'Next' }).click();
await page.getByLabel('How old is the patient?').fill('62');
await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('button', { name: 'Woman' }).click();
await page.getByRole('button', { name: /I don't have a phone/ }).click();
await page.getByRole('button', { name: /^Children/ }).click();
await page.getByRole('button', { name: 'Get my token' }).click();
await page.getByRole('heading', { name: 'Your OPD slip' }).waitFor();
await page.screenshot({ path: `${OUT}/10-slip-en.png`, fullPage: true });
await page.getByRole('link', { name: 'See my turn' }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/11-turn-en.png`, fullPage: false });

// Staff and board at laptop / TV size
await page.setViewportSize({ width: 1366, height: 900 });
await page.goto(`${BASE}/staff`);
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/12-staff.png` });
await page.goto(`${BASE}/board`);
await page.getByRole('button', { name: /Tap to start/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/13-board.png` });

await browser.close();
console.log('screenshots saved to', OUT);
