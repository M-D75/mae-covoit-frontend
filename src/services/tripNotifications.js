import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { LocalNotifications } from '@capacitor/local-notifications';
import { serverRequest } from '@/utils/serverApi.js';
const uuid = value => typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function notificationTarget(input={}) {
    let data=input;
    if(typeof data.actions==='string'){try{data={...data,...JSON.parse(data.actions)};}catch{/* Ignore invalid legacy data. */}}
    else if(data.actions && typeof data.actions==='object')data={...data,...data.actions};
    const tripId=Number(data.tripId);
    if(!Number.isSafeInteger(tripId)||tripId<=0)return {path:'/profil'};
    const query={tripId:String(tripId)};
    if(data.type==='chat' && uuid(data.peerId))return {path:'/message',query:{...query,peerId:data.peerId}};
    if(data.goTo==='/trip')return {path:'/trip',query};
    if(['/profil/open-trip-driver','/profil/open-trip-passenger'].includes(data.goTo))return {path:data.goTo,query};
    return {path:'/profil',query};
}
export function notificationNumber(data={}) {
    const value=`${data.type||'trip'}:${data.tripId||''}:${data.peerId||''}`;
    let hash=2166136261;for(const c of value)hash=Math.imul(hash^c.charCodeAt(0),16777619);
    return (hash>>>0)%2147483646+1;
}
let installed=false,installing=false,owner=null;
const seen=new Map();
export async function installTripNotifications(store,router) {
    if(!Capacitor.isNativePlatform()||installing||!store.state.profil.userUid)return;
    const permission=await FirebaseMessaging.checkPermissions();if(permission.receive!=='granted')return;
    const register=async token=>{if(!token||!store.state.profil.userUid)return;await serverRequest('post','/registerDeviceToken',{mode:store.state.profil.modeCo,data:{registerDeviceToken:token}});store.commit('auth/SET_REGISTER_DEVICE_TOKEN',token);};
    if(installed){if(owner!==store.state.profil.userUid){const result=await FirebaseMessaging.getToken();await register(result.token);owner=store.state.profil.userUid;}return;}
    installing=true;
    try{
        if(Capacitor.getPlatform()==='android')for(const [id,name] of [['covia_messages','Messages du trajet'],['covia_trips','Réservations et rappels']]){
            await FirebaseMessaging.createChannel({id,name,importance:3,visibility:0});await LocalNotifications.createChannel({id,name,importance:3,visibility:0});
        }
        await FirebaseMessaging.addListener('tokenReceived',event=>{register(event.token).catch(()=>{});});
        const navigate=data=>{if(store.state.profil.userUid)router.push(notificationTarget(data));};
        await FirebaseMessaging.addListener('notificationActionPerformed',event=>navigate(event.notification?.data||{}));
        await LocalNotifications.addListener('localNotificationActionPerformed',event=>navigate(event.notification?.extra||{}));
        await FirebaseMessaging.addListener('notificationReceived',async event=>{
            const notification=event.notification||{},data=notification.data||{};
            if(!store.state.profil.userUid || !store.state.profil.notification || (data.expiresAt && new Date(data.expiresAt).getTime()<=Date.now()))return;
            store.dispatch('trip/refreshUnread');
            const active=store.state.trip.activeChat;
            if(data.type==='chat' && active?.active && Number(active.tripId)===Number(data.tripId) && active.peerId===data.peerId
                && !document.hidden && document.hasFocus())return;
            const key=data.eventId||notification.id||`${data.type}:${data.tripId}:${notification.title}:${notification.body}`;
            for(const [id,at] of seen)if(Date.now()-at>3600000)seen.delete(id);
            if(seen.has(key))return;seen.set(key,Date.now());
            const p=await LocalNotifications.checkPermissions();if(p.display!=='granted')return;
            await LocalNotifications.schedule({notifications:[{id:notificationNumber(data),title:notification.title||'Covia',body:data.type==='chat'?'Un message vous attend pour ce trajet.':notification.body||'Consultez votre trajet.',
                channelId:data.type==='chat'?'covia_messages':'covia_trips',smallIcon:'ic_trip_tracking',extra:data,group:`trip:${data.tripId||'general'}`} ]});
        });
        installed=true;const token=await FirebaseMessaging.getToken();await register(token.token);owner=store.state.profil.userUid;
    }finally{installing=false;}
}

export async function clearTripNotifications(store) {
    if(!Capacitor.isNativePlatform())return;
    owner=null;seen.clear();
    await Promise.allSettled([serverRequest('delete','/registerDeviceToken',{mode:store.state.profil.modeCo}),FirebaseMessaging.deleteToken(),LocalNotifications.removeAllDeliveredNotifications(),FirebaseMessaging.removeAllDeliveredNotifications()]);
    store.commit('auth/SET_REGISTER_DEVICE_TOKEN','');
}
