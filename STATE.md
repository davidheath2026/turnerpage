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
  (see §3 checklist).
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
| 1 | Priya (Healthcare ERP) | Priya (Healthcare ERP) | | | |
| 2 | Marcus (Logistics ERP) | Marcus (Logistics ERP) | | | |
| 3 | Sam (Energy ERP) | Sam (Energy ERP) | | | |
| 4 | Farah (Telecoms ERP) | Farah (Telecoms ERP) | | | |
| 5 | Owen (Insurance ERP) | Owen (Insurance ERP) | | | |
| 6 | Nadia (Public Sector ERP) | Nadia (Public Sector ERP) | | | |

**Flag:** DMC1 and DMC2 used an identical persona-to-lesson-number
mapping. Not wrong (project field stays consistent per persona each
time), but deliberately vary this for DMC3 onward — pick a different
starting persona or a different order, rather than defaulting to the same
sequence a third time. Elena (Utilities ERP) has not been used yet in any
DMC module — a candidate to bring in.

### Entity-per-hands-on-exercise (main teaching content is Customer/
Bramwell throughout — this ledger is only for the "Do it yourself" /
"Independent lab" blocks)

| Lesson # | DMC1 | DMC2 | DMC3 | DMC4 | DMC5 |
|---|---|---|---|---|---|
| 1 | Supplier | Supplier (Vendor_Extract_A) | | | |
| 2 | Fixed Assets (FA-009871/DEP-07) | Product | | | |
| 3 | Supplier | Supplier | | | |
| 4 | Supplier | Supplier (S20418 classification conflict) | | | |
| 5 | generic/abstract (no named entity) | Supplier | | | |
| 6 | Product | Fixed Assets (opening scenario) + generic rounds | | | |

**Flag:** DMC1 Lesson 5's hands-on exercise has no named entity (it's a
generic "failed-run evidence pack"). Consider whether a future revision
should ground it in a specific entity, though this is lower priority than
getting DMC3 built with variety from the start. Supplier is
overrepresented relative to Product/Fixed Assets across both modules so
far — lean towards Product or Fixed Assets for DMC3's hands-on exercises
unless the lesson content specifically calls for Supplier.

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

---

## 5. Open items (flat list, not prose)

- No `assessment.html` for DMC1 or DMC2 yet.
- No browser/click-through testing has ever been performed on any lesson
  — all verification so far is static (linter, tag balance, JS syntax,
  em-dash sweep).
- DMC2 Lesson 1's dependency-map exercise uses `expandableList` as a
  substitute for a true drag/reorder interaction — kit has no
  drag/reorder block type.
- No lesson has a 9a-style ungraded knowledge check — kit's gating logic
  (`ready = b.type === "content"`) can't support a non-blocking quiz yet.
- Dozens of downloadable template files (`.xlsx`/`.sql`/`.docx`)
  referenced via `tp-download` components across both modules are
  placeholder links — none of the actual files have been built.
- Alignment document's "Where things stand" section has not been updated
  to reflect DMC1/DMC2 completion.
- `tp-lesson-playbook.md` and `tp-html-build-guide.md` don't yet document
  the entity-variety expectation or the DMC-specific shared components
  as standing rules.
- Existence of `/assets/turner-page-logo.png` and
  `/assets/turner-page-monogram.png` in the real deployed repo has never
  been confirmed — every lesson references both repeatedly.
- DMC1 Lesson 5's hands-on exercise has no named entity (generic
  "failed-run evidence pack") — lower-priority cleanup candidate.
