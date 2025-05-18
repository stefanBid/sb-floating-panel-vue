import { useFloating, flip, shift, autoUpdate, offset, arrow } from '@floating-ui/vue';
import type { FloatingElement, Placement, Strategy } from '@floating-ui/vue';

import {
  computed,
  type CSSProperties,
  nextTick,
  onMounted,
  onUnmounted,
  type Ref,
  type ComputedRef,
  ref,
  watch,
} from 'vue';

/**
 * Configuration options for the `useSbFloatingPanel` composable.
 */
interface FloatingSettings {
  /**
   * Defines the preferred placement of the floating element relative to the reference.
   * Example: 'top', 'bottom-start', 'right-end', etc.
   */
  placement: Placement;

  /**
   * Determines the positioning strategy for the floating element.
   * Can be either 'absolute' or 'fixed'.
   */
  strategy: Strategy;

  /**
   * Specifies the distance (in pixels) between the reference and floating elements.
   */
  offsetValue: number;

  /**
   * Enables the use of a directional arrow pointing from the floating element to the reference.
   */
  hasArrow?: boolean;

  /**
   * When enabled, synchronizes the width of the floating element to match the reference element.
   * Useful for dropdowns or inputs.
   */
  hasResize?: boolean;
}

/**
 * `useSbFloatingPanel` is a composable that wraps Floating UI logic to manage
 * floating elements with optional arrow and dynamic width support.
 *
 * It provides bindings and style objects ready to apply to your `ref` elements in Vue templates.
 *
 * @param settings - Configuration options for placement, offset, and behavior.
 * @returns Bindings and utility functions to control the floating panel.
 *
 * @example
 * ```ts
 * const {
 *   reference,
 *   floating,
 *   floatingArrow,
 *   floatingPlacement,
 *   floatingStyle,
 *   floatingArrowStyle,
 *   isOpen,
 *   toggle,
 *   open,
 *   close
 * } = useSbFloatingPanel({
 *   placement: 'bottom',
 *   strategy: 'absolute',
 *   offsetValue: 10,
 *   hasArrow: true,
 *   hasResize: false
 * });
 * ```
 *
 * @example
 * ```html
 * <div ref="reference">Anchor</div>
 * <div ref="floating" v-if="isOpen">Panel</div>
 * <div ref="floatingArrow" v-if="isOpen">Arrow</div>
 * ```
 */
export function useSbFloatingPanel(settings: FloatingSettings): {
  reference: Ref<HTMLElement | null>;
  floating: Ref<FloatingElement | null>;
  floatingArrow: Ref<HTMLElement | null>;
  floatingPlacement: Ref<Placement>;
  floatingStyle: ComputedRef<CSSProperties>;
  floatingArrowStyle: ComputedRef<CSSProperties>;
  isOpen: Ref<boolean>;
  toggle: () => void;
  open: () => void;
  close: () => void;
} {
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

  const open = () => changeFloatingVisibility(true);
  const close = () => changeFloatingVisibility(false);
  const toggle = () => changeFloatingVisibility(!isOpen.value);

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
    toggle,
    open,
    close,
  };
}
