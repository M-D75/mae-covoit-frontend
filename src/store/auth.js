// import axios from 'axios'

import router from '../router';  
import supabase from '@/utils/supabaseClient.js';

import store from '../store'; 

export default {
    namespaced: true,
    state: {
        userId: "",
        token: null,
        tokenExpiry: null,
    },
    mutations: {
        SET_TOKEN(state, payload) {
            state.token = payload.token;
            state.tokenExpiry = payload.expiry;
        },
        CLEAR_TOKEN(state) {
            state.token = null;
            state.tokenExpiry = null;
        }
    },
    actions: {
        async refreshToken({state}){
            const { data, error } = await supabase.auth.refreshSession()
            const { session, user } = data;

            const jwt = session.access_token;

            state.token = jwt;
            state.tokenExpiry = session.expires_at * 1000;

            console.log("ooo", error, user)
            
        },
        async checkSession({ state, getters, dispatch }){
            let { data, error } = await supabase.auth.getSession();

            if( data.session ){
                const jwt = data.session.access_token;

                state.token = jwt;
                state.tokenExpiry = data.session.expires_at * 1000;

                if( ! getters.isAuthenticated ){
                    console.log("Session expired")
                    dispatch("refreshToken")
                }

                const { data: { user } } = await supabase.auth.getUser(jwt);
                if( user ){
                    console.log('4:User already conneced:', user);
                    store.state.profil.userUid = user.id;
                    
                    store.state.profil.avatarUrl = user.user_metadata.avatar_url;

                    await store.dispatch("search/getAccounts");

                    const current_account = store.state.search.accounts.filter((account) => (account.user_id == user.id))[0];
                    store.state.profil.soldes = current_account.credit;

                    store.state.profil.userName = ! user.user_metadata.full_name ? current_account.username : user.user_metadata.full_name;
                    console.log("store", store.state.profil, store.state.search.accounts, current_account)
                }

                router.replace("/search");

                return true;
            }
            else{
                console.log("Error:", error)
                return false;
            }
        },
        async logout({ commit }) {
            let { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error('Erreur lors de la deconnexion:', error.message);
                return;
            }
            commit('CLEAR_TOKEN');
            localStorage.clear();
            router.replace("/login");
        },
    },
    getters: {
        isAuthenticated(state) {
            const tokenValid = state.token && new Date().getTime() < state.tokenExpiry;
            return tokenValid;
        },
    },
    modules: {
    }
}
