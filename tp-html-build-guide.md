# Turner Page — HTML Authoring & Build Guide

This is the technical companion to `tp-lesson-playbook.md` (which covers
instructional design, block-type judgement calls and the ten-block shape).
This guide covers the *build* side: how a lesson file is actually put
together, kit integration, naming, deployment, and how bespoke one-off
elements are scoped safely.

One thing worth knowing up front: **`assessment.html` and
`lesson-complete.html` (§10) are a completely separate system** from the
kit-based lessons described in §1-9 — no shared kit, no `LESSON_CONFIG`,
a hand-rolled quiz engine of their own. Read §10 before assuming anything
else in this guide applies to them.

---

## 1. File structure

The site nests one level deeper than intuition suggests — **`/core/core1/`,
not `/core1/` at repo root** — corrected after the `bramwell-intro.html`
continue button didn't work against the shallower path:

```
turner-page/                          (repo root, deployed via Vercel)
├── core/
│   ├── core1/lesson1.html … lesson5.html     Core Module 1
│   └── core2/ … core7/                        Core Modules 2-7 (as built)
├── dmc/
│   └── dmc1/ … dmc5/                          DMC specialisation (future)
├── dml/
│   └── dml1/lesson1.html … lesson8.html      DML specialisation
├── shared/
│   ├── turner-page-kit.js                    the rendering engine
│   ├── turner-page-kit.css                   all styling
│   └── footer-config.js                      shared footer content
├── assets/
│   ├── turner-page-logo.png
│   ├── turner-page-monogram.png              small icon used in callouts
│   └── audio/                                 From the Field clips
├── home.html, index.html, login.html, enrol.html, welcome.html
├── lesson-complete.html, assessment.html      DML1 L1 pair (template) — every
│                                               lesson needs its own copy, see §10
├── toolkit/                                    delivery tools (Scorecard, Cue Deck, Migration Journey)
└── vercel.json                                 {"cleanUrls": true}
```

Everything under `core/core*/`, `dmc/dmc*/`, `dml/dml*/` is one directory
per module, one file per lesson, named `lessonN.html` — lowercase, no
spaces, matching
the site-wide convention (see the earlier rename of the delivery tools
from `Turner Page - Go-No-Go Scorecard.html` to `go-no-go-scorecard.html`
for why: spaces in filenames force URL-encoding, which is fragile).

**All internal asset paths are absolute** (`/shared/...`, `/assets/...`),
never relative. A lesson living two folders deep still resolves correctly
against the site root. `nextUrl` inside `LESSON_CONFIG` is the one
deliberate exception — it's same-folder-relative (`"lesson2.html"`) since
lessons in a module always sit next to each other.

`vercel.json`'s `{"cleanUrls": true}` means every `.html` file is also
reachable without its extension — `core/core1/lesson1` works the same as
`core/core1/lesson1.html`.

---

## 2. Kit integration

Every lesson file follows the same skeleton:

```html
<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Turner Page | <short lesson description></title>
  <link rel="stylesheet" href="/shared/turner-page-kit.css">
</head>
<body>
<div id="tpRoot"></div>

<script src="/shared/footer-config.js"></script>
<script src="/shared/turner-page-kit.js"></script>
<script>
  // all lesson-specific data and logic lives here
  const blocks = [ /* ... */ ];
  const LESSON_CONFIG = { /* ... */ };
  TPKit.mount(document.getElementById("tpRoot"), LESSON_CONFIG);
</script>

<script>
  // learner-name greeting snippet — see §7
</script>
</body>
</html>
```

