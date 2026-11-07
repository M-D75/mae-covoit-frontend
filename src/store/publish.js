
import {isPublishableRoute, PUBLICATION_ROUTE_ERROR} from '@/services/publicationRoute.js';
// import { createStore } from 'vuex'
import {requestContextHelp} from '@/services/contextualHelp.js';
import supabase from '@/utils/supabaseClient.js';
import router from '@/router';
import store from '@/store'; 
import { recurringWeekStart } from '@/services/recurringWeeks.js';
import { getDayOfWeek } from '@/utils/utils.js'

const _ = require('lodash');

export default {
    namespaced: true,
    state: {
       priceRecommended: 4,
    },
    getters: {
        
    },
    mutations: { 

    },
    actions: {
        async getPriceRecommended({ state }, params){
            try {
                // get price recommended
                let { data, error } = await supabase
                    .from('village_distance_price')
                    .select("price")
                    .eq('orig_id', params.orig_id)
                    .eq('dest_id', params.dest_id)


                if(error){
                    console.error("Error :", error);
                    return {status: 1, message: "Une erreur s'est produite !"}
                }

                const price = Number(data?.[0]?.price);
                if (!Number.isFinite(price) || price <= 0) {
                    return {status: 1, message: "Aucun tarif disponible pour ce trajet. Veuillez choisir un autre itinéraire."};
                }
                console.log("data.price.recommended", data[0].price);
                state.priceRecommended = price;
                return {status: 0, message: `Prix recommandé :${data[0].price}`}
            } catch {
                return {status: 1, message: "Impossible de charger le tarif. Veuillez réessayer."};
            }
        },
        async newTrip({state}, tripDriver){
            const owner=store.state.profil.userUid, generation=store.state.profil.accountGeneration;
            const current=()=>store.state.profil.userUid===owner && store.state.profil.accountGeneration===generation;
            if(!owner || owner!==tripDriver.driverId)return {status:2,stale:true};
            tripDriver=JSON.parse(JSON.stringify(tripDriver));
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!current())return {status:2,stale:true};
            if( ! sessionChecked ){
                router.replace("/login");
                return {status: 1, message: "Votre session a expiré."};
            }

            if(!isPublishableRoute(tripDriver.route))return {status:1,message:PUBLICATION_ROUTE_ERROR};
            console.log("tripDriver", tripDriver, state)
            if( !tripDriver.driverId ){
                return {status: 1, message: "Le compte chauffeur est introuvable."};
            }

            const dataNewTrip =  {
                village_departure_id: tripDriver.villageDep,
                village_arrival_id: tripDriver.villageDest,
                driver_id: tripDriver.driverId,
                departure_time: tripDriver.timeDep,
                max_seats: tripDriver.maxSeats,
                price: tripDriver.price,
                route: tripDriver.route,
                car_id: tripDriver.car_id,
            };

            // Publication uses the same Supabase/RLS path in local and online
            // modes. VUE_APP_MODE now selects only the API server, so a local
            // test cannot accidentally call the obsolete MBABUF endpoint.
            const { data, error } = await supabase
                .from('trip')
                .insert([dataNewTrip])
                .select();

            if(!current())return {status:2,stale:true};
            console.log("new-trip-published : ", data, error);
            if( error ){
                console.error("Error : ", error);
                return {status: 1, message: "Votre trajet n'a pas pu être publié !"};
            }

            if(data?.length&&store.state.profil.userUid===tripDriver.driverId)requestContextHelp(tripDriver.driverId,'driver',{tripId:data[0].id});
            return {status: 0, message: "Votre trajet a bien été publié !"};
        },
        async newTripMultple({state}, tripDriver){
            const owner=store.state.profil.userUid, generation=store.state.profil.accountGeneration;
            const current=()=>store.state.profil.userUid===owner && store.state.profil.accountGeneration===generation;
            if(!owner || owner!==tripDriver.driverId)return {status:2,stale:true};
            tripDriver=JSON.parse(JSON.stringify(tripDriver));
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!current())return {status:2,stale:true};
            if( ! sessionChecked ){
                router.replace("/login");
                return {status:1,message:"Votre session a expiré."};
            }

            if(!isPublishableRoute(tripDriver.route))return {status:2,message:PUBLICATION_ROUTE_ERROR};
            const days = tripDriver.daysHour;
            if (!Array.isArray(days) || days.length !== 7) {
                return {status:2, message:'Le programme doit contenir sept jours. Rouvrez les horaires et vérifiez votre sélection.'};
            }
            const validTime = time => typeof time === 'string' && /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(time);
            if (days.some(day => !day || typeof day.values?.home !== 'boolean' || typeof day.values?.work !== 'boolean'
                || ['home','work'].some(direction => day.values[direction] && !validTime(day.hour?.[direction])))) {
                return {status:2, message:'Vérifiez les jours et les horaires de votre programme avant de publier.'};
            }

            console.log("tripDriver", tripDriver, state)
            const currentDate = new Date();
            const weeksSelected = tripDriver.weeksSelected;

            let dates = [];
            let daysNumber = {lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6};

            let datasNewTrips = [];
            for (let index = 0; index < weeksSelected.length; index++) {
                const week = weeksSelected[index];
                if( week.selected ){
                    let firstDateOfWeek;
                    try{firstDateOfWeek=recurringWeekStart(week,currentDate);}
                    catch{return {status:2,message:'Ces semaines ne sont plus valides. Rouvrez le calendrier et sélectionnez vos dates.'};}

                    let dayWeekFirst = daysNumber[getDayOfWeek(firstDateOfWeek).toLowerCase()];
                    for (let indexDayHour = 0; indexDayHour < tripDriver.daysHour.length; indexDayHour++) {
                        if( dayWeekFirst <= indexDayHour ){
                            if( tripDriver.daysHour[indexDayHour].values.home ){
                                const [hours, minutes] = tripDriver.daysHour[indexDayHour].hour.home.split(':').map(Number);

                                let dateGetting = new Date(firstDateOfWeek.getFullYear(), firstDateOfWeek.getMonth(), firstDateOfWeek.getDate() + indexDayHour, hours, minutes);
                                //console.log(dateGetting.getTime(), currentDate.getTime(), dateGetting.getTime() >= currentDate.getTime());
                                if( dateGetting.getTime() >= currentDate.getTime() ){
                                    dates.push(dateGetting);

                                    let dataNewTrip = {
                                        village_departure_id: tripDriver.villageDep,
                                        village_arrival_id: tripDriver.villageDest,
                                        driver_id: tripDriver.driverId,
                                        departure_time: dateGetting,
                                        max_seats: tripDriver.maxSeats,
                                        price: tripDriver.price,
                                        route: tripDriver.route,
                                        car_id: tripDriver.car_id,
                                    };

                                    datasNewTrips.push(dataNewTrip);

                                }
                            }
                            
                            if( tripDriver.daysHour[indexDayHour].values.work ){
                                //day to number
                                const [hours, minutes] = tripDriver.daysHour[indexDayHour].hour.work.split(':').map(Number);

                                //date to publish
                                let dateGetting = new Date(firstDateOfWeek.getFullYear(), firstDateOfWeek.getMonth(), firstDateOfWeek.getDate() + indexDayHour, hours, minutes);
                                //console.log(dateGetting.getTime(), currentDate.getTime(), dateGetting.getTime() >= currentDate.getTime());
                                if( dateGetting.getTime() >= currentDate.getTime() ){
                                    dates.push(dateGetting);

                                    //reverse route
                                    let route = _.cloneDeep(tripDriver.route);
                                    route.polylineDecoded = route.polylineDecoded.slice().reverse();
                                    console.log(tripDriver.route.polylineDecoded[0], tripDriver.route.polylineDecoded.slice().reverse()[0], route.polylineDecoded[0]);
                                    let dataNewTrip = {
                                        village_departure_id: tripDriver.villageDest,
                                        village_arrival_id: tripDriver.villageDep,
                                        driver_id: tripDriver.driverId,
                                        departure_time: dateGetting,
                                        max_seats: tripDriver.maxSeats,
                                        price: tripDriver.price,
                                        route: route,
                                        car_id: tripDriver.car_id,
                                    };

                                    datasNewTrips.push(dataNewTrip);

                                }
                            }
                        }
                    }
                }
            }

            console.log("datasNewTrips:", datasNewTrips);

            //return {status: 2, message: "Erreur (2), aucun trajet n'a pu être publié !"}

            if( datasNewTrips.length == 0 )
                return {status: 2, message: "Erreur (2), aucun trajet n'a pu être publié !"}

            const { data, error } = await supabase
                .from('trip')
                .insert(
                    datasNewTrips,
                )
                .select()

            if(!current())return {status:2,stale:true};
            console.log("news-trips-published : ", data, error);

            if( error ){
                console.error("Error : ", error);
                return {status: 3, message: "Une erreur s'est produite lors de la tentative de publication !"}
            }

            

            store.state.profil.history.datesTripDriver.push(...datasNewTrips.map(trip => trip.departure_time));
            if(data?.length&&store.state.profil.userUid===tripDriver.driverId)requestContextHelp(tripDriver.driverId,'driver',{tripId:data[0].id});
            return {status: 0, message: "Vos trajets ont bien été publié !"}
        },
    },
}
