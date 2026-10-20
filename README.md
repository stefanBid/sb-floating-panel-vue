# sb-floating-panel-vue

[![npm](https://img.shields.io/npm/v/sb-floating-panel-vue.svg)](https://www.npmjs.com/package/sb-floating-panel-vue) [![license](https://img.shields.io/npm/l/sb-floating-panel-vue.svg)](https://github.com/stefanBid/sb-floating-panel-vue/blob/main/LICENSE) [![Vue 3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org) [![CI](https://github.com/stefanBid/sb-floating-panel-vue/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/stefanBid/sb-floating-panel-vue/actions/workflows/ci.yml) [![coverage](https://raw.githubusercontent.com/stefanBid/sb-floating-panel-vue/badges/coverage.svg)](https://github.com/stefanBid/sb-floating-panel-vue/actions/workflows/ci.yml) [![branches](https://raw.githubusercontent.com/stefanBid/sb-floating-panel-vue/badges/coverage-branches.svg)](https://github.com/stefanBid/sb-floating-panel-vue/actions/workflows/ci.yml)

Headless Vue 3 components for floating panels (dropdowns, menus, listboxes, popovers, tooltips) built on [`@floating-ui/vue`](https://floating-ui.com/). You write three components; the library handles placement, flipping, viewport collisions, open state, keyboard and accessibility. It never decides how your panel looks: no stylesheet, only data attributes and CSS variables your styles can read.

## 🔥 Features

- 🧩 Three components (`SbContainer`, `SbReference`, `SbFloating`) for dropdowns, menus, listboxes, popovers, tooltips and disclosure panels
- ⚡ Built on top of [`@floating-ui/vue`](https://floating-ui.com/): `offset`, `flip`, `shift`, `size` and `hide` already configured
- 🎨 Zero CSS shipped: the library adapts to your design system (plain CSS, Tailwind, CSS modules)
- ♿ Accessible by default: ARIA attributes and naming, the WAI-ARIA keyboard model of menus and listboxes, tooltips that meet WCAG 1.4.13, Tab order kept across the teleport, Escape, click outside, focus management
- 🔁 Fully reactive props, `v-model:open`, nested panels and submenus

---

## 📦 Installation

```bash
npm install sb-floating-panel-vue vue @floating-ui/vue
```

`vue` (`^3.5.13`) and `@floating-ui/vue` (`^2.0.1`) are peer dependencies: your app provides them, so only one copy of each ends up in the bundle. Vue is usually already installed in your app.

There is no CSS file to import.

---

## 🧱 Usage

A popover: the panel opens on click, takes focus and gives it back to the trigger when it closes.

```vue
<script setup lang="ts">
import { SbContainer, SbReference, SbFloating } from 'sb-floating-panel-vue';
</script>

<template>
  <SbContainer placement="bottom-start">
    <template #default="{ close }">
      <SbReference class="my-trigger">Share</SbReference>
      <SbFloating transition="pop" class="my-panel">
        <label for="link">Link</label>
        <input id="link" value="https://example.com" readonly />
        <button type="button" @click="close()">Done</button>
      </SbFloating>
    </template>
  </SbContainer>
</template>
```

`SbContainer` shares its state with `SbReference` and `SbFloating` through `provide`/`inject`: no refs or styles to pass by hand. Both must be used inside an `SbContainer`, one of each per container.

### Menu

With `role="menu"` the library handles the keyboard: ArrowDown on the trigger opens the menu on its first item, the arrow keys, Home, End and typing move between items, Tab leaves (see [Keyboard](#keyboard)). Activating an item runs its `click` handler; with `close-on-select` the menu then closes and focus goes back to the trigger.

```vue
<SbContainer match-width="min">
  <SbReference class="my-trigger">Account</SbReference>
  <SbFloating role="menu" close-on-select class="my-panel">
    <button v-for="item in ['Profile', 'Settings', 'Sign out']" :key="item" type="button" role="menuitem" @click="go(item)">
      {{ item }}
    </button>
  </SbFloating>
</SbContainer>
```

A submenu is a menu `SbContainer` inside the menu panel, with `role="menuitem"` on its `SbReference`.

### Tooltip

```vue
<SbContainer placement="top" trigger="hover" :offset="6">
  <SbReference class="my-trigger">Save</SbReference>
  <SbFloating role="tooltip" class="my-tooltip">Saves a copy to your drive</SbFloating>
</SbContainer>
```

The tooltip opens on hover after `delay.open` and at once on keyboard focus, describes the trigger with `aria-describedby`, never takes focus, and stays open while the pointer moves onto it.

---

## 📚 API

### `<SbContainer>`

Holds the state and the positioning. Renders no element of its own, only its slot.

**Positioning**

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `placement` | `SbPlacement` | `'bottom-start'` | Preferred placement; the panel flips when there is not enough space |
| `strategy` | `'absolute' \| 'fixed'` | `'absolute'` | CSS position strategy. Use `fixed` inside scroll containers or fixed layouts |
| `offset` | `number` | `8` | Distance in px between reference and panel |
| `padding` | `number` | `8` | Minimum distance in px between the panel and the viewport edges |
| `matchWidth` | `boolean \| 'min'` | `false` | `true` sets `width`, `'min'` sets `min-width` to the reference width |
| `hideWhenDetached` | `boolean \| 'close'` | `false` | When the reference is scrolled out of view: `true` hides the panel (`visibility: hidden`) until it is back, `'close'` closes it |

**Open state**

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | — | Open state. Leave it unset to let the container manage it |
| `defaultOpen` | `boolean` | `false` | Initial open state when `v-model:open` is not used |
| `disabled` | `boolean` | `false` | Prevents opening; closes the panel if it is open |
| `trigger` | `SbTrigger` | `'click'` | How the reference opens the panel, see below |
| `delay` | `number \| { open?: number; close?: number }` | `{ open: 300, close: 150 }` | Milliseconds before the `hover` trigger opens and closes; a number sets both |

| `trigger` | Opens | Closes |
| --- | --- | --- |
| `'click'` | Click (Enter/Space) on the reference toggles the panel | Same, or any dismissal below |
| `'hover'` | Pointer over the reference after `delay.open`; keyboard focus at once (touch has no hover) | `delay.close` after the pointer leaves the reference and the panel, or when focus moves elsewhere |
| `'focus'` | Focus on the reference | Focus moving elsewhere |
| `'manual'` | Only `v-model:open`, the slot props or the exposed methods | Same, or any dismissal below |

**Dismissal**

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `closeOnEscape` | `boolean` | `true` | Closes on Escape |
| `closeOnClickOutside` | `boolean` | `true` | Closes on a pointer press outside the reference and the panel (on touch, on the tap's click) |
| `closeOnFocusOut` | `boolean` | `true` | Closes when keyboard focus moves outside the reference and the panel |

| Event         | Payload         | Description                   |
| ------------- | --------------- | ----------------------------- |
| `update:open` | `boolean`       | Used by `v-model:open`        |
| `open`        | `SbOpenReason`  | The panel has opened, and why |
| `close`       | `SbCloseReason` | The panel has closed, and why |

The reason tells what opened or closed the panel, e.g. for analytics or to react only to a dismissal:

| Reason | `open` | `close` |
| --- | --- | --- |
| `trigger` | Click on the reference, Enter, Space or an arrow key on it | Click on the reference, Enter or Space on it |
| `hover` | Pointer over the reference (`hover` trigger) | Pointer left the reference and the panel (`hover` trigger) |
| `focus` | Focus on the reference (`hover` and `focus` triggers) | — |
| `focus-out` | — | Focus moved outside, e.g. Tab out of a menu |
| `escape` | — | Escape, or the arrow key that closes a submenu |
| `outside` | — | Press outside the reference and the panel |
| `select` | — | Item activated with `closeOnSelect` |
| `detached` | — | Reference scrolled out of view, with `hideWhenDetached: 'close'` |
| `disabled` | — | The container was disabled |
| `api` | `v-model:open`, slot props, exposed methods, `useSbFloating()` | Same, or the reference unmounting |

```vue
<SbContainer @close="(reason) => reason === 'select' && track('menu-pick')">
```

**Slot props**: `isOpen`, `open()`, `close()`, `toggle()`, `placement` (resolved after flip), `side`, `align`, `floatingId` and `referenceId` (the `id` of the panel and of the reference, for ARIA attributes of your own).

**Exposed** (template ref): `isOpen`, `open()`, `close()`, `toggle()`, `update()` (recomputes the position).

### `<SbReference>`

The trigger the panel is anchored to.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `'button'` | Tag or component to render. `button` gets `type="button"`; form controls (`input`, `textarea`, `select`), `a` with `href` and components keep their own semantics; any other tag (also `a` without `href`) gets `role="button"`, `tabindex="0"` and Enter/Space. A text field opens the panel on click without closing it, and keeps focus (see [Text field references](#text-field-references)) |
| `id` | `string` | generated | `id` of the element, used to name the panel |
| `ariaHaspopup` | `'dialog' \| 'menu' \| 'listbox' \| 'tree' \| 'grid' \| 'true' \| 'false'` | follows `role` | Value of `aria-haspopup`. When unset it follows the `role` of the panel (`alertdialog` gives `dialog`) and is left out for other roles |

Sets `aria-expanded`, `aria-controls` (while open) and `data-sbf-state`; a tooltip reference gets `aria-describedby` instead (see [Tooltip](#tooltip-1)). When the container is `disabled`, a `button` gets `disabled`, anything else gets `aria-disabled="true"` (and non-interactive tags `tabindex="-1"`). Your own `class`, attributes and listeners (`@click`, `@mouseenter`, …) are applied to the element; the click is not stopped.

With a component (e.g. the `Button` of your design system), its root element becomes the reference, so the component must render a single root element that accepts the attributes and listeners above. While the panel is open, Tab on the reference moves focus into the panel. If the reference unmounts while the panel is open, the panel closes.

### `<SbFloating>`

The panel, teleported to `body`. It is rendered while open and stays mounted until its leave transition has finished.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `'div'` | Tag or component of the panel element; a component must render a single root element |
| `role` | `SbFloatingRole \| null` | `'dialog'` | ARIA role of the panel; `null` renders no role (disclosure pattern). Known roles are suggested by your editor, any string is accepted |
| `transition` | `string \| TransitionProps` | — | Name of a Vue `<Transition>` defined in your CSS, or an object of `<Transition>` props (e.g. Tailwind classes). No animation when unset |
| `teleport` | `string \| HTMLElement \| false` | `'body'` | Teleport target (selector or element); `false` renders the panel in place |
| `zIndex` | `number \| string` | — | `z-index` of the positioned wrapper. Use this, not a `z-*` class on the panel (see [Stacking](#stacking)) |
| `autoFocus` | `boolean` | `true`, `false` with `role="tooltip"`, the `hover` / `focus` trigger or a text field reference | Once positioned, focuses the first `[autofocus]` or focusable element inside, else the panel itself (a menu: its first item; a listbox: its selected option) |
| `keyboardNavigation` | `boolean` | `true` | Handles the keyboard model of `role="menu"` and `role="listbox"` panels (see [Keyboard](#keyboard)). No effect with other roles |
| `closeOnSelect` | `boolean` | `false` | With `role="menu"` / `"listbox"`, activating a `menuitem` / `option` closes the panel (a submenu: with its parent menus) and gives focus back to the reference, after the item's `click` handler. Not for `menuitemcheckbox` / `menuitemradio`, submenu triggers, disabled items or a listbox with `aria-multiselectable="true"`; `event.preventDefault()` in the handler keeps it open |

| Event         | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `after-enter` | The enter transition has finished                          |
| `after-leave` | The leave transition has finished and the panel is removed |

With a popup role (`dialog`, `alertdialog`, `menu`, `listbox`, `tree`, `grid`), the panel is named after the reference with `aria-labelledby`, unless you pass `aria-label` or `aria-labelledby` yourself. When focus is inside the panel as it closes, it goes back to the reference.

### `useSbFloating()`

The open state and actions of the closest `SbContainer`, for your own components inside it: a `MenuItem` of your design system can close the menu without `close` passed down from the slot.

```ts
import { useSbFloating } from 'sb-floating-panel-vue';

const { isOpen, open, close, toggle } = useSbFloating();
```

| Returns  | Type                     | Description               |
| -------- | ------------------------ | ------------------------- |
| `isOpen` | `Readonly<Ref<boolean>>` | Whether the panel is open |
| `open`   | `() => void`             | Opens the panel           |
| `close`  | `() => void`             | Closes the panel          |
| `toggle` | `() => void`             | Toggles the panel         |

Call it in `setup` of a component rendered inside an `SbContainer` (in the reference, the panel or anywhere in its slot); outside one it throws.

### Types

Every prop, slot prop, event and option type is exported (`SbContainerProps`, `SbPlacement`, `SbFloatingRole`, …): import them with `import type { … } from 'sb-floating-panel-vue'`.

---

## ♿ Accessibility

- `SbReference` gets an `id`, `aria-expanded`, `aria-controls` (pointing to the panel `id`) and `aria-haspopup` (following the panel `role`); non-interactive tags get `role="button"`, `tabindex="0"` and Enter/Space.
- `SbFloating` gets an `id` generated with Vue `useId()` (SSR safe), a `role` (`dialog` by default) and, with a popup role (`dialog`, `alertdialog`, `menu`, `listbox`, `tree`, `grid`), `aria-labelledby` pointing to the reference.
- **Tab order.** The panel is teleported to the end of `body`, so the library keeps the order a reader expects: Tab on the open reference enters the panel, Shift+Tab from its first element returns to the reference, Tab from its last element moves on to what follows the reference, and Shift+Tab from there enters the panel again from its last element while it is still open (with `closeOnFocusOut: false`). Two hidden focus guards (`data-sbf-focus-guard`) around the panel do this; they are not rendered with `:teleport="false"` nor around a tooltip.
- **Focus.** By default (`autoFocus`) focus moves inside the panel once it is positioned. When the panel closes with focus inside it, focus returns to the reference without scrolling the page. When it unmounts open with focus inside, focus is not left on the body: it goes back to the reference when only `SbFloating` is removed, and to what follows the reference in the page when the reference is removed too.
- <a id="keyboard"></a>**Keyboard.** With `role="menu"` or `role="listbox"` the components follow the WAI-ARIA [menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) and [listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) patterns. Items are the elements with role `menuitem`, `menuitemcheckbox`, `menuitemradio` (menu) or `option` (listbox); they must be focusable (a `button`, or `tabindex="-1"`). Turn it off with `:keyboard-navigation="false"`.

  | Key | On the reference | In the panel |
  | --- | --- | --- |
  | ArrowDown / ArrowUp | Opens on the first / last item (or the selected option), except with the `manual` trigger | Next / previous item; a menu wraps around, a listbox stops at its ends |
  | Home / End | — | First / last item |
  | Letters | — | Next item whose text starts with the typed letters |
  | Enter / Space | Toggles | Clicks items that are not buttons or links |
  | Tab / Shift+Tab | — | Menu: closes it (and the menus it opened from) and moves focus on, as from the reference |
  | ArrowRight / ArrowLeft | A submenu trigger: ArrowRight opens the submenu on its first item | A submenu: ArrowLeft closes it and focuses its trigger |

  A submenu is a menu `SbContainer` inside a menu panel; its arrows are mirrored in right-to-left text. Keys whose `keydown` you already handled with `event.preventDefault()`, and keys typed in text fields, are left alone.

- <a id="tooltip-1"></a>**Tooltip.** With `role="tooltip"` the panel follows the WAI-ARIA [tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) pattern: the reference gets no `aria-expanded` nor `aria-controls`, and while open `aria-describedby` points to the panel (pass your own `aria-describedby` on `SbReference` to replace it). Focus stays on the reference and no focus guards are rendered. Use it with `trigger="hover"`, which meets WCAG [1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus): it opens on keyboard focus too, the pointer can move onto the tooltip within `delay.close`, and Escape dismisses it.
- **Dismissal.**
  - Escape closes the open panel that has focus, else the most recently opened one. It is ignored when a widget inside has already handled it (`event.preventDefault()`) and while an IME composition is in progress.
  - A press outside closes the panel; on touch, only a tap does, so starting a scroll keeps it open.
  - Moving focus outside (e.g. tabbing past the last element) closes it.
  - A container nested inside a panel counts as part of it.
- **What is up to you.** The library does not implement the keyboard model of `tree` and `grid` panels, nor selection: a listbox option or a menu item does what its `click` handler does (e.g. set `aria-selected`); add `closeOnSelect` to close the panel after it. Use valid structure: items directly inside the `menu` / `listbox`, or inside `ul` / `li` with `role="none"`.
- <a id="text-field-references"></a>**Text field references.** `<SbReference as="input">` (or `textarea`) stays a text field: no `role="button"`, Enter and Space type as usual, a click opens the panel without closing it, and focus stays in the field when the panel opens. The [combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (autocomplete with focus kept in the field and `aria-activedescendant`) is not supported: with a `menu` or `listbox` panel the arrow keys move focus into the panel, and the console warns about it in development.

---

## 🎨 Styling

The library writes values on the elements; your CSS reads them. `SbFloating` renders two elements:

```html
<!-- wrapper: positioning only (Floating UI styles, z-index, CSS variables) -->
<div style="position: absolute; transform: translate(120px, 40px); --sbf-reference-width: 180px; …">
  <!-- panel: your class, style and attributes -->
  <div
    class="my-panel"
    role="dialog"
    data-sbf-state="open"
    data-sbf-side="bottom"
    data-sbf-align="start"
  >
    …
  </div>
</div>
```

Your styles, transitions and transforms go on the panel, so they never fight with the positioning `transform` of the wrapper.

### Data attributes

| Attribute | Values | On | Use |
| --- | --- | --- | --- |
| `data-sbf-state` | `open` / `closed` | reference | Open/closed styles (e.g. rotate an icon) |
| `data-sbf-state` | `open` / `closed` | panel | `closed` from the start of the leave transition: style or animate the exit |
| `data-sbf-side` | `top` / `bottom` / `left` / `right` | panel | Real side after flip: directional animation |
| `data-sbf-align` | `start` / `end` / absent | panel | Alignment part of the placement |

### CSS variables

Set on the wrapper and inherited by the panel:

| Variable | Meaning |
| --- | --- |
| `--sbf-reference-width` | Width of the reference |
| `--sbf-available-width` | Horizontal space left before overflowing the viewport |
| `--sbf-available-height` | Vertical space left before overflowing the viewport |
| `--sbf-transform-origin` | Corner or edge of the panel facing the reference, for `transform-origin` |

All attributes and variables use the `sbf` prefix, so they do not clash with other libraries in the same app (e.g. Radix / Reka UI `data-state`).

### Stacking

The wrapper is positioned with a CSS `transform`, which creates a stacking context: a `z-index` on the panel (e.g. a `z-50` class) only orders it inside the wrapper and has no effect on the rest of the page. Set the `zIndex` prop of `SbFloating` instead, which goes on the wrapper.

### Plain CSS

Panels are teleported to `body`, so their styles cannot be `scoped` to the component that renders them: use global styles, CSS modules or utility classes.

```css
.my-panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: var(--sbf-available-height);
  overflow-y: auto;
}

.my-trigger[data-sbf-state='open'] .chevron {
  transform: rotate(180deg);
}

/* <SbFloating transition="pop"> */
.pop-enter-active,
.pop-leave-active {
  transform-origin: var(--sbf-transform-origin);
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* direction from the side resolved after flip */
.pop-enter-from[data-sbf-side='bottom'] {
  transform: translateY(-6px);
}
.pop-enter-from[data-sbf-side='top'] {
  transform: translateY(6px);
}

/* respect the user's motion setting */
@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active {
    transition: opacity 150ms ease;
  }
  .pop-enter-from,
  .pop-leave-to {
    transform: none;
  }
}
```

### Tailwind (v4)

```vue
<SbReference class="group rounded border px-3 py-2">
  Options
  <span class="inline-block transition-transform group-data-[sbf-state=open]:rotate-180">▾</span>
</SbReference>
<SbFloating
  :z-index="50"
  :transition="{
    enterActiveClass: 'transition duration-150 ease-out motion-reduce:transition-none',
    enterFromClass: 'opacity-0 scale-95',
    leaveActiveClass: 'transition duration-100 ease-in motion-reduce:transition-none',
    leaveToClass: 'opacity-0 scale-95',
  }"
  class="max-h-(--sbf-available-height) w-(--sbf-reference-width) origin-(--sbf-transform-origin) overflow-y-auto rounded border bg-white shadow-lg"
>
  …
</SbFloating>
```

---

## 🧭 How It Works

`SbContainer` owns the state (open state, positioning, ARIA ids) and shares it with `SbReference` and `SbFloating` through `provide`/`inject`. The lookup follows the component tree, not the DOM, so it keeps working although `SbFloating` is teleported to `body`; used outside an `SbContainer`, they throw.

### Nested containers

An `SbContainer` placed inside another one (e.g. a submenu in a menu panel) registers with its parent:

- a press inside the nested panel is not "outside" for the parent, so both stay open;
- Escape closes the innermost open panel first, then the next one;
- a press outside all of them closes them all.

### Development warnings

In development, the console warns about a second `SbReference` or `SbFloating` in the same container, about an `as` component that renders no single root element, about a text field reference of a `menu` or `listbox` panel, about a `tooltip` opened by click, and, the first time the arrow keys look for them, about a `menu` or `listbox` with no items or with items that cannot take focus. The warnings depend on `process.env.NODE_ENV`, which your bundler replaces: they are left out of production builds.

### Directives on `SbFloating`

`<SbFloating>` renders a `<teleport>` root, so a custom directive applied to the component is not inherited and Vue warns about it: put the directive on an element inside the slot.

---

## 🔀 Migrating

Breaking changes between major versions and how to update: [MIGRATING.md](MIGRATING.md).

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to run the playground, the tests and the build.

---

## 👤 Author

Created with ❤️ by [Stefano Biddau](https://www.stefano-biddau.com/)

---

## 📄 License

[MIT License](https://github.com/stefanBid/sb-floating-panel-vue/blob/main/LICENSE) © [Stefano Biddau](https://www.stefano-biddau.com/)
