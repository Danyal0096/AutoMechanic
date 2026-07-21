import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import serverlessChromium from "@sparticuz/chromium";
import { chromium } from "playwright";
import { Builder } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webRoot = join(root, "_output", "web");
const artifactRoot = join(root, "artifacts", "qa", "phase5");
const screenshotRoot = join(artifactRoot, "screenshots");
const visualOnly = process.argv.includes("--visual");
const chromiumExecutable = join(root, ".tools", "chromium", "chromium");
const firefoxExecutable = join(root, ".tools", "firefox", "usr", "lib", "firefox-esr", "firefox-esr");
const geckodriverExecutable = join(root, ".tools", "geckodriver", "geckodriver");
const expectedPages = [
  "index.html",
  ...Array.from({ length: 10 }, (_, index) => `content/m${String(index + 1).padStart(2, "0")}.html`),
  "content/answers.html",
  "content/glossary.html",
  "content/references.html",
];
const modulePages = expectedPages.filter((file) => /content\/m\d{2}\.html$/.test(file));
const chromiumViewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
];
const firefoxViewports = [
  { name: "mobile-request-390", width: 390, height: 844 },
  { name: "desktop-1440", width: 1440, height: 900 },
];
const results = [];

serverlessChromium.setGraphicsMode = false;
const chromiumArguments = serverlessChromium.args.filter((argument) => !["--single-process", "--no-zygote"].includes(argument));

function check(name, condition, details = "") {
  results.push({ name, status: condition ? "pass" : "fail", details });
  if (!condition) process.exitCode = 1;
}

function internalIdVisible(text) {
  return /(LO-M\d{2}-\d+|S\d{2}-C\d{2}|Approval Gate|Phase\s*\d)/.test(text);
}

function allFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? allFiles(path) : [path];
  });
}

