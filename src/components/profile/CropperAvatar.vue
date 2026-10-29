<style lang="scss" model>
    .background-crop{
        position: absolute;
        background-color: black;
        margin: auto;
        height: 100%;
        width: 100%;
    }

    .cropper{
        position: fixed;
        top: 50%;
        transform: translateY(-50%); 
    }

    .v-btn.btn-crop {
        position: absolute;
        bottom: calc(20px + var(--safe-bottom, 0px));
        right: 20px;
    }

    .preview {
        border: dashed 2px rgba(255,255,255, 0.25);
    }
</style>

<template>
    <div class="background-crop">
    </div>

    <Cropper
        class="cropper"
        ref="cropper"
        :stencil-component="$options.components.CircleStencil"
        :src="img"
        @error="photoLoadError"
        :stencil-props="{
            previewClass: 'preview',
        }"
    />

    <v-btn
        class="btn-crop"
        color="blue"
        icon="mdi-check-bold"
        aria-label="Enregistrer la photo recadrée"
        :disabled="overlayLoad"
        @click="crop()"
    />

    <v-btn style="position:absolute;bottom:20px;left:20px" :disabled="overlayLoad" @click="cancel">Annuler</v-btn>
    <CircleStencil v-if="false"/>

    <!-- Load -->
    <v-overlay
        style="z-index: 9999;"
        :model-value="overlayLoad"
        disabled
        class="align-center justify-center"
    >
        <v-progress-circular
            color="white"
            indeterminate
            size="64"
        ></v-progress-circular>
    </v-overlay>


    <!-- message error -->
    <v-snackbar
        v-model="showSnackbarError"
        :timeout="4000"
        color="error"
        style="z-index: 99999;"
    >
        <div class="contain-ico">
            <v-icon icon="mdi-alert-circle"></v-icon> 
        </div>
        <div>
            <span>{{ messageSnackbarError }}</span>
        </div>
    </v-snackbar>
    
</template>

<script>
    import { defineComponent } from 'vue';
    import { CircleStencil, Cropper } from 'vue-advanced-cropper';
    import 'vue-advanced-cropper/dist/style.css';
    import {croppedProfilePhoto} from '@/services/profilePhoto.js';
    import { mapState, mapMutations, mapActions } from 'vuex';

    export default defineComponent({
        name: 'profil-view',
        computed:{
            ...mapState("profil", ["avatarDraft","userUid"]),
        },
        components: {
            Cropper,
            CircleStencil,
        },
        data() {
            return {
                image: null,
                img: '',
                showSnackbarError:false,messageSnackbarError:'',
                coordinates: {
                    width: 0,
                    height: 0,
                    left: 0,
                    top: 0,
                },
                overlayLoad: false,
                showSnackbar: {
                    showError: false,
                    messageError: "",
                },
            };
        },
        beforeMount(){if(this.avatarDraft?.owner===this.userUid)this.img=this.avatarDraft.dataUrl;else this.$router.replace('/profil/perso');},
        methods: {
            ...mapMutations("profil", ["SET_AVATAR_DRAFT"]),
            ...mapActions("profil", ["updateAvatar"]),
            photoLoadError(){this.messageSnackbarError='Cette photo ne peut pas être affichée. Choisissez une autre image.';this.showSnackbarError=true;},
            cancel(){this.SET_AVATAR_DRAFT(null);this.$router.replace('/profil/perso');},
            async crop() {
                if(this.overlayLoad)return;const owner=this.userUid;this.overlayLoad=true;
                try{
                    if(this.avatarDraft?.owner!==owner)throw new Error('Sélectionnez de nouveau votre photo.');
                    const {canvas}=this.$refs.cropper.getResult();const image=croppedProfilePhoto(canvas);
                    await this.updateAvatar(image);if(this.userUid===owner)this.$router.replace('/profil/perso');
                }catch(error){this.messageSnackbarError=error.message||'La photo ne peut pas être enregistrée.';this.showSnackbarError=true;}
                finally{this.overlayLoad=false;}
            },
        },
    });
</script>
