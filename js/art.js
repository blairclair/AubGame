'use strict';
// Art: the unicorn (with hairstyles, colours, accessories), grown-ups, scenery.

const OL = '#5b3f73';      // storybook ink outline
const OL_DARK = '#3d2c4a';
const UNI_INK = '#7d5bb8';  // the unicorn's own (lavender) outline
let INK = OL;               // current outline colour for ink()/inkCircle()/inkEllipse()

const MANES = {
  natural:  ['#ff8fc8', '#b99aff', '#ffb8de', '#8fd8ff'],
  pink:     ['#ff4fa0', '#ff86c0', '#ff2f88', '#ffb0d6'],
  lavender: ['#9560f5', '#bc94ff', '#7a46e6', '#d6c0ff'],
  ocean:    ['#22a2f0', '#52dcea', '#1676d8', '#86dcff'],
  gold:     ['#ffb81a', '#ffdc6a', '#f08e10', '#ffee9a'],
  rainbow:  ['#ff5f9f', '#ffa040', '#ffd83a', '#5adc7a', '#40b0ff', '#9c6cff'],
  midnight: ['#3530b0', '#5a48e0', '#241e80', '#8676f6'],
  seafoam:  ['#2ad6a8', '#80f0cc', '#14b48a', '#b0f6e0'],
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
function ink(path, fill, lw, line = INK) {
  ctx.strokeStyle = line; ctx.lineWidth = lw * 2;
  ctx.stroke(path);
  ctx.fillStyle = fill; ctx.fill(path);
}
function inkAt(x, y, rot, path, fill, lw) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ink(path, fill, lw); ctx.restore();
}
function inkCircle(x, y, r, fill, lw, line = INK) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = line; ctx.lineWidth = lw * 2; ctx.stroke();
  ctx.fillStyle = fill; ctx.fill();
}
function inkEllipse(x, y, rx, ry, rot, fill, lw, line = INK) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.strokeStyle = line; ctx.lineWidth = lw * 2; ctx.stroke();
  ctx.fillStyle = fill; ctx.fill();
}
const hairLine = col => mix(col, '#2a1050', 0.5);
function lockGrad(x, y, ang, len, col) {
  const g = ctx.createLinearGradient(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
  g.addColorStop(0, mix(col, '#ffffff', 0.35)); g.addColorStop(0.55, col); g.addColorStop(1, mix(col, '#2a1050', 0.15));
  return g;
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
  ink(lockPath(len, w, curl), lockGrad(0, 0, 0, len, col), lw, hairLine(col));
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = lw * 0.9;
  ctx.beginPath(); ctx.moveTo(len * 0.15, -w * 0.12); ctx.quadraticCurveTo(len * 0.5, -w * 0.35, len * 0.8, -w * 0.05); ctx.stroke();
  ctx.restore();
}
// many locks drawn as one mass: outline them all first (each in a darker shade of its own
// colour), then fill with light-to-dark gradients, so they read as one head of hair
function drawLockMass(locks, lw) {
  const placed = locks.map(l => { const m = new DOMMatrix().translate(l.x, l.y).rotate(l.ang * 180 / Math.PI); const p = new Path2D(); p.addPath(lockPath(l.len, l.w, l.curl), m); return { ...l, p, m }; });
  ctx.lineWidth = lw * 2;
  for (const l of placed) { ctx.strokeStyle = hairLine(l.col); ctx.stroke(l.p); }
  for (const l of placed) { ctx.fillStyle = lockGrad(l.x, l.y, l.ang, l.len, l.col); ctx.fill(l.p); }
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = lw * 0.8;
  for (const l of placed) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.ang);
    ctx.beginPath(); ctx.moveTo(l.len * 0.12, -l.w * 0.1); ctx.bezierCurveTo(l.len * 0.35, -l.w * 0.45, l.len * 0.6, l.w * 0.05, l.len * 0.82, l.curl * 0.6); ctx.stroke();
    ctx.restore();
  }
  for (const l of placed) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.ang);
    ctx.strokeStyle = hairLine(l.col); ctx.globalAlpha = 0.45; ctx.lineWidth = lw * 0.7;
    ctx.beginPath(); ctx.moveTo(l.len * 0.3, l.w * 0.2); ctx.quadraticCurveTo(l.len * 0.6, l.w * 0.35, l.len * 0.85, l.curl * 0.8); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  // a few glints
  placed.forEach((l, i) => {
    if (i % 3) return;
    const k = 0.35 + (i % 2) * 0.2;
    star(l.x + Math.cos(l.ang) * l.len * k, l.y + Math.sin(l.ang) * l.len * k - 2, lw * 1.6, 'rgba(255,255,255,.85)');
  });
}
function curlPuff(x, y, r, col, lw) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, mix(col, '#ffffff', 0.45)); g.addColorStop(1, col);
  inkCircle(x, y, r, g, lw, hairLine(col));
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = lw * 0.9;
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0.5, 4.8); ctx.stroke();
}
function braidChain(pts, pal, lw) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const a = Math.atan2(y2 - y1, x2 - x1), col = pal[i % 2], cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 12);
    g.addColorStop(0, mix(col, '#ffffff', 0.4)); g.addColorStop(1, col);
    inkEllipse(cx, cy, Math.hypot(x2 - x1, y2 - y1) * 0.75, 9, a + (i % 2 ? 0.55 : -0.55), g, lw, hairLine(col));
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
  // a baby tuft on top of the head; it stays clear of the eye so she never looks like she's scowling
  if (look.style === 'curly') { curlPuff(86, -205, 9, pal[1], lw); curlPuff(97, -207, 7, pal[2 % pal.length], lw); return; }
  if (look.style === 'topknot') { curlPuff(87, -205, 7, pal[1], lw); return; }
  drawLock(86, -204, -0.9, 14, 11, pal[1], lw, -4);
  drawLock(84, -203, -2.3, 12, 10, pal[2 % pal.length], lw, 4);
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
  const shine = look.shine ?? 100, k = shine / 100;
  const pal = (MANES[look.mane] || MANES.natural).map(c => mix('#b5abbd', c, 0.3 + 0.7 * k));
  const P = { t, look, o, pal, shine, lw: 1.2 + 1.2 / s,
    body: mix('#d9d0dd', '#ffffff', k), shade: mix('#bdb1c8', '#dccdfa', k), ink: mix('#8a8094', UNI_INK, k) };
  const sit = o.pose === 'sit';
  const outerInk = INK;
  INK = P.ink;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.facing || 1), s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  try {
    if (o.glow) {
      const g = ctx.createRadialGradient(10, -120, 10, 10, -120, 190);
      g.addColorStop(0, `rgba(255,236,255,${0.55 * o.glow})`); g.addColorStop(1, 'rgba(255,236,255,0)');
      ctx.fillStyle = g; ctx.fillRect(-200, -320, 400, 330);
    }
    ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(4, -2, 72, 9);

    const hoof = HOOF_COLORS[look.hooves] || mix('#b9a6cf', '#b48ee8', k);
    if (sit) {
      inkEllipse(-34, -12, 22, 10, 0, P.shade, P.lw); inkEllipse(40, -10, 24, 10, 0, P.shade, P.lw);
      inkEllipse(58, -9, 9, 7, 0, hoof, P.lw, mix(hoof, '#2a1050', 0.5)); inkEllipse(-52, -10, 9, 7, 0, hoof, P.lw, mix(hoof, '#2a1050', 0.5));
      ctx.translate(0, 40);
    } else {
      ctx.translate(0, BABY_DROP);
      uniLegs(P, [-28, 46], P.shade, 0, hoof);
      uniLegs(P, [-42, 30], P.body, Math.PI / 2, hoof);
    }

    tail(P);
    accBack(P, true);
    uniBody(P);
    accTail(P);
    accBack(P, false);
    mane(P);
    accNeck(P);

    // head
    ctx.save();
    const bob = o.moving ? Math.sin(t * 13) * 2 : Math.sin(t * 2) * 1.2;
    ctx.translate(0, bob);
    if (sit || o.mood === 'sad') { ctx.translate(60, -160); ctx.rotate(0.12); ctx.translate(-60, 160); }
    ctx.translate(72, -158); ctx.scale(BABY_HEAD, BABY_HEAD); ctx.translate(-72, 158);
    topknotBun(P);
    uniHead(P);
    uniFace(P);
    forelock(P);
    uniHorn(P);
    accHead(P);
    ctx.restore();

    for (const m of o.mud || []) if (m.dirt > 0) drawSpot(m, P.lw);
    if (shine > 55 && !o.mud) {
      for (let i = 0; i < 5; i++) {
        const ph = (t * 0.8 + i * 0.2) % 1;
        const sx = [-40, 10, 50, -10, 90][i], sy = [-110, -128, -150, -70, -230][i];
        star(sx + Math.sin(i * 7) * 10, sy - ph * 20, 6 * Math.sin(ph * Math.PI), '#fffbe0');
      }
    }
  } finally {
    ctx.restore();
    INK = outerInk;
  }
}
// baby proportions: short chunky legs and an oversized head
const BABY_LEG = 0.74, BABY_DROP = 14, BABY_HEAD = 1.24;
function uniLegs(P, xs, col, phase, hoof) {
  const { o, t, lw, pal } = P;
  xs.forEach((lx, i) => {
    const sw = o.moving ? Math.sin(t * 13 + phase + i * Math.PI) * 0.4 : 0;
    ctx.save(); ctx.translate(lx, -60); ctx.rotate(sw);
    ctx.save(); ctx.scale(1.14, BABY_LEG);
    ink(U.leg, vgradL(0, 46, col, mix(col, P.shade, 0.6)), lw);
    ctx.restore();
    // round little hoof, with a fluffy fetlock above it
    const hy = 46 * BABY_LEG - 2;
    ctx.beginPath(); ctx.roundRect(-11, hy, 22, 14, 7);
    ctx.strokeStyle = mix(hoof, '#2a1050', 0.5); ctx.lineWidth = lw * 2; ctx.stroke();
    ctx.fillStyle = vgradL(hy, hy + 14, mix(hoof, '#ffffff', 0.35), mix(hoof, '#2a1050', 0.12)); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(-4, hy + 4.5, 2.8, 1.7);
    for (const [fx, fy, r] of [[-8, hy - 3, 6], [0, hy - 1, 6.5], [8, hy - 3, 6]]) curlPuff(fx, fy, r, pal[i % pal.length], lw * 0.6);
    ctx.restore();
  });
}
function vgradL(y0, y1, c0, c1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
function uniBody(P) {
  const { lw, pal, shine } = P;
  // body + neck share one silhouette: stroke both, then fill both, so no seam shows
  ctx.strokeStyle = INK; ctx.lineWidth = lw * 2;
  ctx.stroke(U.body); ctx.stroke(U.neck);
  ctx.fillStyle = vgradL(-170, -48, P.body, P.shade); ctx.fill(U.body); ctx.fill(U.neck);
  const both = new Path2D(); both.addPath(U.body); both.addPath(U.neck);
  ctx.save(); ctx.clip(both);
  ctx.fillStyle = 'rgba(140,100,210,.22)'; ellipse(0, -46, 74, 18);
  ctx.fillStyle = 'rgba(255,170,215,.22)'; ellipse(-36, -88, 26, 18);
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(-8, -113, 40, 6, -0.04);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(36, -128, 6, 16, 0.6);
  if (shine > 50) for (const [sx, sy] of [[-20, -96], [14, -84], [-44, -70], [30, -104], [6, -66]]) star(sx, sy, 2.2, 'rgba(255,255,255,.9)');
  ctx.restore();
  // chest fluff
  for (const [fx, fy, r] of [[66, -112, 7], [64, -100, 7.5], [60, -88, 6.5]]) inkCircle(fx, fy, r, P.body, lw * 0.7);
  for (const [fx, fy, r] of [[66, -112, 7], [64, -100, 7.5], [60, -88, 6.5]]) { ctx.fillStyle = P.body; circle(fx - 2, fy, r); }
  // cutie mark: a heart and a little star in her mane colours
  heart(-36, -92, 20, mix(pal[0], '#2a1050', 0.15));
  heart(-36, -90, 15, pal[0]);
  star(-24, -94, 6, pal[1 % pal.length], 5);
  star(-24, -94, 2.5, '#ffffff', 5);
}
function uniHead(P) {
  const { lw } = P;
  ink(U.ear, vgradL(-232, -196, P.body, P.shade), lw);
  ctx.fillStyle = vgradL(-224, -200, '#ff9ccd', '#ffd0e6'); ctx.fill(U.earIn);
  ink(U.head, vgradL(-212, -140, P.body, mix(P.body, P.shade, 0.7)), lw);
  ctx.save(); ctx.clip(U.head);
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ellipse(86, -202, 16, 5, -0.2);
  ctx.fillStyle = 'rgba(140,100,210,.18)'; ellipse(80, -142, 30, 10, 0.2);
  ctx.restore();
  const mg = ctx.createRadialGradient(108, -160, 2, 112, -156, 16);
  mg.addColorStop(0, '#fff0f6'); mg.addColorStop(1, '#ffc6de');
  ctx.fillStyle = mg; ellipse(112, -156, 15, 12.5, -0.2);
  ctx.fillStyle = mix(INK, '#ff6fa8', 0.5); ellipse(120, -160, 1.6, 2.2, 0.4); // little nostril dot
}
function uniHorn(P) {
  const { t, lw, shine } = P;
  const hornCol = mix('#c8bba0', '#ffc83d', shine / 100);
  const hg = ctx.createLinearGradient(80, -200, 104, -250);
  hg.addColorStop(0, hornCol); hg.addColorStop(0.5, mix(hornCol, '#ffd0e0', 0.55)); hg.addColorStop(1, '#fffaf0');
  ctx.save(); ctx.translate(89, -199); ctx.scale(0.7, 0.7); ctx.translate(-89, 199); // a baby's short horn
  ink(U.horn, hg, lw, mix(hornCol, '#7a4a10', 0.5));
  ctx.save(); ctx.clip(U.horn);
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = lw * 1.6;
  for (let i = 1; i <= 5; i++) {
    const q = i / 6;
    ctx.beginPath(); ctx.moveTo(lerp(78, 96, q), lerp(-196, -252, q) + 6); ctx.lineTo(lerp(100, 104, q), lerp(-196, -252, q) - 4); ctx.stroke();
  }
  ctx.strokeStyle = mix(hornCol, '#a0661a', 0.45); ctx.lineWidth = lw * 0.8;
  for (let i = 1; i <= 5; i++) {
    const q = i / 6 + 0.06;
    ctx.beginPath(); ctx.moveTo(lerp(78, 96, q), lerp(-196, -252, q) + 6); ctx.lineTo(lerp(100, 104, q), lerp(-196, -252, q) - 4); ctx.stroke();
  }
  ctx.restore();
  if (shine > 60) {
    const g = ctx.createRadialGradient(99, -256, 1, 99, -256, 16);
    g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g; circle(99, -256, 16);
    star(99, -258, 5 + Math.sin(t * 5) * 2.5, '#fffbe0');
  }
  ctx.restore();
}
function uniFace(P) {
  const { o, t, lw } = P;
  const mood = o.mood || (P.shine < 30 ? 'sad' : 'happy');
  const blink = ((t + 2) % 3.7) < 0.12;
  const ex = 95, ey = -175;
  const lid = '#3a2060';
  ctx.lineCap = 'round';
  // big rosy baby cheek
  const bl = ctx.createRadialGradient(104, -160, 1, 104, -160, 12);
  bl.addColorStop(0, 'rgba(255,110,170,.55)'); bl.addColorStop(1, 'rgba(255,110,170,0)');
  ctx.fillStyle = bl; ellipse(104, -160, 12, 8);
  if (mood === 'joy' || mood === 'sleep' || blink) {
    // happy ^ ^ arcs (joy) or soft closed lids
    ctx.strokeStyle = lid; ctx.lineWidth = lw * 1.6;
    ctx.beginPath();
    if (mood === 'joy') ctx.arc(ex, ey + 5, 9, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(ex, ey - 2, 9, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(ex + 8, ey - 2); ctx.lineTo(ex + 12, ey - 5); ctx.stroke();
  } else {
    // huge round baby eye: white, a bright iris, a big pupil and two big sparkles
    const big = mood === 'wow' ? 1.12 : 1;
    ctx.fillStyle = '#ffffff'; ellipse(ex, ey, 11.5 * big, 13.5 * big);
    ctx.strokeStyle = lid; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(ex, ey, 11.5 * big, 13.5 * big, 0, 0, Math.PI * 2); ctx.stroke();
    const g = ctx.createLinearGradient(0, ey - 11, 0, ey + 12);
    g.addColorStop(0, '#5a2ab8'); g.addColorStop(0.55, '#9a62f0'); g.addColorStop(1, '#ffa0dc');
    ctx.fillStyle = g; ellipse(ex + 1.5, ey + 1, 9 * big, 11.5 * big);
    ctx.fillStyle = '#1c0c40'; ellipse(ex + 2, ey + 1, 4.6 * big, 6 * big);
    ctx.fillStyle = '#ffffff'; circle(ex + 4.5, ey - 4.5, 4.6); circle(ex - 2, ey + 5.5, 2.2);
    star(ex - 3, ey - 4, 2, '#ffffff');
    // two little lashes flicking up and back
    ctx.strokeStyle = lid; ctx.lineWidth = lw * 1.1;
    ctx.beginPath();
    ctx.moveTo(ex + 8, ey - 10); ctx.quadraticCurveTo(ex + 12, ey - 13, ex + 14, ey - 15);
    ctx.moveTo(ex + 3, ey - 13); ctx.quadraticCurveTo(ex + 5, ey - 17, ex + 7, ey - 19);
    ctx.stroke();
    if (mood === 'sad') {
      // worried brow (raised toward the middle) and a teardrop
      ctx.strokeStyle = mix(INK, '#ffffff', 0.2); ctx.lineWidth = lw * 0.9;
      ctx.beginPath(); ctx.moveTo(ex - 9, ey - 17); ctx.quadraticCurveTo(ex - 2, ey - 22, ex + 6, ey - 24); ctx.stroke();
      ctx.fillStyle = 'rgba(140,200,255,.85)'; ellipse(ex - 6, ey + 15, 2.5, 3.5);
    }
  }
  ctx.strokeStyle = mix(INK, '#ff6fa8', 0.4); ctx.lineWidth = lw;
  if (mood === 'sad') { ctx.beginPath(); ctx.arc(111, -142, 5, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
  else if (mood === 'wow') { ctx.fillStyle = '#c0507a'; ellipse(111, -147, 3.5, 4.5); }
  else {
    // open baby smile with a little tongue
    ctx.beginPath(); ctx.moveTo(104, -151); ctx.quadraticCurveTo(111, -140, 119, -151); ctx.closePath();
    ctx.fillStyle = '#c0407a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff8ab4'; ellipse(111, -145.5, 4, 2.2);
  }
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
// Cartoon caricatures: giant heads, stubby legs, clown-sized shoes and one absurd thing each
// (Mom's cloud of hair, Ranger Rosa's enormous hat with a bird on it, Mrs. Pickett's beehive nest).
// Drawn facing right, origin at their feet.
const PEOPLE = {
  mom:      { skin: '#f6cfb0', hair: '#c2532e', hairHi: '#f08a4a', line: '#5a3040', eye: '#2a7a4a', lips: '#e0406a' },
  ranger:   { skin: '#c58a62', hair: '#2a1a12', hairHi: '#5a3a28', line: '#3a2a20', eye: '#3a2a1a', lips: '#b8504a' },
  neighbor: { skin: '#f4d6c2', hair: '#c9c6dc', hairHi: '#ffffff', line: '#4a3a5a', eye: '#3a6ad0', lips: '#d8508a' },
};
const PERSON_LEG = 0.7, PERSON_DROP = 34, PERSON_HEAD = 1.45;
const darken = (col, k) => mix(col, '#1a1030', k);
// outline every circle first, then fill them all, so a cluster reads as one fluffy mass
function puffCluster(pts, fill, lw, line) {
  ctx.strokeStyle = line; ctx.lineWidth = lw * 2;
  for (const [x, y, r] of pts) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  for (const [x, y, r] of pts) { ctx.fillStyle = typeof fill === 'function' ? fill(x, y, r) : fill; circle(x, y, r); }
}
function personLeg(kind, a, back) {
  const c = PEOPLE[kind], L = c.line, d = back ? 0.2 : 0;
  ctx.save(); ctx.translate(0, -112 * PERSON_LEG); ctx.rotate(a);
  // stubby legs: squash the leg, then draw the (huge) shoe at full size where the foot ends up
  ctx.save(); ctx.scale(1, PERSON_LEG);
  if (kind === 'mom') {
    ink(P2('M-12,0 L-10,94 L10,94 L12,0 Z'), vgradL(0, 94, darken('#5a8ae0', d), darken('#3a68b8', d)), 1.2, L);
    ink(P2('M-11,78 L11,78 L11,94 L-11,94 Z'), darken('#8ab4f4', d), 1, L);
  } else if (kind === 'ranger') {
    ink(P2('M-13,0 L-11,92 L11,92 L13,0 Z'), vgradL(0, 92, darken('#7a8a44', d), darken('#5a6a2e', d)), 1.2, L);
    ink(P2('M-12,30 L-2,30 L-2,50 L-12,50 Z'), darken('#6a7a3a', d), 0.8, L);
  } else {
    // striped stockings
    ink(P2('M-7,30 L-6,94 L6,94 L7,30 Z'), darken('#ffffff', d), 1, L);
    ctx.fillStyle = darken('#ff7aa8', d); for (let y = 36; y < 92; y += 12) ctx.fillRect(-6.5, y, 13, 6);
  }
  ctx.restore();
  ctx.translate(0, 94 * PERSON_LEG - 92);
  ctx.translate(4, 92); ctx.scale(1.55, 1.55); ctx.translate(-4, -108);
  if (kind === 'mom') {
    // giant bubblegum high-tops
    ink(P2('M-12,88 C-14,104 -4,106 24,106 C32,104 30,94 14,88 Z'), darken('#ff4f8f', d), 1, L);
    ink(P2('M-13,102 L27,102 C29,107 25,110 20,110 L-10,110 C-14,110 -14,106 -13,102 Z'), darken('#ffffff', d), 0.9, L);
    inkCircle(-6, 95, 4, darken('#ffffff', d), 0.5, L);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(4, 93); ctx.lineTo(11, 91); ctx.moveTo(6, 97); ctx.lineTo(13, 95); ctx.stroke();
  } else if (kind === 'ranger') {
    // clompy hiking boots with chunky soles
    ink(P2('M-13,84 C-14,104 -2,104 26,104 C32,102 30,94 12,84 Z'), vgradL(84, 104, darken('#9a6a3a', d), darken('#6a4224', d)), 1, L);
    ink(P2('M-15,102 L30,102 L30,110 L-15,110 Z'), darken('#3a2a1a', d), 0.9, L);
    ctx.fillStyle = darken('#5a4a3a', d); for (let x = -12; x < 30; x += 7) ctx.fillRect(x, 108, 4, 2);
    ctx.strokeStyle = '#ff5a3a'; ctx.lineWidth = 1.2; for (let y = 88; y < 100; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(9, y - 2); ctx.stroke(); }
  } else {
    // pointy curly-toed slippers with a pom-pom
    ink(P2('M-10,94 C-12,106 0,108 22,106 C30,106 36,100 34,94 C30,98 26,98 22,96 C14,92 0,90 -10,94 Z'), darken('#a07ad8', d), 1, L);
    inkCircle(35, 93, 3.5, darken('#ffd84a', d), 0.5, L);
  }
  ctx.restore();
}
function personArm(kind, a, back, t) {
  const c = PEOPLE[kind], L = c.line, d = back ? 0.2 : 0;
  // shoulders sit at the sides in this 3/4 view, so the arms frame the torso
  ctx.save(); ctx.translate(back ? -16 : 18, -198); ctx.rotate(a);
  const sleeve = { mom: '#ff7a96', ranger: '#d8bf7a', neighbor: '#b89ae8' }[kind];
  if (kind === 'ranger') {
    ink(P2('M-9,0 C-12,20 -11,34 -10,40 L10,40 C11,34 11,20 9,0 Z'), darken(sleeve, d), 1.2, L);
    ink(P2('M-7,38 C-9,52 -7,64 -6,72 L7,72 C8,64 8,52 7,38 Z'), darken(c.skin, d), 1, L);
    if (!back) { inkCircle(-1, 14, 6, '#4a8a3a', 0.6, L); star(-1, 14, 3, '#ffd84a', 5); }
  } else {
    ink(P2('M-9,0 C-12,30 -11,52 -8,70 L9,70 C11,52 11,30 9,0 Z'), darken(sleeve, d), 1.2, L);
    ink(P2('M-8,62 L9,62 L9,71 L-8,71 Z'), darken(mix(sleeve, '#ffffff', 0.25), d), 0.8, L);
  }
  // big round mitten hands
  inkCircle(1, 80, 10, darken(c.skin, d), 1, L);
  inkCircle(9, 74, 4.5, darken(c.skin, d), 0.8, L);
  if (!back && kind === 'mom') {
    // a comically huge coffee mug that's always steaming
    ctx.save(); ctx.translate(4, 80); ctx.rotate(-a);
    ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(19, -2, 7, -1.4, 1.4); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(19, -2, 7, -1.4, 1.4); ctx.stroke();
    inkRect(-8, -20, 28, 32, '#ffffff', 1.2, 5);
    heart(6, -6, 18, '#ff4f8f');
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.4;
    for (let i = 0; i < 2; i++) { const w = Math.sin(t * 3 + i * 2) * 3; ctx.beginPath(); ctx.moveTo(i * 9, -24); ctx.bezierCurveTo(i * 9 + 6 + w, -32, i * 9 - 6 - w, -38, i * 9 + w, -46); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}
function personTorso(kind) {
  const L = PEOPLE[kind].line;
  const torso = P2('M-26,-206 C-32,-170 -32,-140 -28,-106 L28,-106 C32,-140 32,-170 26,-206 C14,-214 -14,-214 -26,-206 Z');
  if (kind === 'mom') {
    ink(torso, '#ffffff', 1.2, L);
    ctx.save(); ctx.clip(torso); ctx.fillStyle = '#2bbcb0';
    for (let y = -204; y < -104; y += 11) ctx.fillRect(-40, y, 80, 5);
    ctx.restore();
    ink(P2('M-27,-206 C-33,-170 -33,-140 -29,-102 L6,-102 L10,-150 L12,-207 C2,-214 -16,-213 -27,-206 Z'), hgrad(-30, 12, '#ff9ab0', '#ff6a8a'), 1.2, L);
    ink(P2('M22,-207 C26,-206 28,-206 28,-204 C33,-170 33,-140 30,-102 L22,-102 L18,-150 Z'), '#ff6a8a', 1, L);
    ink(P2('M-22,-140 L-4,-140 L-4,-122 L-22,-122 Z'), '#ff86a0', 0.8, L);
    flower(-13, -131, 5, '#ffe36b', '#ff9a3d', 0.6);
  } else if (kind === 'ranger') {
    ink(torso, vgradL(-214, -106, '#e8d08a', '#c8a85e'), 1.2, L);
    ink(P2('M-30,-118 L30,-118 L30,-106 L-30,-106 Z'), '#6a4a2a', 1, L);
    inkEllipse(14, -112, 7, 6, 0, '#ffd84a', 0.7, L);
    vecStar(-16, -186, 7, '#ffd84a', 0.6);
    ink(P2('M-6,-210 L22,-210 L8,-188 Z'), '#e04a3a', 1, L);
    // gigantic binoculars bouncing on her tummy
    ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -206); ctx.lineTo(-6, -162); ctx.moveTo(26, -204); ctx.lineTo(22, -162); ctx.stroke();
    for (const bx of [-4, 20]) {
      inkRect(bx - 9, -170, 18, 30, '#2a2a3a', 1.2, 5);
      inkCircle(bx, -140, 9, '#4a4a6a', 1, L);
      ctx.fillStyle = '#8ad8ff'; circle(bx, -140, 5.5); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(bx - 2, -142, 2);
    }
    inkRect(3, -164, 10, 8, '#3a3a4a', 0.8, 2);
  } else {
    // a big puffy floral skirt
    const skirt = P2('M-30,-118 L30,-118 C46,-90 56,-64 52,-46 C20,-38 -20,-38 -52,-46 C-56,-64 -46,-90 -30,-118 Z');
    ink(skirt, vgradL(-118, -40, '#8ad49a', '#5ab47a'), 1.2, L);
    ctx.save(); ctx.clip(skirt);
    for (let y = -112; y < -38; y += 13) for (let x = -52 + ((y / 13) % 2 ? 6 : 0); x < 54; x += 13) tinyFlower(x, y, 3.5, (x + y) % 2 ? '#ffffff' : '#ffc0d8');
    ctx.restore();
    ink(P2('M-26,-206 C-32,-170 -32,-140 -28,-112 L28,-112 C32,-140 32,-170 26,-206 C14,-214 -14,-214 -26,-206 Z'), hgrad(-30, 30, '#cdb4f4', '#a688e0'), 1.2, L);
    ctx.fillStyle = '#ffd84a'; for (let y = -192; y < -118; y += 16) { circle(8, y, 2.6); }
    // pearls the size of gumballs
    for (let i = 0; i < 7; i++) { const k = i / 6; inkCircle(lerp(-14, 26, k), -200 + Math.sin(k * Math.PI) * 14, 4.6, '#fffaf4', 0.5, '#b8a8c0'); ctx.fillStyle = '#ffffff'; circle(lerp(-14, 26, k) - 1.4, -201.5 + Math.sin(k * Math.PI) * 14, 1.4); }
  }
}
function googlyEye(x, y, r, pr, c, t, alarmed, frame = null) {
  const L = c.line;
  inkCircle(x, y, r, '#ffffff', 1.1, L);
  const jit = alarmed ? Math.sin(t * 40) * 0.8 : 0;
  const lx = alarmed ? 0 : 0.35 * r, ly = alarmed ? -0.1 * r : 0.1 * r;
  ctx.fillStyle = c.eye; circle(x + lx + jit, y + ly, pr * 1.5);
  ctx.fillStyle = '#140a14'; circle(x + lx + jit, y + ly, pr);
  ctx.fillStyle = '#ffffff'; circle(x + lx + jit + pr * 0.5, y + ly - pr * 0.5, pr * 0.45);
  if (frame) { ctx.strokeStyle = frame; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.stroke(); }
}
function personHead(kind, alarmed, t) {
  const c = PEOPLE[kind], L = c.line;
  const hairG = (x, y, r) => vgradL(y - r, y + r, c.hairHi, c.hair);
  ink(P2('M-7,-224 L-7,-200 L8,-200 L8,-224 Z'), c.skin, 1, L);
  // hair behind the head (outline-all-then-fill so curls merge)
  if (kind === 'mom') {
    // a towering cloud of red curls that springs straight up when she's startled
    const up = alarmed ? 1.07 : 1;
    puffCluster([[-30, -256, 15], [-24, -278, 16], [-8, -292, 17], [12, -296, 16], [30, -284, 15], [38, -264, 12],
      [-38, -236, 13], [-34, -214, 11], [-10, -306, 13], [16, -312, 12]].map(([x, y, r]) => [x * up, -240 + (y + 240) * up, r]), hairG, 1.2, L);
  } else if (kind === 'neighbor') {
    // a skyscraper beehive with a bird's nest (and a bird) on top
    for (const [y, rx, ry] of [[-342, 12, 10], [-322, 17, 13], [-300, 21, 15], [-276, 25, 16]]) inkEllipse(4, y, rx, ry, 0, vgradL(y - ry, y + ry, c.hairHi, c.hair), 1.1, L);
    ctx.strokeStyle = 'rgba(150,140,180,.6)'; ctx.lineWidth = 1.2;
    for (const [y, rx] of [[-322, 12], [-300, 15], [-276, 18]]) { ctx.beginPath(); ctx.arc(4, y, rx, 0.3, Math.PI - 0.3); ctx.stroke(); }
    const hop = alarmed ? -10 - Math.abs(Math.sin(t * 14)) * 6 : -Math.abs(Math.sin(t * 2.5)) * 2;
    inkCircle(10, -358 + hop, 9, '#5ab8f0', 1, L);
    ctx.fillStyle = '#ffd84a'; tri(18, -360 + hop, 26, -357 + hop, 18, -354 + hop);
    ctx.fillStyle = '#140a14'; circle(13, -361 + hop, 1.8);
    if (alarmed) { ctx.fillStyle = '#5ab8f0'; ellipse(0, -362 + hop, 8, 3, -0.5 + Math.sin(t * 30) * 0.4); }
    inkEllipse(6, -352, 17, 6, 0, '#a0703a', 1, L);
    ctx.strokeStyle = '#7a5028'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-10 + i * 7, -350); ctx.lineTo(-4 + i * 7, -355); ctx.stroke(); }
  }
  // face
  const fg = ctx.createRadialGradient(-4, -250, 4, 2, -240, 32);
  fg.addColorStop(0, mix(c.skin, '#ffffff', 0.25)); fg.addColorStop(1, c.skin);
  if (kind === 'ranger') ink(P2('M-22,-260 C-24,-236 -24,-222 -14,-214 C-4,-208 12,-208 22,-214 C30,-222 30,-240 28,-260 Z'), fg, 1.2, L);
  else if (kind === 'neighbor') inkEllipse(2, -238, 22, 30, 0, fg, 1.2, L);
  else inkEllipse(2, -240, 25, 27, 0, fg, 1.2, L);
  inkEllipse(-21, -238, 6, 8, 0, c.skin, 1, L);
  // eyes: big googly eyes, which pop huge and jitter when they spot something
  const er = alarmed ? 10.5 : 8, pr = alarmed ? 1.8 : 3;
  if (kind === 'neighbor') {
    // coke-bottle glasses that magnify her eyes enormously
    ctx.strokeStyle = '#c9a040'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-20, -244); ctx.quadraticCurveTo(-30, -220, -24, -200); ctx.stroke();
    googlyEye(-3, -246, er + 3, pr * 1.3, c, t, alarmed, '#e8b830');
    googlyEye(21, -246, er + 4, pr * 1.4, c, t, alarmed, '#e8b830');
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(8, -248); ctx.lineTo(10, -248); ctx.stroke();
  } else {
    googlyEye(0, -246, er * 0.9, pr * 0.9, c, t, alarmed);
    googlyEye(17, -246, er, pr, c, t, alarmed);
  }
  // eyebrows: mom's arch, Rosa's are big bushy caterpillars; all shoot up when alarmed
  const lift = alarmed ? 9 : 0;
  ctx.strokeStyle = kind === 'neighbor' ? '#a8a0c0' : darken(c.hair, 0.1);
  ctx.lineWidth = kind === 'ranger' ? 6 : 3;
  for (const [bx, w] of [[0, 7], [17, 8]]) { if (kind === 'neighbor') break; ctx.beginPath(); ctx.moveTo(bx - w, -256 - lift); ctx.quadraticCurveTo(bx, -262 - lift - (kind === 'mom' ? 3 : 0), bx + w, -256 - lift); ctx.stroke(); }
  // noses: a button, a big red bulb, a long pointy one
  if (kind === 'ranger') { inkCircle(25, -234, 7, '#e86a5a', 1, L); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(23, -237, 2.2); }
  else if (kind === 'neighbor') ink(P2('M14,-238 C22,-236 34,-230 42,-222 C32,-222 22,-224 14,-226 Z'), mix(c.skin, '#ff9a9a', 0.25), 1, L);
  else inkCircle(22, -236, 4.5, mix(c.skin, '#ff8a8a', 0.3), 0.8, L);
  // rosy cheek circles
  ctx.fillStyle = 'rgba(255,110,140,.45)'; circle(22, -226, 6); circle(-8, -228, 5);
  // mouths
  if (alarmed) {
    // a huge "AAAH!" mouth with a wiggly tongue
    inkEllipse(10, -216, 9, 11, 0, '#5a1a2a', 1, L);
    ctx.fillStyle = '#ff6f8f'; ellipse(10, -210, 6, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(4, -227, 12, 3);
    // sweat drops flying off
    for (const [sx, sy, k] of [[-30, -270, 0], [38, -262, 1]]) { ctx.fillStyle = 'rgba(140,210,255,.9)'; const b = Math.sin(t * 10 + k) * 2; ellipse(sx + (k ? b : -b), sy, 3, 4.5); }
  } else if (kind === 'neighbor') {
    // prim little "hmm" pucker
    inkCircle(16, -215, 3.4, c.lips, 0.8, L);
  } else {
    // a big toothy grin (Rosa has a gap tooth)
    const m = P2('M-2,-224 C2,-208 22,-206 28,-224 Z');
    ink(m, '#7a2a3a', 1, L);
    ctx.save(); ctx.clip(m); ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, -226, 34, 6);
    if (kind === 'ranger') { ctx.fillStyle = '#7a2a3a'; ctx.fillRect(12, -226, 2.5, 6); }
    ctx.fillStyle = '#ff7f9a'; ellipse(14, -210, 8, 4); ctx.restore();
  }
  if (kind === 'ranger') { ctx.fillStyle = 'rgba(120,60,30,.45)'; for (const [fx, fy] of [[18, -228], [24, -224], [-6, -228], [-2, -224]]) circle(fx, fy, 1.1); }
  // hair in front, hats, accessories
  if (kind === 'mom') {
    puffCluster([[-16, -264, 10], [-2, -270, 10], [14, -268, 9], [26, -258, 7]], hairG, 1, L);
    // heart-shaped sunglasses pushed up into the curls
    for (const hx of [-8, 14]) { heart(hx, -284, 22, '#ff3f8a'); heart(hx, -283, 15, '#3a2050'); }
    ctx.strokeStyle = '#ff3f8a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-2, -284); ctx.lineTo(8, -284); ctx.stroke();
    // hoop earring as big as a bracelet
    ctx.strokeStyle = '#b08a20'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(-22, -220, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.6; ctx.stroke();
  } else if (kind === 'ranger') {
    puffCluster([[-24, -250, 6], [-26, -238, 6], [-22, -226, 5]], c.hair, 0.8, L);
    // an absurdly enormous campaign hat (with a tiny bird living on the brim)
    const pop = alarmed ? -12 : 0;
    ctx.save(); ctx.translate(0, pop); if (alarmed) ctx.rotate(Math.sin(t * 25) * 0.05);
    ink(P2('M-74,-258 C-50,-276 58,-276 82,-258 C58,-244 -50,-244 -74,-258 Z'), vgradL(-276, -244, '#b8924a', '#7a5a30'), 1.2, L);
    ink(P2('M-26,-262 C-30,-300 -14,-318 4,-306 C22,-318 38,-300 34,-262 Z'), vgradL(-318, -262, '#c8a25a', '#8a6a3a'), 1.2, L);
    ink(P2('M-27,-272 L35,-272 L35,-262 L-27,-262 Z'), '#e04a3a', 0.8, L);
    ctx.strokeStyle = 'rgba(60,40,20,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(4, -306); ctx.lineTo(4, -276); ctx.stroke();
    const bob = Math.abs(Math.sin(t * 3)) * 2;
    inkEllipse(62, -270 - bob, 9, 7, 0, '#ffd84a', 1, L);
    inkCircle(68, -277 - bob, 5.5, '#ffd84a', 1, L);
    ctx.fillStyle = '#ff8a3a'; tri(73, -278 - bob, 79, -276 - bob, 73, -274 - bob);
    ctx.fillStyle = '#140a14'; circle(70, -279 - bob, 1.3);
    ctx.restore();
  } else {
    puffCluster([[-16, -262, 7], [-4, -268, 7], [10, -268, 7], [22, -262, 6]], hairG, 0.9, L);
  }
}
function drawPerson(kind, x, gy, dir, walk, alarmed, s = 1) {
  const t = typeof S !== 'undefined' && S ? S.t : 0;
  const sw = Math.sin(walk) * 0.45;
  // bouncy cartoon walk, plus a startled hop when alarmed
  const hop = alarmed ? Math.abs(Math.sin(t * 9)) * 6 : walk ? Math.abs(Math.sin(walk)) * 7 : Math.sin(t * 2) * 1;
  ctx.save(); ctx.translate(x, gy); ctx.scale(dir * s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(4, -1, 44 - hop, 7);
  ctx.translate(0, -hop);
  ctx.save(); ctx.translate(0, PERSON_DROP); personArm(kind, sw * 0.8 + (alarmed ? -2.4 : 0), true, t); ctx.restore();
  personLeg(kind, -sw, true);
  personLeg(kind, sw, false);
  ctx.translate(0, PERSON_DROP);
  personTorso(kind);
  personArm(kind, -sw * 0.8 + (alarmed ? 2.6 : 0), false, t);
  ctx.translate(0, -206); ctx.scale(PERSON_HEAD, PERSON_HEAD); ctx.translate(0, 206);
  personHead(kind, alarmed, t);
  ctx.restore();
}
// head-and-shoulders portrait for dialog boxes
function drawPersonPortrait(kind, x, y, w, h, alarmed) {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#d9f0ff'); g.addColorStop(1, '#b8dcf5');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const zoom = { mom: 0.82, ranger: 0.78, neighbor: 0.66 }[kind] ?? 0.8, cy = { mom: 228, ranger: 222, neighbor: 236 }[kind] ?? 228;
  ctx.translate(x + w / 2, y + h * 0.5); ctx.scale(zoom, zoom); ctx.translate(-4, cy);
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

// --- Aubrey's dress-up clothes (Fashion Sort) -----------------------------------
// drawn in the idle_front sprite's own pixels (97 x 226, feet at the bottom) so they sit on her body.
// layer 0 goes under her arms (her photo arms are redrawn on top), layer 1 over them.
const AUB_FEET = [[32, 219], [81, 219]];
// where each hero's body is in their standing photo (every idle_front is 97 x 226), so clothes drawn on Aubrey's
// body can be fitted onto theirs:
// y: the rows of their head top, eyes, neck, waist, knees and soles (Aubrey's are FIT_Y); head / body: how wide
// their head and body are next to Aubrey's; feet: [x, y, toe direction, how the leg leans] for each shoe;
// hands: where each hand holds things; arms: each arm's [shoulder, wrist] (sleeves are fitted along them) and armW
// how thick the arms are; hair: long hair that falls over the shoulders;
// cut: the rows of their own skirt or shorts, taken out under clothes that cover the legs, with each leg redrawn
// there from row `row` (hip span at y0 -> leg span at y1)
const FIT_Y = [0, 27, 54, 90, 175, 219], FIT_CX = 49.5;
const HERO_FIT = {
  aubrey: { y: FIT_Y, head: 1, body: 1, feet: [[29, 219, -1, -0.1], [84, 219, 1, 0.33]], hands: [[15, 135], [81, 134]],
    arms: [[[24, 58], [16, 125]], [[74, 58], [81, 125]]], armW: 1, hair: true },
  charlotte: { y: [2, 39, 58, 100, 180, 219], head: 1, body: 1, feet: [[35, 217, -1, -0.1], [58, 217, 1, 0.05]], hands: [[20, 119], [73, 100]],
    arms: [[[24, 60], [19, 112]], [[74, 60], [78, 96]]], armW: 1,
    cut: { y0: 113, y1: 158, row: 162, legs: [[[27, 49], [29, 46]], [[49, 71], [47, 63]]] } },
  ashton: { y: [0, 29, 51, 92, 180, 220], head: 0.88, body: 1.02, feet: [[25, 219, -1, -0.3], [79, 219, 1, 0.35]], hands: [[24, 136], [83, 136]],
    arms: [[[25, 55], [23, 126]], [[75, 55], [83, 126]]], armW: 1.1,
    cut: { y0: 139, y1: 167, row: 169, legs: [[[25, 50], [28, 44]], [[50, 76], [59, 74]]] } },
  levi: { y: [2, 30, 57, 96, 178, 218], head: 0.95, body: 1.06, feet: [[35, 220, -1, -0.1], [67, 213, 1, 0.15]], hands: [[40, 138], [81, 136]],
    arms: [[[24, 62], [31, 129]], [[76, 62], [81, 128]]], armW: 1.2 },
};
const heroFit = () => HERO_FIT[HERO.id] || HERO_FIT.aubrey;
const heroFitted = () => heroFit() !== HERO_FIT.aubrey;
// a row on Aubrey's photo -> the same place on the hero's (above the head it follows the head's size)
function fitY(y, f = heroFit()) {
  const a = FIT_Y, b = f.y;
  if (y <= a[0]) return b[0] + (y - a[0]) * f.head;
  for (let i = 1; i < a.length; i++) if (y <= a[i]) return b[i - 1] + (y - a[i - 1]) * (b[i] - b[i - 1]) / (a[i] - a[i - 1]);
  return b[b.length - 1] + (y - a[a.length - 1]);
}
// draw a canvas laid out over Aubrey's photo space (x0..x0+w, y0..y0+h) onto the hero's body, band by band, so
// hats land on the head, collars on the neck and skirts on the waist
function fitPut(c, x0, y0, w, h, dx = 0, dy = 0) {
  const f = heroFit();
  if (f === HERO_FIT.aubrey) return ctx.drawImage(c, x0 + dx, y0 + dy, w, h);
  const ky = c.height / h, cuts = [y0, ...FIT_Y.filter(y => y > y0 && y < y0 + h), y0 + h];
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], s = a < FIT_Y[2] ? f.head : f.body, ta = fitY(a, f), tb = fitY(b, f);
    // each band overlaps the next by a hair so no seam shows
    const pad = i < cuts.length - 2 ? 0.6 : 0, sp = pad * (b - a) / Math.max(0.1, tb - ta);
    ctx.drawImage(c, 0, (a - y0) * ky, c.width, Math.min(c.height - (a - y0) * ky, (b - a + sp) * ky),
      FIT_CX + (x0 - FIT_CX) * s + dx, ta + dy, w * s, tb - ta + pad);
  }
}
// draw a canvas of sleeves laid out over Aubrey's photo space onto the hero's arms: each half is turned and
// stretched so Aubrey's shoulder-to-wrist line lies along theirs
function fitArmPut(c, x0, y0, w, h, dx = 0, dy = 0) {
  const f = heroFit();
  if (f === HERO_FIT.aubrey) return ctx.drawImage(c, x0 + dx, y0 + dy, w, h);
  f.arms.forEach(([s1, w1], i) => {
    const [s0, w0] = HERO_FIT.aubrey.arms[i];
    const a0 = Math.atan2(w0[1] - s0[1], w0[0] - s0[0]), a1 = Math.atan2(w1[1] - s1[1], w1[0] - s1[0]);
    const L = Math.hypot(w1[0] - s1[0], w1[1] - s1[1]) / Math.hypot(w0[0] - s0[0], w0[1] - s0[1]);
    ctx.save(); ctx.translate(s1[0] + dx, s1[1] + dy); ctx.rotate(a1); ctx.scale(L, f.armW); ctx.rotate(-a0); ctx.translate(-s0[0], -s0[1]);
    ctx.beginPath(); ctx.rect(i ? FIT_CX : x0, y0, i ? x0 + w - FIT_CX : FIT_CX - x0, h); ctx.clip();
    ctx.drawImage(c, x0, y0, w, h);
    ctx.restore();
  });
}
// how far the hero's hand is from Aubrey's (0 left, 1 right), for things held in it
const fitHand = i => { const a = HERO_FIT.aubrey.hands[i], b = heroFit().hands[i]; return [b[0] - a[0], b[1] - a[1]]; };
// paint something drawn in Aubrey's photo space straight onto the hero (drawn into a scratch canvas and fitted)
// (n picks the scratch canvas, so a fitted drawing can be nested in another; arms: fit it to the arms instead)
const fitScratch = [];
function fitDraw(fn, n = 0, arms = false, x0 = -50, y0 = -90, w = 200, h = 340) {
  if (!heroFitted()) return fn();
  const T = ctx.getTransform(), r = Math.min(6, Math.max(1, Math.hypot(T.a, T.b)));
  const c = fitScratch[n] || (fitScratch[n] = document.createElement('canvas')), cw = Math.ceil(w * r), ch = Math.ceil(h * r);
  if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
  const o = c.getContext('2d'), main = ctx;
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.clearRect(0, 0, cw, ch);
  o.setTransform(r, 0, 0, r, -x0 * r, -y0 * r); o.lineJoin = 'round'; o.lineCap = 'round';
  ctx = o;
  try { fn(); } finally { ctx = main; }
  (arms ? fitArmPut : fitPut)(c, x0, y0, w, h);
}
// the hero's arms and hands cut out of the standing photo (along the arm outlines in js/hero.js), so they
// can go back on top of skirts
let aubArms = null;
function aubArmsImage() {
  if (aubArms) return aubArms;
  const im = IMG.idle_front, c = document.createElement('canvas');
  c.width = im.width; c.height = im.height;
  const x = c.getContext('2d');
  x.clip(heroArmsPath()); x.drawImage(im, 0, 0);
  return (aubArms = c);
}
// her standing photo with those arms cut away, for scenes that draw her arms doing something else
let aubNoArms = null;
function aubNoArmsImage() {
  if (aubNoArms) return aubNoArms;
  const im = IMG.idle_front, c = document.createElement('canvas');
  c.width = im.width; c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0); x.globalCompositeOperation = 'destination-out'; x.drawImage(aubArmsImage(), 0, 0);
  return (aubNoArms = c);
}
function dots(pts, r, col) { ctx.fillStyle = col; for (const [x, y] of pts) circle(x, y, r); }
function fluff(x0, x1, y, r, lw) { for (let x = x0; x <= x1; x += r * 1.5) inkCircle(x, y + Math.sin(x) * 1.5, r, '#ffffff', lw * 0.6); }
const CLOTHES = {
  // Fancy: purple and gold
  gown: { layer: 0, box: [-12, 50, 110, 204], draw(lw) {
    ink(P2('M28,86 C14,112 -6,150 -12,198 C20,208 78,208 110,198 C104,150 84,112 70,86 Z'), '#9b5de5', lw);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-9, 192); ctx.quadraticCurveTo(49, 206, 107, 192); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
    for (const x of [20, 49, 78]) { ctx.beginPath(); ctx.moveTo(49 + (x - 49) * 0.3, 92); ctx.quadraticCurveTo(x, 150, 49 + (x - 49) * 1.9, 196); ctx.stroke(); }
    for (const [x, y] of [[20, 150], [62, 120], [80, 170], [36, 180], [50, 140], [12, 186], [88, 138]]) star(x, y, 3, '#fff6a8');
    ink(P2('M30,58 C38,62 44,64 49,59 C54,64 60,62 68,58 L70,88 L28,88 Z'), '#8a4bd8', lw);
    rrect(27, 84, 44, 6, 3, '#ffd23f', OL, lw);
    inkEllipse(27, 61, 6, 5, 0.3, '#b98af0', lw); inkEllipse(71, 61, 6, 5, -0.3, '#b98af0', lw);
  } },
  tiara: { layer: 1, box: [32, -8, 66, 8], draw(lw) {
    ink(P2('M33,6 L36,-2 L41,3 L45,-6 L49,1 L53,-6 L57,3 L62,-2 L65,6 Z'), '#ffd23f', lw);
    inkCircle(49, -2, 2.2, '#ff5fa2', lw * 0.5); inkCircle(40, 2, 1.5, '#5fb8f0', lw * 0.4); inkCircle(58, 2, 1.5, '#5fb8f0', lw * 0.4);
  } },
  heels: { layer: 1, pair: true, box: [0, -9, 30, 9], one(x, y, lw) {
    ink(P2(`M${x - 8},${y + 6} C${x - 9},${y - 4} ${x + 9},${y - 4} ${x + 8},${y + 6} Z`), '#ffd23f', lw);
    rrect(x - 2, y + 4, 4, 5, 1, '#c99a10', OL, lw * 0.6); star(x, y - 1, 2.4, '#fff');
  } },
  pearls: { layer: 1, box: [30, 48, 68, 66], draw(lw) {
    for (let i = 0; i <= 10; i++) { const k = i / 10; inkCircle(32 + k * 34, 52 + Math.sin(k * Math.PI) * 9, 2, '#fbf6ff', lw * 0.4); }
    inkCircle(49, 64, 3, '#ff9ec7', lw * 0.5);
  } },
  // Pajamas: sky blue with stars and moons
  nightgown: { layer: 0, sleeves: true, box: [-4, 50, 102, 210], draw(lw) {
    ink(P2('M32,54 C40,58 58,58 66,54 L72,62 C86,100 100,140 102,204 C72,212 26,212 -4,204 C-2,140 12,100 26,62 Z'), '#9fd3ff', lw);
    fluff(-2, 100, 205, 3, lw);
    for (const [x, y] of [[40, 80], [60, 100], [30, 130], [70, 150], [48, 175], [20, 185], [80, 185], [52, 125]]) star(x, y, 3.5, '#fff6a8', 5);
    ctx.fillStyle = '#fff6a8'; ctx.beginPath(); ctx.arc(44, 155, 5, 0.6, 5.7); ctx.arc(46.5, 155, 4, 5.4, 0.9, true); ctx.fill();
    ink(P2('M36,55 C40,64 47,64 49,59 C51,64 58,64 62,55 C56,58 42,58 36,55 Z'), '#ffffff', lw * 0.7);
  }, over(lw) {
    ink(P2('M27,58 C19,62 16,82 15,127 L28,127 C28,102 30,82 32,64 Z'), '#9fd3ff', lw);
    ink(P2('M71,58 C79,62 82,82 83,127 L70,127 C70,102 68,82 66,64 Z'), '#9fd3ff', lw);
    fluff(15, 28, 128, 2.6, lw); fluff(70, 83, 128, 2.6, lw);
  } },
  nightcap: { layer: 1, box: [28, -14, 98, 22], draw(lw) {
    ink(P2('M29,12 C28,-6 46,-14 60,-12 C74,-10 88,2 92,18 C82,8 72,6 68,10 Z'), '#5b7fe0', lw);
    star(52, -2, 3, '#fff6a8', 5); star(72, 0, 2.5, '#fff6a8', 5);
    rrect(27, 7, 44, 8, 4, '#ffffff', OL, lw * 0.8);
    inkCircle(92, 19, 5, '#ffffff', lw * 0.6);
  } },
  slippers: { layer: 1, pair: true, box: [0, -12, 30, 9], one(x, y, lw) {
    inkEllipse(x - 4, y - 7, 2.5, 6, -0.3, '#ffc2df', lw * 0.6); inkEllipse(x + 4, y - 7, 2.5, 6, 0.3, '#ffc2df', lw * 0.6);
    inkEllipse(x, y + 2, 10, 7, 0, '#ffc2df', lw);
    dots([[x - 3, y], [x + 3, y]], 1.2, OL); dots([[x, y + 3]], 1.4, '#ff5fa2');
  } },
  teddy: { layer: 1, box: [2, 118, 26, 152], draw(lw) {
    inkCircle(8, 124, 3, '#c9874a', lw * 0.5); inkCircle(20, 124, 3, '#c9874a', lw * 0.5);
    inkEllipse(14, 142, 8, 10, 0, '#c9874a', lw); inkCircle(14, 129, 7, '#c9874a', lw);
    inkEllipse(14, 132, 3.5, 2.6, 0, '#f2d0a4', lw * 0.4); dots([[11, 127], [17, 127]], 1, OL); dots([[14, 131]], 1, OL);
  } },
  // Casual: yellow tee, denim skirt, sneakers, cap
  tee: { layer: 0, box: [16, 50, 82, 106], draw(lw) {
    ink(P2('M34,52 C42,58 56,58 64,52 L76,57 L83,74 L72,78 L70,104 L28,104 L26,78 L15,74 L22,57 Z'), '#ffd23f', lw);
    ctx.strokeStyle = '#e8a800'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(49, 50, 10, 0.5, Math.PI - 0.5); ctx.stroke();
    ctx.fillStyle = '#ff5fa2'; ctx.beginPath(); ctx.moveTo(49, 86); ctx.bezierCurveTo(38, 78, 42, 68, 49, 74); ctx.bezierCurveTo(56, 68, 60, 78, 49, 86); ctx.fill();
  } },
  skirt: { layer: 0, box: [-2, 88, 100, 160], draw(lw) {
    ink(P2('M28,92 L70,92 C80,112 96,134 100,152 C70,160 28,160 -2,152 C2,134 18,112 28,92 Z'), '#4f7fc8', lw);
    rrect(27, 89, 44, 8, 3, '#3a64a8', OL, lw * 0.8); inkCircle(49, 93, 2, '#ffd23f', lw * 0.4);
    ctx.strokeStyle = '#ffd23f'; ctx.setLineDash([2, 2]); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(1, 148); ctx.quadraticCurveTo(49, 158, 97, 148); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#3a64a8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(30, 110, 7, 0.2, Math.PI - 0.2); ctx.arc(68, 110, 7, 0.2, Math.PI - 0.2); ctx.stroke();
  } },
  sneakers: { layer: 1, pair: true, box: [0, -8, 30, 9], one(x, y, lw) {
    ink(P2(`M${x - 10},${y + 6} C${x - 11},${y - 2} ${x - 6},${y - 7} ${x},${y - 7} C${x + 6},${y - 7} ${x + 11},${y - 2} ${x + 10},${y + 6} Z`), '#ffffff', lw);
    rrect(x - 10, y + 3, 20, 4, 2, '#ff5fa2', OL, lw * 0.6);
    ctx.strokeStyle = '#4f7fc8'; ctx.lineWidth = 1; for (const d of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(x - 3, y - 4 + d * 0.6); ctx.lineTo(x + 3, y - 4 + d * 0.6); ctx.stroke(); }
  } },
  cap: { layer: 1, box: [26, -6, 74, 18], draw(lw) {
    ink(P2('M29,13 C28,-6 70,-6 69,13 Z'), '#ff5fa2', lw);
    inkEllipse(49, 13, 23, 4.5, 0, '#e0408a', lw); inkCircle(49, -3, 2, '#ffd23f', lw * 0.4);
  } },
  // Swimming: teal with polka dots, coral swim ring
  swimsuit: { layer: 0, box: [-2, 48, 100, 160], draw(lw) {
    ctx.strokeStyle = '#1ea89b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(34, 50); ctx.lineTo(35, 60); ctx.moveTo(64, 50); ctx.lineTo(63, 60); ctx.stroke();
    ink(P2('M30,58 C40,62 58,62 68,58 L70,92 C80,112 94,132 100,152 C70,160 28,160 -2,152 C4,132 18,112 28,92 Z'), '#2ec4b6', lw);
    for (let i = 0; i < 9; i++) inkCircle(2 + i * 12, 153 - Math.sin(i / 8 * Math.PI) * 4, 5, '#2ec4b6', lw * 0.6);
    dots([[40, 72], [58, 70], [49, 82], [36, 104], [62, 108], [24, 130], [49, 122], [76, 132], [12, 146], [88, 146], [38, 142], [62, 144]], 2.4, '#ffffff');
  } },
  ring: { layer: 1, box: [8, 94, 90, 122], draw(lw) {
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = OL; ctx.lineWidth = 14; ctx.beginPath(); ctx.ellipse(49, 104, 38, 11, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = i % 2 ? '#ffffff' : '#ff7a59'; ctx.lineWidth = 11;
      ctx.beginPath(); ctx.ellipse(49, 104, 38, 11, 0, 0.1 + i * (Math.PI - 0.2) / 6, 0.1 + (i + 1) * (Math.PI - 0.2) / 6); ctx.stroke();
    }
    ctx.restore();
  } },
  flipflops: { layer: 1, pair: true, box: [0, -4, 30, 8], one(x, y, lw) {
    inkEllipse(x, y + 4, 10, 3.5, 0, '#ff7a59', lw);
    ctx.strokeStyle = '#2ec4b6'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 7, y + 3); ctx.lineTo(x, y - 3); ctx.lineTo(x + 7, y + 3); ctx.stroke();
  } },
  sunglasses: { layer: 1, box: [34, 22, 64, 36], draw(lw) {
    ctx.strokeStyle = '#ff7a59'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(47.5, 28); ctx.lineTo(50.5, 28); ctx.stroke();
    inkEllipse(42.5, 29, 5.5, 4.5, 0, '#2a1d40', lw * 0.7, '#ff7a59'); inkEllipse(55.5, 29, 5.5, 4.5, 0, '#2a1d40', lw * 0.7, '#ff7a59');
    dots([[41, 27.5], [54, 27.5]], 1.2, 'rgba(255,255,255,.8)');
  } },
  // Snow Day: red puffy coat with white fluff
  coat: { layer: 0, sleeves: true, box: [-4, 46, 102, 176], draw(lw) {
    ink(P2('M30,52 C40,58 58,58 68,52 L74,58 C88,96 100,130 100,170 C70,178 28,178 -2,170 C-2,130 10,96 24,58 Z'), '#e63946', lw);
    ctx.strokeStyle = '#c42536'; ctx.lineWidth = 1.2;
    for (const y of [82, 106, 130, 152]) { ctx.beginPath(); ctx.moveTo(12 + (170 - y) * 0.07, y); ctx.quadraticCurveTo(49, y + 5, 86 - (170 - y) * 0.07, y); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(49, 58); ctx.lineTo(49, 174); ctx.stroke();
    for (const y of [72, 96, 120, 144]) inkCircle(53, y, 1.8, '#ffd23f', lw * 0.4);
    fluff(-1, 99, 171, 4, lw); fluff(30, 68, 54, 4, lw);
  }, over(lw) {
    ink(P2('M25,57 C15,64 12,90 13,128 L28,128 C29,102 30,82 32,66 Z'), '#e63946', lw);
    ink(P2('M73,57 C83,64 86,90 85,128 L70,128 C69,102 68,82 66,66 Z'), '#e63946', lw);
    fluff(13, 28, 129, 3.4, lw); fluff(70, 85, 129, 3.4, lw);
  } },
  beanie: { layer: 1, box: [24, -14, 74, 20], draw(lw) {
    ink(P2('M28,14 C26,-8 72,-8 70,14 Z'), '#e63946', lw);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(31, 2); ctx.quadraticCurveTo(49, -4, 67, 2); ctx.stroke();
    rrect(25, 9, 48, 9, 4, '#ffffff', OL, lw * 0.8);
    inkCircle(49, -7, 6, '#ffffff', lw * 0.6);
  } },
  boots: { layer: 1, pair: true, box: [0, -22, 30, 9], one(x, y, lw) {
    ink(P2(`M${x - 8},${y + 7} L${x - 8},${y - 17} L${x + 7},${y - 17} L${x + 7},${y - 4} C${x + 12},${y - 2} ${x + 12},${y + 7} ${x + 8},${y + 7} Z`), '#8a5a3c', lw);
    inkEllipse(x, y - 17, 10, 4, 0, '#ffffff', lw * 0.7);
    rrect(x - 8, y + 4, 19, 3, 1, '#5a3a24', null);
  } },
  scarf: { layer: 1, box: [30, 46, 68, 100], draw(lw) {
    ink(P2('M57,54 L66,96 L56,98 L50,58 Z'), '#ffffff', lw);
    ink(P2('M31,48 C40,56 58,56 67,48 L68,58 C58,64 40,64 30,58 Z'), '#ffffff', lw);
    ctx.fillStyle = '#e63946'; for (const y of [64, 74, 84]) { ctx.beginPath(); ctx.moveTo(52 + (y - 58) * 0.18, y); ctx.lineTo(61 + (y - 58) * 0.2, y - 1); ctx.lineTo(62 + (y - 58) * 0.2, y + 4); ctx.lineTo(53 + (y - 58) * 0.18, y + 5); ctx.fill(); }
    ctx.fillRect(38, 51, 4, 10); ctx.fillRect(56, 51, 4, 10);
  } },
};
// Aubrey (front-facing photo) wearing a list of CLOTHES ids
function drawDressedAubrey(x, gy, h, worn, lift = 0) {
  const im = IMG.idle_front, s = h / im.height, lw = 1.2 / s;
  drawAubrey(x, gy, 'idle_front', 1, lift, s);
  ctx.save(); ctx.translate(x - im.width * s / 2, gy - lift - h); ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const items = worn.map(id => CLOTHES[id]);
  const paint = c => (c.pair ? AUB_FEET.forEach(([fx, fy]) => c.one(fx, fy, lw)) : c.draw(lw));
  for (const c of items) if (c.layer === 0) paint(c);
  // her arms go back on top of skirts, then sleeves and everything else over them
  if (items.some(c => c.layer === 0)) ctx.drawImage(aubArmsImage(), 0, 0);
  for (const c of items) c.over?.(lw);
  for (const c of items) if (c.layer === 1) paint(c);
  ctx.restore();
}
// one piece of clothing on its own, fitted into a size x size box centred on (x, y)
function drawClothing(id, x, y, size) {
  const c = CLOTHES[id], [x0, y0, x1, y1] = c.box, k = Math.min(size / (x1 - x0), size / (y1 - y0), 1.6);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lw = 1.3 / k;
  if (c.pair) { c.one(7, 0, lw); c.one(23, 0, lw); } else { c.draw(lw); c.over?.(lw); }
  ctx.restore();
}

// --- scenery ------------------------------------------------------------------
function inkRect(x, y, w, h, fill, lw = 2.5, r = 4) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = OL; ctx.lineWidth = lw; ctx.stroke();
}
function panelSign(x, y, label) {
  ctx.font = `700 14px ${FONT}`;
  const w = ctx.measureText(label).width + 24;
  inkRect(x - w / 2, y - 15, w, 30, '#fff4fb', 2.5, 10);
  text(label, x, y, 14, '#a03a66', 'center', 700);
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

// --- location backdrops ------------------------------------------------------------
function bdSky(top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, GY);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function bdStars(n = 60) {
  for (let i = 0; i < n; i++) star((i * 137) % W, (i * 71) % 300, 1.5 + (i % 3), `rgba(255,255,240,${0.3 + 0.7 * Math.abs(Math.sin(S.t + i))})`);
}
function bdMoon(x, y, sky) { ctx.fillStyle = '#fff8d8'; circle(x, y, 36); ctx.fillStyle = sky; circle(x - 16, y - 8, 32); }
function bdSun(x, y) {
  ctx.fillStyle = 'rgba(255,230,120,.35)'; circle(x, y, 60);
  inkCircle(x, y, 38, '#ffd84a', 2.5);
}
function bdClouds(n, col = 'rgba(255,255,255,.9)', y0 = 60) {
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const cx = ((i * 330 + S.t * 8) % (W + 300)) - 150, cy = y0 + (i % 3) * 40;
    ellipse(cx, cy, 56, 20); ellipse(cx + 32, cy - 12, 40, 22); ellipse(cx - 34, cy + 4, 32, 15);
  }
}
function bdHills(col, base, amp, f = 0.008, ph = 0) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, base - Math.sin(x * f + ph) * amp - Math.sin(x * f * 2.3 + ph) * amp * 0.4);
  ctx.lineTo(W, H); ctx.fill();
}
function bdGround(col, edge = 'rgba(91,63,115,.35)') {
  ctx.fillStyle = col; ctx.fillRect(0, GY - 4, W, H - GY + 4);
  ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GY - 4); ctx.lineTo(W, GY - 4); ctx.stroke();
}
function bdWater(top, c1, c2) {
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) ctx.lineTo(x, top + Math.sin(x * 0.03 + S.t * 2) * 3);
  ctx.lineTo(W, H); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) { const x = (i * 137 + S.t * 15) % W, y = top + 20 + (i * 23) % (H - top - 30); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26, y); ctx.stroke(); }
}
function bdFlowers(n, y = GY + 10) { for (let i = 0; i < n; i++) flower(30 + i * (W - 60) / (n - 1), y + (i % 2) * 14, 9, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1.5); }
function bdWall(col, stripe) {
  ctx.fillStyle = col; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = stripe; for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 24, GY);
  inkRect(0, GY - 6, W, H - GY + 6, '#b07a50', 3, 0);
  ctx.fillStyle = '#9a6a44'; for (let x = 0; x < W; x += 90) ctx.fillRect(x, GY, 3, H - GY);
}
function bdHouses(night) {
  [[60, 150, '#ffd1dc'], [230, 190, '#c6e2ff'], [640, 170, '#fff1b8'], [810, 200, '#d6f5d6']].forEach(([x, h, c]) => {
    inkRect(x, GY - h, 120, h, night ? mix(c, '#2a2a5a', 0.5) : c, 3, 4);
    ctx.beginPath(); ctx.moveTo(x - 10, GY - h); ctx.lineTo(x + 60, GY - h - 60); ctx.lineTo(x + 130, GY - h); ctx.closePath();
    ctx.fillStyle = night ? '#5a3a5a' : '#d0605a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
    inkRect(x + 40, GY - h + 30, 40, 36, night ? '#ffe9a0' : '#bfe6ff', 2.5, 4);
  });
}
// --- the Sunny Playground: layers scroll at their own speed when `off` (pixels run) is given ---
const PG_RAINBOW = ['#ff5f7e', '#ffa040', '#ffd83a', '#5adc7a', '#40b0ff', '#9c6cff'];
// x positions repeat every `period` pixels; calls fn(x) for each copy on screen
function tiled(off, k, period, x0, width, fn) {
  const shift = ((off * k) % period + period) % period;
  for (let base = -period; base < W + period; base += period) { const x = base + x0 - shift; if (x + width > -20 && x < W + 20) fn(x); }
}
function pgSlide(x) {
  const top = GY - 170;
  ctx.lineCap = 'round';
  for (const lx of [x, x + 34]) { ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(lx, GY); ctx.lineTo(lx, top - 40); ctx.stroke(); ctx.strokeStyle = '#40b0ff'; ctx.lineWidth = 5; ctx.stroke(); }
  for (let y = GY - 25; y > top; y -= 28) { ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 34, y); ctx.stroke(); }
  ink(P2(`M${x + 30},${top} C${x + 110},${top} ${x + 120},${GY - 40} ${x + 200},${GY - 22} L${x + 214},${GY - 2} C${x + 120},${GY - 18} ${x + 100},${top + 26} ${x + 30},${top + 22} Z`), '#ffd83a', 2.5);
  ctx.strokeStyle = '#ffa040'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 34, top + 8); ctx.bezierCurveTo(x + 110, top + 10, x + 118, GY - 30, x + 204, GY - 12); ctx.stroke();
  inkRect(x - 8, top, 50, 12, '#ff5f7e', 2.5, 3);
  ink(P2(`M${x - 16},${top - 40} L${x + 17},${top - 76} L${x + 50},${top - 40} Z`), '#ff5f7e', 2.5);
}
function pgSwings(x) {
  const top = GY - 205;
  ctx.lineCap = 'round';
  for (const [a, b] of [[x, x + 30], [x + 60, x + 30], [x + 230, x + 260], [x + 290, x + 260]]) {
    ctx.strokeStyle = OL; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(a, GY); ctx.lineTo(b, top); ctx.stroke();
    ctx.strokeStyle = '#9c6cff'; ctx.lineWidth = 6; ctx.stroke();
  }
  ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x + 22, top); ctx.lineTo(x + 268, top); ctx.stroke();
  ctx.strokeStyle = '#40b0ff'; ctx.lineWidth = 8; ctx.stroke();
  [[x + 100, '#ff5f7e', 0], [x + 190, '#5adc7a', 1.7]].forEach(([sx, col, ph]) => {
    const a = Math.sin(S.t * 2.2 + ph) * 0.35, len = 150;
    const ex = sx + Math.sin(a) * len, ey = top + Math.cos(a) * len;
    ctx.strokeStyle = '#8a7a9a'; ctx.lineWidth = 2.5;
    for (const d of [-16, 16]) { ctx.beginPath(); ctx.moveTo(sx + d, top); ctx.lineTo(ex + d, ey); ctx.stroke(); }
    inkRect(ex - 22, ey - 4, 44, 10, col, 2.5, 4);
  });
}
function pgArch(x) {
  ctx.lineCap = 'butt';
  PG_RAINBOW.forEach((c, i) => {
    const r = 120 - i * 13;
    ctx.strokeStyle = OL; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(x + 120, GY, r, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 9; ctx.stroke();
  });
  ctx.lineCap = 'round';
}
function pgSandbox(x) {
  inkRect(x, GY - 34, 170, 34, '#c98a4a', 2.5, 5);
  ctx.fillStyle = '#f5dfa8'; ctx.beginPath(); ctx.ellipse(x + 85, GY - 32, 78, 12, 0, Math.PI, 0); ctx.fill();
  emoji('🪣', x + 50, GY - 46, 32); emoji('🏰', x + 115, GY - 54, 40);
}
function drawPlayground(off = 0) {
  bdSky('#4fbcff', '#e6f7ff');
  bdSunburst(840, 84);
  bdClouds(4);
  // far hills and round trees
  bdHills('#9fe08a', 330, 26, 0.007, off * 0.0008);
  tiled(off, 0.15, 230, 40, 120, x => {
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x + 54, 250, 12, 70);
    for (const [dx, dy, r, c] of [[60, 236, 46, '#4fbf5f'], [30, 256, 32, '#5fcf6a'], [92, 254, 34, '#3fae55']]) inkCircle(x + dx, dy, r, c, 1.5, 'rgba(60,90,60,.5)');
  });
  bdHills('#86d672', 372, 16, 0.011, 2 + off * 0.0015);
  // bunting strung between poles
  tiled(off, 0.3, 320, 0, 320, x => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 3, 150, 6, 230);
    ctx.strokeStyle = '#8a7a9a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 156); ctx.quadraticCurveTo(x + 160, 206, x + 320, 156); ctx.stroke();
    for (let i = 1; i < 10; i++) {
      const k = i / 10, fx = x + k * 320, fy = 156 + 100 * k * (1 - k);
      ctx.fillStyle = PG_RAINBOW[i % PG_RAINBOW.length]; tri(fx - 10, fy, fx + 10, fy, fx, fy + 22);
    }
  });
  // the playground equipment
  tiled(off, 0.5, 1240, 60, 220, pgSlide);
  tiled(off, 0.5, 1240, 380, 300, pgSwings);
  tiled(off, 0.5, 1240, 760, 240, pgArch);
  tiled(off, 0.5, 1240, 1030, 170, pgSandbox);
  // picket fence and flowers
  tiled(off, 0.8, 34, 0, 26, x => {
    const c = PG_RAINBOW[((Math.round((x + off * 0.8) / 34) % 6) + 6) % 6];
    ink(P2(`M${x},${GY - 4} L${x},${GY - 52} L${x + 11},${GY - 64} L${x + 22},${GY - 52} L${x + 22},${GY - 4} Z`), mix(c, '#ffffff', 0.45), 1.5);
  });
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, GY - 44, W, 6); ctx.fillRect(0, GY - 22, W, 6);
  // soft rainbow play surface
  ctx.fillStyle = '#8fd47a'; ctx.fillRect(0, GY - 4, W, H - GY + 4);
  tiled(off, 1, 480, 0, 80, x => PG_RAINBOW.forEach((c, i) => { ctx.fillStyle = mix(c, '#ffffff', 0.35); ctx.fillRect(x + i * 80, GY + 6, 80, H - GY - 6); }));
  ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GY + 6); ctx.lineTo(W, GY + 6); ctx.stroke();
  tiled(off, 0.8, 170, 30, 20, x => flower(x, GY - 2, 8, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][((Math.round((x + off * 0.8) / 170) % 4) + 4) % 4], '#ffd84a', 1.5));
}
const BACKDROPS = {
  playground: Object.assign(off => drawPlayground(off), { scrolls: true }),
  garden() { bdSky('#8fd3ff', '#e3f6ff'); bdSun(820, 80); bdClouds(4); bdHills('#a6d49b', 360, 30); bdGround('#74c25e'); drawFence(-20, W + 20, 0, GY); drawTree(90, GY, 300, 70, 0, 0); bdFlowers(12); },
  meadow() { bdSky('#9fdcff', '#f0fbff'); bdSun(160, 90); bdClouds(5); bdHills('#b6e0a0', 340, 40, 0.006); bdHills('#95cf80', 400, 24, 0.01, 2); bdGround('#7fcc66'); bdFlowers(16); },
  woods() { bdSky('#8ec9e8', '#d6f0e8'); bdHills('#7fb88a', 360, 30); for (let i = 0; i < 7; i++) drawTree(40 + i * 150, GY, 290 + (i * 37) % 80, 64, i % 3, 0); bdGround('#5aa856'); drawBush(860, GY); },
  creek() { bdSky('#8fd3ff', '#e6fbff'); bdClouds(3); bdHills('#9fd49a', 330, 30); drawTree(80, GY - 60, 260, 60, 1, 0); drawTree(880, GY - 60, 280, 64, 2, 0); bdGround('#74c25e'); bdWater(GY - 60, '#7fd0f0', '#3a8fd8'); },
  pond() { drawPond(); },
  beach() { bdSky('#7fd0ff', '#fff3d6'); bdSun(820, 90); bdClouds(3); bdWater(330, '#5fc8e8', '#2a8ac8'); ctx.fillStyle = '#f5dfa8'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, GY - 40); ctx.quadraticCurveTo(W / 2, GY - 80, W, GY - 30); ctx.lineTo(W, H); ctx.fill(); emoji('🏰', 860, GY - 40, 70); emoji('⛱️', 110, GY - 70, 90); },
  village() { bdSky('#9fd8ff', '#eef8ff'); bdClouds(4); bdHouses(false); bdGround('#c9b8a6'); ctx.fillStyle = '#b0a090'; for (let x = 0; x < W; x += 50) ctx.fillRect(x, GY + 20, 30, 4); },
  nightvillage() { bdSky('#1c1a4a', '#4a3a7a'); bdStars(50); bdMoon(800, 80, '#1c1a4a'); bdHouses(true); bdGround('#5a5a7a'); },
  farm() { bdSky('#9fdcff', '#fff6e0'); bdSun(140, 90); bdHills('#b6e0a0', 350, 30); inkRect(620, GY - 220, 220, 220, '#d0504a', 3, 4); ctx.beginPath(); ctx.moveTo(600, GY - 220); ctx.lineTo(730, GY - 300); ctx.lineTo(860, GY - 220); ctx.closePath(); ctx.fillStyle = '#a03a3a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); inkRect(690, GY - 120, 80, 120, '#fff', 3, 2); bdGround('#8fcc66'); drawFence(0, 560, 0, GY); },
  indoor() { bdWall('#ffe3ec', '#ffd1dc'); inkRect(380, 90, 200, 150, '#bfe6ff', 4, 8); inkRect(60, 200, 220, 14, '#9a6a44', 2.5, 3); inkRect(700, 200, 220, 14, '#9a6a44', 2.5, 3); },
  attic() { bdWall('#7a5a4a', '#6e4e40'); ctx.fillStyle = 'rgba(0,0,0,.3)'; tri(0, 0, W / 2, 0, 0, 260); tri(W, 0, W / 2, 0, W, 260); inkCircle(W / 2, 140, 50, '#ffe9a0', 4); ctx.fillStyle = 'rgba(255,240,200,.15)'; tri(W / 2 - 40, 160, W / 2 + 40, 160, W / 2 + 200, GY); emoji('📦', 120, GY - 40, 70); emoji('🧸', 850, GY - 34, 60); },
  dusk() { bdSky('#5a4a9a', '#ffb38a'); bdStars(20); bdHills('#6a5a8a', 340, 30); for (let i = 0; i < 5; i++) drawTree(60 + i * 210, GY, 300, 64, i % 3, 0.6); bdGround('#4a6a5a'); },
  magic() { bdSky('#4a3a8a', '#c98fd8'); bdStars(40); for (let i = 0; i < 5; i++) drawTree(40 + i * 220, GY, 300, 64, i % 3, 0.4); bdGround('#5a8a6a'); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; emoji('🍄', W / 2 + Math.cos(a) * 260, GY - 10 + Math.sin(a) * 30, 36); } },
  night() { bdSky('#141238', '#3a2a6a'); bdStars(90); bdMoon(820, 90, '#141238'); bdHills('#2a2a5a', 380, 40); bdGround('#2a3a4a'); },
  nightlake() { bdSky('#141238', '#3a3a7a'); bdStars(80); bdMoon(480, 90, '#141238'); bdHills('#24244a', 340, 30); bdWater(GY - 80, '#3a4a9a', '#1a1a4a'); ctx.fillStyle = 'rgba(255,250,210,.25)'; ellipse(480, GY + 10, 40, 6); },
  nightgarden() { bdSky('#1a1844', '#3a3070'); bdStars(70); bdMoon(160, 90, '#1a1844'); bdGround('#2a4a4a'); drawFence(-20, W + 20, 0, GY); for (let i = 0; i < 12; i++) flower(40 + i * 80, GY + 10, 10, '#dff4ff', '#8ad4ff', 1.5); },
  clouds() { bdSky('#ffd8f0', '#bfe6ff'); bdClouds(6, 'rgba(255,255,255,.95)', 90); ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) ellipse(i * 140, GY + 20, 110, 50); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 16; ['#ff8fb8', '#ffbf73', '#ffe873', '#8fe6a6', '#7cc8ff', '#b79bff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(W / 2, GY + 140, 420 - i * 16, Math.PI, 0); ctx.stroke(); }); ctx.globalAlpha = 1; },
  volcano() { bdSky('#5a2a3a', '#ff9a5a'); bdStars(10); ctx.fillStyle = '#4a2a2a'; ctx.beginPath(); ctx.moveTo(220, GY); ctx.lineTo(430, 160); ctx.lineTo(530, 160); ctx.lineTo(740, GY); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = `rgba(255,140,60,${0.6 + 0.3 * Math.sin(S.t * 3)})`; ellipse(480, 160, 50, 12); bdGround('#5a3a3a'); },
  cave() { bdSky('#2a2040', '#4a3a6a'); ctx.fillStyle = '#3a2e4e'; for (let i = 0; i < 9; i++) tri(i * 120, 0, i * 120 + 60, 90 + (i * 37) % 60, i * 120 + 120, 0); bdGround('#3e3456'); [[120, '#ff8fc8'], [300, '#8ad4ff'], [660, '#c6a2ff'], [840, '#a6f0b8']].forEach(([x, c]) => { ctx.fillStyle = c; ctx.globalAlpha = 0.85; tri(x - 22, GY, x, GY - 90, x + 22, GY); tri(x + 10, GY, x + 30, GY - 60, x + 46, GY); ctx.globalAlpha = 0.2; circle(x, GY - 40, 70); ctx.globalAlpha = 1; }); },
  snow() { bdSky('#1a2a5a', '#5a7aaa'); bdStars(40); ['#7fffd0', '#8ad4ff', '#c6a2ff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = 0.3; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(0, 120 + i * 30); ctx.bezierCurveTo(300, 40 + i * 30 + Math.sin(S.t) * 20, 600, 180 + i * 30, W, 90 + i * 30); ctx.stroke(); }); ctx.globalAlpha = 1; bdHills('#dfe9f5', 360, 40); bdGround('#f0f6ff'); },
  deepsea() { bdSky('#1a4a7a', '#0a2040'); for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(160,220,255,.08)'; tri(100 + i * 160, 0, 60 + i * 160, H, 160 + i * 160, H); } bdGround('#c9b38a'); emoji('🪸', 120, GY - 40, 80); emoji('🪸', 820, GY - 30, 70); for (let i = 0; i < 12; i++) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc((i * 83) % W, (H - (S.t * 30 + i * 47) % H), 4 + (i % 3) * 2, 0, Math.PI * 2); ctx.stroke(); } },
};
function drawBackdrop(kind, off = 0) { (BACKDROPS[kind] || BACKDROPS.meadow)(off); }
