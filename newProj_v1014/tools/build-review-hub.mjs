// Builds review/index.html: a static review desk for the film.
//
// The page is deliberately file:// friendly -- no fetch(), no ES modules, no
// build step -- so it opens by double-clicking. All data is inlined at build
// time from data/storyboard-v1.json, which is why this is a generator rather
// than a hand-written page: after the storyboard, the shot list or the fixed
// spans change, re-run
//
//   node tools/build-review-hub.mjs
//
// and the review folder is up to date. Nothing here reads the song or the
// lyrics; only shot times, shot ids and the storyboard's own listening notes.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const storyboard = JSON.parse(readFileSync(resolve(root, "data/storyboard-v1.json"), "utf8"));
const shots = storyboard.shots ?? [];

// The eight drawn segments. Boundary times come from the storyboard shots
// themselves; these ranges only group the review list.
const SEGMENTS = [
  { id: "p2", label: "S01–S06", from: 0, to: 29.709 },
  { id: "p3", label: "S07–S14", from: 29.709, to: 59.223 },
  { id: "p0", label: "S15–S19", from: 59.223, to: 74.045 },
  { id: "p1", label: "S20–S27", from: 74.045, to: 95.465 },
  { id: "p4", label: "S28–S35", from: 95.465, to: 131.224 },
  { id: "p5", label: "S36–S43", from: 131.224, to: 162.805 },
  { id: "p6", label: "S44–S50", from: 162.805, to: 188.483 },
  { id: "p7", label: "S51–S56", from: 188.483, to: 211.958 },
];

// Spans whose picture changed in the 2026-10-17 fix round. The archived film
// below was exported before that round, so these rows are marked as stale and
// offered with their fixed-segment clip.
const FIXED = [
  { from: 99.349, to: 103.489, label: "缺陷 D · S29 漂移" },
  { from: 148.036, to: 159.113, label: "缺陷 C · S39–S41 呼叫累积" },
  { from: 200.652, to: 211.957596, label: "缺陷 A/B · S54–S56 片尾" },
];

const FIXED_VIDEOS = [
  {
    file: "../out/fix-round1/segments/S29-drift-99.000-105.000.mp4",
    from: 99.0, to: 105.0, label: "S29 漂移 · 修复后",
  },
  {
    file: "../out/fix-round1/segments/S39-S41-calls-148.000-159.200.mp4",
    from: 148.0, to: 159.2, label: "S39–S41 呼叫 · 修复后",
  },
  {
    file: "../out/fix-round1/segments/S54-S56-ending-200.600-211.958.mp4",
    from: 200.6, to: 211.958, label: "S54–S56 片尾 · 修复后",
  },
];

const FILM = {
  file: "../out/world-execute-me-deepseek-1080p60.mp4",
  exported: "2026-10-17 03:31",
  duration: 211.957596,
  staleNote:
    "本页成片导出于上述修复轮之前。切点时间完全未变，因此可用来审听所有镜头边界；但三段画面是旧版，已用红标标出并配了修复后短段。",
};

// In-shot candidates that are not shot boundaries. Curated from the storyboard
// audio_check notes and the fix-round records, not derived automatically.
const EVENTS = [
  { t: 59.4115, hint: "远端消息进入。低频通量候选；确认字幕仍从 59.223 行首开始，不拖到乐队拍点。" },
  { t: 61.958, hint: "接收确认与水纹。行边界初值；听清词头与重击的关系。" },
  { t: 65.397, hint: "回路闭合。强调行起点初值，不是独立人声音头测量。" },
  { t: 68.3, hint: "掌心触碰。用户已确认这一落点正确。", status: "approved" },
  { t: 84.268, hint: "远端白色回声出现。候选点，确认回声是否与词句对齐。" },
  { t: 91.04, hint: "另一形态切换。低频起音候选，不是已核准的字母词头。" },
  { t: 102.6, hint: "S29 漂移峰值。确认收住是否读得到（修复后此点开始收）。" },
  { t: 148.0102, hint: "重连轨道起点。低频候选；确认画内事件按 148.036 + 两拍序列。" },
  { t: 155.785, hint: "第 9 次呼叫完成，轨道开始向内压缩（callTime(9)）。" },
  { t: 158.554, hint: "第 12 次呼叫完成，红色端口封闭不得早于此（callTime(12)）。" },
  { t: 205.709, hint: "最后一句的中频候选。与 205.811 的索引上限是什么关系。" },
  { t: 207.45, hint: "尾音衰减起点。环从此开始衰减，确认收尾不显突兀。" },
];

