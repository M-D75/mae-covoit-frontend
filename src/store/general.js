import { privacyPolicyText } from '@/services/privacyPolicy.js';

export default {
    namespaced: true,
    state: {
        isNative: false,
        appIsActive: {app: true, search: false},
        cgu: {
            title: "CGU/CGV",
            text: `1. Objet

            MAE Solutions SARL édite Covia, une application de covoiturage à Mayotte qui met en relation des conducteurs et des passagers pour partager un trajet et les frais associés.

            2. Utilisation du service

            Les membres renseignent des informations exactes sur leur profil, leur véhicule et leurs trajets. Les conducteurs restent responsables de leur véhicule, de leur assurance et du respect des règles de circulation. Les utilisateurs s’engagent à respecter les autres participants et à ne pas publier de contenu illicite.

            3. Réservations et paiements

            Consultez les informations et le prix présentés avant de confirmer une réservation ou un paiement. Les conditions d’annulation et les éventuels remboursements sont indiqués dans le parcours concerné.

            4. Données personnelles

            La politique de confidentialité est accessible depuis les réglages de l’application. La localisation et les notifications sont facultatives.`,
        },
        dataProtection: {
            title: "Protections des données",
            text: privacyPolicyText,
        },
    },
    getters: {
        
    },
    mutations: {
        SET_IS_NATIVE(state, bool){
            state.isNative = bool;
        },
        SET_APP_IS_ACTIVE(state, infos){
            for(const key in infos){
                state.appIsActive[key] = infos[key];
            }
        },
    },
    actions: {
        
    },
}