`turner-page-kit.js` and `.css` are never edited per-lesson — they're
shared infrastructure (also used by Chetan's work), so any change to them
is a deliberate, separate decision, not something to patch as a side
effect of building one lesson. When a genuine kit-level bug is found
(see §8, the `homeUrl`/`logoSrc` default-path bug), fix it once in the
shared file and note it, rather than working around it per-lesson.

### `LESSON_CONFIG` shape

```js
const LESSON_CONFIG = {
  moduleKicker: "Core Module 1",              // small label above the module title
  moduleTitle: "Data Migration Foundations",   // shown in the sidebar
  lessonLabel: "Lesson 2: Understanding business data",
  lessonShortLabel: "Lesson 2",
  lessonTagline: "Data does not work alone",
  storageKey: "tp_core1_lesson2_v1",           // see §6 for versioning rules
  homeUrl: "/index.html",                       // always set explicitly, see §8
  logoSrc: "/assets/turner-page-logo.png",      // always set explicitly, see §8
  nextUrl: "lesson3.html",                      // relative, same folder
  finalButtonLabel: "Continue to Lesson 3",
  blocks: blocks
};
```

`TPKit.mount()` is the single entry point. It reads `blocks`, renders one
at a time into `#tpRoot`, handles the sidebar/progress chrome, and wires
Back/Continue navigation based on each block's own readiness logic.

---

## 3. Block types reference

Each entry in `blocks[]` needs `id`, `nav` (sidebar label), `title`, and
`type`. The renderer for that `type` (defined once in the shared kit)
decides what "ready" (Continue enabled) means for that block.

| Type | What it does | Readiness gate |
|---|---|---|
| `content` | Plain exposition — prose, callouts, visual cards. No grading. | Always ready |
| `mcq` | Single-select multiple choice with per-option feedback. | One option selected |
| `situations` | Several independent scenarios, each with its own options/feedback (an "answer every item" quiz). | Every item answered |
| `expandableList` | A set of items the learner clicks to reveal detail (`layout:"loop"` for a vertical list, `layout:"grid"` for cards). | Every item explored |
| `guidedSteps` | A sequence revealed one step at a time via a "Reveal next" button. | All steps revealed |
| `reflection` | Free-text response, minimum length, keyword-based coaching feedback via `checks[]`, an AI-feedback button, and a model answer. | Text meets `minLength` (and, if present, feedback has been requested) |
| `valuable` | The end-of-lesson "what's your takeaway" block — same shape as `reflection` but framed as a closing artefact. | Text meets `minLength` |
| `selectN` / `selectAll` | Pick a fixed number / all applicable options from a list, each with its own verdict. | All required selections made |
| `tradeoffTriangle` | Bespoke three-way trade-off selector (DML1-specific so far). | Selection made |

**Which type for which job** (this is the part actually worth getting
right — see `tp-lesson-playbook.md` §7-8 for the full reasoning):

- **"Build it yourself" must mean genuine construction** — `reflection`
  (write your own answer, then compare to a model) or `situations`
  (a real judgement call per item, answer-then-reveal). `guidedSteps` is
  *reading*, dressed up as building, and reads as thin no matter how good
  the prose is — reserve it for a truly sequential walkthrough where each
  step depends on having seen the last one, not for "here are five things
  to learn about, one at a time."
- **Only one `situations`-type block per lesson**, unless there's a
  specific reason for two with real teaching content between them (Lesson
  1's evidence-classification-then-separate-verdict-situations pair is
  the deliberate exception, not the default). Two `situations` blocks
  back to back reads as "mostly questions" even when each is individually
  well-built.
- **Content-only blocks are intentional**, not a gap. Roughly 4 of every
  10 blocks across DML1 and Core are pure `content` — that's what gives
  the interactive blocks room to land. Visual structure (`.visual-card`,
  callouts) is enough; they don't need click-to-reveal.
- When a fixed fact set naturally produces a lopsided answer distribution
  (e.g. "is this a dependency?" where 7 of 9 candidates are genuinely
  "yes"), don't force all of them into one repetitive quiz — present the
  full set as teaching content (nothing lost) and pick a smaller,
  genuinely varied subset for the graded interaction.

---

## 4. HTML content conventions inside a block's `html`

- **British English, no em dashes**, anywhere learner-facing. This comes
  from the source manuscripts' own authoring notes and matches the user's
  standing preference. Grep for `\u2014` (the escaped form used in JS
  template literals) and the literal `—` character before shipping —
  literal ones in `//` code comments are fine, they're not learner-facing.
- Reusable CSS classes seen in the kit stylesheet: `.lead`, `.quote`,
  `.small`, `.visual-card` + `.visual-title`, `.callout` (with
  `.tp-insight`, `.misconception` or plain), `.callout-label`,
  `.principle`, `.framework-checks` (a styled `<ul>`/`<ol>` — this is the
  default for any list, including sequences and "consequence" pairs),
  `.status-grid` + `.status-card` (label/value pairs), `.complete` +
  `.tick` (end-of-lesson state).
- **`.flow` is a rigid 3-box grid** (`grid-template-columns: 1fr auto 1fr
  auto 1fr`) — box, arrow, box, arrow, box, exactly. It only fits a
  genuine 3-step sequence. Anything longer (a 6-stage process, for
  example) needs a numbered list in a `.visual-card` instead, or
  `expandableList` if each step deserves its own explanation. Using
  `.flow` for the wrong step-count renders as an ugly, misaligned mess —
  check this before reaching for it.
- Never a raw `<table>` — the kit has no table styling. Anything
  originally tabular in the source manuscript (a comparison, a mapping,
  a two-column list) becomes a `<ul class="framework-checks">` with
  `<strong>label:</strong> value` per line, or a `.visual-card` containing
  such a list.
- `TPKit.fromField({...})` embeds a "From the Field" persona clip — see
  §5.

---

## 5. The "From the Field" persona device

A recurring cast of ten fictional practitioners, each tied to one
industry/ERP context, used **independently of whichever fictional
programme company (e.g. Bramwell Industries) is running through the
lesson content** — the two devices are deliberately separate and both
stay in use regardless of module.

Registry: `persona-cast.json` (name → `{project, group}`). **The cast has
two reserved sub-groups, and they must never mix**:

- **DML group** (Data Migration Leads — DML lessons only): Zoe
  (Manufacturing ERP), Isabel (Retail ERP), Darren (Distribution ERP),
  Raj (Food & Beverage ERP).
- **Consultant group** (Data Migration Consultants — Core and DMC
  lessons): Priya (Healthcare ERP), Marcus (Logistics ERP), Sam (Energy
  ERP), Farah (Telecoms ERP), Owen (Insurance ERP), Nadia (Public Sector
  ERP), Elena (Utilities ERP).

A DML lesson reaching for one of the seven Consultant names — even with
the role field corrected to say "Data Migration Lead" — collides with an
already-established character. This is exactly what went wrong when DML1
was first built; the fix was to re-cast those spots, not relabel them.
`lint-lesson.js` now checks this mechanically (it infers the expected
group from the lesson's own folder path and flags a cross-group reuse
directly), so this is no longer a rule that depends on a person
remembering it.

```js
${TPKit.fromField({
  title:"Twelve Rows, One Weekend Lost",
  name:"Isabel", role:"Data Migration Consultant", project:"Retail ERP",
  src:"/assets/audio/TwelveRows-Isabel.mp3",
  reflection:"Has a small, easily overlooked table ever caused a disproportionately large problem on your own project?"
})}
```

- Vary the persona used across lessons — don't default to the same one
  repeatedly. Check `persona-cast.json` for who's already been used where
  before picking.
- The `src` audio file doesn't exist yet at build time. **This is not
  automatic** — the shared kit has no built-in `.to-record` styling, so
  every lesson using `TPKit.fromField` needs its own scoped CSS for the
  dashed-border, amber "PLACEHOLDER" banner, hand-built the same way any
  other bespoke visual element is (see §9). DML1 Lessons 5-8 do this
  correctly; Lessons 1-4 don't have it at all — a gap worth closing, not
  a pattern to copy.
- Not every block needs one, and not every lesson strictly needs one —
  but check before finishing a lesson whether one has been used at all;
  a lesson with zero persona clips is a miss, not a stylistic choice.
- The linter reports which personas appear in a lesson (`node
  lint-lesson.js path/to/lessonN.html --cast persona-cast.json`) as part
  of its normal output, and fails the lesson outright on a cross-group
  reuse or a project mismatch against an already-established name.

---

## 6. Storage keys and versioning

`storageKey` (e.g. `tp_core1_lesson2_v1`) is the localStorage key under
which a learner's in-progress answers for that lesson are saved.

**Bump the version suffix whenever a block's data *shape* changes** — not
for pure prose/copy edits. The renderers store answer state keyed by
block id, and expect a specific shape (a number for `guidedSteps`, an
object for `situations`, a string for `reflection`). If a block's `type`
changes, or its item count/shape changes, a learner's old saved state for
that block id is now the *wrong shape* for the new renderer — and this
fails silently rather than throwing an error. A `guidedSteps` block reading
a leftover `situations`-shaped object will show nothing and never let
Continue enable, with no console error to explain why. Bumping the version
simply abandons old state rather than trying to migrate it — much safer
than trying to guess what a mismatched shape means.

Editing prose within a block, fixing which option is `correct`, or
tweaking feedback text does **not** need a version bump.

---

## 7. Learner-name greeting snippet

The second `<script>` block at the end of every lesson file is boilerplate,
copied unchanged between lessons:

```js
(function(){
 const learner=JSON.parse(localStorage.getItem('tpCurrentLearner')||localStorage.getItem('tpLearner')||'{}');
 if(!learner.name) return;
 const first=learner.name.split(' ')[0];
 document.querySelectorAll('[data-tp-name]').forEach(el=>el.textContent=first);
 const h1=document.querySelector('h1');
 if(h1 && !document.getElementById('tpGreeting')){
   const d=document.createElement('div');
   d.id='tpGreeting';
   d.style.cssText='margin:0 0 12px;font-size:1rem;color:#0b7f8e;font-weight:600';
   d.textContent='Welcome back, '+first+'.';
   h1.parentNode.insertBefore(d,h1);
 }
})();
```

It reads the learner's name from whichever of two localStorage keys the
login flow happens to have set, and injects a small greeting above the
first heading on the page. It's independent of the kit's own rendering
and doesn't need to know anything about the specific lesson.

---

## 8. Known kit-level details worth knowing

- `homeUrl` and `logoSrc` **must be set explicitly** in every
  `LESSON_CONFIG`, even though the shared kit now defaults to the correct
  absolute paths (`/index.html`, `/assets/turner-page-logo.png`) as of
  the fix applied during this project. Belt-and-braces: if an older
  cached copy of the kit is ever served, explicit values in the lesson
  file still protect it. (The original bug: the kit defaulted to
  *relative* paths — `index.html`, `assets/turner-page-logo.png` — which
  resolve relative to whatever subfolder the lesson sits in, breaking the
  logo and home link for every lesson in a subfolder. Fixed once in
  `turner-page-kit.js`; the per-lesson explicit values are just insurance.)
- The `reflection`/`valuable` AI-coaching score is **floored at 4 out of
  10 minimum** (`Math.max(4, ...)` in the kit's scoring logic), scaled up
  to 10 based on how many of the block's `checks[]` matched. When writing
  a `mentorFeedbackHtml(score)` threshold, compute what's actually
  reachable given the number of checks — a naive low threshold (like
  `score >= 3`) can be mathematically unreachable as a distinct tier from
  the lowest one, silently killing the "needs more work" feedback branch.
  Rough formula: with `denom` checks, the lowest non-floored score for
  matching just outside "some but not enough" is `4 + (2/denom)*6`ish —
  in practice, just check the specific numbers for the check count in
  front of you rather than reusing a threshold from a different lesson.
- `next.disabled` for a `content`-type block **cannot be gated by
  `onMount`** — the kit sets `next.disabled = !ready` immediately after
  `onMount` runs, using a `ready` value that was already fixed to `true`
  before `onMount` ever executed for `type:"content"`. If a block needs
  genuine gating on custom logic, it has to be built using a `type` whose
  own renderer returns the readiness boolean (e.g. reusing `reflection`'s
  or `situations`' existing gating rather than trying to hand-roll it via
  `onMount` on a `content` block).

---

## 9. Bespoke one-off visual elements (the `onMount` escape hatch)

For a genuinely one-off interactive visual that no generic block type
covers — DML1 Lesson 1's Turner Page Readiness Model (TRM) diagram is the
reference example — the pattern is:

1. The block's `type` is usually still `content` (or whichever type gives
   the right default readiness for that spot in the lesson).
2. A `<style>` block **scoped to that one lesson file**, not the shared
   kit CSS, defines the bespoke visual's own classes (e.g. `.trm-diagram`,
   `.pillar-node`). These class names should be specific enough not to
   collide with anything in the shared stylesheet.
