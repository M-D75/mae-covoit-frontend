
// import router from '../router';  
import supabase from '@/utils/supabaseClient.js';

// import store from '../store'; 
// import stripe from '@/utils/stripe.js'

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
        async getRating({state}, infos){
            console.log("getRating:", infos);
            let { data: settings, error } = await supabase
                .from('settings')
                .select('rating')
                .eq("account_id", infos.userId)
          
            if( error ){
                console.err("Error:", error);
                return {status: 1, message: "Une erreur s'est produite."}
            }

            console.log(settings);

            ['good', 'bad'].forEach(category => {
                state.btnIco[category].forEach((item, index) => {
                    item.numberOfVote = settings[0].rating[category][index];
                });
            });

            console.log("update-btnIco", state.btnIco);

            return {status: 0, message: ""}
        },
    },
}