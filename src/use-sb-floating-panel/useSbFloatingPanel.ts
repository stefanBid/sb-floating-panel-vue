import { useFloating, flip, shift, autoUpdate, offset, arrow } from '@floating-ui/vue';
import type { FloatingElement, Placement, Strategy } from '@floating-ui/vue';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

interface FloatingSettings {
  placement: Placement;
  strategy: Strategy;
  offsetValue: number;
  hasArrow?: boolean;
  hasResize?: boolean;
}

export function useSbFloatingPanel(settings: FloatingSettings) {
  const reference = ref<HTMLElement | null>(null);
  const floating = ref<FloatingElement | null>(null);
  const popperArrow = ref<HTMLElement | null>(null);
  const isOpen = ref(false);
  const resizeObserver = ref<ResizeObserver | null>(null);
  let isObserving = false;

  const { floatingStyles, placement, middlewareData } = useFloating(reference, floating, {
    open: isOpen,
    placement: settings.placement,
    strategy: settings.strategy,
    transform: false,
    middleware: [
      offset(settings.offsetValue),
      flip(),
      shift(),
      ...(settings.hasArrow ? [arrow({ element: popperArrow })] : []),
    ],
    whileElementsMounted: autoUpdate,
  });

  const changeFloatingVisibility = (newState: boolean): void => {
    isOpen.value = newState;
  };

  const syncPopperWidthWithAnchor = (): void => {
    if (floating.value && reference.value) {
      floating.value.style.width = `${reference.value.offsetWidth}px`;
    }
  };

  watch(isOpen, async (newVal) => {
    if (newVal && settings.hasResize && isObserving) {
      await nextTick();
      syncPopperWidthWithAnchor();
    }
  });

  watch(reference, (newReference) => {
    if (newReference && settings.hasResize && !isObserving) {
      isObserving = true;
      resizeObserver.value = new ResizeObserver(syncPopperWidthWithAnchor);
      resizeObserver.value.observe(newReference);
    }
  });

  onMounted(() => {
    if (settings.hasResize && reference.value) {
      isObserving = true;
      resizeObserver.value = new ResizeObserver(syncPopperWidthWithAnchor);
      resizeObserver.value.observe(reference.value);
    }
  });

  onUnmounted(() => {
    if (settings.hasResize) {
      resizeObserver.value?.disconnect();
    }
  });

  return {
    reference,
    floating,
    popperArrow,
    isOpen,
    floatingPosition: placement,
    floatingStyles,
    floatingArrowStyles: middlewareData,
    changeFloatingVisibility,
  };
}
