import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse,compileTemplate,compileStyle} from '@vue/compiler-sfc';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {notificationGroup,notificationTime} from '@/services/notificationPresentation.js';
function load(file,deps={}){let source=readFileSync(file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>deps[id]||{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({})});return m.exports.default||m.exports;}
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const item={id:'1',title:'Réservation acceptée',body:'Votre trajet est confirmé.',createdAt:'2026-11-05T10:00:00Z',readAt:null,data:{tripId:'7',goTo:'/trip'}};
function harness(request){const module=load('src/store/notifications.js',{'@/utils/serverApi.js':{serverRequest:request}});const state=JSON.parse(JSON.stringify(module.state)),rootState={profil:{userUid:'owner',accountGeneration:1,modeCo:'local'}};const ctx={state,rootState};return {module,state,rootState,ctx};}
describe('notification history',()=>{
 it('loads a page and appends older pages without duplicate rows',async()=>{
  const request=vi.fn().mockResolvedValueOnce({data:{status:'ok',data:{items:[item],unreadCount:2,nextCursor:{at:item.createdAt,id:'1'}}}}).mockResolvedValueOnce({data:{status:'ok',data:{items:[item,{...item,id:'2'}],unreadCount:2,nextCursor:null}}});
  const h=harness(request);await h.module.actions.refresh(h.ctx);await h.module.actions.refresh(h.ctx,{more:true});expect(h.state.items).toHaveLength(2);expect(request.mock.calls[1][2].params.cursorId).toBe('1');expect(h.state.loadingMore).toBe(false);
 });
 it('rejects false success bodies and keeps the existing list available after a network error',async()=>{
  const request=vi.fn().mockResolvedValue({data:{status:'ok',data:{}}});const h=harness(request);h.state.items=[item];await h.module.actions.refresh(h.ctx);expect(h.state.error).toBeTruthy();expect(h.state.items).toEqual([item]);expect(h.state.loading).toBe(false);
 });
 it('ignores an earlier account response, including a sign-out/sign-in with the same UID',async()=>{
  let finish;const h=harness(()=>new Promise(r=>{finish=r}));const pending=h.module.actions.refresh(h.ctx);h.rootState.profil.accountGeneration++;h.module.mutations.RESET(h.state);finish({data:{status:'ok',data:{items:[item],unreadCount:1}}});await pending;expect(h.state.items).toEqual([]);expect(h.state.unreadCount).toBe(0);
 });
 it('applies only server-confirmed read IDs and persists failure without hiding an unread item',async()=>{
  const request=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({data:{status:'ok',data:{readIds:['1'],readAt:item.createdAt,unreadCount:0}}});const h=harness(request);h.state.items=[item];h.state.unreadCount=1;
  expect(await h.module.actions.markRead(h.ctx,{ids:['1']})).toBe(false);expect(h.state.items[0].readAt).toBeNull();expect(h.state.readError).toBeTruthy();expect(await h.module.actions.markRead(h.ctx,{ids:['1']})).toBe(true);expect(h.state.unreadCount).toBe(0);expect(h.state.items[0].readAt).toBe(item.createdAt);
 });
 it('prevents a stale list refresh from undoing a newly read notification',async()=>{
  let finish;const request=vi.fn().mockImplementationOnce(()=>new Promise(r=>{finish=r})).mockResolvedValueOnce({data:{status:'ok',data:{readIds:['1'],readAt:item.createdAt,unreadCount:0}}});const h=harness(request);h.state.items=[item];const refresh=h.module.actions.refresh(h.ctx);await h.module.actions.markRead(h.ctx,{ids:['1']});finish({data:{status:'ok',data:{items:[item],unreadCount:1}}});await refresh;expect(h.state.unreadCount).toBe(0);expect(h.state.items[0].readAt).toBeTruthy();expect(h.state.loading).toBe(false);
 });
 it('keeps the panel open when marking a notification read fails',async()=>{
  const c=load('src/components/notifications/NotificationCenter.vue');const vm={reading:false,userUid:'owner',accountGeneration:1,markRead:vi.fn().mockResolvedValue(false),close:vi.fn(),$router:{push:vi.fn()}};await c.methods.visit.call(vm,item);expect(vm.close).not.toHaveBeenCalled();expect(vm.$router.push).not.toHaveBeenCalled();
 });
 it('groups days and displays concise times',()=>{
  const now=new Date('2026-11-05T12:00:00Z');expect(notificationGroup(now,now)).toBe('Aujourd’hui');expect(notificationGroup(new Date(now.getTime()-86400000),now)).toBe('Hier');expect(notificationTime(now,now.getTime())).toBe('À l’instant');expect(notificationTime(new Date(now.getTime()-10*60000),now.getTime())).toBe('Il y a 10 min');
 });
});
describe('trip sharing',()=>{
 function sharing({native=false,share=vi.fn().mockResolvedValue({}),copy=vi.fn().mockResolvedValue()}={}){const service=load('src/services/tripSharing.js',{'@capacitor/core':{Capacitor:{isNativePlatform:()=>native}},'@capacitor/share':{Share:{share}},'@capacitor/clipboard':{Clipboard:{write:copy}}});return {service,share,copy};}
 const trip={id:7,driver_id:'00000000-0000-4000-8000-000000000001',depart:'A',destination:'B'};
 it('creates a stable HTTPS link for the actual trip and refuses malformed IDs',()=>{
  const {service}=sharing();expect(service.tripShareUrl(trip)).toBe(`https://tchap-tchap.yt/results/shared/${trip.driver_id}/7`);expect(()=>service.tripShareUrl({...trip,id:NaN})).toThrow();expect(()=>service.tripShareUrl(trip,'javascript:bad')).toThrow();
 });
 it('opens native share and falls back to copying only when sharing is unavailable',async()=>{
  const h=sharing({native:true});expect(await h.service.shareTrip(trip)).toBe('shared');expect(h.share).toHaveBeenCalled();expect(h.copy).not.toHaveBeenCalled();
  const fallback=sharing({native:true,share:vi.fn().mockRejectedValue(new Error('unavailable'))});expect(await fallback.service.shareTrip(trip)).toBe('copied');expect(fallback.copy).toHaveBeenCalled();
 });
 it('does not copy or show an error when the user cancels sharing',async()=>{
  const h=sharing({native:true,share:vi.fn().mockRejectedValue(new Error('Share canceled'))});expect(await h.service.shareTrip(trip)).toBe('cancelled');expect(h.copy).not.toHaveBeenCalled();
 });
 it('uses browser clipboard when native sharing is absent',async()=>{
  const writeText=vi.fn().mockResolvedValue();vi.stubGlobal('navigator',{clipboard:{writeText}});const {service}=sharing();expect(await service.shareTrip(trip)).toBe('copied');expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/7'));
 });
});
it.each(['src/components/notifications/NotificationCenter.vue','src/components/ProfileLoadError.vue','src/components/menus/head/ToolbarProfil.vue'])('compiles %s including scoped styles',file=>{const {descriptor}=parse(readFileSync(file,'utf8'));expect(compileTemplate({source:descriptor.template.content,filename:file,id:'inbox'}).errors).toEqual([]);for(const style of descriptor.styles.filter(s=>!s.lang))expect(compileStyle({source:style.content,filename:file,id:'data-v-inbox',scoped:style.scoped}).errors).toEqual([]);});
describe('server-side unread pagination and history stability',()=>{
 const readAt='2026-11-05T10:00:00Z',first=Array.from({length:30},(_,n)=>({...item,id:String(n+1),readAt})),old={...item,id:'31'};
 const firstPage={data:{status:'ok',data:{items:first,unreadCount:1,nextCursor:{at:readAt,id:'30'}}}};
 it('requests the unread scope so an unread item beyond the first all-items page is returned',async()=>{
  const request=vi.fn().mockResolvedValue({data:{status:'ok',data:{items:[old],unreadCount:1,unreadOnly:true,nextCursor:null}}});const h=harness(request);
  h.ctx.dispatch=(name,payload)=>h.module.actions[name](h.ctx,payload);
  await h.module.actions.setFilter(h.ctx,'unread');expect(request.mock.calls[0][2].params.unread).toBe('1');expect(h.state.items.map(x=>x.id)).toEqual(['31']);
 });
 it('does not claim an unread filter succeeded against an old unfiltered server',async()=>{
  const h=harness(async()=>firstPage);h.state.filter='unread';await h.module.actions.refresh(h.ctx);expect(h.state.error).toBeTruthy();expect(h.state.items).toEqual([]);
 });
 it('keeps older pages on explicit refresh and pauses automatic replacement while browsing them',async()=>{
  const request=vi.fn().mockResolvedValueOnce(firstPage).mockResolvedValueOnce({data:{status:'ok',data:{items:[old],unreadCount:1,nextCursor:null}}}).mockResolvedValueOnce(firstPage).mockResolvedValueOnce({data:{status:'ok',data:{items:[old],unreadCount:1,nextCursor:null}}});
  const h=harness(request);h.state.open=true;await h.module.actions.refresh(h.ctx);await h.module.actions.refresh(h.ctx,{more:true});expect(h.state.items).toHaveLength(31);
  const c=load('src/components/notifications/NotificationCenter.vue'),refresh=vi.fn();c.methods.refreshWhenVisible.call({userUid:'owner',open:true,pagesLoaded:2,refresh});expect(refresh).not.toHaveBeenCalled();
  await h.module.actions.refresh(h.ctx,{keepPages:true});expect(h.state.items).toHaveLength(31);expect(h.state.items.some(x=>x.id==='31')).toBe(true);expect(h.state.pagesLoaded).toBe(2);
 });
 it('ignores a previous filter response after switching scope',async()=>{
  let finish;const request=vi.fn().mockImplementationOnce(()=>new Promise(r=>{finish=r})).mockResolvedValueOnce({data:{status:'ok',data:{items:[old],unreadOnly:true,unreadCount:1}}});const h=harness(request);h.ctx.dispatch=(name,p)=>h.module.actions[name](h.ctx,p);
  const pending=h.module.actions.refresh(h.ctx);await h.module.actions.setFilter(h.ctx,'unread');finish(firstPage);await pending;expect(h.state.items.map(x=>x.id)).toEqual(['31']);expect(h.state.filter).toBe('unread');
 });
});
