export const CATEGORIES = Object.freeze({world:'Världen',science:'Vetenskap',ai:'AI',other:'Perspektiv'});
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const DAY = 86400000;
export function validTime(value) {
  if(typeof value!=='string'||!iso.test(value)||!Number.isFinite(Date.parse(value)))return false;
  const [year,month,day]=value.slice(0,10).split('-').map(Number);
  const normalized=new Date(Date.UTC(year,month-1,day));
  return normalized.toISOString().slice(0,10)===value.slice(0,10) && Number(value.slice(11,13))<24 && Number(value.slice(14,16))<60 && Number(value.slice(17,19))<60;
}
export function safeURL(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !u.hostname.includes('.') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname) || /^\d[\d.]*$/.test(u.hostname) || u.hostname.includes(':')) return null;
    return u.href;
  } catch { return null; }
}
export function stockholmDate(value) { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value)); }
export function validateEdition(d, now = Date.now()) {
  const errors = [];
  const check = (yes,message) => { if (!yes) errors.push(message); };
  const text = (v,max=2000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return ['Utgåvan måste vara ett objekt.'];
  check(d.schemaVersion === 1,'schemaVersion måste vara 1.');
  check(d.timezone === 'Europe/Stockholm','Fel tidszon.');
  for (const key of ['generatedAt','windowStart','windowEnd']) check(validTime(d[key]),`${key}: ogiltig tid.`);
  const start=Date.parse(d.windowStart),end=Date.parse(d.windowEnd),generated=Date.parse(d.generatedAt);
  check(end > start && end-start === DAY,'Urvalsfönstret måste omfatta exakt 24 timmar.');
  check(generated >= end && generated <= now + 300000,'Framställningstiden ligger före urvalsslutet eller i framtiden.');
  check(/^\d{4}-\d{2}-\d{2}$/.test(d.editionId || '') && (validTime(d.windowEnd) && d.editionId === stockholmDate(d.windowEnd)),'editionId måste vara urvalsslutets Stockholmsdatum.');
  check(['published','partial','empty'].includes(d.status),'Ogiltig publiceringsstatus.');
  check(text(d.editorialNote,1600),'Redaktionsnot saknas eller är för lång.');
  if (!Array.isArray(d.stories)) return [...errors,'stories måste vara en lista.'];
  check(d.stories.length <= 30,'Högst 30 nyheter per utgåva.');
  check((d.status === 'empty') === (d.stories.length === 0),'Tom status och antal nyheter stämmer inte överens.');
  const ids=new Set();
  for (const [i,s] of d.stories.entries()) {
    const p=`Nyhet ${i+1}: `;
    if (!s || typeof s !== 'object') { errors.push(p+'måste vara ett objekt.'); continue; }
    check(/^[a-z0-9][a-z0-9-]{2,90}$/.test(s.id || '') && !ids.has(s.id),p+'unikt säkert id krävs.'); ids.add(s.id);
    check(Object.hasOwn(CATEGORIES,s.category),p+'okänd kategori.');
    for (const [key,max] of [['title',180],['summary',800],['whyItMatters',1000]]) check(text(s[key],max),p+key+' saknas eller är för lång.');
    check(Array.isArray(s.details) && s.details.length>0 && s.details.length<=8 && s.details.every(x=>text(x,1500)),p+'details måste innehålla 1–8 korta stycken.');
    const dateOnly=s.publishedAt===null;
    check(dateOnly ? (s.publishedDate===d.editionId && d.status==='partial' && s.caveats?.length>0) : (validTime(s.publishedAt) && Date.parse(s.publishedAt)>=start && Date.parse(s.publishedAt)<=end),p+'publiceringstid måste ligga inom urvalsfönstret; datum utan klockslag kräver dagens datum, partial och reservation.');
    check(s.eventDate === null || (typeof s.eventDate==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s.eventDate) && Number.isFinite(Date.parse(s.eventDate+'T00:00:00Z')) && new Date(s.eventDate+'T00:00:00Z').toISOString().slice(0,10)===s.eventDate),p+'eventDate ska vara giltigt datum eller null.');
    check(validTime(s.verifiedAt) && (dateOnly || Date.parse(s.verifiedAt)>=Date.parse(s.publishedAt)) && Date.parse(s.verifiedAt)<=generated,p+'verifieringstid är ogiltig.');
    check(['high','medium'].includes(s.confidence),p+'ogiltig säkerhetsnivå.');
    check(['news','research','analysis'].includes(s.kind),p+'okänd artikeltyp.');
    check(typeof s.preprint === 'boolean',p+'preprint måste anges.');
    check(Array.isArray(s.caveats) && s.caveats.length<=8 && s.caveats.every(x=>text(x,1000)),p+'caveats måste vara en lista med korta reservationer.');
    if (!Array.isArray(s.sources) || !s.sources.length || s.sources.length>8) { errors.push(p+'1–8 källor krävs.'); continue; }
    const urls=new Set();
    for (const source of s.sources) {
      const url=safeURL(source?.url);
      check(text(source?.name,160) && url!==null && !urls.has(url),p+'varje källa behöver namn och unik publik HTTPS-länk.'); urls.add(url);
      check(source?.publishedAt === null || (validTime(source?.publishedAt) && Date.parse(source.publishedAt)<=end),p+'källans publiceringstid är ogiltig.');
    }
    check(s.sources.some(source=>dateOnly ? (source?.publishedAt===null && source?.publishedDate===s.publishedDate) : source?.publishedAt===s.publishedAt),p+'huvudkällans tid måste styrka nyhetens publiceringstid.');
    if (dateOnly || s.confidence==='medium' || s.preprint) check(s.caveats?.length>0,p+'osäkerhet och preprint kräver förklaring.');
  }
  return errors;
}
export function freshness(d,now=Date.now()) {
  if (!d || !validTime(d.generatedAt)) return {state:'unknown',label:'Publiceringstid saknas'};
  if (d.status==='empty') return {state:'empty',label:'Ingen verifierad utgåva'};
  const parts=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
  const today=`${parts.year}-${parts.month}-${parts.day}`;
  const expected=Number(parts.hour)>=6 ? today : new Date(Date.parse(today+'T12:00:00Z')-DAY).toISOString().slice(0,10);
  if(d.editionId<expected)return {state:'delayed',label:'Dagens morgonutgåva saknas · tidigare urval visas'};
  const age=now-Date.parse(d.windowEnd);
  if (age > 26*3600000) return {state:'stale',label:'Äldre utgåva · ny uppdatering saknas'};
  if (d.status==='partial') return {state:'partial',label:'Begränsat urval'};
  return {state:'current',label:'Senast publicerade urval'};
}
export function matchesStory(story,category,query) {
  return (category==='all'||story.category===category) && `${story.title} ${story.summary} ${story.whyItMatters} ${story.sources.map(s=>s.name).join(' ')}`.toLocaleLowerCase('sv').includes(query.trim().toLocaleLowerCase('sv'));
}
export function readingMinutes(story) { return Math.max(1,Math.ceil([story.summary,story.whyItMatters,...story.details,...story.caveats].join(' ').split(/\s+/).length/200)); }
