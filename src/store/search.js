// import { createStore } from 'vuex'
import store from '../store'; 

import { serverRequest } from '@/utils/serverApi.js';
import supabase from '@/utils/supabaseClient.js';
import router from '@/router';
import { normalizeTrip, isUpcomingOrActive, validTripPrice, MAX_TRACKING_LOOKBACK_MS } from '@/services/tripPresentation.js';
import { formaterDateUTC, tomorowDate } from '@/utils/utils.js'

const TRIP_SEARCH_SELECT = `
    id,
    driver_id,
    village_departure_id,
    village_arrival_id,
    departure_time,
    max_seats,
    price,
    route,
    car_id,
    cancellation_pending_at,
    car (*),
    account:public_profile (*),
    booking (
        *,
        account:public_profile (*)
    )`;

let searchGeneration = 0;
async function runSearch({ commit, getters, dispatch }, buildQuery, own = false) {
    const owner = store.state.profil.userUid;
    const generation = store.state.profil.accountGeneration;
    const request = ++searchGeneration;
    const current = () => request === searchGeneration && owner === store.state.profil.userUid && generation === store.state.profil.accountGeneration;
    commit('SET_SEARCH_STATE', { loading: true, error: '', warning: '' });
    commit('SET_TRAJETS', []);
    try {
        if (!await store.dispatch('auth/checkSessionOnly')) {
            if (current()) router.replace('/login');
            throw new Error('Votre session a expiré.');
        }
        if (!await dispatch('getVillages')) throw new Error('Impossible de charger les villages.');
        const { data, error } = await buildQuery(owner);
        if (!current()) return { status: 2, stale: true };
        if (error) throw error;
        const eligible = (data || []).filter(trip => !own || isUpcomingOrActive(trip));
        const rows = eligible
            .map(trip => normalizeTrip(trip, getters.GET_VILLAGE_BY_ID)).filter(Boolean);
        const incomplete = eligible.length !== rows.length || rows.some(trip => !trip.canReserve);
        commit('SET_TRAJETS', rows);
        commit('SET_SEARCH_STATE', { warning: incomplete ? 'Certains trajets ont des informations incomplètes et ne peuvent pas être réservés.' : '' });
        return { status: 0, data: rows, request };
    } catch {
        if (!current()) return { status: 2, stale: true };
        const message = 'Impossible de charger les trajets. Vérifiez la connexion puis réessayez.';
        commit('SET_TRAJETS', []);
        commit('SET_SEARCH_STATE', { error: message });
        return { status: 1, message };
    } finally {
        if (current()) commit('SET_SEARCH_STATE', { loading: false });
    }
}


