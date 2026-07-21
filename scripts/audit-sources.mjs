#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";

const INDEX_PATH = new URL("../sources/baseContentLinks.txt", import.meta.url);
const EXPECTED_SOURCE_COUNT = 20;
const MINIMUM_BODY_LENGTH = 500;
const CONCURRENCY = 4;

function decodeEntities(value) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&zwnj;", "‌")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([\da-f]+);/gi, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)),
    );
}

function plainText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function parseCanonicalSources(indexText) {
  const urls = indexText.match(/^https:\/\/ameg\.ir\/\S+$/gmu) ?? [];
  return urls.filter((url) => {
    const pathname = decodeURIComponent(new URL(url).pathname);
    return pathname !== "/مکانیک-خودرو/";
  });
}

async function retrieveSource(url, index) {
  const canonical = new URL(url);
  const slug = decodeURIComponent(canonical.pathname.replace(/^\/+|\/+$/g, ""));
  const endpoint = new URL("/wp-json/wp/v2/posts", canonical.origin);
  endpoint.searchParams.set("slug", slug);
  endpoint.searchParams.set("_fields", "id,slug,link,title,content");

  const response = await fetch(endpoint, {
    headers: { "user-agent": "AutoMechanic source-audit/1.0" },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const matches = await response.json();
  if (!Array.isArray(matches) || matches.length !== 1) {
    throw new Error(`expected one WordPress record, received ${matches.length ?? "invalid JSON"}`);
  }

  const post = matches[0];
  const html = post.content?.rendered ?? "";
  const text = plainText(html);
  const title = plainText(post.title?.rendered ?? "");
  const valid = title.length > 0 && text.length >= MINIMUM_BODY_LENGTH;

  return {
    source: index === 0 ? "S00" : `S${String(index).padStart(2, "0")}`,
    title,
    canonicalUrl: url,
    resolvedUrl: post.link,
    wordpressId: post.id,
    bodyCharacters: text.length,
    approximateWords: text.split(/\s+/u).filter(Boolean).length,
    images: (html.match(/<img\b/gi) ?? []).length,
    retrieval: valid ? "accessed" : "incomplete",
  };
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      try {
        results[current] = await worker(items[current], current);
      } catch (error) {
        results[current] = {
          source: current === 0 ? "S00" : `S${String(current).padStart(2, "0")}`,
          canonicalUrl: items[current],
          retrieval: "failed",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

function markdownReport(results) {
  const lines = [
    "| Source | Title | Retrieval | Approx. words | Images |",
    "|---|---|---:|---:|---:|",
    ...results.map((result) =>
      `| ${result.source} | ${result.title ?? "—"} | ${result.retrieval} | ${result.approximateWords ?? "—"} | ${result.images ?? "—"} |`,
    ),
  ];
  return lines.join("\n");
}

const indexText = await readFile(INDEX_PATH, "utf8");
const sources = parseCanonicalSources(indexText);

if (sources.length !== EXPECTED_SOURCE_COUNT) {
  throw new Error(`expected ${EXPECTED_SOURCE_COUNT} sources, found ${sources.length}`);
}

const results = await mapWithConcurrency(sources, retrieveSource, CONCURRENCY);
const failures = results.filter((result) => result.retrieval !== "accessed");

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log(markdownReport(results));
}

if (failures.length > 0) {
  process.exitCode = 1;
}
