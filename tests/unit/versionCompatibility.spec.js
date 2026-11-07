import * as authSessionGuard from '@/services/authSessionGuard.js';
import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {describe,it,expect,vi} from 'vitest';
function load(file,resolve){const m={exports:{}};const {code}=transformSync(readFileSync(file,'utf8'),{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']});new Function('module','exports','require',code)(m,m.exports,resolve);return m.exports;}
const factory=load('src/services/versionCompatibility.js',id=>id==='vue'?{reactive:v=>v}:id.endsWith('serverApi.js')?{getServerUrl:()=> 'https://api.test'}:{}).createVersionChecker;
const published={platform:'android',status:'update_required',mode:'enforce',published:true,latestVersion:'1.1.0',latestBuild:'5',cacheSeconds:300,updateUrl:'https://play.google.com/store/apps/details?id=com.maecovoit.app'};
describe('version check leases',()=>{
 it('expires a cached requirement after five minutes and never extends it on offline restart',async()=>{
  let now=1000000;const state={},cache=new Map();const identity=async()=>({platform:'android',build:'4',bundle:1,protocol:2});const request=vi.fn().mockResolvedValue(published);const storage={getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v)};
  const one=factory({state,identity,request,headers:async()=>({}),storage,now:()=>now});await one.check(true);expect(state.compatibility.status).toBe('update_required');const until=state.validUntil;
  now+=200000;request.mockRejectedValue(Error('offline'));const next={};await factory({state:next,identity,request,headers:async()=>({}),storage,now:()=>now}).check(true);expect(next.validUntil).toBe(until);expect(next.offline).toBe(true);
  now+=101000;await one.check(true);expect(state.compatibility).toBeNull();expect(state.validUntil).toBe(0);
 });
 it('never invents a mandatory release or an unsafe store URL',()=>{
  const state={};const checker=factory({state,identity:async()=>({}),headers:async()=>({}),request:async()=>({}),storage:{setItem(){}}});
  expect(checker.accept({...published,published:false})).toBe(false);expect(checker.accept({...published,mode:'observe'})).toBe(false);
  expect(checker.accept({...published,updateUrl:'https://outside.example/app'})).toBe(true);expect(state.compatibility.updateUrl).toBeNull();
 });
 it('deduplicates concurrent checks and bounds network retry cadence',async()=>{
  const state={},request=vi.fn().mockResolvedValue({...published,status:'update_available',mode:'observe'});
  const c=factory({state,request,identity:async()=>({platform:'android'}),headers:async()=>({}),storage:{getItem(){},setItem(){}}});
  await Promise.all([c.check(),c.check(),c.check()]);await c.check();expect(request).toHaveBeenCalledTimes(1);
 });
});
it('reports the server development allowance as unavailable, never current or cached, and clears it after failure',async()=>{
 const state={},storage={getItem(){},setItem:vi.fn()},request=vi.fn().mockResolvedValue({status:'unavailable',developmentAllowed:true,cacheSeconds:0});
 const checker=factory({state,identity:async()=>({platform:'web'}),headers:async()=>({}),request,storage});
 await checker.check(true,'local');expect(state.developmentAllowed).toBe(true);expect(state.offline).toBe(true);expect(state.compatibility).toBeNull();expect(state.validUntil).toBe(0);expect(storage.setItem).not.toHaveBeenCalled();
 request.mockRejectedValue(Error('offline'));await checker.check(true,'local');expect(state.developmentAllowed).toBe(false);expect(state.compatibility).toBeNull();
});
describe('installed version identity',()=>{
 it('uses native App.getInfo rather than the web package version, preserving dotted iOS builds',async()=>{
  const m=load('src/utils/clientIdentity.js',id=>id==='@capacitor/core'?{Capacitor:{getPlatform:()=> 'ios',isNativePlatform:()=>true}}:id==='@capacitor/app'?{App:{getInfo:async()=>({build:'2.3.4',version:'1.2.0'})}}:JSON.parse(readFileSync('release.json','utf8')));
  const identity=await m.getClientIdentity();expect(identity.build).toBe('2.3.4');expect(identity.version).toBe('1.2.0');expect((await m.getClientHeaders())['x-covia-platform']).toBe('ios');
 });
});
describe('web update is explicit and bounded',()=>{
 const update=load('src/services/webUpdate.js',()=>({})).updateWebApp;
 it('reloads only on explicit update and refuses a same-build reload loop',async()=>{
  const reload=vi.fn(),cache=new Map();const options={navigatorObject:{},locationObject:{href:'https://covia.test/',reload},storage:{getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v)},fetchObject:async()=>({ok:true,json:async()=>({build:'2'})}),attemptKey:'release2',currentBuild:'1',expectedBuild:'2'};
  expect(reload).not.toHaveBeenCalled();await update(options);expect(reload).toHaveBeenCalledTimes(1);await expect(update(options)).rejects.toThrow();expect(reload).toHaveBeenCalledTimes(1);
 });
 it('never reloads without verified newer web metadata',async()=>{
  const reload=vi.fn();await expect(update({navigatorObject:{},locationObject:{href:'https://covia.test/',reload},storage:{getItem(){}},fetchObject:async()=>({ok:true,json:async()=>({build:'1'})}),attemptKey:'x',currentBuild:'1',expectedBuild:'2'})).rejects.toThrow();expect(reload).not.toHaveBeenCalled();
 });
});

describe('update dialogue policy',()=>{
 function gate(status='update_required'){
  const {descriptor}=parse(readFileSync('src/components/VersionGate.vue','utf8'));const m={exports:{}};
  const {code}=transformSync(descriptor.script.content,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']});
  new Function('module','exports','require',code)(m,m.exports,id=>id==='@capacitor/core'?{Capacitor:{isNativePlatform:()=>false}}:{});
  const component=m.exports.default;const now=Date.now();const vm={...component.data(),now,state:{identity:{build:'4'},validUntil:now+300000,offline:false,compatibility:{...published,status}},$route:{path:'/search'},$store:{state:{trip:{tripSelected:{}}}}};
  for(const [key,fn]of Object.entries(component.computed))Object.defineProperty(vm,key,{get:()=>fn.call(vm)});
  for(const [key,fn]of Object.entries(component.methods))vm[key]=fn.bind(vm);
  return {vm,component};
 }
 it('blocks new operations, while recovery views, active tracking and offline status preserve access',()=>{
  const {vm}=gate();expect(vm.blocking).toBe(true);
  vm.$route.path='/trip';expect(vm.blocking).toBe(false);
  vm.$route.path='/search';vm.activeNative=true;expect(vm.blocking).toBe(false);
  vm.activeNative=false;vm.state.offline=true;expect(vm.blocking).toBe(false);
  vm.state.offline=false;vm.now+=300001;expect(vm.blocking).toBe(false);
 });
 it('reports the real refresh outcome, including a failed check with an older cached policy',async()=>{
  for(const [status,offline,text]of [['current',false,'à jour'],['update_available',false,'nouvelle version'],['update_required',false,'obligatoire'],['current',true,'impossible']]){
   const {vm}=gate(status);vm.check=vi.fn().mockResolvedValue();vm.state.offline=offline;await vm.refreshResult();expect(vm.check).toHaveBeenCalledWith(true);expect(vm.resultMessage).toContain(text);expect(vm.resultOpen).toBe(true);
  }
  const {vm}=gate('current');vm.check=vi.fn();vm.state.compatibility=null;await vm.refreshResult();expect(vm.resultMessage).toContain('impossible');
 });
 it('labels the development allowance as unavailable and permits dismissing its banner',async()=>{
  const {vm}=gate('current');vm.state.compatibility=null;vm.state.offline=true;vm.state.developmentAllowed=true;vm.check=vi.fn();
  expect(vm.required).toBe(false);expect(vm.available).toBe(false);expect(vm.banner).toBe(true);await vm.refreshResult();expect(vm.resultMessage).toContain('compatibilité non vérifiée');vm.closeDialog(false);expect(vm.banner).toBe(false);
 });
 it('offers an optional popup with dismissal, and asks explicitly before updating during a trip',()=>{
  const {vm,component}=gate('update_available');component.watch.notificationKey.handler.call(vm);expect(vm.optionalPrompt).toBe(true);
  vm.closeDialog(false);expect(vm.optionalPrompt).toBe(false);expect(vm.dismissed).toBe(vm.notificationKey);
  vm.$store.state.trip.tripSelected={id:1};vm.update=vi.fn();vm.requestUpdate();expect(vm.confirmUpdate).toBe(true);expect(vm.update).not.toHaveBeenCalled();
 });
});

it('adds version headers only to trip publication, leaving Auth refresh and ordinary reads unchanged',async()=>{
 const headers=vi.fn().mockResolvedValue({'x-covia-build':'4'}),network=vi.fn().mockResolvedValue({ok:true});
 const wrapper=load('src/utils/supabaseClient.js',id=>id==='@supabase/supabase-js'?{createClient:()=>({auth:{}})}:id.endsWith('authSessionGuard.js')?authSessionGuard:{getClientHeaders:headers,notifyUpdateRequired:vi.fn()});
 vi.stubGlobal('fetch',network);
 try{
  await wrapper.versionedFetch('https://fixture.supabase.co/auth/v1/token',{method:'POST'});expect(headers).not.toHaveBeenCalled();
  await wrapper.versionedFetch('https://fixture.supabase.co/rest/v1/trip',{method:'GET'});expect(headers).not.toHaveBeenCalled();
  await wrapper.versionedFetch('https://fixture.supabase.co/rest/v1/trip',{method:'POST'});expect(headers).toHaveBeenCalledTimes(1);expect(network.mock.calls.at(-1)[1].headers.get('x-covia-build')).toBe('4');
 }finally{vi.unstubAllGlobals();}
});

it('loads web release metadata from the deployment base, independent of nested routes',async()=>{
 const update=load('src/services/webUpdate.js',()=>({})).updateWebApp;
 const fetchObject=vi.fn().mockResolvedValue({ok:true,json:async()=>({build:'2'})});
 await update({navigatorObject:{},locationObject:{href:'https://covia.test/covia/profil/perso',reload:vi.fn()},storage:{getItem(){},setItem(){}},fetchObject,attemptKey:'base',currentBuild:'1',basePath:'/covia/'});
 expect(new URL(fetchObject.mock.calls[0][0]).pathname).toBe('/covia/release.json');
});
