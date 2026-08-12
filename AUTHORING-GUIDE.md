# Turner Page Lesson Kit — Authoring Guide

This is the operating manual for producing every lesson in the course
from now on. Read it once; after that, building a lesson is mostly
copy-paste-and-edit.

## 1. The idea in one paragraph

A lesson file used to be a ~1,500-line document containing the chrome
(topbar, sidebar, progress bar), all the visual styling, the whole
interaction engine, *and* the lesson content — all tangled together.
That's why every new lesson meant re-solving problems already solved.
The kit splits this into two layers: **shared** (chrome, styling,
engine — one copy, used by every lesson) and **lesson** (just the
words, questions and data for that one lesson). A new lesson file is
now a few hundred lines of content, not code.

## 2. File structure

```
/shared/
  turner-page-kit.css     ← all visual styling. Edit once, every lesson updates.
  turner-page-kit.js      ← the engine + block-type library. Edit once, every lesson updates.
  footer-config.js        ← THE ONLY place footer/promise wording lives.
/assets/
  turner-page-logo.png
  turner-page-monogram.png
  audio/
    lesson1-5questions-signoff-zoe.mp3
    lesson2-duplicatecustomers-isabel.mp3
    ...
lesson-template.html      ← starting point for every new lesson. Copy it.
lesson1.html
lesson2.html
lesson3.html
...
lessonN-assessment.html   ← each lesson's own assessment/next-step page
```

Keep this structure the same on whatever server or CDN hosts the
course — every lesson references `shared/...` and `assets/...` with
relative paths.

## 3. Starting a new lesson (the fast path)

1. Copy `lesson-template.html` → `lessonN.html`.
2. Fill in the identity block at the top of `LESSON_CONFIG`
   (`moduleTitle`, `lessonLabel`, `lessonTagline`).
3. Set `storageKey` to `tp_lessonN_v1` and `nextUrl` to
   `lessonN-assessment.html`.
4. Work through the manuscript screen by screen. For each screen,
   pick the closest block type from the catalogue below, delete the
   ones you don't need from the template, and fill in the content.
5. Open the file in a browser and click through every screen once —
   the checklist in §7 covers what to look for.
6. Delete this comment block from the top of your config once you're
   confident with the pattern (kept in the template for new authors).

You should not need to touch `shared/turner-page-kit.js` or
`turner-page-kit.css` to build a normal lesson. If a screen genuinely
needs a bespoke visual no existing block type covers, see §6.

## 4. Block-type catalogue

Every screen in `blocks: [...]` needs `id`, `nav` (sidebar label),
`title` (H2), and `type`. What else it needs depends on `type`:

| type | Use for | Gating |
|---|---|---|
| `content` | Plain reading screens, framing, "by the end of this lesson" | none — Continue always enabled |
| `mcq` | A single scenario question, 2–4 options | any selection |
| `situations` | Several mini-scenarios in a row, each its own MCQ | all answered |
| `expandableList` | A named framework (Five Daily Questions-style); click-to-reveal cards, vertical (`layout:"loop"`) or 5-across grid (`layout:"grid"`) | all items opened (+ checkpoint, if set) |
| `tradeoffTriangle` | Three competing constraints (e.g. Scope/Time/Quality); interactive SVG corners + optional challenge MCQ | all corners explored + challenge answered |
| `guidedSteps` | A worked example the learner reveals one step at a time before attempting something harder | all steps revealed |
| `selectN` | "Pick exactly N of these" prioritisation exercise, each option with its own mentor view | exactly N selected |
| `reflection` | Free-text + microphone response with keyword-based coaching feedback; optional quick opinion pills up top | "Get AI feedback" clicked |
| `valuable` | The lesson's closing screen: completion state + short personal-commitment text + mic. **Always the last block.** | minimum length typed |

Full working examples of every type are in `lesson-template.html` —
copy the block you need from there rather than writing one from
scratch.

### A note on `mcq` / `situations` correct-answer positions

Vary which letter is correct across a lesson (don't make B correct
five times in a row) — learners notice patterns fast. There's no
enforcement of this in the kit; it's an authoring discipline.

### A note on `tradeoffTriangle`

This is the one type where the visual markup (the `<svg>`, the corner
`<g class="tri-node" data-node="...">` elements, the `.tri-detail`,
`.tri-progress` and `.tri-challenge-options` containers) lives directly
in the block's `html`, not in the data. That's deliberate — it keeps
the geometry/labels visible and editable in one place per lesson
rather than hidden behind a generic corner-count parameter. Copy the
block from the template exactly and only change the labels, ids and
`corners`/`challenge` data.

## 5. Audio clips ("From the Field")

Use `TPKit.fromField({...})` inside any block's `html` wherever a
first-person audio clip belongs:

