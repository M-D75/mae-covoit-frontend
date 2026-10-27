<template>
    <component :is="inline ? 'section' : 'v-dialog'" v-if="!inline || modelValue"
        v-bind="inline ? { class: 'boarding-inline', 'aria-label': 'Votre code de montée' } : { modelValue, maxWidth: 460, zIndex: 3000 }"
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card class="boarding-card" variant="flat">
            <v-card-title class="boarding-heading"><span>Code de montée</span><v-btn v-if="inline" variant="text" density="comfortable" prepend-icon="mdi-eye-off-outline" class="hide-code" @click="$emit('update:modelValue', false)">Cacher</v-btn></v-card-title>
            <v-card-text>
                <p>{{ isDriver ? 'Demandez le code au passager pour confirmer sa montée.' : 'Donnez ce code au chauffeur lorsque vous montez à bord.' }}</p>
                <p v-if="!reservations.length">Aucune réservation acceptée.</p>
                <section v-for="booking in reservations" :key="booking.id" class="my-4">
                    <strong v-if="isDriver">{{ passengerName(booking) }}</strong>
                    <v-chip v-if="states[booking.id]?.confirmed || booking.in_car" color="success" variant="tonal" size="small" prepend-icon="mdi-check-circle-outline" role="status">À bord</v-chip>
                    <template v-else>
                        <template v-if="isDriver">
                            <v-text-field v-model="codes[booking.id]" :label="`Code à ${codeDigits(booking)} chiffres${legacyCodes[booking.id] ? ' (ancien)' : ''}`" variant="outlined" density="comfortable" class="boarding-code-input" inputmode="numeric" pattern="[0-9]*" autocomplete="off" @paste="handleCodePaste($event, booking)" :maxlength="codeDigits(booking)" :disabled="busy" />
                            <v-btn :loading="busy" :disabled="busy || !validCode(codes[booking.id], codeDigits(booking))" @click="confirm(booking)" variant="tonal" color="primary" prepend-icon="mdi-check">Confirmer la montée</v-btn>
                            <v-btn variant="text" size="small" class="legacy-code-toggle" :disabled="busy" :aria-pressed="Boolean(legacyCodes[booking.id])" @click="toggleLegacy(booking)">{{ legacyCodes[booking.id] ? 'Revenir au code à 4 chiffres' : 'Ancien code à 6 chiffres' }}</v-btn>
                        </template>
                        <template v-else>
                            <p v-if="states[booking.id]?.code" class="boarding-pin my-4" :aria-label="`Votre code de montée à ${states[booking.id].code.length} chiffres`">{{ states[booking.id].code }}</p>
                            <p v-else-if="busy" role="status">Chargement du code…</p>
                            <p v-if="states[booking.id]?.code?.length === 6" class="text-caption">Code déjà émis : 6 chiffres, valable jusqu’à son expiration.</p>
                            <p v-if="states[booking.id]?.expiresAt" class="text-caption">Valable jusqu’à {{ expiryLabel(states[booking.id].expiresAt) }}</p>
                        </template>
                    </template>
                    <p v-if="errors[booking.id]" role="alert" class="mt-2">{{ errors[booking.id] }}</p>
                </section>
                <v-btn v-if="Object.values(errors).some(Boolean)" :disabled="busy" @click="refresh">Réessayer</v-btn>
                <p v-if="notice" role="status">{{ notice }}</p>
            </v-card-text>
            <v-card-actions v-if="!inline"><v-btn @click="$emit('update:modelValue', false)">{{ inline ? 'Cacher le code' : 'Fermer' }}</v-btn></v-card-actions>
        </v-card>
    </component>
