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
        bottom: 20px;
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
        :stencil-props="{
            previewClass: 'preview',
        }"
    />
    <v-btn
        class="btn-crop"
        color="blue"
        icon="mdi-check-bold"
        @click="crop()"
    />

    <CircleStencil v-if="false"/>
    
</template>

<script>
    import { defineComponent } from 'vue';
    import { CircleStencil, Cropper } from 'vue-advanced-cropper';
    import 'vue-advanced-cropper/dist/style.css';
    import { mapState, mapMutations } from 'vuex';

    export default defineComponent({
        name: 'profil-view',
        computed:{
            ...mapState("profil", ["avatarUrl"]),
        },
        components: {
            Cropper,
            CircleStencil,
        },
        data() {
            return {
                image: null,
                img: 'https://images.unsplash.com/photo-1485178575877-1a13bf489dfe?ixlib=rb-1.2.1&auto=format&fit=crop&w=991&q=80',
                coordinates: {
                    width: 0,
                    height: 0,
                    left: 0,
                    top: 0,
                },
            };
        },
        beforeMount(){
            this.img = this.avatarUrl;
        },
        mounted(){
            this.img = this.avatarUrl;
            console.log("mount-cropper");
        },
        methods: {
            ...mapMutations("profil", ["SET_AVATAR_URL"]),
            crop() {
                const { coordinates, canvas } = this.$refs.cropper.getResult();
                this.coordinates = coordinates;
                console.log("coordinate", coordinates);
                try {
                    this.image = canvas.toDataURL();
                    this.SET_AVATAR_URL(this.image);
                    this.$router.replace("/profil");
                } catch (e) {
                    console.error('Erreur lors de la tentative de toDataURL', e);
                }
                
            },
        },
    });
</script>
