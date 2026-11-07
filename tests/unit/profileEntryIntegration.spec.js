import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse,compileTemplate} from '@vue/compiler-sfc';
import {compile} from '@vue/compiler-dom';
import * as Vue from 'vue';
import * as Vuex from 'vuex';
import {createRouter,createMemoryHistory,RouterView} from 'vue-router';
import * as authProfile from '@/services/authProfile.js';
import {it,expect,vi,afterEach} from 'vitest';
import * as preferences from '@/services/travelPreferences.js';
import * as utils from '@/utils/utils.js';
function load(file,deps={}){let source=readFileSync(file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>deps[id]||(id==='vue'?Vue:id==='vuex'?Vuex:id.endsWith('authProfile.js')?authProfile:id.endsWith('travelPreferences.js')?preferences:id.endsWith('utils.js')?utils:id.endsWith('authEntry.js')?{rememberAuthEntry:()=>{},getDefaultAuthPath:()=>'/login'}:{Capacitor:{getPlatform:()=> 'web',isNativePlatform:()=>false}}));return m.exports.default;}
const clone=x=>JSON.parse(JSON.stringify(x));
const defer=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const apps=[];afterEach(()=>{apps.splice(0).forEach(app=>app.unmount());document.body.innerHTML='';vi.restoreAllMocks();});
function harness(){
 const user={id:'same-user',app_metadata:{provider:'email'},user_metadata:{}},session={user,access_token:'fixture-token',expires_at:2000000000},account={id:7,user_id:user.id,firstname:'Test',lastname:'Profil',email:'fixture@example.test',avatar:'fixture-avatar',credit:10,settings:{prefer:[1,2,1,1]}};
 const reply={data:[account],error:null},getSession=vi.fn(async()=>({data:{session},error:null})),lookup=vi.fn(async()=>reply),update=vi.fn(()=>({eq(){return this;},select:async()=>({data:[],error:null})})),client={auth:{getSession},from:vi.fn(()=>({select(){return this;},eq:lookup,update}))};
 const payment=vi.fn(async()=>({data:{customer:{id:'fixture-customer'},provider:{id:'fixture-provider'}}})),bridge={},auth=load('src/store/auth.js',{'../store':bridge,'@/utils/supabaseClient.js':client,'@/utils/serverApi.js':{serverRequest:payment}}),profile=load('src/store/profil.js');
 const state=clone(profile.state);Object.assign(state,{userUid:user.id,accountGeneration:1,userId:7});
 const store=Vuex.createStore({modules:{auth:{...auth,state:clone(auth.state)},profil:{...profile,state},trip:{namespaced:true,state:{notMessageVue:[]}}}});bridge.state=store.state;bridge.dispatch=store.dispatch;
 return {store,client,getSession,lookup,reply,account,session,payment,update,user};
}
async function mountProfile(h,path='/profil'){
 const dummy={render:()=>null},router=createRouter({history:createMemoryHistory(),routes:['/profil','/profil/:action','/search','/login','/account-info','/'].map(path=>({path,component:dummy}))});await router.push(path);await router.isReady();
 const child=load('src/components/profile/CompProfil.vue'),parent=load('src/views/Profil.vue'),Child={...child,render(){return Vue.h('div',{'data-profile':true},this.loadCreaditCard?'Chargement':this.userName);}};
 const app=Vue.createApp({...parent,render(){return Vue.h(Child,{ref:'profileChild'});}});app.use(h.store);app.use(router);const el=document.createElement('div');document.body.append(el);const vm=app.mount(el);apps.push(app);
 return {app,router,el,vm,child:vm.$refs.profileChild};
}
it('real Vue parent-child mounting loads once and stays on profile',async()=>{
 const h=harness(),m=await mountProfile(h);await vi.waitFor(()=>expect(m.child.loadCreaditCard).toBe(false));expect(h.getSession).toHaveBeenCalledOnce();expect(h.lookup).toHaveBeenCalledOnce();expect(h.payment).toHaveBeenCalledOnce();expect(m.router.currentRoute.value.path).toBe('/profil');expect(m.el.textContent).toContain('Profil Test');expect(h.store.state.auth.logged_in).toBe(true);expect(h.store.state.auth.account_created).toBe(true);
});
it('a slow successful load keeps the profile mounted until ready',async()=>{
 const h=harness(),pending=defer();h.lookup.mockReturnValueOnce(pending.promise);const m=await mountProfile(h);await vi.waitFor(()=>expect(h.lookup).toHaveBeenCalledOnce());expect(m.router.currentRoute.value.path).toBe('/profil');expect(m.child.loadCreaditCard).toBe(true);pending.resolve(h.reply);await vi.waitFor(()=>expect(m.child.loadCreaditCard).toBe(false));expect(m.router.currentRoute.value.path).toBe('/profil');
});
it.each(['status','throw'])('profile lookup %s failure stays on profile, stops loading and retries the requested route',async mode=>{
 const h=harness();h.store.state.auth.account_created=true;h.store.state.profil.soldes=12;h.lookup.mockImplementationOnce(async()=>{if(mode==='throw')throw Error('offline');return {data:null,error:{message:'offline'}};});const m=await mountProfile(h);await vi.waitFor(()=>expect(m.child.loadCreaditCard).toBe(false));expect(m.router.currentRoute.value.path).toBe('/profil');expect(h.store.state.auth.profileLookupError).toEqual({path:'/profil'});expect(h.store.state.auth.logged_in).toBe(true);expect(h.store.state.auth.account_created).toBe(true);expect(h.store.state.profil.soldes).toBe(12);
 const dialog=load('src/components/ProfileLoadError.vue'),vm={profileLookupError:h.store.state.auth.profileLookupError,$store:h.store,$router:m.router};await dialog.methods.retry.call(vm);expect(h.store.state.auth.profileLookupError).toBeNull();expect(m.router.currentRoute.value.path).toBe('/profil');expect(h.lookup).toHaveBeenCalledTimes(2);expect(vm.retrying).toBe(false);
});
it('missing session alone redirects to login with the original profile destination',async()=>{const h=harness();h.getSession.mockResolvedValue({data:{session:null},error:null});const m=await mountProfile(h);await vi.waitFor(()=>expect(m.router.currentRoute.value.path).toBe('/login'));expect(m.router.currentRoute.value.query.redirect).toBe('/profil');expect(h.lookup).not.toHaveBeenCalled();expect(h.store.state.auth.logged_in).toBe(false);expect(m.child.loadCreaditCard).toBe(false);});
it('an authenticated user without an account goes to profile completion',async()=>{const h=harness();h.reply.data=[];const m=await mountProfile(h);await vi.waitFor(()=>expect(m.router.currentRoute.value.path).toBe('/account-info'));expect(m.router.currentRoute.value.query.redirect).toBe('/profil');expect(h.store.state.auth.logged_in).toBe(true);});
it('a payment service failure does not kick the user out of the profile',async()=>{const h=harness();h.payment.mockRejectedValue(Error('backend offline'));const m=await mountProfile(h);await vi.waitFor(()=>expect(m.child.loadCreaditCard).toBe(false));expect(m.router.currentRoute.value.path).toBe('/profil');expect(h.store.state.auth.profileLookupError).toBeNull();expect(m.el.textContent).toContain('Profil Test');});
it('parallel checks for the same session share one successful operation',async()=>{const h=harness(),a=h.store.dispatch('auth/loadSession',{path:'/profil'}),b=h.store.dispatch('auth/loadSession',{path:'/profil'}),c=h.store.dispatch('auth/checkSession');expect(await a).toMatchObject({status:'ready',hasAccount:true});expect(await b).toMatchObject({status:'ready',hasAccount:true});expect(await c).toBe(true);expect(h.getSession).toHaveBeenCalledOnce();expect(h.lookup).toHaveBeenCalledOnce();});
it('a later check joins an operation already loading payment data',async()=>{const h=harness(),pending=defer();h.payment.mockReturnValueOnce(pending.promise);const a=h.store.dispatch('auth/loadSession');await vi.waitFor(()=>expect(h.payment).toHaveBeenCalledOnce());const b=h.store.dispatch('auth/loadSession');pending.resolve({data:{customer:{},provider:{}}});expect((await a).status).toBe('ready');expect((await b).status).toBe('ready');expect(h.getSession).toHaveBeenCalledOnce();});
it('an unexpected session transport failure is retryable without clearing the profile',async()=>{const h=harness();h.getSession.mockRejectedValueOnce(Error('transport failed'));h.store.state.auth.logged_in=true;expect((await h.store.dispatch('auth/loadSession',{path:'/profil'})).status).toBe('profile-error');expect(h.store.state.auth.logged_in).toBe(true);expect(h.store.state.auth.profileLookupError.path).toBe('/profil');expect((await h.store.dispatch('auth/loadSession',{path:'/profil'})).status).toBe('ready');});
it('an optional avatar sync failure cannot block an otherwise valid profile',async()=>{const h=harness();h.account.avatar=null;h.update.mockImplementation(()=>({eq(){return this;},select:async()=>{throw Error('avatar offline');}}));expect((await h.store.dispatch('auth/loadSession')).status).toBe('ready');expect(h.store.state.profil.userName).toBe('Profil Test');});
it('a profile request finishing after navigation cannot redirect the new screen',async()=>{const h=harness(),pending=defer();h.getSession.mockReturnValueOnce(pending.promise);const m=await mountProfile(h);await m.router.push('/search');pending.resolve({data:{session:null},error:null});await vi.waitFor(()=>expect(m.child.loadCreaditCard).toBe(false));expect(m.router.currentRoute.value.path).toBe('/search');});
it('startup stays put on profile lookup failure instead of routing to account-info',async()=>{const h=harness();h.reply.error={message:'offline'};h.reply.data=null;const c=load('src/views/Home.vue'),replace=vi.fn(),vm={$store:h.store,$route:{path:'/'},$router:{replace}};await c.methods.checkSessionIn.call(vm);expect(replace).not.toHaveBeenCalled();expect(vm.overlayLoad).toBe(false);expect(h.store.state.auth.profileLookupError.path).toBe('/search');});
it.each([true,false])('startup sends a confirmed session to its correct destination (account=%s)',async hasAccount=>{const h=harness();if(!hasAccount)h.reply.data=[];const c=load('src/views/Home.vue'),replace=vi.fn();await c.methods.checkSessionIn.call({$store:h.store,$route:{path:'/'},$router:{replace}});expect(replace).toHaveBeenCalledWith(hasAccount?'/search':'/account-info');});
it('retry after session expiry returns to login, never directly to a protected profile',async()=>{const h=harness();h.getSession.mockResolvedValue({data:{session:null},error:null});const c=load('src/components/ProfileLoadError.vue'),replace=vi.fn();await c.methods.retry.call({$store:h.store,$router:{replace},profileLookupError:{path:'/profil'}});expect(replace).toHaveBeenCalledWith({path:'/login',query:{redirect:'/profil'}});});
it.each(['src/views/Profil.vue','src/components/profile/CompProfil.vue','src/components/ProfileLoadError.vue','src/views/Home.vue'])('compiles %s',file=>{const {descriptor}=parse(readFileSync(file,'utf8'));expect(compileTemplate({source:descriptor.template.content,filename:file,id:'profile-entry'}).errors).toEqual([]);});

