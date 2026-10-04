import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const output = resolve(process.argv[2] || `${root}/dist-github/index.html`);

const [template, css, library, i18n, stickman, javascript, audio, audioEn] = await Promise.all([
  readFile(resolve(root, "public/legacy.html"), "utf8"),
  readFile(resolve(root, "public/styles.css"), "utf8"),
  readFile(resolve(root, "public/library.js"), "utf8"),
  readFile(resolve(root, "public/i18n.js"), "utf8"),
  readFile(resolve(root, "public/stickman.js"), "utf8"),
  readFile(resolve(root, "public/app.js"), "utf8"),
  readFile(resolve(root, "public/audio/count-cycle.wav")),
  readFile(resolve(root, "public/audio/count-cycle-en.wav")),
]);

const wav = buffer => "data:audio/wav;base64," + buffer.toString("base64");
const page = template
  .replace('<link rel="stylesheet" href="styles.css" />', () => "<style>\n" + css + "\n</style>")
  .replace('data-src="audio/count-cycle.wav"', () => 'data-src="' + wav(audio) + '"')
  .replace('data-src="audio/count-cycle-en.wav"', () => 'data-src="' + wav(audioEn) + '"')
  .replace(/<script src="library\.js[^\"]*"><\/script>/, () => "<script>\n" + library + "\n</script>")
  .replace(/<script src="i18n\.js[^\"]*"><\/script>/, () => "<script>\n" + i18n + "\n</script>")
  .replace(/<script src="stickman\.js[^\"]*"><\/script>/, () => "<script>\n" + stickman + "\n</script>")
  .replace(/<script src="app\.js[^\"]*"><\/script>/, () => "<script>\n" + javascript + "\n</script>");

if (page.includes('href="styles.css"') || /<script\s+src=/.test(page) || page.includes('data-src="audio/')) {
  throw new Error("GitHub page still contains an external runtime asset");
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, page);
console.log(output + " — " + Buffer.byteLength(page) + " bytes; gzip " + gzipSync(page).length + " bytes");
