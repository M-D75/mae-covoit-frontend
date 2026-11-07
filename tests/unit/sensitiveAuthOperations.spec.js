import {createClient} from '@supabase/supabase-js';
import {createAuthSessionGuard,runAuthSession} from '@/services/authSessionGuard.js';
import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {it,expect,vi,afterEach} from 'vitest';
import * as guardModule from '@/services/authSessionGuard.js';
import * as preferences from '@/services/travelPreferences.js';
import * as authProfile from '@/services/authProfile.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const clone=x=>JSON.parse(JSON.stringify(x));
const values=()=>{const data=new Map();return {data,storage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>{data.set(k,v);},removeItem:k=>{data.delete(k);}}};};
function load(file,deps={},named=false){
 let source=readFileSync(file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;
 const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>deps[id]||(id.endsWith('authSessionGuard.js')?guardModule:id.endsWith('travelPreferences.js')?preferences:{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),mapGetters:()=>({}),defineComponent:x=>x,Capacitor:{getPlatform:()=> 'web'}}));return named?m.exports:m.exports.default;
}
const session=id=>({access_token:'fixture-token-'+id,refresh_token:'fixture-refresh-'+id,expires_at:Math.floor(Date.now()/1000)+3600,user:{id}});
let instance=0;const clients=[];
async function sdk(fetcher){
 const {data,storage}=values(),key='fixture-sensitive-auth-'+(++instance);data.set(key,JSON.stringify(session('A')));
 const guard=createAuthSessionGuard({storage,fetch:fetcher}),client=createClient('https://fixture.example.test','fixture-anon-key',{global:{fetch:guard.fetch},auth:{storageKey:key,storage:guard.storage,persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
 guard.attach(client);clients.push(client);await client.auth.getSession();return {client,guard,data,key};
}
afterEach(async()=>{vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();for(const client of clients.splice(0)){await client.auth.stopAutoRefresh();client.auth.broadcastChannel?.close();}});
const json=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
function passwordView(client){
 const c=load('src/components/menus/BottomMenu.vue',{'@/utils/supabaseClient':client}),profile={userUid:'A',accountGeneration:1};
 const vm={passwordBusy:false,passwordEpoch:0,moneyDisposed:false,open_b:true,passwordChange:{password:'fixture-password-only',passwordComfirmed:'fixture-password-only'},$store:{state:{profil:profile},dispatch:vi.fn(async()=>({status:0}))}};return {c,vm,profile};
}
it('blocks the audited SDK password request after A switches to B',async()=>{
 const fetcher=vi.fn(async()=>json({id:'B'})),{client,data,key}=await sdk(fetcher),{c,vm,profile}=passwordView(client);
 const pending=c.methods.changePassword.call(vm);profile.userUid='B';profile.accountGeneration++;data.set(key,JSON.stringify(session('B')));await pending;
 expect(fetcher).not.toHaveBeenCalled();expect((await client.auth.getSession()).data.session.user.id).toBe('B');expect(vm.showSnackbarSuccess).toBeUndefined();
});
it('blocks a password request when SDK session B arrives before the profile store catches up',async()=>{
 const fetcher=vi.fn(async()=>json({id:'B'})),{client,data,key}=await sdk(fetcher),{c,vm}=passwordView(client);
 const pending=c.methods.changePassword.call(vm);data.set(key,JSON.stringify(session('B')));await pending;expect(fetcher).not.toHaveBeenCalled();expect((await client.auth.getSession()).data.session.user.id).toBe('B');
});
it('preserves B storage when A password confirmation returns late from the SDK',async()=>{
 const reply=deferred(),fetcher=vi.fn(()=>reply.promise),{client,data,key}=await sdk(fetcher),{c,vm,profile}=passwordView(client);
 const pending=c.methods.changePassword.call(vm);await vi.waitFor(()=>expect(fetcher).toHaveBeenCalledOnce());expect(new Headers(fetcher.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer fixture-token-A');
 profile.userUid='B';profile.accountGeneration++;data.set(key,JSON.stringify(session('B')));reply.resolve(json({id:'A'}));await pending;
 expect((await client.auth.getSession()).data.session.user.id).toBe('B');expect(vm.showSnackbarSuccess).toBeUndefined();expect(vm.$store.dispatch).not.toHaveBeenCalled();
});
it('preserves B storage when A SDK sign-out returns after account deletion',async()=>{
 const reply=deferred(),fetcher=vi.fn(()=>reply.promise),{client,data,key}=await sdk(fetcher),profile={userUid:'A',accountGeneration:1,modeCo:'online'},commit=vi.fn();
 const c=load('src/store/auth.js',{'@/utils/supabaseClient.js':client,'@/utils/serverApi.js':{serverRequest:async()=>({data:{message:'fixture A deleted'}})}});
 const pending=c.actions.removeAccount({rootState:{profil:profile},commit});await vi.waitFor(()=>expect(fetcher).toHaveBeenCalledOnce());profile.userUid='B';profile.accountGeneration++;data.set(key,JSON.stringify(session('B')));reply.resolve(json({}));
 expect(await pending).toMatchObject({stale:true});expect((await client.auth.getSession()).data.session.user.id).toBe('B');expect(commit).not.toHaveBeenCalled();
});
it('preserves B SDK session even when its profile event has not arrived during old sign-out',async()=>{
 const reply=deferred(),fetcher=vi.fn(()=>reply.promise),{client,data,key}=await sdk(fetcher);
 const pending=runAuthSession(client,{userId:'A',isCurrent:()=>true},'signOut',{scope:'local'});await vi.waitFor(()=>expect(fetcher).toHaveBeenCalledOnce());data.set(key,JSON.stringify(session('B')));reply.resolve(json({}));await expect(pending).rejects.toMatchObject({code:'SESSION_CHANGED'});expect((await client.auth.getSession()).data.session.user.id).toBe('B');
});
it('keeps normal SDK password changes, headers and delayed scoped logout working',async()=>{
 const fetcher=vi.fn(async()=>json({id:'A'})),{client}=await sdk(fetcher),{c,vm}=passwordView(client);vi.useFakeTimers();
 await c.methods.changePassword.call(vm);expect(fetcher).toHaveBeenCalledOnce();expect(JSON.parse(fetcher.mock.calls[0][1].body).password).toBe('fixture-password-only');expect(vm.showSnackbarSuccess).toBe(true);expect(vm.passwordChange.password).toBe('');
 await vi.advanceTimersByTimeAsync(4000);expect(vm.$store.dispatch).toHaveBeenCalledWith('auth/logout',{expectedUserId:'A',accountGeneration:1});
});
for(const changed of ['account','unmount','closed'])it(`cancels password logout after ${changed}`,async()=>{
 const {client}=await sdk(async()=>json({id:'A'})),{c,vm,profile}=passwordView(client);vi.useFakeTimers();await c.methods.changePassword.call(vm);
 if(changed==='account'){profile.userUid='B';profile.accountGeneration++;}
 if(changed==='unmount')c.beforeUnmount.call(vm);
 if(changed==='closed'){vm.open_b=false;c.watch.open_b.call(vm);}
 await vi.advanceTimersByTimeAsync(4000);expect(vm.$store.dispatch).not.toHaveBeenCalled();
});
it('shows a password network failure and releases the form for retry',async()=>{
 const {client}=await sdk(async()=>{throw Error('fixture network failure');}),{c,vm}=passwordView(client);await c.methods.changePassword.call(vm);expect(vm.showSnackbarError).toBe(true);expect(vm.passwordBusy).toBe(false);expect(vm.showSnackbarSuccess).toBeUndefined();
});
it('blocks repeated password submissions while the SDK is waiting',async()=>{
 const reply=deferred(),fetcher=vi.fn(()=>reply.promise),{client}=await sdk(fetcher),{c,vm}=passwordView(client);const pending=c.methods.changePassword.call(vm);await c.methods.changePassword.call(vm);await vi.waitFor(()=>expect(fetcher).toHaveBeenCalledOnce());vm.moneyDisposed=true;reply.resolve(json({id:'A'}));await pending;expect(fetcher).toHaveBeenCalledOnce();
});
it('serializes a legitimate new sign-in until the sensitive SDK operation finishes',async()=>{
 const reply=deferred(),calls=[],fetcher=vi.fn(async(url,options)=>{calls.push({url:String(url),method:options.method});if(options.method==='PUT')return reply.promise;return json({access_token:'fixture-token-B',refresh_token:'fixture-refresh-B',expires_in:3600,token_type:'bearer',user:{id:'B'}});});
 const {client}=await sdk(fetcher);const change=runAuthSession(client,{userId:'A',isCurrent:()=>true},'updateUser',{password:'fixture-password-only'});await vi.waitFor(()=>expect(calls).toHaveLength(1));
 const login=client.auth.signInWithPassword({email:'b@example.test',password:'fixture-password-only'});await Promise.resolve();expect(calls).toHaveLength(1);reply.resolve(json({id:'A'}));await change;expect((await login).data.user.id).toBe('B');expect((await client.auth.getSession()).data.session.user.id).toBe('B');expect(calls.map(c=>c.method)).toEqual(['PUT','POST']);
});
it('keeps the SDK queue usable after a canceled sensitive operation',async()=>{
 const {client,data,key}=await sdk(async()=>json({}));await expect(runAuthSession(client,{userId:'B',isCurrent:()=>true},'updateUser',{password:'fixture'})).rejects.toMatchObject({code:'SESSION_CHANGED'});
 expect((await runAuthSession(client,{userId:'A',isCurrent:()=>true},'signOut',{scope:'local'})).error).toBeNull();expect(data.get(key)).toBeUndefined();
});
function creation(request,getUser=async()=>({data:{user:{id:'A'}},error:null})){
 const profile={userUid:'A',userId:1,accountGeneration:1,modeCo:'online'},c=load('src/store/auth.js',{'@/utils/serverApi.js':{serverRequest:request},'@/utils/supabaseClient.js':{auth:{getUser}}}),state=clone(c.state),commit=vi.fn((t,p)=>c.mutations[t](state,p));return {c,profile,state,commit,ctx:{state,rootState:{profil:profile},commit},input:{name:'Alpha',firstname:'Fixture A',village:''}};
}
it('does not create a profile after account changes during the user lookup',async()=>{
 const reply=deferred(),request=vi.fn(),h=creation(request,()=>reply.promise),pending=h.c.actions.createAccount(h.ctx,h.input);h.profile.userUid='B';h.profile.accountGeneration++;reply.resolve({data:{user:{id:'A'}},error:null});expect(await pending).toMatchObject({stale:true});expect(request).not.toHaveBeenCalled();
});
it('does not overwrite B id or initialize its payment after a late A profile response',async()=>{
 const reply=deferred(),request=vi.fn(()=>reply.promise),h=creation(request),pending=h.c.actions.createAccount(h.ctx,h.input);await vi.waitFor(()=>expect(request).toHaveBeenCalledOnce());h.profile.userUid='B';h.profile.userId=2;h.profile.accountGeneration++;reply.resolve({data:{account:{id:1,user_id:'A'}}});expect(await pending).toMatchObject({stale:true});expect(h.profile.userId).toBe(2);expect(h.commit).not.toHaveBeenCalled();expect(request).toHaveBeenCalledOnce();
});
it('does not overwrite B payment profile after A payment initialization returns late',async()=>{
 const reply=deferred(),request=vi.fn(async(_,path)=>path==='/account/profile'?{data:{account:{id:1,user_id:'A'}}}:reply.promise),h=creation(request),pending=h.c.actions.createAccount(h.ctx,h.input);await vi.waitFor(()=>expect(request).toHaveBeenCalledTimes(2));h.profile.userUid='B';h.profile.accountGeneration++;h.state.customer_id='cus_B';reply.resolve({data:{customer:{id:'cus_A'},provider:{id:'acct_A'}}});expect(await pending).toMatchObject({stale:true});expect(h.state.customer_id).toBe('cus_B');
});
it('binds both normal profile initialization requests to the original JWT owner',async()=>{
 const request=vi.fn(async(_,path)=>path==='/account/profile'?{data:{account:{id:1,user_id:'A'}}}:{data:{customer:{id:'cus_A'},provider:{id:'acct_A'}}}),h=creation(request);expect((await h.c.actions.createAccount(h.ctx,h.input)).status).toBe(0);expect(request.mock.calls.map(c=>c[2].expectedUserId)).toEqual(['A','A']);expect(h.state.customer_id).toBe('cus_A');
});
it('refuses an unexpected profile owner in a successful response',async()=>{
 const request=vi.fn(async()=>({data:{account:{id:2,user_id:'B'}}})),h=creation(request);expect((await h.c.actions.createAccount(h.ctx,h.input)).status).toBe(2);expect(h.commit).not.toHaveBeenCalled();expect(request).toHaveBeenCalledOnce();
});
it('leaves an already created profile successful if Stripe is temporarily unavailable',async()=>{
 const request=vi.fn(async(_,path)=>{if(path==='/account/profile')return {data:{account:{id:1,user_id:'A'}}};throw Error('fixture Stripe unavailable');}),h=creation(request);expect((await h.c.actions.createAccount(h.ctx,h.input)).status).toBe(0);expect(h.state.account_created).toBe(true);expect(h.profile.userId).toBe(1);
});
function creationView(createAccount){
 const c=load('src/views/CreateAccount.vue',{'@/services/authProfile.js':authProfile}),profile={userUid:'A',accountGeneration:1},vm={...c.data(),name:'Alpha',firstname:'Fixture A',village:'',$store:{state:{profil:profile}},$router:{replace:vi.fn(async()=>{})},$route:{query:{}},account_created:true,createAccount};return {c,vm,profile};
}
for(const changed of ['account','unmount'])it(`discards obsolete sign-up screen navigation after ${changed}`,async()=>{
 const reply=deferred(),{c,vm,profile}=creationView(vi.fn(()=>reply.promise));const pending=c.methods.tryCreateAccount.call(vm);if(changed==='account'){profile.userUid='B';profile.accountGeneration++;}else c.beforeUnmount.call(vm);reply.resolve({status:0});await pending;expect(vm.$router.replace).not.toHaveBeenCalled();expect(vm.showSnakBarInfo.showError).toBe(false);
});
it('removes payout choices and fee promises from the visible settings',()=>{
 const text=readFileSync('src/components/menus/setting/SelectVirement.vue','utf8'),{descriptor}=parse(text);expect(descriptor.template.content).toContain('La fréquence des virements ne peut pas être modifiée depuis Covia.');expect(descriptor.template.content).not.toMatch(/v-radio|@click|1 fois|0\.0|1\.0|0\.5/);expect(descriptor.styles[0].content).toContain('var(--font-color-label)');expect(descriptor.styles[0].content).toContain('var(--bg-app-color)');
});
it('keeps Supabase recovery e-mail arguments unchanged through the transition queue',async()=>{
 const reset=vi.fn(async()=>({error:null})),client={auth:{resetPasswordForEmail:reset}},box=values();createAuthSessionGuard({storage:box.storage,fetch:vi.fn()}).attach(client);
 await client.auth.resetPasswordForEmail('fixture@example.test');expect(reset).toHaveBeenCalledWith('fixture@example.test');
});
it('blocks the audited profile request if the JWT changes before transport',async()=>{
 const lookup=deferred(),getSession=vi.fn(()=>lookup.promise),network=vi.fn(),client={auth:{getUser:async()=>({data:{user:{id:'A'}},error:null}),getSession}};
 const api=load('src/utils/serverApi.js',{'axios':network,'@/utils/supabaseClient.js':client,'@/utils/clientIdentity.js':{getClientHeaders:async()=>({})}},true),c=load('src/store/auth.js',{'@/utils/serverApi.js':api,'@/utils/supabaseClient.js':client}),profile={userUid:'A',accountGeneration:1,modeCo:'online'},commit=vi.fn();
 const pending=c.actions.createAccount({state:clone(c.state),rootState:{profil:profile},commit},{name:'Alpha',firstname:'Fixture A',village:''});await vi.waitFor(()=>expect(getSession).toHaveBeenCalledOnce());lookup.resolve({data:{session:{user:{id:'B'},access_token:'fixture-token-B'}},error:null});expect(await pending).toMatchObject({stale:true});expect(network).not.toHaveBeenCalled();expect(commit).not.toHaveBeenCalled();
});
it('ignores an old password logout intent after a different account signs in',async()=>{
 const c=load('src/store/auth.js'),commit=vi.fn();expect(await c.actions.logout({rootState:{profil:{userUid:'B',accountGeneration:2}},commit},{expectedUserId:'A',accountGeneration:1})).toMatchObject({stale:true});expect(commit).not.toHaveBeenCalled();
});
it('keeps ordinary logout working through the guarded SDK',async()=>{
 const {client}=await sdk(async()=>json({})),profile={userUid:'A',accountGeneration:1},store={state:{profil:profile}},replace=vi.fn();
 const c=load('src/store/auth.js',{'@/utils/supabaseClient.js':client,'../store':store,'../router':{replace},'@/services/nativeTripTracking.js':{nativeTripTracking:{stop:async()=>{}}},'@/services/tripNotifications.js':{clearTripNotifications:async()=>{}}}),state=clone(c.state),commit=(t,p)=>{if(t==='profil/SET_USER_UID'){profile.userUid=p;profile.accountGeneration++;}else if(t==='CLEAR_TOKEN')c.mutations.CLEAR_TOKEN(state);};
 expect(await c.actions.logout({state,rootState:store.state,commit})).toMatchObject({status:0});expect((await client.auth.getSession()).data.session).toBeNull();expect(profile.userUid).toBe('');expect(replace).toHaveBeenCalledWith('/login');
});
it('requires a known profile owner before starting account creation',async()=>{
 const request=vi.fn(),h=creation(request);h.profile.userUid='';expect((await h.c.actions.createAccount(h.ctx,h.input)).status).toBe(1);expect(request).not.toHaveBeenCalled();
});
it('does not submit a creation form whose authenticated owner is missing',async()=>{
 const request=vi.fn(),{c,vm,profile}=creationView(request);profile.userUid='';await c.methods.tryCreateAccount.call(vm);expect(request).not.toHaveBeenCalled();expect(vm.showSnakBarInfo.showError).toBe(true);
});
it('retains an existing SDK session when the guarded storage adapter is introduced',async()=>{
 const box=values(),fetcher=vi.fn(async()=>json({id:'A'})),options={global:{fetch:fetcher},auth:{storage:box.storage,persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}},old=createClient('https://legacy-fixture.example.test','fixture-anon-key',options);
 const key='sb-legacy-fixture-auth-token';box.data.set(key,JSON.stringify(session('A')));expect((await old.auth.getSession()).data.session.user.id).toBe('A');await old.auth.stopAutoRefresh();old.auth.broadcastChannel?.close();
 const guard=createAuthSessionGuard({storage:box.storage,fetch:fetcher}),client=createClient('https://legacy-fixture.example.test','fixture-anon-key',{...options,global:{fetch:guard.fetch},auth:{...options.auth,storage:guard.storage}});guard.attach(client);clients.push(client);expect((await client.auth.getSession()).data.session.user.id).toBe('A');expect(box.data.get(key)).toBeTruthy();expect(fetcher).not.toHaveBeenCalled();
});
for(const updateProfile of [false,true])it(`protects a newer session during initial SDK token refresh, profile event=${updateProfile}`,async()=>{
 const reply=deferred(),fetcher=vi.fn(()=>reply.promise),{client,data,key}=await sdk(fetcher),profile={userUid:'A',accountGeneration:1};data.set(key,JSON.stringify({...session('A'),expires_at:Math.floor(Date.now()/1000)-1}));
 const pending=runAuthSession(client,{userId:'A',isCurrent:()=>profile.userUid==='A' && profile.accountGeneration===1},'updateUser',{password:'fixture-password-only'});
 await vi.waitFor(()=>expect(fetcher).toHaveBeenCalledOnce());expect(String(fetcher.mock.calls[0][0])).toContain('/auth/v1/token');
 if(updateProfile){profile.userUid='B';profile.accountGeneration++;}data.set(key,JSON.stringify(session('B')));reply.resolve(json({access_token:'fixture-refreshed-A',refresh_token:'fixture-refresh-A',expires_in:3600,token_type:'bearer',user:{id:'A'}}));
 await expect(pending).rejects.toMatchObject({code:'SESSION_CHANGED'});expect((await client.auth.getSession()).data.session.user.id).toBe('B');expect(fetcher).toHaveBeenCalledOnce();
});
