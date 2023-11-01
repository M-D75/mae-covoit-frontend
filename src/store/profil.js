// import { createStore } from 'vuex'
// import axios from 'axios'
// import { createClient } from '@supabase/supabase-js'


import store from '../store';
import supabase from '@/utils/supabaseClient.js';

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
        },
    },
    getters: {
    },
    mutations: {
        SET_DARKMODE(state, boolean){
            state.darkMode = boolean
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

            // get-credit
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
                const formattedDate = departureDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                
                const existingGroup = acc.find(group => group.date === formattedDate);
                if (existingGroup) {
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
    },
}
