import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(resolve(here, "../world-execute-me-lyric-mv/package.json"));
const { chromium } = require("playwright-core");
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
p.on("requestfailed", (r) => { const t = r.failure()?.errorText ?? "";
  if (!/favicon/.test(r.url()) && !/ERR_ABORTED/.test(t)) errs.push("request failed " + r.url().split("/").pop() + " (" + t + ")"); });
await p.goto(pathToFileURL(resolve(here, "review/index.html")).href, { waitUntil: "load" });
await p.waitForTimeout(3000);
const info = await p.evaluate(() => {
  const vs = [...document.querySelectorAll("video")];
  return {
    videos: vs.length,
    ready: vs.map((v) => v.readyState),
    durations: vs.map((v) => +(v.duration || 0).toFixed(2)),
    imgs: [...document.querySelectorAll("img")].map((i) => (i.complete && i.naturalWidth > 0 ? 1 : 0)),
    links: [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")),
  };
});
await p.screenshot({ path: resolve(here, "review/review-page.png"), fullPage: true });
await b.close();
console.log(JSON.stringify(info, null, 1));
console.log("errors:", errs.length ? errs : "none");



