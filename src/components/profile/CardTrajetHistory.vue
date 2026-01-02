
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
            .v-icon.remove-booking {
                position: absolute;
                top: -10px;
                right: -6px;
                font-size: 27px;
                // color: #f53939 !important;
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

    <v-overlay 
        v-model="overlay"
        contained
        persistent
        style="z-index: 10;"
        @click="overlay = false"
    ></v-overlay>

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
                    v-if="mode=='planning' && infos.bookings.length == 0"
                >
                    <v-icon icon="mdi-incognito-circle-off"></v-icon>
                </v-avatar>

                <div
                    v-for="(booking, index) in infos.bookings"
                    :key="index"
                >
                    <v-avatar 
                        v-if="mode=='planning' && index==0"
                        style="position: relative; left:0px;"    
                    >
                        <v-img
                            v-if="!loading"
                            alt="Avatar"
                            :src="booking.account.avatar"
                        ></v-img>

                        <v-progress-circular
                            v-else
                            color="blue"
                            indeterminate
                            size="64"
                        ></v-progress-circular>
                    </v-avatar>

                    <v-avatar 
                        v-if="mode=='planning' && index > 0"
                        style="position: relative; left: -30px;"    
                    >
                        <v-img
                            v-if="!loading"
                            alt="Avatar"
                            :src="booking.account.avatar"
                        ></v-img>

                        <v-progress-circular
                            v-else
                            color="blue"
                            indeterminate
                            size="64"
                        ></v-progress-circular>
                    </v-avatar>
                </div>

                

                <span v-if="mode!='planning'" class="name">{{ infos.name }}</span>
            </div>

            <!-- btn-close remove trip -->
            <v-icon
                v-if="mode!='planning'"
                class="remove-booking"
                @click="overlay=true; $refs.BottomMenuRefConfirmChoice.open()"
            >
                mdi-close-circle
            </v-icon>

            <v-icon
                v-else
                class="remove-booking"
                @click="overlay=true; $refs.BottomMenuRefConfirmChoice.open()"
            >
                mdi-close-circle
            </v-icon>
            
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
                    <v-icon>mdi-arrow-right-thin</v-icon>
                    <div>{{ infos.destination }}</div>
                </div>

                <div class="infos">

                    <div style="display: flex; justify-content: space-between;">
                        <v-icon>mdi-clock</v-icon>
                        <div class="hour">{{ infos.hour_start }}</div>
                    </div>

                    <div 
                        v-if="mode=='planning'" 
                        style="display: flex; justify-content: space-between;"
                    >
                        <v-icon>mdi-seat-passenger</v-icon>
                        <div class="nb-passenger">{{ infos.passenger_number }}</div>
                    </div>

                    <div 
                        v-if="mode!='planning'" 
                        style="display: flex; justify-content: space-between;"
                    >
                        <v-icon v-if="infos.is_accepted" color="green">mdi-check-bold</v-icon>
                        <v-icon v-if="!infos.is_accepted && !infos.is_refused">mdi-clock-time-two-outline</v-icon>
                        <v-icon v-if="infos.is_refused" color="red">mdi-close-thick</v-icon>
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


    <!-- test confirm choice -->
    <BottomMenu
        :class-name="['confirm-choice-remove-booking-class']"
        mode="confirm-choice"
        :labelSelectorN1="confirmLabel"
        ref="BottomMenuRefConfirmChoice"
        v-on:close="overlay = false"
        v-on:yes="handleConfirm"
        v-on:no="overlay = false; console.log('no'); $refs.BottomMenuRefConfirmChoice.close()"
        />

</template>


<script>
    import { mapState, mapMutations, mapActions } from 'vuex';

    // Components
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default {
        name: 'card-trajet-history-comp',
        emits: ["card-touched", "open-contacts", "open-member", "booking-removed"],
        computed: {
            ...mapState("trip", ['driver', 'chat']),
            ...mapState("profil", ["userId"]),
            confirmLabel(){
                return this.mode === 'planning'
                    ? "Souhaitez vous annuler ce trajet ?"
                    : "Souhaitez vous réelement annuler cette réservation ?";
            }
        },
        components: {
            BottomMenu,
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
                        "passenger_number": 2,
                    };
                },
            },
        },
        data(){
            return {
                showSnackbarError: false,
                messageSnackbarError: "",
                loading: false,
                overlay: false,
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
            ...mapActions("profil", ["removeBooking", "cancelTripPublication"]),
            async selectTrip(){
                if( this.mode == 'trajets' ){

                    if( this.infos.is_accepted ){
                        this.SET_TRIP_SELECTED(this.infos);
                        this.$router.push('/trip');
                    }
                    else {
                        if( ! this.infos.is_accepted && ! this.infos.is_refused)
                            this.messageSnackbarError = "Trajet en attente de validation par le chauffeur";
                        else
                            this.messageSnackbarError = "Trajet refusé par le chauffeur";

                        this.showSnackbarError = true;
                    }

                }
                else{
                    this.loading = true;
                    this.SET_TRIP_SELECTED(this.infos);
                    await this.getContacts();
                    console.log("contacts:", this.chat.contacts);
                    if( this.chat.contacts.length > 0 ){
                        this.loading = false;
                        this.$router.push('/message');
                    }
                    else {
                        this.messageSnackbarError = "Aucun passager n'a reserver ce trajet";
                        this.showSnackbarError = true;
                    }
                    this.loading = false;

                }
            },
            async headerClick(){
                console.log('headerClick');
                this.SET_TRIP_SELECTED(this.infos);
                if( this.mode == 'trajets' ){
                    const memberOk = await this.getProfilMember({userUid: this.infos.driver_id});
                    if( memberOk ){
                        // this.$router.push('/member');
                        this.$emit("open-member");
                    }
                    else{
                        this.messageSnackbarError = "Nous n'avons pas pu récupérer les informations souhaité, désolé !";
                        this.showSnackbarError = true;
                    }
                }
                else {
                    this.$emit("open-contacts");
                }
            },
            async callRemoveBooking(){
                console.log("Annulation de la reservation", this.userId, this.infos.id);
                this.$refs.BottomMenuRefConfirmChoice.loadingBtn = true;
                await this.removeBooking({trip_id: this.infos.id});
                this.$refs.BottomMenuRefConfirmChoice.loadingBtn = false;
                //TODO : remove
                this.$refs.BottomMenuRefConfirmChoice.close();
                this.$emit('booking-removed');
            },
            async callCancelTrip(){
                console.log("Annulation du trajet", this.infos.id);
                this.$refs.BottomMenuRefConfirmChoice.loadingBtn = true;
                const response = await this.cancelTripPublication(this.infos);
                this.$refs.BottomMenuRefConfirmChoice.loadingBtn = false;
                this.$refs.BottomMenuRefConfirmChoice.close();
                if( !response || response.status !== 0 ){
                    this.messageSnackbarError = response?.message || "Impossible d'annuler ce trajet.";
                    this.showSnackbarError = true;
                }
                else{
                    this.$emit('booking-removed');
                }
            },
            async handleConfirm(){
                this.overlay = false;
                if( this.mode === 'planning' ){
                    await this.callCancelTrip();
                }
                else{
                    await this.callRemoveBooking();
                }
            }
        },
        watch: {
            overlay(){
                if( ! this.overlay ){
                    if ( this.$refs.BottomMenuRefConfirmChoice ) {
                        this.$refs.BottomMenuRefConfirmChoice.close();
                    }
                }
            },
        }
    };
</script>
