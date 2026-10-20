'use strict';
// Core: canvas, input, sound, drawing helpers, particles, buttons.

const W = 960, H = 540, GY = 470;
const FONT = "'Fredoka', 'Trebuchet MS', sans-serif";
const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const DPR = Math.min(2, window.devicePixelRatio || 1);
canvas.width = W * DPR;
canvas.height = H * DPR;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = k => 1 - (1 - k) * (1 - k);

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
const FACES = ['neutral', 'happy', 'excited', 'determined', 'focused', 'surprised', 'laughing',
  'serious', 'thinking', 'sad', 'angry', 'silly', 'winky'];
const IMG = {};
function loadImages() {
  const list = [
    ...['idle_front', 'idle_back', 'crouch', 'jump', 'twirl', 'cast', 'run1', 'run2', 'run3', 'run4', 'run5']
      .map(n => [n, `assets/sprites/${n}.png`]),
    ...FACES.map(n => [`face_${n}`, `assets/faces/face_${n}.png`]),
    ...['book', 'bubbles', 'tiara', 'butterfly', 'necklace'].map(n => [`item_${n}`, `assets/items/item_${n}.png`]),
  ];
  return Promise.all(list.map(([key, src]) => new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => { IMG[key] = im; resolve(); };
    im.onerror = () => reject(new Error(`Couldn't load ${src}`));
    im.src = src;
  })));
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const keys = {};
let pressed = {};
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (!keys[k]) pressed[k] = true;
  keys[k] = true;
  if ([' ', 'arrowleft', 'arrowright', 'arrowdown', 'arrowup'].includes(k)) e.preventDefault();
  audioInit();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const goLeft = () => keys.arrowleft || keys.a;
const goRight = () => keys.arrowright || keys.d;
const goDown = () => keys.arrowdown || keys.s;
const jumpPressed = () => pressed.arrowup || pressed.w || pressed[' '];
const actionPressed = () => pressed.e || pressed.enter;
const advancePressed = () => pressed.e || pressed.enter || pressed[' '];

const pointer = { x: 0, y: 0, down: false, clicked: false };
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  pointer.x = (e.clientX - r.left) * W / r.width;
  pointer.y = (e.clientY - r.top) * H / r.height;
}
canvas.addEventListener('pointerdown', e => { toCanvas(e); pointer.down = true; pointer.clicked = true; audioInit(); });
canvas.addEventListener('pointermove', toCanvas);
addEventListener('pointerup', () => { pointer.down = false; });
const inRect = (r, x = pointer.x, y = pointer.y) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;

