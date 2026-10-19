import { inject, type InjectionKey, type Ref } from 'vue';
import type { FloatingPanel } from './composables/useSbFloatingPanel';
import { warn } from './dev';
import type { NavigableRole } from './focus';
import type { SbTrigger } from './types';

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
  /** Set when an outside press closes the panel on a focusable element, which keeps focus. */
  skipFocusReturn: boolean;
  /** Mounted `SbReference` and `SbFloating` components, to warn about extra ones. */
  parts: { reference: number; floating: number };
  /** Set while the container unmounts, when its parts must not change the open state. */
  isUnmounting: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Pointer entering or leaving the reference or the panel, for the `hover` trigger. */
  hover: (event: PointerEvent) => void;
  /** Whether an event target is inside the reference, the panel or a nested container. */
  contains: (target: EventTarget | null) => boolean;
  /** Registers a nested container; returns the function that unregisters it. */
  registerChild: (child: SbFloatingContext) => () => void;
}

/**
 * Panel roles that make the reference a popup trigger, with their `aria-haspopup` value.
 * Panels with these roles are also named after the reference.
 */
export const POPUP_ROLES: Record<string, 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid'> = {
  dialog: 'dialog',
  alertdialog: 'dialog',
  menu: 'menu',
  listbox: 'listbox',
  tree: 'tree',
  grid: 'grid',
};

export const sbFloatingContextKey: InjectionKey<SbFloatingContext> = Symbol('SbFloatingContext');

/** Element of a template ref: a component gives its instance, whose root element is `$el`. */
export function toElement(el: unknown): HTMLElement | null {
  const node = el && typeof el === 'object' && '$el' in el ? el.$el : el;
  return node instanceof HTMLElement ? node : null;
}

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
