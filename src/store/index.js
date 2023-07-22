import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
    state: {
        darkMode: false,
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
        villages: [],
        communesHistory: ["Tsingoni", "Mamoudzou", "Dzaoudzi"],
        trajets: [
        {
            "depart": "Tsingoni",
            "destination": "Mamoudzou",
            "hour_start": "04:50",
            "hour_end": "06:55",
            "price": 4,
            "name": "Ledou",
            "passenger_number": 2
        },
        {
            "depart": "Bandraboua",
            "destination": "Chirongui",
            "hour_start": "07:30",
            "hour_end": "09:15",
            "price": 8,
            "name": "Madi",
            "passenger_number": 1
        },
        {
            "depart": "Kani-Kéli",
            "destination": "Ouangani",
            "hour_start": "10:20",
            "hour_end": "12:10",
            "price": 6,
            "name": "Halima",
            "passenger_number": 3
        },
        {
            "depart": "Bouéni",
            "destination": "Dzaoudzi",
            "hour_start": "14:45",
            "hour_end": "16:30",
            "price": 5,
            "name": "Nassim",
            "passenger_number": 1
        },
        {
            "depart": "Sada",
            "destination": "Pamandzi",
            "hour_start": "17:05",
            "hour_end": "18:55",
            "price": 10,
            "name": "Zainab",
            "passenger_number": 4
        },
        {
            "depart": "Tsingoni",
            "destination": "Mamoudzou",
            "hour_start": "08:30",
            "hour_end": "10:20",
            "price": 7,
            "name": "Fatima",
            "passenger_number": 2
        },
        {
            "depart": "Bandraboua",
            "destination": "Chirongui",
            "hour_start": "11:45",
            "hour_end": "13:30",
            "price": 9,
            "name": "Ahmed",
            "passenger_number": 1
        },
        {
            "depart": "Kani-Kéli",
            "destination": "Ouangani",
            "hour_start": "14:15",
            "hour_end": "16:00",
            "price": 5,
            "name": "Amina",
            "passenger_number": 3
        },
        {
            "depart": "Bouéni",
            "destination": "Dzaoudzi",
            "hour_start": "18:10",
            "hour_end": "19:50",
            "price": 6,
            "name": "Issa",
            "passenger_number": 1
        },
        {
            "depart": "Sada",
            "destination": "Pamandzi",
            "hour_start": "20:25",
            "hour_end": "22:10",
            "price": 8,
            "name": "Leila",
            "passenger_number": 4
        },
        {
            "depart": "Tsingoni",
            "destination": "Mamoudzou",
            "hour_start": "23:15",
            "hour_end": "01:05",
            "price": 10,
            "name": "Karim",
            "passenger_number": 2
        },
        ],
    },
    getters: {
        villages: state => state.villages,
        getVillagesByName: (state) => (name) => {
            console.log("getter:------", name)
            return state.villages.filter(infoVillage => infoVillage.village.toLowerCase() == name.toLowerCase());
        }
    },
    mutations: {
        setVillages(state, data) {
            state.villages = data
        }
    },
    actions: {
        getVillages({ commit }) {
            axios.get('https://kamusy.yt/covoit-api/villages')
                .then(response => {
                    commit('setVillages', response.data.result);
                })
                .catch(error => {
                    console.error(error);
                });
        },
        
    },
    modules: {
    }
})
