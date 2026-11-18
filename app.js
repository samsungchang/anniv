// 우리 기념일 — 아이폰 홈 화면용 웹앱 (데이터는 이 기기 안에만 저장)
{
const K = 'anniv-v2', WD = '일월화수목금토';
const THEMES = [['rose','#ff4d7d','#fff','light-dark(#ffe9ef,#2a1219)'],['lilac','#8b6cff','#fff','light-dark(#efeaff,#1d1730)'],
 ['peach','#ff7a45','#fff','light-dark(#fff0e8,#2b170e)'],['ocean','#2f7dff','#fff','light-dark(#e8f0ff,#0f1a2e)'],
 ['mint','#12b886','#fff','light-dark(#e6f8f1,#0c2219)'],['mono','light-dark(#18161b,#f3f1f5)','light-dark(#fff,#111)','light-dark(#ecebee,#222026)']];
const THEME_META = {rose:'#ff4d7d',lilac:'#8b6cff',peach:'#ff7a45',ocean:'#2f7dff',mint:'#12b886',mono:'#18161b'};
const FONTS = [['modern','Noto Sans KR','모던'],['soft','Gowun Batang','감성'],['hand','Gaegu','손글씨'],['cute','Jua','귀염']];
const CATS = [['work','일·근무','#5b7cfa'],['meet','약속','#ff7a45'],['study','공부·시험','#e8a200'],['trip','여행','#12b886'],['off','쉬는 날','#9aa0a6'],['etc','기타','#c05cc8']];
const DAYS = [[1,14,'다이어리데이','새해 다이어리 선물',0],[2,14,'발렌타인데이','초콜릿 받는 날',0],[3,14,'화이트데이','내가 사탕·선물 챙기는 날',1],
 [4,14,'블랙데이','짜장면 데이트',0],[5,14,'로즈데이','장미 한 송이',1],[6,14,'키스데이','',0],[7,14,'실버데이','은반지·액세서리',0],
 [8,14,'그린데이','숲길 산책',0],[9,14,'포토데이','같이 사진 찍기',0],[10,14,'와인데이','와인 한 병',0],[11,11,'빼빼로데이','빼빼로 + 짧은 편지',1],
 [11,14,'무비데이','영화 데이트',0],[12,14,'허그데이','',0],[12,24,'크리스마스 이브','레스토랑은 미리 예약',1],[12,25,'크리스마스','선물 교환',1],[12,31,'연말','같이 카운트다운',0]];
const DEF = {start:'2025-06-07',me:'',her:'',hb:'',mb:'',msg:'',custom:[],photos:[],cover:'',pos:50,theme:'rose',font:'modern',layout:'full',sample:true,sch:[],wish:[]};

let st = Object.assign({}, DEF), filter = 'all', layer = 'all', cur = -1, vm = null, sel = null, editSch = null, editWish = null, sCat = 'work';
const urls = {};
try { const s = JSON.parse(localStorage.getItem(K)); if (s) st = Object.assign({}, DEF, s); } catch (e) {}
if (!Array.isArray(st.sch)) st.sch = []; if (!Array.isArray(st.wish)) st.wish = [];

const $ = id => document.getElementById(id);
const P = s => { const [a,b,c] = s.split('-').map(Number); return new Date(a, b-1, c); };
const T = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const diff = (a,b) => Math.round((b-a)/864e5);
const add = (d,n) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
const fmt = d => `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${WD[d.getDay()]}요일`;
const md = d => `${d.getMonth()+1}/${d.getDate()} (${WD[d.getDay()]})`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dtxt = n => n === 0 ? 'D-DAY' : 'D-' + n;
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const ymd = d => iso(d).replace(/-/g, '');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const herName = () => st.her || '여자친구';
const cat = k => CATS.find(c => c[0] === k) || CATS[5];
const won = v => { const n = Number(String(v).replace(/[^\d]/g, '')); return n ? n.toLocaleString() + '원' : ''; };
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
function save(){ try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) { toast('저장 공간이 부족해요'); } }