// ---------------------------------------------------------------------------
// Sound: tiny WebAudio synth, no files
// ---------------------------------------------------------------------------
let AC = null, muted = false;
function audioInit() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ } }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
  if (!AC || muted) return;
  const t = AC.currentTime + Math.max(0, when);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(AC.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.05, when = 0) {
  if (!AC || muted) return;
  const len = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 6000;
  src.buffer = buf; g.gain.value = vol;
  src.connect(f).connect(g).connect(AC.destination);
  src.start(AC.currentTime + Math.max(0, when));
}
const SFX = {
  pick() { tone(784, 0.1, 'triangle', 0.1); tone(1175, 0.14, 'triangle', 0.08, 0.07); },
  sparkle() { [880, 1175, 1397, 1760].forEach((f, i) => tone(f, 0.3, 'sine', 0.07, i * 0.06)); },
  whinny() { for (let i = 0; i < 7; i++) tone(760 - i * 45, 0.12, 'sawtooth', 0.04, i * 0.08, 940 - i * 60); },
  alert() { tone(520, 0.12, 'square', 0.05); tone(780, 0.18, 'square', 0.05, 0.13); },
  fail() { tone(420, 0.5, 'sawtooth', 0.06, 0, 140); },
  blip() { tone(520, 0.05, 'square', 0.025); },
  click() { tone(900, 0.05, 'triangle', 0.06); },
  pop() { tone(rand(900, 1300), 0.08, 'sine', 0.1, 0, 300); },
  jump() { tone(380, 0.15, 'triangle', 0.06, 0, 700); },
  step() { tone(120, 0.06, 'triangle', 0.08); },
  scrub() { noise(0.06, 0.02); },
  fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.08, i * 0.14)); },
  hit() { tone(1047, 0.12, 'triangle', 0.08); tone(1568, 0.1, 'sine', 0.05, 0.03); },
  miss() { tone(180, 0.15, 'square', 0.04); },
};

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
function hexRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
function mix(c1, c2, k) {
  const a = hexRgb(c1), b = hexRgb(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * clamp(k, 0, 1)).toString(16).padStart(2, '0')).join('');
}
function ellipse(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, Math.PI * 2); ctx.fill(); }
function circle(x, y, r) { ellipse(x, y, r, r); }
function tri(x1, y1, x2, y2, x3, y3) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function text(str, x, y, size, color, align = 'left', weight = 600) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}
function outlined(str, x, y, size, color, align = 'center', stroke = 'rgba(52,26,72,.9)') {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(4, size / 5); ctx.strokeStyle = stroke; ctx.lineJoin = 'round';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function emoji(ch, x, y, size) {
  ctx.font = `${size}px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText(ch, x, y + size * 0.05);
}
function wrap(str, maxW, size, weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const out = [];
  for (const para of str.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}
// size = width in pixels; (x, y) is the top-center dip
function heart(x, y, size, fill) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 36, size / 36);
  ctx.beginPath();
  ctx.moveTo(0, 6); ctx.bezierCurveTo(0, 3, -4, -4, -10, -4); ctx.bezierCurveTo(-18, -4, -18, 6, -18, 6);
  ctx.bezierCurveTo(-18, 12, -10, 18, 0, 24); ctx.bezierCurveTo(10, 18, 18, 12, 18, 6);
  ctx.bezierCurveTo(18, 6, 18, -4, 10, -4); ctx.bezierCurveTo(4, -4, 0, 3, 0, 6);
  ctx.fillStyle = fill; ctx.fill();
  ctx.restore();
}
function star(x, y, r, color, points = 4) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 ? r * 0.38 : r, a = i * Math.PI / points - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}
function panel(x, y, w, h, r = 16) {
  ctx.save();
  ctx.shadowColor = 'rgba(30,10,50,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
  rrect(x, y, w, h, r, 'rgba(255,248,252,.96)');
  ctx.restore();
  rrect(x, y, w, h, r, null, '#e2c6f5', 3);
}
function darkPanel(x, y, w, h, r = 14) { rrect(x, y, w, h, r, 'rgba(48,24,72,.78)'); }
function bar(x, y, w, h, v, col, bg = 'rgba(120,90,150,.25)') {
  rrect(x, y, w, h, h / 2, bg);
  if (v > 0) rrect(x, y, Math.max(h, w * clamp(v, 0, 100) / 100), h, h / 2, col);
}

// ---------------------------------------------------------------------------
// Buttons: built every frame, clicked via pointer
// ---------------------------------------------------------------------------
let buttons = [];
function button(id, x, y, w, h, label, { on = true, icon = null, sub = null, color = '#ff6fb5', size = 18, key = null } = {}) {
  const b = { id, x, y, w, h, on, key };
  buttons.push(b);
  const hover = on && inRect(b);
  ctx.save();
  if (on) { ctx.shadowColor = 'rgba(80,20,80,.3)'; ctx.shadowBlur = hover ? 12 : 6; ctx.shadowOffsetY = 3; }
  rrect(x, y + (hover ? -1 : 0), w, h, Math.min(16, h / 2), on ? (hover ? mix(color, '#ffffff', 0.18) : color) : '#b9aac4');
  ctx.restore();
  rrect(x, y + (hover ? -1 : 0), w, h, Math.min(16, h / 2), null, 'rgba(255,255,255,.85)', 2.5);
  let tx = x + w / 2, align = 'center';
  if (icon) { emoji(icon, x + 26, y + h / 2, Math.min(26, h - 16)); tx = x + 48; align = 'left'; }
  const ty = sub ? y + h / 2 - 8 : y + h / 2;
  text(label, tx, ty, size, '#fff', align, 700);
  if (sub) text(sub, tx, y + h / 2 + 11, 12, 'rgba(255,255,255,.85)', align, 500);
  if (key) text(key, x + w - 14, y + h / 2, 12, 'rgba(255,255,255,.6)', 'right', 700);
  return b;
}
function clickedButton() {
  for (const b of buttons) {
    if (!b.on) continue;
    if ((pointer.clicked && inRect(b)) || (b.key && pressed[b.key.toLowerCase()])) { SFX.click(); return b.id; }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Particles & floating text
// ---------------------------------------------------------------------------
const parts = [];
const floats = [];
function burst(x, y, n, { colors = ['#fff6a8', '#ffb3e0', '#b8e6ff'], kind = 'spark', world = false, spread = 160, up = 80, size = [3, 7] } = {}) {
  for (let i = 0; i < n; i++) {
    parts.push({ x, y, vx: rand(-spread, spread), vy: rand(-spread, spread / 3) - up, life: rand(0.6, 1.2),
      col: colors[i % colors.length], size: rand(size[0], size[1]), kind, world, spin: rand(0, 6) });
  }
}
function floatText(x, y, str, col = '#fff', world = false, size = 20) { floats.push({ x, y, str, col, life: 1.6, world, size }); }
function updateFx(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.spin += dt * 4;
    p.vy += (p.kind === 'bubble' ? -30 : p.kind === 'heart' ? 20 : 140) * dt;
    if (p.kind === 'bubble') p.vx *= 0.97;
    if (p.life <= 0) parts.splice(i, 1);
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    floats[i].life -= dt; floats[i].y -= 30 * dt;
    if (floats[i].life <= 0) floats.splice(i, 1);
  }
}
function drawFx(world, cam = 0) {
  for (const p of parts) {
    if (p.world !== world) continue;
    const x = world ? p.x - cam : p.x;
    ctx.globalAlpha = clamp(p.life / 0.5, 0, 1);
    if (p.kind === 'heart') heart(x, p.y, p.size * 3, p.col);
    else if (p.kind === 'bubble') {
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, p.y, p.size * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(190,230,255,.25)'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(x - p.size * 0.7, p.y - p.size * 0.7, p.size * 0.4);
    } else if (p.kind === 'emoji') emoji(p.col, x, p.y, p.size * 4);
    else star(x, p.y, p.size, p.col);
  }
  ctx.globalAlpha = 1;
  for (const f of floats) {
    if (f.world !== world) continue;
    ctx.globalAlpha = clamp(f.life, 0, 1);
    outlined(f.str, world ? f.x - cam : f.x, f.y, f.size, f.col);
  }
  ctx.globalAlpha = 1;
}
