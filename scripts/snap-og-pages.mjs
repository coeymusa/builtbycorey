// Render per-page OG cards (1200x630) for every essay and case study.

import { chromium } from '../../corey-portfolio/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const tpl = pathToFileURL(resolve(here, 'og-page-template.html')).href;
const outDir = resolve(here, '..', 'assets', 'og');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const pages = [
  {
    slug: 'case-mcu',
    title: 'The operating system of a <em>regulated</em> credit union.',
    sub: 'A regulated UK credit union built end-to-end by one engineer. Member portal, loan lifecycle, AML/CFT, audit chains.',
    tag: 'Case · 01',
    url: 'builtbycorey.com/case/mcu',
    meta: 'Regulated platform · 2025–',
  },
  {
    slug: 'case-mooncake',
    title: 'A cross-platform <em>AI chat app</em> that remembers you.',
    sub: 'React Native first. Automatic context memory across conversations. Hono on the edge, Drizzle ORM, one codebase.',
    tag: 'Case · 02',
    url: 'builtbycorey.com/case/mooncake',
    meta: 'Mobile + AI · 2025–',
  },
  {
    slug: 'case-rugby-unlocked',
    title: 'A SaaS that grew to <em>110 clubs</em> on word of mouth.',
    sub: 'Identity and statistics for amateur rugby. 400 users, 40 paying, zero paid acquisition. One engineer end-to-end.',
    tag: 'Case · 03',
    url: 'builtbycorey.com/case/rugby-unlocked',
    meta: 'SaaS · 2026–',
  },
  {
    slug: 'case-promptmysite',
    title: 'An <em>LLM agent platform</em> that lives inside Shopify.',
    sub: 'Custom orchestration, tool calling, streaming inference, RAG. Live on Shopify with Stripe billing. No LangChain.',
    tag: 'Case · 04',
    url: 'builtbycorey.com/case/promptmysite',
    meta: 'LLM platform · 2025–',
  },
  {
    slug: 'case-lonsdale',
    title: 'The <em>soft retouch</em>. A rebuild a returning customer wouldn\'t notice.',
    sub: 'Same brand, same URLs, same content. WordPress out, Astro in. A Cardiff family business trading since 1980, kept exactly as their customers recognise it.',
    tag: 'Case · 05',
    url: 'builtbycorey.com/case/lonsdale',
    meta: 'WordPress → Astro · 2026',
  },
  {
    slug: 'note-one-engineer',
    title: 'Why one engineer can <em>out-build</em> a four-person agency.',
    sub: 'The arithmetic of communication overhead, Brooks\'s Law, and what depth in one head looks like in practice.',
    tag: 'Note · 01',
    url: 'builtbycorey.com/notes/one-engineer',
    meta: 'May 2026 · 7 min read',
  },
  {
    slug: 'note-wordpress-rankings',
    title: 'Killing WordPress without killing your <em>Google rankings</em>.',
    sub: 'The mechanics: 301 redirects, structured data, Search Console monitoring, and the four-hour Google Ads pause at cutover.',
    tag: 'Note · 02',
    url: 'builtbycorey.com/notes/wordpress-rankings',
    meta: 'April 2026 · 6 min read',
  },
  {
    slug: 'note-regulated-discipline',
    title: 'What <em>regulated</em> taught me that consumer software desperately needs.',
    sub: 'Audit chains. Retention policies. Four-eyes approvals. Why building these in early is hours, not weeks later.',
    tag: 'Note · 03',
    url: 'builtbycorey.com/notes/regulated-discipline',
    meta: 'March 2026 · 8 min read',
  },
  {
    slug: 'note-why-i-left-the-bank',
    title: 'Why I <em>left the bank</em>.',
    sub: 'The bored side of an Associate Director seat, the weekend a hobby prototype out-shipped two months of bank work, and the feedback loop I had to build for myself.',
    tag: 'Note · 04',
    url: 'builtbycorey.com/notes/why-i-left-the-bank',
    meta: 'June 2026 · 4 min read',
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});

for (const p of pages) {
  const url = new URL(tpl);
  url.searchParams.set('title', p.title);
  url.searchParams.set('sub', p.sub);
  url.searchParams.set('tag', p.tag);
  url.searchParams.set('url', p.url);
  url.searchParams.set('meta', p.meta);
  await page.goto(url.href, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const out = resolve(outDir, `${p.slug}.jpg`);
  await page.screenshot({
    path: out,
    type: 'jpeg',
    quality: 90,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  console.log('wrote', p.slug);
}

await browser.close();
console.log('done.');
