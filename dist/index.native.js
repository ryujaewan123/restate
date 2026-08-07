/* @ryujaewan/restate v3.0.1 | ISC License */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../restate@original/src/index.native.js
var index_native_exports = {};
__export(index_native_exports, {
  createIndexedDBStorage: () => createIndexedDBStorage,
  createMMKVStorage: () => createMMKVStorage,
  persistedRestate: () => persistedRestate,
  restate: () => restate,
  restateManager: () => restateManager
});
module.exports = __toCommonJS(index_native_exports);

// ../restate@original/src/core.js
var _a;
var sameValue = (_a = Object.is) != null ? _a : ((left, right) => left === right ? left !== 0 || 1 / left === 1 / right : left !== left && right !== right);
var nextStoreId = 1;
function callListeners(listeners2, args) {
  let firstError;
  for (const listener of Array.from(listeners2)) {
    if (!listeners2.has(listener)) continue;
    try {
      listener(...args);
    } catch (error) {
      firstError != null ? firstError : firstError = error;
    }
  }
  if (firstError) throw firstError;
}
function createStore(initialValue, updater) {
  if (updater != null && typeof updater !== "function") {
    throw new TypeError("The updater must be a function when provided.");
  }
  const subscribers = /* @__PURE__ */ new Set();
  const eventListeners = /* @__PURE__ */ new Map();
  const destroyListeners = /* @__PURE__ */ new Set();
  const notificationQueue = [];
  const id = `restate:${nextStoreId++}`;
  let stateValue = initialValue;
  let revision = 0;
  let destroyed = false;
  let updaterRunning = false;
  let updaterCleanup;
  let manuallyStarted = false;
  let eventTarget;
  let flushingNotifications = false;
  function assertActive() {
    if (destroyed) throw new Error(`Restate store "${id}" has been destroyed.`);
  }
  function getEventListeners(type) {
    let listeners2 = eventListeners.get(type);
    if (!listeners2) {
      listeners2 = /* @__PURE__ */ new Set();
      eventListeners.set(type, listeners2);
    }
    return listeners2;
  }
  function emit2(type, details = {}) {
    const event = Object.freeze(__spreadValues({
      type,
      store: eventTarget != null ? eventTarget : publicStore,
      value: stateValue,
      previousValue: stateValue,
      timestamp: Date.now()
    }, details));
    const listeners2 = eventListeners.get(type);
    const wildcardListeners = eventListeners.get("*");
    let firstError;
    if (listeners2) {
      try {
        callListeners(listeners2, [event]);
      } catch (error) {
        firstError != null ? firstError : firstError = error;
      }
    }
    if (wildcardListeners) {
      try {
        callListeners(wildcardListeners, [event]);
      } catch (error) {
        firstError != null ? firstError : firstError = error;
      }
    }
    if (firstError) throw firstError;
    return event;
  }
  function publishState(previousValue, nextValue, action, details) {
    const event = Object.freeze(__spreadValues({
      type: "change",
      action,
      store: eventTarget != null ? eventTarget : publicStore,
      value: nextValue,
      previousValue,
      revision,
      timestamp: Date.now()
    }, details));
    notificationQueue.push(event);
    if (flushingNotifications) return;
    flushingNotifications = true;
    let firstError;
    let queueIndex = 0;
    try {
      while (queueIndex < notificationQueue.length) {
        const queuedEvent = notificationQueue[queueIndex++];
        try {
          callListeners(subscribers, [
            queuedEvent.value,
            queuedEvent.previousValue,
            queuedEvent
          ]);
        } catch (error) {
          firstError != null ? firstError : firstError = error;
        }
        const changeListeners = eventListeners.get("change");
        if (changeListeners) {
          try {
            callListeners(changeListeners, [queuedEvent]);
          } catch (error) {
            firstError != null ? firstError : firstError = error;
          }
        }
        const wildcardListeners = eventListeners.get("*");
        if (wildcardListeners) {
          try {
            callListeners(wildcardListeners, [queuedEvent]);
          } catch (error) {
            firstError != null ? firstError : firstError = error;
          }
        }
      }
    } finally {
      notificationQueue.length = 0;
      flushingNotifications = false;
    }
    if (firstError) throw firstError;
  }
  function replace(update, action = "set", details = {}) {
    assertActive();
    const previousValue = stateValue;
    const nextValue = typeof update === "function" ? update(previousValue) : update;
    const changed = !sameValue(previousValue, nextValue);
    if (changed) {
      stateValue = nextValue;
      revision += 1;
      publishState(previousValue, nextValue, action, details);
    }
    if (action !== "set") {
      emit2(action, __spreadValues({
        value: stateValue,
        previousValue,
        changed,
        revision
      }, details));
    }
    return stateValue;
  }
  function set(update) {
    replace(update, "set");
  }
  function reset() {
    return replace(initialValue, "reset");
  }
  function shouldRunUpdater() {
    return manuallyStarted || subscribers.size > 0;
  }
  function startUpdaterIfNeeded() {
    if (updaterRunning || !shouldRunUpdater() || typeof updater !== "function" || destroyed) return;
    updaterRunning = true;
    try {
      const cleanup = updater({
        getState: () => stateValue,
        setState: set,
        value: stateValue
      });
      updaterCleanup = typeof cleanup === "function" ? cleanup : void 0;
      emit2("start");
    } catch (error) {
      updaterRunning = false;
      updaterCleanup = void 0;
      throw error;
    }
  }
  function stopUpdaterIfNeeded(force = false) {
    if (!updaterRunning || !force && shouldRunUpdater()) return;
    updaterRunning = false;
    const cleanup = updaterCleanup;
    updaterCleanup = void 0;
    cleanup == null ? void 0 : cleanup();
    if (!destroyed) emit2("stop");
  }
  function subscribe(listener) {
    assertActive();
    if (typeof listener !== "function") {
      throw new TypeError("The subscriber must be a function.");
    }
    subscribers.add(listener);
    try {
      startUpdaterIfNeeded();
    } catch (error) {
      subscribers.delete(listener);
      throw error;
    }
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      subscribers.delete(listener);
      stopUpdaterIfNeeded();
    };
  }
  function on(type, listener) {
    assertActive();
    if (typeof type !== "string" || type.length === 0) {
      throw new TypeError("The event type must be a non-empty string.");
    }
    if (typeof listener !== "function") {
      throw new TypeError("The event listener must be a function.");
    }
    const listeners2 = getEventListeners(type);
    listeners2.add(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      listeners2.delete(listener);
      if (listeners2.size === 0) eventListeners.delete(type);
    };
  }
  function start() {
    assertActive();
    manuallyStarted = true;
    startUpdaterIfNeeded();
  }
  function stop() {
    if (destroyed) return;
    manuallyStarted = false;
    stopUpdaterIfNeeded();
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    manuallyStarted = false;
    stopUpdaterIfNeeded(true);
    subscribers.clear();
    eventListeners.clear();
    for (const listener of Array.from(destroyListeners)) listener();
    destroyListeners.clear();
  }
  const publicStore = {
    id,
    get: () => stateValue,
    getInitial: () => initialValue,
    getRevision: () => revision,
    isDestroyed: () => destroyed,
    isRunning: () => updaterRunning,
    listenerCount: (type) => {
      var _a3, _b;
      return type == null ? subscribers.size : (_b = (_a3 = eventListeners.get(type)) == null ? void 0 : _a3.size) != null ? _b : 0;
    },
    set,
    reset,
    replace,
    subscribe,
    on,
    emit: emit2,
    start,
    stop,
    destroy,
    addDestroyListener(listener) {
      destroyListeners.add(listener);
      return () => destroyListeners.delete(listener);
    },
    setEventTarget(target) {
      eventTarget = target;
    }
  };
  return publicStore;
}

