import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {describe,it,expect} from 'vitest';
const module={exports:{}};
const {code}=transformSync(readFileSync('src/services/tripNotifications.js','utf8'),{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']});
new Function('module','exports','require',code)(module,module.exports,()=>({}));
const {notificationTarget,notificationNumber}=module.exports;
describe('notification routing and grouping',()=>{
    it('opens the actual conversation from flat FCM data and supports legacy actions',()=>{
        const peerId='10000000-0000-4000-8000-000000000001';
        expect(notificationTarget({type:'chat',tripId:'8',peerId})).toEqual({path:'/message',query:{tripId:'8',peerId}});
        expect(notificationTarget({tripId:'8',actions:JSON.stringify({goTo:'/trip'})})).toEqual({path:'/trip',query:{tripId:'8'}});
    });
    it('rejects arbitrary routes, malformed IDs and outside links',()=>{
        expect(notificationTarget({goTo:'https://outside.example',tripId:'8'}).path).toBe('/profil');
        expect(notificationTarget({goTo:'/trip',tripId:'bad'})).toEqual({path:'/profil'});
    });
    it('uses stable separate notification slots per trip and conversation',()=>{
        const a={type:'chat',tripId:8,peerId:'a'};
        expect(notificationNumber(a)).toBe(notificationNumber(a));expect(notificationNumber(a)).not.toBe(notificationNumber({...a,tripId:9}));expect(notificationNumber(a)).not.toBe(notificationNumber({...a,peerId:'b'}));
    });
});
