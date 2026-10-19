import { inject, type InjectionKey, type Ref } from 'vue';
import type { FloatingPanel } from './composables/useSbFloatingPanel';
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
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Whether an event target is inside the reference, the panel or a nested container. */
  contains: (target: EventTarget | null) => boolean;
  /** Whether a nested container is open. */
  hasOpenChild: () => boolean;
  /** Registers a nested container; returns the function that unregisters it. */
  registerChild: (child: SbFloatingContext) => () => void;
}

export const sbFloatingContextKey: InjectionKey<SbFloatingContext> = Symbol('SbFloatingContext');

export function useSbFloatingContext(component: string): SbFloatingContext {
  const context = inject(sbFloatingContextKey, null);
  if (!context) {
    throw new Error(`[sb-floating-panel-vue] <${component}> must be used inside <SbContainer>.`);
  }
  return context;
}
