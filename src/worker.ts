import { normalizeAuditUrl, runAudit } from './lib/audit';

export interface Env {
  ASSETS: Fetcher;
  PUBLIC_FORM_ENDPOINT?: string;
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const memoryHits = new Map<string, number[]>();

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (memoryHits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    memoryHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  memoryHits.set(ip, hits);
  return false;
}

function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...extra,
    },
  });
}

function cors(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) return (await request.json()) as Record<string, unknown>;
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      return Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : v.name]));
    }
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function handleAudit(request: Request): Promise<Response> {
  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return json({ error: 'Too many audit requests from this address. Please wait a few minutes and try again.' }, 429);
  }
  const body = await readJson(request);
  if (!body) return json({ error: 'Send a JSON body with a url field.' }, 400);
  const url = String(body.url || body.website || '').trim();
  const parsed = normalizeAuditUrl(url);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  try {
    const result = await runAudit(parsed.url.toString(), AbortSignal.timeout(20_000));
    if (result.error && !result.checks.length) return json(result, 422);
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed';
    return json({ error: `The audit could not be completed: ${message}` }, 502);
  }
}

async function handleLead(request: Request, env: Env): Promise<Response> {
  const ip = clientIp(request);
  if (rateLimited(`lead:${ip}`)) {
    return json({ error: 'Too many requests. Please wait a few minutes and try again.' }, 429);
  }
  const body = await readJson(request);
  if (!body) return json({ error: 'Send a JSON body with an email field.' }, 400);
  const email = String(body.email || '').trim();
  const site = String(body.url || body.website || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
  const payload = {
    formType: 'audit-pdf',
    email,
    url: site,
    name: String(body.name || '').trim(),
    sourcePath: String(body.sourcePath || '/').trim(),
    receivedAt: new Date().toISOString(),
  };
  const endpoint = env.PUBLIC_FORM_ENDPOINT?.trim();
  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(String(res.status));
      return json({ ok: true, message: 'Thanks. We’ll email the full branded PDF report to that address.' });
    } catch {
      return json(
        { ok: true, message: 'We have your request. If the report does not arrive, email jcheng@hero.tt and we’ll send it.' },
        200
      );
    }
  }
  console.log('audit-pdf lead (email not wired)', { email, url: site, ip });
  return json({
    ok: true,
    message: 'Thanks. Jeff will receive this request once email delivery is wired, and the branded PDF will be sent to you then. You can also email jcheng@hero.tt.',
  });
}

const REDIRECTS: Record<string, string> = {
  '/pricing': '/ai-visibility/',
  '/pricing/': '/ai-visibility/',
  '/market-leader': '/hero-one/',
  '/market-leader/': '/hero-one/',
  '/results': '/',
  '/results/': '/',
  '/insights': '/',
  '/insights/': '/',
  '/dental-implants/pricing': '/dental-implants/',
  '/dental-implants/pricing/': '/dental-implants/',
  '/growth-services': '/growth/',
  '/growth-services/': '/growth/',
  '/growth-services/fit-check': '/growth/fit-check/',
  '/growth-services/fit-check/': '/growth/fit-check/',
  '/growth-services/seo': '/growth/seo/',
  '/growth-services/seo/': '/growth/seo/',
  '/growth-services/link-building': '/growth/link-building/',
  '/growth-services/link-building/': '/growth/link-building/',
  '/growth-services/google-ads': '/growth/google-ads/',
  '/growth-services/google-ads/': '/growth/google-ads/',
  '/free-audit': '/',
  '/free-audit/': '/',
  '/free-ai-visibility-audit': '/',
  '/free-ai-visibility-audit/': '/',
  '/ai-visibility/plans': '/ai-visibility/',
  '/ai-visibility/plans/': '/ai-visibility/',
  '/ahpra-compliance': '/dental-implants/ahpra-compliance/',
  '/ahpra-compliance/': '/dental-implants/ahpra-compliance/',
  '/privacy': '/legal/privacy/',
  '/privacy/': '/legal/privacy/',
  '/terms': '/legal/terms/',
  '/terms/': '/legal/terms/',
};

function redirectTarget(pathname: string): string | null {
  if (REDIRECTS[pathname]) return REDIRECTS[pathname];
  if (pathname === '/insights' || pathname.startsWith('/insights/')) return '/';
  return null;
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const redirected = redirectTarget(url.pathname);
    if (redirected) {
      return new Response(null, {
        status: 301,
        headers: { Location: redirected, ...SECURITY_HEADERS },
      });
    }
    if (url.pathname === '/_redirects' || url.pathname === '/_headers') {
      return new Response('Not found', { status: 404, headers: SECURITY_HEADERS });
    }
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) return cors();
    if (url.pathname === '/api/audit' && request.method === 'POST') return handleAudit(request);
    if (url.pathname === '/api/lead' && request.method === 'POST') return handleLead(request, env);
    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
