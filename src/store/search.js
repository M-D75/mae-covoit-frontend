// import { createStore } from 'vuex'
import axios from 'axios'

import store from '../store'; 

import supabase from '@/utils/supabaseClient.js';
import router from '@/router';

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
        communesHistory: ["Tsingoni", "Mamoudzou", "Dzaoudzi"],
        communesFrequency: {},
        trajets: [
            // {
            //     "depart": "Tsingoni",
            //     "destination": "Mamoudzou",
            //     "hour_start": "04:50",
            //     "hour_end": "06:55",
            //     "price": 4,
            //     "name": "Ledou",
            //     "passenger_number": 2
            // },
            // {
            //     "depart": "Bandraboua",
            //     "destination": "Chirongui",
            //     "hour_start": "07:30",
            //     "hour_end": "09:15",
            //     "price": 8,
            //     "name": "Madi",
            //     "passenger_number": 1
            // },
            // {
            //     "depart": "Kani-Kéli",
            //     "destination": "Ouangani",
            //     "hour_start": "10:20",
            //     "hour_end": "12:10",
            //     "price": 6,
            //     "name": "Halima",
            //     "passenger_number": 3
            // },
            // {
            //     "depart": "Bouéni",
            //     "destination": "Dzaoudzi",
            //     "hour_start": "14:45",
            //     "hour_end": "16:30",
            //     "price": 5,
            //     "name": "Nassim",
            //     "passenger_number": 1
            // },
            // {
            //     "depart": "Sada",
            //     "destination": "Pamandzi",
            //     "hour_start": "17:05",
            //     "hour_end": "18:55",
            //     "price": 10,
            //     "name": "Zainab",
            //     "passenger_number": 4
            // },
            // {
            //     "depart": "Tsingoni",
            //     "destination": "Mamoudzou",
            //     "hour_start": "08:30",
            //     "hour_end": "10:20",
            //     "price": 7,
            //     "name": "Fatima",
            //     "passenger_number": 2
            // },
            // {
            //     "depart": "Bandraboua",
            //     "destination": "Chirongui",
            //     "hour_start": "11:45",
            //     "hour_end": "13:30",
            //     "price": 9,
            //     "name": "Ahmed",
            //     "passenger_number": 1
            // },
            // {
            //     "depart": "Kani-Kéli",
            //     "destination": "Ouangani",
            //     "hour_start": "14:15",
            //     "hour_end": "16:00",
            //     "price": 5,
            //     "name": "Amina",
            //     "passenger_number": 3
            // },
            // {
            //     "depart": "Bouéni",
            //     "destination": "Dzaoudzi",
            //     "hour_start": "18:10",
            //     "hour_end": "19:50",
            //     "price": 6,
            //     "name": "Issa",
            //     "passenger_number": 1
            // },
            // {
            //     "depart": "Sada",
            //     "destination": "Pamandzi",
            //     "hour_start": "20:25",
            //     "hour_end": "22:10",
            //     "price": 8,
            //     "name": "Leila",
            //     "passenger_number": 4
            // },
            // {
            //     "depart": "Tsingoni",
            //     "destination": "Mamoudzou",
            //     "hour_start": "23:15",
            //     "hour_end": "01:05",
            //     "price": 10,
            //     "name": "Karim",
            //     "passenger_number": 2
            // },
        ],
        accounts: [],
    },
    getters: {
        getVillagesByName: (state) => (name) => {
            return state.villages.filter(infoVillage => infoVillage.village.toLowerCase() == name.toLowerCase());
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
        async getVillages({ commit }) {
            axios.get(`${process.env.VUE_APP_API_MBABUF_URL}/villages`, {
                    params:{
                        jwt: store.state.auth.token,
                    }
                })
                .then(response => {
                    commit('SET_VILLAGES', response.data.result);
                    console.log("village", response.data.result);
                })
                .catch(error => {
                    console.error(error);
                });
        },
        // async getTrajets({ commit, state, dispatch }) {
        //     const sessionChecked = await store.dispatch("auth/checkSession");
        //     if(!sessionChecked)
        //         router.replace("/login");

        //     await dispatch("getAccounts");

        //     await axios.get(`${process.env.VUE_APP_API_MBABUF_URL}/trips`, {
        //             params:{
        //                 jwt: store.state.auth.token,
        //             }
        //         })
        //         .then(async (response) => {
        //             const trips = response.data.result;
        //             var _trips = [];
            
        //             for(const i_trip in trips){
        //                 console.log("driver,", trips[i_trip].driver_id, store.state.profil.userUid);
        //                 if( trips[i_trip].driver_id != store.state.profil.userUid ){
        //                     let isoDate = trips[i_trip].departure_time;
        //                     let date = new Date(isoDate);

        //                     let offset = date.getTimezoneOffset();
        //                     date = new Date(date.getTime() - (offset * 60000));

        //                     let hours = date.getUTCHours().toString().padStart(2, '0');
        //                     let minutes = date.getUTCMinutes().toString().padStart(2, '0');
        //                     let departure_time = `${hours}:${minutes}`;
        //                     //TODO GET arrival
        //                     let arrival_time = `${hours}:${minutes}`;

        //                     const username = state.accounts.filter((acount) => (acount.user_id == trips[i_trip].driver_id))[0].firstname;

        //                     let { data: current_trip, error: error_trip } = await supabase
        //                         .from('trip')
        //                         .select('*')
        //                         .eq('id', trips[i_trip].id);

        //                     if( error_trip ){
        //                         console.log("ERROR:", error_trip);
        //                     }

        //                     let { data: account_driver } = await supabase
        //                         .from('account')
        //                         .select("*")
        //                         .eq('user_id', trips[i_trip].driver_id);

        //                     if( current_trip && current_trip.length > 0 && current_trip[0].route != null ){

        //                         date = new Date((date.getTime() + (parseInt(current_trip[0].route.infosGoogle.duration.replace("s", "")) * 1000) ) - (offset * 60000));

        //                         hours = date.getUTCHours().toString().padStart(2, '0');
        //                         minutes = date.getUTCMinutes().toString().padStart(2, '0');
        //                         //TODO GET arrival
        //                         arrival_time = `${hours}:${minutes}`;
        //                     }

        //                     let driver_avatar = "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned";
        //                     if( account_driver && account_driver.length > 0 && account_driver[0].avatar )
        //                         driver_avatar = account_driver[0].avatar;

        //                     const _trip  = {
        //                         id: trips[i_trip].id,
        //                         driver_id: trips[i_trip].driver_id,
        //                         avatar: driver_avatar,
        //                         depart: trips[i_trip].village_departure.village,
        //                         destination: trips[i_trip].village_arrival.village,
        //                         departure_time: trips[i_trip].departure_time,
        //                         hour_start: departure_time,
        //                         hour_end: arrival_time,
        //                         price: current_trip ? current_trip[0].price : (Math.ceil(Math.random()*4)+1),
        //                         name: username,
        //                         passenger_number: trips[i_trip].bookings.length,
        //                         bookings: trips[i_trip].bookings,
        //                         max_seats: trips[i_trip].max_seats,
        //                         route: current_trip ? current_trip[0].route : null,
        //                     };
        //                     _trips.push(_trip);
        //                 }
        //             }

        //             console.log("trips-search:", _trips)
                    
        //             commit('SET_TRAJETS', _trips);
        //         })
        //         .catch(error => {
        //             console.error(error);
        //         });

        //     return true
        // },
        async getTrajets({ commit, getters }) {
            // const sessionChecked = await store.dispatch("auth/checkSession");
            // if(!sessionChecked)
            //     router.replace("/login");

            // await dispatch("getAccounts");

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
                    account (*),
                    booking (
                        passenger_account_id,
                        is_accepted,
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
                const _trip  = {
                    id: trip.id,
                    driver_id: trip.driver_id,
                    name: trip.account.firstname,
                    avatar: trip.account.avatar,
                    depart: getters.GET_VILLAGE_BY_ID(trip.village_departure_id),
                    destination: getters.GET_VILLAGE_BY_ID(trip.village_arrival_id),
                    departure_time: trip.departure_time,
                    hour_start: departure_time,
                    hour_end: arrival_time,
                    price: trip.price ? trip.price : (Math.ceil(Math.random()*4)+1),
                    passenger_number: trip.booking.filter((booking) => booking.is_accepted).length,
                    bookings: trip.booking,
                    max_seats: trip.max_seats,
                    route: trip.route,
                };
                _trips.push(_trip);
            }

            console.log("trips-search:", _trips)
            
            commit('SET_TRAJETS', _trips);

            return true
        },
        async getBookings({ getters, commit }) {
            const sessionChecked = await store.dispatch("auth/checkSession");
            if(!sessionChecked)
                router.replace("/login");

            // await dispatch("getAccounts");

            const { data: trips, error } = await supabase
                .from('booking')
                .select(`
                    trip_id,
                    passenger_account_id,
                    is_accepted,
                    trip (
                        id, 
                        driver_id,
                        account (*),
                        village_departure_id,
                        village_arrival_id,
                        departure_time,
                        max_seats,
                        price,
                        route
                    )`)
                .eq('passenger_account_id', store.state.profil.userId)

            if ( error ) {
                console.error(error);
                return;
            }

            // console.log("Jon", trips);
            let _trips = [];
            for (let index = 0; index < trips.length; index++) {
                const trip = trips[index].trip;
                const booking = trips[index];

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
                const _trip  = {
                    id: trip.id,
                    is_accepted: booking.is_accepted,
                    driver_id: trip.driver_id,
                    avatar: trip.account.avatar,
                    name: trip.account.username,
                    depart: getters.GET_VILLAGE_BY_ID(trip.village_departure_id),
                    destination: getters.GET_VILLAGE_BY_ID(trip.village_arrival_id),
                    departure_time: trip.departure_time,
                    hour_start: departure_time,
                    hour_end: arrival_time,
                    price: trip.price ? trip.price : (Math.ceil(Math.random()*4)+1),
                    max_seats: trip.max_seats,
                    route: trip.route,
                };

                _trips.push(_trip);
            }

            console.log("SET_TRAJETS EKKO", _trips); 
            commit('SET_TRAJETS', _trips);   
            
            return {status: 0, message: "publish ok"}
        },
        async getOwnTrip({ getters, commit }) {
            const sessionChecked = await store.dispatch("auth/checkSession");
            if(!sessionChecked)
                router.replace("/login");

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
                        passenger_account_id, 
                        account (*)
                    )`)
                .eq('driver_id', store.state.profil.userUid)

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
                const _trip  = {
                    id: trip.id,
                    driver_id: trip.driver_id,
                    depart: getters.GET_VILLAGE_BY_ID(trip.village_departure_id),
                    destination: getters.GET_VILLAGE_BY_ID(trip.village_arrival_id),
                    departure_time: trip.departure_time,
                    hour_start: departure_time,
                    hour_end: arrival_time,
                    price: trip.price ? trip.price : (Math.ceil(Math.random()*4)+1),
                    passenger_number: trip.booking.length,
                    bookings: trip.booking,
                    max_seats: trip.max_seats,
                    route: trip.route,
                };

                _trips.push(_trip);
            }

            console.log("Get OWN SET_TRAJETS EKKO", _trips); 
            commit('SET_TRAJETS', _trips);   
            
            return {status: 0, message: "publish ok"}

        },
        async getAccounts({commit}){
            await axios.get(`${process.env.VUE_APP_API_MBABUF_URL}/accounts`, {
                    params:{
                        jwt: localStorage.getItem("mae-covoit-supabase-jwt"),
                    }
                })
                .then(response => {
                    const accounts = response.data.result;
                    commit('SET_ACCOUNTS', accounts);
                    console.log("accounts finished", accounts)
                    return true;
                })
                .catch(error => {
                    console.error(error);
                });
        },
        async reserveTrajet({state}, playload){
            const sessionChecked = await store.dispatch("auth/checkSession");
            if( ! sessionChecked )
                router.replace("/login");

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

            // check soldes enouth
            if( 0 > account_passenger[0].credit - state.trajetSelected.price ){
                return { valided: false, message: "Pas assez de credit !"}
            }

            // get all booking id
            // let { data: booking, error: error_booking } = await supabase
            //     .from('booking')
            //     .select('id')

            // if ( error_booking ) {
            //     console.error('Erreur lors de la requête :', error_booking);
            //     return { valided: false, message: "Une erreur est survenue !"};
            // }


            // new id = last_id+1
            // const newBookingId = booking.length+1;
            
            // debit le montant
            let { data: account_update, error: error_update } = await supabase
                .from('account')
                .update({ credit: (account_passenger[0].credit - state.trajetSelected.price) })
                .eq('user_id', playload.user_id)
                .select()

            if( error_update ){
                console.error("Error update", error_update)
                return { valided: false, message: "Nous avons pas pu debiter votre solde veuillez réessayer plus tard."};
            }
            
            store.state.profil.soldes = account_update[0].credit;
            console.log("new-soldes:", account_update[0].credit);

            //credité driver
            let { data: account_update_driver, error: error_update_driver } = await supabase
                .from('account')
                .update({ credit: (account_driver[0].credit + state.trajetSelected.price) })
                .eq('user_id', state.trajetSelected.driver_id)
                .select()

            if( error_update_driver ){
                console.error("Error update", error_update_driver, account_update_driver);
                return { valided: false, message: "Une erreur est survenue."};
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
            const message_success = auto_accept_trip ? "Votre réservation à été effectué avec succès" : "Votre demande est en attente de validation par le chauffeur !";
            return {valided: true, message: message_success, accepted: auto_accept_trip };
        },
    },
}
