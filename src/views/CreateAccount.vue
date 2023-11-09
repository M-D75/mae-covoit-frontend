
<style lang="scss" model>

    .v-card{

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
    .v-card{
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
                // background-color: #FBFBFB;
                // border-radius: 10px;
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
            width="1024"
        >
            <v-card>
                <v-toolbar color="gray" title="Infos"></v-toolbar>
                <v-card-subtitle>
                    Entrez les informations suivantes pour continuer
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
                                        :rules="rules"
                                        label="Nom"
                                        variant="solo"
                                        :persistent-placeholder="false"
                                        :persistent-hint="false"
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
                                        label="Prenom"
                                        :rules="rules"
                                        variant="solo"
                                        :persistent-placeholder="false"
                                        :persistent-hint="false"
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

</template>


<!--  -->
<script>
    import { mapActions, mapState } from 'vuex'


    // Components

    export default {
        name: 'create-account-view',
        computed: {
            ...mapState("auth", ["logged_in", "account_created"]),
            ...mapActions("auth", ["checkSession", "createAccount"]),
            ...mapState("search", ['villages', 'depart', 'destination', 'nbPassenger']),
            ...mapActions("search", ['getVillages']),
            listVillages(){
                return this.villages.map((village) => village.village);
            }
        },
        data() {
            return {
                overlayLoad: true,
                dialog: false,
                name: "",
                firstname: "",
                village: "",
                rules: [
                    value => {
                        if (value) return true

                        return 'Veuillez remplir ce champ'
                    },
                ],
            }
        },
        methods: {
            async waitGettingvillage(){
                await this.getVillages;
                this.overlayLoad = false;
                this.dialog = true;
            },
            async tryCreateAccount(){
                if(this.firstname != "" && this.name != ""){
                    await this.$store.dispatch("auth/createAccount", {name: this.name, firstname: this.firstname, village: this.village});
                    if( this.account_created ){
                        this.$router.replace("/search");
                    }
                }
            }
        },
        mounted() {
            this.waitGettingvillage();
        },
    }
</script>
