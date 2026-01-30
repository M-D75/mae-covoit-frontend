// import { createStore } from 'vuex'
import axios from 'axios'
// import { createClient } from '@supabase/supabase-js'


import store from '../store';
import supabase from '@/utils/supabaseClient.js';
import { dateConverter, groupByDate, mapToObject } from '@/utils/utils.js';
import router from '@/router';

import stripe from '@/utils/stripe.js'
import { fetchPassengerTrips, normalizePassengerTrips } from '@/services/travels.js';
import { humanizeSupabaseError } from '@/utils/errorMessages.js';
import { sendServerNotification } from '@/utils/notifications.js';

async function releaseExpiredWalletReservations(state, accountRow) {
    const cutoff = new Date(Date.now() - (60 * 60 * 1000)).toISOString();

    const { data: expiredBookings, error: expiredError } = await supabase
        .from('booking')
        .select(`
            id,
            trip:trip_id (
                price,
                departure_time
            )
        `)
        .eq('passenger_account_id', accountRow.id)
        .eq('payment_status', 'wallet_reserved')
        .eq('in_car', false)
        .lt('trip.departure_time', cutoff);

    if (expiredError) {
        console.error('releaseExpiredWalletReservations error:', expiredError);
        throw new Error(humanizeSupabaseError(expiredError));
    }

    if (!expiredBookings || expiredBookings.length === 0) {
        return accountRow.credit;
    }

    const refundAmount = expiredBookings.reduce((sum, booking) => {
        const price = booking.trip && booking.trip.price ? booking.trip.price : 0;
        return sum + price;
    }, 0);

    if (refundAmount <= 0) {
        return accountRow.credit;
    }

    const { data: updatedAccount, error: updateError } = await supabase
        .from('account')
        .update({ credit: accountRow.credit + refundAmount })
        .eq('id', accountRow.id)
        .select();

    if (updateError) {
        console.error('releaseExpiredWalletReservations update error:', updateError);
        throw new Error(humanizeSupabaseError(updateError));
    }

    const bookingIds = expiredBookings.map((booking) => booking.id);

    const { error: bookingUpdateError } = await supabase
        .from('booking')
        .update({ payment_status: 'wallet_released' })
        .in('id', bookingIds);

    if (bookingUpdateError) {
        console.error('releaseExpiredWalletReservations booking update error:', bookingUpdateError);
        throw new Error(humanizeSupabaseError(bookingUpdateError));
    }

    return updatedAccount[0].credit;
}

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
        pendingDebit: 0,
        gain: {
            pending: 0,
            transit: 0,
        },
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
        //panneau-info
        blockChangingTheme: false,
    },
    getters: {
    },
    mutations: {
        SET_USER_UID(state, userUid) {
            state.userUid = userUid;
        },
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
        },
        REMOVE_HISTORY_DATE_BY_VALUE(state, infos){
            const type = infos?.type === 'driver' ? 'datesTripDriver' : 'datesTripPassenger';
            if(!infos?.departure_time || !Array.isArray(state.history[type])){
                return;
            }
            state.history[type] = state.history[type].filter((date) => date !== infos.departure_time);
        },
        SET_BLOCK_CHANGING_THEME(state, bool){ //Supprime une date si elle a expiré
            state.blockChangingTheme = bool;
        },
        
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
                .select("id, credit, customer_id")
                .eq('user_id', state.userUid);

            if(error_account){
                console.log("Error2:", error_account);
                return {status: 2, message: humanizeSupabaseError(error_account, "Une erreur s'est produite lors de la récupération de votre solde.")};
            }

            try {
                account[0].credit = await releaseExpiredWalletReservations(state, account[0]);
            }
            catch(error){
                console.error("releaseExpiredWalletReservations failed:", error);
                return {status: 2, message: error.message || "Impossible de mettre à jour vos crédits. Réessayez plus tard."};
            }
            const accountId = account[0].id;
            let refreshedCredit = account[0].credit;

            const balanceConnect = await stripe.balance.retrieve({
                stripeAccount: store.state.auth.provider_id,
            });

            console.log("balanceConnect", balanceConnect, balanceConnect.available[0].amount, balanceConnect.pending[0].amount, (balanceConnect.available[0].amount + balanceConnect.pending[0].amount));

            state.gain.transit = (balanceConnect.available[0].amount + balanceConnect.pending[0].amount)/100;

            // pending

            let { data: strip_charge, error: error_strip_charge } = await supabase
                .from('strip_charge')
                .select('*')
                .neq("account_id", state.userId)
                .eq("transfered", false);
        
            if(error_strip_charge){
                console.error("Error:", error_strip_charge);
            }

            console.log("strip_charge", strip_charge);
            state.gain.pending = 0;

            if(strip_charge.length > 0){    
                for (let index = 0; index < strip_charge.length; index++) {
                    const element = strip_charge[index];
                    const balanceTransaction = await stripe.balanceTransactions.retrieve(
                        element.charge_id
                    );

                    console.log("balanceTransaction", balanceTransaction);

                    // const charge = await stripe.charges.retrieve(balanceTransaction.source);
                    
                    // console.log("charge", charge, charge.customer, account[0].customer_id);
                    console.log("driver_id:${state.userUid}", `driver_id:${state.userUid}`);
                    console.log("description:", balanceTransaction.description);
                    if(balanceTransaction.description.includes(`driver_id:${state.userUid}`)){
                        state.gain.pending += (balanceTransaction.net * 0.59)/100;
                    }
                }
                state.gain.pending = parseFloat(state.gain.pending).toFixed(2)
                console.log("pending", state.gain.pending);
            }

            // console.log("state.gain", state.gain);

            state.soldes = refreshedCredit;
            state.pendingDebit = 0;

            let cardHold = 0;
            const { data: pending_debits, error: pending_error } = await supabase
                .from('stripe_pending_capture')
                .select('amount, payment_intent_id, capture_after, trip_id, booking_ids')
                .eq('passenger_account_id', account[0].id)
                .eq('status', 'requires_capture');

            if(pending_error){
                console.error("pending debit error:", pending_error);
            }
            else if(pending_debits && pending_debits.length > 0){
                const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}
                const typeUrl = state.modeCo;
                let totalHold = 0;
                const now = new Date();
                const parseBookingIds = (rawValue) => {
                    if(Array.isArray(rawValue)){
                        return rawValue;
                    }
                    if(typeof rawValue === 'string'){
                        try {
                            const parsed = JSON.parse(rawValue);
                            return Array.isArray(parsed) ? parsed : [];
                        }
                        catch(parseError){
                            console.error("pending debit booking_ids parse error:", parseError);
                            return [];
                        }
                    }
                    return [];
                };

                for (const record of pending_debits) {
                    const amount = record.amount || 0;
                    const bookingIds = parseBookingIds(record.booking_ids);
                    let mustCancel = record.capture_after ? new Date(record.capture_after) < now : false;

                    if(bookingIds.length === 0){
                        mustCancel = true;
                    }
                    else if(!mustCancel){
                        const { data: bookingStatuses, error: bookingStatusError } = await supabase
                            .from('booking')
                            .select('id, is_refused')
                            .in('id', bookingIds);

                        if(bookingStatusError){
                            console.error("pending debit booking status error:", bookingStatusError);
                        }
                        else if(!bookingStatuses || bookingStatuses.length === 0 || bookingStatuses.every((booking) => booking.is_refused)){
                            mustCancel = true;
                        }
                    }

                    if(mustCancel){
                        try {
                            console.log("Cancelling pending capture:", record.payment_intent_id);
                            await axios.post(`${adresse[typeUrl]}/payments/cancel`, {
                                paymentIntentId: record.payment_intent_id,
                                tripId: record.trip_id,
                            });
                        }
                        catch(error){
                            console.error("Failed to cancel pending capture:", error);
                        }
                        continue;
                    }

                    totalHold += amount;
                }

                cardHold = totalHold / 100;
            }

            let walletHold = 0;
            const { data: wallet_reserved, error: wallet_error } = await supabase
                .from('booking')
                .select(`
                    id,
                    is_refused,
                    trip:trip_id (
                        price
                    )
                `)
                .eq('passenger_account_id', account[0].id)
                .eq('payment_status', 'wallet_reserved');

            if(wallet_error){
                console.error("wallet reserved error:", wallet_error);
            }
            else if(wallet_reserved && wallet_reserved.length > 0){
                let walletRefund = 0;
                const walletReleaseIds = [];

                wallet_reserved.forEach((booking) => {
                    const price = booking.trip && booking.trip.price ? booking.trip.price : 0;
                    const numericPrice = Number(price) || 0;
                    if(booking.is_refused || !booking.trip){
                        walletRefund += numericPrice;
                        walletReleaseIds.push(booking.id);
                    }
                    else{
                        walletHold += numericPrice;
                    }
                });

                if(walletRefund > 0){
                    const { data: updatedAccount, error: walletCreditError } = await supabase
                        .from('account')
                        .update({ credit: refreshedCredit + walletRefund })
                        .eq('id', accountId)
                        .select();

                    if(walletCreditError){
                        console.error("wallet refund credit update error:", walletCreditError);
                    }
                    else if(updatedAccount && updatedAccount.length > 0){
                        refreshedCredit = updatedAccount[0].credit;
                    }

                    if(walletReleaseIds.length > 0){
                        const { error: walletReleaseError } = await supabase
                            .from('booking')
                            .update({ payment_status: 'wallet_released' })
                            .in('id', walletReleaseIds);

                        if(walletReleaseError){
                            console.error("wallet release update error:", walletReleaseError);
                        }
                    }
                }
            }

            state.pendingDebit = parseFloat((cardHold + walletHold).toFixed(2));
            state.soldes = refreshedCredit;

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
        async getTravels({state, commit}){

            state.profil.myTravels = [];
            state.history.datesTripPassenger = [];

            try{
                const resolveVillage = (id) => store.getters["search/GET_VILLAGE_BY_ID"](id);
                const bookings = await fetchPassengerTrips({ passengerAccountId: state.userId, includeHistory: false });
                const normalizedTrips = normalizePassengerTrips(bookings, resolveVillage);

                if( normalizedTrips.length === 0 ){
                    console.error("Error : Aucun trajets; code 2")
                    state.history.datesTripPassenger = [];
                    commit('trip/CLEAR_RATINGS_BY_TRIP_IDS', [], { root: true });
                    return {status: 2, message: "Aucun trajets"};
                }

                const groupedInfos = normalizedTrips.reduce((acc, info) => {
                    if( store.state.trip.notMessageVue.includes(info.id + "") )
                        info.notifMessage = true;

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
                state.history.datesTripPassenger = normalizedTrips.map((trip) => trip.departure_time);
                commit('trip/CLEAR_RATINGS_BY_TRIP_IDS', normalizedTrips.map((trip) => trip.id), { root: true });
                console.log("_trips:", normalizedTrips, state.profil.myTravels);
    
                return {status: 0, message: "success"};
            }
            catch(error){
                console.error("getTravels error:", error);
                state.history.datesTripPassenger = [];
                commit('trip/CLEAR_RATINGS_BY_TRIP_IDS', [], { root: true });
                return {status: 1, message: "Aucun trajet"};
            }
        },
        async getPublish({state}){
            const currentDate = new Date();
            const minDisplayDate = currentDate.getTime() - (60 * 60 * 1000);

            state.profil.myPublish = [];
            state.history.datesTripDriver = [];

            await store.dispatch("search/getOwnTrip");

            if( ! store.state.search.trajets ){
                console.error("Error getPush 1")
                state.history.datesTripDriver = [];
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
                    const tripTime = new Date(trajet.departure_time).getTime();
                    if( tripTime >= minDisplayDate )
                        _trips.push(trajet);
                }
            }

            if( _trips.length == 0 ){
                console.error("Error getPush 2, Aucune publication")
                state.history.datesTripDriver = [];
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
            state.history.datesTripDriver = _trips.map((trip) => trip.departure_time);
            console.log("_trips:", _trips, state.profil.myPublish);

            return {status: 0, message: "success"};
        },
        async removeBooking({state, commit}, infos){

            let tripInfos = null;
            if(infos.trip_id){
                const { data: tripData, error: tripError } = await supabase
                    .from('trip')
                    .select('id, driver_id, village_departure_id, village_arrival_id, departure_time')
                    .eq('id', infos.trip_id)
                    .limit(1);

                if(!tripError && Array.isArray(tripData) && tripData.length > 0){
                    tripInfos = tripData[0];
                }
                else if(tripError){
                    console.error("removeBooking trip fetch error:", tripError);
                }
            }

            const { error } = await supabase
                .from('booking')
                .delete()
                .eq('trip_id', infos.trip_id)
                .eq('passenger_account_id', state.userId);

            if(error){
                console.error("Error:", error);
                return {status: 1, message: "Une erreur s'est produite vueillez réessayer plus tard"}
            }

            if(tripInfos && tripInfos.driver_id){
                const villageGetter = store.getters["search/GET_VILLAGE_BY_ID"];
                const resolveVillage = (id) => typeof villageGetter === 'function' ? villageGetter(id) : "";
                const departureName = resolveVillage(tripInfos.village_departure_id) || "Départ";
                const destinationName = resolveVillage(tripInfos.village_arrival_id) || "Destination";
                const departureTime = new Date(tripInfos.departure_time);
                const formattedHour = `${departureTime.getHours().toString().padStart(2, '0')}:${departureTime.getMinutes().toString().padStart(2, '0')}`;
                const passengerName = `${state.profil.infos_perso.prenom || ''} ${state.profil.infos_perso.nom || ''}`.trim() || state.userName || "Un passager";

                await sendServerNotification({
                    mode: state.modeCo,
                    userId: tripInfos.driver_id,
                    title: "Réservation annulée",
                    body: `${passengerName} s'est désisté pour ${departureName} → ${destinationName}.`,
                    data: {
                        largeBody: `${passengerName} a annulé sa place pour le trajet ${departureName} → ${destinationName} prévu à ${formattedHour}.`,
                        actions: {
                            goTo: "/profil/open-trip-driver",
                        }
                    }
                });
            }

            if(tripInfos && tripInfos.departure_time){
                commit('REMOVE_HISTORY_DATE_BY_VALUE', { type: 'passenger', departure_time: tripInfos.departure_time });
            }

            commit('trip/SET_RATINGS_REMOVE', { id: infos.trip_id }, { root: true });
            
            return {status: 0, message: "Suppression effectuée avec succèes"};

        },
        async cancelTripPublication({state, commit, dispatch}, tripInfos){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return {status: 1, message: "Session expirée"};
            }

            const tripId = tripInfos?.id;
            if( !tripId ){
                return {status: 2, message: "Trajet introuvable"};
            }

            const { data: trip, error: tripError } = await supabase
                .from('trip')
                .select(`
                    id,
                    price,
                    departure_time,
                    driver_id,
                    village_departure_id,
                    village_arrival_id,
                    booking (
                        id,
                        passenger_account_id,
                        payment_status,
                        payment_intent_id,
                        account (
                            id,
                            credit,
                            firstname,
                            lastname,
                            user_id
                        )
                    )
                `)
                .eq('id', tripId)
                .single();

            if(tripError || !trip){
                console.error("cancelTripPublication trip error:", tripError);
                return {status: 2, message: "Impossible de récupérer le trajet."};
            }

            const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}
            const typeUrl = state.modeCo;
            const resolveVillage = store.getters["search/GET_VILLAGE_BY_ID"];
            const departureName = typeof resolveVillage === 'function' ? resolveVillage(trip.village_departure_id) : "";
            const destinationName = typeof resolveVillage === 'function' ? resolveVillage(trip.village_arrival_id) : "";
            const departureTime = new Date(trip.departure_time);
            const formattedHour = `${departureTime.getHours().toString().padStart(2, '0')}:${departureTime.getMinutes().toString().padStart(2, '0')}`;

            const activeBookings = (trip.booking || []).filter((booking) => !booking.passenger_no_show);
            for (const booking of activeBookings) {
                if( booking.payment_status === 'requires_capture' && booking.payment_intent_id ){
                    try{
                        await axios.post(`${adresse[typeUrl]}/payments/cancel`, {
                            paymentIntentId: booking.payment_intent_id,
                            tripId: tripId,
                        });
                    }
                    catch(error){
                        console.error("cancelTripPublication payment cancel error:", error);
                    }
                }
                else if( booking.payment_status === 'wallet_reserved' ){
                    try{
                        const currentCredit = booking.account?.credit || 0;
                        const newCredit = currentCredit + (trip.price || 0);
                        await supabase
                            .from('account')
                            .update({ credit: newCredit })
                            .eq('id', booking.passenger_account_id);
                    }
                    catch(error){
                        console.error("cancelTripPublication wallet refund error:", error);
                    }
                }

                if( booking.account && booking.account.user_id ){
                    const passengerName = `${booking.account.firstname || ''} ${booking.account.lastname || ''}`.trim() || "Le passager";
                    await sendServerNotification({
                        mode: state.modeCo,
                        userId: booking.account.user_id,
                        title: "Trajet annulé",
                        body: "Le conducteur a annulé votre trajet.",
                        data: {
                            largeBody: `${passengerName}, le trajet ${departureName} → ${destinationName} (${formattedHour}) a été annulé par le chauffeur.`,
                            actions: {
                                goTo: "/profil/open-trip-passenger",
                            }
                        }
                    });
                }
            }

            await supabase.from('booking').delete().eq('trip_id', tripId);
            await supabase.from('trip').delete().eq('id', tripId);

            commit('REMOVE_HISTORY_DATE_BY_VALUE', { type: 'driver', departure_time: trip.departure_time });
            state.profil.myPublish = state.profil.myPublish.reduce((acc, group) => {
                const remaining = group.infos.filter((info) => info.id != tripId);
                if( remaining.length > 0 ){
                    acc.push({
                        ...group,
                        infos: remaining,
                    });
                }
                return acc;
            }, []);
            await store.dispatch("profil/getSoldes");
            await dispatch('getPublish');

            return {status: 0, message: "Trajet annulé"};
        },
        async buildHistoriqueBooking({state}){

            state.history.load = true;

            try{
                const resolveVillage = (id) => store.getters["search/GET_VILLAGE_BY_ID"](id);
                const bookings = await fetchPassengerTrips({ passengerAccountId: state.userId, includeHistory: true });
                const normalized = normalizePassengerTrips(bookings, resolveVillage);

                const simplified = normalized.map((trip_current) => ({
                    depart: trip_current.depart,
                    destination: trip_current.destination,
                    departure_time: trip_current.departure_time,
                    avatar: trip_current.avatar != null ? trip_current.avatar : "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned",
                    price: trip_current.price,
                }));
    
                console.log("_bookings", simplified);
    
                const bookingGrouped = mapToObject(groupByDate(simplified));
                console.log("grouped: ", bookingGrouped);
                state.history.historycalBooking = bookingGrouped;
            }
            catch(error){
                console.error("buildHistoriqueBooking error:", error);
            }
            finally{
                state.history.load = false;
            }
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