async function navigationApp(h,authFailure={error:null}){
 const child=load('src/components/profile/CompProfil.vue'),parent=load('src/views/Profil.vue'),Child={...child,render(){return Vue.h('div',{'data-profile':true},this.loadCreaditCard?'Chargement':this.userName);}},Parent={...parent,render(){return Vue.h(Child);}};
 const page=label=>({render:()=>Vue.h('p',label)}),router=createRouter({history:createMemoryHistory(),routes:[{path:'/search',component:page('Recherche'),meta:{requiresAuth:true}},{path:'/profil',component:Parent,meta:{requiresAuth:true}},{path:'/login',component:page('Connexion')},{path:'/account-info',component:page('Compléter le profil'),meta:{requiresAuth:true,allowMissingAccount:true}}]});
 let guardCalls=0;
 const guardClient={auth:{getUser:async()=>{if(++guardCalls>1&&authFailure.error){if(authFailure.throws)throw authFailure.error;return {data:{user:null},error:authFailure.error};}return {data:{user:h.user},error:null};}},from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{id:7,user_id:h.user.id},error:null})})};
 load('src/router/index.js',{'vue-router':{createRouter:()=>router,createWebHistory:()=>null},'@/utils/supabaseClient.js':guardClient,'../store':h.store,'@/services/authProfile.js':authProfile});
 await router.push('/search');await router.isReady();
 const nav=load('src/components/menus/BottomNav.vue'),navTemplate=parse(readFileSync('src/components/menus/BottomNav.vue','utf8')).descriptor.template.content;
 const Nav={...nav,render:new Function('Vue',compile(navTemplate,{mode:'function',prefixIdentifiers:true}).code)(Vue)};
 const app=Vue.createApp({render(){return Vue.h('div',[Vue.h(Nav),Vue.h(RouterView)]);}});
 app.component('v-bottom-navigation',{props:['modelValue'],emits:['update:modelValue'],setup(_,ctx){return ()=>Vue.h('nav',ctx.slots.default?.().map((node,index)=>Vue.cloneVNode(node,{onClick:()=>ctx.emit('update:modelValue',index)})));}});
 for(const name of ['v-btn','v-icon'])app.component(name,{render(){return Vue.h(name==='v-btn'?'button':'span',this.$attrs,this.$slots.default?.());}});
 app.use(h.store);app.use(router);const el=document.createElement('div');document.body.append(el);app.mount(el);apps.push(app);return {router,el};
}
it('clicking Profile from Search through the actual auth guard stays on Profile after loading and on re-entry',async()=>{
 const h=harness(),m=await navigationApp(h);expect(m.el.textContent).toContain('Recherche');[...m.el.querySelectorAll('button')].find(button=>button.textContent.includes('Profil')).click();await vi.waitFor(()=>expect(m.el.textContent).toContain('Profil Test'));expect(m.router.currentRoute.value.path).toBe('/profil');expect(h.getSession).toHaveBeenCalledOnce();await m.router.push('/search');[...m.el.querySelectorAll('button')].find(button=>button.textContent.includes('Profil')).click();await vi.waitFor(()=>expect(h.getSession).toHaveBeenCalledTimes(2));await vi.waitFor(()=>expect(m.el.textContent).toContain('Profil Test'));expect(m.router.currentRoute.value.path).toBe('/profil');
});
it('clicking Profile with a later detailed profile read failure stays on Profile with its retry destination',async()=>{
 const h=harness();h.lookup.mockRejectedValueOnce(Error('details offline'));const m=await navigationApp(h);[...m.el.querySelectorAll('button')].find(button=>button.textContent.includes('Profil')).click();await vi.waitFor(()=>expect(h.store.state.auth.profileLookupError).toEqual({path:'/profil'}));expect(m.router.currentRoute.value.path).toBe('/profil');expect(h.store.state.auth.logged_in).toBe(true);await Vue.nextTick();expect(m.el.textContent).not.toContain('Chargement');
});

