

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
 </template>



<script>
    import { mapMutations, mapState, mapActions } from 'vuex';


    // Components
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default {
        name: "infos-general-comp",
        computed: {
            ...mapState("profil", ['cguAccepted']),
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
            };
        },
        mounted() {
        },
        methods: {
            ...mapMutations("profil", ["SET_CGU_ACCEPTED"]),
            ...mapActions("profil", ["removeAccount", "logout"]),
            callDeleteAccount(){
                this.$refs.BottomMenuRefConfirmChoice.open();
            },
            async deleteAccount(){
                this.$refs.BottomMenuRefConfirmChoice.loadingBtn = true;
                await this.removeAccount();
                this.$refs.BottomMenuRefConfirmChoice.loadingBtn = false;
                this.$refs.BottomMenuRefConfirmChoice.close();
                setTimeout(function(){
                    this.logout();
                }.bind(this), 2000);
            }
        }
    };
</script>

