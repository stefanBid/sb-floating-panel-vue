/** Marks the hidden elements placed around a teleported panel to keep the Tab order. */
export const FOCUS_GUARD_ATTRIBUTE = 'data-sbf-focus-guard';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[tabindex]',
  '[contenteditable="true"]',
].join(',');

const isTabbable = (el: HTMLElement) =>
  el.tabIndex >= 0 &&
  !el.hasAttribute(FOCUS_GUARD_ATTRIBUTE) &&
  !el.closest('[inert]') &&
  (el.checkVisibility?.() ?? true);

/** Whether pressing `target` moves focus to it (or to a focusable ancestor). */
export function isFocusable(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target.closest<HTMLElement>(FOCUSABLE) : null;
  return !!el && !el.closest('[inert]');
}

/** Elements reachable with Tab inside `root`, in document order (focus guards excluded). */
export function getTabbables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isTabbable);
}

/** First element reachable with Tab after `anchor` in document order, skipping the excluded ones. */
export function getNextTabbable(
  anchor: Element,
  exclude: (el: HTMLElement) => boolean
): HTMLElement | undefined {
  return getTabbables(anchor.ownerDocument).find(
    (el) =>
      !!(anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      !anchor.contains(el) &&
      !exclude(el)
  );
}
