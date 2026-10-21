// Probe: render one time twice with an unrelated seek in between, and write both
// frames plus a diff mask, so a determinism failure can be located instead of guessed.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { startServer } from "../server.mjs";
import { dependency, chromePath, root } from "./media-runtime.mjs";

const { server, url } = await startServer(0);
const { chromium } = dependency("playwright-core");
const browser = await chromium.launch({ executablePath: chromePath() });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const probeT = Number(process.argv[2] ?? 106.6);
const awayT = Number(process.argv[3] ?? 113.6);

await page.goto(`${url}/?render=1&t=${probeT}`);
await page.waitForFunction(() => window.renderReady || window.renderError, { timeout: 40000 });
const render = (t) =>
  page.evaluate((t) => {
    const diag = window.renderFrame(t);
    return { diag, png: document.getElementById("storyboardCanvas").toDataURL("image/png").split(",")[1] };
  }, t);

const dir = resolve(root, "out/detprobe");
mkdirSync(dir, { recursive: true });
const a = await render(probeT);
await render(awayT);
const b = await render(probeT);
writeFileSync(resolve(dir, "a.png"), Buffer.from(a.png, "base64"));
writeFileSync(resolve(dir, "b.png"), Buffer.from(b.png, "base64"));
console.log("same:", a.png === b.png, "bytes", a.png.length, b.png.length);
await browser.close();
server.close();
