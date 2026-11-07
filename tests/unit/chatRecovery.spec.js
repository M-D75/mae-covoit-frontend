import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {it,expect,vi} from 'vitest';
const path='src/views/trip/Chat.vue';
function component(request,lookup=vi.fn(async()=>({data:{id:8,driver_id:'driver'},error:null}))){
 const m={exports:{}};const code=transformSync(parse(readFileSync(path,'utf8')).descriptor.script.content,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
 new Function('module','exports','require',code)(m,m.exports,id=>id==='vuex'?{mapState:()=>({})}:id.endsWith('tripMessaging.js')?{chatRequest:request,conversationPath:(id,peer)=>`/trips/${id}/conversations/${peer}/`,mergeChatMessages:(a,b)=>[...a,...b]}:id.endsWith('supabaseClient.js')?{from:()=>({select:()=>({eq:()=>({maybeSingle:lookup})})})}:{});
 const c=m.exports.default,vm={...c.data(),tripId:8,userUid:'driver',peerId:'passenger1',tripSelected:{id:7,driver_id:'driver'},modeCo:'online',$route:{query:{},path:'/message'},$refs:{},$store:{dispatch:vi.fn(),commit:vi.fn()},$nextTick:async()=>{},presence:vi.fn(),markVisibleRead:vi.fn()};
 for(const [key,fn]of Object.entries(c.methods))if(typeof fn==='function'&&!['presence','markVisibleRead'].includes(key))vm[key]=fn.bind(vm);return {c,vm};
}
const contacts=[{userId:'passenger1',username:'Premier passager'},{userId:'passenger2',username:'Deuxième passager'}];

const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
it('preserves history failure when contact loading succeeds, then recovers on retry',async()=>{
 let offline=true;const request=vi.fn(async(_,path)=>{if(path.endsWith('/conversations'))return {contacts};if(offline)throw Error('offline');return {messages:[],canSend:true,nextCursor:null};}),{vm}=component(request);
 await vm.refreshHistory();expect(vm.error).toContain('Historique indisponible');await vm.reload();expect(vm.error).toContain('Historique indisponible');expect(vm.historyInitialized).toBe(false);expect(vm.loading).toBe(false);
 offline=false;await vm.reload();expect(vm.error).toBe('');expect(vm.historyInitialized).toBe(true);expect(vm.canSend).toBe(true);
});
it('does not clear an in-flight history failure with another contact refresh',async()=>{
 const pending=deferred(),request=vi.fn((_,path)=>path.endsWith('/conversations')?Promise.resolve({contacts}):pending.promise),{vm}=component(request);
 const history=vm.refreshHistory();await vm.reload();expect(vm.refreshing).toBe(true);pending.reject(Error('offline'));await history;expect(vm.error).toContain('Historique indisponible');
});
it('a driver role lookup recovers through the visible reload action',async()=>{
 const lookup=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue({data:{id:8,driver_id:'driver'},error:null}),{vm,c}=component(vi.fn(async()=>({contacts})),lookup);vm.refreshHistory=vi.fn(async()=>{});
 await vm.resolveChatRole();expect(vm.roleError).toContain('Réessayez');expect(c.computed.isTripDriver.call(vm)).toBe(false);await vm.reload();expect(vm.roleError).toBe('');expect(c.computed.isTripDriver.call(vm)).toBe(true);expect(vm.contacts).toHaveLength(2);expect(lookup).toHaveBeenCalledTimes(2);
 await vm.reload();expect(lookup).toHaveBeenCalledTimes(2);
});
it.each([{error:{message:'offline'},data:null},{error:null,data:null},{error:null,data:{id:8}}])('shows a retryable role error for unusable lookup %j',async result=>{
 const {vm}=component(vi.fn(async()=>({contacts})),vi.fn(async()=>result));vm.refreshHistory=vi.fn(async()=>{});await vm.reload();expect(vm.roleDriverId).toBeNull();expect(vm.roleError).toContain('Impossible de vérifier');expect(vm.loading).toBe(false);
});
it('successful message loading cannot hide the separate role error',async()=>{
 const {vm,c}=component(vi.fn(async(_,path)=>path.endsWith('/conversations')?{contacts}:{messages:[],canSend:true}),vi.fn(async()=>{throw Error('offline');}));await vm.reload();expect(vm.historyInitialized).toBe(true);expect(vm.error).toBe('');expect(vm.roleError).not.toBe('');expect(c.computed.showEmpty.call(vm)).toBe(false);
});
it('a passenger role is known without displaying the chauffeur selector',async()=>{const {vm,c}=component(vi.fn(),vi.fn(async()=>({data:{id:8,driver_id:'other'},error:null})));expect(await vm.resolveChatRole()).toBe(true);expect(vm.roleError).toBe('');expect(c.computed.isTripDriver.call(vm)).toBe(false);});
it('uses the already selected trip without a network lookup',async()=>{const lookup=vi.fn(),{vm,c}=component(vi.fn(),lookup);vm.tripSelected={id:8,driver_id:'driver'};vm.roleError='old';await vm.resolveChatRole();expect(lookup).not.toHaveBeenCalled();expect(vm.roleError).toBe('');expect(c.computed.isTripDriver.call(vm)).toBe(true);});
it('deduplicates concurrent role lookups and clears the pending state on error',async()=>{const pending=deferred(),lookup=vi.fn(()=>pending.promise),{vm}=component(vi.fn(),lookup);const a=vm.resolveChatRole(),b=vm.resolveChatRole();expect(lookup).toHaveBeenCalledOnce();pending.reject(Error('offline'));await Promise.all([a,b]);expect(vm.roleLookupPromise).toBeNull();expect(vm.roleError).not.toBe('');});
it('ignores a role reply after moving to another trip',async()=>{const pending=deferred(),{vm}=component(vi.fn(),vi.fn(()=>pending.promise));const p=vm.resolveChatRole();vm.tripId=9;pending.resolve({data:{id:8,driver_id:'driver'},error:null});await p;expect(vm.roleDriverId).toBeNull();expect(vm.roleError).toBe('');});
it('ignores a role failure after leaving the screen',async()=>{const pending=deferred(),{vm}=component(vi.fn(),vi.fn(()=>pending.promise));const p=vm.resolveChatRole();vm.disposed=true;pending.reject(Error('offline'));await p;expect(vm.roleError).toBe('');});
it('a stale contact failure cannot hide newer contacts or stop their loader',async()=>{
 const a=deferred(),b=deferred(),request=vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise),{vm}=component(request);vm.refreshHistory=vi.fn(async()=>{});const first=vm.reload(),second=vm.reload();a.reject(Error('offline'));await first;expect(vm.loading).toBe(true);expect(vm.error).toBe('');b.resolve({contacts});await second;expect(vm.contacts).toEqual(contacts);expect(vm.loading).toBe(false);
});
it('a stale successful contact response cannot overwrite a newer selection',async()=>{
 const a=deferred(),request=vi.fn().mockReturnValueOnce(a.promise).mockResolvedValueOnce({contacts}),{vm}=component(request);vm.refreshHistory=vi.fn(async()=>{});const first=vm.reload();await vm.reload();a.resolve({contacts:[{userId:'obsolete'}]});await first;expect(vm.contacts).toEqual(contacts);expect(vm.peerId).toBe('passenger1');
});
it('contact failures remain visible and the next successful load clears them',async()=>{
 const request=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue({contacts}),{vm}=component(request);vm.refreshHistory=vi.fn(async()=>{});await vm.reload();expect(vm.error).toContain('Impossible de charger');await vm.reload();expect(vm.error).toBe('');expect(vm.contactsLoaded).toBe(true);
});
it('keeps a service migration error recognizable',async()=>{const {vm}=component(vi.fn(async()=>{throw {response:{data:{code:'CHAT_MIGRATION_OR_SERVICE_UNAVAILABLE'}}};}));await vm.reload();expect(vm.error).toContain('mise à jour');});
it('a confirmed empty contact list shows a genuine empty state',async()=>{const {vm,c}=component(vi.fn(async()=>({contacts:[]})));await vm.reload();expect(vm.peerId).toBe('');expect(vm.error).toBe('');expect(vm.loading).toBe(false);expect(c.computed.showEmpty.call(vm)).toBe(true);});
