// First time-driven storyboard pass for S15–S19. All motion is a function of song time.
const W = 1920, H = 1080;
const C = { bg: '#06131f', panel: '#0b2433', cyan: '#25bdd4', hot: '#83e9e6', white: '#e6f2ef', mute: '#526c7c', line: '#275467' };
const shots = [
  { id: 'S15', start: 59.223, end: 62.589, name: '接收' },
  { id: 'S16', start: 62.589, end: 66.601, name: '回路' },
  { id: 'S17', start: 66.601, end: 68.252, name: '伸手' },
  { id: 'S18', start: 68.252, end: 70.084, name: '触点' },
  { id: 'S19', start: 70.084, end: 74.045, name: '回声' },
];
const makeImage = (url) => { const img = new Image(); img.src = url; return img; };
const reach = makeImage('/assets/character/deepseek_reach_v3.png');
const palm = makeImage('/assets/character/v4/deepseek_palm_v4_closeup_native.png');
const bust = makeImage('/assets/character/deepseek_bust_v3.png');
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { const a = clamp(x); return a * a * (3 - 2 * a); };
const lerp = (a, b, k) => a + (b - a) * k;
const phase = (t, a, b) => clamp((t - a) / (b - a));

function line(ctx, points, color, width = 2, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
}
function circle(ctx, x, y, r, color, fill = true, width = 2, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
  ctx.restore();
}
function box(ctx, x, y, w, h, fill, stroke = C.line) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
}
function label(ctx, str, x, y, size = 24, color = C.mute, align = 'left', font = 'Consolas, monospace') {
  ctx.fillStyle = color; ctx.textAlign = align; ctx.font = `${size}px ${font}`; ctx.fillText(str, x, y);
}
function glow(ctx, x, y, r, color, alpha = .16) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'transparent');
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function cropText(ctx, text, x, y, width, size = 55) {
  if (!text) return;
  ctx.save(); ctx.font = `${size}px Georgia, serif`; ctx.fillStyle = C.white; ctx.textAlign = 'left';
  const words = text.split(/\s+/), rows = []; let row = '';
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (ctx.measureText(next).width > width && row) { rows.push(row); row = word; } else row = next;
  }
  if (row) rows.push(row);
  rows.slice(0, 2).forEach((part, i) => ctx.fillText(part, x, y + i * (size + 8)));
  ctx.restore();
}
function background(ctx, t, shot) {
  const g = ctx.createRadialGradient(1210, 430, 60, 1210, 430, 1120);
  g.addColorStop(0, '#0b3443'); g.addColorStop(.55, '#082333'); g.addColorStop(1, C.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.strokeStyle = '#55b4bf16'; ctx.lineWidth = 1;
  for (let x = 80; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 80; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
  if (shot.id !== 'S18') {
    line(ctx, [[65, 78], [215, 78]], C.cyan, 4);
    label(ctx, 'DEEPSEA / WORLD MODEL', 65, 118, 20, C.hot);
  }
  label(ctx, `${shot.id}  /  ${shot.name}`, W - 65, 118, 23, C.hot, 'right');
  label(ctx, `${t.toFixed(3)}  /  211.958`, W - 65, H - 45, 18, C.mute, 'right');
  label(ctx, 'INDEPENDENT FAN CONCEPT', 65, H - 45, 18, C.mute);
}
function subtitle(ctx, text, top = false) {
  const y = top ? 205 : 920;
  ctx.fillStyle = '#06131fd9'; ctx.fillRect(70, top ? 100 : 838, 1480, 150);
  line(ctx, [[95, top ? 113 : 850], [620, top ? 113 : 850]], C.cyan, 3);
  cropText(ctx, text, 115, y, 1330, 55);
}
function s15(ctx, t) {
  const k = phase(t, 59.223, 62.589);
  box(ctx, 165, 192, 1590, 650, '#071b29dd');
  label(ctx, 'CONVERSATION  /  LIVE', 205, 245, 25, C.hot);
  line(ctx, [[205, 275], [1715, 275]], C.line, 2);
  box(ctx, 970, 330, 680, 150, '#123b48', '#689da7');
  label(ctx, 'REMOTE INPUT', 1010, 380, 21, C.white);
  line(ctx, [[1020, 418], [1600, 418]], C.white, 3, .75);
  box(ctx, 275, 565, 725, 160, '#0b3443', C.cyan);
  label(ctx, 'DEEPSEEK / RESPONSE', 315, 615, 21, C.hot);
  line(ctx, [[325, 655], [855, 655]], C.cyan, 3, .85);
  if (bust.complete && bust.naturalWidth) { ctx.save(); ctx.globalAlpha = .12; ctx.drawImage(bust, 1500, 370, 340, 430); ctx.restore(); }
  const p = ease(phase(t, 60.85, 61.958));
  line(ctx, [[975, 555], [1080, 555]], C.cyan, 3, p);
  glow(ctx, 1080, 555, 90, C.cyan, p * .35);
  circle(ctx, 1080, 555, 9, C.hot, true, 1, p);
  const ripple = phase(t, 61.958, 62.589);
  if (ripple > 0) circle(ctx, 1080, 555, 12 + ripple * 270, C.cyan, false, 4, 1 - ripple);
  label(ctx, 'SIGNAL RECEIVED', 1180, 630, 18, C.mute, 'left');
}
function s16(ctx, t) {
  const p = ease(phase(t, 62.589, 66.601));
  label(ctx, 'FEEDBACK LOOP', 170, 230, 42, C.white);
  label(ctx, 'remote signal / local response', 170, 275, 22, C.mute);
  const source = [480, 560], remote = [1450, 390], joint = [1070, 540];
  glow(ctx, ...remote, 150, C.white, .11); circle(ctx, ...remote, 14, C.white);
  glow(ctx, ...source, 170, C.cyan, .2); circle(ctx, ...source, 22, C.cyan);
  line(ctx, [[480, 560], [660, 410], [950, 410], [1070, 540]], C.cyan, 7, .25);
  line(ctx, [[1450, 390], [1260, 390], [1070, 540]], C.white, 5, .22);
  const x = lerp(1450, 1070, ease(phase(p, .16, .72))), y = lerp(390, 540, ease(phase(p, .16, .72)));
  circle(ctx, x, y, 10, C.white);
  const local = ease(phase(p, .35, .95));
  line(ctx, [[480, 560], [lerp(480, 1070, local), lerp(560, 540, local)]], C.cyan, 5);
  if (p > .72) { circle(ctx, ...joint, 16, C.hot); circle(ctx, ...joint, 38 + (p - .72) * 70, C.cyan, false, 3, .7); }
  label(ctx, '01 / REQUEST', 390, 650, 21, C.mute);
  label(ctx, '02 / RETURN', 1350, 480, 21, C.mute);
}
function s17(ctx, t) {
  const p = ease(phase(t, 68.022, 68.252));
  const dx = -24 * p, dy = -146 * p;
  glow(ctx, 1130, 540, 610, C.cyan, .12);
  for (const r of [300, 475, 700]) circle(ctx, 1180, 530, r, C.cyan, false, 2, .22);
  if (reach.complete && reach.naturalWidth) ctx.drawImage(reach, 863.65 + dx, 19.39 + dy, 1342 * 850 / 1439, 1704 * 850 / 1439);
  const hand = [1123.56 + dx, 685.69 + dy];
  const q = ease(phase(t, 66.601, 68.252));
  const white = [lerp(1550, hand[0] + 75, q), lerp(470, hand[1] - 65, q)];
  line(ctx, [[1590, 460], white], C.white, 3, .35);
  circle(ctx, ...white, 8, C.white);
  label(ctx, 'APPROACH / NO CONTACT', 160, 735, 22, C.mute);
}
function s18(ctx, t) {
  const contact = 68.3;
  glow(ctx, 1100, 540, 550, C.cyan, .18);
  if (palm.complete && palm.naturalWidth) ctx.drawImage(palm, 565.39, 173.69, 757 * 620 / 501, 732 * 620 / 501);
  if (t < contact) {
    const k = ease(phase(t, 68.252, contact));
    circle(ctx, lerp(1310, 1100, k), lerp(365, 540, k), 14, C.white);
  } else {
    const p = t - contact;
    glow(ctx, 1100, 540, 150, C.cyan, .32);
    circle(ctx, 1100, 540, 10, C.cyan);
    circle(ctx, 1100, 540, 19, C.white, false, 3, .85);
    for (let i = 0; i < 3; i++) {
      const q = phase(p, i * .33, i * .33 + .75);
      if (q > 0 && q < 1) circle(ctx, 1100, 540, 25 + 210 * q, C.cyan, false, 3, .65 * (1 - q));
    }
  }
  label(ctx, 'CONTACT / MEMORY 001', 113, 330, 24, C.hot);
  label(ctx, 'one signal remains', 113, 372, 22, C.mute);
}
function s19(ctx, t) {
  const p = ease(phase(t, 70.084, 74.045));
  glow(ctx, 1100, 540, 220, C.cyan, .25);
  circle(ctx, 1100, 540, 13, C.cyan);
  const route = [[1100, 540], [900, 540], [900, 370], [640, 370], [640, 710], [385, 710]];
  line(ctx, route, C.line, 4, .75);
  const nodes = [[900, 540], [900, 370], [640, 370], [640, 710], [385, 710]];
  nodes.forEach(([x, y], i) => { circle(ctx, x, y, 10, C.cyan, false, 2, .7); if (p > (i + 1) / 6) circle(ctx, x, y, 5, C.hot); });
  const pathProgress = p * (route.length - 1);
  const whole = Math.floor(pathProgress);
  const tip = route[Math.min(whole, route.length - 1)];
  const next = route[Math.min(whole + 1, route.length - 1)];
  const traveled = [...route.slice(0, whole + 1), [lerp(tip[0], next[0], pathProgress - whole), lerp(tip[1], next[1], pathProgress - whole)]];
  line(ctx, traveled, C.hot, 3);
  const gx = 350, gy = 250, gw = 1020, gh = 590;
  ctx.save(); ctx.globalAlpha = .7 * p; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.strokeRect(gx, gy, gw, gh);
  for (let x = gx + 85; x < gx + gw; x += 85) line(ctx, [[x, gy], [x, gy + gh]], C.line, 1, .45);
  for (let y = gy + 85; y < gy + gh; y += 85) line(ctx, [[gx, y], [gx + gw, y]], C.line, 1, .45);
  ctx.restore();
  circle(ctx, 1580, 515, 12, C.white);
  label(ctx, 'REMOTE / OUTSIDE MODEL', 1550, 585, 20, C.white, 'right');
  label(ctx, 'PATH STORED', 350, 208, 25, C.hot);
}

export function renderP0(canvas, t, text) {
  const ctx = canvas.getContext('2d');
  const shot = shots.find((s) => t >= s.start && t < s.end);
  if (!shot) return;
  background(ctx, t, shot);
  ({ S15: s15, S16: s16, S17: s17, S18: s18, S19: s19 })[shot.id](ctx, t);
  subtitle(ctx, text, shot.id === 'S18');
  return `${shot.id} / ${shot.name}`;
}
