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
        member: {
            avatar: "",
            userName: "",
            location: "",
            preferences: [],
        },
        aboutPreference: {
            discution: [
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
                    about: "discution",
                    prependIconColor: "#ff5353",
                    prependIcon:"mdi-forum",
                    text: "je discute de temps à autres",
                    chip:false,
                    chipIcon: null,
                    switchBtn: false,
                    chipText: "",
                },
                {
                    about: "discution",
                    prependIconColor: "#9fcb66",
                    prependIcon:"mdi-forum",
                    text:"je ne parle pas beaucoup",
                    chip:false,
                    chipIcon: null,
                    switchBtn: false,
                    chipText: "",
                },
            ],
            smoke: [
                {
                    about: "smoke",
                    prependIconColor: "var(--blue-color)",
                    prependIcon:"mdi-smoking-off",
                    text:"Je fume dans ma voiture",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    about: "smoke",
                    prependIconColor: "#ff5353",
                    prependIcon:"mdi-smoking-off",
                    text:"Je fume en dehors de la voiture",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    about: "smoke",
                    prependIconColor: "#9fcb66",
                    prependIcon:"mdi-smoking-off",
                    text:"Pas de cigarette en voiture",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
            ],
            music: [
                {
                    about: "music",
                    prependIconColor: "var(--blue-color)",
                    prependIcon:"mdi-music",
                    text:"Music tout au long !",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    about: "music",
                    prependIconColor: "#ff5353",
                    prependIcon:"mdi-music",
                    text:"Tout depend de la music",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    about: "music",
                    prependIconColor: "#9fcb66",
                    prependIcon:"mdi-music",
                    text:"Le silence est d'or",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
            ],
            animal: [
                {
                    about: "animal",
                    prependIconColor: "var(--blue-color)",
                    prependIcon:"mdi-paw",
                    text:"J'aime bien les animaux",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    about: "animal",
                    prependIconColor: "#ff9c00",
                    prependIcon:"mdi-paw",
                    text:"J'aime certains animaux",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
                {
                    about: "animal",
                    prependIconColor: "#9fcb66",
                    prependIcon:"mdi-paw",
                    text:"Pas d'animaux en voiture",
                    chip:false,
                    chipIcon: null,
                    chipText: "",
                },
            ],
        },
        indexPreference: ["discution", "smoke", "music", "animal"],
        notMessageVue: [],//list id trip pour notification chat
    },
    getters: {
        
    },
    mutations: { 
        SET_NOT_MESSAGE_VUE(state, idTrips) {
            state.notMessageVue = idTrips;
        },
        SET_TRIP_SELECTED(state, trip) {
            state.tripSelected = trip;
        },
    },
    actions: {
        async getContacts({ state }){
            console.log("getConctats", state.tripSelected.bookings.length);
            let contacts = [];
            let accounts_id = [];

            // get-account
            for (let index = 0; index < state.tripSelected.bookings.length; index++) {

                const passenger_account_id = state.tripSelected.bookings[index].passenger_account_id;

                if( ! accounts_id.includes(passenger_account_id) ){

                    let { data: account, error: error_account } = await supabase
                        .from('account')
                        .select(`
                            *,
                            booking (*)
                        `)
                        .eq('id', passenger_account_id)

                    if( error_account ){
                        console.error("Error:", error_account);
                    }

                    let contact = account[0];
                    // contact.avatar = "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned";
                    contact.messageNumber = 0;
                    
                    console.log("contact", contact);
                    contacts.push(contact);
                    accounts_id.push(passenger_account_id);

                }
            }
            
            state.chat.contacts = contacts;
        },
        async getProfilMember({state}, member){
            
            let { data: account, error: error_account } = await supabase
                .from('account')
                .select("*")
                .eq('user_id', member.userUid)
            
            if(error_account){
                console.error(error_account)
                return false;
            }


            let { data: settings, error: error_setting } = await supabase
                .from('settings')
                .select('*')
                .eq('account_id', account[0].id)
        
            if(error_setting){
                console.error(error_setting)
                return false;
            }
            
            if(settings && settings.length > 0){
                state.member.avatar = account[0].avatar;
                state.member.userName = account[0].username;
                state.member.location = account[0].village != null && account[0].village != "" ? account[0].village : "";

                let outPreferences = [];
                
                const preferences = settings[0].prefer;
                for (let index = 0; index < preferences.length; index++) {
                    const ind_prefer = preferences[index];
                    outPreferences.push(state.aboutPreference[state.indexPreference[index]][ind_prefer]);
                }
                state.member.preferences = outPreferences;
            }
            else{
                return false;
            }

            return true;

        },
        async updateAccepteBooking({state}, index){
            const bookings = state.chat.contacts[index].booking;
            for (let indexB = 0; indexB < bookings.length; indexB++) {
                const id_bk = bookings[indexB].id;
                const { data, error } = await supabase
                    .from('booking')
                    .update({ is_accepted: true })
                    .eq('id', id_bk)
                    .select();

                if(error){
                    console.error("Error", error)
                    return {status: 1, message: "Une erreur s'est produite, veuillez réessayer plus tard !"};
                }

                if( data ){
                    state.chat.contacts[index].booking[indexB].is_accepted = true;
                }
            }

            return {status: 0, message: "success"};
        },
    },
}
