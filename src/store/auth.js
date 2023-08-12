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

            console.log("session4:", data, error);
            if( data.session ){
                const jwt = data.session.access_token;

                state.token = jwt;
                state.tokenExpiry = data.session.expires_at * 1000;

                if(getters.isAuthenticated){
                    console.log("already session")
                }
                else{
                    dispatch("refreshToken")
                }

                const { data: { user } } = await supabase.auth.getUser(jwt);
                if( user ){
                    console.log('4:User already conneced:', user);
                    store.state.profil.userUid = user.id;
                    store.state.profil.userName = user.user_metadata.full_name;
                    store.state.profil.avatarUrl = user.user_metadata.avatar_url;
                }

                router.push("/search");

                return true;
            }
            else{
                console.log("error4 session");
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
            router.push("/login");
        },
    },
    getters: {
        isAuthenticated(state) {
            console.log("state.token", state.token, "state.tokenExpiry", state.tokenExpiry);
            const tokenValid = state.token && new Date().getTime() < state.tokenExpiry;
            return tokenValid;
        },
    },
    modules: {
    }
}
