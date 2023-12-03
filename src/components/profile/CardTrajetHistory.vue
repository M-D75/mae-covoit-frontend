
<style lang="scss" model>
</style>

<style lang="scss" scoped>

    .card-trajet-history {
        border-radius: 24px;
        margin-right: 20px;
        margin-left: 0px !important;
        margin: auto;
        margin-top: 20px;
        margin-right: 10px;
        width: 280px;
        overflow: visible;
        color: var(--font-color-label);
        .v-card {
            width: 280px;
            padding: 10px 25px;
            border-radius: 24px;
            overflow: visible;
            box-shadow: var(--box-shadow-card);
            background-color: var(--white-bg-color);
            color: var(--font-color-label);
            .header {
                width: 60%;
                padding: 5px;
                position: absolute;
                top: -20px;
                z-index: 50;
                background-color: var(--white-bg-color);
                display: flex;
                border-radius: 50px;
                box-shadow: var(--box-shadow-card-v2);
                .v-avatar {
                    margin-right: 10px;
                }
                .name {
                    color: var(--font-color-label);
                    margin: auto;
                    text-align: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
            .v-list {
                background-color: var(--white-bg-color);
                color: var(--font-color-label);
                overflow: visible;
                .v-icon.chat-notif{
                    position: absolute;
                    right: 0;
                    width: 5px;
                    font-size: 20px;
                    color: #f53939;
                    color: var(--font-color-label);
                }
                > div {
                    margin-top: 10px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    &.trajet {
                        margin-top: 30px;
                    }
                    &.infos {
                        div{
                            .v-icon {
                                color: var(--gray-bg-icon-color);
                            }
                            div.hour {
                                margin-left: 10px;
                            }
                        }
                        .v-chip {
                            font-weight: 700;
                        }
                    }
                }
            }
        }
    }

</style>

<template>

    <div class="card-trajet-history">

        <v-card
            class="mx-auto"
            max-width="500"
            
        >
            <div @click="headerClick()" class="header">
                <v-avatar v-if="mode!='planning'">
                    <v-img
                        alt="Avatar"
                        :src="infos.avatar"
                    ></v-img>
                </v-avatar>

                <v-avatar 
                    v-if="mode=='planning'"
                >
                    <v-img
                        alt="Avatar"
                        :src="'https://cdn.vectorstock.com/i/preview-1x/76/28/unknown-person-user-icon-for-web-vector-34757628.jpg'"
                    ></v-img>
                </v-avatar>

                <div
                    v-for="(booking, index) in infos.bookings"
                    :key="index"
                >
                    <v-avatar 
                        v-if="mode=='planning'"
                        style="position: relative; left: -30px;"    
                    >
                        <v-img
                            alt="Avatar"
                            :src="'https://cdn.vectorstock.com/i/preview-1x/76/28/unknown-person-user-icon-for-web-vector-34757628.jpg'"
                        ></v-img>
                    </v-avatar>
                </div>

                

                <span v-if="mode!='planning'" class="name">{{ infos.name }}</span>
            </div>
            
            <v-list
                @click="selectTrip()"
            >

                <v-icon
                    v-if="infos.notifMessage"
                    class="chat-notif"
                >
                    <font-awesome-icon :icon="['far', 'comment-dots']" bounce />
                </v-icon>

                <div class="trajet">
                    <div>{{ infos.depart }}</div>
                    <v-icon>mdi-swap-horizontal</v-icon>
                    <div>{{ infos.destination }}</div>
                </div>

                <div class="infos">

                    <div style="display: flex; justify-content: space-between;">
                        <v-icon>mdi-clock</v-icon>
                        <div class="hour">{{ infos.hour_start }}</div>
                    </div>

                    <div v-if="mode=='planning'" style="display: flex; justify-content: space-between;">
                        <v-icon>mdi-seat-passenger</v-icon>
                        <div class="nb-passenger">{{ infos.passenger_number }}</div>
                    </div>

                    <v-chip
                        class=""
                        color="blue"
                        label
                    >
                        {{ infos.price }}€
                    </v-chip>
                </div>

            </v-list>
        </v-card>
    </div>

     <!-- message error -->
     <v-snackbar
        v-model="showSnackbarError"
        :timeout="4000"
        color="error"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarError }}</span>
    </v-snackbar>

</template>


<script>
    import { mapState, mapMutations, mapActions } from 'vuex';

   // Components
    export default {
        name: 'card-trajet-history-comp',
        emits: ["card-touched", "open-contacts"],
        computed: {
            ...mapState("trip", ['driver', 'chat']),
        },
        props: {
            mode: {
                type: String,
                default: "",
            },
            // notifMessage: {
            //     type: Boolean,
            //     default: false,
            // },
            infos: {
                type: Object,
                default() {
                    return {
                        "depart": "Tsingoni",
                        "destination": "Mamoudzou",
                        "hour_start": "4:50",
                        "hour_end": "6:55",
                        "price": 4,
                        "name": "Ledou",
                        "passenger_number": 2
                    };
                },
            },
        },
        data(){
            return {
                showSnackbarError: false,
                messageSnackbarError: "",
                // notifMessage: false,
            };
        },
        mounted(){
            // if( this.infos.notifMessage != undefined && this.infos.notifMessage ){
            //     this.notifMessage = true;
            // }
        },
        methods: {
            ...mapMutations("trip", ["SET_TRIP_SELECTED"]),
            ...mapActions("trip", ["getContacts", "getProfilMember"]),
            async selectTrip(){
                this.SET_TRIP_SELECTED(this.infos);
                if( this.mode == 'trajets' ){
                    this.$router.push('/trip')
                }
                else{
                    await this.getContacts();
                    console.log("contacts:", this.chat.contacts);
                    if( this.chat.contacts.length > 0 )
                        this.$router.push('/message');
                    else {
                        this.messageSnackbarError = "Aucun passager n'a reserver ce trajet";
                        this.showSnackbarError = true;
                    }
                }
            },
            async headerClick(){
                console.log('headerClick');
                this.SET_TRIP_SELECTED(this.infos);
                if( this.mode == 'trajets' ){
                    const memberOk = await this.getProfilMember({userUid: this.infos.driver_id});
                    if( memberOk )
                        this.$router.push('/member');
                    else{
                        this.messageSnackbarError = "Nous n'avons pas pu récupérer les informations souhaité, désolé !";
                        this.showSnackbarError = true;
                    }
                }
                else {
                    this.$emit("open-contacts");
                }
            },
        }
    };
</script>