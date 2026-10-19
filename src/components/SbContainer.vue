<script lang="ts">
// Open containers, most recent last: Escape closes only one of them
const openStack: SbFloatingContext[] = [];
</script>

<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  onScopeDispose,
  provide,
  ref,
  toRef,
  useId,
  watch,
} from 'vue';
import { useSbFloatingPanel } from '../composables/useSbFloatingPanel';
import { sbFloatingContextKey, type SbFloatingContext } from '../context';
import { isFocusable, type NavigableRole } from '../focus';
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
  delay: () => ({ open: 300, close: 150 }),
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

// Read once: `defaultOpen` is only the initial state
const defaultOpen = props.defaultOpen;
const isOpen = computed(() => !props.disabled && (model.value ?? defaultOpen));

let hoverTimer: ReturnType<typeof setTimeout> | undefined;
onScopeDispose(() => clearTimeout(hoverTimer));

const setOpen = (value: boolean) => {
  // Opening or closing in any way replaces a pending hover
  clearTimeout(hoverTimer);
  if (value && props.disabled) return;
  if (value !== isOpen.value) model.value = value;
};
const open = () => setOpen(true);
const close = () => setOpen(false);
const toggle = () => setOpen(!isOpen.value);

// The pointer moves from the reference onto the panel (or back) before the close delay ends
const hover = (event: PointerEvent) => {
  if (props.trigger !== 'hover' || event.pointerType === 'touch') return;
  const inside = event.type === 'pointerenter';
  clearTimeout(hoverTimer);
  if (inside === isOpen.value) return;
  const { delay } = props;
  const delays = typeof delay === 'number' ? { open: delay, close: delay } : delay;
  const ms = (inside ? delays.open : delays.close) ?? (inside ? 300 : 150);
  hoverTimer = setTimeout(() => setOpen(inside), ms);
};

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

// A container nested inside another one (e.g. a submenu in a panel) is treated as part of it:
// clicks inside it are not "outside" for the parent. Escape closes the innermost first
// because it opened last.
const parent = inject(sbFloatingContextKey, null);

const context: SbFloatingContext = {
  ...panel,
  isOpen,
  disabled: toRef(props, 'disabled'),
  trigger: toRef(props, 'trigger'),
  floatingId: `${useId()}-floating`,
  referenceId: ref<string | undefined>(),
  // Same default as the `role` prop of SbFloating, for the render before it is set up
  floatingRole: ref<string | null>('dialog'),
  navigation: ref<NavigableRole | null>(null),
  focusRequest: ref<'first' | 'last' | null>(null),
  parent,
  skipFocusReturn: false,
  parts: { reference: 0, floating: 0 },
  isUnmounting: false,
  open,
  close,
  toggle,
  hover,
  contains: (target) => {
    if (!(target instanceof Node)) return false;
    if (panel.reference.value?.contains(target) || panel.floating.value?.contains(target)) {
      return true;
    }
    return [...children].some((child) => child.contains(target));
  },
  registerChild: (child) => {
    children.add(child);
    return () => children.delete(child);
  },
};

if (parent) onScopeDispose(parent.registerChild(context));

provide(sbFloatingContextKey, context);

// Runs before the parts unmount (vuejs.org/api/composition-api-lifecycle)
onBeforeUnmount(() => (context.isUnmounting = true));

// The most recently opened panel that has focus, else the most recently opened one:
// two sibling panels stay open together when closeOnClickOutside is false
const escapeTarget = (event: KeyboardEvent) => {
  const target = event.composedPath()[0] ?? event.target;
  const withFocus = openStack.findLast((container) => container.contains(target));
  return withFocus ?? openStack[openStack.length - 1];
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || escapeTarget(event) !== context) return;
  // Already handled by a widget inside (e.g. a combobox), or ending an IME composition
  if (!props.closeOnEscape || event.defaultPrevented || event.isComposing) return;
  // Stops a surrounding native <dialog> from closing too
  event.preventDefault();
  close();
};

const closeOutside = (target: EventTarget | null) => {
  if (context.contains(target)) return;
  // The browser is about to focus what was pressed: leave focus there
  context.skipFocusReturn = isFocusable(target);
  close();
};

let cancelTouchClick: (() => void) | undefined;

const onPointerdown = (event: PointerEvent) => {
  cancelTouchClick?.();
  if (!props.closeOnClickOutside) return;
  const target = event.composedPath()[0] ?? event.target;
  if (event.pointerType !== 'touch') {
    closeOutside(target);
    return;
  }
  // A touch may start a scroll: decide on the click of a tap, which a scroll never fires
  if (context.contains(target)) return;
  const onClick = (click: MouseEvent) => {
    cancelTouchClick?.();
    closeOutside(click.composedPath()[0] ?? click.target);
  };
  document.addEventListener('click', onClick, true);
  cancelTouchClick = () => {
    document.removeEventListener('click', onClick, true);
    cancelTouchClick = undefined;
  };
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
    openStack.push(context);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onPointerdown, true);
    document.addEventListener('focusin', onFocusin);
    onCleanup(() => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('pointerdown', onPointerdown, true);
      document.removeEventListener('focusin', onFocusin);
      cancelTouchClick?.();
      openStack.splice(openStack.indexOf(context), 1);
    });
  },
  { immediate: true }
);

watch(isOpen, (value) => (value ? emit('open') : emit('close')));

// hideWhenDetached 'close': a panel whose reference is scrolled out of view closes
watch(panel.referenceHidden, (hidden) => {
  if (hidden && props.hideWhenDetached === 'close') close();
});

watch(
  () => props.disabled,
  (disabled) => {
    // Also when open only through `defaultOpen`, so it does not reopen once enabled again
    if (disabled && (model.value ?? defaultOpen)) model.value = false;
  }
);

defineExpose<SbContainerExposed>({
  get isOpen() {
    return isOpen.value;
  },
  open,
  close,
  toggle,
  update: panel.update,
});
</script>

<template>
  <slot
    :is-open="isOpen"
    :open="open"
    :close="close"
    :toggle="toggle"
    :placement="panel.placement.value"
    :side="panel.side.value"
    :align="panel.align.value"
    :floating-id="context.floatingId"
    :reference-id="context.referenceId.value"
  ></slot>
</template>
