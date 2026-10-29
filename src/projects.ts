import { find, findAll, get } from './dom.ts';
import { isTag, type Tag } from './data/projects.ts';
import { GALLERIES, isGalleryId, type Gallery, type Screenshot } from './data/galleries.ts';
import { EASE_OUT, prefersReducedMotion, withViewTransition } from './motion.ts';

/* ---------- Project filter buttons ---------- */
export function initProjectFilters(): void {
  const buttons = findAll(document, '.filter-btn', HTMLButtonElement);
  const cards = findAll(document, '.project-card', HTMLElement);
  if (!buttons.length || !cards.length) return;
  const groups = findAll(document, '[data-project-group]', HTMLElement);
  const counter = find(document, '.project-count', HTMLElement);

  const applyFilter = (filter: Tag | 'all', active: HTMLButtonElement): void => {
    for (const b of buttons) {
      b.classList.toggle('active', b === active);
      b.setAttribute('aria-pressed', String(b === active));
    }
    for (const card of cards) {
      const tags = (card.dataset.tags ?? '').split(/\s+/).filter(isTag);
      card.hidden = filter !== 'all' && !tags.includes(filter);
    }
    for (const group of groups) {
      group.hidden = !group.querySelector('.project-card:not([hidden])');
    }
    const count = cards.filter((card) => !card.hidden).length;
    if (counter) counter.textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
  };

  // Each card gets a view-transition-name only while a filter animates, so the browser
  // slides cards to their new places (and fades out the hidden ones) without the names
  // leaking into page-to-page transitions.
  const nameCards = (named: boolean): void => {
    cards.forEach((card, i) => {
      if (named) {
        card.style.setProperty('view-transition-name', `project-card-${i}`);
        card.style.setProperty('view-transition-class', 'project-card');
      } else {
        card.style.removeProperty('view-transition-name');
        card.style.removeProperty('view-transition-class');
      }
    });
  };
  let transition = 0;

  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      if (filter !== 'all' && !isTag(filter)) throw new Error(`Unknown filter "${filter}"`);
      if (btn.classList.contains('active')) return;
      const mine = ++transition;
      nameCards(true);
      void withViewTransition(() => applyFilter(filter, btn)).finally(() => {
        if (mine === transition) nameCards(false);
      });
    });
  }
}

/* ---------- Project card expand/collapse ---------- */
type PanelFrame = Pick<CSSStyleDeclaration, 'height' | 'paddingTop' | 'marginTop' | 'opacity'>;

const COLLAPSED: PanelFrame = { height: '0px', paddingTop: '0px', marginTop: '0px', opacity: '0' };

function framesOf(detail: HTMLElement): PanelFrame {
  const style = getComputedStyle(detail);
  return { height: `${detail.offsetHeight}px`, paddingTop: style.paddingTop, marginTop: style.marginTop, opacity: style.opacity };
}

/** Slides a details panel open or closed, starting from wherever a running animation left it. */
function setDetailOpen(card: Element, detail: HTMLElement, open: boolean): void {
  const running = detail.getAnimations();
  const from = running.length ? framesOf(detail) : undefined;
  for (const animation of running) animation.cancel();
  if (prefersReducedMotion()) {
    card.classList.toggle('is-open', open);
    return;
  }

  card.classList.add('is-open'); // shown, so the open size can be measured
  const expanded = { ...framesOf(detail), opacity: '1' };
  detail.style.overflow = 'hidden';
  const animation = detail.animate(
    open ? [from ?? COLLAPSED, expanded] : [from ?? expanded, COLLAPSED],
    { duration: 340, easing: EASE_OUT },
  );
  animation.finished.then(
    () => {
      detail.style.overflow = '';
      if (!open) card.classList.remove('is-open');
    },
    () => { /* cancelled by a newer toggle, which takes over */ },
  );
}

