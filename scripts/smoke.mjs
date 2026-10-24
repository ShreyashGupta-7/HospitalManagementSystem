// Opens every screen at 360px wide (and at the biggest text size) and reports console
// errors, page errors and anything wider than the screen.
// Usage: node scripts/smoke.mjs [baseUrl]
import { chromium } from 'playwright-core';
import { CHROME } from './chrome-path.mjs';

const BASE = process.argv[2] || 'http://localhost:5173';
const ROUTES = [
  '/', '/language', '/register', '/register?step=1', '/register?step=2', '/register?step=3', '/register?step=4',
  '/register?step=5', '/register?step=6', '/slip', '/have-slip', '/find', '/find?to=opd3', '/find?to=ward4&from=registration',
  '/lost?to=opd3', '/emergency', '/settings', '/turn/MED-001', '/staff', '/board', '/nope',
];

const browser = await chromium.launch({ executablePath: CHROME });
let problems = 0;
for (const [label, settings] of [
  ['normal', { lang: 'en', textSize: 1 }],
  ['hindi-biggest', { lang: 'hi', textSize: 3 }],
  ['tamil-biggest-hc', { lang: 'ta', textSize: 3, highContrast: true }],
]) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((s) => {
    localStorage.setItem('opd.settings', JSON.stringify({ ...s, seenTerms: [] }));
    localStorage.setItem('opd.mode', JSON.stringify('local'));
  }, settings);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  for (const r of ROUTES) {
    errors.length = 0;
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    const wide = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const out = [];
      document.querySelectorAll('body *').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) return;
        // Ignore things inside a sideways-scrolling box (the big floor plan).
        let p = el.parentElement; let scrolls = false;
        while (p) { const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll') { scrolls = true; break; } p = p.parentElement; }
        if (!scrolls && rect.right > w + 1) out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} right=${Math.round(rect.right)}`);
      });
      return { scrollW: document.documentElement.scrollWidth, w, out: out.slice(0, 4) };
    });
    const english = settings.lang !== 'en' ? await page.evaluate(() => {
      // Words that look like leftover English UI text (ignores tokens, numbers, OPD/X-ray terms).
      const text = document.body.innerText;
      const words = text.match(/\b[A-Za-z]{4,}\b/g) || [];
      const allow = /^(OPD|Casualty|CASUALTY|Saathi|SAATHI|City|District|Hospital|Ramesh|Kamla|Room|X-ray|Xray|Sharma|Verma|Meena|Rajesh|Anjali|Sunita|Patel|Imran|Khan|Lakshmi|Iyer|Arvind|Nair|Pooja|Singh|English|Languages|voice)$/;
      return [...new Set(words.filter((w) => !allow.test(w)))].slice(0, 12);
    }) : [];
    const bad = errors.length || wide.scrollW > wide.w + 1 || english.length;
    if (bad) {
      problems += 1;
      console.log(`\n✗ [${label}] ${r}`);
      errors.forEach((e) => console.log('   ', e.slice(0, 300)));
      if (wide.scrollW > wide.w + 1) console.log(`    too wide: ${wide.scrollW}px >`, wide.w, wide.out);
      if (english.length) console.log('    english?', english.join(', '));
    }
  }
  await ctx.close();
}
await browser.close();
console.log(problems ? `\n${problems} screen(s) with problems` : '\nAll screens OK');
process.exit(problems ? 1 : 0);
