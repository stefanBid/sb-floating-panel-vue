<script lang="ts">
const handledEscapes = new WeakSet<Event>();
</script>

<script setup lang="ts">
import { computed, inject, onScopeDispose, provide, ref, toRef, useId, watch } from 'vue';
import { useSbFloatingPanel } from '../composables/useSbFloatingPanel';
import { sbFloatingContextKey, type SbFloatingContext } from '../context';
import type { SbContainerExposed, SbContainerProps, SbContainerSlotProps } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Omit<SbContainerProps, 'open'>>(), {
  placement: 'bottom-start',
  strategy: 'absolute',
  offset: 8,
  padding: 8,
  matchWidth: false,
  hideWhenDetached: false,
  defaultOpen: false,
  disabled: false,
  trigger: 'click',
  closeOnEscape: true,
  closeOnClickOutside: true,
  closeOnFocusOut: true,
});

// `undefined` until the parent binds `v-model:open` or the panel is toggled once
const model = defineModel<boolean | undefined>('open', { default: undefined });

const emit = defineEmits<{
  /** The panel has opened. */
  open: [];
  /** The panel has closed. */
  close: [];
}>();

defineSlots<{
  default?: (props: SbContainerSlotProps) => unknown;
}>();

const isOpen = computed(() => !props.disabled && (model.value ?? props.defaultOpen));

const setOpen = (value: boolean) => {
  if (value && props.disabled) return;
  if (value !== isOpen.value) model.value = value;
};
const open = () => setOpen(true);
const close = () => setOpen(false);
const toggle = () => setOpen(!isOpen.value);

const panel = useSbFloatingPanel({
  isOpen,
  placement: () => props.placement,
  strategy: () => props.strategy,
  offset: () => props.offset,
  padding: () => props.padding,
  matchWidth: () => props.matchWidth,
  hideWhenDetached: () => props.hideWhenDetached,
});

const children = new Set<SbFloatingContext>();

const context: SbFloatingContext = {
  ...panel,
  isOpen,
  disabled: toRef(props, 'disabled'),
  trigger: toRef(props, 'trigger'),
  floatingId: `${useId()}-floating`,
  referenceId: ref<string | undefined>(),
  // Same default as the `role` prop of SbFloating, for the render before it is set up
  floatingRole: ref<string | null>('dialog'),
  open,
  close,
  toggle,
  contains: (target) => {
    if (!(target instanceof Node)) return false;
    if (panel.reference.value?.contains(target) || panel.floating.value?.contains(target)) {
      return true;
    }
    return [...children].some((child) => child.contains(target));
  },
  hasOpenChild: () => [...children].some((child) => child.isOpen.value || child.hasOpenChild()),
  registerChild: (child) => {
    children.add(child);
    return () => children.delete(child);
  },
};

// A container nested inside another one (e.g. a submenu in a panel) is treated as part of it:
// clicks inside it are not "outside" for the parent, and Escape closes the innermost first.
const parent = inject(sbFloatingContextKey, null);
if (parent) onScopeDispose(parent.registerChild(context));

provide(sbFloatingContextKey, context);

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !props.closeOnEscape || context.hasOpenChild()) return;
  // Every open container listens on document: only the innermost one handles the event
  if (handledEscapes.has(event)) return;
  handledEscapes.add(event);
  close();
};

const onPointerdown = (event: PointerEvent) => {
  if (!props.closeOnClickOutside) return;
  if (!context.contains(event.composedPath()[0] ?? event.target)) close();
};

// A non-modal panel closes when keyboard focus moves on to the rest of the page
const onFocusin = (event: FocusEvent) => {
  if (!props.closeOnFocusOut) return;
  if (!context.contains(event.composedPath()[0] ?? event.target)) close();
};

// Document listeners only while the panel is open
watch(
  isOpen,
  (value, _previous, onCleanup) => {
    if (!value || typeof document === 'undefined') return;
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onPointerdown, true);
    document.addEventListener('focusin', onFocusin);
    onCleanup(() => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('pointerdown', onPointerdown, true);
      document.removeEventListener('focusin', onFocusin);
    });
  },
  { immediate: true }
);

watch(isOpen, (value) => (value ? emit('open') : emit('close')));

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled && model.value) model.value = false;
  }
);

defineExpose<SbContainerExposed>({ open, close, toggle, update: panel.update });
</script>

<template>
  <slot
    :is-open="isOpen"
    :open="open"
    :close="close"
    :toggle="toggle"
    :placement="panel.placement.value"
    :side="panel.side.value"
  ></slot>
</template>
