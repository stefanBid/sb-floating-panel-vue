import {
  autoUpdate,
  flip,
  hide,
  limitShift,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/vue';
import type { Middleware } from '@floating-ui/vue';
import { computed, ref, type ComputedRef, type CSSProperties, type Ref } from 'vue';
import type { SbAlignment, SbContainerProps, SbPlacement, SbSide } from '../types';

/** Positioning props of `SbContainer`, with their defaults: read reactively. */
type PositioningProps = Readonly<
  Required<
    Pick<
      SbContainerProps,
      'placement' | 'strategy' | 'offset' | 'padding' | 'matchWidth' | 'hideWhenDetached'
    >
  >
>;

export interface FloatingPanel {
  reference: Ref<HTMLElement | null>;
  floating: Ref<HTMLElement | null>;
  /** Positioning styles for the outer wrapper (Floating UI styles + `visibility` from `hide`). */
  floatingStyles: ComputedRef<CSSProperties>;
  /** Placement resolved after `flip`. */
  placement: Readonly<Ref<SbPlacement>>;
  side: ComputedRef<SbSide>;
  align: ComputedRef<SbAlignment | undefined>;
  isPositioned: Readonly<Ref<boolean>>;
  /** Whether the reference is scrolled out of view, with `hideWhenDetached`. */
  referenceHidden: ComputedRef<boolean>;
  update: () => void;
}

const px = (value: number) => `${Math.max(0, value)}px`;

// Corner or edge of the panel facing the reference, as Radix computes it without an arrow.
// In right-to-left text Floating UI mirrors the alignment on the top and bottom sides only.
const transformOrigin = (placement: string, rtl: boolean) => {
  const [side, align] = placement.split('-');
  const mirrored = rtl && (side === 'top' || side === 'bottom');
  const start = mirrored ? '100%' : '0%';
  const end = mirrored ? '0%' : '100%';
  const cross = align === 'start' ? start : align === 'end' ? end : '50%';
  if (side === 'top') return `${cross} 100%`;
  if (side === 'bottom') return `${cross} 0%`;
  return side === 'left' ? `100% ${cross}` : `0% ${cross}`;
};

/**
 * Wraps Floating UI for the components. Not part of the public API.
 */
export function useSbFloatingPanel(
  props: PositioningProps,
  isOpen: Readonly<Ref<boolean>>
): FloatingPanel {
  const reference = ref<HTMLElement | null>(null);
  const floating = ref<HTMLElement | null>(null);

  const middleware = computed<Middleware[]>(() => {
    const { padding, matchWidth } = props;
    // Aligned placements (`bottom-start`) flip before shifting, centered ones shift first
    // (floating-ui.com/docs/flip, "Combining with shift()").
    const aligned = props.placement.includes('-');
    const flipMiddleware = flip({
      padding,
      crossAxis: 'alignment',
      fallbackAxisSideDirection: 'end',
    });
    const shiftMiddleware = shift({ padding, limiter: limitShift() });

    const list: Middleware[] = [
      offset(props.offset),
      ...(aligned ? [flipMiddleware, shiftMiddleware] : [shiftMiddleware, flipMiddleware]),
      // After flip, with the same padding (floating-ui.com/docs/size).
      size({
        padding,
        apply({ rects, elements, availableWidth, availableHeight, placement }) {
          const { style } = elements.floating;
          const referenceWidth = px(rects.reference.width);
          style.setProperty('--sbf-reference-width', referenceWidth);
          // Same test as the isRTL of the Floating UI DOM platform
          const rtl = getComputedStyle(elements.floating).direction === 'rtl';
          style.setProperty('--sbf-transform-origin', transformOrigin(placement, rtl));
          style.setProperty('--sbf-available-width', px(availableWidth));
          style.setProperty('--sbf-available-height', px(availableHeight));
          style.width = matchWidth === true ? referenceWidth : '';
          style.minWidth = matchWidth === 'min' ? referenceWidth : '';
        },
      }),
    ];
    if (props.hideWhenDetached) list.push(hide({ padding }));
    return list;
  });

  const {
    floatingStyles: positionStyles,
    middlewareData,
    placement,
    isPositioned,
    update,
  } = useFloating(reference, floating, {
    open: isOpen,
    placement: () => props.placement,
    strategy: () => props.strategy,
    middleware,
    whileElementsMounted: autoUpdate,
  });

  const referenceHidden = computed(() => !!middlewareData.value.hide?.referenceHidden);

  const floatingStyles = computed<CSSProperties>(() => ({
    ...positionStyles.value,
    ...(referenceHidden.value ? { visibility: 'hidden' } : {}),
  }));

  const side = computed(() => placement.value.split('-')[0] as SbSide);
  const align = computed(() => placement.value.split('-')[1] as SbAlignment | undefined);

  return {
    reference,
    floating,
    floatingStyles,
    placement,
    side,
    align,
    isPositioned,
    referenceHidden,
    update,
  };
}
