// Shared animation helpers. Everything scripted goes through prefersReducedMotion(),
// so visitors who ask their OS for less motion get the end state straight away.

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion(): boolean {
  return reducedMotionQuery.matches;
}

/** Fine pointer that can hover (mouse, trackpad), as opposed to touch. */
export function hasHoverPointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export type Easing = (progress: number) => number;

export const easeOutCubic: Easing = (t) => 1 - (1 - t) ** 3;
export const easeOutExpo: Easing = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Matching curve for CSS and the Web Animations API. */
export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

export interface Tween {
  from: number;
  to: number;
  /** Milliseconds. */
  duration: number;
  easing?: Easing;
  onUpdate: (value: number) => void;
}

/** Animates a number from `from` to `to`, resolving when it lands on `to`. */
export function tween({ from, to, duration, easing = easeOutCubic, onUpdate }: Tween): Promise<void> {
  if (prefersReducedMotion() || duration <= 0) {
    onUpdate(to);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let start: number | undefined;
    const step = (now: number): void => {
      start ??= now;
      const progress = Math.min((now - start) / duration, 1);
      onUpdate(from + (to - from) * easing(progress));
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

/**
 * Applies a DOM change inside a View Transition, so the browser animates from the old
 * layout to the new one. Browsers without the API just apply the change.
 */
export function withViewTransition(update: () => void): Promise<void> {
  if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
    update();
    return Promise.resolve();
  }
  return document.startViewTransition(update).finished;
}
