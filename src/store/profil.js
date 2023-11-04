// import { createStore } from 'vuex'
// import axios from 'axios'
// import { createClient } from '@supabase/supabase-js'


import store from '../store';
import supabase from '@/utils/supabaseClient.js';
import { dateConverter, groupByDate, mapToObject } from '@/utils/utils.js';

export default {
    namespaced: true,
    state: {
        darkMode: false,
        userId: null,
        userUid: "",
        userName: "Pseudo",
        avatarUrl: 'https://avatars0.githubusercontent.com/u/9064066?v=4&s=460',
        soldes: 0,
        profil: {
            infos_perso: {
                civilite: "Mr.",
                nom: "Ledou",
                prenom: "BG",
                email: "bg@mail.com",
                tel: "0606060606",
                adress: {
                    principal: "1 RUE DES GAMBWI",
                    complement: "BOUZI",
                    code_postal: "97680",
                    commune: "Combani",
                },
            },
            myTravels: [],
            myPublish: [],
            loadGetTripPublish: false,
        },
        history: {
            historycalBooking: {},
            load: false,
        }
        
    },
    getters: {
    },
    mutations: {
        SET_DARKMODE(state, boolean){
            state.darkMode = boolean
        },
        SET_AVATAR_URL(state, url){
            state.avatarUrl = url
        },
        SET_LOAD_GET_TRIP_PUBLISH(state, boolean){
            state.profil.loadGetTripPublish = boolean;
        },
    },
    actions: {
        async addCredit({state}, playload){
            console.log("add-credit", state, playload);

            // get-credit
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select("*")
                .eq('user_id', playload.userId)

            console.log("account:", account, error_account, account[0].credit+playload.credit);

            // update
            let { data: data_update, error: error_update } = await supabase
                .from('account')
                .update({ credit: (account[0].credit + playload.credit) })
                .eq('user_id', playload.userId)
                .select()

            state.soldes = data_update[0].credit;
            console.log("update-credit", data_update, error_update);
        },
        async getTravels({state}){
            console.log("get-travel", state, state.userUid);
            
            // get-account
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select("*")
                .eq('user_id', state.userUid)

            console.log("account:", account, error_account);

            let { data: booking, error: error_booking } = await supabase
                .from('booking')
                .select('*')
                .eq('passenger_account_id', account[0].id)

            if( error_booking ){
                console.error("Error booking", error_booking)
                return false;
            }

            if(booking.length==0){
                console.log("no booking");
                return false
            }

            console.log("booking:", booking.length, error_booking, booking[0].trip_id);

            await store.dispatch("search/getTrajets");

            let _trips = [];
            for (let index = 0; index < booking.length; index++) {
                const trip_id = booking[index].trip_id;

                _trips.push(store.state.search.trajets.filter((trajet) => trajet.id == trip_id)[0]);
            }

            const groupedInfos = _trips.reduce((acc, info) => {
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
            console.log("_trips:", _trips, state.profil.myTravels);

            return true;
        },
        async getPublish({state}){
            console.log("get-publish", state, state.userUid);

            // get-account
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select("*")
                .eq('user_id', state.userUid)

            console.log("account:", account, error_account);

            let { data: db_trip, error: error_trips } = await supabase
                .from('trip')
                .select('*')
                .eq('driver_id', state.userUid)

            if( error_trips ){
                console.error("Error booking", error_trips)
                return false;
            }

            if(db_trip.length==0){
                console.log("no trips");
                return false
            }

            console.log("trips::", db_trip.length, db_trip[0].id);

            await store.dispatch("search/getTrajets");

            let _trips = [];
            for (let index = 0; index < db_trip.length; index++) {
                const trip_id = db_trip[index].id;

                _trips.push(store.state.search.trajets.filter((trajet) => trajet.id == trip_id)[0]);
            }

            const groupedInfos = _trips.reduce((acc, info) => {
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

            state.profil.myPublish = groupedInfos;
            console.log("_trips:", _trips, state.profil.myPublish);

            return true;
        },
        async buildHistoriqueBooking({state}){

            state.history.load = true;
            // get-account
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select("*")
                .eq('user_id', state.userUid)

            console.log("account:", account, error_account);

            let { data: booking, error: error_booking } = await supabase
                .from('booking')
                .select('*')
                .eq('passenger_account_id', account[0].id)

            if( error_booking ){
                console.error("Error booking", error_booking)
                state.history.load = false;
                return false;
            }

            if(booking.length==0){
                console.log("no booking");
                state.history.load = false;
                return false
            }

            await store.dispatch("search/getTrajets");

            let _bookings = [];
            //let ensemble = [];
            for (let index = 0; index < booking.length; index++) {
                if( booking[index].passenger_account_id == account[0].id ){

                    const trip_current = store.state.search.trajets.filter((trajet) => trajet.id == booking[index].trip_id)[0]
                    const data = {
                        depart: trip_current.depart,
                        destination: trip_current.destination,
                        departure_time: trip_current.departure_time,
                        user: trip_current.username,
                        price: (Math.ceil(Math.random()*4)+1),
                    }
                    _bookings.push(data);
                }
            }

            console.log("_bookings", _bookings);

            const bookingGrouped = mapToObject(groupByDate(_bookings));
            console.log("grouped: ", bookingGrouped);
            state.history.historycalBooking = bookingGrouped;

            state.history.load = false;
        }
    },
}
