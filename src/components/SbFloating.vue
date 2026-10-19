<script setup lang="ts">
import { computed, nextTick, ref, watch, type CSSProperties } from 'vue';
import { useSbFloatingContext } from '../context';
import type { SbFloatingProps } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SbFloatingProps>(), {
  as: 'div',
  role: 'dialog',
  transition: undefined,
  teleportTo: 'body',
  teleportDisabled: false,
  zIndex: undefined,
  autoFocus: false,
});

const emit = defineEmits<{
  /** The enter transition has finished (right after opening when there is no transition). */
  'after-enter': [];
  /** The leave transition has finished and the panel is removed from the DOM. */
  'after-leave': [];
}>();

const context = useSbFloatingContext('SbFloating');
const { isOpen, floatingId, side, align } = context;

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

const onAfterEnter = () => emit('after-enter');

const onAfterLeave = () => {
  if (!isOpen.value) isMounted.value = false;
  emit('after-leave');
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const focusPanel = () => {
  const el = panel.value;
  if (!el) return;
  const target =
    el.querySelector<HTMLElement>('[autofocus]') ?? el.querySelector<HTMLElement>(FOCUSABLE) ?? el;
  target.focus({ preventScroll: true });
};

watch(isOpen, (value) => {
  if (value) {
    isMounted.value = true;
    return;
  }
  // Runs before the panel is removed: give focus back to the trigger if it was inside
  const active = document.activeElement;
  if (active && context.floating.value?.contains(active)) context.reference.value?.focus();
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
      <Transition
        :name="props.transition"
        :css="!!props.transition"
        appear
        @after-enter="onAfterEnter"
        @after-leave="onAfterLeave"
      >
        <component
          :is="props.as"
          v-if="isOpen"
          v-bind="$attrs"
          :id="floatingId"
          :ref="setPanel"
          :role="props.role"
          :tabindex="props.autoFocus ? -1 : undefined"
          :data-sbf-state="isOpen ? 'open' : 'closed'"
          :data-sbf-side="side"
          :data-sbf-align="align"
        >
          <slot></slot>
        </component>
      </Transition>
    </div>
  </Teleport>
</template>
