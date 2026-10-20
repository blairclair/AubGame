'use strict';
// Art: the unicorn (with hairstyles, colours, accessories), grown-ups, scenery.

const OL = '#5b3f73';      // storybook ink outline
const OL_DARK = '#3d2c4a';

const MANES = {
  natural:  ['#f7b6d2', '#d7c2f5', '#ffd9ec', '#c9b6f0'],
  pink:     ['#ff7fb8', '#ffa8d0', '#ff5fa2', '#ffc9e3'],
  lavender: ['#a982f5', '#c9b2ff', '#8e66e8', '#dccfff'],
  ocean:    ['#4fb8ec', '#7fdcea', '#3a8fd8', '#a9e8ff'],
  gold:     ['#ffc83d', '#ffe08f', '#eba22a', '#fff0b8'],
  rainbow:  ['#ff8fb8', '#ffbf73', '#ffe873', '#8fe6a6', '#7cc8ff', '#b79bff'],
  midnight: ['#4a46a8', '#6c5fd0', '#332f80', '#8f82ea'],
  seafoam:  ['#5fd8b8', '#a0eed6', '#3fbea0', '#c8f7e8'],
};
const HOOF_COLORS = { pink: '#ff7fb8', gold: '#ffc83d', pearl: '#f4ecff', star: '#5b52c8' };

// --- shapes (unicorn faces right, origin at her feet) ------------------------
const P2 = s => new Path2D(s);
const U = {
  body: P2('M-60,-80 C-64,-110 -32,-122 0,-119 C32,-117 62,-110 62,-82 C62,-56 40,-48 0,-48 C-38,-48 -58,-54 -60,-80 Z'),
  neck: P2('M24,-110 C32,-132 44,-150 58,-166 L92,-152 C82,-132 72,-110 62,-80 C50,-70 30,-72 22,-86 Z'),
  head: P2('M60,-176 C56,-200 84,-212 104,-200 C118,-191 128,-174 126,-158 C124,-143 108,-138 92,-142 C74,-146 62,-158 60,-176 Z'),
  ear: P2('M70,-194 C63,-208 63,-220 68,-232 C79,-222 85,-209 85,-197 Z'),
  earIn: P2('M72,-199 C69,-209 69,-217 70,-224 C77,-216 81,-207 81,-201 Z'),
  horn: P2('M81,-199 C85,-216 91,-237 99,-256 C100,-237 99,-217 97,-199 Z'),
  leg: P2('M-9,0 C-10,20 -9,36 -8,46 L8,46 C9,36 10,20 9,0 Z'),
  wing: P2('M0,0 C-14,-40 -54,-78 -96,-74 C-86,-56 -80,-44 -70,-34 C-84,-26 -78,-12 -56,-6 C-64,4 -46,12 -28,8 C-16,6 -6,4 0,0 Z'),
  cape: P2('M44,-114 C22,-126 -30,-128 -58,-110 C-66,-90 -68,-66 -62,-50 C-44,-58 -22,-56 0,-62 C22,-68 38,-82 44,-114 Z'),
  blanket: P2('M-32,-120 C-10,-124 18,-122 32,-117 C36,-100 36,-84 34,-68 C10,-62 -14,-62 -36,-68 C-38,-86 -37,-104 -32,-120 Z'),
};
const MANE_ANCHORS = [[82, -206], [70, -197], [61, -182], [54, -166], [46, -150], [38, -134], [30, -118], [24, -102]];

// a tapered, gently S-curved lock of hair along +x; curl flicks the tip
function lockPath(len, w, curl = 0) {
  const p = new Path2D();
  const wave = w * 0.35;
  p.moveTo(0, -w / 2);
  p.bezierCurveTo(len * 0.3, -w * 0.8 - wave, len * 0.6, -w * 0.3 + wave, len, curl);
  p.bezierCurveTo(len * 0.62, w * 0.45 + wave + curl * 0.4, len * 0.3, w * 0.6 - wave, 0, w / 2);
  p.closePath();
  return p;
}
function ink(path, fill, lw) {
  ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
  ctx.stroke(path);
  ctx.fillStyle = fill; ctx.fill(path);
}
function inkAt(x, y, rot, path, fill, lw) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ink(path, fill, lw); ctx.restore();
}
function inkCircle(x, y, r, fill, lw) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.stroke();
  ctx.fillStyle = fill; ctx.fill();
}
function inkEllipse(x, y, rx, ry, rot, fill, lw) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.stroke();
  ctx.fillStyle = fill; ctx.fill();
}
function flower(x, y, r, petal, center = '#ffd84a', lw = 1) {
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    inkCircle(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.48, petal, lw * 0.6);
  }
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    ctx.fillStyle = petal; circle(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.48);
  }
  ctx.fillStyle = center; circle(x, y, r * 0.38);
}
function vecStar(x, y, r, fill, lw, points = 5) {
  const p = new Path2D();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 ? r * 0.45 : r, a = i * Math.PI / points - Math.PI / 2;
    p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  p.closePath();
  ink(p, fill, lw);
}
function shell(x, y, r, rot, lw) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const p = new Path2D(`M0,${r * 0.6} L${-r},${-r * 0.2} C${-r * 0.8},${-r * 1.1} ${r * 0.8},${-r * 1.1} ${r},${-r * 0.2} Z`);
  ink(p, '#ffd9cf', lw * 0.6);
  ctx.strokeStyle = '#e8a598'; ctx.lineWidth = lw * 0.6;
  for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(0, r * 0.5); ctx.lineTo(k * r, -r * 0.75); ctx.stroke(); }
  ctx.restore();
}
function bow(x, y, sz, col, lw, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sz / 20, sz / 20);
  const loop = P2('M0,0 C-8,-14 -24,-16 -24,-2 C-24,10 -10,8 0,0 Z');
  ink(loop, col, lw * 20 / sz);
  ctx.save(); ctx.scale(-1, 1); ink(loop, col, lw * 20 / sz); ctx.restore();
  ink(P2('M-3,2 L-10,18 L-4,15 L0,20 Z'), mix(col, '#000000', 0.12), lw * 20 / sz);
  ink(P2('M3,2 L10,18 L4,15 L0,20 Z'), mix(col, '#000000', 0.12), lw * 20 / sz);
  inkCircle(0, 0, 5, mix(col, '#ffffff', 0.25), lw * 20 / sz);
  ctx.restore();
}

