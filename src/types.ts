/** Side of the reference the panel is placed on. */
export type SbSide = 'top' | 'right' | 'bottom' | 'left';

/** Alignment of the panel along the side. */
export type SbAlignment = 'start' | 'end';

/** Placement of the panel relative to the reference (same values as Floating UI). */
export type SbPlacement = SbSide | `${SbSide}-${SbAlignment}`;

/** CSS position strategy of the panel. */
export type SbStrategy = 'absolute' | 'fixed';

/**
 * How the reference opens the floating panel.
 * - `click`: clicking (or pressing Enter/Space on) `SbReference` toggles the panel.
 * - `manual`: the panel opens only through `v-model:open`, the slot props or the exposed methods.
 */
export type SbTrigger = 'click' | 'manual';

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
   * Hides the floating panel (`visibility: hidden`) when the reference is scrolled out of view.
   * @default false
   */
  hideWhenDetached?: boolean;

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
   * Closes the panel when the Escape key is pressed.
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Closes the panel on a pointer press outside the reference and the panel.
   * @default true
   */
  closeOnClickOutside?: boolean;
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
  /** Side of the resolved placement. */
  side: SbSide;
}

/**
 * Methods exposed by `SbContainer` through a template ref.
 */
export interface SbContainerExposed {
  /** Opens the panel. */
  open: () => void;
  /** Closes the panel. */
  close: () => void;
  /** Toggles the panel. */
  toggle: () => void;
  /** Recomputes the panel position. */
  update: () => void;
}

/**
 * Props for the `SbReference` component, the element that anchors and toggles the panel.
 */
export interface SbReferenceProps {
  /**
   * HTML tag to render. A `button` gets `type="button"`; any tag other than `button` and `a`
   * gets `role="button"`, `tabindex="0"` and Enter/Space handling.
   * @default 'button'
   */
  as?: string;

  /**
   * Value of `aria-haspopup`, matching the `role` of `SbFloating`.
   * @default 'dialog'
   */
  ariaHaspopup?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | 'true' | 'false';
}

/**
 * Props for the `SbFloating` component, the teleported floating panel.
 */
export interface SbFloatingProps {
  /**
   * HTML tag of the panel element (the one that receives your `class`, `style` and attributes).
   * @default 'div'
   */
  as?: string;

  /**
   * ARIA role of the panel.
   * @default 'dialog'
   */
  role?: string;

  /**
   * Name of a Vue `<Transition>` defined by your CSS (`<name>-enter-active`, …).
   * The classes are applied to the panel element. No animation when unset.
   */
  transition?: string;

  /**
   * Teleport target (CSS selector or element).
   * @default 'body'
   */
  teleportTo?: string | HTMLElement;

  /**
   * Renders the panel in place instead of teleporting it.
   * @default false
   */
  teleportDisabled?: boolean;

  /**
   * `z-index` of the positioned wrapper.
   */
  zIndex?: number | string;

  /**
   * Moves focus inside the panel once it is positioned: to the first element with
   * `autofocus`, otherwise to the first focusable element, otherwise to the panel itself.
   * @default false
   */
  autoFocus?: boolean;
}
