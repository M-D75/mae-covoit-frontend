<template>
    <v-dialog :model-value="modelValue" max-width="720" scrollable @update:model-value="$emit('update:modelValue',$event)">
        <v-card title="Historique">
            <v-card-subtitle>Vos réservations et publications des 30 derniers jours</v-card-subtitle>
            <v-card-text><GroupListCardsHistory /></v-card-text>
            <v-card-actions><v-btn :loading="history.load" @click="reload">Actualiser</v-btn><v-btn @click="$emit('update:modelValue',false)">Fermer</v-btn></v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import {mapState} from 'vuex';
import GroupListCardsHistory from '@/components/menus/bottom/GroupListCardsHistory.vue';
export default {name:'ProfileHistoryDialog',components:{GroupListCardsHistory},props:{modelValue:Boolean},emits:['update:modelValue'],computed:{...mapState('profil',['history'])},watch:{modelValue(open){if(open)this.reload();}},methods:{reload(){return this.$store.dispatch('profil/buildHistoriqueBooking');}}};
</script>
