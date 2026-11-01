"use strict";
// Saved progress: answer counts per item, finished tests and settings
const STORE_KEY = "kimyalab.v1";
const DEFAULT_PREFS = { dir: "mix", count: 10, timer: 20, hideName: false };
const store = loadStore();

function blankStore() {
  return { stats: { bilesik: {}, element: {} }, history: [], prefs: { ...DEFAULT_PREFS } };
}

function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.stats) return { ...blankStore(), ...s, prefs: { ...DEFAULT_PREFS, ...s.prefs } };
  } catch {}
  return blankStore();
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {}
}

// d correct, y wrong, conf wrong picks, last seen time, run correct answers in a row
function stat(mod, id) {
  return store.stats[mod][id] || (store.stats[mod][id] = { d: 0, y: 0, conf: {}, last: 0, run: 0 });
}

function record(q, picked) {
  const s = stat(q.mod, q.id), ok = picked === q.answer;
  if (ok) { s.d++; s.run++; }
  else { s.y++; s.run = 0; if (picked) s.conf[picked] = (s.conf[picked] || 0) + 1; }
  s.last = Date.now();
  save();
  return ok;
}

function addHistory(entry) {
  store.history.unshift(entry);
  store.history.length = Math.min(store.history.length, 300);
  save();
}

function exportData() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(store)], { type: "application/json" }));
  a.download = `kimya-lab-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importData(text) {
  try {
    const s = JSON.parse(text);
    if (!s || !s.stats || !s.stats.bilesik || !s.stats.element) return false;
    store.stats = s.stats;
    store.history = Array.isArray(s.history) ? s.history : [];
    store.prefs = { ...DEFAULT_PREFS, ...s.prefs };
    save();
    return true;
  } catch { return false; }
}

function resetData() {
  Object.assign(store, blankStore());
  save();
}
