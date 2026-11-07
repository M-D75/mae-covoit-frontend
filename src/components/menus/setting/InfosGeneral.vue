

<!-- scoped -->
<style lang="scss" scoped>
    .group-card-comp {
        width: 82.5%;
        margin-top: 15px;
        .title{
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            color: var(--font-color-label);
        }

        .text {
            font-size: 14px;
            font-weight:lighter;
            color: gray;
            text-align: justify;
            white-space: pre-line;
        }

        .v-btn{
            margin-top: 20px;
            font-size: 16px;
            color: var(--font-color-label);
        }
    }

</style>


<!--  -->
<template>

    <div class="group-card-comp mx-auto">
        <div class="title ">{{ title }}</div>
        <br>
        <div class="text">{{ text }}</div>
        <v-btn v-if="mode==='infos-general'" variant="text" block @click="replayHelp">Revoir l’aide</v-btn>
        <v-btn v-if="mode==='infos-general'" variant="text" block @click="showVersion">Version de Covia et mises à jour</v-btn>

        <v-btn
            v-if="mode=='infos-general' && !cguAccepted"
            class="text-none"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
            @click="SET_CGU_ACCEPTED(true)"
        >
            J'accepte
        </v-btn>

        <v-btn
            v-if="mode=='infos-general' && cguAccepted"
            class="text-none"
            rounded="xl" 
            size="x-large"
            variant="plain"
            block
        >
            Approuvé
            <template v-slot:append>
                <v-icon class="zoom-bounce" color="success" icon="mdi-check-bold"></v-icon>
            </template>
        </v-btn>

        <div v-if="mode === 'data-protection'" class="mt-4">
            <p v-if="privacyContactEmail">Contact : <a :href="'mailto:' + privacyContactEmail">{{ privacyContactEmail }}</a></p>
            <p><a href="/privacy.html" target="_blank" rel="noopener">Politique de confidentialité</a></p>
            <p><a href="/account-deletion.html" target="_blank" rel="noopener">Demander la suppression de mes données</a></p>
            <p v-if="showDeleteError && privacyContactEmail">
                <a :href="deletionRequestUrl">Demander un traitement manuel de la suppression</a>
            </p>
        </div>

        <v-btn
            v-if="mode=='data-protection'"
            class="text-none"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
            @click="callDeleteAccount()"
        >
            Supprimer mon compte
        </v-btn>
    </div>

    <!-- confirm choice -->
    <BottomMenu
        :class-name="['confirm-choice-class']"
        mode="confirm-choice"
        labelSelectorN1="Souhaitez vous réelement supprimer votre compte ?"
        ref="BottomMenuRefConfirmChoice"
        v-on:close="overlay = false"
        v-on:yes="overlay = false; console.log('yes'); deleteAccount();"
        v-on:no="overlay = false; console.log('no'); $refs.BottomMenuRefConfirmChoice.close()"
        />

    <v-snackbar
        v-model="showDeleteError"
        :timeout="5000"
        color="error"
    >
        {{ deleteError }}
    </v-snackbar>

    <v-snackbar
        v-model="showDeleteWarning"
        :timeout="5000"
        color="warning"
    >
        {{ deleteWarning }}
    </v-snackbar>
 </template>



<script>
    import { mapMutations, mapState, mapActions } from 'vuex';


    // Components
    import BottomMenu from '@/components/menus/BottomMenu.vue';
    import {requestContextHelp} from '@/services/contextualHelp.js';
    import { privacyContactEmail } from '@/services/privacyPolicy.js';

    export default {
        name: "infos-general-comp",
        computed: {
            ...mapState("profil", ['cguAccepted']),
            deletionRequestUrl(){
                return `mailto:${privacyContactEmail}?subject=${encodeURIComponent('Covia — demande de suppression de compte')}`;
            },
        },
        components: {
            BottomMenu,
        },
        props: {
            mode: {
                type: String,
                default: "infos-general",
            },
            title: {
                type: String,
                default: "Title",
            },
            text: {
                type: String,
                default: "text",
            },
        },
        data() {
            return {
                privacyContactEmail,
                deleteOwner:null,deleteBusy:false,deleteDisposed:false,deleteEpoch:0,deleteTimer:null,
                showDeleteError: false,
                deleteError: "",
                showDeleteWarning: false,
                deleteWarning: "",
            };
        },
        beforeUnmount(){this.deleteDisposed=true;this.deleteEpoch++;clearTimeout(this.deleteTimer);},
        mounted() {
        },
        watch:{
            '$store.state.profil.userUid'(){this.resetDeletion();},
            '$store.state.profil.accountGeneration'(){this.resetDeletion();},
        },
        methods: {
            replayHelp(){requestContextHelp(this.$store.state.profil.userUid,'choose',{replay:true});},
            showVersion(){window.dispatchEvent(new CustomEvent('covia-show-version'));},
            ...mapMutations("profil", ["SET_CGU_ACCEPTED"]),
            ...mapActions("auth", ["removeAccount"]),
            resetDeletion(){
                this.deleteEpoch++;this.deleteOwner=null;this.deleteBusy=false;
                clearTimeout(this.deleteTimer);this.deleteTimer=null;
                const sheet=this.$refs.BottomMenuRefConfirmChoice;
                if(sheet){sheet.loadingBtn=false;sheet.close();}
            },
            callDeleteAccount(){
                if(this.deleteBusy)return;
                const profile=this.$store.state.profil;
                if(!profile.userUid)return;
                this.deleteOwner={uid:profile.userUid,generation:profile.accountGeneration};
                this.showDeleteError=false;this.showDeleteWarning=false;
                this.$refs.BottomMenuRefConfirmChoice.open();
            },
            async deleteAccount(){
                if(this.deleteBusy || this.deleteDisposed)return;
                const owner=this.deleteOwner, profile=this.$store.state.profil;
                if(!owner || profile.userUid!==owner.uid || profile.accountGeneration!==owner.generation){this.resetDeletion();return;}
                const epoch=++this.deleteEpoch, sheet=this.$refs.BottomMenuRefConfirmChoice;
                let result;
                const current=()=>!this.deleteDisposed && this.deleteEpoch===epoch && this.$refs.BottomMenuRefConfirmChoice===sheet
                    && ((this.$store.state.profil.userUid===owner.uid && this.$store.state.profil.accountGeneration===owner.generation)
                        || (result?.status===0 && result.deletedUserId===owner.uid && !this.$store.state.profil.userUid
                            && this.$store.state.profil.accountGeneration===result.sessionGeneration));
                this.deleteBusy=true;sheet.loadingBtn=true;
                try{
                    result=await this.removeAccount({expectedUserId:owner.uid,accountGeneration:owner.generation});
                    if(!current() || result?.stale)return;
                    if(result?.status!==0){this.deleteError=result?.message || "La suppression n'a pas pu être confirmée.";this.showDeleteError=true;return;}
                    sheet.close();
                    if(result.warnings?.length){
                        this.deleteWarning=result.warnings.join(' ');this.showDeleteWarning=true;
                        this.deleteTimer=setTimeout(()=>{if(current())this.$router.replace('/login');},5000);
                    }else this.$router.replace('/login');
                }catch(error){if(current()){this.deleteError=error.message || "La suppression n'a pas pu être confirmée.";this.showDeleteError=true;}}
                finally{if(current()){this.deleteBusy=false;sheet.loadingBtn=false;}}
            }

        }
    };
</script>
