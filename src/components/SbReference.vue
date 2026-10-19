<script setup lang="ts">
import { computed, onBeforeUnmount, useId, watchEffect } from 'vue';
import { useSbFloatingContext } from '../context';
import { getTabbables } from '../focus';
import type { SbReferenceProps } from '../types';

const props = withDefaults(defineProps<SbReferenceProps>(), {
  as: 'button',
  id: undefined,
  ariaHaspopup: undefined,
});

const context = useSbFloatingContext('SbReference');
const { isOpen, disabled, floatingId, floatingRole } = context;

// `button` and `a` are already focusable and keyboard-operable
const isNative = computed(() => props.as === 'button' || props.as === 'a');

const fallbackId = `${useId()}-reference`;
const id = computed(() => props.id ?? fallbackId);

// Runs once synchronously during setup, so the panel can be named on its first render
watchEffect(() => {
  context.referenceId.value = id.value;
});
onBeforeUnmount(() => {
  if (context.referenceId.value === id.value) context.referenceId.value = undefined;
});

const POPUP_ROLES: Record<string, NonNullable<SbReferenceProps['ariaHaspopup']>> = {
  dialog: 'dialog',
  alertdialog: 'dialog',
  menu: 'menu',
  listbox: 'listbox',
  tree: 'tree',
  grid: 'grid',
};

const ariaHaspopup = computed(
  () => props.ariaHaspopup ?? (floatingRole.value ? POPUP_ROLES[floatingRole.value] : undefined)
);

const setReference = (el: unknown) => {
  context.reference.value = el instanceof HTMLElement ? el : null;
};

const onClick = () => {
  if (context.trigger.value === 'click') context.toggle();
};

// The panel is teleported to the end of the page: Tab from the reference goes into it
const focusPanel = (event: KeyboardEvent) => {
  const panel = context.floating.value;
  const first = panel && getTabbables(panel)[0];
  if (!first) return;
  event.preventDefault();
  first.focus();
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Tab' && !event.shiftKey && isOpen.value) {
    focusPanel(event);
    return;
  }
  if (isNative.value || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  onClick();
};
</script>

<template>
  <component
    :is="props.as"
    :id="id"
    :ref="setReference"
    :type="props.as === 'button' ? 'button' : undefined"
    :role="isNative ? undefined : 'button'"
    :tabindex="isNative ? undefined : disabled ? -1 : 0"
    :disabled="props.as === 'button' && disabled ? true : undefined"
    :aria-disabled="!isNative && disabled ? 'true' : undefined"
    :aria-haspopup="ariaHaspopup"
    :aria-expanded="isOpen ? 'true' : 'false'"
    :aria-controls="isOpen ? floatingId : undefined"
    :data-sbf-state="isOpen ? 'open' : 'closed'"
    @click="onClick"
    @keydown="onKeydown"
  >
    <slot></slot>
  </component>
</template>
