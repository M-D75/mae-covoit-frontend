<template>
    <v-dialog :model-value="open" max-width="560" class="notification-dialog" transition="dialog-bottom-transition" @update:model-value="close">
        <section class="notification-panel" :class="{'is-dark':darkMode}" role="region" aria-label="Vos notifications">
            <div class="sheet-handle" aria-hidden="true" />
            <header class="inbox-header">
                <div class="inbox-emblem"><v-icon icon="mdi-bell-outline" size="25" /></div>
                <div class="inbox-heading"><p>VOTRE ACTIVITÉ</p><h2>Notifications <span v-if="unreadCount" class="count-pill">{{ unreadCount>99?'99+':unreadCount }}</span></h2></div>
                <button class="icon-button" aria-label="Fermer les notifications" @click="close"><v-icon icon="mdi-close" size="23" /></button>
            </header>
            <div class="inbox-controls">
                <div class="inbox-filters" role="group" aria-label="Filtrer les notifications">
                    <button :class="{selected:filter==='all'}" :aria-pressed="filter==='all'" @click="setFilter('all')">Tout</button>
                    <button :class="{selected:filter==='unread'}" :aria-pressed="filter==='unread'" @click="setFilter('unread')">Non lues <span v-if="unreadCount">{{ unreadCount>99?'99+':unreadCount }}</span></button>
                </div>
                <button class="text-button" :disabled="reading||!unreadCount" @click="markRead({all:true})"><v-icon icon="mdi-check-all" size="18" />Tout lire</button>
            </div>
            <div class="inbox-scroll" :aria-busy="loading">
                <div v-if="error" class="inbox-error" role="alert"><p>{{ error }}</p><button class="text-button" @click="refresh({keepPages:true})">Réessayer</button></div>
                <p v-if="readError" class="read-error" role="alert">{{ readError }}</p>
                <div v-if="loading&&!items.length" class="skeletons" aria-label="Chargement des notifications" role="status"><div v-for="n in 3" :key="n" class="skeleton-row"><span /><div><i /><i /></div></div></div>
                <template v-else>
                    <div v-if="filter==='unread'&&unreadCount>0&&!visibleItems.length&&!error&&!loading" class="inbox-empty" role="status"><p>Vos notifications sont en cours d’actualisation.</p><button class="text-button" @click="refresh()">Réessayer</button></div>
                    <div v-else-if="!visibleItems.length&&!error" class="inbox-empty" role="status">
                        <div class="empty-orbit"><v-icon :icon="filter==='unread'?'mdi-check-all':'mdi-bell-sleep-outline'" size="40" /></div>
                        <h3>{{ filter==='unread'?'Vous êtes à jour !':'Tout est calme pour le moment' }}</h3>
                        <p>{{ filter==='unread'?'Vos nouvelles notifications apparaîtront ici.':'Retrouvez ici les nouvelles de vos trajets, vos rappels et vos messages.' }}</p>
                    </div>
                    <div v-for="group in groups" :key="group.label" class="notification-group">
                        <h3>{{ group.label }}</h3>
                        <button v-for="item in group.items" :key="item.id" class="notification-row" :class="{'is-unread':!item.readAt}" :aria-label="`${item.readAt?'':'Non lue. '}${item.title}. ${item.body}`" @click="visit(item)">
                            <span class="event-icon" :class="item.data?.type==='chat'?'is-message':''"><v-icon :icon="icon(item)" size="22" /></span>
                            <span class="event-copy"><span class="event-line"><strong>{{ item.title }}</strong><span v-if="!item.readAt" class="unread-dot" aria-hidden="true" /></span><span class="event-body">{{ item.body }}</span><time :datetime="item.createdAt">{{ time(item.createdAt) }}</time></span>
                            <v-icon icon="mdi-chevron-right" size="18" class="event-chevron" />
                        </button>
                    </div>
                    <button v-if="nextCursor" class="load-more" :disabled="loadingMore||loading" @click="refresh({more:true})">{{ loadingMore?'Chargement…':'Voir les précédentes' }}</button>
                </template>
            </div>
            <footer class="inbox-footer"><v-icon icon="mdi-bell-check-outline" size="15" /><span>Les alertes système se règlent sur votre appareil.</span><button class="icon-button" :disabled="loading" aria-label="Actualiser les notifications" @click="refresh({keepPages:true})"><v-icon icon="mdi-refresh" size="19" /></button></footer>
        </section>
    </v-dialog>
