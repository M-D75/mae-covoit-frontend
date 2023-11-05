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
        logged_in: false,
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

            console.log("refreshToken", error, user)
            
        },
        async checkSession({ state, getters, dispatch }){
            let { data, error } = await supabase.auth.getSession();

            console.log("checkSession v-data-session:", data.session)
            state.logged_in = false;
            if( data.session ){
                const jwt = data.session.access_token;

                state.token = jwt;
                state.tokenExpiry = data.session.expires_at * 1000;

                if( ! getters.isAuthenticated ){
                    console.log("Session expired")
                    dispatch("refreshToken")
                    state.logged_in = false;
                }

                const { data: { user } } = await supabase.auth.getUser(jwt);
                if( user ){
                    console.log('4:User already conneced:', user);
                    store.state.profil.userUid = user.id;
                    
                    if(user.user_metadata.avatar_url && store.state.profil.avatarUrl == "https://avatars0.githubusercontent.com/u/9064066?v=4&s=460")
                        store.state.profil.avatarUrl = user.user_metadata.avatar_url;

                    await store.dispatch("search/getAccounts");

                    if( store.state.search.accounts && store.state.search.accounts.length >= 1 ){
                        const current_account = store.state.search.accounts.filter((account) => (account.user_id == user.id))[0];
                        if(current_account){
                            store.state.profil.soldes = current_account.credit;

                            store.state.profil.userName = ! user.user_metadata.full_name ? current_account.username : user.user_metadata.full_name;
                            console.log("store", store.state.profil, store.state.search.accounts, current_account)
                        }
                        else {
                            store.state.profil.soldes = 0;
                            store.state.profil.userName = `Anonyme-${user.id.substring(0, 3)}`;
                        }
                    }
                    else{
                        store.state.profil.soldes = 0;
                        store.state.profil.userName = `Anonyme-${user.id.substring(0, 3)}`;
                    }
                }

                //router.replace("/search");
                state.logged_in = true;
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
