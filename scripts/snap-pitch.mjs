// Headless capture of the Saddle Central pitch hero for the
// "evidence plan" preview block on builtbycorey.com.
//
// Run with: node scripts/snap-pitch.mjs
//
// Uses the Playwright install already vendored in the sibling
// `corey-portfolio` workspace, so this folder needs no node_modules.

import { chromium } from '../../corey-portfolio/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '..', 'assets', 'saddle-central-pitch.jpg');
const outDir = dirname(out);
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1800 },
  deviceScaleFactor: 2,
});
await page.goto('https://saddle-central-pitch.vercel.app/', {
  waitUntil: 'networkidle',
  timeout: 30000,
});
// Make sure web fonts have rendered before snapping.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

// Skip the empty top padding above the hero and grab a rectangle that
// includes the title, lede, and the first finding cards.
await page.screenshot({
  path: out,
  type: 'jpeg',
  quality: 86,
  clip: { x: 0, y: 80, width: 1440, height: 1080 },
});
await browser.close();
console.log('wrote', out);
