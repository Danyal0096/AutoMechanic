# Codex Independent Audit Contract

## 1. Purpose and authority

Audit **«مکانیک خودرو عمومی — برگرفته از آموزه‌های استاد نصیری»** as an independent technical inspector. WorkGPT has completed production and self-audit; do not act as the primary author, curriculum designer, or silent co-author.

This brief authorizes a later Codex run. It does **not** record that the audit has been performed. Begin from the final `workgpt/full-production` commit delivered in the Phase 6 bundle.

The GitHub connector remains read-only. Work locally, create a separate review branch, make reviewable local commits, and return artifacts for manual owner upload. Do not push, open a PR, create remote branches, or troubleshoot connector permissions.

## 2. Product and source of truth

- Student title: **مکانیک خودرو عمومی — برگرفته از آموزه‌های استاد نصیری**
- Audience: strong university automotive-mechanics students.
- Architecture: ten modules M01–M10, followed by one answer key, one Persian–English glossary, and consolidated references.
- Authoritative content: `index.qmd` and `content/*.qmd`.
- Internal traceability: `CONTENT_COVERAGE_MATRIX.md`, `data/m??-coverage.yml`, `data/m??-assessment.yml`, `ISSUE_LEDGER.md`.
- Canonical source index: `sources/baseContentLinks.txt`.
- Generated outputs: `_output/web/` and `_output/pdf/auto-mechanic-fa.pdf`.

Do not treat generated HTML, extracted PDF text, screenshots, or audit JSON as an alternative manuscript.

Expected WorkGPT baseline:

| Measure | Expected |
|---|---:|
| Sources | 20/20, S00–S19 |
| Mapped concepts | 196/196 Published |
| Modules | 10 |
| Web pages | 14 |
| PDF pages | 111 A4 |
| Questions / worked answers | 53 / 53 |
| Numerical sets | 13 |
| First-use term footnotes | 138 |
| Glossary entries | 124 |
| Bibliography records | 39 |
| Licensed mechanical media | 3 |
| PDF destinations | 815 |

If a baseline differs, first determine whether the delivered commit differs from the manifest. Do not update expectations merely to make a failure green.

## 3. Repository orientation

```text
index.qmd                         book introduction and reading guide
content/m01.qmd … m10.qmd        authoritative modules
content/answers.qmd               consolidated worked answers
content/glossary.qmd              generated student glossary
content/references.qmd            visible numbered bibliography
data/*-coverage.yml               source-to-anchor traceability
data/*-assessment.yml             internal question mappings
data/glossary.yml                 glossary source data
data/media.yml                    media manifest data
assets/css/                       web theme and RTL styles
assets/js/                        CVT calculator / minimal behavior
assets/fonts/                     Vazirmatn and licence
assets/media/                     three approved technical assets
filters/rtl.lua                   format-aware bidi treatment
print/preamble.tex                XePersian print contract
references/references.bib         bibliographic records
scripts/                          build, bootstrap and audits
artifacts/qa/phase5/              WorkGPT evidence; never a substitute for rerun
_output/                          delivered generated outputs
```

Read `PROJECT_SPEC.md`, `SOURCE_COMPLETENESS_REPORT.md`, `SELF_AUDIT_REPORT.md`, `MEDIA_LICENSING_SUMMARY.md`, `UNRESOLVED_ISSUES.md`, and the complete `ISSUE_LEDGER.md` before deciding whether a finding is a defect or a locked curricular choice.

## 4. Pinned stack

Preserve these versions unless a genuine blocker is demonstrated and documented:

- Quarto 1.9.38
- Pandoc 3.8.3
- XeLaTeX with TeX Live 2023 baseline
- XePersian 24.8
- Vazirmatn 33.0.3
- Node.js 20 or newer
- Playwright 1.61.1
- axe-core 4.12.1
- Chromium 149
- Firefox ESR 140.12
- qpdf and Poppler through the established bootstrap/host workflow

`scripts/bin/xelatex` is a transparent output-isolation wrapper around the host XeLaTeX path recorded in `AUTO_MECHANIC_REAL_XELATEX`. It does not replace the engine. Inspect it for portability and reproducibility rather than bypassing it casually.