it.each([false,true])('an auth service outage while entering Profile is retryable without redirecting to login (throws=%s)',async throws=>{
 const h=harness(),failure={error:{name:'AuthRetryableFetchError',status:503},throws},m=await navigationApp(h,failure);[...m.el.querySelectorAll('button')].find(button=>button.textContent.includes('Profil')).click();await vi.waitFor(()=>expect(h.store.state.auth.profileLookupError).toEqual({path:'/profil'}));expect(m.router.currentRoute.value.path).toBe('/search');expect(h.store.state.auth.logged_in).toBe(true);expect(h.store.state.profil.userUid).toBe('same-user');failure.error=null;
 const c=load('src/components/ProfileLoadError.vue');await c.methods.retry.call({$store:h.store,$router:m.router,profileLookupError:{path:'/profil'}});await vi.waitFor(()=>expect(m.el.textContent).toContain('Profil Test'));expect(m.router.currentRoute.value.path).toBe('/profil');
});
it('the route guard still recognizes a truly absent session',async()=>{
 const result=await authProfile.fetchAuthProfileState({auth:{getUser:async()=>({data:{user:null},error:{name:'AuthSessionMissingError',status:400}})}});expect(result.authenticated).toBe(false);expect(result.profileError).toBeNull();
});

it.each([{name:'AuthRetryableFetchError',status:503},{name:'TypeError'}, {status:500}])('balance checks tolerate temporary auth outage %j with an unexpired cached credential',async error=>{
 const h=harness();h.client.auth.getUser=vi.fn(async()=>({data:{user:null},error}));expect(await h.store.dispatch('auth/checkSessionOnly')).toBe(true);
});
it.each(['expired','missing','rejected'])('temporary auth outages never allow %s credentials',async kind=>{
 const h=harness();h.client.auth.getUser=vi.fn(async()=>({data:{user:null},error:{name:'AuthRetryableFetchError',status:503}}));
 if(kind==='expired')h.getSession.mockResolvedValue({data:{session:{...h.session,expires_at:1}},error:null});
 if(kind==='missing')h.getSession.mockResolvedValue({data:{session:null},error:null});
 if(kind==='rejected')h.client.auth.getUser.mockResolvedValue({data:{user:null},error:{status:401,name:'AuthApiError'}});
 expect(await h.store.dispatch('auth/checkSessionOnly')).toBe(false);
});
it('the real balance action and card remain on profile during an auth outage and offer a successful retry',async()=>{
 const h=harness(),replace=vi.fn(),accountReply={data:null,error:{code:'503'}},bridge={state:h.store.state,dispatch:h.store.dispatch};h.client.auth.getUser=vi.fn(async()=>({data:{user:null},error:{name:'AuthRetryableFetchError',status:503}}));
 const client={from:table=>({select(){return this;},eq(){return this;},single:async()=>accountReply,then(resolve){return Promise.resolve({data:[],error:null}).then(resolve);}})};
 const mod=load('src/store/profil.js',{'../store':bridge,'@/utils/supabaseClient.js':client,'@/router':{replace},'@/utils/serverApi.js':{serverRequest:async()=>{throw Error('offline');}},'@/utils/errorMessages.js':{humanizeSupabaseError:()=> 'Solde indisponible'}});h.store.hotUpdate({modules:{profil:mod}});
 const file='src/components/profile/CreditCard.vue',c=load(file),template=parse(readFileSync(file,'utf8')).descriptor.template.content,render=new Function('Vue',compile(template,{mode:'function',prefixIdentifiers:true}).code)(Vue);
 const app=Vue.createApp({...c,methods:{...c.methods,animerNombre(_,value){this.soldeWritable=value;}},render});app.use(h.store);
 for(const tag of new Set([...template.matchAll(/<(v-[a-z-]+)/g)].map(m=>m[1])))app.component(tag,{render(){return Vue.h(tag==='v-btn'?'button':'div',this.$attrs,this.$slots.default?.());}});
 const el=document.createElement('div');document.body.append(el);const vm=app.mount(el);apps.push(app);await vi.waitFor(()=>expect(vm.balanceError).toBe('Solde indisponible'));expect(vm.loadIn).toBe(false);expect(replace).not.toHaveBeenCalled();expect(el.textContent).toContain('Réessayer');
 accountReply.data={id:7,credit:14,gain:0};accountReply.error=null;[...el.querySelectorAll('button')].find(button=>button.textContent.includes('Réessayer')).click();await vi.waitFor(()=>expect(h.store.state.profil.soldes).toBe(14));expect(vm.loadIn).toBe(false);expect(vm.balanceError).toBe('');expect(replace).not.toHaveBeenCalled();
});
it('balance component rejects repeated refresh clicks and always clears a rejected loading state',async()=>{
 const c=load('src/components/profile/CreditCard.vue'),pending=defer(),vm={...c.data(),getSoldes:vi.fn(()=>pending.promise),updateSolde:vi.fn()};const a=c.methods.refreshBalance.call(vm);await c.methods.refreshBalance.call(vm);expect(vm.getSoldes).toHaveBeenCalledOnce();pending.reject(Error('offline'));await a;expect(vm.loadIn).toBe(false);expect(vm.balanceError).toContain('actualisé');expect(vm.updateSolde).not.toHaveBeenCalled();
});

it('the balance service reports expired auth without overriding its caller navigation',async()=>{
 const replace=vi.fn(),store={dispatch:async()=>false},c=load('src/store/profil.js',{'../store':store,'@/router':{replace}}),state=clone(c.state);state.userUid='same-user';
 const result=await c.actions.getSoldes({state});expect(result.status).toBe(1);expect(result.message).toContain('expiré');expect(replace).not.toHaveBeenCalled();
});
