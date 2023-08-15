import { createStore } from 'vuex';
import createPersistedState from "vuex-persistedstate";

// modules
import auth from './auth';
import profil from './profil';
import publish from './publish';
import search from './search';

export default createStore({
    modules: {
        auth,
        profil,
        publish,
        search,
    },
    plugins: [createPersistedState({
        paths: ['auth', 'profil', 'search.villages', 'search.accounts']
    })],
});