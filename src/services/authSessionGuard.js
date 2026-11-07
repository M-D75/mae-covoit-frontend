import {AuthRetryableFetchError} from '@supabase/supabase-js';
const clients = new WeakMap();
const transitions = ['signInWithPassword', 'signUp', 'signInWithOAuth', 'signInWithOtp', 'signInWithIdToken',
    'signInWithSSO', 'signInAnonymously', 'verifyOtp', 'setSession', 'exchangeCodeForSession',
    'signOut', 'updateUser', 'refreshSession', 'resetPasswordForEmail'];
export function sessionChanged() {
    // The SDK must not remove credentials while handling a canceled refresh.
    // Application callers consume SESSION_CHANGED without retrying.
    return Object.assign(new AuthRetryableFetchError('Votre session a changé. Rouvrez cet écran.', 0), {code: 'SESSION_CHANGED'});
}
function readSession(value) {
    try {
        const session = JSON.parse(value);
        return session?.user?.id && session?.access_token ? session : null;
    } catch { return null; }
}
/** Coordinate session transitions and protect SDK writes after awaited requests.
 * The storage and fetch adapters must be installed when creating the client.
 * No SDK internals or private methods are replaced.
 */
export function createAuthSessionGuard({storage, fetch: fetcher}) {
    let pending = Promise.resolve(), active = null, sessionKey = null;
    const enqueue = operation => {
        const result = pending.then(operation);
        pending = result.catch(() => undefined);
        return result;
    };
    const storedSession = () => sessionKey ? readSession(storage.getItem(sessionKey)) : null;
    const assertActive = () => {
        if (!active) return;
        const saved = storedSession();
        if (!active.isCurrent() || (saved && saved.user.id !== active.userId)) throw sessionChanged();
    };
    const guardedStorage = {
        getItem(key) {
            const value = storage.getItem(key);
            if (readSession(value)) sessionKey = key;
            return value;
        },
        setItem(key, value) {
            assertActive();
            const next = readSession(value);
            if (active && next && next.user.id !== active.userId) throw sessionChanged();
            if (next) sessionKey = key;
            return storage.setItem(key, value);
        },
        removeItem(key) { assertActive(); return storage.removeItem(key); },
    };
    const guardedFetch = (input, init = {}) => {
        if (active) {
            let url;
            try { url = new URL(typeof input === 'string' ? input : input.url); } catch { /* Delegate invalid URLs. */ }
            const method = String(init.method || input?.method || 'GET').toUpperCase();
            if (url && /\/auth\/v1\//.test(url.pathname) && ['PUT','POST','DELETE','PATCH'].includes(method)) {
                assertActive();
                if (!/\/auth\/v1\/(user|logout)$/.test(url.pathname)) return fetcher(input, init);
                const headers = new Headers(init.headers || input?.headers);
                const token = headers.get('Authorization');
                const saved = storedSession();
                if (token !== `Bearer ${active.token}` && (!saved || token !== `Bearer ${saved.access_token}`)) throw sessionChanged();
            }
        }
        return fetcher(input, init);
    };
    return {
        storage: guardedStorage,
        fetch: guardedFetch,
        attach(client) {
            if (clients.has(client)) return client;
            const original = {};
            for (const name of transitions) {
                if (typeof client.auth[name] !== 'function') continue;
                original[name] = client.auth[name].bind(client.auth);
                client.auth[name] = (...args) => enqueue(() => original[name](...args));
            }
            clients.set(client, async (identity, method, args) => enqueue(async () => {
                if (!identity.userId || !identity.isCurrent()) throw sessionChanged();
                // getSession itself may refresh and write credentials. Bind it too.
                active = {...identity, token:null};
                try {
                    assertActive();
                    const {data, error} = await client.auth.getSession();
                    assertActive();
                    const session = data?.session;
                    if (!session && method === 'signOut') return {error:null};
                    if (error) throw error;
                    if (session?.user?.id !== identity.userId) throw sessionChanged();
                    if (!original[method]) throw new Error('Opération de session indisponible.');
                    active.token = session.access_token;
                    const result = await original[method](...args);
                    assertActive();
                    return result;
                } finally { active = null; }
            }));
            return client;
        },
    };
}
export function runAuthSession(client, identity, method, ...args) {
    const run = clients.get(client);
    if (!run) throw new Error('Protection de session non initialisée.');
    return run(identity, method, args);
}
/** Keep the existing Supabase storage key and fall back to memory if unavailable. */
export function browserSessionStorage() {
    try {
        const storage = window.localStorage;
        const probe = 'covia-storage-probe';
        storage.setItem(probe, '1'); storage.removeItem(probe);
        return storage;
    } catch {
        const items = new Map();
        return {getItem:key => items.get(key) ?? null, setItem:(key,value) => {items.set(key,value);}, removeItem:key => {items.delete(key);}};
    }
}