// ---- 기념일 계산 ----
function evRange(a, b){
  const S = P(st.start), ev = [], her = herName(), inR = d => d >= a && d <= b;
  const yrs = []; for (let y = a.getFullYear(); y <= b.getFullYear(); y++) yrs.push(y);
  const yearly = (m, d, o) => yrs.forEach(Y => { const x = new Date(Y, m-1, d); if (x.getMonth() === m-1 && inR(x)) ev.push(Object.assign({d:x, yr:1}, o)); });
  if (inR(S)) ev.push({d:S, n:'우리 처음 사귄 날', s:'1일', g:'us', m:0});
  for (let k = 100; k <= 20000; k += 100) { const d = add(S, k-1); if (d > b) break; if (inR(d)) ev.push({d, n:`${k}일`, s:k%1000===0?'큰 숫자, 특별하게':'우리 기념일', g:'us', m:1}); }
  for (let y = 1; y <= 60; y++) { const d = new Date(S.getFullYear()+y, S.getMonth(), S.getDate()); if (d > b) break; if (inR(d)) ev.push({d, n:`${y}주년`, s:'코스·선물 미리 준비', g:'us', m:1}); }
  if (st.hb) { const x = P(st.hb); yearly(x.getMonth()+1, x.getDate(), {n:`${her} 생일`, s:'제일 중요, 2주 전부터 준비', g:'us', m:1}); }
  if (st.mb) { const x = P(st.mb); yearly(x.getMonth()+1, x.getDate(), {n:`${st.me||'내'} 생일`, s:'', g:'us', m:0}); }
  DAYS.forEach(([m,d,n,s,k]) => yearly(m, d, {n, s, g:'day', m:k}));
  st.custom.forEach((c, ci) => { const x = P(c.d), o = {n:c.n, s:c.r?'매년 돌아오는 우리 날':'우리 날', g:'us', m:1, ci};
    if (c.r) yearly(x.getMonth()+1, x.getDate(), o); else if (inR(x)) ev.push(Object.assign({d:x}, o)); });
  return ev.sort((p, q) => p.d - q.d);
}
function events(range = 366){ const t = T(); return evRange(t, add(t, range)); }

// ---- 여자친구 일정 ----
// {id, n, cat, d, e, tm, rp:'w'|'' , m}  매주 반복이면 e = 반복 끝나는 날
function schOn(d){
  return st.sch.filter(x => { const s = P(x.d), e = x.e ? P(x.e) : null;
    if (x.rp === 'w') return d >= s && (!e || d <= e) && d.getDay() === s.getDay();
    return d >= s && d <= (e && e > s ? e : s);
  }).sort((a, b) => (a.tm || '').localeCompare(b.tm || ''));
}
const schRow = x => { const c = cat(x.cat), multi = x.e && x.rp !== 'w' && x.e > x.d;
  return `<button class="si" data-sid="${x.id}"><i class="cb" style="background:${c[2]}"></i><span class="tm">${x.tm || '종일'}</span><span><b>${esc(x.n)}</b><small>${esc(c[1])}${x.rp==='w'?' · 매주':''}${multi?` · ~${P(x.e).getMonth()+1}/${P(x.e).getDate()}`:''}${x.m?' · '+esc(x.m):''}</small></span></button>`; };

const row = (e,t) => { const n = diff(t, e.d); return `<li class="it${e.m?' m':''}"><div class="cal"><small>${e.d.getMonth()+1}월</small><b>${e.d.getDate()}</b></div><div><h4>${esc(e.n)}</h4><p>${WD[e.d.getDay()]}요일${e.s?' · '+esc(e.s):''}</p></div><span class="dd">${dtxt(n)}</span></li>`; };