const frames = 1 / 60;
const fixedSpanOf = (t) =>
  FIXED.find((f) => t >= f.from - frames && t <= f.to + frames) ?? null;
const segmentOf = (t) =>
  SEGMENTS.find((s) => t >= s.from - frames && t < s.to + frames) ?? SEGMENTS[0];

const rows = shots
  .filter((s) => s.start > 0)
  .map((s) => {
    const span = fixedSpanOf(s.start);
    return {
      shot: s.id,
      t: s.start,
      dominant: s.dominant ?? "",
      hint: s.audio_check ?? "",
      status: s.cut_status === "approved" ? "approved" : "pending",
      segment: segmentOf(s.start).id,
      fixed: span ? span.label : null,
    };
  });

const eventRows = EVENTS.map((e) => {
  const span = fixedSpanOf(e.t);
  return {
    shot: "事件",
    t: e.t,
    dominant: "event",
    hint: e.hint,
    status: e.status === "approved" ? "approved" : "pending",
    segment: segmentOf(e.t).id,
    fixed: span ? span.label : null,
  };
});

const data = {
  film: FILM,
  segments: SEGMENTS,
  fixed: FIXED,
  fixedVideos: FIXED_VIDEOS,
  rows,
  events: eventRows,
};

const reviewDir = resolve(root, "review");
// The page references media with paths relative to review/, so existence must
// be checked from there too -- not from the project root.
const present = (p) => existsSync(resolve(reviewDir, p));