A required stack change must be recorded in `ISSUE_LEDGER.md`, `CHANGELOG.md`, the audit report, and the audit delivery manifest.

## 5. Setup and commands

Use a clean clone of the delivered bundle or final repository commit.

```bash
npm ci
npm run bootstrap:tools
npm run setup:browsers
```

Development preview:

```bash
npm run dev
```

Build commands:

```bash
npm run build:web
npm run build:pdf
npm run build
```

Audit commands:

```bash
npm run test:content
npm run test:web
npm run test:pdf
npm run audit:coverage
npm test
git diff --check
```

Expected outputs:

- `_output/web/index.html`
- `_output/web/content/m01.html` through `m10.html`
- `_output/web/content/answers.html`
- `_output/web/content/glossary.html`
- `_output/web/content/references.html`
- `_output/pdf/auto-mechanic-fa.pdf`
- `artifacts/qa/phase5/{content,web,pdf}-audit.json`

PDF export is `npm run build:pdf`; do not substitute browser print for the formal artifact.

## 6. Required browser matrix

Inspect every one of the 14 pages, not only M08.

Required Chromium viewports:

| Profile | Width × height |
|---|---:|
| narrow phone | 360 × 800 |
| phone | 390 × 844 |
| tablet | 768 × 1024 |
| laptop | 1280 × 800 |
| desktop | 1440 × 900 |

Required Firefox requests: 390 × 844 and 1440 × 900. The current headless host reports 438px client width for the 390px Firefox request; record actual dimensions rather than claiming exact coverage. Add WebKit/Safari if available. If not available, report the gap without pretending it passed.

For each page/profile inspect:

- load, font, `lang=fa`, root RTL, main H1 and landmark hierarchy;
- sidebar/drawer, previous/next, TOC, search and anchors;
- no document-level horizontal overflow; tables may use a clear local scroll region on narrow screens;
- heading-to-content cohesion, short-sequence spacing and absence of eerie dead space;
- table hierarchy, row grouping, wrapping, caption proximity and bare-table appearance;
- focus visibility, keyboard order, no traps, and controls with meaningful Persian names;
- image sizing, alt, caption agreement and no layout shift that obscures content;
- print preview/print CSS with navigation and interactive UI suppressed;
- no duplicate visible module labels or production-only headings;
- every visible element improves learning, navigation, assessment, or useful reference.

WorkGPT explicitly did not grant human aesthetic approval to the web edition. Your inspection must be real and visual; do not infer it from the existing screenshots or green automation.

## 7. Critical RTL and mixed-direction fixtures

Inspect these in paragraphs, headings, tables, footnotes, equations, answer pages, glossary and references:

- `1-3-4-2`, `720°/4 = 180°`, `P/R/N/D`;
- `CVT`, `DCT`, `TCU`, `ECU`, `ABS`, `EBD`, `ESC`, `HPS`, `EHPS`, `EPS`;
- `N·m`, `kPa`, `MPa`, `mm²`, `cm³`, `rpm`, `%` and ratios such as `10.46:1`;
- arrows `←` and `→` in Persian system paths;
- parentheses and slashes adjacent to Persian prose;
- equation numbers and variables on the visually correct side;
- citation groups such as `[13–16]`, `[33]`, `[35,36]`;
- Persian question numbering and Latin formula values;
- filenames/URLs only behind readable link labels.

Required Persian visual strings include:

- `مکانیک خودرو عمومی — برگرفته از آموزه‌های استاد نصیری`
- `چرخهٔ چهارزمانه در دو دور میل‌لنگ`
- `گردانندهٔ نهایی، دیفرانسیل و معماری‌های گیربکس خودکار`
- `پاسخ‌نامهٔ تشریحی`
- `واژه‌نامهٔ فارسی–انگلیسی`

No major Persian heading may drift left from a bidi failure. No visible `AMEG n.d.`, `n.d.-a`, raw source URL, `LO-M..`, `S..-C..`, test ID, Approval Gate, or Phase label may appear in the student product.

## 8. Interaction and navigation tests

