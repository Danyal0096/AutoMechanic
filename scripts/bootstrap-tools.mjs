import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tools = join(root, ".tools");
const cache = join(tools, "cache");
mkdirSync(cache, { recursive: true });

const packages = {
  quarto: {
    url: "https://github.com/quarto-dev/quarto-cli/releases/download/v1.9.38/quarto-1.9.38-linux-amd64.tar.gz",
    file: "quarto-1.9.38-linux-amd64.tar.gz",
    sha256: "ea8c897368791ad9f200010c087ea3111b2e556b12a960487dd4e216902aa102",
  },
  pandoc: {
    url: "https://github.com/jgm/pandoc/releases/download/3.8.3/pandoc-3.8.3-linux-amd64.tar.gz",
    file: "pandoc-3.8.3-linux-amd64.tar.gz",
    sha256: "c224fab89f827d3623380ecb7c1078c163c769c849a14ac27e8d3bfbb914c9b4",
  },
  xepersian: {
    url: "https://deb.debian.org/debian/pool/main/t/texlive-lang/texlive-lang-arabic_2022.20230122-1_all.deb",
    file: "texlive-lang-arabic_2022.20230122-1_all.deb",
    sha256: "f19fc0968f7a72482a974de53d655a9de529a0402cf0f37a79a1f8191647f5f2",
  },
  qpdf: {
    url: "https://archive.ubuntu.com/ubuntu/pool/universe/q/qpdf/qpdf_11.9.0-1.1ubuntu0.1_amd64.deb",
    file: "qpdf_11.9.0-1.1ubuntu0.1_amd64.deb",
    sha256: "b50d1aca530cd8f7b68214f8b19bdf348c6c01b7110ca1c335e6662cdb442af8",
  },
  rsvg: {
    url: "https://deb.debian.org/debian/pool/main/libr/librsvg/librsvg2-bin_2.54.7+dfsg-1~deb12u1_amd64.deb",
    file: "librsvg2-bin_2.54.7+dfsg-1~deb12u1_amd64.deb",
    sha256: "2199db95318c03dd139e12477f410bffa910ef0c999aebf6acae18c7cd16487b",
  },
  firefox: {
    url: "https://deb.debian.org/debian/pool/main/f/firefox-esr/firefox-esr_140.12.0esr-1~deb12u1_amd64.deb",
    file: "firefox-esr_140.12.0esr-1~deb12u1_amd64.deb",
    sha256: "ce50b83e3cb81b0908346f555fabb679646baefe24a3270913347a9b52615647",
  },
  libevent: {
    url: "https://deb.debian.org/debian/pool/main/libe/libevent/libevent-2.1-7_2.1.12-stable-8_amd64.deb",
    file: "libevent-2.1-7_2.1.12-stable-8_amd64.deb",
    sha256: "ca8858a7095ade7776c9f73437812423a45ccd90de2079e8c34830d291df290f",
  },
  libvpx: {
    url: "https://deb.debian.org/debian/pool/main/libv/libvpx/libvpx7_1.12.0-1+deb12u5_amd64.deb",
    file: "libvpx7_1.12.0-1+deb12u5_amd64.deb",
    sha256: "7d8fada67fc9e11a08304499fe5beb7f809194d284202b9c9f1a0b8e54b90db4",
  },
  geckodriver: {
    url: "https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-linux64.tar.gz",
    file: "geckodriver-v0.36.0-linux64.tar.gz",
    sha256: "0bde38707eb0a686a20c6bd50f4adcc7d60d4f73c60eb83ee9e0db8f65823e04",
  },
};

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

async function download(specification) {
  const destination = join(cache, specification.file);
  if (existsSync(destination) && sha256(destination) === specification.sha256) {
    return destination;
  }

  const temporary = `${destination}.partial-${process.pid}`;
  const response = await fetch(specification.url, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}) for ${specification.url}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  const actual = sha256(temporary);
  if (actual !== specification.sha256) {
    throw new Error(`Checksum mismatch for ${specification.file}: ${actual}`);
  }
  renameSync(temporary, destination);
  return destination;
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const quartoTarget = join(tools, "quarto");
if (!existsSync(join(quartoTarget, "bin", "quarto"))) {
  const archive = await download(packages.quarto);
  const temporary = join(tools, `quarto.extract-${process.pid}`);
  mkdirSync(temporary, { recursive: false });
  run("tar", ["--no-same-owner", "-xzf", archive, "-C", temporary, "--strip-components=1"]);
  renameSync(temporary, quartoTarget);
}

