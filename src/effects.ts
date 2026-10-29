import { find, findAll } from './dom.ts';
import { easeOutExpo, hasHoverPointer, prefersReducedMotion, tween } from './motion.ts';

/* ---------- Scroll reveal animations (staggered per container) ---------- */
export function initScrollReveal(): void {
  const targets = findAll(document, '.reveal', HTMLElement);
  if (!targets.length) return;

  const groups = new Map<Element | null, HTMLElement[]>();
  for (const el of targets) {
    const siblings = groups.get(el.parentElement) ?? [];
    siblings.push(el);
    groups.set(el.parentElement, siblings);
  }
  groups.forEach((siblings) => {
    siblings.forEach((el, i) => {
      el.style.transitionDelay = `${i * 60}ms`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );
  for (const el of targets) observer.observe(el);
}

/* ---------- Animated monochrome background (soft drifting glow, canvas 2D) ---------- */
interface Orb {
  baseX: number;
  baseY: number;
  r: number;
  speed: number;
  offset: number;
  /** How strongly this orb follows the pointer and scroll; bigger orbs feel closer. */
  depth: number;
}

export function initBackgroundCanvas(): void {
  const canvas = find(document, '#bg-canvas', HTMLCanvasElement);
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  const reduceMotion = prefersReducedMotion();

  let w = 0;
  let h = 0;
  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const orbs: Orb[] = Array.from({ length: 4 }, (_, i) => ({
    baseX: Math.random(),
    baseY: Math.random(),
    r: 260 + i * 60,
    speed: 0.00025 + i * 0.00008,
    offset: i * 120,
    depth: 0.6 + i * 0.25,
  }));

  // The glow leans toward the pointer and swirls a little as the page scrolls.
  // `pointer` is where the mouse is (-0.5…0.5 of the viewport); `lean` eases toward it.
  const pointer = { x: 0, y: 0 };
  const lean = { x: 0, y: 0 };
  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX / w - 0.5;
      pointer.y = e.clientY / h - 0.5;
    }, { passive: true });
  }

  const frame = (t: number): void => {
    lean.x += (pointer.x - lean.x) * 0.04;
    lean.y += (pointer.y - lean.y) * 0.04;
    const scroll = reduceMotion ? 0 : window.scrollY;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const orb of orbs) {
      const angle = t * orb.speed + orb.offset + scroll * 0.0006 * orb.depth;
      const x = (orb.baseX * w) + Math.cos(angle) * w * 0.18 + lean.x * 90 * orb.depth;
      const y = (orb.baseY * h) + Math.sin(angle * 0.8) * h * 0.18 + lean.y * 90 * orb.depth;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.r);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  if (reduceMotion) frame(0);
}

/* ---------- Terminal typing effect (home hero) ---------- */
/** A typed command, or a line of output printed all at once. */
type TerminalLine = { cmd: string } | { out: string };

const TERMINAL_LINES: readonly TerminalLine[] = [
  { cmd: 'whoami' },
  { out: 'AI & Cybersecurity student · Former Solutions Engineer @ Microsoft' },
  { cmd: 'cat focus.txt' },
  { out: 'Blue team defense · Prompt security · Applied ML' },
  { cmd: 'ls certifications/' },
  { out: 'CySA+  Security+  SecAI+  Network+  AZ-900  AB-900' },
  { cmd: './connect --location "Brussels, BE"' },
  { out: 'status: open to opportunities ✓' },
];

export function initTerminal(): void {
  const el = find(document, '.terminal-body', HTMLElement);
  if (!el) return;
  el.replaceChildren();
  let lineIndex = 0;

  const typeLine = (): void => {
    const line = TERMINAL_LINES[lineIndex++];
    if (!line) {
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      el.appendChild(cursor);
      return;
    }
    const row = document.createElement('div');
    row.className = 'terminal-line';
    el.appendChild(row);

    if ('cmd' in line) {
      const promptSpan = document.createElement('span');
      promptSpan.className = 'prompt';
      promptSpan.textContent = '$';
      const cmdSpan = document.createElement('span');
      row.append(promptSpan, cmdSpan);

      const { cmd } = line;
      let typed = 0;
      const typer = setInterval(() => {
        cmdSpan.textContent = cmd.slice(0, ++typed);
        if (typed >= cmd.length) {
          clearInterval(typer);
          setTimeout(typeLine, 220);
        }
      }, 32);
    } else {
      row.classList.add('out');
      row.textContent = line.out;
      setTimeout(typeLine, 260);
    }
  };

  typeLine();
}

/* ---------- Count-up metrics ([data-count-up]) ---------- */
/** A number at the start of an element's first text node, e.g. "97.7" or "97.7%". */
interface Counter {
  node: Text;
  value: number;
  decimals: number;
  suffix: string;
}

function readCounter(el: Element): Counter | null {
  const node = el.firstChild;
  if (!(node instanceof Text)) return null;
  const match = /^(\d+)(?:\.(\d+))?(.*)$/s.exec(node.data.trim());
  if (!match) return null;
  const [, whole = '', fraction = '', suffix = ''] = match;
  return { node, value: Number(`${whole}.${fraction || 0}`), decimals: fraction.length, suffix };
}

function renderCounter(counter: Counter, value: number): void {
  counter.node.data = value.toFixed(counter.decimals) + counter.suffix;
}

export function initCountUp(): void {
  if (prefersReducedMotion()) return;
  const counters = new Map<Element, Counter>();
  for (const el of findAll(document, '[data-count-up]', HTMLElement)) {
    const counter = readCounter(el);
    if (counter) counters.set(el, counter);
  }
  if (!counters.size) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const counter = counters.get(entry.target);
      if (!entry.isIntersecting || !counter) continue;
      observer.unobserve(entry.target);
      void tween({
        from: 0,
        to: counter.value,
        duration: 1600,
        easing: easeOutExpo,
        onUpdate: (value) => renderCounter(counter, value),
      });
    }
  }, { threshold: 0.6 });

  counters.forEach((counter, el) => {
    renderCounter(counter, 0);
    observer.observe(el);
  });
}

/* ---------- Cursor spotlight on cards ---------- */
export function initCardSpotlight(): void {
  if (!hasHoverPointer()) return;
  for (const card of findAll(document, '.project-card, .work-preview', HTMLElement)) {
    card.addEventListener('pointermove', (e) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${e.clientX - bounds.left}px`);
      card.style.setProperty('--spot-y', `${e.clientY - bounds.top}px`);
    });
  }
}

/* ---------- Scroll progress line (under the navbar) ---------- */
export function initScrollProgress(): void {
  const navbar = find(document, '.navbar', HTMLElement);
  if (!navbar) return;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  navbar.append(bar);

  // Browsers with scroll-driven animations run it entirely in CSS.
  if (CSS.supports('animation-timeline: scroll()')) return;
  const update = (): void => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}
