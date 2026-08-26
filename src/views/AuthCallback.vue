<template>
    <v-main class="auth-callback">
        <v-container class="fill-height d-flex align-center justify-center">
            <div class="text-center">
                <v-progress-circular
                    v-if="!errorMessage"
                    indeterminate
                    color="primary"
                    size="56"
                />
                <template v-else>
                    <v-alert type="error" variant="tonal" class="mb-4">
                        {{ errorMessage }}
                    </v-alert>
                    <v-btn color="primary" @click="$router.replace('/login')">
                        Revenir à la connexion
                    </v-btn>
                </template>
            </div>
        </v-container>
    </v-main>
</template>

<script>
import supabase from '@/utils/supabaseClient.js';
import { completeAuthCallback } from '@/services/authCallback.js';
import { resolvePostAuthPath } from '@/services/authProfile.js';

export default {
    name: 'auth-callback-view',
    data() {
        return {
            errorMessage: '',
        };
    },
    async mounted() {
        try {
            await completeAuthCallback(supabase, window.location.href);
            await this.$store.dispatch('auth/checkSession');
            await this.$router.replace(resolvePostAuthPath({
                authenticated: this.$store.state.auth.logged_in,
                hasAccount: this.$store.state.auth.account_created,
                requestedPath: this.$route.query.redirect,
            }));
        } catch (error) {
            console.error('[AuthCallback] OAuth return error:', error);
            this.errorMessage = "L'authentification n'a pas pu être terminée. Veuillez réessayer.";
        }
    },
};
</script>

<style scoped>
.auth-callback {
    min-height: 100vh;
}
</style>
