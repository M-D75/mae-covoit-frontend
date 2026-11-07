// import { createStore } from 'vuex'
// import axios from 'axios'

import {preferencesFromIndices} from '@/services/travelPreferences.js';
import supabase from '@/utils/supabaseClient.js';
import { fetchAccessibleTrip } from '@/services/tripPresentation.js';
import {loadRatingContext} from '@/services/ratingPreferences.js';
import { serverRequest } from '@/utils/serverApi.js';

let memberRequest = 0, contactsRequest = 0, selectedTripRequest = 0;

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
        notMessageVue: [], unreadConversations: [], unreadOwner: null, activeChat: null,
    },
    getters: {
        getTripSelected: (state) => state.tripSelected,
    },
    mutations: {
        RESET_RATING_PROMPT(state){state.ratings={rating:false,bookings:[],ratedTripIds:[],data:null};},
        SET_ACTIVE_CHAT(state,value) { state.activeChat=value?.active ? value : null; },
        CLEAR_MESSAGING(state) { state.notMessageVue=[]; state.unreadConversations=[]; state.unreadOwner=null; state.activeChat=null; state.chat.contacts=[]; },
        SET_CHAT_UNREAD(state,{owner,conversations}) { state.unreadOwner=owner; state.unreadConversations=conversations; state.notMessageVue=[...new Set(conversations.map(c=>String(c.tripId)))]; },
        SET_CONTACTS(state, contacts) {
            state.chat.contacts = contacts;
        },
        SET_NOT_MESSAGE_VUE(state, idTrips) {
            state.notMessageVue = idTrips;
        },
        SET_TRIP_SELECTED(state, trip) {
            if(!trip?.id || Number(state.tripSelected?.id)!==Number(trip.id))selectedTripRequest++;
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
        async loadSelectedTrip({rootState, commit, dispatch}, tripId) {
            const owner = rootState.profil.userUid, generation = rootState.profil.accountGeneration, accountId=rootState.profil.userId, request=++selectedTripRequest;
            const current = () => rootState.profil.userUid === owner && rootState.profil.accountGeneration === generation && request===selectedTripRequest;
            try {
                if (!await dispatch('search/getVillages', null, {root: true})) throw new Error('Villages indisponibles.');
                if(!current())return {status:2,stale:true};
                const trip = await fetchAccessibleTrip(supabase, {tripId: Number(tripId), userUid: owner,
                    accountId, resolveVillage: id => rootState.search.villages.find(v => v.id == id)?.village || ''});
                if (!current()) return {status: 2, stale: true};
                commit('SET_TRIP_SELECTED', trip);
                return {status: 0};
            } catch(error) {
                if(!current())return {status:2,stale:true};
                if (current()) commit('SET_TRIP_SELECTED', {});
                return {status: 1, message: error.message || 'Trajet indisponible.'};
            }
        },
        async openRatingForTrip({state,rootState,commit},tripId){
            const owner=rootState.profil.userUid, generation=rootState.profil.accountGeneration;
            const data=await loadRatingContext(supabase,{tripId,accountId:rootState.profil.userId});
            if(rootState.profil.userUid!==owner||rootState.profil.accountGeneration!==generation)return false;
            commit('rating/RESET_RATING_SELECTION',null,{root:true});
            state.ratings.data=data;state.ratings.rating=true;return true;
        },
        async refreshUnread({commit,rootState}) {
            const owner=rootState.profil.userUid;
            if(!owner){commit('CLEAR_MESSAGING');return;}
            try { const response=await serverRequest('get','/chat/unread',{mode:rootState.profil.modeCo});
                if(rootState.profil.userUid===owner)commit('SET_CHAT_UNREAD',{owner,conversations:response.data.data.conversations});
            } catch { if(rootState.profil.userUid===owner)commit('SET_CHAT_UNREAD',{owner,conversations:[]}); }
        },
        async getContacts({ state, commit, rootState }){
            const owner=rootState.profil.userUid,generation=rootState.profil.accountGeneration,request=++contactsRequest;
            const current=()=>rootState.profil.userUid===owner&&rootState.profil.accountGeneration===generation
                &&request===contactsRequest&&state.tripSelected?.id===tripId;
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

            const { data: accounts, error } = await supabase.from('public_profile')
                .select('id,user_id,username,firstname,lastname,avatar').in('id',accountIds);
            if(!current())return;

            if(error) {
                console.error("getContacts error:", error);
                commit('SET_CONTACTS', []);
                return;
            }

            const contacts = (accounts || []).map((account) => ({
                ...account,
                booking: bookings.filter(booking=>Number(booking.passenger_account_id)===Number(account.id)).map(booking=>({...booking,
                    trip:{id:tripId,max_seats:state.tripSelected.max_seats,village_departure_id:state.tripSelected.village_departure_id,
                        village_arrival_id:state.tripSelected.village_arrival_id,departure_time:state.tripSelected.departure_time}})),
                messageNumber: 0,
            }));
            commit('SET_CONTACTS', contacts);
        },
        async getProfilMember({state, rootState, dispatch}, member){
            const owner=rootState.profil.userUid, generation=rootState.profil.accountGeneration, request=++memberRequest;
            const current=()=>rootState.profil.userUid===owner&&rootState.profil.accountGeneration===generation&&request===memberRequest;
            const empty={ratingStatus:'loading',userId:null,identity:false,payouts_enabled:false,avatar:'',userName:'',location:'',preferences:[],notation:{avis:0,nbTrip:0,satisfaction:0}};
            state.member=empty;
            try {
                const {data,error}=await supabase.from('public_profile').select('*').eq('user_id',member.userUid);
                if(!current())return false;
                if(error||!data?.length)return false;
                const account=data[0], settings=Array.isArray(account.settings)?account.settings[0]:account.settings;
                const profile={...empty,avatar:account.avatar||'',userName:[account.firstname,account.lastname].filter(Boolean).join(' ')||account.username||'Membre',
                    userId:account.id,identity:Boolean(account.identity),location:account.village||'',preferences:preferencesFromIndices(settings?.prefer),notation:{...empty.notation}};
                const {count,error:countError}=await supabase.from('trip').select('id',{count:'exact'}).eq('driver_id',member.userUid);
                if(!current())return false;
                if(!countError)profile.notation.nbTrip=Number(count)||0;
                if(account.id){
                    try {
                        const {data:provider}=await serverRequest('get',`/profiles/${account.id}/payment-status`,{mode:rootState.profil.modeCo});
                        if(!current())return false;
                        profile.payouts_enabled=Boolean(provider?.data?.payoutsEnabled);
                    }catch{/* The public profile remains available without Stripe. */}
                }
                if(!current())return false;
                state.member=profile;
                const summary = await dispatch('rating/getRating', {userId:account.id}, {root:true});
                if(!current()) return false;
                state.member.ratingStatus = summary?.status === 0 ? 'ready' : 'error';
                return true;
            }catch{return false;}
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
