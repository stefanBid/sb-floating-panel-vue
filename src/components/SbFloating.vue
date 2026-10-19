<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  useAttrs,
  watch,
  watchEffect,
  type CSSProperties,
  type TransitionProps,
} from 'vue';
import { POPUP_ROLES, useSbFloatingContext } from '../context';
import { FOCUS_GUARD_ATTRIBUTE, getNextTabbable, getTabbables } from '../focus';
import type { SbFloatingProps } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SbFloatingProps>(), {
  as: 'div',
  role: 'dialog',
  transition: undefined,
  teleportTo: 'body',
  teleportDisabled: false,
  zIndex: undefined,
  autoFocus: true,
});

const emit = defineEmits<{
  /** The enter transition has finished (right after opening when there is no transition). */
  'after-enter': [];
  /** The leave transition has finished and the panel is removed from the DOM. */
  'after-leave': [];
}>();

const attrs = useAttrs();
const context = useSbFloatingContext('SbFloating');
const { isOpen, floatingId, referenceId, side, align } = context;

// Lets SbReference derive `aria-haspopup` from the role
watchEffect(() => {
  context.floatingRole.value = props.role;
});

// The wrapper stays mounted until the leave transition of the panel has finished,
// so the panel keeps its position while it animates out.
const isMounted = ref(isOpen.value);
const panel = ref<HTMLElement | null>(null);

const setFloating = (el: unknown) => {
  context.floating.value = el instanceof HTMLElement ? el : null;
};

const setPanel = (el: unknown) => {
  panel.value = el instanceof HTMLElement ? el : null;
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

// Guards are needed only when the panel is teleported away from the reference
const hasFocusGuards = computed(() => isOpen.value && !props.teleportDisabled);

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

const focusPanel = () => {
  const el = panel.value;
  if (!el) return;
  const target = el.querySelector<HTMLElement>('[autofocus]') ?? getTabbables(el)[0] ?? el;
  target.focus({ preventScroll: true });
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
    if (!ready || !props.autoFocus) return;
    await nextTick();
    focusPanel();
  }
);
</script>

<template>
  <Teleport :to="props.teleportTo" :disabled="props.teleportDisabled">
    <div v-if="isMounted" :ref="setFloating" :style="wrapperStyle">
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
          :tabindex="props.autoFocus ? -1 : undefined"
          data-sbf-state="open"
          :data-sbf-side="side"
          :data-sbf-align="align"
        >
          <slot></slot>
        </component>
      </Transition>
      <span v-if="hasFocusGuards" v-bind="guardAttrs" @focus="onEndGuardFocus"></span>
    </div>
  </Teleport>
</template>
