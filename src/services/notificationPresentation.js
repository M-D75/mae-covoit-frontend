export function notificationIcon(item){
    if(item.data?.type==='chat')return 'mdi-message-text-outline';
    if(item.data?.type==='reminder')return 'mdi-clock-outline';
    return 'mdi-car-outline';
}
export function notificationGroup(date,now=new Date()){
    const day=new Date(date);if(!Number.isFinite(day.getTime()))return 'Plus tôt';
    const today=new Date(now);today.setHours(0,0,0,0);
    if(day>=today)return 'Aujourd’hui';
    today.setDate(today.getDate()-1);return day>=today?'Hier':'Plus tôt';
}
export function notificationTime(date,now=Date.now()){
    const time=new Date(date).getTime();if(!Number.isFinite(time))return '';
    const minutes=Math.max(0,Math.floor((now-time)/60000));
    if(minutes<1)return 'À l’instant';if(minutes<60)return `Il y a ${minutes} min`;
    if(minutes<24*60)return `Il y a ${Math.floor(minutes/60)} h`;
    return new Date(time).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
}
