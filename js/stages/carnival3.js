'use strict';
// Carnival game 2: Carnival Design. Round 1 lines decorated animals up on the carousel in
// ordinal order; round 2 is a free-design circus ring that runs a little show on her layout.
{
  const ORDW = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  const ORDS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

  // carousel animals: all emoji face left. h/b/t = head, back and tail anchors (in emoji-size units)
  const CA = [
    { e: '🐎', n: 'horse', h: [-0.34, -0.3], b: [0.02, -0.12], t: [0.36, -0.2] },
    { e: '🦢', n: 'swan', h: [-0.3, -0.36], b: [0.1, -0.06], t: [0.4, -0.08] },
    { e: '🐅', n: 'tiger', h: [-0.36, -0.12], b: [0.04, -0.16], t: [0.42, -0.06] },
    { e: '🦒', n: 'giraffe', h: [-0.16, -0.4], b: [0.12, -0.04], t: [0.36, 0.0] },
    { e: '🐘', n: 'elephant', h: [-0.26, -0.22], b: [0.08, -0.24], t: [0.38, -0.08] },
    { e: '🦓', n: 'zebra', h: [-0.34, -0.3], b: [0.06, -0.1], t: [0.38, -0.08] },
    { e: '🐖', n: 'pig', h: [-0.34, -0.12], b: [0.02, -0.18], t: [0.4, -0.14] },
    { e: '🐇', n: 'bunny', h: [-0.14, -0.3], b: [0.16, -0.06], t: [0.36, 0.14] },
    { e: '🐓', n: 'rooster', h: [-0.2, -0.34], b: [0.08, -0.08], t: [0.34, -0.24] },
    { e: '🐫', n: 'camel', h: [-0.38, -0.2], b: [0.02, -0.24], t: [0.4, -0.06] },
    { e: '🦌', n: 'deer', h: [-0.24, -0.34], b: [0.08, -0.06], t: [0.38, -0.06] },
    { e: '🐈', n: 'cat', h: [-0.3, -0.24], b: [0.04, -0.1], t: [0.36, -0.3] },
  ];
  const DECO = [
    { k: 'color', v: '#ff6fbf', n: 'pink' }, { k: 'color', v: '#4fb2ff', n: 'blue' },
    { k: 'color', v: '#ffc21f', n: 'gold' }, { k: 'color', v: '#3fd49a', n: 'mint' },
    { k: 'color', v: '#a374ff', n: 'purple' }, { k: 'color', v: 'rainbow', n: 'rainbow' },
    { k: 'pattern', v: 'spots', n: 'spots' }, { k: 'pattern', v: 'stripes', n: 'stripes' },
    { k: 'pattern', v: 'stars', n: 'stars' }, { k: 'pattern', v: 'hearts', n: 'hearts' },
    { k: 'acc', v: 'saddle', n: 'saddle' }, { k: 'acc', v: 'bow', n: 'bow' },
    { k: 'acc', v: 'flower', n: 'flowers' }, { k: 'acc', v: 'plume', n: 'plume' },
    { k: 'acc', v: 'ribbon', n: 'ribbons' }, { k: 'acc', v: 'jewel', n: 'jewel' },
  ];
  const RAINBOW = ['#ff5a5a', '#ffa53a', '#ffe13a', '#4fd36a', '#4fa8ff', '#a26bff'];

  // ---------------------------------------------------------------- shared little art bits
  const topHat = (x, y, s) => { // (x, y) = where the brim sits on her head
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.12);
    ink(P2('M-20,0 Q0,7 20,0 Q22,-5 14,-5 L-14,-5 Q-22,-5 -20,0 Z'), '#2a1a3a', 1.2);
    ink(P2('M-12,-4 L-14,-34 Q0,-38 14,-34 L12,-4 Z'), '#2a1a3a', 1.2);
    ctx.fillStyle = '#ff3f6c'; ctx.fillRect(-13, -12, 26, 6);
    star(8, -9, 4, '#ffd83a', 5);
    ctx.restore();
  };
  const ringmaster = (x, gy, s, frame = 'idle_front') => {
    drawAubrey(x, gy, frame, 1, 0, s);
    // brim perched on the crown of her hair, small enough that her face still shows
    // (her head from the photo: heroHead in js/hero.js)
    if (frame === 'idle_front') { const im = IMG.idle_front, hd = heroHead('idle_front'); topHat(x + (hd.cx + 2 - im.width / 2) * s, gy - (im.height - hd.top - 10) * s, s / 0.5 * 0.5 * clamp(hd.r / 23.6, 0.8, 1.1)); }
  };
  const lights = (pts, t, r = 4) => pts.forEach(([x, y], i) => {
    const on = (Math.floor(t * 3) + i) % 3 !== 0;
    const col = ['#fff3a0', '#ffb3e0', '#a8e6ff'][i % 3];
    if (on) { ctx.fillStyle = 'rgba(255,240,180,.35)'; circle(x, y, r * 2.4); }
    ctx.fillStyle = on ? col : mix(col, '#555566', 0.5); circle(x, y, r);
  });
  const calliope = (bars = 2) => {
    const mel = [523, 659, 784, 659, 698, 880, 1047, 880, 784, 659, 523, 659, 587, 698, 784, 0, 784, 659, 523, 587, 659, 523, 440, 523, 587, 494, 392, 494, 523, 0, 523, 0];
    for (let b = 0; b < bars; b++) mel.forEach((f, i) => {
      const w = (b * mel.length + i) * 0.19;
      if (f) { tone(f, 0.17, 'triangle', 0.06, w); tone(f * 2, 0.1, 'sine', 0.02, w); }
      if (i % 3 === 0) tone(131 + (i % 6 === 0 ? 0 : 65), 0.16, 'triangle', 0.06, w);
    });
  };
  const applause = (n = 26, when = 0) => { for (let i = 0; i < n; i++) noise(0.05, 0.03 + Math.random() * 0.03, when + i * 0.07 + Math.random() * 0.05); };

  // ---------------------------------------------------------------- carousel animal art
  const sprites = new Map();
  const SPR = 160, EMS = 100; // sprite canvas size; emoji size drawn inside it
  function patternFill(x, pat, col) {
    x.fillStyle = col;
    if (pat === 'spots') for (let i = 0; i < 26; i++) { x.beginPath(); x.arc((i * 37) % SPR, (i * 61) % SPR, 6 + (i % 3) * 2, 0, Math.PI * 2); x.fill(); }
    if (pat === 'stripes') { x.save(); x.translate(SPR / 2, SPR / 2); x.rotate(0.5); for (let k = -SPR; k < SPR; k += 18) x.fillRect(k, -SPR, 8, SPR * 2); x.restore(); }
    if (pat === 'stars' || pat === 'hearts') for (let i = 0; i < 18; i++) {
      const px = 14 + (i * 41) % (SPR - 20), py = 14 + (i * 67) % (SPR - 20);
      x.beginPath();
      if (pat === 'stars') for (let j = 0; j < 10; j++) { const r = j % 2 ? 4 : 10, a = j * Math.PI / 5 - Math.PI / 2; x.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); }
      else { x.moveTo(px, py + 8); x.bezierCurveTo(px - 12, py - 2, px - 6, py - 10, px, py - 3); x.bezierCurveTo(px + 6, py - 10, px + 12, py - 2, px, py + 8); }
      x.fill();
    }
  }
  function animalSprite(a, col, pat) {
    const key = `${a.e}|${col}|${pat}`;
    if (sprites.has(key)) return sprites.get(key);
    const c = document.createElement('canvas'); c.width = c.height = SPR;
    const x = c.getContext('2d');
    const base = () => { x.font = `${EMS}px ${EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#000'; x.fillText(a.e, SPR / 2, SPR / 2 + EMS * 0.05); };
    base();
    if (col) {
      let fill = col;
      if (col === 'rainbow') { fill = x.createLinearGradient(SPR * 0.2, 0, SPR * 0.8, 0); RAINBOW.forEach((r, i) => fill.addColorStop(i / 5, r)); }
      x.globalCompositeOperation = 'color'; x.fillStyle = fill; x.fillRect(0, 0, SPR, SPR);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.28; x.fillStyle = fill; x.fillRect(0, 0, SPR, SPR); x.globalAlpha = 1;
      x.globalCompositeOperation = 'destination-in'; base();
    }
    if (pat) {
      x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.85;
      patternFill(x, pat, col ? 'rgba(255,255,255,.95)' : (pat === 'hearts' ? '#ff4f9a' : pat === 'stars' ? '#ffd21f' : '#a14fff'));
      x.globalAlpha = 1;
    }
    x.globalCompositeOperation = 'source-over';
    sprites.set(key, c);
    return c;
  }
  // accessories, drawn at an anchor with unit u (1 = a 100px animal)
  const ACC = {
    saddle(x, y, u) {
      ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
      ink(P2('M-24,-6 Q0,-16 24,-6 L20,16 Q0,22 -20,16 Z'), '#e8304f', 1.4);
      ctx.fillStyle = '#ffd83a'; for (let i = -18; i <= 18; i += 6) circle(i, 17 + Math.abs(i) * -0.1, 2.6);
      ink(P2('M-14,-12 Q0,-20 14,-12 Q12,-4 0,-5 Q-12,-4 -14,-12 Z'), '#8a3a1a', 1.2);
      ctx.strokeStyle = '#6a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, 18); ctx.lineTo(4, 32); ctx.stroke();
      inkCircle(4, 34, 3.5, '#ffd83a', 1);
      ctx.restore();
    },
    bow(x, y, u) {
      ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
      ink(P2('M0,0 L-15,-10 Q-19,0 -15,10 Z'), '#ff4fa8', 1.2);
      ink(P2('M0,0 L15,-10 Q19,0 15,10 Z'), '#ff4fa8', 1.2);
      ink(P2('M-3,2 L-8,16 L-3,13 Z M3,2 L8,16 L3,13 Z'), '#ff4fa8', 1);
      inkCircle(0, 0, 4.5, '#ffd0ea', 1);
      ctx.restore();
    },
    flower(x, y, u) {
      ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
      ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3; ctx.stroke(P2('M-18,4 Q0,-4 18,4'));
      flower(-13, 2, 8, '#ff8fc8', '#ffd84a', 1.2); flower(13, 2, 8, '#a98bff', '#fff', 1.2); flower(0, -3, 9, '#fff', '#ff6f8f', 1.2);
      ctx.restore();
    },
    plume(x, y, u) {
      ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
      const sw = Math.sin(S.t * 3) * 0.08;
      [['#ff5fa8', -0.45], ['#ffd83a', 0], ['#7a6bff', 0.45]].forEach(([c, a]) => {
        ctx.save(); ctx.rotate(a + sw); ink(P2('M0,0 Q-9,-16 0,-34 Q9,-16 0,0 Z'), c, 1.1);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -30); ctx.stroke(); ctx.restore();
      });
      inkCircle(0, 0, 5, '#ffd83a', 1);
      ctx.restore();
    },
    ribbon(x, y, u) {
      ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
      const w = Math.sin(S.t * 4) * 4;
      [['#ff4f6f', -6], ['#4fb2ff', 0], ['#ffd21f', 6]].forEach(([c, o]) => {
        ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.lineCap = 'round';
        const p = P2(`M0,0 Q${14 + o},${8 + w} ${24 + o},${o + 4} T${40 + o},${16 + o - w}`);
        ctx.stroke(p); ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.stroke(p);
      });
      inkCircle(0, 0, 5, '#ff4f6f', 1);
      ctx.restore();
    },
    jewel(x, y, u) {
      ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
      ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -12, 13, 0.3, Math.PI - 0.3); ctx.stroke();
      ink(P2('M0,-6 L9,2 L0,14 L-9,2 Z'), '#4fe0ff', 1.1);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; tri(0, -4, 5, 2, -2, 2);
      star(10, -8, 5 + Math.sin(S.t * 6) * 2, '#fff', 4);
      ctx.restore();
    },
  };
  function drawCarouselAnimal(a, d, x, y, F, mirror = false) {
    const u = F / EMS;
    const at = p => [x + p[0] * F * (mirror ? -1 : 1), y + p[1] * F];
    if (d.acc.ribbon) { const [tx, ty] = at(a.t); ctx.save(); if (mirror) { ctx.translate(tx, ty); ctx.scale(-1, 1); ctx.translate(-tx, -ty); } ACC.ribbon(tx, ty, u); ctx.restore(); }
    ctx.save(); ctx.translate(x, y); if (mirror) ctx.scale(-1, 1);
    const spr = animalSprite(a, d.color, d.pattern), sw = SPR * u;
    ctx.drawImage(spr, -sw / 2, -sw / 2, sw, sw);
    ctx.restore();
    const [hx, hy] = at(a.h), [bx, by] = at(a.b);
    if (d.acc.saddle) ACC.saddle(bx, by, u * 0.9);
    if (d.acc.bow) ACC.bow(lerp(hx, bx, 0.38), lerp(hy, by, 0.38) + 8 * u, u * 0.9);
    if (d.acc.jewel) ACC.jewel(hx, hy + 14 * u, u * 0.7);
    if (d.acc.plume) ACC.plume(hx, hy - 8 * u, u * 0.75);
    if (d.acc.flower) ACC.flower(hx, hy - 8 * u, u * 0.7);
  }
  const blankDeco = () => ({ color: null, pattern: null, acc: {} });

  // ---------------------------------------------------------------- round 1 scenery
  function carouselSky(t) {
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#5a3fb8'); sky.addColorStop(0.55, '#d76fc8'); sky.addColorStop(1, '#ffc0a8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) star((i * 137) % W, 70 + (i * 53) % 120, 2 + (i % 3) + Math.sin(t * 2 + i) * 0.8, 'rgba(255,250,220,.8)', 4);
    // far tents and a Ferris wheel silhouette
    ctx.fillStyle = 'rgba(90,40,120,.45)';
    for (const [x, w, h] of [[60, 120, 110], [880, 140, 130], [720, 90, 90]]) { tri(x - w / 2, 410, x, 410 - h, x + w / 2, 410); ctx.fillRect(x - w / 2, 380, w, 30); }
    ctx.strokeStyle = 'rgba(90,40,120,.45)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(230, 250, 90, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.2; ctx.beginPath(); ctx.moveTo(230, 250); ctx.lineTo(230 + Math.cos(a) * 90, 250 + Math.sin(a) * 90); ctx.stroke(); }
    // string lights
    for (let k = 0; k < 2; k++) {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const x = i * 40, y = 64 + k * 28 + Math.sin(i / 24 * Math.PI * 4 + k) * 10 + 14 * Math.sin(i / 24 * Math.PI); pts.push([x, y]); }
      ctx.strokeStyle = 'rgba(60,30,80,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.stroke();
      lights(pts, t + k * 0.5, 3.5);
    }
    // boardwalk floor
    const fl = ctx.createLinearGradient(0, 400, 0, H);
    fl.addColorStop(0, '#f2b77a'); fl.addColorStop(1, '#d98a55');
    ctx.fillStyle = fl; ctx.fillRect(0, 404, W, H - 404);
    ctx.strokeStyle = 'rgba(140,70,40,.3)'; ctx.lineWidth = 2;
    for (let y = 418; y < H; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let i = 0; i < 30; i++) { ctx.fillStyle = ['#ff6fb5', '#5ab8ff', '#ffd83a', '#5fd38a'][i % 4]; ctx.save(); ctx.translate((i * 113) % W, 412 + (i * 41) % 120); ctx.rotate(i); ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); }
  }
  // the carousel: spin = rotation angle (0 when standing), slots drawn by the caller via drawSlot(i, x, y, scale)
  function carousel(cx, t, spin, n, drawSlot, slotX) {
    const L = 196, R = 780, top = 66, val = 150;
    // pavilion back drum (mirrors)
    ink(P2(`M${L + 34},${val + 20} L${R - 34},${val + 20} L${R - 34},388 L${L + 34},388 Z`), '#7a3fa8', 1.5);
    for (let i = 0; i < 9; i++) {
      const x = L + 44 + i * ((R - L - 88) / 9), w = (R - L - 88) / 9 - 8;
      const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#c9b8ff'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#b49cf0');
      rrect(x, val + 40, w, 150, 10, gr); rrect(x, val + 40, w, 150, 10, null, '#ffd83a', 3);
      star(x + w / 2, val + 210, 6, '#ffd83a', 5);
    }
    ctx.fillStyle = 'rgba(70,20,100,.25)'; ctx.fillRect(L + 34, 330, R - L - 68, 58);
    // centre pole
    ink(P2(`M${cx - 12},${val} L${cx + 12},${val} L${cx + 12},390 L${cx - 12},390 Z`), '#ffd83a', 1.3);
    // platform
    ink(P2(`M${L},382 L${R},382 L${R - 10},408 Q${cx},420 ${L + 10},408 Z`), '#ff5f9a', 1.5);
    ctx.fillStyle = '#ffd83a'; ctx.fillRect(L + 4, 382, R - L - 8, 6);
    lights(Array.from({ length: 16 }, (_, i) => [L + 22 + i * ((R - L - 44) / 15), 398]), t + 0.3, 3.5);
    // poles + slots, back to front when spinning
    const order = [...Array(n).keys()].map(i => {
      if (!spin) return { i, x: slotX(i), s: 1, z: 1 };
      // going round: the row slides along and wraps, fading at the edges as it turns away
      const sp = slotX(1) - slotX(0), b0 = slotX(0) - sp / 2, span = n * sp;
      const x = b0 + ((((i + 0.5) * sp - spin * span) % span) + span) % span;
      const e = clamp(Math.min(x - b0, b0 + span - x) / (sp * 0.6), 0, 1);
      return { i, x, s: 0.7 + 0.3 * e, z: e * 2 - 1 };
    }).sort((p, q) => p.z - q.z);
    for (const p of order) {
      ctx.globalAlpha = spin ? 0.1 + 0.9 * (p.z + 1) / 2 : 1;
      ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(p.x, val + 22); ctx.lineTo(p.x, 384); ctx.stroke();
      ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 2;
      for (let y = val + 28; y < 380; y += 14) { ctx.beginPath(); ctx.moveTo(p.x - 2.5, y); ctx.lineTo(p.x + 2.5, y + 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
      drawSlot(p.i, p.x, p.s, p.z);
    }
    // roof: striped cone + scalloped valance
    const roof = P2(`M${cx},${top} L${R + 16},${val} L${L - 16},${val} Z`);
    ink(roof, '#fff', 1.6);
    ctx.save(); ctx.clip(roof);
    const off = (spin * 6) % 2;
    for (let k = -12; k <= 12; k++) {
      if ((k + 100) % 2) continue;
      const x0 = cx + (k + off) * 50, x1 = cx + (k + 1 + off) * 50;
      ctx.fillStyle = '#ff4f8b'; tri(cx, top, x0, val, x1, val);
    }
    ctx.restore();
    ink(P2(`M${L - 20},${val} L${R + 20},${val} L${R + 20},${val + 22} L${L - 20},${val + 22} Z`), '#ffd83a', 1.4);
    const sc = new Path2D();
    for (let i = 0; i < 16; i++) { const x = L - 20 + i * ((R - L + 40) / 16), w = (R - L + 40) / 16; sc.moveTo(x, val + 22); sc.quadraticCurveTo(x + w / 2, val + 44, x + w, val + 22); }
    ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke(sc);
    ctx.fillStyle = '#5ab8ff';
    for (let i = 0; i < 16; i++) { const x = L - 20 + i * ((R - L + 40) / 16), w = (R - L + 40) / 16; ctx.beginPath(); ctx.moveTo(x, val + 22); ctx.quadraticCurveTo(x + w / 2, val + 44, x + w, val + 22); ctx.fill(); }
    lights(Array.from({ length: 18 }, (_, i) => [L - 10 + i * ((R - L + 20) / 17), val + 11]), t, 4);
    // finial + flag
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, top - 6); ctx.stroke();
    inkCircle(cx, top - 2, 7, '#ffd83a', 1.2);
  }

  // ---------------------------------------------------------------- round 2: ring pieces
  const PIECES = {
    trampoline: { n: 'trampoline', req: 1 }, hoop: { n: 'hoop', req: 1 }, pedestal: { n: 'pedestal', req: 1 }, ball: { n: 'big ball', req: 1 },
    tightrope: { n: 'tightrope', req: 2 }, drum: { n: 'drum', req: 2 }, ladder: { n: 'ladder', req: 3 }, spotlight: { n: 'spotlight', req: 3 },
    flag: { n: 'flag' }, bunting: { n: 'bunting' }, balloons: { n: 'balloons' }, bigstar: { n: 'star' }, cannon: { n: 'confetti' },
    pinklight: { n: 'pink light' }, bluelight: { n: 'blue light' }, elephant: { n: 'elephant', e: '🐘' }, lion: { n: 'lion', e: '🦁' },
    seal: { n: 'seal', e: '🦭' }, poodle: { n: 'poodle', e: '🐩' }, monkey: { n: 'monkey', e: '🐒' },
  };
  const EXTRAS = ['flag', 'bunting', 'balloons', 'bigstar', 'cannon', 'pinklight', 'bluelight', 'elephant', 'lion', 'seal', 'poodle', 'monkey'];
  const REQ_BY_TIER = [['trampoline', 'hoop', 'pedestal', 'ball'], ['trampoline', 'hoop', 'pedestal', 'ball', 'tightrope', 'drum'],
    ['trampoline', 'hoop', 'pedestal', 'ball', 'tightrope', 'drum', 'ladder', 'spotlight']];
  // each piece is drawn with (0, 0) on the floor; t = time, sh = show time (or -1)
  const PART = {
    trampoline() {
      ctx.strokeStyle = OL; ctx.lineWidth = 5;
      for (const x of [-30, -12, 12, 30]) { ctx.beginPath(); ctx.moveTo(x, -12); ctx.lineTo(x * 1.05, 2); ctx.stroke(); }
      inkEllipse(0, -16, 42, 15, 0, '#3a6be0', 1.4);
      ctx.fillStyle = '#26284a'; ellipse(0, -16, 33, 10);
      ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 33, -16 + Math.sin(a) * 10); ctx.lineTo(Math.cos(a) * 41, -16 + Math.sin(a) * 14); ctx.stroke(); }
      star(0, -16, 6, '#ff6fb5', 5);
    },
    hoop(t) {
      ink(P2('M-4,0 L4,0 L3,-42 L-3,-42 Z'), '#c9c9d9', 1.2);
      inkEllipse(0, 0, 14, 5, 0, '#8a8aa0', 1);
      ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, -74, 32, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#ff3f7c'; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 8;
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(0, -74, 32, i * Math.PI / 4, i * Math.PI / 4 + 0.25); ctx.stroke(); }
      for (let i = 0; i < 3; i++) star(Math.cos(t * 2 + i * 2.1) * 32, -74 + Math.sin(t * 2 + i * 2.1) * 32, 5, '#fff', 4);
    },
    pedestal() {
      ink(P2('M-28,-44 L28,-44 L30,-4 Q0,6 -30,-4 Z'), '#e8304f', 1.4);
      ctx.fillStyle = '#ffd83a'; ctx.fillRect(-29, -16, 58, 6);
      inkEllipse(0, -44, 28, 10, 0, '#ffd83a', 1.3);
      ctx.fillStyle = '#fff3a0'; ellipse(0, -45, 20, 6);
      vecStar(0, -27, 9, '#fff', 0.8);
    },
    ball(t) {
      const r = 27, cy = -r;
      ctx.fillStyle = 'rgba(40,10,40,.25)'; ellipse(0, 0, 26, 6);
      inkCircle(0, cy, r, '#ff4f6f', 1.4);
      ctx.save(); ctx.beginPath(); ctx.arc(0, cy, r, 0, Math.PI * 2); ctx.clip();
      ['#ffd83a', '#4fb2ff', '#fff', '#5fd38a'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, cy, r * (0.85 - i * 0.2), r * 1.1, 0, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.65)'; ellipse(-9, cy - 11, 7, 5, -0.6);
    },
    tightrope() {
      for (const x of [-72, 72]) {
        ink(P2(`M${x - 4},0 L${x + 4},0 L${x + 3},-92 L${x - 3},-92 Z`), '#7a4fd8', 1.2);
        inkEllipse(x, -92, 12, 4, 0, '#ffd83a', 1);
        inkEllipse(x, 0, 12, 4, 0, '#5a3aa8', 1);
        ctx.strokeStyle = 'rgba(60,30,60,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, -80); ctx.lineTo(x + (x < 0 ? -20 : 20), 0); ctx.stroke();
      }
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-72, -94); ctx.quadraticCurveTo(0, -84, 72, -94); ctx.stroke();
      ctx.strokeStyle = '#fff3d0'; ctx.lineWidth = 2; ctx.stroke();
    },
    drum(t, sh) {
      const p = sh >= 0 ? 1 + 0.06 * Math.max(0, Math.sin(sh * 12)) : 1;
      ctx.save(); ctx.scale(p, p);
      ink(P2('M-30,-40 L30,-40 L30,-6 Q0,4 -30,-6 Z'), '#ff4f6f', 1.4);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 6; i++) ctx.lineTo(-30 + i * 10, i % 2 ? -10 : -36);
      ctx.stroke();
      inkEllipse(0, -40, 30, 10, 0, '#fff6e0', 1.3);
      ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -40, 30, 10, 0, 0, Math.PI); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(8, -46); ctx.lineTo(34, -70); ctx.moveTo(-8, -46); ctx.lineTo(-30, -72); ctx.stroke();
      inkCircle(34, -70, 4, '#fff', 1); inkCircle(-30, -72, 4, '#fff', 1);
    },
    ladder() {
      ctx.strokeStyle = OL; ctx.lineWidth = 8;
      for (const x of [-16, 16]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x * 0.8, -120); ctx.stroke(); }
      ctx.lineWidth = 5; for (let y = -12; y > -118; y -= 16) { ctx.beginPath(); ctx.moveTo(-15, y); ctx.lineTo(15, y); ctx.stroke(); }
      ctx.lineWidth = 5; ctx.strokeStyle = '#ffb030'; for (const x of [-16, 16]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x * 0.8, -120); ctx.stroke(); }
      ctx.lineWidth = 3; ctx.strokeStyle = '#ff5f9a'; for (let y = -12; y > -118; y -= 16) { ctx.beginPath(); ctx.moveTo(-14, y); ctx.lineTo(14, y); ctx.stroke(); }
      ink(P2('M13,-120 L13,-140 L30,-134 L13,-128'), '#5ab8ff', 1);
    },
    spotlight(t, sh) {
      if (sh >= 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const a = Math.sin(sh * 1.4) * 0.8;
        const gr = ctx.createRadialGradient(0, -50, 10, 0, -50, 220); gr.addColorStop(0, 'rgba(255,250,200,.55)'); gr.addColorStop(1, 'rgba(255,250,200,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(Math.cos(a - 1.4) * 260, -50 - Math.sin(1.4 - a) * 120 + 200); ctx.lineTo(Math.cos(a - 1.9) * 260, -50 + 200); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = OL; ctx.lineWidth = 4;
      for (const dx of [-18, 0, 18]) { ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(dx, 0); ctx.stroke(); }
      ctx.save(); ctx.translate(0, -48); ctx.rotate(0.5);
      ink(P2('M-16,-12 L12,-16 L12,16 L-16,12 Z'), '#3a3a5a', 1.3);
      inkEllipse(14, 0, 6, 17, 0, '#fff6a0', 1.2);
      ctx.restore();
    },
    flag(t) {
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -80); ctx.stroke();
      ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 3; ctx.stroke();
      const w = Math.sin(t * 5) * 5;
      ink(P2(`M1,-80 Q16,${-84 + w} 34,${-72 + w} Q16,${-66 - w} 1,-60 Z`), '#ff3f6c', 1.2);
      inkCircle(0, -82, 4, '#ffd83a', 1);
    },
    bunting(t) {
      for (const x of [-50, 50]) { ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -70); ctx.stroke(); ctx.strokeStyle = '#5ab8ff'; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-50, -68); ctx.quadraticCurveTo(0, -46, 50, -68); ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const k = (i + 0.5) / 7, x = -50 + 100 * k, y = -68 + 44 * k * (1 - k) + Math.sin(t * 4 + i) * 1.5;
        ink(P2(`M${x - 6},${y} L${x + 6},${y} L${x},${y + 13} Z`), ['#ff4f6f', '#ffd83a', '#4fb2ff', '#5fd38a'][i % 4], 0.8);
      }
    },
    balloons(t) {
      [['#ff4f8b', -14, -78], ['#4fb2ff', 12, -86], ['#ffd21f', 0, -100]].forEach(([c, x, y], i) => {
        const by = y + Math.sin(t * 2 + i) * 4;
        ctx.strokeStyle = 'rgba(60,30,60,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(x * 0.5, by * 0.5, x, by + 16); ctx.stroke();
        inkEllipse(x, by, 13, 16, 0, c, 1.1);
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(x - 4, by - 6, 3, 5, -0.4);
      });
      inkEllipse(0, 0, 6, 3, 0, '#8a6aa0', 0.8);
    },
    bigstar(t) {
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -56); ctx.stroke();
      ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(0, -72); ctx.rotate(Math.sin(t * 2) * 0.15); vecStar(0, 0, 22, '#ffd21f', 1.3); ctx.restore();
      star(16, -92, 4 + Math.sin(t * 5) * 2, '#fff', 4);
    },
    cannon() {
      for (const x of [-16, 16]) { inkCircle(x, -12, 12, '#ffd83a', 1.1); ctx.fillStyle = '#ff6f9a'; circle(x, -12, 4); }
      ctx.save(); ctx.translate(0, -24); ctx.rotate(-0.7);
      ink(P2('M-22,-11 L26,-14 L26,14 L-22,11 Z'), '#a14fff', 1.4);
      ctx.fillStyle = '#ffd83a'; ctx.fillRect(16, -14, 6, 28);
      star(0, 0, 6, '#fff', 5);
      ctx.restore();
    },
    pinklight(t) { this.light('255,110,200', t); },
    bluelight(t) { this.light('90,180,255', t); },
    light(rgb, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(0, -6, 4, 0, -6, 64);
      gr.addColorStop(0, `rgba(${rgb},.75)`); gr.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gr; ellipse(0, -6, 66, 26);
      ctx.restore();
      for (let i = 0; i < 4; i++) star(Math.cos(t + i * 1.6) * 34, -8 + Math.sin(t + i * 1.6) * 12, 3, '#fff', 4);
    },
  };
  function drawPiece(kind, x, y, s, rot, t, sh = -1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    if (PIECES[kind].e) {
      ctx.fillStyle = 'rgba(40,10,40,.22)'; ellipse(0, 0, 24, 6);
      const hop = sh >= 0 ? Math.abs(Math.sin(sh * 5 + x)) * 14 : 0;
      emoji(PIECES[kind].e, 0, -30 - hop, 54);
    } else PART[kind](t, sh);
    ctx.restore();
  }
  const pieceIcon = (kind, x, y, box) => { // fits a piece into a box centred at (x, y)
    const tall = { hoop: 108, tightrope: 100, ladder: 140, flag: 86, balloons: 120, bigstar: 96, bunting: 76, drum: 76, spotlight: 66 }[kind] ?? 60;
    const wide = { tightrope: 170, bunting: 112, pinklight: 120, bluelight: 120, trampoline: 90 }[kind] ?? 64;
    const s = Math.min(box / tall, box / wide);
    drawPiece(kind, x, y + tall * s / 2, s, 0, S.t);
  };

  // the ring interior (three-quarter view, inside the big top)
  const RING = { cx: 480, cy: 322, rx: 296, ry: 138 };
  const inRing = (x, y, m = 0) => ((x - RING.cx) / (RING.rx - m)) ** 2 + ((y - RING.cy) / (RING.ry - m * 0.5)) ** 2 <= 1;
  function ringInterior(t) {
    ctx.fillStyle = '#3a1240'; ctx.fillRect(0, 0, W, H);
    // tent canvas: stripes fanning out from the peak above the screen
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 214); ctx.clip();
    for (let k = -14; k < 14; k++) {
      ctx.fillStyle = k % 2 ? '#e8304f' : '#fff0ec';
      tri(480, -330, 480 + k * 110, 214, 480 + (k + 1) * 110, 214);
    }
    const shade = ctx.createLinearGradient(0, 0, 0, 214); shade.addColorStop(0, 'rgba(40,0,40,.55)'); shade.addColorStop(1, 'rgba(40,0,40,.1)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, 214);
    ctx.restore();
    // king poles and swags of lights
    for (const x of [300, 660]) { ink(P2(`M${x - 7},0 L${x + 7},0 L${x + 7},200 L${x - 7},200 Z`), '#4fb2ff', 1.3); ctx.fillStyle = '#ffd83a'; for (let y = 10; y < 200; y += 26) ctx.fillRect(x - 7, y, 14, 6); }
    for (let k = 0; k < 2; k++) {
      const pts = []; for (let i = 0; i <= 30; i++) { const x = i * 32; pts.push([x, 74 + k * 36 + 26 * Math.sin((i % 10) / 10 * Math.PI)]); }
      ctx.strokeStyle = 'rgba(60,20,60,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.stroke();
      lights(pts, t + k, 3.5);
    }
    // audience stands curving round the back of the ring
    for (let row = 0; row < 3; row++) {
      const y0 = 160 + row * 18;
      ctx.fillStyle = ['#5a2a7a', '#6a3290', '#7a3aa6'][row]; ctx.fillRect(0, y0 + 8, W, 18);
      for (let i = 0; i < 34; i++) {
        const x = 8 + i * 29 + (row % 2) * 14, bob = Math.sin(t * 3 + i * 1.3 + row) * 1.5;
        ctx.fillStyle = ['#ff8fb8', '#ffd2a0', '#a8e0ff', '#c6a2ff', '#ffe07a', '#9be8b0'][(i + row * 2) % 6]; ellipse(x, y0 + 14, 11, 9);
        ctx.fillStyle = ['#f3c9a8', '#c98a62', '#ffe0c8', '#8a5a3a'][(i * 3 + row) % 4]; circle(x, y0 + 1 + bob, 7);
      }
    }
    // arena floor
    const fl = ctx.createLinearGradient(0, 210, 0, H);
    fl.addColorStop(0, '#5a1838'); fl.addColorStop(1, '#8a2a48');
    ctx.fillStyle = fl; ctx.fillRect(0, 214, W, H - 214);
    // spotlight beams
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [sx, tx] of [[70, 380 + Math.sin(t * 0.7) * 60], [890, 590 + Math.cos(t * 0.6) * 60]]) {
      const gr = ctx.createLinearGradient(sx, 0, tx, 330); gr.addColorStop(0, 'rgba(255,245,200,.0)'); gr.addColorStop(1, 'rgba(255,245,200,.16)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx - 10, 0); ctx.lineTo(sx + 10, 0); ctx.lineTo(tx + 110, 330); ctx.lineTo(tx - 110, 330); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // the ring: curb wall, curb top, sawdust
    const { cx, cy, rx, ry } = RING;
    inkEllipse(cx, cy + 16, rx + 24, ry + 18, 0, '#a8183a', 1.6);
    inkEllipse(cx, cy, rx + 24, ry + 16, 0, '#e8304f', 1.4);
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx + 24, ry + 16, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#fff0ec';
    for (let i = 0; i < 24; i += 2) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 700, i * Math.PI / 12, (i + 1) * Math.PI / 12); ctx.fill(); }
    ctx.restore();
    const saw = ctx.createRadialGradient(cx, cy - 20, 30, cx, cy, rx);
    saw.addColorStop(0, '#ffe9b0'); saw.addColorStop(1, '#e9b870');
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = saw; ctx.fill(); ctx.clip();
    for (let i = 0; i < 160; i++) { ctx.fillStyle = i % 2 ? 'rgba(170,110,50,.25)' : 'rgba(255,255,255,.35)'; ellipse(cx - rx + (i * 157) % (rx * 2), cy - ry + (i * 89) % (ry * 2), 2.5, 1.2, i); }
    ctx.strokeStyle = 'rgba(200,120,60,.35)'; ctx.lineWidth = 3; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx); star(0, 0, 60, 'rgba(255,111,181,.22)', 5); ctx.restore();
    ctx.restore();
    // gold studs on the curb
    for (let i = 0; i < 28; i++) { const a = i * Math.PI * 2 / 28; inkCircle(cx + Math.cos(a) * (rx + 12), cy + Math.sin(a) * (ry + 8), 3.2, '#ffd83a', 0.7); }
  }

  // ---------------------------------------------------------------- the game
  const R1 = { L: 196, R: 780, poleY: 292, trayY: 482 };
  const PAL = { x: 792, y: 66, w: 158 };
  const decoCell = i => ({ x: PAL.x + 8 + (i % 2) * 72, y: PAL.y + 30 + Math.floor(i / 2) * 44, w: 68, h: 40 });
  const LP = { x: 8, y: 66, w: 146 }, RP = { x: 806, y: 66, w: 146 };
  const reqRow = (g, i) => ({ x: LP.x + 6, y: LP.y + 30 + i * 42, w: LP.w - 12, h: 38 });
  const extraCell = i => ({ x: RP.x + 6 + (i % 2) * 68, y: RP.y + 30 + Math.floor(i / 2) * 50, w: 64, h: 46 });

  MG.lineupordinals = {
    kind: 'learn',
    title: g => (g.round === 2 ? 'Design the Ring!' : 'Carnival Design'),
    icon: () => '🎠',
    how: () => 'Two carnival jobs! First, put the animals on the carousel in the order on the card. Decorate them any way you like! Then design your own circus ring.',
    init(g) {
      const n = [5, 6, 8][g.tier - 1];
      const ani = shuffle(CA).slice(0, n);
      Object.assign(g, {
        round: 1, n, ani, pole: Array(n).fill(-1), tray: shuffle([...Array(n).keys()]), deco: ani.map(blankDeco),
        mist: 0, hist: [], drag: null, selA: -1, selDeco: -1, shake: Array(n).fill(0), r1: 'build', spinT: 0,
        req: REQ_BY_TIER[g.tier - 1], items: [], sel: -1, showT: -1, flash: 0, hint: '',
      });
      g.say = `Look at the order card! ${ani.map((a, i) => `The ${a.n} goes ${ORDW[i]}.`).join(' ')} You can decorate them too!`;
      this.score(g);
    },
    start(g) { speak(g.say); },
    sp(g) { return Math.min(108, 556 / g.n); },
    poleX(g, i) { return (R1.L + R1.R) / 2 + (i - (g.n - 1) / 2) * this.sp(g); },
    F(g) { return Math.min(92, this.sp(g) * 1.02); },
    trayX(g, k) { const sw = (R1.R - R1.L) / g.n; return R1.L + (k + 0.5) * sw; },
    trayF(g) { return Math.min(66, ((R1.R - R1.L) / g.n) * 0.86); },
    score(g) {
      const r1 = clamp(1 - g.mist / g.n * 0.7, 0.2, 1);
      const r2 = g.req.filter(k => g.items.some(it => it.k === k)).length / g.req.length;
      g.score = 0.7 * r1 + 0.3 * r2;
      g.progress = g.round === 1 ? `🎠 Carousel ${g.pole.filter(p => p >= 0).length} / ${g.n}` : `🎪 Ring pieces ${Math.round(r2 * g.req.length)} / ${g.req.length}`;
    },
    snap(g) {
      g.hist.push(JSON.stringify(g.round === 1 ? { pole: g.pole, deco: g.deco } : { items: g.items }));
      if (g.hist.length > 60) g.hist.shift();
    },
    undo(g) {
      const s = g.hist.pop(); if (!s) { SFX.miss(); return; }
      Object.assign(g, JSON.parse(s)); g.sel = -1; SFX.pop(); this.score(g);
    },
    // --- round 1 actions (also used by the test bot)
    place(g, i, p) {
      if (g.pole[p] >= 0 || g.r1 !== 'build') return false;
      const a = g.ani[i];
      if (i !== p) {
        g.mist++; g.shake[p] = 0.5; SFX.miss();
        floatText(this.poleX(g, p), 200, 'Oops!', '#ffd0e8', false, 24);
        speak(`That is the ${ORDW[p]} pole. The ${a.n} goes ${ORDW[i]}. Count from the left!`);
        g.hint = `The ${a.n} goes ${ORDS[i]}`;
        this.score(g); return false;
      }
      this.snap(g);
      g.pole[p] = i; g.selA = -1; SFX.hit(); burst(this.poleX(g, p), R1.poleY, 16);
      floatText(this.poleX(g, p), 200, ORDS[p] + '!', '#fff6a8', false, 26);
      g.hint = '';
      if (g.pole.every(v => v >= 0)) { g.r1 = 'spin'; g.spinT = 0; calliope(2); speak('All aboard! Watch your carousel go round and round!'); burst(488, 250, 40); }
      else speak(pick([`Yes! The ${a.n} is ${ORDW[p]}!`, `${ORDW[p][0].toUpperCase() + ORDW[p].slice(1)}! Well done!`]));
      this.score(g); return true;
    },
    unplace(g, i) { const p = g.pole.indexOf(i); if (p < 0 || g.r1 !== 'build') return; this.snap(g); g.pole[p] = -1; SFX.pop(); this.score(g); },
    decorate(g, i, di) {
      const it = DECO[di], d = g.deco[i];
      this.snap(g);
      if (it.k === 'color') d.color = d.color === it.v ? null : it.v;
      else if (it.k === 'pattern') d.pattern = d.pattern === it.v ? null : it.v;
      else d.acc[it.v] = !d.acc[it.v];
      SFX.sparkle(); burst(...this.animalPos(g, i), 10, { colors: ['#fff6a8', '#ffb3e0', it.k === 'color' && it.v !== 'rainbow' ? it.v : '#b8e6ff'] });
    },
    animalPos(g, i) {
      const p = g.pole.indexOf(i);
      if (p >= 0) return [this.poleX(g, p), R1.poleY + Math.sin(S.t * 2 + p) * 4];
      return [this.trayX(g, g.tray.indexOf(i)), R1.trayY];
    },
    animalAt(g, x, y) {
      for (let i = 0; i < g.n; i++) {
        const [ax, ay] = this.animalPos(g, i), placed = g.pole.includes(i), r = (placed ? this.F(g) : this.trayF(g)) * 0.55;
        if (Math.abs(x - ax) < r && Math.abs(y - ay) < r * 1.1) return i;
      }
      return -1;
    },
    poleAt(g, x, y) {
      if (y < 160 || y > 420) return -1;
      const sp = this.sp(g);
      for (let p = 0; p < g.n; p++) if (Math.abs(x - this.poleX(g, p)) < sp / 2) return p;
      return -1;
    },
    toRing(g) {
      g.round = 2; g.hist = []; g.drag = null; g.sel = -1;
      g.say = `Now design your own circus ring! Drag every piece into the ring. Put them anywhere you like. Add extras too, then press Show time!`;
      speak(g.say); this.score(g);
    },
    // --- round 2 actions
    addItem(g, k, x, y) {
      if (PIECES[k].req && (!inRing(x, y) || g.items.some(it => it.k === k))) return false;
      this.snap(g);
      g.items.push({ k, x, y, s: 1, rot: 0 }); g.sel = g.items.length - 1;
      SFX.pop(); burst(x, y - 20, 12);
      this.afterChange(g, k); return true;
    },
    afterChange(g, k) {
      const before = g.allIn; this.score(g);
      g.allIn = g.req.every(r => g.items.some(it => it.k === r));
      if (g.allIn && !before) { SFX.sparkle(); speak('Every piece is in the ring! Add more extras if you like, or press Show time!'); }
      else if (k && PIECES[k].req && !g.allIn) { const left = g.req.filter(r => !g.items.some(it => it.k === r)).length; speak(`The ${PIECES[k].n}! ${left} more to go.`); }
    },
    itemAt(g, x, y) {
      const ord = g.items.map((it, i) => i).sort((a, b) => g.items[b].y - g.items[a].y);
      for (const i of ord) { const it = g.items[i]; if (Math.hypot(x - it.x, (y - (it.y - 34 * it.s)) * 0.8) < 46 * it.s) return i; }
      return -1;
    },
    show(g) { g.showT = 0; g.sel = -1; calliope(3); applause(30, 0.2); speak("Ladies and gentlemen! Welcome to Aubrey's amazing circus!"); },

    update(g, dt, id) {
      g.flash = Math.max(0, g.flash - dt);
      for (let i = 0; i < g.shake.length; i++) g.shake[i] = Math.max(0, g.shake[i] - dt);
      if (id === 'cdUndo') return this.undo(g);
      if (g.round === 1) return this.update1(g, dt, id);
      return this.update2(g, dt, id);
    },
    update1(g, dt, id) {
      if (g.r1 === 'spin') {
        g.spinT += dt;
        if (Math.random() < dt * 6) burst(rand(200, 780), rand(90, 160), 3, { colors: ['#fff6a8', '#ffb3e0', '#a8e6ff'] });
        if (g.spinT > 6.5) { g.r1 = 'admire'; speak('Beautiful! Next, let us design the circus ring!'); }
        return;
      }
      if (g.r1 === 'admire') { if (id === 'cdNext') this.toRing(g); return; }
      // keyboard: number keys put the chosen animal on that pole
      if (g.selA >= 0) for (let p = 0; p < g.n; p++) if (pressed[String(p + 1)]) this.place(g, g.selA, p);
      if (id) return;
      const P = pointer;
      if (P.clicked && !g.drag) {
        const di = DECO.findIndex((_, i) => inRect(decoCell(i)));
        const ai = this.animalAt(g, P.x, P.y);
        if (di >= 0) g.drag = { kind: 'deco', di, sx: P.x, sy: P.y, moved: false };
        else if (ai >= 0) g.drag = { kind: 'animal', i: ai, sx: P.x, sy: P.y, moved: false };
        else {
          const p = this.poleAt(g, P.x, P.y);
          if (p >= 0 && g.selA >= 0 && g.pole[p] < 0) this.place(g, g.selA, p);
          else { g.selA = -1; g.selDeco = -1; }
        }
      }
      const d = g.drag;
      if (!d) return;
      if (Math.hypot(P.x - d.sx, P.y - d.sy) > 12) d.moved = true;
      if (P.down) return;
      g.drag = null;
      if (d.kind === 'deco') {
        const ai = this.animalAt(g, P.x, P.y);
        if (d.moved && ai >= 0) this.decorate(g, ai, d.di);
        else if (!d.moved) {
          g.selDeco = g.selDeco === d.di ? -1 : d.di; g.selA = -1;
          if (g.selDeco >= 0) speak(`${DECO[d.di].n}! Now tap an animal.`);
        }
        return;
      }
      if (!d.moved) { // a tap on an animal
        if (g.selDeco >= 0) return this.decorate(g, d.i, g.selDeco);
        if (!g.pole.includes(d.i)) { g.selA = g.selA === d.i ? -1 : d.i; if (g.selA >= 0) speak(g.tier === 1 ? `The ${g.ani[d.i].n}! It goes ${ORDW[d.i]}.` : `The ${g.ani[d.i].n}!`); SFX.pick(); }
        return;
      }
      const p = this.poleAt(g, P.x, P.y), placed = g.pole.includes(d.i);
      if (placed) { if (P.y > 420) this.unplace(g, d.i); return; }
      if (p >= 0 && g.pole[p] < 0) this.place(g, d.i, p);
    },
    update2(g, dt, id) {
      if (g.showT >= 0) {
        g.showT += dt;
        for (const it of g.items) if (it.k === 'cannon' && Math.random() < dt * 1.2) burst(it.x + 20 * it.s, it.y - 50 * it.s, 26, { colors: ['#ff6fb5', '#ffd83a', '#5ab8ff', '#5fd38a'], spread: 120, up: 220, size: [3, 6] });
        if (Math.random() < dt * 4) floatText(rand(40, 920), rand(150, 200), '👏', '#fff', false, 22);
        if (g.showT > 3.5 && g.showT - dt <= 3.5) applause(20);
        if (g.showT > 9) { g.done = true; applause(30); }
        return;
      }
      const sel = g.items[g.sel];
      if (sel && id) {
        if (id === 'cdRot') { this.snap(g); sel.rot = ((sel.rot / (Math.PI / 4) + 1) % 8) * Math.PI / 4; if (Math.abs(sel.rot - Math.PI * 2) < 0.01) sel.rot = 0; return; }
        if (id === 'cdBig') { this.snap(g); sel.s = Math.min(1.6, +(sel.s + 0.2).toFixed(1)); return; }
        if (id === 'cdSmall') { this.snap(g); sel.s = Math.max(0.6, +(sel.s - 0.2).toFixed(1)); return; }
        if (id === 'cdDel') { this.snap(g); g.items.splice(g.sel, 1); g.sel = -1; SFX.pop(); this.afterChange(g); return; }
      }
      if (id === 'cdShow' && g.allIn) return this.show(g);
      if (id) return;
      const P = pointer;
      if (P.clicked && !g.drag) {
        const ri = g.req.findIndex((k, i) => inRect(reqRow(g, i)) && !g.items.some(it => it.k === k));
        const ei = EXTRAS.findIndex((_, i) => inRect(extraCell(i)));
        const ii = this.itemAt(g, P.x, P.y);
        if (ri >= 0) g.drag = { kind: 'new', k: g.req[ri], sx: P.x, sy: P.y, moved: false };
        else if (ei >= 0) g.drag = { kind: 'new', k: EXTRAS[ei], sx: P.x, sy: P.y, moved: false };
        else if (ii >= 0) { g.sel = ii; const it = g.items[ii]; g.drag = { kind: 'move', i: ii, sx: P.x, sy: P.y, ox: it.x - P.x, oy: it.y - P.y, moved: false, snap: JSON.stringify({ items: g.items }) }; }
        else g.sel = -1;
      }
      const d = g.drag;
      if (!d) return;
      if (Math.hypot(P.x - d.sx, P.y - d.sy) > 10) d.moved = true;
      if (d.kind === 'move' && d.moved) { const it = g.items[d.i]; it.x = clamp(P.x + d.ox, 0, W); it.y = clamp(P.y + d.oy, 60, H); }
      if (P.down) return;
      g.drag = null;
      const onPanel = P.x < LP.x + LP.w + 6 || P.x > RP.x - 6;
      if (d.kind === 'new') {
        if (!d.moved) { speak(`Drag the ${PIECES[d.k].n} into the ring!`); return; }
        if (onPanel) return;
        if (PIECES[d.k].req && !inRing(P.x, P.y + 10)) { SFX.miss(); speak('Put it inside the ring!'); return; }
        this.addItem(g, d.k, P.x, Math.max(P.y + 10, 214));
        return;
      }
      if (!d.moved) return;
      const it = g.items[d.i];
      g.hist.push(d.snap);
      if (onPanel) { g.items.splice(d.i, 1); g.sel = -1; SFX.pop(); this.afterChange(g); return; }
      if (PIECES[it.k].req && !inRing(it.x, it.y)) { // pieces must stay inside: hop back in
        const a = Math.atan2((it.y - RING.cy) / RING.ry, (it.x - RING.cx) / RING.rx);
        it.x = RING.cx + Math.cos(a) * RING.rx * 0.9; it.y = RING.cy + Math.sin(a) * RING.ry * 0.9;
        SFX.miss(); speak('Ring pieces stay inside the ring!');
      }
      it.y = Math.max(it.y, 214);
    },

    // ------------------------------------------------------------ drawing
    draw(g) { if (g.round === 1) this.draw1(g); else this.draw2(g); },
    draw1(g) {
      const t = S.t;
      carouselSky(t);
      const k = clamp(g.spinT / 6.5, 0, 1), spin = g.r1 === 'spin' ? 3 * k * k * (3 - 2 * k) + 0.0001 : 0;
      const F = this.F(g);
      carousel(488, t, spin, g.n, (p, x, s, z) => {
        const i = g.pole[p];
        const bob = spin ? Math.sin(g.spinT * 4 + p * 1.7) * 14 : Math.sin(t * 2 + p) * 4;
        const shk = g.shake[p] > 0 ? Math.sin(g.shake[p] * 50) * 6 : 0;
        // brass plate with the place number
        if (!spin) {
          const y0 = 194;
          rrect(x - 21 + shk, y0 - 12, 42, 24, 9, g.selA >= 0 && g.pole[p] < 0 ? '#fff3a0' : '#ffe9a8', OL, 2);
          text(ORDS[p], x + shk, y0 + 1, 15, '#7a2a6e', 'center', 700);
        }
        if (i >= 0) {
          ctx.save(); ctx.globalAlpha = spin ? 0.1 + 0.9 * (z + 1) / 2 : 1;
          drawCarouselAnimal(g.ani[i], g.deco[i], x, R1.poleY + bob, F * s);
          ctx.restore();
        } else if (!spin) {
          const hl = g.selA >= 0 || (g.drag?.kind === 'animal' && !g.pole.includes(g.drag.i));
          ctx.setLineDash([7, 6]); ctx.strokeStyle = hl ? 'rgba(255,246,168,.95)' : 'rgba(255,255,255,.6)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(x + shk, R1.poleY, F * 0.42, F * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,255,255,.15)'; ellipse(x + shk, R1.poleY, F * 0.42, F * 0.4);
        }
      }, p => this.poleX(g, p));
      // order card
      const ch = 34 + g.n * 36;
      panel(10, 66, 176, ch, 16);
      text('🎟 Order card', 98, 84, 16, '#c0397e', 'center', 700);
      for (let i = 0; i < g.n; i++) {
        const y = 108 + i * 36, done = g.pole[i] >= 0, a = g.ani[i];
        if (g.selA === i && g.tier === 1) rrect(14, y - 16, 168, 32, 10, '#fff3a0');
        ctx.globalAlpha = done ? 0.45 : 1;
        if (g.tier === 1) text(ORDS[i], 22, y, 18, '#7a2a6e', 'left', 700);
        else text(ORDW[i], 18, y, 15, '#7a2a6e', 'left', 700);
        emoji(a.e, g.tier === 1 ? 86 : 100, y, 26);
        text(a.n, g.tier === 1 ? 104 : 116, y, 13, '#5a2a6e', 'left', 600);
        ctx.globalAlpha = 1;
        if (done) text('✓', 177, y, 18, '#2fae5a', 'center', 700);
      }
      ringmaster(98, 536, 0.48);
      // decoration palette
      panel(PAL.x, PAL.y, PAL.w, 392, 16);
      text('✨ Decorate', PAL.x + PAL.w / 2, PAL.y + 16, 16, '#c0397e', 'center', 700);
      DECO.forEach((it, di) => {
        const c = decoCell(di), cx = c.x + c.w / 2, cy = c.y + 15;
        rrect(c.x, c.y, c.w, c.h, 10, g.selDeco === di ? '#fff3a0' : '#f6ecff', g.selDeco === di ? '#ffb000' : '#e2c6f5', g.selDeco === di ? 3 : 1.5);
        this.decoIcon(it, cx, cy, 1);
        text(it.n, cx, c.y + 33, 10, '#7a4a8e', 'center', 600);
      });
      button('cdUndo', PAL.x + 8, PAL.y + 400, PAL.w - 16, 44, 'Undo', { icon: '↩️', color: '#9a6ae0', size: 17 });
      // the waiting line (tray)
      if (g.r1 === 'build') {
        rrect(R1.L, 428, R1.R - R1.L, 104, 18, 'rgba(255,248,252,.92)', '#e2c6f5', 3);
        text('Waiting animals: drag each one to its pole', (R1.L + R1.R) / 2, 440, 12, '#9a6aae', 'center', 600);
        const tf = this.trayF(g);
        g.tray.forEach((i, k) => {
          if (g.pole.includes(i) || (g.drag?.kind === 'animal' && g.drag.i === i && g.drag.moved)) return;
          const x = this.trayX(g, k);
          if (g.selA === i) { ctx.fillStyle = 'rgba(255,220,80,.5)'; ellipse(x, R1.trayY + 4, tf * 0.6, tf * 0.5); }
          drawCarouselAnimal(g.ani[i], g.deco[i], x, R1.trayY + 6 + Math.sin(t * 3 + k) * (g.selA === i ? 4 : 0), tf);
        });
        if (g.hint) outlined(g.hint, 488, 416, 18, '#fff6a8');
      } else if (g.r1 === 'admire') {
        rrect(R1.L + 80, 440, R1.R - R1.L - 160, 80, 18, 'rgba(255,248,252,.92)', '#e2c6f5', 3);
        text('What a beautiful carousel!', 488, 462, 18, '#c0397e', 'center', 700);
        button('cdNext', 488 - 140, 476, 280, 40, 'Next: design the ring!', { icon: '🎪', color: '#5fb87a', size: 17, key: 'Enter' });
      } else {
        outlined('All aboard!', 488, 470, 40, '#fff6a8');
      }
      // dragged thing follows the pointer
      const d = g.drag;
      if (d && d.moved) {
        if (d.kind === 'animal') { const i = d.i; drawCarouselAnimal(g.ani[i], g.deco[i], pointer.x, pointer.y, F * 1.05); }
        else { ctx.save(); ctx.globalAlpha = 0.9; inkCircle(pointer.x, pointer.y, 26, '#fff', 1.2); this.decoIcon(DECO[d.di], pointer.x, pointer.y, 1.4); ctx.restore(); }
      }
    },
    decoIcon(it, cx, cy, k) {
      if (it.k === 'color') {
        if (it.v === 'rainbow') RAINBOW.forEach((c, j) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 11 * k, j * Math.PI / 3, (j + 1) * Math.PI / 3); ctx.fill(); });
        else inkCircle(cx, cy, 10 * k, it.v, 1);
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 11 * k, 0, Math.PI * 2); ctx.stroke();
      } else if (it.k === 'pattern') {
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 11 * k, 0, Math.PI * 2); ctx.fillStyle = '#ffd6ec'; ctx.fill(); ctx.clip();
        ctx.translate(cx - 30 * k, cy - 30 * k); ctx.scale(0.38 * k, 0.38 * k); patternFill(ctx, it.v, it.v === 'hearts' ? '#ff4f9a' : it.v === 'stars' ? '#e8a000' : '#a14fff');
        ctx.restore();
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 11 * k, 0, Math.PI * 2); ctx.stroke();
      } else {
        const off = { saddle: [0, -2, 0.55], bow: [0, 0, 0.7], flower: [0, 2, 0.62], plume: [0, 10, 0.5], ribbon: [-12, -4, 0.5], jewel: [0, 4, 0.7] }[it.v];
        ACC[it.v](cx + off[0] * k, cy + off[1] * k, off[2] * k);
      }
    },
    draw2(g) {
      const t = S.t, sh = g.showT;
      ringInterior(t);
      // pieces, back to front; selected one gets a glow ring on the floor
      const ord = g.items.map((it, i) => i).sort((a, b) => g.items[a].y - g.items[b].y);
      for (const i of ord) {
        const it = g.items[i];
        if (i === g.sel && sh < 0) { ctx.strokeStyle = `rgba(255,246,120,${0.7 + 0.3 * Math.sin(t * 6)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(it.x, it.y, 52 * it.s, 18 * it.s, 0, 0, Math.PI * 2); ctx.stroke(); }
        drawPiece(it.k, it.x, it.y, it.s, it.rot, t, sh);
      }
      if (sh >= 0) this.drawShow(g, sh);
      ringmaster(176, 534, 0.5, sh >= 0 && Math.floor(sh * 1.5) % 4 === 3 ? 'twirl' : 'idle_front');
      if (sh >= 0) {
        if (sh < 3) outlined("Aubrey's Amazing Circus!", W / 2, 100, 36, '#fff6a8');
        else if (sh > 6.5) outlined('Ta-da!', W / 2, 100, 48, '#fff6a8');
        return;
      }
      // left: required pieces checklist
      panel(LP.x, LP.y, LP.w, 34 + g.req.length * 42, 16);
      text('🎪 Ring pieces', LP.x + LP.w / 2, LP.y + 16, 15, '#c0397e', 'center', 700);
      g.req.forEach((k, i) => {
        const r = reqRow(g, i), done = g.items.some(it => it.k === k);
        rrect(r.x, r.y, r.w, r.h, 10, done ? '#e3f7e8' : '#fff3fa', done ? '#8fd4a0' : '#ffb3d8', 2);
        ctx.save(); ctx.globalAlpha = done ? 0.4 : 1; pieceIcon(k, r.x + 22, r.y + r.h / 2, 32); ctx.restore();
        text(PIECES[k].n, r.x + 44, r.y + r.h / 2, 13, done ? '#5a9a6a' : '#5a2a6e', 'left', 700);
        if (done) text('✓', r.x + r.w - 12, r.y + r.h / 2, 18, '#2fae5a', 'center', 700);
      });
      // right: extras
      panel(RP.x, RP.y, RP.w, 336, 16);
      text('✨ Extras', RP.x + RP.w / 2, RP.y + 16, 15, '#c0397e', 'center', 700);
      EXTRAS.forEach((k, i) => {
        const c = extraCell(i);
        rrect(c.x, c.y, c.w, c.h, 10, '#f6ecff', '#e2c6f5', 1.5);
        if (k === 'pinklight' || k === 'bluelight') { ctx.save(); ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 10); ctx.clip(); ctx.fillStyle = '#3a1a50'; ctx.fillRect(c.x, c.y, c.w, c.h); pieceIcon(k, c.x + c.w / 2, c.y + 18, 44); ctx.restore(); }
        else pieceIcon(k, c.x + c.w / 2, c.y + 18, 30);
        text(PIECES[k].n, c.x + c.w / 2, c.y + 38, 10, k.endsWith('light') ? '#fff' : '#7a4a8e', 'center', 600);
      });
      if (g.allIn) button('cdShow', RP.x, 410 + Math.sin(t * 5) * 2, RP.w, 56, 'Show time!', { icon: '🎺', color: '#ff5f9a', size: 18, key: 'Enter' });
      else { rrect(RP.x, 410, RP.w, 56, 16, 'rgba(48,24,72,.7)'); text(`${g.req.filter(k => !g.items.some(it => it.k === k)).length} pieces to go`, RP.x + RP.w / 2, 438, 14, '#fff', 'center', 600); }
      button('cdUndo', RP.x, 476, RP.w, 48, 'Undo', { icon: '↩️', color: '#9a6ae0', size: 17 });
      // tools for the chosen piece
      const sel = g.items[g.sel];
      if (sel && !(g.drag && g.drag.moved)) {
        const bx = clamp(sel.x - 104, 160, 800 - 208), by = clamp(sel.y - 150 * sel.s - 50, 64, 470);
        darkPanel(bx - 4, by - 4, 216, 52, 14);
        button('cdRot', bx, by, 48, 44, '↻', { color: '#5ab8ff', size: 24 });
        button('cdBig', bx + 52, by, 48, 44, '+', { color: '#5fb87a', size: 26 });
        button('cdSmall', bx + 104, by, 48, 44, '−', { color: '#ffa53a', size: 26 });
        button('cdDel', bx + 156, by, 48, 44, '✖', { color: '#ff5f7e', size: 20 });
      }
      const d = g.drag;
      if (d && d.moved && d.kind === 'new') {
        const ok = !PIECES[d.k].req || inRing(pointer.x, pointer.y + 10);
        ctx.save(); ctx.globalAlpha = ok ? 0.95 : 0.55; drawPiece(d.k, pointer.x, pointer.y + 10, 1, 0, t); ctx.restore();
      }
      if (!g.items.length) outlined('Drag the pieces into the ring!', RING.cx, RING.cy, 26, '#fff6a8');
    },
    drawShow(g, sh) {
      // lights down, pools of light on every act, then the performers
      ctx.fillStyle = `rgba(20,0,40,${Math.min(0.55, sh * 0.5)})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const it of g.items) if (PIECES[it.k].req) {
        const gr = ctx.createRadialGradient(it.x, it.y - 30, 8, it.x, it.y - 30, 110 * it.s);
        gr.addColorStop(0, 'rgba(255,240,190,.45)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = gr; ctx.fillRect(it.x - 120 * it.s, it.y - 150 * it.s, 240 * it.s, 240 * it.s);
      }
      ctx.restore();
      for (const it of g.items) {
        const s = it.s, p = sh * 1.0;
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot); ctx.scale(s, s);
        switch (it.k) {
          case 'trampoline': emoji('🤸', 0, -44 - Math.abs(Math.sin(p * 3)) * 110, 46); break;
          case 'hoop': { const k = (p * 0.6) % 1, x = -110 + 220 * k; emoji('🐅', x, -74 - Math.sin(k * Math.PI) * 30 + 10, 44); break; }
          case 'pedestal': ctx.save(); ctx.translate(0, -50); ctx.rotate(Math.sin(p * 2) * 0.25); emoji('🐘', 0, -24, 50); ctx.restore(); break;
          case 'ball': emoji('🐻', Math.sin(p * 2) * 6, -74, 44); break;
          case 'tightrope': { const k = (Math.sin(p * 0.9) + 1) / 2, x = -60 + 120 * k; emoji('🤹', x, -118 + Math.sin(k * Math.PI) * 6, 40); break; }
          case 'drum': emoji('🐒', -40, -30, 40); if (Math.sin(p * 12) > 0.9) emoji('💥', 0, -60, 26); break;
          case 'ladder': { const k = (Math.sin(p * 1.2) + 1) / 2; emoji('🐿️', 0, -14 - k * 110, 34); break; }
          case 'spotlight': break;
          case 'seal': emoji('⚽', 0, -70 - Math.abs(Math.sin(p * 4)) * 20, 22); break;
          case 'poodle': ctx.rotate(Math.sin(p * 4) * 0.3); break;
        }
        ctx.restore();
      }
    },
  };

  restage('carnival', {
    mid: ['N:Bravo! Now I need a DESIGNER for my carousel and my circus ring!',
      'N:First, line the carousel animals up in the order on my card. Then dress them up as fancy as you like!',
      'A:excited:First, second, third... and sparkly too!'],
  });
}
