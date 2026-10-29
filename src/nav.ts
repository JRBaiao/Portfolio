import { find, findAll } from './dom.ts';

/* ---------- Mobile nav ---------- */
export function initMobileNav(): void {
  const navbar = find(document, '.navbar', HTMLElement);
  const toggle = find(document, '.nav-toggle', HTMLButtonElement);
  if (!navbar || !toggle) return;
  const setOpen = (open: boolean): void => {
    navbar.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(!navbar.classList.contains('is-open')));
  for (const link of findAll(navbar, '.nav-links a', HTMLAnchorElement)) {
    link.addEventListener('click', () => setOpen(false));
  }
}

/* ---------- Highlight active nav link ---------- */
export function initActiveNavLink(): void {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  for (const link of findAll(document, '.nav-links a', HTMLAnchorElement)) {
    if (link.getAttribute('href') === path) link.classList.add('active');
  }
}

/* ---------- Back to top ---------- */
export function initBackToTop(): void {
  const btn = find(document, '.back-to-top', HTMLButtonElement);
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Footer year ---------- */
export function initFooterYear(): void {
  const el = find(document, '#year', HTMLElement);
  if (el) el.textContent = String(new Date().getFullYear());
}
