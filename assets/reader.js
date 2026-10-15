(() => {
'use strict';
const script=document.currentScript||document.querySelector('script[data-mdf-reader]');
const site=new URL('../',script?.src||location.href);
const lastView=['today','archive','saved'].includes(sessionStorage.getItem('mdf-last-view'))?sessionStorage.getItem('mdf-last-view'):'today';
const home=new URL('index.html#'+lastView,site);
const key='mdf-progress::'+decodeURI(location.pathname.slice(site.pathname.length));
const bookmarkKey='mdf-bookmarks-v1',themeKey='mdf-theme-v1',sizeKey='mdf-font-size-v1';
const local=(name,fallback)=>{try{return JSON.parse(localStorage.getItem(name))??fallback}catch{return fallback}};
const store=(name,value)=>{try{localStorage.setItem(name,JSON.stringify(value))}catch{}};
const path=decodeURI(location.pathname.slice(site.pathname.length));
const media=matchMedia('(prefers-color-scheme: dark)');
let count=0, restored=false;
document.body.classList.add('mdf-reader');
const topbar=document.createElement('div');topbar.className='mdf-reader-bar';
topbar.innerHTML='<a class="mdf-back" href="'+home.href+'" aria-label="Back to the reading library">← Back</a><div class="mdf-reader-controls"><button type="button" id="mdf-save" aria-label="Save this article">▢</button><button type="button" id="mdf-options" aria-label="Reading settings" aria-expanded="false" aria-controls="mdf-settings">Aa</button></div>';
const progress=document.createElement('div');progress.className='mdf-scroll-progress';progress.setAttribute('aria-hidden','true');progress.innerHTML='<span></span>';
document.body.insertBefore(topbar,document.body.firstChild);document.body.insertBefore(progress,topbar);
const panel=document.createElement('div');panel.id='mdf-settings';panel.className='mdf-reader-settings';panel.hidden=true;
panel.innerHTML='<label for="mdf-decrease">Text size</label><button id="mdf-decrease" type="button" aria-label="Decrease text size">A−</button><output id="mdf-size" aria-live="polite"></output><button id="mdf-increase" type="button" aria-label="Increase text size">A+</button><button id="mdf-theme" type="button" aria-label="Change appearance">Auto</button>';
topbar.after(panel);
document.querySelectorAll('header a[href*="index.html"]').forEach(a=>a.classList.add('mdf-legacy-back'));
function savedPaths(){const value=local(bookmarkKey,[]);return Array.isArray(value)?value:[]}
function refreshSave(){const value=savedPaths().includes(path),btn=document.getElementById('mdf-save');btn.textContent=value?'▣':'▢';btn.setAttribute('aria-pressed',String(value));btn.setAttribute('aria-label',value?'Remove saved article':'Save this article')}
function offlineMessage(type){
 if(!('serviceWorker' in navigator))return;
 navigator.serviceWorker.ready.then(reg=>(navigator.serviceWorker.controller||reg.active)?.postMessage({type,path})).catch(()=>{});
}
document.getElementById('mdf-save').addEventListener('click',()=>{
 const items=new Set(savedPaths()),isSaved=items.has(path);
 if(isSaved)items.delete(path);else items.add(path);
 store(bookmarkKey,[...items]);refreshSave();offlineMessage(isSaved?'REMOVE_SAVED':'CACHE_SAVED');
});
refreshSave();
document.getElementById('mdf-options').addEventListener('click',()=>{
 panel.hidden=!panel.hidden;document.getElementById('mdf-options').setAttribute('aria-expanded',String(!panel.hidden));
});
function currentTheme(){const t=local(themeKey,'light');return ['system','light','dark'].includes(t)?t:'system'}
function theme(){
 const selected=currentTheme(),mode=selected==='system'?(media.matches?'dark':'light'):selected;
 document.documentElement.dataset.theme=mode;
 document.getElementById('mdf-theme').textContent=({system:'Auto',light:'Light',dark:'Dark'})[selected];
 let color=document.querySelector('meta[name="theme-color"]');if(!color){color=document.createElement('meta');color.name='theme-color';document.head.append(color)}
 color.content=mode==='dark'?'#25221E':'#F3E6D6';
}
media.addEventListener?.('change',theme);theme();
document.getElementById('mdf-theme').addEventListener('click',()=>{
 const options=['system','light','dark'];store(themeKey,options[(options.indexOf(currentTheme())+1)%options.length]);theme();
});
function font(){
 const value=Math.max(16,Math.min(24,Number(local(sizeKey,19))||18));
 document.documentElement.style.setProperty('--reader-size',value+'px');
 document.getElementById('mdf-size').textContent=value+'px';
}
font();
document.getElementById('mdf-decrease').addEventListener('click',()=>{store(sizeKey,Math.max(16,(Number(local(sizeKey,19))||18)-2));font();saveProgress()});
document.getElementById('mdf-increase').addEventListener('click',()=>{store(sizeKey,Math.min(24,(Number(local(sizeKey,19))||18)+2));font();saveProgress()});
topbar.querySelector('.mdf-back').addEventListener('click',event=>{
 try{
  if(document.referrer&&new URL(document.referrer).origin===location.origin&&new URL(document.referrer).pathname.startsWith(site.pathname)&&history.length>1){event.preventDefault();history.back()}
 }catch{}
});
function getMax(){return Math.max(1,document.documentElement.scrollHeight-window.innerHeight)}
function saveProgress(){
 const y=Math.max(0,window.scrollY),fraction=Math.max(0,Math.min(1,y/getMax()));
 store(key,{fraction,y,updatedAt:Date.now()});
 progress.firstElementChild.style.width=(fraction*100).toFixed(1)+'%';
}
function scrollChange(){if(count)return;count=requestAnimationFrame(()=>{count=0;saveProgress()})}
addEventListener('scroll',scrollChange,{passive:true});
addEventListener('pagehide',saveProgress);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveProgress()});
addEventListener('resize',scrollChange);
addEventListener('load',()=>{
 if(restored)return;restored=true;
 const data=local(key,null);
 const nav=performance.getEntriesByType?.('navigation')?.[0];
 if(!location.hash&&nav?.type!=='back_forward'&&data&&Number.isFinite(data.fraction)&&data.fraction>0){
   const y=Math.round(Math.min(getMax(),Math.max(0,data.fraction*getMax())));
   scrollTo(0,y);
 }
 saveProgress();
});
if(document.readyState==='complete')dispatchEvent(new Event('load'));
if('serviceWorker' in navigator){navigator.serviceWorker.register(new URL('service-worker.js',site),{updateViaCache:'none'}).then(reg=>reg.update().catch(()=>{})).catch(()=>{})}
})();