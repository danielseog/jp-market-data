'use strict';
(() => {
const STORE_KEY = 'kn.v1';
const DAY = 86400000, ROLL_H = 4;            // study day rolls over at 04:00
const DECKS = [
  ['te', 'て形・順序', 'て / てから / ながら / ずに'],
  ['aspect', 'アスペクト', 'ておく / てしまう / ている / たところ'],
  ['cond', '条件・逆接', 'ば / たら / なら / と / ても'],
  ['giverecv', '授受', 'てもらう / ていただく / てくださる'],
  ['voice', '受身・使役', 'られる / させる / させられる'],
  ['keigo', 'ビジネス敬語', '尊敬語 / 謙譲語 / ウチ・ソト'],
  ['modal', '依頼・許可・義務', 'ていただけますか / なければ'],
  ['intent', '予定・推量', 'つもり / ことになる / はず / そう'],
  ['connect', '会議の論理', 'ので / ものの / わけ / 一方で'],
  ['wago', '和語動詞', '詰める / 押さえる / 見送る …'],
  ['life', '生活', '保育園 / 病院 / 区役所 / 管理会社'],
  ['numbers', '数字の読み', '億 / % / 戸 / 日付'],
];
const DECKNAME = Object.fromEntries(DECKS.map(d => [d[0], d[1]]));
const RUBY = /\{([^{}|]+)\|([^{}|]+)\}/g;
const app = document.getElementById('app');

let ITEMS = [], BYID = {};
let S = load();
let SES = null, VIEW = 'home';

/* ---------------- storage ---------------- */
function defaults() {
  return { v: 1, cards: { speak: {}, read: {} }, days: {}, settings: {
    mode: 'speak', newPerDay: 20, decks: DECKS.map(d => d[0]), levels: [1, 2, 3],
    autoplay: true, rate: 0.9, showHint: true, voice: '', installDismissed: false } };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.v === 1) {
      const d = defaults();
      s.settings = Object.assign(d.settings, s.settings || {});
      s.cards = Object.assign(d.cards, s.cards || {});
      s.days = s.days || {};
      return s;
    }
  } catch (e) {}
  return defaults();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { toast('保存できませんでした（容量不足？）'); }
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* ---------------- time ---------------- */
function dayStart(t = Date.now()) {
  const d = new Date(t - ROLL_H * 3600000); d.setHours(0, 0, 0, 0);
  return d.getTime() + ROLL_H * 3600000;
}
function dayKey(t = Date.now()) {
  const d = new Date(t - ROLL_H * 3600000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function today() { return S.days[dayKey()] || (S.days[dayKey()] = { n: 0, speak: 0, read: 0 }); }
function streak() {
  let n = 0, t = Date.now();
  if (!(S.days[dayKey(t)] && S.days[dayKey(t)].n)) t -= DAY;   // today not started yet: count from yesterday
  while (S.days[dayKey(t)] && S.days[dayKey(t)].n > 0) { n++; t -= DAY; }
  return n;
}

/* ---------------- cards & scheduling ---------------- */
const mode = () => S.settings.mode;
function cs(id, m = mode()) { return S.cards[m][id]; }
function setCs(id, c, m = mode()) { S.cards[m][id] = c; }
function inFilter(it) { return S.settings.decks.includes(it.deck) && S.settings.levels.includes(it.level); }

// SM-2 style with learning step handled inside the session.
function sched(prev, g, now = Date.now(), fuzz = true) {
  const c = prev ? { ...prev } : { ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: now, learn: true, prevIvl: 0 };
  if (g === 1) {
    if (!c.learn) { c.lapses++; c.ease = Math.max(1.3, c.ease - 0.2); c.prevIvl = c.ivl; }
    c.learn = true; c.ivl = 0; c.due = now; c.miss = (c.miss || 0) + 1; c.missAt = now; c.fix = 0;
  } else {
    let ivl;
    if (c.learn) {
      if (g === 2) { ivl = 1; c.ease = Math.max(1.3, c.ease - 0.15); }
      else if (g === 3) ivl = c.prevIvl ? Math.max(1, c.prevIvl * 0.5) : 1;
      else { ivl = c.prevIvl ? Math.max(2, c.prevIvl * 0.7) : 4; c.ease += 0.1; }
      c.learn = false; c.prevIvl = 0;
    } else {
      const late = Math.max(0, (now - c.due) / DAY);
      if (g === 2) { ivl = Math.max(c.ivl + 1, c.ivl * 1.2); c.ease = Math.max(1.3, c.ease - 0.15); }
      else if (g === 3) ivl = Math.max(c.ivl + 1, (c.ivl + late / 2) * c.ease);
      else { ivl = Math.max(c.ivl + 2, (c.ivl + late) * c.ease * 1.3); c.ease += 0.15; }
    }
    if (fuzz && ivl >= 4) ivl *= 0.95 + Math.random() * 0.1;
    c.ivl = Math.min(3650, Math.max(1, Math.round(ivl)));
    c.due = dayStart(now) + c.ivl * DAY;
  }
  c.reps++; c.last = g; c.at = now;
  return c;
}
function ivlLabel(prev, g) {
  if (g === 1) return 'すぐ';
  const d = sched(prev, g, Date.now(), false).ivl;
  if (d < 31) return d + '日';
  if (d < 365) return (d / 30).toFixed(d < 60 ? 1 : 0) + 'ヶ月';
  return (d / 365).toFixed(1) + '年';
}

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function counts() {
  const now = Date.now(); let due = 0, unseen = 0, fix = 0;
  for (const it of ITEMS) {
    const c = cs(it.id);
    if (c && c.missAt) fix++;
    if (!inFilter(it)) continue;
    if (!c) unseen++; else if (c.due <= now) due++;
  }
  const newLeft = Math.max(0, S.settings.newPerDay - (today()[mode()] || 0));
  return { due, fresh: Math.min(newLeft, unseen), unseen, fix };
}
function studyQueue() {
  const now = Date.now(), due = [], byDeck = {};
  for (const it of ITEMS) {
    if (!inFilter(it)) continue;
    const c = cs(it.id);
    if (!c) (byDeck[it.deck] ||= []).push(it);
    else if (c.due <= now) due.push(it);
  }
  // overdue-first, lightly shuffled
  due.sort((a, b) => cs(a.id).due - cs(b.id).due);
  const dq = shuffle(due.slice(0, 40)).concat(shuffle(due.slice(40)));
  // new cards: round-robin across decks, each deck in authored order (easier first)
  const order = shuffle(Object.keys(byDeck)), fresh = [];
  const newLeft = Math.max(0, S.settings.newPerDay - (today()[mode()] || 0));
  for (let r = 0; fresh.length < newLeft; r++) {
    let any = false;
    for (const k of order) if (byDeck[k][r]) { any = true; if (fresh.length < newLeft) fresh.push(byDeck[k][r]); }
    if (!any) break;
  }
  const q = []; let i = 0, j = 0;
  while (i < dq.length || j < fresh.length) {
    for (let k = 0; k < 3 && i < dq.length; k++) q.push(dq[i++]);
    if (j < fresh.length) q.push(fresh[j++]);
  }
  return q;
}
function fixQueue() {
  return shuffle(ITEMS.filter(it => { const c = cs(it.id); return c && c.missAt; })
    .sort((a, b) => cs(b.id).missAt - cs(a.id).missAt).slice(0, 40));
}

/* ---------------- text helpers ---------------- */
function esc(s) { return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
const rubyHtml = s => esc(s).replace(RUBY, (m, a, b) => `<ruby>${a}<rt>${b}</rt></ruby>`);
const plain = s => s.replace(RUBY, '$1');
function noteHtml(it) {
  const p = String(it.pattern).replace(/^[～〜]/, ''), head = String(it.note).slice(0, 30);
  return `<div class="note">${head.includes(p) ? '' : `<b>${esc(it.pattern)}</b> — `}${esc(it.note)}</div>`;
}
const ttsText = s => s.replace(RUBY, (m, a, b) => /[0-9A-Za-z０-９]/.test(a) ? b : a);

/* ---------------- speech ---------------- */
let VOICES = [];
function loadVoices() { try { VOICES = speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang)); } catch (e) {} }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice() {
  if (S.settings.voice) { const v = VOICES.find(v => v.name === S.settings.voice); if (v) return v; }
  const rank = v => (/premium/i.test(v.name + v.voiceURI) ? 4 : 0) + (/enhanced/i.test(v.name + v.voiceURI) ? 2 : 0) + (/Kyoko|O-ren/i.test(v.name) ? 1 : 0);
  return VOICES.slice().sort((a, b) => rank(b) - rank(a))[0];
}
function speak(text, rate) {
  if (!('speechSynthesis' in window)) return toast('この端末は読み上げ非対応です');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP'; u.rate = rate || S.settings.rate;
  const v = pickVoice(); if (v) u.voice = v;
  speechSynthesis.speak(u);
}

/* ---------------- UI helpers ---------------- */
let toastT;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2200);
}
function go(v) { VIEW = v; render(); window.scrollTo(0, 0); }
const isStandalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function render() {
  if (VIEW === 'session' && SES) return renderSession();
  if (VIEW === 'done') return renderDone();
  if (VIEW === 'settings') return renderSettings();
  return renderHome();
}

