# Migrating

## Deprecated in v5 (removed in v6)

Deprecated in 5.3.0. They keep working in 5.x; your editor marks them as deprecated.

- **The reason payload of the `open` and `close` events** (`SbOpenReason`, `SbCloseReason`). The events stay, without arguments.
- **The exposed `isOpen`, `open()`, `close()` and `toggle()`** of `SbContainer`: bind `v-model:open` instead. `update()` stays.
- **The slot props `side`, `align` and `referenceId`**: read the side and alignment from `placement` (`placement.split('-')`), and pass your own `id` to `SbReference`.

## From v4 to v5

v5 is a breaking release.

- **`teleportTo` and `teleportDisabled` are replaced by `teleport`**: `teleport-to="#overlays"` becomes `teleport="#overlays"`, `teleport-disabled` becomes `:teleport="false"`.
- **Menus and listboxes handle the keyboard.** Remove your own arrow-key, Home/End and typeahead handlers on `role="menu"` and `role="listbox"` panels, or keep them and call `event.preventDefault()` on the keys they handle (the library then leaves those keys alone), or set `:keyboard-navigation="false"`. Tab now closes a menu.
- **Tooltips.** With `role="tooltip"` the reference no longer gets `aria-expanded` nor `aria-controls`, and gets `aria-describedby` pointing to the panel while open; `autoFocus` defaults to `false`. Replace a `trigger="manual"` tooltip opened with your own `@mouseenter` / `@focus` handlers by `trigger="hover"`.
- **`SbTrigger` also takes `'hover'` and `'focus'`**: a `switch` over it in your code may need the new cases.
- **The panel closes when its reference unmounts** while open.
- **Escape closes the open panel that has focus**, else the most recently opened one (it was always the most recently opened one).

## From v3 to v4

v4 changed these defaults:

- **`autoFocus` is `true`.** Focus moves inside the panel when it opens. Set `:auto-focus="false"` on panels that must not take focus, such as tooltips.
- **`ariaHaspopup` follows the panel `role`** instead of defaulting to `dialog`: drop the matching `aria-haspopup` you set by hand, keep it only where it differs from the role.
- **Focus moving outside closes the panel.** Set `:close-on-focus-out="false"` to keep the previous behaviour.
- **The panel is named after the reference** with `aria-labelledby`; pass `aria-label` or `aria-labelledby` to name it differently.
- **Escape** no longer closes the panel when a widget inside called `preventDefault()` on it, and it now calls `preventDefault()` itself.
- **`data-sbf-state` on the panel** becomes `closed` during the leave transition.

## From v2 to v3

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
