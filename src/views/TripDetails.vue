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
  import axios from '@/plugins/axios'; // ou import axios depuis node_modules
  
  export default {
    name: 'TripDetails',
    props: {
        trip: Object,      // { id, amount, chargeId, refundStatus, … }
    },
    data() {
        return {
            isRefunding: false,
            error: null,
            message: null,
        };
    },
    methods: {
        formatAmount(cents) {
            return (cents / 100).toFixed(2) + ' €';
        },
        async requestRefund() {
            this.isRefunding = true;
            this.error = null;
            this.message = null;
            try {
                const { data } = await axios.post('/refund', {
                    chargeId: this.trip.chargeId,
                    amount: this.trip.amount
                });
                this.message = 'Demande de remboursement envoyée.';
                // mettre à jour localement le statut pour désactiver le bouton
                this.$emit('update-trip', {
                    ...this.trip,
                    refundStatus: data.refund.status
                });
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.isRefunding = false;
            }
        }
    },
    mounted() {
        this.interval = setInterval(this.$emit.bind(this, 'fetch-trip'), 5000);
    },
    beforeDestroy() {
        clearInterval(this.interval);
    },
  };
  </script>
  