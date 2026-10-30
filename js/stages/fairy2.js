'use strict';
// Fairy Ring: Wand Spells, reworked as a dance-and-cast rhythm game.
// Arrows fall down four lanes to glowing pads; each arrow makes Aubrey do a different dramatic dance move.
// After each round's dance she traces a glowing shape with her wand, and the spell (sized by how well
// she danced) bursts across the fairy ring.
{
  const PI = Math.PI;
  const sq = (a, b) => Math.hypot(a, b);
  const ease = k => 1 - (1 - k) * (1 - k);
  const back = k => { const c = 1.7; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
  const glow = (x, y, r, col, a = 1) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = a; ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1;
  };
  // a small seeded random, so spell effects look the same every frame
  const seeded = s => () => ((s = (s * 16807) % 2147483647) / 2147483647);

  // --- the shapes she traces (copied from b3.js, which keeps them block-scoped) -----------------
  const SHAPES = {
    circle: () => Array.from({ length: 49 }, (_, i) => [Math.cos(-PI / 2 + i / 48 * TAU) * 0.9, Math.sin(-PI / 2 + i / 48 * TAU) * 0.9]),
    triangle: () => [[0, -0.95], [0.95, 0.75], [-0.95, 0.75], [0, -0.95]],
    heart: () => Array.from({ length: 61 }, (_, i) => { const t = i / 60 * TAU; return [16 * Math.sin(t) ** 3 / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.1]; }),
    wave: () => Array.from({ length: 41 }, (_, i) => { const x = -1 + i / 20; return [x, -Math.sin(x * PI * 1.5) * 0.45]; }),
    star: () => Array.from({ length: 6 }, (_, i) => { const a = -PI / 2 + i * 4 * PI / 5; return [Math.cos(a) * 0.95, Math.sin(a) * 0.95 + 0.08]; }),
    zigzag: () => [[-0.95, -0.6], [-0.5, 0.6], [0, -0.6], [0.5, 0.6], [0.95, -0.6]],
    spiral: () => Array.from({ length: 70 }, (_, i) => { const t = i / 69, a = t * 3.6 * PI; return [Math.cos(a) * (0.12 + 0.85 * t), Math.sin(a) * (0.12 + 0.85 * t)]; }),
    moon: () => [...Array.from({ length: 25 }, (_, i) => { const a = -PI / 2 - i / 24 * PI; return [Math.cos(a) * 0.9 + 0.1, Math.sin(a) * 0.9]; }),
      ...Array.from({ length: 25 }, (_, i) => { const a = PI / 2 - i / 24 * PI; return [Math.cos(a) * 0.62 - 0.12, Math.sin(a) * 0.9]; })],
  };
  const resample = (pts, step) => {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = out[out.length - 1], [bx, by] = pts[i]; let d = sq(bx - ax, by - ay);
      let px = ax, py = ay;
      while (d >= step) { const k = step / d; px += (bx - px) * k; py += (by - py) * k; out.push([px, py]); d = sq(bx - px, by - py); }
    }
    out.push(pts[pts.length - 1]);
    return out;
  };

  // --- the four dance moves, one per arrow ---------------------------------------------------
  const LANES = ['left', 'down', 'up', 'right'];
  const DIR = {
    left: { keys: ['arrowleft', 'a'], col: '#ff6fb5', rot: -PI / 2, move: 'Comet Leap' },
    down: { keys: ['arrowdown', 's'], col: '#4fd08a', rot: PI, move: 'Flower Bow' },
    up: { keys: ['arrowup', 'w'], col: '#ffc23d', rot: 0, move: 'Star Spin' },
    right: { keys: ['arrowright', 'd'], col: '#4fb8ec', rot: PI / 2, move: 'Wand Swoosh' },
  };
  const LX = i => 714 + i * 64, PAD_Y = 468, TOP_Y = 92, PANEL = { x: 676, y: 64, w: 266, h: 466 };
  const AX_MIN = 180, AX_MAX = 500, BASE_GY = GY + 14;
  const ARROW = (() => { const p = new Path2D(); [[0, -24], [22, -2], [9, -2], [9, 22], [-9, 22], [-9, -2], [-22, -2]].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; })();
  const drawArrow = (x, y, dir, s, fill, line = OL, lw = 2) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(DIR[dir].rot); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ink(ARROW, fill, lw / s, line); ctx.restore();
  };

  // her photo frames, posed with transforms. pivot 'feet' squashes from the floor, 'mid' spins round her middle
  const NATIVE = AUB_NATIVE, SC = 1.12; // which way each of this hero's photos faces (js/hero.js)
  const aub = (frame, x, gy, facing, o = {}) => {
    const im = IMG[frame]; if (!im) return;
    const s = (o.s ?? 1) * SC, w = im.width * s, h = im.height * s, lift = o.lift || 0;
    ctx.fillStyle = 'rgba(40,20,60,.25)'; ellipse(x, gy - 2, 46 * (1 - Math.min(lift, 200) / 320), 9 * (1 - Math.min(lift, 200) / 320));
    ctx.save();
    const fx = NATIVE[frame] && facing && NATIVE[frame] !== Math.sign(facing) ? -1 : 1;
    if (o.pivot === 'mid') { ctx.translate(x, gy - lift - h / 2); ctx.rotate(o.rot || 0); ctx.scale(fx * (o.sx ?? 1), o.sy ?? 1); ctx.drawImage(im, -w / 2, -h / 2, w, h); }
    else { ctx.translate(x, gy - lift); ctx.rotate(o.rot || 0); ctx.scale(fx * (o.sx ?? 1), o.sy ?? 1); ctx.drawImage(im, -w / 2, -h, w, h); }
    ctx.restore();
  };
  // where the wand's star is in the cast frame when she faces right
  // (the hand furthest out on her right, high up, found in this hero's photo; kept per hero)
  const castHands = {};
  const castHand = () => {
    const im = IMG.cast, c = castHands[HERO.id];
    if (c && c.im === im) return c;
    const W = im.width, H = im.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, W, H).data, flip = NATIVE.cast === -1;
    let bx = flip ? W : -1, by = H * 0.3;
    for (let y = 0; y < H * 0.6; y++) for (let i = 0; i < W; i++) if (d[(y * W + i) * 4 + 3] > 120 && (flip ? i < bx : i > bx)) { bx = i; by = y; }
    return (castHands[HERO.id] = { im, dx: flip ? W / 2 - bx : bx - W / 2, y: by - H });
  };
  const castTip = (x, gy, lift = 0, s = SC) => { const h = castHand(); return [x + h.dx * s, gy - lift + h.y * s]; };

  // --- sparkles of our own (stars, hearts, petals) --------------------------------------------
  const spark = (g, x, y, n, o = {}) => {
    for (let i = 0; i < n; i++) {
      const a = o.a ?? rand(0, TAU), sp = rand(o.v?.[0] ?? 40, o.v?.[1] ?? 180);
      g.sp.push({ x: x + rand(-(o.jx || 0), o.jx || 0), y: y + rand(-(o.jy || 0), o.jy || 0), vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0),
        life: rand(0.5, 1), max: 1, col: pick(o.cols || ['#fff6a8', '#ffb3e0', '#b8e6ff', '#ffffff']), r: rand(o.r?.[0] ?? 3, o.r?.[1] ?? 8), kind: o.kind || 'star', grav: o.grav ?? 60, spin: rand(0, TAU) });
    }
  };
  const drawSparks = g => {
    for (const p of g.sp) {
      const a = clamp(p.life / 0.6, 0, 1);
      ctx.globalAlpha = a;
      if (p.kind === 'heart') heart(p.x, p.y - p.r, p.r * 2.4, p.col);
      else if (p.kind === 'petal') { ctx.fillStyle = p.col; ellipse(p.x, p.y, p.r, p.r * 0.55, p.spin); }
      else { star(p.x, p.y, p.r, p.col, 4); if (p.r > 5) { ctx.globalAlpha = a * 0.5; star(p.x, p.y, p.r * 0.5, '#ffffff', 4); } }
    }
    ctx.globalAlpha = 1;
  };

  // --- spells: one for each shape, drawn bigger the better she danced -------------------------
  const RING = { x: 480, y: 404, rx: 250, ry: 40 };
  const SPELLS = {
    heart: { name: 'Flower Bloom Spell', icon: '🌸', say: 'Flowers bloom all over the ring!' },
    circle: { name: 'Mushroom Glow Spell', icon: '🍄', say: 'The mushrooms glow!' },
    wave: { name: 'Rainbow Spell', icon: '🌈', say: 'A rainbow!' },
    triangle: { name: 'Crystal Spell', icon: '💎', say: 'Magic crystals grow!' },
    star: { name: 'Star Shower Spell', icon: '⭐', say: 'It is raining stars!' },
    zigzag: { name: 'Firefly Spell', icon: '✨', say: 'The fireflies light up!' },
    moon: { name: 'Moonrise Spell', icon: '🌙', say: 'The moon rises!' },
    spiral: { name: 'Butterfly Spell', icon: '🦋', say: 'Butterflies everywhere!' },
  };
  const FLOWER_COLS = ['#ff7ab8', '#ffd84a', '#b98af0', '#ff9a5a', '#7ad0ff', '#ffffff'];
  const GEM_COLS = ['#8ad8ff', '#d8a2ff', '#ff9ad6', '#9affd8', '#fff1a0'];
  const makeSpell = (shape, power) => {
    const r = seeded(7 + Math.floor(power * 1000) + shape.length * 31), n = k => Math.round(k[0] + (k[1] - k[0]) * power);
    const items = [];
    if (shape === 'heart') for (let i = 0; i < n([8, 34]); i++) items.push({ x: 30 + r() * 900, y: 372 + r() * 160, d: r() * 1.4, c: FLOWER_COLS[Math.floor(r() * 6)], s: 0.7 + r() * 0.7 });
    if (shape === 'circle') for (let i = 0; i < n([6, 22]); i++) { const a = r() * TAU, o = i % 2 ? 1 : 1.35; items.push({ x: RING.x + Math.cos(a) * RING.rx * o, y: RING.y + 16 + Math.sin(a) * RING.ry * o * 1.6, d: r() * 1.2, c: pick(['#ff8ad0', '#8ad4ff', '#c6a2ff', '#a6f0b8', '#ffd860']), s: 0.6 + r() * 0.6 }); }
    if (shape === 'triangle') for (let i = 0; i < n([5, 18]); i++) items.push({ x: 40 + r() * 880, y: 400 + r() * 120, d: r() * 1.2, c: GEM_COLS[Math.floor(r() * 5)], s: 0.6 + r() * 0.8, t: r() * 0.6 - 0.3 });
    if (shape === 'star') for (let i = 0; i < n([12, 46]); i++) items.push({ x: r() * W, d: r() * 2.2, v: 260 + r() * 200, s: 6 + r() * 10, ly: 380 + r() * 140, c: pick(['#fff6a8', '#ffe36b', '#ffffff', '#ffd0f0']) });
    if (shape === 'zigzag') for (let i = 0; i < n([10, 44]); i++) items.push({ x: r() * W, y: 400 + r() * 130, d: r() * 1.2, h: 120 + r() * 260, ph: r() * TAU, s: 0.6 + r() * 0.7 });
    if (shape === 'moon') for (let i = 0; i < n([10, 50]); i++) items.push({ x: r() * W, y: 70 + r() * 260, d: 0.4 + r() * 1.6, s: 2 + r() * 4 });
    if (shape === 'spiral') for (let i = 0; i < n([8, 28]); i++) items.push({ a: r() * TAU, d: r() * 1.2, sp: 70 + r() * 90, c: pick(['#ff8ad0', '#7ad0ff', '#ffd84a', '#b98af0', '#ff9a5a']), s: 0.7 + r() * 0.6, ph: r() * 10 });
    return { shape, power, items, t: 0 };
  };
  const mushroom = (x, y, s, c, k, pulse) => {
    if (k <= 0) return;
    const h = 34 * s * k;
    glow(x, y - h, 60 * s * k, c, 0.5 + 0.4 * pulse);
    ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k);
    inkRect(-7, -34, 14, 34, '#fff6ea', 1.5, 6);
    ink(P2('M-28,-30 C-28,-60 28,-60 28,-30 Z'), c, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; circle(-12, -42, 5); circle(8, -48, 4); circle(16, -36, 3.5);
    ctx.restore();
  };
  const crystal = (x, y, s, c, tilt, k) => {
    if (k <= 0) return;
    glow(x, y - 30 * s * k, 70 * s * k, 'rgba(220,240,255,.75)', 0.7);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s * k, s * k);
    const big = P2('M-14,0 L-16,-44 L0,-70 L16,-44 L14,0 Z'), small = P2('M10,0 L14,-30 L26,-42 L32,-26 L26,0 Z');
    ink(small, mix(c, '#ffffff', 0.2), 1.6); ink(big, c, 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(P2('M-8,-6 L-10,-44 L0,-62 L-2,-44 Z'));
    ctx.restore();
  };
  const butterfly = (x, y, s, c, flap) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const w = 0.35 + 0.65 * Math.abs(Math.sin(flap));
    ctx.save(); ctx.scale(w, 1);
    inkEllipse(-12, -6, 13, 10, -0.5, c, 1.2); inkEllipse(12, -6, 13, 10, 0.5, c, 1.2);
    inkEllipse(-9, 8, 8, 7, 0.4, mix(c, '#ffffff', 0.35), 1.2); inkEllipse(9, 8, 8, 7, -0.4, mix(c, '#ffffff', 0.35), 1.2);
    ctx.restore();
    inkEllipse(0, 0, 3, 12, 0, '#5b3f73', 0.8);
    ctx.restore();
  };
  const drawSpell = (fx, behind) => {
    const { shape, power, items, t } = fx, out = clamp((4.2 - t) / 0.6, 0, 1);
    ctx.save(); ctx.globalAlpha = out;
    if (behind) {
      // the parts that go behind Aubrey: sky things
      if (shape === 'moon') {
        ctx.fillStyle = `rgba(20,16,70,${0.4 * clamp(t / 0.8, 0, 1) * out})`; ctx.fillRect(0, 0, W, H);
        for (const s of items) { const a = clamp((t - s.d) / 0.4, 0, 1) * (0.5 + 0.5 * Math.sin(t * 5 + s.x)); ctx.globalAlpha = a * out; star(s.x, s.y, s.s * 1.6, '#fffbe0', 4); }
        ctx.globalAlpha = out;
        const rad = 46 + 54 * power, my = lerp(470 + rad, 230, ease(clamp(t / 1.8, 0, 1)));
        glow(790, my, rad * 3, 'rgba(255,248,210,.7)');
        inkCircle(790, my, rad, '#fff6cc', 1.5, 'rgba(255,230,170,.7)');
        ctx.fillStyle = 'rgba(232,214,170,.6)'; for (const [dx, dy, r] of [[-0.35, -0.3, 0.18], [0.25, 0.1, 0.13], [-0.1, 0.35, 0.2]]) circle(790 + dx * rad, my + dy * rad, r * rad);
      }
      if (shape === 'wave') {
        const R = 220 + 160 * power, bw = 12 + 10 * power, sweep = ease(clamp(t / 1.3, 0, 1));
        const cols = ['#ff5a5a', '#ff9f43', '#ffd84a', '#5fd07a', '#4fb8ec', '#6a7aff', '#b56aff'];
        glow(480, 470, R + 60, 'rgba(255,255,255,.35)');
        ctx.lineWidth = bw + 1; ctx.lineCap = 'butt';
        cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(480, 470, R - i * bw, PI, PI + PI * sweep); ctx.stroke(); });
        // cloud puffs at the rainbow's feet
        if (sweep > 0.95) for (const sx of [480 - R + bw * 3, 480 + R - bw * 3]) { ctx.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[-26, 0, 22], [0, -12, 28], [26, 0, 22]]) circle(sx + dx, 456 + dy, r * (0.8 + power * 0.4)); }
      }
      if (shape === 'star') for (const s of items) {
        const tt = t - s.d; if (tt < 0) continue;
        const y = 40 + tt * s.v;
        if (y < s.ly) {
          ctx.strokeStyle = 'rgba(255,250,200,.5)'; ctx.lineWidth = s.s * 0.6; ctx.beginPath(); ctx.moveTo(s.x - 20, y - 60); ctx.lineTo(s.x, y); ctx.stroke();
          star(s.x, y, s.s, s.c, 5);
        } else { const k = clamp((y - s.ly) / 200, 0, 1); glow(s.x, s.ly, 30 + s.s * 2, 'rgba(255,245,180,.9)', 1 - k); star(s.x, s.ly, s.s * (1 - k * 0.5), s.c, 5); }
      }
    } else {
      if (shape === 'heart') for (const f of items) {
        const k = clamp((t - f.d) / 0.5, 0, 1); if (!k) continue;
        const sz = (9 + 9 * power) * f.s, b = back(k);
        ctx.strokeStyle = '#3e9a4e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x, f.y - sz * 1.8 * k); ctx.stroke();
        ctx.fillStyle = '#5fc86a'; ellipse(f.x + 6, f.y - sz * 0.8 * k, 7 * k, 3.5 * k, -0.5);
        flower(f.x, f.y - sz * 1.8 * k, sz * b, f.c, '#ffd84a', 1);
      }
      if (shape === 'circle') for (const m of items) mushroom(m.x, m.y, m.s * (0.8 + power * 0.5), m.c, back(clamp((t - m.d) / 0.5, 0, 1)), 0.5 + 0.5 * Math.sin(t * 6 + m.x));
      if (shape === 'triangle') [...items].sort((a, b) => a.y - b.y).forEach(c => crystal(c.x, c.y, c.s * (0.7 + power * 0.5), c.c, c.t, back(clamp((t - c.d) / 0.5, 0, 1))));
      if (shape === 'zigzag') for (const f of items) {
        const tt = t - f.d; if (tt < 0) continue;
        const k = ease(clamp(tt / 2.4, 0, 1)), x = f.x + Math.sin(tt * 2 + f.ph) * 30, y = f.y - f.h * k, blink = 0.5 + 0.5 * Math.sin(tt * 9 + f.ph);
        glow(x, y, 26 * f.s * (0.7 + power * 0.5), 'rgba(230,255,140,.95)', 0.4 + 0.6 * blink);
        ctx.fillStyle = '#fffbd0'; circle(x, y, 3.5 * f.s);
      }
      if (shape === 'spiral') for (const b of items) {
        const tt = t - b.d; if (tt < 0) continue;
        const rad = tt * b.sp, a = b.a + tt * 1.6;
        butterfly(480 + Math.cos(a) * rad * 1.6, Math.max(130, 300 + Math.sin(a) * rad * 0.8 - tt * 30), b.s * (0.55 + power * 0.35) * clamp(tt * 3, 0, 1), b.c, t * 14 + b.ph);
      }
    }
    ctx.restore();
  };

  // --- the game --------------------------------------------------------------------------------
  const TIERS = [
    { beat: 0.75, notes: 6, lead: 2.3, good: 0.32, perfect: 0.14, rounds: 3, tol: 46, time: 15, shapes: ['circle', 'heart', 'wave', 'triangle'] },
    { beat: 0.64, notes: 8, lead: 2.0, good: 0.27, perfect: 0.12, rounds: 3, tol: 40, time: 13, shapes: ['circle', 'heart', 'wave', 'triangle', 'star', 'zigzag'] },
    { beat: 0.54, notes: 10, lead: 1.75, good: 0.23, perfect: 0.1, rounds: 4, tol: 34, time: 11, shapes: ['star', 'zigzag', 'spiral', 'moon', 'heart', 'wave'] },
  ];
  // chime music: root note per bar, and a little tune for good steps
  const ROOTS = [262, 220, 175, 196], CHIME = [2, 3, 4, 3], MELODY = [784, 880, 1047, 1175, 1319, 1175, 1047, 880];
  const pattern = (tier, n) => {
    const dirs = [];
    if (tier === 1) {
      // pairs of the same arrow: an easy groove
      const order = shuffle([...LANES]);
      while (dirs.length < n) { const d = order[(dirs.length / 2) % 4]; dirs.push(d, d); }
    } else {
      while (dirs.length < n) {
        const kind = pick(tier === 2 ? ['pair', 'alt', 'single'] : ['alt', 'single', 'run', 'pair']);
        const a = pick(LANES), b = pick(LANES.filter(d => d !== a));
        if (kind === 'pair') dirs.push(a, a);
        else if (kind === 'alt') dirs.push(a, b, a, b);
        else if (kind === 'run') dirs.push(...shuffle([...LANES]));
        else dirs.push(pick(LANES.filter(d => d !== dirs[dirs.length - 1])));
      }
    }
    // spacing in beats: tier 1 always two beats; higher tiers mix in quick steps
    let beat = 0;
    return dirs.slice(0, n).map((dir, i) => {
      const note = { beat, dir, judged: null };
      beat += tier === 1 ? 2 : tier === 2 ? (i % 4 === 3 ? 2 : pick([1, 2, 2])) : pick([1, 1, 2]);
      return note;
    });
  };

  MG.fairywand = {
    kind: 'action', title: () => 'Wand Spells', icon: () => '🪄',
    how: () => 'Dance to the fairy music! Press the arrow key (or tap the pad) when an arrow lands on its glowing pad. Then trace the magic shape with your wand to cast the spell!',
    init(g) {
      const T = TIERS[g.tier - 1];
      Object.assign(g, { T, rounds: T.rounds, round: 0, total: 0, list: shuffle([...T.shapes]).slice(0, T.rounds), sp: [], ax: 340, hits: [],
        wx: 0, wy: 0, trail: [], fx: null, meter: 0, meterShow: 0, combo: 0, results: [] });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const T = g.T;
      g.notes = pattern(g.tier, T.notes).map(n => ({ ...n, t: n.beat * T.beat }));
      g.state = 'dance'; g.time = -4 * T.beat; g.beatDone = -5; g.pts = 0; g.meter = 0; g.combo = 0;
      g.end = g.notes[g.notes.length - 1].t + T.beat * 1.5;
      g.move = null; g.oops = 0; g.pulse = 0; g.flash = {};
      g.shape = g.list[g.round];
      g.say = g.round === 0 ? 'Dance to the beat! Press the arrow when it lands on its pad.' : `Spell ${g.round + 1}. Dance!`;
      if (g.phase === 'play') speak(g.say);
    },
    startTrace(g) {
      const T = g.T, cx = 590, cy = 282, R = 140;
      g.state = 'trace'; g.rhythm = g.pts / g.notes.length;
      g.path = resample(SHAPES[g.shape]().map(([x, y]) => [cx + x * R, cy + y * R]), 9);
      g.prog = 0; g.timeMax = T.time + (g.shape === 'spiral' ? 2 : 0); g.tleft = g.timeMax;
      g.wx = g.path[0][0] - 40; g.wy = g.path[0][1] + 50; g.lpx = undefined; g.usePointer = false; g.lastW = null;
      g.move = null;
      g.say = `Now trace the ${g.shape} with your wand. Start at the big star!`;
      speak(g.say); SFX.sparkle();
    },
    cast(g, frac) {
      g.trace = frac;
      const power = clamp(g.rhythm * (frac >= 1 ? 1 : 0.5 * frac), 0.12, 1);
      g.fx = makeSpell(g.shape, power);
      g.results.push({ rhythm: g.rhythm, trace: frac });
      g.total += 0.6 * g.rhythm + 0.4 * frac;
      g.state = 'spell';
      const sp = SPELLS[g.shape];
      g.say = frac >= 1 ? `${sp.say} ${power >= 0.85 ? 'A super spell!' : ''}` : 'The spell only half worked. Keep going!';
      speak(g.say);
      if (frac >= 1) { SFX.sparkle(); [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.4, 'triangle', 0.07, i * 0.09)); }
      else SFX.miss();
      spark(g, g.wx, g.wy, 30 * power + 10, { v: [80, 320] });
    },
    // a dance move: she does it whenever an arrow is pressed, on the beat or not
    dance(g, dir) {
      const from = g.ax, step = dir === 'left' ? -120 : dir === 'right' ? 120 : 0;
      let to = clamp(from + step, AX_MIN, AX_MAX);
      if (Math.abs(to - from) < 30 && step) to = from; // at the edge she leaps on the spot
      g.move = { dir, t: 0, dur: Math.min(0.62, g.T.beat * 0.95), from, to };
      g.flash[dir] = 0.25;
    },
    judge(g, n, how) {
      n.judged = how; n.at = g.time;
      const lane = LANES.indexOf(n.dir);
      g.hits.push({ x: LX(lane), y: PAD_Y - 64, str: how === 'perfect' ? 'Perfect!' : how === 'good' ? 'Good!' : 'Miss', col: how === 'perfect' ? '#fff27a' : how === 'good' ? '#9affc0' : '#d0c0e0', life: 0.8 });
      if (how === 'miss') { g.combo = 0; g.oops = 0.5; SFX.miss(); return; }
      g.combo++;
      g.pts += how === 'perfect' ? 1 : 0.75;
      tone(MELODY[g.notes.indexOf(n) % 8] * (how === 'perfect' ? 1 : 0.5), 0.3, 'triangle', 0.08);
      if (how === 'perfect') tone(MELODY[(g.notes.indexOf(n) + 2) % 8] * 2, 0.25, 'sine', 0.04, 0.05);
      spark(g, LX(lane), PAD_Y, how === 'perfect' ? 14 : 7, { cols: [DIR[n.dir].col, '#ffffff', '#fff6a8'], v: [60, 200], grav: 120 });
    },
    update(g, dt) {
      const T = g.T;
      for (const p of g.sp) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.vx *= 0.98; p.spin += dt * 4; }
      g.sp = g.sp.filter(p => p.life > 0);
      for (const h of g.hits) { h.life -= dt; h.y -= dt * 30; }
      g.hits = g.hits.filter(h => h.life > 0);
      for (const k in g.flash) g.flash[k] -= dt;
      g.meterShow = lerp(g.meterShow, g.meter, Math.min(1, dt * 8));
      g.progress = `Spell ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;

      if (g.state === 'dance') {
        g.time += dt; g.pulse = Math.exp(-(((g.time % T.beat) + T.beat) % T.beat) * 7); g.oops = Math.max(0, g.oops - dt);
        // the beat: count-in ticks, then chimes over a soft bass
        const b = Math.floor((g.time + 0.1) / T.beat);
        if (b > g.beatDone && (b + 0.1) * T.beat < g.end) {
          g.beatDone = b;
          const when = b * T.beat - g.time;
          if (b < 0) tone(b === -4 ? 1400 : 1100, 0.07, 'square', 0.035, when);
          else {
            const root = ROOTS[Math.floor(b / 4) % 4];
            if (b % 4 === 0) tone(root / 2, T.beat * 3.6, 'triangle', 0.07, when);
            tone(root * CHIME[b % 4], 0.35, 'sine', 0.045, when);
            noise(0.03, 0.015, when + T.beat / 2);
          }
        }
        if (g.move) { g.move.t += dt; if (g.move.t >= g.move.dur) { g.ax = g.move.to; g.move = null; } }
        if (g.move) this.trailFx(g, dt);
        // which arrow was pressed (keys, or a tap on a pad)
        let dir = null;
        for (const d of LANES) if (DIR[d].keys.some(k => pressed[k])) dir = d;
        if (pointer.clicked) LANES.forEach((d, i) => { if (Math.abs(pointer.x - LX(i)) < 32 && pointer.y > PAD_Y - 60 && pointer.y < H) dir = d; });
        if (dir) {
          this.dance(g, dir);
          let best = null;
          for (const n of g.notes) if (!n.judged && Math.abs(n.t - g.time) < T.good && (!best || Math.abs(n.t - g.time) < Math.abs(best.t - g.time))) best = n;
          if (best) this.judge(g, best, best.dir !== dir ? 'miss' : Math.abs(best.t - g.time) < T.perfect ? 'perfect' : 'good');
        }
        for (const n of g.notes) if (!n.judged && g.time - n.t > T.good) this.judge(g, n, 'miss');
        g.meter = g.pts / g.notes.length;
        if (g.time > g.end) this.startTrace(g);
      } else if (g.state === 'trace') {
        g.tleft -= dt;
        g.ax = lerp(g.ax, 200, Math.min(1, dt * 5));
        let tracing = false;
        const kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        if (kx || ky) { g.wx = clamp(g.wx + kx * 260 * dt, 0, W); g.wy = clamp(g.wy + ky * 260 * dt, 60, H); tracing = true; }
        else if (pointer.down) { g.wx = pointer.x; g.wy = pointer.y; tracing = true; }
        else if (pointerMoved(g)) { g.wx = pointer.x; g.wy = pointer.y; }
        if (tracing) {
          // the wand has to be drawing on from where the glowing line got to, not jumping about
          const [hx, hy] = g.path[g.prog], near = g.lastW && sq(g.lastW[0] - hx, g.lastW[1] - hy) < g.T.tol * 1.8;
          let best = g.prog;
          if (near) for (let j = g.prog + 1; j < Math.min(g.path.length, g.prog + 12); j++) if (sq(g.path[j][0] - g.wx, g.path[j][1] - g.wy) < g.T.tol) best = j;
          if (best > g.prog) { if (Math.floor(best / 8) > Math.floor(g.prog / 8)) tone(700 + best * 6, 0.06, 'sine', 0.05); g.prog = best; }
          g.trail.push({ x: g.wx, y: g.wy, life: 0.5 });
        }
        g.lastW = tracing ? [g.wx, g.wy] : null;
        if (g.prog >= g.path.length - 3) this.cast(g, 1);
        else if (g.tleft <= 0) this.cast(g, g.prog / g.path.length);
      } else if (g.state === 'spell') {
        g.fx.t += dt;
        if (g.fx.t > 0.2 && g.fx.t < 3 && Math.random() < dt * 8) spark(g, rand(80, 880), rand(120, 420), 2, { v: [10, 60], grav: -10 });
        if (g.fx.t > 4.6) { g.round++; g.fx = null; if (g.round >= g.rounds) { g.done = true; g.state = 'over'; } else this.next(g); }
      }
      for (const p of g.trail) p.life -= dt;
      g.trail = g.trail.filter(p => p.life > 0);
    },
    // sparkle trails while she dances
    trailFx(g, dt) {
      const m = g.move, k = m.t / m.dur, x = lerp(m.from, m.to, ease(k));
      if (m.dir === 'left' && Math.random() < dt * 60) spark(g, x + 40, BASE_GY - 120 - 130 * Math.sin(PI * k), 1, { cols: ['#ffb3e0', '#fff6a8', '#ffffff'], v: [10, 50], vx: 60, r: [4, 9], grav: 20 });
      if (m.dir === 'up' && Math.random() < dt * 50) { const a = k * TAU * 2 + rand(0, TAU); spark(g, x + Math.cos(a) * 80, BASE_GY - 120 - 110 * Math.sin(PI * k), 1, { cols: ['#ffe36b', '#fff6a8'], v: [10, 40], r: [4, 9], grav: 10 }); }
      if (m.dir === 'right' && k > 0.15 && Math.random() < dt * 60) { const [tx, ty] = castTip(x, BASE_GY, 40 * Math.sin(PI * k)); spark(g, tx, ty, 1, { cols: ['#b8e6ff', '#ffffff', '#fff6a8'], v: [20, 90], r: [4, 9] }); }
      if (m.dir === 'down' && k > 0.25 && !m.bloomed) { m.bloomed = true; for (let i = 0; i < 14; i++) spark(g, x, BASE_GY - 20, 1, { a: PI + (i / 13) * PI, v: [160, 240], kind: i % 2 ? 'heart' : 'petal', cols: ['#ff7ab8', '#ffb3e0', '#ffd84a', '#b98af0'], r: [5, 8], grav: 160 }); }
    },
    drawAubrey(g) {
      const gy = BASE_GY, m = g.move;
      if (g.state === 'trace') {
        const bob = Math.sin(S.t * 3) * 4;
        aub('cast', g.ax, gy, 1, { lift: 6 + bob });
        return castTip(g.ax, gy, 6 + bob);
      }
      if (g.state === 'spell' || g.state === 'over') {
        const t = g.fx ? g.fx.t : 0;
        aub('twirl', g.ax, gy, 1, { sx: Math.cos(t * 5), lift: Math.abs(Math.sin(t * 3)) * 40, pivot: 'mid' });
        return null;
      }
      if (!m) {
        // idle: bounce on the beat, wobble after a miss
        const p = g.pulse * g.pulse, wob = g.oops > 0 ? Math.sin(g.oops * 40) * 0.1 * (g.oops / 0.5) : 0;
        aub('idle_front', g.ax, gy, 1, { sy: 1 - 0.035 * p, sx: 1 + 0.02 * p, rot: wob });
        return null;
      }
      const k = clamp(m.t / m.dur, 0, 1), e = Math.sin(PI * k), x = lerp(m.from, m.to, ease(k));
      if (m.dir === 'left') {
        // Comet Leap: a big flying leap to the left, leaning into it, with a comet tail
        const lift = 130 * e, my = gy - 130 - lift;
        // the comet tail streams out behind her
        ctx.save(); ctx.globalAlpha = e;
        const tg = ctx.createLinearGradient(x, 0, x + 230, 0);
        tg.addColorStop(0, 'rgba(255,190,235,.85)'); tg.addColorStop(0.5, 'rgba(200,170,255,.45)'); tg.addColorStop(1, 'rgba(160,220,255,0)');
        ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(x, my - 60); ctx.quadraticCurveTo(x + 120, my - 40 + 40 * k, x + 240, my + 30 + 60 * (1 - k)); ctx.quadraticCurveTo(x + 120, my + 50, x, my + 60); ctx.closePath(); ctx.fill();
        for (let i = 0; i < 6; i++) star(x + 40 + i * 34, my + Math.sin(S.t * 9 + i) * 18 + i * 6, 8 - i, '#fffbe0', 4);
        ctx.restore();
        aub('jump', x, gy, -1, { lift, rot: -0.3 * e, pivot: 'mid', s: 1.05 });
      } else if (m.dir === 'right') {
        // Wand Swoosh: a lunge to the right, sweeping a big arc of light with the wand
        const lift = 40 * e;
        const cx = x - 20, cy = gy - 120 - lift, a0 = -PI * 0.95, a1 = a0 + PI * 1.25 * ease(k);
        ctx.save(); ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = ['rgba(120,200,255,.35)', 'rgba(200,235,255,.6)', 'rgba(255,255,255,.9)'][i]; ctx.lineWidth = [26, 14, 5][i];
          ctx.beginPath(); ctx.arc(cx, cy, 150, Math.max(a0, a1 - 2.2), a1); ctx.stroke();
        }
        ctx.restore();
        star(cx + Math.cos(a1) * 150, cy + Math.sin(a1) * 150, 16, '#fffbe0', 4);
        aub('cast', x, gy, 1, { lift, rot: 0.12 * e });
      } else if (m.dir === 'up') {
        // Star Spin: two fast spins up into the air inside a ring of orbiting stars
        const lift = 110 * e, a = k * TAU * 2, mid = gy - 120 - lift;
        const ring = (front) => { for (let i = 0; i < 8; i++) { const b = a * 1.3 + i / 8 * TAU; if ((Math.sin(b) > 0) !== front) continue; star(x + Math.cos(b) * 95, mid + Math.sin(b) * 26, 9 + 3 * Math.sin(b), '#ffe36b', 5); } };
        glow(x, mid, 150, 'rgba(255,240,170,.5)', e);
        ring(false);
        aub('twirl', x, gy, 1, { lift, sx: Math.cos(a), pivot: 'mid' });
        ring(true);
      } else {
        // Flower Bow: down into a deep kneel, a ring of light spreads over the grass, then up again
        const kneel = k < 0.75 ? 'crouch' : 'idle_front', kk = clamp((k - 0.15) / 0.8, 0, 1);
        ctx.save(); ctx.globalAlpha = 1 - kk * kk;
        ctx.strokeStyle = '#a6ffcf'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, gy - 4, 40 + 200 * kk, 10 + 34 * kk, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        // a ring of flowers pops up round her, back ones behind her
        const fl = front => { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3, fy = gy - 4 + Math.sin(a) * (14 + 26 * kk); if ((Math.sin(a) > 0) !== front) continue;
          const fk = back(clamp((k - 0.1 - i * 0.02) / 0.35, 0, 1)) * (k > 0.8 ? (1 - k) * 5 : 1);
          if (fk > 0.02) flower(x + Math.cos(a) * (50 + 130 * kk), fy - 8 * fk, 13 * fk, FLOWER_COLS[i % 5], '#ffd84a', 1); } };
        fl(false);
        // and a fountain of sparkles from her wand hand
        const fk = clamp((k - 0.2) / 0.6, 0, 1);
        if (fk > 0 && fk < 1) for (let i = 0; i < 7; i++) { const t2 = (fk + i / 7) % 1; star(x + Math.sin(i * 2.1 + t2 * 6) * 50 * t2, gy - 140 - t2 * 150, 9 * (1 - t2) + 2, ['#fff6a8', '#ffb3e0', '#b8ffd8'][i % 3], 4); }
        aub(kneel, x, gy, 1, { sy: kneel === 'crouch' ? 1 + 0.08 * Math.sin(k * PI * 4) : 1 - 0.06 * (1 - k) * 4, sx: kneel === 'crouch' ? 1.05 : 1 });
        fl(true);
      }
      return null;
    },
    draw(g) {
      const T = g.T;
      if (g.fx) drawSpell(g.fx, true);
      // the magic meter
      darkPanel(60, 70, 560, 34, 17);
      emoji('🪄', 82, 87, 20);
      rrect(104, 80, 500, 14, 7, 'rgba(255,255,255,.25)');
      const mv = g.state === 'dance' ? g.meterShow : (g.fx?.power ?? g.rhythm ?? g.meterShow);
      if (mv > 0.01) {
        const grd = ctx.createLinearGradient(104, 0, 604, 0); grd.addColorStop(0, '#ff8ad0'); grd.addColorStop(0.5, '#c6a2ff'); grd.addColorStop(1, '#7ae8ff');
        rrect(104, 80, Math.max(14, 500 * mv), 14, 7, grd);
        star(104 + 500 * mv, 87, 11 + Math.sin(S.t * 8) * 2, '#fff6a8', 4);
      }
      if (g.state === 'dance' && g.combo > 2) outlined(`${g.combo} in a row!`, 340, 124, 20, '#fff6a8');
      // Aubrey, the star of the show
      const tip = this.drawAubrey(g);
      drawSparks(g);
      if (g.fx) drawSpell(g.fx, false);

      if (g.state === 'dance') this.drawLanes(g);
      if (g.state === 'trace') this.drawTrace(g, tip);
      if (g.state === 'spell') {
        const sp = SPELLS[g.fx.shape], p = g.fx.power, k = back(clamp(g.fx.t / 0.5, 0, 1));
        ctx.save(); ctx.translate(W / 2 + 120, 150); ctx.scale(k, k);
        outlined(`${sp.icon} ${sp.name}! ${sp.icon}`, 0, 0, 34, '#fff6a8');
        outlined(g.trace >= 1 ? (p >= 0.85 ? 'SUPER spell!' : p >= 0.5 ? 'Big spell!' : 'Little spell') : 'It only half worked...', 0, 44, 24, g.trace >= 1 ? '#ffd0f0' : '#d0d8f0');
        ctx.restore();
      }
      if (g.state !== 'dance' && g.phase === 'play') drawCritter('Pixie Dot', 880, GY + 30 - Math.sin(S.t * 2) * 6, 0.55, -1);
    },
    drawLanes(g) {
      const T = g.T, P = PANEL;
      rrect(P.x, P.y, P.w, P.h, 22, 'rgba(40,18,64,.72)');
      rrect(P.x, P.y, P.w, P.h, 22, null, 'rgba(255,230,255,.5)', 2);
      ctx.save(); ctx.beginPath(); ctx.roundRect(P.x, P.y, P.w, P.h, 22); ctx.clip();
      LANES.forEach((d, i) => {
        // faint lane lines and the beat pulsing along them
        const x = LX(i);
        ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x - 28, P.y, 56, P.h);
      });
      // the beat lines falling down with the notes
      for (let b = Math.ceil(g.time / T.beat); b * T.beat < g.time + T.lead + 0.5; b++) {
        const y = PAD_Y - (b * T.beat - g.time) / T.lead * (PAD_Y - TOP_Y);
        ctx.fillStyle = b % 4 === 0 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.08)'; ctx.fillRect(P.x + 8, y - 1, P.w - 16, 2);
      }
      // pads
      LANES.forEach((d, i) => {
        const x = LX(i), lit = (g.flash[d] || 0) > 0, c = DIR[d].col;
        glow(x, PAD_Y, 52, mix(c, '#ffffff', 0.4), lit ? 0.9 : 0.25 + 0.3 * g.pulse);
        rrect(x - 30, PAD_Y - 30, 60, 60, 16, lit ? mix(c, '#ffffff', 0.4) : 'rgba(255,255,255,.14)', lit ? '#ffffff' : c, 3);
        drawArrow(x, PAD_Y + 1, d, 0.95 + 0.06 * g.pulse, lit ? '#ffffff' : 'rgba(255,255,255,.3)', lit ? c : 'rgba(255,255,255,.7)', 1.5);
      });
      // notes
      for (const n of g.notes) {
        if (n.judged && (n.judged !== 'miss' || g.time - n.at > 0.35)) continue;
        const y = PAD_Y - (n.t - g.time) / T.lead * (PAD_Y - TOP_Y);
        if (y < P.y - 30 || y > H + 30) continue;
        const x = LX(LANES.indexOf(n.dir)), c = DIR[n.dir].col;
        ctx.globalAlpha = n.judged === 'miss' ? 0.5 * clamp(1 - (g.time - n.at) / 0.35, 0, 1) : clamp((y - P.y + 30) / 50, 0, 1);
        glow(x, y, 40, mix(c, '#ffffff', 0.5), 0.6);
        drawArrow(x, y, n.dir, 1.12, c, '#ffffff', 2);
        star(x + 12, y - 10, 4, 'rgba(255,255,255,.9)', 4);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      for (const h of g.hits) { ctx.globalAlpha = clamp(h.life / 0.4, 0, 1); outlined(h.str, clamp(h.x, P.x + 50, P.x + P.w - 50), h.y, h.str === 'Miss' ? 22 : 26, h.col); ctx.globalAlpha = 1; }
      // the count-in before each dance
      if (g.time < 0) {
        const c = Math.ceil(-g.time / T.beat);
        const k = 1 - ((-g.time / T.beat) % 1);
        ctx.save(); ctx.translate(g.ax, 190); ctx.scale(1 + 0.25 * (1 - k), 1 + 0.25 * (1 - k));
        outlined(c >= 4 ? 'Get ready...' : `${c}`, 0, 0, c >= 4 ? 36 : 60, '#fff6a8');
        ctx.restore();
      } else if (g.time < T.beat * 1.2) outlined('Dance!', g.ax, 190, 44, '#ffd0f0');
    },
    drawTrace(g, tip) {
      const fade = 0.35 + 0.65 * clamp(g.tleft / g.timeMax, 0, 1);
      const path = () => { ctx.beginPath(); g.path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.save();
      ctx.globalAlpha = fade; ctx.shadowColor = '#ff9ae0'; ctx.shadowBlur = 24;
      path(); ctx.strokeStyle = 'rgba(255,200,250,.5)'; ctx.lineWidth = g.T.tol * 1.3; ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5; ctx.setLineDash([2, 14]); ctx.lineDashOffset = -S.t * 30; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      if (g.prog > 0) {
        ctx.save(); ctx.shadowColor = '#fff6a8'; ctx.shadowBlur = 20;
        ctx.beginPath(); g.path.slice(0, g.prog + 1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 12; ctx.stroke(); ctx.strokeStyle = '#fffbe0'; ctx.lineWidth = 5; ctx.stroke();
        ctx.restore();
      }
      const [sx, sy] = g.path[0];
      if (g.prog === 0) { glow(sx, sy, 50, 'rgba(255,250,180,.9)'); star(sx, sy, 22 + Math.sin(S.t * 6) * 3, '#ffe36b', 5); text('Start', sx, sy - 36, 16, '#fff', 'center', 800); }
      const n = g.path[Math.min(g.path.length - 1, g.prog + 6)], c = g.path[g.prog];
      const a = Math.atan2(n[1] - c[1], n[0] - c[0]);
      ctx.save(); ctx.translate(c[0] + Math.cos(a) * 30, c[1] + Math.sin(a) * 30); ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; tri(12, 0, -6, -9, -6, 9); ctx.restore();
      // a beam of magic from her wand to where she is drawing
      if (tip) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,.55)'; ctx.lineWidth = 4; ctx.setLineDash([3, 10]); ctx.lineDashOffset = -S.t * 60;
        ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.quadraticCurveTo((tip[0] + g.wx) / 2, Math.min(tip[1], g.wy) - 50, g.wx, g.wy); ctx.stroke(); ctx.restore();
        glow(tip[0], tip[1], 30, 'rgba(255,250,200,.9)');
      }
      for (const p of g.trail) star(p.x + rand(-4, 4), p.y + rand(-4, 4), 3 + p.life * 6, `rgba(255,250,200,${p.life * 1.6})`);
      glow(g.wx, g.wy, 30, 'rgba(255,250,200,.9)'); star(g.wx, g.wy, 14, '#ffe36b', 5); star(g.wx, g.wy, 6, '#ffffff', 4);
      // time left before the shape fades
      rrect(W / 2 - 150, 508, 300, 16, 8, 'rgba(48,24,72,.6)');
      rrect(W / 2 - 150, 508, Math.max(16, 300 * g.tleft / g.timeMax), 16, 8, g.tleft < 3 ? '#ff8ab0' : '#ffd860');
      emoji('✨', W / 2 - 170, 516, 20);
      outlined(`Trace the ${g.shape}!`, 590, 118, 28, '#fff6a8');
    },
  };

  restage('fairyring', {
    intro: ['*:A circle of mushrooms glows in the grass. Tiny music is playing.', 'N:A visitor! Quick, take my spare wand. Dance to the fairy music, then trace the glowing shape, and the spell will work!', 'A:excited:I can do real magic?!'],
  });
}
