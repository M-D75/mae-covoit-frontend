// import { createStore } from 'vuex'
// import { createClient } from '@supabase/supabase-js'


import store from '../store';
import supabase from '@/utils/supabaseClient.js';
import { dateConverter, groupByDate, mapToObject } from '@/utils/utils.js';
import router from '@/router';

import { fetchPassengerTrips, normalizePassengerTrips } from '@/services/travels.js';
import { humanizeSupabaseError } from '@/utils/errorMessages.js';
import { serverRequest } from '@/utils/serverApi.js';
import { createRequestId } from '@/utils/requestId.js';

export default {
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
        userUid: "",
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
                nom: "Ledou",
                prenom: "BG",
                email: "",
                tel: "",
                adress: {
                    principal: "",
                    complement: "",
                    code_postal: "",
                    commune: "",
                },
                preferences: [
                    {
                        about: "discution",
                        prependIconColor: "var(--blue-color)",
                        prependIcon:"mdi-forum",
                        text:"j'aime bien discuter-",
                        chip:false,
                        chipIcon: null,
                        switchBtn: false,
                        chipText: "",
                    },
                    {
                        about: "smoke",
                        prependIconColor: "#ff5353",
                        prependIcon:"mdi-smoking-off",
                        text:"Pas de cigarette en voiture-",
                        chip:false,
                        chipIcon: null,
                        chipText: "",

                    },
                    {
                        about: "music",
                        prependIconColor: "#9fcb66",
                        prependIcon:"mdi-music",
                        text:"Music tout au long !-",
                        chip:false,
                        chipIcon: null,
                        chipText: "",

                    },
                    {
                        about: "animal",
                        prependIconColor: "#ff9c00",
                        prependIcon:"mdi-paw",
                        text:"J'aime bien les animaux-",
                        chip:false,
                        chipIcon: null,
                        chipText: "",
                    },
                ],
            },
            myTravels: [],
            myPublish: [],
            loadGetTripPublish: false,
        },
        history: {
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
        SET_USER_UID(state, userUid) {
            state.userUid = userUid;
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
            try {
                const [{ count, error }, summaryResponse] = await Promise.all([
                    supabase
                        .from('trip')
                        .select('id', { count: 'exact', head: true })
                        .eq("driver_id", state.userUid),
                    serverRequest('get', `/ratings/accounts/${state.userId}/summary`, {
                        mode: state.modeCo,
                    }),
                ]);
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
                console.error("getNotation error:", error);
                return {
                    status: 1,
                    message: error.response?.data?.message || "Erreur lors du chargement de la notation.",
                };
            }
        },
        async addCar({state}, infos){

            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            const { data, error } = await supabase
                .from('car')
                .insert([
                    { driver_id: state.userUid, model: infos.model, license_plate: infos.licence_plate, brand: infos.brand, color: infos.color, seats: infos.seats }
                ])
                .select()

            if(error){
                console.log("Error add car:", error);
                return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
            }
        
            console.log("data-add-car:", data);
            return {status: 0, message: "Votre véhicule à bien été ajouté."};
        },
        async getCars({state}){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            
            let { data: cars, error } = await supabase
                .from('car')
                .select("*")
                .eq('driver_id', state.userUid);
                    

            if(error){
                console.log("Error add car:", error);
                return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
            }
        
            state.cars = cars;
            console.log("data-get-car:", cars);
            return {status: 0, message: "Votre véhicule à bien été ajouté."};

        },
        async updateAutoValidation({ state }){
            const { data, error } = await supabase
                .from('settings')
                .update({ auto_accept_trip: state.auto_accept_trip })
                .eq('account_id', state.userId)
                .select();

            if(error){
                console.error("Error", error)
                state.auto_accept_trip = !state.auto_accept_trip;
                return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
            }

            if( data ){
                // console.log("data auto_accept_trip : ", data);
                state.auto_accept_trip = data[0].auto_accept_trip;
            }

            console.log("autovalidation", state.auto_accept_trip ? "activated" : "desactivated");
            return {status: 0, message: ""};
        },
        async updateAvatar({state}, avatar){
            // update
            await supabase
                .from('account')
                .update({ avatar: avatar })
                .eq('user_id', state.userUid)
                .select()
        },
        async updatePreference({state}){
            
            const { data, error } = await supabase
                .from('settings')
                .update({ prefer: state.profil.infos_perso.preferences.map( (pref) => pref.index ) })
                .eq('account_id', state.userId)
                .select()

            if( error ){
                console.error("Error update setting : ", error)
            }

            console.log("setting-update", data);

        },
        async registerVehicul(){
            
        },
        async getSoldes({state}){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
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

            let { data: account, error: errorAccount } = await supabase
                .from('account')
                .select("id, credit, gain")
                .eq('user_id', state.userUid)
                .single();

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
                    .eq('user_id', state.userUid)
                    .single();
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
                state.gain.transit = connectBalance.total / 100;
                state.gain.pending = (connectBalance.pendingEarnings / 100).toFixed(2);
            } catch (error) {
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
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
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
                const attemptId = infosLoad.attemptId || createRequestId();
                const { data: paymentIntent } = await serverRequest('post', '/payments/topup-intent', {
                    mode: state.modeCo,
                    data: {
                        amount: Math.round(Number(infosLoad.credit) * 100),
                        confirmWithSavedMethod: true,
                        attemptId,
                    },
                });

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
                    .eq('user_id', state.userUid)
                    .single();
                if (error) {
                    throw error;
                }

                state.soldes = account.credit;
                return {status: 0, message: "Votre compte a bien été crédité !"};
            } catch (error) {
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
            try {
                const { data: response } = await serverRequest('post', '/wallet/earnings-to-credit', {
                    mode: state.modeCo,
                    data: {
                        amount: Number(payload.credit),
                        requestId: payload.requestId,
                    },
                });
                const conversion = response?.data;
                if(response?.status !== 'ok' || !conversion){
                    throw new Error("Réponse de conversion invalide.");
                }
                state.soldes = Number(conversion.credit) || 0;
                state.gain.wallet = Number(conversion.gain) || 0;
                return {status: 0, message: "Vos gains ont été ajoutés à vos crédits."};
            } catch (error) {
                return {
                    status: 2,
                    message: error.response?.data?.message || "Le transfert de vos gains a échoué.",
                };
            }
        },
        async getTravels({state, commit}){

            state.profil.myTravels = [];
            state.history.datesTripPassenger = [];

            try{
                const resolveVillage = (id) => store.getters["search/GET_VILLAGE_BY_ID"](id);
                const bookings = await fetchPassengerTrips({ passengerAccountId: state.userId, includeHistory: false });
                const normalizedTrips = normalizePassengerTrips(bookings, resolveVillage);

                if( normalizedTrips.length === 0 ){
                    console.error("Error : Aucun trajets; code 2")
                    state.history.datesTripPassenger = [];
                    commit('trip/CLEAR_RATINGS_BY_TRIP_IDS', [], { root: true });
                    return {status: 2, message: "Aucun trajets"};
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
    
                return {status: 0, message: "success"};
            }
            catch(error){
                console.error("getTravels error:", error);
                state.history.datesTripPassenger = [];
                commit('trip/CLEAR_RATINGS_BY_TRIP_IDS', [], { root: true });
                return {status: 1, message: "Aucun trajet"};
            }
        },
        async getPublish({state}){
            const currentDate = new Date();
            const minDisplayDate = currentDate.getTime() - (60 * 60 * 1000);

            state.profil.myPublish = [];
            state.history.datesTripDriver = [];

            await store.dispatch("search/getOwnTrip");

            if( ! store.state.search.trajets ){
                console.error("Error getPush 1")
                state.history.datesTripDriver = [];
                return {status: 1, message: "Aucun trajet"};
            }

            let publish = store.state.search.trajets;

            let _trips = [];
            for (let index = 0; index < publish.length; index++) {
                const trajet = publish[index]
                if(trajet){
                    // trajet.name = "Vous";
                    if( store.state.trip.notMessageVue.includes(trajet.id + "") )
                        trajet.notifMessage = true;
                    const tripTime = new Date(trajet.departure_time).getTime();
                    if( tripTime >= minDisplayDate )
                        _trips.push(trajet);
                }
            }

            if( _trips.length == 0 ){
                console.error("Error getPush 2, Aucune publication")
                state.history.datesTripDriver = [];
                return {status: 2, message: "Aucun trajets"};
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

            return {status: 0, message: "success"};
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

            state.history.load = true;

            try{
                const resolveVillage = (id) => store.getters["search/GET_VILLAGE_BY_ID"](id);
                const bookings = await fetchPassengerTrips({ passengerAccountId: state.userId, includeHistory: true });
                const normalized = normalizePassengerTrips(bookings, resolveVillage);

                const simplified = normalized.map((trip_current) => ({
                    depart: trip_current.depart,
                    destination: trip_current.destination,
                    departure_time: trip_current.departure_time,
                    avatar: trip_current.avatar != null ? trip_current.avatar : "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned",
                    price: trip_current.price,
                }));
    
                console.log("_bookings", simplified);
    
                const bookingGrouped = mapToObject(groupByDate(simplified));
                console.log("grouped: ", bookingGrouped);
                state.history.historycalBooking = bookingGrouped;
            }
            catch(error){
                console.error("buildHistoriqueBooking error:", error);
            }
            finally{
                state.history.load = false;
            }
        },
        // stripe
        async getProvider({state}){
            const { data: provider } = await serverRequest('get', '/connect/account', {
                mode: state.modeCo,
            });
            console.log("retrieve provider : ", provider);
            store.state.auth.provider_id = provider.id;
            store.state.auth.stripe_provider = provider;
            state.payouts_enabled = provider.payouts_enabled;
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
