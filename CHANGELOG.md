# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-18

### Changed

- **BREAKING:** `@floating-ui/vue` is now a peer dependency (`^2.0.1`) instead of a dependency. Install it in your app next to `sb-floating-panel-vue`.
- **BREAKING:** requires `@floating-ui/vue` 2, which drops `vue-demi` and needs Vue `>=3.3` (the library already requires Vue `^3.5.13`).
- **BREAKING:** the build targets Vite 8's default browsers (Chrome/Edge 111, Firefox 114, Safari 16.4).
- **BREAKING:** `engines.node` is now `>=24.19.0`.
- `sideEffects` now lists `**/*.css`, so bundlers keep `import 'sb-floating-panel-vue/style.css'`.
- Toolchain upgraded: Vite 8 (Rolldown), `@vitejs/plugin-vue` 6, `vite-plugin-dts` 5, TypeScript 6, `vue-tsc` 3, ESLint 10.

### Fixed

- The stylesheet could be dropped by bundlers because `sideEffects` was `false`.

---

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

