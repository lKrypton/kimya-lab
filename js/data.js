"use strict";
// Compounds: formula, common name, look-alike families (used for wrong options and hints)
const COMPOUNDS = [
  ["H2O", "Su", "su"],
  ["HCl", "Tuz ruhu", "ruh tuz klor asit"],
  ["H2SO4", "Zaç yağı", "so4 asit"],
  ["HNO3", "Kezzap", "no3 azot asit"],
  ["CH3COOH", "Sirke ruhu", "cooh ruh asit"],
  ["NH3", "Amonyak", "azot baz"],
  ["NaCl", "Sofra tuzu", "tuz klor"],
  ["KOH", "Potas kostik", "kostik baz"],
  ["NaOH", "Sud kostik", "kostik baz"],
  ["NaHCO3", "Yemek sodası", "soda"],
  ["Na2CO3", "Çamaşır sodası", "soda camasir"],
  ["CaCO3", "Kireç taşı", "kirec tas"],
  ["CaO", "Sönmemiş kireç", "kirec"],
  ["Ca(OH)2", "Sönmüş kireç", "kirec baz"],
  ["HCOOH", "Karınca asidi", "cooh asit"],
  ["KNO3", "Güherçile", "no3 azot"],
  ["CuSO4", "Göztaşı", "so4 tas"],
  ["FeSO4", "Kıbrıs taşı", "so4 tas"],
  ["NaClO", "Çamaşır suyu", "camasir su klor"],
].map(([f, n, fam]) => ({ id: f, f, n, fam: fam.split(" ") }));

// Family names shown on the study list, in this order
const FAM_NAMES = {
  kirec: "Kireç üçlüsü", so4: "SO₄ ailesi", soda: "Sodalar", kostik: "Kostikler", ruh: "Ruhlar", cooh: "COOH asitleri",
  no3: "NO₃ ailesi", azot: "Azotlular", camasir: "Çamaşır ikilisi", tuz: "Tuz karışıklığı", su: "Su karışıklığı",
};

// Shown after a wrong answer; a compound uses its first family that has a hint
const HINTS = {
  kirec: "Kireç taşı CaCO₃ ısıtılır → sönmemiş kireç CaO; üstüne su eklenir → sönmüş kireç Ca(OH)₂.",
  so4: "SO₄ ailesi: zaç yağı H₂SO₄, göztaşı CuSO₄ (bakır), Kıbrıs taşı FeSO₄ (demir).",
  soda: "İki soda: H'li NaHCO₃ yemek sodası, H'siz Na₂CO₃ çamaşır sodası.",
  kostik: "Kostikler: Na'lı NaOH sud kostik, K'lı KOH potas kostik.",
  ruh: "İki ruh: tuz ruhu HCl, sirke ruhu CH₃COOH.",
  cooh: "COOH'lu asitler: karınca asidi HCOOH, sirke ruhu CH₃COOH.",
  no3: "NO₃ ailesi: kezzap HNO₃ bir asit, güherçile KNO₃ barutun tuzu.",
  azot: "Azotlular: amonyak NH₃, kezzap HNO₃, güherçile KNO₃.",
  camasir: "Çamaşır ikilisi: çamaşır sodası Na₂CO₃, çamaşır suyu NaClO.",
  tuz: "Sofra tuzu NaCl; tuz ruhu ise HCl, bir asit.",
  su: "Su H₂O; çamaşır suyu ise NaClO.",
};

