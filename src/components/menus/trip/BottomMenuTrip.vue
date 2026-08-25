
<style lang="scss" model>

</style>

<style lang="scss" scoped>
    //Animations
    /* The animation code */
    @keyframes warn-bad-to-good {
        from {background-color: #FF4949;}
        to {background-color: var(--blue-color);}
    }

    @keyframes warn-good-to-bad {
        from {background-color: var(--blue-color);}
        to {background-color: #FF4949;}
    }

    @keyframes warn-good-to-low {
        from {background-color: var(--blue-color);}
        to {background-color: #fa9801;}
    }

    @keyframes warn-low-to-good {
        from {background-color: #fa9801;}
        to {background-color: var(--blue-color);}
    }

    // global
    .label {
        font-size: 16px;
    }

    .closed {
        visibility: collapse;
        z-index: 0;
        pointer-events: none;
    }

    .sub-label-color {
        border-radius: 20px;
        background-color: var(--blue-color);
        color: white;
        text-transform: uppercase;
        text-align: center;
        font-weight: bold;
        width: 80%;
        margin: auto;
        &.warn-good-to-bad {
            background-color: #FF4949;
            animation-name: warn-good-to-bad;
            animation-duration: 1s;
        }
        &.warn-good-to-low {
            background-color: #fa9801;
            animation-name: warn-good-to-low;
            animation-duration: 1s;
        }
        &.warn-low-to-good {
            background-color: var(--blue-color);
            animation-name: warn-low-to-good;
            animation-duration: 1s;
        }
        &.warn-bad-to-good {
            background-color: var(--blue-color);
            animation-name: warn-bad-to-good;
            animation-duration: 1s;
        }
    }

    // struct
    .draggable{
        position: fixed;
        width: 100%;
        height: 50px;
        z-index: 2101;
        cursor: grab;
        touch-action: none;
        &.dragging, &.active {
            border: none;
        }
    }

    .v-container.bottom-menu {
        position: fixed;
        display: flex;
        flex-direction: column;
        padding: 16px 0;
        bottom: 0;
        border-radius: 30px 30px 0 0;
        background-color: var(--white-bg-color);
        color: var(--font-color-label);
        width: 100%;
        max-width: 100%;
        max-height: calc(100vh - 16px);
        max-height: calc(100dvh - 16px);
        overflow: hidden;
        z-index: 2100;
        transition: top 220ms cubic-bezier(0.22, 1, 0.36, 1);
        will-change: top;
        &.is-dragging{
            transition: none;
        }
        .sub-cont {
            height: max-content;
            min-height: 0;
            max-height: calc(100vh - 180px);
            max-height: calc(100dvh - 96px);
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            padding-bottom: calc(12px + var(--safe-area-inset-bottom, 0px));
            .bar-up {
                cursor: pointer;
                margin: auto;
                margin-top: 5px;
                width: 14.6%;
                border: 2px solid gray;
                border-radius: 10px;
                z-index: 999;
            }

            .select-time, .select-number {
                width: 85%;
                .label {
                    margin: 15px;
                    margin-top: 50px;
                }

                .v-btn {
                    margin: 30px auto;
                }
            }

            .select-day-hour-domicile, .select-day{
                width: 85%;
                .label {
                    margin: 35px;
                }

                .day-contain {
                    margin: auto;
                    display: flex;
                    width: 100%;
                    justify-content: space-around;
                    .day{
                        cursor: pointer;
                        display: grid;
                        align-content: center;
                        text-align: center;
                        width: 41px;
                        height: 41px;
                        background-color: gray;
                        border-radius: 100px;
                        text-transform: uppercase;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        &.selected {
                            background-color: var(--blue-color);
                        }
                    }
                }

                .v-btn {
                    margin: 30px auto;
                    font-weight: bold;
                }
            }


            //car
            div.card-contain{
                margin: auto;
                height: 85%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                //margin-top: 20px;
                .v-card.car {
                    margin: 10px auto;
                    padding: 5px 20px;
                    width: 90%;
                    border-radius: 16px;
                    background-color: var(--white-bg-color);
                    box-shadow: var(--box-shadow-card);
                    .v-list {
                        overflow: visible;
                        height: 56px;
                        display: flex;
                        justify-content: space-between;
                        .icon-container {
                            margin: auto 0;
                            .v-icon {
                                display: grid;
                                margin: auto;
                                font-size: 2em;
                            }
                        }
                        .model {
                            max-width: 170px;
                            margin: auto 15px !important;
                            width: 65%;
                            overflow-x: auto;
                            .text{
                                width: fit-content;
                                text-transform: uppercase;
                                font-weight: bold;
                                font-size: 16px;
                                white-space: nowrap;
                                color: var(--font-color-label);
                            }
                        }
                        .v-btn {
                            margin: auto 0;
                            box-shadow: none;
                            font-size: 1.2em;
                            color: var(--gray-icon-color);
                            &.active {
                                color: var(--blue-color);
                            }
                        }
                    }
                }
            }

            //credit-card
            .credit-card.card-contain {
                width: 90%;
                .bloc-saisi {
                    &.name{
                        width: 100%;
                        margin-top: 0;
                    }
                }
                .num-credit-card {
                    width: 100%;
                    margin: auto;
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                    > div {
                        width: 26%;
                    }
                }

                .date-cvc {
                    width: 100%;
                    margin: auto;
                    display: flex;
                    justify-content: space-between;
                    > div {
                        width: 40%;
                        margin: 30px 0;
                        &.date {
                            display: flex;
                            justify-content: center;
                            .month, .year {
                                width: 49%;
                            }
                            .slash {
                                margin: auto 0;
                                color: gray;
                            }
                        }
                    }
                    
                }
            }

            //password
            .password {
                padding: 0 40px;
                .label {
                    margin: 30px auto;
                    font-weight: bold;
                }
                .contain-input{
                    margin: 5px;
                    .label {
                        margin: 3px auto;
                        color: gray;
                        text-align: left;
                        font-size: 14px;
                    }
                    .v-text-field {
                        .v-input__control {
                            .v-field__field {
                                background-color: white;
                            }
                        }
                    }
                }
            }

            // map
            .map {
                width: 90%;
                margin: 10px auto;
                margin-bottom: 5px;
                .infos-route {
                    font-size: 25px;
                    font-weight: bold;
                    span.time {
                        color: rgb(0, 204, 0);
                    }
                    span.distance {
                        color: gray;
                        font-size: 17px;
                        font-weight: normal;
                    }
                }
                .infos-sup {
                    font-size: 13px;
                    color: gray;
                }
            }

            .alert{
                padding: 10px;
                .title{
                    text-align: center;
                    text-transform: capitalize;
                }
                .alert-icon-grid{
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 12px;
                    margin-bottom: 18px;
                }
                .alert-icon-btn{
                    min-width: 0;
                    width: 100%;
                    height: 58px;
                    border-radius: 18px;
                    box-shadow: var(--box-shadow-card);
                    background-color: var(--white-bg-color);
                    color: var(--font-color-label);
                    border: 1px solid rgba(0, 0, 0, 0.04);
                    &.is-selected{
                        color: white;
                        border-color: transparent;
                    }
                    .v-icon{
                        font-size: 24px;
                    }
                }
                .selected-alert-card{
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 14px;
                    border-radius: 18px;
                    background: rgba(2, 147, 247, 0.08);
                    margin-bottom: 14px;
                    .selected-alert-icon{
                        width: 44px;
                        height: 44px;
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                        flex-shrink: 0;
                        .v-icon{
                            font-size: 22px;
                        }
                    }
                    .selected-alert-text{
                        min-width: 0;
                    }
                    .selected-alert-label{
                        font-weight: 700;
                        color: var(--font-color-label);
                    }
                    .selected-alert-description{
                        margin-top: 2px;
                        color: var(--font-color-label);
                        opacity: 0.75;
                        font-size: 13px;
                        line-height: 1.3;
                    }
                }
                .duration-info{
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 14px;
                    border-radius: 12px;
                    background: rgba(2, 147, 247, 0.1);
                    &.is-dark{
                        background: rgba(255, 255, 255, 0.08);
                        color: #f5f5f5;
                    }
                    .label{
                        text-transform: uppercase;
                        font-size: 11px;
                        letter-spacing: 0.08em;
                        color: inherit;
                    }
                    .value{
                        font-weight: 600;
                        color: inherit;
                    }
                }
                .confirm-btn{
                    margin-top: 12px;
                    .v-btn{
                        font-weight: 600;
                        height: 42px;
                    }
                }
                &.is-dark{
                    .alert-icon-btn{
                        background-color: #242424;
                        border-color: rgba(255, 255, 255, 0.06);
                        color: #f5f5f5;
                    }
                    .selected-alert-card{
                        background: rgba(255, 255, 255, 0.06);
                        .selected-alert-label,
                        .selected-alert-description{
                            color: #f5f5f5;
                        }
                    }
                }
            }

            .alert-detail{
                padding: 10px;
                .title{
                    text-align: center;
                    text-transform: capitalize;
                }
                .detail-card{
                    border-radius: 22px;
                    padding: 16px;
                    background: rgba(2, 147, 247, 0.08);
                }
                .detail-head{
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 14px;
                }
                .detail-icon{
                    width: 52px;
                    height: 52px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    flex-shrink: 0;
                    .v-icon{
                        font-size: 26px;
                    }
                }
                .detail-title{
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--font-color-label);
                }
                .detail-subtitle{
                    margin-top: 2px;
                    font-size: 13px;
                    color: var(--font-color-label);
                    opacity: 0.72;
                }
                .detail-meta{
                    display: grid;
                    gap: 8px;
                    margin-bottom: 14px;
                }
                .detail-meta-row{
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.58);
                    color: var(--font-color-label);
                    .label{
                        font-size: 12px;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        opacity: 0.7;
                    }
                    .value{
                        font-weight: 700;
                    }
                }
                .detail-votes{
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                    margin-top: 14px;
                }
                .vote-btn{
                    height: 46px;
                    border-radius: 16px;
                    font-weight: 700;
                    text-transform: none;
                    &.is-active{
                        color: white;
                    }
                }
                &.is-dark{
                    .detail-card{
                        background: rgba(255, 255, 255, 0.06);
                    }
                    .detail-title,
                    .detail-subtitle{
                        color: #f5f5f5;
                    }
                    .detail-meta-row{
                        background: rgba(0, 0, 0, 0.18);
                        color: #f5f5f5;
                    }
                }
            }

            .passengers{
                padding: 10px;
                .title{
                    text-align: center;
                    text-transform: capitalize;
                }
                &.is-dark{
                    background-color: #1f1f1f;
                    color: #f5f5f5;
                    .title,
                    .text-caption{
                        color: #f5f5f5;
                    }
                    .v-list-item-title{
                        color: #f5f5f5;
                    }
                }
            }
        }

        .sub-cont-sup {
            flex-shrink: 0;
            //map
            .map {
                width: 90%;
                margin: 10px auto;
                margin-bottom: 5px;
                padding-bottom: 50px;
                .v-card {
                    border-radius: 20px;
                    box-shadow: var(--box-shadow-card);
                    &.v-card--variant-elevated, .v-card--variant-flat{
                        background: inherit;
                    }
                    .v-list{
                        .v-list-subheader {
                            color: var(--font-color-label) !important;
                        }

                        .v-list-item {
                            .v-list-item-title {
                                color: var(--font-color-label) !important;
                            }
                            .v-icon {
                                color: var(--font-color-label);
                            }
                        }
                    }
                }
            }
        }

        .passengers-dark-list{
            background-color: transparent;
        }
    }
</style>

<template>

    <vue3-draggable-resizable
        class-name="draggable"
        :class="[...className, {closed: !open_b}]"
        v-model:x="x"
        v-model:y="y"
        :axis="'y'"
        v-model:active="active"
        :draggable="true"
        :resizable="false"
        :disabledX="true"
        :disabledY="disabledY"
        :disabledW="true"
        :disabledH="true"
        @drag-start="onDragStart"
        @dragging="onDrag"
        @drag-end="onDragStop"
    >
    </vue3-draggable-resizable>

    <!--  -->
    <v-container
        class="bottom-menu"
        :class="[...className, {closed: !open_b, 'is-dragging': isDragging}]"
        :style="{top: `${y}px`}"
    >
        <div class="sub-cont" :class="className.join(' ')" ref="subCont">

            <div class="bar-up"></div>

            <!-- Map -->
            
            <div 
                v-if="mode=='map' && showRouteInfo"
                class="map"
            >
                <div class="infos-route">
                    <span class="time">{{ mapInfos.time }}</span> <span class="distance"> ({{ mapInfos.distance }})</span>
                </div>
                <div class="infos-sup" v-if="mapInfos.infosSup != ''">Le plus rapide selon l'etat actuel de la circulation</div>
            </div>

            <!-- End Map -->

            <!-- Signalement -->

            <div 
                v-if="mode=='alert'"
                :class="['alert', {'is-dark': isDarkMode}]"
            >
                <div class="title mb-2">Signaler un problème</div>
                <div class="alert-icon-grid">
                    <v-btn
                        v-for="type in alertTypes"
                        :key="type.value"
                        icon
                        :class="['alert-icon-btn', {'is-selected': selectedAlertType === type.value}]"
                        :style="selectedAlertType === type.value ? { backgroundColor: type.color } : {}"
                        @click="$emit('select-alert-type', type.value)"
                    >
                        <v-icon>{{ type.icon }}</v-icon>
                    </v-btn>
                </div>

                <div
                    v-if="selectedAlertTypeDef"
                    class="selected-alert-card"
                >
                    <div
                        class="selected-alert-icon"
                        :style="{ backgroundColor: selectedAlertTypeDef.color }"
                    >
                        <v-icon>{{ selectedAlertTypeDef.icon }}</v-icon>
                    </div>
                    <div class="selected-alert-text">
                        <div class="selected-alert-label">{{ selectedAlertTypeDef.label }}</div>
                        <div class="selected-alert-description">
                            {{ selectedAlertTypeDef.description || 'Choisissez ce type puis ajoutez le marqueur sur votre position actuelle.' }}
                        </div>
                    </div>
                </div>

                <div class="duration-info mb-3" :class="{'is-dark': isDarkMode}">
                    <span class="label">Durée estimée</span>
                    <span class="value">{{ alertDurationLabel }}</span>
                </div>

                <v-alert
                    v-if="!shareLocalisation"
                    type="warning"
                    density="comfortable"
                    variant="tonal"
                    class="mb-2"
                >
                    Activez le partage de localisation pour envoyer un signalement.
                </v-alert>
                <v-alert
                    v-else-if="!canSignal"
                    type="warning"
                    density="comfortable"
                    variant="tonal"
                    class="mb-2"
                >
                    Localisation indisponible. Réessayez dans quelques instants.
                </v-alert>

                <div class="confirm-btn">
                    <v-btn
                        block
                        rounded="xl"
                        color="primary"
                        class="text-none"
                        :disabled="!canSignal"
                        @click="$emit('confirm-alert')"
                    >
                        Ajouter un marqueur
                    </v-btn>
                </div>
            </div>

            <div
                v-if="mode=='alert-detail'"
                :class="['alert-detail', {'is-dark': isDarkMode}]"
            >
                <div class="title mb-2">Signalement</div>
                <div v-if="selectedAlert && selectedAlertTypeDef" class="detail-card">
                    <div class="detail-head">
                        <div
                            class="detail-icon"
                            :style="{ backgroundColor: selectedAlertTypeDef.color }"
                        >
                            <v-icon>{{ selectedAlertTypeDef.icon }}</v-icon>
                        </div>
                        <div>
                            <div class="detail-title">{{ selectedAlertTypeDef.label }}</div>
                            <div class="detail-subtitle">
                                {{ selectedAlertTypeDef.description || 'Signalement en cours sur cet axe.' }}
                            </div>
                        </div>
                    </div>

                    <v-alert
                        v-if="selectedAlertContextMessage"
                        type="info"
                        density="comfortable"
                        variant="tonal"
                        class="mb-3"
                    >
                        {{ selectedAlertContextMessage }}
                    </v-alert>

                    <v-alert
                        v-else-if="selectedAlertIsOwner"
                        type="info"
                        density="comfortable"
                        variant="tonal"
                        class="mb-3"
                    >
                        Vous avez créé ce signalement. Les autres usagers peuvent le confirmer ou l'infirmer.
                    </v-alert>

                    <div class="detail-meta">
                        <div class="detail-meta-row">
                            <span class="label">Signalé</span>
                            <span class="value">{{ formatAlertTime(selectedAlert.createdAt) }}</span>
                        </div>
                        <div class="detail-meta-row">
                            <span class="label">Expire</span>
                            <span class="value">{{ formatAlertTime(selectedAlert.expiresAt) }}</span>
                        </div>
                        <div class="detail-meta-row">
                            <span class="label">Validations</span>
                            <span class="value">{{ selectedAlert.confirmCount || 0 }}</span>
                        </div>
                        <div class="detail-meta-row">
                            <span class="label">Invalidations</span>
                            <span class="value">{{ selectedAlert.invalidateCount || 0 }}</span>
                        </div>
                    </div>

                    <div class="detail-votes">
                        <v-btn
                            class="vote-btn"
                            :class="{ 'is-active': selectedAlertVoteState === 'confirm' }"
                            :color="selectedAlertVoteState === 'confirm' ? 'green-darken-1' : undefined"
                            :variant="selectedAlertVoteState === 'confirm' ? 'flat' : 'outlined'"
                            :disabled="!canVoteSelectedAlert || alertVoteLoading"
                            :loading="alertVoteLoading && alertVoteAction === 'confirm'"
                            prepend-icon="mdi-thumb-up"
                            @click="$emit('vote-alert', 'confirm')"
                        >
                            Valider
                        </v-btn>
                        <v-btn
                            class="vote-btn"
                            :class="{ 'is-active': selectedAlertVoteState === 'invalidate' }"
                            :color="selectedAlertVoteState === 'invalidate' ? 'red-darken-1' : undefined"
                            :variant="selectedAlertVoteState === 'invalidate' ? 'flat' : 'outlined'"
                            :disabled="!canVoteSelectedAlert || alertVoteLoading"
                            :loading="alertVoteLoading && alertVoteAction === 'invalidate'"
                            prepend-icon="mdi-thumb-down"
                            @click="$emit('vote-alert', 'invalidate')"
                        >
                            Infirmer
                        </v-btn>
                    </div>
                </div>

                <v-alert
                    v-else
                    type="warning"
                    density="comfortable"
                    variant="tonal"
                >
                    Ce signalement n'est plus disponible.
                </v-alert>
            </div>

            <div
                v-if="mode=='passengers'"
                :class="['passengers', {'is-dark': isDarkMode}]"
            >
                <div class="title mb-2">Passagers</div>
                <div 
                    v-if="passengerBookings.length === 0"
                    class="text-caption text-medium-emphasis text-center my-4"
                >
                    Aucun passager confirmé.
                </div>
                <v-list
                    v-else
                    density="compact"
                    :class="{'passengers-dark-list': isDarkMode}"
                >
                    <v-list-item
                        v-for="booking in passengerBookings"
                        :key="booking.id"
                    >
                        <template #prepend>
                            <v-avatar size="32">
                                <template v-if="booking.account && booking.account.avatar">
                                    <v-img :src="booking.account.avatar" />
                                </template>
                                <template v-else>
                                    <span class="text-caption">{{ bookingInitials(booking) }}</span>
                                </template>
                            </v-avatar>
                        </template>
                        <v-list-item-title>{{ bookingName(booking) }}</v-list-item-title>
                        <template #append>
                            <div class="d-flex align-center">
                                <v-chip
                                    :color="booking.in_car ? 'green' : 'orange'"
                                    size="small"
                                    variant="flat"
                                    label
                                    class="mr-2"
                                >
                                    <v-icon
                                        start
                                        size="16"
                                    >
                                        {{ booking.in_car ? 'mdi-check-circle' : 'mdi-timer-sand' }}
                                    </v-icon>
                                    {{ booking.in_car ? 'Confirmé' : 'En attente' }}
                                </v-chip>
                                <v-btn
                                    v-if="isDriver && !booking.in_car"
                                    size="small"
                                    variant="text"
                                    color="red"
                                    icon
                                    :loading="noShowProcessingId === booking.id"
                                    :disabled="noShowProcessingId === booking.id"
                                    @click.stop="$emit('mark-passenger-no-show', booking)"
                                >
                                    <v-icon>mdi-account-off</v-icon>
                                </v-btn>
                            </div>
                        </template>
                    </v-list-item>
                </v-list>
            </div>
            
        </div>

        <!-- sub-cont-sup -->
        <div class="sub-cont-sup" :class="className.join(' ')" ref="subContSup">
            <!-- Map -->
            <div
                v-if="mode=='map' && showRouteInfo"
                class="map"
            >
                <v-card
                    class="mx-auto"
                >
                    <v-list density="compact">
                        <v-list-subheader>ITINERAIRE</v-list-subheader>
                        <!-- <v-divider></v-divider> -->

                        <!-- dep -->
                        <v-list-item
                            color="primary"
                        >
                            <template v-slot:prepend>
                                <v-icon icon="mdi-google-maps"></v-icon>
                            </template>

                            <v-list-item-title v-text="mapInfos.depart"></v-list-item-title>
                        </v-list-item>

                        <v-divider></v-divider>

                        <!-- destination -->
                        <v-list-item
                            color="primary"
                        >
                            <template v-slot:prepend>
                                <v-icon icon="mdi-crosshairs-gps"></v-icon>
                            </template>

                            <v-list-item-title v-text="mapInfos.destination"></v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card>
            </div>
        </div>
    </v-container>

    <!-- message error -->
    <v-snackbar
        v-model="showSnackbarError"
        :timeout="4000"
        color="error"
        style="z-index: 99999;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarError }}</span>
    </v-snackbar>


    <!-- message succes -->
    <v-snackbar
        v-model="showSnackbarSuccess"
        :timeout="4000"
        color="success"
        style="z-index: 99999;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarSuccess }}</span>
    </v-snackbar>


</template>


<!--  -->
<script>
    import { defineComponent } from 'vue';
    //import supabase from '@/utils/supabaseClient';

    // Components
    import Vue3DraggableResizable from 'vue3-draggable-resizable';
    import { clampSheetTop, selectSheetSnap } from '@/utils/bottomSheet.js';
    

    export default defineComponent({
        name: 'bottom-menu',
        emits: ["opened", "close", "alert", "select-alert-type", "confirm-alert", "mark-passenger-no-show", "vote-alert"],
        components: {
            Vue3DraggableResizable,
        },
        computed: {
            numericRule() {
                return (value) => /^\d*$/.test(value) || 'Veuillez entrer uniquement des chiffres';
            },
            numericMask() {
                return { regex: /^[0-9]*$/ };
            },
            selectedAlertTypeDef() {
                const alertType = this.alertTypeByValue(this.mode === 'alert-detail' ? this.selectedAlert?.type : this.selectedAlertType);
                return alertType || null;
            },
        },
        props: {
            mode: {
                type: String,
                default: "history",
            },
            labelSelectorN1: {
                type: String,
                default: "LABEL-SELECTOR",
            },
            labelSelectorN2: {
                type: String,
                default: "LABEL-SELECTOR-2",
            },
            className: {
                type: Array,
                default: () => ([]),
            },
            timeInit: {
                type: Object,
                default() {
                    return {
                            hourInit: 1,
                            minuteInit: 8,
                        };
                },
            },
            mapInfos: {
                type: Object,
                default() {
                    return {
                        time: "",
                        distance: "",
                        infosSup: "Le plus rapide selon l'etat actuel de la circulation",
                        depart: "Tsingoni",
                        destination: "Mamoudzou"
                    };
                },
            },
            showRouteInfo: {
                type: Boolean,
                default: true,
            },
            about: {
                type: String,
                default: "discution",
            },
            alertTypes: {
                type: Array,
                default: () => ([]),
            },
            selectedAlertType: {
                type: String,
                default: "",
            },
            alertDurationLabel: {
                type: String,
                default: "",
            },
            canSignal: {
                type: Boolean,
                default: false,
            },
            shareLocalisation: {
                type: Boolean,
                default: true,
            },
            passengerBookings: {
                type: Array,
                default: () => ([]),
            },
            noShowProcessingId: {
                type: [String, Number, null],
                default: null,
            },
            isDriver: {
                type: Boolean,
                default: false,
            },
            isDarkMode: {
                type: Boolean,
                default: false,
            },
            selectedAlert: {
                type: Object,
                default: null,
            },
            selectedAlertContextMessage: {
                type: String,
                default: "",
            },
            canVoteSelectedAlert: {
                type: Boolean,
                default: false,
            },
            selectedAlertVoteState: {
                type: String,
                default: "",
            },
            selectedAlertIsOwner: {
                type: Boolean,
                default: false,
            },
            alertVoteLoading: {
                type: Boolean,
                default: false,
            },
            alertVoteAction: {
                type: String,
                default: "",
            },
        },
        data() {
            return {
                numericValues: ['', '', '', '', '', '', ''],
                x: 0,
                y: 0,
                notif: false,
                active: true,
                disabledY: false,
                sizeScreen: 0,
                isDragging: false,
                sheetState: "closed",
                dragStartY: 0,
                dragStartState: "closed",
                subContHeigth: 0,
                subContSupHeigth: 0,
                open_b: false,
                contentResizeObserver: null,
                contentResizeFrame: null,
                viewportResizeFrame: null,
                showSnackbarError: false,
                messageSnackbarError: "",
                showSnackbarSuccess: false,
                messageSnackbarSuccess: "",
            }
        },
        mounted() {
            this.refreshSheetMetrics();
            this.y = this.sizeScreen;
            if(typeof ResizeObserver !== 'undefined'){
                this.contentResizeObserver = new ResizeObserver(this.scheduleContentReposition);
                if(this.$refs.subCont){
                    this.contentResizeObserver.observe(this.$refs.subCont);
                }
                if(this.$refs.subContSup){
                    this.contentResizeObserver.observe(this.$refs.subContSup);
                }
            }
            window.addEventListener('resize', this.scheduleViewportReposition);
            window.visualViewport?.addEventListener('resize', this.scheduleViewportReposition);
        },
        beforeUnmount(){
            this.contentResizeObserver?.disconnect();
            window.removeEventListener('resize', this.scheduleViewportReposition);
            window.visualViewport?.removeEventListener('resize', this.scheduleViewportReposition);
            if(this.contentResizeFrame){
                cancelAnimationFrame(this.contentResizeFrame);
            }
            if(this.viewportResizeFrame){
                cancelAnimationFrame(this.viewportResizeFrame);
            }
        },
        methods: {
            refreshSheetMetrics(){
                this.sizeScreen = Math.round(window.visualViewport?.height || window.innerHeight || 0);
                // scrollHeight measures the real content even when the sheet is
                // currently clipped in its preview position.
                this.subContHeigth = this.$refs.subCont ? this.$refs.subCont.scrollHeight : 0;
                this.subContSupHeigth = this.$refs.subContSup ? this.$refs.subContSup.scrollHeight : 0;
            },
            getSafeTop(){
                const styles = getComputedStyle(document.documentElement);
                const inset = Number.parseFloat(styles.getPropertyValue('--safe-area-inset-top')) || 0;
                return Math.max(16, inset + 12);
            },
            getExpandedTopPosition(){
                this.refreshSheetMetrics();
                const safeTop = this.getSafeTop();
                const naturalHeight = Math.max(
                    180,
                    this.subContHeigth + this.subContSupHeigth + 32
                );
                const visibleHeight = Math.min(naturalHeight, this.sizeScreen - safeTop);
                return Math.max(safeTop, this.sizeScreen - visibleHeight);
            },
            getPeekTopPosition(){
                const expandedTop = this.getExpandedTopPosition();
                const naturalHeight = this.sizeScreen - expandedTop;
                const desiredHeight = this.mode === 'alert'
                    ? Math.min(480, Math.max(320, this.sizeScreen * 0.48))
                    : Math.min(420, Math.max(260, this.sizeScreen * 0.4));
                const peekHeight = Math.min(naturalHeight, desiredHeight);
                return Math.max(expandedTop, this.sizeScreen - peekHeight);
            },
            getInitialSheetState(){
                return this.mode === 'alert' ? 'peek' : 'expanded';
            },
            getPositionForState(state){
                if(state === 'expanded') return this.getExpandedTopPosition();
                if(state === 'peek') return this.getPeekTopPosition();
                return this.sizeScreen;
            },
            setSheetState(state){
                this.sheetState = state;
                this.y = Math.round(this.getPositionForState(state));
            },
            scheduleContentReposition(){
                if(!this.open_b || this.isDragging || this.contentResizeFrame) return;
                this.contentResizeFrame = requestAnimationFrame(() => {
                    this.contentResizeFrame = null;
                    const nextY = Math.round(this.getPositionForState(this.sheetState));
                    if(Math.abs(nextY - this.y) > 1){
                        this.y = nextY;
                    }
                });
            },
            scheduleViewportReposition(){
                if(this.viewportResizeFrame) return;
                this.viewportResizeFrame = requestAnimationFrame(() => {
                    this.viewportResizeFrame = null;
                    this.refreshSheetMetrics();
                    this.y = Math.round(this.getPositionForState(this.open_b ? this.sheetState : 'closed'));
                });
            },
            alertTypeByValue(value){
                return this.alertTypes.find((type) => type.value === value) || null;
            },
            formatAlertTime(timestamp){
                if( !timestamp ){
                    return "--:--";
                }
                return new Date(timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            },
            bookingName(booking){
                if(booking?.account){
                    if(booking.account.firstname || booking.account.lastname){
                        return `${booking.account.firstname || ''} ${booking.account.lastname || ''}`.trim() || booking.account.username || "Passager";
                    }
                    return booking.account.username || "Passager";
                }
                return "Passager";
            },
            bookingInitials(booking){
                if(booking?.account){
                    const first = booking.account.firstname ? booking.account.firstname.charAt(0) : '';
                    const last = booking.account.lastname ? booking.account.lastname.charAt(0) : '';
                    const initials = `${first}${last}`.trim();
                    if(initials.length > 0){
                        return initials.toUpperCase();
                    }
                    if(booking.account.username){
                        return booking.account.username.substring(0, 2).toUpperCase();
                    }
                }
                return "P";
            },
            onDragStart(pos) {
                if(!this.open_b) return;

                this.isDragging = true;
                this.dragStartY = Number.isFinite(Number(pos?.y))
                    ? Number(pos.y)
                    : this.y;
                this.dragStartState = this.sheetState;
            },
            onDrag(pos) {
                if(!this.open_b) return;
                this.isDragging = true;
                this.disabledY = false;

                const expandedTop = this.getExpandedTopPosition();
                this.y = Math.round(clampSheetTop(pos.y, expandedTop, this.sizeScreen));
            },
            onDragStop(pos) {
                if(!this.open_b) return;
                this.isDragging = false;
                this.active = true;
                this.disabledY = false;

                const expandedTop = this.getExpandedTopPosition();
                const peekTop = this.getPeekTopPosition();
                const targetState = selectSheetSnap({
                    releasedY: pos.y,
                    expandedTop,
                    peekTop,
                    viewportHeight: this.sizeScreen,
                    originY: this.dragStartY,
                    originState: this.dragStartState,
                });
                this.dragStartY = 0;
                this.dragStartState = 'closed';
                if(targetState === 'closed'){
                    this.close();
                    return;
                }

                // Never retain a random intermediate position: release always
                // snaps to either the content-sized expanded state or preview.
                this.setSheetState(targetState);
            },
            async open(){
                await this.$nextTick();
                this.refreshSheetMetrics();
                const wasOpen = this.open_b;
                this.open_b = true;
                this.isDragging = false;
                this.dragStartY = 0;
                this.dragStartState = 'closed';
                this.active = true;
                this.disabledY = false;
                this.setSheetState(this.getInitialSheetState());
                if(!wasOpen){
                    this.$emit('opened');
                }
                return true;
            },
            async openMiddle(){
                await this.$nextTick();
                this.refreshSheetMetrics();
                const wasOpen = this.open_b;
                this.open_b = true;
                this.isDragging = false;
                this.dragStartY = 0;
                this.dragStartState = 'closed';
                this.active = true;
                this.disabledY = false;
                this.setSheetState('peek');
                if(!wasOpen){
                    this.$emit('opened');
                }
                return true;
            },
            close(){
                if(!this.open_b) return false;

                this.isDragging = false;
                this.dragStartY = 0;
                this.dragStartState = 'closed';
                this.open_b = false;
                this.setSheetState('closed');

                // Reload only for the legacy reservation notification flow.
                if(this.mode === "reserve" && this.notif){
                    this.$router.replace("/");
                }
                this.$emit('close');
                return false;
            },
            emit(value){
                if( value == "time-valided" ){
                    if(this.$refs.TimeCardRef){
                        this.time = this.$refs.TimeCardRef.getTime();
                    }
                }
                else if( value == "time-changed" ){
                    this.time = this.$refs.TimeCardRef.getTime();
                    console.log("emit-time-changed", this.time)
                }
                else if( value == "select-price" ){
                    this.numberSelected = this.$refs.SelectNumberRef.number;
                }
                this.$emit(value)
            },
        },
        watch:{
            mode(){
                if(!this.open_b) return;
                this.$nextTick(() => {
                    this.setSheetState(this.getInitialSheetState());
                });
            },
        }
   });
</script>
