// import axios from 'axios'

import { clearTripNotifications } from '@/services/tripNotifications.js';
import { nativeTripTracking } from '@/services/nativeTripTracking.js';
import router from '../router';  
import supabase from '@/utils/supabaseClient.js';
import { serverRequest } from '@/utils/serverApi.js';
import { runAuthSession } from '@/services/authSessionGuard.js';
import { rememberAuthEntry } from '@/services/authEntry.js';
import store from '../store';
import {isAuthLookupUnavailable} from '@/services/authProfile.js';


let activeSessionLoad = null;
async function hydrateSession({state,commit,rootState},entry){
    const profile=rootState.profil,initialGeneration=entry.generation;
    try{
        const {data,error}=await supabase.auth.getSession();
        if(activeSessionLoad!==entry || initialGeneration!==profile.accountGeneration)return {status:'stale'};
        if(error)throw error;
        if(!data?.session){
            commit('CLEAR_TOKEN');profile.userId=null;
            commit('profil/SET_USER_UID','',{root:true});
            return {status:'unauthenticated',hasAccount:false};
        }
        const {session}=data,user=session.user;
        rememberAuthEntry();
        commit('SET_LOGGED_IN',true);
        commit('SET_TOKEN',{token:session.access_token,expiry:session.expires_at*1000});
        commit('profil/SET_USER_UID',user.id,{root:true});
        entry.owner=user.id;entry.generation=profile.accountGeneration;
        const current=()=>activeSessionLoad===entry && profile.userUid===user.id && profile.accountGeneration===entry.generation;
        commit('SET_PROVIDER',user.app_metadata?.provider);
        const {data:rows,error:accountError}=await supabase.from('account')
            .select('*, settings (auto_accept_trip, prefer)').eq('user_id',user.id);
        if(!current())return {status:'stale'};
        if(accountError)throw accountError;
        const account=(rows||[])[0]||null;
        commit('SET_ACCOUNT_CREATED',Boolean(account));
        profile.userId=account?.id||null;
        if(account){
            const settings=Array.isArray(account.settings)?account.settings[0]:account.settings;
            if(settings){
                profile.auto_accept_trip=typeof settings.auto_accept_trip==='boolean'?settings.auto_accept_trip:true;
                commit('profil/SET_PREFERENCES',settings.prefer,{root:true});
            }
            commit('profil/SET_PROFILE_DETAILS',account,{root:true});
            profile.identity=account.identity;
            try{
                const {data:payment}=await serverRequest('post','/account/payment-profile',{mode:profile.modeCo,expectedUserId:user.id});
                if(!current())return {status:'stale'};
                state.customer_id=payment.customer?.id||'';state.customer=payment.customer||null;
                state.provider_id=payment.provider?.id||'';state.stripe_provider=payment.provider||null;
                profile.payouts_enabled=Boolean(payment.provider?.payoutsEnabled);
                profile.connect_account_available=Boolean(payment.provider?.id);
                profile.connect_activation_required=Boolean(payment.provider?.activationRequired??!payment.provider?.onboardingComplete);
                profile.credit_card={available:false,brand:'',last4:'0000'};
                if(payment.customer?.card)profile.credit_card={available:true,brand:payment.customer.card.brand,last4:payment.customer.card.last4};
            }catch{
                if(!current())return {status:'stale'};
                // A payment-service outage does not invalidate an existing profile.
            }
        }
        if(!account?.avatar && user.user_metadata?.avatar_url && profile.avatarUrl==='https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned')profile.avatarUrl=user.user_metadata.avatar_url;
        if(account?.avatar!=null)profile.avatarUrl=account.avatar;
        if(account && account.avatar==null){
            try{await supabase.from('account').update({avatar:profile.avatarUrl}).eq('user_id',user.id).select();}
            catch{/* An optional avatar sync must not block the profile. */}
        }
        if(!current())return {status:'stale'};
        profile.soldes=account?account.credit:0;
        profile.userName=account?[account.lastname,account.firstname].filter(Boolean).join(' ')||user.user_metadata?.full_name||account.username:`Anonyme-${user.id.substring(0,3)}`;
        if(account){
            profile.profil.infos_perso.nom=account.lastname;
            profile.profil.infos_perso.prenom=account.firstname;
            profile.profil.infos_perso.email=account.email;
        }
        return {status:'ready',hasAccount:Boolean(account)};
    }catch{
        if(activeSessionLoad!==entry || profile.accountGeneration!==entry.generation || profile.userUid!==entry.owner)return {status:'stale'};
        return {status:'profile-error',hasAccount:Boolean(state.account_created)};
    }
}
async function loadSessionState(context,options={}){
    const {state,rootState,commit}=context,profile=rootState.profil;
    let entry=activeSessionLoad;
    if(!entry || entry.state!==state || entry.profile!==profile || entry.owner!==profile.userUid || entry.generation!==profile.accountGeneration){
        entry={state,profile,owner:profile.userUid,generation:profile.accountGeneration,promise:null};
        activeSessionLoad=entry;
        entry.promise=hydrateSession(context,entry).finally(()=>{if(activeSessionLoad===entry)activeSessionLoad=null;});
    }
    const result=await entry.promise;
    if(result.status==='profile-error'){
        const route=router.currentRoute?.value;
        const requested=options.path || state.profileLookupError?.path || (route?.meta?.requiresAuth?route.fullPath:'/search');
        const path=typeof requested==='string'&&requested.startsWith('/')&&!requested.startsWith('//')?requested:'/search';
        commit('SET_PROFILE_LOOKUP_ERROR',{path});
    }else if(result.status==='ready')commit('SET_PROFILE_LOOKUP_ERROR',null);
    return result;
}

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
        // Compatibility for existing callers that need only a Boolean.
        async checkSession(context,options){return (await loadSessionState(context,options)).status==='ready';},
        async loadSession(context,options){return loadSessionState(context,options);},
        async checkSessionOnly(){
            let result;
            try{result=await supabase.auth.getUser();}catch(error){result={error};}
            if(result?.data?.user&&!result.error)return true;
            if(!isAuthLookupUnavailable(result?.error))return false;
            // Availability check only: the API and RLS still validate the JWT.
            // A temporary Auth outage must not eject a cached, unexpired session.
            try{
                const {data,error}=await supabase.auth.getSession(),session=data?.session;
                return !error&&Boolean(session?.access_token&&session?.user?.id&&session.expires_at*1000>Date.now());
            }catch{return false;}
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
