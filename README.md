# @ryujaewan/restate

[![npm version](https://img.shields.io/npm/v/@ryujaewan/restate.svg)](https://www.npmjs.com/package/@ryujaewan/restate)
[![CI](https://github.com/ryu-cheat/ryujaewan/actions/workflows/restate.yml/badge.svg)](https://github.com/ryu-cheat/ryujaewan/actions/workflows/restate.yml)
[![license](https://img.shields.io/npm/l/@ryujaewan/restate.svg)](./LICENSE)

Provider-free state for React and React Native, with deliberate persistence to
IndexedDB on the web and MMKV on native.

```tsx
import { restate } from '@ryujaewan/restate';

const useCount = restate(0);

function Counter() {
  const count = useCount();

  return (
    <button onClick={() => useCount.set((current) => current + 1)}>
      Count: {count}
    </button>
  );
}
```

## Why Restate

- One value becomes a hook and an imperative store—no provider or reducer.
- React 16.8 through React 19 are supported through React's native
  `useSyncExternalStore` when available and Restate's internal fallback on older
  releases.
- There are zero runtime dependencies. React is the only peer dependency; no
  React Native, Babel, Metro, MMKV, or build-tool version participates in a
  regular Restate install.
- ESM, CommonJS, TypeScript, and the React Native Metro condition have explicit
  package entry points.
- Published JavaScript stays readable and includes source maps. Restate does not
  encrypt, obfuscate, or minify its open-source distribution.
- `set()` never writes to persistent storage. Persistence happens only when
  your application calls `save()`.
- Saved values hydrate automatically and safely: a late storage read cannot
  overwrite a newer in-memory update.
- Store, event, lifecycle, persistence, and whole-application management APIs
  use the same vocabulary on web and native.

## Installation

```sh
npm install @ryujaewan/restate
```

This is all that regular in-memory state and web IndexedDB persistence need.
Restate publishes no `dependencies`; it only expects the React already used by
the host application (`react >= 16.8`). Its TypeScript declarations also avoid
importing React types.

React Native persistence uses the native
[`react-native-mmkv`](https://github.com/mrousavy/react-native-mmkv) engine.
Restate loads it only when `persistedRestate()` is created, so regular React
Native stores do not require MMKV. For persistence, install MMKV according to
its native setup guide. Current MMKV 4 projects also install
`react-native-nitro-modules` and run the platform build/prebuild step:

```sh
npm install react-native-mmkv react-native-nitro-modules
cd ios && pod install
```

Restate accepts MMKV 2, 3, and 4 APIs; it does not force one native version onto
an existing app. MMKV is loaded lazily and is intentionally not declared as a
dependency or peer dependency, so npm never resolves React Native's native or
build-tool tree merely because Restate was installed. Calling
`persistedRestate()` on React Native without MMKV produces a focused setup error.

## In-memory state

Create stores outside components so all consumers share one instance:

```tsx
import { restate } from '@ryujaewan/restate';

type User = {
  name: string;
  signedIn: boolean;
};

export const useUser = restate<User>({
  name: 'Ada',
  signedIn: false,
});
```

Use immutable updates. A component rerenders only when the store snapshot has a
new identity according to `Object.is`:

```tsx
function Profile() {
  const user = useUser();

  return (
    <button
      onClick={() =>
        useUser.set((current) => ({
          ...current,
          signedIn: !current.signedIn,
        }))
      }
    >
      {user.signedIn ? `Signed in as ${user.name}` : 'Sign in'}
    </button>
  );
}
```

The same store can be managed outside React:

```ts
useUser.get();
useUser.set((current) => ({ ...current, name: 'Grace' }));
useUser.reset(); // the value passed to restate(...)

const unsubscribe = useUser.subscribe((value, previousValue, event) => {
  console.log(event.action, previousValue, value);
});
```

## Persistent state

`persistedRestate` uses IndexedDB automatically in React and MMKV automatically
in React Native. The API remains identical on both platforms:

```tsx
import { persistedRestate } from '@ryujaewan/restate';

type Session = {
  token: string | null;
  name: string | null;
};

export const useSession = persistedRestate<Session>(
  { token: null, name: null },
  { key: 'session' },
);
```

The saved value is restored automatically after creation. `ready` resolves
after that first attempt:

```ts
await useSession.ready;
```

Storage operations are explicit:

```ts
useSession.set({ token: 'temporary', name: 'Ada' }); // memory only
await useSession.save();                              // persist current value

useSession.set({ token: null, name: null });          // memory only
await useSession.restore();                           // reload saved value

useSession.reset();             // memory -> declared initial value
await useSession.clearStorage(); // delete storage; keep memory unchanged
await useSession.resetAll();     // reset memory and delete storage together
```

| Operation | Memory | Persistent storage |
| --- | --- | --- |
| `set(value)` | Update | Unchanged |
| `save()` | Unchanged | Save current memory |
| `restore()` | Replace with saved value, or initial value when missing | Unchanged |
| `reset()` | Reset to declared initial value | Unchanged |
| `clearStorage()` / `remove()` | Unchanged | Delete saved value |
| `resetAll()` | Reset to declared initial value | Delete saved value |

### Hydration behavior

IndexedDB is asynchronous. The first render therefore uses the declared initial
value, then receives the saved value when storage is ready. If the application
calls `set()` before that read finishes, Restate keeps the newer in-memory value
instead of overwriting it. An explicit later `restore()` always applies storage.

On a server where IndexedDB does not exist, creation and server rendering remain
safe: `ready` resolves with the initial value and `status().available` is
`false`. An explicit `save()` or `restore()` reports that storage is unavailable.

### Status and persistence events

```ts
const stop = useSession.on('*', (event) => {
  // change, initialize, ready, save, restore, reset, clearStorage, error, ...
  console.log(event.type, event.value);
});

useSession.status();
// {
//   ready, operation, available, error,
//   lastSavedAt, lastRestoredAt
// }

stop();
```

`subscribe()` receives state changes. `on()` receives named lifecycle and
management events. Both return idempotent cleanup functions.

### Versioning and migrations

Values use JSON serialization by default. JSON limitations apply to values such
as functions, cyclic objects, and class instances. Provide a serializer when a
different representation is needed:

```ts
const usePreferences = persistedRestate(
  { theme: 'system' },
  {
    key: 'preferences',
    version: 2,
    migrate(value, storedVersion) {
      if (storedVersion < 2) return { theme: 'system' };
      return value as { theme: string };
    },
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
  },
);
```

Migrations are applied in memory during restore. Call `save()` when the migrated
representation should replace the stored record.

### Custom storage

A custom adapter can replace the platform default:

```ts
const storage = {
  async getItem(key: string) {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    localStorage.removeItem(key);
  },
};

const useDraft = persistedRestate('', { key: 'draft', storage });
```

Adapters always exchange strings and may implement their methods synchronously
or asynchronously.

## Manage all stores

`restateManager` tracks stores created in the current JavaScript runtime:

```ts
import { restateManager } from '@ryujaewan/restate';

restateManager.list();
restateManager.get('session'); // persistent key or generated store id
restateManager.resetAll();

await restateManager.saveAll();
await restateManager.restoreAll();
await restateManager.clearStorageAll();
await restateManager.resetAllAndClearStorage();
```

Only persistent stores participate in storage operations. Memory stores still
participate in reset operations. `restateManager.subscribe(listener)` reports
registration and bulk-operation events.

## External sources and lifecycle

An optional updater starts with the first subscriber and cleans up after the
last subscriber leaves:

```tsx
type Message = { id: string; body: string };

const useMessages = restate<Message[]>([], ({ getState, setState }) => {
  const socket = new WebSocket('wss://example.com/messages');

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data) as Message;
    setState((current) => [...current, message]);
  });

  return () => socket.close();
});
```

`start()` and `stop()` can manage the updater explicitly. `destroy()` removes a
store from the manager, releases the updater, and clears every listener.

## API reference

### `restate(initialValue, updater?)`

Returns a callable store with:

- `useStore()`
- `get()` / `getInitial()`
- `set(valueOrUpdater)` / `reset()`
- `subscribe(listener)` / `on(event, listener)` / `listenerCount(event?)`
- `start()` / `stop()` / `isRunning()` / `destroy()`

### `persistedRestate(initialValue, options)`

Adds:

- `ready` / `initialize()` / `status()`
- `save()` / `restore()` / `hasSaved()`
- `clearStorage()` / `remove()` / `resetAll()`
- `key` / `storageKey` / `storage`

Required option: `key`. Optional settings include `namespace`, `storage`,
`storageOptions`, `updater`, `serializer`, `version`, and `migrate`.

### Storage factories

`createIndexedDBStorage(options?)` and `createMMKVStorage(options?)` are exported
for custom adapter reuse and testing. Normally `persistedRestate` selects one
automatically.

## Server rendering

The hook uses `useSyncExternalStore`'s server snapshot. A module-level store is
shared by every request in the same server process; create request-specific or
sensitive state within your application's request boundary.

## Migrating from 2.x

Version 3 intentionally removes ambiguous update policy and setter behavior:

- Remove `updateOn`, `updateOnTypes`, `memoCheck`, and hook arguments.
- Functional setters now use React's direct `(currentValue) => nextValue` form.
  Replace legacy `({ value }) => nextValue` callbacks.
- Equal snapshots according to `Object.is` are not broadcast. Use immutable
  updates for objects and arrays.
- Package entry points now explicitly support ESM, CommonJS, TypeScript, Metro,
  and legacy `@ryujaewan/restate/index.js` imports.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md)
for the local workflow and project principles.

The release builder intentionally produces readable JavaScript with embedded
source content in its source maps. Its validation fails if minification or known
obfuscation output appears in an ESM, CommonJS, or React Native artifact.

## License

[ISC](./LICENSE) © ryujaewan
