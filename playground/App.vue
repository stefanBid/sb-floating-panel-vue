<script setup lang="ts">
import { ref } from 'vue';
import { SbContainer, SbFloating, SbReference } from '../src';
import type { SbPlacement, SbStrategy } from '../src';

const placements: SbPlacement[] = [
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
const lastAction = ref('none');

// Popover controlled with v-model:open
const popoverOpen = ref(false);
const feedback = ref('');

// Placement explorer: every prop is reactive, no remount needed
const explorerPlacement = ref<SbPlacement>('bottom');
const explorerOffset = ref(12);
const explorerPadding = ref(8);
const explorerStrategy = ref<SbStrategy>('absolute');
const explorerMatchWidth = ref<'off' | 'width' | 'min'>('off');
const explorerTransition = ref<'pop' | 'slide' | 'none'>('slide');
</script>

<template>
  <main class="page">
    <header>
      <h1>sb-floating-panel-vue</h1>
      <p>
        Playground for the v3 components. The library ships no CSS: every style below lives in this
        file. Run it with <code>npm run dev</code>.
      </p>
    </header>

    <section class="card">
      <h2>Dropdown menu</h2>
      <p>
        <code>matchWidth="min"</code>, <code>role="menu"</code>, <code>pop</code> transition, the
        chevron rotates with <code>data-sbf-state</code>.
      </p>
      <SbContainer placement="bottom-start" :offset="6" match-width="min">
        <template #default="{ close }">
          <SbReference class="trigger trigger--wide" aria-haspopup="menu">
            Account menu <span class="chevron" aria-hidden="true">▾</span>
          </SbReference>
          <SbFloating role="menu" transition="pop" class="panel">
            <ul class="menu">
              <li v-for="item in menuItems" :key="item">
                <button
                  type="button"
                  role="menuitem"
                  @click="
                    lastAction = item;
                    close();
                  "
                >
                  {{ item }}
                </button>
              </li>
            </ul>
          </SbFloating>
        </template>
      </SbContainer>
      <p class="note">Last action: {{ lastAction }}</p>
    </section>

    <section class="card">
      <h2>Popover with a form</h2>
      <p>
        <code>v-model:open</code> and <code>auto-focus</code>: focus moves to the textarea once the
        panel is positioned and goes back to the trigger on Escape.
      </p>
      <SbContainer v-model:open="popoverOpen" placement="right-start">
        <template #default="{ close }">
          <SbReference class="trigger">Send feedback</SbReference>
          <SbFloating auto-focus transition="pop" class="panel panel--padded panel--form">
            <form
              @submit.prevent="
                feedback = '';
                close();
              "
            >
              <label for="feedback">Feedback</label>
              <textarea id="feedback" v-model="feedback" rows="3"></textarea>
              <button type="submit" class="trigger">Send</button>
            </form>
          </SbFloating>
        </template>
      </SbContainer>
      <p class="note">
        Open: {{ popoverOpen }} ·
        <button type="button" class="link" @click="popoverOpen = !popoverOpen">
          toggle from outside
        </button>
      </p>
    </section>

    <section class="card">
      <h2>Tooltip</h2>
      <p>
        <code>trigger="manual"</code>: the panel opens from the slot functions, here on hover and
        focus.
      </p>
      <SbContainer placement="top" trigger="manual" :offset="6">
        <template #default="{ open, close }">
          <SbReference
            as="span"
            class="trigger trigger--text"
            aria-haspopup="false"
            @mouseenter="open()"
            @mouseleave="close()"
            @focus="open()"
            @blur="close()"
          >
            Hover or focus me
          </SbReference>
          <SbFloating role="tooltip" transition="pop" class="tooltip">Tooltip text</SbFloating>
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
          Padding: {{ explorerPadding }}px
          <input v-model.number="explorerPadding" type="range" min="0" max="40" />
        </label>
        <label>
          Strategy
          <select v-model="explorerStrategy">
            <option value="absolute">absolute</option>
            <option value="fixed">fixed</option>
          </select>
        </label>
        <label>
          matchWidth
          <select v-model="explorerMatchWidth">
            <option value="off">false</option>
            <option value="width">true</option>
            <option value="min">'min'</option>
          </select>
        </label>
        <label>
          Transition
          <select v-model="explorerTransition">
            <option value="slide">slide (by side)</option>
            <option value="pop">pop</option>
            <option value="none">none</option>
          </select>
        </label>
      </div>
      <div class="stage">
        <SbContainer
          :placement="explorerPlacement"
          :offset="explorerOffset"
          :padding="explorerPadding"
          :strategy="explorerStrategy"
          :match-width="
            explorerMatchWidth === 'off' ? false : explorerMatchWidth === 'min' ? 'min' : true
          "
          :close-on-click-outside="false"
          default-open
        >
          <template #default="{ placement }">
            <SbReference class="trigger trigger--wide">Toggle panel</SbReference>
            <SbFloating
              :transition="explorerTransition === 'none' ? undefined : explorerTransition"
              class="panel panel--padded"
            >
              Resolved placement: <strong>{{ placement }}</strong>
            </SbFloating>
          </template>
        </SbContainer>
      </div>
    </section>

    <section class="card">
      <h2>Scroll container</h2>
      <p>
        <code>strategy="fixed"</code> and <code>hide-when-detached</code>. Open it, then scroll the
        box: the panel flips, shifts and hides once the trigger leaves the box. Its height follows
        <code>--sbf-available-height</code>.
      </p>
      <div class="scroller">
        <div class="scroller__content">
          <SbContainer placement="right" strategy="fixed" hide-when-detached>
            <SbReference class="trigger">Open panel</SbReference>
            <SbFloating class="panel panel--padded panel--scroll" :z-index="20">
              <p v-for="n in 12" :key="n">Line {{ n }}</p>
            </SbFloating>
          </SbContainer>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Nested menu</h2>
      <p>
        A container inside a panel belongs to it: clicks in the submenu keep the parent open, Escape
        closes the innermost first.
      </p>
      <SbContainer>
        <SbReference class="trigger" aria-haspopup="menu">File</SbReference>
        <SbFloating role="menu" transition="pop" class="panel">
          <ul class="menu">
            <li><button type="button" role="menuitem">New</button></li>
            <li>
              <SbContainer placement="right-start" :offset="4">
                <SbReference class="menu__sub" role="menuitem" aria-haspopup="menu">
                  Open recent ▸
                </SbReference>
                <SbFloating role="menu" transition="pop" class="panel">
                  <ul class="menu">
                    <li><button type="button" role="menuitem">notes.md</button></li>
                    <li><button type="button" role="menuitem">todo.md</button></li>
                  </ul>
                </SbFloating>
              </SbContainer>
            </li>
          </ul>
        </SbFloating>
      </SbContainer>
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

/* The panels are teleported to body: their styles cannot be scoped to this component */
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

.panel--form form {
  display: grid;
  gap: 8px;
  width: 240px;
}

.panel--form textarea {
  font: inherit;
  resize: vertical;
}

.panel--scroll {
  max-height: min(240px, var(--sbf-available-height));
  overflow-y: auto;
}

.panel--scroll p {
  margin: 0;
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

.menu button,
.menu__sub {
  display: block;
  width: 100%;
  font: inherit;
  text-align: left;
  padding: 8px 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
}

.menu button:hover,
.menu button:focus-visible,
.menu__sub[data-sbf-state='open'] {
  background: var(--bg);
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

.chevron {
  display: inline-block;
  transition: transform 150ms ease;
}

.trigger[data-sbf-state='open'] .chevron {
  transform: rotate(180deg);
}

/* pop: scale and fade, the transform is safe because the panel is not the positioned element */
.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* slide: direction follows the side resolved after flip */
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-from[data-sbf-side='bottom'],
.slide-leave-to[data-sbf-side='bottom'] {
  transform: translateY(-6px);
}

.slide-enter-from[data-sbf-side='top'],
.slide-leave-to[data-sbf-side='top'] {
  transform: translateY(6px);
}

.slide-enter-from[data-sbf-side='right'],
.slide-leave-to[data-sbf-side='right'] {
  transform: translateX(-6px);
}

.slide-enter-from[data-sbf-side='left'],
.slide-leave-to[data-sbf-side='left'] {
  transform: translateX(6px);
}

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active,
  .slide-enter-active,
  .slide-leave-active,
  .chevron {
    transition: none;
  }
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

.card p.note {
  margin: 12px 0 0;
  font-size: 0.875rem;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}

.trigger--wide {
  min-width: 220px;
  text-align: left;
}

.trigger--text {
  display: inline-block;
  border-style: dashed;
}

.link {
  font: inherit;
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
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
