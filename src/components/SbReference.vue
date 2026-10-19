<script setup lang="ts">
import { computed, onBeforeUnmount, useAttrs, useId, watchEffect } from 'vue';
import { POPUP_ROLES, useSbFloatingContext } from '../context';
import { getTabbables } from '../focus';
import type { SbReferenceProps } from '../types';

const props = withDefaults(defineProps<SbReferenceProps>(), {
  as: 'button',
  id: undefined,
  ariaHaspopup: undefined,
});

const attrs = useAttrs();
const context = useSbFloatingContext('SbReference');
const { isOpen, disabled, floatingId, floatingRole } = context;

// `button`, `a` with `href` and components (which render their own interactive element)
// are already focusable and keyboard-operable. A function, so it follows `href` in `attrs`.
const isNative = () =>
  typeof props.as !== 'string' || props.as === 'button' || (props.as === 'a' && attrs.href != null);

const fallbackId = `${useId()}-reference`;
const id = computed(() => props.id ?? fallbackId);

// Runs once synchronously during setup, so the panel can be named on its first render
watchEffect(() => {
  context.referenceId.value = id.value;
});
onBeforeUnmount(() => {
  if (context.referenceId.value === id.value) context.referenceId.value = undefined;
});

const ariaHaspopup = computed(
  () =>
    props.ariaHaspopup ??
    (floatingRole.value && Object.hasOwn(POPUP_ROLES, floatingRole.value)
      ? POPUP_ROLES[floatingRole.value]
      : undefined)
);

const setReference = (el: unknown) => {
  // A component gives its instance: the reference is its root element
  const node = el && typeof el === 'object' && '$el' in el ? el.$el : el;
  context.reference.value = node instanceof HTMLElement ? node : null;
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
  if (isNative() || (event.key !== 'Enter' && event.key !== ' ')) return;
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
    :role="isNative() ? undefined : 'button'"
    :tabindex="isNative() ? undefined : disabled ? -1 : 0"
    :disabled="props.as === 'button' && disabled ? true : undefined"
    :aria-disabled="props.as !== 'button' && disabled ? 'true' : undefined"
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
