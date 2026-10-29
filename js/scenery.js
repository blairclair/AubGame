'use strict';
// Scenery for the home setting: sky, hills, Aubrey's house & yard, the shed, and the woods.
// Static pieces are painted once, in detail, into offscreen canvases ("sprites") and reused.

const TAU = Math.PI * 2;
const dk = (c, k = 0.3) => mix(c, '#1a0f2a', k);
const lt = (c, k = 0.3) => mix(c, '#ffffff', k);

// seeded random, so painted details are the same every time
function rng(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const SPRITES = {};
// paint() draws around (0,0); (ox, oy) is where that origin sits inside a w×h canvas
function sprite(key, w, h, ox, oy, paint) {
  if (SPRITES[key]) return SPRITES[key];
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * DPR); c.height = Math.ceil(h * DPR);
  const g = c.getContext('2d');
  g.scale(DPR, DPR); g.translate(ox, oy);
  g.lineJoin = 'round'; g.lineCap = 'round';
  const screen = ctx;
  ctx = g;
  try { paint(); } finally { ctx = screen; }
  return (SPRITES[key] = { c, w, h, ox, oy });
}
function blit(s, x, y, scale = 1) { ctx.drawImage(s.c, x - s.ox * scale, y - s.oy * scale, s.w * scale, s.h * scale); }

function fillLine(fill, line, lw = 2.5) {
  ctx.fillStyle = fill; ctx.fill();
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke(); }
}
function box(x, y, w, h, r, fill, line, lw = 2.5) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); fillLine(fill, line, lw); }
function vgrad(y0, y1, c0, c1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
function hgrad(x0, x1, c0, c1) { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }

// leafy mass: outline every clump first, then shade-fill them, then add leaf texture
function foliage(clumps, base, outline, seed = 1, lw = 3) {
  ctx.strokeStyle = outline; ctx.lineWidth = lw * 2;
  for (const [x, y, r] of clumps) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
  for (const [x, y, r] of clumps) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 1.05);
    g.addColorStop(0, lt(base, 0.38)); g.addColorStop(0.55, base); g.addColorStop(1, dk(base, 0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  const R = rng(seed);
  for (const [x, y, r] of clumps) {
    for (let i = 0; i < r / 4; i++) {
      const a = R() * TAU, d = R() * r * 0.8, lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d;
      const up = ly < y;
      ctx.strokeStyle = up ? 'rgba(255,255,220,.22)' : 'rgba(10,50,30,.16)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(lx, ly, 4 + R() * 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
  }
}
function tinyFlower(x, y, r, petal, center = '#ffd84a') {
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circle(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5); }
  ctx.fillStyle = center; circle(x, y, r * 0.35);
}
function tulip(x, y, h, col) {
  ctx.strokeStyle = '#3f9a3f'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 3, y - h / 2, x, y - h); ctx.stroke();
  ctx.fillStyle = '#4fae4a'; ellipse(x - 6, y - h * 0.35, 7, 3, -0.6);
  ctx.beginPath(); ctx.moveTo(x - 7, y - h); ctx.quadraticCurveTo(x - 8, y - h - 14, x - 3, y - h - 12); ctx.lineTo(x, y - h - 6); ctx.lineTo(x + 3, y - h - 12); ctx.quadraticCurveTo(x + 8, y - h - 14, x + 7, y - h); ctx.quadraticCurveTo(x, y - h + 6, x - 7, y - h); ctx.closePath();
  fillLine(col, dk(col, 0.35), 1.5);
}
function grassBlades(x0, x1, y, R, cols, hMin = 6, hMax = 16, density = 0.6) {
  for (let x = x0; x < x1; x += 1 / density * (1 + R())) {
    const h = hMin + R() * (hMax - hMin), lean = (R() - 0.5) * 8;
    ctx.strokeStyle = cols[Math.floor(R() * cols.length)]; ctx.lineWidth = 2 + R();
    ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.quadraticCurveTo(x + lean * 0.3, y - h * 0.5, x + lean, y - h); ctx.stroke();
  }
}

// ===========================================================================
// Sky & distant layers
// ===========================================================================
const PARALLAX = { mountains: 0.08, far: 0.22, mid: 0.5 };
function layerWidth(p) { return Math.ceil(W + (WORLD_W - W) * p) + 40; }

function paintMountains() {
  const w = layerWidth(PARALLAX.mountains), R = rng(7);
  const peaks = [];
  for (let x = -60; x < w + 60; x += 140 + R() * 120) peaks.push([x, 150 + R() * 90, 110 + R() * 80]);
  for (const [x, top, half] of peaks) {
    ctx.beginPath(); ctx.moveTo(x - half * 1.4, 380); ctx.lineTo(x, top); ctx.lineTo(x + half * 1.4, 380); ctx.closePath();
    ctx.fillStyle = hgrad(x - half, x + half, '#a9bff0', '#8aa2dc'); ctx.fill();
    ctx.fillStyle = 'rgba(70,90,160,.18)';
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + half * 1.4, 380); ctx.lineTo(x + half * 0.2, 380); ctx.closePath(); ctx.fill();
    // snow cap
    ctx.beginPath(); ctx.moveTo(x, top);
    ctx.lineTo(x + half * 0.38, top + 40); ctx.lineTo(x + half * 0.18, top + 34); ctx.lineTo(x, top + 46); ctx.lineTo(x - half * 0.2, top + 32); ctx.lineTo(x - half * 0.38, top + 40); ctx.closePath();
    ctx.fillStyle = '#f6f9ff'; ctx.fill();
  }
}
function paintFarHills() {
  const w = layerWidth(PARALLAX.far), R = rng(11);
  const ridge = x => 318 - Math.sin(x * 0.004) * 34 - Math.sin(x * 0.011 + 1) * 14;
  ctx.beginPath(); ctx.moveTo(0, 540);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, ridge(x));
  ctx.lineTo(w, 540); ctx.closePath();
  ctx.fillStyle = vgrad(280, 420, '#a8e08a', '#7cc66a'); ctx.fill();
  // patchwork fields
  for (let x = 40; x < w; x += 160 + R() * 120) {
    const fw = 90 + R() * 70, y = ridge(x) + 18 + R() * 20, col = ['#c9eb7a', '#94d66e', '#e8dc7a', '#b4e08a'][Math.floor(R() * 4)];
    ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.4, 1, 0, 0);
    ctx.fillStyle = col; ctx.fillRect(0, 0, fw, 24);
    ctx.strokeStyle = 'rgba(80,120,60,.25)'; ctx.lineWidth = 1.5;
    for (let i = 4; i < 24; i += 5) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(fw, i); ctx.stroke(); }
    ctx.restore();
  }
  // little trees dotted along the ridges
  for (let x = 10; x < w; x += 22 + R() * 50) {
    const y = ridge(x) + 6 + R() * 30, r = 6 + R() * 5;
    ctx.fillStyle = '#4f9a5a'; circle(x, y - r, r); ctx.fillStyle = '#6cb86a'; circle(x - 2, y - r - 2, r * 0.6);
  }
  // a faraway castle on a hill — a hint of magic
  const cx = 620, cy = ridge(cx);
  ctx.fillStyle = '#c9b8ea';
  ctx.fillRect(cx - 22, cy - 44, 44, 44); ctx.fillRect(cx - 34, cy - 60, 14, 60); ctx.fillRect(cx + 20, cy - 60, 14, 60);
  ctx.fillStyle = '#e88fb8'; tri(cx - 38, cy - 60, cx - 27, cy - 82, cx - 16, cy - 60); tri(cx + 16, cy - 60, cx + 27, cy - 82, cx + 38, cy - 60); tri(cx - 26, cy - 44, cx, cy - 70, cx + 26, cy - 44);
  ctx.fillStyle = '#fff6c8'; ctx.fillRect(cx - 4, cy - 24, 8, 12);
}
function paintMidHills() {
  const w = layerWidth(PARALLAX.mid), R = rng(23);
  const ridge = x => 372 - Math.sin(x * 0.006 + 2) * 26 - Math.sin(x * 0.015) * 10;
  // the woods behind the gate: a dense band of treetops
  const forestStart = GATE_X * PARALLAX.mid + W * 0.3;
  for (let x = forestStart - 80; x < w; x += 26 + R() * 22) {
    const k = clamp((x - forestStart + 80) / 200, 0, 1), r = (30 + R() * 24) * k, y = ridge(x) - 30 - R() * 40;
    if (r < 4) continue;
    ctx.fillStyle = mix('#3e8f56', '#2f7a4a', R()); circle(x, y, r);
    ctx.fillStyle = 'rgba(160,230,140,.25)'; circle(x - r * 0.3, y - r * 0.35, r * 0.5);
  }
  ctx.beginPath(); ctx.moveTo(0, 540);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, ridge(x));
  ctx.lineTo(w, 540); ctx.closePath();
  ctx.fillStyle = vgrad(330, 470, '#7fd06a', '#5cb854'); ctx.fill();
  ctx.strokeStyle = 'rgba(40,110,50,.35)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, ridge(x)); ctx.stroke();
  // round tree clumps in the yard part
  for (let x = 30; x < forestStart - 60; x += 110 + R() * 160) {
    const y = ridge(x) + 4, n = 2 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) {
      const tx = x + i * 22, r = 16 + R() * 10;
      ctx.fillStyle = '#6a4a30'; ctx.fillRect(tx - 2, y - 8, 4, 10);
      ctx.fillStyle = '#3f9a52'; circle(tx, y - r - 4, r);
      ctx.fillStyle = 'rgba(200,255,160,.3)'; circle(tx - r * 0.3, y - r - 8, r * 0.5);
    }
  }
}
function layer(name, paint) {
  const p = PARALLAX[name], w = layerWidth(p);
  return sprite(`layer:${name}`, w, 540, 0, 0, paint);
}
function cloudSprite(i) {
  return sprite(`cloud${i}`, 260, 120, 130, 80, () => {
    const R = rng(100 + i);
    const puffs = [];
    for (let k = 0; k < 6; k++) puffs.push([(k - 2.5) * 34 + R() * 10, -R() * 30 - (k > 1 && k < 4 ? 20 : 0), 26 + R() * 18]);
    ctx.fillStyle = '#dce8ff';
    for (const [x, y, r] of puffs) circle(x + 4, y + 8, r);
    for (const [x, y, r] of puffs) { ctx.fillStyle = vgrad(y - r, y + r, '#ffffff', '#eef3ff'); circle(x, y, r); }
    ctx.fillStyle = '#dce8ff'; ctx.fillRect(-110, 6, 220, 16);
    ellipse(0, 10, 112, 14);
  });
}
function drawSkyLayers(cam, dusk) {
  ctx.fillStyle = vgrad(0, GY, '#3aa0f5', '#cfeeff');
  ctx.fillRect(0, 0, W, H);
  const hz = ctx.createLinearGradient(0, 200, 0, GY);
  hz.addColorStop(0, 'rgba(255,230,200,0)'); hz.addColorStop(1, 'rgba(255,225,190,.55)');
  ctx.fillStyle = hz; ctx.fillRect(0, 200, W, GY - 200);
  const sx = 790 - cam * 0.02, sy = 92;
  if (dusk > 0.5) {
    // night: the moon instead of the sun (the night tint is applied later)
    const mg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 120);
    mg.addColorStop(0, 'rgba(255,255,230,.9)'); mg.addColorStop(1, 'rgba(255,255,230,0)');
    ctx.fillStyle = mg; ctx.fillRect(sx - 120, sy - 120, 240, 240);
    ctx.fillStyle = '#fffbe8'; circle(sx, sy, 34);
    ctx.fillStyle = 'rgba(200,200,220,.5)'; circle(sx - 10, sy + 6, 7); circle(sx + 12, sy - 8, 5);
  } else drawSun(sx, sy);
  drawCloudsBirdsLayers(cam);
}
function drawSun(sx, sy) {
  // sun with slowly turning rays
  const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 170);
  glow.addColorStop(0, 'rgba(255,250,200,.95)'); glow.addColorStop(0.3, 'rgba(255,240,160,.4)'); glow.addColorStop(1, 'rgba(255,240,160,0)');
  ctx.fillStyle = glow; ctx.fillRect(sx - 170, sy - 170, 340, 340);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(S.t * 0.05);
  ctx.fillStyle = 'rgba(255,245,180,.25)';
  for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); tri(-10, -60, 10, -60, 0, -150); }
  ctx.restore();
  ctx.fillStyle = vgrad(sy - 40, sy + 40, '#fff6a0', '#ffc83d'); circle(sx, sy, 40);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; circle(sx - 12, sy - 12, 12);
}
function drawCloudsBirdsLayers(cam) {
  // clouds drift
  for (let i = 0; i < 6; i++) {
    const span = W + 400;
    const x = (((i * 290 + S.t * (6 + i)) - cam * 0.06) % span + span) % span - 200;
    blit(cloudSprite(i % 3), x, 70 + (i % 3) * 38 + Math.sin(i) * 10, 0.75 + (i % 3) * 0.15);
  }
  // birds
  for (let i = 0; i < 3; i++) {
    const bx = ((S.t * 40 + i * 70) % (W + 300)) - 150, by = 150 + i * 14 + Math.sin(S.t * 2 + i) * 6, f = Math.sin(S.t * 10 + i) * 4;
    ctx.strokeStyle = '#4a4a6a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx - 8, by - f); ctx.quadraticCurveTo(bx - 4, by - 4, bx, by); ctx.quadraticCurveTo(bx + 4, by - 4, bx + 8, by - f); ctx.stroke();
  }
  blit(layer('mountains', paintMountains), -cam * PARALLAX.mountains, 0);
  blit(layer('far', paintFarHills), -cam * PARALLAX.far, 0);
  blit(layer('mid', paintMidHills), -cam * PARALLAX.mid, 0);
}

