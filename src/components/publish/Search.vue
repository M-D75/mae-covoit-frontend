
<style lang="scss" model>
    .publish-view {
        .blc-text.publish .v-input .v-input__prepend {
            margin-right: -5px !important;
            text-align: center;
        }
        .blc-text.publish .v-input .v-input__prepend i.v-icon.mdi-navigation.mdi.notranslate.v-theme--light.v-icon--size-default {
            transform: inherit;
        }

        .blc-text.publish {
            > .v-input {
                padding: 10px 0;
                .v-input__control {
                    .v-field {
                        .v-field__field {
                            .v-field__input {
                                margin-left: 17px !important;
                            }
                        }
                    }
                }
            }
        }

        .v-card {
            > .v-list {
                background-color: var(--white-bg-color);
                .v-field__field {
                    background-color: var(--white-bg-color);
                    color: var(--font-color-label);
                }
            }
            .v-input {
                height: 78px;
                margin-left: 8px;
                margin-bottom: -20px;
                .v-input__prepend {
                    //margin-right: 0;
                    text-align: center;
                    .v-icon {
                        color: var(--gray-icon-color);
                    }
                }

                .v-input__control {
                    width: 90%;
                    // margin-left: 20px;
                }
            }
        }

        .v-card.list::-webkit-scrollbar {
            width: 0;  /* Masquer la barre de défilement verticale */
            height: 0; /* Masquer la barre de défilement horizontale */
        }

        .v-card.list {
            -ms-overflow-style: none;
            > .v-list {
                .v-list-item {
                    .v-list-item__content {
                        color: var(--font-color-label);
                    }
                    .v-list-item__prepend {
                        .v-icon {
                            font-weight: bold;
                            color: var(--gray-icon-color);
                        }
                    }
                }
            }
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>

    .v-card {
        .v-input {
            margin: 0;
            .v-input__control{
                width: 100% !important;
                margin-left: inherit !important;
                margin: auto !important;
            }
        }
    }

    .bloc {
        // padding-top: var(--safe-top);
        // position: absolute;
        // top: 0;
        // left: 0;
        background-color: var(--bg-app-color);
        width: 100%;
        height: 100%;
        //padding-bottom: 110px;
        .title {
            font-size: var(--font-size-h1);
            font-weight: bold;
            width: 100%;
            margin: 25px auto;
            color: var(--font-color-label);
        }
        
        .blc-text {
            width: 85%;
            > .v-input {
                padding: 10px 0;
                // .v-input__control {
                //     .v-field {
                //         .v-field__field {
                //             .v-field__input {
                //                 margin-left: 17px !important;
                //             }
                //         }
                //     }
                // }
            }
        }
        .v-card {
            width: 90%;
            box-shadow: none;
            background-color: var(--white-bg-color);
            > .v-list {
                background-color: var(--white-bg-color);
                .v-field__field {
                    background-color: var(--white-bg-color);
                }
            }
            .v-input {
                margin-left: 8px;
                .v-input__prepend {
                    //margin-right: 0;
                    text-align: center;
                }

                .v-input__control {
                    width: 80%;
                    margin-left: 20px;
                }
            }
        }
        .v-card.list::-webkit-scrollbar {
            width: 0;  /* Masquer la barre de défilement verticale */
            height: 0; /* Masquer la barre de défilement horizontale */
        }
        .v-card.list {
            background-color: var(--bg-app-color);
            height: 80%;
            overflow: scroll;

            > .v-list {
                margin: auto;
                width: 90%;
                background-color: var(--bg-app-color);
                
                .v-list-item {
                    .v-list-item__prepend {
                        .v-icon {
                            color: var(--gray-icon-color);
                        }
                    }
                }
            }
        }
    }

    .mode-publish {
        margin: auto;
        // display: flex !important;
        display: flex;
        align-items: center;
        width: fit-content;
        .v-icon{
            color: var(--font-color-label);
            &.disabled_icon{
                opacity: 0.1;
            }
        }
        .v-switch{
            margin: auto 11px;
            font-weight: bold;
            color: var(--font-color-label);
            padding-top: 8px;
            .v-input__append {
                color: var(--gray-icon-color);
            }
            .v-input__details{
                display: none !important;
            }
        }
    }
</style>
   
<!--  -->
<template>
    <div class="bloc publish-view">
        <div
            class="title text-center"
        >{{ title }}</div>

        <v-card
            style="overflow: visible;"
            class="mx-auto rounded-xl w-85 overflow-visible"
            max-width="500"
        >
            <v-list class="overflow-visible rounded-xl">

                <div class="publish blc-text mx-auto">
                    <v-text-field
                        v-if="focus_deley"
                        v-model="saisi"
                        label=""
                        :placeholder="label"
                        :focused="false"
                        :active="false"
                        :autofocus="focus"
                        persistent-hint
                        prepend-icon="mdi-navigation"
                        variant="solo"
                    ></v-text-field>
                </div>
                
            </v-list>
        </v-card>
        
        <v-card
            class="mx-auto list"
        >
            <v-list
            >
                <v-list-item
                    v-for="(item, index) in (items.filter( (commune) => history.includes(commune) ))"
                    :key="index"
                    :value="index"
                    :prepend-icon="'mdi-history'"
                    :ripple="false"
                    :active="false"
                    @click="select(item)"
                >{{ item }}</v-list-item>

                <v-list-item
                    v-for="(item, index) in (items.filter( (commune) => ! history.includes(commune) ))"
                    :key="index"
                    :value="index"
                    :prepend-icon="'mdi-magnify'"
                    :ripple="false"
                    :active="false"
                    @click="select(item)"
                >{{ item }}</v-list-item>

                <!-- <v-list-item
                    v-for="(item, index) in (items.length > 0 ? items : history)"
                    :key="index"
                    :value="index"
                    :prepend-icon="history.includes(item) ? 'mdi-history' : 'mdi-magnify'"
                    @click="select(item)"
                >{{ item }}</v-list-item> -->

                <div v-if="switche" class="mode-publish">
                    <v-icon class="uniq-car" :class="{disabled_icon: modeWork}">mdi-car</v-icon>
                    <v-switch 
                        dark
                        inset
                        v-model="modeWork"
                        color="blue"
                        @click="$emit('mode-work-switch')" 
                    ></v-switch>
                    <v-icon class="multiple-car" :class="{disabled_icon: !modeWork}">mdi-briefcase-clock-outline</v-icon>
                </div>
            </v-list>
        </v-card>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    import { Capacitor } from '@capacitor/core';

    //const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';

    // Components
    //...

    export default defineComponent({
        name: 'search-publish-comp',
        emits: ["mode-work-switch", "selected", "saisi"],
        computed: {
        },
        props: {
            title: {
                type: String,
                default: "D'ou partez vous",
            },
            label: {
                type: String,
                default: "Choisissez un village de depart",
            },
            items: {
                type: Array,
                default: () => [],
            },
            history: {
                type: Array,
                default: () => [],
            },
            focus: {
                type: Boolean,
                default: false,
            },
            switche: {

            },
        },
        data() {
            return {
                saisi: "",
                modeWork: false,
                focus_deley: false,
            }
        },
        mounted(){
            if(isIOS){
                setTimeout(function(){
                    this.focus_deley = true;
                }.bind(this), 146)
            }
            else{
                this.focus_deley = true;
            }
        },
        methods: {
            select(val){
                this.saisi = val;
                this.$emit("selected");
                return this.saisi;
            },
        },
        watch: {
            saisi(){
                this.$emit("saisi");
            },
        }
    });
</script>
