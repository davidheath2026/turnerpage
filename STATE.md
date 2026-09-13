# Turner Page — STATE.md

Read this file FIRST, before the alignment document, before anything else.
This is not narrative — it's a checklist and two ledgers. If something here
conflicts with anything else (including something said earlier in a chat),
this file wins, because this file is what's deliberately kept up to date.

Update this file every time a lesson finishes and at the end of every
module. An out-of-date STATE.md is worse than none, because it creates
false confidence — treat updating it as part of "the lesson is done," not
an optional extra.

---

## 0. Files this session needs re-uploaded — nothing here persists

None of the actual working files (built HTML, the story bible, my working
copy of the alignment doc, unzipped manuscripts) live anywhere permanent.
They exist only inside this conversation's container and are gone the
moment it ends. This file, on its own, is a process document — it is
*not* a substitute for having the source material back in front of the
next session. Re-upload, at minimum:

- **This file** (`STATE.md`) — always.
- **`Turner_Page_Core_DMC_DML_Alignment.docx`** — the alignment doc;
  §1 depends on it being checked directly, not recalled from memory.
- **`Turner_Page_Story_Bible_v3_Bramwell_Company_Profile.docx`** — the
  authoritative source for every recurring Bramwell fact (S20418,
  DEP-07/FA-009871, CustomerGroup 99, the delivery-address defect
  chain, the 18,530/18,573/18,612 population figures, and everything
  else reused across modules). Nothing in this file summarises that
  content — it's the source of record, not duplicated here.
- **`tp-lesson-playbook.md`** and **`tp-html-build-guide.md`** — the
  standing authoring rules; not yet updated with several of this
  module's lessons (see §5), so still incomplete even once re-read.
- **The already-built lesson HTML** (DMC1.zip / DMC2.zip / DMC3.zip,
  or equivalent) — needed only if the next module has to cross-
  reference exact prior wording (DMC3 does this constantly — Lessons
  1, 4, 5 and 6 all reuse the same address-defect evidence verbatim).
  If DMC4/5 don't need that level of continuity, this is optional; if
  they do and it's missing, expect me to either re-derive facts from
  memory (risky) or ask for the specific file back.
- **`shared/turner-page-kit.css`** and **`shared/turner-page-kit.js`**
  — only needed if a change to shared components is expected; not
  needed just to keep building new lessons against them.
- **Any new manuscripts** for the module about to be built (DMC4/DMC5
  not yet uploaded as of this note).

If only STATE.md and the alignment doc come back, a new session can
still follow *process* correctly, but will be working from memory (mine
or restated in chat) for every specific Bramwell fact — exactly the
kind of thing this whole file exists to stop relying on memory for.

---

## 1. Settled decisions (one line each, no re-litigating)

- Alignment doc overrules the manuscript wherever they conflict (e.g.
  module titles). Manuscript is the older source; alignment doc is the
  later, canonical one.
- `moduleTitle` in every `LESSON_CONFIG` always follows the alignment doc,
  never the manuscript's own header text.
- Every lesson gets its own `lessonN-complete.html`. `nextUrl` in
  `LESSON_CONFIG` always points to that file — never straight to the next
  lesson.
- The last lesson of a module is different: its own `nextUrl` still points
  to its own completion page as normal, but *that completion page's*
  button points to `assessment.html`, and the page gets the "module
  complete" banner variant (see DMC1/DMC2 Lesson 6 completion pages as the
  template).
- `assessment.html` is per module, not per lesson. Not yet built for any
  module — see open items.
- Persona "From the Field" clips are wrapped in a `.to-record` placeholder
  banner: lesson-scoped CSS (not shared — it's meant to come back out once
  the clip is recorded), dashed border, amber label, no em dash in the
  label text.
- Shared DMC-only components (`.tp-table`, `.tp-code`, `.tp-download`,
  `.tp-defect`) live in `shared/turner-page-kit.css` §13. The matching
  copy-to-clipboard JS behaviour lives in `shared/turner-page-kit.js` §4.
  Don't re-declare these locally in a lesson file.
- Never write provenance/disclaimer language ("lab evidence," "training
  data, not new Bramwell facts," "does not create new Bramwell canon,"
  etc.) inside an `html:` string. That reasoning belongs only in the
  file's header `/* */` comment, for whoever authors the next lesson —
  never in learner-facing text. Grep for this before calling a block done
  (see §3 checklist). **Refined after catching a subtler case in DMC3
  L1:** the word "canon"/"canonical" itself is a tell, even outside the
  exact "not new Bramwell facts" phrasing — e.g. "do not invent a larger
  canonical number" reads as an instruction to the *author*, not the
  learner. If a callout needs to teach "don't assume a bigger number than
  you've proven," write it as direct investigative advice to the learner
  instead, with no reference to canon/authoring status at all.