// ../restate@original/src/react.js
var React2 = __toESM(require("react"), 1);

// ../restate@original/src/registry.js
var stores = /* @__PURE__ */ new Set();
var listeners = /* @__PURE__ */ new Set();
function emit(type, details = {}) {
  const event = Object.freeze(__spreadValues({ type, timestamp: Date.now() }, details));
  let firstError;
  for (const listener of Array.from(listeners)) {
    if (!listeners.has(listener)) continue;
    try {
      listener(event);
    } catch (error) {
      firstError != null ? firstError : firstError = error;
    }
  }
  if (firstError) throw firstError;
}
function registerStore(store) {
  stores.add(store);
  store.__removeFromRegistry = () => {
    if (!stores.delete(store)) return;
    emit("unregister", { store });
  };
  try {
    emit("register", { store });
  } catch (error) {
    stores.delete(store);
    delete store.__removeFromRegistry;
    throw error;
  }
  return store;
}
function persistentStores() {
  return Array.from(stores).filter((store) => store.kind === "persistent");
}
async function runAll(type, selectedStores, operation) {
  emit(`${type}:start`, { stores: selectedStores });
  try {
    const results = await Promise.all(selectedStores.map(operation));
    emit(`${type}:complete`, { stores: selectedStores, results });
    return results;
  } catch (error) {
    emit(`${type}:error`, { stores: selectedStores, error });
    throw error;
  }
}
var restateManager = Object.freeze({
  list() {
    return Array.from(stores);
  },
  get(id) {
    return Array.from(stores).find((store) => store.id === id || store.key === id);
  },
  size() {
    return stores.size;
  },
  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("The manager listener must be a function.");
    }
    listeners.add(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      listeners.delete(listener);
    };
  },
  resetAll() {
    const selectedStores = Array.from(stores);
    const values = selectedStores.map((store) => store.reset());
    emit("resetAll", { stores: selectedStores, values });
    return values;
  },
  saveAll() {
    const selectedStores = persistentStores();
    return runAll("saveAll", selectedStores, (store) => store.save());
  },
  restoreAll() {
    const selectedStores = persistentStores();
    return runAll("restoreAll", selectedStores, (store) => store.restore());
  },
  clearStorageAll() {
    const selectedStores = persistentStores();
    return runAll("clearStorageAll", selectedStores, (store) => store.clearStorage());
  },
  resetAllAndClearStorage() {
    const selectedStores = Array.from(stores);
    return runAll(
      "resetAllAndClearStorage",
      selectedStores,
      (store) => store.kind === "persistent" ? store.resetAll() : Promise.resolve(store.reset())
    );
  },
  destroyAll() {
    const selectedStores = Array.from(stores);
    selectedStores.forEach((store) => store.destroy());
    emit("destroyAll", { stores: selectedStores });
  }
});

