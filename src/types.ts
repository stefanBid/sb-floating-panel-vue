import type { Component, Ref, TransitionProps } from 'vue';

/** Side of the reference the panel is placed on. */
export type SbSide = 'top' | 'right' | 'bottom' | 'left';

/** Alignment of the panel along the side. */
export type SbAlignment = 'start' | 'end';

/** Placement of the panel relative to the reference (same values as Floating UI). */
export type SbPlacement = SbSide | `${SbSide}-${SbAlignment}`;

/** CSS position strategy of the panel. */
export type SbStrategy = 'absolute' | 'fixed';

/**
 * ARIA role of the panel. The roles the components act on are suggested by your editor;
 * any other role is accepted as a string.
 */
export type SbFloatingRole =
  'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'tree' | 'grid' | 'tooltip' | (string & {});

/**
 * How the reference opens the floating panel.
 * - `click`: clicking (or pressing Enter/Space on) `SbReference` toggles the panel.
 * - `hover`: the pointer over `SbReference` opens the panel after `delay.open`, keyboard focus
 *   (`:focus-visible`, not the focus of a click) opens it at once. It closes `delay.close` after
 *   the pointer leaves both the reference and the panel, so the pointer can move onto the panel,
 *   and when focus leaves them. Touch has no hover.
 * - `focus`: focus on `SbReference` opens the panel, focus moving elsewhere closes it.
 * - `manual`: the panel opens only through `v-model:open`, the slot props or the exposed methods.
 */
export type SbTrigger = 'click' | 'hover' | 'focus' | 'manual';

/**
 * Why the panel opened, passed to the `open` event of `SbContainer`.
 * - `trigger`: a click on the reference, or Enter, Space or an arrow key on it.
 * - `hover`: the pointer over the reference (`hover` trigger).
 * - `focus`: focus on the reference (`hover` and `focus` triggers).
 * - `api`: `v-model:open`, the slot props, the exposed methods or `useSbFloating()`.
 * @deprecated The payload of the `open` event is removed in v6; the event stays.
 */
export type SbOpenReason = 'trigger' | 'hover' | 'focus' | 'api';

/**
 * Why the panel closed, passed to the `close` event of `SbContainer`.
 * - `trigger`: a click on the reference, or Enter or Space on it.
 * - `hover`: the pointer left the reference and the panel (`hover` trigger).
 * - `focus-out`: focus moved outside the reference and the panel, e.g. Tab out of a menu.
 * - `escape`: the Escape key, or the arrow key that closes a submenu.
 * - `outside`: a press outside the reference and the panel.
 * - `select`: an item was activated with `closeOnSelect`.
 * - `detached`: the reference was scrolled out of view, with `hideWhenDetached: 'close'`.
 * - `disabled`: the container was disabled.
 * - `api`: `v-model:open`, the slot props, the exposed methods, `useSbFloating()`, or the
 *   reference unmounting.
 * @deprecated The payload of the `close` event is removed in v6; the event stays.
 */
export type SbCloseReason =
  | 'trigger'
  | 'hover'
  | 'focus-out'
  | 'escape'
  | 'outside'
  | 'select'
  | 'detached'
  | 'disabled'
  | 'api';

/**
 * Props for the `SbContainer` component: positioning, open state and interaction.
 */
export interface SbContainerProps {
  /**
   * Preferred placement of the floating panel relative to the reference.
   * The panel flips to the opposite side when there is not enough space.
   * @default 'bottom-start'
   */
  placement?: SbPlacement;

  /**
   * CSS position strategy of the floating panel.
   * Use `fixed` when the reference lives inside a scroll container or a fixed layout.
   * @default 'absolute'
   */
  strategy?: SbStrategy;

  /**
   * Distance in pixels between the reference and the floating panel.
   * @default 8
   */
  offset?: number;

  /**
   * Minimum distance in pixels between the floating panel and the viewport edges.
   * @default 8
   */
  padding?: number;

  /**
   * Makes the floating panel as wide as the reference.
   * - `true`: sets `width` to the reference width.
   * - `'min'`: sets `min-width` to the reference width, so the panel can grow wider.
   * - `false`: no width is set; `--sbf-reference-width` is still available to your CSS.
   * @default false
   */
  matchWidth?: boolean | 'min';

