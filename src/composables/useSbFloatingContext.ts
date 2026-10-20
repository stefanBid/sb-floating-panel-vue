import { inject, type InjectionKey, type Ref } from 'vue';
import type { SbCloseReason, SbOpenReason, SbTrigger } from '../types';
import { getNextTabbable } from '../utils/dom';
import type { NavigableRole } from '../utils/navigation';
import { warn } from '../utils/warn';
import type { FloatingPanel } from './useSbFloatingPanel';

/**
 * State shared by `SbContainer` with `SbReference` and `SbFloating`.
 */
export interface SbFloatingContext extends FloatingPanel {
  isOpen: Readonly<Ref<boolean>>;
  disabled: Readonly<Ref<boolean>>;
  trigger: Readonly<Ref<SbTrigger>>;
  floatingId: string;
  /** Id of the mounted `SbReference`, used to name the panel with `aria-labelledby`. */
  referenceId: Ref<string | undefined>;
  /** `role` of the mounted `SbFloating`, used to derive `aria-haspopup` on the reference. */
  floatingRole: Ref<string | null>;
  /** Role of the mounted `SbFloating` when the components handle its keyboard model. */
  navigation: Ref<NavigableRole | null>;
  /** Item to focus once the panel is open and positioned, asked by the arrow keys on the reference. */
  focusRequest: Ref<'first' | 'last' | null>;
  /** Container of the panel this one is nested in (e.g. the menu of a submenu). */
  parent: SbFloatingContext | null;
  /**
   * Set before closing when focus must not go back to the reference: an outside press on a
   * focusable element keeps it, a menu closing with the menus it opened from moves it.
   */
  skipFocusReturn: boolean;
  /** Mounted `SbReference` and `SbFloating` components, to warn about extra ones. */
  parts: { reference: number; floating: number };
  /** Set while the container unmounts, when its parts must not change the open state. */
  isUnmounting: boolean;
  /** Public actions: their reason is `api`. */
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Opens or closes the panel from an interaction of the components, with its reason. */
  setOpen: {
    (value: true, reason: SbOpenReason): void;
    (value: false, reason: SbCloseReason): void;
    (value: boolean, reason: SbOpenReason & SbCloseReason): void;
  };
  /** Pointer entering or leaving the reference or the panel, for the `hover` trigger. */
  hover: (event: PointerEvent) => void;
  /** Whether an event target is inside the reference, the panel or a nested container. */
  contains: (target: EventTarget | null) => boolean;
  /** Registers a nested container; returns the function that unregisters it. */
  registerChild: (child: SbFloatingContext) => () => void;
}

/** Whether the container is nested in a menu (a submenu): its reference is an item of it. */
export const inMenu = (context: SbFloatingContext) => context.parent?.navigation.value === 'menu';

/**
 * Moves focus out of the panel (or a panel nested in it) about to unmount, which would leave it on
 * the body: to the reference, or to what follows the reference in the page when that goes too.
 * Returns whether focus was in the panel.
 */
export function moveFocusOut(context: SbFloatingContext, toReference: boolean): boolean {
  const active = document.activeElement;
  const reference = context.reference.value;
  if (!active || !reference || reference.contains(active) || !context.contains(active)) {
    return false;
  }
  const target = toReference ? reference : getNextTabbable(reference, (el) => context.contains(el));
  target?.focus({ preventScroll: true });
  return true;
}

export const sbFloatingContextKey: InjectionKey<SbFloatingContext> = Symbol('SbFloatingContext');

/** Counts a mounted part of the container, warning about a second one; returns the release. */
export function claimPart(
  context: SbFloatingContext,
  part: 'reference' | 'floating',
  component: string
): () => void {
  if (++context.parts[part] > 1) {
    warn(
      `<SbContainer> has more than one <${component}>: they share one open state and position, ` +
        'so only the last one works. Use one SbContainer for each panel.'
    );
  }
  return () => context.parts[part]--;
}

export function useSbFloatingContext(component: string): SbFloatingContext {
  const context = inject(sbFloatingContextKey, null);
  if (!context) {
    throw new Error(`[sb-floating-panel-vue] <${component}> must be used inside <SbContainer>.`);
  }
  return context;
}