function style(){
  const th = THEMES.find(x => x[0] === st.theme) || THEMES[0], f = FONTS.find(x => x[0] === st.font) || FONTS[0], r = document.documentElement.style;
  r.setProperty('--ac', th[1]); r.setProperty('--on', th[2]); r.setProperty('--tint', th[3]); r.setProperty('--kr', `"${f[1]}"`);
  document.body.classList.toggle('polar', st.layout === 'polar');
  document.querySelector('meta[name=theme-color]').setAttribute('content', THEME_META[st.theme] || '#ff4d7d');
}

// ---- 달력 ----
function renderCal(){
  const t = T(), her = herName(); if (!sel) sel = t; if (!vm) vm = new Date(sel.getFullYear(), sel.getMonth(), 1);
  $('calT').textContent = `${vm.getFullYear()}. ${vm.getMonth()+1}`;
  $('layerSch').textContent = `${her} 일정`;
  const g0 = add(vm, -vm.getDay()), last = new Date(vm.getFullYear(), vm.getMonth()+1, 0), weeks = Math.ceil((vm.getDay() + last.getDate())/7), g1 = add(g0, weeks*7 - 1);
  const by = {}; evRange(g0, g1).forEach(e => (by[iso(e.d)] ||= []).push(e));
  let h = '';
  for (let i = 0; i < weeks*7; i++) { const d = add(g0, i), k = iso(d), es = layer === 'sch' ? [] : (by[k] || []), ss = layer === 'ann' ? [] : schOn(d);
    const c = ['dc', d.getMonth()!==vm.getMonth()?'o':'', d.getDay()===0?'sun':d.getDay()===6?'sat':'', +d===+t?'td':'', +d===+sel?'sel':''].join(' ');
    const lb = ss.slice(0, 2).map(x => `<span class="lb" style="background:${cat(x.cat)[2]}">${esc(x.n)}</span>`).join('') + (ss.length > 2 ? `<span class="lbm">+${ss.length-2}</span>` : '');
    h += `<button class="${c}" data-d="${k}" aria-label="${d.getMonth()+1}월 ${d.getDate()}일${[...es,...ss].length?' '+[...es,...ss].map(e=>e.n).join(', '):''}"><span class="n">${d.getDate()}</span><span class="dots">${es.slice(0,3).map(e=>`<i class="${e.m?'m':''}"></i>`).join('')}</span><span class="lbls">${lb}</span></button>`; }
  $('calD').innerHTML = h;
  // 선택한 날
  const S = P(st.start), dn = diff(S, sel) + 1, es = evRange(sel, sel), ss = schOn(sel), dd = diff(t, sel);
  const rel = dd === 0 ? '오늘' : dd > 0 ? `${dd}일 뒤` : `${-dd}일 전`;
  $('selc').innerHTML = `<h4>${sel.getMonth()+1}월 ${sel.getDate()}일 ${WD[sel.getDay()]}요일</h4><p class="sub">${rel}${dn>0?` · 사귄 지 ${dn.toLocaleString()}일째`:''}</p>`
    + `<p class="sl">${esc(her)} 일정</p>` + (ss.length ? ss.map(schRow).join('') : '<p class="empty2">일정 없음</p>')
    + `<p class="sl" style="margin-top:14px">기념일</p>` + (es.length ? es.map(e => `<div class="se${e.m?' m':''}"><i></i><span>${esc(e.n)}${e.s?`<small>${esc(e.s)}</small>`:''}</span>${e.ci!=null?`<button data-cdel="${e.ci}">삭제</button>`:''}</div>`).join('') : '<p class="empty2">없음</p>')
    + `<div class="btns"><button class="btn sm" id="selSch">+ ${esc(her)} 일정</button><button class="btn sm gh" id="selAdd">+ 기념일</button></div>`;
  // 다가오는 일정 (2주)
  $('upSchT').textContent = `다가오는 ${her} 일정`;
  let u = '';
  for (let i = 0; i < 14; i++) { const d = add(t, i), xs = schOn(d); if (xs.length) u += `<p class="dh">${i===0?'오늘':i===1?'내일':md(d)}</p>` + xs.map(schRow).join(''); }
  $('upSch').innerHTML = u || `<p class="empty2" style="margin:0">2주 안에 등록된 일정이 없어요. 날짜를 누르고 "+ ${esc(her)} 일정"으로 넣어보세요.</p>`;
}
const moveMonth = n => { vm = new Date(vm.getFullYear(), vm.getMonth()+n, 1); renderCal(); };

