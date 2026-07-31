// ===========================================================
// João Baião — Portfolio interactivity
// ===========================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initBackgroundCanvas();
  initMobileNav();
  initActiveNavLink();
  initScrollReveal();
  initBackToTop();
  initFooterYear();
  initTerminal();
  initProjectFilters();
  initProjectToggles();
  initContactForm();
  initCopyEmail();
});

/* ---------- Theme toggle (persisted) ---------- */
function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = stored || (prefersLight ? 'light' : 'dark');
  root.setAttribute('data-theme', initial);

  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

/* ---------- Mobile nav ---------- */
function initMobileNav() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  if (!navbar || !toggle) return;
  toggle.addEventListener('click', () => {
    navbar.classList.toggle('is-open');
    toggle.classList.toggle('is-open');
  });
  navbar.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      navbar.classList.remove('is-open');
      toggle.classList.remove('is-open');
    });
  });
}

/* ---------- Highlight active nav link ---------- */
function initActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === path) link.classList.add('active');
  });
}

/* ---------- Scroll reveal animations (staggered per container) ---------- */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  const groups = new Map();
  targets.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach((siblings) => {
    siblings.forEach((el, i) => {
      el.style.transitionDelay = `${i * 60}ms`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => observer.observe(el));
}

/* ---------- Animated monochrome background (soft drifting glow, canvas 2D) ---------- */
function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const orbs = Array.from({ length: 4 }, (_, i) => ({
    baseX: Math.random(),
    baseY: Math.random(),
    r: 260 + i * 60,
    speed: 0.00025 + i * 0.00008,
    offset: i * 120,
  }));

  function frame(t) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    orbs.forEach((orb) => {
      const angle = t * orb.speed + orb.offset;
      const x = (orb.baseX * w) + Math.cos(angle) * w * 0.18;
      const y = (orb.baseY * h) + Math.sin(angle * 0.8) * h * 0.18;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.r);
      const color = isLight ? '10,10,10' : '255,255,255';
      gradient.addColorStop(0, `rgba(${color}, 0.05)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    });
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reduceMotion) frame(0);
}

/* ---------- Back to top ---------- */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 500);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Footer year ---------- */
function initFooterYear() {
  const el = document.querySelector('#year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Terminal typing effect (home hero) ---------- */
function initTerminal() {
  const el = document.querySelector('.terminal-body');
  if (!el) return;

  const lines = [
    { prompt: 'joao@portfolio', cmd: 'whoami' },
    { out: 'AI & Cybersecurity student · Former Solutions Engineer @ Microsoft' },
    { prompt: 'joao@portfolio', cmd: 'cat focus.txt' },
    { out: 'Blue team defense · Prompt security · Applied ML' },
    { prompt: 'joao@portfolio', cmd: 'ls certifications/' },
    { out: 'CySA+  Security+  SecAI+  Network+  AWS-Sec' },
    { prompt: 'joao@portfolio', cmd: './connect --location "Brussels, BE"' },
    { out: 'status: open to opportunities ✓' },
  ];

  el.innerHTML = '';
  let lineIndex = 0;

  function typeLine() {
    if (lineIndex >= lines.length) {
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      el.appendChild(cursor);
      return;
    }
    const line = lines[lineIndex];
    const row = document.createElement('div');
    row.className = 'terminal-line';
    el.appendChild(row);

    if (line.cmd) {
      const promptSpan = document.createElement('span');
      promptSpan.className = 'prompt';
      promptSpan.textContent = '$';
      row.appendChild(promptSpan);
      const cmdSpan = document.createElement('span');
      row.appendChild(cmdSpan);

      let i = 0;
      const typer = setInterval(() => {
        cmdSpan.textContent += line.cmd[i];
        i++;
        if (i >= line.cmd.length) {
          clearInterval(typer);
          lineIndex++;
          setTimeout(typeLine, 220);
        }
      }, 32);
    } else {
      row.classList.add('out');
      row.textContent = line.out;
      lineIndex++;
      setTimeout(typeLine, 260);
    }
  }

  typeLine();
}

/* ---------- Project filter buttons ---------- */
function initProjectFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  if (!buttons.length || !cards.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach((card) => {
        const tags = card.dataset.tags || '';
        const show = filter === 'all' || tags.includes(filter);
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* ---------- Project card expand/collapse ---------- */
function initProjectToggles() {
  document.querySelectorAll('.project-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.project-card').classList.toggle('is-open');
    });
  });
}

/* ---------- Contact form (mailto handoff, no backend) ---------- */
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const subject = encodeURIComponent(`Portfolio contact from ${name || 'website visitor'}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:joaorafaelavancinibaiao4@gmail.com?subject=${subject}&body=${body}`;
  });
}

/* ---------- Copy email to clipboard ---------- */
function initCopyEmail() {
  const btn = document.querySelector('.copy-email');
  const toast = document.querySelector('.toast');
  if (!btn || !toast) return;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      toast.textContent = 'Email copied to clipboard';
    } catch {
      toast.textContent = email;
    }
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 2200);
  });
}
