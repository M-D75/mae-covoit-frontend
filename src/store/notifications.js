import {serverRequest} from '@/utils/serverApi.js';
const initial=()=>({open:false,filter:'all',pagesLoaded:0,items:[],unreadCount:0,nextCursor:null,loading:false,loadingMore:false,reading:false,error:'',readError:'',owner:null,revision:0});
let requestNumber=0;
export default {
    namespaced:true,state:initial(),
    mutations:{RESET(state){Object.assign(state,initial(),{revision:state.revision+1});},CLOSE(state){state.open=false;}},
    actions:{
        async open({state,dispatch}){state.open=true;if(state.filter!=='all')await dispatch('setFilter','all');else await dispatch('refresh');},
        async setFilter({state,dispatch},filter){
            if(!['all','unread'].includes(filter))return;
            if(state.filter!==filter){state.filter=filter;state.items=[];state.nextCursor=null;state.pagesLoaded=0;state.revision++;state.reading=false;state.readError='';}
            await dispatch('refresh');
        },
        async refresh({state,rootState},{more=false,keepPages=false}={}){
            const owner=rootState.profil.userUid,generation=rootState.profil.accountGeneration,revision=state.revision,filter=state.filter;
            if(!owner||state.reading)return;
            if(more&&(state.loading||state.loadingMore||!state.nextCursor))return;
            const request=++requestNumber;
            const current=()=>rootState.profil.userUid===owner&&rootState.profil.accountGeneration===generation&&state.revision===revision&&request===requestNumber;
            let cursor=more?state.nextCursor:null;
            const pages=keepPages&&!more?Math.max(1,state.pagesLoaded):1;
            state.owner=owner;state[more?'loadingMore':'loading']=true;state.error='';if(!more)state.loadingMore=false;
            try{
                let rows=[],unreadCount=0,loaded=0;
                do{
                    const response=await serverRequest('get','/notifications',{mode:rootState.profil.modeCo,params:{unread:filter==='unread'?'1':'0',...(cursor?{cursorAt:cursor.at,cursorId:cursor.id}:{})}});
                    if(!current())return;
                    const data=response.data?.data;
                    if(response.data?.status!=='ok'||!Array.isArray(data?.items)||!Number.isInteger(data.unreadCount)||data.unreadCount<0
                        ||(filter==='unread'&&data.unreadOnly!==true))throw new Error();
                    rows.push(...data.items);unreadCount=data.unreadCount;cursor=data.nextCursor||null;loaded++;
                }while(cursor&&loaded<pages);
                const all=more?[...state.items,...rows]:rows;
                state.items=[...new Map(all.map(row=>[String(row.id),row])).values()];
                state.nextCursor=cursor;state.unreadCount=unreadCount;state.pagesLoaded=more?state.pagesLoaded+loaded:loaded;
            }catch{if(current())state.error='Impossible de charger vos notifications. Réessayez.';}
            finally{if(current()){state.loading=false;state.loadingMore=false;}}
        },
        async markRead({state,rootState,dispatch},{ids,all=false}={}){
            if(state.reading)return false;
            const owner=rootState.profil.userUid,generation=rootState.profil.accountGeneration,revision=state.revision;
            const current=()=>rootState.profil.userUid===owner&&rootState.profil.accountGeneration===generation&&state.revision===revision;
            if(!owner)return false;
            ++requestNumber;state.loading=false;state.loadingMore=false;state.reading=true;state.readError='';
            let success=false;
            try{
                const response=await serverRequest('patch','/notifications/read',{mode:rootState.profil.modeCo,data:all?{all:true}:{ids}});
                if(!current())return false;
                const data=response.data?.data;
                if(response.data?.status!=='ok'||!Array.isArray(data?.readIds)||!Number.isInteger(data.unreadCount)||data.unreadCount<0)throw new Error();
                const read=new Set(data.readIds.map(String));
                state.items=state.items.map(item=>(read.has(String(item.id))||(all&&data.unreadCount===0))?{...item,readAt:data.readAt}:item);
                if(state.filter==='unread')state.items=state.items.filter(item=>!item.readAt);
                state.unreadCount=data.unreadCount;success=true;
            }catch{if(current())state.readError='La lecture n’a pas été enregistrée. Réessayez.';}
            finally{if(current())state.reading=false;}
            if(success&&current()&&state.filter==='unread'){
                if(state.unreadCount===0)state.nextCursor=null;
                else dispatch('refresh',{keepPages:true});
            }
            return success&&current();
        },
    },
};
