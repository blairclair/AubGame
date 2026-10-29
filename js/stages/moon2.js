'use strict';
{
  // ===========================================================================
  // Moth Meadow at Dusk, game 2 (learn) MOON CHASE: Luna Moth's wish whisks Aubrey up to the moon.
  // To get home she must catch up with Fuzzle, a big fluffy moon monster, and tap him on the back
  // (there's no air on the moon, so he can't hear her shout!). Then his antennae beam her home.
  // A side-scrolling run on the grey moon: low gravity gives big floaty jumps, and floaty momentum
  // means she drifts and takes a moment to stop and turn. Fuzzle bounds along ahead, facing away,
  // and stops now and then to gaze at things, which is when she can close the gap.
  // Obstacles: craters to hop (fall in and she sinks into the dust, then floats back to the rim),
  // boulders to jump, and bouncy springs to launch over the extra-wide craters.
  // Glowing moon rocks along the way each teach a moon fact. Her footprints stay behind.
  // Controls: Left/Right or A/D to move, Up/W/Space to jump, Enter/Space/E to tap Fuzzle.
  // Pointer: hold the on-screen arrows, tap the jump button or the sky to jump, tap Fuzzle.
  // Score: how quickly she catches him (vs a par time), plus the moon rocks, minus a bit per crater fall.
  // ===========================================================================
  const GROUND = 440;                       // the moon's surface (world y == screen y)
  const GRAV = 560, JUMP = 460, SPRING = 500; // floaty: a jump is ~190 px high and lasts ~1.6 s
  const MAXV = 210, ACC = 380, AIRACC = 200, FRIC = 270;
  const SC = 0.42;                          // Aubrey's sprite scale (about 95 px tall)
  const HW = 16;                            // Aubrey's half-width for bumping into boulders
  const MS = 1.12;                          // Fuzzle's scale
  const AX = 320;                           // where the camera keeps Aubrey on screen
  const BTN = { left: { x: 22, y: 448, w: 80, h: 64 }, right: { x: 112, y: 448, w: 80, h: 64 }, jump: { x: W - 112, y: 448, w: 90, h: 64 } };
  const SAY = { x: W - 200, y: 6, w: 62, h: 56 };

  const FACTS = [
    'That blue ball is Earth, our home!',
    "There's no air on the moon, so footprints stay for a very long time.",
    'Craters are made by space rocks bumping into the moon.',
    "The moon has no light of its own. Sunshine makes it glow.",
    'No air means no wind and no rain on the moon.',
    'Astronauts bounced on the moon, just like you!',
  ];
  const LOOKS = ['star', 'earth', 'comet', 'planet', 'star'];
  const TIERS = {
    1: { L: 3600, craters: 2, rocks: 2, wides: 1, wideW: [370, 390], cw: [100, 160], gems: 4, speed: 300, stop: 2.3, stops: 3, lead: 480 },
    2: { L: 4800, craters: 3, rocks: 3, wides: 1, wideW: [380, 400], cw: [120, 190], gems: 5, speed: 310, stop: 2.2, stops: 4, lead: 500 },
    3: { L: 6000, craters: 4, rocks: 3, wides: 2, wideW: [390, 410], cw: [140, 220], gems: 6, speed: 320, stop: 2.1, stops: 5, lead: 520 },
  };

  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const glow = (x, y, r, rgb, a) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // --- where Aubrey's head is in each sprite frame (found from the picture itself) ------------
  const heads = {};
  function headOf(frame) {
    if (heads[frame]) return heads[frame];
    const im = IMG[frame], c = document.createElement('canvas');
    c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const rows = Math.round(im.height * (frame === 'crouch' ? 0.4 : frame === 'twirl' ? 0.3 : 0.25));
    const d = x.getImageData(0, 0, im.width, rows).data;
    let x0 = im.width, x1 = 0, y0 = rows;
    for (let y = 0; y < rows; y++) for (let i = 0; i < im.width; i++) if (d[(y * im.width + i) * 4 + 3] > 60) {
      x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, y);
    }
    const w = Math.min(x1 - x0, im.width * 0.6);
    return (heads[frame] = { dx: (x0 + x1) / 2 - im.width / 2, cy: y0 + (rows - y0) * 0.5, r: Math.max(w, rows - y0) * 0.5 });
  }

  // --- the course ------------------------------------------------------------------------------
  function buildCourse(g) {
    const T = TIERS[g.tier];
    const kinds = [];
    for (let i = 0; i < T.craters; i++) kinds.push('crater');
    for (let i = 0; i < T.rocks; i++) kinds.push('rock');
    let list = shuffle(kinds);
    // the wide (spring) craters go in the middle and near the end, never first
    const at = T.wides === 1 ? [Math.floor(list.length * 0.55)] : [Math.floor(list.length * 0.35), Math.floor(list.length * 0.8)];
    at.reverse().forEach(i => list.splice(i, 0, 'wide'));
    if (list[0] !== 'rock') { const k = list.indexOf('rock'); [list[0], list[k]] = [list[k], list[0]]; }
    const craters = [], rocks = [], springs = [], gaps = [];
    // widths first, so the gaps can share out the rest of the course evenly (with a little jitter)
    const sizes = list.map(k => k === 'crater' ? rand(...T.cw) : k === 'rock' ? rand(54, 82) : 120 + rand(...T.wideW));
    const gapAvg = Math.max(380, (T.L - 640 - 560 - sizes.reduce((p, q) => p + q, 0)) / list.length);
    let x = 640;
    gaps.push([300, x]);
    list.forEach((k, i) => {
      const size = sizes[i];
      if (k === 'crater') { const w = size; craters.push({ x0: x, x1: x + w, wide: false }); x += w; }
      else if (k === 'rock') {
        const w = size, h = g.tier === 3 && rocks.length === 3 ? 78 : rand(36, 58);
        rocks.push({ x0: x, x1: x + w, top: GROUND - h, h, seed: Math.random() * 9 }); x += w;
      } else {
        springs.push({ x: x + 40, sq: 0 });
        const w = size - 120; craters.push({ x0: x + 120, x1: x + 120 + w, wide: true }); x += 120 + w;
      }
      const nx = x + gapAvg * rand(0.85, 1.15);
      gaps.push([x, nx]); x = nx;
    });
    g.L = Math.max(T.L, x + 520);
    gaps[gaps.length - 1][1] = g.L - 300;
    Object.assign(g, { craters, rocks, springs });
    // glowing moon rocks: some on the ground in the gaps, some floating above boulders and craters (jump for them)
    const spots = [];
    for (const [a, b] of gaps.slice(1)) if (b - a > 160) spots.push({ x: (a + b) / 2, y: GROUND - 30, high: false });
    for (const r of rocks) spots.push({ x: (r.x0 + r.x1) / 2, y: r.top - 105, high: true });
    for (const c of craters) if (!c.wide) spots.push({ x: (c.x0 + c.x1) / 2, y: GROUND - 190, high: true });
    const lows = shuffle(spots.filter(s => !s.high)), highs = shuffle(spots.filter(s => s.high));
    const nHigh = Math.min(highs.length, Math.ceil(T.gems / 2));
    // keep the rocks well apart, so each fact gets its moment
    const chosen = [];
    for (const sp of [...highs.slice(0, nHigh), ...lows, ...highs.slice(nHigh)]) {
      if (chosen.length < T.gems && !chosen.some(c => Math.abs(c.x - sp.x) < 260)) chosen.push(sp);
    }
    g.gems = chosen.sort((a, b) => a.x - b.x)
      .map((s, i) => ({ ...s, got: false, ph: i * 1.7, fact: FACTS[i % FACTS.length] }));
    // Fuzzle's stops: in the middle of gaps, spread along the course; the last one is his gazing spot at the end
    const usable = gaps.slice(1, -1).filter(([a, b]) => b - a > 200);
    const stops = [];
    for (let i = 1; i <= T.stops; i++) {
      const want = 700 + (g.L - 1300) * i / (T.stops + 1);
      let best = usable[0];
      for (const gp of usable) if (Math.abs((gp[0] + gp[1]) / 2 - want) < Math.abs((best[0] + best[1]) / 2 - want)) best = gp;
      const sx = (best[0] + best[1]) / 2 + 30;
      if (!stops.some(s => Math.abs(s.x - sx) < 150)) stops.push({ x: sx, look: LOOKS[(i - 1) % LOOKS.length] });
    }
    stops.sort((a, b) => a.x - b.x);
    stops.push({ x: g.L - 200, look: 'earth', final: true });
    g.stops = stops;
    // par: when Fuzzle reaches his gazing spot if nobody dawdles (a good runner is right behind him by then)
    g.par = 0.8 + (stops[stops.length - 1].x - 170 - T.lead) / T.speed + 3.5;
    for (let k = 0; k < stops.length - 1; k++) g.par += stopTime(g, k);
  }
  // how long Fuzzle gazes at stop k: short glances early on, longer gazes later
  const stopTime = (g, k) => lerp(0.6, TIERS[g.tier].stop, Math.pow(k / Math.max(1, g.stops.length - 2), 1.6));
  const inCrater = (g, x, m = 8) => g.craters.find(c => x > c.x0 + m && x < c.x1 - m);
  // the highest surface under x that a falling Aubrey (feet were at py) can land on
  function supportAt(g, x, py) {
    let best = null;
    for (const r of g.rocks) if (x + HW * 0.6 > r.x0 && x - HW * 0.6 < r.x1 && py <= r.top + 2) best = best == null ? r.top : Math.min(best, r.top);
    if (!inCrater(g, x) && py <= GROUND + 2) best = best == null ? GROUND : Math.min(best, GROUND);
    return best;
  }
  const monsterFeet = (g) => GROUND - (g.m.state === 'walk' ? Math.abs(Math.sin(g.m.ph * Math.PI)) * 46 : 0);
  const inReach = g => !g.a.mode && g.m.x - g.a.x < 135 && g.a.y > monsterFeet(g) - 150;

  // --- art: Fuzzle the moon monster ------------------------------------------------------------
  function fluffPath(cx, cy, rx, ry, n, bump, wob = 0) {
    const p = new Path2D();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      if (i === 0) { p.moveTo(x, y); continue; }
      const am = ((i - 0.5) / n) * Math.PI * 2 - Math.PI / 2, k = 1 + bump * (1 + 0.25 * Math.sin(i * 2.3 + wob));
      p.quadraticCurveTo(cx + Math.cos(am) * rx * k, cy + Math.sin(am) * ry * k, x, y);
    }
    p.closePath();
    return p;
  }
  // (x, fy): his feet; o: { front, t, sq (squash), look, happy, surprised, beam, dir }
  function drawFuzzle(x, fy, s, o) {
    const t = o.t, sq = o.sq || 0, FUR = '#c4b2ff', FUR_D = '#9d86ec', FUR_L = '#e9e2ff', LINE = '#3a2766';
    ctx.save(); ctx.translate(x, fy); ctx.scale(s * (1 + sq * 0.12), s * (1 - sq * 0.12));
    const cy = -66, breathe = Math.sin(t * 2.4) * 1.5;
    // shadow on the ground (drawn by caller when hopping), feet
    for (const dx of [-24, 24]) inkEllipse(dx, -7, 17, 10, 0, FUR_D, 1.4, LINE);
    // ears behind
    for (const dx of [-44, 44]) { ink(fluffPath(dx, cy - 44, 14, 13, 7, 0.22), FUR, 1.4, LINE); ctx.fillStyle = o.front ? '#ffb6d9' : FUR_D; circle(dx, cy - 44, 6); }
    // antennae: bob while he walks, tips glow (brighter when he's beaming)
    const tip = [];
    for (const side of [-1, 1]) {
      const sw = Math.sin(t * 3 + side) * 5 + (o.look ? 6 : 0), bx = side * 16, by = cy - 52, tx = side * (30 + sw * 0.3) + (o.look ? 8 : 0), ty = cy - 108 - Math.abs(sw);
      ctx.lineCap = 'round';
      ctx.strokeStyle = LINE; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(side * 10, cy - 90, tx, ty); ctx.stroke();
      ctx.strokeStyle = FUR_D; ctx.lineWidth = 4; ctx.stroke();
      tip.push([tx, ty]);
    }
    for (const [tx, ty] of tip) {
      glow(tx, ty, o.beam ? 46 : 26, '255,245,150', o.beam ? 0.9 : 0.55 + 0.2 * Math.sin(t * 4));
      inkCircle(tx, ty, 8, '#fff59a', 1.3, LINE);
      ctx.fillStyle = '#fff'; circle(tx - 2.5, ty - 2.5, 2.6);
    }
    // body: one big fluffy puff
    const body = fluffPath(0, cy + breathe * 0.3, 60, 60 + breathe, 18, 0.13, t * 0.6);
    ink(body, FUR, 1.8, LINE);
    ctx.save(); ctx.clip(body);
    const sh = ctx.createRadialGradient(-22, cy - 30, 6, 0, cy, 80);
    sh.addColorStop(0, 'rgba(255,255,255,.45)'); sh.addColorStop(0.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(70,40,140,.25)');
    ctx.fillStyle = sh; ctx.fillRect(-80, cy - 80, 160, 160);
    // little fur tufts
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const fx = -40 + (i * 37) % 80, fy2 = cy - 34 + ((i * 23) % 70);
      ctx.beginPath(); ctx.moveTo(fx, fy2); ctx.quadraticCurveTo(fx + 4, fy2 - 6, fx + 9, fy2 - 3); ctx.stroke();
    }
    ctx.restore();
    if (!o.front) {
      // from behind: a round pompom tail and a hint of his cheek on the side he's heading
      ink(fluffPath(-4, cy + 30, 15, 14, 9, 0.2, 1), FUR_L, 1.3, LINE);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(-9, cy + 25, 4);
      ctx.fillStyle = 'rgba(255,170,210,.35)'; ellipse(52, cy - 6, 6, 4);
    } else {
      // from the front: belly, big eyes, a happy (or surprised) mouth, little arms
      ctx.fillStyle = FUR_L; ellipse(0, cy + 22, 34, 30);
      for (const dx of [-21, 21]) {
        inkEllipse(dx, cy - 16, 13, o.surprised ? 16 : 14, 0, '#fff', 1.4, LINE);
        ctx.fillStyle = '#2a1a4a'; ellipse(dx + 1, cy - 13, 7.5, o.surprised ? 8 : 9);
        ctx.fillStyle = '#fff'; circle(dx + 3.5, cy - 17, 3); circle(dx - 1.5, cy - 9, 1.6);
      }
      ctx.fillStyle = 'rgba(255,140,190,.55)'; ellipse(-38, cy + 2, 9, 5); ellipse(38, cy + 2, 9, 5);
      if (o.surprised) { inkEllipse(0, cy + 10, 7, 9, 0, '#5a2040', 1.2, LINE); }
      else {
        ink(P2(`M-16,${cy + 4} Q0,${cy + 30} 16,${cy + 4} Q0,${cy + 12} -16,${cy + 4} Z`), '#5a2040', 1.2, LINE);
        ctx.fillStyle = '#ff8fb8'; ellipse(0, cy + 15, 6, 3.5);
      }
      const up = o.happy ? Math.sin(t * 8) * 6 : 0;
      for (const side of [-1, 1]) ink(fluffPath(side * 58, cy + (o.happy ? -18 : 14) + up * side, 13, 12, 7, 0.22, side), FUR, 1.4, LINE);
    }
    ctx.restore();
    return tip.map(([tx, ty]) => [x + tx * s, fy + ty * s]);
  }
  // what Fuzzle is gazing at, in a thought bubble
  function thought(x, y, look, t) {
    ctx.fillStyle = 'rgba(255,255,255,.85)'; circle(x - 22, y + 30, 4); circle(x - 12, y + 18, 6);
    rrect(x - 26, y - 26, 52, 40, 20, 'rgba(255,255,255,.92)', '#c9b8ff', 2);
    const yy = y - 6 + Math.sin(t * 3) * 1.5;
    if (look === 'star') star(x, yy, 13, '#ffd84a', 5);
    else if (look === 'earth') { inkCircle(x, yy, 11, '#3d8de8', 1, '#20406a'); ctx.fillStyle = '#5ccf6a'; ellipse(x - 3, yy - 3, 5, 4); ellipse(x + 4, yy + 4, 4, 3); }
    else if (look === 'comet') { ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 16, yy + 8); ctx.lineTo(x + 4, yy - 2); ctx.stroke(); star(x + 6, yy - 3, 9, '#fff59a', 5); }
    else { inkCircle(x, yy, 8, '#ffb35a', 1, '#6a3a1a'); ctx.strokeStyle = '#e07ab0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, yy, 15, 4, -0.3, 0, Math.PI * 2); ctx.stroke(); }
  }

  // --- art: the moon -----------------------------------------------------------------------------
  const STARS = Array.from({ length: 170 }, (_, i) => ({ x: hash(i, 1) * (W + 60), y: 58 + hash(i, 2) * 330, r: 0.6 + hash(i, 3) * 1.8, ph: hash(i, 4) * 6, col: hash(i, 5) < 0.12 ? '#ffd6f0' : hash(i, 5) < 0.22 ? '#cfe6ff' : '#ffffff' }));
  function drawEarth(x, y, r, t) {
    glow(x, y, r * 2.1, '110,170,255', 0.35);
    const disc = new Path2D(); disc.arc(x, y, r, 0, Math.PI * 2);
    ink(disc, '#2f7fe0', 1.5, '#163a6e');
    ctx.save(); ctx.clip(disc);
    const og = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 2, x, y, r);
    og.addColorStop(0, '#6ab8ff'); og.addColorStop(1, '#1f5fc0');
    ctx.fillStyle = og; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // land drifts slowly round as Earth spins
    const sp = (t * 4) % (r * 4);
    ctx.fillStyle = '#4fbf5f';
    for (const k of [0, r * 4]) {
      const ox = x - r * 2 + sp - k;
      ctx.beginPath(); ctx.ellipse(ox + r * 0.6, y - r * 0.3, r * 0.5, r * 0.32, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ox + r * 0.9, y + r * 0.35, r * 0.25, r * 0.4, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ox + r * 2.2, y - r * 0.1, r * 0.55, r * 0.45, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ox + r * 3.2, y + r * 0.4, r * 0.3, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#eef7ff'; ellipse(x, y - r * 0.9, r * 0.6, r * 0.18);
    // soft white clouds drifting
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (const [dy, a0, w] of [[-0.5, 0.4, 0.3], [0.05, 1.9, 0.22], [0.6, 3.1, 0.26]]) {
      const cx2 = x + Math.sin(t * 0.15 + a0) * r * 0.55;
      ellipse(cx2, y + dy * r, r * w, r * 0.07); ellipse(cx2 + r * w * 0.5, y + dy * r - r * 0.05, r * w * 0.6, r * 0.07);
    }
    // night side: a soft shadow on the far edge
    const ns = ctx.createLinearGradient(x - r, 0, x + r, 0);
    ns.addColorStop(0.55, 'rgba(8,10,40,0)'); ns.addColorStop(1, 'rgba(8,10,40,.55)');
    ctx.fillStyle = ns; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(x - r * 0.45, y - r * 0.5, r * 0.2, r * 0.1, -0.6);
  }
  function hills(cam, k, base, amp, col, rimCol, seed) {
    const off = cam * k;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) {
      const wx = x + off;
      ctx.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(wx * 0.004 + seed)) - amp * 0.4 * Math.sin(wx * 0.011 + seed * 2));
    }
    ctx.lineTo(W, H); ctx.fill();
    // a few craters on the far hills
    for (let i = Math.floor(off / 260) - 1; i < Math.floor(off / 260) + 6; i++) {
      const wx = i * 260 + hash(i, seed) * 140, x = wx - off, y = base + 8 + hash(i, seed + 1) * 26, r = 10 + hash(i, seed + 2) * 16;
      ctx.fillStyle = rimCol; ellipse(x, y, r, r * 0.3);
      ctx.fillStyle = 'rgba(0,0,10,.18)'; ellipse(x + 1, y + 1, r * 0.8, r * 0.2);
    }
  }
  function drawCrater(c, cam) {
    const x0 = c.x0 - cam, x1 = c.x1 - cam, w = x1 - x0, deep = GROUND + 78;
    if (x1 < -40 || x0 > W + 40) return;
    const pit = P2(`M${x0},${GROUND} C${x0 + w * 0.12},${deep} ${x1 - w * 0.12},${deep} ${x1},${GROUND} Z`);
    const gr = ctx.createLinearGradient(0, GROUND, 0, deep);
    gr.addColorStop(0, '#2e2f3c'); gr.addColorStop(1, '#4a4b5a');
    ink(pit, gr, 1.4, '#4a4560');
    // lit far wall, and a soft dusty floor
    ctx.save(); ctx.clip(pit);
    ctx.fillStyle = 'rgba(200,205,220,.28)'; ctx.beginPath(); ctx.ellipse(x1 - w * 0.12, GROUND + 22, w * 0.18, 40, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(170,172,186,.45)'; ellipse((x0 + x1) / 2, deep - 8, w * 0.32, 10);
    ctx.restore();
    // raised rims
    for (const [rx, d] of [[x0, -1], [x1, 1]]) {
      ink(P2(`M${rx - d * 2},${GROUND + 2} Q${rx + d * 14},${GROUND - 12} ${rx + d * 30},${GROUND + 2} Z`), '#d6d8e2', 1.1, '#5d5870');
    }
    if (c.wide) {
      // a twinkle of stars in the deepest, widest craters
      for (let i = 0; i < 4; i++) star(x0 + w * (0.25 + i * 0.17), GROUND + 40 + (i % 2) * 12, 3, 'rgba(200,220,255,.5)', 4);
    }
  }
  function drawBoulder(r, cam, t) {
    const x0 = r.x0 - cam, x1 = r.x1 - cam, w = x1 - x0, h = r.h;
    if (x1 < -40 || x0 > W + 40) return;
    ctx.fillStyle = 'rgba(20,20,40,.25)'; ellipse((x0 + x1) / 2 + 8, GROUND + 3, w * 0.6, 6);
    const p = P2(`M${x0 - 2},${GROUND + 2} C${x0 - 6},${GROUND - h * 0.6} ${x0 + w * 0.15},${GROUND - h} ${x0 + w * 0.45},${GROUND - h} C${x1 - w * 0.1},${GROUND - h - 2} ${x1 + 6},${GROUND - h * 0.55} ${x1 + 2},${GROUND + 2} Z`);
    ink(p, '#9b97ab', 1.6, '#4a4560');
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = '#b8b5c6'; ellipse(x0 + w * 0.35, GROUND - h * 0.75, w * 0.3, h * 0.2, -0.3);
    ctx.fillStyle = '#7c788e'; ellipse(x1 - w * 0.15, GROUND - h * 0.25, w * 0.3, h * 0.35);
    for (let i = 0; i < 3; i++) {
      const cx = x0 + w * (0.25 + hash(r.seed, i) * 0.5), cy = GROUND - h * (0.25 + hash(r.seed, i + 5) * 0.5), cr = 3 + hash(r.seed, i + 9) * 4;
      ctx.fillStyle = '#6e6a80'; ellipse(cx, cy, cr, cr * 0.7);
      ctx.fillStyle = '#c4c1d0'; ellipse(cx + 1, cy + cr * 0.4, cr * 0.8, cr * 0.3);
    }
    ctx.restore();
  }
  function drawSpring(s, cam, t) {
    const x = s.x - cam;
    if (x < -60 || x > W + 60) return;
    const sq = s.sq, top = GROUND - 26 + sq * 10;
    glow(x, top, 46, '200,150,255', 0.35 + 0.15 * Math.sin(t * 4));
    ctx.strokeStyle = '#5d5870'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 14, GROUND);
    for (let i = 1; i <= 4; i++) ctx.lineTo(x + (i % 2 ? 14 : -14), GROUND - (GROUND - top) * i / 4);
    ctx.stroke();
    ctx.strokeStyle = '#d6d8e2'; ctx.lineWidth = 2; ctx.stroke();
    inkEllipse(x, GROUND - 2, 22, 5, 0, '#8f8aa0', 1, '#4a4560');
    inkEllipse(x, top, 30, 9, 0, '#b07aff', 1.4, '#3a2766');
    ctx.fillStyle = '#d9bfff'; ellipse(x - 8, top - 3, 12, 3);
    // a little up arrow, so it reads as "boing!"
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 5);
    ctx.fillStyle = '#fff59a'; tri(x - 9, top - 22, x + 9, top - 22, x, top - 36 - Math.abs(Math.sin(t * 4)) * 5);
    ctx.globalAlpha = 1;
  }
  function moonRock(x, y, t, ph) {
    const bob = Math.sin(t * 2.5 + ph) * 4;
    glow(x, y + bob, 34, '170,255,230', 0.55 + 0.2 * Math.sin(t * 3 + ph));
    ink(P2(`M${x - 13},${y + bob + 6} L${x - 9},${y + bob - 8} L${x + 2},${y + bob - 13} L${x + 12},${y + bob - 4} L${x + 11},${y + bob + 8} L${x - 2},${y + bob + 11} Z`), '#9ff5df', 1.2, '#2a5a5a');
    ctx.fillStyle = 'rgba(255,255,255,.75)'; tri(x - 8, y + bob - 6, x + 1, y + bob - 11, x - 3, y + bob);
    ctx.fillStyle = '#5ad8c0'; tri(x + 3, y + bob + 9, x + 11, y + bob + 7, x + 11, y + bob - 3);
    star(x + 14, y + bob - 14, 5 + 2 * Math.sin(t * 4 + ph), '#ffffff', 4);
  }

  // --- art: Aubrey in her bubble helmet ------------------------------------------------------
  function drawAstronaut(x, feet, frame, facing, lift, s) {
    drawAubrey(x, feet, frame, facing, lift, s);
    const im = IMG[frame], hd = headOf(frame), native = AUB_NATIVE[frame];
    const flip = native && facing && native !== Math.sign(facing) ? -1 : 1;
    const hx = x + hd.dx * s * flip, hy = feet - lift - im.height * s + hd.cy * s, r = hd.r * s * 1.12 + 3;
    // a clear glass bubble: only a tint, a rim and shines, so her face shows through
    ctx.fillStyle = 'rgba(190,225,255,.16)'; circle(hx, hy, r);
    ctx.strokeStyle = 'rgba(40,30,80,.55)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,245,255,.95)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hx, hy, r * 0.74, Math.PI * 1.08, Math.PI * 1.42); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(hx + r * 0.5, hy - r * 0.5, 1.6);
    // the collar ring round her neck
    const ny = hy + r * 0.97;
    ctx.fillStyle = '#d9dce8'; ctx.strokeStyle = 'rgba(40,30,80,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(hx, ny, r * 0.42, 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    return { hx, hy, r };
  }

  MG.moonchase = {
    kind: 'learn',
    title: () => 'Moon Chase',
    icon: () => '🌝',
    how: () => "You're on the moon! Catch up with Fuzzle the fluffy moon monster and tap him, so he can beam you home. Arrows move, Up or Space jumps. Grab the glowing moon rocks!",
    init(g) {
      const T = TIERS[g.tier];
      buildCourse(g);
      Object.assign(g, {
        a: { x: 170, y: GROUND, vx: 0, vy: 0, ground: true, facing: 1, buf: 0, coy: 0, mode: '', mt: 0, dist: 0, lastPrint: 170, foot: 0 },
        m: { x: 170 + T.lead, state: 'look', timer: 0.8, ph: 0, look: 'earth', stop: 0, sq: 0, prints: 0 },
        cam: 0, prints: [], mprints: [], fx: [], fact: null, factQ: [], gotGems: 0, falls: 0, bumps: 0, jumps: 0,
        reachT: 0, toldTap: false, toldFall: false, toldSpring: false, end: null, catchT: 0, shoot: { t: 4, x: 0, y: 0, life: 0 },
        say: 'Catch up with Fuzzle and tap him! Arrows move, Up or Space for a floaty jump.',
      });
      g.progress = `Moon rocks 0/${g.gems.length}`;
      g.score = 0;
    },
    start(g) {
      g.say = 'On the moon you weigh much less, so you can jump super high! Hop over the craters and catch Fuzzle.';
      speak(g.say);
    },
    // moon facts show one at a time: a new one waits until the last has had time to be read
    tell(g, str, card = true) {
      if (!card) return speak(str);
      if (g.fact && g.fact.t > 2.5) g.factQ.push(str); else { speak(str); g.fact = { text: str, t: 6 }; }
    },
    scoreNow(g, T) {
      const par = g.par;
      const ts = clamp(1 - (T - par) / (par * 0.7), 0, 1);
      // only the moon rocks she has already run past count, so catching Fuzzle early never loses points
      const passed = Math.max(1, g.gems.filter(m => m.got || m.x < g.a.x + 40).length);
      return clamp(0.62 * ts + 0.38 * g.gotGems / passed - 0.03 * g.falls, 0.15, 1);
    },
    puff(g, x, y, n, col = '200,202,214') {
      for (let i = 0; i < n; i++) g.fx.push({ k: 'dust', x: x + rand(-12, 12), y: y - rand(0, 6), vx: rand(-60, 60), vy: rand(-90, -30), life: rand(0.9, 1.4), max: 1.4, r: rand(3, 6), col });
    },
    update(g, dt, id) {
      dt = Math.min(dt, 1 / 30);
      const a = g.a, m = g.m, T = TIERS[g.tier], t = S.t;
      // dust floats up and then falls slowly back down (low gravity, and no air to blow it about)
      for (const p of g.fx) { p.life -= dt; p.vy += (p.k === 'dust' ? 160 : 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      g.fx = g.fx.filter(p => p.life > 0);
      if (g.fact) { g.fact.t -= dt; if (g.fact.t <= 0) g.fact = null; }
      if (g.factQ.length && (!g.fact || g.fact.t < 2.5)) { const f = g.factQ.shift(); speak(f); g.fact = { text: f, t: 6 }; }
      for (const s of g.springs) s.sq = Math.max(0, s.sq - dt * 3);
      m.sq = Math.max(0, m.sq - dt * 4);
      const sh = g.shoot; sh.t -= dt; sh.life -= dt;
      if (sh.t <= 0) { sh.t = rand(5, 9); sh.life = 1.1; sh.x = rand(200, W - 100); sh.y = rand(80, 200); }
      if (g.end) return this.updateEnd(g, dt);

      // --- Fuzzle ---
      if (m.state === 'walk') {
        const before = Math.floor(m.ph);
        m.x += T.speed * dt; m.ph += T.speed * dt / 150;
        if (Math.floor(m.ph) !== before) { m.sq = 1; g.mprints.push({ x: m.x - 20 }, { x: m.x + 18 }); this.puff(g, m.x, GROUND, 3); }
        const st = g.stops[m.stop];
        if (m.x >= st.x) { m.x = st.x; m.ph = 0; m.state = 'look'; m.atStop = true; m.look = st.look; m.timer = st.final ? Infinity : stopTime(g, m.stop); m.sq = 1; }
      } else if (m.state === 'look') {
        m.timer -= dt;
        // he never wanders too far: if Aubrey is way behind, he keeps gazing a little longer
        if (m.timer <= 0 && m.x - a.x < 700) { if (m.atStop) m.stop++; m.atStop = false; m.state = 'walk'; }
      }

      // --- Aubrey ---
      if (a.mode) this.updateSetback(g, dt);
      else {
        let dir = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0);
        if (!dir && pointer.down) { if (inRect(BTN.left)) dir = -1; else if (inRect(BTN.right)) dir = 1; }
        const sx = m.x - g.cam, fy = monsterFeet(g);
        const onMonster = pointer.clicked && Math.abs(pointer.x - sx) < 80 && pointer.y > fy - 190 * MS && pointer.y < fy + 10;
        const reach = inReach(g);
        g.reach = reach;
        if (reach) {
          g.reachT += dt;
          if (!g.toldTap) { g.toldTap = true; this.tell(g, "No air means no sound, so he can't hear you call. Tap him on his fluffy back!", false); g.say = 'Tap Fuzzle! Press Enter or Space.'; }
          if (pressed.enter || pressed[' '] || pressed.e || pressed.h || pressed.arrowdown || onMonster || g.reachT > 3) return this.caught(g);
        }
        let jump = jumpPressed() || (pointer.clicked && inRect(BTN.jump));
        if (pointer.clicked && !jump && !onMonster && pointer.y < 400 && pointer.y > 110 && !inRect(SAY)) jump = true;
        // floaty momentum: speed builds and drains slowly, so turning takes a moment
        const acc = a.ground ? ACC : AIRACC;
        if (dir) {
          a.vx += dir * acc * dt;
          if (a.ground && a.vx && Math.sign(a.vx) !== dir) a.vx += dir * FRIC * 0.4 * dt;
          a.facing = dir;
        } else if (a.ground) { const f = FRIC * dt; a.vx = Math.abs(a.vx) <= f ? 0 : a.vx - Math.sign(a.vx) * f; }
        if (a.ground) a.spr = false;
        const vmax = a.spr ? 290 : MAXV;
        a.vx = clamp(a.vx, -vmax, vmax);
        if (jump) a.buf = 0.18;
        a.buf -= dt; a.coy = a.ground ? 0.12 : a.coy - dt;
        if (a.buf > 0 && a.coy > 0) {
          a.vy = -JUMP; a.ground = false; a.coy = 0; a.buf = 0; g.jumps++;
          tone(330, 0.5, 'sine', 0.08, 0, 660);
          this.puff(g, a.x, a.y, 4);
        }
        // sideways, bumping softly into boulders
        const px = a.x;
        a.x = Math.max(40, a.x + a.vx * dt);
        if (a.x > m.x - 78) { a.x = Math.max(px, m.x - 78); if (a.vx > 0) a.vx = Math.min(a.vx, 40); }
        for (const r of g.rocks) if (a.y > r.top + 3 && a.x + HW > r.x0 && a.x - HW < r.x1) {
          a.x = px <= (r.x0 + r.x1) / 2 ? r.x0 - HW : r.x1 + HW;
          if (Math.abs(a.vx) > 70) { g.bumps++; floatText(a.x - g.cam, a.y - 100, 'Bump!', '#fff', false, 18); SFX.blip(); }
          a.vx = 0;
        }
        // up and down, with the moon's gentle gravity
        const py = a.y, wasGround = a.ground;
        a.vy += GRAV * dt; a.y += a.vy * dt;
        const sup = supportAt(g, a.x, py);
        if (sup != null && a.vy >= 0 && a.y >= sup) {
          a.y = sup; a.vy = 0; a.ground = true;
          if (!wasGround) { this.puff(g, a.x, a.y, 5); tone(180, 0.12, 'sine', 0.06); }
        } else a.ground = false;
        // bouncy springs
        if (a.ground && a.y === GROUND) for (const s of g.springs) if (Math.abs(a.x - s.x) < 32) {
          a.vy = -SPRING; a.ground = false; a.vx = 290 * (a.vx < 0 && dir < 0 ? -1 : 1); a.facing = Math.sign(a.vx); a.spr = true;
          s.sq = 1; tone(220, 0.6, 'triangle', 0.1, 0, 880);
          if (!g.toldSpring) { g.toldSpring = true; speak('Boing! A moon spring bounces you right over the big crater!'); }
        }
        // fell into a crater: she sinks into the soft dust, then floats back to the rim
        const c = inCrater(g, a.x, 0);
        if (c && a.y > GROUND + 30) {
          a.mode = 'sink'; a.mt = 0; a.crater = c; a.vx = 0; a.vy = 0; g.falls++;
          c.fails = (c.fails || 0) + 1;
          this.puff(g, a.x, GROUND + 70, 10, '150,152,170');
          SFX.miss?.();
          floatText(a.x - g.cam, GROUND - 40, 'Oops!', '#fff59a', false, 22);
          if (!g.toldFall) { g.toldFall = true; speak('Oops, into a crater! Craters are made by space rocks bumping into the moon. Float back up and try a bigger jump.'); }
        }
        // footprints stay where she steps
        if (a.ground && a.y === GROUND && Math.abs(a.x - a.lastPrint) > 30) {
          a.lastPrint = a.x; a.foot ^= 1;
          g.prints.push({ x: a.x + (a.foot ? 4 : -4), f: a.facing, side: a.foot });
          if (g.prints.length > 400) g.prints.shift();
        }
        // moon rocks
        for (const gm of g.gems) if (!gm.got && Math.abs(gm.x - a.x) < 38 && gm.y < a.y + 14 && gm.y > a.y - 112) {
          gm.got = true; g.gotGems++;
          SFX.sparkle(); burst(gm.x - g.cam, gm.y, 14, { colors: ['#9ff5df', '#fff59a', '#ffffff'] });
          floatText(gm.x - g.cam, gm.y - 30, 'Moon fact!', '#9ff5df', false, 20);
          this.tell(g, gm.fact);
        }
        g.progress = `Moon rocks ${g.gotGems}/${g.gems.length}`;
      }
      // camera
      g.cam = clamp(lerp(g.cam, a.x - AX, Math.min(1, dt * 4)), 0, g.L - W + 60);
      g.score = this.scoreNow(g, g.t + 6);
    },
    updateSetback(g, dt) {
      const a = g.a, c = a.crater;
      a.mt += dt;
      if (a.mode === 'sink') {
        a.y = lerp(a.y, GROUND + 66, Math.min(1, dt * 5));
        if (a.mt > 0.8) { a.mode = 'float'; a.mt = 0; a.fx0 = a.x; a.fy0 = a.y; tone(440, 0.8, 'sine', 0.06, 0, 880); }
      } else {
        const k = Math.min(1, a.mt / 1.2), e = k * k * (3 - 2 * k);
        const tx = c.x0 - 160;
        a.x = lerp(a.fx0, tx, e); a.y = lerp(a.fy0, GROUND, e) - Math.sin(k * Math.PI) * 110;
        if (k >= 1) {
          a.mode = ''; a.y = GROUND; a.vx = 0; a.vy = 0; a.ground = true; a.facing = 1; a.lastPrint = a.x;
          // twice in the same crater? Fuzzle's friends leave a moon spring to help her over
          if (c.fails >= 2 && !c.helped && !g.springs.some(s => s.x > c.x0 - 130 && s.x < c.x0)) {
            c.helped = true; g.springs.push({ x: c.x0 - 70, sq: 1 });
            burst(c.x0 - 70 - g.cam, GROUND - 20, 16);
            speak('Here comes a moon spring to help you! Run onto it. Boing!');
          }
        }
      }
      g.cam = clamp(lerp(g.cam, a.x - AX, Math.min(1, dt * 4)), 0, g.L - W + 60);
    },
    caught(g) {
      g.catchT = g.t;
      g.score = this.scoreNow(g, g.t);
      g.end = { t: 0, said: 0 };
      g.a.vx = 0; g.m.state = 'turn'; g.m.sq = 1;
      SFX.pop(); tone(660, 0.2, 'triangle', 0.1); tone(990, 0.3, 'triangle', 0.08, 0.15);
      speak('Tap tap! Fuzzle turns around. Oh! Hello, Aubrey!');
      g.say = 'You caught Fuzzle!';
    },
    updateEnd(g, dt) {
      const e = g.end, a = g.a;
      e.t += dt;
      // she settles onto the ground first if she was mid-jump
      if (e.t < 1.6 && a.y < GROUND) { a.vy += GRAV * dt; a.y = Math.min(GROUND, a.y + a.vy * dt); }
      if (e.t > 1.6 && !e.said) {
        e.said = 1;
        speak('Fuzzle is so happy to see you! His antennae glow, and a moon beam carries you home.');
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sine', 0.07, i * 0.15));
      }
      if (e.t > 2.4) {
        if (!e.y0) e.y0 = a.y;
        const k = clamp((e.t - 2.4) / 3, 0, 1);
        a.lift = k * k * 420;
        if (Math.random() < dt * 30) g.fx.push({ k: 'spark', x: a.x + rand(-40, 40), y: GROUND - rand(0, 60), vx: 0, vy: rand(-160, -90), life: 1.4, max: 1.4, r: rand(3, 6) });
      }
      if (e.t > 5.8) g.done = true;
    },

    draw(g) {
      const t = S.t, cam = g.cam, a = g.a, m = g.m;
      // space: deep black-blue, stars and the Earth
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, '#04030e'); sky.addColorStop(0.7, '#0e0c2c'); sky.addColorStop(1, '#1c1a46');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.13; ctx.translate(W / 2, 220); ctx.rotate(-0.35);
      const band = ctx.createLinearGradient(0, -70, 0, 70);
      band.addColorStop(0, 'rgba(160,140,255,0)'); band.addColorStop(0.5, '#b8a8ff'); band.addColorStop(1, 'rgba(160,140,255,0)');
      ctx.fillStyle = band; ctx.fillRect(-700, -70, 1400, 140); ctx.restore();
      for (const s of STARS) {
        const x = ((s.x - cam * 0.04) % (W + 60) + W + 60) % (W + 60) - 30;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.6 + s.ph * 3);
        if (s.r > 2.1) star(x, s.y, s.r * 2.2, s.col, 4); else { ctx.fillStyle = s.col; circle(x, s.y, s.r); }
      }
      ctx.globalAlpha = 1;
      const sh = g.shoot;
      if (sh.life > 0) {
        const k = 1 - sh.life / 1.1, x = sh.x + k * 220, y = sh.y + k * 80;
        const lg = ctx.createLinearGradient(x - 90, y - 33, x, y); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, `rgba(255,255,240,${sh.life})`);
        ctx.strokeStyle = lg; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 90, y - 33); ctx.lineTo(x, y); ctx.stroke();
      }
      g.earth = { x: 700 - cam * 0.02, y: 160 };
      drawEarth(g.earth.x, g.earth.y, 48, t);
      // a far planet with a ring
      const px = 150 - cam * 0.03;
      inkCircle(px, 120, 12, '#ffb35a', 1, '#6a3a1a'); ctx.fillStyle = '#ffd08a'; ellipse(px - 3, 116, 6, 3);
      ctx.strokeStyle = '#e07ab0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(px, 120, 22, 6, -0.3, 0, Math.PI * 2); ctx.stroke();
      // grey hills far away
      hills(cam, 0.18, 360, 34, '#4c4e62', '#5e6076', 1.3);
      hills(cam, 0.42, 404, 24, '#6e7084', '#80829a', 4.1);
      // the ground
      const gg = ctx.createLinearGradient(0, GROUND, 0, H);
      gg.addColorStop(0, '#c8cad6'); gg.addColorStop(1, '#8e91a4');
      ctx.fillStyle = gg; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#e2e4ec'; ctx.fillRect(0, GROUND - 2, W, 4);
      // little dimples and pebbles, fixed in the world
      for (let i = Math.floor(cam / 70) - 1; i < Math.floor(cam / 70) + 16; i++) {
        const x = i * 70 + hash(i, 7) * 50 - cam, y = GROUND + 18 + hash(i, 8) * 70, r = 4 + hash(i, 9) * 12;
        if (inCrater(g, x + cam, -20)) continue;
        if (hash(i, 10) < 0.6) { ctx.fillStyle = 'rgba(90,92,112,.35)'; ellipse(x, y, r, r * 0.35); ctx.fillStyle = 'rgba(240,242,250,.5)'; ellipse(x + 1, y + r * 0.3, r * 0.8, r * 0.18); }
        else { ctx.fillStyle = '#7e8094'; ellipse(x, y, r * 0.4, r * 0.28); ctx.fillStyle = '#d4d6e0'; ellipse(x - 1, y - 1, r * 0.2, r * 0.12); }
      }
      // where she landed: a sparkly landing ring
      const lx = 140 - cam;
      if (lx > -80) { ctx.strokeStyle = `rgba(255,220,255,${0.5 + 0.3 * Math.sin(t * 3)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(lx, GROUND + 8, 46, 9, 0, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 4; i++) star(lx - 36 + i * 24, GROUND - 10 - Math.abs(Math.sin(t * 2 + i)) * 14, 4, '#ffd6f0', 4); }
      // footprints: Aubrey's little ones and Fuzzle's big round ones
      for (const p of g.mprints) { const x = p.x - cam; if (x < -30 || x > W + 30) continue; ctx.fillStyle = 'rgba(80,80,104,.35)'; ellipse(x, GROUND + 12, 13, 4); ctx.fillStyle = 'rgba(80,80,104,.3)'; for (const d of [-8, 0, 8]) circle(x + d, GROUND + 6, 2.2); }
      for (const p of g.prints) {
        const x = p.x - cam; if (x < -20 || x > W + 20) continue;
        const y = GROUND + 7 + (p.side ? 4 : 0);
        ctx.fillStyle = 'rgba(70,70,96,.45)'; ellipse(x, y, 6, 2.4);
        ctx.strokeStyle = 'rgba(230,232,240,.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (const d of [-3, 0, 3]) { ctx.moveTo(x + d, y - 1.6); ctx.lineTo(x + d, y + 1.6); } ctx.stroke();
      }
      for (const c of g.craters) drawCrater(c, cam);
      for (const s of g.springs) drawSpring(s, cam, t);
      for (const r of g.rocks) drawBoulder(r, cam, t);
      // the finish: Fuzzle's favourite Earth-watching spot
      const fx = g.stops[g.stops.length - 1].x + 90 - cam;
      if (fx > -60 && fx < W + 60) { ink(P2(`M${fx - 30},${GROUND + 2} C${fx - 28},${GROUND - 30} ${fx + 26},${GROUND - 36} ${fx + 34},${GROUND + 2} Z`), '#a9a6ba', 1.4, '#4a4560'); ctx.fillStyle = '#c8c5d6'; ellipse(fx - 6, GROUND - 20, 12, 5); }
      for (const gm of g.gems) if (!gm.got) { const x = gm.x - cam; if (x > -40 && x < W + 40) moonRock(x, gm.y, t, gm.ph); }
      // Fuzzle
      const mx = m.x - cam, mfy = monsterFeet(g);
      if (mx > -120 && mx < W + 120) {
        ctx.fillStyle = 'rgba(20,20,40,.25)'; ellipse(mx, GROUND + 4, 60 * (1 - (GROUND - mfy) / 200), 8);
        const e = g.end, front = e && e.t > 0.4, beam = e && e.t > 1.8;
        const tips = drawFuzzle(mx, mfy, MS, { t, sq: m.sq, front, surprised: e && e.t < 1.1, happy: e && e.t > 1.1, look: m.state === 'look', beam });
        if (m.state === 'look' && !e) thought(mx + 88, mfy - 200, m.look, t);
        if (e && e.t < 1.2) outlined('!', mx, mfy - 200 - Math.min(1, e.t * 4) * 10, 40, '#fff59a', 'center');
        if (e && e.t > 0.9 && e.t < 2.6) for (let i = 0; i < 3; i++) heart(mx - 40 + i * 40, mfy - 190 - ((e.t * 40 + i * 13) % 40), 20, '#ff8fc0');
        g.tips = tips;
      }
      // the moon beam that carries her home
      const e = g.end, ax = a.x - cam;
      if (e && e.t > 1.8) {
        const k = clamp((e.t - 1.8) / 0.6, 0, 1);
        ctx.save(); ctx.globalAlpha = k * 0.85;
        for (const [tx, ty] of g.tips || []) {
          const bg = ctx.createLinearGradient(tx, ty, ax, GROUND);
          bg.addColorStop(0, 'rgba(255,250,170,.85)'); bg.addColorStop(1, 'rgba(255,250,170,.15)');
          ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ax - 40, GROUND - 120 - (a.lift || 0) * 0.3); ctx.lineTo(ax + 40, GROUND - 120 - (a.lift || 0) * 0.3); ctx.fill();
        }
        const col = ctx.createLinearGradient(ax - 60, 0, ax + 60, 0);
        col.addColorStop(0, 'rgba(255,250,190,0)'); col.addColorStop(0.5, 'rgba(255,250,190,.55)'); col.addColorStop(1, 'rgba(255,250,190,0)');
        ctx.fillStyle = col; ctx.fillRect(ax - 60, 0, 120, GROUND + 10);
        ctx.restore();
      }
      // Aubrey
      let frame = 'idle_front';
      if (a.mode === 'sink') frame = 'crouch';
      else if (a.mode === 'float' || (e && e.t > 2.2)) frame = 'twirl';
      else if (e) frame = 'idle_front';
      else if (!a.ground) frame = 'jump';
      else if (Math.abs(a.vx) > 15) frame = `run${1 + Math.floor(Math.abs(a.x) / 26) % 5}`;
      let s = frame === 'twirl' ? SC * 0.85 : SC, lift = 0, axx = ax;
      if (e && a.lift) { const k = a.lift / 420; s *= 1 - k * 0.6; axx = lerp(ax, g.earth.x, k * k); lift = a.lift; }
      if (a.mode === 'sink') { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, GROUND + 60); ctx.clip(); }
      if (!(e && a.lift > 400)) drawAstronaut(axx, a.y, frame, a.facing, lift, s);
      if (a.mode === 'sink') ctx.restore();
      // dust and sparkles
      for (const p of g.fx) {
        const k = clamp(p.life / p.max, 0, 1);
        if (p.k === 'dust') { ctx.fillStyle = `rgba(${p.col},${0.55 * k})`; circle(p.x - cam, p.y, p.r); }
        else { ctx.globalAlpha = k; star(p.x - cam, p.y, p.r, '#fff59a', 4); ctx.globalAlpha = 1; }
      }
      this.drawHud(g, t);
    },
    drawHud(g, t) {
      const a = g.a, m = g.m, e = g.end;
      // the chase track: where Aubrey and Fuzzle are on the way
      darkPanel(250, 64, 460, 34, 17);
      const tx = p => 276 + clamp(p / g.L, 0, 1) * 400;
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(276, 81); ctx.lineTo(676, 81); ctx.stroke();
      for (const gm of g.gems) { ctx.fillStyle = gm.got ? '#9ff5df' : 'rgba(159,245,223,.35)'; circle(tx(gm.x), 81, 3.5); }
      star(684, 81, 8, '#fff59a', 5);
      inkCircle(tx(m.x), 81, 9, '#c4b2ff', 1, '#3a2766'); ctx.fillStyle = '#fff59a'; circle(tx(m.x) - 5, 70, 2.5); circle(tx(m.x) + 5, 70, 2.5);
      inkCircle(tx(a.x), 81, 8, '#ff9ccf', 1, '#5a2a6e'); ctx.strokeStyle = 'rgba(220,240,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx(a.x), 81, 11, 0, Math.PI * 2); ctx.stroke();
      // the latest moon fact
      if (g.fact && !e) {
        // along the bottom, between the arrow pads, so it never hides Aubrey's big jumps
        const lines = wrap(g.fact.text, 450, 17, 600), h = 16 + lines.length * 22, y0 = H - 12 - h;
        ctx.globalAlpha = Math.min(1, g.fact.t * 2);
        rrect(W / 2 - 270, y0, 540, h, 16, 'rgba(20,40,60,.88)', '#9ff5df', 2);
        moonRock(W / 2 - 240, y0 + h / 2, t, 0);
        lines.forEach((l, i) => text(l, W / 2 + 20, y0 + 19 + i * 22, 17, '#eafffa', 'center', 600));
        ctx.globalAlpha = 1;
      }
      // Fuzzle's off ahead: point the way
      const mx = m.x - g.cam;
      if (mx - 75 * MS > W && !e) {
        const y = 300 + Math.sin(t * 3) * 4;
        darkPanel(W - 118, y - 26, 104, 52, 22);
        inkCircle(W - 90, y, 14, '#c4b2ff', 1, '#3a2766'); ctx.fillStyle = '#fff59a'; circle(W - 98, y - 17, 3); circle(W - 82, y - 17, 3);
        text('→', W - 54, y, 26, '#fff', 'center', 800);
        text(`${Math.round((m.x - a.x) / 20)} m`, W - 34, y + 16, 11, '#fff', 'center', 700);
      }
      // tap prompt
      if (g.reach && !e) {
        const fy = monsterFeet(g), y = fy - 236, x = clamp(mx, 150, W - 150), pulse = 1 + 0.04 * Math.sin(t * 8);
        ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
        rrect(-130, -24, 260, 48, 22, '#fff8fc', '#ff6fb5', 3);
        text('👆 Tap him! Press ENTER', 0, 1, 19, '#5a2a6e', 'center', 800);
        ctx.restore();
      }
      // touch controls
      if (!e) {
        const pad = (b, label, on) => { rrect(b.x, b.y, b.w, b.h, 22, on ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.2)', 'rgba(255,255,255,.6)', 2); text(label, b.x + b.w / 2, b.y + b.h / 2, 30, '#fff', 'center', 800); };
        pad(BTN.left, '◀', goLeft() || (pointer.down && inRect(BTN.left)));
        pad(BTN.right, '▶', goRight() || (pointer.down && inRect(BTN.right)));
        pad(BTN.jump, '⤒', !a.ground);
      }
    },
  };

  restage('mothmeadow', {
    games: [['glowworm', 'silk', {}], ['moonchase', 'silk', {}]],
    mid: [
      'N:Look how big and round the moon is tonight. Have you ever wished you could visit it?',
      'A:excited:Every night!',
      'N:Then close your eyes and make a moth-wish... Up you float!',
      "*:Whoosh! Aubrey floats up, up, up, all the way to the moon, in a shiny bubble helmet.",
      "A:surprised:I'm on the MOON! And there's a big fluffy monster bouncing away!",
      "N:That's Fuzzle, my moon friend. Catch up and tap him, and he'll beam you home. Jump high, little one!",
      'A:determined:Big floaty moon jumps. Here I come!',
    ],
    outro: [
      'A:laughing:Luna! I went to the MOON, and a fluffy monster beamed me home!',
      'N:Fuzzle sends you this, spun from moonbeams. Moon-silk, for a moon-bright unicorn.',
      'A:happy:It shines just like the moon!',
    ],
  });
}
