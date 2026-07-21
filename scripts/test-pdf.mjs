import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pdf = join(root, "_output", "pdf", "auto-mechanic-fa.pdf");
const artifactRoot = join(root, "artifacts", "qa", "phase3");
const pageRoot = join(tmpdir(), "auto-mechanic-phase3-pdf-pages");
rmSync(pageRoot, { recursive: true, force: true });
mkdirSync(pageRoot, { recursive: true });

if (!existsSync(pdf)) throw new Error("PDF output not found. Run `npm run build:pdf` first.");

const results = [];
function check(name, condition, details = "") {
  results.push({ name, status: condition ? "pass" : "fail", details });
  if (!condition) process.exitCode = 1;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { cwd: root, encoding: "utf8", ...options });
}

const qpdfBundled = join(root, ".tools", "qpdf", "usr", "bin", "qpdf");
const qpdf = existsSync(qpdfBundled) ? qpdfBundled : "qpdf";
const qpdfCheck = run(qpdf, ["--check", pdf]);
check("qpdf structural validation", qpdfCheck.status === 0, `${qpdfCheck.stdout}${qpdfCheck.stderr}`.trim());

const info = run("pdfinfo", [pdf]);
check("pdfinfo can read document", info.status === 0, info.stderr.trim());
const pages = Number(info.stdout.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
check("sample page count is substantive and bounded", pages >= 18 && pages <= 45, `${pages} pages`);
const sizeMatch = info.stdout.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);
const width = Number(sizeMatch?.[1] || 0);
const height = Number(sizeMatch?.[2] || 0);
check("formal PDF uses A4 pages", Math.abs(width - 595.28) < 1 && Math.abs(height - 841.89) < 1, `${width} × ${height} pt`);
check("PDF metadata contains Persian title", /مکانیک خودرو عمومی/.test(info.stdout) || /auto-mechanic-fa/.test(info.stdout), info.stdout.match(/^Title:.*$/m)?.[0] || "no title");

