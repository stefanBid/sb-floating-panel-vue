<script setup lang="ts">
import type { Placement } from '@floating-ui/vue';
import type { CSSProperties } from 'vue';
import { computed, ref, Ref, useAttrs } from 'vue';

interface SbFloatingProps {
  floatingRef: Ref<HTMLElement | null>;
  floatingArrowRef?: Ref<HTMLElement | null>;
  isOpen: boolean;
  floatingPlacement: Placement;
  floatingStyle: CSSProperties;
  floatingArrowStyle?: CSSProperties;
  arrowDimensions?: number;
  zIndex?: number;
  animation?: 'fade' | 'scale-fade' | 'none';
  duration?: number;
}
const props = withDefaults(defineProps<SbFloatingProps>(), {
  floatingArrowRef: () => ref(null),
  floatingArrowStyle: undefined,
  arrowDimensions: undefined,
  zIndex: undefined,
  animation: 'scale-fade',
  duration: 300,
});

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const getFloatingStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    ...props.floatingStyle,
    '--sb-transition-duration': props.duration + 'ms',
  };

  if (props.zIndex !== undefined) {
    style.zIndex = props.zIndex;
  }

  return style;
});

const getFloatingArrowStyle = computed<CSSProperties>(() => {
  const result = { ...(props.floatingArrowStyle || ({} as CSSProperties)) };

  if (props.arrowDimensions) {
    const size = props.arrowDimensions;
    const offset = `-${size / 2}px`;
    const side = props.floatingPlacement.split('-')[0];

    switch (side) {
      case 'top':
        result.bottom = offset;
        break;
      case 'bottom':
        result.top = offset;
        break;
      case 'left':
        result.right = offset;
        break;
      case 'right':
        result.left = offset;
        break;
    }

    result.width = `${size}px`;
    result.height = `${size}px`;
  }

  if (props.zIndex !== undefined) {
    result.zIndex = props.zIndex;
  }
  return result;
});

const getAnimation = computed(() => {
  return props.animation === 'fade' ? 'fade' : props.animation === 'scale-fade' ? 'scale-fade' : '';
});
</script>

<template>
  <teleport to="body">
    <transition :name="getAnimation">
      <div v-if="props.isOpen" :ref="props.floatingRef" :style="getFloatingStyle" v-bind="attrs">
        <slot></slot>
        <div
          v-if="props.floatingArrowRef"
          :ref="props.floatingArrowRef"
          :style="getFloatingArrowStyle"
        ></div>
      </div>
    </transition>
  </teleport>
</template>

<style lang="css" scoped>
/* Fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--sb-transition-duration) ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* Scale + fade */
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition:
    opacity var(--sb-transition-duration) ease-in-out,
    transform var(--sb-transition-duration) ease-in-out;
}

.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.scale-fade-enter-to,
.scale-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
