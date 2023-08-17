
<style lang="scss" model>
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

    
    // mask
    $color1: var(--bg-app-color);
    //$color1: red;
    $color2: hotpink;
    $duration: 1.4s;
    

    @import url('https://fonts.googleapis.com/css?family=Work+Sans:400,700,900');

    h1{
        display: block;
        position: relative;
        font-size: 3em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: -0.01em;
        top: 50%;
        transform: translateY(-50%);
        text-align: center;
        color: var(--font-color-label);
    }

    .mask{
        position: absolute;
        top:25%; left: 0;
        width: 100%; height: 50%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        background-color: $color1;

        cursor: pointer;
        mask: url(https://i.imgur.com/9mVumLa.png);
        mask: url(https://i.imgur.com/9mVumLa.png);
    
        mask-size: 3000% 100%;
    
        animation: mask-play $duration steps(29) forwards;
        .img {
            width: 100%;
            margin: auto;
            position: relative;
            top: 50%;
            transform: translateY(-50%);
            .v-img {
                margin: auto;
            }
        }
    }

    .mask.display {
        animation: mask-play-reverse $duration steps(29) forwards
    }

    @keyframes mask-play-reverse {
        from { mask-position: 0% 0 }
        to { mask-position: 100% 0 }
    }

    @keyframes mask-play {
        from { mask-position: 100% 0 }
        to { mask-position: 0% 0 }
    }

</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-container {
        margin: auto;
        .bloc-part{
            margin: 50px auto;

        }
    }
    .v-row{
        margin: 30px auto;
    }
</style>
   
<!--  -->
<template>
  
    <v-main class="ligth-mode">
        <v-container >

            <!-- From Sign/Connexion -->
            <v-row class="bloc-part">
                <v-col>

                <v-row>
                    <v-col>
                        <v-img
                            style="margin: auto;"
                            :width="173"
                            aspect-ratio="16/9"
                            cover
                            src="../assets/logo.png"
                        ></v-img>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col>
                        <v-btn
                            class="mr-4 text-none"
                            @click="submit"
                            rounded="xl" 
                            size="x-large"
                            variant="outlined"
                            block
                        >
                            S'inscrire - Se connecter
                        </v-btn>
                    </v-col>
                </v-row>
                </v-col>
            </v-row>

        </v-container>

        <!-- <div class="mask display">
            <div class="img">
                <v-img
                :width="217"
                aspect-ratio="16/9"
                cover
                src="@/assets/model-finaliser.png"
                ></v-img>
            </div>
            
            <h1>
                M'BABUF
            </h1>
        </div> -->

    </v-main>

    <!-- Load -->
    <v-overlay
        :model-value="overlayLoad"
        class="align-center justify-center"
    >
        <v-progress-circular
            color="black"
            indeterminate
            size="64"
        ></v-progress-circular>
    </v-overlay>

</template>


<!--  -->
<script>
    // @ is an alias to /src
    // import $ from 'jquery'
    import { mapActions } from 'vuex'

    export default {
        name: 'HomeTest',
        computed: {
            ...mapActions("auth", ["refreshToken", "checkSession"]),
        },
        data() {
            return {
                overlayLoad: true,
            }
        },
        methods: {
            submit(){
                this.$router.push({ path: '/login' })
            },
            async checkSessionIn(){
                await this.checkSession;
                this.overlayLoad = false;
            },
        },
        created() {
            this.checkSessionIn();
        },
        mounted() {
            // force ligth-mode
            // $("#app .v-application").addClass("ligth-mode");
            // $("#app .v-application").removeClass("dark-mode");
            
            //effet mask
            // setTimeout(function(){
            //     $(".mask").toggleClass("display");
            //     setTimeout(function(){
            //         $(".mask").css("display", "none");
            //     }, 1400);
            // }, 2500)
        },
        watch: {
        },
    }
</script>
