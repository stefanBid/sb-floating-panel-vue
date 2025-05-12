# sb-floating-panel-vue
[![npm](https://img.shields.io/npm/v/sb-floating-panel-vue.svg)](https://www.npmjs.com/package/sb-floating-panel-vue)
[![license](https://img.shields.io/npm/l/sb-floating-panel-vue.svg)](https://github.com/stefanobiddau/sb-floating-panel-vue/blob/main/LICENSE)

> A lightweight Vue 3 composable hook built on top of [@floating-ui/vue](https://github.com/floating-ui/floating-ui) to manage floating panels with arrow and resize support.

---

## ✨ Features

- 📦 Minimal and composable API
- 🎯 Precise floating panel positioning via `@floating-ui/vue`
- 🎈 Optional arrow positioning
- 📏 Auto-resize support
- 🧠 TypeScript-first

---

## 🚀 Installation

```bash
npm install sb-floating-panel-vue
# or
yarn add sb-floating-panel-vue
```

---

## 🧩 Usage

The `useSbFloatingPanel` composable provides an easy-to-integrate API to handle floating panels, such as tooltips, popovers, dropdowns, and other UI overlays.

### Importing

```ts
import { useSbFloatingPanel } from 'sb-floating-panel-vue';
```

### 🧠 API

```ts
const {
  reference,
  floating,
  popperArrow,
  isOpen,
  floatingPosition,
  floatingStyles,
  floatingArrowStyles,
  changeFloatingVisibility,
} = useSbFloatingPanel(settings);
```

### Parameters

The composable takes a `settings` object:

```ts
interface FloatingSettings {
  placement: Placement; // e.g., 'bottom', 'top-start', etc.
  strategy: Strategy; // 'absolute' | 'fixed'
  offsetValue: number; // offset in pixels from the reference element
  hasArrow?: boolean; // enable arrow positioning
  hasResize?: boolean; // enable auto-resizing with anchor element
}
```

---

## 🔍 Computed Values Explained

### `floatingStyles`

A Vue `computed` value containing the CSS style object that must be applied to your floating panel. It is dynamically calculated by `@floating-ui/vue` to maintain optimal placement relative to the reference element.

### `floatingPosition`

The actual resolved placement string, e.g., `'bottom-start'`, useful for adding custom animations or behavior depending on where the panel is placed.

### `floatingArrowStyles`

An object that includes styles for positioning the optional arrow element (enabled via the `hasArrow` setting). You can directly bind this to the arrow’s `style` attribute.

---

## 🧪 Example

```ts
<script setup lang="ts">
import { ref } from 'vue';
import { useSbFloatingPanel } from 'sb-floating-panel-vue';

const {
  reference,
  floating,
  popperArrow,
  isOpen,
  floatingStyles,
  floatingArrowStyles,
  changeFloatingVisibility,
} = useSbFloatingPanel({
  placement: 'bottom',
  strategy: 'absolute',
  offsetValue: 8,
  hasArrow: true,
  hasResize: true,
});

const togglePanel = () => {
  changeFloatingVisibility(!isOpen.value);
};
</script>
```

```vue
<template>
  <button ref="reference" @click="togglePanel">Toggle Panel</button>
  <div
    v-if="isOpen"
    ref="floating"
    :style="floatingStyles"
    class="popover"
  >
    I'm a floating panel!
    <div ref="popperArrow" :style="floatingArrowStyles.arrow" class="arrow" />
  </div>
</template>
```

---

## 🎨 Styling

You can use your own CSS or utility classes (like Tailwind CSS) to style the panel and the arrow. Example:

```css
.popover {
  background: white;
  border: 1px solid #ccc;
  padding: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.arrow {
  width: 10px;
  height: 10px;
  background: white;
  transform: rotate(45deg);
  position: absolute;
}
```

---

## 📄 License

MIT © [Stefano Biddau](https://github.com/stefanobiddau)
