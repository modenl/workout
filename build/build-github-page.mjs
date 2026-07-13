import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(process.argv[2] || `${root}/dist-github/index.html`);

const [template, css, javascript, audio] = await Promise.all([
  readFile(resolve(root, "public/legacy.html"), "utf8"),
  readFile(resolve(root, "public/styles.css"), "utf8"),
  readFile(resolve(root, "public/app.js"), "utf8"),
  readFile(resolve(root, "public/audio/count-cycle.mp3")),
]);

const audioDataUrl = `data:audio/mpeg;base64,${audio.toString("base64")}`;
const page = template
  .replace('<link rel="stylesheet" href="styles.css" />', `<style>\n${css}\n    </style>`)
  .replace('data-src="audio/count-cycle.mp3"', `data-src="${audioDataUrl}"`)
  .replace(/<script src="app\.js[^\"]*"><\/script>/, `<script>\n${javascript}\n    </script>`);

if (page.includes('href="styles.css"') || page.includes('src="app.js') || page.includes('data-src="audio/')) {
  throw new Error("GitHub page still contains an external runtime asset");
}

await writeFile(output, page);
console.log(output);
