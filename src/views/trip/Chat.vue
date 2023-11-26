
<style lang="scss" model>
     .v-menu.contact{
        .v-list{
            &.contact{
                .v-list-item:not(:last-child){
                    border-bottom: 0.5px solid #33333333;
                }

                .v-list-item__content{
                    display: flex;
                    flex: auto;
                    .v-list-item-title{
                        margin-right: 50px;
                    }
                    .nb-message{
                        position: fixed;
                        right: 10px;
                        border-radius: 100px;
                        padding: 0px 10px;
                        background: #333333AA;
                        margin-left: 10px;
                        color: white;
                        &.red{
                            background-color: #c60707aa;
                        }
                    }
                }
            }
        }
    }

    .v-toolbar{
        .v-toolbar__content{
            .v-toolbar__append {
                .v-btn {
                    .v-btn__content {
                        span.notif-message{
                            width: 10px;
                            height: 10px;
                            display: block;
                            z-index: 9999;
                            background: rgba(216, 8, 8, 0.825);
                            border-radius: 100px;
                            position: absolute;
                            right: 10px;
                            bottom: 13px;
                        }
                    }
                }
            }
        }
    }

    .v-footer{
        .card-foot{
            .v-text-field{
                .v-input__details{
                    display: none;
                }

                .v-input__control {
                    .v-field{
                        .v-field__field{
                            background-color: var(--bg-app-color) !important;
                            color: var(--font-color-label) !important;
                        }
                    }
                }
            }
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-app-bar {
        .v-toolbar{
            z-index: 1;
            background-color: var(--bg-app-color);
            box-shadow: var(--box-shadow-card);
            // natif
            padding-top: var(--safe-area-inset-top);
            margin-top: var(--safe-area-inset-top);
            // padding-top: 58px;
            // margin-top: 58px;

            .v-btn i.v-icon {
                margin-right: 0 !important;
                color: var(--gray-icon-color);
            }
            .v-toolbar-title {
                font-size: var(--font-size-h1-toolbar);
                color: var(--font-color-label);
            }

            .v-avatar {
                margin-left: 15px;
            }
            .v-list{
                &.contact{
                    .v-list-item{
                        border-bottom: 0.5px solid gray;
                    }
                }
            }
        }
    }

    .v-application{
        height: 100vh !important;
        .v-application__wrap{
            overflow: auto !important;
        }
    }

    .v-main{
        height: 100vh;
        overflow: auto;
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
        background-color: var(--bg-app-color);
        .card-foot{
            display: flex;
            flex: auto;
            .v-text-field{
                .v-input__control {
                    .v-field{
                        .v-field__field{
                            background-color: var(--bg-app-color) !important;
                            color: var(--font-color-label) !important;
                        }
                    }
                }
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
    <!--  -->
    <v-app-bar
        extended
        :extension-height="barHeight"
    >
        <v-toolbar
            class=""
            dark
            permanent
        >
            <template
                v-if="mode_driver"
                v-slot:prepend
            >
                <v-btn icon
                    @click="$router.push('/profil')"
                >
                    <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
            </template>

            <v-avatar
                size="47px"
            >
                <v-img
                    alt="Avatar"
                    :src="currentContact.avatarContact"
                ></v-img>
            </v-avatar>

            <v-toolbar-title
                class="ml-5 mr-5"
            >
                {{ currentContact.username }}
            </v-toolbar-title>

            <template 
                v-if="!mode_driver"
                v-slot:append
            >
                <v-btn icon
                    @click="$router.push('/trip')"
                >
                    <v-icon>mdi-map-legend</v-icon>
                </v-btn>
            </template>

            <template 
                v-else
                v-slot:append
            >
                <v-menu 
                    class="contact"
                >
                    <template v-slot:activator="{ props }">
                        <v-btn icon
                            v-bind="props"
                        >
                            <v-icon>mdi-account-supervisor-circle-outline</v-icon>
                            <span 
                                v-if="notifMessage"
                                class="notif-message"
                            ></span>
                        </v-btn>
                    </template>

                    <v-list class="contact">
                        <v-list-item
                            v-for="(contact, i) in contacts"
                            :key="i"
                            :value="contact.username"
                            :prepend-avatar="contact.avatar"
                            @click="selectContact(contact.username)"
                        >
                            <v-list-item-title>{{ contact.username }}</v-list-item-title>
                            <span class="nb-message" :class="{red: contact.messageNumber > 0 || contact.messageNumber=='9+'}">{{ contact.messageNumber }}</span>
                            
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>

        </v-toolbar>
    </v-app-bar>

    <!--  -->
    <v-main>

        <div class="messages">
            <div class="in">
                <div
                    v-for="(message, index) in messages.slice().reverse().filter((msg) => msg)" 
                    :key="index"
                    class="contain-mess"
                >
                    <div 
                        class="mess-chip"
                        :class="{ 'send': userUid == message.from, 'recipe': userUid != message.from }"
                    >
                        <span>{{ message.message }}</span> 
                        <br> 
                        <span class="time">{{ message.time }}</span>
                        <span 
                            v-if="userUid == message.from"
                            class="status">
                            <v-icon v-if="message.status=='send'">mdi-clock-time-eight-outline</v-icon>
                            <v-icon v-if="message.status=='sended'">mdi-check</v-icon>
                            <v-icon v-if="message.status=='vue'">mdi-check-all</v-icon>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- loading -->
        <v-overlay :model-value="overlayLoad" class="align-center justify-center">
            <v-progress-circular color="blue" indeterminate size="64"></v-progress-circular>
        </v-overlay>

    </v-main>

    <!--  -->
    <v-footer
        app
        name="footer"
        height="60"
        permanent
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
                :color="darkMode ? 'white' : 'gray'"
                style="opacity: 0.7"
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
</template>



<!--  -->
<script>
    import $ from 'jquery'
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';
    // Importez la bibliothèque Socket.IO client
    import io from 'socket.io-client';
    import supabase from '@/utils/supabaseClient.js';
    import { SafeAreaController, SafeArea } from '@aashu-dubey/capacitor-statusbar-safe-area';

    // Components

    export default defineComponent({
        name: 'chat-view',
        computed: {
            ...mapState("profil", ['userUid', 'darkMode', "userName"]),
            ...mapState("auth", ['registerDeviceToken']),
            ...mapState("trip", ['tripSelected', 'chat']),
        },
        components: {
        },
        data() {
            return {
                barHeight: 0,
                mode_driver: false,
                currentContact: {
                    username: "Username",
                    avatarContact: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light'",
                    userUid: "",
                },
                newMessage: '',
                messages: [
                    { from: this.userUid, message: "Bonjour, c'est Marc. Je suis votre conducteur pour le covoiturage de demain.", type: 0, time: "08:22", status: "vue" },
                    { from: "this.userUid", message: "Salut Marc, ici Léa. Oui, je me réjouis de notre trajet !", type: 1, time: "08:22", status: "vue" },
                    { from: this.userUid, message: "Super ! Pouvez-vous confirmer l'heure et le lieu de départ ?", type: 0, time: "08:23", status: "vue" },
                    { from: "this.userUid", message: "Bien sûr. On avait dit 8h devant la gare, n'est-ce pas ?", type: 1, time: "08:24", status: "vue" },
                    { from: this.userUid, message: "Exactement. Et votre destination finale est bien la rue de Rivoli ?", type: 0, time: "08:24", status: "vue" },
                    { from: "this.userUid", message: "Oui, c'est parfait. Combien de temps pensez-vous que le trajet va durer ?", type: 1, time: "08:25", status: "vue" },
                    { from: this.userUid, message: "En général, ça prend une heure, mais je prévois un peu de marge pour le trafic.", type: 0, time: "08:26", status: "vue" },
                    { from: "this.userUid", message: "Ça marche. Aurons-nous le temps de faire une pause café en cours de route ?", type: 1, time: "08:26", status: "vue" },
                    { from: this.userUid, message: "Bien sûr, je pense qu'une petite pause serait agréable.", type: 0, time: "08:26", status: "vue" },
                    { from: "this.userUid", message: "Super ! J'apporterai des croissants.", type: 1, time: "08:27" },
                    { from: this.userUid, message: "C'est très gentil, merci ! Vous avez des préférences musicales pour le trajet ?", type: 0, time: "08:27", status: "vue" },
                    { from: "this.userUid", message: "Pas vraiment, je suis assez éclectique. Et vous ?", type: 1, time: "08:28", status: "vue" },
                    { from: this.userUid, message: "Pareil ici. J'ai une playlist assez variée, on devrait trouver quelque chose d'agréable.", type: 0, time: "08:28", status: "vue" },
                    { from: "this.userUid", message: "Parfait. Avez-vous assez de place pour une petite valise ?", type: 1, time: "08:28" },
                    { from: this.userUid, message: "Oui, aucun souci pour la valise. Vous avez besoin d'aide pour la porter ?", type: 0, time: "08:28", status: "vue" },
                    { from: "this.userUid", message: "Ça ira, merci. Elle n'est pas très lourde.", type: 1, time: "08:29", status: "vue" },
                    { from: this.userUid, message: "D'accord. Je conduis une voiture bleue, juste pour que vous sachiez.", type: 0, time: "08:29", status: "vue" },
                    { from: "this.userUid", message: "Super, je serai à l'heure demain.", type: 1, time: "08:29", status: "vue" },
                    { from: this.userUid, message: "Parfait. Si vous avez le moindre changement, n'hésitez pas à me le faire savoir.", type: 0, time: "08:30", status: "vue" },
                    { from: "this.userUid", message: "Je le ferai. Merci encore et à demain !", type: 1, time: "08:30", status: "vue" },
                    { from: this.userUid, message: "Avec plaisir. Bonne soirée et à demain !", type: 0, time: "08:30", status: "vue" },
                    { from: "this.userUid", message: "Bonne soirée à vous aussi !", type: 1, time: "08:30", status: "sended" },
                ],
                contacts: [
                    {
                        username: 'Léa Duval', 
                        avatar: 'https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light',
                        messageNumber: "9+",
                    },
                    {
                        username:'Louis David', 
                        avatar:'https://avataaars.io/?avatarStyle=Circle&topType=WinterHat4&accessoriesType=Kurt&hatColor=Red&hairColor=Red&facialHairType=MoustacheMagnum&facialHairColor=BrownDark&clotheType=Overall&clotheColor=Gray01&eyeType=Wink&eyebrowType=AngryNatural&mouthType=Serious&skinColor=Pale',
                        messageNumber: 2,
                    },
                    {
                        username:'Omar Bob', 
                        avatar:'https://avatars0.githubusercontent.com/u/9064066?v=4&s=460',
                        messageNumber: 0,
                    },
                ],
                notifMessage: false,
                socket: null,
                overlayLoad: true,
            };
        },
        mounted(){

            SafeAreaController.injectCSSVariables();

            this.initStatusBarHeight();

            // this.messages = [
            //         { from: this.userUid, message: "Bonjour, c'est Marc. Je suis votre conducteur pour le covoiturage de demain.", type: 0, time: "08:22", status: "vue" },
            //         { from: "this.userUid", message: "Salut Marc, ici Léa. Oui, je me réjouis de notre trajet !", type: 1, time: "08:22", status: "vue" },
            //         { from: this.userUid, message: "Super ! Pouvez-vous confirmer l'heure et le lieu de départ ?", type: 0, time: "08:23", status: "vue" },
            //         { from: "this.userUid", message: "Bien sûr. On avait dit 8h devant la gare, n'est-ce pas ?", type: 1, time: "08:24", status: "vue" },
            //         { from: this.userUid, message: "Exactement. Et votre destination finale est bien la rue de Rivoli ?", type: 0, time: "08:24", status: "vue" },
            //         { from: "this.userUid", message: "Oui, c'est parfait. Combien de temps pensez-vous que le trajet va durer ?", type: 1, time: "08:25", status: "vue" },
            //         { from: this.userUid, message: "En général, ça prend une heure, mais je prévois un peu de marge pour le trafic.", type: 0, time: "08:26", status: "vue" },
            //         { from: "this.userUid", message: "Ça marche. Aurons-nous le temps de faire une pause café en cours de route ?", type: 1, time: "08:26", status: "vue" },
            //         { from: this.userUid, message: "Bien sûr, je pense qu'une petite pause serait agréable.", type: 0, time: "08:26", status: "vue" },
            //         { from: "this.userUid", message: "Super ! J'apporterai des croissants.", type: 1, time: "08:27" },
            //         { from: this.userUid, message: "C'est très gentil, merci ! Vous avez des préférences musicales pour le trajet ?", type: 0, time: "08:27", status: "vue" },
            //         { from: "this.userUid", message: "Pas vraiment, je suis assez éclectique. Et vous ?", type: 1, time: "08:28", status: "vue" },
            //         { from: this.userUid, message: "Pareil ici. J'ai une playlist assez variée, on devrait trouver quelque chose d'agréable.", type: 0, time: "08:28", status: "vue" },
            //         { from: "this.userUid", message: "Parfait. Avez-vous assez de place pour une petite valise ?", type: 1, time: "08:28" },
            //         { from: this.userUid, message: "Oui, aucun souci pour la valise. Vous avez besoin d'aide pour la porter ?", type: 0, time: "08:28", status: "vue" },
            //         { from: "this.userUid", message: "Ça ira, merci. Elle n'est pas très lourde.", type: 1, time: "08:29", status: "vue" },
            //         { from: this.userUid, message: "D'accord. Je conduis une voiture bleue, juste pour que vous sachiez.", type: 0, time: "08:29", status: "vue" },
            //         { from: "this.userUid", message: "Super, je serai à l'heure demain.", type: 1, time: "08:29", status: "vue" },
            //         { from: this.userUid, message: "Parfait. Si vous avez le moindre changement, n'hésitez pas à me le faire savoir.", type: 0, time: "08:30", status: "vue" },
            //         { from: "this.userUid", message: "Je le ferai. Merci encore et à demain !", type: 1, time: "08:30", status: "vue" },
            //         { from: this.userUid, message: "Avec plaisir. Bonne soirée et à demain !", type: 0, time: "08:30", status: "vue" },
            //         { from: "this.userUid", message: "Bonne soirée à vous aussi !", type: 1, time: "08:30", status: "sended" },
            //     ];

            this.messages = [];

            //this.name = "Léa Duval";

            setTimeout(function(){
                this.scrollToBottom();
            }.bind(this), 500);

            const adresse = {local: "http://localhost:8090", online: "https://server-mae-covoit-notif.infinityinsights.fr"}

            if( Object.keys(this.tripSelected).length > 0 && this.userUid != this.tripSelected.driver_id ){//mode passager
                this.mode_driver = false;
                this.socket = io(adresse.online, {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 100,
                    query: {
                        userId: this.userUid,
                        chatIds: [[this.userUid, this.tripSelected.driver_id].sort((a, b) => {
                                return a.localeCompare(b);
                            }).join(":")],
                        registerDeviceToken: this.registerDeviceToken,
                    }
                });

                this.currentContact.userUid = this.tripSelected.driver_id;

                this.updateName(this.tripSelected.driver_id);
            }
            else{
                this.mode_driver = true;
                this.contacts = this.chat.contacts;

                let chatIds = [];
                for (let index = 0; index < this.contacts.length; index++) {
                    chatIds.push([this.userUid, this.contacts[index].user_id].sort((a, b) => {
                                return a.localeCompare(b);
                            }).join(":"));
                }

                this.socket = io(adresse.online, {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 100,
                    query: {
                        userId: this.userUid,
                        chatIds: chatIds,
                        registerDeviceToken: this.registerDeviceToken,
                    }
                });
                this.currentContact.username = this.contacts[0].username;
                this.currentContact.avatarContact = this.contacts[0].avatar;
                this.currentContact.userUid = this.contacts[0].user_id;
            }

            this.socket.on('connect', () => {
                console.log('Connecté au serveur Socket.IO!');
                this.overlayLoad = false;
            });

            this.socket.on('get messages', (data) => {
                console.log('Get old messages', data);
                if( data.length > 0 ){
                    if( data[0].from == this.currentContact.userUid || data[0].to == this.currentContact.userUid ){//current contact ok
                        this.messages = data;
                        if( this.messages.length > 0 ){
                            const messageNotSee = this.messages.filter((msg) => msg && msg.from != this.userUid && msg.status != "vue");
                            if( messageNotSee.length > 0 )
                                this.socket.emit("vue message", messageNotSee);
                        }
                        this.scrollToBottom();
                    }
                    else{//not current contact
                        const messageNotSee = data.filter((msg) => msg && msg.from != this.userUid && msg.status != "vue");
                        if( messageNotSee.length > 0 ){
                            const index = this.contacts.findIndex(contact => contact.userUid == data[0].from || contact.userUid == data[0].to );
                            const nbMessage = messageNotSee.length;
                            if ( index !== -1 ) {
                                this.notifMessage = true;
                                this.contacts[index].messageNumber = nbMessage < 10 ? nbMessage : "9+";
                            }
                        }
                        
                    }
                }
                else{
                    this.messages = [];
                }
            });

            this.socket.on('chat message', (msg) => {
                console.log('Message reçu:', msg);
                if( msg.from == this.userUid ){
                    this.messages[msg.index] = msg
                }
                else {
                    //Check if account are created
                    //this.updateName(msg.from);
                    //msg.status = "vue";
                    if( this.currentContact.userUid == msg.from ){
                        this.messages.push(msg);
                        this.socket.emit("vue message", [msg]);
                    }
                    else{
                        const index = this.contacts.findIndex(contact => contact.user_id == msg.from );
                        if( index !== -1 && this.contacts[index].messageNumber != "9+" ){
                            this.notifMessage = true;
                            this.contacts[index].messageNumber++;
                            this.contacts[index].messageNumber = this.contacts[index].messageNumber < 10 ? this.contacts[index].messageNumber : "9+";
                        }
                    }
                }
            });

            this.socket.on('connected', (data) => {
                console.log('data id:', data);
            });

            console.log("nb-m", this.messages.length);
            
        },
        beforeUnmount() {
            if ( this.socket ) {
                this.socket.emit('pre-disconnect', { userUid: this.userUid });
                this.socket.disconnect();
            }
        },
        methods: {
            async initStatusBarHeight(){
                const insets = await this.getSafeAreaInsets();
                this.barHeight = insets["top"];
            },
            async getSafeAreaInsets () {
                const insets = await SafeArea.getSafeAreaInsets();
                return insets; // Ex. { "bottom":34, "top":47, "right":0, "left":0 }
            },
            sendMessage() {
                if ( this.newMessage.trim() !== '' ) {
                    let newMsg = {
                            from: this.userUid,
                            to: this.currentContact.userUid,
                            fromName: this.userName,
                            toName: this.currentContact.username,
                            message: this.newMessage, 
                            time: this.timeNow(), 
                            status: "send", 
                            index: this.messages.length,
                        }
                    this.messages.push(newMsg);
                    this.socket.emit("chat message", newMsg)
                    this.newMessage = '';
                }

                this.scrollToBottom();
            },
            scrollToBottom() {
                this.$nextTick(() => {
                    const container = $(".messages")[0];
                    // console.log("scoll", container.clientHeight);
                    $(".v-main").animate({ scrollTop: container.clientHeight }, "slow");
                });
            },
            timeNow() {
                const now = new Date();
                return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            },
            selectContact(value){
                const index = this.contacts.findIndex((contact) => contact.username == value);
                const currentContact = this.contacts[index];
                this.currentContact.username = currentContact.username;
                this.currentContact.avatarContact = currentContact.avatar;
                this.currentContact.userUid = currentContact.user_id;

                this.contacts[index].messageNumber = 0;
                this.notifMessage = false;

                this.socket.emit("ask messages", {
                                    userUid: this.userUid, 
                                    chatId: [this.userUid, this.currentContact.userUid].sort((a, b) => {
                                        return a.localeCompare(b);
                                    }).join(":")
                                }
                            );

            },
            async updateName(userUid){
                //Check if account are created
                let { data: account, error: error_account } = await supabase
                    .from('account')
                    .select('*')
                    .eq('user_id', userUid);
                
                if(error_account){
                    console.error("Error:", error_account);
                }

                this.currentContact.username = account[0].username;
            }
        },
    });
</script>