// ===========================================================================
// Ground (painted in chunks)
// ===========================================================================
const CHUNK = 400;
function paintGroundChunk(i) {
  const x0 = i * CHUNK, R = rng(500 + i);
  const wood = x => clamp((x - GATE_X + 100) / 300, 0, 1);
  for (let x = 0; x < CHUNK; x += 8) {
    const k = wood(x0 + x);
    ctx.fillStyle = vgrad(GY - 6, H, mix('#62d14e', '#3f8f45', k), mix('#3f9a40', '#285f35', k));
    ctx.fillRect(x, GY - 6, 9, H - GY + 6);
  }
  // dirt path
  ctx.fillStyle = vgrad(GY + 8, GY + 36, '#ecc48c', '#d4a46c'); ctx.fillRect(0, GY + 10, CHUNK, 24);
  ctx.fillStyle = 'rgba(150,100,60,.25)'; ctx.fillRect(0, GY + 31, CHUNK, 3);
  for (let n = 0; n < 26; n++) {
    const px = R() * CHUNK, py = GY + 14 + R() * 18, r = 2 + R() * 4;
    ctx.fillStyle = ['#c8b8a8', '#a89888', '#d8c8b0'][Math.floor(R() * 3)]; ellipse(px, py, r * 1.3, r);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(px - r * 0.3, py - r * 0.3, r * 0.5, r * 0.3);
  }
  grassBlades(0, CHUNK, GY + 12, R, ['#4fb84a', '#62c656'], 4, 9, 0.5);
  grassBlades(0, CHUNK, GY + 36, R, ['#4fb84a', '#3f9a40'], 4, 10, 0.5);
  // lawn below the path
  for (let n = 0; n < 40; n++) {
    const px = R() * CHUNK, py = GY + 44 + R() * 40, k = wood(x0 + px);
    if (k < 0.5) {
      if (R() < 0.35) tinyFlower(px, py, 4 + R() * 2, ['#fff', '#ffe24a', '#c6a2ff', '#ff9ec7'][Math.floor(R() * 4)]);
      else { ctx.fillStyle = 'rgba(30,110,40,.35)'; for (let j = 0; j < 3; j++) circle(px + j * 4 - 4, py + (j % 2) * 3, 3); }
    } else {
      const leaf = ['#e8a33a', '#d0603a', '#f0c84a', '#8a5a30'][Math.floor(R() * 4)];
      ctx.fillStyle = leaf; ellipse(px, py, 6, 3, R() * 3);
    }
  }
  // tall grass along the horizon line
  for (let x = 0; x < CHUNK; x += 3 + R() * 4) {
    const k = wood(x0 + x), h = 8 + R() * 14;
    ctx.strokeStyle = mix(R() < 0.5 ? '#5ccc4a' : '#7ad85e', R() < 0.5 ? '#2f8a3f' : '#3f9a4a', k);
    ctx.lineWidth = 2.2; const lean = (R() - 0.5) * 10;
    ctx.beginPath(); ctx.moveTo(x, GY - 2); ctx.quadraticCurveTo(x + lean * 0.3, GY - h * 0.5, x + lean, GY - h); ctx.stroke();
  }
}
function drawGroundChunks(cam) {
  for (let i = Math.floor(cam / CHUNK); i <= Math.floor((cam + W) / CHUNK); i++) {
    if (i < 0 || i * CHUNK > WORLD_W) continue;
    // chunk canvases cover world y from GY-30 down to the bottom of the screen
    blit(sprite(`ground${i}`, CHUNK + 30, H - GY + 30, 0, -(GY - 30), () => paintGroundChunk(i)), i * CHUNK - cam, 0);
  }
}

