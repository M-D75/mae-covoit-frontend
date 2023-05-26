<!-- scss -->

<style lang="scss" scoped>
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
                    margin-top: 10px;
                    margin-bottom: 15px;
                    padding-left: 35px;
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
    <div class="history-trajets">
        <div class="contain-history">
            <div 
                v-for="info in infos"
                :key="info.date"
            >
                <div class="date">{{info.date}}</div>
                <GroupCardsHistory />
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

        components: {
            GroupCardsHistory,
        },
        props: {
            infos: {
                type: Array,
                default() {
                    return [
                        {
                            "date": "Ajourd'hui"
                        },
                        {
                            "date": "Demain"
                        },
                        {
                            "date": "Après Demain"
                        },
                    ];
                },
            },
        },
        data() {
            return {
            }
        },
        methods: {
        }
    });
</script>