export function initProjectToggles(): void {
  for (const btn of findAll(document, '.project-toggle', HTMLButtonElement)) {
    const card = btn.closest('.project-card');
    const detailId = btn.getAttribute('aria-controls');
    const detail = detailId ? document.getElementById(detailId) : null;
    if (!card || !detail) continue;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      setDetailOpen(card, detail, open);
    });
  }
}

/* ---------- Project screenshots ---------- */
function showShot(image: HTMLImageElement, shot: Screenshot): void {
  image.src = shot.src;
  image.alt = shot.alt;
  image.width = shot.width;
  image.height = shot.height;
}

/**
 * Fades the gallery out, swaps in `shot` once it has loaded (so there's never a blank
 * frame), and fades back in. `isLatest` lets a newer click abandon this one.
 */
async function crossfadeTo(image: HTMLImageElement, caption: HTMLElement, shot: Screenshot, isLatest: () => boolean): Promise<void> {
  const preload = new Image();
  preload.src = shot.src;
  const loaded = preload.decode().catch(() => undefined);
  const swap = (): void => {
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
    return el.animate({ opacity: [opacity, '0'] }, { duration: 140, easing: 'ease-in', fill: 'forwards' });
  });
  try {
    await Promise.all([loaded, ...fadeOuts.map((animation) => animation.finished)]);
  } catch {
    return; // a newer click cancelled the fade
  }
  if (!isLatest()) return;
  swap();
  // Same task as the cancel below, so no frame renders between fade-out and fade-in.
  for (const el of targets) el.animate({ opacity: ['0', '1'] }, { duration: 260, easing: EASE_OUT });
  for (const animation of fadeOuts) animation.cancel();
}

export function initProjectGalleries(): void {
  const dialog = find(document, '.screenshot-dialog', HTMLDialogElement);
  if (!dialog) return;
  const dialogTitle = get(dialog, 'h2', HTMLHeadingElement);
  const dialogImage = get(dialog, 'img', HTMLImageElement);
  const dialogCaption = get(dialog, '.screenshot-dialog-caption', HTMLElement);
  const imageContainer = get(dialog, '.screenshot-dialog-image', HTMLElement);
  const zoomButton = get(dialog, '.screenshot-zoom', HTMLButtonElement);

  const setZoom = (zoomed: boolean): void => {
    imageContainer.classList.toggle('is-zoomed', zoomed);
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.textContent = zoomed ? 'Fit to screen' : 'Zoom in';
  };

  for (const figure of findAll(document, '.project-gallery', HTMLElement)) {
    const id = figure.dataset.gallery;
    if (!isGalleryId(id)) throw new Error(`Unknown gallery "${id}"`);
    const gallery: Gallery = GALLERIES[id];
    const image = get(figure, '.screenshot-open img', HTMLImageElement);
    const caption = get(figure, 'figcaption', HTMLElement);
    const buttons = findAll(figure, '.gallery-select', HTMLButtonElement);
    let current = gallery.shots[0];
    let request = 0;

    // Selector buttons are generated from gallery.shots, in the same order.
    buttons.forEach((button, index) => {
      const shot = gallery.shots[index];
      if (!shot) return;
      button.addEventListener('click', () => {
        if (shot === current) return;
        current = shot;
        const mine = ++request;
        for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
        void crossfadeTo(image, caption, shot, () => mine === request);
      });
    });
    get(figure, '.screenshot-open', HTMLButtonElement).addEventListener('click', () => {
      dialogTitle.textContent = gallery.title;
      showShot(dialogImage, current);
      dialogCaption.textContent = current.caption;
      setZoom(false);
      dialog.showModal();
      imageContainer.scrollTo(0, 0);
    });
  }

  get(dialog, '.screenshot-close', HTMLButtonElement).addEventListener('click', () => dialog.close());
  zoomButton.addEventListener('click', () => setZoom(!imageContainer.classList.contains('is-zoomed')));
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (event.target === dialog && outside) dialog.close();
  });
}
