(() => {
'use strict';
const $ = selector => document.querySelector(selector);
const views = ['today','archive','saved'];
const STORE = 'mdf-bookmarks-v1';
const FEED_CACHE = 'mdf-feeds-v1';
const THEME = 'mdf-theme-v1';
const PROGRESS = 'mdf-progress::';
const names = [
  ['ai-technology','AI & Technology'],['philosophy-psychology','Philosophy & Psychology'],
  ['economics-policy','Economics & Public Policy'],['sustainable-business','Sustainable Business'],['rotating-field','Rotating Field']
];
let docs = [], latest = '', view = '', lastRefresh = 0, loading = null;
const safeRead = (key, fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback} catch {return fallback}};
const safeWrite = (key, data) => {try {localStorage.setItem(key,JSON.stringify(data));return true}catch{return false}};
const status = (message, alert=false) => {const node=$('#feed-status');node.textContent=message;node.setAttribute('role',alert?'alert':'status')};
function validPath(path){
  if(typeof path!=='string'||!path.endsWith('.html')||path.startsWith('/')||path.includes('\\')||path.includes('..')||path.includes(':')||path.includes('?')||path.includes('#'))return false;
  try {const url=new URL(path,location.href);return url.origin===location.origin&&url.pathname.startsWith(new URL('./',location.href).pathname)}catch{return false}
}
function category(doc){return doc.category || names.find(c=>doc.path.toLowerCase().includes(c[0]))?.[1] || 'Other'}
function day(doc){const found=String(doc.date||doc.path||'').match(/20\d{2}[-_/]\d{1,2}[-_/]\d{1,2}/);return found ? found[0].replaceAll('/','-').replaceAll('_','-') : ''}
function dateLabel(date){if(!date)return 'Earlier reports'; const value=new Date(date+'T12:00:00');return isNaN(value.getTime())?date:value.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
function displayTitle(doc){return doc.title.replace(/\s*[—–-]\s*\d{1,2}\s+[A-Za-z]+\s+20\d{2}\s*$/,'').replace(/\s*\|\s*My Daily Feed\s*$/i,'').trim()||doc.title}
function savedPaths(){const arr=safeRead(STORE,[]);return Array.isArray(arr)?arr.filter(x=>typeof x==='string'):[]}
function saved(path){return savedPaths().includes(path)}
function progress(path){const p=safeRead(PROGRESS+path,null);return p&&Number.isFinite(Number(p.fraction))?Math.max(0,Math.min(100,Math.round(Number(p.fraction)*100))):0}
function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
function addMeta(container,parts){const row=element('div','metadata');parts.filter(Boolean).forEach(part=>row.append(element('span','',part)));container.append(row)}
function bookmarkButton(doc){
 const btn=element('button','bookmark',saved(doc.path)?'▣':'▢');
 btn.type='button';btn.dataset.bookmark=doc.path;btn.setAttribute('aria-pressed',String(saved(doc.path)));
 btn.setAttribute('aria-label',(saved(doc.path)?'Remove saved article: ':'Save article: ')+displayTitle(doc));
 btn.title=saved(doc.path)?'Remove from saved':'Save for later';
 return btn;
}
function addProgress(card,doc){
 const value=progress(doc.path);
 if(!value)return;
 const row=element('div','metadata',value>=98?'Finished':'Continue reading · '+value+'%');row.style.marginTop='8px';card.append(row);
 const track=element('div','progress-track');track.setAttribute('aria-label','Reading progress '+value+' percent');
 const fill=element('span');fill.style.width=value+'%';track.append(fill);card.append(track);
}
function card(doc,featured=false){
 const article=element('article',featured?'featured':'article-card');
 if(featured){
   const label=element('div','feature-label');label.append(element('span','tag',category(doc)));
   label.append(bookmarkButton(doc));article.append(label);
   const h=element('h2','feature-title');const a=element('a','',displayTitle(doc));a.href=doc.path;h.append(a);article.append(h);
   article.append(element('p','description','A complete, independent learning report with evidence, diagrams and sources.'));
   addMeta(article,[dateLabel(day(doc)),'In-depth reading']);addProgress(article,doc);
 } else {
   const text=element('div','card-text');
   text.append(element('span','tag',category(doc)));
   const h=element('h3','card-title');const a=element('a','',displayTitle(doc));a.href=doc.path;h.append(a);text.append(h);
   addMeta(text,[dateLabel(day(doc)),'Learning report']);addProgress(text,doc);
   article.append(text,bookmarkButton(doc));
 }
 return article;
}
function renderToday(){
 const sorted=[...docs].sort((a,b)=>day(b).localeCompare(day(a))||names.findIndex(x=>x[1]===category(a))-names.findIndex(x=>x[1]===category(b)));
 latest=sorted.length?day(sorted[0]):'';
 const today=sorted.filter(d=>day(d)===latest);
 const featured=$('#featured-slot'),list=$('#today-list'),recent=$('#recent-slot');
 featured.replaceChildren();list.replaceChildren();recent.replaceChildren();
 $('#today-title').textContent=latest?'Latest edition':'Today’s reading';
 $('#today-intro').textContent=latest?dateLabel(latest)+' · '+today.length+' independent '+(today.length===1?'report':'reports')+'. Pick a topic and read at your own pace.':'Your daily learning library.';
 $('#edition-count').textContent=today.length?today.length+' available':'';
 if(today.length){featured.append(card(today[0],true));today.slice(1).forEach(d=>list.append(card(d)));}
 else featured.append(empty('No reports yet','The next published edition will appear here.'));
 const older=sorted.filter(d=>day(d)!==latest).slice(0,2);
 if(older.length){const items=element('div','article-list');older.forEach(d=>items.append(card(d)));recent.append(items)}
 else recent.append(empty('No older editions yet','Past editions will appear here as the archive grows.'));
}
function empty(title,message){const box=element('div','empty-state');box.append(element('h3','',title),element('p','',message));return box}
function renderArchive(){
 const search=$('#search').value.trim().toLocaleLowerCase(),subject=$('#subject').value;
 const filtered=docs.filter(d=>(!subject||category(d)===subject)&&(!search||[d.title,d.path,category(d),day(d)].join(' ').toLocaleLowerCase().includes(search)))
 .sort((a,b)=>day(b).localeCompare(day(a))||displayTitle(a).localeCompare(displayTitle(b)));
 const root=$('#archive-results');root.replaceChildren();
 if(!filtered.length){root.append(empty('No matching reports',docs.length?'Try another search or subject.':'No published reports are available yet.'));return}
 const byDay=new Map();
 filtered.forEach(d=>{const date=day(d);if(!byDay.has(date))byDay.set(date,[]);byDay.get(date).push(d)});
 byDay.forEach((items,date)=>{const section=element('section');const title=element('h2','day-heading',dateLabel(date));section.append(title);const grid=element('div','article-list');items.forEach(d=>grid.append(card(d)));section.append(grid);root.append(section)});
}
function renderSaved(){
 const selected=savedPaths();const root=$('#saved-list');root.replaceChildren();
 const items=selected.map(path=>docs.find(d=>d.path===path)).filter(Boolean);
 if(!items.length){root.append(empty('Nothing saved yet','Select the bookmark icon on a report to keep it here.'));return}
 items.forEach(d=>root.append(card(d)));
}
function render(){renderToday();renderArchive();renderSaved()}
async function cacheSaved(path,remove=false){
 if(!('serviceWorker' in navigator))return;
 try{
   const reg=await navigator.serviceWorker.ready;
   const worker=navigator.serviceWorker.controller||reg.active;
   if(worker)worker.postMessage({type:remove?'REMOVE_SAVED':'CACHE_SAVED',path});
 }catch{}
}
function toggleSave(path){
 const current=new Set(savedPaths()),remove=current.has(path);
 if(remove)current.delete(path);else current.add(path);
 if(!safeWrite(STORE,[...current])){status('Unable to save on this device. Check browser storage settings.',true);return}
 cacheSaved(path,remove);
 render();status(remove?'Removed from saved articles.':'Added to saved articles.');
}
function changeView(next){
 next=views.includes(next)?next:'today';
 if(view===next)return;
 if(view)sessionStorage.setItem('mdf-scroll-'+view,String(window.scrollY));
 view=next;
 views.forEach(name=>{
   $('#'+name+'-screen').hidden=name!==view;
   const btn=document.querySelector('[data-view="'+name+'"]');
   if(name===view)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
 });
 document.title=({today:'Latest edition',archive:'All reports',saved:'Saved articles'})[view]+' — My Daily Feed';
 requestAnimationFrame(()=>window.scrollTo(0,Number(sessionStorage.getItem('mdf-scroll-'+view)||0)));
}
function requestedView(){return location.hash.replace('#','').toLowerCase()}
function selectView(name){
 if(!views.includes(name))name='today';
 if(requestedView()===name){changeView(name);return}
 location.hash=name;
}
const media=window.matchMedia('(prefers-color-scheme: dark)');
function storedTheme(){const t=safeRead(THEME,'system');return ['system','light','dark'].includes(t)?t:'system'}
function applyTheme(){
 const t=storedTheme();document.documentElement.dataset.theme=t==='system'?(media.matches?'dark':'light'):t;
 $('#theme-button').textContent='Appearance: '+({system:'Auto',light:'Light',dark:'Dark'})[t];
 document.querySelector('meta[name="theme-color"]').content=document.documentElement.dataset.theme==='dark'?'#161b1c':'#FAF9F6';
}
async function refresh(force=false){
 if(!force&&Date.now()-lastRefresh<15000)return;
 if(loading)return loading;
 lastRefresh=Date.now();
 loading=(async()=>{
  try{
   const r=await fetch('./feeds.json?updated='+Date.now(),{cache:'no-store'});
   if(!r.ok)throw new Error('HTTP '+r.status);
   const incoming=await r.json();if(!Array.isArray(incoming))throw new Error('Bad feed');
   const next=incoming.filter(d=>d&&validPath(d.path)&&typeof d.title==='string'&&d.title.trim()).map(d=>({title:d.title.trim(),path:d.path,date:day(d),category:typeof d.category==='string'&&d.category?d.category:undefined}));
   const unique=[...new Map(next.map(d=>[d.path,d])).values()];
   const changed=JSON.stringify(unique)!==JSON.stringify(docs);
   docs=unique;safeWrite(FEED_CACHE,docs);
   if(changed)render();
   status('');lastRefresh=Date.now();
  }catch(error){
   if(!docs.length)status('Offline. Connect to the internet to load reports.',true);
   else status('Showing saved report list. The app will check for updates when online.');
  }finally{loading=null}
 })();
 return loading;
}
function init(){
 docs=safeRead(FEED_CACHE,[]).filter(d=>d&&validPath(d.path)&&typeof d.title==='string');
 render();
 applyTheme();media.addEventListener?.('change',applyTheme);
 $('#theme-button').addEventListener('click',()=>{const order=['system','light','dark'];safeWrite(THEME,order[(order.indexOf(storedTheme())+1)%order.length]);applyTheme()});
 document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>selectView(btn.dataset.view)));
 document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>selectView(btn.dataset.go)));
 window.addEventListener('hashchange',()=>changeView(requestedView()));
 changeView(requestedView());
 $('#search').addEventListener('input',renderArchive);
 $('#subject').addEventListener('change',renderArchive);
 document.addEventListener('click',event=>{
   const b=event.target.closest('button[data-bookmark]');
   if(b){event.preventDefault();toggleSave(b.dataset.bookmark)}
   const a=event.target.closest('a[href$=".html"]');
   if(a&&a.href.startsWith(new URL('./',location.href).href)){sessionStorage.setItem('mdf-scroll-'+view,String(window.scrollY));sessionStorage.setItem('mdf-last-view',view)}
 });
 window.addEventListener('pageshow',()=>{render();refresh(true)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();refresh(true)}});
 window.addEventListener('online',()=>refresh(true));
 window.addEventListener('focus',()=>refresh());
 setInterval(()=>{if(!document.hidden)refresh()},60000);
 refresh(true);
 if('serviceWorker' in navigator){
   navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(reg=>{reg.update().catch(()=>{});savedPaths().forEach(path=>cacheSaved(path))}).catch(()=>{});
 }
}
init();
})();