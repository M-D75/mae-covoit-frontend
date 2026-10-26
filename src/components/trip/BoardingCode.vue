<template>
    <v-dialog :model-value="modelValue" max-width="460" @update:model-value="$emit('update:modelValue', $event)">
        <v-card title="Code de montée">
            <v-card-text>
                <p>{{ isDriver ? 'Demandez le code au passager pour confirmer sa montée.' : 'Donnez ce code au chauffeur lorsque vous montez à bord.' }}</p>
                <p v-if="!reservations.length">Aucune réservation acceptée.</p>
                <section v-for="booking in reservations" :key="booking.id" class="my-4">
                    <strong v-if="isDriver">{{ passengerName(booking) }}</strong>
                    <p v-if="states[booking.id]?.confirmed || booking.in_car" role="status">Montée confirmée</p>
                    <template v-else>
                        <template v-if="isDriver">
                            <v-text-field v-model="codes[booking.id]" label="Code à 6 chiffres" inputmode="numeric" autocomplete="off" maxlength="6" :disabled="busy" />
                            <v-btn :loading="busy" :disabled="busy || !validCode(codes[booking.id])" @click="confirm(booking)">Confirmer la montée</v-btn>
                        </template>
                        <template v-else>
                            <p v-if="states[booking.id]?.code" class="text-h4 my-4" aria-label="Votre code de montée">{{ states[booking.id].code }}</p>
                            <p v-else-if="busy">Chargement du code…</p>
                        </template>
                    </template>
                    <p v-if="errors[booking.id]" role="alert" class="mt-2">{{ errors[booking.id] }}</p>
                </section>
                <p v-if="notice" role="status">{{ notice }}</p>
            </v-card-text>
            <v-card-actions><v-btn @click="$emit('update:modelValue', false)">Fermer</v-btn></v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { serverRequest } from '@/utils/serverApi.js';
import { boardingReservations, validBoardingCode } from '@/components/trip/boardingUtils.js';
export default {
    name: 'BoardingCode',
    props: { modelValue: Boolean, isDriver: Boolean, bookings: { type: Array, default: () => [] }, userId: [String, Number], mode: String },
    emits: ['update:modelValue', 'confirmed'],
    data: () => ({ states: {}, codes: {}, errors: {}, busy: false, notice: '', timer: null, generation: 0 }),
    computed: { reservations() { return boardingReservations(this.bookings, this.isDriver, this.userId); } },
    watch: {
        modelValue: {
            immediate: true,
            handler(open) {
                this.generation++;
                clearInterval(this.timer);
                this.states = {}; this.codes = {}; this.errors = {}; this.notice = '';
                if (open) {
                    this.refresh();
                    this.timer = setInterval(() => this.refresh(), 15000);
                }
            },
        },
    },
    beforeUnmount() { this.generation++; clearInterval(this.timer); },
    methods: {
        validCode: validBoardingCode,
        passengerName(booking) { return [booking.account?.firstname, booking.account?.lastname].filter(Boolean).join(' ') || booking.account?.username || 'Passager'; },
        async refresh() {
            if (this.busy || !this.modelValue) return;
            const generation = this.generation;
            this.busy = true;
            try {
                for (const booking of this.reservations) {
                    try {
                        const suffix = this.isDriver ? 'boarding-status' : 'boarding-code';
                        const response = await serverRequest('get', `/bookings/${booking.id}/${suffix}`, { mode: this.mode });
                        if (generation !== this.generation) return;
                        const state = response.data.data;
                        this.states[booking.id] = state;
                        this.errors[booking.id] = '';
                        if (state.confirmed) this.$emit('confirmed', { bookingIds: state.bookingIds || [booking.id] });
                    } catch (error) {
                        if (generation === this.generation) this.errors[booking.id] = error.response?.data?.message || 'Code de montée indisponible.';
                    }
                }
            } finally { this.busy = false; }
        },
        async confirm(booking) {
            if (this.busy || !this.validCode(this.codes[booking.id])) return;
            const generation = this.generation;
            this.busy = true;
            try {
                const response = await serverRequest('post', `/bookings/${booking.id}/boarding-confirm`, { mode: this.mode, data: { code: this.codes[booking.id] } });
                if (generation !== this.generation) return;
                this.states[booking.id] = { confirmed: true };
                this.codes[booking.id] = '';
                this.errors[booking.id] = '';
                this.$emit('confirmed', response.data.data);
            } catch (error) {
                if (generation !== this.generation) return;
                this.codes[booking.id] = '';
                this.errors[booking.id] = error.response?.data?.message || 'Validation indisponible. Vérifiez l’état avant de réessayer.';
            } finally { this.busy = false; }
        },
    },
};
</script>