  /**
   * When the reference is scrolled out of view:
   * - `true`: hides the floating panel (`visibility: hidden`) until the reference is back.
   * - `'close'`: closes the panel, so focus never stays inside a hidden panel.
   * @default false
   */
  hideWhenDetached?: boolean | 'close';

  /**
   * Open state, bound with `v-model:open`. Leave it unset to let the container manage it.
   */
  open?: boolean;

  /**
   * Initial open state when `v-model:open` is not used.
   * @default false
   */
  defaultOpen?: boolean;

  /**
   * Prevents the panel from opening and closes it if it is open.
   * @default false
   */
  disabled?: boolean;

  /**
   * How the reference opens the panel.
   * @default 'click'
   */
  trigger?: SbTrigger;

  /**
   * Delay in milliseconds before the `hover` trigger opens and closes the panel: a number for
   * both, or an object (missing keys keep their default). Focus opens the panel without delay.
   * @default { open: 300, close: 150 }
   */
  delay?: number | { open?: number; close?: number };

  /**
   * Closes the panel when the Escape key is pressed.
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Closes the panel on a pointer press outside the reference and the panel.
   * @default true
   */
  closeOnClickOutside?: boolean;

  /**
   * Closes the panel when keyboard focus moves outside the reference and the panel
   * (e.g. tabbing past the last element of the panel).
   * @default true
   */
  closeOnFocusOut?: boolean;
}

/**
 * Props passed to the default slot of `SbContainer`.
 */
export interface SbContainerSlotProps {
  /** Whether the panel is open. */
  isOpen: boolean;
  /** Opens the panel. */
  open: () => void;
  /** Closes the panel. */
  close: () => void;
  /** Toggles the panel. */
  toggle: () => void;
  /** Placement resolved by Floating UI, after `flip`. */
  placement: SbPlacement;
  /**
   * Side of the resolved placement.
   * @deprecated Removed in v6: read it from `placement` (`placement.split('-')[0]`).
   */
  side: SbSide;
  /**
   * Alignment of the resolved placement, `undefined` when centered.
   * @deprecated Removed in v6: read it from `placement` (`placement.split('-')[1]`).
   */
  align: SbAlignment | undefined;
  /** `id` of the panel, e.g. for an `aria-describedby` of your own. */
  floatingId: string;
  /**
   * `id` of the reference, `undefined` until `SbReference` is set up.
   * @deprecated Removed in v6: pass your own `id` to `SbReference`.
   */
  referenceId: string | undefined;
}

/**
 * Methods exposed by `SbContainer` through a template ref.
 */
export interface SbContainerExposed {
  /**
   * Whether the panel is open.
   * @deprecated Removed in v6: bind `v-model:open`.
   */
  readonly isOpen: boolean;
  /**
   * Opens the panel.
   * @deprecated Removed in v6: set the `v-model:open` value to `true`.
   */
  open: () => void;
  /**
   * Closes the panel.
   * @deprecated Removed in v6: set the `v-model:open` value to `false`.
   */
  close: () => void;
  /**
   * Toggles the panel.
   * @deprecated Removed in v6: toggle the `v-model:open` value.
   */
  toggle: () => void;
  /** Recomputes the panel position. */
  update: () => void;
}

/**
 * Props for the `SbReference` component, the element that anchors and toggles the panel.
 */
export interface SbReferenceProps {
  /**
   * HTML tag or component to render.
   * - `button` gets `type="button"`.
   * - Form controls (`input`, `textarea`, `select`), `a` with `href` and components are left as
   *   they are: a component is expected to render its own focusable element (e.g. the
   *   `<Button>` of your design system).
   * - Any other tag (including `a` without `href`) gets `role="button"`, `tabindex="0"` and
   *   Enter/Space handling.
   *
   * A text field (`input`, `textarea`) opens the panel on click without closing it, and keeps
   * focus when the panel opens. The combobox pattern (`aria-activedescendant`) is not supported.
   *
   * When disabled, `button` gets `disabled`; anything else gets `aria-disabled="true"`.
   * @default 'button'
   */
  as?: string | Component;

  /**
   * `id` of the element. The panel is named after the reference with `aria-labelledby`.
   * @default an id generated with `useId()`
   */
  id?: string;

