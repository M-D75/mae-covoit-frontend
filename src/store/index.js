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
            paths: [
                'auth.provider',
                'auth.registerDeviceToken',
                'auth.customer_id',
                'auth.customer',
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
                'profil.profil.infos_perso.preferences',
                'profil.history.datesTripPassenger',
                'profil.history.datesTripDriver',
                'search.villages',
                'search.accounts',
                'search.communesFrequency',
                'trip.tripSelected',
                'trip.chat',
                'trip.chat.contacts',
                'trip.member',
                'trip.ratings',
            ]
        })
    ],
});