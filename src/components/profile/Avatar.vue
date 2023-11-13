<!-- scss -->
<style lang="scss" scoped>

    /* avatar */
    .avatar-comp {
        margin-top: 30px;
        .v-avatar {
            cursor: pointer;
            .v-icon {
                // display: none;
                background-color: transparent;
                position: absolute;
                font-size: 3.97em;
                color: white;
                opacity: 0.7;
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
        <v-avatar 
            size="108"
            @click="avatarTouchedEmit()"
            >
            <v-img
                alt="Avatar"
                :src="avatarUrl"
            ></v-img>
            <v-icon v-if="modeEdit" @click="triggerFileInput">
                mdi-camera-plus
            </v-icon>

            <!-- File input (caché) -->
            <input type="file" ref="fileInput" accept="image/png, image/jpeg" style="display: none" @change="handleFileChange" />
        </v-avatar>

        <div
            class="title text-center mx-auto"
        >{{ name }}</div>

        <div
            class="sub-title text-center mx-auto"
        >
            <v-icon>{{ icon }}</v-icon>{{ subTitle }}
        </div>
    </div>

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapMutations } from 'vuex';

    // Components
    // ...

    export default defineComponent({
        name: 'avatar-profil-comp',
        computed: {
            ...mapState('profil', ['avatarUrl']),
        },
        components: {
        },
        props: {
            name: {
                type: String,
                default: "Dr. Mourdas",
            },
            subTitle: {
                type: String,
                default: "NEW YORK",
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
