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
    .main {
        height: 100%;
        margin-top: 100px;
        margin-bottom: 50px;
    }

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
                display: grid;
                align-items: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                margin: auto;
                height: 100%;
            }
            .v-btn {
                width: 103px;
                font-size: 14px;
                height: 32px;
            }
        }
    }

    

</style>
   
<!--  -->
<template>

    <ToolbarProfil :title="'Parametres'"/>
    <div class="main">
        <!--  -->
        <div v-if="mode=='setting'">
            <GroupCard class="grouP" :groupeParameters="groupeParameters" />
            <div class="ctn sub-part">
                <div class="label text-subtitle">Invite Link</div>
                <v-card
                    class="invite-card mx-auto flex"
                    dark
                >
                    <v-row>
                        <v-col class="text">
                            <div 
                                class="text"
                            >Invite people</div>
                        </v-col>
                        <v-col class="btn">
                            <v-btn
                                class="text-none"
                                rounded="xl" 
                                size="large"
                                color="blue"
                            >
                                Invite
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
                    @click="signOut()"
                >
                    Deconnexion
                </v-btn>
            </div>
        </div>

        <div v-if="mode=='infos'">
            <GroupInput :group-input="groupInput"/>
        </div>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { getAuth, signOut } from "firebase/auth";

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import GroupInput from '@/components/menus/setting/GroupInput.vue';
    import { mapState } from 'vuex';

    export default defineComponent({
        name: 'setting-view',

        components: {
            ToolbarProfil,
            GroupCard,
            GroupInput,
        },
        computed: {
            ...mapState(['profil']),
        },
        data() {
            return {
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
                            },
                            {
                                prependIcon: null,
                                text:"Informations personelles",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                                fun: this.goToInfo,
                            },
                        ],
                    },
                    {
                        label: "payements",
                        parameters: [
                            {
                                prependIcon: null,
                                text:"Virements",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                            },
                            {
                                prependIcon: null,
                                text:"Remboursement",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                            },
                            {
                                prependIcon: null,
                                text:"Virements",
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
                            },
                            {
                                prependIcon: null,
                                text:"Protection des données",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",
                            },
                        ],
                    },
                ],
                groupInput: [],
            }
        },
        methods: {
            signOut() {
                const auth = getAuth();
                signOut(auth).then(() => {
                    // Sign-out successful.
                }).catch((error) => {
                    // An error happened.
                    console.log(error)
                });
            },
            goToInfo(){
                console.log("goToINfo");
                this.mode="infos";
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
        }
    });
</script>
