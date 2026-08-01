<template>
    <div>
        <!-- Détails de la course... -->
        <p>Montant payé : {{ formatAmount(trip.amount) }}</p>
    
        <!-- Bouton de remboursement, désactivé si déjà remboursé -->
        <button
            :disabled="isRefunding || trip.refundStatus === 'succeeded'"
            @click="requestRefund"
        >
            <span v-if="isRefunding">En cours…</span>
            <span v-else-if="trip.refundStatus === 'succeeded'">Remboursé ✔︎</span>
            <span v-else>Rembourser</span>
        </button>
    
        <!-- Message d’erreur ou de succès -->
        <p v-if="error" class="text-red-500">{{ error }}</p>
        <p v-if="message" class="text-green-600">{{ message }}</p>
    </div>
  </template>
  
  <script>
  import { createRequestId } from '@/utils/requestId.js';
  import { serverRequest } from '@/utils/serverApi.js';
  
  export default {
    name: 'TripDetails',
    props: {
        trip: Object,      // { id, amount, chargeId, refundStatus, … }
    },
    data() {
        return {
            isRefunding: false,
            refundRequestId: null,
            error: null,
            message: null,
        };
    },
    methods: {
        formatAmount(cents) {
            return (cents / 100).toFixed(2) + ' €';
        },
        async requestRefund() {
            // Keep the same UUID after a timeout: Stripe and the database then
            // recover the first refund instead of creating a second one.
            this.refundRequestId = this.refundRequestId || createRequestId();
            this.isRefunding = true;
            this.error = null;
            this.message = null;
            try {
                const { data } = await serverRequest('post', '/refund', {
                    data: {
                        chargeId: this.trip.chargeId,
                        amount: this.trip.amount,
                        requestId: this.refundRequestId,
                    }
                });
                this.message = 'Demande de remboursement envoyée.';
                // mettre à jour localement le statut pour désactiver le bouton
                this.$emit('update-trip', {
                    ...this.trip,
                    refundStatus: data.refund.status
                });
            } catch (err) {
                this.error = err.response?.data?.message || err.message;
            } finally {
                this.isRefunding = false;
            }
        }
    },
    mounted() {
        this.interval = setInterval(this.$emit.bind(this, 'fetch-trip'), 5000);
    },
    beforeUnmount() {
        clearInterval(this.interval);
    },
  };
  </script>