- Every hands-on/independent-lab exercise is checked against the entity
  ledger (§2) before drafting — don't default to Customer just because
  that's the module's main teaching entity.
- Persona assignment is checked against the persona ledger (§2) before
  drafting — don't default to repeating the exact same persona-per-lesson-
  number pattern from a previous module without a deliberate reason.
- For every graded question (mcq/situations item), the target
  correct-answer position is chosen and written down *before* any option
  text is drafted — not discovered by running the linter afterward. Design
  the whole lesson's position sequence at once (no run of 3+ same index,
  no single index over ~50% of the total).
- Distractor length is drafted to within roughly 20% of the correct
  answer's character count from the start — not fixed reactively after a
  linter warning.
- File paths are absolute from site root: `/dmc/dmc<N>/lesson<N>.html`,
  `/shared/turner-page-kit.css`, `/shared/turner-page-kit.js`,
  `/assets/downloads/...`, `/assets/audio/...`.
- Kit limitations are flagged, not silently worked around: no drag/reorder
  block type exists yet (an `expandableList` is the current substitute —
  say so in the header comment when used this way); no non-blocking/
  ungraded quiz mode exists yet (so no lesson currently has a 9a-style
  knowledge check — consistent with the DML1 precedent, not an oversight).

---

## 2. Ledgers — check these before drafting a new lesson

### Persona-per-lesson (Consultant cast: Priya, Marcus, Sam, Farah, Owen,
Nadia, Elena — never the DML Lead cast)

| Lesson # | DMC1 | DMC2 | DMC3 | DMC4 | DMC5 |
|---|---|---|---|---|---|
| 1 | Priya (Healthcare ERP) | Priya (Healthcare ERP) | Sam (Energy ERP) | Priya (Healthcare ERP) | |
| 2 | Marcus (Logistics ERP) | Marcus (Logistics ERP) | Priya (Healthcare ERP) | Farah (Telecoms ERP) | |
| 3 | Sam (Energy ERP) | Sam (Energy ERP) | Marcus (Logistics ERP) | Marcus (Logistics ERP) | |
| 4 | Farah (Telecoms ERP) | Farah (Telecoms ERP) | Elena (Utilities ERP) | Sam (Energy ERP) | |
| 5 | Owen (Insurance ERP) | Owen (Insurance ERP) | Nadia (Public Sector ERP) | Elena (Utilities ERP) | |
| 6 | Nadia (Public Sector ERP) | Nadia (Public Sector ERP) | Owen (Insurance ERP) | Owen (Insurance ERP) | |

**DMC3 complete.** Rotation for DMC3: Sam, Priya, Marcus, Elena, Nadia,
Owen — a fully different order from DMC1/DMC2's identical
Priya-Marcus-Sam-Farah-Owen-Nadia pattern. Farah is the only Consultant
persona not used anywhere in DMC3; worth bringing in early for DMC4.

**DMC4 complete.** Rotation for DMC4: Priya, Farah, Marcus, Sam, Elena,
Owen — every persona named directly in its own manuscript's "From the
Field" section, so no authoring discretion was exercised. Farah does
return early (Lesson 2), as hoped above, though by manuscript choice
rather than ours. Nadia is the only Consultant persona unused in DMC4.
Across DMC1-4 every one of the seven has now appeared at least twice
except Elena (DMC3 L4, DMC4 L5).

**Correction from earlier:** persona is manuscript-specified, not an
authoring choice — every DMC3 Lesson 1 manuscript's own "From the Field"
section names Sam directly. The DMC1/DMC2 identical rotation likely
reflects the manuscript authors' own pattern, not something I chose or
can freely vary. This ledger is for tracking what's used, not a lever I
control — only exercise discretion on the rare case a manuscript leaves
the persona unspecified.

**Flag:** DMC1 and DMC2 used an identical persona-to-lesson-number
mapping. DMC3 Lesson 1 breaks it immediately (Sam at L1, not L3). Keep
watching whether DMC3 continues Priya→Marcus→Sam→Farah→Owen→Nadia in a
shifted order or something else entirely — record as it's confirmed
lesson by lesson, don't assume.