// --- hair ---------------------------------------------------------------------
function drawLock(x, y, angle, len, w, col, lw, curl = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ink(lockPath(len, w, curl), col, lw);
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = lw * 0.9;
  ctx.beginPath(); ctx.moveTo(len * 0.15, -w * 0.12); ctx.quadraticCurveTo(len * 0.5, -w * 0.35, len * 0.8, -w * 0.05); ctx.stroke();
  ctx.restore();
}
// many locks drawn as one mass: outline them all first, then fill, so they read as hair
function drawLockMass(locks, lw) {
  const placed = locks.map(l => { const m = new DOMMatrix().translate(l.x, l.y).rotate(l.ang * 180 / Math.PI); const p = new Path2D(); p.addPath(lockPath(l.len, l.w, l.curl), m); return { ...l, p, m }; });
  ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
  for (const l of placed) ctx.stroke(l.p);
  for (const l of placed) { ctx.fillStyle = l.col; ctx.fill(l.p); }
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = lw * 0.8;
  for (const l of placed) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.ang);
    ctx.beginPath(); ctx.moveTo(l.len * 0.12, -l.w * 0.1); ctx.bezierCurveTo(l.len * 0.35, -l.w * 0.45, l.len * 0.6, l.w * 0.05, l.len * 0.82, l.curl * 0.6); ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = lw * 0.7;
  for (const l of placed) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.ang);
    ctx.beginPath(); ctx.moveTo(l.len * 0.3, l.w * 0.2); ctx.quadraticCurveTo(l.len * 0.6, l.w * 0.35, l.len * 0.85, l.curl * 0.8); ctx.stroke();
    ctx.restore();
  }
}
function curlPuff(x, y, r, col, lw) {
  inkCircle(x, y, r, col, lw);
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = lw * 0.9;
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0.5, 4.8); ctx.stroke();
}
function braidChain(pts, pal, lw) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const a = Math.atan2(y2 - y1, x2 - x1);
    inkEllipse((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(x2 - x1, y2 - y1) * 0.75, 9, a + (i % 2 ? 0.55 : -0.55), pal[i % 2], lw);
  }
}
function mane(P) {
  const { look, pal, lw, t } = P;
  const sway = i => Math.sin(t * 2.2 + i * 0.7) * 0.06;
  if (look.style === 'curly') {
    MANE_ANCHORS.forEach(([x, y], i) => curlPuff(x - 6, y + 4, 14 - i * 0.4, pal[i % pal.length], lw));
  } else if (look.style === 'braid') {
    drawLock(78, -204, 2.3, 24, 14, pal[1], lw);
    const pts = [];
    for (let i = 0; i <= 9; i++) { const k = i / 9; pts.push([lerp(72, 18, k) + Math.sin(k * 3) * 4, lerp(-200, -96, k)]); }
    braidChain(pts, pal, lw);
    drawLock(18, -96, 2.2 + sway(1), 20, 12, pal[2 % pal.length], lw);
    bow(20, -98, 11, '#ff6fae', lw);
  } else if (look.style === 'topknot') {
    MANE_ANCHORS.slice(2).forEach(([x, y], i) => drawLock(x, y, 2.5 + sway(i), 22, 12, pal[(i + 1) % pal.length], lw, 2));
  } else {
    // flowing: long locks that fall over the shoulder, top ones sweep back
    const n = MANE_ANCHORS.length, locks = [];
    for (let pass = 0; pass < 2; pass++) {
      MANE_ANCHORS.forEach(([x, y], i) => {
        const k = i / (n - 1);
        locks.push({ x: x + (pass ? 0 : -3), y: y + (pass ? 0 : 3), ang: lerp(2.55, 1.85, k) + (pass ? 0.12 : -0.05) + sway(i + pass),
          len: [30, 42, 52, 58, 58, 54, 46, 38][i] + (pass ? 0 : 10), w: pass ? 20 : 23, col: pal[(i + (pass ? 0 : 1)) % pal.length], curl: pass ? 7 : 10 });
      });
    }
    drawLockMass(locks, lw);
  }
}
function topknotBun(P) {
  if (P.look.style !== 'topknot') return;
  curlPuff(66, -218, 17, P.pal[0], P.lw);
  curlPuff(58, -206, 11, P.pal[1], P.lw);
  bow(70, -202, 10, '#ff6fae', P.lw, -0.4);
}
function forelock(P) {
  const { look, pal, lw } = P;
  if (look.style === 'curly') { curlPuff(92, -202, 9, pal[1], lw); curlPuff(101, -196, 7, pal[2 % pal.length], lw); return; }
  if (look.style === 'topknot') { drawLock(84, -203, 0.9, 16, 11, pal[1], lw); return; }
  drawLock(84, -205, 1.0, 26, 13, pal[1], lw, 3);
  drawLock(88, -203, 0.7, 18, 10, pal[2 % pal.length], lw, 2);
}
function tail(P) {
  const { look, pal, lw, t } = P;
  const rx = -58, ry = -96;
  const sway = i => Math.sin(t * 2.6 + i * 0.6) * 0.09;
  if (look.style === 'curly') {
    [[-70, -96, 14], [-82, -84, 14], [-88, -68, 13], [-86, -52, 12], [-78, -40, 10]].forEach(([x, y, r], i) => curlPuff(x, y, r, pal[i % pal.length], lw));
  } else if (look.style === 'braid') {
    const pts = [];
    for (let i = 0; i <= 8; i++) { const k = i / 8; pts.push([lerp(rx, -92, k) + Math.sin(t * 2 + k * 3) * 3 * k, lerp(ry, -34, k)]); }
    braidChain(pts, pal, lw);
    drawLock(-92, -34, 1.9 + sway(1), 22, 14, pal[2 % pal.length], lw);
  } else {
    const n = look.style === 'topknot' ? 3 : 4, locks = [];
    for (let i = 0; i < n; i++) locks.push({ x: rx + 2, y: ry + i * 3, ang: 1.75 + i * 0.22 + sway(i), len: 86 - i * 8, w: 28, col: pal[(i + 1) % pal.length], curl: 14 });
    for (let i = 0; i < n - 1; i++) locks.push({ x: rx, y: ry + i * 4, ang: 1.9 + i * 0.25 + sway(i + 3), len: 70 - i * 8, w: 20, col: pal[i % pal.length], curl: 10 });
    drawLockMass(locks, lw);
    if (look.style === 'topknot') bow(rx - 4, ry + 2, 10, '#ff6fae', lw, 0.3);
  }
}

