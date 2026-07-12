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
  const [html, js, css, worker] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/static.js", import.meta.url), "utf8"),
    readFile(new URL("../public/static.css", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  for (let i = 0; i < 6; i++) assert.match(html, new RegExp(`data-panel="${i}"`));
  assert.doesNotMatch(html, /class="topbar"/);
  assert.doesNotMatch(html, /KẾ HOẠCH CHI TIÊU|quizActivity/i);
  assert.equal((html.match(/data-complete="0"/g) ?? []).length, 1);
  assert.match(js, /localStorage/);
  assert.match(js, /nhat-ki-7-ngay\.txt/);
  assert.match(js, /state\.journal\[Number\(button\.dataset\.add\)\]\.push/);
  assert.match(js, /root\.querySelector\("\[data-next\]"\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /touch-action:manipulation/);
  assert.match(css, /expenseRow/);
  assert.match(worker, /public\/index\.html\?raw/);
  assert.doesNotMatch(worker, /app-router-entry/);
});
