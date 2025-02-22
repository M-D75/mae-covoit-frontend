
export default {
    namespaced: true,
    state: {
        isNative: false,
        appIsActive: {app: true, search: false},
        cgu: {
            title: "CGU/CGV",
            text: `1. Objet
            
            La société MAE Solutions SARL (ci-après, « Tchap Tchap ») édite une plateforme de covoiturage accessible sur un site internet notamment à l’adresse www.tchap-tchap.yt ou sous forme d’application mobile et destinée à (i) mettre en relation des conducteurs se rendant à une destination donnée pour leur propre compte avec des passagers allant dans la même direction afin de leur permettre de partager le trajet et donc les frais qui y sont associés et (ii) rechercher et procéder à l’achat de Billets de bus auprès des opérateurs de transport (les « Autocaristes ») que nous distribuons (ci-après, la « Plateforme »).
            Les présentes conditions générales d’utilisation ont pour objet d’encadrer l’accès et les modalités d’utilisation de la Plateforme. Nous vous invitons à en prendre attentivement connaissance. Vous comprenez et reconnaissez que Tchap Tchap n’est partie à aucun accord, contrat ou relation contractuelle, de quelque nature que ce soit, conclu entre les Membres de sa Plateforme ou avec un Autocariste.
            En cliquant sur le bouton « Connexion avec Facebook » ou « Inscription avec un email », vous reconnaissez avoir pris connaissance et accepter l’intégralité des présentes conditions générales d’utilisation.`,
        },
        dataProtection: {
            title: "Protections des données",
            text: `1. Généralités

            MAE Solutions SARL (dont le siège social est situé au 84, avenue de la République, 97640 Sada, Mayotte), en sa qualité de responsable du traitement, attache une grande importance à la protection et au respect de votre vie privée. La présente politique (la « Politique de Confidentialité ») vise à vous informer de nos pratiques concernant la collecte, l’utilisation et le partage des informations que vous êtes amenés à nous fournir par le biais de notre plateforme (la « Plateforme ») accessible depuis le site internet www.tcha-tchap.yt  ou nos applications mobiles. Dans le cas où vous souscrivez à des produits d’assurance par l’intermédiaire de la Plateforme ou des produits d’assurance distribués par BlaBlaCar, le responsable du traitement des données collectées et/ou traitées dans le cadre de cette souscription est la société BlaBla Insurance, filiale à 100% de MAE Solutions SARL, dont le siège social est situé au 84, avenue de la République, 97640 Sada. Comuto SA et/ou BlaBla Insurance seront désignées par la suite en tant que « TchapTchap », « nous » ou « notre ». En ce qui concerne d’autres responsables en charge de certaines activités de traitement, veuillez vous référer à l’article 4 ci-dessous.`,
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