// --- accessories ----------------------------------------------------------------
function accBack(P, behind) {
  const { look, lw, t } = P;
  const b = look.back;
  if (b === 'wings') {
    const flap = Math.sin(t * 5) * 0.12;
    const g = ctx.createLinearGradient(-90, -190, 0, -110);
    g.addColorStop(0, 'rgba(200,235,255,.9)'); g.addColorStop(1, 'rgba(255,205,240,.9)');
    if (behind) inkAt(4, -114, -0.15 - flap, U.wing, g, lw);
    else {
      inkAt(-8, -112, flap, U.wing, g, lw);
      ctx.save(); ctx.translate(-8, -112); ctx.rotate(flap);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-40, -40, -80, -64); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-40, -16, -62, -30); ctx.stroke();
      ctx.restore();
    }
    return;
  }
  if (behind) return;
  if (b === 'cape' || b === 'starcape') {
    const night = b === 'starcape';
    const g = ctx.createLinearGradient(0, -128, 0, -50);
    g.addColorStop(0, night ? '#3a3590' : '#9a5ce8'); g.addColorStop(1, night ? '#221f5c' : '#6a35b8');
    ink(U.cape, g, lw);
    ctx.strokeStyle = night ? '#c9c2ff' : '#ffd84a'; ctx.lineWidth = lw * 1.6;
    ctx.beginPath(); ctx.moveTo(-62, -50); ctx.bezierCurveTo(-44, -58, -22, -56, 0, -62); ctx.bezierCurveTo(22, -68, 38, -82, 44, -114); ctx.stroke();
    if (night) [[-30, -100], [-8, -84], [14, -104], [-44, -72], [24, -86]].forEach(([x, y], i) => star(x, y, 4 + (i % 2) * 2, `rgba(255,250,200,${0.6 + 0.4 * Math.sin(t * 3 + i)})`));
    vecStar(42, -112, 7, night ? '#c9c2ff' : '#ffd84a', lw * 0.7);
  } else if (b === 'blanket' || b === 'shawl') {
    const sea = b === 'shawl';
    ink(U.blanket, sea ? '#7fdcd0' : '#ffb3d6', lw);
    ctx.fillStyle = sea ? '#5fc4b8' : '#ff8fc0';
    for (let i = 0; i < 8; i++) circle(-32 + i * 9.5, -66, 4);
    if (sea) { shell(-10, -96, 9, 0, lw); shell(14, -92, 7, 0.3, lw); }
    else { flower(-14, -98, 9, '#fff', '#ffd84a', lw); flower(12, -90, 7, '#ff6fae', '#ffd84a', lw); }
  }
}
function accTail(P) {
  const { look, lw } = P;
  const x = -60, y = -94;
  if (look.tail === 'tailbow') bow(x, y, 12, '#ff5fa2', lw, 0.4);
  if (look.tail === 'tailflowers') { flower(x - 4, y, 8, '#ff9ec7', '#ffd84a', lw); flower(x - 14, y + 10, 6, '#fff', '#ffd84a', lw); }
  if (look.tail === 'pearls') for (let i = 0; i < 6; i++) inkCircle(x - 6 - i * 5, y + 4 + i * 9, 4, '#fbf6ff', lw * 0.6);
  if (look.tail === 'tailstars') { vecStar(x - 6, y + 2, 8, '#ffe36b', lw * 0.7); vecStar(x - 20, y + 18, 6, '#ffe36b', lw * 0.7); }
  if (look.tail === 'goldcuff') { ctx.save(); ctx.translate(x - 4, y + 4); ctx.rotate(0.5); rrect(-8, -6, 16, 12, 3, '#ffc83d', OL, lw * 1.2); ctx.restore(); }
}
function accNeck(P) {
  const { look, lw, t } = P;
  const n = look.neck;
  const arc = k => [lerp(30, 70, k), -112 + Math.sin(k * Math.PI) * 18 + k * 26];
  if (n === 'necklace') {
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = lw * 1.6;
    ctx.beginPath(); for (let i = 0; i <= 10; i++) { const [x, y] = arc(i / 10); ctx.lineTo(x, y); } ctx.stroke();
    [0.2, 0.5, 0.8].forEach((k, i) => {
      const [x, y] = arc(k);
      const gem = P2(`M${x},${y - 7} L${x + 6},${y} L${x},${y + 9} L${x - 6},${y} Z`);
      ink(gem, ['#b06ee8', '#ff5fa2', '#5fb8f0'][i], lw * 0.7);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x - 1.5, y - 2, 1.5);
    });
  }
  if (n === 'lei') for (let i = 0; i < 6; i++) { const [x, y] = arc(i / 5); flower(x, y, 7, i % 2 ? '#fff' : '#ffe36b', i % 2 ? '#ffd84a' : '#ff9a3d', lw); }
  if (n === 'shells') for (let i = 0; i < 5; i++) { const [x, y] = arc(i / 4); shell(x, y, 7, 0.2, lw); }
  if (n === 'starpendant' || n === 'bell') {
    ctx.strokeStyle = n === 'bell' ? '#ff5fa2' : '#c9c2ff'; ctx.lineWidth = lw * 2.4;
    ctx.beginPath(); for (let i = 0; i <= 10; i++) { const [x, y] = arc(i / 10); ctx.lineTo(x, y); } ctx.stroke();
    const [px, py] = arc(0.5);
    if (n === 'bell') inkCircle(px, py + 7, 7, '#ffc83d', lw * 0.8);
    else { vecStar(px, py + 9, 9, '#ffe36b', lw * 0.7); star(px + 12, py, 3 + Math.sin(t * 5) * 1.5, '#fff'); }
  }
}
function accHead(P) {
  const { look, lw, t } = P;
  const h = look.head;
  if (h === 'tiara') {
    ctx.save(); ctx.translate(90, -204); ctx.rotate(0.15);
    const g = ctx.createLinearGradient(0, -24, 0, 4);
    g.addColorStop(0, '#fff6c8'); g.addColorStop(1, '#e8b830');
    ink(P2('M-22,2 L-24,-10 L-14,-4 L-10,-18 L-3,-6 L0,-24 L3,-6 L10,-18 L14,-4 L24,-10 L22,2 Z'), g, lw * 0.8);
    inkCircle(0, -6, 4, '#ff5fa2', lw * 0.5); inkCircle(-12, -3, 2.6, '#b06ee8', lw * 0.4); inkCircle(12, -3, 2.6, '#5fb8f0', lw * 0.4);
    star(0, -26, 3 + Math.sin(t * 6) * 1.5, '#fff');
    ctx.restore();
  }
  if (h === 'crown') [[68, -198, '#ff9ec7'], [78, -207, '#fff'], [90, -209, '#ffe36b'], [102, -205, '#ff9ec7'], [112, -197, '#fff']]
    .forEach(([x, y, c]) => flower(x, y, 8, c, c === '#ffe36b' ? '#ff9a3d' : '#ffd84a', lw));
  if (h === 'bigbow') bow(72, -214, 15, '#ff5fa2', lw, -0.3);
  if (h === 'starclip') { vecStar(108, -194, 10, '#ffe36b', lw * 0.8); star(118, -206, 3 + Math.sin(t * 6) * 1.5, '#fff'); }
  if (h === 'shellcomb') { shell(74, -210, 11, -0.4, lw); inkCircle(80, -200, 3, '#fbf6ff', lw * 0.5); }
}