// Elements: symbol, name, class (m metal, y yarı metal, a ametal, s soygaz), atomic number, mass
const ELEMENTS = [
  ["H", "Hidrojen", "a", 1, "1.008"], ["He", "Helyum", "s", 2, "4.003"],
  ["Li", "Lityum", "m", 3, "6.94"], ["Be", "Berilyum", "m", 4, "9.012"], ["B", "Bor", "y", 5, "10.81"],
  ["C", "Karbon", "a", 6, "12.011"], ["N", "Azot", "a", 7, "14.007"], ["O", "Oksijen", "a", 8, "15.999"],
  ["F", "Flor", "a", 9, "18.998"], ["Ne", "Neon", "s", 10, "20.180"],
  ["Na", "Sodyum", "m", 11, "22.990"], ["Mg", "Magnezyum", "m", 12, "24.305"], ["Al", "Alüminyum", "m", 13, "26.982"],
  ["Si", "Silisyum", "y", 14, "28.085"], ["P", "Fosfor", "a", 15, "30.974"], ["S", "Kükürt", "a", 16, "32.06"],
  ["Cl", "Klor", "a", 17, "35.45"], ["Ar", "Argon", "s", 18, "39.948"],
  ["K", "Potasyum", "m", 19, "39.098"], ["Ca", "Kalsiyum", "m", 20, "40.078"], ["Sc", "Skandiyum", "m", 21, "44.956"],
  ["Ti", "Titanyum", "m", 22, "47.867"], ["V", "Vanadyum", "m", 23, "50.942"], ["Cr", "Krom", "m", 24, "51.996"],
  ["Mn", "Manganez", "m", 25, "54.938"], ["Fe", "Demir", "m", 26, "55.845"], ["Co", "Kobalt", "m", 27, "58.933"],
  ["Ni", "Nikel", "m", 28, "58.693"], ["Cu", "Bakır", "m", 29, "63.546"], ["Zn", "Çinko", "m", 30, "65.38"],
  ["Ga", "Galyum", "m", 31, "69.723"], ["Ge", "Germanyum", "y", 32, "72.630"], ["As", "Arsenik", "y", 33, "74.922"],
  ["Se", "Selenyum", "a", 34, "78.971"], ["Br", "Brom", "a", 35, "79.904"], ["Kr", "Kripton", "s", 36, "83.798"],
  ["Rb", "Rubidyum", "m", 37, "85.468"], ["Sr", "Stronsiyum", "m", 38, "87.62"], ["Y", "İtriyum", "m", 39, "88.906"],
].map(([s, n, c, z, w]) => { const [p, g] = pos(z); return { id: s, s, n, c, z, w, p, g }; });

const CATS = { m: "Metal", y: "Yarı metal", a: "Ametal", s: "Soygaz" };
const CAT_ORDER = ["m", "y", "a", "s"]; // left to right, as on the periodic table
const GROUP_AB = ["", "1A", "2A", "3B", "4B", "5B", "6B", "7B", "8B", "8B", "8B", "1B", "2B", "3A", "4A", "5A", "6A", "7A", "8A"];
const SEMI_TIP = "Yarı metaller: B, Si, Ge, As. Metallerle ametaller arasındaki merdivende dururlar.";
const EL_TIPS = {
  H: "Hidrojen 1A grubunda durur ama metal değildir, ametaldir.",
  B: SEMI_TIP, Si: SEMI_TIP, Ge: SEMI_TIP, As: SEMI_TIP,
  Al: "Al ve Ga metaldir; yanlarındaki B, Si ve Ge yarı metal.",
  Ga: "Al ve Ga metaldir; yanlarındaki B, Si ve Ge yarı metal.",
  Se: "Se ametaldir; solundaki As yarı metal.",
};

const EL_BY = Object.fromEntries(ELEMENTS.map(e => [e.s, e]));
const CP_BY = Object.fromEntries(COMPOUNDS.map(c => [c.id, c]));

// Period and group for atomic numbers 1-54
function pos(z) {
  if (z <= 2) return [1, z === 1 ? 1 : 18];
  if (z <= 18) { const i = (z - 3) % 8; return [z <= 10 ? 2 : 3, i < 2 ? i + 1 : i + 11]; }
  if (z <= 36) return [4, z - 18];
  return [5, z - 36];
}

function elFamily(e) {
  if (e.s === "H") return "1A ama ametal";
  if (e.g === 1) return "Alkali metal";
  if (e.g === 2) return "Toprak alkali metal";
  if (e.g >= 3 && e.g <= 12) return "Geçiş metali";
  if (e.g === 17) return "Halojen";
  if (e.g === 18) return "Soygaz";
  return CATS[e.c];
}
const elWhere = e => `${e.z}. element · ${e.p}. periyot ${GROUP_AB[e.g]} grubu · ${elFamily(e)}`;
const cpHint = c => HINTS[c.fam.find(f => HINTS[f])] || "";

// "Ca(OH)2" -> Ca(OH)<sub>2</sub>; color tints each symbol by its class
function fx(f, color) {
  return f.replace(/([A-Z][a-z]?)|(\d+)/g, (m, el, num) =>
    el ? (color && EL_BY[el] ? `<b class="ce c-${EL_BY[el].c}">${el}</b>` : el) : `<sub>${num}</sub>`);
}
