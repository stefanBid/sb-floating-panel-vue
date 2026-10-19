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
import {
  computed,
  ref,
  toValue,
  type ComputedRef,
  type CSSProperties,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';
import type { SbAlignment, SbPlacement, SbSide, SbStrategy } from '../types';

/**
 * Options of the internal `useSbFloatingPanel` composable. Every option can be a value,
 * a ref or a getter, so `SbContainer` props stay reactive.
 */
export interface FloatingPanelOptions {
  isOpen: MaybeRefOrGetter<boolean>;
  placement: MaybeRefOrGetter<SbPlacement>;
  strategy: MaybeRefOrGetter<SbStrategy>;
  offset: MaybeRefOrGetter<number>;
  padding: MaybeRefOrGetter<number>;
  matchWidth: MaybeRefOrGetter<boolean | 'min'>;
  hideWhenDetached: MaybeRefOrGetter<boolean>;
}

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
  update: () => void;
}

const px = (value: number) => `${Math.max(0, value)}px`;

// Corner or edge of the panel facing the reference, as Radix computes it without an arrow
const transformOrigin = (placement: string) => {
  const [side, align] = placement.split('-');
  const cross = align === 'start' ? '0%' : align === 'end' ? '100%' : '50%';
  if (side === 'top') return `${cross} 100%`;
  if (side === 'bottom') return `${cross} 0%`;
  return side === 'left' ? `100% ${cross}` : `0% ${cross}`;
};

/**
 * Wraps Floating UI for the components. Not part of the public API.
 */
export function useSbFloatingPanel(options: FloatingPanelOptions): FloatingPanel {
  const reference = ref<HTMLElement | null>(null);
  const floating = ref<HTMLElement | null>(null);

  const middleware = computed<Middleware[]>(() => {
    const padding = toValue(options.padding);
    const matchWidth = toValue(options.matchWidth);
    // Aligned placements (`bottom-start`) flip before shifting, centered ones shift first
    // (floating-ui.com/docs/flip, "Combining with shift()").
    const aligned = toValue(options.placement).includes('-');
    const flipMiddleware = flip({
      padding,
      crossAxis: 'alignment',
      fallbackAxisSideDirection: 'end',
    });
    const shiftMiddleware = shift({ padding, limiter: limitShift() });

    const list: Middleware[] = [
      offset(toValue(options.offset)),
      ...(aligned ? [flipMiddleware, shiftMiddleware] : [shiftMiddleware, flipMiddleware]),
      // After flip, with the same padding (floating-ui.com/docs/size).
      size({
        padding,
        apply({ rects, elements, availableWidth, availableHeight, placement }) {
          const { style } = elements.floating;
          const referenceWidth = px(rects.reference.width);
          style.setProperty('--sbf-reference-width', referenceWidth);
          style.setProperty('--sbf-transform-origin', transformOrigin(placement));
          style.setProperty('--sbf-available-width', px(availableWidth));
          style.setProperty('--sbf-available-height', px(availableHeight));
          style.width = matchWidth === true ? referenceWidth : '';
          style.minWidth = matchWidth === 'min' ? referenceWidth : '';
        },
      }),
    ];
    if (toValue(options.hideWhenDetached)) list.push(hide({ padding }));
    return list;
  });

  const {
    floatingStyles: positionStyles,
    middlewareData,
    placement,
    isPositioned,
    update,
  } = useFloating(reference, floating, {
    open: () => toValue(options.isOpen),
    placement: () => toValue(options.placement),
    strategy: () => toValue(options.strategy),
    middleware,
    whileElementsMounted: autoUpdate,
  });

  const floatingStyles = computed<CSSProperties>(() => ({
    ...positionStyles.value,
    ...(middlewareData.value.hide?.referenceHidden ? { visibility: 'hidden' } : {}),
  }));

  const side = computed(() => placement.value.split('-')[0] as SbSide);
  const align = computed(() => placement.value.split('-')[1] as SbAlignment | undefined);

  return { reference, floating, floatingStyles, placement, side, align, isPositioned, update };
}
