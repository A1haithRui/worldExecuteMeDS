// Load compareResult/index.html in a real Chrome over file:// and check that the
// comparison actually works: no script errors, both films readable, all 87 rows,
// and -- the part that matters -- that the two videos land on the SAME song time
// when a shot is selected, despite their different preroll.
//
//   node tools/check-compare.mjs [--shot out/compare.png]
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = fileURLToPath(new URL("../", import.meta.url)); // .../newProj_v1017/compareResult/
const ref = resolve(here, "..", "..", "world-execute-me-lyric-mv");
const require = createRequire(resolve(ref, "package.json"));
const { chromium } = require("playwright-core");

const shotIdx = process.argv.indexOf("--shot");
const shotPath = shotIdx >= 0 ? process.argv[shotIdx + 1] : null;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const problems = [];
page.on("pageerror", (e) => problems.push("pageerror: " + String(e)));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const where = (m.location()?.url ?? "") + " " + m.text();
  // Our own per-shot clips do not exist until a section is rendered, so the
  // browser's failed request for them is expected, not a page fault. The page
  // is separately checked to show a placeholder for exactly those slots.
  if (/newProj_v1017\/shots\//.test(where) || (!/claude-version-study/.test(where) && /ERR_FILE_NOT_FOUND/.test(where))) return;
  problems.push("console: " + where);
});

await page.goto(pathToFileURL(resolve(here, "index.html")).href, { waitUntil: "load" });
await page.waitForTimeout(3000);

const info = await page.evaluate(async () => {
  const rows = document.querySelectorAll("#rows tbody tr.shot").length;
  const groups = document.querySelectorAll("#rows tbody tr.group").length;
  const vL = document.getElementById("vL"), vR = document.getElementById("vR");
  // Wait until each film can actually start, not merely report a duration: the
  // two files are very different sizes and a seek issued too early is dropped.
  const wait = (v, want) => new Promise((res) => {
    if (v.readyState >= want) return res();
    const done = () => { v.removeEventListener("canplay", done); v.removeEventListener("loadeddata", done); res(); };
    v.addEventListener("canplay", done);
    v.addEventListener("loadeddata", done);
    setTimeout(res, 6000);
  });
  await wait(vL, 2); await wait(vR, 2);

  // Select shot 11 (a mid-film slot) and compare song times on both sides.
  const row = document.querySelector('#rows tbody tr.shot[data-i="11"]');
  row.click();
  await new Promise((r) => setTimeout(r, 3500));

  const cfg = window.COMPARE;
  const songL = vL.currentTime - cfg.left.preroll;
  const songR = vR.currentTime - cfg.right.preroll;

  // The right-hand per-shot clip does not exist yet, so the page must say so
  // rather than show a broken player.
  const missR = !!document.querySelector("#clipHostR .missing");

  return {
    rows, groups,
    durL: vL.duration, durR: vR.duration,
    readyL: vL.readyState, readyR: vR.readyState,
    songL, songR,
    clipId: document.getElementById("clipId").textContent,
    missingRightClip: missR,
    leftClipSrc: (document.querySelector("#clipHostL video") || {}).src || "",
    activeRow: (document.querySelector("#rows tbody tr.shot.active") || {}).dataset?.i ?? "",
  };
});
if (shotPath) {
  await page.screenshot({ path: resolve(here, shotPath), fullPage: true });
  console.log("screenshot: " + shotPath);
}
await browser.close();

const cfgText = readFileSync(resolve(here, "config.js"), "utf8");
const fileOf = (key) => (cfgText.match(new RegExp(key + `:[\\s\\S]{0,200}?file:\\s*"([^"]+)"`)) || [])[1];
const paths = { left: fileOf("left"), right: fileOf("right") };
const missingFiles = Object.entries(paths)
  .filter(([, p]) => p && !existsSync(resolve(here, p)))
  .map(([k, p]) => k + ": " + p);

const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass, detail });
ok("页面无脚本错误", problems.length === 0, problems.join(" | ") || "0 个");
ok("87 个镜头行", info.rows === 87, info.rows + " 行");
ok("15 个段落分组", info.groups === 15, info.groups + " 组");
ok("参考片可读", info.readyL >= 1, "readyState=" + info.readyL + " duration=" + (info.durL || 0).toFixed(2));
ok("我们的成片可读", info.readyR >= 1, "readyState=" + info.readyR + " duration=" + (info.durR || 0).toFixed(2));
ok("两边落在同一歌曲时间", Math.abs(info.songL - info.songR) < 0.08,
   "参考 " + info.songL.toFixed(3) + "s vs 我们 " + info.songR.toFixed(3) + "s（差 " + ((info.songL - info.songR) * 1000).toFixed(0) + "ms）");
ok("点行会高亮并载入该镜", info.activeRow === "11" && /第 12 \/ 87 镜/.test(info.clipId), info.clipId);
ok("参考片该镜剪辑已载入", /claude-version-study\/shots\/\d{3}_/.test(info.leftClipSrc), info.leftClipSrc.split("/").slice(-1)[0]);
ok("我们尚未渲染的镜有明确提示", info.missingRightClip, info.missingRightClip ? "显示占位说明" : "没有提示");
ok("config.js 指向的片子都存在", missingFiles.length === 0, missingFiles.join(" | ") || "两个都存在");

console.log("对比页面加载检查");
checks.forEach((c) => console.log("  " + (c.pass ? "ok  " : "FAIL") + " " + c.name + "  = " + c.detail));
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? "FAILED: " + failed.length + " 项" : "PASSED: 全部 " + checks.length + " 项");
process.exit(failed.length ? 1 : 0);


