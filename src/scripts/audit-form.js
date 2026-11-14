function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLabel(ok) {
  if (ok === true) return 'Pass';
  if (ok === 'partial') return 'Partial';
  return 'Fail';
}

export function renderAuditResult(target, data, opts = {}) {
  if (data.error && !data.checks?.length) {
    target.innerHTML = `<div class="audit-error" role="alert">${esc(data.error)}</div>`;
    target.hidden = false;
    return;
  }
  const checks = (data.checks || [])
    .map(
      (ch) => `<li class="audit-check is-${esc(String(ch.ok))}">
        <span class="audit-flag">${statusLabel(ch.ok)}</span>
        <div>
          <strong>${esc(ch.label)}</strong>
          <p>${esc(ch.detail)}</p>
        </div>
      </li>`
    )
    .join('');
  const fixes = (data.topFixes || []).map((f) => `<li>${esc(f)}</li>`).join('');
  const audited = esc(data.finalUrl || data.url || '');
  target.innerHTML = `
    <div class="audit-result" id="audit-report">
      <div class="audit-score-row">
        <div class="audit-score" aria-label="Technical score ${esc(data.score)} out of 100">
          <span class="audit-score-num">${esc(data.score)}</span>
          <span class="audit-score-of">/ 100</span>
        </div>
        <div>
          <p class="eyebrow">Instant technical audit</p>
          <h2>A technical readiness score, not an AI-mention result.</h2>
          <p class="lead audit-url">Checked ${audited}${data.responseMs != null ? ` in ${esc(data.responseMs)} ms` : ''}.</p>
        </div>
      </div>
      <p class="audit-note">This is a technical crawl of the public site: HTTPS, robots.txt for AI crawlers, llms.txt, schema, title and H1, NAP, implant-page signals, sitemap, and a simple speed proxy. Whether ChatGPT, Perplexity, Gemini or Google’s AI answers actually recommend the clinic is tested with dated prompts in the full branded PDF report — those figures are never invented here.</p>
      ${fixes ? `<div class="audit-fixes"><h3>Top ${data.topFixes.length} fixes</h3><ol>${fixes}</ol></div>` : ''}
      <h3>Checks</h3>
      <ul class="audit-checks">${checks}</ul>
      <form class="audit-lead" data-audit-lead>
        <h3>Email me the full branded PDF report</h3>
        <p>We’ll include the AI-answer tests (whether those tools actually name the clinic) in the full report. No call required.</p>
        <input type="hidden" name="url" value="${audited}" />
        <label for="audit-lead-email">Email</label>
        <div class="audit-lead-row">
          <input id="audit-lead-email" name="email" type="email" required autocomplete="email" placeholder="you@clinic.com.au" />
          <button class="btn btn-primary" type="submit">Email me the report</button>
        </div>
        <p class="form-status" role="status"></p>
      </form>
    </div>`;
  target.hidden = false;
  if (opts.scroll !== false) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function runAuditFromForm(form) {
  const input = form.querySelector('input[name="url"], input[name="website"]');
  const status = form.querySelector('.form-status');
  const url = input?.value?.trim();
  const target = document.querySelector('#audit-results');
  if (!url || !target) return;
  if (status) {
    status.className = 'form-status show';
    status.textContent = 'Crawling the public site…';
  }
  form.querySelector('button[type="submit"]')?.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok && !data.checks) throw new Error(data.error || 'Audit failed');
    if (status) {
      status.className = 'form-status show ok';
      status.textContent = data.error && !data.checks?.length ? data.error : 'Audit complete.';
    }
    renderAuditResult(target, data);
    const next = new URL(location.href);
    if (location.pathname === '/' || location.pathname === '') {
      next.hash = 'audit-results';
      next.searchParams.set('url', url);
      history.replaceState({}, '', next);
    } else {
      next.searchParams.set('url', url);
      history.replaceState({}, '', next);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The audit could not be completed.';
    if (status) {
      status.className = 'form-status show err';
      status.textContent = message + ' You can try again, or email jcheng@hero.tt.';
    }
    if (target) {
      target.hidden = false;
      target.innerHTML = `<div class="audit-error" role="alert">${esc(message)}</div>`;
    }
  } finally {
    form.querySelector('button[type="submit"]')?.removeAttribute('aria-busy');
  }
}

function bindLead(form) {
  if (form.dataset.bound) return;
  form.dataset.bound = 'true';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.sourcePath = location.pathname;
    if (status) {
      status.className = 'form-status show';
      status.textContent = 'Sending…';
    }
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok && !data.ok) throw new Error(data.error || 'Request failed');
      if (status) {
        status.className = 'form-status show ok';
        status.textContent = data.message || 'Thanks. We’ll be in touch.';
      }
    } catch (err) {
      if (status) {
        status.className = 'form-status show err';
        status.textContent = 'We couldn’t send that just now. Please email jcheng@hero.tt instead.';
      }
    }
  });
}

export function initAuditForms() {
  document.querySelectorAll('form[data-audit-form]').forEach((form) => {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      runAuditFromForm(form);
    });
  });
  document.querySelectorAll('form[data-audit-lead]').forEach(bindLead);
  const results = document.querySelector('#audit-results');
  const params = new URLSearchParams(location.search);
  const url = params.get('url');
  const form = document.querySelector('form[data-audit-form]');
  if (url && form && results && !results.dataset.loaded) {
    const input = form.querySelector('input[name="url"], input[name="website"]');
    if (input && !input.value) input.value = url;
    results.dataset.loaded = 'true';
    runAuditFromForm(form);
  }
}