### Entity-per-hands-on-exercise (main teaching content is Customer/
Bramwell throughout — this ledger is only for the "Do it yourself" /
"Independent lab" blocks)

| Lesson # | DMC1 | DMC2 | DMC3 | DMC4 (artefact, with data object) | DMC5 |
|---|---|---|---|---|---|
| 1 | Supplier | Supplier (Vendor_Extract_A) | Sales Orders (open orders, disappearing-orders case) | Four-recipient findings pack (Customer) | |
| 2 | Fixed Assets (FA-009871/DEP-07) | Product | Supplier (312 rejected suppliers) | SME decision clinic, five decisions (Supplier/S20418, Customer) | |
| 3 | Supplier | Supplier | Product (185,000 products, 97 defects) | 45-minute workshop decision pack (Fixed Assets opener, Customer board) | |
| 4 | Supplier | Supplier (S20418 classification conflict) | Sales Orders/multi-entity graph (customers, addresses, products, sites, warehouses, orders) | Three bad-news message sequences (Product-site, Customer) | |
| 5 | generic/abstract (no named entity) | Supplier | Product (four-cycle RCA case) | Simulated project week: stand-up, handoff, Friday status (Supplier, Customer) | |
| 6 | Product | Fixed Assets (opening scenario) + generic rounds | Supplier (recovery: draft mapping, tax field, 74 partial commits) | Thursday readiness view + 8-artefact operating pack (Supplier, Product-site, Customer) | |

**DMC3 complete.** Entity spread across DMC3: Sales Orders x2, Supplier
x2, Product x2 — genuinely balanced, no entity dominates. Zero position
violations across all six DMC3 lessons after L2's one slip; the
inline-annotation discipline held for L3 through L6 without exception.

**DMC4 reads differently on purpose.** DMC4 is a communication module:
its hands-on exercises produce messages, question packs, decision
boards, update sequences and readiness views, not mappings or defect
traces. Recording only the data object would have shown Supplier and
Customer recurring and looked like over-concentration, when the
artefacts are in fact all different. So the DMC4 column records the
artefact first with the data object in brackets. The variety question
for a module like this is "did the learner build six different things?"
(yes) rather than "did they touch six different entities". Apply the
same treatment to any future module whose deliverable is communication
rather than data; keep the plain entity form for DMC5, which is
execution and cutover.

**DMC4 complete.** Zero position violations across all six lessons.
Three distractor-length warnings were caught by the linter (L1 b20-B,
L5 b20-E, L6 b16 Day 2 and Day 5) and fixed before shipping — the
up-front ~20% discipline still needs the linter as a backstop when a
correct answer has to carry four clauses.

---

## 3. Per-lesson build checklist

**Before writing:**
- [ ] Read the manuscript in full (not skimmed) before drafting any block.
- [ ] Check §2 ledgers. Assign persona and hands-on entity deliberately;
      update the ledger row for this lesson immediately (don't wait
      until the lesson is finished to remember).
- [ ] List every graded question the lesson will contain. Assign each a
      target correct-answer position as one combined sequence (including
      any mcq blocks). Verify no run of 3+ repeats and no index over ~50%
      of the total, on paper, before writing option text.

**While writing:**
- [ ] Keep provenance/synthetic-data notes in the header comment only.
- [ ] Draft distractors within ~20% of the correct answer's length as you
      write them, not after.
- [ ] Follow the settled decisions in §1 (paths, moduleTitle, persona/
      entity ledger, etc.) without re-deciding them.

**After writing (still run every check — this is cheap insurance, not
optional even with a better upfront process):**
- [ ] `node lint-lesson.js` — must pass with zero warnings, not just zero
      blocking issues.
- [ ] Tag balance (div/table/textarea/style/ol/svg as relevant).
- [ ] `node --check` on every extracted inline script.
- [ ] Em-dash sweep restricted to learner-facing text (outside `/* */`
      comments).
- [ ] Grep for banned register-leak phrases: `canon`, `training data`,
      `does not create`, `does not establish`, `lab evidence`.
- [ ] Confirm `lessonN-complete.html` exists and `nextUrl` chains
      correctly (to the completion page, not the next lesson directly).
- [ ] Update both §2 ledgers with this lesson's actual choices.

---

## 4. Module-boundary review (every ~6 lessons, at module completion)

