#!/usr/bin/env node
/* ==============================================================
   Turner Page estate harness.
   Usage: node tp-harness.js <dir> [<dir> ...] [--cast cast.json]

   Reads every lesson*.html under the directories given, extracts
   the blocks array, and reports across the whole estate rather
   than one file at a time. Companion to lint-lesson.js, which
   stays the per-file mechanical check.

   Checks map to the four things that are hard to see by eye:
     A. Is the correct answer too obvious?
     B. Is there text written for the author, not the student?
     C. Is there enough real interactivity?
     D. What can only be seen by comparing lessons?
============================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ---------- args ----------
const args = process.argv.slice(2);
const castIdx = args.indexOf("--cast");
const castPath = castIdx !== -1 ? args[castIdx + 1] : path.join(__dirname, "persona-cast.json");
const dirs = args.filter((a, i) => !a.startsWith("--") && i !== castIdx + 1);
if (!dirs.length) { console.error("Usage: node tp-harness.js <dir> [...] [--cast cast.json]"); process.exit(2); }
const knownCast = fs.existsSync(castPath) ? JSON.parse(fs.readFileSync(castPath, "utf8")) : {};

// ---------- collect files ----------
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/^lesson\d+\.html$/i.test(e.name)) out.push(p);
  }
  return out;
}
const files = dirs.flatMap(d => walk(d)).sort();

// ---------- extract ----------
function extract(file) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const content = scripts.find(s => /const\s+blocks\s*=/.test(s));
  if (!content) return { file, error: "no blocks array" };

  const personas = [];
  const stub = new Proxy({
    promiseCard: () => "",
    fromField: cfg => { personas.push(cfg); return ""; },
    mount: () => {}, icons: {}
  }, { get: (t, k) => (k in t ? t[k] : () => "") });

  const sandbox = {
    window: {}, localStorage: { getItem: () => null, setItem: () => {} },
    document: { getElementById: () => ({}), querySelector: () => null,
                querySelectorAll: () => [], addEventListener: () => {},
                createElement: () => ({ style: {} }) },
    TPKit: stub, console: { log(){}, warn(){}, error(){} }
  };
  vm.createContext(sandbox);
  try {
    vm.runInContext(content + "\n;this.__b=blocks;this.__c=typeof LESSON_CONFIG!=='undefined'?LESSON_CONFIG:null;", sandbox);
  } catch (e) { return { file, error: e.message }; }
  return { file, html, blocks: sandbox.__b || [], config: sandbox.__c || {}, personas };
}

const lessons = files.map(extract);
const ok = lessons.filter(l => !l.error);
const broken = lessons.filter(l => l.error);

// ---------- helpers ----------
const label = f => f.replace(/\\/g, "/").split("/").slice(-2).join("/").replace(".html", "");
const strip = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const GATING = new Set(["mcq", "situations", "expandableList", "guidedSteps", "reflection", "valuable", "selectN", "selectAll", "tradeoffTriangle"]);

function questions(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.type === "mcq" && Array.isArray(b.options) && b.options.length && typeof b.options[0] === "object")
      out.push({ id: b.id, title: b.title || b.id, options: b.options });
    if (b.type === "situations" && Array.isArray(b.items))
      for (const it of b.items)
        if (Array.isArray(it.options)) out.push({ id: b.id, title: it.title || b.id, options: it.options });
  }
  return out;
}

const findings = { A: [], B: [], C: [], D: [] };

// ================= A. Is the correct answer too obvious? =================
const HEDGE = /\b(because|although|unless|rather than|while|whereas|provided|if that|so that|then)\b/i;
for (const L of ok) {
  for (const q of questions(L.blocks)) {
    const c = q.options.find(o => o.correct === true);
    const d = q.options.filter(o => o.correct !== true);
    if (!c || !d.length) continue;
    const cl = (c.label || "").length, dl = d.map(o => (o.label || "").length);
    const avgD = dl.reduce((a, b) => a + b, 0) / dl.length;

    // A1 length tell
    if (cl > avgD * 1.5)
      findings.A.push(`${label(L.file)} ${q.id} "${q.title}" - correct option ${Math.round(cl / avgD * 100)}% of distractor average length`);
    // A2 reasoning-word tell: only the correct option hedges or explains
    const cH = HEDGE.test(c.label || ""), dH = d.filter(o => HEDGE.test(o.label || "")).length;
    if (cH && dH === 0)
      findings.A.push(`${label(L.file)} ${q.id} "${q.title}" - only the correct option reasons (because/although/rather than); distractors are flat assertions`);
    // A3 clause-count tell
    const cC = (c.label || "").split(",").length, dC = d.map(o => (o.label || "").split(",").length);
    if (cC >= 3 && Math.max(...dC) <= 1)
      findings.A.push(`${label(L.file)} ${q.id} "${q.title}" - correct option has ${cC} clauses, every distractor has 1`);
    // A4 feedback asymmetry: distractor feedback much thinner than correct
    const cf = strip(c.feedback).length;
    const dfs = d.map(o => strip(o.feedback).length).filter(n => n > 0);
    if (cf && dfs.length) {
      const avgF = dfs.reduce((a, b) => a + b, 0) / dfs.length;
      if (avgF && cf > avgF * 1.8)
        findings.A.push(`${label(L.file)} ${q.id} "${q.title}" - correct feedback ${cf} chars vs distractor average ${Math.round(avgF)}; distractors look written to lose`);
    }
    // A5 distractor that gives itself away
    for (const o of d)
      if (/\b(never|always|everyone|nobody|all of|completely|entirely)\b/i.test(o.label || "") && !/\bnever\b/i.test(c.label || ""))
        findings.A.push(`${label(L.file)} ${q.id} "${q.title}" - distractor uses an absolute ("${(o.label || "").match(/\b(never|always|everyone|nobody|all of|completely|entirely)\b/i)[0]}"), a common giveaway`);
  }
}

// ================= B. Author-facing text in learner content =================
const LEAK = [
  [/\bcanon(ical)?\b/i, "canon/canonical"],
  [/\btraining data\b/i, "training data"],
  [/\bdoes not (create|establish)\b/i, "does not create/establish"],
  [/\blab evidence\b/i, "lab evidence"],
  [/\bStory Bible\b/i, "Story Bible"],
  [/\bmanuscript\b/i, "manuscript"],
  [/\bsynthetic\b/i, "synthetic"],
  [/\bplaceholder\b/i, "placeholder"],
  [/\bper the (playbook|build guide|alignment)\b/i, "per the playbook/guide"],
  [/\bdo not invent\b/i, "do not invent (author instruction)"],
  [/\bTODO\b/, "TODO"],
  [/\blorem ipsum\b/i, "lorem ipsum"]
];
function learnerStrings(b) {
  const out = [];
  const push = v => { if (typeof v === "string" && v.trim()) out.push(v); };
  push(b.html); push(b.title); push(b.takeawayHtml); push(b.closingHtml);
  push(b.modelAnswerHtml); push(b.savedHtml); push(b.hint);
  (b.options || []).forEach(o => { if (typeof o === "string") push(o); else { push(o.label); push(o.feedback); } });
  (b.coaching || []).forEach(push);
  (b.items || []).forEach(i => {
    push(i.title); push(i.short); push(i.detail); push(i.ask); push(i.question);
    (i.options || []).forEach(o => { push(o.label); push(o.feedback); });
  });
  (b.steps || []).forEach(s => push(s.html));
  (b.checks || []).forEach(c => { push(c.strength); push(c.gap); });
  return out;
}
for (const L of ok) {
  for (const b of L.blocks) {
    for (const s of learnerStrings(b)) {
      const t = strip(s);
      for (const [re, name] of LEAK) {
        if (re.test(t)) {
          const m = t.match(re);
          const i = t.toLowerCase().indexOf(m[0].toLowerCase());
          findings.B.push(`${label(L.file)} ${b.id} - "${name}" in learner text: ...${t.slice(Math.max(0, i - 45), i + 55)}...`);
        }
      }
    }
    // em dash in learner-facing text
    for (const s of learnerStrings(b))
      if (/[\u2014]/.test(s)) { findings.B.push(`${label(L.file)} ${b.id} - em dash in learner text`); break; }
  }
}

// ================= C. Enough real interactivity? =================
const ACTION = /\b(build|construct|write your own|draft|decide|work it out|your turn|produce|create your)\b/i;
const shapeOf = b => b.map(x => x.type);
for (const L of ok) {
  const types = shapeOf(L.blocks);
  const total = types.length;
  const contentN = types.filter(t => t === "content").length;
  const pct = Math.round(contentN / total * 100);
  const gating = types.filter(t => GATING.has(t)).length;
  let run = 0, maxRun = 0;
  for (const t of types) { if (t === "content") { run++; maxRun = Math.max(maxRun, run); } else run = 0; }
  if (pct >= 65) findings.C.push(`${label(L.file)} - ${pct}% content blocks (${contentN}/${total}); norm is around 40%`);
  if (maxRun >= 5) findings.C.push(`${label(L.file)} - ${maxRun} content blocks in a row; learner can click straight through`);
  if (gating < 5) findings.C.push(`${label(L.file)} - only ${gating} blocks require the learner to do anything`);
  // framing promises action but the mechanism does not require it
  for (const b of L.blocks) {
    if (!["content", "guidedSteps", "expandableList"].includes(b.type)) continue;
    const t = strip(b.title) + " " + strip(b.html).slice(0, 400);
    if (ACTION.test(t))
      findings.C.push(`${label(L.file)} ${b.id} (${b.type}) - framing says "${t.match(ACTION)[0]}" but the block only reveals text`);
  }
}

// ================= D. Only visible across lessons =================
// D1 identical block-shape signatures
const sig = new Map();
for (const L of ok) {
  const counts = {};
  shapeOf(L.blocks).forEach(t => counts[t] = (counts[t] || 0) + 1);
  const key = Object.keys(counts).sort().map(k => `${counts[k]}${k}`).join("|");
  if (!sig.has(key)) sig.set(key, []);
  sig.get(key).push(label(L.file));
}
for (const [key, ls] of sig)
  if (ls.length >= 3)
    findings.D.push(`${ls.length} lessons share an identical block composition: ${ls.join(", ")}`);

// D2 repeated takeaway / principle lines
const lines = new Map();
for (const L of ok)
  for (const b of L.blocks) {
    const html = String(b.html || "") + String(b.takeawayHtml || "") + String(b.closingHtml || "");
    for (const m of html.matchAll(/<div class="principle">([\s\S]*?)<\/div>/g)) {
      const t = strip(m[1]).toLowerCase().replace(/[^a-z0-9 ]/g, "");
      if (t.length < 40) continue;
      const k = t.split(" ").slice(-14).join(" ");
      if (!lines.has(k)) lines.set(k, new Set());
      lines.get(k).add(`${label(L.file)} ${b.id}`);
    }
  }
for (const [k, where] of lines)
  if (where.size > 1)
    findings.D.push(`Takeaway line reused in ${where.size} places (${[...where].join(", ")}): "...${k}"`);

// D3 repeated question stems
const stems = new Map();
for (const L of ok)
  for (const q of questions(L.blocks)) {
    const t = strip(q.title).toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (t.length < 12) continue;
    if (!stems.has(t)) stems.set(t, []);
    stems.get(t).push(`${label(L.file)} ${q.id}`);
  }
for (const [t, where] of stems)
  if (where.length > 1) findings.D.push(`Question title "${t}" appears ${where.length}x: ${where.join(", ")}`);

// D4 fact consistency: numbers reported next to recurring tokens
const TOKENS = ["accepted", "submitted", "payment-term exception", "CustomerGroup 99", "classification conflict",
                "delivery address", "depreciation-category exception", "product-site relationship", "STD", "rejected supplier"];
const facts = new Map();
for (const L of ok) {
  const text = L.blocks.flatMap(learnerStrings).map(strip).join(" ");
  for (const tok of TOKENS) {
    const re = new RegExp("([\\d][\\d,]{1,9})\\s+(?:\\w+\\s+){0,3}?" + tok.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi");
    for (const m of text.matchAll(re)) {
      const n = m[1];
      if (!facts.has(tok)) facts.set(tok, new Map());
      const g = facts.get(tok);
      if (!g.has(n)) g.set(n, new Set());
      g.get(n).add(label(L.file));
    }
  }
}
for (const [tok, g] of facts) {
  if (g.size > 1) {
    const parts = [...g.entries()].map(([n, w]) => `${n} (${[...w].join(", ")})`);
    findings.D.push(`"${tok}" appears with ${g.size} different numbers: ${parts.join(" | ")}`);
  }
}

// D5 persona usage
const useCount = new Map();
for (const L of ok)
  for (const p of L.personas) {
    if (!useCount.has(p.name)) useCount.set(p.name, []);
    useCount.get(p.name).push(label(L.file));
    const known = knownCast[p.name];
    if (known && known.project !== p.project)
      findings.D.push(`Persona "${p.name}" used with "${p.project}" in ${label(L.file)} but cast says "${known.project}"`);
  }

// ---------- report ----------
const line = s => console.log(s);
line("");
line("=".repeat(72));
line("  TURNER PAGE ESTATE HARNESS");
line(`  ${ok.length} lessons read${broken.length ? `, ${broken.length} unreadable` : ""}`);
line("=".repeat(72));
if (broken.length) { line("\nUNREADABLE"); broken.forEach(b => line(`  x ${label(b.file)} - ${b.error}`)); }

const sections = [
  ["A. CORRECT ANSWER TOO OBVIOUS", findings.A],
  ["B. AUTHOR-FACING TEXT IN LEARNER CONTENT", findings.B],
  ["C. INTERACTIVITY", findings.C],
  ["D. ONLY VISIBLE ACROSS LESSONS", findings.D]
];
for (const [name, list] of sections) {
  const uniq = [...new Set(list)];
  line(`\n${name}  (${uniq.length})`);
  line("-".repeat(72));
  if (!uniq.length) { line("  nothing flagged"); continue; }
  uniq.slice(0, 40).forEach(f => line("  ! " + f));
  if (uniq.length > 40) line(`  ... and ${uniq.length - 40} more`);
}

line("\nLESSON SHAPE TABLE");
line("-".repeat(72));
for (const L of ok) {
  const types = shapeOf(L.blocks);
  const c = types.filter(t => t === "content").length;
  const g = types.filter(t => GATING.has(t)).length;
  const kinds = [...new Set(types.filter(t => GATING.has(t)))].sort().join(",");
  line(`  ${label(L.file).padEnd(22)} ${String(types.length).padStart(2)} blocks  ${String(Math.round(c / types.length * 100)).padStart(3)}% content  ${String(g).padStart(2)} gating  ${kinds}`);
}

line("\nPERSONA USE");
line("-".repeat(72));
[...useCount.entries()].sort().forEach(([n, w]) => line(`  ${n.padEnd(8)} ${w.length}x  ${w.join(", ")}`));

const totalFindings = sections.reduce((a, [, l]) => a + new Set(l).size, 0);
line("");
line("=".repeat(72));
line(`  ${totalFindings} findings across ${ok.length} lessons`);
line("=".repeat(72));
line("");
