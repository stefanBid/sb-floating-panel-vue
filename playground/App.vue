<script setup lang="ts">
import type { Placement } from '@floating-ui/vue';
import { computed, ref } from 'vue';
import { SbContainer, SbFloating, SbReference, useSbFloatingPanel } from '../src';

const placements: Placement[] = [
  'top-start',
  'top',
  'top-end',
  'right-start',
  'right',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
  'left-start',
  'left',
  'left-end',
];

const menuItems = ['Profile', 'Settings', 'Sign out'];

// Placement explorer: SbContainer reads its props once, so the key remounts it on every change
const explorerPlacement = ref<Placement>('bottom');
const explorerOffset = ref(12);
const explorerAnimation = ref<'fade' | 'scale-fade' | 'none'>('scale-fade');
const explorerKey = computed(
  () => `${explorerPlacement.value}-${explorerOffset.value}-${explorerAnimation.value}`
);

// Composable usage, with a fixed strategy inside a scrollable box
const {
  reference,
  floating,
  floatingArrow,
  floatingPlacement,
  floatingStyle,
  floatingArrowStyle,
  isOpen,
  toggle,
} = useSbFloatingPanel({
  placement: 'right',
  strategy: 'fixed',
  offsetValue: 10,
  hasArrow: true,
});
</script>

<template>
  <main class="page">
    <header>
      <h1>sb-floating-panel-vue</h1>
      <p>Playground for the components and the composable. Run it with <code>npm run dev</code>.</p>
    </header>

    <section class="card">
      <h2>Dropdown</h2>
      <p>
        Components, <code>bottom-start</code>, width synced with the trigger
        (<code>hasResize</code>).
      </p>
      <SbContainer placement="bottom-start" :offset-value="6" :has-resize="true">
        <template
          #default="{
            reference: menuRef,
            floating: menuPanel,
            floatingPlacement: menuPlacement,
            floatingStyle: menuStyle,
            isOpen: menuOpen,
            toggle: menuToggle,
            close: menuClose,
          }"
        >
          <SbReference
            :reference-ref="menuRef"
            class="trigger trigger--wide"
            :on-click="menuToggle"
          >
            Account menu
          </SbReference>
          <SbFloating
            :is-open="menuOpen.value"
            :floating-ref="menuPanel"
            :floating-placement="menuPlacement.value"
            :floating-style="menuStyle.value"
            :z-index="20"
            class="panel"
          >
            <ul class="menu">
              <li v-for="item in menuItems" :key="item">
                <button type="button" @click="menuClose()">{{ item }}</button>
              </li>
            </ul>
          </SbFloating>
        </template>
      </SbContainer>
    </section>

    <section class="card">
      <h2>Tooltip with arrow</h2>
      <p>Components, <code>top</code>, custom arrow size, <code>fade</code> animation.</p>
      <SbContainer placement="top" :offset-value="10" :has-arrow="true">
        <template
          #default="{
            reference: tipRef,
            floating: tipPanel,
            floatingArrow: tipArrow,
            floatingPlacement: tipPlacement,
            floatingStyle: tipStyle,
            floatingArrowStyle: tipArrowStyle,
            isOpen: tipOpen,
            open: tipShow,
            close: tipHide,
          }"
        >
          <SbReference
            :reference-ref="tipRef"
            as="span"
            class="trigger trigger--text"
            @mouseenter="tipShow()"
            @mouseleave="tipHide()"
          >
            Hover me
          </SbReference>
          <SbFloating
            :is-open="tipOpen.value"
            :floating-ref="tipPanel"
            :floating-arrow-ref="tipArrow"
            :floating-placement="tipPlacement.value"
            :floating-style="tipStyle.value"
            :floating-arrow-style="tipArrowStyle.value"
            :arrow-dimensions="10"
            :z-index="30"
            animation="fade"
            :duration="150"
            class="tooltip"
          >
            Tooltip text
          </SbFloating>
        </template>
      </SbContainer>
    </section>

    <section class="card">
      <h2>Placement explorer</h2>
      <div class="controls">
        <label>
          Placement
          <select v-model="explorerPlacement">
            <option v-for="placement in placements" :key="placement" :value="placement">
              {{ placement }}
            </option>
          </select>
        </label>
        <label>
          Offset: {{ explorerOffset }}px
          <input v-model.number="explorerOffset" type="range" min="0" max="40" />
        </label>
        <label>
          Animation
          <select v-model="explorerAnimation">
            <option value="scale-fade">scale-fade</option>
            <option value="fade">fade</option>
            <option value="none">none</option>
          </select>
        </label>
      </div>
      <div class="stage">
        <SbContainer
          :key="explorerKey"
          :placement="explorerPlacement"
          :offset-value="explorerOffset"
          :has-arrow="true"
        >
          <template
            #default="{
              reference: exRef,
              floating: exPanel,
              floatingArrow: exArrow,
              floatingPlacement: exPlacement,
              floatingStyle: exStyle,
              floatingArrowStyle: exArrowStyle,
              isOpen: exOpen,
              toggle: exToggle,
            }"
          >
            <SbReference :reference-ref="exRef" class="trigger" :on-click="exToggle">
              Toggle panel
            </SbReference>
            <SbFloating
              :is-open="exOpen.value"
              :floating-ref="exPanel"
              :floating-arrow-ref="exArrow"
              :floating-placement="exPlacement.value"
              :floating-style="exStyle.value"
              :floating-arrow-style="exArrowStyle.value"
              :animation="explorerAnimation"
              :z-index="20"
              class="panel panel--padded"
            >
              Resolved placement: <strong>{{ exPlacement.value }}</strong>
            </SbFloating>
          </template>
        </SbContainer>
      </div>
    </section>

    <section class="card">
      <h2>Composable</h2>
      <p>
        <code>useSbFloatingPanel</code> with <code>strategy: 'fixed'</code>. Open it, then scroll
        the box: the panel flips and shifts to stay visible.
      </p>
      <div class="scroller">
        <div class="scroller__content">
          <button ref="reference" type="button" class="trigger" @click="toggle()">
            Open composable panel
          </button>
        </div>
      </div>
      <div
        v-if="isOpen"
        ref="floating"
        :style="floatingStyle"
        class="panel panel--padded panel--top"
      >
        Placement: <strong>{{ floatingPlacement }}</strong>
        <div ref="floatingArrow" :style="floatingArrowStyle"></div>
      </div>
    </section>
  </main>
