// import { createStore } from 'vuex'
// import axios from 'axios'
// import { createClient } from '@supabase/supabase-js'


import store from '../store';
import supabase from '@/utils/supabaseClient.js';
import { dateConverter, groupByDate, mapToObject } from '@/utils/utils.js';

export default {
    namespaced: true,
    state: {
        aboutPrefs: {
            discution: "disscution",
            smoke: "fumer",
            music: "musique",
            animal: "animal",
        },
        auto_accept_trip: true,
        modeCo: "online",
        notification: true,
        modeDriver: true,
        darkMode: false,
        userId: null,
        userUid: "",
        userName: "",
        avatarUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned',
        soldes: 0,
        gain: 0,
        credit_card: {
            num_end_credit_card: "0000",
            available: false,
        },
        profil: {
            infos_perso: {
                civilite: "Mr.",
                nom: "Ledou",
                prenom: "BG",
                email: "",
                tel: "",
                adress: {
                    principal: "",
                    complement: "",
                    code_postal: "",
                    commune: "",
                },
                preferences: [
                    {
                        about: "discution",
                        prependIconColor: "var(--blue-color)",
                        prependIcon:"mdi-forum",
                        text:"j'aime bien discuter",
                        chip:false,
                        chipIcon: null,
                        switchBtn: false,
                        chipText: "",
                    },
                    {
                        about: "smoke",
                        prependIconColor: "#ff5353",
                        prependIcon:"mdi-smoking-off",
                        text:"Pas de cigarette en voiture",
                        chip:false,
                        chipIcon: null,
                        chipText: "",

                    },
                    {
                        about: "music",
                        prependIconColor: "#9fcb66",
                        prependIcon:"mdi-music",
                        text:"Music tout au long !",
                        chip:false,
                        chipIcon: null,
                        chipText: "",

                    },
                    {
                        about: "animal",
                        prependIconColor: "#ff9c00",
                        prependIcon:"mdi-paw",
                        text:"J'aime bien les animaux",
                        chip:false,
                        chipIcon: null,
                        chipText: "",
                    },
                ],
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
        SET_INFOS(state, data){
            state.profil.infos_perso.civilite = data.civilite;
            state.profil.infos_perso.nom = data.nom;
            state.profil.infos_perso.prenom = data.prenom;
            state.profil.infos_perso.tel = data.tel;
            state.profil.infos_perso.adress.principal = data.principal;
            state.profil.infos_perso.adress.complement = data.complement;
            state.profil.infos_perso.adress.code_postal = data.code_postal;
            state.profil.infos_perso.adress.commune = data.commune;
        },
        SET_NOTIFICATION(state, boolean){
            state.notification = boolean;
        },
        SET_MODE_DRIVER(state, boolean){
            state.modeDriver = boolean;
        },
        SET_DARKMODE(state, boolean){
            state.darkMode = boolean;
        },
        SET_AVATAR_URL(state, url){
            state.avatarUrl = url;
        },
        SET_LOAD_GET_TRIP_PUBLISH(state, boolean){
            state.profil.loadGetTripPublish = boolean;
        },
        SET_PREFERENCE_ABOUT(state, pref){
            console.log("SET_PREFERENCE_ABOUT", pref);
            for(let i=0; i<state.profil.infos_perso.preferences.length; i++){
                if( pref.about == state.profil.infos_perso.preferences[i].about ){
                    state.profil.infos_perso.preferences[i] = pref;
                }
            }
        },
        SET_AUTO_VALIDATION(state, bool){
            state.auto_accept_trip = bool;
        }
    },
    actions: {
        async updateAutoValidation({ state }){
            const { data, error } = await supabase
                .from('settings')
                .update({ auto_accept_trip: state.auto_accept_trip })
                .eq('account_id', state.userId)
                .select();

            if(error){
                console.error("Error", error)
                state.auto_accept_trip = !state.auto_accept_trip;
                return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
            }

            if( data ){
                // console.log("data auto_accept_trip : ", data);
                state.auto_accept_trip = data[0].auto_accept_trip;
            }

            console.log("autovalidation", state.auto_accept_trip ? "activated" : "desactivated");
            return {status: 0, message: ""};
        },
        async updateAvatar({state}, avatar){
            // update
            await supabase
                .from('account')
                .update({ avatar: avatar })
                .eq('user_id', state.userUid)
                .select()
        },
        async updatePreference({state}){
            
            const { data, error } = await supabase
                .from('settings')
                .update({ prefer: state.profil.infos_perso.preferences.map( (pref) => pref.index ) })
                .eq('account_id', state.userId)
                .select()

            if( error ){
                console.error("Error update setting : ", error)
            }

            console.log("setting-update", data);

        },
        async registerVehicul(){
            
        },
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

            state.profil.myTravels = [];
            
            const currentDate = new Date();

            await store.dispatch("search/getBookings", false);

            if( ! store.state.search.trajets ){
                console.error("Error getTravels 1")
                return {status: 1, message: "Aucun trajet"};
            }

            let bokings = store.state.search.trajets;

            let _trips = [];
            for (let index = 0; index < bokings.length; index++) {
                const booking = bokings[index]; 

                if( booking ){
                    if( store.state.trip.notMessageVue.includes(booking.id + "") )
                        booking.notifMessage = true;

                    if( currentDate.getTime() <= new Date(booking.departure_time).getTime() && booking.is_accepted )
                        _trips.push(booking);
                }
            }

            if( _trips.length == 0 ){
                console.error("Error getTravels 2")
                return {status: 2, message: "Aucun trajets"};
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

            return {status: 0, message: "success"};
        },
        async getPublish({state}){
            const currentDate = new Date();

            state.profil.myPublish = [];

            await store.dispatch("search/getOwnTrip");

            if( ! store.state.search.trajets ){
                console.error("Error getPush 1")
                return {status: 1, message: "Aucun trajet"};
            }

            let publish = store.state.search.trajets;

            let _trips = [];
            for (let index = 0; index < publish.length; index++) {
                const trajet = publish[index]
                if(trajet){
                    // trajet.name = "Vous";
                    if( store.state.trip.notMessageVue.includes(trajet.id + "") )
                        trajet.notifMessage = true;

                    if( currentDate.getTime() <= new Date(trajet.departure_time).getTime() )
                        _trips.push(trajet);
                }
            }

            if( _trips.length == 0 ){
                console.error("Error getPush 2, Aucune publication")
                return {status: 2, message: "Aucun trajets"};
            }

            const groupedInfos = _trips.reduce((acc, info) => {
                const departureDate = new Date(info.departure_time);
                const formattedDate = dateConverter(departureDate);
                
                const existingGroup = acc.find(group => group.date === formattedDate);
                if ( existingGroup ) {
                    existingGroup.infos.push(info);
                    existingGroup.infos = existingGroup.infos.sort((a, b) => {
                        let dateA = new Date(a.departure_time);
                        let dateB = new Date(b.departure_time);
                      
                        return dateA.getTime() - dateB.getTime();
                    })
                }
                else {
                    acc.push({
                        date: formattedDate,
                        infos: [info],
                    });
                }
                
                return acc;
            }, []);
            
            console.log("groupedInfos:", groupedInfos);

            state.profil.myPublish = groupedInfos;
            console.log("_trips:", _trips, state.profil.myPublish);

            return {status: 0, message: "success"};
        },
        async buildHistoriqueBooking({state}){

            state.history.load = true;

            await store.dispatch("search/getBookings", true);

            if( ! store.state.search.trajets ){
                console.error("Error getTravels 1")
                return {status: 1, message: "Aucun trajet"};
            }

            let bookings = store.state.search.trajets;

            let _bookings = [];
            //let ensemble = [];
            for (let index = 0; index < bookings.length; index++) {

                const trip_current = bookings[index];

                const data = {
                    depart: trip_current.depart,
                    destination: trip_current.destination,
                    departure_time: trip_current.departure_time,
                    avatar: trip_current.avatar != null ? trip_current.avatar : "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned",
                    price: trip_current.price,
                }
                _bookings.push(data);
            }

            console.log("_bookings", _bookings);

            const bookingGrouped = mapToObject(groupByDate(_bookings));
            console.log("grouped: ", bookingGrouped);
            state.history.historycalBooking = bookingGrouped;

            state.history.load = false;
        }
    },
}
