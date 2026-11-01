"use strict";
// Kimya Lab screens: home, setup, quiz, result, stats, study
const app = document.getElementById("app");
const nav = document.getElementById("nav");
const toastEl = document.getElementById("toast");
const fileInput = document.getElementById("importFile");
const ui = { screen: "home", mod: "bilesik", run: null, statTab: "bilesik", studyTab: "bilesik", confirmReset: false };
let tick = 0, autoNext = 0, toastTimer = 0;

const ICONS = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5"/></svg>',
  study: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4zM20 5.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/></svg>',
  stats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20v-9M12 20V5M19 20v-6"/></svg>',
  clock: '<svg class="clock" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2.5h6"/></svg>',
};
const VIEWS = { home, setup, quiz, result, stats, study };
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;

function render() {
  const s = ui.screen;
  app.className = `app ${s}`;
  app.innerHTML = VIEWS[s]();
  nav.hidden = s === "quiz";
  if (!nav.hidden) nav.innerHTML = navHtml();
}

function show(screen) {
  stopTimers();
  ui.screen = screen;
  ui.confirmReset = false;
  render();
  window.scrollTo(0, 0);
}

function navHtml() {
  const on = { home: "home", setup: "home", result: "home", study: "study", stats: "stats" }[ui.screen];
  const item = (v, label) => `<button data-act="show" data-v="${v}" class="${on === v ? "on" : ""}"${on === v ? ' aria-current="page"' : ""}>${ICONS[v]}<span>${label}</span></button>`;
  return `<div class="in">${item("home", T.navHome)}${item("study", T.navStudy)}${item("stats", T.navStats)}</div>`;
}

// ---- Home and setup ----
function home() {
  let d = 0, y = 0;
  for (const mod in store.stats) for (const id in store.stats[mod]) { d += store.stats[mod][id].d; y += store.stats[mod][id].y; }
  const last = store.history[0];
  return `<header class="hh"><small>${T.tagline}</small><h1>${T.app}</h1><p class="muted">${d + y ? T.totals(d + y, pct(d, d + y)) : T.firstTime}</p></header>
<div class="mods">${modCard("bilesik")}${modCard("element")}</div>
<p class="h4">${T.weak}</p>
<div class="row2">${weakBtn("bilesik")}${weakBtn("element")}</div>
${last ? `<p class="h4">${T.lastTest}</p><ul class="list">${historyRow(last)}</ul>` : ""}`;
}

function modCard(mod) {
  const isEl = mod === "element";
  const sub = isEl ? T.modElementSub(ELEMENTS.length) : T.modCompoundSub(COMPOUNDS.length);
  return `<button class="mod" data-act="setup" data-v="${mod}"><span class="mi"><span>${isEl ? "Rb" : fx("H2O")}</span></span><b>${isEl ? T.modElement : T.modCompound}</b><small>${sub}</small><span class="go">${T.start} ›</span></button>`;
}

function weakBtn(mod) {
  const n = weakList(mod).length;
  return `<button class="weak" data-act="weak" data-v="${mod}"${n ? "" : " disabled"}><b>${n}</b>${mod === "element" ? T.weakElements : T.weakCompounds}</button>`;
}

function setup() {
  const isEl = ui.mod === "element", size = isEl ? ELEMENTS.length : COMPOUNDS.length;
  const first = isEl
    ? field(T.showName, seg("hideName", [[false, T.nameShown], [true, T.nameHidden]]))
    : field(T.direction, seg("dir", [["f2n", T.f2n], ["n2f", T.n2f], ["mix", T.mix]]));
  return `<button class="back" data-act="show" data-v="home">‹ ${T.navHome}</button>
<h2 class="title">${isEl ? T.modElement : T.modCompound}</h2>
${first}
${field(T.count, seg("count", [[10, "10"], [20, "20"], [0, T.all(size)]]))}
${field(T.timer, seg("timer", [[0, T.off], [10, T.secs(10)], [20, T.secs(20)], [30, T.secs(30)]]))}
<button class="cta" data-act="start" data-v="${ui.mod}">${T.start}</button>`;
}

const field = (label, body) => `<div class="field"><span>${label}</span>${body}</div>`;

function seg(key, opts) {
  return `<div class="seg">${opts.map(([v, label]) => {
    const on = store.prefs[key] === v;
    return `<button data-act="pref" data-k="${key}" data-v="${v}" aria-pressed="${on}" class="${on ? "on" : ""}">${label}</button>`;
  }).join("")}</div>`;
}

function setPref(key, raw) {
  store.prefs[key] = key === "dir" ? raw : key === "hideName" ? raw === "true" : Number(raw);
  save();
  render();
}

// ---- Quiz flow ----
function start(mod, opts) {
  stopTimers();
  const run = newRun(mod, store.prefs, opts);
  if (!run.items.length) return toast(T.emptyPool);
  Object.assign(ui, { mod, run, screen: "quiz" });
  window.scrollTo(0, 0);
  nextQuestion();
}

