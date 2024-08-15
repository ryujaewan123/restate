import { Dispatch, SetStateAction } from 'react';

export type UpdateOnType = 'alwaysUpdate' | 'topLevelChange' | 'anyLevelChange';

export interface RestateOptions {
    updateOn?: UpdateOnType;
}

export interface UpdaterProps<T> {
    setState: Dispatch<SetStateAction<T>>;
    value: T;
}

export interface UpdaterFunction<T> {
    (props: UpdaterProps<T>): (() => void) | void;
}

export type MemoCheckFunction<T> = (prev: T, next: T) => boolean;

export interface UseRestateOptions<T> extends RestateOptions {
    memoCheck?: MemoCheckFunction<T>;
}

export interface UseRestateFn<T> {
    (options?: UseRestateOptions<T> | MemoCheckFunction<T>): [T, Dispatch<SetStateAction<T>>];
    get(): T;
    set(value: T | ((currentValue: T) => T)): void;
}

export declare function restate<T>(
    initialValue: T,
    updater: UpdaterFunction<T>,
    options?: RestateOptions
): UseRestateFn<T>;

export const updateOnTypes: {
    alwaysUpdate: 'alwaysUpdate';
    topLevelChange: 'topLevelChange';
    anyLevelChange: 'anyLevelChange';
};