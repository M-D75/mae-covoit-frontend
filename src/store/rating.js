
// import router from '../router';
import { serverRequest } from '@/utils/serverApi.js';

// import store from '../store'; 

export default {
    namespaced: true,
    state: {
        btnIco: {
            good: [
                {
                    icon: "mdi-emoticon", 
                    select: false,
                    numberOfVote: 0,
                    description: "Sympathie",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-timer-star",
                    select: false,
                    numberOfVote: 0,
                    description: "Ponctualité",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-shield-lock", 
                    select: false,
                    numberOfVote: 0,
                    description: "Sécurité de Conduite",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-vacuum", 
                    select: false,
                    numberOfVote: 0,
                    description: "Propreté du Véhicule",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-wechat", 
                    select: false,
                    numberOfVote: 0,
                    description: "Communication",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-card-account-details-star", 
                    select: false,
                    numberOfVote: 0,
                    description: "Identité",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-sofa-single-outline", 
                    select: false,
                    numberOfVote: 0,
                    description: "Confort du Trajet",
                    fun: ()=>console.log("click"),
                
                },
            ],
            bad: [
                {
                    icon: "mdi-emoticon-angry", 
                    select: false,
                    numberOfVote: 0,
                    description: "Sympathie",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-timer-remove", 
                    select: false,
                    numberOfVote: 0,
                    description: "Ponctualité",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-shield-remove", 
                    select: false,
                    numberOfVote: 0,
                    description: "Sécurité de Conduite",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-liquid-spot", 
                    select: false,
                    numberOfVote: 0,
                    description: "Propreté du Véhicule",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-chat-alert", 
                    select: false,
                    numberOfVote: 0,
                    description: "Communication",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-smart-card-off", 
                    select: false,
                    numberOfVote: 0,
                    description: "Identité",
                    fun: ()=>console.log("click"),
                },
                {
                    icon: "mdi-seat-flat-angled", 
                    select: false,
                    numberOfVote: 0,
                    description: "Confort du Trajet",
                    fun: ()=>console.log("click"),
                },
            ],
        }
    },
    mutations: {
        SET_BTN_ICO_SELECT(state, which){
            state.btnIco[which.type][which.index].select = which.value;
        },
        SET_BTN_ICO_NUMBER_OF_VOTE(state, which){
            state.btnIco[which.type][which.index].numberOfVote = which.value;
        },
    },
    actions: {
        async getRating({state, rootState}, infos){
            console.log("getRating:", infos);
            ['good', 'bad'].forEach(category => {
                state.btnIco[category].forEach((item) => {
                    item.numberOfVote = 0;
                });
            });
            rootState.trip.member.notation.avis = 0;
            rootState.trip.member.notation.satisfaction = 0;
            try {
                const response = await serverRequest(
                    'get',
                    `/ratings/accounts/${infos.userId}/summary`,
                    { mode: rootState.profil.modeCo }
                );
                const summary = response.data?.data;
                if (response.data?.status !== 'ok' || !summary) {
                    throw new Error("Réponse de notation invalide.");
                }

                ['good', 'bad'].forEach(category => {
                    state.btnIco[category].forEach((item, index) => {
                        item.numberOfVote = Number(summary.rating?.[category]?.[index] || 0);
                    });
                });

                rootState.trip.member.notation.avis = Number(summary.averageScore || 0);
                rootState.trip.member.notation.satisfaction = Number(summary.satisfaction || 0);

                console.log("update-btnIco", state.btnIco);
                return {status: 0, message: "", data: summary};
            } catch (error) {
                console.error("getRating error:", error);
                return {
                    status: 1,
                    message: error.response?.data?.message || "Une erreur s'est produite.",
                };
            }
        },
    },
}
