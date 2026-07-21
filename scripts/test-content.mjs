import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coverageOnly = process.argv.includes("--coverage-only");
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

const matrix = read("CONTENT_COVERAGE_MATRIX.md");
const moduleQmd = read("content/m08.qmd");
const answersQmd = read("content/m08-answers.qmd");
const glossaryQmd = read("content/glossary.qmd");
const referenceQmd = read("content/references.qmd");
const mediaManifest = read("MEDIA_SOURCES.md");
const bibliography = read("references/references.bib");
const coverage = YAML.parse(read("data/m08-coverage.yml"));
const glossary = YAML.parse(read("data/glossary.yml"));
const assessment = YAML.parse(read("data/m08-assessment.yml"));

const matrixIds = [...matrix.matchAll(/^\| (S\d{2}-C\d{2}) \|/gm)].map((match) => match[1]);
check("coverage matrix has 196 unique concepts", matrixIds.length === 196 && new Set(matrixIds).size === 196, `${matrixIds.length} rows`);

const sampleIds = coverage.entries.map((entry) => entry.id);
check("M08 manifest has 29 unique concepts", sampleIds.length === 29 && new Set(sampleIds).size === 29, `${sampleIds.length} entries`);
check("all M08 concepts exist in Phase 1 matrix", sampleIds.every((id) => matrixIds.includes(id)));
check("M08 source distribution is complete", ["S12", "S13", "S14", "S15"].every((source) => sampleIds.some((id) => id.startsWith(`${source}-`))));
check("all M08 coverage states are sample_verified", coverage.entries.every((entry) => entry.status === "sample_verified"));

