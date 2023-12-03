<!-- model -->
<style lang="scss" model>
    .v-card.trajet-search-comp {
        z-index: 20 !important;
        overflow: visible;
        border-radius: 20px !important;
        
        
        i.v-icon {
            font-size: 1.2em;
            margin: auto 0;
        }

        .v-list {
            
            overflow: visible;
            border-radius: 20px !important;
            .part-list {
                
                padding: 10px 16px 10px 16px !important;
                .v-list-item {
                    .v-list-item__prepend{
                        display: inherit !important;
                    }
                    i.v-icon {
                        color: gray !important;
                    }
                }
                
                .container-text.trajet-search-comp {
                    .v-list-item__content {
                        display: flex;
                    }
                }

                //calendar
                .container-calendar {
                    display: flex;
                    justify-content: space-between;
                    //height: 58px;
                    .calendar {
                        .v-list-item-title, .v-list-item__content{
                            font-weight: bold;
                            color: var(--font-color-label);
                        }
                    }

                    .nb-person.v-list-item {
                        .v-list-item__content{
                            color: var(--font-color-label);
                        }
                        i.v-icon {
                            margin-right: 20px;
                            color: gray !important;
                        }
                    }
                    .mdi-account-plus.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default {
                        margin-right: 15px;
                        font-size: 1.4em;
                    }

                    //swap
                    .switch {
                        position: absolute;
                        .cont-btn-switch{
                            position: absolute;
                            width: 32px;
                            height: 32px;
                            bottom: 110px;
                            left: 0;
                            // swap
                            .v-btn {
                                position: relative;
                                right: 13px;
                                width: 32px;
                                height: 32px;
                                .v-btn__overlay{
                                    display: none;
                                }
                                .v-icon {
                                    font-size: 27px;
                                    margin: 0 !important;
                                }
                                .mdi-swap-horizontal.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
                                    position: absolute;
                                    right: 0px;
                                    transform: rotate(90deg);
                                    font-size: 1.8em;
                                    color: gray;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    .cont-btn {
        width: 70%;
        cursor: pointer;
        z-index: 1;
    }

    .head-search-selected {
        color: gray;
        font-size: 0.8em;
        position: absolute;
        top: -2px;
        padding: 0 17.5px;
    }
    .v-btn.selected {
        color: var(--font-color-label) !important;
    }
</style>

<!-- scoped -->
<style lang="scss" scoped>
    .v-card.trajet-search-comp {
        margin: 35px;
        margin-top: 10px;
        width: 89.6%;
        background-color: var(--white-bg-color);
        box-shadow: var(--box-shadow-card);
        .v-list-item {
            &.calendar {
                width: 70%;
                .v-list-item-title, .v-list-item__content{
                    font-weight: bold;
                }
                i.v-icon {
                    margin-right: 10px;
                }
            }
            
            &.nb-person {
                .v-list-item__prepend {
                    .v-list-item i.v-icon {
                        margin-right: 20px;
                        color: gray !important;
                    }
                }
                &.switch{
                    padding: 0;
                    margin: 0;
                    width: 0;
                }
            }

            &.trajet-search-comp {
                .v-btn {
                    color: gray;
                    font-size: 1rem;
                }
            }
        }

        // 
        .v-btn.search-btn {
            position: relative;
            bottom: -10px;
            color: var(--font-color-label);
        }
    }
    
   
</style>

<template>
    <v-card
        class="trajet-search-comp card-trajet mx-auto mt-0"
        max-width="500"
    >
        <v-list>
            <div class="part-list">

                <!-- Depart -->
                <v-list-item
                    class="container-text trajet-search-comp"
                >
                    <v-icon>mdi-navigation</v-icon>
                    <div 
                        class="cont-btn" @click="$emit('open-dep')"
                    >
                        <div 
                            v-if="(depart != null && depart != '')"
                            class="head-search-selected"
                        >Départ</div>
                        
                        <v-btn
                            variant="text"
                            class="text-none"
                            :class="{selected : (depart != null && depart != '')}"
                            :ripple="false"
                            :active="false"
                            @click="$emit('open-dep')"                  
                        >{{ (depart == null || depart == '') ? 'Départ' : depart }}</v-btn>
                    </div>
                </v-list-item>
                
                <!-- Destination -->
                <v-list-item
                    class="container-text trajet-search-comp"
                >
                    <v-icon>mdi-navigation</v-icon>
                    <div 
                        class="cont-btn" 
                        @click="$emit('open-dest')"
                    >
                        <div 
                            v-if="(destination != null && destination != '')"
                            class="head-search-selected"
                        >Destination</div>
                        <v-btn
                            variant="text"
                            class="text-none"
                            :class="{selected : (destination != null && destination != '')}"
                            :ripple="false"
                            :active="false"
                            @click="$emit('open-dest')"
                        >{{ (destination == null || destination == '') ? 'Destination' : destination }}</v-btn>
                    </div>
                </v-list-item>

                
                <div class="container-calendar">

                    <!-- Calendar -->
                    <v-list-item
                        class="calendar"
                        @click="$emit('open-calendar')"
                        :ripple="false"
                        :active="false"
                    >
                        <v-icon style="margin-right: 18px;">mdi-calendar-month-outline</v-icon>{{ dateString }}
                    </v-list-item>
                    

                    <!-- Nb passenger -->
                    <v-list-item
                        class="nb-person"
                        prepend-icon="mdi-account-plus"
                        :title="nbPassenger"
                        :active="false"
                        :ripple="false"
                        
                    >
                        <template v-slot:prepend-icon="{ prependIcon }">
                            <v-icon :icon="prependIcon"
                                @click="$emit('open-nb-passenger')"
                            ></v-icon>
                        </template>

                        <!-- Swicth -->
                        <v-list-item
                            class="switch"
                        >
                            <div class="cont-btn-switch">
                                <v-btn 
                                    icon
                                    variant="text"
                                    @click="switchCommuneEmit()"
                                    :ripple="false"
                                >
                                    <v-icon
                                        class=""
                                        variant="text"
                                    >mdi-repeat-variant</v-icon>
                                </v-btn>
                            </div>
                        </v-list-item>
                    </v-list-item>

                </div>
            </div>

            <!-- Search -->
            <v-btn
                class="search-btn mr-4 text-none"
                rounded="xl" 
                size="x-large"
                variant="outlined"
                block
                @click="goResult()"
            >
                Rechercher
            </v-btn>
        </v-list>
    </v-card>   
</template>


<script>
    import $ from 'jquery'
    import { mapState, mapActions, mapMutations } from 'vuex';

    export default {
        name: 'trajet-search-comp',
        emits: ["switch-commune", "trajet-selected", "open-dep", "open-dest", "open-calendar", "open-nb-passenger"],
        computed: {
            ...mapState("search", ['villages', 'depart', 'destination', 'nbPassenger']),
            ...mapActions("search", ['getVillages']),
        },
        components: {
        },
        props: {
            dateString: {
                type: String,
                default: "Aujourd'hui",
            },
        },
        data() {
            return {
                switch: false,
            }
        },
        created() {
            if( this.villages == undefined || this.villages == null || this.villages.length == 0 ){
                this.getVillages;
            }
        },
        methods: {
            ...mapMutations("search", ["SET_DEPART", "SET_DESTINATION"]),
            switchCommuneEmit(){
                //Animation
                if( ! this.switch ){
                    $('.cont-btn-switch .v-btn').animate(
                        { deg: 180 },
                        {
                            duration: 50,
                            step: function(now) {
                                $(this).css({ transform: 'rotate(' + now + 'deg)' });
                            }
                        }
                    );
                    this.switch = true;
                }
                else {
                    $('.cont-btn-switch .v-btn').animate(
                        { deg: 0 },
                        {
                            duration: 50,
                            step: function(now) {
                                $(this).css({ transform: 'rotate(' + now + 'deg)' });
                            }
                        }
                    );
                    this.switch = false;
                }

                // update values
                var tmp = this.depart;
                this.SET_DEPART(this.destination);
                this.SET_DESTINATION(tmp);
            },
            goResult(){
                console.log("go to :", `/results/${this.depart}/${this.destination}/${this.dateString}/${this.nbPassenger}`)
                if ( this.depart && this.destination ) {
                    this.$emit("trajet-selected");
                    this.$router.push(`/results/${this.depart}/${this.destination}/${this.dateString}/${this.nbPassenger}`);
                }
            },
        },
        watch: {
        },
    };
</script>