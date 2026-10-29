
<style lang="scss" model>
</style>

<style lang="scss" scoped>

    .card-trajet-history {
        margin: 10px auto;
        //background-color: var(--bg-app-color);
        .v-card {
            display: flex;
            justify-content: space-between;
            width: 327px;
            height: 53px;
            padding: 5px;
            border-radius: 24px;
            color: var(--font-color-label);
            background-color: var(--white-bg-color);
            > div {
                margin: auto;
                &.container-avatar {
                    margin-left: 0;
                    .v-avatar {
                        height: 100%;
                        margin: auto 0;
                    }
                }
                &.trajet {
                    display: flex;
                    margin: auto 0;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0 10px;
                }
            }
        }
    }

</style>

<template>

    <div class="card-trajet-history">

        <v-card
            class="mx-auto"
            max-width="500"
        >
            <div class="container-avatar">
                <v-avatar>
                    <v-img
                        alt="Avatar"
                        :src="infos.avatar"
                    ></v-img>
                </v-avatar>
            </div>
            
            <div class="trajet">
                <div>{{ infos.depart }}<small style="display:block">{{ infos.role==='driver'?'Conducteur':'Passager' }}</small></div>
                <v-icon>mdi-swap-horizontal</v-icon>
                <div>{{ infos.destination }}</div>
            </div>

            <div class="infos">
                <v-chip
                    class=""
                    color="blue"
                >
                    {{ infos.price == null ? '—' : infos.price + ' €' }}
                </v-chip>
                <!-- <div>{{ infos.price }}</div> -->
            </div>
        </v-card>
        <small class="history-date">{{ dateLabel }}</small>
        <v-btn v-if="infos.ratingEligible" variant="text" :loading="ratingBusy" @click="rateLater">{{ deferred ? 'Noter maintenant' : 'Noter ce trajet' }}</v-btn>
        <p v-if="ratingError" role="alert">{{ ratingError }}</p>
    </div>

</template>


<script>
import {isRatingDeferred} from '@/services/ratingPreferences.js';
export default {name:'card-trajet-history-comp',props:{infos:{type:Object,default:()=>({})}},data:()=>({ratingBusy:false,ratingError:''}),computed:{
 deferred(){return isRatingDeferred(this.$store.state.profil.userUid,this.infos.tripId);},
 dateLabel(){const date=new Date(this.infos.departure_time);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(date):'';},
},methods:{async rateLater(){this.ratingBusy=true;this.ratingError='';try{if(await this.$store.dispatch('trip/openRatingForTrip',this.infos.tripId))this.$router.push('/rating');}catch(error){this.ratingError=error.message;}finally{this.ratingBusy=false;}}}};
</script>
<style scoped>.card-trajet-history .v-card{width:100%;height:auto;min-height:64px;background:rgb(var(--v-theme-surface));color:rgb(var(--v-theme-on-surface));}.history-date{display:block;margin-top:4px;font-size:12px;color:rgb(var(--v-theme-on-surface));}</style>
