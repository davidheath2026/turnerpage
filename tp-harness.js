#!/usr/bin/env node
/* ==============================================================
   Turner Page estate harness (v2).
   Usage: node tp-harness.js <dir> [<dir> ...] [--cast cast.json]
          add --full to list every instance instead of a sample

   v2: findings are scored and grouped rather than listed one per
   occurrence. Systemic issues collapse to a single line with a
   count. Only questions showing two or more independent "obvious
   answer" tells are reported. Fact checking flags minority values
   against the dominant one rather than listing every number seen.
============================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const argv = process.argv.slice(2);
const FULL = argv.includes("--full");
const castIdx = argv.indexOf("--cast");
const castPath = castIdx !== -1 ? argv[castIdx + 1] : path.join(__dirname, "persona-cast.json");
const dirs = argv.filter((a, i) => !a.startsWith("--") && i !== castIdx + 1);
if (!dirs.length) { console.error("Usage: node tp-harness.js <dir> [...] [--cast cast.json] [--full]"); process.exit(2); }
const knownCast = fs.existsSync(castPath) ? JSON.parse(fs.readFileSync(castPath, "utf8")) : {};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/^lesson\d+\.html$/i.test(e.name)) out.push(p);
  }
  return out;
}
const files = dirs.flatMap(d => walk(d)).sort();

function extract(file) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const content = scripts.find(s => /const\s+blocks\s*=/.test(s));
  if (!content) return { file, error: "no blocks array" };
  const personas = [];
  const stub = new Proxy({ promiseCard: () => "", fromField: c => { personas.push(c); return ""; }, mount: () => {}, icons: {} },
    { get: (t, k) => (k in t ? t[k] : () => "") });
  const sandbox = {
    window: {}, localStorage: { getItem: () => null, setItem: () => {} },
    document: { getElementById: () => ({}), querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, createElement: () => ({ style: {} }) },
    TPKit: stub, console: { log(){}, warn(){}, error(){} }
  };
  vm.createContext(sandbox);
  try { vm.runInContext(content + "\n;this.__b=blocks;", sandbox); }
  catch (e) { return { file, error: e.message }; }
  return { file, html, blocks: sandbox.__b || [], personas };
}

const lessons = files.map(extract);
const ok = lessons.filter(l => !l.error);
const broken = lessons.filter(l => l.error);

const lab = f => f.replace(/\\/g, "/").split("/").slice(-2).join("/").replace(".html", "");
const mod = f => lab(f).split("/")[0];
const strip = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
// Same, but marks block-level boundaries with | so a fact check cannot read a
// number out of one table cell and a noun out of the next. This was a real
// false-positive source: "Approved exclusions 5 | payment-term exceptions 214"
// scanned as "5 payment-term exceptions".
const stripCells = h => String(h || "")
  .replace(/<\/(td|th|tr|li|p|div|h[1-6]|caption|section)>/gi, " | ")
  .replace(/<(br|hr)\s*\/?>/gi, " | ")
  .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ")
  .replace(/\s+/g, " ").trim();
const GATING = new Set(["mcq","situations","expandableList","guidedSteps","reflection","valuable","selectN","selectAll","tradeoffTriangle"]);

function questions(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.type === "mcq" && Array.isArray(b.options) && b.options.length && typeof b.options[0] === "object")
      out.push({ id: b.id, title: strip(b.title) || b.id, options: b.options });
    if (b.type === "situations" && Array.isArray(b.items))
      for (const it of b.items) if (Array.isArray(it.options)) out.push({ id: b.id, title: strip(it.title) || b.id, options: it.options });
  }
  return out;
}
function learnerStrings(b) {
  const out = []; const push = v => { if (typeof v === "string" && v.trim()) out.push(v); };
  push(b.html); push(b.title); push(b.takeawayHtml); push(b.closingHtml); push(b.modelAnswerHtml); push(b.savedHtml); push(b.hint);
  (b.options || []).forEach(o => typeof o === "string" ? push(o) : (push(o.label), push(o.feedback)));
  (b.coaching || []).forEach(push);
  (b.items || []).forEach(i => { push(i.title); push(i.short); push(i.detail); push(i.ask); push(i.question);
    (i.options || []).forEach(o => { push(o.label); push(o.feedback); }); });
  (b.steps || []).forEach(s => push(s.html));
  (b.checks || []).forEach(c => { push(c.strength); push(c.gap); });
  return out;
}

const OUT = { A: [], C: [], D: [] };

/* ---------- A. Correct answer too obvious (scored, 2+ tells only) ---------- */
const HEDGE = /\b(because|although|unless|rather than|whereas|provided that|so that)\b/i;
const ABS = /\b(never|always|everyone|nobody|completely|entirely)\b/i;
for (const L of ok) {
  for (const q of questions(L.blocks)) {
    const c = q.options.find(o => o.correct === true);
    const d = q.options.filter(o => o.correct !== true);
    if (!c || d.length < 2) continue;
    const tells = [];
    const cl = (c.label || "").length;
    const avgD = d.reduce((s, o) => s + (o.label || "").length, 0) / d.length;
    if (cl > avgD * 1.6) tells.push(`${Math.round(cl / avgD * 100)}% of distractor length`);
    if (HEDGE.test(c.label || "") && !d.some(o => HEDGE.test(o.label || ""))) tells.push("only correct option reasons");
    const cC = (c.label || "").split(",").length;
    if (cC >= 3 && d.every(o => (o.label || "").split(",").length <= 1)) tells.push(`${cC} clauses vs 1`);
    const cf = strip(c.feedback).length;
    const dfs = d.map(o => strip(o.feedback).length).filter(Boolean);
    if (cf && dfs.length) {
      const avgF = dfs.reduce((a, b) => a + b, 0) / dfs.length;
      if (cf > avgF * 2) tells.push("correct feedback 2x distractors");
    }
    const absD = d.filter(o => ABS.test(o.label || "") && !ABS.test(c.label || "")).length;
    if (absD >= 2) tells.push(`${absD} distractors use absolutes`);
    if (tells.length >= 2) OUT.A.push({ score: tells.length, where: `${lab(L.file)} ${q.id}`, what: q.title.slice(0, 55), tells });
  }
}
OUT.A.sort((a, b) => b.score - a.score);

