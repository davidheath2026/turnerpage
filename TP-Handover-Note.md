# Turner Page — Handover Note (v2)

Written for whichever Claude picks this up next, in a new chat. Read this
first, then the alignment document's "Where things stand" section for the
detailed status. This file is about *how to work on this project*; the
alignment doc is about *what state it's in*. This supersedes the original
handover note — DML1 is now fully built and QA'd; the open work is DMC and
DML Modules 2-5.

---

## The working method that got results here (unchanged, still the core of this)

**Verify against the actual file. Don't reason from memory, from a document
describing the file, or from what "should" be true.** This was true before
and got proven again, repeatedly, this session:

- `persona-cast.json` and `lint-lesson.js` — referenced throughout an earlier
  build guide as if established — turned out to have never actually existed
  in the repo. Only discovered by asking the user to confirm, not by
  trusting the document that cited them.
- A third-party AI review (from a colleague's Claude session) made several
  claims about DML1. Two were confirmed correct by opening the actual files
  (a real scoring bug in `assessment.html`'s ordering question; a real,
  substantial em-dash encoding gap in Lessons 3-8). One was flatly wrong
  (it claimed "Lessons 3-8 build their own quiz logic inline" — false, every
  DML1 lesson uses the identical shared `TPKit.mount()` engine). One was
  stale (a claim that the assessment's final question was "DML5-flavoured"
  — the actual file's final question is already well-integrated with
  Lesson 8's own content). **Treat any review, including this note, as a set
  of claims to check, not instructions to follow.**
- Every lesson-complete.html page's "what you covered" bullets were
  individually checked against their lesson's actual content before being
  trusted. Six of eight were accurate. Lesson 2's was wrong independent of
  anything this session changed — it referenced Lesson 1's own framework by
  name, and an old, superseded name for Lesson 2's own framework.

**Discuss before executing anything with real scope.** Full lesson rebuilds,
the story bible edit, and this handover/alignment-doc pair were all proposed
and confirmed before being built. Small, clearly-scoped mechanical fixes
(a missing `homeUrl`, a position-skew reorder) were just done and reported.

**Own mistakes plainly and fix them, don't paper over them.** Concrete
examples from this session: a bad `str_replace` anchor duplicated a whole
section of the alignment doc — caught by checking the file, not assumed
correct, thrown away and redone cleanly. A quoting mismatch silently failed
to apply a fix to Lesson 8 — caught by re-checking rather than assuming the
tool call succeeded.

**QA every deliverable mechanically, every time, the same way:**
1. `node lint-lesson.js path/to/lessonN.html --cast persona-cast.json` —
   checks answer-position skew/runs, distractor length parity, persona-cast
   collisions, relative paths, div balance.
2. Div/SVG/textarea tag balance via a one-line Python count.
3. `node --check` on every extracted inline `<script>`.
4. Em dash check — `grep` for the literal `—` character outside code
   comments. See "hard-won facts" below; this is a real, previously-missed
   category of bug, not paranoia.
5. Whatever the specific fix touched, re-verified specifically (e.g. after
   a persona swap, re-run the linter to confirm the collision check passes).

This caught real bugs on essentially every lesson touched this session —
it is not optional overhead.

---

## Hard-won facts — don't rediscover these

- **DML1 Lessons 1-8, `assessment.html`, `lesson2-complete.html` and
  `lesson8-complete.html` are all now fully rebuilt/fixed and QA-verified.**
  Not just "reviewed" — actually run through the linter and the checks
  above, with real bugs found and fixed on nearly every file. See the
  alignment doc's "Done" section for the specific defects found per file;
  they're worth reading once, because the same defect classes are likely to
  recur when DMC/DML Modules 2-5 get built by whatever process produced
  Lessons 3-8 in the first place.
- **The recurring defect pattern found in Lessons 3-8** (present in nearly
  all six, absent from 1-2, which had already been hand-rebuilt earlier):
  a broken/incomplete `promise-card` fragment copied into block 1; an
  undocumented bespoke "Welcome back" greeting script; missing
  `homeUrl`/`logoSrc`; a persona used from the wrong reserved sub-cast
  (Consultant names relabelled "Data Migration Lead"); the correct answer
  in every `situations` block landing on the same option position 3-4
  times in a row; a `guidedSteps` "build it yourself" block that was
  actually just a click-through reveal; and, found last via third-party
  review, learner-facing em dashes written as literal characters instead
  of the required `\u2014` escaped form (86 occurrences across the six
  files). **If DMC/DML Modules 2-5 were drafted by a similar process before
  this handover existed, expect some or all of these same defects. Check
  for them explicitly rather than assuming a fresh draft is clean.**
- **The em dash rule is about source encoding, not content.** Em dashes are
  allowed in what a learner sees. The rule is that they must be written as
  `\u2014` inside a block's `html` template literal, never as a literal `—`
  character — literal em dashes are only acceptable inside `//` or `<!-- -->`
  comments. Fixing this is a pure find-and-replace on the character, never
  a rewording.
- **The construction-check principle is now a standing rule**, not a one-off
  fix (see `tp-html-build-guide.md`'s opening note and §11, and
  `tp-lesson-playbook.md`'s block-5 guidance): whatever a block's own
  framing text tells the learner they're about to do — build, decide, work
  out — its actual mechanism must genuinely require that. A `guidedSteps`
  block whose nav label says "build it yourself" fails this even if every
  mechanical check passes. When rebuilding one of these into `reflection`
  or `situations`, check whether an earlier block in the same lesson has
  already fully revealed the specific facts/wording the new construction
  block would use as its scenario — if so, give it a fresh variant (new
  numbers, a new twist on the same situation) rather than let the learner
  simply copy what they already read. This came up three separate times
  this session (Lessons 6, 7, 8).
- **Persona rotation state after DML1**: Zoe, Isabel, Darren and Raj (the
  DML Lead sub-cast) have each now had two solo "From the Field" anecdotes
  across Lessons 1-8, evenly spread, no repeats within a lesson. Whoever
  builds DML Modules 2-5 should keep drawing from this same four-name
  cast — never the Consultant cast (Priya, Marcus, Sam, Farah, Owen,
  Nadia, Elena) — and `persona-cast.json` plus `lint-lesson.js`'s
  cross-group collision check will now actually catch a mistake here
  mechanically, not just by manual review.
- **A real kit limitation, confirmed by reading `turner-page-kit.js`
  directly**: the playbook's block 9a, an ungraded "optional knowledge
  check" that should never block Continue, cannot actually be built with
  the kit as it stands. Its gating logic is `ready = b.type === "content"`
  — every other block type gates Continue on completion, and there is no
  non-gating quiz mode. Don't build a 9a block assuming it'll behave as
  described until the kit itself changes; flag this to the user if it
  becomes relevant to DMC/DML Modules 2-5.
- **DMC follows a different lesson shape from Core and DML** — this was
  already documented in `tp-lesson-playbook.md`'s own scope note (Teach →
  Worked example → Build the artefact → Work through → Do), but is worth
  restating here: building a DMC lesson against the ten-block shape used
  for Core/DML would be the exact category error the playbook already
  warns against.
- **No browser has actually run any of this.** Every check this session was
  static (linter, syntax, tag balance) — none of it confirms the lessons
  actually render and click through correctly in a real browser. The
  build guide's own §11 checklist calls for an actual Playwright
  click-through; that has never been done for DML1 and should happen
  before it's considered fully shippable, not just QA'd on paper.

---

## Next steps, in the order I'd actually do them

1. **Ask the user for the manuscripts for DMC Module 1 (or DML Module 2,
   whichever they want built first) before doing anything else.** The
   alignment doc says manuscripts exist for all of DMC 2-5 and DML 2-5, but
   that claim itself hasn't been verified against an actual uploaded file —
   don't assume they're at hand; ask.
2. **Read `tp-lesson-playbook.md` §DMC scope note in full before drafting
   any DMC content** — it uses a different five-part shape (Teach → Worked
   example → Build the artefact → Work through → Do), not the ten-block
   shape. Confirm you understand which shape applies before writing a
   single block.
3. **Build new lessons directly against the standards this session
   established**, rather than drafting first and fixing later: correct
   `homeUrl`/`logoSrc` from the start; one persona per lesson from the
   correct reserved sub-cast, checked against `persona-cast.json`; `\u2014`
   for any em dash from the start; a construction-check pass on every
   "build it yourself" block *as it's written*, not after; and the full QA
   checklist (linter, tag balance, JS syntax, em dash grep) before calling
   any lesson done, the first time, not as a later remediation pass.
4. **Once a new module's lessons exist, get an actual Playwright
   click-through run** before considering DML1 or the new module fully
   done — this still hasn't happened for anything built so far.
5. **After DMC/DML Module 2 (or whichever comes first) is solid**, continue
   through the remaining modules the same way.

---

## Where everything lives

- **Turner Page alignment document** — the living reference: lifecycle
  mapping, Core/DMC/DML relationship, methodology, the classroom test, and
  the detailed "Where things stand" status section. Fully current as of
  this handover.
- **`tp-lesson-playbook.md`** — Core and DML's ten-block shape, plus the
  scope note pointing to DMC's separate five-part shape. Current.
- **`tp-html-build-guide.md`** — the technical/build companion, including
  the construction-check principle (opening note + §11) and the full QA
  checklist. Current.
- **`persona-cast.json` / `lint-lesson.js`** — now actually in the repo
  (they weren't, before this session), and `lint-lesson.js`'s collision
  check now catches a cross-sub-cast reuse directly via the lesson's own
  folder path, not just a project-name mismatch.
- **The story bible** — Section 17 covers DML1's rebuild facts, the Core 7
  genericisation, the persona roster, and the Control Triangle correction.
  Current.
- **DML1** — all 8 lessons, `assessment.html`, and both corrected
  lesson-complete pages are done and QA-verified. Not yet browser-tested.