3. `b.onMount(ctx)` is defined directly on that block object in the lesson
   file — no kit changes needed. It receives `{ b, i, lesson, state, save,
   next, root }` and runs after the block's own renderer, so it's the
   right place to attach event listeners, draw an SVG, or wire up
   click-driven state that the generic renderers don't support.
4. Because `next.disabled` can't be gated from `onMount` on a `content`
   block (see §8), a bespoke visual built this way is almost always
   *supplementary* — illustrative, not something Continue depends on
   answering correctly. If a bespoke interaction genuinely needs to gate
   progress, it needs to be built by extending an existing gate-capable
   `type`'s data shape instead (as was done for the Lesson 2 dependency-map
   exercise, which uses `reflection`'s existing free-text gate rather than
   a custom one).

This keeps one-off complexity contained to the single lesson file that
needs it, rather than growing the shared kit's surface area for something
that may only ever be used once.

---

## 10. `assessment.html` and `lesson-complete.html` — a separate system

Unlike every lesson file described above, **these do not use the shared
kit at all.** No `turner-page-kit.js`, no `turner-page-kit.css`, no
`TPKit.mount()`, no `LESSON_CONFIG`, no block types. Each is a fully
self-contained HTML file with its own inline `<style>` block and its own
hand-written JS engine. They happen to reuse the same brand colour
variables (`--ink`, `--deep`, `--teal`, `--aqua`, `--mist`, `--paper`,
`--line`) so they *look* consistent with the rest of the site, but that
consistency is maintained by hand, independently, in each file — there is
no shared stylesheet enforcing it.

