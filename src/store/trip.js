// import { createStore } from 'vuex'
// import axios from 'axios'

import supabase from '@/utils/supabaseClient.js';

// import router from '@/router';
// import store from '@/store'; 

// import { defineStore } from 'pinia';

import stripe from '@/utils/stripe.js'

// store/trips.js
// export const useTripsStore = defineStore('trips', {
//     state: () => ({
//       list: []  // vos courses
//     }),
//     actions: {
//       async fetchTrips() { /* ... */ },
//       updateRefundStatus(tripId, status) {
//         const t = this.list.find(t => t.id === tripId);
//         if (t) t.refundStatus = status;
//       }
//     }
//   });

  
export default {
    namespaced: true,
    state: {
        ratings: {
            rating: false,
            bookings: [],
            data: null, //current booking will be rate
        },
        driver: true,
        route: {},
        chat: {
            contacts: [],
        },
        tripSelected: {},
        member: {
            userId: null,
            identity: false,
            payouts_enabled: false,
            avatar: "",
            userName: "",
            location: "",
            preferences: [],
            notation: {
                avis: 0,
                nbTrip: 0,
                satisfaction: 0,
            }
        },
        aboutPreference: {
            discution: [
                {
                    index: 0,
                    about: "discution",
                    prependIconColor:  "#9fcb66",
                    prependIcon:"mdi-forum",
                    text:"Bavard enthousiaste!",
                    chip:false,
                    chipIcon: null,
                    switchBtn: false,
                    chipText: "",
                },
                {
                    index: 1,
                    about: "discution",
                    prependIconColor: "var(--blue-color)",
                    prependIcon:"mdi-forum",
                    text: "Papotage occasionnel.",
                    chip:false,
                    chipIcon: null,
                    switchBtn: false,
                    chipText: "",
                },
                {
                    index: 2,
                    about: "discution",
                    prependIconColor: "#ff5353",
                    prependIcon:"mdi-forum",
                    text:"Plutôt silencieux.",
                    chip:false,
                    chipIcon: null,
                    switchBtn: false,
                    chipText: "",
                },
            ],
            smoke: [
                {
                    index: 0,
                    about: "smoke",
                    prependIconColor:  "#9fcb66",
                    prependIcon:"mdi-smoking-off",
                    text:"Fumeur en voiture.",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    index: 1,
                    about: "smoke",
                    prependIconColor: "var(--blue-color)",
                    prependIcon:"mdi-smoking-off",
                    text:"Fumeur hors voiture.",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    index: 2,
                    about: "smoke",
                    prependIconColor: "#ff5353",
                    prependIcon:"mdi-smoking-off",
                    text:"Voiture sans fumée.",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
            ],
            music: [
                {
                    index: 0,
                    about: "music",
                    prependIconColor: "#9fcb66",
                    prependIcon:"mdi-music",
                    text:"Musique non-stop!",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    index: 1,
                    about: "music",
                    prependIconColor: "var(--blue-color)",
                    prependIcon:"mdi-music",
                    text:"Musique selon l'humeur.",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    index: 2,
                    about: "music",
                    prependIconColor: "#ff5353",
                    prependIcon:"mdi-music",
                    text:"Le silence est d'or",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
            ],
            animal: [
                {
                    index: 0,
                    about: "animal",
                    prependIconColor: "#9fcb66",
                    prependIcon:"mdi-paw",
                    text:"Ami des animaux.",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    index: 1,
                    about: "animal",
                    prependIconColor: "var(--blue-color)",
                    prependIcon:"mdi-paw",
                    text:"Sélectif avec les animaux.",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    index: 2,
                    about: "animal",
                    prependIconColor: "#ff5353",
                    prependIcon:"mdi-paw",
                    text:"Pas d'animaux en voiture.",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
            ],
        },
        indexPreference: ["discution", "smoke", "music", "animal"],
        notMessageVue: [],//list id trip pour notification chat
    },
    getters: {
        getTripSelected: (state) => state.tripSelected,
    },
    mutations: { 
        SET_CONTACTS(state, contacts) {
            state.chat.contacts = contacts;
        },
        SET_NOT_MESSAGE_VUE(state, idTrips) {
            state.notMessageVue = idTrips;
        },
        SET_TRIP_SELECTED(state, trip) {
            state.tripSelected = trip;
        },
        SET_RATING(state, bool) {
            console.log("SET_RATING", bool);
            state.ratings.rating = bool;
        },
        SET_RATINGS_INFO(state, infos) {
            console.log("SET_RATINGS_INFO", infos);
            state.ratings.rating = true;
            state.ratings.bookings.push(infos);
        },
        SET_RATINGS_REMOVE(state, infos) {
            console.log("SET_RATINGS_REMOVE", infos);
            state.ratings.bookings = state.ratings.bookings.filter((info) => infos.id != info.id);
            state.ratings.data = null;
        },
    },
    actions: {
        async getContacts({ state, commit }){
            if(state.tripSelected != undefined && state.tripSelected.bookings != undefined) {
                console.log("getConctats", state.tripSelected.bookings.length);
            }
            else {
                console.log("getConctats-trip", state.tripSelected);
                state.chat.contacts = [];
                return;
            }

            let contacts = [];
            let accounts_id = [];

            // get-account
            if( state.tripSelected != undefined && state.tripSelected.bookings != undefined ){
                for (let index = 0; index < state.tripSelected.bookings.length; index++) {
                    const passenger_account_id = state.tripSelected.bookings[index].passenger_account_id;
                    const trip_id = state.tripSelected.id;
                    console.log("trip_id-----", trip_id);
                    if( ! accounts_id.includes(passenger_account_id) ){

                        let { data: account, error: error_account } = await supabase
                            .from('account')
                            .select(`
                                *,
                                booking (
                                    *,
                                    trip (
                                        max_seats,
                                        village_departure_id,
                                        village_arrival_id,
                                        departure_time
                                    )
                                )
                            `)
                            .eq('id', passenger_account_id)
                            .eq('booking.trip_id', trip_id)

                        if( error_account ){
                            console.error("Error:", error_account);
                        }

                        let contact = account[0];
                        // contact.avatar = "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned";
                        contact.messageNumber = 0;
                        
                        console.log("contact", contact);
                        contacts.push(contact);
                        accounts_id.push(passenger_account_id);

                    }
                }
            }
            
            commit('SET_CONTACTS', contacts);
        },
        async getProfilMember({state}, member){
            
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select(`*, settings(*)`)
                .eq('user_id', member.userUid)
            
            if(error_account){
                console.error(error_account)
                return false;
            }

            console.log("account=", account);

            // Notation... TODO : add others informations
            const { count, error: error_count } = await supabase
                .from('trip')
                .select('id', { count: 'exact' })
                .eq("driver_id", member.userUid);

            if(error_count){
                console.log("Error count: ", error_count);
            }
            else {
                state.member.notation.nbTrip = count;
            }

            const settings = account[0].settings;
            
            if(settings && settings.length > 0){
                state.member.avatar = account[0].avatar;
                state.member.userName = `${account[0].firstname} ${account[0].lastname}`;
                state.member.location = account[0].village != null && account[0].village != "" ? account[0].village : "";
                state.member.identity = account[0].identity;
                state.member.userId = account[0].id;

                const provider = await stripe.accounts.retrieve(account[0].provider_id);
                console.log("retrieve provider:", provider);
                state.member.payouts_enabled = provider.payouts_enabled;

                let outPreferences = [];
                
                const preferences = settings[0].prefer;
                for (let index = 0; index < preferences.length; index++) {
                    const ind_prefer = preferences[index];
                    outPreferences.push(state.aboutPreference[state.indexPreference[index]][ind_prefer]);
                }
                state.member.preferences = outPreferences;
            }
            else{
                return false;
            }

            console.log("state.member", state.member);

            return true;

        },
        async updateAccepteBooking({state}, index){
            const bookings = state.chat.contacts[index].booking;
            for (let indexB = 0; indexB < bookings.length; indexB++) {
                const id_bk = bookings[indexB].id;
                const { data, error } = await supabase
                    .from('booking')
                    .update({ is_accepted: true })
                    .eq('id', id_bk)
                    .select();

                if(error){
                    console.error("Error", error)
                    return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
                }

                if( data ){
                    state.chat.contacts[index].booking[indexB].is_accepted = true;
                }
            }

            return {status: 0, message: "success"};
        },
        async updateRefusedBooking({state}, index){
            const bookings = state.chat.contacts[index].booking;
            for (let indexB = 0; indexB < bookings.length; indexB++) {
                const id_bk = bookings[indexB].id;
                const { data, error } = await supabase
                    .from('booking')
                    .update({ is_refused: true })
                    .eq('id', id_bk)
                    .select();

                if(error){
                    console.error("Error", error)
                    return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
                }

                if( data ){
                    state.chat.contacts[index].booking[indexB].is_refused = true;
                }
            }

            return {status: 0, message: "success"};
        },
    },
}
