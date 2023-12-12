
<style lang="scss" model>

    .card-contacts {
        .v-list {
            .v-list-subheader__text {
                color: var(--font-color-label);
                white-space: inherit;
            }
        }
    }

</style>

<!-- scss -->
<style lang="scss" scoped>
    .card-contacts {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100vh;
        background-color: var(--bg-app-color);
        .v-toolbar{
            color: var(--font-color-label);
            background-color: var(--bg-app-color);
        }

        .v-list {
            color: var(--font-color-label);
            background-color: var(--bg-app-color);
            .v-list-subheader__text {
                color: var(--font-color-label);
                
            }
        }

        .nothing {
            display: table;
            text-align: center;
            height: 83vh;

            .contenu {
                text-align: center;
                display: table-cell;
                vertical-align: middle;

                i {
                    font-size: 35px;
                    margin-bottom: 5px;
                }

                span {
                    font-size: 17px;
                    text-transform: uppercase;
                    display: block;
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
    <v-card class="card-contacts mx-auto">
        <v-toolbar >
            <v-btn 
                variant="text" 
                icon="mdi-chevron-left"
                @click="$emit('go-back')"    
            ></v-btn>

            <v-toolbar-title>Passager</v-toolbar-title>
            <v-spacer></v-spacer>
        </v-toolbar>

        <v-list 
            lines="three"
        >
            <div
                v-for="(item, index) in (itemsContacts.length > 0 ? itemsContacts : items)"
                :key="index"
                item-props
            >
                <v-list-subheader
                    v-if="item.type == 'subheader'"
                    :title="item.title"
                >
                    <div>{{ item.title }}</div>

                    <div style="display: flex;" >
                        <v-icon
                            v-for="n in item.seats"
                            :key="n"
                            :color="'green'"
                        >mdi-seat-passenger</v-icon>

                        <v-icon
                            v-for="n in (item.max_seats - item.seats)"
                            :key="n"
                            :color="'grey-lighten-1'"
                        >mdi-car-seat</v-icon>
                    </div>
                </v-list-subheader>

                <v-list-item 
                    v-if="item.type == undefined"
                    :title="item.title"
                    :subtitle="item.subtitle"
                >
                    <template v-slot:prepend>
                        <v-avatar @click="goToProfil(item.userUid)">
                            <v-img v-if="item.prependAvatar"
                                :src="item.prependAvatar"
                            >
                            </v-img>
                            <v-icon v-else style="color: var(--font-color-label); font-size: 2em;">mdi-account-circle</v-icon>
                        </v-avatar>
                    </template>

                    <template v-slot:subtitle="{ subtitle }">
                        <div style="display: flex;">
                            <div @click="goToProfil(item.userUid)" v-html="subtitle"></div>
                        </div>

                        <div style="display: flex;">
                            <v-icon
                                v-for="n in item.seats"
                                :key="n"
                                :color=" !item.isAccepted ? 'grey-lighten-1' : 'green'"
                            >mdi-seat-passenger</v-icon>
                        </div>
                    </template>

                    <template v-slot:append>
                        <v-btn
                            color="white"
                            icon="mdi-chat-processing-outline"
                            variant="text"
                            @click="$router.push('/message')"
                        ></v-btn>

                        <v-btn
                            :color=" !item.isAccepted ? 'grey-lighten-1' : 'green'"
                            icon="mdi-check-decagram"
                            variant="text"
                            @click="acceptBooking(item.index)"
                        ></v-btn>
                    </template>
                </v-list-item>

                <v-divider v-if="item.type == 'divider'" inset></v-divider>
            </div>

            <div v-if="nothing" class="nothing label-filter text-caption mx-auto">
                <div class="contenu">
                    <v-icon icon="mdi-alert-circle-outline"></v-icon>
                    <span>Aucun passager n'a été trouvé !</span>
                </div>
            </div>
        </v-list>
    </v-card>

    <!-- loading -->
    <v-overlay disabled :model-value="overlayLoad" class="align-center justify-center">
        <v-progress-circular color="blue" indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <!-- message error -->
    <v-snackbar
        v-model="showSnackbarError"
        :timeout="4000"
        color="error"
        style="z-index: 9999;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarError }}</span>
    </v-snackbar>

    <!-- message succes -->
    <v-snackbar
        v-model="showSnackbarSuccess"
        :timeout="4000"
        color="success"
        style="z-index: 9999;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarSuccess }}</span>
    </v-snackbar>

</template>



<!--  -->
<script>
    //import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState, mapActions } from 'vuex';

    // Components
    export default defineComponent({
        name: 'contacts-comp',
        emits: ["go-back"],
        computed: {
            ...mapState("trip", ["chat", "tripSelected"]),
            itemsContacts(){
                // console.log(this.tripSelected, this.chat.contacts);
                let items = [];
                const contacts = this.chat.contacts;
                // console.log("contacts-items", contacts, this.tripSelected);
                
                let seats = 0;
                items.push({type: "subheader", title: `${this.tripSelected.depart} - ${this.tripSelected.destination} à ${this.tripSelected.hour_start}`, seats: 0, max_seats:0});
                
                for (let index = 0; index < contacts.length; index++) {
                    items.push(
                        {
                            index: index,
                            userUid: contacts[index].user_id,
                            prependAvatar: contacts[index].avatar, 
                            title: contacts[index].username,
                            subtitle: `Aucune localisation`,
                            max_seats: contacts.length > 0 && contacts[0].booking != undefined && contacts[0].booking.length > 0 ? contacts[0].booking[0].max_seats : 0,
                            seats: contacts[index].booking != undefined ? contacts[index].booking.length : 0,
                            isAccepted: contacts[index].booking && contacts[index].booking.length > 0 && contacts[index].booking[0].is_accepted ? contacts[index].booking[0].is_accepted : false,
                        }
                    )
                    items.push({type: "divider", inset: true})
                    seats += contacts[index].booking && contacts[index].booking.length > 0 && contacts[index].booking[0].is_accepted ? contacts[index].booking.length : 0;
                }

                if( contacts.length > 0 && contacts[0].booking != undefined && contacts[0].booking.length > 0 ){
                    // items[0].title = `${items[0].title} places ${seats}/${contacts[0].booking.filter((booking) => booking.trip_id == this.tripSelected.id)[0].trip.max_seats}`;
                    items[0].max_seats = contacts[0].booking[0].trip.max_seats;
                    items[0].seats = seats;
                }

                return items;
            }
        },
        components: {
        },
        props: {
            nothing: {
                type: Boolean,
                default: false,
            }
        },
        data() {
            return {
                items: [
                    { type: 'subheader', title: 'Today' },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
                        title: 'Brunch this weekend?',
                        subtitle: `<span class="text-primary">Ali Connors</span> &mdash; I'll be in your neighborhood doing errands this weekend. Do you want to hang out?`,
                    },
                    { type: 'divider', inset: true },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/2.jpg',
                        title: 'Summer BBQ',
                        subtitle: `<span class="text-primary">to Alex, Scott, Jennifer</span> &mdash; Wish I could come, but I'm out of town this weekend.`,
                    },
                    { type: 'divider', inset: true },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/3.jpg',
                        title: 'Oui oui',
                        subtitle:
                            '<span class="text-primary">Sandra Adams</span> &mdash; Do you have Paris recommendations? Have you ever been?',
                    },
                    { type: 'divider', inset: true },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/4.jpg',
                        title: 'Birthday gift',
                        subtitle:
                            '<span class="text-primary">Trevor Hansen</span> &mdash; Have any ideas about what we should get Heidi for her birthday?',
                    },
                    { type: 'divider', inset: true },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/5.jpg',
                        title: 'Recipe to try',
                        subtitle:
                            '<span class="text-primary">Britta Holt</span> &mdash; We should eat this: Grate, Squash, Corn, and tomatillo Tacos.',
                    },
                ],
                overlayLoad: false,
                showSnackbarError: false,
                messageSnackbarError: "",
                messageSnackbarSuccess: "",
                showSnackbarSuccess: false,
            }
        },
        mounted() {
        },
        methods: {
            ...mapActions("trip", ["getContacts", "getProfilMember", "updateAccepteBooking"]),
            async goToProfil(userUid){
                const memberOk = await this.getProfilMember({userUid: userUid});
                if( memberOk )
                    this.$router.push('/member');
                else{
                    this.messageSnackbarError = "Nous avons pas pu récupérer ce profil";
                    this.showSnackbarError = true;
                }
            },
            async acceptBooking(index){
                console.log("index", index, this.chat.contacts);
                if( !this.chat.contacts[index].booking[0].is_accepted ){
                    const response = await this.updateAccepteBooking(index);
                    if(response.status != 0){
                        this.messageSnackbarError = response.message;
                        this.showSnackbarError = true;
                    }
                    else{
                        this.messageSnackbarSuccess = "La réservation de ce passager, à bien était validé !";
                        this.showSnackbarSuccess = true;
                    }
                }
                else{
                    this.messageSnackbarError = "Ce trajet à déjà était accepté";
                    this.showSnackbarError = true;
                }
            },
        },
        watch: {
            
        },
    });
</script>