/* ---------------- home ---------------- */
function renderHome() {
  const c = counts(), m = mode(), st = streak(), td = today();
  const seenBy = {}, totBy = {};
  for (const it of ITEMS) { totBy[it.deck] = (totBy[it.deck] || 0) + 1; if (cs(it.id)) seenBy[it.deck] = (seenBy[it.deck] || 0) + 1; }
  const showInstall = isIOS() && !isStandalone() && !S.settings.installDismissed;
  app.innerHTML = `
  <div class="home">
    <div class="top">
      <div class="brand">口慣らし<small>${ITEMS.length.toLocaleString()} 文 ・ 連続 ${st} 日 ・ 今日 ${td.n} 回</small></div>
      <button class="iconbtn" data-a="settings" aria-label="設定">⚙︎</button>
    </div>
    ${showInstall ? `<div class="install"><b>ホーム画面に追加してください。</b> Safari の共有ボタン（□↑）→「ホーム画面に追加」。アプリとして全画面で開き、進捗もそちらに保存されます（Safari のタブとは保存先が別です）。 <button data-a="dismiss" style="color:var(--indigo);font-size:13px">閉じる</button></div>` : ''}
    <div class="seg">
      <button data-a="mode" data-v="speak" class="${m === 'speak' ? 'on' : ''}">話す<small>英語 → 日本語で言う</small></button>
      <button data-a="mode" data-v="read" class="${m === 'read' ? 'on' : ''}">読む<small>漢字の文を音読</small></button>
    </div>
    <div class="hero">
      <div class="nums">
        <div class="num"><b>${c.due}</b><span>復習</span></div>
        <div class="num"><b>${c.fresh}</b><span>新しい文</span></div>
      </div>
      <button class="go" data-a="start" ${c.due + c.fresh ? '' : 'disabled'}>${c.due + c.fresh ? '始める' : '今日の分は完了'}</button>
    </div>
    <div class="row2">
      <button class="tile fix" data-a="fix"><b>${c.fix}</b><span>間違えた文を潰す</span></button>
      <button class="tile" data-a="more"><b>+10</b><span>新しい文を追加</span></button>
    </div>
    <div class="sec"><h3>レベル</h3></div>
    <div class="levels">${[1, 2, 3].map(l => `<button class="chip ${S.settings.levels.includes(l) ? 'on' : ''}" data-a="lvl" data-v="${l}">${['', '基本', '中級', '上級'][l]}</button>`).join('')}</div>
    <div class="sec"><h3>デッキ</h3><button data-a="all">${S.settings.decks.length === DECKS.length ? '全部外す' : '全部選ぶ'}</button></div>
    <div class="decks">${DECKS.map(([k, ja, sub]) => {
      const on = S.settings.decks.includes(k), tot = totBy[k] || 0, seen = seenBy[k] || 0;
      return `<button class="deck ${on ? 'on' : ''}" data-a="deck" data-v="${k}">
        <span class="chk">${on ? '✓' : ''}</span>
        <span class="nm"><b>${ja}</b><small>${esc(sub)}</small><div class="bar"><i style="width:${tot ? (seen / tot * 100) : 0}%"></i></div></span>
        <span class="ct">${seen}/${tot}</span></button>`; }).join('')}</div>
    <div class="foot">進捗はこの端末に保存されます ・ 設定からバックアップ可</div>
  </div>`;
}

