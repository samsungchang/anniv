// 우리 기념일 — 아이폰 홈 화면용 웹앱 (데이터는 이 기기 안에만 저장)
{
const K = 'anniv-v2', WD = '일월화수목금토';
const THEMES = [['rose','#ff4d7d','#fff','light-dark(#ffe9ef,#2a1219)'],['lilac','#8b6cff','#fff','light-dark(#efeaff,#1d1730)'],
 ['peach','#ff7a45','#fff','light-dark(#fff0e8,#2b170e)'],['ocean','#2f7dff','#fff','light-dark(#e8f0ff,#0f1a2e)'],
 ['mint','#12b886','#fff','light-dark(#e6f8f1,#0c2219)'],['mono','light-dark(#18161b,#f3f1f5)','light-dark(#fff,#111)','light-dark(#ecebee,#222026)']];
const THEME_META = {rose:'#ff4d7d',lilac:'#8b6cff',peach:'#ff7a45',ocean:'#2f7dff',mint:'#12b886',mono:'#18161b'};
const FONTS = [['modern','Noto Sans KR','모던'],['soft','Gowun Batang','감성'],['hand','Gaegu','손글씨'],['cute','Jua','귀염']];
const DAYS = [[1,14,'다이어리데이','새해 다이어리 선물',0],[2,14,'발렌타인데이','초콜릿 받는 날',0],[3,14,'화이트데이','내가 사탕·선물 챙기는 날',1],
 [4,14,'블랙데이','짜장면 데이트',0],[5,14,'로즈데이','장미 한 송이',1],[6,14,'키스데이','',0],[7,14,'실버데이','은반지·액세서리',0],
 [8,14,'그린데이','숲길 산책',0],[9,14,'포토데이','같이 사진 찍기',0],[10,14,'와인데이','와인 한 병',0],[11,11,'빼빼로데이','빼빼로 + 짧은 편지',1],
 [11,14,'무비데이','영화 데이트',0],[12,14,'허그데이','',0],[12,24,'크리스마스 이브','레스토랑은 미리 예약',1],[12,25,'크리스마스','선물 교환',1],[12,31,'연말','같이 카운트다운',0]];
const DEF = {start:'2025-06-07',me:'',her:'',hb:'',mb:'',msg:'',custom:[],photos:[],cover:'',pos:50,theme:'rose',font:'modern',layout:'full',sample:true};

let st = Object.assign({}, DEF), filter = 'all', cur = -1;
const urls = {}; // 사진 key → object URL
try { const s = JSON.parse(localStorage.getItem(K)); if (s) st = Object.assign({}, DEF, s); } catch (e) {}

const $ = id => document.getElementById(id);
const P = s => { const [a,b,c] = s.split('-').map(Number); return new Date(a, b-1, c); };
const T = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const diff = (a,b) => Math.round((b-a)/864e5);
const add = (d,n) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
const fmt = d => `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${WD[d.getDay()]}요일`;
const ny = (m,d,t) => { let x = new Date(t.getFullYear(), m-1, d); if (x < t) x = new Date(t.getFullYear()+1, m-1, d); return x; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dtxt = n => n === 0 ? 'D-DAY' : 'D-' + n;
const ymd = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
function toast(m){ const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2000); }

// ---- 사진 저장소 (IndexedDB) ----
let idb = null;
const openDB = () => new Promise((res, rej) => {
  const r = indexedDB.open('anniv', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('photos');
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const tx = (mode, fn) => new Promise((res, rej) => {
  const t = idb.transaction('photos', mode), s = t.objectStore('photos'), out = fn(s);
  t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error);
});
const putBlob = (k, b) => tx('readwrite', s => s.put(b, k));
const getBlob = k => tx('readonly', s => s.get(k));
const delBlob = k => tx('readwrite', s => s.delete(k));
async function loadUrls(){
  for (const p of st.photos) if (!urls[p.k]) { try { const b = await getBlob(p.k); if (b) urls[p.k] = URL.createObjectURL(b); } catch (e) {} }
}
const src = p => urls[p.k] || '';

function save(){
  try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) { toast('저장 공간이 부족해요'); }
}

function events(range = 366){
  const t = T(), end = add(t, range), S = P(st.start), ev = [], her = st.her || '여자친구', inR = d => d >= t && d <= end;
  for (let k = 100; k <= 20000; k += 100) { const d = add(S, k-1); if (d > end) break; if (inR(d)) ev.push({d, n:`${k}일`, s:k%1000===0?'큰 숫자, 특별하게':'우리 기념일', g:'us', m:1}); }
  for (let y = 1; y <= 60; y++) { const d = new Date(S.getFullYear()+y, S.getMonth(), S.getDate()); if (d > end) break; if (inR(d)) ev.push({d, n:`${y}주년`, s:'코스·선물 미리 준비', g:'us', m:1}); }
  if (st.hb) { const b = P(st.hb); ev.push({d:ny(b.getMonth()+1, b.getDate(), t), n:`${her} 생일`, s:'제일 중요, 2주 전부터 준비', g:'us', m:1, yr:1}); }
  if (st.mb) { const b = P(st.mb); ev.push({d:ny(b.getMonth()+1, b.getDate(), t), n:`${st.me||'내'} 생일`, s:'', g:'us', m:0, yr:1}); }
  DAYS.forEach(([m,d,n,s,k]) => ev.push({d:ny(m,d,t), n, s, g:'day', m:k, yr:1}));
  st.custom.forEach(c => { const b = P(c.d), d = c.r ? ny(b.getMonth()+1, b.getDate(), t) : b; if (inR(d)) ev.push({d, n:c.n, s:c.r?'매년 돌아오는 우리 날':'', g:'us', m:1, yr:c.r}); });
  return ev.sort((a,b) => a.d - b.d);
}
const row = (e,t) => { const n = diff(t, e.d); return `<li class="it${e.m?' m':''}"><div class="cal"><small>${e.d.getMonth()+1}월</small><b>${e.d.getDate()}</b></div><div><h4>${esc(e.n)}</h4><p>${WD[e.d.getDay()]}요일${e.s?' · '+esc(e.s):''}</p></div><span class="dd">${dtxt(n)}</span></li>`; };

function style(){
  const th = THEMES.find(x => x[0] === st.theme) || THEMES[0], f = FONTS.find(x => x[0] === st.font) || FONTS[0], r = document.documentElement.style;
  r.setProperty('--ac', th[1]); r.setProperty('--on', th[2]); r.setProperty('--tint', th[3]); r.setProperty('--kr', `"${f[1]}"`);
  document.body.classList.toggle('polar', st.layout === 'polar');
  document.querySelector('meta[name=theme-color]').setAttribute('content', THEME_META[st.theme] || '#ff4d7d');
}

function render(){
  style();
  const t = T(), S = P(st.start), dn = diff(S, t) + 1, me = st.me || '나', her = st.her || '여자친구';
  $('names').textContent = `${me} ♥ ${her}`;
  $('dn').textContent = dn.toLocaleString();
  $('since').textContent = `${fmt(S)}부터`;
  $('msg').textContent = st.msg;
  $('frame').dataset.cap = st.msg || `${me} ♥ ${her}`;
  const cp = st.photos.find(p => p.k === st.cover), cv = cp ? src(cp) : '';
  document.body.classList.toggle('nocov', !cv);
  if ($('cov').getAttribute('src') !== cv) { if (cv) { $('cov').src = cv; $('covThumb').src = cv; } else { $('cov').removeAttribute('src'); $('covThumb').removeAttribute('src'); } }
  $('cov').style.objectPosition = $('covThumb').style.objectPosition = `50% ${st.pos}%`;
  let y = t.getFullYear()-S.getFullYear(), m = t.getMonth()-S.getMonth(), d = t.getDate()-S.getDate();
  if (d < 0) { m--; d += new Date(t.getFullYear(), t.getMonth(), 0).getDate(); } if (m < 0) { y--; m += 12; }
  const nh = Math.ceil(Math.max(dn,1)/100)*100, pct = Math.round((dn-(nh-100))/100*100);
  const ev = events(), nx = ev.find(e => e.m);
  if (nx) { const n = diff(t, nx.d); $('next').innerHTML = `<div class="nxh"><div><p class="lab">다음 꼭 챙길 날</p><h2>${esc(nx.n)}</h2></div><span class="dd">${dtxt(n)}</span></div><p>${fmt(nx.d)}${nx.s?' · '+esc(nx.s):''}</p><div class="bar"><i style="width:${pct}%"></i></div><p style="margin-top:6px">${nh}일까지 ${nh-dn}일 남음</p>`; }
  $('stats').innerHTML = [[`${y?y+'년 ':''}${m}개월`,`${d}일째 되는 달`],[`${Math.floor((dn-1)/7)+1}주째`,'함께한 주'],[(dn*24).toLocaleString(),'함께한 시간']].map(([b,s]) => `<div class="st"><b>${b}</b><span>${s}</span></div>`).join('');
  $('prev').innerHTML = ev.slice(0,4).map(e => row(e,t)).join('');
  const f = ev.filter(e => filter==='all' || (filter==='must'&&e.m) || (filter==='us'&&e.g==='us') || (filter==='day'&&e.g==='day'));
  $('list').innerHTML = f.length ? f.map(e => row(e,t)).join('') : '<li class="empty">해당하는 날이 없어요</li>';
  const ph = st.photos, plus = '<svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>사진 추가';
  $('strip').innerHTML = ph.map((p,i) => ({p,i})).slice(-8).reverse().map(({p,i}) => `<button data-i="${i}"><img loading="lazy" src="${src(p)}" alt="${esc(p.c)}"></button>`).join('') + `<button class="add" data-add="1" style="width:96px">${plus}</button>`;
  $('grid').innerHTML = `<button class="add" data-add="1">${plus}</button>` + ph.map((p,i) => ({p,i})).reverse().map(({p,i}) => `<button data-i="${i}"><img loading="lazy" src="${src(p)}" alt="${esc(p.c)}"></button>`).join('');
  $('pcount').textContent = ph.length ? `${ph.length}장` : '';
  $('sw').innerHTML = THEMES.map(x => `<button data-t="${x[0]}" aria-label="${x[0]}" aria-pressed="${x[0]===st.theme}" style="background:${x[1]}"></button>`).join('');
  $('fonts').innerHTML = FONTS.map(x => `<button class="opt" data-f="${x[0]}" aria-pressed="${x[0]===st.font}"><b style="font-family:'${x[1]}'">${x[2]} 우리 ${dn}일</b><span>${x[1]}</span></button>`).join('');
  document.querySelectorAll('#lay .opt').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.layout));
  [['iMe','me'],['iHer','her'],['iStart','start'],['iHb','hb'],['iMb','mb'],['iMsg','msg']].forEach(([i,k]) => { if (document.activeElement !== $(i)) $(i).value = st[k]; });
  $('pos').value = st.pos; $('sample').hidden = !st.sample;
  $('mine').innerHTML = st.custom.length ? `<h3 style="margin:22px 0 6px;font-size:16px">추가한 날</h3>` + st.custom.map((c,i) => `<div class="tog"><span>${esc(c.n)} <small style="color:var(--mut)">${esc(c.d)}${c.r?' · 매년':''}</small></span><button class="btn rd sm" data-del="${i}">삭제</button></div>`).join('') : '';
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  $('store').textContent = standalone ? '모든 내용은 이 아이폰 안에 저장돼요.' : 'Safari 공유 버튼 → "홈 화면에 추가"를 하면 앱처럼 쓸 수 있어요.';
}

