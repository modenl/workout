import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });
await mkdir("dist/server", { recursive: true });
for (const file of ["index.html", "styles.css", "app.js"]) {
  await cp(file, `dist/client/${file}`);
}
await cp("public", "dist/client", { recursive: true });

await writeFile("dist/server/index.js", `
export default {
  async fetch(request, env) {
    if (env?.ASSETS?.fetch) return env.ASSETS.fetch(request);
    return new Response("Site assets unavailable", { status: 503 });
  }
};
`);
