# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0](https://github.com/stefanBid/sb-floating-panel-vue/compare/v2.0.1...v3.0.0) (2026-10-19)


### ⚠ BREAKING CHANGES

* `useSbFloatingPanel` is no longer exported; the arrow and `sb-floating-panel-vue/style.css` are removed; `offsetValue` is now `offset` (default 8), `hasResize` is now `matchWidth`, `animation`/`duration` are replaced by `transition`; `SbReference` and `SbFloating` no longer take refs or styles as props. See "Migrating from v2" in the README.

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
