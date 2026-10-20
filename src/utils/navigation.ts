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
