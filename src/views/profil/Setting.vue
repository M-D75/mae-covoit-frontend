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
        .sub-main{
            display: inherit;
            width: 100%;
        }

        .sub-main.and{
            position: relative;
            left: 0;
            display: flex;
            width: 200%;
            .menu-setting{
                width: 50%;
            }
            .other-mode{
                width: 50%;
            }
        }

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

        @keyframes swipeRightToLeft {
            from {
                left: 0;
            }
            to {
                left: -100%;
            }
        }

        @keyframes swipeToToRight {
            from {
                left: -100%;
            }
            to {
                left: 0%;
            }
        }

        .swipe {
            position: relative;
            animation: swipeRightToLeft 0.1s linear forwards;
        }

        .swipeR {
            position: relative;
            animation: swipeToToRight 0.1s linear forwards;
        }
    }
</style>
   
<!--  -->
<template>

    <ToolbarProfil ref="ToolbarProfilRef" :title="'Paramètres'" v-on:back="backToolbar()"/>

    <!-- overlay -->
    <v-overlay 
        v-model="overlay" 
        contained
        persistent
        style="z-index: 9999;"
        @click="close()"
    ></v-overlay>

    <v-main class="main">
        <div class="sub-main and">
            <!--  -->
            <div v-if="mode=='setting' || true"
                class="menu-setting"
            >
                <!-- btns setting -->
                <GroupCard class="grouP" :groupeParameters="groupeParameters" />

                <!-- btn share friend -->
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
                                    @click="copyAndShare()"
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

            <!-- champ input d'information personnel -->
            <div 
                v-if="mode=='infos' "
                class="other-mode"
            >
                <GroupInput :group-input="groupInput"/>
            </div>

            <div 
                v-if="mode=='infos-general'"
                class="other-mode"
            >
                <InfosGeneral :title="cgu.title" :text="cgu.text"/>
            </div>

            <div 
                v-if="mode=='data-protection'"
                class="other-mode"
            >
                <InfosGeneral :mode="mode" :title="dataProtection.title" :text="dataProtection.text"/>
            </div>

            <SelectVirement 
                v-if="mode=='virement' || mode=='setting'"
                class="other-mode"
            />
        </div>

        <!-- message -->
        <v-snackbar
            v-model="showSnackbar"
            :timeout="4000"
        >
            <v-icon icon="$success"></v-icon> <span>{{ messageSnackbar }}</span>
        </v-snackbar>
        
    </v-main>

    <BottomMenu 
        mode="password"
        ref="BottomMenuRefPassword" 
        v-on:close="overlay = false"
    />
</template>



<!--  -->
<script>
    import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { inject } from 'vue';
    import { Clipboard } from '@capacitor/clipboard';
    import { Share } from '@capacitor/share';
    import { Capacitor } from '@capacitor/core';

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';

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
            ...mapState("auth", ['provider']),
            ...mapMutations("auth", ["CLEAR_TOKEN"]),
            ...mapActions("auth", ["logout"]),
        },
        data() {
            return {
                supabase: inject('supabase'),
                mode: "setting",
                groupeParameters: [],
                groupInput: [],
                cguL: {
                    title: "",
                    text: "",
                },
                overlay: false,
                bottomOpened: "",
                showSnackbar: false,
                messageSnackbar: "",
            }
        },
        created() {
            this.initializeGroupeParameters();
        },
        methods: {
            initializeGroupeParameters() {
                this.groupeParameters = [
                    {
                        label: "coordonnes",
                        parameters: [
                            {
                                none: this.provider == "email",
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
                ];
            },
            async signOutSupabase(){
                this.logout;
            },
            async inviteUserSupabase(){
                let { data, error } = await this.supabase.auth.api.inviteUserByEmail('someone@email.com');

                if (error) {
                    console.error('Erreur lors du partage:', error.message);
                    return;
                }

                console.log("Invitation réussi", data);
            },
            goToInfo(mode){
                console.log("goToINfo", mode);
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
            backToolbar(){
                if( this.mode == 'setting' ){
                    this.$router.back();
                }
                else { 
                    // $('.sub-main.and').animate({left: "0%" }, 1000, function() {
                    //     this.mode = 'setting';
                    //     console.log("Animation terminée!");
                    // }.bind(thi-s));
                    $('.sub-main').removeClass("swipe");
                    $('.sub-main').addClass("swipeR");
                    setTimeout(function(){
                        this.mode = 'setting';
                    }.bind(this), 100)
                    
                }
            },
            async copyToClipboard(text) {
                await Clipboard.write({
                    string: text,
                });
            },
            async shareContent() {
                await Share.share({
                    title: 'Partagez ce lien',
                    text: 'Hey, test la nouvelle appli de covoiturage !',
                    url: 'https://tchap-tchap.yt',
                    dialogTitle: 'Partagez avec vos amis',
                });
            },
            async copyAndShare() {
                const text = 'https://tchap-tchap.yt'; // Le lien que vous voulez partager
                try {
                    //Copie dans le presse-papiers
                    if( ! isAndroid && ! isIOS ){
                        await this.copyToClipboard(text);
                        this.messageSnackbar = "lien copié !";
                        this.showSnackbar = true;
                    }

                    if( isAndroid || isIOS ){
                        // Ouvre la boîte de dialogue de partage natif
                        await this.shareContent();
                    }
                } catch (error) {
                    console.error('Nous avons rencontré un problème:', error);
                }
            },
        },
        mounted() {
            window.scrollTo(0, 0);

            this.groupInput = [
                {
                    id: "civilite",
                    typeInput: "select",
                    label: "Civilite",
                    value: this.profil.infos_perso.civilite,
                    items: ["Mr", "Mme", "Non binaire"],
                },
                {
                    id: "nom",
                    label: "Nom",
                    value: this.profil.infos_perso.nom,
                },
                {
                    id: "prenom",
                    label: "prénom",
                    value: this.profil.infos_perso.prenom,
                },
                {
                    id: "email",
                    label: "email",
                    value: this.profil.infos_perso.email,
                    disabled: true,
                },
                {
                    id: "tel",
                    label: "Téléphone",
                    value: this.profil.infos_perso.tel,
                },
                {
                    id: "principal",
                    label: "Adresse",
                    value: this.profil.infos_perso.adress.principal,
                },
                {
                    id: "complement",
                    label: "Complement",
                    value: this.profil.infos_perso.adress.complement,
                },
                {
                    id: "code_postal",
                    label: "Code Postal",
                    value: this.profil.infos_perso.adress.code_postal,
                },
                {
                    id: "commune",
                    label: "Commune",
                    value: this.profil.infos_perso.adress.commune,
                },
            ];

            this.cguL = {title: this.cgu.title, text: this.cgu.text}
        },
        watch: {
            mode(){
                if( this.mode != 'setting' ){
                    // $('.sub-main').addClass("and");
                    $('.sub-main').addClass("swipe");
                    $('.sub-main').removeClass("swipeR");
                }
                else{
                    // $('.sub-main').removeClass("and");
                    // $('.sub-main').removeClass("swipe");
                    // $('.sub-main').addClass("swipeR");
                }
            },
        },
    });
</script>
