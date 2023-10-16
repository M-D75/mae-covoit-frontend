<style lang="scss" model>
    .v-btn.logout {
        font-size: 16px;
        color: var(--font-color-label);
        .v-btn__prepend i.v-icon{
            font-size: 21px !important;

        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-main {
        margin-bottom: 13px;
        .grouP {
            margin-top: 50px;
        }

        .ctn {
            margin: 10px auto 10px auto;
            width: 82.5% !important;
            .label {
                margin-top: 14px;
                margin-bottom: 5px;
                font-size: 14px;
                font-weight: bold;
                color: #616161;
            }
            .invite-card{
                //height: 58px;
                border-radius: 15px;
                padding: 10px 20px 10px 0px;
                background-color: #030303;
                .v-col {
                    &.text {
                        display: inline-grid;
                        align-items: center;
                    }
                    &.btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: flex-end;
                    }
                }
                div.text {
                    padding-left: 15px;
                    width: 150%;
                    display: grid;
                    align-items: center;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                    margin: auto;
                    height: 100%;
                }
                .v-btn {
                    
                    font-size: 14px;
                    height: 32px;
                }
            }
        }
    }
</style>
   
<!--  -->
<template>

    <ToolbarProfil ref="ToolbarProfilRef" :title="'Parametres'"/>

    <!-- overlay -->
    <v-overlay 
        v-model="overlay" 
        contained
        persistent
        style="z-index: 9999;"
        @click="close()"
    ></v-overlay>

    <v-main class="main">
        <!--  -->
        <div v-if="mode=='setting'">
            <GroupCard class="grouP" :groupeParameters="groupeParameters" />
            <div class="ctn sub-part">
                <!-- <div class="label text-subtitle">Invite Link</div> -->
                <v-card
                    class="invite-card mx-auto flex"
                    dark
                >
                    <v-row>
                        <v-col class="text">
                            <div 
                                class="text"
                            >Partager à un amie</div>
                        </v-col>
                        <v-col class="btn">
                            <v-btn
                                class="text-none"
                                rounded="xl" 
                                color="blue"
                                @click="inviteUserSupabase()"
                            >
                                <v-icon>mdi-share-variant</v-icon>
                            </v-btn>
                        </v-col>
                    </v-row>
                    
                </v-card>
            </div>
            <div class="ctn logout">
                <v-btn
                    class="logout mt-5 mx-auto text-none"
                    prepend-icon="mdi-logout"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="signOutSupabase()"
                >
                    Deconnexion
                </v-btn>
            </div>
        </div>

        <div v-if="mode=='infos'">
            <GroupInput :group-input="groupInput"/>
        </div>

        <div v-if="mode=='infos-general'">
            <InfosGeneral :title="cgu.title" :text="cgu.text"/>
        </div>

        <div v-if="mode=='data-protection'">
            <InfosGeneral :mode="mode" :title="dataProtection.title" :text="dataProtection.text"/>
        </div>

        <SelectVirement v-if="mode=='virement'"/>
        
    </v-main>

    <BottomMenu 
        mode="password"
        ref="BottomMenuRefPassword" 
        v-on:close="overlay = false"
    />
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { inject } from 'vue';

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import GroupInput from '@/components/menus/setting/GroupInput.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';
    import InfosGeneral from '@/components/menus/setting/InfosGeneral.vue';
    import SelectVirement from '@/components/menus/setting/SelectVirement.vue';

    import { mapActions, mapMutations, mapState } from 'vuex';

    export default defineComponent({
        name: 'setting-view',

        components: {
            ToolbarProfil,
            GroupCard,
            GroupInput,
            BottomMenu,
            InfosGeneral,
            SelectVirement,
        },
        computed: {
            ...mapState("profil", ['profil']),
            ...mapState("general", ['cgu', 'dataProtection']),
            ...mapMutations("auth", ["CLEAR_TOKEN"]),
            ...mapActions("auth", ["logout"]),
        },
        data() {
            return {
                supabase: inject('supabase'),
                mode: "setting",
                groupeParameters: [
                    {
                        label: "coordonnes",
                        parameters: [
                            {
                                prependIcon: null,
                                text:"Mots de passe",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                                fun: this.openBottomPassword,
                            },
                            {
                                prependIcon: null,
                                text:"Informations personelles",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                                fun: () => this.goToInfo('infos'),
                            },
                        ],
                    },
                    {
                        label: "payements",
                        parameters: [
                            {
                                prependIcon: null,
                                text:"Préference de virements",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                                fun: () => this.goToInfo('virement'),
                            },
                            {
                                prependIcon: null,
                                text:"Remboursement",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                            },
                        ],
                    },
                    {
                        label: "Mentions Legales",
                        parameters: [
                            {
                                prependIcon: null,
                                text:"Conditions génerales",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                                fun: () => this.goToInfo('infos-general'),
                            },
                            {
                                prependIcon: null,
                                text:"Protection des données",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                                fun: () => this.goToInfo('data-protection'),
                            },
                        ],
                    },
                ],
                groupInput: [],
                cguL: {
                    title: "",
                    text: "",
                },
                overlay: false,
                bottomOpened: "",
            }
        },
        methods: {
            async signOutSupabase(){
                this.logout;
            },
            async inviteUserSupabase(){
                let { data, error } = await this.supabase.auth.api.inviteUserByEmail('someone@email.com');

                if (error) {
                    console.error('Erreur lors de la deconnexion:', error.message);
                    return;
                }

                console.log("Invitation réussi", data);
            },
            goToInfo(mode){
                console.log("goToINfo");
                this.mode=mode;
                this.$refs.ToolbarProfilRef.needToComeBack = true;
            },
            openBottomPassword(){
                this.overlay = true;
                this.$refs.BottomMenuRefPassword.open();
                this.bottomOpened = "BottomMenuRefPassword";
            },
            close(){
                if( this.overlay ){
                    this.overlay = false;
                    if(this.$refs[this.bottomOpened]){
                        this.$refs[this.bottomOpened].close();
                    }
                }
            },
        },
        mounted() {
            window.scrollTo(0, 0);

            this.groupInput = [
                {
                    label: "Civilite",
                    value: this.profil.infos_perso.civilite,
                },
                {
                    label: "Nom",
                    value: this.profil.infos_perso.nom,
                },
                {
                    label: "prénom",
                    value: this.profil.infos_perso.prenom,
                },
                {
                    label: "email",
                    value: this.profil.infos_perso.email,
                },
                {
                    label: "Téléphone",
                    value: this.profil.infos_perso.tel,
                },
                {
                    label: "Adresse",
                    value: this.profil.infos_perso.adress.principal,
                },
                {
                    label: "Complement",
                    value: this.profil.infos_perso.adress.complement,
                },
                {
                    label: "Code Postal",
                    value: this.profil.infos_perso.adress.code_postal,
                },
                {
                    label: "Commune",
                    value: this.profil.infos_perso.adress.commune,
                },
            ];

            this.cguL = {title: this.cgu.title, text: this.cgu.text}
        }
    });
</script>
