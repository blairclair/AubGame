'use strict';
// Seashell Beach, new games: Turtle Guard (action) and Captain Pinch's treasure map (learn).
{
  const DIRW = { R: 'RIGHT', L: 'LEFT', U: 'UP', D: 'DOWN' };
  const DV = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
  const BACK = { R: 'L', L: 'R', U: 'D', D: 'U' };
  const KEYDIR = { arrowright: 'R', arrowleft: 'L', arrowup: 'U', arrowdown: 'D' };
  const LETTERS = 'ABCDE';
  const plural = (n, w) => `${NUM_WORDS[n]} ${w}${n === 1 ? '' : 's'}`;
  const still = (key, paint) => blit(sprite(key, W, H, 0, 0, paint), 0, 0);

  // ---- shared hand-drawn pieces -------------------------------------------------------
  // a chunky arrow pointing dir (R/L/U/D), centred on x,y
  function arrow(dir, x, y, s, col = '#ff6a4a') {
    ctx.save(); ctx.translate(x, y); ctx.rotate({ R: 0, D: Math.PI / 2, L: Math.PI, U: -Math.PI / 2 }[dir]); ctx.scale(s / 30, s / 30);
    ink(P2('M-26,-9 L4,-9 L4,-22 L28,0 L4,22 L4,9 L-26,9 Z'), col, 2.4);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-22, -6, 24, 4);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-22, 4, 24, 4);
    ctx.restore();
  }
  function smallShell(x, y, r, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(r / 30, r / 30);
    ink(P2('M0,26 L-30,-4 C-30,-26 -14,-34 0,-34 C14,-34 30,-26 30,-4 Z'), col, 2.4);
    ctx.strokeStyle = mix(col, '#7a3a5a', 0.35); ctx.lineWidth = 3;
    for (const k of [-0.7, -0.35, 0, 0.35, 0.7]) { ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(k * 26, -26 + Math.abs(k) * 12); ctx.stroke(); }
    ctx.restore();
  }
  function starfish(x, y, r, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const p = new Path2D();
    for (let i = 0; i <= 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    p.closePath(); ink(p, col, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; circle(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 1.4); }
    ctx.restore();
  }
  // the pirate's treasure chest; open 0..1
  function chest(x, y, s, open = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(70,40,20,.25)'; ellipse(0, 2, 40, 7);
    if (open > 0) {
      ctx.save(); ctx.globalAlpha = open;
      const gr = ctx.createRadialGradient(0, -30, 2, 0, -30, 70); gr.addColorStop(0, 'rgba(255,240,140,.95)'); gr.addColorStop(1, 'rgba(255,240,140,0)');
      ctx.fillStyle = gr; ctx.fillRect(-80, -110, 160, 120);
      ctx.strokeStyle = 'rgba(255,240,150,.7)'; ctx.lineWidth = 4;
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(S.t * 2) * 0.04; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 34, -26 + Math.sin(a) * 34); ctx.lineTo(Math.cos(a) * (58 + open * 10), -26 + Math.sin(a) * (58 + open * 10)); ctx.stroke(); }
      ctx.restore();
    }
    // box: outline first, then planks
    ink(P2('M-34,-30 L34,-30 L34,0 L-34,0 Z'), '#b06a34', 2.4);
    ctx.strokeStyle = '#8a4a20'; ctx.lineWidth = 1.6;
    for (const yy of [-20, -10]) { ctx.beginPath(); ctx.moveTo(-32, yy); ctx.lineTo(32, yy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-32, -29, 64, 4);
    if (open > 0) {
      ctx.fillStyle = '#5a2a10'; ctx.fillRect(-32, -34, 64, 6);
      const R = rng(4);
      for (let i = 0; i < 11; i++) inkCircle(-24 + R() * 48, -32 - R() * 12 * open, 6, i % 4 ? '#ffd23a' : '#ffe680', 1.2);
      inkAt(-10, -44 * open, 0.3, P2('M-6,0 L0,-8 L6,0 L0,8 Z'), '#ff5f9e', 1.2);
      inkAt(14, -42 * open, -0.2, P2('M-5,0 L0,-7 L5,0 L0,7 Z'), '#5adcff', 1.2);
      ink(P2('M-34,-30 L-36,-62 C-20,-74 20,-76 30,-66 L34,-30 Z'), '#c47a3e', 2.4);
      ctx.fillStyle = '#e8a040'; ctx.fillRect(-26, -66, 5, 34); ctx.fillRect(20, -68, 5, 36);
    } else {
      ink(P2('M-36,-30 C-36,-50 36,-50 36,-30 Z'), '#c47a3e', 2.4);
      ctx.fillStyle = '#e8a040'; ctx.fillRect(-26, -44, 5, 14); ctx.fillRect(21, -44, 5, 14);
    }
    ctx.fillStyle = '#e8a040'; ctx.fillRect(-26, -30, 5, 30); ctx.fillRect(21, -30, 5, 30);
    inkRect(-6, -26, 12, 13, '#ffd23a', 1.4, 2); ctx.fillStyle = '#5a2a10'; circle(0, -21, 2);
    for (const cx of [-34, 34]) for (const cy of [-30, 0]) inkCircle(cx, cy, 3, '#ffd23a', 1);
    ctx.restore();
  }

  // ---- landmarks on the treasure map; drawn for a ~100px cell ---------------------------
  const groundShadow = (w = 24) => { ctx.fillStyle = 'rgba(110,70,30,.25)'; ellipse(2, 28, w, 6); };
  const MARKS = {
    palm: ['palm tree', () => {
      ink(P2('M-24,30 C-20,20 20,20 24,30 Z'), '#e8c070', 1.6);
      ctx.strokeStyle = OL; ctx.lineWidth = 10; ctx.lineCap = 'round';
      const trunk = () => { ctx.beginPath(); ctx.moveTo(-4, 26); ctx.quadraticCurveTo(4, 2, -2, -18); ctx.stroke(); };
      trunk(); ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 6; trunk();
      ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) { const y = 20 - i * 8; ctx.beginPath(); ctx.moveTo(-5 + i * 0.6, y); ctx.lineTo(2 + i * 0.4, y - 2); ctx.stroke(); }
      const sw = Math.sin(S.t * 1.5) * 0.05;
      const fronds = [-2.7, -2.0, -1.3, -0.6, 0.1];
      for (const a of fronds) inkAt(-2, -18, a + sw, P2('M0,0 C10,-14 28,-12 36,2 C26,-3 12,-2 0,0 Z'), '#4fbf5a', 1.8);
      ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 1.4;
      for (const a of fronds) { ctx.save(); ctx.translate(-2, -18); ctx.rotate(a + sw); ctx.beginPath(); ctx.moveTo(3, -1); ctx.quadraticCurveTo(16, -9, 32, -1); ctx.stroke(); ctx.restore(); }
      inkCircle(-7, -14, 4.5, '#8a5a2a', 1.2); inkCircle(3, -13, 4.5, '#7a4a20', 1.2); inkCircle(-2, -9, 4.5, '#8a5a2a', 1.2);
    }],
    rock: ['skull rock', () => {
      groundShadow(30);
      ink(P2('M-28,28 C-34,0 -24,-28 0,-28 C24,-28 34,0 28,28 Z'), '#aaa2ba', 2);
      ctx.save(); ctx.clip(P2('M-28,28 C-34,0 -24,-28 0,-28 C24,-28 34,0 28,28 Z'));
      ctx.fillStyle = 'rgba(70,50,100,.2)'; ellipse(14, 10, 26, 30);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-12, -14, 10, 7, -0.5);
      ctx.fillStyle = '#7ab86a'; ellipse(-18, 26, 14, 6); ellipse(20, 27, 10, 5);
      ctx.restore();
      ctx.fillStyle = '#3a2a4a'; ellipse(-10, -4, 7, 8); ellipse(10, -4, 7, 8); tri(0, 5, -4, 12, 4, 12);
      ctx.fillStyle = '#ff6a6a'; circle(-10, -3, 1.8); circle(10, -3, 1.8);
      ctx.fillStyle = '#3a2a4a'; for (const x of [-10, -3, 4]) ctx.fillRect(x, 17, 4, 7);
    }],
    anchor: ['anchor', () => {
      groundShadow(22);
      ctx.lineCap = 'round';
      const shape = () => { ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 24); ctx.moveTo(-13, -8); ctx.lineTo(13, -8); ctx.moveTo(-22, 6); ctx.quadraticCurveTo(-18, 26, 0, 26); ctx.quadraticCurveTo(18, 26, 22, 6); ctx.stroke(); };
      ctx.strokeStyle = OL; ctx.lineWidth = 10; shape();
      ctx.strokeStyle = '#6a7a9a'; ctx.lineWidth = 6; shape();
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(-2, 18); ctx.stroke();
      for (const d of [-1, 1]) ink(P2(`M${d * 22},6 L${d * 28},12 L${d * 18},14 Z`), '#6a7a9a', 1.4);
      inkCircle(0, -24, 7, '#6a7a9a', 1.6); ctx.fillStyle = '#f2dcaa'; circle(0, -24, 3);
      ctx.strokeStyle = '#c89a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -24, 10, 0.2, 2.2); ctx.stroke(); // a bit of rope
    }],
    shell: ['big shell', () => {
      groundShadow(26);
      ink(P2('M0,24 L-30,-2 C-30,-26 -12,-32 0,-32 C12,-32 30,-26 30,-2 Z'), '#ffb3c8', 2);
      ink(P2('M-8,20 L-14,28 L14,28 L8,20 Z'), '#f08aa8', 1.4);
      ctx.save(); ctx.clip(P2('M0,24 L-30,-2 C-30,-26 -12,-32 0,-32 C12,-32 30,-26 30,-2 Z'));
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-10, -16, 12, 8, -0.4);
      ctx.fillStyle = 'rgba(170,60,100,.15)'; ellipse(14, 8, 18, 22);
      ctx.restore();
      ctx.strokeStyle = '#c0708a'; ctx.lineWidth = 2.2;
      for (const k of [-0.7, -0.35, 0, 0.35, 0.7]) { ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(k * 28, -26 + Math.abs(k) * 10); ctx.stroke(); }
    }],
    barrel: ['barrel', () => {
      groundShadow(22);
      const b = P2('M-18,-26 C-27,-8 -27,8 -18,26 L18,26 C27,8 27,-8 18,-26 Z');
      ink(b, '#c08048', 2);
      ctx.save(); ctx.clip(b);
      ctx.fillStyle = 'rgba(90,40,10,.22)'; ctx.fillRect(6, -30, 24, 60);
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-14, -30, 6, 60);
      ctx.strokeStyle = '#8a5428'; ctx.lineWidth = 1.5; for (const x of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(x, -26); ctx.lineTo(x * 1.1, 26); ctx.stroke(); }
      ctx.restore();
      for (const y of [-16, 12]) { inkRect(-24, y, 48, 6, '#7a7a8a', 1.2, 2); }
      inkEllipse(0, -26, 18, 4, 0, '#d89a5a', 1.4);
    }],
    flag: ['pirate flag', () => {
      ink(P2('M-26,30 C-22,22 -6,22 -2,30 Z'), '#e8c070', 1.4);
      ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-14, 26); ctx.lineTo(-14, -30); ctx.stroke();
      ctx.strokeStyle = '#d8b080'; ctx.lineWidth = 3.5; ctx.stroke();
      inkCircle(-14, -32, 3.5, '#ffd23a', 1);
      const f = Math.sin(S.t * 4) * 3;
      ink(P2(`M-12,-28 C0,${-32 + f} 12,${-24 - f} 28,-28 L26,0 C14,${4 - f} 0,${-4 + f} -12,0 Z`), '#3a2a4a', 1.6);
      ctx.fillStyle = '#fff'; circle(8, -17, 5.5); ctx.fillRect(4, -14, 8, 4);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(16, -2); ctx.moveTo(16, -6); ctx.lineTo(0, -2); ctx.stroke();
      ctx.fillStyle = '#3a2a4a'; circle(6, -18, 1.5); circle(10, -18, 1.5);
    }],
  };
  const drawMark = (k, x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; MARKS[k][1](); ctx.restore(); };

  // =====================================================================================
  // LEARN: Captain's Treasure Map. Follow the Captain's clue and dig in the right square.
  // Clues: start at a landmark and take some steps; follow a chain of arrow cards one
  // square at a time; or read grid coordinates like C 3.
  // =====================================================================================
  const TM = { x0: 252, y0: 112, w: 496, h: 312 }; // the grid inside the parchment
  const MAP = { x0: 206, x1: 768, y0: 64, y1: 452 };
  const TM_PLAN = {
    1: { cols: 4, rows: 3, marks: 3, kinds: ['step', 'chain', 'step', 'steps', 'chain'], chain: [3, 3] },
    2: { cols: 5, rows: 4, marks: 4, kinds: ['step', 'chain', 'coord', 'steps', 'chain', 'combo'], chain: [3, 3] },
    3: { cols: 5, rows: 4, marks: 4, kinds: ['steps', 'chain', 'coord', 'combo', 'chain', 'coord', 'chain'], chain: [4, 5, 5] },
  };
  const cellW = g => TM.w / g.cols, cellH = g => TM.h / g.rows;
  const cellCx = (g, c) => TM.x0 + (c + 0.5) * cellW(g), cellCy = (g, r) => TM.y0 + (r + 0.5) * cellH(g);
  function cellAt(g, x, y) {
    const c = Math.floor((x - TM.x0) / cellW(g)), r = Math.floor((y - TM.y0) / cellH(g));
    return c >= 0 && c < g.cols && r >= 0 && r < g.rows ? [c, r] : null;
  }
  const coordName = (c, r) => `${LETTERS[c]} ${r + 1}`;
  const sameCell = (a, b) => a[0] === b[0] && a[1] === b[1];
  function hintFor(from, to) {
    const parts = [];
    if (to[1] < from[1]) parts.push('U'); if (to[1] > from[1]) parts.push('D');
    if (to[0] < from[0]) parts.push('L'); if (to[0] > from[0]) parts.push('R');
    return parts;
  }
  // the map paper, island and grid, painted once per grid size
  function mapPaper(cols, rows) {
    const R = rng(11), pp = new Path2D(), { x0, x1, y0, y1 } = MAP;
    pp.moveTo(x0, y0);
    for (let x = x0; x <= x1; x += 18) pp.lineTo(x, y0 + R() * 8);
    for (let y = y0; y <= y1; y += 18) pp.lineTo(x1 - R() * 8, y);
    for (let x = x1; x >= x0; x -= 18) pp.lineTo(x, y1 - R() * 8);
    for (let y = y1; y >= y0; y -= 18) pp.lineTo(x0 + R() * 8, y);
    pp.closePath();
    ctx.save(); ctx.shadowColor = 'rgba(80,40,30,.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#f2dba4'; ctx.fill(pp); ctx.restore();
    ctx.save(); ctx.clip(pp);
    const vg = ctx.createRadialGradient(487, 258, 140, 487, 258, 380); vg.addColorStop(0, 'rgba(255,250,225,.5)'); vg.addColorStop(1, 'rgba(170,110,50,.25)');
    ctx.fillStyle = vg; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // sea around the island: little wave strokes
    ctx.strokeStyle = 'rgba(70,130,180,.35)'; ctx.lineWidth = 1.8;
    for (let i = 0; i < 46; i++) {
      const x = x0 + 10 + R() * (x1 - x0 - 20), y = y0 + 10 + R() * (y1 - y0 - 20);
      if (x > TM.x0 - 30 && x < TM.x0 + TM.w + 30 && y > TM.y0 - 30 && y < TM.y0 + TM.h + 30) continue;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5, y - 4, x + 10, y); ctx.quadraticCurveTo(x + 15, y - 4, x + 20, y); ctx.stroke();
    }
    // the island: a wobbly coastline just outside the grid
    const isl = new Path2D(), ix0 = TM.x0 - 14, ix1 = TM.x0 + TM.w + 14, iy0 = TM.y0 - 14, iy1 = TM.y0 + TM.h + 14;
    isl.moveTo(ix0, iy0);
    for (let x = ix0; x <= ix1; x += 24) isl.lineTo(x, iy0 + Math.sin(x * 0.05) * 5);
    for (let y = iy0; y <= iy1; y += 24) isl.lineTo(ix1 + Math.sin(y * 0.07) * 5, y);
    for (let x = ix1; x >= ix0; x -= 24) isl.lineTo(x, iy1 + Math.sin(x * 0.06) * 5);
    for (let y = iy1; y >= iy0; y -= 24) isl.lineTo(ix0 + Math.sin(y * 0.08) * 5, y);
    isl.closePath();
    ctx.strokeStyle = 'rgba(70,130,180,.3)'; ctx.lineWidth = 14; ctx.stroke(isl);
    ctx.fillStyle = '#f0d39a'; ctx.fill(isl);
    ctx.strokeStyle = '#9a6a3a'; ctx.lineWidth = 2.5; ctx.stroke(isl);
    ctx.save(); ctx.clip(isl);
    ctx.fillStyle = 'rgba(150,100,50,.12)'; for (let i = 0; i < 260; i++) circle(ix0 + R() * (ix1 - ix0), iy0 + R() * (iy1 - iy0), 0.8 + R() * 1.4);
    ctx.fillStyle = 'rgba(120,170,90,.16)'; for (let i = 0; i < 6; i++) ellipse(ix0 + R() * (ix1 - ix0), iy0 + R() * (iy1 - iy0), 30 + R() * 30, 14 + R() * 10);
    ctx.restore();
    // stains and fold creases
    for (let i = 0; i < 7; i++) { ctx.strokeStyle = `rgba(140,90,40,${0.1 + R() * 0.1})`; ctx.lineWidth = 2 + R() * 2; ctx.beginPath(); ctx.arc(x0 + R() * 560, y0 + R() * 380, 8 + R() * 18, 0, TAU * (0.6 + R() * 0.4)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    for (const x of [393, 581]) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 3, y1); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x0, 258); ctx.lineTo(x1, 255); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,70,30,.12)'; ctx.lineWidth = 1.5;
    for (const x of [395, 583]) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 3, y1); ctx.stroke(); }
    // burnt edges: darker toward the rim, with a few scorch blots
    for (const [lw, a] of [[40, 0.1], [24, 0.14], [12, 0.22], [5, 0.4]]) { ctx.strokeStyle = `rgba(110,52,18,${a})`; ctx.lineWidth = lw; ctx.stroke(pp); }
    ctx.fillStyle = 'rgba(80,36,10,.35)';
    for (let i = 0; i < 10; i++) {
      const side = i % 4, k = R();
      const [bx, by] = side === 0 ? [x0 + k * 560, y0 + 2] : side === 1 ? [x1 - 2, y0 + k * 388] : side === 2 ? [x0 + k * 560, y1 - 2] : [x0 + 2, y0 + k * 388];
      ellipse(bx, by, 6 + R() * 8, 4 + R() * 5, R() * 3);
    }
    ctx.restore();
    ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 2.5; ctx.stroke(pp);
    // a curled corner
    ink(P2(`M${x1 - 34},${y0 + 4} L${x1 - 4},${y0 + 4} L${x1 - 4},${y0 + 32} C${x1 - 14},${y0 + 18} ${x1 - 22},${y0 + 10} ${x1 - 34},${y0 + 4} Z`), '#e0c48a', 1.4);
    // sea serpent doodle in the corner, and a little ship
    ctx.strokeStyle = 'rgba(70,110,150,.55)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(222 + i * 14, 440, 6, Math.PI, 0); ctx.stroke(); }
    ctx.fillStyle = 'rgba(70,110,150,.55)'; circle(262, 434, 4);
    ctx.fillStyle = 'rgba(90,50,30,.5)'; ctx.beginPath(); ctx.moveTo(740, 436); ctx.lineTo(760, 436); ctx.lineTo(756, 442); ctx.lineTo(744, 442); ctx.fill();
    ctx.beginPath(); ctx.moveTo(750, 434); ctx.lineTo(750, 420); ctx.lineTo(758, 432); ctx.fill();
    // grid
    const cw = TM.w / cols, ch = TM.h / rows;
    ctx.strokeStyle = 'rgba(120,70,30,.55)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(TM.x0 + c * cw, TM.y0); ctx.lineTo(TM.x0 + c * cw, TM.y0 + TM.h); ctx.stroke(); }
    for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(TM.x0, TM.y0 + r * ch); ctx.lineTo(TM.x0 + TM.w, TM.y0 + r * ch); ctx.stroke(); }
    ctx.setLineDash([]);
    // compass rose
    ctx.save(); ctx.translate(746, 88);
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 - Math.PI / 2, r = i % 2 ? 11 : 19, w = i % 2 ? 3 : 4.5;
      const p = P2(`M0,0 L${Math.cos(a - 0.5) * w},${Math.sin(a - 0.5) * w} L${Math.cos(a) * r},${Math.sin(a) * r} L${Math.cos(a + 0.5) * w},${Math.sin(a + 0.5) * w} Z`);
      ink(p, i === 0 ? '#e0503a' : i % 2 ? '#e8c890' : '#c88a4a', 0.8);
    }
    inkCircle(0, 0, 2.5, '#ffd23a', 0.8);
    ctx.restore();
    text('N', 746, 60 + 4 + 0, 11, '#8a3a1a', 'center', 800);
  }
  // a red dotted trail through cells
  function dotted(g, cells, upto = cells.length) {
    if (upto < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.setLineDash([1, 11]); ctx.lineDashOffset = -S.t * 12;
    for (const [w, c] of [[9, 'rgba(255,255,255,.7)'], [6, '#d0402a']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
      for (let i = 0; i < upto; i++) ctx.lineTo(cellCx(g, cells[i][0]), cellCy(g, cells[i][1]) + 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  MG.pinchtreasuremap = {
    kind: 'learn', title: () => "Captain's Treasure Map", icon: () => '🗺️',
    how: g => g.tier === 1
      ? "Captain Pinch buried treasure! Start at the picture he says, then go the way the arrows point, one square for each step. Then dig!"
      : "Captain Pinch buried treasure! Start at a picture and follow the arrows, one square for each step. Or find the square from its letter and number, like C 3. Then dig!",
    init(g) {
      const p = TM_PLAN[g.tier];
      Object.assign(g, { cols: p.cols, rows: p.rows, nMarks: p.marks, kinds: p.kinds, chainLens: [...p.chain], round: 0, total: 0, cur: [0, 0], fx: [], coins: [], clods: [] });
      g.rounds = p.kinds.length;
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const kind = g.kinds[g.round];
      const chainLen = kind === 'chain' ? g.chainLens.shift() || 3 : 0;
      for (let attempt = 0; attempt < 400; attempt++) {
        // scatter the landmarks, never side by side so steps stay clear
        const marks = [], used = new Set(), keysM = shuffle(Object.keys(MARKS));
        let guard = 0;
        while (marks.length < g.nMarks && guard++ < 200) {
          const c = randInt(0, g.cols - 1), r = randInt(0, g.rows - 1);
          if (marks.some(m => Math.abs(m.c - c) + Math.abs(m.r - r) < 2)) continue;
          marks.push({ c, r, k: keysM[marks.length] }); used.add(c + ',' + r);
        }
        if (marks.length < g.nMarks) continue;
        const free = (c, r) => c >= 0 && r >= 0 && c < g.cols && r < g.rows && !used.has(c + ',' + r);
        const cands = [];
        // walk the moves from a landmark one square at a time; every square must be sand, on the map, and new
        const walk = (m, moves) => {
          const path = [[m.c, m.r]], seen = new Set([m.c + ',' + m.r]);
          for (const [d, n] of moves) for (let i = 0; i < n; i++) {
            const [c, r] = path[path.length - 1], nc = c + DV[d][0], nr = r + DV[d][1];
            if (!free(nc, nr) || seen.has(nc + ',' + nr)) return null;
            path.push([nc, nr]); seen.add(nc + ',' + nr);
          }
          return path;
        };
        if (kind === 'coord') {
          for (let c = 0; c < g.cols; c++) for (let r = 0; r < g.rows; r++) if (free(c, r)) cands.push({ tre: [c, r], moves: [], path: null });
        } else if (kind === 'chain') {
          for (let k = 0; k < 30; k++) {
            const m = pick(marks), steps = [];
            for (let i = 0; i < chainLen; i++) {
              const prev = steps[i - 1];
              steps.push(pick('RLUD'.split('').filter(d => d !== (prev && BACK[prev]))));
            }
            if (new Set(steps).size < 2) continue; // at least one turn, so it's a real chain
            const path = walk(m, steps.map(d => [d, 1]));
            if (path) cands.push({ from: m, steps, moves: steps.map(d => [d, 1]), path, tre: path[path.length - 1] });
          }
        } else for (const m of marks) {
          if (kind === 'combo') {
            for (const h of ['L', 'R']) for (const v of ['U', 'D']) for (const n1 of [1, 2]) for (const n2 of [1, 2]) {
              const path = walk(m, [[h, n1], [v, n2]]);
              if (path) cands.push({ from: m, moves: [[h, n1], [v, n2]], path, tre: path[path.length - 1] });
            }
          } else for (const d of 'RLUD') {
            const n = kind === 'steps' ? randInt(2, 3) : 1, path = walk(m, [[d, n]]);
            if (path) cands.push({ from: m, moves: [[d, n]], path, tre: path[path.length - 1] });
          }
        }
        if (!cands.length) continue;
        const q = pick(cands);
        Object.assign(g, { marks, q, tre: q.tre, kind, dug: [], tries: 0, state: 'ask', dig: null, t2: 0, traced: 0 });
        if (kind === 'chain') g.cur = [q.from.c, q.from.r];
        break;
      }
      const q = g.q;
      if (g.kind === 'coord') g.say = `Dig at square ${coordName(...g.tre)}! Find the letter ${LETTERS[g.tre[0]]} on top, and the number ${g.tre[1] + 1} on the side.`;
      else if (g.kind === 'chain') g.say = `Start at the ${MARKS[q.from.k][0]}. Follow the arrows, one square each: ${q.steps.map(d => DIRW[d].toLowerCase()).join(', ')}. Tap each square as you go!`;
      else {
        const steps = q.moves.map(([d, n]) => `go ${plural(n, 'step')} ${DIRW[d]}`).join(', then ');
        g.say = `Start at the ${MARKS[q.from.k][0]}. Then ${steps}. Dig there!`;
      }
      if (g.phase === 'play') speak(g.say);
    },
    miss(g, c, r, from, words) {
      g.tries++; SFX.miss();
      const h = hintFor(from, g.kind === 'chain' ? g.q.path[g.traced + 1] : g.tre);
      g.fx.push({ c, r, t: 2.4, hint: h });
      if (g.tries >= 3 && g.kind !== 'chain') speak('Arr, so close! Look for the sparkles, matey!');
      else speak(words || `Not here, matey! Go ${h.map(d => DIRW[d]).join(' and ')}.`);
    },
    // chain rounds: tap (or press the arrow key for) the next square along the arrows
    trace(g, c, r) {
      const q = g.q, want = q.path[g.traced + 1], here = q.path[g.traced];
      if (sameCell([c, r], here)) return;
      if (sameCell([c, r], want)) {
        g.traced++; g.cur = [c, r];
        tone(520 + g.traced * 90, 0.12, 'triangle', 0.08);
        burst(cellCx(g, c), cellCy(g, r) + 10, 6, { colors: ['#ff8a6a', '#fff6a8'] });
        if (g.traced === q.steps.length) { this.startDig(g, c, r); return; }
        const d = q.steps[g.traced];
        speak(`${pick(['Yes!', 'Good!', 'Aye!'])} Now ${DIRW[d].toLowerCase()}.`);
      } else this.miss(g, here[0], here[1], here, `Follow the arrow, matey! Go ${DIRW[q.steps[g.traced]].toLowerCase()}, one square.`);
    },
    startDig(g, c, r) {
      g.dig = { c, r, t: 0 }; g.cur = [c, r];
      for (let i = 0; i < 9; i++) g.clods.push({ x: cellCx(g, c), y: cellCy(g, r) + 8, vx: rand(-90, 90), vy: rand(-220, -120), life: 0.8 });
      tone(220, 0.08, 'triangle', 0.08); tone(180, 0.08, 'triangle', 0.08, 0.16); tone(150, 0.08, 'triangle', 0.08, 0.32);
    },
    digAt(g, c, r) {
      if (g.dug.some(d => d[0] === c && d[1] === r)) return;
      if (g.marks.some(m => m.c === c && m.r === r)) {
        SFX.miss(); g.fx.push({ c, r, t: 1.2, words: "Can't dig there!" });
        speak("You can't dig under that! Try a sandy square.");
        return;
      }
      this.startDig(g, c, r);
    },
    resolve(g) {
      const { c, r } = g.dig; g.dig = null;
      if (c === g.tre[0] && r === g.tre[1]) {
        g.total += [1, 0.7, 0.4, 0.2][Math.min(3, g.tries)];
        g.state = 'yay'; g.t2 = 0;
        SFX.sparkle(); burst(cellCx(g, c), cellCy(g, r), 26, { colors: ['#ffd23a', '#fff6a8', '#ff9ac8'] });
        for (let i = 0; i < 12; i++) g.coins.push({ x: cellCx(g, c), y: cellCy(g, r), vx: rand(-140, 140), vy: rand(-320, -180), spin: rand(0, 6), life: 1.6 });
        speak(pick(['Arr! Ye found the treasure!', 'Shiver me timbers, treasure!', 'Yo ho ho! Gold, matey!']));
      } else {
        g.dug.push([c, r]);
        this.miss(g, c, r, [c, r]);
      }
      g.score = g.total / g.rounds;
    },
    update(g, dt, id) {
      for (const f of g.fx) f.t -= dt;
      g.fx = g.fx.filter(f => f.t > 0);
      for (const p of [...g.coins, ...g.clods]) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; p.life -= dt; if (p.spin != null) p.spin += dt * 9; }
      g.coins = g.coins.filter(p => p.life > 0); g.clods = g.clods.filter(p => p.life > 0);
      g.progress = `🪙 Treasure ${g.round + (g.state === 'yay' ? 1 : 0)} of ${g.rounds}`;
      if (g.dig) { if ((g.dig.t += dt) > 0.7) this.resolve(g); return; }
      if (g.state === 'yay') {
        if ((g.t2 += dt) > 2.4) {
          g.round++;
          if (g.round >= g.rounds) { g.score = g.total / g.rounds; g.done = true; return; }
          this.next(g);
        }
        return;
      }
      const at = cellAt(g, pointer.x, pointer.y);
      if (g.kind === 'chain') {
        // arrow keys trace the chain directly
        for (const k in KEYDIR) if (pressed[k]) {
          const here = g.q.path[g.traced], d = KEYDIR[k];
          return this.trace(g, here[0] + DV[d][0], here[1] + DV[d][1]);
        }
        if (pointer.clicked && at && !id) this.trace(g, ...at);
        return;
      }
      // keyboard: arrows move the spade, Enter or Space digs
      const [cc, cr] = g.cur;
      if (pressed.arrowleft) g.cur = [Math.max(0, cc - 1), cr];
      if (pressed.arrowright) g.cur = [Math.min(g.cols - 1, cc + 1), cr];
      if (pressed.arrowup) g.cur = [cc, Math.max(0, cr - 1)];
      if (pressed.arrowdown) g.cur = [cc, Math.min(g.rows - 1, cr + 1)];
      if (pressed.enter || pressed[' ']) return this.digAt(g, ...g.cur);
      if (at && pointerMoved(g)) g.cur = at;
      if (pointer.clicked && at && !id) this.digAt(g, ...at);
    },
    draw(g) {
      drawAubrey(112, GY + 22, g.dig ? 'crouch' : g.state === 'yay' ? 'twirl' : 'idle_front', 1);
      drawCritter('Captain Pinch', 866, GY + 42, 0.6, -1);
      still(`b2_map_${g.cols}x${g.rows}`, () => mapPaper(g.cols, g.rows));
      const cw = cellW(g), ch = cellH(g), s = Math.min(cw / 100, ch / 84) * 0.95, q = g.q, chain = g.kind === 'chain';
      const [hc, hr] = g.cur, showLab = g.tier > 1;
      // highlight the square under the spade (or, when tracing, where the explorer stands)
      if (g.state === 'ask' && !g.dig) rrect(TM.x0 + hc * cw + 4, TM.y0 + hr * ch + 4, cw - 8, ch - 8, 10, chain ? 'rgba(255,220,120,.45)' : 'rgba(255,255,255,.5)');
      if (showLab) {
        for (let c = 0; c < g.cols; c++) {
          const on = c === hc && !chain; if (on) inkCircle(cellCx(g, c), 95, 14, '#ffd23a', 1.4);
          text(LETTERS[c], cellCx(g, c), 96, on ? 22 : 19, '#6a3a1a', 'center', 800);
        }
        for (let r = 0; r < g.rows; r++) {
          const on = r === hr && !chain; if (on) inkCircle(232, cellCy(g, r), 14, '#ffd23a', 1.4);
          text(String(r + 1), 232, cellCy(g, r) + 1, on ? 22 : 19, '#6a3a1a', 'center', 800);
        }
      }
      // trails: traced so far, or the whole route once the treasure is found
      if (q.path) dotted(g, q.path, g.state === 'yay' ? q.path.length : chain ? g.traced + 1 : 0);
      for (const m of g.marks) {
        const glow = q.from === m && g.state === 'ask';
        if (glow) { ctx.fillStyle = `rgba(255,240,150,${0.35 + Math.sin(S.t * 4) * 0.15})`; circle(cellCx(g, m.c), cellCy(g, m.r), Math.min(cw, ch) * 0.46); }
        drawMark(m.k, cellCx(g, m.c), cellCy(g, m.r), s * (glow ? 1 + Math.sin(S.t * 5) * 0.04 : 1));
      }
      if (chain && g.state === 'ask' && g.traced > 0) {
        // a little footprint marker where the explorer stands
        const [c, r] = q.path[g.traced];
        inkCircle(cellCx(g, c), cellCy(g, r) + 10, 9, '#ff8a6a', 1.6); ctx.fillStyle = '#fff'; circle(cellCx(g, c) - 2, cellCy(g, r) + 7, 3);
      }
      for (const [c, r] of g.dug) {
        const x = cellCx(g, c), y = cellCy(g, r) + 8;
        ctx.fillStyle = '#c89a5a'; ellipse(x + 30 * s, y - 4, 14 * s, 7 * s); ellipse(x - 26 * s, y - 2, 10 * s, 5 * s);
        inkEllipse(x, y, 30 * s, 14 * s, 0, '#8a5a34', 1.6); ctx.fillStyle = '#5a3a24'; ellipse(x, y + 2, 23 * s, 9 * s);
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ellipse(x, y - 3, 22 * s, 5 * s);
      }
      if (g.tries >= 3 && g.state === 'ask' && !chain) {
        for (let i = 0; i < 4; i++) { const a = S.t * 2 + i * TAU / 4; star(cellCx(g, g.tre[0]) + Math.cos(a) * 26, cellCy(g, g.tre[1]) + Math.sin(a) * 20, 8, '#fff6a8', 4); }
      }
      if (g.dig) {
        const x = cellCx(g, g.dig.c), y = cellCy(g, g.dig.r), k = Math.min(1, g.dig.t / 0.6);
        inkEllipse(x, y + 10, 28 * s * k, 12 * s * k, 0, '#8a5a34', 1.4); ctx.fillStyle = '#5a3a24'; ellipse(x, y + 12, 20 * s * k, 7 * s * k);
        ctx.save(); ctx.translate(x + 14, y + 4); ctx.rotate(-0.5 + Math.sin(g.dig.t * 26) * 0.35);
        ctx.strokeStyle = OL; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -44); ctx.lineTo(-8, -44); ctx.lineTo(8, -44); ctx.stroke();
        ctx.strokeStyle = '#d8a060'; ctx.lineWidth = 4.5; ctx.stroke();
        ink(P2('M-11,0 L11,0 L9,17 Q0,26 -9,17 Z'), '#c0c8d8', 1.6); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-7, 3, 3, 10);
        ctx.restore();
      }
      for (const p of g.clods) { ctx.globalAlpha = clamp(p.life * 2, 0, 1); inkCircle(p.x, p.y, 4, '#c89a5a', 1); }
      ctx.globalAlpha = 1;
      if (g.state === 'yay') {
        const k = Math.min(1, g.t2 * 2.5), x = cellCx(g, g.tre[0]), y = cellCy(g, g.tre[1]) + 26;
        chest(x, y - k * 6, s * (0.65 + 0.4 * k), Math.min(1, g.t2 * 2));
        const ty = cellCy(g, g.tre[1]) - ch / 2 - 2;
        outlined('Treasure!', x, ty < TM.y0 + 10 ? y + 22 : ty + 4, 22, '#ffd23a');
      } else if (g.state === 'ask' && !chain && !g.dig) {
        const x = cellCx(g, hc), y = cellCy(g, hr);
        if (!g.marks.some(m => m.c === hc && m.r === hr)) { ctx.globalAlpha = 0.55; text('✕', x, y, 32, '#d04040', 'center', 800); ctx.globalAlpha = 1; }
      }
      for (const p of g.coins) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(Math.abs(Math.cos(p.spin)) * 0.9 + 0.1, 1); ctx.globalAlpha = clamp(p.life, 0, 1);
        inkCircle(0, 0, 8, '#ffd23a', 1.2); ctx.fillStyle = '#e8a020'; circle(0, 0, 4); ctx.restore();
      }
      for (const f of g.fx) {
        const x = cellCx(g, f.c), y = cellCy(g, f.r);
        ctx.globalAlpha = clamp(f.t * 2, 0, 1);
        if (f.hint) f.hint.forEach((d, i) => arrow(d, x + (f.hint.length > 1 ? (i - 0.5) * 42 : 0), y - 6, 19, '#ff9a3a'));
        if (f.words) outlined(f.words, x, y - 30, 16, '#fff');
        ctx.globalAlpha = 1;
      }
      // the clue card
      panel(776, 70, 172, chain ? 210 : 300, 18);
      text("Captain's clue", 862, 92, 15, '#9a7aaa', 'center', 800);
      if (g.kind === 'coord') {
        outlined('Dig at', 862, 136, 22, '#ff6fb5', 'center', '#fff');
        inkCircle(820, 204, 30, '#ffd23a', 1.8); text(LETTERS[g.tre[0]], 820, 206, 34, '#6a3a1a', 'center', 800);
        inkCircle(904, 204, 30, '#9ad8ff', 1.8); text(String(g.tre[1] + 1), 904, 206, 34, '#2a4a7a', 'center', 800);
        text('letter on top', 820, 250, 12, '#5a2a6e', 'center', 700); text('number on side', 904, 250, 12, '#5a2a6e', 'center', 700);
        wrap('Find where they meet!', 150, 16).forEach((l, i) => text(l, 862, 294 + i * 22, 16, '#5a2a6e', 'center', 700));
      } else {
        text('Start at', 862, 114, 15, '#5a2a6e', 'center', 700);
        drawMark(q.from.k, 862, 172, 0.8);
        text(`the ${MARKS[q.from.k][0]}`, 862, 212, 15, '#5a2a6e', 'center', 800);
        if (chain) {
          text('Follow the arrows', 862, 240, 14, '#ff6fb5', 'center', 800);
          text('below! 👇', 862, 260, 14, '#ff6fb5', 'center', 800);
        } else q.moves.forEach(([d, n], i) => {
          const y = q.moves.length > 1 ? 252 + i * 54 : 266;
          text(String(n), 820, y, 30, '#ff6a4a', 'center', 800);
          arrow(d, 872, y, 22, ['#ff9a3a', '#4fa8e0'][i]);
          text(DIRW[d], 872, y + 24, 12, '#5a2a6e', 'center', 800);
        });
      }
      // chain rounds: a row of big arrow cards that light up as they're traced
      if (chain) {
        const n = q.steps.length, cwd = 70, gap = 10, x0 = 487 - (n * cwd + (n - 1) * gap) / 2;
        q.steps.forEach((d, i) => {
          const x = x0 + i * (cwd + gap), done = i < g.traced || g.state === 'yay', now = i === g.traced && g.state === 'ask' && !g.dig;
          const lift = now ? Math.sin(S.t * 6) * 3 : 0;
          if (now) { ctx.fillStyle = 'rgba(255,240,150,.7)'; rrect(x - 6, 456 - 6 + lift, cwd + 12, 80, 18, 'rgba(255,236,140,.75)'); }
          rrect(x, 456 + lift, cwd, 68, 14, done ? '#8fdc9a' : now ? '#fff6d0' : '#f4e8d8', OL, 2.5);
          arrow(d, x + cwd / 2, 484 + lift, 24, done ? '#3fae5a' : now ? '#ff8a3a' : '#c8a888');
          text(DIRW[d], x + cwd / 2, 512 + lift, 11, done ? '#1f6a3a' : '#7a5a4a', 'center', 800);
          if (done) { inkCircle(x + cwd - 6, 460 + lift, 9, '#3fae5a', 1.2); text('✓', x + cwd - 6, 461 + lift, 12, '#fff', 'center', 800); }
        });
      }
    },
  };

  // =====================================================================================
  // ACTION: Turtle Guard. Baby sea turtles hatch and crawl down to the sea. A gull swoops
  // at one, and its shadow grows on the sand: scuttle Captain Pinch onto the shadow to
  // shoo the gull away before it lands!
  // =====================================================================================
  const TG_SEA = 402, TG_TOP = 408, TG_BOT = 528, TG_REACH = 62;
  const TG_NESTS = [180, 480, 780], TG_NEST_Y = 512;
  const sandTop = x => 396 + Math.sin(x * 0.012) * 4;
  const TG_PLAN = { // turtles, seconds between hatchings, gulls at once, gap between gulls, warning seconds, time
    1: { n: 8, every: 3.0, gulls: 1, gap: 1.5, warn: 2.8, time: 46, speed: 17 },
    2: { n: 10, every: 2.6, gulls: 2, gap: 1.8, warn: 2.5, time: 46, speed: 19 },
    3: { n: 12, every: 2.2, gulls: 2, gap: 1.2, warn: 2.0, time: 48, speed: 21 },
  };
  function hatchling(x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(80,50,30,.2)'; ellipse(1, 11, 18, 5);
    const k = Math.sin(t * 10) * 4;
    const flips = [[-14, -6, -0.7, k], [14, -6, 0.7, -k], [-12, 9, 0.5, -k], [12, 9, -0.5, k]];
    for (const [fx, fy, rot, dk] of flips) inkAt(fx, fy + dk * 0.6, rot + dk * 0.05, P2('M-8,-3 C-5,-9 5,-9 8,-3 C5,4 -5,4 -8,-3 Z'), '#6ac87a', 1.4);
    ink(P2('M-3,-12 C-4,-20 4,-20 3,-12 Z'), '#7ad88a', 1.2); // neck
    inkCircle(0, -19, 7, '#7ad88a', 1.6);
    ctx.fillStyle = '#fff'; circle(-3, -21, 2.4); circle(3, -21, 2.4);
    ctx.fillStyle = '#2a1a2a'; circle(-3, -21.5, 1.4); circle(3, -21.5, 1.4);
    ctx.fillStyle = '#ff9aa8'; circle(-5, -16, 1.4); circle(5, -16, 1.4);
    inkEllipse(0, 0, 15, 13, 0, '#3a9a5a', 1.8);
    // shell plates
    ctx.fillStyle = '#5ab86a'; ellipse(0, -1, 10.5, 9);
    ctx.strokeStyle = '#2a7a4a'; ctx.lineWidth = 1.3;
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.lineTo(Math.cos(a) * 5, -1 + Math.sin(a) * 4.5); } ctx.closePath(); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5, -1 + Math.sin(a) * 4.5); ctx.lineTo(Math.cos(a) * 10, -1 + Math.sin(a) * 8.5); ctx.stroke(); }
    ctx.fillStyle = '#a8e8a0'; for (let i = 0; i < 10; i++) { const a = i * TAU / 10; circle(Math.cos(a) * 13, Math.sin(a) * 11, 1.1); }
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-5, -6, 5, 2.5, -0.4);
    ctx.restore();
  }
  function gull(x, y, s, t, dir = 1, swoop = 0, legs = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const f = Math.sin(t * (swoop ? 4 : 9)) * (swoop ? 6 : 16);
    if (legs) { ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-2, 8); ctx.lineTo(-6, 22); ctx.moveTo(6, 8); ctx.lineTo(4, 22); ctx.stroke(); ctx.strokeStyle = '#ffb83a'; ctx.lineWidth = 2; ctx.stroke(); }
    const wing = d => P2(`M${d * 4},-4 C${d * 18},${-16 - f} ${d * 34},${-22 - f} ${d * 50},${-12 - f * 1.4} C${d * 34},${-6 - f * 0.5} ${d * 18},0 ${d * 4},4 Z`);
    ink(wing(-1), '#c0c8da', 1.8);
    ctx.save(); ctx.clip(wing(-1)); ctx.fillStyle = '#3a3a4a'; circle(-50, -12 - f * 1.4, 12); ctx.restore();
    const body = P2('M-26,2 C-20,-10 18,-10 24,0 C18,10 -18,12 -26,2 Z'), tail = P2('M-24,2 L-38,-4 L-36,8 Z');
    ink(tail, '#c0c8da', 1.4);
    ink(body, '#ffffff', 2);
    ctx.save(); ctx.clip(body); ctx.fillStyle = 'rgba(160,170,200,.35)'; ellipse(-4, 8, 26, 6); ctx.restore();
    ink(wing(1), '#e4e8f2', 1.8);
    ctx.save(); ctx.clip(wing(1)); ctx.fillStyle = '#3a3a4a'; circle(50, -12 - f * 1.4, 12); ctx.fillStyle = '#fff'; circle(44, -14 - f * 1.3, 2); ctx.restore();
    inkCircle(24, -6, 10, '#ffffff', 1.8);
    ink(P2('M32,-9 L48,-5 L44,-1 L32,-1 Z'), '#ffc23a', 1.4);
    ctx.fillStyle = '#ff4a3a'; circle(42, -2.5, 1.8);
    ctx.fillStyle = '#2a1a2a'; circle(27, -9, 2.4); ctx.fillStyle = '#fff'; circle(27.8, -9.8, 0.9);
    ctx.strokeStyle = '#5a4a6a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(21, -14); ctx.lineTo(31, -12); ctx.stroke(); // grumpy brow
    ctx.restore();
  }
  // the sand strip the game is played on, painted once over the beach backdrop
  function tgSand() {
    const top = new Path2D(); top.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) top.lineTo(x, sandTop(x));
    top.lineTo(W, H); top.closePath();
    const sd = ctx.createLinearGradient(0, 394, 0, H);
    sd.addColorStop(0, '#c9a46a'); sd.addColorStop(0.16, '#dcbb80'); sd.addColorStop(0.3, '#f2d8a0'); sd.addColorStop(1, '#fbe6b6');
    ctx.fillStyle = sd; ctx.fill(top);
    ctx.save(); ctx.clip(top);
    // the wet band shines
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 0; x < W; x += 60) ellipse(x + 20, 412 + Math.sin(x) * 3, 24, 2.5);
    // ripples and texture
    const R = rng(23);
    ctx.strokeStyle = 'rgba(190,140,80,.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const x = R() * W, y = 440 + R() * 90, w = 20 + R() * 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w / 2, y - 5, x + w, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(170,120,60,.3)'; for (let i = 0; i < 420; i++) circle(R() * W, 410 + R() * 130, 0.7 + R() * 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; for (let i = 0; i < 160; i++) circle(R() * W, 420 + R() * 120, 0.6 + R() * 0.9);
    // pebbles, shells, a starfish, seaweed
    for (let i = 0; i < 12; i++) inkEllipse(R() * W, 446 + R() * 86, 3 + R() * 3, 2 + R() * 2, R() * 3, ['#b8a8b8', '#a89888', '#d0c0c8'][i % 3], 1);
    for (const [x, y, c, r] of [[90, 478, '#ffb3c8', 9], [340, 528, '#c8b8ff', 8], [622, 470, '#ffd0a8', 9], [700, 532, '#ffb3c8', 7], [930, 520, '#bfe6ff', 8]]) smallShell(x, y, r, c, R() - 0.5);
    starfish(296, 452, 10, '#ff7a5a', 0.3); starfish(872, 456, 8, '#c06ae0', -0.4);
    ctx.strokeStyle = '#4a9a6a'; ctx.lineWidth = 3;
    for (const x of [40, 640, 920]) { ctx.beginPath(); ctx.moveTo(x, 424); ctx.quadraticCurveTo(x + 10, 418, x + 20, 426); ctx.quadraticCurveTo(x + 30, 432, x + 40, 424); ctx.stroke(); }
    ctx.restore();
    // umbrella poles carry on down into the sand
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(91.7, 392); ctx.lineTo(96, 452); ctx.stroke();
    ctx.strokeStyle = '#f4f0f8'; ctx.lineWidth = 3; ctx.stroke();
    inkEllipse(96, 452, 14, 4, 0, '#e8c888', 1.2);
    // a small sandcastle on the right
    const cx = 900;
    inkRect(cx - 30, 470, 60, 34, '#e8c070', 2.2, 4);
    for (const dx of [-32, 16]) { inkRect(cx + dx, 448, 16, 56, '#e8c070', 2.2, 3); for (let i = 0; i < 3; i++) inkRect(cx + dx + i * 5.5, 443, 4, 7, '#e8c070', 1.2, 1); }
    ctx.fillStyle = 'rgba(150,100,40,.25)'; ctx.fillRect(cx + 4, 472, 24, 30);
    inkRect(cx - 7, 486, 14, 18, '#b88a4a', 1.8, 7);
    smallShell(cx - 14, 480, 5, '#ffb3c8'); smallShell(cx + 14, 482, 5, '#c8b8ff');
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 24, 443); ctx.lineTo(cx - 24, 420); ctx.stroke();
    // nests: a ring of seaweed and sticks, cracked eggs, a little sign
    for (const x of TG_NESTS) {
      const y = TG_NEST_Y;
      ctx.fillStyle = 'rgba(120,80,40,.22)'; ellipse(x + 3, y + 6, 52, 14);
      inkEllipse(x, y, 48, 17, 0, '#e2bc78', 1.6);
      ctx.fillStyle = '#a87a40'; ellipse(x, y - 2, 32, 10);
      ctx.fillStyle = '#8a5e30'; ellipse(x, y, 26, 7);
      ctx.strokeStyle = '#5a8a4a'; ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + 0.3, px = x + Math.cos(a) * 40, py = y + Math.sin(a) * 13; ctx.beginPath(); ctx.moveTo(px - 6, py); ctx.quadraticCurveTo(px, py - 5, px + 6, py); ctx.stroke(); }
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2.5;
      for (const [dx, dy, l, a] of [[-38, -4, 18, 0.3], [30, 6, 16, -0.4], [-10, 12, 14, 0.1]]) { ctx.beginPath(); ctx.moveTo(x + dx, y + dy); ctx.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); ctx.stroke(); }
      for (let i = 0; i < 5; i++) {
        const ex = x - 22 + i * 11, ey = y - 3 + Math.sin(i * 1.3) * 3;
        inkEllipse(ex, ey, 6.5, 5, i * 0.4, '#fffaf0', 1);
        ctx.strokeStyle = '#c8b8a0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex - 5, ey - 1); ctx.lineTo(ex - 2, ey - 3); ctx.lineTo(ex, ey); ctx.lineTo(ex + 3, ey - 3); ctx.lineTo(ex + 5, ey - 1); ctx.stroke();
      }
      // little nest sign
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 52, y + 4); ctx.lineTo(x + 52, y - 30); ctx.stroke();
      ctx.strokeStyle = '#b07a44'; ctx.lineWidth = 2.5; ctx.stroke();
      inkRect(x + 38, y - 44, 28, 18, '#e8b878', 1.4, 3);
      inkEllipse(x + 52, y - 35, 6, 5, 0, '#4fb86a', 0.8); ctx.fillStyle = '#4fb86a'; circle(x + 52, y - 41, 2.5);
    }
  }

  MG.turtleguard = {
    kind: 'action', title: () => 'Turtle Guard', icon: () => '🐢',
    how: () => 'Baby turtles are crawling to the sea! When a hungry gull flies over a turtle, its shadow grows on the sand. Scuttle Captain Pinch onto the shadow to shoo it away! Move with the mouse or the arrow keys.',
    init(g) {
      const p = TG_PLAN[g.tier];
      Object.assign(g, { p, turtles: [], gulls: [], tracks: [], puffs: [], splashes: [], hatched: 0, saved: 0, points: 0, snatched: 0, shoos: 0, hatchT: 0.6, gullT: 2.6, timeLeft: p.time,
        x: W / 2, y: 470, facing: 1, walk: 0, firstGull: true, puffT: 0 });
      g.say = 'Stand on the gull shadows to keep the baby turtles safe!';
    },
    start(g) { speak(g.say); },
    hatch(g, t) {
      const nx = t ? t.nest : pick(TG_NESTS);
      const o = { scared: t ? t.scared : false, x: nx + rand(-14, 14), y: TG_NEST_Y - 8, nest: nx, drift: rand(-14, 14), ph: rand(0, 6), sp: g.p.speed * rand(0.9, 1.1), state: 'walk', t: 0, wait: 0.6, lx: 0, ly: 0 };
      o.lx = o.x; o.ly = o.y;
      if (t) Object.assign(t, o, { wait: 1.2 }); else g.turtles.push(o);
      burst(o.x, o.y, 6, { colors: ['#fffaf0', '#e2bc78'] });
    },
    update(g, dt) {
      const p = g.p;
      g.timeLeft -= dt;
      // move Captain Pinch
      const bx = g.x, by = g.y, sp = 360;
      const mx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), my = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (mx || my) { const l = Math.hypot(mx, my); g.x += mx / l * sp * dt; g.y += my / l * sp * dt; }
      else if (pointerMoved(g)) {
        const dx = pointer.x - g.x, dy = clamp(pointer.y, TG_TOP, TG_BOT) - g.y, d = Math.hypot(dx, dy);
        if (d > 2) { const st = Math.min(d, sp * dt); g.x += dx / d * st; g.y += dy / d * st; }
      }
      g.x = clamp(g.x, 40, W - 40); g.y = clamp(g.y, TG_TOP + 6, TG_BOT);
      const moved = Math.hypot(g.x - bx, g.y - by);
      if (moved > 0.3) {
        g.walk += dt; if (Math.abs(g.x - bx) > 0.3) g.facing = Math.sign(g.x - bx);
        if ((g.puffT -= dt) <= 0) { g.puffT = 0.08; g.puffs.push({ x: g.x + rand(-20, 20), y: g.y + 14, r: rand(4, 8), life: 0.5 }); }
      }
      for (const f of g.puffs) { f.life -= dt; f.r += dt * 14; f.y -= dt * 10; }
      g.puffs = g.puffs.filter(f => f.life > 0);
      for (const sp2 of g.splashes) sp2.t += dt;
      g.splashes = g.splashes.filter(s2 => s2.t < 1);
      for (const tr of g.tracks) tr.age += dt;
      g.tracks = g.tracks.filter(tr => tr.age < 7);
      // hatch
      if (g.hatched < p.n && (g.hatchT -= dt) <= 0) { g.hatchT = p.every; g.hatched++; this.hatch(g); tone(660, 0.08, 'sine', 0.06); tone(880, 0.08, 'sine', 0.06, 0.08); }
      // turtles crawl to the sea, leaving flipper tracks
      for (const t of g.turtles) {
        t.t += dt;
        if (t.state === 'walk') {
          if (t.wait > 0) { t.wait -= dt; continue; }
          t.y -= t.sp * dt; t.x += Math.sin(t.t * 1.6 + t.ph) * 10 * dt + t.drift * 0.15 * dt;
          if (Math.hypot(t.x - t.lx, t.y - t.ly) > 7) { g.tracks.push({ x: t.x, y: t.y + 10, age: 0 }); t.lx = t.x; t.ly = t.y; }
          if (t.y < TG_SEA) {
            t.state = 'safe'; t.t = 0; g.saved++; g.points += t.scared ? 0.35 : 1; SFX.pop();
            g.splashes.push({ x: t.x, y: TG_SEA, t: 0 });
            burst(t.x, TG_SEA, 10, { colors: ['#ffffff', '#9ae8f0'] }); floatText(t.x, TG_SEA - 20, 'Safe!', '#fff');
          }
        }
      }
      // gulls pick a turtle that's still well up the beach, and they'd rather keep away from the Captain
      if ((g.gullT -= dt) <= 0 && g.gulls.filter(q => q.state === 'hunt').length < p.gulls) {
        const free = g.turtles.filter(t => t.state === 'walk' && t.wait <= 0 && t.y > TG_SEA + 40 && !g.gulls.some(q => q.target === t));
        if (free.length) {
          const far = free.filter(t => Math.hypot(t.x - g.x, t.y - g.y) > 160), tg = pick(far.length ? far : free), dir = tg.x < W / 2 ? 1 : -1;
          g.gulls.push({ target: tg, state: 'hunt', t: 0, warn: p.warn, x: tg.x - dir * 300, y: 90, dir });
          g.gullT = p.gap;
          SFX.blip(); tone(1300, 0.12, 'sawtooth', 0.03, 0, 900);
          if (g.firstGull) { g.firstGull = false; speak('A gull! Run to its shadow!'); }
        } else g.gullT = 0.4;
      }
      for (const q of g.gulls) {
        q.t += dt;
        const tg = q.target;
        if (q.state === 'hunt') {
          if (tg.state !== 'walk') { q.state = 'leave'; continue; }
          const k = q.t / q.warn;
          q.x = lerp(q.x, tg.x - q.dir * 40 * (1 - k), Math.min(1, dt * 3)); q.y = lerp(90, tg.y - 70, k * k);
          if (Math.hypot(g.x - tg.x, g.y - tg.y) < TG_REACH) {
            q.state = 'shoo'; q.t = 0; g.shoos++; g.snapT = 0.4; SFX.hit(); tone(300, 0.1, 'square', 0.04, 0.05);
            floatText(tg.x, tg.y - 50, pick(['Shoo!', 'Avast!', 'Away with ye!']), '#ffd23a', false, 22); burst(tg.x, tg.y - 30, 8, { colors: ['#ffffff', '#c8d0e0'] });
          } else if (k >= 1) {
            q.state = 'grab'; q.t = 0; tg.state = 'carried'; tg.scared = true; g.snatched++; SFX.miss();
            floatText(tg.x, tg.y - 50, 'Squawk!', '#ffb0b0', false, 20);
          }
        } else if (q.state === 'grab') {
          // the gull lifts the turtle and plops it back at its nest (it'll have to try again)
          const k = Math.min(1, q.t / 1.4);
          q.x = lerp(tg.x, tg.nest, k); q.y = lerp(tg.y - 30, TG_NEST_Y - 60, k) - Math.sin(k * Math.PI) * 120;
          if (k >= 1) { this.hatch(g, tg); q.state = 'leave'; q.t = 0; }
        } else { q.x += q.dir * 260 * dt; q.y -= 160 * dt; }
      }
      g.snapT = Math.max(0, (g.snapT || 0) - dt);
      g.gulls = g.gulls.filter(q => (q.state !== 'leave' && q.state !== 'shoo') || q.y > -60);
      g.turtles = g.turtles.filter(t => t.state !== 'safe' || t.t < 1.2);
      g.progress = `🐢 Safe: ${g.saved} of ${p.n}`;
      g.score = g.points / p.n; // a turtle that got carried back only counts a little, but it still gets another go
      if (g.saved >= p.n) { g.done = true; speak('Every baby turtle made it to the sea! Arr, well done!'); }
      else if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
    },
    draw(g) {
      still('b2_tg_sand', tgSand);
      // the sea washes in and out over the wet sand
      const edge = x => TG_SEA + 2 + Math.sin(S.t * 1.2 + x * 0.004) * 7 + Math.sin(x * 0.05 + S.t * 2.2) * 2;
      ctx.fillStyle = 'rgba(110,215,230,.55)'; ctx.beginPath(); ctx.moveTo(0, 388);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, edge(x));
      ctx.lineTo(W, 388); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.beginPath();
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, edge(x));
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 30; i++) { const x = (i * 33 + Math.sin(i) * 9) % W; circle(x, edge(x) + 2 + (i % 3), 1.5 + (i % 2)); }
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, edge(x) - 7 + Math.sin(x * 0.08 - S.t * 3) * 1.5);
      ctx.stroke();
      for (const s2 of g.splashes) { ctx.strokeStyle = `rgba(255,255,255,${1 - s2.t})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(s2.x, s2.y, 10 + s2.t * 40, 3 + s2.t * 10, 0, 0, TAU); ctx.stroke(); }
      // flipper tracks in the sand
      for (const tr of g.tracks) {
        ctx.fillStyle = `rgba(150,100,50,${0.35 * (1 - tr.age / 7)})`;
        ellipse(tr.x - 8, tr.y, 3.5, 1.6, -0.4); ellipse(tr.x + 8, tr.y, 3.5, 1.6, 0.4);
      }
      // gull shadows, shaped like a bird, grow under the hunted turtles
      for (const q of g.gulls) if (q.state === 'hunt') {
        const t = q.target, k = clamp(q.t / q.warn, 0, 1), sz = 0.5 + k * 0.8, flap = Math.sin(S.t * 9) * 0.3;
        ctx.save(); ctx.translate(t.x, t.y + 6); ctx.scale(sz, sz * 0.45);
        ctx.fillStyle = `rgba(40,20,60,${0.15 + k * 0.3})`;
        ellipse(0, 0, 26, 12); ellipse(-30, -4, 32, 9 + flap * 6, 0.25); ellipse(30, -4, 32, 9 + flap * 6, -0.25);
        ctx.restore();
        ctx.strokeStyle = k > 0.7 ? '#ff4a4a' : '#ff9a3a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(t.x, t.y + 6, 56, 22, 0, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - k)); ctx.stroke();
        if (k > 0.6) outlined('!', t.x + 34, t.y - 34 + Math.sin(S.t * 12) * 2, 26, '#ff4a4a');
      }
      for (const f of g.puffs) { ctx.fillStyle = `rgba(240,215,160,${f.life * 1.2})`; circle(f.x, f.y, f.r); }
      const things = [...g.turtles.filter(t => t.state !== 'carried').map(t => ({ y: t.y, t })), { y: g.y + 6, pinch: true }].sort((a, b) => a.y - b.y);
      for (const o of things) {
        if (o.pinch) {
          const near = g.gulls.some(q => q.state === 'hunt' && Math.hypot(g.x - q.target.x, g.y - q.target.y) < TG_REACH * 1.8);
          ctx.save(); ctx.lineDashOffset = -S.t * 20;
          ctx.strokeStyle = near ? 'rgba(255,220,90,.9)' : 'rgba(255,255,255,.6)'; ctx.lineWidth = near ? 3 : 2; ctx.setLineDash([8, 7]);
          ctx.beginPath(); ctx.ellipse(g.x, g.y + 6, TG_REACH, TG_REACH * 0.4, 0, 0, TAU); ctx.stroke(); ctx.restore();
          const hop = g.snapT > 0 ? Math.sin(g.snapT / 0.4 * Math.PI) * 12 : 0;
          drawCritter('Captain Pinch', g.x, g.y + 10 - hop, 0.5 + Math.sin(g.walk * 14) * 0.01, g.facing);
          if (g.snapT > 0) for (const d of [-1, 1]) star(g.x + d * 34, g.y - 34 - hop, 10 * (g.snapT / 0.4) + 4, '#fff6a8', 4);
        } else {
          const t = o.t;
          if (t.state === 'safe') { ctx.globalAlpha = clamp(1 - t.t, 0, 1); hatchling(t.x, t.y - t.t * 10, 1.3, S.t); ctx.globalAlpha = 1; continue; }
          const pop = t.wait > 0 ? 1.3 * (1 - t.wait / 1.4) : 1.3;
          hatchling(t.x, t.y, Math.max(0.4, pop), t.wait > 0 ? 0 : t.t);
        }
      }
      for (const q of g.gulls) {
        if (q.state === 'grab') hatchling(q.x, q.y + 28, 1.0, S.t * 2);
        gull(q.x, q.y, 0.9, S.t + q.t, q.dir, q.state === 'hunt' && q.t / q.warn > 0.7 ? 1 : 0, q.state === 'grab' || (q.state === 'hunt' && q.t / q.warn > 0.6));
      }
    },
  };

  restage('beach', {
    games: [['turtleguard', 'shell', {}], ['pinchtreasuremap', 'ribbon', {}]],
    intro: [
      'N:Ahoy, matey! Quick, look! The baby sea turtles be hatchin\'!',
      'N:They need to crawl down to the sea, but those greedy gulls want a snack.',
      'N:Steer me onto the gull shadows, and I\'ll snap me claws and shoo them away! There be shells in it for ye!',
      'A:determined:Aye aye, Captain! No gull gets past us!',
    ],
    mid: [
      'N:Every little turtle is swimmin\' free! Ye be a fine first mate.',
      'N:Now, long ago I buried me treasure... but I only remember the clues on me old map!',
      'N:Follow the arrows and count the steps, and we\'ll dig it up together!',
      'A:excited:A real treasure map? Let\'s dig!',
    ],
    outro: [
      'N:Shiver me timbers, ye found it all! Here, take a ribbon from the treasure chest.',
      'A:happy:Thank you, Captain Pinch! Best pirate day ever!',
    ],
  });
}
