// Loads review/index.html in a real Chrome over file:// and checks that it
// actually works: no script errors, rows rendered, the film's metadata read,
// and every referenced media file present on disk.
//
//   node tools/check-review-hub.mjs
//
// The page's whole point is "double-click and it works", so a static file check
// is not enough -- a syntax error inside the inline script would only show up
// when someone opens it.
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(resolve(root, "../world-execute-me-lyric-mv/package.json"));
const { chromium } = require("playwright-core");

const REFERENCED = [
  "../out/world-execute-me-deepseek-1080p60.mp4",
  "../out/fix-round1/segments/S29-drift-99.000-105.000.mp4",
  "../out/fix-round1/segments/S39-S41-calls-148.000-159.200.mp4",
  "../out/fix-round1/segments/S54-S56-ending-200.600-211.958.mp4",
  "../docs/fix-round1-before-after.jpg",
];

const pageUrl = pathToFileURL(resolve(root, "review/index.html")).href;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });

const problems = [];
page.on("pageerror", (e) => problems.push("pageerror: " + String(e)));
page.on("console", (m) => {
  if (m.type() === "error") problems.push("console: " + m.text());
});

await page.goto(pageUrl, { waitUntil: "load" });
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const film = document.getElementById("film");
  return {
    rows: document.querySelectorAll("#rows tbody tr:not(.group)").length,
    groups: document.querySelectorAll("#rows tbody tr.group").length,
    clips: document.querySelectorAll("#clips .clip").length,
    filmSrc: film.getAttribute("src"),
    readyState: film.readyState,
    duration: film.duration,
    summary: document.getElementById("summary").textContent,
    firstSegLabel: document.querySelector("#rows tbody tr.group td")?.textContent ?? "",
  };
});
// Optional: --shot <path> saves a full-page screenshot so the layout can be
// eyeballed, not just asserted.
const shotIdx = process.argv.indexOf("--shot");
const shotPath = shotIdx >= 0 ? process.argv[shotIdx + 1] : null;
if (shotPath) {
  await page.screenshot({ path: resolve(root, shotPath), fullPage: true });
  console.log("screenshot: " + shotPath);
}
await browser.close();

const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass, detail });

ok("页面无脚本错误", problems.length === 0, problems.join(" | ") || "0 个");
ok("检查点行已渲染", info.rows >= 40, info.rows + " 行");
ok("分段表头已分组", info.groups === 8, info.groups + " 组");
ok("修复短段按钮已生成", info.clips === 3, info.clips + " 个");
ok("主视频路径指向 out/", info.filmSrc === "../out/world-execute-me-deepseek-1080p60.mp4", info.filmSrc);
ok("主视频元数据已读取", info.readyState >= 1, "readyState=" + info.readyState + " duration=" + info.duration);
ok("摘要已填充", /已核/.test(info.summary), info.summary);

const missing = REFERENCED.filter((p) => !existsSync(resolve(root, "review", p)));

console.log("review/index.html 加载检查");
checks.forEach((c) => console.log("  " + (c.pass ? "ok  " : "FAIL") + " " + c.name + "  = " + c.detail));
if (missing.length) {
  console.log("  注意 本机缺少这些被引用的媒体（页面会显示提示，不算失败）：");
  missing.forEach((m) => console.log("       " + m));
}
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? "FAILED: " + failed.length + " 项" : "PASSED: 全部 " + checks.length + " 项");
process.exit(failed.length ? 1 : 0);
