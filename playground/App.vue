<script setup lang="ts">
import { computed, h, ref, watchEffect } from 'vue';
import type { FunctionalComponent } from 'vue';
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

// Chevron pointing down; the submenu variant is rotated towards the inline end
const ChevronIcon: FunctionalComponent = () =>
  h(
    'svg',
    { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true' },
    h('path', {
      d: 'M4 6l4 4 4-4',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.75,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    })
  );

// Panels are teleported to body: the direction is set on the root so they follow it too
const rtl = ref(false);
watchEffect(() => (document.documentElement.dir = rtl.value ? 'rtl' : 'ltr'));
// Placements are physical sides: a submenu opens towards the inline end
const submenuPlacement = computed<SbPlacement>(() => (rtl.value ? 'left-start' : 'right-start'));

// Event log: the `open` / `close` events of the containers and the transition events
let eventId = 0;
const events = ref<{ id: number; text: string }[]>([]);
const log = (text: string) => {
  events.value = [{ id: ++eventId, text }, ...events.value].slice(0, 8);
};

const menuItems = ['Profile', 'Settings', 'Sign out'];
const lastAction = ref('none');
const menuDisabled = ref(false);

// Listbox: focus opens on the selected option
const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Lemon', 'Mango', 'Peach'];
const fruit = ref('Cherry');

// Popover controlled with v-model:open
const popoverOpen = ref(false);
const feedback = ref('');

// Manual trigger: the notice opens from code only
const noticeOpen = ref(false);
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
const save = () => {
  noticeOpen.value = true;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (noticeOpen.value = false), 2000);
};

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
        Playground for the components. The library ships no CSS: every style below lives in this
        file. Run it with <code>npm run dev</code>.
      </p>
      <label class="toggle">
        <input v-model="rtl" type="checkbox" />
        Right-to-left: <code>start</code> / <code>end</code> alignments and the submenu arrow keys
        are mirrored; sides are not, so the submenus switch to <code>left-start</code>
      </label>
    </header>

    <section class="card">
      <h2>Dropdown menu</h2>
      <p>
        <code>role="menu"</code> with <code>close-on-select</code>: picking an item closes the menu
        and gives focus back to the trigger. ArrowDown / ArrowUp on the trigger open it on the first
        / last item, then arrows, Home, End and typing a letter move between items; Tab closes it
        and moves on.
      </p>
      <SbContainer
        placement="bottom-start"
        :offset="6"
        match-width="min"
        :disabled="menuDisabled"
        @open="(reason) => log(`Dropdown menu: open (${reason})`)"
        @close="(reason) => log(`Dropdown menu: close (${reason})`)"
      >
        <SbReference class="trigger trigger--wide">
          Account menu <ChevronIcon class="chevron" />
        </SbReference>
        <SbFloating role="menu" transition="pop" class="panel" close-on-select>
          <ul class="menu" role="none">
            <li v-for="item in menuItems" :key="item" role="none">
              <button type="button" role="menuitem" @click="lastAction = item">
                {{ item }}
              </button>
            </li>
          </ul>
        </SbFloating>
      </SbContainer>
      <p class="note">
        Last action: {{ lastAction }} ·
        <label class="inline"><input v-model="menuDisabled" type="checkbox" /> disabled</label>
      </p>
    </section>

    <section class="card">
      <h2>Select</h2>
      <p>
        <code>role="listbox"</code> rendered <code>as="ul"</code>, <code>match-width</code> and
        <code>close-on-select</code>. The panel opens on the selected option; the options are
        <code>li</code> elements with <code>tabindex="-1"</code>, so Enter and Space click them.
      </p>
      <span id="fruit-label" class="field-label">Fruit</span>
      <SbContainer
        placement="bottom-start"
        :offset="4"
        match-width
        @open="(reason) => log(`Select: open (${reason})`)"
        @close="(reason) => log(`Select: close (${reason})`)"
      >
        <SbReference
          id="fruit"
          class="trigger trigger--wide trigger--select"
          aria-labelledby="fruit-label fruit"
        >
          {{ fruit }} <ChevronIcon class="chevron" />
        </SbReference>
        <SbFloating
          as="ul"
          role="listbox"
          aria-labelledby="fruit-label"
          transition="pop"
          class="panel menu menu--scroll"
          close-on-select
        >
          <li
            v-for="option in fruits"
            :key="option"
            role="option"
            tabindex="-1"
            :aria-selected="option === fruit"
            @click="fruit = option"
          >
            {{ option }}
          </li>
        </SbFloating>
      </SbContainer>
    </section>

    <section class="card">
      <h2>Popover with a form</h2>
      <p>
        <code>v-model:open</code>. Focus moves to the textarea once the panel is positioned and goes
        back to the trigger on Escape; Tab past the button moves on to the page and closes it.
      </p>
      <SbContainer v-model:open="popoverOpen" placement="right-start">
        <template #default="{ close }">
          <SbReference class="trigger">Send feedback</SbReference>
          <SbFloating transition="pop" class="panel panel--padded panel--form">
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
        <code>trigger="hover"</code>: opens 300 ms after the pointer enters, at once on keyboard
        focus. The pointer can move onto the tooltip without closing it; Escape dismisses it.
        <code>role="tooltip"</code> keeps focus on the trigger and describes it with
        <code>aria-describedby</code>.
      </p>
      <SbContainer placement="top" trigger="hover" :offset="6">
        <SbReference class="trigger trigger--text">Hover or focus me</SbReference>
        <SbFloating role="tooltip" transition="pop" class="tooltip">Tooltip text</SbFloating>
      </SbContainer>
    </section>

    <section class="card">
      <h2>Hover card with a tooltip inside</h2>
      <p>
        A hover card is a <code>trigger="hover"</code> panel that keeps the default
        <code>dialog</code> role. The tooltip inside it is teleported out of the card but belongs to
        it: moving the pointer onto the tooltip keeps both open.
      </p>
      <SbContainer
        placement="bottom-start"
        trigger="hover"
        @open="(reason) => log(`Hover card: open (${reason})`)"
        @close="(reason) => log(`Hover card: close (${reason})`)"
      >
        <SbReference as="a" href="#" class="user-link" @click.prevent>@ada</SbReference>
        <SbFloating transition="pop" class="panel panel--padded hovercard" aria-label="Ada">
          <strong>Ada Lovelace</strong>
          <p>
            Wrote the first
            <SbContainer placement="top" trigger="hover" :offset="4">
              <SbReference as="span" class="term">algorithm</SbReference>
              <SbFloating role="tooltip" transition="pop" class="tooltip">
                For the Analytical Engine, in 1843
              </SbFloating>
            </SbContainer>
            meant for a machine.
          </p>
        </SbFloating>
      </SbContainer>
    </section>

    <section class="card">
      <h2>Focus and manual triggers</h2>
      <p>
        <code>trigger="focus"</code> on a text field (<code>as="input"</code>): the hint opens while
        the field has focus and focus stays in it. <code>trigger="manual"</code>: the notice opens
        only from code, here through <code>v-model:open</code> for two seconds.
      </p>
      <div class="row">
        <div class="field">
          <label for="password" class="field-label">Password</label>
          <SbContainer placement="bottom-start" trigger="focus" :offset="4">
            <SbReference id="password" as="input" type="password" class="input" />
            <SbFloating role="tooltip" transition="pop" class="tooltip">
              At least 12 characters
            </SbFloating>
          </SbContainer>
        </div>
        <SbContainer v-model:open="noticeOpen" placement="right" trigger="manual">
          <SbReference class="trigger" @click="save">Save</SbReference>
          <SbFloating :role="null" :auto-focus="false" transition="pop" class="tooltip">
            Saved
          </SbFloating>
        </SbContainer>
      </div>
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
          :close-on-focus-out="false"
          default-open
        >
          <template #default="{ placement }">
            <SbReference class="trigger trigger--wide">Toggle panel</SbReference>
            <SbFloating
              :transition="explorerTransition === 'none' ? undefined : explorerTransition"
              class="panel panel--padded"
              @after-enter="log('Explorer: after-enter')"
              @after-leave="log('Explorer: after-leave')"
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
        closes the innermost first. ArrowRight on <em>Open recent</em> opens the submenu, ArrowLeft
        closes it; Tab closes both. With <code>close-on-select</code>, picking a file closes both
        menus and focus goes back to <em>File</em>.
      </p>
      <SbContainer>
        <SbReference class="trigger">File</SbReference>
        <SbFloating role="menu" transition="pop" class="panel" close-on-select>
          <ul class="menu" role="none">
            <li role="none">
              <button type="button" role="menuitem" @click="lastAction = 'New file'">New</button>
            </li>
            <li role="none">
              <SbContainer :placement="submenuPlacement" :offset="4">
                <SbReference class="menu__sub" role="menuitem">
                  Open recent <ChevronIcon class="chevron chevron--sub" />
                </SbReference>
                <SbFloating role="menu" transition="pop" class="panel" close-on-select>
                  <ul class="menu" role="none">
                    <li v-for="file in ['notes.md', 'todo.md']" :key="file" role="none">
                      <button type="button" role="menuitem" @click="lastAction = `Open ${file}`">
                        {{ file }}
                      </button>
                    </li>
                  </ul>
                </SbFloating>
              </SbContainer>
            </li>
          </ul>
        </SbFloating>
      </SbContainer>
      <p class="note">Last action: {{ lastAction }}</p>
    </section>

    <section class="card">
      <h2>Hover menu</h2>
      <p>
        <code>trigger="hover"</code> on a menu and on its submenu. The pointer moves from the menu
        onto the submenu, which is teleported out of it, without closing either; leaving both closes
        both. Keyboard focus on <em>Share</em> does not open the submenu: ArrowRight does.
      </p>
      <SbContainer trigger="hover" placement="bottom-start">
        <SbReference class="trigger">Edit <ChevronIcon class="chevron" /></SbReference>
        <SbFloating role="menu" transition="pop" class="panel" close-on-select>
          <ul class="menu" role="none">
            <li role="none">
              <button type="button" role="menuitem" @click="lastAction = 'Copy'">Copy</button>
            </li>
            <li role="none">
              <SbContainer trigger="hover" :placement="submenuPlacement" :offset="4">
                <SbReference class="menu__sub" role="menuitem">
                  Share <ChevronIcon class="chevron chevron--sub" />
                </SbReference>
                <SbFloating role="menu" transition="pop" class="panel" close-on-select>
                  <ul class="menu" role="none">
                    <li v-for="target in ['Email', 'Link']" :key="target" role="none">
                      <button
                        type="button"
                        role="menuitem"
                        @click="lastAction = `Share by ${target}`"
                      >
                        {{ target }}
                      </button>
                    </li>
                  </ul>
                </SbFloating>
              </SbContainer>
            </li>
          </ul>
        </SbFloating>
      </SbContainer>
      <p class="note">Last action: {{ lastAction }}</p>
    </section>

    <aside class="log" aria-label="Event log">
      <h2>Events</h2>
      <p v-if="!events.length" class="log__empty">
        Open a panel: the <code>open</code> and <code>close</code> events, with their reason, and
        the <code>after-enter</code> and <code>after-leave</code> events show up here.
      </p>
      <ol v-else>
        <li v-for="event in events" :key="event.id">{{ event.text }}</li>
      </ol>
    </aside>
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
  accent-color: var(--accent);
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

