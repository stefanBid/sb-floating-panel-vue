<script setup lang="ts">
import type { Placement, Strategy } from '@floating-ui/vue';
import { useSbFloatingPanel } from '../index';

interface SbContainerProps {
  placement?: Placement;
  strategy?: Strategy;
  offsetValue?: number;
  hasArrow?: boolean;
  hasResize?: boolean;
}

const props = withDefaults(defineProps<SbContainerProps>(), {
  placement: 'bottom-start',
  strategy: 'absolute',
  offsetValue: 15,
  hasArrow: false,
  hasResize: false,
});

const {
  isOpen,
  reference,
  floating,
  floatingArrow,
  floatingPlacement,
  floatingStyle,
  floatingArrowStyle,
  changeFloatingVisibility,
} = useSbFloatingPanel({
  placement: props.placement,
  strategy: props.strategy,
  offsetValue: props.offsetValue,
  hasArrow: props.hasArrow,
  hasResize: props.hasResize,
});

const context = {
  reference,
  floating,
  floatingArrow,
  floatingPlacement,
  floatingStyle,
  floatingArrowStyle,
  isOpen,
  open: () => changeFloatingVisibility(true),
  close: () => changeFloatingVisibility(false),
  toggle: () => changeFloatingVisibility(!isOpen.value),
};
</script>

<template>
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
