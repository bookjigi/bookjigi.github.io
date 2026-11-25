// Node 22+, no packages or credentials. Run from the repository root.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BLOG='river1962', HOST='https://blog.naver.com', RSS='https://rss.blog.naver.com/river1962.xml';
const groups={journal:['92','책방일지','책방 일지'],intro:['90','책방소개','책방 소개']};
const archivePath='content/bookshop-archive.json', statusPath='docs/static/naver-sync-status.json';
const canonical=id=>`${HOST}/${BLOG}/${id}`;
const validId=id=>/^\d{9,13}$/.test(String(id));
const isoDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().startsWith(d);
const sortDate=(a,b)=>b.date.localeCompare(a.date);
const clean=s=>String(s).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,' ').replace(/\s+/g,' ').trim();
const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
const decode=s=>s.replace(/&(amp|lt|gt|quot|apos|nbsp|#\d{1,7}|#x[\da-f]{1,6});/gi,(all,k)=>{if(k[0]!=='#')return entities[k.toLowerCase()]??all;const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):Number(k.slice(1));return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):''});
const text=s=>clean(decode(s.replace(/<!--[\s\S]*?-->/g,'').replace(/<br\b[^>]*>/gi,' ').replace(/<[^>]+>/g,'')));
const clip=(s,n)=>{const a=Array.from(s);return a.length<=n?s:a.slice(0,n-1).join('').trimEnd()+'…'};
export const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=(tag,name)=>decode(tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,'i'))?.[2]??'');
function samePost(link,id){try{const u=new URL(link);return u.origin===HOST&&!u.username&&!u.password&&u.pathname===`/${BLOG}/${id}`}catch{return false}}
function rightGroup(a,g){try{const u=new URL(attr(a,'href'),HOST);return u.origin===HOST&&u.pathname==='/PostList.naver'&&u.searchParams.get('blogId')===BLOG&&u.searchParams.get('categoryNo')===groups[g][0]&&text(a)===groups[g][1]}catch{return false}}
// Naver's public desktop SmartEditor HTML includes complete per-post headers on the
// category and PostView pages. Trust only each post's own category and copy URL;
// never discover candidates from notices, recommendations, owner lists or JS globals.
export function parsePublic(html,g){
  if(!Object.hasOwn(groups,g))return [];
  const safe=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'');
  const blocks=[...safe.matchAll(/<div\b[^>]*\bid=["']post-view(\d{9,13})["'][^>]*>/gi)];
  const found=[];
  for(const [i,b] of blocks.entries()){
    const id=b[1], block=safe.slice(b.index+b[0].length,blocks[i+1]?.index??safe.length);
    const head=block.match(/<!--\s*SE_DOC_HEADER_START\s*-->([\s\S]*?)<!--\s*SE_DOC_HEADER_END\s*-->/)?.[1];
    if(!head)continue;
    const a=head.match(/<div\b[^>]*class=["'][^"']*\bblog2_series\b[^"']*["'][^>]*>\s*(<a\b[^>]*>[\s\S]*?<\/a>)/i)?.[1]??'';
    if(!rightGroup(a,g))continue;
    const input=[...head.matchAll(/<input\b[^>]*>/gi)].map(x=>x[0]).find(x=>attr(x,'class').split(/\s+/).includes('copyTargetUrl'));
    if(!input||!samePost(attr(input,'value'),id))throw Error(`Unverified source for ${id}`);
    const title=text(head.match(/<div\b[^>]*class=["'][^"']*\bse-title-text\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]??'');
    const dateParts=text(head.match(/<span\b[^>]*class=["'][^"']*\bse_publishDate\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]??'').match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})(?:\.|\s|$)/);
    const date=dateParts?.slice(1).map(v=>v.padStart(2,'0')).join('-');
    if(!title||!isoDate(date))throw Error(`Missing public title/date for ${id}`);
    const body=block.split('<!-- SE_DOC_HEADER_END -->')[1]?.split('<!-- // Rabbit HTML -->')[0]??'';
    let first='';for(const p of body.matchAll(/<!--\s*SE-TEXT\s*\{\s*-->\s*(<p\b[^>]*>[\s\S]*?<\/p>)/gi)){first=text(p[1]);if(first)break;}
    // No external media, body, contact details or arbitrary URLs enter the archive.
    const summary=first.replace(/(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w.-]+\.\w+|\b0\d{1,2}[ -]?\d{3,4}[ -]?\d{4}\b/gi,'').trim();
    found.push({id:Number(id),category:g,title:clip(title,180),date,summary:clip(summary,110)||'공개 원문에서 자세한 내용을 읽으실 수 있습니다.',source:canonical(id)});
  }
  return found;
}
function rssIds(xml,g){const ids=[];for(const it of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)){const field=n=>decode((it[1].match(new RegExp(`<${n}>([\\s\\S]*?)</${n}>`,'i'))?.[1]??'').trim().replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/,'$1'));if(field('category')!==groups[g][1])continue;const link=field('link');try{const id=new URL(link).pathname.split('/').pop();if(validId(id)&&samePost(link,id))ids.push(id)}catch{}}return [...new Set(ids)].slice(0,12)}
async function publicGet(url){const r=await fetch(url,{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(25000),headers:{'user-agent':'Mozilla/5.0 (compatible; BookjigiPublicArchive/1.0; +https://bookjigi.kr/bookshop/)','accept-language':'ko-KR,ko;q=0.9'}});if(!r.ok)throw Error(`Naver HTTP ${r.status}`);const max=12*1024*1024;let size=0;const chunks=[];for await(const chunk of r.body){if((size+=chunk.length)>max)throw Error('Naver response too large');chunks.push(chunk)}return Buffer.concat(chunks).toString('utf8')}
export async function collect(get=publicGet){const rows=[],modes={};let rss;
  for(const [g,[no]] of Object.entries(groups)){try{
    const byId=new Map();for(const page of [1,2]){const html=await get(`${HOST}/PostList.naver?blogId=${BLOG}&from=postList&categoryNo=${no}&currentPage=${page}`);const records=parsePublic(html,g);if(!records.length)throw Error('empty or unsupported public category page');for(const r of records)byId.set(r.id,r)}rows.push(...byId.values());modes[g]='public-category';
  }catch(err){console.warn(`::warning::${g}: ${err.message}; trying public RSS with PostView verification`);rss??=await get(RSS);let n=0;for(const id of rssIds(rss,g)){const detail=await get(`${HOST}/PostView.naver?blogId=${BLOG}&logNo=${id}`);const r=parsePublic(detail,g).find(x=>String(x.id)===id);if(r){rows.push(r);n++}}if(!n)throw Error(`Cannot verify any public records for ${g}; no files written`);modes[g]='rss-public-detail-fallback';}}
  return {rows,modes};
}
export function addNew(records,rows){const seen=new Set(records.map(r=>String(r.id))),added=[];for(const r of rows){const id=String(r.id);if(!Object.hasOwn(groups,r.category)||seen.has(id)||!validId(id)||!isoDate(r.date)||r.date<'2024-01-01'||!r.title||!samePost(r.source,id))continue;seen.add(id);added.push({id:Number(id),category:r.category,title:clip(clean(r.title),180),date:r.date,type:'원문 연결',summary:clip(clean(r.summary),110),source:canonical(id),parts:[],links:[],hiddenImages:0,hasMedia:false,image:null,isExternal:true,isSensitive:false,sync:{origin:'naver-public',categoryNo:Number(groups[r.category][0]),mode:'excerpt-link-only'}})}return added.sort(sortDate)}
function card(r){const [year,month,day]=r.date.split('-'),t=escapeHtml(r.title);return `<article class="story-card" data-story data-year="${year}" data-title="${t}"><a class="story-card-link" href="${canonical(r.id)}" target="_blank" rel="noopener noreferrer"><div class="story-cover" aria-hidden="true"><img src="/img/logo.png" alt=""><span>하동책방의 기록</span><b>${year}<small>${month} · ${day}</small></b></div><div class="story-card-body"><div class="story-meta"><span>${groups[r.category][2]}</span><time datetime="${r.date}">${year}. ${month}. ${day}</time></div><h2>${t}</h2><p>${escapeHtml(r.summary)}</p><span class="story-read">블로그에서 전체 읽기 <span aria-hidden="true">↗</span></span></div></a></article>`}
function sub(s,re,fn){if([...s.matchAll(new RegExp(re.source,'g'))].length!==1)throw Error(`Archive markup changed: ${re.source}`);return s.replace(re,fn)}
export function renderArchive(html,g,records,added){const rows=records.filter(r=>r.category===g),ids=new Set(rows.map(r=>String(r.id))), counts=Object.fromEntries(Object.keys(groups).map(k=>[k,records.filter(r=>r.category===k).length]));const years={};for(const r of rows)years[r.date.slice(0,4)]=(years[r.date.slice(0,4)]??0)+1;const ys=Object.keys(years).sort().reverse();
  html=sub(html,/(<div class="archive-grid">)([\s\S]*?)(<\/div><p class="archive-empty")/,(_,a,body,z)=>{
    const seen=new Set(),cards=[];const article=/<article\b[^>]*\bdata-story\b[^>]*>[\s\S]*?<\/article>/g;
    if(body.replace(article,'').trim())throw Error('Unexpected archive content, refusing to rebuild');
    for(const [markup] of body.matchAll(article)){const id=markup.match(/class="story-card-link" href="[^"?#]*\/(\d{9,13})\/?"/)?.[1],date=markup.match(/<time datetime="([\d-]+)"/)?.[1];if(!id||!ids.has(id)||seen.has(id)||!isoDate(date))throw Error('Existing card does not match archive');seen.add(id);cards.push({date,markup})}
    for(const r of added.filter(r=>r.category===g)){if(!seen.has(String(r.id))){cards.push({date:r.date,markup:card(r)});seen.add(String(r.id))}}if(seen.size!==rows.length)throw Error('Archive/card count mismatch; refusing to overwrite');return a+cards.sort(sortDate).map(x=>x.markup).join('\n')+z});
  html=sub(html,/(class="archive-stats"><strong>)\d+(<small>개의 기록<\/small><\/strong><span>)\d{4}[^<]*\d{4}(<br>)/,(_,a,b,c)=>a+rows.length+b+ys.at(-1)+' — '+ys[0]+c);
  for(const k of Object.keys(groups))html=sub(html,new RegExp(`(href="/bookshop/${k}/"[^>]*>${groups[k][2]} <span>)\\d+(</span>)`),(_,a,b)=>a+counts[k]+b);
  html=sub(html,/(<div class="archive-years"[^>]*>)[\s\S]*?(<\/div>)/,(_,a,b)=>a+`<button type="button" data-year-filter="all" aria-pressed="true">전체 ${rows.length}</button>`+ys.map(y=>`<button type="button" data-year-filter="${y}" aria-pressed="false">${y} <small>${years[y]}</small></button>`).join('')+b);
  html=sub(html,/(data-count>)전체 \d+개의 기록(<\/p>)/,(_,a,b)=>a+`전체 ${rows.length}개의 기록`+b);
  return html.replace(/<p>\d{4}년 \d{1,2}월 \d{1,2}일 기준으로 정리한 기록입니다\. 새 글이 자동으로 추가되는 목록은 아닙니다\.<\/p>/,'<p>새로 확인된 공개 글은 제목과 짧은 미리보기, 원문 링크로 자동 추가합니다.</p>');
}
export async function sync(root=process.cwd(),get=publicGet,now=new Date()){
  const read=f=>readFile(path.join(root,f),'utf8');const input=await read(archivePath),old=JSON.parse(input.replace(/^\uFEFF/,''));if(old.blog!==BLOG||!Array.isArray(old.records)||!old.records.length)throw Error('Missing expected archive');
  const {rows,modes}=await collect(get),added=addNew(old.records,rows);const records=added.length?[...old.records,...added].sort(sortDate):old.records;
  const plan=new Map(),pretty=x=>JSON.stringify(x,null,2)+'\n';if(added.length||old.autoSync!==true)plan.set(archivePath,pretty({...old,autoSync:true,records}));
  for(const g of Object.keys(groups))for(const f of [`src/pages/bookshop-${g}.html`,`docs/bookshop/${g}/index.html`]){const orig=await read(f);const result=renderArchive(orig,g,records,added);if(orig!==result)plan.set(f,result)}
  for(const f of ['src/pages/bookshop.html','docs/bookshop/index.html']){const orig=await read(f);let result=orig;for(const [k,[,,label]] of Object.entries(groups)){const n=records.filter(r=>r.category===k).length;result=sub(result,new RegExp(`(href="/bookshop/${k}/"[^>]*>${label} <span>)\\d+(</span>)`),(_,a,b)=>a+n+b);result=sub(result,new RegExp(`(<h2>${label} <small>)\\d+(</small></h2>)`),(_,a,b)=>a+n+b)}if(result!==orig)plan.set(f,result)}
  const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);let previous='';try{previous=await read(statusPath)}catch(e){if(e.code!=='ENOENT')throw e}
  const healthy=Object.values(modes).every(x=>x==='public-category');const status=pretty({blog:BLOG,checkedDayKST:day,lastFullSuccessDayKST:healthy?day:(previous?JSON.parse(previous).lastFullSuccessDayKST:null),sources:modes,counts:Object.fromEntries(Object.keys(groups).map(g=>[g,records.filter(r=>r.category===g).length]))});if(status!==previous)plan.set(statusPath,status);
  // Validate every source, retained card and count before the first write. The Actions
  // runner commits nothing on any error, even if a local filesystem write fails.
  for(const [f,data] of plan){await mkdir(path.dirname(path.join(root,f)),{recursive:true});await writeFile(path.join(root,f),data,'utf8')}
  console.log(`New public records: ${added.length}; changed files: ${plan.size}; sources: ${JSON.stringify(modes)}`);return {added,files:[...plan.keys()],modes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await sync();
