// import axios from 'axios'

import router from '../router';  
import supabase from '@/utils/supabaseClient.js';
import { serverRequest } from '@/utils/serverApi.js';

import store from '../store'; 

export default {
    namespaced: true,
    state: {
        userId: "",
        //stripe
        customer_id: "",
        provider_id: "", //id compte stipe connect
        provider: null,
        stripe_provider: null,
        customer: null,
        token: "",
        tokenExpiry: 0,
        logged_in: false,
        account_created: false,
        // device Id pour Android, IOS
        registerDeviceToken: "",
    },
    mutations: {
        SET_LOGGED_IN(state, status) {
            state.logged_in = status;
        },
        SET_PROVIDER(state, provider) {
            state.provider = provider;
        },
        SET_REGISTER_DEVICE_TOKEN(state, token) {
            state.registerDeviceToken = token;
        },
        SET_TOKEN(state, { token, expiry }) {
            state.token = token || "";
            state.tokenExpiry = expiry || 0;
        },
        CLEAR_TOKEN(state) {
            state.token = "";
            state.tokenExpiry = 0;
            state.logged_in = false;
            state.account_created = false;
            state.customer_id = "";
            state.provider_id = "";
            state.provider = null;
            state.customer = null;
            state.stripe_provider = null;
        },
    },
    actions: {
        async createAccount({state, rootState}, info){

            const { data: { user } } = await supabase.auth.getUser();

            if(!user){
                console.log("user not exist")
                return {status: 1, message: "Un probléme est survenu, veuillez réessayer plus tard"}
            }
            
            try {
                const profileResponse = await serverRequest('post', '/account/profile', {
                    mode: rootState.profil?.modeCo,
                    data: {
                        lastname: info.name,
                        firstname: info.firstname,
                        village: info.village,
                    },
                });

                state.account_created = true;
                rootState.profil.userId = profileResponse.data?.account?.id || null;

                // Stripe creation is recoverable and must not turn an already
                // committed Supabase profile into a false sign-up failure.
                try {
                    const paymentResponse = await serverRequest('post', '/account/payment-profile', {
                        mode: rootState.profil?.modeCo,
                    });
                    const paymentProfile = paymentResponse.data;
                    state.customer_id = paymentProfile.customer?.id || "";
                    state.customer = paymentProfile.customer || null;
                    state.provider_id = paymentProfile.provider?.id || "";
                    state.stripe_provider = paymentProfile.provider || null;
                    rootState.profil.payouts_enabled = Boolean(paymentProfile.provider?.payoutsEnabled);
                    rootState.profil.connect_account_available = Boolean(paymentProfile.provider?.id);
                    rootState.profil.connect_activation_required = Boolean(
                        paymentProfile.provider?.activationRequired
                        ?? !paymentProfile.provider?.onboardingComplete
                    );
                } catch (paymentError) {
                    console.error("Payment profile will be initialized on retry:", paymentError);
                }

                return {status: 0, message: "Votre compte a été créé avec succès"};
            } catch (error) {
                console.error("createAccount error:", error);
                return {
                    status: error.response?.status || 2,
                    message: error.response?.data?.message || "Nous n'avons pas pu créer votre compte.",
                };
            }
        },
        async removeAccount({ commit, rootState }){
            try {
                const response = await serverRequest('delete', '/account', {
                    mode: rootState.profil?.modeCo,
                });

                // The remote user no longer exists, so only clear the local
                // session. A global sign-out can fail after admin deletion.
                await supabase.auth.signOut({ scope: 'local' });
                commit('CLEAR_TOKEN');
                localStorage.removeItem('vuex');
                localStorage.removeItem('mae-covoit-v2');

                return {
                    status: 0,
                    message: response.data?.message || "Votre compte a été supprimé.",
                    warnings: response.data?.warnings || [],
                };
            }
            catch(error){
                console.error("removeAccount error:", error);
                return {
                    status: error.response?.status || 1,
                    message: error.response?.data?.message || "La suppression du compte n'a pas pu être terminée.",
                };
            }
        },
        async refreshToken({state}){
            const { data, error } = await supabase.auth.refreshSession()
            if (error || !data?.session) {
                console.error("refreshToken error:", error);
                return false;
            }
            const { session, user } = data;

            const jwt = session.access_token;

            state.token = jwt;
            state.tokenExpiry = session.expires_at * 1000;

            console.log("refreshToken", error, user)
            return true;
        },
        async checkSession({ state, commit }){
            let { data, error } = await supabase.auth.getSession();

            commit('SET_LOGGED_IN', false);
            if(data.session){
                commit('SET_LOGGED_IN', true);
                commit('SET_TOKEN', {
                    token: data.session.access_token,
                    expiry: data.session.expires_at * 1000,
                });
                const user = data.session.user;
                commit('profil/SET_USER_UID', user.id, { root: true });
                commit('SET_PROVIDER', user.app_metadata.provider);
                console.log('User is already connected:', user);

                //Check if account are created
                let { data: account, error: error_account } = await supabase
                    .from('account')
                    .select(`
                        *,
                        settings (auto_accept_trip, prefer)
                    `)
                    .eq('user_id', user.id)

                account = account || [];

                if(account.length > 0){
                    const settings = account[0].settings?.[0];
                    if (settings) {
                        store.state.profil.auto_accept_trip = settings.auto_accept_trip;
                    }
                    store.state.profil.identity = account[0].identity;
                }

                console.log("Account", account);

                if( error_account ){
                    console.error("Erreur", error_account)
                    state.account_created = false;
                    return false;
                }
                else{
                    if(account.length > 0){
                        console.log("Welcome ! ", account[0].firstname);
                        store.state.profil.userId = account[0].id;
                        state.account_created = true;

                        try {
                            const paymentProfileResponse = await serverRequest(
                                'post',
                                '/account/payment-profile',
                                { mode: store.state.profil.modeCo }
                            );
                            const paymentProfile = paymentProfileResponse.data;

                            state.customer_id = paymentProfile.customer?.id || "";
                            state.customer = paymentProfile.customer || null;
                            state.provider_id = paymentProfile.provider?.id || "";
                            state.stripe_provider = paymentProfile.provider || null;
                            store.state.profil.payouts_enabled = Boolean(paymentProfile.provider?.payoutsEnabled);
                            store.state.profil.connect_account_available = Boolean(paymentProfile.provider?.id);
                            store.state.profil.connect_activation_required = Boolean(
                                paymentProfile.provider?.activationRequired
                                ?? !paymentProfile.provider?.onboardingComplete
                            );

                            if (paymentProfile.customer?.card) {
                                store.state.profil.credit_card.brand = paymentProfile.customer.card.brand;
                                store.state.profil.credit_card.last4 = paymentProfile.customer.card.last4;
                                store.state.profil.credit_card.available = true;
                            }
                        } catch (paymentProfileError) {
                            console.error("Payment profile initialization failed:", paymentProfileError);
                        }
                    }
                    else{
                        console.log("No account")
                        state.account_created = false;
                    }
                }
                
                const current_account = account.length > 0 ? account[0] : null

                if( ( current_account == null || current_account.avatar == null ) && user.user_metadata.avatar_url && store.state.profil.avatarUrl == "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned" )
                    store.state.profil.avatarUrl = user.user_metadata.avatar_url;
                
                if( current_account && current_account.avatar != null)
                    store.state.profil.avatarUrl = current_account.avatar;

                console.log("curreent-acout", current_account);
                if( current_account && current_account.avatar == null ){
                    await supabase
                        .from('account')
                        .update({ avatar: store.state.profil.avatarUrl })
                        .eq('user_id', user.id)
                        .select();
                }

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

                state.logged_in = true;
                return true;
            }
            else{
                console.log("Error cheking session:", error)
                return false;
            }
        },
        async checkSessionOnly(){
            let { data, error } = await supabase.auth.getUser();

            if(error || !data?.user)
                return false;

            return true;
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
        getUserUid: (state) => state.userUid,
        async isAuthenticated() {
            let { data, error } = await supabase.auth.getUser();

            if( error || !data?.user ){
                router.replace("/login");
                return false;
            }

            return true;
        },
    },
    modules: {
    }
}