/* ---------- B. Author-facing text (grouped) ---------- */
const LEAK = [
  [/\bcanon(ical)?\b/i, "canon/canonical"],
  [/\btraining data\b/i, "training data"],
  [/\bdoes not (create|establish)\b/i, "does not create/establish"],
  [/\blab evidence\b/i, "lab evidence"],
  [/\bStory Bible\b/i, "Story Bible"],
  [/\bmanuscript\b/i, "manuscript"],
  [/\bsynthetic\b/i, "synthetic"],
  [/\bdo not invent\b/i, "do not invent (author instruction)"],
  [/\bTODO\b/, "TODO"]
];
const leakHits = new Map();
const emDash = new Map();
for (const L of ok) {
  for (const b of L.blocks) {
    const texts = learnerStrings(b);
    for (const s of texts) {
      const t = strip(s);
      for (const [re, name] of LEAK) {
        const m = t.match(re);
        if (!m) continue;
        const i = t.toLowerCase().indexOf(m[0].toLowerCase());
        if (!leakHits.has(name)) leakHits.set(name, []);
        leakHits.get(name).push({ where: `${lab(L.file)} ${b.id}`, snippet: t.slice(Math.max(0, i - 40), i + 50) });
      }
    }
    if (texts.some(s => /[\u2014]/.test(s))) emDash.set(mod(L.file), (emDash.get(mod(L.file)) || 0) + 1);
  }
}

