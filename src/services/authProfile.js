/**
 * Read the two independent parts of an application identity:
 * Supabase Auth (`auth.users`) and the business profile (`public.account`).
 */
export async function fetchAuthProfileState(supabaseClient) {
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    const user = userData?.user || null;

    if(userError || !user){
        return {
            authenticated: false,
            user: null,
            account: null,
            profileError: null,
        };
    }

    const { data: account, error: profileError } = await supabaseClient
        .from('account')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

    return {
        authenticated: true,
        user,
        account: account || null,
        profileError: profileError || null,
    };
}

/** Only accept an internal application path as a post-authentication target. */
export function normalizeInternalRedirect(value, fallback = '/search') {
    if(typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')){
        return fallback;
    }

    const forbiddenTargets = ['/login', '/sign', '/auth/callback', '/account-info'];
    const path = value.split('?')[0].split('#')[0];
    return forbiddenTargets.includes(path) ? fallback : value;
}

/** Decide where an authentication callback must finish. */
export function resolvePostAuthPath({ authenticated, hasAccount, requestedPath }) {
    if(!authenticated) return '/login';
    if(!hasAccount) return '/account-info';
    return normalizeInternalRedirect(requestedPath);
}

/**
 * Protect business screens from authenticated users whose profile is missing.
 * `allowMissingAccount` is used only by the profile-completion screen.
 */
export function resolveAuthGuardRedirect({
    requiresAuth,
    allowMissingAccount,
    fullPath,
    requestedPath,
    authenticated,
    hasAccount,
}) {
    if(!requiresAuth) return null;

    if(!authenticated){
        return {
            path: '/login',
            query: fullPath ? { redirect: fullPath } : undefined,
        };
    }

    if(!hasAccount && !allowMissingAccount){
        return {
            path: '/account-info',
            query: fullPath ? { redirect: fullPath } : undefined,
        };
    }

    if(hasAccount && allowMissingAccount){
        return normalizeInternalRedirect(requestedPath);
    }

    return null;
}