// --- the unicorn --------------------------------------------------------------
// look: { mane, style, head, neck, back, tail, hooves, shine }
// o: { facing, pose: 'stand'|'sit', moving, glow, mood: 'happy'|'sad'|'wow'|'joy'|'sleep', mud: [...] , t }
function drawUnicorn(x, y, s, look, o = {}) {
  const t = o.t ?? (typeof S !== 'undefined' && S ? S.t : 0);
  const shine = look.shine ?? 100;
  const pal = (MANES[look.mane] || MANES.natural).map(c => mix('#b5abbd', c, 0.3 + 0.7 * shine / 100));
  const P = { t, look, o, pal, shine, lw: 1.3 + 1.3 / s,
    body: mix('#d9d0dd', '#ffffff', shine / 100), shade: mix('#bdb1c8', '#e9def6', shine / 100) };
  const sit = o.pose === 'sit';
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.facing || 1), s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  if (o.glow) {
    const g = ctx.createRadialGradient(10, -120, 10, 10, -120, 190);
    g.addColorStop(0, `rgba(255,236,255,${0.55 * o.glow})`); g.addColorStop(1, 'rgba(255,236,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-200, -320, 400, 330);
  }
  ctx.fillStyle = 'rgba(40,20,60,.18)'; ellipse(4, -2, 72, 9);

  const hoof = HOOF_COLORS[look.hooves] || mix('#b9a6cf', '#c9a7e0', shine / 100);
  const legs = (xs, col, phase) => xs.forEach((lx, i) => {
    const sw = o.moving ? Math.sin(t * 13 + phase + i * Math.PI) * 0.4 : 0;
    ctx.save(); ctx.translate(lx, -60); ctx.rotate(sw);
    ink(U.leg, col, P.lw);
    ctx.beginPath(); ctx.roundRect(-9.5, 43, 19, 15, 5);
    ctx.strokeStyle = OL; ctx.lineWidth = P.lw * 2; ctx.stroke();
    ctx.fillStyle = hoof; ctx.fill();
    if (look.hooves) { ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(-3, 48, 2); }
    ctx.restore();
  });
  if (sit) {
    inkEllipse(-34, -12, 22, 10, 0, P.shade, P.lw); inkEllipse(40, -10, 24, 10, 0, P.shade, P.lw);
    inkEllipse(58, -9, 9, 7, 0, hoof, P.lw); inkEllipse(-52, -10, 9, 7, 0, hoof, P.lw);
    ctx.translate(0, 40);
  } else {
    legs([-28, 46], P.shade, 0);
    legs([-42, 30], P.body, Math.PI / 2);
  }

  tail(P);
  accBack(P, true);
  // body + neck share one silhouette: stroke both, then fill both, so no seam shows
  const bg = ctx.createLinearGradient(0, -170, 0, -48);
  bg.addColorStop(0, P.body); bg.addColorStop(1, P.shade);
  ctx.strokeStyle = OL; ctx.lineWidth = P.lw * 2;
  ctx.stroke(U.body); ctx.stroke(U.neck);
  ctx.fillStyle = bg; ctx.fill(U.body); ctx.fill(U.neck);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-10, -106, 30, 7, -0.05);
  accTail(P);
  accBack(P, false);
  mane(P);
  accNeck(P);

  // head
  ctx.save();
  const bob = o.moving ? Math.sin(t * 13) * 2 : Math.sin(t * 2) * 1.2;
  ctx.translate(0, bob);
  if (sit || o.mood === 'sad') { ctx.translate(60, -160); ctx.rotate(0.12); ctx.translate(-60, 160); }
  topknotBun(P);
  ink(U.ear, P.body, P.lw); ctx.fillStyle = '#ffc6dc'; ctx.fill(U.earIn);
  ink(U.head, P.body, P.lw);
  ctx.fillStyle = '#ffe3ee'; ellipse(112, -156, 15, 12.5, -0.2);
  ctx.fillStyle = 'rgba(160,100,140,.55)'; ellipse(121, -160, 2.2, 1.6, 0.4);
  ctx.fillStyle = 'rgba(255,130,175,.45)'; ellipse(100, -158, 7, 4.5);
  uniFace(P);
  forelock(P);
  const hg = ctx.createLinearGradient(80, -200, 100, -256);
  const hornCol = mix('#c8bba0', '#ffc83d', shine / 100);
  hg.addColorStop(0, hornCol); hg.addColorStop(1, mix(hornCol, '#fff9e0', 0.7));
  ink(U.horn, hg, P.lw);
  ctx.strokeStyle = mix(hornCol, '#a0661a', 0.45); ctx.lineWidth = P.lw * 0.9;
  for (let i = 1; i <= 4; i++) {
    const k = i / 5;
    ctx.beginPath(); ctx.moveTo(lerp(81, 99, k) - 1, lerp(-199, -256, k) + 4); ctx.lineTo(lerp(97, 99, k) + 1, lerp(-199, -256, k) - 2); ctx.stroke();
  }
  if (shine > 60) star(99, -258, 5 + Math.sin(t * 5) * 2.5, '#fffbe0');
  accHead(P);
  ctx.restore();

  for (const m of o.mud || []) if (m.dirt > 0) drawSpot(m, P.lw);
  if (shine > 55 && !o.mud) {
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.8 + i * 0.25) % 1;
      const sx = [-40, 10, 50, -10][i], sy = [-110, -128, -150, -70][i];
      star(sx + Math.sin(i * 7) * 10, sy - ph * 20, 6 * Math.sin(ph * Math.PI), '#fffbe0');
    }
  }
  ctx.restore();
}
function uniFace(P) {
  const { o, t, lw } = P;
  const mood = o.mood || (P.shine < 30 ? 'sad' : 'happy');
  const blink = ((t + 2) % 3.7) < 0.12;
  const ex = 94, ey = -177;
  ctx.strokeStyle = OL; ctx.lineWidth = lw * 1.2;
  if (mood === 'joy' || mood === 'sleep' || blink) {
    ctx.beginPath();
    if (mood === 'joy') ctx.arc(ex, ey + 3, 7, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(ex, ey - 2, 7, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, ey - 11, 0, ey + 11);
    g.addColorStop(0, '#2d1b4a'); g.addColorStop(1, '#7a4fc0');
    ctx.fillStyle = g; ellipse(ex, ey, 8, 11);
    ctx.fillStyle = '#fff'; circle(ex + 2.5, ey - 4.5, 3.4); circle(ex - 2.5, ey + 4.5, 1.5);
    ctx.beginPath();
    ctx.moveTo(ex + 4, ey - 9); ctx.lineTo(ex + 9, ey - 14);
    ctx.moveTo(ex + 7, ey - 6); ctx.lineTo(ex + 13, ey - 9);
    ctx.stroke();
    if (mood === 'sad') { ctx.beginPath(); ctx.moveTo(ex - 9, ey - 15); ctx.lineTo(ex + 6, ey - 19); ctx.stroke(); }
  }
  ctx.lineWidth = lw;
  ctx.beginPath();
  if (mood === 'sad') ctx.arc(110, -140, 5, Math.PI * 1.2, Math.PI * 1.8);
  else if (mood === 'wow') { ctx.fillStyle = '#a0567a'; ellipse(110, -146, 3.5, 4.5); }
  else ctx.arc(110, -150, 6, Math.PI * 0.2, Math.PI * 0.75);
  ctx.stroke();
}
function drawSpot(m, lw) {
  ctx.globalAlpha = clamp(m.dirt, 0, 1);
  if (m.kind === 'mud') {
    ctx.fillStyle = '#86603e'; ellipse(m.x, m.y, m.r, m.r * 0.78, m.r);
    ctx.fillStyle = '#6a4a2e'; circle(m.x - m.r * 0.3, m.y - m.r * 0.1, m.r * 0.35);
    ctx.fillStyle = '#86603e'; circle(m.x + m.r * 0.85, m.y + m.r * 0.55, m.r * 0.28); circle(m.x - m.r * 0.9, m.y + m.r * 0.5, m.r * 0.2);
  } else {
    ctx.strokeStyle = '#7d7488'; ctx.lineWidth = lw;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.arc(m.x + Math.sin(i * 2) * 5, m.y + Math.cos(i * 3) * 5, m.r * (0.35 + i * 0.14), i, i + 4.2); ctx.stroke();
    }
    ctx.fillStyle = '#5a8a3a'; ellipse(m.x + 6, m.y - 4, 5, 2.5, 0.6);
  }
  ctx.globalAlpha = 1;
}
// A lumpy tarp covering her (used when hiding from Mom)
function drawTarp(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const p = P2('M-80,0 C-86,-60 -60,-120 -10,-128 C20,-180 70,-190 96,-150 C116,-120 104,-60 96,0 Z');
  ctx.lineJoin = 'round';
  ink(p, '#7a8a5a', 3);
  ctx.strokeStyle = 'rgba(40,50,20,.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-40, -100); ctx.quadraticCurveTo(-20, -40, -30, 0); ctx.moveTo(40, -150); ctx.quadraticCurveTo(50, -60, 40, 0); ctx.stroke();
  ctx.restore();
}

