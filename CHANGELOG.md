# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [5.3.0](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.2.1...v5.3.0) (2026-10-21)


### Features

* deprecate the event reason, the exposed open state methods and three slot props ([#45](https://github.com/stefanBid/sb-floating-panel-vue/issues/45)) ([b27eb4f](https://github.com/stefanBid/sb-floating-panel-vue/commit/b27eb4f583f71a01c58eea8fb1c73fb260bce6aa))

## [5.2.1](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.2.0...v5.2.1) (2026-10-20)


### Bug Fixes

* keep disabled links from navigating and let Escape skip panels that ignore it ([#41](https://github.com/stefanBid/sb-floating-panel-vue/issues/41)) ([be5d870](https://github.com/stefanBid/sb-floating-panel-vue/commit/be5d8704344e280ee4f64a0be9ee2114e3d27ae8))

## [5.2.0](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.1.3...v5.2.0) (2026-10-20)


### Features

* pass the reason to the open and close events ([#38](https://github.com/stefanBid/sb-floating-panel-vue/issues/38)) ([d8bab43](https://github.com/stefanBid/sb-floating-panel-vue/commit/d8bab43dfa82fd4e5d90ef55a135ec210617cc16))

## [5.1.3](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.1.2...v5.1.3) (2026-10-20)


### Bug Fixes

* open hover panels at once on keyboard focus only ([#36](https://github.com/stefanBid/sb-floating-panel-vue/issues/36)) ([af668ec](https://github.com/stefanBid/sb-floating-panel-vue/commit/af668ec80f347bdd24fb86f6daa06e674db9a9c0))

## [5.1.2](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.1.1...v5.1.2) (2026-10-20)


### Bug Fixes

* keep focus off the body when an open panel unmounts ([#34](https://github.com/stefanBid/sb-floating-panel-vue/issues/34)) ([a3faf80](https://github.com/stefanBid/sb-floating-panel-vue/commit/a3faf805a49c6a49f070921a428a317773ac8050))

## [5.1.1](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.1.0...v5.1.1) (2026-10-20)


### Bug Fixes

* let Shift+Tab enter an open panel from what follows the reference ([#32](https://github.com/stefanBid/sb-floating-panel-vue/issues/32)) ([003d081](https://github.com/stefanBid/sb-floating-panel-vue/commit/003d081a8dc9bd0ad5dcf896700837b3f9590878))

## [5.1.0](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.0.3...v5.1.0) (2026-10-20)


### Features

* add closeOnSelect and the useSbFloating composable ([#28](https://github.com/stefanBid/sb-floating-panel-vue/issues/28)) ([71cd856](https://github.com/stefanBid/sb-floating-panel-vue/commit/71cd85628ba6e6a6594651fa6f13ee801aad78d4))

## [5.0.3](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.0.2...v5.0.3) (2026-10-20)


### Bug Fixes

* warn about misused tooltips, menus and listboxes ([#26](https://github.com/stefanBid/sb-floating-panel-vue/issues/26)) ([8648b64](https://github.com/stefanBid/sb-floating-panel-vue/commit/8648b6469feceffe284d1940e8b3ef7bc6ec24fe))

## [5.0.2](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.0.1...v5.0.2) (2026-10-20)


### Bug Fixes

* keep a text field reference a text field ([#24](https://github.com/stefanBid/sb-floating-panel-vue/issues/24)) ([929ae48](https://github.com/stefanBid/sb-floating-panel-vue/commit/929ae48b2d8ab796040e2271658406c86b4b1fa7))

## [5.0.1](https://github.com/stefanBid/sb-floating-panel-vue/compare/v5.0.0...v5.0.1) (2026-10-20)


### Bug Fixes

* keep hover panels open over nested panels ([#22](https://github.com/stefanBid/sb-floating-panel-vue/issues/22)) ([9ce31dc](https://github.com/stefanBid/sb-floating-panel-vue/commit/9ce31dc89434d6a38172113599327f138a9d7692))

## [5.0.0](https://github.com/stefanBid/sb-floating-panel-vue/compare/v4.0.0...v5.0.0) (2026-10-19)


### ⚠ BREAKING CHANGES

* menu/listbox keyboard, tooltips, hardening and API cleanup ([#19](https://github.com/stefanBid/sb-floating-panel-vue/issues/19))

### Features

* menu/listbox keyboard, tooltips, hardening and API cleanup ([#19](https://github.com/stefanBid/sb-floating-panel-vue/issues/19)) ([ca00b2b](https://github.com/stefanBid/sb-floating-panel-vue/commit/ca00b2bbca9ed5c08fb443b026341fb0242903c9))

## [4.0.0](https://github.com/stefanBid/sb-floating-panel-vue/compare/v3.0.0...v4.0.0) (2026-10-19)


### ⚠ BREAKING CHANGES

* keyboard, ARIA and dismissal hardening ([#17](https://github.com/stefanBid/sb-floating-panel-vue/issues/17))

### Features

* keyboard, ARIA and dismissal hardening ([#17](https://github.com/stefanBid/sb-floating-panel-vue/issues/17)) ([81d84ab](https://github.com/stefanBid/sb-floating-panel-vue/commit/81d84ab275631adea3ab0aa7551349ec62f0073e))

## [3.0.0](https://github.com/stefanBid/sb-floating-panel-vue/compare/v2.0.1...v3.0.0) (2026-10-19)


### ⚠ BREAKING CHANGES

* `useSbFloatingPanel` is no longer exported; the arrow and `sb-floating-panel-vue/style.css` are removed; `offsetValue` is now `offset` (default 8), `hasResize` is now `matchWidth`, `animation`/`duration` are replaced by `transition`; `SbReference` and `SbFloating` no longer take refs or styles as props. See "From v2 to v3" in MIGRATING.md.

### Features

* restructure sb-floating-panel-vue for v3.0.0 ([#15](https://github.com/stefanBid/sb-floating-panel-vue/issues/15)) ([58b7226](https://github.com/stefanBid/sb-floating-panel-vue/commit/58b72268b5468079b3a1d5cc0e92f89809932185))

## [2.0.1](https://github.com/stefanBid/sb-floating-panel-vue/compare/v2.0.0...v2.0.1) (2026-10-18)


### Bug Fixes

* set explicit rootDir in tsconfig for TypeScript 6 ([#13](https://github.com/stefanBid/sb-floating-panel-vue/issues/13)) ([5bf700b](https://github.com/stefanBid/sb-floating-panel-vue/commit/5bf700b1f2a9825abdecae01bf90b6333eea9ac4))

## [2.0.0](https://github.com/stefanBid/sb-floating-panel-vue/compare/v1.0.0...v2.0.0) (2026-10-18)


### ⚠ BREAKING CHANGES

* require @floating-ui/vue 2, which drops vue-demi and needs Vue >=3.3
* require Node.js >=24.19.0
* target Vite 8 default browsers (Chrome/Edge 111, Firefox 114, Safari 16.4)
* make @floating-ui/vue a peer dependency (^2.0.1): install it in your app next to sb-floating-panel-vue

### Features

* make @floating-ui/vue a peer dependency (^2.0.1): install it in your app next to sb-floating-panel-vue ([b3ff03e](https://github.com/stefanBid/sb-floating-panel-vue/commit/b3ff03e05b925afd326ab15546b2924d4d6dec22))
* require @floating-ui/vue 2, which drops vue-demi and needs Vue &gt;=3.3 ([b3ff03e](https://github.com/stefanBid/sb-floating-panel-vue/commit/b3ff03e05b925afd326ab15546b2924d4d6dec22))
* require Node.js &gt;=24.19.0 ([b3ff03e](https://github.com/stefanBid/sb-floating-panel-vue/commit/b3ff03e05b925afd326ab15546b2924d4d6dec22))
* target Vite 8 default browsers (Chrome/Edge 111, Firefox 114, Safari 16.4) ([b3ff03e](https://github.com/stefanBid/sb-floating-panel-vue/commit/b3ff03e05b925afd326ab15546b2924d4d6dec22))


### Bug Fixes

* keep the stylesheet import when bundling (sideEffects lists **/*.css) ([b3ff03e](https://github.com/stefanBid/sb-floating-panel-vue/commit/b3ff03e05b925afd326ab15546b2924d4d6dec22))

## [1.0.0] - 2025-05-15

### Added

- First stable release of the library.
- `useSbFloatingPanel` composable:
  - Placement, strategy, offset configuration.
  - Dynamic visibility control (`open`, `close`, `toggle`).
  - Automatic arrow positioning using `@floating-ui/vue`.
  - Optional width synchronization on resize.
- `SbContainer` component:
  - Provides scoped slot with all state and refs.
  - Automatically wires up floating logic via composable.
- `SbReference` component:
  - Interactive element to trigger the panel.
  - Configurable `as` prop (`button`, `div`, `span`, etc.).
- `SbFloating` component:
  - Handles rendering of the floating panel and arrow.
  - Supports default transitions: `fade`, `scale-fade`, or none.
  - Accepts style and dimension props for full customization.
- Fully type-safe API with `TypeScript`.
- Minimal but flexible scoped styles with optional customization via `class` and `style`.

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

---
