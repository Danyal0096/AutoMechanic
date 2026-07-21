import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pdf = join(root, "_output", "pdf", "auto-mechanic-fa.pdf");
const artifactRoot = join(root, "artifacts", "qa", "phase5");
const pageRoot = join(tmpdir(), "auto-mechanic-phase5-pdf-pages");
rmSync(pageRoot, { recursive: true, force: true });
mkdirSync(pageRoot, { recursive: true });
mkdirSync(artifactRoot, { recursive: true });

for (const file of readdirSync(artifactRoot)) {
  if (/^pdf-contact-\d+\.png$/.test(file)) {
    rmSync(join(artifactRoot, file), { force: true });
  }
}

if (!existsSync(pdf)) throw new Error("PDF output not found. Run `npm run build:pdf` first.");

const results = [];
function check(name, condition, details = "") {
  results.push({ name, status: condition ? "pass" : "fail", details });
  if (!condition) process.exitCode = 1;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
}

const qpdfBundled = join(root, ".tools", "qpdf", "usr", "bin", "qpdf");
const qpdf = existsSync(qpdfBundled) ? qpdfBundled : "qpdf";
const qpdfCheck = run(qpdf, ["--check", pdf]);
check(
  "qpdf structural validation",
  qpdfCheck.status === 0,
  `${qpdfCheck.stdout}${qpdfCheck.stderr}`.trim(),
);

const info = run("pdfinfo", [pdf]);
check("pdfinfo can read the complete book", info.status === 0, info.stderr.trim());
const pages = Number(info.stdout.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
check("final book remains within the approved 108–135 page range", pages >= 108 && pages <= 135, `${pages} pages`);
const sizeMatch = info.stdout.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);
const width = Number(sizeMatch?.[1] || 0);
const height = Number(sizeMatch?.[2] || 0);
check(
  "formal PDF uses A4 pages",
  Math.abs(width - 595.28) < 1 && Math.abs(height - 841.89) < 1,
  `${width} × ${height} pt`,
);
check(
  "PDF metadata identifies the complete Persian book",
  /مکانیک خودرو عمومی/.test(info.stdout),
  info.stdout.match(/^Title:.*$/m)?.[0] || "no title",
);

