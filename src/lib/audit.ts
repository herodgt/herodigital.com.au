/** Technical AI-readiness checks. Ported from the Hero AI dashboard (app/tech.py). */

export const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
  'Bingbot',
  'Applebot-Extended',
] as const;

const KEY_SCHEMA_BIZ = new Set([
  'Dentist',
  'MedicalClinic',
  'LocalBusiness',
  'MedicalBusiness',
  'Physician',
  'Organization',
]);

export type AuditCheck = {
  key: string;
  label: string;
  ok: boolean | 'partial';
  weight: number;
  points: number;
  detail: string;
  fix: string;
};

export type AuditResult = {
  url: string;
  finalUrl?: string;
  status?: number;
  responseMs?: number | null;
  htmlKb?: number;
  words?: number;
  score: number;
  checks: AuditCheck[];
  bots?: Record<string, string>;
  schemaTypes?: string[];
  implantPage?: string | null;
  error?: string;
  topFixes: string[];
};

type RobotsGroup = { agents: string[]; rules: Array<['allow' | 'disallow', string]> };

export function parseRobots(txt: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let cur: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    if (!line.includes(':')) continue;
    const idx = line.indexOf(':');
    const k = line.slice(0, idx).trim().toLowerCase();
    const v = line.slice(idx + 1).trim();
    if (k === 'user-agent') {
      if (!lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur!.agents.push(v.toLowerCase());
      lastWasAgent = true;
    } else if ((k === 'allow' || k === 'disallow') && cur) {
      cur.rules.push([k, v]);
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}

export function botStatus(groups: RobotsGroup[], bot: string): 'allowed' | 'blocked' {
  let g = groups.filter((x) => x.agents.includes(bot.toLowerCase()));
  if (!g.length) g = groups.filter((x) => x.agents.includes('*'));
  if (!g.length) return 'allowed';
  const rules = g.flatMap((x) => x.rules);
  let best: ['allow' | 'disallow', string] | null = null;
  for (const [kind, path] of rules) {
    const prefix = path.replace(/\*+$/, '').replace(/\$$/, '') || '/';
    if ('/'.startsWith(prefix) || prefix === '/' || prefix === '/*') {
      if (!best || path.length > best[1].length) best = [kind, path];
    }
  }
  if (best && best[0] === 'disallow' && (best[1] === '/' || best[1] === '/*')) return 'blocked';
  return 'allowed';
}

export function walkTypes(obj: unknown, out: Set<string>): void {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      for (const v of obj) walkTypes(v, out);
      return;
    }
    const rec = obj as Record<string, unknown>;
    const t = rec['@type'];
    if (typeof t === 'string') out.add(t);
    else if (Array.isArray(t)) for (const x of t) if (typeof x === 'string') out.add(x);
    for (const v of Object.values(rec)) walkTypes(v, out);
  }
}

export function isPrivateIPv4(host: string): boolean {
  const parts = host.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, '');
  if (!h) return true;
  if (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h.endsWith('.intranet') ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h === 'metadata.google.internal' ||
    h.endsWith('.metadata.google.internal')
  ) {
    return true;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return isPrivateIPv4(h);
  if (h.includes(':')) {
    const bare = h.replace(/^\[|\]$/g, '');
    if (bare === '::1' || bare.startsWith('fc') || bare.startsWith('fd') || bare.startsWith('fe80') || bare.startsWith('::ffff:')) return true;
  }
  return false;
}

export function normalizeAuditUrl(input: string): { ok: true; url: URL } | { ok: false; error: string } {
  let raw = input.trim();
  if (!raw) return { ok: false, error: 'Enter a website URL.' };
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: 'That does not look like a valid URL.' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs can be audited.' };
  }
  if (url.username || url.password) {
    return { ok: false, error: 'URLs with credentials are not allowed.' };
  }
  if (isBlockedHost(url.hostname)) {
    return { ok: false, error: 'That host cannot be audited. Use a public website address.' };
  }
  return { ok: true, url };
}

const UA = 'Mozilla/5.0 (compatible; HeroDigitalAuditBot/1.0; +https://herodigital.com.au)';
const REQ_MS = 8000;
const MAX_BYTES = 1_500_000;