const pandocTarget = join(tools, "pandoc");
if (!existsSync(join(pandocTarget, "bin", "pandoc"))) {
  const archive = await download(packages.pandoc);
  const temporary = join(tools, `pandoc.extract-${process.pid}`);
  mkdirSync(temporary, { recursive: false });
  run("tar", ["--no-same-owner", "-xzf", archive, "-C", temporary, "--strip-components=1"]);
  renameSync(temporary, pandocTarget);
}

const texTarget = join(tools, "texlive-lang-arabic");
const xepersianProbe = join(
  texTarget,
  "usr",
  "share",
  "texlive",
  "texmf-dist",
  "tex",
  "xelatex",
  "xepersian",
  "xepersian.sty",
);
if (!existsSync(xepersianProbe)) {
  const archive = await download(packages.xepersian);
  const temporary = join(tools, `tex.extract-${process.pid}`);
  mkdirSync(temporary, { recursive: false });
  run("dpkg-deb", ["-x", archive, temporary]);
  renameSync(temporary, texTarget);
}

const qpdfTarget = join(tools, "qpdf");
if (!existsSync(join(qpdfTarget, "usr", "bin", "qpdf"))) {
  const archive = await download(packages.qpdf);
  const temporary = join(tools, `qpdf.extract-${process.pid}`);
  mkdirSync(temporary, { recursive: false });
  run("dpkg-deb", ["-x", archive, temporary]);
  renameSync(temporary, qpdfTarget);
}

const rsvgTarget = join(tools, "rsvg");
if (!existsSync(join(rsvgTarget, "usr", "bin", "rsvg-convert"))) {
  const archive = await download(packages.rsvg);
  const temporary = join(tools, `rsvg.extract-${process.pid}`);
  mkdirSync(temporary, { recursive: false });
  run("dpkg-deb", ["-x", archive, temporary]);
  renameSync(temporary, rsvgTarget);
}

const firefoxTarget = join(tools, "firefox");
if (!existsSync(join(firefoxTarget, "usr", "lib", "firefox-esr", "firefox-esr"))) {
  const temporary = join(tools, `firefox.extract-${process.pid}`);
  mkdirSync(temporary, { recursive: false });
  for (const specification of [packages.firefox, packages.libevent, packages.libvpx]) {
    const archive = await download(specification);
    run("dpkg-deb", ["-x", archive, temporary]);
  }
  renameSync(temporary, firefoxTarget);
}

const geckodriverTarget = join(tools, "geckodriver");
if (!existsSync(join(geckodriverTarget, "geckodriver"))) {
  const archive = await download(packages.geckodriver);
  const temporary = join(tools, `geckodriver.extract-${process.pid}`);
  mkdirSync(temporary, { recursive: false });
  run("tar", ["--no-same-owner", "-xzf", archive, "-C", temporary]);
  renameSync(temporary, geckodriverTarget);
}

writeFileSync(
  join(tools, "VERSIONS.txt"),
  [
    "Quarto 1.9.38",
    "Pandoc 3.8.3 (explicit executable; avoids host-version drift)",
    "texlive-lang-arabic 2022.20230122-1 (XePersian 24.8)",
    "qpdf 11.9.0-1.1ubuntu0.1 (host libqpdf29t64 required)",
    "rsvg-convert 2.54.7 (uses host librsvg ABI)",
    "Firefox ESR 140.12.0esr (Debian 12 build) + geckodriver 0.36.0",
    "Use the host XeLaTeX engine; verified baseline: TeX Live 2023.",
    "",
  ].join("\n"),
);

console.log("Tool bootstrap complete.");
