/* ===== David · OGE vocabulary engine. Expects const L = {...} defined before. ===== */
(function () {
const W = L.words, byId = Object.fromEntries(W.map(w => [w.id, w]));
const $ = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const norm = s => (s || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[.!?,;:]+/g, " ").replace(/\s+/g, " ").trim();

/* seeded random, so the page looks the same after reload */
let seed = [...L.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (pool, n, not) => shuffle(pool.filter(x => !not.includes(x))).slice(0, n);

/* saved state */
const KEY = "oge-reading-" + L.id;
let S = {}; try { S = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { S = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
function mark(key, wid, ok, v) { if (S[key]) return; S[key] = { w: wid, ok: ok, v: v }; save(); upd(); }

/* speech */
let voice = null;
function pickVoice() { const vs = speechSynthesis.getVoices(); voice = vs.find(v => /en[-_]GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; }
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text) { if (!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; if (voice) u.voice = voice; u.rate = .85; speechSynthesis.speak(u); }
const sayBtn = text => { const b = $("button", "say", "🔊"); b.type = "button"; b.setAttribute("aria-label", "Послушать"); b.onclick = e => { e.stopPropagation(); say(text); }; return b; };

/* ===== layout: tabs ===== */
const main = document.getElementById("main");
const tabsNav = document.getElementById("tabs");
const TABS = [];
let CUR = null, secN = 0;
function newTab(label, title) {
  const btn = $("button", "tab", label); btn.type = "button"; const cnt = $("small"); btn.append(cnt); tabsNav.append(btn);
  const pane = $("div", "pane"); pane.hidden = true; main.append(pane);
  const t = { btn, cnt, pane, keys: [], sections: [], title }; TABS.push(t);
  btn.onclick = () => showTab(TABS.indexOf(t), true); CUR = t; secN = 0; return t;
}
function showTab(i, scroll) {
  TABS.forEach((t, j) => { t.pane.hidden = j !== i; t.btn.classList.toggle("on", j === i); });
  try { localStorage.setItem(KEY + "-tab", i); } catch (e) {}
  if (scroll) window.scrollTo({ top: document.querySelector(".bar").offsetTop, behavior: "smooth" });
  upd();
}
function section(title, instr) {
  const s = $("section", "ex"); const h = $("div", "ex-head"); const h2 = $("h2");
  h2.append($("span", "n", ++secN), title); const pill = $("span", "pill"); h.append(h2, pill); s.append(h);
  if (instr) s.append($("p", "instr", instr));
  CUR.pane.append(s); const rec = { s, pill, keys: [], tab: CUR, id: "t" + TABS.length + "s" + secN }; CUR.sections.push(rec); return rec;
}
function regKey(rec, i) { const key = rec.id + "-" + i; rec.keys.push(key); rec.tab.keys.push(key); return key; }

/* MCQ item */
function fillGap(q, ans) { const g = q.querySelector(".gap"); if (g) g.textContent = ans; }
function qLine(k, html) { const p = $("p", "q"); p.append($("span", "k", k + ".")); const t = $("span"); t.innerHTML = html; p.append(t); return p; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const gapHtml = s => esc(s).replace("___", '<span class="gap">&nbsp;</span>');
function mcq(rec, i, wid, qNode, options, answer) {
  const key = regKey(rec, i);
  const it = $("div", "it"); it.append(qNode); const box = $("div", "opts"); it.append(box);
  const btns = options.map(o => { const b = $("button", "opt", o); b.type = "button"; box.append(b); return b; });
  const lock = chosen => { box.classList.add("locked"); btns.forEach(b => { b.disabled = true; if (b.textContent === answer) b.classList.add("ok"); else if (b.textContent === chosen) b.classList.add("bad"); }); fillGap(qNode, answer); };
  btns.forEach(b => b.onclick = () => { const ok = b.textContent === answer; mark(key, wid, ok, b.textContent); lock(b.textContent); if (rec.speak) say(answer); });
  if (S[key]) lock(S[key].v);
  return it;
}
/* typing item */
const hint = en => en.split(" ").map(p => p[0] + "_".repeat(Math.max(0, p.length - 1))).join("  ");
const hintHtml = w => esc(w.ru) + ' &nbsp;<span class="hint">' + esc(hint(w.en)) + "</span>";
function typing(rec, i, wid, qNode, answers, opts = {}) {
  const key = regKey(rec, i);
  const it = $("div", "it"); it.append(qNode);
  const row = $("div", "row"); const inp = $("input", "inp"); inp.type = "text"; inp.autocomplete = "off"; inp.autocapitalize = "off"; inp.spellcheck = false; inp.setAttribute("autocorrect", "off");
  if (opts.ph) inp.placeholder = opts.ph;
  const b = $("button", "btn", "OK"); b.type = "button"; row.append(inp, b); it.append(row);
  const fb = $("div", "fb"); it.append(fb);
  const lock = (v, ok) => { inp.value = v; inp.disabled = true; b.style.display = "none"; inp.classList.add(ok ? "ok" : "bad");
    fb.className = "fb " + (ok ? "ok" : "bad"); fb.innerHTML = ok ? "Верно! " : 'Правильно: <span class="right">' + esc(answers[0]) + "</span> "; fb.append(sayBtn(answers[0])); };
  const check = () => { const v = inp.value.trim(); if (!v) return; const ok = answers.some(a => norm(a) === norm(v)); mark(key, wid, ok, v); lock(v, ok); say(answers[0]); };
  b.onclick = check; inp.onkeydown = e => { if (e.key === "Enter") check(); };
  if (S[key]) lock(S[key].v, S[key].ok);
  return it;
}
const answersOf = w => [w.en, ...(w.alt || [])];

/* ===== exercise builders ===== */
function exCards(ws) {
  const r = section("Новые слова", "Нажми на карточку — увидишь перевод. 🔊 — послушай. Проговори каждое слово вслух.");
  const g = $("div", "cards");
  ws.forEach(w => { const c = $("button", "fc"); c.type = "button"; const inn = $("div", "fc-in"); const f = $("div", "fc-f"); f.append($("b", null, w.en));
    inn.append(f, $("div", "fc-b", w.ru)); c.append(inn, sayBtn(w.en)); c.onclick = () => { c.classList.toggle("flip"); if (c.classList.contains("flip")) say(w.en); }; g.append(c); });
  r.s.append(g); r.pill.textContent = ws.length + " слов"; r.static = true;
}
function exMatch(ws) {
  const r = section("Соедини пары", "Нажми на английское слово, потом на его перевод.");
  const sh = shuffle(ws); const groups = []; for (let i = 0; i < sh.length; i += 5) groups.push(sh.slice(i, i + 5));
  if (groups.length > 1 && groups[groups.length - 1].length < 3) groups[groups.length - 2].push(...groups.pop());
  let idx = 0;
  groups.forEach(gr => {
    const box = $("div", "mgroup"); const c1 = $("div", "mcol"), c2 = $("div", "mcol"); box.append(c1, c2);
    let sel = null; const miss = {}; const lb = {}, rb = {};
    const items = gr.map(w => ({ w, key: regKey(r, idx++) }));
    items.forEach(it => { const b = $("button", "opt", it.w.en); b.type = "button"; lb[it.w.id] = b; b.onclick = () => { if (b.classList.contains("gone")) return; Object.values(lb).forEach(x => x.classList.remove("sel")); b.classList.add("sel"); sel = it; say(it.w.en); }; c1.append(b); });
    shuffle(items).forEach(({ w }) => { const b = $("button", "opt", w.ru); b.type = "button"; rb[w.id] = b; c2.append(b);
      b.onclick = () => { if (!sel || b.classList.contains("gone")) return;
        if (sel.w.id === w.id) { lb[w.id].classList.remove("sel"); lb[w.id].classList.add("gone"); b.classList.add("gone"); mark(sel.key, w.id, !miss[w.id], w.ru); sel = null; }
        else { miss[sel.w.id] = true; b.classList.add("shake"); setTimeout(() => b.classList.remove("shake"), 400); } }; });
    items.forEach(({ w, key }) => { if (S[key]) { lb[w.id].classList.add("gone"); rb[w.id].classList.add("gone"); } });
    r.s.append(box);
  });
}
function exEnRu(ws) {
  const r = section("Выбери перевод", "Что значит это слово?");
  const box = $("div", "items"); const pool = W.map(w => w.ru);
  shuffle(ws).forEach((w, i) => { const q = qLine(i + 1, "<b>" + esc(w.en) + "</b>"); q.append(sayBtn(w.en)); box.append(mcq(r, i, w.id, q, shuffle([w.ru, ...pick(ws.map(x => x.ru).concat(pool).filter((x, j, a) => a.indexOf(x) === j), 3, [w.ru])]), w.ru)); });
  r.s.append(box);
}
function exRuEn(ws) {
  const r = section("Как это по-английски?", "Выбери английское слово.");
  r.speak = true; const box = $("div", "items"); const pool = ws.map(x => x.en);
  shuffle(ws).forEach((w, i) => box.append(mcq(r, i, w.id, qLine(i + 1, esc(w.ru)), shuffle([w.en, ...pick(pool, 3, [w.en])]), w.en)));
  r.s.append(box);
}
function exGap(ws) {
  const r = section("Вставь слово", "Это предложения из текста ОГЭ. Выбери слово, которое подходит.");
  r.speak = true; const box = $("div", "items");
  shuffle(ws.filter(w => w.gap)).forEach((w, i) => {
    const same = ws.filter(x => x.pos === w.pos && x.id !== w.id).map(x => x.ans);
    const pool = same.length >= 3 ? same : ws.filter(x => x.id !== w.id).map(x => x.ans);
    box.append(mcq(r, i, w.id, qLine(i + 1, gapHtml(w.gap)), shuffle([w.ans, ...pick(pool, 3, [w.ans])]), w.ans));
  });
  r.s.append(box);
}
function exForms(fs) {
  if (!fs.length) return;
  const r = section("Выбери правильную форму", "Какое время? Какое слово нужно — глагол, существительное или прилагательное?");
  r.speak = true; const box = $("div", "items");
  fs.forEach((f, i) => { const q = qLine(i + 1, gapHtml(f.s)); if (f.ru) q.append($("div", "rule", f.ru)); box.append(mcq(r, i, f.id, q, shuffle(f.o), f.a)); });
  r.s.append(box);
}
function exScramble(ws) {
  const list = shuffle(ws.filter(w => /^[a-z]+$/i.test(w.en) && w.en.length >= 4));
  if (!list.length) return;
  const r = section("Собери слово", "Нажимай на буквы по порядку. Ошибся — нажми на букву в ответе, она вернётся назад.");
  const box = $("div", "items");
  list.forEach((w, i) => {
    const key = regKey(r, i);
    const it = $("div", "it"); it.append(qLine(i + 1, esc(w.ru)));
    const slots = $("div", "slots"); const pool = $("div", "opts tiles"); it.append(slots, pool); const fb = $("div", "fb"); it.append(fb);
    let letters = shuffle([...w.en.toLowerCase()]); if (letters.join("") === w.en.toLowerCase()) letters = letters.reverse();
    let wrong = false; const chosen = [];
    const done = ok => { slots.innerHTML = ""; [...w.en].forEach(ch => slots.append($("span", "tile", ch))); pool.remove(); fb.className = "fb " + (ok ? "ok" : "bad"); fb.textContent = ok ? "Верно! " : "Получилось не с первого раза "; fb.append(sayBtn(w.en)); slots.style.borderColor = ok ? "var(--ok)" : "var(--bad)"; };
    letters.forEach(ch => { const t = $("button", "tile", ch); t.type = "button"; pool.append(t);
      t.onclick = () => { if (t.classList.contains("used")) return; t.classList.add("used"); const s = $("button", "tile", ch); s.type = "button"; slots.append(s); chosen.push({ t, s });
        s.onclick = () => { t.classList.remove("used"); s.remove(); chosen.splice(chosen.findIndex(c => c.s === s), 1); };
        if (chosen.length === letters.length) { const v = chosen.map(c => c.s.textContent).join("");
          if (v === w.en.toLowerCase()) { mark(key, w.id, !wrong, v); done(!wrong); say(w.en); }
          else { wrong = true; fb.className = "fb bad"; fb.textContent = "Не так. Нажми на буквы в ответе и попробуй ещё раз."; } } }; });
    if (S[key]) done(S[key].ok);
    box.append(it);
  });
  r.s.append(box);
}
function exType(ws, title) {
  const r = section(title || "Напиши по-английски", "Подсказка: первая буква и сколько всего букв. Нажми OK или Enter.");
  const box = $("div", "items");
  shuffle(ws).forEach((w, i) => box.append(typing(r, i, w.id, qLine(i + 1, hintHtml(w)), answersOf(w))));
  r.s.append(box);
}
function exListen(ws) {
  const r = section("Послушай и напиши", "Нажми 🔊, послушай слово (можно несколько раз) и напиши его.");
  const box = $("div", "items");
  shuffle(ws).forEach((w, i) => { const q = $("p", "q"); q.append($("span", "k", (i + 1) + ".")); const b = $("button", "btn ghost", "🔊 Слушать"); b.type = "button"; b.onclick = () => say(w.en); q.append(b); box.append(typing(r, i, w.id, q, answersOf(w), { ph: "напиши, что услышал" })); });
  r.s.append(box);
}
function exRetry(getWords, title, instr) {
  const r = section(title, instr); r.static = true; r.pill.textContent = "🔁";
  const box = $("div"); r.s.append(box); r.render = () => {
    box.innerHTML = ""; const hw = getWords();
    if (!hw.length) { box.append($("p", "note", "Ошибок нет. Так держать! 💪")); return; }
    const chips = $("div", "hard"); hw.forEach(w => chips.append($("span", null, w.en + " — " + w.ru))); box.append(chips);
    const b = $("button", "btn", "Повторить эти слова"); b.type = "button"; box.append(b);
    b.onclick = () => { b.remove(); const list = $("div", "items"); list.style.marginTop = "12px";
      shuffle(hw).forEach((w, i) => { const it = $("div", "it"); it.append(qLine(i + 1, hintHtml(w)));
        const row = $("div", "row"); const inp = $("input", "inp"); inp.autocapitalize = "off"; inp.autocomplete = "off"; inp.spellcheck = false; const ok = $("button", "btn", "OK"); ok.type = "button"; row.append(inp, ok); const fb = $("div", "fb"); it.append(row, fb);
        const chk = () => { const good = answersOf(w).some(a => norm(a) === norm(inp.value)); say(w.en); if (good) { inp.className = "inp ok"; inp.disabled = true; ok.remove(); fb.className = "fb ok"; fb.textContent = "Верно!"; } else { inp.className = "inp bad"; fb.className = "fb bad"; fb.innerHTML = 'Правильно: <span class="right">' + esc(w.en) + "</span> — напиши ещё раз"; inp.value = ""; inp.focus(); } };
        ok.onclick = chk; inp.onkeydown = e => { if (e.key === "Enter") chk(); }; list.append(it); });
      box.append(list); r.frozen = true; };
  };
  return r;
}
const RETRY = [];
function hardWords(keys) { const h = {}; keys.forEach(k => { const x = S[k]; if (x && x.w && !x.ok) h[x.w] = 1; }); return Object.keys(h).filter(id => byId[id]).map(id => byId[id]); }
function nextBtn(i, label) { const b = $("button", "btn next", label); b.type = "button"; b.onclick = () => showTab(i, true); CUR.pane.append(b); }

/* ===== text highlighting ===== */
const forms = []; W.forEach(w => { [w.en, w.ans, ...(w.hl || [])].filter(Boolean).forEach(f => forms.push([f.toLowerCase().replace(/’/g, "'"), w])); });
forms.sort((a, b) => b[0].length - a[0].length);
const re = new RegExp("\\b(" + forms.map(f => f[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]")).join("|") + ")\\b", "gi");
const fmap = Object.fromEntries(forms.map(f => [f[0], f[1]]));
function hl(text) { return esc(text).replace(re, m => { const w = fmap[m.toLowerCase().replace(/’/g, "'")]; return w ? '<span class="w" data-ru="' + esc(w.ru) + '" data-en="' + esc(w.en) + '">' + m + "</span>" : m; }); }
const tip = $("div", "tip"); tip.style.display = "none"; document.body.append(tip);
document.addEventListener("click", e => { const t = e.target.closest(".w"); if (!t) { tip.style.display = "none"; return; } say(t.dataset.en); tip.textContent = t.dataset.ru; tip.style.display = "block"; const rc = t.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(innerWidth - 270, rc.left)) + "px"; tip.style.top = (rc.bottom + 6) + "px"; });
addEventListener("scroll", () => tip.style.display = "none", { passive: true });

/* ===== build tabs ===== */
const N = 3, size = Math.ceil(W.length / N);
const parts = []; for (let i = 0; i < N; i++) parts.push(W.slice(i * size, (i + 1) * size));
parts.forEach((ws, i) => {
  const t = newTab("Часть " + (i + 1), ws);
  const ids = new Set(ws.map(w => w.id));
  exCards(ws); exMatch(ws); exEnRu(ws); exRuEn(ws); exGap(ws);
  exForms((L.forms || []).filter(f => ids.has(f.id)));
  exScramble(ws); exType(ws); exListen(ws);
  RETRY.push({ r: exRetry(() => hardWords(t.keys), "Работа над ошибками", "Слова этой части, в которых ты ошибся. Напиши их ещё раз."), t });
  nextBtn(i + 1, i < N - 1 ? "Дальше → Часть " + (i + 2) : "Дальше → Всё вместе");
});
{
  const t = newTab("Всё вместе", W);
  t.pane.append($("p", "intro", "Все 30 слов вперемешку. Сделай эту вкладку, когда пройдёшь три части — лучше на следующий день."));
  exMatch(W); exGap(W); exType(W, "Напиши по-английски — все слова");
  const r = section("Прочитай текст", "Это настоящий текст из ОГЭ. Новые слова выделены — нажми на слово, если забыл перевод.");
  r.static = true; r.pill.textContent = "📖";
  const tx = $("div", "text");
  if (L.task.title) tx.append($("h3", "ttl", L.task.title));
  if (L.task.parts) L.task.parts.forEach(p => { const el = $("p"); el.innerHTML = '<span class="lbl">' + p.l + "</span>" + hl(p.t); tx.append(el); });
  else L.task.paras.forEach(p => { const el = $("p"); el.innerHTML = hl(p); tx.append(el); });
  r.s.append(tx);
  const T = L.task;
  if (T.type === "headings") {
    const r2 = section("Задание ОГЭ", "Определи, в каком тексте A–F есть ответ на каждый вопрос 1–7. Один вопрос лишний. Можно листать вверх и перечитывать текст.");
    const ol = $("ol", "qs"); T.questions.forEach(q => ol.append($("li", null, q))); r2.s.append(ol);
    const sels = {};
    T.parts.forEach((p, i) => { const key = regKey(r2, i); const row = $("div", "task-row"); row.append($("span", "lbl", p.l));
      const s = $("select"); s.append(new Option("— номер вопроса —", "")); T.questions.forEach((q, j) => s.append(new Option(String(j + 1), j + 1))); row.append(s); r2.s.append(row); sels[p.l] = { s, key }; });
    const b = $("button", "btn teal", "Проверить"); b.type = "button"; const fb = $("div", "fb"); r2.s.append(b, fb);
    const show = () => { let n = 0; T.parts.forEach(p => { const { s, key } = sels[p.l]; s.value = S[key].v; const ok = +S[key].v === T.key[p.l]; if (ok) n++; s.className = ok ? "ok" : "bad"; s.disabled = true; }); b.style.display = "none"; fb.className = "fb " + (n === T.parts.length ? "ok" : "bad"); fb.innerHTML = "Правильно " + n + " из " + T.parts.length + ". " + (n < T.parts.length ? "Ответы: " + T.parts.map(p => p.l + "–" + T.key[p.l]).join(", ") + ". Лишний вопрос — " + T.extra + "." : "Отлично!"); };
    b.onclick = () => { if (T.parts.some(p => !sels[p.l].s.value)) { fb.className = "fb bad"; fb.textContent = "Выбери номер вопроса для каждого текста."; return; } T.parts.forEach(p => { const { s, key } = sels[p.l]; mark(key, null, +s.value === T.key[p.l], s.value); }); show(); };
    if (T.parts.every(p => S[sels[p.l].key])) show();
  } else {
    const r2 = section("Задание ОГЭ", "True — так сказано в тексте. False — в тексте сказано обратное. Not stated — в тексте об этом ничего нет.");
    const box = $("div", "items"); const lab = ["True", "False", "Not stated"];
    T.st.forEach((st, i) => box.append(mcq(r2, i, null, qLine(i + 1, esc(st.s)), lab, lab[st.a - 1])));
    r2.s.append(box);
  }
  RETRY.push({ r: exRetry(() => hardWords(Object.keys(S)), "Все трудные слова урока", "Все слова, в которых были ошибки, во всех частях. Повтори их ещё раз."), t });
  const fin = section("Мой результат", null); fin.static = true; fin.pill.textContent = "🏁";
  const finBox = $("div"); fin.s.append(finBox);
  window.__renderFin = () => {
    const all = TABS.flatMap(t => t.keys); const done = all.filter(k => S[k]).length, ok = all.filter(k => S[k] && S[k].ok).length; const pct = done ? Math.round(ok / done * 100) : 0;
    finBox.innerHTML = ""; finBox.append($("div", "big", done + " / " + all.length));
    const lines = TABS.map(t => t.btn.firstChild.textContent + ": " + t.keys.filter(k => S[k]).length + "/" + t.keys.length);
    finBox.append($("p", "note", "Выполнено " + done + " заданий из " + all.length + (done ? ", с первого раза верно " + pct + "%" : "") + ". " + lines.join(" · ")));
    const a = $("div", "actions");
    const send = $("button", "btn teal", "Отправить результат учителю"); send.type = "button";
    send.onclick = async () => { let nm = ""; try { nm = localStorage.getItem("oge-reading-name") || ""; } catch (e) {} if (!nm) { nm = (prompt("Как тебя зовут? (имя увидит учитель)") || "").trim(); if (!nm) return; try { localStorage.setItem("oge-reading-name", nm); } catch (e) {} } const hw = hardWords(Object.keys(S)); const txt = nm + " · " + L.short + "\n" + lines.join("\n") + "\nВсего: " + done + "/" + all.length + ", верно с первого раза " + pct + "%\n" + (hw.length ? "Трудные слова: " + hw.map(w => w.en).join(", ") : "Ошибок нет!");
      try { if (navigator.share) { await navigator.share({ text: txt }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(txt); send.textContent = "Скопировано — вставь в сообщение ✓"; } catch (e) { prompt("Скопируй и отправь:", txt); } };
    const reset = $("button", "btn ghost", "Начать урок заново"); reset.type = "button";
    reset.onclick = () => { if (confirm("Стереть все ответы во всех частях и начать заново?")) { S = {}; save(); location.reload(); } };
    a.append(send, reset); finBox.append(a);
  };
}

/* ===== progress ===== */
function upd() {
  const t = TABS.find(t => !t.pane.hidden) || TABS[0];
  const d = t.keys.filter(k => S[k]).length;
  document.getElementById("cnt").innerHTML = d + " <small>/ " + t.keys.length + "</small>";
  document.getElementById("fill").style.width = (t.keys.length ? d / t.keys.length * 100 : 0) + "%";
  TABS.forEach(x => { const n = x.keys.filter(k => S[k]).length; x.cnt.textContent = n === x.keys.length ? " ✓" : ""; x.btn.classList.toggle("done", n === x.keys.length); });
  TABS.forEach(x => x.sections.forEach(r => { if (r.static) return; const n = r.keys.filter(k => S[k]).length; r.pill.textContent = n + " / " + r.keys.length; r.pill.classList.toggle("done", n === r.keys.length); }));
  RETRY.forEach(x => { if (!x.r.frozen) x.r.render(); });
  window.__renderFin && window.__renderFin();
}
let start = 0; try { start = +(localStorage.getItem(KEY + "-tab") || 0); } catch (e) {}
showTab(Math.min(start, TABS.length - 1), false);
})();
