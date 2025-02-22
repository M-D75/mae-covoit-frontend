// import { createStore } from 'vuex'
import axios from 'axios'

import store from '../store'; 

import stripe from '@/utils/stripe.js'
import supabase from '@/utils/supabaseClient.js';
import router from '@/router';
import { formaterDateUTC, getRandomInt, getRandomString, getFutureTime, tomorowDate } from '@/utils/utils.js'


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
                    name: `${trip.account.firstname} ${trip.account.lastname}`,
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
                        passenger_account_id,
                        is_accepted,
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
                    name: `${trip.account.firstname} ${trip.account.lastname}`,
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
                        passenger_account_id,
                        is_accepted,
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
                    name: `${trip.account.firstname} ${trip.account.lastname}`,
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
        async getBookings({ getters, commit }) {
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            const { data: trips, error } = await supabase
                .from('booking')
                .select(`
                    trip_id,
                    passenger_account_id,
                    is_accepted,
                    is_refused,
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
                    is_refused: booking.is_refused,
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
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!sessionChecked){
                router.replace("/login");
                return;
            }

            const currentDate = new Date();

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
                .gt("departure_time", formaterDateUTC(currentDate))

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
                return { valided: false, message: "Nos serveurs sont actuellement indisponible veuillez réessayer plus tard."};
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

            //build charge ?
            let charge = null;
            let byCredit = true;

            // check soldes enouth
            if( 0 > account_passenger[0].credit - state.trajetSelected.price ){
                byCredit = false;
                // return { valided: false, message: "Pas assez de credit !"}
                
                const customer = await stripe.customers.retrieve(account_passenger[0].customer_id);
                console.log("retrieve customer:", customer);
                
                //const cardId = customer.default_source;
                const cardId = customer.metadata.source_selected;
                try {
                    const obj = {
                        amount: state.trajetSelected.price*100,
                        currency: 'eur',
                        customer: customer.id,
                        payment_method: cardId,
                        confirm: true,
                        description: `reservation de trajet ${state.trajetSelected.depart} vers ${state.trajetSelected.destination} à ${state.trajetSelected.departure_time} pour ${account_passenger[0].username}; driver_id:${account_driver[0].user_id}; userUid : ${account_passenger[0].user_id};`,
                        // return_url: 'http://localhost:8080/profil',
                        automatic_payment_methods: {
                            enabled: true,
                            allow_redirects: 'never'
                        },
                    };
                    console.log("build-payment-intent", obj);
                    const paymentIntent = await stripe.paymentIntents.create(obj);
            
                    console.log("paymentIntent [OK]", paymentIntent);

                    //get charge
                    charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
                }
                catch (error) {
                    console.error("Erreur lors de la création de l'intention de paiement:", error);
                    return {valided: false, status: 2, message: "Une erreur s'est produite lors du prélevement sur votre card de credit, veuillez réessayer plus tard."};
                }
            }
            
            // debit le montant
            if(byCredit){
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
            }

            //credité driver
            const accountStrip = await stripe.accounts.retrieve(account_driver[0].provider_id);
            console.log("accountStrip", accountStrip, (state.trajetSelected.price * 0.59) * 100);
           
            if(charge != null){

                //record in database
                const { data: stripe_charge_ins_data, error: stripe_charge_ins_error } = await supabase
                    .from('strip_charge')
                    .insert([
                        { charge_id: charge.balance_transaction, account_id: account_passenger[0].id },
                    ])
                    .select();

                if( stripe_charge_ins_error ){
                    console.error("Error:", stripe_charge_ins_error);
                }

                console.log("charge saved :", stripe_charge_ins_data);
        
                console.log("prep-transfer....", {
                    balance_transaction: charge.balance_transaction, 
                    driver_account_id: account_driver[0].provider_id,
                });

                const balanceTransaction = await stripe.balanceTransactions.retrieve(
                    charge.balance_transaction,
                );

                const outAxio = await axios.post(`${adresse[typeUrl]}/prepTransfer`, {
                        balance_transaction: charge.balance_transaction,
                        available_on: balanceTransaction.available_on,
                        driver_account_id: account_driver[0].provider_id,
                    })
                    .then(response => {
                        console.log("prepTransfer", response.data);
                        const data = response.data;

                        if(data.status != undefined && data.status == 'recieved'){
                            console.log("prep-transfer-ok");
                            return true
                        }
                        else{
                            return false
                        }
                    })
                    .catch(error => {
                        console.error('ERROR prepTransfer :', error);
                        return false;
                    });
                
                console.log("outAxio", outAxio);
                if( ! outAxio ) {
                    return { valided: false, message: "Une erreur est survenue."};
                }
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
            store.state.trip.rating = true;
            store.state.profil.history.datesTripPassenger.push(state.trajetSelected.departure_time);
            const message_success = auto_accept_trip ? "Votre réservation à été effectué avec succès" : "Votre demande est en attente de validation par le chauffeur !";
            return {valided: true, message: message_success, accepted: auto_accept_trip, data: {id: state.trajetSelected.id, date: state.trajetSelected.departure_time} };
        },
    },
}
