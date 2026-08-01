// import { createStore } from 'vuex'
import store from '../store'; 

import { serverRequest } from '@/utils/serverApi.js';
import supabase from '@/utils/supabaseClient.js';
import router from '@/router';
import { formaterDateUTC, getRandomInt, getRandomString, getFutureTime, tomorowDate } from '@/utils/utils.js'

const TRIP_SEARCH_SELECT = `
    id,
    driver_id,
    village_departure_id,
    village_arrival_id,
    departure_time,
    max_seats,
    price,
    route,
    car_id,
    car (*),
    account (*),
    booking (
        *,
        account (*)
    )`;

function isMissingCancellationColumn(error) {
    return error?.code === '42703'
        && String(error?.message || '').includes('cancellation_pending_at');
}

/**
 * La colonne d'annulation arrive avec les migrations de durcissement. Pendant
 * la transition, une base plus ancienne doit encore pouvoir rechercher ses
 * trajets ; Supabase renvoie sinon 42703 et l'interface affiche une liste vide.
 */
async function executeTripSearch(buildQuery) {
    let result = await buildQuery(true);
    if (isMissingCancellationColumn(result.error)) {
        console.warn(
            'La migration cancellation_pending_at manque ; recherche en mode compatible.',
        );
        result = await buildQuery(false);
    }
    return result;
}