- [ ] Re-read the full §2 ledger tables for the module just finished. Any
      accidental repetition or over-concentration (same persona order,
      same entity every time)? Note it here for the next module even if
      not worth retrofitting.
- [ ] Confirm the module's Lesson 6 completion page uses the module-final
      variant and its button correctly points to `assessment.html`.
- [ ] Update the alignment document's "Where things stand" section to
      reflect the module now being built.
- [ ] Note anything learned this module that should become a standing
      rule in `tp-lesson-playbook.md` or `tp-html-build-guide.md` (e.g.
      the entity-variety expectation, the DMC-shared CSS/JS components)
      — flag it here even if the actual doc edit happens later.

### DMC3 module-boundary review — completed

- [x] Ledgers re-read: persona rotation genuinely varied from DMC1/DMC2
      (Sam, Priya, Marcus, Elena, Nadia, Owen — a different order, and
      Elena's first DMC appearance); entity spread balanced (Sales
      Orders x2, Supplier x2, Product x2, no single entity dominating).
- [x] Lesson 6 completion page confirmed as the module-final variant,
      linking to `assessment.html`.
- [x] Alignment document (`Turner_Page_Core_DMC_DML_Alignment.docx`)
      updated directly, not just noted here: a new "Decided" bullet
      records the DMC3 title-conflict lesson; a new "Done" bullet
      summarises the full DMC1-3 build (18 lessons, 18 completion pages,
      the register-leak fixes, the entity-variety gaps found and fixed,
      DMC3's cross-lesson continuity thread, and the fact that no module
      has `assessment.html` yet). Validated (423→425 paragraphs, all
      checks passed) and visually confirmed via rendered PDF. The
      "Not started" bullet was also corrected: it previously read "DMC
      Modules 2–5", which was stale the moment DMC2 was finished — now
      reads "DMC Modules 4–5".
- [ ] `tp-lesson-playbook.md` / `tp-html-build-guide.md` — NOT yet
      edited directly. Candidates to promote, carried in §5 below:
      the entity-variety ledger discipline, the register-leak grep
      list (canon/training-data/Story Bible), and the inline
      position-annotation practice for graded-item sequences.

**The DMC3 title catch, in full:** all six DMC3 lessons initially used
the manuscripts' own module title ("Troubleshooting Data Migration
Issues") instead of the alignment doc's "Diagnosing & Fixing Defects".
This wasn't caught lesson-by-lesson — each lesson's own build checklist
included a title check, but it was checked against *memory* of the
alignment doc, not by re-opening the actual file. It was only caught by
literally re-reading the alignment doc's module-title table during this
review. **Standing rule going forward:** the per-lesson checklist's
title check must mean actually reading the alignment doc's title for
that module in this session, not recalling it — cheap to do, and this
is exactly the failure mode it exists to prevent.

### DMC4 module-boundary review — completed

- [x] Ledgers re-read. Persona rotation for DMC4 (Priya, Farah, Marcus,
      Sam, Elena, Owen) is manuscript-specified throughout, so there
      was nothing to vary; recorded rather than chosen. Entity spread
      recorded in the new artefact-first form (see §2) because the
      module's deliverables are communications, not data objects.
- [x] Lesson 6 completion page uses the module-final variant: the
      module-note banner is present and the button points to
      `assessment.html`, matching the DMC2/DMC3 Lesson 6 template.
- [ ] Alignment document NOT yet updated for DMC4. Needs: the "Not
      started" bullet corrected from "DMC Modules 4–5" to "DMC Module
      5" (it goes stale the moment DMC4 finishes, exactly as it did
      after DMC2 and DMC3), and a "Done" bullet covering the DMC4
      build. Carried into §5.
- [ ] `tp-lesson-playbook.md` / `tp-html-build-guide.md` — still NOT
      edited directly. The DMC3 candidates remain outstanding, plus
      three new ones found this module (see §5).

**The DMC4 title catch, and why the standing rule worked.** All six DMC4
manuscripts head themselves "Module 4 — Working with Clients as a Data
Migration Consultant". The alignment doc says "Communication &
Professional Practice". This is the identical failure shape to DMC3's,
and this time it was caught before a single lesson was built, by
actually opening the alignment doc's module-title table in session
rather than recalling it. The standing rule added after DMC3 is doing
its job; keep it.

