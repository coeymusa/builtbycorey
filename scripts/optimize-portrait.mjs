// Generate optimised AVIF + WebP + smaller JPEG variants for the hero
// portrait. Reuses the sharp install vendored in the saddle-central project
// so this folder needs no node_modules.

import sharp from '../../agency/saddle-central/node_modules/sharp/lib/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '..', 'assets', 'corey.jpg');
const outAvif = resolve(here, '..', 'assets', 'corey.avif');
const outWebp = resolve(here, '..', 'assets', 'corey.webp');
const outJpg = resolve(here, '..', 'assets', 'corey-840.jpg');

// Target display: ~420px CSS wide, x2 DPR = 840 device pixels max.
const targetWidth = 840;

await sharp(src)
  .resize({ width: targetWidth, withoutEnlargement: true })
  .avif({ quality: 60, effort: 6 })
  .toFile(outAvif);

await sharp(src)
  .resize({ width: targetWidth, withoutEnlargement: true })
  .webp({ quality: 72, effort: 6 })
  .toFile(outWebp);

await sharp(src)
  .resize({ width: targetWidth, withoutEnlargement: true })
  .jpeg({ quality: 78, mozjpeg: true, progressive: true })
  .toFile(outJpg);

const fs = await import('node:fs');
console.log('avif:', fs.statSync(outAvif).size, 'bytes');
console.log('webp:', fs.statSync(outWebp).size, 'bytes');
console.log('jpg (840):', fs.statSync(outJpg).size, 'bytes');
console.log('original jpg:', fs.statSync(src).size, 'bytes');
