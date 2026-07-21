import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requested = process.argv[2] ?? "all";

if (!new Set(["web", "pdf", "all"]).has(requested)) {
  throw new Error("Target must be web, pdf, or all.");
}

function commandExists(command) {
  const result = spawnSync("bash", ["-lc", `command -v "${command}"`], {
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : "";
}

function findQuarto() {
  const candidates = [
    process.env.QUARTO_BIN,
    join(root, ".tools", "quarto", "bin", "quarto"),
    commandExists("quarto"),
  ].filter(Boolean);

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("Quarto not found. Run `npm run bootstrap:tools` or set QUARTO_BIN.");
  }
  return found;
}

function pdfEnvironment(artifactDirectory, workDirectory) {
  const bundledTexmf = join(
    root,
    ".tools",
    "texlive-lang-arabic",
    "usr",
    "share",
    "texlive",
    "texmf-dist",
  );
  const texmf = process.env.TEXMFHOME || (existsSync(bundledTexmf) ? bundledTexmf : "");
  const realXeLaTeX = process.env.AUTO_MECHANIC_REAL_XELATEX || commandExists("xelatex");
  if (!realXeLaTeX) {
    throw new Error("XeLaTeX not found. Install TeX Live 2023 or set AUTO_MECHANIC_REAL_XELATEX.");
  }
  const env = {
    ...process.env,
    AUTO_MECHANIC_REAL_XELATEX: realXeLaTeX,
    AUTO_MECHANIC_XELATEX_LOG: join(artifactDirectory, "xelatex-console.log"),
    AUTO_MECHANIC_XELATEX_DETAIL_LOG: join(artifactDirectory, "xelatex-detail.log"),
    AUTO_MECHANIC_XELATEX_WORKDIR: workDirectory,
    OSFONTDIR: `${join(root, "assets", "fonts")}//`,
    PATH: [
      join(root, "scripts", "bin"),
      join(root, ".tools", "rsvg", "usr", "bin"),
      process.env.PATH || "",
    ].join(":"),
  };

  if (texmf) env.TEXMFHOME = texmf;

  const probe = spawnSync("kpsewhich", ["xepersian.sty"], {
    cwd: root,
    env,
    encoding: "utf8",
  });
  if (probe.status !== 0 || !probe.stdout.trim()) {
    throw new Error("XePersian not found. Run `npm run bootstrap:tools` or set TEXMFHOME.");
  }
  return env;
}

function render(format) {
  const quarto = findQuarto();
  const outputDir = format === "html" ? "_output/web" : "_output/pdf";
  const localHome = join(root, ".tools", "home");
  const localCache = join(root, ".tools", "cache-runtime");
  const artifactDirectory = join(root, "artifacts", "qa", "phase5");
  mkdirSync(localHome, { recursive: true });
  mkdirSync(localCache, { recursive: true });
  mkdirSync(artifactDirectory, { recursive: true });
  const pdfWorkDirectory = format === "pdf"
    ? mkdtempSync(join(tmpdir(), "auto-mechanic-xelatex-"))
    : "";
  if (format === "pdf") {
    writeFileSync(join(artifactDirectory, "xelatex-console.log"), "");
    writeFileSync(join(artifactDirectory, "xelatex-detail.log"), "");
    for (const generated of ["index.aux", "index.log", "index.out", "index.pdf", "index.toc"]) {
      rmSync(join(root, generated), { force: true });
    }
  }
  const env = {
    ...(format === "pdf" ? pdfEnvironment(artifactDirectory, pdfWorkDirectory) : process.env),
    HOME: localHome,
    XDG_CACHE_HOME: localCache,
    DENO_DIR: join(localCache, "deno"),
    QUARTO_PANDOC: process.env.QUARTO_PANDOC || join(root, ".tools", "pandoc", "bin", "pandoc"),
    SOURCE_DATE_EPOCH: process.env.SOURCE_DATE_EPOCH || "0",
    FORCE_SOURCE_DATE: "1",
  };
  const result = spawnSync(
    quarto,
    ["render", "--to", format, "--output-dir", outputDir],
    { cwd: root, env, encoding: "utf8" },
  );
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  writeFileSync(
    join(artifactDirectory, `build-${format}.log`),
    `${result.stdout || ""}${result.stderr || ""}`,
  );
  if (format === "pdf") {
    for (const extension of ["log", "aux", "toc", "out"]) {
      const source = join(pdfWorkDirectory, `index.${extension}`);
      if (existsSync(source)) {
        copyFileSync(source, join(artifactDirectory, `latex-index.${extension}`));
      }
    }
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
  const expected = format === "html"
    ? join(root, outputDir, "index.html")
    : join(root, outputDir, "auto-mechanic-fa.pdf");
  if (!existsSync(expected)) {
    throw new Error(`Quarto exited without producing ${expected}. See build-${format}.log.`);
  }
  if (format === "pdf") rmSync(pdfWorkDirectory, { recursive: true, force: true });
}

if (requested === "web" || requested === "all") render("html");
if (requested === "pdf" || requested === "all") render("pdf");