**The pattern is one pair of files per lesson**, hand-edited per lesson
rather than driven by config: the reviewed pair is titled "Lesson 1
Certification Assessment" / "Lesson 1 Complete", and the site's earlier
file listing separately referenced a `lesson2-assessment.html`, confirming
the numbering is per-file, not a shared template with a parameter. There
is no dynamic "which lesson is this" detection anywhere in either file —
titles, takeaway bullets, reflection storage keys and navigation targets
are all hardcoded per copy. Building a new lesson's pair means duplicating
the file and hand-editing every one of those, not filling in a config
object.

### `lesson-complete.html`

- Reads the learner's name from `localStorage.tpLearner` (note: the
  kit-based lessons' own greeting snippet checks `tpCurrentLearner` first,
  falling back to `tpLearner` — this file only checks `tpLearner`, a
  small inconsistency worth knowing about, not necessarily worth "fixing"
  without checking which key the login flow actually sets).
- The lesson-summary "takeaways" are four hardcoded `<div class="takeaway">`
  lines — there's no data structure, just literal HTML per lesson.
- The end-of-lesson reflection textarea saves to a **lesson-specific,
  hardcoded localStorage key** (`tpLesson1CompletionReflection` in this
  copy) — the "1" has to be manually changed to "2", "3" etc. in each
  lesson's copy of the file. Easy to forget, and nothing would flag the
  mistake if two lessons' copies accidentally shared a key.
