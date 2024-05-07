// import { createStore } from 'vuex'
// import axios from 'axios'
// import { createClient } from '@supabase/supabase-js'


import store from '../store';
import supabase from '@/utils/supabaseClient.js';
import { dateConverter, groupByDate, mapToObject } from '@/utils/utils.js';
import router from '@/router';

import stripe from '@/utils/stripe.js'

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
        modeCo: "online", //online, local
        notification: true,
        modeDriver: false,
        darkMode: false,
        userId: null,
        userUid: "",
        userName: "",
        avatarUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned',
        soldes: 0,
        gain: 0,
        cguAccepted: false,
        identity: false,
        payouts_enabled: false,
        credit_card: {
            last4: "0000",
            available: false,
            brand: "",
        },
        profil: {
            nbTrip: 0,
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
                        text:"j'aime bien discuter-",
                        chip:false,
                        chipIcon: null,
                        switchBtn: false,
                        chipText: "",
                    },
                    {
                        about: "smoke",
                        prependIconColor: "#ff5353",
                        prependIcon:"mdi-smoking-off",
                        text:"Pas de cigarette en voiture-",
                        chip:false,
                        chipIcon: null,
                        chipText: "",

                    },
                    {
                        about: "music",
                        prependIconColor: "#9fcb66",
                        prependIcon:"mdi-music",
                        text:"Music tout au long !-",
                        chip:false,
                        chipIcon: null,
                        chipText: "",

                    },
                    {
                        about: "animal",
                        prependIconColor: "#ff9c00",
                        prependIcon:"mdi-paw",
                        text:"J'aime bien les animaux-",
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
            datesTripPassenger: [],
            datesTripDriver: [],
        },
        preferenceVirementMode: 0,
        cars: [],
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
        },
        SET_PREFERENCE_VIREMENT_MODE(state, choice){
            state.preferenceVirementMode = choice;
        },
        SET_CREDIT_CARD(state, infos){
            console.log("infos----", infos);
            const available = infos.last4 != undefined && infos.last4 != "";
            state.credit_card = {last4: infos.last4, available:  available, brand: infos.brand};
        },
        SET_CGU_ACCEPTED(state, bool){
            console.log("CGU:", bool);
            state.cguAccepted = bool;
        },
        SET_REMOVE_HISTORY_DATES(state, infos){ //Supprime une date si elle a expiré
            if( infos.type=='passenger' ){
                state.history.datesTripPassenger.splice(infos.index, 1);
            }
            else{
                state.history.datesTripDriver.splice(infos.index, 1);
            }
        }
    },
    actions: {
        async getNotation({state}){
            const { count, error } = await supabase
                .from('trip')
                .select('id', { count: 'exact', head: true })
                .eq("driver_id", state.userUid);

            if(error){
                return {status: 1, message: "Erreur"}
            }
            // console.log("count", error, count);
            state.profil.nbTrip = count;
            return {status: 0, message: "Nombre de trajets:"+state.profil.nbTrip}

        },
        async addCar({state}, infos){

            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            const { data, error } = await supabase
                .from('car')
                .insert([
                    { driver_id: state.userUid, model: infos.model, license_plate: infos.licence_plate, brand: infos.brand, color: infos.color, seats: infos.seats }
                ])
                .select()

            if(error){
                console.log("Error add car:", error);
                return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
            }
        
            console.log("data-add-car:", data);
            return {status: 0, message: "Votre véhicule à bien été ajouté."};
        },
        async getCars({state}){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            
            let { data: cars, error } = await supabase
                .from('car')
                .select("*")
                .eq('driver_id', state.userUid);
                    

            if(error){
                console.log("Error add car:", error);
                return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
            }
        
            state.cars = cars;
            console.log("data-get-car:", cars);
            return {status: 0, message: "Votre véhicule à bien été ajouté."};

        },
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
        async getSoldes({state}){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            // get-credit
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select("credit, customer_id")
                .eq('user_id', state.userUid);

            if(error_account){
                console.log("Error2:", error_account);
                return {status: 2, message: "Une erreur s'est produite lors de la récupératioin de votre solde."};
            }

            const balanceConnect = await stripe.balance.retrieve({
                stripeAccount: store.state.auth.provider_id,
            });

            console.log("balanceConnect", balanceConnect);

            state.gain = (balanceConnect.available[0].amount + balanceConnect.pending[0].amount)/100;

            state.soldes = account[0].credit;
            return {status: 0, message: `Votre solide est de : ${state.soldes}`};
        },
        async addCredit({state}, infosLoad){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            // get-credit
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select("credit, customer_id")
                .eq('user_id', state.userUid)
            
            if(error_account){
                console.log("Error2:", error_account);
                return {status: 2, message: "Une erreur s'est produite lors de la récupératioin de votre solde."};
            }

            console.log("account:", account, error_account, account[0].credit+infosLoad.credit, infosLoad.no_source);

            const customerId = account[0].customer_id;
            if( ! infosLoad.no_source ){
                //get card
                const customer = await stripe.customers.retrieve(account[0].customer_id);
                console.log("retrieve customer:", customer);
                if( customer.metadata.source_selected ){
                    const cardId = customer.metadata.source_selected;
                    try {
                        const obj = {
                            amount: infosLoad.credit*100,
                            currency: 'eur',
                            customer: customerId,
                            payment_method: cardId,
                            confirm: true,
                            description: `rechargement de credits pour ${state.userName}; userUid : ${state.userUid};`,
                            // return_url: 'http://localhost:8080/profil',
                            automatic_payment_methods: {
                                enabled: true,
                                allow_redirects: 'never'
                            },
                        };
                        console.log("build-payment-intent", obj);
                        const paymentIntent = await stripe.paymentIntents.create(obj);
                
                        console.log("paymentIntent [OK]", paymentIntent);
                    } 
                    catch (error) {
                        console.error("Erreur lors de la création de l'intention de paiement:", error);
                        return {status: 2, message: "Une erreur s'est produite lors du prélevement sur votre card de credit, veuillez réessayer plus tard."};
                    }
                }
                else {
                    return {status: 4, message: "Carte de crédit non detecté"};
                }
            }

            // update
            let { data: data_update, error: error_update } = await supabase
                .from('account')
                .update({ credit: (account[0].credit + infosLoad.credit) })
                .eq('user_id', state.userUid)
                .select()
            
            if( error_update ){
                return {status: 3, message: "Une erreur s'est produite lors, un remboursement vous sera envoyé."};
            }

            state.soldes = data_update[0].credit;
            console.log("update-credit", data_update, error_update);
            return {status: 0, message: "Votre compte à bien était crédité !"};
        },
        // async transfertGain({state}, data){
        //     // get-credit
        //     let { data: account, error: error_account } = await supabase
        //         .from('account')
        //         .select("*")
        //         .eq('user_id', state.userUid);

        //     if( error_account ){
        //         console.error("Error acount:", error_account);
        //         return {status: 1, message: "Une erreur s'est produite veulliez réessayez plus tard !"}
        //     }

        //     let { data: data_update, error: error_update } = await supabase
        //         .from('account')
        //         .update({ credit: (account[0].credit + data.credit), gain: account[0].gain - data.credit })
        //         .eq('user_id', state.userUid)
        //         .select()

        //     if( error_update ){
        //         console.error("Error update:", error_update);
        //         return {status: 2, message: "Une erreur s'est produite veulliez réessayez plus tard !"}
        //     }

        //     state.soldes = data_update[0].credit;
        //     state.gain = data_update[0].gain;
            
        //     return {status: 0, message: "Votre transfert à bien été effectué !"};
        // },
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

                    if( currentDate.getTime() <= new Date(booking.departure_time).getTime() )
                        _trips.push(booking);
                }
            }

            if( _trips.length == 0 ){
                console.error("Error : Aucun trajets; code 2")
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
        async removeBooking({state}, infos){

            const { error } = await supabase
                .from('booking')
                .delete()
                .eq('trip_id', infos.trip_id)
                .eq('passenger_account_id', state.userId);

            if(error){
                console.error("Error:", error);
                return {status: 1, message: "Une erreur s'est produite vueillez réessayer plus tard"}
            }
            
            return {status: 0, message: "Suppression effectuée avec succèes"};

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
        },
        // stripe
        async getProvider({state}){
            let { data: account, error } = await supabase
                .from('account')
                .select(`
                    provider_id
                `)
                .eq('user_id', state.userUid)

            if(error){
                console.error("Error : ", error)
                return {status: 1, message: "Une erreur s'est produite"}
            }

            const provider = await stripe.accounts.retrieve(account[0].provider_id);
            console.log("retrieve provider : ", provider);
            store.state.auth.provider_id = provider.id;
            store.state.auth.stripe_provider = provider;
            state.payouts_enabled = provider.payouts_enabled;
        },
        async identityChecked({state}){
            
            const { data, error } = await supabase
                .from('account')
                .update({ identity: true })
                .eq('user_id', state.userUid)
                .select()
        
            if(error){
                console.error("Error : ", error)
                return {status: 1, message: "Une erreur s'est produite"}
            }


            if(data){
                state.identity = true;
                return {status: 0, message:"Mise à jour effectuée avec succées"};
            }
            return {status: 2, message: "Un problème est survenue"};
        },
    },
}
