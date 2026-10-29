<template>
    <section class="trip-chat" :style="visibleHeight ? {height:visibleHeight+'px'} : {}">
        <header class="chat-toolbar">
            <v-btn icon="mdi-chevron-left" aria-label="Retour au profil" variant="text" @click="$router.push('/profil')" />
            <div class="chat-peer-avatar" aria-hidden="true"><img v-if="activeContact?.avatar" :src="activeContact.avatar" alt="" /><v-icon v-else icon="mdi-account-circle-outline" size="40" /></div>
            <div class="chat-title"><strong>{{ activeContact?.username || 'Messages du trajet' }}</strong><small>{{ tripLabel }}</small></div>
            <v-btn prepend-icon="mdi-map-legend" variant="text" @click="openMap">Carte</v-btn>
        </header>
        <label v-if="isTripDriver && contacts.length" class="contact-select">Passager
            <select v-model="peerId" aria-label="Choisir un passager"><option v-for="contact in contacts" :key="contact.userId" :value="contact.userId">{{ contact.username }}{{ contact.unread ? ` · ${contact.unread} non lu(s)` : '' }}</option></select>
        </label>
        <p class="privacy-note">Messages texte conservés 15 jours après chaque envoi. Évitez les informations sensibles.</p>
        <p v-if="error" role="alert" class="chat-error">{{ error }} <button type="button" @click="reload">Réessayer le chargement</button></p>
        <p v-if="notice" role="status">{{ notice }}</p>
        <p v-if="loading" role="status">Chargement…</p>
        <div ref="history" class="chat-history" role="log" aria-label="Messages de cet échange" @scroll.passive="markVisibleRead">
            <v-btn v-if="nextCursor" variant="text" :loading="olderLoading" @click="loadOlder">Messages précédents</v-btn>
            <p v-if="showEmpty">{{ peerId ? 'Aucun message conservé pour cet échange.' : 'Aucun échange disponible pour ce trajet.' }}</p>
            <article v-for="message in messages" :key="message.clientId || message.id" class="chat-message" :class="{ own: message.from===userUid }" :data-message-id="message.id">
                <p>{{ message.text }}</p>
                <small class="message-meta">{{ formatTime(message.createdAt) }}<span v-if="message.from===userUid" class="message-status" role="img" :aria-label="messageStatus(message).label" :title="messageStatus(message).label"><v-icon :icon="messageStatus(message).icon" size="16" aria-hidden="true" /></span></small>
                <button v-if="message.error" type="button" @click="retry(message)">Réessayer cet envoi</button>
            </article>
        </div>
        <form v-if="peerId" class="chat-compose" @submit.prevent="send">
            <label class="sr-only" for="trip-chat-text">Votre message</label>
            <textarea id="trip-chat-text" v-model="draft" rows="2" maxlength="2000" :disabled="!canSend" placeholder="Écrire un message…" />
            <v-btn type="submit" icon variant="plain" color="info" class="chat-send" aria-label="Envoyer le message" :disabled="!canSend || !draft.trim()"><font-awesome-icon :icon="['fas','location-arrow']" aria-hidden="true" /></v-btn>
        </form>
        <p v-if="peerId && historyInitialized && !error && !canSend" class="privacy-note">L’envoi est fermé : réservation indisponible ou plus de 24 h après le départ. L’historique non expiré reste consultable.</p>
        <v-btn v-if="serverMessages.length" variant="text" class="report-button" @click="openReport">Signaler cet échange</v-btn>
        <v-dialog v-model="reportOpen" max-width="520">
            <v-card title="Signaler cet échange">
                <v-card-text>
                    <p>Les {{ reportIds.length }} derniers messages chargés de cet échange seront joints au signalement pour examen par l’administration. Le rapport sera supprimé à l’expiration du plus ancien message joint, sans dépasser les 15 jours depuis son envoi.</p>
                    <v-select v-model="reportReason" label="Motif" :items="reportReasons" item-title="title" item-value="value" />
                    <v-textarea v-model="reportDetails" label="Précisions facultatives" maxlength="1000" counter="1000" />
                    <p v-if="reportError" role="alert">{{ reportError }}</p>
                </v-card-text>
                <v-card-actions><v-btn :disabled="reportBusy" @click="reportOpen=false">Annuler</v-btn><v-btn :loading="reportBusy" @click="submitReport">Enregistrer le signalement</v-btn></v-card-actions>
            </v-card>
        </v-dialog>
    </section>
