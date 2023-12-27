
<style lang="scss" model>
    .scrollable-container {
        cursor: pointer;
        overflow-x: auto;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

    /* Pour Chrome, Edge et Safari */
    .scrollable-container::-webkit-scrollbar {
        width: 6px;
    }

    .scrollable-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .scrollable-container::-webkit-scrollbar-thumb {
        background-color: transparent;
    }


    .v-container.select-virement-view{
        // circle radio
        .mdi-radiobox-blank{
            color: var(--font-color-label);
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-container.select-virement-view{
        .title {
            font-size: var(--font-size-h1);
            font-weight: bold;
            width: 90%;
            margin: 10px auto;
            margin-top: 5px;
            margin-bottom: 20px;
            color: var(--font-color-label);
        }

        div.card-contain{
            margin: auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            //margin-top: 20px;
            .v-card.virement {
                margin: 10px auto;
                padding: 5px 20px;
                width: 90%;
                border-radius: 16px;
                background-color: var(--white-bg-color);
                box-shadow: var(--box-shadow-card);
                .v-list {
                    overflow: visible;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    .icon-container {
                        margin: auto 0;
                        .v-icon {
                            display: grid;
                            margin: auto;
                            font-size: 2em;
                        }
                    }
                    .model {
                        // max-width: 170px;
                        margin: auto 0 !important;
                        width: 77%;
                        overflow-x: auto;
                        .text{
                            width: fit-content;
                            font-size: 14px;
                            white-space: nowrap;
                            color: var(--font-color-label);
                        }
                        .sub-text{
                            font-size: 12px;
                            color: gray;
                        }
                    }

                    .v-radio{
                        position: absolute;
                        right: 0;
                    }
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
 
    <v-container 
        class="select-virement-view"
    >
        <div
            class="title text-center"
        >Quelle est la fréquence de vos transferts bancaires ?</div>

        <div 
            class="card-contain"
        >
            <v-radio-group
                v-model="choice"
            >
                <v-card
                    v-for="(info, index) in infos.slice(0, 6)"
                    :key="index"
                    class="virement mx-auto"
                    @click="select(index)"
                >
                    <v-list>
                        <div class="model scrollable-container" >
                            <div class="text">{{ info.text }}</div>
                            <div class="sub-text">{{ info.subText }}</div>
                        </div>
                        <!-- <div class="color" :style="'background-color: ' + info.color"></div> -->
                        <v-radio
                            :color="darkMode ? 'white' : 'black'"
                            :value="info.value"
                        ></v-radio>
                    </v-list>
                </v-card>
            </v-radio-group>
        </div>
    </v-container>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapMutations } from 'vuex';

    // Components

    export default defineComponent({
        name: 'select-virement-mode',
        computed: {
            ...mapState("profil", ["darkMode", "preferenceVirementMode"]),
        },
        components: {
        },
        data() {
            return {
                infos: [
                    {text: "Transfert manuel", subText: "frais en fonction de votre usage", value: 0},
                    {text: "1 fois par semaine", subText: "+1.0 de frais", value: 1},
                    {text: "1 fois tous les 2 semaines", subText: "+0.5 de frais", value: 2},
                    {text: "1 fois par mois", subText: "0.0 de frais ", value: 3},
                    {text: "1 fois tous les 3 mois", subText: "0.0 de frais", value: 4},
                ],
                choice: 0,
            };
        },
        mounted() {
            this.choice = this.preferenceVirementMode;
        },
        methods: {
            ...mapMutations("profil", ["SET_PREFERENCE_VIREMENT_MODE"]),
            select(index){
                this.choice = index;
                this.SET_PREFERENCE_VIREMENT_MODE(index);
            }
        },
        watch: {
        },
    });
</script>
