const AUTH_ENTRY_KEY = 'mae-auth-entry';

/** A device preference only: never use it as proof of authentication. */
export function getDefaultAuthPath(storage) {
    try {
        const preferences = storage || window.localStorage;
        return preferences.getItem(AUTH_ENTRY_KEY) === 'login' ? '/login' : '/sign';
    } catch (_error) {
        return '/sign';
    }
}

export function rememberAuthEntry(storage) {
    try {
        (storage || window.localStorage).setItem(AUTH_ENTRY_KEY, 'login');
    } catch (_error) {
        // Storage can be disabled or full; authentication must still work.
    }
}
