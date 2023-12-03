// import { createStore } from 'vuex'
// import axios from 'axios'
// import { createClient } from '@supabase/supabase-js'


import store from '../store';
import supabase from '@/utils/supabaseClient.js';
import { dateConverter, groupByDate, mapToObject } from '@/utils/utils.js';

export default {
    namespaced: true,
    state: {
        notification: true,
        modeDriver: true,
        darkMode: false,
        userId: null,
        userUid: "",
        userName: "",
        avatarUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned',
        soldes: 0,
        autoValidation: true,
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
            state.autoValidation = bool;
        }
    },
    actions: {
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

            if( booking.length == 0 ){
                console.log("no booking");
                return false
            }

            console.log("booking:", booking.length, error_booking, booking[0].trip_id);

            await store.dispatch("search/getTrajets");

            let _trips = [];
            for (let index = 0; index < booking.length; index++) {
                const trip_id = booking[index].trip_id;
                const trajet = store.state.search.trajets.find(
                        (trajet) => trajet.id == trip_id
                        && new Date().getTime() < new Date(trajet.departure_time).getTime()
                    );

                if( trajet ){
                    if( store.state.trip.notMessageVue.includes(trajet.id + "") )
                        trajet.notifMessage = true;
                    _trips.push(trajet);
                }
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

            const currentDate = new Date();

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

            await store.dispatch("search/getOwnTrajets");

            let _trips = [];
            for (let index = 0; index < db_trip.length; index++) {
                const trip_id = db_trip[index].id;
                const trajet = store.state.search.trajets.find((trajet) => trajet.id == trip_id);
                if(trajet){
                    trajet.name = "Vous";
                    if( store.state.trip.notMessageVue.includes(trajet.id + "") )
                        trajet.notifMessage = true;

                    if( currentDate.getTime() <= new Date(trajet.departure_time).getTime() )
                        _trips.push(trajet);
                }
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

            return _trips.length > 0;
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

                    let { data: account_driver } = await supabase
                        .from('account')
                        .select("*")
                        .eq('user_id', trip_current.driver_id)

                    const data = {
                        depart: trip_current.depart,
                        destination: trip_current.destination,
                        departure_time: trip_current.departure_time,
                        avatar: account_driver != null && account_driver.length > 0 && account_driver[0].avatar != null ? account_driver[0].avatar : "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned",
                        price: trip_current.price,
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
