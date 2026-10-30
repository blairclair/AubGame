'use strict';
// Dino Hop: the dinosaur route's road home (it takes the place of Kingdom Bounce). Aubrey carries the baby dino
// piggyback and hops from dinosaur to dinosaur across a prehistoric land: the Fern River, the Bubbly Tar Pits,
// the Giant Canyon and the Misty Swamp, to the edge of the Home Valley, where his mama spots them from far away (the maze in dinodefense.js comes next).
// Hold SPACE (or press and hold the screen) to power up a hop, and let go to jump. The arrow keys walk along a
// dinosaur's back and steer in the air. There is no timer and no way to lose: a fall gets a gentle rescue
// from Petra the pteranodon, who carries them back to the last dinosaur.
{
  const G = 1150, SC = 0.5, TOL = 24, END = 6700, NEST = 6110; // NEST: the lookout at the valley's edge where the hop ends
  const MINT = '#7fd88a', MINT_D = '#5cbf6c', CREAM = '#fff2c8', CORAL = '#ff8a80';
  const WALK_L = { x: 16, y: 462, w: 66, h: 60 }, WALK_R = { x: 90, y: 462, w: 66, h: 60 };

  // the parts of the journey, left to right
  const ZONES = [
    { id: 'meadow', x: -1e9, sky: ['#76cbff', '#e6fbff'], far: '#9ec8e8', mid: '#7cc68a' },
    { id: 'river', x: 330, name: 'The Fern River', icon: '🌿', tip: 'Long-necks and swimmers!', haz: 442, sky: ['#76cbff', '#e6fbff'], far: '#9ec8e8', mid: '#6cbf7c',
      say: 'The Fern River! Hop onto the long-necks and the swimming plesiosaurs.' },
    { id: 'tar', x: 1990, name: 'The Bubbly Tar Pits', icon: '🌋', tip: 'Sticky tar! Stay on the dinosaurs.', haz: 448, sky: ['#ff9f86', '#ffe6c4'], far: '#b78a9a', mid: '#a0a060',
      say: 'The Bubbly Tar Pits! The tar is very sticky, so stay on the dinosaurs.' },
    { id: 'canyon', x: 3450, name: 'The Giant Canyon', icon: '🏜️', tip: 'A pteranodon flies you over!', haz: 640, sky: ['#ffbe6a', '#fff0cc'], far: '#e09a70', mid: '#d0784a',
      say: 'The Giant Canyon! It is too wide to hop, so a pteranodon will fly you across.' },
    { id: 'swamp', x: 4740, name: 'The Misty Swamp', icon: '🐸', tip: 'Hop on the bobbing heads!', haz: 442, sky: ['#8fd6c0', '#ecfff4'], far: '#9cc8b8', mid: '#5aa878',
      say: 'The Misty Swamp! Hop on the hadrosaurs’ heads as they bob up and down.' },
    { id: 'home', x: 5680, name: 'The Home Valley', icon: '🪺', tip: 'Almost home!', haz: 640, sky: ['#ffa8c8', '#ffeec0'], far: '#d8a0c8', mid: '#86cf6e',
      say: '' },
  ];
  const zoneAt = x => { let i = 0; while (i + 1 < ZONES.length && x >= ZONES[i + 1].x) i++; return i; };

  // the path home: [kind, x, extra]
  const PATH = [
    ['ground', 165, { L: -165, R: 165 }],
    ['plesio', 520], ['longneck', 880], ['plesio', 1340], ['longneck', 1690],
    ['stego', 2190], ['trike', 2570], ['stego', 2950], ['trike', 3310],
    ['ankylo', 3640], ['ptera', 3900, { x1: 4370 }], ['ankylo', 4600],
    ['hadro', 4890], ['hadro', 5100], ['hadro', 5310], ['hadro', 5520],
    ['home', 5940, { L: -260, R: 260 }],
  ];

  const ss = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const ellTop = (lx, cx, cy, rx, ry) => cy - ry * Math.sqrt(Math.max(0, 1 - ((lx - cx) / rx) ** 2));

  // --- the dinosaurs: where you can stand (surf, in local coords: x from the dino's middle, y up from its base) ---
  const KINDS = {
    ground: { base: 420, L: -165, R: 165, surf: () => 0 },
    home: { base: 420, L: -260, R: 260, surf: () => 0 },
    longneck: {
      base: 452, L: -105, R: 236, name: 'Brachiosaurus', icon: '🦕',
      fact: 'A Brachiosaurus! Its long, long neck let it munch leaves from the tops of tall trees.',
      surf(p, lx) {
        const back = Math.abs(lx + 25) < 125 ? ellTop(lx, -25, -100, 125, 58) : 0;
        if (lx < 40) return back;
        const neck = lx >= 205 ? -112 - p.rise - 23 : -112 - p.rise * ss((lx - 30) / 175) - 22;
        return Math.min(back, neck);
      },
    },
    plesio: {
      base: 442, L: -70, R: 70, name: 'Plesiosaur', icon: '🌊',
      fact: 'A plesiosaur! It was not really a dinosaur. It was a sea reptile that swam with four big flippers.',
      surf: (p, lx) => ellTop(lx, 0, -6, 85, 34) + p.dy,
    },
    stego: {
      base: 452, L: -92, R: 92, name: 'Stegosaurus', icon: '🦖',
      fact: 'A Stegosaurus! It had big plates on its back and spikes on its tail, but a tiny brain, about the size of a walnut.',
      surf: (p, lx) => ellTop(lx, 0, -85, 110, 50) - stegoPlate(lx) + 6 + p.sqY,
    },
    trike: {
      base: 452, L: -75, R: 75, name: 'Triceratops', icon: '🦏',
      fact: 'A Triceratops! Its name means three-horned face.',
      surf: (p, lx) => ellTop(lx, 0, -80, 92, 46),
    },
    ankylo: {
      base: 430, L: -88, R: 88, name: 'Ankylosaurus', icon: '🐢',
      fact: 'An Ankylosaurus! It was covered in bony armor, like a tank, and had a big club on its tail.',
      surf: (p, lx) => ellTop(lx, 0, -38, 100, 34) + p.breath,
    },
    ptera: {
      base: 300, L: -42, R: 42, name: 'Pteranodon', icon: '🪽',
      fact: 'A Pteranodon! It was not a dinosaur either. It was a flying reptile with giant wings, and it had no teeth.',
      surf: (p, lx) => -16 + (lx / 46) ** 2 * 10,
    },
    hadro: {
      base: 442, L: -36, R: 36, name: 'Hadrosaur', icon: '🦆',
      fact: 'A hadrosaur! It had a flat bill like a duck, and some had hollow crests that may have made a honking sound.',
      surf: (p, lx) => -p.top - 2 + (lx / 40) ** 2 * 8,
    },
  };
  const stegoPlate = lx => 12 + 32 * Math.max(0, 1 - (lx / 105) ** 2);
  const surfAt = (p, wx) => p.base + KINDS[p.kind].surf(p, clamp(wx - p.x, p.L, p.R));

  function makePlat([kind, x, extra = {}], i) {
    const K = KINDS[kind];
    return { kind, i, x, x0: x, base: K.base, base0: K.base, L: extra.L ?? K.L, R: extra.R ?? K.R, ph: i * 1.7, x1: extra.x1 ?? x,
      rise: 70, dy: 0, sink: 0, sq: 0, sqY: 0, breath: 0, top: 150, dunk: 0, occ: false, awake: 0, dir: 1, fly: 0, flap: 0 };
  }
  function movePlat(p, dt, g) {
    const t = S.t + p.ph;
    p.sq = Math.max(0, p.sq - dt);
    switch (p.kind) {
      case 'longneck': p.rise = 70 + 60 * Math.sin(t * 0.55); break; // the neck rises and lowers like a ramp
      case 'plesio': { // swims to and fro, bobs, and sinks slowly while you stand on it (never all the way)
        p.x = p.x0 + Math.sin(t * 0.5) * 35;
        p.sink = p.occ ? Math.min(26, p.sink + dt * 9) : Math.max(0, p.sink - dt * 18);
        p.dy = Math.sin(t * 1.8) * 5 + p.sink;
        break;
      }
      case 'stego': p.sqY = p.sq > 0 ? Math.sin(p.sq / 0.3 * Math.PI) * 10 : 0; break; // springy plates
      case 'trike': { // plods back and forth
        const nx = p.x0 + Math.sin(t * 0.45) * 80;
        if (Math.abs(nx - p.x) > 0.01) p.dir = Math.sign(nx - p.x);
        p.x = nx; break;
      }
      case 'ankylo': p.breath = Math.sin(t * 1.2) * 2.5; p.awake = p.occ ? 2.5 : Math.max(0, p.awake - dt); break;
      case 'ptera': { // waits by the canyon edge, and flies you across when you climb on
        const want = p.occ ? p.x1 : g.a.x < (p.x0 + p.x1) / 2 ? p.x0 : p.x1;
        const d = want - p.x;
        p.x += clamp(d, -dt * 150, dt * 150);
        p.fly = clamp(Math.abs(d) > 2 ? p.fly + dt * 3 : p.fly - dt * 2, 0, 1);
        const k = (p.x - p.x0) / (p.x1 - p.x0);
        p.base = p.base0 - Math.sin(clamp(k, 0, 1) * Math.PI) * 30 + Math.sin(t * 2.4) * 4;
        p.flap += dt * (5 + p.fly * 4);
        break;
      }
      case 'hadro': p.dunk = Math.max(0, p.dunk - dt * 30); p.top = 150 + 26 * Math.sin(t * 1.25) - p.dunk; break; // the heads bob up and down
    }
  }

  // --- little drawing helpers ------------------------------------------------------------
  // Static pieces (sky, far hills, jungle layers, the ground, the canyon and the valley view) are painted once
  // into offscreen canvases and reused; only the living bits (dinos, water, bugs, smoke) are drawn every frame.
  const SPR = (key, w, h, ox, oy, paint) => sprite('dh_' + key, w, h, ox, oy, paint);
  // a lower-resolution offscreen canvas for soft, far-away scenery (sprite() always paints at the full DPR)
  function softSpr(key, w, h, ox, oy, res, paint) {
    key = 'dh_' + key;
    if (SPRITES[key]) return SPRITES[key];
    const c = document.createElement('canvas'); c.width = Math.ceil(w * res); c.height = Math.ceil(h * res);
    const g2 = c.getContext('2d'); g2.scale(res, res); g2.translate(ox, oy); g2.lineJoin = 'round'; g2.lineCap = 'round';
    const screen = ctx; ctx = g2;
    try { paint(); } finally { ctx = screen; }
    return (SPRITES[key] = { c, w, h, ox, oy });
  }
  // gradients made once and reused (they live in whatever local coordinates they are used in)
  const GRD = {};
  function lg(key, x0, y0, x1, y1, stops) {
    if (GRD[key]) return GRD[key];
    const gr = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
    return (GRD[key] = gr);
  }
  const vg = (key, y0, y1, ...stops) => lg(key, 0, y0, 0, y1, stops);
  const glowSpr = rgb => SPR('glow' + rgb, 128, 128, 64, 64, () => {
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 64);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.4, `rgba(${rgb},.42)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(-64, -64, 128, 128);
  });
  function glow(x, y, r, rgb, a = 0.6) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * a; blit(glowSpr(rgb), x, y, r / 64); ctx.globalAlpha = ga; }
  // a wide, soft wisp of mist or smoke
  const mistSpr = () => SPR('mist', 256, 64, 128, 32, () => {
    ctx.save(); ctx.scale(4, 1);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 32);
    gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(-32, -32, 64, 64); ctx.restore();
  });
  const puffSpr = () => SPR('puff', 64, 64, 32, 32, () => {
    const gr = ctx.createRadialGradient(-6, -8, 2, 0, 0, 30);
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(236,228,240,.75)'); gr.addColorStop(1, 'rgba(220,210,230,0)');
    ctx.fillStyle = gr; ctx.fillRect(-32, -32, 64, 64);
  });
  const EP = (x, y, rx, ry, r = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, r, 0, TAU); return p; };
  const pal = (c, l = 0.38, d = 0.22) => ({ c, l: lt(c, l), d: dk(c, d), dd: dk(c, 0.42) });
  const eob = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; };
  // storybook cel shading inside an outlined shape: a lit band along the top, a shadow band along the bottom
  function cel(path, pc, lw = 1.3, dyL = 7, dyD = 12) {
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.stroke(path);
    ctx.fillStyle = pc.d; ctx.fill(path);
    ctx.save(); ctx.clip(path);
    ctx.translate(0, -dyD); ctx.fillStyle = pc.l; ctx.fill(path);
    ctx.translate(0, dyD + dyL); ctx.clip(path); ctx.translate(0, -dyL - dyD); ctx.fillStyle = pc.c; ctx.fill(path);
    ctx.restore();
  }

  function eye(x, y, r, closed = false, look = 1) {
    ctx.lineCap = 'round';
    if (closed) { ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.6, r * 0.38); ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 0.8, 0.3, Math.PI - 0.3); ctx.stroke(); return; }
    inkCircle(x, y, r, '#fff', 1);
    ctx.fillStyle = '#3a2440'; circle(x + r * 0.22 * look, y + r * 0.1, r * 0.66);
    ctx.fillStyle = '#7a5aa8'; circle(x + r * 0.22 * look, y + r * 0.34, r * 0.32);
    ctx.fillStyle = '#3a2440'; circle(x + r * 0.22 * look, y + r * 0.12, r * 0.4);
    ctx.fillStyle = '#fff'; circle(x + r * 0.02 * look, y - r * 0.2, r * 0.3); circle(x + r * 0.44 * look, y + r * 0.36, r * 0.12);
  }
  function smile(x, y, w, open = false) {
    ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    if (open) { ctx.beginPath(); ctx.arc(x, y - w * 0.3, w, 0.1, Math.PI - 0.1); ctx.closePath(); ctx.fillStyle = '#c0405a'; ctx.fill(); ctx.stroke(); return; }
    ctx.beginPath(); ctx.arc(x, y - w * 0.6, w, 0.4, Math.PI - 0.4); ctx.stroke();
  }
  const blush = (x, y, r) => { ctx.fillStyle = 'rgba(255,120,150,.42)'; ellipse(x, y, r, r * 0.6); };
  const nostril = (x, y) => { ctx.fillStyle = 'rgba(61,44,74,.75)'; ellipse(x, y, 1.8, 1.2, 0.3); };
  const blinking = ph => (S.t + ph) % 4.2 < 0.13;
  // a thick outlined tube along a polyline (necks and tails)
  function tube(pts, w, fill) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = OL; ctx.lineWidth = w + 5; ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
  }
  // a plain stroke along a polyline, shifted by (dx, dy): the lit or shaded edge of a tube
  function streak(pts, w, col, dx, dy, from = 0, to = pts.length) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
    for (let i = from; i < to; i++) { const [x, y] = pts[i]; if (i === from) ctx.moveTo(x + dx, y + dy); else ctx.lineTo(x + dx, y + dy); }
    ctx.stroke();
  }
  const bez = (a, b, c, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; });
  function spots(list, col) { ctx.fillStyle = col; for (const [x, y, r] of list) ellipse(x, y, r, r * 0.7); }
  // a chunky leg: outlined, a shaded back edge, a lit front edge and three little toenails
  function leg(x, y, w, h, pc) {
    inkRect(x, y, w, h, pc.c, 2.5, 12);
    rrect(x + w * 0.58, y + 6, w * 0.34, h - 12, w * 0.17, pc.d);
    rrect(x + w * 0.14, y + 8, w * 0.18, h * 0.45, w * 0.09, 'rgba(255,255,255,.28)');
    ctx.fillStyle = '#fff4dc'; for (let i = 0; i < 3; i++) ellipse(x + w * (0.22 + i * 0.28), y + h - 4, w * 0.11, 3.2);
  }
  function palm(x, gy, h, col, lean = 0) {
    ctx.strokeStyle = mix(col, '#5a3a20', 0.5); ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x + lean * 0.4, gy - h * 0.5, x + lean, gy - h); ctx.stroke();
    ctx.fillStyle = col;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + i * Math.PI / 6 + Math.sin(S.t * 0.8 + x) * 0.04, tx = x + lean, ty = gy - h;
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * 30, ty + Math.sin(a) * 30 - 10, tx + Math.cos(a) * 52, ty + Math.sin(a) * 40 + 12);
      ctx.quadraticCurveTo(tx + Math.cos(a) * 26, ty + Math.sin(a) * 18, tx, ty); ctx.fill();
    }
  }
  function fern(x, gy, s, col) {
    ctx.strokeStyle = col; ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI / 2 + i * 0.32 + Math.sin(S.t * 1.2 + x * 0.01 + i) * 0.04, L = s * (1 - Math.abs(i) * 0.12);
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, gy); const ex = x + Math.cos(a) * L, ey = gy + Math.sin(a) * L;
      ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + i * 4, gy + Math.sin(a) * L * 0.6, ex, ey); ctx.stroke();
      ctx.lineWidth = 2;
      for (let j = 1; j < 6; j++) { const k = j / 6, px = x + (ex - x) * k, py = gy + (ey - gy) * k; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 8 * (1 - k), py - 4); ctx.moveTo(px, py); ctx.lineTo(px + 8 * (1 - k), py - 4); ctx.stroke(); }
    }
  }

  // --- the baby dino: the global one from pet.js, or this little stand-in (faces right, origin at his feet) ---
  function fallbackDino(x, y, s, look, o = {}) {
    const mood = o.mood || 'happy';
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.facing || 1), s); ctx.lineJoin = 'round';
    // three coral plates along his back
    for (const [px, py, r, h] of [[-44, -88, -0.7, 26], [-14, -108, -0.25, 32], [22, -116, 0.15, 26]]) inkAt(px, py, r, P2(`M-13,6 Q-14,${-h * 0.5} 0,${-h} Q14,${-h * 0.5} 13,6 Z`), CORAL, 2.5);
    // outline everything first, then fill, so he reads as one chubby shape
    const parts = [
      ['p', P2('M-40,-34 C-80,-36 -112,-22 -128,-4 C-98,-10 -70,-10 -36,-8 Z')],
      ['e', -24, -10, 17, 12], ['e', 24, -10, 17, 12], ['e', 0, -55, 54, 52], ['e', 36, -112, 26, 30], ['e', 66, -150, 44, 41],
    ];
    ctx.strokeStyle = OL; ctx.lineWidth = 5;
    for (const q of parts) { ctx.beginPath(); if (q[0] === 'p') ctx.stroke(q[1]); else { ctx.ellipse(q[1], q[2], q[3], q[4], 0, 0, Math.PI * 2); ctx.stroke(); } }
    const body = vgradL(-200, 0, '#9ae8a2', MINT_D);
    for (const q of parts) { ctx.fillStyle = body; if (q[0] === 'p') ctx.fill(q[1]); else ellipse(q[1], q[2], q[3], q[4]); }
    ctx.fillStyle = CREAM; ellipse(12, -48, 32, 38); ellipse(74, -128, 22, 12);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(50, -176, 16, 7, -0.3);
    // little arms
    inkEllipse(40, -70, 9, 15, -0.6, MINT, 2);
    // face
    const scared = mood === 'scared' || mood === 'surprised';
    eye(50, -158, 13, !scared && blinking(o.ph || 0)); eye(86, -158, 13, !scared && blinking(o.ph || 0));
    if (scared) { ctx.fillStyle = '#7a2a40'; ellipse(74, -128, 6, 8); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(); }
    else smile(72, -128, 10, mood === 'joy' || mood === 'wow');
    blush(36, -136, 8); blush(104, -136, 8);
    ctx.fillStyle = OL; circle(98, -144, 2); circle(106, -146, 2);
    ctx.restore();
  }
  const look = () => (typeof dinoLook === 'function' ? dinoLook() : S.equip);
  function baby(x, y, s, o) {
    if (typeof drawBabyDino === 'function') drawBabyDino(x, y, s, look(), o);
    else fallbackDino(x, y, s, look(), o);
  }

  // --- the dinosaurs ----------------------------------------------------------------------
  // (every shape Aubrey can stand on is drawn exactly where KINDS[...].surf puts it; only tails, heads,
  //  flippers and legs move for the idle animations)
  const PL_LN = pal('#7fb3e8'), PL_LNLEG = pal('#6ea2de', 0.3, 0.18), PL_LNFAR = pal('#5d92d0', 0.25, 0.18);
  const P_LN_TAIL = P2('M-120,-122 C-175,-118 -235,-88 -290,-36 C-240,-66 -182,-82 -122,-80 Z'), E_LN_BODY = EP(0, 0, 125, 58), E_LN_HEAD = EP(222, 0, 32, 21, 0.05);
  function drawLongneck(p) {
    const k = p.sq > 0 ? Math.sin(p.sq / 0.3 * Math.PI) * 0.03 : 0, t = S.t + p.ph;
    ctx.save(); ctx.translate(p.x, p.base);
    // a slow, happy tail swish
    ctx.save(); ctx.translate(-120, -100); ctx.rotate(Math.sin(t * 0.9) * 0.05); ctx.translate(120, 100);
    cel(P_LN_TAIL, PL_LN, 1.3, 4, 9);
    ctx.fillStyle = 'rgba(70,110,190,.25)'; ellipse(-190, -84, 7, 4, -0.4); ellipse(-232, -66, 5, 3, -0.6);
    ctx.restore();
    leg(-92, -85, 30, 85, PL_LNFAR); leg(28, -85, 30, 85, PL_LNFAR);
    const hc = -112 - p.rise, pts = [];
    for (let lx = 20; lx <= 205; lx += 8) pts.push([lx, -112 - p.rise * ss((lx - 30) / 175)]);
    tube(pts, 44, PL_LN.c);
    streak(pts, 12, PL_LN.d, 0, 13, 2); streak(pts, 9, PL_LN.l, -2, -11, 2);
    ctx.save(); ctx.translate(-25, -100); ctx.scale(1 + k, 1 - k);
    cel(E_LN_BODY, PL_LN, 1.3, 10, 18);
    ctx.save(); ctx.clip(E_LN_BODY);
    ctx.fillStyle = '#d6e8ff'; ellipse(10, 36, 84, 20 + Math.sin(t * 1.4) * 1.5);
    spots([[-60, -28, 9], [-30, -40, 7], [10, -44, 10], [44, -32, 7], [-80, -6, 6], [72, -14, 6], [-12, -20, 5]], 'rgba(70,110,190,.32)');
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-34, -42, 40, 7, -0.12);
    ctx.restore(); ctx.restore();
    leg(-126, -75, 32, 77, PL_LNLEG); leg(44, -75, 32, 77, PL_LNLEG);
    spots(pts.filter((_, i) => i % 4 === 2 && i > 4).map(([x, y]) => [x, y - 6, 5]), 'rgba(70,110,190,.35)');
    ctx.save(); ctx.translate(0, hc - 2); cel(E_LN_HEAD, PL_LN, 1.3, 5, 8); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(214, hc - 14, 14, 4);
    eye(226, hc - 8, 6.5, blinking(p.ph));
    smile(240, hc + 6, 7); nostril(249, hc - 6);
    blush(232, hc + 6, 5);
    ctx.restore();
  }
  const PL_PL = pal('#5fc6c0'), PL_PLFLIP = pal('#4fb0aa', 0.3, 0.2);
  const P_PL_FB = P2('M0,0 C-10,10 -40,22 -54,18 C-40,6 -20,-4 0,-6 Z'), P_PL_FF = P2('M0,0 C10,10 40,22 54,18 C40,6 20,-4 0,-6 Z'), P_PL_TAIL = P2('M-78,-8 C-110,-12 -130,0 -152,12 C-120,14 -100,10 -76,6 Z');
  const E_PL_BODY = EP(0, -6, 85, 34), E_PL_HEAD = EP(0, 0, 26, 16, -0.15);
  function drawPlesio(p) {
    const t = S.t + p.ph, bob = Math.sin(t * 1.3) * 4;
    ctx.save(); ctx.translate(p.x, p.base + p.dy);
    const fl = Math.sin(S.t * 4 + p.ph) * 0.4;
    inkAt(-50, 4, 0.6 + fl, P_PL_FB, PL_PLFLIP.c, 1.1);
    inkAt(40, 6, -0.4 - fl, P_PL_FF, PL_PLFLIP.c, 1.1);
    ctx.save(); ctx.translate(-76, -1); ctx.rotate(Math.sin(t * 1.6) * 0.12); ctx.translate(76, 1); cel(P_PL_TAIL, PL_PL, 1.2, 3, 5); ctx.restore();
    const neck = bez([52, -22], [100, -40 + bob * 0.3], [116, -100 + bob], 10);
    tube(neck, 24, PL_PL.c);
    streak(neck, 7, PL_PL.d, 6, 2, 1); streak(neck, 5, PL_PL.l, -5, -2, 2);
    cel(E_PL_BODY, PL_PL, 1.3, 7, 12);
    ctx.save(); ctx.clip(E_PL_BODY);
    ctx.fillStyle = '#c4f2ea'; ellipse(8, 22, 70, 13);
    spots([[-40, -26, 7], [-10, -34, 9], [26, -30, 7], [50, -20, 5], [-62, -12, 5]], 'rgba(20,110,110,.28)');
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-20, -32, 30, 4.5); circle(-56, -22, 2); circle(36, -36, 2.4);
    ctx.restore();
    ctx.save(); ctx.translate(126, -110 + bob); cel(E_PL_HEAD, PL_PL, 1.2, 4, 6); ctx.restore();
    const scared = p.sink > 18;
    eye(128, -116 + bob, 5.5, !scared && blinking(p.ph));
    smile(140, -104 + bob, 6, scared); nostril(148, -114 + bob);
    blush(134, -102 + bob, 4);
    ctx.restore();
  }
  const PL_ST = pal('#f4b860'), PL_STLEG = pal('#d8913a', 0.28, 0.2);
  const P_ST_TAIL = P2('M-96,-96 C-140,-96 -180,-82 -210,-58 C-170,-66 -134,-66 -98,-64 Z'), P_SPIKE = P2('M-4,0 L0,-26 L4,0 Z'), E_ST_BODY = EP(0, -85, 110, 50), E_ST_HEAD = EP(118, -62, 28, 18, 0.2);
  function drawStego(p) {
    const t = S.t + p.ph, nod = Math.sin(t * 1.5) * 2;
    ctx.save(); ctx.translate(p.x, p.base);
    ctx.save(); ctx.translate(-98, -80); ctx.rotate(Math.sin(t * 1.1) * 0.06); ctx.translate(98, 80);
    cel(P_ST_TAIL, PL_ST, 1.3, 4, 9);
    for (const [sx, a] of [[-190, -0.9], [-176, -0.5], [-196, 0.6]]) inkAt(sx, -66, a, P_SPIKE, '#fff4dc', 1);
    ctx.restore();
    leg(-80, -60, 28, 60, PL_STLEG); leg(36, -60, 28, 60, PL_STLEG);
    // plates (springy: they squash when she lands)
    const pg = vg('stplate', -190, -40, '#ffd6c8', '#ff8f78', '#e8664e');
    for (let lx = -90; lx <= 90; lx += 30) {
      const by = ellTop(lx, 0, -85, 110, 50) + 10, h = stegoPlate(lx) - p.sqY * 0.6, pp = new Path2D();
      pp.moveTo(lx - 17, by); pp.quadraticCurveTo(lx - 19, by - h * 0.6, lx, by - h - 8); pp.quadraticCurveTo(lx + 19, by - h * 0.6, lx + 17, by); pp.closePath();
      ink(pp, pg, 1.2);
      ctx.strokeStyle = 'rgba(190,70,60,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, by - 2); ctx.lineTo(lx, by - h * 0.75); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(lx - 6, by - h * 0.55, 3, h * 0.18, 0.15);
    }
    cel(E_ST_BODY, PL_ST, 1.3, 9, 15);
    ctx.save(); ctx.clip(E_ST_BODY);
    ctx.strokeStyle = 'rgba(200,110,40,.28)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const sx = -75 + i * 30; ctx.beginPath(); ctx.moveTo(sx, -128); ctx.quadraticCurveTo(sx + 8, -104, sx + 2, -84); ctx.stroke(); }
    ctx.fillStyle = '#ffe6b8'; ellipse(10, -50, 84, 16);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-30, -118, 40, 6, -0.1);
    ctx.restore();
    leg(-104, -55, 30, 57, PL_ST); leg(56, -55, 30, 57, PL_ST);
    ctx.save(); ctx.translate(0, nod); cel(E_ST_HEAD, PL_ST, 1.2, 4, 7);
    eye(124, -68, 5.5, blinking(p.ph)); smile(136, -56, 6); blush(128, -56, 4); nostril(142, -66);
    ctx.restore();
    ctx.restore();
  }
  const PL_TR = pal('#9fd06a'), PL_TRLEG = pal('#7fb04e', 0.28, 0.2);
  const P_TR_TAIL = P2('M-84,-86 C-120,-84 -150,-66 -170,-44 C-140,-52 -116,-56 -86,-60 Z'), E_TR_BODY = EP(0, -80, 92, 46), E_TR_HEAD = EP(122, -72, 36, 26, 0.15);
  const P_HORN = P2('M-6,0 L0,-46 L6,0 Z'), P_HORN2 = P2('M-5,0 L0,-40 L5,0 Z'), P_HORN3 = P2('M-5,0 L0,-18 L5,0 Z'), P_BEAK = P2('M150,-70 Q166,-64 160,-50 Q150,-52 144,-58 Z');
  function drawTrike(p) {
    const C = PL_TR.c, FR = '#ffcf5a';
    ctx.save(); ctx.translate(p.x, p.base); ctx.scale(p.dir, 1);
    const st = S.t * 3 + p.ph, lift = i => Math.max(0, Math.sin(st + i * Math.PI)) * 7, hb = Math.abs(Math.sin(st)) * 2.5;
    ctx.save(); ctx.translate(-86, -73); ctx.rotate(Math.sin(st * 0.5) * 0.07); ctx.translate(86, 73); cel(P_TR_TAIL, PL_TR, 1.3, 4, 8); ctx.restore();
    leg(-66, -55 - lift(1), 26, 55, PL_TRLEG); leg(30, -55 - lift(0), 26, 55, PL_TRLEG);
    cel(E_TR_BODY, PL_TR, 1.3, 9, 14);
    ctx.save(); ctx.clip(E_TR_BODY);
    ctx.fillStyle = '#e4f6c8'; ellipse(10, -48, 66, 14);
    spots([[-40, -100, 8], [-6, -108, 6], [30, -100, 7], [-64, -84, 5], [52, -88, 5]], 'rgba(60,120,40,.3)');
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-24, -114, 34, 5, -0.1);
    ctx.restore();
    leg(-84, -50 - lift(0), 28, 52, PL_TR); leg(48, -50 - lift(1), 28, 52, PL_TR);
    // frill, head and three horns (bobbing along with each step)
    ctx.save(); ctx.translate(0, -hb);
    for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.95 + i * Math.PI * 0.95 / 8; inkCircle(92 + Math.cos(a) * 44, -100 + Math.sin(a) * 44, 8, '#ff9f5a', 1); }
    inkCircle(92, -100, 44, vg('trfr', -144, -56, '#ffe48a', FR, '#ffb84a'), 1.3);
    ctx.strokeStyle = 'rgba(230,130,60,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(92, -100, 34, -Math.PI * 0.95, -0.05); ctx.stroke();
    ctx.fillStyle = '#ff9f5a'; for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.9 + i * 0.4; circle(92 + Math.cos(a) * 26, -100 + Math.sin(a) * 26, 5); }
    ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.9 + i * 0.4; circle(91 + Math.cos(a) * 26, -102 + Math.sin(a) * 26, 1.6); }
    inkAt(108, -96, 0.75, P_HORN, '#fff4dc', 1);
    inkAt(132, -90, 0.65, P_HORN2, '#fff4dc', 1);
    ctx.save(); ctx.translate(0, 0); cel(E_TR_HEAD, PL_TR, 1.3, 5, 9); ctx.restore();
    inkAt(156, -82, 0.4, P_HORN3, '#fff4dc', 1);
    ink(P_BEAK, '#e8c890', 1);
    eye(124, -82, 6, blinking(p.ph)); smile(138, -58, 7); blush(126, -62, 5); nostril(150, -74);
    ctx.restore();
    ctx.restore();
  }
  const PL_AN = pal('#c2a27e'), PL_ANLEG = pal('#9a7c5a', 0.25, 0.2), AR = '#8e7556';
  const E_AN_BODY = EP(0, -38, 100, 34), E_AN_HEAD = EP(108, -26, 26, 17, 0.15), P_ANSPK = P2('M-7,0 L0,14 L7,0 Z');
  const pillarSpr = () => SPR('pillar', 316, 350, 158, 16, () => {
    ink(P2('M-110,0 L110,0 L128,30 L146,320 L-150,320 L-126,30 Z'), vgradL(0, 300, '#e09460', '#7a4034'), 1.3);
    ctx.save(); ctx.clip(P2('M-110,0 L110,0 L128,30 L146,320 L-150,320 L-126,30 Z'));
    ctx.fillStyle = 'rgba(255,220,180,.22)'; ctx.fillRect(-160, 0, 60, 330);
    ctx.fillStyle = 'rgba(70,20,30,.18)'; ctx.fillRect(80, 0, 80, 330);
    ctx.strokeStyle = 'rgba(120,50,30,.35)'; ctx.lineWidth = 3;
    for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-160, i * 40); ctx.bezierCurveTo(-60, i * 40 + 8, 40, i * 40 - 6, 160, i * 40 + (i % 2 ? 6 : -4)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(80,30,30,.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-40, 30); ctx.lineTo(-50, 70); ctx.lineTo(-36, 100); ctx.moveTo(60, 120); ctx.lineTo(70, 170); ctx.lineTo(58, 200); ctx.stroke();
    ctx.restore();
    // grass on top and a few vines hanging down
    ctx.strokeStyle = '#4f9a3e'; ctx.lineWidth = 3;
    for (const vx of [-96, 104]) { ctx.beginPath(); ctx.moveTo(vx, 2); ctx.bezierCurveTo(vx - 8, 40, vx + 8, 70, vx - 2, 110); ctx.stroke(); ctx.fillStyle = '#7fc86a'; for (let j = 1; j < 6; j++) ellipse(vx - 2 + Math.sin(j) * 5, 2 + j * 20, 5, 3, j); }
    ctx.fillStyle = '#7fc86a'; ellipse(-60, 2, 40, 6); ellipse(70, 2, 34, 5);
    grassBlades(-100, -30, 2, rng(5), ['#4f9a3e', '#6fbf5a'], 4, 10, 0.4); grassBlades(46, 100, 2, rng(6), ['#4f9a3e', '#6fbf5a'], 4, 10, 0.4);
  });
  function drawAnkylo(p) {
    const t = S.t + p.ph;
    ctx.save(); ctx.translate(p.x, p.base);
    // the rock pillar he sleeps on
    blit(pillarSpr(), 0, 0);
    ctx.translate(0, p.breath);
    const asleep = p.awake <= 0, wag = Math.sin(t * (asleep ? 0.8 : 2.4)) * (asleep ? 3 : 8);
    const tail = bez([-90, -30], [-130, -36 + wag * 0.3], [-168, -22 + wag], 8);
    tube(tail, 14, PL_AN.c); streak(tail, 4, PL_AN.d, 0, 4, 1);
    inkEllipse(-180, -22 + wag, 20, 15, 0, AR, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(-184, -28 + wag, 8, 4);
    for (const [kx, ky] of [[-196, -24], [-180, -38], [-166, -24]]) inkCircle(kx, ky + wag, 4, '#fff4dc', 0.8);
    for (const lx of [-70, -30, 30, 66]) { inkRect(lx - 12, -20, 24, 20, PL_ANLEG.c, 2.2, 6); ctx.fillStyle = '#fff4dc'; ellipse(lx - 5, -2, 2.6, 2); ellipse(lx + 5, -2, 2.6, 2); }
    for (let i = 0; i < 9; i++) { const lx = -88 + i * 22; inkAt(lx, -12 - Math.sqrt(Math.max(0, 1 - (lx / 100) ** 2)) * 4, 0, P_ANSPK, '#fff4dc', 0.9); }
    cel(E_AN_BODY, PL_AN, 1.3, 6, 10);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 7 - row; i++) {
      const lx = -66 + row * 11 + i * 22, ty = ellTop(lx, 0, -38, 100, 34) + 9 + row * 12;
      inkCircle(lx, ty, 6.5, row === 0 ? '#a08868' : AR, 0.8); ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(lx - 2, ty - 2, 2);
    }
    ctx.save(); ctx.translate(0, asleep ? 1 : Math.sin(t * 2) * 1.5); cel(E_AN_HEAD, PL_AN, 1.2, 4, 7);
    eye(114, -32, 5.5, asleep || blinking(p.ph)); smile(126, -20, 6); blush(116, -20, 4); nostril(132, -28);
    ctx.restore();
    if (asleep) for (let i = 0; i < 3; i++) { const zt = (S.t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - zt; outlined('z', 126 + zt * 30 + i * 4, -50 - zt * 50, 14 + i * 4, '#ffffff'); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  const PL_PT = pal('#ffb48f'), E_PT_BODY = EP(0, 0, 46, 15), E_PT_HEAD = EP(50, -14, 18, 13), P_PT_CREST = P2('M40,-20 L8,-46 L34,-12 Z'), P_PT_BEAK = P2('M62,-20 L106,-8 L62,-6 Z');
  function drawPtera(x, y, flap, sc = 1, mood = 'happy', petra = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const f = Math.sin(flap) * 36;
    ctx.strokeStyle = OL; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 12); ctx.lineTo(-16, 24); ctx.moveTo(6, 12); ctx.lineTo(2, 24); ctx.stroke();
    const wg = vg('ptwing', -90, 14, '#ffe2d0', '#ffb090', '#f0806a');
    for (const s of [-1, 1]) {
      const w = new Path2D(); w.moveTo(s * 14, -8); w.quadraticCurveTo(s * 70, -46 - f, s * 160, -14 - f * 1.2); w.quadraticCurveTo(s * 96, -2 - f * 0.3, s * 20, 10); w.closePath();
      ink(w, wg, 1.2);
      ctx.strokeStyle = 'rgba(190,80,70,.35)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(s * 34, 4); ctx.quadraticCurveTo(s * 84, -14 - f * 0.6, s * 138, -14 - f * 1.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 26, 6); ctx.quadraticCurveTo(s * 60, -2 - f * 0.4, s * 96, -6 - f * 0.6); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(s * 20, -10); ctx.quadraticCurveTo(s * 70, -42 - f, s * 150, -16 - f * 1.15); ctx.stroke();
      inkCircle(s * 62, -30 - f * 0.75, 2.6, '#fff4dc', 0.7);
    }
    cel(E_PT_BODY, PL_PT, 1.3, 3, 5);
    ink(P_PT_CREST, vg('ptcrest', -46, -12, '#ffb0c0', '#ff6f8a'), 1);
    cel(E_PT_HEAD, PL_PT, 1.2, 3, 5);
    ink(P_PT_BEAK, '#ffe08a', 1);
    ctx.strokeStyle = 'rgba(160,110,40,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(64, -12); ctx.lineTo(98, -9); ctx.stroke();
    if (petra) flower(26, -34, 6, '#ff9ac8', '#ffd84a', 1);
    eye(52, -18, 4.5, mood !== 'worried' && blinking(x * 0.01));
    blush(56, -8, 3.5);
    ctx.restore();
  }
  const PL_HD = pal('#a798f2'), PL_HDB = pal(mix('#a798f2', '#6a5aa8', 0.3), 0.25, 0.2), CR = '#ff8fc8';
  const E_HD_BODY = EP(-56, 8, 74, 28), E_HD_HEAD = EP(0, 18, 40, 20), P_HD_BILL = P2('M30,8 Q58,6 64,16 Q60,30 30,30 Z');
  function drawHadro(p) {
    const T = -p.top, t = S.t + p.ph;
    ctx.save(); ctx.translate(p.x, p.base);
    // a tail tip flicking above the water
    const tl = bez([-112, 10], [-136, -2], [-150, -18 + Math.sin(t * 1.6) * 6], 6);
    tube(tl, 13, PL_HDB.c);
    cel(E_HD_BODY, PL_HDB, 1.2, 5, 8);
    ctx.fillStyle = 'rgba(80,60,150,.25)'; for (let i = 0; i < 4; i++) ellipse(-96 + i * 24, -6, 6, 4);
    const neck = bez([-30, 4], [-24, T * 0.5], [-8, T + 30], 8);
    tube(neck, 30, PL_HD.c);
    streak(neck, 8, PL_HD.d, 8, 0, 1); streak(neck, 6, PL_HD.l, -7, 0, 2);
    ctx.strokeStyle = 'rgba(90,70,170,.28)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 2; i < neck.length - 1; i += 2) { const [nx, ny] = neck[i]; ctx.beginPath(); ctx.moveTo(nx - 9, ny - 2); ctx.quadraticCurveTo(nx, ny + 2, nx + 9, ny - 2); ctx.stroke(); }
    const crest = bez([-16, T + 6], [-44, T - 4], [-74, T - 22], 6);
    tube(crest, 13, CR); streak(crest, 4, 'rgba(255,255,255,.55)', 0, -3, 1, 5);
    ctx.save(); ctx.translate(0, T);
    cel(E_HD_HEAD, PL_HD, 1.3, 5, 9);
    ink(P_HD_BILL, vg('hdbill', 6, 30, '#ffe39a', '#ffc860'), 1.1);
    ctx.strokeStyle = 'rgba(160,110,40,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(34, 21); ctx.quadraticCurveTo(48, 24, 60, 20); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-8, T + 6, 16, 4);
    eye(14, T + 12, 5.5, blinking(p.ph)); blush(22, T + 24, 4); nostril(56, T + 13);
    ctx.restore();
  }
  // a grassy bank, painted once for each width
  function groundSpr(w) {
    return SPR('ground' + w, w + 16, 160, w / 2 + 8, 28, () => {
      const x0 = -w / 2, x1 = w / 2, R = rng(w);
      const sh = new Path2D(); sh.moveTo(x0, 140); sh.lineTo(x0, 24); sh.quadraticCurveTo(x0, 0, x0 + 24, 0); sh.lineTo(x1 - 24, 0); sh.quadraticCurveTo(x1, 0, x1, 24); sh.lineTo(x1, 140); sh.closePath();
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.stroke(sh);
      ctx.save(); ctx.clip(sh);
      ctx.fillStyle = vgradL(0, 130, '#b0784e', '#7a4c34'); ctx.fillRect(x0, 0, w, 140);
      ctx.strokeStyle = 'rgba(80,40,20,.25)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x0, 52 + i * 28); for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, 52 + i * 28 + Math.sin(x * 0.05 + i) * 3); ctx.stroke(); }
      for (let i = 0; i < w / 22; i++) { const sx = x0 + R() * w, sy = 40 + R() * 80, r = 3 + R() * 5; ctx.fillStyle = R() < 0.5 ? '#c89a74' : '#8a5a40'; ellipse(sx, sy, r, r * 0.7); ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(sx - 1, sy - 1.5, r * 0.4, r * 0.25); }
      // the grass top, with a lit edge and a scalloped fringe hanging over the earth
      ctx.fillStyle = vgradL(0, 30, '#9be07a', '#5aa64a'); ctx.beginPath(); ctx.moveTo(x0, 0);
      for (let x = x0; x <= x1; x += 14) ctx.quadraticCurveTo(x + 7, 34 + (Math.round(x) % 3) * 3, x + 14, 24);
      ctx.lineTo(x1, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x0, 2, w, 4);
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0, 24); ctx.quadraticCurveTo(x0, 0, x0 + 24, 0); ctx.lineTo(x1 - 24, 0); ctx.quadraticCurveTo(x1, 0, x1, 24); ctx.stroke();
      grassBlades(x0 + 10, x1 - 10, 0, R, ['#4f9a3e', '#6fbf5a', '#8ad46a'], 5, 13, 0.18);
      for (let i = 0; i < w / 70; i++) tinyFlower(x0 + 20 + R() * (w - 40), -4 - R() * 4, 5, pick(['#ff9ac8', '#fff', '#ffd84a', '#c8a8ff']));
    });
  }
  function drawGround(p) { blit(groundSpr(p.R - p.L), p.x + (p.L + p.R) / 2, p.base); }
  const DRAW = { longneck: drawLongneck, plesio: drawPlesio, stego: drawStego, trike: drawTrike, ankylo: drawAnkylo, hadro: drawHadro,
    ptera: p => drawPtera(p.x, p.base, p.flap, 1), ground: drawGround, home: drawGround };

  // --- the landscape ------------------------------------------------------------------------
  // Each part of the journey has its own look: a sky, two hazy far layers (mountains, volcanoes, mesas or misty
  // forest), a jungle layer and a near layer of bushes, all painted once into tiles that wrap every TW pixels.
  const TW = 960;
  const LOOKS = {
    river: { sky: ['#4aa8ee', '#86ccff', '#cdeeff', '#effff4'], sun: [800, 108, 34, '#fff3a0', '255,246,200'], far1: '#bcd4ec', far2: '#94bccb', mid: '#5fae74', near: '#3f9658', haze: '#e4f5ff' },
    tar: { sky: ['#f47460', '#ff9c80', '#ffc69e', '#ffe6c4'], sun: [790, 120, 36, '#ffe0a0', '255,220,170'], far1: '#d6a4b0', far2: '#8e5a7c', mid: '#9c9a5a', near: '#76804a', haze: '#ffd8c4' },
    canyon: { sky: ['#ffa646', '#ffc070', '#ffe2a8', '#fff2d8'], sun: [770, 118, 40, '#fff0a0', '255,230,160'], far1: '#f4cba8', far2: '#e49a70', mid: '#c87450', near: '#a65a3c', haze: '#ffecd0' },
    swamp: { sky: ['#64baa6', '#94d6c2', '#cdf0e0', '#ecfff4'], sun: [780, 100, 32, '#fffbd0', '255,255,220'], far1: '#b0d4ca', far2: '#86b6a8', mid: '#4f9a74', near: '#3a7e58', haze: '#eafff6' },
    home: { sky: ['#ff8fb8', '#ffacb0', '#ffcf98', '#fff0c4'], sun: [820, 196, 50, '#ffe27a', '255,214,140'], far1: '#dcb2d4', far2: '#b4c894', mid: '#72bc5e', near: '#559f4c', haze: '#ffe8d4' },
  };
  const ZLOOK = ['river', 'river', 'tar', 'canyon', 'swamp', 'home'];
  const SMOKE = { river: [[600, 226]], tar: [[250, 196], [700, 236]], canyon: [], swamp: [], home: [[180, 262]] }; // volcano tops in the far2 tiles
  const LAYER = { far1: [170, 270, 1, 0.05], far2: [180, 280, 1, 0.12], mid: [190, 272, 0, 0.3], near: [300, 178, 0, 0.55] }; // [top, height, soft?, parallax]
  let LINE = OL; // outline colour for the scenery being painted (fainter for farther layers)

  // a horizon that wraps seamlessly every TW pixels: waves are [height, cycles per tile, phase, pointy?]
  function ridgeY(x, base, waves) {
    let y = base;
    for (const [a, n, ph, sharp] of waves) { const u = x / TW * n + ph; y -= a * (sharp ? (1 - 2 * Math.abs(u - Math.floor(u) - 0.5)) ** 1.4 : 0.5 + 0.5 * Math.sin(u * TAU)); }
    return y;
  }
  function ridgePath(base, waves, bottom) {
    const p = new Path2D(); p.moveTo(-6, bottom);
    for (let x = -6; x <= TW + 6; x += 6) p.lineTo(x, ridgeY(x, base, waves));
    p.lineTo(TW + 6, bottom); p.closePath(); return p;
  }
  // draw something at x, and again one tile over if it pokes past either edge (so tiles join up)
  function wrapAt(x, r, fn) { fn(x); if (x - r < 0) fn(x + TW); if (x + r > TW) fn(x - TW); }
  function hazeOver(path, y0, y1, col) { ctx.save(); ctx.clip(path); ctx.fillStyle = vgradL(y0, y1, mix(col, '#ffffff', 0) + '00', col); ctx.fillRect(-10, y0, TW + 20, y1 - y0 + 200); ctx.restore(); }

  // --- scenery painters (used while painting the tiles) ---
  function frond(x0, y0, a, L, droop, w, col, lit) { // a tapered leaf from (x0, y0) at angle a, drooping at the tip
    const ex = x0 + Math.cos(a) * L, ey = y0 + Math.sin(a) * L + droop, mx = x0 + Math.cos(a) * L * 0.55, my = y0 + Math.sin(a) * L * 0.55 - droop * 0.15;
    const f = new Path2D(); f.moveTo(x0, y0); f.quadraticCurveTo(mx - Math.sin(a) * w, my - w, ex, ey); f.quadraticCurveTo(mx + Math.sin(a) * w, my + w, x0, y0);
    return { f, x0, y0, mx, my, ex, ey, col, rib: lit };
  }
  function drawFronds(fr, lw = 3) {
    ctx.strokeStyle = LINE; ctx.lineWidth = lw; for (const q of fr) ctx.stroke(q.f);
    for (const q of fr) { ctx.fillStyle = q.col; ctx.fill(q.f); }
    ctx.lineWidth = 1.4;
    for (const q of fr) { ctx.strokeStyle = q.rib; ctx.beginPath(); ctx.moveTo(q.x0, q.y0); ctx.quadraticCurveTo(q.mx, q.my, q.ex, q.ey); ctx.stroke(); }
  }
  function trunk(x, gy, tx, ty, w, col) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo((x + tx) / 2 + (tx - x) * 0.3, (gy + ty) / 2, tx, ty);
    ctx.strokeStyle = LINE; ctx.lineWidth = w + 4; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  const PLANT = {
    palm(x, gy, s, col, R) {
      const h = 125 * s, lean = (R() - 0.5) * 50 * s, tx = x + lean, ty = gy - h, bark = mix('#9a6a40', col, 0.25);
      trunk(x, gy, tx, ty, 9 * s, bark);
      ctx.strokeStyle = 'rgba(60,30,20,.3)'; ctx.lineWidth = 1.5;
      for (let k = 0.08; k < 0.95; k += 0.09) { const px = x + (tx - x) * k, py = gy + (ty - gy) * k; ctx.beginPath(); ctx.moveTo(px - 4.5 * s, py + 1); ctx.lineTo(px + 4.5 * s, py - 2); ctx.stroke(); }
      const fr = [];
      for (let i = 0; i < 8; i++) { const a = -Math.PI + 0.2 + i * (Math.PI - 0.4) / 7 + (R() - 0.5) * 0.2; fr.push(frond(tx, ty, a, (54 + R() * 18) * s, (22 + R() * 14) * s, 9 * s, i % 2 ? col : lt(col, 0.12), dk(col, 0.3))); }
      drawFronds(fr, 3);
      ctx.fillStyle = mix('#c07a40', col, 0.2); circle(tx - 3 * s, ty + 4 * s, 3.5 * s); circle(tx + 4 * s, ty + 5 * s, 3.5 * s);
    },
    treefern(x, gy, s, col, R) {
      const h = 105 * s, tx = x + (R() - 0.5) * 16 * s, ty = gy - h;
      trunk(x, gy, tx, ty, 8 * s, mix('#7a5236', col, 0.2));
      ctx.strokeStyle = 'rgba(60,30,20,.35)'; ctx.lineWidth = 2; for (let k = 0.1; k < 0.95; k += 0.12) { const py = gy + (ty - gy) * k, px = x + (tx - x) * k; ctx.beginPath(); ctx.arc(px, py, 3 * s, 0, Math.PI); ctx.stroke(); }
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI + 0.15 + i * (Math.PI - 0.3) / 8, L = (58 + R() * 14) * s, ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.35 + 26 * s;
        const cx = tx + Math.cos(a) * L * 0.5, cy = ty - 22 * s;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.strokeStyle = LINE; ctx.lineWidth = 7 * s + 3; ctx.stroke(); ctx.strokeStyle = i % 2 ? col : lt(col, 0.1); ctx.lineWidth = 7 * s; ctx.stroke();
        ctx.strokeStyle = dk(col, 0.25); ctx.lineWidth = 1.6;
        for (let j = 2; j < 10; j++) { const k = j / 10, u = 1 - k, px = u * u * tx + 2 * u * k * cx + k * k * ex, py = u * u * ty + 2 * u * k * cy + k * k * ey, l = 9 * s * (1 - k * 0.6); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - l * 0.5, py + l); ctx.moveTo(px, py); ctx.lineTo(px + l * 0.5, py + l); ctx.stroke(); }
      }
      inkCircle(tx, ty, 6 * s, dk(col, 0.1), 1, LINE);
    },
    cycad(x, gy, s, col, R) {
      const th = 30 * s, tw = 13 * s, bark = mix('#a87a4a', col, 0.15);
      inkEllipse(x, gy - th * 0.5, tw, th * 0.62, 0, bark, 1.2, LINE);
      ctx.strokeStyle = 'rgba(80,40,20,.35)'; ctx.lineWidth = 1.4;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - tw, gy - th * 0.5 + i * 7 * s); ctx.lineTo(x + tw, gy - th * 0.5 + i * 7 * s - 5 * s); ctx.stroke(); }
      const fr = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI + 0.25 + i * (Math.PI - 0.5) / 9; fr.push(frond(x, gy - th, a, (40 + R() * 10) * s, 8 * s, 6 * s, i % 2 ? col : lt(col, 0.12), dk(col, 0.3))); }
      drawFronds(fr, 2.6);
      ctx.strokeStyle = dk(col, 0.25); ctx.lineWidth = 1.2;
      for (const q of fr) for (let j = 1; j < 6; j++) { const k = j / 6, px = x + (q.ex - x) * k, py = gy - th + (q.ey - gy + th) * k; ctx.beginPath(); ctx.moveTo(px, py - 3 * s); ctx.lineTo(px, py + 3 * s); ctx.stroke(); }
      inkEllipse(x, gy - th - 4 * s, 7 * s, 9 * s, 0, '#e8a050', 1, LINE);
    },
    horsetail(x, gy, s, col, R) {
      for (let i = 0; i < 3; i++) {
        const h = (110 + R() * 50) * s, sx = x + (i - 1) * 12 * s, lean = (R() - 0.5) * 18 * s, ex = sx + lean, ey = gy - h;
        ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(ex, ey);
        ctx.strokeStyle = LINE; ctx.lineWidth = 7 * s + 3; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 7 * s; ctx.stroke();
        for (let k = 0.12; k < 0.95; k += 0.11) {
          const px = sx + lean * k, py = gy - h * k, nl = 14 * s * (1.1 - k * 0.6);
          ctx.strokeStyle = dk(col, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 4 * s, py); ctx.lineTo(px + 4 * s, py); ctx.stroke();
          ctx.strokeStyle = lt(col, 0.15); ctx.lineWidth = 1.4;
          for (const d of [-1, -0.5, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + d * nl, py + nl * 0.45); ctx.stroke(); }
        }
        inkEllipse(ex, ey - 6 * s, 4.5 * s, 9 * s, lean * 0.01, '#b8864a', 1, LINE);
      }
    },
    araucaria(x, gy, s, col, R) {
      const h = 175 * s, tx = x + (R() - 0.5) * 10, ty = gy - h;
      trunk(x, gy, tx, ty + 20 * s, 7 * s, mix('#7a5236', col, 0.2));
      const pads = [];
      for (let i = 0; i < 5; i++) { const py = ty + i * 18 * s, w = (26 + i * 9) * s; pads.push([tx - w * 0.55, py + 4, w * 0.6, 9 * s], [tx + w * 0.55, py + 4, w * 0.6, 9 * s]); }
      pads.push([tx, ty - 6 * s, 16 * s, 12 * s]);
      ctx.strokeStyle = LINE; ctx.lineWidth = 4; for (const [px, py, rx, ry] of pads) { ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, TAU); ctx.stroke(); }
      for (const [px, py, rx, ry] of pads) { ctx.fillStyle = col; ellipse(px, py, rx, ry); ctx.fillStyle = lt(col, 0.18); ellipse(px, py - ry * 0.35, rx * 0.8, ry * 0.45); }
    },
    cypress(x, gy, s, col, R) {
      const h = 150 * s, bark = mix('#7a5a40', col, 0.25);
      const base = new Path2D(); base.moveTo(x - 16 * s, gy); base.quadraticCurveTo(x - 5 * s, gy - 20 * s, x - 5 * s, gy - h * 0.6); base.lineTo(x + 5 * s, gy - h * 0.6); base.quadraticCurveTo(x + 5 * s, gy - 20 * s, x + 16 * s, gy); base.closePath();
      ink(base, bark, 1.5, LINE);
      const cl = [];
      for (let i = 0; i < 6; i++) { const yy = gy - h * 0.45 - i * 18 * s, w = (30 - i * 3) * s; cl.push([x + (R() - 0.5) * 10 * s, yy, w]); }
      foliage(cl, col, LINE, Math.floor(x) + 3, 1.8);
      ctx.strokeStyle = 'rgba(200,220,180,.75)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 7; i++) { const mx = x + (R() - 0.5) * 50 * s, my = gy - h * 0.5 - R() * h * 0.4, L = (16 + R() * 22) * s; ctx.beginPath(); ctx.moveTo(mx, my); ctx.bezierCurveTo(mx - 3, my + L * 0.3, mx + 3, my + L * 0.6, mx, my + L); ctx.stroke(); }
    },
    flowertree(x, gy, s, col, R) {
      const h = 110 * s, tx = x + (R() - 0.5) * 20 * s, ty = gy - h;
      trunk(x, gy, tx, ty + 20 * s, 9 * s, mix('#8a5a3a', col, 0.15));
      const cl = [[tx, ty, 34 * s], [tx - 30 * s, ty + 14 * s, 26 * s], [tx + 30 * s, ty + 12 * s, 27 * s], [tx - 10 * s, ty - 20 * s, 24 * s], [tx + 18 * s, ty - 16 * s, 22 * s]];
      foliage(cl, col, LINE, Math.floor(x) + 7, 1.8);
      for (let i = 0; i < 12; i++) { const a = R() * TAU, d = R() * 34 * s; tinyFlower(tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.8, 4.5 * s, R() < 0.5 ? '#ffb0d0' : '#fff2f8'); }
    },
    snag(x, gy, s, col, R) {
      const bark = mix('#8a7064', col, 0.2), h = 100 * s;
      ctx.lineCap = 'round';
      const br = [[x, gy, x + 4 * s, gy - h, 9 * s], [x + 2 * s, gy - h * 0.55, x - 30 * s, gy - h * 0.85, 5 * s], [x + 3 * s, gy - h * 0.7, x + 30 * s, gy - h * 0.95, 4.5 * s], [x - 20 * s, gy - h * 0.75, x - 30 * s, gy - h * 0.98, 3 * s]];
      ctx.strokeStyle = LINE; for (const [a, b, c, d, w] of br) { ctx.lineWidth = w + 4; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
      ctx.strokeStyle = bark; for (const [a, b, c, d, w] of br) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
    },
    spire(x, gy, s, col, R) {
      const w = (34 + R() * 20) * s, h = (120 + R() * 70) * s, p = new Path2D();
      p.moveTo(x - w, gy); p.lineTo(x - w * 0.7, gy - h * 0.45); p.lineTo(x - w * 0.5, gy - h * 0.8); p.lineTo(x - w * 0.42, gy - h); p.lineTo(x + w * 0.38, gy - h + 6 * s); p.lineTo(x + w * 0.52, gy - h * 0.7); p.lineTo(x + w * 0.75, gy - h * 0.4); p.lineTo(x + w, gy); p.closePath();
      ink(p, col, 1.4, LINE);
      ctx.save(); ctx.clip(p);
      ctx.fillStyle = dk(col, 0.18); ctx.fillRect(x + w * 0.1, gy - h - 10, w, h + 20);
      ctx.fillStyle = lt(col, 0.2); ctx.fillRect(x - w, gy - h - 10, w * 0.3, h + 20);
      ctx.strokeStyle = 'rgba(120,50,30,.3)'; ctx.lineWidth = 2.5; for (let i = 1; i < 7; i++) { const yy = gy - h * i / 7; ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x + w, yy + 3); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#7fb85a'; ellipse(x - w * 0.02, gy - h + 2 * s, w * 0.42, 4 * s);
    },
    bush(x, gy, s, col, R) {
      const r = 20 * s; foliage([[x - r * 0.9, gy - r * 0.6, r * 0.75], [x + r * 0.9, gy - r * 0.55, r * 0.8], [x, gy - r * 0.95, r]], col, LINE, Math.floor(x) + 11, 1.6);
    },
    rock(x, gy, s, col, R) {
      const w = (24 + R() * 14) * s, h = (16 + R() * 10) * s, p = new Path2D();
      p.moveTo(x - w, gy); p.quadraticCurveTo(x - w, gy - h, x - w * 0.2, gy - h * 1.05); p.quadraticCurveTo(x + w * 0.8, gy - h, x + w, gy); p.closePath();
      ink(p, mix('#b8a094', col, 0.25), 1.3, LINE);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(x - w * 0.3, gy - h * 0.7, w * 0.35, h * 0.18, -0.2);
      ctx.fillStyle = '#7fb85a'; ellipse(x - w * 0.1, gy - h + 1, w * 0.3, 3);
    },
    fern(x, gy, s, col) {
      const fr = [];
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.36; fr.push(frond(x, gy, a, (40 - Math.abs(i - 3) * 5) * s, 10 * s * Math.abs(i - 3) / 3, 5 * s, i % 2 ? col : lt(col, 0.12), dk(col, 0.3))); }
      drawFronds(fr, 2.4);
    },
  };
  const MIDK = { river: ['palm', 'treefern', 'horsetail', 'araucaria', 'treefern', 'palm'], tar: ['cycad', 'snag', 'palm', 'cycad', 'snag', 'horsetail'],
    canyon: ['spire', 'palm', 'spire', 'cycad', 'spire', 'snag'], swamp: ['cypress', 'horsetail', 'treefern', 'cypress', 'horsetail'], home: ['flowertree', 'palm', 'treefern', 'flowertree', 'araucaria'] };
  const NEARK = { river: ['bush', 'cycad', 'fern', 'rock', 'bush'], tar: ['rock', 'cycad', 'rock', 'fern'], canyon: ['rock', 'cycad', 'rock', 'bush'], swamp: ['fern', 'bush', 'fern', 'cycad'], home: ['bush', 'fern', 'cycad', 'bush'] };

  function volcano(x, base, w, h, col, lava) {
    const p = new Path2D(); p.moveTo(x - w, base); p.quadraticCurveTo(x - w * 0.35, base - h * 0.55, x - w * 0.16, base - h); p.lineTo(x + w * 0.16, base - h); p.quadraticCurveTo(x + w * 0.35, base - h * 0.55, x + w, base); p.closePath();
    ink(p, col, 1.2, LINE);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = dk(col, 0.15); ctx.beginPath(); ctx.moveTo(x + w * 0.05, base - h); ctx.quadraticCurveTo(x + w * 0.3, base - h * 0.4, x + w * 0.5, base + 10); ctx.lineTo(x + w + 10, base + 10); ctx.lineTo(x + w * 0.2, base - h - 10); ctx.fill();
    ctx.fillStyle = lt(col, 0.18); ctx.beginPath(); ctx.moveTo(x - w * 0.12, base - h); ctx.quadraticCurveTo(x - w * 0.3, base - h * 0.5, x - w * 0.62, base); ctx.lineTo(x - w * 0.8, base); ctx.quadraticCurveTo(x - w * 0.35, base - h * 0.6, x - w * 0.16, base - h); ctx.fill();
    if (lava) {
      ctx.strokeStyle = '#ff8a3a'; ctx.lineWidth = 4;
      for (const [dx, L] of [[-0.06, 0.5], [0.08, 0.36]]) { ctx.beginPath(); ctx.moveTo(x + dx * w, base - h); ctx.bezierCurveTo(x + dx * w * 2, base - h * 0.8, x + dx * w * 3 - 8, base - h * (1 - L * 0.6), x + dx * w * 4, base - h * (1 - L)); ctx.stroke(); }
      ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 0.06 * w, base - h); ctx.bezierCurveTo(x - 0.12 * w, base - h * 0.8, x - 0.18 * w - 8, base - h * 0.7, x - 0.24 * w, base - h * 0.5); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = lava ? '#ff9a4a' : dk(col, 0.25); ellipse(x, base - h, w * 0.16, 4);
  }
  function mesa(x, base, w, h, col, R) {
    const p = new Path2D(); p.moveTo(x - w * 0.6, base); p.lineTo(x - w * 0.5, base - h * 0.55); p.lineTo(x - w * 0.42, base - h); p.lineTo(x + w * 0.4, base - h); p.lineTo(x + w * 0.48, base - h * 0.6); p.lineTo(x + w * 0.62, base); p.closePath();
    ink(p, col, 1.1, LINE);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = dk(col, 0.12); ctx.fillRect(x + w * 0.15, base - h - 4, w, h + 10);
    ctx.strokeStyle = 'rgba(150,70,50,.25)'; ctx.lineWidth = 3; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - w, base - h + i * h / 5); ctx.lineTo(x + w, base - h + i * h / 5 + 2); ctx.stroke(); }
    ctx.restore();
  }

  function paintLayer(id, which) {
    const L = LOOKS[id], R = rng(id.length * 131 + which.length * 17), [top, h] = LAYER[which];
    ctx.translate(0, -top);
    if (which === 'far1') {
      LINE = 'rgba(91,63,115,.14)'; const c = L.far1;
      if (id === 'canyon') {
        const g0 = ridgePath(410, [[14, 3, 0.2, 0], [8, 7, 0.5, 0]], 460); ctx.fillStyle = c; ctx.fill(g0);
        for (let i = 0; i < 6; i++) { const x = i * TW / 6 + R() * 50, w = 110 + R() * 90, hh = 70 + R() * 70; wrapAt(x, w, xx => mesa(xx, 410, w, hh, c, R)); }
      } else {
        const sharp = id === 'river' || id === 'tar';
        const waves = sharp ? [[110, 3, 0.1, 1], [60, 5, 0.37, 1], [14, 11, 0.2, 0]] : [[60, 2, 0.1, 0], [34, 5, 0.6, 0], [12, 9, 0.3, 0]];
        const path = ridgePath(sharp ? 420 : 410, waves, 460);
        ctx.fillStyle = c; ctx.fill(path); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(path);
        ctx.save(); ctx.clip(path);
        // sunny slopes on the left of each peak, shady on the right
        ctx.strokeStyle = lt(c, 0.3); ctx.lineWidth = 14; ctx.stroke(path); // a soft sunlit rim along the ridges
        if (id === 'river') { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.moveTo(-6, 0); for (let x = -6; x <= TW + 6; x += 12) ctx.lineTo(x, 286 + ((x / 12) % 2 ? 8 : -4)); ctx.lineTo(TW + 6, 0); ctx.fill(); }
        ctx.restore();
        hazeOver(path, 330, 440, L.haze);
      }
    } else if (which === 'far2') {
      LINE = 'rgba(91,63,115,.24)'; const c = L.far2;
      if (id === 'river' || id === 'home') for (const [vx, vy] of SMOKE[id]) wrapAt(vx, 120, xx => volcano(xx, 420, 120, 420 - vy, mix(c, '#8a7a9a', 0.35), false));
      if (id === 'tar') for (const [vx, vy] of SMOKE[id]) wrapAt(vx, 170, xx => volcano(xx, 440, vx < 400 ? 170 : 140, 440 - vy, c, true));
      if (id === 'canyon') for (let i = 0; i < 5; i++) { const x = i * TW / 5 + R() * 60, w = 90 + R() * 70, hh = 90 + R() * 80; wrapAt(x, w, xx => mesa(xx, 440, w, hh, c, R)); }
      const waves = id === 'tar' ? [[26, 3, 0.3, 0], [12, 7, 0.1, 0]] : [[36, 2, 0.6, 0], [20, 5, 0.2, 0], [8, 13, 0.4, 0]];
      const path = ridgePath(id === 'canyon' ? 446 : 438, waves, 470);
      ctx.fillStyle = id === 'tar' ? dk(c, 0.1) : c; ctx.fill(path); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(path);
      if (id === 'swamp' || id === 'river' || id === 'home') { // a fuzz of far-off treetops along the hills
        const tc = id === 'swamp' ? dk(c, 0.12) : mix(c, '#4a8a5a', 0.3);
        for (let x = 0; x < TW; x += 9 + R() * 8) {
          const y = ridgeY(x, 438, waves) + 4, r = 6 + R() * 7;
          wrapAt(x, r, xx => { ctx.fillStyle = tc; if (id === 'swamp' && R() < 0.4) { ctx.beginPath(); ctx.moveTo(xx - r, y + 4); ctx.lineTo(xx, y - r * 3.2); ctx.lineTo(xx + r, y + 4); ctx.fill(); } else circle(xx, y, r); });
        }
      }
      hazeOver(path, 380, 470, L.haze);
    } else if (which === 'mid') {
      LINE = 'rgba(91,63,115,.42)'; const c = L.mid;
      const waves = [[22, 2, R(), 0], [14, 5, R(), 0], [6, 9, R(), 0]], base = 432, kinds = MIDK[id];
      for (let x = 30 + R() * 20; x < TW - 20;) {
        const k = kinds[Math.floor(R() * kinds.length)], s = 0.62 + R() * 0.36, gy = ridgeY(x, base, waves) + 8, sd = Math.floor(R() * 1e6);
        const tc = k === 'spire' ? mix(c, '#e09070', 0.3) : mix(c, R() < 0.5 ? '#2f7a40' : '#b0e090', 0.12 + R() * 0.12);
        wrapAt(x, 90, xx => PLANT[k](xx, gy, s, tc, rng(sd)));
        x += 60 + R() * 80;
      }
      const path = ridgePath(base, waves, top + h + 10);
      ctx.fillStyle = vgradL(base - 40, top + h, lt(c, 0.08), dk(c, 0.18)); ctx.fill(path); ctx.strokeStyle = LINE; ctx.lineWidth = 2.4; ctx.stroke(path);
      for (let x = 0; x < TW; x += 34 + R() * 30) { const y = ridgeY(x, base, waves) + 6, s = 0.5 + R() * 0.35, sd = Math.floor(R() * 1e6); if (R() < 0.6) wrapAt(x, 40, xx => PLANT.bush(xx, y, s, mix(c, '#2f7a40', 0.15), rng(sd))); }
    } else {
      LINE = 'rgba(91,63,115,.75)'; const c = L.near;
      const waves = [[10, 3, R(), 0], [6, 7, R(), 0]], base = 462, kinds = NEARK[id];
      const path = ridgePath(base, waves, top + h + 10);
      for (let x = 20 + R() * 40; x < TW - 10;) {
        const k = kinds[Math.floor(R() * kinds.length)], s = 0.8 + R() * 0.4, gy = ridgeY(x, base, waves) + 4, sd = Math.floor(R() * 1e6);
        const tc = k === 'rock' ? mix(c, '#c8a890', 0.5) : mix(c, R() < 0.5 ? '#2a6a3a' : '#a8e090', 0.1 + R() * 0.12);
        wrapAt(x, 70, xx => PLANT[k](xx, gy, s, tc, rng(sd)));
        if (id === 'home' || id === 'river') wrapAt(x + 26, 10, xx => tinyFlower(xx, gy - 6, 5, R() < 0.5 ? '#ff9ac8' : '#fff6a8'));
        x += 70 + R() * 110;
      }
      ctx.fillStyle = vgradL(base - 10, top + h, c, dk(c, 0.2)); ctx.fill(path); ctx.strokeStyle = LINE; ctx.lineWidth = 2.5; ctx.stroke(path);
      grassBlades(0, TW, base - 2, R, [dk(c, 0.15), lt(c, 0.15)], 4, 10, 0.25);
    }
    LINE = OL;
  }
  const layerSpr = (id, which) => { const [top, h, soft] = LAYER[which]; return softSpr(id + which, TW, h, 0, 0, soft ? 1 : DPR, () => paintLayer(id, which)); };
  const skySpr = id => softSpr('sky' + id, 4, H, 0, 0, 1, () => { const gr = ctx.createLinearGradient(0, 0, 0, H); LOOKS[id].sky.forEach((c, i, a) => gr.addColorStop([0, 0.35, 0.7, 1][i] ?? i / (a.length - 1), c)); ctx.fillStyle = gr; ctx.fillRect(0, 0, 4, H); });
  const cloudSpr = i => SPR('cloud' + i, 260, 120, 130, 80, () => {
    const R = rng(40 + i), parts = [[0, 8, 104, 20]];
    for (let j = 0; j < 5; j++) { const r = 20 + R() * 12 + (j === 2 ? 12 : 0); parts.push([(j - 2) * 34 + R() * 10, -2 - R() * 10 - (j > 0 && j < 4 ? 12 : 0), r, r]); }
    ctx.strokeStyle = 'rgba(150,130,190,.35)'; ctx.lineWidth = 3; for (const [x, y, rx, ry] of parts) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#ebe4f6'; for (const [x, y, rx, ry] of parts) ellipse(x, y, rx, ry);
    ctx.fillStyle = '#ffffff'; for (const [x, y, rx, ry] of parts) ellipse(x - rx * 0.06, y - ry * 0.2, rx * 0.88, ry * 0.8);
  });
  const raysSpr = () => SPR('rays', 400, 400, 200, 200, () => {
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.fillStyle = 'rgba(255,255,230,.5)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 200, a - 0.08, a + 0.08); ctx.fill(); }
    ctx.globalCompositeOperation = 'destination-in';
    const gr = ctx.createRadialGradient(0, 0, 10, 0, 0, 200); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(-200, -200, 400, 400);
  });
  // build the tiles a little at a time (one per frame) so walking into a new place never stutters
  const PREP = [];
  function prep(id) { for (const w of ['far1', 'far2', 'mid', 'near']) if (!SPRITES['dh_' + id + w]) PREP.push([id, w]); }

  function tileLayer(spr, par, g, dy) {
    const off = ((g.camX * par) % TW + TW) % TW;
    for (let x = -off; x < W; x += TW) ctx.drawImage(spr.c, x, dy, TW, spr.h);
  }
  function farPtero(x, y, s, f) {
    ctx.beginPath(); ctx.moveTo(x - 30 * s, y - f * s);
    ctx.quadraticCurveTo(x - 14 * s, y - 9 * s, x - 4 * s, y - 2 * s); ctx.lineTo(x + 6 * s, y - 2 * s); ctx.lineTo(x + 16 * s, y - 4 * s); ctx.lineTo(x + 7 * s, y - 7 * s); ctx.lineTo(x + 5 * s, y - 2.5 * s);
    ctx.quadraticCurveTo(x + 14 * s, y - 9 * s, x + 30 * s, y - f * s); ctx.quadraticCurveTo(x + 14 * s, y - 1 * s, x + 4 * s, y + 3 * s); ctx.lineTo(x - 4 * s, y + 3 * s);
    ctx.quadraticCurveTo(x - 14 * s, y - 1 * s, x - 30 * s, y - f * s); ctx.fill();
  }
  function bug(x, y, kind, ph, col) {
    const t = S.t + ph;
    if (kind === 'dragonfly') {
      const fl = Math.abs(Math.sin(t * 40));
      ctx.fillStyle = 'rgba(230,250,255,.7)'; ellipse(x - 2, y - 3, 10, 2.5 + fl * 1.5, -0.3); ellipse(x - 2, y + 3, 10, 2.5 + fl * 1.5, 0.3); ellipse(x + 4, y - 3, 9, 2.2 + fl, -0.4); ellipse(x + 4, y + 3, 9, 2.2 + fl, 0.4);
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 8, y); ctx.stroke();
      ctx.fillStyle = col; circle(x + 9, y, 3);
    } else { // butterfly
      const fl = 0.25 + Math.abs(Math.sin(t * 9)) * 0.75;
      ctx.fillStyle = col; ellipse(x - 5 * fl, y - 3, 6 * fl, 5); ellipse(x + 5 * fl, y - 3, 6 * fl, 5);
      ctx.fillStyle = lt(col, 0.4); ellipse(x - 4 * fl, y + 3, 4 * fl, 3.4); ellipse(x + 4 * fl, y + 3, 4 * fl, 3.4);
      ctx.fillStyle = OL; ellipse(x, y, 1.4, 5);
    }
  }
  // things that fly about far away (behind the jungle)
  function ambientFar(g, id, w, par2) {
    const t = S.t;
    ctx.globalAlpha = w;
    const off = ((g.camX * par2) % TW + TW) % TW;
    for (const [vx, vy] of SMOKE[id]) for (let rep = -1; rep <= 1; rep++) {
      const sx = vx - off + rep * TW; if (sx < -200 || sx > W + 200) continue;
      const big = id === 'tar' ? 1.5 : 1;
      for (let j = 0; j < 5; j++) { const st = (t * 0.12 + j / 5) % 1; ctx.globalAlpha = w * 0.75 * (1 - st) * Math.min(1, st * 6); blit(puffSpr(), sx + st * 60 + Math.sin(st * 6 + j) * 6, vy - 6 - st * 120 * big, (0.45 + st * 1.2) * big); }
      if (id === 'tar') { ctx.globalAlpha = w * (0.5 + 0.2 * Math.sin(t * 3 + vx)); glow(sx, vy, 34, '255,140,60', 0.8); }
    }
    ctx.globalAlpha = w;
    ctx.fillStyle = id === 'tar' ? 'rgba(90,40,70,.5)' : id === 'swamp' ? 'rgba(60,90,90,.4)' : 'rgba(80,60,100,.45)';
    const n = id === 'canyon' ? 5 : 3;
    for (let i = 0; i < n; i++) { const x = ((i * 380 + t * (24 + i * 4) - g.camX * 0.2) % 1300 + 1300) % 1300 - 160, y = 110 + (i % 3) * 34 + Math.sin(t * 0.7 + i) * 10, s = 0.5 + (i % 3) * 0.12; farPtero(x, y, s, Math.sin(t * 3 + i * 1.7) * 9); }
    ctx.globalAlpha = 1;
  }
  // the living, close-up details: bugs, leaves, mist, fireflies, embers and dust
  function ambientNear(g, id, w) {
    const t = S.t; ctx.globalAlpha = w;
    if (id === 'river' || id === 'home' || id === 'swamp') for (let i = 0; i < 3; i++) {
      const x = ((i * 337 + t * 26 + Math.sin(t * 0.9 + i) * 40 - g.camX * 0.7) % 1100 + 1100) % 1100 - 70, y = 250 + i * 50 + Math.sin(t * 1.7 + i * 2) * 22;
      bug(x, y, i === 1 && id !== 'swamp' ? 'butterfly' : 'dragonfly', i, ['#4fb8e8', '#ff8fc8', '#7a5ad8'][i]);
    }
    if (id === 'home') for (let i = 0; i < 2; i++) { const x = ((i * 520 + t * 30 - g.camX * 0.6) % 1100 + 1100) % 1100 - 70, y = 200 + i * 80 + Math.sin(t * 2 + i) * 18; bug(x, y, 'butterfly', i + 4, ['#ffd84a', '#c8a8ff'][i]); }
    if (id === 'river' || id === 'home' || id === 'tar') for (let i = 0; i < 5; i++) { // falling leaves and petals
      const fall = (t * 0.07 + i * 0.21) % 1, x = ((i * 233 - g.camX * 0.6 + Math.sin(t * 1.3 + i) * 30 + fall * 120) % 1050 + 1050) % 1050 - 50, y = -20 + fall * 520;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.fillStyle = id === 'home' ? (i % 2 ? '#ffb0d0' : '#fff2f8') : id === 'tar' ? '#c8a050' : (i % 2 ? '#8ad46a' : '#ffc860'); ellipse(0, 0, 6, 3); ctx.restore();
    }
    if (id === 'swamp') {
      for (let i = 0; i < 4; i++) { const x = ((i * 300 + t * 12 - g.camX * 0.4) % 1300 + 1300) % 1300 - 170; ctx.globalAlpha = w * 0.5; blit(mistSpr(), x, 360 + (i % 2) * 50, 1.4); }
      ctx.globalAlpha = w;
      for (let i = 0; i < 10; i++) { const x = ((i * 113 + Math.sin(t * 0.6 + i) * 30 - g.camX * 0.65) % 1000 + 1000) % 1000 - 20, y = 250 + (i * 47) % 160 + Math.sin(t * 0.9 + i * 2) * 14, a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.3); ctx.globalAlpha = w * a; glow(x, y, 12, '255,250,150', 0.9); ctx.fillStyle = '#fffbd0'; circle(x, y, 1.8); }
    }
    if (id === 'tar') for (let i = 0; i < 8; i++) { const st = (t * 0.25 + i * 0.13) % 1, x = ((i * 157 - g.camX * 0.5 + Math.sin(t + i) * 20) % 1000 + 1000) % 1000 - 20, y = 440 - st * 300; ctx.globalAlpha = w * (1 - st); ctx.fillStyle = i % 2 ? '#ffb060' : '#ff7a4a'; circle(x, y, 2.2); }
    if (id === 'canyon') for (let i = 0; i < 12; i++) { const x = ((i * 89 + t * 18 - g.camX * 0.5) % 1000 + 1000) % 1000 - 20, y = 200 + (i * 61) % 240 + Math.sin(t + i) * 10; ctx.globalAlpha = w * (0.35 + 0.3 * Math.sin(t * 2 + i)); ctx.fillStyle = '#fff4d8'; circle(x, y, 1.6 + (i % 3) * 0.6); }
    ctx.globalAlpha = 1;
  }
  function backdrop(g) {
    const cx = g.camX + W / 2, zi = zoneAt(cx), nz = ZONES[zi + 1] || ZONES[zi];
    const k = nz === ZONES[zi] ? 0 : clamp((cx - (nz.x - 400)) / 400, 0, 1);
    const A = ZLOOK[zi], B = ZLOOK[Math.min(ZONES.length - 1, zi + 1)], both = k > 0.001 && A !== B;
    const t = S.t;
    // get the tiles for here and the next place ready (one per frame, so there's no hitch)
    if (!PREP.length) { prep(A); prep(B); if (ZLOOK[zi + 2]) prep(ZLOOK[zi + 2]); }
    const need = id => ['far1', 'far2', 'mid', 'near'].forEach(w => layerSpr(id, w)); need(A); if (both) need(B);
    const job = PREP.shift(); if (job) layerSpr(job[0], job[1]);
    const ka = both ? 1 - k : 1, kb = both ? k : 0;
    const each = fn => { if (ka > 0) fn(A, ka, false); if (kb > 0) fn(B, kb, true); };
    // sky, sun and clouds
    ctx.drawImage(skySpr(A).c, 0, 0, W, H);
    if (kb > 0) { ctx.globalAlpha = kb; ctx.drawImage(skySpr(B).c, 0, 0, W, H); ctx.globalAlpha = 1; }
    const sa = LOOKS[A].sun, sb = LOOKS[B].sun, sx = lerp(sa[0], sb[0], kb), sy = lerp(sa[1], sb[1], kb), sr = lerp(sa[2], sb[2], kb), scol = kb > 0.5 ? sb : sa;
    if (A === 'home' || B === 'home') { ctx.globalAlpha = A === 'home' ? 1 : kb; ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.03); ctx.globalAlpha *= 0.55; blit(raysSpr(), 0, 0, 1.6); ctx.restore(); ctx.globalAlpha = 1; }
    glow(sx, sy, sr * 4.5, scol[4], 0.75);
    inkCircle(sx, sy, sr, scol[3], 1.2, 'rgba(255,170,90,.6)');
    ctx.fillStyle = 'rgba(255,255,255,.45)'; circle(sx - sr * 0.3, sy - sr * 0.3, sr * 0.35);
    for (let i = 0; i < 6; i++) {
      const x = ((i * 230 - g.camX * 0.04 + t * (5 + i % 3)) % (W + 300) + W + 300) % (W + 300) - 150, y = 74 + (i % 3) * 40 + (i % 2) * 12;
      ctx.globalAlpha = A === 'tar' ? 0.75 : 0.95; blit(cloudSpr(i % 3), x, y, 0.55 + (i % 3) * 0.2);
    }
    ctx.globalAlpha = 1;
    // far layers, jungle and near bushes, each sliding at its own speed (and dipping a little when she's up high)
    for (const w of ['far1', 'far2', 'mid', 'near']) {
      const [top, h, , par] = LAYER[w], dy = top - g.camY * par * 0.5;
      each((id, a) => {
        ctx.globalAlpha = a; tileLayer(layerSpr(id, w), par, g, dy);
        if (w === 'mid' || w === 'near') { ctx.fillStyle = dk(LOOKS[id][w], w === 'mid' ? 0.18 : 0.2); ctx.fillRect(0, dy + h - 2, W, H - dy - h + 4); }
      });
      ctx.globalAlpha = 1;
      if (w === 'far2') each((id, a) => ambientFar(g, id, a, par));
    }
    each((id, a) => ambientNear(g, id, a));
  }
  // a few big fronds right in front, swaying gently (drawn over the water at the bottom of the screen)
  const frontSpr = id => SPR('front' + id, 200, 140, 100, 132, () => {
    LINE = 'rgba(61,44,74,.9)'; const c = dk(LOOKS[id].near, 0.25), R = rng(9);
    if (id === 'canyon' || id === 'tar') { PLANT.cycad(0, 0, 1.25, c, R); }
    else if (id === 'swamp' || id === 'river') { PLANT.fern(-30, 0, 1.9, c); ctx.strokeStyle = LINE; for (let i = 0; i < 4; i++) { const x = 20 + i * 12, hh = 90 + i * 8; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 6, -hh * 0.5, x + 2 + i * 3, -hh); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = LINE; if (i % 2) inkEllipse(x + 2 + i * 3, -hh + 8, 5, 13, 0.05, '#8a5a3a', 1, LINE); } }
    else { PLANT.fern(0, 0, 2, c); tinyFlower(-40, -40, 7, '#ff9ac8'); tinyFlower(36, -54, 7, '#fff6a8'); }
    LINE = OL;
  });
  function foreground(g) {
    const t = S.t, P = 1.25, span = 1560;
    for (let i = 0; i < 3; i++) {
      const wx = ((i * 520 + 260 - g.camX * P) % span + span) % span - 200;
      if (g.camX + wx > 5600) continue; // keep the lookout view clear
      const id = ZLOOK[zoneAt(g.camX + wx)];
      ctx.save(); ctx.translate(wx, H + 26 - g.camY * P); ctx.rotate(Math.sin(t * 0.9 + i * 2) * 0.04); blit(frontSpr(id), 0, 0, 0.75 + (i % 2) * 0.1); ctx.restore();
    }
  }
  // what's under the dinosaurs: water, tar, a canyon or swamp. back = before the dinos, front = after (so their legs wade)
  const canyonSpr = () => SPR('canyon', 430, 160, 0, -420, () => {
    ctx.fillStyle = vgradL(420, 580, '#c86a40', '#3a1a30'); ctx.fillRect(0, 420, 430, 160);
    const bands = [['#d88058', 432, 10], ['#b85a3e', 452, 14], ['#8e4038', 474, 12], ['#6a2c34', 496, 10]];
    for (const [c, y, a] of bands) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 580); for (let x = 0; x <= 430; x += 10) ctx.lineTo(x, y - a * (0.5 + 0.5 * Math.sin(x / 430 * TAU * 3 + y))); ctx.lineTo(430, 580); ctx.fill(); ctx.strokeStyle = 'rgba(255,210,170,.25)'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,220,180,.18)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 440 + i * 16); ctx.lineTo(430, 444 + i * 16); ctx.stroke(); }
    // a thin river glinting far, far below
    ctx.strokeStyle = '#5a9ad0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 528); for (let x = 0; x <= 430; x += 10) ctx.lineTo(x, 528 + Math.sin(x / 430 * TAU * 2) * 5); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,240,255,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
  });
  const edgeSpr = () => SPR('edge', 170, 200, 85, -396, () => {
    const p = P2('M-70,580 L-60,440 Q-40,418 -10,424 Q20,410 50,428 L70,580 Z');
    ink(p, vgradL(410, 540, '#c89070', '#6a3e34'), 1.3);
    ctx.save(); ctx.clip(p); ctx.fillStyle = 'rgba(255,230,200,.25)'; ctx.fillRect(-70, 400, 26, 200); ctx.fillStyle = 'rgba(60,20,30,.2)'; ctx.fillRect(30, 400, 50, 200);
    ctx.strokeStyle = 'rgba(100,50,30,.3)'; ctx.lineWidth = 2.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-70, 452 + i * 24); ctx.lineTo(70, 446 + i * 24); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#7fc86a'; ellipse(-20, 424, 26, 5);
    grassBlades(-40, 10, 424, rng(3), ['#4f9a3e', '#6fbf5a'], 4, 10, 0.3);
  });
  function wavyTop(x0, x1, y, amp, sp, ph = 0) {
    ctx.beginPath(); ctx.moveTo(x0, H + 200);
    for (let x = x0; x <= x1 + 15; x += 16) ctx.lineTo(Math.min(x, x1), y + Math.sin(x * 0.04 + S.t * sp + ph) * amp);
    ctx.lineTo(x1, H + 200); ctx.closePath();
  }
  function hazards(g, front) {
    const l = g.camX - 40, r = g.camX + W + 40, t = S.t;
    for (let zi = 1; zi <= 4; zi++) {
      const z = ZONES[zi], x0 = Math.max(l, z.x), x1 = Math.min(r, ZONES[zi + 1].x);
      if (x1 <= x0) continue;
      const y = z.haz;
      if (z.id === 'river' || z.id === 'swamp') {
        const sw = z.id === 'swamp';
        if (!front) {
          ctx.fillStyle = sw ? vg('swb', y, H, '#7cba98', '#4a8a6c', '#2f5e4c') : vg('rvb', y, H, '#7ad4f6', '#3c9cdc', '#2468a8'); ctx.fillRect(x0, y, x1 - x0, H - y + 200);
          ctx.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 3; i++) ctx.fillRect(x0, y + 34 + i * 24 + Math.sin(t + i) * 2, x1 - x0, 5);
          // reeds and cattails poking up out of the water, behind the dinosaurs
          for (let x = Math.ceil(x0 / 240) * 240 + 70; x < x1; x += 240) {
            const sway = Math.sin(t * 1.1 + x) * 3;
            for (let i = 0; i < 4; i++) { const rx = x + i * 9, hh = 30 + ((x / 240 + i) % 3) * 12; ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(rx, y + 6); ctx.quadraticCurveTo(rx + sway * 0.5, y - hh * 0.5, rx + sway, y - hh); ctx.stroke(); ctx.strokeStyle = sw ? '#5a9a5a' : '#6abf6a'; ctx.lineWidth = 3; ctx.stroke(); if (i % 2) inkEllipse(rx + sway, y - hh + 6, 3.5, 9, 0, '#9a6040', 0.8); }
          }
        } else {
          ctx.fillStyle = sw ? vg('swf', y, H, 'rgba(110,170,130,.55)', 'rgba(60,120,90,.8)') : vg('rvf', y, H, 'rgba(120,205,250,.5)', 'rgba(40,120,200,.78)');
          wavyTop(x0, x1, y, 3, 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 2.5; ctx.beginPath();
          for (let x = x0; x <= x1 + 15; x += 16) { const xx = Math.min(x, x1), yy = y + Math.sin(xx * 0.04 + t * 2) * 3; if (x === x0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
          ctx.stroke();
          // shimmer: little light dashes that twinkle on and off
          ctx.lineCap = 'round';
          for (let x = Math.ceil(x0 / 60) * 60; x < x1; x += 60) {
            const a = 0.15 + 0.45 * Math.max(0, Math.sin(t * 1.8 + x * 0.7)), wy = y + 16 + (x * 7 % 64), wx = x + Math.sin(t * 0.8 + x) * 8, L = 14 + (x % 3) * 8;
            ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(2)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + L, wy); ctx.stroke();
          }
          for (let x = Math.ceil(x0 / 140) * 140; x < x1; x += 140) { const s = Math.sin(t * 2.3 + x * 0.37); if (s > 0.8) star(x + 30, y + 8 + (x % 20), 3 + (s - 0.8) * 20, '#ffffff', 4); }
          if (sw) { // lily pads, flowers, duckweed and drifting mist
            for (let x = Math.ceil(x0 / 130) * 130; x < x1; x += 130) {
              const px = x + 40 + Math.sin(t * 0.5 + x) * 3, py = y + 16 + (x % 3) * 12;
              ctx.beginPath(); ctx.moveTo(px, py); ctx.ellipse(px, py, 22, 7, 0, 0.3, TAU - 0.3); ctx.closePath(); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#6ac86a'; ctx.fill();
              ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(px - 8, py - 2, 8, 2);
              if (x % 260 === 0) flower(px + 6, py - 4, 6, '#ff9ac8', '#ffd84a', 1);
            }
            ctx.fillStyle = 'rgba(160,220,120,.6)'; for (let x = Math.ceil(x0 / 23) * 23; x < x1; x += 23) circle(x + Math.sin(x) * 6, y + 6 + (x * 13 % 40), 2);
            for (let i = 0; i < 8; i++) { const mx = 4740 + (i * 330 + t * 14) % 940; if (mx > x0 - 160 && mx < x1 + 160) { ctx.globalAlpha = 0.35 * Math.min(1, (mx - 4740) / 120, (5680 - mx) / 120); blit(mistSpr(), mx, y - 26 - (i % 2) * 40, 1.1); ctx.globalAlpha = 1; } }
          } else { // a little fish leaps now and then
            for (let x = Math.ceil(x0 / 170) * 170; x < x1; x += 170) {
              const fy = (t * 0.7 + x * 0.013) % 3; if (fy >= 0.6) continue;
              const k = fy / 0.6, fx = x + k * 50, fyy = y - Math.sin(k * Math.PI) * 40;
              ctx.save(); ctx.translate(fx, fyy); ctx.rotate(-Math.cos(k * Math.PI) * 0.8);
              ink(P_FISH, '#ffa040', 0.8); ctx.fillStyle = '#ffd080'; ellipse(-1, 2, 5, 2); ctx.fillStyle = OL; circle(6, -1, 1.3);
              ctx.restore();
              if (k > 0.85) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + 50, y + 2, 10 + (k - 0.85) * 120, 3, 0, 0, TAU); ctx.stroke(); }
            }
          }
        }
      } else if (z.id === 'tar') {
        if (!front) { ctx.fillStyle = vg('tarb', y, H, '#4a3658', '#1e1628'); ctx.fillRect(x0, y, x1 - x0, H - y + 200); }
        else {
          ctx.fillStyle = vg('tarf', y, H, 'rgba(58,40,74,.9)', 'rgba(30,20,40,.95)'); wavyTop(x0, x1, y, 1.5, 0.7); ctx.fill();
          ctx.fillStyle = 'rgba(255,200,255,.06)'; ctx.fillRect(x0, y + 3, x1 - x0, 12);
          ctx.strokeStyle = 'rgba(190,150,220,.45)'; ctx.lineWidth = 2; ctx.beginPath();
          for (let x = x0; x <= x1 + 15; x += 16) { const xx = Math.min(x, x1), yy = y + Math.sin(xx * 0.04 + t * 0.7) * 1.5; if (x === x0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 3;
          for (let x = Math.ceil(x0 / 110) * 110; x < x1; x += 110) { ctx.beginPath(); ctx.ellipse(x + 30 + Math.sin(t * 0.4 + x) * 6, y + 30 + (x % 40), 30, 4, 0, Math.PI, Math.PI * 2); ctx.stroke(); }
          for (let x = Math.ceil(x0 / 75) * 75; x < x1; x += 75) { // bubbles that swell and pop
            const bt = (t * 0.6 + x * 0.37) % 2, bx = x + 20, by = y + 8 + (x % 30);
            if (bt < 1) {
              const r = 4 + bt * 14;
              ctx.fillStyle = 'rgba(90,70,120,.85)'; ctx.beginPath(); ctx.arc(bx, by, r, Math.PI, TAU); ctx.fill();
              ctx.strokeStyle = 'rgba(180,150,220,.75)'; ctx.lineWidth = 2; ctx.stroke();
              ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(bx - r * 0.4, by - r * 0.6, r * 0.22, r * 0.14, -0.5);
            } else if (bt < 1.3) { // pop!
              const k = (bt - 1) / 0.3; ctx.strokeStyle = `rgba(200,170,230,${(1 - k).toFixed(2)})`; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.ellipse(bx, by, 14 + k * 16, 3 + k * 2, 0, 0, TAU); ctx.stroke();
              ctx.fillStyle = `rgba(120,95,150,${(1 - k).toFixed(2)})`; for (const d of [-1, 0, 1]) circle(bx + d * (8 + k * 14), by - 14 * Math.sin(k * Math.PI) - 4 + Math.abs(d) * 4, 2.6);
            }
          }
          for (let x = Math.ceil(x0 / 190) * 190; x < x1; x += 190) { const st = (t * 0.35 + x * 0.01) % 1; ctx.globalAlpha = 0.28 * Math.sin(st * Math.PI); blit(puffSpr(), x + 60 + st * 20, y - st * 70, 0.5 + st * 0.6); ctx.globalAlpha = 1; }
          for (let x = Math.ceil(x0 / 400) * 400 + 120; x < x1; x += 400) inkAt(x + 9, y - 2, -0.75, P_BONE, '#fff4e0', 1);
        }
      } else if (z.id === 'canyon' && !front) {
        const s = canyonSpr(); ctx.save(); ctx.beginPath(); ctx.rect(x0, 420, x1 - x0, 200); ctx.clip();
        for (let x = Math.floor(x0 / 430) * 430; x < x1; x += 430) ctx.drawImage(s.c, x, 420, 431, 160);
        ctx.restore();
        for (let x = Math.ceil(x0 / 260) * 260; x < x1; x += 260) { ctx.globalAlpha = 0.4; blit(mistSpr(), x + Math.sin(t * 0.3 + x) * 30, 476, 1); ctx.globalAlpha = 1; }
      }
    }
    if (!front) return;
    // rocky edges where one place turns into the next (in front of the water, so the shoreline reads cleanly)
    for (const bx of [1990, 3450, 4740]) {
      if (bx < l - 100 || bx > r + 100) continue;
      blit(edgeSpr(), bx, 0);
    }
  }
  const P_FISH = P2('M-10,0 Q-2,-7 8,-2 Q11,0 8,2 Q-2,7 -10,0 Z M-10,0 L-16,-6 L-15,0 L-16,6 Z');
  const P_BONE = P2('M-16,-3 L16,-3 Q18,-9 22,-6 Q26,-3 22,0 Q26,3 22,6 Q18,9 16,3 L-16,3 Q-18,9 -22,6 Q-26,3 -22,0 Q-26,-3 -22,-6 Q-18,-9 -16,-3 Z');
  // ripples where the dinosaurs stand in the water or tar
  function wakes(g) {
    const t = S.t;
    for (const p of g.plats) {
      if (p.x + p.R + 200 < g.camX || p.x + p.L - 200 > g.camX + W) continue;
      const z = ZONES[zoneAt(p.x)], wy = z.haz;
      if (wy > 600) continue;
      const tar = z.id === 'tar', rgb = tar ? '200,170,230' : '255,255,255';
      let at = [];
      if (p.kind === 'plesio') at = [[p.x, 90]];
      else if (p.kind === 'longneck') at = [[p.x - 110, 20], [p.x - 77, 18], [p.x + 43, 18], [p.x + 60, 20]];
      else if (p.kind === 'hadro') at = [[p.x - 20, 22], [p.x - 66, 64]];
      else if (p.kind === 'stego') at = [[p.x - 89, 18], [p.x - 66, 16], [p.x + 50, 16], [p.x + 71, 18]];
      else if (p.kind === 'trike') at = [-71, -53, 43, 62].map(lx => [p.x + lx * p.dir, 16]);
      for (let i = 0; i < at.length; i++) {
        const [x, rx] = at[i];
        for (let j = 0; j < 2; j++) {
          const ph = (t * (tar ? 0.3 : 0.6) + j * 0.5 + i * 0.27) % 1, rr = rx * (0.75 + ph * 0.6);
          ctx.strokeStyle = `rgba(${rgb},${((1 - ph) * (tar ? 0.35 : 0.55)).toFixed(2)})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(x, wy + 3, rr, rr * 0.16 + 2, 0, 0, TAU); ctx.stroke();
        }
      }
      if (p.kind === 'plesio') { // foam where the swimmer pushes through the water
        ctx.fillStyle = 'rgba(255,255,255,.8)';
        for (const s of [-1, 1]) for (let j = 0; j < 3; j++) circle(p.x + s * (78 + j * 7), wy + 1 + Math.sin(t * 5 + j + s) * 1.5, 4 - j);
      }
    }
  }
  // the view from the lookout: the valley far below, a twisty jungle canyon, and Mama and Papa's nest on the far hill
  const vistaBack = () => SPR('vistaBack', 650, 300, -6140, -250, () => {
    // golden, hazy ridges far across the valley
    ctx.fillStyle = vgradL(250, 380, '#ffd8b0', '#f4c0a0'); ctx.beginPath(); ctx.moveTo(6140, 400); for (let x = 6140; x <= 6790; x += 10) ctx.lineTo(x, 318 - Math.sin(x * 0.012) * 18 - Math.sin(x * 0.031) * 8); ctx.lineTo(6790, 400); ctx.fill();
    ctx.fillStyle = vgradL(300, 400, '#e8c0a8', '#c8d0a0'); ctx.beginPath(); ctx.moveTo(6140, 420); for (let x = 6140; x <= 6790; x += 10) ctx.lineTo(x, 348 - Math.sin(x * 0.02 + 1) * 14); ctx.lineTo(6790, 420); ctx.fill();
    // the valley floor, with a river winding through it
    ctx.fillStyle = vgradL(370, 540, '#c8e4b0', '#7cb88a'); ctx.fillRect(6150, 372, 640, 180);
    ctx.strokeStyle = '#9ad0f0'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(6160, 400); ctx.bezierCurveTo(6300, 380, 6380, 420, 6480, 392); ctx.bezierCurveTo(6560, 372, 6640, 396, 6790, 384); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,220,.8)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#9cc890'; for (let i = 0; i < 26; i++) { const x = 6160 + i * 25, y = 380 + (i * 37 % 30); circle(x, y, 5 + i % 3); }
  });
  const vistaFront = () => SPR('vistaFront', 660, 320, -6140, -240, () => {
    // the far hill where Mama and Papa have their nest, lit gold from behind
    const hill = new Path2D(); hill.ellipse(6620, 400, 190, 96, 0, Math.PI, TAU); hill.closePath();
    ctx.save(); ctx.shadowColor = 'rgba(255,214,120,.9)'; ctx.shadowBlur = 16; ctx.fillStyle = '#ffd88a'; ctx.fill(hill); ctx.restore();
    ctx.fillStyle = vgradL(300, 420, '#b4dc96', '#78b870'); ctx.fill(hill);
    ctx.strokeStyle = 'rgba(255,220,140,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(6620, 400, 190, 96, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    for (let i = 0; i < 7; i++) { const a = Math.PI * (1.12 + i * 0.11), x = 6620 + Math.cos(a) * 190, y = 400 + Math.sin(a) * 96; PLANT.bush(x, y + 6, 0.35, '#6aac5e', rng(i)); }
    // the nest
    ctx.fillStyle = '#a07040'; ellipse(6605, 312, 34, 10); ctx.fillStyle = '#7a5030'; ellipse(6605, 308, 24, 5);
    ctx.strokeStyle = '#c89058'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(6578 + i * 10, 306); ctx.lineTo(6586 + i * 10, 318); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(91,63,115,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(6605, 312, 34, 10, 0, 0, TAU); ctx.stroke();
    // the twisty jungle canyon in between: a winding trail through thick bushes (the maze comes next)
    LINE = 'rgba(61,44,74,.55)';
    const back = []; for (let i = 0; i < 16; i++) back.push([6190 + i * 34, 392 + (i % 3) * 14, 26]);
    foliage(back, '#4f9a5a', LINE, 21, 1.6);
    ctx.strokeStyle = 'rgba(91,63,115,.45)'; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const trail = () => { ctx.beginPath(); ctx.moveTo(6215, 440); for (let i = 1; i <= 8; i++) ctx.lineTo(6215 + i * 44, i % 2 ? 392 : 430); ctx.lineTo(6590, 330); };
    trail(); ctx.stroke(); ctx.strokeStyle = '#ecd098'; ctx.lineWidth = 9; trail(); ctx.stroke();
    ctx.setLineDash([2, 10]); ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 3; trail(); ctx.stroke(); ctx.setLineDash([]);
    const fr = []; for (let i = 0; i < 14; i++) fr.push([6200 + i * 38, 430 + (i % 2) * 18, 22]);
    foliage(fr, '#3f8a4c', LINE, 33, 1.6);
    for (let i = 0; i < 4; i++) PLANT.palm(6230 + i * 120, 414 + (i % 2) * 14, 0.5 + (i % 2) * 0.16, '#3f8a4c', rng(50 + i));
    LINE = OL;
  });
  function farParent(x, y, sc, col, pop, open, ph) {
    const t = S.t, wave = Math.sin(t * 7 + ph) * 0.5;
    ctx.save(); ctx.translate(x, y + (1 - pop) * 60); ctx.scale(-sc, sc);
    const SIL = mix(col, '#2a1838', 0.58), RIM = '#ffd06a';
    const neck = bez([-30, 120], [-40, 60], [0, 20], 8), arm = [[92, 24], [128 + Math.cos(wave) * 8, -12 + Math.sin(wave) * 24]];
    const plates = [[-58, 60, 34], [-50, 18, 40], [-34, -24, 34]].map(([px, py, h]) => { const q = new Path2D(); q.addPath(P2(`M-16,6 Q-17,${-h * 0.5} 0,${-h} Q17,${-h * 0.5} 16,6 Z`), new DOMMatrix().translate(px, py).rotate(-0.6 * 180 / Math.PI)); return q; });
    const shape = (fill, grow) => {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = fill; ctx.fillStyle = fill;
      ctx.lineWidth = 70 + grow; ctx.beginPath(); neck.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke();
      ctx.lineWidth = 16 + grow; ctx.beginPath(); ctx.moveTo(...arm[0]); ctx.lineTo(...arm[1]); ctx.stroke();
      ctx.lineWidth = grow || 0.01; for (const q of plates) { if (grow) ctx.stroke(q); ctx.fill(q); }
      ctx.beginPath(); ctx.ellipse(30, -10, 76 + grow / 2, 58 + grow / 2, 0.1, 0, TAU); ctx.fill();
    };
    // a warm rim of sunset light around a dark, backlit silhouette
    ctx.save(); ctx.shadowColor = 'rgba(255,200,110,1)'; ctx.shadowBlur = 30; shape(RIM, 14); ctx.restore();
    shape(SIL, 0);
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ellipse(30, -24, 8, 9); ellipse(70, -26, 7, 8);
    ctx.fillStyle = '#3a2440'; circle(32, -22, 4.5); circle(72, -24, 4);
    ctx.strokeStyle = RIM; ctx.lineWidth = 4; ctx.beginPath(); if (open) ctx.arc(68, 14, 14, 0.2, Math.PI - 0.2); else ctx.arc(68, 8, 14, 0.5, Math.PI - 0.5); ctx.stroke();
    ctx.restore();
  }
  function vista(g) {
    const t = S.t;
    blit(vistaBack(), 0, 0);
    // the low golden sun behind the far hill, and its rays
    ctx.save(); ctx.translate(6700, 300); ctx.rotate(t * 0.04); ctx.globalAlpha = 0.5; blit(raysSpr(), 0, 0, 1.8); ctx.restore(); ctx.globalAlpha = 1;
    glow(6680, 300, 240, '255,214,130', 0.8);
    // Mama and Papa popping up behind their nest, waving
    const mu = g.mama;
    if (mu > 0) {
      // Mama and Papa in full colour, warmly lit by the low sun, rising up and bobbing happily (so they can't be mistaken for the sneaky dinos)
      glow(6612, 280, 110, '255,226,150', 0.75 * mu);
      for (const [x, y, sc, pal, pop, ph] of [[6660, 322, 0.36, typeof PAPA_PAL !== 'undefined' ? PAPA_PAL : null, clamp(mu * 1.3 - 0.3, 0, 1), 1.3], [6582, 318, 0.32, typeof MAMA_PAL !== 'undefined' ? MAMA_PAL : null, mu, 0]]) {
        if (pop <= 0) continue;
        const bob = Math.abs(Math.sin(t * 4 + ph)) * 6 * pop;
        if (typeof drawBabyDino === 'function') drawBabyDino(x, y + (1 - pop) * 70 - bob, sc, {}, { facing: -1, grown: true, palette: pal || undefined, mood: mu > 0.6 ? 'joy' : 'wow', t });
        else farParent(x - 15, y - 18, sc + 0.08, '#6fc0a0', pop, mu > 0.6, ph);
      }
    }
    blit(vistaFront(), 0, 0);
    // sneaky dinos rustling in the bushes, eyes glinting
    const ru = g.rustle;
    if (ru > 0) {
      for (const [bx, by, ph] of [[6262, 404, 0], [6380, 420, 1.3], [6470, 398, 2.4]]) {
        const sh = Math.sin(t * 30 + ph) * 3 * (1 - Math.min(1, ru * 0.8)) + Math.sin(t * 9 + ph) * 1.5;
        const cl = [[bx + sh, by, 24], [bx + 18 + sh, by + 6, 18], [bx - 18 + sh, by + 6, 18]];
        ctx.strokeStyle = 'rgba(61,44,74,.6)'; ctx.lineWidth = 3.4; for (const [cx, cy, r] of cl) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = '#2f7a40'; for (const [cx, cy, r] of cl) circle(cx, cy, r);
        ctx.fillStyle = '#3f9450'; for (const [cx, cy, r] of cl) circle(cx - r * 0.2, cy - r * 0.3, r * 0.55);
        // leaves shaken loose
        for (let i = 0; i < 3; i++) { const lt2 = (t * 0.9 + i * 0.33 + ph) % 1; ctx.globalAlpha = ru * (1 - lt2); ctx.save(); ctx.translate(bx + (i - 1) * 18 + lt2 * 14 * (i - 1), by - 20 - lt2 * 26 + lt2 * lt2 * 40); ctx.rotate(t * 4 + i); ctx.fillStyle = '#5ab866'; ellipse(0, 0, 5, 2.5); ctx.restore(); ctx.globalAlpha = 1; }
        if (ru > 0.35) {
          const op = (t + ph) % 3 > 0.15 ? 1 : 0.1;
          ctx.globalAlpha = op;
          glow(bx + sh, by - 2, 22, '255,230,80', 0.35);
          for (const ex of [-7, 7]) { ctx.fillStyle = '#ffe63c'; ellipse(bx + ex + sh, by - 2, 5, 3.5); ctx.fillStyle = '#1e0a14'; ellipse(bx + ex + sh + 1, by - 2, 1.4, 3); }
          ctx.strokeStyle = '#1e0a14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 13 + sh, by - 9); ctx.lineTo(bx - 3 + sh, by - 6); ctx.moveTo(bx + 13 + sh, by - 9); ctx.lineTo(bx + 3 + sh, by - 6); ctx.stroke();
          const gl = (t * 1.3 + ph) % 2.2; if (gl < 0.35) star(bx + 9 + sh, by - 5, 2 + Math.sin(gl / 0.35 * Math.PI) * 6, '#ffffff', 4);
          ctx.globalAlpha = 1;
        }
      }
      // a raptor shadow darting along the trail
      if (ru > 0.5) {
        const k = ((t * 0.5) % 1.6) / 1.6, rx = 6230 + k * 300, ry = 425 - Math.sin(k * Math.PI * 4) * 8;
        ctx.fillStyle = 'rgba(30,20,40,.55)'; ctx.save(); ctx.translate(rx, ry);
        ctx.beginPath(); ctx.moveTo(-26, -4); ctx.quadraticCurveTo(-6, -16, 10, -12); ctx.lineTo(22, -18); ctx.lineTo(26, -12); ctx.lineTo(12, -4); ctx.lineTo(6, 6); ctx.lineTo(0, 6); ctx.lineTo(-2, -2); ctx.lineTo(-10, 6); ctx.lineTo(-14, 6); ctx.lineTo(-14, -2); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // the near jungle beside the lookout
    palm(5790, 420, 130, '#4aa858', 10); fern(5720, 420, 40, '#3f8f48');
  }
  // the lookout rock at the valley's edge
  const lookoutSpr = () => SPR('lookout', 170, 60, -6040, -380, () => {
    const p = P2('M6050,424 Q6056,396 6090,392 Q6150,388 6178,400 Q6196,410 6200,424 Z');
    ink(p, vgradL(388, 424, '#e4c49c', '#a88a68'), 1.3);
    ctx.save(); ctx.clip(p); ctx.fillStyle = 'rgba(255,240,200,.4)'; ctx.fillRect(6050, 388, 160, 8); ctx.strokeStyle = 'rgba(120,80,50,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6100, 404); ctx.lineTo(6140, 410); ctx.lineTo(6170, 406); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#7fc86a'; ellipse(6070, 396, 16, 4); grassBlades(6060, 6082, 396, rng(8), ['#4f9a3e', '#6fbf5a'], 3, 8, 0.4);
  });
  function lookout() { blit(lookoutSpr(), 0, 0); }

  // --- Aubrey with the baby dino on her back --------------------------------------------------
  // where he sits for each of her poses (in her own coords, facing right; his origin is at his feet)
  const CARRY = { idle_front: { x: -6, y: -60, s: 0.22, f: -1, hands: [[-11, -80], [10, -81]] }, twirl: { x: -5, y: -64, s: 0.22, f: -1, hands: [[-11, -84], [12, -85]] } };
  function drawCarry(g, x, y, frame, mood, alpha = 1) {
    const a = g.a, d = CARRY[frame];
    ctx.save(); ctx.translate(x, y); ctx.scale(a.facing, 1); ctx.globalAlpha = alpha;
    if (a.wob > 0) { const w = Math.sin(a.wob * 22) * 0.18 * a.wob; ctx.translate(0, -30); ctx.rotate(w); ctx.translate(0, 30); }
    const c = a.charging ? a.charge : 0, ld = a.land / 0.15, up = !a.on && g.state === 'play' ? clamp(-a.vy / 700, 0, 1) * 0.07 : 0;
    ctx.scale(1 + c * 0.08 + ld * 0.1 - up * 0.5, 1 - c * 0.14 - ld * 0.12 + up);
    if (!d.front) baby(d.x, d.y, d.s, { mood, facing: d.f, ph: 0.5 });
    drawAubrey(0, 0, frame, 1, 0, SC);
    if (d.front) baby(d.x, d.y, d.s, { mood, facing: d.f, ph: 0.5 });
    // his little hands holding on over her shoulders
    for (const [hx, hy] of d.hands) { inkEllipse(hx, hy, 3.6, 2.8, 0, MINT, 0.8); ctx.strokeStyle = '#3f6e4e'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx - 1.2, hy + 0.5); ctx.lineTo(hx - 1.2, hy + 2.8); ctx.moveTo(hx + 1.2, hy + 0.5); ctx.lineTo(hx + 1.2, hy + 2.8); ctx.stroke(); }
    ctx.restore();
  }
  // hop effects: dust puffs, landing rings and a twinkly trail (purely for show; kept apart from the game state)
  const FX = []; let fxOwner = null, fxT = 0, prevOn = null, prevState = 'play', trailT = 0;
  const fxAdd = o => { if (FX.length < 160) FX.push(o); };
  function fxStep(g) {
    if (fxOwner !== g.plats) { FX.length = 0; fxOwner = g.plats; prevOn = g.a.on; prevState = g.state; fxT = S.t; }
    const dt = clamp(S.t - fxT, 0, 0.05), a = g.a; fxT = S.t;
    const dusty = ['tar', 'canyon', 'meadow', 'home'].includes(ZONES[zoneAt(a.x)].id);
    if (g.state === 'play') {
      if (prevOn && !a.on) { // take-off
        for (let i = 0; i < 8; i++) fxAdd({ k: 'puff', x: a.x + rand(-16, 16), y: a.y - 3, vx: rand(-70, 70) - a.vx * 0.12, vy: rand(-36, -6), r: rand(6, 11), life: 0.6, max: 0.6, col: dusty ? '#f4e6cc' : '#ffffff' });
        fxAdd({ k: 'ring', x: a.x, y: a.y, life: 0.35, max: 0.35, r: 18, col: '255,255,255' });
      }
      if (!prevOn && a.on && prevState === 'play') { // landing
        fxAdd({ k: 'ring', x: a.x, y: a.y, life: 0.45, max: 0.45, r: 22, col: '125,255,154' });
        for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1; fxAdd({ k: 'puff', x: a.x + s * rand(6, 18), y: a.y - 2, vx: s * rand(40, 90), vy: rand(-24, -4), r: rand(5, 8), life: 0.45, max: 0.45, col: dusty ? '#f4e6cc' : '#ffffff' }); }
        for (let i = 0; i < 5; i++) fxAdd({ k: 'star', x: a.x + rand(-30, 30), y: a.y - rand(10, 60), vx: rand(-30, 30), vy: rand(-60, -20), r: rand(3, 6), life: 0.7, max: 0.7, col: pick(['#fff6a8', '#ffb3e0', '#b8f0ff']) });
      }
      if (!a.on && (trailT -= dt) <= 0) { trailT = 0.04; fxAdd({ k: 'star', x: a.x - a.vx * 0.03 + rand(-10, 10), y: a.y - 50 + rand(-25, 25), vx: rand(-10, 10), vy: rand(-10, 10), r: rand(2.5, 5), life: 0.55, max: 0.55, col: pick(['#fff6a8', '#ffb3e0', '#b8f0ff', '#ffffff']) }); }
    }
    if (g.state === 'rescue' && g.res && (trailT -= dt) <= 0) { trailT = 0.03; const r = g.res, px = r.t < 0.6 ? lerp(a.x + 380, a.x, ss(r.t / 0.6)) : a.x, py = r.t < 0.6 ? lerp(a.y - 420, a.y - 150, ss(r.t / 0.6)) : a.y - 150; for (let i = 0; i < 2; i++) fxAdd({ k: 'star', x: px + rand(-60, 60), y: py + rand(-14, 14), vx: rand(-20, 20), vy: rand(10, 40), r: rand(3, 6), life: 0.8, max: 0.8, col: pick(['#fff6a8', '#ffb3e0', '#ffd0b8', '#ffffff']) }); }
    prevOn = a.on; prevState = g.state;
    for (let i = FX.length - 1; i >= 0; i--) {
      const f = FX[i]; f.life -= dt; if (f.life <= 0) { FX.splice(i, 1); continue; }
      f.x += (f.vx || 0) * dt; f.y += (f.vy || 0) * dt;
      if (f.k === 'puff') { f.vx *= 0.9; f.vy *= 0.92; f.r += dt * 14; }
      if (f.k === 'star') f.vy += 30 * dt;
    }
  }
  function fxDraw(stars) {
    for (const f of FX) {
      const u = f.life / f.max;
      if (stars !== (f.k === 'star')) continue;
      if (f.k === 'puff') { ctx.globalAlpha = u * 0.85; ctx.fillStyle = f.col; circle(f.x, f.y - f.r * 0.5, f.r); ctx.globalAlpha = u * 0.4; ctx.strokeStyle = 'rgba(160,140,170,1)'; ctx.lineWidth = 1.2; ctx.stroke(); }
      else if (f.k === 'ring') { ctx.globalAlpha = u; ctx.strokeStyle = `rgba(${f.col},.9)`; ctx.lineWidth = 3 * u + 1; ctx.beginPath(); const rr = f.r + (1 - u) * 36; ctx.ellipse(f.x, f.y, rr, rr * 0.28, 0, 0, TAU); ctx.stroke(); }
      else { ctx.globalAlpha = Math.min(1, u * 1.6); star(f.x, f.y, f.r * (0.6 + 0.4 * Math.sin(f.life * 20)), f.col, 4); }
    }
    ctx.globalAlpha = 1;
  }
  // --- the journey strip at the top, and the lookout's vignette (painted once) ---
  const ZC = ['#8ad46a', '#4fb8e8', '#a070d0', '#ec8a5a', '#4fbc8a', '#ff8fb8'];
  const vigSpr = () => softSpr('vig', 192, 108, 0, 0, 1, () => { const gr = ctx.createRadialGradient(96, 54, 34, 96, 54, 112); gr.addColorStop(0, 'rgba(60,20,40,0)'); gr.addColorStop(1, 'rgba(60,20,40,.6)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, 192, 108); });
  function stripSpr(lit) {
    return SPR('strip' + (lit ? 1 : 0), 520, 64, -220, 0, () => {
      const mx0 = W / 2 - 200, mx1 = W / 2 + 170, toX = x => mx0 + clamp(x / NEST, 0, 1) * (mx1 - mx0);
      if (!lit) {
        ctx.save(); ctx.shadowColor = 'rgba(20,6,30,.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; rrect(mx0 - 44, 6, mx1 - mx0 + 108, 52, 24, vgradL(6, 58, 'rgba(84,48,116,.93)', 'rgba(48,24,72,.93)')); ctx.restore();
        rrect(mx0 - 44, 6, mx1 - mx0 + 108, 52, 24, null, 'rgba(255,255,255,.75)', 2.5);
        rrect(mx0 - 4, 31, mx1 - mx0 + 8, 16, 8, 'rgba(20,6,30,.5)');
      }
      for (let i = 0; i < ZONES.length; i++) {
        const xa = toX(Math.max(0, ZONES[i].x)), xb = i + 1 < ZONES.length ? toX(ZONES[i + 1].x) : mx1;
        rrect(xa, 34, xb - xa + (i + 1 < ZONES.length ? 2 : 0), 10, 5, lit ? ZC[i] : mix(ZC[i], '#4a3060', 0.6));
        if (lit) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(xa + 3, 35.5, Math.max(0, xb - xa - 4), 2.5); }
      }
      if (lit) return;
      for (let i = 1; i < 5; i++) { const x = (toX(ZONES[i].x) + toX(ZONES[i + 1].x)) / 2; inkCircle(x, 18, 10, '#fff8fc', 1, 'rgba(255,255,255,.6)'); emoji(ZONES[i].icon, x, 18, 13); }
      inkCircle(mx1 + 26, 32, 19, vgradL(13, 51, '#fff4d8', '#ffd8a0'), 1.2, '#ffffff');
      emoji('🪺', mx1 + 26, 36, 22); emoji('🦕', mx1 + 48, 24, 17);
    });
  }

  // --- physics, shared by the game and by its aiming preview ------------------------------------
  function air(g, s, dt, steer = 0) {
    if (steer) s.vx = clamp(s.vx + steer * 320 * dt, -560, 560);
    // a gentle helping hand: drifting down just short of a dino nudges her onto its back
    if (s.vy > 0) for (const p of g.plats) {
      const lx = s.x - p.x;
      if (lx > p.L - 70 && lx < p.L && s.y < surfAt(p, s.x) - 4) { s.vx += 240 * dt; break; }
      if (lx < p.R + 70 && lx > p.R && s.y < surfAt(p, s.x) - 4 && s.vx < 0) { s.vx -= 240 * dt; break; }
    }
    const py = s.y;
    s.vy += G * dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.vy > 0) for (const p of g.plats) {
      const lx = s.x - p.x;
      if (lx < p.L - TOL || lx > p.R + TOL) continue;
      const sy = surfAt(p, s.x);
      if (py <= sy + 14 && s.y >= sy) return p;
    }
    return null;
  }
  const hazTop = x => { const z = ZONES[zoneAt(x)]; return z.haz ?? 640; };
  function launch(g, c) {
    const st = g.a.on?.kind === 'stego' ? 1.12 : 1; // springy stego plates send her further
    return { vx: g.a.facing * (180 + 290 * c) * st, vy: -(455 + 190 * c) * (st > 1 ? 1.04 : 1) };
  }
  // where a hop with this much power would land (with everything frozen as it is now)
  function predict(g, c) {
    const v = launch(g, c), s = { x: g.a.x, y: g.a.y - 2, vx: v.vx, vy: v.vy }, dots = [];
    for (let i = 0; i < 160; i++) {
      const p = air(g, s, 1 / 60);
      if (i % 4 === 0) dots.push([s.x, s.y]);
      if (p) return { p, x: s.x, y: surfAt(p, s.x), dots };
      if (s.y > hazTop(s.x) + 20) break;
    }
    return { p: null, x: s.x, y: s.y, dots };
  }

  function land(g, p) {
    const a = g.a, lx = a.x - p.x;
    a.on = p; a.vx = a.vy = 0; a.land = 0.15; p.sq = 0.3;
    a.rel = clamp(lx, p.L + 10, p.R - 10);
    a.y = surfAt(p, p.x + a.rel);
    g.last = p; g.hops++;
    const sx = a.x - g.camX, sy = a.y - g.camY;
    const edge = Math.min(lx - p.L, p.R - lx);
    if (edge < 14) { // a wobbly landing near the edge (or just past it): she steadies herself
      a.wob = 1; g.mood = 'scared'; g.moodT = 1.1;
      floatText(sx, sy - 140, 'Whoa!', '#fff6a8', false, 24); tone(330, 0.2, 'triangle', 0.06, 0, 220);
    } else {
      g.mood = 'joy'; g.moodT = 1.2;
      floatText(sx - 20, sy - 140, pick(['Squeak!', 'Squee!', 'Yay!']), '#c8ffd0', false, 22);
      tone(1200, 0.12, 'sine', 0.06, 0, 1800); tone(1500, 0.12, 'sine', 0.05, 0.1, 2100);
    }
    // each dino says hello in its own way
    switch (p.kind) {
      case 'longneck': tone(150, 0.4, 'sine', 0.07, 0, 110); break;
      case 'plesio': burst(sx, sy + 20, 10, { kind: 'bubble', colors: ['#fff'], spread: 60, up: 40, size: [2, 4] }); tone(500, 0.15, 'sine', 0.05, 0, 300); break;
      case 'stego': tone(420, 0.3, 'sine', 0.08, 0, 1100); burst(sx, sy, 8, { colors: ['#ffb0a0', '#fff6a8'] }); break;
      case 'trike': tone(180, 0.25, 'triangle', 0.06, 0, 140); break;
      case 'ankylo': tone(120, 0.3, 'triangle', 0.07, 0, 90); if (p.awake <= 0) floatText(sx + 60, sy - 40, 'Snort!', '#fff', false, 18); break;
      case 'ptera': tone(900, 0.2, 'triangle', 0.05, 0, 1300); break;
      case 'hadro': p.dunk = 14; tone(260, 0.25, 'square', 0.04, 0, 200); tone(260, 0.25, 'square', 0.04, 0.28, 200); floatText(sx + 30, sy - 60, 'Honk!', '#fff', false, 18); break;
    }
    burst(sx, sy, 6, { colors: ['#ffffff', '#c8ffd0'], spread: 60, up: 10, size: [2, 4] });
    // a new part of the journey, and a dino fact the first time she meets each kind
    const zi = zoneAt(p.x + p.L + 1);
    let line = '';
    if (zi > g.zone) { g.zone = zi; g.banner = 3.2; SFX.sparkle(); line = ZONES[zi].say; }
    const K = KINDS[p.kind];
    if (K.fact && !g.seen[p.kind]) { g.seen[p.kind] = true; g.fact = { icon: K.icon, name: K.name, text: K.fact, t: 6 }; line = `${line} ${K.fact}`.trim(); }
    if (p.kind === 'home') { g.state = 'home'; g.homeT = 0; SFX.fanfare(); line = `The Home Valley! We're almost there, ${S.name}!`; g.fact = null; }
    if (line) speak(line);
  }

  function finish(g) {
    if (g.done) return;
    g.done = true;
    if (typeof dinoHopDone === 'function') dinoHopDone(); else setScene('title');
  }

  SCENES.dinohop = {
    enter() {
      const plats = PATH.map(makePlat);
      Object.assign(this, {
        plats, a: { x: 120, y: 420, vx: 0, vy: 0, on: plats[0], rel: -45, facing: 1, charge: 0, charging: false, queued: false, wob: 0, land: 0 },
        camX: 0, camY: 0, state: 'play', zone: 0, banner: 0, fact: null, seen: {}, last: plats[0], hops: 0, rescues: 0, jumps: 0,
        mood: 'happy', moodT: 0, res: null, homeT: 0, mama: 0, rustle: 0, spotT: -1, done: false, ending: false, time: 0,
      });
      for (const p of plats) movePlat(p, 0, this);
      const n = S.name || 'Sprout';
      say([
        ['narrator', '', `The supplies are packed. Now it's time to take ${n} home to his mama!`, () => SFX.sparkle()],
        ['aubrey', 'determined', `Climb on my back, ${n}! There's no road to your valley, so we'll hop across the dinosaurs.`],
        ['narrator', '', 'Hold SPACE, or press and hold the screen, to power up a hop. Let go to jump! The arrow keys walk along a dinosaur’s back.'],
        ['aubrey', 'excited', 'Hold on tight! Here we go!'],
      ]);
    },
    predict(c) { return predict(this, c); },
    update(dt) {
      const g = this, a = g.a;
      g.time += dt;
      for (const k of ['banner', 'moodT']) g[k] = Math.max(0, g[k] - dt);
      a.wob = Math.max(0, a.wob - dt * 1.3); a.land = Math.max(0, a.land - dt);
      if (g.fact && g.banner <= 0 && (g.fact.t -= dt) <= 0) g.fact = null;
      for (const p of g.plats) { p.occ = a.on === p && g.state !== 'rescue'; movePlat(p, dt, g); }
      const onBtn = inRect(WALK_L) || inRect(WALK_R);
      const held = keys[' '] || keys.arrowup || keys.w || (pointer.down && !onBtn);
      const fresh = pressed[' '] || pressed.arrowup || pressed.w || (pointer.clicked && !onBtn);
      const walk = (goLeft() || (pointer.down && inRect(WALK_L)) ? -1 : 0) + (goRight() || (pointer.down && inRect(WALK_R)) ? 1 : 0);
      if (g.state === 'play') {
        if (a.on) {
          const p = a.on;
          if (!a.charging && walk) { a.rel = clamp(a.rel + walk * 150 * dt, p.L + 8, p.R - 8); a.facing = walk; }
          a.x = p.x + a.rel; a.y = surfAt(p, a.x);
          if (!a.charging && (fresh || (a.queued && held))) { a.charging = true; a.charge = 0; }
          a.queued = false;
          if (a.charging) {
            a.charge = Math.min(1, a.charge + dt / 0.85);
            if (!held) {
              const v = launch(g, a.charge);
              a.on = null; a.vx = v.vx; a.vy = v.vy; a.y -= 2; a.charging = false; g.jumps++;
              SFX.jump(); g.mood = 'wow'; g.moodT = 0.6;
            }
          }
          if (p.kind === 'plesio' && p.sink > 16 && g.moodT <= 0) { g.mood = 'scared'; g.moodT = 0.3; }
        } else {
          if (fresh) a.queued = true;
          if (!held) a.queued = false;
          const prevY = a.y, p = air(g, a, dt, walk);
          if (walk) a.facing = Math.sign(a.vx) || a.facing;
          if (p) land(g, p);
          else {
            if (a.vy > 300 && g.moodT <= 0) { g.mood = 'scared'; g.moodT = 0.2; }
            const hz = hazTop(a.x);
            if (prevY < hz && a.y >= hz && hz < 600) { // splash!
              const z = ZONES[zoneAt(a.x)].id, cols = z === 'tar' ? ['#3a2c48', '#6a5a7a'] : z === 'swamp' ? ['#6aa88a', '#c8f0d0'] : ['#8ad4ff', '#ffffff'];
              burst(a.x - g.camX, hz - g.camY, 18, { colors: cols, spread: 120, up: 160, size: [3, 6] }); noise(0.3, 0.06);
            }
            if (a.y > hz + 30 || a.y > 700) {
              // Petra the pteranodon swoops in and carries them both back
              g.state = 'rescue'; g.rescues++; g.res = { t: 0, x0: a.x, y0: Math.min(a.y, hz + 30) };
              g.mood = 'scared'; g.moodT = 2;
              tone(700, 0.25, 'sine', 0.06, 0, 1200);
              speak(pick([`Whoops! Petra the pteranodon is coming to help!`, `Splash! Don't worry, Petra will carry you back!`, `Oh no! Here comes Petra to the rescue!`]));
            }
          }
        }
      } else if (g.state === 'rescue') {
        const r = g.res, p = g.last; r.t += dt;
        const rel = clamp(p === a.on ? a.rel : (p.L + p.R) / 2, p.L + 20, p.R - 20), tx = p.x + rel, ty = surfAt(p, tx);
        if (r.t < 0.6) { a.x = r.x0; a.y = r.y0 + Math.sin(r.t * 20) * 3; }
        else if (r.t < 1.9) {
          const k = ss((r.t - 0.6) / 1.3), u = 1 - k, mx = (r.x0 + tx) / 2, my = Math.min(r.y0, ty) - 170;
          a.x = u * u * r.x0 + 2 * u * k * mx + k * k * tx; a.y = u * u * r.y0 + 2 * u * k * my + k * k * (ty - 30);
        } else {
          a.on = p; a.rel = rel; a.x = tx; a.y = ty; a.vx = a.vy = 0; a.charging = false; a.land = 0.15; a.facing = 1;
          g.state = 'play'; g.res = null; g.mood = 'happy'; g.moodT = 1;
          floatText(tx - g.camX, ty - g.camY - 140, 'Thank you, Petra!', '#fff6a8', false, 22); SFX.sparkle();
        }
      } else if (g.state === 'home') {
        // she walks to the lookout; Mama spots them from across the valley... then something rustles in the canyon
        g.homeT += dt;
        if (a.x < NEST - 1) { a.x = Math.min(NEST, a.x + 150 * dt); a.facing = 1; a.rel = a.x - a.on.x; a.y = a.on.base - 20 * clamp((a.x - 6045) / 45, 0, 1); }
        else {
          a.x = NEST; a.y = 400; a.facing = 1;
          if (g.spotT < 0) {
            g.spotT = 0; SFX.fanfare();
            tone(330, 0.35, 'triangle', 0.08, 0.6, 520); tone(520, 0.45, 'triangle', 0.08, 0.95, 440); // Mama's happy call
            speak(`Look, ${S.name}! It's your mama, way across the valley!`);
          }
        }
        if (g.spotT >= 0) {
          const st0 = g.spotT; g.spotT += dt;
          g.mama = Math.min(1, g.mama + dt / 0.6);
          const cross = s => st0 < s && g.spotT >= s;
          if (cross(0.7)) { burst(6580 - g.camX, 230 - g.camY, 14, { kind: 'heart', colors: ['#ff6fae', '#ff9ac8'], spread: 60, up: 60, size: [2, 3] }); floatText(6580 - g.camX, 210 - g.camY, 'Rawr-oo!', '#fff6a8', false, 22); }
          if (cross(1.3)) { floatText(a.x - 30 - g.camX, a.y - 150 - g.camY, 'Squeak squeak!', '#c8ffd0', false, 24); tone(1300, 0.12, 'sine', 0.06, 0, 1900); tone(1500, 0.12, 'sine', 0.06, 0.15, 2100); }
          g.mood = g.spotT < 3 ? 'joy' : 'scared'; g.moodT = 1;
          if (g.spotT > 3) {
            if (cross(3.01)) { noise(0.5, 0.05); tone(160, 0.3, 'triangle', 0.05, 0.2, 120); }
            g.rustle = Math.min(1, g.rustle + dt / 1.4);
          }
          if (g.spotT > 4.8 && !g.ending) {
            g.ending = true;
            say([
              ['aubrey', 'surprised', `Uh-oh... those dinos look like they want to snatch you!`],
              ['aubrey', 'determined', `Stay close, ${S.name}. We'll get you to Mama!`],
            ], () => finish(g));
          }
        } else { g.mood = 'joy'; g.moodT = 1; }
      }
      if (g.moodT <= 0) g.mood = 'happy';
      // the camera follows her (and rises a little when she goes up high)
      const cx = clamp(a.x - 330, 0, END - W), cy = Math.min(0, a.y - 210);
      g.camX = lerp(g.camX, cx, Math.min(1, dt * 4)); g.camY = lerp(g.camY, cy, Math.min(1, dt * (cy < g.camY ? 10 : 3)));
    },
    draw() {
      buttons = [];
      const g = this, a = g.a, t = S.t;
      fxStep(g);
      backdrop(g);
      ctx.save(); ctx.translate(-Math.round(g.camX), -Math.round(g.camY));
      hazards(g, false);
      if (g.camX + W > 5600) vista(g);
      for (const p of g.plats) { if (p.x + p.R + 320 < g.camX || p.x + p.L - 320 > g.camX + W) continue; DRAW[p.kind](p); }
      if (g.camX + W > 5600) lookout();
      // the aiming arc while she powers up: glowing dots that twinkle along the path, and a pulsing landing ring
      let aim = null;
      if (g.state === 'play' && a.on && a.charging) {
        aim = predict(g, a.charge);
        const n = aim.dots.length, ok = !!aim.p, rgb = ok ? '255,250,200' : '255,170,170';
        aim.dots.forEach(([x, y], i) => {
          const u = i / n, tw = 0.5 + 0.5 * Math.sin(t * 10 - i * 0.9);
          ctx.globalAlpha = (0.3 + 0.7 * u) * (ok ? 1 : 0.7); glow(x, y, 10 + 5 * u, rgb, 0.45 + 0.3 * tw);
          ctx.fillStyle = ok ? '#ffffff' : '#ffd6d6'; circle(x, y, 2.6 + 1.6 * u + tw * 0.8);
        });
        ctx.globalAlpha = 1;
        if (aim.p) {
          const ps = (t * 1.6) % 1;
          glow(aim.x, aim.y, 34, '125,255,154', 0.5);
          ctx.strokeStyle = `rgba(125,255,154,${(1 - ps).toFixed(2)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(aim.x, aim.y, 26 + ps * 22, 8 + ps * 6, 0, 0, TAU); ctx.stroke();
          ctx.strokeStyle = 'rgba(40,120,60,.6)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(aim.x, aim.y, 26, 8, 0, 0, TAU); ctx.stroke();
          ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 4; ctx.stroke();
          const by = aim.y - 30 + Math.sin(t * 6) * 4; // a little bouncing arrow
          ctx.beginPath(); ctx.moveTo(aim.x - 9, by - 8); ctx.lineTo(aim.x + 9, by - 8); ctx.lineTo(aim.x, by + 3); ctx.closePath();
          ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#7dff9a'; ctx.fill();
          star(aim.x + 22, aim.y - 22, 6 + Math.sin(t * 8) * 2, '#fff6a8', 4);
        }
      }
      fxDraw(false);
      // a soft shadow under her feet, and a warm glow while she powers up
      if (a.on && g.state !== 'rescue') {
        ctx.fillStyle = 'rgba(40,20,50,.22)'; ellipse(a.x, a.y + 2, 20, 5);
        if (a.charging) { glow(a.x, a.y - 4, 26 + 26 * a.charge, '255,240,160', 0.25 + 0.45 * a.charge); for (let i = 0; i < 3; i++) { const u = (t * 1.5 + i / 3) % 1; ctx.globalAlpha = (1 - u) * a.charge; star(a.x + Math.sin(i * 2.4) * 18, a.y - u * 50, 3, '#fff6a8', 4); } ctx.globalAlpha = 1; }
      }
      // Aubrey and the baby dino, who rides on her back all the way
      const frame = a.on ? 'idle_front' : 'twirl';
      drawCarry(g, a.x, a.y + 2, g.state === 'rescue' ? 'twirl' : frame, g.mood);
      if (g.state === 'rescue') { // Petra swoops in and holds them up by Aubrey's hands
        const r = g.res, px = r.t < 0.6 ? lerp(a.x + 380, a.x, ss(r.t / 0.6)) : a.x, py = r.t < 0.6 ? lerp(a.y - 420, a.y - 150, ss(r.t / 0.6)) : a.y - 150;
        if (r.t < 0.6) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(px + 60 + i * 10, py - 20 + i * 18); ctx.lineTo(px + 130 + i * 22, py - 70 + i * 10); ctx.stroke(); } }
        glow(px, py - 4, 90, '255,230,200', 0.35);
        if (r.t > 0.5) { ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 6, py + 14); ctx.lineTo(a.x - 4, a.y - 112); ctx.stroke(); }
        drawPtera(px, py, t * 14, 0.75, 'happy', true);
      }
      hazards(g, true);
      wakes(g);
      fxDraw(true);
      ctx.restore();
      foreground(g);
      // the lookout: golden hour, a soft vignette and cinema bars while Mama is spotted
      if (g.state === 'home') {
        const hk = clamp(g.homeT / 1.5, 0, 1), sk = g.spotT >= 0 ? clamp(g.spotT / 0.8, 0, 1) : 0;
        ctx.globalAlpha = 0.28 * hk; ctx.fillStyle = vg('gold', 0, H, 'rgba(255,170,90,0)', 'rgba(255,190,110,1)', 'rgba(255,150,90,1)'); ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.85 * hk; ctx.drawImage(vigSpr().c, 0, 0, W, H);
        ctx.globalAlpha = 1;
        if (sk > 0) { ctx.fillStyle = 'rgba(24,10,30,.88)'; ctx.fillRect(0, 0, W, 26 * sk); ctx.fillRect(0, H - 26 * sk, W, 26 * sk); }
      }
      drawFx(false);
      // power meter over her head
      if (g.state === 'play' && a.on && a.charging) {
        const sx = a.x - g.camX, sy = a.y - g.camY - 150, c = a.charge;
        ctx.save(); ctx.translate(sx, sy);
        if (c >= 1) glow(0, 0, 70, '255,220,120', 0.35 + 0.15 * Math.sin(t * 12));
        ctx.save(); ctx.shadowColor = 'rgba(30,10,50,.4)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; rrect(-48, -12, 96, 24, 12, 'rgba(48,24,72,.88)'); ctx.restore();
        rrect(-48, -12, 96, 24, 12, null, 'rgba(255,255,255,.9)', 2.5);
        ctx.save(); ctx.beginPath(); ctx.roundRect(-42, -6, 84, 12, 6); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-42, -6, 84, 12);
        ctx.fillStyle = lg('meter', -42, 0, 42, 0, ['#7dff9a', '#ffe46a', '#ff8fc8']); ctx.fillRect(-42, -6, 84 * c, 12);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-42, -6, 84 * c, 4);
        ctx.fillStyle = 'rgba(48,24,72,.35)'; for (const q of [0.25, 0.5, 0.75]) ctx.fillRect(-42 + 84 * q - 0.75, -6, 1.5, 12);
        ctx.restore();
        star(-42 + 84 * c, 0, 7 + (c >= 1 ? Math.sin(t * 14) * 2 : 0), '#ffffff', 4);
        if (c >= 1) outlined('Full power!', 0, -26, 17, '#fff6a8');
        ctx.restore();
      }
      // the map of the journey home
      const mx0 = W / 2 - 200, mx1 = W / 2 + 170;
      const toX = x => mx0 + clamp(x / NEST, 0, 1) * (mx1 - mx0);
      const ax = toX(a.x);
      blit(stripSpr(false), 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, ax, 60); ctx.clip(); blit(stripSpr(true), 0, 0); ctx.restore();
      const my = 39 + (a.on ? 0 : Math.sin(t * 10) * 1.5);
      ctx.fillStyle = 'rgba(20,6,30,.35)'; ellipse(ax, my + 15, 12, 3);
      ctx.save(); ctx.beginPath(); ctx.arc(ax, my, 14, 0, TAU); ctx.closePath(); ctx.fillStyle = '#ffd8e8'; ctx.fill(); ctx.clip();
      if (IMG.face_happy) ctx.drawImage(IMG.face_happy, ax - 15, my - 16, 30, 33);
      ctx.restore();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ax, my, 14, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 3; ctx.stroke();
      // walk buttons for touch screens
      if (g.state === 'play') for (const [r, s] of [[WALK_L, '◀'], [WALK_R, '▶']]) { rrect(r.x, r.y, r.w, r.h, 16, pointer.down && inRect(r) ? 'rgba(255,111,181,.85)' : 'rgba(48,24,72,.55)', 'rgba(255,255,255,.8)', 2.5); text(s, r.x + r.w / 2, r.y + r.h / 2 + 1, 26, '#fff', 'center', 700); }
      // a banner for each new part of the journey
      if (g.banner > 0 && !dlg && ZONES[g.zone].name) {
        const z = ZONES[g.zone], zc = ZC[g.zone], age = 3.2 - g.banner, drop = eob(clamp(age / 0.55, 0, 1)), out = g.banner < 0.4 ? g.banner / 0.4 : 1;
        ctx.globalAlpha = out; ctx.save(); ctx.translate(W / 2, H + 60 - drop * 134);
        // ribbon tails
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 200, -24); ctx.lineTo(s * 262, -20); ctx.lineTo(s * 244, 6); ctx.lineTo(s * 262, 30); ctx.lineTo(s * 200, 30); ctx.closePath(); ctx.fillStyle = dk(zc, 0.2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.stroke(); }
        ctx.save(); ctx.shadowColor = 'rgba(30,10,50,.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5; rrect(-220, -40, 440, 86, 26, lg('ban' + g.zone, 0, -40, 0, 46, [lt(zc, 0.45), zc])); ctx.restore();
        rrect(-220, -40, 440, 86, 26, null, '#ffffff', 3.5);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.roundRect(-212, -34, 424, 26, 16); ctx.fill();
        for (const s of [-1, 1]) { const bob = Math.sin(t * 4 + s) * 3; inkCircle(s * 180, 3 + bob, 27, '#fff8fc', 1.2); emoji(z.icon, s * 180, 3 + bob, 34); }
        outlined(z.name, 0, -7, 30, '#ffffff', 'center', dk(zc, 0.5)); text(z.tip, 0, 26, 17, '#ffffff', 'center', 700);
        for (let i = 0; i < 4; i++) { const tw = Math.sin(t * 5 + i * 1.7); if (tw > 0) star(-150 + i * 100, -44 + (i % 2) * 92, 4 + tw * 5, '#fff6a8', 4); }
        ctx.restore(); ctx.globalAlpha = 1;
      }
      // a dino fact card that pops up from the bottom
      if (g.fact && g.banner <= 0 && !dlg && g.state === 'play') {
        const f = g.fact, age = 6 - f.t, al = clamp(f.t / 0.4, 0, 1) * clamp(age / 0.25, 0, 1), e = eob(clamp(age / 0.5, 0, 1)), lines = wrap(f.text, 450, 16);
        const h = 48 + lines.length * 20, y0 = H - 16 - h + (1 - e) * 50, cx0 = W / 2 - 300;
        ctx.globalAlpha = al; panel(cx0, y0, 600, h, 22);
        ctx.fillStyle = 'rgba(127,216,138,.14)'; ctx.beginPath(); ctx.roundRect(cx0 + 4, y0 + 4, 108, h - 8, 18); ctx.fill();
        const bx = cx0 + 58, by = y0 + h / 2, bob = Math.sin(t * 3) * 2;
        glow(bx, by, 50, '255,246,180', 0.5);
        inkCircle(bx, by + bob, 34, vg('factb', -34, 34, '#c8ffd0', '#7fd88a'), 1.4);
        ctx.save(); ctx.translate(bx, by + bob); ctx.rotate(Math.sin(t * 2) * 0.08); emoji(f.icon, 0, 0, 38); ctx.restore();
        rrect(cx0 + 128, y0 + 10, 92, 24, 12, '#7fd88a'); text('Dino fact!', cx0 + 174, y0 + 22, 13, '#ffffff', 'center', 800);
        text(f.name, cx0 + 230, y0 + 23, 18, '#3fae6a', 'left', 800);
        lines.forEach((l, i) => text(l, cx0 + 130, y0 + 48 + i * 20, 16, '#5a3a7a', 'left', 500));
        ctx.globalAlpha = 1;
      }
      if (g.state === 'play' && g.jumps === 0 && !dlg) {
        const pulse = 1 + Math.sin(t * 4) * 0.03;
        ctx.save(); ctx.translate(W / 2, 140); ctx.scale(pulse, pulse);
        rrect(-280, -52, 560, 104, 26, 'rgba(48,24,72,.62)', 'rgba(255,255,255,.7)', 2.5);
        outlined('Hold SPACE (or press and hold) to power up,', 0, -24, 24, '#fff6a8');
        outlined('then let go to HOP!', 0, 8, 24, '#fff6a8');
        outlined('← → walk', 0, 36, 18, '#ffffff');
        ctx.restore();
      }
      if (g.state === 'home' && g.spotT > 0.4 && !dlg) {
        const uh = g.spotT > 3.2, e = eob(clamp((g.spotT - (uh ? 3.2 : 0.4)) / 0.45, 0, 1));
        ctx.save(); ctx.translate(W / 2, 98); ctx.scale(e, e);
        panel(-220, -28, 440, 56, 24);
        if (uh) { emoji('👀', -186, 0, 28); emoji('👀', 186, 0, 28); }
        else for (const s of [-1, 1]) heart(s * 186, -10 + Math.sin(t * 5 + s) * 2, 26, '#ff6fae');
        outlined(uh ? 'Uh-oh... who’s that?' : 'We can see your mama!', 0, 0, 28, uh ? '#a05ad8' : '#ff6fb5', 'center', '#fff');
        ctx.restore();
      }
    },
  };
}
