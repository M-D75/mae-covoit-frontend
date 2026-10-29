import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse } from '@vue/compiler-sfc';
import { describe,it,expect,vi } from 'vitest';
import { mergeChatMessages,chatViewActive,conversationPath,chatMessageStatus } from '@/services/tripMessaging.js';
vi.mock('@/utils/serverApi.js',()=>({serverRequest:vi.fn()}));
const request=vi.fn();
const roleLookup=vi.fn();
let viewportCallback;const stopViewport=vi.fn();
const {descriptor}=parse(readFileSync('src/views/trip/Chat.vue','utf8'));
const {code}=transformSync(descriptor.script.content,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']});
const module={exports:{}};
new Function('module','exports','require',code)(module,module.exports,id=>{
    if(id==='vuex')return {mapState:()=>({})};
    if(id.endsWith('serverApi.js'))return {getServerUrl:()=>'',createSocketAuth:()=>({}),attachClientVersionListeners(){}};
    if(id==='@capacitor/core')return {Capacitor:{isNativePlatform:()=>false}};
    if(id==='socket.io-client')return ()=>({on(){},emit(){},disconnect(){}});
    if(id.endsWith('sheetViewport.js'))return {observeSheetViewport:callback=>{viewportCallback=callback;return stopViewport;}};
    if(id.endsWith('supabaseClient.js'))return {__esModule:true,default:{from:()=>({select:()=>({eq:()=>({maybeSingle:()=>roleLookup()})})})}};
    if(id.endsWith('tripMessaging.js'))return {chatRequest:request,mergeChatMessages,chatViewActive,conversationPath,chatMessageStatus};
    if(id.endsWith('requestId.js'))return {createRequestId:()=> '10000000-0000-4000-8000-000000000001'};
    return {};
});
const component=module.exports.default;
function view(){const vm={...component.data(),tripId:1,userUid:'sender',peerId:'recipient',canSend:true,$nextTick:fn=>fn?.(),$refs:{},$store:{dispatch:vi.fn(),commit:vi.fn()},$router:{replace:vi.fn()},$route:{path:'/message'},socket:{emit:vi.fn(),disconnect:vi.fn()}};
    for(const [key,method] of Object.entries(component.methods))vm[key]=method.bind(vm);return vm;}
describe('trip text messaging',()=>{
    it('merges a lost-ack retry into one server message and drops expired content',()=>{
        const pending={clientId:'nonce',text:'Bonjour 👋',pending:true,createdAt:'2026-10-28T08:00:00Z'};
        const saved={...pending,id:'7',pending:false,expiresAt:'2026-11-12T08:00:00Z'};
        const result=mergeChatMessages([pending],[saved,saved],new Date('2026-10-28').getTime());
        expect(result).toHaveLength(1);expect(result[0].id).toBe('7');expect(result[0].pending).toBe(false);
        expect(mergeChatMessages(result,[],new Date('2026-11-13').getTime())).toEqual([]);
    });
    it('uses the same client nonce and exact text after an uncertain send',async()=>{
        const vm=view();request.mockRejectedValueOnce(new Error('connection lost'));vm.draft='Bonjour 👋';vm.send();
        await vi.waitFor(()=>expect(vm.messages[0].error).toBe(true));
        const first=request.mock.calls.at(-1)[3];request.mockResolvedValueOnce({message:{id:'7',clientId:first.clientId,text:first.text,from:'sender',to:'recipient',createdAt:new Date().toISOString()}});
        await vm.retry(vm.messages[0]);expect(request.mock.calls.at(-1)[3]).toEqual(first);expect(vm.messages).toHaveLength(1);expect(vm.messages[0].id).toBe('7');
    });
    it('acknowledges read only in the visible focused foreground chat',()=>{
        const active={foreground:true,hidden:false,focused:true,path:'/message'};expect(chatViewActive(active)).toBe(true);
        for(const patch of [{foreground:false},{hidden:true},{focused:false},{path:'/trip'}])expect(chatViewActive({...active,...patch})).toBe(false);
    });
    it('clears history and drafts on account change without marking anything read',()=>{
        const vm=view();vm.messages=[{id:'7',text:'private fixture'}];vm.draft='draft';component.watch.userUid.call(vm);
        expect(vm.messages).toEqual([]);expect(vm.draft).toBe('');expect(vm.socket.disconnect).toHaveBeenCalled();expect(vm.$router.replace).toHaveBeenCalledWith('/profil');
    });
});

it('discards a late unread response from a previous account', async()=>{
    const source=readFileSync('src/store/trip.js','utf8');
    const built=transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
    const unit={exports:{}};let resolve;
    new Function('module','exports','require',built)(unit,unit.exports,id=>id.endsWith('serverApi.js')?{serverRequest:()=>new Promise(r=>{resolve=r;})}:{});
    const commit=vi.fn(),rootState={profil:{userUid:'first',modeCo:'local'}};
    const pending=unit.exports.default.actions.refreshUnread({commit,rootState});rootState.profil.userUid='second';
    resolve({data:{data:{conversations:[{tripId:'1',count:3}]}}});await pending;expect(commit).not.toHaveBeenCalled();
});
it('shows an empty exchange only after successful loading, never alongside an error',()=>{
 const vm=view();vm.peerId='';vm.contactsLoaded=false;expect(component.computed.showEmpty.call(vm)).toBe(false);
 vm.contactsLoaded=true;expect(component.computed.showEmpty.call(vm)).toBe(true);vm.error='Impossible';expect(component.computed.showEmpty.call(vm)).toBe(false);
 vm.error='';vm.peerId='peer';expect(component.computed.showEmpty.call(vm)).toBe(false);vm.historyInitialized=true;expect(component.computed.showEmpty.call(vm)).toBe(true);vm.refreshing=true;expect(component.computed.showEmpty.call(vm)).toBe(false);
});

it('uses a passenger picker only for the verified driver of this trip, not the global profile mode',()=>{
 const driver=component.computed.isTripDriver;
 expect(driver.call({tripId:1,userUid:'driver',tripSelected:{id:1,driver_id:'driver'},roleDriverId:null})).toBe(true);
 expect(driver.call({tripId:1,userUid:'passenger',tripSelected:{id:1,driver_id:'driver'},roleDriverId:null,modeDriver:true})).toBe(false);
 expect(driver.call({tripId:2,userUid:'driver',tripSelected:{id:1,driver_id:'driver'},roleDriverId:null})).toBe(false);
 expect(driver.call({tripId:2,userUid:'driver',tripSelected:{id:2},roleDriverId:'driver'})).toBe(true);
 const active=component.computed.activeContact;expect(active.call({contacts:[{userId:'driver',username:'Chauffeur'}],peerId:'driver'}).username).toBe('Chauffeur');
});
it('displays only truthful receipt icons and preserves uncertain-send semantics',()=>{
 expect(chatMessageStatus({pending:true})).toEqual({icon:'mdi-clock-outline',label:'Envoi en cours'});
 expect(chatMessageStatus({id:'7'})).toEqual({icon:'mdi-check',label:'Enregistré sur le serveur'});
 expect(chatMessageStatus({id:'7',readAt:'2026-10-29T10:00:00Z'})).toEqual({icon:'mdi-check-all',label:'Lu'});
 expect(chatMessageStatus({id:'7',error:true,pending:true}).label).toBe('Échec d’envoi ou confirmation indisponible');
 expect(chatMessageStatus({}).label).toBe('Confirmation indisponible');
});

it('ignores a late role lookup after changing trip or account',async()=>{
 const vm=view();let done;roleLookup.mockReturnValueOnce(new Promise(resolve=>{done=resolve;}));const pending=vm.resolveChatRole();vm.tripId=2;done({data:{id:1,driver_id:'sender'}});await pending;expect(vm.roleDriverId).toBeNull();
 roleLookup.mockResolvedValueOnce({data:{id:2,driver_id:'sender'}});await vm.resolveChatRole();expect(vm.roleDriverId).toBe('sender');vm.roleDriverId=null;
 roleLookup.mockReturnValueOnce(new Promise(resolve=>{done=resolve;}));const next=vm.resolveChatRole();vm.userUid='other';done({data:{id:2,driver_id:'sender'}});await next;expect(vm.roleDriverId).toBeNull();
});

it('adapts chat height to the shared keyboard viewport and removes the observer on exit',async()=>{
 const vm=view();vm.reload=vi.fn().mockResolvedValue();vm.resolveChatRole=vi.fn();
 try{await component.mounted.call(vm);viewportCallback({height:380});expect(vm.visibleHeight).toBe(380);}finally{component.beforeUnmount.call(vm);}expect(stopViewport).toHaveBeenCalledOnce();
});