async function fetchLimited(
  url: string,
  signal: AbortSignal
): Promise<{ ok: false; error: string } | { ok: true; res: Response; buf: Uint8Array; ms: number; finalUrl: string }> {
  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.8' },
      signal: AbortSignal.any([signal, AbortSignal.timeout(REQ_MS)]),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Request failed';
    return { ok: false, error: msg };
  }
  const ms = Date.now() - t0;
  let finalUrl = res.url || url;
  try {
    const final = new URL(finalUrl);
    if (isBlockedHost(final.hostname)) {
      return { ok: false, error: 'The site redirected to a host that cannot be audited.' };
    }
  } catch {
    /* keep */
  }
  const reader = res.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        return { ok: false, error: 'The response was larger than the 1.5 MB audit limit.' };
      }
      chunks.push(value);
    }
  } else {
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_BYTES) return { ok: false, error: 'The response was larger than the 1.5 MB audit limit.' };
    chunks.push(new Uint8Array(ab));
    total = ab.byteLength;
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  return { ok: true, res, buf, ms, finalUrl };
}

function decode(buf: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4]) : undefined;
}

function extractHtml(html: string) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim();
  let meta = '';
  const metaRe = /<meta\b[^>]*>/gi;
  let mm: RegExpExecArray | null;
  while ((mm = metaRe.exec(html))) {
    const tag = mm[0];
    const name = attr(tag, 'name') || attr(tag, 'property') || '';
    if (/^description$/i.test(name)) meta = (attr(tag, 'content') || '').trim();
  }
  const h1s: string[] = [];
  const h1Re = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
  let h: RegExpExecArray | null;
  while ((h = h1Re.exec(html))) {
    h1s.push(h[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }
  const types = new Set<string>();
  const ldRe = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ld: RegExpExecArray | null;
  while ((ld = ldRe.exec(html))) {
    try {
      walkTypes(JSON.parse(ld[1].replace(/^\s*<!--/, '').replace(/-->\s*$/, '')), types);
    } catch {
      /* ignore broken JSON-LD */
    }
  }
  const hrefs: Array<{ text: string; href: string }> = [];
  const aRe = /<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;
  let a: RegExpExecArray | null;
  while ((a = aRe.exec(html))) {
    hrefs.push({
      href: a[2] ?? a[3] ?? '',
      text: a[4].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });
  }
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const hasTel = /href\s*=\s*["']tel:/i.test(html);
  return { title, meta, h1s, types, hrefs, text, hasTel };
}

export async function runAudit(inputUrl: string, signal?: AbortSignal): Promise<AuditResult> {
  const parsed = normalizeAuditUrl(inputUrl);
  if (!parsed.ok) return { url: inputUrl, score: 0, checks: [], topFixes: [], error: parsed.error };
  const start = parsed.url;
  const checks: AuditCheck[] = [];
  const add = (
    key: string,
    label: string,
    ok: boolean,
    weight: number,
    detail: string,
    fix: string,
    partial?: number
  ) => {
    const pts = ok ? weight : partial != null ? weight * partial : 0;
    checks.push({
      key,
      label,
      ok: ok ? true : partial && partial > 0 ? 'partial' : false,
      weight,
      points: Math.round(pts * 10) / 10,
      detail,
      fix,
    });
  };

  const ctrl = signal ?? AbortSignal.timeout(20_000);
  const home = await fetchLimited(start.toString(), ctrl);
  if (!home.ok) {
    return {
      url: start.toString(),
      score: 0,
      checks: [],
      topFixes: [],
      error: `Could not load site: ${home.error}`,
    };
  }
  if (home.res.status >= 400) {
    return {
      url: start.toString(),
      finalUrl: home.finalUrl,
      status: home.res.status,
      responseMs: home.ms,
      score: 0,
      checks: [],
      topFixes: [],
      error: `Could not load site: ${home.res.status}`,
    };
  }

  const finalUrl = home.finalUrl;
  const final = new URL(finalUrl);
  const base = `${final.protocol}//${final.host}`;
  const html = decode(home.buf);
  const sizeKb = Math.round(home.buf.byteLength / 1024);
  const extracted = extractHtml(html);
  const result: AuditResult = {
    url: start.toString(),
    finalUrl,
    status: home.res.status,
    responseMs: home.ms,
    htmlKb: sizeKb,
    score: 0,
    checks,
    topFixes: [],
  };

  add('https', 'HTTPS', final.protocol === 'https:', 5, finalUrl, 'Serve the site over HTTPS and redirect http:// to https://.');

  const robotsRes = await fetchLimited(base + '/robots.txt', ctrl);
  let robotsTxt = '';
  if (
    robotsRes.ok &&
    robotsRes.res.status === 200 &&
    !/html/i.test(robotsRes.res.headers.get('content-type') || '')
  ) {
    robotsTxt = decode(robotsRes.buf);
  }
  const groups = robotsTxt ? parseRobots(robotsTxt) : [];
  const bots: Record<string, string> = {};
  for (const b of AI_BOTS) bots[b] = botStatus(groups, b);
  result.bots = bots;
  const blocked = AI_BOTS.filter((b) => bots[b] === 'blocked');
  add(
    'ai_crawlers',
    'AI crawlers allowed (robots.txt)',
    blocked.length === 0,
    15,
    (robotsTxt ? 'robots.txt found. ' : 'No robots.txt (all crawlers allowed by default). ') +
      (blocked.length ? `Blocked: ${blocked.join(', ')}` : 'All 8 AI crawlers allowed.'),
    blocked.length
      ? `Remove Disallow rules for ${blocked.join(', ')} so AI assistants can read and cite the site.`
      : '',
    blocked.length ? 1 - blocked.length / AI_BOTS.length : undefined
  );

  const sm = robotsTxt.match(/^\s*sitemap:\s*(\S+)/im);
  let smurl = sm ? sm[1] : base + '/sitemap.xml';
  let sr = await fetchLimited(smurl, ctrl);
  let sitemapOk =
    sr.ok && sr.res.status === 200 && (/<urlset/i.test(decode(sr.buf)) || /<sitemapindex/i.test(decode(sr.buf)));
  if (!sitemapOk && !sm) {
    sr = await fetchLimited(base + '/sitemap_index.xml', ctrl);
    sitemapOk = sr.ok && sr.res.status === 200 && /<sitemap/i.test(decode(sr.buf));
    if (sitemapOk) smurl = base + '/sitemap_index.xml';
  }
  add('sitemap', 'XML sitemap', !!sitemapOk, 5, sitemapOk ? smurl : 'No sitemap found', 'Publish an XML sitemap and reference it in robots.txt.');

  const lr = await fetchLimited(base + '/llms.txt', ctrl);
  const llmsText = lr.ok && lr.res.status === 200 ? decode(lr.buf) : '';
  const llms = !!llmsText && !/<html/i.test(llmsText.slice(0, 500)) && llmsText.trim().length > 20;
  add(
    'llms',
    'llms.txt file',
    llms,
    5,
    `${base}/llms.txt ${llms ? 'found' : 'not found'}`,
    'Add /llms.txt: a plain-text summary of the clinic, services, dentists and key pages for AI tools.'
  );

  const types = extracted.types;
  result.schemaTypes = [...types].sort();
  const biz = [...types].some((t) => KEY_SCHEMA_BIZ.has(t));
  add(
    'schema_biz',
    'Business schema (Dentist / MedicalClinic / LocalBusiness)',
    biz,
    12,
    types.size ? [...types].sort().join(', ') : 'No JSON-LD found',
    'Add JSON-LD Dentist (or MedicalClinic) schema with name, address, phone, hours, geo and sameAs links.'
  );
  add('schema_faq', 'FAQPage schema', types.has('FAQPage'), 5, types.has('FAQPage') ? 'found' : 'not found', 'Mark up FAQ sections with FAQPage schema.');
  const person = types.has('Person') || types.has('Physician');
  add(
    'schema_person',
    'Person / practitioner schema',
    person,
    4,
    person ? 'found' : 'not found',
    'Add Person schema for each dentist (name, qualifications, Ahpra-registered role).'
  );
  const proc = types.has('MedicalProcedure') || types.has('Service') || types.has('MedicalTherapy');
  add(
    'schema_proc',
    'MedicalProcedure / Service schema',
    proc,
    4,
    proc ? 'found' : 'not found',
    'Add MedicalProcedure schema on implant / All-on-4 pages.'
  );

  const { title, meta, h1s } = extracted;
  add(
    'title_meta',
    'Title & meta description',
    Boolean(title) && Boolean(meta),
    5,
    `Title: ${title.slice(0, 90) || '—'} | Meta: ${meta.slice(0, 120) || '—'}`,
    'Write a clear title and meta description naming the service and suburb.',
    title || meta ? 0.5 : 0
  );
  add(
    'h1',
    'Single clear H1',
    h1s.length === 1,
    4,
    h1s.join(' | ').slice(0, 150) || 'No H1',
    'Use exactly one H1 that states what the clinic does and where.',
    h1s.length ? 0.5 : 0
  );

  const words = extracted.text.split(/\s+/).filter(Boolean).length;
  result.words = words;
  add(
    'ssr',
    'Content is server-rendered text',
    words >= 300,
    10,
    `${words} words in raw HTML`,
    "Main content isn't in the raw HTML (likely JavaScript-rendered). Use server-side rendering so AI crawlers can read it.",
    Math.min(words / 300, 1) * 0.5
  );

  const faq =
    /\b(FAQ|frequently asked|questions)\b/i.test(extracted.text) ||
    (html.match(/<h[23]\b[^>]*>[\s\S]*?\?<\/h[23]>/gi) || []).length >= 3;
  add('faq', 'FAQ / question-answer content', faq, 5, faq ? 'found' : 'not found', 'Add an FAQ answering real patient questions (cost, candidacy, recovery, risks).');

  const phone =
    extracted.hasTel ||
    /(\(0\d\)\s?\d{4}\s?\d{4}|\b0\d\s?\d{4}\s?\d{4}\b|\b1[38]00\s?\d{3}\s?\d{3}\b|\+61\s?\d[\d\s]{7,})/.test(extracted.text);
  const addr = /\b(QLD|NSW|VIC|WA|SA|TAS|ACT|NT)\b\s*\d{4}/.test(extracted.text);
  add(
    'nap',
    'Name, address & phone visible',
    Boolean(phone) && Boolean(addr),
    6,
    `Phone: ${phone ? 'yes' : 'no'}, Address/postcode: ${addr ? 'yes' : 'no'}`,
    'Show full name, street address with postcode and phone in plain text on every page (e.g. footer).',
    phone || addr ? 0.5 : 0
  );

  const fast = home.ms < 1500 && sizeKb < 1500;
  add(
    'speed',
    'Speed proxy (response time & HTML weight)',
    fast,
    5,
    `${home.ms} ms, ${sizeKb} KB HTML`,
    'Improve server response time (<1.5s) and reduce page weight (caching, CDN, image compression).',
    home.ms < 3000 ? 0.5 : 0
  );

  let imp: string | null = null;
  for (const link of extracted.hrefs) {
    const hay = `${link.text} ${link.href}`;
    if (!/implant|all-on|full-arch|full arch/i.test(hay)) continue;
    try {
      const abs = new URL(link.href, finalUrl);
      if (abs.host === final.host) {
        imp = abs.toString();
        break;
      }
    } catch {
      /* ignore */
    }
  }
  if (!imp && /implant/i.test(`${title} ${h1s.join(' ')}`)) imp = finalUrl;
  result.implantPage = imp;
  add(
    'implant',
    'Dedicated implant page',
    Boolean(imp),
    10,
    imp || 'No implant page linked from homepage',
    'Create a dedicated, detailed dental implant page (cost range, candidacy, process, risks, FAQs, dentist credentials).'
  );

  const tot = checks.reduce((s, ch) => s + ch.weight, 0);
  const got = checks.reduce((s, ch) => s + ch.points, 0);
  result.score = tot ? Math.round((100 * got) / tot) : 0;
  result.topFixes = checks
    .filter((ch) => ch.ok !== true && ch.fix)
    .sort((a, b) => b.weight - a.weight || a.points - b.points)
    .slice(0, 5)
    .map((ch) => ch.fix);
  return result;
}
