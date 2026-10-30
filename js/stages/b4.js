'use strict';
// Batch 4: Tinker's Toy Shop, Traveling Carnival, Whispering Waterfall, Grandma Weave's Cottage
// and the Sunflower Maze. Each gets its own backdrop and two minigames.
{
  // ======================================================================== shared bits
  const numKey = n => { for (let i = 1; i <= n; i++) if (pressed[String(i)]) return i - 1; return -1; };
  const triesScore = n => [1, 0.4, 0.1, 0][Math.min(n, 3)];
  const RAIN = ['#ff5f7e', '#ffa040', '#ffd83a', '#5adc7a', '#40b0ff', '#9c6cff'];
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  const ORD_S = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const promptBar = (str, y = 66, w = 640, size = 22) => { panel(W / 2 - w / 2, y, w, 46, 20); text(str, W / 2, y + 23, size, '#5a2a6e', 'center', 700); };
  const inside = (x, y, w, h) => pointer.x > x && pointer.x < x + w && pointer.y > y && pointer.y < y + h;
  // a thick outlined stroke along whatever path is current
  const inkStroke = (col, w, lw = 2) => { ctx.strokeStyle = OL; ctx.lineWidth = w + lw * 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
  const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); };

  // ---- little reusable drawings
  function abcBlock(x, y, s, col, ch) {
    inkRect(x - s / 2, y - s, s, s, col, 2, 4);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x - s / 2 + 3, y - s + 3, s - 6, 3);
    text(ch, x, y - s / 2 + 1, s * 0.6, '#fff', 'center', 800);
  }
  function yarnBall(x, y, r, col) {
    inkCircle(x, y, r, col, 1.5);
    ctx.strokeStyle = mix(col, '#ffffff', 0.45); ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(x + i * r * 0.18, y, r * 0.85, r * (0.3 + Math.abs(i) * 0.12), 0.9, 0, Math.PI * 2); ctx.stroke(); }
  }
  function balloon(x, y, r, col, sway = 0) {
    ctx.strokeStyle = '#8a7a9a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + r * 1.15); ctx.quadraticCurveTo(x + sway, y + r * 2.2, x - sway * 0.5, y + r * 3.2); ctx.stroke();
    inkEllipse(x, y, r * 0.85, r, 0, col, 1.5);
    ctx.fillStyle = col; tri(x - 4, y + r + 5, x + 4, y + r + 5, x, y + r - 2);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(x - r * 0.3, y - r * 0.35, r * 0.18, r * 0.3, 0.4);
  }
  // sunflower head facing us; r = petal tip radius
  function sunHead(x, y, r, rot = 0, face = true, petal = '#ffd23f') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const n = 14;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, r * 0.38, r * 0.17, a, 0, Math.PI * 2);
        if (pass === 0) { ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.stroke(); } else { ctx.fillStyle = i % 2 ? petal : mix(petal, '#ff9a2a', 0.35); ctx.fill(); }
      }
    }
    inkCircle(0, 0, r * 0.42, '#8a4a22', Math.max(0.8, r * 0.035));
    ctx.fillStyle = '#5e2c12';
    for (let i = 0; i < 18; i++) { const a = i * 2.4, d = Math.sqrt(i / 18) * r * 0.34; circle(Math.cos(a) * d, Math.sin(a) * d, Math.max(0.8, r * 0.035)); }
    if (face && r > 14) {
      ctx.fillStyle = '#2a1408'; circle(-r * 0.14, -r * 0.06, r * 0.05); circle(r * 0.14, -r * 0.06, r * 0.05);
      ctx.strokeStyle = '#2a1408'; ctx.lineWidth = Math.max(1, r * 0.04); ctx.beginPath(); ctx.arc(0, r * 0.05, r * 0.14, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,120,.6)'; circle(-r * 0.25, r * 0.08, r * 0.06); circle(r * 0.25, r * 0.08, r * 0.06);
    }
    ctx.restore();
  }
  function sunStem(x, base, topY, sway = 0, w = 7) {
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x - sway * 0.3, (base + topY) / 2, x + sway, topY);
    ctx.lineCap = 'round'; inkStroke('#4fae3a', w, 1.5);
    const h = base - topY;
    for (let k = 0.3; k < 0.85; k += 0.28) {
      const ly = base - h * k, lx = x + sway * k * k, s = k * 10 % 2 < 1 ? 1 : -1, L = Math.min(34, 10 + h * 0.08);
      ink(P2(`M${lx},${ly} C${lx + s * L * 0.5},${ly - L * 0.6} ${lx + s * L},${ly - L * 0.3} ${lx + s * L * 1.2},${ly - L * 0.1} C${lx + s * L * 0.8},${ly + L * 0.3} ${lx + s * L * 0.3},${ly + L * 0.2} ${lx},${ly} Z`), '#5fc04a', 1.2);
    }
  }
  function drawKitten(x, y, s, cols, dir, t, moving, sleep = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const [c, c2] = cols, step = moving ? Math.sin(t * 18) * 4 : 0, tw = Math.sin(t * 5) * 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (sleep) { ctx.moveTo(-20, -8); ctx.quadraticCurveTo(-30, 4, 4, 2); } else { ctx.moveTo(-20, -18); ctx.quadraticCurveTo(-42, -22, -36 + tw, -46); }
    inkStroke(c, 6, 1.5);
    if (!sleep) for (const lx of [-13, -5, 8, 15]) inkEllipse(lx + (lx % 2 ? step : -step), -3, 5, 5, 0, c, 1);
    inkEllipse(0, sleep ? -10 : -18, 24, sleep ? 12 : 15, 0, c, 1.5);
    ctx.strokeStyle = c2; ctx.lineWidth = 3;
    for (const sx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(sx, sleep ? -21 : -32); ctx.lineTo(sx + 2, sleep ? -14 : -24); ctx.stroke(); }
    const hx = sleep ? 18 : 22, hy = sleep ? -16 : -34;
    ink(P2(`M${hx - 12},${hy - 4} L${hx - 9},${hy - 22} L${hx},${hy - 11} Z`), c, 1.2);
    ink(P2(`M${hx},${hy - 11} L${hx + 9},${hy - 22} L${hx + 12},${hy - 4} Z`), c, 1.2);
    inkCircle(hx, hy, 14, c, 1.5);
    ctx.fillStyle = '#ffb0c4'; tri(hx - 9, hy - 9, hx - 8, hy - 17, hx - 3, hy - 11); tri(hx + 9, hy - 9, hx + 8, hy - 17, hx + 3, hy - 11);
    ctx.fillStyle = OL;
    if (sleep || (t % 3.3) < 0.12) { ctx.strokeStyle = OL; ctx.lineWidth = 1.8; for (const ex of [-5, 5]) { ctx.beginPath(); ctx.arc(hx + ex, hy - 2, 3, 0.2, Math.PI - 0.2); ctx.stroke(); } } else { circle(hx - 5, hy - 2, 2.6); circle(hx + 5, hy - 2, 2.6); ctx.fillStyle = '#fff'; circle(hx - 4.2, hy - 3, 0.9); circle(hx + 5.8, hy - 3, 0.9); }
    ctx.fillStyle = '#ff7f9f'; tri(hx - 2, hy + 3, hx + 2, hy + 3, hx, hy + 5.5);
    ctx.strokeStyle = 'rgba(91,63,115,.6)'; ctx.lineWidth = 1;
    for (const k of [-1, 1]) { line(hx + k * 4, hy + 5, hx + k * 16, hy + 3); ctx.stroke(); line(hx + k * 4, hy + 6, hx + k * 15, hy + 8); ctx.stroke(); }
    ctx.restore();
  }
  const KIT_COLS = [['#ffa94d', '#e07a20'], ['#b8b8cc', '#8a8aa4'], ['#fff3dc', '#e8c8a0'], ['#6a5e7a', '#4a405a'], ['#f8f2f2', '#ff9a4a'], ['#ffcf8a', '#d89a4a'], ['#d8d0e8', '#a898c0']];

  // ======================================================================== TOY SHOP
  const TS_TOYS = ['🧸', '🪀', '🎲', '🪁', '🤖', '🦖', '🚀', '🪆', '🧩', '🎨', '🚗', '🏀', '🦄', '🐙', '🎺', '🥁', '🛼', '🦆'];
  function tsBookcase(x, w, seed) {
    inkRect(x, 118, w, 322, '#d08a4c', 3, 4);
    ctx.fillStyle = '#a0623a'; ctx.fillRect(x + 10, 126, w - 20, 306);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 6; i++) ctx.fillRect(x + 14 + i * (w - 28) / 6, 126, 3, 306);
    for (let i = 0; i < 3; i++) {
      const sy = 126 + (i + 1) * 102;
      for (let j = 0; j < 4; j++) {
        const k = (seed + i * 5 + j * 3) % TS_TOYS.length, tx = x + 32 + j * (w - 64) / 3;
        if ((seed + i * 2 + j) % 6 === 1) {
          abcBlock(tx - 12, sy - 4, 24, RAIN[k % 6], 'ABC'[j % 3]); abcBlock(tx + 12, sy - 4, 24, RAIN[(k + 2) % 6], 'XYZ'[i]);
          abcBlock(tx, sy - 28, 24, RAIN[(k + 4) % 6], '123'[i]);
        } else {
          const bob = k % 3 === 0 ? Math.abs(Math.sin(S.t * 2.5 + k)) * -5 : 0, rock = k % 4 === 1 ? Math.sin(S.t * 2 + k) * 0.12 : 0;
          ctx.save(); ctx.translate(tx, sy - 24 + bob); ctx.rotate(rock); emoji(TS_TOYS[k], 0, 0, 40); ctx.restore();
        }
      }
      inkRect(x + 4, sy - 4, w - 8, 12, '#f0a868', 2, 3);
    }
    inkRect(x - 8, 106, w + 16, 16, '#f0a868', 3, 6);
  }
  function tsMobile(x, ph, items) {
    const a = S.t * 0.7 + ph, c = Math.cos(a), sw = Math.sin(S.t * 1.3 + ph) * 3;
    ctx.strokeStyle = '#8a7a9a'; ctx.lineWidth = 1.5; line(x, 0, x, 132); ctx.stroke();
    const ends = [[-1, 0], [1, 1], [0, 2]].map(([k, i]) => [x + k * 52 * c, i]);
    ctx.lineWidth = 4; ctx.strokeStyle = OL; line(x - 52 * Math.abs(c) - 2, 132, x + 52 * Math.abs(c) + 2, 132); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffd83a'; ctx.stroke();
    for (const [ix, i] of ends) {
      const len = [26, 38, 52][i], iy = 132 + len + sw * (i - 1);
      ctx.strokeStyle = '#8a7a9a'; ctx.lineWidth = 1.2; line(ix, 132, ix, iy - 10); ctx.stroke();
      const it = items[i];
      if (it === 'star') vecStar(ix, iy, 13, '#ffd83a', 1.2);
      else if (it === 'moon') { ink(P2(`M${ix + 4},${iy - 13} A13,13 0 1 0 ${ix + 4},${iy + 13} A10,10 0 1 1 ${ix + 4},${iy - 13} Z`), '#fff3a8', 1.2); }
      else if (it === 'cloud') { inkCircle(ix - 8, iy + 2, 8, '#ffffff', 1); inkCircle(ix + 7, iy + 2, 9, '#ffffff', 1); inkCircle(ix, iy - 5, 9, '#ffffff', 1); ctx.fillStyle = '#fff'; ellipse(ix, iy + 2, 14, 6); }
      else if (it === 'heart') { ctx.fillStyle = OL; heart(ix, iy - 9, 30, OL); heart(ix, iy - 8, 26, '#ff7fb8'); }
      else emoji(it, ix, iy, 26);
    }
  }
  function tsTrain() {
    // a high wall shelf right across the shop with the model train looping along it
    inkRect(-10, 100, W + 20, 12, '#f0a868', 2.5, 3);
    ctx.fillStyle = '#9a7a8a'; ctx.fillRect(0, 96, W, 3);
    ctx.fillStyle = '#6a4a3a'; for (let x = 4; x < W; x += 14) ctx.fillRect(x, 97, 6, 3);
    const tx = ((S.t * 70) % (W + 380)) - 170;
    const wheel = (x) => { inkCircle(x, 92, 6, '#4a4058', 1.2); ctx.fillStyle = '#c8c0d8'; circle(x, 92, 2); };
    [['#40b0ff', '🧸'], ['#5adc7a', '🎲'], ['#ffd83a', '⚽']].forEach(([col, cargo], i) => {
      const cx = tx - 70 - i * 62;
      ctx.strokeStyle = OL; ctx.lineWidth = 3; line(cx + 24, 84, cx + 36, 84); ctx.stroke();
      emoji(cargo, cx, 64, 20);
      inkRect(cx - 24, 70, 48, 20, col, 2, 4);
      wheel(cx - 13); wheel(cx + 13);
    });
    // engine with a puffing chimney
    for (let i = 0; i < 4; i++) {
      const k = (S.t * 1.2 + i / 4) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - k)})`; circle(tx + 16 - k * 30, 50 - k * 18, 5 + k * 9);
    }
    inkRect(tx - 28, 66, 30, 24, '#ffd83a', 2, 4);
    inkRect(tx - 32, 60, 38, 7, '#ff5f7e', 2, 3);
    inkRect(tx - 2, 72, 32, 18, '#ff5f7e', 2, 6);
    inkRect(tx + 12, 58, 9, 15, '#4a4058', 2, 2);
    inkCircle(tx + 30, 81, 3, '#fff6a8', 1);
    rrect(tx - 23, 70, 14, 10, 3, '#bfe6ff');
    wheel(tx - 16); wheel(tx + 4); wheel(tx + 20);
  }
  BACKDROPS.toyshop_bg = () => {
    const g = ctx.createLinearGradient(0, 0, 0, 440); g.addColorStop(0, '#7fd3ec'); g.addColorStop(1, '#c9f1f4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // wallpaper: rows of tiny stars and dots
    for (let y = 130, r = 0; y < 400; y += 38, r++) for (let x = (r % 2) * 30; x < W; x += 60) {
      if ((x + y) % 120 < 60) star(x, y, 6, 'rgba(255,255,255,.5)', 5); else { ctx.fillStyle = 'rgba(255,140,200,.35)'; circle(x, y, 4); }
    }
    // wainscot
    inkRect(-4, 372, W + 8, 64, '#ffc4dc', 2.5, 0);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 10; x < W; x += 48) ctx.fillRect(x, 380, 30, 48);
    // shop window with the street outside
    ctx.save(); ctx.beginPath(); ctx.roundRect(330, 140, 300, 170, [80, 80, 6, 6]); ctx.clip();
    const sg = ctx.createLinearGradient(0, 140, 0, 310); sg.addColorStop(0, '#5ac4ff'); sg.addColorStop(1, '#e8fbff'); ctx.fillStyle = sg; ctx.fillRect(330, 140, 300, 170);
    ctx.fillStyle = '#fff'; const cx = 330 + ((S.t * 10) % 360) - 30; ellipse(cx, 190, 30, 11); ellipse(cx + 18, 182, 20, 11);
    ctx.fillStyle = '#a8e690'; ellipse(400, 300, 120, 40); ellipse(580, 304, 110, 34);
    [[360, '#ffd1dc'], [430, '#fff1b8'], [520, '#c6e2ff'], [590, '#d6f5d6']].forEach(([x, c], i) => {
      inkRect(x - 26, 236 - i % 2 * 14, 52, 80, c, 2, 2);
      ctx.fillStyle = '#d0605a'; tri(x - 32, 238 - i % 2 * 14, x, 212 - i % 2 * 14, x + 32, 238 - i % 2 * 14);
      inkRect(x - 9, 252 - i % 2 * 14, 18, 16, '#bfe6ff', 1.5, 2);
    });
    ctx.restore();
    ctx.lineWidth = 10; ctx.strokeStyle = OL; ctx.beginPath(); ctx.roundRect(330, 140, 300, 170, [80, 80, 6, 6]); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = '#ff8fc8'; ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#ff8fc8'; line(480, 140, 480, 310); ctx.stroke(); line(330, 228, 630, 228); ctx.stroke();
    // window display: a rocking horse and a doll house on the sill
    inkRect(318, 304, 324, 14, '#f0a868', 2.5, 4);
    ctx.save(); ctx.translate(400, 300); ctx.rotate(Math.sin(S.t * 1.6) * 0.08);
    ctx.beginPath(); ctx.arc(0, -40, 46, 0.55, Math.PI - 0.55); inkStroke('#c98a4a', 6, 1.5);
    inkEllipse(0, -32, 24, 12, 0, '#fff', 1.5); inkRect(14, -58, 12, 26, '#fff', 1.5, 5); inkEllipse(26, -60, 13, 8, 0.3, '#fff', 1.5);
    ctx.fillStyle = '#ff6fb5'; for (let i = 0; i < 4; i++) circle(10 - i * 2, -62 + i * 7, 4.5);
    ctx.fillStyle = OL; circle(30, -62, 1.8); ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 3; for (const lx of [-14, 12]) { line(lx, -24, lx + (lx < 0 ? -6 : 6), -12); ctx.stroke(); }
    ctx.restore();
    emoji('🏠', 556, 278, 46); emoji('🪆', 508, 286, 30);
    // the shop sign
    inkRect(380, 112, 200, 28, '#ffd83a', 2.5, 12);
    text("TINKER'S TOYS", 480, 127, 17, '#a03a66', 'center', 800);
    // bookcases packed with toys
    tsBookcase(20, 210, 0); tsBookcase(730, 210, 7);
    // balloons tied to the bookcase corners
    balloon(248, 168, 16, '#ff5f7e', Math.sin(S.t) * 4); balloon(266, 186, 14, '#ffd83a', Math.sin(S.t + 1) * 4);
    balloon(712, 172, 16, '#9c6cff', Math.sin(S.t + 2) * 4); balloon(694, 190, 13, '#5adc7a', Math.sin(S.t + 3) * 4);
    tsMobile(282, 0, ['star', 'moon', 'cloud']);
    tsMobile(480, 2, ['✈️', 'heart', 'star']);
    tsMobile(680, 4, ['moon', 'star', '🎈']);
    tsTrain();
    // wooden floor and a rainbow rug
    const fg = ctx.createLinearGradient(0, 434, 0, H); fg.addColorStop(0, '#e2a464'); fg.addColorStop(1, '#c47e44');
    ctx.fillStyle = fg; ctx.fillRect(0, 434, W, H - 434);
    ctx.strokeStyle = 'rgba(120,70,40,.35)'; ctx.lineWidth = 2;
    for (let y = 452; y < H; y += 22) { line(0, y, W, y); ctx.stroke(); for (let x = (y * 7) % 140; x < W; x += 140) { line(x, y, x, y + 22); ctx.stroke(); } }
    inkRect(-4, 430, W + 8, 10, '#ff8fc8', 2, 0);
    RAIN.forEach((c, i) => { ctx.fillStyle = mix(c, '#ffffff', 0.25); ellipse(480, 506, 330 - i * 40, 32 - i * 4); });
    ctx.strokeStyle = 'rgba(91,63,115,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(480, 506, 330, 32, 0, 0, Math.PI * 2); ctx.stroke();
    // jack-in-the-box on the left, a spinning top and a block tower on the right
    inkRect(30, 434, 56, 50, '#9c6cff', 2.5, 4); star(58, 460, 10, '#ffd83a', 5);
    const pop = 0.6 + 0.4 * Math.abs(Math.sin(S.t * 1.4));
    ctx.strokeStyle = '#c0c8d8'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(58 + (i % 2 ? 8 : -8), 434 - i * 5 * pop); ctx.stroke();
    inkCircle(58, 434 - 46 * pop, 16, '#fff0dc', 1.5); ctx.fillStyle = '#ff5f7e'; circle(58, 434 - 44 * pop, 4);
    ctx.fillStyle = OL; circle(52, 434 - 49 * pop, 2); circle(64, 434 - 49 * pop, 2);
    ink(P2(`M${42},${434 - 54 * pop} L58,${434 - 82 * pop} L74,${434 - 54 * pop} Z`), '#40b0ff', 1.2);
    inkRect(36, 432, 8, 4, '#ffd83a', 1, 2);
    abcBlock(900, 470, 30, '#ff5f7e', 'A'); abcBlock(930, 470, 30, '#40b0ff', 'B'); abcBlock(915, 440, 30, '#5adc7a', 'C');
    ctx.save(); ctx.translate(860, 494); ctx.rotate(Math.sin(S.t * 3) * 0.1);
    ink(P2('M-22,-14 L22,-14 L0,14 Z'), '#ffd83a', 1.5);
    ctx.fillStyle = RAIN[Math.floor(S.t * 8) % 6]; ctx.fillRect(-14, -12, 28, 6);
    inkRect(-3, -26, 6, 12, '#ff5f7e', 1.5, 2); ctx.restore();
  };

  // ---- Claw Machine (action): steer the claw over the toy Tinker asks for, then drop it
  const CLAW_TOYS = [['🧸', 'teddy bear'], ['🦆', 'rubber duck'], ['🚂', 'train'], ['🪀', 'yo-yo'], ['🎲', 'dice'], ['🤖', 'robot'], ['🦖', 'dinosaur'], ['⚽', 'ball'], ['🐙', 'octopus'], ['🦄', 'unicorn'], ['🚀', 'rocket'], ['🐸', 'frog']];
  const CM = { x0: 150, gx0: 172, gx1: 788, top: 136, rest: 176, floor: 404, chute: 216, minX: 290, maxX: 770 };
  MG.clawmachine = {
    kind: 'action', title: () => 'Claw Machine', icon: () => '🕹️',
    how: () => "Grab the toy Tinker Bot asks for! Move the claw with the arrow keys or the mouse, then press SPACE or DROP. You can also just tap a toy.",
    init(g) {
      const n = [6, 7, 8][g.tier - 1], kinds = shuffle(CLAW_TOYS.map((_, i) => i));
      g.slotX = Array.from({ length: n }, (_, i) => lerp(CM.minX + 10, CM.maxX - 10, i / (n - 1)));
      g.toys = g.slotX.map((_, i) => ({ kind: kinds[i], slot: i, ph: rand(0, 6), pop: 1 }));
      g.spare = kinds.slice(n);
      Object.assign(g, { cx: 480, cy: CM.rest, open: 1, st: 'move', stT: 0, held: null, fall: null, tx: null, autoDrop: false,
        round: 0, rounds: [5, 6, 7][g.tier - 1], total: 0, tries: 0, timeLeft: 100 });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const t = pick(g.toys.filter(t => t.kind !== g.want));
      g.want = t.kind; g.tries = 0;
      g.say = `Grab the ${CLAW_TOYS[t.kind][1]}!`;
      if (g.phase === 'play') speak(g.say);
    },
    toyX(g, t) { return g.slotX[t.slot] + Math.sin(S.t * 1.7 + t.ph) * [4, 7, 10][g.tier - 1]; },
    drop(g) { g.st = 'down'; g.autoDrop = false; g.tx = null; g.tries++; tone(700, 0.5, 'triangle', 0.05, 0, 300); },
    update(g, dt, id) {
      g.timeLeft -= dt; g.stT += dt;
      const sp = 320;
      for (const t of g.toys) t.pop = Math.min(1, t.pop + dt * 3);
      if (g.st === 'move') {
        if (goLeft() || goRight()) { g.tx = null; g.autoDrop = false; g.cx += (goRight() ? 1 : -1) * sp * dt; }
        const inGlass = pointer.x > CM.gx0 && pointer.x < CM.gx1 && pointer.y > 120 && pointer.y < 432;
        if (pointerMoved(g) && inGlass && !g.autoDrop) g.tx = pointer.x;
        if (pointer.clicked && !id && inGlass) { g.tx = pointer.x; g.autoDrop = true; }
        if (id === 'cl:l' || id === 'cl:r') { g.tx = g.cx + (id === 'cl:l' ? -70 : 70); g.autoDrop = false; }
        if (g.tx != null) {
          g.tx = clamp(g.tx, CM.minX, CM.maxX);
          const d = g.tx - g.cx; g.cx += clamp(d, -sp * dt, sp * dt);
          if (Math.abs(d) < 1.5 && g.autoDrop) this.drop(g);
        }
        g.cx = clamp(g.cx, CM.minX, CM.maxX);
        if (g.st === 'move' && (id === 'drop' || pressed[' '] || pressed.arrowdown || pressed.s)) this.drop(g);
      } else if (g.st === 'down') {
        g.cy += 300 * dt;
        if (g.cy >= CM.floor - 44) { g.cy = CM.floor - 44; g.st = 'close'; g.stT = 0; }
      } else if (g.st === 'close') {
        g.open = Math.max(0, 1 - g.stT / 0.3);
        if (g.stT >= 0.38) {
          let best = null;
          for (const t of g.toys) { const d = Math.abs(this.toyX(g, t) - g.cx); if (d < 36 && (!best || d < best.d)) best = { t, d }; }
          if (best) {
            g.held = best.t; g.toys.splice(g.toys.indexOf(best.t), 1); SFX.pop();
            g.st = best.t.kind === g.want ? 'lift' : 'oops';
          } else {
            g.st = 'lift'; SFX.miss(); speak('Missed! Try again.'); floatText(g.cx, CM.floor - 80, 'Missed!', '#ffb0c4', false, 26);
          }
          g.stT = 0;
        }
      } else if (g.st === 'oops' || g.st === 'lift') {
        g.cy -= 240 * dt;
        if (g.st === 'oops' && g.cy <= CM.floor - 150) {
          // wrong toy: the claw lets go and it plops back into its spot
          g.fall = { t: g.held, x: g.cx, y: g.cy + 44, vy: 0 }; g.held = null; g.open = 1; g.st = 'lift'; SFX.miss();
          speak(`Oops! That's the ${CLAW_TOYS[g.fall.t.kind][1]}. ${g.say}`);
          floatText(g.cx, g.cy, 'Oops!', '#ffb0c4', false, 28);
        }
        if (g.cy <= CM.rest) {
          g.cy = CM.rest;
          if (g.held) g.st = 'carry'; else { g.st = 'move'; g.open = 1; }
        }
      } else if (g.st === 'carry') {
        g.cx += clamp(CM.chute - g.cx, -sp * dt, sp * dt);
        if (Math.abs(g.cx - CM.chute) < 1) { g.st = 'release'; g.stT = 0; }
      } else if (g.st === 'release') {
        g.open = Math.min(1, g.stT / 0.25);
        if (g.held && g.stT > 0.12) { g.fall = { t: g.held, x: g.cx, y: g.cy + 44, vy: 0, chute: true }; g.held = null; }
        if (g.stT > 0.4 && !g.fall) {
          g.st = g.round >= g.rounds ? 'end' : 'move'; g.stT = 0;
        }
      } else if (g.st === 'end' && g.stT > 1.2) g.done = true;
      // a dropped toy falling back to its spot, or down the prize chute
      if (g.fall) {
        const f = g.fall;
        f.vy += 1100 * dt; f.y += f.vy * dt;
        if (!f.chute) f.x = lerp(f.x, g.slotX[f.t.slot], Math.min(1, dt * 8));
        if (f.chute && f.y > 410) {
          g.fall = null;
          g.total += [1, 0.6, 0.35, 0.2][Math.min(g.tries - 1, 3)];
          SFX.hit(); burst(CM.chute, 350, 24); floatText(CM.chute + 40, 300, 'Got it!', '#fff6a8', false, 30);
          speak(pick(['You got it!', 'Great grab!', 'Yay! A prize!']));
          // a new toy tumbles into the empty spot
          const k = g.spare.shift(); g.spare.push(f.t.kind);
          g.toys.push({ kind: k, slot: f.t.slot, ph: rand(0, 6), pop: 0 });
          g.round++;
          if (g.round < g.rounds) this.next(g);
        } else if (!f.chute && f.y >= CM.floor - 6) { g.toys.push(f.t); f.t.pop = 0.6; g.fall = null; SFX.blip(); }
      }
      if (g.timeLeft <= 0) g.done = true;
      g.progress = `Toy ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    claw(x, y, open) {
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        const a = s * (0.25 + open * 0.55);
        ctx.beginPath(); ctx.moveTo(x, y);
        const ex = x + Math.sin(a) * 34, ey = y + Math.cos(a) * 30;
        ctx.lineTo(ex, ey); ctx.lineTo(ex - s * (10 - open * 4), ey + 16);
        inkStroke('#d8dce8', 6, 2);
      }
      inkRect(x - 14, y - 12, 28, 16, '#ff5f7e', 2, 6);
      inkCircle(x, y + 2, 7, '#ffd83a', 1.2);
    },
    draw(g) {
      // the cabinet
      inkRect(CM.x0 - 6, 70, 672, 466, '#ff6fb5', 3, 28);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(CM.x0 + 8, 76, 18, 452);
      inkRect(CM.x0 + 12, 78, 636, 52, '#ffd83a', 2.5, 20);
      for (let i = 0; i < 22; i++) { ctx.fillStyle = (i + Math.floor(S.t * 4)) % 2 ? '#fff6a8' : '#ff9a3a'; circle(CM.x0 + 26 + i * 29, 126, 4); }
      const want = CLAW_TOYS[g.want];
      text('Grab the', 400, 102, 24, '#a03a66', 'right', 800); emoji(want[0], 436, 102, 40); text(`${want[1]}!`, 466, 102, 24, '#a03a66', 'left', 800);
      // glass box
      const bg = ctx.createLinearGradient(0, CM.top, 0, 432); bg.addColorStop(0, '#d8c8ff'); bg.addColorStop(1, '#ffe0f0');
      rrect(CM.gx0, CM.top, CM.gx1 - CM.gx0, 296, 12, bg);
      for (let i = 0; i < 14; i++) star(CM.gx0 + 40 + (i * 97) % 580, 170 + (i * 53) % 160, 5, 'rgba(255,255,255,.7)', 4);
      // ball pit
      for (let i = 0; i < 46; i++) { const x = 266 + (i * 37) % 520, y = 412 + (i * 13) % 20; inkCircle(x, y, 11, RAIN[i % 6], 0.8); }
      // prize chute
      inkRect(CM.gx0 + 4, 320, 84, 112, '#9a6ae0', 2.5, 6);
      rrect(CM.gx0 + 12, 326, 68, 20, 8, '#3a2050');
      text('PRIZE', CM.chute, 372, 15, '#fff', 'center', 800); text('⬇', CM.chute, 396, 22, '#fff6a8', 'center', 800);
      // toys (wobbling), the falling toy, the claw and its rail
      for (const t of g.toys) {
        const x = this.toyX(g, t), s = 0.4 + 0.6 * easeOut(t.pop);
        ctx.save(); ctx.translate(x, CM.floor - 22); ctx.rotate(Math.sin(S.t * 3 + t.ph) * 0.12); ctx.scale(s, s); emoji(CLAW_TOYS[t.kind][0], 0, 0, 52); ctx.restore();
      }
      if (g.fall) emoji(CLAW_TOYS[g.fall.t.kind][0], g.fall.x, g.fall.y, 50);
      inkRect(CM.gx0 + 6, CM.top + 4, CM.gx1 - CM.gx0 - 12, 9, '#c0c8d8', 2, 4);
      inkRect(g.cx - 22, CM.top, 44, 18, '#8a94a8', 2, 5);
      ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 3; line(g.cx, CM.top + 16, g.cx, g.cy - 10); ctx.stroke();
      if (g.held) emoji(CLAW_TOYS[g.held.kind][0], g.cx, g.cy + 40, 50);
      this.claw(g.cx, g.cy, g.open);
      if (g.st === 'move') { ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; line(g.cx, g.cy + 40, g.cx, CM.floor - 46); ctx.stroke(); ctx.setLineDash([]); }
      // glass shine
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(620, CM.top); ctx.lineTo(680, CM.top); ctx.lineTo(560, 432); ctx.lineTo(500, 432); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.beginPath(); ctx.roundRect(CM.gx0, CM.top, CM.gx1 - CM.gx0, 296, 12); ctx.stroke();
      // controls
      const on = g.st === 'move';
      button('cl:l', 200, 452, 90, 62, '◀', { on, color: '#40b0ff', size: 30 });
      button('cl:r', 300, 452, 90, 62, '▶', { on, color: '#40b0ff', size: 30 });
      inkCircle(480, 488, 20, '#4a4058', 2); inkCircle(480 + clamp((g.tx ?? g.cx) - g.cx, -12, 12), 470, 12, '#ff5f7e', 2);
      button('drop', 570, 452, 190, 62, 'DROP', { on, color: '#ff5f6a', size: 26, icon: '⬇️' });
    },
  };

  // ---- Robot Code (learn): plan a list of arrow steps, press GO, and watch the robot follow it
  const RC_DIRS = { up: [0, -1, '⬆️', 'up'], down: [0, 1, '⬇️', 'down'], left: [-1, 0, '⬅️', 'left'], right: [1, 0, '➡️', 'right'] };
  const RC_TOYS = [['🧸', 'teddy bear'], ['⚽', 'ball'], ['🦆', 'rubber duck'], ['🎁', 'present'], ['🪀', 'yo-yo'], ['🦖', 'dinosaur']];
  function drawToyRobot(x, y, s, t, sad) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkCircle(-13, 18, 8, '#4a4058', 1.2); inkCircle(13, 18, 8, '#4a4058', 1.2);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; line(0, -32, 0, -44); ctx.stroke();
    inkCircle(0, -46, 5, (t % 1) < 0.5 ? '#ff5f7e' : '#ffd83a', 1);
    inkRect(-20, -8, 40, 26, '#ff8a3a', 2.5, 6);
    inkCircle(-8, 5, 4, '#ffd83a', 0.8); inkCircle(8, 5, 4, '#40b0ff', 0.8);
    inkRect(-17, -34, 34, 26, '#c8d4e8', 2.5, 7);
    rrect(-13, -29, 26, 13, 6, '#3a4a6a');
    ctx.fillStyle = '#7ff0ff';
    if (sad) { ctx.strokeStyle = '#7ff0ff'; ctx.lineWidth = 2; line(-9, -25, -3, -20); ctx.stroke(); line(-9, -20, -3, -25); ctx.stroke(); line(3, -25, 9, -20); ctx.stroke(); line(3, -20, 9, -25); ctx.stroke(); } else { circle(-6, -22, 3); circle(6, -22, 3); }
    ctx.restore();
  }
  MG.robotcode = {
    kind: 'learn', title: () => 'Robot Code', icon: () => '🤖',
    how: () => "Plan the robot's path! Tap the arrows to add steps, one square at a time. Then press GO and watch it drive to the toy.",
    init(g) {
      Object.assign(g, { n: g.tier === 1 ? 4 : 5, round: 0, rounds: [4, 5, 5][g.tier - 1], total: 0, prog: [], st: 'plan', stT: 0, maxProg: 10 });
      this.next(g);
    },
    start(g) { speak(g.say); },
    free(g, x, y) { return x >= 0 && y >= 0 && x < g.n && y < g.n && !g.blocks.some(([bx, by]) => bx === x && by === y); },
    solve(g) {
      const key = (x, y) => y * g.n + x, prev = { [key(g.sx, g.sy)]: null }, q = [[g.sx, g.sy]];
      while (q.length) {
        const [x, y] = q.shift();
        if (x === g.goal[0] && y === g.goal[1]) {
          const path = []; let k = key(x, y);
          while (prev[k]) { path.unshift(prev[k][1]); k = prev[k][0]; }
          return path;
        }
        for (const d in RC_DIRS) {
          const nx = x + RC_DIRS[d][0], ny = y + RC_DIRS[d][1];
          if (this.free(g, nx, ny) && !(key(nx, ny) in prev)) { prev[key(nx, ny)] = [key(x, y), d]; q.push([nx, ny]); }
        }
      }
      return null;
    },
    next(g) {
      const n = g.n, [lo, hi] = [[2, 3], [3, 5], [4, 6]][g.tier - 1];
      const nb = [g.round >= 2 ? 1 : 0, g.round >= 1 ? 2 : 1, 3 + (g.round >= 2 ? 1 : 0)][g.tier - 1];
      for (let guard = 0; guard < 500; guard++) {
        g.sx = randInt(0, n - 1); g.sy = randInt(0, n - 1); g.goal = [randInt(0, n - 1), randInt(0, n - 1)];
        const cells = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!(x === g.sx && y === g.sy) && !(x === g.goal[0] && y === g.goal[1])) cells.push([x, y]);
        g.blocks = shuffle(cells).slice(0, nb);
        const sol = this.solve(g);
        if (sol && sol.length >= lo + Math.min(1, g.round >> 1) && sol.length <= hi + (g.round >> 2)) { g.sol = sol; break; }
      }
      g.toy = pick(RC_TOYS);
      Object.assign(g, { prog: [], st: 'plan', tries: 0, rx: g.sx, ry: g.sy, step: 0, stT: 0 });
      g.say = `Help the robot get to the ${g.toy[1]}! Add arrows, then press GO.`;
      if (g.phase === 'play') speak(g.say);
    },
    fail(g, why) {
      g.tries++; g.st = 'fail'; g.stT = 0; SFX.miss();
      speak(g.tries >= 4 ? "Good try! Let's do a new one." : `${why} Fix the arrows and try again!`);
    },
    update(g, dt, id) {
      g.stT += dt;
      if (g.st === 'plan') {
        const add = id?.startsWith('rc:') ? id.slice(3) : pressed.arrowup ? 'up' : pressed.arrowdown ? 'down' : pressed.arrowleft ? 'left' : pressed.arrowright ? 'right' : null;
        if (add && RC_DIRS[add]) {
          if (g.prog.length < g.maxProg) { g.prog.push(add); tone(500 + g.prog.length * 60, 0.08, 'triangle', 0.07); } else SFX.miss();
        }
        if ((id === 'rc_undo' || pressed.backspace) && g.prog.length) { g.prog.pop(); SFX.blip(); }
        if (id === 'rc_clear') g.prog = [];
        if ((id === 'rc_go' || pressed.enter || pressed[' '] || pressed.g) && g.prog.length) { g.st = 'run'; g.step = 0; g.stT = 0; g.rx = g.sx; g.ry = g.sy; SFX.jump(); }
      } else if (g.st === 'run') {
        const STEP = 0.5, d = RC_DIRS[g.prog[g.step]], nx = g.rx + d[0], ny = g.ry + d[1];
        if (!this.free(g, nx, ny)) { g.bonk = [d[0], d[1]]; tone(150, 0.2, 'square', 0.06); this.fail(g, nx < 0 || ny < 0 || nx >= g.n || ny >= g.n ? 'Bonk! That way is off the mat.' : 'Bonk! A block is in the way.'); return this.tally(g); }
        if (g.stT >= STEP) {
          g.rx = nx; g.ry = ny; g.step++; g.stT = 0; tone(420 + g.step * 50, 0.07, 'square', 0.03);
          if (g.rx === g.goal[0] && g.ry === g.goal[1]) {
            g.total += [1, 0.7, 0.45, 0.25][g.tries]; g.st = 'yay'; g.stT = 0;
            SFX.hit(); const [px, py] = this.cell(g, g.rx, g.ry); burst(px, py, 24);
            speak(pick(['BEEP BOOP! You did it!', 'Great coding!', 'The robot found it!']));
          } else if (g.step >= g.prog.length) this.fail(g, `Almost! The robot stopped before the ${g.toy[1]}.`);
        }
      } else if (g.st === 'fail') {
        if (g.stT > 1.3) {
          g.bonk = null; g.rx = g.sx; g.ry = g.sy;
          if (g.tries >= 4) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); } else g.st = 'plan';
        }
      } else if (g.st === 'yay' && g.stT > 1.6) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      this.tally(g);
    },
    tally(g) { g.progress = `Puzzle ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`; g.score = g.total / g.rounds; },
    cell(g, x, y) { const c = 70, ox = 250 - g.n * c / 2, oy = 254 - g.n * c / 2; return [ox + x * c + c / 2, oy + y * c + c / 2]; },
    draw(g) {
      const c = 70;
      panel(56, 68, 388, 376, 22);
      for (let y = 0; y < g.n; y++) for (let x = 0; x < g.n; x++) {
        const [px, py] = this.cell(g, x, y);
        rrect(px - c / 2 + 3, py - c / 2 + 3, c - 6, c - 6, 10, (x + y) % 2 ? '#ffe3f1' : '#e3f3ff', 'rgba(91,63,115,.25)', 2);
      }
      // hint: after two misses the path shows as dots
      if (g.tries >= 2 && g.st !== 'yay') {
        let x = g.sx, y = g.sy;
        for (const d of g.sol) { x += RC_DIRS[d][0]; y += RC_DIRS[d][1]; const [px, py] = this.cell(g, x, y); ctx.fillStyle = 'rgba(255,190,60,.8)'; circle(px, py, 7); }
      }
      for (const [bx, by] of g.blocks) { const [px, py] = this.cell(g, bx, by); abcBlock(px - 13, py + 26, 26, RAIN[(bx + by) % 6], 'A'); abcBlock(px + 13, py + 26, 26, RAIN[(bx + by + 2) % 6], 'B'); abcBlock(px, py, 26, RAIN[(bx + by + 4) % 6], 'C'); }
      const [gx, gy] = this.cell(g, g.goal[0], g.goal[1]);
      ctx.fillStyle = 'rgba(255,240,140,.7)'; circle(gx, gy, 28 + Math.sin(S.t * 4) * 3);
      emoji(g.toy[0], gx, gy + Math.sin(S.t * 3) * 2, 44);
      // the start square and the robot
      const [sx, sy] = this.cell(g, g.sx, g.sy);
      ctx.strokeStyle = '#5adc7a'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.roundRect(sx - 30, sy - 30, 60, 60, 10); ctx.stroke(); ctx.setLineDash([]);
      let [rx, ry] = this.cell(g, g.rx, g.ry);
      if (g.st === 'run') {
        const d = RC_DIRS[g.prog[g.step]], k = smooth(g.stT / 0.5);
        if (d) { rx += d[0] * c * k; ry += d[1] * c * k; }
      }
      if (g.bonk && g.st === 'fail') { const k = Math.max(0, 1 - g.stT * 3); rx += g.bonk[0] * 16 * Math.sin(k * Math.PI); ry += g.bonk[1] * 16 * Math.sin(k * Math.PI); }
      drawToyRobot(rx, ry + 6 - (g.st === 'yay' ? Math.abs(Math.sin(g.stT * 10)) * 10 : 0), 0.95, S.t, g.st === 'fail');
      // the controls
      panel(462, 68, 438, 376, 22);
      text('Add steps for the robot:', 680, 96, 20, '#5a2a6e', 'center', 700);
      const plan = g.st === 'plan';
      button('rc:up', 640, 118, 80, 66, '', { on: plan, color: '#40b0ff' }); emoji('⬆️', 680, 151, 40);
      button('rc:left', 552, 194, 80, 66, '', { on: plan, color: '#40b0ff' }); emoji('⬅️', 592, 227, 40);
      button('rc:right', 728, 194, 80, 66, '', { on: plan, color: '#40b0ff' }); emoji('➡️', 768, 227, 40);
      button('rc:down', 640, 270, 80, 66, '', { on: plan, color: '#40b0ff' }); emoji('⬇️', 680, 303, 40);
      drawToyRobot(680, 236, 0.55, S.t, false);
      button('rc_go', 484, 360, 190, 64, 'GO!', { on: plan && g.prog.length > 0, color: '#3fbf6a', size: 28, icon: '▶️' });
      button('rc_undo', 688, 360, 96, 64, '', { on: plan && g.prog.length > 0, color: '#ff9a3a', icon: '↩️' }); text('Undo', 748, 392, 15, '#fff', 'center', 700);
      button('rc_clear', 796, 360, 90, 64, '', { on: plan && g.prog.length > 0, color: '#ff6fb5', icon: '🗑️' }); text('Clear', 854, 392, 15, '#fff', 'center', 700);
      // the program strip
      darkPanel(56, 452, 844, 76, 20);
      for (let i = 0; i < g.maxProg; i++) {
        const x = 74 + i * 66, cur = g.st === 'run' && i === g.step;
        rrect(x, 463, 56, 54, 12, cur ? '#ffd83a' : i < g.prog.length ? '#fff4fb' : 'rgba(255,255,255,.15)', cur ? '#fff' : null, 3);
        if (i < g.prog.length) emoji(RC_DIRS[g.prog[i]][2], x + 28, 490, 34);
      }
      if (!g.prog.length) text('Your steps go here', 74 + 5 * 66 - 5, 490, 18, 'rgba(255,255,255,.7)', 'center', 600);
      if (g.st === 'yay') outlined('BEEP BOOP!', 250, 254, 44, '#fff6a8');
    },
  };

  restage('toyshop', {
    bg: 'toyshop_bg',
    games: [['clawmachine', 'crystal', {}], ['robotcode', 'ribbon', {}]],
    intro: ['*:Toys are stacked all the way to the ceiling, and a little train toots along the top shelf.',
      'N:BEEP BOOP. Welcome. To. Tinker\'s. Toy. Shop.',
      'N:Customers. Want. Toys. From. My. Claw. Machine. Please. Grab. The. Right. One.',
      "A:excited:Ooh, I LOVE claw machines!"],
    mid: ['N:BEEP. Excellent. Grabbing. Now. My. Toy. Robot. Is. Lost. On. The. Play. Mat.',
      'N:It. Only. Understands. Arrows. Plan. Every. Step. Then. Press. GO.',
      'A:thinking:Like giving it directions, one square at a time!'],
    outro: ['N:PROGRAM. COMPLETE. You. Are. A. Real. Coder. BOOP.',
      'N:Take. Glass. Crystals. And. Ribbons.',
      'A:laughing:Thank. You. Tinker. Bot!'],
  });

  // ======================================================================== CARNIVAL
  function cvFerris(cx, cy, r) {
    // legs
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) { line(cx, cy, cx + s * r * 0.62, 424); inkStroke('#9c6cff', 8, 2); }
    line(cx - r * 0.42, 340, cx + r * 0.42, 340); inkStroke('#9c6cff', 6, 2);
    const a0 = S.t * 0.25, n = 8;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); inkStroke('#ffffff', 7, 2);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < n; i++) { const a = a0 + i / n * Math.PI * 2; line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
    for (let i = 0; i < 24; i++) { const a = a0 + i / 24 * Math.PI * 2; ctx.fillStyle = (i + Math.floor(S.t * 3)) % 3 ? '#fff6a8' : '#ff8fc8'; circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3.2); }
    inkCircle(cx, cy, 12, '#ffd83a', 2);
    for (let i = 0; i < n; i++) {
      const a = a0 + i / n * Math.PI * 2, gx = cx + Math.cos(a) * r, gy = cy + Math.sin(a) * r, sw = Math.sin(S.t * 2 + i) * 0.08;
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(sw);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; line(0, 0, 0, 10); ctx.stroke();
      ink(P2('M-17,10 L17,10 L14,32 Q0,38 -14,32 Z'), RAIN[i % 6], 1.2);
      ink(P2('M-20,10 Q0,-2 20,10 Z'), mix(RAIN[(i + 3) % 6], '#ffffff', 0.3), 1);
      ctx.restore();
    }
  }
  function cvTent(cx) {
    const base = 424, wTop = 150, wBot = 180, roofY = 290, apex = 132;
    // walls with candy stripes
    ctx.save();
    const wall = P2(`M${cx - wBot},${base} L${cx - wTop},${roofY} L${cx + wTop},${roofY} L${cx + wBot},${base} Z`);
    ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.stroke(wall); ctx.clip(wall);
    for (let i = -10; i < 10; i++) { ctx.fillStyle = i % 2 ? '#ff4f6a' : '#fff4f4'; ctx.beginPath(); ctx.moveTo(cx + i * 30, roofY); ctx.lineTo(cx + i * 30 + 30, roofY); ctx.lineTo(cx + i * 36 + 36, base); ctx.lineTo(cx + i * 36, base); ctx.fill(); }
    ctx.restore();
    // doorway
    ink(P2(`M${cx - 44},${base} L${cx - 44},${base - 70} Q${cx},${base - 112} ${cx + 44},${base - 70} L${cx + 44},${base} Z`), '#5a2a6e', 1.5);
    ink(P2(`M${cx - 44},${base - 70} Q${cx - 30},${base - 40} ${cx - 54},${base} L${cx - 44},${base} Z`), '#ffd83a', 1);
    ink(P2(`M${cx + 44},${base - 70} Q${cx + 30},${base - 40} ${cx + 54},${base} L${cx + 44},${base} Z`), '#ffd83a', 1);
    ctx.fillStyle = 'rgba(255,230,140,.35)'; ellipse(cx, base - 30, 30, 40);
    // roof
    const roof = P2(`M${cx},${apex} Q${cx - 60},${roofY - 70} ${cx - wTop - 22},${roofY} L${cx + wTop + 22},${roofY} Q${cx + 60},${roofY - 70} ${cx},${apex} Z`);
    ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.stroke(roof); ctx.clip(roof);
    for (let i = -6; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ff4f6a' : '#fff4f4'; ctx.beginPath(); ctx.moveTo(cx, apex); ctx.lineTo(cx + i * 30, roofY + 4); ctx.lineTo(cx + i * 30 + 30, roofY + 4); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 11; i++) { const x = cx - wTop - 22 + i * (wTop * 2 + 44) / 10; inkCircle(x, roofY + 4, 10, i % 2 ? '#ffd83a' : '#40b0ff', 1.2); }
    ctx.fillStyle = '#ffd83a'; ctx.fillRect(cx - wTop - 22, roofY - 4, wTop * 2 + 44, 8);
    // the flag on top
    ctx.strokeStyle = OL; ctx.lineWidth = 3; line(cx, apex, cx, apex - 36); ctx.stroke();
    const wv = Math.sin(S.t * 5) * 4;
    ink(P2(`M${cx},${apex - 36} Q${cx + 14},${apex - 40 + wv} ${cx + 30},${apex - 32} Q${cx + 14},${apex - 26 - wv} ${cx},${apex - 22} Z`), '#ffd83a', 1.2);
    panelSign(cx, roofY + 34, '★ BIG TOP ★');
  }
  function cvCarousel(cx) {
    const base = 424, top = 268;
    ink(P2(`M${cx - 120},${base} L${cx - 110},${base - 22} L${cx + 110},${base - 22} L${cx + 120},${base} Z`), '#9c6cff', 1.5);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = (i + Math.floor(S.t * 4)) % 2 ? '#fff6a8' : '#ffb3e0'; circle(cx - 100 + i * 25, base - 11, 3.5); }
    // poles with bobbing horses
    for (let i = 0; i < 4; i++) {
      const px = cx - 78 + i * 52, bob = Math.sin(S.t * 2.5 + i * 1.6) * 14;
      ctx.strokeStyle = OL; ctx.lineWidth = 6; line(px, top + 20, px, base - 22); ctx.stroke(); ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(px, 360 + bob);
      const c = ['#ffffff', '#ffd1e8', '#d8f0ff', '#fff1b8'][i];
      inkEllipse(0, 0, 22, 12, 0, c, 1.3);
      inkRect(12, -24, 10, 22, c, 1.5, 4); inkEllipse(22, -24, 11, 7, 0.3, c, 1.3);
      ctx.fillStyle = RAIN[i]; for (let k = 0; k < 3; k++) circle(10 - k * 2, -26 + k * 7, 4);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; for (const lx of [-14, 12]) { line(lx, 8, lx + (lx < 0 ? -8 : 8), 22); ctx.stroke(); }
      ctx.fillStyle = OL; circle(25, -26, 1.6);
      inkRect(-8, -10, 16, 6, RAIN[(i + 3) % 6], 1, 2);
      ctx.restore();
    }
    // the canopy
    ink(P2(`M${cx},${top - 60} L${cx + 130},${top} L${cx - 130},${top} Z`), '#ff8fc8', 1.5);
    ctx.save(); ctx.clip(P2(`M${cx},${top - 60} L${cx + 130},${top} L${cx - 130},${top} Z`));
    for (let i = -4; i < 4; i += 2) { ctx.fillStyle = '#fff4fb'; ctx.beginPath(); ctx.moveTo(cx, top - 60); ctx.lineTo(cx + i * 33, top); ctx.lineTo(cx + i * 33 + 33, top); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 8; i++) { const x = cx - 130 + i * 260 / 7; ink(P2(`M${x - 17},${top} Q${x},${top + 24} ${x + 17},${top} Z`), i % 2 ? '#ffd83a' : '#40b0ff', 1); }
    inkRect(cx - 130, top - 4, 260, 10, '#ffd83a', 2, 3);
    inkCircle(cx, top - 62, 8, '#ffd83a', 1.5);
  }
  function cvBooth(x, w, awn, label, prizes) {
    inkRect(x, 330, w, 94, '#fff4e0', 2.5, 4);
    inkRect(x + 6, 380, w - 12, 12, '#c98a4a', 2, 3);
    prizes.forEach((p, i) => emoji(p, x + 22 + i * (w - 44) / (prizes.length - 1), 362 + Math.sin(S.t * 2 + i) * 2, 26));
    ctx.save(); ctx.beginPath(); ctx.rect(x - 10, 300, w + 20, 34); ctx.clip();
    for (let i = 0; i * 24 < w + 20; i++) { ctx.fillStyle = i % 2 ? awn : '#ffffff'; ctx.fillRect(x - 10 + i * 24, 300, 24, 34); }
    ctx.restore();
    for (let i = 0; i * 24 < w + 20; i++) { ctx.fillStyle = i % 2 ? awn : '#ffffff'; ctx.beginPath(); ctx.arc(x + 2 + i * 24, 334, 12, 0, Math.PI); ctx.fill(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.strokeRect(x - 10, 300, w + 20, 34);
    panelSign(x + w / 2, 290, label);
  }
  function cvLights(pts) {
    ctx.strokeStyle = '#5a4a6a'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < pts.length - 1; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 34, x2, y2); }
    ctx.stroke();
    let n = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], my = Math.max(y1, y2) + 34;
      for (let k = 0.08; k < 1; k += 0.12) {
        const x = (1 - k) * (1 - k) * x1 + 2 * k * (1 - k) * (x1 + x2) / 2 + k * k * x2, y = (1 - k) * (1 - k) * y1 + 2 * k * (1 - k) * my + k * k * y2;
        const c = RAIN[n % 6], on = 0.55 + 0.45 * Math.sin(S.t * 4 + n * 1.7); n++;
        ctx.fillStyle = c; ctx.globalAlpha = 0.25 * on; circle(x, y + 5, 9); ctx.globalAlpha = 1;
        inkEllipse(x, y + 5, 4, 5.5, 0, mix(c, '#ffffff', 0.5 * on), 0.8);
      }
    }
  }
  BACKDROPS.carnival_bg = () => {
    bdSky('#4fb4ff', '#ffe2f0');
    bdSunburst(880, 96);
    bdClouds(3, 'rgba(255,255,255,.85)', 80);
    bdHills('#b4e89a', 350, 18, 0.006);
    for (let i = 0; i < 12; i++) { const x = (i * 87 + 30) % W; ctx.fillStyle = '#8fd47a'; ellipse(x, 352 - (i % 3) * 6, 26, 16); }
    cvFerris(170, 214, 118);
    cvBooth(30, 120, '#40b0ff', 'PRIZES', ['🧸', '🦄', '🐻']);
    cvTent(480);
    cvCarousel(800);
    cvBooth(620, 70, '#5adc7a', 'POPCORN', ['🍿', '🍿']);
    cvLights([[0, 116], [170, 96], [480, 132], [800, 205], [960, 160]]);
    // floating balloons
    balloon(320, 170 + Math.sin(S.t * 1.2) * 6, 15, '#ff5f7e', Math.sin(S.t) * 5);
    balloon(650, 150 + Math.sin(S.t * 1.4 + 1) * 6, 13, '#ffd83a', Math.sin(S.t + 1) * 5);
    balloon(925, 300 + Math.sin(S.t * 1.1 + 2) * 6, 14, '#9c6cff', Math.sin(S.t + 2) * 5);
    // the fairground: grass, a sandy midway and scattered confetti and popcorn
    ctx.fillStyle = '#78cc62'; ctx.fillRect(0, 422, W, H - 422);
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; line(0, 422, W, 422); ctx.stroke();
    ctx.fillStyle = '#f2d9a0'; ctx.beginPath(); ctx.moveTo(0, 470); ctx.quadraticCurveTo(480, 430, W, 470); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#e6c888'; for (let i = 0; i < 30; i++) ellipse((i * 131) % W, 480 + (i * 29) % 56, 6, 2.5);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = RAIN[i % 6]; ctx.save(); ctx.translate((i * 97 + 11) % W, 436 + (i * 41) % 100); ctx.rotate(i); ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); }
    for (const [x, y] of [[120, 500], [140, 512], [870, 520], [610, 530]]) inkCircle(x, y, 4, '#fff8e0', 0.8);
    // rope posts at the edges
    for (const x of [16, 944]) { inkRect(x - 5, 410, 10, 50, '#ffd83a', 2, 3); inkCircle(x, 408, 7, '#ff5f7e', 1.2); }
    for (let i = 0; i < 8; i++) { ctx.fillStyle = RAIN[i % 6]; tri(40 + i * 16, 426, 52 + i * 16, 426, 46 + i * 16, 440); }
  };

  // ---- Juggling (action): click a falling ball to bounce it back up; 1, then 2, then 3 balls
  const JG_COLS = [['#ff5f7e', '#ffd83a'], ['#40b0ff', '#ffffff'], ['#5adc7a', '#ff9a3a']];
  MG.juggleballs = {
    kind: 'action', title: () => 'Juggling', icon: () => '🤹',
    how: () => 'Keep the balls in the air! Tap a ball as it falls to bounce it back up. First one ball, then two, then three! Space bounces the lowest ball too.',
    init(g) {
      const need = [[4, 6, 8], [5, 7, 9], [5, 8, 10]][g.tier - 1];
      Object.assign(g, { need, N: need.reduce((a, b) => a + b, 0), stage: 0, stageB: 0, bounces: 0, drops: 0, balls: [], G: [210, 245, 280][g.tier - 1], timeLeft: 70, endT: 0, cheer: 0 });
      this.addBall(g);
    },
    start(g) { g.say = 'Tap the ball when it falls!'; speak(g.say); },
    addBall(g) { const i = g.balls.length; g.balls.push({ x: [480, 360, 600][i], y: 70, vx: 0, vy: 30, col: JG_COLS[i], back: 0, spin: 0, glow: 0 }); },
    bounce(g, b) {
      const peak = rand(110, 160), tx = rand(320, 640);
      b.vy = -Math.sqrt(2 * g.G * Math.max(80, b.y - peak));
      b.vx = (tx - b.x) / (2 * -b.vy / g.G);
      b.glow = 1;
      g.bounces++; g.stageB++;
      tone(520 + g.stageB * 40, 0.12, 'triangle', 0.08); SFX.pop();
      burst(b.x, b.y, 8, { spread: 80, up: 30 });
      if (g.stageB >= g.need[g.stage]) {
        g.stage++; g.stageB = 0;
        if (g.stage < 3) {
          this.addBall(g); SFX.sparkle();
          const msg = ['', 'Two balls now!', 'Three balls! Wow!'][g.stage];
          floatText(W / 2, 160, msg, '#fff6a8', false, 34); speak(msg);
        } else { g.endT = 1; speak('Ta-da! You are a juggler!'); burst(W / 2, 200, 40); }
      }
    },
    update(g, dt) {
      g.timeLeft -= dt;
      if (g.endT > 0) { g.endT -= dt * 0.8; if (g.endT <= 0) g.done = true; }
      for (const b of g.balls) {
        b.glow = Math.max(0, b.glow - dt * 3);
        if (b.back > 0) { b.back -= dt; if (b.back <= 0) Object.assign(b, { x: rand(360, 600), y: 70, vx: 0, vy: 30 }); continue; }
        b.vy += g.G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += b.vx * dt * 0.03 + dt;
        if (b.x < 60 || b.x > 900) { b.vx *= -1; b.x = clamp(b.x, 60, 900); }
        if (b.y > GY + 20 && g.endT <= 0) {
          b.back = 1.1; g.drops++; SFX.miss(); floatText(b.x, GY - 30, 'Oops!', '#ffb0c4', false, 26);
          if (g.drops === 1 || g.drops % 3 === 0) speak('Oops! Catch it next time.');
        }
      }
      if (g.endT <= 0) {
        const live = g.balls.filter(b => b.back <= 0 && b.vy > 0);
        let hit = null;
        if (pointer.clicked) for (const b of live) { const d = Math.hypot(pointer.x - b.x, pointer.y - b.y); if (d < 64 && (!hit || d < hit.d)) hit = { b, d }; }
        if (hit) this.bounce(g, hit.b);
        else if (pressed[' '] || pressed.arrowup) { const low = live.filter(b => b.y > 300).sort((a, b) => b.y - a.y)[0]; if (low) this.bounce(g, low); }
      }
      if (g.timeLeft <= 0) g.done = true;
      const nb = Math.min(3, g.stage + 1);
      g.progress = g.stage >= 3 ? 'All done!' : `${nb} ball${nb > 1 ? 's' : ''}: ${g.stageB} / ${g.need[g.stage]}`;
      g.score = (g.bounces / g.N) * Math.max(0.5, 1 - g.drops * 0.06);
    },
    draw(g) {
      // spotlight and a little stage
      const sl = ctx.createRadialGradient(480, 300, 40, 480, 300, 380);
      sl.addColorStop(0, 'rgba(255,250,220,.55)'); sl.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = sl; ctx.fillRect(0, 60, W, H);
      ink(P2('M250,470 L710,470 L740,520 L220,520 Z'), '#ff5f7e', 1.5);
      ctx.fillStyle = '#ffd83a'; ctx.fillRect(232, 470, 496, 8);
      for (let i = 0; i < 8; i++) star(270 + i * 60, 500, 8, '#fff6a8', 5);
      drawAubrey(480, GY + 6, g.endT > 0 ? 'twirl' : 'idle_front', 1, 0, 0.7);
      for (const b of g.balls) {
        if (b.back > 0) continue;
        // shadow on the stage helps line up the next tap
        const h = clamp((GY - b.y) / 400, 0, 1);
        ctx.fillStyle = `rgba(60,20,80,${0.25 - h * 0.15})`; ellipse(b.x, 478, 30 - h * 14, 6 - h * 3);
        if (b.vy > 0 && b.y > 250) { ctx.strokeStyle = `rgba(255,246,168,${0.5 + 0.4 * Math.sin(S.t * 10)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, 40, 0, Math.PI * 2); ctx.stroke(); }
        if (b.glow > 0) { ctx.fillStyle = `rgba(255,255,255,${b.glow * 0.6})`; circle(b.x, b.y, 30 + (1 - b.glow) * 20); }
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin);
        inkCircle(0, 0, 28, b.col[0], 2);
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = b.col[1]; ctx.fillRect(-30, -7, 60, 14);
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(-9, -10, 6);
        ctx.restore();
      }
      if (g.endT > 0) outlined('Ta-da!', W / 2, 200, 56, '#fff6a8');
    },
  };

  // ---- Line Up! (learn): ordinal numbers with a queue of animals waiting for the carousel
  const LINE_ANIMALS = [['🐕', 'dog'], ['🐈', 'cat'], ['🐖', 'pig'], ['🐄', 'cow'], ['🐸', 'frog'], ['🐇', 'bunny'], ['🦊', 'fox'], ['🐼', 'panda'], ['🐒', 'monkey'], ['🐓', 'chicken'], ['🐘', 'elephant'], ['🦒', 'giraffe'], ['🐧', 'penguin'], ['🦁', 'lion'], ['🐢', 'turtle'], ['🦆', 'duck']];
  MG.lineupordinals = {
    kind: 'learn', title: () => 'Line Up!', icon: () => '🎟️',
    how: () => 'The animals are lining up for the carousel. The front of the line is by the flag! Listen, then tap the right animal or the right place.',
    init(g) { Object.assign(g, { n: [5, 6, 8][g.tier - 1], round: 0, rounds: [6, 7, 8][g.tier - 1], total: 0, shake: {}, last: -1 }); this.next(g); },
    start(g) { speak(g.say); },
    next(g) {
      g.line = shuffle(LINE_ANIMALS).slice(0, g.n);
      g.q = g.round % 2 ? 'place' : 'tap';
      let a; do { a = randInt(0, g.n - 1); } while (a === g.last || (a === 0 && Math.random() < 0.6));
      g.ans = g.last = a;
      if (g.q === 'place') {
        const lo = clamp(a - randInt(0, 2), 0, g.n - 3);
        g.choices = [lo, lo + 1, lo + 2];
      }
      const name = g.line[a][1];
      g.say = g.q === 'tap' ? pick([`Who is ${ORD[a]} in line? Tap them!`, `Tap the ${ORD[a]} animal in line!`]) : `The ${name} is waiting. Which place in line is the ${name}?`;
      Object.assign(g, { tries: 0, st: 'pick', stT: 0, countTo: -1, countT: 0, picked: -1 });
      if (g.phase === 'play') speak(g.say);
    },
    lx(g, i) { return 190 + i * Math.min(104, 690 / (g.n - 1)); },
    answer(g, ok, wrongIdx) {
      if (ok) {
        g.total += triesScore(g.tries); g.st = 'yay'; g.stT = 0; SFX.hit();
        burst(this.lx(g, g.ans), 320, 22);
        speak(`Yes! The ${g.line[g.ans][1]} is ${ORD[g.ans]}!`);
      } else {
        g.tries++; SFX.miss(); g.shake[wrongIdx] = 0.45;
        g.countTo = Math.max(g.ans, g.q === 'tap' ? wrongIdx : 0); g.countT = 0;
        if (g.tries >= 3) { g.st = 'yay'; g.stT = -1; g.countTo = g.ans; speak(`The ${g.line[g.ans][1]} is ${ORD[g.ans]}. Count from the flag: ${ORD.slice(0, g.ans + 1).join(', ')}!`); return; }
        speak(g.q === 'tap' ? `That one is ${ORD[wrongIdx]}. Count from the flag: ${ORD.slice(0, g.ans + 1).join(', ')}!` : `Not ${ORD[wrongIdx]}. Count from the flag and try again!`);
      }
    },
    update(g, dt, id) {
      g.stT += dt; g.countT += dt;
      for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
      if (g.st === 'pick') {
        if (g.q === 'tap') {
          let i = numKey(g.n);
          if (pointer.clicked && pointer.y > 230 && pointer.y < 420) {
            const sp = this.lx(g, 1) - this.lx(g, 0);
            i = g.line.findIndex((_, k) => Math.abs(pointer.x - this.lx(g, k)) < sp / 2);
          }
          if (i >= 0) this.answer(g, i === g.ans, i);
        } else {
          const k = id?.startsWith('lu:') ? +id.slice(3) : numKey(3);
          if (k >= 0) { const o = g.choices[k]; if (o === g.ans) this.answer(g, true); else { g.picked = o; this.answer(g, false, o); } }
        }
      } else if (g.st === 'yay' && g.stT > 1.8) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      g.progress = `Question ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      const a = g.line[g.ans];
      panel(W / 2 - 330, 66, 660, 64, 22);
      if (g.q === 'tap') {
        text(`Who is`, 408, 98, 30, '#5a2a6e', 'right', 700); outlined(ORD[g.ans], 480, 98, 36, '#ff9a3a', 'center'); text('in line?', 552, 98, 30, '#5a2a6e', 'left', 700);
      } else {
        text('Which place is the', 520, 98, 28, '#5a2a6e', 'right', 700); emoji(a[0], 560, 96, 44); text('?', 590, 98, 30, '#5a2a6e', 'left', 700);
      }
      rrect(40, 236, 880, 214, 30, 'rgba(255,250,255,.6)');
      // the ride gate and the front-of-line flag
      inkRect(78, 200, 16, 220, '#ffd83a', 2, 4);
      const wv = Math.sin(S.t * 4) * 4;
      ink(P2(`M94,204 Q120,${200 + wv} 146,210 Q120,${222 - wv} 94,228 Z`), '#ff5f7e', 1.2);
      rrect(52, 426, 68, 24, 12, 'rgba(48,24,72,.7)');
      text('FRONT', 86, 438, 15, '#fff', 'center', 800);
      // the red carpet with rope
      ink(P2('M110,392 L900,392 L920,420 L100,420 Z'), '#ff6a8a', 1.5);
      for (let i = 0; i < g.n; i++) {
        const x = this.lx(g, i), sh = g.shake[i] ? Math.sin(g.shake[i] * 50) * 6 : 0;
        const right = g.st === 'yay' && i === g.ans, hop = right ? Math.abs(Math.sin(g.stT * 9)) * 26 : 0;
        const asked = g.q === 'place' && i === g.ans;
        if (asked || right) { ctx.fillStyle = 'rgba(255,246,168,.75)'; ellipse(x, 360, 46, 54); }
        if (asked && g.st === 'pick') emoji('👇', x, 262 + Math.sin(S.t * 5) * 5, 34);
        ctx.fillStyle = 'rgba(60,20,80,.2)'; ellipse(x, 398, 34, 7);
        emoji(g.line[i][0], x + sh, 352 - hop + Math.sin(S.t * 2 + i) * 2, 76);
        // place tags: always on easy, otherwise counted out after a miss, and all shown on a win
        const counted = g.countTo >= 0 && i <= Math.min(g.countTo, Math.floor(g.countT / 0.45));
        if (g.tier === 1 || counted || g.st === 'yay') {
          inkCircle(x, 412, 17, i === g.ans && (g.st === 'yay' || counted) ? '#ffd83a' : '#fff4fb', 1.2);
          text(ORD_S[i], x, 412, 14, '#5a2a6e', 'center', 800);
        }
      }
      if (g.q === 'place') {
        g.choices.forEach((o, k) => {
          const x = W / 2 - 300 + k * 210, used = g.picked === o && g.st === 'pick' && g.tries > 0;
          button(`lu:${k}`, x, 448, 180, 70, ORD_S[o], { on: g.st === 'pick', color: used ? '#c9bcd4' : ['#ff6fb5', '#4fa8e0', '#9a6ae0'][k], size: 30, key: String(k + 1) });
        });
      } else if (g.st === 'pick') { darkPanel(W / 2 - 200, 456, 400, 44, 22); text('Tap an animal in the line', W / 2, 478, 18, '#fff', 'center', 600); }
      if (g.st === 'yay') outlined(`${ORD[g.ans][0].toUpperCase()}${ORD[g.ans].slice(1)}!`, W / 2, 200, 48, '#fff6a8');
    },
  };

  restage('carnival', {
    bg: 'carnival_bg',
    games: [['juggleballs', 'ribbon', {}], ['lineupordinals', 'crystal', {}]],
    intro: ['*:Music, twinkly lights and the smell of popcorn! A carnival has come to town.',
      'N:Step right up! Oh, my juggler has the hiccups — and the show starts NOW!',
      'N:Can you keep the balls in the air? Tap each one as it falls!',
      'A:determined:One ball? Two? THREE? I can do it!'],
    mid: ['N:Bravo! What a show! Now everyone wants a ride on the carousel...',
      'N:...but the animals keep asking who goes first! Help me sort out the line.',
      'A:happy:First, second, third — I know my places!'],
    outro: ['N:A winner! Choose your prize — a ribbon and a crystal for the star of the carnival!',
      'A:excited:This is the best day EVER!'],
  });

  // ======================================================================== WATERFALL
  function wfVine(x, y0, len, ph) {
    const sw = Math.sin(S.t * 1.2 + ph) * 6;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.bezierCurveTo(x + 10, y0 + len * 0.3, x - 10 + sw, y0 + len * 0.7, x + sw, y0 + len);
    ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 3; ctx.stroke();
    for (let k = 0.15; k < 1; k += 0.14) {
      const t = k, lx = x + sw * t * t + Math.sin(t * 6) * 4, ly = y0 + len * t, s = (k * 100) % 2 < 1 ? 1 : -1;
      inkEllipse(lx + s * 6, ly, 7, 4, s * 0.6, '#5fc04a', 0.8);
      if ((k * 100 | 0) % 3 === 0) flower(lx - s * 5, ly + 3, 5, ['#ff8fc8', '#fff', '#c6a2ff'][(k * 10 | 0) % 3], '#ffd84a', 0.8);
    }
  }
  function wfCliff(pts, col, dark) {
    const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) p.lineTo(x, y); p.closePath();
    ctx.lineJoin = 'round'; ink(p, col, 1.5);
    ctx.save(); ctx.clip(p);
    ctx.strokeStyle = dark; ctx.lineWidth = 3;
    for (let y = 90; y < 460; y += 34) { ctx.beginPath(); for (let x = -10; x < W; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.05 + y) * 6); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 20; i++) ellipse((i * 149) % W, 100 + (i * 67) % 340, 18, 7);
    ctx.restore();
  }
  BACKDROPS.waterfall_bg = () => {
    bdSky('#62c8ff', '#eafbff');
    bdClouds(3, 'rgba(255,255,255,.9)', 76);
    ctx.fillStyle = '#a8bfe8'; ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(160, 170); ctx.lineTo(260, 240); ctx.lineTo(480, 120); ctx.lineTo(700, 230); ctx.lineTo(820, 160); ctx.lineTo(W, 280); ctx.lineTo(W, 400); ctx.lineTo(0, 400); ctx.fill();
    ctx.fillStyle = '#ffffff'; tri(480, 120, 446, 150, 514, 150); tri(160, 170, 136, 190, 184, 190); tri(820, 160, 798, 178, 842, 178);
    // the falling water, upper and lower drops with a pool on the ledge between
    const fall = (x0, x1, y0, y1, sp) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#9fe4ff'); g.addColorStop(0.5, '#ecfbff'); g.addColorStop(1, '#8adcff');
      ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
      for (let i = 0; i < 26; i++) { const x = x0 + 6 + (i * 37) % (x1 - x0 - 12), y = y0 + ((S.t * sp + i * 61) % (y1 - y0 + 60)) - 40; line(x, y, x, y + 28 + (i % 3) * 10); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(80,170,230,.35)'; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const x = x0 + 10 + (i * 53) % (x1 - x0 - 20), y = y0 + ((S.t * sp * 0.8 + i * 89) % (y1 - y0 + 40)) - 20; line(x, y, x, y + 40); ctx.stroke(); }
      ctx.restore();
    };
    fall(392, 568, 72, 242, 260);
    fall(376, 584, 252, 400, 300);
    // cliffs either side, the upper lip and the middle ledge
    wfCliff([[-10, 90], [80, 66], [200, 80], [330, 64], [400, 70], [394, 250], [376, 262], [380, 420], [-10, 430]], '#b48a74', 'rgba(110,70,60,.35)');
    wfCliff([[970, 96], [880, 68], [760, 82], [630, 62], [562, 70], [566, 248], [584, 262], [586, 420], [970, 430]], '#a9837a', 'rgba(110,70,60,.35)');
    inkEllipse(480, 248, 120, 14, 0, '#8adcff', 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 5; i++) ellipse(400 + i * 40 + Math.sin(S.t * 3 + i) * 4, 248, 14, 3);
    // grassy cliff tops with bushes and a tree
    ctx.fillStyle = '#6fcf5a';
    for (const [x0, x1] of [[-10, 400], [562, 970]]) { ctx.beginPath(); ctx.moveTo(x0, 92); for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, 76 + Math.sin(x * 0.07) * 6 + (x < 400 ? Math.sin(x * 0.02) * 6 : 0)); ctx.lineTo(x1, 96); ctx.fill(); }
    drawTree(60, 90, 76, 30, 0, 0); drawTree(900, 92, 70, 28, 1, 0);
    for (const x of [200, 320, 660, 760]) { inkCircle(x, 82, 16, '#4fbf5f', 1.2, 'rgba(60,90,60,.6)'); inkCircle(x + 16, 86, 12, '#5fcf6a', 1.2, 'rgba(60,90,60,.6)'); }
    // vines with little flowers
    [[250, 80, 160, 0], [340, 70, 190, 1], [372, 90, 120, 2], [600, 70, 200, 3], [700, 84, 150, 4], [830, 90, 130, 5], [130, 88, 110, 6]].forEach(a => wfVine(...a));
    // rainbows in the mist
    ctx.lineWidth = 9;
    ['#ff8fb8', '#ffbf73', '#ffe873', '#8fe6a6', '#7cc8ff', '#b79bff'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.globalAlpha = 0.45 + 0.1 * Math.sin(S.t);
      ctx.beginPath(); ctx.arc(480, 420, 220 - i * 9, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    });
    ctx.lineWidth = 5;
    ['#ff8fb8', '#ffe873', '#7cc8ff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(480, 252, 96 - i * 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); });
    ctx.globalAlpha = 1;
    // the big pool at the bottom
    const pg = ctx.createLinearGradient(0, 392, 0, 450); pg.addColorStop(0, '#7fdcff'); pg.addColorStop(1, '#2f9ae0');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(480, 420, 330, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 3; i++) { const k = (S.t * 0.6 + i / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(480, 404, 100 + k * 160, 8 + k * 18, 0, 0, Math.PI * 2); ctx.stroke(); }
    // mist clouds
    for (let i = 0; i < 9; i++) { ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.2 * Math.sin(S.t * 1.5 + i)})`; ellipse(380 + i * 25, 396 + Math.sin(S.t + i) * 4, 34 + (i % 3) * 8, 16); }
    for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.2 * Math.sin(S.t * 2 + i)})`; ellipse(400 + i * 40, 252, 24, 9); }
    // lily pads, rocks and a jumping fish
    for (const [x, y, r, b] of [[230, 420, 16, '#ff9acb'], [700, 428, 18, '#fff'], [760, 412, 12, null], [290, 436, 12, null]]) {
      inkEllipse(x, y, r, r * 0.4, 0, '#5fc04a', 1); if (b) flower(x + 3, y - 4, 6, b, '#ffd84a', 0.8);
    }
    for (const [x, y, rx] of [[160, 424, 30], [196, 438, 18], [800, 428, 34], [838, 440, 20], [372, 400, 22], [592, 398, 20]]) inkEllipse(x, y, rx, rx * 0.55, 0, '#9a8aa8', 1.5);
    const jk = (S.t * 0.4) % 1;
    if (jk < 0.3) { const k = jk / 0.3; ctx.save(); ctx.translate(lerp(620, 700, k), 418 - Math.sin(k * Math.PI) * 60); ctx.rotate(-1 + k * 2); emoji('🐟', 0, 0, 28); ctx.restore(); }
    // mossy bank in front with pebbles and ferns
    ctx.fillStyle = '#74c85e'; ctx.beginPath(); ctx.moveTo(0, 452); ctx.quadraticCurveTo(480, 470, W, 452); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 452); ctx.quadraticCurveTo(480, 470, W, 452); ctx.stroke();
    ctx.fillStyle = '#8fd87a'; for (let i = 0; i < 30; i++) ellipse((i * 167) % W, 486 + (i * 31) % 50, 12, 4);
    for (let i = 0; i < 12; i++) inkEllipse((i * 83 + 40) % W, 500 + (i * 23) % 30, 6, 4, 0, ['#d8d0e0', '#c8c0d4', '#e8e0ec'][i % 3], 0.8);
    for (const x of [24, 110, 860, 940]) for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, 470); ctx.quadraticCurveTo(x + k * 12, 440, x + k * 20, 446 + Math.abs(k) * 6); ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 4; ctx.stroke(); }
    for (let i = 0; i < 8; i++) flower(60 + i * 120 + (i % 2) * 30, 470 + (i % 3) * 18, 7, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1.2);
    // sparkles in the spray, a butterfly and a bird
    for (let i = 0; i < 6; i++) { const a = Math.abs(Math.sin(S.t * 2 + i * 1.3)); star(400 + (i * 47) % 170, 280 + (i * 37) % 110, 4 + a * 4, `rgba(255,255,255,${a})`, 4); }
    emoji('🦋', 200 + Math.sin(S.t * 0.8) * 60, 320 + Math.sin(S.t * 2.4) * 16, 22);
    const bx = ((S.t * 40) % (W + 100)) - 50; ctx.strokeStyle = OL; ctx.lineWidth = 2.5; const fl = Math.sin(S.t * 10) * 5;
    ctx.beginPath(); ctx.moveTo(bx - 10, 150 + fl); ctx.quadraticCurveTo(bx - 4, 146, bx, 152); ctx.quadraticCurveTo(bx + 4, 146, bx + 10, 150 + fl); ctx.stroke();
  };

  // ---- Salmon Leap (action): Aubrey carries little Sal the salmon up the falls, one ledge at a time when the water is calm
  const SL = { lanes: [400, 560], LED: 118, base: 440, s: 0.48, wind: 0.14 };
  // where her chest is in each sprite frame (image pixels, as the frame faces natively), from her head
  // and neck in the photo (heroHead in js/hero.js)
  const SL_CHEST = frame => {
    const hd = heroHead(frame);
    return [hd.cx, hd.neck + (IMG[frame].height - hd.neck) * 0.26];
  };
  // a chubby little salmon, head to the right, with a tail that wags by `wag` radians
  function drawHeldSalmon(wag, hurt) {
    ctx.save(); ctx.translate(-28, 0); ctx.rotate(wag);
    ink(P2('M2,0 C-6,-4 -14,-14 -20,-16 C-17,-6 -17,6 -20,16 C-14,14 -6,4 2,0 Z'), '#ff8a6a', 1.6);
    ctx.strokeStyle = 'rgba(200,80,60,.6)'; ctx.lineWidth = 1.2; line(-4, -2, -15, -9); ctx.stroke(); line(-4, 2, -15, 9); ctx.stroke();
    ctx.restore();
    ink(P2('M-30,0 C-20,-19 16,-21 32,-5 C37,0 37,3 32,7 C16,20 -20,18 -30,0 Z'), '#ff9a7a', 1.6);
    ctx.fillStyle = '#5a7ab8'; ctx.beginPath(); ctx.moveTo(-28, -2); ctx.bezierCurveTo(-14, -17, 16, -19, 31, -5); ctx.bezierCurveTo(10, -9, -12, -7, -28, -2); ctx.fill();
    ctx.fillStyle = '#ffd8c8'; ctx.beginPath(); ctx.ellipse(2, 8, 22, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(2, -14); ctx.rotate(wag * 0.4); ink(P2('M-8,2 L-1,-9 L7,2 Z'), '#ff8a6a', 1.2); ctx.restore();
    ctx.fillStyle = '#fff'; circle(21, -4, 5.5);
    if (hurt) { ctx.strokeStyle = OL; ctx.lineWidth = 2; line(18, -7, 24, -1); ctx.stroke(); line(18, -1, 24, -7); ctx.stroke(); }
    else { ctx.fillStyle = OL; circle(22.5, -4, 3); ctx.fillStyle = '#fff'; circle(23.5, -5.2, 1.1); }
    ctx.fillStyle = 'rgba(255,120,150,.55)'; ellipse(22, 4, 4, 2.4);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(30, 2, 3, 0.2, Math.PI * 0.8); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; for (const [dx, dy] of [[-10, -6], [0, -10], [-18, -3]]) circle(dx, dy, 1.6);
  }
  // Aubrey in sprite `frame`, feet at (x, gy), squashed by sq (>1 = stretched tall), tilted by rot, hugging the salmon
  function drawAubSalmon(x, gy, ground, frame, facing, sq, rot, wag, hurt, wet) {
    const im = IMG[frame], s = SL.s, w = im.width * s, h = im.height * s;
    const nat = AUB_NATIVE[frame], mirror = nat && facing && nat !== Math.sign(facing) ? -1 : 1, [ax, ay] = SL_CHEST(frame);
    const cx = (-w / 2 + ax * s) * mirror, cy = -h + ay * s;
    ctx.fillStyle = 'rgba(40,20,60,.22)'; ellipse(x, ground, 22 * clamp(1 - (ground - gy) / 160, 0.4, 1), 5);
    ctx.save(); ctx.translate(x, gy); ctx.rotate(rot); ctx.scale(1 / Math.sqrt(sq), sq);
    ctx.save(); ctx.scale(mirror, 1); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
    // the salmon across her chest, wrapped in her arms
    ctx.save(); ctx.translate(cx, cy); ctx.scale(facing < 0 ? -0.6 : 0.6, 0.6); ctx.rotate(-0.12);
    drawHeldSalmon(wag, hurt);
    const skin = '#f6c9ae';
    for (const [x0, y0, x1, y1, hx, hy] of [[-27, -4, -28, 14, -12, 14], [29, -6, 30, 14, 12, 15]]) {
      ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x1, y1, hx, hy);
      ctx.strokeStyle = OL; ctx.lineWidth = 9.5; ctx.stroke(); ctx.strokeStyle = skin; ctx.lineWidth = 6.5; ctx.stroke();
      inkEllipse(hx, hy, 6, 4.6, 0, skin, 1.4);
      ctx.strokeStyle = 'rgba(160,90,70,.6)'; ctx.lineWidth = 1; for (const d of [-2, 2]) { ctx.beginPath(); ctx.moveTo(hx + d, hy - 3); ctx.lineTo(hx + d, hy + 1); ctx.stroke(); }
    }
    ctx.restore();
    // drips and shine: she is soaked from the spray
    if (wet) {
      ctx.fillStyle = 'rgba(160,220,255,.85)';
      for (let i = 0; i < 4; i++) { const k = (S.t * 1.6 + i * 0.27) % 1, dx = [-14, 12, -4, 16][i]; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(dx, -h * 0.5 + k * h * 0.55, 2.2, 3.4, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  MG.salmonleap = {
    kind: 'action', title: () => 'Salmon Leap', icon: () => '🐟',
    how: () => 'Carry little Sal the salmon up the waterfall to her home! Leap when the light is GREEN and the water is calm. Move left or right to dodge the falling logs! Arrow keys and space work too.',
    init(g) {
      Object.assign(g, { top: [5, 7, 8][g.tier - 1], level: 0, lane: 0, fx: SL.lanes[0], st: 'idle', stT: 0, cam: 0, logs: [], logT: 3.5,
        hits: 0, washes: 0, timeLeft: 80, w: [1.15, 1.35, 1.6][g.tier - 1], won: false, from: 0, fromX: SL.lanes[0], tt: 0, landT: 0 });
    },
    start(g) { g.say = 'Leap with Sal when the light is green!'; speak(g.say); },
    flow(g, lane, lvl) { return Math.sin(g.tt * g.w + lane * 2.6 + lvl * 1.3); },
    strong(g, lane, lvl) { return this.flow(g, lane, lvl) > -0.15; },
    ledgeY(g, k) { return SL.base - k * SL.LED + g.cam; },
    // Aubrey's feet: she winds up on the ledge for SL.wind seconds, then flies
    fishY(g) {
      const y0 = this.ledgeY(g, g.from) + 1, y1 = this.ledgeY(g, g.from + 1) + 1, k = g.stT;
      if (g.st === 'jump') { const e = clamp((k - SL.wind) / (0.6 - SL.wind), 0, 1); return lerp(y0, y1, e) - Math.sin(e * Math.PI) * 46; }
      if (g.st === 'wash') { const e = clamp((k - SL.wind) / (0.8 - SL.wind), 0, 1); return lerp(y0, this.ledgeY(g, g.level) + 1, e) - Math.sin(e * Math.PI) * SL.LED * 0.5; }
      if (g.st === 'hurt') { const e = clamp(k / 0.5, 0, 1); return lerp(y0, this.ledgeY(g, g.level) + 1, e) - Math.sin(e * Math.PI) * 30; }
      return this.ledgeY(g, g.level) + 1;
    },
    update(g, dt, id) {
      g.timeLeft -= dt; g.stT += dt; g.tt += dt; g.landT = Math.max(0, g.landT - dt);
      g.cam = lerp(g.cam, Math.max(0, Math.min(g.top, g.level) * SL.LED - 110), Math.min(1, dt * 3));
      const busy = g.st !== 'idle' && g.st !== 'side';
      if (!g.won && g.st !== 'hurt') {
        const L = id === 'sl:l' || pressed.arrowleft || pressed.a, R = id === 'sl:r' || pressed.arrowright || pressed.d;
        if (!busy && (L && g.lane === 1 || R && g.lane === 0)) { g.fromX = g.fx; g.lane = 1 - g.lane; g.st = 'side'; g.stT = 0; SFX.blip(); }
        if (g.st === 'idle' && (id === 'sl:j' || jumpPressed())) {
          g.from = g.level; g.stT = 0;
          if (this.strong(g, g.lane, g.level)) { g.st = 'wash'; g.level = Math.max(0, g.level - 1); tone(300, 0.3, 'sawtooth', 0.04, 0, 150); } else { g.st = 'jump'; SFX.jump(); }
        }
      }
      if (g.st === 'side') { g.fx = lerp(g.fromX, SL.lanes[g.lane], smooth(g.stT / 0.22)); if (g.stT >= 0.22) { g.fx = SL.lanes[g.lane]; g.st = 'idle'; } }
      else if (g.st === 'jump' && g.stT >= 0.6) {
        g.level++; g.st = 'idle'; g.landT = 0.3; SFX.pop(); tone(520, 0.12, 'sine', 0.05, 0, 260); burst(g.fx, this.ledgeY(g, g.level), 16, { colors: ['#ffffff', '#bfe6ff', '#8adcff'], spread: 110, up: 70 });
        if (g.level >= g.top) { g.won = true; g.stT = 0; SFX.sparkle(); speak('You made it to the top! Sal is home!'); burst(480, 200, 40); }
      } else if (g.st === 'wash' && g.stT >= 0.8) {
        g.st = 'idle'; g.landT = 0.3; g.washes++; floatText(g.fx, this.ledgeY(g, g.level) - 60, 'Too strong!', '#bfe6ff', false, 24);
        if (g.washes <= 2 || g.washes % 3 === 0) speak('Whoosh! The water was too strong and washed you and Sal down. Wait for the green light!');
      } else if (g.st === 'hurt' && g.stT >= 1.1) g.st = 'idle';
      // falling logs: a warning at the top, then down the lane they go
      g.logT -= dt;
      if (g.logT <= 0 && !g.won) {
        g.logs.push({ lane: Math.random() < 0.6 ? g.lane : 1 - g.lane, y: 40, warn: 1.3, spin: rand(0, 3) });
        g.logT = [3.8, 3.1, 2.5][g.tier - 1] + rand(-0.4, 0.7);
      }
      const fy = this.fishY(g);
      for (const lg of g.logs) {
        if (lg.warn > 0) { lg.warn -= dt; if (lg.warn <= 0) tone(240, 0.2, 'triangle', 0.05, 0, 120); continue; }
        lg.y += 400 * dt; lg.spin += dt * 4;
        if (!lg.hit && g.st !== 'hurt' && !g.won && Math.abs(SL.lanes[lg.lane] - g.fx) < 50 && Math.abs(lg.y - (fy - 44)) < 46) {
          lg.hit = true; g.hits++; g.from = g.level; g.level = Math.max(0, g.level - 1); g.st = 'hurt'; g.stT = 0;
          SFX.miss(); tone(140, 0.3, 'square', 0.05); speak('Bonk! A log! Move to the other side next time.');
        }
      }
      g.logs = g.logs.filter(lg => lg.y < H + 40);
      if (g.won && g.stT > 1.6) g.done = true;
      if (g.timeLeft <= 0) g.done = true;
      g.progress = `Ledge ${g.level} of ${g.top}`;
      g.score = g.won ? Math.max(0.3, 1 - 0.08 * g.hits - 0.06 * g.washes) : 0.7 * g.level / g.top;
    },
    draw(g) {
      // the climbing column: rock walls with the two streams of water between ledges
      const rg = ctx.createLinearGradient(300, 0, 660, 0); rg.addColorStop(0, '#8a6e7e'); rg.addColorStop(0.5, '#a48896'); rg.addColorStop(1, '#8a6e7e');
      ctx.fillStyle = rg; ctx.fillRect(300, 60, 360, H - 60);
      ctx.strokeStyle = 'rgba(70,40,60,.3)'; ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) { const y = ((i * 60 + g.cam * 0.9) % 520) + 40; line(306, y, 340, y + 10); ctx.stroke(); line(654, y + 20, 620, y + 32); ctx.stroke(); }
      for (const x of [300, 660]) { ctx.strokeStyle = OL; ctx.lineWidth = 4; line(x, 60, x, H); ctx.stroke(); }
      for (let k = 0; k < g.top; k++) {
        const y0 = this.ledgeY(g, k), y1 = this.ledgeY(g, k + 1);
        if (y0 < 40 || y1 > H) continue;
        for (let ln = 0; ln < 2; ln++) {
          const f = smooth((this.flow(g, ln, k) + 0.6) / 1.2), w = lerp(20, 86, f), x = SL.lanes[ln];
          ctx.fillStyle = f > 0.5 ? 'rgba(236,250,255,.95)' : 'rgba(140,215,255,.8)'; ctx.fillRect(x - w / 2, y1, w, y0 - y1);
          ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2, y1, w, y0 - y1); ctx.clip();
          ctx.strokeStyle = f > 0.5 ? 'rgba(120,190,240,.6)' : 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5;
          for (let i = 0; i < 6; i++) { const sx = x - w / 2 + 4 + (i * 17) % Math.max(8, w - 8), sy = y1 + ((g.tt * lerp(120, 520, f) + i * 37) % (y0 - y1 + 30)) - 20; line(sx, sy, sx, sy + 18); ctx.stroke(); }
          ctx.restore();
          if (f > 0.5) { ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 4; i++) circle(x - w / 2 + i * w / 3, y0 - 4 + Math.sin(g.tt * 9 + i) * 2, 7); }
        }
      }
      // ledges with little pools; the top one holds the crystals
      for (let k = 0; k <= g.top; k++) {
        const y = this.ledgeY(g, k);
        if (y < 30 || y > H + 30) continue;
        inkRect(292, y, 376, 20, k === g.top ? '#c8a8e8' : '#9a8aa8', 2.5, 8);
        ctx.fillStyle = '#6fcf5a'; for (let x = 300; x < 664; x += 26) ellipse(x, y + 2, 9, 4);
        rrect(330, y - 6, 300, 9, 4, 'rgba(140,220,255,.85)');
        if (k === g.top) for (let i = 0; i < 5; i++) glowEmoji('💎', 350 + i * 65, y - 22 + Math.sin(S.t * 3 + i) * 3, 30, 'rgba(255,255,255,.8)');
      }
      // green/red lights for the water right above the fish
      if (g.level < g.top && !g.won) for (let ln = 0; ln < 2; ln++) {
        const strong = this.strong(g, ln, g.level), x = SL.lanes[ln] + (ln ? 64 : -64), y = this.ledgeY(g, g.level) - 34;
        inkRect(x - 14, y - 14, 28, 46, '#4a4058', 2, 8);
        inkCircle(x, y - 2, 9, strong ? '#ff5f6a' : 'rgba(255,95,106,.2)', 1);
        inkCircle(x, y + 19, 9, strong ? 'rgba(90,220,122,.2)' : '#5adc7a', 1);
        if (!strong && ln === g.lane && g.st === 'idle') { ctx.fillStyle = 'rgba(90,220,122,.3)'; circle(x, y + 19, 16 + Math.sin(S.t * 10) * 3); }
      }
      // logs
      for (const lg of g.logs) {
        const x = SL.lanes[lg.lane];
        if (lg.warn > 0) {
          if (Math.floor(lg.warn * 6) % 2) { rrect(x - 26, 70, 52, 44, 12, 'rgba(255,90,90,.85)'); emoji('⚠️', x, 92, 30); }
          continue;
        }
        ctx.save(); ctx.translate(x, lg.y); ctx.rotate(Math.sin(lg.spin) * 0.4);
        inkRect(-34, -12, 68, 24, '#a0683a', 2, 10);
        ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2; line(-24, -4, 10, -4); ctx.stroke(); line(-14, 5, 22, 5); ctx.stroke();
        inkEllipse(30, 0, 7, 11, 0, '#e8b47a', 1); ctx.restore();
      }
      // Aubrey, hugging Sal: crouch to wind up, jump in the air, boing on landing
      const fy = this.fishY(g), facing = g.lane ? -1 : 1, k = g.stT;
      let frame = 'idle_front', sq = 1 + Math.sin(S.t * 3) * 0.015, rot = 0, wag = Math.sin(S.t * 6) * 0.25;
      if (g.st === 'jump' || g.st === 'wash') {
        if (k < SL.wind) { frame = 'crouch'; sq = 1 - 0.12 * k / SL.wind; }
        else {
          const e = clamp((k - SL.wind) / (g.st === 'jump' ? 0.6 - SL.wind : 0.8 - SL.wind), 0, 1);
          frame = 'jump'; sq = 1 + 0.16 * Math.max(0, 1 - e * 3); wag = Math.sin(S.t * 22) * 0.7;
          rot = g.st === 'wash' ? Math.sin(e * Math.PI) * -0.9 * facing : -0.08 * facing;
        }
      } else if (g.st === 'side') { frame = 'jump'; sq = 1.05; wag = Math.sin(S.t * 18) * 0.5; }
      else if (g.st === 'hurt') { rot = Math.sin(g.stT * 20) * 0.2; wag = Math.sin(S.t * 26) * 0.6; }
      else if (g.landT > 0) { const e = g.landT / 0.3; sq = 1 - 0.22 * Math.sin(e * Math.PI); wag = Math.sin(S.t * 20) * 0.5 * e; }
      if (g.won) { frame = g.stT < 0.25 ? 'crouch' : 'jump'; sq = 1; wag = Math.sin(S.t * 16) * 0.6; }
      const lift = g.won && g.stT >= 0.25 ? Math.abs(Math.sin((g.stT - 0.25) * 6)) * 26 : 0;
      if (g.st !== 'hurt' || Math.floor(g.stT * 10) % 2) drawAubSalmon(g.fx, fy - lift, g.st === 'idle' || g.st === 'side' ? fy : Math.max(fy, this.ledgeY(g, Math.min(g.from, g.level)) + 1), frame, facing, sq, rot, wag, g.st === 'hurt', true);
      if (g.landT > 0) {
        const e = 1 - g.landT / 0.3; ctx.strokeStyle = `rgba(255,255,255,${1 - e})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(g.fx, fy - 2, 20 + e * 34, 5 + e * 6, 0, 0, Math.PI * 2); ctx.stroke();
        for (const d of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(200,236,255,${1 - e})`; circle(g.fx + d * (16 + e * 30 + i * 8), fy - 6 - Math.sin(e * Math.PI) * (16 + i * 8), 3.5 - i * 0.8); }
      }
      if (g.won) outlined('Sal is home! 💎', 480, 230, 48, '#fff6a8');
      const on = !g.won && g.st !== 'hurt';
      button('sl:l', 196, 470, 96, 58, '', { on: on && g.lane === 1, color: '#40b0ff' }); emoji('⬅️', 244, 499, 32);
      button('sl:j', 400, 470, 160, 58, 'LEAP!', { on: on && g.st === 'idle', color: '#3fbf6a', size: 26 });
      button('sl:r', 668, 470, 96, 58, '', { on: on && g.lane === 0, color: '#40b0ff' }); emoji('➡️', 716, 499, 32);
    },
  };

  // ---- Sink or Float? (learn): guess, then watch the thing drop into the tank
  const SF_THINGS = [['🪨', 'a rock', 0, 'Rocks are heavy for their size, so they sink.'], ['🍃', 'a leaf', 1, 'Leaves are light and flat, so they float.'],
    ['🍎', 'an apple', 1, 'Apples have air inside, so they float!'], ['🪙', 'a coin', 0, 'A coin is small but heavy metal. It sinks!'],
    ['🦆', 'a rubber duck', 1, 'Rubber ducks are full of air. They float!'], ['🔑', 'a key', 0, 'Metal keys sink to the bottom.'],
    ['🪶', 'a feather', 1, 'Feathers are super light. They float!'], ['🥄', 'a spoon', 0, 'A metal spoon sinks.'],
    ['🪵', 'a log', 1, 'Wood floats!'], ['🧊', 'an ice cube', 1, 'Ice floats on water!'], ['🍊', 'an orange', 1, 'Its peel is full of tiny air bubbles, so it floats!'],
    ['🐚', 'a shell', 0, 'Shells are hard and heavy like stone. They sink.'], ['⚓', 'an anchor', 0, 'Anchors are made to sink!'],
    ['🧽', 'a sponge', 1, 'Sponges are full of air holes. They float!'], ['📎', 'a paperclip', 0, 'Paperclips are metal, so they sink.'],
    ['🏐', 'a ball', 1, 'A ball full of air floats!'], ['🔩', 'a bolt', 0, 'Bolts are heavy metal. They sink.'], ['✏️', 'a pencil', 1, 'Wooden pencils float.']];
  const SF = { x0: 310, x1: 650, top: 190, surf: 252, bot: 436 };
  // Aubrey stands on a step stool by the tank, holding each thing out, then lobs it in
  const SF_AX = 704, SF_STEP = 254, SF_AH = 132, SF_HAND = [674, 196], SF_DROP = 540, SF_TOSS = 0.4;
  MG.sinkorfloat = {
    kind: 'learn', title: () => 'Sink or Float?', icon: () => '🫧',
    how: () => 'Aubrey has something to drop in the water! Will it sink to the bottom, or float on top? Make your guess, then {she|he} tosses it in. Splash!',
    init(g) {
      const rounds = [6, 7, 8][g.tier - 1], half = Math.floor(rounds / 2);
      const sink = shuffle(SF_THINGS.filter(t => !t[2])), float = shuffle(SF_THINGS.filter(t => t[2]));
      const many = Math.random() < 0.5;
      g.items = shuffle([...sink.slice(0, many ? rounds - half : half), ...float.slice(0, many ? half : rounds - half)]);
      Object.assign(g, { round: 0, rounds, total: 0, st: 'guess', stT: 0, oy: 140, ovy: 0, splashed: false, bubbles: [], fishX: 400 });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      g.item = g.items[g.round];
      Object.assign(g, { st: 'guess', stT: 0, ox: SF_HAND[0], oy: SF_HAND[1], ovy: 0, splashed: false, guess: -1, rot: 0 });
      g.say = `Will ${g.item[1]} sink or float?`;
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      g.stT += dt;
      for (const b of g.bubbles) { b.y -= b.v * dt; b.x += Math.sin(b.y * 0.1) * 0.4; }
      g.bubbles = g.bubbles.filter(b => b.y > SF.surf + 4);
      if (Math.random() < dt * 1.5) g.bubbles.push({ x: rand(SF.x0 + 20, SF.x1 - 20), y: SF.bot - 6, v: rand(30, 60), r: rand(2, 5) });
      if (g.st === 'guess') {
        let k = id === 'sf:0' ? 0 : id === 'sf:1' ? 1 : -1;
        if (pressed['1'] || pressed.arrowdown) k = 0;
        if (pressed['2'] || pressed.arrowup) k = 1;
        if (k >= 0) { g.guess = k; g.st = 'drop'; g.stT = 0; SFX.click(); tone(800, 0.4, 'sine', 0.05, 0, 300); }
      } else if (g.st === 'drop') {
        const floats = g.item[2] === 1;
        if (g.stT < SF_TOSS) {
          // Aubrey lobs it from her hands up and over the glass
          const k = g.stT / SF_TOSS;
          g.ox = lerp(SF_HAND[0], SF_DROP, k); g.oy = lerp(SF_HAND[1], 150, k) - Math.sin(k * Math.PI) * 60; g.rot = -k * 1.2; g.ovy = 0;
        } else if (!g.splashed) {
          g.ox = SF_DROP; g.ovy += 900 * dt; g.oy += g.ovy * dt;
          if (g.oy >= SF.surf) {
            g.splashed = true; noise(0.25, 0.06); tone(300, 0.2, 'sine', 0.08, 0, 120);
            burst(g.ox, SF.surf, 18, { colors: ['#ffffff', '#bfe6ff', '#8adcff'], spread: 120, up: 120 });
            g.ovy = floats ? 120 : 70;
          }
        } else if (floats) {
          g.ovy += (SF.surf - 4 - g.oy) * 30 * dt - g.ovy * 4 * dt; g.oy += g.ovy * dt;
        } else {
          g.oy = Math.min(SF.bot - 24, g.oy + 80 * dt); g.rot += dt * 0.6;
          if (Math.random() < dt * 8 && g.oy < SF.bot - 30) g.bubbles.push({ x: g.ox + rand(-10, 10), y: g.oy - 10, v: 70, r: 3 });
        }
        if (g.stT > SF_TOSS + (floats ? 1.3 : 2.1)) {
          const ok = g.guess === g.item[2];
          if (ok) { g.total++; SFX.hit(); burst(480, 300, 18); }
          else SFX.miss();
          g.st = 'show'; g.stT = 0;
          speak(`${ok ? pick(['Yes!', 'You got it!', 'Great guess!']) : 'Ooh, surprise!'} ${g.item[3]}`);
        }
      } else if (g.st === 'show') {
        if (g.item[2]) { g.ovy += (SF.surf - 4 - g.oy) * 30 * dt - g.ovy * 4 * dt; g.oy += g.ovy * dt; }
        if (g.stT > 3.4 || (g.stT > 0.8 && (id === 'sf_next' || pressed[' '] || pressed.enter))) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      }
      g.progress = `Thing ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      promptBar(g.st === 'guess' ? `Will ${g.item[1]} sink or float?` : g.item[2] ? `${g.item[1][0].toUpperCase()}${g.item[1].slice(1)} FLOATS!` : `${g.item[1][0].toUpperCase()}${g.item[1].slice(1)} SINKS!`, 64, 560, 24);
      // the tank on a little stand
      inkRect(SF.x0 - 20, SF.bot + 4, SF.x1 - SF.x0 + 40, 22, '#c98a4a', 2.5, 6);
      rrect(SF.x0, SF.top, SF.x1 - SF.x0, SF.bot - SF.top, 10, 'rgba(230,248,255,.55)');
      const wg = ctx.createLinearGradient(0, SF.surf, 0, SF.bot); wg.addColorStop(0, '#8ae4ff'); wg.addColorStop(1, '#2f98e0');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(SF.x0, SF.bot);
      for (let x = SF.x0; x <= SF.x1; x += 10) ctx.lineTo(x, SF.surf + Math.sin(x * 0.05 + S.t * 3) * 3);
      ctx.lineTo(SF.x1, SF.bot); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2d9a0'; ctx.beginPath(); ctx.ellipse(480, SF.bot, 170, 14, 0, Math.PI, 0); ctx.fill();
      for (let i = 0; i < 8; i++) inkEllipse(SF.x0 + 30 + i * 40, SF.bot - 6, 7, 4, 0, ['#ff9acb', '#d8d0e0', '#ffd84a'][i % 3], 0.8);
      for (const x of [SF.x0 + 30, SF.x1 - 40]) for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 6, SF.bot - 6); ctx.quadraticCurveTo(x + k * 6 + Math.sin(S.t * 2 + k) * 10, SF.bot - 50, x + k * 10, SF.bot - 80 - k * 10); ctx.strokeStyle = '#3fae55'; ctx.lineWidth = 4; ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5;
      for (const b of g.bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
      const fx = 480 + Math.sin(S.t * 0.6) * 120; ctx.save(); ctx.translate(fx, 380); ctx.scale(Math.cos(S.t * 0.6) > 0 ? -1 : 1, 1); emoji('🐠', 0, 0, 30); ctx.restore();
      // Aubrey on her step stool beside the tank: holding the thing out, then tossing it in
      inkRect(658, SF_STEP, 92, 12, '#c98a4a', 2, 4);
      for (const lx of [666, 734]) inkRect(lx, SF_STEP + 10, 9, SF.bot + 26 - SF_STEP - 10, '#b07a40', 1.6, 2);
      inkRect(668, SF_STEP + 70, 74, 8, '#b07a40', 1.4, 2);
      const tossing = g.st === 'drop' && g.stT < SF_TOSS + 0.3, ok = g.st === 'show' && g.guess === g.item[2];
      const fr = tossing ? 'cast' : g.st === 'show' ? (ok ? 'twirl' : 'idle_front') : 'idle_front';
      const hop = ok ? Math.abs(Math.sin(g.stT * 7)) * 10 : 0;
      drawAubrey(SF_AX, SF_STEP, fr, -1, hop, SF_AH / IMG.idle_front.height);
      if (g.st === 'show' && !ok && g.stT < 2) outlined('Whoa!', SF_AX, SF_STEP - SF_AH - 14, 22, '#fff6a8');
      // the thing
      const held = g.st === 'guess', bob = held ? Math.sin(S.t * 3) * 3 : 0;
      ctx.save(); ctx.translate(g.ox, g.oy + bob); ctx.rotate(g.rot); emoji(g.item[0], 0, 0, held ? 54 : 64); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(SF.x0 + 14, SF.top + 10, 12, SF.bot - SF.top - 30);
      ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.beginPath(); ctx.roundRect(SF.x0, SF.top, SF.x1 - SF.x0, SF.bot - SF.top, 10); ctx.stroke();
      // guess buttons either side
      const on = g.st === 'guess', pickedCol = k => (g.guess === k ? '#ffd23f' : '#c9bcd4');
      button('sf:0', 60, 290, 190, 116, '', { on, color: on ? '#ff8a5a' : pickedCol(0), key: '1' });
      emoji('⬇️', 155, 326, 42); text('Sinks', 155, 374, 28, '#fff', 'center', 800);
      button('sf:1', 762, 290, 186, 116, '', { on, color: on ? '#40b0ff' : pickedCol(1), key: '2' });
      emoji('🛟', 855, 326, 42); text('Floats', 855, 374, 28, '#fff', 'center', 800);
      if (g.st === 'show') {
        const ok = g.guess === g.item[2];
        panel(150, 452, 660, 76, 20);
        text(ok ? '✓ Good guess!' : 'Surprise!', 480, 474, 20, ok ? '#2f9a4f' : '#d0506a', 'center', 800);
        const ls = wrap(g.item[3], 620, 18, 600);
        text(ls[0], 480, 502, 18, '#5a2a6e', 'center', 600);
      }
    },
  };

  restage('waterfall', {
    bg: 'waterfall_bg',
    games: [['salmonleap', 'crystal', {}], ['sinkorfloat', 'shell', {}]],
    intro: ['*:A tall waterfall tumbles down the cliffs, whispering and roaring, with rainbows dancing in the mist.',
      'N:Blub! My little sister Sal got washed down the falls! Her home is the crystal pool at the very top.',
      'N:Her fins are too small to leap that high. Can you carry her up?',
      'A:determined:Hold on tight, Sal! I will leap up the falls with you in my arms!',
      'N:Jump when the light is green and the water is calm. And watch out for logs!'],
    mid: ['N:Sal is home! Thank you, Aubrey! Blub blub!',
      'N:Now look at all the things people dropped in my pool!',
      'N:Some sink to the bottom and some float on top. Can you guess which is which?',
      "A:thinking:Hmm... let's do some science!"],
    outro: ['N:You are a real water scientist! Take these shiny crystals and shells. Blub!',
      'A:happy:Bye, Finn! Thanks for the swim!'],
  });

  // ======================================================================== COTTAGE
  function ctFire(x, y) {
    for (let i = 0; i < 5; i++) {
      const h = 46 + Math.sin(S.t * 9 + i * 1.7) * 10 + (i === 2 ? 20 : 0), fx = x - 36 + i * 18, sw = Math.sin(S.t * 6 + i) * 4;
      ink(P2(`M${fx - 12},${y} Q${fx - 14},${y - h * 0.5} ${fx + sw},${y - h} Q${fx + 14},${y - h * 0.5} ${fx + 12},${y} Z`), i % 2 ? '#ff7a3a' : '#ffb03a', 1);
    }
    for (let i = 0; i < 3; i++) { const h = 24 + Math.sin(S.t * 11 + i) * 6, fx = x - 18 + i * 18; ctx.fillStyle = '#ffe36b'; ctx.beginPath(); ctx.moveTo(fx - 7, y); ctx.quadraticCurveTo(fx, y - h * 1.3, fx + 7, y); ctx.fill(); }
    for (let i = 0; i < 4; i++) { const k = (S.t * 0.8 + i / 4) % 1; ctx.fillStyle = `rgba(255,220,120,${1 - k})`; circle(x - 20 + i * 14 + Math.sin(k * 9) * 6, y - 40 - k * 70, 2); }
  }
  BACKDROPS.cottage_bg = () => {
    // warm wallpaper with little flowers
    ctx.fillStyle = '#ffeed6'; ctx.fillRect(0, 0, W, H);
    for (let y = 40, r = 0; y < 430; y += 44, r++) for (let x = (r % 2) * 32; x < W; x += 64) { ctx.fillStyle = 'rgba(255,150,180,.3)'; for (let k = 0; k < 5; k++) circle(x + Math.cos(k * 1.26) * 5, y + Math.sin(k * 1.26) * 5, 3.5); ctx.fillStyle = 'rgba(255,210,90,.6)'; circle(x, y, 2.5); }
    ctx.fillStyle = 'rgba(140,200,140,.25)'; for (let x = 32; x < W; x += 64) ctx.fillRect(x - 1, 0, 2, 430);
    // ceiling beams and timber posts
    inkRect(-4, -4, W + 8, 30, '#9a6a44', 2.5, 0);
    for (const x of [0, 942]) inkRect(x - 4, 20, 22, 420, '#9a6a44', 2.5, 0);
    // window with gingham curtains and the garden outside
    ctx.save(); ctx.beginPath(); ctx.rect(290, 96, 150, 150); ctx.clip();
    const sg = ctx.createLinearGradient(0, 96, 0, 246); sg.addColorStop(0, '#6fcfff'); sg.addColorStop(1, '#dff6ff'); ctx.fillStyle = sg; ctx.fillRect(290, 96, 150, 150);
    ctx.fillStyle = '#8fd47a'; ellipse(340, 250, 90, 40); ellipse(420, 246, 70, 30);
    drawTree(404, 226, 90, 26, 1, 0);
    for (let i = 0; i < 5; i++) flower(300 + i * 30, 236, 6, ['#ff6fae', '#fff', '#ffd84a'][i % 3], '#ffd84a', 0.8);
    ctx.restore();
    ctx.lineWidth = 8; ctx.strokeStyle = OL; ctx.strokeRect(290, 96, 150, 150); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.strokeRect(290, 96, 150, 150);
    line(365, 96, 365, 246); ctx.stroke(); line(290, 171, 440, 171); ctx.stroke();
    inkRect(280, 244, 170, 12, '#c98a4a', 2, 3);
    for (let i = 0; i < 5; i++) flower(296 + i * 34, 238, 7, ['#ff5f7e', '#ffd83a', '#9c6cff'][i % 3], '#fff6a8', 1);
    for (const s of [-1, 1]) {
      const cx = s < 0 ? 290 : 440, sw = Math.sin(S.t * 0.8) * 3;
      const p = P2(`M${cx - s * 4},86 L${cx + s * 38},86 Q${cx + s * 18 + sw},170 ${cx + s * 30},262 L${cx - s * 14},262 Q${cx - s * 4},170 ${cx - s * 4},86 Z`);
      ink(p, '#ff8fb8', 1.5);
      ctx.save(); ctx.clip(p); ctx.fillStyle = 'rgba(255,255,255,.45)';
      for (let y = 86; y < 262; y += 12) for (let x = cx - 50; x < cx + 50; x += 12) if (((x + y) / 12 | 0) % 2) ctx.fillRect(x, y, 6, 6);
      ctx.restore();
    }
    inkRect(270, 80, 190, 10, '#c98a4a', 2, 4);
    // patchwork quilt hanging on the wall
    inkRect(36, 86, 196, 196, '#fff', 2.5, 6);
    const qc = ['#ff8fb8', '#ffd83a', '#8ad4ff', '#a6f0b8', '#c6a2ff', '#ffb38a'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const x = 42 + c * 37, y = 92 + r * 37, col = qc[(r * 2 + c * 3) % 6];
      ctx.fillStyle = col; ctx.fillRect(x, y, 35, 35);
      if ((r + c) % 3 === 0) heart(x + 17.5, y + 10, 20, mix(col, '#ffffff', 0.5));
      else if ((r + c) % 3 === 1) { ctx.fillStyle = 'rgba(255,255,255,.45)'; tri(x, y, x + 35, y, x, y + 35); }
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeRect(x + 3, y + 3, 29, 29); ctx.setLineDash([]);
    }
    inkRect(26, 78, 216, 10, '#9a6a44', 2, 4);
    // fireplace with a crackling fire and a busy mantel
    inkRect(450, 186, 240, 254, '#c8b0a8', 3, 6);
    ctx.fillStyle = 'rgba(120,90,100,.25)';
    for (let y = 196, r = 0; y < 436; y += 26, r++) for (let x = 456 + (r % 2) * 20; x < 684; x += 40) { ctx.beginPath(); ctx.roundRect(x, y, 34, 20, 5); ctx.fill(); }
    ink(P2('M490,440 L490,330 Q570,280 650,330 L650,440 Z'), '#3a2440', 1.5);
    const glow = ctx.createRadialGradient(570, 420, 10, 570, 420, 150); glow.addColorStop(0, `rgba(255,170,80,${0.4 + 0.08 * Math.sin(S.t * 7)})`); glow.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = glow; ctx.fillRect(420, 280, 300, 220);
    inkRect(518, 422, 104, 14, '#8a5a3a', 1.5, 6); inkRect(530, 412, 80, 13, '#a0683a', 1.5, 6);
    ctFire(570, 420);
    inkRect(436, 176, 268, 18, '#9a6a44', 2.5, 4);
    // mantel things: candles, a clock, a teapot and a photo
    for (const x of [470, 676]) { inkRect(x - 6, 140, 12, 36, '#fff4e0', 1.5, 3); const fl = Math.sin(S.t * 12 + x) * 1.5; ctx.fillStyle = '#ffb03a'; ellipse(x + fl * 0.4, 132, 4, 8 + fl); ctx.fillStyle = '#fff3a8'; ellipse(x, 134, 2, 4); }
    inkCircle(570, 150, 24, '#ffd83a', 2); inkCircle(570, 150, 18, '#fffaf0', 1.2);
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; const ha = S.t * 0.2, ma = S.t * 2;
    line(570, 150, 570 + Math.sin(ha) * 9, 150 - Math.cos(ha) * 9); ctx.stroke(); line(570, 150, 570 + Math.sin(ma) * 14, 150 - Math.cos(ma) * 14); ctx.stroke();
    emoji('🫖', 516, 158, 32); inkRect(612, 142, 34, 34, '#ff8fb8', 2, 4); rrect(617, 147, 24, 24, 3, '#bfe6ff'); emoji('🐱', 629, 160, 16);
    // a rocking chair with a knitted blanket
    ctx.save(); ctx.translate(118, 446); ctx.rotate(Math.sin(S.t * 1.2) * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-78, -14); ctx.quadraticCurveTo(0, 18, 78, -14); inkStroke('#a0683a', 7, 2);
    for (const [a, b] of [[-40, -44], [40, 40]]) { line(a, -4, b, -74); inkStroke('#c98a4a', 7, 2); }
    ink(P2('M-52,-74 L-30,-74 L-52,-192 L-76,-192 Z'), '#e0a868', 1.5);
    ctx.strokeStyle = '#b07a48'; ctx.lineWidth = 3; for (const k of [0.3, 0.55, 0.8]) { line(lerp(-52, -76, 0) + k * 22, -78, lerp(-52, -76, 1) + k * 24, -186); ctx.stroke(); }
    inkRect(-82, -200, 36, 12, '#c98a4a', 2, 6);
    inkRect(-58, -84, 116, 12, '#c98a4a', 2, 5);
    inkRect(-44, -98, 76, 16, '#ff8fb8', 2, 8);
    line(44, -80, 46, -122); inkStroke('#c98a4a', 6, 2);
    line(-58, -132, 54, -124); inkStroke('#c98a4a', 7, 2);
    // knitted blanket over the back
    ink(P2('M-84,-182 L-48,-188 L-40,-140 L-34,-108 L-38,-100 L-44,-108 L-50,-98 L-56,-108 L-62,-98 L-68,-108 L-74,-100 L-76,-140 Z'), '#8ad4ff', 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3;
    for (const y of [-170, -150, -130]) { line(-80, y, -42, y - 4); ctx.stroke(); }
    ctx.strokeStyle = '#ffd83a'; for (const y of [-160, -140, -120]) { line(-78, y, -40, y - 4); ctx.stroke(); }
    ctx.restore();
    // the loom with coloured threads
    inkRect(760, 150, 14, 290, '#c98a4a', 2.5, 4); inkRect(906, 150, 14, 290, '#c98a4a', 2.5, 4);
    inkRect(750, 150, 180, 14, '#a0683a', 2.5, 4); inkRect(750, 380, 180, 14, '#a0683a', 2.5, 4);
    ctx.lineWidth = 1.5; for (let x = 780; x < 904; x += 8) { ctx.strokeStyle = '#e8e0f0'; line(x, 164, x, 380); ctx.stroke(); }
    for (let r = 0; r < 12; r++) { ctx.fillStyle = qc[r % 6]; ctx.fillRect(778, 368 - r * 10, 128, 8); }
    const shx = 780 + (Math.sin(S.t * 1.5) * 0.5 + 0.5) * 110; inkRect(shx - 14, 244, 28, 10, '#ffd83a', 1.5, 5);
    // floor boards and a braided rug
    const fg = ctx.createLinearGradient(0, 436, 0, H); fg.addColorStop(0, '#c98a54'); fg.addColorStop(1, '#a86c3c');
    ctx.fillStyle = fg; ctx.fillRect(0, 436, W, H - 436);
    ctx.strokeStyle = 'rgba(90,50,30,.35)'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 70) { line(x, 436, x - 30, H); ctx.stroke(); }
    inkRect(-4, 430, W + 8, 10, '#9a6a44', 2, 0);
    ['#ff8fb8', '#ffd83a', '#8ad4ff', '#a6f0b8', '#c6a2ff'].forEach((c, i) => { ctx.fillStyle = c; ellipse(480, 500, 300 - i * 46, 34 - i * 5.5); });
    // yarn baskets
    const basket = (x, y, w) => {
      for (let i = 0; i < 3; i++) yarnBall(x - w * 0.28 + i * w * 0.28, y - 34 - (i % 2) * 8, 15, ['#ff5f7e', '#9c6cff', '#ffd83a', '#40b0ff', '#5adc7a'][(x / 10 + i) % 5 | 0]);
      ink(P2(`M${x - w / 2},${y - 30} L${x + w / 2},${y - 30} L${x + w / 2 - 8},${y} L${x - w / 2 + 8},${y} Z`), '#d8a060', 1.5);
      ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 2; for (let k = 1; k < 3; k++) { line(x - w / 2 + 4, y - 30 + k * 10, x + w / 2 - 4, y - 30 + k * 10); ctx.stroke(); }
    };
    basket(720, 452, 70); basket(390, 448, 60);
    ctx.strokeStyle = '#ff5f7e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(404, 414); ctx.bezierCurveTo(430, 470, 470, 440, 500, 480); ctx.stroke();
    yarnBall(500, 482, 10, '#ff5f7e');
    // a sleepy kitten by the fire
    drawKitten(610, 462, 0.8, KIT_COLS[0], -1, S.t, false, true);
    ctx.fillStyle = 'rgba(91,63,115,.6)'; text('z', 590 + Math.sin(S.t) * 3, 430 - (S.t * 8) % 20, 14, 'rgba(91,63,115,.6)', 'center', 700);
  };

  // ---- Colour by Number (learn): pick a numbered colour and fill the squares that match
  const CBN_PICS = {
    heart: { name: 'heart', pal: [['#9fd8ff', 'blue'], ['#ff4f6a', 'red'], ['#ffc0d0', 'pink']],
      rows: ['111111111', '122212221', '232222222', '233222222', '222222222', '122222221', '112222211', '111222111', '111121111'] },
    flower: { name: 'flower', pal: [['#9fd8ff', 'blue'], ['#ff8fc8', 'pink'], ['#ffd23f', 'yellow'], ['#4fc86a', 'green'], ['#a86c3c', 'brown']],
      rows: ['111222111', '112222211', '122333221', '122333221', '112222211', '111242111', '144141441', '111141111', '555555555'] },
    cat: { name: 'cat', pal: [['#d8c8ff', 'purple'], ['#ffa94d', 'orange'], ['#ff9ab8', 'pink'], ['#4a3a5a', 'black'], ['#ffffff', 'white']],
      rows: ['211111112', '221111122', '232222232', '222222222', '224222422', '222535222', '222555222', '122222221', '112222211'] },
  };
  const CB = { x0: 84, y0: 76, cell: 40 };
  MG.colourbynumber = {
    kind: 'learn', title: () => 'Colour by Number', icon: () => '🎨',
    how: () => 'Every square has a number. Pick a colour from the key, then tap the squares with the same number to fill them in!',
    init(g) {
      const order = shuffle(Object.keys(CBN_PICS));
      Object.assign(g, { pics: order.slice(0, [2, 2, 3][g.tier - 1]), round: 0, total: 0, sel: -1, shake: {}, st: 'paint', stT: 0, mist: 0 });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      g.pic = CBN_PICS[g.pics[g.round]];
      g.grid = g.pic.rows.map(r => r.split('').map(Number));
      g.fill = g.grid.map(r => r.map(() => -1)); // time it was filled, or -1
      Object.assign(g, { sel: -1, st: 'paint', stT: 0, mist: 0 });
      g.say = `Let's make a ${g.pic.name}! Pick a colour, then tap its number.`;
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      g.stT += dt;
      for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
      const n = g.pic.pal.length;
      if (g.st === 'paint') {
        const k = id?.startsWith('cb:') ? +id.slice(3) : numKey(n);
        if (k >= 0) { g.sel = k; tone(500 + k * 80, 0.1, 'triangle', 0.07); speak(`${k + 1}, ${g.pic.pal[k][1]}`); }
        if (pointer.clicked && !id) {
          const c = Math.floor((pointer.x - CB.x0) / CB.cell), r = Math.floor((pointer.y - CB.y0) / CB.cell);
          if (r >= 0 && r < 9 && c >= 0 && c < 9 && g.fill[r][c] < 0) {
            const num = g.grid[r][c];
            if (g.sel < 0) speak('Pick a colour from the key first!');
            else if (num === g.sel + 1) {
              // flood-fill every connected square with the same number, rippling out from the tap
              const q = [[r, c, 0]]; g.fill[r][c] = g.stT; let count = 0;
              while (q.length) {
                const [y, x, d] = q.shift(); count++;
                for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                  const ny = y + dy, nx = x + dx;
                  if (ny >= 0 && ny < 9 && nx >= 0 && nx < 9 && g.fill[ny][nx] < 0 && g.grid[ny][nx] === num) { g.fill[ny][nx] = g.stT + (d + 1) * 0.04; q.push([ny, nx, d + 1]); }
                }
              }
              SFX.pop(); tone(660, 0.15, 'sine', 0.06, 0.05);
              if (g.fill.every(row => row.every(v => v >= 0))) {
                g.st = 'yay'; g.yayAt = g.stT; SFX.fanfare(); burst(CB.x0 + 180, CB.y0 + 180, 40); // keep stT running: the fill animation is timed by it
                g.total += Math.max(0.3, 1 - 0.07 * g.mist);
                speak(`Beautiful! You made a ${g.pic.name}!`);
              }
            } else {
              g.mist++; g.shake[`${r},${c}`] = 0.4; SFX.miss();
              speak(`That square is number ${num}. Find colour ${num} in the key!`);
            }
          }
        }
      } else if (g.st === 'yay' && g.stT - g.yayAt > 2.4) { g.round++; if (g.round >= g.pics.length) g.done = true; else this.next(g); }
      g.progress = `Picture ${Math.min(g.round + 1, g.pics.length)} of ${g.pics.length}`;
      g.score = g.total / g.pics.length;
    },
    draw(g) {
      panel(CB.x0 - 16, CB.y0 - 12, 9 * CB.cell + 32, 9 * CB.cell + 26, 18);
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        const num = g.grid[r][c], ft = g.fill[r][c], sh = g.shake[`${r},${c}`] ? Math.sin(g.shake[`${r},${c}`] * 50) * 4 : 0;
        const x = CB.x0 + c * CB.cell + sh, y = CB.y0 + r * CB.cell;
        const k = ft >= 0 ? clamp((g.stT - ft) / 0.18, 0, 1) : 0;
        rrect(x + 1, y + 1, CB.cell - 2, CB.cell - 2, 5, '#ffffff', 'rgba(91,63,115,.3)', 1.5);
        if (k > 0) { const s = (CB.cell - 2) * easeOut(k); rrect(x + CB.cell / 2 - s / 2, y + CB.cell / 2 - s / 2, s, s, 5, g.pic.pal[num - 1][0]); }
        if (k < 1) {
          const hl = g.sel === num - 1;
          if (hl) rrect(x + 3, y + 3, CB.cell - 6, CB.cell - 6, 4, `rgba(255,236,120,${0.45 + 0.25 * Math.sin(S.t * 6)})`);
          text(String(num), x + CB.cell / 2, y + CB.cell / 2 + 1, 19, hl ? '#5a2a6e' : '#9a7aaa', 'center', 800);
        }
      }
      if (g.st === 'yay') {
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffd83a'; ctx.strokeRect(CB.x0 - 4, CB.y0 - 4, 9 * CB.cell + 8, 9 * CB.cell + 8);
        outlined(`A ${g.pic.name}!`, CB.x0 + 180, CB.y0 + 9 * CB.cell - 26, 46, '#fff6a8'); // along the bottom so it doesn't hide the picture's face
      }
      // the colour key
      panel(520, 66, 380, 380, 22);
      text('Colour key', 710, 94, 22, '#5a2a6e', 'center', 700);
      g.pic.pal.forEach(([col, name], i) => {
        const y = 116 + i * 64, sel = g.sel === i;
        if (sel) rrect(536, y - 4, 348, 64, 18, '#fff1a8', '#ffb03a', 3);
        button(`cb:${i}`, 546, y, 328, 56, '', { color: '#e8dcf2', on: g.st === 'paint' });
        inkCircle(584, y + 28, 20, col, 1.5);
        outlined(String(i + 1), 584, y + 29, 24, '#fff', 'center');
        text(name, 622, y + 29, 22, '#5a2a6e', 'left', 700);
        if (sel) emoji('🖌️', 846, y + 28, 30);
      });
      if (g.sel < 0 && g.st === 'paint') { darkPanel(540, 452, 340, 40, 20); text('👆 Pick a colour!', 710, 472, 18, '#fff', 'center', 600); }
    },
  };

  // ---- Kitten Roundup (action): tap the scampering kittens to pop them back in their basket
  const KR_SPOTS = [
    { x: 300, y: 390, kind: 'chair', w: 150, h: 120 },
    { x: 610, y: 340, kind: 'yarn', w: 120, h: 80 },
    { x: 820, y: 450, kind: 'quilt', w: 150, h: 70 },
    { x: 470, y: 520, kind: 'pot', w: 80, h: 90 },
  ];
  const KR_BASKET = { x: 100, y: 470 };
  function krSpot(s) {
    const { x, y } = s;
    if (s.kind === 'chair') {
      inkRect(x - 75, y - 120, 150, 90, '#9c6cff', 2.5, 30);
      inkRect(x - 80, y - 60, 160, 50, '#b48cff', 2.5, 16);
      inkRect(x - 88, y - 80, 30, 70, '#8a5cf0', 2.5, 14); inkRect(x + 58, y - 80, 30, 70, '#8a5cf0', 2.5, 14);
      for (const lx of [-66, 60]) inkRect(x + lx, y - 12, 8, 14, '#a0683a', 2, 2);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; for (let i = 0; i < 4; i++) circle(x - 45 + i * 30, y - 90, 5);
    } else if (s.kind === 'yarn') {
      ink(P2(`M${x - 60},${y - 50} L${x + 60},${y - 50} L${x + 50},${y} L${x - 50},${y} Z`), '#d8a060', 1.5);
      for (let i = 0; i < 4; i++) yarnBall(x - 42 + i * 28, y - 58 - (i % 2) * 10, 17, ['#ff5f7e', '#40b0ff', '#ffd83a', '#5adc7a'][i]);
      ink(P2(`M${x - 64},${y - 50} L${x + 64},${y - 50} L${x + 60},${y - 38} L${x - 60},${y - 38} Z`), '#c08848', 1.2);
      ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { line(x - 54, y - 26 + k * 10, x + 54, y - 26 + k * 10); ctx.stroke(); }
    } else if (s.kind === 'quilt') {
      ink(P2(`M${x - 76},${y} Q${x - 70},${y - 64} ${x - 10},${y - 70} Q${x + 60},${y - 76} ${x + 76},${y} Z`), '#ff8fb8', 1.5);
      ctx.save(); ctx.clip(P2(`M${x - 76},${y} Q${x - 70},${y - 64} ${x - 10},${y - 70} Q${x + 60},${y - 76} ${x + 76},${y} Z`));
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = ['#ffd83a', '#8ad4ff', '#a6f0b8', '#c6a2ff'][(i + j) % 4]; if ((i + j) % 2) ctx.fillRect(x - 76 + i * 26, y - 76 + j * 26, 26, 26); }
      ctx.restore();
    } else {
      ink(P2(`M${x - 34},${y - 50} L${x + 34},${y - 50} L${x + 26},${y} L${x - 26},${y} Z`), '#e07a50', 1.5);
      inkRect(x - 38, y - 58, 76, 12, '#f09060', 2, 4);
      for (let k = -2; k <= 2; k++) inkEllipse(x + k * 12, y - 72 - Math.abs(k) * -4, 8, 18, k * 0.3, '#5fc04a', 1);
      flower(x, y - 92, 9, '#ff6fae', '#ffd84a', 1);
    }
  }
  MG.kittenroundup = {
    kind: 'action', title: () => 'Kitten Roundup', icon: () => '🐈',
    how: () => 'The kittens are running wild! Move Aubrey with the arrow keys or your finger. Walk into a kitten to pick it up, then carry it back to the basket. If a kitten hides, walk to its hiding place to find it!',
    init(g) {
      const n = [5, 6, 7][g.tier - 1], spots = KR_SPOTS.slice(0, g.tier === 3 ? 4 : 3);
      g.kits = Array.from({ length: n }, (_, i) => ({ x: rand(240, 880), y: rand(320, 500), tx: 0, ty: 0, st: 'run', t: rand(0, 2), col: KIT_COLS[i % KIT_COLS.length], dir: 1, spot: -1, fx: 0, fy: 0, hopped: 0 }));
      g.kits.forEach(k => this.target(g, k));
      // kittens scamper a bit slower than they used to, because Aubrey has to carry each one home
      Object.assign(g, { spots, timeLeft: [70, 72, 75][g.tier - 1], speed: [55, 72, 88][g.tier - 1], hopT: 10, hops: 0, maxHops: [1, 2, 3][g.tier - 1], endT: 0,
        ax: 420, ay: 450, vx: 0, vy: 0, face: 1, run: 0, carry: null });
    },
    start(g) { g.say = 'Pick up the kittens and carry them to the basket!'; speak('Here, kitty kitty! Pick up the kittens and carry them to the basket!'); },
    target(g, k) { k.tx = rand(220, 900); k.ty = rand(320, 510); },
    // Aubrey scoops a kitten up into her arms
    pickUp(g, k, found) {
      k.st = 'carried'; k.t = 0; k.spot = -1; g.carry = k;
      tone(700, 0.1, 'triangle', 0.08); tone(1000, 0.15, 'sine', 0.06, 0.08); burst(g.ax, g.ay - 60, 8);
      speak(found ? pick(['Found you!', 'Peekaboo, kitty!']) : pick(['Got you!', 'Gotcha, kitty!', 'Mew!']));
    },
    // ...and pops it into the basket
    dropIn(g) {
      const k = g.carry; g.carry = null;
      k.fx = g.ax; k.fy = g.ay - 54; k.st = 'fly'; k.t = 0;
      speak(pick(['In you go!', 'Stay cosy!', 'Home you go!']));
    },
    update(g, dt) {
      g.timeLeft -= dt;
      for (const k of g.kits) {
        k.t += dt;
        if (k.st === 'run' || k.st === 'tohide') {
          const dx = k.tx - k.x, dy = k.ty - k.y, d = Math.hypot(dx, dy);
          if (Math.abs(dx) > 2) k.dir = Math.sign(dx);
          if (d < 6) {
            if (k.st === 'tohide') { k.st = 'hide'; k.t = 0; k.hideFor = rand(2.2, 3.6); }
            else if (Math.random() < 0.45) {
              const free = g.spots.map((_, i) => i).filter(i => !g.kits.some(o => o.spot === i));
              if (free.length) { k.spot = pick(free); const s = g.spots[k.spot]; k.tx = s.x; k.ty = s.y - 20; k.st = 'tohide'; } else { k.st = 'sit'; k.t = 0; k.sitFor = rand(0.5, 1.2); }
            } else { k.st = 'sit'; k.t = 0; k.sitFor = rand(0.4, 1.1); }
          } else { const sp = g.speed * (k.st === 'tohide' ? 1.3 : 1); k.x += dx / d * sp * dt; k.y += dy / d * sp * dt; }
        } else if (k.st === 'sit' && k.t > k.sitFor) { k.st = 'run'; this.target(g, k); }
        else if (k.st === 'hide' && k.t > k.hideFor) { k.st = 'run'; k.spot = -1; this.target(g, k); }
        else if (k.st === 'fly' && k.t >= 0.45) { k.st = 'in'; SFX.pop(); }
        else if (k.st === 'hop' && k.t >= 0.7) { k.st = 'run'; k.x = k.tx; k.y = k.ty; this.target(g, k); }
      }
      // Aubrey walks about the room: keys push her, the pointer leads her
      if (g.endT <= 0) {
        const sp = 260, kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        if (kx || ky) { g.vx = lerp(g.vx, kx * sp, dt * 8); g.vy = lerp(g.vy, ky * sp, dt * 8); }
        else if (pointerMoved(g) || g.usePointer) { g.vx = clamp((pointer.x - g.ax) * 5, -sp, sp); g.vy = clamp((pointer.y + 30 - g.ay) * 5, -sp, sp); }
        else { g.vx *= 1 - dt * 6; g.vy *= 1 - dt * 6; }
        g.ax = clamp(g.ax + g.vx * dt, 60, 920); g.ay = clamp(g.ay + g.vy * dt, 330, 528);
        if (Math.abs(g.vx) > 25) g.face = Math.sign(g.vx);
        g.run = Math.hypot(g.vx, g.vy) > 40 ? g.run + dt : 0;
        if (!g.carry) {
          // walk into a loose kitten to pick it up, or to a hiding place to find the kitten behind it
          const k = g.kits.find(k => (k.st === 'run' || k.st === 'sit' || k.st === 'tohide') && Math.hypot(g.ax - k.x, g.ay - 10 - k.y) < 52);
          if (k) this.pickUp(g, k, false);
          else {
            const si = g.spots.findIndex(s => Math.abs(g.ax - s.x) < s.w / 2 + 24 && g.ay > s.y - 50 && g.ay < s.y + 60);
            const hid = g.kits.find(k => k.st === 'hide' && k.spot === si);
            if (hid) this.pickUp(g, hid, true);
          }
        } else if (Math.hypot(g.ax - KR_BASKET.x, g.ay - KR_BASKET.y) < 120) this.dropIn(g);
      }
      for (const s of g.spots) if (s.wig) s.wig = Math.max(0, s.wig - dt);
      // a cheeky kitten sometimes hops back out of the basket
      const inB = g.kits.filter(k => k.st === 'in');
      g.hopT -= dt;
      if (g.hopT <= 0 && g.hops < g.maxHops && inB.length >= 2 && inB.length < g.kits.length) {
        const k = pick(inB.filter(k => !k.hopped) .length ? inB.filter(k => !k.hopped) : inB);
        k.st = 'hop'; k.t = 0; k.hopped = 1; k.tx = rand(260, 520); k.ty = rand(400, 500); g.hops++; g.hopT = rand(9, 12);
        speak('Oh no, one jumped out!'); tone(900, 0.12, 'triangle', 0.06);
      } else if (g.hopT <= 0) g.hopT = 2;
      const home = g.kits.filter(k => k.st === 'in').length;
      if (home === g.kits.length && g.endT <= 0) { g.endT = 1.2; SFX.sparkle(); speak('All the kittens are home!'); burst(KR_BASKET.x, KR_BASKET.y - 40, 30); }
      if (g.endT > 0) { g.endT -= dt; if (g.endT <= 0) g.done = true; }
      if (g.timeLeft <= 0) g.done = true;
      g.progress = `Kittens home: ${home} of ${g.kits.length}`;
      // a quick round-up is best: past the par time the score slowly drops (by half at most)
      const used = [70, 72, 75][g.tier - 1] - g.timeLeft, par = [35, 40, 45][g.tier - 1];
      g.score = home / g.kits.length * (1 - clamp((used - par) / 40, 0, 0.5));
    },
    kitPos(g, k) {
      const bx = KR_BASKET.x - 40 + (g.kits.indexOf(k) % 4) * 26, by = KR_BASKET.y - 40;
      if (k.st === 'fly') { const e = smooth(k.t / 0.45); return [lerp(k.fx, bx, e), lerp(k.fy, by, e) - Math.sin(e * Math.PI) * 50]; }
      if (k.st === 'carried') return [g.ax + g.face * 4, g.ay - 46 + Math.sin(S.t * 9) * 2];
      if (k.st === 'hop') { const e = smooth(k.t / 0.7); return [lerp(bx, k.tx, e), lerp(by, k.ty, e) - Math.sin(e * Math.PI) * 110]; }
      return [k.x, k.y];
    },
    draw(g) {
      const fg = ctx.createLinearGradient(0, 280, 0, H); fg.addColorStop(0, '#d89a60'); fg.addColorStop(1, '#b07040');
      ctx.fillStyle = fg; ctx.fillRect(0, 280, W, H - 280);
      ctx.strokeStyle = 'rgba(90,50,30,.3)'; ctx.lineWidth = 2;
      for (let x = -200; x < W + 200; x += 70) { line(480 + (x - 480) * 0.6, 280, x, H); ctx.stroke(); }
      for (const y of [318, 370, 440]) { line(0, y, W, y); ctx.stroke(); }
      inkRect(-4, 272, W + 8, 12, '#9a6a44', 2, 0);
      ['#ff8fb8', '#ffd83a', '#8ad4ff', '#a6f0b8', '#c6a2ff'].forEach((c, i) => { ctx.fillStyle = mix(c, '#ffffff', 0.2); ellipse(540, 420, 300 - i * 46, 70 - i * 12); });
      // the kitten basket with its cushion
      const { x: bx, y: by } = KR_BASKET;
      ink(P2(`M${bx - 80},${by - 40} Q${bx},${by - 10} ${bx + 80},${by - 40} L${bx + 70},${by + 20} L${bx - 70},${by + 20} Z`), '#ffb8d8', 1.5);
      const inB = g.kits.filter(k => k.st === 'in');
      inB.forEach((k, i) => { const x = bx - 48 + (i % 4) * 32, y = by - 34 - Math.floor(i / 4) * 16; ctx.save(); ctx.translate(x, y); inkCircle(0, 0, 13, k.col[0], 1.5); ink(P2('M-11,-4 L-9,-18 L-2,-11 Z'), k.col[0], 1); ink(P2('M11,-4 L9,-18 L2,-11 Z'), k.col[0], 1); ctx.fillStyle = OL; circle(-4, -1, 2); circle(4, -1, 2); ctx.restore(); });
      ink(P2(`M${bx - 84},${by - 30} L${bx + 84},${by - 30} L${bx + 72},${by + 26} L${bx - 72},${by + 26} Z`), '#d8a060', 1.5);
      ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 2; for (let k = 1; k < 5; k++) { line(bx - 80 + k * 2, by - 30 + k * 11, bx + 80 - k * 2, by - 30 + k * 11); ctx.stroke(); }
      text(`${inB.length}`, bx, by - 2, 22, '#fff', 'center', 800);
      // hidden kittens first (only their tails peek out), then the hiding places, then the loose kittens
      const order = g.spots.map((s, i) => i).sort((a, b) => g.spots[a].y - g.spots[b].y);
      const loose = g.kits.filter(k => k.st !== 'in' && k.st !== 'hide' && k.st !== 'carried');
      const drawK = k => { const [x, y] = this.kitPos(g, k); drawKitten(x, y, 1, k.col, k.dir, k.t + g.kits.indexOf(k), k.st === 'run' || k.st === 'tohide'); };
      for (const i of order) {
        const s = g.spots[i];
        loose.filter(k => k.y <= s.y - 30 && k.st !== 'fly' && k.st !== 'hop').forEach(k => { if (!k.drawn) { drawK(k); k.drawn = true; } });
        const hid = g.kits.find(k => k.st === 'hide' && k.spot === i);
        if (hid) {
          // a tail flicking out from behind
          ctx.save(); ctx.translate(s.x + s.w / 2 - 10, s.y - 20); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -6, 18 + Math.sin(S.t * 8) * 8, -32); ctx.lineCap = 'round'; inkStroke(hid.col[0], 7, 1.5); ctx.restore();
          if (hid.t > 1) { ctx.save(); ctx.translate(s.x - s.w / 2 + 6, s.y - s.h + 6); inkCircle(0, 0, 12, hid.col[0], 1.2); ctx.fillStyle = OL; circle(-3, -2, 2); circle(4, -2, 2); ctx.restore(); }
        }
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.wig ? Math.sin(s.wig * 40) * 0.04 : 0); ctx.translate(-s.x, -s.y); krSpot(s); ctx.restore();
      }
      // loose kittens behind her, then Aubrey with the kitten in her arms, then the ones in front of her
      loose.forEach(k => { if (!k.drawn && this.kitPos(g, k)[1] <= g.ay) { drawK(k); k.drawn = true; } });
      const fr = g.endT > 0 ? 'twirl' : g.run > 0 ? `run${1 + (Math.floor(g.run * 11) % 5)}` : 'idle_front';
      ctx.fillStyle = 'rgba(60,30,20,.22)'; ellipse(g.ax, g.ay, 24, 6);
      drawAubrey(g.ax, g.ay, fr, g.face, g.endT > 0 ? Math.abs(Math.sin(g.endT * 9)) * 10 : 0, 130 / IMG.idle_front.height);
      if (g.carry) { const [x, y] = this.kitPos(g, g.carry); drawKitten(x, y, 0.9, g.carry.col, g.face, S.t * 2, false); }
      loose.forEach(k => { if (!k.drawn) drawK(k); k.drawn = false; });
      if (g.carry && g.endT <= 0) {
        // a little arrow points to the basket while she's carrying
        const p = (S.t * 1.5) % 1; ctx.globalAlpha = 1 - p * 0.5;
        outlined(`${g.ax > KR_BASKET.x ? '⬅' : '➡'} basket`, g.ax, g.ay - 150 - p * 4, 16, '#fff6a8'); ctx.globalAlpha = 1;
      }
      if (g.endT > 0) outlined('All home!', W / 2, 200, 54, '#fff6a8');
    },
  };

  restage('cottage', {
    bg: 'cottage_bg',
    games: [['colourbynumber', 'silk', {}], ['kittenroundup', 'silk', {}]],
    intro: ['*:A cosy little cottage with a crackling fire. There are balls of yarn EVERYWHERE!',
      "N:Come in, come in, sweetheart! I'm stitching a new picture for my quilt.",
      'N:Every square has a number. Match it to the right colour of silk, and the picture appears!',
      'A:focused:Numbers and colours. I can do that!'],
    mid: ["N:Oh, how lovely! But... oh my. The kittens woke up from their nap!",
      "N:They're tumbling all over my cottage. Could you pop them back in their basket?",
      'A:laughing:Here, kitty kitty kitty!'],
    outro: ['N:Bless you, dear. Take some of my softest silk and make something beautiful.',
      'A:winky:Oh, I have a VERY special idea...'],
  });

  // ======================================================================== SUNFLOWER MAZE
  BACKDROPS.sunflowers_bg = () => {
    bdSky('#46bcff', '#fff4c8');
    bdSunburst(150, 104);
    bdClouds(3, 'rgba(255,255,255,.92)', 80);
    // rolling fields of far-off sunflowers
    bdHills('#a6dc78', 300, 22, 0.006, 1);
    for (let i = 0; i < 60; i++) { const x = (i * 53) % W, y = 296 - Math.sin(x * 0.006 + 1) * 22 + (i % 4) * 8; ctx.fillStyle = '#ffd23f'; circle(x, y, 5); ctx.fillStyle = '#8a4a22'; circle(x, y, 2); }
    bdHills('#8fd068', 340, 14, 0.01, 3);
    for (let i = 0; i < 40; i++) { const x = (i * 71 + 20) % W, y = 336 - Math.sin(x * 0.01 + 3) * 14 + (i % 3) * 6; ctx.strokeStyle = '#4f9a3a'; ctx.lineWidth = 2; line(x, y, x, y + 14); ctx.stroke(); sunHead(x, y, 9, 0, false); }
    // the maze wall: a dense hedge of sunflowers with an archway in the middle
    for (let i = 0; i < 24; i++) {
      const x = 10 + i * 41, gap = x > 400 && x < 560;
      if (gap) continue;
      const top = 214 + (i * 37) % 30, sw = Math.sin(S.t * 1.3 + i) * 4;
      sunStem(x, 430, top, sw, 6);
    }
    ctx.fillStyle = '#4fae3a'; ctx.fillRect(0, 360, 405, 70); ctx.fillRect(555, 360, W - 555, 70);
    ctx.fillStyle = '#5fc04a'; for (let i = 0; i < 40; i++) { const x = (i * 47) % W; if (x > 400 && x < 560) continue; ellipse(x, 360 + (i % 3) * 18, 18, 9, i); }
    for (let i = 0; i < 24; i++) {
      const x = 10 + i * 41; if (x > 400 && x < 560) continue;
      const top = 214 + (i * 37) % 30, sw = Math.sin(S.t * 1.3 + i) * 4;
      sunHead(x + sw, top, 22, Math.sin(S.t + i) * 0.1, i % 3 === 0);
    }
    // the entrance arch and its sign
    ctx.fillStyle = '#d9b77a'; ctx.beginPath(); ctx.moveTo(420, 430); ctx.lineTo(540, 430); ctx.lineTo(520, 360); ctx.lineTo(440, 360); ctx.fill();
    ctx.fillStyle = 'rgba(40,90,40,.45)'; ctx.fillRect(420, 280, 120, 80);
    for (const x of [410, 540]) inkRect(x - 8, 250, 16, 180, '#b07a48', 2.5, 4);
    ctx.beginPath(); ctx.arc(480, 262, 72, Math.PI, 0); inkStroke('#b07a48', 12, 2);
    for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; flower(480 + Math.cos(a) * 72, 262 + Math.sin(a) * 72, 8, ['#ffd23f', '#ff8fc8', '#fff'][i % 3], '#ff9a2a', 1); }
    inkRect(424, 214, 112, 34, '#fff4d6', 2.5, 10);
    text('MAZE', 480, 232, 22, '#a0583a', 'center', 800);
    // fence, scarecrow, hay bales and squirrels
    for (let x = 0; x < W; x += 60) { if (x > 380 && x < 560) continue; inkRect(x + 22, 396, 12, 48, '#c98a4a', 2, 3); }
    for (const [a, b] of [[0, 400], [560, W]]) { inkRect(a, 406, b - a, 9, '#d8a060', 2, 3); inkRect(a, 424, b - a, 9, '#d8a060', 2, 3); }
    // scarecrow
    const sx = 350, sw = Math.sin(S.t * 1.5) * 0.05;
    ctx.save(); ctx.translate(sx, 440); ctx.rotate(sw);
    inkRect(-4, -170, 8, 170, '#a0683a', 2, 2); inkRect(-60, -132, 120, 8, '#a0683a', 2, 2);
    ink(P2('M-30,-130 L30,-130 L36,-60 L-36,-60 Z'), '#5f9ae0', 1.5);
    ctx.fillStyle = '#ff6f8a'; for (const [px, py] of [[-14, -110], [12, -88], [-6, -74]]) ctx.fillRect(px, py, 10, 10);
    for (const s of [-1, 1]) { ink(P2(`M${s * 30},-130 L${s * 62},-128 L${s * 62},-116 L${s * 30},-110 Z`), '#5f9ae0', 1.2); ctx.fillStyle = '#ffd36a'; for (let k = 0; k < 3; k++) tri(s * 62, -128 + k * 5, s * 62, -124 + k * 5, s * 72, -126 + k * 6); }
    inkCircle(0, -148, 20, '#f2d9a0', 1.5);
    ctx.fillStyle = OL; circle(-7, -151, 2.5); circle(7, -151, 2.5); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -146, 8, 0.4, Math.PI - 0.4); ctx.stroke();
    ink(P2('M-30,-160 L30,-160 L18,-170 L12,-190 L-12,-190 L-18,-170 Z'), '#c98a4a', 1.5);
    ctx.fillStyle = '#ff5f7e'; ctx.fillRect(-14, -174, 28, 5);
    ctx.restore();
    const crowY = 280 + Math.sin(S.t * 3) * 3; emoji('🐦‍⬛', 300, crowY, 22);
    for (const [x, y] of [[800, 444], [860, 452]]) { inkRect(x - 36, y - 40, 72, 44, '#f2d074', 2.5, 10); ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { line(x - 32, y - 40 + k * 11, x + 32, y - 40 + k * 11); ctx.stroke(); } }
    emoji('🐿️', 66, 386 + Math.abs(Math.sin(S.t * 3)) * -6, 32);
    emoji('🐿️', 832, 384 + Math.abs(Math.sin(S.t * 2.6 + 1)) * -5, 30);
    // towering sunflowers in front at the edges, nodding in the breeze
    for (const [x, top, r] of [[30, 120, 40], [140, 160, 34], [610, 200, 26], [860, 130, 42], [940, 180, 34]]) {
      const sw = Math.sin(S.t * 1.1 + x) * 6;
      sunStem(x, 470, top, sw, 9);
      sunHead(x + sw, top, r, Math.sin(S.t * 0.9 + x) * 0.08, true);
    }
    // ground, path into the maze, and bits of clover
    ctx.fillStyle = '#7fcc5a'; ctx.fillRect(0, 440, W, H - 440);
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; line(0, 440, W, 440); ctx.stroke();
    ctx.fillStyle = '#e2c486'; ctx.beginPath(); ctx.moveTo(420, 440); ctx.lineTo(540, 440); ctx.quadraticCurveTo(620, 500, 700, H); ctx.lineTo(260, H); ctx.quadraticCurveTo(340, 500, 420, 440); ctx.fill();
    ctx.fillStyle = '#95d877'; for (let i = 0; i < 26; i++) ellipse((i * 149) % W, 470 + (i * 37) % 64, 12, 4);
    for (let i = 0; i < 10; i++) { const x = (i * 97 + 30) % W; if (x > 300 && x < 640) continue; flower(x, 492 + (i % 3) * 16, 6, ['#ffd23f', '#fff', '#ff8fc8'][i % 3], '#ff9a2a', 1); }
    for (let i = 0; i < 8; i++) { ctx.fillStyle = '#5e2c12'; ellipse(360 + (i * 61) % 260, 470 + (i * 23) % 60, 3, 1.6, i); }
    // bees and butterflies
    for (let i = 0; i < 3; i++) emoji('🐝', 200 + i * 280 + Math.sin(S.t * 1.7 + i * 2) * 40, 190 + Math.sin(S.t * 3.1 + i) * 20, 18);
    emoji('🦋', 700 + Math.sin(S.t * 0.8) * 50, 300 + Math.sin(S.t * 2.3) * 16, 22);
  };

  // ---- Seed Breakout (action): bounce a sunflower seed off a leaf paddle to knock the petals loose
  MG.seedbreakout = {
    kind: 'action', title: () => 'Seed Breakout', icon: () => '🌻',
    how: () => 'Move the leaf with the mouse or the arrow keys. Bounce the seed up to knock off all the petals! Don\'t let the seed fall.',
    init(g) {
      const rings = [[[82, 10], [124, 14]], [[82, 12], [124, 16]], [[78, 12], [118, 16], [158, 20]]][g.tier - 1];
      const cy = g.tier === 3 ? 262 : 234;
      g.petals = [];
      rings.forEach(([r, n], ri) => { for (let i = 0; i < n; i++) g.petals.push({ r, a: i / n * Math.PI * 2 + ri * 0.2, ri, alive: true, wob: 0 }); });
      Object.assign(g, { cx: 480, cy, spin: 0, px: 480, pw: [190, 170, 150][g.tier - 1], speed: [300, 350, 390][g.tier - 1], lives: 3, held: true, holdT: 0,
        bx: 480, by: 470, vx: 0, vy: 0, broken: 0, total: g.petals.length, timeLeft: 100, endT: 0, rot: 0 });
    },
    start(g) { g.say = 'Bounce the seed! Knock off the petals!'; speak(g.say); },
    launch(g) { const a = -Math.PI / 2 + rand(-0.5, 0.5); g.vx = Math.cos(a) * g.speed; g.vy = Math.sin(a) * g.speed; g.held = false; SFX.jump(); },
    pos(g, p) { const a = p.a + g.spin; return [g.cx + Math.cos(a) * p.r, g.cy + Math.sin(a) * p.r, a]; },
    update(g, dt) {
      g.timeLeft -= dt; g.spin += dt * 0.18;
      for (const p of g.petals) p.wob = Math.max(0, p.wob - dt * 3);
      if (g.endT > 0) { g.endT -= dt; if (g.endT <= 0) g.done = true; }
      // paddle
      if (goLeft()) g.px -= 560 * dt;
      if (goRight()) g.px += 560 * dt;
      if (pointerMoved(g) && !goLeft() && !goRight()) g.px = pointer.x;
      g.px = clamp(g.px, g.pw / 2 + 20, W - g.pw / 2 - 20);
      if (g.held) {
        g.bx = g.px; g.by = 470; g.holdT += dt;
        if (g.endT <= 0 && (pointer.clicked || pressed[' '] || pressed.arrowup || g.holdT > 2.2)) this.launch(g);
      } else {
        const steps = 4, h = dt / steps;
        for (let s = 0; s < steps; s++) {
          g.bx += g.vx * h; g.by += g.vy * h;
          if (g.bx < 30) { g.bx = 30; g.vx = Math.abs(g.vx); SFX.blip(); }
          if (g.bx > W - 30) { g.bx = W - 30; g.vx = -Math.abs(g.vx); SFX.blip(); }
          if (g.by < 72) { g.by = 72; g.vy = Math.abs(g.vy); SFX.blip(); }
          // the flower's middle is a bumper
          const dx = g.bx - g.cx, dy = g.by - g.cy, d = Math.hypot(dx, dy);
          if (d < 52 + 13) { const nx = dx / d, ny = dy / d, dot = g.vx * nx + g.vy * ny; if (dot < 0) { g.vx -= 2 * dot * nx; g.vy -= 2 * dot * ny; } g.bx = g.cx + nx * 66; g.by = g.cy + ny * 66; tone(330, 0.08, 'sine', 0.06); }
          for (const p of g.petals) {
            if (!p.alive) continue;
            const [x, y] = this.pos(g, p), ex = g.bx - x, ey = g.by - y, e = Math.hypot(ex, ey);
            if (e < 19 + 13) {
              const nx = ex / e, ny = ey / e, dot = g.vx * nx + g.vy * ny;
              if (dot < 0) { g.vx -= 2 * dot * nx; g.vy -= 2 * dot * ny; }
              p.alive = false; g.broken++;
              tone(600 + g.broken * 15, 0.08, 'triangle', 0.07); burst(x, y, 6, { colors: ['#ffd23f', '#ffb02e', '#fff6a8'], spread: 90, up: 20 });
              p.fall = { x, y, vy: -60, rot: 0 };
              break;
            }
          }
          // the leaf paddle
          if (g.vy > 0 && g.by > 470 && g.by < 494 && Math.abs(g.bx - g.px) < g.pw / 2 + 12) {
            // a centred hit sends the seed toward the flower; the leaf's ends angle it off to the side
            const k = clamp((g.bx - g.px) / (g.pw / 2), -1, 1), toFlower = Math.atan2(g.cy - g.by, g.cx - g.bx);
            const a = clamp(toFlower + k * 0.8 + rand(-0.12, 0.12), -Math.PI + 0.35, -0.35);
            g.vx = Math.cos(a) * g.speed; g.vy = Math.sin(a) * g.speed; g.by = 470;
            tone(440, 0.08, 'triangle', 0.07);
          }
          // never let it get stuck going straight across or straight up and down
          if (Math.abs(g.vy) < g.speed * 0.3) g.vy = Math.sign(g.vy || 1) * g.speed * 0.3;
          if (Math.abs(g.vx) < g.speed * 0.12) g.vx = (g.vx < 0 ? -1 : 1) * g.speed * 0.12;
          const sp = Math.hypot(g.vx, g.vy); g.vx *= g.speed / sp; g.vy *= g.speed / sp;
        }
        // the last few petals gently pull the seed toward them so the round can finish
        const left = g.petals.filter(p => p.alive);
        if (left.length && left.length <= Math.ceil(g.total * 0.3) && g.vy < 0) {
          let best = null;
          for (const p of left) { const [x, y] = this.pos(g, p), d = Math.hypot(x - g.bx, y - g.by); if (!best || d < best.d) best = { x, y, d }; }
          const want = Math.atan2(best.y - g.by, best.x - g.bx), cur = Math.atan2(g.vy, g.vx);
          let da = want - cur; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
          const na = cur + clamp(da, -1.6 * dt, 1.6 * dt); g.vx = Math.cos(na) * g.speed; g.vy = Math.sin(na) * g.speed;
        }
        g.rot = Math.atan2(g.vy, g.vx);
        if (g.by > H + 20) {
          g.lives--; SFX.miss(); g.held = true; g.holdT = 0;
          if (g.lives <= 0) { g.endT = 1; speak('Out of seeds! Good try!'); } else speak(g.lives === 1 ? 'Last seed! You can do it!' : 'Oops! Here is another seed.');
        }
      }
      for (const p of g.petals) if (p.fall) { p.fall.vy += 500 * dt; p.fall.y += p.fall.vy * dt; p.fall.rot += dt * 5; if (p.fall.y > H + 20) p.fall = null; }
      if (g.broken >= g.total && g.endT <= 0) { g.endT = 1.3; g.held = true; SFX.sparkle(); speak('All the petals! Hooray!'); burst(g.cx, g.cy, 40); }
      if (g.timeLeft <= 0) g.done = true;
      g.progress = `Petals: ${g.broken} / ${g.total}`;
      g.score = g.broken / g.total;
    },
    draw(g) {
      // stem down to the ground behind the game
      ctx.globalAlpha = 0.6; sunStem(g.cx, H, g.cy + 50, 0, 14); ctx.globalAlpha = 1;
      for (const p of g.petals) {
        if (!p.alive) continue;
        const [x, y, a] = this.pos(g, p);
        inkEllipse(x, y, 21, 12, a, ['#ffd23f', '#ffb02e', '#ff8a3a'][p.ri], 1.5);
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(x - Math.cos(a) * 5, y - Math.sin(a) * 5, 8, 3, a);
      }
      inkCircle(g.cx, g.cy, 52, '#8a4a22', 2);
      ctx.fillStyle = '#5e2c12'; for (let i = 0; i < 40; i++) { const a = i * 2.4, d = Math.sqrt(i / 40) * 44; circle(g.cx + Math.cos(a) * d, g.cy + Math.sin(a) * d, 2.4); }
      ctx.fillStyle = '#2a1408'; circle(g.cx - 14, g.cy - 6, 5); circle(g.cx + 14, g.cy - 6, 5);
      ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(g.cx, g.cy + 4, 14, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,120,.6)'; circle(g.cx - 26, g.cy + 8, 6); circle(g.cx + 26, g.cy + 8, 6);
      for (const p of g.petals) if (p.fall) inkEllipse(p.fall.x, p.fall.y, 18, 10, p.fall.rot, '#ffd23f', 1.2);
      // leaf paddle
      const px = g.px, w = g.pw;
      ink(P2(`M${px - w / 2},482 Q${px},458 ${px + w / 2},482 Q${px},502 ${px - w / 2},482 Z`), '#5fc04a', 1.5);
      ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 2; line(px - w / 2 + 10, 482, px + w / 2 - 10, 482); ctx.stroke();
      for (let k = -2; k <= 2; k++) { line(px + k * w / 7, 482, px + k * w / 7 + 12, 474); ctx.stroke(); }
      // the seed
      ctx.save(); ctx.translate(g.bx, g.by); ctx.rotate(g.rot);
      inkEllipse(0, 0, 18, 12, 0, '#3a2a2a', 1.5);
      ctx.fillStyle = '#f4ecd8'; for (const y of [-5, 0, 5]) ctx.fillRect(-14, y - 1.2, 28, 2.4);
      ctx.restore();
      if (g.held && g.endT <= 0) { darkPanel(W / 2 - 150, 410, 300, 38, 19); text('Tap or press space to launch!', W / 2, 429, 16, '#fff', 'center', 600); }
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < g.lives ? 1 : 0.25; ctx.save(); ctx.translate(40 + i * 30, 516); ctx.rotate(-0.6); inkEllipse(0, 0, 11, 7, 0, '#3a2a2a', 1.2); ctx.restore(); }
      ctx.globalAlpha = 1;
      if (g.endT > 0 && g.broken >= g.total) outlined('All the petals!', W / 2, 140, 46, '#fff6a8');
    },
  };

  // ---- How Tall? (learn): measure sunflowers with stacks of blocks or acorns
  const HT = { base: 452, U: 32 };
  function htUnit(x, y, kind, i, lit) {
    if (kind === 'block') { inkRect(x - 15, y - HT.U + 1, 30, HT.U - 2, lit ? '#fff1a8' : RAIN[i % 6], 2, 5); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x - 11, y - HT.U + 4, 22, 3); }
    else {
      inkEllipse(x, y - 12, 11, 13, 0, lit ? '#fff1a8' : '#c98a4a', 1.2);
      ink(P2(`M${x - 13},${y - 20} Q${x},${y - 34} ${x + 13},${y - 20} Z`), '#8a5a3a', 1.2);
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; line(x, y - 28, x + 2, y - 33); ctx.stroke();
    }
  }
  MG.howtallsunflower = {
    kind: 'learn', title: () => 'How Tall?', icon: () => '📏',
    how: () => 'Measure the sunflowers! Count the blocks or acorns stacked beside them, and find which sunflower is taller or shorter.',
    init(g) {
      const rounds = [5, 6, 6][g.tier - 1];
      const plan = g.tier === 1 ? ['count', 'taller', 'count', 'shorter', 'count'] : ['count', 'taller', 'count', 'shorter', 'tallest', g.tier === 3 ? 'shortest' : 'count'];
      Object.assign(g, { plan: plan.slice(0, rounds), rounds, round: 0, total: 0, shake: {} });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const q = g.plan[g.round], maxH = [6, 8, 10][g.tier - 1];
      g.q = q; g.kind = g.round % 2 ? 'acorn' : 'block'; g.tries = 0; g.st = 'pick'; g.stT = 0; g.counted = 0; g.tried = [];
      if (q === 'count') {
        g.hs = [randInt(3, maxH)];
        g.ans = g.hs[0];
        const opts = new Set([g.ans]); while (opts.size < 3) opts.add(clamp(g.ans + pick([-2, -1, 1, 2]), 1, maxH + 1));
        g.choices = shuffle([...opts]);
        g.say = `How many ${g.kind === 'block' ? 'blocks' : 'acorns'} tall is this sunflower?`;
      } else {
        const n = q.endsWith('est') ? 3 : 2;
        let hs; do { hs = Array.from({ length: n }, () => randInt(2, maxH)); } while (new Set(hs).size < n || Math.min(...hs.flatMap((a, i) => hs.filter((_, j) => j !== i).map(b => Math.abs(a - b)))) < 2);
        g.hs = hs;
        const big = q === 'taller' || q === 'tallest';
        g.ans = hs.indexOf(big ? Math.max(...hs) : Math.min(...hs));
        g.say = `Which sunflower is ${q}? Tap it!`;
      }
      if (g.phase === 'play') speak(g.say);
    },
    xs(g) { return g.q === 'count' ? [360] : g.hs.length === 2 ? [300, 620] : [220, 470, 720]; },
    update(g, dt, id) {
      g.stT += dt;
      for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
      if (g.st === 'pick') {
        let pickI = -1;
        if (g.q === 'count') {
          const k = id?.startsWith('ht:') ? +id.slice(3) : numKey(3);
          if (k >= 0 && !g.tried.includes(k)) pickI = k;
          // tapping the stack counts it up, one unit at a time
          if (pointer.clicked && !id && Math.abs(pointer.x - (this.xs(g)[0] + 70)) < 40 && pointer.y > HT.base - g.hs[0] * HT.U - 20 && pointer.y < HT.base + 10) {
            if (g.counted < g.hs[0]) { g.counted++; tone(400 + g.counted * 60, 0.1, 'triangle', 0.07); speak(NUM_WORDS[g.counted]); }
            else { g.counted = 0; SFX.blip(); }
          }
          if (pickI >= 0) {
            g.tried.push(pickI);
            if (g.choices[pickI] === g.ans) this.win(g, `Yes! ${NUM_WORDS[g.ans]} ${g.kind === 'block' ? 'blocks' : 'acorns'} tall!`);
            else { g.tries++; g.shake[pickI] = 0.4; SFX.miss(); speak('Not quite. Tap the stack to count it!'); }
          }
        } else {
          let k = numKey(g.hs.length);
          if (pointer.clicked) this.xs(g).forEach((x, i) => { if (Math.abs(pointer.x - (x + 25)) < 90 && pointer.y > HT.base - g.hs[i] * HT.U - 60 && pointer.y < HT.base + 20) k = i; });
          if (k >= 0 && !g.tried.includes(k)) {
            g.tried.push(k);
            if (k === g.ans) this.win(g, `Yes! That one is ${g.q}. It's ${NUM_WORDS[g.hs[k]]} ${g.kind === 'block' ? 'blocks' : 'acorns'} tall.`);
            else { g.tries++; g.shake[k] = 0.4; SFX.miss(); speak(`Hmm, look again. Count the ${g.kind === 'block' ? 'blocks' : 'acorns'}!`); }
          }
        }
      } else if (g.st === 'yay' && g.stT > 2) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      g.progress = `Question ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    win(g, msg) { g.total += triesScore(g.tries); g.st = 'yay'; g.stT = 0; g.counted = g.q === 'count' ? g.hs[0] : 0; SFX.hit(); speak(msg); burst(W / 2, 200, 24); },
    draw(g) {
      const big = { taller: 'TALLER', shorter: 'SHORTER', tallest: 'TALLEST', shortest: 'SHORTEST' }[g.q];
      panel(W / 2 - 340, 64, 680, 50, 20);
      if (g.q === 'count') text(`How many ${g.kind === 'block' ? 'blocks' : 'acorns'} tall is it?`, W / 2, 89, 24, '#5a2a6e', 'center', 700);
      else { text('Which sunflower is', W / 2 + 40, 89, 24, '#5a2a6e', 'right', 700); outlined(`${big}?`, W / 2 + 50, 89, 28, g.q.startsWith('tall') ? '#ff9a3a' : '#40b0ff', 'left'); }
      // soil strip
      rrect(80, HT.base - 4, 800, 22, 10, '#a86c3c', OL, 2);
      ctx.fillStyle = '#7fcc5a'; for (let x = 90; x < 880; x += 18) ellipse(x, HT.base - 3, 9, 4);
      this.xs(g).forEach((x, i) => {
        const h = g.hs[i], top = HT.base - h * HT.U, sh = g.shake[i] ? Math.sin(g.shake[i] * 50) * 6 : 0;
        const right = g.st === 'yay' && (g.q === 'count' || i === g.ans), wrong = g.tried.includes(i) && g.q !== 'count' && i !== g.ans;
        if (right) { ctx.fillStyle = 'rgba(255,246,168,.6)'; ctx.beginPath(); ctx.roundRect(x - 60, top - 40, 160, h * HT.U + 50, 20); ctx.fill(); }
        const sw = Math.sin(S.t * 1.4 + i) * 2;
        sunStem(x + sh, HT.base, top + 26, sw, 7);
        sunHead(x + sh + sw, top + 26, 26, Math.sin(S.t + i) * 0.06, true);
        // the measuring stack
        const ux = x + 70;
        for (let k = 0; k < h; k++) htUnit(ux, HT.base - k * HT.U, g.kind, k, g.q === 'count' && k < g.counted);
        if (g.q === 'count') for (let k = 0; k < g.counted; k++) outlined(String(k + 1), ux + 34, HT.base - k * HT.U - HT.U / 2, 18, '#fff', 'center');
        ctx.strokeStyle = 'rgba(91,63,115,.6)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; line(x - 30, top, ux + 20, top); ctx.stroke(); ctx.setLineDash([]);
        if (g.q !== 'count' && (g.st === 'yay' || wrong)) { rrect(x - 4, HT.base + 22, 58, 26, 13, 'rgba(48,24,72,.75)'); text(String(h), x + 25, HT.base + 35, 18, '#fff', 'center', 800); }
        if (wrong) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x - 50, top - 30, 150, h * HT.U + 30); }
      });
      if (g.q === 'count') {
        g.choices.forEach((n, i) => {
          const used = g.tried.includes(i) && n !== g.ans;
          button(`ht:${i}`, 640, 150 + i * 92, 220, 76, String(n), { on: g.st === 'pick' && !used, color: used ? '#c9bcd4' : ['#ff6fb5', '#4fa8e0', '#9a6ae0'][i], size: 40, key: String(i + 1) });
        });
        if (g.st === 'pick') text('Tap the stack to count!', 430, HT.base + 50, 16, '#5a2a6e', 'center', 700);
      }
    },
  };

  restage('sunflowers', {
    bg: 'sunflowers_bg',
    games: [['seedbreakout', 'honey', {}], ['howtallsunflower', 'petal', {}]],
    intro: ['*:The sunflowers here are taller than a house, and they all turn to smile at the sun.',
      'N:Chitter chitter! The bees want the big flower\'s petals for honey, but they\'re way too high!',
      'N:Bounce my sunflower seed off a leaf and knock the petals down. Don\'t drop it!',
      'A:excited:Bounce, bounce, bounce!'],
    mid: ['N:Chitter! The bees are so happy! Now help me measure my sunflowers.',
      'N:We stack blocks and acorns next to them. Which one is tallest? How many acorns high?',
      "A:thinking:Let's count and compare!"],
    outro: ['N:Fastest human I ever met — and the cleverest! Take some honey and petals.',
      'A:happy:Thanks, Scamper! Happy measuring!'],
  });
}
