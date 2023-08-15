// import { createStore } from 'vuex'
import axios from 'axios'

import store from '../store'; 

export default {
    namespaced: true,
    state: {
        depart: "",
        destination: "",
        date: null,
        nbPassager: 1,
        villages: [],
        communesHistory: ["Tsingoni", "Mamoudzou", "Dzaoudzi"],
        trajets: [
        {
            "depart": "Tsingoni",
            "destination": "Mamoudzou",
            "hour_start": "04:50",
            "hour_end": "06:55",
            "price": 4,
            "name": "Ledou",
            "passenger_number": 2
        },
        {
            "depart": "Bandraboua",
            "destination": "Chirongui",
            "hour_start": "07:30",
            "hour_end": "09:15",
            "price": 8,
            "name": "Madi",
            "passenger_number": 1
        },
        {
            "depart": "Kani-Kéli",
            "destination": "Ouangani",
            "hour_start": "10:20",
            "hour_end": "12:10",
            "price": 6,
            "name": "Halima",
            "passenger_number": 3
        },
        {
            "depart": "Bouéni",
            "destination": "Dzaoudzi",
            "hour_start": "14:45",
            "hour_end": "16:30",
            "price": 5,
            "name": "Nassim",
            "passenger_number": 1
        },
        {
            "depart": "Sada",
            "destination": "Pamandzi",
            "hour_start": "17:05",
            "hour_end": "18:55",
            "price": 10,
            "name": "Zainab",
            "passenger_number": 4
        },
        {
            "depart": "Tsingoni",
            "destination": "Mamoudzou",
            "hour_start": "08:30",
            "hour_end": "10:20",
            "price": 7,
            "name": "Fatima",
            "passenger_number": 2
        },
        {
            "depart": "Bandraboua",
            "destination": "Chirongui",
            "hour_start": "11:45",
            "hour_end": "13:30",
            "price": 9,
            "name": "Ahmed",
            "passenger_number": 1
        },
        {
            "depart": "Kani-Kéli",
            "destination": "Ouangani",
            "hour_start": "14:15",
            "hour_end": "16:00",
            "price": 5,
            "name": "Amina",
            "passenger_number": 3
        },
        {
            "depart": "Bouéni",
            "destination": "Dzaoudzi",
            "hour_start": "18:10",
            "hour_end": "19:50",
            "price": 6,
            "name": "Issa",
            "passenger_number": 1
        },
        {
            "depart": "Sada",
            "destination": "Pamandzi",
            "hour_start": "20:25",
            "hour_end": "22:10",
            "price": 8,
            "name": "Leila",
            "passenger_number": 4
        },
        {
            "depart": "Tsingoni",
            "destination": "Mamoudzou",
            "hour_start": "23:15",
            "hour_end": "01:05",
            "price": 10,
            "name": "Karim",
            "passenger_number": 2
        },
        ],
        accounts: [],
    },
    getters: {
        getVillagesByName: (state) => (name) => {
            return state.villages.filter(infoVillage => infoVillage.village.toLowerCase() == name.toLowerCase());
        },
        GET_ID_VILLAGE_BY_NAME: (state) => (name) => {
            return state.villages.filter(infoVillage => infoVillage.village.toLowerCase() == name.toLowerCase())[0].id;
        },
        GET_ACCOUNTS: (state) => {
            return state.accounts
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
            state.nbPassager = number;
        },
        SET_TRAJETS(state, trips){
            state.trajets = trips;
        },
        SET_ACCOUNTS(state, accounts){
            state.accounts = accounts;
        },
    },
    actions: {
        async getVillages({ commit }) {
            axios.get(`${process.env.VUE_APP_API_MBABUF_URL}/villages`, {
                    params:{
                        jwt: store.state.auth.token,
                    }
                })
                .then(response => {
                    commit('SET_VILLAGES', response.data.result);
                })
                .catch(error => {
                    console.error(error);
                });
        },
        async getTrajets({ commit, state, dispatch }) {
            await dispatch("getAccounts");

            await axios.get(`${process.env.VUE_APP_API_MBABUF_URL}/trips`, {
                    params:{
                        jwt: store.state.auth.token,
                    }
                })
                .then(response => {
                    const trips = response.data.result;
                    var _trips = [];
            
                    for(const i_trip in trips){
                        let isoDate = trips[i_trip].departure_time;
                        let date = new Date(isoDate);
                        let hours = date.getUTCHours().toString().padStart(2, '0');
                        let minutes = date.getUTCMinutes().toString().padStart(2, '0');
                        let departure_time = `${hours}:${minutes}`;
                        //TODO GET arrival
                        let arrival_time = `${hours}:${minutes}`;

                        const username = state.accounts.filter((acount) => (acount.user_id == trips[i_trip].driver_id))[0].firstname;

                        const _trip  = {
                            id: trips[i_trip].id,
                            depart: trips[i_trip].village_departure.village,
                            destination: trips[i_trip].village_arrival.village,
                            hour_start: departure_time,
                            hour_end: arrival_time,
                            price: (Math.ceil(Math.random()*4)+1),
                            name: username,
                            passenger_number: trips[i_trip].bookings.length,
                            max_seat: trips[i_trip].max_seats,
                        };
                        _trips.push(_trip);
                    }

                    console.log(_trips)
                    
                    commit('SET_TRAJETS', _trips);
                })
                .catch(error => {
                    console.error(error);
                });

            return true
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
    },
}