/* ---------------- session ---------------- */
function startSession(kind) {
  const q = kind === 'fix' ? fixQueue() : studyQueue();
  if (!q.length) return toast(kind === 'fix' ? '間違えた文はありません' : '今日の分は終わりました');
  SES = { kind, q, done: 0, again: 0, t0: Date.now(), cur: null, shown: false, hint: S.settings.showHint };
  VIEW = 'session'; next();
}
function next() {
  if (!SES.q.length) { VIEW = 'done'; return render(); }
  SES.cur = SES.q.shift(); SES.shown = false; SES.hint = S.settings.showHint;
  render();
  const st = document.querySelector('.stage'); if (st) st.scrollTop = 0;
}
function reveal() {
  if (!SES || SES.shown) return;
  SES.shown = true; render();
  if (S.settings.autoplay) speak(ttsText(SES.cur.ja));
}
function reinsert(it, k) { SES.q.splice(Math.min(k, SES.q.length), 0, it); }
function grade(g) {
  const it = SES.cur, prev = cs(it.id), td = today();
  if (SES.kind === 'fix') {
    const c = { ...prev };
    if (g >= 3) { c.fix = (c.fix || 0) + 1; if (c.fix >= 2) { c.missAt = 0; toast('克服！'); } else reinsert(it, 5); }
    else { c.fix = 0; c.missAt = Date.now(); c.miss = (c.miss || 0) + 1; reinsert(it, 3); SES.again++; }
    setCs(it.id, c);
  } else {
    if (!prev) td[mode()] = (td[mode()] || 0) + 1;
    setCs(it.id, sched(prev, g));
    if (g === 1) { reinsert(it, 4); SES.again++; }
  }
  td.n++; SES.done++; save();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  next();
}
function renderSession() {
  const it = SES.cur, m = mode(), prev = cs(it.id);
  const total = SES.done + SES.q.length + 1, pct = SES.done / total * 100;
  const front = m === 'speak'
    ? `<div class="en">${esc(it.en)}</div>
       ${SES.hint ? `<div class="hint">${esc(it.hint)}</div>` : (SES.shown ? '' : `<button class="hintbtn" data-a="hint">ヒントを見る</button>`)}`
    : (SES.shown ? '' : `<div class="jabig">${esc(plain(it.ja))}</div>`);
  const back = !SES.shown ? '' : (m === 'speak'
    ? `<div class="ans"><div class="ja" data-a="play">${rubyHtml(it.ja)}</div>
         ${noteHtml(it)}</div>`
    : `<div class="ans" style="margin-top:0;border-top:0;padding-top:0"><div class="ja" data-a="play">${rubyHtml(it.ja)}</div>
         <div class="en2">${esc(it.en)}</div>
         ${noteHtml(it)}</div>`);
  const isFix = SES.kind === 'fix';
  const grades = isFix
    ? `<div class="grades two"><button class="g1" data-a="g" data-v="1">まだ<small>もう一度</small></button>
       <button class="g3" data-a="g" data-v="3">言えた<small>${(prev && prev.fix) ? 'これで克服' : '2回連続で克服'}</small></button></div>`
    : `<div class="grades">${[[1, 'もう一度'], [2, '難しい'], [3, 'できた'], [4, '簡単']].map(([g, l]) =>
        `<button class="g${g}" data-a="g" data-v="${g}">${l}<small>${ivlLabel(prev, g)}</small></button>`).join('')}</div>`;
  app.innerHTML = `
  <div class="ses">
    <div class="sbar"><button class="x" data-a="quit" aria-label="終了">✕</button>
      <div class="prog"><i style="width:${pct}%"></i></div><div class="cnt">${SES.done}/${total}</div></div>
    <div class="stage" data-a="tap">
      <div class="meta"><span>${DECKNAME[it.deck] || it.deck}</span><span>${['', '基本', '中級', '上級'][it.level]}</span><span>${it.ctx === 'work' ? '仕事' : '生活'}</span>${!prev ? '<span>新</span>' : ''}${isFix ? '<span class="fixtag">間違い</span>' : ''}</div>
      ${front}${back}<div class="tapzone"></div>
    </div>
    <div class="dock">
      ${SES.shown
        ? `<div class="audio"><button data-a="play">▶︎ 再生</button><button data-a="slow">▶︎ ゆっくり</button></div>${grades}`
        : `<button class="reveal" data-a="reveal">${m === 'speak' ? '言ってから → 答え' : '読んでから → 答え'}</button>`}
    </div>
  </div>`;
}

