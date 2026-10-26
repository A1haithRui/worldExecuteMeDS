// Build a large film in batches.
//
// One ffmpeg command with an 87-way concat filter works at 720p30 and dies at 4K60:
// the graph alone overflows the stack (exit 0xC00000FD) before a frame is encoded.
// So the shots are joined in batches, each batch re-encoded once to trim it to the
// exact shot durations, and the batches are then concatenated without re-encoding.
import { spawnSync } from "node:child_process";
import { readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { SHOTS_DERIVED } from "../shots/index.js";

const FF = "G:\\CODE\\worldExecuteMe\\world-execute-me-lyric-mv\\node_modules\\ffmpeg-static\\ffmpeg.exe";
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const DIR = opt("--dir", "shots4k");
const OUT = opt("--out", "out/world-execute-me-deepseek-4k60.mp4");
const FPS = opt("--fps", "60");
const BATCH = Number(opt("--batch", "8"));
const TMP = opt("--tmp", "out/batches");

const files = readdirSync(DIR).filter((f) => f.endsWith(".mp4")).sort();
mkdirSync(TMP, { recursive: true });

// exact shot durations, so the picture cannot drift against the fixed-length song
const plan = SHOTS_DERIVED.map((s, i) => {
  const n = String(i + 1).padStart(3, "0");
  const f = files.find((x) => x.startsWith(n + "_"));
  if (!f) throw new Error("missing clip " + n);
  return { n, path: DIR + "/" + f, d: s.until - s.at };
});

const run = (args, label) => {
  const r = spawnSync(FF, ["-y", "-hide_banner", "-loglevel", "error", ...args], { encoding: "utf8" });
  if (r.status !== 0) {
    console.log(label + " FAILED");
    console.log((r.stderr || "").split("\n").slice(-6).join("\n"));
    process.exit(1);
  }
};

// --- stage 1: batches -------------------------------------------------------
const batchFiles = [];
for (let b = 0, start = 0; start < plan.length; b++, start += BATCH) {
  const group = plan.slice(start, start + BATCH);
  const out = `${TMP}/b${String(b).padStart(2, "0")}.mp4`;
  batchFiles.push(out);
  if (existsSync(out)) {
    console.log(`batch ${b} already built`);
    continue;
  }
  const args = [];
  const parts = [];
  group.forEach((g, i) => {
    args.push("-t", g.d.toFixed(4), "-i", g.path);
    parts.push(`[${i}:v]`);
  });
  const filter = `${parts.join("")}concat=n=${group.length}:v=1:a=0[v]`;
  run([
    ...args,
    "-filter_complex", filter,
    "-map", "[v]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-r", FPS, "-an", out,
  ], `batch ${b}`);
  console.log(`batch ${b}: shots ${start + 1}-${start + group.length}`);
}

// --- stage 2: join the batches ---------------------------------------------
const list = `${TMP}/list.txt`;
// Absolute paths: the concat demuxer resolves relative entries against the list
// file's own directory, so relative ones would nest the temp dir twice.
writeFileSync(list, batchFiles.map((f) => `file '${resolve(f).replace(/\\/g, "/")}'`).join("\n"));
const joined = `${TMP}/joined.mp4`;
run(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined], "join");
console.log("batches joined");

// --- stage 3: the song ------------------------------------------------------
// five seconds of real silence in front, because the warning page is silent
run([
  "-i", joined,
  "-i", "audio/song.wav",
  "-map", "0:v:0", "-map", "1:a:0",
  "-af", "adelay=5000:all=1",
  "-c:v", "copy",
  "-c:a", "aac", "-b:a", "192k",
  "-movflags", "+faststart",
  "-shortest",
  OUT,
], "mux");
console.log("wrote " + OUT);