function nextQuestion() {
  const r = ui.run;
  stopTimers();
  if (r.n >= r.total) return finish();
  r.q = makeQ(r);
  r.picked = undefined;
  r.left = r.timer;
  r.recent = [r.q.id, ...r.recent].slice(0, 3);
  r.asked.add(r.q.id);
  render();
  startTimer();
}

function choose(id) {
  const r = ui.run;
  if (!r || !r.q || r.picked !== undefined) return;
  stopTimers();
  r.picked = id;
  const ok = record(r.q, id);
  r.answers.push({ q: r.q, id, ok });
  if (ok) r.streak++;
  else { r.streak = 0; noteMistake(r); }
  render();
  app.querySelector(".fb")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  if (ok) autoNext = setTimeout(advance, r.mod === "element" ? 1700 : 1000);
  else app.querySelector(".next")?.focus({ preventScroll: true });
}

function advance() {
  if (!ui.run || ui.run.picked === undefined) return;
  ui.run.n++;
  nextQuestion();
}

function finish() {
  const r = ui.run, ok = r.answers.filter(a => a.ok).length;
  r.secs = Math.round((Date.now() - r.startedAt) / 1000);
  if (r.answers.length) addHistory({ at: Date.now(), mod: r.mod, ok, n: r.answers.length, secs: r.secs });
  navigator.storage?.persist?.()?.catch(() => {}); // ask the browser not to clear saved progress
  show("result");
}

// Countdown pauses while the app is in the background
function startTimer() {
  const r = ui.run;
  clearInterval(tick);
  if (!r || !r.timer || r.picked !== undefined || ui.screen !== "quiz" || document.hidden) return;
  tick = setInterval(() => {
    r.left--;
    const low = r.left <= 5, bar = app.querySelector(".tbar i"), num = app.querySelector(".tnum");
    if (bar) { bar.style.transform = `scaleX(${r.left / r.timer})`; bar.classList.toggle("low", low); }
    if (num) { num.textContent = `${r.left}s`; num.classList.toggle("low", low); }
    if (r.left <= 0) choose(null);
  }, 1000);
}

function stopTimers() { clearInterval(tick); clearTimeout(autoNext); }

function quiz() {
  const r = ui.run, q = r.q, it = q.item, done = r.picked !== undefined, isEl = q.mod === "element";
  let chip, prompt, big, meta = "";
  if (isEl) {
    chip = done ? elFamily(it) : T.elementChip;
    prompt = T.askClass;
    big = `<div class="big sym">${it.s}</div>`;
    if (!r.hideName) meta = T.elMeta(it);
  } else {
    const f2n = q.dir === "f2n";
    chip = f2n ? T.f2n : T.n2f;
    prompt = f2n ? T.askName : T.askFormula;
    big = f2n ? `<div class="big fml${it.f.length > 6 ? " long" : ""}">${fx(it.f)}</div>` : `<div class="big word">${it.n}</div>`;
  }
  const opts = q.opts.map((o, i) => {
    const state = !done ? "" : o.id === q.answer ? " ok" : o.id === r.picked ? " no" : " dim";
    const dot = isEl ? `<span class="dot c-${o.id}"></span>` : "";
    const text = !isEl && q.dir === "n2f" ? fx(o.text) : o.text;
    return `<button class="opt${state}" data-act="opt" data-v="${o.id}"${done ? " disabled" : ""}>${dot}<span class="t">${text}</span><kbd>${i + 1}</kbd></button>`;
  }).join("");
  return `${hud(r)}<div class="card"><span class="chip">${chip}</span><p class="prompt">${prompt}</p>${big}${meta ? `<p class="meta">${meta}</p>` : ""}</div>
<div class="opts">${opts}</div>${done ? feedback(r) : ""}`;
}

// Timer bar when the countdown is on, progress bar otherwise
function hud(r) {
  const low = r.left <= 5 ? " low" : "";
  const bar = r.timer
    ? `${ICONS.clock}<div class="tbar"><i class="${low}" style="transform:scaleX(${r.left / r.timer})"></i></div><b class="tnum${low}">${r.left}s</b>`
    : `<div class="tbar"><i style="transform:scaleX(${r.n / r.total})"></i></div>`;
  return `<div class="hud"><button class="x" data-act="quit" aria-label="${T.quit}">‹</button>${bar}</div>
<div class="sub"><span>${T.qCount(Math.min(r.n + 1, r.total), r.total)}</span><span>${r.streak > 1 ? T.streak(r.streak) : ""}</span></div>`;
}

