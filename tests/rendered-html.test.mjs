import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Smart Consumer learning site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="vi">/i);
  assert.match(html, /<title>Smart Consumer — Tiêu dùng thông minh<\/title>/i);
  assert.match(html, /GDCD 9 · BÀI HỌC TƯƠNG TÁC/);
  assert.match(html, /Mua đúng nhu cầu/);
  assert.match(html, /Hành trình của em/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("includes the complete interactive learning journey", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  for (const section of ["Mục tiêu", "Bài học", "Quảng cáo", "Tình huống", "Kế hoạch chi tiêu", "Quiz", "Vận dụng"]) assert.match(page, new RegExp(section));
  assert.match(page, /localStorage/);
  assert.match(page, /Thử thách 7 ngày/);
  assert.match(page, /ke-hoach-chi-tieu\.txt/);
  assert.match(layout, /lang="vi"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
