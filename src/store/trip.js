// import { createStore } from 'vuex'
// import axios from 'axios'

import supabase from '@/utils/supabaseClient.js';
// import router from '@/router';
// import store from '@/store'; 


export default {
    namespaced: true,
    state: {
        driver: true,
        route: {},
        chat: {
            contacts: [],
        },
        tripSelected: {},
    },
    getters: {
        
    },
    mutations: { 
        SET_TRIP_SELECTED(state, trip) {
            state.tripSelected = trip;
        },
    },
    actions: {
        async getContacts({ state }){
            console.log("getConctats", state.tripSelected.bookings.length);
            let contacts = [];
            // get-account
            for (let index = 0; index < state.tripSelected.bookings.length; index++) {
                const passenger_account_id = state.tripSelected.bookings[index].passenger_account_id;
                let { data: account, error: error_account } = await supabase
                    .from('account')
                    .select("*")
                    .eq('id', passenger_account_id)

                if(error_account){
                    console.error("Error:", error_account);
                }

                let contact = account[0];
                contact.avatar = "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned";
                contact.messageNumber = 0;
                
                contacts.push(contact);
            }
            
            state.chat.contacts = contacts;
        },
    },
}