/* ---------------- done ---------------- */
function renderDone() {
  const mins = Math.max(1, Math.round((Date.now() - SES.t0) / 60000));
  const c = counts();
  app.innerHTML = `
  <div class="panel">
    <h2>お疲れさまでした</h2>
    <div class="stats"><div><b>${SES.done}</b><span>回答</span></div><div><b>${SES.again}</b><span>間違い</span></div><div><b>${mins}</b><span>分</span></div></div>
    ${c.fix ? `<button class="btn pri" data-a="fix">間違えた文を潰す（${c.fix}）</button>` : ''}
    ${c.due + c.fresh ? `<button class="btn" data-a="start">続ける（残り ${c.due + c.fresh}）</button>` : ''}
    <button class="btn" data-a="more">新しい文を +10</button>
    <button class="btn" data-a="home">ホームへ</button>
  </div>`;
}

/* ---------------- settings ---------------- */
function renderSettings() {
  const s = S.settings;
  const vopts = ['<option value="">自動（一番良い声）</option>'].concat(VOICES.map(v => `<option ${v.name === s.voice ? 'selected' : ''} value="${esc(v.name)}">${esc(v.name)}</option>`)).join('');
  app.innerHTML = `
  <div class="panel">
    <div class="top"><h2 style="margin:0">設定</h2><button class="iconbtn" data-a="home" aria-label="戻る">✕</button></div>
    <div class="set">
      <div class="it"><div>1日の新しい文<small>モードごと</small></div><div class="step"><button data-a="np" data-v="-5">−</button><span>${s.newPerDay}</span><button data-a="np" data-v="5">＋</button></div></div>
      <div class="it"><div>ヒントを最初から表示<small>動詞と文型</small></div><button class="tog ${s.showHint ? 'on' : ''}" data-a="tg" data-v="showHint"></button></div>
      <div class="it"><div>答えを自動で読み上げ</div><button class="tog ${s.autoplay ? 'on' : ''}" data-a="tg" data-v="autoplay"></button></div>
      <div class="it"><div>読み上げ速度</div><div class="step"><button data-a="rate" data-v="-0.1">−</button><span>${s.rate.toFixed(1)}</span><button data-a="rate" data-v="0.1">＋</button></div></div>
      <div class="it"><div>声</div><select data-a="voice">${vopts}</select></div>
      <div class="it"><div><small>iPhone の 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 日本語 で「拡張」や「プレミアム」の声をダウンロードすると、ずっと自然になります。</small></div></div>
    </div>
    <div class="set">
      <div class="it"><div>試聴</div><button class="btn" style="width:auto;margin:0;padding:9px 16px" data-a="test">▶︎ 再生</button></div>
    </div>
    <button class="btn" data-a="export">進捗をバックアップ（ファイル）</button>
    <button class="btn" data-a="import">バックアップから復元</button>
    <input type="file" id="imp" accept="application/json,.json" hidden>
    <button class="btn warn" data-a="reset">進捗をすべて消去</button>
    <div class="foot">口慣らし v3 ・ ${ITEMS.length} 文</div>
  </div>`;
  document.getElementById('imp').onchange = importData;
}
async function exportData() {
  const name = `kuchinarashi-${dayKey()}.json`;
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}
function importData(ev) {
  const f = ev.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result);
      if (!s || s.v !== 1 || !s.cards) throw 0;
      if (!confirm('今の進捗を上書きして復元しますか？')) return;
      localStorage.setItem(STORE_KEY, JSON.stringify(s)); S = load(); toast('復元しました'); go('home');
    } catch (e) { toast('読み込めないファイルです'); }
  };
  r.readAsText(f);
}