function feedback(r) {
  const q = r.q, it = q.item, ok = r.picked === q.answer, isEl = q.mod === "element";
  const head = ok ? T.correct : r.picked === null ? T.timeUp : T.wrong;
  const line = isEl ? `<b class="ce c-${it.c}">${it.s}</b> ${it.n}: <b>${CATS[it.c]}</b>` : `${fx(it.f, true)} = <b>${it.n}</b>`;
  const tip = ok ? "" : isEl ? EL_TIPS[it.s] : cpHint(it);
  const extra = isEl ? `<p class="hint">${elWhere(it)}</p>${ptable(it)}` : "";
  const next = ok ? "" : `<button class="next" data-act="next">${T.next}</button>`;
  return `<div class="fb ${ok ? "good" : "bad"}" role="status"><span class="fh">${head}</span><p class="fl">${line}</p>${tip ? `<p class="hint">${tip}</p>` : ""}${extra}${next}</div>`;
}

// Mini periodic table; full shows every symbol (study list), otherwise only the asked one
function ptable(cur, full = false) {
  const cells = ELEMENTS.map(x => {
    const on = cur && x.s === cur.s;
    return `<i class="c-${x.c}${on ? " on" : ""}" style="grid-area:${x.p}/${x.g}" title="${x.s} · ${x.n}">${full || on ? x.s : ""}</i>`;
  }).join("");
  const legend = CAT_ORDER.map(c => `<span class="c-${c}">${CATS[c]}</span>`).join("");
  return `<div class="ptwrap"><div class="pt${full ? " full" : ""}">${cells}</div></div><div class="ptl">${legend}</div>`;
}

function result() {
  const r = ui.run, n = r.answers.length, ok = r.answers.filter(a => a.ok).length, miss = r.answers.filter(a => !a.ok);
  const list = miss.length
    ? `<p class="h4">${T.mistakes}</p><ul class="list">${miss.map(a => `<li class="item"><b>${askLabel(a.q)}</b><small>${T.yourAnswer}: ${optLabel(a.q, a.id)}</small><small>${T.rightAnswer}: <span class="g">${optLabel(a.q, a.q.answer)}</span></small></li>`).join("")}</ul>`
    : `<p class="empty">${T.noMistakes}</p>`;
  return `<div class="res"><p class="h4">${T.done}</p><div class="score"><b>${ok}</b><span>/ ${n}</span></div>
<p class="muted">%${pct(ok, n)} ${T.success} · ${T.dur(r.secs)}</p></div>
${list}
<div class="acts">${miss.length ? `<button class="btn pri" data-act="redo">${T.redo}</button>` : ""}<button class="btn${miss.length ? "" : " pri"}" data-act="start" data-v="${r.mod}">${T.newTest}</button><button class="btn" data-act="show" data-v="stats">${T.toStats}</button></div>`;
}

// ---- Stats ----
function stats() {
  const tabs = tabBar("statTab", [["bilesik", T.modCompound], ["element", T.elementsShort], ["history", T.tests]]);
  const body = ui.statTab === "history" ? historyView() : itemStats(ui.statTab);
  return `<h2 class="title">${T.navStats}</h2>${tabs}${body}${dataTools()}`;
}

function tabBar(key, tabs) {
  return `<div class="tabs" role="tablist">${tabs.map(([v, label]) => {
    const on = ui[key] === v;
    return `<button role="tab" data-act="tab" data-k="${key}" data-v="${v}" aria-selected="${on}" class="${on ? "on" : ""}">${label}</button>`;
  }).join("")}</div>`;
}

function itemStats(mod) {
  const items = mod === "element" ? ELEMENTS : COMPOUNDS;
  const rows = items.map(x => ({ x, s: store.stats[mod][x.id] })).filter(r => r.s && r.s.d + r.s.y);
  if (!rows.length) return `<p class="empty">${T.noStats}</p>`;
  rows.sort((a, b) => b.s.y - a.s.y || a.s.d - b.s.d);
  const d = rows.reduce((t, r) => t + r.s.d, 0), y = rows.reduce((t, r) => t + r.s.y, 0);
  const unseen = items.length - rows.length;
  return `<div class="sum">${tile(d + y, T.answers)}${tile(d, T.correctN, "g")}${tile(y, T.wrongN, "r")}${tile("%" + pct(d, d + y), T.success)}</div>
<p class="h4">${T.mostWrong}</p><ul class="list">${rows.map(r => statRow(mod, r.x, r.s)).join("")}</ul>
${unseen ? `<p class="muted note">${T.unseen(unseen)}</p>` : ""}`;
}

const tile = (v, label, cls = "") => `<div><b class="${cls}">${v}</b><small>${label}</small></div>`;