// ===========================================================================
// Aubrey's house
// ===========================================================================
const HOUSE_WINDOWS = [[110, -270, 76, 84], [434, -270, 76, 84], [110, -152, 76, 84]];
function paintWindow(x, y, w, h) {
  // shutters
  for (const sx of [x - 26, x + w + 4]) {
    box(sx, y - 4, 22, h + 8, 4, '#9b7bea', dk('#9b7bea', 0.35), 2);
    ctx.strokeStyle = 'rgba(60,30,100,.35)'; ctx.lineWidth = 1.5;
    for (let yy = y + 6; yy < y + h; yy += 8) { ctx.beginPath(); ctx.moveTo(sx + 4, yy); ctx.lineTo(sx + 18, yy); ctx.stroke(); }
  }
  box(x - 6, y - 6, w + 12, h + 12, 8, '#ffffff', '#a88a9a', 2.5);
  ctx.fillStyle = vgrad(y, y + h, '#9fdcff', '#e0f6ff'); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.moveTo(x + 8, y + h); ctx.lineTo(x + 30, y); ctx.lineTo(x + 42, y); ctx.lineTo(x + 20, y + h); ctx.closePath(); ctx.fill();
  // curtains, tied back
  for (const side of [-1, 1]) {
    const cx = side < 0 ? x : x + w;
    ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx - side * 26, y); ctx.quadraticCurveTo(cx - side * 6, y + h * 0.5, cx - side * 18, y + h); ctx.lineTo(cx, y + h); ctx.closePath();
    fillLine('#ff9ec7', '#e0709a', 1.5);
    ctx.strokeStyle = 'rgba(200,60,120,.35)'; ctx.lineWidth = 1.5;
    for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx - side * k * 8, y); ctx.quadraticCurveTo(cx - side * (k * 4), y + h * 0.5, cx - side * k * 5, y + h); ctx.stroke(); }
    ctx.fillStyle = '#ffd84a'; circle(cx - side * 12, y + h * 0.5, 3);
  }
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w / 2 - 3, y, 6, h); ctx.fillRect(x, y + h / 2 - 3, w, 6);
  // flower box with trailing ivy
  box(x - 12, y + h + 6, w + 24, 18, 4, '#b5713f', dk('#b5713f', 0.35), 2);
  const R = rng(x * 7 + y);
  for (let i = 0; i < 9; i++) {
    const fx = x - 6 + i * (w + 12) / 8;
    ctx.fillStyle = '#4fae4a'; ellipse(fx, y + h + 4, 6, 4, R());
    tinyFlower(fx, y + h - 2 - R() * 6, 6, ['#ff5fa2', '#ffe24a', '#ffffff', '#c6a2ff', '#ff8f5a'][i % 5]);
  }
  ctx.strokeStyle = '#3f9a3f'; ctx.lineWidth = 2;
  for (const vx of [x, x + w * 0.6]) {
    ctx.beginPath(); ctx.moveTo(vx, y + h + 22); ctx.bezierCurveTo(vx - 6, y + h + 34, vx + 6, y + h + 44, vx, y + h + 54); ctx.stroke();
    ctx.fillStyle = '#4fae4a'; ellipse(vx - 4, y + h + 34, 4, 2.5, 0.5); ellipse(vx + 3, y + h + 46, 4, 2.5, -0.5);
  }
}
function paintHouse() {
  const R = rng(3);
  // chimney
  box(450, -440, 50, 120, 3, '#d0605a', '#8a3a3a', 2.5);
  for (let y = -432; y < -326; y += 12) for (let x = 452 + ((y / 12) % 2 ? 0 : 10); x < 498; x += 20) { ctx.strokeStyle = 'rgba(120,40,40,.4)'; ctx.lineWidth = 1.2; ctx.strokeRect(x, y, 20, 12); }
  box(444, -450, 62, 14, 3, '#8a7a8a', '#5a4a5a', 2);
  // walls with siding
  ctx.fillStyle = vgrad(-310, 0, '#fff3c4', '#ffe08a'); ctx.fillRect(60, -310, 520, 310);
  for (let y = -300; y < -20; y += 20) {
    ctx.fillStyle = 'rgba(200,150,60,.22)'; ctx.fillRect(60, y + 16, 520, 3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(60, y, 520, 2);
  }
  box(56, -312, 14, 312, 2, '#ffffff', '#c9b090', 1.5); box(570, -312, 14, 312, 2, '#ffffff', '#c9b090', 1.5);
  ctx.strokeStyle = '#b08a50'; ctx.lineWidth = 3; ctx.strokeRect(60, -310, 520, 310);
  // stone foundation
  for (let x = 56; x < 584; x += 26) { const w = 22 + R() * 6; box(x, -24, w, 22, 6, mix('#b8b0c0', '#d8d0d8', R()), '#7a7088', 1.5); }
  // climbing roses up the left corner
  ctx.strokeStyle = '#3f8a3f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(74, -10); ctx.bezierCurveTo(60, -100, 90, -160, 70, -260); ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const t = i / 8, vx = 74 - Math.sin(t * 7) * 10, vy = -20 - t * 230;
    ctx.fillStyle = '#4fae4a'; ellipse(vx + 8, vy, 7, 4, 0.6); ellipse(vx - 8, vy - 8, 7, 4, -0.6);
    if (i % 2 === 0) { ctx.fillStyle = '#ff4f7a'; circle(vx, vy - 4, 7); ctx.strokeStyle = '#c02a55'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(vx, vy - 4, 3.5, 0, 5); ctx.stroke(); }
  }
  // roof with scalloped shingles
  const roof = new Path2D('M20,-300 L320,-470 L620,-300 Z');
  ctx.save(); ctx.clip(roof);
  ctx.fillStyle = '#ff6b6b'; ctx.fillRect(20, -470, 600, 170);
  for (let row = 0, y = -470; y < -296; y += 17, row++) {
    for (let x = 0 + (row % 2) * 14; x < 640; x += 28) {
      ctx.beginPath(); ctx.arc(x, y + 14, 14, 0, Math.PI);
      ctx.fillStyle = ['#ff6b6b', '#ff7d76', '#f25a62'][(row + x / 28 | 0) % 3]; ctx.fill();
      ctx.strokeStyle = 'rgba(150,30,50,.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,.18)'; tri(320, -470, 140, -300, 300, -300);
  ctx.restore();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(14, -296); ctx.lineTo(320, -472); ctx.lineTo(626, -296); ctx.stroke();
  ctx.strokeStyle = '#a84a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(8, -290); ctx.lineTo(320, -478); ctx.lineTo(632, -290); ctx.stroke();
  ctx.fillStyle = 'rgba(120,80,40,.25)'; ctx.fillRect(60, -298, 520, 10);
  // round attic window
  inkCircle(320, -378, 30, '#ffffff', 1.2);
  ctx.fillStyle = vgrad(-404, -352, '#9fdcff', '#e0f6ff'); circle(320, -378, 24);
  ctx.fillStyle = '#fff'; ctx.fillRect(317, -402, 6, 48); ctx.fillRect(296, -381, 48, 6);
  // windows
  for (const [x, y, w, h] of HOUSE_WINDOWS) paintWindow(x, y, w, h);
  // porch: roof, columns, deck, steps
  box(352, -12, 168, 12, 2, '#c9a278', '#8a6a48', 2);
  box(340, 0, 192, 10, 2, '#d8b48a', '#8a6a48', 2);
  for (const cx of [360, 504]) {
    ctx.fillStyle = hgrad(cx - 8, cx + 8, '#ffffff', '#e0d8e8'); ctx.fillRect(cx - 7, -176, 14, 166);
    ctx.strokeStyle = '#b8a8c0'; ctx.lineWidth = 2; ctx.strokeRect(cx - 7, -176, 14, 166);
    box(cx - 11, -184, 22, 10, 2, '#ffffff', '#b8a8c0', 1.5);
  }
  ctx.beginPath(); ctx.moveTo(340, -182); ctx.lineTo(432, -236); ctx.lineTo(524, -182); ctx.closePath(); fillLine('#ff6b6b', '#a84a5a', 2.5);
  ctx.beginPath(); ctx.moveTo(356, -186); ctx.lineTo(432, -228); ctx.lineTo(508, -186); ctx.closePath(); fillLine('#fff3c4', '#c9b090', 1.5);
  ctx.fillStyle = '#ff9ec7'; circle(432, -202, 8); ctx.fillStyle = '#ffd84a'; circle(432, -202, 3);
  // front door
  ctx.beginPath(); ctx.moveTo(392, -12); ctx.lineTo(392, -120); ctx.arc(432, -120, 40, Math.PI, 0); ctx.lineTo(472, -12); ctx.closePath();
  fillLine(vgrad(-160, -12, '#36c9b8', '#1f9a8e'), '#16655e', 3);
  ctx.beginPath(); ctx.arc(432, -120, 26, Math.PI, 0); ctx.closePath(); fillLine(vgrad(-146, -120, '#bff0ff', '#e8fbff'), '#16655e', 2);
  box(402, -100, 26, 34, 4, 'rgba(255,255,255,.18)', 'rgba(10,80,70,.45)', 2); box(436, -100, 26, 34, 4, 'rgba(255,255,255,.18)', 'rgba(10,80,70,.45)', 2);
  box(402, -58, 26, 38, 4, 'rgba(255,255,255,.18)', 'rgba(10,80,70,.45)', 2); box(436, -58, 26, 38, 4, 'rgba(255,255,255,.18)', 'rgba(10,80,70,.45)', 2);
  inkCircle(462, -64, 5, '#ffd84a', 1);
  // wreath
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.fillStyle = i % 2 ? '#3f9a3f' : '#5ab84f'; ellipse(432 + Math.cos(a) * 14, -96 + Math.sin(a) * 14, 6, 4, a); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; tinyFlower(432 + Math.cos(a) * 14, -96 + Math.sin(a) * 14, 5, ['#ff5fa2', '#ffe24a'][i % 2]); }
  // porch lamp
  box(372, -150, 12, 18, 3, '#ffe9a0', '#8a6a3a', 1.5);
  // hedge with flowers along the front
  const hedge = [];
  for (let x = 90; x < 350; x += 26) hedge.push([x, -18 - R() * 6, 20 + R() * 6]);
  for (let x = 540; x < 590; x += 26) hedge.push([x, -18 - R() * 6, 20 + R() * 6]);
  foliage(hedge, '#4fb84a', '#2a7a3a', 9, 2);
  for (const [x, y] of hedge) if (R() < 0.7) tinyFlower(x + R() * 10 - 5, y - 8, 4, ['#fff', '#ff9ec7', '#ffe24a'][Math.floor(R() * 3)]);
  // welcome mat
  box(400, -2, 64, 6, 2, '#c94f7a', '#8a2a50', 1.5);
}
function paintMailbox() {
  box(-4, -90, 8, 90, 2, '#a07850', '#6a4a30', 2);
  ctx.beginPath(); ctx.moveTo(-26, -90); ctx.lineTo(-26, -118); ctx.arc(0, -118, 26, Math.PI, 0); ctx.lineTo(26, -90); ctx.closePath();
  fillLine(vgrad(-144, -90, '#7fb8ff', '#4f8fe8'), '#2a5aa8', 2.5);
  box(22, -132, 4, 26, 1, '#ff5a5a', '#a02a2a', 1);
  box(18, -136, 18, 10, 2, '#ff5a5a', '#a02a2a', 1.5);
  text('AUBREY', 0, -104, 10, '#ffffff', 'center', 700);
}
function paintFlowerBed() {
  const R = rng(41);
  ctx.beginPath(); ctx.ellipse(90, -4, 100, 14, 0, Math.PI, 0); fillLine('#8a5a3a', '#5a3a22', 2);
  for (let i = 0; i < 14; i++) tulip(4 + i * 13 + R() * 4, -6, 26 + R() * 18, ['#ff4f7a', '#ffd23f', '#ff8f3a', '#c66ae8', '#ff9ec7'][i % 5]);
  for (let i = 0; i < 8; i++) tinyFlower(10 + i * 22, -10 - R() * 6, 6, '#ffffff');
}
function paintStrawberryPatch() {
  const R = rng(51);
  for (let i = 0; i < 5; i++) {
    const x = -100 + i * 50;
    ctx.beginPath(); ctx.ellipse(x, -2, 26, 16, 0, Math.PI, 0); fillLine('#7a4a2a', '#4a2a1a', 2);
    foliage([[x - 10, -18, 11], [x + 9, -20, 12], [x, -28, 11]], '#4fb84a', '#2a7a3a', i + 60, 1.5);
    for (let j = 0; j < 3; j++) {
      const bx = x - 14 + j * 14 + R() * 4, by = -8 - R() * 8;
      ctx.beginPath(); ctx.moveTo(bx - 5, by - 3); ctx.quadraticCurveTo(bx - 6, by + 6, bx, by + 8); ctx.quadraticCurveTo(bx + 6, by + 6, bx + 5, by - 3); ctx.closePath();
      fillLine('#ff3a4a', '#a01a2a', 1.2);
      ctx.fillStyle = '#ffe9a0'; for (let s = 0; s < 4; s++) circle(bx - 2 + (s % 2) * 4, by + (s > 1 ? 4 : 0), 0.9);
      ctx.fillStyle = '#3f9a3f'; tri(bx - 5, by - 3, bx, by - 7, bx + 5, by - 3);
    }
  }
}
function paintBirdbath() {
  box(-6, -60, 12, 60, 3, '#d8d0e0', '#8a80a0', 2);
  box(-18, -6, 36, 8, 3, '#d8d0e0', '#8a80a0', 2);
  ctx.beginPath(); ctx.ellipse(0, -62, 36, 10, 0, 0, Math.PI); fillLine('#d8d0e0', '#8a80a0', 2);
  ctx.fillStyle = '#7fd0f0'; ellipse(0, -64, 32, 6);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(-10, -65, 8, 2);
}
function paintGnome() {
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-12, -24); ctx.lineTo(12, -24); ctx.lineTo(14, 0); ctx.closePath(); fillLine('#4f8fe8', '#2a5aa8', 2);
  ctx.beginPath(); ctx.moveTo(-10, -26); ctx.quadraticCurveTo(0, -4, 10, -26); ctx.closePath(); fillLine('#ffffff', '#a0a0b0', 1.5);
  inkCircle(0, -30, 7, '#ffd0b0', 1); ctx.fillStyle = '#ff8fa0'; circle(0, -28, 3);
  ctx.beginPath(); ctx.moveTo(-11, -32); ctx.lineTo(0, -60); ctx.lineTo(11, -32); ctx.closePath(); fillLine('#ff4a4a', '#a01a2a', 2);
}