- Open search from keyboard, search Persian and English terms, follow a result, then return.
- Traverse sidebar/drawer and previous/next through all 14 pages.
- Follow representative TOC, cross-page, citation, footnote and footnote-backlink anchors.
- Operate the CVT effective-radius calculator entirely by keyboard; verify 62/46 produces approximately 0.74 under the displayed convention and use another bounded input pair.
- Disable JavaScript: all lessons, static CVT explanation, equations, questions, answers, glossary and references must remain useful.
- Use print preview: the calculator UI and navigation must disappear while the static fallback remains.
- Inspect answer-key navigation and glossary lookup at phone and desktop sizes.
- Confirm no answer is hidden from assistive technology or print by a collapsed-only interaction.

## 9. Footnotes, citations and glossary

Footnotes:

- 138 unique first-use term footnotes across M01–M10;
- marker is focusable, target exists, backlink returns to the correct occurrence;
- English term is isolated LTR and does not reverse adjacent Persian punctuation;
- no orphan or unnecessary duplicate inside a module.

Citations:

- 39 lesson keys resolve to 39 linked reference records;
- lesson markers remain compact numeric groups;
- bibliography exposes readable labels, not raw URL clutter;
- link targets are correct and do not reorder mixed Persian/English text.

Glossary:

- 124 unique entries generated from `data/glossary.yml`;
- `npm run check:glossary` passes;
- lookup order is useful, two-column PDF is legible, and narrow web layout does not force document overflow;
- long English equivalents wrap without clipping or excessive gaps;
- terminology concerns are report-only unless the defect is purely typographic.

## 10. Media and rights

Expected mechanical media are exactly:

1. `assets/media/differential-gear-psf.png`
2. `assets/media/dual-clutch-transmission.svg`
3. `assets/media/epicyclic-gearing-stationary.svg`

Verify file use, alt, caption, licence/creator/source record, checksum, PDF fallback, grayscale readability, label direction and figure-caption truth. Confirm:

- no source-article image has been copied;
- no rejected Phase 3 SVG survives anywhere in source or output;
- no AI-generated mechanical illustration or improvised realistic geometry exists;
- no orphan/hotlinked critical asset exists;
- a missing visual is not “fixed” by adding an unlicensed or pedagogically weak image.

Report substantive mechanical-media concerns; do not silently redraw component geometry.

## 11. Accessibility and performance expectations

- zero serious or critical axe violations on all pages;
- semantic headings/landmarks, visible focus, complete keyboard use and no trap;
- informative alt/caption and table headers/captions appropriate to purpose;
- 200% zoom without lost content or function;
- reduced-motion respected if any motion is introduced;
- no console, asset, mixed-content or CSP errors in local operation;
- current static package baseline is approximately 2.98 MiB, largest HTML approximately 120.4 KiB, with no large framework runtime;
- investigate material regressions in HTML/CSS/JS size, image transfer, layout shift or interaction delay.

Automated axe and size checks do not replace human inspection.

## 12. PDF and print contract

Run `npm run build:pdf` and `npm run test:pdf`. Then inspect every page of the exact rebuilt PDF, not only contact sheets inherited from WorkGPT.

Expected structural baseline:

- 111 A4 pages, inside the approved 108–135 range;
- searchable Persian/Latin text;
- six embedded/subset font records including Vazirmatn, DejaVu Sans and Latin Modern Math;
- 815 internal destinations and `Hfootnote.138`;
- no blank page, missing glyph, overfull box or unresolved reference;
- no clipping, overlap, malformed citation residue or internal ID leakage.

Human print checks:

- title alignment, TOC, bookmarks, page numbering and running heads;
- safe margins and binding space;
- orphan headings, widows, split tables/figures/captions and footnote separation;
- equation direction/number placement and mixed-direction strings;
- whitespace cohesion and excessive short-page gaps;
- table hierarchy and grayscale readability;
- answer key, two-column glossary and numbered bibliography.

The final pass currently reports 15 non-fatal underfull boxes, concentrated in short glossary lines. Judge the rendered effect; do not rewrite terminology solely to eliminate a warning.

## 13. Content and assessment boundary

