import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = join(root, ".tools", "quarto", "bin", "quarto");
const quarto = process.env.QUARTO_BIN || (existsSync(local) ? local : "quarto");
const localHome = join(root, ".tools", "home");
const localCache = join(root, ".tools", "cache-runtime");
mkdirSync(localHome, { recursive: true });
mkdirSync(localCache, { recursive: true });
const result = spawnSync(quarto, ["preview", "--to", "html"], {
  cwd: root,
  env: {
    ...process.env,
    HOME: localHome,
    XDG_CACHE_HOME: localCache,
    DENO_DIR: join(localCache, "deno"),
    QUARTO_PANDOC: process.env.QUARTO_PANDOC || join(root, ".tools", "pandoc", "bin", "pandoc"),
  },
  stdio: "inherit",
});
process.exit(result.status ?? 1);
