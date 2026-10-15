/* Network-first updates. Cache the shell and user-saved articles, not all visited reports. */
const VERSION='mdf-v4-terracotta-linen';
const SHELL=VERSION+'-shell', SAVED='mdf-saved-offline-v1';
const BASE=new URL(self.registration.scope);
const SHELL_FILES=['./','./index.html','./assets/site.css','./assets/app.js','./assets/reader.css','./assets/reader.js','./manifest.webmanifest','./assets/icon.svg','./assets/landscape.svg','./assets/apple-touch-icon.png','./assets/icon-192.png','./assets/icon-512.png','./feeds.json'];
const canonical=url=>new Request(new URL(url,BASE).origin+new URL(url,BASE).pathname,{method:'GET'});
const shellPaths=new Set(SHELL_FILES.map(p=>new URL(p,BASE).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(SHELL_FILES.map(p=>new URL(p,BASE)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mdf-v')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(request,{cache:'no-store'});
   if(response.ok&&shellPaths.has(url.pathname)){
     const cache=await caches.open(SHELL);
     await cache.put(canonical(request.url),response.clone());
   }
   return response;
  }catch{
   const saved=await caches.open(SAVED);
   const offline=await saved.match(canonical(request.url));
   if(offline)return offline;
   const shell=await caches.open(SHELL);
   const stored=await shell.match(canonical(request.url));
   if(stored)return stored;
   if(request.mode==='navigate'){
     return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline | My Daily Feed</title><main style="font:18px/1.6 system-ui;padding:28px"><h1>This article is not saved offline</h1><p>Reconnect to the internet, or return to your saved articles.</p><a href="' + BASE.pathname + 'index.html#saved">Saved articles</a></main></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
   }
   return Response.error();
  }
 })());
});
self.addEventListener('message',event=>{
 const data=event.data;
 if(!data||!['CACHE_SAVED','REMOVE_SAVED'].includes(data.type)||typeof data.path!=='string')return;
 if(data.path.includes('..')||data.path.includes('?')||data.path.includes('#')||data.path.includes('\\'))return;
 const url=new URL(data.path,BASE);
 if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||!url.pathname.endsWith('.html'))return;
 event.waitUntil((async()=>{
  const saved=await caches.open(SAVED),req=canonical(url);
  if(data.type==='REMOVE_SAVED'){await saved.delete(req);return}
  try{
   const response=await fetch(req,{cache:'no-store'});
   if(response.ok&&response.headers.get('content-type')?.includes('text/html'))await saved.put(req,response.clone());
  }catch{}
 })());
});
