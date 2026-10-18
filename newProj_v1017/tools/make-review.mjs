// Build the human review package for one section of the film.
//
//   node tools/make-review.mjs --name boot --from 0 --to 15.08 --shots 002,003,004,005
//
// Produces, in review/:
//   NN-<name>-ours.mp4       our section, cut together, with sound
//   NN-<name>-reference.mp4  the reference film's same song-time range
//   NN-<name>-AB.mp4         both side by side with labels, on one timeline
//
// The reference master includes its own 5 s preroll, so its range is shifted by
// that amount; our clips are already on song time. Everything is 640x360 per
// side so the A/B file stays small enough to open on any machine.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const ref = resolve(root, "..", "world-execute-me-lyric-mv");
const ffmpeg = process.env.MV_FFMPEG || resolve(ref, "node_modules/ffmpeg-static/ffmpeg.exe");
const master = resolve(ref, "out/study_720p30.mp4");
const PREROLL = 5.0;

const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf("--" + k);
  return i < 0 ? d : args[i + 1];
};

const name = arg("name", null);
const from = Number(arg("from", 0));
const to = Number(arg("to", 15.08));
const shotList = (arg("shots", "") || "").split(",").map((s) => s.trim()).filter(Boolean);

if (!name) throw new Error("缺少 --name（例如 --name boot）");
if (!existsSync(ffmpeg)) throw new Error("找不到 ffmpeg: " + ffmpeg);
if (!existsSync(master)) throw new Error("找不到参考片母版: " + master + "\n先渲染它（见 claude-version-study/README.md）");

const reviewDir = resolve(root, "review");
mkdirSync(reviewDir, { recursive: true });

// Which clips belong to this section: explicit list, or every clip whose shot
// falls inside [from, to) according to the shot table.
let clips = [];
if (shotList.length) {
  const all = readdirSync(resolve(root, "shots")).filter((f) => f.endsWith(".mp4"));
  clips = shotList.map((n) => {
    const hit = all.find((f) => f.startsWith(n + "_"));
    if (!hit) throw new Error(`shots/ 里没有编号 ${n} 的剪辑`);
    return resolve(root, "shots", hit);
  });
} else {
  const { SHOTS_DERIVED } = await import("../shots/index.js");
  const wanted = SHOTS_DERIVED.filter((s) => s.at >= from - 1e-6 && s.at < to - 1e-6);
  clips = wanted
    .map((s) => resolve(root, "shots", String(s.index + 1).padStart(3, "0") + "_" + s.id + ".mp4"))
    .filter((p) => existsSync(p));
  if (clips.length !== wanted.length)
    throw new Error(`这一段有 ${wanted.length} 镜，但只找到 ${clips.length} 个剪辑；先导出缺失的镜`);
}

const index = String(Number(arg("index", 1))).padStart(2, "0");
const run = (argsArr) => {
  const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...argsArr], { encoding: "utf8" });
  if (r.status !== 0) throw new Error((r.stderr || "").trim() || `ffmpeg 退出 ${r.status}`);
};

const ours = resolve(reviewDir, `${index}-${name}-ours.mp4`);
const refOut = resolve(reviewDir, `${index}-${name}-reference.mp4`);
const ab = resolve(reviewDir, `${index}-${name}-AB.mp4`);

// 1. our section, cut together
const inputs = clips.flatMap((c) => ["-i", c]);
const pairs = clips.map((_, i) => `[${i}:v][${i}:a]`).join("");
run([...inputs, "-filter_complex", `${pairs}concat=n=${clips.length}:v=1:a=1[v][a]`,
  "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
  "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", ours]);
console.log(`  ${index}-${name}-ours.mp4       ${clips.length} 镜`);

// 2. the reference's same stretch (its film time = song time + preroll)
run(["-ss", (from + PREROLL).toFixed(3), "-t", (to - from).toFixed(3), "-i", master,
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "160k", refOut]);
console.log(`  ${index}-${name}-reference.mp4`);

// 3. side by side, labelled
const label = (x, text) =>
  `scale=640:360,drawtext=fontfile=C\\:/Windows/Fonts/consola.ttf:text='${text}':x=12:y=10:fontsize=15:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6`;
run(["-i", refOut, "-i", ours, "-filter_complex",
  `[0:v]${label("r", "REFERENCE")}[l];[1:v]${label("o", "OURS")}[r];[l][r]hstack=inputs=2[v]`,
  "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
  "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", ab]);
console.log(`  ${index}-${name}-AB.mp4`);

const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(2) + " MB";
console.log(`完成 → review/  ·  ${["-ours.mp4", "-reference.mp4", "-AB.mp4"].map((s) => mb(resolve(reviewDir, index + "-" + name + s))).join("  ")}`);
console.log("把这些文件加到 review/index.html 的列表里，或者直接双击打开 AB 那个。");
