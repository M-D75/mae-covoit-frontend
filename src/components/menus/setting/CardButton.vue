<style lang="scss" model>
    .card-btn {
        .v-list-item__prepend {
            display: grid;
            .v-icon {
                font-size: 16px;
                margin-right: 10px !important;
                color: v-bind(prependIconColor) !important;
            }
        }
        .v-list-item-title {
            font-weight: 450;
            max-width: 84%;
        }
    }
</style>

<!-- scoped -->
<style lang="scss" scoped>
    .v-card {
        border-radius: 15px;
        margin: 15px auto 15px auto;
        background-color: var(--white-bg-color);
        color: var(--font-color-label);
        &.card-btn {
            box-shadow: var(--box-shadow-card);
            height: 56px;
            .v-list-item {
                height: 100%;
                i.v-icon {
                    font-weight: bold;
                    color: var(--blue-color);
                }

                .v-chip {
                    font-size: 20px;
                    font-weight: 450;
                    display: grid;
                    position: absolute;
                    right: 13px;
                    top: 0;
                    bottom: 0;
                    min-width: 50px;
                    text-align: center;
                    margin: auto 0 !important;
                    .v-icon {
                        height: 100%;
                        color: var(--blue-color) !important;
                    }
                }

                .v-switch {
                    display: grid;
                    position: absolute;
                    right: 13px;
                    top: 0;
                    bottom: 0;
                    min-width: 50px;
                    text-align: center;
                }

                &.chip-rounded {
                    .v-chip {
                        width: 32px;
                        height: 32px;
                        min-width: inherit !important;
                        border-radius: 50px;
                    }
                }
            }
        }
    }

</style>


<!--  -->
<template>

    <v-card
        class="card-btn mx-auto "
        @click="invokFun()"
    >
        <v-list-item
            class="card-btn"
            :class="classConfig.join(' ')"
            :prepend-icon="prependIcon"
            :title="text"
        >
            <v-chip
                v-if="chip"
                class="ma-2 info-plus text-center"
                color="blue"
                label
            >
                <v-icon
                    v-if="chipText == ''"
                >
                    {{chipIcon}}
                </v-icon>
                {{chipText}}
            </v-chip>

            
            <v-switch
                v-if="switchBtn"
                inset
                color="info"
            >
            </v-switch>
        </v-list-item>
    </v-card>
 
 </template>



<script>
    // import $ from 'jquery'

    // Components
    export default {
        name: 'card-btn-menu-comp',
        data() {
            return {
            }
        },
        props: {
            prependIcon: {
                type: String,
                default: "mdi-car",
            },
            text: {
                type: String,
                default: "Text",
            },
            chip: {
                type: Boolean,
                default: true,
            },
            switchBtn: {
                type: Boolean,
                default: false,
            },
            chipIcon: {
                type: String,
                default: "mdi-chevron-right",
            },
            chipText: {
                type: String,
                default: "",
            },
            classConfig: {
                type:Array,
                default: ()=>([]),
            }, 
            prependIconColor: {
                type: String,
                default: "gray",
            },
            fun: {
                type: Function,
                default: () => (null),
            }
        },
        mounted (){
            
        },
        methods: {
            invokFun(){
                this.fun();
            },
        },
    };
</script>

