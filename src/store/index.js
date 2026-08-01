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

const PERSISTENCE_KEY = 'mae-covoit-v2';

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
}

export default createStore({
    modules: {
        auth,
        profil,
        rating,
        publish,
        search,
        general,
        trip,
    },
    plugins: [
        createPersistedState({
            key: PERSISTENCE_KEY,
            storage: resilientStorage,
            paths: [
                'auth.provider',
                'auth.registerDeviceToken',
                'auth.customer_id',
                'general.isNative',
                'profil.cguAccepted',
                'profil.payouts_enabled',
                'profil.auto_accept_trip',
                'profil.identity',
                'profil.profil.infos_perso',
                'profil.notification',
                'profil.modeDriver',
                'profil.darkMode',
                'profil.userId',
                'profil.userUid',
                'profil.userName',
                'profil.autoValidation',
                'profil.avatarUrl',
                'profil.cars',
                'profil.preferenceVirementMode',
                'profil.history.datesTripPassenger',
                'profil.history.datesTripDriver',
                'search.communesFrequency',
                'trip.notMessageVue',
                'trip.ratings.rating',
                'trip.ratings.bookings',
                'trip.ratings.ratedTripIds',
            ]
        })
    ],
});
