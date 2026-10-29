'use strict';
// Tinker's Toy Shop, game 1 (action) TOY MAKER: replaces Domino Dash.
// A plain wooden torso sits on a stand at the workbench. Drag parts out of the parts bin
// (Heads, Arms, Hands, Legs, Feet, Clothes, Glasses, Hats, Extras) and drop them on the toy:
// they snap to the nearest matching socket (shoulders, wrists, hips, ankles, neck, head).
// Extras stick anywhere. The only rule: the toy needs 2 arms, 2 hands, 2 legs, 2 feet and a head.
// Then customise as much as you like and press Finished! The toy comes alive and dances.
{
  const PI = Math.PI;
  const TX = 368, TY = 268;                 // torso centre
  const SH = 46, SHY = -32;                 // shoulders (x mirrored)
  const HIP = 22, HIPY = 46;                // hips (x mirrored)
  const NECK = -54;
  const BIN = { x: 566, y: 64, w: 380, h: 384 };
  const SKIN = '#f6c49c';
  const SIDES = [['L', -1], ['R', 1]];
  const CATS = [
    ['head', 'Heads'], ['arm', 'Arms'], ['hand', 'Hands'], ['leg', 'Legs'], ['foot', 'Feet'],
    ['clothes', 'Clothes'], ['glasses', 'Glasses'], ['hat', 'Hats'], ['extra', 'Extras'],
  ];

  // ------------------------------------------------------------------ drawing helpers
  const E = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, PI * 2); return p; };
  const C = (x, y, r) => E(x, y, r, r);
  const R = (x, y, w, h, r = 4) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
  // a smooth path through points (quadratic through the midpoints)
  const lineP = pts => {
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 2) { p.lineTo(pts[1][0], pts[1][1]); return p; }
    for (let i = 1; i < pts.length - 1; i++) {
      const last = i === pts.length - 2;
      const nx = last ? pts[i + 1][0] : (pts[i][0] + pts[i + 1][0]) / 2, ny = last ? pts[i + 1][1] : (pts[i][1] + pts[i + 1][1]) / 2;
      p.quadraticCurveTo(pts[i][0], pts[i][1], nx, ny);
    }
    return p;
  };
  const strokeP = (p, w, col, cap = 'round') => { ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(p); };
  // an outlined tube along points
  const tube = (pts, w, col, lw = 2.2) => { const p = lineP(pts); strokeP(p, w + lw * 2, OL); strokeP(p, w, col); return p; };
  // several shapes outlined first and filled second, so they read as one shape.
  // items: Path2D (an area) or [Path2D, width] (a tube)
  const blobs = (items, col, lw = 2.2) => {
    for (const it of items) { if (Array.isArray(it)) strokeP(it[0], it[1] + lw * 2, OL); else strokeP(it, lw * 2, OL); }
    for (const it of items) { if (Array.isArray(it)) strokeP(it[0], it[1], col); else { ctx.fillStyle = col; ctx.fill(it); } }
  };
  const T = (pts, w) => [lineP(pts), w];
  // a tapered shape along a centre line (w0 at the start, w1 at the end)
  const taperP = (pts, w0, w1) => {
    const L = [], Rr = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const w = lerp(w0, w1, i / (n - 1)) / 2, nx = -dy / d * w, ny = dx / d * w;
      L.push([pts[i][0] + nx, pts[i][1] + ny]); Rr.push([pts[i][0] - nx, pts[i][1] - ny]);
    }
    const p = new Path2D();
    p.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n - 1; i++) p.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2);
    p.lineTo(L[n - 1][0], L[n - 1][1]);
    const e = pts[n - 1];
    p.quadraticCurveTo(e[0] + (e[0] - pts[n - 2][0]) * 0.6, e[1] + (e[1] - pts[n - 2][1]) * 0.6, Rr[n - 1][0], Rr[n - 1][1]);
    for (let i = n - 2; i > 0; i--) p.quadraticCurveTo(Rr[i][0], Rr[i][1], (Rr[i][0] + Rr[i - 1][0]) / 2, (Rr[i][1] + Rr[i - 1][1]) / 2);
    p.lineTo(Rr[0][0], Rr[0][1]); p.closePath();
    return { p, L, R: Rr };
  };
  const curve = (n, f) => { const out = []; for (let i = 0; i <= n; i++) out.push(f(i / n)); return out; };
  const starP = (x, y, r, ri = 0.45, n = 5, rot = 0) => {
    const p = new Path2D();
    for (let i = 0; i < n * 2; i++) {
      const rr = i % 2 ? r * ri : r, a = rot + i * PI / n - PI / 2;
      i ? p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : p.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    p.closePath(); return p;
  };
  const heartP = (x, y, s) => {
    const k = s / 36, p = new Path2D();
    p.moveTo(x, y + 6 * k);
    p.bezierCurveTo(x, y + 3 * k, x - 4 * k, y - 4 * k, x - 10 * k, y - 4 * k);
    p.bezierCurveTo(x - 18 * k, y - 4 * k, x - 18 * k, y + 6 * k, x - 18 * k, y + 6 * k);
    p.bezierCurveTo(x - 18 * k, y + 12 * k, x - 10 * k, y + 18 * k, x, y + 24 * k);
    p.bezierCurveTo(x + 10 * k, y + 18 * k, x + 18 * k, y + 12 * k, x + 18 * k, y + 6 * k);
    p.bezierCurveTo(x + 18 * k, y + 6 * k, x + 18 * k, y - 4 * k, x + 10 * k, y - 4 * k);
    p.bezierCurveTo(x + 4 * k, y - 4 * k, x, y + 3 * k, x, y + 6 * k);
    p.closePath(); return p;
  };
  const clipped = (p, f) => { ctx.save(); ctx.clip(p); f(); ctx.restore(); };
  const hi = (p, w = 3) => { ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(p); };
  const dot = (x, y, r, col) => { ctx.fillStyle = col; circle(x, y, r); };
  const line = (pts, w, col) => strokeP(lineP(pts), w, col);
  // a friendly face: eyes at y, 2*13k apart
  const face = (t, x, y, k = 1, o = {}) => {
    const blink = (t + (o.seed || 0)) % 3.7 < 0.12;
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#3a2350';
      if (blink) ellipse(x + s * 13 * k, y, 4.5 * k, 1.2 * k);
      else { ellipse(x + s * 13 * k, y, 4.4 * k, 5.4 * k); dot(x + s * 13 * k + 1.4 * k, y - 2 * k, 1.6 * k, '#fff'); }
    }
    if (o.mouth !== false) {
      ctx.strokeStyle = '#3a2350'; ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y + 7 * k, 8 * k, 0.2 * PI, 0.8 * PI); ctx.stroke();
    }
    if (o.blush !== false) { ctx.fillStyle = 'rgba(255,110,150,.45)'; ellipse(x - 21 * k, y + 8 * k, 5 * k, 3 * k); ellipse(x + 21 * k, y + 8 * k, 5 * k, 3 * k); }
  };
  const flame = (x, y, len, w, t) => {
    const f = len * (0.85 + 0.15 * Math.sin(t * 40));
    ink(P2(`M${x - w},${y} Q${x - w * 0.6},${y + f * 0.6} ${x},${y + f} Q${x + w * 0.6},${y + f * 0.6} ${x + w},${y} Z`), '#ff8a3a', 1.4);
    ctx.fillStyle = '#ffe36a'; ctx.fill(P2(`M${x - w * 0.5},${y} Q${x - w * 0.3},${y + f * 0.4} ${x},${y + f * 0.65} Q${x + w * 0.3},${y + f * 0.4} ${x + w * 0.5},${y} Z`));
  };

  // ------------------------------------------------------------------ the parts
  // Each part: id, cat, name, w (weird: Aubrey laughs), t (1: always, 2: from tier 2), draw(t, a)
  // where a is how "alive" the toy is (0 while building, 1 when it dances). Limbs are drawn for
  // the toy's right-hand side (screen right) and mirrored for the left.
  const PARTS = [];
  const add = (cat, id, name, o) => PARTS.push({ cat, id, name, t: 1, w: 0, ...o });
  const armEnd = pts => { const n = pts.length, a = pts[n - 2], b = pts[n - 1]; return { end: b, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
  const arm = (id, name, pts, o, draw) => add('arm', id, name, { ...armEnd(pts), ...o, draw: (t, a) => draw(t, a, pts) });

  // ---- ARMS (origin at the shoulder)
  arm('human', 'Arm', [[0, 0], [20, 24], [28, 62]], {}, (t, a, P) => {
    tube(P, 16, SKIN); hi(lineP([[2, -3], [18, 18]]), 3);
    ctx.strokeStyle = 'rgba(150,80,60,.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(20, 26, 4, 2.4, 3.6); ctx.stroke();
  });
  arm('robot', 'Robot arm', [[0, 0], [22, 28], [28, 64]], {}, (t, a, P) => {
    tube([P[0], P[1]], 13, '#b9c6dc'); tube([P[1], P[2]], 11, '#b9c6dc');
    ctx.fillStyle = '#ff6fb5'; ctx.fillRect(22, 44, 9, 4);
    inkCircle(22, 28, 8, '#8494b4', 2); dot(22, 28, 2.5, '#e8eef8');
    inkCircle(0, 0, 7, '#8494b4', 2); hi(lineP([[2, -3], [16, 16]]), 2.5);
  });
  arm('tentacle', 'Tentacle', curve(10, s => [50 * s + 16 * Math.sin(s * PI), 70 * s]), { w: 1 }, (t, a, P) => {
    const amp = 3 + 9 * a;
    const pts = P.map(([x, y], i) => { const s = i / (P.length - 1); return [x + Math.sin(s * 6 - t * 4) * Math.sin(s * PI) * amp, y]; });
    const tp = taperP(pts, 17, 5); ink(tp.p, '#b77be8', 2.2);
    for (let i = 2; i < pts.length - 1; i++) {
      const [lx, ly] = tp.R[i], [cx, cy] = pts[i];
      inkCircle(lerp(cx, lx, 0.55), lerp(cy, ly, 0.55), 2.6 - i * 0.18, '#f4c8ff', 0.8);
    }
  });
  arm('noodle', 'Noodle arm', [[0, 0], [30, 8], [8, 34], [36, 54], [24, 86]], { w: 1 }, (t, a, P) => {
    const wv = Math.sin(t * 4) * (2 + 6 * a);
    tube([P[0], [P[1][0], P[1][1] + wv], [P[2][0] - wv, P[2][1]], [P[3][0], P[3][1] - wv], P[4]], 9, '#ffd779');
    hi(lineP([[1, -2], [24, 6]]), 2);
  });
  arm('furry', 'Furry arm', [[0, 0], [20, 26], [28, 60]], { w: 1 }, (t, a, P) => {
    const tufts = curve(7, s => s);
    const pt = s => [P[0][0] + (P[1][0] - P[0][0]) * Math.min(1, s * 2) + (s > 0.5 ? (P[2][0] - P[1][0]) * (s - 0.5) * 2 : 0),
      P[0][1] + (P[1][1] - P[0][1]) * Math.min(1, s * 2) + (s > 0.5 ? (P[2][1] - P[1][1]) * (s - 0.5) * 2 : 0)];
    const fur = [];
    for (const s of tufts) { const [x, y] = pt(s); fur.push(C(x - 9, y + 3, 6.5), C(x + 9, y - 3, 6.5)); }
    blobs([...fur, T(P, 20)], '#7fb2ff');
    for (const s of tufts) { const [x, y] = pt(s); line([[x - 3, y], [x + 2, y + 4]], 1.6, '#4f86e0'); }
  });
  arm('spring', 'Spring arm', [[0, 0], [30, 62]], { w: 1 }, (t, a, P) => {
    const n = 12, dx = 30, dy = 62, d = Math.hypot(dx, dy), nx = -dy / d, ny = dx / d;
    const wob = Math.sin(t * 8) * a * 4;
    const pts = [[0, 0]];
    for (let i = 1; i < n; i++) { const s = i / n, side = i % 2 ? 9 : -9; pts.push([dx * s + nx * (side + wob * Math.sin(s * PI)), dy * s + ny * (side + wob * Math.sin(s * PI))]); }
    pts.push([dx, dy]);
    const p = new Path2D(); p.moveTo(0, 0); for (const q of pts) p.lineTo(q[0], q[1]);
    strokeP(p, 8, OL); strokeP(p, 4, '#d4dbe8'); strokeP(p, 1.4, '#fff');
    inkCircle(0, 0, 6, '#9aa6c0', 2);
  });
  arm('candy', 'Candy cane', [[0, 0], [24, 22], [30, 62]], { w: 1, t: 2 }, (t, a, P) => {
    const p = tube(P, 14, '#fff');
    ctx.setLineDash([7, 7]); strokeP(p, 14, '#ff3f5f', 'butt'); ctx.setLineDash([]); hi(lineP([[3, -3], [20, 14]]), 3);
  });
  arm('branch', 'Twig arm', [[0, 0], [24, 26], [32, 62]], { w: 1, t: 2 }, (t, a, P) => {
    blobs([T(P, 11), T([[17, 18], [36, 8]], 5)], '#9a6a3c');
    line([[8, 6], [14, 14]], 1.4, '#6e4422'); line([[26, 36], [28, 46]], 1.4, '#6e4422');
    inkEllipse(40, 6, 8, 4, -0.4 + Math.sin(t * 5) * 0.2 * a, '#6cc35a', 1.4); inkEllipse(34, 2, 6, 3, -1.2, '#8fdc6a', 1.4);
  });
  arm('banana', 'Banana arm', [[0, 0], [16, 16], [26, 36], [28, 56], [22, 72]], { w: 1, t: 2 }, (t, a, P) => {
    ink(taperP(P, 17, 9).p, '#ffe14d', 2.2);
    line([[4, 4], [18, 22], [22, 44]], 1.4, 'rgba(180,140,20,.6)');
    inkCircle(0, 0, 5, '#8a6a2a', 1.6);
  });
  arm('rainbow', 'Rainbow arm', [[0, 0], [24, 24], [30, 62]], { w: 1, t: 2 }, (t, a, P) => {
    const p = lineP(P); strokeP(p, 22, OL); strokeP(p, 18, '#ff5f7e'); strokeP(p, 13, '#ffa040'); strokeP(p, 9, '#ffd83a'); strokeP(p, 5, '#5adc7a'); strokeP(p, 2, '#40b0ff');
  });

  // ---- HANDS (origin at the wrist, fingers point down +y)
  const hand = (id, name, o, draw) => add('hand', id, name, { ...o, draw });
  hand('hand', 'Hand', {}, (t, a) => {
    blobs([E(0, 12, 11, 12), T([[-7, 16], [-8, 30]], 5.5), T([[-2.5, 18], [-3, 33]], 5.5), T([[2.5, 18], [3, 33]], 5.5), T([[7, 16], [8, 29]], 5.5), T([[9, 8], [16, 17]], 6)], SKIN, 2);
  });
  hand('glove', 'Cartoon glove', {}, (t, a) => {
    blobs([E(0, 14, 13, 12), T([[-7, 18], [-8, 31]], 8), T([[0, 20], [0, 34]], 8), T([[7, 18], [8, 31]], 8), T([[10, 8], [18, 15]], 8)], '#ffffff', 2);
    inkEllipse(0, 1, 13, 6, 0, '#f4ecff', 2);
    for (const x of [-4, 0, 4]) line([[x, 8], [x, 14]], 1.6, '#5b3f73');
  });
  hand('mitten', 'Mitten', {}, (t, a) => {
    blobs([E(0, 18, 12, 15), T([[8, 10], [15, 19]], 9)], '#ff5f7e', 2);
    ink(R(-13, -2, 26, 9, 4), '#fff', 2); ctx.fillStyle = '#ff5f7e'; ctx.fillRect(-11, 2, 22, 2);
    dot(-3, 18, 2, '#fff'); dot(4, 24, 2, '#fff'); dot(-4, 27, 2, '#fff');
  });
  hand('claw', 'Robot claw', {}, (t, a) => {
    const open = 0.15 + 0.35 * (Math.sin(t * 7) * 0.5 + 0.5) * a;
    const prong = P2('M-2,0 C-12,6 -14,22 -6,32 L-2,28 C-7,22 -6,12 2,6 Z');
    inkAt(-3, 8, open, prong, '#9aa6c0', 2); ctx.save(); ctx.scale(-1, 1); inkAt(-3, 8, open, prong, '#9aa6c0', 2); ctx.restore();
    ink(R(-8, -2, 16, 12, 3), '#c8d2e4', 2); dot(0, 4, 2.2, '#ff6fb5');
  });
  hand('lobster', 'Lobster claw', { w: 1 }, (t, a) => {
    const snap = (Math.sin(t * 9) * 0.5 + 0.5) * a * 0.4;
    inkAt(-6, 20, 0.2 + snap, P2('M0,0 C-10,4 -12,16 -6,24 C-4,16 -2,10 4,6 Z'), '#ff5a4a', 2);
    ink(P2('M-6,-2 L6,-2 C16,6 18,20 12,30 C10,36 4,40 2,34 C6,26 4,18 -4,16 C-12,14 -14,4 -6,-2 Z'), '#ff5a4a', 2.2);
    dot(4, 10, 2, '#ffb0a0'); dot(8, 18, 1.6, '#ffb0a0'); hi(P2('M-2,2 C6,4 10,10 12,18'), 2);
  });
  hand('paw', 'Bear paw', { w: 1 }, (t, a) => {
    blobs([E(0, 14, 13, 13), C(-9, 26, 5), C(-3, 29, 5), C(4, 29, 5), C(10, 26, 5)], '#b07a4a', 2);
    ctx.fillStyle = '#ffb3c8'; ellipse(0, 15, 6, 5); circle(-8, 25, 2.4); circle(-3, 27, 2.4); circle(3, 27, 2.4); circle(9, 25, 2.4);
  });
  hand('hook', 'Pirate hook', { w: 1, t: 2 }, (t, a) => {
    ink(R(-10, -2, 20, 12, 4), '#4a3050', 2); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-10, 3, 20, 2);
    const p = new Path2D(); p.moveTo(0, 10); p.lineTo(0, 22); p.arc(7, 22, 7, PI, 0.15, true);
    strokeP(p, 8, OL); strokeP(p, 4, '#d6dde8'); strokeP(p, 1.3, '#fff');
  });
  hand('foam', 'Foam finger', { w: 1, t: 2 }, (t, a) => {
    blobs([E(0, 14, 15, 13), T([[-1, 20], [-1, 46]], 11), T([[11, 8], [19, 16]], 8)], '#40b0ff', 2.2);
    ctx.fillStyle = '#ffd83a'; ctx.fill(starP(-1, 14, 7));
  });
  hand('starfish', 'Starfish', { w: 1, t: 2 }, (t, a) => {
    ink(starP(0, 18, 19, 0.45, 5, Math.sin(t * 3) * 0.2 * a), '#ff9a4a', 2);
    for (let i = 0; i < 5; i++) { const an = i * 2 * PI / 5 - PI / 2; dot(Math.cos(an) * 9, 18 + Math.sin(an) * 9, 1.8, '#ffd2a8'); }
  });

  // ---- LEGS (origin at the hip, going down)
  const leg = (id, name, end, o, draw) => add('leg', id, name, { end, ...o, draw });
  leg('human', 'Leg', [0, 82], {}, (t, a) => { tube([[0, 0], [2, 40], [0, 82]], 18, SKIN); hi(lineP([[-4, 4], [-3, 34]]), 3); ctx.strokeStyle = 'rgba(150,80,60,.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(1, 42, 4, 3.6, 5.6); ctx.stroke(); });
  leg('robot', 'Robot leg', [0, 80], {}, (t, a) => {
    tube([[0, 0], [0, 38]], 15, '#b9c6dc'); tube([[0, 38], [0, 80]], 13, '#b9c6dc');
    inkCircle(0, 38, 9, '#8494b4', 2); dot(0, 38, 2.6, '#e8eef8'); ctx.fillStyle = '#40b0ff'; ctx.fillRect(-6, 56, 12, 4);
  });
  leg('pogo', 'Pogo spring', [0, 100], { w: 1 }, (t, a) => {
    const sq = Math.abs(Math.sin(t * 6)) * a;
    tube([[0, 0], [0, 50]], 8, '#9aa6c0'); inkRect(-12, 48, 24, 6, '#ff6fb5', 2, 3);
    const p = new Path2D(); p.moveTo(0, 56);
    for (let i = 1; i <= 8; i++) p.lineTo(i % 2 ? 9 : -9, 56 + i * (5.6 - sq * 1.2));
    p.lineTo(0, 100); strokeP(p, 7, OL); strokeP(p, 3.5, '#d4dbe8');
  });
  leg('frog', 'Frog leg', [4, 82], { w: 1 }, (t, a) => {
    tube([[0, 0], [22, 26], [2, 52], [4, 82]], 16, '#6fd46a');
    dot(10, 16, 2.6, '#3fa34a'); dot(14, 30, 2, '#3fa34a'); dot(4, 60, 2.2, '#3fa34a');
  });
  leg('stripy', 'Stripy sock', [0, 94], {}, (t, a) => {
    const p = tube([[0, 0], [0, 94]], 15, '#fff');
    ctx.setLineDash([6, 6]); strokeP(p, 15, '#9c6cff', 'butt'); ctx.setLineDash([]);
  });
  leg('tentacle', 'Tentacle leg', [0, 86], { w: 1 }, (t, a) => {
    const pts = curve(9, s => [Math.sin(s * PI) * 10 + Math.sin(s * 6 - t * 4) * Math.sin(s * PI) * (2 + 8 * a), 86 * s]);
    const tp = taperP(pts, 19, 8); ink(tp.p, '#ff8fb8', 2.2);
    for (let i = 2; i < pts.length - 1; i++) inkCircle(lerp(pts[i][0], tp.R[i][0], 0.5), lerp(pts[i][1], tp.R[i][1], 0.5), 2.4, '#ffd6e6', 0.8);
  });
  leg('elephant', 'Elephant leg', [0, 72], { w: 1, t: 2 }, (t, a) => {
    tube([[0, 0], [0, 70]], 30, '#b6b8c8');
    for (const y of [24, 30, 50]) line([[-8, y], [0, y + 2], [8, y]], 1.6, '#8a8ca0');
  });
  leg('peg', 'Wooden peg', [0, 84], { w: 1, t: 2 }, (t, a) => {
    ink(taperP([[0, 0], [0, 42], [0, 84]], 18, 10).p, '#c99260', 2.2);
    for (const y of [18, 50]) line([[-7, y], [7, y]], 2, '#8a5a32');
  });
  leg('flamingo', 'Flamingo leg', [0, 98], { w: 1, t: 2 }, (t, a) => {
    tube([[0, 12], [0, 48]], 6, '#ff8fb8'); tube([[0, 48], [2, 98]], 6, '#ff8fb8'); inkCircle(0, 48, 5, '#ff7aa8', 1.6);
    blobs([C(-6, 4, 9), C(6, 6, 9), C(0, 12, 8)], '#ffb3d0', 2);
  });

  // ---- FEET (origin at the ankle, toes point outwards +x)
  const foot = (id, name, o, draw) => add('foot', id, name, { ...o, draw });
  foot('sneaker', 'Sneaker', {}, (t, a) => {
    ink(P2('M-11,-4 L6,-4 C10,2 22,2 30,6 C37,9 37,16 30,17 L-11,17 C-15,17 -15,-4 -11,-4 Z'), '#ff5f7e', 2.2);
    ctx.fillStyle = '#fff'; ctx.fillRect(-12, 12, 46, 4);
    line([[6, 2], [12, 6]], 1.8, '#fff'); line([[11, 0], [17, 5]], 1.8, '#fff');
  });
  foot('boot', 'Rain boot', {}, (t, a) => {
    ink(P2('M-11,-14 L9,-14 L9,2 C18,3 28,6 30,12 L30,18 L-11,18 Z'), '#ffd23a', 2.2);
    ctx.fillStyle = '#c99a1a'; ctx.fillRect(-11, 14, 41, 4); hi(P2('M-6,-10 L-6,10'), 3);
  });
  foot('chicken', 'Chicken foot', { w: 1 }, (t, a) => {
    blobs([T([[0, -8], [0, 10]], 6), T([[0, 10], [20, 16]], 4.5), T([[0, 10], [9, 22]], 4.5), T([[0, 10], [-12, 17]], 4.5)], '#ffc93a', 2);
    for (const [x, y] of [[21, 16], [10, 23], [-13, 17]]) dot(x, y, 1.8, '#7a5228');
  });
  foot('flipper', 'Flipper', { w: 1 }, (t, a) => {
    const f = Math.sin(t * 8) * 4 * a;
    ink(P2(`M-9,-3 L6,-3 C18,0 34,${-6 + f} 46,${f} C50,${6 + f} 48,${16 + f} 44,${18 + f} C36,${14 + f} 32,20 24,16 C18,20 14,14 8,18 L-9,18 Z`), '#3fd0a0', 2.2);
    line([[10, 6], [40, 6 + f]], 1.6, '#1f9a74'); line([[8, 12], [28, 13]], 1.6, '#1f9a74');
  });
  foot('wheel', 'Wheel', { w: 1 }, (t, a) => {
    tube([[0, -6], [0, 10]], 6, '#9aa6c0');
    inkCircle(2, 16, 15, '#3a3448', 2); inkCircle(2, 16, 8, '#ff6fb5', 1.4);
    const sp = t * (0.6 + 9 * a);
    for (let i = 0; i < 3; i++) { const an = sp + i * 2 * PI / 3; line([[2, 16], [2 + Math.cos(an) * 7, 16 + Math.sin(an) * 7]], 1.6, '#fff'); }
    dot(2, 16, 2.5, '#fff');
  });
  foot('rocket', 'Rocket boot', { w: 1 }, (t, a) => {
    flame(2, 18, 10 + 22 * a, 7, t);
    ink(P2('M-11,-14 L9,-14 L9,0 C18,1 28,5 30,10 L30,18 L-11,18 Z'), '#d6dde8', 2.2);
    ctx.fillStyle = '#ff3f5f'; ctx.fillRect(-11, -4, 20, 5); ink(P2('M-11,4 L-18,14 L-11,14 Z'), '#ff3f5f', 1.6);
  });
  foot('ballet', 'Ballet slipper', { t: 2 }, (t, a) => {
    line([[-6, 4], [6, -10]], 2, '#ff8fc8'); line([[6, 4], [-6, -10]], 2, '#ff8fc8');
    ink(P2('M-9,2 C0,-2 14,0 24,8 C28,12 24,17 18,17 L-8,17 C-12,15 -12,4 -9,2 Z'), '#ffc4e2', 2);
    ink(P2('M2,6 C4,3 8,3 9,6 C8,8 4,8 2,6 Z'), '#ff8fc8', 1);
  });
  foot('clown', 'Clown shoe', { w: 1, t: 2 }, (t, a) => {
    ink(P2('M-11,-3 L4,-3 C10,0 18,-2 34,-5 C54,-8 60,10 52,18 L-11,18 C-15,16 -15,0 -11,-3 Z'), '#ff3f5f', 2.2);
    ctx.fillStyle = '#ffd83a'; ctx.fillRect(-12, 14, 66, 4); inkCircle(6, 0, 5, '#40b0ff', 1.6); hi(P2('M24,0 C34,-3 44,-2 48,4'), 3);
  });
  foot('skate', 'Roller skate', { t: 2 }, (t, a) => {
    ink(P2('M-10,-12 L6,-12 L6,0 C14,1 24,4 26,10 L26,15 L-10,15 Z'), '#c38bff', 2.2);
    ctx.fillStyle = '#9aa6c0'; ctx.fillRect(-10, 15, 36, 3);
    for (const x of [-3, 19]) { inkCircle(x, 22, 5, '#ffd83a', 1.6); const an = t * 12 * a; line([[x, 22], [x + Math.cos(an) * 4, 22 + Math.sin(an) * 4]], 1.4, '#c99a1a'); }
    line([[-4, -6], [4, -6]], 1.6, '#fff'); line([[-4, -1], [4, -1]], 1.6, '#fff');
  });
  foot('bunny', 'Bunny slipper', { w: 1, t: 2 }, (t, a) => {
    const flop = Math.sin(t * 7) * 0.25 * a;
    inkAt(20, 2, -0.3 + flop, P2('M-3,0 C-6,-8 -4,-18 0,-20 C4,-18 5,-8 3,0 Z'), '#fff', 1.8);
    inkAt(26, 3, 0.3 - flop, P2('M-3,0 C-6,-8 -4,-18 0,-20 C4,-18 5,-8 3,0 Z'), '#fff', 1.8);
    ink(E(10, 9, 22, 10), '#ffffff', 2.2); ctx.fillStyle = '#ffb3d0'; circle(31, 8, 3); dot(22, 4, 2, '#3a2350');
  });

  // ---- HEADS (origin at the neck; e = eye line for glasses, top = where hats sit)
  const head = (id, name, e, top, o, draw) => add('head', id, name, { e, top, ...o, draw });
  head('kid', 'Smiley head', -42, -76, {}, (t, a) => {
    tube([[0, 4], [0, -8]], 14, SKIN);
    blobs([C(0, -42, 34), C(-34, -40, 7), C(34, -40, 7)], SKIN);
    ink(P2('M-34,-44 C-38,-74 -10,-84 6,-80 C26,-78 40,-64 34,-44 C30,-56 22,-62 12,-60 C4,-66 -10,-66 -16,-60 C-24,-58 -30,-52 -34,-44 Z'), '#8a5230', 2);
    face(t, 0, -40, 1);
  });
  head('bear', 'Teddy head', -46, -72, {}, (t, a) => {
    blobs([C(0, -40, 34), C(-26, -68, 11), C(26, -68, 11)], '#c08550');
    ctx.fillStyle = '#e8b888'; circle(-26, -68, 5.5); circle(26, -68, 5.5);
    inkEllipse(0, -28, 15, 11, 0, '#f0d0a8', 1.6); ctx.fillStyle = '#3a2350'; ellipse(0, -33, 6, 4);
    face(t, 0, -46, 0.9, { mouth: false });
    line([[0, -29], [0, -24]], 1.8, '#3a2350'); ctx.beginPath(); ctx.arc(-4, -24, 4, 0.2, PI - 0.2); ctx.arc(4, -24, 4, 0.2, PI - 0.2); ctx.stroke();
  });
  head('robot', 'Robot head', -52, -82, {}, (t, a) => {
    tube([[0, -82], [0, -96]], 3, '#9aa6c0'); inkCircle(0, -98, 5, (t * 2) % 1 < 0.5 ? '#ff3f5f' : '#ff9ab0', 1.6);
    inkRect(-10, -12, 20, 14, '#8494b4', 2, 3);
    inkCircle(-36, -48, 6, '#8494b4', 2); inkCircle(36, -48, 6, '#8494b4', 2);
    ink(R(-34, -82, 68, 66, 12), '#c8d4e8', 2.4);
    ink(R(-26, -64, 52, 22, 9), '#2e3254', 1.6);
    const glow = 0.7 + 0.3 * Math.sin(t * 6);
    ctx.fillStyle = `rgba(110,240,255,${glow})`; circle(-12, -53, 5); circle(12, -53, 5);
    ctx.fillStyle = '#8494b4'; for (let i = 0; i < 4; i++) ctx.fillRect(-12 + i * 7, -34, 4, 9);
    hi(P2('M-28,-76 L18,-76'), 3);
  });
  head('cactus', 'Cactus head', -56, -100, { w: 1 }, (t, a) => {
    const wav = Math.sin(t * 5) * 0.2 * a;
    blobs([R(-24, -100, 48, 104, 24), T([[22, -44], [36, -44], [36, -62]], 11), T([[-22, -34], [-34, -34], [-34, -50]], 11)], '#5cbf5a');
    for (const [x, y] of [[-12, -86], [10, -80], [-16, -22], [14, -18], [0, -10], [38, -60], [-36, -48]]) { line([[x - 2, y], [x + 2, y - 2]], 1.4, '#2f7a34'); line([[x - 2, y - 2], [x + 2, y]], 1.4, '#2f7a34'); }
    ctx.save(); ctx.translate(0, -100); ctx.rotate(wav); flower(0, -2, 7, '#ff6fb5', '#ffd84a', 1.4); ctx.restore();
    face(t, 0, -56, 0.85);
  });
  head('fish', 'Fish head', -44, -66, { w: 1 }, (t, a) => {
    const wag = Math.sin(t * 8) * (0.08 + 0.3 * a);
    inkAt(-34, -40, wag, P2('M0,0 L-26,-20 C-22,-8 -22,8 -26,20 Z'), '#ff7a2a', 2);
    ink(P2('M-10,-64 C0,-80 18,-76 24,-62 Z'), '#ff7a2a', 2);
    ink(E(0, -40, 40, 26), '#ff9a3a', 2.4);
    for (const [x, y] of [[-18, -50], [-24, -36], [-12, -30], [-4, -56]]) { ctx.strokeStyle = '#e87a20'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 5, -0.6, 0.6); ctx.stroke(); }
    ink(E(4, -26, 9, 5), '#ff6f8a', 1.6);
    face(t, 4, -44, 0.9, { mouth: false, blush: false });
  });
  head('teapot', 'Teapot head', -42, -80, { w: 1 }, (t, a) => {
    const sp = taperP([[28, -32], [42, -44], [54, -60]], 12, 7); ink(sp.p, '#dff0ff', 2);
    const hp = new Path2D(); hp.arc(-36, -40, 13, PI * 0.45, PI * 1.55); strokeP(hp, 12, OL); strokeP(hp, 7, '#dff0ff');
    ink(E(0, -38, 36, 30), '#dff0ff', 2.4);
    ink(E(0, -66, 22, 6), '#bcdcff', 2); inkCircle(0, -74, 6, '#bcdcff', 2);
    for (const [x, y] of [[-20, -26], [22, -24], [-24, -52]]) flower(x, y, 4, '#6fa0ff', '#ffd84a', 1);
    face(t, 0, -42, 0.85);
    if (a > 0) for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; ctx.globalAlpha = (1 - k) * 0.8 * a; dot(56 + k * 8, -64 - k * 30, 4 + k * 5, '#fff'); ctx.globalAlpha = 1; }
  });
  head('duck', 'Rubber duck', -48, -74, { w: 1, t: 2 }, (t, a) => {
    blobs([C(0, -42, 33), C(-6, -76, 6), C(4, -78, 5)], '#ffd83a');
    ink(E(0, -26, 22, 8), '#ff9a2a', 2); line([[-16, -26], [16, -26]], 1.4, '#c86a1a');
    face(t, 0, -48, 0.9, { mouth: false });
  });
  head('octopus', 'Octopus head', -46, -78, { w: 1, t: 2 }, (t, a) => {
    for (let i = 0; i < 5; i++) {
      const x0 = -28 + i * 14, dir = x0 < 0 ? -1 : 1;
      const pts = curve(5, s => [x0 + dir * s * 10 + Math.sin(s * 5 + t * 4 + i) * (1.5 + 5 * a), -18 + s * 26]);
      ink(taperP(pts, 9, 3).p, '#a066dd', 1.8);
    }
    ink(P2('M-36,-22 C-40,-86 40,-86 36,-22 C20,-14 -20,-14 -36,-22 Z'), '#b77be8', 2.4);
    dot(-18, -66, 4, '#d4a8ff'); dot(20, -60, 3, '#d4a8ff'); dot(10, -72, 2.4, '#d4a8ff');
    face(t, 0, -44, 0.9);
  });
  head('alien', 'Alien head', -48, -80, { w: 1, t: 2 }, (t, a) => {
    for (const s of [-1, 1]) { tube([[s * 12, -72], [s * 18 + Math.sin(t * 6) * 3 * a * s, -96]], 3, '#6cc35a'); inkCircle(s * 18 + Math.sin(t * 6) * 3 * a * s, -98, 5, '#ffd83a', 1.6); }
    ink(P2('M0,-84 C30,-84 40,-62 34,-40 C28,-18 14,-8 0,-8 C-14,-8 -28,-18 -34,-40 C-40,-62 -30,-84 0,-84 Z'), '#8be06a', 2.4);
    for (const s of [-1, 1]) { ctx.fillStyle = '#221836'; ellipse(s * 14, -46, 9, 12, s * -0.5); dot(s * 14 + 3, -51, 2.5, '#fff'); }
    ctx.strokeStyle = '#3a2350'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -28, 5, 0.3, PI - 0.3); ctx.stroke();
  });
  head('pumpkin', 'Pumpkin head', -44, -72, { w: 1, t: 2 }, (t, a) => {
    tube([[0, -66], [4, -78]], 6, '#5a9a3a');
    for (const [x, rx] of [[-18, 18], [18, 18], [0, 20]]) inkEllipse(x, -38, rx, 30, 0, '#ff9a2a', 2.2);
    ink(P2('M-20,-48 L-8,-48 L-14,-58 Z'), '#7a3a10', 1); ink(P2('M8,-48 L20,-48 L14,-58 Z'), '#7a3a10', 1);
    ink(P2('M-18,-30 Q0,-14 18,-30 Q0,-22 -18,-30 Z'), '#7a3a10', 1);
  });

  // ---- CLOTHES (origin at the torso centre)
  const TORSO = P2('M-38,-56 C-16,-62 16,-62 38,-56 C52,-50 54,-22 52,8 C50,40 40,58 0,58 C-40,58 -50,40 -52,8 C-54,-22 -52,-50 -38,-56 Z');
  const cloth = (id, name, o, draw) => add('clothes', id, name, { ...o, draw });
  const hem = (y, col = OL) => clipped(TORSO, () => line([[-60, y], [60, y]], 3, col));
  cloth('shirt', 'Striped shirt', {}, (t, a) => {
    clipped(TORSO, () => {
      ctx.fillStyle = '#4fb4ff'; ctx.fillRect(-60, -70, 120, 90);
      ctx.fillStyle = '#fff'; for (let y = -50; y < 20; y += 14) ctx.fillRect(-60, y, 120, 6);
    });
    hem(20); ink(P2('M-12,-58 L0,-44 L12,-58 Z'), SKIN, 1.6);
  });
  cloth('dress', 'Party dress', {}, (t, a) => {
    clipped(TORSO, () => { ctx.fillStyle = '#ff7ab8'; ctx.fillRect(-60, -70, 120, 82); });
    const sw = Math.sin(t * 6) * 4 * a;
    ink(P2(`M-48,8 C-58,30 ${-68 + sw},52 ${-72 + sw},68 C-30,78 30,78 ${72 + sw},68 C${68 + sw},52 58,30 48,8 Z`), '#ff7ab8', 2.4);
    for (const [x, y] of [[-30, 30], [0, 44], [30, 30], [-46, 58], [44, 58], [-14, 62], [16, 22]]) dot(x, y, 3.5, '#fff');
    ink(R(-50, 2, 100, 10, 5), '#ffd23a', 1.6); ink(P2('M-6,6 L-18,-2 L-18,14 Z M6,6 L18,-2 L18,14 Z'), '#ffd23a', 1.4);
  });
  cloth('tutu', 'Tutu', {}, (t, a) => {
    clipped(TORSO, () => { ctx.fillStyle = '#ffc4e2'; ctx.fillRect(-60, -70, 120, 120); });
    const sw = Math.sin(t * 8) * 3 * a;
    inkEllipse(0, 36, 68 + sw, 15, 0, '#ff9ccd', 2.2); inkEllipse(0, 31, 62 - sw, 12, 0, '#ffc4e2', 2);
    for (let i = 0; i < 7; i++) star(-48 + i * 16, 34 + (i % 2) * 4, 3, '#fff', 4);
    ink(R(-46, 22, 92, 8, 4), '#ff6fb5', 1.4);
  });
  cloth('cape', 'Super cape', {
    back: (t, a) => {
      const f = Math.sin(t * 7) * (3 + 10 * a);
      ink(P2(`M-40,-54 C-60,-10 ${-74 - f},50 ${-80 - f},96 C-30,${90 + f} 30,${90 - f} ${80 + f},96 C${74 + f},50 60,-10 40,-54 Z`), '#e83a5a', 2.4);
      ctx.fillStyle = '#b81f42'; ctx.fill(P2(`M-30,-40 C-40,0 -46,50 -50,90 L-36,90 C-30,40 -24,0 -20,-40 Z`));
    },
  }, (t, a) => {
    ink(P2('M-40,-56 L-14,-60 L-20,-40 Z M40,-56 L14,-60 L20,-40 Z'), '#e83a5a', 1.6);
    ink(starP(0, -12, 22, 0.5), '#ffd23a', 2.2); hi(starP(0, -12, 14, 0.5), 1.4);
    inkCircle(0, -52, 6, '#ffd23a', 1.6);
  });
  cloth('overalls', 'Overalls', {}, (t, a) => {
    clipped(TORSO, () => { ctx.fillStyle = '#ffa040'; ctx.fillRect(-60, -70, 120, 140); ctx.fillStyle = '#ffd08a'; for (let y = -56; y < 70; y += 10) ctx.fillRect(-60, y, 120, 3); });
    const bib = P2('M-26,-30 L26,-30 L28,10 L52,10 C52,30 44,58 0,58 C-44,58 -52,30 -52,10 L-28,10 Z');
    clipped(TORSO, () => ink(bib, '#4a7fd0', 2.2));
    tube([[-24, -28], [-34, -56]], 7, '#4a7fd0'); tube([[24, -28], [34, -56]], 7, '#4a7fd0');
    inkCircle(-22, -24, 4, '#ffd23a', 1.2); inkCircle(22, -24, 4, '#ffd23a', 1.2);
    ink(R(-12, -14, 24, 16, 3), '#3a68b8', 1.4); line([[-30, 20], [-30, 50]], 1.4, '#ffd23a');
  });
  cloth('armour', 'Knight armour', {}, (t, a) => {
    clipped(TORSO, () => {
      ctx.fillStyle = '#c9d2e0'; ctx.fillRect(-60, -70, 120, 140);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-24, -70, 12, 140);
      ctx.strokeStyle = '#8a94a8'; ctx.lineWidth = 2; for (const y of [8, 24, 40]) { ctx.beginPath(); ctx.ellipse(0, y - 20, 60, 20, 0, 0.2, PI - 0.2); ctx.stroke(); }
    });
    for (const s of [-1, 1]) { inkEllipse(s * 44, -40, 16, 13, s * 0.4, '#b4bed0', 2); dot(s * 44, -40, 2.4, '#8a94a8'); }
    for (const [x, y] of [[-30, -34], [30, -34], [-36, 10], [36, 10]]) dot(x, y, 2.4, '#7a8498');
    ink(P2('M0,-40 L8,-30 L0,-20 L-8,-30 Z'), '#ffd23a', 1.4);
  });
  cloth('raincoat', 'Raincoat', { t: 2 }, (t, a) => {
    ink(P2('M-52,-20 C-54,10 -58,50 -60,70 L60,70 C58,50 54,10 52,-20 Z'), '#ffd23a', 2.2);
    clipped(TORSO, () => { ctx.fillStyle = '#ffd23a'; ctx.fillRect(-60, -70, 120, 140); });
    line([[0, -48], [0, 70]], 2, '#c99a1a');
    for (const y of [-28, -6, 16, 38]) inkCircle(-7, y, 3.5, '#40b0ff', 1);
    ink(P2('M-30,-58 L0,-44 L-10,-34 L-32,-48 Z M30,-58 L0,-44 L10,-34 L32,-48 Z'), '#ffe46a', 1.6);
    ink(R(14, 26, 22, 8, 3), '#e8b820', 1.2);
  });
  cloth('hula', 'Grass skirt', { t: 2 }, (t, a) => {
    for (let i = 0; i < 15; i++) {
      const x = -54 + i * 7.7, sw = Math.sin(t * 7 + i * 0.8) * (1 + 6 * a);
      tube([[x, 22], [x * 1.08 + sw * 0.5, 50], [x * 1.12 + sw, 78]], 5, i % 2 ? '#6cc35a' : '#a6d84a', 1.4);
    }
    ink(R(-50, 16, 100, 10, 5), '#c08550', 1.6);
    for (let i = 0; i < 6; i++) flower(-40 + i * 16, -48 + Math.abs(i - 2.5) * 6, 5, ['#ff6fb5', '#ffd23a', '#ff9a2a'][i % 3], '#fff', 1.2);
  });

  // ---- GLASSES (origin between the eyes; eyes at x = +-13)
  const glasses = (id, name, o, draw) => add('glasses', id, name, { ...o, draw });
  const ring = (p, col, lens = 'rgba(200,235,255,.45)', w = 3) => { strokeP(p, w + 4, OL); ctx.fillStyle = lens; ctx.fill(p); strokeP(p, w, col); };
  const arms = (x, col) => { line([[-x, 0], [-x - 12, -2]], 3, col); line([[x, 0], [x + 12, -2]], 3, col); };
  glasses('round', 'Round glasses', {}, (t, a) => { arms(25, '#5b3f73'); ring(C(-14, 0, 11), '#5b3f73'); ring(C(14, 0, 11), '#5b3f73'); line([[-4, -1], [4, -1]], 3, '#5b3f73'); });
  glasses('star', 'Star glasses', { w: 1 }, (t, a) => { arms(26, '#ff6fb5'); ring(starP(-15, 1, 16, 0.55), '#ff6fb5', 'rgba(255,200,240,.5)'); ring(starP(15, 1, 16, 0.55), '#ff6fb5', 'rgba(255,200,240,.5)'); });
  glasses('3d', '3-D glasses', {}, (t, a) => {
    arms(27, '#fff'); ink(R(-28, -9, 56, 18, 4), '#fff', 2);
    ctx.fillStyle = 'rgba(255,60,80,.8)'; ctx.fillRect(-24, -6, 20, 12); ctx.fillStyle = 'rgba(60,200,255,.8)'; ctx.fillRect(4, -6, 20, 12);
  });
  glasses('monocle', 'Monocle', {}, (t, a) => {
    line([[24, 4], [28, 20], [20, 34]], 1.6, '#c99a1a'); ring(C(14, 0, 12), '#ffd23a', 'rgba(220,240,255,.4)', 3.5);
  });
  glasses('goggles', 'Goggles', { w: 1 }, (t, a) => {
    tube([[-38, 0], [38, 0]], 8, '#3a3448', 1.6);
    for (const s of [-1, 1]) { ink(C(s * 15, 0, 14), '#ff9a2a', 2); ctx.fillStyle = '#7fd8ff'; circle(s * 15, 0, 9.5); dot(s * 15 - 3, -3, 3, 'rgba(255,255,255,.8)'); }
  });
  glasses('heart', 'Heart glasses', {}, (t, a) => { arms(26, '#ff3f5f'); ring(heartP(-15, -8, 28), '#ff3f5f', 'rgba(255,120,150,.55)'); ring(heartP(15, -8, 28), '#ff3f5f', 'rgba(255,120,150,.55)'); });
  glasses('shades', 'Sunglasses', { t: 2 }, (t, a) => {
    arms(26, '#222'); line([[-26, -7], [26, -7]], 3, '#222');
    for (const s of [-1, 1]) { ink(P2(`M${s * 3},-8 L${s * 26},-8 C${s * 26},4 ${s * 20},9 ${s * 14},9 C${s * 6},9 ${s * 3},2 ${s * 3},-8 Z`), '#2a2238', 1.6); line([[s * 10, -4], [s * 16, -4]], 2, 'rgba(255,255,255,.6)'); }
  });
  glasses('googly', 'Googly eyes', { w: 1, t: 2 }, (t, a) => {
    for (const s of [-1, 1]) {
      inkCircle(s * 14, -2, 12, '#fff', 2);
      const k = 1 + a * 3, px = Math.sin(t * 5 * k + s) * 4, py = 3 + Math.cos(t * 4 * k + s * 2) * 3;
      dot(s * 14 + px, -2 + py, 5.5, '#221836');
    }
  });

  // ---- HATS (origin where the hat sits on top of the head)
  const hat = (id, name, o, draw) => add('hat', id, name, { ...o, draw });
  hat('crown', 'Crown', {}, (t, a) => {
    ink(P2('M-24,4 L-27,-24 L-13,-10 L0,-30 L13,-10 L27,-24 L24,4 Z'), '#ffd23a', 2.2);
    for (const [x, y, c] of [[-12, -2, '#ff3f5f'], [0, -4, '#40b0ff'], [12, -2, '#5adc7a']]) inkCircle(x, y, 3.5, c, 1);
    for (const [x, y] of [[-27, -24], [0, -30], [27, -24]]) dot(x, y, 3, '#fff6a8');
  });
  hat('tophat', 'Top hat', {}, (t, a) => {
    ink(R(-20, -48, 40, 48, 4), '#3a3048', 2.2); ink(E(0, 2, 32, 6), '#3a3048', 2.2);
    ctx.fillStyle = '#ff3f5f'; ctx.fillRect(-19, -12, 38, 8); hi(P2('M-14,-42 L-14,-16'), 3);
  });
  hat('propeller', 'Propeller cap', { w: 1 }, (t, a) => {
    const cap = P2('M-28,4 C-28,-30 28,-30 28,4 Z');
    clipped(cap, () => { ['#ff5f7e', '#ffd83a', '#40b0ff', '#5adc7a'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-28 + i * 14, -30, 14, 36); }); });
    strokeP(cap, 4.4, OL); ink(E(18, 3, 18, 4), '#ff5f7e', 1.6);
    tube([[0, -22], [0, -32]], 3, '#9aa6c0');
    const sp = t * (1.2 + 26 * a), k = Math.abs(Math.cos(sp));
    ink(E(-12 * k, -33, 12 * k + 1, 4), '#ff5f7e', 1.4); ink(E(12 * k, -33, 12 * k + 1, 4), '#40b0ff', 1.4);
    inkCircle(0, -33, 3, '#ffd83a', 1);
  });
  hat('chef', "Chef's hat", {}, (t, a) => blobs([R(-18, -20, 36, 24, 3), C(-14, -26, 12), C(0, -34, 15), C(14, -26, 12)], '#ffffff'));
  hat('party', 'Party hat', {}, (t, a) => {
    const cone = P2('M-20,4 L0,-46 L20,4 Z');
    clipped(cone, () => { ctx.fillStyle = '#9c6cff'; ctx.fillRect(-22, -50, 44, 56); ctx.fillStyle = '#ffd83a'; for (let y = -40; y < 6; y += 12) ctx.fillRect(-22, y, 44, 5); });
    strokeP(cone, 4.4, OL); inkCircle(0, -48, 6, '#ff6fb5', 1.4);
  });
  hat('cowboy', 'Cowboy hat', {}, (t, a) => {
    ink(P2('M-46,-2 C-40,8 40,8 46,-2 C40,-6 28,0 0,0 C-28,0 -40,-6 -46,-2 Z'), '#b07a4a', 2);
    ink(P2('M-22,-1 C-24,-20 -18,-34 -8,-32 L0,-26 L8,-32 C18,-34 24,-20 22,-1 Z'), '#c08550', 2);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-21, -9, 42, 5);
  });
  hat('witch', 'Wizard hat', { t: 2 }, (t, a) => {
    ink(P2(`M-22,0 C-16,-20 -8,-40 ${8 + Math.sin(t * 5) * 4 * a},-58 C${18 + Math.sin(t * 5) * 4 * a},-60 22,-56 18,-52 C10,-40 14,-20 22,0 Z`), '#7a46e6', 2.2);
    ink(E(0, 2, 36, 6), '#7a46e6', 2); star(-4, -24, 5, '#ffd83a', 5); star(8, -10, 3.5, '#fff6a8', 5);
  });
  hat('viking', 'Viking helmet', { w: 1, t: 2 }, (t, a) => {
    for (const s of [-1, 1]) ink(P2(`M${s * 20},-10 C${s * 38},-12 ${s * 44},-26 ${s * 40},-44 C${s * 36},-30 ${s * 30},-22 ${s * 18},-20 Z`), '#fff4dc', 2);
    ink(P2('M-26,4 C-26,-34 26,-34 26,4 Z'), '#b4bed0', 2.2); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-26, -2, 52, 5);
    for (const x of [-16, -6, 6, 16]) dot(x, 0.5, 1.6, '#c99a1a');
  });
  hat('flowers', 'Flower crown', { t: 2 }, (t, a) => {
    line([[-30, 0], [0, 4], [30, 0]], 4, '#5a9a3a');
    [['#ff6fb5', -26], ['#ffd23a', -14], ['#9c6cff', 0], ['#ff9a2a', 14], ['#40b0ff', 26]].forEach(([c, x], i) => flower(x, 1 - (i % 2) * 3, 6, c, '#fff6a8', 1.4));
  });

  // ---- EXTRAS (stick anywhere; back: drawn behind the toy)
  const extra = (id, name, o, draw) => add('extra', id, name, { ...o, draw });
  extra('bowtie', 'Bow tie', {}, (t, a) => { ink(P2('M0,0 L-20,-10 L-20,10 Z M0,0 L20,-10 L20,10 Z'), '#ff3f5f', 2); dot(-13, -2, 2, '#fff'); dot(13, 3, 2, '#fff'); inkCircle(0, 0, 4.5, '#d42a4a', 1.4); });
  extra('stache', 'Moustache', { w: 1 }, (t, a) => {
    const w = Math.sin(t * 10) * 0.15 * a;
    ctx.save(); ctx.rotate(w); ink(P2('M0,-2 C-8,-8 -20,-8 -24,0 C-28,6 -34,4 -34,-2 C-30,10 -16,10 0,4 C16,10 30,10 34,-2 C34,4 28,6 24,0 C20,-8 8,-8 0,-2 Z'), '#6e4422', 2); ctx.restore();
  });
  extra('wings', 'Wings', { w: 1, back: 1 }, (t, a) => {
    const flap = Math.sin(t * 12) * 0.35 * a;
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(s, 1); ctx.rotate(-flap);
      ink(P2('M0,0 C14,-30 50,-60 84,-52 C76,-38 70,-30 62,-22 C74,-16 70,-4 52,-2 C58,8 44,14 28,10 C16,8 6,4 0,0 Z'), '#ffffff', 2.2);
      line([[14, -10], [56, -40]], 1.4, '#c8b8e8'); line([[16, -2], [50, -14]], 1.4, '#c8b8e8');
      ctx.restore();
    }
  });
  extra('tail', 'Fox tail', { w: 1, back: 1 }, (t, a) => {
    const sw = Math.sin(t * 6) * (0.08 + 0.3 * a);
    ctx.save(); ctx.rotate(sw);
    const pts = curve(6, s => [s * 56, -Math.sin(s * PI * 0.9) * 26 - s * 24]);
    const tp = taperP(pts, 10, 22); ink(tp.p, '#ff8a3a', 2.2);
    ctx.save(); ctx.clip(tp.p); ctx.fillStyle = '#fff'; circle(58, -32, 13); ctx.restore();
    ctx.restore();
  });
  extra('balloon', 'Balloon', { w: 1 }, (t, a) => {
    const bob = Math.sin(t * 2) * 3 + Math.sin(t * 9) * 6 * a;
    line([[0, 0], [6, -30], [10 + bob * 0.5, -64]], 1.4, '#5b3f73');
    ink(E(12 + bob * 0.5, -86, 17, 21), '#ff3f5f', 2); ink(P2(`M${8 + bob * 0.5},-63 L${16 + bob * 0.5},-63 L${12 + bob * 0.5},-67 Z`), '#ff3f5f', 1);
    dot(6 + bob * 0.5, -94, 4, 'rgba(255,255,255,.7)');
  });
  extra('necklace', 'Necklace', {}, (t, a) => {
    for (let i = 0; i <= 10; i++) { const an = PI * (0.1 + 0.8 * i / 10); inkCircle(Math.cos(an) * 30, -12 + Math.sin(an) * 20, 3.6, '#fff8f0', 1); }
    ink(heartP(0, 8, 16), '#ff6fb5', 1.4);
  });
  extra('flower', 'Daisy', {}, (t, a) => {
    ctx.save(); ctx.rotate(Math.sin(t * 4) * 0.3 * a);
    for (let i = 0; i < 8; i++) inkEllipse(Math.cos(i * PI / 4) * 10, Math.sin(i * PI / 4) * 10, 7, 4, i * PI / 4, '#fff', 1.4);
    inkCircle(0, 0, 6, '#ffd23a', 1.4); ctx.restore();
  });
  extra('medal', 'Gold medal', {}, (t, a) => {
    ink(P2('M-10,-24 L-2,-4 L2,-4 L10,-24 L4,-24 L0,-12 L-4,-24 Z'), '#40b0ff', 1.4);
    inkCircle(0, 6, 11, '#ffd23a', 2); ctx.fillStyle = '#fff6a8'; ctx.fill(starP(0, 6, 6));
  });
  extra('heart', 'Heart sticker', {}, (t, a) => { const k = 1 + Math.sin(t * 8) * 0.12 * a; ctx.save(); ctx.scale(k, k); ink(heartP(0, -9, 26), '#ff6fb5', 2); dot(-5, -5, 2.5, 'rgba(255,255,255,.7)'); ctx.restore(); });
  extra('jetpack', 'Jet pack', { w: 1, back: 1, t: 2 }, (t, a) => {
    for (const s of [-1, 1]) {
      flame(s * 34, 30, 10 + 26 * a, 6, t + s);
      ink(R(s * 34 - 9, -30, 18, 60, 9), '#d6dde8', 2); ctx.fillStyle = '#ff3f5f'; ctx.fillRect(s * 34 - 8, -12, 16, 5);
    }
  });
  extra('bandage', 'Plaster', { t: 2 }, (t, a) => {
    ctx.save(); ctx.rotate(-0.5); ink(R(-18, -6, 36, 12, 6), '#ffd0a8', 1.6); ctx.fillStyle = '#ffe8d4'; ctx.fillRect(-6, -5, 12, 10);
    for (const [x, y] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) dot(x, y, 0.9, '#d4a07a'); ctx.restore();
  });

  const PART = {};
  for (const p of PARTS) PART[p.cat + ':' + p.id] = p;
  const key = p => p.cat + ':' + p.id;

  // ------------------------------------------------------------------ the toy
  const emptyToy = () => ({ head: null, clothes: null, glasses: null, hat: null, arm: { L: null, R: null }, hand: { L: null, R: null }, leg: { L: null, R: null }, foot: { L: null, R: null }, extras: [] });
  const sx = s => (s === 'L' ? -1 : 1);
  const counts = toy => ({
    head: toy.head ? 1 : 0,
    arm: +!!toy.arm.L + +!!toy.arm.R,
    hand: +!!(toy.arm.L && toy.hand.L) + +!!(toy.arm.R && toy.hand.R),
    leg: +!!toy.leg.L + +!!toy.leg.R,
    foot: +!!(toy.leg.L && toy.foot.L) + +!!(toy.leg.R && toy.foot.R),
  });
  const NEED = [['head', 1, 'head', 'heads'], ['arm', 2, 'arm', 'arms'], ['hand', 2, 'hand', 'hands'], ['leg', 2, 'leg', 'legs'], ['foot', 2, 'foot', 'feet']];
  const isComplete = toy => { const c = counts(toy); return NEED.every(([k, n]) => c[k] >= n); };
  const needText = toy => {
    const c = counts(toy), miss = NEED.filter(([k, n]) => c[k] < n).map(([k, n, one, many]) => `${NUM_WORDS[n - c[k]]} more ${n - c[k] === 1 ? one : many}`);
    return miss.length ? 'Your toy needs ' + miss.join(', ') + '.' : 'Your toy has everything!';
  };

  // where things attach, in screen space (while building; nothing is moving)
  const shoulder = s => [TX + sx(s) * SH, TY + SHY];
  const wrist = (toy, s) => { const A = PART['arm:' + toy.arm[s]]; return [TX + sx(s) * (SH + A.end[0]), TY + SHY + A.end[1]]; };
  const hip = s => [TX + sx(s) * HIP, TY + HIPY];
  const ankle = (toy, s) => { const L = PART['leg:' + toy.leg[s]]; return [TX + sx(s) * (HIP + L.end[0]), TY + HIPY + L.end[1]]; };
  const neck = () => [TX, TY + NECK];
  // drop targets for a category: [{ side, x, y }] measured to where the part's middle would be
  const targets = (toy, cat) => {
    const out = [];
    for (const [s, d] of SIDES) {
      if (cat === 'arm') { const [x, y] = shoulder(s); out.push({ side: s, x: x + d * 22, y: y + 30, ax: x, ay: y }); }
      if (cat === 'hand' && toy.arm[s]) { const [x, y] = wrist(toy, s); out.push({ side: s, x, y: y + 14, ax: x, ay: y }); }
      if (cat === 'leg') { const [x, y] = hip(s); out.push({ side: s, x, y: y + 42, ax: x, ay: y }); }
      if (cat === 'foot' && toy.leg[s]) { const [x, y] = ankle(toy, s); out.push({ side: s, x: x + d * 10, y: y + 6, ax: x, ay: y }); }
    }
    const [nx, ny] = neck();
    if (cat === 'head') out.push({ x: nx, y: ny - 40, ax: nx, ay: ny });
    if (cat === 'clothes') out.push({ x: TX, y: TY, ax: TX, ay: TY });
    if (toy.head && (cat === 'glasses' || cat === 'hat')) {
      const H = PART['head:' + toy.head], y = ny + (cat === 'glasses' ? H.e : H.top);
      out.push({ x: nx, y: cat === 'hat' ? y - 16 : y, ax: nx, ay: y });
    }
    return out;
  };
  const inToyZone = (x, y) => x > 196 && x < 552 && y > 64 && y < 448;
  const nearest = (toy, cat, x, y) => {
    let best = null, bd = 150;
    for (const tg of targets(toy, cat)) { const d = Math.hypot(tg.x - x, tg.y - y); if (d < bd) { bd = d; best = tg; } }
    return best;
  };

  // placed parts, top-most first, with a hit circle
  const placed = toy => {
    const out = [];
    for (let i = toy.extras.length - 1; i >= 0; i--) out.push({ cat: 'extra', i, x: TX + toy.extras[i].x, y: TY + toy.extras[i].y, r: 26 });
    if (toy.head) {
      const H = PART['head:' + toy.head], [nx, ny] = neck();
      if (toy.hat) out.push({ cat: 'hat', x: nx, y: ny + H.top - 16, r: 26 });
      if (toy.glasses) out.push({ cat: 'glasses', x: nx, y: ny + H.e, r: 22 });
    }
    for (const [s, d] of SIDES) if (toy.arm[s] && toy.hand[s]) { const [x, y] = wrist(toy, s); out.push({ cat: 'hand', side: s, x, y: y + 14, r: 20 }); }
    for (const [s, d] of SIDES) if (toy.leg[s] && toy.foot[s]) { const [x, y] = ankle(toy, s); out.push({ cat: 'foot', side: s, x: x + d * 10, y: y + 6, r: 20 }); }
    if (toy.head) { const [nx, ny] = neck(); out.push({ cat: 'head', x: nx, y: ny - 40, r: 34 }); }
    for (const [s, d] of SIDES) if (toy.arm[s]) { const [x, y] = shoulder(s); out.push({ cat: 'arm', side: s, x: x + d * 22, y: y + 30, r: 24 }); }
    for (const [s, d] of SIDES) if (toy.leg[s]) { const [x, y] = hip(s); out.push({ cat: 'leg', side: s, x, y: y + 42, r: 22 }); }
    if (toy.clothes) out.push({ cat: 'clothes', x: TX, y: TY, r: 44 });
    return out;
  };
  // take a placed part off the toy; returns { id, kids } (kids ride along: a hand on an arm, etc.)
  const takeOff = (toy, h) => {
    const c = h.cat, s = h.side;
    if (c === 'extra') return { id: toy.extras.splice(h.i, 1)[0].id, kids: {} };
    if (c === 'arm') { const r = { id: toy.arm[s], kids: { hand: toy.hand[s] } }; toy.arm[s] = toy.hand[s] = null; return r; }
    if (c === 'leg') { const r = { id: toy.leg[s], kids: { foot: toy.foot[s] } }; toy.leg[s] = toy.foot[s] = null; return r; }
    if (c === 'head') { const r = { id: toy.head, kids: { glasses: toy.glasses, hat: toy.hat } }; toy.head = toy.glasses = toy.hat = null; return r; }
    if (c === 'hand' || c === 'foot') { const r = { id: toy[c][s], kids: {} }; toy[c][s] = null; return r; }
    const r = { id: toy[c], kids: {} }; toy[c] = null; return r;
  };

  // draw the toy. a: how alive (0..1), ft: dance time
  const drawToy = (g, a, ft) => {
    const toy = g.toy, t = g.tt;
    const P = (cat, id) => PART[cat + ':' + id];
    ctx.save();
    const bounce = -Math.abs(Math.sin(ft * 5)) * 26 * a;
    ctx.translate(TX, TY + bounce + 14 * a); ctx.rotate(Math.sin(ft * 5) * 0.07 * a);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const e of toy.extras) if (P('extra', e.id).back) { ctx.save(); ctx.translate(e.x, e.y); P('extra', e.id).draw(t, a); ctx.restore(); }
    if (toy.clothes && P('clothes', toy.clothes).back) P('clothes', toy.clothes).back(t, a);
    for (const [s, d] of SIDES) {
      if (!toy.leg[s]) continue;
      const L = P('leg', toy.leg[s]);
      ctx.save(); ctx.translate(d * HIP, HIPY); ctx.scale(d, 1); ctx.rotate(Math.sin(ft * 10 + d * 1.6) * 0.22 * a);
      L.draw(t, a);
      if (toy.foot[s]) { ctx.translate(L.end[0], L.end[1]); P('foot', toy.foot[s]).draw(t, a); }
      ctx.restore();
    }
    ink(TORSO, '#ffe2bd', 2.6);
    clipped(TORSO, () => { ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-20, -30, 14, 22, 0.3); ctx.fillStyle = 'rgba(200,130,70,.18)'; ellipse(30, 30, 30, 34); });
    // empty peg holes show where parts go
    const hole = (x, y) => { ctx.fillStyle = 'rgba(120,70,40,.55)'; ellipse(x, y, 6, 4); };
    for (const [s, d] of SIDES) { if (!toy.arm[s]) hole(d * (SH - 4), SHY); if (!toy.leg[s]) hole(d * HIP, HIPY - 2); }
    if (!toy.head) hole(0, NECK);
    if (toy.clothes) P('clothes', toy.clothes).draw(t, a);
    else { ctx.fillStyle = 'rgba(150,90,50,.5)'; circle(0, 18, 2.5); }
    for (const [s, d] of SIDES) {
      if (!toy.arm[s]) continue;
      const A = P('arm', toy.arm[s]);
      ctx.save(); ctx.translate(d * SH, SHY); ctx.scale(d, 1); ctx.rotate(-Math.abs(Math.sin(ft * 6 + d)) * 0.7 * a);
      A.draw(t, a);
      if (toy.hand[s]) { ctx.translate(A.end[0], A.end[1]); ctx.rotate(A.ang - PI / 2); P('hand', toy.hand[s]).draw(t, a); }
      ctx.restore();
    }
    if (toy.head) {
      const H = P('head', toy.head);
      ctx.save(); ctx.translate(0, NECK); ctx.rotate(Math.sin(ft * 4) * 0.14 * a);
      H.draw(t, a);
      if (toy.glasses) { ctx.save(); ctx.translate(0, H.e); P('glasses', toy.glasses).draw(t, a); ctx.restore(); }
      if (toy.hat) { ctx.save(); ctx.translate(0, H.top); P('hat', toy.hat).draw(t, a); ctx.restore(); }
      ctx.restore();
    }
    for (const e of toy.extras) if (!P('extra', e.id).back) { ctx.save(); ctx.translate(e.x, e.y); P('extra', e.id).draw(t, a); ctx.restore(); }
    ctx.restore();
  };

  // a part drawn on its own, scaled to fit a box centred on (x, y)
  const PV = { arm: [24, 38, 0.72], hand: [2, 18, 1.15], leg: [0, 48, 0.62], foot: [14, 4, 1.05], head: [0, -46, 0.66], clothes: [0, 2, 0.44], glasses: [0, 0, 1.05], hat: [0, -18, 0.95], extra: [0, 0, 0.9] };
  const PVX = { 'arm:noodle': [20, 44, 0.62], 'arm:tentacle': [26, 36, 0.7], 'leg:pogo': [0, 52, 0.56], 'leg:flamingo': [0, 52, 0.56], 'foot:clown': [20, 4, 0.9], 'foot:flipper': [18, 6, 0.95], 'head:cactus': [0, -52, 0.58], 'head:robot': [0, -50, 0.6],
    'extra:wings': [0, -20, 0.42], 'extra:tail': [28, -28, 0.7], 'extra:balloon': [8, -50, 0.62], 'extra:jetpack': [0, 6, 0.62], 'clothes:cape': [0, 18, 0.42], 'clothes:hula': [0, 12, 0.48], 'hat:witch': [0, -24, 0.85], 'hat:cowboy': [0, -12, 0.85] };
  const drawPart = (p, x, y, t, scale = 1, flip = 1) => {
    const [cx, cy, k] = PVX[key(p)] || PV[p.cat];
    ctx.save(); ctx.translate(x, y); ctx.scale(k * scale * flip, k * scale); ctx.translate(-cx, -cy);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (p.cat === 'clothes') { ctx.globalAlpha = 0.35; ink(TORSO, '#ffe2bd', 2); ctx.globalAlpha = 1; p.back?.(t, 0); }
    p.draw(t, 0);
    ctx.restore();
  };
  // a part drawn at real size with its attachment point at (x, y), for dragging
  const drawAt = (p, x, y, t, flip) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip, 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (p.cat === 'clothes') p.back?.(t, 0);
    p.draw(t, 0); ctx.restore();
  };
  // where the attachment point sits relative to the part's middle (the bit you hold)
  const GRAB = { arm: [22, 30], hand: [0, 14], leg: [0, 42], foot: [10, 6], head: [0, -40], clothes: [0, 0], glasses: [0, 0], hat: [0, -16], extra: [0, 0] };

  // ------------------------------------------------------------------ bin layout
  const TAB = (i) => i < 5 ? { x: BIN.x + 10 + i * 72, y: BIN.y + 10, w: 66, h: 34 } : { x: BIN.x + 10 + (i - 5) * 90, y: BIN.y + 48, w: 84, h: 34 };
  const SLOT = i => ({ x: BIN.x + 12 + (i % 4) * 90, y: BIN.y + 92 + Math.floor(i / 4) * 96, w: 84, h: 90 });
  const binParts = g => PARTS.filter(p => p.cat === g.tab && p.t <= g.tier);
  const CHECK = { x: 14, y: 66, w: 170, h: 214 };
  const checkRow = i => ({ x: CHECK.x + 6, y: CHECK.y + 44 + i * 33, w: CHECK.w - 12, h: 30 });

  const toast = (g, s, say = false) => { g.msg = { s, t: 2.6 }; if (say) speak(s); };
  const snapshot = g => { g.hist.push(JSON.stringify(g.toy)); if (g.hist.length > 40) g.hist.shift(); };
  const LAUGHS = ['Ha ha ha!', 'Hee hee!', 'So silly!', 'Ha ha!', 'Too funny!'];

  const place = (g, id, kids, tg) => {
    const toy = g.toy, p = PART[id], cat = p.cat, s = tg.side;
    if (cat === 'arm' || cat === 'leg' || cat === 'hand' || cat === 'foot') toy[cat][s] = p.id;
    else if (cat !== 'extra') toy[cat] = p.id;
    if (cat === 'arm' && kids.hand) toy.hand[s] = kids.hand;
    if (cat === 'leg' && kids.foot) toy.foot[s] = kids.foot;
    if (cat === 'head') { if (kids.glasses) toy.glasses = kids.glasses; if (kids.hat) toy.hat = kids.hat; }
    SFX.pop(); tone(660, 0.08, 'triangle', 0.07, 0.05); burst(tg.ax, tg.ay, 8, { spread: 70, up: 30 });
    if (p.w) {
      if (g.laugh <= 0) floatText(110, 330, pick(LAUGHS), '#ff6fb5', false, 22);
      g.laugh = 1.4;
      [700, 820, 700, 860].forEach((f, i) => tone(f, 0.08, 'sine', 0.06, i * 0.09));
    }
  };

  const dropDrag = g => {
    const d = g.drag, p = PART[d.id], x = pointer.x, y = pointer.y, toy = g.toy;
    g.drag = null;
    if (x >= BIN.x - 6 && y > BIN.y - 10) { if (d.fromToy) { SFX.blip(); toast(g, 'Back in the bin!'); } return; }
    if (p.cat === 'extra') {
      if (!inToyZone(x, y)) return;
      if (!d.fromToy) snapshot(g);
      toy.extras.push({ id: p.id, x: clamp(x - TX, -170, 170), y: clamp(y - TY, -200, 180) });
      return place(g, d.id, {}, { ax: x, ay: y });
    }
    const tg = nearest(toy, p.cat, x, y);
    if (!tg) {
      if (!inToyZone(x, y)) return;
      const c = counts(toy);
      if (p.cat === 'hand' && c.arm < 2) return toast(g, 'Add an arm first!', true);
      if (p.cat === 'foot' && c.leg < 2) return toast(g, 'Add a leg first!', true);
      if ((p.cat === 'glasses' || p.cat === 'hat') && !toy.head) return toast(g, 'Add a head first!', true);
      return toast(g, 'Drop it closer to the toy!');
    }
    if (!d.fromToy) snapshot(g);
    place(g, d.id, d.kids || {}, tg);
  };

  MG.toymaker = {
    kind: 'action',
    title: () => 'Toy Maker',
    icon: () => '🧸',
    how: () => 'Drag parts from the bin onto the toy. It needs 2 arms, 2 hands, 2 legs, 2 feet and a head. Make it as silly as you like, then press Finished!',
    init(g) {
      Object.assign(g, { toy: emptyToy(), hist: [], tab: 'head', drag: null, press: null, msg: null, laugh: 0, tt: 0, st: 'build', ft: 0, alive: 0, complete: false });
      g.say = needText(g.toy);
      g.progress = '0 of 9 parts';
    },
    start(g) { speak('Drag a head, arms, hands, legs and feet onto the toy!'); },
    update(g, dt, id) {
      g.tt += dt;
      if (g.msg && (g.msg.t -= dt) <= 0) g.msg = null;
      g.laugh = Math.max(0, g.laugh - dt);
      if (g.st === 'finish') {
        g.ft += dt; g.alive = Math.min(1, g.alive + dt * 2);
        if (Math.floor(g.ft * 2) !== Math.floor((g.ft - dt) * 2)) burst(rand(220, 520), rand(90, 200), 10, { colors: ['#ff6fb5', '#ffd83a', '#40b0ff', '#5adc7a'] });
        if (g.ft > 5.5) { g.score = 1; g.done = true; }
        return;
      }
      const toy = g.toy;
      // tabs, buttons, keys
      if (id && id.startsWith('tab:')) { g.tab = id.slice(4); return; }
      for (let i = 0; i < CATS.length; i++) if (pressed[String(i + 1)]) { g.tab = CATS[i][0]; SFX.click(); }
      if (id === 'undo' && g.hist.length) { g.toy = JSON.parse(g.hist.pop()); g.drag = g.press = null; toast(g, 'Undo!'); }
      if (id === 'finish' && isComplete(toy)) {
        g.st = 'finish'; g.ft = 0; g.drag = g.press = null; g.msg = null;
        speak('BEEP. What. A. Wonderful. Toy.');
        [523, 784, 659, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.04, i * 0.12));
        return;
      }
      // pointer: start dragging from the bin, or press a part on the toy
      if (pointer.clicked && !id) {
        const px = pointer.x, py = pointer.y;
        const list = binParts(g);
        const si = list.findIndex((p, i) => inRect(SLOT(i), px, py));
        const ri = NEED.findIndex((n, i) => inRect(checkRow(i), px, py));
        if (si >= 0) { g.drag = { id: key(list[si]), kids: {} }; SFX.pick(); }
        else if (ri >= 0) { g.tab = NEED[ri][0]; SFX.click(); }
        else {
          const h = placed(g.toy).find(h => Math.hypot(h.x - px, h.y - py) < h.r);
          if (h) g.press = { h, x0: px, y0: py };
        }
      }
      if (g.press) {
        const pr = g.press;
        if (Math.hypot(pointer.x - pr.x0, pointer.y - pr.y0) > 10) {
          snapshot(g); const off = takeOff(g.toy, pr.h);
          g.drag = { id: pr.h.cat + ':' + off.id, kids: off.kids, fromToy: true }; g.press = null; SFX.pick();
        } else if (!pointer.down) {
          snapshot(g); const off = takeOff(g.toy, pr.h); g.press = null;
          SFX.pop(); burst(pr.x0, pr.y0, 8, { spread: 60, up: 40 });
          toast(g, `${PART[pr.h.cat + ':' + off.id].name} off! (Undo puts it back)`);
        }
      }
      if (g.drag && !pointer.down) dropDrag(g);
      // progress
      const c = counts(g.toy), n = Math.min(c.head, 1) + Math.min(c.arm, 2) + Math.min(c.hand, 2) + Math.min(c.leg, 2) + Math.min(c.foot, 2);
      const done = n === 9;
      if (done && !g.complete) { SFX.sparkle(); speak('Your toy is ready! Add more fun things, or press Finished!'); toast(g, 'Toy ready! Press Finished!'); burst(TX, TY, 20); }
      g.complete = done;
      g.score = done ? 1 : n / 9 * 0.5;
      g.progress = done ? 'Toy ready!' : `${n} of 9 parts`;
      g.say = done ? 'Your toy is ready! Add more, or press Finished!' : needText(g.toy);
    },
    draw(g) {
      const t = g.tt, fin = g.st === 'finish';
      // pegboard behind the workbench
      rrect(194, 64, 358, 384, 18, 'rgba(255,246,228,.94)', '#d8b48a', 3);
      ctx.fillStyle = 'rgba(170,120,80,.22)';
      for (let x = 214; x < 540; x += 22) for (let y = 82; y < 440; y += 22) circle(x, y, 2.2);
      // a few tools hanging up
      ink(R(212, 82, 6, 44, 3), '#c99260', 1.4); ink(R(204, 78, 22, 10, 3), '#9aa6c0', 1.4);
      ink(R(526, 86, 6, 30, 2), '#ff6fb5', 1.4); ink(R(527.5, 116, 3, 22, 1), '#c8d2e4', 1.2);
      // the workbench
      ink(R(190, 456, 366, 92, 6), '#b8743e', 2.4);
      for (const x of [216, 380]) { ink(R(x, 474, 140, 46, 6), '#c8844a', 2); inkCircle(x + 70, 497, 5, '#ffd23a', 1.4); }
      ink(R(182, 444, 382, 18, 6), '#d9965a', 2.6); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(188, 447, 370, 3);
      // the stand that holds the torso
      if (!fin || g.alive < 0.3) {
        ctx.globalAlpha = fin ? 1 - g.alive / 0.3 : 1;
        ink(R(TX - 5, TY + 20, 10, 430 - TY), '#9aa6c0', 1.8); ink(E(TX, 446, 34, 7), '#7a8498', 2);
        ctx.globalAlpha = 1;
      }
      drawToy(g, fin ? g.alive : 0, g.ft);
      // where a dragged part can go
      if (g.drag) {
        const p = PART[g.drag.id], tg = nearest(g.toy, p.cat, pointer.x, pointer.y);
        for (const s of targets(g.toy, p.cat)) {
          const on = tg && s.ax === tg.ax && s.ay === tg.ay;
          ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = on ? '#ff6fb5' : 'rgba(154,106,224,.7)'; ctx.lineWidth = on ? 4 : 2.5;
          ctx.beginPath(); ctx.arc(s.ax, s.ay, on ? 14 + Math.sin(t * 10) * 2 : 11, 0, PI * 2); ctx.stroke(); ctx.restore();
          if (on) { ctx.fillStyle = 'rgba(255,111,181,.25)'; circle(s.ax, s.ay, 14); }
        }
      }

      // checklist
      panel(CHECK.x, CHECK.y, CHECK.w, CHECK.h, 16);
      text('Toy needs:', CHECK.x + CHECK.w / 2, CHECK.y + 22, 18, '#5a2a6e', 'center', 700);
      const c = counts(g.toy);
      NEED.forEach(([k, n, one, many], i) => {
        const r = checkRow(i), ok = c[k] >= n;
        rrect(r.x, r.y, r.w, r.h, 10, ok ? 'rgba(90,220,122,.22)' : (g.tab === k ? 'rgba(255,111,181,.16)' : 'rgba(154,106,224,.1)'));
        text(`${n} ${n === 1 ? one : many}`, r.x + 10, r.y + r.h / 2, 17, '#5a2a6e', 'left', 600);
        if (ok) {
          inkCircle(r.x + r.w - 17, r.y + r.h / 2, 10, '#5adc7a', 1.4);
          line([[r.x + r.w - 22, r.y + r.h / 2], [r.x + r.w - 18, r.y + r.h / 2 + 4], [r.x + r.w - 11, r.y + r.h / 2 - 5]], 2.6, '#fff');
        } else text(`${c[k]}/${n}`, r.x + r.w - 10, r.y + r.h / 2, 15, '#9a7aaa', 'right', 700);
      });

      // Aubrey, the toymaker
      const laughing = g.laugh > 0 || fin;
      const fr = fin ? (Math.floor(g.ft * 2) % 2 ? 'twirl' : 'jump') : laughing ? 'jump' : 'idle_front';
      drawAubrey(100, 530, fr, 1, laughing ? Math.abs(Math.sin(t * (fin ? 6 : 10))) * (fin ? 22 : 10) : 0);

      if (fin) {
        // Tinker Bot comes to see
        const k = Math.min(1, g.ft * 1.5);
        drawCritter('Tinker Bot', lerp(1060, 800, k), 440, 1, -1);
        if (g.ft > 0.6) {
          panel(596, 120, 344, 92, 18);
          ctx.fillStyle = 'rgba(255,248,252,.96)'; ctx.fill(P2('M760,210 L790,240 L790,210 Z'));
          text('BEEP. What. A.', 768, 150, 24, '#5a2a6e', 'center', 700);
          outlined('Wonderful. Toy.', 768, 184, 28, '#ff6fb5', 'center', '#fff');
        }
        if (g.ft > 1) outlined('It\'s alive!', TX, 500, 32, '#fff6a8');
      } else {
        // parts bin
        panel(BIN.x, BIN.y, BIN.w, BIN.h, 18);
        CATS.forEach(([k, label], i) => { const r = TAB(i); button('tab:' + k, r.x, r.y, r.w, r.h, label, { color: g.tab === k ? '#ff6fb5' : '#b08ad8', size: 15 }); });
        const list = binParts(g);
        list.forEach((p, i) => {
          const r = SLOT(i), hov = inRect(r) && !g.drag;
          rrect(r.x, r.y, r.w, r.h, 12, hov ? '#fff4fb' : '#fdf7ff', hov ? '#ff6fb5' : '#e2c6f5', 2.5);
          ctx.save(); ctx.beginPath(); ctx.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 18); ctx.clip();
          if (!(g.drag && g.drag.id === key(p) && !g.drag.fromToy)) drawPart(p, r.x + r.w / 2, r.y + 38, t, hov ? 1.08 : 1);
          ctx.restore();
          text(p.name, r.x + r.w / 2, r.y + r.h - 9, p.name.length > 12 ? 10.5 : 12, '#5a2a6e', 'center', 600);
        });
        if (g.drag?.fromToy) {
          rrect(BIN.x + 8, BIN.y + 88, BIN.w - 16, BIN.h - 96, 14, 'rgba(255,111,181,.12)', '#ff6fb5', 3);
          emoji('🗑️', BIN.x + BIN.w / 2, BIN.y + 220, 54); text('Drop here to take it off', BIN.x + BIN.w / 2, BIN.y + 270, 18, '#5a2a6e', 'center', 700);
        }
        button('undo', BIN.x, 460, 120, 56, 'Undo', { on: g.hist.length > 0, color: '#9a6ae0', size: 18, icon: '↩️' });
        const ok = isComplete(g.toy);
        button('finish', BIN.x + 132, 460, BIN.w - 132, 56, 'Finished!', { on: ok, color: '#5fb87a', size: 22, icon: '✨', sub: ok ? null : 'Needs all the parts' });
        if (ok) { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5); rrect(BIN.x + 128, 456, BIN.w - 124, 64, 18, null, '#fff6a8', 4); ctx.restore(); }
      }

      // the part being dragged
      if (g.drag) {
        const p = PART[g.drag.id], side = ['arm', 'hand', 'leg', 'foot'].includes(p.cat);
        const flip = side && pointer.x < TX ? -1 : 1, [gx, gy] = GRAB[p.cat];
        ctx.save(); ctx.shadowColor = 'rgba(40,20,60,.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
        drawAt(p, pointer.x - gx * flip, pointer.y - gy, t, flip);
        // anything riding along (a hand on an arm, a hat on a head)
        const k = g.drag.kids || {};
        if (k.hand) { ctx.save(); ctx.translate(pointer.x - gx * flip, pointer.y - gy); ctx.scale(flip, 1); ctx.translate(p.end[0], p.end[1]); ctx.rotate(p.ang - PI / 2); PART['hand:' + k.hand].draw(t, 0); ctx.restore(); }
        if (k.foot) { ctx.save(); ctx.translate(pointer.x - gx * flip, pointer.y - gy); ctx.scale(flip, 1); ctx.translate(p.end[0], p.end[1]); PART['foot:' + k.foot].draw(t, 0); ctx.restore(); }
        if (k.glasses) drawAt(PART['glasses:' + k.glasses], pointer.x - gx, pointer.y - gy + p.e, t, 1);
        if (k.hat) drawAt(PART['hat:' + k.hat], pointer.x - gx, pointer.y - gy + p.top, t, 1);
        ctx.restore();
      }
      if (g.msg) {
        ctx.font = `700 18px ${FONT}`;
        const w = ctx.measureText(g.msg.s).width + 36;
        ctx.globalAlpha = Math.min(1, g.msg.t * 3);
        darkPanel(TX - w / 2, 480, w, 36, 18); text(g.msg.s, TX, 498, 18, '#fff', 'center', 700);
        ctx.globalAlpha = 1;
      }
    },
    // for tests: where the bin slots and drop targets are
    _test: { PARTS, SLOT, TAB, targets, placed, isComplete, counts, CATS, binParts },
  };

  restage('toyshop', {
    games: [['toymaker', 'crystal', {}], ['robotcode', 'ribbon', {}]],
    intro: ['*:Toys are stacked all the way to the ceiling, and a little train toots along the top shelf.',
      'N:BEEP BOOP. Welcome. To. Tinker\'s. Toy. Shop.',
      'N:I. Need. A. New. Toy. But. My. Toy. Has. No. Head. No. Arms. No. Legs. Only. A. Tummy.',
      'N:Pick. Parts. From. The. Bin. Two. Arms. Two. Hands. Two. Legs. Two. Feet. One. Head.',
      'N:Any. Parts. You. Like. Silly. Parts. Are. Allowed. BOOP.',
      "A:excited:I'm a toymaker! Can it have a teapot for a head?"],
    mid: ['N:BEEP. What. A. Toy. Now. My. Toy. Robot. Is. Lost. On. The. Play. Mat.',
      'N:It. Only. Understands. Arrows. Plan. Every. Step. Then. Press. GO.',
      'A:thinking:Like giving it directions, one square at a time!'],
  });
}
