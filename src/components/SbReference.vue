<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useAttrs, useId, watchEffect } from 'vue';
import { claimPart, useSbFloatingContext } from '../composables/useSbFloatingContext';
import type { SbReferenceProps } from '../types';
import { POPUP_ROLES } from '../utils/aria';
import { getTabbables, toElement } from '../utils/dom';
import { isTextField, submenuKeys } from '../utils/navigation';
import { warn } from '../utils/warn';

const props = withDefaults(defineProps<SbReferenceProps>(), {
  as: 'button',
  id: undefined,
  ariaHaspopup: undefined,
});

const attrs = useAttrs();
const context = useSbFloatingContext('SbReference');
const { isOpen, disabled, floatingId, floatingRole } = context;
const release = claimPart(context, 'reference', 'SbReference');

const FORM_CONTROLS = ['button', 'input', 'textarea', 'select'];

// Form controls, `a` with `href` and components (which render their own interactive element)
// are already focusable and keyboard-operable. A function, so it follows `href` in `attrs`.
const isNative = () =>
  typeof props.as !== 'string' ||
  FORM_CONTROLS.includes(props.as) ||
  (props.as === 'a' && attrs.href != null);

const fallbackId = `${useId()}-reference`;
const id = computed(() => props.id ?? fallbackId);

// Runs once synchronously during setup, so the panel can be named on its first render
watchEffect(() => {
  context.referenceId.value = id.value;
});
onMounted(() => {
  const el = context.reference.value;
  if (el) {
    if (isTextField(el) && context.navigation.value) {
      warn(
        `<SbReference> is a text field with a role="${context.navigation.value}" panel: the arrow ` +
          'keys move focus into the panel, so typing stops there. The combobox pattern (focus ' +
          'kept in the field with aria-activedescendant) is not supported.'
      );
    }
    return;
  }
  warn(
    '<SbReference> rendered no element, so the panel cannot be positioned: a component in `as` ' +
      'must render a single root element.'
  );
});

onBeforeUnmount(() => {
  if (context.referenceId.value === id.value) context.referenceId.value = undefined;
  release();
  // A panel left without its reference has nothing to be anchored to nor to give focus back to
  if (!context.parts.reference && !context.isUnmounting) context.close();
});

const ariaHaspopup = computed(
  () =>
    props.ariaHaspopup ??
    (floatingRole.value && Object.hasOwn(POPUP_ROLES, floatingRole.value)
      ? POPUP_ROLES[floatingRole.value]
      : undefined)
);

const setReference = (el: unknown) => {
  context.reference.value = toElement(el);
};

const onClick = () => {
  if (context.trigger.value !== 'click') return;
  // A click in a text field places the caret: it opens the panel, never closes it
  if (isTextField(context.reference.value)) context.open();
  else context.toggle();
};

// A tooltip describes its reference, it does not expand it (w3.org/WAI/ARIA/apg/patterns/tooltip)
const isTooltip = computed(() => floatingRole.value === 'tooltip');

// Hover and focus triggers: keyboard focus opens the panel at once, focus moving outside closes it
const opensOnFocus = () => context.trigger.value === 'hover' || context.trigger.value === 'focus';

// A submenu trigger is an item of its parent menu
const inMenu = () => context.parent?.navigation.value === 'menu';

// Not when focus comes back from the panel, e.g. given back as it closes on Escape. Not in a
// menu, where the arrow keys move focus over the items: a submenu opens on its own key.
const onFocusin = (event: FocusEvent) => {
  if (opensOnFocus() && !inMenu() && !context.contains(event.relatedTarget)) context.open();
};

const onFocusout = (event: FocusEvent) => {
  if (opensOnFocus() && !context.contains(event.relatedTarget)) context.close();
};

// The panel is teleported to the end of the page: Tab from the reference goes into it
const focusPanel = (event: KeyboardEvent) => {
  const panel = context.floating.value;
  const first = panel && getTabbables(panel)[0];
  if (!first) return;
  event.preventDefault();
  first.focus();
};

// Menu button and listbox patterns: ArrowDown opens the panel on its first item, ArrowUp on the
// last. A submenu trigger is an item of its parent menu, where the arrows move between items:
// the arrow pointing to the submenu opens it instead.
const arrowEdge = (event: KeyboardEvent) => {
  if (!context.navigation.value || disabled.value || context.trigger.value === 'manual') return;
  if (inMenu()) {
    const target = event.currentTarget as Element;
    return event.key === submenuKeys(target).open ? 'first' : undefined;
  }
  return event.key === 'ArrowDown' ? 'first' : event.key === 'ArrowUp' ? 'last' : undefined;
};

const onKeydown = (event: KeyboardEvent) => {
  // From a submenu trigger, Tab leaves the parent menu (handled by its panel)
  if (event.key === 'Tab' && !event.shiftKey && isOpen.value && !inMenu()) {
    focusPanel(event);
    return;
  }
  const edge = arrowEdge(event);
  if (edge) {
    event.preventDefault();
    context.focusRequest.value = edge;
    context.open();
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
    :aria-expanded="isTooltip ? undefined : isOpen ? 'true' : 'false'"
    :aria-controls="isOpen && !isTooltip ? floatingId : undefined"
    :aria-describedby="isOpen && isTooltip ? floatingId : undefined"
    :data-sbf-state="isOpen ? 'open' : 'closed'"
    @click="onClick"
    @keydown="onKeydown"
    @focusin="onFocusin"
    @focusout="onFocusout"
    @pointerenter="context.hover"
    @pointerleave="context.hover"
  >
    <slot></slot>
  </component>
</template>
