// The translation band.
//
// The English lyric is already part of the picture: it is set, stamped, typed and
// plotted inside the shots. What was missing is the meaning, and a viewer who does
// not read English fluently has to wait for the picture to explain the line. So this
// band sits at the very bottom, centred, and stays out of the way: one line of
// Chinese, a small level meter reading the actual audio, and a heart that beats on
// the song's own grid.
//
// Everything here is a pure function of t: the level comes from the pre-computed
// audio features, the pulse comes from the beat grid, and nothing accumulates.
const ZH_URL = "/data/lyrics-zh.json";
const FEAT_URL = "/data/audio-features-v1.json";

const CJK = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Hiragino Sans GB", sans-serif';

let ZH = null;
let FEAT = null;
let RMS = null;
let LOW = null;

function decodeBand(base64) {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const SUBTITLE_READY = (async () => {
  const [zh, feat] = await Promise.all([
    fetch(ZH_URL).then((r) => r.json()),
    fetch(FEAT_URL).then((r) => r.json()),
  ]);
  ZH = zh.lines;
  FEAT = feat;
  // series.data is four base64 bands: rms, low, mid, high at 100 Hz
  const names = feat.series.names;
  RMS = decodeBand(feat.series.data[names.indexOf("rms")]);
  LOW = decodeBand(feat.series.data[names.indexOf("low")]);
})();

/** Level at a song time, 0..1, with a short release so the meter settles rather than flickers. */
function levelAt(t, band, rate = 100) {
  if (!band) return 0;
  const i = Math.round(t * rate);
  if (i < 0 || i >= band.length) return 0;
  return band[i] / 255;
}

/** The beat pulse: 1 on the beat, falling away over the beat. */
function beatPulse(t, period, phase) {
  if (t < 0) return 0;
  const p = (((t - phase) % period) + period) % period;
  return Math.max(0, 1 - p / (period * 0.55)) ** 2;
}

/**
 * Draw the band. `lineIndex` is the lyric line on screen, so the translation changes
 * exactly when the English does.
 */
export function drawSubtitle(ctx, t, lineIndex, opts = {}) {
  if (!ZH || lineIndex == null) return;
  const text = ZH[lineIndex];
  if (!text) return;
  const { y = 986 } = opts;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // A soft floor, so the line keeps its contrast over a bright shot as well as a dark
  // one. It is a gradient rather than a bar: nothing should look like a box was added.
  const floor = ctx.createLinearGradient(0, 900, 0, 1080);
  floor.addColorStop(0, "rgba(3,12,20,0)");
  floor.addColorStop(0.55, "rgba(3,12,20,0.42)");
  floor.addColorStop(1, "rgba(3,12,20,0.72)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 900, 1920, 180);

  // the translation itself
  ctx.font = `500 38px ${CJK}`;
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#e8eef7";
  ctx.fillText(text, 960, y);
  ctx.shadowBlur = 0;

  // --- the meter and the heart -------------------------------------------------
  const rms = levelAt(t, RMS);
  const low = levelAt(t, LOW);
  const pulse = beatPulse(t, FEAT?.beat_grid?.period ?? 0.461555, FEAT?.beat_grid?.phase ?? 0.31);

  const cy = y + 40;
  const half = 150;
  const heartX = 960 - half - 34;

  // the meter: a mirrored bar spectrum, rms on the outside and the low band inside,
  // so the shape says "loud" and "bass" at once
  const bars = 34;
  for (let i = 0; i < bars; i++) {
    const k = i / (bars - 1);
    const x = 960 - half + 2 * half * k;
    // a travelling ripple, so a still frame still has motion in it
    const ripple = 0.5 + 0.5 * Math.sin(k * 9 - t * 3.4);
    const env = Math.sin(Math.PI * k) ** 0.7;
    const h = 2 + (26 * rms + 10) * env * (0.45 + 0.55 * ripple) + 10 * pulse * env;
    const a = (0.28 + 0.5 * env) * (0.5 + 0.5 * rms);
    ctx.strokeStyle = `rgba(131,233,230,${a.toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, cy - h / 2);
    ctx.lineTo(x, cy + h / 2);
    ctx.stroke();
  }
  // a faint centre line, so the meter reads as a measurement
  ctx.strokeStyle = "rgba(131,233,230,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(960 - half, cy);
  ctx.lineTo(960 + half, cy);
  ctx.stroke();

  // the heartbeat: one heart, sized by the low band, squeezed on the grid
  const scale = 1 + 0.22 * pulse + 0.12 * low;
  const hs = 9 * scale;
  ctx.save();
  ctx.translate(heartX, cy);
  const glow = 0.35 + 0.5 * pulse;
  ctx.shadowColor = `rgba(131,233,230,${glow.toFixed(2)})`;
  ctx.shadowBlur = 16 * (0.4 + pulse);
  ctx.beginPath();
  ctx.moveTo(0, hs * 0.95);
  ctx.bezierCurveTo(-hs * 1.5, -hs * 0.25, -hs * 0.55, -hs * 1.25, 0, -hs * 0.35);
  ctx.bezierCurveTo(hs * 0.55, -hs * 1.25, hs * 1.5, -hs * 0.25, 0, hs * 0.95);
  ctx.fillStyle = `rgba(131,233,230,${(0.55 + 0.45 * pulse).toFixed(2)})`;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
