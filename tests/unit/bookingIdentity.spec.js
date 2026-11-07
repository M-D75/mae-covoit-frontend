import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {it,expect,vi} from 'vitest';
function load(session){const m={exports:{}};new Function('module','exports','require',transformSync(readFileSync('src/utils/serverApi.js','utf8'),{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id==='axios'?vi.fn():id.endsWith('supabaseClient.js')?{auth:{getSession:async()=>({data:{session}})}}:{getClientHeaders:async()=>({})});return m.exports;}
it('refuses to send a captured reservation under a different session JWT',async()=>{
 const api=load({access_token:'token-B',user:{id:'B'}});await expect(api.getAuthenticatedConfig({expectedUserId:'A'})).rejects.toMatchObject({code:'SESSION_CHANGED'});
});
it('uses the intended JWT without passing internal identity options to axios',async()=>{
 const api=load({access_token:'token-A',user:{id:'A'}});const config=await api.getAuthenticatedConfig({expectedUserId:'A',timeout:123});expect(config.headers.Authorization).toBe('Bearer token-A');expect(config.expectedUserId).toBeUndefined();expect(config.timeout).toBe(123);
});