// ---- 위시 ----
function renderWish(){
  const t = T(), nx = events().find(e => e.m), act = st.wish.filter(w => !w.done), done = st.wish.filter(w => w.done);
  const item = w => `<li class="wi${w.done?' done':''}"><button class="wck" data-wck="${w.id}" aria-label="${w.done?'선물 안 함으로':'선물함으로'} 표시">${w.done?'<svg class="ic" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="m5 12 5 5 9-10"/></svg>':''}</button><button class="wtx" data-wid="${w.id}"><b>${esc(w.n)}</b><small>${[w.m, won(w.p)].filter(Boolean).map(esc).join(' · ') || '메모 없음'}</small></button>${w.l?`<a class="wl" href="${esc(/^https?:\/\//.test(w.l)?w.l:'https://'+w.l)}" target="_blank" rel="noopener">링크</a>`:''}</li>`;
  $('whint').innerHTML = nx ? `다음 꼭 챙길 날은 <b>${esc(nx.n)} ${dtxt(diff(t, nx.d))}</b>예요. ${act.length ? '아래 목록에서 골라보세요.' : `${esc(herName())}가 갖고 싶다고 한 걸 들을 때마다 + 로 적어두세요.`}` : '';
  $('wlist').innerHTML = act.length ? act.map(item).join('') : '<li class="empty">아직 적어둔 게 없어요</li>';
  $('wdone').innerHTML = done.length ? done.map(item).join('') : '<li class="empty">선물하면 왼쪽 동그라미를 눌러 여기로 옮겨요</li>';
  $('wcount').textContent = act.length ? `${act.length}개` : '';
}

function render(){
  style();
  const t = T(), S = P(st.start), dn = diff(S, t) + 1, me = st.me || '나', her = herName();
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
  // 오늘·내일 일정
  const td = schOn(t), tm = schOn(add(t, 1));
  $('today').innerHTML = `<p class="lab">${esc(her)}의 오늘</p>` + (td.length ? td.map(schRow).join('') : `<p class="empty2">오늘은 등록된 일정이 없어요</p>`)
    + `<p class="dh">내일</p>` + (tm.length ? tm.map(schRow).join('') : `<p class="empty2">내일도 비어 있어요</p>`);
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
  $('icsSchL').textContent = `${her} 일정도 같이 넣기`;
  $('mine').innerHTML = st.custom.length ? `<h3 style="margin:22px 0 6px;font-size:16px">추가한 날</h3>` + st.custom.map((c,i) => `<div class="tog"><span>${esc(c.n)} <small style="color:var(--mut)">${esc(c.d)}${c.r?' · 매년':''}</small></span><button class="btn rd sm" data-del="${i}">삭제</button></div>`).join('') : '';
  renderCal(); renderWish();
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  $('store').textContent = standalone ? '모든 내용은 이 아이폰 안에 저장돼요.' : 'Safari 공유 버튼 → "홈 화면에 추가"를 하면 앱처럼 쓸 수 있어요.';
}

