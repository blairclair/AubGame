'use strict';
{
  // ===========================================================================
  // Kite Hill becomes FRECKLES' FIRE STATION: a red-brick fire station with a bell tower,
  // a shiny fire engine peeking out of the garage and Captain Freckles, a dalmatian firefighter.
  //   game 1 (action) Siren Street: drive the fire engine (it has real momentum!) along a street
  //            of numbered houses and stop at the right number. Houses count up like a number
  //            line; at tier 2 some numbers fell off, at tier 3 they count by twos. Then spray.
  //   game 2 (learn) Ladder Rescue: build a ladder exactly as tall as the kitten's ledge by
  //            adding ladder pieces together (number bonds: 3 + 4 = 7), then raise it and see.
  // ===========================================================================
  const FRIEND = 'Captain Freckles';
  const SPOT = '#2a2230';
  const say = (g, s) => { g.say = s; speak(s); };
  // outline every shape first, then fill them all, so overlapping parts read as one shape
  const inkAll = (items, lw, line = OL) => {
    ctx.strokeStyle = line; ctx.lineWidth = lw * 2;
    for (const [p] of items) ctx.stroke(p);
    for (const [p, f] of items) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  // --- Captain Freckles: a dalmatian in a fire helmet -----------------------------------------
  CR_HATS.k2firehelmet = (r, L) => {
    // a few dalmatian spots on the head (the helmet is drawn over the top of them)
    ctx.fillStyle = SPOT;
    ellipse(-r * 0.62, r * 0.62, r * 0.15, r * 0.12, 0.4); ellipse(-r * 0.2, r * 0.3, r * 0.08, r * 0.06);
    ellipse(r * 0.95, r * 1.25, r * 0.07, r * 0.06); ellipse(-r * 0.45, r * 1.2, r * 0.09, r * 0.08);
    const brim = P2(`M${-r * 1.12},${r * 0.22} C${-r * 0.95},${-r * 0.02} ${r * 0.7},${-r * 0.08} ${r * 0.98},${r * 0.1} C${r * 0.72},${r * 0.24} ${-r * 0.55},${r * 0.36} ${-r * 1.12},${r * 0.22} Z`);
    const dome = P2(`M${-r * 0.72},${r * 0.12} C${-r * 0.78},${-r * 0.82} ${r * 0.66},${-r * 0.86} ${r * 0.68},${r * 0.08} Z`);
    const shield = P2(`M${r * 0.42},${-r * 0.5} L${r * 0.86},${-r * 0.5} L${r * 0.86},${-r * 0.12} C${r * 0.86},${r * 0.05} ${r * 0.64},${r * 0.12} ${r * 0.64},${r * 0.12} C${r * 0.64},${r * 0.12} ${r * 0.42},${r * 0.05} ${r * 0.42},${-r * 0.12} Z`);
    inkAll([[brim, '#c8281e'], [dome, '#e8382e']], 1.2, L);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-r * 0.25, -r * 0.42, r * 0.2, r * 0.09, -0.4);
    ctx.strokeStyle = '#a81e18'; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.moveTo(-r * 0.66, -r * 0.1); ctx.quadraticCurveTo(-r * 0.1, -r * 0.92, r * 0.5, -r * 0.42); ctx.stroke();
    ink(shield, '#ffd84a', 1, L);
    text('1', r * 0.64, -r * 0.22, r * 0.34, '#a8301a', 'center', 800);
  };
  CR_HOLD.k2nozzle = (L, t) => {
    // a coil of hose with a shiny brass nozzle that dribbles now and then
    ctx.strokeStyle = L; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(-2, 4); ctx.bezierCurveTo(-26, 30, -40, 58, -14, 70); ctx.stroke();
    ctx.strokeStyle = '#c8281e'; ctx.lineWidth = 7; ctx.stroke();
    ctx.save(); ctx.rotate(-0.55);
    ink(P2('M-7,6 L-6,-14 L-10,-34 L10,-34 L6,-14 L7,6 Z'), '#ffcf3a', 1, L);
    inkRect(-9, -8, 18, 6, '#e8a020', 1.5, 2);
    const d = (t * 1.3) % 1;
    if (d < 0.6) { ctx.fillStyle = '#7fd0ff'; ellipse(0, -38 - d * 10, 3.5, 4.5); }
    ctx.restore();
  };
  CHARACTERS[FRIEND] = {
    col: '#ffffff', line: '#4a3a5a', bw: 40, bh: 66, hr: 40, ears: 'floppy', earCol: SPOT, nose: 'muzzle', muzzle: '#ffffff',
    mouth: 'tongue', eyes: 'big', iris: '#7a4a1a', spots: SPOT, tail: 'thin', tailCol: '#ffffff', hat: 'k2firehelmet', hatTilt: 0,
    neckwear: 'collar', hold: 'k2nozzle', bigFeet: true, feetCol: '#e8382e', shape: 'pear', seed: 4.21,
  };

  // --- small props ---------------------------------------------------------------------------
  function drawHydrant(x, gy, s) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    const body = P2('M-12,0 L-12,-38 C-12,-50 12,-50 12,-38 L12,0 Z');
    const cap = P2('M-14,-44 L14,-44 L10,-56 C4,-62 -4,-62 -10,-56 Z');
    const arms = P2('M-20,-32 L20,-32 L20,-22 L-20,-22 Z');
    const base = P2('M-17,0 L17,0 L15,-7 L-15,-7 Z');
    inkAll([[arms, '#e8382e'], [body, '#ff4a3a'], [cap, '#ffd84a'], [base, '#c8281e']], 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-8, -40, 4, 30);
    ctx.restore();
  }
  function drawCone(x, gy, s) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    inkAll([[P2('M-18,0 L18,0 L18,-6 L-18,-6 Z'), '#ff8a2a'], [P2('M-11,-6 L-3,-40 L3,-40 L11,-6 Z'), '#ff8a2a']], 1.2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-7, -24, 14, 6);
    ctx.restore();
  }
  function drawPuppyHead(x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const flap = Math.sin(t * 4) * 0.15;
    const head = new Path2D(); head.arc(0, 0, 15, 0, Math.PI * 2);
    const earL = new Path2D(); earL.ellipse(-14, 2, 6, 11, 0.3 + flap, 0, Math.PI * 2);
    const earR = new Path2D(); earR.ellipse(14, 2, 6, 11, -0.3 - flap, 0, Math.PI * 2);
    inkAll([[earL, SPOT], [earR, SPOT], [head, '#ffffff']], 1.2);
    ctx.fillStyle = SPOT; circle(-6, -9, 3); circle(8, -8, 2);
    ctx.fillStyle = '#1a0a14'; circle(-5, -1, 2.4); circle(5, -1, 2.4);
    ctx.fillStyle = '#ffffff'; circle(-4.4, -1.8, 0.8); circle(5.6, -1.8, 0.8);
    ctx.fillStyle = '#1a0a14'; ellipse(0, 5, 3.5, 2.6);
    ctx.fillStyle = '#ff7f9a'; ellipse(0, 11, 2.6, 3);
    ctx.restore();
  }
  // a little kitten sitting, origin at its bottom; wave lifts a paw
  function drawKitten(x, y, s, t, col, wave = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sw = Math.sin(t * 3) * 4;
    const tail = P2(`M8,-4 C30,-4 36,-22 ${28 + sw},-40 C${34 + sw},-24 26,-12 10,-13 Z`);
    const body = new Path2D(); body.ellipse(0, -15, 16, 15, 0, 0, Math.PI * 2);
    const head = new Path2D(); head.arc(0, -40, 15, 0, Math.PI * 2);
    const ears = P2('M-14,-44 L-12,-62 L-2,-53 Z M14,-44 L12,-62 L2,-53 Z');
    const paw = new Path2D(); paw.arc(15, -24 - wave * 14, 5.5, 0, Math.PI * 2);
    inkAll([[tail, col], [body, col], [ears, col], [head, col], ...(wave ? [[paw, col]] : [])], 1.3);
    ctx.fillStyle = '#ffb0c8'; tri(-11, -48, -10, -57, -5, -52); tri(11, -48, 10, -57, 5, -52);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(0, -10, 8, 7);
    ctx.fillStyle = '#1a0a14'; ellipse(-5.5, -42, 2.6, 3.4); ellipse(5.5, -42, 2.6, 3.4);
    ctx.fillStyle = '#ffffff'; circle(-4.8, -43.2, 1); circle(6.2, -43.2, 1);
    ctx.fillStyle = '#ff6f9a'; tri(-2.4, -36.5, 2.4, -36.5, 0, -34);
    ctx.strokeStyle = '#5a3a4a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-4, -32); ctx.quadraticCurveTo(-2, -30, 0, -33); ctx.quadraticCurveTo(2, -30, 4, -32); ctx.stroke();
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 6, -35); ctx.lineTo(k * 18, -37); ctx.moveTo(k * 6, -33); ctx.lineTo(k * 18, -31); ctx.stroke(); }
    ctx.restore();
  }
  // cartoon flame with a little face; r is about its half-width, (x, y) its base
  function drawFlame(x, y, r, t, ph, wet = 0) {
    const f = 1 + Math.sin(t * 9 + ph) * 0.09, sw = Math.sin(t * 6 + ph) * r * 0.14;
    const shape = k => P2(`M${x - r * 0.8 * k},${y} C${x - r * k},${y - r * 0.9 * k} ${x - r * 0.35 * k + sw},${y - r * 1.2 * k} ${x + sw * 1.3},${y - r * 2.1 * f * k} C${x + r * 0.35 * k + sw},${y - r * 1.3 * k} ${x + r * k},${y - r * 0.9 * k} ${x + r * 0.8 * k},${y} C${x + r * 0.6 * k},${y + r * 0.5 * k} ${x - r * 0.6 * k},${y + r * 0.5 * k} ${x - r * 0.8 * k},${y} Z`);
    ink(shape(1), '#ff6a2a', 1.4, '#a8301a');
    ctx.fillStyle = '#ffb02a'; ctx.fill(shape(0.72));
    ctx.fillStyle = '#fff2a0'; ctx.fill(shape(0.42));
    ctx.fillStyle = '#7a2a1a';
    if (wet > 0) { ellipse(x - r * 0.25, y - r * 0.55, r * 0.07, r * 0.12); ellipse(x + r * 0.25, y - r * 0.55, r * 0.07, r * 0.12); ellipse(x, y - r * 0.18, r * 0.12, r * 0.15); }
    else { circle(x - r * 0.25, y - r * 0.55, r * 0.08); circle(x + r * 0.25, y - r * 0.55, r * 0.08); ctx.strokeStyle = '#7a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - r * 0.3, r * 0.16, 0.3, Math.PI - 0.3); ctx.stroke(); }
  }

  // --- the fire engine (side view, facing right, origin on the ground between the wheels) -----
  function drawTruck(x, gy, s, t, o = {}) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s * (o.dir || 1), s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,20,60,.22)'; ellipse(0, 0, 138, 9);
    const body = P2('M-130,-24 L-130,-94 Q-130,-100 -124,-100 L44,-100 L44,-24 Z');
    const cab = P2('M36,-24 L36,-114 Q36,-122 44,-122 L94,-122 Q106,-122 112,-110 L128,-72 Q132,-64 132,-52 L132,-24 Z');
    const bump = P2('M-136,-36 L138,-36 Q142,-36 142,-30 L142,-22 Q142,-18 138,-18 L-136,-18 Q-140,-18 -140,-22 L-140,-30 Q-140,-36 -136,-36 Z');
    inkAll([[body, '#e8382e'], [cab, '#e8382e'], [bump, '#dfe3ee']], 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-124, -96, 162, 6); ctx.fillRect(44, -118, 48, 5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-130, -62, 261, 7);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(-130, -55, 262, 3);
    for (let i = 0; i < 3; i++) { inkRect(-122 + i * 54, -92, 46, 26, '#ff5e4e', 1.4, 5); inkRect(-105 + i * 54, -82, 12, 4, '#dfe3ee', 1, 2); }
    for (let i = 0; i < 2; i++) inkRect(-50 + i * 46, -50, 38, 12, '#ff5e4e', 1.2, 3);
    const win = P2('M54,-114 L92,-114 Q100,-114 104,-106 L118,-76 L54,-76 Z');
    ink(win, '#bfe8ff', 1.3);
    if (o.driver && IMG.face_happy) {
      ctx.save(); ctx.clip(win); ctx.drawImage(IMG.face_happy, 62, -112, 36, 40); ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.stroke(win);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(98, -108); ctx.lineTo(110, -84); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,20,30,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(50, -72); ctx.lineTo(50, -38); ctx.stroke();
    inkRect(58, -70, 12, 4, '#dfe3ee', 1, 2);
    inkCircle(96, -44, 9, '#ffd84a', 1.1); text('1', 96, -44, 12, '#a8301a', 'center', 800);
    inkCircle(128, -46, 6, '#fff6a8', 1);
    // flashing light bar
    const fl = Math.sin(t * 10) > 0;
    if (o.siren) {
      const gx = fl ? 64 : 86, gc = fl ? 'rgba(255,70,70,' : 'rgba(80,140,255,';
      const gr = ctx.createRadialGradient(gx, -127, 2, gx, -127, 44);
      gr.addColorStop(0, gc + '.55)'); gr.addColorStop(1, gc + '0)');
      ctx.fillStyle = gr; ctx.fillRect(gx - 44, -171, 88, 88);
    }
    inkRect(52, -133, 46, 11, '#ffffff', 1.3, 5);
    ctx.fillStyle = fl ? '#ff3a3a' : '#a82a3a'; ctx.fillRect(55, -130, 19, 5);
    ctx.fillStyle = fl ? '#2a5ad0' : '#6ab8ff'; ctx.fillRect(76, -130, 19, 5);
    if (!o.noLadder) {
      inkRect(-140, -114, 184, 10, '#eef1f8', 1.2, 3);
      ctx.strokeStyle = '#9aa0b8'; ctx.lineWidth = 2; ctx.beginPath();
      for (let lx = -132; lx < 40; lx += 13) { ctx.moveTo(lx, -112); ctx.lineTo(lx, -106); }
      ctx.stroke();
      inkRect(-104, -104, 6, 5, '#9aa0b8', 1, 1); inkRect(14, -104, 6, 5, '#9aa0b8', 1, 1);
    }
    // hose reel at the back
    inkCircle(-112, -40, 13, '#ffd84a', 1.2);
    ctx.strokeStyle = '#c8281e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-112, -40, 8, 0, Math.PI * 1.7); ctx.stroke();
    inkCircle(-112, -40, 3, '#9aa0b8', 0.6);
    if (o.cannon != null) {
      ctx.save(); ctx.translate(-14, -112); ctx.rotate(o.cannon);
      inkRect(0, -5, 36, 10, '#ffcf3a', 1.2, 4); inkRect(30, -7, 8, 14, '#e8a020', 1, 2);
      ctx.restore(); inkCircle(-14, -112, 8, '#c8ccd8', 1.2);
    }
    for (const wx of [-84, 84]) {
      ctx.fillStyle = '#8a1e22'; ctx.beginPath(); ctx.arc(wx, -22, 27, Math.PI, 0); ctx.fill();
      inkCircle(wx, -20, 21, '#2a2230', 1.4);
      inkCircle(wx, -20, 9, '#dfe3ee', 1);
      const r = o.roll || 0; ctx.fillStyle = '#7a7e90';
      for (let i = 0; i < 4; i++) circle(wx + Math.cos(r + i * 1.57) * 5, -20 + Math.sin(r + i * 1.57) * 5, 1.8);
    }
    ctx.restore();
  }

  // =============================================================================================
  // BACKDROP: Freckles' Fire Station
  // =============================================================================================
  function fsEngineFront(ex, t) {
    // the fire engine peeking out of the open garage, seen from the front
    const fl = Math.sin(t * 2.6) > 0;
    for (const [lx, on, c] of [[ex - 26, fl, '255,70,70'], [ex + 26, !fl, '80,140,255']]) {
      if (!on) continue;
      const gr = ctx.createRadialGradient(lx, 309, 2, lx, 309, 60);
      gr.addColorStop(0, `rgba(${c},.5)`); gr.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = gr; ctx.fillRect(lx - 60, 249, 120, 120);
    }
    const body = new Path2D(); body.roundRect(ex - 82, 316, 164, 126, 14);
    const bar = new Path2D(); bar.roundRect(ex - 52, 302, 104, 14, 6);
    const bump = new Path2D(); bump.roundRect(ex - 90, 426, 180, 16, 6);
    inkAll([[bar, '#ffffff'], [body, '#e8382e'], [bump, '#dfe3ee']], 1.6);
    ctx.fillStyle = fl ? '#ff3a3a' : '#a82a3a'; ctx.fillRect(ex - 48, 305, 44, 8);
    ctx.fillStyle = !fl ? '#2a5ad0' : '#6ab8ff'; ctx.fillRect(ex + 4, 305, 44, 8);
    inkRect(ex - 68, 328, 136, 46, '#bfe8ff', 2.5, 8);
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ex, 328); ctx.lineTo(ex, 374); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ex - 56, 366); ctx.lineTo(ex - 36, 334); ctx.moveTo(ex + 14, 366); ctx.lineTo(ex + 30, 340); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(ex - 82, 380, 164, 6);
    inkRect(ex - 36, 390, 72, 34, '#dfe3ee', 2.5, 5);
    ctx.strokeStyle = '#9aa0b8'; ctx.lineWidth = 2; ctx.beginPath();
    for (let gx = ex - 28; gx <= ex + 28; gx += 8) { ctx.moveTo(gx, 394); ctx.lineTo(gx, 420); }
    ctx.stroke();
    inkCircle(ex, 407, 10, '#ffd84a', 1); text('1', ex, 407, 13, '#a8301a', 'center', 800);
    for (const k of [-1, 1]) { inkCircle(ex + k * 62, 404, 11, '#fff6a8', 1.2); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(ex + k * 62 - 3, 400, 3.5); }
    ctx.fillStyle = SPOT; ctx.fillRect(ex - 80, 442, 22, 10); ctx.fillRect(ex + 58, 442, 22, 10);
  }
  function fsDoorPath(x0, x1, y0, gy) { return P2(`M${x0},${gy} L${x0},${y0 + 30} Q${x0},${y0} ${x0 + 30},${y0} L${x1 - 30},${y0} Q${x1},${y0} ${x1},${y0 + 30} L${x1},${gy} Z`); }
  function drawFireStation() {
    const t = S.t, GYS = 452, L0 = 286, R0 = 806, WT = 196, CX = (L0 + R0) / 2;
    bdSky('#56c2ff', '#eaf9ff');
    bdSunburst(902, 98);
    bdClouds(4);
    bdHills('#b4e8a0', 322, 22, 0.006, 0.5);
    [[30, 306, '#ffd1dc', '#d0605a'], [96, 312, '#fff1b8', '#5a7ad0'], [846, 304, '#d6f5d6', '#c84a7a'], [918, 300, '#e8d6ff', '#e0904a']].forEach(([x, y, c, r]) => {
      inkRect(x - 16, y - 18, 32, 22, c, 1.5, 2); ctx.fillStyle = r; tri(x - 21, y - 17, x, y - 34, x + 21, y - 17);
      ctx.fillStyle = '#bfe6ff'; ctx.fillRect(x - 6, y - 12, 12, 9);
    });
    bdHills('#96d882', 376, 14, 0.01, 2);
    drawTree(56, GYS + 4, 250, 60, 0, 0);
    drawTree(268, GYS - 20, 190, 50, 2, 0);
    drawTree(930, GYS + 4, 240, 58, 1, 0);

    // --- the hose tower with its swinging bell ---
    const TX = 191;
    const tower = new Path2D(); tower.rect(TX - 32, 150, 64, GYS - 150);
    const bel = new Path2D(); bel.rect(TX - 40, 96, 80, 56);
    const troof = P2(`M${TX - 52},${100} L${TX},${64} L${TX + 52},${100} Z`);
    inkAll([[tower, '#d8473a'], [bel, '#fff4e8'], [troof, '#8a2a3a']], 1.6);
    ctx.fillStyle = '#4a2a3a'; ctx.beginPath(); ctx.roundRect(TX - 30, 106, 60, 42, [16, 16, 0, 0]); ctx.fill();
    ctx.save(); ctx.translate(TX, 108); ctx.rotate(Math.sin(t * 2.2) * 0.28);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 8); ctx.stroke();
    ink(P2('M-15,32 C-15,14 -10,8 0,8 C10,8 15,14 15,32 L19,36 L-19,36 Z'), '#ffcf3a', 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-8, 14, 4, 16);
    inkCircle(0, 39, 4, '#e8a020', 0.8);
    ctx.restore();
    ctx.save(); ctx.clip(tower); ctx.strokeStyle = 'rgba(120,30,30,.3)'; ctx.lineWidth = 1.5;
    for (let y = 166; y < GYS; y += 16) { ctx.beginPath(); ctx.moveTo(TX - 32, y); ctx.lineTo(TX + 32, y); ctx.stroke(); }
    ctx.restore();
    for (const y of [178, 262]) { inkRect(TX - 9, y, 18, 40, '#bfe8ff', 1.3, 9); }
    vecStar(TX, 345, 14, '#ffd84a', 1.2);
    // hose hanging off the tower, dripping into a puddle
    ctx.strokeStyle = OL; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(TX + 30, 168); ctx.bezierCurveTo(TX + 64, 200, TX + 26, 300, TX + 52, 372); ctx.stroke();
    ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 7; ctx.stroke();
    inkCircle(TX + 30, 168, 6, '#9aa0b8', 1);
    inkAt(TX + 52, 372, 0.25, P2('M-6,0 L6,0 L4,18 L-4,18 Z'), '#ffcf3a', 1.2);
    const dk = (t * 0.9) % 1;
    ctx.fillStyle = '#5fc8ff'; ellipse(TX + 48, 394 + dk * 90, 3, 4.5);
    ctx.fillStyle = 'rgba(120,200,255,.55)'; ellipse(TX + 40, 492, 50, 10);
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - ((t * 0.9 + 0.1) % 1))})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(TX + 40, 492, 8 + ((t * 0.9 + 0.1) % 1) * 34, 2 + ((t * 0.9 + 0.1) % 1) * 7, 0, 0, Math.PI * 2); ctx.stroke();

    // --- the station building ---
    const wall = new Path2D(); wall.rect(L0, WT, R0 - L0, GYS - WT);
    const ped = P2(`M${L0 - 18},${WT + 4} L${CX},${WT - 76} L${R0 + 18},${WT + 4} Z`);
    inkAll([[ped, '#c23a30'], [wall, '#d8473a']], 1.6);
    ctx.save(); ctx.clip(wall); ctx.strokeStyle = 'rgba(120,30,30,.28)'; ctx.lineWidth = 1.5;
    for (let y = WT + 12, row = 0; y < GYS; y += 16, row++) {
      ctx.beginPath(); ctx.moveTo(L0, y); ctx.lineTo(R0, y);
      for (let x = L0 + (row % 2) * 18; x < R0; x += 36) { ctx.moveTo(x, y); ctx.lineTo(x, y + 16); }
      ctx.stroke();
    }
    ctx.restore();
    inkRect(L0 - 12, WT - 4, R0 - L0 + 24, 14, '#fff4e8', 1.5, 4);
    inkRect(CX - 128, WT - 50, 256, 36, '#fff4e8', 1.5, 10);
    text('FIRE STATION', CX, WT - 31, 23, '#c23a30', 'center', 800);
    for (const k of [-1, 1]) { ctx.fillStyle = SPOT; circle(CX + k * 112, WT - 38, 4); circle(CX + k * 118, WT - 26, 3); }
    // upstairs windows (one has a puppy peeking out)
    [330, 450, 642, 762].forEach((wx, i) => {
      const r = new Path2D(); r.roundRect(wx - 28, WT + 18, 56, 40, [14, 14, 3, 3]);
      ink(r, '#bfe8ff', 1.3);
      if (i === 2) {
        const pk = (Math.sin(t * 1.3) + 1) / 2;
        ctx.save(); ctx.clip(r); drawPuppyHead(wx + Math.sin(t * 0.7) * 6, WT + 70 - pk * 30, 1, t); ctx.restore();
      }
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.stroke(r);
      ctx.strokeStyle = '#fff4e8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, WT + 20); ctx.lineTo(wx, WT + 57); ctx.stroke();
      inkRect(wx - 32, WT + 56, 64, 7, '#fff4e8', 1.2, 2);
      if (i !== 2) for (let f = 0; f < 3; f++) flower(wx - 18 + f * 18, WT + 54, 6, ['#ff6fae', '#ffd84a', '#ffffff'][(f + i) % 3], '#ff9a3d', 0.8);
    });
    // garage doors: the left one is open with the engine inside
    const d1 = fsDoorPath(330, 530, 278, GYS), d2 = fsDoorPath(562, 762, 278, GYS);
    const fr1 = fsDoorPath(320, 540, 268, GYS), fr2 = fsDoorPath(552, 772, 268, GYS);
    inkAll([[fr1, '#fff4e8'], [fr2, '#fff4e8']], 1.4);
    const dark = ctx.createLinearGradient(0, 278, 0, GYS); dark.addColorStop(0, '#2a1a30'); dark.addColorStop(1, '#4a3448');
    ink(d1, dark, 1.3);
    ctx.save(); ctx.clip(d1);
    ctx.fillStyle = 'rgba(255,240,200,.12)'; tri(380, 278, 480, 278, 520, GYS); // a soft light inside
    // the rolled-up door at the top
    ctx.fillStyle = '#e8ded4'; ctx.fillRect(330, 278, 200, 18); ctx.strokeStyle = 'rgba(90,60,90,.35)'; ctx.lineWidth = 1.5;
    for (let y = 284; y < 296; y += 6) { ctx.beginPath(); ctx.moveTo(330, y); ctx.lineTo(530, y); ctx.stroke(); }
    // helmets hanging on hooks
    for (const [hx, c] of [[352, '#e8382e'], [508, '#ffd84a']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(hx, 330, 12, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(hx - 15, 329, 30, 3); }
    fsEngineFront(430, t);
    ctx.restore();
    ink(d2, '#f4ece4', 1.3);
    ctx.save(); ctx.clip(d2);
    ctx.strokeStyle = 'rgba(120,90,110,.35)'; ctx.lineWidth = 2;
    for (let y = 300; y < GYS; y += 24) { ctx.beginPath(); ctx.moveTo(562, y); ctx.lineTo(762, y); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 4; i++) inkRect(576 + i * 46, 330, 36, 20, '#bfe8ff', 1.2, 4);
    inkRect(650, 424, 24, 8, '#9aa0b8', 1.2, 3);
    // hazard stripes on the floor in front of the doors
    for (const [x0, x1] of [[330, 530], [562, 762]]) {
      ctx.save(); ctx.beginPath(); ctx.rect(x0, GYS + 2, x1 - x0, 14); ctx.clip();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x0, GYS + 2, x1 - x0, 14);
      ctx.fillStyle = SPOT; for (let x = x0 - 20; x < x1; x += 24) { ctx.beginPath(); ctx.moveTo(x, GYS + 16); ctx.lineTo(x + 12, GYS + 2); ctx.lineTo(x + 22, GYS + 2); ctx.lineTo(x + 10, GYS + 16); ctx.fill(); }
      ctx.restore();
    }

    // --- forecourt ---
    ctx.fillStyle = '#ded6d2'; ctx.fillRect(0, GYS, W, H - GYS);
    ctx.fillStyle = '#7fcc66'; ctx.fillRect(0, GYS - 2, L0 - 150, 8); ctx.fillRect(R0 + 10, GYS - 2, W - R0, 8);
    ctx.strokeStyle = 'rgba(91,63,115,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, GYS + 1); ctx.lineTo(W, GYS + 1);
    for (let x = 60; x < W; x += 120) { ctx.moveTo(x, GYS + 22); ctx.lineTo(x - 30, H); }
    ctx.stroke();
    ctx.fillStyle = '#e8382e'; ctx.fillRect(0, H - 22, W, 5);
    // paw prints across the forecourt
    for (let i = 0; i < 6; i++) {
      const px = 420 + i * 34, py = 506 + (i % 2) * 12;
      ctx.fillStyle = 'rgba(90,60,80,.25)'; ellipse(px, py, 6, 5); circle(px - 6, py - 7, 2.4); circle(px, py - 9, 2.4); circle(px + 6, py - 7, 2.4);
    }

    // --- right side: flagpole, Freckles' spotty kennel, hydrant, cones ---
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(834, GYS); ctx.lineTo(834, 150); ctx.stroke();
    ctx.strokeStyle = '#eef1f8'; ctx.lineWidth = 3.5; ctx.stroke();
    inkCircle(834, 146, 6, '#ffd84a', 1);
    const fp = new Path2D(); fp.moveTo(836, 156);
    for (let i = 0; i <= 8; i++) fp.lineTo(836 + i * 8, 156 + Math.sin(t * 4 - i * 0.7) * 4 * (i / 8));
    for (let i = 8; i >= 0; i--) fp.lineTo(836 + i * 8, 196 + Math.sin(t * 4 - i * 0.7) * 4 * (i / 8));
    fp.closePath(); ink(fp, '#e8382e', 1.2);
    const fy = 176 + Math.sin(t * 4 - 3.5) * 2;
    ctx.fillStyle = '#ffffff'; ellipse(870, fy + 3, 6, 5); circle(864, fy - 4, 2.4); circle(870, fy - 6, 2.4); circle(876, fy - 4, 2.4);
    const kb = new Path2D(); kb.rect(860, 380, 90, 72);
    const kr = P2('M850,386 L905,342 L960,386 Z');
    inkAll([[kb, '#ffffff'], [kr, '#e8382e']], 1.5);
    ctx.save(); ctx.clip(kb); ctx.fillStyle = SPOT; for (const [sx, sy, sr] of [[872, 396, 7], [938, 404, 6], [930, 440, 8], [868, 438, 5]]) circle(sx, sy, sr); ctx.restore();
    ink(fsDoorPath(888, 922, 404, GYS), '#3a2840', 1.2);
    inkRect(878, 356, 54, 18, '#fff4e8', 1.2, 9);
    text('FRECKLES', 905, 365, 10, '#c23a30', 'center', 800);
    inkEllipse(906, GYS + 10, 18, 6, 0, '#5fb8f0', 1); ctx.fillStyle = '#ffd8a8'; ellipse(906, GYS + 7, 12, 3);
    drawHydrant(812, GYS + 26, 1.05);
    drawCone(28, GYS + 50, 1); drawCone(938, GYS + 58, 1.1);
  }
  BACKDROPS.firestation_k2 = () => drawFireStation();

  // =============================================================================================
  // GAME 1 (action): SIREN STREET
  // =============================================================================================
  const SIDE = 404, ROAD_GY = 508, TS = 0.86;
  const HOUSE_COLS = ['#ffd1dc', '#c6e2ff', '#fff1b8', '#d6f5d6', '#e8d6ff', '#ffdcc0'];
  const ROOF_COLS = ['#d0605a', '#5a7ad0', '#e0904a', '#4aa05a', '#9a5ac8', '#c84a7a'];
  const GO_BTN = { x: W - 168, y: 448, w: 150, h: 76 }, BACK_BTN = { x: 18, y: 448, w: 150, h: 76 };
  const HZ = 72; // how close to a house's middle the engine must park
  const CREDIT = [1, 0.6, 0.35, 0.15];

  function houseTop(h) { return SIDE - h.hgt; }
  function drawStreetHouse(h, sx, t, k) {
    const w = 150, x0 = sx - w / 2, top = houseTop(h);
    const body = new Path2D(); body.rect(x0, top, w, h.hgt);
    const roof = h.kind === 1
      ? P2(`M${x0 - 14},${top + 6} C${x0 + 10},${top - 70} ${x0 + w - 10},${top - 70} ${x0 + w + 14},${top + 6} Z`)
      : h.kind === 2 ? P2(`M${x0 - 12},${top + 6} L${x0 + 18},${top - 52} L${x0 + w - 18},${top - 52} L${x0 + w + 12},${top + 6} Z`)
        : P2(`M${x0 - 14},${top + 6} L${sx},${top - 64} L${x0 + w + 14},${top + 6} Z`);
    inkRect(sx + 34, top - 66, 20, 50, '#c88a6a', 2.5, 3);
    inkAll([[body, h.col], [roof, h.roof]], 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x0 + 4, top + 4, 8, h.hgt - 8);
    for (const [wx, wy] of h.wins) {
      const lit = h.fire && k.flames.some(f => f.hx === wx && f.hy === wy && f.hp > 0);
      inkRect(sx + wx - 20, SIDE + wy - 18, 40, 34, lit ? '#ffb05a' : '#bfe8ff', 2.5, 5);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx + wx, SIDE + wy - 16); ctx.lineTo(sx + wx, SIDE + wy + 14); ctx.moveTo(sx + wx - 18, SIDE + wy); ctx.lineTo(sx + wx + 18, SIDE + wy); ctx.stroke();
      inkRect(sx + wx - 23, SIDE + wy + 15, 46, 6, mix(h.roof, '#ffffff', 0.4), 1.5, 2);
    }
    // door with a little step
    const door = P2(`M${sx - 17},${SIDE} L${sx - 17},${SIDE - 44} Q${sx - 17},${SIDE - 60} ${sx},${SIDE - 60} Q${sx + 17},${SIDE - 60} ${sx + 17},${SIDE - 44} L${sx + 17},${SIDE} Z`);
    ink(door, mix(h.roof, '#3a2030', 0.25), 1.3);
    ctx.fillStyle = '#ffd84a'; circle(sx + 10, SIDE - 26, 3);
    // the number plaque up in the roof
    const py = top - 22, shown = h.show || h.reveal > 0 || h.saved;
    inkCircle(sx, py, 23, shown ? '#ffffff' : 'rgba(255,255,255,.35)', 1.4);
    if (shown) {
      if (!h.show) { ctx.fillStyle = `rgba(255,230,90,${0.35 + 0.25 * Math.sin(t * 6)})`; circle(sx, py, 23); }
      text(String(h.num), sx, py + 1, h.num > 9 ? 23 : 27, '#3a2a6a', 'center', 800);
    } else { ctx.fillStyle = '#9a8aa8'; circle(sx, py - 14, 2.5); text('?', sx, py + 2, 22, 'rgba(120,100,140,.6)', 'center', 800); }
    // front garden
    for (let i = 0; i < 4; i++) flower(x0 + 10 + i * 12, SIDE - 3, 6, ['#ff6fae', '#ffd84a', '#ffffff', '#c6a2ff'][(i + h.i) % 4], '#ff9a3d', 0.8);
    for (let i = 0; i < 3; i++) ink(P2(`M${x0 + w - 44 + i * 14},${SIDE} l0,-10 l6,-6 l6,6 l0,10 Z`), '#ffffff', 1);
    if (h.saved) {
      drawKitten(sx + h.wins[0][0], SIDE + h.wins[0][1] + 14, 0.5, t + h.i, ['#ffb060', '#c8c0d0', '#ffffff'][h.i % 3], (Math.sin(t * 6 + h.i) + 1) / 2);
      heart(sx + h.wins[0][0] + 22, SIDE + h.wins[0][1] - 32 + Math.sin(t * 3) * 3, 16, '#ff5f9a');
    }
  }
  function drawMiniStation(sx, t) {
    const body = new Path2D(); body.rect(sx - 110, SIDE - 190, 220, 190);
    const ped = P2(`M${sx - 122},${SIDE - 186} L${sx},${SIDE - 236} L${sx + 122},${SIDE - 186} Z`);
    inkAll([[ped, '#c23a30'], [body, '#d8473a']], 1.5);
    inkRect(sx - 80, SIDE - 222, 160, 26, '#fff4e8', 1.4, 8);
    text('FIRE STATION', sx, SIDE - 209, 15, '#c23a30', 'center', 800);
    ink(fsDoorPath(sx - 86, sx + 86, SIDE - 140, SIDE), '#3a2840', 1.3);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(sx - 86, SIDE - 6, 172, 6);
    drawPuppyHead(sx + 50, SIDE - 30 - Math.abs(Math.sin(t * 2)) * 8, 1, t);
    drawHydrant(sx + 136, SIDE + 2, 0.8);
  }

  MG.sirenstreet = {
    kind: 'action',
    title: () => 'Siren Street',
    icon: () => '🚒',
    how: g => (g.tier === 3 ? 'These houses count by twos, and some numbers fell off! Hold GO or BACK, let go to stop at the right house, then spray.'
      : g.tier === 2 ? 'Some house numbers fell off, so count along! Hold GO or BACK, let go to stop at the right house, then spray.'
        : 'Drive to the house with the right number! Hold GO or BACK, and let go to stop. Then tap and hold to spray!'),
    init(g) {
      const T = g.tier, n = [0, 8, 12, 12][T], step = T === 3 ? 2 : 1, SP = [0, 220, 205, 200][T];
      const houses = [];
      for (let i = 0; i < n; i++) {
        const hgt = 150 + ((i * 37) % 3) * 18;
        const wins = [[-38, -hgt + 40], [38, -hgt + 40], [-50, -38], [50, -38]];
        houses.push({ i, x: 560 + i * SP, num: (i + 1) * step, show: true, kind: (i * 2) % 3, col: HOUSE_COLS[(i * 5 + 2) % 6], roof: ROOF_COLS[(i * 2 + 1) % 6], hgt, wins, reveal: 0 });
      }
      if (T === 2) {
        // hide about half the signs, never two in a row, never the first or last
        for (let i = 1; i < n - 1; i++) if (houses[i - 1].show && Math.random() < 0.65) houses[i].show = false;
      } else if (T === 3) houses.forEach((h, i) => { h.show = i % 3 === 0 || i === n - 1; });
      const N = [0, 4, 5, 5][T], calls = [];
      const hidden = houses.filter(h => !h.show).map(h => h.i), all = houses.map(h => h.i);
      let prev = -1;
      for (let c = 0; c < N; c++) {
        const pool = (T > 1 && c % 2 === 1 && hidden.length ? hidden : all).filter(i => i !== prev && !calls.includes(i));
        prev = pick(pool.length ? pool : all.filter(i => i !== prev)); calls.push(prev);
      }
      g.k = {
        houses, calls, N, ci: 0, x: 220, v: 0, roll: 0, still: 0, parkedAt: 220, mode: 'drive', wrong: 0, credit: 0,
        flames: [], drops: [], steam: [], msg: null, hint: 0, END: houses[n - 1].x + 330, cam: 0, beepT: 0, engT: 0, hissT: 0, yay: 0, aim: null,
      };
      g.progress = `Call 1 of ${N}`;
    },
    start(g) { this.announce(g); },
    target(k) { return k.houses[k.calls[k.ci]]; },
    announce(g) {
      const k = g.k, h = this.target(k);
      g.progress = `Call ${k.ci + 1} of ${k.N}`;
      SFX.alert();
      say(g, k.ci === 0 ? `Ding ding! Fire alarm at number ${h.num}! Drive the fire engine to house number ${h.num}!` : `Ding ding! Another alarm! Number ${h.num}!`);
    },
    update(g, dt) {
      const k = g.k;
      if (k.msg && (k.msg.t -= dt) <= 0) k.msg = null;
      for (const h of k.houses) if (h.reveal > 0) h.reveal -= dt;
      for (const d of k.drops) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 900 * dt; d.life -= dt; }
      k.drops = k.drops.filter(d => d.life > 0);
      for (const s of k.steam) { s.y -= 40 * dt; s.r += 16 * dt; s.life -= dt; }
      k.steam = k.steam.filter(s => s.life > 0);
      if (k.mode === 'drive') this.drive(g, k, dt);
      else if (k.mode === 'spray') this.spray(g, k, dt);
      else if (k.mode === 'yay') { if ((k.yay -= dt) <= 0) { k.ci++; k.wrong = 0; k.hint = 0; k.mode = 'drive'; k.parkedAt = k.x; this.announce(g); } }
      else if (k.mode === 'end') { if ((k.yay -= dt) <= 0) g.done = true; }
      k.cam = clamp(k.x - 400, 0, k.END - W);
    },
    drive(g, k, dt) {
      const fwd = goRight() || keys.d || (pointer.down && inRect(GO_BTN)), back = goLeft() || (pointer.down && inRect(BACK_BTN));
      const A = 420, BR = 780, FR = 380;
      if (fwd && !back) k.v += (k.v < 0 ? BR : A) * dt;
      else if (back && !fwd) k.v -= (k.v > 0 ? BR : A) * dt;
      else { const d = FR * dt; k.v = Math.abs(k.v) <= d ? 0 : k.v - Math.sign(k.v) * d; }
      k.v = clamp(k.v, -280, 420);
      k.x += k.v * dt;
      if (k.x < 200) { k.x = 200; k.v = Math.max(0, k.v); }
      if (k.x > k.END - 170) { k.x = k.END - 170; k.v = Math.min(0, k.v); }
      k.roll += k.v * dt / 18;
      if (k.v < -5 && (k.beepT -= dt) <= 0) { k.beepT = 0.45; tone(1150, 0.12, 'square', 0.03); }
      if ((fwd || back) && (k.engT -= dt) <= 0) { k.engT = 0.13; tone(70 + Math.abs(k.v) * 0.25, 0.13, 'sawtooth', 0.018); }
      if (!fwd && !back && k.v === 0) k.still += dt; else k.still = 0;
      if (k.still > 0.45 && Math.abs(k.x - k.parkedAt) > 30) { k.parkedAt = k.x; this.park(g, k); }
    },
    park(g, k) {
      const tgt = this.target(k);
      const h = k.houses.reduce((b, q) => (Math.abs(q.x - k.x) < Math.abs(b.x - k.x) ? q : b));
      if (Math.abs(h.x - k.x) > HZ) {
        const s = k.x < k.houses[0].x - HZ ? 'Keep going! The houses are this way.' : 'Stop right in front of a house!';
        k.msg = { str: s, t: 2.2 }; say(g, s); return;
      }
      if (h === tgt) {
        k.mode = 'spray'; h.fire = true; k.hint = 0;
        const n = [0, 2, 3, 3][g.tier];
        k.flames = shuffle(h.wins.slice()).slice(0, n).map(([wx, wy], j) => ({ hx: wx, hy: wy, x: h.x + wx, y: SIDE + wy + 14, hp: 1, ph: j * 1.7, wet: 0 }));
        SFX.alert(); burst(h.x - k.cam, houseTop(h) - 22, 18);
        say(g, `Number ${h.num}! You found it! Now tap and hold on the flames to spray them!`);
        k.msg = { str: `Number ${h.num}! Spray the flames!`, t: 2.6, good: true };
        return;
      }
      k.wrong++; h.reveal = 3.5; SFX.miss();
      const fw = tgt.num > h.num; k.hint = fw ? 1 : -1;
      const s = `This is number ${h.num}. We need number ${tgt.num}. ${tgt.num} is ${fw ? 'bigger, so drive forward!' : 'smaller, so back up!'}`;
      k.msg = { str: s, t: 4 }; say(g, s);
    },
    nozzle(k) { return [k.x - 14 * TS, ROAD_GY - 112 * TS]; },
    spray(g, k, dt) {
      const live = k.flames.filter(f => f.hp > 0);
      let aim = null;
      if (pointer.down && pointer.y > 60 && pointer.y < 440) aim = [pointer.x + k.cam, pointer.y];
      else if ((keys[' '] || keys.arrowup || keys.enter) && live.length) aim = [live[0].x, live[0].y - 18];
      k.aim = aim;
      const [nx, ny] = this.nozzle(k);
      if (aim) {
        for (let i = 0; i < 3; i++) {
          const T = 0.42, tx = aim[0] + rand(-8, 8), ty = aim[1] + rand(-8, 8);
          k.drops.push({ x: nx, y: ny, vx: (tx - nx) / T, vy: (ty - ny) / T - 0.5 * 900 * T, life: T + 0.05, r: rand(3, 6) });
        }
        if ((k.hissT -= dt) <= 0) { k.hissT = 0.09; SFX.scrub(); }
      }
      for (const f of live) {
        const hit = aim && Math.hypot(f.x - aim[0], f.y - 22 - aim[1]) < 58;
        if (hit) {
          f.hp -= dt * [0, 1.25, 1.0, 0.9][g.tier]; f.wet = 0.2;
          if (Math.random() < 0.3) k.steam.push({ x: f.x + rand(-14, 14), y: f.y - 30, r: rand(8, 14), life: 1 });
          if (f.hp <= 0) {
            f.hp = 0; SFX.pop(); tone(660, 0.1, 'triangle', 0.07, 0.05);
            burst(f.x - k.cam, f.y - 20, 14, { colors: ['#ffffff', '#bfe8ff', '#dfe3ee'], spread: 90, up: 70 });
            floatText(f.x - k.cam, f.y - 50, 'Pssshhh!', '#e8f8ff', false, 22);
          }
        } else { f.wet = Math.max(0, f.wet - dt); f.hp = Math.min(1, f.hp + dt * 0.12); }
      }
      if (!k.flames.some(f => f.hp > 0)) {
        const h = this.target(k); h.fire = false; h.saved = true; h.reveal = 0;
        const c = CREDIT[Math.min(k.wrong, 3)];
        k.credit += c; g.score = k.credit / k.N;
        SFX.sparkle(); burst(h.x - k.cam, SIDE - h.hgt / 2, 26, { kind: 'emoji', colors: ['⭐', '💖', '✨'], spread: 160, up: 120, size: [3, 5] });
        const last = k.ci === k.N - 1;
        say(g, last ? `Hooray! Every fire is out! Number ${h.num} is safe. What a firefighter!` : `Fire out! The kitten at number ${h.num} is safe!`);
        k.msg = { str: k.wrong === 0 ? 'Fire out! Right house first time! ⭐' : 'Fire out! Everyone is safe!', t: 2.4, good: true };
        k.mode = last ? 'end' : 'yay'; k.yay = last ? 2.6 : 2.2; k.aim = null;
      }
    },
    draw(g) {
      const k = g.k, cam = k.cam, t = S.t;
      bdSky('#5cc6ff', '#e8f8ff'); bdSunburst(880, 100); bdClouds(4, 'rgba(255,255,255,.9)', 70);
      bdHills('#b4e8a0', 296, 22, 0.007, cam * 0.0012);
      tiled(cam, 0.3, 250, 30, 120, x => {
        ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x + 54, 280, 10, 50);
        for (const [dx, dy, r, c] of [[60, 270, 34, '#4fbf5f'], [36, 286, 24, '#5fcf6a'], [86, 286, 26, '#3fae55']]) inkCircle(x + dx, dy, r, c, 1.2, 'rgba(60,90,60,.45)');
      });
      bdHills('#8fd67a', 352, 14, 0.011, 2 + cam * 0.002);
      ctx.fillStyle = '#7fcc66'; ctx.fillRect(0, SIDE - 46, W, 50);
      // world things
      drawMiniStation(150 - cam, t);
      for (const h of k.houses) {
        const sx = h.x - cam;
        if (sx > -260 && sx < W + 260) {
          // a tree and a lamp post between houses
          const tx = sx + 104;
          ctx.fillStyle = '#8a6a4a'; ctx.fillRect(tx - 5, SIDE - 70, 10, 70);
          for (const [dx, dy, r, c] of [[0, -96, 30, '#4fbf5f'], [-18, -78, 22, '#5fcf6a'], [18, -78, 22, '#3fae55']]) inkCircle(tx + dx, SIDE + dy, r, c, 1.3);
          drawStreetHouse(h, sx, t, k);
        }
      }
      const endX = k.END - cam - 90;
      if (endX < W + 60) { inkRect(endX - 6, SIDE - 110, 12, 130, '#eef1f8', 2.5, 3); inkRect(endX - 46, SIDE - 132, 92, 34, '#ffd84a', 2.5, 8); text('END', endX, SIDE - 115, 18, '#5a3a20', 'center', 800); }
      // sidewalk, curb and road
      ctx.fillStyle = '#e8dccc'; ctx.fillRect(0, SIDE, W, 22);
      ctx.strokeStyle = 'rgba(120,100,90,.35)'; ctx.lineWidth = 2; ctx.beginPath();
      tiled(cam, 1, 60, 0, 2, x => { ctx.moveTo(x, SIDE); ctx.lineTo(x, SIDE + 22); });
      ctx.stroke();
      ctx.fillStyle = '#b8a8a0'; ctx.fillRect(0, SIDE + 22, W, 7);
      ctx.fillStyle = '#6c667c'; ctx.fillRect(0, SIDE + 29, W, H - SIDE - 29);
      ctx.fillStyle = '#fff2a8'; tiled(cam, 1, 90, 0, 46, x => ctx.fillRect(x, 520, 46, 6));
      // fire, flames, steam
      if (k.mode === 'spray' || k.mode === 'yay' || k.mode === 'end') {
        for (const f of k.flames) {
          if (f.hp <= 0) continue;
          const sx = f.x - cam, r = 14 + f.hp * 16;
          for (let i = 0; i < 2; i++) { const sy = (t * 30 + i * 40 + f.ph * 20) % 80; ctx.fillStyle = `rgba(120,110,130,${0.35 * (1 - sy / 80)})`; circle(sx + Math.sin(t + i) * 8, f.y - 50 - sy, 12 + sy * 0.2); }
          drawFlame(sx, f.y, r, t, f.ph, f.wet);
        }
      }
      for (const s of k.steam) { ctx.fillStyle = `rgba(255,255,255,${0.6 * s.life})`; circle(s.x - cam, s.y, s.r); }
      // the fire engine with Aubrey driving and Freckles riding on the back step
      const tsx = k.x - cam;
      const [nx, ny] = this.nozzle(k);
      const cannon = k.aim ? Math.atan2(k.aim[1] - ny, k.aim[0] - nx) : -0.35;
      drawTruck(tsx, ROAD_GY, TS, t, { driver: true, siren: true, roll: k.roll, cannon, noLadder: false });
      drawCritter(FRIEND, tsx - 150 * TS, ROAD_GY - 4, 0.36, 1);
      for (const d of k.drops) { ctx.fillStyle = 'rgba(90,180,255,.85)'; circle(d.x - cam, d.y, d.r); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(d.x - cam - 1, d.y - 1, d.r * 0.35); }
      if (k.aim) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(k.aim[0] - cam, k.aim[1], 22 + Math.sin(t * 10) * 3, 0, Math.PI * 2); ctx.stroke(); }
      // hint arrow after a wrong stop
      if (k.mode === 'drive' && k.hint) {
        const ax = tsx + k.hint * (170 + Math.sin(t * 6) * 10), ay = 372;
        ctx.save(); ctx.translate(ax, ay); ctx.scale(k.hint, 1);
        ink(P2('M-34,-12 L6,-12 L6,-28 L38,0 L6,28 L6,12 L-34,12 Z'), '#ffd84a', 1.6);
        ctx.restore();
      }
      // --- HUD: the call card ---
      const tgt = this.target(k);
      darkPanel(W / 2 - 230, 64, 460, 66, 20);
      drawCritterPortrait(FRIEND, W / 2 - 222, 70, 54, 54);
      if (k.mode === 'drive') text('🚨 Fire alarm at number', W / 2 - 158, 97, 22, '#fff', 'left', 700);
      else if (k.mode === 'spray') text('💦 Spray the flames at', W / 2 - 158, 97, 22, '#fff', 'left', 700);
      else text('⭐ All safe at number', W / 2 - 158, 97, 22, '#fff6a8', 'left', 700);
      const pulse = k.mode === 'drive' ? 1 + Math.sin(t * 5) * 0.05 : 1;
      inkCircle(W / 2 + 178, 97, 27 * pulse, '#ffffff', 1.6);
      text(String(tgt.num), W / 2 + 178, 98, 30, '#e8382e', 'center', 800);
      if (k.msg) {
        const lines = wrap(k.msg.str, 560, 19, 700);
        const hgt = 16 + lines.length * 24;
        rrect(W / 2 - 300, 138, 600, hgt, 16, k.msg.good ? 'rgba(60,150,90,.92)' : 'rgba(255,248,252,.96)', '#e2c6f5', 3);
        lines.forEach((l, i) => text(l, W / 2, 150 + 12 + i * 24, 19, k.msg.good ? '#ffffff' : '#5a2a6e', 'center', 700));
      }
      if (k.mode === 'drive') {
        button('k2back', BACK_BTN.x, BACK_BTN.y, BACK_BTN.w, BACK_BTN.h, 'BACK', { icon: '⬅️', color: '#5f8ae0', size: 22 });
        button('k2go', GO_BTN.x, GO_BTN.y, GO_BTN.w, GO_BTN.h, 'GO', { icon: '➡️', color: '#3fb85a', size: 24 });
      } else if (k.mode === 'spray' && !k.aim) {
        const f = k.flames.find(q => q.hp > 0);
        if (f) emoji('👆', f.x - cam + 18, f.y + 26 + Math.sin(t * 6) * 6, 40);
      }
    },
  };

  // =============================================================================================
  // GAME 2 (learn): LADDER RESCUE
  // =============================================================================================
  const LX = 300, BASE = 446, LTOP = 132, WALL_L = 352, WALL_R = 628;
  const KIT_COLS = ['#ffb060', '#c8c0d0', '#ffffff', '#5a5060', '#ffd8a0'];
  const PIECE_COLS = ['#ffd84a', '#5fb8f0', '#ff8ac0', '#7ad88a'];
  const CELL = { x0: 664, y0: 214, w: 92, h: 98 };
  const cellRect = (i) => ({ x: CELL.x0 + (i % 3) * CELL.w + 4, y: CELL.y0 + Math.floor(i / 3) * CELL.h + 4, w: CELL.w - 8, h: CELL.h - 8 });
  const RAISE_BTN = { x: 676, y: 430, w: 256, h: 62 };

  // a ladder section: rails from y0 (bottom) up n rungs of spacing rs
  function drawLadderPiece(x, y0, n, rs, col, w = 34, outline = true) {
    const top = y0 - n * rs;
    if (outline) {
      ctx.strokeStyle = OL; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - w / 2, y0); ctx.lineTo(x - w / 2, top); ctx.moveTo(x + w / 2, y0); ctx.lineTo(x + w / 2, top);
      for (let j = 1; j <= n; j++) { const y = y0 - (j - 0.5) * rs; ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); }
      ctx.stroke();
    }
    ctx.strokeStyle = '#eef1f8'; ctx.lineWidth = 4.5; ctx.beginPath();
    for (let j = 1; j <= n; j++) { const y = y0 - (j - 0.5) * rs; ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); }
    ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath();
    ctx.moveTo(x - w / 2, y0); ctx.lineTo(x - w / 2, top); ctx.moveTo(x + w / 2, y0); ctx.lineTo(x + w / 2, top); ctx.stroke();
  }

  MG.ladderrescue = {
    kind: 'learn',
    title: () => 'Ladder Rescue',
    icon: () => '🪜',
    how: g => `A kitten is stuck up high! Tap ladder pieces to add them together. When they make the kitten's number, press RAISE!${g.tier === 3 ? ' You will need three pieces.' : ''}`,
    init(g) {
      const T = g.tier, maxR = [0, 12, 16, 22][T];
      g.k = { N: [0, 4, 5, 5][T], r: 0, credit: 0, rs: (BASE - LTOP) / maxR, maxR, mode: 'plan', h: 0, msg: null, last: 0, t: 0 };
      this.newRound(g, g.k);
    },
    start(g) { this.prompt(g); },
    newRound(g, k) {
      const T = g.tier;
      const [lo, hi, nSol, pMin, pMax, tray] = [null, [5, 10, 2, 1, 6, 4], [8, 14, 2, 2, 8, 5], [12, 20, 3, 2, 8, 6]][T];
      let target, sol;
      for (let guard = 0; guard < 200; guard++) {
        target = randInt(lo, hi); sol = []; let rem = target;
        for (let i = 0; i < nSol - 1; i++) { const p = randInt(pMin, pMax); sol.push(p); rem -= p; }
        sol.push(rem);
        if (target !== k.last && sol.every(p => p >= pMin && p <= pMax)) break;
      }
      const pieces = sol.slice();
      while (pieces.length < tray) { const p = randInt(pMin, pMax); if (p !== target) pieces.push(p); }
      k.last = target;
      k.round = { target, sol, pieces: shuffle(pieces).map((n, i) => ({ n, col: PIECE_COLS[i % 4] })), plan: [], tries: 0, kit: KIT_COLS[k.r % KIT_COLS.length], helped: false };
      k.mode = 'plan'; k.h = 0; k.climb = 0;
      g.progress = `Rescue ${k.r + 1} of ${k.N}`;
    },
    prompt(g) {
      const k = g.k, R = k.round;
      say(g, `Meow! The kitten is ${R.target} rungs up. Which ladder pieces add up to ${R.target}?`);
    },
    planSum(R) { return R.plan.reduce((s, i) => s + R.pieces[i].n, 0); },
    eq(R) { return R.plan.map(i => R.pieces[i].n).join(' + '); },
    toggle(g, k, i) {
      const R = k.round;
      if (i >= R.pieces.length) return;
      const at = R.plan.indexOf(i);
      if (at >= 0) { R.plan.splice(at, 1); SFX.blip(); return; }
      if (R.plan.length >= 4) { k.msg = { str: 'That is a lot of pieces! Take one off first.', t: 2 }; return; }
      R.plan.push(i); SFX.pick();
      speak(R.plan.length > 1 ? `${this.eq(R)}` : `${R.pieces[i].n}`);
    },
    raise(g, k) {
      const R = k.round;
      if (!R.plan.length) { k.msg = { str: 'Tap some ladder pieces first!', t: 2 }; say(g, 'Tap some ladder pieces first!'); return; }
      k.mode = 'raise'; k.h = 0; k.sum = this.planSum(R); k.lastRung = 0; k.msg = null;
      tone(220, 0.4, 'sawtooth', 0.03, 0, 330);
    },
    update(g, dt, id) {
      const k = g.k, R = k.round;
      k.t += dt;
      if (k.msg && (k.msg.t -= dt) <= 0) k.msg = null;
      if (k.mode === 'plan') {
        if (id === 'k2raise') return this.raise(g, k);
        if (pressed.backspace && R.plan.length) { R.plan.pop(); SFX.blip(); }
        for (let i = 0; i < R.pieces.length; i++) if (pressed[String(i + 1)]) this.toggle(g, k, i);
        if (pointer.clicked) for (let i = 0; i < R.pieces.length; i++) if (inRect(cellRect(i))) this.toggle(g, k, i);
        if (pressed.enter) this.raise(g, k);
      } else if (k.mode === 'raise') {
        k.h = Math.min(k.sum, k.h + dt * 7);
        const rung = Math.floor(k.h);
        if (rung > k.lastRung) { k.lastRung = rung; tone(330 + rung * 30, 0.08, 'triangle', 0.06); }
        if (k.h >= k.sum) this.check(g, k);
      } else if (k.mode === 'oops') {
        k.wait -= dt;
        if (k.wait <= 0) { k.h = Math.max(0, k.h - dt * 14); if (k.h <= 0) { k.mode = 'plan'; if (R.tries >= 2 && !R.helped) this.help(g, k); } }
      } else if (k.mode === 'climb') {
        k.climb += dt / 1.6;
        if (k.climb >= 1 && !k.grabbed) { k.grabbed = true; SFX.sparkle(); speak('Got you, little kitten!'); }
        if (k.climb >= 2) {
          k.mode = 'safe'; k.wait = 1.6; SFX.pick();
          burst(LX + 30, BASE - 40, 20, { kind: 'emoji', colors: ['💖', '⭐', '✨'], spread: 140, up: 120, size: [3, 5] });
        }
      } else if (k.mode === 'safe') {
        if ((k.wait -= dt) <= 0) {
          k.r++;
          if (k.r >= k.N) { g.done = true; return; }
          this.newRound(g, k); this.prompt(g);
        }
      }
    },
    check(g, k) {
      const R = k.round, T = R.target, s = k.sum, eq = this.eq(R), sumTxt = R.plan.length > 1 ? `${eq} = ${s}` : `${s}`;
      if (s === T) {
        const c = CREDIT[Math.min(R.tries, 3)];
        k.credit += c; g.score = k.credit / k.N;
        k.mode = 'climb'; k.climb = 0; k.grabbed = false;
        SFX.hit(); burst(LX, BASE - T * k.rs, 18);
        const str = `${sumTxt}. Just right! Up you go, Captain Freckles!`;
        k.msg = { str: `${sumTxt}  Just right!`, t: 3.4, good: true }; say(g, str);
        return;
      }
      R.tries++; k.mode = 'oops'; k.wait = 2.6; SFX.miss();
      const str = s < T ? `${sumTxt}. Too short! We need ${T}. That is ${plural(T - s, 'more rung')}.`
        : `${sumTxt}. Too tall! ${s} is more than ${T}. Try smaller pieces.`;
      k.msg = { str, t: 4.2 }; say(g, str);
    },
    help(g, k) {
      const R = k.round; R.helped = true;
      // light up one piece of an answer so nobody stays stuck
      R.hintI = R.pieces.findIndex(p => p.n === R.sol[0]);
      k.msg = { str: `Psst! Try the glowing piece first. ${R.sol[0]} and how many more make ${R.target}?`, t: 5 };
      say(g, k.msg.str);
    },
    draw(g) {
      const k = g.k, R = k.round, t = S.t, rs = k.rs, T = R.target, ledgeY = BASE - T * rs;
      bdSky('#62c8ff', '#eefaff'); bdClouds(3, 'rgba(255,255,255,.9)', 80);
      bdHills('#b4e8a0', 380, 18, 0.008, 1);
      // the tall building
      const bld = new Path2D(); bld.rect(WALL_L, LTOP - 20, WALL_R - WALL_L, BASE + 40 - LTOP);
      const corn = new Path2D(); corn.rect(WALL_L - 10, LTOP - 34, WALL_R - WALL_L + 20, 16);
      inkAll([[bld, '#f4d8b0'], [corn, '#d89a6a']], 1.6);
      ctx.save(); ctx.clip(bld); ctx.strokeStyle = 'rgba(160,110,70,.22)'; ctx.lineWidth = 1.5;
      for (let y = LTOP; y < BASE + 40; y += 14) { ctx.beginPath(); ctx.moveTo(WALL_L, y); ctx.lineTo(WALL_R, y); ctx.stroke(); }
      ctx.restore();
      inkRect(560, LTOP - 70, 40, 36, '#9aa0b8', 2.5, 4); // water tank
      emoji('🐦', 520 + Math.sin(t * 2) * 3, LTOP - 46, 24);
      // decorative windows (skipping the kitten's floor)
      for (let wy = LTOP + 10; wy < BASE - 30; wy += 64) for (const wx of [470, 560]) {
        if (Math.abs(wy + 20 - ledgeY + 30) < 50 && wx === 470) continue;
        inkRect(wx - 22, wy, 44, 40, '#bfe8ff', 2.5, 6);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(wx, wy + 2); ctx.lineTo(wx, wy + 38); ctx.stroke();
      }
      inkRect(530, BASE - 60, 60, 100, '#a86a4a', 2.5, 8);
      // the rung ruler up the left edge of the wall
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(WALL_L + 2, LTOP, 34, BASE - LTOP);
      for (let j = 1; j <= k.maxR; j++) {
        const y = BASE - j * rs, big = g.tier < 3 || j % 5 === 0;
        ctx.fillStyle = '#8a5a3a'; ctx.fillRect(WALL_L + 2, y - 1, big ? 14 : 8, 2);
        if (big || g.tier < 3) text(String(j), WALL_L + 27, y, g.tier === 3 ? 11 : 13, '#8a5a3a', 'center', 700);
      }
      // the kitten's window and ledge
      inkRect(WALL_L + 50, ledgeY - 66, 64, 60, '#ffe9a0', 2.5, 8);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(WALL_L + 82, ledgeY - 64); ctx.lineTo(WALL_L + 82, ledgeY - 8); ctx.stroke();
      inkRect(LX + 16, ledgeY, WALL_L + 128 - (LX + 16), 10, '#c8805a', 2.5, 3);
      // number flag beside the window
      inkRect(WALL_L + 126, ledgeY - 56, 50, 40, '#ffffff', 3, 10);
      text(String(T), WALL_L + 151, ledgeY - 35, 28, '#e8382e', 'center', 800);
      // the ladder pieces as raised so far
      const truckGY = 528;
      drawTruck(250, truckGY, 0.8, t, { dir: -1, siren: true, noLadder: true });
      inkRect(LX - 26, BASE - 4, 52, 14, '#9aa0b8', 2.5, 4);
      if (k.h > 0) {
        let y = BASE, left = k.h;
        for (const i of R.plan) {
          const p = R.pieces[i], n = Math.min(p.n, left);
          if (n <= 0) break;
          drawLadderPiece(LX, y, n, rs, p.col);
          if (n >= p.n) { inkCircle(LX - 38, y - n * rs / 2, 13, p.col, 1.2); text(String(p.n), LX - 38, y - n * rs / 2 + 1, 15, '#3a2a5a', 'center', 800); }
          y -= n * rs; left -= n;
        }
        const top = BASE - k.h * rs;
        if (k.mode !== 'climb' && k.mode !== 'safe') {
          ctx.fillStyle = 'rgba(48,24,72,.8)'; ctx.beginPath(); ctx.roundRect(LX - 90, top - 14, 40, 26, 10); ctx.fill();
          text(String(Math.floor(k.h + 0.001)), LX - 70, top - 1, 16, '#fff', 'center', 800);
        }
      }
      // the kitten (and Freckles climbing)
      const kitOnLedge = !(k.mode === 'climb' && k.climb >= 1) && k.mode !== 'safe';
      const worried = k.mode === 'plan' || k.mode === 'oops' || k.mode === 'raise';
      if (kitOnLedge) drawKitten(WALL_L + 30 + (worried ? Math.sin(t * 9) * 1.5 : 0), ledgeY, 0.8, t, R.kit, worried ? 0 : (Math.sin(t * 8) + 1) / 2);
      if (k.mode === 'plan' || k.mode === 'oops') { inkRect(LX - 112, ledgeY - 30, 76, 32, '#ffffff', 2, 12); text('Meow!', LX - 74, ledgeY - 14, 16, '#5a2a6e', 'center', 700); }
      let dogY = truckGY - 60, dogX = 150;
      if (k.mode === 'climb') { const c = k.climb < 1 ? k.climb : 2 - k.climb; dogX = LX + 4; dogY = lerp(BASE - 6, ledgeY + 18, easeOut(clamp(c, 0, 1))); }
      if (k.mode === 'safe') { dogX = LX + 70; dogY = truckGY - 6; }
      drawCritter(FRIEND, dogX, dogY, k.mode === 'climb' ? 0.5 : 0.55, 1);
      if (k.mode === 'climb' && k.climb >= 1) drawKitten(dogX + 24, dogY - 70, 0.6, t, R.kit, 1);
      if (k.mode === 'safe') { drawKitten(dogX + 60, truckGY - 4, 0.75, t, R.kit, (Math.sin(t * 8) + 1) / 2); heart(dogX + 60, truckGY - 92 + Math.sin(t * 4) * 4, 22, '#ff5f9a'); }
      drawAubrey(84, truckGY + 6, 'idle_front', 1, 0, 0.42);

      // --- right side: the plan and the pieces tray ---
      panel(656, 70, 288, 134, 18);
      text('Ladder plan', 800, 92, 16, '#9a7aaa', 'center', 700);
      const planStr = R.plan.length ? `${this.eq(R)} = ${k.mode === 'plan' ? '?' : k.sum}` : 'tap the pieces';
      const ps = R.plan.length > 2 ? 30 : 36;
      text(planStr, 800, 140, R.plan.length ? ps : 22, R.plan.length ? '#3a2a6a' : '#b8a8c8', 'center', 800);
      text(`Kitten: ${T} rungs up`, 800, 182, 17, '#e8382e', 'center', 700);
      for (let i = 0; i < R.pieces.length; i++) {
        const c = cellRect(i), p = R.pieces[i], used = R.plan.includes(i), hov = k.mode === 'plan' && inRect(c);
        const hint = R.hintI === i && !used && k.mode === 'plan';
        ctx.save(); ctx.shadowColor = 'rgba(80,20,80,.25)'; ctx.shadowBlur = hov ? 12 : 5; ctx.shadowOffsetY = 3;
        rrect(c.x, c.y - (hov ? 2 : 0), c.w, c.h, 14, used ? '#e8e0f0' : '#fffaf2');
        ctx.restore();
        rrect(c.x, c.y - (hov ? 2 : 0), c.w, c.h, 14, null, hint ? `rgba(255,190,40,${0.6 + 0.4 * Math.sin(t * 8)})` : used ? '#5fb87a' : '#e2c6f5', hint ? 6 : 3);
        const prs = Math.min(10, 70 / p.n), py0 = c.y + c.h / 2 + p.n * prs / 2;
        ctx.globalAlpha = used ? 0.45 : 1;
        drawLadderPiece(c.x + 28, py0, p.n, prs, p.col, 22);
        text(String(p.n), c.x + 64, c.y + c.h / 2 + 2, 32, '#3a2a6a', 'center', 800);
        ctx.globalAlpha = 1;
        text(String(i + 1), c.x + c.w - 9, c.y + 11, 11, '#b8a8c8', 'right', 700);
        if (used) emoji('✅', c.x + 64, c.y + c.h - 16, 18);
      }
      if (k.mode === 'plan') button('k2raise', RAISE_BTN.x, RAISE_BTN.y, RAISE_BTN.w, RAISE_BTN.h, 'RAISE!', { icon: '🪜', color: '#e8482e', size: 24, key: 'Enter', on: R.plan.length > 0 });
      if (k.msg) {
        const lines = wrap(k.msg.str, 560, 19, 700), hgt = 16 + lines.length * 24;
        rrect(30, 66, 600, hgt, 16, k.msg.good ? 'rgba(60,150,90,.94)' : 'rgba(255,248,252,.97)', '#e2c6f5', 3);
        lines.forEach((l, i) => text(l, 330, 78 + 12 + i * 24, 19, k.msg.good ? '#ffffff' : '#5a2a6e', 'center', 700));
      }
    },
  };

  restage('kitehill', {
    name: "Freckles' Fire Station", icon: '🚒', bg: 'firestation_k2',
    npc: { name: FRIEND, icon: '🐶' },
    games: [['sirenstreet', 'ribbon', {}], ['ladderrescue', 'ribbon', {}]],
    intro: [
      '*:Ding-ding-ding! A shiny red fire engine peeks out of the fire station, and a spotty dog in a big red helmet is polishing the bell.',
      "N:Woof! I'm Captain Freckles, the fire chief! Oh! The alarm! There's a fire on Maple Street!",
      'N:The houses go in number order, like counting. Read the numbers and stop the engine at the right house. Then SPRAY!',
      "A:determined:Siren on! Let's GO!",
    ],
    mid: [
      'N:Woof woof, you put out every fire! But listen... meow, meow! A kitten is stuck on a high ledge!',
      'N:Our ladder comes in pieces. Add the pieces together to make it JUST the right height. Not too short, not too tall!',
      'A:thinking:Three and four make seven... I can do this!',
    ],
    outro: [
      "N:Hooray! Everyone is safe and sound! You're an honorary firefighter now, Aubrey.",
      'N:Take these ribbons from my rescue medals. Bright red, like my fire engine!',
      'A:happy:Thank you, Captain Freckles! Woof woof!',
    ],
  });
}