// ../restate@original/src/external-store-hook.js
var React = __toESM(require("react"), 1);
var _a2;
var sameValue2 = (_a2 = Object.is) != null ? _a2 : ((left, right) => left === right ? left !== 0 || 1 / left === 1 / right : left !== left && right !== right);
var isReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";
var canUseLayoutEffect = typeof window !== "undefined" || isReactNative;
var useIsomorphicLayoutEffect = canUseLayoutEffect ? React.useLayoutEffect : React.useEffect;
function snapshotChanged(instance) {
  try {
    return !sameValue2(instance.value, instance.getSnapshot());
  } catch (e) {
    return true;
  }
}
function useSyncExternalStoreFallback(subscribe, getSnapshot, getServerSnapshot) {
  const isServer = typeof window === "undefined" && !isReactNative;
  const value = isServer && typeof getServerSnapshot === "function" ? getServerSnapshot() : getSnapshot();
  const [{ instance }, forceUpdate] = React.useState(() => ({
    instance: { value, getSnapshot }
  }));
  useIsomorphicLayoutEffect(() => {
    instance.value = value;
    instance.getSnapshot = getSnapshot;
    if (snapshotChanged(instance)) forceUpdate({ instance });
  }, [getSnapshot, value]);
  React.useEffect(() => {
    if (snapshotChanged(instance)) forceUpdate({ instance });
    return subscribe(() => {
      if (snapshotChanged(instance)) forceUpdate({ instance });
    });
  }, [subscribe]);
  React.useDebugValue(value);
  return value;
}
function useSyncExternalStore2(subscribe, getSnapshot, getServerSnapshot) {
  const nativeHook = React.useSyncExternalStore;
  if (typeof nativeHook === "function") {
    return nativeHook(subscribe, getSnapshot, getServerSnapshot);
  }
  return useSyncExternalStoreFallback(subscribe, getSnapshot, getServerSnapshot);
}

// ../restate@original/src/react.js
function createRestateApi(store, kind = "memory") {
  function useRestate() {
    const snapshot = useSyncExternalStore2(
      store.subscribe,
      store.get,
      store.get
    );
    React2.useDebugValue(snapshot);
    return snapshot;
  }
  Object.assign(useRestate, {
    id: store.id,
    kind,
    get: store.get,
    getInitial: store.getInitial,
    set: store.set,
    reset: store.reset,
    subscribe: store.subscribe,
    on: store.on,
    listenerCount: store.listenerCount,
    isRunning: store.isRunning,
    start: store.start,
    stop: store.stop,
    destroy() {
      var _a3;
      try {
        (_a3 = useRestate.__removeFromRegistry) == null ? void 0 : _a3.call(useRestate);
      } finally {
        store.destroy();
      }
    },
    __store: store
  });
  store.setEventTarget(useRestate);
  return useRestate;
}
function restate(initialValue, updater) {
  const store = createStore(initialValue, updater);
  return registerStore(createRestateApi(store));
}