- Links to `lesson.html` (back) and `assessment.html` (forward) using
  **relative paths**, along with the logo (`assets/turner-page-logo.png`)
  and home link (`index.html`). This only works if the file sits directly
  alongside those targets — if this pair moves into a `core/core1/`-style
  subfolder (which is exactly where a Core module's equivalent files
  would need to live), those relative paths need to become absolute
  (`/assets/...`, `/index.html`) or be recalculated relative to the new
  location, or the logo and every navigation link silently breaks. This
  needs deliberate attention if/when Core modules get their own
  assessment/complete pair — don't just copy the DML1 files verbatim into
  a subfolder.

### `assessment.html`

A genuinely richer quiz engine than anything in the lesson kit, supporting
**four question types**, each with its own render/score/review logic
inside one big `questions[]` array in the file's own `<script>`:

| Type | Shape | Scored as |
|---|---|---|
| `single` | Standard MCQ, `correctIndex` | Correct if the selected index matches |
| `multi` | Select-all, each option has `correct:true/false` | Correct only if the selected set exactly equals the correct set (no partial credit) |
| `matching` | A fixed `roles` list (e.g. ETL Lead / Business Data Owner / Data Migration Lead / Steering Committee); each `situations[]` entry has a `correctRole` index and its own dropdown | Correct only if every situation matches its correct role — no partial credit |
| `ordering` | An `items[]` list and a `correctOrder[]` index sequence, reordered via up/down arrow buttons | Correct only if the full sequence matches exactly |

