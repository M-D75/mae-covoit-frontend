<template>
    <v-dialog :model-value="Boolean(profileLookupError)" persistent max-width="420">
        <v-card rounded="xl" class="pa-5" :color="darkMode ? '#22252c' : '#ffffff'">
            <v-icon icon="mdi-cloud-alert-outline" color="primary" size="40" class="mb-4" />
            <h2 class="text-h6 mb-3">Votre profil est indisponible</h2>
            <p role="alert">La connexion n’a pas permis de charger votre profil. Réessayez dans un instant.</p>
            <v-btn color="primary" rounded="xl" class="mt-5" :loading="retrying" @click="retry">Réessayer</v-btn>
        </v-card>
    </v-dialog>
</template>
<script>
import {mapState} from 'vuex';
export default {
    data:()=>({retrying:false}),
    computed:{...mapState('auth',['profileLookupError']),...mapState('profil',['darkMode'])},
    methods:{async retry(){
        if(this.retrying)return;
        const target=this.profileLookupError?.path||'/search';this.retrying=true;
        try{
            await this.$store.dispatch('auth/checkSession');
            if(this.$store.state.auth.profileLookupError)return;
            await this.$router.replace(target);
        }catch{this.$store.commit('auth/SET_PROFILE_LOOKUP_ERROR',{path:target});}
        finally{this.retrying=false;}
    }},
};
</script>
