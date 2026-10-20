<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onScopeDispose,
  ref,
  useAttrs,
  watch,
  watchEffect,
  type CSSProperties,
  type TransitionProps,
} from 'vue';
import { claimPart, useSbFloatingContext } from '../composables/useSbFloatingContext';
import type { SbFloatingProps } from '../types';
import { POPUP_ROLES } from '../utils/aria';
import { FOCUS_GUARD_ATTRIBUTE, getNextTabbable, getTabbables, toElement } from '../utils/dom';
import { getItems, isNavigableRole, isTextField, submenuKeys } from '../utils/navigation';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SbFloatingProps>(), {
  as: 'div',
  role: 'dialog',
  transition: undefined,
  teleport: 'body',
  zIndex: undefined,
  autoFocus: undefined,
  keyboardNavigation: true,
});

const emit = defineEmits<{
  /** The enter transition has finished (right after opening when there is no transition). */
  'after-enter': [];
  /** The leave transition has finished and the panel is removed from the DOM. */
  'after-leave': [];
}>();

const attrs = useAttrs();
const context = useSbFloatingContext('SbFloating');
onBeforeUnmount(claimPart(context, 'floating', 'SbFloating'));
const { isOpen, floatingId, referenceId, side, align } = context;

// Lets SbReference derive `aria-haspopup` from the role and handle the arrow keys
watchEffect(() => {
  context.floatingRole.value = props.role;
  context.navigation.value =
    props.keyboardNavigation && isNavigableRole(props.role) ? props.role : null;
});

// The wrapper stays mounted until the leave transition of the panel has finished,
// so the panel keeps its position while it animates out.
const isMounted = ref(isOpen.value);
const panel = ref<HTMLElement | null>(null);

const setFloating = (el: unknown) => {
  context.floating.value = el instanceof HTMLElement ? el : null;
};

const setPanel = (el: unknown) => {
  panel.value = toElement(el);
};

// Outer wrapper: positioning only, never visual styles
const wrapperStyle = computed<CSSProperties>(() => ({
  ...context.floatingStyles.value,
  ...(props.zIndex !== undefined ? { zIndex: props.zIndex } : {}),
}));

// A popup panel (dialog, menu, …) is named after the reference, unless the user names it:
// their `aria-label` replaces the default, their `aria-labelledby` overrides it.
const panelAttrs = () => ({
  'aria-labelledby':
    props.role && Object.hasOwn(POPUP_ROLES, props.role) && attrs['aria-label'] == null
      ? referenceId.value
      : undefined,
  ...attrs,
});

// Focus stays on the reference of a tooltip, and of a panel opened by hovering or focusing it
const autoFocus = computed(
  () =>
    props.autoFocus ??
    (props.role !== 'tooltip' &&
      context.trigger.value !== 'hover' &&
      context.trigger.value !== 'focus')
);

// Guards are needed only when the panel is teleported away from the reference,
// and never around a tooltip, which takes no focus
const hasFocusGuards = computed(
  () => isOpen.value && props.teleport !== false && props.role !== 'tooltip'
);

const guardAttrs = {
  [FOCUS_GUARD_ATTRIBUTE]: '',
  tabindex: 0,
  style: { position: 'fixed', opacity: 0, outline: 'none', pointerEvents: 'none' },
} as const;

// A name uses the classes of your CSS, an object passes classes (e.g. Tailwind) or hooks.
// Without it nothing is animated and the panel is removed at once.
const transitionProps = computed<TransitionProps>(() => {
  const { transition } = props;
  if (!transition) return { css: false };
  return typeof transition === 'string' ? { name: transition } : transition;
});

// The leaving panel is no longer patched by Vue: mark it here, so CSS keyed on
// `data-sbf-state="closed"` (e.g. an exit animation) applies while it animates out
const onBeforeLeave = (el: Element) => el.setAttribute('data-sbf-state', 'closed');

const onAfterEnter = () => emit('after-enter');

const onAfterLeave = () => {
  if (!isOpen.value) isMounted.value = false;
  emit('after-leave');
};

const isInPanel = (target: EventTarget | null) =>
  target instanceof Node && !!panel.value?.contains(target);

const focusEdge = (edge: 'first' | 'last') => {
  const el = panel.value;
  if (!el) return;
  const tabbables = getTabbables(el);
  const target = edge === 'first' ? tabbables[0] : tabbables[tabbables.length - 1];
  (target ?? el).focus({ preventScroll: true });
};

// Shift+Tab from the first element goes back to the reference;
// Tab from whatever precedes the teleported panel in the DOM goes into it
const onStartGuardFocus = (event: FocusEvent) => {
  if (isInPanel(event.relatedTarget)) context.reference.value?.focus();
  else focusEdge('first');
};

// Tab from the last element goes on to what follows the reference in the page;
// Shift+Tab from whatever follows the teleported panel goes into it
const onEndGuardFocus = (event: FocusEvent) => {
  if (!isInPanel(event.relatedTarget)) {
    focusEdge('last');
    return;
  }
  const reference = context.reference.value;
  const next = reference && getNextTabbable(reference, (el) => context.contains(el));
  (next ?? reference)?.focus();
};

const items = () => {
  const role = context.navigation.value;
  return panel.value && role ? getItems(panel.value, role) : [];
};

// A listbox opens on its selected option; the arrow keys on the reference ask for an edge item
const focusPanel = (edge: 'first' | 'last' | null) => {
  const el = panel.value;
  if (!el) return;
  const list = items();
  const selected = list.find((item) => item.getAttribute('aria-selected') === 'true');
  const target =
    selected ??
    (edge === 'last' ? list[list.length - 1] : edge ? list[0] : undefined) ??
    el.querySelector<HTMLElement>('[autofocus]') ??
    list[0] ??
    getTabbables(el)[0] ??
    el;
  target.focus({ preventScroll: true });
};

