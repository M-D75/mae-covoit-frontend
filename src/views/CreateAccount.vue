<style lang="scss">
    // Keep this onboarding screen white, including when the app uses dark mode.
    .v-main.profile-onboarding,
    .v-main.profile-onboarding * {
        --bg-app-color: #fff;
        --white-bg-color: #fff;
        --font-color-label: #1e1f26;
        --gray-icon-color: #64748b;
    }

    .v-card.create-account .v-input {
        height: auto;
        margin: 0;
        .v-input__control { width: 100% !important; margin: 0 !important; }
    }
</style>

<style lang="scss" scoped>
    .profile-onboarding {
        min-height: 100dvh;
        background: #fff;
        color: #1e1f26;
        padding-top: calc(32px + var(--safe-area-inset-top, 0px));
    }
    .onboarding-container {
        max-width: 520px;
        padding: 24px;
    }
    .create-account {
        background: #fff;
        overflow: visible;
    }
    .welcome-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        margin-bottom: 24px;
        border-radius: 18px;
        background: #edf8f7;
        color: #147d78;
    }
    h1 {
        position: static;
        transform: none;
        font-size: 28px;
        line-height: 1.25;
        font-weight: 700;
        letter-spacing: -0.5px;
        text-align: left;
        color: #1e1f26;
    }
    .intro {
        margin-top: 12px;
        margin-bottom: 32px;
        color: #64748b;
        font-size: 16px;
        line-height: 1.6;
    }
    .profile-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .continue-button {
        margin-top: 12px;
        font-weight: 600;
        letter-spacing: 0;
    }
    .profile-note {
        margin-top: 20px;
        color: #64748b;
        text-align: center;
        font-size: 13px;
        line-height: 1.5;
    }
</style>

<template>
    <v-main class="profile-onboarding">
        <v-container class="onboarding-container">
            <v-card class="create-account" theme="light" elevation="0" rounded="0">
                <div class="welcome-icon" aria-hidden="true">
                    <v-icon icon="mdi-account-outline" size="30" />
                </div>
                <h1>Qui êtes-vous ?</h1>
                <p class="intro">Bienvenue sur Covia ! Présentez-vous pour que les autres voyageurs puissent vous reconnaître.</p>

                <v-form class="profile-form" @submit.prevent="tryCreateAccount">
                    <v-text-field
                        v-model="name"
                        label="Nom"
                        autocomplete="family-name"
                        variant="outlined"
                        color="#147d78"
                        :rules="rules"
                        :disabled="submitting"
                    />
                    <v-text-field
                        v-model="firstname"
                        label="Prénom"
                        autocomplete="given-name"
                        variant="outlined"
                        color="#147d78"
                        :rules="rules"
                        :disabled="submitting"
                    />
                    <v-autocomplete
                        v-model="village"
                        label="Village (facultatif)"
                        :items="listVillages"
                        :custom-filter="filterVillage"
                        variant="outlined"
                        color="#147d78"
                        :disabled="submitting"
                        :menu-props="{ maxHeight: 280, theme: 'light' }"
                        clearable
                        hint="Tapez quelques lettres, puis choisissez votre village."
                        persistent-hint
                        no-data-text="Aucun village trouvé. Essayez une autre recherche."
                    />
                    <v-btn
                        class="continue-button text-none"
                        color="#147d78"
                        variant="flat"
                        block
                        rounded="xl"
                        type="submit"
                        :loading="submitting"
                        :disabled="submitting"
                        size="x-large"
                    >
                        Continuer
                        <template #append><v-icon icon="mdi-arrow-right" /></template>
                    </v-btn>
                </v-form>
                <p class="profile-note">Vous pourrez compléter vos informations depuis votre profil.</p>
            </v-card>
        </v-container>
    </v-main>

    <v-overlay :model-value="overlayLoad" class="align-center justify-center">
        <v-progress-circular color="#147d78" indeterminate size="48" />
    </v-overlay>
    <v-snackbar class="error-snackbar" v-model="showSnakBarInfo.showError" :timeout="5000" color="error">
        <div class="contain-ico"><v-icon icon="mdi-alert-circle" /></div>
        <div><span>{{ showSnakBarInfo.messageError }}</span></div>
    </v-snackbar>
</template>

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
            filterVillage(value, query) {
                const normalize = text => String(text || '')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLocaleLowerCase('fr')
                    .trim();
                return normalize(value).includes(normalize(query));
            },
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
                    const res = await this.createAccount({name, firstname, village: this.village || ''});
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
            }
        },
    }
</script>