</template>

<style>
:root {
  --bg: #f6f7f9;
  --surface: #ffffff;
  --text: #1c1f24;
  --muted: #5d6470;
  --border: #d9dde3;
  --accent: #2f5bea;
  --tooltip: #1c1f24;
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14161a;
    --surface: #1d2026;
    --text: #e8eaed;
    --muted: #a0a6b0;
    --border: #343943;
    --accent: #7c9cff;
    --tooltip: #e8eaed;
  }
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  line-height: 1.5;
}

code {
  font-size: 0.9em;
}
</style>

<style scoped>
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 16px 64px;
  display: grid;
  gap: 20px;
}

h1 {
  margin: 0 0 4px;
  font-size: 1.6rem;
}

h2 {
  margin: 0 0 4px;
  font-size: 1.1rem;
}

header p,
.card p {
  margin: 0 0 16px;
  color: var(--muted);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}

.trigger {
  font: inherit;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}

.trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.trigger--wide {
  min-width: 220px;
  text-align: left;
}

.trigger--text {
  display: inline-block;
  border-style: dashed;
}

.panel {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
  box-sizing: border-box;
}

.panel--padded {
  padding: 10px 14px;
}

.panel--top {
  z-index: 20;
}

.tooltip {
  background: var(--tooltip);
  color: var(--bg);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.875rem;
}

.menu {
  list-style: none;
  margin: 0;
  padding: 4px;
}

.menu button {
  width: 100%;
  font: inherit;
  text-align: left;
  padding: 8px 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.menu button:hover,
.menu button:focus-visible {
  background: var(--bg);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.controls label {
  display: grid;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--muted);
}

.controls select,
.controls input {
  font: inherit;
  color: var(--text);
}

.stage {
  display: grid;
  place-items: center;
  min-height: 220px;
  border: 1px dashed var(--border);
  border-radius: 8px;
}

.scroller {
  height: 180px;
  overflow: auto;
  border: 1px dashed var(--border);
  border-radius: 8px;
}

.scroller__content {
  height: 600px;
  padding: 220px 24px;
  box-sizing: border-box;
}
</style>
