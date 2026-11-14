const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Flowing acid-green light ribbons drawn on a canvas over the static CSS fallback.
// Cheap: low-res buffer, blur does the smoothing, ~30fps, paused when offscreen.
function limeRibbons(root) {
  if (reduced()) return;
  if (window.matchMedia('(max-width: 700px)').matches) return;
  if (navigator.connection && (navigator.connection.saveData || (navigator.connection.downlink && navigator.connection.downlink < 1.2))) return;

  const canvases = [...root.querySelectorAll('canvas[data-lime-canvas]')];
  if (!canvases.length) return;

  canvases.forEach((canvas) => {
    if (canvas.dataset.on) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Subtle: low alpha, concentrated on the upper-right so the headline stays on black.
    const ribbons = [
      { y: 0.18, amp: 0.1, len: 0.2, speed: 0.05, phase: 0.0, hue: 'rgba(190,252,101,', a: 0.16 },
      { y: 0.36, amp: 0.14, len: 0.24, speed: 0.037, phase: 2.1, hue: 'rgba(170,240,90,', a: 0.13 },
      { y: 0.54, amp: 0.11, len: 0.18, speed: 0.062, phase: 4.2, hue: 'rgba(210,255,140,', a: 0.1 },
    ];

    let w = 0;
    let h = 0;
    const SCALE = 0.42; // internal buffer downscale; blur hides it
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * SCALE));
      h = Math.max(1, Math.round(r.height * SCALE));
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let running = false;
    let t = Math.random() * 1000;
    let last = 0;

    const draw = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (now - last < 33) return; // ~30fps
      last = now;
      t += 1;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = `blur(${Math.round(h * 0.05)}px)`;
      for (const rb of ribbons) {
        const midY = h * rb.y + Math.sin(t * rb.speed + rb.phase) * h * 0.05;
        const amp = h * rb.amp;
        ctx.beginPath();
        for (let i = 0; i <= 24; i += 1) {
          const x = (i / 24) * w;
          const y =
            midY +
            Math.sin(i * 0.5 + t * rb.speed + rb.phase) * amp * 0.5 +
            Math.cos(i * 0.22 - t * rb.speed * 0.7) * amp * 0.3;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        // Glow concentrated on the right third; left half stays fully dark behind the copy.
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, rb.hue + '0)');
        grad.addColorStop(0.62, rb.hue + '0)');
        grad.addColorStop(0.86, rb.hue + rb.a + ')');
        grad.addColorStop(1, rb.hue + '0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = h * rb.len * 0.4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
    };

    const start = () => {
      if (running) return;
      running = true;
      canvas.dataset.on = 'true';
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { rootMargin: '120px' },
    );
    io.observe(canvas);
  });
}

function reveals(root) {
  const nodes = [...root.querySelectorAll('[data-reveal], [data-stagger] > *')];
  if (!nodes.length) return;
  if (reduced()) {
    nodes.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
  );
  nodes.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (inView) {
      el.classList.add('is-in');
    } else {
      el.classList.add('is-pending');
      io.observe(el);
    }
  });
}

function pinSteps(root) {
  const section = root.querySelector('.pin-section');
  if (!section) return;
  const steps = [...section.querySelectorAll('.pin-step')];
  if (!steps.length || reduced()) {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === 0));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      steps.forEach((s) => s.classList.toggle('is-active', s === visible.target));
    },
    { threshold: [0.4, 0.6, 0.8], rootMargin: '-20% 0px -30% 0px' },
  );
  steps.forEach((s) => io.observe(s));
}

function heroAiDemo(root) {
  const demo = root.querySelector('[data-ai-demo]');
  if (!demo) return;
  const qEl = demo.querySelector('[data-ai-q]');
  const aEl = demo.querySelector('[data-ai-a]');
  const citeEl = demo.querySelector('[data-ai-cite]');
  const dataTag = demo.querySelector('[data-ai-prompts]');
  if (!qEl || !aEl || !citeEl || !dataTag) return;
  if (demo.dataset.bound) return;
  demo.dataset.bound = 'true';

  let prompts;
  try {
    prompts = JSON.parse(dataTag.textContent);
  } catch {
    return;
  }
  if (!Array.isArray(prompts) || !prompts.length) return;
  if (reduced()) return; // leave the statically rendered first prompt in place

  const para = aEl.querySelector('p');
  const renderHtml = (a) =>
    a.replace('[clinic]', '<mark class="hl">').replace('[/clinic]', '</mark>');

  // Wrap the paragraph's words (and the <mark>) into tokens that reveal one at a time.
  const tokenize = () => {
    const tokens = [];
    const src = [...para.childNodes];
    para.textContent = '';
    for (const node of src) {
      if (node.nodeType === 3) {
        // "word + its surrounding spaces" per chunk, so spacing survives the reveal
        const chunks = node.textContent.match(/\s*\S+\s*/g) || [];
        for (const chunk of chunks) {
          const span = document.createElement('span');
          span.className = 'tok';
          span.textContent = chunk;
          para.appendChild(span);
          tokens.push(span);
        }
      } else {
        node.classList?.add('tok');
        para.appendChild(node);
        tokens.push(node);
      }
    }
    return tokens;
  };

  let timers = [];
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const wait = (ms) => new Promise((res) => timers.push(setTimeout(res, ms)));

  let active = true;
  const cursor = document.createElement('span');
  cursor.className = 'ai-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  async function playOne(prompt) {
    qEl.textContent = prompt.q;
    para.innerHTML = renderHtml(prompt.a);
    citeEl.textContent = prompt.cite;
    citeEl.classList.remove('show');
    aEl.classList.add('is-streaming');
    const tokens = tokenize();
    para.appendChild(cursor);
    await wait(380);
    for (const tok of tokens) {
      if (!active) return;
      tok.classList.add('show');
      para.appendChild(cursor); // keep caret at the write head
      await wait(tok.classList.contains('hl') ? 150 : 52 + Math.random() * 44);
    }
    cursor.remove();
    aEl.classList.remove('is-streaming');
    await wait(260);
    citeEl.classList.add('show');
  }

  async function loop() {
    let i = 0;
    while (active) {
      await playOne(prompts[i % prompts.length]);
      if (!active) return;
      await wait(4200);
      // gentle fade before the next answer
      aEl.style.transition = 'opacity .4s ease';
      qEl.style.transition = 'opacity .4s ease';
      aEl.style.opacity = '0';
      qEl.style.opacity = '0';
      await wait(420);
      aEl.style.opacity = '1';
      qEl.style.opacity = '1';
      i += 1;
    }
  }

  // Hero sits above the fold, so stream from blank right away.
  active = true;
  loop();
}

// Subtle vertical parallax on the hero light as the panel scrolls by.
function parallaxLight(root) {
  if (reduced()) return;
  const els = [...root.querySelectorAll('[data-parallax]')];
  if (!els.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    for (const el of els) {
      const speed = parseFloat(el.dataset.parallax) || 0.08;
      const host = el.parentElement;
      if (!host) continue;
      const rect = host.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) continue;
      const shift = Math.max(-60, Math.min(60, -rect.top * speed));
      el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

export function initMotion(root = document) {
  limeRibbons(root);
  reveals(root);
  pinSteps(root);
  heroAiDemo(root);
  parallaxLight(root);
}
