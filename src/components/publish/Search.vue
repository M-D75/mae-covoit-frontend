
<style lang="scss" model>
   .blc-text.publish .v-input .v-input__prepend {
      margin-right: -5px !important;
      text-align: center;
   }
   .blc-text.publish .v-input .v-input__prepend i.v-icon.mdi-navigation.mdi.notranslate.v-theme--light.v-icon--size-default {
      transform: inherit;
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
                margin-left: 20px;
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
</style>

<!-- scss -->
<style lang="scss" scoped>

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
</style>
   
<!--  -->
<template>
    <div class="bloc">
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
                        v-model="saisi"
                        :label="label"
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
                    @click="select(item)"
                    :ripple="false"
                    :active="false"
                >{{ item }}</v-list-item>

                <v-list-item
                    v-for="(item, index) in (items.filter( (commune) => ! history.includes(commune) ))"
                    :key="index"
                    :value="index"
                    :prepend-icon="'mdi-magnify'"
                    @click="select(item)"
                    :ripple="false"
                    :active="false"
                >{{ item }}</v-list-item>

                <!-- <v-list-item
                    v-for="(item, index) in (items.length > 0 ? items : history)"
                    :key="index"
                    :value="index"
                    :prepend-icon="history.includes(item) ? 'mdi-history' : 'mdi-magnify'"
                    @click="select(item)"
                >{{ item }}</v-list-item> -->
            </v-list>
        </v-card>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    //...

    export default defineComponent({
        name: 'search-publish-comp',
        computed: {
        },
        props: {
            title: {
                type: String,
                default: "D'ou partez vous",
            },
            label: {
                type: String,
                default: "Choisissez une commune de depart",
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
            }
        },
        data() {
            return {
                saisi: "",
            }
        },
        mounted(){
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
            }
        }
    });
</script>
