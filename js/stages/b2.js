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

  // --- Boot Stomp: puddles pop up in a grid; stomp them before they dry. Not the snails! -------
  const BOOT = P2('M-18,-72 L18,-72 L18,-20 C36,-18 48,-10 48,0 L-22,0 C-24,-22 -21,-50 -18,-72 Z');
  function drawBoot(x, y, s, col = '#ffd23a') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ink(BOOT, col, 2.5);
    ctx.fillStyle = '#ff8a3a'; ctx.fillRect(-18, -66, 36, 7);
    inkRect(-25, -6, 76, 10, '#5a4a6a', 2, 4);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-8, -40, 4, 16);
    ctx.restore();
  }
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
  const splashSound = () => { tone(320, 0.18, 'sine', 0.12, 0, 90); noise(0.15, 0.06); };
  MG.bootstomp = {
    kind: 'action', title: () => 'Boot Stomp', icon: () => '👢',
    how: () => "Puddles keep popping up! Click a puddle, or press its number, to STOMP it before it dries up. Don't squish the snails!",
    init(g) {
      const t = g.tier - 1;
      Object.assign(g, {
        timeLeft: 30, cells: [], boots: [], spawnT: 0.5, hits: 0, oops: 0, dried: 0,
        target: [16, 20, 24][t], life: [3.2, 2.6, 2.1][t], gap: [0.95, 0.75, 0.6][t], snailP: [0.2, 0.26, 0.3][t], maxLive: [2, 3, 4][t],
        say: 'Stomp the puddles! Not the snails!',
      });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.cells.push({ x: 300 + c * 180, y: 180 + r * 118, kind: null, age: 0, life: 1, seed: r * 3 + c });
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.timeLeft -= dt;
      if ((g.spawnT -= dt) <= 0) {
        const empty = g.cells.filter(c => !c.kind), live = g.cells.filter(c => c.kind === 'puddle' || c.kind === 'snail');
        if (empty.length && live.length < g.maxLive) {
          const c = pick(empty), snail = Math.random() < g.snailP && !g.cells.some(c => c.kind === 'snail');
          Object.assign(c, { kind: snail ? 'snail' : 'puddle', age: 0, life: snail ? rand(2.4, 3.4) : g.life * rand(0.85, 1.15), dir: pick([-1, 1]) });
        }
        g.spawnT = g.gap * rand(0.7, 1.3);
      }
      for (const c of g.cells) {
        if (!c.kind) continue;
        c.age += dt;
        if (c.age >= c.life) { if (c.kind === 'puddle') { g.dried++; floatText(c.x, c.y - 30, 'Dried up!', '#e8e8ff', false, 18); } c.kind = null; }
      }
      let hit = keyPick(9);
      if (hit < 0 && pointer.clicked) hit = g.cells.findIndex(c => ((pointer.x - c.x) / 92) ** 2 + ((pointer.y - c.y) / 52) ** 2 < 1);
      if (hit >= 0) {
        const c = g.cells[hit];
        g.boots.push({ x: c.x, y: c.y + 12, t: 0.12 });
        if (c.kind === 'puddle') {
          g.hits++; c.kind = null; splashSound();
          burst(c.x, c.y, 18, { colors: ['#bfe4ff', '#8ac8ff', '#ffffff'], spread: 220, up: 140 });
          floatText(c.x, c.y - 50, pick(['SPLASH!', 'SPLOSH!', 'Splish!']), '#bfe4ff', false, 24);
        } else if (c.kind === 'snail') {
          g.oops++; c.kind = 'hid'; c.age = 0; c.life = 0.9; SFX.miss();
          floatText(c.x, c.y - 50, 'Oops! Poor snail!', '#ffb0c4', false, 22); speak('Oops! Watch out for the snails.');
        } else SFX.step();
      }
      for (const b of g.boots) b.t -= dt;
      g.boots = g.boots.filter(b => b.t > -0.25);
      g.progress = `Stomped ${g.hits} of ${g.target}`;
      g.score = clamp((g.hits - g.oops) / g.target, 0, 1);
      if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      // a cobbled town square to stomp about in
      ctx.save();
      ctx.beginPath(); ctx.roundRect(150, 104, 660, 420, 30); ctx.fillStyle = '#9095c0'; ctx.fill(); ctx.clip();
      for (let r = 0; r < 30; r++) for (let x = 150 + (r % 2) * -20; x < 810; x += 40) rrect(x + 2, 106 + r * 14, 36, 11, 5, ['#9ea2cc', '#a7a3cf', '#989dc7'][(r + Math.round(x / 40)) % 3]);
      ctx.restore();
      rrect(150, 104, 660, 420, 30, null, OL, 3);
      g.cells.forEach((c, i) => {
        ctx.fillStyle = 'rgba(70,70,130,.25)'; ellipse(c.x, c.y + 4, 88, 32);
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 88, 32, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        if (c.kind === 'puddle') {
          const pop = clamp(c.age / 0.15, 0, 1), dry = c.age / c.life, s = pop * (1 - 0.55 * dry);
          puddle(c.x, c.y + 4, 84 * s, 30 * s, c.seed, 2);
          if (dry > 0.7 && Math.sin(S.t * 20) > 0) twinkle(c.x + 50 * s, c.y - 14 * s, 8, 0.9, '#fff6a8');
        } else if (c.kind === 'snail' || c.kind === 'hid') {
          const cr = c.kind === 'snail' ? Math.sin(c.age * 1.2) * 18 * c.dir : 0;
          drawSnail(c.x + cr, c.y + 22, 1.05, c.dir, c.kind === 'hid', S.t);
          if (c.kind === 'hid') outlined('!', c.x + 30, c.y - 40, 26, '#ffb0c4');
        }
        inkCircle(c.x - 86, c.y - 30, 14, '#ffffff', 1.5);
        text(String(i + 1), c.x - 86, c.y - 29, 16, '#5a2a6e', 'center', 800);
      });
      for (const b of g.boots) drawBoot(b.x - 10, b.y - Math.max(0, b.t) * 600, 1);
    },
  };

  // --- Opposites: Fergus shows a picture; pick its opposite ------------------------------------
  // [word, picture, size, what Fergus says]
  const OPPOSITES = [
    [['big', '🐸', 1, 'This frog is big.'], ['small', '🐸', 0.42, 'This frog is small.']],
    [['wet', '☔', 1, 'This umbrella is wet.'], ['dry', '🌂', 1, 'This umbrella is dry.']],
    [['hot', '🔥', 1, 'Fire is hot.'], ['cold', '🧊', 1, 'Ice is cold.']],
    [['happy', '😀', 1, 'This face is happy.'], ['sad', '😢', 1, 'This face is sad.']],
    [['fast', '🐇', 1, 'A bunny is fast.'], ['slow', '🐢', 1, 'A turtle is slow.']],
    [['day', '🌞', 1, 'The sun shines in the day.'], ['night', '🌙', 1, 'The moon comes out at night.']],
    [['up', '⬆️', 1, 'This arrow points up.'], ['down', '⬇️', 1, 'This arrow points down.']],
    [['open', '📖', 1, 'This book is open.'], ['closed', '📕', 1, 'This book is closed.']],
    [['loud', '📢', 1, 'A loudspeaker is loud.'], ['quiet', '🤫', 1, 'Shh! This means quiet.']],
    [['heavy', '🐘', 1, 'An elephant is heavy.'], ['light', '🪶', 1, 'A feather is light.']],
  ];
  MG.opposites = {
    kind: 'learn', title: () => 'Opposites', icon: () => '🔄',
    how: () => 'Fergus shows you a picture. Find its OPPOSITE! Big and small are opposites. Click the picture, or press its number.',
    init(g) {
      const pool = shuffle(OPPOSITES.slice(0, g.tier === 1 ? 6 : 10).map((_, i) => i));
      Object.assign(g, { round: 0, rounds: [5, 6, 7][g.tier - 1], n: g.tier === 1 ? 3 : 4, total: 0, order: pool, shake: {} });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const pi = g.order[g.round % g.order.length], side = randInt(0, 1);
      const shown = OPPOSITES[pi][side], answer = OPPOSITES[pi][1 - side];
      const others = shuffle(OPPOSITES.map((_, i) => i).filter(i => i !== pi)).slice(0, g.n - 1).map(i => OPPOSITES[i][randInt(0, 1)]);
      Object.assign(g, { shown, answer, choices: shuffle([answer, ...others]), tried: [], state: 'pick', t2: 0 });
      g.say = `${shown[3]} What is the opposite of ${shown[0]}?`;
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      tickDown(g.shake, dt);
      if (g.state === 'pick') {
        const i = idPick(id, 'opp:', g.n);
        if (i >= 0 && i < g.n && !g.tried.includes(i)) {
          g.tried.push(i);
          const c = g.choices[i];
          if (c === g.answer) {
            g.total += [1, 0.5, 0.2, 0][g.tried.length - 1]; g.state = 'yay'; g.t2 = 2.3; SFX.hit();
            burst(this.cardX(g, i) + this.cardW(g) / 2, 380, 24);
            speak(`Yes! The opposite of ${g.shown[0]} is ${g.answer[0]}!`);
          } else {
            g.shake[i] = 0.4; SFX.miss();
            speak(`That one is ${c[0]}. What is the opposite of ${g.shown[0]}?`);
          }
        }
      } else if ((g.t2 -= dt) <= 0) {
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      g.progress = `Picture ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    cardW: g => (g.n === 3 ? 220 : 176),
    cardX(g, i) { const w = this.cardW(g), gap = 22; return W / 2 + 84 - (g.n * w + (g.n - 1) * gap) / 2 + i * (w + gap); },
    draw(g) {
      drawCritter('Fergus the Frog', 96, 480, 0.85, 1);
      // Fergus's picture card
      panel(250, 70, 560, 180, 24);
      rrect(270, 86, 170, 148, 18, '#e6f4ff', '#bcd8f0', 3);
      const bob = Math.sin(S.t * 2) * 3;
      emoji(g.shown[1], 355, 152 + bob, 100 * g.shown[2]);
      text('This is', 470, 112, 20, '#8a5aa0', 'left', 600);
      outlined(g.shown[0].toUpperCase(), 470, 152, 44, '#ff6fb5', 'left', '#fff');
      text(g.state === 'yay' ? `The opposite is ${g.answer[0]}!` : 'What is the OPPOSITE?', 470, 200, 22, '#5a2a6e', 'left', 700);
      // the choices
      const w = this.cardW(g), y = 282, h = 200;
      g.choices.forEach((c, i) => {
        const x = this.cardX(g, i) + shakeX(g.shake, i), wrong = g.tried.includes(i) && c !== g.answer, right = g.state === 'yay' && c === g.answer;
        button(`opp:${i}`, x, y, w, h, '', { color: right ? '#ffd23f' : wrong ? '#c9bcd4' : CARD_COLS[i], on: (g.state === 'pick' && !wrong) || right, key: String(i + 1) });
        rrect(x + 10, y + 10, w - 20, h - 64, 14, wrong ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.85)');
        emoji(c[1], x + w / 2, y + 10 + (h - 64) / 2, 92 * c[2]);
        outlined(c[0], x + w / 2, y + h - 30, 30, '#ffffff', 'center', 'rgba(60,20,80,.65)');
        if (right) { star(x + 20, y + 20, 12, '#fff6a8', 5); star(x + w - 20, y + 20, 12, '#fff6a8', 5); }
      });
    },
  };

  restage('puddles', {
    bg: 'puddles_bg',
    games: [['bootstomp', 'shell', {}], ['opposites', 'petal', {}]],
    intro: ['N:Ribbit! Rainy days are the BEST days. Look, puddles are popping up all over the lane!', 'A:laughing:Then I need my stomping boots!', "N:Stomp them before they dry up. But don't squish my snail friends!"],
    mid: ['N:Ribbit! Now a froggy brain game. I show you a picture, and you find its OPPOSITE!', 'A:thinking:Opposite... like up and down?', 'N:Exactly! Wet and dry, big and small. Ribbit!'],
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

  // --- Paper Planes: aim and throw through the hoops, with a little wind -------------------------
  const PP_START = [172, 356], PP_GRAV = 240;
  const ppSpeed = pow => 300 + pow * 440;
  function ppSim(p, dt, wind) { p.vx += wind * dt; p.vy += PP_GRAV * dt; p.vx *= 1 - 0.12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  function drawPlane(x, y, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ink(P2('M28,0 L-20,-14 L-10,0 L-20,12 Z'), '#ffffff', 1.5);
    ink(P2('M28,0 L-10,0 L-18,8 Z'), mix(col, '#ffffff', 0.4), 1);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(8, -2); ctx.stroke();
    ctx.restore();
  }
  function hoopHalf(x, y, r, front, col) {
    const a0 = front ? -Math.PI / 2 : Math.PI / 2, a1 = front ? Math.PI / 2 : Math.PI * 1.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 15; ctx.beginPath(); ctx.ellipse(x, y, r * 0.34, r, 0, a0, a1); ctx.stroke();
    ctx.strokeStyle = front ? col : mix(col, '#5b3f73', 0.3); ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; ctx.setLineDash([6, 10]); ctx.stroke(); ctx.setLineDash([]);
  }
  MG.paperplanes = {
    kind: 'action', title: () => 'Paper Planes', icon: () => '✈️',
    how: () => 'Point where to throw: farther away throws harder. Watch the wind! Click to throw the plane through the hoop. Or use the arrows and SPACE.',
    init(g) {
      Object.assign(g, { planes: 8, hits: 0, target: [5, 6, 6][g.tier - 1], ang: 0.45, pow: 0.5, plane: null, wait: 0, trail: [], say: 'Throw the paper plane through the hoop!' });
      this.newHoop(g); this.newWind(g);
    },
    start(g) { speak(g.say); },
    newHoop(g) { g.hoop = { x: rand(470, 840), y: rand(150, 380), r: [62, 52, 46][g.tier - 1], ph: rand(0, 6), col: pick(['#ff5f7e', '#40b0ff', '#5adc7a', '#9c6cff', '#ffa040']), pulse: 0 }; },
    newWind(g) { const m = [14, 34, 48][g.tier - 1]; g.wind = Math.round(rand(-m, m)); },
    hoopY(g, t = S.t) { return g.hoop.y + (g.tier === 3 ? Math.sin(t * 1.2 + g.hoop.ph) * 46 : 0); },
    update(g, dt) {
      g.hoop.pulse = Math.max(0, g.hoop.pulse - dt);
      if (!g.plane && g.wait <= 0 && g.planes > 0) {
        if (keys.arrowup || keys.w) g.ang += 1.1 * dt;
        if (goDown()) g.ang -= 1.1 * dt;
        if (goRight()) g.pow += 0.7 * dt;
        if (goLeft()) g.pow -= 0.7 * dt;
        if (pointerMoved(g) && !goLeft() && !goRight() && !keys.arrowup && !goDown() && pointer.y > 64) {
          const dx = pointer.x - PP_START[0], dy = PP_START[1] - pointer.y;
          g.ang = Math.atan2(dy, Math.max(dx, 1)); g.pow = (Math.hypot(dx, dy) - 60) / 520;
        }
        g.ang = clamp(g.ang, -0.4, 1.25); g.pow = clamp(g.pow, 0, 1);
        if (pressed[' '] || (pointer.clicked && pointer.y > 64)) {
          const v = ppSpeed(g.pow);
          g.plane = { x: PP_START[0], y: PP_START[1], vx: Math.cos(g.ang) * v, vy: -Math.sin(g.ang) * v, t: 0 };
          g.planes--; g.trail = []; SFX.jump();
        }
      }
      if (g.plane) {
        const p = g.plane, hx = g.hoop.x, hy = this.hoopY(g), px = p.x, py = p.y;
        for (let k = 0; k < 2; k++) ppSim(p, dt / 2, g.wind);
        p.t += dt;
        if (Math.floor(p.t * 30) > g.trail.length) g.trail.push([p.x, p.y]);
        if (px < hx && p.x >= hx) {
          const yy = lerp(py, p.y, (hx - px) / (p.x - px));
          if (Math.abs(yy - hy) < g.hoop.r * 0.82) {
            g.hits++; g.hoop.pulse = 0.6; SFX.sparkle(); burst(hx, hy, 26);
            floatText(hx, hy - g.hoop.r - 20, pick(['Swoosh!', 'Right through!', 'Yay!']), '#fff6a8', false, 26);
            g.passed = true;
          }
        }
        if (p.y > GY + 20 || p.x > W + 40 || p.x < -40 || p.t > 5) {
          if (!g.passed) { SFX.miss(); floatText(clamp(p.x, 60, W - 60), clamp(p.y, 120, GY) - 20, 'So close!', '#ffffff', false, 22); }
          g.plane = null; g.wait = 0.9;
        }
      } else if (g.wait > 0) {
        g.wait -= dt;
        if (g.wait <= 0) {
          if (g.passed) this.newHoop(g);
          g.passed = false; this.newWind(g);
          if (g.planes <= 0 || g.hits >= g.target) g.done = true;
        }
      }
      g.progress = `Hoops ${g.hits} of ${g.target} · ✈️ ${g.planes}`;
      g.score = clamp(g.hits / g.target, 0, 1);
    },
    draw(g) {
      const hy = this.hoopY(g), r = g.hoop.r * (1 + g.hoop.pulse * 0.25);
      // wind sock
      darkPanel(W / 2 - 120, 66, 240, 40, 18);
      const wtxt = g.wind === 0 ? 'No wind' : Math.abs(g.wind) < 20 ? 'A little wind' : 'Windy!';
      text(wtxt, W / 2 - 30, 86, 17, '#fff', 'center', 700);
      if (g.wind) {
        const dir = Math.sign(g.wind), len = 16 + Math.abs(g.wind) * 0.9, ax = W / 2 + 64;
        ctx.strokeStyle = '#a6f0ff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ax - dir * len / 2, 86); ctx.lineTo(ax + dir * len / 2, 86); ctx.stroke();
        ctx.fillStyle = '#a6f0ff'; tri(ax + dir * (len / 2 + 10), 86, ax + dir * len / 2 - dir * 2, 78, ax + dir * len / 2 - dir * 2, 94);
      }
      hoopHalf(g.hoop.x, hy, r, false, g.hoop.col);
      // aim preview
      if (!g.plane && g.wait <= 0 && g.planes > 0) {
        const v = ppSpeed(g.pow), p = { x: PP_START[0], y: PP_START[1], vx: Math.cos(g.ang) * v, vy: -Math.sin(g.ang) * v };
        const steps = Math.round([1.6, 0.6, 0.4][g.tier - 1] * 60);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        for (let i = 0; i < steps; i++) { ppSim(p, 1 / 60, g.wind); if (p.y > GY) break; if (i % 4 === 3) { ctx.globalAlpha = 1 - i / steps * 0.7; circle(p.x, p.y, 4); } }
        ctx.globalAlpha = 1;
        // power meter
        darkPanel(230, 486, 196, 40, 18); text('Power', 270, 506, 15, '#fff', 'center', 700);
        rrect(306, 498, 106, 16, 8, 'rgba(255,255,255,.25)'); rrect(306, 498, 106 * Math.max(0.08, g.pow), 16, 8, mix('#5adc7a', '#ff5f7e', g.pow));
      }
      for (let i = 0; i < g.trail.length; i++) { ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.4 * i / g.trail.length})`; circle(g.trail[i][0], g.trail[i][1], 2.5); }
      // Aubrey beside the launch stump
      drawAubrey(84, GY + 30, 'idle_front', 1, 0, 0.62);
      ink(P2(`M126,${GY + 30} L130,374 L206,374 L210,${GY + 30} Z`), BARK, 2.5);
      inkEllipse(168, 374, 40, 10, 0, '#e8c08a', 2);
      ctx.strokeStyle = 'rgba(160,104,58,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(168, 374, 24, 6, 0, 0, Math.PI * 2); ctx.stroke();
      if (g.plane) drawPlane(g.plane.x, g.plane.y, Math.atan2(g.plane.vy, g.plane.vx), '#ff6fb5');
      else if (g.planes > 0) drawPlane(PP_START[0], PP_START[1], -g.ang, '#ff6fb5');
      hoopHalf(g.hoop.x, hy, r, true, g.hoop.col);
    },
  };

  restage('treehouse', {
    bg: 'treehouse_bg',
    games: [['secretcode', 'ribbon', {}], ['paperplanes', 'berry', {}]],
    intro: ['N:Psst! Welcome to the secret treehouse club. To get in, you need the password.', "N:But it's written in secret code! Use the key to crack it.", 'A:focused:I LOVE secret codes.'],
    mid: ["N:You cracked it! Now the club challenge: throw paper planes through the hoops!", 'A:determined:I will aim really carefully. And watch the wind!'],
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
  function tinySpider(x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) for (const d of [-1, 1]) { const w = Math.sin(t * 10 + i) * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(d * 14, -8 + i * 5, d * 20, -2 + i * 6 + w); ctx.stroke(); }
    inkCircle(0, 2, 11, '#7a5ac8', 1.5); inkCircle(0, -9, 7, '#7a5ac8', 1.5);
    ctx.fillStyle = '#fff'; circle(-3, -10, 2.6); circle(3, -10, 2.6); ctx.fillStyle = '#ff6fae'; circle(0, 4, 3);
    ctx.restore();
  }
  MG.webdots = {
    kind: 'learn', title: () => 'Web Dot-to-Dot', icon: () => '🕸️',
    how: g => (g.tier === 3 ? 'Count by twos! Click the dots in order, 2, 4, 6, 8... to spin a silk picture.' : 'Click the dots in number order, 1, 2, 3... to spin a silk picture with Silvie!'),
    init(g) {
      Object.assign(g, { round: 0, rounds: 3, total: 0, pics: shuffle(WEB_SETS[g.tier - 1]).slice(0, 3), step: g.tier === 3 ? 2 : 1, shake: {} });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const [name, col, fn] = WEB_PICS[g.pics[g.round]];
      Object.assign(g, { name, col, dots: fitPts(fn(), 520, 300, 400, 330), got: 1, wrong: 0, idle: 0, state: 'join', t2: 0, sx: 0, sy: 0, spin: 1 });
      [g.sx, g.sy] = g.dots[0];
      g.say = `Start at ${g.step}. Then find ${NUM_WORDS[g.step * 2]}!`;
      if (g.phase === 'play') speak(g.say);
    },
    label: (g, i) => (i + 1) * g.step,
    update(g, dt) {
      g.idle += dt; tickDown(g.shake, dt);
      g.spin = Math.min(1, g.spin + dt * 5);
      if (g.state === 'join' && pointer.clicked) {
        let best = -1, bd = 34;
        g.dots.forEach(([x, y], i) => { const d = Math.hypot(pointer.x - x, pointer.y - y); if (d < bd) { bd = d; best = i; } });
        if (best === g.got) {
          g.got++; g.idle = 0; g.spin = 0; tone(500 + g.got * 30, 0.1, 'triangle', 0.08);
          if (g.got >= g.dots.length) {
            g.state = 'done'; g.t2 = 0; g.total += Math.max(0.3, 1 - 0.12 * g.wrong); SFX.sparkle();
            speak(`You spun a ${g.name}!`); burst(520, 300, 30, { colors: ['#ffffff', g.col, '#fff6a8'] });
          }
        } else if (best > g.got) {
          g.wrong++; g.shake[best] = 0.4; g.idle = 99; SFX.miss();
          speak(`That's ${NUM_WORDS[this.label(g, best)] || this.label(g, best)}. Find ${NUM_WORDS[this.label(g, g.got)] || this.label(g, g.got)}!`);
        }
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
      const D = g.dots, n = D.length, done = g.state === 'done', fill = done ? clamp(g.t2 / 0.8, 0, 1) : 0;
      if (fill) { ctx.globalAlpha = fill; ctx.fillStyle = g.col; ctx.fill(ptsPath(D)); ctx.globalAlpha = 1; }
      // silk thread so far, the newest bit being spun
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
        inkCircle(x + sx, y, joined ? 8 : 10, joined ? '#c6a2ff' : '#ffffff', 1.5);
        if (done) return;
        const d = Math.hypot(x - cx, y - cy) || 1, lx = x + (x - cx) / d * 26 + sx, ly = y + (y - cy) / d * 24;
        text(String(this.label(g, i)), lx, ly, i === g.got ? 22 : 18, joined ? '#b8a0c8' : i === g.got ? '#ff3f8f' : '#5a2a6e', 'center', 800);
      });
      // Silvie's little helper spider rides the end of the thread
      const li = Math.max(0, g.got - 1), pv = D[Math.max(0, li - 1)], k = done ? 1 : g.spin;
      tinySpider(lerp(pv[0], D[li][0], li ? k : 1), lerp(pv[1], D[li][1], li ? k : 1) - 4, 0.9, S.t);
      if (done) outlined(`A ${g.name}!`, 520, 140, 34, g.col);
      else text(`Next: ${this.label(g, g.got)}`, 520, 482, 20, '#8a5aa0', 'center', 700);
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
  const chirp = f => { tone(f, 0.28, 'triangle', 0.1, 0, f * 1.12); tone(f * 1.5, 0.12, 'sine', 0.04, 0.12, f * 1.7); };
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
    sing(g, b, dur) { g.lit[b] = dur; chirp(SONGBIRDS[b][1]); },
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
