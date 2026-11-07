// import { createStore } from 'vuex'
// import { createClient } from '@supabase/supabase-js'


import store from '../store';
import supabase from '@/utils/supabaseClient.js';
import { dateConverter, groupByDate, mapToObject } from '@/utils/utils.js';
import router from '@/router';
import { preferencesFromIndices, preferenceIndices } from '@/services/travelPreferences.js';

import { fetchPassengerTrips, normalizePassengerTrips } from '@/services/travels.js';
import { humanizeSupabaseError } from '@/utils/errorMessages.js';
import {saveProfilePhoto} from '@/services/profilePhoto.js';
import {fetchProfileHistory} from '@/services/profileHistory.js';
import { serverRequest } from '@/utils/serverApi.js';
import { createRequestId } from '@/utils/requestId.js';

function normalizeConnectProvider(provider = {}) {
    const payoutsEnabled = Boolean(provider.payouts_enabled ?? provider.payoutsEnabled);
    const detailsSubmitted = Boolean(provider.details_submitted ?? provider.detailsSubmitted);
    const transfersActive = Boolean(provider.transfers_active ?? provider.transfersActive);
    const onboardingComplete = Boolean(
        provider.onboarding_complete
        ?? provider.onboardingComplete
        ?? (payoutsEnabled && detailsSubmitted && transfersActive)
    );

    return {
        id: provider.id || null,
        payouts_enabled: payoutsEnabled,
        details_submitted: detailsSubmitted,
        transfers_active: transfersActive,
        onboarding_complete: onboardingComplete,
        activation_required: Boolean(
            provider.activation_required
            ?? provider.activationRequired
            ?? !onboardingComplete
        ),
        metadata: provider.metadata || { vs_id: null },
    };
}

