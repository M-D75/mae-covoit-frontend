<!-- scss -->

<style lang="scss" scoped>
     @use "@/styles/mixins.scss" as mixins;

    .history-trajets {
        overflow: visible;
        width: 100%;
        margin: auto;
        height: 100%;
        .contain-history {
            overflow: scroll;
            height: 100%;
            div {
                .date {
                    color: var(--font-color-label);
                    margin-top: 10px;
                    margin-bottom: 15px;
                    padding-left: 35px;
                    @include mixins.respond-to('small') {
                        padding-left: 15px;
                    }
                }
            }
        }

        .contain-history-empty {
            height: 150px;
            .nothing {
                display: table;
                text-align: center;
                height: 100%;
                .contenu {
                    text-align: center;
                    display: table-cell;
                    vertical-align: middle;
                    i {
                        font-size: 35px;
                        margin-bottom: 5px;
                        color: var(--font-color-label);
                    }
                    span {
                        font-size: 17px;
                        text-transform: uppercase;
                        display: block;
                        color: var(--font-color-label);
                    }
                }
            }
            
            .load-cont{
                display: grid;
                height: 100%;
            }
        }
    }
</style>
   
<!--  -->
<template>
    <div class="history-trajets">

        <v-alert v-if="error" type="error" variant="tonal" role="alert" class="mx-4 mb-3">
            {{ error }}
            <div v-if="infos.length" class="text-body-2">Les derniers trajets chargés restent affichés.</div>
            <v-btn variant="text" :loading="loading" @click="$emit('retry')">Réessayer</v-btn>
        </v-alert>
        <v-progress-linear v-if="loading && infos.length" indeterminate color="blue" aria-label="Chargement des trajets" />
        <div 
            v-if="!error && infos.length==0"
            class="contain-history-empty"
        >
            <div
                v-if="!loading"
                class="nothing label-filter text-caption mx-auto"
            >
                <div class="contenu">
                    <v-icon icon="mdi-alert-circle-outline"></v-icon>
                    <span
                        v-if="mode=='planning'"
                    >Aucune publication récente !</span>

                    <span
                        v-else
                    >Aucune réservation récente !</span>
                </div>
            </div>

            <!-- loading -->
            <div 
                v-if="loading"
                class="load-cont align-center justify-center"
                >

                <v-progress-circular
                    color="blue"
                    indeterminate
                    size="64"
                ></v-progress-circular>
            </div>
        </div>

        <div 
            v-if="infos.length > 0"
            class="contain-history"
        >
            <div 
                v-for="info in infos"
                :key="info.date"
            >
                <div class="date">{{info.date}}</div>
                <GroupCardsHistory 
                    :infos="info.infos" 
                    :mode="mode" 
                    v-on:open-contacts="$emit('open-contacts')" 
                    v-on:open-member="$emit('open-member')"
                    v-on:booking-removed="$emit('booking-removed')"
                />
            </div>
        </div>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    import GroupCardsHistory from './GroupCardsHistory.vue';
    

    export default defineComponent({
        name: 'history-trajets-comp',
        emits: ["open-contacts", "open-member", "booking-removed", "retry"],
        components: {
            GroupCardsHistory,
        },
        props: {
            loading: Boolean,
            error: {type: String, default: ''},
            mode: {
                type: String,
                default: "planning",
            },
            infos: {
                type: Array,
                default: () => [],
            },
        },
    });
</script>
