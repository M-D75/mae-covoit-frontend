
<style lang="scss">

    .ligth-mode * {
        --bg-app-color: #f5f5f5;
        --white-bg-color: #FBFBFB;
        --gray-bg-icon-color: #b1b1b1;
        --blue-color: #2E8DFF;
        --gray-icon-color: #B1B1B1;
        
        // font
        --font-color-label: #1E1F26;
        --font-size-h1: 24px;
        --font-size-h1-toolbar: 16px;
        --font-size-subtitle-toolbar: 8px;
        --box-shadow-card: 0px 2px 24px rgba(17,17,17,0.04);
        --box-shadow-card-v2: 0px 0px 16px rgba(17,17,17,0.16);
    }

    .dark-mode * {
        --bg-app-color: #1a1a1a;
        --white-bg-color: #333333;
        --gray-bg-icon-color:  #b1b1b1;
        --blue-color: #2E8DFF;
        --gray-icon-color: #B1B1B1;

        // font
        --font-color-label: #FBFBFB;
        --font-size-h1: 24px;
        --font-size-h1-toolbar: 16px;
        --font-size-subtitle-toolbar: 8px;
        --box-shadow-card: 0px 2px 24px #111;
        --box-shadow-card-v2: 0px 0px 16px #111;
    }

    * {
        font-family: 'Rubik';
        letter-spacing: 0;
    }

    .v-application.v-theme--light.v-layout.v-layout--full-height.v-locale--is-ltr {
        background-color: var(--bg-app-color);
        .v-application__wrap {
            background-color: var(--bg-app-color);
        }
    }
    .v-application.v-theme--dark.v-layout.v-layout--full-height.v-locale--is-ltr {
        background-color: #1a1a1a;
    }

    .text-fs26 {
        font-size: 26px !important;
    }

</style>

<template>
    <v-app class="ligth-mode">
        <v-main v-if="isMobileOrSmallScreen">
            <router-view/>
        </v-main>
        <MobileOnly v-else></MobileOnly>
    </v-app>
</template>

<script>

    import $ from 'jquery';
    import { inject } from 'vue';

    //Component
    import MobileOnly from './views/MobileOnly.vue';
    import { mapMutations, mapState } from 'vuex';

    export default {
        name: 'App',
        components: {
            MobileOnly,
        },
        computed: {
            ...mapState("profil", ["darkMode"]),
            isMobileOrSmallScreen() {
                return this.isMobile || this.isSmallScreen;
            },
        },
        data: () => ({
            supabase: inject('supabase'),
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isSmallScreen: window.innerWidth <= 600,
        }),
        mounted(){
            console.log("isMobile:", this.isMobile);
            console.log("isSmallScreen:", this.isSmallScreen);
            
            if( this.darkMode ){
                $("#app .v-application").removeClass("ligth-mode");
                $("#app .v-application").addClass("dark-mode");
            }

            console.log("theme-mode:", $("#app .v-application").hasClass("dark-mode") ? "dark" : "ligth");
            
            window.addEventListener('resize', this.updateIsSmallScreen); 
            
            //$("link[rel*='icon']").attr("href", "/favicon-old.ico");
        },
        methods: {
            ...mapMutations("profil", ["SET_DARKMODE"]),
            ...mapMutations("auth", ["SET_TOKEN"]),
            updateIsSmallScreen() {
                this.isSmallScreen = window.innerWidth <= 600;
            },
            async getUser(){
                let { data, error } = await this.supabase.auth.getSession()

                console.log("session:", data, error, data.session.access_token);

                const date = new Date(data.session.expires_at * 1000); // Multiplié par 1000 pour le convertir en millisecondes
                console.log(date.toISOString('fr-FR'));

                const dateToday = new Date();
                console.log(dateToday.toISOString('fr-FR'));

                const jwt = localStorage.getItem("mae-covoit-supabase-jwt")
                if( jwt ){
                    const { data: { user } } = await this.supabase.auth.getUser(jwt);
                    if(user){
                        console.log('User already conneced:', user, jwt);
                        this.$router.push("/search");
                    }
                    else{
                        console.log('User session expired:', user, jwt);
                        this.getToken();
                    }
                }
                else{
                    this.getToken();
                }
            },
            async getToken(){
                let { data, error } = await this.supabase.auth.getSession()

                console.log("session:", data, error);
                if(data.session){
                    const jwt = data.session.access_token;
                    localStorage.setItem("mae-covoit-supabase-jwt", jwt);
                    localStorage.setItem("mae-covoit-supabase-jwt.expires_at", data.session.expires_at*1000);
                    const { data: { user } } = await this.supabase.auth.getUser(jwt);
                    if(user){
                        console.log('2:User already conneced:', user);
                        this.$router.push("/search");
                    }
                    else{
                        console.log('2:User session expired:', user);
                    }
                }
                else{
                    console.log("error session");
                }
            },
        },
        beforeUnmount() {
            console.log("-----beforeUnmount")
            window.removeEventListener('resize', this.updateIsSmallScreen);
        }
    }
</script>
