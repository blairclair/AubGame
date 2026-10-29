'use strict';
// Seashell Beach, new games: Turtle Guard (action) and Captain Pinch's treasure map (learn).
{
  const DIRW = { R: 'RIGHT', L: 'LEFT', U: 'UP', D: 'DOWN' };
  const DV = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
  const BACK = { R: 'L', L: 'R', U: 'D', D: 'U' };
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
  // Clues: start at a landmark and take some steps; follow a chain of arrow cards in your
  // head to where it ends; or read grid coordinates like C 3. Always one dig per guess.
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
        Object.assign(g, { marks, q, tre: q.tre, kind, dug: [], tries: 0, state: 'ask', dig: null, t2: 0, demoT: 0, routeT: 0 });
        break;
      }
      const q = g.q;
      if (g.kind === 'coord') g.say = `Dig at square ${coordName(...g.tre)}! Find the letter ${LETTERS[g.tre[0]]} on top, and the number ${g.tre[1] + 1} on the side.`;
      else if (g.kind === 'chain') g.say = `Start at the ${MARKS[q.from.k][0]}. Follow the arrows, one square for each: ${q.steps.map(d => DIRW[d].toLowerCase()).join(', ')}. Then dig where they end!`;
      else {
        const steps = q.moves.map(([d, n]) => `go ${plural(n, 'step')} ${DIRW[d]}`).join(', then ');
        g.say = `Start at the ${MARKS[q.from.k][0]}. Then ${steps}. Dig there!`;
      }
      if (g.phase === 'play') speak(g.say);
    },
    miss(g, c, r, from, words) {
      g.tries++; SFX.miss();
      const h = hintFor(from, g.tre);
      if (g.q.path && g.tries < 3) g.routeT = 2.2; // briefly trace the route from the landmark (stopping one square short)
      g.fx.push({ c, r, t: 2.4, hint: h });
      if (g.tries >= 3) speak('Arr, so close! Look for the sparkles, matey!');
      else speak(words || `Not here, matey! Go ${h.map(d => DIRW[d]).join(' and ')}.`);
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
      g.demoT += dt; g.routeT = Math.max(0, g.routeT - dt);
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
      if (g.state === 'ask' && !g.dig) rrect(TM.x0 + hc * cw + 4, TM.y0 + hr * ch + 4, cw - 8, ch - 8, 10, 'rgba(255,255,255,.5)');
      if (showLab) {
        for (let c = 0; c < g.cols; c++) {
          const on = c === hc; if (on) inkCircle(cellCx(g, c), 95, 14, '#ffd23a', 1.4);
          text(LETTERS[c], cellCx(g, c), 96, on ? 22 : 19, '#6a3a1a', 'center', 800);
        }
        for (let r = 0; r < g.rows; r++) {
          const on = r === hr; if (on) inkCircle(232, cellCy(g, r), 14, '#ffd23a', 1.4);
          text(String(r + 1), 232, cellCy(g, r) + 1, on ? 22 : 19, '#6a3a1a', 'center', 800);
        }
      }
      // trails: the whole route, drawn out from the landmark once the treasure is found;
      // after a miss, a brief trace that stops one square short of the treasure
      if (q.path && g.state === 'yay') dotted(g, q.path, Math.min(q.path.length, 1 + Math.floor(g.t2 * 6)));
      else if (q.path && g.routeT > 0) {
        ctx.save(); ctx.globalAlpha = clamp(g.routeT, 0, 1);
        dotted(g, q.path, Math.min(q.path.length - 1, 1 + Math.floor((2.2 - g.routeT) * 5)));
        ctx.restore();
      }
      for (const m of g.marks) {
        const glow = q.from === m && g.state === 'ask';
        if (glow) { ctx.fillStyle = `rgba(255,240,150,${0.35 + Math.sin(S.t * 4) * 0.15})`; circle(cellCx(g, m.c), cellCy(g, m.r), Math.min(cw, ch) * 0.46); }
        drawMark(m.k, cellCx(g, m.c), cellCy(g, m.r), s * (glow ? 1 + Math.sin(S.t * 5) * 0.04 : 1));
      }
      for (const [c, r] of g.dug) {
        const x = cellCx(g, c), y = cellCy(g, r) + 8;
        ctx.fillStyle = '#c89a5a'; ellipse(x + 30 * s, y - 4, 14 * s, 7 * s); ellipse(x - 26 * s, y - 2, 10 * s, 5 * s);
        inkEllipse(x, y, 30 * s, 14 * s, 0, '#8a5a34', 1.6); ctx.fillStyle = '#5a3a24'; ellipse(x, y + 2, 23 * s, 9 * s);
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ellipse(x, y - 3, 22 * s, 5 * s);
      }
      if (g.tries >= 3 && g.state === 'ask') {
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
      } else if (g.state === 'ask' && !g.dig) {
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
          text('below, then dig! 👇', 862, 260, 14, '#ff6fb5', 'center', 800);
        } else q.moves.forEach(([d, n], i) => {
          const y = q.moves.length > 1 ? 252 + i * 54 : 266;
          text(String(n), 820, y, 30, '#ff6a4a', 'center', 800);
          arrow(d, 872, y, 22, ['#ff9a3a', '#4fa8e0'][i]);
          text(DIRW[d], 872, y + 24, 12, '#5a2a6e', 'center', 800);
        });
      }
      // chain rounds: a row of big arrow cards; they light up one by one as Pinch reads them out
      if (chain) {
        const n = q.steps.length, cwd = 70, gap = 10, x0 = 487 - (n * cwd + (n - 1) * gap) / 2;
        q.steps.forEach((d, i) => {
          const x = x0 + i * (cwd + gap), demo = Math.floor((g.demoT - 1.4) / 0.8), now = i === demo, done = g.state === 'yay';
          const lift = now ? Math.sin(S.t * 6) * 3 : 0;
          if (now) { ctx.fillStyle = 'rgba(255,240,150,.7)'; rrect(x - 6, 456 - 6 + lift, cwd + 12, 80, 18, 'rgba(255,236,140,.75)'); }
          rrect(x, 456 + lift, cwd, 68, 14, done ? '#8fdc9a' : now ? '#fff1a8' : '#fffaf0', OL, 2.5);
          arrow(d, x + cwd / 2, 484 + lift, 24, done ? '#3fae5a' : '#ff8a3a');
          text(DIRW[d], x + cwd / 2, 512 + lift, 11, done ? '#1f6a3a' : '#7a5a4a', 'center', 800);
          if (done) { inkCircle(x + cwd - 6, 460 + lift, 9, '#3fae5a', 1.2); text('✓', x + cwd - 6, 461 + lift, 12, '#fff', 'center', 800); }
        });
      }
    },
  };

  // =====================================================================================
  // LEARN: Sandcastle Lab. Build the castle on Captain Pinch's plan, one sand shape at a
  // time: pick the mold (cube, cylinder, cone, pyramid), get the sand just wet enough
  // (squeeze test!), then flip the mold. Teaches 3D shape names and why damp sand sticks.
  // =====================================================================================
  const SC_X = 450, SC_GY = 392; // the castle's middle and the sand it stands on
  const SHAPE_INFO = {
    cube: { name: 'cube', col: '#ff6a6a', fact: 'A cube has six flat faces, and every face is a square.' },
    cylinder: { name: 'cylinder', col: '#4fa8f0', fact: 'A cylinder has two flat circles, one on the top and one on the bottom, and a curved side.' },
    cone: { name: 'cone', col: '#ffc23a', fact: 'A cone has one flat circle at the bottom, and goes up to a point.' },
    pyramid: { name: 'pyramid', col: '#5ac87a', fact: 'A pyramid has a square at the bottom, and triangle sides that meet at a point.' },
  };
  // castle pieces: shape, middle x, bottom y, width, height, what to call it
  const SC_PIECE = {
    base: ['cube', SC_X, SC_GY, 124, 100, 'big cube in the middle'],
    towerL: ['cylinder', SC_X - 116, SC_GY, 76, 150, 'cylinder tower on the left'],
    towerR: ['cylinder', SC_X + 116, SC_GY, 76, 150, 'cylinder tower on the right'],
    coneL: ['cone', SC_X - 116, SC_GY - 154, 88, 74, 'cone roof on the left tower'],
    coneR: ['cone', SC_X + 116, SC_GY - 154, 88, 74, 'cone roof on the right tower'],
    pyr: ['pyramid', SC_X - 2, SC_GY - 114, 96, 70, 'pyramid on top of the cube'],
  };
  function scPlan(tier) {
    const side = pick(['L', 'R']), other = side === 'L' ? 'R' : 'L';
    if (tier === 1) return ['base', 'tower' + side, pick(['cone' + side, 'pyr'])];
    if (tier === 2) return ['base', 'tower' + side, 'tower' + other, pick(['cone' + side, 'pyr'])];
    return ['base', 'tower' + side, 'tower' + other, 'pyr', 'cone' + pick([side, other])];
  }
  const SC_WET = { 1: [0.36, 0.72], 2: [0.4, 0.68], 3: [0.44, 0.64] }; // "just right" dampness
  const sandCol = w => (w > 1 ? '#a08050' : mix('#f8e2a8', '#b8925a', clamp(w, 0, 1)));

  // a 3D shape seen a little from the right; fill==null draws a plan outline only
  function solid(shape, x, bottom, w, h, fill, opts = {}) {
    const d = w * 0.2, dy = d * 0.6, lw = opts.lw ?? 2.2;
    const draw = (p, f) => { if (fill) ink(p, f, lw); else { ctx.strokeStyle = opts.line || '#ffffff'; ctx.lineWidth = lw; ctx.stroke(p); } };
    if (shape === 'cube') {
      const x0 = x - w / 2, x1 = x + w / 2 - d, top = bottom - h;
      draw(P2(`M${x0},${top} L${x0 + d},${top - dy} L${x1 + d},${top - dy} L${x1},${top} Z`), fill && mix(fill, '#ffffff', 0.3));
      draw(P2(`M${x1},${top} L${x1 + d},${top - dy} L${x1 + d},${bottom - dy} L${x1},${bottom} Z`), fill && mix(fill, '#5a3a20', 0.22));
      draw(P2(`M${x0},${top} L${x1},${top} L${x1},${bottom} L${x0},${bottom} Z`), fill);
    } else if (shape === 'cylinder') {
      const rx = w / 2, ry = w * 0.17, top = bottom - h;
      const body = P2(`M${x - rx},${top} L${x - rx},${bottom} A${rx},${ry} 0 0 0 ${x + rx},${bottom} L${x + rx},${top} Z`);
      draw(body, fill);
      if (fill) {
        ctx.save(); ctx.clip(body);
        const gr = ctx.createLinearGradient(x - rx, 0, x + rx, 0); gr.addColorStop(0, 'rgba(255,255,255,.25)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(70,40,10,.25)');
        ctx.fillStyle = gr; ctx.fillRect(x - rx, top - ry, w, h + ry * 2); ctx.restore();
      }
      const lid = new Path2D(); lid.ellipse(x, top, rx, ry, 0, 0, TAU);
      draw(lid, fill && mix(fill, '#ffffff', 0.3));
    } else if (shape === 'cone') {
      const rx = w / 2, ry = w * 0.17;
      const p = P2(`M${x - rx},${bottom} L${x},${bottom - h} L${x + rx},${bottom} A${rx},${ry} 0 0 1 ${x - rx},${bottom} Z`);
      draw(p, fill);
      if (fill) {
        ctx.save(); ctx.clip(p);
        const gr = ctx.createLinearGradient(x - rx, 0, x + rx, 0); gr.addColorStop(0, 'rgba(255,255,255,.3)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(70,40,10,.28)');
        ctx.fillStyle = gr; ctx.fillRect(x - rx, bottom - h, w, h + ry + 2); ctx.restore();
      }
    } else if (shape === 'pyramid') {
      const ax = x + d * 0.3, ay = bottom - h, fl = x - w / 2, fr = x + w / 2 - d, br = x + w / 2;
      draw(P2(`M${fr},${bottom} L${br},${bottom - dy} L${ax},${ay} Z`), fill && mix(fill, '#5a3a20', 0.22));
      draw(P2(`M${fl},${bottom} L${fr},${bottom} L${ax},${ay} Z`), fill);
    }
  }
  // a finished sand piece, with grains, a window or two and pressed-in shells
  function sandPiece(key, k = 1, col = '#d8b478') {
    const [shape, x, b, w, h] = SC_PIECE[key];
    ctx.save(); ctx.translate(x, b); ctx.scale(k, k); ctx.translate(-x, -b);
    solid(shape, x, b, w, h, col);
    const R = rng(key.length * 7 + w);
    ctx.fillStyle = 'rgba(120,80,30,.28)';
    for (let i = 0; i < 26; i++) {
      const px = x - w / 2 + 6 + R() * (w - 14), py = b - 6 - R() * (h - 10);
      if (shape === 'cone' || shape === 'pyramid') { const f = (b - py) / h; if (Math.abs(px - x) > (w / 2) * (1 - f) - 4) continue; }
      circle(px, py, 1 + R() * 1.2);
    }
    if (key.startsWith('tower')) {
      ink(P2(`M${x - 9},${b - 70} L${x - 9},${b - 88} A9,9 0 0 1 ${x + 9},${b - 88} L${x + 9},${b - 70} Z`), '#6a4a2a', 1.4);
      smallShell(x, b - 30, 9, '#ffb3c8');
    }
    if (key === 'base') {
      ink(P2(`M${x - 28},${b} L${x - 28},${b - 34} A18,18 0 0 1 ${x + 8},${b - 34} L${x + 8},${b} Z`), '#6a4a2a', 1.6);
      smallShell(x - 40, b - 72, 8, '#c8b8ff', -0.3); starfish(x + 20, b - 74, 9, '#ff7a5a', 0.2);
    }
    if (key.startsWith('cone')) { ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, b - h); ctx.lineTo(x, b - h - 26); ctx.stroke(); ink(P2(`M${x},${b - h - 26} L${x + 20},${b - h - 20} L${x},${b - h - 14} Z`), '#ff5f7e', 1.2); }
    if (key === 'pyr') starfish(x, b - h + 2, 8, '#ffd23a');
    ctx.restore();
  }
  // a plastic mold (the bucket shape), as a big button icon or carried over the castle
  function mold(shape, x, bottom, s) {
    const info = SHAPE_INFO[shape], w = { cube: 74, cylinder: 54, cone: 64, pyramid: 70 }[shape] * s, h = { cube: 58, cylinder: 62, cone: 58, pyramid: 54 }[shape] * s;
    solid(shape, x, bottom, w, h, info.col, { lw: 2 });
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(x - w * 0.22, bottom - h * 0.5, w * 0.06, h * 0.22);
  }
  function hand(x, y, s, open = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = 0; i < 4; i++) inkEllipse(-24 + i * 16, -6 - 14 * open, 8, 16, 0, '#ffd2b8', 1.6);
    inkEllipse(36, 4, 9, 15, -0.9, '#ffd2b8', 1.6);
    inkEllipse(0, 10, 38, 22, 0, '#ffd2b8', 1.8);
    ctx.fillStyle = 'rgba(200,120,100,.25)'; ellipse(0, 14, 24, 10);
    ctx.restore();
  }

  MG.sandcastlelab = {
    kind: 'learn', title: () => 'Sandcastle Lab', icon: () => '🏰',
    how: g => `Build the castle on Captain Pinch's plan! For each part, pick the mold with the right shape. Then make the sand just wet enough: add water or dry sand, and do a squeeze test. If it makes a ball, flip it!`,
    init(g) {
      const [lo, hi] = SC_WET[g.tier];
      Object.assign(g, { plan: scPlan(g.tier), i: 0, built: [], lo, hi, total: 0, drops: [], grains: [], fx: null, sq: null, flip: null, endT: 0, helped: 0 });
      g.rounds = g.plan.length;
      g.molds = g.tier === 1 ? ['cube', 'cylinder', 'cone', 'pyramid'].filter(s => s !== 'pyramid' || g.plan.includes('pyr')) : ['cube', 'cylinder', 'cone', 'pyramid'];
      if (g.tier === 1 && g.molds.length === 4) g.molds = g.molds.filter(s => s !== 'cone');
      this.piece(g);
    },
    start(g) { speak(g.say); },
    piece(g) {
      const key = g.plan[g.i], [shape, , , , , where] = SC_PIECE[key];
      Object.assign(g, { key, shape, step: 'mold', wet: rand(0, 0.14), wrongMold: 0, fails: 0, shake: {} });
      g.say = `Next, the ${where}. Which mold makes a ${SHAPE_INFO[shape].name}?`;
      if (g.phase === 'play') speak(g.say);
    },
    act(g, a) {
      const [lo, hi] = [g.lo, g.hi];
      if (a === 'water') {
        g.wet += rand(0.1, 0.15); for (let i = 0; i < 8; i++) g.drops.push({ x: 120 + rand(-30, 30), y: 230 + rand(-10, 10), vy: rand(60, 140), life: 0.6 });
        tone(rand(500, 700), 0.12, 'sine', 0.06, 0, 300); g.sq = null;
      } else if (a === 'sand') {
        g.wet = Math.max(0, g.wet - rand(0.1, 0.14)); for (let i = 0; i < 10; i++) g.grains.push({ x: 120 + rand(-26, 26), y: 220 + rand(-6, 6), vy: rand(80, 150), life: 0.5 });
        tone(300, 0.15, 'triangle', 0.04, 0, 200); g.sq = null;
      } else if (a === 'squeeze') {
        const res = g.wet < lo ? 'dry' : g.wet > hi ? 'wet' : 'ok';
        g.sq = { t: 0, res };
        SFX.pop();
        speak({ dry: 'It crumbles! Too dry. Dry sand has no water to stick the grains together. Add some water.',
          wet: 'It drips! Too wet. Too much water makes sand runny, like mud. Add some dry sand.',
          ok: 'It holds a ball! Just right. A little water makes tiny bridges that glue the grains together. Flip it!' }[res]);
      } else if (a === 'flip') {
        g.flip = { t: 0, res: g.wet < lo ? 'dry' : g.wet > hi ? 'wet' : 'ok' }; g.step = 'flip'; g.sq = null;
        SFX.jump();
      }
    },
    update(g, dt, id) {
      for (const p of [...g.drops, ...g.grains]) { p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; }
      g.drops = g.drops.filter(p => p.life > 0); g.grains = g.grains.filter(p => p.life > 0);
      for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
      if (g.sq) g.sq.t += dt;
      if (g.fx) { g.fx.t += dt; if (g.fx.t > 1.6) g.fx = null; }
      g.progress = `🏰 Part ${Math.min(g.i + 1, g.rounds)} of ${g.rounds}`;
      if (g.step === 'end') {
        g.endT += dt;
        if (g.endT > 3.2) { g.score = g.total / g.rounds; g.done = true; }
        return;
      }
      if (g.step === 'flip') {
        const f = g.flip; f.t += dt;
        if (f.t > 0.55 && !f.thump) { f.thump = true; tone(110, 0.15, 'triangle', 0.12); }
        if (f.t > 1.3 && !f.shown) {
          f.shown = true;
          if (f.res === 'ok') {
            const score = Math.max(0.1, 1 - 0.25 * g.wrongMold - 0.3 * g.fails);
            g.total += score; g.built.push(g.key); g.score = g.total / g.rounds;
            SFX.sparkle(); const [, x, b, , h] = SC_PIECE[g.key]; burst(x, b - h / 2, 18, { colors: ['#fff6a8', '#ffd0a0', '#ffffff'] });
            speak(`Ta da! A ${SHAPE_INFO[g.shape].name}! ${SHAPE_INFO[g.shape].fact}`);
          } else {
            g.fails++; SFX.miss();
            g.fx = { t: 0, res: f.res, key: g.key };
            if (g.fails >= 3) {
              g.wet = (g.lo + g.hi) / 2;
              speak("Arr, let me help ye, matey. I've mixed it just right. Flip it again!");
            } else speak(f.res === 'dry' ? 'Oh no, it crumbled! The sand was too dry to stick. Add water, and try a squeeze test.' : 'Oh no, it slumped! The sand was too wet and runny. Add some dry sand.');
          }
        }
        if (f.t > (f.res === 'ok' ? 3.4 : 1.8)) {
          g.flip = null;
          if (f.res !== 'ok') { g.step = 'mix'; return; }
          g.i++;
          if (g.i >= g.rounds) { g.step = 'end'; g.endT = 0; SFX.fanfare(); speak('Ahoy, what a castle! And here comes the tide to fill yer moat!'); return; }
          this.piece(g);
        }
        return;
      }
      if (g.step === 'mold') {
        const k = id && id.startsWith('sc:') ? id.slice(3) : null;
        if (!k) return;
        if (k === g.shape) {
          g.step = 'mix'; SFX.hit();
          g.say = 'Now make the sand just right. Add water or dry sand, then squeeze it to test!';
          speak(`Yes, the ${SHAPE_INFO[k].name} mold! ${g.i === 0 ? 'Now make the sand just right. Add water, then do a squeeze test!' : 'Now mix the sand just right!'}`);
        } else {
          g.wrongMold++; g.shake[k] = 0.4; SFX.miss();
          speak(`That's a ${SHAPE_INFO[k].name}. ${SHAPE_INFO[k].fact} We need a ${SHAPE_INFO[g.shape].name}!`);
        }
        return;
      }
      if (id === 'sc_water' || id === 'sc_sand' || id === 'sc_squeeze' || id === 'sc_flip') this.act(g, id.slice(3));
    },
    draw(g) {
      const [lo, hi] = [g.lo, g.hi];
      drawCritter('Captain Pinch', 878, GY + 44, 0.56, -1);
      // the sand mound and moat the castle sits on
      const moat = g.step === 'end' ? clamp(g.endT / 1.6, 0, 1) : 0;
      inkEllipse(SC_X, SC_GY + 6, 250, 34, 0, '#e8c888', 1.6);
      ctx.fillStyle = '#c9a56c'; ctx.beginPath(); ctx.ellipse(SC_X, SC_GY + 8, 212, 24, 0, 0, TAU); ctx.ellipse(SC_X, SC_GY + 4, 182, 15, 0, 0, TAU); ctx.fill('evenodd');
      if (moat > 0) {
        ctx.fillStyle = `rgba(80,190,230,${0.85 * moat})`; ctx.beginPath(); ctx.ellipse(SC_X, SC_GY + 8, 210, 23, 0, 0, TAU); ctx.ellipse(SC_X, SC_GY + 4, 184, 16, 0, 0, TAU); ctx.fill('evenodd');
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * moat})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(SC_X, SC_GY + 14 + Math.sin(S.t * 3) * 1.5, 198, 18, 0, 0.3, Math.PI - 0.3); ctx.stroke();
      }
      ctx.fillStyle = '#ecd096'; ellipse(SC_X, SC_GY + 3, 180, 14);
      // castle: built pieces, the one being made, and its ghost outline from the plan
      const cur = g.step !== 'end' ? g.key : null;
      for (const key of ['base', 'towerL', 'towerR', 'pyr', 'coneL', 'coneR']) {
        if (g.built.includes(key)) {
          const pop = g.flip && g.flip.shown && g.flip.res === 'ok' && key === g.key ? 1 + Math.sin(Math.min(1, (g.flip.t - 1.3) * 3) * Math.PI) * 0.06 : 1;
          sandPiece(key, pop);
        } else if (key === cur) {
          ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(S.t * 4) * 0.2; ctx.setLineDash([8, 6]);
          const [shape, x, b, w, h] = SC_PIECE[key]; solid(shape, x, b, w, h, null, { line: '#ffffff', lw: 3 });
          ctx.restore();
        }
      }
      // failed flips: a crumbly heap or a runny puddle
      if (g.fx) {
        const [, x, b, w] = SC_PIECE[g.fx.key], k = Math.min(1, g.fx.t * 2);
        ctx.globalAlpha = clamp(2 - g.fx.t * 1.3, 0, 1);
        if (g.fx.res === 'dry') {
          inkEllipse(x, b - 10 * (1 - k * 0.4), w * 0.45, 16, 0, '#f2dca0', 1.4);
          const R = rng(3); for (let i = 0; i < 18; i++) inkCircle(x + (R() - 0.5) * w * (0.6 + k * 0.6), b - 4 - R() * 26 * (1 - k * 0.6), 3 + R() * 3, '#f2dca0', 0.8);
        } else {
          inkEllipse(x, b - 2, w * (0.4 + k * 0.4), 9 + 6 * (1 - k), 0, '#a8844e', 1.4);
          ctx.fillStyle = 'rgba(140,200,230,.6)'; ellipse(x + 8, b - 4, w * 0.3 * k, 4);
        }
        ctx.globalAlpha = 1;
      }
      // flipping: the mold flies over, thumps down, and lifts away
      if (g.flip) {
        const f = g.flip, [, x, b, w, h] = SC_PIECE[g.key];
        const s = { cube: w / 74, cylinder: w / 54, cone: w / 64, pyramid: w / 70 }[g.shape];
        if (f.t < 0.55) { const k = f.t / 0.55; mold(g.shape, lerp(120, x, k), lerp(300, b, k) - Math.sin(k * Math.PI) * 120, lerp(1, s, k)); }
        else if (f.t < 0.9) { mold(g.shape, x, b + Math.sin((f.t - 0.55) * 30) * 2, s); }
        else if (f.t < 1.3) { ctx.globalAlpha = 1 - (f.t - 0.9) / 0.4; mold(g.shape, x, b - (f.t - 0.9) * 260, s); ctx.globalAlpha = 1; }
      }
      // the mixing bucket, its sand showing how wet it is
      const bx = 120, by = 404;
      ink(P2(`M${bx - 58},${by - 110} L${bx + 58},${by - 110} L${bx + 46},${by} L${bx - 46},${by} Z`), '#ff8ac0', 2.4);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(bx - 46, by - 102, 10, 92);
      ctx.fillStyle = '#e05a9a'; ctx.fillRect(bx - 56, by - 92, 112, 8);
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(bx, by - 104, 62, Math.PI + 0.25, -0.25); ctx.stroke();
      ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2.5; ctx.stroke();
      inkEllipse(bx, by - 110, 58, 14, 0, sandCol(g.wet), 2);
      if (g.wet < lo) { ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 9; i++) circle(bx - 44 + i * 11, by - 112 + Math.sin(i * 2) * 5, 1.4); }
      if (g.wet > hi) { ctx.fillStyle = `rgba(140,210,240,${0.4 + Math.sin(S.t * 3) * 0.1})`; ellipse(bx + 8, by - 110, 34, 7); ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(bx, by - 113, 12, 2); }
      if (g.tier === 1) text(g.wet < lo ? 'dry' : g.wet > hi ? 'soggy' : 'damp', bx, by - 56, 16, '#fff', 'center', 800); // later tiers: use the squeeze test
      // a watering can and a scoop of dry sand beside it
      ink(P2(`M${bx + 70},${by - 40} L${bx + 112},${by - 40} L${bx + 108},${by} L${bx + 74},${by} Z`), '#4fb0f0', 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx + 76, by - 30); ctx.lineTo(bx + 50, by - 58); ctx.stroke(); ctx.strokeStyle = '#4fb0f0'; ctx.lineWidth = 3; ctx.stroke();
      inkCircle(bx + 48, by - 60, 5, '#4fb0f0', 1.2);
      for (const p of g.drops) { ctx.fillStyle = 'rgba(90,180,240,.9)'; ellipse(p.x, p.y, 2.5, 4); }
      for (const p of g.grains) { ctx.fillStyle = '#e8c070'; circle(p.x, p.y, 2.2); }
      // squeeze test result, in Aubrey's hand
      if (g.sq) {
        const k = Math.min(1, g.sq.t * 3), y = 196;
        panel(28, 112, 186, 128, 18);
        hand(110, y + 12, 1, 1);
        if (g.sq.res === 'ok') { inkCircle(110, y - 6, 22 * k, sandCol(g.wet), 1.6); ctx.fillStyle = 'rgba(255,255,255,.4)'; circle(102, y - 14, 5 * k); }
        else if (g.sq.res === 'dry') { const R = rng(9); for (let i = 0; i < 14; i++) inkCircle(80 + R() * 60, y - 2 + R() * 10 + k * R() * 30, 3, sandCol(g.wet), 0.8); }
        else { inkEllipse(110, y + 2, 30 * k, 9, 0, sandCol(g.wet), 1.4); ctx.fillStyle = 'rgba(90,180,240,.85)'; for (let i = 0; i < 3; i++) ellipse(90 + i * 20, y + 34 + ((g.sq.t * 60 + i * 13) % 30), 3, 5); }
        text({ ok: 'Holds a ball!', dry: 'Crumbles!', wet: 'Drips!' }[g.sq.res], 120, 128, 17, { ok: '#3f9a5a', dry: '#c0703a', wet: '#3a7ac0' }[g.sq.res], 'center', 800);
      }
      // Pinch's plan
      ctx.save(); ctx.translate(700, 66);
      ink(P2('M0,0 L244,0 L244,258 L0,258 Z'), '#3f7fd0', 2.2);
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1;
      for (let x = 12; x < 244; x += 16) { ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x, 256); ctx.stroke(); }
      for (let y = 12; y < 258; y += 16) { ctx.beginPath(); ctx.moveTo(2, y); ctx.lineTo(242, y); ctx.stroke(); }
      ctx.restore();
      text("Captain's Plan", 822, 84, 15, '#ffffff', 'center', 800);
      ctx.save(); ctx.translate(822, 300); ctx.scale(0.5, 0.5); ctx.translate(-SC_X, -SC_GY);
      for (const key of g.plan) {
        const [shape, x, b, w, h] = SC_PIECE[key], now = key === cur;
        const done = g.built.includes(key);
        if (done) { ctx.globalAlpha = 0.35; solid(shape, x, b, w, h, '#ffffff', { lw: 1 }); ctx.globalAlpha = 1; }
        solid(shape, x, b, w, h, null, { line: now ? '#ffe45a' : '#ffffff', lw: now ? 7 + Math.sin(S.t * 6) * 2 : 4 });
      }
      ctx.restore();
      if (cur) text(SHAPE_INFO[g.shape].name.toUpperCase(), 822, 314, 17, '#ffe45a', 'center', 800);
      // controls
      if (g.step === 'mold') {
        const n = g.molds.length, bw = 150, gap = 14, x0 = 400 - (n * bw + (n - 1) * gap) / 2 + 40;
        g.molds.forEach((m, i) => {
          const x = x0 + i * (bw + gap) + (g.shake[m] ? Math.sin(g.shake[m] * 50) * 6 : 0), hint = g.wrongMold >= 2 && m === g.shape;
          if (hint) { ctx.fillStyle = `rgba(255,240,140,${0.5 + Math.sin(S.t * 6) * 0.3})`; rrect(x - 6, 434, bw + 12, 104, 20, ctx.fillStyle); }
          button('sc:' + m, x, 440, bw, 92, '', { color: '#fff6e8', key: String(i + 1) });
          mold(m, x + bw / 2 + 4, 506, 0.9);
          text(SHAPE_INFO[m].name, x + bw / 2, 522, 15, '#5a2a6e', 'center', 800);
        });
      } else if (g.step === 'mix') {
        const btns = [['sc_water', 'Water', '💧', '#4fa8f0'], ['sc_sand', 'Dry sand', '🏖️', '#d8a050'], ['sc_squeeze', 'Squeeze', '✊', '#9a6ae0'], ['sc_flip', 'Flip it!', '🪣', '#3fbf6a']];
        btns.forEach(([idb, label, icon, col], i) => button(idb, 34 + i * 182, 450, 170, 74, label, { icon, color: col, size: 19, key: String(i + 1) }));
      }
      if (g.step === 'end') {
        const k = clamp((g.endT - 1.2) * 2, 0, 1);
        const top = g.built.includes('pyr') ? SC_GY - 184 : SC_GY - 106, px = g.built.includes('pyr') ? SC_X + 5 : SC_X - 6;
        if (k > 0) { ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, top - 60 * k); ctx.stroke(); ink(P2(`M${px},${top - 60 * k} L${px + 40 * k},${top - 50 * k + Math.sin(S.t * 5) * 3} L${px},${top - 38 * k} Z`), '#3a2a4a', 1.4); ctx.fillStyle = '#fff'; circle(px + 14 * k, top - 49 * k, 4 * k); }
        outlined('Ahoy, castle!', SC_X, 120, 34, '#ffd23a');
      }
    },
  };

  restage('beach', {
    games: [['sandcastlelab', 'shell', {}], ['pinchtreasuremap', 'ribbon', {}]],
    intro: [
      'N:Ahoy, matey! Today we build the finest sandcastle on the seven seas!',
      "N:I drew the plan meself: cubes, cylinders, cones, and maybe a pyramid.",
      "N:But mind the sand! Too dry and it crumbles, too wet and it slumps. Squeeze it to test, and there be shells in it for ye!",
      'A:excited:A sandcastle lab? Aye aye, Captain!',
    ],
    mid: [
      "N:What a castle! Even the tide came to see it. Ye be a fine first mate.",
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