// --- grown-ups -------------------------------------------------------------------
const PEOPLE = {
  mom: { skin: '#f3c9a8', hair: '#6b4228', top: '#8e6ad8', topDark: '#6f4fc0', legs: '#4a6aa8', shoe: '#e0557f', bun: true },
  ranger: { skin: '#d9a47e', hair: '#2e2018', top: '#c9b27a', topDark: '#ad9660', legs: '#5d6b34', shoe: '#5b3a22', hat: true },
  neighbor: { skin: '#f0cfb5', hair: '#c9c2cf', top: '#5aa87a', topDark: '#478f64', legs: '#8a6aa0', shoe: '#6a4a3a', bun: true },
};
function drawPerson(kind, x, gy, dir, walk, alarmed, s = 1) {
  const c = PEOPLE[kind];
  const sw = Math.sin(walk) * 0.35;
  ctx.save(); ctx.translate(x, gy); ctx.scale(dir * s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lw = 2.2;
  ctx.fillStyle = 'rgba(40,20,60,.18)'; ellipse(0, -2, 36, 7);
  const leg = (a, col) => {
    ctx.save(); ctx.translate(0, -110); ctx.rotate(a);
    ink(P2('M-10,0 L-9,96 L9,96 L10,0 Z'), col, lw);
    ink(P2('M-10,92 C-12,104 2,108 20,106 C24,100 16,92 8,92 Z'), c.shoe, lw);
    ctx.restore();
  };
  leg(-sw, mix(c.legs, '#000000', 0.15)); leg(sw, c.legs);
  ctx.save(); ctx.translate(0, -196); ctx.rotate(sw * 0.8);
  ink(P2('M-6,0 C-10,30 -10,56 -6,76 L8,76 C10,56 8,30 6,0 Z'), c.topDark, lw);
  ctx.restore();
  ink(P2('M-28,-198 C-34,-160 -34,-130 -30,-104 L30,-104 C34,-130 34,-160 28,-198 C14,-206 -14,-206 -28,-198 Z'), c.top, lw);
  if (kind === 'ranger') { vecStar(14, -170, 7, '#ffd84a', 1.4); ink(P2('M-30,-114 L30,-114 L30,-104 L-30,-104 Z'), '#7a5a2e', lw); }
  else { ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 3; i++) circle(0, -186 + i * 22, 3); }
  ctx.save(); ctx.translate(0, -196); ctx.rotate(-sw * 0.8);
  ink(P2('M-6,0 C-10,30 -10,56 -6,76 L8,76 C10,56 8,30 6,0 Z'), c.top, lw);
  inkCircle(1, 80, 7, c.skin, lw);
  ctx.restore();
  ink(P2('M-7,-212 L-7,-196 L7,-196 L7,-212 Z'), c.skin, lw);
  if (c.bun) inkCircle(-20, -262, 14, c.hair, lw);
  inkCircle(0, -236, 28, c.skin, lw);
  inkCircle(-22, -236, 6, c.skin, lw);
  if (c.hat) {
    ink(P2('M-44,-252 C-30,-260 30,-260 44,-252 C30,-246 -30,-246 -44,-252 Z'), '#8a6a3a', lw);
    ink(P2('M-22,-254 C-22,-280 22,-280 22,-254 Z'), '#a07d45', lw);
  } else {
    ink(P2('M-30,-232 C-34,-266 22,-276 30,-244 C18,-252 4,-254 -6,-248 C-14,-244 -22,-238 -30,-232 Z'), c.hair, lw);
  }
  ctx.fillStyle = OL_DARK;
  if (alarmed) { ellipse(12, -236, 3.5, 4.5); ellipse(-2, -236, 3.5, 4.5); }
  else { ellipse(12, -236, 2.5, 3.2); ellipse(-2, -236, 2.5, 3.2); }
  ctx.fillStyle = 'rgba(255,130,150,.4)'; ellipse(16, -224, 5, 3);
  ctx.strokeStyle = '#8a4a4a'; ctx.lineWidth = 2;
  ctx.beginPath();
  if (alarmed) { ctx.fillStyle = '#8a4a4a'; ellipse(10, -218, 4, 5); } else ctx.arc(9, -222, 6, 0.3, Math.PI - 0.5);
  ctx.stroke();
  ctx.restore();
}
function drawPersonPortrait(kind, x, y, w, h, alarmed) {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#d9f0ff'); g.addColorStop(1, '#b8dcf5');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.translate(x + w / 2, y + h * 0.56); ctx.scale(1.35, 1.35); ctx.translate(-4, 238);
  drawPerson(kind, 0, 0, 1, 0, alarmed);
  ctx.restore();
}

