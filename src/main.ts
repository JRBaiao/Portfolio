// ===========================================================
// João Baião — Portfolio interactivity
// Bundled into js/script.js by `npm run build`.
// ===========================================================

import { initActiveNavLink, initBackToTop, initFooterYear, initMobileNav } from './nav.ts';
import {
  initBackgroundCanvas,
  initCardSpotlight,
  initCountUp,
  initScrollProgress,
  initScrollReveal,
  initTerminal,
} from './effects.ts';
import { initProjectFilters, initProjectGalleries, initProjectToggles } from './projects.ts';
import { initContactForm, initCopyEmail } from './contact.ts';
import { initHeroSmoke } from './smoke.ts';

const features: Array<() => void> = [
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
  initCopyEmail,
];

document.addEventListener('DOMContentLoaded', () => {
  // One broken feature shouldn't take the rest of the page down with it.
  for (const init of features) {
    try {
      init();
    } catch (error) {
      console.error(`${init.name} failed:`, error);
    }
  }
});