// ../restate@original/src/persist.js
var defaultSerializer = Object.freeze({
  serialize(value) {
    const serialized = JSON.stringify(value);
    if (serialized === void 0) {
      throw new TypeError("The current Restate value is not JSON-serializable.");
    }
    return serialized;
  },
  deserialize(value) {
    return JSON.parse(value);
  }
});
function validateStorage(storage) {
  for (const method of ["getItem", "setItem", "removeItem"]) {
    if (typeof (storage == null ? void 0 : storage[method]) !== "function") {
      throw new TypeError(`The storage adapter must implement ${method}().`);
    }
  }
  return storage;
}
function createCodec(options) {
  var _a3, _b;
  const serializer = (_a3 = options.serializer) != null ? _a3 : defaultSerializer;
  if (typeof serializer.serialize !== "function" || typeof serializer.deserialize !== "function") {
    throw new TypeError("serializer must implement serialize() and deserialize().");
  }
  const currentVersion = (_b = options.version) != null ? _b : 1;
  if (!Number.isInteger(currentVersion) || currentVersion < 1) {
    throw new TypeError("version must be a positive integer.");
  }
  return {
    encode(value) {
      const data = serializer.serialize(value);
      if (typeof data !== "string") {
        throw new TypeError("serializer.serialize() must return a string.");
      }
      return JSON.stringify({ __restate: 1, version: currentVersion, data });
    },
    decode(serialized) {
      const record = JSON.parse(serialized);
      let storedVersion = 0;
      let value;
      if (record && record.__restate === 1 && typeof record.data === "string") {
        storedVersion = Number.isInteger(record.version) ? record.version : 0;
        value = serializer.deserialize(record.data);
      } else {
        value = serializer.deserialize(serialized);
      }
      if (storedVersion !== currentVersion && typeof options.migrate === "function") {
        value = options.migrate(value, storedVersion, currentVersion);
      }
      return { value, storedVersion };
    }
  };
}
function createPersistedRestate(initialValue, options, defaultStorageFactory) {
  var _a3, _b;
  if (!options || typeof options !== "object") {
    throw new TypeError("persistedRestate requires an options object with a storage key.");
  }
  if (typeof options.key !== "string" || options.key.trim().length === 0) {
    throw new TypeError("persistedRestate requires a non-empty key.");
  }
  const logicalKey = options.key.trim();
  const namespace = (_a3 = options.namespace) != null ? _a3 : "@ryujaewan/restate";
  const storageKey = namespace ? `${namespace}:${logicalKey}` : logicalKey;
  const storage = validateStorage(
    (_b = options.storage) != null ? _b : defaultStorageFactory(options.storageOptions)
  );
  const codec = createCodec(options);
  const store = createStore(initialValue, options.updater);
  const api = createRestateApi(store, "persistent");
  let ready = false;
  let initializationPromise;
  let operationChain = Promise.resolve();
  let currentOperation = null;
  let lastError = null;
  let lastSavedAt = null;
  let lastRestoredAt = null;
  function storageIsAvailable() {
    return typeof storage.isAvailable === "function" ? storage.isAvailable() : true;
  }
  function emit2(type, details = {}) {
    store.emit(type, __spreadValues({ key: logicalKey, storageKey, store: api }, details));
  }
  function reportError(error, operation) {
    lastError = error;
    try {
      emit2("error", { error, operation });
    } catch (e) {
    }
  }
  function enqueue(operation, task) {
    const promise = operationChain.catch(() => void 0).then(async () => {
      if (store.isDestroyed()) {
        throw new Error(`Restate store "${api.id}" has been destroyed.`);
      }
      currentOperation = operation;
      try {
        return await task();
      } catch (error) {
        reportError(error, operation);
        throw error;
      } finally {
        currentOperation = null;
      }
    });
    operationChain = promise;
    return promise;
  }
  async function readSavedValue() {
    const serialized = await storage.getItem(storageKey);
    if (serialized == null) return { found: false };
    if (typeof serialized !== "string") {
      throw new TypeError("The storage adapter returned a non-string value.");
    }
    return __spreadValues({ found: true }, codec.decode(serialized));
  }
  function initialize() {
    if (initializationPromise) return initializationPromise;
    const startingRevision = store.getRevision();
    initializationPromise = enqueue("initialize", async () => {
      emit2("initialize");
      if (!storageIsAvailable()) {
        ready = true;
        emit2("ready", { available: false, restored: false });
        return store.get();
      }
      const saved = await readSavedValue();
      let restored = false;
      let skipped = false;
      if (saved.found) {
        if (store.getRevision() === startingRevision) {
          store.replace(saved.value, "restore", {
            automatic: true,
            storedVersion: saved.storedVersion
          });
          lastRestoredAt = Date.now();
          restored = true;
        } else {
          skipped = true;
        }
      }
      ready = true;
      emit2("ready", { available: true, restored, skipped });
      return store.get();
    }).catch((error) => {
      ready = true;
      emit2("ready", { available: storageIsAvailable(), restored: false, error });
      return store.get();
    });
    return initializationPromise;
  }
  function save() {
    const value = store.get();
    let serialized;
    try {
      serialized = codec.encode(value);
    } catch (error) {
      reportError(error, "save");
      return Promise.reject(error);
    }
    return enqueue("save", async () => {
      if (!storageIsAvailable()) {
        throw new Error("Persistent storage is unavailable in this environment.");
      }
      await storage.setItem(storageKey, serialized);
      lastSavedAt = Date.now();
      emit2("save", { savedValue: value });
      return value;
    });
  }
  function restore() {
    return enqueue("restore", async () => {
      if (!storageIsAvailable()) {
        throw new Error("Persistent storage is unavailable in this environment.");
      }
      const saved = await readSavedValue();
      const value = saved.found ? saved.value : store.getInitial();
      store.replace(value, "restore", {
        automatic: false,
        found: saved.found,
        storedVersion: saved.storedVersion
      });
      lastRestoredAt = Date.now();
      return store.get();
    });
  }
  function hasSaved() {
    return enqueue("hasSaved", async () => {
      if (!storageIsAvailable()) return false;
      return await storage.getItem(storageKey) != null;
    });
  }
  function clearStorage() {
    return enqueue("clearStorage", async () => {
      if (!storageIsAvailable()) return false;
      await storage.removeItem(storageKey);
      emit2("clearStorage");
      return true;
    });
  }
  function resetAll() {
    const value = api.reset();
    return clearStorage().then(() => value);
  }
  Object.assign(api, {
    key: logicalKey,
    storageKey,
    storage,
    initialize,
    save,
    restore,
    hasSaved,
    clearStorage,
    remove: clearStorage,
    resetAll,
    status() {
      return Object.freeze({
        ready,
        operation: currentOperation,
        available: storageIsAvailable(),
        error: lastError,
        lastSavedAt,
        lastRestoredAt
      });
    }
  });
  api.ready = initialize();
  return registerStore(api);
}