**A second manuscript conflict, resolved deliberately.** DMC4 Lesson 2
§1 opens on the supplier-classification conflict (73 suppliers, S20418
Nordvik Components AS, STRATEGIC in the legacy ERP versus STANDARD in
SupplierClass.accdb) but then quotes the consultant asking "What should
CustomerGroup 99 map to?" — a leftover from the pre-revision version.
The manuscript's own authoring notes are explicit that the opening now
uses supplier evidence, so the built lesson is supplier throughout its
opening and keeps CustomerGroup 99 and 45E as the later recurring
unresolved examples. Recorded here because the next person reading that
manuscript will hit the same inconsistency.

**One kit limitation flagged, not silently worked around.** DMC4 Lesson
6's capstone asks (per its manuscript) for the learner's earlier
choices to affect later trust and readiness indicators. The kit has no
branching or cross-block state, so this is approximated by carrying
consequences forward in the feedback text: Day 5's wrong-reference
mistake is explicitly the one Day 1's orientation step would have
prevented. Same root cause as DMC2 L1's drag/reorder gap and DMC3 L4's
node-linking gap — the kit has no stateful/branching block type.

---

## 5. Open items (flat list, not prose)

- No `assessment.html` for DMC1, DMC2, DMC3 or DMC4 yet. All four
  module-final completion pages now link to a file that does not exist.
- No browser/click-through testing has ever been performed on any lesson
  — all verification so far is static (linter, tag balance, JS syntax,
  em-dash sweep).
- DMC2 Lesson 1's dependency-map exercise uses `expandableList` as a
  substitute for a true drag/reorder interaction — kit has no
  drag/reorder block type. DMC3 Lesson 4's "dependency maze" hit the
  same underlying gap (the manuscript wanted true node-connecting
  interactivity) and used `selectAll` as its substitute instead —
  a different workaround, same root cause: no graph/node-linking block
  type exists in the kit.
- No lesson has a 9a-style ungraded knowledge check — kit's gating logic
  (`ready = b.type === "content"`) can't support a non-blocking quiz yet.
- Dozens of downloadable template files (`.xlsx`/`.sql`/`.docx`)
  referenced via `tp-download` components across all three modules are
  placeholder links — none of the actual files have been built.
- `tp-lesson-playbook.md` and `tp-html-build-guide.md` don't yet document
  as standing rules: the entity-variety expectation, the DMC-specific
  shared components, the register-leak grep list (canon/training-data/
  Story Bible), or the inline position-annotation practice for graded
  sequences. The alignment doc itself has been updated directly (see §4
  above) — these two files haven't been touched yet.
- Existence of `/assets/turner-page-logo.png` and
  `/assets/turner-page-monogram.png` in the real deployed repo has never
  been confirmed — every lesson references both repeatedly.
- DMC1 Lesson 5's hands-on exercise has no named entity (generic
  "failed-run evidence pack") — lower-priority cleanup candidate.
- DMC5 manuscripts have not been uploaded yet — needed before DMC5 can
  start. (DMC4's six were uploaded and the module is now built.)
- Alignment doc not yet updated for DMC4: "Not started" still reads
  "DMC Modules 4–5" and should read "DMC Module 5"; no "Done" bullet
  for the DMC4 build yet.
- `lint-lesson.js` expects a `persona-cast.json` alongside it, which
  did not exist. Without it every lesson throws a "new persona" warning
  and the zero-warnings bar becomes meaningless. One was written this
  session with all seven Consultants and the four DML Leads, keyed by
  name with `project` and `group`. It is NOT in the repo — it lives
  only in this session's container, so re-create or re-upload it
  alongside the linter next time.
- `tp-lesson-playbook.md` §3 is WRONG about the `mcq` shape. It says
  flat `options` (strings) plus a parallel `feedback` array. The actual
  renderer in `turner-page-kit.js`, and every shipped DMC lesson, uses
  `options` as objects with `label` / `correct` / `feedback`. Checked
  against the real files rather than the playbook, but the playbook
  should be corrected before it misleads somebody.
- `tp-html-build-guide.md` §4 says "never a raw `<table>` — the kit has
  no table styling". That was true once. `.tp-table` has lived in
  `turner-page-kit.css` §13 since DMC1 and is used heavily throughout
  DMC1-4. The guide contradicts §1 of this file and should be fixed.
- DMC1-3 lesson files contain em dashes in learner-facing text
  (`\u2014` in block titles and option labels), despite the standing
  no-em-dash rule. DMC4 has zero across all twelve files. Worth a sweep
  of the earlier modules, or an explicit decision that the rule applies
  going forward only.
