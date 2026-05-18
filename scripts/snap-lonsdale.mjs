// Capture matched before/after screenshots of the live Lonsdale sites
// so the /case/lonsdale page can show real, dated comparisons.

import { chromium } from '../../corey-portfolio/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'assets', 'lonsdale');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const pairs = [
  {
    name: 'home',
    wp: 'https://www.lonsdalecommercials.co.uk/',
    astro: 'https://londsdale.vercel.app/',
  },
  {
    name: 'van-sales',
    wp: 'https://www.lonsdalecommercials.co.uk/van-sales/',
    astro: 'https://londsdale.vercel.app/van-sales/',
  },
];

const browser = await chromium.launch();

for (const pair of pairs) {
  for (const variant of ['wp', 'astro']) {
    const url = pair[variant];
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 });
    } catch (err) {
      console.warn('networkidle slow for', url, 'falling back to domcontentloaded');
      try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); }
      catch (e2) { console.error('failed:', url, e2.message); continue; }
    }
    // Try to dismiss common cookie banners by clicking known opt-in CTAs.
    await page.evaluate(() => {
      const txts = ['accept', 'accept all', 'agree', 'i agree', 'allow all', 'got it'];
      for (const btn of document.querySelectorAll('button, a')) {
        const t = (btn.textContent || '').trim().toLowerCase();
        if (t && txts.includes(t)) { btn.click(); break; }
      }
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);

    const out = resolve(outDir, `${pair.name}-${variant}.jpg`);
    await page.screenshot({
      path: out,
      type: 'jpeg',
      quality: 84,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });
    console.log('snapped', pair.name, variant);
    await page.close();
  }
}

await browser.close();
console.log('done.');