// ===========================================================================
// The yard: fence, apple tree, laundry, shed, gate
// ===========================================================================
function paintFence() {
  // 4 pickets = 112px
  for (const y of [-74, -40]) { box(0, y, 112, 10, 2, '#ffffff', '#b8b0c8', 1.5); ctx.fillStyle = 'rgba(160,150,190,.3)'; ctx.fillRect(0, y + 7, 112, 3); }
  for (let i = 0; i < 4; i++) {
    const x = i * 28 + 4;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -88); ctx.lineTo(x + 9, -100); ctx.lineTo(x + 18, -88); ctx.lineTo(x + 18, 0); ctx.closePath();
    fillLine(hgrad(x, x + 18, '#ffffff', '#e4def0'), '#a8a0c0', 2);
  }
  const R = rng(77);
  for (let i = 0; i < 5; i++) { const x = R() * 112; ctx.fillStyle = '#4fae4a'; ellipse(x, -6, 8, 5, R()); if (R() < 0.6) tinyFlower(x, -12, 4, ['#ffe24a', '#fff', '#c6a2ff'][i % 3]); }
}
function drawFenceRun(x0, x1, cam, gy) {
  const s = sprite('fence', 120, 110, 0, 104, paintFence);
  for (let x = x0; x < x1; x += 112) if (x - cam > -120 && x - cam < W + 10) blit(s, x - cam, gy);
}
// back-compat name used by the location backdrops
function drawFence(x0, x1, cam, gy) { drawFenceRun(x0, x1, cam, gy); }