export default {
    namespaced: true,
    state: {
        // user choice
        depart: "",
        destination: "",
        date: null,
        nbPassenger: 1,
        trajetSelected: {},
        // serveur
        villages: [],
        communesHistory: [],
        communesFrequency: {},
        trajets: [
        ],
        accounts: [],
    },
    getters: {
        getVillagesByName: (state) => (name) => {
            return state.villages.find(infoVillage => infoVillage.village.toLowerCase() == name.toLowerCase());
        },
        GET_ID_VILLAGE_BY_NAME: (state) => (name) => {
            return state.villages.find(infoVillage => infoVillage.village.toLowerCase() == name.toLowerCase()).id;
        },
        GET_VILLAGE_BY_ID: (state) => (id) => {
            return state.villages.find(infoVillage => infoVillage.id == id).village;
        },
        GET_ACCOUNTS: (state) => {
            return state.accounts
        },
        historiqueTrie: (state) => {
            return Object.entries(state.communesFrequency)
                .sort((a, b) => b[1] - a[1])
                .map(item => item[0]);
        },
    },
    mutations: {
        SET_VILLAGES(state, villages) {
            state.villages = villages;
        },
        SET_DEPART(state, depart){
            state.depart = depart;
        },
        SET_DESTINATION(state, destination){
            state.destination = destination;
        },
        SET_NB_PASSAGER(state, number){
            state.nbPassenger = number;
        },
        SET_TRAJETS(state, trips){
            state.trajets = trips;
        },
        SET_ACCOUNTS(state, accounts){
            state.accounts = accounts;
        },
        SET_TRAJET_SELECTED(state, trajet){
            state.trajetSelected = trajet;
        },
        ajouterCommune(state, commune) {
            if (state.communesFrequency[commune]) {
                state.communesFrequency[commune]++;
            }
            else {
                state.communesFrequency[commune] = 1;
            }
        },
        initialiserHistorique(state, historique) {
            state.communesFrequency = historique;
        },
    },
    actions: {
        ajouterAuHistorique({ commit }, commune) {
            commit('ajouterCommune', commune);
        },
        chargerHistorique({ commit, getters, state }) {
            const historiqueEnregistre = localStorage.getItem('communesFrequency');
            if (historiqueEnregistre) {
                commit('initialiserHistorique', JSON.parse(historiqueEnregistre));
                state.communesHistory = getters.historiqueTrie;
            }
        },
        sauvegarderHistorique({ state }) {
            localStorage.setItem('communesFrequency', JSON.stringify(state.communesFrequency));
        },
        async getVillages({ state, commit }) {
            if( state.villages.length == 0 ){
                const { data: villageList, error } = await supabase
                    .from('village_list')
                    .select('*');

                if(error){
                    console.error("Error, impossible de récuperer les villages :", error);
                    return false;
                }

                commit('SET_VILLAGES', villageList || []);
            }
            else {
                console.log("Get Villages Already done !", state.villages);
            }
            return true;
        },
        async getTrajetsFake({ state }){

            const travelList = [];

            for (let i = 0; i < Math.ceil(Math.random() * 5)+1; i++) {
                travelList.push({
                    avatar: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned",
                    depart: "Combani",
                    departure_time: getFutureTime(2),
                    destination: "Mamoudzou",
                    driver_id: getRandomString(36),
                    hour_end: `${getRandomInt(2).toString().padStart(2, '0')}:${getRandomInt(60).toString().padStart(2, '0')}`,
                    hour_start: `${getRandomInt(2).toString().padStart(2, '0')}:${getRandomInt(60).toString().padStart(2, '0')}`,
                    id: getRandomInt(10),
                    max_seats: getRandomInt(10),
                    name: getRandomString(2),
                    passenger_number: getRandomInt(10),
                    price: getRandomInt(10)
                });
            }

            state.trajets = travelList;
            console.log("travelList Fake", travelList);

        },
        async getTrajets({ commit, getters }) {
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!sessionChecked){
                router.replace("/login");
                return;
            }

            const { data: trips, error } = await executeTripSearch((withCancellationFilter) => {
                let query = supabase
                    .from('trip')
                    .select(TRIP_SEARCH_SELECT)
                    .neq('driver_id', store.state.profil.userUid);

                if (withCancellationFilter) {
                    query = query.is('cancellation_pending_at', null);
                }
                return query;
            });

            if ( error ) {
                console.error(error);
                return;
            }

            console.log("Joneess", trips);
            
            let _trips = [];
            for (let index = 0; index < trips.length; index++) {
                const trip = trips[index];
                const tripAccount = trip.account || {};

                let isoDate = trip.departure_time;
                let date = new Date(isoDate);

                let offset = date.getTimezoneOffset();
                date = new Date(date.getTime() - (offset * 60000));

                let hours = date.getUTCHours().toString().padStart(2, '0');
                let minutes = date.getUTCMinutes().toString().padStart(2, '0');
                let departure_time = `${hours}:${minutes}`;

                date = new Date((date.getTime() + (parseInt(trip.route.infosGoogle.duration.replace("s", "")) * 1000) ) - (offset * 60000));

                hours = date.getUTCHours().toString().padStart(2, '0');
                minutes = date.getUTCMinutes().toString().padStart(2, '0');

                const arrival_time = `${hours}:${minutes}`;
                // jointure : account,trip,booking
                const sanitizedBookings = (trip.booking || []).filter((booking) => !booking.passenger_no_show);
                const driverFirstname = tripAccount.firstname || "Chauffeur";
                const driverLastname = tripAccount.lastname || "";
                const driverAvatar = tripAccount.avatar || null;

                const _trip  = {
                    id: trip.id,
                    driver_id: trip.driver_id,
                    driver_account_id: tripAccount.id || null,
                    name: `${driverFirstname} ${driverLastname}`.trim(),
                    avatar: driverAvatar,
                    depart: getters.GET_VILLAGE_BY_ID(trip.village_departure_id),
                    destination: getters.GET_VILLAGE_BY_ID(trip.village_arrival_id),
                    departure_time: trip.departure_time,
                    hour_start: departure_time,
                    hour_end: arrival_time,
                    price: trip.price ? trip.price : (Math.ceil(Math.random()*4)+1),
                    passenger_number: sanitizedBookings.filter((booking) => booking.is_accepted).length,
                    bookings: sanitizedBookings,
                    max_seats: trip.max_seats,
                    route: trip.route,
                    car: trip.car,
                };
                _trips.push(_trip);
            }

            console.log("trips-search:", _trips);
            
            commit('SET_TRAJETS', _trips);

            return true
        },
        async getTrajetsDate({ commit, getters }, infos) {
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!sessionChecked){
                router.replace("/login");
                return;
            }

            const tomorow = tomorowDate(infos.date);

            console.log("date:", infos, infos.date, tomorow)

            const { data: trips, error } = await executeTripSearch((withCancellationFilter) => {
                let query = supabase
                    .from('trip')
                    .select(TRIP_SEARCH_SELECT)
                    .neq('driver_id', store.state.profil.userUid)
                    .gte("departure_time", formaterDateUTC(infos.date))
                    .lt("departure_time", formaterDateUTC(tomorow));

                if (withCancellationFilter) {
                    query = query.is('cancellation_pending_at', null);
                }
                return query;
            });

            if ( error ) {
                console.error(error);
                return;
            }

            console.log("Joneess", trips);
            
            let _trips = [];
            for (let index = 0; index < trips.length; index++) {
                const trip = trips[index];
                const tripAccount = trip.account || {};

                let isoDate = trip.departure_time;
                let date = new Date(isoDate);

                let offset = date.getTimezoneOffset();
                date = new Date(date.getTime() - (offset * 60000));

                let hours = date.getUTCHours().toString().padStart(2, '0');
                let minutes = date.getUTCMinutes().toString().padStart(2, '0');
                let departure_time = `${hours}:${minutes}`;

                date = new Date((date.getTime() + (parseInt(trip.route.infosGoogle.duration.replace("s", "")) * 1000) ) - (offset * 60000));

                hours = date.getUTCHours().toString().padStart(2, '0');
                minutes = date.getUTCMinutes().toString().padStart(2, '0');

                const arrival_time = `${hours}:${minutes}`;
                // jointure : account,trip,booking
                const sanitizedBookings = (trip.booking || []).filter((booking) => !booking.passenger_no_show);
                const _trip  = {
                    id: trip.id,
                    driver_id: trip.driver_id,
                    driver_account_id: tripAccount.id || null,
                    name: `${tripAccount.firstname || ''} ${tripAccount.lastname || ''}`.trim() || "Chauffeur",
                    avatar: tripAccount.avatar || null,
                    depart: getters.GET_VILLAGE_BY_ID(trip.village_departure_id),
                    destination: getters.GET_VILLAGE_BY_ID(trip.village_arrival_id),
                    departure_time: trip.departure_time,
                    hour_start: departure_time,
                    hour_end: arrival_time,
                    price: trip.price ? trip.price : (Math.ceil(Math.random()*4)+1),
                    passenger_number: sanitizedBookings.filter((booking) => booking.is_accepted).length,
                    bookings: sanitizedBookings,
                    max_seats: trip.max_seats,
                    route: trip.route,
                    car: trip.car,
                };
                _trips.push(_trip);
            }

            console.log("trips-search:", _trips);
            
            commit('SET_TRAJETS', _trips);

            return true
        },
        async getTrajetsId({ commit, getters }, infos) {
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!sessionChecked){
                router.replace("/login");
                return;
            }

            console.log("infos", infos, infos.user_uid, formaterDateUTC(new Date()), parseInt(infos.ids));

            const { data: trips, error } = await executeTripSearch((withCancellationFilter) => {
                let query = supabase
                    .from('trip')
                    .select(TRIP_SEARCH_SELECT)
                    .eq('id', parseInt(infos.ids))
                    .gt("departure_time", formaterDateUTC(new Date()))
                    .neq('driver_id', store.state.profil.userUid);

                if (withCancellationFilter) {
                    query = query.is('cancellation_pending_at', null);
                }
                return query;
            });

            console.log("-----------------------------------");

            if ( error ) {
                console.error("Error 1:", error);
                return {status: 1, data: null}
            }

            console.log("Joneess", trips);
            
            let _trips = [];
            for (let index = 0; index < trips.length; index++) {
                const trip = trips[index];
                const tripAccount = trip.account || {};

                let isoDate = trip.departure_time;
                let date = new Date(isoDate);

                let offset = date.getTimezoneOffset();
                date = new Date(date.getTime() - (offset * 60000));

                let hours = date.getUTCHours().toString().padStart(2, '0');
                let minutes = date.getUTCMinutes().toString().padStart(2, '0');
                let departure_time = `${hours}:${minutes}`;

                date = new Date((date.getTime() + (parseInt(trip.route.infosGoogle.duration.replace("s", "")) * 1000) ) - (offset * 60000));

                hours = date.getUTCHours().toString().padStart(2, '0');
                minutes = date.getUTCMinutes().toString().padStart(2, '0');

                const arrival_time = `${hours}:${minutes}`;
                // jointure : account,trip,booking
                const sanitizedBookings = (trip.booking || []).filter((booking) => !booking.passenger_no_show);
                const _trip  = {
                    id: trip.id,
                    driver_id: trip.driver_id,
                    driver_account_id: tripAccount.id || null,
                    name: `${tripAccount.firstname || ''} ${tripAccount.lastname || ''}`.trim() || "Chauffeur",
                    avatar: tripAccount.avatar || null,
                    depart: getters.GET_VILLAGE_BY_ID(trip.village_departure_id),
                    destination: getters.GET_VILLAGE_BY_ID(trip.village_arrival_id),
                    departure_time: trip.departure_time,
                    hour_start: departure_time,
                    hour_end: arrival_time,
                    price: trip.price ? trip.price : (Math.ceil(Math.random()*4)+1),
                    passenger_number: sanitizedBookings.filter((booking) => booking.is_accepted).length,
                    bookings: sanitizedBookings,
                    max_seats: trip.max_seats,
                    route: trip.route,
                    car: trip.car,
                };
                _trips.push(_trip);
            }

            console.log("trips-search:", _trips);
            
            commit('SET_TRAJETS', _trips);


            let { data: account, error: error_account } = await supabase
                .from('account')
                .select(`
                    user_id,
                    firstname,
                    lastname,
                    avatar
                `)
                .eq('user_id', infos.user_uid)
            
            if(error_account){
                console.error("Error:", error_account);
                return {status: 2, data: null}
            }
        
            console.log("account shared", account);

            return {status: 0, data: account}
        },
        async getOwnTrip({ getters, commit }) {
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!sessionChecked){
                router.replace("/login");
                return;
            }

            const currentDate = new Date();
            const oneHourAgo = new Date(currentDate.getTime() - (60 * 60 * 1000));

            const { data: trips, error } = await supabase
                .from('trip')
                .select(`
                    id, 
                    driver_id,
                    village_departure_id,
                    village_arrival_id,
                    departure_time,
                    max_seats,
                    price,
                    route,
                    booking (
                        *,
                        account (*)
                    )`)
                .eq('driver_id', store.state.profil.userUid)
                .gt("departure_time", formaterDateUTC(oneHourAgo))

            if ( error ) {
                console.error(error);
                return;
            }

            console.log("Jon", trips);
            let _trips = [];
            for (let index = 0; index < trips.length; index++) {
                const trip = trips[index];

                let isoDate = trip.departure_time;
                let date = new Date(isoDate);

                let offset = date.getTimezoneOffset();
                date = new Date(date.getTime() - (offset * 60000));

                let hours = date.getUTCHours().toString().padStart(2, '0');
                let minutes = date.getUTCMinutes().toString().padStart(2, '0');
                let departure_time = `${hours}:${minutes}`;

                date = new Date((date.getTime() + (parseInt(trip.route.infosGoogle.duration.replace("s", "")) * 1000) ) - (offset * 60000));

                hours = date.getUTCHours().toString().padStart(2, '0');
                minutes = date.getUTCMinutes().toString().padStart(2, '0');

                const arrival_time = `${hours}:${minutes}`;

                // jointure : account,trip,booking
                const sanitizedBookings = (trip.booking || []).filter((booking) => !booking.passenger_no_show);
                const _trip  = {
                    id: trip.id,
                    driver_id: trip.driver_id,
                    depart: getters.GET_VILLAGE_BY_ID(trip.village_departure_id),
                    destination: getters.GET_VILLAGE_BY_ID(trip.village_arrival_id),
                    departure_time: trip.departure_time,
                    hour_start: departure_time,
                    hour_end: arrival_time,
                    price: trip.price ? trip.price : (Math.ceil(Math.random()*4)+1),
                    passenger_number: sanitizedBookings.length,
                    bookings: sanitizedBookings,
                    max_seats: trip.max_seats,
                    route: trip.route,
                };

                _trips.push(_trip);
            }

            console.log("Get OWN SET_TRAJETS EKKO", _trips); 
            commit('SET_TRAJETS', _trips);   
            
            return {status: 0, message: "publish ok"}

        },
        async reserveTrajet({state}, payload = {}){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return {
                    valided: false,
                    message: "Votre session a expiré. Veuillez vous reconnecter.",
                    retriable: false,
                };
            }

            const selectedTrip = state.trajetSelected;
            const seatsRequested = Number(state.nbPassenger);
            if( !selectedTrip || !selectedTrip.id ){
                return { valided: false, message: "Erreur lors de la sélection du trajet.", retriable: false };
            }
            if( !Number.isInteger(seatsRequested) || seatsRequested <= 0 ){
                return { valided: false, message: "Le nombre de places demandé est invalide.", retriable: false };
            }
            if( !payload.requestId ){
                return { valided: false, message: "La demande de réservation est invalide.", retriable: false };
            }

            const typeUrl = store.state.profil.modeCo;
            try {
                const response = await serverRequest('post', '/bookings/reserve', {
                    mode: typeUrl,
                    data: {
                        tripId: selectedTrip.id,
                        seats: seatsRequested,
                        requestId: payload.requestId,
                    },
                });
                const reservation = response.data?.data;
                if( response.data?.status !== 'ok' || !reservation ){
                    throw new Error("Réponse de réservation invalide.");
                }

                const paymentMode = reservation.payment?.mode;
                const paymentAmount = Number(reservation.payment?.amount) || 0;
                store.state.profil.soldes = Number(reservation.credit) || 0;

                if (reservation.payment?.status === 'requires_action') {
                    return {
                        valided: false,
                        status: 'PAYMENT_ACTION_REQUIRED',
                        message: "Votre banque demande une authentification supplémentaire.",
                        retriable: true,
                        requestId: reservation.requestId,
                        paymentIntentId: reservation.payment.paymentIntentId,
                        clientSecret: reservation.payment.clientSecret,
                    };
                }

                // A replay is the same reservation returned after a timeout: do
                // not duplicate local history, pending amounts or notifications.
                store.state.trip.rating = true;
                if( !store.state.profil.history.datesTripPassenger.includes(selectedTrip.departure_time) ){
                    store.state.profil.history.datesTripPassenger.push(selectedTrip.departure_time);
                }
                if( !reservation.replayed ){
                    const currentPendingDebit = Number(store.state.profil.pendingDebit) || 0;
                    store.state.profil.pendingDebit = parseFloat((currentPendingDebit + paymentAmount).toFixed(2));

                }

                const baseMessage = reservation.accepted
                    ? "Votre réservation a été effectuée avec succès."
                    : "Votre demande est en attente de validation par le chauffeur.";
                const paymentMessage = paymentMode === 'wallet'
                    ? " Vos crédits sont réservés jusqu'à la validation du départ."
                    : " Le prélèvement sera confirmé une fois votre présence validée au départ.";

                return {
                    valided: true,
                    message: `${baseMessage}${paymentMessage}`,
                    accepted: Boolean(reservation.accepted),
                    replayed: Boolean(reservation.replayed),
                    requestId: reservation.requestId,
                    bookingIds: reservation.bookingIds,
                    data: {
                        id: reservation.tripId,
                        tripId: reservation.tripId,
                        bookingId: reservation.bookingIds?.[0] || null,
                        date: selectedTrip.departure_time,
                        driverAccountId: reservation.driverAccountId || selectedTrip.driver_account_id || null,
                    },
                    payment: reservation.payment,
                };
            }
            catch(error){
                console.error("reserveTrajet error:", error);
                const apiError = error.response?.data;
                return {
                    valided: false,
                    status: apiError?.code || 'RESERVATION_FAILED',
                    message: apiError?.message || "Nos serveurs sont actuellement indisponibles. Veuillez réessayer plus tard.",
                    retriable: apiError?.retriable !== false,
                };
            }
        },
    },
}