const destinations = run("pdfinfo", ["-dests", pdf]);
const destinationLines = destinations.stdout.split("\n").filter((line) => /^\s*\d+\s+\[/.test(line));
check(
  "TOC, sections, links and all 138 term footnotes expose destinations",
  destinations.status === 0 && destinationLines.length >= 700 && /Hfootnote\.138/.test(destinations.stdout),
  `${destinationLines.length} destinations`,
);

const fonts = run("pdffonts", [pdf]);
check("pdffonts can inspect the book", fonts.status === 0, fonts.stderr.trim());
const fontLines = fonts.stdout.split("\n").filter((line) => /^\S/.test(line) && !/^(name|---)/.test(line));
check(
  "every PDF font is embedded and subset",
  fontLines.length > 0 && fontLines.every((line) => /\s+yes\s+yes\s+(?:yes|no)\s+\d+\s+\d+\s*$/.test(line)),
  `${fontLines.length} font records`,
);
check("Vazirmatn is embedded", /Vazirmatn/i.test(fonts.stdout));
check("Latin and mathematics fallback fonts are embedded", /DejaVuSans/i.test(fonts.stdout) && /LatinModernMath/i.test(fonts.stdout));

const textFile = join(artifactRoot, "auto-mechanic-fa.txt");
const textResult = run("pdftotext", ["-layout", pdf, textFile]);
check("pdftotext extraction succeeds", textResult.status === 0, textResult.stderr.trim());
const extracted = existsSync(textFile) ? readFileSync(textFile, "utf8") : "";
const normalizedExtracted = extracted.normalize("NFKC");
const moduleTerms = [
  "مسیر انرژی",
  "چهارزمانه",
  "سوپاپ",
  "میل",
  "روانکاری",
  "مدیریت موتور",
  "کلاچ",
  "دیفرانسیل",
  "ترمز",
  "تعلیق",
];
const missingModuleTerms = moduleTerms.filter((term) => !normalizedExtracted.includes(term));
check("extractable Persian text represents all ten modules", missingModuleTerms.length === 0, missingModuleTerms.join(", "));
check(
  "answers, glossary and references remain extractable",
  normalizedExtracted.includes("پاسخ") && normalizedExtracted.includes("واژه") && normalizedExtracted.includes("منابع"),
  `${extracted.length} extracted characters`,
);
check(
  "mixed-direction technical terms remain extractable",
  ["CVT", "DCT", "TCU", "ABS", "ESC"].every((term) => normalizedExtracted.includes(term)),
);
check(
  "PDF exposes no internal production identifiers",
  !/(LO-M\d{2}-\d+|S\d{2}-C\d{2}|Approval Gate|Phase\s*\d)/.test(normalizedExtracted),
);
check("PDF exposes no malformed citation residue", !/\bn\.d\.(?:-[a-z])?|AMEG\s+n\.d\./i.test(normalizedExtracted));
check("PDF bibliography exposes no raw URL clutter", !/https?:\/\//i.test(normalizedExtracted));

const blankPages = [];
for (let page = 1; page <= pages; page += 1) {
  const pageText = run("pdftotext", ["-f", String(page), "-l", String(page), pdf, "-"]);
  const compact = pageText.stdout.replace(/[\s\f]+/g, "");
  if (pageText.status !== 0 || compact.length < 8) blankPages.push(page);
}
check("no unintended blank or unreadable PDF pages", blankPages.length === 0, blankPages.join(", "));

const pagePrefix = join(pageRoot, "page");
const render = run("pdftoppm", ["-png", "-r", "120", pdf, pagePrefix], { timeout: 180000 });
const pageImages = readdirSync(pageRoot)
  .filter((file) => /^page-\d+\.png$/.test(file))
  .sort()
  .map((file) => join(pageRoot, file));
check("Poppler renders the complete PDF without error", render.status === 0, render.stderr.trim());
check("Poppler emits one page image for every PDF page", pageImages.length === pages, `${pageImages.length}/${pages}`);

const decodeFailures = [];
for (const [index, image] of pageImages.entries()) {
  const decode = run("convert", [image, "null:"], { timeout: 30000 });
  if (decode.status !== 0) decodeFailures.push(index + 1);
}
check("every rendered page image fully decodes", decodeFailures.length === 0, decodeFailures.join(", "));

const contactSheets = [];
for (let start = 0; start < pageImages.length; start += 4) {
  const sequence = String(start / 4 + 1).padStart(2, "0");
  const output = join(artifactRoot, `pdf-contact-${sequence}.png`);
  const temporaryOutput = join(tmpdir(), `auto-mechanic-phase5-contact-${sequence}.png`);
  rmSync(temporaryOutput, { force: true });
  const chunk = pageImages.slice(start, start + 4);
  const montage = run("montage", [
    ...chunk,
    "-thumbnail", "600x850",
    "-tile", "2x2",
    "-geometry", "+14+14",
    "-background", "white",
    "-depth", "8",
    temporaryOutput,
  ], { timeout: 60000 });
  if (montage.status === 0 && existsSync(temporaryOutput)) {
    copyFileSync(temporaryOutput, output);
  }
  const decode = existsSync(output) ? run("convert", [output, "null:"]) : { status: 1, stderr: "missing output" };
  check(
    `contact sheet ${sequence} generated`,
    montage.status === 0 && decode.status === 0,
    `${montage.stderr || ""}${decode.stderr || ""}`.trim(),
  );
  contactSheets.push(output);
}

const detailLogPath = join(artifactRoot, "xelatex-detail.log");
const detailLog = existsSync(detailLogPath) ? readFileSync(detailLogPath, "utf8") : "";
const passLogs = detailLog.split("--- completed xelatex pass ---").slice(1);
const finalPassLog = passLogs.at(-1) || "";
const missingGlyphs = [...detailLog.matchAll(/Missing character:/g)].length;
const overfull = [...detailLog.matchAll(/Overfull \\hbox/g)].length;
const underfull = [...finalPassLog.matchAll(/Underfull \\hbox/g)].length;
check("three complete XeLaTeX logs were preserved", passLogs.length === 3, `${passLogs.length} passes`);
check("XeLaTeX reports no missing glyphs", missingGlyphs === 0, `${missingGlyphs}`);
check("XeLaTeX reports no overfull boxes", overfull === 0, `${overfull}`);
check(
  "final XeLaTeX pass has no unresolved references",
  !/(There were undefined references|Rerun to get cross-references right)/.test(finalPassLog),
  `${underfull} non-fatal underfull boxes`,
);

const report = {
  generated_at: new Date().toISOString(),
  pdf: "_output/pdf/auto-mechanic-fa.pdf",
  pages,
  page_size_points: { width, height },
  destination_count: destinationLines.length,
  rendered_page_directory: pageRoot,
  contact_sheets: contactSheets.map((file) => file.slice(root.length + 1)),
  tex: {
    passes: passLogs.length,
    missing_glyphs: missingGlyphs,
    overfull_boxes: overfull,
    final_pass_underfull_boxes: underfull,
  },
  summary: {
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
  },
  results,
};
writeFileSync(join(artifactRoot, "pdf-audit.json"), `${JSON.stringify(report, null, 2)}\n`);

for (const result of results) {
  console.log(`${result.status === "pass" ? "PASS" : "FAIL"}  ${result.name}${result.details ? ` — ${result.details}` : ""}`);
}
console.log(`\n${report.summary.passed} passed; ${report.summary.failed} failed.`);
