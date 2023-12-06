<!-- scss -->
<style lang="scss" model>
    //Animations
    .zoom-bounce {
        animation: zoomBounce 0.7s ease-out;
    }

    @keyframes zoomBounce {
        0% {
            transform: scale(0);
        }
        50% {
            transform: scale(1.2);
        }
        70% {
            transform: scale(0.9);
        }
        100% {
            transform: scale(1);
        }
    }
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
            max-width: 70%;
        }
        .sub-title{
            font-size: 12px;
            font-weight: bold;
            color: var(--font-color-label);
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
                <v-icon class="picture" v-if="modeEdit" @click="triggerFileInput">
                    mdi-camera-plus
                </v-icon>

                <!-- File input (caché) -->
                <input type="file" ref="fileInput" accept="image/png, image/jpeg" style="display: none" @change="handleFileChange" />

                
            </v-avatar>

            <v-icon
                v-if="!modeEdit"
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

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapMutations } from 'vuex';

    // Components
    // ...

    export default defineComponent({
        name: 'avatar-profil-comp',
        computed: {
        },
        components: {
        },
        props: {
            avatar: {
                type: String,
                default: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned",
            },
            name: {
                type: String,
                default: "Dr. Mourdas",
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
        },
        data() {
            return {
                
            }
        },
        methods: {
            ...mapMutations("profil", ["SET_AVATAR_URL"]),
            avatarTouchedEmit(){
                this.$emit("avatar-touched");
            },
            triggerFileInput() {
                // Active le clic sur l'input de type file
                this.$refs.fileInput.click();
            },
            handleFileChange(event) {
                // Affiche l'image sélectionnée
                const file = event.target.files[0];
                if (file) {
                    // type de fichier
                    const validTypes = ['image/jpeg', 'image/png'];
                    if ( ! validTypes.includes(file.type) ) {
                        alert("Ce type de fichier n'est pas pris en charge.");
                        return;
                    }

                    console.log("size-file", file.size);

                    // taille de l'image 
                    const maxSizeInBytes = 3e6; // 3 Megabytes
                    if (file.size > maxSizeInBytes) {
                        alert("Oups ! Cette image dépasse la taille maximale autorisée. Veuillez choisir une image plus légère.");
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.SET_AVATAR_URL(e.target.result);
                        this.$router.replace("/cropper");
                    };
                    reader.readAsDataURL(file);
                }
            },
        }
    });
</script>
