import { config, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, type VNodeChild } from 'vue';
import { SbContainer, SbFloating, SbReference, useSbFloating } from '../src';
import type { SbContainerExposed, SbContainerProps, SbContainerSlotProps } from '../src';

enableAutoUnmount(afterEach);
// Render the real <Transition>: the stub adds an element between the wrapper and the panel
config.global.stubs = { transition: false };

interface MountOptions {
  referenceProps?: Record<string, unknown>;
  floatingProps?: Record<string, unknown>;
  content?: (slot: SbContainerSlotProps) => VNodeChild;
  attachTo?: HTMLElement;
}

function mountPanel(
  props: SbContainerProps & Record<string, unknown> = {},
  options: MountOptions = {}
) {
  return mount(SbContainer, {
    props,
    attachTo: options.attachTo ?? document.body,
    slots: {
      default: (slot: SbContainerSlotProps) => [
        h(SbReference, options.referenceProps ?? {}, () => 'Trigger'),
        h(SbFloating, options.floatingProps ?? {}, () =>
          options.content ? options.content(slot) : h('button', { class: 'inside' }, 'Inside')
        ),
      ],
    },
  });
}

// A text field reference, which has no content
const mountField = (floatingProps: Record<string, unknown> = {}) =>
  mount(SbContainer, {
    attachTo: document.body,
    slots: {
      default: () => [
        h(SbReference, { as: 'input', 'aria-label': 'Search' }),
        h(SbFloating, floatingProps, () => h('button', { role: 'option' }, 'Result')),
      ],
    },
  });

const trigger = () => document.querySelector<HTMLElement>('[aria-expanded]')!;
const panel = () => document.querySelector<HTMLElement>('[role="dialog"]');

const click = async (el: Element) => {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
  (el as HTMLElement).click();
  await nextTick();
};

const keydown = async (el: Element | Document, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  await nextTick();
  return event;
};

// Opens the panel and waits for the position, after which focus moves inside
const openAndSettle = async () => {
  await click(trigger());
  await flushPromises();
  await nextTick();
};

const guards = () => document.querySelectorAll<HTMLElement>('[data-sbf-focus-guard]');

// What the browser does when Tab lands on a focus guard
const tabOnto = async (guard: HTMLElement, from: Element) => {
  guard.dispatchEvent(new FocusEvent('focus', { relatedTarget: from }));
  await nextTick();
};

describe('SbReference', () => {
  it('renders a button that does not submit forms', () => {
    mountPanel();
    expect(trigger().tagName).toBe('BUTTON');
    expect(trigger().getAttribute('type')).toBe('button');
    expect(trigger().hasAttribute('role')).toBe(false);
    expect(trigger().hasAttribute('tabindex')).toBe(false);
  });

  it('makes non-interactive tags keyboard-operable', async () => {
    mountPanel({}, { referenceProps: { as: 'div' } });
    expect(trigger().getAttribute('role')).toBe('button');
    expect(trigger().getAttribute('tabindex')).toBe('0');
    expect(trigger().hasAttribute('type')).toBe(false);

    await keydown(trigger(), 'Enter');
    expect(panel()).not.toBeNull();
    await keydown(trigger(), ' ');
    expect(panel()).toBeNull();
  });

  it('treats an a without href as a non-interactive tag', async () => {
    const wrapper = mountPanel({}, { referenceProps: { as: 'a' } });
    expect(trigger().getAttribute('role')).toBe('button');
    expect(trigger().getAttribute('tabindex')).toBe('0');
    await keydown(trigger(), 'Enter');
    expect(panel()).not.toBeNull();
    wrapper.unmount();

    mountPanel({ disabled: true }, { referenceProps: { as: 'a', href: '#account' } });
    expect(trigger().hasAttribute('role')).toBe(false);
    expect(trigger().hasAttribute('tabindex')).toBe(false);
    expect(trigger().getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps an input a text field that opens on click and keeps focus', async () => {
    mountField();
    expect(trigger().hasAttribute('role')).toBe(false);
    expect(trigger().hasAttribute('tabindex')).toBe(false);
    expect((await keydown(trigger(), ' ')).defaultPrevented).toBe(false);
    expect((await keydown(trigger(), 'Enter')).defaultPrevented).toBe(false);
    expect(panel()).toBeNull();

    trigger().focus();
    await openAndSettle();
    expect(panel()).not.toBeNull();
    expect(document.activeElement).toBe(trigger());
    // A second click places the caret, it does not close the panel
    await click(trigger());
    expect(panel()).not.toBeNull();
  });

  it('renders a component as the reference', async () => {
    const MyButton = defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h('button', { class: 'my-button', type: 'button' }, slots.default?.()),
    });
    mountPanel({}, { referenceProps: { as: MyButton } });
    const el = trigger();
    expect(el.classList.contains('my-button')).toBe(true);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('tabindex')).toBe(false);

    await click(el);
    expect(panel()).not.toBeNull();
    expect(el.getAttribute('aria-expanded')).toBe('true');
    expect(panel()!.getAttribute('aria-labelledby')).toBe(el.id);
  });

  it('sets ARIA and state attributes', async () => {
    mountPanel({}, { referenceProps: { ariaHaspopup: 'menu' } });
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().hasAttribute('aria-controls')).toBe(false);
    expect(trigger().dataset.sbfState).toBe('closed');

    await click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id);
    expect(trigger().dataset.sbfState).toBe('open');
  });

  it('keeps the click handler and propagation of the user', async () => {
    const onClick = vi.fn();
    const onParentClick = vi.fn();
    document.body.addEventListener('click', onParentClick);
    mountPanel({}, { referenceProps: { onClick } });

    await click(trigger());
    expect(onClick).toHaveBeenCalledOnce();
    expect(onParentClick).toHaveBeenCalledOnce();
    expect(panel()).not.toBeNull();
    document.body.removeEventListener('click', onParentClick);
  });

  it('derives aria-haspopup from the role of the panel', async () => {
    const cases: [string, string | null][] = [
      ['menu', 'menu'],
      ['alertdialog', 'dialog'],
      ['tooltip', null],
    ];
    for (const [role, expected] of cases) {
      const wrapper = mountPanel({}, { floatingProps: { role } });
      // SbFloating is set up after SbReference has rendered: updated before the next paint
      await nextTick();
      expect(trigger()?.getAttribute('aria-haspopup') ?? null).toBe(expected);
      wrapper.unmount();
    }
  });

  it('uses the id prop as the id of the element', () => {
    mountPanel({}, { referenceProps: { id: 'account' } });
    expect(trigger().id).toBe('account');
  });

  it('moves focus into the open panel on Tab', async () => {
    mountPanel({}, { floatingProps: { autoFocus: false } });
    await openAndSettle();
    trigger().focus();

    const event = await keydown(trigger(), 'Tab');
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('.inside'));

    const shiftTab = await keydown(trigger(), 'Tab', { shiftKey: true });
    expect(shiftTab.defaultPrevented).toBe(false);
  });
});