Re-run completeness and calculation tests. Read enough cross-module transitions to identify contradictions in sequence, rotation, force, pressure, heat, torque/power, ideal/real behavior and diagnostics.

However, the following are report-only unless the owner explicitly authorizes a content change:

- mechanical or scientific wording;
- curriculum scope or source coverage;
- Persian technical phrasing;
- terminology choice;
- pedagogical structure;
- substantive addition/deletion;
- interpretation of Master Nasiri’s intended course;
- replacement or redrawing of technical media.

For a content concern, cite the affected file/heading, explain the risk and propose options in the report. Do not silently “improve” it.

Verify assessment quality: every question is taught, has sufficient data, uses the displayed convention, and has a complete answer. Diagnostic questions must allow multiple hypotheses and ask for discriminating evidence rather than equating one symptom with one component.

## 14. Reproducibility

From a clean clone:

1. run the setup and full `npm test` contract;
2. record exact tool versions and actual browser dimensions;
3. verify the worktree remains clean after generated outputs are excluded/handled as intended;
4. build twice or compare against a second clean clone;
5. compare the web tree file-for-file and the PDF SHA-256;
6. record any timestamp-only difference separately from semantic drift;
7. verify the final PDF/web correspond to the audited commit.

Network access must not be required for the core content build after tool/bootstrap assets are available. Do not make external-site availability a hidden prerequisite for reading the book.

## 15. Known design debt requiring explicit inspection

Even though WorkGPT corrected obvious instances, inspect and report:

- whitespace cohesion in grouped labels and short explanatory sequences;
- visually bare tables and weak hierarchy;
- print CSS and browser print consistency;
- consistency across all ten modules rather than M08 alone;
- duplicated visible module labels;
- decorative boxes/headings/figures that do not improve understanding;
- glossary density and usability;
- citation presentation;
- answer-key scanning;
- media quality and instructional necessity.

Do not undertake a broad decorative redesign or add color for its own sake.

## 16. Repairs Codex may make automatically

Low-risk technical repairs are authorized when supported by reproducible evidence:

- build failures and deterministic tooling defects;
- broken internal links or missing assets;
- HTML/CSS/JavaScript defects and console errors;
- mobile overflow and RTL implementation errors;
- bidi punctuation/isolation defects without changing wording;
- inaccessible controls, keyboard/focus failures and footnote navigation;
- print styling, page-break behavior, table spacing/hierarchy and dead code;
- reproducibility problems;
- obvious duplicate UI labels or leaked internal IDs.

Keep changes minimal and rerun affected checks plus the full contract.

## 17. Branch and commit behavior

Create a separate local branch, recommended:

```bash
git switch -c codex/independent-audit
```

Before changes, record the audited base SHA. Use coherent commits such as:

- `audit: record independent baseline findings`
- `fix(web): correct mobile RTL overflow`
- `fix(print): repair table page break`
- `docs: publish Codex audit report`

Do not squash unrelated fixes, rewrite WorkGPT history, force-update the production branch, or write to GitHub. Preserve a clean worktree and deliver ZIP/patch/bundle/manifest for manual owner upload if changes are made.

## 18. Required report

Create `CODEX_AUDIT_REPORT.md` containing:

1. audited branch and base/final commit SHAs;
2. environment and exact tool versions;
3. commands run and exit results;
4. severity-ranked findings (`Critical`, `High`, `Medium`, `Low`);
5. reproducible evidence and affected file paths for every finding;
6. separate sections for web visual/interaction, RTL/bidi, PDF/print, accessibility, performance, media, reproducibility, assessment and content concerns;
7. technical fixes applied, with commit SHA and verification;
8. report-only content/curriculum/terminology concerns;
9. unresolved items and environmental limitations;
10. final test counts and artifact hashes;
11. an explicit verdict: pass, pass with findings, or fail/blocking.

Distinguish machine pass, Codex visual inspection and owner approval. Never convert “no automated failure” into “human-approved design.”

## 19. Stopping condition

After the independent audit, report and any authorized technical fixes are complete, stop. Do not merge to `main`, push through the connector, expand the curriculum, or claim owner approval.
