import { inject, readonly } from 'vue';
import type { UseSbFloatingReturn } from '../types';
import { sbFloatingContextKey } from './useSbFloatingContext';

/**
 * Open state and actions of the closest `SbContainer`, for your own components inside it
 * (e.g. a `MenuItem` that closes the menu), without passing `close` down from the slot.
 */
export function useSbFloating(): UseSbFloatingReturn {
  const context = inject(sbFloatingContextKey, null);
  if (!context) {
    throw new Error(
      '[sb-floating-panel-vue] useSbFloating() must be called in a component inside <SbContainer>.'
    );
  }
  const { isOpen, open, close, toggle } = context;
  return { isOpen: readonly(isOpen), open, close, toggle };
}