Other things worth knowing:

- Pass mark is hardcoded at `score >= 8` out of a hardcoded 10 questions
  (`const pass = score >= 8`) — not derived from question count, so if a
  future assessment has a different number of questions this needs manual
  adjustment, it won't scale automatically.
- No feedback is shown until the whole assessment is submitted — all 10
  questions must be answered (Next is disabled via `isAnswered()` until
  the current one is) before Submit becomes reachable.
- On a pass, it writes `tpAssessmentResult` to localStorage — `{score,
  passed, completedAt, certificateId}` — where `certificateId` is
  generated client-side as `TP-DML-{YYYYMMDD}-{first 6 letters of the
  learner's name, uppercased}`. This is what `certificate.html`
  presumably reads (not yet reviewed — same caveat as above, don't assume
  its structure without opening it).
- Same relative-path issue as `lesson-complete.html`: logo and every
  navigation target (`lesson-complete.html`, `lesson.html`,
  `certificate.html`) are relative, not absolute.
- The "Review your answers" screen after submission shows every question
  with the learner's answer, the correct answer, per-option mentor
  feedback, and a single `mentorTip` line — this review content is dense
  and well-written, matching the depth bar used elsewhere on the site.

### Decision: `lesson-complete.html` per lesson, `assessment.html` per module

**Superseded from an earlier pass:** this was originally decided as "every
lesson gets an assessment/complete pair." That's now revised, per the
certification-tier decision in §12.1 — assessment moves to the *module*
level, not the lesson level. The split:

- **`lesson-complete.html` stays per lesson** — end-of-lesson recap and
  reflection, no grading, no certification implications. Every lesson
  gets one.
- **`assessment.html` becomes per module** — one graded quiz covering
  everything taught across that module's lessons, not one quiz per
  lesson. A module with 5 lessons gets ONE `assessment.html`, reached
  after its final lesson's `lesson-complete.html`, not five.

This is a much smaller build than originally scoped — roughly 17 module
assessments (7 Core + 5 DMC + 5 DML) rather than one per lesson — and
matches how certificates actually get awarded (see §12.1).

**Before mass-producing from the DML1 Lesson 1 template, fix the paths
first.** That template's internal links (logo, home, and navigation
targets like `lesson.html`/`assessment.html`/`lesson-complete.html`/
`certificate.html`) are relative, which only works because the file
happens to sit at the repo root alongside its targets. Any pair built for
a module living in a subfolder (`core/core1/`, `core/core2/`, etc.) needs those
paths converted to absolute (`/assets/...`, `/index.html`, and
full-from-root paths to the sibling files) — copying the template
verbatim into a subfolder silently breaks the logo and every nav link.
Fix this once, in a corrected template, rather than re-discovering and
re-fixing it on every new pair.

