import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("https://example.test/"));
}

test("serves the learning site at the root URL", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="vi">/i);
  assert.match(html, /Smart Consumer/);
  assert.match(html, /data-panel="5"/);
});

test("contains the six-stage mobile learning journey", async () => {
  const [html, js, css, refinements, worker] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/static.js", import.meta.url), "utf8"),
    readFile(new URL("../public/static.css", import.meta.url), "utf8"),
    readFile(new URL("../public/refinements.css", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  for (let i = 0; i < 6; i++) assert.match(html, new RegExp(`data-panel="${i}"`));
  assert.match(html, /class="lessonHeader"/);
  assert.doesNotMatch(html, /KẾ HOẠCH CHI TIÊU|quizActivity/i);
  assert.equal((html.match(/data-complete="0"/g) ?? []).length, 1);
  assert.match(js, /localStorage/);
  assert.match(js, /nhat-ki-7-ngay\.txt/);
  assert.match(js, /state\.journal\[Number\(button\.dataset\.add\)\]\.push/);
  assert.match(js, /const QUESTION_COUNT = 5/);
  assert.match(js, /const adBank = \[/);
  assert.match(js, /const situationBank = \[/);
  assert.match(js, /const MIN_RESPONSE_LENGTH = 12/);
  assert.match(js, /id="previousOpen"/);
  assert.match(js, /root\.querySelector\("\[data-continue\]"\)/);
  assert.match(html, /class="journalTable"/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /touch-action:manipulation/);
  assert.match(css, /expenseRow/);
  assert.match(refinements, /adCreative/);
  assert.match(refinements, /situationCreative/);
  assert.match(worker, /public\/index\.html\?raw/);
  assert.doesNotMatch(worker, /app-router-entry/);
});