function route(){
  const v = (location.hash || '#home').slice(1), ok = ['home','days','album','deco'].includes(v) ? v : 'home';
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('on', s.id === 'v-'+ok));
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.dataset.v === ok));
  scrollTo(0, 0);
}

// 사진 줄이기: 긴 변 1600px JPEG
function shrink(file, max = 1600, q = .85){ return new Promise((res, rej) => {
  const u = URL.createObjectURL(file), im = new Image();
  im.onload = () => { const s = Math.min(1, max/Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth*s); c.height = Math.round(im.naturalHeight*s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
    c.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/jpeg', q); };
  im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); }; im.src = u; }); }
async function addPhoto(file){
  const b = await shrink(file), k = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  await putBlob(k, b); urls[k] = URL.createObjectURL(b);
  const p = {k, c:'', t:Date.now()}; st.photos.push(p); return p;
}

// 파일 내보내기: 공유 시트 우선, 안 되면 다운로드
async function giveFile(name, type, data){
  const file = new File([data], name, {type});
  try { if (navigator.canShare && navigator.canShare({files:[file]})) { await navigator.share({files:[file]}); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function makeICS(){
  const now = new Date(), stamp = now.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
  const L = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//uri-anniv//KO','CALSCALE:GREGORIAN','X-WR-CALNAME:우리 기념일'];
  const alarm = (tr, txt) => ['BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${txt}`,`TRIGGER:${tr}`,'END:VALARM'];
  const seen = new Set();
  events(1100).filter(e => e.m).forEach(e => {
    if (e.yr) { if (seen.has(e.n)) return; seen.add(e.n); }
    const name = e.n.replace(/[,;\\]/g, ' ');
    L.push('BEGIN:VEVENT', `UID:${ymd(e.d)}-${encodeURIComponent(e.n)}@uri-anniv`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.d)}`, `DTEND;VALUE=DATE:${ymd(add(e.d,1))}`, `SUMMARY:♥ ${name}`);
    if (e.yr) L.push('RRULE:FREQ=YEARLY');
    L.push(...alarm('-P6DT15H', `${name} 일주일 전`), ...alarm('-PT15H', `내일은 ${name}`), 'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}

// ---- 이벤트 연결 ----
addEventListener('hashchange', route);
document.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; filter = b.dataset.f; document.querySelectorAll('.seg .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); render(); });
const open = id => { $(id).hidden = false; }, close = () => document.querySelectorAll('.sheet').forEach(s => s.hidden = true);
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
$('fabDay').addEventListener('click', () => open('shDay'));
$('fDay').addEventListener('submit', e => { e.preventDefault(); const n = $('dN').value.trim(), d = $('dD').value; if (!n || !d) return; st.custom.push({n, d, r:$('dR').checked}); $('dN').value = ''; $('dD').value = ''; save(); render(); toast('추가했어요'); });
$('mine').addEventListener('click', e => { const i = e.target.dataset.del; if (i == null) return; st.custom.splice(+i, 1); save(); render(); });
const pick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.add) { $('fAlbum').click(); return; }
  if (b.dataset.i != null) { cur = +b.dataset.i; const p = st.photos[cur]; $('vImg').src = src(p); $('vCap').value = p.c || ''; open('shPh'); } };
$('grid').addEventListener('click', pick); $('strip').addEventListener('click', pick);
$('fAlbum').addEventListener('change', async e => { const fs = [...e.target.files]; e.target.value = ''; if (!fs.length) return; toast(`사진 ${fs.length}장 저장 중…`);
  let ok = 0; for (const f of fs) { try { await addPhoto(f); ok++; } catch (err) {} }
  save(); render(); toast(ok ? `${ok}장 추가했어요` : '사진을 저장하지 못했어요'); });
$('vSave').addEventListener('click', () => { if (cur < 0) return; st.photos[cur].c = $('vCap').value.trim(); save(); render(); close(); toast('저장했어요'); });
$('vCover').addEventListener('click', () => { const p = st.photos[cur]; if (!p) return; st.cover = p.k; save(); render(); close(); toast('커버로 바꿨어요'); });
$('vDel').addEventListener('click', async () => { const p = st.photos[cur]; if (!p) return;
  if ($('vDel').dataset.c !== '1') { $('vDel').dataset.c = '1'; $('vDel').textContent = '한 번 더 누르면 삭제돼요'; return; }
  $('vDel').dataset.c = ''; $('vDel').textContent = '사진 삭제'; st.photos.splice(cur, 1); if (st.cover === p.k) st.cover = '';
  try { await delBlob(p.k); } catch (e) {} if (urls[p.k]) { URL.revokeObjectURL(urls[p.k]); delete urls[p.k]; }
  save(); render(); close(); toast('삭제했어요'); });
const coverPick = () => $('fCover').click();
$('btnCov').addEventListener('click', coverPick); $('pickCov').addEventListener('click', coverPick);
$('fCover').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const p = await addPhoto(f); st.cover = p.k; st.pos = 50; save(); render(); toast('커버를 바꿨어요'); } catch (err) { toast('사진을 저장하지 못했어요'); } });
$('pos').addEventListener('input', e => { st.pos = +e.target.value; $('cov').style.objectPosition = $('covThumb').style.objectPosition = `50% ${st.pos}%`; });
$('pos').addEventListener('change', save);
$('sw').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.theme = b.dataset.t; save(); render(); });
$('fonts').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.font = b.dataset.f; save(); render(); });
$('lay').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.layout = b.dataset.v; save(); render(); });
[['iMe','me'],['iHer','her'],['iMsg','msg'],['iStart','start'],['iHb','hb'],['iMb','mb']].forEach(([i,k]) => $(i).addEventListener('input', e => {
  const v = e.target.value.trim(); if (k === 'start' && !v) return; st[k] = v; if (k === 'start') st.sample = false; save(); render(); }));

$('ics').addEventListener('click', () => giveFile('우리기념일.ics', 'text/calendar', makeICS()));

// 백업: 설정 + 사진(base64)을 JSON 한 파일로
const b64 = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
$('bk').addEventListener('click', async () => { toast('백업 파일 만드는 중…');
  try { const photos = {}; for (const p of st.photos) { const b = await getBlob(p.k); if (b) photos[p.k] = await b64(b); }
    await giveFile(`우리기념일-백업-${ymd(new Date())}.json`, 'application/json', JSON.stringify({v:1, st, photos}));
  } catch (e) { toast('백업에 실패했어요'); } });
$('rs').addEventListener('click', () => $('fRestore').click());
$('fRestore').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const j = JSON.parse(await f.text()); if (!j || !j.st) throw 0;
    for (const [k, d] of Object.entries(j.photos || {})) { const b = await (await fetch(d)).blob(); await putBlob(k, b); }
    st = Object.assign({}, DEF, j.st); save(); await loadUrls(); render(); toast('백업을 불러왔어요');
  } catch (err) { toast('백업 파일을 읽지 못했어요'); } });

// ---- 시작 ----
route(); render();
(async () => {
  try { idb = await openDB(); await loadUrls(); render(); } catch (e) { toast('사진 저장소를 열 수 없어요'); }
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
})();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
