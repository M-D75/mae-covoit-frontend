const STRIPE_ERROR_MAP = {
    card_declined: "Votre carte a été refusée par la banque. Merci d'essayer un autre moyen de paiement.",
    expired_card: "Votre carte a expiré. Veuillez mettre à jour vos informations de paiement.",
    incorrect_cvc: "Le cryptogramme visuel est incorrect.",
    incorrect_number: "Le numéro de carte est invalide.",
    authentication_required: "Une authentification supplémentaire est requise pour valider ce paiement.",
    insufficient_funds: "Solde insuffisant sur la carte sélectionnée.",
};

export function humanizeStripeError(error, fallback = "Une erreur s'est produite lors du paiement, veuillez réessayer plus tard.") {
    if(!error){
        return fallback;
    }

    const code = error?.raw?.code || error?.code;
    if(code && STRIPE_ERROR_MAP[code]){
        return STRIPE_ERROR_MAP[code];
    }

    console.error("Unhandled Stripe error:", error);
    return fallback;
}

export function humanizeSupabaseError(error, fallback = "Une erreur est survenue, veuillez réessayer plus tard.") {
    if(!error){
        return fallback;
    }

    console.error("Supabase error:", error);
    return fallback;
}