const TREE_KINDS = ['oak', 'pine', 'birch'];
function paintOak(seed, leaf, apples = 0) {
  const R = rng(seed);
  // roots & trunk
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-20, -6, -16, -40); ctx.lineTo(-12, -170); ctx.lineTo(12, -170); ctx.lineTo(16, -40); ctx.quadraticCurveTo(20, -6, 34, 0); ctx.closePath();
  fillLine(hgrad(-30, 30, '#a06a40', '#6a4228'), '#4a2a18', 3);
  ctx.strokeStyle = 'rgba(60,30,15,.45)'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const bx = -10 + i * 4; ctx.beginPath(); ctx.moveTo(bx, -10); ctx.bezierCurveTo(bx - 4, -60, bx + 4, -100, bx - 2, -160); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,220,180,.25)'; ctx.fillRect(-10, -160, 5, 150);
  ctx.fillStyle = '#3a2010'; ellipse(4, -110, 6, 8);
  ctx.strokeStyle = '#6a4228'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(0, -140); ctx.quadraticCurveTo(-40, -170, -70, -200); ctx.moveTo(0, -150); ctx.quadraticCurveTo(40, -180, 76, -196); ctx.stroke();
  const clumps = [];
  for (let i = 0; i < 16; i++) {
    const a = Math.PI + (i / 15) * Math.PI, rr = 70 + R() * 30;
    clumps.push([Math.cos(a) * 95 + R() * 10, -230 + Math.sin(a) * 75 + R() * 10, 38 + R() * 18]);
  }
  for (let i = 0; i < 7; i++) clumps.push([(R() - 0.5) * 130, -250 + (R() - 0.5) * 70, 40 + R() * 16]);
  clumps.sort((a, b) => a[1] - b[1]);
  foliage(clumps, leaf, dk(leaf, 0.5), seed);
  for (let i = 0; i < apples; i++) {
    const [cx, cy, r] = clumps[(i * 5 + 3) % clumps.length];
    const ax = cx + (R() - 0.5) * r, ay = cy + r * 0.3;
    inkCircle(ax, ay, 9, '#ff3a3a', 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(ax - 3, ay - 3, 2.5);
    ctx.fillStyle = '#4fae4a'; ellipse(ax + 4, ay - 10, 5, 2.5, -0.5);
  }
  if (!apples) for (let i = 0; i < 4; i++) { const [cx, cy, r] = clumps[(i * 7 + 2) % clumps.length]; tinyFlower(cx + (R() - 0.5) * r, cy + (R() - 0.5) * r, 5, '#fff3f8', '#ffd84a'); }
}
function paintPine(seed, leaf) {
  const R = rng(seed);
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-9, -80); ctx.lineTo(9, -80); ctx.lineTo(14, 0); ctx.closePath();
  fillLine(hgrad(-14, 14, '#8a5a38', '#5a3a22'), '#3a2010', 2.5);
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const y = -60 - i * 52, w = 100 - i * 16, h = 92;
    ctx.beginPath(); ctx.moveTo(0, y - h);
    ctx.lineTo(w * 0.5, y - h * 0.4);
    for (let k = 0; k <= 6; k++) { const x = w - k * (w * 2 / 6); ctx.quadraticCurveTo(x - w / 12, y + 10, x - w / 6, y); }
    ctx.lineTo(-w * 0.5, y - h * 0.4); ctx.closePath();
    fillLine(hgrad(-w, w, lt(leaf, 0.2), dk(leaf, 0.25)), dk(leaf, 0.5), 3);
    ctx.strokeStyle = 'rgba(255,255,220,.25)'; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++) { const x = -w * 0.6 + k * w * 0.3 + R() * 6; ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x + 6, y - 26); ctx.stroke(); }
  }
}
function paintBirch(seed, leaf) {
  const R = rng(seed);
  ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-9, -200); ctx.lineTo(9, -200); ctx.lineTo(13, 0); ctx.closePath();
  fillLine(hgrad(-13, 13, '#ffffff', '#ddd6e0'), '#7a7080', 2.5);
  ctx.fillStyle = '#3a3040';
  for (let i = 0; i < 9; i++) { const y = -14 - R() * 180, x = R() < 0.5 ? -10 : 2; ctx.fillRect(x, y, 6 + R() * 6, 2.5); }
  const clumps = [];
  for (let i = 0; i < 12; i++) clumps.push([(R() - 0.5) * 120, -230 - R() * 110, 26 + R() * 16]);
  clumps.sort((a, b) => a[1] - b[1]);
  foliage(clumps, leaf, dk(leaf, 0.5), seed, 2.5);
}
const LEAF_COLS = { oak: '#43b552', pine: '#2f8f6a', birch: '#8cd04a' };
function treeSprite(kind, seed, dusk = 0) {
  const d = Math.round(dusk * 4);
  return sprite(`tree:${kind}:${seed}:${d}`, 300, 420, 150, 410, () => {
    const leaf = mix(LEAF_COLS[kind], '#1e2a4a', d / 4 * 0.55);
    if (kind === 'oak') paintOak(seed, leaf);
    if (kind === 'pine') paintPine(seed, leaf);
    if (kind === 'birch') paintBirch(seed, leaf);
  });
}
// (x, ground y, height, radius, tone 0..2 picks the kind, dusk tint)
function drawTree(x, gy, h, r, tone, dusk = 0) {
  const kind = TREE_KINDS[tone % 3];
  blit(treeSprite(kind, 1 + tone, dusk), x, gy, h / 330);
}
function bushSprite(variant, dusk = 0) {
  const d = Math.round(dusk * 4);
  return sprite(`bush:${variant}:${d}`, 230, 170, 115, 150, () => {
    const R = rng(300 + variant);
    const base = mix(['#45b04e', '#3fa65a', '#52b848'][variant], '#1e2a4a', d / 4 * 0.55);
    const clumps = [[-70, -26, 32], [70, -26, 32], [-40, -64, 40], [36, -66, 40], [0, -48, 48], [-84, -8, 22], [84, -8, 22], [0, -92, 30], [-14, -18, 36], [26, -20, 34]];
    clumps.sort((a, b) => a[1] - b[1]);
    foliage(clumps, base, dk(base, 0.5), 300 + variant);
    const deco = variant === 0 ? ['#ff5fa2', '#ffffff'] : variant === 1 ? ['#5a3fd0', '#7a5ff0'] : ['#ffe24a', '#ffffff'];
    for (let i = 0; i < 12; i++) {
      const [cx, cy, r] = clumps[Math.floor(R() * clumps.length)];
      const fx = cx + (R() - 0.5) * r, fy = cy + (R() - 0.5) * r;
      if (variant === 1) { ctx.fillStyle = deco[i % 2]; circle(fx, fy, 4.5); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(fx - 1.5, fy - 1.5, 1.4); }
      else tinyFlower(fx, fy, 6, deco[i % 2]);
    }
  });
}
// variant is fixed per bush (not derived from its scrolling screen x, which made bushes flicker between designs)
function drawBush(x, gy, dusk = 0, variant = 0) { blit(bushSprite(variant % 3, dusk), x, gy); }

