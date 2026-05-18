# builtbycorey.com

Marketing landing for the agency brand. Single static page, zero build step.

## Files

- `index.html` — full page markup
- `styles.css` — all styles (warm cream + ink + terracotta accent)
- `assets/corey.jpg` — hero portrait
- `assets/Corey_Musa_CV.pdf` — linked from the About section
- `vercel.json` — static hosting config with cache headers and security headers

## Run locally

Open `index.html` in a browser, or serve the folder with any static server:

```bash
npx serve .
# or
python -m http.server 4000
```

## Deploy to Vercel

First time — link the folder to a Vercel project:

```bash
cd C:/Users/Corey/Workspace/builtbycorey
vercel link
vercel --prod
```

Subsequent deploys: `vercel --prod`.

### Custom domain

In the Vercel dashboard for the linked project:

1. Settings → Domains → Add `builtbycorey.com` and `www.builtbycorey.com`.
2. Vercel will show you the DNS records to set at the registrar.
3. Once propagated, Vercel issues the SSL cert automatically.

## Editing

- Copy and case-study lines live inline in `index.html` — search for the section comment, edit text, redeploy.
- The portrait is `assets/corey.jpg`. Drop in a new file with the same name and it'll be picked up.
- Tweak palette via CSS variables at the top of `styles.css` (`--accent`, `--bg`, `--ink`).
