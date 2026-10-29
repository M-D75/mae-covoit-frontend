const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const release=JSON.parse(fs.readFileSync(path.join(root,'release.json'),'utf8'));
const gradlePath=path.join(root,'android/app/build.gradle'),iosPath=path.join(root,'ios/App/App.xcodeproj/project.pbxproj');
let android=fs.readFileSync(gradlePath,'utf8'),ios=fs.readFileSync(iosPath,'utf8');
const build=/^(0|[1-9]\d{0,8})(\.(0|[1-9]\d{0,8})){0,2}$/;
for(const platform of ['web','android','ios'])if(!build.test(release[platform].build)||!/^\d+\.\d+\.\d+$/.test(release[platform].version))throw Error(`Invalid ${platform} release identity`);
if(!/^\d+$/.test(release.android.build)||Number(release.android.build)>2100000000)throw Error('Invalid Android build');
if(!Number.isInteger(release.protocol)||release.protocol<1)throw Error('Invalid protocol');
if(process.argv.includes('--sync')){
 android=android.replace(/versionCode \d+/,`versionCode ${release.android.build}`).replace(/versionName "[^"]+"/,`versionName "${release.android.version}"`);
 ios=ios.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g,`CURRENT_PROJECT_VERSION = ${release.ios.build};`).replace(/MARKETING_VERSION = [^;]+;/g,`MARKETING_VERSION = ${release.ios.version};`);
 fs.writeFileSync(gradlePath,android);fs.writeFileSync(iosPath,ios);
}
if(android.match(/versionCode (\d+)/)?.[1]!==release.android.build||android.match(/versionName "([^"]+)"/)?.[1]!==release.android.version)throw Error('Android differs from release.json; review then run check-release.cjs --sync');
for(const [key,value]of [['CURRENT_PROJECT_VERSION',release.ios.build],['MARKETING_VERSION',release.ios.version]]){
 const matches=[...ios.matchAll(new RegExp(`${key} = ([^;]+);`,'g'))];if(!matches.length||matches.some(m=>m[1]!==value))throw Error(`iOS ${key} differs from release.json`);
}
if(process.argv.includes('--check-assets')){
 for(const file of ['android/app/src/main/assets/public/release.json','ios/App/App/public/release.json']){
  const asset=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  if(String(asset.build)!==release.web.build||asset.version!==release.web.version||asset.protocol!==release.protocol)throw Error(`Stale bundled release metadata: ${file}; rebuild and sync Capacitor`);
 }
}
console.log(`Release identity verified: Android ${release.android.version} (${release.android.build}), iOS ${release.ios.version} (${release.ios.build}), web ${release.web.version} (${release.web.build}), protocol ${release.protocol}. Publication is not implied.`);
