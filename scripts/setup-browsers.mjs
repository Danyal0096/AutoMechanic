import { copyFileSync, createReadStream, createWriteStream, existsSync, mkdirSync, chmodSync, lstatSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { createBrotliDecompress } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@sparticuz", "chromium", "bin", "chromium.br");
const targetDirectory = join(root, ".tools", "chromium");
const target = join(targetDirectory, "chromium");

if (!existsSync(source)) {
  throw new Error("@sparticuz/chromium is missing. Run `npm install` first.");
}

mkdirSync(targetDirectory, { recursive: true });
if (!existsSync(target)) {
  await pipeline(
    createReadStream(source),
    createBrotliDecompress({ chunkSize: 2 ** 21 }),
    createWriteStream(target, { mode: 0o755 }),
  );
}
chmodSync(target, 0o755);

const swiftShaderMarker = join(targetDirectory, "libGLESv2.so");
if (!existsSync(swiftShaderMarker)) {
  const swiftShaderSource = join(root, "node_modules", "@sparticuz", "chromium", "bin", "swiftshader.tar.br");
  const temporaryTar = join(targetDirectory, "swiftshader.tar");
  await pipeline(
    createReadStream(swiftShaderSource),
    createBrotliDecompress({ chunkSize: 2 ** 21 }),
    createWriteStream(temporaryTar),
  );
  const extraction = spawnSync("tar", ["--no-same-owner", "-xf", temporaryTar, "-C", targetDirectory], { stdio: "inherit" });
  unlinkSync(temporaryTar);
  if (extraction.status !== 0) process.exit(extraction.status ?? 1);
}

const firefoxLibrary = join(root, ".tools", "firefox", "usr", "lib", "x86_64-linux-gnu");
for (const [linkName, targetName] of [
  ["libevent-2.1.so.7", "libevent-2.1.so.7.0.1"],
  ["libvpx.so.7", "libvpx.so.7.1.0"],
]) {
  const destination = join(firefoxLibrary, linkName);
  if (existsSync(destination) || (() => { try { return lstatSync(destination).isSymbolicLink(); } catch { return false; } })()) {
    if (!lstatSync(destination).isSymbolicLink()) continue;
    unlinkSync(destination);
  }
  // Copy instead of a relative symlink: the managed workspace rewrites
  // cross-command symlinks, while the dynamic loader needs these SONAMEs.
  copyFileSync(join(firefoxLibrary, targetName), destination);
}

const required = [
  join(root, ".tools", "firefox", "usr", "lib", "firefox-esr", "firefox-esr"),
  join(root, ".tools", "geckodriver", "geckodriver"),
];
if (!required.every((file) => existsSync(file))) {
  throw new Error("Firefox tools are missing. Run `npm run bootstrap:tools` first.");
}

console.log("Chromium and Firefox browser tools are ready.");
