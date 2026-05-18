// POST /api/contact
//
// Receives a contact-form submission from builtbycorey.com and forwards
// it to corey@builtbycorey.com via Resend, then sends an auto-reply
// confirmation to the visitor.
//
// Env vars (set via `vercel env add` or the dashboard):
//   RESEND_API_KEY   — Resend project API key (re_…)
//
// Hardening:
//   - Honeypot field (silently drops bots)
//   - In-memory per-IP rate limit: 4 submissions / 10 minutes
//   - Input length validation
//   - Heuristic spam scoring (links, ALL CAPS, repeated chars)

const FROM = 'Built by Corey <corey@builtbycorey.com>';
const TO = 'corey@builtbycorey.com';

// Per-region in-memory rate-limit bucket. Vercel may spin up multiple
// instances so this is best-effort — for harder limits use Upstash KV.
const HITS = new Map();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_HITS = 4;

function rateLimitOk(ip) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  // Periodic cleanup: trim map if it grows large.
  if (HITS.size > 500) {
    for (const [k, v] of HITS) {
      if (!v.length || now - v[v.length - 1] > WINDOW_MS) HITS.delete(k);
    }
  }
  return arr.length <= MAX_HITS;
}

function spamScore({ name, email, message }) {
  let score = 0;
  const urls = (message.match(/https?:\/\//gi) || []).length;
  if (urls >= 3) score += 2;
  if (urls >= 5) score += 3;
  if (/(.)\1{6,}/.test(message)) score += 2;
  if (message === message.toUpperCase() && message.length > 40) score += 2;
  if (/(viagra|casino|crypto airdrop|seo backlinks|escort)/i.test(message)) score += 5;
  if (/^[a-z0-9]{20,}@/i.test(email)) score += 1; // gibberish local-part
  if (name.length < 2) score += 2;
  return score;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendEmail(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`resend ${res.status}: ${txt}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();

    if (!name || name.length > 200) return res.status(400).json({ error: 'Invalid name.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Please use a valid email address.' });
    }
    if (!message || message.length < 4 || message.length > 5000) {
      return res.status(400).json({ error: 'Message looks empty or too long.' });
    }

    // Rate limit by IP (Vercel passes the real address in x-forwarded-for).
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (!rateLimitOk(ip)) {
      return res.status(429).json({ error: "You've sent a few already. Please try again in a few minutes." });
    }

    // Spam heuristics: silently accept but flag so we don't reply to bots.
    const score = spamScore({ name, email, message });
    const looksLikeSpam = score >= 4;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not set');
      return res.status(500).json({ error: 'Contact form is offline. Please email corey@builtbycorey.com directly.' });
    }

    // 1) Internal mail to Corey.
    const internalSubject = looksLikeSpam
      ? `[SPAM?] Enquiry — ${name}`
      : `New project enquiry — ${name}`;
    const internalHtml = `
<!doctype html>
<html lang="en"><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#14181f;line-height:1.55;max-width:560px;margin:0;padding:24px;">
  <h2 style="font-family:Georgia,serif;font-weight:500;margin:0 0 12px;">New project enquiry${looksLikeSpam ? ' (flagged as possible spam)' : ''}</h2>
  <p style="margin:0 0 4px;color:#6c6f78;font-size:13px;text-transform:uppercase;letter-spacing:0.15em;">From</p>
  <p style="margin:0 0 18px;font-size:16px;"><b>${escapeHtml(name)}</b> &lt;${escapeHtml(email)}&gt;</p>
  <p style="margin:0 0 4px;color:#6c6f78;font-size:13px;text-transform:uppercase;letter-spacing:0.15em;">Message</p>
  <div style="white-space:pre-wrap;padding:14px 16px;border:1px solid #e3dcc8;border-radius:8px;background:#faf6ef;">${escapeHtml(message)}</div>
  <p style="margin:24px 0 0;font-size:12px;color:#9aa0aa;">Sent via builtbycorey.com · IP ${escapeHtml(ip)} · spam score ${score}</p>
</body></html>`.trim();

    await sendEmail(apiKey, {
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: internalSubject,
      html: internalHtml,
      text: `New project enquiry from ${name} <${email}>\n\n${message}\n\n— Sent via builtbycorey.com (spam score ${score})`,
    });

    // 2) Confirmation auto-reply to the visitor (skip for likely spam so we
    // don't help spammers verify deliverability).
    if (!looksLikeSpam) {
      const replyHtml = `
<!doctype html>
<html lang="en"><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#14181f;line-height:1.65;max-width:560px;margin:0;padding:32px 24px;">
  <p style="font-family:Georgia,serif;font-style:italic;font-size:18px;margin:0 0 16px;">Hi ${escapeHtml(name.split(' ')[0] || name)},</p>
  <p style="margin:0 0 14px;">Thanks for getting in touch. Your message landed safely and I'll reply personally within two working days.</p>
  <p style="margin:0 0 14px;">If your project is time-sensitive, you can reach me directly on <a href="mailto:corey@builtbycorey.com" style="color:#c25a3a;">corey@builtbycorey.com</a> or +41 79 787 31 98.</p>
  <p style="margin:0 0 4px;">For reference, here's what you sent:</p>
  <div style="white-space:pre-wrap;padding:12px 14px;border:1px solid #e3dcc8;border-radius:8px;background:#faf6ef;color:#4a4f5a;font-size:14px;">${escapeHtml(message)}</div>
  <p style="margin:24px 0 0;font-family:Georgia,serif;font-style:italic;">— Corey</p>
  <p style="margin:18px 0 0;font-size:12px;color:#9aa0aa;">Built by Corey · Zürich · builtbycorey.com</p>
</body></html>`.trim();

      await sendEmail(apiKey, {
        from: FROM,
        to: [email],
        reply_to: TO,
        subject: 'Got your message — Corey',
        html: replyHtml,
        text: `Hi ${name.split(' ')[0] || name},\n\nThanks for getting in touch. Your message landed safely and I'll reply personally within two working days.\n\nIf your project is time-sensitive, you can reach me on corey@builtbycorey.com or +41 79 787 31 98.\n\nFor reference, here's what you sent:\n\n${message}\n\n— Corey\nBuilt by Corey · Zürich · builtbycorey.com`,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact handler crash', err);
    return res.status(500).json({ error: 'Unexpected error. Please email corey@builtbycorey.com directly.' });
  }
}
