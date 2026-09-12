#!/usr/bin/env node
/* ==============================================================
   Turner Page lesson linter.
   Usage: node lint-lesson.js path/to/lessonN.html [--cast cast.json]

   Extracts the lesson's `blocks` array (and persona `name`/`project`
   pairs used in TPKit.fromField calls) by running the content script
   in a sandboxed VM with stub TPKit/window objects, then checks the
   mechanical rules from the playbook's gold-standard checklist.

   Exit code 0 = pass, 1 = fail (see printed report either way).
============================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node lint-lesson.js <lesson.html> [--cast cast.json]");
  process.exit(2);
}

const castIdx = process.argv.indexOf("--cast");
const castPath = castIdx !== -1 ? process.argv[castIdx + 1] : path.join(__dirname, "persona-cast.json");
let knownCast = {};
if (fs.existsSync(castPath)) {
  knownCast = JSON.parse(fs.readFileSync(castPath, "utf8"));
}

// A lesson's folder tells us which reserved sub-cast it should be drawing
// from: anything under a dml*/ folder is DML-Lead territory, everything
// else (core*/, dmc*/) draws from the Consultant cast.
const expectedGroup = /(^|[\\/])dml\d*[\\/]/i.test(file) ? "DML" : "Consultant";

const html = fs.readFileSync(file, "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

// The content-defining script is the one that declares `const blocks =`.
const contentScript = scripts.find(s => /const\s+blocks\s*=/.test(s));
if (!contentScript) {
  console.error("Could not find a script defining `const blocks = [...]`.");
  process.exit(2);
}

// Sandbox: stub TPKit so fromField/promiseCard calls don't crash, and
// capture what fromField was called with (for persona checks) without
// needing the real engine.
const capturedPersonas = [];
const sandbox = {
  window: {},
  document: { getElementById: () => ({}) },
  TPKit: {
    promiseCard: () => "",
    fromField: (cfg) => {
      capturedPersonas.push(cfg);
      return "";
    },
    mount: () => {},
    icons: {}
  },
  console: { log: () => {}, warn: () => {}, error: () => {} }
};
vm.createContext(sandbox);

let capturedBlocks = null;
try {
  // Run the script, then pull `blocks` and `LESSON_CONFIG` out of scope
  // by wrapping in a function and returning them explicitly.
  const wrapped = contentScript + "\n;this.__blocks = blocks; this.__config = typeof LESSON_CONFIG !== 'undefined' ? LESSON_CONFIG : null;";
  vm.runInContext(wrapped, sandbox);
  capturedBlocks = sandbox.__blocks;
} catch (e) {
  console.error("FAIL: script threw while evaluating blocks —", e.message);
  process.exit(1);
}

const issues = [];
const warnings = [];

// ---- 1. Correct-answer position distribution ----
const positions = []; // in order encountered, across situations + mcq

for (const b of capturedBlocks) {
  if (b.type === "situations" && Array.isArray(b.items)) {
    for (const item of b.items) {
      if (!Array.isArray(item.options)) continue;
      const idx = item.options.findIndex(o => o.correct === true);
      if (idx === -1) {
        issues.push(`situations block "${b.id}" / "${item.title}": no option marked correct:true`);
      } else {
        positions.push({ source: `${b.id}:${item.title}`, idx });
      }
    }
  }
  if (b.type === "mcq") {
    if (typeof b._correctIndex === "number") {
      positions.push({ source: `${b.id} (mcq)`, idx: b._correctIndex });
    } else {
      warnings.push(`mcq block "${b.id}" has no _correctIndex — add one for lint coverage`);
    }
  }
}

if (positions.length >= 3) {
  // Check for >2 consecutive same index
  let run = 1;
  for (let i = 1; i < positions.length; i++) {
    if (positions[i].idx === positions[i - 1].idx) {
      run++;
      if (run > 2) {
        issues.push(`Correct-answer position repeats ${run}x in a row around ${positions[i].source} (index ${positions[i].idx})`);
      }
    } else {
      run = 1;
    }
  }
  // Check overall distribution skew
  const counts = {};
  positions.forEach(p => { counts[p.idx] = (counts[p.idx] || 0) + 1; });
  const max = Math.max(...Object.values(counts));
  if (max / positions.length > 0.5) {
    issues.push(`Correct-answer position skewed: ${JSON.stringify(counts)} across ${positions.length} questions (one position >50%)`);
  }
}

// ---- 2. Distractor length symmetry ----
for (const b of capturedBlocks) {
  if (b.type === "situations" && Array.isArray(b.items)) {
    for (const item of b.items) {
      if (!Array.isArray(item.options)) continue;
      const correctOpt = item.options.find(o => o.correct === true);
      const others = item.options.filter(o => o.correct !== true);
      if (!correctOpt || others.length === 0) continue;
      const correctLen = correctOpt.label.length;
      const avgOtherLen = others.reduce((s, o) => s + o.label.length, 0) / others.length;
      if (correctLen > avgOtherLen * 1.6) {
        warnings.push(`"${b.id}:${item.title}": correct option is notably longer than distractors (${correctLen} vs avg ${Math.round(avgOtherLen)} chars) — possible tell`);
      }
    }
  }
}

// ---- 3. Persona collision check ----
for (const cfg of capturedPersonas) {
  const name = cfg.name;
  const project = cfg.project;
  const known = knownCast[name];
  if (known) {
    if (known.project !== project) {
      issues.push(`Persona collision: "${name}" already established as "${known.project}", this lesson uses "${project}"`);
    }
    if (known.group !== expectedGroup) {
      issues.push(`Persona cast collision: "${name}" is reserved for the ${known.group} cast, but this lesson is ${expectedGroup} territory — the two reserved sub-casts must not mix`);
    }
  } else {
    warnings.push(`New persona "${name}" (${project}) not yet in persona-cast.json — add it once confirmed`);
  }
}

// ---- 4. Path checks ----
if (/(?:href|src)="shared\//.test(html) || /(?:href|src)="assets\//.test(html)) {
  issues.push("Relative shared/ or assets/ path found — should be absolute (/shared/, /assets/)");
}
if (/src:"assets\//.test(html)) {
  issues.push('Relative src:"assets/... found inside a JS object — should be src:"/assets/...');
}

// ---- 5. Tag balance ----
const divOpen = (html.match(/<div/g) || []).length;
const divClose = (html.match(/<\/div>/g) || []).length;
if (divOpen !== divClose) {
  issues.push(`<div> tag imbalance: ${divOpen} open vs ${divClose} close`);
}

// ---- Report ----
console.log(`\nLint report: ${file}`);
console.log(`Blocks found: ${capturedBlocks.length}, graded questions checked: ${positions.length}, personas: ${capturedPersonas.map(p => p.name).join(", ") || "none"}\n`);

if (issues.length === 0) {
  console.log("PASS — no blocking issues.");
} else {
  console.log(`FAIL — ${issues.length} blocking issue(s):`);
  issues.forEach(i => console.log("  ✗ " + i));
}
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s) (non-blocking):`);
  warnings.forEach(w => console.log("  ! " + w));
}
console.log("");

process.exit(issues.length ? 1 : 0);