// ../restate@original/src/storage/indexeddb.js
var databaseCaches = /* @__PURE__ */ new WeakMap();
function getDefaultFactory() {
  return typeof indexedDB === "undefined" ? void 0 : indexedDB;
}
function getDatabaseCache(factory) {
  let cache = databaseCaches.get(factory);
  if (!cache) {
    cache = /* @__PURE__ */ new Map();
    databaseCaches.set(factory, cache);
  }
  return cache;
}
function openDatabase(factory, databaseName, storeName, version) {
  const cache = getDatabaseCache(factory);
  const cacheKey = `${databaseName}:${version}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const promise = new Promise((resolve, reject) => {
    const request = factory.open(databaseName, version);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.close();
        reject(new Error(
          `IndexedDB store "${storeName}" is missing. Increase the database version to create it.`
        ));
        return;
      }
      database.onversionchange = () => {
        database.close();
        cache.delete(cacheKey);
      };
      resolve(database);
    };
    request.onerror = () => {
      var _a3;
      return reject((_a3 = request.error) != null ? _a3 : new Error("Failed to open IndexedDB."));
    };
    request.onblocked = () => reject(new Error(
      `IndexedDB database "${databaseName}" is blocked by another open connection.`
    ));
  }).catch((error) => {
    cache.delete(cacheKey);
    throw error;
  });
  cache.set(cacheKey, promise);
  return promise;
}
function runTransaction(database, storeName, mode, operation) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const objectStore = transaction.objectStore(storeName);
    let result;
    let request;
    try {
      request = operation(objectStore);
    } catch (error) {
      transaction.abort();
      reject(error);
      return;
    }
    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => {
        var _a3;
        return reject(
          (_a3 = request.error) != null ? _a3 : new Error("IndexedDB request failed.")
        );
      };
    }
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => {
      var _a3;
      return reject(
        (_a3 = transaction.error) != null ? _a3 : new Error("IndexedDB transaction failed.")
      );
    };
    transaction.onabort = () => {
      var _a3;
      return reject(
        (_a3 = transaction.error) != null ? _a3 : new Error("IndexedDB transaction was aborted.")
      );
    };
  });
}
function createIndexedDBStorage(options = {}) {
  var _a3, _b, _c;
  const databaseName = (_a3 = options.databaseName) != null ? _a3 : "@ryujaewan/restate";
  const storeName = (_b = options.storeName) != null ? _b : "states";
  const version = (_c = options.version) != null ? _c : 1;
  const configuredFactory = options.indexedDB;
  function getFactory() {
    return configuredFactory != null ? configuredFactory : getDefaultFactory();
  }
  async function getDatabase() {
    const factory = getFactory();
    if (!factory) {
      throw new Error("IndexedDB is unavailable in this environment.");
    }
    return openDatabase(factory, databaseName, storeName, version);
  }
  return Object.freeze({
    kind: "indexeddb",
    isAvailable: () => Boolean(getFactory()),
    async getItem(key) {
      const database = await getDatabase();
      const value = await runTransaction(
        database,
        storeName,
        "readonly",
        (store) => store.get(key)
      );
      return value === void 0 ? null : value;
    },
    async setItem(key, value) {
      const database = await getDatabase();
      await runTransaction(
        database,
        storeName,
        "readwrite",
        (store) => store.put(value, key)
      );
    },
    async removeItem(key) {
      const database = await getDatabase();
      await runTransaction(
        database,
        storeName,
        "readwrite",
        (store) => store.delete(key)
      );
    },
    async clear() {
      const database = await getDatabase();
      await runTransaction(
        database,
        storeName,
        "readwrite",
        (store) => store.clear()
      );
    }
  });
}

// ../restate@original/src/storage/mmkv.js
function loadMMKVModule() {
  try {
    return require("react-native-mmkv");
  } catch (error) {
    const missingModuleError = new Error(
      "persistedRestate on React Native requires react-native-mmkv. Install the native module and complete its platform build setup."
    );
    missingModuleError.cause = error;
    throw missingModuleError;
  }
}
function createMMKVInstance(options) {
  var _a3, _b;
  if (options.mmkv) return options.mmkv;
  const mmkvModule = (_a3 = options.mmkvModule) != null ? _a3 : loadMMKVModule();
  const configuration = (_b = options.configuration) != null ? _b : options.id == null ? void 0 : { id: options.id };
  if (typeof mmkvModule.createMMKV === "function") {
    return mmkvModule.createMMKV(configuration);
  }
  if (typeof mmkvModule.MMKV === "function") {
    return new mmkvModule.MMKV(configuration);
  }
  throw new TypeError("The installed react-native-mmkv package has no supported factory.");
}
function createMMKVStorage(options = {}) {
  const mmkv = createMMKVInstance(options);
  return Object.freeze({
    kind: "mmkv",
    isAvailable: () => true,
    getItem(key) {
      var _a3;
      return (_a3 = mmkv.getString(key)) != null ? _a3 : null;
    },
    setItem(key, value) {
      mmkv.set(key, value);
    },
    removeItem(key) {
      if (typeof mmkv.remove === "function") {
        mmkv.remove(key);
        return;
      }
      if (typeof mmkv.delete === "function") {
        mmkv.delete(key);
        return;
      }
      throw new TypeError("The installed MMKV instance cannot remove values.");
    },
    clear() {
      mmkv.clearAll();
    }
  });
}

// ../restate@original/src/index.native.js
function persistedRestate(initialValue, options) {
  return createPersistedRestate(initialValue, options, createMMKVStorage);
}
//# sourceMappingURL=index.native.js.map
