'use strict';
// Batch 7: Stargazer Tower, Mermaid Grotto, Sleeping Dragon's Hoard, Rainbow Falls, Comet Tail Meadow.
{
  // ---- shared little helpers ------------------------------------------------------------------
  const CARD_COLS = ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a', '#ff9a3a'];
  const numKey = n => { for (let i = 0; i < n; i++) if (pressed[String(i + 1)]) return i; return -1; };
  // a stable pseudo-random number for scattering props the same way every frame
  const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const shadeFill = (x, y, r, col) => {
    const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    gr.addColorStop(0, mix(col, '#ffffff', 0.45)); gr.addColorStop(0.55, col); gr.addColorStop(1, mix(col, '#1a1030', 0.35));
    return gr;
  };
  const glow = (x, y, r, col) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const twinkleStars = (n, seed, x0, x1, y0, y1, big = 0.12) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + hash(seed + i) * (x1 - x0), y = y0 + hash(seed + i + 500) * (y1 - y0);
      const a = 0.35 + 0.65 * Math.abs(Math.sin(S.t * (0.8 + hash(i) * 1.5) + i));
      if (hash(seed + i + 900) < big) star(x, y, 4 + hash(i + 7) * 3, `rgba(255,250,220,${a})`, 4);
      else { ctx.fillStyle = `rgba(255,255,240,${a})`; circle(x, y, 0.8 + hash(i + 3) * 1.4); }
    }
  };
  // shaking a wrong card: returns the x offset
  const shakeX = (g, i) => (g.shake?.[i] ? Math.sin(g.shake[i] * 50) * 6 : 0);
  const tickShake = (g, dt) => { for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k]; };

  // =============================================================================================
  // 1. STARGAZER TOWER
  // =============================================================================================
  // [name, display radius, colour, fact]
  const PLANETS = [
    ['Mercury', 13, '#b9adb6'], ['Venus', 18, '#f2cf86'], ['Earth', 19, '#3f8fe8'], ['Mars', 15, '#e8603a'],
    ['Jupiter', 34, '#e8b07a'], ['Saturn', 27, '#f0d48a'], ['Uranus', 22, '#9ae6ea'], ['Neptune', 22, '#4a6ae8'],
  ];
  function drawPlanet(i, x, y, r) {
    const [, , col] = PLANETS[i], lw = Math.max(1.2, r / 14);
    const body = new Path2D(); body.arc(x, y, r, 0, Math.PI * 2);
    const ring = (front) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.28);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.85, r * 0.5, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
      ctx.strokeStyle = OL; ctx.lineWidth = r * 0.34 + lw * 2; ctx.stroke();
      ctx.strokeStyle = '#e8c98a'; ctx.lineWidth = r * 0.34; ctx.stroke();
      ctx.strokeStyle = '#fff1c8'; ctx.lineWidth = r * 0.08; ctx.stroke();
      ctx.restore();
    };
    if (i === 5) ring(false);
    if (i === 6) { ctx.strokeStyle = 'rgba(220,250,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r * 0.35, r * 1.5, 0.1, 0, Math.PI * 2); ctx.stroke(); }
    ink(body, shadeFill(x, y, r, col), lw);
    ctx.save(); ctx.clip(body);
    if (i === 0) { ctx.fillStyle = 'rgba(90,70,90,.35)'; for (const [dx, dy, k] of [[-0.4, -0.2, 0.22], [0.3, 0.3, 0.18], [0.2, -0.45, 0.12], [-0.1, 0.5, 0.14]]) circle(x + dx * r, y + dy * r, k * r); }
    if (i === 1) { ctx.strokeStyle = 'rgba(255,255,240,.55)'; ctx.lineWidth = r * 0.14; for (const k of [-0.4, 0.05, 0.5]) { ctx.beginPath(); ctx.moveTo(x - r, y + k * r); ctx.bezierCurveTo(x - r * 0.3, y + (k - 0.3) * r, x + r * 0.3, y + (k + 0.3) * r, x + r, y + k * r); ctx.stroke(); } }
    if (i === 2) {
      ctx.fillStyle = '#4fc86a';
      ellipse(x - r * 0.35, y - r * 0.25, r * 0.45, r * 0.3, 0.5); ellipse(x + r * 0.4, y + r * 0.3, r * 0.35, r * 0.45, -0.3); ellipse(x - r * 0.1, y + r * 0.65, r * 0.3, r * 0.15);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - r * 0.8, y + r * 0.05); ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.15, x + r * 0.2, y + r * 0.05); ctx.stroke();
    }
    if (i === 3) { ctx.fillStyle = 'rgba(140,40,30,.4)'; ellipse(x - r * 0.3, y + r * 0.1, r * 0.4, r * 0.22, 0.4); ellipse(x + r * 0.35, y - r * 0.2, r * 0.25, r * 0.18); ctx.fillStyle = '#fff'; ellipse(x, y - r * 0.92, r * 0.42, r * 0.18); }
    if (i === 4) {
      [['#c9874a', -0.55, 0.16], ['#fff0d8', -0.25, 0.14], ['#b8743a', 0.08, 0.2], ['#fff0d8', 0.38, 0.12], ['#c9874a', 0.62, 0.16]].forEach(([c, k, h]) => { ctx.fillStyle = c; ctx.fillRect(x - r, y + k * r - h * r / 2, r * 2, h * r); });
      inkEllipse(x + r * 0.35, y + r * 0.3, r * 0.24, r * 0.14, 0, '#e0503a', lw * 0.6);
    }
    if (i === 5) { ctx.fillStyle = 'rgba(200,150,80,.35)'; for (const k of [-0.5, -0.1, 0.35]) ctx.fillRect(x - r, y + k * r, r * 2, r * 0.16); }
    if (i === 6) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - r, y - r * 0.2, r * 2, r * 0.2); }
    if (i === 7) { ctx.fillStyle = 'rgba(30,40,140,.4)'; ctx.fillRect(x - r, y + r * 0.2, r * 2, r * 0.18); inkEllipse(x - r * 0.3, y - r * 0.2, r * 0.22, r * 0.12, 0, '#2a3a9a', lw * 0.4); }
    ctx.restore();
    if (i === 5) ring(true);
  }

  // an open book flapping its pages as it floats
  function floatingBook(x, y, s, col, ph) {
    const bob = Math.sin(S.t * 1.6 + ph) * 8, flap = 0.75 + Math.sin(S.t * 5 + ph) * 0.25;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(Math.sin(S.t * 0.9 + ph) * 0.12); ctx.scale(s, s);
    glow(0, 0, 50, 'rgba(255,240,170,.28)');
    ink(P2(`M0,6 L${-34 * flap},${-4 * flap} L${-36 * flap},14 L0,22 Z`), col, 1.5);
    ink(P2(`M0,6 L${34 * flap},${-4 * flap} L${36 * flap},14 L0,22 Z`), col, 1.5);
    ink(P2(`M0,4 C${-10 * flap},${-6} ${-24 * flap},${-10 * flap} ${-31 * flap},${-6 * flap} L${-31 * flap},10 C-20,6 -8,10 0,18 Z`), '#fffaf0', 1.2);
    ink(P2(`M0,4 C${10 * flap},${-6} ${24 * flap},${-10 * flap} ${31 * flap},${-6 * flap} L${31 * flap},10 C20,6 8,10 0,18 Z`), '#fffaf0', 1.2);
    ctx.strokeStyle = 'rgba(120,100,160,.5)'; ctx.lineWidth = 1;
    for (const k of [0.3, 0.55, 0.8]) { ctx.beginPath(); ctx.moveTo(-6, 6 + k * 4); ctx.lineTo(-26 * flap, k * 6 - 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6, 6 + k * 4); ctx.lineTo(26 * flap, k * 6 - 2); ctx.stroke(); }
    ctx.restore();
    for (let k = 0; k < 2; k++) star(x + Math.cos(S.t * 2 + ph + k * 3) * 34 * s, y + bob + Math.sin(S.t * 2 + ph + k * 3) * 16 * s, 3.5, '#fff6a8', 4);
  }
  // a star chart on an easel: parchment with a constellation joined up
  function starChart(x, y, pts) {
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const [a, b] of [[[x - 40, y + 120], [x - 10, y]], [[x + 40, y + 120], [x + 10, y]], [[x, y + 128], [x, y + 20]]]) { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 3.5;
    for (const [a, b] of [[[x - 40, y + 120], [x - 10, y]], [[x + 40, y + 120], [x + 10, y]], [[x, y + 128], [x, y + 20]]]) { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    inkRect(x - 52, y - 16, 104, 92, '#f7e6bf', 2, 6);
    inkRect(x - 58, y - 22, 116, 12, '#e0c48a', 1.5, 6); inkRect(x - 58, y + 70, 116, 12, '#e0c48a', 1.5, 6);
    ctx.fillStyle = '#2a2a6a'; ctx.fillRect(x - 44, y - 6, 88, 72);
    ctx.strokeStyle = 'rgba(160,200,255,.8)'; ctx.lineWidth = 1.5; ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py))); ctx.stroke();
    pts.forEach(([px, py], i) => star(x + px, y + py, 4 + (i % 2), '#fff6a8', 4));
  }
  BACKDROPS.observatory_bg = () => {
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, '#0c0a34'); sky.addColorStop(0.5, '#2a1a6e'); sky.addColorStop(1, '#6a3a9a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // glowing nebula clouds and the milky way
    glow(230, 170, 190, 'rgba(255,110,200,.20)'); glow(720, 140, 220, 'rgba(90,180,255,.18)'); glow(520, 300, 200, 'rgba(180,120,255,.16)');
    for (let i = 0; i < 160; i++) { const k = hash(i + 40); ctx.fillStyle = `rgba(255,240,255,${0.15 + hash(i) * 0.35})`; circle(k * W, 300 - k * 220 + (hash(i + 90) - 0.5) * 60, 0.8 + hash(i + 5)); }
    twinkleStars(110, 1, 0, W, 64, 380, 0.14);
    // planets hanging in the sky
    drawPlanet(5, 130, 150, 26); drawPlanet(3, 860, 210, 15); drawPlanet(7, 620, 96, 11); drawPlanet(4, 330, 92, 14);
    // a shooting star every few seconds
    const ss = (S.t % 6) / 1.1;
    if (ss < 1) {
      const sx = 900 - ss * 360, sy = 70 + ss * 120;
      ctx.strokeStyle = `rgba(255,250,220,${1 - ss})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 70, sy - 24); ctx.stroke();
      star(sx, sy, 7, '#fff', 4);
    }
    // far purple mountains
    bdHills('#3a2a6a', 380, 40, 0.006, 1); bdHills('#4a3478', 405, 22, 0.012, 3);
    // the tower: stone walls, glowing windows, a starry dome with a big brass telescope
    const tx = 480, top = 190;
    ink(P2(`M${tx - 92},${GY - 30} L${tx - 80},${top} L${tx + 80},${top} L${tx + 92},${GY - 30} Z`), '#8a7aaa', 2.5);
    ctx.save(); ctx.clip(P2(`M${tx - 92},${GY - 30} L${tx - 80},${top} L${tx + 80},${top} L${tx + 92},${GY - 30} Z`));
    ctx.strokeStyle = 'rgba(60,40,90,.35)'; ctx.lineWidth = 2;
    for (let r = 0; r < 10; r++) { const y = top + 14 + r * 26; ctx.beginPath(); ctx.moveTo(tx - 100, y); ctx.lineTo(tx + 100, y); ctx.stroke(); for (let c = 0; c < 6; c++) { const x = tx - 100 + c * 40 + (r % 2) * 20; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 26); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(tx - 92, top, 40, GY);
    ctx.restore();
    for (const [wx, wy] of [[tx - 34, top + 60], [tx + 34, top + 60], [tx, top + 150]]) {
      glow(wx, wy, 46, 'rgba(255,220,120,.35)');
      ink(P2(`M${wx - 14},${wy + 22} L${wx - 14},${wy - 8} C${wx - 14},${wy - 26} ${wx + 14},${wy - 26} ${wx + 14},${wy - 8} L${wx + 14},${wy + 22} Z`), '#ffe08a', 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx, wy - 18); ctx.lineTo(wx, wy + 22); ctx.moveTo(wx - 14, wy + 4); ctx.lineTo(wx + 14, wy + 4); ctx.stroke();
    }
    // telescope behind the dome so the dome slit frames it
    ctx.save(); ctx.translate(tx + 10, top - 50); ctx.rotate(-0.62 + Math.sin(S.t * 0.3) * 0.05);
    inkRect(0, -16, 170, 32, '#d8a040', 2.5, 6); inkRect(150, -21, 34, 42, '#f0c860', 2.5, 6); inkRect(40, -19, 14, 38, '#b8802a', 2, 3); inkRect(100, -19, 14, 38, '#b8802a', 2, 3);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(4, -12, 146, 6);
    ctx.fillStyle = '#bfe6ff'; ellipse(184, 0, 4, 17);
    ctx.restore();
    ink(P2(`M${tx - 104},${top + 4} C${tx - 104},${top - 120} ${tx + 104},${top - 120} ${tx + 104},${top + 4} Z`), '#3f4ab8', 2.5);
    ctx.save(); ctx.clip(P2(`M${tx - 104},${top + 4} C${tx - 104},${top - 120} ${tx + 104},${top - 120} ${tx + 104},${top + 4} Z`));
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ellipse(tx - 40, top - 50, 30, 50, 0.4);
    ctx.fillStyle = '#1a1a4a'; ctx.beginPath(); ctx.moveTo(tx - 4, top + 4); ctx.lineTo(tx + 4, top - 92); ctx.lineTo(tx + 36, top - 84); ctx.lineTo(tx + 30, top + 4); ctx.fill();
    for (const [sx, sy] of [[tx - 70, top - 30], [tx - 40, top - 70], [tx + 66, top - 40], [tx - 10, top - 24], [tx + 70, top - 10]]) star(sx, sy, 6, '#ffe36b', 5);
    ctx.restore();
    inkRect(tx - 112, top - 2, 224, 16, '#ffd04a', 2.5, 6);
    vecStar(tx, top - 92, 12, '#ffe36b', 1.5);
    // star charts on easels and a little round table with a globe
    starChart(110, 280, [[-30, 40], [-12, 20], [8, 26], [22, 6], [34, 30]]);
    starChart(850, 270, [[-32, 10], [-10, 30], [10, 12], [30, 34], [0, 52]]);
    // balcony floor and railing
    ctx.fillStyle = '#5a4a88'; ctx.fillRect(0, GY - 34, W, H);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) {
      const y = GY - 30 + r * 28, x = c * 76 + (r % 2) * 38 - 20;
      rrect(x + 2, y + 2, 72, 24, 4, (r + c) % 2 ? '#6a5a9a' : '#7464a8');
    }
    ctx.fillStyle = 'rgba(255,240,200,.08)'; ellipse(480, GY + 20, 380, 40);
    // a starry rug in the middle of the balcony
    inkEllipse(480, GY + 30, 170, 30, 0, '#3a3a9a', 2);
    ctx.strokeStyle = '#ffd04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(480, GY + 30, 156, 23, 0, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 7; i++) star(370 + i * 36, GY + 30 + (i % 2 ? 6 : -6), 5, '#ffe36b', 5);
    // railing behind everyone
    inkRect(0, GY - 98, W, 12, '#b8a8d8', 2, 4);
    for (let x = 14; x < W; x += 34) { if (x > tx - 96 && x < tx + 96) continue; inkRect(x, GY - 86, 10, 52, '#a898cc', 1.5, 4); }
    // a brass globe and candles
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(48, GY + 6); ctx.lineTo(48, GY - 40); ctx.stroke(); ctx.strokeStyle = '#c9902a'; ctx.lineWidth = 3; ctx.stroke();
    inkEllipse(48, GY + 8, 22, 6, 0, '#c9902a', 1.5);
    drawPlanet(2, 48, GY - 62, 22);
    ctx.strokeStyle = '#c9902a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(48, GY - 62, 28, -2.2, 1.3); ctx.stroke();
    for (const [cx, cy] of [[920, GY - 6], [895, GY + 2]]) {
      inkRect(cx - 6, cy - 30, 12, 30, '#fff4e0', 1.5, 3);
      glow(cx, cy - 40, 26, 'rgba(255,210,120,.5)');
      ink(P2(`M${cx},${cy - 48 + Math.sin(S.t * 9 + cx) * 2} C${cx + 7},${cy - 38} ${cx + 4},${cy - 30} ${cx},${cy - 30} C${cx - 4},${cy - 30} ${cx - 7},${cy - 38} ${cx},${cy - 48} Z`), '#ffb43a', 1);
    }
    // floating books drifting over everyone's heads
    floatingBook(190, 200, 0.9, '#ff6fb5', 0); floatingBook(330, 250, 0.7, '#4fc86a', 1.7);
    floatingBook(660, 220, 0.8, '#40b0ff', 3.1); floatingBook(790, 160, 0.65, '#ffb43a', 4.4);
  };

  // ---- Telescope Spotting: slide the round telescope view across the dark sky to find things ----
  const SKY_THINGS = {
    saturn: { name: 'Saturn', hit: 46, draw: () => drawPlanet(5, 0, 0, 28) },
    jupiter: { name: 'Jupiter', hit: 42, draw: () => drawPlanet(4, 0, 0, 34) },
    mars: { name: 'Mars', hit: 32, draw: () => drawPlanet(3, 0, 0, 22) },
    moon: {
      name: 'the Moon', hit: 40, draw: () => {
        glow(0, 0, 60, 'rgba(255,250,210,.35)');
        inkCircle(0, 0, 32, shadeFill(0, 0, 32, '#fff1b8'), 2);
        ctx.fillStyle = 'rgba(200,180,120,.5)'; for (const [x, y, r] of [[-10, -8, 7], [12, 6, 5], [-4, 14, 4], [14, -14, 3]]) circle(x, y, r);
      },
    },
    comet: {
      name: 'a comet', hit: 40, draw: () => {
        const gr = ctx.createLinearGradient(0, 0, -110, -60);
        gr.addColorStop(0, 'rgba(160,240,255,.95)'); gr.addColorStop(1, 'rgba(160,240,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(6, -10); ctx.quadraticCurveTo(-60, -50, -120, -62); ctx.quadraticCurveTo(-60, -20, 4, 12); ctx.fill();
        glow(0, 0, 34, 'rgba(255,255,255,.9)');
        inkCircle(0, 0, 11, '#e8fbff', 1.5);
      },
    },
    dipper: {
      name: 'the Big Dipper', hit: 66, draw: () => {
        const pts = [[-78, -30], [-50, -24], [-24, -10], [2, 0], [8, 28], [58, 30], [62, 2]];
        ctx.strokeStyle = 'rgba(180,210,255,.7)'; ctx.lineWidth = 2.5; ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(2, 0); ctx.stroke();
        for (const [x, y] of pts) { glow(x, y, 14, 'rgba(255,250,200,.7)'); star(x, y, 9, '#fff6a8', 4); }
      },
    },
  };
  MG.scopespot = {
    kind: 'action', title: () => 'Telescope Spotting', icon: () => '🔭',
    how: () => "Move the telescope with the mouse or the arrow keys. Find the thing in the sky before time runs out! Hold it in the middle of the circle to zoom in.",
    init(g) {
      Object.assign(g, {
        rounds: [4, 5, 6][g.tier - 1], round: 0, found: 0, timeLeft: [70, 70, 66][g.tier - 1], R: [112, 102, 94][g.tier - 1],
        sx: W / 2, sy: 300, lock: 0, state: 'look', t2: 0, order: shuffle(Object.keys(SKY_THINGS)), told: {},
      });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      g.target = g.order[g.round % g.order.length];
      // one sky thing in each of six jiggled grid cells, so they never overlap
      const cells = shuffle([[200, 175], [480, 175], [760, 175], [200, 385], [480, 385], [760, 385]]);
      g.objs = Object.keys(SKY_THINGS).map((k, i) => ({ k, x: cells[i][0] + rand(-70, 70), y: cells[i][1] + rand(-35, 35) }));
      // and the one to find is never already sitting under the telescope
      const t = g.objs.find(o => o.k === g.target), far = g.objs.reduce((a, o) => (Math.hypot(o.x - g.sx, o.y - g.sy) > Math.hypot(a.x - g.sx, a.y - g.sy) ? o : a));
      if (Math.hypot(t.x - g.sx, t.y - g.sy) < 220) [t.x, t.y, far.x, far.y] = [far.x, far.y, t.x, t.y];
      Object.assign(g, { lock: 0, state: 'look', told: {}, lockOn: null });
      g.say = `Find ${SKY_THINGS[g.target].name}!`;
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt) {
      g.timeLeft -= dt;
      const sp = 380 * dt;
      if (goLeft()) g.sx -= sp; if (goRight()) g.sx += sp;
      if (keys.arrowup || keys.w) g.sy -= sp; if (goDown()) g.sy += sp;
      if (pointerMoved(g) && !goLeft() && !goRight() && !keys.arrowup && !goDown()) { g.sx = lerp(g.sx, pointer.x, Math.min(1, dt * 10)); g.sy = lerp(g.sy, pointer.y, Math.min(1, dt * 10)); }
      g.sx = clamp(g.sx, 40, W - 40); g.sy = clamp(g.sy, 90, H - 30);
      if (g.state === 'look') {
        // whatever sits in the middle of the view gets "zoomed in" on
        const under = g.objs.find(o => Math.hypot(o.x - g.sx, o.y - g.sy) < SKY_THINGS[o.k].hit * 0.85);
        if (under && under === g.lockOn) g.lock += dt; else { g.lockOn = under || null; g.lock = 0; }
        if (under && g.lock >= 0.5) {
          if (under.k === g.target) {
            g.found++; g.state = 'yay'; g.t2 = 1.6; SFX.sparkle(); burst(under.x, under.y, 26);
            floatText(under.x, under.y - 60, 'Found it!', '#fff6a8', false, 30);
            speak(`${pick(['Yes!', 'Wonderful!', 'You spotted it!'])} That's ${SKY_THINGS[g.target].name}!`);
          } else if (!g.told[under.k]) {
            g.told[under.k] = true; SFX.blip();
            speak(`That's ${SKY_THINGS[under.k].name}. Keep looking for ${SKY_THINGS[g.target].name}!`);
          }
        }
      } else if ((g.t2 -= dt) <= 0) {
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
      g.progress = `Found ${g.found} of ${g.rounds}`;
      g.score = g.found / g.rounds;
    },
    drawSky(g, bright) {
      for (const o of g.objs) { ctx.save(); ctx.translate(o.x, o.y); SKY_THINGS[o.k].draw(); ctx.restore(); }
      if (bright && g.state === 'yay') { const o = g.objs.find(o => o.k === g.target); for (let k = 0; k < 4; k++) star(o.x + Math.cos(S.t * 3 + k * 1.6) * 60, o.y + Math.sin(S.t * 3 + k * 1.6) * 60, 9, '#fff6a8', 4); }
    },
    draw(g) {
      // the whole sky is dark; only a faint hint of things shows outside the telescope
      ctx.fillStyle = '#05051a'; ctx.fillRect(0, 0, W, H);
      twinkleStars(90, 77, 0, W, 60, H, 0.05);
      ctx.globalAlpha = [0.3, 0.2, 0.13][g.tier - 1]; this.drawSky(g, false); ctx.globalAlpha = 1;
      const { sx, sy, R } = g;
      ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.clip();
      const gr = ctx.createRadialGradient(sx, sy, 10, sx, sy, R);
      gr.addColorStop(0, '#2a2a7a'); gr.addColorStop(1, '#141448');
      ctx.fillStyle = gr; ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
      twinkleStars(220, 300, 0, W, 60, H, 0.1);
      this.drawSky(g, true);
      ctx.restore();
      // brass rim and crosshair, plus the zoom ring filling up
      ctx.strokeStyle = OL; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(sx, sy, R + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#e0a840'; ctx.lineWidth = 12; ctx.stroke();
      ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, R + 3, -2.6, -1.2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(sx - R, sy); ctx.lineTo(sx - 14, sy); ctx.moveTo(sx + 14, sy); ctx.lineTo(sx + R, sy);
      ctx.moveTo(sx, sy - R); ctx.lineTo(sx, sy - 14); ctx.moveTo(sx, sy + 14); ctx.lineTo(sx, sy + R); ctx.stroke();
      if (g.lock > 0 && g.lockOn) { ctx.strokeStyle = g.lockOn.k === g.target ? '#7fffb0' : '#fff6a8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(sx, sy, R - 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, g.lock / 0.5)); ctx.stroke(); }
      // what to find
      darkPanel(W / 2 - 180, H - 70, 360, 58, 22);
      ctx.save(); ctx.beginPath(); ctx.arc(W / 2 - 140, H - 41, 25, 0, Math.PI * 2); ctx.fillStyle = '#1a1a4a'; ctx.fill(); ctx.clip();
      ctx.translate(W / 2 - 140, H - 41); ctx.scale(0.42, 0.42); SKY_THINGS[g.target].draw(); ctx.restore();
      text(g.state === 'yay' ? 'You found it!' : `Find ${SKY_THINGS[g.target].name}!`, W / 2 - 104, H - 41, 23, '#fff6a8', 'left', 700);
    },
  };

  // ---- Star Dot-to-Dot: tap the stars in counting order to draw a magic picture in the sky ---------
  const SD_STAR = (n, R, r) => Array.from({ length: n * 2 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / n, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k]; });
  // [name, points (in counting order, the last one joins back to star 1), colour, extra picture details]
  const SD_PICS = {
    house: ['a house', [[-120, 125], [-120, -5], [0, -120], [120, -5], [120, 125]], '#ff8a5a', () => {
      inkRect(-28, 50, 56, 75, '#a0603a', 2.5, 6); inkCircle(16, 90, 4, '#ffd04a', 1.5);
      for (const x of [-88, 52]) { inkRect(x, 10, 36, 36, '#bfe6ff', 2.5, 4); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 18, 10); ctx.lineTo(x + 18, 46); ctx.moveTo(x, 28); ctx.lineTo(x + 36, 28); ctx.stroke(); }
      inkCircle(0, -45, 16, '#ffe08a', 2.5);
    }],
    gem: ['a sparkly gem', [[-65, -95], [65, -95], [135, -20], [0, 125], [-135, -20]], '#5ad0ff', () => {
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-135, -20); ctx.lineTo(135, -20); ctx.moveTo(-65, -95); ctx.lineTo(-35, -20); ctx.lineTo(0, 125); ctx.lineTo(35, -20); ctx.lineTo(65, -95); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(-65, -95); ctx.lineTo(-35, -20); ctx.lineTo(-135, -20); ctx.fill();
      star(-60, -55, 12, '#fff', 4); star(50, 20, 9, '#fff', 4);
    }],
    boat: ['a sailboat', [[-150, 40], [-100, 120], [100, 120], [150, 40], [12, 40], [12, -135]], '#fff6e0', () => {
      ctx.save(); ctx.clip(P2('M-160,40 L160,40 L160,130 L-160,130 Z'));
      ctx.fillStyle = '#c0703a'; ctx.fillRect(-160, 40, 320, 90); ctx.fillStyle = '#e08a4a'; ctx.fillRect(-160, 60, 320, 14); ctx.restore();
      ctx.save(); ctx.clip(P2('M-150,40 L12,-135 L12,40 Z')); ctx.fillStyle = '#ff6fb5'; for (const y of [-60, 0]) ctx.fillRect(-160, y, 180, 22); ctx.restore();
      inkCircle(-50, 82, 10, '#bfe6ff', 2); inkCircle(30, 82, 10, '#bfe6ff', 2);
    }, () => ink(P2('M12,-135 L12,-165 L56,-152 Z'), '#ffd04a', 2)],
    fish: ['a fish', [[-150, 0], [-40, -82], [80, -28], [150, -90], [150, 90], [80, 28], [-40, 82]], '#ffa63a', () => {
      ctx.strokeStyle = 'rgba(200,90,20,.6)'; ctx.lineWidth = 5;
      for (const x of [-20, 20, 55]) { ctx.beginPath(); ctx.arc(x - 30, 0, 50, -0.6, 0.6); ctx.stroke(); }
      inkCircle(-95, -12, 15, '#fff', 2.5); inkCircle(-92, -12, 7, '#2a1a3a', 0);
      ink(P2('M-20,-55 C0,-100 40,-90 50,-38 Z'), '#ff6a3a', 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-128, 18, 10, 0.2, 1.6); ctx.stroke();
    }],
    crown: ['a crown', [[-130, 95], [-150, -70], [-70, 10], [0, -115], [70, 10], [150, -70], [130, 95]], '#ffd04a', () => {
      inkRect(-136, 55, 272, 26, '#ffe88a', 2.5, 6);
      for (const [x, y, c] of [[-80, 68, '#ff4a8a'], [0, 68, '#4fa8e0'], [80, 68, '#3fbf6a']]) inkCircle(x, y, 10, c, 2);
      for (const [x, y] of [[-150, -70], [0, -115], [150, -70]]) inkCircle(x, y, 13, '#ff6fb5', 2.5);
      inkCircle(0, -10, 18, '#9a6ae0', 2.5);
    }],
    rocket: ['a rocket', [[0, -145], [52, -60], [52, 60], [105, 122], [0, 95], [-105, 122], [-52, 60], [-52, -60]], '#e8eef8', () => {
      ctx.save(); ctx.clip(P2('M-120,60 L120,60 L120,130 L-120,130 Z M-60,-150 L60,-150 L60,-70 L-60,-70 Z')); ctx.fillStyle = '#ff4a6a'; ctx.fillRect(-120, -160, 240, 300); ctx.restore();
      inkCircle(0, -10, 28, '#5ad0ff', 3); inkCircle(0, -10, 18, '#bfe6ff', 0); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(-8, -18, 6);
    }, () => {
      const f = Math.sin(S.t * 18) * 8;
      ink(P2(`M-30,104 Q0,${190 + f} 30,104 Z`), '#ffb43a', 2.5); ink(P2(`M-15,104 Q0,${155 + f} 15,104 Z`), '#fff36b', 1.5);
    }],
    heart: ['a heart', [[0, -55], [50, -112], [118, -98], [142, -32], [0, 122], [-142, -32], [-118, -98], [-50, -112]], '#ff4a8a', () => {
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-75, -62, 26, 14, -0.6);
      star(70, -60, 13, '#fff', 4); star(-20, 40, 9, '#fff', 4);
    }],
    bigstar: ['a big star', SD_STAR(5, 145, 62), '#ffe36b', () => {
      inkCircle(-26, -8, 9, '#2a1a3a', 0); inkCircle(26, -8, 9, '#2a1a3a', 0);
      ctx.fillStyle = '#fff'; circle(-23, -11, 3.5); circle(29, -11, 3.5);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 12, 20, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,150,.5)'; ellipse(-48, 14, 11, 7); ellipse(48, 14, 11, 7);
    }],
  };
  const SD_SETS = [['house', 'gem', 'boat'], ['boat', 'fish', 'crown', 'house'], ['fish', 'crown', 'rocket', 'heart', 'bigstar']];
  const sdCap = w => w[0].toUpperCase() + w.slice(1);
  const SD_CX = 480, SD_CY = 300, SD_K = 1.12;
  MG.stardots = {
    kind: 'learn', title: () => 'Star Dot-to-Dot', icon: () => '✨',
    how: () => 'Tap the stars in counting order: one, two, three! Watch the lines draw a magic picture in the sky.',
    init(g) {
      const set = SD_SETS[g.tier - 1];
      Object.assign(g, {
        pics: (g.tier === 1 ? set : shuffle(set).slice(0, 3)), pic: 0, pts: 0, total: 0, shake: {},
        hintAfter: [0, 2.5, 4][g.tier - 1], made: [],
      });
      g.total = g.pics.reduce((a, k) => a + SD_PICS[k][1].length, 0);
      this.setup(g);
    },
    start(g) { speak(g.say); },
    setup(g) {
      const [, pts] = SD_PICS[g.pics[g.pic]];
      Object.assign(g, {
        stars: pts.map(([x, y]) => ({ x: SD_CX + x * SD_K, y: SD_CY + y * SD_K })),
        next: 0, miss: 0, wait: 0, segs: [], sdState: 'tap', reveal: 0, t2: 0,
      });
      g.say = g.pic === 0 ? 'Tap star number one to start!' : 'A new picture! Tap star number one!';
      if (g.phase === 'play') speak(g.say);
    },
    tap(g, i) {
      const s = g.stars[i];
      if (i === g.next) {
        g.pts += [1, 0.4, 0.15][g.miss] ?? 0.05; g.miss = 0; g.wait = 0;
        if (i > 0) g.segs.push({ a: i - 1, b: i, t: 0 });
        g.next++; SFX.pop(); tone(440 * Math.pow(2, i / 7), 0.18, 'sine', 0.12); burst(s.x, s.y, 10);
        if (g.next >= g.stars.length) {
          g.segs.push({ a: i, b: 0, t: 0 }); g.sdState = 'reveal'; g.t2 = 3; SFX.fanfare();
          const [name] = SD_PICS[g.pics[g.pic]];
          g.say = `${NUM_WORDS[g.stars.length]} stars made ${name}!`; speak(`${sdCap(NUM_WORDS[i + 1])}! Look, it's ${name}!`);
          g.made.push(g.pics[g.pic]);
        } else {
          floatText(s.x, s.y - 34, String(i + 1), '#fff6a8', false, 30);
          g.say = `Tap star number ${NUM_WORDS[g.next + 1]}!`;
          speak(`${sdCap(NUM_WORDS[i + 1])}!`);
        }
      } else if (i > g.next) {
        g.miss++; g.shake[i] = 0.4; g.wait = 99; SFX.miss();
        speak(`That's ${NUM_WORDS[i + 1]}. Find ${NUM_WORDS[g.next + 1]}!`);
      }
    },
    update(g, dt, id) {
      tickShake(g, dt);
      for (const s of g.segs) s.t = Math.min(1, s.t + dt * 4);
      if (g.sdState === 'tap') {
        g.wait += dt;
        let hit = -1;
        if (pointer.clicked && pointer.y > 64 && !id) {
          let best = 52;
          g.stars.forEach((s, i) => { const d = Math.hypot(s.x - pointer.x, s.y - pointer.y); if (d < best && i >= g.next) { best = d; hit = i; } });
        }
        for (let n = 1; n <= Math.min(10, g.stars.length); n++) if (pressed[String(n % 10)]) hit = n - 1;
        if (hit >= 0) this.tap(g, hit);
      } else {
        g.reveal = Math.min(1, g.reveal + dt * 1.4);
        if ((g.t2 -= dt) <= 0) { g.pic++; if (g.pic >= g.pics.length) g.done = true; else this.setup(g); }
      }
      g.progress = `Picture ${Math.min(g.pic + 1, g.pics.length)} of ${g.pics.length}`;
      g.score = g.pts / g.total;
    },
    draw(g) {
      // a deep starry sky window over the tower
      const sky = ctx.createLinearGradient(0, 64, 0, H);
      sky.addColorStop(0, '#0a0834'); sky.addColorStop(1, '#2e1660');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      glow(260, 240, 220, 'rgba(255,110,200,.12)'); glow(720, 330, 240, 'rgba(90,180,255,.12)');
      twinkleStars(120, 401, 0, W, 64, H, 0.08);
      const cur = g.pics[Math.min(g.pic, g.pics.length - 1)], [name, , col, deco, extra] = SD_PICS[cur];
      // the finished picture fills in with colour
      if (g.reveal > 0) {
        const a = g.reveal, sc = SD_K * (1 + Math.sin(a * Math.PI) * 0.06);
        ctx.save(); ctx.translate(SD_CX, SD_CY); ctx.scale(sc, sc); ctx.globalAlpha = a;
        glow(0, 0, 230, 'rgba(255,240,170,.35)');
        const p = new Path2D(); SD_PICS[cur][1].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath();
        ctx.lineJoin = 'round'; ink(p, shadeFill(0, -20, 160, col), 4);
        // details stay inside the outline; the rocket's flame and the boat's flag poke out of it
        if (extra) extra();
        ctx.save(); ctx.clip(p); deco(); ctx.restore();
        ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(p);
        ctx.restore();
      }
      // the glowing lines drawn so far, plus a dotted guide from the last star to the next
      ctx.lineCap = 'round';
      for (const s of g.segs) {
        const A = g.stars[s.a], B = g.stars[s.b], x = lerp(A.x, B.x, s.t), y = lerp(A.y, B.y, s.t);
        ctx.strokeStyle = 'rgba(255,240,150,.35)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 5; ctx.stroke();
        if (s.t < 1) star(x, y, 10, '#fff', 4);
      }
      const showHint = g.sdState === 'tap' && g.wait >= g.hintAfter;
      if (g.sdState === 'tap' && g.next > 0 && showHint) {
        const A = g.stars[g.next - 1], B = g.stars[g.next];
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.setLineDash([4, 10]); ctx.lineDashOffset = -S.t * 30;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      }
      // the stars, each with its number badge
      g.stars.forEach((s, i) => {
        const x = s.x + shakeX(g, i), done = i < g.next, isNext = i === g.next && g.sdState === 'tap';
        const pulse = isNext && showHint ? 1 + Math.sin(S.t * 6) * 0.15 : 1;
        if (isNext && showHint) {
          glow(x, s.y, 60, 'rgba(255,246,168,.55)');
          ctx.strokeStyle = `rgba(255,246,168,${0.5 + 0.5 * Math.sin(S.t * 6)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, s.y, 36 * pulse, 0, Math.PI * 2); ctx.stroke();
        } else glow(x, s.y, 34, done ? 'rgba(255,220,120,.5)' : 'rgba(200,220,255,.35)');
        ctx.save(); ctx.translate(x, s.y); ctx.rotate(Math.sin(S.t * 1.5 + i) * 0.15);
        vecStar(0, 0, (done ? 22 : 19) * pulse, done ? '#ffd23f' : '#fff6c8', 2.5);
        ctx.restore();
        if (g.sdState === 'tap' || g.reveal < 0.6) {
          const bx = x + 26, by = s.y - 24;
          inkCircle(bx, by, 16, done ? '#ffb43a' : isNext && showHint ? '#ff6fb5' : '#4a4ab0', 2);
          text(String(i + 1), bx, by + 1, 19, '#fff', 'center', 800);
        }
      });
      // what to do: a big counting card on the left
      panel(W / 2 - 260, 70, 520, 50, 20);
      text(g.sdState === 'reveal' ? `You made ${name}!` : g.next === 0 ? 'Tap star number 1 to start!' : `Now tap star number ${g.next + 1}!`, W / 2, 96, 24, '#5a2a6e', 'center', 700);
      if (g.sdState === 'tap') {
        darkPanel(26, 196, 150, 170, 22);
        text('Find', 101, 226, 22, '#fff6a8', 'center', 700);
        ctx.save(); ctx.translate(101, 296); ctx.rotate(Math.sin(S.t * 2) * 0.08); vecStar(0, 0, 50, '#ffd23f', 3); ctx.restore();
        outlined(String(g.next + 1), 101, 300, 40, '#fff', 'center');
        text(`of ${g.stars.length}`, 101, 350, 18, 'rgba(255,255,255,.75)', 'center', 700);
      }
      // the pictures made so far, pinned on the right like little star charts
      g.made.forEach((k, j) => {
        const x = W - 92, y = 200 + j * 96;
        inkRect(x - 44, y - 40, 88, 80, '#f7e6bf', 2, 8); rrect(x - 36, y - 32, 72, 64, 6, '#2a2a6a');
        ctx.save(); ctx.beginPath(); ctx.rect(x - 36, y - 32, 72, 64); ctx.clip(); ctx.translate(x, y); ctx.scale(0.2, 0.2);
        const p = new Path2D(); SD_PICS[k][1].forEach(([px, py], i) => (i ? p.lineTo(px, py) : p.moveTo(px, py))); p.closePath();
        ink(p, SD_PICS[k][2], 10); ctx.restore();
      });
    },
  };

  restage('observatory', {
    bg: 'observatory_bg',
    games: [['scopespot', 'stardust', {}], ['stardots', 'feather', {}]],
    intro: [
      "*:At the very top of a twisty tower, a wizard peers through an enormous brass telescope.",
      "N:Ah, a visitor! My stars have wandered off across the sky. Can you spot them through my telescope?",
      'A:excited:A real wizard telescope?! Yes please!',
    ],
    mid: ["N:Splendid spotting! Now for some star magic. Tap my stars in counting order, and they'll draw a secret picture!", 'A:excited:One, two, three... I love counting!'],
    outro: ['N:Stardust and owl feathers from my collection. The stars will shine for you at the show, young {lady|man}.', 'A:happy:Thank you, Wizard Wendell!'],
  });

  // =============================================================================================
  // 2. MERMAID GROTTO
  // =============================================================================================
  const kelp = (x, gy, h, col, ph, lw = 1.5) => {
    const sw = k => Math.sin(S.t * 1.3 + ph + k * 2.2) * 16 * k;
    const p = new Path2D(); p.moveTo(x - 5, gy);
    for (let k = 0; k <= 1.001; k += 0.1) p.lineTo(x - 5 + sw(k) - 3 * (1 - k), gy - h * k);
    for (let k = 1; k >= 0; k -= 0.1) p.lineTo(x + 5 + sw(k) + 3 * (1 - k), gy - h * k);
    p.closePath(); ink(p, col, lw);
    for (let k = 0.2; k < 1; k += 0.17) {
      const lx = x + sw(k), ly = gy - h * k, d = (Math.round(k * 10) % 2 ? 1 : -1);
      inkEllipse(lx + d * 13, ly, 14, 5, d * 0.5 + Math.sin(S.t * 2 + ph + k * 5) * 0.2, col, lw * 0.8);
    }
  };
  const branchCoral = (x, gy, s, col) => {
    ctx.lineCap = 'round';
    const arm = (x0, y0, a, len, w, d) => {
      const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
      ctx.strokeStyle = OL; ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
      if (d > 0) { arm(x1, y1, a - 0.45, len * 0.72, w * 0.75, d - 1); arm(x1, y1, a + 0.45, len * 0.72, w * 0.75, d - 1); }
      else { ctx.fillStyle = mix(col, '#ffffff', 0.4); circle(x1, y1, w * 0.55); }
    };
    arm(x, gy, -Math.PI / 2, 34 * s, 10 * s, 3);
  };
  const brainCoral = (x, gy, r, col) => {
    ink(P2(`M${x - r},${gy} C${x - r},${gy - r * 1.3} ${x + r},${gy - r * 1.3} ${x + r},${gy} Z`), col, 1.5);
    ctx.strokeStyle = mix(col, '#2a1050', 0.3); ctx.lineWidth = 2;
    for (let k = 0.25; k < 1; k += 0.25) { ctx.beginPath(); ctx.ellipse(x, gy, r * k, r * k * 0.95, 0, Math.PI + 0.3, -0.3); ctx.stroke(); }
  };
  const fanCoral = (x, gy, r, col) => {
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - r * 0.4); ctx.stroke();
    ink(P2(`M${x},${gy - r * 0.3} C${x - r * 1.2},${gy - r * 0.6} ${x - r * 0.8},${gy - r * 1.5} ${x},${gy - r * 1.3} C${x + r * 0.8},${gy - r * 1.5} ${x + r * 1.2},${gy - r * 0.6} ${x},${gy - r * 0.3} Z`), col, 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5;
    for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x, gy - r * 0.35); ctx.lineTo(x + k * r * 0.24, gy - r * 1.25 + Math.abs(k) * r * 0.1); ctx.stroke(); }
  };
  const anemone = (x, gy, col) => {
    for (let k = -4; k <= 4; k++) {
      const a = -Math.PI / 2 + k * 0.28 + Math.sin(S.t * 2 + k + x) * 0.12, len = 26 - Math.abs(k) * 2;
      ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, gy - 6); ctx.lineTo(x + Math.cos(a) * len, gy - 6 + Math.sin(a) * len); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
    }
    inkEllipse(x, gy - 4, 14, 8, 0, mix(col, '#2a1050', 0.25), 1.5);
  };
  const chest = (x, gy, s) => {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    glow(0, -40, 80, 'rgba(255,220,90,.55)');
    ink(P2('M-44,-46 C-44,-80 44,-80 44,-46 L40,-52 C30,-70 -30,-70 -40,-52 Z'), '#9a5a2a', 2);
    ink(P2('M-46,-44 L-40,-82 C-30,-98 30,-98 40,-82 L46,-44 Z'), '#b06a32', 2); // open lid
    ctx.fillStyle = '#5a2a1a'; ctx.fillRect(-36, -50, 72, 8);
    for (let i = 0; i < 9; i++) inkCircle(-30 + i * 7.5, -48 - (i % 3) * 3, 6, '#ffd23f', 1);
    inkCircle(-12, -58, 6, '#fff4fb', 1); inkCircle(14, -56, 5, '#ff6fb5', 1);
    inkRect(-46, -46, 92, 46, '#b06a32', 2, 6);
    inkRect(-46, -40, 92, 8, '#ffcc3a', 1.5, 2); inkRect(-8, -38, 16, 18, '#ffcc3a', 1.5, 3);
    ctx.fillStyle = '#5a2a1a'; circle(0, -28, 2.5);
    ctx.restore();
    for (let k = 0; k < 3; k++) star(x - 30 + k * 30, gy - 72 * s - Math.abs(Math.sin(S.t * 2 + k)) * 18, 6, '#fff6a8', 4);
  };
  const tinyFish = (x, y, s, col, dir) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    ink(P2('M-14,0 L-26,-10 L-24,0 L-26,10 Z'), mix(col, '#2a1050', 0.15), 1.2);
    inkEllipse(0, 0, 18, 11, 0, col, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-4, -10, 4, 20);
    ctx.fillStyle = OL; circle(9, -2, 2.4);
    ctx.restore();
  };
  BACKDROPS.grotto_bg = () => {
    const sea = ctx.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#42e0ea'); sea.addColorStop(0.45, '#1c94d4'); sea.addColorStop(1, '#173f8f');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
    // rippling surface light and sun rays
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 12; i++) ellipse((i * 97 + Math.sin(S.t + i) * 10) % W, 14 + (i % 3) * 8, 40, 4);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = `rgba(230,255,255,${0.07 + 0.05 * Math.sin(S.t * 0.8 + i * 1.7)})`;
      const x = 60 + i * 140 + Math.sin(S.t * 0.4 + i) * 20;
      ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 130, GY); ctx.lineTo(x - 10, GY); ctx.fill();
    }
    // far grotto rocks
    ctx.fillStyle = '#2a6aa8';
    ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(0, 140); ctx.quadraticCurveTo(110, 170, 150, 300); ctx.quadraticCurveTo(200, 380, 300, 400); ctx.lineTo(300, GY); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W, GY); ctx.lineTo(W, 120); ctx.quadraticCurveTo(840, 160, 820, 260); ctx.quadraticCurveTo(800, 360, 640, 390); ctx.lineTo(640, GY); ctx.fill();
    for (let i = 0; i < 6; i++) kelp(40 + i * 170 + (i % 2) * 40, GY - 30, 190 + (i % 3) * 50, '#2f9a8a', i * 1.3, 0.8);
    // the sunken ship, tipped over on the sea bed
    ctx.save(); ctx.translate(690, 360); ctx.rotate(-0.14);
    ink(P2('M-150,-30 L150,-40 C140,10 110,40 60,48 L-110,48 C-140,30 -150,0 -150,-30 Z'), '#8a5a3a', 2.5);
    ctx.strokeStyle = 'rgba(60,30,20,.45)'; ctx.lineWidth = 2;
    for (const y of [-14, 4, 22, 38]) { ctx.beginPath(); ctx.moveTo(-148, y); ctx.lineTo(146, y - 6); ctx.stroke(); }
    for (const x of [-90, -30, 30, 90]) { inkCircle(x, -6, 10, '#3a6a9a', 2); ctx.fillStyle = 'rgba(180,240,255,.5)'; circle(x - 3, -9, 3); }
    inkRect(-150, -42, 304, 12, '#a87a4a', 2, 3);
    inkRect(-14, -200, 12, 160, '#7a4a2a', 2, 3); inkRect(-70, -170, 120, 8, '#7a4a2a', 2, 3);
    ink(P2(`M-60,-160 L40,-160 C${46 + Math.sin(S.t) * 6},-120 ${30 + Math.sin(S.t) * 6},-90 34,-70 L-20,-74 L-40,-96 L-56,-80 Z`), '#efe3c4', 2);
    ctx.fillStyle = 'rgba(30,90,140,.28)'; ctx.fillRect(-160, -210, 330, 270);
    ctx.restore();
    for (let i = 0; i < 4; i++) kelp(560 + i * 34, 410, 70 + i * 12, '#3fae7a', i, 1);
    // sandy sea floor with ripples
    ctx.fillStyle = '#f2d89a';
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, GY - 46);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, GY - 46 + Math.sin(x * 0.012) * 14);
    ctx.lineTo(W, H); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.3)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, GY - 46 + Math.sin(x * 0.012) * 14); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,160,90,.5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const x = hash(i) * W, y = GY - 20 + hash(i + 9) * 80; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 6, x + 40, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 4; i++) ellipse(150 + i * 230 + Math.sin(S.t + i) * 30, GY + 10 + (i % 2) * 30, 60, 6);
    // coral garden along the back of the sand
    brainCoral(330, GY - 36, 34, '#b07aff'); fanCoral(560, GY - 30, 46, '#ff5f6a');
    branchCoral(150, GY - 30, 1.1, '#ff8a5a'); branchCoral(860, GY - 30, 1.2, '#ff6fb5'); branchCoral(400, GY - 34, 0.75, '#ffb43a');
    anemone(240, GY - 24, '#ff9acb'); anemone(620, GY - 30, '#7fe0ff'); anemone(910, GY - 22, '#ffd23f');
    // treasure chests full of gold and pearls
    chest(470, GY - 6, 0.85); chest(70, GY + 6, 0.6);
    // front kelp framing the edges
    kelp(16, H + 10, 300, '#3fbf6a', 0.4); kelp(944, H + 10, 320, '#3fbf6a', 2.1); kelp(900, H + 10, 200, '#5fd07a', 3.3);
    // shells, starfish and pebbles
    shell(190, GY + 40, 10, 0.3, 2); shell(780, GY + 52, 12, -0.4, 2); shell(560, GY + 58, 9, 0.1, 2);
    vecStar(360, GY + 50, 12, '#ff8a5a', 1.5); vecStar(640, GY + 30, 10, '#ffd23f', 1.5); vecStar(120, GY + 62, 9, '#ff6fb5', 1.5);
    for (let i = 0; i < 10; i++) inkEllipse(hash(i + 3) * W, GY + 18 + hash(i + 33) * 60, 6 + hash(i) * 4, 4, 0, ['#d8c8b0', '#c8b8e0', '#e8d8c0'][i % 3], 0.8);
    // a little school of fish and some bubbles
    for (let i = 0; i < 5; i++) { const x = ((S.t * 40 + i * 34) % (W + 300)) - 150, y = 170 + Math.sin(S.t + i) * 8 + (i % 2) * 18; tinyFish(x, y, 0.8, ['#ffd23f', '#ff8a5a', '#ff6fb5', '#7fe0ff', '#b07aff'][i], 1); }
    tinyFish(W - ((S.t * 25) % (W + 200)) + 100, 290, 1.2, '#ff8a3a', -1);
    for (let i = 0; i < 16; i++) {
      const x = (i * 83 + Math.sin(S.t + i) * 10) % W, y = H - ((S.t * 34 + i * 47) % (H - 60));
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 3 + (i % 3) * 2, 0, Math.PI * 2); ctx.stroke();
    }
  };

  // ---- Bubble Pop Shooter: aim, shoot, and match 3 bubbles of the same colour ---------------
  const BUB = { R: 21, D: 42, ROWH: 36.4, X0: W / 2 - 252, Y0: 68, COLS: 12, SX: W / 2, SY: 448 };
  const BUB_COLS = [['#ff5f8a', 'heart'], ['#ffd23f', 'star'], ['#40b0ff', 'drop'], ['#5adc7a', 'leaf'], ['#b07aff', 'moon']];
  const bubCols = (r) => (r % 2 ? BUB.COLS - 1 : BUB.COLS);
  const bubXY = (r, c) => [BUB.X0 + BUB.R + c * BUB.D + (r % 2 ? BUB.R : 0), BUB.Y0 + BUB.R + r * BUB.ROWH];
  const bubNbrs = (r, c) => {
    const o = r % 2 ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
    return o.map(([dr, dc]) => [r + dr, c + dc]).filter(([rr, cc]) => rr >= 0 && cc >= 0 && cc < bubCols(rr));
  };
  function drawBubble(x, y, ci, r = BUB.R) {
    const [col, sym] = BUB_COLS[ci];
    inkCircle(x, y, r - 1, shadeFill(x, y, r, col), 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(x - r * 0.38, y - r * 0.42, r * 0.28, r * 0.17, -0.6);
    const s = r * 0.42; ctx.fillStyle = 'rgba(255,255,255,.85)';
    if (sym === 'heart') heart(x, y - s * 0.55, s * 2, 'rgba(255,255,255,.85)');
    if (sym === 'star') star(x, y + 1, s * 1.1, 'rgba(255,255,255,.9)', 5);
    if (sym === 'drop') { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s, y + s * 0.2, x, y + s * 0.8); ctx.quadraticCurveTo(x - s, y + s * 0.2, x, y - s); ctx.fill(); }
    if (sym === 'leaf') ellipse(x, y, s * 0.55, s, 0.6);
    if (sym === 'moon') { ctx.beginPath(); ctx.arc(x, y, s * 0.85, 0.6, Math.PI * 2 - 0.6); ctx.arc(x + s * 0.5, y, s * 0.6, Math.PI * 2 - 1.1, 1.1, true); ctx.fill(); }
  }
  // Aubrey as an octopus: her own head and top, with wiggly tentacles where her skirt and legs would be.
  // One tentacle curls up to hold the bubble; it flicks toward the aim when she shoots.
  const tentacle = (pts, w0, w1, col, sucker) => {
    // sample a quadratic curve as a row of shrinking circles: outline them all first, then fill, so it reads as one limb
    const [[ax, ay], [cx, cy], [bx, by]] = pts, N = 34, dots = [];
    for (let i = 0; i <= N; i++) { const k = i / N, u = 1 - k; dots.push([u * u * ax + 2 * u * k * cx + k * k * bx, u * u * ay + 2 * u * k * cy + k * k * by, lerp(w0, w1, k)]); }
    ctx.fillStyle = OL; for (const [x, y, r] of dots) circle(x, y, r + 1.6);
    ctx.fillStyle = col; for (const [x, y, r] of dots) circle(x, y, r);
    ctx.fillStyle = sucker; for (let i = 5; i < N - 2; i += 5) { const [x, y, r] = dots[i]; circle(x, y + r * 0.35, r * 0.38); }
  };
  const aubOctopus = (x, waist, aimX, aimY, t) => {
    const s = 0.56, im = IMG.idle_front, h = im.height * s, feet = waist + h * 0.5, col = '#d27ae0', suck = '#ffd0f4';
    // seven tentacles curl out along the sea floor
    for (const off of [-2.5, -1.5, -0.5, 0.5, 1.5]) {
      const wig = Math.sin(t * 3 + off * 2) * 6;
      tentacle([[x + off * 6, waist], [x + off * 22, waist + 46], [x + off * 34 + wig, waist + 26 - Math.abs(off) * 6 + wig * 0.5]], 9, 2.5, col, suck);
    }
    // her top half, cut off at the waist
    ctx.save(); ctx.beginPath(); ctx.rect(x - 80, feet - h - 10, 160, h * 0.5 + 12); ctx.clip();
    drawAubrey(x, feet, 'idle_front', 1, 0, s);
    ctx.restore();
    // a frilly octopus collar where the tentacles join her
    ctx.fillStyle = OL; for (let k = -2; k <= 2; k++) circle(x + k * 9, waist + 2, 8.6);
    ctx.fillStyle = col; for (let k = -2; k <= 2; k++) circle(x + k * 9, waist + 2, 7);
    // the holding tentacle reaches up to the bubble
    tentacle([[x + 16, waist], [aimX + 6, waist + 4], [aimX, aimY]], 8, 4, col, suck);
  };
  MG.bubbleshot = {
    kind: 'action', title: () => 'Bubble Pop Shooter', icon: () => '🫧',
    how: () => 'Aubrey is an octopus! Aim with the mouse or the arrow keys, then click or press space and {she|he} flicks a bubble with {her|his} tentacle. Touch 3 or more bubbles of the same colour to pop them. Clear them all!',
    init(g) {
      const rows = [3, 4, 4][g.tier - 1], ncol = [3, 3, 4][g.tier - 1];
      g.grid = {};
      // colours come in little clumps, so there's always a match to make
      for (let r = 0; r < rows; r++) for (let c = 0; c < bubCols(r); c++) {
        const near = bubNbrs(r, c).map(([a, b]) => g.grid[`${a},${b}`]).filter(v => v != null);
        g.grid[`${r},${c}`] = near.length && Math.random() < 0.55 ? pick(near) : randInt(0, ncol - 1);
      }
      Object.assign(g, { ncol, total: Object.keys(g.grid).length, popped: 0, ang: -Math.PI / 2, shot: null, falling: [], timeLeft: [100, 110, 120][g.tier - 1], shots: 0 });
      g.cur = this.newCol(g); g.nxt = this.newCol(g);
      g.say = 'Aim, then shoot! Match three of the same colour.';
    },
    newCol(g) { const have = [...new Set(Object.values(g.grid))]; return have.length ? pick(have) : 0; },
    // follow a shot from the shooter; returns the dotted path and the cell it would stick in
    trace(g, ang) {
      let x = BUB.SX, y = BUB.SY, vx = Math.cos(ang), vy = Math.sin(ang);
      const path = [[x, y]];
      for (let i = 0; i < 400; i++) {
        x += vx * 5; y += vy * 5;
        if (x < BUB.X0 + BUB.R) { x = BUB.X0 + BUB.R; vx = -vx; path.push([x, y]); }
        if (x > BUB.X0 + BUB.COLS * BUB.D - BUB.R) { x = BUB.X0 + BUB.COLS * BUB.D - BUB.R; vx = -vx; path.push([x, y]); }
        let hit = y <= BUB.Y0 + BUB.R;
        if (!hit) for (const k in g.grid) { const [r, c] = k.split(',').map(Number), [bx, by] = bubXY(r, c); if (Math.hypot(bx - x, by - y) < BUB.D * 0.86) { hit = true; break; } }
        if (hit) { path.push([x, y]); return { path, cell: this.snap(g, x, y) }; }
      }
      path.push([x, y]); return { path, cell: null };
    },
    snap(g, x, y) {
      const row = Math.max(0, Math.round((y - BUB.Y0 - BUB.R) / BUB.ROWH));
      let best = null, bd = 1e9;
      for (let r = Math.max(0, row - 1); r <= row + 1; r++) for (let c = 0; c < bubCols(r); c++) {
        if (g.grid[`${r},${c}`] != null) continue;
        const [bx, by] = bubXY(r, c), d = Math.hypot(bx - x, by - y);
        if (d < bd) { bd = d; best = [r, c]; }
      }
      return best;
    },
    group(g, r, c) {
      const col = g.grid[`${r},${c}`], seen = new Set([`${r},${c}`]), todo = [[r, c]];
      while (todo.length) { const [a, b] = todo.pop(); for (const [x, y] of bubNbrs(a, b)) { const k = `${x},${y}`; if (!seen.has(k) && g.grid[k] === col) { seen.add(k); todo.push([x, y]); } } }
      return [...seen];
    },
    drop(g, keys, pop) {
      for (const k of keys) {
        const [r, c] = k.split(',').map(Number), [x, y] = bubXY(r, c);
        g.falling.push({ x, y, ci: g.grid[k], vx: rand(-60, 60), vy: pop ? rand(-160, -60) : 0, life: 1.2, pop });
        if (pop) burst(x, y, 4, { kind: 'bubble', spread: 60, up: 20 });
        delete g.grid[k]; g.popped++;
      }
    },
    land(g, cell, ci) {
      const [r, c] = cell, key = `${r},${c}`;
      g.grid[key] = ci;
      const grp = this.group(g, r, c);
      if (grp.length >= 3) {
        this.drop(g, grp, true); SFX.pop(); tone(660, 0.12, 'sine', 0.08, 0.05, 990);
        // anything no longer hanging from the top floats away too
        const held = new Set(), todo = Object.keys(g.grid).filter(k => k.startsWith('0,'));
        todo.forEach(k => held.add(k));
        while (todo.length) { const [a, b] = todo.pop().split(',').map(Number); for (const [x, y] of bubNbrs(a, b)) { const k = `${x},${y}`; if (!held.has(k) && g.grid[k] != null) { held.add(k); todo.push(k); } } }
        const loose = Object.keys(g.grid).filter(k => !held.has(k));
        this.drop(g, loose, false);
        const [bx, by] = bubXY(r, c);
        floatText(bx, by - 20, grp.length + loose.length >= 6 ? 'WOW!' : 'Pop!', '#fff6a8', false, 26);
      } else SFX.blip();
      if (r >= 10) { g.done = true; speak('Oh no, the bubbles reached the bottom!'); }
    },
    update(g, dt, id) {
      g.timeLeft -= dt;
      if (goLeft()) g.ang -= 1.6 * dt; if (goRight()) g.ang += 1.6 * dt;
      if (pointerMoved(g) && pointer.y < BUB.SY - 10) g.ang = Math.atan2(pointer.y - BUB.SY, pointer.x - BUB.SX);
      g.ang = clamp(g.ang, -Math.PI + 0.18, -0.18);
      const fire = (pointer.clicked && pointer.y > 64 && !id) || pressed[' '] || pressed.arrowup;
      if (g.shot) {
        const s = g.shot; let steps = Math.ceil(860 * dt / 5);
        while (steps-- > 0 && g.shot) {
          s.x += s.vx * 5; s.y += s.vy * 5;
          if (s.x < BUB.X0 + BUB.R) { s.x = BUB.X0 + BUB.R; s.vx = -s.vx; SFX.blip(); }
          if (s.x > BUB.X0 + BUB.COLS * BUB.D - BUB.R) { s.x = BUB.X0 + BUB.COLS * BUB.D - BUB.R; s.vx = -s.vx; SFX.blip(); }
          let hit = s.y <= BUB.Y0 + BUB.R;
          if (!hit) for (const k in g.grid) { const [r, c] = k.split(',').map(Number), [bx, by] = bubXY(r, c); if (Math.hypot(bx - s.x, by - s.y) < BUB.D * 0.86) { hit = true; break; } }
          if (hit) { const cell = this.snap(g, s.x, s.y); g.shot = null; if (cell) this.land(g, cell, s.ci); }
        }
      } else if (fire && !g.done) {
        g.shot = { x: BUB.SX, y: BUB.SY, vx: Math.cos(g.ang), vy: Math.sin(g.ang), ci: g.cur };
        g.cur = Object.values(g.grid).includes(g.nxt) ? g.nxt : this.newCol(g); g.nxt = this.newCol(g); g.shots++;
        tone(420, 0.12, 'sine', 0.08, 0, 760);
      }
      for (const f of g.falling) { f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; }
      g.falling = g.falling.filter(f => f.life > 0);
      const left = Object.keys(g.grid).length;
      if (!left && !g.done) { g.done = true; speak('You cleared every bubble! Hooray!'); burst(W / 2, 200, 30); }
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
      g.progress = `Bubbles left: ${left}`;
      g.score = left ? (g.popped / g.total) * 0.9 : 1;
    },
    draw(g) {
      // the bubble tank
      rrect(BUB.X0 - 10, 60, BUB.COLS * BUB.D + 20, H - 64, 18, 'rgba(10,40,90,.55)', 'rgba(255,255,255,.6)', 3);
      ctx.strokeStyle = 'rgba(255,120,150,.6)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 2;
      const dl = bubXY(10, 0)[1] - BUB.R; ctx.beginPath(); ctx.moveTo(BUB.X0, dl); ctx.lineTo(BUB.X0 + BUB.COLS * BUB.D, dl); ctx.stroke(); ctx.setLineDash([]);
      for (const k in g.grid) { const [r, c] = k.split(',').map(Number), [x, y] = bubXY(r, c); drawBubble(x, y + Math.sin(S.t * 2 + r + c) * 1, g.grid[k]); }
      for (const f of g.falling) { ctx.globalAlpha = clamp(f.life, 0, 1); drawBubble(f.x, f.y, f.ci, BUB.R * (f.pop ? 1 + (1.2 - f.life) * 0.6 : 1)); }
      ctx.globalAlpha = 1;
      // dotted aiming guide, bounces included
      if (!g.shot) {
        const { path } = this.trace(g, g.ang);
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        let carry = 0;
        for (let i = 1; i < path.length; i++) {
          const [ax, ay] = path[i - 1], [bx, by] = path[i], len = Math.hypot(bx - ax, by - ay);
          for (let d = carry; d < len; d += 20) circle(ax + (bx - ax) * d / len, ay + (by - ay) * d / len, 3);
          carry = (20 - ((len - carry) % 20)) % 20;
        }
      } else drawBubble(g.shot.x, g.shot.y, g.shot.ci);
      // Olive cheers from the side; Aubrey the octopus holds the next bubble up to shoot
      drawCritter('Olive the Octopus', 110, H + 20, 0.5, 1);
      const tip = g.shot ? [BUB.SX + Math.cos(g.ang) * 30, BUB.SY + Math.sin(g.ang) * 30] : [BUB.SX, BUB.SY + BUB.R - 2];
      aubOctopus(BUB.SX - 64, 482, tip[0], tip[1], S.t);
      if (!g.shot) drawBubble(BUB.SX, BUB.SY, g.cur);
      darkPanel(BUB.X0 + BUB.COLS * BUB.D + 24, 440, 110, 80, 18);
      text('Next', BUB.X0 + BUB.COLS * BUB.D + 79, 458, 15, '#fff', 'center', 700);
      drawBubble(BUB.X0 + BUB.COLS * BUB.D + 79, 492, g.nxt, 17);
    },
  };

  // ---- Shadow Match: which shadow belongs to which sea creature? ------------------------------
  const SEA_CRITTERS = [
    ['🐙', 'octopus', 'squish'], ['🦑', 'squid', 'squish'], ['🦀', 'crab', 'crust'], ['🦞', 'lobster', 'crust'], ['🦐', 'shrimp', 'crust'],
    ['🐠', 'tropical fish', 'fish'], ['🐡', 'pufferfish', 'fish'], ['🦈', 'shark', 'fish'], ['🐬', 'dolphin', 'fish'], ['🐳', 'whale', 'fish'],
    ['🐢', 'sea turtle', 'other'], ['🐚', 'seashell', 'other'], ['⭐', 'starfish', 'other'], ['🦭', 'seal', 'other'], ['🧜‍♀️', 'mermaid', 'other'], ['🐧', 'penguin', 'other'],
  ];
  const silCache = {};
  function silhouette(ch, col = '#14244a') {
    const key = ch + col;
    if (!silCache[key]) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d');
      x.font = `180px ${EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 128, 128 + 9);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, 256, 256);
      silCache[key] = c;
    }
    return silCache[key];
  }
  const drawSil = (ch, x, y, size) => ctx.drawImage(silhouette(ch), x - size * 0.71, y - size * 0.71, size * 1.42, size * 1.42);
  MG.seashadow = {
    kind: 'learn', title: () => 'Shadow Match', icon: () => '🔦',
    how: () => "Look carefully at the shape! Tap the shadow that matches the sea creature, or the sea creature that made the shadow.",
    init(g) {
      Object.assign(g, { round: 0, rounds: [5, 6, 7][g.tier - 1], cards: g.tier === 1 ? 3 : 4, total: 0, shake: {}, order: shuffle(SEA_CRITTERS.map((_, i) => i)) });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const ans = g.order[g.round % g.order.length], grp = SEA_CRITTERS[ans][2];
      // harder levels use look-alike shapes from the same family as the wrong answers
      const same = shuffle(SEA_CRITTERS.map((_, i) => i).filter(i => i !== ans && SEA_CRITTERS[i][2] === grp));
      const other = shuffle(SEA_CRITTERS.map((_, i) => i).filter(i => i !== ans && SEA_CRITTERS[i][2] !== grp));
      const wrong = (g.tier >= 3 ? [...same.slice(0, 2), ...other] : g.tier === 2 ? [...same.slice(0, 1), ...other] : other).slice(0, g.cards - 1);
      Object.assign(g, { ans, choices: shuffle([ans, ...wrong]), mode: g.round % 2 ? 'creature' : 'shadow', tried: [], state: 'pick' });
      const n = SEA_CRITTERS[ans][1];
      g.say = g.mode === 'shadow' ? `Which shadow belongs to the ${n}?` : 'Whose shadow is this? Find the sea creature that matches!';
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      tickShake(g, dt);
      if (g.state === 'pick') {
        const k = numKey(g.cards), i = id?.startsWith('sh:') ? +id.slice(3) : k;
        if (i >= 0 && !g.tried.includes(i)) {
          g.tried.push(i);
          if (g.choices[i] === g.ans) {
            g.total += [1, 0.5, 0.2, 0][g.tried.length - 1]; g.state = 'yay'; g.t2 = 2.2;
            SFX.hit(); burst(this.cardX(g, i) + 95, 400, 22);
            speak(`${pick(['Yes!', 'Great matching!', 'You got it!'])} It's the ${SEA_CRITTERS[g.ans][1]}!`);
          } else { g.shake[i] = 0.4; SFX.miss(); speak(g.mode === 'shadow' ? 'Not that shadow. Look at the shape again!' : `That's the ${SEA_CRITTERS[g.choices[i]][1]}. Look at the shape again!`); }
        }
      } else if ((g.t2 -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      g.progress = `Match ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    cardX(g, i) { const w = 190, gap = 20; return W / 2 - (g.cards * w + (g.cards - 1) * gap) / 2 + i * (w + gap); },
    // a lit-up rock wall that shadows are cast on
    wall(x, y, w, h, lit) {
      rrect(x, y, w, h, 14, lit ? '#fff2c4' : '#bfefff');
      if (lit) { const gr = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w * 0.7); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,200,120,.2)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); }
    },
    draw(g) {
      ctx.fillStyle = 'rgba(10,30,70,.45)'; ctx.fillRect(0, 0, W, H);
      const shown = SEA_CRITTERS[g.ans][0], yay = g.state === 'yay';
      panel(W / 2 - 330, 66, 660, 50, 20);
      text(g.mode === 'shadow' ? `Which shadow is the ${SEA_CRITTERS[g.ans][1]}'s?` : 'Whose shadow is this?', W / 2, 91, 24, '#5a2a6e', 'center', 700);
      // the clue in the spotlight
      const cx = W / 2, cy = 204;
      panel(cx - 110, 128, 220, 156, 22);
      this.wall(cx - 98, 140, 196, 132, g.mode === 'creature');
      if (g.mode === 'shadow' || yay) emoji(shown, cx + (yay && g.mode === 'creature' ? 46 : 0), cy + Math.sin(S.t * 2) * 4, yay && g.mode === 'creature' ? 70 : 104);
      if (g.mode === 'creature') drawSil(shown, cx - (yay ? 40 : 0), cy, yay ? 70 : 104);
      g.choices.forEach((ci, i) => {
        const x = this.cardX(g, i) + shakeX(g, i), y = 304, used = g.tried.includes(i) && ci !== g.ans, right = yay && ci === g.ans;
        button(`sh:${i}`, x, y, 190, 206, '', { color: right ? '#ffd23f' : used ? '#9a8aaa' : CARD_COLS[i], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        this.wall(x + 10, y + 10, 170, 150, g.mode === 'shadow');
        if (g.mode === 'shadow') drawSil(SEA_CRITTERS[ci][0], x + 95, y + 85, 108);
        else emoji(SEA_CRITTERS[ci][0], x + 95, y + 85 + Math.sin(S.t * 2 + i) * 3, 100);
        if (used || right || g.mode === 'creature') text(SEA_CRITTERS[ci][1], x + 95, y + 184, 19, '#fff', 'center', 700);
        if (used) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x + 10, y + 10, 170, 150); }
      });
    },
  };

  restage('grotto', {
    bg: 'grotto_bg',
    games: [['bubbleshot', 'moonbeam', {}], ['seashadow', 'silk', {}]],
    intro: [
      '*:Down, down, down under the waves is a sparkly grotto full of coral and treasure.',
      'N:Glub! My bubble collection got all mixed up! Help me shoot bubbles and pop three of the same colour together!',
      'A:excited:Bubbles under the sea? Let me try!',
    ],
    mid: ["N:Now, my friends are playing a shadow game in the lantern light. Can you tell who's who just from their shapes?", 'A:focused:I will look very carefully.'],
    outro: ['N:Moon pearls and sea-silk, for the bravest bubble shooter in the ocean. Glub glub!', 'A:laughing:Glub glub to you too, Olive!'],
  });

  // =============================================================================================
  // 3. SLEEPING DRAGON'S HOARD
  // =============================================================================================
  const torch = (x, y) => {
    glow(x, y - 30, 110, 'rgba(255,170,70,.35)');
    inkRect(x - 14, y + 4, 28, 10, '#7a7a8a', 1.5, 3);
    ink(P2(`M${x - 8},${y - 10} L${x + 8},${y - 10} L${x + 4},${y + 50} L${x - 4},${y + 50} Z`), '#8a5a3a', 1.5);
    inkEllipse(x, y - 10, 12, 5, 0, '#5a3a2a', 1.5);
    const f = k => Math.sin(S.t * 11 + x + k) * 3;
    ink(P2(`M${x},${y - 56 + f(0)} C${x + 16 + f(1)},${y - 34} ${x + 14},${y - 12} ${x},${y - 12} C${x - 14},${y - 12} ${x - 16 + f(2)},${y - 34} ${x},${y - 56 + f(0)} Z`), '#ff8a2a', 1.2);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x, y - 42 + f(3)); ctx.quadraticCurveTo(x + 9, y - 22, x, y - 16); ctx.quadraticCurveTo(x - 9, y - 22, x, y - 42 + f(3)); ctx.fill();
    for (let k = 0; k < 2; k++) { const p = (S.t * 0.8 + k * 0.5) % 1; ctx.fillStyle = `rgba(255,200,90,${1 - p})`; circle(x + Math.sin(p * 9 + k) * 8, y - 50 - p * 50, 2); }
  };
  const gem = (x, y, r, col) => {
    ink(P2(`M${x},${y - r} L${x + r * 0.8},${y - r * 0.2} L${x},${y + r} L${x - r * 0.8},${y - r * 0.2} Z`), col, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; tri(x, y - r, x - r * 0.8, y - r * 0.2, x - r * 0.1, y - r * 0.2);
  };
  // a mound of gold with coins piled all over it
  const goldMound = (x0, x1, peak, top, seed) => {
    const w = x1 - x0, path = P2(`M${x0},${GY + 4} C${x0 + w * 0.2},${top + 30} ${peak - w * 0.18},${top} ${peak},${top} C${peak + w * 0.18},${top} ${x1 - w * 0.2},${top + 30} ${x1},${GY + 4} Z`);
    const gr = ctx.createLinearGradient(0, top, 0, GY);
    gr.addColorStop(0, '#ffe680'); gr.addColorStop(1, '#d89a2a');
    ink(path, gr, 2);
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 70; i++) {
      const cx = x0 + hash(seed + i) * w, cy = top + 6 + hash(seed + i + 50) * (GY - top);
      inkEllipse(cx, cy, 9, 4.5, 0, hash(seed + i + 7) < 0.5 ? '#ffd23f' : '#ffe680', 0.9);
    }
    ctx.restore();
    const tw = (S.t * 1.3 + seed) % 3;
    if (tw < 1) star(x0 + hash(seed + Math.floor(S.t * 1.3)) * w * 0.8 + w * 0.1, top + 30 + hash(seed + 3 + Math.floor(S.t)) * 60, 10 * Math.sin(tw * Math.PI), '#fffbe0', 4);
  };
  const crown = (x, y, s, rot = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ink(P2('M-26,10 L-30,-18 L-14,-4 L0,-24 L14,-4 L30,-18 L26,10 Z'), '#ffcc2a', 1.8);
    inkRect(-27, 4, 54, 10, '#f0b020', 1.6, 3);
    inkCircle(0, 9, 3.5, '#ff4a6a', 0.8); inkCircle(-15, 9, 3, '#40b0ff', 0.8); inkCircle(15, 9, 3, '#5adc7a', 0.8);
    for (const [px, py] of [[-30, -18], [0, -24], [30, -18]]) inkCircle(px, py, 3.5, '#fff4fb', 0.8);
    ctx.restore();
  };
  const goblet = (x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ink(P2('M-16,-30 L16,-30 C16,-8 6,-4 3,-2 L3,10 L12,14 L-12,14 L-3,10 L-3,-2 C-6,-4 -16,-8 -16,-30 Z'), '#ffcc2a', 1.6);
    inkCircle(0, -16, 4, '#ff4a6a', 0.8);
    ctx.restore();
  };
  BACKDROPS.hoard_bg = () => {
    const cave = ctx.createLinearGradient(0, 0, 0, H);
    cave.addColorStop(0, '#24142e'); cave.addColorStop(0.55, '#4a2440'); cave.addColorStop(1, '#7a3a34');
    ctx.fillStyle = cave; ctx.fillRect(0, 0, W, H);
    // rocky back walls in layers
    ctx.fillStyle = '#3a1f3e';
    ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, 150 + Math.sin(x * 0.013) * 40 + hash(x) * 30); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#4a2848';
    ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 50) ctx.lineTo(x, 260 + Math.sin(x * 0.02 + 1) * 30 + hash(x + 5) * 24); ctx.lineTo(W, H); ctx.fill();
    // a few short stalactites
    ctx.fillStyle = '#2e1834'; for (let i = 0; i < 10; i++) { const x = 30 + i * 100 + hash(i) * 30; tri(x - 16, 0, x + 16, 0, x, 30 + hash(i + 2) * 40); }
    // glowing crystals in the rock
    for (const [x, y, c] of [[70, 250, '#7fe0ff'], [300, 215, '#ff8fd0'], [640, 205, '#b07aff'], [905, 260, '#7fffb0']]) {
      glow(x, y, 50, c + '55');
      for (const [dx, h, a] of [[-10, 30, -0.3], [0, 42, 0], [10, 26, 0.35]]) inkAt(x + dx, y + 16, a, P2(`M-6,0 L-6,${-h + 8} L0,${-h} L6,${-h + 8} L6,0 Z`), c, 1.2);
    }
    // the sleeping dragon's tail curling round the back of the hoard
    ctx.save(); ctx.translate(0, Math.sin(S.t * 1.2) * 2);
    const tail = P2('M980,300 C900,250 780,240 700,300 C640,345 560,350 520,320 C500,305 505,285 525,290 C560,300 600,300 650,262 C730,200 880,210 980,250 Z');
    ink(tail, '#c04a5a', 2.5);
    ctx.strokeStyle = '#ffcf9a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.setLineDash([10, 12]);
    ctx.beginPath(); ctx.moveTo(975, 278); ctx.bezierCurveTo(880, 236, 780, 236, 700, 290); ctx.bezierCurveTo(640, 330, 580, 330, 540, 308); ctx.stroke(); ctx.setLineDash([]);
    ink(P2('M525,290 L496,270 L506,300 Z'), '#8a3a6a', 1.5);
    ctx.restore();
    // gold mountains with treasure poking out
    goldMound(420, 980, 760, 250, 10);
    goldMound(-40, 380, 140, 300, 90);
    goldMound(300, 640, 470, 360, 170);
    crown(150, 300, 1.2, -0.15); crown(800, 252, 0.9, 0.2); goblet(560, 350, 1.1); goblet(70, 340, 0.9);
    // a sword stuck in the gold and a string of pearls
    inkAt(640, 300, 0.25, P2('M-4,0 L-4,-90 L0,-100 L4,-90 L4,0 Z'), '#dfe6f0', 1.5); inkAt(640, 300, 0.25, P2('M-18,-2 L18,-2 L18,6 L-18,6 Z'), '#ffcc2a', 1.5); inkAt(640, 300, 0.25, P2('M-4,6 L4,6 L4,26 L-4,26 Z'), '#8a3a6a', 1.5);
    for (let i = 0; i < 14; i++) gem(30 + hash(i + 70) * 900, 300 + hash(i + 80) * 140, 7 + hash(i) * 5, ['#ff4a6a', '#40b0ff', '#5adc7a', '#b07aff', '#ff9a3a'][i % 5]);
    // torches on the cave walls
    torch(240, 190); torch(520, 150); torch(900, 180);
    // stone floor sprinkled with spilled coins
    ctx.fillStyle = '#5a3440'; ctx.fillRect(0, GY - 6, W, H);
    ctx.strokeStyle = 'rgba(255,200,140,.12)'; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) { ctx.beginPath(); ctx.roundRect(c * 100 + (r % 2) * 50 - 30, GY + r * 24, 96, 22, 6); ctx.stroke(); }
    glow(480, GY + 20, 420, 'rgba(255,170,70,.18)');
    for (let i = 0; i < 26; i++) inkEllipse(hash(i + 300) * W, GY + 6 + hash(i + 320) * 64, 7, 3.5, 0, '#ffd23f', 0.8);
    for (let i = 0; i < 6; i++) gem(hash(i + 400) * W, GY + 20 + hash(i + 410) * 50, 6, ['#ff4a6a', '#40b0ff', '#5adc7a'][i % 3]);
    // snores drifting up from behind the gold
    for (let k = 0; k < 3; k++) { const p = (S.t * 0.35 + k / 3) % 1; ctx.globalAlpha = Math.sin(p * Math.PI); outlined('Z', 930 - p * 20 + Math.sin(p * 8) * 10, 330 - p * 150, 20 + p * 22, '#bfe6ff'); }
    ctx.globalAlpha = 1;
  };

  // ---- Tiptoe: sneak to the treasure while the dragon sleeps; freeze when he wakes ----------
  const TT_START = 90, TT_END = 600;
  const TT_LOOT = ['💰', '💎', '💍', '🏆', '📿', '💎'];
  // the big sleepy dragon, eye: 0 shut, 1 open
  function drawSleepyDragon(x, y, eye, look, snore) {
    const R = '#c04a5a', BELLY = '#ffcf9a';
    ctx.save(); ctx.translate(x, y);
    // curled body, folded wing and back spikes
    for (let k = 0; k < 6; k++) ink(P2(`M${40 + k * 40},${-80 + Math.abs(k - 2.5) * 10} l14,-30 l14,30 Z`), BELLY, 1.4);
    inkEllipse(140, -10, 170, 90 + snore * 4, 0, R, 2.5);
    inkEllipse(140, 30, 120, 40, 0, BELLY, 1.5);
    ink(P2('M80,-60 C140,-140 230,-120 260,-40 C210,-70 160,-50 120,-30 Z'), '#8a3a6a', 2);
    // front paws
    inkEllipse(20, 60, 36, 20, 0, R, 2); inkEllipse(-40, 66, 34, 18, 0, R, 2);
    for (const px of [-62, -50, -38]) inkCircle(px, 78, 4, '#fff2c8', 0.8);
    // head resting on the paws, snout pointing left
    ink(P2('M40,10 C40,-60 -40,-70 -80,-40 C-120,-30 -150,-8 -150,18 C-150,40 -110,50 -60,48 C-10,52 40,46 40,10 Z'), R, 2.5);
    inkEllipse(-128, 4, 6, 4, 0, '#7a2a3a', 0.8); inkEllipse(-140, 14, 5, 3.5, 0, '#7a2a3a', 0.8);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-146, 30); ctx.quadraticCurveTo(-110, 44, -76, 32); ctx.stroke();
    ink(P2('M-118,38 L-114,46 L-110,39 Z'), '#fff', 0.8); ink(P2('M-98,38 L-94,46 L-90,37 Z'), '#fff', 0.8);
    ctx.fillStyle = 'rgba(255,140,160,.55)'; ellipse(-78, 18, 14, 8);
    if (snore > 0.6) { ctx.fillStyle = `rgba(220,220,230,${(snore - 0.6) * 1.5})`; circle(-166, 6, 8); circle(-180, -2, 6); }
    // horns and nightcap
    ink(P2('M10,-40 C20,-80 40,-90 50,-92 C40,-70 32,-56 26,-34 Z'), '#fff2c8', 1.5);
    ink(P2('M-20,-48 C-20,-80 -6,-96 4,-100 C-2,-80 -6,-64 -4,-44 Z'), '#fff2c8', 1.5);
    ink(P2('M-46,-44 C-30,-110 40,-110 70,-60 C80,-40 100,-30 110,-10 C90,-20 70,-30 40,-40 Z'), '#5f8ae0', 2);
    inkCircle(112, -8, 10, '#fff', 1.2);
    ink(P2('M-52,-44 C-30,-60 30,-62 48,-40 L44,-30 C24,-48 -30,-48 -50,-34 Z'), '#fff', 1.5);
    // the eye: closed, peeking or wide open behind his specs
    const ex = -50, ey = -6;
    if (eye < 0.15) { ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex, ey - 4, 14, 0.3, Math.PI - 0.3); ctx.stroke(); }
    else {
      inkEllipse(ex, ey, 16, 16 * eye, 0, '#fff', 1.5);
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 16, 16 * eye, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#3a1a2a'; circle(ex - 6 + look * 4, ey + 1, 8); ctx.fillStyle = '#fff'; circle(ex - 8 + look * 4, ey - 2, 2.5);
      ctx.restore();
      ink(P2(`M${ex - 18},${ey - 14 * eye - 4} Q${ex},${ey - 20 * eye - 8} ${ex + 18},${ey - 14 * eye - 4}`), 'rgba(0,0,0,0)', 1.5);
    }
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex, ey, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  MG.tiptoe = {
    kind: 'action', title: () => 'Tiptoe', icon: () => '🤫',
    how: () => "Hold down the mouse or the space bar to tiptoe. Grab the treasure while the dragon sleeps! When he opens his eye, let go and FREEZE!",
    init(g) {
      const loot = TT_LOOT.map((ch, i) => ({ ch, x: TT_START + 70 + i * 74, got: false }));
      loot.push({ ch: '👑', x: TT_END + 10, got: false, big: true });
      Object.assign(g, { x: TT_START, loot, got: 0, caught: 0, dstate: 'sleep', dt2: 2.5, walk: 0, oops: 0, eye: 0, timeLeft: [55, 50, 45][g.tier - 1], moving: false });
      g.say = 'Hold to tiptoe. Freeze when the dragon opens his eye!';
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.timeLeft -= dt; g.oops = Math.max(0, g.oops - dt);
      // the dragon: asleep, then stirring (a warning), then awake and watching
      g.dt2 -= dt;
      if (g.dt2 <= 0) {
        if (g.dstate === 'sleep') { g.dstate = 'stir'; g.dt2 = [1.2, 1.0, 0.85][g.tier - 1]; tone(220, 0.25, 'triangle', 0.07, 0, 330); }
        else if (g.dstate === 'stir') { g.dstate = 'awake'; g.dt2 = rand(1.4, 2.2); g.grace = 0.25; SFX.alert(); speak('Freeze!'); }
        else { g.dstate = 'sleep'; g.dt2 = rand(...[[2.2, 3.6], [1.8, 3.2], [1.5, 3]][g.tier - 1]); }
      }
      if (g.dstate === 'sleep' && Math.floor(S.t * 0.8) !== g.snoreBeat) { g.snoreBeat = Math.floor(S.t * 0.8); tone(90, 0.5, 'sawtooth', 0.025, 0, 70); }
      g.eye = lerp(g.eye, g.dstate === 'awake' ? 1 : g.dstate === 'stir' ? (Math.sin(S.t * 18) > 0.3 ? 0.35 : 0) : 0, Math.min(1, dt * 12));
      g.grace = Math.max(0, (g.grace || 0) - dt);
      const hold = pointer.down || keys[' '] || keys.arrowright || keys.d;
      g.moving = hold && g.oops <= 0 && g.x < TT_END;
      if (g.moving) {
        g.x = Math.min(TT_END, g.x + 72 * dt); g.walk += dt;
        if (g.dstate === 'awake' && g.grace <= 0) {
          // caught! back she scoots
          g.caught++; g.oops = 1.1; g.x = Math.max(TT_START, g.x - 150); SFX.fail(); burst(g.x + 40, GY - 100, 14, { colors: ['#ccc', '#eee', '#bbb'] });
          floatText(g.x + 30, GY - 180, 'HRRM!', '#ffb0b0', false, 34); speak('Hrrm! I saw that! Back you go.');
        }
      }
      for (const l of g.loot) if (!l.got && g.x + 20 >= l.x) {
        l.got = true; g.got++; SFX.sparkle(); burst(l.x, GY - 40, 12); floatText(l.x, GY - 90, l.big ? 'The crown!' : '+1', '#fff6a8', false, l.big ? 30 : 22);
      }
      if (g.x >= TT_END && g.loot.every(l => l.got) && !g.finT) { g.finT = 1.4; speak('You got the crown, and he never woke up! Super sneaky!'); }
      if (g.finT && (g.finT -= dt) <= 0) g.done = true;
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
      g.progress = `Treasure: ${g.got} of ${g.loot.length}`;
      g.score = clamp(g.got / g.loot.length - 0.15 * g.caught, 0, 1);
    },
    draw(g) {
      ctx.fillStyle = 'rgba(30,10,30,.25)'; ctx.fillRect(0, 0, W, H);
      const snore = g.dstate === 'sleep' ? Math.sin(S.t * 2.6) : 0;
      drawSleepyDragon(770, GY - 70, g.eye, clamp((g.x - 400) / 300, -1, 1) * -1, snore);
      if (g.dstate === 'sleep') for (let k = 0; k < 3; k++) { const p = (S.t * 0.5 + k / 3) % 1; ctx.globalAlpha = Math.sin(p * Math.PI); outlined('z', 720 + p * 50, GY - 150 - p * 120, 22 + p * 22, '#bfe6ff'); }
      ctx.globalAlpha = 1;
      if (g.dstate === 'stir') outlined('?', 740, GY - 190 + Math.sin(S.t * 10) * 4, 42, '#ffe36b');
      if (g.dstate === 'awake') outlined('!', 740, GY - 196, 52, '#ff6a6a');
      // a path of treasure to tiptoe along
      ctx.fillStyle = 'rgba(255,220,140,.15)'; ellipse((TT_START + TT_END) / 2, GY + 18, 300, 16);
      for (const l of g.loot) {
        if (l.got) continue;
        glow(l.x, GY - 6, l.big ? 50 : 28, 'rgba(255,230,120,.6)');
        if (l.big) crown(l.x, GY - 12 + Math.sin(S.t * 3) * 3, 1.1); else emoji(l.ch, l.x, GY - 10 + Math.sin(S.t * 3 + l.x) * 3, 30);
      }
      const frame = g.oops > 0 ? 'jump' : g.moving ? `run${1 + Math.floor(g.walk * 5) % 5}` : g.dstate === 'awake' ? 'crouch' : 'idle_front';
      drawAubrey(g.x, GY + 12, frame, 1, 0, 0.62);
      // the traffic light: green sneak, yellow careful, red freeze
      const [col, label] = { sleep: ['#3fbf6a', 'Sneak! Hold to tiptoe'], stir: ['#ffc23a', 'Careful... he is stirring!'], awake: ['#ff4a5a', 'FREEZE! Let go!'] }[g.dstate];
      darkPanel(W / 2 - 230, 68, 460, 56, 26);
      for (let k = 0; k < 3; k++) { const on = ['sleep', 'stir', 'awake'][k] === g.dstate; inkCircle(W / 2 - 200 + k * 30, 96, 11, on ? ['#3fbf6a', '#ffc23a', '#ff4a5a'][k] : '#4a3a5a', 1.2); }
      text(label, W / 2 - 100, 96, 23, col, 'left', 700);
      if (!g.moving && g.dstate === 'sleep' && g.x < TT_END) text('Hold the mouse or SPACE to tiptoe', W / 2, 140, 18, '#fff6a8', 'center', 700);
    },
  };

  // ---- Dragon Riddles: Grandpa Smolder's picture riddles ---------------------------------------
  const RIDDLES = [
    ["I have a trunk, but I'm not a tree. What am I?", ['🐘', 'an elephant'], [['🌳', 'a tree'], ['🦒', 'a giraffe'], ['🐭', 'a mouse']]],
    ["I have hands, but I can't clap. What am I?", ['🕰️', 'a clock'], [['🧤', 'gloves'], ['👶', 'a baby'], ['🐒', 'a monkey']]],
    ["I have keys, but I can't open a door. What am I?", ['🎹', 'a piano'], [['🚪', 'a door'], ['🐶', 'a dog'], ['🏠', 'a house']]],
    ['I go up when the rain comes down. What am I?', ['☂️', 'an umbrella'], [['☀️', 'the sun'], ['🎈', 'a balloon'], ['🪁', 'a kite']]],
    ["I have a neck and two sleeves, but no head. What am I?", ['👕', 'a shirt'], [['🦒', 'a giraffe'], ['🧢', 'a cap'], ['🧦', 'a sock']]],
    ["I'm full of holes, but I still hold water. What am I?", ['🧽', 'a sponge'], [['🧀', 'cheese'], ['🍩', 'a donut'], ['🎈', 'a balloon']]],
    ['I carry my house on my back and move very slowly. What am I?', ['🐢', 'a turtle'], [['🐇', 'a rabbit'], ['🐎', 'a horse'], ['🐦', 'a bird']]],
    ['I have eight legs and I spin a web. What am I?', ['🕷️', 'a spider'], [['🐜', 'an ant'], ['🐝', 'a bee'], ['🐛', 'a caterpillar']]],
    ["I'm round and orange, and you carve a face on me. What am I?", ['🎃', 'a pumpkin'], [['🏀', 'a ball'], ['🥕', 'a carrot'], ['🍊', 'an orange']]],
    ["I'm cold and white, and I fall from the sky in winter. What am I?", ['❄️', 'snow'], [['🌧️', 'rain'], ['🍦', 'ice cream'], ['⭐', 'a star']]],
    ['I have a big fluffy mane and a loud ROAR. What am I?', ['🦁', 'a lion'], [['🐻', 'a bear'], ['🐴', 'a horse'], ['🐑', 'a sheep']]],
    ["I'm yellow and curvy, and monkeys love to eat me. What am I?", ['🍌', 'a banana'], [['🍋', 'a lemon'], ['🌽', 'corn'], ['🐒', 'a monkey']]],
    ["I have four legs and a back, but I can't walk. What am I?", ['🪑', 'a chair'], [['🐕', 'a dog'], ['🦓', 'a zebra'], ['🛏️', 'a bed']]],
    ["I have wings, but I'm not a bird. I fly people far away. What am I?", ['✈️', 'a plane'], [['🦅', 'an eagle'], ['🚗', 'a car'], ['🚂', 'a train']]],
  ];
  MG.dragonriddle = {
    kind: 'learn', title: () => 'Dragon Riddles', icon: () => '🐉',
    how: () => 'Grandpa Smolder will tell you a riddle. Listen to the clues and tap the picture that answers it!',
    init(g) {
      Object.assign(g, { round: 0, rounds: [5, 6, 6][g.tier - 1], cards: g.tier === 1 ? 3 : 4, total: 0, shake: {}, order: shuffle(RIDDLES.map((_, i) => i)) });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const [q, ans, wrongs] = RIDDLES[g.order[g.round]];
      Object.assign(g, { q, ans, choices: shuffle([ans, ...shuffle(wrongs).slice(0, g.cards - 1)]), tried: [], state: 'pick' });
      g.say = q;
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      tickShake(g, dt);
      if (g.state === 'pick') {
        const k = numKey(g.cards), i = id?.startsWith('rd:') ? +id.slice(3) : k;
        if (i >= 0 && !g.tried.includes(i)) {
          g.tried.push(i);
          if (g.choices[i] === g.ans) {
            g.total += [1, 0.5, 0.2, 0][g.tried.length - 1]; g.state = 'yay'; g.t2 = 2.3;
            SFX.hit(); burst(this.cardX(g, i) + 90, 340, 22);
            speak(`${pick(['Hrrm! Clever!', 'Yes!', 'Ho ho, you got it!'])} I'm ${g.ans[1]}!`);
          } else { g.shake[i] = 0.4; SFX.miss(); speak(`Not ${g.choices[i][1]}. Listen again: ${g.q}`); }
        }
      } else if ((g.t2 -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      g.progress = `Riddle ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    cardX(g, i) { const w = 180, gap = 22; return W / 2 - (g.cards * w + (g.cards - 1) * gap) / 2 + i * (w + gap); },
    draw(g) {
      ctx.fillStyle = 'rgba(30,10,30,.45)'; ctx.fillRect(0, 0, W, H);
      // the riddle on an old scroll
      const sx = 120, sw = 720, lines = wrap(g.q, 560, 27, 700);
      inkRect(sx, 74, sw, 136, '#f7e6bf', 2.5, 10);
      inkRect(sx - 12, 66, 24, 152, '#e0c48a', 2, 12); inkRect(sx + sw - 12, 66, 24, 152, '#e0c48a', 2, 12);
      emoji('🐉', sx + 62, 142, 58);
      lines.forEach((l, i) => text(l, sx + 400, 142 + (i - (lines.length - 1) / 2) * 34, 27, '#6a2a3a', 'center', 700));
      g.choices.forEach((c, i) => {
        const x = this.cardX(g, i) + shakeX(g, i), y = 236, used = g.tried.includes(i) && c !== g.ans, right = g.state === 'yay' && c === g.ans;
        button(`rd:${i}`, x, y, 180, 226, '', { color: right ? '#ffd23f' : used ? '#9a8aaa' : CARD_COLS[i], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        rrect(x + 10, y + 10, 160, 160, 14, used ? '#e8e0ee' : '#fff8ee');
        emoji(c[0], x + 90, y + 92 + (right ? -Math.abs(Math.sin(S.t * 6)) * 10 : 0), 100);
        text(c[1].replace(/^(a|an|the) /, ''), x + 90, y + 198, 21, '#fff', 'center', 700);
      });
    },
  };

  restage('hoard', {
    bg: 'hoard_bg',
    games: [['tiptoe', 'ember', {}], ['dragonriddle', 'honey', {}]],
    intro: [
      '*:Deep in the mountain, a HUGE dragon is snoring on a pile of gold. Tiptoe, tiptoe...',
      'N:ZZZZ... *snore*... ZZZ...',
      "A:serious:I'll sneak in and grab the treasure. If he opens his eye, I'll freeze like a statue!",
    ],
    mid: ['N:*opens one eye* Hrrm. A sneaky visitor. You may keep that... IF you can answer my riddles, little one.', 'A:thinking:I love riddles! Ask me!'],
    outro: ['N:Hrrm. Clever child. Take the embers, and some golden honey too. Now let an old dragon sleep.', 'A:winky:Sweet dreams, Grandpa Smolder!'],
  });

  // =============================================================================================
  // 4. RAINBOW FALLS
  // =============================================================================================
  const RAINBOW = ['#ff5f7e', '#ffa040', '#ffd83a', '#5adc7a', '#40b0ff', '#9c6cff'];
  const palm = (x, gy, h, lean) => {
    // curved, ringed trunk with a sunny left edge
    const tx = x + lean, ty = gy - h, cx = x + lean * 0.1, cy = gy - h * 0.6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();
    ctx.strokeStyle = '#c98a4a'; ctx.lineWidth = 20; ctx.stroke();
    ctx.strokeStyle = '#e4b072'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 5, gy); ctx.quadraticCurveTo(cx - 5, cy, tx - 4, ty); ctx.stroke();
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2;
    for (let k = 0.08; k < 0.95; k += 0.08) {
      const px = (1 - k) * (1 - k) * x + 2 * (1 - k) * k * cx + k * k * tx, py = (1 - k) * (1 - k) * gy + 2 * (1 - k) * k * cy + k * k * ty;
      ctx.beginPath(); ctx.moveTo(px - 9, py - 1); ctx.quadraticCurveTo(px, py + 4, px + 9, py - 1); ctx.stroke();
    }
    // fronds swaying in the breeze: outline every frond first, then fill, so the crown reads as one leafy mass
    const fr = [];
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI - 0.12 + i * (Math.PI + 0.24) / 7 + Math.sin(S.t * 1.4 + i + x) * 0.05, len = 92 + (i % 2) * 22;
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.5 + 44, mx = tx + Math.cos(a) * len * 0.55, my = ty + Math.sin(a) * len * 0.5 - 16;
      fr.push({ p: P2(`M${tx},${ty} Q${mx},${my - 18} ${ex},${ey} Q${mx},${my + 14} ${tx},${ty} Z`), mx, my, ex, ey, i });
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 3.5; for (const f of fr) ctx.stroke(f.p);
    for (const f of fr) {
      ctx.fillStyle = f.i % 2 ? '#3fae55' : '#56cc6c'; ctx.fill(f.p);
      ctx.save(); ctx.clip(f.p);
      ctx.strokeStyle = 'rgba(25,95,45,.45)'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let k = 0.18; k < 0.98; k += 0.11) {
        const px = (1 - k) * (1 - k) * tx + 2 * (1 - k) * k * f.mx + k * k * f.ex, py = (1 - k) * (1 - k) * ty + 2 * (1 - k) * k * f.my + k * k * f.ey, sx = (f.ex - tx) * 0.07;
        ctx.moveTo(px, py); ctx.lineTo(px + sx, py - 16); ctx.moveTo(px, py); ctx.lineTo(px + sx, py + 16);
      }
      ctx.stroke(); ctx.restore();
      ctx.strokeStyle = 'rgba(210,255,170,.75)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(f.mx, f.my - 2, f.ex, f.ey); ctx.stroke();
    }
    for (const [dx, dy] of [[-9, 8], [9, 10], [0, 17]]) { inkCircle(tx + dx, ty + dy, 9, '#8a5a2a', 1.2); ctx.fillStyle = 'rgba(255,220,170,.55)'; circle(tx + dx - 3, ty + dy - 3, 2.6); }
  };
  const hibiscus = (x, y, r, col) => {
    // outline all five petals first, then fill, so the flower reads as one bloom
    const pet = [];
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + 0.3; pet.push([x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, a]); }
    ctx.strokeStyle = OL; ctx.lineWidth = Math.max(2, r * 0.16);
    for (const [px, py, a] of pet) { ctx.beginPath(); ctx.ellipse(px, py, r * 0.6, r * 0.42, a, 0, TAU); ctx.stroke(); }
    for (const [px, py, a] of pet) {
      ctx.fillStyle = col; ellipse(px, py, r * 0.6, r * 0.42, a);
      ctx.fillStyle = mix(col, '#ffffff', 0.35); ellipse(px + Math.cos(a) * r * 0.18, py + Math.sin(a) * r * 0.18, r * 0.32, r * 0.2, a);
    }
    ctx.fillStyle = mix(col, '#7a1030', 0.4); circle(x, y, r * 0.3);
    ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.7, y - r * 0.6); ctx.stroke();
    ctx.fillStyle = '#ffe36b'; circle(x + r * 0.7, y - r * 0.6, Math.max(1.5, r * 0.16));
  };
  // a mossy boulder: outline the rock and its moss cushion first, then fill, so they read as one
  const rfMossRock = (x, y, rx, ry) => {
    const p = P2(`M${x - rx},${y} C${x - rx},${y - ry * 1.1} ${x - rx * 0.3},${y - ry * 1.5} ${x + rx * 0.1},${y - ry * 1.4} C${x + rx * 0.8},${y - ry * 1.3} ${x + rx * 1.05},${y - ry * 0.6} ${x + rx},${y} C${x + rx * 0.7},${y + ry * 0.45} ${x - rx * 0.7},${y + ry * 0.45} ${x - rx},${y} Z`);
    const moss = P2(`M${x - rx * 0.9},${y - ry * 0.65} C${x - rx * 0.6},${y - ry * 1.5} ${x + rx * 0.5},${y - ry * 1.65} ${x + rx * 0.88},${y - ry * 0.8} C${x + rx * 0.62},${y - ry * 0.5} ${x + rx * 0.42},${y - ry * 0.85} ${x + rx * 0.2},${y - ry * 0.55} C${x},${y - ry * 0.9} ${x - rx * 0.3},${y - ry * 0.45} ${x - rx * 0.5},${y - ry * 0.72} C${x - rx * 0.66},${y - ry * 0.45} ${x - rx * 0.8},${y - ry * 0.55} ${x - rx * 0.9},${y - ry * 0.65} Z`);
    ctx.strokeStyle = OL; ctx.lineWidth = 3.5; ctx.stroke(p); ctx.stroke(moss);
    const gr = ctx.createLinearGradient(x - rx, y - ry * 1.5, x + rx * 0.6, y + ry * 0.4);
    gr.addColorStop(0, '#c4bad0'); gr.addColorStop(0.55, '#9a8eac'); gr.addColorStop(1, '#6a5d80');
    ctx.fillStyle = gr; ctx.fill(p);
    const mg = ctx.createLinearGradient(0, y - ry * 1.6, 0, y - ry * 0.5);
    mg.addColorStop(0, '#7ee07a'); mg.addColorStop(1, '#3fae5a');
    ctx.fillStyle = mg; ctx.fill(moss);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(x - rx * 0.55, y - ry * 0.35, rx * 0.12, ry * 0.18, -0.4);
    ctx.fillStyle = 'rgba(200,255,170,.8)'; for (let i = 0; i < 4; i++) circle(x - rx * 0.5 + i * rx * 0.32, y - ry * (1.1 + (i % 2) * 0.2), Math.max(1.2, rx * 0.04));
    ctx.fillStyle = 'rgba(40,30,70,.18)'; ellipse(x, y + ry * 0.2, rx * 0.8, ry * 0.18);
  };
  // a curling fern: leaflets along a stem, outlined first and filled second
  const rfFern = (x, y, len, ang, col = '#46b864') => {
    const lf = [];
    for (let k = 1; k <= 7; k++) {
      const d = k / 7, px = x + Math.cos(ang) * len * d, py = y + Math.sin(ang) * len * d + d * d * len * 0.25, sz = (1 - d * 0.7) * len * 0.2;
      for (const s of [-1, 1]) lf.push([px + Math.cos(ang + s * 1.2) * sz * 0.8, py + Math.sin(ang + s * 1.2) * sz * 0.8, sz, sz * 0.38, ang + s * 1.2]);
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 2.6;
    for (const [px, py, a, b, r] of lf) { ctx.beginPath(); ctx.ellipse(px, py, a, b, r, 0, TAU); ctx.stroke(); }
    lf.forEach(([px, py, a, b, r], i) => { ctx.fillStyle = i % 4 < 2 ? col : mix(col, '#ffffff', 0.18); ellipse(px, py, a, b, r); });
  };
  // Dolly's parrot pal: a scarlet macaw, drawn around its feet at (0,0), facing right
  const rfParrot = (x, y, s = 1, { dir = 1, flap = 0, talk = 0, rot = 0 } = {}) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * dir, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const tailA = P2('M-8,-34 C-18,-6 -30,24 -38,46 C-32,51 -26,51 -22,47 C-15,22 -4,-4 6,-28 Z');
    const tailB = P2('M0,-32 C-6,-4 -12,26 -14,52 C-8,55 -3,54 0,50 C2,22 6,-4 12,-26 Z');
    const body = P2('M-4,-82 C-26,-74 -30,-40 -20,-14 C-12,4 10,4 18,-12 C28,-34 24,-64 14,-76 Z');
    const head = P2('M-6,-86 C-8,-108 14,-120 28,-110 C38,-102 38,-86 30,-76 C20,-66 0,-68 -6,-86 Z');
    const wing = P2('M0,0 C14,-4 24,14 20,36 C16,54 4,66 -10,76 C-18,52 -18,18 0,0 Z');
    const inWing = fn => { ctx.save(); ctx.translate(-8, -62); ctx.rotate(-flap * 1.1); fn(); ctx.restore(); };
    ctx.strokeStyle = OL; ctx.lineWidth = 4;
    for (const p of [tailA, tailB, body, head]) ctx.stroke(p);
    inWing(() => ctx.stroke(wing));
    ctx.fillStyle = '#3a7ef0'; ctx.fill(tailA); ctx.fillStyle = '#e83a46'; ctx.fill(tailB);
    ctx.fillStyle = shadeFill(-2, -46, 40, '#ff4d55'); ctx.fill(body);
    ctx.fillStyle = shadeFill(14, -100, 26, '#ff4d55'); ctx.fill(head);
    inWing(() => {
      ctx.fillStyle = '#3a7ef0'; ctx.fill(wing);
      ctx.save(); ctx.clip(wing);
      ctx.fillStyle = '#5adc7a'; ellipse(4, 26, 22, 12); ctx.fillStyle = '#ffd23a'; ellipse(4, 10, 22, 14);
      ctx.strokeStyle = 'rgba(20,40,120,.45)'; ctx.lineWidth = 1.5;
      for (const k of [-8, -1, 6]) { ctx.beginPath(); ctx.moveTo(k + 4, 36); ctx.lineTo(k - 6, 76); ctx.stroke(); }
      ctx.restore();
    });
    // white face patch, eye, blush and a hooked beak that opens when talking
    ctx.fillStyle = '#fff6f0'; ellipse(20, -92, 10, 9);
    ctx.strokeStyle = 'rgba(200,120,140,.6)'; ctx.lineWidth = 1; for (const k of [0, 3]) { ctx.beginPath(); ctx.moveTo(13, -89 + k); ctx.lineTo(22, -88 + k); ctx.stroke(); }
    ctx.fillStyle = OL; ellipse(20, -95, 3.6, 4.2); ctx.fillStyle = '#fff'; circle(18.8, -96.6, 1.4);
    ctx.save(); ctx.translate(29, -84); ctx.rotate(talk * 0.45);
    ink(P2('M-2,0 C6,0 10,4 10,8 C5,12 -1,10 -3,4 Z'), '#3d2c4a', 1.5);
    ctx.restore();
    ink(P2('M28,-100 C44,-104 50,-86 42,-72 C40,-78 36,-84 27,-84 Z'), '#f5ecd8', 1.8);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(36, -96, 4, 2, -0.3);
    // toes curling round the perch
    for (const fx of [-6, 8]) inkEllipse(fx, -1, 6, 4, 0, '#a89cb0', 1.3);
    ctx.restore();
  };
  const rfButterfly = (x, y, s, col) => {
    const f = 0.25 + Math.abs(Math.sin(S.t * 11 + x * 0.01)) * 0.75;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (const d of [-1, 1]) { ctx.save(); ctx.scale(d * f, 1); inkEllipse(9, -6, 10, 8, -0.5, col, 1.2); inkEllipse(7, 6, 7, 5.5, 0.5, mix(col, '#ffffff', 0.4), 1.2); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(11, -7, 2.4); ctx.restore(); }
    inkEllipse(0, 0, 2.2, 9, 0, OL, 0.4);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(-3, -14, -6, -15); ctx.moveTo(0, -8); ctx.quadraticCurveTo(3, -14, 6, -15); ctx.stroke();
    ctx.restore();
  };
  const RF_FALL = P2('M410,126 C406,200 404,300 396,372 L566,372 C558,300 554,200 550,126 Z');
  const RF_CLIFF = P2('M250,380 C260,250 300,150 360,118 L600,118 C660,150 700,250 712,380 Z');
  const RF_SHORE = x => 444 + Math.sin(x * 0.02) * 6;
  // static far layer (hills, jungle, the cliff), cached once in an offscreen canvas; the sky shows through
  const rfBack = () => sprite('rf_back_v2', W, H, 0, 0, () => {
    bdHills('#a6dcef', 268, 34, 0.006, 2);
    bdHills('#7fd08a', 300, 26, 0.009, 1);
    // puffy jungle canopy, outlined first then filled
    const can = [];
    for (let i = 0; i < 30; i++) can.push([i * 34 + hash(i) * 18 - 10, 304 + hash(i + 40) * 22, 22 + hash(i + 80) * 12]);
    for (let i = 0; i < 9; i++) can.push([330 + i * 38 + hash(i + 7) * 10, 112 + hash(i + 17) * 8, 18 + hash(i + 27) * 8]);
    ctx.strokeStyle = 'rgba(40,110,70,.75)'; ctx.lineWidth = 3;
    for (const [x, y, r] of can) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
    can.forEach(([x, y, r], i) => { ctx.fillStyle = i % 3 === 0 ? '#4cbc6a' : i % 3 === 1 ? '#5ccc78' : '#45b060'; circle(x, y, r); });
    ctx.fillStyle = 'rgba(220,255,190,.35)'; for (const [x, y, r] of can) ellipse(x - r * 0.3, y - r * 0.45, r * 0.35, r * 0.18, -0.3);
    bdHills('#3fae66', 338, 16, 0.014, 3);
    // the cliff: shaded rock with layers, bulging boulders, moss and ferns
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(RF_CLIFF);
    const cg = ctx.createLinearGradient(250, 0, 712, 0);
    cg.addColorStop(0, '#b3a6c0'); cg.addColorStop(0.45, '#958aa2'); cg.addColorStop(1, '#6c6082');
    ctx.fillStyle = cg; ctx.fill(RF_CLIFF);
    ctx.save(); ctx.clip(RF_CLIFF);
    for (let i = 0; i < 7; i++) {
      const y0 = 156 + i * 33;
      const row = d => { ctx.beginPath(); for (let x = 240; x <= 724; x += 22) ctx.lineTo(x, y0 + d + Math.sin(x * 0.045 + i * 1.7) * 6 + hash(x + i * 13) * 4); ctx.stroke(); };
      ctx.strokeStyle = 'rgba(60,40,90,.25)'; ctx.lineWidth = 3; row(0);
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2; row(4);
    }
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(270, 380); ctx.bezierCurveTo(280, 260, 320, 160, 360, 126); ctx.lineTo(384, 126); ctx.bezierCurveTo(342, 200, 322, 300, 322, 380); ctx.fill();
    const sh = ctx.createLinearGradient(0, 250, 0, 380); sh.addColorStop(0, 'rgba(40,20,70,0)'); sh.addColorStop(1, 'rgba(40,20,70,.32)');
    ctx.fillStyle = sh; ctx.fillRect(240, 250, 480, 140);
    ctx.fillStyle = 'rgba(30,25,80,.35)'; ellipse(480, 260, 100, 150);
    for (const [x, y, r] of [[300, 300, 22], [664, 262, 26], [642, 334, 20], [334, 206, 15], [628, 196, 14], [372, 340, 16]]) {
      inkEllipse(x, y, r, r * 0.66, 0, '#a093b0', 1.3);
      ctx.fillStyle = 'rgba(40,25,70,.22)'; ellipse(x + r * 0.15, y + r * 0.25, r * 0.85, r * 0.38);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(x - r * 0.4, y - r * 0.3, r * 0.3, r * 0.14, -0.3);
    }
    ctx.strokeStyle = 'rgba(50,30,80,.35)'; ctx.lineWidth = 2;
    for (const [x, y] of [[310, 250], [690, 300], [650, 170], [356, 290]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 14); ctx.lineTo(x + 2, y + 26); ctx.lineTo(x + 9, y + 38); ctx.stroke(); }
    for (const [x, y, rx] of [[318, 232, 26], [676, 240, 22], [298, 340, 24], [660, 358, 30], [612, 300, 16]]) { inkEllipse(x, y, rx, rx * 0.36, 0, '#56c470', 1.2); ctx.fillStyle = '#86e08a'; ellipse(x - rx * 0.2, y - rx * 0.12, rx * 0.5, rx * 0.12); }
    ctx.restore();
    rfFern(318, 230, 44, -2.6); rfFern(320, 232, 40, -0.3, '#3fae55'); rfFern(676, 238, 40, -0.4); rfFern(660, 356, 46, -2.7, '#3fae55'); rfFern(298, 338, 36, 0.2);
    // mossy lip at the top of the cliff, with a few tiny flowers
    ink(P2('M342,128 C378,98 582,98 618,128 C604,142 584,132 562,142 C522,130 440,132 400,142 C380,132 360,142 342,128 Z'), '#4fc86a', 2);
    ctx.fillStyle = 'rgba(210,255,170,.55)'; ellipse(420, 112, 50, 5); ellipse(560, 114, 30, 4);
    for (const [x, y, c] of [[360, 124, '#ff8fc8'], [392, 112, '#fff'], [578, 110, '#ffd23f'], [604, 124, '#ff8fc8']]) flower(x, y, 5, c, '#ffd84a', 1);
  });
  // static near layer: mossy boulders in the lagoon and the flowery sandy shore
  const rfFront = () => sprite('rf_front_v2', W, H, 0, 0, () => {
    rfFern(132, 392, 34, -2.4); rfFern(860, 400, 36, -0.6);
    rfMossRock(150, 406, 46, 20); rfMossRock(208, 414, 20, 10); rfMossRock(834, 416, 52, 22); rfMossRock(774, 422, 22, 10);
    rfMossRock(366, 380, 26, 12); rfMossRock(600, 382, 30, 13);
    // the sand: a wet dark rim, a sunny body and a sprinkle of grains
    const sp = new Path2D(); sp.moveTo(0, H); sp.lineTo(0, RF_SHORE(0));
    for (let x = 0; x <= W; x += 20) sp.lineTo(x, RF_SHORE(x));
    sp.lineTo(W, H); sp.closePath();
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(sp);
    const sg = ctx.createLinearGradient(0, 440, 0, H); sg.addColorStop(0, '#e6c88a'); sg.addColorStop(0.12, '#fbe7ae'); sg.addColorStop(1, '#f0d390');
    ctx.fillStyle = sg; ctx.fill(sp);
    ctx.fillStyle = 'rgba(190,140,80,.35)'; for (let i = 0; i < 70; i++) circle(hash(i + 600) * W, 458 + hash(i + 700) * 80, 1 + hash(i + 800) * 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; for (let i = 0; i < 30; i++) circle(hash(i + 900) * W, 462 + hash(i + 950) * 76, 1.2);
    // grassy tufts, tropical flowers with leaves, shells and a starfish
    ctx.strokeStyle = '#3fae55'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const x of [80, 190, 300, 420, 560, 680, 790, 900]) { const y = RF_SHORE(x) + 12; for (const d of [-8, -3, 2, 7]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + d, y - 10, x + d * 1.6, y - 16 - Math.abs(d)); ctx.stroke(); } }
    for (const [x, y, c, r] of [[30, GY + 26, '#ff4a6a', 18], [130, GY + 46, '#ff8fc8', 14], [360, GY + 50, '#ffa040', 13], [600, GY + 40, '#ff4a6a', 15], [860, GY + 52, '#ff8fc8', 16], [940, GY + 20, '#ffa040', 13]]) {
      const lv = [-1, 1].map(d => [x + d * 17, y + 10, 17, 6.5, d * 0.4]);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; for (const [lx, ly, a, b, r2] of lv) { ctx.beginPath(); ctx.ellipse(lx, ly, a, b, r2, 0, TAU); ctx.stroke(); }
      for (const [lx, ly, a, b, r2] of lv) { ctx.fillStyle = '#3fae55'; ellipse(lx, ly, a, b, r2); ctx.fillStyle = '#6fd47e'; ellipse(lx, ly - 2, a * 0.6, b * 0.3, r2); }
      hibiscus(x, y, r, c);
    }
    for (const [x, y, c] of [[70, GY + 58, '#fff'], [250, GY + 34, '#c6a2ff'], [470, GY + 30, '#ffd84a'], [520, GY + 60, '#fff'], [700, GY + 30, '#c6a2ff'], [790, GY + 60, '#ffd84a']]) flower(x, y, 7, c, '#ff9a3a', 1);
    shell(480, GY + 50, 10, 0.3, 2); shell(240, GY + 60, 8, -0.3, 2); shell(900, GY + 58, 9, 0.5, 2); vecStar(740, GY + 58, 10, '#ff8a5a', 1.5); vecStar(170, GY + 64, 8, '#ffb04a', 1.5);
  });
  const rfClouds = () => {
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 330 + S.t * 8) % (W + 300)) - 150, cy = 80 + (i % 3) * 36;
      const pf = [[cx, cy, 44, 20], [cx + 32, cy - 12, 34, 22], [cx - 34, cy + 2, 30, 15], [cx + 4, cy - 16, 26, 18]];
      ctx.strokeStyle = 'rgba(110,170,220,.55)'; ctx.lineWidth = 3;
      for (const [x, y, a, b] of pf) { ctx.beginPath(); ctx.ellipse(x, y, a, b, 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; for (const [x, y, a, b] of pf) ellipse(x, y, a, b);
      ctx.fillStyle = 'rgba(190,225,250,.6)'; ellipse(cx, cy + 10, 50, 7);
    }
  };
  // the falling water: a glassy sheet with three speeds of streaks, a rolling lip and side trickles
  const rfFalls = () => {
    const fg = ctx.createLinearGradient(400, 0, 560, 0);
    fg.addColorStop(0, '#74d0ff'); fg.addColorStop(0.2, '#c8f2ff'); fg.addColorStop(0.5, '#f4fdff'); fg.addColorStop(0.8, '#b6ecff'); fg.addColorStop(1, '#62c2f2');
    ink(RF_FALL, fg, 2);
    ctx.save(); ctx.clip(RF_FALL);
    const vg = ctx.createLinearGradient(0, 126, 0, 372);
    vg.addColorStop(0, 'rgba(40,140,220,.3)'); vg.addColorStop(0.3, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(255,255,255,.6)');
    ctx.fillStyle = vg; ctx.fillRect(390, 120, 180, 260);
    ctx.lineCap = 'round';
    for (const [n, sp, col, lw, len] of [[9, 120, 'rgba(60,150,225,.3)', 8, 80], [15, 210, 'rgba(255,255,255,.8)', 3.5, 46], [13, 320, 'rgba(255,255,255,.95)', 1.6, 26]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const h = hash(i * 7 + n), x = 402 + (i + h * 0.8) / n * 158, y = ((S.t * sp + h * 600) % 330) + 96, wob = Math.sin(S.t * 3 + i) * 1.5;
        ctx.moveTo(x + wob, y); ctx.lineTo(x + wob - (x - 480) * 0.03, y + len * (1 + h));
      }
      ctx.stroke();
    }
    ctx.restore();
    // thin side trickles down the rock ledges
    ctx.save(); ctx.lineCap = 'round';
    for (const [x0, y0, y1] of [[348, 190, 300], [626, 212, 330]]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 4, (y0 + y1) / 2, x0 - 2, y1); ctx.stroke();
      ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -S.t * 90; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(x0 - 2, y1 + 2, 9, 4);
    }
    ctx.restore();
  };
  // the river rolling over the lip of the cliff: a glassy band topped with bubbling foam scallops (drawn over the rainbow)
  const rfLip = () => {
    const band = P2('M404,122 C440,114 520,114 556,122 L558,140 C520,148 440,148 402,140 Z');
    const sc = [];
    for (let i = 0; i < 9; i++) sc.push([410 + i * 17.5, 124 + Math.sin(S.t * 5 + i * 1.7) * 2, 9 + (i % 2) * 2 + Math.sin(S.t * 4 + i) * 1]);
    ctx.strokeStyle = OL; ctx.lineWidth = 3.6; ctx.stroke(band);
    for (const [x, y, r] of sc) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
    const bg = ctx.createLinearGradient(0, 116, 0, 146); bg.addColorStop(0, '#9ce6ff'); bg.addColorStop(1, '#e8fbff');
    ctx.fillStyle = bg; ctx.fill(band);
    ctx.fillStyle = '#ffffff'; for (const [x, y, r] of sc) circle(x, y, r);
    ctx.fillStyle = 'rgba(150,215,250,.6)'; for (const [x, y, r] of sc) ellipse(x + 1, y + r * 0.45, r * 0.65, r * 0.25);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(420, 138); ctx.quadraticCurveTo(480, 144, 540, 138); ctx.stroke();
  };
  const rfVines = () => {
    for (const [x, l] of [[372, 90], [598, 120], [624, 70]]) {
      const sw = Math.sin(S.t + x) * 8;
      ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 132); ctx.quadraticCurveTo(x + sw, 132 + l / 2, x - 4 + sw * 0.5, 132 + l); ctx.stroke();
      ctx.strokeStyle = '#3fae55'; ctx.lineWidth = 3; ctx.stroke();
      for (let k = 18; k < l; k += 18) { const s = (k / 18) % 2 ? 1 : -1; inkEllipse(x + sw * (k / l) + s * 6, 132 + k, 7, 3.4, s * 0.5, s > 0 ? '#5adc7a' : '#46c46a', 1); }
      flower(x - 4 + sw * 0.5, 134 + l, 5, '#ff8fc8', '#ffd84a', 1);
    }
  };
  const rfRainbow = (a = 0.55) => {
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(480, 410, 318, Math.PI * 1.06, Math.PI * 1.94); ctx.stroke();
    ctx.globalAlpha = a + Math.sin(S.t * 1.2) * 0.07;
    RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 11.5; ctx.beginPath(); ctx.arc(480, 410, 306 - i * 11, Math.PI * 1.06, Math.PI * 1.94); ctx.stroke(); });
    ctx.globalAlpha = 1;
    for (let k = 0; k < 6; k++) {
      const ang = Math.PI * (1.1 + ((S.t * 0.05 + k / 6) % 1) * 0.8), r = 300 - hash(k) * 52, tw = Math.abs(Math.sin(S.t * 3 + k * 1.3));
      star(480 + Math.cos(ang) * r, 410 + Math.sin(ang) * r, 3 + tw * 6, `rgba(255,255,255,${0.35 + 0.65 * tw})`, 4);
    }
    ctx.restore();
  };
  const rfLagoon = () => {
    const sp = new Path2D(); sp.moveTo(0, 452); sp.lineTo(0, 372);
    for (let x = 0; x <= W; x += 20) sp.lineTo(x, 368 + Math.sin(x * 0.04 + S.t * 2) * 2.5);
    sp.lineTo(W, 452); sp.closePath();
    const lg = ctx.createLinearGradient(0, 364, 0, 452);
    lg.addColorStop(0, '#80f2f2'); lg.addColorStop(0.45, '#3cc2ea'); lg.addColorStop(1, '#2488d4');
    ctx.strokeStyle = 'rgba(40,110,170,.6)'; ctx.lineWidth = 3; ctx.stroke(sp);
    ctx.fillStyle = lg; ctx.fill(sp);
    ctx.save(); ctx.clip(sp);
    // the falls and rainbow reflected in the pool
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(480, 392, 104, 14); ellipse(480, 414, 64, 7);
    RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = 0.16; ctx.fillRect(196 + i * 8 + Math.sin(S.t * 2 + i) * 2, 376, 6, 40); ctx.fillRect(758 - i * 8 + Math.sin(S.t * 2 + i) * 2, 376, 6, 40); });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 12; i++) { const x = (i * 97 + S.t * 14) % W, y = 384 + (i * 23) % 56; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y); }
    ctx.stroke();
    for (const [x, y, ph] of [[300, 402, 0], [660, 394, 0.4], [480, 424, 0.7], [110, 434, 0.2], [860, 440, 0.55]]) {
      const k = (S.t * 0.45 + ph) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(x, y, 8 + k * 40, 2 + k * 8, 0, 0, TAU); ctx.stroke();
    }
    for (let i = 0; i < 16; i++) { const a = Math.sin(S.t * 2.5 + i * 1.7); if (a > 0.3) star(30 + hash(i + 300) * 900, 380 + hash(i + 340) * 58, 2 + a * 6, `rgba(255,255,255,${a})`, 4); }
    ctx.restore();
    pondLilyPad(266, 420 + Math.sin(S.t * 1.5) * 1.5, 18, '#ff9acb'); pondLilyPad(680, 400 + Math.sin(S.t * 1.5 + 1) * 1.5, 14, null); pondLilyPad(712, 432 + Math.sin(S.t * 1.5 + 2) * 1.5, 20, '#fff');
  };
  // churning foam, rising mist and spray where the falls hit the lagoon
  const rfFoam = () => {
    const puffs = [];
    for (let i = 0; i < 11; i++) puffs.push([388 + i * 18.5, 372 + Math.sin(S.t * 6 + i * 1.3) * 3 - (i % 2) * 4, 12 + (i % 3) * 5 + Math.sin(S.t * 5 + i) * 2]);
    ctx.strokeStyle = 'rgba(60,130,200,.75)'; ctx.lineWidth = 3;
    for (const [x, y, r] of puffs) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; for (const [x, y, r] of puffs) circle(x, y, r);
    ctx.fillStyle = 'rgba(160,215,250,.55)'; for (const [x, y, r] of puffs) ellipse(x + 2, y + r * 0.5, r * 0.7, r * 0.28);
    for (let k = 0; k < 7; k++) { const p = (S.t * 0.22 + k / 7) % 1; glow(392 + hash(k) * 176, 372 - p * 130, 34 + p * 50, `rgba(255,255,255,${(0.5 * Math.sin(p * Math.PI)).toFixed(3)})`); }
    glow(200, 352, 70, 'rgba(255,255,255,.35)'); glow(760, 352, 70, 'rgba(255,255,255,.35)');
    for (let k = 0; k < 16; k++) {
      const p = (S.t * 0.9 + k / 16) % 1, side = k % 2 ? 1 : -1;
      const x = 480 + side * (40 + hash(k) * 60 + p * (60 + hash(k + 5) * 70)), y = 370 - Math.sin(p * Math.PI) * (30 + hash(k + 9) * 50);
      ctx.fillStyle = `rgba(255,255,255,${(0.9 * (1 - p)).toFixed(3)})`; circle(x, y, 2 + hash(k + 2) * 2.5);
    }
  };
  BACKDROPS.rainbowfalls_bg = () => {
    bdSky('#3ec0ff', '#e2fbff');
    bdSunburst(820, 100);
    rfClouds();
    blit(rfBack(), 0, 0);
    rfFalls();
    rfVines();
    rfRainbow();
    rfLip();
    rfLagoon();
    blit(rfFront(), 0, 0);
    rfFoam();
    // the lacy edge of the water lapping at the sand
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath();
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, RF_SHORE(x) - 1 + Math.sin(S.t * 2 + x * 0.05) * 1.6); ctx.stroke();
    // palms with macaws, a macaw flying over and butterflies
    palm(60, GY + 20, 300, 50); palm(905, GY + 24, 320, -60);
    rfParrot(150, 214 + Math.sin(S.t * 1.4) * 1.5, 0.42, { dir: 1, talk: Math.max(0, Math.sin(S.t * 3)) * 0.6 });
    rfParrot(806, 202 + Math.sin(S.t * 1.4 + 1) * 1.5, 0.46, { dir: -1 });
    const px = 200 + ((S.t * 60) % (W + 200)) - 100;
    rfParrot(px, 120 + Math.sin(S.t * 3) * 12, 0.3, { dir: 1, rot: 1.15, flap: 0.5 + Math.sin(S.t * 14) * 0.5 });
    rfButterfly(300 + Math.sin(S.t * 0.8) * 80, 300 + Math.sin(S.t * 2.2) * 20, 1, '#ff8fc8');
    rfButterfly(700 + Math.sin(S.t * 0.6 + 2) * 60, 330 + Math.sin(S.t * 1.9) * 16, 0.85, '#ffd23f');
  };

  // ---- Dolphin Hoops: leap out of the water through rainbow hoops; hold to jump higher ------------
  const DH = { WY: 396, DX: 230 };
  function drawDolphin(x, y, rot, s = 1) {
    // Dolly: a chubby, smiley dolphin with a big sparkly eye and a hibiscus behind her blowhole
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fluke = P2('M-46,2 C-58,-2 -68,-16 -84,-20 C-78,-6 -78,8 -84,22 C-68,20 -58,8 -46,2 Z');
    const fin = P2('M-14,-22 C-10,-42 4,-50 16,-48 C8,-40 10,-30 12,-22 Z');
    const body = P2('M-54,2 C-46,-20 -12,-32 20,-30 C42,-28 56,-18 62,-8 C70,-8 80,-6 86,0 C82,7 72,9 62,9 C46,22 8,26 -22,17 C-38,12 -48,8 -54,2 Z');
    const flip = P2('M8,12 C2,24 -10,32 -24,32 C-16,24 -9,16 -5,9 Z');
    // outline fluke, fin and body together first, then fill, so she reads as one smooth shape
    ctx.strokeStyle = OL; ctx.lineWidth = 4;
    for (const p of [fluke, fin, body]) ctx.stroke(p);
    const dk = '#4a8cd6';
    ctx.fillStyle = dk; ctx.fill(fluke); ctx.fill(fin);
    const bg = ctx.createLinearGradient(0, -32, 0, 24);
    bg.addColorStop(0, '#5aa2ea'); bg.addColorStop(0.55, '#88c6f6'); bg.addColorStop(1, '#a8dafa');
    ctx.fillStyle = bg; ctx.fill(body);
    ctx.save(); ctx.clip(body);
    ctx.fillStyle = '#f0f9ff'; ellipse(18, 23, 64, 15);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(6, -21, 34, 4.5, -0.05);
    ctx.fillStyle = 'rgba(30,60,150,.16)'; ellipse(-46, 2, 16, 30);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(4, -40, 5, 2, -0.7); ellipse(-70, -12, 5, 2, 0.6);
    ink(flip, dk, 2);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-4, 20, 6, 2, -0.6);
    // a big sparkly eye with lashes, a happy smile and rosy cheeks
    ctx.fillStyle = OL; ellipse(40, -10, 6.2, 7.6);
    ctx.fillStyle = '#fff'; circle(38, -13, 2.5); circle(42.6, -6.6, 1.3);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(44, -15); ctx.lineTo(48.5, -19.5); ctx.moveTo(40.5, -17.5); ctx.lineTo(42, -22.5); ctx.moveTo(36.5, -17); ctx.lineTo(36, -21.5); ctx.stroke();
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(61, 2); ctx.quadraticCurveTo(72, 8, 84, 1.5); ctx.stroke();
    ctx.fillStyle = 'rgba(255,110,150,.55)'; ellipse(51, 4, 6, 3.4);
    ctx.strokeStyle = 'rgba(40,60,130,.6)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(12, -27, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    hibiscus(26, -29, 9, '#ff6fae');
    ctx.restore();
  }
  // Dolly with Aubrey riding on her back, just behind the fin, tilting with every leap
  const dolphinRider = (x, y, rot) => {
    drawDolphin(x, y, rot, 1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    // each hero's crouch photo is shot at its own size, so match her head to her standing photo's (heroHead)
    drawAubrey(RIDE[0], RIDE[1], 'crouch', 1, 0, RIDE[2] * 1.1 * heroHead('idle_front').r / heroHead('crouch').r);
    ctx.restore();
  };
  const RIDE = [-28, -22, 0.3]; // seat on Dolly's back (dolphin-local x, y) and Aubrey's scale
  const hoopRing = (x, y, half) => {
    // half: -1 back half (right side), 1 front half (left side)
    const a0 = half < 0 ? -Math.PI / 2 : Math.PI / 2, a1 = a0 + Math.PI;
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 25; ctx.beginPath(); ctx.ellipse(x, y, 22, 54, 0, a0, a1); ctx.stroke();
    RAINBOW.forEach((c, i) => { ctx.strokeStyle = half < 0 ? mix(c, '#3a2a60', 0.18) : c; ctx.lineWidth = 3.8; ctx.beginPath(); ctx.ellipse(x, y, 22 + 9 - i * 3.6, 54 + 9 - i * 3.6, 0, a0, a1); ctx.stroke(); });
    if (half > 0) {
      // a glossy shine on the front of the hoop
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(x, y, 29, 61, 0, Math.PI * 1.08, Math.PI * 1.36); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, 29, 61, 0, Math.PI * 0.72, Math.PI * 0.8); ctx.stroke();
    }
  };
  const drop = (x, y, r, k) => {
    glow(x, y, r * 2.4, 'rgba(255,255,255,.75)');
    const col = RAINBOW[k % 6], dg = ctx.createLinearGradient(x, y - r * 1.3, x, y + r);
    dg.addColorStop(0, mix(col, '#ffffff', 0.55)); dg.addColorStop(1, col);
    ink(P2(`M${x},${y - r * 1.3} C${x + r},${y - r * 0.2} ${x + r},${y + r} ${x},${y + r} C${x - r},${y + r} ${x - r},${y - r * 0.2} ${x},${y - r * 1.3} Z`), dg, 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(x - r * 0.32, y, r * 0.2, r * 0.36);
    const tw = Math.abs(Math.sin(S.t * 4 + k));
    star(x + r * 0.8, y - r * 0.9, 3 + tw * 4, `rgba(255,255,255,${0.5 + tw * 0.5})`, 4);
  };
  // juicy extras for Dolphin Hoops (visual only)
  const rfTrail = pts => {
    if (pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 5.5;
    RAINBOW.forEach((c, i) => {
      ctx.strokeStyle = c;
      for (let j = 1; j < pts.length; j++) {
        // offset each band along the trail's normal so the ribbon keeps its width when it bends
        const a = pts[j - 1], b = pts[j], o = (i - 2.5) * 4.6 * Math.min(1, j / 6), len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const nx = -(b.y - a.y) / len * o, ny = (b.x - a.x) / len * o;
        ctx.globalAlpha = clamp(b.life / 0.6, 0, 1) * 0.85;
        ctx.beginPath(); ctx.moveTo(a.x + nx, a.y + ny); ctx.lineTo(b.x + nx, b.y + ny); ctx.stroke();
      }
    });
    ctx.restore();
  };
  const rfSplash = sp => {
    const k = sp.t / 0.9, x = sp.x, y = DH.WY + 2, big = sp.big ? 1.35 : 1;
    ctx.strokeStyle = `rgba(255,255,255,${(0.9 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 20 + k * 70 * big, 4 + k * 9, 0, 0, TAU); ctx.stroke();
    const h = Math.sin(Math.min(1, k * 1.6) * Math.PI) * 42 * big;
    if (h > 1) {
      // a tulip-shaped crown of water flaring out into five tips
      const cr = P2(`M${x - 20},${y} Q${x - 28},${y - h * 0.4} ${x - 36},${y - h} L${x - 25},${y - h * 0.5} L${x - 17},${y - h * 0.82} L${x - 8},${y - h * 0.48} L${x},${y - h * 1.1} L${x + 8},${y - h * 0.48} L${x + 17},${y - h * 0.82} L${x + 25},${y - h * 0.5} L${x + 36},${y - h} Q${x + 28},${y - h * 0.4} ${x + 20},${y} Z`);
      ctx.globalAlpha = 0.9; ink(cr, '#f2fcff', 1.4, 'rgba(50,120,190,.8)'); ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.12 + 0.76 * i / 8), v = 140 * big * (0.7 + hash(i + sp.seed) * 0.6), t = sp.t;
      const dx = -Math.cos(a) * v * t, dy = -Math.sin(a) * v * t + 420 * t * t;
      if (dy > 4) continue;
      inkCircle(x + dx, y + dy, 3.4 * (1 - k * 0.5), '#ffffff', 0.8, 'rgba(50,120,190,.8)');
    }
  };
  const rfRing = r => {
    const k = r.t / 0.8, rad = 18 + k * (r.big ? 110 : 60);
    ctx.strokeStyle = `rgba(255,250,210,${(0.9 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 4 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, TAU); ctx.stroke();
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + k * 1.5; star(r.x + Math.cos(a) * rad, r.y + Math.sin(a) * rad, (r.big ? 9 : 6) * (1 - k) + 2, RAINBOW[i % 6], 4); }
  };
  MG.dolphinhoops = {
    kind: 'action', title: () => 'Dolphin Hoops', icon: () => '🐬',
    how: () => "Click or press space to leap out of the water. Hold it down to jump higher! Fly through the rainbow hoops and catch the rainbow drops.",
    init(g) {
      const n = [7, 9, 10][g.tier - 1], heights = g.tier === 1 ? [310, 270, 230] : [320, 270, 220, 175];
      const hoops = [], drops = [];
      let x = W + 60;
      for (let i = 0; i < n; i++) {
        hoops.push({ x, y: pick(heights), done: false, ok: false, flash: 0 });
        const gap = rand(390, 440);
        // a rainbow drop or two between hoops: some skimming the water, some up high
        drops.push({ x: x + gap * 0.5, y: pick([DH.WY - 46, DH.WY - 90, 230]), got: false, k: i });
        x += gap;
      }
      Object.assign(g, { hoops, drops, v: [200, 215, 230][g.tier - 1], y: DH.WY + 14, vy: 0, air: false, holdT: 0, ok: 0, caught: 0, endT: 0 });
      Object.assign(g, { rfTrailPts: [], rfSplashes: [], rfRings: [], rfWasAir: false }); // visual-only effects
      g.say = 'Tap to jump, hold to jump higher! Swim through the hoops.';
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      const press = jumpPressed() || (pointer.clicked && pointer.y > 64);
      const hold = pointer.down || keys[' '] || keys.arrowup || keys.w;
      if (!g.air) {
        g.y = lerp(g.y, DH.WY + 14 + Math.sin(S.t * 3) * 3, Math.min(1, dt * 8));
        if (press) { g.air = true; g.vy = -560; g.holdT = 0; SFX.jump(); burst(DH.DX, DH.WY, 8, { kind: 'bubble', spread: 80, up: 60 }); }
      } else {
        const boosting = hold && g.holdT < 0.45 && g.vy < 0;
        if (boosting) g.holdT += dt; else g.holdT = 1;
        g.vy += (boosting ? 300 : 1500) * dt; g.y += g.vy * dt;
        if (g.y >= DH.WY + 10 && g.vy > 0) { g.air = false; g.vy = 0; SFX.scrub(); burst(DH.DX + 20, DH.WY, 14, { kind: 'bubble', spread: 110, up: 120 }); }
      }
      for (const h of g.hoops) {
        const was = h.x; h.x -= g.v * dt; h.flash = Math.max(0, h.flash - dt);
        if (!h.done && was > DH.DX && h.x <= DH.DX) {
          h.done = true; h.ok = Math.abs(g.y - h.y) < 42;
          if (h.ok) { g.ok++; h.flash = 0.8; SFX.hit(); burst(h.x, h.y, 18, { colors: RAINBOW }); floatText(h.x, h.y - 70, pick(['Swish!', 'Yay!', 'Wheee!']), '#fff6a8', false, 26); }
          else { SFX.miss(); floatText(h.x, h.y - 70, h.y < g.y ? 'Higher!' : 'Lower!', '#ffb0c4', false, 24); }
        }
      }
      for (const d of g.drops) {
        d.x -= g.v * dt;
        if (!d.got && Math.hypot(d.x - (DH.DX + 30), d.y - g.y) < 40) { d.got = true; g.caught++; SFX.sparkle(); burst(d.x, d.y, 10, { colors: RAINBOW }); }
      }
      if (g.hoops.every(h => h.done)) { g.endT += dt; if (g.endT > 1.2) g.done = true; }
      g.progress = `Hoops: ${g.ok} of ${g.hoops.length}  ·  💧 ${g.caught}`;
      g.score = 0.75 * g.ok / g.hoops.length + 0.25 * g.caught / g.drops.length;
      this.rfFx(g, dt);
    },
    // visual-only effects: a rainbow trail while airborne, splashes in and out, sparkle rings on hoops and drops
    rfFx(g, dt) {
      for (const p of g.rfTrailPts) { p.x -= g.v * dt; p.life -= dt; }
      if (g.air) {
        const rot = Math.atan2(g.vy, g.v * 2.2);
        g.rfTrailPts.push({ x: DH.DX - Math.cos(rot) * 56, y: g.y - Math.sin(rot) * 56, life: 0.6 });
        if (Math.random() < dt * 14) burst(DH.DX - Math.cos(rot) * 60, g.y - Math.sin(rot) * 60, 1, { colors: RAINBOW, spread: 30, up: 10, size: [3, 6] });
      }
      g.rfTrailPts = g.rfTrailPts.filter(p => p.life > 0);
      if (g.air !== g.rfWasAir) { g.rfSplashes.push({ x: DH.DX + (g.air ? -10 : 20), t: 0, big: !g.air, seed: randInt(0, 99) }); g.rfWasAir = g.air; }
      for (const s of g.rfSplashes) { s.t += dt; s.x -= g.v * dt; }
      g.rfSplashes = g.rfSplashes.filter(s => s.t < 0.9);
      for (const h of g.hoops) if (h.ok && !h.rfRung) { h.rfRung = true; g.rfRings.push({ x: h.x, y: h.y, t: 0, big: true }); }
      for (const d of g.drops) if (d.got && !d.rfRung) { d.rfRung = true; g.rfRings.push({ x: d.x, y: d.y, t: 0, big: false }); }
      for (const r of g.rfRings) { r.t += dt; r.x -= g.v * dt; }
      g.rfRings = g.rfRings.filter(r => r.t < 0.8);
    },
    draw(g) {
      // the lagoon fills the bottom of the screen for leaping
      const lg = ctx.createLinearGradient(0, DH.WY, 0, H);
      lg.addColorStop(0, 'rgba(96,228,240,.95)'); lg.addColorStop(0.45, 'rgba(44,160,222,.97)'); lg.addColorStop(1, 'rgba(26,96,190,.99)');
      const surfY = x => DH.WY + Math.sin(x * 0.03 + S.t * 3) * 4;
      const surface = () => { ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, surfY(x)); ctx.lineTo(W, H); ctx.closePath(); };
      const scroll = (g.t || 0) * g.v;
      const wrapX = (x, span) => ((x % span) + span) % span;
      for (const h of g.hoops) if (h.x > -60 && h.x < W + 60) hoopRing(h.x, h.y, -1);
      for (const d of g.drops) if (!d.got && d.x > -30 && d.x < W + 30) drop(d.x, d.y + Math.sin(S.t * 4 + d.k) * 4, 12, d.k);
      rfTrail(g.rfTrailPts || []);
      const rot = g.air ? Math.atan2(g.vy, g.v * 2.2) : Math.sin(S.t * 3) * 0.06;
      if (!g.air) { ctx.save(); surface(); ctx.clip(); }
      dolphinRider(DH.DX, g.y, rot);
      if (!g.air) ctx.restore();
      ctx.save(); ctx.globalAlpha = g.air ? 1 : 0.75; surface(); ctx.fillStyle = lg; ctx.fill(); ctx.restore();
      // under the water: sunbeams, rippling light, a sandy floor with swaying seaweed and coral, rising bubbles
      ctx.save(); surface(); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      for (let i = 0; i < 4; i++) { const x = wrapX(i * 260 - scroll * 0.2, W + 260) - 130; ctx.beginPath(); ctx.moveTo(x, DH.WY); ctx.lineTo(x + 60, DH.WY); ctx.lineTo(x + 130, H); ctx.lineTo(x + 30, H); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 5;
      for (let j = 0; j < 3; j++) { ctx.beginPath(); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, DH.WY + 34 + j * 26 + Math.sin(x * 0.045 + S.t * 2 + j * 2) * 5); ctx.stroke(); }
      ctx.fillStyle = '#f2d898'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 520 + Math.sin((x + scroll * 0.6) * 0.02) * 6); ctx.lineTo(W, H); ctx.fill();
      ctx.strokeStyle = 'rgba(91,63,115,.45)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 520 + Math.sin((x + scroll * 0.6) * 0.02) * 6); ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const x = wrapX(i * 170 + hash(i) * 60 - scroll * 0.6, W + 160) - 80, base = 528;
        if (i % 3 === 2) {
          // a little pink coral
          ctx.lineCap = 'round';
          for (const [w, c] of [[11, OL], [6, '#ff8fb0']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - 26); ctx.moveTo(x, base - 12); ctx.quadraticCurveTo(x - 14, base - 16, x - 14, base - 30); ctx.moveTo(x, base - 18); ctx.quadraticCurveTo(x + 14, base - 22, x + 12, base - 36); ctx.stroke(); }
        } else {
          for (const [k, c] of [[0, '#3fae55'], [12, '#56cc6c']]) {
            const sx = x + k, sw = Math.sin(S.t * 1.8 + i + k) * 8;
            ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(sx, base); ctx.bezierCurveTo(sx - 8, base - 22, sx + 8 + sw * 0.5, base - 38, sx + sw, base - 56 - (i % 2) * 14); ctx.stroke();
            ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.stroke();
          }
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) { const p = (S.t * 0.35 + hash(i + 20)) % 1, x = wrapX(hash(i) * W - scroll * 0.4 + Math.sin(S.t * 2 + i) * 6, W), y = H - p * (H - DH.WY - 10); ctx.beginPath(); ctx.arc(x, y, 2 + hash(i + 3) * 3, 0, TAU); ctx.stroke(); }
      ctx.restore();
      if (!g.air) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, DH.WY - 2); ctx.clip(); dolphinRider(DH.DX, g.y, rot); ctx.restore(); }
      // a frothy white edge along the surface, with ripples drifting by
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(40,110,170,.55)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, surfY(x)); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) { const x = (i * 89 - S.t * g.v * 0.5) % (W + 40); const xx = x < -40 ? x + W + 40 : x, y = DH.WY + 24 + (i * 29) % 100; ctx.beginPath(); ctx.moveTo(xx, y); ctx.quadraticCurveTo(xx + 14, y - 4, xx + 28, y); ctx.stroke(); }
      for (let i = 0; i < 9; i++) { const a = Math.sin(S.t * 3 + i * 2.1); if (a > 0.4) star(wrapX(hash(i + 60) * W - scroll * 0.5, W), DH.WY + 8 + hash(i + 70) * 20, 2 + a * 5, `rgba(255,255,255,${a})`, 4); }
      // each hoop's rainbow shimmer reflected on the water
      for (const h of g.hoops) if (h.x > -60 && h.x < W + 60) RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = 0.3; ctx.fillRect(h.x - 18 + Math.sin(S.t * 4 + i) * 3, DH.WY + 8 + i * 3, 36, 2); });
      ctx.globalAlpha = 1;
      for (const s of g.rfSplashes || []) rfSplash(s);
      for (const h of g.hoops) if (h.x > -60 && h.x < W + 60) {
        hoopRing(h.x, h.y, 1);
        for (let j = 0; j < 3; j++) { const a = S.t * 2 + j * 2.1 + h.y, tw = Math.abs(Math.sin(S.t * 4 + j)); star(h.x + Math.cos(a) * 34, h.y + Math.sin(a) * 66, 3 + tw * 4, `rgba(255,255,255,${0.5 + tw * 0.5})`, 4); }
        if (h.flash) { ctx.globalAlpha = h.flash; glow(h.x, h.y, 90, 'rgba(255,250,200,.9)'); ctx.globalAlpha = 1; }
      }
      for (const r of g.rfRings || []) rfRing(r);
      // a rainbow power meter while holding
      if (g.air && g.holdT < 1) {
        const bx = DH.DX - 44, by = g.y - 76, v = clamp(g.holdT / 0.45, 0, 1);
        rrect(bx - 3, by - 3, 94, 16, 8, 'rgba(48,24,72,.75)');
        const rg = ctx.createLinearGradient(bx, 0, bx + 88, 0); RAINBOW.forEach((c, i) => rg.addColorStop(i / 5, c));
        rrect(bx, by, Math.max(10, 88 * v), 10, 5, rg);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(bx + 4, by + 2, Math.max(0, 88 * v - 8), 2);
      }
      if (g.t < 5) outlined('Tap = little jump   ·   Hold = BIG jump', W / 2, 92, 22, '#ffffff', 'center');
    },
  };

  // ---- Clap the Syllables: the parrot says a word, Aubrey claps out its beats ----------------------
  const SYL_WORDS = [
    ['🐱', 'cat'], ['🐶', 'dog'], ['☀️', 'sun'], ['🐟', 'fish'], ['🐸', 'frog'], ['⭐', 'star'], ['🎂', 'cake'], ['🌳', 'tree'],
    ['🍎', 'ap-ple'], ['🐵', 'mon-key'], ['🐰', 'rab-bit'], ['🍕', 'piz-za'], ['🌈', 'rain-bow'], ['🤖', 'ro-bot'], ['🐯', 'ti-ger'], ['🌸', 'flow-er'], ['🧁', 'cup-cake'], ['🐼', 'pan-da'],
    ['🦋', 'but-ter-fly'], ['🍌', 'ba-na-na'], ['🐘', 'el-e-phant'], ['🦕', 'di-no-saur'], ['🦘', 'kan-ga-roo'], ['🦄', 'u-ni-corn'], ['🐙', 'oc-to-pus'], ['🍅', 'to-ma-to'],
    ['🍉', 'wa-ter-mel-on'], ['🐛', 'cat-er-pil-lar'], ['🐊', 'al-li-ga-tor'], ['🚁', 'hel-i-cop-ter'], ['🥑', 'av-o-ca-do'],
  ];
  const sylCount = w => w.split('-').length;
  MG.syllableclap = {
    kind: 'learn', title: () => 'Clap the Syllables', icon: () => '👏',
    how: () => 'The parrot says a word. Clap along to count its beats, like but-ter-fly: 3 claps! Then tap the number of claps.',
    init(g) {
      const max = g.tier === 1 ? 3 : 4, n = [5, 6, 7][g.tier - 1];
      // a mix of beat counts so every number comes up
      const by = k => shuffle(SYL_WORDS.filter(w => sylCount(w[1]) === k));
      const pool = []; for (let k = 1; k <= max; k++) pool.push(...by(k).slice(0, 3));
      Object.assign(g, { max, rounds: n, round: 0, total: 0, shake: {}, words: shuffle(pool).slice(0, n), claps: 0, clapT: 0, talkT: 0 });
      this.next(g);
    },
    start(g) { this.say(g); },
    say(g) { speak(g.say); g.talkT = 1.2; },
    next(g) {
      const [pic, w] = g.words[g.round];
      Object.assign(g, { pic, w, word: w.replace(/-/g, ''), n: sylCount(w), tried: [], state: 'pick', claps: 0, beat: -1 });
      g.say = `${g.word}! How many claps in ${g.word}?`;
      if (g.phase === 'play') this.say(g);
    },
    clap(g) { noise(0.07, 0.18); tone(300, 0.05, 'triangle', 0.05); g.clapT = 0.25; if (g.state === 'pick') burst(140, 372, 7, { colors: RAINBOW, spread: 110, up: 90, size: [4, 7] }); },
    update(g, dt, id) {
      tickShake(g, dt); g.clapT = Math.max(0, g.clapT - dt); g.talkT = Math.max(0, g.talkT - dt);
      if (id === 'say') return;
      if (g.state === 'pick') {
        if (id === 'clap' || pressed[' ']) { g.claps = Math.min(6, g.claps + 1); this.clap(g); }
        if (id === 'again') this.say(g);
        const k = numKey(g.max), i = id?.startsWith('syl:') ? +id.slice(4) : k;
        if (i >= 0 && !g.tried.includes(i)) {
          g.tried.push(i);
          if (i + 1 === g.n) {
            g.total += [1, 0.5, 0.2, 0][g.tried.length - 1]; g.state = 'yay'; g.t2 = 1 + g.n * 0.55 + 1; g.beat = 0; g.beatT = 0.6;
            SFX.hit(); burst(this.numX(g, i) + 60, 400, 20);
            speak(`Yes! ${g.w.split('-').join(', ')}. ${NUM_WORDS[g.n]} ${g.n === 1 ? 'clap' : 'claps'}!`);
          } else {
            g.shake[i] = 0.4; SFX.miss(); g.claps = 0;
            speak(`Not ${NUM_WORDS[i + 1]}. Listen and clap along: ${g.word}!`); g.talkT = 1.2;
          }
        }
      } else {
        // after a right answer the word is clapped out beat by beat
        if ((g.beatT -= dt) <= 0 && g.beat < g.n) { g.beat++; if (g.beat <= g.n) this.clap(g); g.beatT = 0.55; }
        if ((g.t2 -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      }
      g.progress = `Word ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    numX(g, i) { const w = 130, gap = 18; return 590 - (g.max * w + (g.max - 1) * gap) / 2 + 60 + i * (w + gap); },
    draw(g) {
      // a soft wash that deepens toward the bottom, so the cards pop and the falls still sparkle above
      const wash = ctx.createLinearGradient(0, 0, 0, H);
      wash.addColorStop(0, 'rgba(20,60,100,.12)'); wash.addColorStop(0.55, 'rgba(20,55,100,.3)'); wash.addColorStop(1, 'rgba(20,40,90,.5)');
      ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
      // parrot feathers drifting down
      for (let i = 0; i < 4; i++) {
        const p = (S.t * 0.06 + i / 4) % 1, fx = 40 + hash(i + 11) * 220 + Math.sin(S.t * 1.3 + i * 2) * 26, fy = 70 + p * 240;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.sin(S.t * 1.3 + i * 2) * 0.6 + 0.4); ctx.globalAlpha = Math.min(1, Math.sin(p * Math.PI) * 2);
        ink(P2('M0,-14 C7,-8 7,8 0,14 C-7,8 -7,-8 0,-14 Z'), RAINBOW[(i * 2) % 6], 1.2);
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 18); ctx.stroke();
        ctx.restore();
      }
      // the parrot on a mossy branch wrapped in a flowering vine
      const br = () => { ctx.beginPath(); ctx.moveTo(10, 300); ctx.quadraticCurveTo(120, 280, 230, 300); };
      ctx.lineCap = 'round'; br();
      ctx.strokeStyle = OL; ctx.lineWidth = 20; ctx.stroke();
      ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 14; ctx.stroke();
      ctx.save(); ctx.translate(0, -3); br(); ctx.strokeStyle = '#c99060'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
      ctx.strokeStyle = '#3fae55'; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = 14; x <= 226; x += 6) { const t = (x - 10) / 220, by = (1 - t) * (1 - t) * 300 + 2 * (1 - t) * t * 280 + t * t * 300; ctx.lineTo(x, by + Math.sin(x * 0.12) * 7); }
      ctx.stroke();
      const lv = [[34, 286, -0.6], [58, 302, 0.5], [178, 304, 0.4], [204, 290, -0.5], [222, 306, 0.6]];
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6; for (const [x, y, r] of lv) { ctx.beginPath(); ctx.ellipse(x, y, 16, 7, r, 0, TAU); ctx.stroke(); }
      for (const [x, y, r] of lv) { ctx.fillStyle = '#4fc86a'; ellipse(x, y, 16, 7, r); ctx.fillStyle = '#86e08a'; ellipse(x - 2, y - 2, 9, 2.5, r); }
      hibiscus(26, 296, 12, '#ff5f7e'); hibiscus(214, 298, 10, '#ffa040');
      const hop = g.talkT > 0 ? Math.abs(Math.sin(S.t * 14)) * 10 : g.clapT > 0 ? 6 : 0;
      rfParrot(126, 286 - hop, 1.25, { dir: 1, flap: g.clapT > 0 ? Math.sin(g.clapT / 0.25 * Math.PI) : Math.max(0, Math.sin(S.t * 1.7)) * 0.12, talk: g.talkT > 0 ? Math.abs(Math.sin(S.t * 14)) : 0 });
      // speech bubble: the picture under a little rainbow, the word, and its beats once it's solved
      panel(270, 72, 640, 214, 26);
      ink(P2('M282,190 L240,220 L290,214 Z'), '#fff8fc', 1.5);
      ctx.save(); ctx.beginPath(); ctx.roundRect(272, 74, 636, 210, 24); ctx.clip();
      glow(370, 176, 95, 'rgba(255,226,140,.6)');
      ctx.lineCap = 'butt'; ctx.globalAlpha = 0.55;
      RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(370, 250, 112 - i * 7, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); });
      ctx.globalAlpha = 1;
      for (const [x, y] of [[296, 98], [452, 96], [884, 100], [884, 260], [300, 262]]) { const tw = Math.abs(Math.sin(S.t * 2.5 + x)); star(x, y, 4 + tw * 5, `rgba(255,190,90,${0.35 + tw * 0.6})`, 4); }
      ctx.restore();
      emoji(g.pic, 370, 180 + Math.sin(S.t * 2) * 3, 120);
      if (g.state === 'yay') {
        const parts = g.w.split('-'), cw = 380 / parts.length;
        parts.forEach((p, i) => {
          const on = i < g.beat, x = 470 + cw * (i + 0.5), pop = i === g.beat - 1 && g.clapT > 0;
          if (on) { rrect(x - cw * 0.46, 120 - (pop ? 8 : 0), cw * 0.92, 60, 26, mix(RAINBOW[i % 6], '#ffffff', 0.6), mix(RAINBOW[i % 6], '#5a2a6e', 0.15), 3); if (pop) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + S.t * 3; star(x + Math.cos(a) * cw * 0.45, 150 + Math.sin(a) * 34, 6, RAINBOW[(i + k) % 6], 4); } }
          outlined(p, x, 150 - (pop ? 8 : 0), 40, on ? '#ff6fb5' : '#c9b8d8', 'center', '#fff');
          emoji('👏', x, 220, on ? 40 : 28);
        });
      } else {
        outlined(g.word, 660, 150, 52, '#ff6fb5', 'center', '#fff');
        text('How many claps?', 660, 214, 24, '#5a2a6e', 'center', 700);
      }
      // clap along, then pick the number of claps
      const pickOn = g.state === 'pick';
      button('clap', 40, 330, 200, 116, '', { color: '#ff9a3a', on: pickOn, key: 'C' });
      emoji('👏', 140, 372 + (g.clapT > 0 ? 4 : 0), g.clapT > 0 ? 54 : 46);
      text('Clap along!', 140, 424, 20, '#fff', 'center', 700);
      darkPanel(40, 456, 200, 40, 20);
      text(g.claps ? '👏'.repeat(g.claps) : 'Claps: 0', 140, 476, g.claps ? 18 : 16, '#fff', 'center', 700);
      button('again', 40, 500, 200, 34, 'Hear it again', { color: '#9a6ae0', on: pickOn, size: 15, icon: '🦜' });
      for (let i = 0; i < g.max; i++) {
        const x = this.numX(g, i) + shakeX(g, i), used = g.tried.includes(i) && i + 1 !== g.n, right = g.state === 'yay' && i + 1 === g.n;
        button(`syl:${i}`, x, 330, 130, 166, '', { color: right ? '#ffd23f' : used ? '#9a8aaa' : CARD_COLS[i], on: (pickOn && !used) || right, key: String(i + 1) });
        outlined(String(i + 1), x + 65, 388, 64, '#fff', 'center', 'rgba(60,20,80,.6)');
        for (let k = 0; k <= i; k++) emoji('👏', x + 65 - i * 14 + k * 28, 462, 22);
      }
    },
  };

  restage('rainbowfalls', {
    bg: 'rainbowfalls_bg',
    games: [['dolphinhoops', 'rainbow', {}], ['syllableclap', 'feather', {}]],
    intro: [
      '*:A waterfall tumbles into a sparkly lagoon, and a rainbow shines right through the spray.',
      'N:Eee-eee! Leap through my rainbow hoops with me! Tap for a little jump, and hold for a GREAT big one!',
      'A:laughing:I love dolphins! Wheee!',
    ],
    mid: ['N:Eee! The parrots love to say long words. Can you clap out the beats in each word?', 'A:excited:Clap, clap, clap! Like but-ter-fly!'],
    outro: ['N:Rainbow drops and parrot feathers, just for you. Eee-eee!', 'A:happy:Thank you, Dolly! Splash you later!'],
  });

  // =============================================================================================
  // 5. COMET TAIL MEADOW
  // =============================================================================================
  // Cosmo's rocket standing upright, its base at (x, y)
  function drawFoxRocket(x, y, s, flame = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (flame > 0) {
      const f = flame * (1 + Math.sin(S.t * 30) * 0.15);
      ink(P2(`M-22,-6 C-20,${30 * f} -6,${60 * f} 0,${80 * f} C6,${60 * f} 20,${30 * f} 22,-6 Z`), '#ff8a2a', 1.5);
      ctx.fillStyle = '#ffe36b'; ctx.beginPath(); ctx.moveTo(-12, -4); ctx.quadraticCurveTo(0, 50 * f, 0, 50 * f); ctx.quadraticCurveTo(0, 50 * f, 12, -4); ctx.fill();
    }
    ink(P2('M-30,-60 L-62,-4 L-58,8 L-26,-14 Z'), '#ff6a3a', 2); ink(P2('M30,-60 L62,-4 L58,8 L26,-14 Z'), '#ff6a3a', 2);
    inkRect(-24, -16, 48, 14, '#8a8aa8', 2, 4);
    const body = P2('M-34,-16 C-40,-90 -30,-150 0,-196 C30,-150 40,-90 34,-16 Z');
    ink(body, '#f4f0ff', 2.5);
    ctx.save(); ctx.clip(body);
    ctx.fillStyle = '#ff8a3a'; ctx.fillRect(-50, -200, 100, 44); ctx.fillRect(-50, -46, 100, 12);
    ctx.fillStyle = 'rgba(120,110,170,.18)'; ctx.fillRect(14, -200, 30, 200);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-24, -150, 6, 110);
    ctx.restore();
    inkCircle(0, -104, 22, '#3a3a8a', 2.5);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -104, 20, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#5a7ae0'; ctx.fillRect(-22, -126, 44, 44);
    // a little fox face peeking out of the porthole
    ink(P2('M-12,-104 L-14,-124 L-3,-114 Z'), '#ff8a3a', 1); ink(P2('M12,-104 L14,-124 L3,-114 Z'), '#ff8a3a', 1);
    inkEllipse(0, -100, 14, 12, 0, '#ff8a3a', 1); ctx.fillStyle = '#fff'; ellipse(0, -94, 8, 6);
    ctx.fillStyle = OL; circle(-5, -102, 2); circle(5, -102, 2); circle(0, -96, 2);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-8, -114, 6, 4, -0.6);
    ctx.restore();
    ctx.strokeStyle = '#ffd04a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -104, 22, 0, Math.PI * 2); ctx.stroke();
    ink(P2('M-6,-64 L6,-64 L4,-30 L-4,-30 Z'), '#ff6a3a', 1.5);
    ctx.restore();
  }
  const glowGrass = (x, gy, h, ph) => {
    const sw = Math.sin(S.t * 1.6 + ph) * 6, a = 0.55 + 0.45 * Math.sin(S.t * 2 + ph * 3);
    ctx.strokeStyle = '#2a8a7a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x + sw * 0.4, gy - h * 0.5, x + sw, gy - h); ctx.stroke();
    ctx.fillStyle = `rgba(150,255,210,${a})`; circle(x + sw, gy - h, 2.5);
  };
  const glowMushroom = (x, gy, r, col) => {
    glow(x, gy - r, r * 3, col.replace(')', ',.35)').replace('rgb', 'rgba'));
    inkRect(x - r * 0.25, gy - r, r * 0.5, r, '#e8f0ff', 1, 3);
    ink(P2(`M${x - r},${gy - r * 0.9} C${x - r},${gy - r * 2} ${x + r},${gy - r * 2} ${x + r},${gy - r * 0.9} Z`), col, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x - r * 0.4, gy - r * 1.3, r * 0.15); circle(x + r * 0.3, gy - r * 1.5, r * 0.12);
  };
  BACKDROPS.comet_bg = () => {
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, '#0b0730'); sky.addColorStop(0.55, '#2c1a70'); sky.addColorStop(1, '#2a7a9a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    glow(300, 260, 260, 'rgba(255,120,220,.16)'); glow(780, 300, 220, 'rgba(100,255,220,.12)');
    twinkleStars(130, 11, 0, W, 64, 360, 0.15);
    // the giant comet streaking across the sky, its tail in three glowing ribbons
    const hx = 790 + Math.sin(S.t * 0.3) * 6, hy = 215 + Math.sin(S.t * 0.3) * 3;
    [['rgba(120,240,255,', 0, 46], ['rgba(255,140,230,', 30, 34], ['rgba(255,230,120,', -24, 26]].forEach(([c, off, wd]) => {
      const gr = ctx.createLinearGradient(hx, hy, 40, 160);
      gr.addColorStop(0, c + '.85)'); gr.addColorStop(1, c + '0)');
      ctx.fillStyle = gr; ctx.beginPath();
      ctx.moveTo(hx, hy - 10); ctx.quadraticCurveTo(420, 150 + off, 30, 150 + off + Math.sin(S.t + off) * 6);
      ctx.quadraticCurveTo(420, 190 + off + wd, hx, hy + 12); ctx.fill();
    });
    for (let k = 0; k < 14; k++) { const p = (S.t * 0.15 + hash(k)) % 1, x = hx - p * 700, y = hy - p * 50 + Math.sin(p * 10 + k) * 18 + (hash(k + 5) - 0.5) * 40; star(x, y, 5 * (1 - p) + 2, `rgba(255,255,240,${1 - p})`, 4); }
    glow(hx, hy, 90, 'rgba(220,255,255,.75)');
    inkCircle(hx, hy, 18, '#f4ffff', 1.5);
    ctx.fillStyle = 'rgba(160,240,255,.9)'; circle(hx - 4, hy - 4, 7);
    // little moon and a planet
    bdMoon(600, 100, '#120c3a'); drawPlanet(6, 150, 250, 12);
    // rolling night hills with glowing rims
    bdHills('#1e2a5a', 360, 30, 0.007, 1);
    ctx.strokeStyle = 'rgba(120,255,220,.25)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 360 - Math.sin(x * 0.007 + 1) * 30 - Math.sin(x * 0.007 * 2.3 + 1) * 12); ctx.stroke();
    bdHills('#1a4a5a', 400, 18, 0.012, 4);
    // Cosmo's rocket on its launch pad, puffing steam
    inkEllipse(480, GY - 2, 90, 14, 0, '#6a6a8a', 2);
    for (let k = 0; k < 3; k++) { const p = (S.t * 0.5 + k / 3) % 1; ctx.fillStyle = `rgba(230,240,255,${0.5 * (1 - p)})`; circle(440 + k * 40 + Math.sin(p * 5) * 10, GY - 10 - p * 50, 10 + p * 16); }
    drawFoxRocket(480, GY - 6, 1.05, 0);
    // the meadow: glowing grass, flowers and mushrooms
    ctx.fillStyle = '#163a4a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, GY - 30);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, GY - 30 + Math.sin(x * 0.015) * 8); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = 'rgba(120,255,200,.08)'; ellipse(480, GY + 20, 460, 40);
    for (let i = 0; i < 70; i++) glowGrass(hash(i + 600) * W, GY - 20 + hash(i + 610) * 80, 14 + hash(i + 620) * 18, i);
    glowMushroom(150, GY - 6, 16, 'rgb(255,120,220)'); glowMushroom(176, GY + 2, 10, 'rgb(120,220,255)');
    glowMushroom(820, GY - 4, 14, 'rgb(170,140,255)'); glowMushroom(610, GY + 30, 11, 'rgb(255,200,90)');
    for (const [x, y, c] of [[60, GY + 40, '#7fffd0'], [370, GY + 50, '#ff9ae0'], [560, GY + 60, '#9ad0ff'], [900, GY + 46, '#ffe36b'], [320, GY - 12, '#ff9ae0']]) {
      glow(x, y, 26, c + '66'); flower(x, y, 9, c, '#ffffff', 1.2);
    }
    // fireflies and stardust drifting down from the comet
    for (let i = 0; i < 12; i++) {
      const x = (hash(i + 700) * W + Math.sin(S.t * 0.7 + i) * 30), y = 300 + hash(i + 710) * 180 + Math.sin(S.t * 1.3 + i * 2) * 14;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(S.t * 3 + i); glow(x, y, 10, 'rgba(220,255,120,.9)'); ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 6; i++) { const p = (S.t * 0.12 + i / 6) % 1; star(100 + i * 150 + Math.sin(p * 8) * 20, 140 + p * 320, 4, `rgba(255,240,180,${1 - p})`, 4); }
  };

  // ---- Asteroid Dodge: fly Cosmo's rocket, zap or dodge asteroids, scoop up stardust -------------
  const rockPath = (r, seed) => { const p = new Path2D(); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, rr = r * (0.8 + hash(seed + k) * 0.3); p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } p.closePath(); return p; };
  // Aubrey rides on the rocket's nose, waving a star wand that fires the magic beams
  const AD_WAND = [20, -134]; // wand tip, relative to the rocket's base
  const adRider = g => {
    const s = 0.36, im = IMG.idle_front, h = im.height * s, waist = -66, feet = waist + h * 0.5;
    ctx.save(); ctx.beginPath(); ctx.rect(-60, feet - h - 6, 120, h * 0.5 + 8); ctx.clip();
    drawAubrey(0, feet, 'idle_front', 1, 0, s);
    ctx.restore();
    // her right arm up, holding the wand; it flicks when a beam goes
    // (from her right shoulder in the photo, in her sleeve or skin colour: heroArmLook in js/hero.js)
    const A = heroArmLook()[1], kick = g.cast > 0 ? -5 : 0, hx = 15, hy = -114 + kick;
    const sx = (A.sh[0] - im.width / 2) * s * 0.8, sy = waist - h * 0.5 + (A.sh[1] + 6) * s;
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = A.fore; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = A.upper; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo((sx + hx) / 2, (sy + hy) / 2); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(hx, hy + 4); ctx.lineTo(AD_WAND[0], AD_WAND[1] + kick + 6); ctx.stroke();
    ctx.strokeStyle = '#c87ad8'; ctx.lineWidth = 2.2; ctx.stroke();
    inkCircle(hx, hy, 3, A.hand, 1);
    if (g.cast > 0) glow(AD_WAND[0], AD_WAND[1] + kick, 22, 'rgba(255,180,240,.9)');
    star(AD_WAND[0], AD_WAND[1] + kick, 6.5, '#ffd23f', 5);
  };
  MG.asteroiddodge = {
    kind: 'action', title: () => 'Asteroid Dodge', icon: () => '☄️',
    how: () => 'Aubrey rides the rocket! Steer with the mouse or the arrow keys. {Her|His} magic wand zaps the asteroids by itself, and they burst into stars! Dodge the rocks and scoop up the sparkly stardust.',
    init(g) {
      Object.assign(g, { x: W / 2, rocks: [], zaps: [], dust: [], spawnT: 1, dustT: 0.5, zapT: 0, timeLeft: [35, 40, 40][g.tier - 1], booms: [], hits: 0, got: 0, made: 0, inv: 0, zapped: 0, facing: 0, stars: [] });
      for (let i = 0; i < 50; i++) g.stars.push({ x: rand(0, W), y: rand(60, H), v: rand(30, 120) });
      g.say = 'Dodge the rocks and grab the stardust!';
    },
    start(g) { speak(g.say); },
    addDust(g, x, y) { g.dust.push({ x, y, vy: rand(70, 110), ph: rand(0, 6) }); g.made++; },
    update(g, dt) {
      g.timeLeft -= dt; g.inv = Math.max(0, g.inv - dt);
      const before = g.x;
      if (goLeft()) g.x -= 420 * dt; if (goRight()) g.x += 420 * dt;
      if (pointerMoved(g) && !goLeft() && !goRight()) g.x = lerp(g.x, pointer.x, Math.min(1, dt * 10));
      g.x = clamp(g.x, 50, W - 50); g.facing = lerp(g.facing, clamp((g.x - before) / (dt * 600), -1, 1), Math.min(1, dt * 10));
      for (const s of g.stars) { s.y += s.v * dt; if (s.y > H) { s.y = 60; s.x = rand(0, W); } }
      // auto zapper
      // beams fly from Aubrey's wand
      if ((g.zapT -= dt) <= 0) { g.zapT = 0.34; g.cast = 0.15; g.zaps.push({ x: g.x + AD_WAND[0] + Math.sin(g.facing * 0.25) * 130, y: 486 + AD_WAND[1] }); tone(1568, 0.08, 'sine', 0.03, 0, 2093); }
      g.cast = Math.max(0, (g.cast || 0) - dt);
      for (const z of g.zaps) z.y -= 640 * dt;
      g.zaps = g.zaps.filter(z => z.y > 50 && !z.gone);
      // asteroids tumble down; big ones split when zapped
      if ((g.spawnT -= dt) <= 0 && g.timeLeft > 1.5) {
        g.spawnT = [1.2, 1.05, 0.95][g.tier - 1] * rand(0.7, 1.2);
        const r = rand(20, 38); g.rocks.push({ x: rand(60, W - 60), y: 40, r, vx: rand(-30, 30), vy: rand(110, 150) + g.tier * 20, rot: 0, spin: rand(-2, 2), seed: randInt(0, 99), hp: r > 30 ? 2 : 1 });
      }
      if ((g.dustT -= dt) <= 0 && g.timeLeft > 1) { g.dustT = rand(0.9, 1.4); this.addDust(g, rand(60, W - 60), 50); }
      for (const r of g.rocks) {
        r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.spin * dt;
        for (const z of g.zaps) if (!z.gone && Math.abs(z.x - r.x) < r.r && Math.abs(z.y - r.y) < r.r) {
          z.gone = true; r.hp--; SFX.pop();
          if (r.hp <= 0) {
            // the asteroid bursts into a shower of stars
            r.gone = true; g.zapped++; g.booms.push({ x: r.x, y: r.y, r: r.r, t: 0, spin: rand(0, 6) });
            burst(r.x, r.y, 22, { kind: 'star', colors: ['#fff6a8', '#ffd23f', '#ffffff', '#ffb3e0'] });
            [1319, 1568, 2093].forEach((f, i) => tone(f, 0.16, 'sine', 0.04, i * 0.05)); if (Math.random() < 0.6) this.addDust(g, r.x, r.y); }
          else { r.r *= 0.75; r.flash = 0.15; }
        }
        r.flash = Math.max(0, (r.flash || 0) - dt);
        if (!r.gone && g.inv <= 0 && Math.hypot(r.x - g.x, r.y - 450) < r.r + 26) {
          r.gone = true; g.hits++; g.inv = 1.3; SFX.fail(); burst(g.x, 450, 16, { colors: ['#ffb0b0', '#fff'] });
          floatText(g.x, 380, 'Bonk!', '#ffb0c4', false, 28);
        }
      }
      g.rocks = g.rocks.filter(r => !r.gone && r.y < H + 50);
      for (const bm of g.booms) bm.t += dt;
      g.booms = g.booms.filter(bm => bm.t < 0.7);
      for (const d of g.dust) {
        d.y += d.vy * dt;
        if (!d.got && Math.hypot(d.x - g.x, d.y - 440) < 44) { d.got = true; g.got++; SFX.sparkle(); floatText(d.x, d.y - 20, '+1', '#fff6a8', false, 22); }
      }
      g.dust = g.dust.filter(d => !d.got && d.y < H + 20);
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
      g.progress = `✨ ${g.got}   ·   Bonks: ${g.hits}`;
      g.score = 0.7 * Math.min(1, g.got / Math.max(6, g.made * 0.75)) + 0.3 * Math.max(0, 1 - g.hits / 6);
    },
    draw(g) {
      ctx.fillStyle = 'rgba(6,4,30,.84)'; ctx.fillRect(0, 0, W, H);
      for (const s of g.stars) { ctx.strokeStyle = `rgba(255,255,255,${s.v / 160})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - s.v * 0.08); ctx.stroke(); }
      for (const d of g.dust) { glow(d.x, d.y, 26, 'rgba(255,240,160,.8)'); star(d.x, d.y, 12 + Math.sin(S.t * 8 + d.ph) * 2, '#fff6a8', 4); star(d.x, d.y, 5, '#ffffff', 4); }
      for (const r of g.rocks) {
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
        ink(rockPath(r.r, r.seed), r.flash ? '#ffffff' : '#9a8aa8', 2);
        ctx.fillStyle = 'rgba(60,40,80,.35)'; circle(-r.r * 0.3, -r.r * 0.2, r.r * 0.22); circle(r.r * 0.3, r.r * 0.25, r.r * 0.16);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; circle(-r.r * 0.35, -r.r * 0.45, r.r * 0.12);
        ctx.restore();
      }
      // star explosions: a bright flash, then a ring of spinning stars flying out and fading
      for (const bm of g.booms) {
        const k = bm.t / 0.7, rad = bm.r * 0.6 + k * 70;
        if (k < 0.35) glow(bm.x, bm.y, bm.r * (1.6 + k * 4), 'rgba(255,245,180,.95)');
        ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 8; i++) { const a = bm.spin + i * Math.PI / 4 + k * 1.5; star(bm.x + Math.cos(a) * rad, bm.y + Math.sin(a) * rad, 9 * (1 - k * 0.5), i % 2 ? '#fff6a8' : '#ffd23f', 5); }
        star(bm.x, bm.y, bm.r * 0.8 * (1 - k), '#ffffff', 5);
        ctx.globalAlpha = 1;
      }
      // magic beams from Aubrey's wand: a glowing streak with a twinkling star at the front
      for (const z of g.zaps) {
        glow(z.x, z.y, 18, 'rgba(255,150,230,.8)');
        ctx.strokeStyle = '#ffb3f0'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(z.x, z.y + 22); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        star(z.x, z.y, 7 + Math.sin(S.t * 30 + z.y) * 1.5, '#fff6a8', 5);
      }
      ctx.save(); ctx.translate(g.x, 486); ctx.rotate(g.facing * 0.25);
      if (!(g.inv > 0 && Math.floor(S.t * 12) % 2)) { drawFoxRocket(0, 0, 0.42, 0.9); adRider(g); }
      if (g.inv > 0) { ctx.strokeStyle = `rgba(150,230,255,${g.inv / 1.3})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -40, 50, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    },
  };

  // ---- 3D Shapes: match solid shapes to things you can hold ------------------------------------------
  // hand-drawn things that have no emoji
  const trafficCone = (x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkRect(-40, 30, 80, 12, '#ff7a2a', 2, 3);
    const c = P2('M-8,-42 L8,-42 L32,32 L-32,32 Z'); ink(c, '#ff8a3a', 2);
    ctx.save(); ctx.clip(c); ctx.fillStyle = '#fff'; ctx.fillRect(-40, -14, 80, 10); ctx.fillRect(-40, 10, 80, 10); ctx.restore();
    ctx.restore();
  };
  const partyHat = (x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const c = P2('M0,-44 L32,34 C10,42 -10,42 -32,34 Z'); ink(c, '#b07aff', 2);
    ctx.save(); ctx.clip(c); ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 7; for (let k = -40; k < 40; k += 18) { ctx.beginPath(); ctx.moveTo(-40, k); ctx.lineTo(40, k + 30); ctx.stroke(); } ctx.restore();
    inkCircle(0, -46, 9, '#ff6fb5', 1.5);
    ctx.restore();
  };
  const egyptPyramid = (x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ink(P2('M-46,34 L0,-40 L14,34 Z'), '#ffd27a', 2); ink(P2('M14,34 L0,-40 L46,30 Z'), '#d8a04a', 2);
    ctx.strokeStyle = 'rgba(120,80,30,.35)'; ctx.lineWidth = 1.5;
    for (let k = 1; k < 5; k++) { const yy = -40 + k * 15; ctx.beginPath(); ctx.moveTo(-46 * k / 5 - 2, yy + 1); ctx.lineTo(14 * k / 5, yy + 1); ctx.lineTo(46 * k / 5, yy - 1); ctx.stroke(); }
    ctx.restore();
  };
  const SOLIDS = {
    sphere: { col: '#ff6fb5', things: [['⚽', 'a ball'], ['🍊', 'an orange'], ['🌍', 'a globe'], ['🔮', 'a crystal ball']] },
    cube: { col: '#40b0ff', things: [['🎲', 'a dice'], ['🧊', 'an ice cube'], ['🎁', 'a present']] },
    cone: { col: '#ffb43a', things: [['🍦', 'an ice-cream cone'], [trafficCone, 'a traffic cone'], [partyHat, 'a party hat']] },
    cylinder: { col: '#5adc7a', things: [['🥫', 'a can'], ['🥁', 'a drum'], ['🕯️', 'a candle']] },
    pyramid: { col: '#b07aff', things: [['⛺', 'a tent'], [egyptPyramid, 'a pyramid in the desert']] },
  };
  function drawSolid(kind, x, y, r, col = SOLIDS[kind].col) {
    const lt = mix(col, '#ffffff', 0.45), dk = mix(col, '#2a1050', 0.3);
    if (kind === 'sphere') {
      inkCircle(x, y, r, shadeFill(x, y, r, col), 2);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.15, -0.6);
    } else if (kind === 'cube') {
      const s = r * 0.8, d = r * 0.42;
      ink(P2(`M${x - s},${y - s + d} L${x - s + d},${y - s} L${x + s + d},${y - s} L${x + s},${y - s + d} Z`), lt, 2);
      ink(P2(`M${x + s},${y - s + d} L${x + s + d},${y - s} L${x + s + d},${y + s - d} L${x + s},${y + s} Z`), dk, 2);
      ink(P2(`M${x - s},${y - s + d} L${x + s},${y - s + d} L${x + s},${y + s} L${x - s},${y + s} Z`), col, 2);
    } else if (kind === 'cone') {
      const gr = ctx.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, lt); gr.addColorStop(0.6, col); gr.addColorStop(1, dk);
      ink(P2(`M${x},${y - r} L${x + r * 0.8},${y + r * 0.75} C${x + r * 0.5},${y + r * 1.05} ${x - r * 0.5},${y + r * 1.05} ${x - r * 0.8},${y + r * 0.75} Z`), gr, 2);
      ctx.strokeStyle = 'rgba(60,30,80,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y + r * 0.75, r * 0.8, r * 0.22, 0, Math.PI, 0); ctx.stroke();
    } else if (kind === 'cylinder') {
      const w = r * 0.7, h = r * 0.85, e = r * 0.25;
      const gr = ctx.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, lt); gr.addColorStop(0.6, col); gr.addColorStop(1, dk);
      ink(P2(`M${x - w},${y - h} L${x - w},${y + h} C${x - w},${y + h + e * 1.3} ${x + w},${y + h + e * 1.3} ${x + w},${y + h} L${x + w},${y - h} Z`), gr, 2);
      inkEllipse(x, y - h, w, e, 0, lt, 2);
    } else if (kind === 'pyramid') {
      ink(P2(`M${x - r * 0.95},${y + r * 0.7} L${x},${y - r} L${x + r * 0.25},${y + r * 0.9} Z`), lt, 2);
      ink(P2(`M${x + r * 0.25},${y + r * 0.9} L${x},${y - r} L${x + r * 0.95},${y + r * 0.6} Z`), dk, 2);
    }
  }
  const drawThing = (t, x, y, size) => (typeof t[0] === 'function' ? t[0](x, y, size / 100) : emoji(t[0], x, y, size));
  const solidName = k => k[0].toUpperCase() + k.slice(1);
  MG.solids3d = {
    kind: 'learn', title: () => '3D Shapes', icon: () => '🧊',
    how: () => 'Solid shapes are all around us! A ball is a sphere and a dice is a cube. Match each shape to a thing with the same shape.',
    init(g) {
      Object.assign(g, { round: 0, rounds: [5, 6, 7][g.tier - 1], cards: g.tier === 1 ? 3 : 4, total: 0, shake: {} });
      const kinds = Object.keys(SOLIDS); g.order = [...shuffle(kinds), ...shuffle(kinds)];
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const k = g.order[g.round], mode = g.round % 2 ? 'shape' : 'thing';
      const others = shuffle(Object.keys(SOLIDS).filter(o => o !== k)).slice(0, g.cards - 1);
      const thing = pick(SOLIDS[k].things);
      // 'thing' mode: shown a shape, pick the object; 'shape' mode: shown an object, pick its shape
      const choices = mode === 'thing' ? shuffle([[k, thing], ...others.map(o => [o, pick(SOLIDS[o].things)])]) : shuffle([k, ...others]).map(o => [o, null]);
      Object.assign(g, { k, mode, thing, choices, tried: [], state: 'pick' });
      g.say = mode === 'thing' ? `This is a ${k}. Which thing is shaped like a ${k}?` : `What shape is ${thing[1]}?`;
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      tickShake(g, dt);
      if (g.state === 'pick') {
        const k = numKey(g.cards), i = id?.startsWith('sd:') ? +id.slice(3) : k;
        if (i >= 0 && !g.tried.includes(i)) {
          g.tried.push(i);
          if (g.choices[i][0] === g.k) {
            g.total += [1, 0.5, 0.2, 0][g.tried.length - 1]; g.state = 'yay'; g.t2 = 2.3;
            SFX.hit(); burst(this.cardX(g, i) + 90, 380, 22);
            const t = g.mode === 'thing' ? g.choices[i][1] : g.thing;
            speak(`Yes! ${t[1][0].toUpperCase()}${t[1].slice(1)} is a ${g.k}!`);
          } else {
            g.shake[i] = 0.4; SFX.miss();
            speak(g.mode === 'thing' ? `That's ${g.choices[i][1][1]}. It's a ${g.choices[i][0]}, not a ${g.k}. Try again!` : `That's a ${g.choices[i][0]}. Try again!`);
          }
        }
      } else if ((g.t2 -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      g.progress = `Shape ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    cardX(g, i) { const w = 180, gap = 22; return W / 2 - (g.cards * w + (g.cards - 1) * gap) / 2 + i * (w + gap); },
    draw(g) {
      ctx.fillStyle = 'rgba(10,8,40,.5)'; ctx.fillRect(0, 0, W, H);
      // the question card: a shape with its name, or a thing
      panel(W / 2 - 330, 68, 660, 170, 24);
      const yay = g.state === 'yay';
      if (g.mode === 'thing') {
        drawSolid(g.k, W / 2 - 200, 152 + Math.sin(S.t * 2) * 3, 56);
        outlined(solidName(g.k), W / 2 + 70, 128, 44, SOLIDS[g.k].col, 'center', '#fff');
        text(`Which thing is shaped like a ${g.k}?`, W / 2 + 70, 190, 22, '#5a2a6e', 'center', 700);
      } else {
        drawThing(g.thing, W / 2 - 200, 154 + Math.sin(S.t * 2) * 3, 110);
        outlined(yay ? `It's a ${g.k}!` : 'What shape is it?', W / 2 + 70, 128, 38, yay ? SOLIDS[g.k].col : '#ff6fb5', 'center', '#fff');
        text(g.thing[1][0].toUpperCase() + g.thing[1].slice(1), W / 2 + 70, 190, 24, '#5a2a6e', 'center', 700);
      }
      g.choices.forEach(([k, t], i) => {
        const x = this.cardX(g, i) + shakeX(g, i), y = 262, used = g.tried.includes(i) && k !== g.k, right = yay && k === g.k;
        button(`sd:${i}`, x, y, 180, 236, '', { color: right ? '#ffd23f' : used ? '#9a8aaa' : CARD_COLS[i], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        rrect(x + 10, y + 10, 160, 170, 14, used ? '#e8e0ee' : '#fff8ee');
        if (g.mode === 'thing') {
          drawThing(t, x + 90, y + 96, 104);
          if (used || right) text(solidName(k), x + 90, y + 206, 20, '#fff', 'center', 700);
          else text(t[1].replace(/^(a|an) /, '').replace(' in the desert', ''), x + 90, y + 206, 18, '#fff', 'center', 700);
        } else {
          drawSolid(k, x + 90, y + 96, 54);
          text(solidName(k), x + 90, y + 206, 22, '#fff', 'center', 700);
        }
      });
    },
  };

  restage('comet', {
    bg: 'comet_bg',
    games: [['asteroiddodge', 'stardust', {}], ['solids3d', 'moonbeam', {}]],
    intro: [
      '*:A giant comet streaks across the night sky, and the grass in the meadow glows like little lanterns.',
      "N:Hello, Earth {girl|boy}! My comet's tail is full of stardust, but there are asteroids everywhere. Fly my rocket and zap them!",
      'A:determined:Three, two, one... blast off!',
    ],
    mid: ['N:Space foxes have to know their shapes to build rockets. Can you match these solid shapes to real things?', 'A:thinking:A ball is round all over... that must be a sphere!'],
    outro: ['N:Stardust AND moonbeams. Your unicorn is going to sparkle like a comet. Go win that show!', 'A:excited:Thank you, Cosmo! To the stars!'],
  });

  // --- end of batch ---
}
