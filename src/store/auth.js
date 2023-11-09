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
        account_created: false,
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
        async createAccount({state}, info){

            const { data: { user } } = await supabase.auth.getUser();

            if(!user){
                console.log("user not exist")
                return
            }
            
            const { data: account_ins, error: err_account_ins } = await supabase
                .from('account')
                .insert([
                    { username: 'new', lastname: info.name, firstname: info.firstname, user_id: user.id, credit: 0, email: user.email },
                ])
                .select()

            if(err_account_ins){
                console.error("Erreur", err_account_ins)
            }

            console.log(info, account_ins);

            //Check if account are created
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select('*')
                .eq('user_id', store.state.profil.userUid)

            if(error_account){
                console.error("Erreur", error_account)
            }
            else{
                if(account.length > 0){
                    console.log("Welcome ! ", account[0].firstname);
                    state.account_created = true;
                }
            }
        },
        async refreshToken({state}){
            const { data, error } = await supabase.auth.refreshSession()
            const { session, user } = data;

            const jwt = session.access_token;

            state.token = jwt;
            state.tokenExpiry = session.expires_at * 1000;

            console.log("refreshToken", error, user)
            
        },
        async checkSession({ state }){
            let { data, error } = await supabase.auth.getSession();

            console.log("checkSession v-data-session:", data.session)
            state.logged_in = false;
            if( data.session ){
                state.logged_in = true;
                const jwt = data.session.access_token;

                state.token = jwt;
                state.tokenExpiry = data.session.expires_at * 1000;

                const { data: { user } } = await supabase.auth.getUser(jwt);
                if( user ){
                    console.log('4:User already conneced:', user);
                    store.state.profil.userUid = user.id;

                    //Check if account are created
                    let { data: account, error: error_account } = await supabase
                        .from('account')
                        .select('*')
                        .eq('user_id', user.id)

                    if(error_account){
                        console.error("Erreur", error_account)
                        state.account_created = false;
                    }
                    else{
                        if(account.length > 0){
                            console.log("Welcome ! ", account[0].firstname);
                            state.account_created = true;
                        }
                        else{
                            console.log("No account")
                            state.account_created = false;
                        }
                    }
                    
                    if(user.user_metadata.avatar_url && store.state.profil.avatarUrl == "https://avatars0.githubusercontent.com/u/9064066?v=4&s=460")
                        store.state.profil.avatarUrl = user.user_metadata.avatar_url;

                    if( account.length > 0 ){
                        const current_account = account[0];
                        if(current_account){
                            store.state.profil.soldes = current_account.credit;

                            //store.state.profil.userName = ! user.user_metadata.full_name ? current_account.username : user.user_metadata.full_name;
                            store.state.profil.userName = `${current_account.lastname} ${current_account.firstname}`;
                            if(current_account.lastname == "" && current_account.firstname == "")
                                store.state.profil.userName = ! user.user_metadata.full_name ? current_account.username : user.user_metadata.full_name;
                            
                            store.state.profil.profil.infos_perso.nom = current_account.lastname;
                            store.state.profil.profil.infos_perso.prenom = current_account.firstname;
                            store.state.profil.profil.infos_perso.email = current_account.email;
                            //console.log("store", store.state.profil, store.state.search.accounts, current_account)
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
                console.log("Error cheking session:", error)
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
