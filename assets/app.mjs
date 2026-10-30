import {CATEGORIES,validateEdition,freshness,matchesStory,readingMinutes,safeURL} from './model.mjs';
const $=id=>document.getElementById(id);
const state={edition:null,category:'all',query:'',visible:[],activeId:null,opener:null};
const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const dayFmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',day:'numeric',month:'long',year:'numeric'});
const date=value=>value ? fmt.format(new Date(value)) : 'Klockslag saknas';
function el(tag,text,className) { const n=document.createElement(tag); if(text!==undefined)n.textContent=text; if(className)n.className=className; return n; }
function section(parent,title,paragraphs){ const h=el('h3',title);parent.append(h);paragraphs.forEach(p=>parent.append(el('p',p))); }
function sourceLink(source) {
  const item=el('li'),a=el('a',`${source.name} →`),url=safeURL(source.url);
  if(url){a.href=url;a.target='_blank';a.rel='noopener noreferrer';item.append(a);}else item.append(el('span',source.name));
  item.append(el('small',source.publishedAt ? `Publicerad ${date(source.publishedAt)} · svensk tid` : `Publiceringsdatum ${source.publishedDate || 'saknas'} · klockslag/tidszon inte verifierade`));return item;
}
function clearFilters(){state.category='all';state.query='';$('search').value='';updateFilters();render();}
function updateFilters(){document.querySelectorAll('[data-category]').forEach(b=>{const yes=b.dataset.category===state.category;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});}
function render(){
  const stories=state.edition.stories;state.visible=stories.filter(s=>matchesStory(s,state.category,state.query));
  $('story-count').textContent=`${state.visible.length} av ${stories.length} nyheter`;
  const grid=$('stories');grid.replaceChildren();grid.setAttribute('aria-busy','false');
  for(const s of state.visible){
    const card=el('article',undefined,'story-card'),button=el('button',undefined,'card-button');button.type='button';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label',`Läs mer: ${s.title}`);button.dataset.storyId=s.id;
    const top=el('div',undefined,'card-top');top.append(el('span',CATEGORIES[s.category],'category'),el('span',String(stories.indexOf(s)+1).padStart(2,'0'),'card-number'));button.append(top,el('h3',s.title),el('p',s.summary,'card-summary'));
    const tags=[];if(s.preprint)tags.push('Preprint · ej sakkunniggranskad');if(s.kind==='analysis')tags.push('Analys');if(s.publishedAt===null)tags.push('Datumkontrollerad · klockslag saknas');if(tags.length)button.append(el('p',tags.join(' / '),'card-tag'));
    const bottom=el('div',undefined,'card-bottom');bottom.append(el('span',`${s.sources[0].name} · ${readingMinutes(s)} min läsning`,'card-source'));const more=el('span','Läs mer','read-more');more.append(el('span','→'));bottom.append(more);button.append(bottom);card.append(button);button.addEventListener('click',()=>openStory(s.id,button));grid.append(card);
  }
  const none=!state.visible.length; $('empty-state').hidden=!none;$('reset-filters').hidden=!stories.length;
  $('empty-title').textContent=stories.length?'Inga nyheter matchar sökningen.':'Inga verifierade nyheter i den här utgåvan.';
  $('empty-description').textContent=stories.length?'Prova ett annat sökord eller visa alla ämnen.':'Vi fyller inte luckorna med antaganden. Läs redaktionsnoten ovan för vad som kunde verifieras.';
}
function showDialog(opener){state.opener=opener||document.activeElement;if(!$('reader').open)$('reader').showModal();$('reader-title').focus();$('reader').scrollTop=0;}
function openStory(id,opener){
  const s=state.edition.stories.find(s=>s.id===id);if(!s)return;state.activeId=id;
  $('reader-category').textContent=`${CATEGORIES[s.category]} / ${s.kind==='research'?'Forskning':s.kind==='analysis'?'Analys':'Nyhet'}${s.preprint?' / Preprint':''}`;
  $('reader-title').textContent=s.title;
  $('reader-meta').textContent=`${s.publishedAt ? `Publicerad ${date(s.publishedAt)} (svensk tid)` : `Publiceringsdatum ${s.publishedDate} · klockslag och tidszon saknas`}${s.eventDate?` · Händelsedatum ${s.eventDate}`:' · Händelsedatum inte preciserat'} · Kontrollerad ${date(s.verifiedAt)} · ${readingMinutes(s)} min läsning`;
  const body=$('reader-body');body.replaceChildren(el('p',s.summary,'lead'));section(body,'Det här vet vi',s.details);body.append(el('p','Redaktionell bedömning','analysis-label'));section(body,'Varför det spelar roll',[s.whyItMatters]);
  if(s.caveats.length){const aside=el('aside',undefined,'caveat');aside.append(el('h3','Viktiga förbehåll'));const list=el('ul');s.caveats.forEach(c=>list.append(el('li',c)));aside.append(list);body.append(aside);}
  section(body,'Källor & vidare läsning',[]);const list=el('ul',undefined,'source-list');s.sources.forEach(source=>list.append(sourceLink(source)));body.append(list);
  const idx=state.visible.findIndex(v=>v.id===id);$('reader-position').textContent=`${idx+1} / ${state.visible.length}`;$('previous-story').disabled=idx<=0;$('next-story').disabled=idx>=state.visible.length-1;$('reader-nav').hidden=false;
  showDialog(opener||state.opener);
}
function openAbout(){
  state.activeId=null;$('reader-category').textContent='METOD & ÖPPENHET';$('reader-title').textContent='Ett urval, inte hela världen.';$('reader-meta').textContent='Källkritik före snabbhet. Korta sammanfattningar före informationsbrus.';
  const body=$('reader-body');body.replaceChildren();section(body,'Så läser du Morgonbrief',['Nyhetskorten ger en kort orientering. Öppna ett kort för bakgrund, redaktionell relevansbedömning, källor och osäkerhet. Originalkällorna öppnas i en ny flik.']);
  section(body,'Vad betyder senaste dygnet?',['Varje utgåva anger ett exakt 24-timmarsfönster. Källans publiceringstid avgör om en nyhet ryms i fönstret — inte när händelsen inträffade eller när sidan besöks. Svensk tid används i presentationen.','Källor som enbart visar dagens datum kan tas med i ett begränsat urval, men märks tydligt som datumkontrollerade. Utan klockslag och tidszon kan vi inte bevisa att de ligger exakt inom 24-timmarsgränsen. Äldre bakgrund kan förekomma som kompletterande källor, inte som en ny händelse.']);
  section(body,'Vad urvalet prioriterar',['Samhällsbetydelse, konsekvenser, ny vetenskap och utvecklingen inom AI. Primärkällor eftersträvas. Forskningsartiklar, pressmeddelanden och medier är olika slags underlag; preliminära resultat och författarnas egna anspråk ska framgå.','Det här är redaktionella sammanfattningar, inte originalartiklar. Faktauppgifter och redaktionell tolkning hålls åtskilda. Ingen automatiserad sammanfattning är en garanti för att en källa är korrekt.']);
  section(body,'Om något inte går att verifiera',['Hellre ett mindre urval än utfyllnad. En ofullständig utgåva märks som begränsad. Om publiceringen misslyckas ligger den senast godkända utgåvan kvar med sitt ursprungliga datum. Sidan daterar aldrig om gammalt innehåll till idag.']);
  section(body,'Integritet & tillgänglighet',['Sidan använder ingen analysmätning, reklam eller tredjepartsskript. Den skickar inga sökord till en server. Läsrutan kan stängas med Escape eller kryssknappen; textstorleken kan ökas med Aa. Alla funktioner går att nå med tangentbord.']);
  $('reader-nav').hidden=true;showDialog($('about-button'));
}
function close(){if($('reader').open)$('reader').close();}
$('close-reader').addEventListener('click',close);
$('reader').addEventListener('close',()=>{state.opener?.focus();state.activeId=null;});
$('reader').addEventListener('click',event=>{if(event.target===$('reader')){const r=$('reader').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
$('font-size').addEventListener('click',()=>{const large=$('reader').classList.toggle('large-text');$('font-size').setAttribute('aria-pressed',String(large));});
for(const [id,offset] of [['previous-story',-1],['next-story',1]])$(id).addEventListener('click',()=>{const idx=state.visible.findIndex(s=>s.id===state.activeId);const story=state.visible[idx+offset];if(story)openStory(story.id,state.opener);});
$('about-button').addEventListener('click',openAbout);
document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.category;updateFilters();if(state.edition)render();}));
$('search').addEventListener('input',event=>{state.query=event.target.value;if(state.edition)render();});
$('reset-filters').addEventListener('click',clearFilters);$('reload').addEventListener('click',()=>location.reload());
async function load(){
  try{
    const response=await fetch(new URL('../data/latest.json',import.meta.url),{cache:'no-cache'});if(!response.ok)throw new Error('Källfilen svarar inte.');const d=await response.json();const errors=validateEdition(d);if(errors.length)throw new Error('Utgåvan klarade inte datakontrollen.');state.edition=d;
    $('edition-date').textContent=dayFmt.format(new Date(d.windowEnd));$('edition-label').textContent=dayFmt.format(new Date(d.windowEnd));$('window-label').textContent=`${date(d.windowStart)} — ${date(d.windowEnd)} · svensk tid`;
    const f=freshness(d);$('freshness').textContent=f.label;$('freshness').dataset.state=f.state;
    $('editorial-note').textContent=`${d.editorialNote} Sammanställd ${date(d.generatedAt)} (svensk tid).`;$('editorial-note').hidden=false;render();
  }catch(error){$('stories').setAttribute('aria-busy','false');$('error-state').hidden=false;$('error-message').textContent=`${error.message} Inget overifierat innehåll visas. Försök igen om en stund.`;$('freshness').textContent='Utgåvan kunde inte verifieras';$('freshness').dataset.state='unknown';$('edition-label').textContent='Ingen utgåva kunde läsas';}
}
load();