function appleTreeSprite() {
  return sprite('appletree', 300, 420, 150, 410, () => paintOak(42, '#4cbc52', 7));
}
function drawAppleTree(x, gy) {
  blit(appleTreeSprite(), x, gy);
  // tire swing from the right branch
  const px = x + 66, py = gy - 196, sw = Math.sin(S.t * 1.6) * 0.12;
  ctx.save(); ctx.translate(px, py); ctx.rotate(sw);
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 120); ctx.stroke();
  ctx.lineWidth = 11; ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.ellipse(0, 140, 22, 26, 0, 0, TAU); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#5a5a6a'; ctx.beginPath(); ctx.ellipse(0, 140, 22, 26, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  ctx.restore();
}
function drawLaundry(x, gy) {
  inkRect(x, gy - 212, 9, 212, '#a08a7a', 2, 2); inkRect(x + 240, gy - 212, 9, 212, '#a08a7a', 2, 2);
  ctx.strokeStyle = '#e8e0f0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 4, gy - 206); ctx.quadraticCurveTo(x + 124, gy - 188, x + 244, gy - 206); ctx.stroke();
  const items = [[22, 66, 84, 'dots', '#ffffff', '#ff8fc8'], [100, 54, 62, 'stripes', '#bfe6ff', '#4f8fe8'], [168, 56, 94, 'plain', '#ffe9a0', '#ffc83d']];
  items.forEach(([dx, w, h, pat, c1, c2], i) => {
    const sway = Math.sin(S.t * 2 + i) * 5, top = gy - 200 + Math.sin((dx + w / 2) / 240 * Math.PI) * 6;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x + dx, top); ctx.lineTo(x + dx + w, top); ctx.quadraticCurveTo(x + dx + w + sway, top + h * 0.6, x + dx + w + sway * 1.4, top + h);
    ctx.quadraticCurveTo(x + dx + w / 2 + sway, top + h + 6, x + dx + sway, top + h); ctx.closePath();
    ctx.fillStyle = c1; ctx.fill(); ctx.clip();
    ctx.fillStyle = c2;
    if (pat === 'dots') for (let yy = 8; yy < h; yy += 14) for (let xx = 6 + (yy % 28 ? 7 : 0); xx < w + 10; xx += 14) circle(x + dx + xx + sway * yy / h, top + yy, 3);
    if (pat === 'stripes') for (let yy = 6; yy < h + 10; yy += 12) ctx.fillRect(x + dx - 10, top + yy, w + 30, 5);
    ctx.restore();
    ctx.strokeStyle = dk(c2, 0.2); ctx.lineWidth = 1.8; ctx.stroke();
    for (const px of [x + dx + 6, x + dx + w - 8]) box(px - 2, top - 6, 5, 12, 1.5, '#c99a5a', '#7a5a30', 1);
  });
}
function paintShed() {
  const R = rng(8);
  // siding planks with wood grain
  for (let x = -104; x < 104; x += 21) {
    ctx.fillStyle = vgrad(-178, 0, (x / 21) % 2 ? '#7fe0c8' : '#6fd4bc', '#4fb8a0'); ctx.fillRect(x, -178, 21, 178);
    ctx.strokeStyle = 'rgba(20,90,80,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 21, -178); ctx.lineTo(x + 21, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const gx = x + 4 + R() * 13; ctx.beginPath(); ctx.moveTo(gx, -170 + R() * 40); ctx.bezierCurveTo(gx + 3, -120, gx - 3, -60, gx + 1, -10 - R() * 30); ctx.stroke(); }
  }
  ctx.strokeStyle = '#2a7a6a'; ctx.lineWidth = 3; ctx.strokeRect(-104, -178, 208, 178);
  box(-110, -180, 12, 180, 2, '#ffffff', '#9ab8b0', 1.5); box(98, -180, 12, 180, 2, '#ffffff', '#9ab8b0', 1.5);
  // shingled roof
  const roof = new Path2D('M-130,-172 L0,-258 L130,-172 Z');
  ctx.save(); ctx.clip(roof);
  for (let row = 0, y = -258; y < -168; y += 14, row++) for (let x = -140 + (row % 2) * 12; x < 140; x += 24) {
    ctx.beginPath(); ctx.arc(x, y + 12, 12, 0, Math.PI);
    ctx.fillStyle = ['#9b6ae8', '#a97cf0', '#8e5ad8'][(((row + Math.round(x / 24)) % 3) + 3) % 3]; ctx.fill();
    ctx.strokeStyle = 'rgba(60,20,110,.45)'; ctx.lineWidth = 1.3; ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-134, -168); ctx.lineTo(0, -260); ctx.lineTo(134, -168); ctx.stroke();
  ctx.strokeStyle = '#5a3a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-140, -164); ctx.lineTo(0, -266); ctx.lineTo(140, -164); ctx.stroke();
  // gable heart window
  heart(0, -214, 30, '#ffd6f2');
  // door with Z-brace and heart cut-out
  box(-36, -130, 72, 130, 4, vgrad(-130, 0, '#f2a0c8', '#d878a8'), '#8a3a6a', 3);
  ctx.strokeStyle = 'rgba(120,30,80,.45)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-30, -112); ctx.lineTo(30, -112); ctx.lineTo(-30, -18); ctx.lineTo(30, -18); ctx.stroke();
  heart(0, -96, 18, '#5a2a4a');
  inkCircle(24, -64, 4.5, '#ffd84a', 1);
  // window with flower box
  box(48, -150, 44, 44, 4, '#ffffff', '#9ab8b0', 2);
  ctx.fillStyle = vgrad(-146, -110, '#3a2a5a', '#6a4a8a'); ctx.fillRect(52, -146, 36, 36);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(68, -146, 4, 36); ctx.fillRect(52, -130, 36, 4);
  box(42, -104, 56, 12, 3, '#b5713f', '#6a4228', 1.5);
  for (let i = 0; i < 5; i++) tinyFlower(48 + i * 11, -108, 5, ['#ff5fa2', '#ffe24a', '#fff'][i % 3]);
  // ivy up the left side
  ctx.strokeStyle = '#3f9a3f'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-96, 0); ctx.bezierCurveTo(-110, -60, -80, -110, -100, -170); ctx.stroke();
  for (let i = 0; i < 12; i++) { const t = i / 11; ctx.fillStyle = i % 2 ? '#4fae4a' : '#62c656'; ellipse(-98 + Math.sin(t * 9) * 9, -10 - t * 160, 7, 4, t * 4); }
  // flower pots & watering can
  for (const [px, col] of [[-130, '#e0703a'], [-104, '#ff8fc8'], [124, '#e0703a']]) {
    ctx.beginPath(); ctx.moveTo(px - 12, -24); ctx.lineTo(px + 12, -24); ctx.lineTo(px + 9, 0); ctx.lineTo(px - 9, 0); ctx.closePath(); fillLine(col, dk(col, 0.4), 2);
    foliage([[px - 5, -32, 8], [px + 5, -34, 8], [px, -40, 7]], '#4fb84a', '#2a7a3a', px, 1.2);
    tinyFlower(px, -42, 5, '#ffe24a');
  }
  ctx.beginPath(); ctx.moveTo(142, -2); ctx.lineTo(142, -30); ctx.lineTo(170, -30); ctx.lineTo(170, -2); ctx.closePath(); fillLine('#7fb8ff', '#2a5aa8', 2);
  ctx.strokeStyle = '#2a5aa8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(142, -22); ctx.lineTo(124, -40); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(156, -30, 10, Math.PI, 0); ctx.stroke();
}
function drawShed(x, gy, glow) {
  blit(sprite('shed', 340, 300, 160, 280, paintShed), x, gy);
  if (glow) {
    const g = ctx.createRadialGradient(x + 70, gy - 128, 4, x + 70, gy - 128, 70);
    g.addColorStop(0, `rgba(255,200,250,${0.4 + 0.15 * Math.sin(S.t * 3)})`); g.addColorStop(1, 'rgba(255,200,250,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 10, gy - 200, 160, 160);
  }
  for (let i = 0; i <= 10; i++) {
    const k = i / 10, lx = x - 124 + k * 248, ly = gy - 166 - (1 - Math.abs(k - 0.5) * 2) * 84 + 8;
    const c = ['#ff6fb5', '#ffe36b', '#6fd0ff', '#8ff0a8'][i % 4];
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(S.t * 3 + i); ctx.fillStyle = c; circle(lx, ly, 10);
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(S.t * 3 + i); circle(lx, ly, 4.5);
  }
  ctx.globalAlpha = 1;
}
function paintGate() {
  for (const px of [-72, 58]) box(px, -180, 16, 180, 3, hgrad(px, px + 16, '#a87a50', '#7a5230'), '#4a2a18', 2.5);
  ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(-4, -180, 70, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#4a2a18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-4, -180, 77, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(-4, -180, 63, Math.PI, 0); ctx.stroke();
  // vines & flowers climbing the arch
  const R = rng(91);
  for (let i = 0; i < 26; i++) {
    const a = Math.PI + (i / 25) * Math.PI, vx = -4 + Math.cos(a) * 70, vy = -180 + Math.sin(a) * 70;
    ctx.fillStyle = i % 2 ? '#4fae4a' : '#62c656'; ellipse(vx, vy, 8, 5, a);
    if (i % 3 === 0) tinyFlower(vx, vy, 6, ['#ff5fa2', '#ffffff', '#c6a2ff', '#ffe24a'][i % 4]);
  }
  for (const px of [-64, 66]) for (let i = 0; i < 8; i++) { ctx.fillStyle = '#4fae4a'; ellipse(px + Math.sin(i) * 6, -20 - i * 20, 7, 4, i); if (R() < 0.4) tinyFlower(px, -24 - i * 20, 5, '#ff9ec7'); }
  box(-56, -268, 104, 34, 8, '#fff3dc', '#7a5230', 3);
  text('The Woods →', -4, -251, 15, '#5a3a24', 'center', 700);
}

// ===========================================================================
// The woods
// ===========================================================================
function paintWoodsDecor(kind, seed) {
  const R = rng(seed);
  if (kind === 'mushrooms') {
    for (let i = 0; i < 4; i++) {
      const x = -30 + i * 20 + R() * 6, h = 14 + R() * 18, r = 10 + R() * 7;
      box(x - 4, -h, 8, h, 3, '#fff6e8', '#a89888', 1.5);
      ctx.beginPath(); ctx.ellipse(x, -h, r, r * 0.7, 0, Math.PI, 0); ctx.closePath(); fillLine(vgrad(-h - r, -h, '#ff5a4a', '#d8302a'), '#8a1a1a', 2);
      ctx.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) circle(x - r * 0.5 + k * r * 0.5, -h - r * 0.35 + (k % 2) * 3, 2.2);
    }
  } else if (kind === 'ferns') {
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + (f - 2) * 0.38, len = 46 + R() * 16;
      ctx.strokeStyle = '#2f8a3f'; ctx.lineWidth = 2.5;
      const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(ex * 0.5, ey * 0.7, ex, ey); ctx.stroke();
      for (let k = 1; k < 9; k++) {
        const t = k / 9, px = ex * t, py = ey * t + Math.sin(t * 2) * 6, lw = (1 - t) * 12 + 3;
        ctx.fillStyle = k % 2 ? '#4fb84a' : '#3fa04a';
        ellipse(px - 4, py, lw, 3, a - 1); ellipse(px + 4, py, lw, 3, a + 1);
      }
    }
  } else if (kind === 'log') {
    ctx.beginPath(); ctx.roundRect(-60, -26, 120, 26, 12); fillLine(vgrad(-26, 0, '#a06a40', '#6a4228'), '#4a2a18', 2.5);
    ctx.strokeStyle = 'rgba(60,30,15,.4)'; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-50 + i * 10, -20); ctx.lineTo(30 + i * 6, -16 + i * 3); ctx.stroke(); }
    inkEllipse(58, -13, 9, 13, 0, '#e8c08a', 1);
    ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1; for (const r of [3, 6, 9]) { ctx.beginPath(); ctx.ellipse(58, -13, r * 0.7, r, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#5ab84f'; ellipse(-20, -26, 26, 6); ellipse(14, -25, 14, 4);
    tinyFlower(-30, -30, 4, '#ffffff'); tinyFlower(-10, -30, 4, '#ffe24a');
  } else if (kind === 'stump') {
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-20, -36); ctx.lineTo(20, -36); ctx.lineTo(26, 0); ctx.closePath(); fillLine(hgrad(-26, 26, '#a06a40', '#6a4228'), '#4a2a18', 2.5);
    inkEllipse(0, -36, 21, 7, 0, '#e8c08a', 1.2);
    ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1; for (const r of [6, 12, 17]) { ctx.beginPath(); ctx.ellipse(0, -36, r, r / 3, 0, 0, TAU); ctx.stroke(); }
    paintWoodsDecor('mushrooms', seed + 1);
  } else if (kind === 'rock') {
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(-44, -30, -14, -40); ctx.quadraticCurveTo(20, -50, 36, -24); ctx.quadraticCurveTo(46, -6, 40, 0); ctx.closePath();
    fillLine(vgrad(-46, 0, '#c4bcd0', '#8a82a0'), '#5a5070', 2.5);
    ctx.fillStyle = '#6cc35a'; ellipse(-10, -38, 22, 7, -0.2); ellipse(18, -40, 12, 5, 0.3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-18, -26, 8, 4, -0.4);
  } else if (kind === 'bluebells') {
    for (let i = 0; i < 7; i++) {
      const x = -36 + i * 12 + R() * 4, h = 26 + R() * 14;
      ctx.strokeStyle = '#3f9a3f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 6, -h, x + 10, -h + 4); ctx.stroke();
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#8a7af0' : '#6a5ae0'; ellipse(x + 8 - k * 3, -h + 10 + k * 8, 4, 5.5); }
    }
  }
}
const WOODS_DECOR = [];
{
  const R = rng(1234), kinds = ['mushrooms', 'ferns', 'log', 'stump', 'rock', 'bluebells'];
  for (let x = GATE_X + 120; x < 4100; x += 110 + R() * 140) {
    if (x > CREEK0 - 60 && x < CREEK1 + 60) continue;
    WOODS_DECOR.push({ x, kind: kinds[Math.floor(R() * kinds.length)], seed: Math.floor(R() * 1000) });
  }
}
function drawWoodsDecor(cam) {
  for (const d of WOODS_DECOR) {
    if (d.x - cam < -100 || d.x - cam > W + 100) continue;
    blit(sprite(`decor:${d.kind}:${d.seed}`, 160, 110, 80, 100, () => paintWoodsDecor(d.kind, d.seed)), d.x - cam, GY);
  }
}
function drawLightShafts(cam, k) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const wx = GATE_X + 200 + i * 420, x = wx - cam * 0.95;
    if (x < -300 || x > W + 300) continue;
    const a = (0.06 + 0.03 * Math.sin(S.t * 0.6 + i)) * k;
    const g = ctx.createLinearGradient(x, 0, x - 160, GY);
    g.addColorStop(0, `rgba(255,250,200,${a * 1.6})`); g.addColorStop(1, 'rgba(255,250,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x - 110, GY); ctx.lineTo(x - 230, GY); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawFallingLeaves(cam, k) {
  if (k <= 0) return;
  for (let i = 0; i < 14; i++) {
    const wx = GATE_X + 100 + ((i * 337) % 2300), fall = (S.t * (24 + (i % 4) * 6) + i * 70) % 480;
    const x = wx - cam + Math.sin(S.t * 1.5 + i) * 26, y = fall - 20;
    if (x < -20 || x > W + 20) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 2 + i); ctx.globalAlpha = k;
    ctx.fillStyle = ['#f0a83a', '#e0603a', '#ffd23f', '#8ac84a'][i % 4]; ellipse(0, 0, 6, 3);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function drawCreek(x0, x1, cam, gy) {
  const sx0 = x0 - cam, sx1 = x1 - cam;
  // banks
  ctx.fillStyle = '#8a6a48';
  ctx.beginPath(); ctx.moveTo(sx0 - 20, gy - 4); ctx.quadraticCurveTo(sx0, gy + 4, sx0 + 10, gy + 40); ctx.lineTo(sx1 - 10, gy + 40); ctx.quadraticCurveTo(sx1, gy + 4, sx1 + 20, gy - 4); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(0, gy - 6, 0, H);
  g.addColorStop(0, '#6fd8f8'); g.addColorStop(0.4, '#3fb0e8'); g.addColorStop(1, '#2a7ac8');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(sx0, H);
  for (let x = x0; x <= x1; x += 16) ctx.lineTo(x - cam, gy - 2 + Math.sin(x * 0.05 + S.t * 2.4) * 2.5);
  ctx.lineTo(sx1, H); ctx.closePath(); ctx.fill();
  // flowing highlights
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5;
  for (let i = 0; i < 12; i++) {
    const span = x1 - x0, wx = x0 + ((i * 97 + S.t * 40) % span), y = gy + 14 + (i * 13) % 50;
    ctx.beginPath(); ctx.moveTo(wx - cam, y); ctx.quadraticCurveTo(wx - cam + 12, y - 3, wx - cam + 26, y); ctx.stroke();
  }
  // stones, lily pads, reeds
  const R = rng(x0);
  for (let i = 0; i < 6; i++) { const x = x0 + 30 + i * (x1 - x0 - 60) / 5; inkEllipse(x - cam, gy + 30 + (i % 2) * 18, 16 + R() * 6, 7, 0, '#a8a0b8', 1.5); ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(x - cam - 4, gy + 27 + (i % 2) * 18, 6, 2); }
  for (const px of [x0 + 60, x0 + 220, x1 - 90]) { ctx.fillStyle = '#4fbc5a'; ellipse(px - cam, gy + 54, 16, 6); ctx.fillStyle = '#ff9ec7'; circle(px - cam + 4, gy + 50, 4); }
  for (const rx of [x0 - 6, x0 + 12, x1 - 10, x1 + 8]) {
    ctx.strokeStyle = '#3f8a3f'; ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(rx - cam + k * 5, gy + 6); ctx.quadraticCurveTo(rx - cam + k * 5 - 4, gy - 30, rx - cam + k * 6, gy - 50 - k * 6); ctx.stroke(); }
    box(rx - cam + 2, gy - 62, 7, 20, 3, '#8a5a30', '#5a3a18', 1);
  }
  // a little wooden bridge, so the path keeps going
  const by = gy - 4;
  box(sx0 - 30, by - 6, sx1 - sx0 + 60, 14, 4, vgrad(by - 6, by + 8, '#c99a6a', '#9a6a40'), '#5a3a20', 2.5);
  ctx.strokeStyle = 'rgba(80,50,25,.5)'; ctx.lineWidth = 1.5;
  for (let x = sx0 - 24; x < sx1 + 30; x += 18) { ctx.beginPath(); ctx.moveTo(x, by - 6); ctx.lineTo(x, by + 8); ctx.stroke(); }
  for (let x = sx0 - 20; x <= sx1 + 20; x += (sx1 - sx0 + 40) / 4) box(x - 4, by - 46, 8, 46, 2, '#a87a50', '#5a3a20', 2);
  ctx.strokeStyle = '#a87a50'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx0 - 20, by - 40); ctx.lineTo(sx1 + 20, by - 40); ctx.stroke();
}