function route(){
  const v = (location.hash || '#home').slice(1), ok = ['home','days','album','wish','deco'].includes(v) ? v : 'home';
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
  const b = await shrink(file), k = 'p' + uid();
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

function makeICS(withSch){
  const now = new Date(), stamp = now.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z', t = T();
  const L = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//uri-anniv//KO','CALSCALE:GREGORIAN','X-WR-CALNAME:우리 기념일'];
  const clean = s => String(s).replace(/[\\;,]/g, ' ').replace(/\n/g, ' ');
  const alarm = (tr, txt) => ['BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${clean(txt)}`,`TRIGGER:${tr}`,'END:VALARM'];
  const seen = new Set();
  events(1100).filter(e => e.m).forEach(e => {
    if (e.yr) { if (seen.has(e.n)) return; seen.add(e.n); }
    const name = clean(e.n);
    L.push('BEGIN:VEVENT', `UID:a-${ymd(e.d)}-${encodeURIComponent(e.n)}@uri-anniv`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.d)}`, `DTEND;VALUE=DATE:${ymd(add(e.d,1))}`, `SUMMARY:♥ ${name}`);
    if (e.yr) L.push('RRULE:FREQ=YEARLY');
    L.push(...alarm('-P6DT15H', `${name} 일주일 전`), ...alarm('-PT15H', `내일은 ${name}`), 'END:VEVENT');
  });
  if (withSch) st.sch.forEach(x => {
    const s = P(x.d), e = x.e ? P(x.e) : null;
    if (x.rp !== 'w' && (e && e > s ? e : s) < t) return; // 지난 일정 제외
    if (x.rp === 'w' && e && e < t) return;
    const who = clean(herName()), name = clean(x.n);
    L.push('BEGIN:VEVENT', `UID:s-${x.id}@uri-anniv`, `DTSTAMP:${stamp}`, `SUMMARY:${who} · ${name}`);
    if (x.tm) { const [hh, mm] = x.tm.split(':'), st0 = `${ymd(s)}T${hh}${mm}00`, en = new Date(s.getFullYear(), s.getMonth(), s.getDate(), +hh + 1, +mm);
      L.push(`DTSTART:${st0}`, `DTEND:${ymd(en)}T${String(en.getHours()).padStart(2,'0')}${String(en.getMinutes()).padStart(2,'0')}00`); }
    else L.push(`DTSTART;VALUE=DATE:${ymd(s)}`, `DTEND;VALUE=DATE:${ymd(add(x.rp !== 'w' && e && e > s ? e : s, 1))}`);
    if (x.rp === 'w') L.push(`RRULE:FREQ=WEEKLY${e ? `;UNTIL=${ymd(e)}T235959` : ''}`);
    if (x.m) L.push(`DESCRIPTION:${clean(x.m)}`);
    if (x.tm) L.push(...alarm('-PT1H', `${who} ${name} 1시간 전`));
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}

// ---- 이벤트 연결 ----
addEventListener('hashchange', route);
$('annF').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; filter = b.dataset.f; $('annF').querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); render(); });
$('layer').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; layer = b.dataset.l; $('layer').querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); renderCal(); });
const open = id => { $(id).hidden = false; }, close = () => document.querySelectorAll('.sheet').forEach(s => s.hidden = true);
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

// 기념일 추가
const openAdd = d => { $('dD').value = iso(d); $('dTitle').textContent = `${d.getMonth()+1}월 ${d.getDate()}일에 기념일 추가`; open('shDay'); };
$('fDay').addEventListener('submit', e => { e.preventDefault(); const n = $('dN').value.trim(), d = $('dD').value; if (!n || !d) return;
  st.custom.push({n, d, r:$('dR').checked}); $('dN').value = ''; sel = P(d); vm = new Date(sel.getFullYear(), sel.getMonth(), 1); save(); render(); close(); toast('추가했어요'); });
$('mine').addEventListener('click', e => { const i = e.target.dataset.del; if (i == null) return; st.custom.splice(+i, 1); save(); render(); });

// 일정 추가·수정
function renderCats(){ $('sCat').innerHTML = CATS.map(c => `<button type="button" class="cat" data-c="${c[0]}" aria-pressed="${c[0]===sCat}"><i style="background:${c[2]}"></i>${c[1]}</button>`).join(''); }
function syncRepeat(){ $('sEL').textContent = $('sR').checked ? '반복 끝나는 날 (비우면 계속)' : '끝나는 날 (여러 날 일정일 때)'; }
function openSch(d, x){
  editSch = x ? x.id : null; sCat = x ? x.cat : 'work';
  $('sTitle').textContent = x ? '일정 수정' : `${d.getMonth()+1}월 ${d.getDate()}일 ${herName()} 일정`;
  $('sN').value = x ? x.n : ''; $('sD').value = x ? x.d : iso(d); $('sE').value = x ? (x.e || '') : ''; $('sT').value = x ? (x.tm || '') : '';
  $('sR').checked = x ? x.rp === 'w' : false; $('sM').value = x ? (x.m || '') : ''; $('sDel').hidden = !x; $('sDel').dataset.c = ''; $('sDel').textContent = '이 일정 삭제';
  renderCats(); syncRepeat(); open('shSch');
}
$('sCat').addEventListener('click', e => { const b = e.target.closest('.cat'); if (!b) return; sCat = b.dataset.c; renderCats(); });
$('sR').addEventListener('change', syncRepeat);
$('fSch').addEventListener('submit', e => { e.preventDefault();
  const n = $('sN').value.trim(), d = $('sD').value; if (!n || !d) return;
  let en = $('sE').value; if (en && en < d) { toast('끝나는 날이 시작보다 빨라요'); return; }
  const x = {id: editSch || uid(), n, cat: sCat, d, e: en, tm: $('sT').value, rp: $('sR').checked ? 'w' : '', m: $('sM').value.trim()};
  const i = st.sch.findIndex(s => s.id === x.id); if (i >= 0) st.sch[i] = x; else st.sch.push(x);
  sel = P(d); vm = new Date(sel.getFullYear(), sel.getMonth(), 1); save(); render(); close(); toast(i >= 0 ? '수정했어요' : '일정을 넣었어요'); });
$('sDel').addEventListener('click', () => { if ($('sDel').dataset.c !== '1') { $('sDel').dataset.c = '1'; $('sDel').textContent = '한 번 더 누르면 삭제돼요'; return; }
  st.sch = st.sch.filter(s => s.id !== editSch); save(); render(); close(); toast('삭제했어요'); });
const schClick = e => { const b = e.target.closest('[data-sid]'); if (!b) return false; const x = st.sch.find(s => s.id === b.dataset.sid); if (x) openSch(P(x.d), x); return true; };
$('upSch').addEventListener('click', schClick); $('today').addEventListener('click', schClick);
$('fabDay').addEventListener('click', () => openSch(sel || T()));

// 달력 조작
$('calP').addEventListener('click', () => moveMonth(-1));
$('calN').addEventListener('click', () => moveMonth(1));
$('calTd').addEventListener('click', () => { sel = T(); vm = new Date(sel.getFullYear(), sel.getMonth(), 1); renderCal(); });
$('calD').addEventListener('click', e => { const b = e.target.closest('.dc'); if (!b) return; sel = P(b.dataset.d);
  if (sel.getMonth() !== vm.getMonth() || sel.getFullYear() !== vm.getFullYear()) vm = new Date(sel.getFullYear(), sel.getMonth(), 1); renderCal(); });
let sx = null;
$('calD').addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, {passive:true});
$('calD').addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) moveMonth(dx < 0 ? 1 : -1); });
$('selc').addEventListener('click', e => {
  if (schClick(e)) return;
  if (e.target.id === 'selAdd') { openAdd(sel); return; }
  if (e.target.id === 'selSch') { openSch(sel); return; }
  const i = e.target.dataset.cdel; if (i == null) return;
  if (e.target.dataset.c !== '1') { e.target.dataset.c = '1'; e.target.textContent = '정말 삭제'; return; }
  st.custom.splice(+i, 1); save(); render(); toast('삭제했어요'); });

// 위시
function openWish(w){ editWish = w ? w.id : null; $('wTitle').textContent = w ? '위시 수정' : `${herName()}가 갖고 싶다고 한 것`;
  $('wN').value = w ? w.n : ''; $('wM').value = w ? (w.m || '') : ''; $('wP').value = w ? (w.p || '') : ''; $('wL').value = w ? (w.l || '') : '';
  $('wDel').hidden = !w; $('wDel').dataset.c = ''; $('wDel').textContent = '삭제'; open('shWish'); }
$('fabWish').addEventListener('click', () => openWish());
$('fWish').addEventListener('submit', e => { e.preventDefault(); const n = $('wN').value.trim(); if (!n) return;
  const old = st.wish.find(w => w.id === editWish), w = {id: editWish || uid(), n, m: $('wM').value.trim(), p: $('wP').value.trim(), l: $('wL').value.trim(), done: old ? old.done : false, t: old ? old.t : Date.now()};
  if (old) Object.assign(old, w); else st.wish.unshift(w); save(); render(); close(); toast(old ? '수정했어요' : '적어뒀어요'); });
$('wDel').addEventListener('click', () => { if ($('wDel').dataset.c !== '1') { $('wDel').dataset.c = '1'; $('wDel').textContent = '한 번 더 누르면 삭제돼요'; return; }
  st.wish = st.wish.filter(w => w.id !== editWish); save(); render(); close(); toast('삭제했어요'); });
const wishClick = e => { const c = e.target.closest('[data-wck]'), t = e.target.closest('[data-wid]');
  if (c) { const w = st.wish.find(x => x.id === c.dataset.wck); if (w) { w.done = !w.done; save(); render(); toast(w.done ? '선물한 것으로 옮겼어요' : '다시 위시로 옮겼어요'); } }
  else if (t) { const w = st.wish.find(x => x.id === t.dataset.wid); if (w) openWish(w); } };
$('wlist').addEventListener('click', wishClick); $('wdone').addEventListener('click', wishClick);

// 앨범
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

// 꾸미기
$('pos').addEventListener('input', e => { st.pos = +e.target.value; $('cov').style.objectPosition = $('covThumb').style.objectPosition = `50% ${st.pos}%`; });
$('pos').addEventListener('change', save);
$('sw').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.theme = b.dataset.t; save(); render(); });
$('fonts').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.font = b.dataset.f; save(); render(); });
$('lay').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.layout = b.dataset.v; save(); render(); });
[['iMe','me'],['iHer','her'],['iMsg','msg'],['iStart','start'],['iHb','hb'],['iMb','mb']].forEach(([i,k]) => $(i).addEventListener('input', e => {
  const v = e.target.value.trim(); if (k === 'start' && !v) return; st[k] = v; if (k === 'start') st.sample = false; save(); render(); }));

$('ics').addEventListener('click', () => giveFile('우리기념일.ics', 'text/calendar', makeICS($('icsSch').checked)));

// 백업: 설정·일정·위시 + 사진(base64)을 JSON 한 파일로
const b64 = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
$('bk').addEventListener('click', async () => { toast('백업 파일 만드는 중…');
  try { const photos = {}; for (const p of st.photos) { const b = await getBlob(p.k); if (b) photos[p.k] = await b64(b); }
    await giveFile(`우리기념일-백업-${ymd(new Date())}.json`, 'application/json', JSON.stringify({v:2, st, photos}));
  } catch (e) { toast('백업에 실패했어요'); } });
$('rs').addEventListener('click', () => $('fRestore').click());
$('fRestore').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const j = JSON.parse(await f.text()); if (!j || !j.st) throw 0;
    for (const [k, d] of Object.entries(j.photos || {})) { const b = await (await fetch(d)).blob(); await putBlob(k, b); }
    st = Object.assign({}, DEF, j.st); if (!Array.isArray(st.sch)) st.sch = []; if (!Array.isArray(st.wish)) st.wish = [];
    save(); await loadUrls(); render(); toast('백업을 불러왔어요');
  } catch (err) { toast('백업 파일을 읽지 못했어요'); } });

// ---- 시작 ----
route(); render();
(async () => {
  try { idb = await openDB(); await loadUrls(); render(); } catch (e) { toast('사진 저장소를 열 수 없어요'); }
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
})();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
