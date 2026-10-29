<!-- scss -->
<style lang="scss" model>
    
</style>


<style lang="scss" scoped>

    /* avatar */
    .avatar-comp {
        margin-top: 30px;
        .contain-avatar{
            width: fit-content;
            margin: auto;
            position: relative;
            // &.checked{
            //     border-radius: 500px;
            //     border: 2px solid #9fcb66;
            // }
            .v-avatar {
                cursor: pointer;
                .v-icon {
                    &.picture{
                        // display: none;
                        background-color: transparent;
                        position: absolute;
                        font-size: 3.97em;
                        color: white;
                        opacity: 0.7;
                    }
                }
            }

            .v-icon {
                &.badge-cerification{
                    font-size: 1.2em;
                    color: #9fcb66;
                    position: absolute;
                    bottom: -5px;
                    right: 1px;
                    border: 3px solid #9fcb66;
                    border-radius: 100px;
                    background: var(--bg-app-color);
                    padding: 13px;
                }
            }
        }
        .title {
            font-size: var(--font-size-h1) !important;
            font-weight: 500;
            margin: 10px auto 5px auto;
            color: var(--font-color-label);
            text-transform: capitalize;
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis;
            max-width: 80%;
        }
        .sub-title{
            font-size: 12px;
            font-weight: bold;
            color: var(--font-color-label);
            margin-bottom: 15px;
        }
    }

    

</style>
   
<!-- Avatar -->
<template>

    <div
        class="avatar-comp text-center"
    >
        <div class="contain-avatar" :class="{checked: !modeEdit}">
            <v-avatar 
                size="108"
                @click="avatarTouchedEmit()"
            >
                <v-img
                    alt="Avatar"
                    :src="avatar"
                ></v-img>
                <v-icon class="picture" v-if="modeEdit" role="button" tabindex="0" aria-label="Changer la photo de profil" @click.stop="triggerFileInput" @keydown.enter.prevent="triggerFileInput" @keydown.space.prevent="triggerFileInput">
                    mdi-camera-plus
                </v-icon>

                <!-- File input (caché) -->
                <input type="file" ref="fileInput" accept="image/png, image/jpeg" style="display: none" @change="handleFileChange" />

                
            </v-avatar>

            <v-icon
                v-if="!modeEdit && identity"
                class="badge-cerification zoom-bounce"
            >
                mdi-shield-check
            </v-icon>
        </div>

        <div
            class="title text-center mx-auto"
        >{{ name }}</div>

        <div
            v-if="subTitle != '' && subTitle != null"
            class="sub-title text-center mx-auto"
        >
            <v-icon>{{ icon }}</v-icon>{{ subTitle }}
        </div>
    </div>
    <v-snackbar v-model="showPhotoError" color="error" role="alert">{{ photoError }}</v-snackbar>

</template>



<!--  -->
<script>    
    import { defineComponent } from 'vue';
    import { mapMutations,mapState } from 'vuex';
    import {readProfilePhoto} from '@/services/profilePhoto.js';
    

    // Components
    // ...

    export default defineComponent({
        name: 'avatar-profil-comp',
        computed: {...mapState('profil',['userUid'])},
        components: {
        },
        props: {
            avatar: {
                type: String,
                default: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned",
            },
            name: {
                type: String,
                default: "User Name",
            },
            subTitle: {
                type: String,
                default: "",
            },
            icon: {
                type: String,
                default: "mdi-map-marker-radius",
            },
            modeEdit: {
                type: Boolean,
                default: true,
            },
            identity: {
                type: Boolean,
                default: false,
            }
        },
        data() {
            return {
                showPhotoError:false,photoError:'',
            }
        },
        methods: {
            ...mapMutations("profil", ["SET_AVATAR_DRAFT"]),
            avatarTouchedEmit(){
                this.$emit("avatar-touched");
            },
            triggerFileInput() {
                // Active le clic sur l'input de type file
                this.$refs.fileInput.click();
            },
            async handleFileChange(event) {
                const file=event.target.files?.[0];if(!file)return;
                const owner=this.userUid;
                try{const dataUrl=await readProfilePhoto(file);if(this.userUid!==owner)return;this.SET_AVATAR_DRAFT({owner,dataUrl});this.$router.push('/cropper');}
                catch(error){this.photoError=error.message;this.showPhotoError=true;}
                finally{event.target.value='';}
            },
        }
    });
</script>
