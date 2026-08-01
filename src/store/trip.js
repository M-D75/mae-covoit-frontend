// import { createStore } from 'vuex'
// import axios from 'axios'

import supabase from '@/utils/supabaseClient.js';
import { serverRequest } from '@/utils/serverApi.js';

// import router from '@/router';
// import store from '@/store'; 

// import { defineStore } from 'pinia';

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
            ratedTripIds: [],
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
            if( trip ){
                const originalBookings = Array.isArray(trip.bookings)
                    ? trip.bookings
                    : (Array.isArray(trip.booking) ? trip.booking : null);

                if( originalBookings ){
                    const sanitizedBookings = originalBookings.filter((booking) => !booking.passenger_no_show);
                    const passengerNumber = sanitizedBookings.filter((booking) => booking.is_accepted).length;
                    state.tripSelected = {
                        ...trip,
                        passenger_number: passengerNumber,
                        bookings: sanitizedBookings,
                        booking: sanitizedBookings,
                    };
                    return;
                }
            }

            state.tripSelected = trip;
        },
        SET_RATING(state, bool) {
            console.log("SET_RATING", bool);
            state.ratings.rating = bool;
        },
        SET_RATINGS_INFO(state, infos) {
            console.log("SET_RATINGS_INFO", infos);
            const tripId = infos?.tripId || infos?.id;
            if(!tripId){
                return;
            }

            if(state.ratings.ratedTripIds.includes(tripId)){
                return;
            }

            const alreadyQueued = state.ratings.bookings.some((booking) => booking.id == tripId);
            if(alreadyQueued){
                return;
            }

            const driverAccountId = infos.driverAccountId || infos.driver_account_id || null;
            const normalizedInfos = {
                ...infos,
                id: tripId,
                tripId,
                driverAccountId,
            };

            state.ratings.rating = true;
            state.ratings.bookings.push(normalizedInfos);
        },
        SET_RATINGS_REMOVE(state, infos) {
            console.log("SET_RATINGS_REMOVE", infos);
            const bookingId = infos?.id;
            const markRated = Boolean(infos?.markRated);

            state.ratings.bookings = state.ratings.bookings.filter((info) => info.id != bookingId);

            const currentTripId = state.ratings.data && state.ratings.data[0]
                ? (state.ratings.data[0].trip_id || (state.ratings.data[0].trip && state.ratings.data[0].trip[0] && state.ratings.data[0].trip[0].id))
                : null;

            if( currentTripId && bookingId == currentTripId ){
                state.ratings.data = null;
            }

            if(markRated && bookingId && !state.ratings.ratedTripIds.includes(bookingId)){
                state.ratings.ratedTripIds.push(bookingId);
            }

            if(state.ratings.bookings.length == 0){
                state.ratings.rating = false;
                state.ratings.data = null;
            }
        },
        CLEAR_RATINGS_BY_TRIP_IDS(state, ids){
            const validIds = Array.isArray(ids) ? ids : [];
            state.ratings.bookings = state.ratings.bookings.filter((info) => validIds.includes(info.id));

            const currentTripId = state.ratings.data && state.ratings.data[0]
                ? (state.ratings.data[0].trip_id || (state.ratings.data[0].trip && state.ratings.data[0].trip[0] && state.ratings.data[0].trip[0].id))
                : null;

            if( currentTripId && !validIds.includes(currentTripId) ){
                state.ratings.data = null;
            }

            if(state.ratings.bookings.length == 0){
                state.ratings.rating = false;
                state.ratings.data = null;
            }
        },
    },
    actions: {
        async getContacts({ state, commit }){
            const bookings = state.tripSelected?.bookings;
            const tripId = state.tripSelected?.id;
            if(!Array.isArray(bookings) || !tripId) {
                commit('SET_CONTACTS', []);
                return;
            }

            const accountIds = [...new Set(bookings
                .map((booking) => Number(booking.passenger_account_id))
                .filter((accountId) => Number.isSafeInteger(accountId) && accountId > 0))];
            if(accountIds.length === 0) {
                commit('SET_CONTACTS', []);
                return;
            }

            const { data: accounts, error } = await supabase
                .from('account')
                .select(`
                    id,
                    user_id,
                    username,
                    avatar,
                    booking (
                        id,
                        trip_id,
                        passenger_account_id,
                        is_accepted,
                        is_refused,
                        in_car,
                        passenger_no_show,
                        payment_status,
                        trip (
                            max_seats,
                            village_departure_id,
                            village_arrival_id,
                            departure_time
                        )
                    )
                `)
                .in('id', accountIds)
                .eq('booking.trip_id', tripId);

            if(error) {
                console.error("getContacts error:", error);
                commit('SET_CONTACTS', []);
                return;
            }

            const contacts = (accounts || []).map((account) => ({
                ...account,
                booking: (account.booking || []).filter(
                    (booking) => String(booking.trip_id) === String(tripId)
                ),
                messageNumber: 0,
            }));
            commit('SET_CONTACTS', contacts);
        },
        async getProfilMember({state, rootState}, member){
            
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select(`*, settings(*)`)
                .eq('user_id', member.userUid)
            
            if(error_account){
                console.error(error_account)
                return false;
            }
            if(!account?.length){
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

                state.member.payouts_enabled = false;
                if(account[0].provider_id){
                    try {
                        const { data: provider } = await serverRequest(
                            'get',
                            `/connect/accounts/${account[0].provider_id}/status`,
                            { mode: rootState.profil.modeCo }
                        );
                        state.member.payouts_enabled = Boolean(provider?.payouts_enabled);
                    } catch (error) {
                        console.warn("Unable to retrieve Connect status:", error);
                    }
                }

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
        async updateAccepteBooking({state, rootState}, index){
            const contact = state.chat.contacts[index];
            const bookingIds = (contact?.booking || []).map((booking) => booking.id).filter(Boolean);
            if( bookingIds.length === 0 ){
                return {status: 1, message: "Réservation introuvable."};
            }

            try {
                const response = await serverRequest('post', '/bookings/decision', {
                    mode: rootState.profil.modeCo,
                    data: { bookingIds, decision: 'accept' },
                });
                const decision = response.data?.data;
                if( response.data?.status !== 'ok' || !decision ){
                    throw new Error("Réponse de décision invalide.");
                }
                const updatedIds = new Set((decision?.bookingIds || bookingIds).map(String));
                contact.booking.forEach((booking) => {
                    if( updatedIds.has(String(booking.id)) ){
                        booking.is_accepted = true;
                        booking.is_refused = false;
                        const serverBooking = decision?.bookings?.find((item) => String(item.id) === String(booking.id));
                        if( serverBooking?.payment_status ){
                            booking.payment_status = serverBooking.payment_status;
                        }
                    }
                });
                return {status: 0, message: "success", data: decision};
            }
            catch(error){
                console.error("updateAccepteBooking error:", error);
                return {
                    status: 1,
                    message: error.response?.data?.message || "Une erreur s'est produite, veuillez réessayer plus tard !",
                };
            }
        },
        async updateRefusedBooking({state, rootState}, index){
            const contact = state.chat.contacts[index];
            const bookingIds = (contact?.booking || []).map((booking) => booking.id).filter(Boolean);
            if( bookingIds.length === 0 ){
                return {status: 1, message: "Réservation introuvable."};
            }

            try {
                const response = await serverRequest('post', '/bookings/decision', {
                    mode: rootState.profil.modeCo,
                    data: { bookingIds, decision: 'refuse' },
                });
                const decision = response.data?.data;
                if( response.data?.status !== 'ok' || !decision ){
                    throw new Error("Réponse de décision invalide.");
                }
                const updatedIds = new Set((decision?.bookingIds || bookingIds).map(String));
                contact.booking.forEach((booking) => {
                    if( updatedIds.has(String(booking.id)) ){
                        booking.is_accepted = false;
                        booking.is_refused = true;
                        const serverBooking = decision?.bookings?.find((item) => String(item.id) === String(booking.id));
                        if( serverBooking?.payment_status ){
                            booking.payment_status = serverBooking.payment_status;
                        }
                    }
                });
                return {status: 0, message: "success", data: decision};
            }
            catch(error){
                console.error("updateRefusedBooking error:", error);
                return {
                    status: 1,
                    message: error.response?.data?.message || "Une erreur s'est produite, veuillez réessayer plus tard !",
                };
            }
        },
    },
}
