export const privacyContactEmail = process.env.VUE_APP_PRIVACY_CONTACT_EMAIL || '';
export const privacySections = [
    {
        title: 'Responsable du traitement',
        text: 'Covia est une application de covoiturage à Mayotte éditée par MAE Solutions SARL, 84, avenue de la République, 97640 Sada, Mayotte. Cette politique concerne les données utilisées par l’application et ses services associés.',
    },
    {
        title: 'Données et usages',
        text: 'Les informations de compte et de profil (adresse e-mail, identité, photo et informations renseignées), les véhicules, trajets, réservations et évaluations servent à mettre en relation les conducteurs et passagers et à gérer les trajets. Les messages sont transmis aux interlocuteurs choisis. Les références de paiement et opérations de crédits servent au suivi des transactions. Les jetons de notification permettent de vous envoyer des informations liées au service. Des données techniques peuvent être traitées pour sécuriser et faire fonctionner le service.',
    },
    {
        title: 'Localisation et signalements',
        text: 'L’accès à votre position est facultatif et demandé après une explication dans la carte. Une position approximative est acceptée. Sur la carte publique, la position sert à vous situer et à placer les signalements ; elle n’est pas diffusée en direct aux autres utilisateurs. Lors d’un trajet, l’activation du partage transmet votre position au serveur et aux participants du trajet. Le partage est désactivé par défaut et s’arrête lorsque vous le désactivez, quittez la carte ou passez l’application en arrière-plan. Les coordonnées d’un signalement publié sont visibles des utilisateurs de la carte.',
    },
    {
        title: 'Destinataires et prestataires',
        text: 'Les informations nécessaires à un trajet sont accessibles aux participants concernés. Les profils et trajets proposés sont présentés aux utilisateurs du service. MAE Solutions utilise Supabase pour l’authentification et les données, Stripe pour les paiements, Firebase Cloud Messaging pour les notifications et des services cartographiques pour les cartes et itinéraires. Les données nécessaires à ces fonctions peuvent être transmises à ces prestataires. Les formulaires de paiement transmettent les informations de carte à Stripe.',
    },
    {
        title: 'Permissions',
        text: 'Vous pouvez refuser la localisation et les notifications et modifier votre choix dans les réglages du téléphone. L’application reste utilisable sans ces permissions ; les fonctions qui en dépendent deviennent indisponibles. Le choix d’une photo de profil passe par le sélecteur de fichiers du téléphone.',
    },
    {
        title: 'Suppression et conservation',
        text: 'Vous pouvez demander la suppression depuis Réglages > Protection des données > Supprimer mon compte, ou depuis la page publique de suppression. La suppression automatique peut être interrompue lorsqu’un historique financier nécessite un traitement manuel : vous pouvez alors contacter MAE Solutions pour demander la suppression ou l’anonymisation des données concernées. Certaines données peuvent devoir être conservées pour les obligations comptables, la résolution des litiges ou la sécurité. Vous pouvez contacter MAE Solutions pour connaître les durées de conservation applicables à votre situation.',
    },
    {
        title: 'Vos droits',
        text: 'Vous pouvez demander l’accès, la rectification, la suppression ou la limitation du traitement de vos données, ainsi que leur portabilité et exercer votre droit d’opposition selon les conditions applicables. Vous pouvez retirer votre accord au partage de localisation à tout moment. Vous pouvez adresser une réclamation à la CNIL.',
    },
];

export const privacyPolicyText = privacySections
    .map(({ title, text }) => `${title}\n${text}`)
    .join('\n\n');
