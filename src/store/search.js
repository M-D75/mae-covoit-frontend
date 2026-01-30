// import { createStore } from 'vuex'
import axios from 'axios'

import store from '../store'; 

import stripe from '@/utils/stripe.js'
import { sendServerNotification } from '@/utils/notifications.js';
import supabase from '@/utils/supabaseClient.js';
import router from '@/router';
import { formaterDateUTC, getRandomInt, getRandomString, getFutureTime, tomorowDate } from '@/utils/utils.js'
import { humanizeSupabaseError } from '@/utils/errorMessages.js';


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
            
            // if(state.villages.length == 0)
            //     axios.get(`${process.env.VUE_APP_API_MBABUF_URL}/villages`, {
            //             params:{
            //                 jwt: store.state.auth.token,
            //             }
            //         })
            //         .then(response => {
            //             commit('SET_VILLAGES', response.data.result);
            //             console.log("get-villages:", response.data.result);
            //         })
            //         .catch(error => {
            //             console.error(error);
            //         });
            // else
            //     console.log("Get Villages Already done !", state.villages);

            if( process.env.VUE_APP_MODE == 'local' ){
                axios.get(`${process.env.VUE_APP_API_MBABUF_URL}/villages`, {
                        params:{
                            jwt: store.state.auth.token,
                        }
                    })
                    .then(response => {
                        commit('SET_VILLAGES', response.data.result);
                        console.log("get-villages:", response.data.result);
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
            else{
                if( state.villages.length == 0 ){
                    let { data: village_list, error } = await supabase
                        .from('village_list')
                        .select('*');
    
                    if(error){
                        console.error("Error, impossible de récuperer les villages :", error)
                    }
    
                    commit('SET_VILLAGES', village_list);
                }
                else
                    console.log("Get Villages Already done !", state.villages);  
            }

                      
        
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
                    car_id,
                    car (*),
                    account (*),
                    booking (
                        *,
                        account (*)
                    )`
                )
                .neq('driver_id', store.state.profil.userUid)

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
                    car_id,
                    car (*),
                    account (*),
                    booking (
                        *,
                        account (*)
                    )`
                )
                .neq('driver_id', store.state.profil.userUid)
                .gt("departure_time", formaterDateUTC(infos.date))
                .lt("departure_time", formaterDateUTC(tomorow))

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
                    car_id,
                    car (*),
                    account (*),
                    booking (
                        *,
                        account (*)
                    )`
                )
                .eq('id', parseInt(infos.ids))
                .gt("departure_time", formaterDateUTC(new Date()))
                .neq('driver_id', store.state.profil.userUid)

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
        async reserveTrajet({state}, playload){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}

            const typeUrl = store.state.profil.modeCo;

            //try ask serveur
            let testAskAxio = await axios.post(`${adresse[typeUrl]}/testAsk`, {
                    test: 'ok',
                })
                .then(response => {
                    console.log("testAsk", response.data);
                    const data = response.data;

                    if(data.status != undefined && data.status == 'ok'){
                        console.log("testAsk-ok");
                        return true;
                    }
                    else{
                        return false;
                    }
                })
                .catch(error => {
                    console.error('ERROR testAsk :', error);
                    return false;
                });

            if( ! testAskAxio ){
                return { valided: false, message: "Nos serveurs sont actuellement indisponible veuillez réessayer plus tard.", retriable: true };
            }

            if( state.nbPassenger + state.trajetSelected.passenger_number > state.trajetSelected.max_seats ){
                return { valided: false, message: "Pas assez place sur ce trajet !"};
            }

            if( ! state.trajetSelected ){
                return { valided: false, message: "Erreur lors de la selection du trajet"};
            }

            // get account passenger
            let { data: account_passenger, error: error_passenger } = await supabase
                .from('account')
                .select("*")
                .eq('user_id', playload.user_id)
            
            if ( error_passenger ) {
                console.error('Erreur lors de la requête :', error_passenger);
                return { valided: false, message: "Une erreur est survenue !"};
            }

            // get account driver
            let { data: account_driver, error: error_driver } = await supabase
                .from('account')
                .select(`
                    *,
                    settings (auto_accept_trip)
                `)
                .eq('user_id', state.trajetSelected.driver_id)
            
            if ( error_driver ) {
                console.error('Erreur lors de la requête :', error_driver);
                return { valided: false, message: "Une erreur est survenue !"};
            }

            // define payment strategy
            const seatsRequested = state.nbPassenger;
            const totalPrice = state.trajetSelected.price * seatsRequested;
            let byCredit = account_passenger[0].credit >= totalPrice;
            let paymentMethodId = null;

            if( !byCredit ){
                const customer = await stripe.customers.retrieve(account_passenger[0].customer_id);
                console.log("retrieve customer:", customer);
                const cardId = customer.metadata.source_selected;

                if( !cardId ){
                    return {valided: false, status: 2, message: "Aucun moyen de paiement n'est sélectionné. Veuillez enregistrer une carte."};
                }

                paymentMethodId = cardId;
            }
            
            // debit le montant
            if(byCredit){
                const newCredit = account_passenger[0].credit - totalPrice;
                let { data: account_update, error: error_update } = await supabase
                    .from('account')
                    .update({ credit: newCredit })
                    .eq('user_id', playload.user_id)
                    .select()

                if( error_update ){
                    console.error("Error update", error_update)
                    return { valided: false, message: humanizeSupabaseError(error_update, "Nous n'avons pas pu débiter votre solde, veuillez réessayer plus tard.")};
                }

                store.state.profil.soldes = account_update[0].credit;
                const currentPendingDebit = store.state.profil.pendingDebit || 0;
                store.state.profil.pendingDebit = parseFloat((currentPendingDebit + totalPrice).toFixed(2));
                console.log("new-soldes:", account_update[0].credit);
            }

            const user_id = account_passenger[0].id;
            const auto_accept_trip = account_driver[0].settings[0].auto_accept_trip;

            let list_ins_passenger = [];
            for(let index_passenger=0; index_passenger < state.nbPassenger; index_passenger++){
                list_ins_passenger.push({ trip_id: state.trajetSelected.id, passenger_account_id: user_id, is_accepted: auto_accept_trip })
            }

            //add +1 reserve
            
            let { data: data_booking, error: error_booking_update } = await supabase
                .from('booking')
                .insert(list_ins_passenger)
                .select()

            if ( error_booking_update ) {
                console.error('Erreur lors de la requête :', error_booking_update);
                return {valided: false, message: "Nous avons pas pu réserver ce trajet, vous serez rembourser sous 24h"};
            }

            console.log("reserveTrajet:", data_booking);

            const bookingIds = data_booking.map((booking) => booking.id);

            if(byCredit){
                const { error: wallet_booking_error } = await supabase
                    .from('booking')
                    .update({
                        payment_status: 'wallet_reserved'
                    })
                    .in('id', bookingIds);

                if(wallet_booking_error){
                    console.warn("wallet booking update failed:", wallet_booking_error);
                }
            }

            if( !byCredit ){
                try {
                    const totalAmount = Math.round(totalPrice * 100);
                    const holdResponse = await axios.post(`${adresse[typeUrl]}/payments/hold`, {
                        amount: totalAmount,
                        customerId: account_passenger[0].customer_id,
                        paymentMethodId,
                        passengerAccountId: account_passenger[0].id,
                        driverAccountId: account_driver[0].provider_id,
                        tripId: state.trajetSelected.id,
                        bookingIds,
                        departureTime: state.trajetSelected.departure_time,
                        description: `Reservation de trajet ${state.trajetSelected.depart} vers ${state.trajetSelected.destination} pour ${account_passenger[0].username}`,
                    });

                    if( !holdResponse.data || holdResponse.data.status !== 'ok' ){
                        await supabase.from('booking').delete().in('id', bookingIds);
                        return { valided: false, message: "Impossible de préparer le paiement différé. Aucun débit n'a été effectué.", retriable: true };
                    }

                    const { paymentIntentId, captureAfter } = holdResponse.data;
                    const totalAmountEuro = totalAmount / 100;
                    const currentPendingDebit = store.state.profil.pendingDebit || 0;
                    store.state.profil.pendingDebit = parseFloat((currentPendingDebit + totalAmountEuro).toFixed(2));

                    const { error: booking_payment_error } = await supabase
                        .from('booking')
                        .update({
                            payment_intent_id: paymentIntentId,
                            payment_status: 'requires_capture',
                            payment_capture_after: captureAfter
                        })
                        .in('id', bookingIds);

                    if( booking_payment_error ){
                        console.warn("booking payment update failed:", booking_payment_error);
                    }
                }
                catch(error){
                    console.error("Deferred payment error:", error);
                    await supabase.from('booking').delete().in('id', bookingIds);
                    const fallback = "Nous n'avons pas pu sécuriser le paiement. Réessayez plus tard.";
                    if(axios.isAxiosError?.(error) && error.response?.data?.message){
                        return { valided: false, message: error.response.data.message, retriable: true };
                    }
                    return { valided: false, message: fallback, retriable: true };
                }
            }

            store.state.trip.rating = true;
            store.state.profil.history.datesTripPassenger.push(state.trajetSelected.departure_time);
            const baseMessage = auto_accept_trip ? "Votre réservation a été effectuée avec succès." : "Votre demande est en attente de validation par le chauffeur.";
            const paymentMessage = byCredit ? " Vos crédits seront débités à la validation du départ." : " Le prélèvement sera confirmé une fois votre présence validée au départ.";
            const message_success = `${baseMessage}${paymentMessage}`;

            const passengerName = `${account_passenger[0].firstname || ''} ${account_passenger[0].lastname || ''}`.trim() || account_passenger[0].username || "Un passager";
            const departureName = state.trajetSelected.depart || store.getters["search/GET_VILLAGE_BY_ID"](state.trajetSelected.village_departure_id) || "Départ";
            const destinationName = state.trajetSelected.destination || store.getters["search/GET_VILLAGE_BY_ID"](state.trajetSelected.village_arrival_id) || "Destination";
            const departureTime = new Date(state.trajetSelected.departure_time);
            const formattedHour = `${departureTime.getHours().toString().padStart(2, '0')}:${departureTime.getMinutes().toString().padStart(2, '0')}`;
            const driverTitle = auto_accept_trip ? "Nouvelle réservation" : "Demande de réservation";
            const driverBody = auto_accept_trip
                ? `${passengerName} rejoint votre trajet ${departureName} → ${destinationName}.`
                : `${passengerName} souhaite rejoindre votre trajet ${departureName} → ${destinationName}.`;

            await sendServerNotification({
                mode: typeUrl,
                userId: state.trajetSelected.driver_id,
                title: driverTitle,
                body: driverBody,
                data: {
                    largeBody: `${passengerName} pour ${departureName} → ${destinationName} (${formattedHour}).`,
                    actions: {
                        goTo: "/profil/open-trip-driver",
                    },
                },
            });

            return {
                valided: true,
                message: message_success,
                accepted: auto_accept_trip,
                data: {
                    id: state.trajetSelected.id,
                    date: state.trajetSelected.departure_time,
                    driverAccountId: account_driver[0].id,
                },
                payment: {
                    mode: byCredit ? "wallet" : "card_deferred",
                    amount: totalPrice
                }
            };
        },
    },
}
