'use strict';
// Batch 2 stages: Puddle Jump Lane, Maya's Treehouse, Buzzy Bee Meadow, The Dusty Attic,
// Robin's Nest Oak and Glittering Creek. Each gets its own backdrop and two new minigames.
{
  // ---------------------------------------------------------------- shared helpers
  const CARD_COLS = ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a', '#ff9a3a', '#e0508a', '#3fb0b0', '#c07a30'];
  const keyPick = n => { for (let i = 0; i < Math.min(n, 9); i++) if (pressed[String(i + 1)]) return i; return -1; };
  const idPick = (id, pre, n) => (id && id.startsWith(pre) ? +id.slice(pre.length) : keyPick(n));
  const tickDown = (o, dt) => { for (const k in o) if ((o[k] -= dt) <= 0) delete o[k]; };
  const shakeX = (o, k) => (o[k] ? Math.sin(o[k] * 50) * 7 : 0);
  // arrows / WASD or the mouse move g.px, g.py inside the given box
  function steer(g, dt, speed, x0, x1, y0, y1) {
    const bx = g.px, by = g.py;
    let kx = 0, ky = 0;
    if (goLeft()) kx--;
    if (goRight()) kx++;
    if (keys.arrowup || keys.w) ky--;
    if (goDown()) ky++;
    if (kx || ky) { const l = Math.hypot(kx, ky); g.px += kx / l * speed * dt; g.py += ky / l * speed * dt; } else if (pointerMoved(g)) {
      const dx = pointer.x - g.px, dy = pointer.y - g.py, d = Math.hypot(dx, dy), step = Math.min(d, speed * 1.4 * dt);
      if (d > 1) { g.px += dx / d * step; g.py += dy / d * step; }
    }
    g.px = clamp(g.px, x0, x1); g.py = clamp(g.py, y0, y1);
    g.vx = (g.px - bx) / Math.max(dt, 1e-3); g.vy = (g.py - by) / Math.max(dt, 1e-3);
    if (Math.abs(g.px - bx) > 0.3) g.facing = Math.sign(g.px - bx);
  }
  // a soft puffy cloud
  function puff(x, y, s, col = 'rgba(255,255,255,.92)') {
    ctx.fillStyle = col;
    ellipse(x, y, 62 * s, 22 * s); ellipse(x - 30 * s, y - 6 * s, 30 * s, 22 * s); ellipse(x + 8 * s, y - 20 * s, 34 * s, 26 * s); ellipse(x + 40 * s, y - 6 * s, 26 * s, 18 * s);
  }
  // four-point twinkle
  function twinkle(x, y, r, a, col = '#ffffff') { ctx.globalAlpha = clamp(a, 0, 1); star(x, y, r, col, 4); ctx.globalAlpha = 1; }
  // bunches of round leaves: outline all, then fill, then a highlight, so a bunch reads as one shape
  function leafBlob(pts, base, line = mix(base, '#1a3020', 0.5)) {
    ctx.strokeStyle = line; ctx.lineWidth = 4;
    for (const [x, y, r] of pts) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = base; for (const [x, y, r] of pts) circle(x, y, r);
    ctx.fillStyle = mix(base, '#ffffff', 0.16); for (const [x, y, r] of pts) circle(x - r * 0.22, y - r * 0.28, r * 0.55);
  }
  // a string of fairy lights sagging from a to b
  function fairyLights(ax, ay, bx, by, sag, n, t) {
    ctx.strokeStyle = '#5b3f73'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag * 2, bx, by); ctx.stroke();
    const cols = ['#ff6fae', '#ffe36b', '#7fe0ff', '#a6f0b8', '#c6a2ff'];
    for (let i = 1; i < n; i++) {
      const k = i / n, x = lerp(ax, bx, k), y = lerp(ay, by, k) + 4 * sag * k * (1 - k), on = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.7);
      const c = cols[i % cols.length];
      ctx.globalAlpha = 0.35 * on; ctx.fillStyle = c; circle(x, y + 5, 11);
      ctx.globalAlpha = 1; inkEllipse(x, y + 5, 4.5, 6, 0, mix(c, '#ffffff', on * 0.4), 1);
    }
  }
  // a little hexagonal crystal pointing up from (x, y)
  function crystal(x, y, h, w, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const p = P2(`M${-w / 2},0 L${-w / 2},${-h * 0.72} L0,${-h} L${w / 2},${-h * 0.72} L${w / 2},0 Z`);
    ink(p, col, 1.5);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.fillRect(-w / 2, -h, w * 0.32, h);
    ctx.fillStyle = 'rgba(40,10,80,.16)'; ctx.fillRect(w * 0.18, -h, w, h);
    ctx.restore();
    ctx.restore();
  }
  function crystalCluster(x, y, s, cols, t = 0) {
    const g = ctx.createRadialGradient(x, y - 30 * s, 4, x, y - 30 * s, 70 * s);
    g.addColorStop(0, `rgba(255,255,255,${0.35 + 0.15 * Math.sin(t * 2 + x)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; circle(x, y - 30 * s, 70 * s);
    [[-22, 46, 16, -0.42, 0], [20, 52, 17, 0.38, 1], [-8, 70, 20, -0.12, 2], [8, 60, 18, 0.12, 3], [-2, 34, 14, 0.7, 4]].forEach(([dx, h, w, r, i]) => crystal(x + dx * s, y, h * s, w * s, cols[i % cols.length], r));
  }
  // a regular polygon's corner points (flat bottom)
  function polyPts(n, x, y, r, rot = 0) {
    const a0 = -Math.PI / 2 + (n % 2 ? 0 : Math.PI / n) + rot, out = [];
    for (let i = 0; i < n; i++) out.push([x + Math.cos(a0 + i * Math.PI * 2 / n) * r, y + Math.sin(a0 + i * Math.PI * 2 / n) * r]);
    return out;
  }
  const ptsPath = pts => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };

  // =====================================================================================
  // 1. PUDDLE JUMP LANE: a rainy, colourful village street
  // =====================================================================================
  const PJ_SHOPS = [
    { x: 4, w: 184, top: 170, wall: '#ffc2d2', trim: '#e2507e', aw: '#ff5f7e', name: 'BAKERY', goods: ['🧁', '🥐', '🍰'] },
    { x: 196, w: 184, top: 142, wall: '#c4e6ff', trim: '#3a8ad0', aw: '#40b0ff', name: 'TOYS', goods: ['🧸', '🪁', '🚂'] },
    { x: 388, w: 184, top: 182, wall: '#fff0a8', trim: '#e0901a', aw: '#ffa040', name: 'FLOWERS', goods: ['🌷', '🌻', '🌹'] },
    { x: 580, w: 184, top: 152, wall: '#c8f0c4', trim: '#2f9f5a', aw: '#5adc7a', name: 'BOOKS', goods: ['📚', '📖', '🔖'] },
    { x: 772, w: 184, top: 166, wall: '#e4d4ff', trim: '#7a4ad8', aw: '#9c6cff', name: 'TEA', goods: ['🫖', '☕', '🍪'] },
  ];
  function umbrella(x, y, r, col, rot = 0, dots = null) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -r * 0.1); ctx.lineTo(0, r * 0.95); ctx.arc(-r * 0.14, r * 0.95, r * 0.14, 0, Math.PI); ctx.stroke();
    const p = new Path2D(); p.moveTo(-r, 0); p.arc(0, 0, r, Math.PI, 0);
    for (let i = 0; i < 4; i++) p.quadraticCurveTo(r - i * r / 2 - r / 4, -r * 0.24, r - (i + 1) * r / 2, 0);
    p.closePath();
    ink(p, col, 2);
    if (dots) { ctx.save(); ctx.clip(p); ctx.fillStyle = dots; for (const [dx, dy] of [[-0.55, -0.35], [0, -0.72], [0.55, -0.35], [-0.22, -0.3], [0.25, -0.22]]) circle(dx * r, dy * r, r * 0.1); ctx.restore(); }
    ctx.strokeStyle = 'rgba(91,63,115,.45)'; ctx.lineWidth = 1.5;
    for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(k * r * 0.9, -r * 0.5, k * r, -2); ctx.stroke(); }
    inkCircle(0, -r - 3, 3, col, 1);
    ctx.restore();
  }
  function closedUmbrella(x, y, h, col, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, -h - 14); ctx.arc(-6, -h - 14, 6, 0, Math.PI, true); ctx.stroke();
    ink(P2(`M0,${-h} C9,${-h * 0.7} 9,${-h * 0.25} 0,0 C-9,${-h * 0.25} -9,${-h * 0.7} 0,${-h} Z`), col, 1.5);
    ctx.restore();
  }
  // a wobbly puddle with sky reflections and rain ripples
  function puddle(x, y, rx, ry, seed = 0, ripples = 2) {
    const p = new Path2D();
    for (let i = 0; i <= 28; i++) {
      const a = i / 28 * Math.PI * 2, k = 1 + 0.09 * Math.sin(a * 3 + seed) + 0.05 * Math.sin(a * 5 + seed * 2);
      const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
      if (i) p.lineTo(px, py); else p.moveTo(px, py);
    }
    p.closePath();
    ctx.strokeStyle = 'rgba(70,60,120,.45)'; ctx.lineWidth = 4; ctx.stroke(p);
    const g = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    g.addColorStop(0, '#d8f0ff'); g.addColorStop(1, '#6aaef0');
    ctx.fillStyle = g; ctx.fill(p);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.45, ry * 0.18);
    ctx.fillStyle = 'rgba(255,140,190,.35)'; ellipse(x + rx * 0.25, y + ry * 0.1, rx * 0.35, ry * 0.12);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < ripples; i++) {
      const k = (S.t * 0.7 + i / ripples + seed * 0.13) % 1, ox = Math.sin(seed * 7 + i * 3 + Math.floor(S.t * 0.7 + i / ripples)) * rx * 0.45;
      ctx.strokeStyle = `rgba(255,255,255,${0.85 * (1 - k)})`;
      ctx.beginPath(); ctx.ellipse(x + ox, y, 3 + k * rx * 0.45, 1 + k * ry * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  function rain(n, alpha = 0.4, y0 = 64) {
    ctx.strokeStyle = `rgba(235,245,255,${alpha})`; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = ((i * 97.3 + S.t * 70) % (W + 80)) - 40, y = y0 + ((i * 53.7 + S.t * 520) % (H - y0));
      ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14);
    }
    ctx.stroke();
  }
  function pjShop(s, i) {
    const { x, w, top } = s, cx = x + w / 2;
    if (i % 2 === 0) ink(P2(`M${x - 6},${top + 2} L${cx},${top - 54} L${x + w + 6},${top + 2} Z`), mix(s.trim, '#5a3a5a', 0.15), 2);
    else { inkRect(x + w - 54, top - 40, 22, 44, '#d08060', 2, 2); inkRect(x + w - 58, top - 46, 30, 8, '#b06a50', 2, 2); }
    inkRect(x, top, w, 400 - top, s.wall, 2.5, 2);
    ctx.strokeStyle = mix(s.wall, '#5b3f73', 0.12); ctx.lineWidth = 1.5;
    for (let y = top + 14; y < 400; y += 14) { ctx.beginPath(); ctx.moveTo(x + 3, y); ctx.lineTo(x + w - 3, y); ctx.stroke(); }
    if (i % 2) inkRect(x - 4, top - 6, w + 8, 14, mix(s.trim, '#ffffff', 0.3), 2, 3);
    else { inkCircle(cx, top - 20, 10, '#fff8ec', 1.5); ctx.fillStyle = s.trim; circle(cx, top - 20, 4); }
    // upstairs window with a flower box
    inkRect(cx - 34, 192, 68, 44, '#ffeec0', 2, 6);
    ctx.fillStyle = mix(s.aw, '#ffffff', 0.4); ctx.fillRect(cx - 32, 194, 14, 40); ctx.fillRect(cx + 18, 194, 14, 40);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, 194); ctx.lineTo(cx, 236); ctx.moveTo(cx - 32, 214); ctx.lineTo(cx + 32, 214); ctx.stroke();
    if (i === 1) emoji('🐈', cx - 10, 224, 22);
    if (i === 3) emoji('🪴', cx + 8, 224, 20);
    inkRect(cx - 42, 234, 84, 10, '#a0683a', 1.5, 3);
    for (let k = 0; k < 5; k++) flower(cx - 32 + k * 16, 232, 6, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff', '#ff9a5a'][(k + i) % 5], '#ffd84a', 1);
    // sign, striped awning dripping with rain, shop window, door
    inkRect(cx - 62, 248, 124, 22, '#fff8ec', 2, 6);
    text(s.name, cx, 259.5, 14, s.trim, 'center', 800);
    const aw = P2(`M${x + 6},276 L${x + w - 6},276 L${x + w + 4},302 L${x - 4},302 Z`);
    ctx.save(); ctx.clip(aw); ctx.fillStyle = s.aw; ctx.fillRect(x - 6, 270, w + 12, 40);
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < w + 12; k += 32) ctx.fillRect(x - 4 + k, 270, 16, 40); ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.stroke(aw);
    for (let k = 0; k < 6; k++) {
      const sx = x - 4 + k * (w + 8) / 6 + (w + 8) / 12;
      ctx.beginPath(); ctx.arc(sx, 302, (w + 8) / 12, 0, Math.PI);
      ctx.fillStyle = k % 2 ? '#ffffff' : s.aw; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
      const dy = (S.t * 70 + k * 23 + i * 11) % 90;
      if (dy < 80) { ctx.fillStyle = 'rgba(200,230,255,.85)'; ellipse(sx, 318 + dy, 2.5, 4); }
    }
    const wg = ctx.createLinearGradient(0, 316, 0, 392); wg.addColorStop(0, '#fff6d0'); wg.addColorStop(1, '#ffcf70');
    inkRect(x + 12, 316, 112, 76, wg, 2.5, 4);
    s.goods.forEach((e, k) => emoji(e, x + 32 + k * 36, 368, 26));
    ctx.fillStyle = 'rgba(255,255,255,.45)'; tri(x + 16, 320, x + 46, 320, x + 16, 352);
    ctx.fillStyle = '#a0683a'; ctx.fillRect(x + 14, 382, 108, 6);
    ink(P2(`M${x + 134},400 L${x + 134},334 Q${x + 134},314 ${x + 155},314 Q${x + 176},314 ${x + 176},334 L${x + 176},400 Z`), mix(s.trim, '#ffffff', 0.12), 1.5);
    inkRect(x + 144, 330, 22, 20, '#ffeec0', 1.5, 4);
    ctx.fillStyle = '#ffd84a'; circle(x + 168, 366, 3.5);
  }
  BACKDROPS.puddles_bg = () => {
    bdSky('#88b0e8', '#f0eeff');
    // the rainbow peeks out between the clouds
    ctx.save(); ctx.lineCap = 'butt'; ctx.globalAlpha = 0.85;
    PG_RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(760, 310, 222 - i * 11, Math.PI * 1.06, Math.PI * 1.94); ctx.stroke(); });
    ctx.restore();
    const drift = Math.sin(S.t * 0.2) * 12;
    puff(120 + drift, 104, 1.1, 'rgba(236,240,255,.95)'); puff(380 - drift, 92, 0.9, 'rgba(226,232,252,.95)');
    puff(600 + drift, 128, 1.0, 'rgba(255,255,255,.95)'); puff(930 - drift, 120, 1.1, 'rgba(255,255,255,.95)');
    PJ_SHOPS.forEach(pjShop);
    // lamp posts with hanging flower baskets
    for (const lx of [192, 576]) {
      ctx.fillStyle = 'rgba(255,230,150,.3)'; circle(lx, 238, 30 + Math.sin(S.t * 2 + lx) * 2);
      inkRect(lx - 4, 250, 8, 186, '#3d4a6a', 2, 3);
      ink(P2(`M${lx - 12},252 L${lx - 16},228 L${lx + 16},228 L${lx + 12},252 Z`), '#ffe9a0', 1.5);
      inkRect(lx - 18, 222, 36, 8, '#3d4a6a', 1.5, 3);
      ctx.strokeStyle = '#3d4a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, 290); ctx.lineTo(lx + 26, 290); ctx.lineTo(lx + 26, 300); ctx.stroke();
      ink(P2(`M${lx + 10},300 L${lx + 42},300 Q${lx + 40},322 ${lx + 26},324 Q${lx + 12},322 ${lx + 10},300 Z`), '#c98a4a', 1.5);
      for (let k = 0; k < 4; k++) flower(lx + 14 + k * 8, 298, 5, ['#ff6fae', '#ffd84a', '#fff', '#c6a2ff'][k], '#ffd84a', 1);
    }
    // the pavement and the wet cobbled lane
    ctx.fillStyle = '#ddd6ea'; ctx.fillRect(0, 400, W, 36);
    ctx.strokeStyle = 'rgba(91,63,115,.2)'; ctx.lineWidth = 1.5;
    for (let x = 24; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 400); ctx.lineTo(x - 6, 436); ctx.stroke(); }
    inkRect(-4, 432, W + 8, 10, '#bdb4cc', 2, 2);
    ctx.fillStyle = '#8f93bd'; ctx.fillRect(0, 442, W, H - 442);
    for (let r = 0; r < 7; r++) for (let x = (r % 2) * -18; x < W; x += 36) rrect(x + 2, 446 + r * 14, 32, 11, 5, ['#9da1c8', '#a6a2cc', '#979cc4'][(r + Math.round(x / 36)) % 3]);
    // shop colours reflected on the wet street
    PJ_SHOPS.forEach(s => { const g = ctx.createLinearGradient(0, 442, 0, H); g.addColorStop(0, s.aw + '55'); g.addColorStop(1, s.aw + '00'); ctx.fillStyle = g; ctx.fillRect(s.x + 24, 442, s.w - 48, H - 442); });
    puddle(110, 476, 70, 13, 1, 3); puddle(470, 520, 90, 14, 2, 3); puddle(860, 506, 64, 12, 3, 2); puddle(640, 458, 40, 8, 4, 1);
    // a paper boat bobbing in the big puddle
    const by = 512 + Math.sin(S.t * 2) * 2;
    ink(P2(`M450,${by} L500,${by} L490,${by + 10} L460,${by + 10} Z`), '#ffffff', 1.5);
    ink(P2(`M466,${by} L476,${by - 22} L486,${by} Z`), '#ffe36b', 1.5);
    // umbrellas: one leaning by the books, two in a stand by the bakery, a big one over the tea table
    umbrella(548, 408, 30, '#ff5f7e', -0.5, '#ffffff');
    inkRect(150, 384, 28, 34, '#4fa8e0', 2, 4);
    closedUmbrella(158, 386, 46, '#ffd23a', -0.12); closedUmbrella(170, 386, 42, '#5adc7a', 0.15);
    inkRect(150, 384, 28, 16, '#4fa8e0', 2, 4);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(910, 418); ctx.lineTo(910, 360); ctx.stroke();
    inkRect(882, 412, 56, 8, '#ffffff', 2, 3); inkRect(906, 418, 8, 18, '#ffffff', 1.5, 2);
    umbrella(910, 352, 52, '#9c6cff', 0, '#ffe36b');
    emoji('☕', 896, 404, 14);
    // splashes on the cobbles, then the rain
    for (let i = 0; i < 8; i++) {
      const k = (S.t * 1.6 + i * 0.37) % 1, sx = (i * 131 + Math.floor(S.t * 1.6 + i * 0.37) * 211) % W, sy = 450 + (i * 37) % 80;
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx, sy, 2 + k * 10, 1 + k * 3, 0, 0, Math.PI * 2); ctx.stroke();
    }
    rain(80, 0.38);
  };

  function drawSnail(x, y, s, dir = 1, hid = false, t = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    if (!hid) {
      const st = Math.sin(t * 3) * 2;
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(30, -18); ctx.lineTo(32 + st, -38); ctx.moveTo(38, -18); ctx.lineTo(44 + st, -34); ctx.stroke();
      inkCircle(32 + st, -38, 4, '#c8e88a', 1); inkCircle(44 + st, -34, 4, '#c8e88a', 1);
      ink(P2('M-36,0 C-36,-8 -20,-12 0,-11 L22,-11 C28,-26 40,-28 44,-20 C46,-10 40,-2 32,0 Z'), '#c8e88a', 2);
      ctx.fillStyle = OL; circle(38, -18, 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(38, -13, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    }
    inkCircle(-4, -24, 22, '#ff9ac8', 2);
    ctx.strokeStyle = '#c2508a'; ctx.lineWidth = 3; ctx.beginPath();
    for (let a = 0; a < Math.PI * 4.2; a += 0.2) { const r = 2 + a * 1.35; ctx.lineTo(-4 + Math.cos(a) * r, -24 + Math.sin(a) * r); }
    ctx.stroke();
    ctx.restore();
  }
  // --- Boot Stomp: Aubrey, in her rain boots and raincoat, hops about a rainy back garden ----------
  // A rain cloud drifts overhead and its drops make the puddles (go and stand under it!). Tap = a
  // small hop, hold = a BIG jump for big puddles. Fergus calls out BIG / small stomp jobs and joins in
  // for double splashes. Snails and worms with umbrellas cross the patio: hop OVER them, never on them.
  const BS_Y0 = 300, BS_Y1 = 510, BS_X0 = 70, BS_X1 = 890;
  const bsPer = y => lerp(0.8, 1.08, clamp((y - BS_Y0) / (BS_Y1 - BS_Y0), 0, 1));
  const bsRad = p => { const k = bsPer(p.y) * p.sz; return [(p.big ? 80 : 44) * k, (p.big ? 26 : 15) * k]; };
  const bsSeeded = s => () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const BS_STONES = (() => {
    const r = bsSeeded(11), out = [];
    for (let y = 276, row = 0; y < H; row++) {
      const h = 24 + row * 4;
      for (let x = -40 + r() * 50; x < W + 10;) { const w = 76 + r() * 46 + row * 8; out.push([x, y, w, h, Math.floor(r() * 4), r()]); x += w; }
      y += h;
    }
    return out;
  })();
  const BS_STONE_COLS = ['#8e96c6', '#9aa0cd', '#8690bf', '#a4a7d2'];
  function bsPuddlePath(x, y, rx, ry, seed) {
    const p = new Path2D();
    for (let i = 0; i <= 28; i++) {
      const a = i / 28 * Math.PI * 2, k = 1 + 0.09 * Math.sin(a * 3 + seed) + 0.05 * Math.sin(a * 5 + seed * 2);
      if (i) p.lineTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k); else p.moveTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k);
    }
    p.closePath();
    return p;
  }
  // Aubrey in a sunny yellow raincoat and red polka-dot rain boots, drawn in the idle_front sprite's
  // own pixels (feet at the bottom of the box); (0, 0) is the ground under her
  function bsAubBody(h, lift, sx, sy, tilt) {
    const im = IMG.idle_front, s = h / im.height, lw = 1.25 / s;
    ctx.save(); ctx.translate(0, -lift); ctx.rotate(tilt); ctx.scale(sx * s, sy * s); ctx.translate(-im.width / 2, -im.height);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ink(P2('M49,-8 C78,-8 90,14 86,40 C84,56 76,64 66,64 L32,64 C22,64 14,56 12,40 C8,14 20,-8 49,-8 Z'), '#ffd23a', lw); // hood behind her head
    ctx.drawImage(im, 0, 0);
    ink(P2('M30,52 C40,58 58,58 68,52 L74,58 C88,96 102,128 102,152 C70,160 28,160 -4,152 C-4,128 10,96 24,58 Z'), '#ffd23a', lw);
    ctx.strokeStyle = '#e0a810'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(49, 60); ctx.lineTo(49, 154); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, 146); ctx.quadraticCurveTo(49, 156, 100, 146); ctx.stroke();
    inkRect(12, 118, 22, 14, '#ffc21a', lw * 0.8, 3); inkRect(64, 118, 22, 14, '#ffc21a', lw * 0.8, 3);
    for (const y of [74, 96, 118, 140]) inkCircle(54, y, 2.8, '#3a8ad0', lw * 0.5);
    ink(P2('M30,52 L46,72 L49,59 Z'), '#ffe27a', lw * 0.8); ink(P2('M68,52 L52,72 L49,59 Z'), '#ffe27a', lw * 0.8);
    ctx.drawImage(aubArmsImage(), 0, 0);
    ink(P2('M25,57 C15,64 12,90 13,124 L28,124 C29,100 30,82 32,66 Z'), '#ffd23a', lw);
    ink(P2('M73,57 C83,64 86,90 85,124 L70,124 C69,100 68,82 66,66 Z'), '#ffd23a', lw);
    inkRect(11, 120, 19, 7, '#3a8ad0', lw * 0.7, 3); inkRect(68, 120, 19, 7, '#3a8ad0', lw * 0.7, 3);
    for (const [fx, d] of [[32, -1], [81, 1]]) {
      ctx.save(); ctx.translate(fx, 0); ctx.scale(d, 1);
      const boot = P2('M-11,178 L11,178 L12,206 C22,207 27,212 26,220 L-13,220 C-13,206 -12,190 -11,178 Z');
      ink(boot, '#ff3f62', lw);
      ctx.save(); ctx.clip(boot); ctx.fillStyle = '#ffffff';
      for (const [dx, dy] of [[-5, 188], [5, 196], [-4, 206], [7, 184], [16, 214], [3, 214]]) circle(dx, dy, 2.2);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-9, 180, 4, 24);
      ctx.restore();
      inkRect(-13, 173, 26, 8, '#ffd23a', lw * 0.8, 3);
      inkRect(-14, 218, 41, 5, '#5a3a6a', lw * 0.6, 2);
      ctx.restore();
    }
    ctx.restore();
  }
  // a pink worm with a tiny umbrella; curled up when shy
  function bsWorm(x, y, s, dir, t, hid) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    if (hid) {
      inkCircle(0, -14, 14, '#ff9ab8', 2);
      ctx.strokeStyle = '#e06a90'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -14, 8, 0, Math.PI * 1.6); ctx.stroke();
    } else {
      const segs = [];
      for (let i = 0; i < 7; i++) segs.push([-30 + i * 9, -8 - Math.abs(Math.sin(t * 6 - i * 0.8)) * 6 * (i > 0 && i < 6 ? 1 : 0.3)]);
      ctx.strokeStyle = OL; ctx.lineWidth = 4;
      for (const [sx, sy] of segs) { ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(32, -14, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ff9ab8'; for (const [sx, sy] of segs) circle(sx, sy, 8); circle(32, -14, 11);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; for (const [sx, sy] of segs) circle(sx - 2, sy - 3, 3);
      ctx.fillStyle = OL; circle(35, -17, 2); circle(30, -17, 2);
      ctx.fillStyle = '#ff5f8a'; circle(38, -11, 2.5);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(33, -11, 3, 0.3, Math.PI - 0.3); ctx.stroke();
    }
    ctx.restore();
  }
  // the grumbly-but-friendly rain cloud
  function bsCloud(x, y, t, puffT) {
    const k = 1 + Math.max(0, puffT) * 0.5, b = Math.sin(t * 1.6) * 3;
    ctx.save(); ctx.translate(x, y + b); ctx.scale(k, 1 / Math.sqrt(k));
    leafBlob([[-58, 8, 28], [-30, -8, 34], [6, -20, 40], [44, -6, 34], [68, 10, 24], [-14, 16, 32], [30, 16, 30]], '#aab2dc', '#4a4278');
    ctx.fillStyle = OL; ctx.lineWidth = 2.5; ctx.strokeStyle = OL;
    ctx.beginPath(); ctx.arc(-12, 2, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(18, 2, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(3, 10, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,130,170,.5)'; ellipse(-24, 10, 6, 3.5); ellipse(30, 10, 6, 3.5);
    ctx.restore();
  }
  // a little ladybug carrying an umbrella
  function bsLadybug(x, y, t, dir) {
    umbrella(x - 4 * dir, y - 26, 13, '#5adc7a', Math.sin(t * 3) * 0.12, '#ffffff');
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    inkCircle(9, -6, 5, '#3a2a4a', 1.2);
    inkEllipse(0, -7, 10, 8, 0, '#ff3f4a', 1.5);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 1); ctx.stroke();
    ctx.fillStyle = OL; circle(-4, -10, 1.8); circle(4, -5, 1.8); circle(-5, -3, 1.5);
    ctx.fillStyle = '#ffffff'; circle(11, -7, 1.3);
    ctx.restore();
  }
  // the back garden: rainy sky, a growing rainbow, the fence, glistening bushes and a wet stone patio
  function bsGarden(g) {
    const t = S.t, sc = clamp(g.score, 0, 1);
    const sk = ctx.createLinearGradient(0, 0, 0, 280); sk.addColorStop(0, '#8eaae4'); sk.addColorStop(1, '#e8e4ff');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, 280);
    puff(150, 92, 0.9, 'rgba(236,238,255,.8)'); puff(820, 84, 1.0, 'rgba(236,238,255,.8)'); puff(520, 70, 0.7, 'rgba(236,238,255,.7)');
    // the rainbow fills in band by band as Aubrey splashes
    ctx.save(); ctx.lineCap = 'butt';
    PG_RAINBOW.forEach((c, i) => {
      const r = 250 - i * 11, a = clamp(sc * 6 - i, 0, 1), a0 = Math.PI * 1.04, sweep = Math.PI * 0.92;
      ctx.strokeStyle = c; ctx.lineWidth = 11;
      ctx.globalAlpha = 0.16; ctx.beginPath(); ctx.arc(480, 330, r, a0, a0 + sweep); ctx.stroke();
      if (a > 0) { ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(480, 330, r, a0, a0 + sweep * a); ctx.stroke(); }
    });
    ctx.restore();
    if (sc >= 0.99) for (let i = 0; i < 6; i++) twinkle(260 + i * 88, 96 + Math.abs(i - 2.5) * 22, 9, 0.5 + 0.5 * Math.sin(t * 5 + i), '#fff6a8');
    // far-off trees
    ctx.fillStyle = 'rgba(110,170,150,.55)';
    for (let x = -20; x < W + 40; x += 70) circle(x, 176 + Math.sin(x) * 8, 40 + (x % 3) * 6);
    // the picket fence
    for (let x = -10; x < W; x += 36) ink(P2(`M${x},264 L${x},182 L${x + 13},166 L${x + 26},182 L${x + 26},264 Z`), '#f6f0ff', 1.2);
    inkRect(-10, 194, W + 20, 11, '#e2d8f4', 2, 3); inkRect(-10, 238, W + 20, 11, '#e2d8f4', 2, 3);
    // a ladybug with an umbrella strolls along the top rail
    const lbx = ((t * 26) % (W + 120)) - 60;
    bsLadybug(lbx, 194, t, 1);
    // the big tree on the left
    inkRect(46, 120, 34, 150, '#8a6a50', 2.5, 8);
    leafBlob([[20, 112, 44], [74, 92, 46], [124, 116, 38], [58, 146, 40], [4, 152, 30], [110, 152, 28]], '#4fae5a');
    // the house corner, its downpipe and the rain barrel on the right
    inkRect(908, 90, 70, 180, '#ffd2c4', 2.5, 2);
    ink(P2('M896,96 L972,70 L972,96 Z'), '#c05a5a', 1.5);
    inkRect(920, 130, 30, 40, '#bfe4ff', 2, 4);
    inkRect(892, 96, 10, 120, '#9aa6c8', 1.5, 3);
    ctx.fillStyle = 'rgba(190,225,255,.85)'; const sp = Math.sin(t * 20) * 1.5; ctx.fillRect(894 + sp * 0.3, 214, 6, 22);
    inkRect(866, 222, 60, 48, '#9a6a48', 2.5, 8);
    ctx.fillStyle = '#6e4a34'; ctx.fillRect(866, 234, 60, 4); ctx.fillRect(866, 256, 60, 4);
    inkEllipse(896, 223, 30, 6, 0, '#7fb8ec', 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; const rk = (t * 1.5) % 1;
    ctx.beginPath(); ctx.ellipse(897, 223, 4 + rk * 22, 1 + rk * 4, 0, 0, Math.PI * 2); ctx.stroke();
    // a mouse peeking out from behind the barrel, under its umbrella
    const my = 238 + Math.sin(t * 1.3) * 3;
    umbrella(846, my - 30, 18, '#ff6fb5', -0.2, '#ffffff');
    inkCircle(838, my - 14, 7, '#c8c0d8', 1.2); inkCircle(856, my - 14, 7, '#c8c0d8', 1.2);
    inkEllipse(847, my - 2, 14, 12, 0, '#c8c0d8', 1.5);
    ctx.fillStyle = '#ffb0c8'; circle(838, my - 14, 3.5); circle(856, my - 14, 3.5); circle(847, my + 4, 2.5);
    ctx.fillStyle = OL; circle(842, my - 3, 1.8); circle(852, my - 3, 1.8);
    // glistening bushes and tulips along the fence
    for (const [bx, bc] of [[160, '#3fa85a'], [370, '#4fb862'], [590, '#3fa85a'], [770, '#4fb862']]) {
      leafBlob([[bx - 30, 258, 22], [bx, 248, 28], [bx + 30, 258, 22], [bx - 12, 266, 20], [bx + 14, 266, 20]], bc);
      for (let i = 0; i < 4; i++) {
        const dx = [-30, -6, 18, 34][i], dy = [248, 232, 240, 254][i];
        twinkle(bx + dx, dy, 5, 0.3 + 0.7 * Math.max(0, Math.sin(t * 2.2 + bx + i * 1.7)), '#ffffff');
      }
    }
    for (const [fx, col] of [[250, '#ff5f7e'], [272, '#ffd23a'], [460, '#c690ff'], [482, '#ff8a3a'], [680, '#ff6fb5'], [702, '#ffd23a']]) {
      const sw = Math.sin(t * 1.8 + fx) * 3;
      ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, 276); ctx.quadraticCurveTo(fx, 256, fx + sw, 236); ctx.stroke();
      ink(P2(`M${fx + sw - 9},${236} C${fx + sw - 10},${222} ${fx + sw - 4},${220} ${fx + sw - 3},${226} L${fx + sw},${219} L${fx + sw + 3},${226} C${fx + sw + 4},${220} ${fx + sw + 10},${222} ${fx + sw + 9},${236} Z`), col, 1.2);
    }
    // grass edge, then the wet stone patio
    inkRect(-10, 262, W + 20, 20, '#6cc46a', 1.5, 6);
    ctx.fillStyle = '#5c6292'; ctx.fillRect(0, 276, W, H - 276);
    for (const [x, y, w, h, c, r] of BS_STONES) {
      rrect(x + 3, y + 3, w - 6, h - 6, 9, BS_STONE_COLS[c]);
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ellipse(x + w * (0.3 + r * 0.3), y + h * 0.35, w * 0.22, h * 0.14);
    }
    // the sky, the fence and the rainbow reflected on the wet stones
    const rf = ctx.createLinearGradient(0, 276, 0, H); rf.addColorStop(0, 'rgba(235,236,255,.35)'); rf.addColorStop(0.5, 'rgba(235,236,255,0)');
    ctx.fillStyle = rf; ctx.fillRect(0, 276, W, H - 276);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 276, W, H - 276); ctx.clip(); ctx.lineCap = 'butt';
    PG_RAINBOW.forEach((c, i) => {
      const a = clamp(sc * 6 - i, 0, 1);
      if (a <= 0) return;
      ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.globalAlpha = 0.13;
      ctx.beginPath(); ctx.ellipse(480, 250, 250 - i * 11, (250 - i * 11) * 0.55, 0, Math.PI * 0.06, Math.PI * 0.06 + Math.PI * 0.88 * a); ctx.stroke();
    });
    ctx.restore();
    for (let i = 0; i < 9; i++) {
      const k = (t * 1.4 + i * 0.37) % 1, sx = (i * 131 + Math.floor(t * 1.4 + i * 0.37) * 211) % W, sy = 300 + (i * 47) % 230;
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx, sy, 2 + k * 12, 1 + k * 4, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  const bsSplashSound = (big, combo) => {
    const f = 300 + Math.min(combo, 6) * 40;
    tone(f, big ? 0.3 : 0.18, 'sine', 0.13, 0, 80); noise(big ? 0.3 : 0.16, big ? 0.09 : 0.06);
    tone(f * 2.4, 0.12, 'triangle', 0.05, 0.05);
    if (big) tone(90, 0.25, 'sine', 0.16, 0, 50);
  };
  const BS_JOBS = [
    [['big', 1], ['small', 2], ['big', 1], ['small', 3], ['big', 1], ['small', 2], ['big', 1], ['small', 3]],
    [['small', 2], ['big', 1], ['small', 3], ['big', 2], ['small', 3], ['big', 1], ['small', 4], ['big', 2]],
    [['big', 2], ['small', 3], ['big', 1], ['small', 4], ['big', 2], ['small', 3], ['big', 2], ['small', 4]],
  ];
  MG.bootstomp = {
    kind: 'action', title: () => 'Boot Stomp', icon: () => '👢',
    how: () => 'Move Aubrey with the mouse or arrows. Tap, or press Space, to hop and SPLASH! Hold for a BIG jump on BIG puddles. Stand near the rain cloud to find new puddles, do what Fergus says, and hop OVER the snails!',
    init(g) {
      const t = g.tier - 1;
      Object.assign(g, {
        timeLeft: [45, 44, 42][t], target: [34, 38, 42][t], gap: [1.5, 1.35, 1.2][t], life: [9.5, 8, 7][t],
        chargeT: [0.38, 0.45, 0.5][t], critGap: [8, 6, 4.6][t], critMax: [1, 2, 3][t], streakGap: [12, 11, 10][t],
        px: 330, py: 430, vx: 0, vy: 0, facing: 1, walk: 0, air: null, charge: -1, chKey: false, sq: 0, sqv: 0,
        pts: 0, splashes: 0, oops: 0, combo: 0, lastStomp: -9, puds: [], crits: [], drops: [], rings: [], shk: 0,
        cloud: { x: 520, gy: 400, tx: 520, tgy: 400, wait: 2, puff: 0 }, spawnT: 0.3, critT: 3, streakT: 7, tellBig: 0,
        fg: { x: 800, y: 486, fx: 800, fy: 486, tx: 800, ty: 486, hop: -1, dir: -1, coop: null, coopT: 6, bubble: 0 },
        jobs: BS_JOBS[t], jobI: 0, job: null, jobWait: 0.6, warned: {}, win: 0, said: false,
        say: 'Splash the puddles! Hop over the snails!',
      });
      for (let i = 0; i < 3; i++) this.spawnPuddle(g, i === 1, 520 + (i - 1) * 140, 400 + (i - 1) * 30, 0.4);
    },
    start(g) { speak('Splash the puddles! Hold for a BIG jump. Hop over the snails!'); },
    spawnPuddle(g, big, x, y, age = -0.35) {
      for (let k = 0; k < 10; k++) {
        const px = clamp(x + (k ? rand(-90, 90) : 0), BS_X0, BS_X1), py = clamp(y + (k ? rand(-30, 30) : 0), BS_Y0 + 6, BS_Y1);
        const free = g.puds.every(p => { const [rx, ry] = [(p.big ? 84 : 48) + (big ? 84 : 48), 40 + (big ? 14 : 0)]; return ((px - p.x) / rx) ** 2 + ((py - p.y) / ry) ** 2 > 1; });
        if (free) { g.puds.push({ x: px, y: py, big, age, life: g.life * rand(0.9, 1.1) * (big ? 1.15 : 1), seed: rand(0, 9), sz: 0, wob: 0, coop: false }); return true; }
      }
      return false;
    },
    newJob(g) {
      const [size, n] = g.jobs[g.jobI % g.jobs.length];
      g.jobI++;
      g.job = { size, n, got: 0, done: 0 };
      g.say = `Stomp ${NUM_WORDS[n]} ${size === 'big' ? 'BIG' : 'small'} puddle${n > 1 ? 's' : ''}!`;
      speak(`Fergus says: ${g.say}`);
      g.fg.bubble = 2.5;
    },
    splash(g, x, y, big, k) {
      const n = big ? 34 : 20;
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(50, big ? 270 : 170) * k;
        g.drops.push({ x, y, z: 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.4, vz: rand(200, big ? 520 : 380), r: rand(2.5, big ? 6 : 4.5) * k });
      }
      for (let i = 0; i < (big ? 4 : 3); i++) g.rings.push({ x, y, r: 6, R: (big ? 130 : 80) * k * (1 - i * 0.18), life: 0.7 + i * 0.15, max: 0.7 + i * 0.15, rb: big && i === 0, d: i * 0.08 });
      if (big) { g.shk = 0.35; burst(x, y - 30, 14, { colors: PG_RAINBOW, spread: 200, up: 160 }); } else burst(x, y - 20, 6, { colors: ['#ffffff', '#bfe6ff', '#fff6a8'], spread: 120, up: 100 });
    },
    launch(g) {
      const big = g.charge >= 1, pow = clamp(g.charge, 0, 1);
      let tx = g.px, ty = g.py;
      if (!g.chKey) {
        const dx = pointer.x - g.px, dy = pointer.y - g.py, d = Math.hypot(dx, dy), mx = big ? 340 : 260;
        if (d > 8) { const f = Math.min(1, mx / d); tx = g.px + dx * f; ty = g.py + dy * f; }
      } else {
        let kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        const l = Math.hypot(kx, ky);
        if (l) { tx += kx / l * (big ? 190 : 130); ty += ky / l * (big ? 120 : 85); }
      }
      tx = clamp(tx, BS_X0, BS_X1); ty = clamp(ty, BS_Y0, BS_Y1);
      g.air = { x0: g.px, y0: g.py, x1: tx, y1: ty, t: 0, dur: lerp(0.42, 0.7, pow), h: lerp(46, 124, pow), big, near: {} };
      if (Math.abs(tx - g.px) > 2) g.facing = Math.sign(tx - g.px);
      g.charge = -1; g.sqv = 7 + pow * 5;
      tone(big ? 300 : 420, 0.18, 'triangle', 0.07, 0, big ? 900 : 760);
    },
    land(g) {
      const a = g.air, x = g.px, y = g.py, k = bsPer(y);
      g.air = null; g.sqv = a.big ? -10 : -7;
      // landing on a snail or worm? It ducks and squeaks, unhurt, and the stomp is lost
      const onCrit = g.crits.find(c => !c.hide && ((x - c.x) / (40 * k)) ** 2 + ((y - c.y) / (20 * k)) ** 2 < 1);
      if (onCrit) {
        onCrit.hide = 1.6; g.oops++; g.pts = Math.max(0, g.pts - 1); g.combo = 0; SFX.miss();
        floatText(onCrit.x, onCrit.y - 60, 'Eek! Hop OVER me!', '#ffb0c4', false, 20);
        if (!g.warned.crit) { g.warned.crit = 1; speak(`Oops! Hop over the ${onCrit.kind}s, don't land on them!`); }
        return;
      }
      // a near miss: the critter giggles
      for (const c of g.crits) if (a.near[c.id] && !c.hide) {
        c.giggle = 1.4; g.pts += 0.5; tone(1200, 0.08, 'sine', 0.06); tone(1500, 0.08, 'sine', 0.06, 0.09);
        floatText(c.x, c.y - 56, 'Hee hee! +½', '#ffd0f0', false, 20);
      }
      const hits = g.puds.filter(p => p.age > 0.1 && p.sz > 0.2).map(p => { const [rx, ry] = bsRad(p); return [p, ((x - p.x) / (rx + 10)) ** 2 + ((y - p.y) / (ry + 8)) ** 2]; }).filter(h => h[1] < 1.1).sort((u, v) => u[1] - v[1]);
      if (!hits.length) { SFX.step(); g.rings.push({ x, y, r: 4, R: 34 * k, life: 0.5, max: 0.5, d: 0 }); return; }
      const p = hits[0][0];
      if (p.big && !a.big) {
        p.wob = 0.5; g.combo = 0; SFX.miss(); tone(260, 0.1, 'sine', 0.08, 0, 140);
        g.rings.push({ x, y, r: 4, R: 46 * k, life: 0.5, max: 0.5, d: 0 });
        floatText(p.x, p.y - 70, 'Too BIG! Hold for a BIG jump!', '#fff6a8', false, 20);
        if (g.tellBig <= 0) { g.tellBig = 6; speak('That puddle is BIG! Hold down to charge a BIG jump!'); }
        return;
      }
      g.puds = g.puds.filter(q => q !== p);
      g.splashes++;
      g.combo = g.t - g.lastStomp < 1.5 ? g.combo + 1 : 1; g.lastStomp = g.t;
      g.pts += p.big ? 1.5 : 1;
      this.splash(g, p.x, p.y, p.big || a.big, k * (p.big ? 1.15 : 1));
      bsSplashSound(p.big, g.combo);
      floatText(p.x, p.y - 80, p.big ? pick(['KER-SPLOOSH!', 'MEGA SPLASH!', 'SPLOOOSH!']) : pick(['SPLASH!', 'SPLISH!', 'SPLOSH!']), p.big ? '#ffe36b' : '#d8f0ff', false, p.big ? 30 : 24);
      if (g.combo >= 2) { if (g.combo >= 3) g.pts += 0.25; floatText(p.x, p.y - 112, `Hop combo x${g.combo}!`, '#ffb0e0', false, 20); }
      const f = g.fg;
      if (p.coop && f.coop === p) {
        g.pts += 1; f.coop = null; f.hop = 0; f.fx = f.x; f.fy = f.y; f.tx = f.x; f.ty = f.y; f.coopT = rand(7, 10);
        this.splash(g, f.x, f.y, false, k);
        floatText(f.x, f.y - 110, 'Double splash! Ribbit!', '#a6f0b8', false, 24); SFX.sparkle();
      }
      const j = g.job;
      if (j && !j.done && (p.big ? 'big' : 'small') === j.size) {
        j.got++;
        if (j.got >= j.n) {
          j.done = 1; g.pts += 1.5; g.jobWait = 2.6; SFX.hit();
          speak(`Ribbit! ${NUM_WORDS[j.n]} ${j.size === 'big' ? 'BIG' : 'small'} puddle${j.n > 1 ? 's' : ''}! Well done!`);
          burst(170, 100, 16);
        }
      }
    },
    update(g, dt) {
      g.timeLeft -= dt; g.tellBig -= dt; g.shk = Math.max(0, g.shk - dt);
      const cl = g.cloud;
      cl.puff = Math.max(0, cl.puff - dt * 2);
      // the rain cloud drifts about; its drops make new puddles underneath it
      const cdx = cl.tx - cl.x, cdy = cl.tgy - cl.gy, cd = Math.hypot(cdx, cdy), cs = 70 + g.tier * 12;
      if (cd > 2) { cl.x += cdx / cd * Math.min(cd, cs * dt); cl.gy += cdy / cd * Math.min(cd, cs * 0.6 * dt); } else if ((cl.wait -= dt) <= 0) {
        let nx;
        do nx = rand(170, 800); while (Math.abs(nx - cl.x) < 200);
        cl.tx = nx; cl.tgy = rand(BS_Y0 + 40, BS_Y1 - 20); cl.wait = rand(2.5, 4);
      }
      if ((g.spawnT -= dt) <= 0 && g.timeLeft > 1.5) {
        g.spawnT = g.gap * rand(0.8, 1.2);
        const live = g.puds.length, wantBig = g.job && !g.job.done && g.job.size === 'big';
        if (live < 4 + g.tier) { this.spawnPuddle(g, Math.random() < (wantBig ? 0.6 : 0.3), cl.x + rand(-80, 80), cl.gy + rand(-26, 26)); cl.puff = 0.4; }
      }
      // now and then the cloud sneezes out a whole row of little puddles to hop along
      if ((g.streakT -= dt) <= 0 && g.timeLeft > 4) {
        g.streakT = g.streakGap * rand(0.9, 1.15);
        const n = g.tier === 1 ? 3 : 4, y = clamp(cl.gy, BS_Y0 + 20, BS_Y1 - 10), x0 = clamp(cl.x - (n - 1) * 60, BS_X0 + 10, BS_X1 - (n - 1) * 120 - 10);
        let made = 0;
        for (let i = 0; i < n; i++) made += this.spawnPuddle(g, false, x0 + i * 120, y + Math.sin(i * 1.7) * 10, -0.3 - i * 0.22) ? 1 : 0;
        if (made >= 2) { cl.puff = 1; floatText(cl.x, 200, 'A puddle path! Hop, hop, hop!', '#ffffff', false, 22); if (!g.said) { g.said = true; speak('A puddle path! Hop, hop, hop!'); } }
      }
      for (const p of g.puds) {
        p.age += dt; p.wob = Math.max(0, p.wob - dt);
        const grow = clamp(p.age / 0.45, 0, 1), dry = clamp((p.age - p.life * 0.65) / (p.life * 0.35), 0, 1);
        p.sz = (1 - (1 - grow) ** 3) * (1 - 0.6 * dry) * (1 + Math.sin(p.wob * 30) * 0.06);
      }
      g.puds = g.puds.filter(p => {
        if (p.age < p.life) return true;
        floatText(p.x, p.y - 30, 'Dried up!', '#eef0ff', false, 16);
        if (g.fg.coop === p) { g.fg.coop = null; g.fg.coopT = rand(4, 7); }
        return false;
      });
      // snails and worms with umbrellas wander across the patio
      if ((g.critT -= dt) <= 0) {
        g.critT = g.critGap * rand(0.8, 1.2);
        if (g.crits.length < g.critMax) {
          const dir = pick([-1, 1]);
          g.crits.push({ id: Math.random(), kind: pick(['snail', 'worm']), x: dir > 0 ? -50 : W + 50, y: g.crits.length ? (g.crits[g.crits.length - 1].y > 405 ? rand(BS_Y0 + 20, 380) : rand(430, BS_Y1 - 10)) : rand(BS_Y0 + 20, BS_Y1 - 10), dir, spd: rand(24, 34) + g.tier * 4, hide: 0, giggle: 0, col: pick(['#ff6fb5', '#40b0ff', '#ffd23a', '#9c6cff']) });
        }
      }
      for (const c of g.crits) {
        c.hide = Math.max(0, c.hide - dt); c.giggle = Math.max(0, c.giggle - dt);
        if (!c.hide) c.x += c.dir * c.spd * dt;
        if (!g.air && !c.hide && Math.abs(g.px - c.x) < 34 && Math.abs(g.py - c.y) < 16 && !c.shy) { c.shy = 1; floatText(c.x, c.y - 50, 'Excuse me!', '#ffffff', false, 16); }
        if (Math.abs(g.px - c.x) > 60) c.shy = 0;
      }
      g.crits = g.crits.filter(c => c.x > -80 && c.x < W + 80);
      // Fergus's stomp jobs
      if (g.job?.done || !g.job) { if ((g.jobWait -= dt) <= 0) this.newJob(g); }
      g.fg.bubble = Math.max(0, g.fg.bubble - dt);
      // Fergus hops over to a puddle and waits there to splash it together
      const f = g.fg;
      if (f.hop >= 0) {
        f.hop += dt / 0.55;
        f.x = lerp(f.fx, f.tx, Math.min(1, f.hop)); f.y = lerp(f.fy, f.ty, Math.min(1, f.hop));
        if (f.hop >= 1) { f.hop = -1; SFX.step(); }
      } else if (!f.coop && (f.coopT -= dt) <= 0) {
        const p = g.puds.filter(p => p.age > 0.5 && p.life - p.age > 4.5 && !p.coop).sort((a, b) => Math.hypot(a.x - g.px, a.y - g.py) - Math.hypot(b.x - g.px, b.y - g.py))[1] || g.puds.find(p => p.age > 0.5 && p.life - p.age > 4.5);
        if (p) {
          const side = p.x > 760 ? -1 : 1, [rx] = [(p.big ? 80 : 44) * bsPer(p.y)];
          Object.assign(f, { fx: f.x, fy: f.y, tx: clamp(p.x + side * (rx + 34), 40, W - 40), ty: p.y + 6, hop: 0, dir: -side, coop: p });
          p.coop = true; f.bubble = 3; tone(300, 0.1, 'square', 0.04); tone(220, 0.12, 'square', 0.04, 0.1);
        } else f.coopT = 1;
      }
      // Aubrey: walk, charge, leap, land
      if (g.air) {
        const a = g.air;
        a.t += dt / a.dur;
        const k = Math.min(1, a.t);
        g.px = lerp(a.x0, a.x1, k); g.py = lerp(a.y0, a.y1, k);
        for (const c of g.crits) if (!c.hide && Math.abs(g.px - c.x) < 56 && Math.abs(g.py - c.y) < 30 && k > 0.15 && k < 0.85) a.near[c.id] = 1;
        if (a.t >= 1) this.land(g);
      } else if (g.charge >= 0) {
        g.charge = Math.min(1, g.charge + dt / g.chargeT);
        if (g.charge >= 1 && !g.fullTone) { g.fullTone = 1; SFX.pop(); }
        const held = g.chKey ? keys[' '] : pointer.down;
        if (!held) this.launch(g);
        pointerMoved(g);
      } else {
        g.fullTone = 0;
        if (pressed[' '] || pressed.enter) { g.charge = 0; g.chKey = true; } else if (pointer.clicked && pointer.y > 64) { g.charge = 0; g.chKey = false; g.usePointer = true; }
        else {
          steer(g, dt, 250, BS_X0, BS_X1, BS_Y0, BS_Y1);
          const sp = Math.hypot(g.vx, g.vy);
          g.walk = sp > 20 ? g.walk + dt * 12 : 0;
        }
      }
      // squash and stretch on a spring
      const tgt = g.charge >= 0 ? -0.24 * g.charge : g.air ? (g.air.t < 0.5 ? 0.16 : 0.06) : 0;
      g.sqv += ((tgt - g.sq) * 220 - g.sqv * 13) * dt; g.sq = clamp(g.sq + g.sqv * dt, -0.4, 0.4);
      // splash droplets and ripples
      for (const d of g.drops) { d.vz -= 1100 * dt; d.z += d.vz * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.z < 0 && !d.gone) { d.gone = 1; if (Math.random() < 0.3) g.rings.push({ x: d.x, y: d.y, r: 2, R: 14, life: 0.4, max: 0.4, d: 0 }); } }
      g.drops = g.drops.filter(d => !d.gone);
      for (const r of g.rings) { if (r.d > 0) r.d -= dt; else r.life -= dt; }
      g.rings = g.rings.filter(r => r.life > 0);
      g.progress = `Splashes: ${g.splashes}`;
      g.score = clamp(g.pts / g.target, 0, 1);
      if (g.score >= 1 && !g.win) { g.win = 1.6; speak('A whole rainbow! Splendid splashing!'); SFX.sparkle(); }
      if (g.win && (g.win -= dt) <= 0) g.done = true;
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
    },
    draw(g) {
      ctx.save();
      if (g.shk > 0) ctx.translate(Math.sin(g.t * 70) * g.shk * 18, Math.cos(g.t * 55) * g.shk * 10);
      bsGarden(g);
      const cl = g.cloud, t = S.t, cy = 182;
      // the cloud's shadow and the rain column it sends down
      const ck = bsPer(cl.gy);
      ctx.fillStyle = 'rgba(40,40,110,.2)'; ellipse(cl.x, cl.gy, 110 * ck, 30 * ck);
      ctx.strokeStyle = 'rgba(70,100,190,.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < 18; i++) {
        const ox = ((i * 37) % 160) - 80, len = cl.gy - cy - 10, yy = cy + 14 + ((t * 420 + i * 61) % len);
        ctx.moveTo(cl.x + ox, yy); ctx.lineTo(cl.x + ox - 2, yy + 14);
      }
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const k = (t * 2.2 + i * 0.25) % 1, ox = ((i * 53 + Math.floor(t * 2.2 + i * 0.25) * 71) % 180) - 90;
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cl.x + ox, cl.gy + ((i * 13) % 30) - 15, 2 + k * 14, 1 + k * 4, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // puddles, with Aubrey reflected in them
      const pClip = new Path2D();
      for (const p of g.puds) {
        if (p.age < 0) continue;
        const [rx, ry] = bsRad(p);
        puddle(p.x, p.y, rx, ry, p.seed, p.big ? 3 : 2);
        pClip.addPath(bsPuddlePath(p.x, p.y, rx, ry, p.seed));
        if (p.coop && g.fg.coop === p) {
          ctx.strokeStyle = `rgba(166,240,184,${0.6 + 0.4 * Math.sin(t * 6)})`; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
          ctx.beginPath(); ctx.ellipse(p.x, p.y, rx + 12, ry + 8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        }
        if (p.big) { // a leaf boat rides the big puddles
          const bx = p.x + Math.sin(t * 0.8 + p.seed) * rx * 0.4, by = p.y + Math.sin(t * 2 + p.seed) * 1.5;
          ink(P2(`M${bx - 13},${by - 3} C${bx - 6},${by + 6} ${bx + 6},${by + 6} ${bx + 14},${by - 4} C${bx + 4},${by - 1} ${bx - 4},${by - 1} ${bx - 13},${by - 3} Z`), '#5adc7a', 1.2);
        }
        if (p.sz < 0.75 && p.age > p.life * 0.6 && Math.sin(t * 16 + p.seed) > 0.3) twinkle(p.x + rx * 0.7, p.y - ry, 7, 0.9, '#fff6a8');
      }
      // drops falling from the cloud to where new puddles are about to appear
      for (const p of g.puds) if (p.age < 0) { const k = 1 + p.age / 0.35; if (k > 0) { const y = lerp(cy + 20, p.y - 6, clamp(k, 0, 1)); inkEllipse(p.x, y, 5, 8, 0, '#bfe6ff', 1, '#4a6aa8'); } }
      // charge ring and leap target
      const ak = bsPer(g.py), ah = 132 * ak;
      if (g.charge >= 0) {
        const full = g.charge >= 1;
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(g.px, g.py, 46 * ak, 15 * ak, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = full ? (Math.sin(t * 20) > 0 ? '#ff6fb5' : '#ffd23a') : '#ffd23a'; ctx.beginPath(); ctx.ellipse(g.px, g.py, 46 * ak, 15 * ak, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.charge); ctx.stroke();
        if (!g.chKey) {
          const dx = pointer.x - g.px, dy = pointer.y - g.py, d = Math.hypot(dx, dy), m = Math.min(1, (full ? 340 : 260) / Math.max(d, 1));
          const tx = clamp(g.px + dx * m, BS_X0, BS_X1), ty = clamp(g.py + dy * m, BS_Y0, BS_Y1);
          if (d > 30) {
            ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(g.px, g.py - 20);
            ctx.quadraticCurveTo((g.px + tx) / 2, Math.min(g.py, ty) - (full ? 130 : 70), tx, ty); ctx.stroke(); ctx.setLineDash([]);
            ctx.strokeStyle = full ? '#ff6fb5' : '#ffd23a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(tx, ty, 26, 9, 0, 0, Math.PI * 2); ctx.stroke();
          }
        }
      }
      // Aubrey's reflection: faint on the wet stones, bright in the puddles
      const lift = g.air ? 4 * g.air.h * Math.min(1, g.air.t) * (1 - Math.min(1, g.air.t)) : g.walk ? Math.abs(Math.sin(g.walk)) * 5 : 0;
      const tilt = g.air ? (g.air.x1 - g.air.x0) / 2200 : g.walk ? Math.sin(g.walk) * 0.04 : 0;
      const sx = 1 - g.sq * 0.7, sy = 1 + g.sq;
      for (const [clip, al] of [[null, 0.16], [pClip, 0.4]]) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 278, W, H); ctx.clip(); if (clip) ctx.clip(clip);
        ctx.globalAlpha = al; ctx.translate(g.px, g.py + 2); ctx.scale(1, -0.75); bsAubBody(ah, lift, sx, sy, tilt);
        ctx.restore();
      }
      // everything standing on the patio, back to front
      const ents = [];
      for (const c of g.crits) ents.push([c.y, () => {
        const k = bsPer(c.y), wig = c.giggle ? Math.sin(t * 30) * 0.12 : 0;
        ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(c.x, c.y, 40 * k, 8 * k);
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(wig);
        if (c.kind === 'snail') { drawSnail(0, 0, 0.62 * k, c.dir, c.hide > 0, t); if (!c.hide) umbrella(-4 * 0.62 * k * c.dir, -58 * k, 20 * k, c.col, Math.sin(t * 2 + c.id * 9) * 0.1, '#ffffff'); }
        else { bsWorm(0, 0, 0.8 * k, c.dir, t, c.hide > 0); if (!c.hide) umbrella(26 * k * c.dir, -46 * k, 18 * k, c.col, 0.15 * c.dir, '#ffffff'); }
        if (c.hide) { umbrella(-34 * k * c.dir, -8 * k, 16 * k, c.col, 1.3 * c.dir, null); outlined('!', 0, -50 * k, 24, '#ffb0c4'); }
        if (c.giggle) { text('hee hee!', 0, -86 * k - (1.4 - c.giggle) * 20, 16, '#ff6fb5', 'center', 800); emoji('💕', 22 * k, -70 * k, 16); }
        ctx.restore();
      }]);
      const f = g.fg;
      ents.push([f.y, () => {
        const fl = f.hop >= 0 ? Math.sin(Math.min(1, f.hop) * Math.PI) * 60 : 0, k = bsPer(f.y);
        ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(f.x, f.y, 30 * k, 7 * k);
        drawCritter('Fergus the Frog', f.x, f.y - fl, 0.5 * k, f.dir);
      }]);
      ents.push([g.py, () => {
        ctx.fillStyle = 'rgba(40,20,60,.24)'; ellipse(g.px, g.py, 34 * ak * (1 - lift / 300), 9 * ak * (1 - lift / 300));
        ctx.save(); ctx.translate(g.px, g.py); bsAubBody(ah, lift, sx, sy, tilt); ctx.restore();
        if (g.charge >= 1) outlined('BIG!', g.px, g.py - ah - 22, 26, '#ff6fb5', 'center', '#fff');
      }]);
      ents.sort((a, b) => a[0] - b[0]).forEach(e => e[1]());
      // splash droplets and ripple rings
      for (const r of g.rings) {
        if (r.d > 0) continue;
        const k = 1 - r.life / r.max, rr = lerp(r.r, r.R, 1 - (1 - k) ** 2);
        if (r.rb) PG_RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = 0.7 * (1 - k); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(r.x, r.y, rr + i * 5, (rr + i * 5) * 0.32, 0, 0, Math.PI * 2); ctx.stroke(); });
        ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rr, rr * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (const d of g.drops) {
        ctx.fillStyle = 'rgba(40,40,100,.15)'; ellipse(d.x, d.y, d.r, d.r * 0.4);
        inkEllipse(d.x, d.y - d.z, d.r * 0.8, d.r * 1.2, Math.atan2(d.vx, -d.vz) * 0.5, '#cfeeff', 0.7, '#4a6aa8');
        ctx.fillStyle = '#ffffff'; circle(d.x - d.r * 0.25, d.y - d.z - d.r * 0.4, d.r * 0.3);
      }
      bsCloud(cl.x, cy - 10, t, cl.puff);
      rain(60, 0.32, 64);
      // Fergus's speech bubble
      if (f.bubble > 0 || (f.coop && f.hop < 0)) {
        const k = bsPer(f.y), bx = clamp(f.x, 110, W - 110), by = f.y - 124 * k - 30, msg = f.coop ? 'Splash with me!' : 'Ribbit!';
        rrect(bx - 84, by - 18, 168, 36, 16, '#ffffff', OL, 2.5);
        ctx.fillStyle = '#ffffff'; tri(f.x - 8, by + 16, f.x + 8, by + 16, f.x, by + 30);
        text(msg, bx, by, 17, '#2f8a3a', 'center', 800);
      }
      ctx.restore();
      // Fergus's stomp job card
      const j = g.job;
      if (j) {
        panel(12, 64, 330, 78, 18);
        drawCritterPortrait('Fergus the Frog', 20, 72, 62, 62);
        text(j.done ? 'Ribbit! You did it!' : 'Fergus says: stomp', 94, 86, 15, '#8a5aa0', 'left', 700);
        if (!j.done) {
          const big = j.size === 'big';
          text(String(j.n), 96, 117, 28, '#5a2a6e', 'left', 800);
          if (big) outlined('BIG', 124, 116, 34, '#ff5f7e', 'left', '#fff'); else text('small', 126, 120, 17, '#3a8ad0', 'left', 800);
          for (let i = 0; i < j.n; i++) {
            const x = 214 + i * 30, on = i < j.got;
            inkEllipse(x, 117, big ? 13 : 8, big ? 7 : 4.5, 0, on ? '#6aaef0' : '#ffffff', 1.2, on ? OL : '#bbb0cc');
            if (on) star(x, 104, 6, '#ffd23a', 5);
          }
        } else for (let i = 0; i < 5; i++) star(110 + i * 40, 118, 10, PG_RAINBOW[i], 5);
      }
    },
  };

  // --- Opposite Machine: Fergus's rainy-day contraption. Fergus calls a word ("COLD!") and the child
  // works the right station's control (pump, dial, crank, slider, lever, hold buttons) to turn its
  // thing into the OPPOSITE (make the kettle HOT). Every thing starts in the middle, so both ways are possible.
  const OM_WIN_Y = 160, OM_WIN_H = 180;
  const omHoldBtn = (x, y, icon, label, on) => {
    inkCircle(x, y + (on ? 2 : 0), 27, on ? '#fff6a8' : '#ffffff', 2);
    emoji(icon, x, y + (on ? 2 : 0), 26);
    text(label, x, y + 38, 13, '#ffffff', 'center', 800);
  };
  const OM_ITEMS = {
    balloon: { name: 'balloon', lo: 'small', hi: 'big', ctrl: 'pump',
      draw(s, cx, t) {
        const v = s.v, r = lerp(16, 70, v), by = 322 - r - 8;
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, by + r); ctx.quadraticCurveTo(cx + 8, 330, cx, 342); ctx.stroke();
        ctx.fillStyle = '#ff5f7e'; tri(cx - 6, by + r + 6, cx + 6, by + r + 6, cx, by + r - 2);
        inkEllipse(cx + Math.sin(t * 2) * 3 * v, by, r * 0.9, r, Math.sin(t * 1.5) * 0.06, '#ff5f7e', 2);
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(cx - r * 0.35, by - r * 0.4, r * 0.18, r * 0.3, -0.4);
        if (v < 0.3) { ctx.strokeStyle = 'rgba(120,20,50,.5)'; ctx.lineWidth = 1.5; for (const k of [-0.3, 0.2]) { ctx.beginPath(); ctx.moveTo(cx + k * r, by - r * 0.6); ctx.lineTo(cx + k * r + 4, by + r * 0.5); ctx.stroke(); } }
        if (s.blow > 0) for (let i = 0; i < 3; i++) { const k = (t * 3 + i / 3) % 1; ctx.globalAlpha = 1 - k; emoji('💨', cx + r + 10 + k * 30, by + r * 0.6, 16); ctx.globalAlpha = 1; }
      },
      ctrlDraw(s, cx, t) {
        const hy = 392 + s.handle;
        inkRect(cx - 70, 404, 34, 62, '#4fa8e0', 2, 6);
        ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 53, hy); ctx.lineTo(cx - 53, 406); ctx.stroke();
        inkRect(cx - 88, hy - 8, 70, 14, '#ffd23a', 2, 7);
        ctx.strokeStyle = '#5b3f73'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 36, 450); ctx.quadraticCurveTo(cx, 452, cx, 342); ctx.stroke();
        text('pump ⇩', cx - 53, 474, 13, '#ffffff', 'center', 800);
        omHoldBtn(cx + 58, 424, '💨', 'let air out', s.hold < 0);
      },
      hit(s, cx, x, y) {
        if (Math.hypot(x - (cx + 58), y - 424) < 34) return 'hold-';
        if (x > cx - 96 && x < cx - 10 && y > 370 && y < 470) return 'pumpH';
        return null;
      } },
    kettle: { name: 'kettle', lo: 'cold', hi: 'hot', ctrl: 'dial',
      draw(s, cx, t) {
        const v = s.v, hot = clamp((v - 0.5) * 2, 0, 1), cold = clamp((0.5 - v) * 2, 0, 1);
        inkRect(cx - 80, 318, 160, 16, '#5a5a7a', 2, 4);
        if (hot > 0) for (let i = -2; i <= 2; i++) {
          const fh = (14 + hot * 26) * (1 + Math.sin(t * 18 + i * 2) * 0.15);
          ctx.fillStyle = '#ff8a3a'; ellipse(cx + i * 14, 318 - fh / 2, 6 + hot * 3, fh / 2);
          ctx.fillStyle = '#ffe36b'; ellipse(cx + i * 14, 318 - fh / 3, 3 + hot, fh / 3);
        }
        const col = mix(mix('#9fd8ff', '#c8c8d8', clamp(v * 2, 0, 1)), '#ff6a4a', hot);
        ink(P2(`M${cx - 56},${300} C${cx - 64},${240} ${cx + 64},${240} ${cx + 56},${300} Z`), col, 2);
        ink(P2(`M${cx + 50},${276} L${cx + 84},${250} L${cx + 88},${258} L${cx + 58},${290} Z`), col, 2);
        ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, 250, 34, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        inkCircle(cx, 244, 7, '#ffd23a', 1.5);
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(cx - 28, 272, 6, 14, 0.3);
        // eyes on the kettle: sweaty when hot, shivery when cold
        const sh = cold * Math.sin(t * 40) * 2;
        ctx.fillStyle = OL; circle(cx - 14 + sh, 280, 3); circle(cx + 14 + sh, 280, 3);
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); if (cold > 0.3) { ctx.moveTo(cx - 8 + sh, 290); for (let i = 1; i <= 4; i++) ctx.lineTo(cx - 8 + sh + i * 4, 290 + (i % 2 ? -3 : 0)); } else ctx.arc(cx, 286, 6, 0.3, Math.PI - 0.3); ctx.stroke();
        if (hot > 0.2) for (let i = 0; i < 4; i++) { const k = (t * 0.9 + i / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k) * hot})`; circle(cx + 90 + Math.sin(k * 6 + i) * 8, 244 - k * 70, 8 + k * 14); }
        if (cold > 0.2) {
          ctx.globalAlpha = cold;
          for (const [dx, dy] of [[-70, 300], [66, 304], [-40, 312]]) { inkRect(cx + dx - 11, dy - 11, 22, 20, '#dff4ff', 1.5, 5); ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + dx - 6, dy - 7, 5, 4); }
          for (let i = 0; i < 5; i++) star(cx - 80 + i * 40, 180 + ((t * 30 + i * 37) % 120), 6, '#ffffff', 6);
          ctx.fillStyle = '#e8f8ff'; for (let i = 0; i < 5; i++) tri(cx - 40 + i * 20, 300, cx - 34 + i * 20, 300, cx - 37 + i * 20, 312 + (i % 2) * 6);
          ctx.globalAlpha = 1;
        }
      },
      ctrlDraw(s, cx) {
        emoji('❄️', cx - 68, 426, 26); emoji('🔥', cx + 68, 426, 26);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
        for (let i = 0; i <= 8; i++) { const a = -2.1 + i * 4.2 / 8 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 38, 430 + Math.sin(a) * 38); ctx.lineTo(cx + Math.cos(a) * 44, 430 + Math.sin(a) * 44); ctx.stroke(); }
        inkCircle(cx, 430, 32, '#f4f0ff', 2.5);
        const a = (s.v - 0.5) * 4.2 - Math.PI / 2;
        ctx.strokeStyle = '#e2507e'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, 430); ctx.lineTo(cx + Math.cos(a) * 26, 430 + Math.sin(a) * 26); ctx.stroke();
        inkCircle(cx, 430, 8, '#e2507e', 1.5);
        text('turn the dial', cx, 474, 13, '#ffffff', 'center', 800);
      },
      hit(s, cx, x, y) { return Math.hypot(x - cx, y - 430) < 50 ? 'dial' : null; } },
    kite: { name: 'kite', lo: 'down', hi: 'up', ctrl: 'crank',
      draw(s, cx, t) {
        const v = s.v, ky = lerp(316, 196, v), kx = cx + Math.sin(t * 1.7) * 18 * v, rot = v < 0.08 ? 1.3 : Math.sin(t * 2) * 0.15 * v;
        inkRect(cx - 110, 322, 220, 20, '#6cc46a', 1.5, 2);
        ctx.strokeStyle = 'rgba(91,63,115,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(kx, ky + 30); ctx.quadraticCurveTo(cx + 40, 330, cx, 344); ctx.stroke();
        for (let i = 0; i < 4; i++) { const tx = kx + Math.sin(t * 4 + i) * 6 * v - (v < 0.08 ? i * 14 : 0), ty = ky + 34 + i * 14 * (v < 0.08 ? 0.1 : 1); ctx.fillStyle = PG_RAINBOW[i]; tri(tx - 6, ty - 4, tx + 6, ty - 4, tx, ty + 4); }
        ctx.save(); ctx.translate(kx, ky); ctx.rotate(rot);
        ink(P2('M0,-34 L26,0 L0,34 L-26,0 Z'), '#ffd23a', 2);
        ctx.save(); ctx.clip(P2('M0,-34 L26,0 L0,34 L-26,0 Z')); ctx.fillStyle = '#ff6fb5'; ctx.fillRect(0, -34, 26, 34); ctx.fillRect(-26, 0, 26, 34); ctx.restore();
        ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, 34); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.stroke();
        ctx.restore();
        if (v > 0.7) { emoji('🐦', cx - 70 + Math.sin(t) * 10, 200, 20); }
      },
      ctrlDraw(s, cx) {
        inkCircle(cx, 428, 30, '#c98a4a', 2.5);
        ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, 428, 10 + i * 7, 0, Math.PI * 2); ctx.stroke(); }
        const a = s.crank, kx = cx + Math.cos(a) * 30, ky = 428 + Math.sin(a) * 30;
        ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, 428); ctx.lineTo(kx, ky); ctx.stroke();
        inkCircle(kx, ky, 11, '#ff6fb5', 2);
        text('↻ up', cx + 64, 412, 15, '#ffffff', 'center', 800); text('↺ down', cx - 64, 412, 15, '#ffffff', 'center', 800);
        text('wind the reel', cx, 474, 13, '#ffffff', 'center', 800);
      },
      hit(s, cx, x, y) { return Math.hypot(x - cx, y - 428) < 56 ? 'crank' : null; } },
    umbrella: { name: 'umbrella', lo: 'closed', hi: 'open', ctrl: 'slide',
      draw(s, cx, t) {
        const v = s.v;
        for (let i = 0; i < 14; i++) { const x = cx - 100 + i * 15, y = 166 + ((t * 300 + i * 47) % 170); const under = Math.abs(x - cx) < 74 * v && y > 214; if (!under) { ctx.strokeStyle = 'rgba(70,110,200,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 10); ctx.stroke(); } }
        // a duckling under it: dry and happy when it's open, soggy when it's closed
        const wet = 1 - v;
        inkEllipse(cx, 318, 24, 18, 0, mix('#ffe36b', '#d8c070', wet * 0.6), 2); inkCircle(cx + 8, 294, 14, mix('#ffe36b', '#d8c070', wet * 0.6), 2);
        ctx.fillStyle = '#ff8a3a'; tri(cx + 20, 292, cx + 32, 296, cx + 20, 299);
        ctx.fillStyle = OL; circle(cx + 12, 290, 2.2);
        if (wet > 0.5) { ctx.fillStyle = '#7fc0ff'; for (let i = 0; i < 3; i++) ellipse(cx - 14 + i * 14, 334 + ((t * 40 + i * 9) % 10), 2.5, 4); text('brr!', cx - 40, 286, 15, '#3a6ab0', 'center', 800); }
        else if (v > 0.9) text('♪', cx - 34, 286 + Math.sin(t * 4) * 3, 18, '#ff6fb5', 'center', 800);
        ctx.save(); ctx.translate(cx, 222); ctx.scale(lerp(0.12, 1, v), lerp(1.25, 1, v)); umbrella(0, 0, 74, '#9c6cff', 0, '#ffe36b'); ctx.restore();
      },
      ctrlDraw(s, cx) {
        emoji('🌂', cx - 100 + 14, 404, 24); emoji('☂️', cx + 100 - 14, 404, 24);
        rrect(cx - 82, 424, 164, 14, 7, 'rgba(255,255,255,.55)', OL, 2);
        const kx = lerp(cx - 76, cx + 76, s.v);
        inkRect(kx - 16, 414, 32, 34, '#ffd23a', 2, 9);
        text('slide', cx, 474, 13, '#ffffff', 'center', 800);
      },
      hit(s, cx, x, y) { return Math.abs(x - cx) < 104 && y > 396 && y < 462 ? 'slide' : null; } },
    cloud: { name: 'cloud', lo: 'sad', hi: 'happy', ctrl: 'lever',
      draw(s, cx, t) {
        const v = s.v, m = lerp(-1, 1, v);
        if (v > 0.6) { ctx.globalAlpha = (v - 0.6) * 2.5; PG_RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, 336, 100 - i * 6, Math.PI, 0); ctx.stroke(); }); ctx.globalAlpha = 1; }
        const col = mix('#8a94b8', '#f4f6ff', v);
        leafBlob([[cx - 50, 262, 30], [cx - 18, 240, 38], [cx + 24, 244, 36], [cx + 54, 264, 28], [cx, 274, 36]], col, '#4a4278');
        const ey = 252, br = m * 5;
        ctx.fillStyle = OL; ellipse(cx - 18, ey, 4.5, 6); ellipse(cx + 18, ey, 4.5, 6);
        ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 28, ey - 14 + br); ctx.lineTo(cx - 10, ey - 14 - br); ctx.moveTo(cx + 28, ey - 14 + br); ctx.lineTo(cx + 10, ey - 14 - br); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 22, 278); ctx.quadraticCurveTo(cx, 278 + m * 20, cx + 22, 278); ctx.stroke();
        if (v > 0.6) { ctx.fillStyle = 'rgba(255,120,170,.55)'; ellipse(cx - 32, 270, 8, 5); ellipse(cx + 32, 270, 8, 5); }
        if (v < 0.4) for (let i = 0; i < 6; i++) { ctx.fillStyle = '#6aaef0'; ellipse(cx - 40 + i * 16, 300 + ((t * 120 + i * 23) % 40), 2.5, 5); }
        if (v < 0.25) { ctx.fillStyle = '#9fd8ff'; ellipse(cx - 20, ey + 12 + ((t * 30) % 14), 3, 5); }
      },
      ctrlDraw(s, cx) {
        emoji('😢', cx - 52, 456, 26); emoji('😀', cx + 52, 398, 26);
        rrect(cx - 8, 382, 16, 88, 8, 'rgba(255,255,255,.55)', OL, 2);
        const ky = lerp(458, 394, s.v);
        inkCircle(cx, ky, 16, '#ff6fb5', 2); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(cx - 5, ky - 5, 5);
        text('lever', cx + 48, 448, 13, '#ffffff', 'center', 800);
      },
      hit(s, cx, x, y) { return Math.abs(x - cx) < 40 && y > 372 && y < 478 ? 'lever' : null; } },
    bucket: { name: 'bucket', lo: 'empty', hi: 'full', ctrl: 'hold',
      draw(s, cx, t) {
        const v = s.v;
        ctx.save(); ctx.translate(cx + 10, 326); ctx.rotate(-s.tip * 0.7);
        const body = P2('M-48,-90 L48,-90 L38,0 L-38,0 Z');
        ink(body, '#ffffff', 2);
        ctx.save(); ctx.clip(body); ctx.fillStyle = '#5aa8ff'; ctx.fillRect(-60, -90 * v, 120, 100); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-60, -90 * v, 120, 4); ctx.restore();
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(body);
        ctx.fillStyle = '#ff9a3a'; ctx.fillRect(-46, -70, 92, 7);
        ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -90, 46, Math.PI, 0); ctx.stroke();
        ctx.restore();
        inkRect(cx - 110, 176, 76, 14, '#b8c4d8', 2, 4); inkRect(cx - 42, 186, 14, 18, '#b8c4d8', 2, 3);
        if (s.hold > 0) { ctx.fillStyle = 'rgba(90,168,255,.85)'; ctx.fillRect(cx - 39, 204, 8, Math.max(6, 326 - 90 * v - 204)); }
        if (s.hold < 0 && v > 0.03) for (let i = 0; i < 5; i++) { ctx.fillStyle = '#5aa8ff'; ellipse(cx + 70 + i * 4, 270 + ((t * 200 + i * 17) % 60), 4, 6); }
      },
      ctrlDraw(s, cx) { omHoldBtn(cx - 54, 424, '🚰', 'fill', s.hold > 0); omHoldBtn(cx + 54, 424, '💦', 'tip out', s.hold < 0); },
      hit(s, cx, x, y) { if (Math.hypot(x - (cx - 54), y - 424) < 34) return 'hold+'; if (Math.hypot(x - (cx + 54), y - 424) < 34) return 'hold-'; return null; } },
    teddy: { name: 'teddy', lo: 'dry', hi: 'wet', ctrl: 'hold',
      draw(s, cx, t) {
        const v = s.v, col = mix('#d8a070', '#8a6040', v), sw = Math.sin(t * 2) * 0.05;
        if (v < 0.4) { ctx.globalAlpha = 0.9 - v * 2; inkCircle(cx + 84, 188, 18, '#ffd23a', 1.5); ctx.globalAlpha = 1; }
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 110, 186); ctx.quadraticCurveTo(cx, 200, cx + 110, 186); ctx.stroke();
        ctx.save(); ctx.translate(cx, 196); ctx.rotate(sw);
        inkRect(-24, -12, 10, 22, '#ff6fb5', 1.5, 3); inkRect(14, -12, 10, 22, '#ff6fb5', 1.5, 3);
        const droop = v * 8;
        inkCircle(-30, 12 + droop, 12, col, 2); inkCircle(30, 12 + droop, 12, col, 2);
        inkEllipse(0, 92, 40, 46, 0, col, 2); inkCircle(0, 36, 32, col, 2);
        inkEllipse(0, 46, 12, 9, 0, mix('#f4d8b0', '#b89070', v), 1.5);
        ctx.fillStyle = OL; circle(-11, 30, 3.5); circle(11, 30, 3.5); circle(0, 42, 3.5);
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 48 + v * 6, 6, v > 0.6 ? Math.PI + 0.4 : 0.3, v > 0.6 ? -0.4 : Math.PI - 0.3); ctx.stroke();
        if (v > 0.5) { ctx.fillStyle = '#6aaef0'; for (let i = 0; i < 4; i++) ellipse(-30 + i * 20, 140 + ((t * 70 + i * 13) % 16), 3, 5); }
        else if (v < 0.2) { twinkle(-36, 70, 8, 0.5 + 0.5 * Math.sin(t * 6), '#fff6a8'); twinkle(36, 110, 8, 0.5 + 0.5 * Math.sin(t * 6 + 2), '#fff6a8'); }
        ctx.restore();
        if (s.hold > 0) for (let i = 0; i < 8; i++) { ctx.strokeStyle = 'rgba(70,110,200,.7)'; ctx.lineWidth = 2; const x = cx - 50 + i * 14, y = 170 + ((t * 300 + i * 29) % 160); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 10); ctx.stroke(); }
        if (s.hold < 0) for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; circle(cx - 30 + i * 30, 260 - k * 80, 8 + k * 8); }
      },
      ctrlDraw(s, cx) { omHoldBtn(cx - 54, 424, '🌧️', 'rain', s.hold > 0); omHoldBtn(cx + 54, 424, '☀️', 'sunshine', s.hold < 0); },
      hit(s, cx, x, y) { if (Math.hypot(x - (cx - 54), y - 424) < 34) return 'hold+'; if (Math.hypot(x - (cx + 54), y - 424) < 34) return 'hold-'; return null; } },
  };
  const OM_POOL = [['balloon', 'kettle', 'kite', 'umbrella', 'cloud'], ['balloon', 'kettle', 'kite', 'umbrella', 'cloud', 'bucket'], ['balloon', 'kettle', 'kite', 'umbrella', 'cloud', 'bucket', 'teddy']];
  const OM_COLS = ['#4fa8e0', '#9a6ae0', '#3fbf6a', '#ff9a3a', '#e0508a'];
  MG.oppositemachine = {
    kind: 'learn', title: () => 'The Opposite Machine', icon: () => '⚙️',
    how: () => 'Fergus says a word, like COLD. Find the thing that can be its OPPOSITE and use its pump, dial, crank or lever to make it HOT! Press a number to pick a machine and the arrow keys to work it, or use the mouse.',
    init(g) {
      const pool = OM_POOL[g.tier - 1];
      Object.assign(g, { round: 0, rounds: [5, 6, 7][g.tier - 1], n: g.tier === 1 ? 2 : 3, total: 0, order: shuffle(pool.slice()), grab: null, sel: 0, slide: 1, out: 0, mood: 0, hop: 0 });
      while (g.order.length < g.rounds) g.order.push(...shuffle(pool.slice()));
      this.next(g);
    },
    start(g) { speak(g.say); },
    stX(g, i) { return (g.n === 2 ? [300, 610] : [205, 470, 735])[i] + (g.slide - g.out) * W; },
    next(g) {
      const goal = g.order[g.round], others = shuffle(OM_POOL[g.tier - 1].filter(k => k !== goal)).slice(0, g.n - 1);
      const items = shuffle([goal, ...others]);
      g.st = items.map((k, i) => ({ key: k, it: OM_ITEMS[k], v: 0.5, handle: 0, crank: -Math.PI / 2, hold: 0, tip: 0, back: 0, shake: 0, col: OM_COLS[(g.round + i) % OM_COLS.length], yay: 0 }));
      g.goal = items.indexOf(goal); g.goalEnd = pick(['lo', 'hi']);
      const it = OM_ITEMS[goal];
      g.word = it[g.goalEnd === 'lo' ? 'hi' : 'lo']; g.answer = it[g.goalEnd];
      g.mist = 0; g.state = 'play'; g.slide = 1; g.out = 0; g.grab = null; g.sel = 0;
      g.say = `Make something the OPPOSITE of ${g.word}!`;
      if (g.phase === 'play') speak(g.say);
    },
    arrive(g, s, end) {
      const i = g.st.indexOf(s), word = s.it[end];
      g.grab = null; s.hold = 0;
      if (i === g.goal && end === g.goalEnd) {
        g.total += [1, 0.5, 0.15][Math.min(g.mist, 2)];
        g.state = 'yay'; g.t2 = 3; s.yay = 3; g.hop = 1; SFX.sparkle(); SFX.hit();
        burst(this.stX(g, i), 250, 30, { colors: PG_RAINBOW, spread: 220, up: 140 });
        speak(`${g.word}... ${word}! ${word} is the opposite of ${g.word}!`);
        return;
      }
      g.mist++; s.shake = 0.5; s.back = 1; SFX.miss(); tone(150, 0.25, 'sawtooth', 0.05);
      if (i === g.goal) speak(`That's ${word}. That's the SAME, not the opposite! Try the other way.`);
      else speak(`That made the ${s.it.name} ${word}. What is the opposite of ${g.word}?`);
      floatText(this.stX(g, i), 200, i === g.goal ? 'Same! Try the other way!' : 'Hmm, not that one!', '#ffe0f0', false, 20);
    },
    update(g, dt, id) {
      g.hop = Math.max(0, g.hop - dt * 1.5);
      g.slide = Math.max(0, g.slide - dt * 2.2);
      for (const s of g.st) {
        s.shake = Math.max(0, s.shake - dt); s.yay = Math.max(0, s.yay - dt);
        if (!g.grab || g.grab.s !== s) s.handle = Math.max(0, s.handle - dt * 160);
        if (s.back) { s.v += (0.5 - s.v) * Math.min(1, dt * 5); if (Math.abs(s.v - 0.5) < 0.02) { s.v = 0.5; s.back = 0; } }
        s.tip += ((s.hold < 0 && s.key === 'bucket' ? 1 : 0) - s.tip) * Math.min(1, dt * 6);
        s.blow = s.hold < 0 && s.key === 'balloon' ? 1 : 0;
      }
      if (g.state === 'yay') {
        if ((g.t2 -= dt) < 0.6) g.out = clamp(1 - g.t2 / 0.6, 0, 1);
        if (g.t2 <= 0) { g.round++; if (g.round >= g.rounds) { g.done = true; g.out = 0; } else this.next(g); }
      } else if (g.slide <= 0) {
        // keyboard: number keys pick a machine, arrow keys work it
        const kp = keyPick(g.n);
        if (kp >= 0) { g.sel = kp; SFX.click(); }
        const s = g.st[g.sel];
        const dir = (keys.arrowright || keys.arrowup || keys.d || keys.w ? 1 : 0) - (keys.arrowleft || keys.arrowdown || keys.a || keys.s ? 1 : 0);
        if (dir && !s.back) {
          s.v = clamp(s.v + dir * 0.55 * dt, 0, 1);
          if (s.key === 'kite') s.crank += dir * 0.55 * dt * Math.PI * 2 * 0.9;
          if (s.key === 'balloon' && dir > 0) s.handle = 20 + Math.sin(g.t * 14) * 20;
          s.hold = s.it.ctrl === 'hold' || s.key === 'balloon' ? dir : 0;
        } else if (!g.grab) for (const q of g.st) q.hold = 0;
        // the mouse: grab a control and work it
        if (pointer.clicked && !g.grab) {
          g.st.forEach((q, i) => {
            const c = !q.back && q.it.hit(q, this.stX(g, i), pointer.x, pointer.y);
            if (c) { g.sel = i; g.grab = { s: q, c, x0: pointer.x, y0: pointer.y, v0: q.v, ly: pointer.y, la: Math.atan2(pointer.y - 428, pointer.x - this.stX(g, i)) }; SFX.click(); }
          });
        }
        const gb = g.grab;
        if (gb && !pointer.down) { gb.s.hold = 0; g.grab = null; } else if (gb) {
          const q = gb.s, cx = this.stX(g, g.st.indexOf(q));
          if (gb.c === 'pumpH') { const dy = pointer.y - gb.ly; if (dy > 0 && q.handle < 46) { q.v = clamp(q.v + dy / 260, 0, 1); if (dy > 3) tone(200 + q.v * 300, 0.05, 'triangle', 0.04); } q.handle = clamp(pointer.y - gb.y0, 0, 46); gb.ly = pointer.y; if (q.handle <= 1) gb.y0 = pointer.y; }
          else if (gb.c === 'hold+' || gb.c === 'hold-') { const d = gb.c === 'hold+' ? 1 : -1; q.hold = d; q.v = clamp(q.v + d * 0.42 * dt, 0, 1); }
          else if (gb.c === 'dial') { const a = Math.atan2(pointer.x - cx, -(pointer.y - 430)); q.v = clamp(0.5 + a / 4.2, 0, 1); }
          else if (gb.c === 'crank') { const a = Math.atan2(pointer.y - 428, pointer.x - cx); let da = a - gb.la; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2; gb.la = a; q.crank += da; q.v = clamp(q.v + da / (Math.PI * 2 * 1.5), 0, 1); }
          else if (gb.c === 'slide') q.v = clamp(gb.v0 + (pointer.x - gb.x0) / 152, 0, 1);
          else if (gb.c === 'lever') q.v = clamp(gb.v0 + (gb.y0 - pointer.y) / 64 * 0.5, 0, 1);
        }
        for (const q of g.st) if (!q.back && (q.v <= 0.02 || q.v >= 0.98)) { this.arrive(g, q, q.v >= 0.98 ? 'hi' : 'lo'); break; }
      }
      g.progress = `Round ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      const t = S.t;
      ctx.fillStyle = 'rgba(40,30,70,.25)'; ctx.fillRect(0, 60, W, H);
      // the big copper pipe feeding the machines, with gears turning
      for (const [gx, gy, r, d] of [[40, 150, 34, 1], [920, 150, 30, -1]]) {
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * d * (g.state === 'yay' ? 3 : 0.6));
        const p = new Path2D(); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, rr = i % 2 ? r : r * 0.78; i ? p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : p.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } p.closePath();
        ink(p, '#d0a050', 2); inkCircle(0, 0, r * 0.3, '#8a6a3a', 1.5); ctx.restore();
      }
      inkRect(0, 140, W, 18, '#d08a4a', 2.5, 9);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, 144, W, 4);
      // Fergus's word sign
      const wy = 64;
      panel(270, wy, 420, 72, 20);
      if (g.state === 'yay') {
        text('Opposites!', 480, wy + 16, 15, '#8a5aa0', 'center', 700);
        outlined(`${g.word.toUpperCase()} ↔ ${g.answer.toUpperCase()}`, 480, wy + 46, 32, '#3fbf6a', 'center', '#fff');
      } else {
        text('Make something the OPPOSITE of', 480, wy + 18, 16, '#8a5aa0', 'center', 700);
        outlined(g.word.toUpperCase(), 480, wy + 50, 34, '#ff6fb5', 'center', '#fff');
      }
      // the machines
      g.st.forEach((s, i) => {
        const cx = this.stX(g, i) + (s.shake ? Math.sin(s.shake * 60) * 6 : 0), sel = i === g.sel && g.state !== 'yay';
        if (cx < -150 || cx > W + 150) return;
        ink(P2(`M${cx - 26},146 L${cx + 26},146 L${cx + 14},164 L${cx - 14},164 Z`), '#b8763a', 1.5);
        inkRect(cx - 124, 158, 248, 324, s.col, 3, 22);
        if (sel) { ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(cx - 130, 152, 260, 336, 26); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(cx - 116, 164, 10, 300);
        for (const [bx, by] of [[-112, 170], [112, 170], [-112, 470], [112, 470]]) inkCircle(cx + bx, by, 4, '#ffe36b', 1);
        // the window onto the thing
        ctx.save(); ctx.beginPath(); ctx.roundRect(cx - 110, OM_WIN_Y + 8, 220, OM_WIN_H, 16);
        const wg = ctx.createLinearGradient(0, OM_WIN_Y, 0, OM_WIN_Y + OM_WIN_H); wg.addColorStop(0, '#bfe0ff'); wg.addColorStop(1, '#eef6ff');
        ctx.fillStyle = wg; ctx.fill(); ctx.clip();
        s.it.draw(s, cx, t);
        ctx.restore();
        rrect(cx - 110, OM_WIN_Y + 8, 220, OM_WIN_H, 16, null, OL, 3);
        // the gauge between the two opposite ends
        const gy2 = 356;
        rrect(cx - 92, gy2 - 6, 184, 12, 6, 'rgba(255,255,255,.75)', OL, 2);
        if (g.tier < 3) { text(s.it.lo, cx - 90, gy2 + 16, 13, '#ffffff', 'left', 800); text(s.it.hi, cx + 90, gy2 + 16, 13, '#ffffff', 'right', 800); }
        const nx = lerp(cx - 88, cx + 88, s.v);
        ctx.fillStyle = OL; tri(nx - 7, gy2 - 14, nx + 7, gy2 - 14, nx, gy2 - 2);
        // controls
        s.it.ctrlDraw(s, cx, t);
        inkCircle(cx - 96, 186, 13, sel ? '#fff6a8' : '#ffffff', 1.5);
        text(String(i + 1), cx - 96, 187, 15, '#5a2a6e', 'center', 800);
        if (s.yay) { for (let k = 0; k < 6; k++) twinkle(cx - 100 + k * 40, 180 + Math.sin(t * 5 + k) * 10, 10, 0.5 + 0.5 * Math.sin(t * 8 + k), '#fff6a8'); outlined(s.it[g.goalEnd].toUpperCase() + '!', cx, 210, 30, '#ffe36b', 'center'); }
      });
      // Fergus runs the machine
      const fh = Math.sin(g.hop * Math.PI * 3) * 24 * g.hop;
      drawCritter('Fergus the Frog', g.n === 2 ? 880 : 912, 540 - Math.abs(fh), 0.55, -1);
    },
  };

  restage('puddles', {
    bg: 'puddles_bg',
    games: [['bootstomp', 'shell', {}], ['oppositemachine', 'petal', {}]],
    intro: ['N:Ribbit! Rainy days are the BEST days. That rain cloud is making puddles all over my garden!', 'A:laughing:Then I need my raincoat and my stomping boots!', "N:Little hops for small puddles, BIG jumps for big ones! And hop OVER my snail friends, please!"],
    mid: ['N:Ribbit! Come and see my invention: the OPPOSITE MACHINE! Pumps, dials, cranks and levers!', 'A:excited:Ooh! What does it do?', 'N:I call out a word, like COLD. You work the machine to make something the opposite: a HOT kettle! Ribbit!', 'A:thinking:Cold and hot... big and small... up and down. I can do that!'],
    outro: ['N:Wet, dry, big, small... you know them all! Here, some empty snail shells and rain-soaked petals.', 'A:happy:Thank you, Fergus! Happy splashing!'],
  });

  // =====================================================================================
  // 2. MAYA'S TREEHOUSE: a treehouse up in a huge oak
  // =====================================================================================
  const BARK = '#9a6a48';
  BACKDROPS.treehouse_bg = () => {
    bdSky('#62c2ff', '#fff0d8');
    bdSunburst(110, 150);
    const drift = Math.sin(S.t * 0.15) * 14;
    puff(250 + drift, 96, 0.8); puff(820 - drift, 110, 1);
    bdHills('#b2e6a2', 372, 20, 0.006, 1);
    drawTree(60, 392, 150, 40, 2, 0); drawTree(930, 392, 170, 40, 0, 0); drawTree(700, 396, 120, 40, 1, 0);
    bdHills('#97da84', 410, 12, 0.012, 2.5);
    ctx.fillStyle = '#86d070'; ctx.fillRect(0, 420, W, H - 420);
    ctx.fillStyle = '#7ac464'; for (let i = 0; i < 30; i++) ellipse((i * 211) % W, 450 + (i * 37) % 86, 16, 4);
    // the oak's canopy (back), trunk and long branches
    leafBlob([[250, 140, 46], [320, 108, 52], [400, 92, 50], [480, 86, 54], [560, 92, 52], [640, 108, 50], [710, 140, 46], [300, 180, 48], [660, 180, 48], [380, 150, 56], [580, 150, 56], [480, 140, 60]], '#46a84e');
    ink(P2(`M366,${GY + 8} C410,${GY - 4} 428,${GY - 40} 432,${GY - 120} C436,330 432,240 428,150 L532,150 C528,240 524,330 528,${GY - 120} C532,${GY - 40} 552,${GY - 4} 598,${GY + 8} Z`), BARK, 3);
    ctx.strokeStyle = '#7a4e34'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const [x, y0, y1] of [[448, 180, 300], [470, 320, 440], [505, 200, 360], [516, 380, 450], [455, 360, 420]]) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.bezierCurveTo(x - 6, (y0 + y1) / 2, x + 6, (y0 + y1) / 2, x, y1); ctx.stroke(); }
    inkEllipse(492, 400, 9, 14, 0, '#5a3a2a', 1.5);
    ink(P2('M520,208 C620,196 760,172 896,178 L896,194 C760,192 640,214 524,232 Z'), BARK, 2.5);
    ink(P2('M440,198 C380,180 300,160 210,152 L206,166 C300,176 370,196 438,222 Z'), BARK, 2.5);
    leafBlob([[880, 168, 34], [920, 186, 30], [840, 160, 26], [200, 150, 34], [230, 170, 26], [480, 162, 40], [430, 176, 30], [530, 176, 30]], '#52b85a');
    // fairy lights strung along the branches
    fairyLights(214, 160, 336, 168, 10, 7, S.t);
    // the treehouse: platform, braces, walls, roof and flag
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(346, 272); ctx.lineTo(440, 336); ctx.moveTo(614, 272); ctx.lineTo(522, 336); ctx.stroke();
    ctx.strokeStyle = '#b07848'; ctx.lineWidth = 5; ctx.stroke();
    ink(P2('M346,170 L480,104 L614,170 Z'), '#e8505e', 2.5);
    ctx.strokeStyle = 'rgba(120,20,40,.35)'; ctx.lineWidth = 2;
    for (let k = 1; k < 4; k++) { const y = 104 + k * 16.5, half = (y - 104) * 2.03; ctx.beginPath(); ctx.moveTo(480 - half, y); ctx.lineTo(480 + half, y); ctx.stroke(); }
    inkRect(360, 166, 240, 96, '#f0b070', 2.5, 3);
    ctx.strokeStyle = 'rgba(122,78,52,.4)'; ctx.lineWidth = 1.5; for (let y = 180; y < 262; y += 14) { ctx.beginPath(); ctx.moveTo(362, y); ctx.lineTo(598, y); ctx.stroke(); }
    inkRect(378, 182, 64, 50, '#bfe6ff', 2.5, 6);
    ctx.fillStyle = '#ff8fc8'; ctx.fillRect(380, 184, 16, 46); ctx.fillRect(424, 184, 16, 46);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(410, 184); ctx.lineTo(410, 230); ctx.stroke();
    emoji('🧸', 410, 222, 18);
    ink(P2('M524,262 L524,206 Q524,186 547,186 Q570,186 570,206 L570,262 Z'), '#8a5ad8', 2);
    heart(547, 206, 14, '#ff8fc8'); ctx.fillStyle = '#ffd84a'; circle(562, 236, 3);
    inkRect(456, 190, 56, 24, '#fff8ec', 2, 5); text('CLUB', 484, 202.5, 13, '#c0306a', 'center', 800);
    inkRect(330, 258, 300, 16, '#c98a4a', 2.5, 3);
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 1.5; for (let x = 356; x < 630; x += 26) { ctx.beginPath(); ctx.moveTo(x, 260); ctx.lineTo(x, 272); ctx.stroke(); }
    for (let x = 336; x <= 624; x += 24) inkRect(x - 3, 236, 6, 24, '#d89a5a', 1.2, 2);
    inkRect(330, 232, 300, 7, '#d89a5a', 1.5, 3);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(480, 106); ctx.lineTo(480, 70); ctx.stroke();
    const wv = Math.sin(S.t * 4) * 4;
    ink(P2(`M482,70 Q505,${68 + wv} 530,${78 + wv} Q505,${84 - wv} 482,90 Z`), '#ffd83a', 1.5);
    fairyLights(346, 170, 614, 170, 12, 12, S.t + 1);
    fairyLights(614, 170, 880, 188, 16, 10, S.t + 2);
    // rope ladder, a pulley bucket and the tire swing
    const sway = Math.sin(S.t * 1.3) * 5;
    ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 4;
    for (const dx of [-14, 14]) { ctx.beginPath(); ctx.moveTo(392 + dx, 272); ctx.quadraticCurveTo(392 + dx + sway, 370, 392 + dx + sway * 1.6, GY - 4); ctx.stroke(); }
    for (let y = 296; y < GY - 4; y += 26) { const k = (y - 272) / (GY - 276), sx = sway * 1.6 * k * k + sway * 0.4 * k; inkRect(374 + sx, y - 3, 36, 7, '#a0683a', 1.2, 3); }
    ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(612, 274); ctx.lineTo(612, 316); ctx.stroke();
    ink(P2('M598,316 L626,316 L622,340 L602,340 Z'), '#4fa8e0', 1.5); emoji('🍪', 612, 312, 14);
    const sa = Math.sin(S.t * 1.6) * 0.12;
    ctx.save(); ctx.translate(850, 190); ctx.rotate(sa);
    ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 172); ctx.stroke();
    ctx.lineWidth = 22; ctx.strokeStyle = OL; ctx.beginPath(); ctx.ellipse(0, 200, 34, 30, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 16; ctx.strokeStyle = '#4a4458'; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(0, 200, 34, 30, 0, 3.6, 5.2); ctx.stroke();
    ctx.restore();
    // things on the grass
    drawBush(70, GY + 22, 0, 0); drawBush(240, GY + 30, 0, 2);
    for (let i = 0; i < 12; i++) flower(30 + i * 82 + (i % 3) * 9, 450 + (i % 2) * 26 + (i % 3) * 12, 7, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1.2);
    for (const x of [640, 910]) { inkRect(x - 2, GY + 22, 5, 10, '#fff6e0', 1, 2); inkEllipse(x, GY + 22, 9, 5, 0, '#ff5f6a', 1); }
    ink(P2(`M560,${GY + 34} L600,${GY + 26} L574,${GY + 38} Z`), '#ffffff', 1.2);
    // leaves drifting down and a butterfly
    for (let i = 0; i < 6; i++) {
      const y = 140 + (S.t * 26 + i * 70) % 300, x = 220 + i * 100 + Math.sin(S.t * 1.4 + i) * 24;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(S.t * 2 + i) * 0.8); ink(P2('M-7,0 Q0,-6 7,0 Q0,6 -7,0 Z'), i % 2 ? '#9ad85a' : '#ffb84a', 1); ctx.restore();
    }
    emoji('🦋', 700 + Math.sin(S.t * 0.8) * 60, 300 + Math.sin(S.t * 2.3) * 20, 22);
  };

  // --- Secret Code: a symbol -> letter key spells the club password ---------------------------
  const CODE_SYMS = [['⭐', 'star'], ['❤️', 'heart'], ['🌙', 'moon'], ['🍀', 'clover'], ['⚡', 'lightning bolt'], ['🔷', 'blue diamond'],
    ['🍄', 'mushroom'], ['🐾', 'paw print'], ['🌸', 'flower'], ['🔺', 'red triangle'], ['☁️', 'cloud'], ['🍎', 'apple']];
  const CODE_WORDS = [['CAT', 'SUN', 'DOG', 'HAT', 'PIG', 'BUG', 'FUN', 'HUG', 'JAM'], ['CLUB', 'TREE', 'FROG', 'STAR', 'MOON', 'KITE', 'CAKE', 'NEST'],
    ['MAGIC', 'HONEY', 'PLANE', 'SMILE', 'CANDY', 'LEMON', 'TIGER', 'PIZZA']];
  MG.secretcode = {
    kind: 'learn', title: () => 'Secret Code', icon: () => '🔐',
    how: () => 'The club password is in secret code! Look at each symbol, find it in the key, and click its letter. You can type the letters too.',
    init(g) {
      Object.assign(g, { round: 0, rounds: 3, total: 0, words: shuffle(CODE_WORDS[g.tier - 1]), shake: {} });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const word = g.words[g.round], letters = [...new Set(word)];
      const decoys = shuffle([...'ABCDEFGHIJKLMNOPRSTUWY'].filter(l => !letters.includes(l))).slice(0, [2, 2, 3][g.tier - 1]);
      const keyLetters = shuffle([...letters, ...decoys]), syms = shuffle(CODE_SYMS).slice(0, keyLetters.length);
      const key = keyLetters.map((l, i) => ({ l, s: syms[i] }));
      Object.assign(g, { word, key, pos: 0, miss: 0, slotMiss: 0, state: 'pick', t2: 0, pads: shuffle(keyLetters) });
      g.say = `Crack the code! The first symbol is the ${this.symOf(g, 0)[1]}. Find it in the key.`;
      if (g.phase === 'play') speak(g.say);
    },
    symOf(g, i) { return g.key.find(k => k.l === g.word[i]).s; },
    update(g, dt, id) {
      tickDown(g.shake, dt);
      if (g.state === 'pick') {
        let l = id && id.startsWith('L:') ? id.slice(2) : null;
        if (!l) for (const k of g.pads) if (pressed[k.toLowerCase()]) l = k;
        if (l) {
          if (l === g.word[g.pos]) {
            g.pos++; g.slotMiss = 0; SFX.pick();
            if (g.pos >= g.word.length) {
              g.total += Math.max(0.3, 1 - 0.15 * g.miss); g.state = 'yay'; g.t2 = 2.8; SFX.sparkle();
              burst(W / 2, 270, 30); speak(`${[...g.word].join(', ')}. The password is ${g.word.toLowerCase()}!`);
            }
          } else {
            g.miss++; g.slotMiss++; g.shake[g.pos] = 0.4; SFX.miss();
            const s = this.symOf(g, g.pos);
            speak(`Not ${l}. Find the ${s[1]} in the key, and see which letter is under it.`);
          }
        }
      } else if ((g.t2 -= dt) <= 0) {
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      g.progress = `Password ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      // the key
      const n = g.key.length, kw = 84, kx = W / 2 - (n * kw) / 2;
      panel(kx - 30, 68, n * kw + 60, 124, 20);
      text('🔑 SECRET KEY', W / 2, 84, 15, '#9a6ae0', 'center', 800);
      const cur = g.state === 'pick' ? this.symOf(g, g.pos) : null, help = g.tier === 1 || g.slotMiss > 0;
      g.key.forEach((k, i) => {
        const x = kx + i * kw + kw / 2, lit = help && cur === k.s;
        if (lit) rrect(x - 36, 96, 72, 90, 14, '#fff6a8', '#ffb52a', 3 + Math.sin(S.t * 8));
        else rrect(x - 36, 96, 72, 90, 14, '#f4ecff', '#e2c6f5', 2);
        emoji(k.s[0], x, 122, 34);
        text('=', x, 148, 14, '#b09ac0', 'center', 800);
        text(k.l, x, 168, 26, '#5a2a6e', 'center', 800);
      });
      // the coded password
      const m = g.word.length, sw = 92, sx = W / 2 - (m * sw) / 2;
      darkPanel(sx - 24, 210, m * sw + 48, 170, 22);
      text(g.state === 'yay' ? `Password: ${g.word}!` : 'The secret password is...', W / 2, 232, 17, '#ffe9a0', 'center', 700);
      for (let i = 0; i < m; i++) {
        const x = sx + i * sw + sw / 2 + shakeX(g.shake, i), now = i === g.pos && g.state === 'pick';
        emoji(this.symOf(g, i)[0], x, 282 + (now ? Math.sin(S.t * 6) * 4 : 0), 44);
        rrect(x - 34, 314, 68, 56, 12, i < g.pos ? '#a6f0b8' : now ? '#ffffff' : 'rgba(255,255,255,.55)', now ? '#ffb52a' : OL, now ? 4 : 2);
        if (i < g.pos) text(g.word[i], x, 343, 34, '#2a6a3a', 'center', 800);
        else if (now) text('?', x, 343, 30, '#c0a0d0', 'center', 800);
      }
      // letter pads
      const pw = 84, gap = 12, px = W / 2 - (g.pads.length * pw + (g.pads.length - 1) * gap) / 2;
      g.pads.forEach((l, i) => button(`L:${l}`, px + i * (pw + gap), 400, pw, 76, l, { color: CARD_COLS[i % CARD_COLS.length], size: 36, on: g.state === 'pick' }));
    },
  };

  // --- Treehouse Builder: measure and saw a board, hoist it on the pulley, hammer in the nails ----
  // the ruler: 0 at X0, U px per unit. The plank lies on the bench (PY), the ruler is on the bench's front (RY).
  const TB = { X0: 70, U: 40, PY: 336, PH: 32, RY: 372, RH: 44, BX: 582, PX: 538, WX: 560, WY: 104, WR: 22, BY0: 474, BY1: 286, HY0: 330, HY1: 470, HX0: 652, HX1: 870, WT: 168, WB: 286, APEX: 96 };
  const tbX = u => TB.X0 + u * TB.U;
  const TB_WOOD = ['#eab47a', '#f2c890', '#dea468'];
  // a wooden board with grain, a knot and a highlight
  function tbPlank(x, y, w, h, col = '#eab47a', seed = 0) {
    inkRect(x, y, w, h, col, 2.5, 4);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 1.5, y + 1.5, w - 3, h - 3); ctx.clip();
    ctx.strokeStyle = mix(col, '#7a4e34', 0.35); ctx.lineWidth = 1.5;
    if (w >= h) {
      for (let k = 1; k < 3; k++) { const yy = y + h * k / 3; ctx.beginPath(); ctx.moveTo(x, yy); for (let xx = x; xx <= x + w + 20; xx += 20) ctx.lineTo(xx, yy + Math.sin(xx * 0.05 + seed * 2 + k) * h * 0.06); ctx.stroke(); }
      if (w > 70) { ctx.fillStyle = mix(col, '#7a4e34', 0.45); ellipse(x + w * (0.25 + ((seed * 0.37) % 0.5)), y + h * 0.55, 5, 3); }
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x + 3, y + 3, w - 6, 3);
    } else {
      for (let k = 1; k < 3; k++) { const xx = x + w * k / 3; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x + 3, y + 3, 3, h - 6);
    }
    ctx.restore();
  }
  // a nail poking out of the wall at (x, y); rem = how much still sticks out (0 = flat)
  function tbNail(x, y, rem) {
    const hx = x - rem * 9, hy = y - rem * 22;
    if (rem > 0.02) {
      ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = '#c4c8d4'; ctx.lineWidth = 4.5; ctx.stroke();
      ctx.fillStyle = 'rgba(60,30,40,.25)'; ellipse(x + 2, y + 2, 5, 3);
    }
    inkEllipse(hx, hy, 7 + rem * 4, 5 + rem * 2.5, -0.3, rem > 0.02 ? '#e2e6ee' : '#a8aebc', 1.3);
    ctx.fillStyle = '#ffffff'; circle(hx - 2, hy - 1.5, 1.6);
  }
  // a hammer whose striking face is at (x, y); raise lifts it back on its swing
  function tbHammer(x, y, raise) {
    ctx.save(); ctx.translate(x + 34, y + 62); ctx.rotate(raise); ctx.translate(-34, -62);
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(20, 2); ctx.lineTo(36, 66); ctx.stroke();
    ctx.strokeStyle = '#d0904e'; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = '#e85a6a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(31, 46); ctx.lineTo(36, 66); ctx.stroke();
    ink(P2('M0,-11 L30,-11 C38,-11 42,-6 46,-14 L50,-12 C46,0 42,10 30,10 L0,10 Z'), '#8a92a6', 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(3, -8, 24, 4);
    inkRect(-2, -12, 7, 24, '#6a7286', 1.5, 2);
    ctx.restore();
  }
  // a hand saw whose teeth touch (x, y); k slides it back and forth
  function tbSaw(x, y, k = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5); ctx.translate(k, 0);
    ink(P2('M-8,0 L100,0 L100,-34 L-8,-14 Z'), '#e4eaf2', 1.5);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, 0);
    for (let i = -8; i < 100; i += 6) { ctx.lineTo(i + 3, 5); ctx.lineTo(i + 6, 0); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(90, -22); ctx.stroke();
    ink(P2('M94,-40 C108,-46 132,-44 138,-26 C142,-12 136,6 120,6 L94,6 Z'), '#ff6f7e', 1.6);
    inkEllipse(118, -18, 9, 7, 0, '#fff2e0', 1.2);
    ctx.fillStyle = '#a8aebc'; circle(100, -26, 2.5); circle(100, -6, 2.5);
    ctx.restore();
  }
  // a cheeky squirrel; (x, y) is where its feet are
  function tbSquirrel(x, y, s, dir = 1, t = S.t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    const flick = Math.sin(t * 5) * 0.08;
    ctx.save(); ctx.rotate(flick);
    ink(P2('M-6,-8 C-30,-6 -40,-30 -32,-52 C-26,-68 -4,-72 2,-58 C-12,-58 -20,-46 -16,-34 C-12,-24 -2,-20 4,-16 Z'), '#c8743a', 1.6);
    ctx.fillStyle = '#e09a5a'; ellipse(-24, -40, 6, 12, 0.3);
    ctx.restore();
    const b = new Path2D(); b.ellipse(4, -15, 13, 14, 0, 0, Math.PI * 2); b.moveTo(26, -34); b.arc(16, -34, 10, 0, Math.PI * 2); b.moveTo(18, -40); b.lineTo(14, -52); b.lineTo(10, -41);
    ink(b, '#d8884a', 1.6);
    ctx.fillStyle = '#ffe2c0'; ellipse(8, -12, 7, 9); ellipse(21, -31, 5, 4);
    ctx.fillStyle = OL; circle(19, -36, 2.4); circle(26, -32, 1.8);
    ctx.fillStyle = '#ffffff'; circle(19.8, -36.8, 0.9);
    ctx.fillStyle = '#d8884a'; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(14, -16, 4, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // the pulley bucket; by is the bottom of the bucket
  function tbBucket(x, by) {
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 20, by - 38); ctx.quadraticCurveTo(x, by - 66, x + 20, by - 38); ctx.stroke();
    ctx.strokeStyle = '#a8aebc'; ctx.lineWidth = 2; ctx.stroke();
    ink(P2(`M${x - 22},${by - 40} L${x + 22},${by - 40} L${x + 17},${by} L${x - 17},${by} Z`), '#4fa8e0', 1.5);
    inkRect(x - 24, by - 43, 48, 7, '#7fc4f0', 1.5, 3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 15, by - 32, 5, 26);
    ctx.fillStyle = '#2a78b8'; ctx.fillRect(x - 19, by - 18, 38, 4);
  }
  // the oak, its long branch, grass and far hills
  function tbScene() {
    bdSky('#6cc8ff', '#fff2dc');
    bdSunburst(300, 214);
    const drift = Math.sin(S.t * 0.15) * 14;
    puff(140 + drift, 180, 0.62); puff(420 - drift, 240, 0.5);
    bdHills('#b2e6a2', 400, 16, 0.007, 1);
    drawTree(24, 412, 120, 36, 0, 0);
    // birds gliding and a butterfly over the meadow
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const bx = (S.t * (22 + i * 6) + i * 260) % 640 - 40, by = 150 + i * 34 + Math.sin(S.t * 1.5 + i) * 10, f = Math.sin(S.t * 8 + i * 2) * 5;
      ctx.beginPath(); ctx.moveTo(bx - 10, by - f); ctx.quadraticCurveTo(bx - 5, by - 6, bx, by); ctx.quadraticCurveTo(bx + 5, by - 6, bx + 10, by - f); ctx.stroke();
    }
    emoji('🦋', 230 + Math.sin(S.t * 0.7) * 90, 280 + Math.sin(S.t * 2.1) * 18, 22);
    bdHills('#97da84', 428, 9, 0.012, 2.5);
    ctx.fillStyle = '#86d070'; ctx.fillRect(0, 446, W, H - 446);
    ctx.fillStyle = '#7ac464'; for (let i = 0; i < 26; i++) ellipse((i * 211) % W, 460 + (i * 37) % 76, 16, 4);
    for (let i = 0; i < 9; i++) flower(30 + i * 108 + (i % 3) * 11, 470 + (i % 2) * 34 + (i % 3) * 10, 7, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1.2);
    // the big oak trunk on the right, with roots, and its long branch to the pulley
    ink(P2(`M868,${GY + 26} C900,${GY + 6} 902,${GY - 40} 904,380 C906,280 900,170 904,40 L970,40 L970,${GY + 26} Z`), BARK, 3);
    ctx.strokeStyle = '#7a4e34'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const [x, y0, y1] of [[922, 120, 250], [936, 300, 420], [918, 330, 400], [946, 160, 260]]) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.bezierCurveTo(x - 6, (y0 + y1) / 2, x + 6, (y0 + y1) / 2, x, y1); ctx.stroke(); }
    inkEllipse(934, 220, 8, 13, 0, '#5a3a2a', 1.5);
    ink(P2('M908,60 C820,60 700,64 520,70 C510,72 510,84 520,84 C700,82 820,80 906,96 Z'), BARK, 2.5);
    ctx.strokeStyle = 'rgba(122,78,52,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(560, 77); ctx.lineTo(860, 72); ctx.stroke();
    leafBlob([[926, 46, 46], [880, 64, 30], [954, 96, 30], [790, 70, 18], [652, 72, 16], [528, 74, 15]], '#4cae52');
  }
  const tbSlot = (g, i) => {
    const n = g.rounds - 1, bh = (TB.WB - TB.WT) / n;
    return i < n ? { roof: false, x0: TB.HX0, x1: TB.HX1, y0: TB.WB - (i + 1) * bh, y1: TB.WB - i * bh } : { roof: true };
  };
  const tbRoofPath = () => P2(`M${TB.HX0 - 24},${TB.WT + 2} L${(TB.HX0 + TB.HX1) / 2},${TB.APEX} L${TB.HX1 + 24},${TB.WT + 2} Z`);
  function tbNailSpots(g, i) {
    const n = [2, 3, 4][g.tier - 1], s = tbSlot(g, i), mx = (TB.HX0 + TB.HX1) / 2;
    if (s.roof) return [...Array(n)].map((_, k) => [mx + (k - (n - 1) / 2) * (n > 3 ? 46 : 56), 146]);
    return [...Array(n)].map((_, k) => [TB.HX0 + 26 + (k + 0.5) * (TB.HX1 - TB.HX0 - 52) / n, (s.y0 + s.y1) / 2 + 2]);
  }
  // one finished (or being-nailed) part of the treehouse
  function tbPart(g, i, nails) {
    const s = tbSlot(g, i);
    if (s.roof) {
      const rp = tbRoofPath();
      ink(rp, '#e8505e', 2.5);
      ctx.save(); ctx.clip(rp); ctx.strokeStyle = 'rgba(120,20,40,.35)'; ctx.lineWidth = 2;
      for (let y = TB.APEX + 18; y < TB.WT; y += 16) { ctx.beginPath(); ctx.moveTo(TB.HX0 - 30, y); ctx.lineTo(TB.HX1 + 30, y); ctx.stroke(); for (let x = TB.HX0 - 30 + ((y / 16) % 2) * 14; x < TB.HX1 + 30; x += 28) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke(); } }
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.3)'; tri(TB.HX0 - 6, TB.WT - 4, (TB.HX0 + TB.HX1) / 2, TB.APEX + 8, (TB.HX0 + TB.HX1) / 2 - 10, TB.APEX + 18);
    } else {
      tbPlank(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0, TB_WOOD[i % 3], i + 1);
      const my = (s.y0 + s.y1) / 2, h = s.y1 - s.y0;
      if (i === g.rounds - 2 && nails === null) {   // the top wall board gets a round window with the club teddy
        inkCircle(TB.HX0 + 64, my, h * 0.36, '#bfe6ff', 1.5); ctx.fillStyle = '#ff8fc8'; ellipse(TB.HX0 + 64 - h * 0.2, my, h * 0.12, h * 0.3);
        emoji('🧸', TB.HX0 + 70, my + 2, h * 0.42);
      } else if (i === 0 && nails === null) heart(TB.HX1 - 60, my - h * 0.22, h * 0.5, '#ff8fc8');
      else if (nails === null) flower(TB.HX1 - 60, my, h * 0.18, '#ffd84a', '#ff8fc8', 1.2);
    }
    const spots = tbNailSpots(g, i);
    spots.forEach(([x, y], k) => tbNail(x, y, nails ? 1 - nails[k] : 0));
  }
  function tbHouse(g) {
    const { HX0, HX1, WT, WB } = TB, n = g.rounds - 1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(640, 300); ctx.lineTo(902, 392); ctx.moveTo(790, 300); ctx.lineTo(902, 344); ctx.stroke();
    ctx.strokeStyle = '#b07848'; ctx.lineWidth = 6; ctx.stroke();
    // the open frame: shadowy inside, dashed slots still to build
    ctx.fillStyle = 'rgba(122,78,52,.16)'; ctx.fillRect(HX0, WT, HX1 - HX0, WB - WT);
    const cur = g.round, placed = ['nail', 'done'].includes(g.st);
    for (let i = 0; i <= n; i++) {
      const s = tbSlot(g, i), built = i < g.built, now = i === cur && g.st !== 'finale';
      if (built) { tbPart(g, i, null); continue; }
      if (now && placed) { tbPart(g, i, g.nails.map(nl => nl.d / g.need)); continue; }
      ctx.save(); ctx.setLineDash([9, 7]); ctx.lineWidth = now ? 3.5 + Math.sin(S.t * 6) : 2;
      ctx.strokeStyle = now ? '#ffb52a' : 'rgba(91,63,115,.45)';
      if (s.roof) { ctx.fillStyle = now ? 'rgba(255,240,150,.35)' : 'rgba(255,255,255,.2)'; ctx.fill(tbRoofPath()); ctx.stroke(tbRoofPath()); }
      else { ctx.fillStyle = now ? 'rgba(255,240,150,.4)' : 'rgba(255,255,255,.18)'; ctx.fillRect(s.x0 + 4, s.y0 + 3, s.x1 - s.x0 - 8, s.y1 - s.y0 - 6); ctx.strokeRect(s.x0 + 4, s.y0 + 3, s.x1 - s.x0 - 8, s.y1 - s.y0 - 6); }
      ctx.restore();
      if (now && ['measure', 'saw', 'drop', 'lift'].includes(g.st)) {   // a tag with the length this part needs
        const ty = s.roof ? 140 : (s.y0 + s.y1) / 2, tx = (HX0 + HX1) / 2;
        ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx - 16, ty - 22); ctx.lineTo(tx, ty - 32); ctx.lineTo(tx + 16, ty - 22); ctx.stroke();
        inkRect(tx - 30, ty - 20, 60, 36, '#fff6c8', 2, 8);
        text(String(g.L), tx, ty - 1, 24, '#c0306a', 'center', 800);
      }
    }
    // corner posts and the top beam
    inkRect(HX0 - 10, WT - 4, 13, WB - WT + 6, '#b07848', 2.5, 3);
    inkRect(HX1 - 3, WT - 4, 13, WB - WT + 6, '#b07848', 2.5, 3);
    inkRect(HX0 - 14, WT - 8, HX1 - HX0 + 28, 10, '#c98a4a', 2, 3);
    // the platform
    inkRect(598, WB, 316, 16, '#c98a4a', 2.5, 3);
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 1.5; for (let x = 624; x < 910; x += 28) { ctx.beginPath(); ctx.moveTo(x, WB + 2); ctx.lineTo(x, WB + 14); ctx.stroke(); }
    // the finished treehouse gets a flag and fairy lights
    if (g.built >= g.rounds) {
      const mx = (HX0 + HX1) / 2, wv = Math.sin(S.t * 4) * 4;
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx, TB.APEX + 2); ctx.lineTo(mx, 66); ctx.stroke();
      ink(P2(`M${mx + 2},66 Q${mx + 24},${64 + wv} ${mx + 48},${74 + wv} Q${mx + 24},${80 - wv} ${mx + 2},86 Z`), '#ffd83a', 1.5);
      fairyLights(HX0 - 20, WT + 4, mx, TB.APEX + 6, 6, 6, S.t);
      fairyLights(mx, TB.APEX + 6, HX1 + 20, WT + 4, 6, 6, S.t + 1);
    }
  }
  MG.treebuild = {
    kind: 'action', title: () => 'Treehouse Builder', icon: () => '🔨',
    how: () => 'Help Maya build the treehouse! Move the saw to the right number on the ruler and click to cut the board. Pull the rope down to lift it up. Then bonk the nails flat!',
    init(g) {
      const rounds = [3, 3, 4][g.tier - 1];
      const pool = [[2, 3, 4, 5, 6], [3, 4, 5, 6, 7, 8, 9], [3, 4, 5, 6, 7]][g.tier - 1];
      Object.assign(g, {
        rounds, Ls: shuffle(pool).slice(0, rounds), round: 0, built: 0, meas: 0, hits: 0, wild: 0, need: [2, 2, 3][g.tier - 1],
        by: TB.BY0, hy: TB.HY0, lift: 0, grab: false, spin: 0, swing: 0, cool: 0, creak: 0, nails: [], bad: null, sq: { mode: 'branch', t: 0 },
      });
      this.next(g);
    },
    start(g) { speak(g.say); },
    talk(g, s) { g.say = s; if (g.phase === 'play') speak(s); },
    next(g) {
      const L = g.Ls[g.round], a = g.tier === 3 ? Math.min(randInt(1, 3), 10 - L) : 0;
      Object.assign(g, { L, a, u: a + 1, sx: tbX(a + 1), miss: 0, st: 'measure', bad: null, nails: [], lift: 0 });
      const part = g.round === g.rounds - 1 ? 'roof' : 'wall';
      if (g.tier === 3) this.talk(g, `The ${part} needs a board ${L} long. This board starts at ${a} on the ruler, so count ${L} more from there and cut!`);
      else if (g.round === 0) this.talk(g, `The wall needs a board ${L} long. Move the saw to ${L} on the ruler and click to cut!${g.tier === 2 ? ' Not every number is written. Count the lines!' : ''}`);
      else this.talk(g, `Now the ${part} needs a board ${L} long. Where do you cut?`);
    },
    snap(g, x) { return clamp(Math.round((x - TB.X0) / TB.U), g.a + 1, 10); },
    cut(g) {
      const len = g.u - g.a;
      if (len === g.L) {
        g.meas += [1, 0.5, 0.25][g.miss] ?? 0.1;
        Object.assign(g, { st: 'saw', t2: 1.1, bad: null });
        SFX.pick(); this.talk(g, `Yes! ${len} long. Saw it!`);
      } else {
        g.miss++; g.cool = 0.5; g.bad = { u: g.u, t: 2.2 }; SFX.miss();
        floatText(tbX(g.u), g.tier > 1 ? 250 : 266, `${len}`, '#ff6f7e', false, 28);
        this.talk(g, `That would be ${len} long. ${len > g.L ? 'Too long' : 'Too short'}! We need ${g.L}. ${g.a ? `Start counting at ${g.a}, where the board begins.` : 'Count the spaces from zero.'}`);
      }
    },
    pull(g, dt) {
      const before = g.lift;
      if (!pointer.down) g.grab = false;
      else if (!g.grab && Math.abs(pointer.x - TB.PX) < 70 && pointer.y > 150) { g.grab = true; g.gOff = g.hy - pointer.y; }
      if (g.grab) { const ny = clamp(pointer.y + g.gOff, TB.HY0, TB.HY1); if (ny > g.hy) g.lift += ny - g.hy; g.hy = ny; }
      else if (keys.arrowdown || keys.s || keys[' ']) { g.hy += 220 * dt; g.lift += 220 * dt; if (g.hy > TB.HY1) g.hy = TB.HY0; }
      else g.hy = Math.max(TB.HY0, g.hy - 420 * dt);
      const d = g.lift - before;
      g.spin += d / TB.WR;
      if ((g.creak -= d) < 0) { tone(260 + g.lift * 2, 0.05, 'triangle', 0.05); g.creak = 22; }
      g.by = TB.BY0 - g.lift;
      if (g.by <= TB.BY1) {
        Object.assign(g, { by: TB.BY1, st: 'catch', t2: 0.9, grab: false });
        SFX.sparkle(); burst(TB.BX + 20, TB.BY1 - 60, 16);
        const rider = g.sq.mode === 'ride' || g.sq.mode === 'jump';
        this.talk(g, rider ? 'Got it! And the squirrel came too! Silly squirrel!' : 'Got it! Thank you, Aubrey!');
        if (rider) { g.sq = { mode: 'home', t: 0 }; floatText(TB.BX, TB.BY1 - 90, 'Wheee!', '#fff6a8', false, 26); }
      }
    },
    hammer(g) {
      let hit = -1;
      if (g.cool > 0) return;
      if (pointer.clicked && pointer.y > 64) {
        let best = 40;
        g.nails.forEach((nl, k) => { const dd = Math.hypot(pointer.x - nl.x, pointer.y - nl.y + 8); if (nl.d < g.need && dd < best) { best = dd; hit = k; } });
        if (hit < 0) { g.wild++; g.swing = 0.16; g.cool = 0.18; g.whack = [pointer.x, pointer.y]; tone(110, 0.1, 'square', 0.05); floatText(pointer.x, pointer.y - 30, 'Oops!', '#ffffff', false, 20); return; }
      }
      if (hit < 0) for (let k = 0; k < g.nails.length; k++) if (pressed[String(k + 1)] && g.nails[k].d < g.need) hit = k;
      if (hit < 0 && (pressed[' '] || pressed.enter)) hit = g.nails.findIndex(nl => nl.d < g.need);
      if (hit < 0) return;
      const nl = g.nails[hit];
      nl.d++; g.hits++; g.swing = 0.16; g.cool = 0.12; g.whack = [nl.x, nl.y];
      tone(150, 0.08, 'square', 0.07); tone(1300, 0.06, 'triangle', 0.05, 0.01);
      burst(nl.x, nl.y, 6, { colors: ['#ffffff', '#ffe36b'], spread: 90, up: 40, size: [2, 4] });
      if (nl.d >= g.need) {
        const done = g.nails.filter(q => q.d >= g.need).length;
        floatText(nl.x, nl.y - 40, String(done), '#fff6a8', false, 30);
        if (done < g.nails.length) speak(NUM_WORDS[done] + '!');
        else {
          g.built++; g.st = 'done'; g.t2 = 2; SFX.sparkle(); burst((TB.HX0 + TB.HX1) / 2, 200, 26);
          const last = g.built >= g.rounds;
          this.talk(g, `${done} nails! ${last ? 'The roof is on!' : pick(['Hooray! The treehouse is growing!', 'Super strong! Next board!', 'Bonk bonk! Great building!'])}`);
        }
      }
    },
    update(g, dt, id) {
      g.cool = Math.max(0, g.cool - dt); g.swing = Math.max(0, g.swing - dt); g.t2 -= dt;
      if (g.bad && (g.bad.t -= dt) <= 0) g.bad = null;
      const moved = g.lpx !== undefined && (Math.abs(pointer.x - g.lpx) > 0.5 || Math.abs(pointer.y - g.lpy) > 0.5);
      pointerMoved(g);
      if (g.st === 'measure') {
        if (moved && pointer.y > 150 && pointer.x < 520) g.u = this.snap(g, pointer.x);
        if (pressed.arrowleft || pressed.a) g.u--;
        if (pressed.arrowright || pressed.d) g.u++;
        for (let k = 0; k <= 9; k++) if (pressed[String(k)]) g.u = k || 10;
        g.u = clamp(g.u, g.a + 1, 10);
        let cut = pressed[' '] || pressed.enter;
        if (pointer.clicked && pointer.y > 150 && pointer.x < 520) { g.u = this.snap(g, pointer.x); cut = true; }
        if (cut && g.cool <= 0) this.cut(g);
      } else if (g.st === 'saw') {
        if (Math.random() < dt * 14) burst(tbX(g.u), TB.PY + 6, 2, { colors: ['#f2d0a0', '#e0b070'], spread: 60, up: 30, size: [2, 4] });
        if (Math.random() < dt * 6) noise(0.08, 0.03);
        if (g.t2 <= 0) { g.st = 'drop'; g.t2 = 0.75; SFX.jump(); if (g.round === 1) g.sq = { mode: 'jump', t: 0 }; }
      } else if (g.st === 'drop') {
        if (g.t2 <= 0) {
          g.st = 'lift'; g.lift = 0;
          this.talk(g, g.round === 0 ? 'Now the pulley! Pull the rope DOWN, and the board goes UP to me!' : g.round === 1 ? 'Pull the rope down! Hey, a squirrel hopped in for a ride!' : 'Pull the rope down to send it up!');
        }
      } else if (g.st === 'lift') this.pull(g, dt);
      else if (g.st === 'catch') {
        if (g.t2 <= 0) {
          g.st = 'nail'; g.nails = tbNailSpots(g, g.round).map(([x, y]) => ({ x, y, d: 0 }));
          this.talk(g, `Bonk the ${NUM_WORDS[g.nails.length]} nails with the hammer until they are flat!`);
        }
      } else if (g.st === 'nail') this.hammer(g);
      else if (g.st === 'done') {
        if (g.t2 <= 0) {
          g.round++;
          if (g.round < g.rounds) this.next(g);
          else { g.st = 'finale'; g.t2 = 3.2; SFX.fanfare(); this.talk(g, 'We did it! Our treehouse is finished! Measure, saw, pull and bonk. You are a real builder!'); }
        }
      } else if (g.st === 'finale') {
        if (Math.random() < dt * 3) burst(rand(620, 900), rand(100, 260), 12);
        if (g.t2 <= 0) g.done = true;
      }
      // the bucket goes back down for the next board; the rope handle springs back up
      if (g.st !== 'lift') {
        g.grab = false; g.hy = Math.max(TB.HY0, g.hy - 420 * dt);
        if (g.st !== 'catch' && g.by < TB.BY0) { const d = Math.min(TB.BY0 - g.by, 150 * dt); g.by += d; g.spin -= d / TB.WR; }
      }
      g.sq.t += dt;
      if (g.sq.mode === 'jump' && g.sq.t > 0.8) g.sq = { mode: 'ride', t: 0 };
      if (g.sq.mode === 'home' && g.sq.t > 0.9) g.sq = { mode: 'branch', t: 0 };
      g.progress = g.st === 'finale' ? 'All built!' : `Board ${g.round + 1} of ${g.rounds}`;
      g.score = 0.8 * g.meas / g.rounds + 0.2 * (g.hits + g.wild ? g.hits / (g.hits + g.wild) : 1);
    },
    sqPos(g) {
      const home = [736, 70], ride = [TB.BX + 14, g.by - 42], k = clamp(g.sq.t / (g.sq.mode === 'jump' ? 0.8 : 0.9), 0, 1);
      const arc = (a, b) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * 70];
      if (g.sq.mode === 'jump') return [...arc(home, ride), -1];
      if (g.sq.mode === 'ride') return [...ride, -1];
      if (g.sq.mode === 'home') return [...arc([TB.BX + 14, TB.BY1 - 42], home), 1];
      return [...home, Math.sin(S.t * 0.5) > 0 ? 1 : -1];
    },
    draw(g) {
      const { PY, PH, RY, RH, BX, PX, WX, WY, WR } = TB, st = g.st;
      tbScene();
      tbHouse(g);
      drawCritter('Maya', 622, TB.WB + 2, 0.46, st === 'lift' || st === 'catch' ? -1 : 1);
      // the pulley: hook, ropes, wheel, rope handle and the bucket
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(WX, 78); ctx.lineTo(WX, WY); ctx.stroke();
      ctx.lineCap = 'round';
      const rope = (pts, slack) => {
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
        if (slack) ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); else ctx.lineTo(pts[2], pts[3]);
        ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = '#d8b07a'; ctx.lineWidth = 3; ctx.stroke();
      };
      rope([BX, WY, BX, g.by - 64]);
      rope([PX, WY, PX, g.hy]);
      rope([PX, g.hy + 6, PX + 10, g.hy + 90, 524, GY + 18], true);
      inkEllipse(526, GY + 20, 18, 6, 0, '#d8b07a', 1.5);
      inkCircle(WX, WY, WR, '#8a92a6', 2); inkCircle(WX, WY, WR - 7, '#c4c8d4', 1.2);
      ctx.strokeStyle = OL; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { const an = g.spin + k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(WX - Math.cos(an) * 13, WY - Math.sin(an) * 13); ctx.lineTo(WX + Math.cos(an) * 13, WY + Math.sin(an) * 13); ctx.stroke(); }
      inkCircle(WX, WY, 4, '#ffd84a', 1);
      inkRect(PX - 20, g.hy - 7, 40, 14, '#c88a50', 2, 7);
      // the cut board rides up in the bucket
      const boardH = g.L * TB.U * 0.3;
      if (['lift', 'catch'].includes(st) || (st === 'drop' && g.t2 < 0.05)) {
        let bx = BX - 8, byy = g.by - 30 - boardH;
        if (st === 'catch') { const k = clamp(1 - g.t2 / 0.9, 0, 1); bx = lerp(bx, 640, k); byy = lerp(byy, TB.WB - 30 - boardH, k) - Math.sin(k * Math.PI) * 30; }
        tbPlank(bx, byy, 16, boardH, '#eab47a', g.round);
      }
      tbBucket(BX, g.by);
      const [sx, sy, sd] = this.sqPos(g);
      tbSquirrel(sx, sy, 0.62, sd, S.t);
      // the workbench, the plank on it and the ruler on its front
      for (const lx of [92, 446]) { inkRect(lx, 380, 16, GY + 26 - 380, '#a0683a', 2.5, 3); }
      inkRect(100, 448, 352, 10, '#a0683a', 2, 3);
      inkRect(52, 364, 448, 18, '#b07848', 2.5, 4);
      const pend = tbX(10.4), a = g.a, ax = tbX(a), ux = tbX(g.u);
      if (st === 'measure' || st === 'saw') {
        if (st === 'saw' && g.t2 < 0.2) { tbPlank(ax - 6, PY, ux - ax, PH, '#eab47a', g.round); tbPlank(ux + 2, PY, pend - ux - 2, PH, '#eab47a', g.round); }
        else tbPlank(ax, PY, pend - ax, PH, '#eab47a', g.round);
      } else {
        tbPlank(ux + 2, PY, pend - ux - 2, PH, '#eab47a', g.round);   // the leftover end
        if (st === 'drop') {   // the cut piece hops into the bucket
          const k = clamp(1 - g.t2 / 0.75, 0, 1), cx = lerp((ax + ux) / 2, BX, k), cy = lerp(PY + PH / 2, g.by - 30 - boardH / 2, k) - Math.sin(k * Math.PI) * 110;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(-k * Math.PI / 2); const sc = lerp(1, 0.3, k), w = (ux - ax) * sc, h = lerp(PH, 16, k);
          tbPlank(-w / 2, -h / 2, w, h, '#eab47a', g.round); ctx.restore();
        }
      }
      rrect(tbX(0) - 16, RY, 10 * TB.U + 32, RH, 6, '#ffd84a', OL, 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(tbX(0) - 12, RY + 3, 10 * TB.U + 24, 4);
      ctx.strokeStyle = OL; ctx.lineCap = 'butt';
      for (let k = 0; k <= 10; k++) {
        const x = tbX(k);
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, RY); ctx.lineTo(x, RY + 15); ctx.stroke();
        if (k < 10) { ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + TB.U / 2, RY); ctx.lineTo(x + TB.U / 2, RY + 8); ctx.stroke(); }
        if (g.tier !== 2 || k % 2 === 0) text(String(k), x, RY + 29, 19, '#5a3a2a', 'center', 800);
        else { ctx.fillStyle = '#5a3a2a'; circle(x, RY + 29, 2.5); }
      }
      // where the board starts (tier 3 boards don't start at zero)
      if (a > 0 && ['measure', 'saw'].includes(st)) {
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#2a9a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, PY - 8); ctx.lineTo(ax, RY + 16); ctx.stroke(); ctx.restore();
        outlined('start', ax, RY + RH + 13, 15, '#a6f0b8');
      }
      if (st === 'measure') {
        if (g.bad) {
          const bx = tbX(g.bad.u); ctx.globalAlpha = clamp(g.bad.t, 0, 1);
          ctx.strokeStyle = '#ff5f6a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(bx - 8, PY + 8); ctx.lineTo(bx + 8, PY + 24); ctx.moveTo(bx + 8, PY + 8); ctx.lineTo(bx - 8, PY + 24); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        g.sx = lerp(g.sx, ux, 0.35);
        ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#e83a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(g.sx, PY - 4); ctx.lineTo(g.sx, RY + 16); ctx.stroke(); ctx.restore();
        tbSaw(g.sx, PY, 0);
        // a pencil arrow under the saw
        ctx.fillStyle = '#e83a5a'; tri(g.sx, RY + 2, g.sx - 7, RY - 10, g.sx + 7, RY - 10);
        // count bubbles once a cut went wrong
        if (g.miss > 0) for (let i = 1; i <= g.L; i++) { const x = tbX(a + i - 0.5); inkCircle(x, PY - 16, 13, i === g.L ? '#ffd84a' : '#fff6c8', 1.2); text(String(i), x, PY - 15, 15, '#7a3a1a', 'center', 800); }
      } else if (st === 'saw') {
        tbSaw(ux, PY + clamp((1.1 - g.t2) * 30, 0, PH), Math.sin(g.t * 30) * 14);
      }
      // Aubrey works the rope
      const pulling = st === 'lift' && (g.grab || keys.arrowdown || keys.s || keys[' ']);
      drawAubrey(500, GY + 22, st === 'finale' ? 'twirl' : pulling && g.hy > (TB.HY0 + TB.HY1) / 2 ? 'crouch' : 'idle_front', 1, 0, 0.56);
      if (st === 'lift' && !g.grab) {
        const bob = Math.abs(Math.sin(S.t * 5)) * 12;
        outlined('PULL', 494, 222 + bob, 20, '#fff6a8');
        ink(P2(`M484,${238 + bob} L504,${238 + bob} L504,${262 + bob} L516,${262 + bob} L494,${286 + bob} L472,${262 + bob} L484,${262 + bob} Z`), '#ffd84a', 1.5);
      }
      // the hammer
      if (st === 'nail' || st === 'done') {
        const nx = g.nails.find(nl => nl.d < g.need);
        const at = g.swing > 0 && g.whack ? g.whack : g.usePointer ? [pointer.x, pointer.y] : nx ? [nx.x, nx.y] : [760, 200];
        if (st === 'nail' && nx && !g.usePointer) { ctx.strokeStyle = '#ffb52a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(nx.x, nx.y - 6, 22 + Math.sin(S.t * 6) * 2, 0, Math.PI * 2); ctx.stroke(); }
        if (st === 'nail') tbHammer(at[0] - 2, at[1] - 8, g.swing > 0 ? -0.05 : 0.55);
      }
      // Maya's speech bubble
      const lines = wrap(g.say || '', 452, 18, 600), bh = 22 + lines.length * 22;
      ctx.fillStyle = 'rgba(255,248,252,.97)'; tri(452, 66 + bh - 4, 500, 66 + bh - 4, 600, 206);
      panel(20, 66, 490, bh, 18);
      ctx.fillStyle = 'rgba(255,248,252,1)'; tri(452, 66 + bh - 3, 498, 66 + bh - 3, 596, 202);
      lines.forEach((l, i) => text(l, 38, 66 + 22 + i * 22, 18, '#5a2a6e', 'left', 600));
    },
  };

  restage('treehouse', {
    bg: 'treehouse_bg',
    games: [['secretcode', 'ribbon', {}], ['treebuild', 'berry', {}]],
    intro: ['N:Psst! Welcome to the secret treehouse club. To get in, you need the password.', "N:But it's written in secret code! Use the key to crack it.", 'A:focused:I LOVE secret codes.'],
    mid: ["N:You cracked it! Now the club challenge: help me build our new clubhouse room! Every board has to be just the right length.", 'A:determined:I will measure really carefully. Then up they go on the pulley!'],
    outro: ["N:You're in the club! Here's the official club ribbon, and some club berries.", "A:winky:I have a secret too... but I can't tell anyone yet."],
  });

  // =====================================================================================
  // 3. BUZZY BEE MEADOW: flowers, beehives and a giant honeycomb hive in a tree
  // =====================================================================================
  const BEE_BODY = (() => { const p = new Path2D(); p.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2); return p; })();
  function drawBee(x, y, s, dir = 1, t = S.t, wasp = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const flap = Math.sin(t * 46) * 0.35;
    ctx.fillStyle = 'rgba(225,245,255,.85)'; ctx.strokeStyle = 'rgba(91,63,115,.6)'; ctx.lineWidth = 1.5;
    for (const [wx, ang] of [[-4, -0.5 + flap], [6, 0.35 - flap]]) { ctx.beginPath(); ctx.ellipse(wx, -16, 8, 14, ang, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    if (wasp) { ink(P2('M-14,-6 C-26,-10 -36,-4 -40,0 C-36,4 -26,10 -14,6 Z'), '#ff9a2a', 1.5); }
    ink(BEE_BODY, wasp ? '#ff7a3a' : '#ffd23a', 1.5);
    ctx.save(); ctx.clip(BEE_BODY); ctx.fillStyle = '#3a2a3a'; ctx.fillRect(-9, -14, 6, 28); ctx.fillRect(3, -14, 6, 28); if (wasp) ctx.fillRect(-20, -14, 5, 28); ctx.restore();
    ctx.fillStyle = OL; if (wasp) tri(-36, -3, -36, 3, -48, 0); else tri(-17, -3, -17, 3, -25, 0);
    inkCircle(17, -2, 10, wasp ? '#3a2a3a' : '#3a2a3a', 1.5);
    ctx.fillStyle = '#ffffff'; circle(20, -4, 4); ctx.fillStyle = '#1a0a20'; circle(21, -4, 2);
    if (wasp) { ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -12); ctx.lineTo(25, -6); ctx.stroke(); ctx.fillStyle = '#ff3a3a'; circle(21, -4, 2); }
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, -11); ctx.quadraticCurveTo(20, -22, 26, -24); ctx.moveTo(14, -11); ctx.quadraticCurveTo(12, -22, 16, -26); ctx.stroke();
    ctx.restore();
  }
  function drawDragonfly(x, y, s, dir, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const f = Math.sin(t * 50) * 0.3;
    ctx.fillStyle = 'rgba(200,240,255,.8)'; ctx.strokeStyle = 'rgba(42,100,180,.6)'; ctx.lineWidth = 1.5;
    for (const [wx, a] of [[-2, -0.4 + f], [8, -0.2 - f], [-2, 0.4 - f], [8, 0.2 + f]]) { ctx.beginPath(); ctx.ellipse(wx, a < 0 ? -12 : 12, 22, 7, a, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(14, 0); ctx.stroke();
    ctx.strokeStyle = '#2ab0a0'; ctx.lineWidth = 5; ctx.stroke();
    inkCircle(18, 0, 9, '#2ab0a0', 1.5); ctx.fillStyle = '#ffffff'; circle(21, -3, 3.5); ctx.fillStyle = '#1a0a20'; circle(22, -3, 1.8);
    ctx.restore();
  }
  // a honeycomb hive hanging from (x, y)
  const HIVE = P2('M0,0 C58,4 88,60 84,120 C80,178 42,210 0,212 C-42,210 -80,178 -84,120 C-88,60 -58,4 0,0 Z');
  function drawHive(x, y, s, t, glow = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (glow) { ctx.fillStyle = `rgba(255,230,120,${glow})`; circle(0, 110, 130); }
    ink(HIVE, '#ffc83a', 2.5);
    ctx.save(); ctx.clip(HIVE);
    const r = 13, hw = r * Math.sqrt(3);
    for (let row = 0; row < 18; row++) for (let col = -5; col <= 5; col++) {
      const cx = col * hw + (row % 2) * hw / 2, cy = row * r * 1.5;
      const hp = ptsPath(polyPts(6, cx, cy, r - 1.5, Math.PI / 6));
      ctx.fillStyle = (row * 7 + col * 3) % 5 === 0 ? '#ffe27a' : (row + col) % 4 === 0 ? '#ffb020' : '#ffcf4a'; ctx.fill(hp);
      ctx.strokeStyle = '#d88a10'; ctx.lineWidth = 2; ctx.stroke(hp);
    }
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(-36, 70, 16, 50, 0.3);
    ctx.restore();
    inkEllipse(0, 150, 22, 15, 0, '#5a3010', 2);
    const d = (t * 0.5) % 1;
    ctx.fillStyle = '#ffb020'; ellipse(20, 206 + d * 30, 5, 6 + d * 4);
    ctx.restore();
  }
  function boxHive(x, gy, cols) {
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 28, gy); ctx.lineTo(x - 22, gy - 24); ctx.moveTo(x + 28, gy); ctx.lineTo(x + 22, gy - 24); ctx.stroke();
    cols.forEach((c, i) => inkRect(x - 40, gy - 24 - (i + 1) * 34, 80, 34, c, 2.5, 3));
    const top = gy - 24 - cols.length * 34;
    ink(P2(`M${x - 50},${top} L${x},${top - 26} L${x + 50},${top} Z`), '#e8505e', 2);
    inkRect(x - 16, gy - 34, 32, 6, '#3a2a3a', 1, 3);
  }
  function tallFlower(x, gy, h, kind, t) {
    const sw = Math.sin(t * 1.5 + x) * 3, hx = x + sw, hy = gy - h;
    ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x, gy - h / 2, hx, hy); ctx.stroke();
    ink(P2(`M${x},${gy - h * 0.35} q12,-14 22,-6 q-12,10 -22,6 Z`), '#5ac85a', 1);
    if (kind === 0) flower(hx, hy, 14, '#ffffff', '#ffd23a', 1.5);
    else if (kind === 1) { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; inkEllipse(hx + Math.cos(a) * 13, hy + Math.sin(a) * 13, 9, 4.5, a, '#ffd23a', 0.8); } inkCircle(hx, hy, 10, '#8a5a2a', 1.2); }
    else if (kind === 2) ink(P2(`M${hx - 11},${hy - 12} L${hx - 5},${hy - 4} L${hx},${hy - 14} L${hx + 5},${hy - 4} L${hx + 11},${hy - 12} L${hx + 10},${hy + 4} Q${hx},${hy + 12} ${hx - 10},${hy + 4} Z`), '#ff6f9a', 1.5);
    else { for (let i = 0; i < 6; i++) inkCircle(hx + (i % 2 ? 3 : -3), hy + i * 6 - 14, 4.5, '#b07aff', 0.8); }
  }
  const BM_FLOWERS = [[300, 420, 0], [330, 400, 2], [370, 430, 1], [420, 395, 3], [470, 425, 0], [520, 405, 2], [560, 430, 1], [610, 398, 3], [650, 426, 0], [40, 430, 2], [880, 432, 3], [940, 420, 0], [210, 404, 1], [800, 410, 2]];
  BACKDROPS.beemeadow_bg = () => {
    bdSky('#58c4ff', '#f4fbff');
    bdSunburst(420, 120);
    const drift = Math.sin(S.t * 0.15) * 14;
    puff(160 + drift, 100, 0.9); puff(620 - drift, 92, 0.75);
    bdHills('#b8eaa0', 330, 26, 0.006, 0.5);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = ['#ff8fc8', '#ffe36b', '#ffffff', '#c6a2ff'][i % 4]; circle((i * 97) % W, 330 + (i * 31) % 50 + 8, 2.5); }
    bdHills('#9ddc86', 380, 14, 0.011, 2);
    ctx.fillStyle = '#86d070'; ctx.fillRect(0, 400, W, H - 400);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = ['#ff8fc8', '#ffe36b', '#ffffff', '#c6a2ff', '#ff9a5a'][i % 5]; circle((i * 151) % W, 384 + (i * 23) % 40, 3); }
    // the bee tree with its giant hive
    ink(P2(`M840,${GY + 6} C866,${GY - 30} 872,300 868,150 L912,150 C910,300 916,${GY - 30} 948,${GY + 6} Z`), BARK, 3);
    ink(P2('M872,190 C820,176 760,160 700,158 L698,170 C760,174 820,192 872,212 Z'), BARK, 2.5);
    leafBlob([[700, 120, 40], [760, 98, 46], [830, 84, 50], [900, 96, 52], [950, 120, 44], [740, 150, 36], [890, 150, 44], [820, 140, 40]], '#4cb658');
    for (let i = 0; i < 10; i++) { const a = i * 2.4; ctx.fillStyle = i % 2 ? '#ffffff' : '#ff9ac8'; circle(820 + Math.cos(a) * 110, 120 + Math.sin(a) * 40, 4); }
    ctx.strokeStyle = BARK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(780, 168); ctx.lineTo(780, 184); ctx.stroke();
    drawHive(780, 178, 0.62, S.t);
    // wooden bee boxes and the tall flowers
    boxHive(80, GY + 6, ['#ffd1dc', '#fff1a8', '#c8f0c4']); boxHive(170, GY + 2, ['#c4e6ff', '#ffd1dc']);
    for (const [x, y, k] of BM_FLOWERS) tallFlower(x, y + 40, 60 + (x * 7) % 30, k, S.t);
    for (let i = 0; i < 16; i++) flower(20 + i * 62, 488 + (i % 3) * 16, 6, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1);
    ctx.fillStyle = '#5ab84a'; for (let i = 0; i < 12; i++) { const x = 40 + i * 80, y = 520 - (i % 2) * 10; for (let k = 0; k < 3; k++) circle(x + Math.cos(k * 2.1) * 5, y + Math.sin(k * 2.1) * 5, 5); }
    // bees buzzing about (not during the games, so they can't be mistaken for the player)
    if (scene !== 'minigame') for (let i = 0; i < 9; i++) {
      const sp = 0.5 + (i % 4) * 0.13, cx = [120, 260, 400, 560, 760, 800, 330, 640, 90][i], cy = [300, 220, 260, 210, 300, 250, 330, 330, 330][i];
      const x = cx + Math.sin(S.t * sp + i) * 70, y = cy + Math.sin(S.t * sp * 2.3 + i * 2) * 26;
      drawBee(x, y, 0.55, Math.cos(S.t * sp + i) >= 0 ? 1 : -1, S.t + i);
    }
  };

  // --- Nectar Run: collect nectar (carry 3), fly it home; dodge dragonflies and wasps -----------
  const NR_FLOWERS = [[110, 430, '#ff6fae'], [230, 250, '#ffffff'], [330, 420, '#c6a2ff'], [450, 300, '#ff9a5a'], [560, 440, '#ffd23a'], [620, 220, '#ff6fae'], [360, 160, '#7fd0ff'], [700, 360, '#ffffff'], [140, 160, '#ffd23a']];
  const NR_HIVE = [780, 247];
  MG.nectarrun = {
    kind: 'action', title: () => 'Nectar Run', icon: () => '🐝',
    how: () => 'Fly the bee with the arrows or the mouse. Touch flowers to get nectar (up to 3), then fly back to the hive. Keep away from the bugs!',
    init(g) {
      const t = g.tier - 1;
      Object.assign(g, {
        timeLeft: 45, px: 520, py: 300, facing: 1, carry: 0, banked: 0, target: [12, 15, 18][t], inv: 0, flash: 0,
        flowers: NR_FLOWERS.map(([x, y, c]) => ({ x, y, c, full: true, regrow: 0 })),
        foes: [[0, 'fly', 240, 80], [1, 'wasp', 380, 110], [2, 'wasp', 160, 130]].slice(0, t + 1).map(([i, kind, cy, sp]) => ({ kind, cx: 400, cy: cy + i * 40, rx: 300, ry: 60, sp: sp / 300 * [1, 1.1, 1.25][t], ph: i * 2.1, x: 0, y: 0, dir: 1 })),
        say: 'Get the nectar and bring it to the hive!',
      });
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.timeLeft -= dt; g.inv = Math.max(0, g.inv - dt); g.flash = Math.max(0, g.flash - dt);
      steer(g, dt, 260, 40, W - 40, 80, H - 30);
      for (const f of g.flowers) {
        if (!f.full && (f.regrow -= dt) <= 0) f.full = true;
        if (f.full && g.carry < 3 && Math.hypot(g.px - f.x, g.py - f.y) < 44) {
          f.full = false; f.regrow = [5, 6, 7][g.tier - 1]; g.carry++; SFX.pick();
          floatText(f.x, f.y - 40, g.carry === 3 ? 'Full! Go home!' : '+1 nectar', '#fff6a8', false, 20);
        }
      }
      if (g.carry && Math.hypot(g.px - NR_HIVE[0], g.py - NR_HIVE[1]) < 80) {
        g.banked += g.carry; floatText(NR_HIVE[0], NR_HIVE[1] - 70, `+${g.carry} honey!`, '#ffe36b', false, 26);
        burst(NR_HIVE[0], NR_HIVE[1], 20, { colors: ['#ffd23a', '#ffe9a0', '#ffffff'] }); SFX.sparkle(); g.carry = 0; g.flash = 0.5;
        if (g.banked >= g.target) speak('The hive is full of honey! Hooray!');
      }
      for (const e of g.foes) {
        const a = S.t * e.sp * 3 + e.ph, nx = e.cx + Math.sin(a) * e.rx, ny = e.cy + Math.sin(a * 2.2) * e.ry;
        e.dir = nx >= e.x ? 1 : -1; e.x = nx; e.y = ny;
        if (g.inv <= 0 && Math.hypot(g.px - e.x, g.py - e.y) < 38) {
          g.inv = 1.6; SFX.miss();
          if (g.carry) { floatText(g.px, g.py - 40, 'Oops! Dropped it!', '#ffb0c4', false, 22); burst(g.px, g.py, 10, { colors: ['#ffd23a'] }); g.carry = 0; } else floatText(g.px, g.py - 40, 'Bump!', '#ffb0c4', false, 22);
          const d = Math.hypot(g.px - e.x, g.py - e.y) || 1; g.px = clamp(g.px + (g.px - e.x) / d * 50, 40, W - 40); g.py = clamp(g.py + (g.py - e.y) / d * 50, 80, H - 30);
        }
      }
      g.progress = `Honey ${Math.min(g.banked, g.target)} of ${g.target}`;
      g.score = clamp(g.banked / g.target, 0, 1);
      if (g.timeLeft <= 0 || (g.banked >= g.target && g.flash <= 0)) g.done = true;
    },
    draw(g) {
      drawHive(NR_HIVE[0], NR_HIVE[1] - 77, 0.7, S.t, g.carry ? 0.25 + 0.15 * Math.sin(S.t * 6) : 0.1 + g.flash);
      if (g.carry) outlined('Home!', NR_HIVE[0], NR_HIVE[1] + 98, 24, '#ffe36b');
      for (const f of g.flowers) {
        ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(f.x + 10, (f.y + H) / 2, f.x, H + 10); ctx.stroke();
        flower(f.x, f.y, 30, f.full ? f.c : mix(f.c, '#a090a0', 0.5), f.full ? '#ffd23a' : '#c8b090', 2);
        if (f.full) { const gl = 0.5 + 0.3 * Math.sin(S.t * 5 + f.x); ctx.fillStyle = `rgba(255,236,120,${gl})`; circle(f.x, f.y, 12); twinkle(f.x + 16, f.y - 18, 7, gl, '#fff6a8'); }
      }
      for (const e of g.foes) e.kind === 'fly' ? drawDragonfly(e.x, e.y, 1, e.dir, S.t) : drawBee(e.x, e.y, 1.05, e.dir, S.t, true);
      if (!(g.inv > 0 && Math.sin(S.t * 30) > 0)) drawBee(g.px, g.py, 1.3, g.facing || 1, S.t);
      for (let i = 0; i < 3; i++) inkCircle(g.px - 20 + i * 20, g.py - 42, 7, i < g.carry ? '#ffd23a' : 'rgba(255,255,255,.5)', 1);
    },
  };

  // --- Count the Sides: shapes by their number of sides ---------------------------------------------
  const SIDES = { 3: ['triangle', 'like a slice of pizza'], 4: ['square', 'like a window'], 5: ['pentagon', 'like a little house'], 6: ['hexagon', 'like a honeycomb'], 8: ['octagon', 'like a stop sign'] };
  const SHAPE_COLS = ['#ffd23a', '#ff8fc8', '#7fd0ff', '#a6f0b8', '#c6a2ff', '#ffb06a'];
  MG.countsides = {
    kind: 'learn', title: () => 'Count the Sides', icon: () => '🔷',
    how: () => 'Count the straight sides of each shape! Click the right shape or number, or press its number key.',
    init(g) {
      Object.assign(g, { round: 0, rounds: 6, total: 0, pool: g.tier === 3 ? [3, 4, 5, 6, 8] : [3, 4, 5, 6], n: g.tier === 1 ? 3 : 4, shake: {} });
      g.order = shuffle([...g.pool, ...g.pool]).slice(0, g.rounds);
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const sides = g.order[g.round], type = g.tier === 1 || g.round % 2 === 0 ? 'pick' : 'count';
      const others = shuffle(g.pool.filter(s => s !== sides)).slice(0, g.n - 1);
      const opts = shuffle([sides, ...others]), cols = shuffle(SHAPE_COLS);
      Object.assign(g, { sides, type, opts, cols, rots: opts.map(() => (g.tier === 1 ? 0 : rand(-0.4, 0.4))), tried: [], state: 'pick', t2: 0 });
      g.say = type === 'pick' ? `Which shape has ${NUM_WORDS[sides]} sides, ${SIDES[sides][1]}?` : 'How many sides does this shape have? Count them!';
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      tickDown(g.shake, dt);
      if (g.state === 'pick') {
        const i = idPick(id, 'side:', g.opts.length);
        if (i >= 0 && i < g.opts.length && !g.tried.includes(i)) {
          g.tried.push(i);
          if (g.opts[i] === g.sides) {
            g.total += [1, 0.5, 0.2, 0][g.tried.length - 1]; g.state = 'count'; g.t2 = 0; g.hit = i; SFX.hit();
            speak(`${[...Array(g.sides)].map((_, k) => NUM_WORDS[k + 1]).join(', ')}! ${NUM_WORDS[g.sides]} sides. A ${SIDES[g.sides][0]}!`);
          } else {
            g.shake[i] = 0.4; SFX.miss();
            speak(g.type === 'pick' ? `That one has ${NUM_WORDS[g.opts[i]]} sides. Find ${NUM_WORDS[g.sides]}!` : 'Not quite. Count each straight side!');
          }
        }
      } else {
        const prev = Math.floor(g.t2 / 0.42);
        g.t2 += dt;
        const now = Math.floor(g.t2 / 0.42);
        if (now > prev && now <= g.sides) tone(440 + now * 60, 0.12, 'triangle', 0.07);
        if (now === g.sides && prev < g.sides) burst(W / 2, 300, 22);
        if (g.t2 > g.sides * 0.42 + 1.5) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      }
      g.progress = `Shape ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    // draw a polygon; while counting, light up its sides one by one with numbers
    shape(g, n, x, y, r, col, rot, counting) {
      const pts = polyPts(n, x, y, r, rot);
      ink(ptsPath(pts), col, 3);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(x - r * 0.3, y - r * 0.3, r * 0.18);
      if (!counting) return;
      const lit = Math.min(n, Math.floor(g.t2 / 0.42));
      for (let k = 0; k < lit; k++) {
        const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % n];
        ctx.strokeStyle = '#ff5f7e'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        const mx = (ax + bx) / 2, my = (ay + by) / 2, d = Math.hypot(mx - x, my - y) || 1;
        inkCircle(mx + (mx - x) / d * 24, my + (my - y) / d * 24, 15, '#ffffff', 1.5);
        text(String(k + 1), mx + (mx - x) / d * 24, my + (my - y) / d * 24 + 1, 18, '#c0306a', 'center', 800);
      }
    },
    draw(g) {
      const counting = g.state === 'count';
      panel(W / 2 - 380, 66, 760, 92, 22);
      if (g.type === 'pick') {
        outlined(`Which shape has ${g.sides} sides?`, W / 2, 98, 34, '#ffd23a');
        text(counting ? `${g.sides} sides: a ${SIDES[g.sides][0]}!` : `(${SIDES[g.sides][1]})`, W / 2, 136, 20, '#8a5aa0', 'center', 600);
        const n = g.opts.length, cw = n === 3 ? 230 : 190, gap = 22, x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
        g.opts.forEach((s, i) => {
          const x = x0 + i * (cw + gap) + shakeX(g.shake, i), wrong = g.tried.includes(i) && s !== g.sides, right = counting && i === g.hit;
          button(`side:${i}`, x, 182, cw, 300, '', { color: right ? '#ffd23f' : wrong ? '#c9bcd4' : CARD_COLS[i], on: (g.state === 'pick' && !wrong) || right, key: String(i + 1) });
          rrect(x + 10, 192, cw - 20, 280, 14, 'rgba(255,255,255,.85)');
          this.shape(g, s, x + cw / 2, 322, cw * 0.33, g.cols[i], g.rots[i], right);
          if (wrong || right) { const nm = `${s} sides`; text(nm, x + cw / 2, 446, 20, '#5a2a6e', 'center', 800); }
        });
      } else {
        outlined('How many sides?', W / 2, 98, 34, '#ffd23a');
        text(counting ? `${g.sides} sides: a ${SIDES[g.sides][0]}!` : 'Count each straight side.', W / 2, 136, 20, '#8a5aa0', 'center', 600);
        panel(W / 2 - 160, 172, 320, 236, 26);
        this.shape(g, g.sides, W / 2, 292, 88, g.cols[0], g.rots[0], counting);
        const n = g.opts.length, bw = 120, gap = 20, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
        g.opts.forEach((s, i) => {
          const wrong = g.tried.includes(i) && s !== g.sides, right = counting && s === g.sides;
          button(`side:${i}`, x0 + i * (bw + gap) + shakeX(g.shake, i), 424, bw, 84, String(s), { color: right ? '#ffd23f' : wrong ? '#c9bcd4' : CARD_COLS[i], on: (g.state === 'pick' && !wrong) || right, size: 44, key: String(i + 1) });
        });
      }
      if (counting) drawBee(W / 2 + Math.cos(S.t * 3) * 200, 300 + Math.sin(S.t * 6) * 30, 0.9, -Math.sin(S.t * 3) >= 0 ? 1 : -1, S.t);
    },
  };

  restage('beemeadow', {
    bg: 'beemeadow_bg',
    games: [['nectarrun', 'honey', {}], ['countsides', 'petal', {}]],
    intro: ['N:Bzzz! Who goes there? A human? Will you help us gather nectar?', 'A:excited:Can I be a bee too?!', '*:Queen Bumble waves her wand. Bzzzzt! You have wings!', 'N:Carry the nectar home to the hive. And stay away from the bugs that buzz about!'],
    mid: ['N:Bzzz! Bees are the best builders. Every cell in our honeycomb has SIX sides!', "N:Let's count the sides of some shapes.", 'A:thinking:One side, two sides... I can count those!'],
    outro: ['N:Take this golden honey, and some petals from our meadow. Honey shines like the sun on anything it touches.', 'A:happy:Buzz-tastic! Thank you, Queen Bumble!'],
  });

  // =====================================================================================
  // 4. THE DUSTY ATTIC: trunks, old toys, a rocking horse and a moonlit round window
  // =====================================================================================
  function cobweb(x, y, r, a0, a1) {
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.3;
    const n = 6;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    for (let k = 1; k <= 4; k++) {
      const rr = r * k / 4.4;
      for (let i = 0; i < n; i++) {
        const a = lerp(a0, a1, i / n), b = lerp(a0, a1, (i + 1) / n), m = (a + b) / 2;
        ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        ctx.quadraticCurveTo(x + Math.cos(m) * rr * 0.8, y + Math.sin(m) * rr * 0.8, x + Math.cos(b) * rr, y + Math.sin(b) * rr);
      }
    }
    ctx.stroke();
  }
  function rockingHorse(x, gy, s, t) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.6) * 0.09);
    ctx.lineCap = 'round';
    for (const [a, b] of [[-46, -70], [46, 70], [-30, -52], [30, 52]]) { ctx.strokeStyle = OL; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(a, -84); ctx.lineTo(b, -16); ctx.stroke(); ctx.strokeStyle = '#e8c890'; ctx.lineWidth = 6; ctx.stroke(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, -260, 260, Math.PI / 2 - 0.44, Math.PI / 2 + 0.44); ctx.stroke();
    ctx.strokeStyle = '#d0505a'; ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = '#ff8fc8'; ctx.lineWidth = 5;
    for (const [dx, dy] of [[0, 0], [-8, 10], [8, 12]]) { ctx.beginPath(); ctx.moveTo(-58, -100); ctx.quadraticCurveTo(-80 + dx, -90, -86 + dx, -60 + dy); ctx.stroke(); }
    ink(P2('M36,-108 C40,-140 54,-168 74,-172 C92,-174 108,-160 110,-146 C112,-134 100,-128 90,-134 C82,-126 72,-110 68,-94 Z'), '#fff4e0', 2);
    inkEllipse(0, -94, 64, 26, 0, '#fff4e0', 2);
    ctx.fillStyle = '#c8b0e8'; for (const [dx, dy] of [[-30, -100], [-10, -86], [16, -102], [-40, -84], [30, -88]]) circle(dx, dy, 5);
    tri(70, -170, 68, -188, 82, -172);
    ctx.fillStyle = '#ff6fae'; for (const [dx, dy] of [[38, -116], [44, -134], [52, -150], [62, -164], [74, -174]]) { ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dx - 6, dy, 9, 0, Math.PI * 2); ctx.stroke(); }
    for (const [dx, dy] of [[38, -116], [44, -134], [52, -150], [62, -164], [74, -174]]) circle(dx - 6, dy, 9);
    inkRect(-26, -124, 44, 16, '#ff5f7e', 2, 5);
    ctx.fillStyle = OL; circle(90, -154, 3.5); circle(104, -142, 2);
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(100, -140); ctx.lineTo(72, -128); ctx.stroke();
    ctx.restore();
  }
  function hatbox(x, by, w, h, col, stripe) {
    inkEllipse(x, by, w / 2, 9, 0, col, 2);
    inkRect(x - w / 2, by - h, w, h, col, 2.5, 0);
    ctx.fillStyle = stripe; for (let k = -w / 2 + 6; k < w / 2; k += 16) ctx.fillRect(x + k, by - h + 4, 7, h - 4);
    inkEllipse(x, by - h, w / 2 + 4, 10, 0, mix(col, '#ffffff', 0.3), 2);
  }
  BACKDROPS.attic_bg = () => {
    ctx.fillStyle = '#3e2a54'; ctx.fillRect(0, 0, W, H);
    // sloped ceiling beams either side
    ctx.lineCap = 'butt';
    for (let k = 1; k < 6; k++) for (const side of [-1, 1]) {
      const y0 = 250 + k * 64, ax = side < 0 ? 110 : 850, y = x => y0 - Math.abs(x - ax) * 0.595 * (side < 0 ? (x > ax ? 1 : -1) : (x < ax ? 1 : -1));
      const xa = side < 0 ? -20 : 480, xb = side < 0 ? 480 : W + 20;
      ctx.strokeStyle = OL; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(xa, y(xa)); ctx.lineTo(xb, y(xb)); ctx.stroke();
      ctx.strokeStyle = '#5a3a3a'; ctx.lineWidth = 11; ctx.stroke();
    }
    // the back wall under the roof
    const wall = P2('M110,410 L110,250 L480,30 L850,250 L850,410 Z');
    const wg = ctx.createLinearGradient(0, 30, 0, 410); wg.addColorStop(0, '#7a4e62'); wg.addColorStop(1, '#b07868');
    ctx.fillStyle = wg; ctx.fill(wall);
    ctx.save(); ctx.clip(wall); ctx.strokeStyle = 'rgba(60,30,50,.25)'; ctx.lineWidth = 2;
    for (let x = 130; x < 850; x += 36) { ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, 410); ctx.stroke(); }
    ctx.fillStyle = 'rgba(60,30,50,.25)'; for (let i = 0; i < 26; i++) circle(130 + (i * 137) % 720 + 18, 120 + (i * 71) % 280, 2);
    ctx.restore();
    ctx.lineCap = 'round';
    for (const [ax, ay, bx, by] of [[100, 256, 486, 26], [474, 26, 860, 256], [366, 98, 594, 98]]) { ctx.strokeStyle = OL; ctx.lineWidth = 24; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.strokeStyle = '#7a5038'; ctx.lineWidth = 18; ctx.stroke(); }
    // the round window: a moonlit night outside
    const wx = 480, wy = 200;
    const sky = ctx.createLinearGradient(0, wy - 60, 0, wy + 60); sky.addColorStop(0, '#1c1a5a'); sky.addColorStop(1, '#5a4a9a');
    inkCircle(wx, wy, 72, '#8a5a3a', 3);
    inkCircle(wx, wy, 60, sky, 2.5);
    ctx.save(); ctx.beginPath(); ctx.arc(wx, wy, 58, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 12; i++) twinkle(wx - 50 + (i * 37) % 100, wy - 50 + (i * 53) % 90, 3 + (i % 2) * 2, 0.4 + 0.6 * Math.abs(Math.sin(S.t * 1.5 + i)), '#fff8d8');
    ctx.fillStyle = 'rgba(255,248,200,.3)'; circle(wx + 20, wy - 16, 30);
    ctx.fillStyle = '#fff8d8'; circle(wx + 20, wy - 16, 20); ctx.fillStyle = '#2a2668'; circle(wx + 10, wy - 22, 18);
    ctx.fillStyle = '#2a2a50'; ellipse(wx - 30, wy + 60, 50, 24); ellipse(wx + 30, wy + 64, 46, 22);
    ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(wx - 60, wy); ctx.lineTo(wx + 60, wy); ctx.moveTo(wx, wy - 60); ctx.lineTo(wx, wy + 60); ctx.stroke();
    ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 5; ctx.stroke();
    inkRect(wx - 84, wy + 68, 168, 12, '#a0683a', 2, 3);
    emoji('🪴', wx - 58, wy + 56, 26);
    // cobwebs in the corners
    cobweb(112, 252, 90, -0.53, Math.PI / 2); cobweb(848, 252, 90, Math.PI / 2, Math.PI + 0.53); cobweb(372, 108, 54, 0, Math.PI - 0.6); cobweb(588, 108, 54, 0.6, Math.PI);
    // pictures leaning on the wall
    inkRect(150, 290, 92, 76, '#ffcf4a', 2.5, 4); inkRect(160, 300, 72, 56, '#9ad8ff', 2, 2);
    ctx.fillStyle = '#7fd06a'; ellipse(196, 356, 46, 16); emoji('🦄', 196, 330, 30);
    inkRect(690, 300, 70, 84, '#c98a4a', 2.5, 4); inkRect(698, 308, 54, 68, '#ffe0ea', 2, 2); emoji('🌹', 725, 342, 30);
    // the floorboards and a striped rug
    ctx.fillStyle = '#8a5a3e'; ctx.fillRect(0, 408, W, H - 408);
    ctx.strokeStyle = 'rgba(50,25,30,.35)'; ctx.lineWidth = 2;
    for (let i = -8; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(480 + (i * 80 - 480) * 0.45, 408); ctx.lineTo(i * 80, H); ctx.stroke(); }
    for (const y of [430, 458, 494]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 408); ctx.lineTo(W, 408); ctx.stroke();
    ['#ff8fc8', '#7fd0ff', '#ffe36b', '#a6f0b8', '#c6a2ff'].forEach((c, i) => { ctx.fillStyle = c; ellipse(480, 498, 250 - i * 40, 36 - i * 6); });
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(480, 498, 250, 36, 0, 0, Math.PI * 2); ctx.stroke();
    // moonbeam falling across the floor, full of dust motes
    const beam = P2(`M${wx - 40},${wy + 40} L${wx + 52},${wy + 30} L780,${H} L470,${H} Z`);
    const bg = ctx.createLinearGradient(0, wy, 0, H); bg.addColorStop(0, 'rgba(220,230,255,.28)'); bg.addColorStop(1, 'rgba(220,230,255,.06)');
    ctx.fillStyle = bg; ctx.fill(beam);
    // the open trunk spilling a feather boa
    ink(P2('M24,372 L34,318 L194,318 L186,372 Z'), '#2a8a8a', 2.5);
    ctx.fillStyle = '#5a2a4a'; ctx.fillRect(34, 330, 148, 30);
    inkRect(20, 368, 170, 88, '#36a6a0', 2.5, 8);
    ctx.fillStyle = '#e0b040'; ctx.fillRect(46, 370, 10, 84); ctx.fillRect(154, 370, 10, 84);
    inkRect(96, 380, 18, 20, '#ffd23a', 2, 3);
    ctx.fillStyle = '#ff8fc8'; for (let i = 0; i < 12; i++) circle(40 + i * 11, 368 + Math.sin(i * 0.9) * 6 + (i > 7 ? (i - 7) * 10 : 0), 9);
    emoji('🎩', 150, 352, 34);
    emoji('🧸', 240, 440, 44);
    // toys in the middle: blocks, a drum and the rocking horse
    [['A', '#ff6f9a', 330], ['B', '#4fa8e0', 362], ['C', '#5adc7a', 346]].forEach(([l, c, x], i) => { const y = i === 2 ? 410 : 440; inkRect(x - 15, y - 15, 30, 30, c, 2, 4); text(l, x, y + 1, 18, '#ffffff', 'center', 800); });
    inkEllipse(420, 452, 26, 8, 0, '#fff4e0', 1.5); inkRect(394, 430, 52, 22, '#ff5f7e', 2, 2); inkEllipse(420, 430, 26, 8, 0, '#fff8ec', 1.5);
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(398 + k * 11, 436); ctx.lineTo(404 + k * 11, 450); } ctx.stroke();
    rockingHorse(560, 456, 0.82, S.t);
    // hatboxes stacked on the right, and a lamp
    hatbox(890, 470, 110, 54, '#ff9ac8', '#ffffff'); hatbox(886, 412, 90, 44, '#7fd0ff', '#fff6a8'); hatbox(892, 364, 70, 36, '#c6a2ff', '#ffffff');
    // dust motes drifting everywhere, brighter in the moonbeam
    for (let i = 0; i < 46; i++) {
      const x = (i * 97 + Math.sin(S.t * 0.4 + i) * 30 + S.t * 6) % W, y = 80 + ((i * 61 + S.t * (6 + (i % 4) * 3)) % 420);
      const inBeam = ctx.isPointInPath(beam, x * DPR, y * DPR);
      ctx.fillStyle = `rgba(255,248,220,${(inBeam ? 0.75 : 0.25) * (0.5 + 0.5 * Math.sin(S.t * 2 + i))})`; circle(x, y, inBeam ? 2.4 : 1.6);
    }
  };

  // --- Web Dot-to-Dot: join the numbered dots in order to spin a silk picture ----------------------
  const heartPts = n => [...Array(n)].map((_, i) => { const t = i / n * Math.PI * 2; return [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; });
  const WEB_PICS = {
    star: ['star', '#ffe36b', () => [...Array(10)].map((_, i) => { const r = i % 2 ? 0.42 : 1, a = -Math.PI / 2 + i * Math.PI / 5; return [Math.cos(a) * r, Math.sin(a) * r]; })],
    house: ['house', '#ffb3c7', () => [[0.15, 0.95], [0.15, 0.5], [0.02, 0.52], [0.5, 0.06], [0.98, 0.52], [0.85, 0.5], [0.85, 0.95]]],
    boat: ['sailboat', '#9ad0ff', () => [[0.08, 0.7], [0.47, 0.7], [0.47, 0.08], [0.88, 0.62], [0.55, 0.62], [0.55, 0.7], [0.92, 0.7], [0.75, 0.92], [0.25, 0.92]]],
    fish10: ['fish', '#ffb06a', () => [[0.95, 0.5], [0.75, 0.26], [0.5, 0.2], [0.26, 0.38], [0.05, 0.16], [0.13, 0.5], [0.05, 0.84], [0.26, 0.62], [0.5, 0.8], [0.75, 0.74]]],
    fish12: ['fish', '#ffb06a', () => [[0.95, 0.5], [0.82, 0.3], [0.62, 0.2], [0.42, 0.24], [0.24, 0.4], [0.05, 0.14], [0.13, 0.5], [0.05, 0.86], [0.24, 0.6], [0.42, 0.76], [0.62, 0.8], [0.82, 0.7]]],
    heart: ['heart', '#ff8fc8', () => heartPts(14)],
    flower: ['flower', '#c6a2ff', () => [...Array(20)].map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 10, r = 0.74 + 0.26 * Math.cos(5 * (a + Math.PI / 2)); return [Math.cos(a) * r, Math.sin(a) * r]; })],
  };
  const WEB_SETS = [['star', 'house', 'boat', 'fish10'], ['fish12', 'heart', 'flower'], ['star', 'fish12', 'heart', 'boat']];
  function fitPts(pts, cx, cy, w, h) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), s = Math.min(w / (x1 - x0), h / (y1 - y0));
    return pts.map(([x, y]) => [cx + (x - (x0 + x1) / 2) * s, cy + (y - (y0 + y1) / 2) * s]);
  }
  // Aubrey is the spinner: she runs from dot to dot (keys, or she follows your finger), trailing silk from
  // the last dot she tied off; touching the next number ties the thread there
  const WEB_BOX = [306, 126, 734, 488], WEB_AH = 76;
  MG.webdots = {
    kind: 'learn', title: () => 'Web Dot-to-Dot', icon: () => '🕸️',
    how: g => `Help Aubrey spin a silk picture! Move her with the arrow keys, or lead her with your finger, and run to the dots in order: ${g.tier === 3 ? '2, 4, 6, 8... count by twos!' : '1, 2, 3...'}`,
    init(g) {
      Object.assign(g, { round: 0, rounds: 3, total: 0, pics: shuffle(WEB_SETS[g.tier - 1]).slice(0, 3), step: g.tier === 3 ? 2 : 1, shake: {} });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const [name, col, fn] = WEB_PICS[g.pics[g.round]];
      Object.assign(g, { name, col, dots: fitPts(fn(), 520, 306, 380, 320), got: 1, wrong: 0, idle: 0, state: 'join', t2: 0, spin: 1, vx: 0, vy: 0, face: 1, twirl: 0, onWrong: -1, run: 0 });
      [g.ax, g.ay] = g.dots[0];
      g.say = `Aubrey starts at ${g.step}. Now run to ${NUM_WORDS[g.step * 2]}!`;
      if (g.phase === 'play') speak(g.say);
    },
    label: (g, i) => (i + 1) * g.step,
    update(g, dt) {
      g.idle += dt; tickDown(g.shake, dt);
      g.spin = Math.min(1, g.spin + dt * 5); g.twirl = Math.max(0, g.twirl - dt);
      if (g.state === 'join') {
        // move: keys push her, the pointer leads her
        const sp = 300, kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        if (kx || ky) { g.vx = lerp(g.vx, kx * sp, dt * 8); g.vy = lerp(g.vy, ky * sp, dt * 8); }
        else if (pointerMoved(g) || g.usePointer) { g.vx = clamp((pointer.x - g.ax) * 5, -sp, sp); g.vy = clamp((pointer.y - g.ay) * 5, -sp, sp); }
        else { g.vx *= 1 - dt * 5; g.vy *= 1 - dt * 5; }
        g.ax = clamp(g.ax + g.vx * dt, WEB_BOX[0], WEB_BOX[2]); g.ay = clamp(g.ay + g.vy * dt, WEB_BOX[1], WEB_BOX[3]);
        if (Math.abs(g.vx) > 25) g.face = Math.sign(g.vx);
        g.run = Math.hypot(g.vx, g.vy) > 40 ? g.run + dt : 0;
        // which dot is she standing on?
        let best = -1, bd = 26;
        g.dots.forEach(([x, y], i) => { const d = Math.hypot(g.ax - x, g.ay - y); if (d < bd) { bd = d; best = i; } });
        if (best === g.got) {
          g.got++; g.idle = 0; g.spin = 0; g.twirl = 0.45; g.onWrong = -1;
          tone(500 + g.got * 30, 0.1, 'triangle', 0.08); burst(g.dots[best][0], g.dots[best][1], 8, { colors: ['#ffffff', '#e8dcff', '#fff6a8'], spread: 50 });
          if (g.got >= g.dots.length) {
            g.state = 'done'; g.t2 = 0; g.total += Math.max(0.3, 1 - 0.12 * g.wrong); SFX.sparkle();
            speak(`Aubrey spun a ${g.name}!`); burst(520, 300, 30, { colors: ['#ffffff', g.col, '#fff6a8'] });
          }
        } else if (best > g.got && best !== g.onWrong) {
          g.onWrong = best; g.wrong++; g.shake[best] = 0.4; g.idle = 99; SFX.miss();
          speak(`That's ${NUM_WORDS[this.label(g, best)] || this.label(g, best)}. Find ${NUM_WORDS[this.label(g, g.got)] || this.label(g, g.got)}!`);
        } else if (best < 0) g.onWrong = -1;
      } else if (g.state === 'done' && (g.t2 += dt) > 2.6) {
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      g.progress = `Picture ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      drawCritter('Silvie the Spider', 120, 480, 0.85, 1);
      panel(290, 104, 460, 400, 28);
      // a faint web behind the picture, so it feels like Aubrey is spinning on a real web
      ctx.strokeStyle = 'rgba(184,160,224,.25)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.beginPath(); ctx.moveTo(520, 304); ctx.lineTo(520 + Math.cos(a) * 240, 304 + Math.sin(a) * 210); ctx.stroke(); }
      for (let r = 40; r < 230; r += 42) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const a = i * TAU / 12; ctx.lineTo(520 + Math.cos(a) * r * 1.05, 304 + Math.sin(a) * r * 0.9); } ctx.stroke(); }
      const D = g.dots, n = D.length, done = g.state === 'done', fill = done ? clamp(g.t2 / 0.8, 0, 1) : 0;
      if (fill) { ctx.globalAlpha = fill; ctx.fillStyle = g.col; ctx.fill(ptsPath(D)); ctx.globalAlpha = 1; }
      // silk tied off between the dots so far, the newest bit snapping tight
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const path = () => {
        ctx.beginPath(); ctx.moveTo(D[0][0], D[0][1]);
        for (let i = 1; i < g.got; i++) {
          const k = i === g.got - 1 && !done ? g.spin : 1;
          ctx.lineTo(lerp(D[i - 1][0], D[i][0], k), lerp(D[i - 1][1], D[i][1], k));
        }
        if (done) ctx.closePath();
      };
      path(); ctx.strokeStyle = '#b8a0e0'; ctx.lineWidth = 7; ctx.stroke();
      path(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5; ctx.stroke();
      // the dots and their numbers
      const cx = D.reduce((a, p) => a + p[0], 0) / n, cy = D.reduce((a, p) => a + p[1], 0) / n;
      D.forEach(([x, y], i) => {
        const next = i === g.got && !done, joined = i < g.got, sx = shakeX(g.shake, i);
        if (next && g.idle > 5) { ctx.strokeStyle = `rgba(255,111,181,${0.5 + 0.5 * Math.sin(S.t * 8)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 20 + Math.sin(S.t * 8) * 3, 0, Math.PI * 2); ctx.stroke(); }
        inkCircle(x + sx, y, joined ? 8 : next ? 12 : 10, joined ? '#c6a2ff' : next ? '#fff6c8' : '#ffffff', 1.5);
        if (done) return;
        const d = Math.hypot(x - cx, y - cy) || 1, lx = x + (x - cx) / d * 26 + sx, ly = y + (y - cy) / d * 24;
        text(String(this.label(g, i)), lx, ly, i === g.got ? 22 : 18, joined ? '#b8a0c8' : i === g.got ? '#ff3f8f' : '#5a2a6e', 'center', 800);
      });
      if (!done) {
        // the loose silk from the last tied dot to Aubrey's hand, sagging a little and glinting
        const [lx, ly] = D[g.got - 1], hx = g.ax + g.face * 10, hy = g.ay - 2, mx = (lx + hx) / 2, my = (ly + hy) / 2 + Math.min(30, Math.hypot(hx - lx, hy - ly) * 0.12);
        for (const [c, w] of [['rgba(184,160,224,.8)', 5], ['#ffffff', 2.2]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(mx, my, hx, hy); ctx.stroke(); }
        const gk = (S.t * 0.8) % 1; star(lerp(lerp(lx, mx, gk), lerp(mx, hx, gk), gk), lerp(lerp(ly, my, gk), lerp(my, hy, gk), gk), 3, '#ffffff', 4);
      }
      // Aubrey: running between dots, twirling when she ties one off, cheering when the picture is done
      const fr = done ? 'twirl' : g.twirl > 0 ? 'twirl' : g.run > 0 ? `run${1 + (Math.floor(g.run * 11) % 5)}` : 'idle_front';
      const hop = done ? Math.abs(Math.sin(g.t2 * 7)) * 10 : g.twirl > 0 ? Math.sin(g.twirl / 0.45 * Math.PI) * 8 : 0;
      ctx.fillStyle = 'rgba(40,20,60,.18)'; ellipse(g.ax, g.ay + WEB_AH * 0.5, 16, 4);
      drawAubrey(g.ax, g.ay + WEB_AH * 0.5, fr, g.face, hop, WEB_AH / IMG.idle_front.height);
      if (done) outlined(`A ${g.name}!`, 520, 140, 34, g.col);
      else text(`Next: ${this.label(g, g.got)}`, 520, 492, 20, '#8a5aa0', 'center', 700);
    },
  };

  // --- Dust Bunny Sweep: push the hopping dust bunnies into the dustpan -------------------------------
  const PAN = { x: 840, y0: 384, y1: 476 };
  function dustBunny(x, y, s, t, hop, look) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 + hop * 0.15), s * (1 - hop * 0.12));
    inkEllipse(-10, -40, 6, 15, -0.25, '#d0c8dc', 1.5); inkEllipse(10, -40, 6, 15, 0.25, '#d0c8dc', 1.5);
    ctx.fillStyle = '#ffb3c7'; ellipse(-10, -40, 2.5, 9, -0.25); ellipse(10, -40, 2.5, 9, 0.25);
    const fl = [...Array(11)].map((_, i) => { const a = i / 11 * Math.PI * 2; return [Math.cos(a) * 20, -18 + Math.sin(a) * 17, 9 + (i % 3) * 1.5]; });
    ctx.strokeStyle = OL; ctx.lineWidth = 3; for (const [fx, fy, r] of fl) { ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, -18, 21, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#d6cfe0'; for (const [fx, fy, r] of fl) circle(fx, fy, r); circle(0, -18, 21);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; circle(-8, -26, 8);
    for (const ex of [-7, 7]) { ctx.fillStyle = '#ffffff'; circle(ex, -20, 5.5); ctx.fillStyle = '#2a1a3a'; circle(ex + look * 2, -19.5, 3); }
    ctx.fillStyle = 'rgba(255,140,170,.6)'; ellipse(-13, -12, 4, 2.5); ellipse(13, -12, 4, 2.5);
    ctx.restore();
  }
  function drawBroom(x, y) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(x - 4, y - 24); ctx.lineTo(x - 64, y - 190); ctx.stroke();
    ctx.strokeStyle = '#c07a40'; ctx.lineWidth = 6; ctx.stroke();
    ink(P2(`M${x - 18},${y - 26} L${x + 14},${y - 26} L${x + 40},${y + 16} L${x - 40},${y + 16} Z`), '#ffd76a', 2);
    ctx.strokeStyle = '#d8a030'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(x + k * 4, y - 18); ctx.lineTo(x + k * 11, y + 14); } ctx.stroke();
    inkRect(x - 20, y - 32, 36, 10, '#ff5f7e', 2, 3);
  }
  MG.dustsweep = {
    kind: 'action', title: () => 'Dust Bunny Sweep', icon: () => '🧹',
    how: () => 'Move the broom with the mouse or the arrow keys. Push the hopping dust bunnies into the dustpan on the right!',
    init(g) {
      const n = [5, 7, 9][g.tier - 1];
      Object.assign(g, {
        timeLeft: 50, px: 140, py: 380, facing: 1, caught: 0, total: n, say: 'Push the dust bunnies into the dustpan!',
        bunnies: [...Array(n)].map((_, i) => ({ x: rand(260, 720), y: rand(300, 490), vx: 0, vy: 0, hopT: rand(0.5, 2.5), hop: 0, look: 1, in: false, gone: 0 })),
      });
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.timeLeft -= dt;
      steer(g, dt, 420, 40, 820, 270, 515);
      const bvx = g.vx || 0, bvy = g.vy || 0;
      for (const b of g.bunnies) {
        if (b.in) { b.gone += dt; continue; }
        b.hop = Math.max(0, b.hop - dt * 3);
        if ((b.hopT -= dt) <= 0) {
          const a = rand(0, Math.PI * 2), sp = [70, 95, 120][g.tier - 1];
          b.vx += Math.cos(a) * sp; b.vy += Math.sin(a) * sp * 0.7; b.hop = 1; b.hopT = rand(1.2, 2.6) / [1, 1.2, 1.4][g.tier - 1];
        }
        const dx = b.x - g.px, dy = b.y - g.py, d = Math.hypot(dx, dy);
        if (d < 56) {
          const ux = d ? dx / d : 1, uy = d ? dy / d : 0;
          b.x = g.px + ux * 56; b.y = g.py + uy * 56;
          const along = bvx * ux + bvy * uy, push = Math.max(160, along * 1.1);
          b.vx = ux * push; b.vy = uy * push; b.hop = 0.6;
          if (Math.random() < dt * 4) SFX.scrub();
        }
        const f = Math.exp(-2.6 * dt);
        b.vx *= f; b.vy *= f; b.x += b.vx * dt; b.y += b.vy * dt;
        b.look = b.vx >= 0 ? 1 : -1;
        if (b.x > PAN.x && b.y > PAN.y0 && b.y < PAN.y1) {
          b.in = true; g.caught++; SFX.pop(); burst(b.x + 30, b.y - 20, 14, { colors: ['#d6cfe0', '#ffffff', '#c6a2ff'] });
          floatText(PAN.x + 40, PAN.y0 - 30, pick(['Whoosh!', 'Got one!', 'Into the pan!']), '#fff6a8', false, 22);
          if (g.caught >= g.total) speak('All swept up! What a clean attic!');
        }
        if (b.x < 50) { b.x = 50; b.vx = Math.abs(b.vx); }
        if (b.x > 910) { b.x = 910; b.vx = -Math.abs(b.vx); }
        if (b.y < 280) { b.y = 280; b.vy = Math.abs(b.vy); }
        if (b.y > 505) { b.y = 505; b.vy = -Math.abs(b.vy); }
        if (b.x > PAN.x - 6 && b.x < PAN.x + 8 && (b.y <= PAN.y0 || b.y >= PAN.y1)) { b.x = PAN.x - 6; b.vx = -Math.abs(b.vx) * 0.5; }
      }
      g.progress = `Swept ${g.caught} of ${g.total}`;
      g.score = g.caught / g.total;
      if (g.timeLeft <= 0 || g.bunnies.every(b => b.in && b.gone > 0.6)) g.done = true;
    },
    draw(g) {
      // a wooden floor to sweep
      const fl = P2('M0,250 L960,250 L960,540 L0,540 Z');
      const fg = ctx.createLinearGradient(0, 250, 0, H); fg.addColorStop(0, '#7a4e36'); fg.addColorStop(1, '#a06a46');
      ctx.fillStyle = fg; ctx.fill(fl);
      ctx.strokeStyle = 'rgba(50,25,30,.3)'; ctx.lineWidth = 2;
      for (let i = -10; i <= 22; i++) { ctx.beginPath(); ctx.moveTo(480 + (i * 60 - 480) * 0.55, 250); ctx.lineTo(i * 60, H); ctx.stroke(); }
      for (const y of [282, 322, 372, 432, 500]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 250); ctx.lineTo(W, 250); ctx.stroke();
      ctx.fillStyle = 'rgba(220,210,235,.35)'; for (let i = 0; i < 18; i++) ellipse((i * 157) % 800 + 60, 280 + (i * 67) % 230, 10 + (i % 3) * 4, 3);
      // the dustpan: a scoop opening to the left, with its handle
      ctx.fillStyle = `rgba(255,240,150,${0.22 + 0.1 * Math.sin(S.t * 4)})`; ellipse(PAN.x + 50, 430, 96, 76);
      ctx.strokeStyle = OL; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(PAN.x + 98, PAN.y0 + 10); ctx.lineTo(PAN.x + 112, PAN.y0 - 50); ctx.stroke();
      ctx.strokeStyle = '#3fae55'; ctx.lineWidth = 8; ctx.stroke();
      ink(P2(`M${PAN.x - 6},${PAN.y0 - 6} Q${PAN.x + 40},${PAN.y0 - 20} ${PAN.x + 104},${PAN.y0 - 4} L${PAN.x + 104},${PAN.y1 + 14} Q${PAN.x + 40},${PAN.y1 + 20} ${PAN.x - 6},${PAN.y1 + 6} Z`), '#5adc7a', 2.5);
      const ig = ctx.createLinearGradient(PAN.x, 0, PAN.x + 96, 0); ig.addColorStop(0, '#2f8a48'); ig.addColorStop(1, '#1f5a34');
      ink(P2(`M${PAN.x + 8},${PAN.y0 + 4} Q${PAN.x + 50},${PAN.y0 - 6} ${PAN.x + 92},${PAN.y0 + 6} L${PAN.x + 92},${PAN.y1 + 4} Q${PAN.x + 50},${PAN.y1 + 8} ${PAN.x + 8},${PAN.y1 - 2} Z`), ig, 1.5);
      ctx.strokeStyle = '#a6f0b8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PAN.x - 2, PAN.y0); ctx.lineTo(PAN.x - 2, PAN.y1); ctx.stroke();
      for (const b of g.bunnies) if (b.in && b.gone < 0.6) dustBunny(lerp(b.x, PAN.x + 50, b.gone / 0.6), b.y, 1 - b.gone / 0.6, S.t, 0, 1);
      outlined('Dustpan', PAN.x + 48, PAN.y1 + 32, 18, '#a6f0b8');
      const arrowX = PAN.x - 40 + Math.sin(S.t * 5) * 6;
      ctx.fillStyle = '#fff6a8'; tri(arrowX + 18, 430, arrowX, 418, arrowX, 442);
      // bunnies, back to front, then the broom
      const live = g.bunnies.filter(b => !b.in).sort((a, b) => a.y - b.y);
      for (const b of live) { ctx.fillStyle = 'rgba(30,10,40,.25)'; ellipse(b.x, b.y, 20, 5); dustBunny(b.x, b.y - Math.sin(b.hop * Math.PI) * 14, 1, S.t, b.hop, b.look); }
      drawBroom(g.px, g.py);
    },
  };

  restage('attic', {
    bg: 'attic_bg',
    games: [['webdots', 'silk', {}], ['dustsweep', 'silk', {}]],
    intro: ["*:Up in the attic, a spider is weaving the most beautiful web you've ever seen.", "N:Don't be scared, dear. I spin the finest silk in town. Will you help me spin some silk pictures?", 'N:Just join the dots in order.', 'A:thinking:One, two, three... I can do that!'],
    mid: ['N:Oh dear, the dust bunnies are hopping all over my silk! Could you sweep them into the dustpan?', 'A:laughing:Shoo, dusty bunnies! Into the pan you go!'],
    outro: ['N:My silk is yours. It will make the loveliest capes.', 'A:happy:Spiders are actually really nice!'],
  });

  // =====================================================================================
  // 5. ROBIN'S NEST OAK: a giant oak with a nest, blossoms, a garden and a birdbath
  // =====================================================================================
  function drawChick(x, y, s, open, mood, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const bob = open ? Math.sin(t * 14) * 1.5 : 0;
    ctx.translate(0, bob);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, -15); ctx.quadraticCurveTo(-4, -24, 2, -26); ctx.moveTo(2, -15); ctx.quadraticCurveTo(4, -22, 9, -22); ctx.stroke();
    inkCircle(0, 0, 16, '#ffe9a8', 1.5);
    ctx.fillStyle = '#fff6d0'; circle(-4, -5, 7);
    if (mood === 'happy') { ctx.strokeStyle = OL; ctx.lineWidth = 2; for (const ex of [-6, 6]) { ctx.beginPath(); ctx.arc(ex, -3, 3.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } } else {
      for (const ex of [-6, 6]) { ctx.fillStyle = '#ffffff'; circle(ex, -3, 4.2); ctx.fillStyle = '#2a1a3a'; circle(ex, -2.5, 2.4); }
      if (mood === 'sad') { ctx.fillStyle = '#7fd0ff'; ellipse(-9, 4 + (t * 20) % 8, 1.8, 2.8); }
    }
    if (open) {
      ink(P2('M-11,4 L0,-1 L11,4 L0,18 Z'), '#ff9a2a', 1.2);
      ctx.fillStyle = '#e0304a'; tri(-7, 5, 7, 5, 0, 14);
    } else ink(P2('M-6,3 L6,3 L0,9 Z'), '#ff9a2a', 1);
    ctx.fillStyle = 'rgba(255,140,170,.5)'; ellipse(-11, 4, 3, 2); ellipse(11, 4, 3, 2);
    ctx.restore();
  }
  function nest(x, y, w) {
    ink(P2(`M${x - w / 2},${y - 10} Q${x},${y + w * 0.32} ${x + w / 2},${y - 10} Q${x},${y + 4} ${x - w / 2},${y - 10} Z`), '#a0703a', 2.5);
    ctx.strokeStyle = '#7a4e24'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const k = i / 8; ctx.beginPath(); ctx.moveTo(x - w / 2 + k * w * 0.9, y - 8 + Math.sin(i) * 3); ctx.quadraticCurveTo(x - w / 4 + k * w * 0.5, y + w * 0.12, x - w / 2 + 20 + k * w * 0.8, y + w * 0.08 + (i % 3) * 4); ctx.stroke(); }
    ctx.strokeStyle = '#c89050'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + i * w / 6, y - 6); ctx.lineTo(x - w / 2 + i * w / 6 + 22, y - 2 + (i % 2) * 5); ctx.stroke(); }
  }
  function drawRobin(x, y, s, dir, t, carry) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const flap = Math.sin(t * 18);
    ink(P2('M-20,-2 L-42,-12 L-40,4 Z'), '#5a3f2a', 1.5);
    inkEllipse(0, 0, 26, 19, -0.1, '#8a6a4a', 1.5);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 26, 19, -0.1, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#ff6a3a'; ellipse(14, 6, 16, 16); ctx.restore();
    inkCircle(20, -14, 13, '#8a6a4a', 1.5);
    ctx.fillStyle = '#ff6a3a'; ellipse(24, -6, 8, 6);
    ctx.fillStyle = '#ffffff'; circle(24, -17, 4); ctx.fillStyle = '#1a0a20'; circle(25, -17, 2.2);
    ink(P2('M31,-15 L43,-11 L31,-8 Z'), '#ffb52a', 1);
    if (carry === 'worm') { ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(40, -11); ctx.quadraticCurveTo(48 + Math.sin(t * 12) * 4, 2, 42, 12); ctx.stroke(); ctx.strokeStyle = '#ff9ac0'; ctx.lineWidth = 4; ctx.stroke(); }
    if (carry === 'twig') nbTwig(46, -10, 0.5, 40);
    if (carry === 'mud') nbMud(44, -9, 10);
    if (carry === 'feather') nbFeather(48, -10, 0.3, 0.9);
    if (carry === 'berry') { inkCircle(44, -9, 7, '#e0304a', 1.2); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(42, -11, 2); }
    ink(P2(`M-12,-6 Q6,${-22 - flap * 14} 14,-8 Q2,-2 -12,-6 Z`), '#6a4a32', 1.5);
    ctx.restore();
  }
  function birdbath(x, gy, t) {
    inkRect(x - 12, gy - 90, 24, 90, '#d8d0e0', 2.5, 4);
    inkRect(x - 30, gy - 14, 60, 14, '#c8c0d4', 2, 4);
    inkEllipse(x, gy - 96, 56, 14, 0, '#d8d0e0', 2.5);
    ctx.fillStyle = '#8ad8ff'; ellipse(x, gy - 99, 46, 8);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(x - 14 + Math.sin(t * 2) * 6, gy - 100, 12, 2);
    const hop = Math.abs(Math.sin(t * 3)) * 6;
    drawRobin(x + 18, gy - 116 - hop, 0.55, -1, t * 0.3, null);
    for (let i = 0; i < 4; i++) { const k = (t * 1.5 + i / 4) % 1; ctx.fillStyle = `rgba(140,215,255,${1 - k})`; circle(x + 6 + (i - 1.5) * 12 * k * 2, gy - 104 - Math.sin(k * Math.PI) * 18, 2.5); }
  }
  const RN_BRANCH = P2('M110,206 C260,184 450,166 668,160 L672,176 C450,186 270,218 116,252 Z');
  function blossom(x, y, r, col) { for (let i = 0; i < 5; i++) { const a = i * 1.2566; ctx.fillStyle = col; circle(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55); } ctx.fillStyle = '#ffd84a'; circle(x, y, r * 0.3); }
  BACKDROPS.robin_bg = () => {
    bdSky('#78d0ff', '#fff2f6');
    bdSunburst(870, 140);
    const drift = Math.sin(S.t * 0.15) * 14;
    puff(560 + drift, 96, 0.8); puff(760 - drift, 220, 0.6);
    bdHills('#b6e6a0', 350, 22, 0.006, 1.2);
    drawTree(820, 372, 140, 40, 1, 0); drawTree(380, 372, 110, 40, 1, 0);
    bdHills('#9adb84', 380, 12, 0.012, 0.4);
    // the garden shed and a picket fence with flower beds
    inkRect(470, 300, 130, 100, '#ffd1dc', 2.5, 3);
    ink(P2('M456,304 L535,248 L614,304 Z'), '#e0505e', 2.5);
    inkRect(486, 330, 40, 70, '#ff8fb8', 2, 4); ctx.fillStyle = '#ffd84a'; circle(518, 366, 3);
    inkRect(540, 324, 44, 34, '#bfe6ff', 2, 4); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(562, 324); ctx.lineTo(562, 358); ctx.stroke();
    ctx.fillStyle = '#86d070'; ctx.fillRect(0, 396, W, H - 396);
    for (let x = 0; x < W; x += 28) ink(P2(`M${x + 2},404 L${x + 2},366 L${x + 11},356 L${x + 20},366 L${x + 20},404 Z`), '#ffffff', 1.2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 372, W, 5); ctx.fillRect(0, 392, W, 5);
    ctx.fillStyle = '#9a6a48'; ctx.fillRect(0, 404, W, 18);
    for (let i = 0; i < 24; i++) { const x = 16 + i * 40; ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, 410); ctx.lineTo(x, 388); ctx.stroke(); ink(P2(`M${x - 7},${386} L${x - 4},${376} L${x},${384} L${x + 4},${376} L${x + 7},${386} Q${x},${394} ${x - 7},${386} Z`), ['#ff6f9a', '#ffd23a', '#c6a2ff', '#ff9a5a'][i % 4], 1); }
    ctx.fillStyle = '#7ac464'; for (let i = 0; i < 26; i++) ellipse((i * 211) % W, 450 + (i * 37) % 86, 16, 4);
    for (let i = 0; i < 12; i++) flower(40 + i * 80 + (i % 3) * 9, 456 + (i % 2) * 28, 6, ['#ffffff', '#ffd84a', '#ff9ac8'][i % 3], '#ffd84a', 1);
    // the giant oak: trunk, long branch, leaves and blossom
    ink(P2(`M-20,${GY + 10} C40,${GY - 10} 80,${GY - 60} 90,${GY - 160} C100,240 96,120 80,20 L190,20 C186,120 180,250 176,${GY - 150} C176,${GY - 60} 210,${GY - 6} 250,${GY + 10} Z`), BARK, 3);
    ctx.strokeStyle = '#7a4e34'; ctx.lineWidth = 2.5; for (const [x, y0, y1] of [[110, 120, 260], [140, 280, 420], [160, 150, 230], [120, 330, 400]]) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.bezierCurveTo(x - 6, (y0 + y1) / 2, x + 6, (y0 + y1) / 2, x, y1); ctx.stroke(); }
    inkEllipse(136, 300, 10, 15, 0, '#5a3a2a', 1.5);
    ink(RN_BRANCH, BARK, 2.5);
    ink(P2('M330,180 C340,150 360,130 380,120 L384,128 C368,140 352,158 342,184 Z'), BARK, 1.5);
    leafBlob([[30, 80, 70], [130, 70, 66], [220, 96, 56], [90, 150, 50], [300, 140, 40], [380, 116, 34], [560, 134, 40], [640, 140, 36], [690, 160, 30], [470, 140, 30]], '#4cb658');
    for (const [x, y, c] of [[40, 60, '#ffc4dc'], [110, 40, '#ffffff'], [180, 70, '#ffc4dc'], [230, 110, '#ffffff'], [70, 130, '#ffc4dc'], [300, 126, '#ffc4dc'], [390, 106, '#ffffff'], [550, 120, '#ffc4dc'], [620, 130, '#ffffff'], [680, 150, '#ffc4dc'], [150, 100, '#ffc4dc'], [20, 110, '#ffffff']]) blossom(x, y, 9, c);
    // the nest with three chicks, beaks popping open in turn
    if (scene !== 'minigame') for (let i = 0; i < 3; i++) drawChick(400 + i * 30, 150 - (i === 1 ? 4 : 0), 0.85, Math.sin(S.t * 2 + i * 2.1) > 0.4, null, S.t);
    if (!(scene === 'minigame' && SCENES.minigame.g?.type === 'nestbuild')) nest(430, 166, 104);
    // a bird feeder hanging from the branch
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(612, 172); ctx.lineTo(612, 214); ctx.stroke();
    ink(P2('M590,224 L612,206 L634,224 Z'), '#4fa8e0', 1.5); inkRect(596, 224, 32, 26, '#fff6e0', 1.5, 3); ctx.fillStyle = '#c8a050'; ctx.fillRect(598, 238, 28, 10); inkRect(590, 248, 44, 5, '#4fa8e0', 1.2, 2);
    birdbath(880, GY + 18, S.t);
    // blossom petals drifting down
    for (let i = 0; i < 8; i++) {
      const y = 120 + (S.t * 22 + i * 47) % 360, x = 60 + i * 90 + Math.sin(S.t * 1.3 + i) * 26;
      ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 2 + i); ctx.fillStyle = i % 2 ? '#ffc4dc' : '#ffffff'; ellipse(0, 0, 5, 3); ctx.restore();
    }
  };

  // --- Nest Builder: fly down for twigs, then mud, then soft feathers, and keep the squirrel away --------
  const NB_X = 430, NB_Y = 176, NB_W = 210, NB_PUD = [700, 484];
  const NB_LAYERS = [['twig', 'TWIGS', 'Twigs first! They lie in the grass.'], ['mud', 'MUD', 'Now mud, to stick the twigs together! Dip into the puddle.'], ['feather', 'FEATHERS', 'Last, soft feathers! Catch them as they float down.']];
  function nbTwig(x, y, a, len = 46) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2, 0); ctx.moveTo(len * 0.1, 0); ctx.lineTo(len * 0.28, -9); ctx.stroke();
    ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }
  function nbFeather(x, y, a, s = 1, col = '#ffffff') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
    ink(P2('M-20,0 Q-6,-10 20,-2 Q-4,10 -20,0 Z'), col, 1.5);
    ctx.strokeStyle = 'rgba(120,90,140,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-24, 1); ctx.lineTo(18, -1); ctx.stroke();
    ctx.restore();
  }
  function nbMud(x, y, r = 11) { inkCircle(x, y, r, '#6a4628', 1.5); ctx.fillStyle = 'rgba(255,255,255,.25)'; circle(x - r * 0.35, y - r * 0.35, r * 0.3); }
  function drawSquirrel(x, y, s, dir, t, carry, spin = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(spin);
    const wag = Math.sin(t * 9) * 0.15;
    ctx.save(); ctx.rotate(wag); ink(P2('M-14,-6 C-48,-6 -54,-46 -36,-62 C-22,-74 -4,-60 -16,-46 C-26,-36 -20,-20 -8,-14 Z'), '#c8702e', 2); ctx.restore();
    inkEllipse(0, -12, 20, 15, -0.2, '#d07a3a', 2);
    ctx.fillStyle = '#f8dcb0'; ellipse(8, -8, 9, 8);
    inkCircle(18, -26, 12, '#d07a3a', 2);
    ink(P2('M12,-35 L14,-46 L20,-36 Z'), '#d07a3a', 1.5);
    ctx.fillStyle = '#ffffff'; circle(22, -28, 4); ctx.fillStyle = '#1a0a20'; circle(23, -28, 2.4);
    ctx.fillStyle = '#5a2a3a'; circle(30, -23, 2.2);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-8, 4); ctx.moveTo(10, 0); ctx.lineTo(12, 4); ctx.stroke();
    if (carry) nbTwig(30, -16, 0.4, 34);
    ctx.restore();
  }
  // the squirrel climbs the trunk, then scurries along the branch to the nest
  const NB_PATH = [[150, 470], [140, 230], [200, 214], [NB_X - 70, NB_Y - 4]];
  function nbAlong(u) {
    const segs = NB_PATH.slice(1).map((q, i) => Math.hypot(q[0] - NB_PATH[i][0], q[1] - NB_PATH[i][1])), tot = segs.reduce((x, y) => x + y, 0);
    let d = clamp(u, 0, 1) * tot;
    for (let i = 0; i < segs.length; i++) { if (d <= segs[i] || i === segs.length - 1) { const k = clamp(d / segs[i], 0, 1), [x0, y0] = NB_PATH[i], [x1, y1] = NB_PATH[i + 1]; return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, i === 0]; } d -= segs[i]; }
  }
  MG.nestbuild = {
    kind: 'action', title: () => 'Build the Nest', icon: () => '🪺',
    how: () => 'Fly Ruby with the mouse or the arrow keys. Bring twigs, then mud, then feathers to the nest. Bump the squirrel to shoo it away!',
    init(g) {
      const t = g.tier - 1, per = [4, 5, 6][t];
      Object.assign(g, {
        timeLeft: [60, 65, 70][t], px: 480, py: 300, facing: 1, carry: null, per, total: per * 3, built: 0, layer: 0, nag: 0, end: 0,
        twigs: [], feathers: [], spawnT: 0, fspawnT: 0,
        sq: null, sqT: [12, 9, 7][t], sqSpeed: [0.09, 0.11, 0.14][t], shoos: 0, steals: 0,
        gust: 0, gustT: t ? 7 : 1e9, gustDir: 1,
        say: NB_LAYERS[0][2],
      });
      for (let i = 0; i < 3; i++) this.addTwig(g);
    },
    start(g) { speak('The wind blew my nest away! ' + g.say); },
    addTwig(g) { g.twigs.push({ x: rand(250, 640), y: rand(452, 500), a: rand(-0.5, 0.5), bob: rand(0, 6) }); },
    need: g => NB_LAYERS[Math.min(g.layer, 2)][0],
    update(g, dt) {
      g.timeLeft -= dt; g.nag = Math.max(0, g.nag - dt);
      steer(g, dt, 360, 40, W - 40, 90, 490);
      // wind gusts push Ruby and the feathers sideways
      if ((g.gustT -= dt) <= 0) { g.gust = 2.2; g.gustDir = Math.random() < 0.5 ? -1 : 1; g.gustT = rand(7, 10); SFX.whoosh?.(); }
      g.gust = Math.max(0, g.gust - dt);
      const push = g.gust > 0 ? g.gustDir * Math.sin(g.gust / 2.2 * Math.PI) * 140 : 0;
      g.px = clamp(g.px + push * dt, 40, W - 40);
      // things to pick up: twigs in the grass, mud from the puddle, feathers floating down
      while (g.twigs.length < 3) this.addTwig(g);
      if ((g.fspawnT -= dt) <= 0 && g.feathers.length < 3) { g.feathers.push({ x: rand(200, 880), y: 70, a: 0, sw: rand(0, 6), col: pick(['#ffffff', '#ffd8e8', '#e8dcff']) }); g.fspawnT = rand(1.2, 2.2); }
      for (const f of g.feathers) { f.y += 34 * dt; f.x += (Math.sin(S.t * 1.6 + f.sw) * 40 + push * 0.6) * dt; f.a = Math.sin(S.t * 1.6 + f.sw) * 0.5; }
      g.feathers = g.feathers.filter(f => f.y < 500 && f.x > -30 && f.x < W + 30);
      const need = this.need(g);
      if (!g.carry && g.layer < 3) {
        let got = null, wrong = null;
        const tw = g.twigs.find(o => Math.hypot(g.px - o.x, g.py - o.y) < 48);
        const fe = g.feathers.find(o => Math.hypot(g.px - o.x, g.py - o.y) < 50);
        const mud = Math.hypot(g.px - NB_PUD[0], (g.py - NB_PUD[1]) * 1.6) < 70;
        if (tw) { if (need === 'twig') { got = 'twig'; g.twigs.splice(g.twigs.indexOf(tw), 1); } else wrong = 'twig'; }
        else if (fe) { if (need === 'feather') { got = 'feather'; g.feathers.splice(g.feathers.indexOf(fe), 1); } else wrong = 'feather'; }
        else if (mud) { if (need === 'mud') got = 'mud'; else wrong = 'mud'; }
        if (got) { g.carry = got; SFX.pick(); if (got === 'mud') burst(NB_PUD[0], NB_PUD[1], 8, { colors: ['#8a5a30', '#6a4628'] }); }
        else if (wrong && g.nag <= 0) { g.nag = 1.6; floatText(g.px, g.py - 50, `We need ${NB_LAYERS[g.layer][1].toLowerCase()} now!`, '#ffffff', false, 20); }
      }
      // drop it in the nest
      if (g.carry && Math.hypot(g.px - NB_X, g.py - (NB_Y - 10)) < 70) {
        g.carry = null; g.built++; SFX.hit();
        burst(NB_X, NB_Y - 10, 12, { kind: 'star', colors: ['#ffd23f', '#fff6a8'] });
        if (g.built >= (g.layer + 1) * g.per) {
          g.layer++;
          if (g.layer < 3) { g.say = NB_LAYERS[g.layer][2]; speak(g.say); floatText(NB_X, NB_Y - 70, 'Layer done!', '#fff6a8', false, 28); SFX.sparkle(); }
          else { speak('The nest is ready! Look, eggs!'); SFX.sparkle(); burst(NB_X, NB_Y - 20, 30, { kind: 'heart', colors: ['#ff8fc8', '#8ad8ff'] }); }
        }
      }
      // the cheeky squirrel comes for a twig; bump it to shoo it away
      if (!g.sq && g.layer < 3 && (g.sqT -= dt) <= 0) { g.sq = { u: 0, dir: 1, carry: false, fall: 0, vy: 0, x: NB_PATH[0][0], y: NB_PATH[0][1] }; speak('Uh oh, a squirrel! Shoo it away!'); }
      const q = g.sq;
      if (q) {
        if (q.fall > 0) {
          q.fall += dt; q.vy += 900 * dt; q.y += q.vy * dt; q.x -= 120 * dt;
          if (q.y > 560) { g.sq = null; g.sqT = rand(7, 10) - g.tier; }
        } else {
          q.u += q.dir * g.sqSpeed * dt * (q.dir < 0 ? 1.6 : 1);
          [q.x, q.y] = nbAlong(q.u);
          if (Math.hypot(g.px - q.x, g.py - (q.y - 24)) < 52) {
            q.fall = 0.01; q.vy = -300; g.shoos++; SFX.hit(); speak(pick(['Shoo, squirrel!', 'Off you go!', 'Not our twigs!']));
            burst(q.x, q.y - 24, 14, { kind: 'star' }); floatText(q.x, q.y - 70, 'Eek!', '#fff6a8', false, 26);
          } else if (q.u >= 1 && q.dir > 0) {
            q.dir = -1;
            if (g.built > g.layer * g.per && g.layer < 3) { g.built--; g.steals++; q.carry = true; SFX.miss(); floatText(NB_X, NB_Y - 60, 'Hey! He took one!', '#ffb0c4', false, 22); }
          } else if (q.u <= 0 && q.dir < 0) { g.sq = null; g.sqT = rand(5, 8) - g.tier; }
        }
      }
      g.progress = `Nest ${g.built} of ${g.total}`;
      g.score = clamp(g.built / g.total - g.steals * 0.04, 0, 1);
      if (g.layer >= 3) g.end += dt;
      if (g.timeLeft <= 0 || g.end > 3.2) g.done = true;
    },
    draw(g) {
      // the sign: what we need now
      if (g.layer < 3) {
        panel(W / 2 + 10, 64, 340, 64, 18);
        const ix = W / 2 + 52, iy = 96;
        if (g.layer === 0) nbTwig(ix, iy, -0.3, 44); else if (g.layer === 1) nbMud(ix, iy, 15); else nbFeather(ix, iy, -0.3, 1.2);
        outlined(`Bring ${NB_LAYERS[g.layer][1]}`, ix + 30, iy + 2, 28, ['#c8884a', '#a06a3a', '#ff9ac8'][g.layer], 'left');
        for (let i = 0; i < 3; i++) inkCircle(W / 2 + 328, 78 + i * 18, 6, i < g.layer ? '#5adc7a' : i === g.layer ? '#ffd23f' : '#e2d4ef', 1.2);
      }
      // the mud puddle
      inkEllipse(NB_PUD[0], NB_PUD[1], 62, 18, 0, '#7a5030', 2);
      ctx.fillStyle = '#8a6040'; ellipse(NB_PUD[0] - 8, NB_PUD[1] - 3, 44, 9);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(NB_PUD[0] + 18 + Math.sin(S.t * 2) * 4, NB_PUD[1] - 6, 12, 3);
      const need = this.need(g), glow = (x, y, r) => { ctx.fillStyle = `rgba(255,246,168,${0.35 + Math.sin(S.t * 6) * 0.15})`; circle(x, y, r); };
      if (need === 'mud' && !g.carry) glow(NB_PUD[0], NB_PUD[1], 36);
      for (const o of g.twigs) { if (need === 'twig' && !g.carry) glow(o.x, o.y, 30); nbTwig(o.x, o.y + Math.sin(S.t * 2 + o.bob) * 1.5, o.a); }
      for (const f of g.feathers) { if (need === 'feather' && !g.carry) glow(f.x, f.y, 28); nbFeather(f.x, f.y, f.a, 1, f.col); }
      // the nest grows layer by layer
      const b = g.built, per = g.per, k1 = Math.min(b, per) / per, k2 = clamp((b - per) / per, 0, 1), k3 = clamp((b - 2 * per) / per, 0, 1);
      if (b === 0 && g.layer === 0) { ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(NB_X, NB_Y - 6, NB_W / 2, 26, 0, 0, Math.PI); ctx.stroke(); ctx.setLineDash([]); }
      if (k2 > 0 || b >= per) { ctx.fillStyle = mix('#a0703a', '#5a3a1e', k2); ctx.beginPath(); ctx.ellipse(NB_X, NB_Y - 8, NB_W / 2 - 8, 22 + 14 * k2, 0, 0, Math.PI); ctx.fill(); }
      const sticks = Math.round(k1 * 14);
      for (let i = 0; i < sticks; i++) { const u = (i * 0.618) % 1, x = NB_X - NB_W / 2 + 14 + u * (NB_W - 28), y = NB_Y - 4 + Math.sin(u * Math.PI) * 18 * (i % 2 ? 1 : 0.5); nbTwig(x, y, (i % 2 ? 0.35 : -0.35) + Math.sin(i) * 0.2, 52); }
      for (let i = 0; i < Math.round(k2 * 8); i++) nbMud(NB_X - 80 + i * 23, NB_Y - 6 + Math.sin(i * 1.7) * 6, 8);
      if (g.layer >= 3) {
        // eggs, then a wobble, then chicks!
        const e = g.end;
        for (let i = 0; i < 3; i++) {
          const x = NB_X - 36 + i * 36, y = NB_Y - 22 - Math.max(0, 1 - e * 3) * 30;
          if (e < 1.6) { ctx.save(); ctx.translate(x, y); ctx.rotate(e > 0.8 ? Math.sin(e * 30 + i) * 0.25 : 0); inkEllipse(0, 0, 14, 18, 0, '#8ad8ff', 1.5); ctx.fillStyle = '#5ab0e0'; circle(-4, 4, 2); circle(5, -4, 1.6); ctx.restore(); }
          else drawChick(x, y - 4, 1.1, Math.sin(S.t * 4 + i * 2) > 0, 'happy', S.t);
        }
      }
      for (let i = 0; i < Math.round(k3 * 9); i++) nbFeather(NB_X - 92 + i * 23, NB_Y - 14 + (i % 2) * 6, (i % 2 ? 0.4 : -0.4), 0.8, ['#ffffff', '#ffd8e8', '#e8dcff'][i % 3]);
      if (g.layer < 3 && g.carry && Math.sin(S.t * 6) > 0) outlined('⬇', NB_X, NB_Y - 64, 30, '#fff6a8');
      // gust streaks
      if (g.gust > 0) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = 0; i < 7; i++) { const y = 120 + i * 50, x = ((S.t * 700 * g.gustDir + i * 173) % (W + 200) + W + 200) % (W + 200) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 70 * g.gustDir, y + 4); ctx.stroke(); } }
      if (g.sq) drawSquirrel(g.sq.x, g.sq.y, 1.1, g.sq.dir, S.t, g.sq.carry, g.sq.fall ? g.sq.fall * 10 : (nbAlong(g.sq.u)[2] ? -Math.PI / 2 * g.sq.dir : 0));
      drawRobin(g.px, g.py, 1.25, g.facing || 1, S.t, g.carry);
    },
  };

  // --- Bird Song: four birds sing; repeat the growing tune ------------------------------------------
  const SONGBIRDS = [['#ff5a5a', 523, 'red'], ['#4f8fe8', 659, 'blue'], ['#ffd23a', 784, 'yellow'], ['#4fc86a', 1047, 'green']];
  const SB_X = [210, 390, 570, 750], SB_Y = 360;
  // real-sounding birdsong: each syllable is a pure whistle that slides in pitch, with a fast warble on top.
  // Every bird has its own little phrase, centred on its pitch, so the tune game still works by ear.
  // syllables: [start, length, from, to] (times in seconds, pitches as multiples of the bird's note)
  const SB_PHRASES = [
    { syl: [[0, 0.12, 1.0, 1.28], [0.15, 0.17, 1.22, 0.94]], wob: 14, dep: 0.012 },                                   // red: "cheer-up!"
    { syl: [[0, 0.05, 0.9, 1.0], [0.07, 0.05, 0.94, 1.04], [0.14, 0.05, 0.98, 1.08], [0.21, 0.09, 1.02, 1.18]], wob: 34, dep: 0.02 }, // blue: rising trill
    { syl: [[0, 0.09, 0.92, 1.3], [0.12, 0.09, 0.92, 1.3], [0.25, 0.06, 1.12, 1.05]], wob: 26, dep: 0.015 },            // yellow: "sweet-sweet-tsip"
    { syl: [[0, 0.17, 1.3, 0.92], [0.2, 0.17, 0.92, 1.22]], wob: 9, dep: 0.01 },                                       // green: "tee-oo-ee" whistle
  ];
  function birdPhrase(b) {
    if (typeof AC === 'undefined' || !AC || muted) return;
    const base = SONGBIRDS[b][1] * 1.5, ph = SB_PHRASES[b], t0 = AC.currentTime + 0.01;
    for (const [st, len, f0, f1] of ph.syl) {
      const t = t0 + st, o = AC.createOscillator(), gn = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(base * f0, t);
      o.frequency.exponentialRampToValueAtTime(base * f1, t + len);
      lfo.frequency.value = ph.wob; lg.gain.value = base * ph.dep;
      lfo.connect(lg).connect(o.frequency);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.1, t + Math.min(0.02, len * 0.3));
      gn.gain.setValueAtTime(0.1, t + len * 0.6);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(gn).connect(AC.destination);
      // a soft breathy overtone so it sounds like a bird, not a beep
      const o2 = AC.createOscillator(), g2 = AC.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(base * f0 * 2, t); o2.frequency.exponentialRampToValueAtTime(base * f1 * 2, t + len);
      g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.018, t + 0.015); g2.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o2.connect(g2).connect(AC.destination);
      for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + len + 0.03); }
    }
  }
  function songBird(x, y, s, col, lit, t, dir = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir * (lit ? 1.12 : 1), s * (lit ? 1.12 : 1));
    if (lit) { ctx.fillStyle = 'rgba(255,246,168,.55)'; circle(0, -42, 62); }
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-12, 4); ctx.moveTo(10, -6); ctx.lineTo(12, 4); ctx.stroke();
    ink(P2('M-30,-40 L-62,-58 L-58,-30 Z'), mix(col, '#3a2050', 0.3), 1.5);
    inkCircle(0, -40, 38, col, 2);
    ctx.fillStyle = mix(col, '#ffffff', 0.55); ellipse(8, -28, 22, 18);
    ink(P2(`M-26,-46 Q-6,${-70 + (lit ? Math.sin(t * 30) * 8 : 0)} 14,-44 Q-4,-30 -26,-46 Z`), mix(col, '#3a2050', 0.2), 1.5);
    ctx.fillStyle = '#ffffff'; circle(14, -54, 8); ctx.fillStyle = '#1a0a20'; circle(16, -54, 4.5); ctx.fillStyle = '#ffffff'; circle(17.5, -56, 1.5);
    if (lit) { ink(P2('M32,-52 L52,-58 L34,-46 Z'), '#ffa22a', 1.2); ink(P2('M32,-42 L50,-34 L34,-46 Z'), '#ff8a1a', 1.2); } else ink(P2('M32,-50 L48,-45 L32,-40 Z'), '#ffa22a', 1.2);
    ctx.fillStyle = 'rgba(255,120,150,.5)'; ellipse(22, -40, 5, 3);
    ctx.restore();
  }
  MG.birdsong = {
    kind: 'learn', title: () => 'Bird Song', icon: () => '🎶',
    how: () => 'Listen to the birds sing a little tune. Then sing it back: click the birds in the same order, or press 1, 2, 3, 4.',
    init(g) {
      const lens = [[2, 3, 4], [3, 4, 5], [3, 4, 5, 6]][g.tier - 1];
      const seq = []; for (let i = 0; i < lens[lens.length - 1]; i++) { let b; do b = randInt(0, 3); while (i > 0 && b === seq[i - 1] && Math.random() < 0.6); seq.push(b); }
      Object.assign(g, { lens, seq, round: 0, total: 0, tries: 0, lit: {}, say: 'Listen to the birds, then sing it back!' });
      this.listen(g, 1.2);
    },
    start(g) { speak('Listen carefully!'); },
    listen(g, delay = 0.6) { Object.assign(g, { state: 'listen', si: -1, st: -delay, input: 0 }); },
    len: g => g.lens[g.round],
    sing(g, b, dur) { g.lit[b] = dur; birdPhrase(b); },
    update(g, dt, id) {
      tickDown(g.lit, dt);
      const on = g.tier === 3 ? 0.45 : 0.55, gap = 0.2;
      if (g.state === 'listen') {
        g.st += dt;
        const i = Math.floor(g.st / (on + gap));
        if (g.st >= 0 && i !== g.si) {
          g.si = i;
          if (i < this.len(g)) this.sing(g, g.seq[i], on); else { g.state = 'repeat'; g.input = 0; speak('Your turn!'); }
        }
      } else if (g.state === 'repeat') {
        if (id === 'again') { this.listen(g, 0.3); return; }
        let b = keyPick(4);
        if (b < 0 && pointer.clicked) b = SB_X.findIndex(x => Math.hypot(pointer.x - x, pointer.y - (SB_Y - 50)) < 70);
        if (b >= 0) {
          this.sing(g, b, 0.3);
          if (b === g.seq[g.input]) {
            g.input++;
            if (g.input >= this.len(g)) { g.total += g.tries ? 0.5 : 1; g.state = 'yay'; g.st = 0; setTimeout(() => SFX.sparkle(), 250); burst(W / 2, 250, 26); speak(pick(['Beautiful singing!', 'Tweet tweet! Perfect!', 'You got the whole tune!'])); }
          } else {
            g.tries++; g.state = 'oops'; g.st = 0; setTimeout(() => SFX.miss(), 200);
            speak(g.tries >= 2 ? "Oops! That's okay. Let's try a new tune." : 'Oops! Listen again.');
          }
        }
      } else if ((g.st += dt) > 1.6) {
        if (g.state === 'yay' || g.tries >= 2) {
          g.round++; g.tries = 0;
          if (g.round >= g.lens.length) { g.done = true; return; }
        }
        this.listen(g);
      }
      g.progress = `Tune ${Math.min(g.round + 1, g.lens.length)} of ${g.lens.length}`;
      g.score = g.total / g.lens.length;
    },
    draw(g) {
      const L = this.len(g);
      panel(W / 2 - 300, 70, 600, 96, 22);
      const msg = { listen: 'Listen to the birds...', repeat: 'Your turn! Sing it back.', yay: 'Lovely song!', oops: 'Oops!' }[g.state];
      outlined(msg, W / 2, 102, 30, g.state === 'repeat' ? '#5adc7a' : g.state === 'oops' ? '#ff8f9a' : '#ffd23a');
      for (let i = 0; i < L; i++) {
        const x = W / 2 - (L - 1) * 20 + i * 40, done = g.state === 'repeat' ? i < g.input : g.state === 'listen' ? i <= g.si : g.state === 'yay';
        const c = (g.state === 'listen' && i <= g.si) || g.state === 'yay' ? SONGBIRDS[g.seq[i]][0] : done ? '#5adc7a' : '#e2d4ef';
        inkCircle(x, 142, 10, c, 1.5);
      }
      // the branch the birds sit on
      ctx.lineCap = 'round';
      ctx.strokeStyle = OL; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(40, SB_Y + 18); ctx.bezierCurveTo(300, SB_Y - 6, 640, SB_Y + 26, 930, SB_Y + 4); ctx.stroke();
      ctx.strokeStyle = BARK; ctx.lineWidth = 24; ctx.stroke();
      leafBlob([[60, SB_Y + 6, 22], [300, SB_Y + 22, 18], [480, SB_Y + 2, 16], [660, SB_Y + 30, 18], [900, SB_Y - 4, 22]], '#4cb658');
      for (const [x, y] of [[70, SB_Y - 8], [490, SB_Y - 8], [890, SB_Y - 18]]) blossom(x, y, 8, '#ffc4dc');
      SONGBIRDS.forEach(([col], i) => {
        const x = SB_X[i], lit = !!g.lit[i];
        songBird(x, SB_Y + 6, 1.3, col, lit, S.t, i < 2 ? 1 : -1);
        if (lit) { const k = 1 - g.lit[i] / 0.55; outlined('♪', x + (i < 2 ? 40 : -40), SB_Y - 120 - k * 30, 30, col); }
        inkCircle(x, SB_Y + 62, 16, '#ffffff', 1.5); text(String(i + 1), x, SB_Y + 63, 18, '#5a2a6e', 'center', 800);
      });
      if (g.state === 'repeat') button('again', W / 2 - 90, 450, 180, 50, 'Hear it again', { icon: '👂', color: '#9a6ae0', size: 17 });
    },
  };

  restage('robin', {
    bg: 'robin_bg',
    games: [['nestbuild', 'feather', {}], ['birdsong', 'berry', {}]],
    intro: ['N:Tweet! Oh no, the wind blew my nest right out of the oak, and my eggs are coming soon!', 'N:Fly with me! Twigs first, then mud, then soft feathers. And watch out for that cheeky squirrel!', 'A:determined:Let\'s build the coziest nest ever!'],
    mid: ["N:Tweet tweet! My babies hatched in the coziest nest! Now it's song time!", 'N:Listen to my friends sing a tune, then sing it back the same way.', 'A:excited:I love singing!'],
    outro: ['N:Soft feathers for you, and some berries too. Feathers make wonderful wings!', 'A:happy:Bye-bye, baby birds! Sing loud!'],
  });

  // =====================================================================================
  // 6. GLITTERING CREEK: a creek sparkling with crystals, mossy rocks and a little waterfall
  // =====================================================================================
  const GEM_COLS = ['#ff8fd0', '#7fe8ff', '#b892ff', '#8affc8', '#ffe36b'];
  function mossRock(x, y, rx, ry, t = 0) {
    inkEllipse(x, y, rx, ry, 0, '#a09cc0', 2);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.35, ry * 0.25);
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#6cc070'; for (let i = 0; i < 5; i++) circle(x - rx + (i + 0.5) * rx * 0.4, y - ry * 0.9 + Math.sin(i * 2) * ry * 0.15, ry * 0.45);
    ctx.restore();
  }
  function fern(x, y, s, dir, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(-0.5 + Math.sin(t * 1.2 + x) * 0.05);
    ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -60, 60, -80); ctx.stroke();
    for (let k = 1; k < 9; k++) {
      const u = k / 9, px = 40 * u * u + 20 * u, py = -60 * u - 20 * u * u, l = 18 * (1 - u * 0.7);
      ink(P2(`M${px},${py} q${-l * 0.4},${-l} ${-l * 0.2},${-l * 1.1} q${l * 0.4},${l * 0.5} ${l * 0.2},${l * 1.1} Z`), '#4cb658', 0.8);
      ink(P2(`M${px},${py} q${l},${l * 0.1} ${l * 1.1},${l * 0.3} q${-l * 0.6},${l * 0.3} ${-l * 1.1},${-l * 0.3} Z`), '#5ac85a', 0.8);
    }
    ctx.restore();
  }
  const CC_CREEK = P2('M0,372 C200,344 380,326 480,326 C600,326 760,352 960,374 L960,438 C760,424 600,414 480,416 C340,416 200,430 0,444 Z');
  BACKDROPS.crystalcreek_bg = () => {
    bdSky('#86d6ff', '#f8e8ff');
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(60 + k * 90, 0); ctx.lineTo(120 + k * 90, 0); ctx.lineTo(420 + k * 150, H); ctx.lineTo(320 + k * 150, H); ctx.fill(); }
    const drift = Math.sin(S.t * 0.15) * 14;
    puff(140 + drift, 100, 0.8); puff(820 - drift, 90, 0.9);
    bdHills('#a6dcc4', 300, 20, 0.007, 0.3);
    for (const x of [60, 150, 760, 850, 930]) drawTree(x, 316, 130 + (x % 40), 40, 1, 0);
    bdHills('#8fd4a0', 336, 12, 0.012, 1);
    // the cliff and its little waterfall
    ink(P2('M250,340 C262,260 296,196 356,166 C420,140 540,136 604,158 C664,180 702,262 712,340 Z'), '#a492c8', 3);
    ctx.strokeStyle = 'rgba(80,60,120,.3)'; ctx.lineWidth = 3;
    for (const [y, w] of [[200, 120], [240, 170], [280, 200], [312, 210]]) { ctx.beginPath(); ctx.moveTo(480 - w, y); ctx.quadraticCurveTo(480, y + 10, 480 + w, y - 4); ctx.stroke(); }
    leafBlob([[340, 172, 22], [380, 152, 24], [420, 144, 20], [560, 146, 22], [600, 158, 22], [636, 180, 20]], '#5ab85a');
    const wf = ctx.createLinearGradient(0, 150, 0, 330); wf.addColorStop(0, '#e8fbff'); wf.addColorStop(1, '#8ae0ff');
    ink(P2('M448,150 C446,220 440,280 432,330 L528,330 C520,280 514,220 512,150 Z'), wf, 2);
    ctx.save(); ctx.clip(P2('M448,150 C446,220 440,280 432,330 L528,330 C520,280 514,220 512,150 Z'));
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.setLineDash([18, 22]); ctx.lineDashOffset = -S.t * 140;
    for (let x = 446; x < 520; x += 12) { ctx.beginPath(); ctx.moveTo(x + 2, 150); ctx.lineTo(x - 4 + (x - 480) * 0.15, 330); ctx.stroke(); }
    ctx.setLineDash([]); ctx.restore();
    crystalCluster(318, 318, 0.8, ['#ff8fd0', '#b892ff', '#7fe8ff', '#ffb3e6', '#8affc8'], S.t);
    crystalCluster(650, 322, 0.7, ['#7fe8ff', '#8affc8', '#b892ff', '#ffe36b', '#ff8fd0'], S.t + 1);
    // banks and the creek
    ctx.fillStyle = '#8fd890'; ctx.fillRect(0, 336, W, H - 336);
    const cg = ctx.createLinearGradient(0, 326, 0, 444); cg.addColorStop(0, '#9aeeff'); cg.addColorStop(1, '#3aa8e8');
    ctx.strokeStyle = '#d8f0ff'; ctx.lineWidth = 10; ctx.stroke(CC_CREEK);
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.stroke(CC_CREEK);
    ctx.fillStyle = cg; ctx.fill(CC_CREEK);
    ctx.save(); ctx.clip(CC_CREEK);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 6; i++) ellipse(430 + i * 20 + Math.sin(S.t * 3 + i) * 4, 334, 22, 6);
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1, k = ((S.t * 0.12 + i * 0.13) % 1), x = 480 + side * k * 520, y = 350 + (i * 17) % 70 + k * 16;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * 30, y + 2); ctx.stroke();
    }
    for (let i = 0; i < 22; i++) twinkle((i * 89) % W, 340 + (i * 41) % 96, 4 + (i % 3), Math.sin(S.t * 3 + i * 1.7), '#ffffff');
    ctx.restore();
    mossRock(210, 396, 34, 18); mossRock(560, 386, 26, 14); mossRock(740, 404, 30, 16);
    // pebbly front bank with crystals, ferns and glowing mushrooms
    for (let i = 0; i < 40; i++) inkEllipse((i * 137) % W, 456 + (i * 53) % 80, 6 + (i % 3) * 2, 4, 0, ['#e8e0f4', '#ffd8ec', '#d8f0ff', '#e0ffe8'][i % 4], 0.8);
    crystalCluster(60, 470, 1.15, ['#ff8fd0', '#7fe8ff', '#b892ff', '#ffb3e6', '#8affc8'], S.t + 2);
    crystalCluster(904, 478, 1.05, ['#b892ff', '#8affc8', '#7fe8ff', '#ff8fd0', '#ffe36b'], S.t + 3);
    crystalCluster(150, 360, 0.5, GEM_COLS, S.t); crystalCluster(840, 362, 0.55, GEM_COLS, S.t + 4); crystalCluster(470, 470, 0.45, ['#7fe8ff', '#ff8fd0', '#b892ff', '#8affc8', '#ffe36b'], S.t + 5);
    fern(20, 360, 0.9, 1, S.t); fern(950, 364, 0.9, -1, S.t); fern(380, 350, 0.6, 1, S.t);
    for (const [x, y] of [[130, 500], [600, 500], [820, 520]]) { ctx.fillStyle = `rgba(150,255,230,${0.25 + 0.15 * Math.sin(S.t * 2 + x)})`; circle(x, y - 10, 18); inkRect(x - 3, y - 10, 6, 12, '#fff6e0', 1, 2); inkEllipse(x, y - 12, 11, 6, 0, '#7fe8ff', 1.2); }
    // glitter in the air
    for (let i = 0; i < 26; i++) twinkle((i * 151 + Math.sin(S.t * 0.5 + i) * 10) % W, 90 + (i * 67) % 380, 3 + (i % 3), Math.sin(S.t * 2.2 + i * 2.3), ['#ffffff', '#fff6a8', '#ffc4f0'][i % 3]);
  };

  // --- Otter Slide: slide down the creek, steer to grab crystals and dodge rocks and logs ------------
  function otterTop(x, y, s, lean, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean); ctx.scale(s, s);
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 16, -20); ctx.quadraticCurveTo(d * 34, -54, d * (46 + Math.sin(t * 8) * 4), -84); ctx.stroke(); }
    ink(P2('M-8,-28 Q0,-70 8,-28 Z'), '#6a4028', 1.5);
    inkEllipse(-24, 14, 8, 12, 0.6, '#6a4028', 1.5); inkEllipse(24, 14, 8, 12, -0.6, '#6a4028', 1.5);
    inkEllipse(0, 0, 23, 34, 0, '#8a5a3a', 2);
    ctx.fillStyle = '#a8784e'; ellipse(0, -4, 12, 22);
    inkCircle(-14, 26, 6, '#6a4028', 1.2); inkCircle(14, 26, 6, '#6a4028', 1.2);
    inkCircle(0, 36, 19, '#8a5a3a', 2);
    ctx.fillStyle = '#e8cca8'; ellipse(0, 43, 12, 9);
    ctx.fillStyle = '#ffffff'; circle(-8, 32, 4.5); circle(8, 32, 4.5); ctx.fillStyle = '#1a0a20'; circle(-8, 33, 2.6); circle(8, 33, 2.6);
    ctx.fillStyle = '#3a2028'; ellipse(0, 40, 4, 3);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); for (const d of [-1, 1]) { ctx.moveTo(d * 6, 44); ctx.lineTo(d * 20, 41); ctx.moveTo(d * 6, 46); ctx.lineTo(d * 19, 48); } ctx.stroke();
    ctx.restore();
  }
  function gem(x, y, r, col, t) {
    ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(x, y, r * 1.6);
    ink(ptsPath(polyPts(6, x, y, r, Math.PI / 6)), col, 1.8);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill(ptsPath(polyPts(6, x - r * 0.15, y - r * 0.15, r * 0.45, Math.PI / 6)));
    twinkle(x + r * 0.7, y - r * 0.8, r * 0.45, 0.6 + 0.4 * Math.sin(t * 6 + x), '#ffffff');
  }
  const OS_L = 230, OS_R = 730;
  MG.otterslide = {
    kind: 'action', title: () => 'Otter Slide', icon: () => '🦦',
    how: () => 'Wheee! Slide down the creek with Otto. Steer left and right with the arrows or the mouse. Grab the crystals, and dodge the rocks and logs!',
    init(g) {
      const t = g.tier - 1;
      Object.assign(g, { timeLeft: 35, px: 480, py: 170, facing: 1, lean: 0, speed: [200, 235, 270][t], dist: 0, things: [], spawnT: 0.6, got: 0, bumps: 0, target: [15, 20, 24][t], inv: 0, say: 'Grab the crystals! Dodge the rocks and logs!' });
    },
    start(g) { speak(g.say); },
    spawn(g) {
      const r = Math.random(), y = H + 50;
      if (r < 0.5) { const x = rand(OS_L + 40, OS_R - 40), n = Math.random() < 0.35 ? 3 : 1; for (let k = 0; k < n; k++) g.things.push({ kind: 'gem', x, y: y + k * 60, col: pick(GEM_COLS) }); } else if (r < 0.82 || g.tier === 1) g.things.push({ kind: 'rock', x: rand(OS_L + 40, OS_R - 40), y, rx: rand(26, 36) });
      else { const w = rand(140, 190); g.things.push({ kind: 'log', x: Math.random() < 0.5 ? OS_L + w / 2 - 10 : OS_R - w / 2 + 10, y, w }); }
    },
    update(g, dt) {
      g.timeLeft -= dt; g.inv = Math.max(0, g.inv - dt);
      const v = g.speed * (g.inv > 0 ? 0.55 : 1) * (1 + (35 - g.timeLeft) / 140);
      g.dist += v * dt;
      const bx = g.px;
      if (goLeft()) g.px -= 380 * dt;
      if (goRight()) g.px += 380 * dt;
      if (!goLeft() && !goRight() && pointerMoved(g)) { const d = pointer.x - g.px; g.px += clamp(d, -420 * dt, 420 * dt); }
      g.px = clamp(g.px, OS_L + 34, OS_R - 34);
      g.lean = lerp(g.lean, clamp((g.px - bx) / Math.max(dt, 1e-3) / 900, -0.35, 0.35), Math.min(1, dt * 10));
      if ((g.spawnT -= dt) <= 0) { this.spawn(g); g.spawnT = rand(0.45, 0.75) * [1.1, 1, 0.9][g.tier - 1]; }
      for (const o of g.things) o.y -= v * dt;
      g.things = g.things.filter(o => {
        if (o.y < -60) return false;
        if (o.kind === 'gem' && Math.hypot(o.x - g.px, o.y - (g.py + 20)) < 46) {
          g.got++; SFX.hit(); burst(o.x, o.y, 10, { colors: [o.col, '#ffffff'] }); floatText(o.x, o.y - 20, '+1', o.col, false, 22); return false;
        }
        const hitRock = o.kind === 'rock' && Math.hypot(o.x - g.px, o.y - (g.py + 10)) < o.rx + 22;
        const hitLog = o.kind === 'log' && Math.abs(o.y - (g.py + 10)) < 36 && Math.abs(o.x - g.px) < o.w / 2 + 16;
        if ((hitRock || hitLog) && g.inv <= 0) {
          g.inv = 1.2; g.bumps++; SFX.miss(); floatText(g.px, g.py + 70, 'Bonk!', '#ffb0c4', false, 26);
          if (g.got > 0) { g.got--; floatText(g.px + 40, g.py + 40, '-1', '#ffb0c4', false, 20); }
        }
        return true;
      });
      g.progress = `Crystals ${g.got} of ${g.target}`;
      g.score = clamp(g.got / g.target, 0, 1);
      if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      // grassy banks scrolling by
      ctx.fillStyle = '#7fd08a'; ctx.fillRect(0, 0, W, H);
      const off = g.dist;
      ctx.fillStyle = '#6cc070'; for (let i = 0; i < 30; i++) ellipse((i * 211) % W, ((i * 97 - off) % (H + 40) + H + 40) % (H + 40) - 20, 22, 6);
      const edge = (side, y) => (side < 0 ? OS_L : OS_R) + Math.sin((y + off) * 0.012) * 14 * side;
      ctx.beginPath(); ctx.moveTo(edge(-1, 0), 0);
      for (let y = 0; y <= H; y += 20) ctx.lineTo(edge(-1, y), y);
      for (let y = H; y >= 0; y -= 20) ctx.lineTo(edge(1, y), y);
      ctx.closePath();
      const wg = ctx.createLinearGradient(OS_L, 0, OS_R, 0); wg.addColorStop(0, '#5ac0f0'); wg.addColorStop(0.5, '#8ae4ff'); wg.addColorStop(1, '#5ac0f0');
      ctx.strokeStyle = '#e8f8ff'; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = wg; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 16; i++) { const x = OS_L + 30 + (i * 137) % (OS_R - OS_L - 60), y = ((i * 71 - off * 1.0) % H + H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 26); ctx.stroke(); }
      for (let i = 0; i < 14; i++) twinkle(OS_L + (i * 97) % (OS_R - OS_L), ((i * 53 - off) % H + H) % H, 4, Math.sin(S.t * 4 + i), '#ffffff');
      ctx.restore();
      // crystals and ferns on the banks
      for (let i = 0; i < 6; i++) {
        const y = ((i * 190 - off) % 1140 + 1140) % 1140 - 80, side = i % 2 ? 1 : -1, x = side < 0 ? 110 + (i % 3) * 20 : 850 - (i % 3) * 20;
        if (i % 3 === 0) fern(x + side * 30, y + 60, 0.9, -side, S.t); else crystalCluster(x, y + 60, 0.8, GEM_COLS.slice(i % 3).concat(GEM_COLS), S.t + i);
        mossRock(side < 0 ? 40 : 920, ((i * 230 + 90 - off) % 1380 + 1380) % 1380 - 60, 30, 18);
      }
      // things in the water
      for (const o of g.things) {
        if (o.kind === 'gem') gem(o.x, o.y, 18, o.col, S.t);
        else if (o.kind === 'rock') { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.x, o.y + 6, o.rx + 8, 0.2, Math.PI - 0.2, true); ctx.stroke(); mossRock(o.x, o.y, o.rx, o.rx * 0.75); }
        else {
          inkRect(o.x - o.w / 2, o.y - 15, o.w, 30, '#a0683a', 2.5, 15);
          ctx.strokeStyle = 'rgba(90,50,30,.5)'; ctx.lineWidth = 2; for (let k = -o.w / 2 + 20; k < o.w / 2 - 20; k += 22) { ctx.beginPath(); ctx.moveTo(o.x + k, o.y - 8); ctx.lineTo(o.x + k + 14, o.y - 6); ctx.stroke(); }
          inkEllipse(o.x + o.w / 2 - 8, o.y, 8, 14, 0, '#e8c08a', 1.5); ctx.fillStyle = '#5ac85a'; circle(o.x - o.w / 4, o.y - 14, 6);
        }
      }
      if (!(g.inv > 0 && Math.sin(S.t * 30) > 0)) otterTop(g.px, g.py, 1.25, -g.lean, S.t);
      ctx.fillStyle = 'rgba(48,24,72,.6)'; rrect(16, H - 64, 190, 48, 20, 'rgba(48,24,72,.6)');
      gem(44, H - 40, 13, '#7fe8ff', S.t); text(`${g.got} crystals`, 66, H - 39, 19, '#fff', 'left', 700);
    },
  };

  // --- Colour Mixing: drop two colours into the crystal to make the one Otto asks for -------------------
  const PAINTS = { red: '#ff4040', yellow: '#ffd23a', blue: '#3a7ff0', white: '#ffffff', black: '#3a3448' };
  const MIXES = { 'red+yellow': ['orange', '#ff9a2a'], 'blue+yellow': ['green', '#4cc85a'], 'blue+red': ['purple', '#9a4ae0'], 'red+white': ['pink', '#ff9ac8'], 'blue+white': ['light blue', '#9ad0ff'], 'black+white': ['grey', '#a09cb0'] };
  const MIX_TARGETS = [['orange', 'green', 'purple'], ['orange', 'green', 'purple', 'pink', 'light blue'], ['orange', 'green', 'purple', 'pink', 'light blue', 'grey']];
  const MIX_POTS = [['red', 'yellow', 'blue'], ['red', 'yellow', 'blue', 'white'], ['red', 'yellow', 'blue', 'white', 'black']];
  function mixResult(a, b) {
    if (a === b) return [a, PAINTS[a]];
    const k = [a, b].sort().join('+');
    if (MIXES[k]) return MIXES[k];
    const other = a === 'white' || a === 'black' ? b : a;
    if (a === 'white' || b === 'white') return [`light ${other}`, mix(PAINTS[other], '#ffffff', 0.5)];
    if (a === 'black' || b === 'black') return [`dark ${other}`, mix(PAINTS[other], '#1a1020', 0.45)];
    return ['muddy brown', '#8a6a4a'];
  }
  const recipeOf = name => Object.keys(MIXES).find(k => MIXES[k][0] === name).split('+');
  function paintPot(x, y, col, name) {
    inkEllipse(x, y + 34, 38, 9, 0, mix(col, '#5b3f73', 0.2), 2);
    ink(P2(`M${x - 38},${y - 10} L${x - 34},${y + 34} Q${x},${y + 46} ${x + 34},${y + 34} L${x + 38},${y - 10} Z`), '#e8e4f4', 2.5);
    inkEllipse(x, y - 10, 38, 10, 0, col, 2);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(x - 14, y - 12, 10, 3);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x + 26, y - 4, 6, 10, 0, 0, Math.PI); ctx.fill();
    rrect(x - 32, y + 4, 64, 22, 8, col === '#ffffff' ? '#f0eaf8' : col);
    text(name, x, y + 15.5, 15, name === 'white' || name === 'yellow' ? '#5a2a6e' : '#ffffff', 'center', 800);
  }
  MG.colourmix = {
    kind: 'learn', title: () => 'Colour Mixing', icon: () => '🎨',
    how: () => 'Otto asks for a colour. Pick TWO colours to drop into the magic crystal and mix them! Click the pots, or press their numbers.',
    init(g) {
      const tg = MIX_TARGETS[g.tier - 1], rounds = g.tier === 1 ? 5 : 6;
      Object.assign(g, { round: 0, rounds, total: 0, pots: MIX_POTS[g.tier - 1], order: [...shuffle(tg), ...shuffle(tg)].slice(0, rounds), shake: {} });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const name = g.order[g.round], col = Object.values(MIXES).find(m => m[0] === name)[1];
      Object.assign(g, { want: [name, col], a: null, b: null, tries: 0, state: 'pick', t2: 0, res: null });
      g.say = `Can you make ${name}? Pick two colours to mix!`;
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      tickDown(g.shake, dt);
      if (g.state === 'pick') {
        const i = idPick(id, 'pot:', g.pots.length);
        if (i >= 0 && i < g.pots.length) {
          const p = g.pots[i]; tone(500 + i * 90, 0.12, 'sine', 0.08, 0, 300);
          if (g.a == null) g.a = p; else { g.b = p; g.state = 'mix'; g.t2 = 0; g.res = mixResult(g.a, g.b); }
        }
      } else if (g.state === 'mix') {
        g.t2 += dt;
        if (g.t2 > 1.2) {
          if (g.res[0] === g.want[0]) {
            g.total += [1, 0.6, 0.3, 0][Math.min(3, g.tries)]; g.state = 'yay'; g.t2 = 0; SFX.sparkle(); burst(520, 250, 30, { colors: [g.want[1], '#ffffff', '#fff6a8'] });
            speak(`${g.a} and ${g.b} make ${g.res[0]}! You did it!`);
          } else {
            g.tries++; g.state = 'oops'; g.t2 = 0; SFX.miss();
            speak(`${g.a} and ${g.b} make ${g.res[0]}. We need ${g.want[0]}. Try again!`);
          }
        }
      } else if ((g.t2 += dt) > (g.state === 'yay' ? 2.4 : 2.6)) {
        if (g.state === 'yay') { g.round++; if (g.round >= g.rounds) { g.done = true; return; } this.next(g); } else Object.assign(g, { a: null, b: null, res: null, state: 'pick' });
      }
      g.progress = `Colour ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      // what Otto wants
      panel(40, 70, 270, 200, 24);
      text('Otto wants...', 175, 96, 18, '#8a5aa0', 'center', 700);
      crystal(175, 222, 100, 64, g.want[1]);
      twinkle(196, 140, 8, 0.6 + 0.4 * Math.sin(S.t * 4), '#ffffff');
      outlined(g.want[0], 175, 246, 30, g.want[1] === '#ffffff' ? '#e8e0f4' : g.want[1]);
      drawCritter('Otto the Otter', 110, 492, 0.62, 1);
      // the magic mixing crystal
      const cx = 600, cy = 322, mixing = g.state !== 'pick';
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.1 * Math.sin(S.t * 3)})`; circle(cx, cy - 90, 120);
      const shape = P2(`M${cx - 70},${cy} L${cx - 70},${cy - 130} L${cx},${cy - 190} L${cx + 70},${cy - 130} L${cx + 70},${cy} Z`);
      ctx.fillStyle = 'rgba(240,250,255,.75)'; ctx.fill(shape);
      ctx.save(); ctx.clip(shape);
      const k = g.state === 'mix' ? clamp(g.t2 / 1.1, 0, 1) : 1;
      if (g.a && !g.b) { ctx.fillStyle = PAINTS[g.a]; ctx.fillRect(cx - 80, cy - 70, 160, 80); }
      if (g.b) {
        const level = lerp(70, 150, k);
        ctx.fillStyle = PAINTS[g.a]; ctx.fillRect(cx - 80, cy - level, 80, level + 10);
        ctx.fillStyle = PAINTS[g.b]; ctx.fillRect(cx, cy - level, 80, level + 10);
        ctx.globalAlpha = mixing ? k : 0; ctx.fillStyle = g.res[1]; ctx.fillRect(cx - 80, cy - level, 160, level + 10); ctx.globalAlpha = 1;
        if (g.state === 'mix') { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy - 60, 30, S.t * 8, S.t * 8 + 4); ctx.stroke(); }
      }
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(cx - 70, cy - 200, 26, 210);
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 3.5; ctx.stroke(shape);
      // the sum so far: a + b = ?
      const sw = (x, col) => inkCircle(x, 82 + 12, 18, col || '#f4ecff', 1.5);
      darkPanel(cx - 170, 66, 340, 56, 24);
      sw(cx - 110, g.a && PAINTS[g.a]); text('+', cx - 55, 94, 30, '#fff', 'center', 800);
      sw(cx, g.b && PAINTS[g.b]); text('=', cx + 55, 94, 30, '#fff', 'center', 800);
      if (g.res && g.state !== 'mix') sw(cx + 110, g.res[1]); else text('?', cx + 110, 95, 28, '#ffe9a0', 'center', 800);
      if (g.state === 'yay' || g.state === 'oops') {
        const msg = `${g.a} + ${g.b} = ${g.res[0]}!`;
        darkPanel(cx - 200, 330, 400, 46, 20); text(msg, cx, 353, 21, g.state === 'yay' ? '#a6f0b8' : '#ffd0d8', 'center', 700);
      } else text(g.state === 'mix' ? 'Mixing...' : g.a ? 'Now pick another colour!' : 'Pick a colour!', cx, 353, 20, '#5a2a6e', 'center', 700);
      // hint after two misses: the right pots sparkle
      const hint = g.tries >= 2 ? recipeOf(g.want[0]) : [];
      const n = g.pots.length, pw = 116, gap = 16, x0 = cx - (n * pw + (n - 1) * gap) / 2;
      g.pots.forEach((p, i) => {
        const x = x0 + i * (pw + gap);
        button(`pot:${i}`, x, 392, pw, 128, '', { color: hint.includes(p) ? '#ffd23f' : '#c8b8e8', on: g.state === 'pick', key: String(i + 1) });
        paintPot(x + pw / 2, 446, PAINTS[p], p);
        if (hint.includes(p)) twinkle(x + pw - 16, 404, 9, 0.6 + 0.4 * Math.sin(S.t * 6), '#ffffff');
      });
    },
  };

  restage('crystalcreek', {
    bg: 'crystalcreek_bg',
    games: [['otterslide', 'crystal', {}], ['colourmix', 'shell', {}]],
    intro: ["N:See the sparkles in the water? Those are river crystals! Let's slide down the creek and grab them!", 'A:excited:Wheee! An otter slide!', 'N:Steer around the rocks and logs, or you might drop one!'],
    mid: ['N:Look! When I drop two crystals in the water, their colours MIX together.', 'N:Can you make the colour I ask for?', 'A:thinking:Like mixing paint! Red and yellow make...'],
    outro: ["N:Otters always share. Here's your half of the crystals, and some pretty shells!", 'A:happy:They sparkle just like the creek!'],
  });
}
