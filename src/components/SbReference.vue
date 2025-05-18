<script setup lang="ts">
import { computed, Ref } from 'vue';

/**
 * Props for the SbReference component.
 * Renders the reference element for the floating panel system.
 */
interface SbReferenceProps {
  /**
   * The ref to bind to the reference DOM element.
   */
  referenceRef: Ref<HTMLElement | null>;

  /**
   * HTML tag to render as the reference.
   * Useful for accessibility and customization.
   * @default 'button'
   */
  as?: 'button' | 'a' | 'div' | 'span';

  /**
   * Optional click handler for toggling the floating panel.
   */
  onClick?: () => void;
}

const props = withDefaults(defineProps<SbReferenceProps>(), {
  as: 'button',
  onClick: undefined,
});

/**
 * Determines whether the element is considered interactive
 * (to enable keyboard accessibility via keydown events).
 */
const isInteractive = computed(() => {
  return props.as === 'button' || props.as === 'a';
});
</script>

<template>
  <!-- Dynamic tag based on 'as' prop -->
  <component
    :is="props.as"
    v-bind="$attrs"
    :ref="props.referenceRef"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @click.stop="props.onClick?.()"
    @keydown.space.prevent.stop="isInteractive && props.onClick?.()"
    @keydown.enter.prevent.stop="isInteractive && props.onClick?.()"
  >
    <slot></slot>
  </component>
</template>
