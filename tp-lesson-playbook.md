# Turner Page — Lesson Authoring Playbook

A repeatable recipe for producing lessons that match the established Turner Page
standard (scenario-first, evidence-based, no padding) without re-deriving the
approach from scratch each time.

**Scope: Core and DML.** Both teach judgement through scenario reasoning, which
is why they share this ten-block shape. DMC teaches hands-on craft instead, and
follows its own "Teach → Worked example → Build the artefact → Work through →
Do" framework — documented separately, not a variant of this one. Building a
DMC lesson against this playbook, or a Core/DML lesson against DMC's framework,
is a category error, not a style choice.

## 1. Content architecture — the ten-block shape

Every lesson follows the same skeleton. Not every lesson needs all ten, but
deviating should be a deliberate choice, not a shortcut.

1. **Opening scenario (`mcq`)** — a specific, named scenario grounded in the
   Bramwell case (or, for a From the Field aside, a comparable named
   practitioner scenario). Ends on an "instinctive response" question with 4
   options, each with real feedback (not just right/wrong). Give the scenario
   a clear position in time — "three weeks into build," "four days before
   go-live," "Week 10 of a twelve-week programme" — so the learner feels the
   pressure of *when* this is happening. A literal clock-time ("It's 4pm on
   Wednesday") is one way to do that, not the only way — across DML1's eight
   lessons, only one actually uses a clock-time; the rest use relative
   programme-time framing just as effectively. Don't force a specific
   timestamp where it doesn't earn its place.
2. **"What happens next" (`content`)** — follows the *correct* choice forward.
   Shows the reasoning and the consequence, not just the answer. This is the
   single highest-leverage block for making a lesson feel deep rather than
   quiz-like.
3. **Core concept (`content`)** — the underlying model, with a TP insight
   callout, a "common trap" (wrong belief stated first, then corrected), and a
   one-line principle box.
4. **Interactive framework** (`expandableList`, or a bespoke graphic for a
   signature moment) — 3-4 key sub-concepts, each with real specificity, not
   a dictionary definition.
5. **Build-it-yourself** — the learner constructs a real artefact (a
   scope entry, an escalation message, a RAID entry) using the *same
   specifics as the opening scenario*. This is where "confident and
   capable" gets built, not just "informed." Despite the name, this is
   usually **not** a `guidedSteps` block — see the warning immediately
   below. **`guidedSteps` is a progressive reveal, not a construction
   exercise** — the learner clicks through pre-written content one step
   at a time; nothing is asked of them. That's fine for a genuinely
   sequential walkthrough where each step depends on having seen the
   last one. It is not fine as a stand-in for "build it yourself": if the
   learner should be producing something, use `reflection` (write your
   own, then compare to a model) or `situations` (a real judgement call
   per item, answer-then-reveal) instead, and reserve `guidedSteps` for
   content that's genuinely better read in sequence than attempted
   unaided. This is not a stylistic preference: a block that tells the
   learner to "build" or "decide" something while its actual mechanism
   only lets them click through pre-written text fails the classroom
   test outright, no matter how well the prose is written — see
   `tp-html-build-guide.md`'s opening note and §11 for the standing rule
   and the QA check this implies. DML1 Lesson 1's original "build the
   Bramwell readiness picture" block is the real example that made this
   concrete: it read as an exercise but was built as `guidedSteps`, and
   was rebuilt into `situations` (five genuine judgement calls, one per
   readiness area) once the mismatch was caught.
6. **Situations (`situations`)** — 3-4 short scenarios reading an ambiguous
   moment. At least one should be genuinely hard, not a lookup.
7. **Nuance / judgement call (`content`)** — the grey area experienced DMLs
   actually navigate. No clean answer; a decision framework instead.
8. **Reflection (`reflection`)** — open-ended, tied to the learner's own
   experience, with keyword-based coaching feedback.
9. **Summary (`content`)** — a tight "if you remember nothing else" recap.
9a. **Knowledge check (`mcq` / `situations`, optional but always present)**
    — a short, ungraded, 5-8 question recall check using the existing
    quiz block types. Framed to the learner as optional-but-encouraged
    ("Test what stuck — no score, no pressure"), not a gate: it never
    blocks Continue, never affects certification, and isn't the same
    thing as a module's graded `assessment.html` (see
    `tp-html-build-guide.md` §10/§12.1 for that distinction). Its only
    job is retention — catching what didn't stick while the lesson is
    still fresh, rather than waiting until a module-end assessment days
    later. Because it reuses existing block types, it's config data added
    to every lesson's `blocks[]` array, not a new file or engine.
    **Authored automatically at build time**, generated from that
    lesson's own content the same way other `mcq`/`situations` blocks
    already are — the module author does not need to write or supply
    these questions separately.
10. **Lesson complete (`valuable`)** — captures the one takeaway, teases the
    next lesson.

## 2. Style rules (the voice)

- No generic advice. Every claim gets a concrete number, name, or example.
- TP insight = a short, specific, slightly counter-intuitive real-feeling
  anecdote — never a platitude.