const destinations = run("pdfinfo", ["-dests", pdf]);
const destinationLines = destinations.stdout.split("\n").filter((line) => /^\s*\d+\s+\[/.test(line));
check(
  "PDF exposes internal destinations for TOC, sections and footnotes",
  destinations.status === 0 && destinationLines.length >= 50 && /Hfootnote\.18/.test(destinations.stdout),
  `${destinationLines.length} destinations`,
);

const fonts = run("pdffonts", [pdf]);
check("pdffonts can inspect document", fonts.status === 0, fonts.stderr.trim());
const fontLines = fonts.stdout.split("\n").filter((line) => /^\S/.test(line) && !/^(name|---)/.test(line));
check("all PDF fonts are embedded and subset", fontLines.length > 0 && fontLines.every((line) => /\s+yes\s+yes\s+(yes|no)\s+\d+\s+\d+\s*$/.test(line)), `${fontLines.length} font records`);
check("Vazirmatn is embedded", /Vazirmatn/i.test(fonts.stdout));

const textFile = join(artifactRoot, "auto-mechanic-fa.txt");
const textResult = run("pdftotext", ["-layout", pdf, textFile]);
check("pdftotext extraction succeeds", textResult.status === 0, textResult.stderr.trim());
const extracted = existsSync(textFile) ? readFileSync(textFile, "utf8") : "";
const normalizedExtracted = extracted.normalize("NFKC");
check("Persian module content remains extractable", normalizedExtracted.includes("دیفرانسیل") && normalizedExtracted.includes("گرداننده") && normalizedExtracted.includes("پاسخ"), `${extracted.length} characters`);
check("mixed-direction technical terms remain extractable", /CVT/.test(normalizedExtracted) && /DCT/.test(normalizedExtracted) && /TCU/.test(normalizedExtracted));
check("PDF exposes no internal production IDs", !/(LO-M08-|S1[2-5]-C\d+|Approval Gate|Phase\s*\d)/.test(normalizedExtracted));
check("PDF exposes no malformed author-date residue", !/\bn\.d\.(?:-[a-z])?|AMEG\s+n\.d\./i.test(normalizedExtracted));
check("PDF bibliography exposes no raw URL clutter", !/https?:\/\//i.test(normalizedExtracted));

const blankPages = [];
for (let page = 1; page <= pages; page += 1) {
  const pageText = run("pdftotext", ["-f", String(page), "-l", String(page), pdf, "-"]);
  const compact = pageText.stdout.replace(/[\s\f]+/g, "");
  if (compact.length < 8) blankPages.push(page);
}
check("no unintended blank PDF pages", blankPages.length === 0, blankPages.join(", "));

const pageDigits = String(pages).length;
const expectedPages = Array.from(
  { length: pages },
  (_, index) => join(pageRoot, `page-${String(index + 1).padStart(pageDigits, "0")}.png`),
);
const renderFailures = [];
let renderRetries = 0;
for (let page = 1; page <= pages; page += 1) {
  const output = expectedPages[page - 1];
  const prefix = output.replace(/\.png$/, "");
  let complete = false;
  let lastError = "";
  for (let attempt = 1; attempt <= 3 && !complete; attempt += 1) {
    rmSync(output, { force: true });
    const render = run("pdftoppm", [
      "-f", String(page),
      "-l", String(page),
      "-singlefile",
      "-png",
      "-r", "120",
      pdf,
      prefix,
    ]);
    const decode = existsSync(output) ? run("convert", [output, "null:"]) : { status: 1, stderr: "missing output" };
    complete = render.status === 0 && decode.status === 0;
    lastError = `${render.stderr || ""}${decode.stderr || ""}`.trim();
    if (!complete && attempt < 3) renderRetries += 1;
  }
  if (!complete) renderFailures.push(`page ${page}: ${lastError}`);
}
check("Poppler renders and fully decodes every PDF page", renderFailures.length === 0, renderFailures.join(" | "));
check("page rendering completed within bounded retries", renderFailures.length === 0, `${renderRetries} retries`);
check("one page image exists per PDF page", expectedPages.every((file) => existsSync(file)), `${expectedPages.filter((file) => existsSync(file)).length}/${pages}`);

const contactSheets = [];
for (let start = 0; start < expectedPages.length; start += 4) {
  const sequence = String(start / 4 + 1).padStart(2, "0");
  const output = join(artifactRoot, `pdf-contact-${sequence}.png`);
  const temporaryOutput = join(tmpdir(), `auto-mechanic-phase3-contact-${sequence}.png`);
  rmSync(output, { force: true });
  rmSync(temporaryOutput, { force: true });
  const chunk = expectedPages.slice(start, start + 4);
  const montage = run("montage", [
    ...chunk,
    "-thumbnail", "600x850",
    "-tile", "2x2",
    "-geometry", "+14+14",
    "-background", "white",
    temporaryOutput,
  ]);
  if (montage.status === 0 && existsSync(temporaryOutput)) copyFileSync(temporaryOutput, output);
  const decode = existsSync(output) ? run("convert", [output, "null:"]) : { status: 1, stderr: "missing output" };
  check(
    `contact sheet ${sequence} generated`,
    montage.status === 0 && decode.status === 0,
    `${montage.stderr || ""}${decode.stderr || ""}`.trim(),
  );
  contactSheets.push(output);
}

const buildLogPath = join(artifactRoot, "build-pdf.log");
const buildLog = existsSync(buildLogPath) ? readFileSync(buildLogPath, "utf8") : "";
const missingGlyphs = [...buildLog.matchAll(/Missing character:/g)].length;
const overfull = [...buildLog.matchAll(/Overfull \\hbox/g)].length;
check("PDF build reports no missing glyphs", missingGlyphs === 0, `${missingGlyphs}`);
check("PDF build reports no overfull boxes", overfull === 0, `${overfull}`);

const report = {
  generated_at: new Date().toISOString(),
  pdf: "_output/pdf/auto-mechanic-fa.pdf",
  pages,
  page_size_points: { width, height },
  rendered_pages: expectedPages,
  contact_sheets: contactSheets.map((file) => file.slice(root.length + 1)),
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
