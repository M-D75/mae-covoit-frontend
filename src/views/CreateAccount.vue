
<style lang="scss" model>

    .v-card.create-account {
        .v-input {
            margin: 0;
            .v-input__control{
                width: 100% !important;
                margin-left: inherit !important;
                margin: auto !important;
            }
        }
    }

</style>

<!-- scoped -->
<style lang="scss" scoped>
    .v-card {
        background-color: #f5f5f5;
        height: 90vh;
        .v-card-subtitle{
            white-space: inherit;
        }

        .v-input .v-input__control{
            margin-left: inherit !important;
            margin: auto !important;
        }

        .contain-input{
            margin: 5px 0;
            .label {
                margin-top: 14px;
                font-size: 14px;
                text-transform: capitalize;
                color: #1E1F26;
            }
            .v-field{
                box-shadow: none;
            }
            .v-text-field {
                font-size: 16px;
                height: 50px;
                .v-field__input {
                    color: #1E1F26;
                }
            }
        }
    }

</style>


<!--  -->
<template>
  
    <v-main >

        <v-dialog
            v-model="dialog"
            persistent
        >
            <v-card class="create-account">
                <v-toolbar color="gray" title="Qui êtes vous ?"></v-toolbar>
                <v-card-subtitle>
                    Veuillez compléter les informations ci-dessous pour procéder.
                </v-card-subtitle>
                <v-form @submit.prevent>
                    <v-container>
                        <v-row>
                            <v-col>
                                <div 
                                    class="contain-input"
                                >
                                    <!-- <div class="label text-subtitle">Nom</div> -->
                                    <v-text-field 
                                        v-model="name" 
                                        label="Nom"
                                        variant="solo"
                                        :rules="rules"
                                        :persistent-placeholder="false"
                                        :persistent-hint="false"
                                        @input="name = keepLetterValue($event)"
                                    ></v-text-field>
                                </div>
                            </v-col>
                                
                            <!-- </div> -->
                        </v-row>

                        <v-row>
                            <v-col>
                                <div 
                                    class="contain-input"
                                >
                                    <v-text-field 
                                        v-model="firstname" 
                                        label="Prénom"
                                        variant="solo"
                                        :rules="rules"
                                        :persistent-placeholder="false"
                                        :persistent-hint="false"
                                        @input="firstname = keepLetterValue($event)"
                                    ></v-text-field>
                                </div>
                            </v-col>
                        </v-row>

                        <v-row>
                            <v-col>
                                <div 
                                    class="contain-input"
                                >
                                    <v-select
                                        v-model="village"
                                        label="Village"
                                        :items="listVillages"
                                        :persistent-placeholder="false"
                                        variant="solo"
                                    ></v-select>
                                </div>

                            </v-col>
                        </v-row>

                        <v-row>
                            <v-col>
                                <div 
                                    class="contain-input"
                                >
                                <v-btn 
                                    variant="plain"
                                    block 
                                    rounded="xl" 
                                    type="submit" 
                                    @click="tryCreateAccount()" 
                                    size="large"
                                >
                                    Valider
                                </v-btn>
                                </div>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-form>

            </v-card>
        </v-dialog>

    </v-main>

    <!-- Load -->
    <v-overlay
        :model-value="overlayLoad"
        class="align-center justify-center"
    >
        <v-progress-circular
            color="black"
            indeterminate
            size="64"
        ></v-progress-circular>
    </v-overlay>

    <!-- message error -->
    <v-snackbar
        class="error-snackbar"
        v-model="showSnakBarInfo.showError"
        :timeout="4000"
        color="error"
    >
        <div class="contain-ico">
            <v-icon icon="mdi-alert-circle"></v-icon> 
        </div>
        <div>
            <span>{{ showSnakBarInfo.messageError }}</span>
        </div>
    </v-snackbar>

</template>


<!--  -->
<script>
    import { mapActions, mapState } from 'vuex'
    import { keepLetter } from '@/utils/utils.js';

    // Components

    export default {
        name: 'create-account-view',
        computed: {
            ...mapState("auth", ["account_created"]),
            ...mapState("search", ['villages']),
            listVillages(){
                return this.villages.map((village) => village.village);
            }
        },
        data() {
            return {
                overlayLoad: true,
                dialog: false,
                // user interact
                name: "",
                firstname: "",
                village: "",
                // cond
                rules: [
                    value => {
                        if (value) return true

                        return 'Veuillez remplir ce champ'
                    },
                ],
                showSnakBarInfo: {
                    showError: false,
                    messageError: "",
                },
            }
        },
        methods: {
            ...mapActions("auth", ["createAccount"]),
            ...mapActions("search", ['getVillages']),
            async tryCreateAccount(){
                if( this.firstname != "" && this.name != "" ){
                    const res = await this.createAccount({name: this.name, firstname: this.firstname, village: this.village});
                    if( res.status == 0 && this.account_created ){
                        this.$router.replace("/search");
                    }
                    else{
                        this.showSnakBarInfo.messageError = res.message;
                        this.showSnakBarInfo.showError = true;
                    }
                }
            },
            keepLetterValue(event){
                event.target.value = keepLetter(event.target.value);
                return event.target.value;
            },
        },
        async mounted() {
            await this.getVillages();
            this.overlayLoad = false;
            this.dialog = true;
        },
    }
</script>
