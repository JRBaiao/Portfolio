import { find } from './dom.ts';

const EMAIL = 'joaorafaelavancinibaiao4@gmail.com';

/* ---------- Contact form (mailto handoff, no backend) ---------- */
export function initContactForm(): void {
  const form = find(document, '#contact-form', HTMLFormElement);
  if (!form) return;
  const field = (name: string): string => {
    const el = form.elements.namedItem(name);
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value.trim() : '';
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = field('name');
    const email = field('email');
    const message = field('message');
    const subject = encodeURIComponent(`Portfolio contact from ${name || 'website visitor'}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    showToast('Draft opened in your email app — review it and press send there. Nothing opened? Use the email address on this page.', 6000);
  });
}

/* ---------- Toast ---------- */
let toastTimer: number | undefined;

export function showToast(message: string, duration = 2200): void {
  const toast = find(document, '.toast', HTMLElement);
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), duration);
}

/* ---------- Copy email to clipboard ---------- */
export function initCopyEmail(): void {
  const btn = find(document, '.copy-email', HTMLElement);
  const email = btn?.dataset.email;
  if (!btn || !email) return;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied to clipboard');
    } catch {
      showToast(email);
    }
  });
}
