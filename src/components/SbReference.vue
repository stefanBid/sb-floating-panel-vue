<script setup lang="ts">
import { computed } from 'vue';
import { useSbFloatingContext } from '../context';
import type { SbReferenceProps } from '../types';

const props = withDefaults(defineProps<SbReferenceProps>(), {
  as: 'button',
  ariaHaspopup: 'dialog',
});

const context = useSbFloatingContext('SbReference');
const { isOpen, disabled, floatingId } = context;

// `button` and `a` are already focusable and keyboard-operable
const isNative = computed(() => props.as === 'button' || props.as === 'a');

const setReference = (el: unknown) => {
  context.reference.value = el instanceof HTMLElement ? el : null;
};

const onClick = () => {
  if (context.trigger.value === 'click') context.toggle();
};

const onKeydown = (event: KeyboardEvent) => {
  if (isNative.value || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  onClick();
};
</script>

<template>
  <component
    :is="props.as"
    :ref="setReference"
    :type="props.as === 'button' ? 'button' : undefined"
    :role="isNative ? undefined : 'button'"
    :tabindex="isNative ? undefined : disabled ? -1 : 0"
    :disabled="props.as === 'button' && disabled ? true : undefined"
    :aria-disabled="!isNative && disabled ? 'true' : undefined"
    :aria-haspopup="props.ariaHaspopup"
    :aria-expanded="isOpen ? 'true' : 'false'"
    :aria-controls="isOpen ? floatingId : undefined"
    :data-sbf-state="isOpen ? 'open' : 'closed'"
    @click="onClick"
    @keydown="onKeydown"
  >
    <slot></slot>
  </component>
</template>