</template>
<script>
import { serverRequest } from '@/utils/serverApi.js';
import { boardingReservations, validBoardingCode } from '@/components/trip/boardingUtils.js';
export default {
    name: 'BoardingCode',
    props: { modelValue: Boolean, inline: Boolean, isDriver: Boolean, bookings: { type: Array, default: () => [] }, userId: [String, Number], userUid: String, mode: String },
    emits: ['update:modelValue', 'confirmed'],
    data: () => ({ states: {}, codes: {}, legacyCodes: {}, errors: {}, busy: false, notice: '', timer: null, generation: 0, requestController: null }),
    computed: { reservations() { return boardingReservations(this.bookings, this.isDriver, this.userId, this.userUid); } },
    watch: {
        modelValue: {
            immediate: true,
            handler(open) {
                this.clearSecrets();
                if (open) {
                    this.refresh();
                    this.timer = setInterval(() => this.refresh(), 15000);
                }
            },
        },
    },
    beforeUnmount() { this.clearSecrets(); },
    methods: {
        clearSecrets() {
            this.generation++; clearInterval(this.timer); this.timer = null;
            this.requestController?.abort(); this.requestController = null;
            this.states = {}; this.codes = {}; this.legacyCodes = {}; this.errors = {}; this.notice = ''; this.busy = false;
        },
        expiryLabel(value) {
            const date = new Date(value);
            return Number.isFinite(date.getTime()) ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'horaire indisponible';
        },
        handleCodePaste(event, booking) {
            const value = event.clipboardData?.getData('text')?.trim() || '';
            event.preventDefault();
            if (this.validCode(value, this.codeDigits(booking))) { this.codes[booking.id] = value; this.errors[booking.id] = ''; return; }
            this.codes[booking.id] = '';
            this.errors[booking.id] = /^\d{6}$/.test(value) && !this.legacyCodes[booking.id]
                ? 'Code de 6 chiffres : sélectionnez « Ancien code à 6 chiffres » avant de le coller.'
                : `Saisissez exactement ${this.codeDigits(booking)} chiffres.`;
        },
        codeDigits(booking) { return this.legacyCodes[booking.id] ? 6 : 4; },
        toggleLegacy(booking) { this.codes[booking.id] = ''; this.errors[booking.id] = ''; this.legacyCodes[booking.id] = !this.legacyCodes[booking.id]; },
        validCode: validBoardingCode,
        passengerName(booking) { return [booking.account?.firstname, booking.account?.lastname].filter(Boolean).join(' ') || booking.account?.username || 'Passager'; },
        async refresh() {
            if (this.busy || !this.modelValue) return;
            const generation = this.generation;
            this.busy = true;
            const controller = new AbortController(); this.requestController = controller;
            try {
                for (const booking of this.reservations) {
                    try {
                        const suffix = this.isDriver ? 'boarding-status' : 'boarding-code';
                        const response = await serverRequest('get', `/bookings/${booking.id}/${suffix}`, { mode: this.mode, signal: controller.signal });
                        if (generation !== this.generation) return;
                        const state = response.data.data;
                        this.states[booking.id] = state;
                        this.errors[booking.id] = '';
                        if (state.confirmed) this.$emit('confirmed', { bookingIds: state.bookingIds || [booking.id] });
                    } catch (error) {
                        if (generation === this.generation) this.errors[booking.id] = error.response?.data?.message || 'Code de montée indisponible.';
                    }
                }
            } finally { if (generation === this.generation) { this.busy = false; this.requestController = null; } }
        },
        async confirm(booking) {
            if (this.busy || !this.validCode(this.codes[booking.id], this.codeDigits(booking))) return;
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
            } finally { if (generation === this.generation) { this.busy = false; this.requestController = null; } }
        },
    },
};
</script>

<style scoped>
.boarding-inline { margin: 0 12px; }
.boarding-card { background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); border: 1px solid rgba(var(--v-theme-on-surface), .12); border-radius: 12px; }
.boarding-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; white-space: normal; position: sticky; top: 0; z-index: 1; background: rgb(var(--v-theme-surface)); font-size: 17px; }
.hide-code, .legacy-code-toggle { min-height: 44px; text-transform: none; letter-spacing: normal; }
.boarding-pin { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(28px, 8vw, 36px); font-weight: 600; letter-spacing: .3em; color: rgb(var(--v-theme-on-surface)); }
.boarding-card :deep(.v-btn) { min-height: 44px; }
.boarding-code-input :deep(input) { font-family: ui-monospace, monospace; font-size: 24px; letter-spacing: .25em; }
.hide-code:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
</style>
