# sb-floating-panel-vue

[![npm](https://img.shields.io/npm/v/sb-floating-panel-vue.svg)](https://www.npmjs.com/package/sb-floating-panel-vue)
[![license](https://img.shields.io/npm/l/sb-floating-panel-vue.svg)](https://github.com/stefanBid/sb-floating-panel-vue/blob/main/LICENSE)
[![Vue 3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org)
[![build](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)

## 🔥 Features

- 🧩 Floating panel positioning with arrow and smart shifting
- ⚡ Built on top of [`@floating-ui/vue`](https://floating-ui.com/)
- 🎯 Support for resize syncing and animated transitions
- 🧪 Dual usage: composable or plug-and-play components

---

## 👤 Author

Created with ❤️ by [Stefano Biddau](https://www.stefano-biddau.com/)

---

## ❓ Why This Library?

`sb-floating-panel-vue` was designed to make it extremely easy to implement dropdowns, tooltips, and floating panels in Vue 3, without worrying about placement logic, arrow positioning, or responsive syncing. It wraps `@floating-ui/vue` into a more ergonomic composable or ready-to-use components.

---

## 📦 Installation

```bash
# npm
npm install sb-floating-panel-vue

# yarn
yarn add sb-floating-panel-vue

# pnpm
pnpm add sb-floating-panel-vue
```

---

## 🧠 Composable Usage

Use the composable `useSbFloatingPanel()` for complete control.

### Options


| Option      | Type       | Required | Default | Description                                      |
|------------|------------|----------|---------|--------------------------------------------------|
| placement  | `Placement` | Yes     | —       | Placement of the floating panel                 |
| strategy   | `'absolute'` \| `'fixed'` | Yes | —       | CSS positioning strategy                        |
| offsetValue| `number`    | Yes     | —       | Offset between reference and floating           |
| hasArrow   | `boolean`   | No      | `false` | Whether to render arrow                         |
| hasResize  | `boolean`   | No      | `false` | Sync width of floating to reference             |

### Return Values

| Property              | Type                                 | Description                            |
|-----------------------|--------------------------------------|----------------------------------------|
| reference             | `Ref<HTMLElement \| null>`           | Ref for the trigger element            |
| floating              | `Ref<FloatingElement \| null>`       | Ref for the floating panel             |
| floatingArrow         | `Ref<HTMLElement \| null>`           | Ref for the arrow element              |
| floatingPlacement     | `Ref<Placement>`                     | The actual resolved placement          |
| floatingStyle         | `ComputedRef<CSSProperties>`         | Style for the floating panel           |
| floatingArrowStyle    | `ComputedRef<CSSProperties>`         | Style for the arrow                    |
| isOpen                | `Ref<boolean>`                       | Panel visibility                       |
| toggle / open / close | `() => void`                         | Control methods to toggle visibility   |


### Example
In your Vue component, you can use the composable like this:

In your script tag, import the composable and use it:
```ts
import { useSbFloatingPanel } from 'sb-floating-panel-vue';

const {
  reference,
  floating,
  floatingArrow,
  floatingStyle,
  floatingArrowStyle,
  isOpen,
  toggle,
} = useSbFloatingPanel({
  placement: 'bottom-start',
  strategy: 'absolute',
  offsetValue: 12,
  hasArrow: true,
});
```
In your template, you can bind the refs and styles:
```html
<template>
  <button ref="reference" @click="toggle()">Open Panel</button>
  <div v-if="isOpen" ref="floating" :style="floatingStyle">
    Panel
    <div ref="floatingArrow" :style="floatingArrowStyle" />
  </div>
</template>
```

---

## 🧱 Component-Based Usage

### Import the style

If you use components, you **must** import styles in `main.ts`:

```ts
import 'sb-floating-panel-vue/style.css';
```

### Available Components

#### `<SbContainer>`

Wraps everything and provides the context.

| Prop        | Type                      | Default         | Description                                                                 |
|-------------|---------------------------|-----------------|-----------------------------------------------------------------------------|
| placement   | `Placement`               | `'bottom-start'`| Placement of the floating panel relative to the reference element          |
| strategy    | `'absolute' \| 'fixed'`   | `'absolute'`    | CSS positioning strategy for the floating panel                            |
| offsetValue | `number`                  | `15`            | Offset in pixels between reference and floating panel                      |
| hasArrow    | `boolean`                 | `false`         | Whether to render an arrow pointing to the reference                       |
| hasResize   | `boolean`                 | `false`         | Whether the floating panel should sync its width with the reference        |



#### `<SbReference>`

Trigger element

| Prop         | Type                              | Default      | Description                                                                  |
|--------------|-----------------------------------|--------------|------------------------------------------------------------------------------|
| referenceRef | `Ref<HTMLElement \| null>`        | **required** | Reference element to which the floating panel is attached                   |
| as           | `'button' \| 'div' \| 'span' \| etc.` | `'button'`   | HTML tag to render. Defaults to `<button>` for accessibility                |
| onClick      | `() => void`                      | —            | Optional click handler, often used to toggle the floating panel visibility  |


#### `<SbFloating>`

Floating panel

| Prop                | Type                                         | Default         | Description                                                                 |
|---------------------|----------------------------------------------|-----------------|-----------------------------------------------------------------------------|
| floatingRef         | `Ref<HTMLElement \| null>`                   | **required**    | The target element for the floating panel (popover, tooltip, etc.)         |
| floatingArrowRef    | `Ref<HTMLElement \| null>`                   | optional        | The element used as the floating arrow                                     |
| isOpen              | `boolean`                                    | **required**    | Controls visibility of the floating panel                                  |
| floatingPlacement   | `Placement`                                  | **required**    | Current placement as resolved by `@floating-ui/vue`                        |
| floatingStyle       | `CSSProperties`                              | **required**    | Inline style object applied to the floating panel                          |
| floatingArrowStyle  | `CSSProperties`                              | optional        | Inline style object applied to the arrow element                           |
| arrowDimensions     | `number`                                     | optional        | Size (width/height) of the arrow in pixels                                 |
| zIndex              | `number`                                     | `undefined`     | Custom z-index applied to the floating and arrow elements                  |
| animation           | `'fade' \| 'scale-fade' \| 'none'`           | `'scale-fade'`  | Defines the animation style for enter/leave transitions                    |
| duration            | `number`                                     | `300`           | Duration in ms for the transition animations                               |


---

### 🧪 Component Usage Example

In your project, you can use the components like this:

In your script tag, import the components:
```ts
import { SbContainer, SbFloating, SbReference } from 'sb-floating-panel-vue';
```

In your template, you can use the components as follows:
```html
<SbContainer :has-arrow="true" strategy="fixed">
  <template #default="{
    reference,
    floating,
    floatingArrow,
    floatingPlacement,
    floatingStyle,
    floatingArrowStyle,
    isOpen,
    toggle
  }">
    <SbReference :reference-ref="reference" :onClick="toggle">Toggle</SbReference>
    <SbFloating
      :is-open="isOpen.value"
      :floating-ref="floating"
      :floating-arrow-ref="floatingArrow"
      :floating-placement="floatingPlacement.value"
      :floating-style="floatingStyle.value"
      :floating-arrow-style="floatingArrowStyle.value"
      :arrow-dimensions="12"
      :z-index="200"
    >
      Hello Panel!
    </SbFloating>
  </template>
</SbContainer>
```

---

## ⚠️ Directive Note (Teleport Limitation)

Due to `<teleport>` in `<SbFloating>`, if you apply custom directives directly to the component, Vue will warn:

```
[Vue warn]: Extraneous non-props attributes ([directive-name]) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.
```

**Solution**: Move the directive to an inner element using the slot.

### Example Fix

```vue
<SbFloating ...>
  <div v-click-outside>...</div>
</SbFloating>
```

---

## 📄 License

[MIT License](https://github.com/stefanBid/sb-floating-panel-vue/blob/main/LICENSE) © [Stefano Biddau](https://www.stefano-biddau.com/)
