"use strict";
// Question engine: which item comes next and which options it gets
const CAT_W = { m: 0.6, y: 1.8, a: 1, s: 1.2 }; // keeps "always Metal" from scoring well
const MAX_RETRY = 2; // a mistake comes back at most this many times per test

const rnd = n => Math.floor(Math.random() * n);

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function weighted(list, weightOf) {
  const ws = list.map(weightOf);
  let t = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) if ((t -= ws[i]) <= 0) return list[i];
  return list[list.length - 1];
}

// Weak: answered wrong before and not yet right three times in a row
function isWeak(mod, id) {
  const s = store.stats[mod][id];
  return !!s && s.y > 0 && s.run < 3;
}
const weakList = mod => (mod === "element" ? ELEMENTS : COMPOUNDS).filter(x => isWeak(mod, x.id));

// Mistakes, long-unseen and new items come up more; mastered ones less
function weight(mod, x) {
  const s = store.stats[mod][x.id];
  let w = 1.6;
  if (s) {
    const days = Math.min((Date.now() - s.last) / 864e5, 7);
    w = (1 + 3 * s.y / (s.d + s.y + 1)) * (1 + days * 0.15) * (s.run >= 3 ? 0.5 : 1);
  }
  return mod === "element" ? w * CAT_W[x.c] : w;
}

function newRun(mod, prefs, { weak = false, only = null } = {}) {
  let items = mod === "element" ? ELEMENTS : COMPOUNDS;
  if (only) items = items.filter(x => only.includes(x.id));
  else if (weak) items = items.filter(x => isWeak(mod, x.id));
  const all = !prefs.count || weak || !!only;
  return {
    mod, items, all, total: all ? items.length : prefs.count,
    dir: prefs.dir, timer: prefs.timer, hideName: prefs.hideName,
    n: 0, answers: [], retry: [], retried: {}, recent: [], asked: new Set(), streak: 0,
    q: null, picked: undefined, left: 0, startedAt: Date.now(), secs: 0,
  };
}

// Due mistakes first, then items not asked in this test, never one of the last three
function pickItem(run) {
  const by = run.mod === "element" ? EL_BY : CP_BY;
  const fresh = run.items.filter(x => !run.asked.has(x.id));
  let i = run.retry.findIndex(r => r.due <= run.n);
  if (i < 0 && !fresh.length && run.retry.length) i = 0;
  if (i >= 0) return by[run.retry.splice(i, 1)[0].id];
  let pool = fresh.length ? fresh : run.items;
  const notRecent = pool.filter(x => !run.recent.includes(x.id));
  if (notRecent.length) pool = notRecent;
  return weighted(pool, x => weight(run.mod, x));
}

// Wrong options: up to two look-alikes from a shared family, the rest random
function distractors(c) {
  const others = COMPOUNDS.filter(x => x !== c);
  const close = shuffle(others.filter(x => x.fam.some(f => c.fam.includes(f)))).slice(0, 2);
  const rest = shuffle(others.filter(x => !close.includes(x))).slice(0, 3 - close.length);
  return [...close, ...rest];
}

function makeQ(run) {
  const it = pickItem(run);
  if (run.mod === "element") {
    return { mod: "element", id: it.id, item: it, answer: it.c, opts: CAT_ORDER.map(c => ({ id: c, text: CATS[c] })) };
  }
  const dir = run.dir === "mix" ? (Math.random() < 0.5 ? "f2n" : "n2f") : run.dir;
  const opts = shuffle([it, ...distractors(it)]).map(x => ({ id: x.id, text: dir === "f2n" ? x.n : x.f }));
  return { mod: "bilesik", id: it.id, item: it, dir, answer: it.id, opts };
}

// Wrong answers come back three questions later; in "all" tests they add a question
function noteMistake(run) {
  const id = run.q.id;
  if ((run.retried[id] || 0) >= MAX_RETRY) return;
  run.retried[id] = (run.retried[id] || 0) + 1;
  run.retry.push({ id, due: run.n + 3 });
  if (run.all) run.total++;
}

// Labels for the result list
const askLabel = q => q.mod === "element" ? `${q.item.s} · ${q.item.n}` : q.dir === "f2n" ? fx(q.item.f) : q.item.n;
const optLabel = (q, id) => id == null ? T.noAnswer : q.mod === "element" ? CATS[id] : q.dir === "f2n" ? CP_BY[id].n : fx(CP_BY[id].f);
