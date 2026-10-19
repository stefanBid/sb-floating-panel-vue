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

/** Panel roles whose keyboard model the components handle, with the selector of their items. */
export const ITEM_SELECTORS = {
  menu: '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
  listbox: '[role="option"]',
} as const;

export type NavigableRole = keyof typeof ITEM_SELECTORS;

export const isNavigableRole = (role: string | null): role is NavigableRole =>
  !!role && Object.hasOwn(ITEM_SELECTORS, role);

/** Items of a menu or listbox panel that can take focus, leaving out those of a nested one. */
export function getItems(panel: HTMLElement, role: NavigableRole): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>(ITEM_SELECTORS[role])].filter(
    (el) =>
      el.closest(`[role="${role}"]`) === panel &&
      !el.matches(':disabled') &&
      (el.checkVisibility?.() ?? true)
  );
}

/** Whether keys pressed on `target` edit text, so they are not navigation keys. */
export const isTextField = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');

/** Arrow keys that open and close a submenu, which follow the text direction. */
export const submenuKeys = (el: Element) =>
  getComputedStyle(el).direction === 'rtl'
    ? { open: 'ArrowLeft', close: 'ArrowRight' }
    : { open: 'ArrowRight', close: 'ArrowLeft' };

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
