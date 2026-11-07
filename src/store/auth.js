// import axios from 'axios'

import { clearTripNotifications } from '@/services/tripNotifications.js';
import { nativeTripTracking } from '@/services/nativeTripTracking.js';
import router from '../router';  
import supabase from '@/utils/supabaseClient.js';
import { serverRequest } from '@/utils/serverApi.js';
import { runAuthSession } from '@/services/authSessionGuard.js';
import { rememberAuthEntry } from '@/services/authEntry.js';

import store from '../store'; 

let sessionCheckGeneration = 0;
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
        profileLookupError: null,
        logged_in: false,
        account_created: false,
        // device Id pour Android, IOS
        registerDeviceToken: "",
    },
    mutations: {
        SET_PROFILE_LOOKUP_ERROR(state,value){state.profileLookupError=value;},
        SET_LOGGED_IN(state, status) {
            state.logged_in = status;
        },
        SET_ACCOUNT_CREATED(state, status) {
            state.account_created = Boolean(status);
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
        CLEAR_PAYMENT_PROFILE(state) {
            state.customer_id = "";
            state.provider_id = "";
            state.provider = null;
            state.customer = null;
            state.stripe_provider = null;
        },
        CLEAR_TOKEN(state) {
            state.profileLookupError=null;
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
        async createAccount({state, commit, rootState}, info){
            const owner=rootState.profil.userUid, generation=rootState.profil.accountGeneration;
            const current=()=>rootState.profil.userUid===owner && rootState.profil.accountGeneration===generation;
            const details={lastname:info.name,firstname:info.firstname,village:info.village};
            if(!owner)return {status:1,message:'Votre session a expiré. Veuillez vous reconnecter.'};
            if(info.expectedUserId && (info.expectedUserId!==owner || info.accountGeneration!==generation))return {status:2,stale:true};

            try {
                const { data, error } = await supabase.auth.getUser();
                if(!current() || (owner && data?.user && data.user.id!==owner))return {status:2,stale:true};
                if (error || !data?.user) {
                    return {status: 1, message: "Votre session a expiré. Veuillez vous reconnecter."};
                }

                const profileResponse = await serverRequest('post', '/account/profile', {
                    mode: rootState.profil?.modeCo, expectedUserId:data.user.id,
                    data:details,
                });

                if(!current())return {status:2,stale:true};
                const account=profileResponse.data?.account;
                if(!account?.id || (account.user_id && account.user_id!==data.user.id))throw new Error('Confirmation du profil invalide.');
                commit('SET_ACCOUNT_CREATED', true);
                rootState.profil.userId = profileResponse.data?.account?.id || null;

                // Stripe creation is recoverable and must not turn an already
                // committed Supabase profile into a false sign-up failure.
                try {
                    const paymentResponse = await serverRequest('post', '/account/payment-profile', {
                        mode: rootState.profil?.modeCo, expectedUserId:data.user.id,
                    });
                    if(!current())return {status:2,stale:true};
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
                    if(!current() || paymentError.code==='SESSION_CHANGED')return {status:2,stale:true};
                    console.error("Payment profile will be initialized on retry:", paymentError);
                }

                return {status: 0, message: "Votre compte a été créé avec succès"};
            } catch (error) {
                if(!current() || error.code==='SESSION_CHANGED')return {status:2,stale:true};
                console.error("createAccount error:", error);
                return {
                    status: error.response?.status || 2,
                    message: error.response?.data?.message || "Nous n'avons pas pu créer votre compte.",
                };
            }
        },
        async removeAccount({ commit, rootState }, intent = {}){
            const owner=rootState.profil.userUid, generation=rootState.profil.accountGeneration;
            const current=()=>rootState.profil.userUid===owner && rootState.profil.accountGeneration===generation;
            const stale=()=>({status:2,stale:true});
            if(!owner || (intent.expectedUserId && (intent.expectedUserId!==owner || intent.accountGeneration!==generation)))return stale();
            try {
                const response=await serverRequest('delete','/account',{
                    mode:rootState.profil.modeCo, expectedUserId:owner,
                });
                if(!current())return stale();
                const signedOut=()=>!rootState.profil.userUid && rootState.profil.accountGeneration===generation+1;
                const {error}=await runAuthSession(supabase,{userId:owner,isCurrent:()=>current() || signedOut()},'signOut',{scope:'local'});
                if(error)throw error;
                if(!current() && !signedOut())return stale();
                commit('CLEAR_TOKEN');
                for(const key of ['vuex','mae-covoit-v2','mae-covoit-v3'])localStorage.removeItem(key);
                return {status:0,deletedUserId:owner,sessionGeneration:rootState.profil.accountGeneration,
                    message:response.data?.message || "Votre compte a été supprimé.",warnings:response.data?.warnings || []};
            }catch(error){
                if(!current() || error.code==='SESSION_CHANGED')return stale();
                return {status:error.response?.status || 1,message:error.response?.data?.message || "La suppression du compte n'a pas pu être terminée."};
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
        async checkSession({ state, commit, rootState }){
            const request = ++sessionCheckGeneration, initialGeneration = rootState.profil.accountGeneration;
            let { data, error } = await supabase.auth.getSession();
            if (request !== sessionCheckGeneration || initialGeneration !== rootState.profil.accountGeneration) return false;

            commit('SET_LOGGED_IN', false);
            commit('SET_ACCOUNT_CREATED', false);
            if(data.session){
                rememberAuthEntry();
                commit('SET_LOGGED_IN', true);
                commit('SET_TOKEN', {
                    token: data.session.access_token,
                    expiry: data.session.expires_at * 1000,
                });
                const user = data.session.user;
                commit('profil/SET_USER_UID', user.id, { root: true });
                const generation = rootState.profil.accountGeneration;
                const current = () => request === sessionCheckGeneration && rootState.profil.userUid === user.id && rootState.profil.accountGeneration === generation;
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

                if (!current()) return false;
                if(error_account){
                    commit('SET_PROFILE_LOOKUP_ERROR',{path:state.profileLookupError?.path||'/search'});
                    return false;
                }
                commit('SET_PROFILE_LOOKUP_ERROR',null);
                account = account || [];

                if(account.length > 0){
                    const settings = Array.isArray(account[0].settings) ? account[0].settings[0] : account[0].settings;
                    if (settings) {
                        store.state.profil.auto_accept_trip = typeof settings.auto_accept_trip === 'boolean' ? settings.auto_accept_trip : true;
                        commit('profil/SET_PREFERENCES', settings.prefer, {root: true});
                    }
                    commit('profil/SET_PROFILE_DETAILS', account[0], {root: true});
                    store.state.profil.identity = account[0].identity;
                }

                console.log("Account", account);

                if( error_account ){
                    console.error("Erreur", error_account)
                    commit('SET_ACCOUNT_CREATED', false);
                    rootState.profil.userId = null;
                    return false;
                }
                else{
                    if(account.length > 0){
                        console.log("Welcome ! ", account[0].firstname);
                        store.state.profil.userId = account[0].id;
                        commit('SET_ACCOUNT_CREATED', true);

                        try {
                            const paymentProfileResponse = await serverRequest(
                                'post',
                                '/account/payment-profile',
                                { mode: store.state.profil.modeCo, expectedUserId:user.id }
                            );
                            if (!current()) return false;
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

                            store.state.profil.credit_card = { available: false, brand: '', last4: '0000' };
                            if (paymentProfile.customer?.card) {
                                store.state.profil.credit_card.brand = paymentProfile.customer.card.brand;
                                store.state.profil.credit_card.last4 = paymentProfile.customer.card.last4;
                                store.state.profil.credit_card.available = true;
                            }
                        } catch (paymentProfileError) {
                            if (!current()) return false;
                            console.error("Payment profile initialization failed:", paymentProfileError);
                        }
                    }
                    else{
                        console.log("No account")
                        commit('SET_ACCOUNT_CREATED', false);
                        rootState.profil.userId = null;
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

                if(!current())return false;
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
                rootState.profil.userId = null;
                commit('profil/SET_USER_UID', '', { root: true });
                return false;
            }
        },
        async checkSessionOnly(){
            let { data, error } = await supabase.auth.getUser();

            if(error || !data?.user)
                return false;

            return true;
        },
        async logout({ commit, rootState }, intent = {}) {
            const profile=rootState.profil, owner=profile.userUid, generation=profile.accountGeneration;
            const current=()=>rootState.profil.userUid===owner && rootState.profil.accountGeneration===generation;
            const signedOut=()=>!rootState.profil.userUid && rootState.profil.accountGeneration===generation+1;
            if(!owner || (intent.expectedUserId && (intent.expectedUserId!==owner || intent.accountGeneration!==generation)))return {status:2,stale:true};
            try{
                await nativeTripTracking.stop().catch(()=>{});
                if(!current())return {status:2,stale:true};
                commit('trip/CLEAR_MESSAGING',null,{root:true});
                await clearTripNotifications(store).catch(()=>{});
                if(!current())return {status:2,stale:true};
                const {error}=await runAuthSession(supabase,{userId:owner,isCurrent:()=>current() || signedOut()},'signOut');
                if(error)throw error;
                if(!current() && !signedOut())return {status:2,stale:true};
                commit('CLEAR_TOKEN');commit('profil/SET_USER_UID','',{root:true});router.replace('/login');
                return {status:0};
            }catch(error){
                if(!current() || error.code==='SESSION_CHANGED')return {status:2,stale:true};
                return {status:1,message:error.message || 'La déconnexion a échoué. Réessayez.'};
            }
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