const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>审片台 · world.execute(me); DeepSeek 版</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #06131f; color: #d7e6ea;
         font: 14px/1.6 "Microsoft YaHei", "Segoe UI", sans-serif; }
  header { padding: 18px 22px 12px; border-bottom: 1px solid #17384a; }
  h1 { margin: 0 0 4px; font-size: 19px; font-weight: 600; color: #e6f2ef; }
  h2 { margin: 0 0 10px; font-size: 15px; font-weight: 600; color: #83e9e6; }
  .sub { color: #6f8fa3; font-size: 13px; }
  main { padding: 18px 22px 60px; max-width: 1500px; }
  section { margin-bottom: 26px; }
  .grid { display: grid; grid-template-columns: minmax(420px, 46%) 1fr; gap: 20px; align-items: start; }
  @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
  video { width: 100%; background: #000; border: 1px solid #1c4053; border-radius: 6px; display: block; }
  .bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
  button, select { background: #0d2a39; color: #d7e6ea; border: 1px solid #24566b;
                   border-radius: 4px; padding: 6px 11px; font: inherit; cursor: pointer; }
  button:hover { background: #14384a; border-color: #3a86a0; }
  button.on { background: #14474f; border-color: #83e9e6; color: #e6f2ef; }
  button:disabled { opacity: .45; cursor: default; }
  .now { color: #83e9e6; font-family: Consolas, monospace; font-size: 13px; }
  .warn { background: #2a1b1b; border: 1px solid #7a3b3b; color: #f0c9c9;
          padding: 9px 12px; border-radius: 5px; margin: 10px 0 0; font-size: 13px; }
  .ok { color: #9fd8b5; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 9px; border-bottom: 1px solid #12293a; vertical-align: top; }
  th { color: #6f8fa3; font-weight: 500; position: sticky; top: 0; background: #071a26; z-index: 1; }
  tr.group td { background: #0a2230; color: #83e9e6; font-weight: 600; }
  tr:hover td { background: #0b2333; }
  tr.approved td { color: #7f9aa8; }
  tr.active td { background: #10394a; }
  td.t { font-family: Consolas, monospace; white-space: nowrap; color: #cfe6e9; }
  .tag { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 12px;
         border: 1px solid #2b5a70; color: #9ec6d6; margin-right: 6px; }
  .tag.stale { border-color: #8a4040; color: #f0a9a9; }
  .tag.done { border-color: #3f7a55; color: #9fd8b5; }
  .hint { color: #8aa7b6; }
  .list { max-height: 62vh; overflow: auto; border: 1px solid #17384a; border-radius: 6px; }
  .clips { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .clip { border: 1px solid #17384a; border-radius: 6px; padding: 10px; }
  .clip h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #d7e6ea; }
  img.sheet { width: 100%; border: 1px solid #17384a; border-radius: 6px; }
  code { background: #0b2534; padding: 1px 5px; border-radius: 3px;
         font-family: Consolas, monospace; color: #bfe2e8; }
  textarea { width: 100%; height: 120px; background: #081c28; color: #cfe6e9;
             border: 1px solid #24566b; border-radius: 4px; padding: 8px; font-family: Consolas, monospace; }
  ul { margin: 6px 0 0 18px; padding: 0; }
  li { margin: 3px 0; }
</style>
</head>
<body>
<header>
  <h1>审片台 · world.execute(me); DeepSeek 版</h1>
  <div class="sub" id="meta"></div>
</header>

<main>
  <section>
    <div class="grid">
      <div>
        <video id="film" controls preload="metadata"></video>
        <div class="bar">
          <span class="now" id="now">--:--.---</span>
          <button id="stop">停止审听</button>
          <label>窗口 <select id="lead">
            <option value="2.5" selected>前后 2.5 秒</option>
            <option value="5">前后 5 秒</option>
            <option value="1">前后 1 秒</option>
          </select></label>
          <button id="sweep">连续审听未核点</button>
        </div>
        <div id="filmMsg"></div>
      </div>
      <div>
        <h2>怎么用</h2>
        <ul>
          <li>点表格里任意一行的 <strong>审听</strong>，播放该点前后各几秒后自动停。</li>
          <li><strong>连续审听未核点</strong> 会按时间顺序自动跳着过一遍，可以随时停。</li>
          <li>听完把 <strong>确认</strong> 打勾；<strong>复制结果</strong> 会把结论整理成文字，贴回对话即可。</li>
          <li>标了 <span class="tag stale">画面已修复</span> 的行，本页成片是旧版，请用右侧对应的修复后短段。</li>
          <li>键盘：<code>空格</code> 播放/停止，<code>←/→</code> ±5 秒，<code>回车</code> 审听当前行，<code>N</code> 下一个未核点。</li>
        </ul>
        <div id="summary" class="sub" style="margin-top:10px"></div>
      </div>
    </div>
  </section>

  <section>
    <h2>修复后的三段（与上表同一时间轴）</h2>
    <div class="clips" id="clips"></div>
    <video id="clip" controls preload="metadata" style="margin-top:14px"></video>
    <div class="bar"><span class="now" id="clipNow">选一个短段</span></div>
  </section>

  <section>
    <h2>检查点</h2>
    <div class="bar">
      <button id="f-all" class="on">全部</button>
      <button id="f-pending">只看未核</button>
      <button id="f-stale">只看画面已修复</button>
      <button id="copy">复制结果</button>
    </div>
    <div class="list"><table id="rows"><thead>
      <tr><th style="width:92px">时间</th><th style="width:86px">镜头</th><th style="width:74px">类型</th>
      <th>要听什么</th><th style="width:120px">状态</th><th style="width:150px">操作</th></tr>
    </thead><tbody></tbody></table></div>
    <textarea id="out" style="display:none"></textarea>
  </section>

  <section>
    <h2>四条缺陷的前后对照</h2>
    <img class="sheet" src="../docs/fix-round1-before-after.jpg" alt="四条缺陷前后对照">
    <div class="sub" style="margin-top:8px">
      A 最后一次呼叫起点 · B 片尾暗环复活 · C 第 5–12 次呼叫未累积 · D S29 漂移时间反向。
      A、D 差异只有几十像素和几像素，所以用了放大裁切。文字记录见
      <code>docs/dsh-fix-round1-notes.md</code>。
    </div>
  </section>

  <section>
    <h2>还没做的</h2>
    <ul>
      <li><strong>人工审听切点</strong>：165 个边界里目前只有 68.300 由用户确认。就是这一页要做的事。</li>
      <li><strong>导演精修</strong>：减少每镜都出现的声呐/光带/颗粒，让重点镜头突出；字幕阅读节奏。</li>
      <li><strong>条件补图</strong>：另一形态胸像与尖鳍局部层，只在分镜确认保留那两个桥段时做。</li>
      <li><strong>重导全曲</strong>：修复后尚未重新渲染完整成片（约半小时）。</li>
    </ul>
    <div class="sub" style="margin-top:10px">
      更新本页：改完分镜后在本项目目录运行 <code>node tools/build-review-hub.mjs</code>。
    </div>
  </section>
</main>

<script>
var DATA = __REVIEW_DATA__;
var film = document.getElementById('film');
var clip = document.getElementById('clip');
var leadSel = document.getElementById('lead');
var tbody = document.querySelector('#rows tbody');
var nowEl = document.getElementById('now');
var clipNow = document.getElementById('clipNow');
var outEl = document.getElementById('out');
var msgEl = document.getElementById('filmMsg');
var stopAt = null, queue = null, activeRow = null, filter = 'all';
var checked = {};

function fmt(t) {
  if (!isFinite(t)) return '--:--.---';
  var m = Math.floor(t / 60), s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(3);
}
function key(r) { return r.shot + '@' + r.t; }

document.getElementById('meta').textContent =
  '成片导出 ' + DATA.film.exported + ' · 时长 ' + fmt(DATA.film.duration) +
  ' · 检查点 ' + (DATA.rows.length + DATA.events.length) + ' 个 · ' + DATA.film.file;

(function buildClips() {
  var box = document.getElementById('clips');
  DATA.fixedVideos.forEach(function (v) {
    var d = document.createElement('div');
    d.className = 'clip';
    var h = document.createElement('h3');
    h.textContent = v.label + '  (' + fmt(v.from) + '–' + fmt(v.to) + ')';
    var b = document.createElement('button');
    b.textContent = '载入这个短段';
    b.onclick = function () {
      clip.src = v.file;
      clip.currentTime = 0;
      clip.play();
      clipNow.textContent = v.label;
    };
    d.appendChild(h); d.appendChild(b); box.appendChild(d);
  });
})();

function rowHtml(r, isEvent) {
  var span = r.fixed ? '<span class="tag stale">画面已修复</span>' : '';
  var done = r.status === 'approved';
  var tag = done ? '<span class="tag done">已确认</span>' : '<span class="tag">待核</span>';
  return '<td class="t">' + fmt(r.t) + '</td>' +
    '<td>' + (isEvent ? '事件' : r.shot) + '</td>' +
    '<td>' + (isEvent ? '候选' : r.dominant) + '</td>' +
    '<td><span class="hint">' + (r.hint || '—') + '</span> ' + span + '</td>' +
    '<td>' + tag + ' <label><input type="checkbox" data-k="' + key(r) + '"' +
      (checked[key(r)] ? ' checked' : '') + '> 确认</label></td>' +
    '<td><button data-t="' + r.t + '" data-seg="' + r.segment + '">审听</button></td>';
}

function render() {
  tbody.innerHTML = '';
  var groups = {};
  var list = [];
  DATA.rows.forEach(function (r) { r._event = false; list.push(r); });
  DATA.events.forEach(function (r) { r._event = true; list.push(r); });
  list.sort(function (a, b) { return a.t - b.t; });
  list.forEach(function (r) {
    if (filter === 'pending' && r.status === 'approved') return;
    if (filter === 'stale' && !r.fixed) return;
    if (!groups[r.segment]) {
      groups[r.segment] = true;
      var seg = DATA.segments.filter(function (s) { return s.id === r.segment; })[0];
      var tr = document.createElement('tr');
      tr.className = 'group';
      tr.innerHTML = '<td colspan="6">' + seg.label + '　' + fmt(seg.from) + ' – ' + fmt(seg.to) + '</td>';
      tbody.appendChild(tr);
    }
    var tr = document.createElement('tr');
    if (r.status === 'approved') tr.className = 'approved';
    tr.dataset.t = r.t;
    tr.innerHTML = rowHtml(r, r._event);
    tbody.appendChild(tr);
  });
  bindRows();
  updateSummary();
}

function bindRows() {
  Array.prototype.forEach.call(tbody.querySelectorAll('button[data-t]'), function (b) {
    b.onclick = function () { audition(parseFloat(b.dataset.t)); };
  });
  Array.prototype.forEach.call(tbody.querySelectorAll('input[data-k]'), function (c) {
    c.onchange = function () { checked[c.dataset.k] = c.checked; updateSummary(); };
  });
}

function updateSummary() {
  var n = DATA.rows.length + DATA.events.length;
  var done = 0;
  DATA.rows.concat(DATA.events).forEach(function (r) {
    if (r.status === 'approved' || checked[key(r)]) done++;
  });
  document.getElementById('summary').textContent =
    '已核 ' + done + ' / ' + n + '（68.300 触碰已提前确认，其余待你听）。';
}

function lead() { return parseFloat(leadSel.value); }

function audition(t) {
  stopAt = t + lead();
  queue = null;
  film.currentTime = Math.max(0, t - lead());
  var p = film.play();
  if (p && p.catch) p.catch(function () {});
  highlight(t);
}

function highlight(t) {
  Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (tr) {
    tr.classList.toggle('active', tr.dataset.t === String(t));
  });
}

function stop() { stopAt = null; queue = null; film.pause(); }

function tick() {
  nowEl.textContent = fmt(film.currentTime) + ' / ' + fmt(film.duration || DATA.film.duration);
  if (stopAt !== null && film.currentTime >= stopAt) {
    film.pause();
    stopAt = null;
    if (queue) nextInQueue();
  }
  requestAnimationFrame(tick);
}

function nextInQueue() {
  if (!queue || !queue.length) { queue = null; return; }
  var t = queue.shift();
  audition(t);
}

document.getElementById('stop').onclick = stop;
document.getElementById('sweep').onclick = function () {
  var list = [];
  DATA.rows.concat(DATA.events).sort(function (a, b) { return a.t - b.t; })
    .forEach(function (r) {
      if (r.status === 'approved' || checked[key(r)]) return;
      list.push(r.t);
    });
  if (!list.length) { alert('没有未核的检查点。'); return; }
  queue = list;
  nextInQueue();
};
document.getElementById('f-all').onclick = function () { filter = 'all'; setFilter(this); };
document.getElementById('f-pending').onclick = function () { filter = 'pending'; setFilter(this); };
document.getElementById('f-stale').onclick = function () { filter = 'stale'; setFilter(this); };
function setFilter(btn) {
  ['f-all', 'f-pending', 'f-stale'].forEach(function (id) {
    document.getElementById(id).classList.toggle('on', id === btn.id);
  });
  render();
}
document.getElementById('copy').onclick = function () {
  var lines = ['审片结果（' + new Date().toLocaleString() + '）'];
  DATA.rows.concat(DATA.events).sort(function (a, b) { return a.t - b.t; })
    .forEach(function (r) {
      var ok = r.status === 'approved' || checked[key(r)];
      if (!ok) return;
      lines.push('已确认  ' + fmt(r.t) + '  ' + (r._event ? '事件' : r.shot) + '  ' + (r.hint || ''));
    });
  var text = lines.join('\\n');
  outEl.style.display = 'block';
  outEl.value = text;
  outEl.select();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function () {});
  }
  alert('结论已整理到下面的文本框（已全选，可直接 Ctrl+C）。');
};

film.addEventListener('error', function () {
  msgEl.innerHTML = '<div class="warn">找不到成片文件：<code>' + DATA.film.file +
    '</code><br>它在本机的 <code>newProj_v1014/out/</code>（不进 Git）。在项目目录运行 ' +
    '<code>npm run export:full</code> 重新导出即可；修复后尚未重导。</div>';
});
film.addEventListener('loadedmetadata', function () {
  msgEl.innerHTML = '<div class="warn">' + DATA.film.staleNote + '</div>';
});
clip.addEventListener('timeupdate', function () { clipNow.textContent = fmt(clip.currentTime); });

document.addEventListener('keydown', function (e) {
  if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
  if (e.code === 'Space') { e.preventDefault(); film.paused ? film.play() : film.pause(); }
  if (e.code === 'ArrowRight') { e.preventDefault(); film.currentTime = Math.min(film.duration || 1e9, film.currentTime + 5); }
  if (e.code === 'ArrowLeft') { e.preventDefault(); film.currentTime = Math.max(0, film.currentTime - 5); }
  if (e.code === 'KeyN') {
    var list = DATA.rows.concat(DATA.events).sort(function (a, b) { return a.t - b.t; });
    for (var i = 0; i < list.length; i++) {
      if (list[i].t > film.currentTime + 0.05 && list[i].status !== 'approved' && !checked[key(list[i])]) {
        audition(list[i].t); return;
      }
    }
  }
  if (e.code === 'Enter') {
    var tr = tbody.querySelector('tr.active');
    if (tr) audition(parseFloat(tr.dataset.t));
  }
});

film.src = DATA.film.file;
render();
tick();
</script>
</body>
</html>
`;

mkdirSync(reviewDir, { recursive: true });
writeFileSync(
  resolve(reviewDir, "index.html"),
  HTML.replace("__REVIEW_DATA__", JSON.stringify(data)),
);

const README = `# 审片台 · review/

双击 \`index.html\` 即可打开，**不需要启动本地服务**：这一页只用 \`<video>\` 与 \`<img>\`，没有 fetch、没有 ES 模块，所以 file:// 下可用。

## 页面上能做什么

- 按镜头列出全部 **${rows.length} 个边界**，外加 **${eventRows.length} 个镜内候选事件**，每行都带分镜自己的 \`audio_check\` 提示。
- 点任意一行的「审听」：播放该点前后各 2.5 秒（窗口可改 1/2.5/5 秒）后自动停。
- 「连续审听未核点」按时间顺序自动过一遍所有未确认的点。
- 勾「确认」后可「复制结果」，把结论整理成文字贴回对话。
- 标了「画面已修复」的行说明本页成片是旧版，下面配了对应的修复后短段。

## 媒体在哪里

| 内容 | 位置 |
| --- | --- |
| 全曲成片（本页主视频） | \`../out/world-execute-me-deepseek-1080p60.mp4\` |
| 修复后三段 | \`../out/fix-round1/segments/\` |
| 四条缺陷前后对照 | \`../docs/fix-round1-before-after.jpg\` |

这些都不在 Git 里（\`out/\` 被忽略），只在本机。**全曲成片导出于 2026-10-17 03:31，早于修复轮**：切点时间未变，可用于审听；但 S29、S39–S41、S54–S56 三段画面是旧版。修复后尚未重导完整成片（\`npm run export:full\`，约半小时）。

## 怎么更新

分镜或镜头表变化后，在本项目目录运行：

\`\`\`
node tools/build-review-hub.mjs
\`\`\`

它从 \`data/storyboard-v1.json\` 重新生成 \`review/index.html\`，镜内候选事件列表在生成器里（\`EVENTS\`），需要时直接改那一处。页面本身没有手写内容，改生成器即可。

## 已知范围

- 页面只读，不写回任何状态；勾选只存在当前页面里。
- 不读取歌曲与歌词，检查点只含时间、镜头号与分镜提示。
- 切点是否成立仍以人耳审听为准，这一页只是让审听更快。
`;

writeFileSync(resolve(reviewDir, "README.md"), README);

const missing = [
  FILM.file,
  ...FIXED_VIDEOS.map((v) => v.file),
  "../docs/fix-round1-before-after.jpg",
].filter((p) => !present(p));

console.log("review/index.html 检查点：" + rows.length + " 个边界 + " + eventRows.length + " 个事件");
console.log("分段：");
SEGMENTS.forEach((s) => {
  const n = rows.filter((r) => r.segment === s.id).length;
  console.log("  " + s.id + "  " + s.label + "  " + s.from + "–" + s.to + "  边界 " + n);
});
if (missing.length) {
  console.log("警告：以下引用文件在本机不存在（页面会给出提示）：");
  missing.forEach((m) => console.log("  " + m));
} else {
  console.log("全部引用文件都存在。");
}