// ===========================================================================
// The whole home setting
// ===========================================================================
const WOODS_TREES = [];
{
  const R = rng(99);
  // back row: smaller, set back, darker
  for (let x = GATE_X + 40; x < 4700; x += 110 + R() * 80) {
    if (x > STAGE_X - 260 && x < STAGE_X + 240) continue;
    WOODS_TREES.push({ x, back: true, kind: Math.floor(R() * 3), h: 230 + R() * 50 });
  }
  for (let x = GATE_X + 140; x < 4700; x += 150 + R() * 90) {
    if (x > CREEK0 - 40 && x < CREEK1 + 40) continue;
    if (x > STAGE_X - 280 && x < STAGE_X + 260) continue;
    WOODS_TREES.push({ x, back: false, kind: Math.floor(R() * 3), h: 320 + R() * 80 });
  }
}
function drawHomeSetting(cam, dusk) {
  const vis = (wx, pad = 400) => wx - cam > -pad && wx - cam < W + pad;
  drawSkyLayers(cam, dusk);
  // back row of woods trees sits on the horizon, behind everything else
  // (bluer and smaller, so they read as farther away)
  for (const t of WOODS_TREES) if (t.back && vis(t.x, 160)) {
    blit(treeSprite(TREE_KINDS[t.kind], 10 + t.kind, 3 / 4), t.x - cam, GY - 22, t.h / 330 * 0.7);
  }
  drawGroundChunks(cam);
  if (vis(320, 700)) blit(sprite('house', 720, 540, 10, 520, paintHouse), -cam, GY);
  if (vis(620)) blit(sprite('mailbox', 80, 160, 40, 150, paintMailbox), 640 - cam, GY);
  if (vis(560)) blit(sprite('flowerbed', 220, 90, 20, 80, paintFlowerBed), 560 - cam, GY);
  drawFenceRun(770, GATE_X - 90, cam, GY);
  if (vis(APPLE_X)) drawAppleTree(APPLE_X - cam, GY);
  if (vis(PATCH_X)) blit(sprite('strawberries', 280, 70, 140, 60, paintStrawberryPatch), PATCH_X - cam, GY);
  if (vis(1180)) drawLaundry(1060 - cam, GY);
  if (vis(1400)) blit(sprite('birdbath', 90, 90, 45, 80, paintBirdbath), 1410 - cam, GY);
  if (vis(SHED_X)) drawShed(SHED_X - cam, GY, false);
  if (vis(1680)) blit(sprite('gnome', 40, 70, 20, 64, paintGnome), 1680 - cam, GY);
  if (vis(GATE_X)) blit(sprite('gate', 200, 290, 100, 280, paintGate), GATE_X - cam, GY);
  for (const t of WOODS_TREES) if (!t.back && vis(t.x, 160)) blit(treeSprite(TREE_KINDS[t.kind], 20 + t.kind, 0), t.x - cam, GY, t.h / 330);
  drawWoodsDecor(cam);
  if (vis((CREEK0 + CREEK1) / 2, 600)) drawCreek(CREEK0, CREEK1, cam, GY);
}
// called after characters & bushes: the woods' atmosphere and night-time tint
function drawHomeAtmosphere(cam, dusk) {
  const k = forestK(cam + W / 2);
  if (k > 0) {
    ctx.fillStyle = `rgba(20,60,50,${0.12 * k})`; ctx.fillRect(0, 0, W, H);
    drawLightShafts(cam, k * (1 - dusk));
    drawFallingLeaves(cam, k);
  }
  if (dusk > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = mix('#ffffff', '#3a3a8a', dusk); ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    // lit windows and a glowing porch lamp
    for (const [x, y, w, h] of HOUSE_WINDOWS) { ctx.fillStyle = `rgba(255,200,90,${0.55 * dusk})`; ctx.fillRect(x - cam, GY + y, w, h); }
    const lamp = ctx.createRadialGradient(378 - cam, GY - 140, 2, 378 - cam, GY - 140, 80);
    lamp.addColorStop(0, `rgba(255,220,120,${0.7 * dusk})`); lamp.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = lamp; ctx.fillRect(298 - cam, GY - 220, 160, 160);
    ctx.restore();
    for (let i = 0; i < 60; i++) {
      const a = (0.3 + 0.7 * Math.abs(Math.sin(S.t + i * 1.7))) * dusk;
      star((i * 211 - cam * 0.05 + 2000) % W, (i * 67) % 240, 1.5 + (i % 3), `rgba(255,255,240,${a})`);
    }
  }
  if (k > 0 || dusk > 0) {
    for (let i = 0; i < 26; i++) {
      const wx = 1900 + ((i * 263) % 2600) + Math.sin(S.t * 0.7 + i) * 30, x = wx - cam;
      if (x < 0 || x > W) continue;
      const y = GY - 40 - ((i * 97) % 220) + Math.cos(S.t * 0.9 + i * 2) * 15;
      const al = (0.3 + 0.7 * Math.max(0, Math.sin(S.t * 2 + i * 1.3))) * (0.3 + dusk);
      ctx.fillStyle = `rgba(255,250,150,${al})`; circle(x, y, 2.5);
      ctx.fillStyle = `rgba(255,250,150,${al * 0.25})`; circle(x, y, 10);
    }
  }
  // chimney smoke
  if (-cam + 475 > -100 && -cam + 475 < W + 100) {
    for (let i = 0; i < 6; i++) {
      const p = (S.t * 0.25 + i / 6) % 1;
      ctx.fillStyle = `rgba(240,240,250,${0.55 * (1 - p)})`;
      circle(475 - cam + Math.sin(p * 6 + i) * 12 + p * 40, GY - 456 - p * 140, 10 + p * 22);
    }
  }
}