const anchors = new Set([...moduleQmd.matchAll(/\{#([a-z][\w-]+)(?:\s|\})/g)].map((match) => match[1]));
check("every coverage entry resolves to an authored anchor", coverage.entries.every((entry) => anchors.has(entry.anchor)));
const assessmentConcepts = assessment.questions.flatMap((question) => question.concepts);
check("assessment traceability is internal and complete", assessment.visibility === "internal" && ["S12-C03", "S12-C06", "S13-C07", "S14-C05", "S15-C07"].every((id) => assessmentConcepts.includes(id)));

if (!coverageOnly) {
  const studentText = [read("index.qmd"), moduleQmd, answersQmd, glossaryQmd, referenceQmd].join("\n");
  const studentVisibleSource = studentText
    .replace(/\{#[^}]+\}/g, "")
    .replace(/<!--[^]*?-->/g, "");
  const arabicLookalikes = [...studentText.matchAll(/[يك]/g)];
  check("student text has no Arabic yeh/kaf lookalikes", arabicLookalikes.length === 0, `${arabicLookalikes.length} characters`);
  check("student text contains no source-commentary phrasing", !/مقالهٔ (اصلی|مبدأ) می‌گوید/.test(studentText));
  check("student-facing source contains no internal production IDs", !/(LO-M08-\d+|S1[2-5]-C\d+|Approval Gate|Phase\s*\d)/.test(studentVisibleSource));
  check("student-facing source contains no visible n.d. citation residue", !/\bn\.d\.(?:-[a-z])?/i.test(studentVisibleSource));

  const bodyWords = moduleQmd.replace(/<[^>]+>/g, " ").split(/\s+/u).filter(Boolean).length;
  check("representative module has substantive finished length", bodyWords >= 4300, `${bodyWords} whitespace-delimited tokens`);

  const footnoteRefs = [...moduleQmd.matchAll(/\[\^([\w-]+)\](?!:)/g)].map((match) => match[1]);
  const footnoteDefs = [...moduleQmd.matchAll(/^\[\^([\w-]+)\]:/gm)].map((match) => match[1]);
  check("English-term footnotes are unique and non-orphaned", new Set(footnoteRefs).size === footnoteRefs.length && footnoteRefs.length === footnoteDefs.length && footnoteDefs.every((id) => footnoteRefs.includes(id)), `${footnoteRefs.length} footnotes`);

  const glossaryIds = glossary.terms.map((term) => term.id);
  check("glossary schema has unique keys", glossary.schema_version === 1 && glossaryIds.length === new Set(glossaryIds).size, `${glossaryIds.length} terms`);
  check("all term footnotes have glossary records", footnoteRefs.every((id) => glossaryIds.includes(id)));
  check("rendered glossary covers YAML English terms", glossary.terms.every((term) => glossaryQmd.toLowerCase().includes(term.en.toLowerCase())));

  const questionIds = [...moduleQmd.matchAll(/\{#q-m08-(\d{2})\}/g)].map((match) => match[1]);
  const answerIds = [...answersQmd.matchAll(/\{#a-m08-(\d{2})\}/g)].map((match) => match[1]);
  check("six assessments have six matching worked answers", questionIds.length === 6 && questionIds.join(",") === answerIds.join(","), `${questionIds.length}/${answerIds.length}`);
  check("internal assessment map covers all six questions", assessment.questions.length === 6 && assessment.questions.map((question) => question.id.slice(-2)).join(",") === questionIds.join(","));
  check("student answer key omits internal evaluation mapping", !/(LO-M08-|S1[2-5]-C|راهنمای ارزیابی)/.test(answersQmd));

  check("final-drive example recomputes", close(41 / 12, 3.417, 0.001) && close(3400 / (41 / 12), 995, 0.2) && close(0.94 * (41 / 12) * 155, 498, 0.5));
  check("planetary example recomputes", close((30 * 2400) / 100, 720, 0.01));
  check("CVT worked example recomputes", close(80 / 35, 2.286, 0.001) && close(35 / 80, 0.4375, 0.0001) && close(0.88 * (80 / 35) * 120, 241.4, 0.1));
  check("hydraulic example uses SI area conversion", close(600000 * 1.8e-3, 1080, 0.01));

  const citationGroups = [...moduleQmd.matchAll(/data-cites="([^"]+)"/g)]
    .map((match) => match[1].trim().split(/\s+/));
  const citeKeys = new Set(citationGroups.flat());
  const bibKeys = new Set([...bibliography.matchAll(/^@\w+\{([^,]+),/gm)].map((match) => match[1]));
  check("seven compact numeric citation groups are authored", citationGroups.length === 7 && /\\\[1–4\\\]/.test(moduleQmd) && /\\\[11\\\]/.test(moduleQmd), `${citationGroups.length} groups`);
  check("every citation key resolves", [...citeKeys].every((key) => bibKeys.has(key)), `${citeKeys.size} used`);
  check("every bibliography record is used", [...bibKeys].every((key) => citeKeys.has(key)), `${bibKeys.size} records`);
  check("manual bibliography exposes one linked destination per source", [...bibKeys].every((key) => referenceQmd.includes(`{#source-${key} `)) && !/https?:\/\/\S+>/.test(referenceQmd), `${bibKeys.size} destinations`);

  const rejectedDiagrams = [
    "cvt-effective-radius.svg", "dct-preselection.svg", "differential-kinematics.svg",
    "m08-system-map.svg", "planetary-control-map.svg", "torque-converter-flow.svg",
  ];
  check("all six rejected SVG files are absent", rejectedDiagrams.every((file) => !existsSync(join(root, "assets", "diagrams", file))));
  check("student source contains no rejected SVG reference", !/assets\/diagrams\//.test(studentText));

  const mediaDirectory = join(root, "assets", "media");
  const mediaFiles = readdirSync(mediaDirectory).sort();
  check("sample uses exactly three licensed technical media files", mediaFiles.length === 3, mediaFiles.join(", "));
  check("every licensed media file is used in the lesson", mediaFiles.every((file) => moduleQmd.includes(`../assets/media/${file}`)));

  const manifestRows = [...mediaManifest.matchAll(/^\| MED-M08-\d{3} .*?`(assets\/media\/[^`]+)` .*?`([a-f0-9]{64})` .*?\| Use \|$/gm)];
  const manifestMap = new Map(manifestRows.map((match) => [basename(match[1]), { path: match[1], hash: match[2] }]));
  check("media manifest has one approved-use row per local asset", manifestMap.size === mediaFiles.length && mediaFiles.every((file) => manifestMap.has(file)), `${manifestMap.size} rows`);
  check("media checksums match repository files", [...manifestMap.values()].every((entry) => sha256(entry.path) === entry.hash));

  const requiredFiles = [
    "_quarto.yml", "_language-fa.yml", "filters/rtl.lua", "print/preamble.tex",
    "assets/fonts/OFL.txt", "THIRD_PARTY_NOTICES.md", "content/m08.qmd",
    "content/m08-answers.qmd", "content/glossary.qmd", "content/references.qmd",
    "data/m08-assessment.yml", "references/references.bib",
  ];
  check("all publishing and rights files exist", requiredFiles.every((file) => existsSync(join(root, file))));
}

const artifactDirectory = join(root, "artifacts", "qa", "phase3");
mkdirSync(artifactDirectory, { recursive: true });
const report = {
  generated_at: new Date().toISOString(),
  scope: coverageOnly ? "coverage" : "content",
  summary: {
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
  },
  results,
};
writeFileSync(join(artifactDirectory, coverageOnly ? "coverage-audit.json" : "content-audit.json"), `${JSON.stringify(report, null, 2)}\n`);

for (const result of results) {
  console.log(`${result.status === "pass" ? "PASS" : "FAIL"}  ${result.name}${result.details ? ` — ${result.details}` : ""}`);
}
console.log(`\n${report.summary.passed} passed; ${report.summary.failed} failed.`);
