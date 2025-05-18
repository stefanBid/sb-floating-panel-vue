# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

