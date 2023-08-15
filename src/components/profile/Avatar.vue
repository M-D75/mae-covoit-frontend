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
            <v-icon v-if="modeEdit">
                mdi-camera-plus
            </v-icon>
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
    import { mapState } from 'vuex';

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
            avatarTouchedEmit(){
                this.$emit("avatar-touched");
            },
        }
    });
</script>
