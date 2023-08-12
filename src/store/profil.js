// import { createStore } from 'vuex'
// import axios from 'axios'
// import { createClient } from '@supabase/supabase-js'

import supabase from '@/utils/supabaseClient.js';

export default {
    namespaced: true,
    state: {
        darkMode: false,
        userId: null,
        userUid: "",
        userName: "Pseudo",
        avatarUrl: null,
        soldes: 0,
        profil: {
            infos_perso: {
                civilite: "Mr.",
                nom: "Ledou",
                prenom: "BG",
                email: "bg@mail.com",
                tel: "0606060606",
                adress: {
                    principal: "1 RUE DES GAMBWI",
                    complement: "BOUZI",
                    code_postal: "97680",
                    commune: "Combani",
                },
            },
        },
    },
    getters: {
        
    },
    mutations: {
        SET_DARKMODE(state, boolean){
            state.darkMode = boolean
        },
    },
    actions: {
        async getUserInfos(){
            console.log(supabase);
        },
    },
}