```js
html:`<p>...</p>
${TPKit.fromField({
  title: "Before I Recommended Go",
  name: "Zoe", role: "Data Migration Lead", project: "Manufacturing ERP",
  src: "assets/audio/lesson1-5questions-signoff-zoe.mp3",
  reflection: "Would you have recommended Go before working through all five readiness areas?"
})}
<p>...</p>`
```

**Naming convention:** `assets/audio/lessonN-shortslug-firstname.mp3`.
Keep clips short (60–120 seconds), mono, and normalised to a
consistent loudness so the course doesn't feel inconsistent as
learners move between lessons.

## 6. Visual/graphics standard

- **Never use a raster placeholder or stock image.** Every diagram is
  either pure CSS/HTML (cards, timelines, comparison tables) or inline
  SVG (`tradeoffTriangle` is the reference example). This is what
  keeps the course feeling premium and keeps file sizes tiny.
- Wrap any custom diagram in `<div class="visual-card"><div
  class="visual-title">CAPTION</div>...</div>` so it inherits the
  standard card chrome automatically.
- Reuse `TPKit.icons.*` (database, refresh, shieldCheck, people,
  server, checkCircle, clock) for any small line icon rather than
  inventing a new style. If a lesson needs an icon that doesn't exist
  yet, add it to the `icons` object in `turner-page-kit.js` — that
  makes it available to every future lesson too, and keeps the visual
  language from fragmenting one lesson at a time.
- The `.tp-insight` callout (with the monogram image) is reserved for
  short, quotable "insight" lines — one or two sentences, not a full
  paragraph.
- If a screen genuinely needs a new *type* of interaction the
  catalogue doesn't cover, build it as a new renderer in
  `renderers.*` inside `turner-page-kit.js` (following the pattern of
  the existing ones) rather than writing bespoke JS inside the lesson
  file. That way the next lesson that needs something similar gets it
  for free.

## 7. Footer and "Promise" wording — the one file to edit

`shared/footer-config.js` contains exactly two strings:

```js
window.TP_FOOTER = {
  label: "The Turner Page Promise",
  text: "Helping Data Migration Leads make better decisions on real ERP projects."
};
```

- The small strip repeated at the bottom of every screen reads this.
- Any inline "Promise" callout built with `TPKit.promiseCard()` reads
  this too, so the two never drift out of sync.
- **To change the wording sitewide, edit this one file.** Nothing
  else needs to change, and no lesson file needs to be touched or
  republished.

## 8. Linking a lesson to its assessment / next step

Set two fields in `LESSON_CONFIG`:

```js
nextUrl: "lesson3-assessment.html",
finalButtonLabel: "Continue to the Lesson 3 assessment →",
```

The last block (type `valuable`) automatically sends the learner to
`nextUrl` once they've completed the closing commitment field. Keep
the `lessonN-assessment.html` naming convention consistent so the
pattern stays predictable across the whole course.

## 9. Storage keys and versioning

Each lesson has its own `localStorage` key: `tp_lessonN_v1`. If you
later make a *structural* change to a published lesson (different
blocks, different ids) rather than just fixing a typo, bump the
version suffix (`v2`) so returning learners with in-progress `v1`
state don't hit mismatched data. Small content edits (fixing a typo,
tweaking wording) don't need a version bump.

## 10. Pre-ship checklist for every lesson

- [ ] Click through every screen start to finish; confirm Continue
      only enables when it should.
- [ ] Every MCQ / situation / select-N option has real mentor
      feedback — no placeholder text left in.
- [ ] Correct-answer letters aren't always the same position.
- [ ] Any `tradeoffTriangle` or custom SVG renders correctly and all
      three corners are clickable.
- [ ] Reflection and valuable screens: microphone button works (or
      degrades gracefully in unsupported browsers) and "Get AI
      feedback" produces sensible strengths/gaps for a real answer.
- [ ] Resize to mobile width (~390px) and tablet width (~820px) and
      confirm nothing overflows or overlaps.
- [ ] `nextUrl` points to the correct, existing assessment page.
- [ ] No leftover template placeholder text (search the file for
      "REPLACE", "Option A", "Explanatory paragraph", "Headline").
- [ ] `storageKey` is unique to this lesson and versioned correctly.

## 11. What lives where — quick reference

| Want to change... | Edit this file |
|---|---|
| Footer / Promise wording (sitewide) | `shared/footer-config.js` |
| Colours, spacing, fonts, any component's look (sitewide) | `shared/turner-page-kit.css` |
| How a block type behaves (sitewide) | `shared/turner-page-kit.js` |
| A new reusable icon (sitewide) | `shared/turner-page-kit.js` → `icons` object |
| One lesson's content, questions, feedback text | `lessonN.html` only |
| Where a lesson sends the learner next | `lessonN.html` → `LESSON_CONFIG.nextUrl` |
