// Build the final film with per-shot duration correction.
//
// Concatenating the 87 clips as-is gives 217.40 s instead of 216.958 s: each clip is
// rounded up to a whole number of frames at 30 fps, and over 87 shots that accumulates
// to nearly half a second. Against a fixed 211.96 s song that shows up as the picture
// drifting progressively behind the music, so every clip is trimmed to its exact shot
// duration and the whole thing is encoded in one pass.
import { spawn } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { SHOTS_DERIVED } from "../shots/index.js";

const FF = "G:\\CODE\\worldExecuteMe\\world-execute-me-lyric-mv\\node_modules\\ffmpeg-static\\ffmpeg.exe";
const files = readdirSync("shots").filter((f) => f.endsWith(".mp4")).sort();

const args = [];
let total = 0;
const parts = [];
for (let i = 0; i < SHOTS_DERIVED.length; i++) {
  const s = SHOTS_DERIVED[i];
  const n = String(i + 1).padStart(3, "0");
  const f = files.find((x) => x.startsWith(n + "_"));
  if (!f) throw new Error("missing clip " + n);
  const d = s.until - s.at;
  total += d;
  args.push("-t", d.toFixed(4), "-i", "shots/" + f);
  parts.push(`[${i}:v]`);
}
console.log("shots: " + SHOTS_DERIVED.length + "  video length: " + total.toFixed(3) + " s");

const filter = `${parts.join("")}concat=n=${SHOTS_DERIVED.length}:v=1:a=0[v]`;

// the song starts after the silent warning page, five seconds into the film
const out = "out/world-execute-me-deepseek-720p30.mp4";
const full = [
  ...args,
  "-i", "audio/song.wav",
  "-filter_complex", filter,
  "-map", "[v]", "-map", `${SHOTS_DERIVED.length}:a:0`,
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-r", "30",
  // five seconds of real silence in front, rather than a timestamp offset that some
  // players ignore: the warning page is silent and the song has to start at 5.0
  "-af", "adelay=5000:all=1",
  "-c:a", "aac", "-b:a", "192k",
  "-movflags", "+faststart",
  "-shortest",
  out,
];

writeFileSync("out/film-args.json", JSON.stringify({ out, total }, null, 2));
console.log("encoding…");
const p = spawn(FF, ["-y", "-hide_banner", "-loglevel", "warning", ...full], {
  stdio: "inherit",
});
p.on("exit", (code) => {
  console.log("ffmpeg exit " + code);
  process.exitCode = code ?? 1;
});