// --- Aubrey (photo sprites) ------------------------------------------------------------
const AUB_SCALE = 0.72;
// which way each side-on frame faces in the sprite sheet (+1 right, -1 left)
const AUB_NATIVE = { jump: -1, cast: -1, run1: 1, run2: 1, run3: 1, run4: 1, run5: 1 };
function drawAubrey(x, gy, frame, facing, lift = 0, s = AUB_SCALE) {
  const im = IMG[frame];
  const w = im.width * s, h = im.height * s;
  ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(x, gy - 2, 30 * s / AUB_SCALE * (1 - lift / 300), 6);
  ctx.save(); ctx.translate(x, gy - lift);
  const native = AUB_NATIVE[frame];
  if (native && facing && native !== Math.sign(facing)) ctx.scale(-1, 1);
  ctx.drawImage(im, -w / 2, -h, w, h);
  ctx.restore();
}

// --- scenery ------------------------------------------------------------------
function inkRect(x, y, w, h, fill, lw = 2.5, r = 4) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = OL; ctx.lineWidth = lw; ctx.stroke();
}
function drawHouse(x, gy, dusk) {
  const lit = dusk > 0.4;
  inkRect(x + 460, gy - 420, 44, 100, '#b5524a');
  inkRect(x + 60, gy - 310, 520, 310, '#f8e6cc', 3, 2);
  ctx.fillStyle = '#efd8b8'; for (let y = gy - 288; y < gy; y += 26) ctx.fillRect(x + 62, y, 516, 3);
  ctx.beginPath(); ctx.moveTo(x + 24, gy - 300); ctx.lineTo(x + 320, gy - 460); ctx.lineTo(x + 616, gy - 300); ctx.closePath();
  ctx.fillStyle = '#d0605a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 1; i < 6; i++) { ctx.fillRect(x + 24 + i * 50, gy - 300 - i * 27 + 10, 592 - i * 100, 3); }
  inkCircle(x + 320, gy - 370, 26, lit ? '#ffe9a0' : '#bfe6ff', 3);
  for (const [wx, wy] of [[110, -260], [430, -260], [110, -150], [470, -150]]) {
    inkRect(x + wx, gy + wy, 74, 74, lit ? '#ffe9a0' : '#bfe6ff', 3, 6);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + wx + 10, gy + wy + 8, 10, 30);
    inkRect(x + wx - 6, gy + wy - 4, 20, 82, '#ffb3d1', 2, 4); inkRect(x + wx + 60, gy + wy - 4, 20, 82, '#ffb3d1', 2, 4);
    inkRect(x + wx - 8, gy + wy + 74, 90, 12, '#9c6b45', 2, 3);
    for (let i = 0; i < 4; i++) flower(x + wx + 6 + i * 22, gy + wy + 72, 6, ['#ff6fae', '#fff', '#ffd84a', '#ff9ec7'][i], '#ffd84a', 1);
  }
  inkRect(x + 380, gy - 150, 84, 150, '#8b5a3c', 3, 40);
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 3; ctx.strokeRect(x + 394, gy - 120, 56, 40); ctx.strokeRect(x + 394, gy - 70, 56, 50);
  inkCircle(x + 448, gy - 70, 5, '#f2c94c', 1.5);
  inkRect(x + 362, gy - 8, 120, 10, '#c9b8a6', 2, 2);
  panelSign(x + 250, gy - 215, "Aubrey's House");
}
function panelSign(x, y, label) {
  ctx.font = `700 14px ${FONT}`;
  const w = ctx.measureText(label).width + 24;
  inkRect(x - w / 2, y - 15, w, 30, '#fff4fb', 2.5, 10);
  text(label, x, y, 14, '#a03a66', 'center', 700);
}
function drawAppleTree(x, gy, apples) {
  inkRect(x - 17, gy - 180, 34, 180, '#8a5c38', 3, 6);
  for (const [dx, dy, r] of [[-62, -200, 60], [56, -210, 64], [0, -268, 76], [-22, -176, 56], [40, -168, 52]]) inkCircle(x + dx, gy + dy, r, '#5aa84f', 3);
  for (const [dx, dy, r] of [[-62, -200, 60], [56, -210, 64], [0, -268, 76], [-22, -176, 56], [40, -168, 52]]) { ctx.fillStyle = '#5aa84f'; circle(x + dx, gy + dy, r); }
  ctx.fillStyle = '#6fbf5f'; circle(x - 20, gy - 290, 30); circle(x + 50, gy - 228, 26);
  [[-50, -190], [40, -232], [10, -168]].slice(0, apples).forEach(([dx, dy]) => { inkCircle(x + dx, gy + dy, 11, '#e8413f', 2); ctx.fillStyle = '#fff'; circle(x + dx - 4, gy + dy - 4, 3); });
}
function drawShed(x, gy, glow) {
  inkRect(x - 104, gy - 176, 208, 176, '#a8744b', 3, 3);
  ctx.fillStyle = '#93623d'; for (let i = -100; i < 100; i += 21) ctx.fillRect(x + i, gy - 174, 3, 172);
  ctx.beginPath(); ctx.moveTo(x - 126, gy - 170); ctx.lineTo(x, gy - 250); ctx.lineTo(x + 126, gy - 170); ctx.closePath();
  ctx.fillStyle = '#6b5378'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
  inkRect(x - 32, gy - 126, 64, 126, '#7a5236', 3, 3);
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 30, gy - 124); ctx.lineTo(x + 30, gy - 4); ctx.stroke();
  inkCircle(x + 20, gy - 62, 4, '#f2c94c', 1.5);
  inkRect(x + 46, gy - 146, 40, 40, glow ? '#ffd6f2' : '#4b3d55', 3, 4);
  if (glow) {
    const g = ctx.createRadialGradient(x + 66, gy - 126, 4, x + 66, gy - 126, 70);
    g.addColorStop(0, `rgba(255,200,250,${0.3 + 0.15 * Math.sin(S.t * 3)})`); g.addColorStop(1, 'rgba(255,200,250,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 10, gy - 200, 150, 150);
  }
  // fairy lights along the roof
  for (let i = 0; i <= 8; i++) {
    const k = i / 8, lx = x - 120 + k * 240, ly = gy - 170 - (1 - Math.abs(k - 0.5) * 2) * 78 + 6;
    ctx.fillStyle = ['#ff8fc8', '#ffe36b', '#8ad4ff', '#a6f0b8'][i % 4];
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 3 + i);
    circle(lx, ly, 4);
    ctx.globalAlpha = 1;
  }
}
function drawFence(x0, x1, cam, gy) {
  ctx.fillStyle = '#fbf6ee'; ctx.strokeStyle = 'rgba(91,63,115,.55)'; ctx.lineWidth = 2;
  for (const yy of [gy - 72, gy - 38]) { ctx.fillRect(x0 - cam, yy, x1 - x0, 9); ctx.strokeRect(x0 - cam, yy, x1 - x0, 9); }
  for (let x = x0; x < x1; x += 28) {
    const sx = x - cam;
    if (sx < -30 || sx > W + 30) continue;
    ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx, gy - 86); ctx.lineTo(sx + 8, gy - 98); ctx.lineTo(sx + 16, gy - 86); ctx.lineTo(sx + 16, gy); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
}
function drawTree(x, gy, h, r, tone, dusk) {
  const trunk = ['#6a4a30', '#5d4129', '#73513a'][tone];
  const leaf = mix(['#3f8a4a', '#357a42', '#4a9652'][tone], '#1e3a3a', dusk * 0.6);
  inkRect(x - 18, gy - h + 60, 36, h - 60, trunk, 3, 6);
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 4, gy - 40); ctx.lineTo(x - 4, gy - h / 2); ctx.stroke();
  const blobs = [[0, -h + 30, r], [-r * 0.7, -h + 70, r * 0.8], [r * 0.7, -h + 66, r * 0.8]];
  for (const [dx, dy, rr] of blobs) inkCircle(x + dx, gy + dy, rr, leaf, 3);
  for (const [dx, dy, rr] of blobs) { ctx.fillStyle = leaf; circle(x + dx, gy + dy, rr); }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; circle(x - r * 0.3, gy - h + 10, r * 0.45);
}
function drawBush(x, gy, dusk = 0, berries = 0) {
  const c1 = mix('#3f8f45', '#1f4a3a', dusk * 0.6), c2 = mix('#55a858', '#2a5a45', dusk * 0.6);
  const blobs = [[-62, -34, 38], [62, -34, 38], [-30, -74, 46], [30, -72, 46], [0, -46, 52], [-76, -12, 26], [76, -12, 26]];
  for (const [dx, dy, r] of blobs) inkCircle(x + dx, gy + dy, r, c1, 3);
  for (const [dx, dy, r] of blobs) { ctx.fillStyle = c1; circle(x + dx, gy + dy, r); }
  ctx.fillStyle = c2;
  for (const [dx, dy, r] of [[-34, -88, 22], [28, -92, 20], [-64, -50, 18], [56, -54, 18]]) circle(x + dx, gy + dy, r);
  if (berries) { ctx.fillStyle = '#5a3fd0'; for (let i = 0; i < berries; i++) circle(x - 50 + ((i * 37) % 100), gy - 30 - ((i * 23) % 60), 5); }
}
function drawCreek(x0, x1, cam, gy) {
  const g = ctx.createLinearGradient(0, gy - 4, 0, gy + 40);
  g.addColorStop(0, '#7fd0f0'); g.addColorStop(1, '#4fa3d8');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x0 - cam, gy + 40);
  for (let x = x0; x <= x1; x += 20) ctx.lineTo(x - cam, gy - 2 + Math.sin(x * 0.05 + S.t * 2) * 2);
  ctx.lineTo(x1 - cam, gy + 40); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
  for (let x = x0 + 30; x < x1; x += 70) { ctx.beginPath(); ctx.moveTo(x - cam + Math.sin(S.t + x) * 6, gy + 10); ctx.lineTo(x - cam + 24 + Math.sin(S.t + x) * 6, gy + 10); ctx.stroke(); }
  for (let x = x0 + 50; x < x1; x += 110) inkEllipse(x - cam, gy + 2, 22, 10, 0, '#9a95a8', 2);
}
function drawStage(x, gy, showNight) {
  // the fashion show stage in the glade (decorated on show night)
  inkRect(x - 200, gy - 30, 400, 30, '#e8d2f0', 3, 6);
  ctx.fillStyle = '#d4b8e8'; ctx.fillRect(x - 196, gy - 12, 392, 8);
  inkRect(x - 210, gy - 300, 30, 270, '#8e6ad8', 3, 6); inkRect(x + 180, gy - 300, 30, 270, '#8e6ad8', 3, 6);
  ctx.beginPath(); ctx.moveTo(x - 220, gy - 300); ctx.quadraticCurveTo(x, gy - 360, x + 220, gy - 300); ctx.lineTo(x + 220, gy - 280); ctx.quadraticCurveTo(x, gy - 335, x - 220, gy - 280); ctx.closePath();
  ctx.fillStyle = '#ff8fc8'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
  if (showNight) {
    for (let i = 0; i <= 12; i++) {
      const k = i / 12;
      ctx.fillStyle = ['#ff8fc8', '#ffe36b', '#8ad4ff', '#a6f0b8'][i % 4];
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 4 + i);
      circle(x - 210 + k * 420, gy - 300 - Math.sin(k * Math.PI) * 50 + 14, 5);
    }
    ctx.globalAlpha = 1;
  }
  panelSign(x, gy - 252, 'Magical Creatures Fashion Show');
}
