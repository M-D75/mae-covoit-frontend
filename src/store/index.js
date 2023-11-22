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
        paths: ['auth.provider',
                'profil.darkMode',
                'profil.userUid', 
                'profil.userName', 
                'profil.autoValidation', 
                'profil.avatarUrl', 
                'profil.profil.infos_perso.preferences', 
                'search.villages', 
                'search.accounts',
                'search.communesFrequency']
    })],
});