import { config, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, type VNodeChild } from 'vue';
import { SbContainer, SbFloating, SbReference } from '../src';
import type { SbContainerProps, SbContainerSlotProps } from '../src';

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
    await vi.waitFor(() => expect(panel()).toBeNull());
    expect(document.body.querySelectorAll('body > div:not([data-v-app])')).toHaveLength(0);
    expect(wrapper.findComponent(SbFloating).emitted('after-leave')).toHaveLength(1);
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

  it('renders no focus guards when not teleported', async () => {
    mountPanel({ defaultOpen: true }, { floatingProps: { teleportDisabled: true } });
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