**Also worth resolving before scaling up**, since both are per-lesson
hand-edits easy to get wrong across dozens of copies:
- The hardcoded lesson-number completion-reflection key in
  `lesson-complete.html` (`tpLesson1CompletionReflection` etc.) — nothing
  flags it if two lessons' copies accidentally share a key.
- The `tpLearner` vs `tpCurrentLearner` inconsistency between this pair
  and the kit-based lessons' greeting snippet.
- The DML1 Lesson 1 `assessment.html`'s `certificateId` generation
  (`TP-DML-{date}-{name}`) was written assuming a per-lesson,
  per-programme certificate. Once certificates are per-tier (§12.1), this
  logic moves out of any single module's `assessment.html` entirely and
  into the tier certificate pages instead — see §12.1.

---

## 11. QA before shipping any lesson

- **Lint**: `node lint-lesson.js path/to/lessonN.html --cast persona-cast.json`
  — checks answer-position rotation/bias, distractor-length symmetry,
  persona-cast collisions, relative-path mistakes, div balance.
- **Em dash / spelling grep**: `grep -c '\\u2014' file.html` and
  `grep -c '—' file.html` (the second should only match code comments,
  never inside a block's `html` string).
- **Div balance**: `python3 -c "html=open('f.html').read(); print(html.count('<div')-html.count('</div>'))"`
  should be `0`.
- **JS syntax**: extract each `<script>...</script>` block (the ones
  without a `src=` attribute) and run `node --check` on each.
- **Full click-through**: an automated Playwright script that repeatedly
  finds the next actionable element (an unanswered `.options` group, a
  `.guided-reveal-btn`, an `Explore` button, an empty `textarea`, an
  enabled `#analyseButton`) and acts on it, falling back to clicking
  `#next` once it's enabled, until the lesson navigates to `nextUrl`.
  Confirms zero console/page errors end to end. This needs the *real*
  `turner-page-kit.css` (a placeholder stylesheet is fine for functional
  testing but won't catch visual issues like the `.flow` misuse in §4).
- Screenshot spot-checks of anything visually novel in that lesson (a new
  grid layout, a bespoke diagram) — not every block, just what's new.

---

## 12. Decisions before scaling to 100 lessons

Made explicitly, before the bulk of the 100-lesson build, to avoid
retrofitting all of them later.

### 12.1 Certification is per tier, not per lesson or per module

Three certificates, each requiring passing every module assessment in
its scope:

| Certificate | Requires passing all assessments for |
|---|---|
| **Foundations** | The 7 Core modules |
| **DMC** | The 7 Core modules + the 5 DMC modules |
| **DML** | The 7 Core modules + the 5 DML modules |

Consequences for the build:
- `assessment.html` is per module (§10) — its job is only to record a
  pass/fail + score for that module, nothing more.
- Three standalone certificate pages (`certificate-foundations.html`,
  `certificate-dmc.html`, `certificate-dml.html`, or similar) each check
  the learner's central progress record (§12.2) for the relevant set of
  module passes, and only render/issue a certificate if every required
  module is passed.
- Certificate ID generation, and any "download/share your certificate"
  logic, lives in these three pages — not duplicated per module
  assessment as the DML1 Lesson 1 template currently does it.
- A learner could complete DMC without ever attempting DML modules, and
  vice versa — both share the Core requirement, so Core only needs to be
  passed once to count toward either.

### 12.2 A central progress record, written by every lesson and module

Rather than each lesson/module writing an isolated, private
`localStorage` key, every lesson and module assessment should also write
to one shared progress object (e.g. `tpProgress` in `localStorage` for
now, migrating to a real backend later per §12.3). Minimum shape:

```js
{
  learnerId: "...",              // ties to tpLearner/tpCurrentLearner
  lessons: {
    "core1-lesson1": { completed: true, completedAt: "..." },
    // one entry per lesson, written by lesson-complete.html
  },
  moduleAssessments: {
    "core1": { passed: true, score: 9, completedAt: "..." },
    // one entry per module, written by that module's assessment.html
  },
  certificates: {
    "foundations": { issued: true, issuedAt: "...", certificateId: "..." }
    // written once a certificate page confirms all requirements met
  }
}
```

This is what makes a learner dashboard, module-gating ("finish Core
before DML unlocks"), and the three certificate pages possible without
each one re-deriving learner state from scratch. Build this into the
shared kit now (a small `TPKit.recordProgress(...)` helper, called from
every lesson and assessment) so it's automatic going forward, rather than
something bolted on per-file later.

### 12.3 Design the progress data shape for an eventual real backend

Everything above is `localStorage` today — fine for now, but when a real
backend (accounts, database, payment) arrives, this data shouldn't need
redesigning, just relocating. Practically: keep the shape above
serialisable as plain JSON, keyed by a stable `learnerId` (not something
derived from a name, which can collide or change), with clear
lesson/module identifiers matching the file/folder naming convention
already in use (`core1-lesson1`, not free-text titles). That way, a
future migration is "read this JSON and write it to a real database
table," not "figure out what shape to invent."

### 12.4 A Bramwell Industries & persona "story bible"

Given the internal-consistency failure already hit once (a "5 years" vs
"24 months" mismatch — see `tp-lesson-playbook.md` §2), a live reference
document is needed before scaling much further:

- **Company facts**: Bramwell Industries' industry, size, systems being
  migrated, timeline, key dates/numbers referenced across lessons.
- **Persona facts**: names, roles, and projects for both the Bramwell
  cast and the separate "From the Field" cast (Zoe, Isabel, Darren,
  etc.) — who they are, what's already been said about them, so a new
  lesson doesn't accidentally contradict an earlier one.

This should be checked against when drafting a new lesson, and updated
the moment a new fact about the company or a persona is introduced — not
reconstructed from memory or by re-reading old lessons each time.

### 12.5 Cross-module navigation is a fixed, documented pattern

`nextUrl` handles lesson-to-lesson navigation within a module, but the
behaviour at a module's **last lesson** needs a single documented rule
rather than being decided ad hoc per module:

**Decided pattern**: last lesson → that lesson's `lesson-complete.html`
→ the module's `assessment.html` → on pass, either the next module's
first lesson, or (if this was the last module required for a tier) the
relevant certificate page. This should be encoded consistently across
every module boundary, not just the ones built so far.

**This is separate from the per-lesson knowledge check** (see §12.7
below) — that's a retention aid inside each lesson itself and has no
bearing on this navigation pattern or on certification.

### 12.6 Batch QA tooling, not per-file QA

The §11 checklist (lint, em-dash grep, div balance, JS syntax, full
click-through) runs per file today. Before scaling to ~100 lessons plus
~17 module assessments, wrap these into a single batch command that runs
every check across every lesson in one pass and reports failures, rather
than relying on remembering to run five separate checks by hand on each
new file. This is cheap to build now and expensive to retrofit once dozens
of lessons exist without it.

### 12.7 Per-lesson knowledge check — retention, not certification

Every lesson also ends with a short (5-8 question), ungraded, optional
knowledge check, using the kit's existing `mcq`/`situations` block types
— see `tp-lesson-playbook.md` §1, block 9a for the instructional-design
side. Technically, this is just another entry in that lesson's `blocks[]`
array, placed after the Summary block and before the final `valuable`
block — no new file, no new engine, nothing that scales per-lesson build
cost the way `assessment.html` would.

Three tiers now exist, easy to conflate, worth keeping distinct in naming
and in conversation:

| | Scope | Graded? | Counts toward certification? | Built as |
|---|---|---|---|---|
| Knowledge check | Per lesson | No | No | A block inside the lesson file |
| Module assessment | Per module | Yes | Yes | Its own `assessment.html` |
| Certificate | Per tier | N/A | N/A | Its own certificate page |
