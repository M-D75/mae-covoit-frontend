<template>
    <v-dialog :model-value="modelValue" :persistent="submitting" max-width="520" @update:model-value="close">
        <v-card title="Signaler ce trajet">
            <v-card-text>
                <v-alert v-if="success" type="success" variant="tonal" role="status">{{ success }}</v-alert>
                <template v-else>
                    <p class="mb-4">Décrivez les faits afin de permettre leur examen. Votre signalement reste confidentiel.</p>
                    <v-select v-model="reason" :items="reasons" label="Motif" :disabled="submitting" />
                    <v-textarea v-model="details" label="Que s’est-il passé ?" hint="Entre 10 et 2 000 caractères" persistent-hint
                        counter="2000" maxlength="2000" :disabled="submitting" rows="4" />
                    <v-alert v-if="error" type="error" variant="tonal" role="alert" class="mt-3">{{ error }}</v-alert>
                </template>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn :disabled="submitting" @click="close(false)">{{ success ? 'Fermer' : 'Annuler' }}</v-btn>
                <v-btn v-if="!success" color="primary" :loading="submitting" :disabled="!canSubmit" @click="submit">Envoyer</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import {mapState} from 'vuex';
import {serverRequest} from '@/utils/serverApi.js';
export default {
    name: 'TripReportDialog',
    props: {modelValue: Boolean, tripId: [Number, String]},
    emits: ['update:modelValue'],
    data: () => ({reason: null, details: '', submitting: false, error: '', success: '', requestEpoch: 0, disposed: false,
        reasons: [
            {title: 'Conduite dangereuse', value: 'unsafe_driving'},
            {title: 'Comportement inapproprié', value: 'inappropriate_behavior'},
            {title: 'Informations trompeuses sur le trajet', value: 'misleading_trip'},
            {title: 'Autre problème', value: 'other'},
        ]}),
    computed: {
        ...mapState('profil', ['userUid', 'modeCo', 'accountGeneration']),
        canSubmit() {
            return !this.submitting && Number.isSafeInteger(Number(this.tripId)) && Number(this.tripId)>0
                && this.reasons.some(item => item.value===this.reason) && this.details.trim().length>=10
                && this.details.trim().length<=2000;
        },
    },
    watch: {
        modelValue(value) {if(value)this.resetForm();},
        tripId() {this.resetForm();},
        userUid() {this.resetForm();},
        accountGeneration() {this.resetForm();},
    },
    beforeUnmount() {this.disposed=true;this.requestEpoch++;},
    methods: {
        resetForm() {this.requestEpoch++;this.reason=null;this.details='';this.error='';this.success='';this.submitting=false;},
        close(value) {if(!value&&!this.submitting)this.$emit('update:modelValue',false);},
        async submit() {
            if(!this.canSubmit||this.submitting)return;
            const epoch=++this.requestEpoch, owner=this.userUid, generation=this.accountGeneration, tripId=Number(this.tripId);
            const current=()=>!this.disposed&&this.requestEpoch===epoch&&this.userUid===owner
                &&this.accountGeneration===generation&&Number(this.tripId)===tripId;
            this.submitting=true;this.error='';
            try {
                const response=await serverRequest('post',`/trips/${tripId}/reports`,{
                    mode:this.modeCo,data:{reason:this.reason,details:this.details.trim()},
                });
                if(!current())return;
                const result=response.data?.data;
                if(response.data?.status!=='ok'||!result?.reportId||Number(result.tripId)!==tripId) {
                    throw new Error('Confirmation de signalement invalide.');
                }
                this.success=result.alreadyReported?'Vous avez déjà signalé ce trajet. Votre signalement est bien enregistré.':'Votre signalement a été enregistré.';
            } catch(error) {
                if(current())this.error=error.response?.data?.message||'Le signalement n’a pas pu être confirmé. Réessayez.';
            } finally {if(current())this.submitting=false;}
        },
    },
};
</script>