let carRequest = 0;
let notationRequest = 0;
let passengerTripsRequest = 0;
let driverTripsRequest = 0;
const profilModule = {
    namespaced: true,
    state: {
        aboutPrefs: {
            discution: "disscution",
            smoke: "fumer",
            music: "musique",
            animal: "animal",
        },
        auto_accept_trip: true,
        // One source of truth prevents a local screen from calling production.
        modeCo: process.env.VUE_APP_MODE || (process.env.NODE_ENV === 'production' ? "online" : "local"),
        notification: true,
        modeDriver: false,
        darkMode: false,
        userId: null,
        userUid: "", accountGeneration: 0,
        userName: "",
        avatarUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned',
        soldes: 0,
        pendingDebit: 0,
        gain: {
            pending: 0,
            transit: 0,
            wallet: 0,
        },
        cguAccepted: false,
        identity: false,
        payouts_enabled: false,
        connect_account_available: false,
        connect_activation_required: true,
        credit_card: {
            last4: "0000",
            available: false,
            brand: "",
        },
        profil: {
            nbTrip: 0,
            avis: 0,
            satisfaction: 0,
            infos_perso: {
                civilite: "Mr.",
                nom: "",
                prenom: "",
                email: "",
                tel: "",
                adress: {
                    principal: "",
                    complement: "",
                    code_postal: "",
                    commune: "",
                },
                preferences: preferencesFromIndices(),
            },
            myTravels: [],
            myPublish: [],
            loadGetTripPublish: false,
        },
        avatarDraft:null,
        history: {
            error: null,
            historycalBooking: {},
            load: false,
            datesTripPassenger: [],
            datesTripDriver: [],
        },
        preferenceVirementMode: 0,
        cars: [],
        //panneau-info
        blockChangingTheme: false,
    },
    getters: {
    },
    mutations: {
        SET_AVATAR_DRAFT(state,value){state.avatarDraft=value;},
        CLEAR_HISTORY(state){state.history.historycalBooking={};state.history.error=null;state.history.load=false;},
        SET_USER_UID(state, userUid) {
            if (state.userUid !== userUid) {
                const preferences = {darkMode: state.darkMode, modeDriver: state.modeDriver, notification: state.notification};
                const generation = state.accountGeneration + 1;
                Object.assign(state, JSON.parse(JSON.stringify(initialProfileState)), preferences, { accountGeneration: generation });
            }
            state.userUid = userUid;
        },
        SET_PREFERENCES(state, indices) { state.profil.infos_perso.preferences = preferencesFromIndices(indices); },
        SET_PROFILE_DETAILS(state, account) {
            const infos = state.profil.infos_perso;
            infos.civilite = account.salutation || '';
            infos.tel = account.phone_number || '';
            infos.adress.commune = account.village || '';
        },
        SET_INFOS(state, data){
            state.profil.infos_perso.civilite = data.civilite;
            state.profil.infos_perso.nom = data.nom;
            state.profil.infos_perso.prenom = data.prenom;
            state.profil.infos_perso.tel = data.tel;
            state.profil.infos_perso.adress.principal = data.principal;
            state.profil.infos_perso.adress.complement = data.complement;
            state.profil.infos_perso.adress.code_postal = data.code_postal;
            state.profil.infos_perso.adress.commune = data.commune;
        },
        SET_NOTIFICATION(state, boolean){
            state.notification = boolean;
        },
        SET_MODE_DRIVER(state, boolean){
            state.modeDriver = boolean;
        },
        SET_DARKMODE(state, boolean){
            state.darkMode = boolean;
        },
        SET_AVATAR_URL(state, url){
            state.avatarUrl = url;
        },
        SET_LOAD_GET_TRIP_PUBLISH(state, boolean){
            state.profil.loadGetTripPublish = boolean;
        },
        SET_PREFERENCE_ABOUT(state, pref){
            console.log("SET_PREFERENCE_ABOUT", pref);
            for(let i=0; i<state.profil.infos_perso.preferences.length; i++){
                if( pref.about == state.profil.infos_perso.preferences[i].about ){
                    state.profil.infos_perso.preferences[i] = pref;
                }
            }
        },
        SET_AUTO_VALIDATION(state, bool){
            state.auto_accept_trip = bool;
        },
        SET_PREFERENCE_VIREMENT_MODE(state, choice){
            state.preferenceVirementMode = choice;
        },
        SET_CREDIT_CARD(state, infos){
            console.log("infos----", infos);
            const available = infos.last4 != undefined && infos.last4 != "";
            state.credit_card = {last4: infos.last4, available:  available, brand: infos.brand};
        },
        SET_CGU_ACCEPTED(state, bool){
            console.log("CGU:", bool);
            state.cguAccepted = bool;
        },
        SET_REMOVE_HISTORY_DATES(state, infos){ //Supprime une date si elle a expiré
            if( infos.type=='passenger' ){
                state.history.datesTripPassenger.splice(infos.index, 1);
            }
            else{
                state.history.datesTripDriver.splice(infos.index, 1);
            }
        },
        REMOVE_HISTORY_DATE_BY_VALUE(state, infos){
            const type = infos?.type === 'driver' ? 'datesTripDriver' : 'datesTripPassenger';
            if(!infos?.departure_time || !Array.isArray(state.history[type])){
                return;
            }
            state.history[type] = state.history[type].filter((date) => date !== infos.departure_time);
        },
        SET_BLOCK_CHANGING_THEME(state, bool){ //Supprime une date si elle a expiré
            state.blockChangingTheme = bool;
        },
        
    },
    actions: {
        async getNotation({state}){
            const owner = state.userUid, account = state.userId, generation = state.accountGeneration, request = ++notationRequest;
            const current = () => owner === state.userUid && account === state.userId && generation === state.accountGeneration && request === notationRequest;
            try {
                const [{ count, error }, summaryResponse] = await Promise.all([
                    supabase
                        .from('trip')
                        .select('id', { count: 'exact', head: true })
                        .eq("driver_id", owner),
                    serverRequest('get', `/ratings/accounts/${account}/summary`, {
                        mode: state.modeCo, expectedUserId: owner,
                    }),
                ]);
                if(!current()) return {status:2, stale:true};
                if(error) throw error;

                const summary = summaryResponse.data?.data;
                if (summaryResponse.data?.status !== 'ok' || !summary) {
                    throw new Error("Réponse de notation invalide.");
                }

                state.profil.nbTrip = count;
                state.profil.avis = Number(summary.averageScore || 0);
                state.profil.satisfaction = Number(summary.satisfaction || 0);
                return {status: 0, message: "Nombre de trajets:"+state.profil.nbTrip}
            } catch (error) {
                if(!current()) return {status:2, stale:true};
                console.error("getNotation error:", error);
                return {
                    status: 1,
                    message: error.response?.data?.message || "Erreur lors du chargement de la notation.",
                };
            }
        },
        async addCar({state}, infos){
            const owner = state.userUid, generation = state.accountGeneration;
            const current = () => owner === state.userUid && generation === state.accountGeneration;
            try {
                if (!await store.dispatch('auth/checkSessionOnly')) return {status: 1, message: 'Votre session a expiré. Veuillez vous reconnecter.'};
                if (!current()) return {status: 2, stale: true};
                const { data, error } = await supabase.from('car').insert([{
                    driver_id: owner, model: infos.model, license_plate: infos.licence_plate,
                    brand: infos.brand, color: infos.color, seats: infos.seats,
                }]).select();
                if (!current()) return {status: 2, stale: true};
                if (error || !data?.length) throw new Error();
                state.cars = [...(state.cars || []), ...data];
                return {status: 0, message: 'Votre véhicule a bien été ajouté.'};
            } catch { return {status: 1, message: 'Impossible d’ajouter le véhicule. Veuillez réessayer.'}; }
        },
        async getCars({state}){
            const owner = state.userUid, generation = state.accountGeneration, request = ++carRequest;
            const current = () => owner === state.userUid && generation === state.accountGeneration && request === carRequest;
            try {
                if (!await store.dispatch('auth/checkSessionOnly')) return {status: 1, message: 'Votre session a expiré. Veuillez vous reconnecter.'};
                if (!current()) return {status: 2, stale: true};
                const { data, error } = await supabase.from('car').select('*').eq('driver_id', owner);
                if (!current()) return {status: 2, stale: true};
                if (error) throw error;
                state.cars = data || [];
                return {status: 0};
            } catch { return {status: 1, message: 'Impossible de charger vos véhicules. Veuillez réessayer.'}; }
        },
        async updateAutoValidation({ state }, value){
            const owner = state.userUid, generation = state.accountGeneration;
            const previous = state.auto_accept_trip;
            const selected = typeof value === 'boolean' ? value : previous;
            try {
                const { data, error } = await supabase.from('settings').update({auto_accept_trip: selected})
                    .eq('account_id', state.userId).select();
                if (owner !== state.userUid || generation !== state.accountGeneration) return {status: 2, stale: true};
                if (error || !data?.length || typeof data[0].auto_accept_trip !== 'boolean') throw new Error();
                state.auto_accept_trip = data[0].auto_accept_trip;
                return {status: 0};
            } catch {
                if (owner === state.userUid && generation === state.accountGeneration) state.auto_accept_trip = previous;
                return {status: 1, message: 'La validation automatique n’a pas été enregistrée. Réessayez.'};
            }
        },
        async updateAvatar({state,commit},image){
            const owner=state.userUid;const saved=await saveProfilePhoto(supabase,owner,image);
            if(state.userUid!==owner)throw new Error('Votre session a changé.');
            commit('SET_AVATAR_URL',saved);commit('SET_AVATAR_DRAFT',null);return saved;
        },
        async updatePreference({state, commit}, choice){
            const owner = state.userUid, generation = state.accountGeneration;
            const preferences = state.profil.infos_perso.preferences.map(pref => pref.about === choice?.about ? choice : pref);
            const selected = preferenceIndices(preferences);
            try {
                const { data, error } = await supabase.from('settings').update({prefer: selected}).eq('account_id', state.userId).select();
                if (owner !== state.userUid || generation !== state.accountGeneration) return {status: 2, stale: true};
                if (error || !data?.length || !Array.isArray(data[0].prefer)) throw new Error();
                commit('SET_PREFERENCES', data[0].prefer);
                return {status: 0};
            } catch { return {status: 1, message: 'Vos préférences n’ont pas été enregistrées. Veuillez réessayer.'}; }
        },
        async savePersonalDetails({state, commit}, values){
            const owner = state.userUid, generation = state.accountGeneration;
            try {
                const { data } = await serverRequest('patch', '/account/profile', {mode: state.modeCo, data: {
                    civilite: values.civilite, tel: values.tel, commune: values.commune,
                }});
                if (owner !== state.userUid || generation !== state.accountGeneration) return {status: 2, stale: true};
                if (data?.status !== 'ok' || data.account?.user_id !== owner) throw new Error();
                commit('SET_PROFILE_DETAILS', data.account);
                return {status: 0, message: 'Vos informations ont été enregistrées.'};
            } catch(error) { return {status: 1, message: error.response?.data?.message || 'Vos informations n’ont pas été enregistrées. Veuillez réessayer.'}; }
        },
        async registerVehicul(){
            
        },
        async getSoldes({state}){
            const owner = state.userUid, generation = state.accountGeneration;
            const current = () => state.userUid === owner && state.accountGeneration === generation;
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if (!current()) return {status: 2, stale: true};
            if( ! sessionChecked ){
                router.replace("/login");
                return {status: 1, message: "Votre session a expiré."};
            }

            // All releases/captures/cancellations are reconciled server-side so
            // a stale client can never refund a wallet or cancel another hold.
            let reconciliation = null;
            const reconciliationWarnings = [];
            try {
                const response = await serverRequest('post', '/bookings/reconcile', {
                    mode: state.modeCo,
                });
                reconciliation = response.data?.data;
                if( response.data?.status !== 'ok' || !reconciliation ){
                    throw new Error("Réponse de synchronisation invalide.");
                }
            }
            catch(error){
                console.error("getSoldes reconciliation error:", error);
                reconciliationWarnings.push(
                    error.response?.data?.message || "Impossible de synchroniser les réservations."
                );
            }

            if (!current()) return {status: 2, stale: true};
            // Webhooks remain the production source of truth, but this
            // authenticated reconciliation also completes synchronous local
            // tests after a lost response or a temporarily closed app.
            try {
                await serverRequest('post', '/payments/topups/reconcile', {
                    mode: state.modeCo,
                });
            } catch (error) {
                console.warn("Top-up reconciliation unavailable:", error);
                reconciliationWarnings.push(
                    error.response?.data?.message || "Impossible de synchroniser les rechargements."
                );
            }

            if (!current()) return {status: 2, stale: true};
            let { data: account, error: errorAccount } = await supabase
                .from('account')
                .select("id, credit, gain")
                .eq('user_id', owner)
                .single();

            if (!current()) return {status: 2, stale: true};
            // Compatibilité temporaire avec une base antérieure à la migration
            // 015. La réservation atomique exige toujours les migrations serveur,
            // mais l'affichage du solde historique ne doit pas échouer pour autant.
            if (
                errorAccount?.code === '42703'
                && String(errorAccount.message || '').includes('account.gain')
            ) {
                const legacyAccount = await supabase
                    .from('account')
                    .select("id, credit")
                    .eq('user_id', owner)
                    .single();
                if (!current()) return {status: 2, stale: true};
                account = legacyAccount.data ? { ...legacyAccount.data, gain: 0 } : null;
                errorAccount = legacyAccount.error;
                reconciliationWarnings.push(
                    "Les gains chauffeur seront disponibles après la mise à jour de la base."
                );
            }

            if(errorAccount || !account){
                console.error("getSoldes account error:", errorAccount);
                return {status: 2, message: humanizeSupabaseError(errorAccount, "Une erreur s'est produite lors de la récupération de votre solde.")};
            }

            const refreshedCredit = Number(account.credit) || 0;
            state.gain.wallet = Number(account.gain) || 0;

            try {
                const { data: connectBalance } = await serverRequest('get', '/connect/balance', {
                    mode: state.modeCo,
                });
                if (!current()) return {status: 2, stale: true};
                state.gain.transit = connectBalance.total / 100;
                state.gain.pending = (connectBalance.pendingEarnings / 100).toFixed(2);
                state.connect_account_available = true;
                state.payouts_enabled = Boolean(connectBalance.payoutsEnabled);
                state.connect_activation_required = Boolean(connectBalance.activationRequired);
            } catch (error) {
                if (!current()) return {status: 2, stale: true};
                console.error("Unable to retrieve Connect balance:", error);
                state.gain.transit = 0;
                state.gain.pending = 0;
            }

            // console.log("state.gain", state.gain);

            state.soldes = refreshedCredit;
            state.pendingDebit = 0;

            const { data: pendingDebits, error: pendingError } = await supabase
                .from('stripe_pending_capture')
                .select('amount')
                .eq('passenger_account_id', account.id)
                .eq('status', 'requires_capture');

            if (!current()) return {status: 2, stale: true};
            if(pendingError){
                console.error("pending debit error:", pendingError);
            }
            const cardHold = (pendingDebits || []).reduce(
                (total, record) => total + (Number(record.amount) || 0),
                0
            ) / 100;

            const { data: walletReserved, error: walletError } = await supabase
                .from('booking')
                .select(`
                    id,
                    trip:trip_id (
                        price
                    )
                `)
                .eq('passenger_account_id', account.id)
                .eq('payment_status', 'wallet_reserved');

            if (!current()) return {status: 2, stale: true};
            if(walletError){
                console.error("wallet reserved error:", walletError);
            }
            const walletHold = (walletReserved || []).reduce(
                (total, booking) => total + (Number(booking.trip?.price) || 0),
                0
            );

            state.pendingDebit = parseFloat((cardHold + walletHold).toFixed(2));

            return {
                status: 0,
                message: `Votre solde est de : ${state.soldes}`,
                reconciliation,
                warnings: reconciliationWarnings,
            };
        },
        async addCredit({state}, infosLoad){
            const owner=state.userUid, generation=state.accountGeneration;
            const current=()=>state.userUid===owner && state.accountGeneration===generation;
            if(!owner)return {status:2,stale:true};
            const credit=Number(infosLoad.credit), attemptId=infosLoad.attemptId || createRequestId();
            if(infosLoad.expectedUserId && (infosLoad.expectedUserId!==owner || infosLoad.accountGeneration!==generation))return {status:2,stale:true};
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!current())return {status:2,stale:true};
            if( ! sessionChecked ){
                router.replace("/login");
                return {status: 1, message: "Votre session a expiré."};
            }

            if (infosLoad.no_source) {
                return {
                    status: 2,
                    message: "Le paiement doit être confirmé avant de créditer le compte.",
                };
            }

            try {
                const { data: paymentIntent } = await serverRequest('post', '/payments/topup-intent', {
                    mode: state.modeCo, expectedUserId: owner,
                    data: {
                        amount: Math.round(credit * 100),
                        confirmWithSavedMethod: true,
                        attemptId,
                    },
                });

                if(!current())return {status:2,stale:true};
                if (paymentIntent.status === 'requires_action') {
                    return {
                        status: 3,
                        paymentIntentId: paymentIntent.id,
                        message: "Une authentification bancaire est nécessaire.",
                    };
                }
                if (paymentIntent.status === 'processing') {
                    return {
                        status: 1,
                        pending: true,
                        message: "Le paiement est en cours de traitement. Votre solde sera actualisé dès sa validation.",
                    };
                }
                if (paymentIntent.status !== 'succeeded') {
                    return {status: 2, message: "Le paiement n'a pas été validé."};
                }

                const { data: account, error } = await supabase
                    .from('account')
                    .select('credit')
                    .eq('user_id', owner)
                    .single();
                if(!current())return {status:2,stale:true};
                if (error) {
                    throw error;
                }

                state.soldes = account.credit;
                return {status: 0, message: "Votre compte a bien été crédité !"};
            } catch (error) {
                if(!current())return {status:2,stale:true};
                console.error("addCredit error:", error);
                const response = error.response;
                return {
                    status: 2,
                    code: response?.data?.code || 'TOPUP_FAILED',
                    retriable: response?.data?.retriable ?? (!response || response.status >= 500),
                    message: response?.data?.message || "Le rechargement n'a pas pu être effectué.",
                };
            }
        },
        async transfertGain({state}, payload){
            const owner=state.userUid, generation=state.accountGeneration;
            const current=()=>state.userUid===owner && state.accountGeneration===generation;
            if(!owner)return {status:2,stale:true};
            if(payload.expectedUserId && (payload.expectedUserId!==owner || payload.accountGeneration!==generation))return {status:2,stale:true};
            try {
                const { data: response } = await serverRequest('post', '/wallet/earnings-to-credit', {
                    mode: state.modeCo, expectedUserId: owner,
                    data: {
                        amount: Number(payload.credit),
                        requestId: payload.requestId,
                    },
                });
                if(!current())return {status:2,stale:true};
                const conversion = response?.data;
                if(response?.status !== 'ok' || !conversion){
                    throw new Error("Réponse de conversion invalide.");
                }
                state.soldes = Number(conversion.credit) || 0;
                state.gain.wallet = Number(conversion.gain) || 0;
                return {status: 0, message: "Vos gains ont été ajoutés à vos crédits."};
            } catch (error) {
                if(!current())return {status:2,stale:true};
                return {
                    status: 2,
                    message: error.response?.data?.message || "Le transfert de vos gains a échoué.",
                };
            }
        },
        async getTravels({state, commit}){
            const owner = state.userUid, generation = state.accountGeneration;

            const request = ++passengerTripsRequest;
            const current = () => request === passengerTripsRequest && owner === state.userUid && generation === state.accountGeneration;

            try{
                if(!await store.dispatch("search/getVillages")) {
                    throw new Error("Impossible de charger les villages.");
                }
                const resolveVillage = (id) => store.getters["search/GET_VILLAGE_BY_ID"](id);
                const bookings = await fetchPassengerTrips({ passengerAccountId: state.userId, includeHistory: false });
                if (!current()) return {status: 2, stale: true};
                const normalizedTrips = normalizePassengerTrips(bookings, resolveVillage);

                if( normalizedTrips.length === 0 ){
                    state.profil.myTravels = [];
                    state.history.datesTripPassenger = [];
                    commit('trip/CLEAR_RATINGS_BY_TRIP_IDS', [], { root: true });
                    return {status: 0, data: []};
                }

                const groupedInfos = normalizedTrips.reduce((acc, info) => {
                    if( store.state.trip.notMessageVue.includes(info.id + "") )
                        info.notifMessage = true;

                    const departureDate = new Date(info.departure_time);
                    const formattedDate = dateConverter(departureDate);
                    
                    const existingGroup = acc.find(group => group.date === formattedDate);
                    if ( existingGroup ) {
                        existingGroup.infos.push(info);
                    }
                    else {
                        acc.push({
                            date: formattedDate,
                            infos: [info],
                        });
                    }
                    
                    return acc;
                }, []);
                
                console.log("groupedInfos", groupedInfos);
    
                state.profil.myTravels = groupedInfos;
                state.history.datesTripPassenger = normalizedTrips.map((trip) => trip.departure_time);
                commit('trip/CLEAR_RATINGS_BY_TRIP_IDS', normalizedTrips.map((trip) => trip.id), { root: true });
                console.log("_trips:", normalizedTrips, state.profil.myTravels);
    
                return {status: 0, message: "success", data: groupedInfos};
            }
            catch(error){
                if (!current()) return {status: 2, stale: true};
                console.error("getTravels error:", error);
                return {status: 1, message: 'Impossible de charger vos réservations. Vérifiez la connexion puis réessayez.'};
            }
        },
        async getPublish({state}){
            const owner = state.userUid, generation = state.accountGeneration;

            const request = ++driverTripsRequest;
            const current = () => request === driverTripsRequest && owner === state.userUid && generation === state.accountGeneration;

            try{
                const ownTrips = await store.dispatch("search/getOwnTrip");
                if (!current()) return {status: 2, stale: true};
                if(ownTrips?.status !== 0) {
                    return ownTrips || {status: 1, message: "Impossible de charger les trajets."};
                }

                if(!Array.isArray(ownTrips.data)) throw new Error('Réponse de chargement invalide.');
                const publish = ownTrips.data;

                let _trips = [];
                for (let index = 0; index < publish.length; index++) {
                    const trajet = publish[index]
                    if(trajet){
                        // trajet.name = "Vous";
                        if( store.state.trip.notMessageVue.includes(trajet.id + "") )
                            trajet.notifMessage = true;
                        _trips.push(trajet);
                    }
                }

                if( _trips.length == 0 ){
                    state.profil.myPublish = [];
                    state.history.datesTripDriver = [];
                    return {status: 0, data: []};
                }

                const groupedInfos = _trips.reduce((acc, info) => {
                    const departureDate = new Date(info.departure_time);
                    const formattedDate = dateConverter(departureDate);
                
                    const existingGroup = acc.find(group => group.date === formattedDate);
                    if ( existingGroup ) {
                        existingGroup.infos.push(info);
                        existingGroup.infos = existingGroup.infos.sort((a, b) => {
                            let dateA = new Date(a.departure_time);
                            let dateB = new Date(b.departure_time);
                      
                            return dateA.getTime() - dateB.getTime();
                        })
                    }
                    else {
                        acc.push({
                            date: formattedDate,
                            infos: [info],
                        });
                    }
                
                    return acc;
                }, []);
            
                console.log("groupedInfos:", groupedInfos);
    
                state.profil.myPublish = groupedInfos;
                state.history.datesTripDriver = _trips.map((trip) => trip.departure_time);
                console.log("_trips:", _trips, state.profil.myPublish);

                return {status: 0, message: "success", data: groupedInfos};
            }catch(error){
                if(!current()) return {status: 2, stale: true};
                console.error('getPublish error:', error);
                return {status: 1, message: 'Impossible de charger vos publications. Vérifiez la connexion puis réessayez.'};
            }
        },
        async removeBooking({state, commit}, infos){
            const tripId = Number(infos?.trip_id);
            if( !Number.isSafeInteger(tripId) || tripId <= 0 ){
                return {status: 1, message: "Trajet introuvable."};
            }

            try {
                const response = await serverRequest('delete', `/bookings/trip/${tripId}`, {
                    mode: state.modeCo,
                });
                const cancellation = response.data?.data;
                if( response.data?.status !== 'ok' || !cancellation ){
                    throw new Error("Réponse d'annulation invalide.");
                }
                const departureTime = cancellation.trip?.departure_time || infos?.departure_time;
                if( departureTime ){
                    commit('REMOVE_HISTORY_DATE_BY_VALUE', {
                        type: 'passenger',
                        departure_time: departureTime,
                    });
                }
                commit('trip/SET_RATINGS_REMOVE', { id: tripId }, { root: true });
                await store.dispatch("profil/getSoldes");

                return {
                    status: 0,
                    message: cancellation.alreadyCanceled
                        ? "Cette réservation était déjà annulée."
                        : "Suppression effectuée avec succès.",
                    data: cancellation,
                };
            }
            catch(error){
                console.error("removeBooking error:", error);
                return {
                    status: 1,
                    message: error.response?.data?.message || "Une erreur s'est produite, veuillez réessayer plus tard.",
                };
            }

        },
        async cancelTripPublication({state, commit, dispatch}, tripInfos){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return {status: 1, message: "Session expirée"};
            }

            const tripId = tripInfos?.id;
            if( !tripId ){
                return {status: 2, message: "Trajet introuvable"};
            }

            try {
                const response = await serverRequest('delete', `/trips/${tripId}`, {
                    mode: state.modeCo,
                });
                const cancellation = response.data?.data;
                if( response.data?.status !== 'ok' || !cancellation ){
                    throw new Error("Réponse d'annulation invalide.");
                }
                const canceledTrip = cancellation.trip || tripInfos;

                if( canceledTrip?.departure_time ){
                    commit('REMOVE_HISTORY_DATE_BY_VALUE', {
                        type: 'driver',
                        departure_time: canceledTrip.departure_time,
                    });
                }
                state.profil.myPublish = state.profil.myPublish.reduce((acc, group) => {
                    const remaining = group.infos.filter((info) => info.id != tripId);
                    if( remaining.length > 0 ){
                        acc.push({ ...group, infos: remaining });
                    }
                    return acc;
                }, []);

                // Refresh display state only; settlement and notifications have
                // already been completed atomically by the backend.
                await store.dispatch("profil/getSoldes");
                await dispatch('getPublish');
                return {status: 0, message: "Trajet annulé.", data: cancellation};
            }
            catch(error){
                console.error("cancelTripPublication error:", error);
                return {
                    status: 2,
                    message: error.response?.data?.message || "Impossible d'annuler ce trajet.",
                };
            }
        },
        async buildHistoriqueBooking({state}){
            const owner=state.userUid;state.history.load=true;state.history.error=null;
            try{
                if(!await store.dispatch('search/getVillages'))throw new Error('Villages indisponibles.');
                const rows=await fetchProfileHistory(supabase,{userId:owner,accountId:state.userId,resolveVillage:id=>store.getters['search/GET_VILLAGE_BY_ID'](id)});
                if(state.userUid===owner)state.history.historycalBooking=mapToObject(groupByDate(rows));
            }catch{if(state.userUid===owner)state.history.error='Votre historique n’a pas pu être chargé. Réessayez.';}
            finally{if(state.userUid===owner)state.history.load=false;}
        },
        // stripe
        async getProvider({state}){
            const owner = state.userUid, generation = state.accountGeneration;
            const current = () => state.userUid === owner && state.accountGeneration === generation;
            try {
                let providerPayload;
                try {
                    const { data } = await serverRequest('get', '/connect/account', {
                        mode: state.modeCo,
                    });
                    providerPayload = data;
                } catch (error) {
                    if (!current()) return {status: 2, stale: true};
                    if (error.response?.status !== 404) throw error;

                    // Legacy users may not have a Connect account yet. This
                    // idempotent endpoint creates or repairs it before publish.
                    const { data } = await serverRequest('post', '/account/payment-profile', {
                        mode: state.modeCo,
                    });
                    providerPayload = data?.provider;
                }

                if (!current()) return {status: 2, stale: true};
                const provider = normalizeConnectProvider(providerPayload);
                if (!provider.id) throw new Error("Compte Stripe Connect introuvable.");

                console.log("retrieve provider : ", provider);
                store.state.auth.provider_id = provider.id;
                store.state.auth.stripe_provider = provider;
                state.connect_account_available = true;
                state.payouts_enabled = provider.payouts_enabled;
                state.connect_activation_required = provider.activation_required;
                return { status: 0, provider };
            } catch (error) {
                if (!current()) return {status: 2, stale: true};
                console.error("getProvider error:", error);
                store.state.auth.provider_id = "";
                store.state.auth.stripe_provider = null;
                state.connect_account_available = false;
                state.payouts_enabled = false;
                state.connect_activation_required = true;
                return {
                    status: 1,
                    message: error.response?.data?.message || "Impossible d'initialiser le compte de versement.",
                };
            }
        },
        async identityChecked({state}){
            try {
                const { data } = await serverRequest('post', '/connect/identity-confirm', {
                    mode: state.modeCo,
                });
                if (data?.identity) {
                    state.identity = true;
                    return {status: 0, message:"Mise à jour effectuée avec succées"};
                }
            }
            catch(error){
                console.error("identityChecked error:", error);
                return {
                    status: 1,
                    message: error.response?.data?.message || "Une erreur s'est produite",
                };
            }

            if(state.identity){
                state.identity = true;
                return {status: 0, message:"Mise à jour effectuée avec succées"};
            }
            return {status: 2, message: "Un problème est survenue"};
        },
    },
}

const initialProfileState = JSON.parse(JSON.stringify(profilModule.state));
export default profilModule;
