import { createStore } from 'vuex';
import createPersistedState from "vuex-persistedstate";

// modules
import auth from './auth';
import profil from './profil';
import rating from './rating';
import publish from './publish';
import search from './search';
import general from './general';
import trip from './trip';
import notifications from './notifications';

const PERSISTENCE_KEY = 'mae-covoit-v3';
const initialSearch = JSON.parse(JSON.stringify(search.state));
const initialTrip = JSON.parse(JSON.stringify(trip.state));

/**
 * Persist only small preferences and identifiers. Map routes, trips, contacts
 * and API result lists are transient and can easily exceed the browser's
 * localStorage quota.
 */
const resilientStorage = {
    getItem(key) {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
    },
    setItem(key, value) {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // Persistence must never crash navigation. Clear only this cache;
            // the Supabase authentication session uses a separate key.
            window.localStorage.removeItem(key);
            console.warn('Vuex cache skipped because browser storage is full.');
        }
    },
    removeItem(key) {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
        }
    },
};

// The legacy `vuex` key contained full routes, contacts and database results.
// Remove it once when upgrading to the bounded v2 persistence format.
if (typeof window !== 'undefined') {
    window.localStorage.removeItem('vuex');
    window.localStorage.removeItem('mae-covoit-v2');
}

const appStore = createStore({
    modules: {
        auth,
        profil,
        rating,
        publish,
        search,
        general,
        trip,
        notifications,
    },
    plugins: [
        createPersistedState({
            key: PERSISTENCE_KEY,
            storage: resilientStorage,
            paths: [
                'general.isNative',
                'profil.modeDriver',
                'profil.darkMode',
                'profil.preferenceVirementMode',
                'search.communesFrequency',
            ]
        })
    ],
});

let previousUserUid = appStore.state.profil.userUid;
appStore.commit('trip/CLEAR_MESSAGING');
appStore.commit('trip/RESET_RATING_PROMPT');appStore.commit('rating/RESET_RATING_SELECTION');
appStore.subscribe((mutation, state) => {
    if (mutation.type !== 'profil/SET_USER_UID') return;
    if (state.profil.userUid === previousUserUid) return;
    previousUserUid = state.profil.userUid;
    appStore.commit('auth/CLEAR_PAYMENT_PROFILE');
    appStore.commit('notifications/RESET');
    Object.assign(state.search, JSON.parse(JSON.stringify(initialSearch)));
    Object.assign(state.trip, JSON.parse(JSON.stringify(initialTrip)));
});
appStore.watch(state=>state.profil.userUid,()=>{appStore.commit('trip/CLEAR_MESSAGING');appStore.commit('trip/RESET_RATING_PROMPT');appStore.commit('rating/RESET_RATING_SELECTION');appStore.commit('profil/SET_AVATAR_DRAFT',null);appStore.commit('profil/CLEAR_HISTORY');});
export default appStore;