</template>
<script>
import {mapState,mapActions,mapMutations} from 'vuex';
import {notificationTarget} from '@/services/tripNotifications.js';
import {notificationIcon,notificationTime,notificationGroup} from '@/services/notificationPresentation.js';
export default {
    name:'NotificationCenter',
    data:()=>({refreshTimer:null}),
    computed:{
        ...mapState('notifications',['open','filter','pagesLoaded','items','unreadCount','loading','loadingMore','reading','error','readError','nextCursor']),
        ...mapState('profil',['darkMode','userUid','accountGeneration']),
        visibleItems(){return this.items.filter(item=>this.filter==='all'||!item.readAt);},
        groups(){const groups=new Map();for(const item of this.visibleItems){const label=notificationGroup(item.createdAt);if(!groups.has(label))groups.set(label,[]);groups.get(label).push(item);}return [...groups].map(([label,items])=>({label,items}));},
    },
    watch:{
        accountGeneration(){this.reset();if(this.userUid)this.refresh();},
    },
    mounted(){
        if(this.userUid)this.refresh();
        this.refreshTimer=setInterval(this.refreshWhenVisible,30000);
        window.addEventListener('covia-notifications-changed',this.refreshWhenVisible);
        document.addEventListener('visibilitychange',this.refreshWhenVisible);
    },
    beforeUnmount(){clearInterval(this.refreshTimer);window.removeEventListener('covia-notifications-changed',this.refreshWhenVisible);document.removeEventListener('visibilitychange',this.refreshWhenVisible);},
    methods:{
        ...mapActions('notifications',['refresh','markRead','setFilter']),...mapMutations('notifications',{close:'CLOSE',reset:'RESET'}),
        icon:notificationIcon,time:notificationTime,
        refreshWhenVisible(){if(this.userUid&&!document.hidden&&!(this.open&&this.pagesLoaded>1))this.refresh();},
        async visit(item){
            if(this.reading)return;
            const owner=this.userUid,generation=this.accountGeneration;
            if(!item.readAt&&!await this.markRead({ids:[String(item.id)]}))return;
            if(this.userUid!==owner||this.accountGeneration!==generation)return;
            this.close();this.$router.push(notificationTarget(item.data));
        },
    },
};
</script>
<style scoped>
.notification-panel{--panel:#fff;--canvas:#f4f7fc;--ink:#182b43;--muted:#6c7b90;--line:#e9eef5;--tint:#edf5ff;--blue:#2578e5;--row:#f1f7ff;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:28px;overflow:hidden;box-shadow:0 24px 80px #10284726;display:flex;flex-direction:column;max-height:82dvh;font-family:inherit}
.notification-panel.is-dark{--panel:#1b1f26;--canvas:#252b35;--ink:#edf3fd;--muted:#a4b0c2;--line:#313a48;--tint:#213650;--blue:#7bb5ff;--row:#202f43;box-shadow:0 24px 80px #0006}
.sheet-handle{display:none;width:38px;height:4px;border-radius:3px;background:var(--line);margin:10px auto 0;flex-shrink:0}
.inbox-header{padding:24px 24px 20px;display:flex;align-items:center;gap:12px}.inbox-emblem{width:48px;height:48px;display:grid;place-items:center;border-radius:17px;background:var(--tint);color:var(--blue)}.inbox-heading{flex:1}.inbox-heading p{font-size:10px;font-weight:700;letter-spacing:1.7px;color:var(--muted);margin:0 0 3px}.inbox-heading h2{font-size:24px;line-height:1.25;letter-spacing:-.7px;font-weight:750;display:flex;align-items:center;gap:9px}.count-pill{font-size:12px;letter-spacing:0;padding:3px 8px;border-radius:10px;background:var(--tint);color:var(--blue)}
.icon-button{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;color:var(--muted);flex-shrink:0}.icon-button:hover{background:var(--canvas)}button{font:inherit;cursor:pointer}button:focus-visible{outline:3px solid var(--blue);outline-offset:2px}button:disabled{opacity:.45;cursor:default}
.inbox-controls{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 24px 18px;border-bottom:1px solid var(--line)}.inbox-filters{display:flex;gap:4px;background:var(--canvas);padding:4px;border-radius:14px}.inbox-filters button{font-size:12px;padding:8px 12px;border-radius:11px;color:var(--muted);font-weight:650;white-space:nowrap}.inbox-filters button.selected{background:var(--panel);color:var(--ink);box-shadow:0 2px 6px #1028470c}.inbox-filters span{margin-left:5px;color:var(--blue)}.text-button{color:var(--blue);font-size:12px;font-weight:650;display:inline-flex;align-items:center;gap:4px;min-height:40px;white-space:nowrap}
.inbox-scroll{overflow:auto;min-height:260px;overscroll-behavior:contain;padding:12px 12px 16px}.notification-group h3{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding:12px 12px 8px;font-weight:650}.notification-row{display:flex;align-items:flex-start;text-align:left;gap:12px;width:100%;padding:16px 12px;border-radius:17px;margin:3px 0;color:var(--ink);transition:background .15s}.notification-row:hover{background:var(--canvas)}.notification-row.is-unread{background:var(--row)}.event-icon{width:40px;height:40px;display:grid;place-items:center;flex-shrink:0;background:var(--canvas);border-radius:14px;color:var(--muted)}.is-unread .event-icon{background:var(--panel);color:var(--blue)}.event-copy{min-width:0;flex:1}.event-line{display:flex;align-items:center;gap:8px}.event-line strong{font-size:13px;line-height:1.4;font-weight:650}.unread-dot{margin-left:auto;width:7px;height:7px;border-radius:50%;background:var(--blue);flex-shrink:0}.event-body{display:block;font-size:12px;line-height:1.5;color:var(--muted);margin-top:4px;overflow-wrap:anywhere}.event-copy time{display:block;font-size:10px;color:var(--muted);margin-top:7px}.event-chevron{margin-top:12px;color:var(--muted);opacity:.5}
.inbox-footer{display:flex;align-items:center;gap:7px;border-top:1px solid var(--line);padding:9px 18px;color:var(--muted);font-size:10px}.inbox-footer span{flex:1}.inbox-footer .icon-button{width:30px;height:30px}.inbox-empty{text-align:center;padding:40px 24px;max-width:360px;margin:auto}.empty-orbit{margin:0 auto 20px;width:84px;height:84px;display:grid;place-items:center;border-radius:30px;background:var(--tint);color:var(--blue);box-shadow:0 0 0 10px var(--canvas);transform:rotate(-6deg)}.empty-orbit .v-icon{transform:rotate(6deg)}.inbox-empty h3{font-size:17px;letter-spacing:-.3px;margin-bottom:9px}.inbox-empty p{font-size:13px;line-height:1.7;color:var(--muted)}.inbox-error,.read-error{margin:8px 12px;padding:12px;border-radius:12px;background:var(--canvas);font-size:12px;color:var(--muted)}.load-more{display:block;margin:16px auto 0;color:var(--blue);font-size:12px;font-weight:650;min-height:44px}.skeleton-row{display:flex;gap:12px;padding:20px 12px}.skeleton-row>span{width:40px;height:40px;border-radius:14px;background:var(--canvas)}.skeleton-row>div{flex:1}.skeleton-row i{display:block;width:75%;height:12px;border-radius:6px;background:var(--canvas);margin:2px 0 10px}.skeleton-row i+i{width:95%}
@media(max-width:600px){.notification-dialog :deep(.v-overlay__content){align-self:flex-end;width:100%!important;max-width:100%!important;margin:0!important}.notification-panel{border-radius:28px 28px 0 0;padding-bottom:env(safe-area-inset-bottom,0px);max-height:86dvh}.sheet-handle{display:block}.inbox-header{padding:18px 20px}.inbox-controls{padding-left:20px;padding-right:20px}.inbox-heading h2{font-size:23px}}
</style>
