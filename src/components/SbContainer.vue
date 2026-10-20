<script lang="ts">
// Open containers, most recent last: Escape closes only one of them
const openStack: SbFloatingContext[] = [];

// Default of the `delay` prop, also used for a key missing from an object
const HOVER_DELAY = { open: 300, close: 150 };
</script>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onScopeDispose,
  provide,
  ref,
  toRef,
  useId,
  watch,
} from 'vue';
import {
  moveFocusOut,
  sbFloatingContextKey,
  type SbFloatingContext,
} from '../composables/useSbFloatingContext';
import { useSbFloatingPanel } from '../composables/useSbFloatingPanel';
import type {
  SbCloseReason,
  SbContainerExposed,
  SbContainerProps,
  SbContainerSlotProps,
  SbOpenReason,
} from '../types';
import { isFocusable } from '../utils/dom';
import type { NavigableRole } from '../utils/navigation';

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
  delay: () => ({ ...HOVER_DELAY }),
  closeOnEscape: true,
  closeOnClickOutside: true,
  closeOnFocusOut: true,
});

// `undefined` until the parent binds `v-model:open` or the panel is toggled once
const model = defineModel<boolean | undefined>('open', { default: undefined });

const emit = defineEmits<{
  /** The panel has opened. */
  open: [reason: SbOpenReason];
  /** The panel has closed. */
  close: [reason: SbCloseReason];
}>();

defineSlots<{
  default?: (props: SbContainerSlotProps) => unknown;
}>();

// Read once: `defaultOpen` is only the initial state
const defaultOpen = props.defaultOpen;
const isOpen = computed(() => !props.disabled && (model.value ?? defaultOpen));

let hoverTimer: ReturnType<typeof setTimeout> | undefined;
onScopeDispose(() => clearTimeout(hoverTimer));

// Reason of the change asked last, for the `open` / `close` event. Dropped after the update,
// so a change the parent of `v-model:open` refuses does not lend it to a later one.
let reason: SbOpenReason | SbCloseReason | undefined;

const setOpen = ((value: boolean, why: SbOpenReason | SbCloseReason) => {
  // Opening or closing in any way replaces a pending hover
  clearTimeout(hoverTimer);
  if (value && props.disabled) return;
  if (value === isOpen.value) return;
  reason = why;
  model.value = value;
  // After the update this change queued, where the watcher below reads it
  void nextTick(() => (reason = undefined));
}) as SbFloatingContext['setOpen'];
const open = () => setOpen(true, 'api');
const close = () => setOpen(false, 'api');
const toggle = () => setOpen(!isOpen.value, 'api');

// The pointer moves from the reference onto the panel (or back) before the close delay ends
const hover = (event: PointerEvent) => {
  if (event.pointerType === 'touch') return;
  // A nested panel is teleported out of this one but is part of it: the pointer entering or
  // leaving it enters or leaves the parent too
  parent?.hover(event);
  if (props.trigger !== 'hover') return;
  const inside = event.type === 'pointerenter' || context.contains(event.relatedTarget);
  clearTimeout(hoverTimer);
  if (inside === isOpen.value) return;
  const { delay } = props;
  const key = inside ? 'open' : 'close';
  const ms = typeof delay === 'number' ? delay : (delay[key] ?? HOVER_DELAY[key]);
  hoverTimer = setTimeout(() => setOpen(inside, 'hover'), ms);
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
  setOpen,
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

// Runs before the parts unmount (vuejs.org/api/composition-api-lifecycle), with the DOM intact
onBeforeUnmount(() => {
  context.isUnmounting = true;
  moveFocusOut(context, false);
});

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
  setOpen(false, 'escape');
};

const closeOutside = (target: EventTarget | null) => {
  if (context.contains(target)) return;
  // The browser is about to focus what was pressed: leave focus there
  context.skipFocusReturn = isFocusable(target);
  setOpen(false, 'outside');
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
  if (!context.contains(event.composedPath()[0] ?? event.target)) setOpen(false, 'focus-out');
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

watch(isOpen, (value) => {
  // Not asked by the components: `v-model:open` or the `disabled` prop
  const why = reason ?? (!value && props.disabled ? 'disabled' : 'api');
  reason = undefined;
  if (value) emit('open', why as SbOpenReason);
  else emit('close', why as SbCloseReason);
});

// hideWhenDetached 'close': a panel whose reference is scrolled out of view closes
watch(panel.referenceHidden, (hidden) => {
  if (hidden && props.hideWhenDetached === 'close') setOpen(false, 'detached');
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
