// Typed query helpers. Each takes the element class it expects (HTMLButtonElement,
// HTMLDialogElement, …) and checks it at runtime, so a renamed class or a changed
// tag in the HTML shows up as a clear error instead of "cannot read properties of null".

type ElementClass<T extends Element> = { new (): T; prototype: T; readonly name: string };

/** First match that is a `type`, or null when this page doesn't have one. */
export function find<T extends Element>(root: ParentNode, selector: string, type: ElementClass<T>): T | null {
  const el = root.querySelector(selector);
  return el instanceof type ? el : null;
}

/** Like `find`, for markup a feature can't work without: throws instead of returning null. */
export function get<T extends Element>(root: ParentNode, selector: string, type: ElementClass<T>): T {
  const el = find(root, selector, type);
  if (!el) throw new Error(`Expected ${type.name} matching "${selector}"`);
  return el;
}

export function findAll<T extends Element>(root: ParentNode, selector: string, type: ElementClass<T>): T[] {
  return [...root.querySelectorAll(selector)].filter((el): el is T => el instanceof type);
}
