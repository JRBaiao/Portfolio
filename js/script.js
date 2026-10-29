// Built from src/ by npm run build:js. Edit the TypeScript sources, not this file.
"use strict";
(() => {
  // src/dom.ts
  function find(root, selector, type) {
    const el = root.querySelector(selector);
    return el instanceof type ? el : null;
  }
  function get(root, selector, type) {
    const el = find(root, selector, type);
    if (!el) throw new Error(`Expected ${type.name} matching "${selector}"`);
    return el;
  }
  function findAll(root, selector, type) {
    return [...root.querySelectorAll(selector)].filter((el) => el instanceof type);
  }

  // src/nav.ts
  function initMobileNav() {
    const navbar = find(document, ".navbar", HTMLElement);
    const toggle = find(document, ".nav-toggle", HTMLButtonElement);
    if (!navbar || !toggle) return;
    const setOpen = (open) => {
      navbar.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => setOpen(!navbar.classList.contains("is-open")));
    for (const link of findAll(navbar, ".nav-links a", HTMLAnchorElement)) {
      link.addEventListener("click", () => setOpen(false));
    }
  }
  function initActiveNavLink() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    for (const link of findAll(document, ".nav-links a", HTMLAnchorElement)) {
      if (link.getAttribute("href") === path) link.classList.add("active");
    }
  }
  function initBackToTop() {
    const btn = find(document, ".back-to-top", HTMLButtonElement);
    if (!btn) return;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("is-visible", window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
  function initFooterYear() {
    const el = find(document, "#year", HTMLElement);
    if (el) el.textContent = String((/* @__PURE__ */ new Date()).getFullYear());
  }

  // src/motion.ts
  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function prefersReducedMotion() {
    return reducedMotionQuery.matches;
  }
  function hasHoverPointer() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }
  var easeOutCubic = (t) => 1 - (1 - t) ** 3;
  var easeOutExpo = (t) => t >= 1 ? 1 : 1 - 2 ** (-10 * t);
  var EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
  function tween({ from, to, duration, easing = easeOutCubic, onUpdate }) {
    if (prefersReducedMotion() || duration <= 0) {
      onUpdate(to);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let start;
      const step = (now) => {
        start ??= now;
        const progress = Math.min((now - start) / duration, 1);
        onUpdate(from + (to - from) * easing(progress));
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }
  function withViewTransition(update) {
    if (prefersReducedMotion() || typeof document.startViewTransition !== "function") {
      update();
      return Promise.resolve();
    }
    return document.startViewTransition(update).finished;
  }

  // src/effects.ts
  function initScrollReveal() {
    const targets = findAll(document, ".reveal", HTMLElement);
    if (!targets.length) return;
    const groups = /* @__PURE__ */ new Map();
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
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    for (const el of targets) observer.observe(el);
  }
  function initBackgroundCanvas() {
    const canvas = find(document, "#bg-canvas", HTMLCanvasElement);
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduceMotion = prefersReducedMotion();
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const orbs = Array.from({ length: 4 }, (_, i) => ({
      baseX: Math.random(),
      baseY: Math.random(),
      r: 260 + i * 60,
      speed: 25e-5 + i * 8e-5,
      offset: i * 120,
      depth: 0.6 + i * 0.25
    }));
    const pointer = { x: 0, y: 0 };
    const lean = { x: 0, y: 0 };
    if (!reduceMotion) {
      window.addEventListener("pointermove", (e) => {
        pointer.x = e.clientX / w - 0.5;
        pointer.y = e.clientY / h - 0.5;
      }, { passive: true });
    }
    const frame = (t) => {
      lean.x += (pointer.x - lean.x) * 0.04;
      lean.y += (pointer.y - lean.y) * 0.04;
      const scroll = reduceMotion ? 0 : window.scrollY;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const orb of orbs) {
        const angle = t * orb.speed + orb.offset + scroll * 6e-4 * orb.depth;
        const x = orb.baseX * w + Math.cos(angle) * w * 0.18 + lean.x * 90 * orb.depth;
        const y = orb.baseY * h + Math.sin(angle * 0.8) * h * 0.18 + lean.y * 90 * orb.depth;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.r);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }
      if (!reduceMotion) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    if (reduceMotion) frame(0);
  }
  var TERMINAL_LINES = [
    { cmd: "whoami" },
    { out: "AI & Cybersecurity student \xB7 Former Solutions Engineer @ Microsoft" },
    { cmd: "cat focus.txt" },
    { out: "Blue team defense \xB7 Prompt security \xB7 Applied ML" },
    { cmd: "ls certifications/" },
    { out: "CySA+  Security+  SecAI+  Network+  AZ-900  AB-900" },
    { cmd: './connect --location "Brussels, BE"' },
    { out: "status: open to opportunities \u2713" }
  ];
  function initTerminal() {
    const el = find(document, ".terminal-body", HTMLElement);
    if (!el) return;
    el.replaceChildren();
    let lineIndex = 0;
    const typeLine = () => {
      const line = TERMINAL_LINES[lineIndex++];
      if (!line) {
        const cursor = document.createElement("span");
        cursor.className = "terminal-cursor";
        el.appendChild(cursor);
        return;
      }
      const row = document.createElement("div");
      row.className = "terminal-line";
      el.appendChild(row);
      if ("cmd" in line) {
        const promptSpan = document.createElement("span");
        promptSpan.className = "prompt";
        promptSpan.textContent = "$";
        const cmdSpan = document.createElement("span");
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
        row.classList.add("out");
        row.textContent = line.out;
        setTimeout(typeLine, 260);
      }
    };
    typeLine();
  }
  function readCounter(el) {
    const node = el.firstChild;
    if (!(node instanceof Text)) return null;
    const match = /^(\d+)(?:\.(\d+))?(.*)$/s.exec(node.data.trim());
    if (!match) return null;
    const [, whole = "", fraction = "", suffix = ""] = match;
    return { node, value: Number(`${whole}.${fraction || 0}`), decimals: fraction.length, suffix };
  }
  function renderCounter(counter, value) {
    counter.node.data = value.toFixed(counter.decimals) + counter.suffix;
  }
  function initCountUp() {
    if (prefersReducedMotion()) return;
    const counters = /* @__PURE__ */ new Map();
    for (const el of findAll(document, "[data-count-up]", HTMLElement)) {
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
          onUpdate: (value) => renderCounter(counter, value)
        });
      }
    }, { threshold: 0.6 });
    counters.forEach((counter, el) => {
      renderCounter(counter, 0);
      observer.observe(el);
    });
  }
  function initCardSpotlight() {
    if (!hasHoverPointer()) return;
    for (const card of findAll(document, ".project-card, .work-preview", HTMLElement)) {
      card.addEventListener("pointermove", (e) => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${e.clientX - bounds.left}px`);
        card.style.setProperty("--spot-y", `${e.clientY - bounds.top}px`);
      });
    }
  }
  function initScrollProgress() {
    const navbar = find(document, ".navbar", HTMLElement);
    if (!navbar) return;
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    navbar.append(bar);
    if (CSS.supports("animation-timeline: scroll()")) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  // src/data/projects.ts
  var TAGS = {
    ai: "AI",
    security: "Security",
    automation: "Automation",
    vision: "Computer Vision",
    data: "Data",
    app: "App"
  };
  function isTag(value) {
    return value !== void 0 && Object.hasOwn(TAGS, value);
  }

  // src/data/galleries.ts
  var GALLERIES = {
    "phishing-agent": {
      title: "Phishing Investigation Agent",
      loading: "eager",
      // first thing on the projects page, and the target of the home page morph
      shots: [
        {
          label: "Investigation",
          src: "assets/projects/phishing-terminal.png",
          width: 1192,
          height: 1039,
          alt: "Terminal investigation showing a phishing verdict, deterministic findings, and verification warnings.",
          caption: "Email evidence, explainable findings, and warnings when model claims are unsupported."
        },
        {
          label: "Analyst report",
          src: "assets/projects/phishing-report.png",
          width: 1920,
          height: 1660,
          alt: "Generated phishing investigation report with an executive summary and supporting email evidence.",
          caption: "A generated analyst report ties the verdict back to the original email evidence."
        }
      ]
    },
    "ai-scorecard": {
      title: "AI Procurement Scorecard",
      shots: [
        {
          label: "Overview",
          src: "assets/projects/scorecard-overview.png",
          width: 3006,
          height: 1642,
          alt: "AI Procurement Scorecard landing page with a guided evaluation and example readiness score.",
          caption: "A guided workflow for evaluating AI procurement readiness."
        },
        {
          label: "Assessment",
          src: "assets/projects/scorecard-assessment.png",
          width: 3006,
          height: 1536,
          alt: "AI assessment screen showing procurement blockers and evidence review.",
          caption: "Assessment review brings blockers, evidence, and evaluator confirmation together."
        },
        {
          label: "Category scores",
          src: "assets/projects/scorecard-categories.png",
          width: 3006,
          height: 1068,
          alt: "Readiness dashboard with a radar chart and scores by assessment category.",
          caption: "Category scores make gaps visible through a radar chart and ranked breakdown."
        },
        {
          label: "Answer breakdown",
          src: "assets/projects/scorecard-breakdown.png",
          width: 2614,
          height: 1004,
          alt: "Answer breakdown showing readiness scores and responses across governance categories.",
          caption: "An answer-level breakdown connects each category to its supporting responses."
        }
      ]
    },
    "prompt-injection": {
      title: "Prompt Injection Simulator",
      shots: [
        {
          label: "Simulator",
          src: "assets/projects/prompt-injection-simulator.png",
          width: 2992,
          height: 1472,
          alt: "Prompt Injection Simulator showing six attack scenarios and a defended role-hijack attempt with the model response.",
          caption: "A role-hijack attempt marked as defended, with the model response available for inspection."
        }
      ]
    }
  };
  function isGalleryId(value) {
    return value !== void 0 && Object.hasOwn(GALLERIES, value);
  }

  // src/projects.ts
  function initProjectFilters() {
    const buttons = findAll(document, ".filter-btn", HTMLButtonElement);
    const cards = findAll(document, ".project-card", HTMLElement);
    if (!buttons.length || !cards.length) return;
    const groups = findAll(document, "[data-project-group]", HTMLElement);
    const counter = find(document, ".project-count", HTMLElement);
    const applyFilter = (filter, active) => {
      for (const b of buttons) {
        b.classList.toggle("active", b === active);
        b.setAttribute("aria-pressed", String(b === active));
      }
      for (const card of cards) {
        const tags = (card.dataset.tags ?? "").split(/\s+/).filter(isTag);
        card.hidden = filter !== "all" && !tags.includes(filter);
      }
      for (const group of groups) {
        group.hidden = !group.querySelector(".project-card:not([hidden])");
      }
      const count = cards.filter((card) => !card.hidden).length;
      if (counter) counter.textContent = `${count} ${count === 1 ? "project" : "projects"}`;
    };
    const nameCards = (named) => {
      cards.forEach((card, i) => {
        if (named) {
          card.style.setProperty("view-transition-name", `project-card-${i}`);
          card.style.setProperty("view-transition-class", "project-card");
        } else {
          card.style.removeProperty("view-transition-name");
          card.style.removeProperty("view-transition-class");
        }
      });
    };
    let transition = 0;
    for (const btn of buttons) {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;
        if (filter !== "all" && !isTag(filter)) throw new Error(`Unknown filter "${filter}"`);
        if (btn.classList.contains("active")) return;
        const mine = ++transition;
        nameCards(true);
        void withViewTransition(() => applyFilter(filter, btn)).finally(() => {
          if (mine === transition) nameCards(false);
        });
      });
    }
  }
  var COLLAPSED = { height: "0px", paddingTop: "0px", marginTop: "0px", opacity: "0" };
  function framesOf(detail) {
    const style = getComputedStyle(detail);
    return { height: `${detail.offsetHeight}px`, paddingTop: style.paddingTop, marginTop: style.marginTop, opacity: style.opacity };
  }
  function setDetailOpen(card, detail, open) {
    const running = detail.getAnimations();
    const from = running.length ? framesOf(detail) : void 0;
    for (const animation2 of running) animation2.cancel();
    if (prefersReducedMotion()) {
      card.classList.toggle("is-open", open);
      return;
    }
    card.classList.add("is-open");
    const expanded = { ...framesOf(detail), opacity: "1" };
    detail.style.overflow = "hidden";
    const animation = detail.animate(
      open ? [from ?? COLLAPSED, expanded] : [from ?? expanded, COLLAPSED],
      { duration: 340, easing: EASE_OUT }
    );
    animation.finished.then(
      () => {
        detail.style.overflow = "";
        if (!open) card.classList.remove("is-open");
      },
      () => {
      }
    );
  }
  function initProjectToggles() {
    for (const btn of findAll(document, ".project-toggle", HTMLButtonElement)) {
      const card = btn.closest(".project-card");
      const detailId = btn.getAttribute("aria-controls");
      const detail = detailId ? document.getElementById(detailId) : null;
      if (!card || !detail) continue;
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        setDetailOpen(card, detail, open);
      });
    }
  }
  function showShot(image, shot) {
    image.src = shot.src;
    image.alt = shot.alt;
    image.width = shot.width;
    image.height = shot.height;
  }
  async function crossfadeTo(image, caption, shot, isLatest) {
    const preload = new Image();
    preload.src = shot.src;
    const loaded = preload.decode().catch(() => void 0);
    const swap = () => {
      showShot(image, shot);
      caption.textContent = shot.caption;
    };
    if (prefersReducedMotion()) {
      await loaded;
      if (isLatest()) swap();
      return;
    }
    const targets = [image, caption];
    const fadeOuts = targets.map((el) => {
      const opacity = getComputedStyle(el).opacity;
      for (const animation of el.getAnimations()) animation.cancel();
      return el.animate({ opacity: [opacity, "0"] }, { duration: 140, easing: "ease-in", fill: "forwards" });
    });
    try {
      await Promise.all([loaded, ...fadeOuts.map((animation) => animation.finished)]);
    } catch {
      return;
    }
    if (!isLatest()) return;
    swap();
    for (const el of targets) el.animate({ opacity: ["0", "1"] }, { duration: 260, easing: EASE_OUT });
    for (const animation of fadeOuts) animation.cancel();
  }
  function initProjectGalleries() {
    const dialog = find(document, ".screenshot-dialog", HTMLDialogElement);
    if (!dialog) return;
    const dialogTitle = get(dialog, "h2", HTMLHeadingElement);
    const dialogImage = get(dialog, "img", HTMLImageElement);
    const dialogCaption = get(dialog, ".screenshot-dialog-caption", HTMLElement);
    const imageContainer = get(dialog, ".screenshot-dialog-image", HTMLElement);
    const zoomButton = get(dialog, ".screenshot-zoom", HTMLButtonElement);
    const setZoom = (zoomed) => {
      imageContainer.classList.toggle("is-zoomed", zoomed);
      zoomButton.setAttribute("aria-pressed", String(zoomed));
      zoomButton.textContent = zoomed ? "Fit to screen" : "Zoom in";
    };
    for (const figure of findAll(document, ".project-gallery", HTMLElement)) {
      const id = figure.dataset.gallery;
      if (!isGalleryId(id)) throw new Error(`Unknown gallery "${id}"`);
      const gallery = GALLERIES[id];
      const image = get(figure, ".screenshot-open img", HTMLImageElement);
      const caption = get(figure, "figcaption", HTMLElement);
      const buttons = findAll(figure, ".gallery-select", HTMLButtonElement);
      let current = gallery.shots[0];
      let request = 0;
      buttons.forEach((button, index) => {
        const shot = gallery.shots[index];
        if (!shot) return;
        button.addEventListener("click", () => {
          if (shot === current) return;
          current = shot;
          const mine = ++request;
          for (const item of buttons) item.setAttribute("aria-pressed", String(item === button));
          void crossfadeTo(image, caption, shot, () => mine === request);
        });
      });
      get(figure, ".screenshot-open", HTMLButtonElement).addEventListener("click", () => {
        dialogTitle.textContent = gallery.title;
        showShot(dialogImage, current);
        dialogCaption.textContent = current.caption;
        setZoom(false);
        dialog.showModal();
        imageContainer.scrollTo(0, 0);
      });
    }
    get(dialog, ".screenshot-close", HTMLButtonElement).addEventListener("click", () => dialog.close());
    zoomButton.addEventListener("click", () => setZoom(!imageContainer.classList.contains("is-zoomed")));
    dialog.addEventListener("click", (event) => {
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (event.target === dialog && outside) dialog.close();
    });
  }

  // src/contact.ts
  var EMAIL = "joaorafaelavancinibaiao4@gmail.com";
  function initContactForm() {
    const form = find(document, "#contact-form", HTMLFormElement);
    if (!form) return;
    const field = (name) => {
      const el = form.elements.namedItem(name);
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value.trim() : "";
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = field("name");
      const email = field("email");
      const message = field("message");
      const subject = encodeURIComponent(`Portfolio contact from ${name || "website visitor"}`);
      const body = encodeURIComponent(`${message}

\u2014 ${name} (${email})`);
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      showToast("Draft opened in your email app \u2014 review it and press send there. Nothing opened? Use the email address on this page.", 6e3);
    });
  }
  var toastTimer;
  function showToast(message, duration = 2200) {
    const toast = find(document, ".toast", HTMLElement);
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
  }
  function initCopyEmail() {
    const btn = find(document, ".copy-email", HTMLElement);
    const email = btn?.dataset.email;
    if (!btn || !email) return;
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(email);
        showToast("Email copied to clipboard");
      } catch {
        showToast(email);
      }
    });
  }

  // src/smoke.ts
  var VERTEX_SHADER = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;
  var FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.0 + 17.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.y * 1.6;
  float t = uTime * 0.035;
  uv.y -= t * 1.4; // the whole field rises slowly

  vec2 q = vec2(fbm(uv + vec2(0.0, t)), fbm(uv + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(uv + 3.0 * q + vec2(1.7, 9.2) + 0.6 * t),
                fbm(uv + 3.0 * q + vec2(8.3, 2.8) - 0.4 * t));
  float density = smoothstep(0.42, 0.95, fbm(uv + 2.5 * r));

  vec3 color = mix(vec3(0.62, 0.78, 0.82), vec3(0.96), density); // faint cyan in the thin parts
  float alpha = density * 0.55;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
  var RESOLUTION_SCALE = 0.5;
  var FRAME_INTERVAL_MS = 1e3 / 30;
  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Could not create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader) ?? "unknown error"}`);
    }
    return shader;
  }
  function createProgram(gl) {
    const program = gl.createProgram();
    if (!program) throw new Error("Could not create shader program");
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Shader program failed to link: ${gl.getProgramInfoLog(program) ?? "unknown error"}`);
    }
    return program;
  }
  function initHeroSmoke() {
    const canvas = find(document, ".hero-smoke", HTMLCanvasElement);
    const gl = canvas?.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
    if (!canvas || !gl) return;
    const program = createProgram(gl);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "uResolution");
    const time = gl.getUniformLocation(program, "uTime");
    const resize = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth * RESOLUTION_SCALE));
      const height = Math.max(1, Math.round(canvas.clientHeight * RESOLUTION_SCALE));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolution, width, height);
    };
    const startOffset = Math.random() * 1e3;
    const draw = (now) => {
      resize();
      gl.uniform1f(time, startOffset + now / 1e3);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const reveal = () => canvas.classList.add("is-ready");
    if (prefersReducedMotion()) {
      draw(0);
      reveal();
      new ResizeObserver(() => draw(0)).observe(canvas);
      return;
    }
    let visible = true;
    let frame = 0;
    let lastDraw = -Infinity;
    const loop = (now) => {
      frame = 0;
      if (!visible) return;
      if (now - lastDraw >= FRAME_INTERVAL_MS) {
        lastDraw = now;
        draw(now);
      }
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (visible && !frame) frame = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      start();
    }).observe(canvas);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      visible = false;
      canvas.classList.remove("is-ready");
    });
    draw(performance.now());
    reveal();
    start();
  }

  // src/main.ts
  var features = [
    initBackgroundCanvas,
    initHeroSmoke,
    initMobileNav,
    initActiveNavLink,
    initScrollReveal,
    initScrollProgress,
    initCountUp,
    initCardSpotlight,
    initBackToTop,
    initFooterYear,
    initTerminal,
    initProjectFilters,
    initProjectToggles,
    initProjectGalleries,
    initContactForm,
    initCopyEmail
  ];
  document.addEventListener("DOMContentLoaded", () => {
    for (const init of features) {
      try {
        init();
      } catch (error) {
        console.error(`${init.name} failed:`, error);
      }
    }
  });
})();