describe('SbFloating', () => {
  it('is teleported to body with role, id and data attributes', async () => {
    const wrapper = mountPanel({ placement: 'top-end' }, { floatingProps: { class: 'my-panel' } });
    await click(trigger());
    await flushPromises();

    const el = panel()!;
    expect(wrapper.element.contains(el)).toBe(false);
    expect(el.classList.contains('my-panel')).toBe(true);
    expect(el.id).toMatch(/-floating$/);
    expect(el.dataset.sbfState).toBe('open');
    expect(el.dataset.sbfSide).toBe('top');
    expect(el.dataset.sbfAlign).toBe('end');
    // The user class goes on the panel, the positioning styles on its wrapper
    expect(el.style.position).toBe('');
    expect(el.parentElement!.style.position).toBe('absolute');
  });

  it('applies zIndex to the wrapper and a custom role', async () => {
    mountPanel({ defaultOpen: true }, { floatingProps: { zIndex: 50, role: 'menu' } });
    await nextTick();
    const el = document.querySelector<HTMLElement>('[role="menu"]')!;
    expect(el.parentElement!.style.zIndex).toBe('50');
  });

  it('exposes the reference width as a CSS variable and applies matchWidth', async () => {
    mountPanel({ defaultOpen: true, matchWidth: 'min' });
    await flushPromises();
    const wrapper = panel()!.parentElement!;
    expect(wrapper.style.getPropertyValue('--sbf-reference-width')).toMatch(/px$/);
    expect(wrapper.style.minWidth).toMatch(/px$/);
    expect(wrapper.style.width).toBe('');
  });

  it('applies the transition classes to the panel and waits for the leave', async () => {
    const wrapper = mountPanel({}, { floatingProps: { transition: 'pop' } });
    await click(trigger());
    expect(panel()!.classList.contains('pop-enter-active')).toBe(true);

    await click(trigger());
    // Still mounted while leaving, then removed together with its wrapper
    expect(panel()!.classList.contains('pop-leave-active')).toBe(true);
    expect(panel()!.dataset.sbfState).toBe('closed');
    await vi.waitFor(() => expect(panel()).toBeNull());
    expect(document.body.querySelectorAll('body > div:not([data-v-app])')).toHaveLength(0);
    expect(wrapper.findComponent(SbFloating).emitted('after-leave')).toHaveLength(1);
  });

  it('accepts Transition props, e.g. utility classes', async () => {
    mountPanel(
      {},
      { floatingProps: { transition: { enterActiveClass: 'ease-out', leaveToClass: 'opacity-0' } } }
    );
    await click(trigger());
    expect(panel()!.classList.contains('ease-out')).toBe(true);

    await click(trigger());
    expect(panel()!.dataset.sbfState).toBe('closed');
    await vi.waitFor(() => expect(panel()).toBeNull());
  });

  it('exposes the transform origin facing the reference', async () => {
    mountPanel({ defaultOpen: true, placement: 'top-end' });
    await flushPromises();
    const wrapper = panel()!.parentElement!;
    expect(wrapper.style.getPropertyValue('--sbf-transform-origin')).toBe('100% 100%');
  });

  it('mirrors the transform origin in right-to-left text, on the top and bottom sides', async () => {
    document.documentElement.style.direction = 'rtl';
    const cases: [SbContainerProps['placement'], string][] = [
      ['top-end', '0% 100%'],
      ['bottom-start', '100% 0%'],
      ['right-start', '0% 0%'],
    ];
    for (const [placement, origin] of cases) {
      const wrapper = mountPanel({ defaultOpen: true, placement });
      await flushPromises();
      const floating = panel()!.parentElement!;
      expect(floating.style.getPropertyValue('--sbf-transform-origin')).toBe(origin);
      wrapper.unmount();
    }
    document.documentElement.style.direction = '';
  });

  it('renders the panel without any stylesheet', () => {
    mountPanel({ defaultOpen: true });
    expect(document.querySelectorAll('style, link[rel="stylesheet"]')).toHaveLength(0);
  });

  it('throws outside SbContainer', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => mount(SbFloating)).toThrow('<SbFloating> must be used inside <SbContainer>');
  });

  it('is named after the reference unless the user names it', async () => {
    const wrapper = mountPanel({ defaultOpen: true });
    await nextTick();
    expect(trigger().id).toMatch(/-reference$/);
    expect(panel()!.getAttribute('aria-labelledby')).toBe(trigger().id);
    wrapper.unmount();

    mountPanel({ defaultOpen: true }, { floatingProps: { 'aria-label': 'Account' } });
    await nextTick();
    expect(panel()!.hasAttribute('aria-labelledby')).toBe(false);
    expect(panel()!.getAttribute('aria-label')).toBe('Account');
  });

  it('names only popup roles after the reference', async () => {
    mountPanel({ defaultOpen: true }, { floatingProps: { role: 'tooltip' } });
    await nextTick();
    expect(document.querySelector('[role="tooltip"]')!.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('keeps an aria-labelledby passed by the user', async () => {
    mountPanel({ defaultOpen: true }, { floatingProps: { 'aria-labelledby': 'title' } });
    await nextTick();
    expect(panel()!.getAttribute('aria-labelledby')).toBe('title');
  });

  it('renders no role, name or aria-haspopup with role null', async () => {
    mountPanel({ defaultOpen: true }, { floatingProps: { role: null, class: 'disclosure' } });
    await nextTick();
    const el = document.querySelector('.disclosure')!;
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
    expect(trigger().hasAttribute('aria-haspopup')).toBe(false);
  });

  it('moves focus inside by default, not with autoFocus false', async () => {
    const wrapper = mountPanel();
    trigger().focus();
    await openAndSettle();
    expect(document.activeElement).toBe(document.querySelector('.inside'));
    wrapper.unmount();

    mountPanel({}, { floatingProps: { autoFocus: false } });
    trigger().focus();
    await openAndSettle();
    expect(document.activeElement).toBe(trigger());
  });

  it('keeps the Tab order of the teleported panel with focus guards', async () => {
    const host = document.createElement('div');
    const after = document.createElement('button');
    after.className = 'after';
    document.body.append(host, after);
    mountPanel(
      {},
      {
        attachTo: host,
        content: () => [
          h('button', { class: 'first' }, 'First'),
          h('button', { class: 'last' }, 'Last'),
        ],
      }
    );
    await openAndSettle();
    const [start, end] = guards();
    const first = document.querySelector('.first')!;
    const last = document.querySelector('.last')!;
    expect(start!.nextElementSibling).toBe(panel());
    expect(end!.previousElementSibling).toBe(panel());

    // Shift+Tab from the first element goes back to the reference, the panel stays open
    await tabOnto(start!, first);
    expect(document.activeElement).toBe(trigger());
    expect(panel()).not.toBeNull();

    // Shift+Tab from what follows the panel in the DOM enters it from the end
    await tabOnto(end!, document.body);
    expect(document.activeElement).toBe(last);

    // Tab from the last element goes on after the reference and closes the panel
    await tabOnto(end!, last);
    expect(document.activeElement).toBe(after);
    expect(panel()).toBeNull();
    after.remove();
    host.remove();
  });

  it('enters the open panel from the end with Shift+Tab from what follows the reference', async () => {
    const host = document.createElement('div');
    const after = document.createElement('button');
    document.body.append(host, after);
    mountPanel(
      { closeOnFocusOut: false },
      {
        attachTo: host,
        content: () => [
          h('button', { class: 'first' }, 'First'),
          h('button', { class: 'last' }, 'Last'),
        ],
      }
    );
    await openAndSettle();
    after.focus();
    expect(panel()).not.toBeNull();

    const shiftTab = await keydown(after, 'Tab', { shiftKey: true });
    expect(shiftTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('.last'));

    // Left to the browser from anywhere else, and once the panel is closed
    expect((await keydown(trigger(), 'Tab', { shiftKey: true })).defaultPrevented).toBe(false);
    await click(trigger());
    expect(panel()).toBeNull();
    expect((await keydown(after, 'Tab', { shiftKey: true })).defaultPrevented).toBe(false);
    after.remove();
    host.remove();
  });

  it('renders no focus guards when not teleported', async () => {
    mountPanel({ defaultOpen: true }, { floatingProps: { teleport: false } });
    await nextTick();
    expect(guards()).toHaveLength(0);
  });

  it('moves focus inside when autoFocus is set and gives it back on close', async () => {
    mountPanel({}, { floatingProps: { autoFocus: true } });
    trigger().focus();
    await click(trigger());
    await flushPromises();
    await nextTick();
    expect(document.activeElement).toBe(document.querySelector('.inside'));

    await keydown(document, 'Escape');
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });
});

describe('SbContainer', () => {
  it('toggles on click and emits open / close', async () => {
    const wrapper = mountPanel();
    expect(panel()).toBeNull();

    await click(trigger());
    expect(panel()).not.toBeNull();
    await click(trigger());
    expect(panel()).toBeNull();

    expect(wrapper.emitted('open')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('update:open')).toEqual([[true], [false]]);
  });

  it('closes on Escape unless closeOnEscape is false', async () => {
    const wrapper = mountPanel({ defaultOpen: true });
    await keydown(document, 'Escape');
    expect(panel()).toBeNull();

    await wrapper.setProps({ closeOnEscape: false });
    await click(trigger());
    await keydown(document, 'Escape');
    expect(panel()).not.toBeNull();
  });

  it('closes on a press outside, not inside', async () => {
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const wrapper = mountPanel({ defaultOpen: true });

    await click(document.querySelector('.inside')!);
    expect(panel()).not.toBeNull();
    await click(outside);
    expect(panel()).toBeNull();

    await wrapper.setProps({ closeOnClickOutside: false });
    await click(trigger());
    await click(outside);
    expect(panel()).not.toBeNull();
    outside.remove();
  });

  it('waits for the click of a tap before closing on touch', async () => {
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    mountPanel({ defaultOpen: true });
    await nextTick();
    const touch = () =>
      outside.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerType: 'touch' })
      );

    // A touch that becomes a scroll fires no click
    touch();
    await nextTick();
    expect(panel()).not.toBeNull();

    touch();
    outside.click();
    await nextTick();
    expect(panel()).toBeNull();
    outside.remove();
  });

  it('leaves Escape to widgets that handle it and to IME composition', async () => {
    mountPanel({ defaultOpen: true });
    await nextTick();
    const inside = document.querySelector('.inside')!;
    inside.addEventListener('keydown', (event) => event.preventDefault(), { once: true });

    await keydown(inside, 'Escape');
    expect(panel()).not.toBeNull();
    await keydown(document, 'Escape', { isComposing: true });
    expect(panel()).not.toBeNull();

    const event = await keydown(document, 'Escape');
    expect(event.defaultPrevented).toBe(true);
    expect(panel()).toBeNull();
  });

  it('closes the most recently opened of two sibling containers on Escape', async () => {
    const first = mountPanel({ defaultOpen: true }, { floatingProps: { class: 'first' } });
    const second = mountPanel({ defaultOpen: true }, { floatingProps: { class: 'second' } });
    await nextTick();

    await keydown(document, 'Escape');
    expect(document.querySelector('.second')).toBeNull();
    expect(document.querySelector('.first')).not.toBeNull();
    first.unmount();
    second.unmount();
  });

  it('gives focus back without scrolling, unless an outside press focuses something else', async () => {
    const field = document.createElement('input');
    const text = document.createElement('p');
    document.body.append(field, text);
    mountPanel({}, { floatingProps: { autoFocus: false } });
    const focus = vi.spyOn(trigger(), 'focus');

    // Pressing plain text: focus would be lost, so it goes back to the trigger
    await click(trigger());
    (document.querySelector('.inside') as HTMLElement).focus();
    await click(text);
    expect(panel()).toBeNull();
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });

    // Pressing a field: the browser focuses it, the trigger is left alone
    focus.mockClear();
    await click(trigger());
    (document.querySelector('.inside') as HTMLElement).focus();
    await click(field);
    expect(panel()).toBeNull();
    expect(focus).not.toHaveBeenCalled();
    field.remove();
    text.remove();
  });

  it('closes when focus moves outside unless closeOnFocusOut is false', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const wrapper = mountPanel({ defaultOpen: true });
    await nextTick();

    (document.querySelector('.inside') as HTMLElement).focus();
    trigger().focus();
    expect(panel()).not.toBeNull();
    outside.focus();
    await nextTick();
    expect(panel()).toBeNull();

    await wrapper.setProps({ closeOnFocusOut: false });
    await click(trigger());
    outside.focus();
    await nextTick();
    expect(panel()).not.toBeNull();
    outside.remove();
  });

  it('supports v-model:open', async () => {
    const wrapper = mountPanel({ open: false, 'onUpdate:open': () => {} });
    await click(trigger());
    // Controlled: the parent has not updated `open` yet
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
    expect(panel()).toBeNull();

    await wrapper.setProps({ open: true });
    expect(panel()).not.toBeNull();
  });

  it('starts open with defaultOpen', () => {
    mountPanel({ defaultOpen: true });
    expect(panel()).not.toBeNull();
  });

  it('does not open when disabled and closes when it becomes disabled', async () => {
    const wrapper = mountPanel({ disabled: true });
    expect(trigger().hasAttribute('disabled')).toBe(true);
    await click(trigger());
    expect(panel()).toBeNull();

    await wrapper.setProps({ disabled: false });
    await click(trigger());
    expect(panel()).not.toBeNull();
    await wrapper.setProps({ disabled: true });
    expect(panel()).toBeNull();
  });

  it('uses defaultOpen only as the initial state', async () => {
    const wrapper = mountPanel({ defaultOpen: true });
    await wrapper.setProps({ disabled: true });
    expect(panel()).toBeNull();
    await wrapper.setProps({ disabled: false });
    expect(panel()).toBeNull();
    wrapper.unmount();

    const closed = mountPanel({ defaultOpen: false });
    await closed.setProps({ defaultOpen: true });
    expect(panel()).toBeNull();
  });

  it('opens only programmatically with the manual trigger', async () => {
    const wrapper = mountPanel(
      { trigger: 'manual' },
      { content: (slot) => h('button', { class: 'close', onClick: slot.close }, 'Close') }
    );
    await click(trigger());
    expect(panel()).toBeNull();

    (wrapper.vm as unknown as { open: () => void }).open();
    await nextTick();
    expect(panel()).not.toBeNull();
    await click(document.querySelector('.close')!);
    expect(panel()).toBeNull();
  });

  it('treats a nested container as part of its parent', async () => {
    mount(SbContainer, {
      props: { defaultOpen: true },
      attachTo: document.body,
      slots: {
        default: () => [
          h(SbReference, { class: 'parent' }, () => 'Parent'),
          h(SbFloating, { role: 'menu' }, () =>
            h(SbContainer, { defaultOpen: true }, () => [
              h(SbReference, { class: 'child' }, () => 'Child'),
              h(SbFloating, { role: 'listbox' }, () => h('span', { class: 'leaf' }, 'Leaf')),
            ])
          ),
        ],
      },
    });
    const menu = () => document.querySelector('[role="menu"]');
    const listbox = () => document.querySelector('[role="listbox"]');

    await click(document.querySelector('.leaf')!);
    expect(menu()).not.toBeNull();
    expect(listbox()).not.toBeNull();

    await keydown(document, 'Escape');
    expect(listbox()).toBeNull();
    expect(menu()).not.toBeNull();

    await keydown(document, 'Escape');
    expect(menu()).toBeNull();
  });
});

