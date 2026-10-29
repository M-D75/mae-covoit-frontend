<template>
    <component :is="inline ? 'section' : 'v-dialog'" v-if="!inline || modelValue"
        v-bind="inline ? { class: 'boarding-inline', 'aria-label': 'Votre code de montée' } : { modelValue, class: 'boarding-dialog', maxWidth: 460, zIndex: 13000, style: {height: viewportHeight+'px',top:viewportTop+'px',bottom:'auto',left:'0px',right:'0px',width:'100%',margin:'0px'} }"
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card class="boarding-card" :class="{'boarding-driver-dialog':isDriver && !inline}" variant="flat" :style="!inline ? {maxHeight: Math.max(160,viewportHeight-32)+'px'} : {}">
            <v-card-title class="boarding-heading"><span>Code de montée</span><v-btn v-if="inline" variant="text" density="comfortable" prepend-icon="mdi-eye-off-outline" class="hide-code" @click="$emit('update:modelValue', false)">Cacher</v-btn></v-card-title>
            <v-card-text>
                <p>{{ isDriver ? 'Demandez le code au passager pour confirmer sa montée.' : 'Donnez ce code au chauffeur lorsque vous montez à bord.' }}</p>
                <p v-if="!reservations.length">Aucune réservation acceptée.</p>
                <section v-for="booking in reservations" :key="booking.id" class="boarding-reservation" :class="{'driver-reservation':isDriver}">
                    <strong v-if="isDriver" class="boarding-passenger-name">{{ passengerName(booking) }}</strong>
                    <v-chip v-if="states[booking.id]?.confirmed || booking.in_car" color="success" variant="tonal" size="small" prepend-icon="mdi-check-circle-outline" role="status">À bord</v-chip>
                    <template v-else>
                        <template v-if="isDriver">
                            <v-text-field v-model="codes[booking.id]" :label="`Code à ${codeDigits(booking)} chiffres${legacyCodes[booking.id] ? ' (ancien)' : ''}`" variant="outlined" density="comfortable" class="boarding-code-input boarding-field-isolated" hide-details inputmode="numeric" pattern="[0-9]*" autocomplete="off" @paste="handleCodePaste($event, booking)" :maxlength="codeDigits(booking)" :disabled="busy" />
                            <v-btn :loading="busy" :disabled="busy || !validCode(codes[booking.id], codeDigits(booking))" @click="confirm(booking)" class="boarding-confirm" variant="tonal" color="primary" prepend-icon="mdi-check">Confirmer la montée</v-btn>
                            <v-btn variant="text" size="small" class="legacy-code-toggle" :disabled="busy" :aria-pressed="Boolean(legacyCodes[booking.id])" @click="toggleLegacy(booking)">{{ legacyCodes[booking.id] ? 'Revenir au code à 4 chiffres' : 'Ancien code à 6 chiffres' }}</v-btn>
                        </template>
                        <template v-else>
                            <p v-if="states[booking.id]?.code" class="boarding-pin my-4" :aria-label="`Votre code de montée à ${states[booking.id].code.length} chiffres`">{{ states[booking.id].code }}</p>
                            <p v-else-if="busy || refreshing" role="status">Chargement du code…</p>
                            <p v-if="states[booking.id]?.code?.length === 6" class="text-caption">Code déjà émis : 6 chiffres, valable jusqu’à son expiration.</p>
                            <p v-if="states[booking.id]?.expiresAt" class="text-caption">Valable jusqu’à {{ expiryLabel(states[booking.id].expiresAt) }}</p>
                        </template>
                    </template>
                    <p v-if="errors[booking.id]" role="alert" class="boarding-error"><strong>{{ failureLabel(errorKinds[booking.id]) }}</strong> {{ errors[booking.id] }}</p>
                    <p v-if="statusErrors[booking.id]" role="status" class="boarding-error">{{ statusErrors[booking.id] }}</p>
                </section>
                <v-btn v-if="Object.values(errors).some(Boolean) || Object.values(statusErrors).some(Boolean)" :disabled="busy || refreshing" @click="refresh">Actualiser l’état</v-btn>
                <p v-if="notice" role="status">{{ notice }}</p>
            </v-card-text>
            <v-card-actions v-if="!inline"><v-btn @click="$emit('update:modelValue', false)">{{ inline ? 'Cacher le code' : 'Fermer' }}</v-btn></v-card-actions>
        </v-card>
    </component>
