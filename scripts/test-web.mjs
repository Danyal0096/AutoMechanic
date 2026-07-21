import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import serverlessChromium from "@sparticuz/chromium";
import { chromium } from "playwright";
import { Builder } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webRoot = join(root, "_output", "web");
const artifactRoot = join(root, "artifacts", "qa", "phase3");
const screenshotRoot = join(artifactRoot, "screenshots");
const visualOnly = process.argv.includes("--visual");
const chromiumExecutable = join(root, ".tools", "chromium", "chromium");
const firefoxExecutable = join(root, ".tools", "firefox", "usr", "lib", "firefox-esr", "firefox-esr");
const geckodriverExecutable = join(root, ".tools", "geckodriver", "geckodriver");
serverlessChromium.setGraphicsMode = false;
const chromiumArguments = serverlessChromium.args.filter((argument) => !["--single-process", "--no-zygote"].includes(argument));

if (!existsSync(join(webRoot, "content", "m08.html"))) {
  throw new Error("Web output not found. Run `npm run build:web` first.");
}
mkdirSync(screenshotRoot, { recursive: true });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
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

const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
];
const results = [];

function check(name, condition, details = "") {
  results.push({ name, status: condition ? "pass" : "fail", details });
  if (!condition) process.exitCode = 1;
}

