<script setup lang="ts">
import type { Placement, Strategy } from '@floating-ui/vue';
import { useSbFloatingPanel } from '../index';

/**
 * Props for the SbContainer component.
 * Serves as a controller and provider for the floating panel system.
 */
interface SbContainerProps {
  /**
   * Placement of the floating panel relative to the reference.
   * @default 'bottom-start'
   */
  placement?: Placement;

  /**
   * Positioning strategy to use ('absolute' or 'fixed').
   * @default 'absolute'
   */
  strategy?: Strategy;

  /**
   * Pixel offset between the reference and floating panel.
   * @default 15
   */
  offsetValue?: number;

  /**
   * Whether to render an arrow pointing toward the reference element.
   * @default false
   */
  hasArrow?: boolean;

  /**
   * When true, syncs the floating panel width to the reference width.
   * @default false
   */
  hasResize?: boolean;
}

// Define and apply default prop values
const props = withDefaults(defineProps<SbContainerProps>(), {
  placement: 'bottom-start',
  strategy: 'absolute',
  offsetValue: 15,
  hasArrow: false,
  hasResize: false,
});

// Initialize floating panel behavior using the composable
const {
  isOpen,
  reference,
  floating,
  floatingArrow,
  floatingPlacement,
  floatingStyle,
  floatingArrowStyle,
  toggle,
  open,
  close,
} = useSbFloatingPanel({
  placement: props.placement,
  strategy: props.strategy,
  offsetValue: props.offsetValue,
  hasArrow: props.hasArrow,
  hasResize: props.hasResize,
});

/**
 * The context object passed to the default slot.
 * Includes refs, reactive state, styles and controls for the floating panel.
 */
const context = {
  reference,
  floating,
  floatingArrow,
  floatingPlacement,
  floatingStyle,
  floatingArrowStyle,
  isOpen,
  toggle,
  open,
  close,
};
</script>

<template>
  <!-- The container serves as a slot boundary and context provider -->
  <div class="floating-container">
    <slot v-bind="context"></slot>
  </div>
</template>

<style lang="css" scoped>
.floating-container {
  width: fit-content;
  height: fit-content;
}
</style>
