'use strict';
// Batch 5: Shooting Star Hill, Rainbow's End, Moonlight Lake, Ember Mountain, Cloud Castle.
// Each place gets a new backdrop and two new minigames (one action, one learn).
{
  // ---------------------------------------------------------------- shared helpers
  const srand = seed => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const CHOICE_COLS = ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a', '#ff9a3a', '#2fb0b0', '#e05a7a'];
  const tryScore = wrongs => [1, 0.5, 0.2, 0][Math.min(3, wrongs)];
  // soft round glow; rgb is "r,g,b"
  const glow = (x, y, r, rgb, a = 0.6) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const vgrad = (y0, y1, stops) => { const gr = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };
  const rowX = (n, w, gap) => i => W / 2 - (n * w + (n - 1) * gap) / 2 + i * (w + gap);
  // which choice was picked this frame: a 'ch:i' button or the number key
  const choiceIndex = (id, n) => {
    if (id?.startsWith('ch:')) return +id.slice(3);
    for (let i = 0; i < n; i++) if (pressed[String(i + 1)]) return i;
    return -1;
  };
  const shakeX = (g, i) => (g.shake[i] ? Math.sin(g.shake[i] * 50) * 7 : 0);
  // a little face for stars, eggs and clouds
  const cuteFace = (x, y, s, mood = 'happy') => {
    ctx.fillStyle = '#3d2c4a';
    if (mood === 'shut') { ctx.strokeStyle = '#3d2c4a'; ctx.lineWidth = 2 * s; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * 6 * s, y, 3 * s, Math.PI, 0); ctx.stroke(); } }
    else { circle(x - 6 * s, y, 2.6 * s); circle(x + 6 * s, y, 2.6 * s); ctx.fillStyle = '#fff'; circle(x - 5.2 * s, y - 1 * s, 0.9 * s); circle(x + 6.8 * s, y - 1 * s, 0.9 * s); }
    ctx.strokeStyle = '#3d2c4a'; ctx.lineWidth = 1.8 * s; ctx.lineCap = 'round';
    ctx.beginPath();
    if (mood === 'sad' || mood === 'cold') ctx.arc(x, y + 9 * s, 3.5 * s, Math.PI * 1.15, Math.PI * 1.85);
    else if (mood === 'hot') { ctx.moveTo(x - 3 * s, y + 6 * s); ctx.lineTo(x + 3 * s, y + 6 * s); }
    else ctx.arc(x, y + 3 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,120,160,.45)'; circle(x - 10 * s, y + 4 * s, 2.6 * s); circle(x + 10 * s, y + 4 * s, 2.6 * s);
  };
  // a round-based learn game: def.make(g) sets g.say, g.choices and g.answer; def.check(g, i) is
  // true (round won), false (wrong) or 'step' (right, keep going)
  const learnGame = def => Object.assign({
    kind: 'learn',
    init(g) {
      Object.assign(g, { round: 0, total: 0, shake: {}, state: 'pick', t2: 0, fx: 0 });
      g.rounds = def.rounds(g); def.setup?.(g); this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      Object.assign(g, { tried: [], wrongs: 0, state: 'pick', t2: 0, fx: 0 });
      def.make(g);
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      g.fx += dt;
      for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
      if (g.state === 'pick') {
        const i = def.input ? def.input(g, id) : choiceIndex(id, g.choices.length);
        if (i >= 0 && i < g.choices.length && !g.tried.includes(i)) {
          const r = def.check(g, i);
          if (r === 'step') def.onStep?.(g, i);
          else if (r) {
            g.total += def.roundScore ? def.roundScore(g) : tryScore(g.wrongs);
            g.state = 'yay'; g.t2 = def.yay ?? 2.2; g.fx = 0; def.onRight(g, i);
          } else {
            g.wrongs++; if (def.lockWrong !== false) g.tried.push(i);
            g.shake[i] = 0.45; SFX.miss(); def.onWrong(g, i);
          }
        }
      } else if ((g.t2 -= dt) <= 0) {
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      def.tick?.(g, dt);
      g.progress = `${def.unit || 'Round'} ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
  }, def);

  // =====================================================================================
  // 1. SHOOTING STAR HILL — Twinkle the Star
  // =====================================================================================
  const SKY_STARS = (() => { const r = srand(11); return Array.from({ length: 170 }, () => ({ x: r() * W, y: 64 + r() * 350, s: 0.6 + r() * r() * 2.8, p: r() * 6, c: ['255,255,240', '200,225,255', '255,215,245'][Math.floor(r() * 3)] })); })();
  const MILKY = (() => { const r = srand(5); return Array.from({ length: 300 }, () => ({ u: r() * 1300 - 650, v: (r() + r() + r() - 1.5) * 46, s: 0.4 + r() * 1.3, p: r() * 6 })); })();
  const METEORS = [[0, 140, 110, 420, 250], [0.36, 860, 90, 590, 230], [0.7, 560, 120, 300, 280]];
  const drawMeteors = (speed = 0.2) => {
    for (const [off, x0, y0, x1, y1] of METEORS) {
      const k = (S.t * speed + off) % 1;
      if (k > 0.16) continue;
      const e = k / 0.16, x = lerp(x0, x1, e), y = lerp(y0, y1, e), tail = 40 + 120 * Math.sin(e * Math.PI);
      const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      const gr = ctx.createLinearGradient(x, y, x - ux * tail, y - uy * tail);
      gr.addColorStop(0, 'rgba(255,250,220,.95)'); gr.addColorStop(1, 'rgba(255,190,255,0)');
      ctx.strokeStyle = gr; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * tail, y - uy * tail); ctx.stroke();
      glow(x, y, 18, '255,250,210', 0.9); star(x, y, 6, '#fffbe0', 4);
    }
  };
  const nightSky = () => {
    ctx.fillStyle = vgrad(0, GY, ['#0a0a2c', '#1d1a5e', '#3d2f8a', '#8a4fa8', '#e07ab0']);
    ctx.fillRect(0, 0, W, H);
    // the milky way: a soft tilted band of glow, dust and tiny stars
    ctx.save(); ctx.translate(480, 250); ctx.rotate(-0.24);
    for (const [u, v, rx, ry, c, a] of [[-380, 4, 260, 54, '200,170,255', 0.32], [-40, -6, 320, 64, '170,210,255', 0.3], [300, 8, 280, 50, '255,180,235', 0.3], [80, 0, 520, 26, '255,245,255', 0.22]]) {
      ctx.save(); ctx.translate(u, v); ctx.scale(1, ry / rx); glow(0, 0, rx, c, a); ctx.restore();
    }
    ctx.fillStyle = 'rgba(30,20,80,.12)'; ellipse(-120, 6, 160, 7, 0.05); ellipse(200, -4, 110, 5, -0.04);
    for (const m of MILKY) { ctx.fillStyle = `rgba(255,250,255,${0.25 + 0.5 * Math.abs(Math.sin(S.t * 0.8 + m.p))})`; circle(m.u, m.v, m.s); }
    ctx.restore();
    for (const s of SKY_STARS) {
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(S.t * (0.6 + s.p * 0.2) + s.p));
      if (s.s > 2.4) { glow(s.x, s.y, s.s * 5, s.c, 0.35 * tw); star(s.x, s.y, s.s * 1.6, `rgba(${s.c},${tw})`, 4); }
      else { ctx.fillStyle = `rgba(${s.c},${tw})`; circle(s.x, s.y, s.s); }
    }
  };
  const BENCH = P2('M0,0 L0,-22 L-6,-22 L-6,-28 L104,-28 L104,-22 L98,-22 L98,0 L90,0 L90,-22 L8,-22 L8,0 Z');
  BACKDROPS.shootingstar_bg = () => {
    nightSky();
    // faint constellation stick figures
    ctx.strokeStyle = 'rgba(200,220,255,.28)'; ctx.lineWidth = 1.5;
    for (const pts of [[[90, 120], [130, 150], [175, 140], [210, 175], [190, 215]], [[600, 96], [640, 130], [700, 118], [690, 165]]]) {
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      for (const [x, y] of pts) { glow(x, y, 9, '220,235,255', 0.6); ctx.fillStyle = '#eef4ff'; circle(x, y, 2.2); }
    }
    // big glowing moon with craters, and a ringed planet
    glow(800, 140, 150, '255,240,200', 0.32); glow(800, 140, 70, '255,250,225', 0.5);
    inkCircle(800, 140, 46, '#fff6d6', 1.5, 'rgba(255,230,170,.9)');
    ctx.fillStyle = 'rgba(230,210,170,.55)'; circle(784, 126, 10); circle(818, 150, 7); circle(796, 164, 5); circle(822, 122, 4);
    glow(300, 300, 40, '255,180,220', 0.35);
    ctx.save(); ctx.translate(300, 300); ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(255,220,250,.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 30, 8, 0, Math.PI, TAU); ctx.stroke();
    inkCircle(0, 0, 16, '#ff9ed2', 1, 'rgba(255,240,250,.6)');
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-4, -4, 9, 4, 0.3);
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
    drawMeteors();
    // far hills with a sleepy village, then nearer hills
    bdHills('#3a2c78', 384, 18, 0.006, 1);
    for (const [x, y] of [[560, 368], [584, 372], [606, 366], [640, 374], [668, 370], [700, 376], [96, 378], [124, 382]]) {
      ctx.fillStyle = '#2a1f5c'; ctx.fillRect(x - 8, y - 10, 16, 14); tri(x - 10, y - 10, x, y - 19, x + 10, y - 10);
      ctx.fillStyle = `rgba(255,214,120,${0.7 + 0.3 * Math.sin(S.t * 2 + x)})`; ctx.fillRect(x - 3, y - 6, 6, 5);
    }
    bdHills('#2b2a66', 412, 14, 0.011, 3);
    // the hilltop itself
    const hill = P2(`M0,${H} L0,440 C200,412 420,402 600,408 C760,414 880,426 ${W},436 L${W},${H} Z`);
    ctx.fillStyle = vgrad(402, H, ['#2f6f78', '#1d4c5c', '#14344a']); ctx.fill(hill);
    ctx.strokeStyle = 'rgba(170,235,255,.45)'; ctx.lineWidth = 3; ctx.stroke(hill);
    ctx.fillStyle = '#235866';
    for (let x = 6; x < W; x += 23) { const y = x < 600 ? 440 - (x / 600) * 32 + Math.pow(x / 600 - 0.7, 2) * 30 : 408 + (x - 600) * 0.083; tri(x - 5, y + 4, x, y - 7 - (x % 3) * 3, x + 5, y + 4); }
    // lookout bench, lantern and telescope
    INK = OL;
    ctx.save(); ctx.translate(48, 436); ink(BENCH, '#b07a4a', 2);
    inkRect(-2, -62, 108, 10, '#c98a56', 2, 3); inkRect(-2, -46, 108, 9, '#c98a56', 2, 3);
    inkRect(4, -62, 7, 34, '#a06a3e', 1.5, 2); inkRect(93, -62, 7, 34, '#a06a3e', 1.5, 2);
    ctx.restore();
    emoji('🧣', 120, 398, 22);
    inkRect(186, 356, 6, 82, '#4a3a5a', 1.5, 2);
    glow(189, 350, 46, '255,210,120', 0.55 + 0.1 * Math.sin(S.t * 3));
    inkRect(178, 336, 22, 26, '#ffe08a', 2, 5); inkRect(176, 330, 26, 7, '#4a3a5a', 1.5, 3);
    ctx.strokeStyle = OL; ctx.lineWidth = 3;
    for (const d of [-16, 0, 16]) { ctx.beginPath(); ctx.moveTo(886, 392); ctx.lineTo(886 + d, 436); ctx.stroke(); }
    ctx.save(); ctx.translate(886, 388); ctx.rotate(-0.6);
    inkRect(-30, -8, 62, 16, '#7a6ad0', 2, 6); inkRect(28, -11, 12, 22, '#ffd86a', 2, 4); inkRect(-38, -5, 10, 10, '#ffd86a', 1.5, 3);
    ctx.restore();
    // little fallen stars glowing in the grass, glow flowers and fireflies
    for (const [x, y, r] of [[420, 474, 8], [566, 512, 7], [110, 506, 9], [860, 488, 7], [330, 526, 6]]) {
      glow(x, y, r * 4, '255,240,150', 0.45 + 0.2 * Math.sin(S.t * 3 + x)); vecStar(x, y, r, '#ffe66a', 1);
    }
    for (const [x, y, c] of [[30, 470, '#8ff0ff'], [240, 500, '#ff9ee0'], [470, 520, '#8ff0ff'], [640, 470, '#c6a2ff'], [800, 520, '#ff9ee0'], [930, 470, '#8ff0ff'], [680, 530, '#c6a2ff']]) {
      ctx.strokeStyle = '#3a8a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x + 3, y + 6, x, y); ctx.stroke();
      glow(x, y, 14, c === '#8ff0ff' ? '140,240,255' : c === '#ff9ee0' ? '255,160,225' : '200,170,255', 0.6); flower(x, y, 6, c, '#fff6c0', 0.8);
    }
    for (let i = 0; i < 10; i++) {
      const fx = (i * 97 + Math.sin(S.t * 0.6 + i) * 40 + 960) % W, fy = 300 + (i * 53) % 150 + Math.sin(S.t * 1.3 + i * 2) * 12;
      const a = 0.5 + 0.5 * Math.sin(S.t * 3 + i);
      glow(fx, fy, 10, '220,255,140', 0.7 * a); ctx.fillStyle = `rgba(250,255,200,${a})`; circle(fx, fy, 1.8);
    }
  };

  // --- Star Sling: pull back the slingshot and fling fallen stars into the constellation's gaps ---
  const CONSTELLATIONS = [
    { name: 'the Big Dipper', pts: [[0, 0.2], [0.17, 0.1], [0.33, 0.22], [0.5, 0.38], [0.54, 0.82], [0.88, 0.88], [0.92, 0.42]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
    { name: 'the Heart', pts: [[0.5, 0.28], [0.32, 0.02], [0.1, 0.16], [0.14, 0.56], [0.5, 1], [0.86, 0.56], [0.9, 0.16], [0.68, 0.02]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]] },
    { name: 'the Kite', pts: [[0.5, 0], [0.2, 0.36], [0.5, 0.68], [0.8, 0.36], [0.42, 0.84], [0.6, 1]], edges: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5]] },
    { name: 'the Crown', pts: [[0.05, 0.1], [0.28, 0.6], [0.5, 0.05], [0.72, 0.6], [0.95, 0.1], [0.82, 1], [0.18, 1]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]] },
    { name: 'the Little House', pts: [[0.5, 0], [0.18, 0.42], [0.82, 0.42], [0.18, 1], [0.82, 1]], edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]] },
  ];
  const SL = { x: 480, y: 412 };           // the slingshot's pouch at rest
  const SL_G = 340, SL_K = 6.4, SL_MAX = 140;
  MG.starsling = {
    kind: 'action', title: () => 'Star Sling', icon: () => '🌠',
    how: () => 'Pull the star back on the slingshot and let go to fling it! Fill the empty holes in the constellation. Or aim with the arrow keys and press space.',
    init(g) {
      Object.assign(g, { round: 0, rounds: 3, filled: 0, total: 0, shapes: shuffle(CONSTELLATIONS).slice(0, 3), fly: null, trail: [], aiming: false, kAng: 0, kPow: 0.7, aimK: false, msg: null, t2: 0, hitR: [38, 32, 30][g.tier - 1], preview: [1.6, 1.2, 0.95][g.tier - 1] });
      this.setup(g);
    },
    start(g) { speak(g.say); },
    setup(g) {
      const c = g.shapes[g.round], n = [2, 3, 3][g.tier - 1];
      const gaps = shuffle(c.pts.map((_, i) => i)).slice(0, n);
      g.stars = c.pts.map(([u, v], i) => ({ x: 190 + u * 580, y: 96 + v * 200, gap: gaps.includes(i), ft: 0 }));
      g.left = n + [3, 3, 2][g.tier - 1];
      g.total += n; g.state = 'aim'; g.fly = null;
      g.say = `Fling the stars into the empty holes to fix ${c.name}!`;
      if (g.phase === 'play') speak(g.say);
    },
    // where a shot with velocity (vx, vy) goes; returns the points and the gap it hits
    sim(g, vx, vy, tmax = 3) {
      let x = SL.x, y = SL.y; const pts = [];
      for (let t = 0; t < tmax; t += 1 / 120) {
        vy += SL_G / 120; x += vx / 120; y += vy / 120;
        pts.push([x, y]);
        const hit = g.stars.findIndex(s => s.gap && Math.hypot(s.x - x, s.y - y) < g.hitR);
        if (hit >= 0) return { pts, hit };
        if (y > H + 20 || x < -30 || x > W + 30) break;
      }
      return { pts, hit: -1 };
    },
    pull(g) {
      if (g.aimK) { const len = SL_MAX * g.kPow; return [-Math.sin(g.kAng) * len, Math.cos(g.kAng) * len]; }
      let dx = pointer.x - SL.x, dy = pointer.y - SL.y; const d = Math.hypot(dx, dy);
      if (d > SL_MAX) { dx *= SL_MAX / d; dy *= SL_MAX / d; }
      return [dx, dy];
    },
    fire(g, vx, vy) {
      g.fly = { x: SL.x, y: SL.y, vx, vy, spin: 0 }; g.trail = []; g.left--; g.aiming = false; g.state = 'fly';
      SFX.jump(); tone(600, 0.25, 'sine', 0.06, 0, 1400);
    },
    update(g, dt) {
      for (const s of g.stars) if (!s.gap) s.ft += dt;
      if (g.state === 'aim') {
        // keyboard aiming
        if (goLeft()) { g.kAng -= 1.3 * dt; g.aimK = true; }
        if (goRight()) { g.kAng += 1.3 * dt; g.aimK = true; }
        if (keys.arrowup || keys.w) { g.kPow += 0.6 * dt; g.aimK = true; }
        if (goDown()) { g.kPow -= 0.6 * dt; g.aimK = true; }
        g.kAng = clamp(g.kAng, -1.25, 1.25); g.kPow = clamp(g.kPow, 0.3, 1);
        if (g.aimK && pressed[' ']) { const [px, py] = this.pull(g); this.fire(g, -px * SL_K, -py * SL_K); }
        // pointer: grab near the slingshot (or anywhere low on the screen), pull back, let go
        if (pointer.clicked && pointer.y > 300) { g.aiming = true; g.aimK = false; }
        if (g.aiming && !pointer.down) {
          const [px, py] = this.pull(g);
          if (Math.hypot(px, py) > 24 && py > -10) this.fire(g, -px * SL_K, -py * SL_K); else g.aiming = false;
        }
      } else if (g.state === 'fly') {
        const f = g.fly;
        for (let k = 0; k < 4; k++) {
          f.vy += SL_G * dt / 4; f.x += f.vx * dt / 4; f.y += f.vy * dt / 4;
          const hit = g.stars.find(s => s.gap && Math.hypot(s.x - f.x, s.y - f.y) < g.hitR);
          if (hit) {
            hit.gap = false; hit.ft = 0; g.filled++; g.fly = null;
            SFX.sparkle(); burst(hit.x, hit.y, 22, { colors: ['#fff6a8', '#ffe066', '#ffffff'] });
            floatText(hit.x, hit.y - 30, pick(['Twinkle!', 'Got it!', 'Shine!']), '#fff6a8', false, 22);
            break;
          }
          if (f.y > H + 30 || f.x < -40 || f.x > W + 40) { g.fly = null; SFX.miss(); floatText(SL.x, 330, 'Whoosh! Try again!', '#ffd0f0', false, 22); break; }
        }
        if (f) { f.spin += dt * 8; g.trail.push([f.x, f.y]); if (g.trail.length > 18) g.trail.shift(); }
        if (!g.fly) {
          const gapsLeft = g.stars.filter(s => s.gap).length;
          if (!gapsLeft) { g.state = 'won'; g.t2 = 2.2; SFX.fanfare(); speak(`You fixed ${g.shapes[g.round].name}!`); g.msg = `You fixed ${g.shapes[g.round].name}!`; }
          else if (!g.left) { g.state = 'won'; g.t2 = 2; g.msg = 'Out of stars!'; speak('Out of stars! On to the next one.'); }
          else g.state = 'aim';
        }
      } else if (g.state === 'won' && (g.t2 -= dt) <= 0) {
        g.msg = null;
        if (g.round + 1 >= g.rounds) g.done = true; else { g.round++; this.setup(g); }
      }
      g.progress = `Sky ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}   ⭐ ${g.filled}`;
      g.score = g.filled / (g.rounds * [2, 3, 3][g.tier - 1]);
    },
    draw(g) {
      ctx.fillStyle = 'rgba(10,8,40,.28)'; ctx.fillRect(0, 0, W, H);
      const won = g.state === 'won' && !g.stars.some(s => s.gap);
      // constellation lines then stars
      const c = g.shapes[g.round];
      for (const [a, b] of c.edges) {
        const A = g.stars[a], B = g.stars[b], lit = !A.gap && !B.gap;
        ctx.strokeStyle = lit ? `rgba(255,246,190,${won ? 0.75 + 0.25 * Math.sin(S.t * 8) : 0.75})` : 'rgba(200,210,255,.3)';
        ctx.lineWidth = lit ? 4 : 2; ctx.setLineDash(lit ? [] : [6, 8]);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const s of g.stars) {
        if (s.gap) {
          const p = 1 + Math.sin(S.t * 4 + s.x) * 0.08;
          glow(s.x, s.y, g.hitR + 10, '160,200,255', 0.25);
          ctx.strokeStyle = 'rgba(220,235,255,.8)'; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -S.t * 20;
          ctx.beginPath(); ctx.arc(s.x, s.y, 22 * p, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          text('?', s.x, s.y + 1, 20, 'rgba(230,240,255,.85)', 'center', 800);
        } else {
          const pop = 1 + Math.max(0, 0.6 - s.ft) * 0.8;
          glow(s.x, s.y, 34 * pop, '255,240,160', 0.55);
          ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.sin(S.t * 2 + s.x) * 0.12); ctx.scale(pop, pop);
          vecStar(0, 0, 16, '#ffe14a', 1.5); cuteFace(0, 2, 0.55);
          ctx.restore();
        }
      }
      // aim preview
      if (g.state === 'aim' && (g.aiming || g.aimK)) {
        const [px, py] = this.pull(g), { pts, hit } = this.sim(g, -px * SL_K, -py * SL_K, g.preview);
        pts.forEach(([x, y], i) => { if (i % 6) return; ctx.fillStyle = hit >= 0 ? `rgba(255,240,140,${1 - i / pts.length})` : `rgba(255,255,255,${0.85 - i / pts.length * 0.8})`; circle(x, y, 3.5); });
      }
      // slingshot
      const [px, py] = g.state === 'aim' && (g.aiming || g.aimK) ? this.pull(g) : [0, 0];
      const pouch = [SL.x + px, SL.y + py];
      ctx.lineCap = 'round';
      const fork = P2(`M${SL.x - 8},${H} L${SL.x - 8},458 C${SL.x - 10},440 ${SL.x - 44},430 ${SL.x - 48},392 L${SL.x - 34},390 C${SL.x - 30},420 ${SL.x},432 ${SL.x},440 C${SL.x},432 ${SL.x + 30},420 ${SL.x + 34},390 L${SL.x + 48},392 C${SL.x + 44},430 ${SL.x + 10},440 ${SL.x + 8},458 L${SL.x + 8},${H} Z`);
      INK = OL; ink(fork, '#a8703e', 2.5);
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(SL.x - 3, 520); ctx.lineTo(SL.x - 3, 462); ctx.stroke();
      ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(SL.x - 41, 394); ctx.lineTo(pouch[0], pouch[1] + 6); ctx.lineTo(SL.x + 41, 394); ctx.stroke();
      if (g.state === 'aim' && g.left > 0) {
        glow(pouch[0], pouch[1], 40, '255,240,160', 0.6);
        vecStar(pouch[0], pouch[1], 20, '#ffe14a', 1.8); cuteFace(pouch[0], pouch[1] + 2, 0.7, g.aiming || g.aimK ? 'happy' : 'happy');
      }
      // flying star with a sparkly trail
      g.trail.forEach(([x, y], i) => { glow(x, y, 4 + i, '255,230,170', 0.06 * i); });
      if (g.fly) {
        const f = g.fly;
        glow(f.x, f.y, 40, '255,240,160', 0.7);
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.spin); vecStar(0, 0, 18, '#ffe14a', 1.8); ctx.restore();
      }
      // the stars still waiting to go home
      darkPanel(14, 470, 220, 56, 20);
      text('Stars left', 30, 498, 16, '#fff', 'left', 700);
      for (let i = 0; i < g.left; i++) vecStar(124 + i * 22, 498, 9, '#ffe14a', 1);
      if (g.state === 'aim' && !g.aiming && !g.aimK && g.filled === 0 && g.left === g.stars.length) {
        // a hint hand showing how to pull back
        const k = (S.t % 1.6) / 1.6;
        emoji('👆', SL.x + 10, SL.y + 30 + easeOut(Math.min(1, k * 1.5)) * 70, 38);
        outlined('Pull back and let go!', SL.x + 170, 470, 20, '#fff6a8');
      }
      if (g.msg) { panel(W / 2 - 240, 318, 480, 60, 20); outlined(g.msg, W / 2, 348, 28, '#ffb13a', 'center', '#fff'); }
    },
  };

  // --- Skip Count Stars: jars of stars counted by 2s, 5s and 10s; find the missing number ---
  const STEP_WORD = { 2: 'twos', 5: 'fives', 10: 'tens' };
  const starGroup = (n, cx, cy, w) => {
    const cols = n === 2 ? 2 : 5, rows = Math.ceil(n / cols), sz = n === 2 ? 22 : n === 5 ? 13 : 12;
    const gx = Math.min(w / cols, sz * 2.4), gy = sz * 2.3;
    for (let i = 0; i < n; i++) {
      const x = cx + ((i % cols) - (cols - 1) / 2) * gx, y = cy + (Math.floor(i / cols) - (rows - 1) / 2) * gy + (n === 5 && i % 2 ? 8 : 0);
      vecStar(x, y, sz, '#ffe14a', 1.2);
    }
  };
  MG.skipstars = learnGame({
    title: () => 'Skip Count Stars', icon: () => '✨', unit: 'Sky',
    how: () => 'Each cloud holds a group of stars. Count them by twos, fives or tens, and pick the missing number!',
    rounds: g => [5, 6, 6][g.tier - 1],
    make(g) {
      const steps = g.tier === 1 ? [2, 5, 2, 5, 10] : [2, 5, 10, 2, 5, 10];
      const step = steps[g.round % steps.length];
      // every cloud holds one group, so the first number is always one group's worth
      const seq = Array.from({ length: 5 }, (_, i) => (i + 1) * step);
      const miss = g.tier === 1 ? randInt(3, 4) : g.tier === 2 ? randInt(1, 4) : randInt(0, 4);
      const ans = seq[miss], set = new Set([ans]);
      for (const d of shuffle([1, -1, step, -step + (miss === 4 ? 0 : 2 * step), 2, -2])) { if (set.size >= [3, 4, 4][g.tier - 1]) break; const v = ans + d; if (v > 0 && v !== ans) set.add(v); }
      g.choices = shuffle([...set]); g.answer = g.choices.indexOf(ans);
      Object.assign(g, { step, seq, miss });
      g.say = `Count by ${STEP_WORD[step]}! ${seq.map((v, i) => (i === miss ? 'hmm' : v)).join(', ')}. Which number is missing?`;
    },
    check: (g, i) => i === g.answer,
    onRight(g) {
      SFX.hit(); burst(this.cardX(g.miss) + 70, 300, 24);
      g.seq.forEach((_, i) => tone(523 * Math.pow(1.122, i), 0.2, 'triangle', 0.07, 0.25 + i * 0.28));
      speak(`Yes! ${g.seq.join(', ')}!`);
    },
    onWrong(g, i) { speak(g.miss ? `Not ${g.choices[i]}. Count on by ${STEP_WORD[g.step]} from ${g.seq[g.miss - 1]}.` : `Not ${g.choices[i]}. Count the stars in the first cloud!`); },
    cardX: rowX(5, 150, 22),
    draw(g) {
      ctx.fillStyle = 'rgba(10,8,40,.3)'; ctx.fillRect(0, 0, W, H);
      panel(W / 2 - 260, 68, 520, 56, 22);
      outlined(`Count by ${g.step}s!`, W / 2, 97, 32, '#ffb13a', 'center', '#fff');
      g.seq.forEach((v, i) => {
        const x = this.cardX(i), y = 150, lit = g.state === 'yay' && g.fx > 0.25 + i * 0.28;
        // a little night cloud holding the group
        if (lit) glow(x + 75, y + 90, 110, '255,240,160', 0.5);
        const col = lit ? '#6a5ac8' : '#4a3a9a', bumps = [[42, 64, 30], [80, 50, 38], [116, 66, 28]];
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4;
        for (const [dx, dy, r] of bumps) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.stroke(); }
        ctx.beginPath(); ctx.roundRect(x + 6, y + 56, 138, 76, 32); ctx.stroke();
        ctx.fillStyle = col; for (const [dx, dy, r] of bumps) circle(x + dx, y + dy, r);
        ctx.beginPath(); ctx.roundRect(x + 6, y + 56, 138, 76, 32); ctx.fill();
        starGroup(g.step, x + 75, y + 88, 126);
        // the running total underneath
        const ty = y + 186;
        if (i === g.miss && g.state === 'pick') {
          const p = 1 + Math.sin(S.t * 5) * 0.06;
          inkCircle(x + 75, ty, 30 * p, '#ffe14a', 2); text('?', x + 75, ty + 2, 32, '#5a2a6e', 'center', 800);
        } else {
          inkCircle(x + 75, ty, 30, i === g.miss ? '#7ff0a0' : '#fff6e0', 2);
          text(String(v), x + 75, ty + 2, 28, '#5a2a6e', 'center', 800);
        }
        if (i < 4) { const ax = x + 150 + 11; outlined(`+${g.step}`, ax, ty - 36, 15, '#fff6a8'); ctx.strokeStyle = 'rgba(255,246,168,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ax, ty - 2, 20, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      });
      const n = g.choices.length, bw = 150, bx = rowX(n, bw, 22);
      g.choices.forEach((v, i) => {
        const used = g.tried.includes(i), right = g.state === 'yay' && i === g.answer;
        button(`ch:${i}`, bx(i) + shakeX(g, i), 418, bw, 92, '', { color: right ? '#ffc83d' : used ? '#c9bcd4' : CHOICE_COLS[i], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        outlined(String(v), bx(i) + bw / 2 + shakeX(g, i), 462, 46, '#fff', 'center', 'rgba(60,20,80,.6)');
      });
    },
  });

  restage('shootingstar', {
    bg: 'shootingstar_bg',
    games: [['starsling', 'stardust', {}], ['skipstars', 'crystal', {}]],
    intro: ['*:At the top of the hill, a tiny star has fallen and is crying.', 'N:Boo-hoo! All my star friends tumbled out of the sky, and now the constellations have holes in them!', "A:determined:Then let's fling them home! Good thing I've got a slingshot."],
    mid: ["N:You did it! Now let's count my star friends. Stars twinkle in groups, so we count by twos, fives and tens!", 'A:thinking:Two, four, six... I can do that!'],
    outro: ['N:The whole sky is shining again! Here is some stardust and a star crystal, from all of us.', 'A:happy:Twinkle, twinkle, little friend!'],
  });

  // =====================================================================================
  // 2. RAINBOW'S END — Seamus Shamrock
  // =====================================================================================
  const ROY = [['red', '#ff4a4a'], ['orange', '#ff9a2a'], ['yellow', '#ffdf2a'], ['green', '#3fcf5a'], ['blue', '#3a9cff'], ['indigo', '#5a4ad0'], ['violet', '#b45ae6']];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  // a puffy storybook cloud: outline every puff first, then fill, so it reads as one shape
  const puffCloud = (x, y, s, fill = '#ffffff', line = 'rgba(120,140,200,.55)') => {
    const puffs = [[-34, 4, 20], [-14, -10, 26], [14, -14, 24], [36, 2, 18], [0, 8, 22]];
    ctx.strokeStyle = line; ctx.lineWidth = 4;
    for (const [dx, dy, r] of puffs) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = fill; for (const [dx, dy, r] of puffs) circle(x + dx * s, y + dy * s, r * s);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(x - 10 * s, y - 16 * s, 12 * s, 6 * s, -0.3);
  };
  const clover = (x, y, r, col = '#3fae4a') => {
    ctx.strokeStyle = '#2a7a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + r * 0.4, y + r, x + r * 0.2, y + r * 1.6); ctx.stroke();
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; inkCircle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.52, col, 0.8, '#2a7a3a'); }
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; ctx.fillStyle = col; circle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.52); }
  };
  const coin = (x, y, r) => { inkEllipse(x, y, r, r * 0.8, 0, '#ffd23a', 1, '#b07a10'); ctx.fillStyle = '#fff3a0'; ellipse(x - r * 0.3, y - r * 0.25, r * 0.3, r * 0.18); };
  const RB_C = { x: 140, y: 560, r: 430, w: 20 };
  BACKDROPS.rainbowend_bg = () => {
    ctx.fillStyle = vgrad(0, GY, ['#3fb4ff', '#8fd8ff', '#e9f9ff']); ctx.fillRect(0, 0, W, H);
    bdSunburst(820, 130);
    for (const [x0, y, s, v] of [[120, 120, 1, 6], [520, 96, 0.8, 9], [760, 220, 0.7, 5], [330, 200, 0.6, 11]]) puffCloud(((x0 + S.t * v) % (W + 200)) - 100, y, s);
    // birds
    ctx.strokeStyle = '#4a4a7a'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const bx = (S.t * 30 + i * 60) % (W + 100) - 50, by = 150 + i * 14 + Math.sin(S.t * 2 + i) * 5, f = Math.sin(S.t * 8 + i) * 4; ctx.beginPath(); ctx.moveTo(bx - 8, by - f); ctx.quadraticCurveTo(bx - 3, by - 4, bx, by); ctx.quadraticCurveTo(bx + 3, by - 4, bx + 8, by - f); ctx.stroke(); }
    // far clover hills
    bdHills('#a8ec92', 338, 22, 0.006, 0.5);
    bdHills('#8be078', 372, 16, 0.01, 2);
    ctx.fillStyle = 'rgba(60,150,70,.25)'; for (let i = 0; i < 30; i++) ellipse((i * 131) % W, 360 + (i * 17) % 40, 6, 3);
    // the huge rainbow, landing in the pot of gold
    const { x: cx, y: cy, r: R, w: bw } = RB_C, end = TAU - Math.asin((cy - 402) / (R - 3 * bw));
    glow(380, 330, 260, '255,255,255', 0.25);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = OL; ctx.lineWidth = bw * 7 + 6; ctx.beginPath(); ctx.arc(cx, cy, R - bw * 3, Math.PI, end); ctx.stroke();
    ROY.forEach(([, c], i) => { ctx.strokeStyle = c; ctx.lineWidth = bw + 0.5; ctx.beginPath(); ctx.arc(cx, cy, R - i * bw, Math.PI, end); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R - 6, Math.PI, end); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = Math.PI + ((S.t * 0.08 + i / 6) % 1) * (end - Math.PI), rr = R - 70; star(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 5, 'rgba(255,255,255,.85)', 4); }
    // the pot of gold
    const px = 438, py = 404;
    glow(px, py - 30, 150, '255,220,90', 0.5 + 0.1 * Math.sin(S.t * 2));
    ctx.save(); ctx.translate(px, py);
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(-0.9 + i * 0.45 + Math.sin(S.t + i) * 0.05); ctx.fillStyle = 'rgba(255,240,150,.28)'; tri(-10, -30, 10, -30, 0, -150); ctx.restore(); }
    for (const [dx, dy, r] of [[-60, -38, 13], [-38, -50, 14], [-12, -58, 15], [16, -56, 14], [42, -48, 13], [62, -36, 12], [-28, -40, 13], [4, -44, 14], [32, -40, 13]]) coin(dx, dy, r);
    INK = OL;
    ink(P2('M-86,-34 C-92,-4 -76,30 -44,40 L44,40 C76,30 92,-4 86,-34 Z'), '#2e2640', 2.5);
    inkRect(-56, 36, 14, 14, '#2e2640', 2, 3); inkRect(42, 36, 14, 14, '#2e2640', 2, 3);
    inkEllipse(0, -34, 90, 13, 0, '#463a5e', 2.5);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ellipse(-48, 0, 12, 22, 0.3);
    for (const [dx, dy, r] of [[-40, -38, 12], [-14, -42, 13], [12, -42, 12], [38, -38, 12]]) coin(dx, dy, r);
    ctx.restore();
    for (let i = 0; i < 4; i++) { const k = (S.t * 0.7 + i / 4) % 1; star(px - 50 + i * 34, py - 70 - k * 60, 6 * (1 - k), `rgba(255,250,200,${1 - k})`, 4); }
    // front clover meadow
    const meadow = P2(`M0,${H} L0,436 C160,418 320,430 480,426 C660,420 800,430 ${W},420 L${W},${H} Z`);
    ctx.fillStyle = vgrad(418, H, ['#6fd25e', '#4fbf4f', '#3aa844']); ctx.fill(meadow);
    ctx.strokeStyle = 'rgba(40,110,50,.5)'; ctx.lineWidth = 2.5; ctx.stroke(meadow);
    ctx.fillStyle = '#86de70'; for (let i = 0; i < 34; i++) ellipse((i * 211) % W, 448 + (i * 37) % 86, 16, 4);
    for (let i = 0; i < 16; i++) clover(20 + i * 62 + (i % 2) * 14, 446 + (i * 29) % 70, 7 + (i % 3) * 1.5, ['#3fae4a', '#4fc25a', '#36a040'][i % 3]);
    clover(160, 436, 11, '#5fd06a'); clover(600, 452, 10, '#5fd06a');
    for (const [x, y] of [[340, 470], [520, 500], [90, 520], [880, 512], [640, 528]]) { coin(x, y, 7); star(x + 6, y - 7, 3 + Math.abs(Math.sin(S.t * 3 + x)) * 3, '#fffbe0', 4); }
    for (let i = 0; i < 9; i++) flower(55 + i * 108, 486 + (i % 3) * 16, 6, ['#fff', '#ffd84a', '#ff9acb'][i % 3], '#ffd84a', 1);
    // toadstool cottage and a signpost
    INK = OL;
    ink(P2('M852,436 C848,408 850,388 856,370 L908,370 C914,388 916,408 912,436 Z'), '#fff2dc', 2.5);
    inkRect(868, 400, 24, 36, '#b07a4a', 2, 10); inkCircle(886, 420, 2, '#ffd23a', 1);
    inkCircle(898, 384, 6, '#9fe0ff', 1.5);
    ink(P2('M816,376 C820,320 944,320 948,376 C920,384 844,384 816,376 Z'), '#ff4a5a', 2.5);
    ctx.fillStyle = '#fff'; for (const [dx, dy, r] of [[846, 356, 8], [880, 340, 7], [914, 354, 9], [932, 370, 4], [832, 372, 4]]) circle(dx, dy, r);
    inkRect(64, 380, 8, 58, '#a0683a', 1.5, 2);
    ink(P2('M24,372 L118,372 L132,388 L118,404 L24,404 Z'), '#e0a060', 2);
    text("Rainbow's End", 74, 388, 12, '#5a3a2a', 'center', 800);
    // butterflies
    emoji('🦋', 300 + Math.sin(S.t * 0.8) * 70, 300 + Math.sin(S.t * 2.3) * 16, 20);
    emoji('🦋', 640 + Math.sin(S.t * 1.1 + 1) * 50, 470 + Math.sin(S.t * 2.6) * 12, 16);
  };

  // --- Colour Gates: run through rainbow gates; switch to each gate's colour to pass ---
  const GATE_SETS = { 1: [0, 2, 4], 2: [0, 2, 3, 4], 3: [0, 1, 2, 3, 4] };
  const GA = { x: 230, gy: 404 };
  const RUN_FRAMES = ['run1', 'run2', 'run3', 'run4', 'run5'];
  MG.colourgates = {
    kind: 'action', title: () => 'Colour Gates', icon: () => '🌈',
    how: () => 'Magic gates are coming! Press a colour button (or a number key) to turn that colour. Match each gate and you run right through!',
    init(g) {
      const cols = GATE_SETS[g.tier], total = [12, 16, 20][g.tier - 1], gap = [2.4, 2.1, 1.8][g.tier - 1];
      Object.assign(g, { cols, me: 0, dist: 0, base: [200, 230, 260][g.tier - 1], gates: [], total, passed: 0, stumble: 0, said: -1, flash: 0 });
      let x = 760, prev = 0;
      for (let i = 0; i < total; i++) {
        let c = randInt(0, cols.length - 1);
        if (c === prev && Math.random() < 0.75) c = (c + randInt(1, cols.length - 1)) % cols.length;
        g.gates.push({ x, c, state: 0, t: 0 }); prev = c;
        x += g.base * gap * rand(0.85, 1.15);
      }
      g.end = x;
      g.say = 'Turn the same colour as the gate to run through it!';
    },
    start(g) { speak(g.say); },
    setColour(g, i) { if (i === g.me) return; g.me = i; g.flash = 0.3; tone(500 + i * 90, 0.12, 'triangle', 0.08); burst(GA.x, GA.gy - 150, 8, { colors: [ROY[g.cols[i]][1], '#ffffff'], spread: 80, up: 20 }); },
    update(g, dt, id) {
      const n = g.cols.length;
      const i = choiceIndex(id, n);
      if (i >= 0) this.setColour(g, i);
      if (pressed.arrowleft || pressed.a) this.setColour(g, (g.me + n - 1) % n);
      if (pressed.arrowright || pressed.d) this.setColour(g, (g.me + 1) % n);
      g.flash = Math.max(0, g.flash - dt); g.stumble = Math.max(0, g.stumble - dt);
      const speed = g.base * (1 + 0.35 * g.dist / g.end) * (g.stumble > 0 ? 0.45 : 1);
      g.dist += speed * dt;
      g.gates.forEach((gt, k) => {
        const sx = gt.x - g.dist + GA.x;
        if (gt.state) gt.t += dt;
        // call out each gate's colour as it comes into view
        if (sx < W - 40 && g.said < k) { g.said = k; speak(cap(ROY[g.cols[gt.c]][0])); }
        if (!gt.state && sx <= GA.x) {
          if (gt.c === g.me) {
            gt.state = 1; g.passed++; SFX.hit();
            burst(GA.x, GA.gy - 90, 26, { colors: [ROY[g.cols[gt.c]][1], '#ffffff', '#fff6a8'] });
            floatText(GA.x, GA.gy - 190, pick(['Whoosh!', 'Yes!', 'Colour match!']), '#fff6a8', false, 24);
          } else {
            gt.state = 2; g.stumble = 0.6; SFX.miss(); floatText(GA.x, GA.gy - 190, 'Bonk! Wrong colour!', '#ffb0c4', false, 24);
          }
        }
      });
      g.progress = `Gates ${g.passed} of ${g.total}`;
      g.score = g.passed / g.total;
      if (g.dist > g.end + 200) g.done = true;
    },
    gate(g, gt, sx) {
      const [name, col] = ROY[g.cols[gt.c]], top = GA.gy - 210, open = gt.state === 1;
      // shimmering colour curtain (it pops open when you match)
      if (!open) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(sx - 50, GA.gy); ctx.lineTo(sx - 50, top + 60); ctx.arc(sx, top + 60, 50, Math.PI, 0); ctx.lineTo(sx + 50, GA.gy); ctx.closePath(); ctx.clip();
        ctx.fillStyle = col; ctx.globalAlpha = gt.state === 2 ? 0.35 : 0.6; ctx.fillRect(sx - 52, top, 104, 220);
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 5; k++) ctx.fillRect(sx - 46 + k * 22 + Math.sin(S.t * 3 + k) * 4, top, 5, 220);
        ctx.restore(); ctx.globalAlpha = 1;
      }
      // posts and arch
      INK = OL;
      ctx.lineCap = 'butt';
      ctx.strokeStyle = OL; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(sx - 56, GA.gy); ctx.lineTo(sx - 56, top + 60); ctx.arc(sx, top + 60, 56, Math.PI, 0); ctx.lineTo(sx + 56, GA.gy); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 16; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx - 60, GA.gy - 6); ctx.lineTo(sx - 60, top + 60); ctx.arc(sx, top + 60, 60, Math.PI, Math.PI * 1.4); ctx.stroke();
      inkCircle(sx, top + 2, 12, '#ffd23a', 2);
      // the colour's name on a plaque
      ctx.font = `800 20px ${FONT}`; const tw = ctx.measureText(name.toUpperCase()).width + 24;
      rrect(sx - tw / 2, top + 28, tw, 30, 12, '#fffaf0', OL, 2.5);
      text(name.toUpperCase(), sx, top + 44, 20, mix(col, '#2a1a3a', 0.25), 'center', 800);
      if (open) for (let k = 0; k < 4; k++) star(sx + Math.cos(S.t * 4 + k * 1.6) * 40, top + 110 + Math.sin(S.t * 4 + k * 1.6) * 60, 6, '#fff6a8', 4);
    },
    draw(g) {
      // road of golden bricks along the clover bank
      ctx.fillStyle = '#4fbf4f'; ctx.fillRect(0, GA.gy - 8, W, H - GA.gy + 8);
      ctx.fillStyle = vgrad(GA.gy - 12, GA.gy + 34, ['#ffe27a', '#f3b84a']); ctx.fillRect(0, GA.gy - 12, W, 44);
      ctx.strokeStyle = 'rgba(160,100,30,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GA.gy - 12); ctx.lineTo(W, GA.gy - 12); ctx.moveTo(0, GA.gy + 10); ctx.lineTo(W, GA.gy + 10); ctx.moveTo(0, GA.gy + 32); ctx.lineTo(W, GA.gy + 32); ctx.stroke();
      for (let row = 0; row < 2; row++) for (let x = -((g.dist + row * 22) % 44); x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, GA.gy - 12 + row * 22); ctx.lineTo(x, GA.gy + 10 + row * 22); ctx.stroke(); }
      for (let x = -(g.dist % 90); x < W; x += 90) clover(x + 30, GA.gy + 48, 7);
      // gates behind Aubrey
      for (const gt of g.gates) { const sx = gt.x - g.dist + GA.x; if (sx > -80 && sx < W + 80) this.gate(g, gt, sx); }
      // Aubrey, with a big orb of her colour
      const col = ROY[g.cols[g.me]][1];
      glow(GA.x, GA.gy - 70, 90, hexRgb(col).join(','), 0.45);
      const fr = g.stumble > 0 ? 'crouch' : RUN_FRAMES[Math.floor(S.t * 12) % 5];
      drawAubrey(GA.x, GA.gy, fr, 1, g.stumble > 0 ? 0 : Math.abs(Math.sin(S.t * 12)) * 4, 0.56);
      const oy = GA.gy - 160 + Math.sin(S.t * 5) * 4, os = 1 + g.flash;
      ctx.strokeStyle = '#8a7a9a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(GA.x + 18, GA.gy - 80); ctx.lineTo(GA.x + 22, oy + 20); ctx.stroke();
      inkCircle(GA.x + 22, oy, 20 * os, col, 2); ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(GA.x + 15, oy - 7, 6, 4, -0.5);
      // colour buttons
      const n = g.cols.length, bw = n > 4 ? 160 : 180, bx = rowX(n, bw, 14);
      g.cols.forEach((ci, i) => {
        const [name, c] = ROY[ci], sel = i === g.me;
        if (sel) rrect(bx(i) - 5, 457, bw + 10, 76, 20, '#ffffff', OL, 3);
        button(`ch:${i}`, bx(i), 462, bw, 66, '', { color: c, key: String(i + 1) });
        outlined(cap(name), bx(i) + bw / 2, 495, 24, '#fff', 'center', 'rgba(50,20,70,.75)');
      });
    },
  };

  // --- Rainbow Order: paint the rainbow in order, find colours by name, spot the missing colour ---
  const RO = { x: 480, y: 392, r: 236, w: 26 };
  const RO_ROUNDS = { 1: ['build', 'find', 'find', 'missing', 'find'], 2: ['build', 'find', 'missing', 'find', 'missing'], 3: ['build', 'missing', 'find', 'missing', 'find', 'missing'] };
  MG.rainboworder = learnGame({
    title: () => 'Rainbow Order', icon: () => '🎨', yay: 2.6,
    how: () => "Seamus's rainbow lost its colours! Paint them back in order, find colours by name, and spot the missing colour.",
    rounds: g => RO_ROUNDS[g.tier].length,
    lockWrong: false,
    make(g) {
      g.kind = RO_ROUNDS[g.tier][g.round];
      if (g.kind === 'build') {
        g.bands = ROY.map(() => false); g.nextC = 0; g.choices = shuffle(ROY.map((_, i) => i));
        g.say = 'Paint the rainbow! Tap the colours in order. Red comes first!';
      } else if (g.kind === 'find') {
        g.bands = ROY.map(() => true);
        do g.target = randInt(0, 6); while (g.target === g.lastFind);
        g.lastFind = g.target; g.choices = shuffle(ROY.map((_, i) => i));
        g.say = `Find ${ROY[g.target][0]}! Tap the ${ROY[g.target][0]} stripe or paint pot.`;
      } else {
        g.target = randInt(0, 6); g.bands = ROY.map((_, i) => i !== g.target);
        g.choices = shuffle([g.target, ...shuffle(ROY.map((_, i) => i).filter(i => i !== g.target)).slice(0, [2, 3, 3][g.tier - 1])]);
        g.say = 'One colour is missing from the rainbow! Which colour goes in the gap?';
      }
      g.answer = g.choices.indexOf(g.kind === 'build' ? 0 : g.target);
    },
    input(g, id) {
      // tap a stripe of the rainbow (find rounds)
      if (g.kind === 'find' && pointer.clicked) {
        const d = Math.hypot(pointer.x - RO.x, pointer.y - RO.y);
        if (pointer.y < RO.y && d < RO.r + RO.w / 2 && d > RO.r - 6.5 * RO.w) return g.choices.indexOf(clamp(Math.round((RO.r - d) / RO.w), 0, 6));
      }
      const i = choiceIndex(id, g.choices.length);
      return g.kind === 'build' && i >= 0 && g.bands[g.choices[i]] ? -1 : i;
    },
    check(g, i) {
      const c = g.choices[i];
      if (g.kind !== 'build') return c === g.target;
      if (c !== g.nextC) return false;
      g.bands[c] = true; g.nextC++; SFX.pop(); tone(400 + c * 70, 0.2, 'triangle', 0.08);
      burst(RO.x - (RO.r - c * RO.w), RO.y - 20, 10, { colors: [ROY[c][1], '#fff'] });
      if (g.nextC === 7) return true;
      g.answer = g.choices.indexOf(g.nextC); speak(cap(ROY[c][0]));
      return 'step';
    },
    roundScore: g => (g.kind === 'build' ? Math.max(0, 1 - 0.15 * g.wrongs) : tryScore(g.wrongs)),
    onRight(g) {
      SFX.sparkle(); burst(RO.x, RO.y - RO.r, 30, { colors: ROY.map(c => c[1]) });
      if (g.kind === 'build') { g.bands = ROY.map(() => true); speak('Red, orange, yellow, green, blue, indigo, violet! A perfect rainbow!'); }
      else if (g.kind === 'find') speak(`Yes! That's ${ROY[g.target][0]}!`);
      else { g.bands = ROY.map(() => true); speak(`Yes! ${cap(ROY[g.target][0])} goes between ${ROY[g.target - 1]?.[0] ?? 'the edge'} and ${ROY[g.target + 1]?.[0] ?? 'the edge'}!`); }
    },
    onWrong(g, i) {
      const c = g.choices[i];
      if (g.kind === 'build') speak(g.nextC === 0 ? 'Red comes first!' : `Not yet! What comes after ${ROY[g.nextC - 1][0]}?${g.wrongs > 1 ? ` It's ${ROY[g.nextC][0]}!` : ''}`);
      else if (g.kind === 'find') speak(`That's ${ROY[c][0]}. Find ${ROY[g.target][0]}!`);
      else { g.tried.push(i); speak(`Not ${ROY[c][0]}. Look at the colours on each side of the gap!`); }
    },
    draw(g) {
      // prompt
      panel(W / 2 - 300, 66, 600, 58, 22);
      if (g.kind === 'find' && g.state === 'pick') {
        text('Find', W / 2 - 40, 96, 26, '#5a2a6e', 'right', 700);
        outlined(ROY[g.target][0].toUpperCase(), W / 2 - 28, 96, 34, '#fff', 'left', '#5a2a6e');
      } else {
        const msg = g.state === 'yay' ? 'Beautiful rainbow!' : g.kind === 'build' ? (g.nextC === 0 ? 'Paint in order: red comes first!' : 'Which colour comes next?') : 'Which colour is missing?';
        text(msg, W / 2, 96, 26, '#5a2a6e', 'center', 700);
      }
      // the rainbow
      const { x, y, r, w } = RO;
      if (g.state === 'yay') glow(x, y - 100, 280, '255,255,255', 0.5);
      ctx.lineCap = 'butt';
      ctx.strokeStyle = OL; ctx.lineWidth = w * 7 + 6; ctx.beginPath(); ctx.arc(x, y, r - w * 3, Math.PI, TAU); ctx.stroke();
      ROY.forEach(([, c], i) => {
        const rr = r - i * w;
        ctx.strokeStyle = g.bands[i] ? c : '#f4eef8'; ctx.lineWidth = w + 0.5;
        ctx.beginPath(); ctx.arc(x, y, rr, Math.PI, TAU); ctx.stroke();
        if (!g.bands[i]) {
          ctx.strokeStyle = 'rgba(150,120,180,.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.arc(x, y, rr, Math.PI, TAU); ctx.stroke(); ctx.setLineDash([]);
          if (g.kind === 'missing' || (g.kind === 'build' && i === g.nextC)) {
            const p = 1 + Math.sin(S.t * 5) * 0.1;
            inkCircle(x, y - rr, 15 * p, '#fff6a8', 1.5); text('?', x, y - rr + 1, 18, '#5a2a6e', 'center', 800);
          }
        }
      });
      if (g.state === 'yay') for (let k = 0; k < 7; k++) { const a = Math.PI + ((g.fx * 0.5 + k / 7) % 1) * Math.PI, rr = r - 3 * w; star(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 8, '#ffffff', 4); }
      puffCloud(x - r + 3 * w, y - 4, 1.25); puffCloud(x + r - 3 * w, y - 4, 1.25);
      // paint pots
      const n = g.choices.length, bw = n > 4 ? 118 : 150, bx = rowX(n, bw, 12);
      g.choices.forEach((c, i) => {
        const [name, col] = ROY[c], used = (g.kind === 'build' && g.bands[c]) || g.tried.includes(i), right = g.state === 'yay' && i === g.answer;
        const X = bx(i) + shakeX(g, i);
        button(`ch:${i}`, X, 414, bw, 116, '', { color: right ? '#ffc83d' : used ? '#d8cfe0' : '#fff3fa', on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        ctx.globalAlpha = used ? 0.35 : 1;
        const cx = X + bw / 2, cy = 456;
        INK = OL;
        ink(P2(`M${cx - 30},${cy - 18} L${cx - 24},${cy + 26} C${cx - 10},${cy + 32} ${cx + 10},${cy + 32} ${cx + 24},${cy + 26} L${cx + 30},${cy - 18} Z`), '#c8d4e8', 2);
        inkEllipse(cx, cy - 18, 30, 9, 0, col, 2);
        ctx.fillStyle = col; ellipse(cx - 12, cy - 8, 6, 12); circle(cx - 12, cy + 2, 6);
        ctx.strokeStyle = '#8a8aa0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy - 18, 30, Math.PI * 1.05, Math.PI * 1.95, true); ctx.stroke();
        if (g.kind !== 'find') text(name, cx, cy + 50, 18, '#5a2a6e', 'center', 700);
        ctx.globalAlpha = 1;
      });
    },
  });

  restage('rainbowend', {
    bg: 'rainbowend_bg',
    games: [['colourgates', 'rainbow', {}], ['rainboworder', 'honey', {}]],
    intro: ["*:You follow the rainbow all the way to its end. It's real!", "N:Top o' the mornin'! To reach me pot o' gold, ye must run through the magic rainbow gates.", 'N:But a gate only lets ye through if ye turn the very same colour!', "A:excited:Red, yellow, blue... I'm ready!"],
    mid: ["N:Grand job! Oh no, look! The rain washed the colours right off me rainbow!", 'N:Can ye paint them back in the right order? Red always comes first.', 'A:thinking:Red, orange, yellow... I know this one!'],
    outro: ["N:Me rainbow's never looked so bonny! Take some rainbow drops, and a pot o' golden honey.", 'A:laughing:Honey from a pot of gold? Lucky me!'],
  });

  // =====================================================================================
  // 3. MOONLIGHT LAKE — Marina the Mermaid
  // =====================================================================================
  const lotus = (x, y, s, petal = '#ffc4e6') => {
    glow(x, y - 6 * s, 30 * s, '255,190,240', 0.55 + 0.15 * Math.sin(S.t * 2 + x));
    INK = OL;
    for (const [a, l] of [[-1.1, 14], [1.1, 14], [-0.55, 17], [0.55, 17], [0, 19]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ink(P2(`M0,0 C${-6 * s},${-l * 0.5 * s} ${-4 * s},${-l * s} 0,${-l * s} C${4 * s},${-l * s} ${6 * s},${-l * 0.5 * s} 0,0 Z`), a === 0 ? '#fff0fa' : petal, 1); ctx.restore();
    }
    ctx.fillStyle = '#ffe66a'; circle(x, y - 4 * s, 2.5 * s);
  };
  const lilyPadSide = (x, y, r) => { inkEllipse(x, y, r, r * 0.28, 0, '#3f9a6a', 1.2, '#1e4a3a'); ctx.fillStyle = '#2a4a8a'; tri(x, y, x + r, y - r * 0.1, x + r, y + r * 0.1); };
  BACKDROPS.moonlake_bg = () => {
    ctx.fillStyle = vgrad(0, 320, ['#0b1240', '#1a2468', '#33388a', '#6a5aa8']); ctx.fillRect(0, 0, W, H);
    for (const s of SKY_STARS) if (s.y < 290) { ctx.fillStyle = `rgba(${s.c},${0.35 + 0.65 * Math.abs(Math.sin(S.t * 0.7 + s.p))})`; circle(s.x, s.y, s.s * 0.9); }
    drawMeteors(0.12);
    // the big moon, centred over the lake
    glow(480, 128, 170, '230,235,255', 0.3); glow(480, 128, 80, '255,255,240', 0.5);
    inkCircle(480, 128, 52, '#fffbe6', 1.5, 'rgba(255,250,220,.9)');
    ctx.fillStyle = 'rgba(220,215,190,.5)'; circle(462, 112, 11); circle(498, 140, 8); circle(474, 152, 6); circle(500, 108, 5);
    // far hills and pines
    bdHills('#262c6a', 300, 14, 0.008, 1);
    ctx.fillStyle = '#18204e';
    for (let i = 0; i < 26; i++) {
      const x = i * 39 + (i % 3) * 7, h = 26 + (i * 17) % 22, y = 306 - Math.sin(x * 0.008 + 1) * 10;
      ctx.fillRect(x - 2, y - 4, 4, 8); tri(x - 11, y, x, y - h, x + 11, y); tri(x - 8, y - h * 0.45, x, y - h * 1.15, x + 8, y - h * 0.45);
    }
    // the lake, with the moon's wobbly reflection
    ctx.fillStyle = vgrad(304, 450, ['#3a4a9c', '#24307a', '#182258']); ctx.fillRect(0, 304, W, 150);
    ctx.fillStyle = 'rgba(160,180,255,.35)'; ctx.fillRect(0, 304, W, 2);
    for (let i = 0; i < 12; i++) {
      const y = 312 + i * 11, w = (60 - i * 2.5) * (0.8 + 0.25 * Math.sin(S.t * 2 + i * 1.3));
      ctx.fillStyle = `rgba(255,250,215,${0.75 - i * 0.05})`; ellipse(480 + Math.sin(S.t * 1.5 + i) * 5, y, w, 2.6);
    }
    ctx.strokeStyle = 'rgba(190,210,255,.35)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const x = (i * 131 + S.t * 10) % W, y = 320 + (i * 29) % 120; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 3, x + 24, y); ctx.stroke(); }
    for (const s of SKY_STARS.slice(0, 30)) { ctx.fillStyle = `rgba(255,255,240,${0.2 + 0.3 * Math.abs(Math.sin(S.t + s.p))})`; circle(s.x, 310 + (s.y - 60) * 0.4, 1); }
    // glowing water lilies
    for (const [x, y, r, b] of [[230, 352, 22, 1], [300, 396, 16, 0], [640, 340, 18, 1], [600, 410, 24, 1], [380, 330, 12, 0], [180, 418, 18, 1], [720, 380, 14, 0]]) { lilyPadSide(x, y, r); if (b) lotus(x - 3, y - 2, r / 22 + 0.3); }
    // the mermaid rock with shells and a starfish
    INK = OL;
    ink(P2('M800,420 C792,380 812,336 852,330 C892,324 930,350 940,388 C946,410 940,422 930,424 Z'), '#6a6a9a', 2.5);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ellipse(842, 348, 22, 8, -0.3);
    ctx.fillStyle = '#4e4e7e'; ellipse(900, 404, 24, 10, 0.2);
    ctx.strokeStyle = '#3aa88a'; ctx.lineWidth = 4;
    for (const [x, h] of [[812, 40], [826, 30], [928, 36]]) { ctx.beginPath(); ctx.moveTo(x, 420); ctx.quadraticCurveTo(x + Math.sin(S.t * 2 + x) * 8, 420 - h / 2, x + 2, 420 - h); ctx.stroke(); }
    emoji('🐚', 872, 338, 20); emoji('⭐', 902, 360, 16);
    ctx.fillStyle = 'rgba(255,250,215,.35)'; ellipse(870, 430, 80, 6);
    // moonlit near bank: jetty, lanterns, a little lantern boat, reeds and pebbles
    const bank = P2(`M0,${H} L0,432 C200,446 380,438 560,444 C740,450 860,436 ${W},440 L${W},${H} Z`);
    ctx.fillStyle = vgrad(432, H, ['#3c6a72', '#2a5060', '#1e3a4c']); ctx.fill(bank);
    ctx.strokeStyle = 'rgba(180,230,255,.35)'; ctx.lineWidth = 2.5; ctx.stroke(bank);
    inkRect(0, 420, 150, 12, '#8a6a5a', 2, 2);
    for (const x of [14, 70, 130]) inkRect(x, 430, 8, 24, '#6a4a3a', 1.5, 2);
    ink(P2('M40,398 C60,416 140,416 160,398 L150,392 L50,392 Z'), '#c9844e', 2);
    inkRect(96, 366, 4, 28, '#4a3a5a', 1, 1); glow(98, 362, 30, '255,210,120', 0.7); inkCircle(98, 362, 6, '#ffe08a', 1.5);
    for (const x of [176, 560]) {
      inkRect(x - 3, 380, 6, 66, '#4a3a5a', 1.5, 2);
      glow(x, 374, 44, '255,210,120', 0.55 + 0.1 * Math.sin(S.t * 3 + x)); inkRect(x - 10, 362, 20, 22, '#ffe08a', 2, 5); inkRect(x - 12, 357, 24, 6, '#4a3a5a', 1.5, 2);
    }
    for (const [x0, n] of [[24, 6], [930, 5], [640, 3]]) for (let i = 0; i < n; i++) {
      const x = x0 + i * 6, h = 40 + (i * 13) % 26, sw = Math.sin(S.t * 1.5 + i) * 3;
      ctx.strokeStyle = '#2a6a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 450); ctx.quadraticCurveTo(x + sw, 450 - h / 2, x + sw * 1.5, 450 - h); ctx.stroke();
      if (i % 2) inkRect(x + sw * 1.5 - 3, 450 - h - 12, 6, 14, '#7a4a3a', 1, 3);
    }
    for (let i = 0; i < 14; i++) inkEllipse(30 + i * 70 + (i % 3) * 9, 470 + (i * 23) % 60, 6 + (i % 3) * 2, 3.5 + (i % 2), 0, ['#8a9ab8', '#a0aac8', '#7a88a8'][i % 3], 0.8);
    for (const [x, y] of [[90, 500], [330, 520], [800, 500], [610, 528]]) { glow(x, y, 16, '160,255,220', 0.5); flower(x, y, 6, '#bff8ff', '#fff6c0', 0.8); }
    // fireflies
    for (let i = 0; i < 14; i++) {
      const fx = (i * 71 + Math.sin(S.t * 0.5 + i) * 50 + 960) % W, fy = 260 + (i * 47) % 230 + Math.sin(S.t * 1.2 + i * 2) * 14, a = 0.5 + 0.5 * Math.sin(S.t * 3 + i * 1.7);
      glow(fx, fy, 11, '210,255,130', 0.75 * a); ctx.fillStyle = `rgba(250,255,200,${a})`; circle(fx, fy, 1.8);
    }
  };

  // --- Row Race: row a lantern boat by tapping left and right in turn; steer round lily pads ---
  const RR = { y: 400, x0: 180, x1: 780 };
  const RR_BOAT = P2('M0,-46 C16,-34 22,-6 20,30 C14,42 -14,42 -20,30 C-22,-6 -16,-34 0,-46 Z');
  const drawTopBoat = (x, y, col, rider, oarL = 0, oarR = 0, tilt = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    // oars sweep back as they pull; each oar's inboard handle is where the rower holds it
    ctx.lineCap = 'round';
    const grips = {};
    for (const [side, k] of [[-1, oarL], [1, oarR]]) {
      const a = side * (0.5 - k * 1.1);
      const ex = side * 18 + Math.sin(a) * side * 36, ey = 4 + Math.cos(a) * 30;
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(side * 14, 0); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#d8a46a'; ctx.lineWidth = 3; ctx.stroke();
      inkEllipse(ex, ey, 5, 10, a * side, '#d8a46a', 1.5);
      grips[side] = [side * 18, 6 + 8 * k]; // hands reach toward the bow, then pull back toward her on the stroke
    }
    INK = OL; ink(RR_BOAT, col, 2.5);
    ctx.fillStyle = mix(col, '#2a1a3a', 0.25); ellipse(0, 0, 13, 28);
    inkRect(-13, 12, 26, 6, mix(col, '#ffffff', 0.3), 1.2, 2);
    glow(0, -40, 34, '255,210,120', 0.7); inkCircle(0, -40, 6, '#ffe08a', 1.5);
    // oar handles poke in over the gunwales
    for (const side of [-1, 1]) { const [hx, hy] = grips[side]; ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(side * 14, 0); ctx.lineTo(hx, hy); ctx.stroke(); ctx.strokeStyle = '#b8824a'; ctx.lineWidth = 3; ctx.stroke(); }
    rider(grips, oarL, oarR);
    ctx.restore();
  };
  // Aubrey rowing: her photo sits in the boat facing the stern (rowers face backwards, so she faces us as the boat
  // heads up the river), her arms out to the oar handles, pulling each one back as that side strokes
  const aubTop = (grips, oarL, oarR, steer = 0) => {
    const s = 0.3, im = aubNoArmsImage(), w = im.width * s, h = im.height * s, waist = 10, lean = 2.5 * Math.max(oarL, oarR);
    const top = waist - h * 0.5, sy = top + h * 0.255, SEG = 12; // her shoulders in the photo; arm parts her real size
    ctx.save(); ctx.translate(0, lean);
    // her photo with its own arms cut away, top half only (the rest is inside the boat)
    ctx.save(); ctx.beginPath(); ctx.rect(-30, top - 4, 60, h * 0.5 + 4); ctx.clip();
    ctx.translate(0, waist + h * 0.5); ctx.rotate(clamp(steer, -0.4, 0.4) * 0.3);
    ctx.drawImage(im, -w / 2, -h, w, h);
    ctx.restore();
    // arms from her shoulders to the oar handles, bending out at the elbows
    for (const side of [-1, 1]) {
      const x0 = side * 5.5, y0 = sy;
      let [x1, y1] = grips[side]; y1 -= lean;
      let dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
      if (d > SEG * 2 - 0.5) { const k = (SEG * 2 - 0.5) / d; dx *= k; dy *= k; x1 = x0 + dx; y1 = y0 + dy; d = SEG * 2 - 0.5; }
      const m = Math.sqrt(Math.max(0, SEG * SEG - d * d / 4)), nx = -dy / d, ny = dx / d, sg = nx * side >= 0 ? 1 : -1;
      const ex = x0 + dx / 2 + nx * m * sg, ey = y0 + dy / 2 + ny * m * sg;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 4.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(ex, ey); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = '#f6cfb0'; ctx.lineWidth = 2.4; ctx.stroke();
      inkCircle(x1, y1, 2.6, '#f6cfb0', 0.9);
    }
    ctx.restore();
  };
  MG.rowrace = {
    kind: 'action', title: () => 'Row Race', icon: () => '🚣',
    how: () => 'Row the lantern boat! Tap LEFT, then RIGHT, then LEFT, then RIGHT to zoom ahead. Tap one side twice to steer that way, and go round the lily pads!',
    init(g) {
      const L = [2600, 3200, 3800][g.tier - 1], sp = [[105, 130], [125, 155], [145, 180]][g.tier - 1];
      Object.assign(g, { L, d: 0, x: 480, v: 0, vx: 0, last: 0, oar: [0, 0], bumps: 0, wob: 0, timeLeft: 70, state: 'race', t2: 0, place: 0, wake: [] });
      g.rivals = [{ name: 'Frog', icon: '🐸', col: '#6ad88a', x: 300, d: 0, v: sp[0] }, { name: 'Marina', icon: '🧜‍♀️', col: '#c06ae0', x: 660, d: 0, v: sp[1] }];
      g.pads = [];
      for (let w = 420; w < L - 120; w += rand(200, 270)) g.pads.push({ x: rand(RR.x0 + 50, RR.x1 - 50), w, r: rand(26, 36), bloom: Math.random() < 0.6, hit: 0, cool: 0 });
      g.say = 'Left, right, left, right! Row to the lantern finish line!';
    },
    start(g) { speak(g.say); },
    stroke(g, side) {
      const alt = g.last !== side;
      g.v = Math.min(420, g.v + (alt ? 72 : 30));
      g.vx += side * (alt ? 22 : 85);
      g.last = side; g.oar[side < 0 ? 0 : 1] = 1;
      tone(alt ? 330 : 260, 0.08, 'triangle', 0.07); noise(0.08, 0.02);
    },
    update(g, dt, id) {
      g.oar = g.oar.map(o => Math.max(0, o - dt * 3)); g.wob = Math.max(0, g.wob - dt);
      if (g.state === 'race') {
        g.timeLeft -= dt;
        if (id === 'oarL' || pressed.arrowleft || pressed.a) this.stroke(g, -1);
        if (id === 'oarR' || pressed.arrowright || pressed.d) this.stroke(g, 1);
      }
      g.v *= Math.exp(-0.9 * dt); g.vx *= Math.exp(-3 * dt);
      g.d += g.v * dt; g.x += g.vx * dt;
      if (g.x < RR.x0 + 20 || g.x > RR.x1 - 20) { g.x = clamp(g.x, RR.x0 + 20, RR.x1 - 20); g.vx *= -0.5; }
      for (const p of g.pads) {
        p.hit = Math.max(0, p.hit - dt); p.cool = Math.max(0, p.cool - dt);
        if (!p.cool && Math.abs(g.x - p.x) < p.r + 16 && Math.abs(g.d - p.w) < p.r + 30) {
          p.hit = 0.5; p.cool = 0.8; g.bumps++; g.v *= 0.3; g.vx += Math.sign(g.x - p.x || 1) * 150; g.wob = 0.5;
          SFX.miss(); floatText(g.x, RR.y - 60, 'Boing! A lily pad!', '#ffd0f0', false, 20);
        }
      }
      for (const r of g.rivals) { r.d += r.v * (1 + 0.08 * Math.sin(S.t * 1.3 + r.x)) * dt; r.x += Math.sin(S.t * 0.9 + r.v) * 12 * dt; }
      if (g.v > 40 && Math.random() < dt * 12) g.wake.push({ x: g.x, w: g.d - 34, t: 0 });
      g.wake = g.wake.filter(k => (k.t += dt) < 1.4);
      const ahead = g.rivals.filter(r => r.d > g.d).length;
      if (g.state === 'race') {
        if (g.d >= g.L) {
          g.place = 1 + g.rivals.filter(r => r.d >= g.L).length; g.state = 'finish'; g.t2 = 2.6;
          SFX.fanfare(); burst(g.x, RR.y - 40, 40);
          speak(['You won the race!', 'Second place! Great rowing!', 'Third place! You made it!'][g.place - 1]);
        } else if (g.timeLeft <= 0) { g.state = 'finish'; g.t2 = 1.5; g.place = 0; speak('Time is up! Good try!'); }
        g.progress = `${['1st', '2nd', '3rd'][ahead]} place`;
      } else if ((g.t2 -= dt) <= 0) g.done = true;
      const base = g.place ? [1, 0.75, 0.55][g.place - 1] - 0.03 * g.bumps : 0.45 * Math.min(1, g.d / g.L);
      g.score = clamp(g.place ? Math.max(0.4, base) : base, 0, 1);
    },
    draw(g) {
      const sy = w => RR.y - (w - g.d);
      // water
      ctx.fillStyle = vgrad(0, H, ['#1a2668', '#24348a', '#1a2a70']); ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(180,200,255,.28)'; ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) { const x = RR.x0 + (i * 157) % (RR.x1 - RR.x0), y = ((i * 97 + g.d) % (H + 40)) - 20; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 4, x + 28, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,250,215,.6)';
      for (let i = 0; i < 18; i++) { const x = 400 + (i * 37) % 160 + Math.sin(S.t * 2 + i) * 6, y = ((i * 61 + g.d * 1.0) % (H + 20)) - 10; ellipse(x, y, 10 + (i % 3) * 4, 2); }
      // start and finish lines
      for (const [w, fin] of [[0, false], [g.L, true]]) {
        const y = sy(w); if (y < -60 || y > H + 60) continue;
        ctx.strokeStyle = '#ffe9b0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(RR.x0, y); for (let x = RR.x0; x <= RR.x1; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.05) * 6 + 6); ctx.stroke();
        for (let x = RR.x0 + 20; x < RR.x1; x += 60) { const c = ['#ff8fc8', '#ffe08a', '#8fe0ff', '#c6a2ff'][(x / 60 | 0) % 4]; glow(x, y + 14, 26, '255,230,160', 0.5); inkRect(x - 9, y + 4, 18, 20, c, 1.5, 6); }
        if (fin) { rrect(W / 2 - 80, y - 46, 160, 36, 14, '#fff6e0', OL, 2.5); text('FINISH', W / 2, y - 28, 22, '#c0407a', 'center', 800); }
      }
      // lily pads
      for (const p of g.pads) {
        const y = sy(p.w); if (y < -60 || y > H + 60) continue;
        const wob = p.hit ? Math.sin(p.hit * 40) * 0.12 : 0;
        ctx.save(); ctx.translate(p.x, y); ctx.rotate(wob + p.w);
        glow(0, 0, p.r * 1.6, '120,255,190', 0.18);
        ink(P2(`M0,0 L${p.r * 0.95},${-p.r * 0.3} A${p.r},${p.r} 0 1,0 ${p.r * 0.95},${p.r * 0.3} Z`), '#4fb87a', 1.5);
        ctx.strokeStyle = 'rgba(30,90,60,.5)'; ctx.lineWidth = 1.5; for (let k = 0; k < 5; k++) { const a = 1 + k * 0.9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * p.r * 0.8, Math.sin(a) * p.r * 0.8); ctx.stroke(); }
        ctx.restore();
        if (p.bloom) lotus(p.x - p.r * 0.3, y, 0.8);
      }
      // banks
      for (const side of [-1, 1]) {
        const edge = side < 0 ? RR.x0 : RR.x1;
        ctx.beginPath(); ctx.moveTo(side < 0 ? 0 : W, -10);
        for (let y = -10; y <= H + 10; y += 20) ctx.lineTo(edge + side * (6 * Math.sin((y - g.d) * 0.02) + 4 * Math.sin((y - g.d) * 0.05)), y);
        ctx.lineTo(side < 0 ? 0 : W, H + 10); ctx.closePath();
        ctx.fillStyle = '#2a5a54'; ctx.fill(); ctx.strokeStyle = 'rgba(180,240,255,.4)'; ctx.lineWidth = 3; ctx.stroke();
        for (let k = -1; k < 6; k++) {
          const w = Math.floor(g.d / 110) * 110 + k * 110, y = sy(w), seed = Math.abs(Math.floor(w / 110) * 7 + (side > 0 ? 3 : 0));
          const x = edge + side * (40 + (seed * 23) % 110);
          if (seed % 3 === 0) { glow(x, y, 40, '255,210,120', 0.5); inkCircle(x, y, 8, '#ffe08a', 1.5); }
          else if (seed % 3 === 1) { inkCircle(x, y, 30, '#1f4a44', 1.5, '#163a36'); ctx.fillStyle = '#2a6a5a'; circle(x - 6, y - 6, 18); }
          else { for (let j = 0; j < 4; j++) { ctx.strokeStyle = '#3a8a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(edge + side * 8, y + j * 6); ctx.lineTo(edge - side * (6 + j * 3), y + j * 6 - 10); ctx.stroke(); } glow(x, y, 16, '160,255,220', 0.6); }
        }
      }
      // wake, rivals and the boat
      for (const k of g.wake) { ctx.strokeStyle = `rgba(220,235,255,${0.5 * (1 - k.t / 1.4)})`; ctx.lineWidth = 2; const y = sy(k.w), s = 10 + k.t * 30; ctx.beginPath(); ctx.moveTo(k.x - s, y + s * 0.6); ctx.lineTo(k.x, y); ctx.lineTo(k.x + s, y + s * 0.6); ctx.stroke(); }
      for (const r of g.rivals) {
        const y = sy(r.d); if (y < -60 || y > H + 60) continue;
        drawTopBoat(r.x, y, r.col, () => emoji(r.icon, 0, -2, 28), (Math.sin(S.t * 6) + 1) / 2, (Math.sin(S.t * 6 + Math.PI) + 1) / 2);
      }
      ctx.save(); ctx.translate(g.x, RR.y); ctx.scale(1.5, 1.5); // Aubrey's boat drawn bigger so you can see her rowing
      drawTopBoat(0, 0, '#ff8a6a', (gr, l, r) => aubTop(gr, l, r, g.vx * 0.008), g.oar[0], g.oar[1], clamp(g.vx * 0.004, -0.35, 0.35) + (g.wob ? Math.sin(g.wob * 30) * 0.1 : 0));
      ctx.restore();
      // race track at the side: who is where
      darkPanel(W - 58, 70, 40, 300, 18);
      const ty = w => 356 - clamp(w / g.L, 0, 1) * 272;
      text('🏁', W - 38, 78, 16, '#fff', 'center');
      for (const r of g.rivals) emoji(r.icon, W - 38, ty(r.d), 20);
      inkCircle(W - 38, ty(g.d), 9, '#ff8a6a', 1.5); ctx.fillStyle = '#7a4a2a'; circle(W - 38, ty(g.d) - 2, 5);
      // rhythm hint and the two big oar buttons
      const next = g.last === -1 ? 1 : -1, pulse = 0.6 + 0.4 * Math.sin(S.t * 8);
      for (const [side, idn, x, label, key] of [[-1, 'oarL', 18, '⬅ Left', '←'], [1, 'oarR', W - 218, 'Right ➡', '→']]) {
        if (side === next && g.state === 'race') { ctx.globalAlpha = pulse; rrect(x - 6, 446, 212, 86, 22, '#fff6a8'); ctx.globalAlpha = 1; }
        button(idn, x, 452, 200, 74, label, { color: side < 0 ? '#4fa8e0' : '#ff6fb5', size: 26, key, on: g.state === 'race' });
      }
      if (g.state === 'race' && g.d < 200) outlined('Left, right, left, right!', W / 2, 500, 26, '#fff6a8');
      if (g.state === 'finish') { panel(W / 2 - 200, 200, 400, 80, 22); outlined(g.place ? ['1st place!', '2nd place!', '3rd place!'][g.place - 1] : "Time's up!", W / 2, 240, 40, '#ffb13a', 'center', '#fff'); }
    },
  };

  // --- Mirror Match: which picture is the true reflection, in a mirror or in the lake? ---
  // only pictures that look different upside down AND turned round
  const MIRROR_PICS = ['🐌', '🦆', '🐢', '🦒', '🐘', '🚗', '🐿️', '🦕', '🐇', '🚂', '🛴', '🐎', '🦩', '🚲', '🦘', '🐈'];
  const XF = { id: [1, 1, 0], mx: [-1, 1, 0], my: [1, -1, 0], r180: [-1, -1, 0], r90: [1, 1, Math.PI / 2] };
  const MM_ROUNDS = { 1: ['em', 'em', 'em', 'ew', 'em'], 2: ['em', 'ew', 'gm', 'em', 'ew'], 3: ['em', 'ew', 'gm', 'em', 'gw', 'ew'] };
  const GRID_COLS = ['#ff6fb5', '#4fa8e0', '#ffc83d'];
  const gridXf = (cells, xf) => cells.map(([r, c, k]) => (xf === 'mx' ? [r, 2 - c, k] : xf === 'my' ? [2 - r, c, k] : xf === 'r90' ? [c, 2 - r, k] : xf === 'r180' ? [2 - r, 2 - c, k] : [r, c, k]));
  const gridKey = cells => cells.map(c => c.join('')).sort().join('|');
  MG.mirrormatch = learnGame({
    title: () => 'Mirror Match', icon: () => '🪞',
    how: () => 'Marina loves reflections! Look at the picture, then find its mirror twin, the way it would look in a mirror or in the lake.',
    rounds: g => MM_ROUNDS[g.tier].length,
    make(g) {
      const kind = MM_ROUNDS[g.tier][g.round], water = kind[1] === 'w', n = g.tier === 1 ? 3 : 4;
      const right = water ? 'my' : 'mx', wrongs = (water ? ['id', 'mx', 'r180'] : ['id', 'my', 'r180', 'r90']).slice(0, n - 1);
      g.water = water; g.grid = kind[0] === 'g';
      if (g.grid) {
        for (;;) {
          const cells = shuffle(Array.from({ length: 9 }, (_, i) => [Math.floor(i / 3), i % 3])).slice(0, 4).map(([r, c], i) => [r, c, i % 3]);
          const keys = [right, ...wrongs].map(x => gridKey(gridXf(cells, x)));
          if (new Set(keys).size === keys.length) { g.pic = cells; break; }
        }
      } else {
        do g.pic = pick(MIRROR_PICS); while (g.pic === g.lastPic);
        g.lastPic = g.pic;
      }
      g.choices = shuffle([right, ...wrongs]); g.answer = g.choices.indexOf(right);
      g.say = water ? 'Which picture is the reflection in the lake? It looks upside down!' : 'Which picture is the mirror twin? It faces the other way!';
    },
    check: (g, i) => i === g.answer,
    onRight(g) { SFX.sparkle(); burst(g.water ? 480 : 660, g.water ? 300 : 230, 24); speak(pick(['Perfect reflection!', 'Mirror match!', 'Yes! Just like a mirror!'])); },
    onWrong(g, i) { speak(g.choices[i] === 'id' ? "That one is just the same. A reflection is flipped!" : g.water ? 'Look again. In the water, the top goes to the bottom.' : 'Look again. In a mirror, left and right swap over.'); },
    pic(g, xf, x, y, s) {
      const [sx, sy, rot] = XF[xf];
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.rotate(rot);
      if (g.grid) {
        const c = 26 * s;
        for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) rrect(-1.5 * c + k * c + 2, -1.5 * c + r * c + 2, c - 4, c - 4, 5, 'rgba(255,255,255,.75)', 'rgba(120,90,150,.35)', 1.5);
        for (const [r, k, col] of g.pic) rrect(-1.5 * c + k * c + 2, -1.5 * c + r * c + 2, c - 4, c - 4, 5, GRID_COLS[col], OL, 2);
      } else emoji(g.pic, 0, 0, 74 * s);
      ctx.restore();
    },
    draw(g) {
      panel(W / 2 - 320, 64, 640, 54, 22);
      text(g.water ? 'Which one is the reflection in the lake?' : 'Which one is the mirror twin?', W / 2, 91, 24, '#5a2a6e', 'center', 700);
      const done = g.state === 'yay';
      if (g.water) {
        // picture above, the lake below
        rrect(330, 130, 300, 230, 20, 'rgba(255,248,252,.92)', '#e2c6f5', 3);
        ctx.save(); ctx.beginPath(); ctx.roundRect(330, 130, 300, 230, 20); ctx.clip();
        ctx.fillStyle = vgrad(246, 360, ['#5a7ad8', '#2a3a8a']); ctx.fillRect(330, 246, 300, 120);
        ctx.restore();
        ctx.strokeStyle = '#e8f0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(334, 246); ctx.lineTo(626, 246); ctx.stroke();
        this.pic(g, 'id', 480, 192, 1);
        if (done) { ctx.globalAlpha = 0.75; this.pic(g, 'my', 480, 300, 1); ctx.globalAlpha = 1; }
        else { const p = 1 + Math.sin(S.t * 4) * 0.08; outlined('?', 480, 302, 48 * p, '#fff6a8'); }
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) { const y = 262 + i * 18, x = 380 + ((i * 47 + S.t * 20) % 180); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y); ctx.stroke(); }
      } else {
        rrect(200, 136, 230, 220, 20, 'rgba(255,248,252,.92)', '#e2c6f5', 3);
        rrect(530, 136, 230, 220, 20, 'rgba(225,240,255,.85)', '#b8d8ff', 3);
        this.pic(g, 'id', 315, 246, 1.2);
        // the magic mirror between them
        INK = OL;
        inkRect(466, 120, 28, 252, '#ffd23a', 2, 14);
        ctx.fillStyle = vgrad(128, 364, ['#e8f6ff', '#a8d4f0', '#e8f6ff']); ctx.beginPath(); ctx.roundRect(472, 128, 16, 236, 8); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(476, 150 + Math.sin(S.t) * 30, 3, 50);
        if (done) { ctx.globalAlpha = 0.85; this.pic(g, 'mx', 645, 246, 1.2); ctx.globalAlpha = 1; }
        else { const p = 1 + Math.sin(S.t * 4) * 0.08; outlined('?', 645, 248, 60 * p, '#9a6ae0', 'center', '#fff'); }
      }
      const n = g.choices.length, bw = 170, bx = rowX(n, bw, 22);
      g.choices.forEach((xf, i) => {
        const used = g.tried.includes(i), right = done && i === g.answer, X = bx(i) + shakeX(g, i);
        button(`ch:${i}`, X, 392, bw, 134, '', { color: right ? '#ffc83d' : used ? '#c9bcd4' : CHOICE_COLS[i], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        rrect(X + 10, 400, bw - 20, 118, 14, used ? 'rgba(255,255,255,.5)' : '#fff8fc');
        ctx.globalAlpha = used ? 0.4 : 1; this.pic(g, xf, X + bw / 2, 459, 1); ctx.globalAlpha = 1;
      });
    },
  });

  restage('moonlake', {
    bg: 'moonlake_bg',
    games: [['rowrace', 'moonbeam', {}], ['mirrormatch', 'crystal', {}]],
    intro: ["*:A mermaid is sitting on a rock. It's Marina, one of the other contestants!", "N:You're in the show too? A fair show is a good show. Let's have a friendly boat race!", "A:surprised:You're... nice?", 'N:Of course! Hop in the lantern boat. Row left, right, left, right, and steer round the lily pads!'],
    mid: ['N:What a race! Now look into the lake. Mermaids love reflections.', "N:I'll show you a picture. You find its mirror twin!", 'A:thinking:Like when I wave at the mirror and it waves back!'],
    outro: ['N:See you at the show. May the best creature win!', 'A:happy:Good luck, Marina!'],
  });

  // =====================================================================================
  // 4. EMBER MOUNTAIN — Pip the Baby Dragon
  // =====================================================================================
  const VOLC = P2('M120,430 C220,380 330,250 430,128 C450,112 470,120 488,126 C510,116 540,112 562,124 C640,230 760,370 880,430 Z');
  const LAVA_RIVERS = [
    'M470,130 C468,180 430,230 420,290 C412,340 380,380 350,430',
    'M540,128 C552,190 590,240 610,300 C624,346 660,392 700,432',
    'M505,128 C506,170 500,210 506,250 C512,300 500,350 520,430',
  ].map(P2);
  const obsidian = (x, y, s, flip = 1) => {
    INK = OL;
    ink(P2(`M${x - 30 * s * flip},${y} L${x - 22 * s * flip},${y - 44 * s} L${x - 2 * s * flip},${y - 70 * s} L${x + 14 * s * flip},${y - 40 * s} L${x + 30 * s * flip},${y - 52 * s} L${x + 40 * s * flip},${y} Z`), '#2a1c3a', 2);
    ctx.fillStyle = 'rgba(200,160,255,.35)'; tri(x - 18 * s * flip, y - 40 * s, x - 4 * s * flip, y - 62 * s, x - 8 * s * flip, y - 30 * s);
    ctx.fillStyle = 'rgba(255,140,80,.25)'; tri(x + 16 * s * flip, y - 36 * s, x + 28 * s * flip, y - 46 * s, x + 34 * s * flip, y - 8 * s);
  };
  const crystals = (x, y, s, col, rgb) => {
    glow(x, y - 30 * s, 60 * s, rgb, 0.4 + 0.15 * Math.sin(S.t * 2 + x));
    INK = OL;
    for (const [dx, h, w, a] of [[-16, 50, 10, -0.35], [14, 46, 10, 0.35], [0, 70, 13, 0]]) {
      ctx.save(); ctx.translate(x + dx * s, y); ctx.rotate(a);
      ink(P2(`M${-w * s},0 L${-w * s},${-h * s * 0.75} L0,${-h * s} L${w * s},${-h * s * 0.75} L${w * s},0 Z`), col, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-w * s * 0.6, -h * s * 0.7, w * s * 0.35, h * s * 0.6);
      ctx.restore();
    }
  };
  const steamPuffs = (x, y, n = 4, sp = 0.5) => {
    for (let i = 0; i < n; i++) {
      const k = (S.t * sp + i / n) % 1;
      ctx.fillStyle = `rgba(255,240,250,${0.45 * (1 - k)})`; circle(x + Math.sin(k * 6 + i) * 10 * k, y - k * 90, 8 + k * 22);
    }
  };
  BACKDROPS.volcano_bg = () => {
    ctx.fillStyle = vgrad(0, 420, ['#1e0a30', '#4a1648', '#a8304a', '#ff7a3a']); ctx.fillRect(0, 0, W, H);
    for (const s of SKY_STARS.slice(0, 40)) if (s.y < 200) { ctx.fillStyle = `rgba(255,230,230,${0.2 + 0.5 * Math.abs(Math.sin(S.t + s.p))})`; circle(s.x, s.y, s.s * 0.7); }
    // far peaks
    ctx.fillStyle = '#5a1e44';
    ctx.beginPath(); ctx.moveTo(0, 420); ctx.lineTo(0, 300); ctx.lineTo(90, 250); ctx.lineTo(170, 310); ctx.lineTo(260, 270); ctx.lineTo(340, 330); ctx.lineTo(620, 330); ctx.lineTo(720, 260); ctx.lineTo(800, 300); ctx.lineTo(880, 240); ctx.lineTo(W, 290); ctx.lineTo(W, 420); ctx.fill();
    // smoke plume
    for (let i = 0; i < 9; i++) {
      const k = (S.t * 0.08 + i / 9) % 1, x = 515 + Math.sin(k * 5 + i) * 30 + k * 120, y = 110 - k * 60 - k * k * 40;
      ctx.fillStyle = `rgba(90,60,90,${0.55 * (1 - k)})`; circle(x, y, 26 + k * 50);
    }
    // the volcano with a glowing crater and lava rivers
    glow(515, 124, 160, '255,140,60', 0.55 + 0.15 * Math.sin(S.t * 2));
    ctx.fillStyle = vgrad(120, 430, ['#5a2a48', '#40203a', '#2a1428']); ctx.fill(VOLC);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(VOLC);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(430, 128); ctx.lineTo(300, 300); ctx.lineTo(250, 400); ctx.lineTo(370, 300); ctx.closePath(); ctx.fill();
    ctx.lineCap = 'round';
    for (const p of LAVA_RIVERS) {
      ctx.strokeStyle = 'rgba(255,120,40,.35)'; ctx.lineWidth = 22; ctx.stroke(p);
      ctx.strokeStyle = '#ff6a2a'; ctx.lineWidth = 11; ctx.stroke(p);
      ctx.strokeStyle = '#ffd04a'; ctx.lineWidth = 4; ctx.setLineDash([14, 22]); ctx.lineDashOffset = -S.t * 40; ctx.stroke(p); ctx.setLineDash([]);
    }
    inkEllipse(515, 126, 52, 12, 0, '#ff8a2a', 2);
    ctx.fillStyle = '#ffe06a'; ellipse(515, 124, 36, 6);
    for (let i = 0; i < 5; i++) {
      const k = (S.t * 0.6 + i / 5) % 1, x = 490 + i * 12 + Math.sin(i * 3) * 8 * k * 4;
      ctx.fillStyle = `rgba(255,${180 - k * 80},60,${1 - k})`; circle(x, 118 - Math.sin(k * Math.PI) * 50, 5 - k * 2);
    }
    // rocky ridge with glowing cracks
    ctx.fillStyle = '#3a1a30'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 410);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 404 + Math.sin(x * 0.03) * 8 + (x % 80 ? 6 : 0));
    ctx.lineTo(W, H); ctx.fill();
    // ground of dark basalt
    const ground = P2(`M0,${H} L0,438 C220,428 420,444 600,436 C760,430 860,440 ${W},432 L${W},${H} Z`);
    ctx.fillStyle = vgrad(430, H, ['#4a2a3c', '#3a2030', '#2a1624']); ctx.fill(ground);
    ctx.strokeStyle = 'rgba(255,150,90,.4)'; ctx.lineWidth = 2.5; ctx.stroke(ground);
    ctx.lineCap = 'round';
    for (const pts of [[[40, 470], [90, 486], [130, 480], [170, 500]], [[360, 500], [400, 490], [450, 506]], [[600, 470], [650, 482], [700, 476]], [[800, 510], [850, 498], [920, 506]], [[230, 530], [280, 522]]]) {
      ctx.strokeStyle = 'rgba(255,120,40,.35)'; ctx.lineWidth = 9; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.strokeStyle = `rgba(255,${190 + 40 * Math.sin(S.t * 3 + pts[0][0])},80,.95)`; ctx.lineWidth = 3; ctx.stroke();
    }
    // obsidian, crystals and steam vents
    obsidian(60, 440, 1.2); obsidian(170, 432, 0.7, -1); obsidian(900, 436, 1.1, -1); obsidian(800, 430, 0.6);
    crystals(118, 446, 0.9, '#b06aff', '190,120,255'); crystals(850, 444, 1, '#4ae0e0', '90,240,240'); crystals(560, 432, 0.5, '#ff6ab0', '255,120,190');
    for (const x of [330, 640]) { inkEllipse(x, 438, 24, 8, 0, '#2a1624', 1.5); steamPuffs(x, 430, 4, 0.45); }
    // floating embers
    for (let i = 0; i < 16; i++) {
      const k = (S.t * 0.12 + i / 16) % 1, x = (i * 67 + Math.sin(S.t + i) * 20) % W, y = 470 - k * 420;
      ctx.fillStyle = `rgba(255,${150 + (i % 3) * 30},60,${(1 - k) * 0.9})`; circle(x, y, 2 + (i % 2));
    }
  };

  // --- Keep Eggs Warm: dragon eggs cool down; tap one and Pip breathes fire on it. Not too hot! ---
  const EGG = P2('M0,-40 C22,-40 30,-6 30,10 C30,30 16,40 0,40 C-16,40 -30,30 -30,10 C-30,-6 -22,-40 0,-40 Z');
  const EGG_COLS = ['#7ad88a', '#c08aff', '#5ab8f0', '#ff9ac8', '#ffcf5a'];
  const WARM_LO = 45, WARM_HI = 80;
  MG.warmeggs = {
    kind: 'action', title: () => 'Keep Eggs Warm', icon: () => '🥚',
    how: () => "Pip's eggs are getting cold! Tap an egg (or press its number) and Pip breathes fire on it. Keep every egg in the green. Not too hot!",
    init(g) {
      // always 3 eggs; higher tiers get harder through faster cooling and chilly gusts
      const n = 3, [lo, hi] = [[2.2, 3.4], [2.8, 4.4], [3.4, 5.2]][g.tier - 1];
      const bx = rowX(n, 140, n === 3 ? 90 : 60);
      g.eggs = Array.from({ length: n }, (_, i) => ({ x: bx(i) + 70, y: 316, T: rand(56, 70), rate: rand(lo, hi), warm: 0, col: EGG_COLS[i], chill: 0, flame: 0 }));
      Object.assign(g, { timeLeft: 40, played: 0, pipX: 120, pipTo: 120, target: -1, cool: 0, gust: 6, state: 'play', t2: 0, hatched: 0 });
      g.say = 'Keep all the eggs in the green! Tap an egg to warm it up.';
    },
    start(g) { speak(g.say); },
    breathe(g, i) {
      if (g.cool > 0) return;
      const e = g.eggs[i];
      e.T = Math.min(110, e.T + 16); e.flame = 0.45; g.cool = 0.28; g.target = i; g.pipTo = e.x - 100;
      noise(0.25, 0.04); tone(160, 0.25, 'sawtooth', 0.04, 0, 90);
      if (e.T > 100) { SFX.miss(); floatText(e.x, e.y - 70, 'Too hot!', '#ffb0b0', false, 22); }
    },
    update(g, dt, id) {
      g.cool = Math.max(0, g.cool - dt);
      g.pipX = lerp(g.pipX, g.pipTo, Math.min(1, dt * 10));
      if (g.state === 'play') {
        g.timeLeft -= dt; g.played += dt;
        let i = choiceIndex(id, g.eggs.length);
        if (i < 0 && pointer.clicked) i = g.eggs.findIndex(e => Math.abs(pointer.x - e.x) < 64 && pointer.y > e.y - 90 && pointer.y < e.y + 90);
        if (i >= 0) this.breathe(g, i);
        // a chilly gust now and then makes one egg cool much faster
        if (g.tier > 1 && (g.gust -= dt) <= 0) { const e = pick(g.eggs); e.chill = 3; g.gust = rand(5, 8); }
        for (const e of g.eggs) {
          e.chill = Math.max(0, e.chill - dt); e.flame = Math.max(0, e.flame - dt);
          e.T = Math.max(0, e.T - e.rate * (e.chill ? 2.2 : 1) * dt);
          if (e.T > 100) e.T -= 6 * dt; // an overheated egg slowly cools back down
          if (e.T >= WARM_LO && e.T <= WARM_HI) e.warm += dt;
        }
        g.score = g.eggs.reduce((a, e) => a + e.warm, 0) / (g.eggs.length * Math.max(1, g.played));
        if (g.timeLeft <= 0) {
          g.state = 'hatch'; g.t2 = 3;
          for (const e of g.eggs) e.hatch = e.warm / g.played >= 0.6;
          g.hatched = g.eggs.filter(e => e.hatch).length;
          SFX.fanfare(); speak(g.hatched ? `${g.hatched === g.eggs.length ? 'All the eggs' : NUM_WORDS[g.hatched] + (g.hatched === 1 ? ' egg' : ' eggs')} hatched! Baby dragons!` : 'Brrr. The eggs need more warming. Good try!');
          for (const e of g.eggs) if (e.hatch) burst(e.x, e.y, 20, { colors: ['#fff6a8', e.col, '#ffffff'] });
        }
        g.timeLeft = Math.max(0, g.timeLeft);
      } else if ((g.t2 -= dt) <= 0) g.done = true;
      g.progress = `Warm: ${Math.round(g.score * 100)}%`;
    },
    draw(g) {
      ctx.fillStyle = 'rgba(30,10,30,.25)'; ctx.fillRect(0, 0, W, H);
      g.eggs.forEach((e, i) => {
        const cold = clamp((WARM_LO - e.T) / 40, 0, 1), hot = clamp((e.T - WARM_HI) / 25, 0, 1), ok = !cold && !hot;
        // nest on a warm rock
        INK = OL;
        inkEllipse(e.x, e.y + 56, 72, 18, 0, '#3a2030', 2);
        ctx.save(); ctx.translate(e.x, e.y);
        if (ok) glow(0, 0, 70, '255,200,90', 0.45);
        if (hot) glow(0, 0, 70, '255,80,60', 0.5 * hot + 0.2);
        if (e.hatch && g.state === 'hatch') {
          // cracked shell halves and a baby dragon peeking out
          const k = clamp((3 - g.t2) / 0.6, 0, 1);
          ink(P2('M-30,10 L-20,0 L-10,10 L0,0 L10,10 L20,0 L30,10 C30,30 16,40 0,40 C-16,40 -30,30 -30,10 Z'), e.col, 2);
          emoji('🐉', 0, -10 - k * 30, 44 + k * 10);
          ctx.save(); ctx.translate(-26 - k * 20, -20 - k * 30); ctx.rotate(-0.6 * k); ink(P2('M0,-20 C12,-20 20,0 20,10 L10,4 L0,12 L-10,4 L-20,10 C-20,0 -12,-20 0,-20 Z'), e.col, 2); ctx.restore();
        } else {
          const shiver = cold > 0.3 ? Math.sin(S.t * 40) * 2 * cold : 0, wob = e.flame ? Math.sin(S.t * 30) * 0.05 : Math.sin(S.t * 2 + i) * 0.04;
          ctx.translate(shiver, 0); ctx.rotate(wob);
          ink(EGG, mix(mix(e.col, '#bfe4ff', cold * 0.7), '#ff4a2a', hot * 0.8), 2.5);
          ctx.save(); ctx.clip(EGG);
          ctx.fillStyle = mix(e.col, '#ffffff', 0.45); circle(-14, -14, 7); circle(12, 4, 9); circle(-10, 22, 6); circle(16, -22, 5);
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-12, -22, 6, 12, 0.4);
          if (cold) { ctx.fillStyle = `rgba(220,240,255,${cold * 0.6})`; ctx.fillRect(-30, 20, 60, 20); }
          ctx.restore();
          cuteFace(0, 8, 1, cold > 0.2 ? 'cold' : hot > 0.2 ? 'hot' : 'happy');
          if (cold > 0.3) { text('brr', 24, -40, 14, '#bfe4ff', 'left', 800); emoji('❄️', -30, -36, 16); }
          if (hot > 0.2) { ctx.fillStyle = '#9fd8ff'; ellipse(26, -16, 3, 5); steamPuffs(0, -40, 3, 0.9); }
        }
        ctx.restore();
        // the flame stream
        if (e.flame > 0) {
          const k = e.flame / 0.45;
          for (let j = 0; j < 7; j++) {
            const f = ((S.t * 5 + j / 7) % 1), fx = lerp(g.pipX + 22, e.x - 22, f), fy = lerp(398, e.y + 4, f) + Math.sin(j * 2 + S.t * 20) * 6;
            ctx.fillStyle = `rgba(255,${120 + f * 120},40,${k})`; circle(fx, fy, 7 + f * 9);
            ctx.fillStyle = `rgba(255,240,140,${k})`; circle(fx, fy, 3 + f * 4);
          }
        }
        // the thermometer: blue = cold, green = just right, red = too hot
        const mx = e.x + 48, my0 = e.y - 70, mh = 140, my = v => my0 + mh - (clamp(v, 0, 110) / 110) * mh;
        rrect(mx - 9, my0 - 4, 18, mh + 8, 9, '#fff', OL, 2);
        ctx.fillStyle = '#8ac8ff'; ctx.fillRect(mx - 6, my(WARM_LO), 12, my(0) - my(WARM_LO));
        ctx.fillStyle = '#5adc7a'; ctx.fillRect(mx - 6, my(WARM_HI), 12, my(WARM_LO) - my(WARM_HI));
        ctx.fillStyle = '#ff6a5a'; ctx.fillRect(mx - 6, my(110), 12, my(WARM_HI) - my(110));
        const ty = my(e.T);
        ctx.fillStyle = OL; tri(mx + 10, ty, mx + 22, ty - 7, mx + 22, ty + 7);
        ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx - 9, ty); ctx.lineTo(mx + 9, ty); ctx.stroke();
        if (g.state === 'play') { inkCircle(e.x - 40, e.y + 74, 13, '#fff6e0', 1.5); text(String(i + 1), e.x - 40, e.y + 75, 16, '#5a2a6e', 'center', 800); }
      });
      drawCritter('Pip the Baby Dragon', g.pipX, 446, 0.62, 1);
      if (g.state === 'play' && g.played < 4) outlined('Tap an egg to warm it!', W / 2, 140, 26, '#fff6a8');
      if (g.state === 'hatch') { panel(W / 2 - 220, 92, 440, 64, 22); outlined(g.hatched ? `${g.hatched} baby dragon${g.hatched > 1 ? 's' : ''} hatched!` : 'Brrr! Too chilly!', W / 2, 124, 30, '#ff8a3a', 'center', '#fff'); }
    },
  };

  // --- Number Line Hops: Pip hops along stepping stones; where does he land? ---
  MG.numberhops = learnGame({
    title: () => 'Number Line Hops', icon: () => '🐲', unit: 'Hop',
    how: () => 'Pip hops along the stepping stones. Listen: where he starts, and how many hops. Then pick the number where he lands!',
    rounds: g => [5, 6, 6][g.tier - 1],
    setup(g) { g.max = g.tier === 3 ? 20 : 10; },
    make(g) {
      const sub = g.tier > 1 && Math.random() < 0.5, max = g.max, hopMax = g.tier === 3 ? 8 : 5;
      let a, b;
      if (sub) { a = randInt(3, max); b = randInt(1, Math.min(hopMax, a)); } else { a = randInt(0, max - 2); b = randInt(1, Math.min(hopMax, max - a)); }
      const ans = sub ? a - b : a + b, set = new Set([ans]);
      for (const v of shuffle([ans + 1, ans - 1, sub ? a + b : a - b, ans + 2, ans - 2, a])) { if (set.size >= (g.tier === 1 ? 3 : 4)) break; if (v >= 0 && v <= max) set.add(v); }
      Object.assign(g, { a, b, sub, ans, hint: false, hop: -1 });
      g.choices = shuffle([...set]); g.answer = g.choices.indexOf(ans);
      g.say = `Pip starts on ${a}. He hops ${b} ${sub ? 'back' : 'more'}. Where does he land?`;
    },
    check: (g, i) => i === g.answer,
    onRight(g) { g.yayT = 0; g.t2 = 0.4 + g.b * 0.42 + 1.4; SFX.hit(); speak(`${g.a} ${g.sub ? 'take away' : 'plus'} ${g.b} is ${g.ans}!`); },
    onWrong(g, i) { g.hint = true; speak(`Not ${g.choices[i]}. Let's count the hops together, starting on ${g.a}.`); },
    tick(g, dt) {
      if (g.state !== 'yay') return;
      const before = Math.floor((g.yayT - 0.3) / 0.42);
      g.yayT += dt;
      const now = Math.floor((g.yayT - 0.3) / 0.42);
      if (now > before && now >= 0 && now < g.b) { SFX.jump(); tone(440 + now * 60, 0.15, 'triangle', 0.06, 0.2); }
      if (now >= g.b && before < g.b) { burst(this.sx(g, g.ans), 300, 24); SFX.sparkle(); }
    },
    sx: (g, n) => 90 + (n / g.max) * 780,
    draw(g) {
      ctx.fillStyle = 'rgba(30,10,30,.25)'; ctx.fillRect(0, 0, W, H);
      panel(W / 2 - 300, 64, 600, 76, 22);
      clueSentence(g);
      // a lava river with stepping stones, one per number
      const Y = 330;
      ctx.fillStyle = vgrad(Y - 16, Y + 40, ['#ff9a3a', '#ff5a2a', '#c8302a']); ctx.beginPath(); ctx.roundRect(40, Y - 12, 880, 50, 25); ctx.fill();
      ctx.strokeStyle = '#ffd86a'; ctx.lineWidth = 3; ctx.setLineDash([16, 18]); ctx.lineDashOffset = -S.t * 30; ctx.beginPath(); ctx.moveTo(60, Y + 14); ctx.lineTo(900, Y + 14); ctx.stroke(); ctx.setLineDash([]);
      const step = 780 / g.max, sw = Math.min(46, step - 6);
      for (let n = 0; n <= g.max; n++) {
        const x = this.sx(g, n), start = n === g.a, land = g.state === 'yay' && n === g.ans && g.yayT > 0.3 + g.b * 0.42;
        INK = OL;
        inkEllipse(x, Y + 6, sw / 2 + 2, 14, 0, start ? '#5adc7a' : land ? '#ffc83d' : '#4a3a5a', 2);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ellipse(x - 4, Y + 1, sw / 4, 4);
        text(String(n), x, Y + 48, g.max > 10 ? 17 : 22, '#fff', 'center', 800);
      }
      // hop arcs: shown as a counting hint after a wrong answer, and as Pip hops on a right one
      const dir = g.sub ? -1 : 1;
      const arcs = g.state === 'yay' ? clamp(Math.floor((g.yayT - 0.3) / 0.42) + 1, 0, g.b) : g.hint ? g.b : 0;
      for (let k = 0; k < arcs; k++) {
        const x0 = this.sx(g, g.a + dir * k), x1 = this.sx(g, g.a + dir * (k + 1));
        ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 3; ctx.setLineDash(g.state === 'yay' ? [] : [6, 6]);
        ctx.beginPath(); ctx.moveTo(x0, Y - 8); ctx.quadraticCurveTo((x0 + x1) / 2, Y - 70, x1, Y - 8); ctx.stroke(); ctx.setLineDash([]);
        inkCircle((x0 + x1) / 2, Y - 50, 11, '#fff6a8', 1.2); text(String(k + 1), (x0 + x1) / 2, Y - 49, 13, '#5a2a6e', 'center', 800);
      }
      // Pip on his stone (hopping along on a right answer)
      let px = this.sx(g, g.a), lift = 0;
      if (g.state === 'yay') {
        const t = clamp((g.yayT - 0.3) / 0.42, 0, g.b), k = Math.floor(Math.min(t, g.b - 0.001)), f = t - k;
        px = lerp(this.sx(g, g.a + dir * k), this.sx(g, g.a + dir * (k + 1)), t >= g.b ? 1 : f);
        lift = t >= g.b ? 0 : Math.sin(f * Math.PI) * 50;
      }
      drawCritter('Pip the Baby Dragon', px, Y + 4 - lift, 0.36, dir);
      // answer stones
      const n = g.choices.length, bw = 150, bx = rowX(n, bw, 22);
      g.choices.forEach((v, i) => {
        const used = g.tried.includes(i), right = g.state === 'yay' && i === g.answer;
        button(`ch:${i}`, bx(i) + shakeX(g, i), 420, bw, 96, '', { color: right ? '#ffc83d' : used ? '#c9bcd4' : CHOICE_COLS[i], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        outlined(String(v), bx(i) + bw / 2 + shakeX(g, i), 466, 48, '#fff', 'center', 'rgba(60,20,80,.6)');
      });
    },
  });
  // "Start on 3. Hop 4 more!" with the numbers big
  const clueSentence = g => {
    const parts = [['Start on ', 0], [String(g.a), 1], ['.  Hop ', 0], [String(g.b), 2], [g.sub ? ' back!' : ' more!', 0]];
    ctx.font = `700 30px ${FONT}`;
    let x = W / 2 - parts.reduce((w, [p, k]) => w + ctx.measureText(p).width + (k ? 14 : 0), 0) / 2;
    for (const [p, k] of parts) {
      ctx.font = `700 30px ${FONT}`; const w = ctx.measureText(p).width + (k ? 14 : 0);
      if (k) outlined(p, x + w / 2, 102, 38, k === 1 ? '#3fbf6a' : '#ff8a3a', 'center', '#fff');
      else text(p, x, 102, 30, '#5a2a6e', 'left', 700);
      x += w;
    }
  };

  restage('volcano', {
    bg: 'volcano_bg',
    games: [['warmeggs', 'ember', {}], ['numberhops', 'crystal', {}]],
    intro: ["N:Rawr! I mean... hi. Can you help me? My baby brother and sister eggs are getting cold!", "N:I'll breathe fire to warm them up. You tell me which egg. But not too hot!", 'A:determined:Warm, but not too warm. Got it!'],
    mid: ["N:Rawr! They're all cosy now. Want to play my favourite hopping game?", 'N:I hop along the stepping stones over the lava. You tell me where I land!', 'A:excited:Hop, hop, hop!'],
    outro: ['N:Embers and crystals for my new best friend. Rawr!', 'A:laughing:Rawr to you too, Pip!'],
  });

  // =====================================================================================
  // 5. CLOUD CASTLE — Princess Nimbus
  // =====================================================================================
  const tower = (x, top, w, base, roof, banner) => {
    INK = OL;
    inkRect(x - w / 2, top, w, base - top, '#f6efff', 2.5, 4);
    ctx.fillStyle = 'rgba(160,130,220,.18)'; ctx.fillRect(x + w / 6, top + 3, w / 3 - 3, base - top - 6);
    for (let k = 0; k < 3; k++) inkRect(x - w / 2 + k * (w / 3) + 2, top - 10, w / 3 - 4, 12, '#f6efff', 2, 2);
    ink(P2(`M${x - w / 2 - 8},${top - 6} L${x},${top - w * 1.25} L${x + w / 2 + 8},${top - 6} Z`), roof, 2.5);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; tri(x - w / 2, top - 8, x - 4, top - w * 1.15, x - w / 6, top - 8);
    const fy = top - w * 1.25, wave = Math.sin(S.t * 4 + x) * 4;
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x, fy - 22); ctx.stroke();
    ink(P2(`M${x},${fy - 22} C${x + 10},${fy - 26 + wave} ${x + 18},${fy - 18 - wave} ${x + 28},${fy - 20 + wave} L${x + 22},${fy - 14} L${x + 28},${fy - 8 + wave} C${x + 18},${fy - 6 - wave} ${x + 10},${fy - 12 + wave} ${x},${fy - 10} Z`), banner, 1.5);
    for (let y = top + 22; y < base - 30; y += 46) { glow(x, y + 10, 18, '255,220,120', 0.5); inkRect(x - 6, y, 12, 20, '#ffe08a', 1.5, 6); }
  };
  const drawCastle = (cx, by, s) => {
    ctx.save(); ctx.translate(cx, by); ctx.scale(s, s); ctx.translate(-480, -330);
    tower(320, 250, 40, 330, '#c6a2ff', '#ff6fb5'); tower(640, 250, 40, 330, '#c6a2ff', '#4fa8e0');
    tower(385, 200, 50, 330, '#ff8fc8', '#ffd23a'); tower(575, 200, 50, 330, '#ff8fc8', '#5adc7a');
    INK = OL; inkRect(340, 260, 280, 70, '#f6efff', 2.5, 4);
    for (let k = 0; k < 9; k++) inkRect(342 + k * 31, 250, 22, 12, '#f6efff', 2, 2);
    tower(480, 160, 74, 330, '#ff6fb5', '#ffd23a');
    // the great door and a heart above it
    ink(P2('M456,330 L456,292 C456,272 504,272 504,292 L504,330 Z'), '#c98a56', 2);
    ctx.strokeStyle = 'rgba(90,50,30,.5)'; ctx.lineWidth = 2; for (const x of [468, 480, 492]) { ctx.beginPath(); ctx.moveTo(x, 284); ctx.lineTo(x, 330); ctx.stroke(); }
    heart(480, 262, 18, '#ff6fb5');
    ctx.restore();
  };
  // a long flat cloud bank made of puffs
  const cloudBank = (x0, x1, y, r, fill, line) => {
    const puffs = [];
    for (let x = x0, i = 0; x <= x1; x += r * 1.1, i++) puffs.push([x, y - (i % 2) * r * 0.35, r * (0.8 + (i % 3) * 0.15)]);
    for (let x = x0 + r * 0.5, i = 0; x <= x1 - r * 0.4; x += r * 1.3, i++) puffs.push([x, y + r * 0.75, r * (0.75 + (i % 2) * 0.12)]);
    ctx.strokeStyle = line; ctx.lineWidth = 4;
    for (const [x, yy, rr] of puffs) { ctx.beginPath(); ctx.arc(x, yy, rr, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = fill; for (const [x, yy, rr] of puffs) circle(x, yy, rr);
    ctx.fillRect(x0, y, x1 - x0, r * 0.75);
  };
  const rainbowBridge = (x0, y0, x1, y1, h) => {
    ctx.lineCap = 'round';
    ROY.slice(0, 6).forEach(([, c], i) => {
      ctx.strokeStyle = c; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x0, y0 - i * 5); ctx.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - h - i * 5, x1, y1 - i * 5); ctx.stroke();
    });
  };
  BACKDROPS.cloudcastle_bg = () => {
    ctx.fillStyle = vgrad(0, 400, ['#6a5ac0', '#b06ac0', '#ff8aa8', '#ffc88a']); ctx.fillRect(0, 0, W, H);
    for (const s of SKY_STARS.slice(0, 50)) if (s.y < 170) { ctx.fillStyle = `rgba(255,255,240,${0.2 + 0.5 * Math.abs(Math.sin(S.t + s.p))})`; circle(s.x, s.y, s.s * 0.7); }
    // the setting sun behind the castle
    glow(480, 330, 260, '255,230,150', 0.55);
    inkCircle(480, 330, 90, '#ffe08a', 1, 'rgba(255,240,180,.8)');
    // a hot-air balloon drifting by
    const bx = 120 + Math.sin(S.t * 0.3) * 30, by = 150 + Math.sin(S.t * 0.8) * 8;
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5; for (const d of [-10, 10]) { ctx.beginPath(); ctx.moveTo(bx + d * 1.8, by + 22); ctx.lineTo(bx + d, by + 48); ctx.stroke(); }
    INK = OL; inkRect(bx - 12, by + 46, 24, 16, '#c98a56', 1.5, 3);
    ink(P2(`M${bx},${by + 30} C${bx - 40},${by + 6} ${bx - 40},${by - 44} ${bx},${by - 44} C${bx + 40},${by - 44} ${bx + 40},${by + 6} ${bx},${by + 30} Z`), '#ff8fc8', 2);
    ctx.save(); ctx.clip(P2(`M${bx},${by + 30} C${bx - 40},${by + 6} ${bx - 40},${by - 44} ${bx},${by - 44} C${bx + 40},${by - 44} ${bx + 40},${by + 6} ${bx},${by + 30} Z`));
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(bx - 8, by - 50, 16, 90); ctx.fillStyle = '#8fd0ff'; ctx.fillRect(bx - 34, by - 50, 12, 90); ctx.fillRect(bx + 22, by - 50, 12, 90);
    ctx.restore();
    // far cloud bank, floating islands joined by rainbow bridges, then the castle on its cloud
    cloudBank(-20, W + 20, 352, 34, '#ffd8e8', 'rgba(220,140,180,.5)');
    for (const [ix, iy] of [[150, 268], [820, 252]]) {
      cloudBank(ix - 70, ix + 70, iy, 22, '#fff4fa', 'rgba(180,140,210,.6)');
      for (const [dx, h, c] of [[-30, 34, '#ff9acb'], [12, 44, '#c6a2ff'], [44, 28, '#ffb0d8']]) { inkRect(ix + dx - 3, iy - h * 0.6, 6, h * 0.6, '#b07a5a', 1, 2); inkCircle(ix + dx, iy - h * 0.7, h * 0.4, c, 1.5); }
    }
    rainbowBridge(206, 266, 330, 326, 50); rainbowBridge(630, 326, 764, 250, 50);
    drawCastle(480, 330, 1);
    cloudBank(280, 680, 330, 30, '#ffffff', 'rgba(180,140,210,.6)');
    // birds and sparkles
    ctx.strokeStyle = '#5a3a7a'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const x = (S.t * 26 + i * 70) % (W + 100) - 50, y = 110 + (i % 2) * 20 + Math.sin(S.t * 2 + i) * 4, f = Math.sin(S.t * 8 + i) * 4; ctx.beginPath(); ctx.moveTo(x - 8, y - f); ctx.quadraticCurveTo(x - 3, y - 4, x, y); ctx.quadraticCurveTo(x + 3, y - 4, x + 8, y - f); ctx.stroke(); }
    for (let i = 0; i < 10; i++) star((i * 97 + 30) % W, 180 + (i * 61) % 180, 3 + 3 * Math.abs(Math.sin(S.t * 2 + i)), 'rgba(255,255,255,.85)', 4);
    // the cloud floor Aubrey stands on
    cloudBank(-30, W + 30, 440, 40, '#ffffff', 'rgba(170,140,210,.7)');
    ctx.fillStyle = vgrad(440, H, ['#ffffff', '#f6eaff', '#ead8ff']); ctx.fillRect(0, 446, W, H - 446);
    ctx.fillStyle = 'rgba(255,190,220,.35)'; for (let i = 0; i < 12; i++) ellipse((i * 173) % W, 480 + (i * 31) % 50, 50, 10);
    for (const [x, y] of [[80, 500], [360, 520], [600, 496], [880, 520]]) { star(x, y, 5 + 2 * Math.sin(S.t * 3 + x), '#ffd8f0', 4); }
  };

  // --- Cloud Bounce: bounce up from cloud to cloud to reach the castle ---
  const CB_V = 820, CB_G = 1500, CB_SY = 430;
  MG.cloudbounce = {
    kind: 'action', title: () => 'Cloud Bounce', icon: () => '☁️',
    how: () => 'Aubrey bounces on every cloud! Steer left and right with the arrow keys or the mouse, and bounce all the way up to the castle. Pink clouds bounce extra high!',
    init(g) {
      const TOP = [1900, 2500, 3100][g.tier - 1], [gmin, gmax] = [[95, 120], [105, 135], [115, 148]][g.tier - 1], cw = [160, 140, 124][g.tier - 1];
      const clouds = [{ x: 480, wy: 0, w: 1200, kind: 'floor' }];
      let x = 480;
      for (let wy = 120; wy < TOP - 90; wy += rand(gmin, gmax)) {
        x = clamp(x + (Math.random() < 0.5 ? -1 : 1) * rand(130, 280), 90, 870);
        const r = Math.random();
        clouds.push({ x, x0: x, wy, w: cw, kind: r < 0.12 ? 'bouncy' : r < 0.12 + [0, 0.2, 0.3][g.tier - 1] ? 'move' : 'plain', ph: rand(0, 6), sq: 0, star: Math.random() < 0.35 });
      }
      clouds.push({ x: 480, wy: TOP, w: 420, kind: 'castle', sq: 0 });
      Object.assign(g, { TOP, clouds, x: 480, wy: 0, vy: CB_V, vx: 0, cam: 0, maxH: 0, falls: 0, stars: 0, last: clouds[0], facing: 1, timeLeft: [60, 70, 80][g.tier - 1], state: 'play', t2: 0, rescue: 0, land: 0 });
      g.say = 'Bounce up the clouds to the castle!';
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.rescue = Math.max(0, g.rescue - dt); g.land = Math.max(0, g.land - dt);
      for (const c of g.clouds) { c.sq = Math.max(0, (c.sq || 0) - dt); if (c.kind === 'move') c.x = c.x0 + Math.sin(S.t * 1.2 + c.ph) * 90; }
      if (g.state === 'play') {
        g.timeLeft -= dt;
        let want = 0;
        if (goLeft()) want = -1; else if (goRight()) want = 1;
        if (want) { g.vx = lerp(g.vx, want * 400, Math.min(1, dt * 10)); g.usePointer = false; }
        else if (pointerMoved(g)) g.vx = clamp((pointer.x - g.x) * 6, -420, 420);
        else g.vx = lerp(g.vx, 0, Math.min(1, dt * 6));
        if (Math.abs(g.vx) > 20) g.facing = Math.sign(g.vx);
      }
      g.x += g.vx * dt;
      if (g.x < -20) g.x = W + 20; if (g.x > W + 20) g.x = -20;
      const prev = g.wy;
      g.vy -= CB_G * dt; g.wy += g.vy * dt;
      // once she's won she stays put on the castle; without this guard she 'lands' again every frame and the jump sound drones
      if (g.vy < 0 && (g.state === 'play' || g.timeout)) for (const c of g.clouds) {
        if (prev >= c.wy && g.wy <= c.wy && Math.abs(g.x - c.x) < c.w / 2 + 12) {
          g.wy = c.wy; c.sq = 0.25; g.land = 0.12; g.last = c;
          g.vy = c.kind === 'bouncy' ? CB_V * 1.42 : CB_V;
          if (c.kind === 'bouncy') { tone(500, 0.3, 'sine', 0.08, 0, 1200); burst(c.x, CB_SY - (c.wy - g.cam), 12, { colors: ['#ffb0d8', '#fff'] }); } else SFX.jump();
          if (c.kind === 'castle' && g.state === 'play') {
            g.state = 'win'; g.t2 = 2.6; g.vy = 0; SFX.fanfare(); burst(g.x, 200, 40); speak('You made it to Cloud Castle!');
          }
          break;
        }
      }
      if (g.state === 'win' && !g.timeout) { g.wy = g.TOP; g.vy = 0; }
      g.maxH = Math.max(g.maxH, g.wy);
      // stars to collect
      for (const c of g.clouds) if (c.star && Math.abs(g.x - c.x) < 34 && Math.abs(g.wy + 50 - (c.wy + 60)) < 46) { c.star = false; g.stars++; SFX.sparkle(); floatText(c.x, CB_SY - (c.wy + 60 - g.cam) - 20, '+⭐', '#fff6a8', false, 22); }
      // fell off the bottom: a friendly bird pops her back on her last cloud
      if (g.wy < g.cam - 120 && g.state === 'play') {
        g.falls++; g.wy = g.last.wy; g.x = g.last.x; g.vy = CB_V; g.rescue = 1.2;
        g.cam = Math.min(g.cam, g.last.wy + 40); tone(900, 0.2, 'sine', 0.06, 0, 1300); speak('Whoops! A friendly bird caught you!');
      }
      g.cam = Math.max(g.cam, lerp(g.cam, g.wy - 200, Math.min(1, dt * 5)));
      g.cam = Math.min(g.cam, g.TOP - 90);
      if (g.state === 'play' && g.timeLeft <= 0) { g.state = 'win'; g.t2 = 1.6; g.timeout = true; speak("Time's up! What a climb!"); }
      if (g.state === 'win' && (g.t2 -= dt) <= 0) g.done = true;
      g.timeLeft = Math.max(0, g.timeLeft);
      const reached = g.state === 'win' && !g.timeout;
      g.score = clamp(reached ? Math.max(0.6, 1 - 0.1 * g.falls) + g.stars * 0.02 : 0.8 * g.maxH / g.TOP, 0, 1);
      g.progress = `⭐ ${g.stars}   ${Math.round(100 * Math.min(1, g.maxH / g.TOP))}% up`;
    },
    draw(g) {
      const p = clamp(g.cam / g.TOP, 0, 1), sy = wy => CB_SY - (wy - g.cam);
      ctx.fillStyle = vgrad(0, H, [mix('#ff9ac0', '#3a2a8a', p), mix('#ffb48a', '#8a5ad0', p), mix('#ffe0a0', '#ff9ac8', p)]); ctx.fillRect(0, 0, W, H);
      for (const s of SKY_STARS) { ctx.fillStyle = `rgba(255,255,240,${p * (0.4 + 0.6 * Math.abs(Math.sin(S.t + s.p)))})`; circle(s.x, ((s.y + g.cam * 0.05) % H), s.s * 0.8); }
      for (let i = 0; i < 9; i++) { const y = ((i * 157 + g.cam * 0.3) % (H + 200)) - 100; puffCloud((i * 263 + 60) % W, y, 0.7, 'rgba(255,255,255,.35)', 'rgba(255,255,255,0)'); }
      // the castle waiting at the top
      const cy = sy(g.TOP);
      if (cy > -200) drawCastle(480, cy - 2, 0.9);
      for (const c of g.clouds) {
        const y = sy(c.wy); if (y < -60 || y > H + 60) continue;
        const sq = c.sq ? 1 - Math.sin(c.sq / 0.25 * Math.PI) * 0.18 : 1;
        if (c.kind === 'floor') { cloudBank(-30, W + 30, y + 26, 36, '#ffffff', 'rgba(170,140,210,.7)'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, y + 40, W, H); continue; }
        ctx.save(); ctx.translate(c.x, y + 16); ctx.scale(1, sq);
        if (c.kind === 'castle') cloudBank(-c.w / 2, c.w / 2, 0, 26, '#ffffff', 'rgba(170,140,210,.7)');
        else puffCloud(0, 0, c.w / 108, c.kind === 'bouncy' ? '#ffb8dc' : c.kind === 'move' ? '#d8f0ff' : '#ffffff', 'rgba(150,120,200,.7)');
        ctx.restore();
        if (c.kind === 'bouncy') { star(c.x - 20, y + 16, 5, '#fff', 4); star(c.x + 22, y + 10, 4, '#fff', 4); }
        if (c.kind === 'move') { outlined('⇆', c.x, y + 20, 18, '#4fa8e0', 'center', '#fff'); }
        if (c.star) { glow(c.x, sy(c.wy + 60), 26, '255,240,150', 0.6); vecStar(c.x, sy(c.wy + 60) + Math.sin(S.t * 3 + c.ph) * 4, 13, '#ffe14a', 1.5); }
      }
      // Aubrey
      const ay = sy(g.wy);
      if (g.rescue) { emoji('🕊️', g.x + 10, ay - 150 - g.rescue * 30, 44); }
      drawAubrey(g.x, ay + 6, g.land ? 'crouch' : g.vy > 0 ? 'jump' : 'twirl', g.facing, 0, 0.42);
      // how high so far
      darkPanel(W - 52, 70, 36, 300, 18);
      emoji('🏰', W - 34, 88, 22);
      const hy = 356 - clamp(g.wy / g.TOP, 0, 1) * 252;
      rrect(W - 40, hy - 2, 12, 356 - hy + 6, 6, '#ff9ac8');
      inkCircle(W - 34, hy, 8, '#ffd8b8', 1.5);
      if (g.state === 'play' && g.maxH < 60) outlined('Steer with ← → or the mouse!', W / 2, 140, 26, '#fff6a8');
      if (g.state === 'win') { panel(W / 2 - 230, 150, 460, 70, 22); outlined(g.timeout ? "Time's up! Great climbing!" : 'You reached the castle!', W / 2, 185, 30, '#ff6fb5', 'center', '#fff'); }
    },
  };

  // --- Royal Words: read the sentence and pick the missing sight word ---
  const catInBox = (x, y) => {
    emoji('🐱', x, y - 18, 70);
    INK = OL;
    ink(P2(`M${x - 56},${y - 6} L${x + 56},${y - 6} L${x + 50},${y + 50} L${x - 50},${y + 50} Z`), '#d8a066', 2.5);
    ink(P2(`M${x - 56},${y - 6} L${x - 76},${y - 26} L${x - 40},${y - 30} Z`), '#c08850', 2);
    ink(P2(`M${x + 56},${y - 6} L${x + 76},${y - 26} L${x + 40},${y - 30} Z`), '#c08850', 2);
  };
  const ROYAL = [
    ['I can ___ the moon.', 'see', ['big', 'the'], '🌙'],
    ['The cat is ___ the box.', 'in', ['on', 'big'], catInBox],
    ['A bird can ___.', 'fly', ['is', 'the'], '🐦'],
    ['This is ___ hat.', 'my', ['go', 'is'], '👒'],
    ['We ___ to the castle.', 'go', ['is', 'my'], '🏰'],
    ['The frog can ___.', 'jump', ['the', 'and'], '🐸'],
    ['The sun is ___.', 'up', ['to', 'we'], '☀️'],
    ['Look at the ___ dog!', 'big', ['said', 'to'], '🐕'],
    ['I like to ___.', 'play', ['the', 'is'], '🛝'],
    ['The fish is ___ the water.', 'in', ['said', 'go'], '🐟'],
    ['The ball is ___.', 'red', ['and', 'go'], '🔴'],
    ['She ___ a crown.', 'has', ['to', 'in'], '👑'],
    ['The bunny ___ fast.', 'hops', ['the', 'my'], '🐇'],
    ['Can you ___ me?', 'see', ['big', 'the'], '👋'],
    ['I ___ you!', 'love', ['the', 'is'], '💖'],
    ['Please open the ___.', 'door', ['said', 'is'], '🚪'],
    ['Here is a ___ star.', 'little', ['go', 'said'], '⭐'],
    ['The cake is ___ me!', 'for', ['big', 'can'], '🎂'],
  ];
  MG.royalwords = learnGame({
    title: () => 'Royal Words', icon: () => '📜', unit: 'Scroll',
    how: () => 'Princess Nimbus has royal scrolls with a word missing. Read the sentence, look at the picture, and pick the word that fits!',
    rounds: g => [5, 6, 6][g.tier - 1],
    setup(g) { g.deck = shuffle(ROYAL); },
    make(g) {
      g.item = g.deck[g.round % g.deck.length];
      const [sent, ans, wrong] = g.item;
      g.choices = shuffle([ans, ...wrong]); g.answer = g.choices.indexOf(ans);
      g.say = `${sent.replace('___', 'hmm')} Which word fits?`;
    },
    check: (g, i) => i === g.answer,
    onRight(g) { SFX.sparkle(); burst(W / 2, 300, 24); g.t2 = 2.8; speak(`Yes! ${g.item[0].replace('___', g.item[1])}`); },
    onWrong(g, i) { speak(`${g.item[0].replace('___', g.choices[i])} Hmm, that doesn't sound right. Try another word!`); },
    draw(g) {
      const [sent, ans, , pic] = g.item;
      // the royal scroll
      INK = OL;
      inkRect(150, 78, 660, 286, '#fff4dc', 3, 14);
      for (const x of [150, 810]) { inkRect(x - 14, 70, 28, 302, '#e8b860', 2.5, 14); inkCircle(x, 70, 10, '#ffd23a', 1.5); inkCircle(x, 372, 10, '#ffd23a', 1.5); }
      ctx.fillStyle = 'rgba(200,150,80,.12)'; ctx.fillRect(170, 90, 620, 6);
      glow(W / 2, 170, 80, '255,230,170', 0.6);
      if (typeof pic === 'function') pic(W / 2, 170); else emoji(pic, W / 2, 168, 92);
      // the sentence, with a golden blank (or the word, once found)
      const [a, b] = sent.split('___'), done = g.state === 'yay';
      ctx.font = `700 40px ${FONT}`;
      const word = done ? ans : '', bw = Math.max(110, ctx.measureText(ans).width + 36), wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
      let x = W / 2 - (wa + bw + wb) / 2; const y = 300;
      text(a, x, y, 40, '#5a2a6e', 'left', 700); x += wa;
      if (done) { rrect(x + 4, y - 30, bw - 8, 58, 14, '#d8ffe0', '#3fbf6a', 3); text(word, x + bw / 2, y, 40, '#2a8a4a', 'center', 800); }
      else { const pu = 0.5 + 0.5 * Math.sin(S.t * 4); rrect(x + 4, y - 30, bw - 8, 58, 14, `rgba(255,214,90,${0.25 + 0.2 * pu})`, '#e0a020', 3); text('?', x + bw / 2, y, 34, '#c08010', 'center', 800); }
      x += bw;
      text(b, x, y, 40, '#5a2a6e', 'left', 700);
      // word tiles
      const n = g.choices.length, tw = 210, tx = rowX(n, tw, 26);
      g.choices.forEach((w, i) => {
        const used = g.tried.includes(i), right = done && i === g.answer;
        button(`ch:${i}`, tx(i) + shakeX(g, i), 400, tw, 104, '', { color: right ? '#ffc83d' : used ? '#c9bcd4' : CHOICE_COLS[[2, 0, 1][i]], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        outlined(w, tx(i) + tw / 2 + shakeX(g, i), 450, 44, '#fff', 'center', 'rgba(60,20,80,.6)');
      });
    },
  });

  restage('cloudcastle', {
    bg: 'cloudcastle_bg',
    games: [['cloudbounce', 'stardust', {}], ['royalwords', 'silk', {}]],
    intro: ['*:A castle made of clouds floats high above the treetops.', 'N:Hello down there! The wind blew my royal staircase away. Can you bounce up the clouds to reach me?', 'A:excited:Bouncy clouds? Best day EVER!'],
    mid: ['N:Marvellous! You made it all the way up!', 'N:Now, every royal guest must pass the royal reading test. Find the missing word on each scroll.', 'A:focused:I love reading!'],
    outro: ['N:Stardust and cloud-silk, from my royal treasury. You are a true royal reader!', 'A:happy:Thank you, Your Highness!'],
  });
}
