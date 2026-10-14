import { state } from './state.js';

export function getMessage(key, fallback) {
    const parts = String(key || '').split('.');
    const readFrom = source => {
        let cursor = source;
        for (const part of parts) {
            if (cursor == null || cursor[part] == null || cursor[part] === '') return undefined;
            cursor = cursor[part];
        }
        return cursor;
    };
    const current = readFrom(state.activeMessages);
    if (current !== undefined) return current;
    const zhFallback = readFrom(state.fallbackMessages);
    if (zhFallback !== undefined) return zhFallback;
    if (fallback !== undefined) return fallback;
    console.warn(`Missing i18n key: ${key}`);
    return key;
}

export function t(key, vars = {}, fallback) {
    const value = getMessage(key, fallback);
    if (typeof value !== 'string') return fallback !== undefined ? fallback : key;
    return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}