::selection {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
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

.hovercard {
  width: 240px;
}

.hovercard p {
  margin: 4px 0 0;
  color: var(--muted);
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

.menu--scroll {
  max-height: min(220px, var(--sbf-available-height));
  overflow-y: auto;
}

.menu button,
.menu [role='option'],
.menu__sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;
  width: 100%;
  font: inherit;
  text-align: start;
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
.menu [role='option']:hover,
.menu [role='option']:focus-visible,
.menu__sub[data-sbf-state='open'] {
  background: var(--bg);
  outline: none;
}

.menu [role='option'][aria-selected='true'] {
  color: var(--accent);
  font-weight: 600;
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

.trigger[aria-disabled='true'],
.trigger:disabled {
  color: var(--muted);
  cursor: not-allowed;
}

.trigger:focus-visible,
.input:focus-visible,
.user-link:focus-visible,
.term:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.chevron {
  vertical-align: -1px;
  margin-inline-start: 4px;
  transition: transform 150ms ease;
}

.trigger[data-sbf-state='open'] .chevron {
  transform: rotate(180deg);
}

.chevron--sub {
  transform: rotate(-90deg);
}

[dir='rtl'] .chevron--sub {
  transform: rotate(90deg);
}

/* pop: scale and fade from the side facing the reference; the transform is safe because the
   panel is not the positioned element */
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
  max-width: 68ch;
  margin: 0 0 16px;
  color: var(--muted);
  text-wrap: pretty;
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

.toggle,
.inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
}

.toggle {
  color: var(--muted);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 16px;
}

.field {
  display: grid;
  gap: 4px;
}

.field-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.875rem;
  color: var(--muted);
}

.field .field-label {
  margin-bottom: 0;
}

.input {
  font: inherit;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
}

.trigger--wide {
  min-width: 220px;
  text-align: start;
}

.trigger--select {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
}

.trigger--text {
  display: inline-block;
  border-style: dashed;
}

.link,
.user-link {
  font: inherit;
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.term {
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  cursor: help;
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

.log {
  padding: 16px 20px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  font-size: 0.875rem;
}

.log h2 {
  font-size: 0.95rem;
}

.log ol {
  margin: 0;
  padding-inline-start: 20px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.log__empty {
  margin: 0;
  color: var(--muted);
}

/* Wide screens: the log stays in view next to the demos */
@media (min-width: 1300px) {
  .log {
    position: fixed;
    inset-block-start: 32px;
    inset-inline-end: 24px;
    width: 220px;
    background: var(--surface);
  }
}
</style>
