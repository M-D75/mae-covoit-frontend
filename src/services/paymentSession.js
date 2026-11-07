// A mounted payment form belongs to one authenticated account and intent.
export function paymentSession(vm) {
    const profile = vm.$store.state.profil;
    if (!vm.paymentOwner) vm.paymentOwner = {uid: profile.userUid, generation: profile.accountGeneration, intent: vm.activePaymentIntentId, mode: vm.mode};
    const owner = vm.paymentOwner;
    const intent = vm.activePaymentIntentId;
    const mode = vm.mode;
    const current = () => !vm.paymentDisposed && Boolean(owner.uid)
        && vm.$store.state.profil.userUid === owner.uid && vm.$store.state.profil.accountGeneration === owner.generation
        && vm.activePaymentIntentId === intent && vm.mode === mode
        && intent === owner.intent && mode === owner.mode;
    return {
        current,
        async wait(promise) {
            const result = await promise;
            if (!current()) throw Object.assign(new Error('Session de paiement expirée.'), {code:'SESSION_CHANGED'});
            return result;
        },
        options: {mode: profile.modeCo, expectedUserId: owner.uid},
    };
}
