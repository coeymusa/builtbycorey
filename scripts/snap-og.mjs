// Render scripts/og.html offscreen and snap a 1200x630 OG image
// for link-preview cards (Slack, iMessage, Twitter, etc.).
//
// Run with: node scripts/snap-og.mjs

import { chromium } from '../../corey-portfolio/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tpl = pathToFileURL(resolve(here, 'og.html')).href;
const out = resolve(here, '..', 'assets', 'og.jpg');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
await page.goto(tpl, { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({
  path: out,
  type: 'jpeg',
  quality: 90,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});
await browser.close();
console.log('wrote', out);
