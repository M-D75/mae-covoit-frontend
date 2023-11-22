
<style lang="scss" model>

    .v-footer{
        .card-foot{
            .v-text-field{
                .v-input__details{
                    display: none;
                }
            }
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-toolbar-title{
        text-align: center;
    }

    .v-main{
        .messages {

            .in{
                overflow-y: auto; /* Active le défilement vertical si nécessaire */
                display: flex;
                flex-direction: column-reverse;
                padding: 5px 10px;
            }
            .contain-mess{
                height:auto;
                width:100%;
                margin: 5px 0;
            }

            .mess-chip{
                border-radius: 15px;
                background: #77777744;
                padding: 10px 15px;
                width: fit-content;
                max-width: 80%;
                // text-align: justify;
                color: var(--font-color-label);
                &.send{
                    float: right;
                    background-color: rgb(0 209 255 / 40%);
                    span {
                        &.time{
                            color: cadetblue;
                        }
                        &.status{
                            color: cadetblue;
                        }
                    }
                }
                &.recipe{
                    float: left;
                    background-color: #B2BBBD44;
                    span  {
                        &.time{
                            color: #858484b9;
                        }
                        &.status{
                            color: #858484b9;
                        }
                    }

                }
                span {
                    &.time{
                        display: contents;
                        color: #323232;
                        font-weight: italic;
                        opacity: 0.5;
                    }
                    &.status{
                        margin-left: 5px;
                        font-size: 13px;
                    }
                }
                
            }
        }
    }

    .v-footer{
        .card-foot{
            display: flex;
            flex: auto;
            .v-text-field{
                .v-input__details{
                    display: none;
                }
            }
        }
        .v-btn{
            padding-right: 0;
            font-size: 25px;
            height: 55px;
        }
    }
</style>
   
<!--  -->
<template>

    <v-app-bar>
        <v-toolbar
            class=""
            dark
            color="info"
        >
            <template v-slot:prepend>
                <v-btn icon
                    @click="$router.push('/profil')"
                >
                    <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
            </template>

            <v-toolbar-title
                class="ml-5 mr-5"
            >
                Léa Duval
            </v-toolbar-title>

            <template v-slot:append>
                <v-btn icon
                    @click="$router.push('/trip')"
                >
                    <v-icon>mdi-map-legend</v-icon>
                </v-btn>
            </template>
        </v-toolbar>
    </v-app-bar>

    <v-main>

        <div class="messages">
            <div class="in">
                <div
                    v-for="(message, index) in messages.slice().reverse()" 
                    :key="index"
                    class="contain-mess"
                >
                    <div 
                        class="mess-chip"
                        :class="{ 'send': message.type == 0, 'recipe': message.type != 0 }"
                    >
                        <span>{{ message.message }}</span> 
                        <br> 
                        <span class="time">{{ message.time }}</span>
                        <span 
                            v-if="message.type == 0"
                            class="status">
                            <v-icon v-if="message.status=='vue'">mdi-check-all</v-icon>
                            <v-icon v-if="message.status=='sended'">mdi-check</v-icon>
                        </span>
                    </div>
                </div>
            </div>
        </div>

    </v-main>

    <v-footer
        app
        name="footer"
        border
        height="60"
    >

        <div
            class="card-foot"
        >
            <v-text-field
                class="write-message"
                v-model="newMessage"
                variant="solo"
                label="Écrire un message..."
                @keyup.enter="sendMessage"
            ></v-text-field>

            <v-btn
                v-if="newMessage==''"
                icon
                :active="false"
                :ripple="false"
                variant="plain"
                color="gray"
                style="opacity: 0.5"
            >
                <v-icon>mdi-send-variant</v-icon>
            </v-btn >

            <v-btn
                v-else
                icon
                :active="false"
                :ripple="false"
                variant="plain"
                color="info"
                @click="sendMessage"
            >
                <v-icon>mdi-send-variant</v-icon>
            </v-btn >
        </div>
    </v-footer>

    <!-- Menu -->
    <!-- <BottomNavTrip /> -->

</template>



<!--  -->
<script>
    // import $ from 'jquery'
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';

    // Components
    // import BottomNavTrip from '@/components/menus/trip/BottomNavTrip.vue';

    export default defineComponent({
        name: 'chat-view',
        computed: {
            ...mapState("search", ['depart', "destination", "nbPassenger"]),
        },
        components: {
            // BottomNavTrip,
        },
        data() {
            return {
                newMessage: '',
                messages: [
                    { message: "Bonjour, c'est Marc. Je suis votre conducteur pour le covoiturage de demain.", type: 0, time: "08:22", status: "vue" },
                    { message: "Salut Marc, ici Léa. Oui, je me réjouis de notre trajet !", type: 1, time: "08:22", status: "vue" },
                    { message: "Super ! Pouvez-vous confirmer l'heure et le lieu de départ ?", type: 0, time: "08:23", status: "vue" },
                    { message: "Bien sûr. On avait dit 8h devant la gare, n'est-ce pas ?", type: 1, time: "08:24", status: "vue" },
                    { message: "Exactement. Et votre destination finale est bien la rue de Rivoli ?", type: 0, time: "08:24", status: "vue" },
                    { message: "Oui, c'est parfait. Combien de temps pensez-vous que le trajet va durer ?", type: 1, time: "08:25", status: "vue" },
                    { message: "En général, ça prend une heure, mais je prévois un peu de marge pour le trafic.", type: 0, time: "08:26", status: "vue" },
                    { message: "Ça marche. Aurons-nous le temps de faire une pause café en cours de route ?", type: 1, time: "08:26", status: "vue" },
                    { message: "Bien sûr, je pense qu'une petite pause serait agréable.", type: 0, time: "08:26", status: "vue" },
                    { message: "Super ! J'apporterai des croissants.", type: 1, time: "08:27" },
                    { message: "C'est très gentil, merci ! Vous avez des préférences musicales pour le trajet ?", type: 0, time: "08:27", status: "vue" },
                    { message: "Pas vraiment, je suis assez éclectique. Et vous ?", type: 1, time: "08:28", status: "vue" },
                    { message: "Pareil ici. J'ai une playlist assez variée, on devrait trouver quelque chose d'agréable.", type: 0, time: "08:28", status: "vue" },
                    { message: "Parfait. Avez-vous assez de place pour une petite valise ?", type: 1, time: "08:28" },
                    { message: "Oui, aucun souci pour la valise. Vous avez besoin d'aide pour la porter ?", type: 0, time: "08:28", status: "vue" },
                    { message: "Ça ira, merci. Elle n'est pas très lourde.", type: 1, time: "08:29", status: "vue" },
                    { message: "D'accord. Je conduis une voiture bleue, juste pour que vous sachiez.", type: 0, time: "08:29", status: "vue" },
                    { message: "Super, je serai à l'heure demain.", type: 1, time: "08:29", status: "vue" },
                    { message: "Parfait. Si vous avez le moindre changement, n'hésitez pas à me le faire savoir.", type: 0, time: "08:30", status: "vue" },
                    { message: "Je le ferai. Merci encore et à demain !", type: 1, time: "08:30", status: "vue" },
                    { message: "Avec plaisir. Bonne soirée et à demain !", type: 0, time: "08:30", status: "vue" },
                    { message: "Bonne soirée à vous aussi !", type: 1, time: "08:30", status: "sended" },
                ],

            };
        },
        methods: {
            sendMessage() {
                if (this.newMessage.trim() !== '') {
                    this.messages.push({message: this.newMessage, type: 0, time: this.timeNow(), status: "sended"});
                    this.newMessage = '';
                }
            },
            timeNow() {
                const now = new Date();
                let hours = now.getHours().toString();
                let minutes = now.getMinutes().toString();

                // Ajouter un zéro au début si l'heure ou les minutes sont inférieures à 10
                if (hours.length < 2) {
                    hours = '0' + hours;
                }
                if (minutes.length < 2) {
                    minutes = '0' + minutes;
                }

                return hours + ':' + minutes;
            },
        },
    });
</script>