  /**
   * Value of `aria-haspopup`. When unset it follows the `role` of `SbFloating`
   * (`dialog`, `menu`, `listbox`, `tree`, `grid`; `alertdialog` gives `dialog`)
   * and is left out for any other role.
   */
  ariaHaspopup?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | 'true' | 'false';
}

/**
 * Props for the `SbFloating` component, the teleported floating panel.
 */
export interface SbFloatingProps {
  /**
   * HTML tag or component of the panel element (the one that receives your `class`, `style`
   * and attributes). A component must render a single root element.
   * @default 'div'
   */
  as?: string | Component;

  /**
   * ARIA role of the panel. With a popup role (`dialog`, `alertdialog`, `menu`, `listbox`,
   * `tree`, `grid`), the panel is named after the reference with `aria-labelledby`, unless
   * you pass `aria-label` or `aria-labelledby` yourself.
   * With `tooltip`, the open panel describes the reference with `aria-describedby` (unless you
   * pass it on `SbReference`) instead of `aria-expanded` and `aria-controls`.
   * `null` renders no role (disclosure pattern).
   * @default 'dialog'
   */
  role?: SbFloatingRole | null;

  /**
   * Animation of the panel, through a Vue `<Transition>` on the panel element.
   * - A name: the classes of your CSS (`<name>-enter-active`, …).
   * - An object of `<Transition>` props: e.g. `enterActiveClass`, `leaveToClass` with
   *   Tailwind utilities, or JavaScript hooks.
   *
   * With any transition, Vue also waits for CSS animations keyed on
   * `data-sbf-state="closed"`, set on the panel when it starts leaving.
   * No animation when unset.
   */
  transition?: string | TransitionProps;

  /**
   * Where the panel is teleported: a CSS selector or an element. `false` renders it in place,
   * next to the reference.
   * @default 'body'
   */
  teleport?: string | HTMLElement | false;

  /**
   * `z-index` of the positioned wrapper.
   */
  zIndex?: number | string;

  /**
   * Moves focus inside the panel once it is positioned: to the first element with
   * `autofocus`, otherwise to the first focusable element, otherwise to the panel itself.
   * With `role="menu"` or `listbox` the first item gets focus (a listbox: its selected option).
   * @default true, false with `role="tooltip"`, with the `hover` and `focus` triggers and with
   * a text field reference
   */
  autoFocus?: boolean;

  /**
   * Handles the keyboard model of `role="menu"` and `role="listbox"` panels
   * (WAI-ARIA menu button and listbox patterns). Items are the elements with role `menuitem`,
   * `menuitemcheckbox`, `menuitemradio` (menu) or `option` (listbox); they must be focusable,
   * e.g. buttons or elements with `tabindex="-1"`.
   * - ArrowDown / ArrowUp on the reference open the panel on the first / last item
   *   (not with the `manual` trigger).
   * - ArrowDown / ArrowUp move between items (a menu wraps around), Home / End go to the ends,
   *   typing letters focuses the next item whose text starts with them.
   * - Enter and Space activate items that are not buttons or links, with a click.
   * - Menu only: Tab and Shift+Tab close it and move focus on, as from its reference.
   * - Submenu (a menu inside a menu): ArrowRight on its reference opens it, ArrowLeft closes it
   *   (mirrored in right-to-left text).
   *
   * Keys whose `keydown` you already handled with `preventDefault()` are left to you.
   * No effect with other roles.
   * @default true
   */
  keyboardNavigation?: boolean;

  /**
   * With `role="menu"` or `role="listbox"`: activating an item (click, Enter or Space) closes
   * the panel and gives focus back to the reference, after the `click` handler of the item.
   * - Menu: `menuitem` items, not `menuitemcheckbox` / `menuitemradio` nor submenu triggers.
   *   The menus it opened from close too.
   * - Listbox: `option` items, unless the listbox is `aria-multiselectable="true"`.
   *
   * Disabled items are left out. Call `event.preventDefault()` in the `click` handler of an
   * item to keep the panel open.
   * @default false
   */
  closeOnSelect?: boolean;
}

/**
 * Returned by `useSbFloating()`: the open state of the closest `SbContainer` and its actions.
 */
export interface UseSbFloatingReturn {
  /** Whether the panel is open. */
  isOpen: Readonly<Ref<boolean>>;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
