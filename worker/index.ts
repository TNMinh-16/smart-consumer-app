/** Self-contained static site entry point. No runtime bindings are required. */
import indexHtml from "../public/index.html?raw";
import staticCss from "../public/static.css?raw";
import staticJs from "../public/static.js?raw";

const headers = {
  "cache-control": "public, max-age=300",
  "x-content-type-options": "nosniff",
};

const worker = {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/health") {
      return new Response("ok", { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    if (path === "/static.css") {
      return new Response(staticCss, { headers: { ...headers, "content-type": "text/css; charset=utf-8" } });
    }
    if (path === "/static.js") {
      return new Response(staticJs, { headers: { ...headers, "content-type": "text/javascript; charset=utf-8" } });
    }
    if (path === "/" || path === "/index.html") {
      return new Response(indexHtml, { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
    }
    return new Response("Not found", { status: 404, headers });
  },
};

export default worker;
