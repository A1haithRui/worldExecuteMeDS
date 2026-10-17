// Cut the reference film into one clip per shot, plus one thumbnail per shot.
//
//   node tools/cut-shots.mjs                    # uses the master rendered at 720p30
//   node tools/cut-shots.mjs --master <file>    # any other full-film render
//   node tools/cut-shots.mjs --only c1-kw1,c1-happy
//
// The master is the reference project's own export and it INCLUDES the 5 s
// silent warning page, so film time = song time + preroll. Every cut below is
// made on film time, taken from data/shots.json.
//
// Clips keep their audio: judging an edit means hearing where it lands against
// the music, not only seeing the frame. Cuts are re-encoded (not stream-copied)
// so a clip starts on the exact frame the storyboard names rather than on the
// nearest keyframe.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("../", import.meta.url));
const study = resolve(here);
const ref = resolve(here, "..", "world-execute-me-lyric-mv");
const ffmpeg = process.env.FFMPEG || resolve(ref, "node_modules/ffmpeg-static/ffmpeg.exe");

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf("--" + name);
  return i < 0 ? def : argv[i + 1];
};
const master = resolve(study, opt("master", "../world-execute-me-lyric-mv/out/study_720p30.mp4"));
const only = opt("only", null);
const clipsDir = resolve(study, "shots");
const thumbsDir = resolve(study, "thumbs");

if (!existsSync(ffmpeg)) throw new Error(`ffmpeg not found: ${ffmpeg}`);
if (!existsSync(master)) {
  throw new Error(
    `master render not found: ${master}\n` +
      `Render it from the reference project first:\n` +
      `  cd ../world-execute-me-lyric-mv && node export/export.mjs --width 1280 --height 720 --fps 30 --out out/study_720p30.mp4`,
  );
}

const data = JSON.parse(readFileSync(resolve(study, "data/shots.json"), "utf8"));
const name = (s) => String(s.index + 1).padStart(3, "0") + "_" + s.id;

mkdirSync(clipsDir, { recursive: true });
mkdirSync(thumbsDir, { recursive: true });

const run = (args) => execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", ...args], { encoding: "utf8" });

// ffmpeg reports the container duration on stderr, so this needs both streams.
function durationOf(file) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" });
  const m = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(r.stderr || "");
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;
}

const targets = only ? data.shots.filter((s) => only.split(",").includes(s.id)) : data.shots;
if (!targets.length) throw new Error("no shots selected");

console.log(`master: ${master}`);
console.log(`输出：${targets.length} 个镜头 → shots/ 与 thumbs/`);

let done = 0;
const problems = [];
for (const s of targets) {
  const base = name(s);
  const clip = resolve(clipsDir, base + ".mp4");
  const thumb = resolve(thumbsDir, base + ".jpg");
  // A hair of lead-in and lead-out so the first and last frames of the shot are
  // both present; the storyboard's own range stays inside the clip.
  const pad = 0.10;
  const start = Math.max(0, s.filmStart - pad);
  const length = s.duration + pad * 2;

  run(["-y", "-ss", start.toFixed(3), "-t", length.toFixed(3), "-i", master,
       "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "128k", clip]);

  // One thumbnail from 40% into the shot: past any entry transition, before the exit.
  const at = s.filmStart + s.duration * 0.4;
  run(["-y", "-ss", at.toFixed(3), "-i", master, "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "3", thumb]);

  const size = statSync(clip).size;
  if (size < 2048) problems.push(`${s.id}: 剪辑过小 (${size} B)`);
  if (!existsSync(thumb) || statSync(thumb).size < 1024) problems.push(`${s.id}: 缩图缺失`);

  done++;
  if (done % 20 === 0 || done === targets.length) console.log(`  ${done}/${targets.length}`);
}

// Probe every clip's duration and compare with the shot's own length.
console.log("校验剪辑时长（与分镜表逐镜对比，容差 0.15s）…");
const bad = [];
for (const s of targets) {
  const actual = durationOf(resolve(clipsDir, name(s) + ".mp4"));
  if (actual === null) {
    bad.push(`${s.id}: 无法读取时长`);
    continue;
  }
  const expected = s.duration + 0.2;
  if (Math.abs(actual - expected) > 0.15) bad.push(`${s.id}: 实际 ${actual.toFixed(3)}s vs 预期 ${expected.toFixed(3)}s`);
}

console.log(bad.length ? `FAILED: ${bad.length} 项\n  ` + bad.join("\n  ") : `PASSED: ${targets.length} 个剪辑时长全部符合`);
console.log(`位置：${clipsDir}`);
console.log(`       ${thumbsDir}`);
if (bad.length || problems.length) process.exit(1);
