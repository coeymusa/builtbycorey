// Render a 180x180 Apple touch icon from the brand mark.
import { chromium } from '../../corey-portfolio/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '..', 'apple-touch-icon.png');

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,600&display=swap" rel="stylesheet"><style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:180px;height:180px;overflow:hidden;}
  .icon{
    width:180px;height:180px;
    background:#0d1219;
    display:flex;align-items:center;justify-content:center;
    border-radius:36px;
    position:relative;
  }
  .icon::before{
    content:'';position:absolute;inset:0;
    background:radial-gradient(circle at 70% 25%, rgba(194,90,58,0.18), transparent 60%);
    border-radius:36px;
  }
  .icon b{
    font-family:'Fraunces',Georgia,serif;
    font-style:italic;
    font-weight:600;
    font-size:128px;
    color:#c25a3a;
    line-height:1;
    margin-top:-8px;
  }
</style></head>
<body><div class="icon"><b>b</b></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 180, height: 180 },
  deviceScaleFactor: 2,
});
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: out, type: 'png', clip: { x: 0, y: 0, width: 180, height: 180 } });
await browser.close();
console.log('wrote', out);