describe('keyboard navigation', () => {
  const buttons = (labels: string[], role = 'menuitem') =>
    labels.map((label) => h('button', { role }, label));
  const items = () => [
    ...document.querySelectorAll<HTMLElement>('[role="menuitem"], [role="option"]'),
  ];
  const menu = () => document.querySelector('[role="menu"]');
  const settle = async () => {
    await flushPromises();
    await nextTick();
  };
  // Keys go to the focused element, like in the browser
  const press = (key: string, init: KeyboardEventInit = {}) =>
    keydown(document.activeElement!, key, init);

  const mountMenu = (labels = ['Profile', 'Settings', 'Sign out'], floatingProps = {}) =>
    mountPanel(
      {},
      { floatingProps: { role: 'menu', ...floatingProps }, content: () => buttons(labels) }
    );

  it('opens a menu on its first or last item with the arrow keys on the reference', async () => {
    mountMenu();
    trigger().focus();
    const down = await press('ArrowDown');
    await settle();
    expect(down.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(items()[0]);

    await keydown(document, 'Escape');
    expect(document.activeElement).toBe(trigger());
    await press('ArrowUp');
    await settle();
    expect(document.activeElement).toBe(items()[2]);
  });

  it('focuses an edge item from the reference when already open, even without autoFocus', async () => {
    mountMenu(undefined, { autoFocus: false });
    trigger().focus();
    await openAndSettle();
    expect(document.activeElement).toBe(trigger());

    await press('ArrowUp');
    expect(document.activeElement).toBe(items()[2]);
  });

  it('moves between the items of a menu with arrows, Home and End, wrapping around', async () => {
    mountMenu();
    trigger().focus();
    await press('ArrowDown');
    await settle();

    const steps: [string, number][] = [
      ['ArrowDown', 1],
      ['End', 2],
      ['ArrowDown', 0],
      ['ArrowUp', 2],
      ['Home', 0],
    ];
    for (const [key, index] of steps) {
      const event = await press(key);
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(items()[index]);
    }
  });

  it('opens a listbox on its selected option and stops at its ends', async () => {
    mountPanel(
      {},
      {
        floatingProps: { role: 'listbox' },
        content: () =>
          ['Red', 'Green', 'Blue'].map((label) =>
            h(
              'li',
              { role: 'option', tabindex: -1, 'aria-selected': String(label === 'Green') },
              label
            )
          ),
      }
    );
    trigger().focus();
    await openAndSettle();
    expect(document.activeElement).toBe(items()[1]);

    await press('ArrowUp');
    await press('ArrowUp');
    expect(document.activeElement).toBe(items()[0]);
    await press('End');
    await press('ArrowDown');
    expect(document.activeElement).toBe(items()[2]);
  });

  it('focuses the next item starting with the typed letters', async () => {
    mountMenu(['Save', 'Settings', 'Share', 'Open']);
    trigger().focus();
    await press('ArrowDown');
    await settle();

    // The same letter again cycles through the items starting with it
    for (const index of [1, 2, 0]) {
      await press('s');
      expect(document.activeElement).toBe(items()[index]);
    }
  });

  it('matches several typed letters, with Space as part of the search', async () => {
    mountMenu(['Open', 'Save', 'Set up', 'Settings']);
    trigger().focus();
    await press('ArrowDown');
    await settle();

    for (const key of ['s', 'e', 't']) await press(key);
    expect(document.activeElement).toBe(items()[2]);
    const space = await press(' ');
    expect(space.defaultPrevented).toBe(true);
    await press('u');
    expect(document.activeElement).toBe(items()[2]);
  });

  it('activates items that are not buttons with Enter and Space', async () => {
    const onSelect = vi.fn();
    mountPanel(
      {},
      {
        floatingProps: { role: 'menu' },
        content: () => [
          h('div', { role: 'menuitem', tabindex: -1, onClick: onSelect }, 'Rename'),
          h(
            'div',
            { role: 'menuitem', tabindex: -1, 'aria-disabled': 'true', onClick: onSelect },
            'Delete'
          ),
          h('button', { role: 'menuitem' }, 'Share'),
        ],
      }
    );
    trigger().focus();
    await press('ArrowDown');
    await settle();

    await press('Enter');
    await press(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
    await press('ArrowDown');
    await press('Enter');
    expect(onSelect).toHaveBeenCalledTimes(2);
    // A button gets activated by the browser
    await press('ArrowDown');
    expect((await press('Enter')).defaultPrevented).toBe(false);
  });

  it('closes a menu with Tab and moves focus on as from the reference', async () => {
    const host = document.createElement('div');
    const after = document.createElement('button');
    document.body.append(host, after);
    mountPanel(
      {},
      {
        attachTo: host,
        floatingProps: { role: 'menu' },
        content: () => buttons(['Profile', 'Settings']),
      }
    );
    trigger().focus();
    await press('ArrowDown');
    await settle();

    const tab = await press('Tab');
    expect(tab.defaultPrevented).toBe(true);
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(after);

    trigger().focus();
    await press('ArrowDown');
    await settle();
    await press('Tab', { shiftKey: true });
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    after.remove();
    host.remove();
  });

  describe('submenu', () => {
    const after = document.createElement('button');

    const mountNested = (subProps: SbContainerProps = {}, closeOnSelect = false) => {
      const host = document.createElement('div');
      document.body.append(host, after);
      return mount(SbContainer, {
        attachTo: host,
        slots: {
          default: () => [
            h(SbReference, () => 'File'),
            h(SbFloating, { role: 'menu', closeOnSelect }, () => [
              h('button', { role: 'menuitem' }, 'New'),
              h(SbContainer, { placement: 'right-start', ...subProps }, () => [
                h(SbReference, { role: 'menuitem', class: 'sub' }, () => 'Open recent'),
                h(SbFloating, { role: 'menu', class: 'submenu', closeOnSelect }, () =>
                  buttons(['notes.md', 'todo.md'])
                ),
              ]),
            ]),
          ],
        },
      });
    };
    const sub = () => document.querySelector<HTMLElement>('.sub')!;
    const submenu = () => document.querySelector('.submenu');
    const subItems = () => [...submenu()!.querySelectorAll<HTMLElement>('[role="menuitem"]')];

    afterEach(() => after.remove());

    it('treats the submenu trigger as an item of the parent menu', async () => {
      mountNested();
      trigger().focus();
      await press('ArrowDown');
      await settle();

      await press('ArrowDown');
      expect(document.activeElement).toBe(sub());
      expect(submenu()).toBeNull();
      await press('ArrowDown');
      expect(document.activeElement?.textContent).toBe('New');
    });

    it('opens with the arrow pointing to it and closes with the opposite one', async () => {
      mountNested();
      trigger().focus();
      await press('ArrowDown');
      await settle();
      await press('ArrowDown');

      await press('ArrowRight');
      await settle();
      expect(document.activeElement).toBe(subItems()[0]);
      // Navigation stays inside the submenu
      await press('ArrowDown');
      expect(document.activeElement).toBe(subItems()[1]);

      await press('ArrowLeft');
      expect(submenu()).toBeNull();
      expect(menu()).not.toBeNull();
      expect(document.activeElement).toBe(sub());
    });

    it('does not open a hover submenu when the arrows move focus onto its trigger', async () => {
      mountNested({ trigger: 'hover' });
      trigger().focus();
      await press('ArrowDown');
      await settle();

      await press('ArrowDown');
      expect(document.activeElement).toBe(sub());
      expect(submenu()).toBeNull();
      await press('ArrowRight');
      await settle();
      expect(document.activeElement).toBe(subItems()[0]);
    });

    it('mirrors the arrows in right-to-left text', async () => {
      // happy-dom derives `direction` from CSS, not from the dir attribute
      document.documentElement.style.direction = 'rtl';
      mountNested();
      trigger().focus();
      await press('ArrowDown');
      await settle();
      await press('ArrowDown');

      await press('ArrowRight');
      await settle();
      expect(submenu()).toBeNull();
      await press('ArrowLeft');
      await settle();
      expect(document.activeElement).toBe(subItems()[0]);
      await press('ArrowRight');
      expect(submenu()).toBeNull();
      expect(document.activeElement).toBe(sub());
      document.documentElement.style.direction = '';
    });

    it('closes every menu and focuses the first trigger on a submenu item with closeOnSelect', async () => {
      mountNested({}, true);
      trigger().focus();
      await press('ArrowDown');
      await settle();
      await press('ArrowDown');
      // The submenu trigger opens its submenu, it is not a choice
      sub().click();
      await settle();
      expect(menu()).not.toBeNull();
      expect(submenu()).not.toBeNull();

      subItems()[1]!.click();
      await nextTick();
      expect(document.querySelector('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('closes every menu on Tab', async () => {
      mountNested();
      trigger().focus();
      await press('ArrowDown');
      await settle();
      await press('ArrowDown');
      await press('ArrowRight');
      await settle();

      await press('Tab');
      expect(document.querySelector('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(after);
    });
  });

  describe('closeOnSelect', () => {
    const openWith = async (role: string, content: () => VNodeChild, floatingProps = {}) => {
      const floating = { role, closeOnSelect: true, ...floatingProps };
      const wrapper = mountPanel({}, { floatingProps: floating, content });
      trigger().focus();
      await press('ArrowDown');
      await settle();
      return wrapper;
    };

    it('closes a menu on an activated item and gives focus back to the reference', async () => {
      await openWith('menu', () => buttons(['Profile', 'Sign out']));
      items()[1]!.click();
      await nextTick();
      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('keeps the menu open for checkbox, disabled and prevented items, and without the prop', async () => {
      const wrapper = await openWith('menu', () => [
        h('button', { role: 'menuitemcheckbox', 'aria-checked': 'false' }, 'Bold'),
        h('button', { role: 'menuitem', 'aria-disabled': 'true' }, 'Paste'),
        h('button', { role: 'menuitem', onClick: (e: MouseEvent) => e.preventDefault() }, 'Undo'),
      ]);
      for (const item of items()) {
        item.click();
        await nextTick();
      }
      expect(menu()).not.toBeNull();
      wrapper.unmount();

      mountMenu();
      trigger().focus();
      await press('ArrowDown');
      await settle();
      items()[0]!.click();
      await nextTick();
      expect(menu()).not.toBeNull();
    });

    it('closes a listbox on an option, unless it is multiselectable', async () => {
      const listbox = () => document.querySelector('[role="listbox"]');
      const wrapper = await openWith('listbox', () => buttons(['Small', 'Large'], 'option'));
      items()[0]!.click();
      await nextTick();
      expect(listbox()).toBeNull();
      expect(document.activeElement).toBe(trigger());
      wrapper.unmount();

      await openWith('listbox', () => buttons(['Small', 'Large'], 'option'), {
        'aria-multiselectable': 'true',
      });
      items()[0]!.click();
      await nextTick();
      expect(listbox()).not.toBeNull();
    });
  });

  it('leaves keys to other roles, to the user and to the manual trigger', async () => {
    const opened = async (
      props: Record<string, unknown>,
      floatingProps: Record<string, unknown>
    ) => {
      const wrapper = mountPanel(props, { floatingProps, content: () => buttons(['A', 'B']) });
      trigger().focus();
      const event = await press('ArrowDown');
      await settle();
      const isOpen = trigger().getAttribute('aria-expanded') === 'true';
      wrapper.unmount();
      return { prevented: event.defaultPrevented, isOpen };
    };
    const closed = { prevented: false, isOpen: false };
    expect(await opened({}, { role: 'dialog' })).toEqual(closed);
    expect(await opened({}, { role: 'menu', keyboardNavigation: false })).toEqual(closed);
    expect(await opened({ trigger: 'manual' }, { role: 'menu' })).toEqual(closed);

    // A keydown handled by the user on the panel
    mountMenu(undefined, { onKeydown: (event: KeyboardEvent) => event.preventDefault() });
    trigger().focus();
    await press('ArrowDown');
    await settle();
    expect(document.activeElement).toBe(items()[0]);
    await press('ArrowDown');
    expect(document.activeElement).toBe(items()[0]);
  });
});

describe('tooltip and hover', () => {
  const reference = () => document.querySelector<HTMLElement>('.ref')!;
  const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');
  const pointer = async (
    el: Element,
    type: 'pointerenter' | 'pointerleave',
    pointerType = 'mouse',
    relatedTarget: Element | null = null
  ) => {
    el.dispatchEvent(new PointerEvent(type, { pointerType, relatedTarget }));
    await nextTick();
  };
  const wait = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await nextTick();
  };
  const settle = async () => {
    await flushPromises();
    await nextTick();
  };

  const mountTooltip = (props: Record<string, unknown> = {}, referenceProps = {}) =>
    mountPanel(
      { trigger: 'hover', ...props },
      {
        referenceProps: { class: 'ref', ...referenceProps },
        floatingProps: { role: 'tooltip' },
        content: () => 'Tooltip text',
      }
    );

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('describes the reference while open instead of expanding it', async () => {
    const wrapper = mountTooltip({ trigger: 'manual', defaultOpen: true });
    await nextTick();
    expect(reference().hasAttribute('aria-expanded')).toBe(false);
    expect(reference().hasAttribute('aria-controls')).toBe(false);
    expect(reference().hasAttribute('aria-haspopup')).toBe(false);
    expect(reference().getAttribute('aria-describedby')).toBe(tooltip()!.id);

    await wrapper.setProps({ open: false });
    expect(reference().hasAttribute('aria-describedby')).toBe(false);
    wrapper.unmount();

    mountTooltip({ trigger: 'manual', defaultOpen: true }, { 'aria-describedby': 'own' });
    await nextTick();
    expect(reference().getAttribute('aria-describedby')).toBe('own');
  });

  it('leaves focus on the reference and renders no focus guards', async () => {
    const wrapper = mountTooltip({ trigger: 'manual' });
    reference().focus();
    (wrapper.vm as unknown as { open: () => void }).open();
    await settle();
    expect(tooltip()).not.toBeNull();
    expect(document.activeElement).toBe(reference());
    expect(guards()).toHaveLength(0);
  });

  it('opens and closes on hover after the delays', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    mountTooltip();
    await pointer(reference(), 'pointerenter');
    await wait(299);
    expect(tooltip()).toBeNull();
    await wait(1);
    expect(tooltip()).not.toBeNull();

    await pointer(reference(), 'pointerleave');
    await wait(149);
    expect(tooltip()).not.toBeNull();
    await wait(1);
    expect(tooltip()).toBeNull();
  });

  it('stays open while the pointer moves from the reference onto the panel', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    mountTooltip();
    await pointer(reference(), 'pointerenter');
    await wait(300);
    const wrapper = tooltip()!.parentElement!;

    await pointer(reference(), 'pointerleave');
    await wait(100);
    await pointer(wrapper, 'pointerenter');
    await wait(500);
    expect(tooltip()).not.toBeNull();

    await pointer(wrapper, 'pointerleave');
    await wait(150);
    expect(tooltip()).toBeNull();
  });

  describe('nested panel', () => {
    // A hover card with a tooltip inside: the tooltip is teleported out of the card
    const mountCard = () =>
      mount(SbContainer, {
        props: { trigger: 'hover' },
        attachTo: document.body,
        slots: {
          default: () => [
            h(SbReference, { class: 'ref' }, () => 'Profile'),
            h(SbFloating, { class: 'card' }, () =>
              h(SbContainer, { trigger: 'hover' }, () => [
                h(SbReference, { class: 'info' }, () => 'Info'),
                h(SbFloating, { role: 'tooltip' }, () => 'Details'),
              ])
            ),
          ],
        },
      });
    const card = () => document.querySelector('.card');
    const info = () => document.querySelector('.info')!;

    // Card and tooltip open, the pointer on the reference of the tooltip
    const openBoth = async () => {
      mountCard();
      await pointer(reference(), 'pointerenter');
      await wait(300);
      await pointer(info(), 'pointerenter');
      await wait(300);
      expect(tooltip()).not.toBeNull();
      return { cardWrapper: card()!.parentElement!, tooltipWrapper: tooltip()!.parentElement! };
    };

    it('keeps the parent open while the pointer is on the nested panel', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { cardWrapper, tooltipWrapper } = await openBoth();

      await pointer(info(), 'pointerleave', 'mouse', tooltipWrapper);
      await pointer(cardWrapper, 'pointerleave', 'mouse', tooltipWrapper);
      await pointer(tooltipWrapper, 'pointerenter', 'mouse', info());
      await wait(500);
      expect(card()).not.toBeNull();
      expect(tooltip()).not.toBeNull();

      // Leaving the nested panel for the page leaves both
      await pointer(tooltipWrapper, 'pointerleave', 'mouse', document.body);
      await wait(150);
      expect(tooltip()).toBeNull();
      expect(card()).toBeNull();
    });

    it('keeps the parent open when the pointer crosses a gap onto the nested panel', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { cardWrapper, tooltipWrapper } = await openBoth();

      await pointer(info(), 'pointerleave', 'mouse', document.body);
      await pointer(cardWrapper, 'pointerleave', 'mouse', document.body);
      await wait(100);
      await pointer(tooltipWrapper, 'pointerenter', 'mouse', document.body);
      await wait(500);
      expect(card()).not.toBeNull();
      expect(tooltip()).not.toBeNull();

      // Back onto the parent panel: only the nested one closes
      await pointer(tooltipWrapper, 'pointerleave', 'mouse', cardWrapper);
      await pointer(cardWrapper, 'pointerenter', 'mouse', tooltipWrapper);
      await wait(500);
      expect(tooltip()).toBeNull();
      expect(card()).not.toBeNull();
    });
  });

  it('takes a single delay for both and ignores touch', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    mountTooltip({ delay: 0 });
    await pointer(reference(), 'pointerenter', 'touch');
    await wait(1000);
    expect(tooltip()).toBeNull();

    await pointer(reference(), 'pointerenter');
    await wait(0);
    expect(tooltip()).not.toBeNull();
    await pointer(reference(), 'pointerleave');
    await wait(0);
    expect(tooltip()).toBeNull();
  });

  it('keeps the default for a delay missing from the object', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    mountTooltip({ delay: { open: 0 } });
    await pointer(reference(), 'pointerenter');
    await wait(0);
    expect(tooltip()).not.toBeNull();

    await pointer(reference(), 'pointerleave');
    await wait(149);
    expect(tooltip()).not.toBeNull();
    await wait(1);
    expect(tooltip()).toBeNull();
  });

  it('opens on focus at once and closes when focus moves elsewhere', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    for (const trigger of ['hover', 'focus']) {
      const wrapper = mountTooltip({ trigger });
      reference().focus();
      await nextTick();
      expect(tooltip()).not.toBeNull();
      outside.focus();
      await nextTick();
      expect(tooltip()).toBeNull();
      wrapper.unmount();
    }
    outside.remove();
  });

  it('opens a hover panel on keyboard focus only, a focus panel on any focus', async () => {
    // Focus from a click: happy-dom matches :focus-visible on any focused element
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
      return selector === ':focus-visible' ? false : matches.call(this, selector);
    });
    const hover = mountTooltip();
    reference().focus();
    await nextTick();
    expect(tooltip()).toBeNull();
    hover.unmount();

    mountTooltip({ trigger: 'focus' });
    reference().focus();
    await nextTick();
    expect(tooltip()).not.toBeNull();
  });

  it('does not move focus into a panel opened by focus, nor reopen it on Escape', async () => {
    mountPanel({ trigger: 'focus' }, { referenceProps: { class: 'ref' } });
    reference().focus();
    await settle();
    expect(panel()).not.toBeNull();
    expect(document.activeElement).toBe(reference());
    await keydown(document, 'Escape');
    expect(panel()).toBeNull();
    document.body.focus();

    // With autoFocus, Escape gives focus back to the reference, which does not reopen it
    const wrapper = mountPanel(
      { trigger: 'focus' },
      { referenceProps: { class: 'ref' }, floatingProps: { autoFocus: true } }
    );
    wrapper.findComponent(SbReference).element.focus();
    await settle();
    expect(document.activeElement).toBe(document.querySelectorAll('.inside')[0]);
    await keydown(document, 'Escape');
    await nextTick();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(wrapper.findComponent(SbReference).element);
  });

  it('opens a hover menu on its first item with ArrowDown', async () => {
    mountPanel(
      { trigger: 'hover' },
      {
        referenceProps: { class: 'ref' },
        floatingProps: { role: 'menu' },
        content: () => h('button', { role: 'menuitem' }, 'Profile'),
      }
    );
    reference().focus();
    await settle();
    expect(document.activeElement).toBe(reference());
    await keydown(reference(), 'ArrowDown');
    expect(document.activeElement?.textContent).toBe('Profile');
  });
});

