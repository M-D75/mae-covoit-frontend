// import axios from 'axios'

import router from '../router';  
import supabase from '@/utils/supabaseClient.js';

import store from '../store'; 
import stripe from '@/utils/stripe.js'

export default {
    namespaced: true,
    state: {
        userId: "",
        //stripe
        customer_id: "",
        provider_id: "", //id compte stipe connect
        provider: null,
        customer: null,
        logged_in: false,
        account_created: false,
        provider: "",
        // device Id pour Android, IOS
        registerDeviceToken: "",
    },
    mutations: {
        SET_REGISTER_DEVICE_TOKEN(state, token) {
            state.registerDeviceToken = token;
        },
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
                return {status: 1, message: "Un probléme est survenu, veuillez réessayer plus tard"}
            }
            
            // create account
            const { data: account_ins, error: err_account_ins } = await supabase
                .from('account')
                .insert([
                    { username: `${info.name} ${info.firstname}`, lastname: info.name, firstname: info.firstname, user_id: user.id, email: user.email },
                ])
                .select()

            if(err_account_ins){
                console.error("Erreur", err_account_ins)
                return {status: 2, message: "Nous n'avons pas pu crée votre compte, veuillez réessayer plus tard"}
            }

            // create setting
            const { data: setting_ins, error: err_setting_ins } = await supabase
                .from('setting')
                .insert([
                    { account_id: account_ins[0].id },
                ])
                .select()

            if(err_setting_ins){
                console.error("Erreur", err_setting_ins)
                return {status: 3, message: "La création de votre compte n'a pas pu aboutir, certaines fonctionnalité seront indeisponible."}
            }

            console.log("INS:", info, account_ins, setting_ins);

            state.account_created = true;
            return {status: 0, message: "Votre compte à été crée avec succès"};
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

            console.log("checkSession data.session:", data.session)
            state.logged_in = false;
            if( data.session ){
                
                state.logged_in = true;

                const user = data.session.user;
                store.state.profil.userUid = user.id;
                state.provider = user.app_metadata.provider;
                console.log('User is already connected:', user);

                //Check if account are created
                let { data: account, error: error_account } = await supabase
                    .from('account')
                    .select(`
                        *,
                        settings (auto_accept_trip, prefer)
                    `)
                    .eq('user_id', user.id)

                if(account && account.length > 0)
                    store.state.profil.auto_accept_trip = account[0].settings[0].auto_accept_trip;

                console.log("Account", account);

                if( error_account ){
                    console.error("Erreur", error_account)
                    state.account_created = false;
                }
                else{
                    if(account.length > 0){
                        console.log("Welcome ! ", account[0].firstname);
                        store.state.profil.userId = account[0].id;
                        state.account_created = true;
                        
                        // Create or retrieve custromer
                        if( account[0].customer_id == null ){
                            console.log("create new customer");
                            // strip customer
                            const customer = await stripe.customers.create({
                                name: `${account[0].firstname} ${account[0].lastname}`,
                                email: user.email,
                            });

                            console.log("new customer:", customer);
                            await supabase
                                .from('account')
                                .update({ customer_id: customer.id })
                                .eq('user_id', user.id)
                                .select();
                        }
                        else{
                            const customer = await stripe.customers.retrieve(account[0].customer_id);
                            console.log("retrieve customer:", customer);
                            state.customer_id = customer.id;
                            state.customer = customer;
                            if( customer.default_source ){
                                try {
                                    const card = await stripe.customers.retrieveSource(
                                        customer.id,
                                        customer.default_source
                                    );
                                    store.state.profil.credit_card.brand = card.brand;
                                    store.state.profil.credit_card.num_end_credit_card = card.last4;
                                    store.state.profil.credit_card.available = true;
                                } catch (error) {
                                    console.error("Erreur lors de la récupération de la carte:", error);
                                    throw error;
                                }
                            }
                        }

                        //***************
                        // Create or retrieve provider
                        if( account[0].provider_id == null ){
                            console.log("create new provider");
                            // strip provider
                            const provider = await stripe.accounts.create({
                                type: 'standard',
                                country: 'FR',
                                email: user.email,
                            });

                            console.log("new provider:", provider);
                            await supabase
                                .from('account')
                                .update({ provider_id: provider.id })
                                .eq('user_id', user.id)
                                .select();
                        }
                        else{
                            const provider = await stripe.accounts.retrieve(account[0].provider_id);
                            console.log("retrieve provider:", provider);
                            state.provider_id = provider.id;
                            state.provider = provider;
                            store.state.profil.payouts_enabled = provider.payouts_enabled;
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
                        store.state.profil.gain = current_account.gain;

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
            let { data, error } = await supabase.auth.getSession();

            if(error)
                return false;

            // console.log("checkSession--data.session:", data.session)
            if( data.session ){
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
        async isAuthenticated() {
            let { data, error } = await supabase.auth.getSession();

            if( error ){
                router.replace("/login");
                return false;
            }

            const tokenValid = new Date().getTime() < data.session.expires_at * 1000;
            return tokenValid;
        },
    },
    modules: {
    }
}