/* ---------- C. Interactivity ---------- */
const ACTION = /\b(you (will|must|should|now) (build|write|draft|produce|decide|construct)|build (your|the|it) |write your own|draft your|your turn|now build|produce (your|the) )/i;
for (const L of ok) {
  const types = L.blocks.map(b => b.type);
  const n = types.length;
  const contentN = types.filter(t => t === "content").length;
  const pct = Math.round(contentN / n * 100);
  const gating = types.filter(t => GATING.has(t)).length;
  let run = 0, maxRun = 0;
  for (const t of types) { if (t === "content") { run++; maxRun = Math.max(maxRun, run); } else run = 0; }
  const flags = [];
  if (pct >= 68) flags.push(`${pct}% content`);
  if (maxRun >= 7) flags.push(`${maxRun} content blocks in a row`);
  if (gating <= 6) flags.push(`only ${gating} gating blocks`);
  const mismatched = L.blocks.filter(b => ["content", "guidedSteps", "expandableList"].includes(b.type)
    && ACTION.test(strip(b.title) + " " + strip(b.html).slice(0, 500))
    && !/textarea/i.test(String(b.html || "")));
  if (mismatched.length) flags.push(`${mismatched.length} block(s) promise construction but only reveal text (${mismatched.map(b => b.id).join(", ")})`);
  if (flags.length) OUT.C.push({ where: lab(L.file), flags });
}

/* ---------- D. Cross-lesson ---------- */
const sig = new Map();
for (const L of ok) {
  const counts = {};
  L.blocks.forEach(b => counts[b.type] = (counts[b.type] || 0) + 1);
  const key = Object.keys(counts).sort().map(k => `${counts[k]}${k}`).join("|");
  if (!sig.has(key)) sig.set(key, []);
  sig.get(key).push(lab(L.file));
}
for (const [, ls] of sig) if (ls.length >= 3) OUT.D.push(`${ls.length} lessons share an identical block composition: ${ls.join(", ")}`);

const lines = new Map();
for (const L of ok) for (const b of L.blocks) {
  const html = String(b.html || "") + String(b.takeawayHtml || "") + String(b.closingHtml || "");
  for (const m of html.matchAll(/<div class="principle">([\s\S]*?)<\/div>/g)) {
    const t = strip(m[1]).toLowerCase().replace(/[^a-z0-9 ]/g, "");
    if (t.length < 50) continue;
    const k = t.split(" ").slice(-14).join(" ");
    if (!lines.has(k)) lines.set(k, new Set());
    lines.get(k).add(`${lab(L.file)} ${b.id}`);
  }
}
for (const [k, w] of lines) if (w.size > 1) OUT.D.push(`Takeaway reused in ${w.size} places (${[...w].join(", ")}): "...${k.slice(-65)}"`);

const stems = new Map();
for (const L of ok) for (const q of questions(L.blocks)) {
  const t = q.title.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (t.length < 14) continue;
  if (!stems.has(t)) stems.set(t, []);
  stems.get(t).push(`${lab(L.file)} ${q.id}`);
}
for (const [t, w] of stems) if (w.length > 1) OUT.D.push(`Question title "${t.slice(0, 45)}" appears ${w.length}x: ${w.join(", ")}`);

const TOKENS = ["payment-term exception", "CustomerGroup 99", "classification conflict", "rejected supplier",
  "depreciation-category exception", "product-site relationship", "accepted record", "active asset",
  "German customer record", "unresolved record"];
for (const tok of TOKENS) {
  const esc = tok.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp("(\\d[\\d,]{0,8})\\s+(?:[a-z]+\\s)?" + esc + "s?\\b", "gi");
  const vals = new Map();
  for (const L of ok) {
    const segments = L.blocks.flatMap(learnerStrings).map(stripCells).join(" | ").split("|");
    for (const seg of segments) {
      for (const m of seg.matchAll(re)) {
        const v = m[1].replace(/,$/, "");
        if (!/^\d/.test(v) || v.length > 8) continue;
        if (!vals.has(v)) vals.set(v, new Set());
        vals.get(v).add(lab(L.file));
      }
    }
  }
  if (vals.size < 2) continue;
  const ranked = [...vals.entries()].sort((a, b) => b[1].size - a[1].size);
  const [domV, domW] = ranked[0];
  for (const [v, w] of ranked.slice(1))
    if (w.size < domW.size) OUT.D.push(`"${tok}": ${domV} in ${domW.size} lessons, but ${v} in ${[...w].join(", ")}`);
}

