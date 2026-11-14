const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function hydrateVideos(root) {
  if (reduced()) return;
  if (window.matchMedia('(max-width: 700px)').matches) return;
  if (navigator.connection && (navigator.connection.saveData || (navigator.connection.downlink && navigator.connection.downlink < 1))) return;

  const videos = [...root.querySelectorAll('video.lime-video')];
  if (!videos.length) return;

  const load = (video) => {
    if (video.dataset.loaded) return;
    const webm = video.dataset.srcWebm;
    const mp4 = video.dataset.srcMp4;
    if (webm) {
      const s = document.createElement('source');
      s.src = webm;
      s.type = 'video/webm';
      video.appendChild(s);
    }
    if (mp4) {
      const s = document.createElement('source');
      s.src = mp4;
      s.type = 'video/mp4';
      video.appendChild(s);
    }
    video.dataset.loaded = 'true';
    video.load();
    video.play().catch(() => {});
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.isIntersecting) load(video);
        else if (video.dataset.loaded) video.pause();
        if (entry.isIntersecting && video.dataset.loaded) video.play().catch(() => {});
      }
    },
    { rootMargin: '80px' },
  );
  videos.forEach((v) => io.observe(v));
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

function magneticButtons(root) {
  if (reduced()) return;
  if (window.matchMedia('(hover: none)').matches) return;
  root.querySelectorAll('.btn-primary, .btn-gold').forEach((btn) => {
    if (btn.dataset.magnetic) return;
    btn.dataset.magnetic = 'true';
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${x * 0.22}px, ${y * 0.28}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
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

export function initMotion(root = document) {
  hydrateVideos(root);
  reveals(root);
  magneticButtons(root);
  pinSteps(root);
}
