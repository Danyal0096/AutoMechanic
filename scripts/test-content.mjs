import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coverageOnly = process.argv.includes("--coverage-only");
const moduleIds = Array.from({ length: 10 }, (_, index) => `M${String(index + 1).padStart(2, "0")}`);
const results = [];

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function check(name, condition, details = "") {
  results.push({ name, status: condition ? "pass" : "fail", details });
  if (!condition) process.exitCode = 1;
}

function close(actual, expected, tolerance = 0.02) {
  return Math.abs(actual - expected) <= tolerance;
}

function sha256(relativePath) {
  return createHash("sha256").update(readFileSync(join(root, relativePath))).digest("hex");
}

function sourceWithoutHiddenAttributes(text) {
  return text
    .replace(/\{#[^}]+\}/g, "")
    .replace(/<!--[^]*?-->/g, "")
    .replace(/data-cites="[^"]+"/g, "");
}

const matrix = read("CONTENT_COVERAGE_MATRIX.md");
const answersQmd = read("content/answers.qmd");
const glossaryQmd = read("content/glossary.qmd");
const referenceQmd = read("content/references.qmd");
const mediaManifest = read("MEDIA_SOURCES.md");
const bibliography = read("references/references.bib");
const glossary = YAML.parse(read("data/glossary.yml"));
const modules = new Map(moduleIds.map((id) => {
  const number = id.slice(1);
  return [id, {
    id,
    number,
    qmd: read(`content/m${number}.qmd`),
    coverage: YAML.parse(read(`data/m${number}-coverage.yml`)),
    assessment: YAML.parse(read(`data/m${number}-assessment.yml`)),
  }];
}));

const matrixRows = [...matrix.matchAll(/^\| (S\d{2}-C\d{2}) \|[^\n]+\|/gm)];
const matrixIds = matrixRows.map((match) => match[1]);
check(
  "coverage matrix has 196 unique concepts",
  matrixIds.length === 196 && new Set(matrixIds).size === 196,
  `${matrixIds.length} rows`,
);

const entries = [...modules.values()].flatMap((module) =>
  module.coverage.entries.map((entry) => ({ ...entry, module: module.id })),
);
const coverageIds = entries.map((entry) => entry.id);
check(
  "ten manifests contain 196 unique concepts",
  entries.length === 196 && new Set(coverageIds).size === 196,
  `${entries.length} entries`,
);
check(
  "matrix and manifests contain the same concept set",
  matrixIds.every((id) => coverageIds.includes(id)) && coverageIds.every((id) => matrixIds.includes(id)),
);
check(
  "all 20 curricular sources are represented",
  Array.from({ length: 20 }, (_, index) => `S${String(index).padStart(2, "0")}`)
    .every((source) => entries.some((entry) => entry.source === source)),
  `${new Set(entries.map((entry) => entry.source)).size} sources`,
);
check(
  "concept IDs and declared sources agree",
  entries.every((entry) => entry.id.startsWith(`${entry.source}-`)),
);
check(
  "all production coverage states are published",
  [...modules.values()].every((module) => module.coverage.status === "published")
    && entries.every((entry) => entry.status === "published"),
  [...new Set([...modules.values()].map((module) => module.coverage.status)
    .concat(entries.map((entry) => entry.status)))].join(", "),
);
check(
  "matrix rows point to published content",
  matrixRows.every((match) => /\| Published(?: · (?:Corrected|Qualified|Verified))? \|/.test(match[0])),
  `${matrixRows.filter((match) => /\| Published/.test(match[0])).length}/${matrixRows.length}`,
);

const allAnchors = new Set();
const unresolvedAnchors = [];
const shallowAnchors = [];
for (const module of modules.values()) {
  const anchors = [...module.qmd.matchAll(/\{#([a-z][\w-]+)(?:\s|\})/g)];
  for (const match of anchors) allAnchors.add(match[1]);
  for (const entry of module.coverage.entries) {
    const marker = `{#${entry.anchor}}`;
    const start = module.qmd.indexOf(marker);
    if (start < 0) {
      unresolvedAnchors.push(`${entry.id}:${entry.anchor}`);
      continue;
    }
    const nextSection = module.qmd.indexOf("\n## ", start + marker.length);
    const section = module.qmd.slice(start + marker.length, nextSection < 0 ? module.qmd.length : nextSection)
      .replace(/\[\^[^\]]+\]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "");
    if (section.length < 180) shallowAnchors.push(`${entry.id}:${entry.anchor}:${section.length}`);
  }
}
check("every concept resolves to an authored anchor", unresolvedAnchors.length === 0, unresolvedAnchors.slice(0, 12).join(", "));
check("no concept is covered only by an empty heading", shallowAnchors.length === 0, shallowAnchors.slice(0, 12).join(", "));

const matrixAnchors = new Map(matrixRows.map((match) => {
  const anchors = [...match[0].matchAll(/`#([a-z][\w-]+)`/gi)].map((anchorMatch) => anchorMatch[1]);
  return [match[1], anchors];
}));
check(
  "coverage matrix anchors match manifests",
  entries.every((entry) => matrixAnchors.get(entry.id)?.includes(entry.anchor)),
  `${entries.filter((entry) => matrixAnchors.get(entry.id)?.includes(entry.anchor)).length}/${entries.length}`,
);

const questions = [];
for (const module of modules.values()) {
  for (const question of module.assessment.questions) questions.push({ ...question, module: module.id });
}
const questionIds = questions.map((question) => question.id);
const authoredQuestionIds = [...modules.values()].flatMap((module) =>
  [...module.qmd.matchAll(/\{#(q-m\d{2}-\d{2})\}/g)].map((match) => match[1]),
);
const authoredAnswerIds = [...answersQmd.matchAll(/\{#(a-m\d{2}-\d{2})\}/g)].map((match) => match[1]);
check(
  "53 assessments have unique internal records",
  questions.length === 53 && new Set(questionIds).size === 53
    && [...modules.values()].every((module) => module.assessment.visibility === "internal"),
  `${questions.length} questions`,
);
check(
  "every assessment resolves to a lesson question and worked answer",
  questionIds.every((id) => authoredQuestionIds.includes(id) && authoredAnswerIds.includes(id.replace(/^q-/, "a-")))
    && authoredQuestionIds.length === questions.length && authoredAnswerIds.length === questions.length,
  `${authoredQuestionIds.length} questions / ${authoredAnswerIds.length} answers`,
);
check(
  "assessment concepts are taught and traceable",
  questions.every((question) => question.concepts?.length > 0 && question.concepts.every((id) => coverageIds.includes(id))),
);
check(
  "worked answers are substantive rather than answer-only tokens",
  authoredAnswerIds.every((id) => {
    const start = answersQmd.indexOf(`{#${id}}`);
    const next = answersQmd.indexOf("\n### ", start + id.length);
    const block = answersQmd.slice(start, next < 0 ? answersQmd.length : next);
    return block.replace(/\s+/g, " ").length >= 260;
  }),
);

if (!coverageOnly) {
  const studentFiles = [
    "index.qmd",
    ...moduleIds.map((id) => `content/m${id.slice(1)}.qmd`),
    "content/answers.qmd",
    "content/glossary.qmd",
    "content/references.qmd",
  ];
  const studentText = studentFiles.map(read).join("\n");
  const studentVisibleSource = sourceWithoutHiddenAttributes(studentText);
  const arabicLookalikes = [...studentText.matchAll(/[يك]/g)];
  check("student text has no Arabic yeh/kaf lookalikes", arabicLookalikes.length === 0, `${arabicLookalikes.length} characters`);
  check("student text contains no source-commentary phrasing", !/مقالهٔ (اصلی|مبدأ) می‌گوید/.test(studentVisibleSource));
  check(
    "student-facing source contains no visible production metadata",
    !/(LO-M\d{2}-\d+|S\d{2}-C\d{2}|Approval Gate|Phase\s*\d|suggested_marks|learning_objectives)/.test(studentVisibleSource),
  );
  check("student-facing source contains no n.d. citation residue", !/\bn\.d\.(?:-[a-z])?/i.test(studentVisibleSource));

  const bodyWords = studentText.replace(/<[^>]+>/g, " ").split(/\s+/u).filter(Boolean).length;
  check("complete book stays within the approved word range", bodyWords >= 30000 && bodyWords <= 38000, `${bodyWords} whitespace-delimited tokens`);
  check(
    "every module has a substantial finished body",
    [...modules.values()].every((module) => module.qmd.split(/\s+/u).filter(Boolean).length >= 1700),
    [...modules.values()].map((module) => `${module.id}:${module.qmd.split(/\s+/u).filter(Boolean).length}`).join(", "),
  );

  const footnoteProblems = [];
  let footnoteTotal = 0;
  for (const module of modules.values()) {
    const refs = [...module.qmd.matchAll(/\[\^([\w-]+)\](?!:)/g)].map((match) => match[1]);
    const defs = [...module.qmd.matchAll(/^\[\^([\w-]+)\]:/gm)].map((match) => match[1]);
    footnoteTotal += refs.length;
    if (new Set(refs).size !== refs.length || refs.length !== defs.length || defs.some((id) => !refs.includes(id))) {
      footnoteProblems.push(`${module.id}:${refs.length}/${defs.length}`);
    }
  }
  check("English-term footnotes are unique and non-orphaned in every module", footnoteProblems.length === 0, `${footnoteTotal} footnotes${footnoteProblems.length ? `; ${footnoteProblems.join(", ")}` : ""}`);

  const glossaryIds = glossary.terms.map((term) => term.id);
  check(
    "book glossary has a bounded unique schema",
    glossary.schema_version === 2 && glossary.scope === "book"
      && glossaryIds.length >= 90 && glossaryIds.length <= 130
      && glossaryIds.length === new Set(glossaryIds).size,
    `${glossaryIds.length} terms`,
  );
  check(
    "rendered glossary covers every structured term",
    glossary.terms.every((term) => glossaryQmd.includes(`**${term.fa}**`) && glossaryQmd.toLowerCase().includes(term.en.toLowerCase())),
  );
  const glossarySync = spawnSync(process.execPath, [join(root, "scripts", "generate-glossary.mjs"), "--check"], { cwd: root, encoding: "utf8" });
  check("generated glossary is synchronized with its data source", glossarySync.status === 0, glossarySync.stderr.trim());

  const calculationChecks = [
    close(0.90 * 70 - 42, 21),
    close((Math.PI / 4) * 84 ** 2 * 90 / 1000, 498.8, 0.1) && close((498.8 + 52) / 52, 10.59, 0.01),
    close(190 * 3000 / 9550, 59.7, 0.1) && close(135 * 5500 / 9550, 77.7, 0.1),
    close(4200 / 2, 2100) && close(4200 * 0.5, 2100),
    close(2 * 0.094 * 5200 / 60, 16.29, 0.01),
    close(420000 * 60e-6, 25.2, 0.01),
    close(29.4 / 14.7, 2.0, 0.001),
    close(1500 * 3.0 * 0.55 / 2.7, 916.7, 0.1),
    close(2500 / (3.2 * 4.1), 190.5, 0.1) && close(170 * 3.2 * 4.1 * 0.88, 1963, 0.5),
    close(3400 / (41 / 12), 995, 0.2) && close(0.94 * (41 / 12) * 155, 498, 0.5),
    close((30 * 2400) / 100, 720, 0.01) && close(0.88 * (80 / 35) * 120, 241.4, 0.1),
    close((300 * 3.8 + 1000) / 2.8e-4, 7.642857e6, 10) && close(0.65 * 4200 * 0.30, 819, 0.01),
    close(0.5 * 28000 * 0.055 ** 2, 42.35, 0.01) && close(28000 * 0.055, 1540, 0.01),
  ];
  check("worked numerical examples recompute across all ten modules", calculationChecks.every(Boolean), `${calculationChecks.filter(Boolean).length}/${calculationChecks.length}`);

  const citationGroups = [...studentText.matchAll(/data-cites="([^"]+)"/g)].map((match) => match[1].trim().split(/\s+/));
  const citeKeys = new Set(citationGroups.flat());
  const bibKeys = new Set([...bibliography.matchAll(/^@\w+\{([^,]+),/gm)].map((match) => match[1]));
  check("every lesson citation key resolves", [...citeKeys].every((key) => bibKeys.has(key)), `${citeKeys.size} used`);
  check("all 39 bibliography records support visible lessons", bibKeys.size === 39 && [...bibKeys].every((key) => citeKeys.has(key)), `${bibKeys.size} records`);
  check(
    "manual bibliography exposes one linked destination per record",
    [...bibKeys].every((key) => referenceQmd.includes(`{#source-${key} `))
      && (referenceQmd.match(/\.reference-entry/g) || []).length === 39,
    `${(referenceQmd.match(/\.reference-entry/g) || []).length} destinations`,
  );
  const referenceLabelsOnly = referenceQmd.replace(/\]\(https?:\/\/[^)]+\)/g, "]");
  check("bibliography keeps raw URLs out of visible labels", !/https?:\/\//i.test(referenceLabelsOnly));

  const rejectedDiagrams = [
    "cvt-effective-radius.svg", "dct-preselection.svg", "differential-kinematics.svg",
    "m08-system-map.svg", "planetary-control-map.svg", "torque-converter-flow.svg",
  ];
  check("all six rejected mechanical SVGs remain absent", rejectedDiagrams.every((file) => !existsSync(join(root, "assets", "diagrams", file))));
  check("student source contains no generated mechanical-diagram path", !/assets\/diagrams\//.test(studentText));

  const mediaDirectory = join(root, "assets", "media");
  const mediaFiles = readdirSync(mediaDirectory).sort();
  check("book uses exactly three approved licensed media files", mediaFiles.length === 3, mediaFiles.join(", "));
  check("every licensed media file is used and captioned", mediaFiles.every((file) => studentText.includes(`../assets/media/${file}`)));
  const manifestRows = [...mediaManifest.matchAll(/^\| MED-M08-\d{3} .*?`(assets\/media\/[^`]+)` .*?`([a-f0-9]{64})` .*?\| Use \|$/gm)];
  const manifestMap = new Map(manifestRows.map((match) => [basename(match[1]), { path: match[1], hash: match[2] }]));
  check("media manifest has one approved-use row per asset", manifestMap.size === mediaFiles.length && mediaFiles.every((file) => manifestMap.has(file)), `${manifestMap.size} rows`);
  check("media checksums match repository files", [...manifestMap.values()].every((entry) => sha256(entry.path) === entry.hash));

  const requiredFiles = [
    "_quarto.yml", "_language-fa.yml", "filters/rtl.lua", "print/preamble.tex",
    "assets/fonts/OFL.txt", "THIRD_PARTY_NOTICES.md", "content/answers.qmd",
    "content/glossary.qmd", "content/references.qmd", "references/references.bib",
    ...moduleIds.flatMap((id) => [
      `content/m${id.slice(1)}.qmd`, `data/m${id.slice(1)}-coverage.yml`, `data/m${id.slice(1)}-assessment.yml`,
    ]),
  ];
  check("all publishing, traceability and rights files exist", requiredFiles.every((file) => existsSync(join(root, file))), `${requiredFiles.length} files`);
}

const artifactDirectory = join(root, "artifacts", "qa", "phase5");
mkdirSync(artifactDirectory, { recursive: true });
const report = {
  generated_at: new Date().toISOString(),
  scope: coverageOnly ? "coverage" : "content",
  modules: moduleIds,
  concepts: entries.length,
  questions: questions.length,
  summary: {
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
  },
  results,
};
writeFileSync(
  join(artifactDirectory, coverageOnly ? "coverage-audit.json" : "content-audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

for (const result of results) {
  console.log(`${result.status === "pass" ? "PASS" : "FAIL"}  ${result.name}${result.details ? ` — ${result.details}` : ""}`);
}
console.log(`\n${report.summary.passed} passed; ${report.summary.failed} failed.`);
