import { createClient } from '@supabase/supabase-js';
import {createAuthSessionGuard,browserSessionStorage} from '@/services/authSessionGuard.js';
import {getClientHeaders,notifyUpdateRequired} from '@/utils/clientIdentity.js';
export async function versionedFetch(input,init={}){
 let url;try{url=new URL(typeof input==='string'?input:input.url||String(input));}catch{return fetch(input,init);}
 const method=String(init.method||input?.method||'GET').toUpperCase();
 // Only publication needs these PostgREST headers. Do not change GoTrue/Auth
 // preflight requirements or delay session refresh on a native version read.
 if(!/\/rest\/v1\/trip$/.test(url.pathname)||method!=='POST')return fetch(input,init);
 const headers=new Headers(init.headers||(typeof Request!=='undefined'&&input instanceof Request?input.headers:undefined));
 for(const [key,value]of Object.entries(await getClientHeaders()))headers.set(key,value);
 const response=await fetch(input,{...init,headers});
 if(!response.ok)try{const error=await response.clone().json();if(error.message==='APP_UPDATE_REQUIRED')notifyUpdateRequired();}catch{/* Preserve original error response. */}
 return response;
}

const sessionGuard=createAuthSessionGuard({storage:browserSessionStorage(),fetch:versionedFetch});
const supabase = createClient(
    process.env.VUE_APP_API_SUPABASE_URL,
    process.env.VUE_APP_API_SUPABASE_KEY,
    {global:{fetch:sessionGuard.fetch},auth:{storage:sessionGuard.storage}}
);

sessionGuard.attach(supabase);
export default supabase;
