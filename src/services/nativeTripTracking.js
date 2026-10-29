import { Capacitor, registerPlugin } from '@capacitor/core';
import supabase from '@/utils/supabaseClient.js';
import { App } from '@capacitor/app';
import { getServerUrl, serverRequest } from '@/utils/serverApi.js';
const plugin = registerPlugin('TripTracking');

export function createNativeTripTracking({ bridge, request, revoke, isNative, baseUrl }) {
    let generation = 0, starting = false, installed = false, installation = null;
    let state = { active: false, reason: 'stopped' };
    const observers = new Set();
    const emit = value => { state = { ...state, ...value }; observers.forEach(fn => fn(state)); };
    async function install() {
        if (installed || !isNative()) return;
        if (installation) return installation;
        installation = (async () => {
            const listener = await bridge.addListener('position', position => emit({ position }));
            try { await bridge.addListener('status', value => emit({ ...value, position: value.position || null })); installed = true; }
            catch (error) { await listener?.remove(); throw error; }
        })();
        try { await installation; } finally { installation = null; }
    }
    async function stop() {
        generation++;
        if (isNative()) await bridge.stop();
        emit({ active: false, reason: 'stopped', position: null });
    }
    async function start({ tripId, userId, mode, simulation }) {
        if (!isNative() || simulation || starting) throw new Error('NATIVE_TRACKING_NOT_AVAILABLE');
        const endpoint = `${baseUrl(mode)}/native-tracking/position`;
        if (new URL(endpoint).protocol !== 'https:') throw new Error('Le suivi natif nécessite un serveur HTTPS joignable depuis le téléphone.');
        starting = true; const epoch = ++generation; let session;
        try {
            await install(); await bridge.stop();
            if (epoch !== generation) return false;
            const response = await request('post', '/native-tracking/session', { mode, data: { tripId } });
            session = response.data.data;
            if (epoch !== generation || session.userId !== userId || Number(session.tripId) !== Number(tripId)) { await revoke(endpoint, session.token); return false; }
            await bridge.start({ ...session, endpoint });
            if (epoch !== generation) { await bridge.stop(); return false; }
            const current = await bridge.getStatus();
            if (epoch !== generation) { await bridge.stop(); return false; }
            if (!current.active) throw new Error('Le service de suivi ne fonctionne pas. Réessayez depuis le trajet.');
            emit(current); return true;
        } catch (error) {
            if (session) { await bridge.stop().catch(() => {}); await revoke(endpoint, session.token).catch(() => {}); }
            emit({ active: false, reason: 'unavailable', position: null }); throw error;
        } finally { starting = false; session = null; }
    }
    async function restore(userId, tripId) {
        if (!isNative()) return state;
        await install(); const current = await bridge.getStatus();
        if (current.active && (current.userId !== userId || Number(current.tripId) !== Number(tripId))) { await stop(); return state; }
        emit({ ...current, position: current.position || null }); return state;
    }
    return { start, stop, restore, observe(fn) { observers.add(fn); fn(state); return () => observers.delete(fn); }, status: () => state };
}
export const nativeTripTracking = createNativeTripTracking({
    bridge: plugin, request: serverRequest, isNative: () => Capacitor.isNativePlatform(), baseUrl: getServerUrl,
    revoke: async (endpoint, token) => { await fetch(endpoint.replace(/\/position$/, '/session'), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error' }); },
});
let lifecycleInstalled = false;
export function installNativeTrackingLifecycle() {
    if (lifecycleInstalled || !Capacitor.isNativePlatform()) return;
    lifecycleInstalled = true;
    // Survives map navigation; scoped credential is held by native code only.
    supabase.auth.onAuthStateChange((event, session) => {
        const state = nativeTripTracking.status();
        if (event === 'SIGNED_OUT' || (state.active && session?.user?.id !== state.userId)) nativeTripTracking.stop().catch(() => {});
    });
    App.addListener('appStateChange', ({ isActive }) => {
        const state = nativeTripTracking.status();
        if (isActive && state.userId && state.tripId) nativeTripTracking.restore(state.userId, state.tripId).catch(() => {});
    });
}
