
<style lang="scss" model>
    .hour-dep-other {
        .v-btn {
            margin: 20px auto;
            color: var(--font-color-label) !important;
        }

        .v-switch {
            .v-selection-control {
                min-height: inherit !important;
            }
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .hour-dep-other {
        overflow: scroll;
        padding-bottom: 110px;
        height: 100vh;
        .title {
            font-size: var(--font-size-h1);
            color: var(--font-color-label);
            font-weight: bold;
            width: 100%;
            padding: 0 39px 0px 39px;
            margin: 30px auto;
        }

        .cont {
            background-color: var(--bg-app-color);
            width: 90%;
            margin: auto;
            .sub-cont {
                .day {
                    font-size: medium;
                    font-weight: bold;
                    text-transform: capitalize;
                    color: var(--font-color-label);
                }
                .choice {
                    margin: 10px 0;
                    border-radius: 15px;
                    box-shadow: var(--box-shadow-card);
                    background-color: var(--white-bg-color);
                    position: relative;
                    
                    .dom, .work {
                        display: flex;
                        justify-content: space-between;
                        height: 51px;
                        div {
                            width: 100%;
                            margin: auto;
                            color: var(--font-color-label);
                            &.type {
                                text-align: left;
                                padding-left: 15px;
                                
                            }
                            &.hour {
                                text-align: center;
                            }
                            &.btn {
                                .v-switch {
                                    width: fit-content;
                                    position: relative;
                                    right: 0px;
                                    .v-selection-control {
                                        min-height: inherit !important;
                                    }
                                }
                            }
                        }
                    }

                    .dom {
                        border-bottom: 2px solid #d8d8d8;
                    }

                    .work {
                        border-top: 2px solid #d8d8d8;
                    }
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
    <div class="hour-dep-other">
        <div
            class="title text-center"
        >Indiquez vos horaires</div>

        <div class="cont">
            <div 
                v-for="(day, index) in days"
                :key="index"
                class="sub-cont"
            >
                <div
                    class="day"
                >
                    {{ day }}
                </div>

                <div
                    class="choice"
                >
                    <div class="dom">
                        <div class="type">Domicile</div>
                        <div class="hour">{{ hour.domicile }}</div>
                        <div class="btn">
                            <v-switch
                                hide-details
                                inset
                                dark
                                color="blue"
                            ></v-switch>
                        </div>
                    </div>

                    <div class="work">
                        <div class="type">Travail</div>
                        <div class="hour">{{ hour.work }}</div>
                        <div class="btn">
                            <v-switch
                                hide-details
                                inset
                                dark
                                color="blue"
                            ></v-switch>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="cont">
            <v-btn
                class="text-none"
                rounded="xl" 
                size="x-large"
                variant="outlined"
                block
                @click="$emit('hour-dep-other-valided')"
            >Continuer</v-btn>
        </div>
    </div>
   
</template>



<!--  -->
<script>
    //import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';


    // Components

    export default defineComponent({
        name: 'hour-dep-other-view',
        emits: ['hour-dep-other-valided'],
        computed: {
            ...mapState(["trajets"]),
        },
        components: {
        },
        props: {
            hour: {
                type: Object,
                default: () => (
                    {
                        "domicile":"08:00",
                        "work":"17:00",
                    }
                ),
            }
        },
        data() {
            return {
                days: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
            }
        },
        mounted(){
            
        },
        methods: {
        },
        watch: {

        },
    });
</script>
