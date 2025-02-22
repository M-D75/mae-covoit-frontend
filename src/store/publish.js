// import { createStore } from 'vuex'
import axios from 'axios'

import supabase from '@/utils/supabaseClient.js';
import router from '@/router';
import store from '@/store'; 
import { getFirstDayOfWeek, getDayOfWeek } from '@/utils/utils.js'

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

            console.log("data.price.recommended", data[0].price);
            state.priceRecommended = data[0].price;
            return {status: 0, message: `Prix recommandé :${data[0].price}`}
        },
        async newTrip({state}, tripDriver){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return ;
            }

            if( process.env.VUE_APP_MODE == 'local' ){
                
                // let infos = {
                //     villageDep: this.GET_ID_VILLAGE_BY_NAME(this.infosPublish.work.depart), 
                //     villageDest: this.GET_ID_VILLAGE_BY_NAME(this.infosPublish.work.destination), 
                //     driverId: this.$store.state.profil.userUid, 
                //     maxSeats: this.infosPublish.work.nbPassager,
                //     price: this.infosPublish.work.price,
                //     route: this.infosPublish.work.route,
                //     daysHour: this.infosPublish.work.daysHour,
                //     weeksSelected: this.infosPublish.work.weeksSelected,
                //     car_id: this.infosPublish.work.car,
                // };

                const res = await axios.get(`${process.env.VUE_APP_API_MBABUF_URL}/trips`, {
                        params:{
                            "village_departure_id": tripDriver.villageDep,
                            "village_arrival_id": tripDriver.villageDest,
                            "driver_id": store.state.profil.userId,
                            "departure_time": tripDriver.daysHour,
                            "max_seats": tripDriver.maxSeats,
                            "auto_accept_trip": store.state.profil.auto_accept_trip,
                        }
                    })
                    .then(response => {
                        console.log("trips:", response.data.result);
                        return {status: 0, message: "Votre trajet à bien été publié !"}
                    })
                    .catch(error => {
                        console.error(error);
                    });

                return res;
            }
            else{
                console.log("tripDriver", tripDriver, state)

                // let { data: trip, errorTrip } = await supabase
                //     .from('trip')
                //     .select('id')

                // console.log("Error : ", errorTrip, trip.length, tripDriver.driverId);

                // if( errorTrip ){
                //     console.error("Error : ", errorTrip)
                //     return false;
                // }

                // const idMax = trip.reduce((max, objet) => {
                //         return objet.id > max ? objet.id : max;
                //     }, 1);

                if( tripDriver.driverId ){

                    var dataNewTrip =  {
                        village_departure_id: tripDriver.villageDep,
                        village_arrival_id: tripDriver.villageDest,
                        driver_id: tripDriver.driverId,
                        departure_time: tripDriver.timeDep,
                        max_seats: tripDriver.maxSeats,
                        price: tripDriver.price,
                        route: tripDriver.route,
                        car_id: tripDriver.car_id,
                    };

                    console.log("data : ", dataNewTrip);

                    const { data, error } = await supabase
                        .from('trip')
                        .insert([
                            dataNewTrip,
                        ])
                        .select()

                    console.log("new-trip-published : ", data, error);

                    if( error ){
                        console.error("Error : ", error);
                        return {status: 1, message: "Votre trajet n'a pas pu être publié !"}
                    }
                }

                return {status: 0, message: "Votre trajet à bien été publié !"}
            }
        },
        async newTripMultple({state}, tripDriver){
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if( ! sessionChecked ){
                router.replace("/login");
                return;
            }

            console.log("tripDriver", tripDriver, state)
            const currentDate = new Date();
            const weeksSelected = tripDriver.weeksSelected;

            let year = currentDate.getFullYear();
            
            let nextYearTmp = new Date(currentDate);
            nextYearTmp.setFullYear(currentDate.getFullYear() + 1);

            const nextYear = nextYearTmp.getFullYear();

            let dates = [];
            let daysNumber = {lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6};

            let datasNewTrips = [];
            for (let index = 0; index < weeksSelected.length; index++) {
                const week = weeksSelected[index];
                if( week.selected ){
                    //getISOWeekNumber
                    if(index > 0 && "S1" == week.week)
                        year = nextYear;

                    let firstDateOfWeek = getFirstDayOfWeek(week.week, year);
                        
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
                                    store.state.profil.history.datesTripDriver.push(dataNewTrip.departure_time);
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
                                    store.state.profil.history.datesTripDriver.push(dataNewTrip.departure_time);
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

            console.log("news-trips-published : ", data, error);

            if( error ){
                console.error("Error : ", error);
                return {status: 3, message: "Une erreur s'est produite lors de la tentative de publication !"}
            }

            

            return {status: 0, message: "Vos trajets ont bien été publié !"}
        },
    },
}
