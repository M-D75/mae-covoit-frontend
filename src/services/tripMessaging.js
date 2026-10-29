import { serverRequest } from '@/utils/serverApi.js';
export const conversationPath = (tripId,peerId) => `/trips/${Number(tripId)}/conversations/${encodeURIComponent(peerId)}`;
export function mergeChatMessages(current,incoming,now=Date.now()) {
    const rows=[...current];
    for(const message of incoming) {
        const index=rows.findIndex(m => (message.id && m.id===message.id) || (message.clientId && m.clientId===message.clientId));
        if(index>=0) rows.splice(index,1,{...rows[index],...message,pending:false,error:false}); else rows.push(message);
    }
    return rows.filter(m=>!m.expiresAt||new Date(m.expiresAt).getTime()>now).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt) || String(a.id||'').localeCompare(String(b.id||''),undefined,{numeric:true}));
}
export const chatViewActive = ({foreground,hidden,focused,path}) => foreground && !hidden && focused && path==='/message';
export async function chatRequest(method,path,mode,data) {
    const result=await serverRequest(method,path,{mode,data,timeout:15000}); return result.data.data;
}

// UI receipts reflect only the persisted server acknowledgement, never delivery guesses.
export function chatMessageStatus(message){
 if(message.error)return {icon:'mdi-alert-circle-outline',label:'Échec d’envoi ou confirmation indisponible'};
 if(message.pending)return {icon:'mdi-clock-outline',label:'Envoi en cours'};
 if(!message.id)return {icon:'mdi-alert-circle-outline',label:'Confirmation indisponible'};
 return message.readAt?{icon:'mdi-check-all',label:'Lu'}:{icon:'mdi-check',label:'Enregistré sur le serveur'};
}
