import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import release from '../../release.json';
let pending;
export async function getClientIdentity(){
 if(!pending)pending=(async()=>{
  const platform=Capacitor.getPlatform();
  if(Capacitor.isNativePlatform()){
   let timeout;let info;try{info=await Promise.race([App.getInfo(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('VERSION_IDENTITY_TIMEOUT')),1500);})]);}finally{clearTimeout(timeout);}
   return Object.freeze({platform,build:String(info.build),version:info.version,bundle:Number(release.web.build),protocol:release.protocol});
  }
  return Object.freeze({platform:'web',build:release.web.build,version:release.web.version,bundle:Number(release.web.build),protocol:release.protocol});
 })().catch(error=>{pending=null;throw error;});
 return pending;
}
export async function getClientHeaders(){
 let client;try{client=await getClientIdentity();}catch{client={platform:Capacitor.getPlatform(),build:'0',bundle:Number(release.web.build),protocol:release.protocol};}
 return {'x-covia-platform':client.platform,'x-covia-build':client.build,'x-covia-bundle':String(client.bundle),'x-covia-protocol':String(client.protocol)};
}
export function notifyUpdateRequired(compatibility){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('covia-update-required',{detail:compatibility}));}