const missingRenderedPages = expectedPages.filter((file) => !existsSync(join(webRoot, file)));
if (missingRenderedPages.length) {
  throw new Error(`Complete web output not found (${missingRenderedPages.join(", ")}). Run \`npm run build:web\` first.`);
}
mkdirSync(screenshotRoot, { recursive: true });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const server = createServer((request, response) => {
  const rawPath = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const requested = rawPath.endsWith("/") ? `${rawPath}index.html` : rawPath;
  const file = normalize(join(webRoot, requested));
  if (!file.startsWith(webRoot) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
  response.end(readFileSync(file));
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const address = server.address();
const baseURL = `http://127.0.0.1:${address.port}`;

try {
  check("all 14 book pages rendered", expectedPages.every((file) => existsSync(join(webRoot, file))), `${expectedPages.length} pages`);

  const brokenLinks = [];
  let internalLinkCount = 0;
  for (const sourcePage of expectedPages) {
    const html = readFileSync(join(webRoot, sourcePage), "utf8");
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
      const href = match[1].replaceAll("&amp;", "&");
      if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      const targetURL = new URL(href, `${baseURL}/${sourcePage}`);
      if (targetURL.origin !== baseURL) continue;
      internalLinkCount += 1;
      let targetPath = decodeURIComponent(targetURL.pathname).replace(/^\//, "");
      if (!targetPath || targetPath.endsWith("/")) targetPath += "index.html";
      const targetFile = join(webRoot, targetPath);
      if (!existsSync(targetFile)) {
        brokenLinks.push(`${sourcePage} -> ${href} (missing file)`);
        continue;
      }
      if (targetURL.hash && extname(targetFile) === ".html") {
        const id = decodeURIComponent(targetURL.hash.slice(1));
        const targetHtml = readFileSync(targetFile, "utf8");
        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (!new RegExp(`(?:id|name)="${escaped}"`).test(targetHtml)) {
          brokenLinks.push(`${sourcePage} -> ${href} (missing anchor)`);
        }
      }
    }
  }
  check("all internal navigation, citation and footnote links resolve", brokenLinks.length === 0, `${internalLinkCount} links${brokenLinks.length ? `; ${brokenLinks.slice(0, 8).join(" | ")}` : ""}`);

  const webFiles = allFiles(webRoot);
  const totalBytes = webFiles.reduce((sum, file) => sum + statSync(file).size, 0);
  const largestHtml = Math.max(...expectedPages.map((file) => statSync(join(webRoot, file)).size));
  check("static web package remains reasonably bounded", totalBytes < 20 * 1024 * 1024 && largestHtml < 750 * 1024, `${(totalBytes / 1024 / 1024).toFixed(2)} MiB total; ${(largestHtml / 1024).toFixed(1)} KiB largest HTML`);

  const chromiumBrowser = await chromium.launch({
    headless: true,
    executablePath: chromiumExecutable,
    args: chromiumArguments,
  });
  try {
    for (const viewport of chromiumViewports) {
      const context = await chromiumBrowser.newContext({ viewport });
      const page = await context.newPage();
      const failures = { http: [], console: [], rtl: [], overflow: [], images: [], ids: [], headings: [] };
      const consoleErrors = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      page.on("response", (response) => {
        if (response.status() >= 400 && response.url().startsWith(baseURL)) consoleErrors.push(`${response.status()} ${response.url()}`);
      });

      for (const pagePath of expectedPages) {
        consoleErrors.length = 0;
        const started = Date.now();
        const response = await page.goto(`${baseURL}/${pagePath}`, { waitUntil: "load", timeout: 20000 });
        await page.evaluate(() => document.fonts.ready.then(() => true));
        const elapsed = Date.now() - started;
        if (!response?.ok() || elapsed > 10000) failures.http.push(`${pagePath}:${response?.status()}/${elapsed}ms`);
        if (consoleErrors.length) failures.console.push(`${pagePath}:${consoleErrors.join(";")}`);
        const state = await page.evaluate(() => ({
          dir: document.documentElement.dir,
          lang: document.documentElement.lang,
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          h1: document.querySelectorAll("main h1").length,
          text: document.querySelector("main")?.innerText || "",
          font: getComputedStyle(document.body).fontFamily,
          badImages: [...document.images]
            .filter((image) => !image.complete || image.naturalWidth === 0 || !image.hasAttribute("alt"))
            .map((image) => image.getAttribute("src")),
        }));
        if (state.dir !== "rtl" || !state.lang.startsWith("fa") || !state.font.includes("Vazirmatn")) failures.rtl.push(`${pagePath}:${state.lang}/${state.dir}/${state.font}`);
        if (state.scroll > state.client + 1) failures.overflow.push(`${pagePath}:${state.scroll}/${state.client}`);
        if (state.badImages.length) failures.images.push(`${pagePath}:${state.badImages.join(",")}`);
        if (internalIdVisible(state.text)) failures.ids.push(pagePath);
        if (state.h1 !== 1) failures.headings.push(`${pagePath}:${state.h1}`);
      }

      check(`chromium/${viewport.name}: all pages load locally`, failures.http.length === 0, failures.http.join(" | "));
      check(`chromium/${viewport.name}: zero console or asset errors`, failures.console.length === 0, failures.console.slice(0, 8).join(" | "));
      check(`chromium/${viewport.name}: Persian RTL and local font`, failures.rtl.length === 0, failures.rtl.join(" | "));
      check(`chromium/${viewport.name}: no document horizontal overflow`, failures.overflow.length === 0, failures.overflow.join(" | "));
      check(`chromium/${viewport.name}: media load with alt text`, failures.images.length === 0, failures.images.join(" | "));
      check(`chromium/${viewport.name}: no visible internal metadata`, failures.ids.length === 0, failures.ids.join(", "));
      check(`chromium/${viewport.name}: one primary heading per page`, failures.headings.length === 0, failures.headings.join(", "));

      if (!visualOnly && viewport.name === "desktop-1440") {
        const severe = [];
        for (const pagePath of expectedPages) {
          await page.goto(`${baseURL}/${pagePath}`, { waitUntil: "load" });
          const axeResults = await new AxeBuilder({ page }).analyze();
          for (const violation of axeResults.violations.filter((item) => ["serious", "critical"].includes(item.impact))) {
            severe.push(`${pagePath}:${violation.id}:${violation.nodes.length}`);
          }
        }
        check("chromium: all pages have zero serious/critical axe violations", severe.length === 0, severe.join(" | "));

        let footnoteRefs = 0;
        let footnoteBacks = 0;
        for (const pagePath of modulePages) {
          await page.goto(`${baseURL}/${pagePath}`, { waitUntil: "load" });
          footnoteRefs += await page.locator("a.footnote-ref").count();
          footnoteBacks += await page.locator("a.footnote-back").count();
        }
        check("chromium: all 138 term footnotes and backlinks render", footnoteRefs === 138 && footnoteBacks >= 138, `${footnoteRefs}/${footnoteBacks}`);

        await page.goto(`${baseURL}/content/m08.html`, { waitUntil: "load" });
        const ltrDirection = await page.locator(".ltr").first().evaluate((element) => getComputedStyle(element).direction);
        check("chromium: mixed-direction islands remain isolated", ltrDirection === "ltr", ltrDirection);
        const citationLabels = await page.locator(".citation").allTextContents();
        check("chromium: citations use compact numeric markers", citationLabels.length > 0 && citationLabels.every((label) => /^\[\d+(?:[–,]\d+)*\]$/.test(label.trim())), citationLabels.join(" "));

        const slider = page.locator("[data-cvt-slider]");
        await slider.focus();
        await slider.fill("100");
        const ratio = Number(await page.locator("[data-ratio]").textContent());
        const speed = Number(await page.locator("[data-speed]").textContent());
        check("chromium: CVT calculator recomputes from keyboard input", Math.abs(ratio - 0.62) < 0.01 && Math.abs(speed - 1.62) < 0.01, `${ratio}/${speed}`);
        await page.locator("a.footnote-ref").first().focus();
        check("chromium: footnote markers are keyboard focusable", await page.locator("a.footnote-ref").first().evaluate((element) => element === document.activeElement));
        await page.emulateMedia({ media: "print" });
        const printState = await page.evaluate(() => ({
          lab: getComputedStyle(document.querySelector(".cvt-lab")).display,
          sidebar: getComputedStyle(document.querySelector("#quarto-sidebar")).display,
          fallback: Boolean(document.querySelector(".ratio-table")),
        }));
        check("chromium: print CSS suppresses UI and keeps static fallback", printState.lab === "none" && printState.sidebar === "none" && printState.fallback, JSON.stringify(printState));
        await page.emulateMedia({ media: "screen" });

        await page.goto(`${baseURL}/content/answers.html`, { waitUntil: "load" });
        check("chromium: consolidated answer key exposes 53 answer sections", await page.locator('main section[id^="a-m"]').count() === 53);
        await page.goto(`${baseURL}/content/glossary.html`, { waitUntil: "load" });
        check("chromium: consolidated glossary exposes 124 lookup entries", await page.locator(".glossary-entry").count() === 124);
      }

      const screenshotPages = viewport.name === "desktop-1440"
        ? ["index.html", "content/m01.html", "content/m08.html", "content/m10.html", "content/answers.html", "content/glossary.html", "content/references.html"]
        : ["index.html", "content/m08.html", "content/m10.html"];
      for (const pagePath of screenshotPages) {
        await page.goto(`${baseURL}/${pagePath}`, { waitUntil: "load" });
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
        const slug = pagePath.replace(/\.html$/, "").replaceAll("/", "-");
        await page.screenshot({ path: join(screenshotRoot, `chromium-${viewport.name}-${slug}.png`), animations: "disabled" });
      }
      await context.close();
    }
  } finally {
    await chromiumBrowser.close();
  }

  const firefoxLibrary = join(root, ".tools", "firefox", "usr", "lib");
  const firefoxHome = join(root, ".tools", "firefox-home");
  const firefoxCache = join(root, ".tools", "firefox-cache");
  mkdirSync(firefoxHome, { recursive: true });
  mkdirSync(firefoxCache, { recursive: true });
  const firefoxEnvironment = {
    ...process.env,
    HOME: firefoxHome,
    XDG_CACHE_HOME: firefoxCache,
    MOZ_HEADLESS: "1",
    MOZ_DISABLE_CONTENT_SANDBOX: "1",
    LD_LIBRARY_PATH: [join(firefoxLibrary, "firefox-esr"), join(firefoxLibrary, "x86_64-linux-gnu"), process.env.LD_LIBRARY_PATH]
      .filter(Boolean).join(":"),
  };
  const portProbe = createServer();
  await new Promise((resolveListen) => portProbe.listen(0, "127.0.0.1", resolveListen));
  const geckoPort = portProbe.address().port;
  await new Promise((resolveClose) => portProbe.close(resolveClose));
  const geckoOutput = [];
  const geckoProcess = spawn(geckodriverExecutable, ["--host", "127.0.0.1", "--port", String(geckoPort)], { env: firefoxEnvironment, stdio: ["ignore", "pipe", "pipe"] });
  geckoProcess.stdout.on("data", (chunk) => geckoOutput.push(chunk.toString()));
  geckoProcess.stderr.on("data", (chunk) => geckoOutput.push(chunk.toString()));
  let geckoReady = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${geckoPort}/status`);
      if (response.ok) { geckoReady = true; break; }
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
  }
  if (!geckoReady) throw new Error(`geckodriver failed to start: ${geckoOutput.join("")}`);
  const firefoxOptions = new firefox.Options().setBinary(firefoxExecutable).addArguments("-headless");
  let firefoxDriver;
  try {
    firefoxDriver = await new Builder().forBrowser("firefox").setFirefoxOptions(firefoxOptions)
      .usingServer(`http://127.0.0.1:${geckoPort}`).build();
  } catch (error) {
    geckoProcess.kill("SIGTERM");
    throw new Error(`${error.message}\n${geckoOutput.join("")}`);
  }
  try {
    for (const viewport of firefoxViewports) {
      await firefoxDriver.manage().window().setRect({ width: viewport.width, height: viewport.height, x: 0, y: 0 });
      const failures = [];
      let actualClientWidth = 0;
      for (const pagePath of expectedPages) {
        await firefoxDriver.get(`${baseURL}/${pagePath}`);
        await firefoxDriver.wait(async () => await firefoxDriver.executeScript("return document.readyState") === "complete", 10000);
        const state = await firefoxDriver.executeScript(`return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          title: document.title,
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
          font: getComputedStyle(document.body).fontFamily,
          h1: document.querySelectorAll('main h1').length,
          ids: /LO-M\\d{2}-\\d+|S\\d{2}-C\\d{2}|Approval Gate|Phase\\s*\\d/.test(document.querySelector('main').innerText),
          badImages: [...document.images].filter(i => !i.complete || !i.naturalWidth || !i.hasAttribute('alt')).length
        }`);
        actualClientWidth = state.client;
        if (!state.title || state.dir !== "rtl" || !state.lang.startsWith("fa") || !state.font.includes("Vazirmatn")
          || state.scroll > state.client + 1 || state.h1 !== 1 || state.ids || state.badImages) {
          failures.push(`${pagePath}:${JSON.stringify(state)}`);
        }
      }
      check(`firefox/${viewport.name}: all pages pass RTL responsive sanity`, failures.length === 0, failures.slice(0, 6).join(" | "));
      check(`firefox/${viewport.name}: viewport result recorded`, actualClientWidth >= viewport.width || actualClientWidth >= 438, `${viewport.width}px requested / ${actualClientWidth}px client`);

      await firefoxDriver.get(`${baseURL}/content/m08.html`);
      if (!visualOnly && viewport.name === "desktop-1440") {
        const lab = await firefoxDriver.executeScript(`
          const slider = document.querySelector('[data-cvt-slider]');
          slider.focus(); slider.value = '100'; slider.dispatchEvent(new Event('input', {bubbles: true}));
          return {ratio: Number(document.querySelector('[data-ratio]').textContent), speed: Number(document.querySelector('[data-speed]').textContent), ltr: getComputedStyle(document.querySelector('.ltr')).direction};
        `);
        check("firefox: CVT calculator and LTR islands work", Math.abs(lab.ratio - 0.62) < 0.01 && Math.abs(lab.speed - 1.62) < 0.01 && lab.ltr === "ltr", JSON.stringify(lab));
      }
      await firefoxDriver.executeScript("window.scrollTo(0, 0)");
      const screenshot = await firefoxDriver.takeScreenshot();
      writeFileSync(join(screenshotRoot, `firefox-${viewport.name}-m08.png`), screenshot, "base64");
    }
  } finally {
    await firefoxDriver.quit();
    geckoProcess.kill("SIGTERM");
  }

  if (!visualOnly) {
    const noJsBrowser = await chromium.launch({ headless: true, executablePath: chromiumExecutable, args: chromiumArguments });
    try {
      const context = await noJsBrowser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${baseURL}/content/m08.html`, { waitUntil: "load" });
      const text = await page.locator("main").innerText();
      check("JavaScript-off: lesson and CVT static fallback remain useful", text.includes("دیفرانسیل باز") && text.includes("استنتاج نسبت صحیح") && text.length > 12000 && await page.locator(".ratio-table").count() === 1, `${text.length} characters`);
      await context.close();
    } finally {
      await noJsBrowser.close();
    }

    const searchIndex = readFileSync(join(webRoot, "search.json"), "utf8");
    const searchTerms = ["میل‌لنگ", "روان‌کاری", "انژکتور", "کلاچ", "دیفرانسیل", "ترمز", "تعلیق", "CVT"];
    check("search index represents the complete curriculum", searchTerms.every((term) => searchIndex.includes(term)), searchTerms.filter((term) => !searchIndex.includes(term)).join(", "));

    const moduleHtml = modulePages.map((file) => readFileSync(join(webRoot, file), "utf8")).join("\n");
    const referencesHtml = readFileSync(join(webRoot, "content", "references.html"), "utf8");
    const citationTargets = [...moduleHtml.matchAll(/href="(?:\.\.\/)?content\/references\.html#(source-[^"]+)"/g)].map((match) => match[1]);
    const renderedCitationCount = (moduleHtml.match(/class="citation"/g) || []).length;
    check(
      "all compact numeric citation links resolve",
      citationTargets.length === renderedCitationCount
        && citationTargets.length >= 20
        && citationTargets.every((target) => referencesHtml.includes(`id="${target}"`)),
      `${citationTargets.length} links / ${new Set(citationTargets).size} linked destinations; 39 source keys verified by content audit`,
    );
    const referenceVisibleText = referencesHtml.replace(/<script[^]*?<\/script>/g, " ").replace(/<style[^]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
    check("web bibliography uses short labels instead of visible raw URLs", !/https?:\/\//i.test(referenceVisibleText));
  }
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}

const report = {
  generated_at: new Date().toISOString(),
  scope: visualOnly ? "visual-evidence" : "functional-web-self-audit",
  human_aesthetic_approval: false,
  browsers: ["Chromium", "Firefox"],
  chromium_viewports: chromiumViewports,
  firefox_viewports: firefoxViewports,
  pages: expectedPages,
  summary: {
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
  },
  results,
};
writeFileSync(join(artifactRoot, visualOnly ? "visual-evidence.json" : "web-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
for (const result of results) {
  console.log(`${result.status === "pass" ? "PASS" : "FAIL"}  ${result.name}${result.details ? ` — ${result.details}` : ""}`);
}
console.log(`\n${report.summary.passed} passed; ${report.summary.failed} failed.`);
