// import { createStore } from 'vuex'
// import axios from 'axios'

import supabase from '@/utils/supabaseClient.js';
import router from '@/router';
import store from '@/store'; 


export default {
    namespaced: true,
    state: {
       
    },
    getters: {
        
    },
    mutations: { 

    },
    actions: {
        async newTrip({state}, tripDriver){
            const sessionChecked = await store.dispatch("auth/checkSession");
            if( ! sessionChecked )
                router.replace("/login");

            console.log("tripDriver", tripDriver, state)

            let { data: trip, errorTrip } = await supabase
                .from('trip')
                .select('id')

            console.log("Error : ", errorTrip, trip.length, tripDriver.driverId);

            if( errorTrip ){
                console.error("Error : ", errorTrip)
                return false;
            }

            const idMax = trip.reduce((max, objet) => {
                    return objet.id > max ? objet.id : max;
                }, 1);

            if( tripDriver.driverId ){

                var dataNewTrip =  {
                    id: idMax + 1,
                    village_departure_id: tripDriver.villageDep,
                    village_arrival_id: tripDriver.villageDest,
                    driver_id: tripDriver.driverId,
                    departure_time: tripDriver.timeDep,
                    max_seats: tripDriver.maxSeats,
                    price: tripDriver.price,
                    route: tripDriver.route,
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
                    return false;
                }
            }

            return true;
        },
        async newTripMultple({state}, tripDriver){
            console.log("tripDriver", tripDriver, state)

            if( ! tripDriver.daysHour || tripDriver.daysHour.length == 0){
                const hourHome = tripDriver.hour.home;
                const hourWork = tripDriver.hour.work;
                console.log(hourHome, hourWork);
                // var dataNewTrip =  {
                //     id: idMax + 1,
                //     village_departure_id: tripDriver.villageDep,
                //     village_arrival_id: tripDriver.villageDest,
                //     driver_id: tripDriver.driverId,
                //     departure_time: tripDriver.timeDep,
                //     max_seats: tripDriver.maxSeats,
                //     price: tripDriver.price,
                //     route: tripDriver.route,
                // };

            }

            return true;
        },
    },
}
