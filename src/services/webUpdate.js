// An explicit click only. Never delete caches, reload on resume, or stop GPS.
export async function updateWebApp({navigatorObject=navigator,locationObject=window.location,storage=sessionStorage,fetchObject=fetch,attemptKey,currentBuild='0',expectedBuild,basePath=process.env.BASE_URL||'/'}){
 const url=new URL(`${basePath.replace(/\/?$/,'/')}release.json`,new URL(locationObject.href).origin);url.searchParams.set('_',String(Date.now()));
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);
 try{const response=await fetchObject(url.href,{cache:'no-store',redirect:'error',signal:controller.signal});if(!response.ok)throw Error();const manifest=await response.json();if(!/^\d{1,9}$/.test(String(manifest.build)) || Number(manifest.build)<=Number(currentBuild) || (expectedBuild&&Number(manifest.build)<Number(expectedBuild)))throw Error();}
 catch{throw new Error('La version en ligne ne peut pas être vérifiée. Réessayez avec une connexion.');}finally{clearTimeout(timer);}
 let attempted=false;try{attempted=Boolean(storage.getItem(attemptKey));}catch{/* Private mode. */}
 const registration=await navigatorObject.serviceWorker?.getRegistration();
 if(registration){
  await registration.update();
  if(registration.installing)await new Promise((resolve,reject)=>{
   const worker=registration.installing;const finish=()=>{clearTimeout(timeout);worker.removeEventListener('statechange',changed);worker.state==='installed'?resolve():reject(new Error('La nouvelle version n’est pas encore prête.'));};
   const timeout=setTimeout(()=>{worker.removeEventListener('statechange',changed);reject(new Error('La nouvelle version n’est pas encore prête.'));},8000);
   const changed=()=>{if(['installed','redundant'].includes(worker.state))finish();};worker.addEventListener('statechange',changed);changed();
  });
  if(registration.waiting)await new Promise((resolve,reject)=>{
   const changed=()=>{clearTimeout(timeout);navigatorObject.serviceWorker.removeEventListener('controllerchange',changed);resolve();};
   const timeout=setTimeout(()=>{navigatorObject.serviceWorker.removeEventListener('controllerchange',changed);reject(new Error('La mise à jour n’a pas été activée. Réessayez.'));},8000);
   navigatorObject.serviceWorker.addEventListener('controllerchange',changed);registration.waiting.postMessage({type:'SKIP_WAITING'});
  });
  else if(attempted)throw new Error('Cette version est toujours affichée. Réessayez plus tard.');
 }else if(attempted)throw new Error('La nouvelle version n’est pas encore disponible sur cette page.');
 try{storage.setItem(attemptKey,'1');}catch{/* No storage is required to use Covia. */}
 locationObject.reload();
}