</template>
<script>
import {observeSheetViewport} from '@/utils/sheetViewport.js';
import { serverRequest } from '@/utils/serverApi.js';
import { boardingReservations, validBoardingCode, boardingFailure } from '@/components/trip/boardingUtils.js';
export default {
    name: 'BoardingCode',
    props: { modelValue: Boolean, inline: Boolean, isDriver: Boolean, bookings: { type: Array, default: () => [] }, userId: [String, Number], userUid: String, mode: String },
    emits: ['update:modelValue', 'confirmed'],
    data: () => ({ viewportHeight:typeof window==='undefined'?700:window.innerHeight,viewportTop:0,stopViewport:null,states: {}, codes: {}, legacyCodes: {}, errors: {}, busy: false, refreshing:false,statusErrors:{},errorKinds:{}, notice: '', timer: null, generation: 0, requestController: null }),
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
    mounted(){if(!this.inline)this.stopViewport=observeSheetViewport(value=>{this.viewportHeight=value.height;this.viewportTop=value.top;});},
    beforeUnmount() { this.stopViewport?.();this.clearSecrets(); },
    methods: {
        clearSecrets() {
            this.generation++; clearInterval(this.timer); this.timer = null;
            this.requestController?.abort(); this.requestController = null;
            this.states = {}; this.codes = {}; this.legacyCodes = {}; this.errors = {}; this.statusErrors={};this.errorKinds={};this.notice = ''; this.busy = false;this.refreshing=false;
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
        failureLabel(kind){return {code:'Code refusé.',blocked:'Validation bloquée.',window:'Fenêtre de montée.',access:'Accès refusé.',reservation:'Réservation à actualiser.',simulation:'Essai restreint.',version:'Mise à jour requise.',session:'Session à renouveler.',service:'Service indisponible.',payment:'Règlement à vérifier.'}[kind]||'Validation non confirmée.';},
        async refresh() {
            if (this.busy || this.refreshing || !this.modelValue) return;
            const generation = this.generation;
            this.refreshing = true;this.statusErrors ||= {};this.errorKinds ||= {};
            const controller = new AbortController(); this.requestController = controller;
            try {
                for (const booking of this.reservations) {
                    try {
                        const suffix = this.isDriver ? 'boarding-status' : 'boarding-code';
                        const response = await serverRequest('get', `/bookings/${booking.id}/${suffix}`, { mode: this.mode, signal: controller.signal });
                        if (generation !== this.generation) return;
                        const state = response.data.data;
                        this.states[booking.id] = state;
                        this.statusErrors[booking.id] = '';
                        if(state.confirmed){if(this.errorKinds[booking.id]==='payment')this.notice='Montée confirmée. Le règlement reste à vérifier ; ne demandez pas un nouveau code.';this.errors[booking.id]='';delete this.errorKinds[booking.id];}
                        if (state.confirmed) this.$emit('confirmed', { bookingIds: state.bookingIds || [booking.id] });
                    } catch (error) {
                        if (generation === this.generation) {const failure=boardingFailure(error);this.statusErrors[booking.id]=failure.message;if(!this.isDriver&&!this.errors[booking.id])this.errors[booking.id]=failure.message;}
                    }
                }
            } finally { if (generation === this.generation) { this.refreshing = false; this.requestController = null; } }
        },
        async confirm(booking) {
            if (this.busy || !this.validCode(this.codes[booking.id], this.codeDigits(booking))) return;
            this.generation++;this.requestController?.abort();this.requestController=null;this.refreshing=false;
            const generation = this.generation;
            this.busy = true;this.errorKinds ||= {};this.statusErrors ||= {};
            try {
                const response = await serverRequest('post', `/bookings/${booking.id}/boarding-confirm`, { mode: this.mode, data: { code: this.codes[booking.id] } });
                if (generation !== this.generation) return;
                const result=response.data?.data;
                const ids=result?.bookingIds||[];
                const confirmed=ids.map(Number).includes(Number(booking.id))&&(result?.confirmed===true||result?.bookings?.some(row=>Number(row.id)===Number(booking.id)&&row.in_car===true));
                if(!confirmed)throw new Error('BOARDING_RESPONSE_NOT_CONFIRMED');
                this.states[booking.id] = { confirmed: true };
                if(result.settlementPending)this.notice='Montée confirmée. Le règlement reste à vérifier ; ne demandez pas un nouveau code.';
                this.codes[booking.id] = '';
                this.errors[booking.id] = '';
                this.statusErrors[booking.id]='';delete this.errorKinds[booking.id];
                this.$emit('confirmed', result);
            } catch (error) {
                if (generation !== this.generation) return;
                this.codes[booking.id] = '';
                const failure=boardingFailure(error);this.errors[booking.id]=failure.message;this.errorKinds[booking.id]=failure.kind;
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
.boarding-reservation{margin:16px 0}.driver-reservation{display:flex;flex-direction:column;align-items:stretch;gap:12px;padding:16px 0 4px;margin:20px 0 8px;border-top:1px solid rgba(var(--v-theme-on-surface),.14)}.boarding-passenger-name{font-size:16px;line-height:1.5;overflow-wrap:anywhere}.driver-reservation .boarding-code-input{margin-top:4px;flex:0 0 auto}.driver-reservation .boarding-confirm{width:100%;min-height:48px}.driver-reservation .legacy-code-toggle{align-self:flex-start;max-width:100%;height:auto;min-height:44px;padding:8px 0}.legacy-code-toggle :deep(.v-btn__content){white-space:normal;text-align:left;line-height:1.5}.boarding-driver-dialog :deep(.v-card-text){padding:16px 24px 8px}.boarding-driver-dialog :deep(.v-card-actions){padding:8px 16px 16px}.boarding-confirm :deep(.v-btn__content){white-space:normal;line-height:1.4}.driver-reservation .v-chip{align-self:flex-start}
 .boarding-driver-dialog :deep(.v-card-text){overflow-y:auto;min-height:0}.boarding-driver-dialog .boarding-heading,.boarding-driver-dialog :deep(.v-card-actions){flex-shrink:0}
/* Reset App.vue's global .v-card .v-input geometry only inside this form. */
.boarding-card .boarding-field-isolated{height:auto;min-height:0;margin:4px 0 0;padding:0;flex:0 0 auto}
.boarding-card .boarding-field-isolated :deep(.v-input__control){width:100%;min-width:0;margin:0}
.boarding-card.boarding-driver-dialog{height:auto;min-height:0;display:flex;flex-direction:column;flex:0 1 auto}
.boarding-card.boarding-driver-dialog :deep(.v-card-text){flex:0 1 auto;padding:16px 24px 8px}
.boarding-card.boarding-driver-dialog :deep(.v-card-actions){margin-top:0;min-height:44px;flex:0 0 auto;padding:8px 20px 12px}
.boarding-error{margin:8px 0 0;line-height:1.5;overflow-wrap:anywhere;color:rgb(var(--v-theme-error))}.boarding-error strong{display:block}
</style>
