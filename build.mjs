import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });
await mkdir("dist/server", { recursive: true });
for (const file of ["index.html", "styles.css", "app.js"]) {
  await cp(file, `dist/client/${file}`);
}
await cp("public", "dist/client", { recursive: true });

const html = await readFile("index.html", "utf8");
const css = await readFile("styles.css", "utf8");
const js = await readFile("app.js", "utf8");
const og = (await readFile("public/og.png")).toString("base64");

await writeFile(
  "dist/server/index.js",
  `const files = {
  "/": { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" },
  "/index.html": { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" },
  "/styles.css": { body: ${JSON.stringify(css)}, type: "text/css; charset=utf-8" },
  "/app.js": { body: ${JSON.stringify(js)}, type: "text/javascript; charset=utf-8" }
};
const ogBase64 = ${JSON.stringify(og)};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/og.png") {
      const binary = Uint8Array.from(atob(ogBase64), char => char.charCodeAt(0));
      return new Response(binary, {
        headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" }
      });
    }
    const file = files[url.pathname];
    if (!file) return new Response("Not found", { status: 404 });
    return new Response(file.body, {
      headers: { "content-type": file.type, "cache-control": url.pathname === "/" ? "no-cache" : "public, max-age=3600" }
    });
  }
};
`,
);