const takeFocusRequest = () => {
  const edge = context.focusRequest.value;
  context.focusRequest.value = null;
  return edge;
};

// Menu button and listbox patterns (w3.org/WAI/ARIA/apg): arrow keys, Home and End move focus
// between the items, typing a letter jumps to the next item starting with it.
let search = '';
let searchTimer: ReturnType<typeof setTimeout> | undefined;
onScopeDispose(() => clearTimeout(searchTimer));

const findByText = (list: HTMLElement[], index: number, key: string) => {
  search += key.toLowerCase();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => (search = ''), 500);
  // Typing the same letter again cycles through the items starting with it
  const query = [...search].every((char) => char === search[0]) ? search[0]! : search;
  const start = Math.max(index, 0);
  const order = [...list.slice(start), ...list.slice(0, start)];
  // A single letter moves on from the focused item, a longer search may stay on it
  if (query.length === 1 && index >= 0) order.push(order.shift()!);
  return order.find((item) => item.textContent?.trim().toLowerCase().startsWith(query));
};

// Tab leaves a menu, as from its trigger: the menu and the menus it opened from close
const leaveMenu = (backwards: boolean) => {
  let root = context;
  const chain = [root];
  while (root.parent?.navigation.value === 'menu') {
    root = root.parent;
    chain.push(root);
  }
  const reference = root.reference.value;
  const target = backwards
    ? reference
    : ((reference && getNextTabbable(reference, (el) => root.contains(el))) ?? reference);
  for (const container of chain) {
    container.skipFocusReturn = true;
    container.close();
  }
  target?.focus();
};

const onKeydown = (event: KeyboardEvent) => {
  const role = context.navigation.value;
  // Left to a handler of the user that already took the key, and to text fields
  if (!role || event.defaultPrevented || event.isComposing || isTextField(event.target)) return;
  const list = items();
  const index = list.findIndex((item) => item.contains(event.target as Node));
  const last = list.length - 1;
  // A menu wraps around, a listbox stops at its ends like a native select
  const wrap = role === 'menu';
  let next: HTMLElement | undefined;

  if (event.key === 'ArrowDown') next = list[index < last ? index + 1 : wrap ? 0 : last];
  else if (event.key === 'ArrowUp')
    next = list[index > 0 ? index - 1 : wrap || index < 0 ? last : 0];
  else if (event.key === 'Home') next = list[0];
  else if (event.key === 'End') next = list[last];
  else if (event.key === 'Tab' && role === 'menu') {
    event.preventDefault();
    leaveMenu(event.shiftKey);
    return;
  } else if (
    role === 'menu' &&
    context.parent?.navigation.value === 'menu' &&
    panel.value &&
    event.key === submenuKeys(panel.value).close
  ) {
    // Closing a submenu gives focus back to its trigger, an item of the parent menu
    event.preventDefault();
    context.close();
    return;
  } else if (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    (event.key !== ' ' || search)
  ) {
    // Space while searching is part of the search, not a click
    event.preventDefault();
    next = findByText(list, index, event.key);
  } else if ((event.key === 'Enter' || event.key === ' ') && event.target === list[index]) {
    // Items that are not buttons or links get activated like them
    const item = list[index]!;
    if (item.matches('button, a[href], input, summary')) return;
    event.preventDefault();
    if (item.getAttribute('aria-disabled') !== 'true') item.click();
    return;
  }

  if (!next) return;
  event.preventDefault();
  next.focus();
};

watch(isOpen, (value) => {
  const skipFocusReturn = context.skipFocusReturn;
  context.skipFocusReturn = false;
  if (value) {
    isMounted.value = true;
    return;
  }
  // Runs before the panel is removed: give focus back to the trigger if it was inside
  const active = document.activeElement;
  if (!skipFocusReturn && active && context.floating.value?.contains(active)) {
    context.reference.value?.focus({ preventScroll: true });
  }
});

// Focus only after the first position is computed, so the page does not scroll to (0, 0)
watch(
  () => isOpen.value && context.isPositioned.value,
  async (ready) => {
    if (!ready) return;
    // Opened with the arrow keys: focus moves to an item even without autoFocus
    const edge = takeFocusRequest();
    if (!edge && !autoFocus.value) return;
    await nextTick();
    focusPanel(edge);
  }
);

// The arrow keys on the reference while the panel is already open
watch(context.focusRequest, (edge) => {
  if (edge && isOpen.value && context.isPositioned.value) focusPanel(takeFocusRequest());
});
</script>

<template>
  <Teleport :to="props.teleport || 'body'" :disabled="props.teleport === false">
    <div
      v-if="isMounted"
      :ref="setFloating"
      :style="wrapperStyle"
      @pointerenter="context.hover"
      @pointerleave="context.hover"
    >
      <span v-if="hasFocusGuards" v-bind="guardAttrs" @focus="onStartGuardFocus"></span>
      <Transition
        v-bind="transitionProps"
        appear
        @before-leave="onBeforeLeave"
        @after-enter="onAfterEnter"
        @after-leave="onAfterLeave"
      >
        <component
          :is="props.as"
          v-if="isOpen"
          v-bind="panelAttrs()"
          :id="floatingId"
          :ref="setPanel"
          :role="props.role ?? undefined"
          :tabindex="autoFocus ? -1 : undefined"
          data-sbf-state="open"
          :data-sbf-side="side"
          :data-sbf-align="align"
          @keydown="onKeydown"
        >
          <slot></slot>
        </component>
      </Transition>
      <span v-if="hasFocusGuards" v-bind="guardAttrs" @focus="onEndGuardFocus"></span>
    </div>
  </Teleport>
</template>