- Common trap = state the wrong belief plainly first, then correct it.
- Key takeaway = one bordered box, short enough to quote back. **Don't reuse
  the same takeaway line, or a close paraphrase of it, more than once in a
  lesson.** DML1 Lesson 1 shipped with one line ("The DML owns getting the
  right decision made...") doing duty in three different blocks — a sign
  that at least two of those blocks hadn't actually been given their own
  distinct point yet, just borrowed someone else's.
- **Internal consistency is non-negotiable.** If block 5 builds an artefact
  from the block 1 scenario, every number/name/detail must match exactly.
  (We shipped a "5 years" vs "24 months" mismatch once — this is the exact
  failure mode to check for before calling a lesson done.) This extends to
  model answers: a capstone's model answer should be a fresh restatement of
  the facts, not a verbatim copy of a quote shown earlier in the same
  lesson — if the lesson tells the learner not to copy the earlier wording,
  the model answer they're compared against shouldn't hand them that exact
  wording either.
- **MCQ options need comparable length.** If the correct answer is
  noticeably longer than the three distractors, the length itself gives the
  answer away before the learner has read a word of the content. Write
  distractors with the same amount of specificity and detail as the correct
  option, not just enough words to fill a line.
- **Apply the classroom test.** Would this lesson survive being taught live,
  by a good instructor, standing in front of a room — or does it only work
  because a solo learner has nobody forcing them to pause? See the Turner
  Page alignment document for the full version of this test and its three
  common failure modes (reveal without commitment, all-signposted choices,
  even depth regardless of difficulty). It's a standing quality bar for
  every lesson built against this playbook, not a one-off note.

## 3. Technical checklist (before calling a block type "done")

- Confirm the block `type` against the actual renderer in `kit.js` before
  writing content around it — don't assume a shape:
  - `mcq`: flat `options` (strings) + parallel `feedback` (strings)
  - `situations` / `expandableList`: **`items`** array, not a custom key name
  - `expandableList` items need `title` + `short` + `detail` — the renderer
    builds the card, don't hand-roll static duplicate HTML for it
- Any bespoke interactive graphic: build scoped CSS in the lesson's own
  `<style>`, wire it via `onMount`, and read/write state through the
  **existing** block's state object (e.g. trigger the real hidden button's
  `.click()`) rather than inventing parallel state — this keeps gating logic
  correct for free.
- Bump the lesson's `storageKey` whenever block structure changes, to avoid
  stale-progress bugs when re-testing.
- Test every lesson the same way before sharing it:
  1. Extract inline `<script>` blocks, run `node --check` on each.
  2. Check tag balance (`<div>`/`</div>`, `<svg>`/`</svg>`, `<g>`/`</g>`).
  3. Playwright click-through **every block end to end**, confirm zero
     console errors and that Continue enables at each step.
  4. Re-read the finished lesson once for internal consistency (rule above).

## 4. "From the Field" audio placeholders

One real-practitioner audio moment per lesson is part of the standard, not an
optional extra — usually slotted into the nuance/judgement-call block (#7),
where a real anecdote lands hardest. Since scripts get written now and
recorded later (ElevenLabs or similar), every placeholder must:

- Use `TPKit.fromField({...})` exactly as built — title, a named persona,
  role, project, and `src` pointing to the eventual file
  (`assets/audio/lessonN-fromfield-<name>.mp3`).
- Set `reflection` to a **short discussion question for the learner** — e.g.
  "Would you have recommended Go before working through all five readiness
  areas?" — not the anecdote's full script. The script itself lives only in
  the eventual audio recording. (An earlier version of this playbook said
  the opposite; every shipped Core, DMC and DML lesson actually does it this
  way, so that's the standard to follow.)
- Be wrapped in a clearly-flagged `.to-record` banner (dashed border, amber
  "PLACEHOLDER" label) so it can never accidentally go live unrecorded. This
  is **not automatic** — the shared kit has no built-in `.to-record` styling,
  so it needs its own scoped CSS in the lesson file, the same way any other
  bespoke visual element does (see `tp-html-build-guide.md` §9). DML1
  Lessons 5-8 do this correctly; Lessons 1-4 don't have it at all — a gap
  worth closing, not a pattern to copy.
- Use a fictional or composite persona, never a real named individual who
  hasn't actually agreed to it — the anecdote should read as authentic and
  specific, but the name attached to it must be one we're free to voice.
- **The reserved cast has two sub-groups, not one, and they don't mix.**
  Zoe, Isabel and Darren are established as Data Migration Leads — DML's
  cast. Priya, Marcus, Sam, Farah, Owen, Nadia and Elena are established as
  Data Migration Consultants — Core and DMC's cast. A DML lesson reaching
  for one of the seven Consultant names (even with the role field "corrected"
  to say Lead) collides with an already-established character; this is
  exactly what went wrong when DML1 was first built, and the fix was to
  re-cast those spots, not relabel them. See `tp-html-build-guide.md` §5 for
  the full registry. DML1 Lesson 1 is a deliberate exception to "one persona
  per lesson" — it introduces all three of the Lead-cast names at once, by
  design, as the module's opening lesson. Every other DML lesson gets
  exactly one.

Once a clip is recorded: swap the `src` to the real file, and remove that
lesson's `.to-record` wrapper (and the shared placeholder `<style>` block,
once no lesson still needs it).

## 5. Lesson-by-lesson planning lives in the alignment document

This playbook is the reusable recipe — it shouldn't also carry a specific
module's lesson-by-lesson plan, which goes stale the moment that module is
actually built (an earlier version of this section did exactly that, and was
wrong about DML1's own Lessons 5-8 by the time they existed). Current status
and lesson-by-lesson detail for every Core, DMC and DML module lives in the
Turner Page alignment document instead, alongside the lifecycle mapping and
methodology it's already tracking — check there before planning a new
module's lessons, and update it once they're built, rather than duplicating
that plan here.