const useCount = new Map();
for (const L of ok) for (const p of L.personas) {
  if (!useCount.has(p.name)) useCount.set(p.name, []);
  useCount.get(p.name).push(lab(L.file));
  const known = knownCast[p.name];
  if (known && known.project !== p.project)
    OUT.D.push(`Persona "${p.name}" used with "${p.project}" in ${lab(L.file)} but cast says "${known.project}"`);
}

/* ---------- report ---------- */
const P = console.log;
P("");
P("=".repeat(74));
P("  TURNER PAGE ESTATE HARNESS");
P(`  ${ok.length} lessons${broken.length ? `, ${broken.length} unreadable` : ""}`);
P("=".repeat(74));
if (broken.length) { P("\nUNREADABLE"); broken.forEach(b => P(`  x ${lab(b.file)} - ${b.error}`)); }

P(`\nA. CORRECT ANSWER TOO OBVIOUS  -  ${OUT.A.length} questions with 2 or more tells`);
P("-".repeat(74));
if (!OUT.A.length) P("  nothing flagged");
(FULL ? OUT.A : OUT.A.slice(0, 12)).forEach(f =>
  P(`  [${f.score}] ${f.where.padEnd(17)} ${f.what}\n        ${f.tells.join("; ")}`));
if (!FULL && OUT.A.length > 12) P(`  ... ${OUT.A.length - 12} more (run with --full)`);

P(`\nB. AUTHOR-FACING TEXT IN LEARNER CONTENT`);
P("-".repeat(74));
if (emDash.size) P(`  Em dashes in learner text  -  ${[...emDash.entries()].sort().map(([m, n]) => `${m}: ${n} blocks`).join(", ")}`);
if (!leakHits.size && !emDash.size) P("  nothing flagged");
for (const [name, hits] of [...leakHits.entries()].sort((a, b) => b[1].length - a[1].length)) {
  P(`  "${name}"  -  ${hits.length} occurrence(s) in ${new Set(hits.map(h => h.where.split(" ")[0])).size} lesson(s)`);
  (FULL ? hits : hits.slice(0, 2)).forEach(h => P(`        ${h.where}: ...${h.snippet}...`));
  if (!FULL && hits.length > 2) P(`        ... ${hits.length - 2} more`);
}

P(`\nC. INTERACTIVITY  -  ${OUT.C.length} lessons flagged`);
P("-".repeat(74));
if (!OUT.C.length) P("  nothing flagged");
OUT.C.forEach(f => P(`  ${f.where.padEnd(17)} ${f.flags.join("; ")}`));

P(`\nD. ONLY VISIBLE ACROSS LESSONS  -  ${OUT.D.length}`);
P("-".repeat(74));
if (!OUT.D.length) P("  nothing flagged");
(FULL ? OUT.D : OUT.D.slice(0, 20)).forEach(f => P("  ! " + f));
if (!FULL && OUT.D.length > 20) P(`  ... ${OUT.D.length - 20} more (run with --full)`);

P("\nLESSON SHAPE TABLE");
P("-".repeat(74));
for (const L of ok) {
  const t = L.blocks.map(b => b.type);
  const c = t.filter(x => x === "content").length;
  const g = t.filter(x => GATING.has(x)).length;
  P(`  ${lab(L.file).padEnd(17)} ${String(t.length).padStart(2)} blocks  ${String(Math.round(c / t.length * 100)).padStart(3)}% content  ${String(g).padStart(2)} gating`);
}

P("\nPERSONA USE");
P("-".repeat(74));
[...useCount.entries()].sort().forEach(([n, w]) => P(`  ${n.padEnd(8)} ${w.length}x  ${w.join(", ")}`));
P("");
P("=".repeat(74));
P(`  A: ${OUT.A.length} questions   B: ${leakHits.size} phrase types   C: ${OUT.C.length} lessons   D: ${OUT.D.length} items`);
P("=".repeat(74));
P("");
