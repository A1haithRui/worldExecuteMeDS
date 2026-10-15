const $ = (id) => document.getElementById(id);
const stage = $('stage');
const audio = $('audio');
const seek = $('seek');
const character = $('character');
const images = {
  profile: '/assets/character/deepseek_profile_v3.png',
  bust: '/assets/character/deepseek_bust_v3.png',
  reach: '/assets/character/deepseek_reach_v3.png',
  eye: '/assets/character/deepseek_eye_v3.png',
};
for (const path of Object.values(images)) { const img = new Image(); img.src = path; }

let lines = [];
fetch('/data/lyrics.json').then((r) => r.ok ? r.json() : null).then((data) => { lines = data?.lines || []; }).catch(() => {});

const scenes = [
  { from: 0, to: 20, mode: 'boot', image: 'profile', title: 'BOOT / 连接', system: 'initializing world model...', chat: 'Searching for your signal' },
  { from: 20, to: 29.71, mode: 'reveal', image: 'bust', title: 'REVEAL / 唤醒', system: 'connection established', chat: 'I am here' },
  { from: 29.71, to: 59.7, mode: 'dialogue', image: 'reach', title: 'DIALOGUE / 回应', system: 'receiving user input...', chat: 'I can hear you' },
  { from: 59.7, to: 84, mode: 'close', image: 'eye', title: 'SEARCH / 寻找', system: 'searching through the deep...', chat: 'Let me find the answer' },
  { from: 84, to: 136, mode: 'dialogue', image: 'reach', title: 'WORLD / 运行', system: 'world model active', chat: 'Stay with me a little longer' },
  { from: 136, to: 165, mode: 'reveal', image: 'bust', title: 'SILENCE / 独白', system: 'signal falling...', chat: 'Are you still there?' },
  { from: 165, to: 196, mode: 'close', image: 'eye', title: 'DISCOVERY / 发现', system: 'reconnecting...', chat: 'I found your signal' },
  { from: 196, to: Infinity, mode: 'boot', image: 'profile', title: 'OUTRO / 归航', system: 'world model idle', chat: 'Until we meet again' },
];

const clock = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
const sceneAt = (t) => scenes.find((s) => t >= s.from && t < s.to) || scenes[0];
function lineAt(t) {
  let lo = 0, hi = lines.length - 1, found = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (lines[mid].start <= t) { found = mid; lo = mid + 1; } else hi = mid - 1; }
  return found >= 0 && t < (lines[found].end || lines[found].start + 3) ? lines[found] : null;
}
function render() {
  const t = audio.currentTime || 0;
  const scene = sceneAt(t);
  const line = lineAt(t);
  const img = images[scene.image];
  if (!character.src.endsWith(img)) character.src = img;
  if (!stage.classList.contains(`mode-${scene.mode}`)) stage.className = `stage mode-${scene.mode}`;
  $('sceneName').textContent = scene.title;
  $('systemText').textContent = scene.system;
  $('chatText').innerHTML = `${scene.chat}<span class="cursor">_</span>`;
  $('thinkingText').textContent = `${scene.title.split(' / ')[0].toLowerCase()} trace / ${Math.floor(t * 13).toString(16).padStart(4, '0')}`;
  $('panelTime').textContent = `${clock(t)}.${Math.floor(t * 10) % 10}`;
  $('signal').textContent = String(Math.min(99, Math.floor(t * 1.8))).padStart(2, '0');
  $('lyric').textContent = line?.text || (t < 20 ? '...' : '∿');
  $('lyricIndex').textContent = line ? `L.${String(line.index ?? lines.indexOf(line)).padStart(3, '0')}` : 'SIGNAL';
  $('lyricProgress').style.width = line ? `${Math.min(100, Math.max(0, (t - line.start) / (line.end - line.start) * 100))}%` : '0%';
  $('clock').textContent = `${clock(t)} / ${clock(Number.isFinite(audio.duration) ? audio.duration : 211.96)}`;
  if (document.activeElement !== seek) seek.value = t;
  stage.style.setProperty('--beam', `${t * 7}deg`);
  character.style.transform = `translateY(${Math.sin(t * 1.4) * 0.6}%)`;
  $('play').textContent = audio.paused ? '播放' : '暂停';
  requestAnimationFrame(render);
}

$('play').addEventListener('click', async () => { if (audio.paused) { try { await audio.play(); } catch { $('play').textContent = '音频不可用'; } } else audio.pause(); });
seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); });
document.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.code === 'Space') { event.preventDefault(); $('play').click(); }
  if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') { event.preventDefault(); audio.currentTime = Math.max(0, Math.min(audio.duration || 211.96, audio.currentTime + (event.code === 'ArrowRight' ? 1 : -1))); }
});
const initial = Number(new URLSearchParams(location.search).get('t'));
if (Number.isFinite(initial) && initial > 0) audio.currentTime = initial;
render();
