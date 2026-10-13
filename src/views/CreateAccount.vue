
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
                <v-form @submit.prevent="tryCreateAccount">
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
                                    :loading="submitting"
                                    :disabled="submitting"
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
    import { resolvePostAuthPath } from '@/services/authProfile.js';

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
                submitting: false,
                // user interact
                name: "",
                firstname: "",
                village: "",
                // cond
                rules: [
                    value => {
                        if (value && value.trim()) return true

                        return 'Veuillez remplir ce champ'
                    },
                    value => !value || value.trim().length <= 100 || '100 caractères maximum',
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
                if (this.submitting) return;
                const name = this.name.trim();
                const firstname = this.firstname.trim();
                if (!name || !firstname || name.length > 100 || firstname.length > 100) {
                    this.showSnakBarInfo.messageError = 'Veuillez renseigner un nom et un prénom de 100 caractères maximum.';
                    this.showSnakBarInfo.showError = true;
                    return;
                }
                this.submitting = true;
                this.showSnakBarInfo.showError = false;
                try {
                    const res = await this.createAccount({name, firstname, village: this.village});
                    if( res.status == 0 && this.account_created ){
                        await this.$router.replace(resolvePostAuthPath({
                            authenticated: true,
                            hasAccount: true,
                            requestedPath: this.$route.query.redirect,
                        }));
                    }
                    else{
                        this.showSnakBarInfo.messageError = res.message;
                        this.showSnakBarInfo.showError = true;
                    }
                } catch (error) {
                    console.error('Profile completion failed:', error);
                    this.showSnakBarInfo.messageError = "La validation n'a pas pu être terminée. Veuillez réessayer.";
                    this.showSnakBarInfo.showError = true;
                } finally {
                    this.submitting = false;
                }
            },
        },
        async mounted() {
            try {
                if (await this.getVillages() === false) {
                    throw new Error('Villages unavailable');
                }
            } catch (error) {
                console.error('Village loading failed:', error);
                this.showSnakBarInfo.messageError = 'La liste des villages est indisponible. Vous pouvez compléter votre profil sans village.';
                this.showSnakBarInfo.showError = true;
            } finally {
                this.overlayLoad = false;
                this.dialog = true;
            }
        },
    }
</script>
