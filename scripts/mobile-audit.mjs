// Render builtbycorey.com at mobile width, scroll through it,
// and save section screenshots so we can spot layout breakage.

import { chromium } from '../../corey-portfolio/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', '.tmp', 'mobile-audit');
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: '01-hero',       at: 0 },
  { name: '02-trust',      sel: '.trust' },
  { name: '03-now',        sel: '.now-card' },
  { name: '04-ticker',     sel: '.ticker' },
  { name: '05-offers',     sel: '#offer' },
  { name: '06-work',       sel: '#work' },
  { name: '07-pitch',      sel: '#pitch' },
  { name: '08-principles', sel: '#process' },
  { name: '09-decline',    sel: '.decline' },
  { name: '10-places',     sel: '#places' },
  { name: '11-ask',        sel: '#ask' },
  { name: '12-about',      sel: '#about' },
  { name: '13-faq',        sel: '#faq' },
  { name: '14-cta',        sel: '#contact' },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 800 },
  deviceScaleFactor: 2,
  isMobile: true,
});
await page.goto('https://builtbycorey.com/?audit=' + Date.now(), {
  waitUntil: 'networkidle',
  timeout: 30000,
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

for (const t of targets) {
  if (t.sel) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, t.sel);
    await page.waitForTimeout(300);
  } else {
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  const out = resolve(outDir, `${t.name}.jpg`);
  await page.screenshot({ path: out, type: 'jpeg', quality: 80, fullPage: false });
  console.log('snapped', t.name);
}

await browser.close();
console.log('done. dir:', outDir);
