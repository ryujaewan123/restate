# Changelog

All notable changes to this project are documented in this file.

## 3.0.1

### Changed

- Removed every runtime dependency; React is now the package's only peer.
- Replaced `use-sync-external-store` with an internal React 16/17 fallback while
  continuing to use React's native hook on React 18 and newer.
- Removed React Native and MMKV peer declarations so npm does not resolve native
  packages, Babel, Metro, or Nitro while installing Restate.
- Removed the React type import from the public declarations.

### Added

- Package validation that rejects runtime dependencies or non-React peers.

## 3.0.0

### Added

- `persistedRestate` with automatic, race-safe hydration.
- IndexedDB persistence on React web and MMKV persistence on React Native.
- Explicit `save`, `restore`, `hasSaved`, `clearStorage`, and `resetAll` APIs.
- Store events, updater lifecycle controls, initial-value reset, and destruction.
- `restateManager` for application-wide save, restore, reset, storage clearing,
  and lifecycle observation.
- Storage adapters, custom serialization, persisted versions, and migrations.
- Explicit ESM, CommonJS, React Native, and TypeScript package entry points.
- React 16.8/17 support through the official external-store shim.

### Changed

- State subscriptions use `Object.is`, matching React external-store snapshots.
- Functional setters use React's direct `(currentValue) => nextValue` contract.
- The package is distributed as readable, tree-shakeable open-source code.
- Release validation rejects minified or obfuscated output and verifies complete
  source-map content for every JavaScript entry point.

### Removed

- `updateOn`, `updateOnTypes`, `memoCheck`, and deep comparison policies.
- The legacy `({ value }) => nextValue` functional setter behavior.

### Fixed

- Concurrent rendering and Strict Mode subscription safety.
- Independent cleanup for multiple consumers.
- First-subscriber/last-subscriber updater lifecycle.
- Ordered delivery of re-entrant updates.
- ESM, CommonJS, Metro, and legacy deep-import resolution.
- Late asynchronous hydration overwriting newer user state.