/* ---------------- events ---------------- */
app.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, v = el.dataset.v, s = S.settings;
  switch (a) {
    case 'settings': return go('settings');
    case 'home': SES = null; return go('home');
    case 'dismiss': s.installDismissed = true; save(); return render();
    case 'mode': s.mode = v; save(); return render();
    case 'start': return startSession('study');
    case 'fix': return startSession('fix');
    case 'more': s.newPerDay += 10; save(); toast(`今日の新しい文 +10（1日 ${s.newPerDay}）`); return VIEW === 'done' ? startSession('study') : render();
    case 'lvl': { const l = +v; s.levels = s.levels.includes(l) ? s.levels.filter(x => x !== l) : s.levels.concat(l).sort();
      if (!s.levels.length) s.levels = [l]; save(); return render(); }
    case 'deck': s.decks = s.decks.includes(v) ? s.decks.filter(x => x !== v) : s.decks.concat(v);
      if (!s.decks.length) s.decks = [v]; save(); return render();
    case 'all': s.decks = s.decks.length === DECKS.length ? [DECKS[0][0]] : DECKS.map(d => d[0]); save(); return render();
    case 'quit': if ('speechSynthesis' in window) speechSynthesis.cancel(); VIEW = SES && SES.done ? 'done' : 'home'; if (VIEW === 'home') SES = null; return render();
    case 'reveal': return reveal();
    case 'tap': if (!SES.shown) reveal(); return;
    case 'hint': e.stopPropagation(); SES.hint = true; return render();
    case 'play': e.stopPropagation(); return speak(ttsText(SES.cur.ja));
    case 'slow': return speak(ttsText(SES.cur.ja), Math.max(0.5, s.rate - 0.3));
    case 'g': return grade(+v);
    case 'np': s.newPerDay = Math.max(5, Math.min(200, s.newPerDay + +v)); save(); return render();
    case 'tg': s[v] = !s[v]; save(); return render();
    case 'rate': s.rate = Math.round(Math.max(0.5, Math.min(1.3, s.rate + +v)) * 10) / 10; save(); return render();
    case 'test': return speak('{3億5千万円|さんおくごせんまんえん}の{物件|ぶっけん}を{取得|しゅとく}する{予定|よてい}です。'.replace(RUBY, (m, a, b) => /[0-9]/.test(a) ? b : a));
    case 'export': return exportData();
    case 'import': return document.getElementById('imp').click();
    case 'reset': if (confirm('進捗をすべて消去しますか？元に戻せません。')) { localStorage.removeItem(STORE_KEY); S = load(); toast('消去しました'); go('home'); } return;
  }
});
app.addEventListener('change', e => {
  if (e.target.dataset.a === 'voice') { S.settings.voice = e.target.value; save(); speak('よろしくお願いいたします。'); }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && VIEW === 'home') render(); });

/* ---------------- boot ---------------- */
fetch('data/decks.json', { cache: 'no-cache' }).then(r => r.json()).then(d => {
  ITEMS = d; BYID = Object.fromEntries(d.map(x => [x.id, x])); render();
}).catch(() => { app.innerHTML = '<div class="boot" style="font-size:16px">データを読み込めませんでした。電波のある所で一度開いてください。</div>'; });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
