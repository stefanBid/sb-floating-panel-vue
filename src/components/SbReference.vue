<script setup lang="ts">
import { computed, Ref } from 'vue';

interface SbReferenceProps {
  referenceRef: Ref<HTMLElement | null>;
  as?: 'button' | 'a' | 'div' | 'span';
  toggle?: () => void;
}
const props = withDefaults(defineProps<SbReferenceProps>(), {
  as: 'button',
  toggle: undefined,
});

const isInteractive = computed(() => {
  return props.as === 'button' || props.as === 'a';
});
</script>

<template>
  <component
    :is="props.as"
    v-bind="$attrs"
    :ref="props.referenceRef"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @click.stop="props.toggle?.()"
    @keydown.space.prevent.stop="isInteractive && props.toggle?.()"
    @keydown.enter.prevent.stop="isInteractive && props.toggle?.()"
  >
    <slot></slot>
  </component>
</template>
