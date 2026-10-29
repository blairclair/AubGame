'use strict';
{
  // ===========================================================================
  // SKIPPING STONE CREEK (rebuilt): a babbling creek with stepping stones, lily pads,
  // cattails, a little wooden bridge and Tilly the Turtle.
  //   game 1 (action, shell):  Creek Hop. Hop Aubrey across the creek on stepping stones,
  //     lily pads that sink, turtle backs that dive and drifting logs; grab the shells.
  //   game 2 (learn, berry):   Creek Critters. Who lives where? Put each critter in the
  //     air, on the land or in the water of a cut-away creek, then grow a frog in order.
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
  // GAME 1 (action): Creek Hop. A top-down view of the creek. Click a glowing spot to hop
  // Aubrey onto it: mossy stones are always safe, lily pads droop and sink if you stand too
  // long (and jumping fish splash them under), turtle cousins blink, blow bubbles and dive,
  // logs float past, and a duck family paddles through and blocks spots for a moment.
  // A frog friend gives a SUPER HOP over two rows. Quick hops chain into a sparkle combo.
  // Three crossings, each with its own twist: Lily Pad Lane, Turtle Cove, Log Run.
  // ===========================================================================
  const HOP_REACH = 205, SUPER_REACH = 250;
  const HW_TOP = 152, HW_BOT = 452, NEAR_Y = 504, FAR_Y = 134;
  const HOP_TUNE = {
    1: { up: 3.6, warn: 1.5, down: 1.4, pad: 2.6, log: 42, time: 130, rows: 4, shells: 3, fishGap: 8, duckV: 38 },
    2: { up: 3.0, warn: 1.25, down: 1.7, pad: 2.0, log: 56, time: 120, rows: 4, shells: 4, fishGap: 6.5, duckV: 46 },
    3: { up: 2.5, warn: 1.1, down: 1.9, pad: 1.6, log: 66, time: 120, rows: 5, shells: 4, fishGap: 5.5, duckV: 54 },
  };
  // each crossing has its own twist; mix = chances of [stone, pad, turtle] off the safe path
  const HOP_CROSSINGS = [
    { name: 'Lily Pad Lane', say: "Lily Pad Lane! Lily pads droop and sink if you stay too long. Watch out for jumping fish!", mix: [0.38, 0.62, 0], fish: true, ducks: false, logs: 0 },
    { name: 'Turtle Cove', say: 'Turtle Cove! When a turtle blinks and blows bubbles, hop off quick! Let the ducks paddle past.', mix: [0.25, 0.2, 0.55], fish: false, ducks: true, logs: 0 },
    { name: 'Log Run', say: 'Log Run! Ride the floating logs, and hop off before the edge!', mix: [0.25, 0.35, 0.4], fish: true, ducks: false, logs: 1 },
  ];
  const TURTLE_TINTS = [['#7fcf5a', '#c8f07a'], ['#4fbf9a', '#a8f0d0'], ['#9fc84a', '#f0e070']];

  // a little countdown ring: frac = time left (1 = full)
  function timerRing(x, y, frac, col) {
    ctx.fillStyle = 'rgba(255,255,255,.85)'; circle(x, y, 12);
    ctx.strokeStyle = 'rgba(91,63,115,.25)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, 8, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(frac, 0.001, 1)); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.stroke();
  }
  // a stepping stone with foam on its upstream side, a little wake, cracks, moss and a wet shine
  function hopStone(x, y, tone, seed) {
    const f = Math.sin(S.t * 4 + seed) * 2;
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(x - 38, y + 2, 12 + f, 7);
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x, y + 2, 48 + f, 16, 0, Math.PI * 0.55, Math.PI * 1.45); ctx.stroke();
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const w = (S.t * 0.9 + k / 3 + seed) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - w)})`; ctx.beginPath(); ctx.moveTo(x + 36 + w * 30, y - 6 - w * 6); ctx.lineTo(x + 50 + w * 34, y - 6 - w * 8); ctx.moveTo(x + 36 + w * 30, y + 8 + w * 6); ctx.lineTo(x + 50 + w * 34, y + 8 + w * 8); ctx.stroke(); }
    cStone(x, y, 40, 17, true, tone);
    ctx.strokeStyle = 'rgba(70,50,90,.45)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 12, y - 17); ctx.lineTo(x - 6, y - 11); ctx.lineTo(x - 9, y - 5); ctx.moveTo(x - 6, y - 11); ctx.lineTo(x + 2, y - 10); ctx.stroke();
    ctx.fillStyle = '#5fb84a'; for (const [mx, my, r] of [[14, -14, 4], [20, -11, 3], [8, -16, 3]]) circle(x + mx, y + my, r);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(x - 18, y - 12, 6, 2, -0.3);
    twinkle(x - 22, y - 12, 4, seed * 3);
  }
  // a turtle cousin's back from above: eyes = open | blink | closed
  function turtleBack(x, y, st, k, tint, face, eyes) {
    if (st === 'down') {
      ctx.fillStyle = 'rgba(20,70,120,.3)'; ellipse(x, y + 2, 40, 14);
      for (let i = 0; i < 3; i++) {
        const b = (S.t * 1.3 + i / 3 + x * 0.01) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - b)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x - 14 + i * 14, y - 4 - b * 16, 3 + i, 0, TAU); ctx.stroke();
      }
      return;
    }
    const dip = st === 'warn' ? k * 8 : 0, wob = st === 'warn' ? Math.sin(S.t * 34) * 0.06 : 0;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x, y + 2 + dip, 54, 17, 0, 0, TAU); ctx.stroke();
    ctx.save(); ctx.translate(x, y + dip); ctx.rotate(wob); ctx.scale(face, 1);
    ctx.lineJoin = 'round';
    const pad = Math.sin(S.t * 5 + x) * 3;
    const shell = new Path2D(); shell.ellipse(0, -8, 42, 22, 0, 0, TAU);
    const head = new Path2D(); head.ellipse(48, -6, 13, 10, 0, 0, TAU);
    const tl = P2('M-40,-6 L-52,-2 L-40,2 Z');
    const fl = [[-30, -24 - pad, -0.6], [30, -26 + pad, 0.6], [-30, 10 + pad, 0.6], [30, 10 - pad, -0.6]].map(([fx, fy, a]) => { const p = new Path2D(); p.ellipse(fx, fy, 14, 7, a, 0, TAU); return p; });
    // outline every part first, then fill, so the turtle reads as one shape
    ctx.strokeStyle = OL; ctx.lineWidth = 3.5;
    for (const p of [...fl, tl, head, shell]) ctx.stroke(p);
    ctx.fillStyle = mix(tint[0], '#ffffff', 0.3); for (const p of fl) ctx.fill(p); ctx.fill(head); ctx.fill(tl);
    const sg = ctx.createRadialGradient(-10, -18, 4, 0, -8, 46);
    sg.addColorStop(0, mix(tint[0], '#ffffff', 0.15)); sg.addColorStop(1, mix(tint[0], '#2a5a3a', 0.45));
    ctx.fillStyle = sg; ctx.fill(shell);
    // patterned plates: a middle hexagon, a ring of plates and little rim scutes
    const hex = (cx, cy, rx, ry) => { const p = new Path2D(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; p.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); } p.closePath(); return p; };
    ctx.save(); ctx.clip(shell);
    for (const [cx, cy] of [[-22, -16], [0, -22], [22, -16], [-22, 2], [0, 6], [22, 2]]) { const p = hex(cx, cy, 12, 7); ctx.fillStyle = mix(tint[1], tint[0], 0.35); ctx.fill(p); ctx.strokeStyle = mix(tint[0], '#1a3a2a', 0.45); ctx.lineWidth = 1.6; ctx.stroke(p); }
    const mid = hex(0, -8, 14, 8); ctx.fillStyle = tint[1]; ctx.fill(mid); ctx.stroke(mid);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-14, -22, 12, 4, -0.2);
    ctx.restore();
    ctx.strokeStyle = mix(tint[0], '#1a3a2a', 0.4); ctx.lineWidth = 1.4;
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 36, -8 + Math.sin(a) * 18); ctx.lineTo(Math.cos(a) * 41, -8 + Math.sin(a) * 21.5); ctx.stroke(); }
    // a cute face that blinks before diving
    for (const ey of [-10, -2]) {
      if (eyes === 'open') { ctx.fillStyle = '#1a1030'; circle(52, ey, 2.6); ctx.fillStyle = '#fff'; circle(52.7, ey - 0.9, 1); }
      else { ctx.strokeStyle = '#1a1030'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(52, ey - 1, 2.6, 0.2, Math.PI - 0.2); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(255,120,160,.55)'; circle(46, -15, 2.6); circle(46, 3, 2.6);
    ctx.strokeStyle = '#1a1030'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(56, -6, 3, -1, 1); ctx.stroke();
    ctx.restore();
    if (st === 'warn') for (let i = 0; i < 5; i++) {
      const b = (S.t * 2.2 + i / 5) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.95 * (1 - b)})`; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(x - 36 + i * 18, y + 4 - b * 26, 3 + (i % 2) * 2, 0, TAU); ctx.stroke();
    }
  }
  // a floating log from above, with bark, end rings and maybe a frog along for the ride
  function logTop(x, y, len, frog, dir) {
    ctx.fillStyle = 'rgba(20,70,120,.25)'; rrect(x - len / 2, y - 6, len, 22, 11);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const w = (S.t * 1.2 + k / 3) % 1, ex = x - dir * (len / 2 + 6 + w * 40); ctx.globalAlpha = 1 - w; ctx.beginPath(); ctx.moveTo(ex, y - 18 - w * 6); ctx.quadraticCurveTo(ex - dir * 10, y - 4, ex, y + 10 + w * 6); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const p = new Path2D(); p.roundRect(x - len / 2, y - 22, len, 28, 14);
    ink(p, vgrad(y - 22, y + 6, '#c98a52', '#7a4a2a'), 1.8);
    ctx.save(); ctx.clip(p);
    ctx.strokeStyle = 'rgba(90,50,30,.6)'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const lx = x - len / 2 + 14 + i * (len - 28) / 8; ctx.beginPath(); ctx.moveTo(lx, y - 20 + (i % 3) * 3); ctx.quadraticCurveTo(lx + 10, y - 16 + (i % 2) * 6, lx + 22, y - 18 + (i % 3) * 4); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,230,180,.35)'; ctx.fillRect(x - len / 2, y - 22, len, 6);
    ctx.restore();
    for (const ex of [x - len / 2 + 8, x + len / 2 - 8]) {
      inkEllipse(ex, y - 8, 7, 12, 0, '#f0c890', 1.2);
      ctx.strokeStyle = '#c08a50'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(ex, y - 8, 3.5, 6, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(ex, y - 8, 1.2, 2, 0, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = '#7ccf5a'; ellipse(x - len / 4, y - 20, 14, 4); ellipse(x + len / 3, y - 19, 8, 3);
    inkRect(x + len / 6 - 1.5, y - 30, 4, 9, '#fff6e0', 0.8, 2); inkEllipse(x + len / 6, y - 30, 7, 4, 0, '#ff6f7a', 0.8);
    if (frog) ccFrog(x - len / 4 - 6, y - 20 + Math.sin(S.t * 3) * 1, 0.5, dir < 0);
  }
  function duckSide(x, y, s, dir, mama, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    const body = new Path2D(); body.ellipse(0, -8, 20, 11, 0, 0, TAU);
    const head = new Path2D(); head.arc(14, -24 + Math.sin(t * 6) * 1.2, 10, 0, TAU);
    const tl = P2('M-16,-12 L-28,-20 L-24,-8 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    for (const p of [tl, body, head]) ctx.stroke(p);
    ctx.fillStyle = mama ? '#ffffff' : '#ffe04a'; ctx.fill(tl); ctx.fill(body); ctx.fill(head);
    ink(P2(`M-8,-12 C-2,${-20 - Math.sin(t * 9) * 2} 8,-18 10,-10 C2,-6 -4,-7 -8,-12 Z`), mama ? '#eee8f6' : '#ffcf3a', 1);
    ink(P2('M22,-26 C30,-27 34,-24 34,-21 C30,-19 25,-19 22,-21 Z'), '#ff9a2a', 1);
    ctx.fillStyle = '#1a1030'; circle(17, -27, 2.2); ctx.fillStyle = '#fff'; circle(16.4, -27.8, 0.8);
    if (mama) { ctx.fillStyle = '#ff6fae'; circle(8, -33, 4); circle(14, -35, 3); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 2, 24 * s, 5, 0, 0, TAU); ctx.stroke();
  }
  // the banks and the water bed never change, so they're painted once onto their own canvas
  let hopCache = null;
  function hopStatic() {
    if (hopCache) return hopCache;
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR;
    const old = ctx; ctx = cv.getContext('2d'); ctx.scale(DPR, DPR);
    try {
      const topEdge = x => HW_TOP + Math.sin(x * 0.025 + 1) * 5, botEdge = x => HW_BOT + Math.sin(x * 0.03) * 5;
      // far bank
      ctx.fillStyle = vgrad(56, HW_TOP, '#a8e67a', '#6cc458'); ctx.fillRect(0, 56, W, HW_TOP - 30);
      // the water: light sandy shallows by the banks, a deep blue channel in the middle
      const wp = new Path2D(); wp.moveTo(0, topEdge(0)); for (let x = 0; x <= W; x += 12) wp.lineTo(x, topEdge(x));
      for (let x = W; x >= 0; x -= 12) wp.lineTo(x, botEdge(x)); wp.closePath();
      const wg = ctx.createLinearGradient(0, HW_TOP, 0, HW_BOT);
      wg.addColorStop(0, '#b4eee6'); wg.addColorStop(0.14, '#6fd4ee'); wg.addColorStop(0.38, '#3aa0dc'); wg.addColorStop(0.55, '#2a86c8');
      wg.addColorStop(0.75, '#48b4e4'); wg.addColorStop(0.9, '#8ae0ee'); wg.addColorStop(1, '#c0f0e0');
      ctx.fillStyle = wg; ctx.fill(wp);
      ctx.save(); ctx.clip(wp);
      // sand and pebbles seen through the shallows
      ctx.fillStyle = 'rgba(240,220,160,.45)';
      ctx.beginPath(); ctx.moveTo(0, HW_BOT); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, HW_BOT - 26 - Math.sin(x * 0.02) * 8); ctx.lineTo(W, HW_BOT + 10); ctx.lineTo(0, HW_BOT + 10); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, HW_TOP); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, HW_TOP + 20 + Math.sin(x * 0.023) * 6); ctx.lineTo(W, HW_TOP - 10); ctx.lineTo(0, HW_TOP - 10); ctx.fill();
      for (let i = 0; i < 60; i++) {
        const top = i % 2, x = (i * 67) % W + 8, y = top ? HW_TOP + 8 + (i * 7) % 14 : HW_BOT - 8 - (i * 11) % 20;
        ctx.fillStyle = ['rgba(200,180,200,.55)', 'rgba(230,170,160,.5)', 'rgba(170,190,210,.55)'][i % 3];
        ellipse(x, y, 4 + (i % 3) * 2, 2.5 + (i % 2));
      }
      // soft darker channel down the middle
      ctx.fillStyle = 'rgba(20,60,130,.12)';
      ctx.beginPath(); ctx.moveTo(0, 262); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 270 + Math.sin(x * 0.012) * 18); for (let x = W; x >= 0; x -= 20) ctx.lineTo(x, 350 + Math.sin(x * 0.014 + 2) * 16); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(wp);
      // near bank
      ctx.fillStyle = vgrad(HW_BOT, H, '#8ad862', '#5fb84a');
      ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, botEdge(x)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, botEdge(x)); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
      ctx.beginPath(); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, topEdge(x) + 5); ctx.stroke();
      ctx.beginPath(); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, botEdge(x) - 5); ctx.stroke();
      // grass tufts, clover, flowers, pebbles and toadstools on both banks
      ctx.strokeStyle = '#4ea83e'; ctx.lineWidth = 2;
      for (let i = 0; i < 70; i++) { const far = i % 2, x = (i * 131) % W, y = far ? 70 + (i * 23) % 60 : 470 + (i * 17) % 64; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 8); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 7); ctx.stroke(); }
      for (let i = 0; i < 26; i++) { const far = i % 2, x = 24 + (i * 89) % 900, y = far ? 74 + (i * 13) % 50 : 478 + (i * 19) % 50; flower(x, y, 6 + (i % 3), SKY_FLOWERS[i % 5], '#ffd84a', 1); }
      for (const [x, y] of [[150, 96], [420, 120], [610, 90], [300, 520], [840, 512], [60, 505]]) { ctx.fillStyle = '#3f9a3a'; for (const a of [0, 2.1, 4.2]) circle(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 4); }
      for (const [x, y] of [[480, 108], [690, 520], [200, 512]]) { inkRect(x - 2, y, 5, 10, '#fff6e0', 1, 2); inkEllipse(x, y, 9, 5, 0, '#ff5f6a', 1); ctx.fillStyle = '#fff'; circle(x - 3, y - 1, 1.4); }
    } finally { ctx = old; }
    return (hopCache = cv);
  }

  MG.creekhop = {
    kind: 'action', title: () => 'Creek Hop', icon: () => '🐢',
    how: () => 'Hop across the creek to Tilly! Click a glowing spot to jump. Stones are safe, lily pads sink, and turtles dive when they blow bubbles. Grab the shells!',
    init(g) {
      const T = HOP_TUNE[g.tier];
      Object.assign(g, {
        T, R: T.rows, cross: 0, shells: 0, bonus: 0, shellTotal: (T.shells + 1) * 3, splashes: 0, timeLeft: T.time,
        clock: 0, rip: [], drops: [], hop: null, fall: null, win: null, facing: 1, hover: null, banner: 0,
        combo: 0, since: 9, landT: 0, super: false, frog: null, frogT: 5, frogTold: false, jump: null, fishT: 4,
        shadows: Array.from({ length: 4 }, (_, i) => ({ x: rand(0, W), y: 200 + i * 62, v: (i % 2 ? -1 : 1) * rand(30, 55), s: rand(0.8, 1.2) })),
        say: 'Click a glowing spot to hop! Grab the shells and get to Tilly.',
      });
      this.newCrossing(g);
    },
    start(g) { speak(g.cfg.say); },
    rowY(g, i) { return HW_BOT - (i + 0.5) * (HW_BOT - HW_TOP) / g.R; },
    newCrossing(g) {
      const T = g.T, R = g.R, c = g.cross, spots = [];
      const cfg = { ...HOP_CROSSINGS[c] };
      if (g.tier === 3) { if (c === 0) cfg.mix = [0.3, 0.5, 0.2]; if (c === 1) cfg.fish = true; if (c === 2) cfg.logs = 2; }
      g.cfg = cfg;
      const logRows = new Set(cfg.logs === 2 ? [1, 3] : cfg.logs === 1 ? [pick([1, R - 2])] : []);
      for (let i = 0; i < R; i++) {
        const y = this.rowY(g, i), r = i + 1;
        if (logRows.has(i)) {
          const dir = i % 2 ? -1 : 1, off = rand(0, 400), len = g.tier === 3 ? 150 : 170;
          for (let k = 0; k < 3; k++) spots.push({ r, y, x: ((off + k * (W + 240) / 3) % (W + 240)) - 120, kind: 'log', len, v: dir * T.log, bob: 0, frogRide: k === 1 });
        } else {
          for (let x = rand(70, 120); x < W - 60; x += rand(150, 170)) spots.push({ r, y: y + rand(-7, 7), x, kind: 'stone', bob: 0, load: 0, sunk: 0, ph: rand(0, 20), tint: pick(TURTLE_TINTS), tone: randInt(0, 2), face: pick([-1, 1]), flower: pick([null, '#ff8ac0', '#ffffff', '#ffd0ea']), rot: rand(-0.3, 0.3), seed: rand(0, 9) });
        }
      }
      // a safe path of stones from the near bank to the far one, so every crossing is possible
      let px = rand(200, 760); const path = new Set();
      for (let i = 0; i < R; i++) {
        if (logRows.has(i)) continue;
        const row = spots.filter(s => s.r === i + 1);
        const near = row.filter(s => Math.abs(s.x - px) <= HOP_REACH - 30);
        const s = pick(near.length ? near : row.sort((a, b) => Math.abs(a.x - px) - Math.abs(b.x - px)).slice(0, 1));
        path.add(s); px = s.x;
      }
      for (const s of spots) {
        if (s.kind === 'log' || path.has(s)) continue;
        const r = Math.random(), m = cfg.mix;
        s.kind = r < m[0] ? 'stone' : r < m[0] + m[1] ? 'pad' : 'turtle';
      }
      // shells tempt you onto the tricky spots; the golden one (worth 2) sits on the trickiest
      const tricky = shuffle(spots.filter(s => s.kind === 'pad' || s.kind === 'turtle'));
      const rest = shuffle(spots.filter(s => s.kind === 'stone' && !path.has(s)));
      const chosen = [...tricky, ...rest].slice(0, T.shells);
      chosen.forEach(s => { s.shell = 1; });
      const gold = chosen.find(s => s.kind === 'turtle') || chosen.find(s => s.kind === 'pad') || chosen[0];
      if (gold) gold.shell = 2;
      g.spots = spots; g.path = path;
      const first = [...path][0];
      g.on = { kind: 'bank', r: 0, x: clamp(first.x + rand(-60, 60), 70, W - 70), y: NEAR_Y };
      g.ax = g.on.x; g.ay = NEAR_Y; g.safe = g.on;
      Object.assign(g, { hop: null, fall: null, win: null, banner: 2.6, combo: 0, super: false, frog: null, frogT: 4, jump: null, fishT: 4 });
      // the duck family paddles along a middle row
      const duckRows = [...Array(R).keys()].filter(i => !logRows.has(i) && i > 0 && i < R - 1);
      g.ducks = cfg.ducks ? { r: pick(duckRows) + 1, x: -40, dir: 1, n: 4, wait: 2, quack: 0 } : null;
    },
    tState(g, s) {
      const T = g.T, P = T.up + T.warn + T.down, q = (g.clock + s.ph) % P;
      if (q < T.up) return { st: 'up', left: T.up - q, k: q / T.up };
      if (q < T.up + T.warn) return { st: 'warn', left: T.up + T.warn - q, k: (q - T.up) / T.warn };
      return { st: 'down', left: P - q, k: (q - T.up - T.warn) / T.down };
    },
    landX(s, fromX) { return s.kind === 'log' ? clamp(fromX, s.x - s.len / 2 + 22, s.x + s.len / 2 - 22) : s.x; },
    duckXs(d) { return Array.from({ length: d.n }, (_, i) => d.x - d.dir * i * 36); },
    blocked(g, s) {
      const d = g.ducks;
      return !!d && d.r === s.r && s.kind !== 'log' && this.duckXs(d).some(x => Math.abs(x - s.x) < 46);
    },
    targets(g) {
      if (g.hop || g.fall || g.win) return [];
      const cur = g.on, out = [], sup = g.super;
      for (const s of g.spots) {
        if (s === cur) continue;
        const dr = s.r - cur.r, big = sup && dr === 2;
        if (Math.abs(dr) > 1 && !big) continue;
        const lx = this.landX(s, g.ax);
        if (Math.abs(lx - g.ax) > (big ? SUPER_REACH : HOP_REACH) || lx < 40 || lx > W - 40) continue;
        if (this.blocked(g, s)) continue;
        out.push(s);
      }
      if (cur.r === g.R || (sup && cur.r === g.R - 1)) out.push({ kind: 'bank', far: true, r: g.R + 1, x: g.ax, y: FAR_Y });
      if (cur.r === 1) out.push({ kind: 'bank', r: 0, x: g.ax, y: NEAR_Y });
      return out;
    },
    hitTarget(g, list, px, py) {
      let best = null, bd = 1e9;
      for (const s of list) {
        let d;
        if (s.kind === 'bank') d = s.far ? (py < HW_TOP + 6 && py > 62 ? 50 : 1e9) : (py > HW_BOT - 4 ? 50 : 1e9);
        else if (s.kind === 'log') d = Math.abs(py - (s.y - 8)) < 34 && Math.abs(px - s.x) < s.len / 2 + 12 ? Math.abs(py - s.y) : 1e9;
        else { const dx = (px - s.x) / 54, dy = (py - (s.y - 8)) / 38; d = dx * dx + dy * dy <= 1 ? Math.hypot(px - s.x, py - s.y) : 1e9; }
        if (d < bd) { bd = d; best = s; }
      }
      return best;
    },
    hopTo(g, s) {
      if (s.kind === 'bank') { const reach = (g.super ? SUPER_REACH : HOP_REACH) - 20; s = { ...s, x: clamp(s.far && pointer.y < HW_TOP ? pointer.x : g.ax, Math.max(60, g.ax - reach), Math.min(W - 60, g.ax + reach)) }; }
      const lx = this.landX(s, g.ax), big = Math.abs(s.r - g.on.r) === 2 || (s.far && g.on.r === g.R - 1);
      g.hop = { s, off: s.kind === 'log' ? lx - s.x : 0, x0: g.ax, y0: g.ay, t: 0, dur: big ? 0.62 : 0.44, big };
      g.quick = g.since < 1.2 && g.on.kind !== 'bank';
      g.super = false;
      if (Math.abs(lx - g.ax) > 4) g.facing = lx > g.ax ? 1 : -1;
      SFX.jump(); if (big) tone(300, 0.4, 'sine', 0.07, 0, 1000);
    },
    splash(g, msg) {
      g.fall = { t: 0, x: g.ax, y: g.ay };
      g.splashes++; g.combo = 0;
      noise(0.4, 0.08); tone(320, 0.3, 'sine', 0.08, 0, 90); tone(160, 0.3, 'triangle', 0.05, 0.12, 80);
      for (let i = 0; i < 22; i++) { const a = -Math.PI * (0.08 + 0.84 * i / 21); g.drops.push({ x: g.ax, y: g.ay - 6, y0: g.ay + rand(-4, 10), vx: Math.cos(a) * rand(60, 210), vy: Math.sin(a) * rand(220, 380), r: rand(3, 6.5) }); }
      g.rip.push({ x: g.ax, y: g.ay, t: 0, big: true }, { x: g.ax, y: g.ay, t: -0.2, big: true }, { x: g.ax, y: g.ay, t: -0.45, big: true });
      floatText(clamp(g.ax, 140, W - 140), g.ay - 110, msg, '#bfeaff', false, 26);
      g.on = null;
    },
    gotShell(g, s, x, y) {
      const v = s.shell; s.shell = 0; g.shells += v;
      SFX.sparkle(); if (v > 1) tone(1568, 0.3, 'sine', 0.08, 0.2);
      burst(x, y - 30, v > 1 ? 30 : 18, { colors: v > 1 ? ['#ffe070', '#fff6a8', '#ffffff'] : ['#ffb3d0', '#fff6a8', '#ffffff'], spread: 120, up: 120 });
      floatText(x, y - 100, v > 1 ? '+2 🐚 Golden!' : '+1 🐚', v > 1 ? '#ffe070' : '#ffd0e4', false, 26);
    },
    land(g) {
      const { s, off } = g.hop; g.hop = null; g.since = 0; g.landT = 0.18;
      g.rip.push({ x: g.ax, y: g.ay, t: 0 });
      if (s.kind === 'bank') {
        g.on = s; g.ay = s.y;
        if (s.far) {
          g.cross++; g.win = { t: 0 };
          [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, 'triangle', 0.08, i * 0.1));
          for (let i = 0; i < 4; i++) burst(g.ax + (i - 1.5) * 60, g.ay - 60, 14, { colors: ['#ff6fae', '#ffd84a', '#7fd0ff', '#9fe07a', '#c6a2ff'], spread: 200, up: 220 });
          speak(g.cross >= 3 ? 'Hooray! You crossed the whole creek!' : pick(['Hooray! You made it across!', 'Splendid hopping!', 'You did it! Tilly is so happy!']));
        } else g.safe = s;
        return;
      }
      if (s.kind === 'pad' && s.sunk > 0) return this.splash(g, 'Splash! It sank!');
      if (s.kind === 'turtle' && this.tState(g, s).st === 'down') return this.splash(g, 'Splash! The turtle dived!');
      g.on = s; g.off = off; s.bob = 1;
      g.combo = g.quick ? g.combo + 1 : 1;
      SFX.step(); tone([440, 523, 587, 659, 784, 880][Math.min(5, g.combo - 1)], 0.1, 'triangle', 0.07);
      if (g.combo >= 3) floatText(g.ax + 40, g.ay - 96, `${g.combo} hops! ✨`, '#fff6a8', false, 18);
      if (g.combo > 0 && g.combo % 6 === 0) {
        g.shells++; g.bonus++; SFX.sparkle();
        burst(g.ax, g.ay - 50, 26, { colors: ['#fff6a8', '#b8e6ff', '#ffb3e0'] });
        floatText(W / 2, 200, 'Sparkle combo! +1 🐚', '#fff6a8', false, 30);
      }
      if (s.kind === 'stone') g.safe = s;
      if (s.shell) this.gotShell(g, s, g.ax, g.ay);
      if (g.frog && g.frog.s === s) {
        g.super = true; g.frog = null; g.frogT = 9;
        tone(260, 0.35, 'sine', 0.09, 0, 900); burst(g.ax, g.ay - 40, 20, { colors: ['#9fe05a', '#fff6a8', '#ffffff'] });
        floatText(g.ax, g.ay - 110, 'Super hop! 🐸', '#c8ff9a', false, 28);
        speak('Super hop! Now you can jump two rows!');
      }
    },
    update(g, dt, id) {
      const T = g.T;
      g.clock += dt; g.banner = Math.max(0, g.banner - dt); g.since += dt; g.landT = Math.max(0, g.landT - dt);
      if (!g.win) g.timeLeft -= dt;
      for (const r of g.rip) r.t += dt;
      g.rip = g.rip.filter(r => r.t < 1.2);
      for (const d of g.drops) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 760 * dt; }
      g.drops = g.drops.filter(d => d.vy < 0 || d.y < d.y0);
      for (const f of g.shadows) { f.x += f.v * dt; if (f.x > W + 60) f.x = -60; if (f.x < -60) f.x = W + 60; }
      // logs drift, lily pads sink under Aubrey and come back up
      for (const s of g.spots) {
        s.bob = Math.max(0, s.bob - dt * 3);
        if (s.kind === 'log') {
          s.x += s.v * dt;
          if (s.x > W + 120) s.x -= W + 240; else if (s.x < -120) s.x += W + 240;
        }
        if (s.kind === 'pad') {
          if (s.sunk > 0) { s.sunk -= dt; if (s.sunk <= 0) { s.sunk = 0; s.load = 0; g.rip.push({ x: s.x, y: s.y, t: 0 }); } }
          else if (g.on === s && !g.hop) {
            s.load += dt;
            if (s.load >= T.pad) { s.sunk = 2.6; this.splash(g, 'Splash! The lily pad sank!'); }
          } else s.load = Math.max(0, s.load - dt * 1.5);
        }
      }
      // the duck family paddles past, waiting politely if Aubrey is in the way
      const d = g.ducks;
      if (d) {
        d.quack = Math.max(0, d.quack - dt);
        if (d.wait > 0) d.wait -= dt;
        else {
          const inWay = (g.on && g.on.r === d.r && g.on.kind !== 'bank') || (g.hop && g.hop.s.r === d.r);
          const ax = g.hop ? this.landX(g.hop.s, g.ax) : g.ax;
          const stop = inWay && this.duckXs(d).some(x => { const a = (ax - x) * d.dir; return a > 0 && a < 64; });
          if (stop) { if (!d.quack) { d.quack = 2; tone(520, 0.08, 'square', 0.04); tone(470, 0.1, 'square', 0.04, 0.12); } }
          else d.x += d.dir * T.duckV * dt;
          const tail = d.x - d.dir * (d.n - 1) * 36;
          if ((d.dir > 0 && tail > W + 50) || (d.dir < 0 && tail < -50)) {
            const rows = [...new Set(g.spots.filter(s => s.kind !== 'log' && s.r > 1 && s.r < g.R).map(s => s.r))];
            d.dir = -d.dir; d.r = pick(rows); d.x = d.dir > 0 ? -40 : W + 40; d.wait = 2.5;
          }
        }
      }
      // a jumping fish: its shadow circles a lily pad, then it leaps out and splashes the pad under
      if (g.cfg.fish && !g.win) {
        if (!g.jump) {
          g.fishT -= dt;
          if (g.fishT <= 0) {
            g.fishT = T.fishGap + rand(0, 2);
            const c = g.spots.filter(s => s.kind === 'pad' && s.sunk <= 0 && s !== g.on && !(g.hop && g.hop.s === s) && !(g.frog && g.frog.s === s));
            if (c.length) g.jump = { s: pick(c), t: 0, from: pick([-1, 1]) };
          }
        } else {
          const j = g.jump; j.t += dt;
          if (j.t >= 1.85 && !j.hit) {
            j.hit = true; j.s.sunk = 2.4; j.s.load = 0;
            noise(0.25, 0.05); burst(j.s.x, j.s.y - 6, 16, { colors: ['#ffffff', '#bfeaff'], spread: 110, up: 140 });
            g.rip.push({ x: j.s.x, y: j.s.y, t: 0, big: true });
            if (g.on === j.s && !g.hop) this.splash(g, 'Splash! A fish bumped the lily pad!');
          }
          if (j.t > 2.4) g.jump = null;
        }
      }
      // the frog friend turns up now and then and offers a super hop
      if (!g.win) {
        if (!g.frog) {
          g.frogT -= dt;
          if (g.frogT <= 0) {
            const c = g.spots.filter(s => (s.kind === 'stone' || s.kind === 'pad') && s.sunk <= 0 && s !== g.on && s.r < g.R && !g.path.has(s) && !(g.jump && g.jump.s === s));
            if (c.length) {
              g.frog = { s: pick(c), t: 0 }; tone(200, 0.12, 'square', 0.04); tone(160, 0.14, 'square', 0.04, 0.15);
              if (!g.frogTold) { g.frogTold = true; speak('Ribbit! Hop onto the frog for a super hop!'); }
            } else g.frogT = 2;
          }
        } else {
          g.frog.t += dt;
          if (g.frog.t > 10 || (g.frog.s.kind === 'pad' && g.frog.s.sunk > 0)) { g.frog = null; g.frogT = 7; }
        }
      }
      const cur = g.on;
      if (cur && !g.hop && cur.kind === 'log') {
        g.ax = cur.x + g.off;
        if (g.ax < 26 || g.ax > W - 26) this.splash(g, 'Whoops! Hop off before the edge!');
      }
      if (cur && !g.hop && cur.kind === 'turtle' && this.tState(g, cur).st === 'down') this.splash(g, 'Splash! The turtle dived!');

      if (g.hop) {
        const h = g.hop; h.t += dt;
        const k = Math.min(1, h.t / h.dur), s = h.s;
        const tx = s.kind === 'log' ? s.x + h.off : s.x;
        g.ax = lerp(h.x0, tx, k); g.ay = lerp(h.y0, s.y, k);
        if (g.combo >= 2 && Math.random() < dt * 30) burst(g.ax, g.ay - 40 - Math.sin(k * Math.PI) * 60, 1, { colors: ['#fff6a8', '#ffb3e0', '#b8e6ff'], spread: 20, up: 0, size: [3, 5] });
        if (k >= 1) this.land(g);
      } else if (g.fall) {
        g.fall.t += dt;
        if (g.fall.t > 1.4) {
          // Tilly's cousins push her back to the last safe spot
          g.on = g.safe; g.ax = g.safe.x; g.ay = g.safe.y; g.fall = null; g.safe.bob = 1; g.since = 9;
          SFX.pop();
        }
      } else if (g.win) {
        g.win.t += dt;
        if (g.win.t > 0.6 && g.win.t - dt <= 0.6) burst(884, 90, 24, { colors: ['#ff6fae', '#ffd84a', '#7fd0ff', '#9fe07a'], spread: 160, up: 160 });
        if (g.win.t > 2.4) {
          if (g.cross >= 3) g.done = true;
          else { this.newCrossing(g); speak(g.cfg.say); }
        }
      } else {
        const list = this.targets(g);
        g.hover = this.hitTarget(g, list, pointer.x, pointer.y);
        let go = null;
        if (pointer.clicked && !id) {
          go = g.hover;
          if (!go && pointer.y > 64) {
            const blockedSpot = g.spots.find(s => this.blocked(g, s) && Math.hypot(pointer.x - s.x, pointer.y - s.y) < 50);
            SFX.miss(); floatText(pointer.x, pointer.y - 20, blockedSpot ? 'Wait for the ducks!' : 'Too far!', '#ffd0d0', false, 20);
          }
        }
        const nearest = (fn) => list.filter(fn).sort((a, b) => Math.abs(this.landX(a, g.ax) - g.ax) - Math.abs(this.landX(b, g.ax) - g.ax))[0];
        if (pressed.arrowup || pressed.w || pressed[' ']) go = nearest(s => s.r === g.on.r + 1) || nearest(s => s.r === g.on.r + 2);
        if (pressed.arrowdown || pressed.s) go = nearest(s => s.r === g.on.r - 1);
        if (pressed.arrowleft || pressed.a) go = nearest(s => s.r === g.on.r && s.x < g.ax - 10);
        if (pressed.arrowright || pressed.d) go = nearest(s => s.r === g.on.r && s.x > g.ax + 10);
        if (go) this.hopTo(g, go);
      }
      g.progress = `🐚 ${g.shells}/${g.shellTotal}   Crossing ${Math.min(3, g.cross + 1)}/3`;
      // combo bonus shells add a little sparkle to the score, but can't make up for careless splashes
      g.score = 0.2 * (g.cross / 3) + 0.5 * Math.min(1, (g.shells - g.bonus) / g.shellTotal) + 0.3 * Math.max(0, 1 - g.splashes / 3) + 0.04 * g.bonus;
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
    },
    drawSpot(g, s, list) {
      const bob = Math.sin(S.t * 2 + s.x * 0.05) * 1.5 + s.bob * 4;
      if (list.includes(s)) {
        const lx = this.landX(s, g.ax), hv = g.hover === s, big = Math.abs(s.r - g.on.r) === 2;
        ctx.strokeStyle = hv ? '#ffffff' : big ? `hsl(${(S.t * 200) % 360},90%,75%)` : `rgba(255,246,140,${0.65 + Math.sin(S.t * 6) * 0.25})`;
        ctx.lineWidth = hv ? 5 : 3.5; ctx.setLineDash(hv ? [] : [10, 7]); ctx.lineDashOffset = -S.t * 20;
        ctx.beginPath(); ctx.ellipse(s.kind === 'log' ? lx : s.x, s.y - 4, s.kind === 'log' ? 44 : 56, 25, 0, 0, TAU); ctx.stroke();
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
      }
      let gone = false;
      if (s.kind === 'stone') hopStone(s.x, s.y + bob, s.tone, s.seed);
      else if (s.kind === 'pad') {
        const k = s.sunk > 0 ? 1 : s.load / g.T.pad;
        if (s.sunk > 0) { gone = true; ctx.fillStyle = 'rgba(30,110,80,.3)'; ellipse(s.x, s.y + 2, 34, 12); ripple(s.x, s.y + 2, (S.t * 0.8) % 1, 30, 8); }
        else {
          const shake = k > 0.5 ? Math.sin(S.t * 30) * 2.5 * k : 0;
          cPad(s.x + shake, s.y + bob + k * 5, 42, s.flower, s.rot + (k > 0 ? Math.sin(S.t * 8) * 0.06 * k : 0), k * 0.85);
          // water creeping over the drooping edge
          if (k > 0.2) { ctx.fillStyle = `rgba(80,180,230,${k * 0.5})`; ellipse(s.x + shake, s.y + bob + k * 5 + 6, 40 * (1 - k * 0.3), 8 * k); }
          ctx.fillStyle = 'rgba(230,250,255,.9)'; ctx.strokeStyle = 'rgba(60,140,190,.6)'; ctx.lineWidth = 1;
          for (const [dx, dy] of [[-16, -6], [10, 4], [-4, 7]]) { ctx.beginPath(); ctx.arc(s.x + dx + shake, s.y + dy + bob + k * 5, 2.4, 0, TAU); ctx.fill(); ctx.stroke(); }
        }
        if (s.sunk > 0) timerRing(s.x + 36, s.y - 22, 1 - s.sunk / 2.6, '#7fb8e0');
        else if (s.load > 0.05) timerRing(s.x + 40, s.y - 26, 1 - k, k > 0.6 ? '#ff6a6a' : '#ffb03a');
      } else if (s.kind === 'turtle') {
        const ts = this.tState(g, s);
        const eyes = ts.st === 'warn' ? 'closed' : ts.st === 'up' && ts.left < 0.8 && Math.sin(S.t * 26) > 0 ? 'blink' : 'open';
        turtleBack(s.x, s.y + bob, ts.st, ts.k, s.tint, s.face, eyes);
        gone = ts.st === 'down';
        const P = g.T.up + g.T.warn;
        if (ts.st === 'down') timerRing(s.x + 40, s.y - 22, 1 - ts.left / g.T.down, '#7fb8e0');
        else { const left = ts.st === 'up' ? ts.left + g.T.warn : ts.left; timerRing(s.x + 44, s.y - 30, left / P, left < g.T.warn + 0.4 ? '#ff6a6a' : left < P * 0.5 ? '#ffb03a' : '#6fd06a'); }
      } else if (s.kind === 'log') logTop(s.x, s.y + bob, s.len, s.frogRide, Math.sign(s.v));
      if (s.shell && !gone) {
        const sy = s.y - 22 + bob + Math.sin(S.t * 3 + s.x) * 2;
        seashell(s.x, sy, s.shell > 1 ? 16 : 13, Math.sin(S.t * 2 + s.x) * 0.2);
        if (s.shell > 1) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#ffd84a'; circle(s.x, sy - 2, 12); ctx.globalCompositeOperation = 'source-over'; twinkle(s.x - 14, sy - 14, 7, 1); twinkle(s.x + 14, sy - 6, 5, 2.5); }
      }
      if (g.frog && g.frog.s === s && !gone) {
        const f = g.frog, inK = Math.min(1, f.t / 0.4), hop = (1 - inK) * 60 + Math.abs(Math.sin(S.t * 4)) * 4;
        const gl = ctx.createRadialGradient(s.x, s.y - 20, 4, s.x, s.y - 20, 56);
        gl.addColorStop(0, 'rgba(200,255,150,.6)'); gl.addColorStop(1, 'rgba(200,255,150,0)'); ctx.fillStyle = gl; circle(s.x, s.y - 20, 56);
        ccFrog(s.x + 6, s.y - 18 - hop, 0.8, s.x > W / 2);
        if (Math.sin(S.t * 3) > -0.3) { rrect(s.x - 46, s.y - 78, 92, 22, 11, 'rgba(255,255,255,.92)', OL, 2); text('Super hop!', s.x, s.y - 66, 13, '#3a8a2a', 'center', 800); }
      }
    },
    draw(g) {
      ctx.drawImage(hopStatic(), 0, 0, W, H);
      // living water: caustic shimmer, current lines, sparkles and fish shadows under the surface
      ctx.save(); ctx.beginPath(); ctx.rect(0, HW_TOP + 4, W, HW_BOT - HW_TOP - 8); ctx.clip();
      for (const f of g.shadows) {
        ctx.save(); ctx.translate(f.x, f.y); ctx.scale(Math.sign(f.v) * f.s, f.s);
        ctx.fillStyle = 'rgba(20,50,100,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, 0, 0, TAU); ctx.moveTo(-18, 0); ctx.lineTo(-32, -8 + Math.sin(S.t * 9) * 3); ctx.lineTo(-32, 8 + Math.sin(S.t * 9) * 3); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        const cx = ((i * 97 + S.t * 16) % (W + 80)) - 40, cy = HW_TOP + 20 + (i * 53) % 270;
        ctx.beginPath(); ctx.ellipse(cx, cy + Math.sin(S.t * 1.3 + i) * 4, 22 + Math.sin(S.t * 2 + i) * 6, 7, Math.sin(i) * 0.4, 0, TAU); ctx.stroke();
      }
      currentLines(0, W, HW_TOP + 16, HW_BOT - 12, 24, 44, 0.5);
      for (let i = 0; i < 20; i++) twinkle(30 + (i * 151) % 900, HW_TOP + 20 + (i * 59) % 270, 5 + (i % 3) * 2, i * 1.3);
      ctx.restore();
      // reeds on the banks
      cattails(20, HW_BOT + 6, 4, 58); cattails(940, HW_BOT + 6, 4, 62); cattails(26, HW_TOP + 16, 3, 50); cattails(700, HW_TOP + 14, 3, 46); cattails(330, HW_TOP + 14, 3, 40);
      // Tilly's basket of shells, and Tilly cheering
      const bx = 790, by = 132;
      ink(P2(`M${bx - 34},${by - 24} L${bx + 34},${by - 24} L${bx + 26},${by} L${bx - 26},${by} Z`), '#d8a060', 1.5);
      ctx.strokeStyle = '#a06a3a'; ctx.lineWidth = 1.5; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(bx - 34 + i * 13.6, by - 24); ctx.lineTo(bx - 26 + i * 10.4, by); ctx.stroke(); }
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by - 24, 26, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      for (let i = 0; i < Math.min(g.shells, 8); i++) seashell(bx - 22 + (i % 4) * 15, by - 28 - Math.floor(i / 4) * 9, 7, (i - 2) * 0.2, false);
      const cheer = g.win ? Math.abs(Math.sin(g.win.t * 9)) * 16 : 0;
      drawCritter('Tilly the Turtle', 884, FAR_Y + 14 - cheer, 0.5, -1);
      if (g.win && g.win.t > 0.3) { rrect(824, 64, 118, 30, 14, 'rgba(255,255,255,.95)', OL, 2); text(g.cross >= 3 ? 'Hooray!!' : 'Well done!', 883, 79, 15, '#c0506e', 'center', 800); }

      // dragonflies zipping over the water
      dragonfly(240 + Math.sin(S.t * 0.6) * 200, 230 + Math.sin(S.t * 1.9) * 40, '#2a9ae8', Math.cos(S.t * 0.6) < 0);
      // ripples, then everything on the water sorted top to bottom, with Aubrey in among it
      const list = this.targets(g);
      for (const r of g.rip) if (r.t > 0) { ripple(r.x, r.y, r.t / 1.2, r.big ? 80 : 46, r.big ? 20 : 12); }
      const items = g.spots.map(s => ({ y: s.y, f: () => this.drawSpot(g, s, list) }));
      if (g.ducks && g.ducks.wait <= 0) {
        const d = g.ducks, y = this.rowY(g, d.r - 1) + 10;
        items.push({ y: y + 1, f: () => {
          this.duckXs(d).forEach((x, i) => duckSide(x, y + Math.sin(S.t * 3 + i) * 1.5, i ? 0.6 : 0.95, d.dir, !i, S.t + i));
          if (d.quack > 1) { rrect(d.x - 30, y - 70, 64, 24, 12, 'rgba(255,255,255,.95)', OL, 2); text('Quack!', d.x + 2, y - 58, 14, '#c07a20', 'center', 800); }
        } });
      }
      const aubY = g.fall ? g.fall.y : g.ay;
      items.push({ y: aubY + 2, f: () => this.drawAub(g) });
      items.sort((a, b) => a.y - b.y).forEach(it => it.f());
      for (const t of list) if (t.kind === 'bank') {
        const y = t.far ? HW_TOP - 18 : HW_BOT + 26;
        ctx.strokeStyle = `rgba(255,246,140,${0.65 + Math.sin(S.t * 6) * 0.25})`; ctx.lineWidth = 3.5; ctx.setLineDash([10, 7]);
        ctx.beginPath(); ctx.ellipse(g.ax, y, 70, 18, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        if (t.far) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(S.t * 6) * 0.3; text('⬆', g.ax, y - 2, 22, '#fff', 'center', 800); ctx.restore(); }
      }
      // the jumping fish: a shadow circling the pad, then the leap
      if (g.jump) {
        const j = g.jump, s = j.s;
        if (j.t < 1.3) {
          const a = j.t * 6;
          ctx.fillStyle = 'rgba(20,50,100,.3)'; ellipse(s.x + Math.cos(a) * 46, s.y + 6 + Math.sin(a) * 14, 18, 7, a + Math.PI / 2);
          outlined('!', s.x, s.y - 52 - Math.abs(Math.sin(S.t * 8)) * 6, 30, '#ffdd55');
        } else if (j.t < 1.85) {
          const k = (j.t - 1.3) / 0.55, fx = lerp(s.x + j.from * 90, s.x, k), fy = lerp(s.y + 8, s.y - 4, k) - Math.sin(k * Math.PI) * 80;
          ctx.save(); ctx.translate(fx, fy); ctx.rotate(-j.from * (Math.PI / 2 - k * Math.PI) * 0.6); ccFish(0, 0, 0.9, j.from > 0); ctx.restore();
          if (k < 0.15) ripple(s.x + j.from * 90, s.y + 8, k * 6, 30, 8);
        }
      }
      // splash droplets
      for (const d of g.drops) { ctx.fillStyle = 'rgba(230,248,255,.95)'; ctx.strokeStyle = 'rgba(60,140,200,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * 0.8, d.r, Math.atan2(d.vy, d.vx) + Math.PI / 2, 0, TAU); ctx.fill(); ctx.stroke(); }
      if (g.combo >= 2 && !g.fall && !g.win) { rrect(g.ax - 30, g.ay + 6, 60, 22, 11, 'rgba(48,24,72,.7)'); text(`✨ x${g.combo}`, g.ax, g.ay + 17, 14, '#fff6a8', 'center', 800); }
      if (g.banner > 0) {
        ctx.globalAlpha = Math.min(1, g.banner);
        outlined(`Crossing ${g.cross + 1}: ${g.cfg.name}`, W / 2, 300, 38, '#fff6a8');
        ctx.globalAlpha = 1;
      }
    },
    drawAub(g) {
      if (g.fall) {
        const f = g.fall, bob = Math.sin(f.t * 8) * 3;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, f.y - 14 + bob); ctx.clip();
        drawAubrey(f.x, f.y + 34 + bob, 'crouch', g.facing, 0, 0.42);
        ctx.restore();
        ctx.fillStyle = 'rgba(120,210,255,.65)'; ellipse(f.x, f.y - 14 + bob, 32, 9);
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(f.x, f.y - 14 + bob, 32, 9, 0, 0, TAU); ctx.stroke();
        ripple(f.x, f.y - 12 + bob, (f.t * 1.4) % 1, 46, 12);
        return;
      }
      let lift = 0, frame = 'idle_front', sx = 1, sy = 1;
      if (g.hop) {
        const k = Math.min(1, g.hop.t / g.hop.dur);
        lift = Math.sin(k * Math.PI) * (g.hop.big ? 96 : 60); frame = 'jump';
        if (k < 0.12) { sx = 1.12; sy = 0.88; } else { sx = 1 - 0.08 * Math.sin(k * Math.PI); sy = 1 + 0.1 * Math.sin(k * Math.PI); }
        // a soft shadow sliding over the water under her
        ctx.fillStyle = 'rgba(20,40,80,.22)'; ellipse(g.ax, g.ay - 8, 26 * (1 - lift / 200), 7);
      } else if (g.landT > 0) { const q = g.landT / 0.18; sx = 1 + 0.14 * q; sy = 1 - 0.14 * q; }
      if (g.win) { frame = 'twirl'; lift = Math.abs(Math.sin(g.win.t * 6)) * 18; }
      if (g.super && !g.hop) { const gl = ctx.createRadialGradient(g.ax, g.ay - 40, 6, g.ax, g.ay - 40, 60); gl.addColorStop(0, `hsla(${(S.t * 200) % 360},90%,80%,.6)`); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; circle(g.ax, g.ay - 40, 60); }
      const sink = g.on && g.on.kind === 'pad' ? g.on.load / g.T.pad * 8 : g.on && g.on.bob ? g.on.bob * 4 : 0;
      const gy = g.ay - 10 + sink, py = gy - lift;
      ctx.save(); ctx.translate(g.ax, py); ctx.scale(sx, sy); ctx.translate(-g.ax, -py);
      drawAubrey(g.ax, gy, frame, g.facing, lift, 0.42);
      ctx.restore();
    },
  };

  // ===========================================================================
  // GAME 2 (learn): Creek Critters. A cut-away creek: the AIR above, the LAND (with burrows
  // under the grass), the muddy BANK in the middle for critters who live in the water AND on
  // land, and the WATER under the surface. Drag (or tap a place for) each critter to its home.
  // Right answers come alive and roam about, and the habitat blooms as it fills up. Some
  // critters hide in a bush and you guess from Tilly's clue; some get a "what do I eat?"
  // snack bonus. The finale: grow a frog, stage by stage, with hatching and morphing.
  // ===========================================================================
  const CC_WATER_Y = 240;
  const CC_ZONES = {
    air: { x: 0, y: 60, w: W, h: 162, key: '1', icon: '☁️', label: 'Air', sign: [16, 66] },
    land: { x: 0, y: 222, w: 410, h: 224, key: '2', icon: '🌿', label: 'Land', sign: [16, 238] },
    water: { x: 560, y: 222, w: 400, h: 224, key: '3', icon: '💧', label: 'Water', sign: [822, 256] },
    both: { x: 410, y: 222, w: 150, h: 224, key: '4', icon: '🐸', label: 'Both!', sign: [418, 394] },
  };
  // where each kind of critter wanders once it's home: [x0, x1, y0, y1] boxes
  const CC_ROAM = {
    air: [[80, 900, 96, 196]], land: [[40, 390, 274, 324]], water: [[590, 930, 276, 410]],
    both: [[420, 478, 252, 300], [590, 790, 290, 400]], bed: [[590, 930, 398, 414]],
  };
  // art: how to draw it; move: how it gets about; food/not: the snack question (if any)
  const CREEK_CRITTERS = [
    { name: 'fish', zone: 'water', art: 'fish', move: 'swim', food: '🐛', not: ['🥕', '🌰'], clue: 'It has fins and a tail.', fact: 'Fish have fins for swimming and gills for breathing under the water!', hint: 'A fish breathes with gills. It needs water!' },
    { name: 'tadpole', zone: 'water', art: 'tadpole', move: 'swim', food: '🌿', not: ['🌰', '🐟'], clue: 'It has a wiggly tail and no legs yet.', fact: 'A tadpole is a baby frog! It wiggles its tail to swim.', hint: 'A tadpole has no legs yet. It can only swim!' },
    { name: 'sunfish', zone: 'water', art: 'sunfish', move: 'swim', clue: 'It has fins and bright colours.', fact: 'A sunfish is a bright little creek fish. It swims with its fins!', hint: 'Fins are for swimming in water!' },
    { name: 'crayfish', zone: 'water', art: 'crayfish', move: 'back', hard: true, clue: 'It has claws and hides under creek rocks.', fact: 'A crayfish crawls along the bottom of the creek, and scoots backwards to hide!', hint: 'A crayfish breathes with gills, under the water.' },
    { name: 'bunny', zone: 'land', art: 'bunny', move: 'hop', food: '🥕', not: ['🐟', '🐛'], clue: 'It has fur and long legs for hopping.', fact: 'A bunny hops about on land and digs a cosy burrow!', hint: 'A bunny has legs for hopping. No fins, no wings!' },
    { name: 'hedgehog', zone: 'land', art: 'hedgehog', move: 'walk', food: '🐛', not: ['🥕', '🌸'], clue: 'It has prickles and little legs.', fact: 'A hedgehog snuffles through the grass looking for bugs!', hint: 'A hedgehog walks on its little legs.' },
    { name: 'squirrel', zone: 'land', art: 'squirrel', move: 'hop', food: '🌰', not: ['🐟', '🌿'], clue: 'It has a fluffy tail and climbs trees.', fact: 'A squirrel scampers on land and climbs up trees!', hint: 'A squirrel runs and climbs. It has no wings or fins.' },
    { name: 'snail', zone: 'land', art: 'snail', move: 'slide', hard: true, clue: 'It carries its shell and slides slowly.', fact: 'A garden snail slides over the land with its house on its back, and leaves a shiny trail!', hint: 'This snail slides along the ground.' },
    { name: 'butterfly', zone: 'air', art: 'butterfly', move: 'flutter', food: '🌸', not: ['🐟', '🌰'], clue: 'It has big colourful wings.', fact: 'A butterfly flutters through the air on bright wings!', hint: 'Look! Wings are for flying.' },
    { name: 'bee', zone: 'air', art: 'bee', move: 'flutter', food: '🌸', not: ['🥕', '🐛'], clue: 'It has wings and goes buzz.', fact: 'A bee buzzes through the air from flower to flower!', hint: 'A bee has wings. Buzz buzz!' },
    { name: 'dragonfly', zone: 'air', art: 'dragonfly', move: 'dart', clue: 'It has four see-through wings.', fact: 'A dragonfly darts through the air above the creek, then hovers like a helicopter!', hint: 'A dragonfly has wings for zooming through the air.' },
    { name: 'bat', zone: 'air', art: 'bat', move: 'flutter', food: '🦟', not: ['🥕', '🌸'], hard: true, clue: 'It is furry, but it has wings!', fact: 'A bat is a furry animal that flies at night!', hint: 'Even with fur, a bat flies with its wings!' },
    { name: 'frog', zone: 'both', art: 'frog', move: 'both', food: '🪰', not: ['🥕', '🌰'], clue: 'It swims AND it hops on land.', fact: 'A frog swims in the water and hops on land. It lives in both!', hint: 'A frog lives in the water AND on land. Try the muddy bank in the middle!' },
    { name: 'duck', zone: 'both', art: 'duck', move: 'both', clue: 'It paddles on the water and waddles on land.', fact: 'A duck paddles in the water and waddles on land. Quack!', hint: 'A duck likes the water AND the land. Try the muddy bank!' },
    { name: 'turtle', zone: 'both', art: 'turtle', move: 'both', clue: 'It swims, and sunbathes on the bank.', fact: 'Turtles like me swim in the creek and sunbathe on the bank!', hint: 'Like me! I live in the water AND on land. Try the bank!' },
    { name: 'otter', zone: 'both', art: 'otter', move: 'both', food: '🐟', not: ['🌸', '🌰'], hard: true, clue: 'It swims fast, and slides down muddy banks.', fact: 'An otter slides down the muddy bank, SPLASH, into the water!', hint: 'An otter swims AND runs on land. Try the muddy bank!' },
    { name: 'beaver', zone: 'both', art: 'beaver', move: 'both', food: '🪵', not: ['🐟', '🐛'], clue: 'It has big teeth and a flat tail.', fact: 'A beaver swims with its flat tail and builds a home of sticks by the bank!', hint: 'A beaver lives in the water AND on land. Try the muddy bank!' },
  ];
  const FROG_STAGES = [
    { id: 'eggs', label: 'Eggs', say: 'First, frog eggs!' },
    { id: 'tadpole', label: 'Tadpole', say: 'The eggs hatch into tadpoles!' },
    { id: 'legs', label: 'Tadpole with legs', say: 'The tadpole grows legs!' },
    { id: 'froglet', label: 'Froglet', say: 'Now it is a froglet with a little tail!' },
    { id: 'frog', label: 'Frog', say: 'And it grows into a frog! Ribbit!' },
  ];

  // --- critter art ------------------------------------------------------------------------
  const CE = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
  // outline every part first, then fill them in order, so they read as one shape
  function inkParts(parts, lw = 3.2) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = lw;
    for (const [p] of parts) ctx.stroke(p);
    for (const [p, f] of parts) { ctx.fillStyle = f; ctx.fill(p); }
  }
  const blinkNow = seed => ((S.t * 0.9 + seed) % 3.4) < 0.13;
  function ccEye(x, y, r, seed = 0) {
    if (blinkNow(seed)) { ctx.strokeStyle = '#1a1030'; ctx.lineWidth = Math.max(1.5, r * 0.45); ctx.beginPath(); ctx.arc(x, y - r * 0.2, r * 0.8, 0.25, Math.PI - 0.25); ctx.stroke(); return; }
    ctx.fillStyle = '#fff'; circle(x, y, r); ctx.fillStyle = '#1a1030'; circle(x + r * 0.2, y, r * 0.66); ctx.fillStyle = '#fff'; circle(x, y - r * 0.32, r * 0.26);
  }
  const ccCheek = (x, y, r) => { ctx.fillStyle = 'rgba(255,120,160,.45)'; circle(x, y, r); };
  function ccFish(x, y, s, flip, col = '#ffa03a') {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    const body = P2('M-22,0 C-12,-15 12,-16 24,0 C12,15 -12,14 -22,0 Z');
    const tailP = P2(`M-18,0 L-34,${-12 + Math.sin(S.t * 10) * 3} L-31,0 L-34,${12 + Math.sin(S.t * 10) * 3} Z`);
    const fin = P2('M-4,-12 C0,-22 8,-20 10,-12 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 3.2; ctx.lineJoin = 'round';
    for (const p of [tailP, fin, body]) ctx.stroke(p);
    ctx.fillStyle = mix(col, '#ff6a3a', 0.4); ctx.fill(tailP); ctx.fill(fin);
    ctx.fillStyle = vgrad(-14, 14, mix(col, '#ffffff', 0.35), col); ctx.fill(body);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(2, 6, 12, 4);
    ctx.strokeStyle = 'rgba(160,60,20,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(6, 0, 9, -1.1, 1.1); ctx.stroke();
    ccEye(14, -3, 4, 0.4);
    ctx.restore();
  }
  function ccTadpole(x, y, s, flip, legs = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    const w = Math.sin(S.t * 12) * 5;
    const tailP = P2(`M-6,-5 C-18,${-8 + w} -28,${-2 - w} -40,${w} C-28,${4 - w} -18,${6 + w} -6,5 Z`);
    const head = new Path2D(); head.ellipse(4, 0, 14, 11, 0, 0, TAU);
    const legP = [P2('M-6,6 C-10,14 -16,18 -22,18 L-20,14 C-14,14 -10,10 -10,5 Z'), P2('M-2,6 C-2,14 -6,20 -12,22 L-12,18 C-8,16 -6,12 -6,6 Z')];
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    for (const p of [tailP, ...(legs ? legP : []), head]) ctx.stroke(p);
    ctx.fillStyle = '#6a7a5a'; ctx.fill(tailP);
    if (legs) { ctx.fillStyle = '#5a7a3a'; for (const p of legP) ctx.fill(p); }
    ctx.fillStyle = vgrad(-11, 11, '#6a6a7a', '#2a2a3a'); ctx.fill(head);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(2, -5, 6, 2.5);
    ccEye(11, -3, 3.4, 0.7);
    ctx.restore();
  }
  // a side-view frog facing right; tail > 0 gives a froglet's stubby tail
  function ccFrog(x, y, s, flip, tail = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    const body = P2('M-24,6 C-28,-12 -8,-24 10,-20 C26,-17 32,-4 28,8 C22,16 -16,18 -24,6 Z');
    const eye = new Path2D(); eye.arc(14, -20, 9, 0, TAU);
    const thigh = new Path2D(); thigh.ellipse(-12, 8, 15, 10, -0.3, 0, TAU);
    const foot = P2('M-24,18 L2,18 C4,22 -2,24 -6,22 L-24,22 Z');
    const arm = new Path2D(); arm.ellipse(18, 12, 4.5, 9, 0.2, 0, TAU);
    const tl = tail ? P2(`M-22,2 C-34,0 -40,${-4 + Math.sin(S.t * 8) * 2} -${30 + tail * 14},${-2 + Math.sin(S.t * 8) * 3} C-36,8 -30,10 -22,10 Z`) : null;
    ctx.strokeStyle = OL; ctx.lineWidth = 3.4; ctx.lineJoin = 'round';
    for (const p of [tl, foot, thigh, arm, body, eye]) if (p) ctx.stroke(p);
    ctx.fillStyle = '#4fae3a'; if (tl) ctx.fill(tl); ctx.fill(foot); ctx.fill(arm);
    ctx.fillStyle = vgrad(-22, 18, '#9fe05a', '#4fae3a'); ctx.fill(body); ctx.fill(eye);
    ctx.fillStyle = '#5fbf3a'; ctx.fill(thigh);
    ctx.fillStyle = '#e8f8a0'; ellipse(8, 10, 14, 6, -0.1);
    ctx.fillStyle = 'rgba(40,110,30,.45)'; circle(-6, -10, 3); circle(2, -14, 2.4); circle(-14, -2, 2.6);
    ccEye(15, -21, 5.5, 1.3);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, -6); ctx.quadraticCurveTo(24, -2, 29, -6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,120,160,.5)'; circle(22, -9, 3);
    ctx.restore();
  }
  function ccEggs(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const pts = [[-20, -6], [-6, -12], [8, -8], [20, -2], [-14, 8], [0, 4], [14, 10], [-2, 18], [26, 12], [-26, 6]];
    ctx.strokeStyle = 'rgba(91,63,115,.7)'; ctx.lineWidth = 2;
    for (const [px, py] of pts) { ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(220,245,255,.85)'; for (const [px, py] of pts) circle(px, py, 9);
    ctx.fillStyle = '#2a2040'; for (const [px, py] of pts) circle(px + 1, py + 1, 3.4);
    ctx.fillStyle = '#fff'; for (const [px, py] of pts) circle(px - 3, py - 3, 1.6);
    ctx.restore();
  }
  function ccStage(id, x, y, s) {
    if (id === 'eggs') ccEggs(x, y, s * 1.3);
    else if (id === 'tadpole') ccTadpole(x + 8 * s, y, s * 1.3, false);
    else if (id === 'legs') ccTadpole(x + 8 * s, y - 4 * s, s * 1.3, false, true);
    else if (id === 'froglet') ccFrog(x + 8 * s, y, s * 0.95, false, 1);
    else ccFrog(x, y, s * 1.25, false);
  }
  // each critter is drawn facing right, centred on (0, 0), about 60px across
  const CR_ART = {
    fish: sd => ccFish(0, 0, 1.15, false),
    sunfish: sd => {
      ctx.save(); ctx.scale(1.1, 1.1);
      const w = Math.sin(S.t * 10 + sd) * 3;
      const tl = P2(`M-16,0 L-32,${-12 + w} L-28,0 L-32,${12 + w} Z`), fin = P2('M-10,-14 C-2,-26 10,-24 14,-14 Z'), fin2 = P2('M-6,14 C0,22 8,22 10,14 Z');
      const body = CE(2, 0, 22, 16);
      inkParts([[tl, '#3a8ae0'], [fin, '#3a8ae0'], [fin2, '#3a8ae0'], [body, '#5fb8ff']]);
      ctx.save(); ctx.clip(body);
      ctx.fillStyle = '#ffa03a'; ellipse(4, 12, 20, 8);
      ctx.fillStyle = 'rgba(30,80,160,.35)'; for (const x of [-10, -2, 6]) ellipse(x, -2, 2.5, 14);
      ctx.restore();
      ctx.fillStyle = '#1a3a8a'; ellipse(12, -4, 3, 4);
      ccEye(16, -5, 4, sd); ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(20, 3, 3, 0.2, 1.6); ctx.stroke();
      ctx.restore();
    },
    tadpole: sd => ccTadpole(4, 0, 1.15, false),
    crayfish: sd => {
      const w = Math.sin(S.t * 4 + sd);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(20, -6); ctx.quadraticCurveTo(34, -24, 44 + w * 4, -26); ctx.moveTo(18, -6); ctx.quadraticCurveTo(28, -28, 34 - w * 3, -34); ctx.stroke();
      ctx.lineWidth = 2.5; for (const lx of [-4, 2, 8]) { ctx.beginPath(); ctx.moveTo(lx, 6); ctx.lineTo(lx - 3, 14); ctx.stroke(); }
      const clawA = P2(`M14,-2 L26,-10 C34,-${18 + w * 2} 44,-14 42,-8 L32,-8 L40,-2 C36,4 28,2 24,-4 Z`);
      const clawB = P2('M14,4 L26,8 C34,4 44,8 42,14 L32,12 L38,18 C32,22 26,18 24,12 Z');
      const tail = [CE(-18, 2, 7, 7), CE(-26, 4, 6, 6), CE(-32, 6, 5, 5)];
      const fan = P2('M-34,6 L-44,-2 L-46,8 L-40,14 Z');
      const body = CE(2, 0, 18, 10);
      inkParts([[fan, '#e8603a'], ...tail.map(p => [p, '#f07a4a']), [clawB, '#d8502a'], [body, '#f07a4a'], [clawA, '#e8603a']]);
      ctx.strokeStyle = 'rgba(140,40,20,.5)'; ctx.lineWidth = 1.5; for (const x of [-8, -2, 4]) { ctx.beginPath(); ctx.moveTo(x, -9); ctx.lineTo(x, 9); ctx.stroke(); }
      inkCircle(16, -10, 3.5, '#fff', 1); if (!blinkNow(sd)) { ctx.fillStyle = '#1a1030'; circle(17, -10, 2.2); }
    },
    bunny: sd => {
      const tw = Math.sin(S.t * 3 + sd) * 0.15, nose = Math.sin(S.t * 14 + sd) * 0.8;
      const earA = CE(4, -32, 6, 16, -0.3 + tw), earB = CE(14, -32, 6, 16, 0.15);
      const body = CE(-6, 2, 22, 16), head = CE(14, -12, 14, 12), tl = CE(-28, -4, 8, 8), foot = CE(6, 16, 11, 4.5), foot2 = CE(-16, 16, 9, 4);
      inkParts([[earA, '#f4eef8'], [earB, '#f4eef8'], [tl, '#ffffff'], [foot2, '#e2d8ec'], [body, '#f4eef8'], [foot, '#e2d8ec'], [head, '#f8f2fc']]);
      ctx.fillStyle = '#ffc0d8'; ellipse(4, -32, 2.8, 11, -0.3 + tw); ellipse(14, -32, 2.8, 11, 0.15);
      ctx.fillStyle = 'rgba(200,180,220,.5)'; ellipse(-8, 8, 14, 6);
      ccEye(18, -14, 3.6, sd); ccCheek(20, -6, 3.5);
      ctx.fillStyle = '#ff8ab0'; circle(27, -10 + nose, 2.6);
      ctx.strokeStyle = 'rgba(91,63,115,.6)'; ctx.lineWidth = 1; for (const a of [-0.2, 0.15]) { ctx.beginPath(); ctx.moveTo(26, -8); ctx.lineTo(38, -8 + a * 20); ctx.stroke(); }
    },
    hedgehog: sd => {
      const sn = Math.sin(S.t * 6 + sd) * 1.2;
      const sp = new Path2D(); sp.moveTo(-28, 10);
      for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI * 0.95, r = i % 2 ? 24 : 32; sp.lineTo(-4 + Math.cos(a) * r * 1.05, 6 + Math.sin(a) * r * 0.8); }
      sp.lineTo(14, 8); sp.closePath();
      const face = P2(`M4,-8 C16,-12 30,-4 ${36 + sn},2 C30,8 16,10 4,10 Z`), belly = CE(-4, 8, 24, 8), f1 = CE(-14, 14, 5, 3), f2 = CE(8, 14, 5, 3);
      inkParts([[f1, '#8a5a3a'], [f2, '#8a5a3a'], [sp, '#8a6a4a'], [belly, '#e8c8a0'], [face, '#f0d0a8']]);
      ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const a = Math.PI + 0.2 + i / 9 * 2.6; ctx.beginPath(); ctx.moveTo(-4 + Math.cos(a) * 12, 6 + Math.sin(a) * 9); ctx.lineTo(-4 + Math.cos(a) * 24, 6 + Math.sin(a) * 18); ctx.stroke(); }
      ctx.fillStyle = '#1a1030'; circle(36 + sn, 1, 3.2);
      ccEye(20, -3, 3.2, sd); ccCheek(22, 4, 3);
    },
    squirrel: sd => {
      const sw = Math.sin(S.t * 3 + sd) * 0.15;
      ctx.save(); ctx.translate(-12, 8); ctx.rotate(sw);
      const tl = P2('M0,0 C-28,0 -34,-34 -14,-44 C2,-50 10,-38 0,-30 C-8,-24 -6,-10 4,-6 Z');
      inkParts([[tl, '#d88a4a']]);
      ctx.strokeStyle = '#f0b878'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-24, -14, -14, -38); ctx.stroke();
      ctx.restore();
      const body = CE(0, 4, 14, 15), head = CE(12, -14, 12, 10), ear = P2('M6,-22 L8,-33 L14,-23 Z'), foot = CE(4, 18, 9, 4), acorn = CE(20, 2, 5, 6);
      inkParts([[ear, '#c8783a'], [body, '#c8783a'], [foot, '#b0682a'], [head, '#d88a4a'], [acorn, '#b07a3a']]);
      ctx.fillStyle = '#7a4a2a'; ellipse(20, -3, 6, 3);
      ctx.fillStyle = '#f8d8a8'; ellipse(4, 8, 7, 10);
      ccEye(16, -16, 3.4, sd); ccCheek(18, -9, 3); ctx.fillStyle = '#5a2a2a'; circle(24, -13, 1.8);
    },
    snail: sd => {
      const w = Math.sin(S.t * 3 + sd) * 2;
      const foot = P2('M-26,12 C-22,2 18,2 30,6 C36,10 34,14 26,14 L-26,14 Z');
      const shellP = CE(-6, -10, 17, 16);
      inkParts([[foot, '#c8e0a8'], [shellP, '#f0a858']]);
      ctx.strokeStyle = '#b06a28'; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let a = 0; a < 12; a += 0.3) { const r = 14 - a * 1.05; ctx.lineTo(-6 + Math.cos(a) * r, -10 + Math.sin(a) * r * 0.95); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-12, -18, 6, 3, -0.5);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(24, 6); ctx.lineTo(28 + w, -12); ctx.moveTo(28, 6); ctx.lineTo(36 - w, -10); ctx.stroke();
      ctx.strokeStyle = '#c8e0a8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(24, 6); ctx.lineTo(28 + w, -12); ctx.moveTo(28, 6); ctx.lineTo(36 - w, -10); ctx.stroke();
      inkCircle(28 + w, -13, 3, '#fff', 1); inkCircle(36 - w, -11, 3, '#fff', 1);
      ctx.fillStyle = '#1a1030'; circle(29 + w, -13, 1.6); circle(37 - w, -11, 1.6);
      ccCheek(26, 10, 2.5);
    },
    butterfly: sd => {
      const k = 0.25 + 0.75 * Math.abs(Math.cos(S.t * 9 + sd));
      ctx.save(); ctx.scale(k, 1);
      for (const m of [-1, 1]) {
        const up = CE(m * 15, -8, 15, 12, m * 0.5), lo = CE(m * 11, 10, 10, 9, -m * 0.4);
        inkParts([[lo, m < 0 ? '#ff8ac0' : '#ff8ac0'], [up, '#ffb040']]);
        ctx.fillStyle = '#fff6a8'; circle(m * 18, -10, 4); ctx.fillStyle = '#c6a2ff'; circle(m * 12, 11, 3.5);
      }
      ctx.restore();
      inkParts([[CE(0, 2, 3.5, 15), '#5a3a6a']]);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1, -12); ctx.quadraticCurveTo(-6, -24, -10, -26); ctx.moveTo(1, -12); ctx.quadraticCurveTo(6, -24, 10, -26); ctx.stroke();
      ctx.fillStyle = OL; circle(-10, -26, 2); circle(10, -26, 2);
    },
    bee: sd => {
      const k = Math.abs(Math.sin(S.t * 40));
      ctx.save(); ctx.translate(0, -12); ctx.scale(1, 0.4 + k * 0.6);
      ctx.fillStyle = 'rgba(230,248,255,.85)'; ctx.strokeStyle = 'rgba(91,63,115,.7)'; ctx.lineWidth = 1.5;
      for (const [x, r] of [[-4, -0.4], [6, 0.3]]) { ctx.beginPath(); ctx.ellipse(x, -8, 8, 13, r, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
      const body = CE(0, 0, 18, 13), sting = P2('M-16,0 L-26,2 L-16,5 Z');
      inkParts([[sting, '#3a2a3a'], [body, '#ffd84a']]);
      ctx.save(); ctx.clip(body); ctx.fillStyle = '#3a2a3a'; for (const x of [-10, -1]) ctx.fillRect(x, -14, 5, 28); ctx.restore();
      ccEye(10, -3, 3.8, sd); ccCheek(12, 5, 3);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(14, 2, 3, 0.3, 1.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -11); ctx.quadraticCurveTo(16, -20, 20, -20); ctx.stroke();
    },
    dragonfly: sd => { ctx.save(); ctx.scale(1.5, 1.5); dragonfly(4, 0, '#2a9ae8', false); ctx.restore(); },
    bat: sd => {
      const k = 0.35 + 0.65 * Math.abs(Math.sin(S.t * 8 + sd));
      for (const m of [-1, 1]) {
        ctx.save(); ctx.scale(m, k);
        inkParts([[P2('M2,-2 C-8,-16 -28,-18 -36,-8 C-30,-6 -28,-2 -26,4 C-22,0 -18,0 -14,4 C-12,0 -8,0 -4,6 Z'), '#7a6a9a']]);
        ctx.restore();
      }
      const body = CE(0, 2, 10, 12), e1 = P2('M-8,-6 L-6,-18 L-1,-8 Z'), e2 = P2('M8,-6 L6,-18 L1,-8 Z');
      inkParts([[e1, '#8a7aaa'], [e2, '#8a7aaa'], [body, '#8a7aaa']]);
      ctx.fillStyle = '#ffc0d8'; tri(-7, -8, -6, -15, -3, -8); tri(7, -8, 6, -15, 3, -8);
      ccEye(-4, 0, 2.8, sd); ccEye(4, 0, 2.8, sd + 0.01);
      ctx.fillStyle = '#fff'; tri(-3, 6, -1, 6, -2, 9); tri(1, 6, 3, 6, 2, 9);
    },
    frog: sd => ccFrog(0, 4, 1.15, false),
    duck: sd => duckSide(0, 14, 1.15, 1, true, S.t + sd),
    turtle: sd => {
      const lg = Math.sin(S.t * 5 + sd) * 2;
      const shellP = P2('M-26,6 C-26,-22 22,-22 24,6 Z'), belly = CE(0, 8, 26, 5), head = CE(30, -2, 9, 8), l1 = CE(-16, 12 + lg, 6, 5), l2 = CE(14, 12 - lg, 6, 5), tl = P2('M-26,4 L-34,8 L-26,9 Z');
      inkParts([[tl, '#9fd65a'], [l1, '#9fd65a'], [l2, '#9fd65a'], [head, '#a8e07a'], [belly, '#f4f0a8'], [shellP, '#6fbf4a']]);
      ctx.save(); ctx.clip(shellP); ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 2;
      for (const [x, y] of [[-12, -6], [2, -10], [14, -4], [-4, 2]]) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 6); } ctx.closePath(); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(-6, -14, 10, 3);
      ctx.restore();
      ctx.fillStyle = '#ff9ac0'; circle(-4, -16, 4); circle(2, -17, 3);
      ccEye(32, -4, 3, sd); ccCheek(30, 3, 2.5);
    },
    otter: sd => {
      const w = Math.sin(S.t * 4 + sd) * 3;
      const tl = P2(`M-24,2 C-38,4 -46,${10 + w} -54,${12 + w} C-46,${16 + w} -34,12 -22,8 Z`), body = CE(-2, 0, 26, 11), head = CE(24, -6, 11, 10), ear = CE(18, -15, 3.5, 3.5), l1 = CE(-14, 10, 6, 4), l2 = CE(12, 10, 6, 4);
      inkParts([[tl, '#7a4a2a'], [ear, '#7a4a2a'], [l1, '#6a3a1a'], [l2, '#6a3a1a'], [body, '#8a5a3a'], [head, '#9a6a44']]);
      ctx.fillStyle = '#e8c8a0'; ellipse(30, -2, 7, 5.5); ellipse(0, 6, 18, 4);
      ctx.fillStyle = '#1a1030'; ellipse(36, -5, 2.6, 2);
      ccEye(24, -9, 2.8, sd);
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; for (const a of [-0.15, 0.1]) { ctx.beginPath(); ctx.moveTo(33, -1); ctx.lineTo(44, -1 + a * 20); ctx.stroke(); }
    },
    beaver: sd => {
      const tw = Math.sin(S.t * 2 + sd) * 0.15;
      ctx.save(); ctx.translate(-20, 8); ctx.rotate(tw);
      const tl = CE(-12, 2, 15, 6, 0.25); inkParts([[tl, '#5a4a3a']]);
      ctx.save(); ctx.clip(tl); ctx.strokeStyle = 'rgba(30,20,20,.5)'; ctx.lineWidth = 1; for (let i = -30; i < 10; i += 5) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i + 10, 10); ctx.moveTo(i + 10, -8); ctx.lineTo(i, 10); ctx.stroke(); } ctx.restore();
      ctx.restore();
      const body = CE(-2, 0, 22, 16), head = CE(18, -8, 12, 11), ear = CE(12, -18, 3.5, 3.5), foot = CE(8, 15, 7, 4);
      inkParts([[ear, '#8a5a30'], [body, '#a0683a'], [foot, '#5a3a20'], [head, '#b07848']]);
      ctx.fillStyle = '#e8c8a0'; ellipse(25, -4, 6, 5);
      ctx.fillStyle = '#1a1030'; circle(30, -7, 2.4);
      inkRect(24, -1, 3.5, 6, '#fff', 0.8, 1); inkRect(27.5, -1, 3.5, 6, '#fff', 0.8, 1);
      ccEye(18, -11, 3, sd); ccCheek(20, -3, 2.5);
    },
  };
  // draw one critter; dir > 0 means it is heading right
  function ccCritter(c, x, y, size, dir = 1, seed = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale((dir < 0 ? -1 : 1) * size / 60, size / 60);
    try { CR_ART[c.art](seed); } finally { ctx.restore(); }
  }
  // a leafy bush for a critter to hide in, with just a peek of it showing
  function hideBush(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const parts = [[CE(-26, 6, 22, 18), '#4fb35a'], [CE(24, 6, 22, 18), '#4fb35a'], [CE(0, -6, 26, 22), '#5fc466'], [CE(-12, 14, 22, 14), '#3fa654'], [CE(14, 14, 22, 14), '#3fa654']];
    inkParts(parts, 3);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; circle(-6, -14, 9);
    ctx.fillStyle = '#ff6fae'; for (const [fx, fy] of [[-24, -2], [18, -4], [2, 16]]) circle(fx, fy, 3.5);
    ctx.restore();
  }

  // the habitat's sky, land, soil, mud and water bed never change: paint them once
  let ccCache = null;
  function ccStatic() {
    if (ccCache) return ccCache;
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR;
    const old = ctx; ctx = cv.getContext('2d'); ctx.scale(DPR, DPR);
    try {
      const WY = CC_WATER_Y;
      ctx.fillStyle = vgrad(56, 250, '#6cc8ff', '#e2f8ff'); ctx.fillRect(0, 56, W, 200);
      bdHills('#c0e8d0', 234, 12, 0.008, 1);
      bdHills('#a8dcb0', 244, 8, 0.013, 3);
      // the land: a meadow on top, then a cut-away of soil with a burrow, roots and pebbles
      const land = P2('M-10,232 C120,224 300,228 404,238 C430,240 446,250 456,262 L470,300 C486,340 500,380 512,452 L-10,452 Z');
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(land);
      ctx.fillStyle = vgrad(226, 340, '#a8e470', '#6cc458'); ctx.fill(land);
      ctx.save(); ctx.clip(land);
      const soil = P2('M-10,334 C100,328 260,338 420,332 C460,330 480,334 520,336 L520,460 L-10,460 Z');
      ctx.fillStyle = vgrad(330, 452, '#a8784e', '#7a5032'); ctx.fill(soil);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(soil);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 4; i++) ctx.fillRect(0, 352 + i * 24, W, 3);
      // the burrow: a hole in the grass, a tunnel and a cosy chamber with a sleepy mouse
      ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.moveTo(150, 334); ctx.quadraticCurveTo(170, 370, 120, 392); ctx.lineTo(96, 380); ctx.quadraticCurveTo(140, 362, 128, 334); ctx.closePath(); ctx.fill();
      inkEllipse(90, 400, 46, 22, 0, '#4a3020', 1.5); ctx.fillStyle = '#c8a070'; ellipse(90, 412, 34, 8);
      ctx.fillStyle = '#b0a0b8'; ellipse(84, 404, 13, 9); circle(96, 400, 7); ctx.fillStyle = '#ffc0d8'; circle(94, 393, 3.5);
      ctx.strokeStyle = '#1a1030'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(99, 400, 2.4, 0.2, Math.PI - 0.2); ctx.stroke();
      text('z', 112, 386, 12, '#fff6e0', 'center', 800); text('z', 120, 376, 9, '#fff6e0', 'center', 800);
      inkEllipse(140, 330, 18, 7, 0, '#3a2418', 1.2);
      // roots, pebbles and a wiggly worm
      ctx.strokeStyle = '#e8c890'; ctx.lineWidth = 2;
      for (const [x, l] of [[250, 60], [330, 44], [380, 70], [210, 36]]) { ctx.beginPath(); ctx.moveTo(x, 334); ctx.quadraticCurveTo(x + 10, 334 + l / 2, x - 6, 334 + l); ctx.moveTo(x + 4, 334 + l / 3); ctx.lineTo(x + 18, 334 + l / 2); ctx.stroke(); }
      for (let i = 0; i < 16; i++) inkEllipse(30 + (i * 67) % 420, 360 + (i * 29) % 80, 6 + (i % 3) * 2, 4, 0, ['#c8b0a0', '#d8c0b0', '#b8a090'][i % 3], 0.8);
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(270, 420); ctx.bezierCurveTo(280, 410, 290, 430, 300, 420); ctx.stroke();
      ctx.strokeStyle = '#ff9ab0'; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      // the muddy bank: shiny mud sloping down into the creek
      const mud = P2('M404,238 C430,240 446,250 456,262 L470,300 C486,340 500,380 512,452 L560,452 C548,380 530,320 508,280 C496,258 476,244 404,238 Z');
      ink(mud, vgrad(240, 452, '#9a7050', '#6a4a30'), 1.6);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; for (const [x, y] of [[452, 266], [476, 304], [494, 350]]) ellipse(x, y, 10, 3, 0.8);
      // the water, cut away to show what's under the surface
      const wat = P2(`M470,${WY} L970,${WY} L970,452 L560,452 C548,380 530,320 508,280 C496,258 486,248 470,${WY} Z`);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(wat);
      ctx.fillStyle = vgrad(WY, 452, '#9ae8ff', '#1f74b8'); ctx.fill(wat);
      ctx.save(); ctx.clip(wat);
      ctx.fillStyle = 'rgba(20,50,110,.15)'; ctx.fillRect(470, 360, 500, 100);
      ctx.fillStyle = '#e8d098'; ctx.beginPath(); ctx.moveTo(480, 452); for (let x = 480; x <= 970; x += 20) ctx.lineTo(x, 424 + Math.sin(x * 0.05) * 5); ctx.lineTo(970, 452); ctx.fill();
      ctx.strokeStyle = 'rgba(180,140,80,.5)'; ctx.lineWidth = 1.5; for (let x = 520; x < 960; x += 34) { ctx.beginPath(); ctx.moveTo(x, 438); ctx.quadraticCurveTo(x + 8, 434, x + 16, 438); ctx.stroke(); }
      for (let i = 0; i < 16; i++) inkEllipse(540 + i * 27, 432 + (i % 3) * 5, 6 + (i % 3) * 2, 4, 0, ['#c8c0d4', '#d8a0b0', '#a8b8c8', '#f0e0c0'][i % 4], 0.8);
      // a big mossy rock with a shadowy gap the crayfish can hide in
      ink(P2('M820,430 C812,396 850,380 884,388 C916,394 930,418 924,432 Z'), vgrad(380, 432, '#b8b0c8', '#7a7090'), 1.6);
      ctx.fillStyle = '#2a2a4a'; ellipse(868, 428, 20, 6);
      ctx.fillStyle = '#6cc04e'; ellipse(866, 388, 26, 6);
      ink(P2('M640,432 C640,416 660,410 676,414 C690,418 692,430 690,434 Z'), '#a8a0bc', 1.4);
      ctx.restore();
      // a half-sunk log on the bank
      ctx.save(); ctx.translate(486, 262); ctx.rotate(0.5);
      ink(P2('M-46,-10 L40,-10 C46,-10 46,10 40,10 L-46,10 Z'), '#a0683a', 1.6);
      inkEllipse(40, 0, 6, 10, 0, '#e8c090', 1);
      ctx.strokeStyle = 'rgba(80,40,20,.5)'; ctx.lineWidth = 1.5; for (let x = -36; x < 30; x += 14) { ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x + 8, -4); ctx.stroke(); }
      ctx.restore();
      // the tree on the land
      ink(P2('M332,244 C336,190 330,150 322,120 L350,120 C346,150 350,196 358,244 Z'), '#a0683a', 1.6);
      for (const [x, y, r, c] of [[300, 112, 40, '#4fb35a'], [372, 106, 44, '#5fc466'], [336, 76, 46, '#6fd070'], [404, 132, 30, '#4fb35a']]) inkCircle(x, y, r, c, 1.6);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; circle(322, 62, 18);
      for (const [x, y] of [[296, 100], [360, 84], [390, 124]]) { ctx.fillStyle = '#ff5f6a'; circle(x, y, 5); }
      ctx.strokeStyle = '#4ea83e'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 26; i++) { const x = 20 + (i * 83) % 400, y = 250 + (i * 41) % 80; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 9); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 8); ctx.stroke(); }
      // the soil strip along the bottom, under the tray
      ctx.fillStyle = vgrad(446, H, '#8a5e3a', '#6a4428'); ctx.fillRect(0, 446, W, H - 446);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 446); ctx.lineTo(W, 446); ctx.stroke();
      for (let i = 0; i < 18; i++) inkEllipse(20 + (i * 113) % 940, 466 + (i * 29) % 64, 6 + (i % 3) * 3, 4, 0, '#b89878', 0.8);
    } finally { ctx = old; }
    return (ccCache = cv);
  }

  MG.creekcritters = {
    kind: 'learn', title: () => 'Creek Critters', icon: () => '🐸',
    how: () => 'Who lives where? Drag each critter to the air, the land or the water. Some live in the water AND on land: they go on the muddy bank! Then grow a frog!',
    init(g) {
      const per = [2, 3, 3][g.tier - 1], nBoth = [1, 2, 3][g.tier - 1];
      const pickZone = (z, n) => {
        const all = CREEK_CRITTERS.filter(c => c.zone === z);
        const easy = shuffle(all.filter(c => !c.hard)), hard = all.filter(c => c.hard);
        return (g.tier === 3 ? [...hard, ...easy] : easy).slice(0, n);
      };
      let order = shuffle([...pickZone('air', per), ...pickZone('land', per), ...pickZone('water', per), ...pickZone('both', nBoth)]);
      // a 'both' critter never comes first, and never three of the same place in a row
      const fb = order.findIndex(c => c.zone !== 'both'); if (fb > 0) [order[0], order[fb]] = [order[fb], order[0]];
      for (let i = 2; i < order.length; i++) if (order[i].zone === order[i - 1].zone && order[i].zone === order[i - 2].zone) {
        const j = order.findIndex((c, k) => k > i && c.zone !== order[i].zone);
        if (j > 0) [order[i], order[j]] = [order[j], order[i]];
      }
      order = order.map(c => ({ c, hidden: false, feed: false }));
      // some hide in a bush (guess from the clue), some get a snack question
      shuffle(order.slice(1)).slice(0, [0, 3, 4][g.tier - 1]).forEach(q => { q.hidden = true; });
      shuffle(order.filter(q => q.c.food)).slice(0, [2, 3, 3][g.tier - 1]).forEach(q => { q.feed = true; });
      const stages = [['eggs', 'tadpole', 'frog'], ['eggs', 'tadpole', 'legs', 'frog'], ['eggs', 'tadpole', 'legs', 'froglet', 'frog']][g.tier - 1];
      Object.assign(g, {
        queue: order, n: order.length, idx: 0, firstTry: 0, residents: [], blooms: [], cur: null, wait: 0, toldBoth: false,
        fedAsked: 0, fedRight: 0, food: null,
        stage: 'sort', stages, cards: [], nextCard: 0, cardMiss: 0, endT: 0, bubbles: [], fx: [], vig: null,
      });
      this.nextCritter(g, true);
    },
    start(g) { speak(g.say); },
    nextCritter(g, quiet) {
      const q = g.queue[g.idx];
      g.cur = { c: q.c, q, hidden: q.hidden, state: 'tray', x: 220, y: 478, t: 0, tries: 0, showClue: g.tier === 1 || q.hidden };
      g.say = this.prompt(g);
      if (q.c.zone === 'both' && !g.toldBoth) { g.toldBoth = true; g.say += ' Hint: some critters live in the water AND on land!'; }
      if (!quiet) speak(g.say);
    },
    prompt(g) {
      const { c, showClue, hidden } = g.cur;
      if (hidden) return `Who's hiding in the bush? ${c.clue} Where does it live?`;
      return `Where does the ${c.name} live?${showClue ? ' ' + c.clue : ''}`;
    },
    zoneAt(x, y) {
      for (const [k, z] of Object.entries(CC_ZONES)) if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return k;
      return null;
    },
    roamFor(c) { return c.move === 'back' ? CC_ROAM.bed : CC_ROAM[c.zone]; },
    spotIn(z, c) { const box = z === 'both' ? CC_ROAM.both[0] : c && z === c.zone ? pick(this.roamFor(c)) : CC_ROAM[z][0]; return [rand(box[0], box[1]), rand(box[2], box[3])]; },
    judge(g, z, at) {
      const cur = g.cur, [tx, ty] = at || this.spotIn(z, cur.c);
      Object.assign(cur, { state: 'fly', zone: z, fx: cur.x, fy: cur.y, tx, ty, t: 0 });
      SFX.jump();
    },
    splashAt(g, x, y, big) {
      g.fx.push({ kind: 'ring', x, y, t: 0 });
      burst(x, y, big ? 16 : 8, { colors: ['#ffffff', '#bfeaff'], spread: big ? 90 : 60, up: big ? 140 : 90, size: [2, 5] });
      if (big) noise(0.2, 0.04);
    },
    addBloom(g, zone) {
      const b = { zone, t: 0, seed: rand(0, 9), col: pick(SKY_FLOWERS) };
      if (zone === 'air') Object.assign(b, { x: rand(80, 880), y: rand(80, 120), kind: 'cloud' });
      else if (zone === 'land') Object.assign(b, { x: rand(30, 300), y: rand(262, 330), kind: 'flower' });
      else if (zone === 'water') Object.assign(b, Math.random() < 0.5 ? { x: rand(600, 940), y: CC_WATER_Y + 3, kind: 'lily' } : { x: rand(590, 940), y: 428, kind: 'weed' });
      else Object.assign(b, { x: rand(412, 452), y: 300 + rand(-8, 8), kind: 'reeds' });
      g.blooms.push(b);
    },
    arrive(g) {
      const cur = g.cur, c = cur.c;
      if (cur.zone === c.zone) {
        if (cur.tries === 0) g.firstTry++;
        const r = { c, x: cur.x, y: cur.y, tx: cur.x, ty: cur.y, wait: 0.6, dir: 1, seed: rand(0, 9), trail: [], munch: 0, hop: 0 };
        // a special entrance for some critters
        if (c.art === 'otter') { Object.assign(r, { tx: 650, ty: 330, wait: 0, zoom: 1 }); }
        if (c.art === 'dragonfly') r.wait = 0;
        if (c.move === 'back') Object.assign(r, { tx: 868, ty: 412, wait: 0 });
        g.residents.push(r); cur.res = r;
        this.addBloom(g, c.zone);
        SFX.sparkle(); burst(cur.x, cur.y, 24, { colors: ['#fff6a8', '#b8ffb8', '#b8e6ff', '#ffb3e0'] });
        floatText(cur.x, Math.max(96, cur.y - 44), cur.hidden ? `It's a ${c.name}!` : pick(['Yes!', 'Right!', 'Home!']), '#fff6a8', false, 28);
        speak((cur.hidden ? `It's a ${c.name}! ` : '') + c.fact);
        cur.state = 'done'; g.wait = Math.max(2.4, c.fact.length * 0.058);
        g.say = c.fact;
      } else {
        cur.state = 'oops'; cur.t = 0; cur.tries++; cur.showClue = true;
        if (cur.tries >= 1) cur.hidden = false;
        SFX.miss(); tone(300, 0.25, 'sawtooth', 0.04, 0.1, 200);
        if (cur.zone === 'water' || (cur.zone === 'both' && cur.y > CC_WATER_Y)) this.splashAt(g, cur.x, CC_WATER_Y, true);
        floatText(cur.x, Math.max(96, cur.y - 44), pick(['Uh-oh!', 'Whoops!', 'Oh no!']), '#ffd0d0', false, 26);
        g.say = `${c.hint} Where does the ${c.name} live?`;
        speak(g.say);
      }
    },
    askFood(g) {
      const c = g.cur.c;
      g.cur.state = 'feed'; g.cur.t = 0;
      g.cur.foods = shuffle([c.food, ...c.not]);
      g.say = `Snack time! What does the ${c.name} like to eat?`;
      speak(g.say);
    },
    feed(g, i) {
      const cur = g.cur, c = cur.c, ch = cur.foods[i], ok = ch === c.food;
      g.fedAsked++; if (ok) g.fedRight++;
      g.food = { ch: c.food, x0: [690, 790, 890][cur.foods.indexOf(c.food)], y0: 492, t: 0, res: cur.res };
      cur.state = 'fed'; g.wait = 2.4;
      if (ok) { SFX.pick(); g.say = `Yum! The ${c.name} loves it!`; }
      else { SFX.miss(); g.say = `Not that one! The ${c.name} likes this instead.`; }
      speak(g.say);
    },
    startCycle(g) {
      g.stage = 'cycle';
      const order = shuffle(g.stages.map(id => FROG_STAGES.find(f => f.id === id)));
      const n = order.length, cw = 148, gap = 18, x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
      g.slotX = i => x0 + i * (cw + gap) + cw / 2;
      g.cards = order.map((f, i) => ({ f, x: g.slotX(i), y: 412, hx: g.slotX(i), hy: 412, placed: false, shake: 0, pop: 0 }));
      g.vig = { id: null, prev: null, t: 9 };
      g.say = "Look! Frog eggs in my creek! Let's watch them grow. Put the frog's life in order. What comes first?";
      speak(g.say);
    },
    clickCard(g, card) {
      const want = g.stages[g.nextCard];
      if (card.f.id === want) {
        Object.assign(card, { placed: true, hx: g.slotX(g.nextCard), hy: 286, pop: 1, slot: g.nextCard });
        g.nextCard++;
        g.vig = { id: card.f.id, prev: g.vig.id, t: 0 };
        SFX.sparkle(); burst(card.hx, 286, 18);
        if (g.nextCard >= g.stages.length) {
          g.stage = 'party'; g.endT = 0; g.say = 'You grew a frog! Ribbit!';
          speak(`${card.f.say} You did it!`);
          [523, 659, 784, 1047, 1319].forEach((fq, i) => tone(fq, 0.25, 'triangle', 0.07, 0.6 + i * 0.09));
        } else { g.say = `${card.f.say} What comes next?`; speak(g.say); }
      } else {
        g.cardMiss++; card.shake = 0.5; SFX.miss();
        const prev = g.nextCard ? FROG_STAGES.find(f => f.id === g.stages[g.nextCard - 1]).label.toLowerCase() : null;
        g.say = prev ? `Not yet! What grows from the ${prev}?` : 'Not yet! Everything starts as a tiny egg.';
        speak(g.say);
      }
    },
    moveResident(g, r, dt) {
      const c = r.c, mv = c.move;
      r.munch = Math.max(0, r.munch - dt);
      if (r.wait > 0) { r.wait -= dt; return; }
      const sp = r.zoom ? 260 : { dart: 300, flutter: 80, swim: 64, hop: 80, walk: 34, slide: 9, back: 34, both: 58 }[mv];
      const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy);
      const oy = r.y;
      if (d < 3) {
        r.zoom = 0;
        r.wait = { dart: rand(0.8, 1.6), flutter: rand(0, 0.4), swim: rand(0.2, 1), hop: rand(0.5, 1.5), walk: rand(0.6, 1.6), slide: rand(1, 2), back: rand(1.5, 3), both: rand(0.8, 2) }[mv];
        const box = pick(this.roamFor(c));
        r.tx = rand(box[0], box[1]); r.ty = rand(box[2], box[3]);
        if (mv === 'back' && Math.random() < 0.5) { r.tx = 868; r.ty = 412; }
        return;
      }
      const step = Math.min(d, sp * dt);
      r.x += dx / d * step; r.y += dy / d * step;
      if (Math.abs(dx) > 1) r.dir = Math.sign(dx) * (mv === 'back' ? -1 : 1);
      if (mv === 'hop') r.hop += step;
      if (mv === 'slide' && (!r.trail.length || Math.hypot(r.trail.at(-1)[0] - r.x, r.trail.at(-1)[1] - r.y) > 5)) { r.trail.push([r.x - r.dir * 20, r.y + 10]); if (r.trail.length > 50) r.trail.shift(); }
      // splash when crossing the water's surface
      if (r.x > 470 && (oy < CC_WATER_Y) !== (r.y < CC_WATER_Y)) this.splashAt(g, r.x, CC_WATER_Y, true);
    },
    update(g, dt, id) {
      for (const r of g.residents) this.moveResident(g, r, dt);
      for (const b of g.blooms) b.t += dt;
      for (const f of g.fx) f.t += dt;
      g.fx = g.fx.filter(f => f.t < 1);
      if (Math.random() < dt * 3) g.bubbles.push({ x: rand(570, 940), y: 440, r: rand(2, 6) });
      for (const b of g.bubbles) b.y -= dt * (30 + b.r * 6);
      g.bubbles = g.bubbles.filter(b => b.y > CC_WATER_Y + 4);
      if (g.food) {
        const f = g.food; f.t += dt;
        if (f.t >= 0.7 && !f.done) { f.done = true; if (f.res) { f.res.munch = 1.6; burst(f.res.x, f.res.y - 20, 10, { kind: 'heart', colors: ['#ff6fae', '#ff9ac8'], spread: 60, up: 60, size: [3, 5] }); } tone(700, 0.08, 'square', 0.03); tone(760, 0.08, 'square', 0.03, 0.15); }
        if (f.t > 1.4) g.food = null;
      }

      if (g.stage === 'sort') {
        const cur = g.cur;
        cur.t += dt;
        g.hoverZone = null;
        if (cur.state === 'tray') {
          cur.x = 220; cur.y = 478 + Math.sin(S.t * 2.5) * 4;
          g.hoverZone = this.zoneAt(pointer.x, pointer.y);
          if (pointer.clicked && !id) {
            if (Math.hypot(pointer.x - cur.x, pointer.y - cur.y) < 62) { cur.state = 'drag'; SFX.pick(); }
            else if (g.hoverZone) this.judge(g, g.hoverZone);
          }
          for (const [k, z] of Object.entries(CC_ZONES)) if (pressed[z.key]) this.judge(g, k);
        } else if (cur.state === 'drag') {
          cur.x = pointer.x; cur.y = pointer.y;
          g.hoverZone = this.zoneAt(cur.x, cur.y);
          if (!pointer.down) {
            if (g.hoverZone) {
              const z = g.hoverZone, box = z === cur.c.zone ? this.roamFor(cur.c).find(b => cur.x >= b[0] - 30 && cur.x <= b[1] + 30 && cur.y >= b[2] - 30 && cur.y <= b[3] + 30) : null;
              this.judge(g, z, box ? [clamp(cur.x, box[0], box[1]), clamp(cur.y, box[2], box[3])] : null);
            } else cur.state = 'back';
          }
        } else if (cur.state === 'fly') {
          const k = Math.min(1, cur.t / 0.45);
          cur.x = lerp(cur.fx, cur.tx, easeOut(k)); cur.y = lerp(cur.fy, cur.ty, easeOut(k)) - Math.sin(k * Math.PI) * 50;
          if (k >= 1) this.arrive(g);
        } else if (cur.state === 'oops') {
          if (cur.t > 1.5) { cur.state = 'back'; cur.t = 0; cur.fx = cur.x; cur.fy = cur.y; }
        } else if (cur.state === 'back') {
          if (cur.fx == null) { cur.fx = cur.x; cur.fy = cur.y; cur.t = 0; }
          const k = Math.min(1, cur.t / 0.4);
          cur.x = lerp(cur.fx, 220, easeOut(k)); cur.y = lerp(cur.fy, 478, easeOut(k));
          if (k >= 1) { cur.state = 'tray'; cur.fx = null; g.say = this.prompt(g); }
        } else if (cur.state === 'done' || cur.state === 'fed') {
          g.wait -= dt;
          if (g.wait <= 0 || (cur.t > 0.6 && (pointer.clicked || pressed[' '] || pressed.enter))) {
            if (cur.state === 'done' && cur.q.feed) this.askFood(g);
            else { g.idx++; if (g.idx >= g.n) this.startCycle(g); else this.nextCritter(g); }
          }
        } else if (cur.state === 'feed') {
          let pickI = -1;
          if (pointer.clicked && !id) cur.foods.forEach((_, i) => { if (Math.hypot(pointer.x - [690, 790, 890][i], pointer.y - 492) < 40) pickI = i; });
          ['1', '2', '3'].forEach((k, i) => { if (pressed[k]) pickI = i; });
          if (pickI >= 0) { this.feed(g, pickI); cur.t = 0; }
        }
        g.progress = `🐾 ${g.idx}/${g.n} at home`;
      } else if (g.stage === 'cycle') {
        const free = g.cards.filter(c => !c.placed).sort((a, b) => a.hx - b.hx);
        let hit = null;
        if (pointer.clicked && !id) hit = g.cards.find(c => !c.placed && Math.abs(pointer.x - c.x) < 74 && Math.abs(pointer.y - c.y) < 62);
        free.forEach((c, i) => { if (pressed[String(i + 1)]) hit = c; });
        if (hit) this.clickCard(g, hit);
        g.progress = `🐸 ${g.nextCard}/${g.stages.length} in order`;
      } else if (g.stage === 'party') {
        g.endT += dt;
        if (g.endT > 3.4) g.done = true;
      }
      if (g.vig) g.vig.t += dt;
      for (const c of g.cards) {
        c.x = lerp(c.x, c.hx, Math.min(1, dt * 10)); c.y = lerp(c.y, c.hy, Math.min(1, dt * 10));
        c.shake = Math.max(0, c.shake - dt); c.pop = Math.max(0, c.pop - dt * 2);
      }
      const p1 = g.firstTry / g.n;
      const p2 = g.stage === 'sort' ? 0 : clamp(1 - g.cardMiss / g.stages.length, 0, 1) * (g.stage === 'party' ? 1 : g.nextCard / g.stages.length);
      const p3 = g.fedAsked ? g.fedRight / g.fedAsked : 1;
      g.score = 0.6 * p1 + 0.25 * p2 + 0.15 * p3 * (g.stage === 'sort' ? g.idx / g.n : 1);
    },
    drawBloom(b) {
      const k = Math.min(1, b.t / 0.6), s = k < 1 ? easeOut(k) * (1 + Math.sin(k * Math.PI) * 0.3) : 1;
      if (s <= 0) return;
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(s, s);
      if (b.kind === 'cloud') {
        ctx.fillStyle = 'rgba(255,255,255,.95)'; ellipse(0, 0, 30, 12); ellipse(14, -8, 18, 12); ellipse(-14, -4, 14, 10);
        ctx.restore(); twinkle(b.x + 26, b.y - 14, 7, b.seed); return;
      }
      if (b.kind === 'flower') {
        ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(4 + Math.sin(S.t * 2 + b.seed) * 3, -6, 0, -18); ctx.stroke();
        inkEllipse(-6, -2, 7, 3, -0.5, '#5fc466', 0.8);
        flower(0, -20, 10, b.col, '#ffd84a', 1.2);
      } else if (b.kind === 'lily') cPad(0, 0, 24, b.col, b.seed);
      else if (b.kind === 'weed') {
        for (let i = -1; i <= 1; i++) { const sw = Math.sin(S.t * 1.6 + b.seed + i) * 8; ctx.strokeStyle = ['#3fa66a', '#5fbf7a', '#2f8a5a'][i + 1]; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(i * 8, 0); ctx.quadraticCurveTo(i * 8 + sw, -30, i * 10 + sw * 1.5, -60); ctx.stroke(); }
      } else cattails(0, 0, 3, 46);
      ctx.restore();
    },
    drawScene(g) {
      ctx.drawImage(ccStatic(), 0, 0, W, H);
      // sun with slowly turning rays, drifting clouds
      ctx.save(); ctx.translate(900, 96); ctx.rotate(S.t * 0.15);
      ctx.fillStyle = 'rgba(255,240,150,.35)'; for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); tri(0, -36, -8, -70, 8, -70); }
      ctx.restore();
      ctx.fillStyle = 'rgba(255,230,120,.35)'; circle(900, 96, 50); inkCircle(900, 96, 30, '#ffd84a', 2);
      ctx.fillStyle = '#c0506e'; ctx.strokeStyle = '#c0506e'; ctx.lineWidth = 2; circle(892, 92, 2.4); circle(908, 92, 2.4); ctx.beginPath(); ctx.arc(900, 99, 6, 0.3, Math.PI - 0.3); ctx.stroke();
      bdClouds(3, 'rgba(255,255,255,.9)', 100);
      // under the water: light shafts, swaying plants, bubbles and the shimmering surface
      ctx.save(); ctx.beginPath(); ctx.rect(470, CC_WATER_Y, 500, 212); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      for (let i = 0; i < 5; i++) { const x = 600 + i * 90 + Math.sin(S.t * 0.6 + i) * 14; ctx.beginPath(); ctx.moveTo(x, CC_WATER_Y); ctx.lineTo(x + 36, CC_WATER_Y); ctx.lineTo(x - 30, 452); ctx.lineTo(x - 60, 452); ctx.closePath(); ctx.fill(); }
      for (let i = 0; i < 7; i++) {
        const x = 590 + i * 54, h = 60 + (i % 3) * 30, sw = Math.sin(S.t * 1.5 + i) * 10;
        ctx.strokeStyle = ['#3fa66a', '#5fbf7a', '#2f8a5a'][i % 3]; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, 440); ctx.quadraticCurveTo(x + sw, 440 - h / 2, x + sw * 1.6, 440 - h); ctx.stroke();
        if (i % 2) { ctx.fillStyle = ctx.strokeStyle; ellipse(x + sw * 0.8, 440 - h * 0.55, 6, 3, 0.6); }
      }
      for (const b of g.bubbles) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x + Math.sin(b.y * 0.05) * 4, b.y, b.r, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(b.x + Math.sin(b.y * 0.05) * 4 - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3); }
      currentLines(480, 960, CC_WATER_Y + 12, CC_WATER_Y + 30, 5, 30, 0.6);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3;
      ctx.beginPath(); for (let x = 474; x <= W; x += 16) ctx.lineTo(x, CC_WATER_Y + 2 + Math.sin(x * 0.05 + S.t * 3) * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) twinkle(600 + i * 62, CC_WATER_Y + 4, 6, i * 1.7);
      cPad(640, CC_WATER_Y + 2, 26, '#ff8ac0', 0.1);
      cattails(400, 246, 4, 54); cattails(28, 244, 3, 40);
      // dancing flowers on the meadow
      for (let i = 0; i < 8; i++) flower(40 + i * 48, 252 + (i % 3) * 8 + Math.sin(S.t * 2 + i) * 1.5, 6, SKY_FLOWERS[i % 5], '#ffd84a', 1);
      for (const f of g.fx) if (f.kind === 'ring') ripple(f.x, f.y, f.t, 50, 10);
    },
    draw(g) {
      this.drawScene(g);
      for (const b of g.blooms) this.drawBloom(b);
      // place signs, glowing when a critter is held over them
      const holding = g.stage === 'sort' && g.cur && (g.cur.state === 'drag' || g.cur.state === 'tray');
      for (const [k, z] of Object.entries(CC_ZONES)) {
        const hot = holding && g.hoverZone === k;
        if (hot) {
          const a = 0.5 + Math.sin(S.t * 8) * 0.2;
          rrect(z.x + 6, z.y + 4, z.w - 12, z.h - 8, 18, `rgba(255,250,200,${g.cur.state === 'drag' ? 0.3 : 0.16})`);
          ctx.setLineDash([12, 8]); ctx.lineDashOffset = -S.t * 30; rrect(z.x + 6, z.y + 4, z.w - 12, z.h - 8, 18, null, `rgba(255,246,140,${a + 0.3})`, 4); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        }
        const [sx, sy] = z.sign, w = k === 'both' ? 120 : 124;
        ctx.save(); ctx.translate(sx + w / 2, sy + 19); if (hot) ctx.scale(1.12, 1.12);
        rrect(-w / 2 + 2, -16, w, 38, 12, 'rgba(60,30,60,.25)');
        rrect(-w / 2, -19, w, 38, 12, k === 'both' ? '#fff0d8' : 'rgba(255,250,240,.95)', OL, 2.5);
        inkCircle(-w / 2 + 18, 0, 12, '#9a6ae0', 1);
        text(z.key, -w / 2 + 18, 1, 15, '#fff', 'center', 800);
        emoji(z.icon, -w / 2 + 44, 0, 20);
        text(z.label, -w / 2 + 60, 1, 18, '#5a2a6e', 'left', 800);
        ctx.restore();
      }
      // critters that found their home: snail trails first, then everyone
      for (const r of g.residents) if (r.trail.length > 1) {
        ctx.strokeStyle = 'rgba(230,240,255,.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); r.trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        for (let i = 0; i < r.trail.length; i += 8) twinkle(r.trail[i][0], r.trail[i][1], 4, i);
      }
      for (const r of [...g.residents].sort((a, b) => a.y - b.y)) {
        let y = r.y; const mv = r.c.move;
        if (mv === 'hop') y -= Math.abs(Math.sin(r.hop * 0.06)) * 14;
        if (mv === 'flutter') y += Math.sin(S.t * 3 + r.seed) * 5;
        if (mv === 'dart' && r.wait > 0) y += Math.sin(S.t * 6 + r.seed) * 2;
        const sq = r.munch > 0 ? 1 + Math.sin(r.munch * 30) * 0.06 : 1;
        if (r.c.zone !== 'air' && y < CC_WATER_Y + 10 || r.c.zone === 'land') { ctx.fillStyle = 'rgba(40,20,60,.15)'; ellipse(r.x, r.y + 22, 20, 4); }
        ctx.save(); ctx.translate(r.x, y); ctx.scale(sq, 2 - sq); ccCritter(r.c, 0, 0, 60, r.dir, r.seed); ctx.restore();
        if (r.munch > 0) text('nom!', r.x + 24, y - 30 - (1.6 - r.munch) * 10, 13, '#c0506e', 'center', 800);
      }
      if (g.food && g.food.t < 0.75 && g.food.res) {
        const f = g.food, k = Math.min(1, f.t / 0.7);
        emoji(f.ch, lerp(f.x0, f.res.x, easeOut(k)), lerp(f.y0, f.res.y - 10, easeOut(k)) - Math.sin(k * Math.PI) * 80, 34);
      }
      // Tilly and the question
      drawCritter('Tilly the Turtle', 74, 540, 0.62, 1);
      if (g.stage === 'sort') this.drawTray(g);
      else this.drawCycle(g);
    },
    drawTray(g) {
      const cur = g.cur;
      cPad(220, 508, 62, null, 0.1);
      panel(316, 454, 630, 78, 20);
      const feedOn = cur.state === 'feed';
      const lines = wrap(g.say, feedOn ? 300 : 590, 19);
      lines.slice(0, 3).forEach((l, i) => text(l, 332, 493 + (i - (Math.min(3, lines.length) - 1) / 2) * 23, 19, '#5a2a6e', 'left', 600));
      if (feedOn) cur.foods.forEach((ch, i) => {
        const x = [690, 790, 890][i], hv = Math.hypot(pointer.x - x, pointer.y - 492) < 40, s = hv ? 1.1 : 1;
        inkCircle(x, 492, 32 * s, hv ? '#fff6c8' : '#fffaf0', 1.6);
        emoji(ch, x, 492, 36 * s);
        inkCircle(x + 24, 470, 9, '#9a6ae0', 0.8); text(String(i + 1), x + 24, 471, 11, '#fff', 'center', 800);
      });
      if (['done', 'feed', 'fed'].includes(cur.state)) return;
      // the critter (or its bush), lifted with a shadow while you hold it
      let x = cur.x, y = cur.y, rot = 0, s = 60;
      const held = cur.state === 'drag';
      if (held) {
        ctx.fillStyle = 'rgba(40,20,60,.22)'; ellipse(x + 8, y + 46, 30, 8);
        y -= 10; rot = Math.sin(S.t * 14) * 0.12; s = 70;
      }
      if (cur.state === 'oops') {
        if (cur.zone === 'water') { y += Math.sin(cur.t * 10) * 4; for (let i = 0; i < 4; i++) { const b = (cur.t * 1.5 + i / 4) % 1; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x - 12 + i * 8, y - 20 - b * 40, 3 + i % 2, 0, TAU); ctx.stroke(); } }
        else if (cur.zone === 'air') { y += Math.min(1, cur.t) * 30; rot = Math.sin(cur.t * 16) * 0.4; }
        else { rot = Math.sin(cur.t * 18) * 0.6; ctx.fillStyle = '#8fd8ff'; ellipse(x + 22, y - 26 - (cur.t * 20) % 10, 4, 6); }
      }
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      if (cur.state === 'tray') { const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 62); gl.addColorStop(0, 'rgba(255,255,220,.8)'); gl.addColorStop(1, 'rgba(255,255,220,0)'); ctx.fillStyle = gl; circle(0, 0, 62); }
      if (cur.hidden) {
        // just a peek of it above the leaves, bobbing up and down
        const peek = 8 + Math.max(0, Math.sin(S.t * 2.2)) * 16;
        ctx.save(); ctx.beginPath(); ctx.rect(-50, -60, 100, 50 - (24 - peek)); ctx.clip();
        ccCritter(cur.c, 0, 8 - peek, s * 0.85, 1, 1);
        ctx.restore();
        hideBush(0, 6, s / 60);
        outlined('?', 26, -26, 26, '#fff6a8');
      } else ccCritter(cur.c, 0, 0, s, 1, 1);
      ctx.restore();
      if (cur.state === 'oops') text('?', x + 30, y - 34, 30, '#ff6f9a', 'center', 800);
      if (cur.state === 'tray' && Math.sin(S.t * 3) > 0) text('drag me!', 220, 534, 13, '#fff6e0', 'center', 700);
    },
    drawCycle(g) {
      ctx.fillStyle = 'rgba(40,20,60,.35)'; ctx.fillRect(0, 56, W, H - 56);
      panel(40, 66, W - 80, 420, 26);
      outlined('Grow a frog! What comes next?', W / 2, 92, 26, '#5fbf3a', 'center', '#fff');
      // a little pond where the current stage grows and changes
      const vx = W / 2, vy = 170, v = g.vig;
      ctx.save();
      const pond = CE(vx, vy + 14, 170, 52);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(pond);
      ctx.fillStyle = vgrad(vy - 40, vy + 66, '#9ae8ff', '#3a9ad8'); ctx.fill(pond);
      ctx.clip(pond);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const x = vx - 140 + ((i * 80 + S.t * 20) % 280); ctx.beginPath(); ctx.moveTo(x, vy + 30 + i * 6); ctx.lineTo(x + 24, vy + 30 + i * 6); ctx.stroke(); }
      ctx.restore();
      cPad(vx - 120, vy + 20, 26, '#ff8ac0', 0.2); cPad(vx + 128, vy + 26, 22, null, -0.3);
      if (!v.id) { outlined('?', vx, vy + 10, 44, '#fff6a8'); }
      else {
        const t = v.t;
        if (v.prev && t < 0.45) {
          // the old stage wobbles (eggs crack) and shrinks away in a puff
          const k = t / 0.45;
          ctx.save(); ctx.translate(vx, vy + 10); ctx.rotate(Math.sin(t * 50) * 0.1 * (1 - k)); ctx.scale(1 - k * 0.6, 1 - k * 0.6);
          ccStage(v.prev, 0, 0, 1.6); ctx.restore();
          if (v.prev === 'eggs') { ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(vx - 10, vy); ctx.lineTo(vx - 4, vy + 8); ctx.lineTo(vx + 4, vy + 2); ctx.lineTo(vx + 10, vy + 10); ctx.stroke(); }
          ctx.fillStyle = `rgba(255,255,255,${k * 0.8})`; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; circle(vx + Math.cos(a) * 34 * k, vy + 10 + Math.sin(a) * 20 * k, 10 * k); }
        } else {
          const k = Math.min(1, (t - (v.prev ? 0.45 : 0)) / 0.4), s = easeOut(k) * (1 + Math.sin(k * Math.PI) * 0.25);
          ctx.save(); ctx.translate(vx, vy + 10 + Math.sin(S.t * 2) * 3); ctx.scale(s, s); ccStage(v.id, 0, 0, 1.6); ctx.restore();
          if (k < 1) for (let i = 0; i < 6; i++) twinkle(vx + Math.cos(i) * 60, vy + Math.sin(i * 2) * 26, 8, i);
        }
      }
      g.stages.forEach((id, i) => {
        const x = g.slotX(i);
        ctx.setLineDash([8, 6]); rrect(x - 70, 236, 140, 100, 18, 'rgba(200,240,255,.45)', '#9ac8e8', 3); ctx.setLineDash([]);
        text(String(i + 1), x - 56, 252, 16, '#7aa8c8', 'center', 800);
        if (i < g.stages.length - 1) text('➜', x + 79, 286, 18, '#7aa8c8', 'center', 800);
      });
      g.cards.forEach(c => {
        const sx = c.shake ? Math.sin(c.shake * 60) * 7 : 0, s = 1 + c.pop * 0.15;
        const hv = !c.placed && Math.abs(pointer.x - c.x) < 70 && Math.abs(pointer.y - c.y) < 56;
        ctx.save(); ctx.translate(c.x + sx, c.y - (hv ? 4 : 0)); ctx.scale(s, s);
        rrect(-68, -48, 136, 96, 18, c.placed ? '#e8ffe0' : hv ? '#fffbe0' : '#fffaf2', c.placed ? '#5fbf3a' : OL, 3);
        ccStage(c.f.id, 0, -10, 1.05);
        text(c.f.label, 0, 34, c.f.label.length > 10 ? 13 : 16, '#5a2a6e', 'center', 700);
        ctx.restore();
        if (!c.placed && g.stage === 'cycle') { const i = g.cards.filter(q => !q.placed).sort((a, b) => a.hx - b.hx).indexOf(c); inkCircle(c.x + 54, c.y - 36, 10, '#9a6ae0', 0.8); text(String(i + 1), c.x + 54, c.y - 35, 12, '#fff', 'center', 800); }
      });
      if (g.stage === 'party') {
        const e = g.endT, k = (e * 1.4) % 1, hx = 140 + e * 200;
        ccFrog(hx, 460 - Math.sin(k * Math.PI) * 70, 1.4, false);
        if (k < 0.08) ripple(hx, 466, 0.3, 40, 10);
        outlined('Ribbit! 🎉', W / 2, 380, 40, '#fff6a8');
        if (Math.random() < 0.3) burst(rand(100, 860), 70, 2, { colors: ['#ff6fae', '#ffd84a', '#7fd0ff', '#9fe07a'], spread: 60, up: 0 });
      }
    },
  };

  restage('creek', {
    bg: 'creek2_bg',
    games: [['creekhop', 'shell', {}], ['creekcritters', 'berry', {}]],
    intro: [
      "N:Hello, Aubrey! I left my shell basket on the far bank, and the creek is extra bubbly today.",
      'N:Hop across on my stepping stones! But careful: lily pads sink, and my turtle cousins love to dive.',
      'A:excited:Hop, hop, hop! Here I come!',
    ],
    mid: [
      'N:Splendid hopping! Now my creek critters are all muddled up. Who lives in the air, who lives on the land, and who lives in the water?',
      'A:thinking:Hmm... fins are for swimming, and wings are for flying!',
      'N:Exactly right! And I have a little froggy surprise for you at the end.',
    ],
    outro: [
      'N:Thank you, dear! Here are my favourite shells, and some berries from the bank.',
      "A:happy:Thank you, Tilly! I'll come back and visit the froggies!",
    ],
  });
}
