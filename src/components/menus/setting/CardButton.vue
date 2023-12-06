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
            max-width: 77%;
            white-space: inherit;
            &::first-letter{
                text-transform: capitalize;
            }
        }
        .v-list-item {
            .v-switch {
                .v-input__details {
                    display: none;
                }
            }
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
            // height: 56px;
            padding: 6px 1px;
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
                    margin: auto;
                    align-content: center;
                    .v-input__details {
                        display: none;
                    }
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
        >
            <v-list-item-title :style="{'max-width': ! chip && ! switchBtn ? '100%' : '77%'}" >{{ text }}</v-list-item-title>
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
                v-model="validation"
                @change="updateValidation()"
                color="info"
            />

            <!-- message error -->
            <v-snackbar
                v-if="switchBtn"
                v-model="showSnackbarError"
                :timeout="4000"
                color="error"
            >
                <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarError }}</span>
            </v-snackbar>
            
        </v-list-item>
    </v-card>

    
 
 </template>



<script>
    // import $ from 'jquery'
    import { mapState, mapMutations, mapActions } from 'vuex';

    // Components
    export default {
        name: 'card-btn-menu-comp',
        computed:{
            ...mapState("profil", ["auto_accept_trip"]),
        },
        data() {
            return {
                validation: false,
                showSnackbarError: false,
                messageSnackbarError: "",
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
                default: false,
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
            if( this.switchBtn )
                this.validation = this.auto_accept_trip;
        },
        methods: {
            ...mapMutations("profil", ["SET_AUTO_VALIDATION"]),
            ...mapActions("profil", ["updateAutoValidation"]),
            invokFun(){
                this.fun();
            },
            async updateValidation(){
                this.SET_AUTO_VALIDATION(this.validation);
                const response = await this.updateAutoValidation();
                if(response.status != 0){
                    this.messageSnackbarError = response.message;
                    this.showSnackbarError = true;
                }
            },
        },
        watch: {
            auto_accept_trip(){
                this.validation = this.auto_accept_trip;
            }
        }
    };
</script>