export default {
    namespaced: true,
    state: {
        // user choice
        depart: "",
        destination: "",
        date: null,
        nbPassenger: 1,
        trajetSelected: {},
        // serveur
        villages: [],
        communesHistory: [],
        communesFrequency: {},
        trajets: [
        ],
        accounts: [],
        loading: false, error: '', warning: '',
    },
    getters: {
        getVillagesByName: (state) => (name) => {
            const normalizedName = String(name || '').trim().toLowerCase();
            if(!normalizedName) return undefined;
            return state.villages.find(
                (infoVillage) => String(infoVillage?.village || '').toLowerCase() === normalizedName
            );
        },
        GET_ID_VILLAGE_BY_NAME: (state) => (name) => {
            const normalizedName = String(name || '').trim().toLowerCase();
            const village = state.villages.find(
                (infoVillage) => String(infoVillage?.village || '').toLowerCase() === normalizedName
            );
            return village?.id ?? null;
        },
        GET_VILLAGE_BY_ID: (state) => (id) => {
            return state.villages.find((infoVillage) => infoVillage?.id == id)?.village || '';
        },
        GET_ACCOUNTS: (state) => {
            return state.accounts
        },
        historiqueTrie: (state) => {
            return Object.entries(state.communesFrequency)
                .sort((a, b) => b[1] - a[1])
                .map(item => item[0]);
        },
    },
    mutations: {
        SET_SEARCH_STATE(state, values) { Object.assign(state, values); },
        SET_VILLAGES(state, villages) {
            state.villages = villages;
        },
        SET_DEPART(state, depart){
            state.depart = depart;
        },
        SET_DESTINATION(state, destination){
            state.destination = destination;
        },
        SET_NB_PASSAGER(state, number){
            state.nbPassenger = number;
        },
        SET_TRAJETS(state, trips){
            state.trajets = trips;
        },
        SET_ACCOUNTS(state, accounts){
            state.accounts = accounts;
        },
        SET_TRAJET_SELECTED(state, trajet){
            state.trajetSelected = trajet;
        },
        ajouterCommune(state, commune) {
            if (state.communesFrequency[commune]) {
                state.communesFrequency[commune]++;
            }
            else {
                state.communesFrequency[commune] = 1;
            }
        },
        initialiserHistorique(state, historique) {
            state.communesFrequency = historique;
        },
    },
    actions: {
        ajouterAuHistorique({ commit }, commune) {
            commit('ajouterCommune', commune);
        },
        chargerHistorique({ commit, getters, state }) {
            const historiqueEnregistre = localStorage.getItem('communesFrequency');
            if (historiqueEnregistre) {
                commit('initialiserHistorique', JSON.parse(historiqueEnregistre));
                state.communesHistory = getters.historiqueTrie;
            }
        },
        sauvegarderHistorique({ state }) {
            localStorage.setItem('communesFrequency', JSON.stringify(state.communesFrequency));
        },
        async getVillages({ state, commit }) {
            if( state.villages.length == 0 ){
                const { data: villageList, error } = await supabase
                    .from('village_list')
                    .select('*');

                if(error){
                    console.error("Error, impossible de récuperer les villages :", error);
                    return false;
                }

                commit('SET_VILLAGES', villageList || []);
            }
            else {
                console.log("Get Villages Already done !", state.villages);
            }
            return true;
        },
        async getTrajets(context) {
            return runSearch(context, owner => supabase.from('trip').select(TRIP_SEARCH_SELECT)
                .neq('driver_id', owner).is('cancellation_pending_at', null));
        },
        async getTrajetsDate(context, infos) {
            return runSearch(context, owner => supabase.from('trip').select(TRIP_SEARCH_SELECT)
                .neq('driver_id', owner).gte('departure_time', formaterDateUTC(infos.date))
                .lt('departure_time', formaterDateUTC(tomorowDate(infos.date))).is('cancellation_pending_at', null));
        },
        async getTrajetsId(context, infos) {
            const owner = store.state.profil.userUid;
            const result = await runSearch(context, user => supabase.from('trip').select(TRIP_SEARCH_SELECT)
                .eq('id', Number(infos.ids)).gt('departure_time', new Date().toISOString())
                .neq('driver_id', user).is('cancellation_pending_at', null));
            if (result.status !== 0) return result;
            try {
                const { data, error } = await supabase.from('public_profile').select('user_id, firstname, lastname, avatar').eq('user_id', infos.user_uid);
                if (owner !== store.state.profil.userUid || result.request !== searchGeneration) return { status: 2, stale: true };
                if (error) throw error;
                return { status: 0, data: data || [] };
            } catch {
                if (owner === store.state.profil.userUid && result.request === searchGeneration) {
                    context.commit('SET_SEARCH_STATE', { error: 'Impossible de charger le trajet partagé.' });
                    context.commit('SET_TRAJETS', []);
                }
                return { status: 1, message: 'Impossible de charger le trajet partagé.' };
            }
        },
        async getOwnTrip(context) {
            return runSearch(context, owner => supabase.from('trip').select(TRIP_SEARCH_SELECT)
                .eq('driver_id', owner).gte('departure_time', new Date(Date.now() - MAX_TRACKING_LOOKBACK_MS).toISOString()), true);
        },
        async reserveTrajet({state}, payload = {}){
            const owner=store.state.profil.userUid,generation=store.state.profil.accountGeneration;
            const selectedTrip={...state.trajetSelected},seatsRequested=Number(state.nbPassenger);
            const current=()=>store.state.profil.userUid===owner&&store.state.profil.accountGeneration===generation;
            const stale=()=>({valided:false,stale:true,status:'SESSION_CHANGED',retriable:false,message:'Votre session ou votre sélection a changé.'});
            if(!owner || (payload.expectedOwner!==undefined&&payload.expectedOwner!==owner)
                || (payload.expectedGeneration!==undefined&&payload.expectedGeneration!==generation))return stale();
            const sessionChecked = await store.dispatch("auth/checkSessionOnly");
            if(!current())return stale();
            if( ! sessionChecked ){
                router.replace("/login");
                return {
                    valided: false,
                    message: "Votre session a expiré. Veuillez vous reconnecter.",
                    retriable: false,
                };
            }

            if(state.trajetSelected?.id!==selectedTrip.id||Number(state.nbPassenger)!==seatsRequested)return stale();
            if (selectedTrip?.canReserve === false || validTripPrice(selectedTrip?.price) === null) {
                return { valided: false, message: 'Les informations de ce trajet sont incomplètes. La réservation est indisponible.', retriable: false };
            }
            if( !selectedTrip || !selectedTrip.id ){
                return { valided: false, message: "Erreur lors de la sélection du trajet.", retriable: false };
            }
            if( !Number.isInteger(seatsRequested) || seatsRequested <= 0 || seatsRequested > 8 ){
                return { valided: false, message: "Le nombre de places demandé est invalide.", retriable: false };
            }
            if( !payload.requestId ){
                return { valided: false, message: "La demande de réservation est invalide.", retriable: false };
            }

            const typeUrl = store.state.profil.modeCo;
            try {
                const response = await serverRequest('post', '/bookings/reserve', {
                    expectedUserId:owner,
                    mode: typeUrl,
                    data: {
                        tripId: selectedTrip.id,
                        seats: seatsRequested,
                        requestId: payload.requestId,
                    },
                });
                if(!current())return stale();
                const reservation = response.data?.data;
                if( response.data?.status !== 'ok' || !reservation ){
                    throw new Error("Réponse de réservation invalide.");
                }

                const paymentMode = reservation.payment?.mode;
                const paymentAmount = Number(reservation.payment?.amount) || 0;
                store.state.profil.soldes = Number(reservation.credit) || 0;

                if (reservation.payment?.status === 'requires_action') {
                    return {
                        valided: false,
                        status: 'PAYMENT_ACTION_REQUIRED',
                        message: "Votre banque demande une authentification supplémentaire.",
                        retriable: true,
                        requestId: reservation.requestId,
                        paymentIntentId: reservation.payment.paymentIntentId,
                        clientSecret: reservation.payment.clientSecret,
                    };
                }

                // A replay is the same reservation returned after a timeout: do
                // not duplicate local history, pending amounts or notifications.
                store.state.trip.rating = true;
                if( !store.state.profil.history.datesTripPassenger.includes(selectedTrip.departure_time) ){
                    store.state.profil.history.datesTripPassenger.push(selectedTrip.departure_time);
                }
                if( !reservation.replayed ){
                    const currentPendingDebit = Number(store.state.profil.pendingDebit) || 0;
                    store.state.profil.pendingDebit = parseFloat((currentPendingDebit + paymentAmount).toFixed(2));

                }

                const baseMessage = reservation.accepted
                    ? "Votre réservation a été effectuée avec succès."
                    : "Votre demande est en attente de validation par le chauffeur.";
                const paymentMessage = paymentMode === 'wallet'
                    ? " Vos crédits sont réservés jusqu'à la validation du départ."
                    : " Le prélèvement sera confirmé une fois votre présence validée au départ.";

                return {
                    valided: true,
                    message: `${baseMessage}${paymentMessage}`,
                    accepted: Boolean(reservation.accepted),
                    replayed: Boolean(reservation.replayed),
                    requestId: reservation.requestId,
                    bookingIds: reservation.bookingIds,
                    data: {
                        id: reservation.tripId,
                        tripId: reservation.tripId,
                        bookingId: reservation.bookingIds?.[0] || null,
                        date: selectedTrip.departure_time,
                        driverAccountId: reservation.driverAccountId || selectedTrip.driver_account_id || null,
                    },
                    payment: reservation.payment,
                };
            }
            catch(error){
                if(!current()||error.code==='SESSION_CHANGED')return stale();
                console.error("reserveTrajet error:", error);
                const apiError = error.response?.data;
                return {
                    valided: false,
                    status: apiError?.code || 'RESERVATION_FAILED',
                    message: apiError?.message || "Nos serveurs sont actuellement indisponibles. Veuillez réessayer plus tard.",
                    retriable: apiError?.retriable !== false,
                };
            }
        },
    },
}
