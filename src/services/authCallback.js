import { normalizeInternalRedirect } from '@/services/authProfile.js';

const DEFAULT_MOBILE_SCHEME = 'ekko-vi-shimago-app';

export function getMobileUrlScheme(value = process.env.VUE_APP_MOBILE_URL_SCHEME) {
    const scheme = String(value || DEFAULT_MOBILE_SCHEME)
        .trim()
        .replace(/:\/\/.*$/, '')
        .replace(/:$/, '');
    return scheme || DEFAULT_MOBILE_SCHEME;
}

/** Build the allow-listed Supabase redirect for browser or Capacitor OAuth. */
export function buildAuthCallbackUrl({
    native = false,
    origin = typeof window !== 'undefined' ? window.location.origin : '',
    scheme = getMobileUrlScheme(),
    requestedPath = '/search',
} = {}) {
    const baseUrl = native
        ? `${getMobileUrlScheme(scheme)}://callback/auth`
        : `${String(origin).replace(/\/+$/, '')}/auth/callback`;
    const callbackUrl = new URL(baseUrl);
    const redirect = normalizeInternalRedirect(requestedPath);
    if(redirect !== '/search'){
        callbackUrl.searchParams.set('redirect', redirect);
    }
    return callbackUrl.toString();
}

/** Read both query parameters (PKCE) and fragment parameters (implicit flow). */
export function parseAuthCallbackParameters(callbackUrl) {
    const url = new URL(callbackUrl);
    const parameters = new URLSearchParams(url.search);
    const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
    fragment.forEach((value, key) => {
        if(!parameters.has(key)) parameters.set(key, value);
    });
    return parameters;
}

export function isNativeAuthCallbackUrl(callbackUrl, scheme = getMobileUrlScheme()) {
    try {
        const url = new URL(callbackUrl);
        const legacyPath = url.pathname === '' || url.pathname === '/';
        return url.protocol === `${getMobileUrlScheme(scheme)}:`
            && url.hostname === 'callback'
            && (url.pathname === '/auth' || legacyPath);
    } catch (_error) {
        return false;
    }
}

/** Complete either Supabase's implicit or PKCE OAuth response. */
export async function completeAuthCallback(supabaseClient, callbackUrl) {
    const parameters = parseAuthCallbackParameters(callbackUrl);
    const providerError = parameters.get('error_description') || parameters.get('error');
    if(providerError){
        throw new Error(providerError);
    }

    const accessToken = parameters.get('access_token');
    const refreshToken = parameters.get('refresh_token');
    if(accessToken && refreshToken){
        const { data, error } = await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        if(error) throw error;
        return data?.session || null;
    }

    const code = parameters.get('code');
    if(code){
        const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
        if(error) throw error;
        return data?.session || null;
    }

    // On web, detectSessionInUrl may already have consumed the callback.
    const { data, error } = await supabaseClient.auth.getSession();
    if(error) throw error;
    if(!data?.session) throw new Error('Aucune session reçue après authentification.');
    return data.session;
}
