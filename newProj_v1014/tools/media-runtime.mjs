import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const root = fileURLToPath(new URL("../", import.meta.url));
export function dependency(name) {
  const candidates = [
    process.env.MV_DEPENDENCIES,
    root,
    resolve(root, "../world-execute-me-lyric-mv"),
  ].filter(Boolean);
  for (const base of candidates) {
    try {
      return createRequire(resolve(base, "package.json"))(name);
    } catch {}
  }
  throw new Error(
    `Missing ${name}. Run npm install or set MV_DEPENDENCIES to an existing project with this package.`,
  );
}
export function chromePath() {
  return [
    process.env.MV_CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((p) => p && existsSync(p));
}
export const ffmpeg = process.env.MV_FFMPEG || dependency("ffmpeg-static");