function statRow(mod, x, s) {
  const top = Object.entries(s.conf).sort((a, b) => b[1] - a[1])[0];
  const name = mod === "element" ? `${x.s}<small>${x.n}</small>` : `${fx(x.f)}<small>${x.n}</small>`;
  const conf = !top ? "" : mod === "element" ? T.confEl(top[1], CATS[top[0]]) : T.confCp(CP_BY[top[0]]?.n || top[0], top[1]);
  const meta = [conf, s.last ? T.ago(s.last) : ""].filter(Boolean).join(" · ");
  return `<li class="srow"><span class="nm">${name}</span><span class="ct"><span class="g">✓ ${s.d}</span><span class="r">✗ ${s.y}</span></span><span class="bar"><i style="width:${pct(s.d, s.d + s.y)}%"></i></span>${meta ? `<small>${meta}</small>` : ""}</li>`;
}

function historyView() {
  const h = store.history;
  return h.length ? `<ul class="list">${h.slice(0, 60).map(historyRow).join("")}</ul>` : `<p class="empty">${T.noTests}</p>`;
}

function historyRow(e) {
  return `<li class="item hrow"><span><b>${e.mod === "element" ? T.modElement : T.modCompound}</b><small>${T.when(e.at)} · ${T.dur(e.secs)}</small></span><b class="${pct(e.ok, e.n) >= 70 ? "g" : "r"}">${e.ok}/${e.n}</b></li>`;
}

function dataTools() {
  return `<p class="h4">${T.data}</p><p class="muted note">${T.dataNote}</p>
<div class="row2"><button class="btn" data-act="export">${T.export}</button><button class="btn" data-act="import">${T.import}</button></div>
<button class="btn danger" data-act="reset">${ui.confirmReset ? T.resetConfirm : T.reset}</button>`;
}

// ---- Study list ----
function study() {
  const tabs = tabBar("studyTab", [["bilesik", T.modCompound], ["element", T.elementsShort]]);
  return `<h2 class="title">${T.navStudy}</h2>${tabs}${ui.studyTab === "element" ? studyElements() : studyCompounds()}`;
}

function studyCompounds() {
  const shown = new Set();
  const cards = Object.entries(FAM_NAMES).map(([k, name]) => {
    const list = COMPOUNDS.filter(c => c.fam.includes(k));
    list.forEach(c => shown.add(c.id));
    return list.length ? famCard(name, list, HINTS[k]) : "";
  }).join("");
  const rest = COMPOUNDS.filter(c => !shown.has(c.id));
  return `<p class="muted note">${T.studyNote}</p>${cards}${rest.length ? famCard(T.others, rest, "") : ""}`;
}

function famCard(name, list, hint) {
  const rows = list.map(c => `<div class="pair"><b>${fx(c.f, true)}</b><span>${c.n}</span></div>`).join("");
  return `<section class="fam"><h3>${name}</h3>${rows}${hint ? `<p class="hint">${hint}</p>` : ""}</section>`;
}

function studyElements() {
  const groups = CAT_ORDER.map(c => {
    const list = ELEMENTS.filter(e => e.c === c);
    return `<section class="fam"><h3>${CATS[c]} <small>${list.length}</small></h3><div class="chips">${list.map(e => `<span class="c-${c}"><b>${e.s}</b> ${e.n}</span>`).join("")}</div></section>`;
  }).join("");
  return `<section class="fam">${ptable(null, true)}</section>${groups}`;
}

// ---- Events ----
const ACTIONS = {
  show: v => show(v),
  setup: v => { ui.mod = v; show("setup"); },
  pref: (v, b) => setPref(b.dataset.k, v),
  start: v => start(v),
  weak: v => start(v, { weak: true }),
  redo: () => start(ui.run.mod, { only: [...new Set(ui.run.answers.filter(a => !a.ok).map(a => a.q.id))] }),
  opt: v => choose(v),
  next: () => advance(),
  quit: () => show("home"),
  tab: (v, b) => { ui[b.dataset.k] = v; ui.confirmReset = false; render(); },
  export: () => exportData(),
  import: () => fileInput.click(),
  reset: () => {
    if (ui.confirmReset) { resetData(); toast(T.resetDone); }
    ui.confirmReset = !ui.confirmReset;
    render();
  },
};

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if (b && !b.disabled && ACTIONS[b.dataset.act]) ACTIONS[b.dataset.act](b.dataset.v, b);
});

// 1-4 picks an option, Enter moves on
document.addEventListener("keydown", e => {
  const r = ui.run;
  if (ui.screen !== "quiz" || !r || e.ctrlKey || e.metaKey || e.altKey) return;
  if (r.picked === undefined && /^[1-4]$/.test(e.key)) choose(r.q.opts[e.key - 1].id);
  else if (r.picked !== undefined && e.key === "Enter" && !e.target.closest("button")) advance();
});

document.addEventListener("visibilitychange", () => document.hidden ? clearInterval(tick) : startTimer());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  fileInput.value = "";
  if (!file) return;
  toast(importData(await file.text()) ? T.importDone : T.importFail);
  render();
});

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
render();
