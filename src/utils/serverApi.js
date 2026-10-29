import axios from 'axios';
import {getClientHeaders,notifyUpdateRequired} from '@/utils/clientIdentity.js';
import supabase from '@/utils/supabaseClient.js';

const SERVER_URLS = {
    local: process.env.VUE_APP_SERVER_LOCAL_URL || 'http://localhost:3001',
    online: process.env.VUE_APP_SERVER_ONLINE_URL
        || (typeof window !== 'undefined' && window.location?.protocol === 'http:'
            ? 'http://server-mae-covoit-notif.infinityinsights.fr'
            : 'https://server-mae-covoit-notif.infinityinsights.fr'),
};

const DEFAULT_SERVER_MODE = process.env.NODE_ENV === 'production' ? 'online' : 'local';

export function getServerUrl(mode = process.env.VUE_APP_MODE) {
    const selectedMode = mode || DEFAULT_SERVER_MODE;
    if (!SERVER_URLS[selectedMode]) {
        throw new Error(`Mode serveur inconnu : ${selectedMode}`);
    }
    return SERVER_URLS[selectedMode].replace(/\/+$/, '');
}

export async function getAuthenticatedConfig(config = {}) {
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;

    if (error || !accessToken) {
        const authError = new Error('Session invalide ou expirée.');
        authError.code = 'AUTH_REQUIRED';
        throw authError;
    }

    return {
        ...config,
        headers: {
            ...(config.headers || {}),
            ...await getClientHeaders(),
            Authorization: `Bearer ${accessToken}`,
        },
    };
}

/** Give Socket.IO the latest Supabase JWT on every initial connection/retry. */
export function createSocketAuth() {
    return async (callback) => {
        const { data } = await supabase.auth.getSession();
        callback({ token: data?.session?.access_token || '', client:await getClientHeaders() });
    };
}

export async function serverRequest(method, path, options = {}) {
    const {
        mode = process.env.VUE_APP_MODE,
        data,
        params,
        ...config
    } = options;

    const authenticatedConfig = await getAuthenticatedConfig(config);

    try { return await axios({
        timeout: 20000,
        ...authenticatedConfig,
        method,
        url: `${getServerUrl(mode)}${path}`,
        data,
        params,
    }); } catch(error) {if(error.response?.status===426)notifyUpdateRequired(error.response.data?.compatibility);throw error;}
}

export function attachClientVersionListeners(socket){
 socket.on('connect_error',error=>{if(error.data?.compatibility)notifyUpdateRequired(error.data.compatibility);});
 socket.on('client:compatibility',error=>{notifyUpdateRequired(error.compatibility);});
}
