'use strict';
{
  // ===========================================================================
  // SKIPPING STONE CREEK (rebuilt): a babbling creek with stepping stones, lily pads,
  // cattails, a little wooden bridge and Tilly the Turtle.
  //   game 1 (action, shell):  Busy Beaver Dam. Build Bucky the beaver's dam bottom-up
  //     and patch the leaks while the pond fills (deep water pushes harder).
  //   game 2 (learn, berry):   Singing Stones. A creek xylophone: big stones sing low,
  //     little stones sing high. Play Tilly's songs and finish her patterns.
  // ===========================================================================
  const TAU = Math.PI * 2;

  // --- shared creek art --------------------------------------------------------------------
  // a rounded mossy stepping stone (top at y - ry); bob pushes it down into the water
  function cStone(x, y, rx, ry, moss = true, tone = 0) {
    const base = ['#b9b2c8', '#c8bfae', '#a9b4c0'][tone % 3];
    ctx.fillStyle = 'rgba(30,70,110,.25)'; ellipse(x, y + ry * 0.5, rx * 1.1, ry * 0.55);
    const p = new Path2D();
    p.moveTo(x - rx, y);
    p.bezierCurveTo(x - rx, y - ry * 1.3, x + rx, y - ry * 1.3, x + rx, y);
    p.bezierCurveTo(x + rx * 0.9, y + ry * 0.55, x - rx * 0.9, y + ry * 0.55, x - rx, y);
    const gr = ctx.createLinearGradient(0, y - ry, 0, y + ry * 0.5);
    gr.addColorStop(0, mix(base, '#ffffff', 0.35)); gr.addColorStop(1, mix(base, '#3a3050', 0.25));
    ink(p, gr, 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(x - rx * 0.35, y - ry * 0.62, rx * 0.28, ry * 0.16, -0.2);
    if (moss) {
      ctx.fillStyle = '#7ccf5a'; ellipse(x + rx * 0.2, y - ry * 0.72, rx * 0.42, ry * 0.2);
      ctx.fillStyle = '#9fe070'; ellipse(x + rx * 0.3, y - ry * 0.78, rx * 0.22, ry * 0.1);
    }
    // a white lap of water round the base
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y + ry * 0.2, rx * 1.05, ry * 0.42, 0, 0.15, Math.PI - 0.15); ctx.stroke();
  }
  // a lily pad seen from above-ish, with its notch; flower colour optional
  function cPad(x, y, r, flower, rot = 0, sink = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const k = 1 - sink * 0.35;
    const p = new Path2D(); p.moveTo(0, 0); p.ellipse(0, 0, r * k, r * 0.46 * k, 0, 0.32, TAU - 0.32); p.closePath();
    ctx.globalAlpha = 1 - sink * 0.6;
    ink(p, mix('#5fc95a', '#2f7a6a', sink), 1.4);
    ctx.strokeStyle = 'rgba(40,120,50,.55)'; ctx.lineWidth = 1.5;
    for (const a of [0.9, 1.9, 3.1, 4.3, 5.4]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.8 * k, Math.sin(a) * r * 0.36 * k); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(-r * 0.3 * k, -r * 0.15 * k, r * 0.32 * k, r * 0.1 * k);
    ctx.restore(); ctx.globalAlpha = 1;
    if (flower && sink < 0.5) waterLily(x + r * 0.3, y - r * 0.12, r * 0.32, flower);
  }
  function waterLily(x, y, r, col) {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.42;
      const p = new Path2D(); p.ellipse(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.6, r * 0.62, r * 0.28, a, 0, TAU);
      ink(p, i % 2 ? col : mix(col, '#ffffff', 0.45), 0.9);
    }
    ctx.fillStyle = '#ffd84a'; circle(x, y - r * 0.15, r * 0.3);
  }
  function cattails(x, y, n = 4, h = 70, sway = 0) {
    for (let i = 0; i < n; i++) {
      const dx = (i - (n - 1) / 2) * 9, hh = h * (0.75 + ((i * 37) % 10) / 30), sw = Math.sin(S.t * 1.4 + i + x) * 4 + sway;
      ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.quadraticCurveTo(x + dx + sw * 0.4, y - hh * 0.5, x + dx + sw, y - hh); ctx.stroke();
      if (i % 2 === 0) { ctx.strokeStyle = '#5fbf4a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.quadraticCurveTo(x + dx - 14, y - hh * 0.5, x + dx - 20 + sw, y - hh * 0.7); ctx.stroke(); }
      else inkEllipse(x + dx + sw, y - hh + 8, 5, 13, sw * 0.03, '#8a5232', 1);
      if (i % 2) { ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + dx + sw, y - hh - 4); ctx.lineTo(x + dx + sw * 1.1, y - hh - 12); ctx.stroke(); }
    }
  }
  function dragonfly(x, y, col, flip = false) {
    const f = Math.sin(S.t * 46) * 0.35;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(220,245,255,.75)'; ctx.strokeStyle = 'rgba(90,140,180,.6)'; ctx.lineWidth = 1;
    for (const [dx, a] of [[-2, -0.5 - f], [4, -0.3 + f], [-2, 0.5 + f], [4, 0.3 - f]]) {
      ctx.beginPath(); ctx.ellipse(dx + Math.cos(a) * 2, Math.sin(a) * 12, 14, 4, a + Math.PI / 2 * Math.sign(a) * 0.9, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-23, 0); ctx.lineTo(6, 0); ctx.stroke();
    inkCircle(9, 0, 4.5, col, 1);
    ctx.fillStyle = '#1a1030'; circle(10.5, -1.5, 1.6);
    ctx.restore();
  }
  function twinkle(x, y, r, ph) {
    const k = Math.max(0, Math.sin(S.t * 3 + ph));
    if (k > 0.05) star(x, y, r * k, `rgba(255,255,255,${0.9 * k})`, 4);
  }
  // a little moving "babble" of white water lines
  function currentLines(x0, x1, y0, y1, n, speed, alpha = 0.55) {
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    const span = x1 - x0 + 80;
    for (let i = 0; i < n; i++) {
      const x = x0 - 40 + ((i * 173 + S.t * speed) % span), y = y0 + ((i * 47) % Math.max(1, y1 - y0));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 3, x + 26, y); ctx.quadraticCurveTo(x + 34, y + 2, x + 40, y); ctx.stroke();
    }
  }
  function ripple(x, y, k, rx = 40, ry = 10) {
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, 6 + k * rx, 2 + k * ry, 0, 0, TAU); ctx.stroke();
  }
  function mossyRock(x, y, s) {
    const p = P2(`M${x - 40 * s},${y} C${x - 44 * s},${y - 30 * s} ${x - 10 * s},${y - 46 * s} ${x + 10 * s},${y - 40 * s} C${x + 36 * s},${y - 36 * s} ${x + 46 * s},${y - 14 * s} ${x + 42 * s},${y} Z`);
    ink(p, vgrad(y - 46 * s, y, '#d4cede', '#8f88a4'), 1.6);
    ctx.fillStyle = '#6cc04e'; ellipse(x - 2 * s, y - 38 * s, 22 * s, 7 * s, -0.15);
    ctx.fillStyle = '#93dc66'; ellipse(x - 8 * s, y - 41 * s, 10 * s, 3.5 * s, -0.15);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(x - 22 * s, y - 24 * s, 7 * s, 4 * s, -0.5);
  }
  const vgrad = (y0, y1, c0, c1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  function seashell(x, y, r, rot = 0, glow = true) {
    if (glow) {
      const gr = ctx.createRadialGradient(x, y, 2, x, y, r * 2.4);
      gr.addColorStop(0, `rgba(255,250,200,${0.65 + Math.sin(S.t * 5 + x) * 0.2})`); gr.addColorStop(1, 'rgba(255,250,200,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const p = new Path2D(`M0,${r * 0.75} L${-r * 0.32},${r * 0.45} C${-r * 1.2},${r * 0.1} ${-r * 1.15},${-r * 1.05} 0,${-r * 1.05} C${r * 1.15},${-r * 1.05} ${r * 1.2},${r * 0.1} ${r * 0.32},${r * 0.45} Z`);
    const gr = ctx.createLinearGradient(0, -r, 0, r);
    gr.addColorStop(0, '#fff0f4'); gr.addColorStop(1, '#ff9ab8');
    ink(p, gr, 1.4);
    ctx.strokeStyle = '#e8708e'; ctx.lineWidth = 1.4;
    for (const k of [-0.6, -0.3, 0, 0.3, 0.6]) { ctx.beginPath(); ctx.moveTo(0, r * 0.55); ctx.quadraticCurveTo(k * r * 1.1, -r * 0.2, k * r * 0.9, -r * 0.92); ctx.stroke(); }
    ctx.restore();
    twinkle(x + r * 0.8, y - r * 0.8, r * 0.5, x);
  }
  const SKY_FLOWERS = ['#ff6fae', '#ffffff', '#ffd84a', '#c6a2ff', '#ff9a5a'];

  // --- the backdrop ------------------------------------------------------------------------
  // the creek: a wide band across the middle, fed by a winding stream from a waterfall up the hill
  const CREEK = P2('M-10,352 C120,340 260,356 420,344 C500,338 540,318 566,290 C586,268 590,246 604,226 L652,226 C660,250 676,272 700,296 C732,326 790,338 860,340 C900,342 940,338 970,340 L970,436 C860,446 760,430 640,440 C520,450 380,432 240,442 C140,448 60,436 -10,442 Z');
  BACKDROPS.creek2_bg = () => {
    bdSky('#5cc4ff', '#e8fbff');
    bdSunburst(842, 92);
    bdClouds(4, 'rgba(255,255,255,.92)', 74);
    // far blue-green hills, then the near green hills and a row of round trees
    bdHills('#a9dcc8', 236, 24, 0.006, 1);
    bdHills('#8fd48a', 268, 20, 0.009, 3);
    for (const [x, y, r, c] of [[60, 236, 34, '#4fb35a'], [130, 228, 40, '#5fc466'], [214, 240, 30, '#3fa654'], [330, 232, 38, '#5fc466'], [420, 244, 28, '#4fb35a'], [780, 236, 36, '#4fb35a'], [880, 228, 42, '#5fc466'], [948, 244, 28, '#3fa654']]) {
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 4, y, 8, 34);
      inkCircle(x, y, r, c, 1.4, 'rgba(50,90,60,.5)');
      ctx.fillStyle = 'rgba(255,255,255,.18)'; circle(x - r * 0.35, y - r * 0.35, r * 0.35);
    }
    // the meadow on the far bank
    ctx.fillStyle = vgrad(250, 360, '#8fdc6a', '#6cc458'); ctx.fillRect(0, 262, W, 110);
    bdHills('#7fd062', 296, 10, 0.012, 5);
    // a little waterfall tumbling off rocks at the top of the stream
    mossyRock(586, 232, 0.7); mossyRock(672, 232, 0.66);
    const fg = vgrad(196, 236, '#dff6ff', '#8fd8ff');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(602, 200); ctx.quadraticCurveTo(628, 196, 654, 200); ctx.lineTo(656, 236); ctx.lineTo(600, 236); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { const x = 608 + i * 10, k = (S.t * 1.6 + i * 0.3) % 1; ctx.beginPath(); ctx.moveTo(x, 202 + k * 10); ctx.lineTo(x, 214 + k * 18); ctx.stroke(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(600, 236); ctx.lineTo(602, 200); ctx.quadraticCurveTo(628, 196, 654, 200); ctx.lineTo(656, 236); ctx.stroke();
    // the creek itself: outline, then a deep-to-bright fill, then sparkle and babble
    ctx.lineJoin = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(CREEK);
    const wg = ctx.createLinearGradient(0, 226, 0, 446);
    wg.addColorStop(0, '#9fe6ff'); wg.addColorStop(0.45, '#4ec0ec'); wg.addColorStop(1, '#2c8fd2');
    ctx.fillStyle = wg; ctx.fill(CREEK);
    ctx.save(); ctx.clip(CREEK);
    // pale shallows along both banks and a sunny glint
    ctx.strokeStyle = 'rgba(200,245,255,.6)'; ctx.lineWidth = 10; ctx.stroke(CREEK);
    ctx.fillStyle = 'rgba(255,246,170,.5)'; for (let i = 0; i < 5; i++) ellipse(820 + Math.sin(S.t * 2 + i) * 8, 356 + i * 14, 40 - i * 6, 3);
    currentLines(0, W, 360, 430, 13, 46);
    currentLines(560, 720, 240, 330, 4, 18, 0.5);
    for (const [x, y, ph] of [[300, 400, 0], [520, 380, 1.3], [700, 418, 2.1], [90, 392, 0.6]]) ripple(x, y, (S.t * 0.45 + ph) % 1);
    for (let i = 0; i < 16; i++) twinkle(40 + (i * 157) % 900, 356 + (i * 37) % 76, 5 + (i % 3) * 2, i * 1.7);
    ctx.restore();
    // a fish jumps every few seconds
    const jt = (S.t % 5.5) / 1.1;
    if (jt < 1) {
      const fx = 430 + jt * 70, fy = 392 - Math.sin(jt * Math.PI) * 54;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(-Math.cos(jt * Math.PI) * 0.9);
      const body = P2('M-16,0 C-8,-10 10,-10 18,0 C10,9 -8,9 -16,0 Z M-14,0 L-26,-9 L-24,9 Z');
      ink(body, '#ff9a4a', 1.4); ctx.fillStyle = '#1a1030'; circle(11, -2, 2);
      ctx.restore();
      if (jt > 0.85 || jt < 0.15) ripple(jt < 0.5 ? 430 : 500, 394, (jt < 0.5 ? jt : jt - 0.85) * 6, 30, 7);
    }
    // a mama duck and her ducklings paddling along the creek
    const dkx = ((S.t * 14) % (W + 300)) - 150;
    for (let i = 0; i < 4; i++) {
      const x = dkx - i * 34, y = 418 + Math.sin(S.t * 3 + i) * 1.5, s = i ? 0.55 : 0.9;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const body = new Path2D(); body.ellipse(0, -8, 20, 11, 0, 0, TAU);
      const head = new Path2D(); head.arc(14, -24, 10, 0, TAU);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(body); ctx.stroke(head);
      ctx.fillStyle = i ? '#ffe04a' : '#ffffff'; ctx.fill(body); ctx.fill(head);
      ink(P2('M22,-26 C30,-27 34,-24 34,-21 C30,-19 25,-19 22,-21 Z'), '#ff9a2a', 1);
      ctx.fillStyle = '#1a1030'; circle(17, -27, 2.2);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 2, 22 * s, 4, 0, 0, TAU); ctx.stroke();
    }
    // the little wooden bridge over the stream
    ctx.save(); ctx.translate(0, 16); ctx.lineCap = 'round';
    const bp = P2('M542,280 C580,236 680,236 718,280 L718,294 C680,254 580,254 542,294 Z');
    ink(bp, '#c98a4a', 2);
    ctx.strokeStyle = '#9a6034'; ctx.lineWidth = 1.5;
    for (let i = 1; i < 12; i++) { const x = 542 + i * 14.7, k = (x - 630) / 88, y = 262 - (1 - k * k) * 20 + 18; ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x, y); ctx.stroke(); }
    for (let i = 0; i <= 6; i++) {
      const x = 548 + i * 27, k = (x - 630) / 88, y = 274 - (1 - k * k) * 30;
      inkRect(x - 3, y - 26, 6, 28, '#b0703a', 1.2, 2);
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(545, 250); ctx.quadraticCurveTo(630, 196, 715, 250); ctx.stroke();
    ctx.strokeStyle = '#d89a5a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(545, 250); ctx.quadraticCurveTo(630, 196, 715, 250); ctx.stroke();
    // flower boxes on the bridge rail
    for (const x of [590, 670]) for (let j = 0; j < 3; j++) flower(x - 8 + j * 8, 226 - (x === 590 ? 2 : 2), 4, SKY_FLOWERS[(j + x) % 5], '#ffd84a', 0.8);
    ctx.restore();
    // mossy rocks along the banks
    mossyRock(470, 350, 0.6); mossyRock(930, 352, 0.55); mossyRock(20, 446, 0.62); mossyRock(880, 450, 0.7);
    // stepping stones across the wide part of the creek
    for (const [x, y, rx, t] of [[120, 432, 30, 0], [176, 406, 27, 1], [226, 382, 25, 2], [270, 360, 22, 0]]) cStone(x, y, rx, rx * 0.42, true, t);
    // lily pads with water lilies, and a frog on one
    for (const [x, y, r, f, rot] of [[780, 404, 30, '#ff8ac0', 0.1], [840, 384, 22, null, -0.2], [722, 424, 20, '#ffffff', 0.3], [900, 414, 26, '#ffd0ea', 0.2], [380, 372, 18, null, 0.4]]) cPad(x, y + Math.sin(S.t * 1.6 + x) * 1.5, r, f, rot);
    emoji('🐸', 838, 374 + Math.sin(S.t * 1.6 + 840) * 1.5, 22);
    // cattails at the water's edges
    cattails(470, 446, 5, 78); cattails(34, 446, 4, 66); cattails(940, 446, 4, 72); cattails(520, 346, 3, 40); cattails(752, 340, 3, 44);
    // the near bank: lush grass with a soft edge
    ctx.fillStyle = vgrad(436, H, '#86d65e', '#5fb84a');
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 444);
    for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 440 + Math.sin(x * 0.03) * 5);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 444); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 440 + Math.sin(x * 0.03) * 5); ctx.stroke();
    ctx.strokeStyle = '#4ea83e'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 46; i++) { const x = (i * 97) % W, y = 452 + (i * 31) % 80; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 9); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 8); ctx.stroke(); }
    // pebbles, clover, flowers and a toadstool: kept out of where Aubrey and Tilly stand
    for (const [x, y, rx, c] of [[60, 470, 9, '#d8d0e0'], [76, 476, 6, '#c8c0d4'], [440, 500, 8, '#e8e0ec'], [560, 522, 7, '#d8d0e0'], [900, 500, 9, '#c8c0d4'], [918, 508, 6, '#e8e0ec']]) inkEllipse(x, y, rx, rx * 0.6, 0, c, 1);
    for (let i = 0; i < 12; i++) { const x = [30, 110, 150, 380, 420, 470, 540, 600, 860, 900, 940, 340][i], y = 466 + ((i * 29) % 60); flower(x, y, 7, SKY_FLOWERS[i % 5], '#ffd84a', 1.1); }
    for (const x of [500, 950]) { inkRect(x - 2, 488, 5, 11, '#fff6e0', 1, 2); inkEllipse(x, 488, 10, 6, 0, '#ff5f6a', 1); ctx.fillStyle = '#fff'; circle(x - 3, 486, 1.5); circle(x + 4, 487, 1.2); }
    // dragonflies and butterflies flitting over the water
    dragonfly(340 + Math.sin(S.t * 0.6) * 160, 300 + Math.sin(S.t * 1.9) * 26, '#2a9ae8', Math.cos(S.t * 0.6) < 0);
    dragonfly(760 + Math.sin(S.t * 0.8 + 2) * 120, 312 + Math.sin(S.t * 2.3) * 22, '#ff5fa8', Math.cos(S.t * 0.8 + 2) < 0);
    emoji('🦋', 130 + Math.sin(S.t * 0.9) * 60, 290 + Math.sin(S.t * 2.6) * 16, 22);
    emoji('🦋', 900 + Math.sin(S.t * 1.1 + 2) * 40, 470 + Math.sin(S.t * 2.2) * 12, 18);
  };
  // ===========================================================================
  // shared bits for the two creek games
  // ===========================================================================
  // a talk bar: what Tilly is saying right now (also repeated by the 🔊 button)
  function creekCaption(str, y) {
    if (!str) return;
    let size = 19;
    ctx.font = `700 ${size}px ${FONT}`;
    let w = ctx.measureText(str).width;
    if (w > 820) { size = 16; ctx.font = `700 ${size}px ${FONT}`; w = ctx.measureText(str).width; }
    w = Math.min(900, w + 70);
    darkPanel(W / 2 - w / 2, y, w, 40, 20);
    emoji('🐢', W / 2 - w / 2 + 24, y + 20, 20);
    text(str, W / 2 + 12, y + 20, size, '#fff', 'center', 700);
  }
  const creekTalk = (g, s) => { g.msg = s; g.say = s; speak(s); };
  // a rotated rectangle as a path (for sticks)
  function rotRect(cx, cy, len, th, a) {
    const c = Math.cos(a), s = Math.sin(a), p = new Path2D();
    [[-len / 2, -th / 2], [len / 2, -th / 2], [len / 2, th / 2], [-len / 2, th / 2]].forEach(([u, v], i) => {
      const X = cx + u * c - v * s, Y = cy + u * s + v * c;
      if (i) p.lineTo(X, Y); else p.moveTo(X, Y);
    });
    p.closePath();
    return p;
  }
  // a little fish (for the finished beaver pond)
  function pondFish(x, y, s, flip, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    const wig = Math.sin(S.t * 10 + x * 0.1) * 0.25;
    const tailP = P2(`M-14,0 L-28,${-10 + wig * 8} L-27,${10 + wig * 8} Z`);
    const body = P2('M-16,0 C-8,-12 12,-12 20,0 C12,11 -8,11 -16,0 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.stroke(tailP); ctx.stroke(body);
    ctx.fillStyle = mix(col, '#000000', 0.12); ctx.fill(tailP); ctx.fillStyle = col; ctx.fill(body);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(2, -4, 8, 3);
    ctx.fillStyle = '#fff'; circle(11, -3, 3.2); ctx.fillStyle = '#1a1030'; circle(12, -3, 1.8);
    ctx.restore();
  }
  // a floating duck seen from the side
  function pondDuck(x, y, s, dir, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    const body = P2('M-22,-6 C-22,-20 0,-20 12,-12 C20,-8 22,0 14,4 L-16,4 C-22,2 -26,-2 -22,-6 Z M-22,-8 L-30,-16 L-24,-4 Z');
    const head = new Path2D(); head.arc(12, -24, 10, 0, TAU);
    ctx.strokeStyle = OL; ctx.lineWidth = 3.6; ctx.lineJoin = 'round'; ctx.stroke(body); ctx.stroke(head);
    ctx.fillStyle = col; ctx.fill(body); ctx.fill(head);
    ink(P2('M20,-27 C28,-28 32,-25 32,-22 C28,-20 23,-20 20,-22 Z'), '#ff9a2a', 1);
    ctx.fillStyle = '#1a1030'; circle(15, -27, 2.2);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ellipse(-4, -6, 10, 5, -0.3);
    ctx.restore();
  }

  // ===========================================================================
  // GAME 1 (action, shell): Busy Beaver Dam.
  // A cut-away view of the creek. Tilly's friend Bucky the beaver builds a dam, and the
  // player taps the glowing spots to place each piece, bottom row first: heavy stones, then
  // logs, then sticks, then leafy branches on top. The creek keeps pouring in, so the pond
  // behind the dam rises, but only as high as the finished rows. Leaks pop open in the
  // dam (more often down low, where the water pushes hardest) and squirt out: the deeper
  // the leak, the farther it squirts. Tap a leak and Bucky packs it with mud.
  // Fill the pond to the line and fish, frogs and ducks move in.
  // Teaches: water flows downhill and pools behind a dam; deep water pushes harder;
  //   beavers build with stones, logs, sticks and mud, and their ponds make homes.
  // ===========================================================================
  const BED = 500, DCX = 470, PW = 60, RH = 50;
  const DAM_ROWS = { 1: [5, 4, 3], 2: [5, 4, 3, 2], 3: [6, 5, 4, 3] };
  const damMats = n => (n === 3 ? ['stone', 'log', 'leafy'] : ['stone', 'log', 'stick', 'leafy']);
  const DAM_WORD = { stone: 'stones', log: 'logs', stick: 'sticks', leafy: 'leafy branches' };
  const DAM_FACT = {
    stone: 'Heavy stones hold the bottom steady.',
    log: 'Beavers cut logs with their strong orange teeth!',
    stick: 'Sticks fill in the gaps.',
  };
  const STONE_TONES = ['#b9b2c8', '#c8bfae', '#a9b4c0', '#c4b6c8'];
  // the left (uphill) bank: a flat top, then a slope down to the creek bed
  const hillX = y => 40 + 150 * Math.pow(clamp((y - 236) / 264, 0, 1), 0.75);

  // the shapes of one dam piece, as [path, fill] parts (outlined together, then filled)
  function damParts(p, x, y) {
    const out = [], sd = p.seed;
    if (p.mat === 'stone') {
      const rx = PW * 0.6 + (sd % 3) * 1.5, ry = RH * 0.58;
      const path = new Path2D();
      path.moveTo(x - rx, y + ry * 0.25);
      path.bezierCurveTo(x - rx * 1.02, y - ry * 1.15, x + rx * 0.85, y - ry * 1.2, x + rx, y - ry * 0.05);
      path.bezierCurveTo(x + rx * 1.06, y + ry * 1.05, x - rx * 0.92, y + ry * 1.12, x - rx, y + ry * 0.25);
      out.push([path, STONE_TONES[sd % 4]]);
    } else if (p.mat === 'log') {
      const path = new Path2D(); path.roundRect(x - PW * 0.62, y - RH * 0.44, PW * 1.24, RH * 0.88, RH * 0.44);
      out.push([path, sd % 2 ? '#b8794a' : '#a86c40']);
      const end = new Path2D(); end.ellipse(x + PW * 0.5, y, RH * 0.3, RH * 0.42, 0, 0, TAU);
      out.push([end, '#f2cf98']);
    } else {
      if (p.mat === 'leafy') {
        const mud = new Path2D(); mud.ellipse(x, y + 6, PW * 0.6, RH * 0.42, 0, 0, TAU);
        out.push([mud, '#8a5a3a']);
      }
      [[-13, -0.32], [0, 0.12], [13, -0.08]].forEach(([dy, a], k) => {
        out.push([rotRect(x + ((sd + k) % 3 - 1) * 4, y + dy * (p.mat === 'leafy' ? 0.8 : 1), PW * 1.28, 9, a + ((sd * 7 + k) % 5 - 2) * 0.05), ['#9a6034', '#b5763e', '#8a5030'][k]]);
      });
      if (p.mat === 'leafy') {
        for (const [dx, dy, a] of [[-18, -18, -0.6], [6, -22, 0.3], [22, -12, 0.9], [-4, -26, -0.1]]) {
          const lf = new Path2D(); lf.ellipse(x + dx, y + dy, 11, 5.5, a, 0, TAU);
          out.push([lf, (dx + sd) % 2 ? '#6cc04e' : '#8fdc66']);
        }
      }
    }
    return out;
  }
  function damDetails(p, x, y) {
    ctx.lineCap = 'round';
    if (p.mat === 'stone') {
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(x - PW * 0.25, y - RH * 0.28, PW * 0.16, RH * 0.1, -0.3);
      if (p.seed % 2) { ctx.fillStyle = '#7ccf5a'; ellipse(x + PW * 0.12, y - RH * 0.44, PW * 0.22, RH * 0.09); }
    } else if (p.mat === 'log') {
      ctx.strokeStyle = 'rgba(90,50,20,.5)'; ctx.lineWidth = 1.6;
      for (const dy of [-0.18, 0.12]) { ctx.beginPath(); ctx.moveTo(x - PW * 0.45, y + RH * dy); ctx.lineTo(x + PW * 0.2, y + RH * dy + 2); ctx.stroke(); }
      ctx.strokeStyle = '#c99a62'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(x + PW * 0.5, y, RH * 0.17, RH * 0.25, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#c99a62'; circle(x + PW * 0.5, y, 2);
    } else {
      ctx.strokeStyle = 'rgba(255,230,190,.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - PW * 0.45, y - 14); ctx.lineTo(x + PW * 0.3, y - 18); ctx.stroke();
    }
    if (p.patched) {
      // a mud patch packed on by Bucky's paws
      const mx = p.lx, my = p.ly;
      inkEllipse(mx, my, 13, 9, 0.3, '#7a4e30', 1);
      ctx.fillStyle = '#9a6a44'; ellipse(mx - 3, my - 3, 6, 3.5, 0.3);
      ctx.fillStyle = '#5f3a22'; circle(mx + 6, my + 3, 2); circle(mx - 7, my + 4, 1.5);
    }
  }
  function drawBeaver(x, gy, s, dir, act) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(dir * s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,20,60,.22)'; ellipse(0, 0, 36, 6);
    const bob = Math.sin(S.t * 5) * 1.2, slap = act > 0 ? Math.sin(act * 26) * 0.5 : 0;
    ctx.translate(0, bob);
    const tailP = new Path2D(); tailP.ellipse(-36, -12, 22, 9, -0.35 + slap, 0, TAU);
    const body = new Path2D(); body.ellipse(0, -28, 27, 25, 0, 0, TAU);
    const head = new Path2D(); head.arc(22, -54, 17, 0, TAU);
    const earL = new Path2D(); earL.arc(12, -68, 5.5, 0, TAU);
    const earR = new Path2D(); earR.arc(31, -68, 5.5, 0, TAU);
    const footA = new Path2D(); footA.ellipse(-8, -3, 10, 5, 0, 0, TAU);
    const footB = new Path2D(); footB.ellipse(16, -3, 10, 5, 0, 0, TAU);
    const arm = new Path2D(); arm.ellipse(22 + (act > 0 ? 6 : 0), -30 - (act > 0 ? 8 : 0), 6.5, 11, act > 0 ? -0.9 : -0.3, 0, TAU);
    const muzzle = new Path2D(); muzzle.ellipse(33, -49, 10, 8, 0, 0, TAU);
    const all = [[tailP, '#6a4a3a'], [footA, '#5a3a2a'], [footB, '#5a3a2a'], [body, '#a8683a'], [earL, '#9a5e34'], [earR, '#9a5e34'], [head, '#b0703e'], [muzzle, '#e8c49a'], [arm, '#9a5e34']];
    ctx.strokeStyle = OL; ctx.lineWidth = 5;
    for (const [p] of all) ctx.stroke(p);
    for (const [p, c] of all) { ctx.fillStyle = c; ctx.fill(p); }
    // tail cross-hatch, belly, ears, face
    ctx.save(); ctx.clip(tailP); ctx.strokeStyle = '#4a3028'; ctx.lineWidth = 1.4;
    for (let i = -60; i < 0; i += 7) { ctx.beginPath(); ctx.moveTo(i, -26); ctx.lineTo(i + 14, 2); ctx.moveTo(i + 14, -26); ctx.lineTo(i, 2); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#e0b07a'; ellipse(7, -24, 14, 16);
    ctx.fillStyle = '#e89a8a'; circle(12, -68, 2.5); circle(31, -68, 2.5);
    ctx.fillStyle = '#1a1030'; circle(25, -59, 3.4); ctx.fillStyle = '#fff'; circle(26.2, -60.2, 1.2);
    ctx.fillStyle = 'rgba(255,120,150,.45)'; circle(18, -48, 4);
    ctx.fillStyle = '#3a2020'; ellipse(40, -53, 4.5, 3.2);
    ink(P2('M31,-44 L40,-44 L40,-35 C40,-33 31,-33 31,-35 Z'), '#ffa23a', 1);
    ctx.strokeStyle = '#c06a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(35.5, -44); ctx.lineTo(35.5, -34); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,20,.6)'; ctx.lineWidth = 1;
    for (const a of [-0.2, 0.1]) { ctx.beginPath(); ctx.moveTo(38, -48); ctx.lineTo(52, -48 + a * 30); ctx.stroke(); }
    ctx.restore();
  }
  const damRowY = r => BED - RH * (r + 0.5);
  const damRowW = (g, r) => g.rows[r] * PW;
  const nextDamSlot = g => g.pieces.find(p => p.r === g.row && !p.placed);

  function damPlace(g, p) {
    p.placed = true; p.dropT = 0;
    tone(150, 0.14, 'triangle', 0.15, 0, 80); tone(420, 0.06, 'square', 0.03); noise(0.08, 0.03);
    burst(p.x, p.y + RH * 0.4, 6, { colors: ['#c8a880', '#e0d0b0', '#ffffff'], spread: 70, up: 40, size: [2, 4] });
    g.tx = p.x + PW * 0.55; g.ty = p.y + RH * 0.5; g.bdir = -1; g.bIdle = 0; g.bAct = 0.3;
    g.placedN++;
    if (!g.pieces.some(q => q.r === g.row && !q.placed)) {
      const mat = g.mats[g.row];
      g.row++;
      SFX.sparkle();
      burst(DCX, damRowY(g.row - 1), 18, { colors: ['#fff6a8', '#9fe07a', '#7fd0ff'], spread: 120 });
      if (g.row >= g.rows.length) creekTalk(g, 'The dam is built! Fix the leaks while the pond fills up.');
      else creekTalk(g, `${DAM_FACT[mat]} Now ${DAM_WORD[g.mats[g.row]]}!`);
    }
  }
  function damPatch(g, lk) {
    const p = lk.p;
    p.leak = null; p.patched = true; p.lx = lk.x; p.ly = lk.y;
    g.leaks.splice(g.leaks.indexOf(lk), 1);
    g.patchedN++;
    tone(240, 0.1, 'sine', 0.14, 0, 120); tone(180, 0.12, 'triangle', 0.1, 0.06, 90); SFX.pop();
    burst(lk.x, lk.y, 10, { colors: ['#7a4e30', '#9a6a44', '#5f3a22'], spread: 90, up: 30, size: [3, 6] });
    floatText(lk.x + 30, lk.y - 20, pick(['Splat!', 'Patched!', 'Mud!']), '#ffe0a0', false, 22);
    g.tx = lk.x + 40; g.ty = lk.y + 26; g.bdir = -1; g.bIdle = 0; g.bAct = 0.5;
  }
  function damTap(g, x, y) {
    let best = null, bd = 46;
    for (const lk of g.leaks) { const d = Math.hypot(lk.x - x, lk.y - y); if (d < bd) { bd = d; best = lk; } }
    if (best) return damPatch(g, best);
    const slot = g.pieces.find(p => p.r === g.row && !p.placed && Math.abs(p.x - x) < PW * 0.62 && Math.abs(p.y - y) < RH * 0.72);
    if (slot) return damPlace(g, slot);
    const later = g.pieces.find(p => p.r > g.row && !p.placed && Math.abs(p.x - x) < PW * 0.6 && Math.abs(p.y - y) < RH * 0.6);
    if (later) {
      SFX.blip(); floatText(x, y - 20, 'Bottom first!', '#fff6a8', false, 20);
      if (g.T - (g.bottomT ?? -9) > 4) { g.bottomT = g.T; creekTalk(g, 'Build from the bottom up! Tap a glowing spot.'); }
    }
  }

  MG.creekdam = {
    kind: 'action',
    title: () => 'Busy Beaver Dam',
    icon: () => '🦫',
    how: () => 'Help Bucky the beaver build a dam! Tap the glowing spots, bottom row first. Tap any leaks to pack them with mud, and fill the pond up to the line.',
    init(g) {
      const rows = DAM_ROWS[g.tier] || DAM_ROWS[1], mats = damMats(rows.length);
      const pieces = [];
      rows.forEach((n, r) => {
        for (let i = 0; i < n; i++) pieces.push({ r, i, mat: mats[r], x: DCX - n * PW / 2 + PW * (i + 0.5), y: damRowY(r), placed: false, dropT: 1, seed: (r * 7 + i * 13) % 11, patched: false, leak: null });
      });
      const target = rows.length * RH - 16;
      const fillTime = [0, 22, 22, 21][g.tier] || 22;
      Object.assign(g, {
        rows, mats, pieces, row: 0, L: 6, T: 0, inTotal: 0, lost: 0, leaks: [], leakT: 3,
        target, inRate: target / fillTime, leakK: 0.45 * target / fillTime,
        maxLeaks: [0, 2, 3, 4][g.tier] || 2, leakGap: [0, 3.4, 2.7, 2.1][g.tier] || 3.4,
        timeLeft: [0, 60, 58, 56][g.tier] || 60,
        bx: 720, by: BED - 2, tx: 720, ty: BED - 2, bdir: -1, bAct: 0, bIdle: 9,
        spill: 0, win: false, winT: 0, said: {}, msg: '', fill: 0, placedN: 0, patchedN: 0, leakN: 0,
      });
      g.say = 'Tap the glowing spots to build the dam. Tap leaks to fix them!';
      g.progress = 'Pond 0%';
    },
    start(g) { creekTalk(g, 'Tap the glowing spots! Heavy stones go at the bottom.'); },
    update(g, dt) {
      g.T += dt;
      for (const p of g.pieces) if (p.dropT < 1) p.dropT = Math.min(1, p.dropT + dt * 4.5);
      for (const lk of g.leaks) lk.t += dt;
      g.bAct = Math.max(0, g.bAct - dt); g.bIdle += dt;
      if (g.bIdle > 1.6) { g.tx = 720; g.ty = BED - 2; }
      const k = Math.min(1, dt * 9);
      if (Math.abs(g.tx - g.bx) > 2) g.bdir = g.tx < g.bx ? -1 : 1;
      if (g.bIdle > 1.6 && Math.abs(g.tx - g.bx) < 4) g.bdir = -1;
      g.bx = lerp(g.bx, g.tx, k); g.by = lerp(g.by, g.ty, k);
      g.spill = Math.max(0, g.spill - dt * 2);
      if (g.win) {
        g.winT += dt;
        if (Math.random() < 0.25) burst(rand(120, 420), BED - g.L - 10, 2, { colors: ['#fff6a8', '#ffb3e0', '#b8e6ff'], spread: 50 });
        if (g.winT > 4.2) g.done = true;
        return;
      }
      g.timeLeft -= dt;
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; return; }
      // input: tap a leak or a glowing spot; space/enter does the next job
      if (pointer.clicked) damTap(g, pointer.x, pointer.y);
      if (pressed[' '] || pressed.enter) {
        if (g.leaks.length) damPatch(g, g.leaks.reduce((a, b) => (b.y > a.y ? b : a)));
        else { const p = nextDamSlot(g); if (p) damPlace(g, p); }
      }
      // the creek pours in and the pond rises
      const inflow = g.inRate * clamp(g.T / 2.5, 0, 1) * dt;
      g.inTotal += inflow; g.L += inflow;
      let out = 0;
      for (const lk of g.leaks) {
        lk.depth = g.L - (BED - lk.y);
        if (lk.depth > 0) out += g.leakK * Math.sqrt(lk.depth / 100) * dt;
      }
      g.L -= out; g.lost += out;
      const cap = Math.max(6, g.row * RH - 4);
      if (g.L > cap) { g.L = cap; g.spill = 1; }
      g.L = Math.max(4, g.L);
      // new leaks: only below the water, and more often deep down where it pushes hardest
      g.leakT -= dt;
      if (g.leakT <= 0) {
        g.leakT = g.leakGap * rand(0.7, 1.3);
        const cands = g.pieces.filter(p => p.placed && p.dropT >= 1 && !p.patched && !p.leak && (BED - p.y) < g.L - 16);
        if (g.leaks.length < g.maxLeaks && cands.length) {
          let tot = 0; for (const p of cands) tot += g.L - (BED - p.y);
          let r = rand(0, tot), p = cands[0];
          for (const c of cands) { r -= g.L - (BED - c.y); if (r <= 0) { p = c; break; } }
          const lk = { p, x: p.x + rand(-12, 12), y: p.y + rand(-6, 8), t: 0, depth: g.L - (BED - p.y) };
          p.leak = lk; g.leaks.push(lk); g.leakN++;
          tone(900, 0.25, 'sine', 0.05, 0, 1500); noise(0.35, 0.03);
          if (!g.said.leak) { g.said.leak = 1; creekTalk(g, 'A leak! Tap it so Bucky can pack it with mud!'); }
          else if (!g.said.deep && lk.depth > 60) { g.said.deep = 1; creekTalk(g, 'Look! Deep water pushes harder, so low leaks squirt farther!'); }
        }
      }
      g.fill = clamp(g.L / g.target, 0, 1);
      const lf = g.inTotal > 0 ? g.lost / g.inTotal : 0;
      g.score = g.fill * (1 - clamp(lf * 1.3 - 0.04, 0, 0.5));
      g.progress = `Pond ${Math.round(g.fill * 100)}%`;
      if (g.row >= g.rows.length && g.L >= g.target) {
        g.win = true; g.winT = 0; g.fill = 1; g.leaks.forEach(lk => { lk.p.leak = null; }); g.leaks = [];
        g.progress = 'Pond 100%';
        g.score = 1 - clamp(lf * 1.3 - 0.04, 0, 0.5);
        SFX.fanfare(); burst(300, BED - g.L, 30);
        creekTalk(g, 'A beaver pond! Now fish, frogs and ducks have a calm new home.');
      }
    },
    draw(g) {
      const sy = BED - g.L;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // --- the far meadow behind the cut-away creek
      ctx.fillStyle = vgrad(196, BED, '#b6e89a', '#8fd47a');
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 210);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 204 + Math.sin(x * 0.011 + 1) * 8);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 204 + Math.sin(x * 0.011 + 1) * 8); ctx.stroke();
      for (const [x, y, r, c] of [[250, 212, 26, '#5fc466'], [300, 220, 18, '#4fb35a'], [610, 214, 24, '#4fb35a'], [660, 222, 16, '#5fc466'], [760, 208, 30, '#5fc466']]) {
        ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 3, y, 6, 22);
        inkCircle(x, y, r, c, 1.3, 'rgba(50,90,60,.5)');
        ctx.fillStyle = 'rgba(255,255,255,.18)'; circle(x - r * 0.35, y - r * 0.35, r * 0.35);
      }
      for (let i = 0; i < 14; i++) flower(220 + (i * 113) % 560, 238 + (i * 37) % 60, 4, SKY_FLOWERS[i % 5], '#ffd84a', 0.7);
      // --- the soil cut-away: creek bed, uphill bank on the left, low bank on the right
      const soil = vgrad(236, H, '#b88152', '#7a4e30');
      const hill = new Path2D();
      hill.moveTo(-10, H); hill.lineTo(-10, 236); hill.lineTo(40, 236);
      for (let y = 236; y <= BED; y += 8) hill.lineTo(hillX(y), y);
      hill.lineTo(W + 10, BED); hill.lineTo(W + 10, H); hill.closePath();
      const bank = P2(`M800,${BED + 2} C830,${BED - 30} 836,436 872,432 L970,428 L970,${H} L800,${H} Z`);
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(hill); ctx.stroke(bank);
      ctx.fillStyle = soil; ctx.fill(hill); ctx.fill(bank);
      // soil layers, pebbles and roots
      ctx.save(); ctx.clip(hill);
      ctx.fillStyle = 'rgba(255,230,190,.12)'; for (let y = 300; y < H; y += 46) ctx.fillRect(0, y + Math.sin(y) * 4, W, 10);
      for (let i = 0; i < 40; i++) { const x = (i * 131) % W, y = 250 + (i * 71) % 290; if (y < BED && x > hillX(y) - 6) continue; inkEllipse(x, y, 5 + (i % 3) * 2, 3 + (i % 2) * 2, i, ['#d8c8b0', '#c0a888', '#e0d4c0'][i % 3], 0.8); }
      ctx.strokeStyle = 'rgba(80,50,30,.5)'; ctx.lineWidth = 2;
      for (const [x, y] of [[20, 260], [70, 300], [10, 380]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y + 18, x + 4, y + 36); ctx.moveTo(x + 6, y + 14); ctx.lineTo(x + 20, y + 22); ctx.stroke(); }
      ctx.restore();
      // grass on the hill top and the right bank
      ctx.strokeStyle = '#5fb84a'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-10, 236); ctx.lineTo(40, 236); for (let y = 236; y < 300; y += 8) ctx.lineTo(hillX(y), y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(846, 440); ctx.quadraticCurveTo(856, 433, 872, 432); ctx.lineTo(970, 428); ctx.stroke();
      ctx.strokeStyle = '#86d65e'; ctx.lineWidth = 3;
      for (let x = 860; x < W; x += 13) { ctx.beginPath(); ctx.moveTo(x, 432); ctx.lineTo(x - 2, 422); ctx.stroke(); }
      for (let x = 0; x < 40; x += 11) { ctx.beginPath(); ctx.moveTo(x, 236); ctx.lineTo(x - 2, 226); ctx.stroke(); }
      cattails(70, 270, 3, 40); cattails(930, 432, 3, 54);
      flower(850, 452, 6, '#ff6fae', '#ffd84a', 1); flower(940, 470, 6, '#ffffff', '#ffd84a', 1);
      // --- the creek pouring in over the top of the hill
      ctx.strokeStyle = OL; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-10, 232); ctx.lineTo(40, 232); ctx.quadraticCurveTo(54, 234, 58, 244); ctx.lineTo(Math.max(62, hillX(sy) - 4), sy); ctx.stroke();
      ctx.strokeStyle = '#7fd8ff'; ctx.lineWidth = 11; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([10, 12]); ctx.lineDashOffset = -S.t * 60; ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < 3; i++) ripple(Math.max(66, hillX(sy)) + 6, sy, (S.t * 1.4 + i / 3) % 1, 26, 6);
      // --- the pond behind the dam
      const pond = new Path2D();
      pond.moveTo(hillX(sy), sy); pond.lineTo(DCX, sy); pond.lineTo(DCX, BED); pond.lineTo(hillX(BED), BED);
      for (let y = BED; y > sy; y -= 6) pond.lineTo(hillX(y), y);
      pond.closePath();
      const wg = ctx.createLinearGradient(0, sy, 0, BED);
      wg.addColorStop(0, '#8fe0ff'); wg.addColorStop(1, '#2c8fd2');
      ctx.fillStyle = wg; ctx.fill(pond);
      ctx.save(); ctx.clip(pond);
      currentLines(hillX(sy), DCX, sy + 14, BED - 6, 6, 14, 0.35);
      for (let i = 0; i < 8; i++) twinkle(hillX(sy) + 20 + (i * 67) % Math.max(20, DCX - hillX(sy) - 30), sy + 10 + (i * 29) % Math.max(10, g.L - 14), 4, i * 1.3);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
      ctx.beginPath(); for (let x = hillX(sy); x <= DCX; x += 10) ctx.lineTo(x, sy + Math.sin(x * 0.08 + S.t * 3) * 1.5); ctx.stroke();
      // --- the pond line Tilly wants to reach
      const ty = BED - g.target;
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([9, 8]);
      ctx.beginPath(); ctx.moveTo(hillX(ty) + 4, ty); ctx.lineTo(DCX - damRowW(g, g.rows.length - 1) / 2, ty); ctx.stroke(); ctx.setLineDash([]);
      const fx = hillX(ty) - 6;
      inkRect(fx - 3, ty - 40, 6, 46, '#c98a4a', 1, 2);
      ink(P2(`M${fx + 3},${ty - 40} L${fx + 34},${ty - 31} L${fx + 3},${ty - 22} Z`), g.win ? '#ffd84a' : '#ff6fae', 1.2);
      if (!g.win) outlined('fill to here', fx + 40, ty - 13, 14, '#ffffff', 'left');
      // --- the stream below the dam (a trickle, more when water spills or squirts)
      const downW = 8 + g.spill * 6 + g.leaks.length * 2;
      const dx0 = DCX + damRowW(g, 0) / 2 - 10;
      ctx.fillStyle = vgrad(BED - downW, BED, '#9fe6ff', '#4ec0ec');
      ctx.beginPath(); ctx.moveTo(dx0, BED); ctx.lineTo(dx0, BED - downW); for (let x = dx0; x <= 812; x += 12) ctx.lineTo(x, BED - downW + Math.sin(x * 0.1 + S.t * 4) * 1.5); ctx.lineTo(820, BED); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([12, 16]); ctx.lineDashOffset = -S.t * 70;
      ctx.beginPath(); ctx.moveTo(dx0 + 10, BED - downW * 0.5); ctx.lineTo(805, BED - downW * 0.5); ctx.stroke(); ctx.setLineDash([]);
      // --- dam spots still to fill
      for (const p of g.pieces) {
        if (p.placed || p.r < g.row) continue;
        const cur = p.r === g.row, pulse = 0.5 + 0.5 * Math.sin(S.t * 6 + p.i);
        if (cur) {
          ctx.globalAlpha = 0.3 + pulse * 0.15;
          for (const [pp, c] of damParts(p, p.x, p.y)) { ctx.fillStyle = c; ctx.fill(pp); }
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(255,246,170,${0.18 + pulse * 0.22})`; rrect(p.x - PW / 2 + 3, p.y - RH / 2 + 3, PW - 6, RH - 6, 12, ctx.fillStyle);
        }
        ctx.setLineDash([7, 6]); ctx.lineDashOffset = -S.t * 12;
        rrect(p.x - PW / 2 + 3, p.y - RH / 2 + 3, PW - 6, RH - 6, 12, null, cur ? `rgba(255,255,255,${0.7 + pulse * 0.3})` : 'rgba(255,255,255,.3)', cur ? 3 : 2);
        ctx.setLineDash([]);
      }
      // --- the dam itself: every placed piece outlined first, then filled, so it reads as one heap
      const live = g.pieces.filter(p => p.placed).map(p => {
        const e = p.dropT, yo = -(1 - e) * (1 - e) * 140;
        return { p, x: p.x, y: p.y + yo, parts: damParts(p, p.x, p.y + yo) };
      });
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round';
      for (const q of live) for (const [pp] of q.parts) ctx.stroke(pp);
      for (const q of live) for (const [pp, c] of q.parts) { ctx.fillStyle = c; ctx.fill(pp); }
      for (const q of live) damDetails(q.p, q.x, q.y);
      // water spilling over a dam that isn't tall enough yet
      if (g.spill > 0.05 && !g.win) {
        ctx.globalAlpha = Math.min(1, g.spill * 1.5);
        const topY = BED - Math.max(0, g.row) * RH, xr = g.row > 0 ? DCX + damRowW(g, g.row - 1) / 2 : DCX;
        const xl = g.row > 0 ? DCX - damRowW(g, g.row - 1) / 2 : DCX - 40;
        const sheet = new Path2D(); sheet.moveTo(xl, topY - 2); sheet.lineTo(xr - 6, topY - 2); sheet.quadraticCurveTo(xr + 26, topY + 6, xr + 34, BED - 4);
        ctx.strokeStyle = 'rgba(160,225,255,.9)'; ctx.lineWidth = 12; ctx.stroke(sheet);
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -S.t * 90; ctx.stroke(sheet); ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        if (g.row > 0 && g.row < g.rows.length) outlined('Too short! Build higher!', Math.min(xr + 60, 700), Math.min(topY - 30, BED - 120), 17, '#ffffff');
      }
      // --- leaks: a dark crack with a jet that squirts farther the deeper it is
      for (const lk of g.leaks) {
        const depth = Math.max(0, lk.depth), grow = Math.min(1, lk.t * 3);
        inkEllipse(lk.x, lk.y, 7, 5, 0.2, '#2a1a3a', 1);
        if (depth > 0) {
          const len = (26 + depth * 1.25) * grow, ex = lk.x + len, ey = BED - 6;
          const jet = new Path2D(); jet.moveTo(lk.x + 4, lk.y); jet.quadraticCurveTo(lk.x + len * 0.6, lk.y - 6 - depth * 0.08, ex, ey);
          ctx.strokeStyle = OL; ctx.lineWidth = 3 + Math.sqrt(depth) * 0.9 + 3; ctx.stroke(jet);
          ctx.strokeStyle = '#8fdcff'; ctx.lineWidth = 3 + Math.sqrt(depth) * 0.9; ctx.stroke(jet);
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([5, 9]); ctx.lineDashOffset = -S.t * 140; ctx.stroke(jet); ctx.setLineDash([]);
          if (grow >= 1) { for (let i = 0; i < 3; i++) ripple(ex, ey + 2, (S.t * 2 + i / 3) % 1, 16, 4); if (Math.random() < 0.3) burst(ex, ey, 1, { colors: ['#b8e6ff', '#ffffff'], spread: 40, up: 60, size: [2, 3] }); }
        }
        const pr = (S.t * 1.8 + lk.x) % 1;
        ctx.strokeStyle = `rgba(255,236,120,${1 - pr})`; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(lk.x, lk.y, 12 + pr * 22, 0, TAU); ctx.stroke();
      }
      // --- the finished pond comes alive
      if (g.win) {
        const e = Math.min(1, g.winT / 1.2);
        for (const [x, r, f] of [[150, 20, '#ff8ac0'], [250, 16, null], [340, 22, '#ffffff']]) cPad(x, sy + 2, r * e, f, 0.1);
        emoji('🐸', 252, sy - 10 - Math.abs(Math.sin(g.winT * 4)) * 10 * e, 24 * e);
        pondFish(140 + Math.sin(g.winT * 0.9) * 60, sy + 60, 0.9, Math.cos(g.winT * 0.9) < 0, '#ffa03a');
        pondFish(300 + Math.sin(g.winT * 1.2 + 2) * 70, sy + 110, 0.8, Math.cos(g.winT * 1.2 + 2) < 0, '#ff6fae');
        pondFish(380 + Math.sin(g.winT * 0.7 + 1) * 40, sy + 30, 0.7, Math.cos(g.winT * 0.7 + 1) < 0, '#ffd84a');
        const dk = hillX(sy) + 30 + g.winT * 34;
        pondDuck(dk + 80, sy + 2, 0.9, 1, '#ffffff'); pondDuck(dk + 40, sy + 2, 0.55, 1, '#ffe04a'); pondDuck(dk + 10, sy + 2, 0.55, 1, '#ffe04a');
        outlined('A beaver pond!', 300, 150, 44, '#fff6a8');
      }
      // --- Bucky and Tilly
      drawBeaver(g.bx, g.by, 0.9, g.bdir, g.bAct);
      text('Bucky', g.bx, g.by + 16, 13, '#ffffff', 'center', 700);
      drawCritter('Tilly the Turtle', 905, 432, 0.55, -1);
      creekCaption(g.msg, 66);
    },
  };

  // ===========================================================================
  // GAME 2 (learn, berry): Singing Stones.
  // Water drops plink onto stones in the creek and each stone rings like a xylophone bar.
  // The big stones sing LOW and the little ones sing HIGH. Meet the stones, find the
  // lowest and highest, then play Tilly's songs and finish her patterns from a song card
  // where high drops mean high notes. A wrong stone still sings, and Tilly says "too low,
  // try a smaller stone!" (or bigger) so every tap teaches the size and pitch rule.
  // Teaches: bigger things vibrate slower and sound lower; reading high and low on a
  //   simple music card; repeating patterns.
  // ===========================================================================
  // a pentatonic set (C D E G A C), so any tap sounds sweet
  const CH_F = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
  const CH_COL = ['#7f8fe0', '#5fb0e8', '#4fc8b0', '#8fd060', '#ffb84a', '#ff7fae'];
  const CH_TONE = ['#b6aecb', '#c9b9a2', '#a8bccb', '#cdb0c4', '#b4c9a6', '#d9c7a8'];
  const CH_PLAN = {
    1: [{ k: 'meet' }, { k: 'ask', which: 'low' }, { k: 'ask', which: 'high' },
      { k: 'song', name: 'Hot Cross Buns', notes: [2, 1, 0, 2, 1, 0], help: true },
      { k: 'pattern', notes: [0, 3, 0, 3, 0, 3], ask: 1 },
      { k: 'song', name: 'Rain, Rain, Go Away', notes: [3, 2, 3, 3, 2] }],
    2: [{ k: 'meet' }, { k: 'ask', which: 'low' }, { k: 'ask', which: 'high' },
      { k: 'song', name: 'Mary Had a Little Lamb', notes: [2, 1, 0, 1, 2, 2, 2], help: true },
      { k: 'pattern', notes: [0, 2, 4, 0, 2, 4], ask: 1 },
      { k: 'song', name: 'Twinkle, Twinkle', notes: [0, 0, 3, 3, 4, 4, 3] }],
    3: [{ k: 'meet' }, { k: 'ask', which: 'low' }, { k: 'ask', which: 'high' },
      { k: 'song', name: 'Mary Had a Little Lamb', notes: [2, 1, 0, 1, 2, 2, 2] },
      { k: 'pattern', notes: [4, 1, 4, 1, 4, 1], ask: 2 },
      { k: 'song', name: 'Twinkle, Twinkle', notes: [0, 0, 3, 3, 4, 4, 3] },
      { k: 'pattern', notes: [5, 3, 0, 5, 3, 0], ask: 2 },
      { k: 'song', name: 'Climb the Hill', notes: [0, 1, 2, 3, 4, 5] }],
  };
  const LEAF_Y = 262;
  const chime = f => { tone(f, 1.2, 'sine', 0.17); tone(f * 2, 0.4, 'sine', 0.05); tone(f * 3, 0.07, 'triangle', 0.035); };
  const hum = f => { tone(f, 0.46, 'triangle', 0.09); tone(f * 2, 0.3, 'sine', 0.02); };
  const chWanted = st => (st.k === 'ask' ? 1 : st.k === 'song' ? st.notes.length : st.k === 'pattern' ? st.ask : 0);

  function chStone(s, hl) {
    const sing = s.sing, wob = 1 + Math.sin(sing * 34) * 0.08 * sing;
    const x = s.x, base = s.base, rx = s.r, ry = s.ry * wob;
    // glow for the stone Tilly is pointing at
    if (hl) {
      const gr = ctx.createRadialGradient(x, base - ry, 4, x, base - ry, rx * 1.7);
      gr.addColorStop(0, `rgba(255,246,150,${0.65 + Math.sin(S.t * 7) * 0.25})`); gr.addColorStop(1, 'rgba(255,246,150,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - rx * 1.8, base - ry * 2.8, rx * 3.6, ry * 3.6);
    }
    if (sing > 0) {
      const gr = ctx.createRadialGradient(x, base - ry, 4, x, base - ry, rx * 1.6);
      gr.addColorStop(0, mix(CH_COL[s.p], '#ffffff', 0.4) + Math.round(sing * 170).toString(16).padStart(2, '0')); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - rx * 1.7, base - ry * 2.7, rx * 3.4, ry * 3.4);
    }
    ctx.fillStyle = 'rgba(20,60,110,.28)'; ellipse(x, base + 4, rx * 1.12, ry * 0.3);
    const p = new Path2D();
    p.moveTo(x - rx, base);
    p.bezierCurveTo(x - rx * 1.04, base - ry * 1.5, x - rx * 0.4, base - ry * 2.05, x + rx * 0.1, base - ry * 2);
    p.bezierCurveTo(x + rx * 0.8, base - ry * 1.95, x + rx * 1.06, base - ry * 1.2, x + rx, base);
    p.closePath();
    const gr = ctx.createLinearGradient(0, base - ry * 2, 0, base);
    const col = mix(CH_TONE[s.p], CH_COL[s.p], 0.18 + sing * 0.3);
    gr.addColorStop(0, mix(col, '#ffffff', 0.4)); gr.addColorStop(1, mix(col, '#3a3050', 0.22));
    ink(p, gr, 2);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(x - rx * 0.42, base - ry * 1.5, rx * 0.2, ry * 0.12, -0.5);
    ctx.fillStyle = '#7ccf5a'; ellipse(x + rx * 0.25, base - ry * 1.88, rx * 0.34, ry * 0.12, 0.1);
    ctx.fillStyle = '#9fe070'; ellipse(x + rx * 0.32, base - ry * 1.94, rx * 0.16, ry * 0.06, 0.1);
    // a sleepy face that wakes up and sings
    const fy = base - ry * 0.95, ex = rx * 0.3, er = Math.max(3, rx * 0.075);
    if (sing > 0.05) {
      ctx.fillStyle = '#2a1a3a'; circle(x - ex, fy, er * 1.3); circle(x + ex, fy, er * 1.3);
      ctx.fillStyle = '#fff'; circle(x - ex + er * 0.4, fy - er * 0.4, er * 0.45); circle(x + ex + er * 0.4, fy - er * 0.4, er * 0.45);
      inkEllipse(x, fy + rx * 0.24, rx * 0.1 * (0.6 + sing * 0.6), rx * 0.13 * (0.6 + sing * 0.6), 0, '#c0405a', 1);
    } else {
      ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(x - ex, fy - er * 0.4, er, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + ex, fy - er * 0.4, er, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, fy + rx * 0.14, rx * 0.12, 0.3, Math.PI - 0.3); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,120,160,.45)'; circle(x - ex * 1.7, fy + rx * 0.12, rx * 0.09); circle(x + ex * 1.7, fy + rx * 0.12, rx * 0.09);
    // the water laps round its foot
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x, base, rx * 1.04, ry * 0.22, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    if (s.rip < 1) for (let i = 0; i < 2; i++) { const k = Math.min(1, s.rip + i * 0.25); ripple(x, base + 2, k, rx * 1.3, ry * 0.35); }
  }
  // a water drop shape for the song card
  function chDrop(x, y, r, fill, lw = 1.3) {
    const p = P2(`M${x},${y - r * 1.5} C${x + r * 0.5},${y - r * 0.8} ${x + r},${y - r * 0.3} ${x + r},${y + r * 0.2} C${x + r},${y + r * 0.8} ${x + r * 0.55},${y + r} ${x},${y + r} C${x - r * 0.55},${y + r} ${x - r},${y + r * 0.8} ${x - r},${y + r * 0.2} C${x - r},${y - r * 0.3} ${x - r * 0.5},${y - r * 0.8} ${x},${y - r * 1.5} Z`);
    ink(p, fill, lw);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(x - r * 0.35, y - r * 0.1, r * 0.18, r * 0.3, 0.3);
  }
  const chStoneFor = (g, p) => g.stones.find(s => s.p === p);
  function chStrike(g, s, delay = 0) { g.drops.push({ s, t: -delay }); }
  function chNext(g) {
    g.si++;
    g.help = -1; g.tries = 0; g.want = null;
    const st = g.plan[g.si];
    if (!st) {
      g.mode = 'end'; g.timer = 3.4; g.cardHi = -1;
      [...g.stones].sort((a, b) => a.p - b.p).forEach((s, i) => chStrike(g, s, 0.4 + i * 0.16));
      [...g.stones].sort((a, b) => b.p - a.p).forEach((s, i) => chStrike(g, s, 0.4 + (g.stones.length + i) * 0.16));
      creekTalk(g, 'Bravo! You made the whole creek sing!');
      return;
    }
    g.step = st;
    if (st.k === 'meet') {
      g.mode = 'input';
      creekTalk(g, 'Tap every stone to hear it sing!');
    } else if (st.k === 'ask') {
      g.mode = 'input'; g.want = st.which === 'low' ? 0 : g.n - 1;
      creekTalk(g, st.which === 'low' ? 'Which stone sings the LOWEST note? Tap it!' : 'Now which stone sings the HIGHEST note?');
    } else {
      g.seq = st.k === 'song' ? st.notes : st.notes.slice(0, st.notes.length - st.ask);
      g.mode = 'demo'; g.di = 0; g.timer = 2.6; g.pos = 0; g.cardHi = -1;
      creekTalk(g, st.k === 'song' ? `Listen to Tilly's song: ${st.name}!` : 'Listen to the pattern. What comes next?');
    }
  }
  // the player's answer: a stone was tapped while Tilly is waiting
  function chJudge(g, s) {
    const st = g.step;
    if (st.k === 'meet') {
      s.heard = true;
      if (g.stones.every(q => q.heard)) { g.mode = 'wait'; g.timer = 4.2; creekTalk(g, 'Did you hear? Big stones sing low. Little stones sing high!'); }
      return;
    }
    const w = g.want;
    if (s.p === w) {
      g.credit += g.tries === 0 ? 1 : g.tries === 1 ? 0.25 : 0;
      g.tries = 0; g.help = -1;
      SFX.sparkle();
      if (st.k === 'ask') {
        burst(s.x, s.base - s.ry * 2, 16, { colors: ['#fff6a8', CH_COL[s.p], '#ffffff'] });
        g.mode = 'wait'; g.timer = 3.4;
        creekTalk(g, st.which === 'low' ? 'Yes! The biggest stone sings the lowest note!' : 'Yes! The littlest stone sings the highest note!');
        return;
      }
      const at = (st.k === 'song' ? 0 : g.seq.length) + g.pos;
      const nx = chNoteX(g, at), ny = chNoteY(g, st.notes[at]);
      burst(nx, ny, 8, { colors: ['#fff6a8', CH_COL[s.p]], spread: 60, up: 30 });
      g.pos++;
      const need = st.k === 'song' ? st.notes.length : st.ask;
      if (g.pos >= need) {
        g.want = null; g.mode = 'wait'; g.timer = 3;
        burst(W / 2, 130, 24, { colors: ['#fff6a8', '#ffb3e0', '#b8e6ff', '#9fe07a'] });
        creekTalk(g, st.k === 'song' ? pick(['Beautiful! ', 'Wonderful! ', 'Lovely! ']) + `You played ${st.name}!` : 'You finished the pattern!');
      } else g.want = st.notes[at + 1];
      return;
    }
    g.tries++; g.wrongN++;
    if (g.tries >= 2) g.help = g.stones.indexOf(chStoneFor(g, w));
    floatText(s.x, s.base - s.ry * 2 - 30, s.p < w ? 'too low' : 'too high', '#ffe0a0', false, 18);
    if (g.T - g.hintT > 1.3) {
      g.hintT = g.T;
      creekTalk(g, s.p < w ? 'Too low! Try a smaller stone.' : 'Too high! Try a bigger stone.');
    } else g.msg = s.p < w ? 'Too low! Try a smaller stone.' : 'Too high! Try a bigger stone.';
  }
  // song-card layout
  const CARD = { x: 150, y: 70, w: 660, h: 132 };
  const chNoteY = (g, p) => CARD.y + CARD.h - 22 - p * ((CARD.h - 46) / (g.n - 1));
  function chNoteX(g, i) {
    const len = g.step.notes.length, sp = Math.min(72, 440 / Math.max(1, len - 1));
    return CARD.x + 120 + (440 - sp * (len - 1)) / 2 + i * sp + 40;
  }
  function chCard(g) {
    const st = g.step, c = CARD;
    // a wooden sign hung from the branch
    ctx.strokeStyle = OL; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(c.x + 60, c.y + c.h); ctx.lineTo(c.x + 60, 240); ctx.moveTo(c.x + c.w - 60, c.y + c.h); ctx.lineTo(c.x + c.w - 60, 240); ctx.stroke();
    const board = new Path2D(); board.roundRect(c.x, c.y, c.w, c.h, 18);
    ink(board, '#f8e6c0', 2.5);
    ctx.strokeStyle = 'rgba(160,110,60,.25)'; ctx.lineWidth = 2;
    for (const yy of [c.y + 34, c.y + 70, c.y + 104]) { ctx.beginPath(); ctx.moveTo(c.x + 14, yy); ctx.lineTo(c.x + c.w - 14, yy + 2); ctx.stroke(); }
    if (!st) return;
    if (st.k === 'meet') {
      outlined('Tap every stone!', c.x + c.w / 2, c.y + 40, 30, '#ffffff');
      const n = g.n, gap = 64;
      g.stones.forEach((s, i) => {
        const x = c.x + c.w / 2 - (n - 1) * gap / 2 + i * gap, y = c.y + 96;
        inkEllipse(x, y, 10 + s.r * 0.22, 7 + s.r * 0.14, 0, s.heard ? mix(CH_TONE[s.p], CH_COL[s.p], 0.4) : '#e0d6e8', 1.2);
        if (s.heard) text('✓', x, y, 20, '#3a8a3a', 'center', 800);
      });
      return;
    }
    if (st.k === 'ask') {
      const low = st.which === 'low';
      outlined(low ? 'Which stone sings LOW?' : 'Which stone sings HIGH?', c.x + c.w / 2, c.y + 46, 32, '#ffffff');
      text(low ? '🎵 a deep, slow BONG' : '🎵 a tiny, quick TING', c.x + c.w / 2, c.y + 94, 22, '#7a4a2a', 'center', 700);
      return;
    }
    // the music card: lines for each note, high notes up top, low notes at the bottom
    const n = g.n;
    for (let p = 0; p < n; p++) { const y = chNoteY(g, p); ctx.strokeStyle = 'rgba(120,80,40,.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x + 150, y); ctx.lineTo(c.x + c.w - 20, y); ctx.stroke(); }
    // the key: a little stone sings high, a big stone sings low
    const kx = c.x + 62;
    rrect(c.x + 12, c.y + 10, 104, c.h - 20, 12, 'rgba(255,255,255,.55)');
    inkEllipse(kx - 20, c.y + 30, 9, 6, 0, '#d9c7a8', 1); text('high', kx + 4, c.y + 30, 15, '#c0405a', 'left', 800);
    inkEllipse(kx - 20, c.y + c.h - 30, 20, 13, 0, '#b6aecb', 1); text('low', kx + 6, c.y + c.h - 30, 15, '#4a5ab0', 'left', 800);
    ctx.strokeStyle = '#a07040'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(kx - 20, c.y + c.h - 50); ctx.lineTo(kx - 20, c.y + 44); ctx.stroke();
    tri(kx - 26, c.y + 48, kx - 14, c.y + 48, kx - 20, c.y + 40);
    const shownN = st.k === 'song' ? st.notes.length : st.notes.length - st.ask;
    const cur = g.mode === 'input' ? (st.k === 'song' ? g.pos : shownN + g.pos) : -1;
    st.notes.forEach((p, i) => {
      const x = chNoteX(g, i), done = g.mode === 'input' ? i < cur : g.mode === 'wait' || g.mode === 'end';
      const hidden = st.k === 'pattern' && i >= shownN && !(i < cur) && !(g.mode === 'wait' || g.mode === 'end');
      if (hidden) {
        const y = c.y + c.h / 2, bob = i === cur ? Math.sin(S.t * 6) * 3 : 0;
        ctx.setLineDash([5, 5]); ctx.strokeStyle = i === cur ? '#ff6fae' : '#a07040'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y + bob, 17, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        text('?', x, y + bob + 1, 24, i === cur ? '#ff6fae' : '#a07040', 'center', 800);
        return;
      }
      const y = chNoteY(g, p), playing = g.cardHi === i, isCur = i === cur;
      const bob = isCur ? Math.sin(S.t * 6) * 3 : 0, r = playing ? 15 : isCur ? 14 : 12;
      if (isCur || playing) { ctx.fillStyle = 'rgba(255,240,120,.6)'; circle(x, y + bob, 24); }
      chDrop(x, y + bob, r, done ? '#ffd84a' : playing ? mix(CH_COL[p], '#ffffff', 0.2) : '#8fd8ff');
      if (done) twinkle(x + 12, y - 14, 5, i);
    });
  }

  MG.creekchimes = {
    kind: 'learn',
    title: () => 'Singing Stones',
    icon: () => '🎶',
    how: () => 'Tap the creek stones to make them sing. Big stones sing low and little stones sing high! Play Tilly\'s songs and finish her patterns. Keys 1 to 6 work too.',
    init(g) {
      const n = g.tier >= 3 ? 6 : g.tier === 2 ? 5 : 4;
      let order = [...Array(n).keys()];
      if (g.tier > 1) { do order = shuffle(order); while (order.every((p, i) => p === i) || order.every((p, i) => p === n - 1 - i)); }
      const rOf = p => 72 - p * (36 / (n - 1));
      const sum = order.reduce((a, p) => a + rOf(p) * 2, 0), gap = Math.max(14, (760 - sum) / (n - 1));
      let x = 40 + (760 - sum - gap * (n - 1)) / 2;
      const stones = order.map((p, i) => {
        const r = rOf(p), s = { p, r, ry: r * 0.62, x: x + r, base: 436 + ((i * 7) % 3) * 5, sing: 0, rip: 1, heard: false };
        x += r * 2 + gap;
        return s;
      });
      const plan = (CH_PLAN[g.tier] || CH_PLAN[1]).map(s => ({ ...s }));
      Object.assign(g, { n, stones, plan, si: -1, step: null, mode: 'wait', timer: 1.2, drops: [], credit: 0, total: plan.reduce((a, s) => a + chWanted(s), 0),
        tries: 0, help: -1, want: null, pos: 0, seq: [], di: 0, cardHi: -1, T: 0, hintT: -9, wrongN: 0, msg: '' });
      g.say = 'Tap the stones to make them sing!';
      g.progress = `Song card 0/${plan.length}`;
    },
    start(g) { creekTalk(g, 'Water drops make my creek stones sing! Let\'s meet them.'); },
    update(g, dt) {
      g.T += dt;
      for (const s of g.stones) { s.sing = Math.max(0, s.sing - dt * 1.1); s.rip = Math.min(1, s.rip + dt * 1.4); }
      // drops fall from the leaves and plink the stones
      for (let i = g.drops.length - 1; i >= 0; i--) {
        const d = g.drops[i]; d.t += dt;
        if (d.t >= 0.15) {
          g.drops.splice(i, 1);
          const s = d.s; chime(CH_F[s.p]); s.sing = 1; s.rip = 0;
          burst(s.x, s.base - s.ry * 2, 5, { colors: ['#b8e6ff', '#ffffff'], spread: 60, up: 50, size: [2, 4] });
          floatText(s.x + rand(-10, 10), s.base - s.ry * 2 - 14, pick(['♪', '♫']), CH_COL[s.p], false, 30);
        }
      }
      // taps (and number keys) on the stones
      let hit = null;
      if (pointer.clicked) {
        for (const s of g.stones) {
          const dx = (pointer.x - s.x) / (s.r + 12), dy = (pointer.y - (s.base - s.ry)) / (s.ry + 22);
          if (dx * dx + dy * dy < 1) hit = s;
        }
      }
      g.stones.forEach((s, i) => { if (pressed[String(i + 1)]) hit = s; });
      if (hit && g.mode !== 'end') {
        chStrike(g, hit);
        if (g.mode === 'input') chJudge(g, hit);
      }
      // Tilly's demo, the pauses between cards, and the finale
      if (g.mode === 'demo') {
        g.timer -= dt;
        if (g.timer <= 0) {
          if (g.di < g.seq.length) {
            const p = g.seq[g.di];
            g.cardHi = g.di;
            if (g.step.help) chStrike(g, chStoneFor(g, p)); else hum(CH_F[p]);
            floatText(868 + rand(-14, 14), 318, pick(['♪', '♫']), CH_COL[p], false, 26);
            g.di++; g.timer = 0.62;
          } else {
            g.cardHi = -1; g.mode = 'input'; g.pos = 0;
            const st = g.step;
            g.want = st.k === 'song' ? st.notes[0] : st.notes[g.seq.length];
            creekTalk(g, st.k === 'pattern' ? 'Your turn! Tap the stone that comes next.' : g.si <= 3 ? 'Your turn! High drops mean little stones.' : 'Your turn! Play it on the stones.');
          }
        }
      } else if (g.mode === 'wait') {
        g.timer -= dt;
        if (g.timer <= 0) chNext(g);
      } else if (g.mode === 'end') {
        g.timer -= dt;
        if (Math.random() < 0.3) burst(rand(80, 820), rand(280, 380), 2, { colors: ['#fff6a8', '#ffb3e0', '#b8e6ff', '#9fe07a'], spread: 60 });
        if (g.timer <= 0) g.done = true;
      }
      g.score = g.total ? g.credit / g.total : 1;
      g.progress = `Song card ${Math.max(0, Math.min(g.plan.length, g.si + (g.mode === 'wait' || g.mode === 'end' ? 1 : 0)))}/${g.plan.length}`;
    },
    draw(g) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // the far bank, close up: grass, flowers and cattails
      ctx.fillStyle = vgrad(196, 270, '#9fe07a', '#6cc458');
      ctx.beginPath(); ctx.moveTo(0, 290); ctx.lineTo(0, 204);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 200 + Math.sin(x * 0.013) * 6);
      ctx.lineTo(W, 290); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 200 + Math.sin(x * 0.013) * 6); ctx.stroke();
      for (let i = 0; i < 16; i++) flower(20 + i * 61, 226 + (i % 3) * 8, 5, SKY_FLOWERS[i % 5], '#ffd84a', 0.8);
      // the creek, close up
      const water = P2(`M-10,262 C200,252 400,268 600,258 C760,250 880,262 970,256 L970,${H} L-10,${H} Z`);
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(water);
      const wg = ctx.createLinearGradient(0, 252, 0, H);
      wg.addColorStop(0, '#9fe6ff'); wg.addColorStop(0.5, '#4ec0ec'); wg.addColorStop(1, '#2c8fd2');
      ctx.fillStyle = wg; ctx.fill(water);
      ctx.save(); ctx.clip(water);
      ctx.strokeStyle = 'rgba(200,245,255,.55)'; ctx.lineWidth = 10; ctx.stroke(water);
      currentLines(0, W, 290, 520, 14, 36);
      for (let i = 0; i < 14; i++) twinkle(30 + (i * 157) % 900, 290 + (i * 41) % 220, 5 + (i % 3) * 2, i * 1.7);
      for (const [x, y, ph] of [[150, 500, 0], [520, 510, 1.1], [760, 495, 2]]) ripple(x, y, (S.t * 0.4 + ph) % 1, 50, 10);
      ctx.restore();
      cattails(14, 262, 4, 64); cattails(944, 258, 3, 56);
      cPad(500, 512, 24, '#ff8ac0', 0.2); cPad(90, 520, 18, null, -0.3); cPad(690, 524, 20, '#ffffff', 0.4);
      // the overhanging willow branch, with one leaf above each stone to drip from
      const br = P2('M-10,236 C200,226 420,244 640,236 C740,232 800,240 846,250');
      ctx.strokeStyle = OL; ctx.lineWidth = 15; ctx.stroke(br);
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 9; ctx.stroke(br);
      for (const s of g.stones) {
        const sw = Math.sin(S.t * 1.6 + s.x) * 0.08;
        const lf = new Path2D(); lf.ellipse(s.x, LEAF_Y - 14, 10, 20, sw, 0, TAU);
        ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.x, 238); ctx.lineTo(s.x, LEAF_Y - 30); ctx.stroke();
        ink(lf, '#6cc04e', 1.3);
        ctx.strokeStyle = '#4ea83e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, LEAF_Y - 30); ctx.lineTo(s.x, LEAF_Y + 2); ctx.stroke();
        // a drop always hangs ready at the leaf tip
        ctx.fillStyle = 'rgba(190,235,255,.95)'; circle(s.x, LEAF_Y + 8, 4 + Math.sin(S.t * 3 + s.x) * 0.8);
      }
      for (const [x, y, a] of [[60, 232, -0.8], [130, 228, 0.6], [330, 240, -0.5], [560, 236, 0.7], [790, 238, -0.6]]) inkEllipse(x, y, 13, 6, a, '#8fdc66', 1);
      // the stones
      g.stones.forEach((s, i) => chStone(s, g.help === i));
      g.stones.forEach((s, i) => { inkCircle(s.x, s.base + 26, 11, 'rgba(255,255,255,.85)', 0.8); text(String(i + 1), s.x, s.base + 27, 13, '#5a2a6e', 'center', 800); });
      // falling drops
      for (const d of g.drops) {
        if (d.t < 0) continue;
        const s = d.s, k = Math.min(1, d.t / 0.15), y = lerp(LEAF_Y + 8, s.base - s.ry * 2, k * k);
        chDrop(s.x, y, 7, '#bfeaff', 1);
      }
      // Tilly on her rock, humming along
      mossyRock(880, 470, 1.15);
      drawCritter('Tilly the Turtle', 880, 424, 0.58, -1);
      if (g.mode === 'demo' && g.di > 0) emoji('🎵', 840 + Math.sin(S.t * 4) * 6, 300, 22);
      chCard(g);
      creekCaption(g.msg, 492);
    },
  };

  restage('creek', {
    bg: 'creek2_bg',
    games: [['creekdam', 'shell', {}], ['creekchimes', 'berry', {}]],
    intro: [
      "N:Hello, Aubrey! My creek is rushing so fast today that the baby fish can't rest.",
      'N:My friend Bucky the beaver knows a trick. Build a dam of stones, logs and sticks, and a calm pond fills up behind it!',
      'A:determined:Let\'s build it! Bottom first, then up, up, up!',
    ],
    mid: [
      'N:A beaver pond! The fish love it. Now listen... can you hear my creek stones singing?',
      'N:When a water drop taps a stone, it rings! Big stones sing low, and little stones sing high.',
      'A:excited:A creek xylophone! Teach me your songs, Tilly!',
    ],
    outro: [
      'N:What lovely music! Here are my favourite shells, and some berries from the bank.',
      "A:happy:Thank you, Tilly! Big stones sing low, little stones sing high. I'll remember!",
    ],
  });
}
