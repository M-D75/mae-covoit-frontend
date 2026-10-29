import { reactive } from 'vue';
import axios from 'axios';
import { getClientIdentity,getClientHeaders } from '@/utils/clientIdentity.js';
import { getServerUrl } from '@/utils/serverApi.js';
export const versionState=reactive({compatibility:null,identity:null,checking:false,offline:false,validUntil:0,developmentAllowed:false});
export function safeUpdateUrl(value,platform){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;
  if(platform==='android')return u.href==='https://play.google.com/store/apps/details?id=com.maecovoit.app'?u.href:null;
  if(platform==='ios')return u.hostname==='apps.apple.com'&&/id\d+$/.test(u.pathname)?u.href:null;
  return platform==='web'&&u.origin===window.location.origin?u.href:null;
 }catch{return null;}
}
export function createVersionChecker({state,identity,headers,request,storage,now=Date.now}){
 let pending=null,last=-Infinity,key=null,scope,epoch=0;
 function accept(value,until){
  if(!value||!['current','update_available','update_required'].includes(value.status))return false;
  if(value.status!=='current'&&(!value.published||!value.latestVersion))return false;
  if(value.status==='update_required'&&value.mode!=='enforce')return false;
  state.compatibility={...value,updateUrl:safeUpdateUrl(value.updateUrl,value.platform)};
  state.validUntil=until||now()+Math.min(300,Math.max(0,Number(value.cacheSeconds)||0))*1000;
  try{if(key)storage.setItem(key,JSON.stringify({value:state.compatibility,until:state.validUntil}));}catch{/* Optional cache, no personal data. */}
  return true;
 }
 async function check(force=false,mode){
  const changed=scope!==mode;if(changed){scope=mode;epoch++;state.compatibility=null;state.validUntil=0;last=-Infinity;}
  if(pending){if(!changed)return pending;await pending;if(scope===mode)return check(true,mode);return;}
  const generation=epoch;if(!force&&now()-last<30000)return;
  pending=(async()=>{state.checking=true;state.developmentAllowed=false;
   try{state.identity=await identity();if(generation!==epoch)return;const nextKey=`covia-release:${getServerUrl(mode)}:${JSON.stringify(state.identity)}`;
    if(key!==nextKey){key=nextKey;try{const cache=JSON.parse(storage.getItem(key));if(cache&&cache.until>now()&&cache.until<=now()+300000){accept(cache.value,cache.until);}}catch{/* No cache required. */}}
    const response=await request(await headers(),mode);if(generation!==epoch)return;if(response?.status==='unavailable'){state.compatibility=null;state.validUntil=0;state.offline=true;state.developmentAllowed=response.developmentAllowed===true;return;}if(!accept(response))throw Error('INVALID_RELEASE_POLICY');state.offline=false;
   }catch{if(generation!==epoch)return;state.offline=true;if(state.validUntil<=now()){state.compatibility=null;state.validUntil=0;}}
   finally{state.checking=false;last=now();}
  })().finally(()=>{pending=null;});return pending;
 }
 return {check,accept};
}
const checker=createVersionChecker({state:versionState,identity:getClientIdentity,headers:getClientHeaders,
 request:async (headers,mode)=>{try{return (await axios.get(`${getServerUrl(mode)}/client/compatibility`,{headers,params:{_:Date.now()},timeout:4000})).data.data;}catch(error){if(error.response?.status===503&&error.response.data?.code==='RELEASE_POLICY_UNAVAILABLE'&&error.response.data.data?.status==='unavailable')return error.response.data.data;throw error;}},
 storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)}});
export const checkCompatibility=checker.check;
export const acceptCompatibility=checker.accept;
