# sb-floating-panel-vue

[![npm](https://img.shields.io/npm/v/sb-floating-panel-vue.svg)](https://www.npmjs.com/package/sb-floating-panel-vue)
[![license](https://img.shields.io/npm/l/sb-floating-panel-vue.svg)](https://github.com/stefanBid/sb-floating-panel-vue/blob/main/LICENSE)
[![Vue 3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org)
[![CI](https://github.com/stefanBid/sb-floating-panel-vue/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/stefanBid/sb-floating-panel-vue/actions/workflows/ci.yml)
[![coverage](https://raw.githubusercontent.com/stefanBid/sb-floating-panel-vue/badges/coverage.svg)](https://github.com/stefanBid/sb-floating-panel-vue/actions/workflows/ci.yml)
[![branches](https://raw.githubusercontent.com/stefanBid/sb-floating-panel-vue/badges/coverage-branches.svg)](https://github.com/stefanBid/sb-floating-panel-vue/actions/workflows/ci.yml)

## 🔥 Features

- 🧩 Three components (`SbContainer`, `SbReference`, `SbFloating`) for dropdowns, popovers, menus and tooltips
- ⚡ Built on top of [`@floating-ui/vue`](https://floating-ui.com/): `offset`, `flip`, `shift`, `size` and `hide` already configured
- 🎨 Zero CSS shipped: the library adapts to your design system (plain CSS, Tailwind, CSS modules)
- ♿ Accessible by default: ARIA attributes, keyboard support, Escape, click outside, focus management
- 🔁 Fully reactive props, `v-model:open`, nested panels

---

## 👤 Author

Created with ❤️ by [Stefano Biddau](https://www.stefano-biddau.com/)

---

## ❓ Why This Library?

`sb-floating-panel-vue` makes it easy to build floating panels in Vue 3 without touching positioning logic. You write three components; the library handles placement, flipping, viewport collisions, open state, accessibility and teleporting. It never decides how your panel looks: no stylesheet, no default visual style, only data attributes and CSS variables your styles can read.

---

## 📦 Installation

```bash
# npm
npm install sb-floating-panel-vue vue @floating-ui/vue

# yarn
yarn add sb-floating-panel-vue vue @floating-ui/vue

# pnpm
pnpm add sb-floating-panel-vue vue @floating-ui/vue
```

`vue` (`^3.5.13`) and `@floating-ui/vue` (`^2.0.1`) are peer dependencies: your app provides them, so only one copy of each ends up in the bundle. Vue is usually already installed in your app.

There is no CSS file to import.

---

## 🧱 Usage

```vue
<script setup lang="ts">
import { SbContainer, SbReference, SbFloating } from 'sb-floating-panel-vue';
</script>

<template>
  <SbContainer placement="bottom-start" match-width="min">
    <template #default="{ close }">
      <SbReference class="my-trigger" aria-haspopup="menu">Account</SbReference>
      <SbFloating role="menu" transition="pop" class="my-panel">
        <button type="button" role="menuitem" @click="close()">Sign out</button>
      </SbFloating>
    </template>
  </SbContainer>
</template>
```

`SbContainer` shares its state with `SbReference` and `SbFloating` through `provide`/`inject`: no refs or styles to pass by hand. Both must be used inside an `SbContainer`.

### `<SbContainer>`

Holds the state and the positioning. Renders no element of its own, only its slot.

| Prop                  | Type                                   | Default          | Description                                                                                  |
|-----------------------|----------------------------------------|------------------|----------------------------------------------------------------------------------------------|
| `placement`           | `SbPlacement`                          | `'bottom-start'` | Preferred placement; the panel flips when there is not enough space                          |
| `strategy`            | `'absolute' \| 'fixed'`                | `'absolute'`     | CSS position strategy. Use `fixed` inside scroll containers or fixed layouts                 |
| `offset`              | `number`                               | `8`              | Distance in px between reference and panel                                                   |
| `padding`             | `number`                               | `8`              | Minimum distance in px between the panel and the viewport edges                              |
| `matchWidth`          | `boolean \| 'min'`                     | `false`          | `true` sets `width`, `'min'` sets `min-width` to the reference width                          |
| `hideWhenDetached`    | `boolean`                              | `false`          | Sets `visibility: hidden` when the reference is scrolled out of view                         |
| `v-model:open`        | `boolean`                              | —                | Open state. Leave it unset to let the container manage it                                    |
| `defaultOpen`         | `boolean`                              | `false`          | Initial open state when `v-model:open` is not used                                           |
| `disabled`            | `boolean`                              | `false`          | Prevents opening; closes the panel if it is open                                             |
| `trigger`             | `'click' \| 'manual'`                  | `'click'`        | `manual`: the reference does not toggle; open with `v-model:open`, slot props or methods    |
| `closeOnEscape`       | `boolean`                              | `true`           | Closes on Escape                                                                             |
| `closeOnClickOutside` | `boolean`                              | `true`           | Closes on a pointer press outside the reference and the panel                                |

| Event         | Payload   | Description              |
|---------------|-----------|--------------------------|
| `update:open` | `boolean` | Used by `v-model:open`   |
| `open`        | —         | The panel has opened     |
| `close`       | —         | The panel has closed     |

**Slot props**: `isOpen`, `open()`, `close()`, `toggle()`, `placement` (resolved after flip), `side`.

**Exposed methods** (template ref): `open()`, `close()`, `toggle()`, `update()` (recomputes the position).

### `<SbReference>`

The trigger the panel is anchored to.

| Prop           | Type     | Default    | Description                                                                                                  |
|----------------|----------|------------|--------------------------------------------------------------------------------------------------------------|
| `as`           | `string` | `'button'` | Tag to render. `button` gets `type="button"`; tags other than `button`/`a` get `role="button"`, `tabindex="0"` and Enter/Space |
| `ariaHaspopup` | `'dialog' \| 'menu' \| 'listbox' \| 'tree' \| 'grid' \| 'true' \| 'false'` | `'dialog'` | Value of `aria-haspopup`, matching the `role` of the panel |

Sets `aria-expanded`, `aria-controls` (while open) and `data-sbf-state`. When the container is `disabled`, a `button` gets `disabled`, other tags get `aria-disabled="true"` and `tabindex="-1"`. Your own `class`, attributes and listeners (`@click`, `@mouseenter`, …) are applied to the element; the click is not stopped.

### `<SbFloating>`

The panel, teleported to `body`. It is rendered while open and stays mounted until its leave transition has finished.

| Prop               | Type                    | Default    | Description                                                                                         |
|--------------------|-------------------------|------------|-----------------------------------------------------------------------------------------------------|
| `as`               | `string`                | `'div'`    | Tag of the panel element                                                                            |
| `role`             | `string`                | `'dialog'` | ARIA role of the panel                                                                              |
| `transition`       | `string`                | —          | Name of a Vue `<Transition>` defined in your CSS. No animation when unset                           |
| `teleportTo`       | `string \| HTMLElement` | `'body'`   | Teleport target                                                                                     |
| `teleportDisabled` | `boolean`               | `false`    | Renders the panel in place                                                                          |
| `zIndex`           | `number \| string`      | —          | `z-index` of the positioned wrapper                                                                 |
| `autoFocus`        | `boolean`               | `false`    | Once positioned, focuses the first `[autofocus]` or focusable element inside, else the panel itself |

| Event         | Description                                                    |
|---------------|----------------------------------------------------------------|
| `after-enter` | The enter transition has finished                              |
| `after-leave` | The leave transition has finished and the panel is removed     |

When focus is inside the panel as it closes, it goes back to the reference.

### Types

```ts
import type {
  SbContainerProps,
  SbContainerSlotProps,
  SbContainerExposed,
  SbReferenceProps,
  SbFloatingProps,
  SbTrigger,
  SbPlacement,
  SbSide,
  SbAlignment,
  SbStrategy,
} from 'sb-floating-panel-vue';
```

---

## 🧭 How It Works

### Shared state

`SbContainer` owns the state (open state, positioning, ARIA ids) and shares it with its descendants through Vue `provide`/`inject`:

```
SbContainer ── provides the state ──┬─▶ SbReference
                                    └─▶ SbFloating
```

- `SbReference` and `SbFloating` find their container on their own: you pass no refs, styles or handlers, and never write `.value`.
- The lookup follows the component tree, not the DOM, so it keeps working although `SbFloating` is teleported to `body`.
- They can sit at any depth inside the container slot, also inside your own components.
- Used outside an `SbContainer`, they throw: `[sb-floating-panel-vue] <SbFloating> must be used inside <SbContainer>.`

### Nested containers

An `SbContainer` placed inside another one (e.g. a submenu in a menu panel) registers with its parent:

- a press inside the nested panel is not "outside" for the parent, so both stay open;
- Escape closes the innermost open panel first, then the next one;
- a press outside all of them closes them all.

### From click to open panel

1. **Click** on `SbReference` (or Enter/Space on a non-interactive tag). With `trigger="click"` and the container not `disabled`, the container toggles: it emits `update:open` and, without `v-model:open`, updates its own state.
2. **Open state changes.** `SbReference` gets `aria-expanded="true"`, `aria-controls` and `data-sbf-state="open"`; the container starts listening for Escape and outside presses (only while open) and emits `open`.
3. **The panel mounts.** `SbFloating` renders the wrapper in the teleport target and the panel inside it; the enter classes of your `transition`, if any, are applied to the panel.
4. **Positioning.** Floating UI starts tracking the reference (scroll, resize, layout changes) and computes the position with `offset`, `flip`, `shift`, `size` and, with `hideWhenDetached`, `hide`. `size` writes the `--sbf-*` variables and applies `matchWidth`; the position is written on the wrapper.
5. **Positioned.** With `autoFocus`, focus moves inside the panel now, not earlier, so the page does not jump to the panel's initial (0, 0) position.

Closing (click on the reference, `close()`, Escape, press outside, `v-model:open` set to `false`, or `disabled`):

1. If focus is inside the panel, it goes back to the reference; the container emits `close`.
2. The leave classes of your `transition` are applied; the wrapper stays mounted and positioned until the animation ends (immediately without `transition`).
3. The wrapper is removed, Floating UI stops tracking, `SbFloating` emits `after-leave`.

---

## 🎨 Styling

The library writes values on the elements; your CSS reads them. `SbFloating` renders two elements:

```html
<!-- wrapper: positioning only (Floating UI styles, z-index, CSS variables) -->
<div style="position: absolute; transform: translate(120px, 40px); --sbf-reference-width: 180px; …">
  <!-- panel: your class, style and attributes -->
  <div class="my-panel" role="dialog" data-sbf-state="open" data-sbf-side="bottom" data-sbf-align="start">
    …
  </div>
</div>
```

Your styles, transitions and transforms go on the panel, so they never fight with the positioning `transform` of the wrapper.

### Data attributes

| Attribute        | Values                               | On                       | Use                                         |
|------------------|--------------------------------------|--------------------------|---------------------------------------------|
| `data-sbf-state` | `open` / `closed`                    | reference                | Open/closed styles (e.g. rotate an icon)    |
| `data-sbf-state` | `open`                               | panel                    | Always `open` while rendered: style the exit with the leave classes of `transition` |
| `data-sbf-side`  | `top` / `bottom` / `left` / `right`  | panel                    | Real side after flip: directional animation |
| `data-sbf-align` | `start` / `end` / absent             | panel                    | Alignment part of the placement             |

### CSS variables

Set on the wrapper and inherited by the panel:

| Variable                 | Meaning                                              |
|--------------------------|------------------------------------------------------|
| `--sbf-reference-width`  | Width of the reference                               |
| `--sbf-available-width`  | Horizontal space left before overflowing the viewport |
| `--sbf-available-height` | Vertical space left before overflowing the viewport  |

All attributes and variables use the `sbf` prefix, so they do not clash with other libraries in the same app (e.g. Radix / Reka UI `data-state`).

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
  transition: opacity 150ms ease, transform 150ms ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* direction from the side resolved after flip */
.pop-enter-from[data-sbf-side='bottom'] { transform: translateY(-6px); }
.pop-enter-from[data-sbf-side='top'] { transform: translateY(6px); }
```

### Tailwind (v4)

```vue
<SbReference class="group rounded border px-3 py-2">
  Options
  <span class="inline-block transition-transform group-data-[sbf-state=open]:rotate-180">▾</span>
</SbReference>
<SbFloating class="max-h-(--sbf-available-height) w-(--sbf-reference-width) overflow-y-auto rounded border bg-white shadow-lg">
  …
</SbFloating>
```

---

## ♿ Accessibility

- `SbReference` gets `aria-expanded`, `aria-controls` (pointing to the panel `id`) and `aria-haspopup`; non-interactive tags get `role="button"`, `tabindex="0"` and Enter/Space.
- `SbFloating` gets an `id` generated with Vue `useId()` (SSR safe) and a `role` (`dialog` by default).
- Escape closes the innermost open panel; a press outside closes the panel. A container nested inside a panel counts as part of it.
- With `autoFocus`, focus moves inside the panel after it is positioned.
- When the panel closes with focus inside it, focus returns to the reference (with or without `autoFocus`).

---

## 🔀 Migrating from v2

v3 is a breaking release.

- **The composable is no longer exported.** Use the components; for full control use `@floating-ui/vue` directly.
- **No refs or styles in the slot.** Remove `reference-ref`, `floating-ref`, `is-open`, `floating-placement`, `floating-style` and `:on-click`: the components share their state.
- **No arrow.** `hasArrow`, `floating-arrow-ref`, `floating-arrow-style` and `arrow-dimensions` are gone.
- **No CSS.** Remove `import 'sb-floating-panel-vue/style.css'`. `animation` and `duration` are replaced by `transition`, the name of your own `<Transition>` classes.
- **Renamed props:** `offsetValue` → `offset` (default `15` → `8`), `hasResize` → `matchWidth`.
- **New defaults:** `padding: 8` from the viewport edges; Escape and click outside close the panel.
- `SbContainer` no longer renders a `<div>`; `SbReference` no longer stops click propagation and sets `type="button"`.

```vue
<!-- v2 -->
<SbContainer :has-resize="true">
  <template #default="{ reference, floating, floatingPlacement, floatingStyle, isOpen, toggle }">
    <SbReference :reference-ref="reference" :on-click="toggle">Toggle</SbReference>
    <SbFloating
      :is-open="isOpen.value"
      :floating-ref="floating"
      :floating-placement="floatingPlacement.value"
      :floating-style="floatingStyle.value"
    >
      Hello Panel!
    </SbFloating>
  </template>
</SbContainer>

<!-- v3 -->
<SbContainer match-width>
  <SbReference>Toggle</SbReference>
  <SbFloating>Hello Panel!</SbFloating>
</SbContainer>
```

---

## ⚠️ Directive Note (Teleport Limitation)

`<SbFloating>` renders a `<teleport>` root, so a custom directive applied directly to the component cannot be inherited and Vue warns about it. Move the directive to an element inside the slot:

```vue
<SbFloating>
  <div v-my-directive>...</div>
</SbFloating>
```

---

## 🛠️ Development

```bash
npm install
npm run dev     # playground at http://localhost:5173 (playground/App.vue)
npm run lint    # ESLint
npm run check   # type check of src/, playground/ and test/
npm test        # Vitest + @vue/test-utils (happy-dom)
npm run test:coverage  # tests with V8 coverage report in coverage/
npm run build   # library build in dist/ (ES and UMD, with .d.ts)
```

The playground imports the components from `src/`, so changes reload instantly. It is not part of the published package.

On every push to `main`, CI runs the tests with coverage and `scripts/coverage-badge.mjs` publishes the coverage badges (lines, statements, branches, functions) as SVG files on the `badges` branch, which the badges above read. No external service is involved.

---

## 📄 License

[MIT License](https://github.com/stefanBid/sb-floating-panel-vue/blob/main/LICENSE) © [Stefano Biddau](https://www.stefano-biddau.com/)
