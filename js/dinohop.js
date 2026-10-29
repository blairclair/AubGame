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
  function eye(x, y, r, closed = false, look = 1) {
    if (closed) { ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.6, r * 0.35); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0.25, Math.PI - 0.25); ctx.stroke(); return; }
    inkCircle(x, y, r, '#fff', 1);
    ctx.fillStyle = OL_DARK; circle(x + r * 0.25 * look, y + r * 0.1, r * 0.62);
    ctx.fillStyle = '#fff'; circle(x + r * 0.05 * look, y - r * 0.22, r * 0.26);
  }
  function smile(x, y, w, open = false) {
    ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    if (open) { ctx.beginPath(); ctx.arc(x, y - w * 0.3, w, 0.1, Math.PI - 0.1); ctx.closePath(); ctx.fillStyle = '#c0405a'; ctx.fill(); ctx.stroke(); return; }
    ctx.beginPath(); ctx.arc(x, y - w * 0.6, w, 0.4, Math.PI - 0.4); ctx.stroke();
  }
  const blush = (x, y, r) => { ctx.fillStyle = 'rgba(255,120,150,.42)'; ellipse(x, y, r, r * 0.6); };
  const blinking = ph => (S.t + ph) % 4.2 < 0.13;
  // a thick outlined tube along a polyline (necks and tails)
  function tube(pts, w, fill) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = OL; ctx.lineWidth = w + 5; ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
  }
  const bez = (a, b, c, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; });
  function spots(list, col) { ctx.fillStyle = col; for (const [x, y, r] of list) ellipse(x, y, r, r * 0.7); }
  function glow(x, y, r, rgb, a = 0.6) {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
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
  function drawLongneck(p) {
    const C = '#7fb3e8', CD = '#5d92d0', k = p.sq > 0 ? Math.sin(p.sq / 0.3 * Math.PI) * 0.03 : 0;
    ctx.save(); ctx.translate(p.x, p.base);
    ink(P2('M-120,-122 C-175,-118 -235,-88 -290,-36 C-240,-66 -182,-82 -122,-80 Z'), C, 1.3);
    inkRect(-92, -85, 30, 85, CD, 2.5, 12); inkRect(28, -85, 30, 85, CD, 2.5, 12);
    const hc = -112 - p.rise, pts = [];
    for (let lx = 20; lx <= 205; lx += 8) pts.push([lx, -112 - p.rise * ss((lx - 30) / 175)]);
    tube(pts, 44, C);
    ctx.save(); ctx.translate(-25, -100); ctx.scale(1 + k, 1 - k);
    inkEllipse(0, 0, 125, 58, 0, vgradL(-58, 58, '#a8d0ff', C), 1.3);
    ctx.fillStyle = '#d6e8ff'; ellipse(10, 30, 80, 20);
    spots([[-60, -28, 9], [-30, -40, 7], [10, -44, 10], [44, -32, 7], [-80, -6, 6]], 'rgba(70,110,190,.35)');
    ctx.restore();
    inkRect(-126, -75, 32, 77, C, 2.5, 12); inkRect(44, -75, 32, 77, C, 2.5, 12);
    spots(pts.filter((_, i) => i % 4 === 2 && i > 4).map(([x, y]) => [x, y - 6, 5]), 'rgba(70,110,190,.35)');
    inkEllipse(222, hc - 2, 32, 21, 0.05, C, 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(214, hc - 14, 14, 5);
    eye(226, hc - 8, 6.5, blinking(p.ph));
    smile(240, hc + 6, 7);
    ctx.fillStyle = OL; circle(249, hc - 6, 1.6);
    blush(232, hc + 6, 5);
    ctx.restore();
  }
  function drawPlesio(p) {
    const C = '#5fc6c0', CL = '#9be8de';
    ctx.save(); ctx.translate(p.x, p.base + p.dy);
    const fl = Math.sin(S.t * 4 + p.ph) * 0.4;
    inkAt(-50, 4, 0.6 + fl, P2('M0,0 C-10,10 -40,22 -54,18 C-40,6 -20,-4 0,-6 Z'), C, 1.1);
    inkAt(40, 6, -0.4 - fl, P2('M0,0 C10,10 40,22 54,18 C40,6 20,-4 0,-6 Z'), C, 1.1);
    ink(P2('M-78,-8 C-110,-12 -130,0 -152,12 C-120,14 -100,10 -76,6 Z'), C, 1.2);
    const neck = bez([52, -22], [100, -40], [116, -100], 10);
    tube(neck, 24, C);
    inkEllipse(0, -6, 85, 34, 0, vgradL(-40, 20, CL, C), 1.3);
    spots([[-40, -26, 7], [-10, -34, 9], [26, -30, 7], [50, -20, 5]], 'rgba(20,110,110,.3)');
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-20, -32, 30, 5);
    inkEllipse(126, -110, 26, 16, -0.15, C, 1.2);
    const scared = p.sink > 18;
    eye(128, -116, 5.5, !scared && blinking(p.ph));
    smile(140, -104, 6, scared);
    blush(134, -102, 4);
    ctx.restore();
  }
  function drawStego(p) {
    const C = '#f4b860', CD = '#d8913a', PL = '#ff7f6a';
    ctx.save(); ctx.translate(p.x, p.base);
    ink(P2('M-96,-96 C-140,-96 -180,-82 -210,-58 C-170,-66 -134,-66 -98,-64 Z'), C, 1.3);
    for (const [sx, a] of [[-190, -0.9], [-176, -0.5], [-196, 0.6]]) inkAt(sx, -66, a, P2('M-4,0 L0,-26 L4,0 Z'), '#fff4dc', 1);
    inkRect(-80, -60, 28, 60, CD, 2.5, 10); inkRect(36, -60, 28, 60, CD, 2.5, 10);
    // plates (springy: they squash when she lands)
    for (let lx = -90; lx <= 90; lx += 30) {
      const by = ellTop(lx, 0, -85, 110, 50) + 10, h = stegoPlate(lx) - p.sqY * 0.6;
      ink(P2(`M${lx - 17},${by} Q${lx - 19},${by - h * 0.6} ${lx},${by - h - 8} Q${lx + 19},${by - h * 0.6} ${lx + 17},${by} Z`), vgradL(by - h, by, '#ffb0a0', PL), 1.2);
    }
    inkEllipse(0, -85, 110, 50, 0, vgradL(-135, -35, '#ffd28a', C), 1.3);
    ctx.fillStyle = '#ffe6b8'; ellipse(10, -54, 80, 16);
    spots([[-50, -100, 8], [-14, -110, 6], [30, -104, 8], [64, -88, 6]], 'rgba(180,100,30,.3)');
    inkRect(-104, -55, 30, 57, C, 2.5, 10); inkRect(56, -55, 30, 57, C, 2.5, 10);
    inkEllipse(118, -62, 28, 18, 0.2, C, 1.2);
    eye(124, -68, 5.5, blinking(p.ph)); smile(136, -56, 6); blush(128, -56, 4);
    ctx.restore();
  }
  function drawTrike(p) {
    const C = '#9fd06a', CD = '#7fb04e', FR = '#ffcf5a';
    ctx.save(); ctx.translate(p.x, p.base); ctx.scale(p.dir, 1);
    const st = S.t * 3 + p.ph, lift = i => Math.max(0, Math.sin(st + i * Math.PI)) * 7;
    ink(P2('M-84,-86 C-120,-84 -150,-66 -170,-44 C-140,-52 -116,-56 -86,-60 Z'), C, 1.3);
    inkRect(-66, -55 - lift(1), 26, 55, CD, 2.5, 10); inkRect(30, -55 - lift(0), 26, 55, CD, 2.5, 10);
    inkEllipse(0, -80, 92, 46, 0, vgradL(-126, -34, '#c0e890', C), 1.3);
    ctx.fillStyle = '#e4f6c8'; ellipse(10, -52, 64, 14);
    spots([[-40, -100, 8], [-6, -108, 6], [30, -100, 7]], 'rgba(60,120,40,.3)');
    inkRect(-84, -50 - lift(0), 28, 52, C, 2.5, 10); inkRect(48, -50 - lift(1), 28, 52, C, 2.5, 10);
    // frill, head and three horns
    for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.95 + i * Math.PI * 0.95 / 8; inkCircle(92 + Math.cos(a) * 44, -100 + Math.sin(a) * 44, 8, '#ff9f5a', 1); }
    inkCircle(92, -100, 44, FR, 1.3);
    ctx.fillStyle = '#ff9f5a'; for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.9 + i * 0.4; circle(92 + Math.cos(a) * 30, -100 + Math.sin(a) * 30, 5); }
    inkAt(108, -96, 0.75, P2('M-6,0 L0,-46 L6,0 Z'), '#fff4dc', 1);
    inkAt(132, -90, 0.65, P2('M-5,0 L0,-40 L5,0 Z'), '#fff4dc', 1);
    inkEllipse(122, -72, 36, 26, 0.15, C, 1.3);
    inkAt(156, -82, 0.4, P2('M-5,0 L0,-18 L5,0 Z'), '#fff4dc', 1);
    ink(P2('M150,-70 Q166,-64 160,-50 Q150,-52 144,-58 Z'), '#e8c890', 1);
    eye(124, -82, 6, blinking(p.ph)); smile(138, -58, 7); blush(126, -62, 5);
    ctx.restore();
  }
  function drawAnkylo(p) {
    const C = '#c2a27e', CD = '#9a7c5a', AR = '#8e7556';
    ctx.save(); ctx.translate(p.x, p.base);
    // the rock pillar he sleeps on
    ink(P2('M-110,0 L110,0 L128,30 L146,320 L-150,320 L-126,30 Z'), vgradL(0, 300, '#d88a58', '#8a4a38'), 1.3);
    ctx.strokeStyle = 'rgba(120,50,30,.35)'; ctx.lineWidth = 3;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-118 - i * 5, i * 40); ctx.lineTo(118 + i * 5, i * 40 + (i % 2 ? 6 : -4)); ctx.stroke(); }
    ctx.fillStyle = '#7fc86a'; ellipse(-60, 2, 40, 6); ellipse(70, 2, 34, 5);
    ctx.translate(0, p.breath);
    tube(bez([-90, -30], [-130, -36], [-168, -22], 8), 14, C);
    inkEllipse(-180, -22, 20, 15, 0, AR, 1.2);
    for (const lx of [-70, -30, 30, 66]) inkRect(lx - 12, -20, 24, 20, CD, 2.2, 6);
    for (let i = 0; i < 9; i++) { const lx = -88 + i * 22; inkAt(lx, -12 - Math.sqrt(Math.max(0, 1 - (lx / 100) ** 2)) * 4, 0, P2('M-7,0 L0,14 L7,0 Z'), '#fff4dc', 0.9); }
    inkEllipse(0, -38, 100, 34, 0, vgradL(-72, -4, '#dcc0a0', C), 1.3);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 7 - row; i++) {
      const lx = -66 + row * 11 + i * 22, ty = ellTop(lx, 0, -38, 100, 34) + 9 + row * 12;
      inkCircle(lx, ty, 6.5, AR, 0.8); ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(lx - 2, ty - 2, 2);
    }
    inkEllipse(108, -26, 26, 17, 0.15, C, 1.2);
    const asleep = p.awake <= 0;
    eye(114, -32, 5.5, asleep || blinking(p.ph)); smile(126, -20, 6); blush(116, -20, 4);
    if (asleep) for (let i = 0; i < 3; i++) { const zt = (S.t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - zt; outlined('z', 126 + zt * 30 + i * 4, -50 - zt * 50, 14 + i * 4, '#ffffff'); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  function drawPtera(x, y, flap, sc = 1, mood = 'happy') {
    const C = '#ffb48f', W1 = '#ff9f80';
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const f = Math.sin(flap) * 36;
    ctx.strokeStyle = OL; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 12); ctx.lineTo(-16, 24); ctx.moveTo(6, 12); ctx.lineTo(2, 24); ctx.stroke();
    for (const s of [-1, 1]) ink(P2(`M${s * 14},-8 Q${s * 70},${-46 - f} ${s * 160},${-14 - f * 1.2} Q${s * 96},${-2 - f * 0.3} ${s * 20},10 Z`), vgradL(-50 - f, 10, '#ffd0b8', W1), 1.2);
    inkEllipse(0, 0, 46, 15, 0, C, 1.3);
    ink(P2('M40,-20 L8,-46 L34,-12 Z'), '#ff7f8a', 1);
    inkEllipse(50, -14, 18, 13, 0, C, 1.2);
    ink(P2('M62,-20 L106,-8 L62,-6 Z'), '#ffe08a', 1);
    eye(52, -18, 4.5, mood !== 'worried' && blinking(x * 0.01));
    blush(56, -8, 3.5);
    ctx.restore();
  }
  function drawHadro(p) {
    const C = '#a798f2', CR = '#ff8fc8', T = -p.top;
    ctx.save(); ctx.translate(p.x, p.base);
    inkEllipse(-56, 8, 74, 28, 0, mix(C, '#6a5aa8', 0.3), 1.2);
    tube(bez([-30, 4], [-24, T * 0.5], [-8, T + 30], 8), 30, C);
    tube(bez([-16, T + 6], [-44, T - 4], [-74, T - 22], 6), 13, CR);
    inkEllipse(0, T + 18, 40, 20, 0, vgradL(T, T + 38, '#c8bcff', C), 1.3);
    ink(P2(`M30,${T + 8} Q58,${T + 6} 64,${T + 16} Q60,${T + 30} 30,${T + 30} Z`), '#ffd27a', 1.1);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-8, T + 6, 16, 5);
    eye(14, T + 12, 5.5, blinking(p.ph)); blush(22, T + 24, 4);
    ctx.restore();
  }
  function drawGround(p) {
    const x0 = p.x + p.L, x1 = p.x + p.R, y = p.base;
    ctx.fillStyle = vgradL(y, H + 40, '#8ad46a', '#5aa64a');
    ctx.beginPath(); ctx.moveTo(x0, H + 200); ctx.lineTo(x0, y + 24); ctx.quadraticCurveTo(x0, y, x0 + 24, y); ctx.lineTo(x1 - 24, y); ctx.quadraticCurveTo(x1, y, x1, y + 24); ctx.lineTo(x1, H + 200); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(120,80,40,.25)'; ctx.fillRect(x0 + 2, y + 34, x1 - x0 - 4, 6);
    for (let gx = x0 + 14; gx < x1 - 10; gx += 26) { ctx.strokeStyle = '#4f9a3e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, y + 2); ctx.lineTo(gx - 3, y - 6); ctx.moveTo(gx + 4, y + 2); ctx.lineTo(gx + 6, y - 7); ctx.stroke(); }
  }
  const DRAW = { longneck: drawLongneck, plesio: drawPlesio, stego: drawStego, trike: drawTrike, ankylo: drawAnkylo, hadro: drawHadro,
    ptera: p => drawPtera(p.x, p.base, p.flap, 1), ground: drawGround, home: drawGround };

  // --- the landscape ------------------------------------------------------------------------
  function backdrop(g) {
    const cx = g.camX + W / 2, zi = zoneAt(cx), z = ZONES[zi], nz = ZONES[zi + 1] || z;
    const k = clamp((cx - (nz.x - 400)) / 400, 0, 1);
    const c = key => [mix(z[key][0], nz[key][0], k), mix(z[key][1], nz[key][1], k)];
    const [s0, s1] = c('sky');
    ctx.fillStyle = vgradL(0, H, s0, s1); ctx.fillRect(0, 0, W, H);
    glow(800, 120, 120, '255,240,180', 0.7); inkCircle(800, 120, 36, '#ffe066', 2);
    // far mountains with a gently smoking volcano
    const far = mix(z.far, nz.far, k), off = g.camX * 0.1;
    for (let i = -1; i < 4; i++) {
      const mx = i * 420 - (off % 420);
      ctx.fillStyle = far; ctx.beginPath(); ctx.moveTo(mx - 60, 400);
      ctx.lineTo(mx + 80, 250 + (i & 1) * 30); ctx.lineTo(mx + 140, 300); ctx.lineTo(mx + 220, 230 + ((i + 1) & 1) * 40); ctx.lineTo(mx + 380, 400); ctx.fill();
      if (((i + Math.floor(off / 420)) % 3 + 3) % 3 === 1) {
        ctx.fillStyle = mix(far, '#6a4a5a', 0.3); ctx.beginPath(); ctx.moveTo(mx + 120, 400); ctx.lineTo(mx + 200, 196); ctx.lineTo(mx + 236, 196); ctx.lineTo(mx + 330, 400); ctx.fill();
        ctx.fillStyle = '#ff9a5a'; ctx.fillRect(mx + 204, 196, 28, 6);
        for (let j = 0; j < 4; j++) { const st = (S.t * 0.25 + j / 4) % 1; ctx.fillStyle = `rgba(240,230,235,${0.5 * (1 - st)})`; circle(mx + 218 + st * 40, 186 - st * 110, 12 + st * 22); }
      }
    }
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 5; i++) { const x = ((i * 260 - g.camX * 0.18 + S.t * 6) % (W + 260) + W + 260) % (W + 260) - 130, y = 78 + (i % 3) * 36; ellipse(x, y, 52, 18); ellipse(x + 30, y - 10, 36, 20); ellipse(x - 30, y + 3, 30, 14); }
    // far-off pterosaurs gliding
    ctx.strokeStyle = 'rgba(80,60,90,.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const x = ((i * 380 + S.t * 30 - g.camX * 0.25) % 1200 + 1200) % 1200 - 120, y = 120 + i * 30 + Math.sin(S.t + i) * 8, f = Math.sin(S.t * 4 + i) * 5; ctx.beginPath(); ctx.moveTo(x - 16, y - f); ctx.quadraticCurveTo(x - 6, y - 6, x, y); ctx.quadraticCurveTo(x + 6, y - 6, x + 16, y - f); ctx.stroke(); }
    // mid hills with palms and cycads
    const mid = mix(z.mid, nz.mid, k), o2 = g.camX * 0.35;
    ctx.fillStyle = mix(mid, '#ffffff', 0.25); ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 380 - Math.sin((x + o2) * 0.006) * 34 - Math.sin((x + o2) * 0.013) * 14);
    ctx.lineTo(W, H); ctx.fill();
    for (let i = -1; i < 7; i++) {
      const bx = i * 170 - (o2 % 170), n = i + Math.floor(o2 / 170), hy = 380 - Math.sin((bx + o2) * 0.006) * 34 - Math.sin((bx + o2) * 0.013) * 14;
      if (n % 2) palm(bx + 40, hy + 6, 70 + (n % 3) * 18, mix(mid, '#2f7a40', 0.35), (n % 3 - 1) * 12);
      else fern(bx + 60, hy + 8, 34, mix(mid, '#2f7a40', 0.25));
    }
  }
  // what's under the dinosaurs: water, tar, a canyon or swamp. back = before the dinos, front = after (so their legs wade)
  function hazards(g, front) {
    const l = g.camX - 40, r = g.camX + W + 40;
    for (let zi = 1; zi <= 4; zi++) {
      const z = ZONES[zi], x0 = Math.max(l, z.x), x1 = Math.min(r, ZONES[zi + 1].x);
      if (x1 <= x0) continue;
      const y = z.haz;
      if (z.id === 'river' || z.id === 'swamp') {
        const sw = z.id === 'swamp';
        if (!front) {
          ctx.fillStyle = vgradL(y, H, sw ? '#6aa88a' : '#4fb8e8', sw ? '#3a7060' : '#2a7ac0'); ctx.fillRect(x0, y, x1 - x0, H - y + 200);
        } else {
          ctx.fillStyle = sw ? 'rgba(90,150,110,.62)' : 'rgba(80,180,240,.55)';
          ctx.beginPath(); ctx.moveTo(x0, H + 200);
          for (let x = x0; x <= x1; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.04 + S.t * 2) * 3);
          ctx.lineTo(x1, H + 200); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
          for (let x = Math.ceil(x0 / 90) * 90; x < x1; x += 90) { const wy = y + 22 + (x * 7 % 50), wx = x + Math.sin(S.t + x) * 10; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 24, wy); ctx.stroke(); }
          if (sw) { // lily pads, cattails and drifting mist
            for (let x = Math.ceil(x0 / 130) * 130; x < x1; x += 130) { const px = x + 40, py = y + 16 + (x % 3) * 12; inkEllipse(px, py, 22, 7, 0, '#6ac86a', 1); if (x % 260 === 0) flower(px + 6, py - 4, 6, '#ff9ac8', '#ffd84a', 1); }
            for (let i = 0; i < 8; i++) { const mx = 4740 + (i * 330 + S.t * 14) % 940; if (mx > x0 - 120 && mx < x1 + 120) { ctx.fillStyle = 'rgba(255,255,255,.22)'; ellipse(mx, y - 30 - (i % 2) * 40, Math.min(120, mx - 4740, 5680 - mx), 22); } }
          } else {
            for (let x = Math.ceil(x0 / 170) * 170; x < x1; x += 170) { const fy = (S.t * 0.7 + x * 0.013) % 3; if (fy < 0.6) { const k = fy / 0.6, fx = x + k * 50, fyy = y - Math.sin(k * Math.PI) * 40; inkEllipse(fx, fyy, 10, 5, -Math.cos(k * Math.PI) * 0.8, '#ffa040', 0.8); } }
          }
        }
      } else if (z.id === 'tar') {
        if (!front) { ctx.fillStyle = vgradL(y, H, '#3a2c48', '#1e1628'); ctx.fillRect(x0, y, x1 - x0, H - y + 200); }
        else {
          ctx.fillStyle = 'rgba(40,28,54,.86)'; ctx.fillRect(x0, y, x1 - x0, H - y + 200);
          ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3;
          for (let x = Math.ceil(x0 / 110) * 110; x < x1; x += 110) { ctx.beginPath(); ctx.ellipse(x + 30, y + 30 + (x % 40), 30, 4, 0, Math.PI, Math.PI * 2); ctx.stroke(); }
          for (let x = Math.ceil(x0 / 75) * 75; x < x1; x += 75) { // bubbles that swell and pop
            const bt = (S.t * 0.6 + x * 0.37) % 2; if (bt > 1) continue;
            const bx = x + 20, by = y + 8 + (x % 30), r = 4 + bt * 14;
            ctx.strokeStyle = 'rgba(160,130,200,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, r, Math.PI, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.4)'; circle(bx - r * 0.4, by - r * 0.6, 2);
          }
          for (let x = Math.ceil(x0 / 400) * 400 + 120; x < x1; x += 400) { ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x + 18, y - 10); ctx.stroke(); ctx.fillStyle = '#fff4e0'; circle(x + 20, y - 13, 5); circle(x + 14, y - 15, 4); }
        }
      } else if (z.id === 'canyon' && !front) {
        ctx.fillStyle = vgradL(420, H + 100, '#b8603a', '#3a1a28'); ctx.fillRect(x0, 420, x1 - x0, H);
        ctx.fillStyle = 'rgba(255,200,150,.18)'; for (let i = 0; i < 4; i++) ctx.fillRect(x0, 450 + i * 22, x1 - x0, 6);
        ctx.fillStyle = 'rgba(255,240,220,.25)'; for (let x = Math.ceil(x0 / 260) * 260; x < x1; x += 260) ellipse(x + Math.sin(S.t * 0.3 + x) * 30, 470, 110, 16);
      }
    }
    if (front) return;
    // rocky edges where one place turns into the next
    for (const bx of [1990, 3450, 4740]) {
      if (bx < l - 100 || bx > r + 100) continue;
      ink(P2(`M${bx - 70},${H + 40} L${bx - 60},440 Q${bx - 40},418 ${bx - 10},424 Q${bx + 20},410 ${bx + 50},428 L${bx + 70},${H + 40} Z`), vgradL(410, H, '#c08a6a', '#7a4a3a'), 1.3);
      ctx.fillStyle = '#7fc86a'; ellipse(bx - 20, 424, 26, 5);
    }
  }
  // the view from the lookout: the valley far below, a twisty jungle canyon, and Mama and Papa's nest on the far hill
  function farParent(x, y, sc, col, pop, open) {
    ctx.save(); ctx.translate(x, y + (1 - pop) * 60); ctx.scale(-sc, sc);
    tube(bez([-30, 120], [-40, 60], [0, 20], 8), 70, col);
    for (const [px, py, h] of [[-58, 60, 34], [-50, 18, 40], [-34, -24, 34]]) inkAt(px, py, -0.6, P2(`M-16,6 Q-17,${-h * 0.5} 0,${-h} Q17,${-h * 0.5} 16,6 Z`), CORAL, 1.4);
    inkEllipse(30, -10, 76, 58, 0.1, vgradL(-70, 50, mix(col, '#ffffff', 0.25), col), 1.6);
    ctx.fillStyle = CREAM; ellipse(64, 24, 40, 18);
    eye(30, -24, 15, blinking(2)); eye(70, -26, 13, blinking(2));
    smile(68, 22, 16, open); blush(18, 6, 10);
    ctx.restore();
  }
  function vista(g) {
    const t = S.t, x0 = 6150, x1 = 6780;
    // the valley floor far below, hazy with distance
    ctx.fillStyle = vgradL(370, H, '#b8e0b0', '#7cb88a'); ctx.fillRect(x0, 380, x1 - x0, H);
    // the far hill, with Mama and Papa popping up behind their nest
    const mu = g.mama;
    if (mu > 0) { farParent(6640, 300, 0.36, '#6fc0a0', clamp(mu * 1.3 - 0.3, 0, 1), false); farParent(6580, 296, 0.3, MINT, mu, mu > 0.6); }
    ctx.fillStyle = vgradL(300, 420, '#a8d890', '#78b870'); ctx.beginPath(); ctx.ellipse(6620, 400, 190, 96, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#a07040'; ellipse(6605, 312, 34, 10); ctx.fillStyle = '#7a5030'; ellipse(6605, 308, 24, 5);
    ctx.strokeStyle = '#c89058'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(6578 + i * 10, 306); ctx.lineTo(6586 + i * 10, 318); ctx.stroke(); }
    // the twisty jungle canyon in between: a winding trail through thick bushes (the maze comes next)
    ctx.fillStyle = '#4f9a5a';
    for (let i = 0; i < 16; i++) { const bx = 6190 + i * 34, by = 392 + (i % 3) * 14; circle(bx, by, 26); }
    ctx.strokeStyle = '#e8c890'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(6215, 440); for (let i = 1; i <= 8; i++) ctx.lineTo(6215 + i * 44, i % 2 ? 392 : 430); ctx.lineTo(6590, 330); ctx.stroke();
    ctx.fillStyle = '#3f8a4c';
    for (let i = 0; i < 14; i++) { const bx = 6200 + i * 38, by = 430 + (i % 2) * 18; circle(bx, by, 22); }
    for (let i = 0; i < 4; i++) palm(6230 + i * 120, 410 + (i % 2) * 14, 60 + (i % 2) * 20, '#3f8a4c', (i % 2 ? 8 : -8));
    // sneaky dinos rustling in the bushes, eyes peeking out
    const ru = g.rustle;
    if (ru > 0) {
      for (const [bx, by, ph] of [[6262, 404, 0], [6380, 420, 1.3], [6470, 398, 2.4]]) {
        const sh = Math.sin(t * 30 + ph) * 3 * (1 - Math.min(1, ru * 0.8)) + Math.sin(t * 9 + ph) * 1.5;
        ctx.fillStyle = '#2f7a40'; circle(bx + sh, by, 24); circle(bx + 18 + sh, by + 6, 18); circle(bx - 18 + sh, by + 6, 18);
        if (ru > 0.35) {
          const op = (S.t + ph) % 3 > 0.15 ? 1 : 0.1;
          for (const ex of [-7, 7]) { ctx.fillStyle = `rgba(255,230,60,${op})`; ellipse(bx + ex + sh, by - 2, 5, 3.5); ctx.fillStyle = `rgba(30,10,20,${op})`; ellipse(bx + ex + sh + 1, by - 2, 1.4, 3); }
          ctx.strokeStyle = `rgba(30,10,20,${op})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 13 + sh, by - 9); ctx.lineTo(bx - 3 + sh, by - 6); ctx.moveTo(bx + 13 + sh, by - 9); ctx.lineTo(bx + 3 + sh, by - 6); ctx.stroke();
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
  function lookout() {
    ink(P2('M6050,424 Q6056,396 6090,392 Q6150,388 6178,400 Q6196,410 6200,424 Z'), vgradL(388, 424, '#d8b890', '#a88a68'), 1.3);
    ctx.fillStyle = '#7fc86a'; ellipse(6070, 396, 16, 4);
  }

  // --- Aubrey with the baby dino on her back --------------------------------------------------
  // where he sits for each of her poses (in her own coords, facing right; his origin is at his feet)
  const CARRY = { idle_front: { x: -6, y: -60, s: 0.22, f: -1, hands: [[-11, -80], [10, -81]] }, twirl: { x: -5, y: -64, s: 0.22, f: -1, hands: [[-11, -84], [12, -85]] } };
  function drawCarry(g, x, y, frame, mood, alpha = 1) {
    const a = g.a, d = CARRY[frame];
    ctx.save(); ctx.translate(x, y); ctx.scale(a.facing, 1); ctx.globalAlpha = alpha;
    if (a.wob > 0) { const w = Math.sin(a.wob * 22) * 0.18 * a.wob; ctx.translate(0, -30); ctx.rotate(w); ctx.translate(0, 30); }
    const c = a.charging ? a.charge : 0, ld = a.land / 0.15;
    ctx.scale(1 + c * 0.08 + ld * 0.1, 1 - c * 0.14 - ld * 0.12);
    if (!d.front) baby(d.x, d.y, d.s, { mood, facing: d.f, ph: 0.5 });
    drawAubrey(0, 0, frame, 1, 0, SC);
    if (d.front) baby(d.x, d.y, d.s, { mood, facing: d.f, ph: 0.5 });
    // his little hands holding on over her shoulders
    for (const [hx, hy] of d.hands) { inkEllipse(hx, hy, 3.6, 2.8, 0, MINT, 0.8); ctx.strokeStyle = '#3f6e4e'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx - 1.2, hy + 0.5); ctx.lineTo(hx - 1.2, hy + 2.8); ctx.moveTo(hx + 1.2, hy + 0.5); ctx.lineTo(hx + 1.2, hy + 2.8); ctx.stroke(); }
    ctx.restore();
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
      backdrop(g);
      ctx.save(); ctx.translate(-Math.round(g.camX), -Math.round(g.camY));
      hazards(g, false);
      if (g.camX + W > 5600) vista(g);
      for (const p of g.plats) { if (p.x + p.R + 320 < g.camX || p.x + p.L - 320 > g.camX + W) continue; DRAW[p.kind](p); }
      if (g.camX + W > 5600) lookout();
      // the aiming arc while she powers up
      let aim = null;
      if (g.state === 'play' && a.on && a.charging) {
        aim = predict(g, a.charge);
        aim.dots.forEach(([x, y], i) => { ctx.globalAlpha = 0.35 + 0.65 * (i / aim.dots.length); ctx.fillStyle = aim.p ? '#ffffff' : '#ffe0e0'; circle(x, y, 4); });
        ctx.globalAlpha = 1;
        if (aim.p) { ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(aim.x, aim.y, 26, 8, 0, 0, Math.PI * 2); ctx.stroke(); star(aim.x, aim.y - 22, 9 + Math.sin(t * 8) * 2, '#fff6a8', 4); }
      }
      // Aubrey and the baby dino, who rides on her back all the way
      const frame = a.on ? 'idle_front' : 'twirl';
      drawCarry(g, a.x, a.y + 2, g.state === 'rescue' ? 'twirl' : frame, g.mood);
      if (g.state === 'rescue') { // Petra holds them up by Aubrey's hands
        const r = g.res, px = r.t < 0.6 ? lerp(a.x + 380, a.x, ss(r.t / 0.6)) : a.x, py = r.t < 0.6 ? lerp(a.y - 420, a.y - 150, ss(r.t / 0.6)) : a.y - 150;
        if (r.t > 0.5) { ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 6, py + 14); ctx.lineTo(a.x - 4, a.y - 112); ctx.stroke(); }
        drawPtera(px, py, t * 14, 0.75);
      }
      hazards(g, true);
      ctx.restore();
      drawFx(false);
      // power meter over her head
      if (g.state === 'play' && a.on && a.charging) {
        const sx = a.x - g.camX, sy = a.y - g.camY - 150;
        darkPanel(sx - 42, sy - 9, 84, 18, 9);
        rrect(sx - 38, sy - 5, Math.max(10, 76 * a.charge), 10, 5, mix('#7dff9a', '#ff6fb5', a.charge));
        if (a.charge >= 1) outlined('Full power!', sx, sy - 22, 16, '#fff6a8');
      }
      // the map of the journey home
      const mx0 = W / 2 - 200, mx1 = W / 2 + 170;
      darkPanel(mx0 - 40, 10, mx1 - mx0 + 96, 44, 20);
      const toX = x => mx0 + clamp(x / NEST, 0, 1) * (mx1 - mx0);
      const ZC = ['#8ad46a', '#4fb8e8', '#5a4a6a', '#d8784a', '#5aa878', '#ffa8c8'];
      for (let i = 0; i < ZONES.length - 1; i++) rrect(toX(Math.max(0, ZONES[i].x)), 28, toX(ZONES[i + 1].x) - toX(Math.max(0, ZONES[i].x)) + 2, 10, 5, ZC[i]);
      for (let i = 1; i < 5; i++) emoji(ZONES[i].icon, (toX(ZONES[i].x) + toX(ZONES[i + 1].x)) / 2, 22, 13);
      emoji('🪺', mx1 + 22, 32, 24); emoji('🦕', mx1 + 46, 28, 20);
      const ax = toX(a.x);
      ctx.save(); ctx.beginPath(); ctx.arc(ax, 33, 13, 0, Math.PI * 2); ctx.closePath(); ctx.fillStyle = '#ffd8e8'; ctx.fill(); ctx.clip();
      if (IMG.face_happy) ctx.drawImage(IMG.face_happy, ax - 14, 33 - 15, 28, 31);
      ctx.restore(); ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, 33, 13, 0, Math.PI * 2); ctx.stroke();
      // walk buttons for touch screens
      if (g.state === 'play') for (const [r, s] of [[WALK_L, '◀'], [WALK_R, '▶']]) { rrect(r.x, r.y, r.w, r.h, 16, pointer.down && inRect(r) ? 'rgba(255,111,181,.85)' : 'rgba(48,24,72,.55)', 'rgba(255,255,255,.8)', 2.5); text(s, r.x + r.w / 2, r.y + r.h / 2 + 1, 26, '#fff', 'center', 700); }
      // a banner for each new part of the journey
      if (g.banner > 0 && !dlg && ZONES[g.zone].name) {
        const z = ZONES[g.zone], age = 3.2 - g.banner, drop = age < 0.4 ? 1 - (1 - age / 0.4) ** 3 : 1, out = g.banner < 0.4 ? g.banner / 0.4 : 1;
        ctx.globalAlpha = out; ctx.save(); ctx.translate(W / 2, H + 60 - drop * 134);
        panel(-220, -38, 440, 84, 24); emoji(z.icon, -180, 4, 40); emoji(z.icon, 180, 4, 40);
        outlined(z.name, 0, -6, 30, '#3fae6a', 'center', '#fff'); text(z.tip, 0, 26, 17, '#7a5a9a', 'center', 700);
        ctx.restore(); ctx.globalAlpha = 1;
      }
      // a dino fact card
      if (g.fact && g.banner <= 0 && !dlg && g.state === 'play') {
        const f = g.fact, al = clamp(f.t / 0.4, 0, 1) * clamp((6 - f.t) / 0.3, 0, 1), lines = wrap(f.text, 470, 16);
        const h = 34 + lines.length * 20, y0 = H - 16 - h;
        ctx.globalAlpha = al; panel(W / 2 - 300, y0, 600, h, 18);
        emoji(f.icon, W / 2 - 262, y0 + h / 2, 36);
        text(`Dino fact: ${f.name}`, W / 2 - 222, y0 + 18, 17, '#3fae6a', 'left', 700);
        lines.forEach((l, i) => text(l, W / 2 - 222, y0 + 40 + i * 20, 16, '#5a3a7a', 'left', 500));
        ctx.globalAlpha = 1;
      }
      if (g.state === 'play' && g.jumps === 0 && !dlg) {
        outlined('Hold SPACE (or press and hold) to power up,', W / 2, 108, 24, '#fff6a8');
        outlined('then let go to HOP!', W / 2, 140, 24, '#fff6a8');
        outlined('← → walk', W / 2, 172, 18, '#ffffff');
      }
      if (g.state === 'home' && g.spotT > 0.4 && !dlg) {
        const uh = g.spotT > 3.2;
        panel(W / 2 - 220, 70, 440, 56, 22);
        outlined(uh ? 'Uh-oh... who\u2019s that?' : 'We can see your mama!', W / 2, 98, 28, uh ? '#a05ad8' : '#ff6fb5', 'center', '#fff');
      }
    },
  };
}
