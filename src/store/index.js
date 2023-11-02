import { createStore } from 'vuex';
import createPersistedState from "vuex-persistedstate";

// modules
import auth from './auth';
import profil from './profil';
import publish from './publish';
import search from './search';
import general from './general';

export default createStore({
    modules: {
        auth,
        profil,
        publish,
        search,
        general,
    },
    plugins: [createPersistedState({
        paths: ['auth', 'profil.userUid', 'search.villages', 'search.accounts']
    })],
});