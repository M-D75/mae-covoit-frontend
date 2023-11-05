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
        async newTrip({state}, playload){
            const sessionChecked = await store.dispatch("auth/checkSession");
            if(!sessionChecked)
                router.replace("/login");
            console.log("playload", playload, state)
            // const url = `${process.env.VUE_APP_API_MBABUF_URL}/trip`;

            // const headers = {
            //     'accept': 'application/json',
            //     'Content-Type': 'application/json'
            // };

            let { data: trip, errorTrip } = await supabase
                .from('trip')
                .select('id')

            console.log("Error", errorTrip, trip.length, playload.driverId);

            if( playload.driverId ){

                var dataNewTrip =  {
                    id: trip.length+1,
                    village_departure_id: playload.villageDep,
                    village_arrival_id: playload.villageDest,
                    driver_id: playload.driverId,
                    departure_time: playload.timeDep,
                    max_seats: playload.maxSeats,
                };

                console.log("data=", dataNewTrip);

                const { data, error } = await supabase
                    .from('trip')
                    .insert([
                        dataNewTrip,
                    ])
                    .select()


                console.log("new-trip published", data, error);
            }

            // console.log("data-to-send:", data)

            // await axios.post(url, data, { headers: headers })
            //     .then(response => {
            //         console.log(response.data);
            //     })
            //     .catch(error => {
            //         console.error("There was an error!", error);
            //     });
        }
    },
}