describe('misuse and edge cases', () => {
  const warnings = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => vi.restoreAllMocks());

  it('warns about a second SbReference or SbFloating in one container', () => {
    const spy = warnings();
    mount(SbContainer, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(SbReference, () => 'One'),
          h(SbReference, () => 'Two'),
          h(SbFloating, () => 'Panel'),
          h(SbFloating, () => 'Panel'),
        ],
      },
    });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0]![0]).toContain('more than one <SbReference>');
    expect(spy.mock.calls[1]![0]).toContain('more than one <SbFloating>');
  });

  it('warns when a component reference renders no element', () => {
    const spy = warnings();
    const Fragment = defineComponent({ setup: () => () => [h('span'), h('span')] });
    mountPanel({}, { referenceProps: { as: Fragment } });
    // Vue also warns about the attributes it cannot place on a fragment
    const ours = spy.mock.calls.filter(([message]) => String(message).startsWith('[sb-floating'));
    expect(ours).toHaveLength(1);
    expect(ours[0]![0]).toContain('single root element');
  });

  it('warns about a text field reference of a menu or listbox panel', () => {
    const spy = warnings();
    mountField({ role: 'listbox' }).unmount();
    mountField();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toContain('combobox');
  });

  it('warns about a tooltip opened by click', () => {
    const spy = warnings();
    mountPanel({}, { floatingProps: { role: 'tooltip' } }).unmount();
    mountPanel({ trigger: 'hover' }, { floatingProps: { role: 'tooltip' } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toContain('<SbFloating role="tooltip"> opens on click');
  });

  it('warns once when the arrow keys find no items, or items that cannot take focus', async () => {
    const spy = warnings();
    const arrowDown = async (role: string, content: () => VNodeChild) => {
      const wrapper = mountPanel({}, { floatingProps: { role }, content });
      trigger().focus();
      await keydown(trigger(), 'ArrowDown');
      await flushPromises();
      await nextTick();
      await keydown(document.activeElement!, 'ArrowDown');
      await keydown(document.activeElement!, 'End');
      wrapper.unmount();
    };

    await arrowDown('listbox', () => h('p', 'Loading…'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toContain('<SbFloating role="listbox"> has no items');

    await arrowDown('menu', () => [
      h('div', { role: 'menuitem' }, 'Copy'),
      h('div', { role: 'menuitem' }, 'Paste'),
    ]);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1]![0]).toContain('cannot take focus');

    await arrowDown('menu', () => [
      h('button', { role: 'menuitem' }, 'Copy'),
      h('div', { role: 'menuitem', tabindex: -1 }, 'Paste'),
    ]);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not warn about an empty listbox opened without the arrow keys', async () => {
    const spy = warnings();
    mountPanel({}, { floatingProps: { role: 'listbox' }, content: () => h('p', 'Loading…') });
    await openAndSettle();
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not warn in production', async () => {
    const spy = warnings();
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { warn } = await import('../src/utils/warn');
    warn('message');
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('closes when the reference unmounts, not when the whole container does', async () => {
    const onToggle = vi.fn();
    const Host = defineComponent({
      props: { showReference: Boolean },
      setup: (props) => () =>
        h(SbContainer, { defaultOpen: true, 'onUpdate:open': onToggle }, () => [
          props.showReference ? h(SbReference, () => 'Trigger') : null,
          h(SbFloating),
        ]),
    });
    const wrapper = mount(Host, { props: { showReference: true }, attachTo: document.body });
    await nextTick();
    expect(panel()).not.toBeNull();

    await wrapper.setProps({ showReference: false });
    expect(onToggle).toHaveBeenCalledWith(false);
    expect(panel()).toBeNull();

    onToggle.mockClear();
    const other = mount(Host, { props: { showReference: true }, attachTo: document.body });
    await nextTick();
    other.unmount();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('moves focus out of an open panel that unmounts instead of leaving it on the body', async () => {
    const Host = defineComponent({
      props: { show: { type: String, default: 'all' } },
      setup: (props) => () =>
        props.show === 'none'
          ? null
          : h(SbContainer, { defaultOpen: true }, () => [
              props.show !== 'floating' ? h(SbReference, () => 'Trigger') : null,
              props.show !== 'reference' ? h(SbFloating, () => h('button', 'Inside')) : null,
            ]),
    });
    const host = document.createElement('div');
    const after = document.createElement('button');
    document.body.append(host, after);
    const focusInside = async (wrapper: ReturnType<typeof mount>) => {
      await wrapper.setProps({ show: 'all' });
      // Closed when the reference went away
      if (!panel()) await click(trigger());
      await flushPromises();
      panel()!.querySelector('button')!.focus();
    };
    const wrapper = mount(Host, { attachTo: host });

    // The panel alone: focus goes back to the reference
    await focusInside(wrapper);
    await wrapper.setProps({ show: 'reference' });
    expect(document.activeElement).toBe(trigger());

    // The reference alone: the panel closes, focus goes to what follows the reference
    await focusInside(wrapper);
    await wrapper.setProps({ show: 'floating' });
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(after);

    // The whole container: focus goes to what followed the reference
    await focusInside(wrapper);
    await wrapper.setProps({ show: 'none' });
    expect(document.activeElement).toBe(after);
    after.remove();
    host.remove();
  });

  it('closes when the reference is detached with hideWhenDetached close', async () => {
    // happy-dom has no layout: every rect is empty, so the reference counts as scrolled away
    mountPanel({ hideWhenDetached: true, defaultOpen: true });
    await flushPromises();
    expect(panel()!.parentElement!.style.visibility).toBe('hidden');

    mountPanel(
      { hideWhenDetached: 'close', defaultOpen: true },
      { floatingProps: { class: 'closing' } }
    );
    await flushPromises();
    await nextTick();
    expect(document.querySelector('.closing')).toBeNull();
  });

  it('closes on Escape the open panel that has focus', async () => {
    const first = mountPanel(
      { defaultOpen: true, closeOnClickOutside: false, closeOnFocusOut: false },
      { floatingProps: { class: 'first' } }
    );
    const second = mountPanel(
      { defaultOpen: true, closeOnClickOutside: false, closeOnFocusOut: false },
      { floatingProps: { class: 'second' } }
    );
    await nextTick();
    document.querySelector<HTMLElement>('.first .inside')!.focus();

    await keydown(document.activeElement!, 'Escape');
    expect(document.querySelector('.first')).toBeNull();
    expect(document.querySelector('.second')).not.toBeNull();
    first.unmount();
    second.unmount();
  });
});

describe('API', () => {
  it('gives components inside the container its open state and actions with useSbFloating', async () => {
    const MenuItem = defineComponent({
      setup() {
        const { isOpen, close } = useSbFloating();
        return () => h('button', { class: 'item', onClick: close }, `open: ${isOpen.value}`);
      },
    });
    mountPanel({}, { content: () => h('div', [h(MenuItem)]) });
    await openAndSettle();
    const item = document.querySelector<HTMLElement>('.item')!;
    expect(item.textContent).toBe('open: true');
    item.click();
    await nextTick();
    expect(panel()).toBeNull();
  });

  it('throws when useSbFloating is called outside SbContainer', () => {
    const Lonely = defineComponent({ setup: () => (useSbFloating(), () => null) });
    expect(() => mount(Lonely)).toThrow('useSbFloating() must be called');
  });

  it('passes the ids of the panel and the reference to the slot', async () => {
    mountPanel(
      { defaultOpen: true },
      {
        referenceProps: { id: 'account' },
        content: (slot) => h('p', { class: 'ids' }, `${slot.floatingId} ${slot.referenceId}`),
      }
    );
    await nextTick();
    expect(document.querySelector('.ids')!.textContent).toBe(`${panel()!.id} account`);
  });

  it('exposes the open state', async () => {
    const wrapper = mountPanel();
    const exposed = wrapper.vm as unknown as SbContainerExposed;
    expect(exposed.isOpen).toBe(false);
    exposed.open();
    await nextTick();
    expect(exposed.isOpen).toBe(true);
  });

  it('renders a component as the panel', async () => {
    const Card = defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h('section', { class: 'card' }, slots.default?.()),
    });
    mountPanel({}, { floatingProps: { as: Card } });
    trigger().focus();
    await openAndSettle();
    expect(panel()!.tagName).toBe('SECTION');
    expect(panel()!.classList.contains('card')).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('.card .inside'));
  });

  it('teleports to the given target, or renders in place with false', async () => {
    const target = document.createElement('div');
    target.id = 'overlays';
    document.body.append(target);
    const wrapper = mountPanel({ defaultOpen: true }, { floatingProps: { teleport: '#overlays' } });
    await nextTick();
    expect(target.contains(panel())).toBe(true);
    wrapper.unmount();

    const host = document.createElement('div');
    document.body.append(host);
    mountPanel({ defaultOpen: true }, { attachTo: host, floatingProps: { teleport: false } });
    await nextTick();
    expect(host.contains(panel())).toBe(true);
    target.remove();
    host.remove();
  });
});
