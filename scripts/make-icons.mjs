// Renders the SVG app icon to PNGs (192 and 512) using the Chrome already on this machine.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { CHROME } from './chrome-path.mjs';

const svg = fs.readFileSync('public/icon-maskable.svg', 'utf8');
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: `public/icon-${size}.png`, omitBackground: false });
}
await browser.close();
console.log('icons written');
