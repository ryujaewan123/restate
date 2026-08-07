export type Awaitable<T> = T | Promise<T>;
export type RestateSetStateAction<T> = T | ((previousValue: T) => T);
export type RestateKind = 'memory' | 'persistent';
export type RestateAction = 'set' | 'reset' | 'restore';
export type RestateEventType =
    | 'change'
    | 'reset'
    | 'restore'
    | 'start'
    | 'stop'
    | 'initialize'
    | 'ready'
    | 'save'
    | 'clearStorage'
    | 'error'
    | '*';

export interface UpdaterProps<T> {
    getState(): T;
    setState(value: RestateSetStateAction<T>): void;
    /** The value captured when the updater starts. Use getState() for the latest value. */
    value: T;
}

export type UpdaterFunction<T> = (props: UpdaterProps<T>) => (() => void) | void;

export interface RestateEvent<T> {
    readonly type: string;
    readonly action?: RestateAction;
    readonly store: UseRestateFn<T>;
    readonly value: T;
    readonly previousValue: T;
    readonly revision?: number;
    readonly changed?: boolean;
    readonly timestamp: number;
    readonly key?: string;
    readonly storageKey?: string;
    readonly error?: unknown;
    readonly [detail: string]: unknown;
}

export type RestateListener<T> = (
    value: T,
    previousValue: T,
    event: RestateEvent<T>
) => void;
export type RestateEventListener<T> = (event: RestateEvent<T>) => void;

export interface UseRestateFn<T> {
    (): T;
    readonly id: string;
    readonly kind: RestateKind;
    get(): T;
    getInitial(): T;
    set(value: RestateSetStateAction<T>): void;
    reset(): T;
    subscribe(listener: RestateListener<T>): () => void;
    on(type: RestateEventType | (string & {}), listener: RestateEventListener<T>): () => void;
    listenerCount(type?: string): number;
    isRunning(): boolean;
    start(): void;
    stop(): void;
    destroy(): void;
}

export interface RestateStorage {
    readonly kind?: string;
    isAvailable?(): boolean;
    getItem(key: string): Awaitable<string | null>;
    setItem(key: string, value: string): Awaitable<void>;
    removeItem(key: string): Awaitable<void>;
    clear?(): Awaitable<void>;
}

export interface RestateSerializer<T> {
    serialize(value: T): string;
    deserialize(value: string): T;
}

export interface IndexedDBStorageOptions {
    databaseName?: string;
    storeName?: string;
    version?: number;
    /** Custom IDBFactory-compatible value, primarily for non-browser runtimes and tests. */
    indexedDB?: any;
}

export interface MMKVLike {
    getString(key: string): string | undefined;
    set(key: string, value: string): void;
    remove?(key: string): void;
    delete?(key: string): void;
    clearAll(): void;
}

export interface MMKVStorageOptions {
    /** Reuse an existing MMKV instance instead of creating one. */
    mmkv?: MMKVLike;
    /** Inject the react-native-mmkv module, primarily for tests. */
    mmkvModule?: {
        createMMKV?(configuration?: Record<string, unknown>): MMKVLike;
        MMKV?: new (configuration?: Record<string, unknown>) => MMKVLike;
    };
    configuration?: Record<string, unknown>;
    id?: string;
}

export interface PersistedRestateOptions<T> {
    key: string;
    /** Defaults to "@ryujaewan/restate". Use an empty string to disable namespacing. */
    namespace?: string;
    updater?: UpdaterFunction<T>;
    /** Overrides the platform default (IndexedDB on web, MMKV on React Native). */
    storage?: RestateStorage;
    storageOptions?: IndexedDBStorageOptions | MMKVStorageOptions;
    serializer?: RestateSerializer<T>;
    version?: number;
    migrate?(value: unknown, storedVersion: number, currentVersion: number): T;
}

export interface PersistedRestateStatus {
    readonly ready: boolean;
    readonly operation: string | null;
    readonly available: boolean;
    readonly error: unknown;
    readonly lastSavedAt: number | null;
    readonly lastRestoredAt: number | null;
}

export interface PersistedRestateFn<T> extends UseRestateFn<T> {
    readonly kind: 'persistent';
    readonly key: string;
    readonly storageKey: string;
    readonly storage: RestateStorage;
    readonly ready: Promise<T>;
    initialize(): Promise<T>;
    save(): Promise<T>;
    restore(): Promise<T>;
    hasSaved(): Promise<boolean>;
    clearStorage(): Promise<boolean>;
    remove(): Promise<boolean>;
    /** Resets memory to the declared initial value and removes the saved value. */
    resetAll(): Promise<T>;
    status(): PersistedRestateStatus;
}

export interface RestateManagerEvent {
    readonly type: string;
    readonly timestamp: number;
    readonly store?: UseRestateFn<unknown>;
    readonly stores?: ReadonlyArray<UseRestateFn<unknown>>;
    readonly error?: unknown;
    readonly [detail: string]: unknown;
}

export interface RestateManager {
    list(): Array<UseRestateFn<any>>;
    get(idOrKey: string): UseRestateFn<any> | undefined;
    size(): number;
    subscribe(listener: (event: RestateManagerEvent) => void): () => void;
    resetAll(): unknown[];
    saveAll(): Promise<unknown[]>;
    restoreAll(): Promise<unknown[]>;
    clearStorageAll(): Promise<unknown[]>;
    resetAllAndClearStorage(): Promise<unknown[]>;
    destroyAll(): void;
}

export declare function restate<T>(
    initialValue: T,
    updater?: UpdaterFunction<T>
): UseRestateFn<T>;

export declare function persistedRestate<T>(
    initialValue: T,
    options: PersistedRestateOptions<T>
): PersistedRestateFn<T>;

export declare function createIndexedDBStorage(
    options?: IndexedDBStorageOptions
): RestateStorage;

export declare function createMMKVStorage(
    options?: MMKVStorageOptions
): RestateStorage;

export declare const restateManager: RestateManager;
