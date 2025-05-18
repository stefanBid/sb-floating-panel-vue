import { useFloating, flip, shift, autoUpdate, offset, arrow } from '@floating-ui/vue';
import type { FloatingElement, Placement, Strategy } from '@floating-ui/vue';

import { computed, type CSSProperties, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

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
  const floatingArrow = ref<HTMLElement | null>(null);
  const isOpen = ref(false);
  const resizeObserver = ref<ResizeObserver | null>(null);
  let isObserving = false;

  const { floatingStyles, placement, middlewareData } = useFloating(reference, floating, {
    open: isOpen,
    placement: settings.placement,
    strategy: settings.strategy,
    transform: false,
    middleware: [offset(settings.offsetValue), flip(), shift(), arrow({ element: floatingArrow })],
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

  const floatingStyle = computed<CSSProperties>(() => {
    return {
      ...floatingStyles.value,
    };
  });

  const floatingArrowStyle = computed<CSSProperties>(() => {
    const arrowData = middlewareData.value.arrow;
    const sideValue = placement.value.split('-')[0];

    const base: CSSProperties = {
      position: 'absolute',
      transform: 'rotate(45deg)',
      background: 'inherit',
      width: '8px',
      height: '8px',
      left: arrowData?.x != null ? `${arrowData.x}px` : '',
      top: arrowData?.y != null ? `${arrowData.y}px` : '',
    };

    // Offset the arrow based on the side of the floating element
    switch (sideValue) {
      case 'top':
        base.bottom = '-4px';
        break;
      case 'bottom':
        base.top = '-4px';
        break;
      case 'left':
        base.right = '-4px';
        break;
      case 'right':
        base.left = '-4px';
        break;
    }

    return base;
  });

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
    floatingArrow,
    floatingPlacement: placement,
    floatingStyle,
    floatingArrowStyle,
    isOpen,
    changeFloatingVisibility,
  };
}
