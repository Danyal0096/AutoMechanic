import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data", "glossary.yml");
const outputPath = join(root, "content", "glossary.qmd");
const data = YAML.parse(readFileSync(dataPath, "utf8"));

if (data?.scope !== "book" || !Array.isArray(data.terms)) {
  throw new Error("data/glossary.yml must contain a book-scoped terms array.");
}

const ids = new Set();
for (const term of data.terms) {
  if (!term.id || !term.fa || !term.en || !term.definition) {
    throw new Error(`Incomplete glossary record: ${JSON.stringify(term)}`);
  }
  if (ids.has(term.id)) throw new Error(`Duplicate glossary id: ${term.id}`);
  ids.add(term.id);
}

const terms = [...data.terms].sort((a, b) =>
  a.fa.localeCompare(b.fa, "fa", { sensitivity: "base" }),
);

const blocks = terms.map((term) => [
  "::: {.glossary-entry}",
  `**${term.fa}** — [${term.en}]{.ltr}: ${term.definition}`,
  ":::",
].join("\n"));

const header = [
  "---",
  'title: "واژه‌نامهٔ فارسی–انگلیسی"',
  'description: "صورت معیار و تعریف کوتاه اصطلاحات فنی کتاب"',
  "---",
  "",
  "این واژه‌نامه برای مراجعهٔ سریع است. معادل انگلیسی هر اصطلاح در نخستین کاربرد",
  "فصل نیز آمده است؛ تعریف‌های این صفحه کوتاه‌اند و جای توضیح سامانه‌ای فصل را نمی‌گیرند.",
  "",
  ":::: {.glossary-compact}",
  "",
].join("\n");
const rendered = `${header}${blocks.join("\n\n")}\n\n::::\n`;

if (process.argv.includes("--check")) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== rendered) {
    throw new Error("content/glossary.qmd is out of sync; run npm run generate:glossary.");
  }
} else {
  writeFileSync(outputPath, rendered);
}
