// Load the study page in a real Chrome over file:// and check it actually works:
// no script errors, every shot row rendered, thumbnails decoded, one clip
// playable, and section rows present.
//
//   node tools/check-page.mjs [--shot out/study-page.png]
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const study = fileURLToPath(new URL("../", import.meta.url));
const ref = resolve(study, "..", "world-execute-me-lyric-mv");
const require = createRequire(resolve(ref, "package.json"));
const { chromium } = require("playwright-core");

const shotIdx = process.argv.indexOf("--shot");
const shotPath = shotIdx >= 0 ? process.argv[shotIdx + 1] : null;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const problems = [];
page.on("pageerror", (e) => problems.push("pageerror: " + String(e)));
page.on("console", (m) => {
  if (m.type() === "error") problems.push("console: " + m.text());
});

await page.goto(pathToFileURL(resolve(study, "index.html")).href, { waitUntil: "load" });
await page.waitForTimeout(2500);
const info = await page.evaluate(async () => {
  const rows = document.querySelectorAll("#rows tbody tr.shot").length;
  const groups = document.querySelectorAll("#rows tbody tr.group").length;
  const secRows = document.querySelectorAll("#sections tbody tr").length;
  // Thumbnails are loading="lazy", so scroll the list first; otherwise only the
  // visible ones have decoded and the count means nothing.
  const list = document.querySelector(".list");
  for (let y = 0; y <= list.scrollHeight; y += list.clientHeight) {
    list.scrollTop = y;
    await new Promise((r) => setTimeout(r, 60));
  }
  list.scrollTop = 0;
  await new Promise((r) => setTimeout(r, 800));
  const thumbs = Array.from(document.querySelectorAll("img.thumb"));
  const decoded = thumbs.filter((t) => t.complete && t.naturalWidth > 0).length;
  const clip = document.getElementById("clip");
  document.getElementById("next").click();
  await new Promise((r) => setTimeout(r, 1200));
  return {
    rows, groups, secRows,
    thumbs: thumbs.length, decoded,
    clipSrc: clip.currentSrc || clip.getAttribute("src"),
    readyState: clip.readyState,
    duration: clip.duration,
    infoId: (document.querySelector("#info .id") || {}).textContent || "",
    badChecks: document.querySelectorAll("#checks .chk.bad").length,
  };
});

if (shotPath) {
  await page.screenshot({ path: resolve(study, shotPath), fullPage: true });
  console.log("screenshot: " + shotPath);
}
await browser.close();

const ok = (name, pass, detail) => checks.push({ name, pass, detail });
const checks = [];
ok("页面无脚本错误", problems.length === 0, problems.join(" | ") || "0 个");
ok("镜头行全部渲染", info.rows === 87, info.rows + " 行");
ok("段落分组已生成", info.groups === 15, info.groups + " 组");
ok("段落总表已生成", info.secRows === 15, info.secRows + " 行");
ok("缩图全部解码", info.decoded === 87, info.decoded + "/" + info.thumbs);
ok("剪辑可播放", info.readyState >= 1, "readyState=" + info.readyState + " duration=" + (info.duration || 0).toFixed(2));
ok("信息面板已填充", info.infoId.length > 0, info.infoId);
ok("参考片四项自检全过", info.badChecks === 0, info.badChecks + " 项不合格");

// Disk truth, independent of what the browser happened to load.
const shots = JSON.parse(readFileSync(resolve(study, "data/shots.json"), "utf8")).shots;
const nm = (s) => String(s.index + 1).padStart(3, "0") + "_" + s.id;
const missing = shots.filter((s) => !existsSync(resolve(study, "shots", nm(s) + ".mp4")) || !existsSync(resolve(study, "thumbs", nm(s) + ".jpg")));
ok("磁盘上 87 组剪辑与缩图齐全", missing.length === 0, missing.length ? missing.map((s) => s.id).join(",") : "87/87");

console.log("参考片研究页面加载检查");
checks.forEach((c) => console.log("  " + (c.pass ? "ok  " : "FAIL") + " " + c.name + "  = " + c.detail));
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? "FAILED: " + failed.length + " 项" : "PASSED: 全部 " + checks.length + " 项");
process.exit(failed.length ? 1 : 0);
