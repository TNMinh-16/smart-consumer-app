import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("https://example.test/"), {
    ASSETS: {
      fetch: async (request) => {
        const name = new URL(request.url).pathname.replace(/^\//, "");
        try {
          const body = await readFile(new URL(`../dist/client/${name}`, import.meta.url));
          return new Response(body, { status: 200, headers: { "content-type": name.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" } });
        } catch { return new Response("Not found", { status: 404 }); }
      },
    },
  });
}

test("serves the static learning site at the root URL", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="vi">/i);
  assert.match(html, /Smart Consumer — Tiêu dùng thông minh/);
  assert.match(html, /Thử thách 7 ngày tiêu dùng thông minh/);
  assert.match(html, /KẾ HOẠCH CHI TIÊU/i);
});

test("contains offline interactions for all eight learning stages", async () => {
  const [html, js, css, worker] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/static.js", import.meta.url), "utf8"),
    readFile(new URL("../public/static.css", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  for (let i = 0; i < 8; i++) assert.match(html, new RegExp(`data-panel="${i}"`));
  assert.match(js, /localStorage/);
  assert.match(js, /ke-hoach-chi-tieu\.txt/);
  assert.match(js, /nhat-ki-7-ngay\.txt/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(worker, /ASSETS\.fetch/);
  assert.doesNotMatch(worker, /app-router-entry/);
  void root;
});