try {
  const chromiumBrowser = await chromium.launch({
    headless: true,
    executablePath: chromiumExecutable,
    args: chromiumArguments,
  });
  try {
    for (const viewport of viewports) {
      const context = await chromiumBrowser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      const response = await page.goto(`${baseURL}/content/m08.html`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready.then(() => true));
      check(`chromium/${viewport.name}: HTTP success`, response?.ok() === true, `${response?.status()}`);
      check(`chromium/${viewport.name}: no console errors`, errors.length === 0, errors.join(" | "));

      const direction = await page.locator("html").getAttribute("dir");
      const language = await page.locator("html").getAttribute("lang");
      check(`chromium/${viewport.name}: Persian RTL root`, direction === "rtl" && language?.startsWith("fa"), `${language}/${direction}`);

      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll("body *")]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return !element.closest(".table-responsive")
              && (rect.left < -1 || rect.right > document.documentElement.clientWidth + 1);
          })
          .slice(0, 8)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const section = element.closest("section")?.id || "no-section";
            const text = (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 34);
            return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}.${[...element.classList].join(".")}@${Math.round(rect.left)}..${Math.round(rect.right)}[${section}](${text})`;
          }),
      }));
      check(
        `chromium/${viewport.name}: no document horizontal overflow`,
        overflow.scroll <= overflow.client + 1,
        `${overflow.scroll}/${overflow.client}${overflow.offenders.length ? ` — ${overflow.offenders.join(", ")}` : ""}`,
      );

      const imageFailures = await page.locator("img").evaluateAll((images) => images
        .filter((image) => !image.complete || image.naturalWidth === 0 || !image.hasAttribute("alt"))
        .map((image) => image.getAttribute("src")));
      check(`chromium/${viewport.name}: images load with alt text`, imageFailures.length === 0, imageFailures.join(", "));

      const computedFont = await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily);
      check(`chromium/${viewport.name}: local Persian font applied`, computedFont.includes("Vazirmatn"), computedFont);

      if (!visualOnly && viewport.name === "desktop-1440") {
          const headingCount = await page.locator("main h1").count();
          check(`chromium: one primary module heading`, headingCount === 1, `${headingCount}`);

          const footnotes = await page.locator("a.footnote-ref").count();
          const backrefs = await page.locator("a.footnote-back").count();
          check(`chromium: footnotes and backlinks rendered`, footnotes === 18 && backrefs >= 18, `${footnotes}/${backrefs}`);

          const ltrDirection = await page.locator(".ltr").first().evaluate((element) => getComputedStyle(element).direction);
          check(`chromium: LTR islands are isolated`, ltrDirection === "ltr", ltrDirection);

          const anchorCount = await page.locator("#m08-cvt-ratio, #m08-differential, #m08-assessment").count();
          check(`chromium: deep anchors resolve`, anchorCount === 3, `${anchorCount}`);

          const axeResults = await new AxeBuilder({ page }).analyze();
          const severe = axeResults.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
          const citationStyle = await page.locator('a[role="doc-biblioref"]').first().evaluate((element) => {
            const style = getComputedStyle(element);
            return `${style.color}; ${style.textDecorationLine}; ${style.textDecorationStyle}; ${style.fontWeight}`;
          });
          check(
            `chromium: axe serious/critical violations`,
            severe.length === 0,
            severe.map((violation) => {
              const targets = violation.nodes.slice(0, 4).map((node) => node.target.join(" ")).join(" | ");
              return `${violation.id}:${violation.nodes.length} [${targets}]`;
            }).join(", ") + (severe.length ? ` — citation style: ${citationStyle}` : ""),
          );

          const slider = page.locator("[data-cvt-slider]");
          await slider.focus();
          await slider.fill("100");
          const ratio = Number(await page.locator("[data-ratio]").textContent());
          const speed = Number(await page.locator("[data-speed]").textContent());
          check(`chromium: CVT lab recomputes from keyboard control`, Math.abs(ratio - 0.62) < 0.01 && Math.abs(speed - 1.62) < 0.01, `${ratio}/${speed}`);

          await page.locator("a.footnote-ref").first().focus();
          check(`chromium: footnote marker is keyboard focusable`, await page.locator("a.footnote-ref").first().evaluate((element) => element === document.activeElement));

          const printVisible = await page.evaluate(() => {
            const lab = document.querySelector(".cvt-lab");
            return lab ? getComputedStyle(lab).display : "missing";
          });
          check(`chromium: interactive lab visible on screen`, printVisible !== "none", printVisible);
          await page.emulateMedia({ media: "print" });
          const printHidden = await page.locator(".cvt-lab").evaluate((element) => getComputedStyle(element).display === "none");
          check(`chromium: interactive lab suppressed in print fallback`, printHidden);
          await page.emulateMedia({ media: "screen" });
      }

      // Functional checks intentionally move focus and scroll (footnotes, slider).
      // Reload before the visual baseline so the "top" artifact is genuinely the
      // chapter opening and contains no transient focus/popover state.
      await page.goto(`${baseURL}/content/m08.html`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await page.evaluate(() => {
        history.scrollRestoration = "manual";
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
      await page.screenshot({ path: join(screenshotRoot, `chromium-${viewport.name}-top.png`), animations: "disabled" });
      if (["mobile-390", "desktop-1440"].includes(viewport.name)) {
        await page.locator(".cvt-lab").screenshot({ path: join(screenshotRoot, `chromium-${viewport.name}-cvt-lab.png`), animations: "disabled" });
        await page.locator("#fig-differential-kinematics").screenshot({ path: join(screenshotRoot, `chromium-${viewport.name}-differential.png`), animations: "disabled" });
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
    LD_LIBRARY_PATH: [
      join(firefoxLibrary, "firefox-esr"),
      join(firefoxLibrary, "x86_64-linux-gnu"),
      process.env.LD_LIBRARY_PATH,
    ].filter(Boolean).join(":"),
  };
  const portProbe = createServer();
  await new Promise((resolveListen) => portProbe.listen(0, "127.0.0.1", resolveListen));
  const geckoPort = portProbe.address().port;
  await new Promise((resolveClose) => portProbe.close(resolveClose));
  const geckoOutput = [];
  const geckoProcess = spawn(
    geckodriverExecutable,
    ["--host", "127.0.0.1", "--port", String(geckoPort)],
    { env: firefoxEnvironment, stdio: ["ignore", "pipe", "pipe"] },
  );
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
    firefoxDriver = await new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(firefoxOptions)
      .usingServer(`http://127.0.0.1:${geckoPort}`)
      .build();
  } catch (error) {
    geckoProcess.kill("SIGTERM");
    throw new Error(`${error.message}\n${geckoOutput.join("")}`);
  }
  try {
    for (const viewport of viewports) {
      await firefoxDriver.manage().window().setRect({ width: viewport.width, height: viewport.height, x: 0, y: 0 });
      await firefoxDriver.get(`${baseURL}/content/m08.html`);
      await firefoxDriver.wait(async () => await firefoxDriver.executeScript("return document.readyState") === "complete", 10000);

      const rootState = await firefoxDriver.executeScript("return {lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title}");
      check(`firefox/${viewport.name}: page loaded`, rootState.title.includes("گرداننده"), rootState.title);
      check(`firefox/${viewport.name}: Persian RTL root`, rootState.dir === "rtl" && rootState.lang.startsWith("fa"), `${rootState.lang}/${rootState.dir}`);

      const overflow = await firefoxDriver.executeScript("return {scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth}");
      check(`firefox/${viewport.name}: no document horizontal overflow`, overflow.scroll <= overflow.client + 1, `${overflow.scroll}/${overflow.client}`);
      const imageFailures = await firefoxDriver.executeScript("return [...document.images].filter(i => !i.complete || !i.naturalWidth || !i.hasAttribute('alt')).map(i => i.src)");
      check(`firefox/${viewport.name}: images load with alt text`, imageFailures.length === 0, imageFailures.join(", "));
      const computedFont = await firefoxDriver.executeScript("return getComputedStyle(document.body).fontFamily");
      check(`firefox/${viewport.name}: local Persian font applied`, computedFont.includes("Vazirmatn"), computedFont);

      if (!visualOnly && viewport.name === "desktop-1440") {
        const details = await firefoxDriver.executeScript(`return {
          h1: document.querySelectorAll('main h1').length,
          footnotes: document.querySelectorAll('a.footnote-ref').length,
          backrefs: document.querySelectorAll('a.footnote-back').length,
          ltr: getComputedStyle(document.querySelector('.ltr')).direction,
          anchors: document.querySelectorAll('#m08-cvt-ratio, #m08-differential, #m08-assessment').length
        }`);
        check("firefox: semantic structure and footnotes render", details.h1 === 1 && details.footnotes === 18 && details.backrefs >= 18, JSON.stringify(details));
        check("firefox: LTR islands and deep anchors resolve", details.ltr === "ltr" && details.anchors === 3, JSON.stringify(details));

        const lab = await firefoxDriver.executeScript(`
          const slider = document.querySelector('[data-cvt-slider]');
          slider.focus(); slider.value = '100'; slider.dispatchEvent(new Event('input', {bubbles: true}));
          return {ratio: Number(document.querySelector('[data-ratio]').textContent), speed: Number(document.querySelector('[data-speed]').textContent)};
        `);
        check("firefox: CVT lab recomputes", Math.abs(lab.ratio - 0.62) < 0.01 && Math.abs(lab.speed - 1.62) < 0.01, `${lab.ratio}/${lab.speed}`);
      }

      await firefoxDriver.executeScript("window.scrollTo(0, 0)");
      const screenshot = await firefoxDriver.takeScreenshot();
      writeFileSync(join(screenshotRoot, `firefox-${viewport.name}-top.png`), screenshot, "base64");
    }
  } finally {
    await firefoxDriver.quit();
    geckoProcess.kill("SIGTERM");
  }

  if (!visualOnly) {
    const noJsBrowser = await chromium.launch({
      headless: true,
      executablePath: chromiumExecutable,
      args: chromiumArguments,
    });
    try {
      const context = await noJsBrowser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${baseURL}/content/m08.html`, { waitUntil: "load" });
      const text = await page.locator("main").innerText();
      check("JavaScript-off: core module remains readable", text.includes("دیفرانسیل باز") && text.includes("استنتاج نسبت صحیح") && text.length > 12000, `${text.length} characters`);
      check("JavaScript-off: static CVT figure remains", await page.locator("#fig-cvt-effective-radius").count() === 1);
      await context.close();
    } finally {
      await noJsBrowser.close();
    }

    const searchIndex = readFileSync(join(webRoot, "search.json"), "utf8");
    check("Persian and Latin search terms are indexed", searchIndex.includes("دیفرانسیل") && searchIndex.includes("CVT"));

    const htmlFiles = ["index.html", "content/m08.html", "content/m08-answers.html", "content/glossary.html", "content/references.html"];
    check("all five book pages rendered", htmlFiles.every((file) => existsSync(join(webRoot, file))));
  }
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}

const report = {
  generated_at: new Date().toISOString(),
  browsers: ["Chromium", "Firefox"],
  viewports,
  summary: {
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
  },
  results,
};
writeFileSync(join(artifactRoot, visualOnly ? "visual-audit.json" : "web-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
for (const result of results) {
  console.log(`${result.status === "pass" ? "PASS" : "FAIL"}  ${result.name}${result.details ? ` — ${result.details}` : ""}`);
}
console.log(`\n${report.summary.passed} passed; ${report.summary.failed} failed.`);