</template>
<script>
import supabase from '@/utils/supabaseClient.js';
import {observeSheetViewport} from '@/utils/sheetViewport.js';
import { mapState } from 'vuex';
import io from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { attachClientVersionListeners, createSocketAuth,getServerUrl } from '@/utils/serverApi.js';
import { createRequestId } from '@/utils/requestId.js';
import { chatRequest,conversationPath,mergeChatMessages,chatViewActive,chatMessageStatus } from '@/services/tripMessaging.js';
export default {
    name:'chat-view',
    data:()=>({ visibleHeight:0,stopViewport:null,roleDriverId:null,contactsLoaded:false,contacts:[],peerId:'',messages:[],draft:'',canSend:false,nextCursor:null,historyInitialized:false,loading:false,olderLoading:false,error:'',notice:'',
        socket:null,timer:null,foreground:true,appListener:null,epoch:0,disposed:false,reading:false,refreshing:false,
        reportOpen:false,reportReason:'harassment',reportDetails:'',reportRequestId:'',reportIds:[],reportBusy:false,reportError:'',
        reportReasons:[{title:'Harcèlement ou insultes',value:'harassment'},{title:'Comportement inquiétant',value:'unsafe'},{title:'Spam',value:'spam'},{title:'Autre',value:'other'}] }),
    computed:{
        ...mapState('profil',['userUid','modeCo']),...mapState('trip',['tripSelected']),
        activeContact(){return this.contacts.find(contact=>contact.userId===this.peerId)||null;},
        isTripDriver(){const driver=Number(this.tripSelected?.id)===this.tripId&&this.tripSelected?.driver_id?this.tripSelected.driver_id:this.roleDriverId;return Boolean(driver&&driver===this.userUid);},
        showEmpty(){return !this.loading&&!this.error&&!this.messages.length&&(this.peerId?this.historyInitialized&&!this.refreshing:this.contactsLoaded);},
        tripId(){return Number(this.$route.query.tripId || this.tripSelected?.id)||null;},
        tripLabel(){return Number(this.tripSelected?.id)===this.tripId && this.tripSelected.depart && this.tripSelected.destination ? `${this.tripSelected.depart} → ${this.tripSelected.destination}` : 'Échange conducteur / passager';},
        serverMessages(){return this.messages.filter(m=>m.id && !m.pending);},
    },
    async mounted(){
        this.stopViewport=observeSheetViewport(viewport=>{this.visibleHeight=viewport.height;});
        document.addEventListener('visibilitychange',this.viewChanged);window.addEventListener('focus',this.viewChanged);window.addEventListener('blur',this.viewChanged);
        if(Capacitor.isNativePlatform())this.appListener=await App.addListener('appStateChange',({isActive})=>{this.foreground=isActive;this.viewChanged();});
        if(this.disposed){this.appListener?.remove();return;}
        this.socket=io(getServerUrl(this.modeCo),{auth:createSocketAuth(),reconnection:true});
        attachClientVersionListeners(this.socket);
        this.socket.on('connect',()=>{this.notice='';this.restartHistory();this.reload();});
        this.socket.on('disconnect',()=>{this.notice='Connexion interrompue. Les envois non confirmés peuvent être réessayés sans doublon.';});
        this.socket.on('chat:changed',data=>{this.$store.dispatch('trip/refreshUnread');if(Number(data.tripId)===this.tripId)this.reload();});
        this.timer=setInterval(()=>{this.messages=mergeChatMessages(this.messages,[]);if(this.activeView()){this.presence();this.refreshHistory();this.$store.dispatch('trip/refreshUnread');}},5000);
        this.resolveChatRole();
        await this.reload();
    },
    beforeUnmount(){this.stopViewport?.();this.disposed=true;this.epoch++;this.$store.commit('trip/SET_ACTIVE_CHAT',null);this.socket?.emit('chat:presence',{active:false});this.socket?.disconnect();clearInterval(this.timer);this.appListener?.remove();
        document.removeEventListener('visibilitychange',this.viewChanged);window.removeEventListener('focus',this.viewChanged);window.removeEventListener('blur',this.viewChanged);},
    watch:{
        '$route.query.peerId'(value){if(this.contacts.some(c=>c.userId===value))this.peerId=value;},
        peerId(){this.epoch++;this.messages=[];this.nextCursor=null;this.historyInitialized=false;this.canSend=false;this.draft='';this.reportOpen=false;this.refreshHistory();},
        tripId(){this.reset();this.resolveChatRole();this.reload();},userUid(){this.reset();this.socket?.disconnect();this.$router.replace('/profil');},
    },
    methods:{
        messageStatus:chatMessageStatus,
        async resolveChatRole(){
            if(Number(this.tripSelected?.id)===this.tripId&&this.tripSelected?.driver_id)return;
            const owner=this.userUid,trip=this.tripId;if(!owner||!trip)return;
            try{const {data,error}=await supabase.from('trip').select('id,driver_id').eq('id',trip).maybeSingle();if(!error&&!this.disposed&&this.userUid===owner&&this.tripId===trip&&Number(data?.id)===trip)this.roleDriverId=data.driver_id;}catch{/* Unknown role keeps the participant selector hidden. */}
        },
        activeView(){return !this.disposed && chatViewActive({foreground:this.foreground,hidden:document.hidden,focused:document.hasFocus(),path:this.$route.path});},
        reset(){this.roleDriverId=null;this.contactsLoaded=false;this.$store.commit('trip/SET_ACTIVE_CHAT',null);this.epoch++;this.messages=[];this.contacts=[];this.peerId='';this.draft='';this.reportOpen=false;this.socket?.emit('chat:presence',{active:false});},
        presence(){const value={active:this.activeView() && Boolean(this.peerId),tripId:this.tripId,peerId:this.peerId};this.socket?.emit('chat:presence',value);this.$store.commit('trip/SET_ACTIVE_CHAT',value);},
        restartHistory(){this.messages=this.messages.filter(m=>!m.id);this.historyInitialized=false;this.nextCursor=null;},
        viewChanged(){this.presence();if(this.activeView()){this.restartHistory();this.refreshHistory();this.$store.dispatch('trip/refreshUnread');}},
        async reload(){
            if(!this.tripId||this.disposed)return;
            const epoch=this.epoch,trip=this.tripId;this.loading=true;
            try{const data=await chatRequest('get',`/trips/${trip}/conversations`,this.modeCo);if(epoch!==this.epoch||this.disposed)return;
                this.contacts=data.contacts;this.contactsLoaded=true;const preferred=this.$route.query.peerId;
                if(!this.contacts.some(c=>c.userId===this.peerId))this.peerId=this.contacts.find(c=>c.userId===preferred)?.userId||this.contacts[0]?.userId||'';
                else await this.refreshHistory();this.error='';
            }catch(error){if(epoch===this.epoch)this.error=error.response?.data?.code==='CHAT_MIGRATION_OR_SERVICE_UNAVAILABLE'?'La messagerie n’est pas encore disponible sur ce serveur. Réessayez après sa mise à jour.':'Impossible de charger cet échange. Vérifiez la connexion ou réessayez.';}
            finally{this.loading=false;}
        },
        async refreshHistory(){
            if(!this.peerId||this.refreshing||this.disposed)return;
            const epoch=this.epoch;this.refreshing=true;const box=this.$refs.history;const follow=!this.messages.length||(box&&box.scrollHeight-box.scrollTop-box.clientHeight<64);
            try{const data=await chatRequest('get',`${conversationPath(this.tripId,this.peerId)}/messages`,this.modeCo);
                if(epoch!==this.epoch||this.disposed)return;
                this.messages=mergeChatMessages(this.messages,data.messages);this.error='';this.canSend=data.canSend;if(!this.historyInitialized){this.nextCursor=data.nextCursor;this.historyInitialized=true;}
                this.presence();await this.$nextTick();if(follow&&box)box.scrollTop=box.scrollHeight;this.markVisibleRead();
            }catch{if(epoch===this.epoch)this.error='Historique indisponible. Aucun message n’a été effacé localement.';}
            finally{this.refreshing=false;if(epoch!==this.epoch&&!this.disposed)this.refreshHistory();}
        },
        async loadOlder(){
            if(this.olderLoading||!this.nextCursor)return;this.olderLoading=true;const epoch=this.epoch;
            try{const data=await chatRequest('get',`${conversationPath(this.tripId,this.peerId)}/messages?before=${encodeURIComponent(this.nextCursor)}`,this.modeCo);
                if(epoch!==this.epoch||this.disposed)return;this.messages=mergeChatMessages(this.messages,data.messages);this.nextCursor=data.nextCursor;
            }catch{this.error='Les messages précédents ne sont pas disponibles. Réessayez.';}finally{this.olderLoading=false;}
        },
        send(){if(!this.canSend||!this.draft.trim())return;const message={clientId:createRequestId(),from:this.userUid,to:this.peerId,text:this.draft,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+15*86400000).toISOString(),pending:true};this.messages.push(message);this.draft='';this.retry(this.messages.find(m=>m.clientId===message.clientId));this.$nextTick(()=>{const box=this.$refs.history;if(box)box.scrollTop=box.scrollHeight;});},
        async retry(message){
            if(message.sending)return;message.sending=true;message.pending=true;message.error=false;const epoch=this.epoch;
            try{const data=await chatRequest('post',`${conversationPath(this.tripId,message.to)}/messages`,this.modeCo,{clientId:message.clientId,text:message.text});
                if(epoch!==this.epoch||this.disposed)return;this.messages=mergeChatMessages(this.messages,[data.message]);this.error='';
            }catch{if(epoch===this.epoch){message.pending=false;message.error=true;}}finally{message.sending=false;}
        },
        async markVisibleRead(){
            if(!this.activeView()||this.reading||!this.peerId||!this.socket?.connected)return;
            const box=this.$refs.history;if(!box)return;const bounds=box.getBoundingClientRect();
            const visible=new Set([...box.querySelectorAll('[data-message-id]')].filter(el=>{const r=el.getBoundingClientRect();return r.top>=bounds.top&&r.bottom<=Math.min(bounds.bottom,window.innerHeight);}).map(el=>el.dataset.messageId));
            const ids=this.serverMessages.filter(m=>m.to===this.userUid&&!m.readAt&&visible.has(m.id)).map(m=>m.id).slice(0,100);
            if(!ids.length)return;this.reading=true;this.presence();const epoch=this.epoch;
            try{await chatRequest('post',`${conversationPath(this.tripId,this.peerId)}/read`,this.modeCo,{messageIds:ids});if(epoch===this.epoch)this.$store.dispatch('trip/refreshUnread');}
            catch{/* A failed receipt is retried only while this view stays active. */}finally{this.reading=false;}
        },
        openReport(){this.reportIds=this.serverMessages.slice(-50).map(m=>m.id);this.reportRequestId=createRequestId();this.reportDetails='';this.reportError='';this.reportOpen=true;},
        async submitReport(){if(this.reportBusy)return;this.reportBusy=true;const epoch=this.epoch;
            try{await chatRequest('post',`${conversationPath(this.tripId,this.peerId)}/reports`,this.modeCo,{messageIds:this.reportIds,requestId:this.reportRequestId,reason:this.reportReason,details:this.reportDetails});
                if(epoch!==this.epoch||this.disposed)return;this.reportOpen=false;this.notice='Signalement enregistré pour examen par l’administration.';
            }catch{this.reportError='Signalement non confirmé. Vous pouvez réessayer sans créer de doublon.';}finally{this.reportBusy=false;}
        },
        async openMap(){
            if(Number(this.tripSelected?.id)!==this.tripId){
                await Promise.all([this.$store.dispatch('profil/getTravels'),this.$store.dispatch('profil/getPublish')]);
                const profile=this.$store.state.profil.profil;
                const trip=[...(profile.myTravels||[]),...(profile.myPublish||[])].flatMap(day=>day.infos||[]).find(t=>Number(t.id)===this.tripId);
                if(!trip){this.error='La carte de ce trajet n’est plus disponible. L’échange conservé reste accessible.';return;}this.$store.commit('trip/SET_TRIP_SELECTED',trip);
            }
            this.$router.push('/trip');
        },
        formatTime(value){return new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));},
    },
};
</script>
<style scoped>
.trip-chat { display:flex; flex-direction:column; height:100dvh; padding-top:var(--safe-area-inset-top,0px); padding-bottom:var(--safe-area-inset-bottom,0px); background:rgb(var(--v-theme-background));color:rgb(var(--v-theme-on-background)); }
.chat-toolbar {display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid rgba(var(--v-theme-on-surface),.15);}.chat-title{flex:1;min-width:0;}.chat-title small{display:block;opacity:.7;}.contact-select{display:flex;align-items:center;gap:12px;padding:10px 16px;}.contact-select select{flex:1;min-height:44px;border:1px solid rgba(var(--v-theme-on-surface),.3);border-radius:8px;padding:6px;background:rgb(var(--v-theme-surface));color:rgb(var(--v-theme-on-surface));}
.privacy-note{font-size:12px;opacity:.8;margin:8px 16px;}.chat-history{flex:1;overflow:auto;padding:12px 16px;}.chat-message{width:fit-content;max-width:85%;margin:10px 0;padding:10px 14px;border-radius:14px;background:rgba(var(--v-theme-on-surface),.08);overflow-wrap:anywhere;}.chat-message p{white-space:pre-wrap;margin:0 0 6px;}.chat-message.own{margin-left:auto;background:rgb(0 209 255 / 40%);}.chat-message small{font-size:11px;opacity:.75;}.chat-message button,.chat-error button{display:block;min-height:44px;text-decoration:underline;}.chat-compose{display:flex;align-items:center;gap:10px;padding:12px 16px;}.chat-compose textarea{flex:1;min-width:0;resize:vertical;max-height:150px;border:1px solid rgba(var(--v-theme-on-surface),.3);border-radius:24px;padding:12px 16px;background:rgb(var(--v-theme-surface));color:rgb(var(--v-theme-on-surface));}.chat-error{margin:8px 16px;color:rgb(var(--v-theme-error));}.report-button{align-self:flex-start;margin-left:8px;}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);}
.chat-peer-avatar{width:44px;height:44px;flex:0 0 44px;border-radius:50%;overflow:hidden;display:grid;place-items:center}.chat-peer-avatar img{width:100%;height:100%;object-fit:cover}.chat-title strong{display:block;overflow-wrap:anywhere;font-size:16px}.chat-title small{font-size:12px}.message-meta{display:flex;align-items:center;justify-content:flex-end;gap:7px}.message-status{display:inline-flex;align-items:center}.chat-send{flex:0 0 48px;width:48px;height:48px}.chat-send :deep(svg){width:23px;height:23px;transform:rotate(45deg)}.chat-history{min-height:0;overscroll-behavior:contain}.chat-compose{padding-bottom:calc(12px + var(--safe-bottom,0px));background:rgb(var(--v-theme-surface))}.chat-compose textarea{min-height:48px;max-height:100px}.trip-chat{height:var(--chat-visible-height,100dvh)}
</style>
