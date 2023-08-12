// import { createStore } from 'vuex'
// import axios from 'axios'

export default {
    namespaced: true,
    state: {
       
    },
    getters: {
        
    },
    mutations: { 

    },
    actions: {
        async newTrip(playload){
            console.log("playload", playload)
            // const url = `${process.env.VUE_APP_API_MBABUF_URL}/trip`;

            // const headers = {
            //     'accept': 'application/json',
            //     'Content-Type': 'application/json'
            // };

            // var data =  {
            //     "village_departure_id": playload.villageDep,
            //     "village_arrival_id": playload.villageDest,
            //     "driver_id": playload.driverId,
            //     "departure_time": playload.timeDep,
            //     "max_seats": playload.maxSeats,
            // };

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
