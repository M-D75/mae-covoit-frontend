import {Capacitor} from '@capacitor/core';
import {Share} from '@capacitor/share';
import {Clipboard} from '@capacitor/clipboard';
export function tripShareUrl(trip, origin=process.env.VUE_APP_PUBLIC_APP_URL||'https://tchap-tchap.yt') {
    const id=Number(trip?.id),driver=trip?.driver_id;
    if(!Number.isSafeInteger(id)||id<=0||typeof driver!=='string'||!/^[-a-f0-9]{36}$/i.test(driver))throw new Error('Ce trajet ne peut pas être partagé.');
    const base=new URL(origin);
    if(base.protocol!=='https:'&&!(base.protocol==='http:'&&['localhost','127.0.0.1'].includes(base.hostname)))throw new Error('Adresse de partage invalide.');
    return new URL(`/results/shared/${encodeURIComponent(driver)}/${id}`,base).toString();
}
const cancelled=error=>error?.name==='AbortError'||/cancelled|canceled|annul/i.test(error?.message||'');
export async function shareTrip(trip) {
    const url=tripShareUrl(trip);
    const title='Un trajet à partager · Covia';
    const text=[trip.depart,trip.destination].filter(Boolean).join(' → ')||'Retrouvez ce trajet sur Covia';
    if(Capacitor.isNativePlatform()){
        try{await Share.share({title,text,url,dialogTitle:'Partager ce trajet'});return 'shared';}
        catch(error){if(cancelled(error))return 'cancelled';}
        await Clipboard.write({string:url});return 'copied';
    }
    if(navigator.share){
        try{await navigator.share({title,text,url});return 'shared';}
        catch(error){if(cancelled(error))return 'cancelled';}
    }
    await navigator.clipboard.writeText(url);return 'copied';
}
