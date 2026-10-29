'use strict';
// Mrs. Pickett's Garden, game 2: Veggie Patch Pull. Mrs. Pickett's list shows a row of
// vegetables in a pattern. Grab a leafy top and PULL (hold, or drag upward) until the veggie
// pops out of the ground and sails into her basket, in the list's order. Harder tiers hide the
// end of the list, so you have to continue the pattern. A mole tries to tug veggies underground
// and a cheeky crow pecks at the tops: tap them to shoo them away!
{
  // ---------------------------------------------------------------------------------------------
  // vegetables
  const VEG = {
    carrot: {
      name: 'carrot', many: 'carrots', col: 'orange', grad: ['#ffc27a', '#ff8a2a', '#e0601a'], face: 20,
      root: P2('M-16,0 C-17,28 -7,60 0,88 C7,60 17,28 16,0 C9,-5 -9,-5 -16,0 Z'),
      fact: 'Carrots are roots! The orange part grows down under the dirt and drinks up water for the plant.',
    },
    beet: {
      name: 'beet', many: 'beets', col: 'purple', grad: ['#e0508a', '#b4235e', '#86104a'], face: 24,
      root: P2('M0,-3 C19,-3 28,12 27,27 C26,42 13,51 3,53 C2,62 1,68 0,76 C-1,68 -2,62 -3,53 C-13,51 -26,42 -27,27 C-28,12 -19,-3 0,-3 Z'),
      fact: 'Beets are so purple-red that their juice can turn your fingers pink!',
    },
    radish: {
      name: 'radish', many: 'radishes', col: 'red', grad: ['#ff6a86', '#ff2f5a', '#fff4f4'], face: 17,
      root: P2('M0,-2 C15,-2 21,10 20,21 C19,32 10,38 2,40 C1,46 1,50 0,58 C-1,50 -1,46 -2,40 C-10,38 -19,32 -20,21 C-21,10 -15,-2 0,-2 Z'),
      fact: 'Radishes grow super fast. You can plant them and pull them up just a month later!',
    },
    onion: {
      name: 'onion', many: 'onions', col: 'yellow', grad: ['#fff0a8', '#f6be4a', '#c8822a'], face: 26,
      root: P2('M0,-4 C9,-4 12,4 20,14 C30,28 24,46 3,50 L0,56 L-3,50 C-24,46 -30,28 -20,14 C-12,4 -9,-4 0,-4 Z'),
      fact: 'Onions grow in layers, like a present wrapped up again and again!',
    },
  };
  const KIND_LIST = ['carrot', 'beet', 'radish', 'onion'];
  const BEET_LEAF = P2('M0,0 C-15,-16 -22,-46 -2,-72 C20,-48 15,-18 0,0 Z');
  const RAD_LEAF = P2('M0,0 C-5,-12 -21,-26 -15,-42 C-8,-56 10,-55 14,-42 C19,-27 6,-13 0,0 Z');

  const CFG = [null,
    { len: 5, hide: [0, 0, 1], units: ['AB', 'AAB', 'ABC'], kinds: 3, mole: [8, 13], moleSteal: 5.5, crow: null, crowStay: 6, big: 0 },
    { len: 6, hide: [1, 2, 2], units: ['AB', 'ABC', 'AAB', 'ABB'], kinds: 3, mole: [8, 12], moleSteal: 5, crow: [10, 15], crowStay: 5.5, big: 0.15 },
    { len: 7, hide: [2, 2, 3], units: ['ABC', 'AAB', 'ABB', 'AABB', 'ABCD'], kinds: 4, mole: [6, 10], moleSteal: 4.5, crow: [8, 12], crowStay: 5, big: 0.25 }];
  const ROUNDS = 3;
  const BASE = 17;  // how much of a veggie's shoulder peeks out of the soil
  const PULL_TIME = 0.8;  // seconds of holding to pop a normal veggie (dragging up is faster)
  const ROWS = [350, 472];
  const COLS = [[300, 445, 590, 735, 878], [330, 475, 620, 765, 902]];
  const BASKET = { x: 150, y: 478 };
  const BED = { x0: 236, x1: 948, y0: 256, y1: 500 };
  const SOIL = '#6a4230', SOIL_L = '#8c5a3c', SOIL_D = '#4c2c20';
  const easeBack = k => { const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const aName = k => (k === 'carrot' ? 'an orange carrot' : `a ${VEG[k].col} ${VEG[k].name}`);

  // offscreen layer at device resolution; swaps the global ctx while painting
  const bake = paint => {
    const c = document.createElement('canvas');
    c.width = W * DPR; c.height = H * DPR;
    const old = ctx;
    ctx = c.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    try { paint(); } finally { ctx = old; }
    return c;
  };
  let BG = null;

  // ---------------------------------------------------------------------------------------------
  // vegetable art. origin = the crown (where leaves meet root); root hangs down, tops grow up.
  // Two passes so overlapping leaves + root read as one outlined shape: pass 0 ink, pass 1 colour.
  function tops(k, pass, t, sway, nib) {
    const v = VEG[k], L = 1 - nib * 0.35;
    if (k === 'carrot') {
      const angs = [-0.55, -0.18, 0.2, 0.56];
      angs.forEach((a0, i) => {
        const a = a0 + sway * (1 + i * 0.2) + Math.sin(t * 2.2 + i) * 0.04;
        const len = (60 + (i % 2) * 10) * L, tx = Math.sin(a) * len, ty = -Math.cos(a) * len;
        const mx = Math.sin(a * 0.5) * len * 0.5, my = -len * 0.55;
        ctx.lineCap = 'round';
        ctx.strokeStyle = pass ? '#58b848' : OL; ctx.lineWidth = pass ? 3.5 : 8;
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
        for (const f of [0.4, 0.58, 0.76, 0.94]) {
          const px = 2 * f * (1 - f) * mx + f * f * tx, py = -2 * (1 - f) * (1 - f) + 2 * f * (1 - f) * my + f * f * ty;
          for (const d of [-1, 1]) {
            const r = f > 0.9 ? 8 : 7;
            ctx.beginPath(); ctx.ellipse(px + d * 6, py - 2, r, 4, a + d * 0.9, 0, Math.PI * 2);
            if (pass) { ctx.fillStyle = f > 0.7 ? '#7ad464' : '#4fb444'; ctx.fill(); } else { ctx.lineWidth = 5; ctx.stroke(); }
          }
        }
      });
    } else if (k === 'onion') {
      // tall, straight hollow tubes
      [-0.32, -0.1, 0.12, 0.34].forEach((a0, i) => {
        const a = a0 + sway * 0.6 + Math.sin(t * 1.8 + i) * 0.025, len = (78 + (i % 2) * 14) * L;
        const tx = Math.sin(a) * len, ty = -Math.cos(a) * len - 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = pass ? '#6ccf6a' : OL; ctx.lineWidth = pass ? 6 : 11;
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(tx * 0.4, ty * 0.6, tx, ty); ctx.stroke();
        if (pass) { ctx.strokeStyle = '#a8ec98'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-1, -8); ctx.quadraticCurveTo(tx * 0.4 - 1.5, ty * 0.6, tx - 1, ty + 6); ctx.stroke(); }
      });
    } else {
      const leaf = k === 'beet' ? BEET_LEAF : RAD_LEAF;
      const angs = k === 'radish' ? [-0.8, -0.28, 0.28, 0.8] : [-0.6, 0, 0.6];
      const fill = k === 'beet' ? '#3f9e4c' : '#5cc84a';
      const vein = k === 'beet' ? '#c8235e' : '#3e9a36';
      angs.forEach((a0, i) => {
        const a = a0 + sway * (1 + i * 0.25) + Math.sin(t * 2 + i * 1.7) * 0.05;
        ctx.save(); ctx.rotate(a); ctx.scale(1, L);
        if (!pass) { ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(leaf); } else {
          ctx.fillStyle = fill; ctx.fill(leaf);
          ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.save(); ctx.clip(leaf); ellipse(-8, -40, 6, 18, 0.2); ctx.restore();
          ctx.strokeStyle = vein; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-2, -30, -2, k === 'radish' ? -46 : -64); ctx.stroke();
          ctx.lineWidth = 1.4;
          for (const yy of [-22, -36, -50]) { ctx.beginPath(); ctx.moveTo(-1, yy); ctx.lineTo(-10, yy - 8); ctx.moveTo(-1, yy + 4); ctx.lineTo(8, yy - 4); ctx.stroke(); }
        }
        ctx.restore();
      });
    }
  }
  function root(k, pass, mood) {
    const v = VEG[k];
    if (!pass) { ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(v.root); return; }
    const gr = ctx.createLinearGradient(-20, 0, 20, k === 'carrot' ? 60 : 50);
    if (k === 'radish') {
      const g2 = ctx.createLinearGradient(0, -4, 0, 56);
      g2.addColorStop(0, v.grad[0]); g2.addColorStop(0.42, v.grad[1]); g2.addColorStop(0.75, v.grad[2]); g2.addColorStop(1, v.grad[2]);
      ctx.fillStyle = g2;
    } else { gr.addColorStop(0, v.grad[0]); gr.addColorStop(0.5, v.grad[1]); gr.addColorStop(1, v.grad[2]); ctx.fillStyle = gr; }
    ctx.fill(v.root);
    ctx.save(); ctx.clip(v.root);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    if (k === 'carrot') ellipse(-8, 22, 3.5, 16, 0.12); else ellipse(-11, 16, 5, 9, 0.5);
    ctx.strokeStyle = k === 'carrot' ? '#c8541a' : k === 'beet' ? '#7a0c3e' : 'rgba(120,80,120,.45)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    if (k === 'onion') {
      ctx.strokeStyle = 'rgba(170,100,30,.55)';
      for (const d of [-14, -6, 6, 14]) { ctx.beginPath(); ctx.moveTo(d * 0.3, 0); ctx.quadraticCurveTo(d * 1.6, 24, d * 0.5, 48); ctx.stroke(); }
    } else {
      const rings = k === 'carrot' ? [[10, 1], [30, -1], [46, 1], [62, -1]] : [[38, 1], [44, -1]];
      for (const [y, d] of rings) { ctx.beginPath(); ctx.moveTo(d * 4, y); ctx.quadraticCurveTo(d * 10, y + 2, d * 13, y - 1); ctx.stroke(); }
    }
    ctx.restore();
    if (mood == null) return;
    // a little face: surprised while being pulled, happy in the basket
    const fy = v.face;
    ctx.fillStyle = 'rgba(255,120,150,.55)'; ellipse(-11, fy + 6, 4.5, 2.6); ellipse(11, fy + 6, 4.5, 2.6);
    ctx.fillStyle = '#3a2440'; ellipse(-6, fy, 2.8, 3.6); ellipse(6, fy, 2.8, 3.6);
    ctx.fillStyle = '#fff'; circle(-5, fy - 1.4, 1.1); circle(7, fy - 1.4, 1.1);
    ctx.strokeStyle = '#3a2440'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    if (mood === 'o') { ctx.fillStyle = '#7a2a3a'; ellipse(0, fy + 8, 2.6, 3.4); }
    else if (mood === 'sad') { ctx.beginPath(); ctx.arc(0, fy + 11, 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, fy + 5, 4.5, 0.2, Math.PI - 0.2); ctx.stroke(); }
  }
  // a whole veggie; mood null = no face
  function veg(k, x, y, s, rot, t, { sway = 0, nib = 0, mood = null, noRoot = false } = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    for (const pass of [0, 1]) { tops(k, pass, t, sway, nib); if (!noRoot) root(k, pass, pass ? mood : null); }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // the cached garden: sky, fence, flowers, lawn, the raised bed with its soil ridges
  const paintBG = () => {
    const sk = ctx.createLinearGradient(0, 0, 0, 260);
    sk.addColorStop(0, '#7cc8ff'); sk.addColorStop(1, '#dff4ff');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    // soft sunbeams from the top left
    ctx.fillStyle = 'rgba(255,250,210,.22)';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(260 + i * 190, 260); ctx.lineTo(330 + i * 190, 260); ctx.closePath(); ctx.fill(); }
    // hills
    ctx.fillStyle = '#a9dc8e'; ctx.beginPath(); ctx.moveTo(0, 220);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 196 + Math.sin(x / 150) * 20 + Math.sin(x / 47) * 4);
    ctx.lineTo(W, 300); ctx.lineTo(0, 300); ctx.fill();
    ctx.fillStyle = '#8fd07a'; ctx.beginPath(); ctx.moveTo(0, 240);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 222 + Math.sin(x / 110 + 2) * 12);
    ctx.lineTo(W, 300); ctx.lineTo(0, 300); ctx.fill();
    // distant trees
    for (const [x, r] of [[60, 34], [120, 26], [590, 30], [650, 22], [940, 32]]) {
      ctx.fillStyle = '#6fb460'; circle(x, 214 - r * 0.6, r); ctx.fillStyle = '#82c46c'; circle(x - r * 0.3, 206 - r * 0.8, r * 0.55);
    }
    // white picket fence
    const fy = 214;
    for (let x = -10; x < W + 20; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, fy + 66); ctx.lineTo(x, fy + 8); ctx.lineTo(x + 10, fy - 4); ctx.lineTo(x + 20, fy + 8); ctx.lineTo(x + 20, fy + 66); ctx.closePath();
      ctx.fillStyle = '#fffaf4'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = 'rgba(160,140,200,.18)'; ctx.fillRect(x + 14, fy + 8, 5, 56);
    }
    for (const yy of [fy + 18, fy + 46]) inkRect(-10, yy, W + 20, 9, '#fffaf4', 2.2, 3);
    // hollyhocks and sunflowers along the fence
    const holly = (x, h, col) => {
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, fy + 70); ctx.lineTo(x, fy + 70 - h); ctx.stroke();
      ctx.strokeStyle = '#4a9a3e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, fy + 70); ctx.lineTo(x, fy + 70 - h); ctx.stroke();
      for (let i = 0; i < 5; i++) flower(x + (i % 2 ? 6 : -6), fy + 70 - h + i * 16, 9 - i * 0.6, col, '#fff3a0', 1.2);
    };
    holly(178, 120, '#ff8fc0'); holly(206, 96, '#ffffff'); holly(560, 104, '#d79bff'); holly(612, 118, '#ff8fc0');
    const sunflower = (x, h) => {
      ctx.strokeStyle = OL; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, fy + 70); ctx.quadraticCurveTo(x + 8, fy + 70 - h / 2, x, fy + 70 - h); ctx.stroke();
      ctx.strokeStyle = '#4a9a3e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, fy + 70); ctx.quadraticCurveTo(x + 8, fy + 70 - h / 2, x, fy + 70 - h); ctx.stroke();
      const cy = fy + 70 - h;
      for (const pass of [0, 1]) for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 17, cy + Math.sin(a) * 17, 11, 5, a, 0, Math.PI * 2);
        if (pass) { ctx.fillStyle = i % 2 ? '#ffd23a' : '#ffbf1a'; ctx.fill(); } else { ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(); }
      }
      inkCircle(x, cy, 12, '#8a4a22', 1.5);
      ctx.fillStyle = '#5e2e14'; for (let i = 0; i < 7; i++) circle(x + Math.cos(i * 2.4) * 6, cy + Math.sin(i * 2.4) * 6, 1.6);
    };
    sunflower(26, 132); sunflower(232, 150); sunflower(516, 122);
    // the lawn
    const lg = ctx.createLinearGradient(0, 280, 0, H);
    lg.addColorStop(0, '#86d066'); lg.addColorStop(1, '#5fb84c');
    ctx.fillStyle = lg; ctx.fillRect(0, 280, W, H);
    ctx.strokeStyle = '#4fa63e'; ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const x = (i * 137) % W, y = 290 + ((i * 71) % 250);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 8); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 9); ctx.stroke();
    }
    for (const [x, y, c] of [[30, 520, '#ffffff'], [212, 300, '#ffd84a'], [24, 330, '#ff9fc8'], [214, 520, '#c9a0ff'], [190, 404, '#ffffff']]) flower(x, y, 8, c, '#ffcf3a', 1);
    // stepping stones to the bed
    for (const [x, y] of [[214, 362], [206, 432]]) { inkEllipse(x, y, 20, 9, 0, '#cfc6d6', 1.2); ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(x - 5, y - 3, 8, 3); }
    // the raised bed: back plank, soil, side planks
    const { x0, x1, y0, y1 } = BED;
    inkRect(x0 - 6, y0 - 14, x1 - x0 + 12, 26, '#c48a54', 2.6, 6);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(x0, y0 - 10, x1 - x0, 5);
    const sg = ctx.createLinearGradient(0, y0, 0, y1);
    sg.addColorStop(0, '#5a3626'); sg.addColorStop(1, '#6e4430');
    ctx.fillStyle = sg; ctx.fillRect(x0, y0 + 10, x1 - x0, y1 - y0 + 30);
    ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.strokeRect(x0, y0 + 10, x1 - x0, y1 - y0 + 30);
    // soil crumbs texture
    for (let i = 0; i < 260; i++) {
      const x = x0 + 6 + ((i * 97) % (x1 - x0 - 12)), y = y0 + 16 + ((i * 53) % (y1 - y0 + 10));
      ctx.fillStyle = i % 3 ? 'rgba(40,20,10,.35)' : 'rgba(170,120,80,.35)'; circle(x, y, 1.5 + (i % 3) * 0.6);
    }
    // raised soil ridges for the two rows (ink first, then fill)
    ROWS.forEach((ry, r) => {
      const xs = COLS[r];
      ctx.fillStyle = OL; ctx.beginPath(); ctx.ellipse((xs[0] + xs[4]) / 2, ry + 4, (xs[4] - xs[0]) / 2 + 66, 21, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = SOIL_L; ctx.beginPath(); ctx.ellipse((xs[0] + xs[4]) / 2, ry + 4, (xs[4] - xs[0]) / 2 + 64, 19, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a0704a'; ctx.beginPath(); ctx.ellipse((xs[0] + xs[4]) / 2, ry - 2, (xs[4] - xs[0]) / 2 + 52, 9, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 40; i++) { ctx.fillStyle = i % 2 ? 'rgba(60,30,15,.4)' : 'rgba(200,150,100,.4)'; circle(xs[0] - 50 + i * 16 + (i % 3) * 3, ry + 4 + ((i * 7) % 12) - 6, 1.8); }
    });
    // little tools and pebbles in the bed
    for (const [x, y] of [[262, 420], [924, 418], [520, 412], [380, 300], [810, 300]]) { inkEllipse(x, y, 6, 4, 0.3, '#cfc6d6', 1); }
    // trowel stuck in the soil at the right end
    ctx.save(); ctx.translate(930, 300); ctx.rotate(0.25);
    inkRect(-4, -44, 8, 30, '#d86a8a', 2, 3);
    ctx.beginPath(); ctx.moveTo(-11, -14); ctx.lineTo(11, -14); ctx.lineTo(0, 16); ctx.closePath();
    ctx.fillStyle = '#c8d4e0'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
    // side planks and the front plank
    inkRect(x0 - 12, y0 - 10, 16, y1 - y0 + 60, '#b47a48', 2.6, 5);
    inkRect(x1 - 4, y0 - 10, 16, y1 - y0 + 60, '#b47a48', 2.6, 5);
    inkRect(x0 - 14, y1 + 6, x1 - x0 + 28, 30, '#c48a54', 2.8, 6);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x0 - 8, y1 + 10, x1 - x0 + 16, 5);
    ctx.strokeStyle = 'rgba(120,70,40,.5)'; ctx.lineWidth = 1.5;
    for (let x = x0 + 40; x < x1; x += 120) { ctx.beginPath(); ctx.moveTo(x, y1 + 14); ctx.quadraticCurveTo(x + 30, y1 + 20, x + 60, y1 + 16); ctx.stroke(); }
    for (const x of [x0 + 8, x1 - 8]) { ctx.fillStyle = '#6a4a3a'; circle(x, y1 + 21, 2.5); }
  };

  // ---------------------------------------------------------------------------------------------
  // critters and props
  function mole(x, y, rise, t, st, bonkT) {
    // the molehill
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 60, y - 120, 120, 120 + 6); ctx.clip();
    const up = (1 - rise) * 56, tug = st === 'tug' ? Math.sin(t * 12) * 3 : 0;
    ctx.translate(x + tug, y + up);
    ctx.lineJoin = 'round';
    // body + head outline first, then fills
    ctx.fillStyle = OL; ellipse(0, -22, 27, 30); circle(0, -50, 22);
    ctx.fillStyle = '#6a5a6e'; ellipse(0, -22, 24.5, 27.5); circle(0, -50, 19.5);
    ctx.fillStyle = '#8a7a8e'; ellipse(-6, -56, 9, 7);
    ctx.fillStyle = '#d8c4cc'; ellipse(0, -16, 14, 16);
    // nose
    inkCircle(0, -42, 7, '#ff8fb0', 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(-2, -44, 2);
    // eyes: squinty, or spinning when bonked
    ctx.strokeStyle = '#2a1a30'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    if (st === 'bonk') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 9 - 3, -57); ctx.lineTo(d * 9 + 3, -51); ctx.moveTo(d * 9 + 3, -57); ctx.lineTo(d * 9 - 3, -51); ctx.stroke(); }
    } else for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 9, -54, 3.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,120,150,.5)'; ellipse(-14, -45, 4, 2.5); ellipse(14, -45, 4, 2.5);
    // big pink digging paws
    for (const d of [-1, 1]) {
      const px = d * 22 + (st === 'tug' ? Math.sin(t * 12 + d) * 3 : 0), py = -30;
      inkEllipse(px, py, 10, 8, d * 0.4, '#ff9fbf', 1.4);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(px + d * 6 + i * 3, py - 3); ctx.lineTo(px + d * 11 + i * 3, py - 7); ctx.stroke(); }
    }
    ctx.restore();
    // dirt mound in front
    ctx.fillStyle = OL; ellipse(x, y + 2, 34, 13);
    ctx.fillStyle = '#7a4c34'; ellipse(x, y + 2, 32, 11);
    ctx.fillStyle = '#9a6a48'; ellipse(x - 6, y - 3, 18, 4);
    ctx.fillStyle = SOIL_D; for (const [dx, dy] of [[-22, 6], [18, 4], [4, 9]]) circle(x + dx, y + dy, 3);
    if (st === 'bonk') for (let i = 0; i < 3; i++) {
      const a = t * 6 + i * 2.1;
      star(x + Math.cos(a) * 26, y - 62 + up + Math.sin(a) * 8, 7, '#ffe04a', 5);
    }
  }
  function crow(x, y, dir, flap, t, peck, carry) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (carry) veg(carry, 6, 34, 0.55, 0.3 + Math.sin(t * 8) * 0.2, t, { mood: 'sad' });
    const w = Math.sin(flap) * 0.9;
    const head = peck ? Math.max(0, Math.sin(t * 9)) * 10 : 0;
    // legs
    ctx.strokeStyle = '#e8902a'; ctx.lineWidth = 3;
    if (!flap || peck) { ctx.beginPath(); ctx.moveTo(-4, 14); ctx.lineTo(-6, 26); ctx.moveTo(6, 14); ctx.lineTo(6, 26); ctx.stroke(); }
    // ink pass: tail, body, head, wing
    const tail = P2('M-20,0 L-46,-8 L-48,6 L-44,14 L-18,10 Z');
    const wing = P2('M0,0 C-10,-6 -34,-8 -44,2 C-34,6 -18,10 0,8 Z');
    const hx = 22, hy = -14 + head;
    ctx.strokeStyle = OL; ctx.lineWidth = 5;
    ctx.stroke(tail); ctx.beginPath(); ctx.ellipse(0, 2, 24, 16, -0.1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, hy, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2e2a48'; ctx.fill(tail);
    ctx.beginPath(); ctx.ellipse(0, 2, 24, 16, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx, hy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a4470'; ellipse(-4, -4, 12, 6, -0.2);
    // beak
    ctx.beginPath(); ctx.moveTo(hx + 9, hy - 5); ctx.lineTo(hx + 26, hy + 1 + head * 0.3); ctx.lineTo(hx + 9, hy + 5); ctx.closePath();
    ctx.fillStyle = '#ffc23a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    // eye
    inkCircle(hx + 2, hy - 3, 5, '#fff', 1);
    ctx.fillStyle = '#1a1020'; circle(hx + 3.5, hy - 3, 2.6);
    ctx.fillStyle = '#fff'; circle(hx + 4.4, hy - 4.2, 0.9);
    // wing (flaps up when flying)
    ctx.save(); ctx.translate(4, -4); ctx.rotate(flap ? -0.3 + w : 0.15);
    ctx.strokeStyle = OL; ctx.lineWidth = 4.5; ctx.stroke(wing);
    ctx.fillStyle = '#3c3660'; ctx.fill(wing);
    ctx.strokeStyle = '#5a5488'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, 3); ctx.lineTo(-38, 3); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
  function basket(x, y, n, bounce, front) {
    const sq = 1 + bounce * 0.12;
    ctx.save(); ctx.translate(x, y + 40); ctx.scale(sq, 1 / sq); ctx.translate(0, -40);
    const body = P2('M-72,-14 L72,-14 L58,44 C40,50 -40,50 -58,44 Z');
    if (!front) {
      // handle and back rim (behind the pile)
      ctx.lineCap = 'round';
      ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, -10, 62, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.strokeStyle = '#d8a060'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, -10, 62, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.strokeStyle = '#f0c080'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -12, 62, Math.PI * 1.15, Math.PI * 1.5); ctx.stroke();
      inkEllipse(0, -14, 72, 12, 0, '#8a5a30', 1.3);
    } else {
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(body);
      ctx.fillStyle = '#d89a58'; ctx.fill(body);
      ctx.save(); ctx.clip(body);
      ctx.strokeStyle = '#b07038'; ctx.lineWidth = 2.5;
      for (let r = 0; r < 4; r++) for (let c = -6; c <= 6; c++) {
        const yy = -6 + r * 13, xx = c * 12 + (r % 2) * 6;
        ctx.beginPath(); ctx.ellipse(xx, yy, 6, 4.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-60, -12, 120, 6);
      ctx.restore();
      inkRect(-76, -20, 152, 12, '#e8b070', 2.4, 6);
      // a gingham bow
      inkEllipse(-48, -12, 11, 7, -0.4, '#ff8fb5', 1.2); inkEllipse(-30, -12, 11, 7, 0.4, '#ff8fb5', 1.2); inkCircle(-39, -12, 5, '#ff6fa0', 1.2);
      if (n) { rrect(-20, 18, 40, 22, 11, 'rgba(60,30,40,.55)'); text(String(n), 0, 29, 16, '#fff', 'center', 800); }
    }
    ctx.restore();
  }
  function glove(x, y, closed, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.25);
    ctx.lineJoin = 'round';
    const pink = '#ff8fc0';
    // ink pass then fill pass
    for (const pass of [0, 1]) {
      const st = (fn) => { fn(); if (pass) { ctx.fillStyle = pink; ctx.fill(); } else { ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(); } };
      st(() => { ctx.beginPath(); ctx.ellipse(0, 10, 15, 17, 0, 0, Math.PI * 2); });
      if (closed) for (let i = 0; i < 4; i++) st(() => { ctx.beginPath(); ctx.ellipse(-10 + i * 7, -4, 4.5, 6, 0, 0, Math.PI * 2); });
      else for (let i = 0; i < 4; i++) st(() => { ctx.beginPath(); ctx.ellipse(-10 + i * 7, -10 + Math.abs(i - 1.5) * 2, 4, 11, (i - 1.5) * 0.12, 0, Math.PI * 2); });
      st(() => { ctx.beginPath(); ctx.ellipse(-15, 8, 5, 9, -0.6, 0, Math.PI * 2); });
    }
    inkRect(-15, 24, 30, 10, '#fff4f8', 1.6, 4);
    ctx.fillStyle = '#ff6fa0'; for (let i = 0; i < 4; i++) circle(-10 + i * 7, 29, 1.6);
    ctx.restore();
  }
  function butterfly(x, y, t, col) {
    const f = Math.abs(Math.sin(t * 14));
    ctx.save(); ctx.translate(x, y);
    for (const pass of [0, 1]) for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(d * 7 * f, -4, 8 * f + 1, 8, d * 0.4, 0, Math.PI * 2);
      ctx.moveTo(d * 5 * f, 6); ctx.ellipse(d * 5 * f, 6, 5 * f + 1, 5, -d * 0.3, 0, Math.PI * 2);
      if (pass) { ctx.fillStyle = col; ctx.fill(); } else { ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(); }
    }
    ctx.fillStyle = OL; ellipse(0, 0, 2.2, 8);
    ctx.restore();
  }
  function bee(x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = 0.75;
    for (const d of [-1, 1]) inkEllipse(d * 5, -10, 6, 9 * Math.abs(Math.sin(t * 40)) + 2, d * 0.5, '#eaf6ff', 1);
    ctx.globalAlpha = 1;
    inkEllipse(0, 0, 12, 9, 0, '#ffd23a', 1.4);
    ctx.fillStyle = OL; ctx.fillRect(-3, -8, 3.5, 16); ctx.fillRect(4, -7, 3, 14);
    ctx.fillStyle = OL; circle(9, -2, 1.6);
    ctx.restore();
  }
  function worm(x, y, k, t) {
    if (k <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 30, y - 60, 60, 60 + 3); ctx.clip();
    const h = k * 28, sw = Math.sin(t * 7) * 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.quadraticCurveTo(x + sw, y - h * 0.5, x + sw * 0.4, y - h); ctx.stroke();
    ctx.strokeStyle = '#ff9fae'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.quadraticCurveTo(x + sw, y - h * 0.5, x + sw * 0.4, y - h); ctx.stroke();
    ctx.fillStyle = OL; circle(x + sw * 0.4 - 2.4, y - h - 1, 1.6); circle(x + sw * 0.4 + 2.4, y - h - 1, 1.6);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // game logic
  const plotAt = (g, x, y) => {
    let best = -1, bd = 1e9;
    g.plots.forEach((p, i) => {
      if (p.st !== 'ripe') return;
      const dx = x - p.x, dy = y - (p.y - 34);
      if (Math.abs(dx) < 64 && dy > -76 && dy < 50) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
    });
    return best;
  };
  const needKind = g => g.order[g.slot];
  function chooseKind(g) {
    const want = needKind(g);
    if (want && !g.plots.some(p => p.kind === want && (p.st === 'ripe' || p.st === 'sprout' || p.st === 'air'))) return want;
    // otherwise keep the patch varied: favour whatever kind is least common right now
    const cnt = k => g.plots.filter(p => p.kind === k && p.st !== 'empty').length;
    const ks = shuffle(g.kinds).sort((a, b) => cnt(a) - cnt(b));
    return Math.random() < 0.7 ? ks[0] : pick(g.kinds);
  }
  function sprout(g, p, kind) {
    Object.assign(p, { st: 'sprout', kind, grow: 0, pull: 0, sink: 0, nib: 0, big: Math.random() < g.cfg.big, held: false, flash: 0 });
  }
  function newBasket(g) {
    const c = g.cfg;
    const unit = pick(c.units);
    const letters = [...new Set(unit)];
    const ks = shuffle(g.kinds).slice(0, letters.length);
    const map = Object.fromEntries(letters.map((l, i) => [l, ks[i]]));
    const hide = c.hide[g.round];
    const len = Math.min(8, Math.max(c.len, unit.length + 1 + hide));
    g.order = Array.from({ length: len }, (_, i) => map[unit[i % unit.length]]);
    g.hidden = g.order.map((_, i) => i >= len - hide);
    Object.assign(g, { slot: 0, slotMiss: 0, idle: 0, pile: [], cardIn: 0, mode: 'play', warnedHidden: false });
    // make sure every kind on the list is growing somewhere in the patch
    for (const k of new Set(g.order)) {
      if (!g.plots.some(p => p.kind === k && p.st === 'ripe')) {
        const p = g.plots.find(q => q.st === 'ripe' && g.plots.filter(r => r.kind === q.kind && r.st === 'ripe').length > 1) || g.plots.find(q => q.st !== 'air');
        if (p) sprout(g, p, k);
      }
    }
    const shown = g.order.filter((_, i) => !g.hidden[i]).map(k => VEG[k].name).join(', ');
    g.say = hide ? `Mrs. Pickett's list goes: ${shown}... What comes next? Pull them up in order!` : `Mrs. Pickett's list: ${shown}. Pull them up in that order!`;
    g.progress = `Basket ${g.round + 1} of ${ROUNDS}`;
    g.msg = hide ? 'Finish my pattern!' : 'Pull them in order!'; g.msgT = 3;
  }
  function slotSay(g) {
    if (g.hidden[g.slot]) return 'What comes next in the pattern? Pull it up!';
    return `Now pull up ${aName(needKind(g))}!`;
  }
  const scoreOf = g => clamp(1 - 0.07 * g.miss - 0.08 * g.theft, 0, 1);

  function popOut(g, i) {
    const p = g.plots[i];
    p.held = false; g.grab = -1;
    const k = p.kind, s = p.big ? 1.25 : 1;
    const fromY = p.y - BASE - p.pull / (p.big ? 1.7 : 1) * 44;
    for (let j = 0; j < 14; j++) g.crumbs.push({ x: p.x + rand(-20, 20), y: p.y, vx: rand(-160, 160), vy: rand(-320, -120), r: rand(2, 4.5), life: rand(0.6, 1) });
    tone(320, 0.12, 'triangle', 0.1, 0, 900); SFX.pop();
    // the mole or crow on this veggie loses the tug-of-war
    if (g.mole && g.mole.i === i && g.mole.st !== 'bonk') bonkMole(g, true);
    if (g.crow && g.crow.i === i && (g.crow.st === 'in' || g.crow.st === 'peck')) shooCrow(g, true);
    if (k === needKind(g)) {
      g.hidden[g.slot] = false;
      g.slot++; g.slotMiss = 0; g.idle = 0; g.pickHop = 1;
      p.st = 'empty'; p.regrow = rand(1.6, 2.6); p.pull = 0;
      g.flyers.push({ k, s, x0: p.x, y0: fromY, x: p.x, y: fromY, t: 0, dur: 0.75, rot: 0, vr: rand(6, 10) * (Math.random() < 0.5 ? -1 : 1) });
      floatText(p.x, fromY - 60, `${cap(VEG[k].name)}!`, '#ffe680', false, 26);
      g.msg = pick(['Lovely!', 'Wonderful, dear!', 'Splendid!', 'Just right!']); g.msgT = 1.6;
      if (g.slot < g.order.length) {
        g.say = slotSay(g);
        if (g.hidden[g.slot] && !g.warnedHidden) { g.warnedHidden = true; speak(g.say); }
      }
    } else {
      g.miss++; g.slotMiss++; g.idle = 0;
      p.st = 'air'; p.airT = 0;
      SFX.miss(); tone(300, 0.25, 'sine', 0.06, 0.08, 160);
      const want = needKind(g);
      g.msg = `Oops, that's a ${VEG[k].name}!`; g.msgT = 2.2;
      speak(g.hidden[g.slot] && g.slotMiss < 2 ? `Oops, that's a ${VEG[k].name}. Look at the pattern again!` : `Oops, that's a ${VEG[k].name}. We need ${aName(want)}!`);
    }
  }
  function bonkMole(g, tug) {
    const m = g.mole;
    m.st = 'bonk'; m.t = 0;
    SFX.hit(); tone(200, 0.15, 'square', 0.05, 0.05, 90);
    const p = g.plots[m.i];
    floatText(p.x + m.side * 52, p.y - 80, tug ? 'You win the tug!' : 'Bonk! Shoo!', '#fff', false, 22);
    burst(p.x + m.side * 52, p.y - 50, 10, { colors: ['#ffe04a', '#fff6a8', '#ffb3e0'] });
    g.moleT = rand(...g.cfg.mole);
  }
  function shooCrow(g, tug) {
    const cr = g.crow;
    cr.st = 'flee'; cr.t = 0; cr.vx = (cr.x < W / 2 ? -1 : 1) * 320; cr.vy = -300;
    tone(700, 0.18, 'sawtooth', 0.05, 0, 420); tone(640, 0.18, 'sawtooth', 0.05, 0.16, 380);
    for (let j = 0; j < 8; j++) g.feathers.push({ x: cr.x, y: cr.y, vx: rand(-90, 90), vy: rand(-120, 0), rot: rand(0, 6), life: 1.6 });
    floatText(cr.x, cr.y - 40, tug ? 'Ha! Too slow, crow!' : 'Shoo, crow!', '#fff', false, 22);
    g.crowT = rand(...g.cfg.crow);
  }

  MG.veggiepatchpull = {
    kind: 'learn', title: () => 'Veggie Patch Pull', icon: () => '🥕',
    how: g => `Hold a leafy top, or pull it up, till the veggie POPS! Pick them in the order on Mrs. Pickett's list.${g.cfg.hide.some(h => h) ? ' For a ?, keep the pattern going.' : ''} Tap the mole${g.cfg.crow ? ' and crow' : ''} to shoo them!`,
    init(g) {
      g.cfg = CFG[g.tier] || CFG[1];
      BG = BG || bake(paintBG);
      g.kinds = KIND_LIST.slice(0, g.cfg.kinds);
      const kinds = shuffle([...g.kinds, ...g.kinds, ...g.kinds]);
      g.plots = [];
      ROWS.forEach((y, r) => COLS[r].forEach((x, c) => g.plots.push({ x, y, row: r, kind: kinds[g.plots.length % kinds.length], st: 'ripe', grow: 1, pull: 0, sink: 0, nib: 0, big: false, held: false, seed: rand(0, 6), wig: 0, regrow: 0, flash: 0 })));
      Object.assign(g, {
        round: 0, miss: 0, theft: 0, grab: -1, flyers: [], crumbs: [], feathers: [], clock: 0, msg: '', msgT: 0,
        mole: null, moleT: rand(...g.cfg.mole) * 0.7, crow: null, crowT: g.cfg.crow ? rand(...g.cfg.crow) : 0,
        cursor: 0, useKeys: false, pickHop: 0, basketB: 0, transT: 0, creakT: 0, lastY: 0,
        flies: [0, 1, 2].map(i => ({ x: rand(260, 900), y: rand(170, 260), ph: rand(0, 6), col: ['#ffb3e0', '#b8e6ff', '#fff08a'][i] })),
        wormT: 3, worm: null,
      });
      newBasket(g);
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      const c = g.cfg;
      g.clock += dt; g.msgT -= dt; g.pickHop = Math.max(0, g.pickHop - dt * 2.5); g.basketB = Math.max(0, g.basketB - dt * 4);
      g.cardIn = Math.min(1, g.cardIn + dt * 2.5);
      // ---- ambient life
      for (const f of g.flies) { f.ph += dt; f.x += Math.cos(f.ph * 0.6) * 50 * dt; f.y = 200 + Math.sin(f.ph * 0.9) * 40; if (f.x > 930) f.x = 260; if (f.x < 250) f.x = 920; }
      for (const cb of g.crumbs) { cb.life -= dt; cb.vy += 900 * dt; cb.x += cb.vx * dt; cb.y += cb.vy * dt; }
      g.crumbs = g.crumbs.filter(cb => cb.life > 0);
      for (const fe of g.feathers) { fe.life -= dt; fe.vy += 60 * dt; fe.x += fe.vx * dt + Math.sin(fe.life * 6) * 30 * dt; fe.y += fe.vy * dt; fe.rot += dt * 3; }
      g.feathers = g.feathers.filter(fe => fe.life > 0);
      g.wormT -= dt;
      if (!g.worm && g.wormT <= 0) {
        const r = randInt(0, 1), gap = randInt(0, 3);
        g.worm = { x: (COLS[r][gap] + COLS[r][gap + 1]) / 2, y: ROWS[r] + 6, t: 0 };
      }
      if (g.worm) { g.worm.t += dt; if (g.worm.t > 3) { g.worm = null; g.wormT = rand(4, 8); } }
      // ---- plots
      for (const p of g.plots) {
        p.wig = Math.max(0, p.wig - dt * 3); p.flash = Math.max(0, p.flash - dt);
        if (p.st === 'empty') { p.regrow -= dt; if (p.regrow <= 0 && g.mode === 'play') sprout(g, p, chooseKind(g)); }
        else if (p.st === 'sprout') { p.grow = Math.min(1, p.grow + dt * 1.4); if (p.grow >= 1) p.st = 'ripe'; }
        else if (p.st === 'air') {
          p.airT += dt;
          if (p.airT >= 1.1) { p.st = 'ripe'; p.pull = 0; p.wig = 1; tone(150, 0.1, 'triangle', 0.08); for (let j = 0; j < 8; j++) g.crumbs.push({ x: p.x + rand(-16, 16), y: p.y, vx: rand(-100, 100), vy: rand(-200, -60), r: rand(2, 4), life: 0.7 }); }
        } else if (p.st === 'ripe' && !p.held) p.pull = Math.max(0, p.pull - dt * 1.5);
      }
      // ---- flyers into the basket
      for (const f of g.flyers) {
        f.t += dt; const k = Math.min(1, f.t / f.dur);
        f.x = lerp(f.x0, BASKET.x, k); f.y = lerp(f.y0, BASKET.y - 30, k) - Math.sin(k * Math.PI) * 150;
        f.rot += f.vr * dt;
        if (k >= 1 && !f.landed) {
          f.landed = true; g.pile.push(f.k); g.basketB = 1;
          SFX.hit(); burst(BASKET.x, BASKET.y - 20, 8, { colors: ['#fff6a8', '#b8ffb0', '#ffd0a0'] });
        }
      }
      g.flyers = g.flyers.filter(f => !f.landed);
      // ---- basket complete?
      if (g.mode === 'play' && g.slot >= g.order.length && !g.flyers.length) {
        g.mode = 'trans'; g.transT = 3.2; g.round++;
        g.grab = -1; for (const p of g.plots) p.held = false;
        SFX.sparkle(); burst(BASKET.x, BASKET.y - 40, 26, { colors: ['#ff8fc0', '#ffe04a', '#8fe08a', '#8fd0ff'] });
        const counts = {}; for (const k of g.order) counts[k] = (counts[k] || 0) + 1;
        const star_ = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        g.msg = 'Basket full! Hooray!'; g.msgT = 3;
        speak(`Basket full! Fun fact: ${VEG[star_].fact}`);
        if (g.mole && g.mole.st !== 'bonk') { g.mole.st = 'down'; g.mole.t = 0; }
        if (g.crow && (g.crow.st === 'in' || g.crow.st === 'peck')) shooCrow(g, false);
      }
      if (g.mode === 'trans') {
        g.transT -= dt;
        if (g.transT <= 0) { if (g.round >= ROUNDS) { g.score = scoreOf(g); g.done = true; return; } newBasket(g); speak(g.say); }
      }
      // ---- the mole
      g.moleT -= dt;
      if (!g.mole && g.moleT <= 0 && g.mode === 'play') {
        const cand = g.plots.map((p, i) => i).filter(i => g.plots[i].st === 'ripe' && i !== g.grab && !(g.crow && g.crow.i === i));
        const want = cand.filter(i => g.plots[i].kind === needKind(g));
        if (cand.length) {
          const i = want.length && Math.random() < 0.6 ? pick(want) : pick(cand);
          g.mole = { i, side: g.plots[i].x > 840 ? -1 : 1, t: 0, rise: 0, st: 'up' };
          tone(160, 0.2, 'triangle', 0.08, 0, 260); tone(260, 0.12, 'triangle', 0.06, 0.2);
          g.msg = 'A mole! Tap it!'; g.msgT = 2;
        } else g.moleT = 2;
      }
      if (g.mole) {
        const m = g.mole, p = g.plots[m.i];
        m.t += dt;
        if (m.st === 'up') { m.rise = Math.min(1, m.rise + dt * 3); if (m.rise >= 1) m.st = 'tug'; }
        else if (m.st === 'tug') {
          if (p.st !== 'ripe') { m.st = 'down'; m.t = 0; }
          else if (!p.held) {
            p.sink += dt / c.moleSteal; p.wig = Math.max(p.wig, 0.5);
            if (p.sink >= 1) {
              p.st = 'empty'; p.regrow = 3; p.sink = 0; g.theft++; m.st = 'down'; m.t = 0; m.ate = true;
              SFX.fail(); g.msg = 'The mole took it!'; g.msgT = 2;
              floatText(p.x, p.y - 70, 'Gulp!', '#ffd0d0', false, 22);
              g.moleT = rand(...c.mole);
            }
          }
        } else { m.rise = Math.max(0, m.rise - dt * (m.st === 'bonk' && m.t < 0.5 ? 0.6 : 2.5)); if (m.rise <= 0) g.mole = null; }
      }
      for (const p of g.plots) if (p.sink > 0 && !(g.mole && g.plots[g.mole.i] === p && g.mole.st === 'tug')) p.sink = Math.max(0, p.sink - dt * 2);
      // ---- the crow
      if (c.crow) {
        g.crowT -= dt;
        if (!g.crow && g.crowT <= 0 && g.mode === 'play') {
          const cand = g.plots.map((p, i) => i).filter(i => g.plots[i].st === 'ripe' && i !== g.grab && !(g.mole && g.mole.i === i));
          if (cand.length) {
            const i = pick(cand), fromR = Math.random() < 0.5;
            g.crow = { i, x: fromR ? W + 50 : 200, y: 70, st: 'in', t: 0, dir: fromR ? -1 : 1 };
            tone(620, 0.16, 'sawtooth', 0.04, 0, 420); tone(600, 0.16, 'sawtooth', 0.04, 0.2, 400);
            g.msg = 'Caw! A crow!'; g.msgT = 2;
          } else g.crowT = 2;
        }
        if (g.crow) {
          const cr = g.crow, p = g.plots[cr.i];
          cr.t += dt;
          if (cr.st === 'in') {
            const tx = p.x, ty = p.y - 84;
            const dx = tx - cr.x, dy = ty - cr.y, d = Math.hypot(dx, dy);
            if (p.st !== 'ripe') shooCrow(g, false);
            else if (d < 8) { cr.st = 'peck'; cr.t = 0; cr.x = tx; cr.y = ty; }
            else { const sp = Math.min(d, 230 * dt); cr.x += dx / d * sp; cr.y += dy / d * sp + Math.sin(cr.t * 8) * 0.8; cr.dir = dx < 0 ? -1 : 1; }
          } else if (cr.st === 'peck') {
            if (p.st !== 'ripe') shooCrow(g, false);
            else if (!p.held) {
              p.nib = Math.min(1, cr.t / c.crowStay); p.wig = Math.max(p.wig, 0.3);
              if (cr.t >= c.crowStay) {
                cr.st = 'carry'; cr.carry = p.kind; cr.vx = (p.x < W / 2 ? -1 : 1) * 220; cr.vy = -200; cr.dir = Math.sign(cr.vx);
                p.st = 'empty'; p.regrow = 3.5; p.nib = 0; g.theft++;
                SFX.fail(); g.msg = 'The crow took one!'; g.msgT = 2;
                g.crowT = rand(...c.crow);
              }
            }
          } else {
            cr.x += cr.vx * dt; cr.y += cr.vy * dt;
            if (cr.y < -80 || cr.x < -80 || cr.x > W + 80) g.crow = null;
          }
        }
      }
      for (const p of g.plots) if (p.nib > 0 && !(g.crow && g.crow.i === g.plots.indexOf(p) && g.crow.st === 'peck')) p.nib = Math.max(0, p.nib - dt * 0.5);
      // ---- input
      g.score = scoreOf(g);
      if (g.mode !== 'play') return;
      g.idle += dt;
      if (pointerMoved(g)) g.useKeys = false;
      // keyboard: arrows choose a plant, hold space to pull
      const ci = g.cursor, cc = ci % 5, cr_ = Math.floor(ci / 5);
      if (pressed.arrowleft) { g.cursor = cr_ * 5 + Math.max(0, cc - 1); g.useKeys = true; }
      if (pressed.arrowright) { g.cursor = cr_ * 5 + Math.min(4, cc + 1); g.useKeys = true; }
      if (pressed.arrowup) { g.cursor = cc; g.useKeys = true; }
      if (pressed.arrowdown) { g.cursor = 5 + cc; g.useKeys = true; }
      const hitCrow = (x, y) => g.crow && (g.crow.st === 'in' || g.crow.st === 'peck') && Math.hypot(x - g.crow.x, y - g.crow.y) < 58;
      const hitMole = (x, y) => {
        if (!g.mole || g.mole.st === 'bonk' || g.mole.st === 'down') return false;
        const p = g.plots[g.mole.i];
        return Math.hypot(x - (p.x + g.mole.side * 52), y - (p.y - 34)) < 52;
      };
      if (pointer.clicked) {
        if (hitCrow(pointer.x, pointer.y)) shooCrow(g, false);
        else if (hitMole(pointer.x, pointer.y)) bonkMole(g, false);
        else if (g.worm && Math.hypot(pointer.x - g.worm.x, pointer.y - g.worm.y + 20) < 26) {
          floatText(g.worm.x, g.worm.y - 50, 'Hi, wormy!', '#ffd0e0', false, 18); tone(1200, 0.08, 'sine', 0.06, 0, 1600); g.worm.t = Math.max(g.worm.t, 2.6);
        } else {
          const i = plotAt(g, pointer.x, pointer.y);
          if (i >= 0) { g.grab = i; g.grabKey = false; g.lastY = pointer.y; g.plots[i].held = true; g.useKeys = false; tone(500, 0.05, 'triangle', 0.06); }
        }
      }
      if (pressed[' ']) {
        const p = g.plots[g.cursor];
        if (g.crow && g.crow.i === g.cursor && (g.crow.st === 'in' || g.crow.st === 'peck')) shooCrow(g, false);
        else if (g.mole && g.mole.i === g.cursor && (g.mole.st === 'up' || g.mole.st === 'tug')) bonkMole(g, false);
        else if (p.st === 'ripe') { g.grab = g.cursor; g.grabKey = true; p.held = true; g.useKeys = true; }
      }
      if (g.grab >= 0) {
        const p = g.plots[g.grab];
        const holding = g.grabKey ? keys[' '] : pointer.down;
        if (!holding || p.st !== 'ripe') { p.held = false; g.grab = -1; }
        else {
          const need = p.big ? 1.7 : 1;
          const drag = g.grabKey ? 0 : Math.max(0, g.lastY - pointer.y) / 110;
          g.lastY = pointer.y;
          p.pull += dt / PULL_TIME + drag;
          p.wig = 1;
          g.creakT -= dt;
          if (g.creakT <= 0) {
            g.creakT = 0.09;
            tone(180 + (p.pull / need) * 520, 0.07, 'triangle', 0.05);
            g.crumbs.push({ x: p.x + rand(-22, 22), y: p.y - 2, vx: rand(-70, 70), vy: rand(-170, -70), r: rand(1.5, 3.5), life: 0.6 });
          }
          if (p.pull >= need) popOut(g, g.grab);
        }
      }
      // hints: glow the right kind after two mistakes, or after a long pause
      const hintOn = g.slotMiss >= 2 || g.idle > (g.hidden[g.slot] ? 12 : 7);
      if (hintOn) for (const p of g.plots) if (p.st === 'ripe' && p.kind === needKind(g)) p.flash = Math.max(p.flash, 0.3);
    },
    draw(g) {
      const t = g.clock;
      ctx.drawImage(BG, 0, 0, W, H);
      // drifting clouds (live, behind the card)
      for (let i = 0; i < 3; i++) {
        const x = ((t * (8 + i * 3) + i * 380) % (W + 240)) - 120, y = 98 + i * 34;
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        circle(x, y, 20); circle(x + 22, y - 10, 24); circle(x + 48, y, 19); ctx.fillRect(x, y, 48, 18);
      }
      // ---- Mrs. Pickett's list
      const n = g.order.length, sw = 70, cw = n * sw + 26, cx = 590, cy = 104;
      const slide = g.mode === 'trans' ? Math.min(1, (3.2 - g.transT) / 0.5) : 0;
      const yOff = (1 - easeOut(g.cardIn)) * -120 + slide * -150;
      ctx.save(); ctx.translate(0, yOff);
      ctx.save(); ctx.shadowColor = 'rgba(40,20,60,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      rrect(cx - cw / 2, cy - 38, cw, 78, 14, '#fffaf0', OL, 3);
      ctx.restore();
      ctx.strokeStyle = 'rgba(120,170,220,.35)'; ctx.lineWidth = 1.5;
      for (const yy of [cy - 14, cy + 10, cy + 34]) { ctx.beginPath(); ctx.moveTo(cx - cw / 2 + 8, yy); ctx.lineTo(cx + cw / 2 - 8, yy); ctx.stroke(); }
      inkCircle(cx - cw / 2 + 14, cy - 30, 6, '#ff6fa0', 1.2);
      inkCircle(cx + cw / 2 - 14, cy - 30, 6, '#ff6fa0', 1.2);
      for (let i = 0; i < n; i++) {
        const x = cx - cw / 2 + 13 + sw / 2 + i * sw, y = cy + 2;
        const cur = i === g.slot && g.mode === 'play', done = i < g.slot;
        const bob = cur ? Math.sin(t * 6) * 3 : 0;
        if (cur) { ctx.fillStyle = 'rgba(255,220,90,.55)'; circle(x, y + bob, 33 + Math.sin(t * 6) * 2); }
        rrect(x - 29, y - 30 + bob, 58, 60, 12, done ? '#e6f8dc' : cur ? '#fff6c8' : '#fff', cur ? '#ff9a3a' : 'rgba(91,63,115,.55)', cur ? 3.5 : 2);
        if (g.hidden[i]) {
          ctx.setLineDash([5, 4]); rrect(x - 22, y - 23 + bob, 44, 46, 10, null, '#b48ae0', 2); ctx.setLineDash([]);
          outlined('?', x, y + 2 + bob + Math.sin(t * 4 + i) * 2, 30, '#c58aff', 'center', '#fff');
        } else {
          const k = g.order[i], ys = { carrot: 0.36, beet: 0.42, radish: 0.48, onion: 0.4 }[k];
          veg(k, x, y - 4 + bob, ys, 0, t, { sway: 0 });
          if (done) { inkCircle(x + 20, y + 20, 10, '#5cc860', 1.2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 15, y + 20); ctx.lineTo(x + 19, y + 24); ctx.lineTo(x + 25, y + 15); ctx.stroke(); }
        }
        if (cur) { ctx.fillStyle = '#ff7a3a'; tri(x - 9, y + 40 + bob, x + 9, y + 40 + bob, x, y + 30 + bob); }
      }
      ctx.restore();
      // ---- the patch, back row then front row
      for (const row of [0, 1]) {
        g.plots.forEach((p, i) => {
          if (p.row !== row) return;
          const s = p.big ? 1.25 : 1;
          if (p.st === 'empty') {
            ctx.fillStyle = SOIL_D; ellipse(p.x, p.y + 2, 18, 6);
            ctx.fillStyle = 'rgba(0,0,0,.25)'; ellipse(p.x, p.y + 3, 12, 3.5);
          } else if (p.st === 'sprout') {
            const k = easeBack(p.grow);
            ctx.save(); ctx.beginPath(); ctx.rect(p.x - 140, 0, 280, p.y + 1); ctx.clip();
            veg(p.kind, p.x, p.y - BASE * p.grow, s * Math.max(0.05, k), 0, t, { sway: Math.sin(t * 2 + p.seed) * 0.05 });
            ctx.restore();
          } else {
            let lift, x = p.x, rot, mood = null, clip = true;
            if (p.st === 'air') {
              const k = p.airT / 1.1;
              lift = BASE + 44 + Math.sin(Math.min(1, k) * Math.PI) * 90;
              rot = Math.sin(p.airT * 26) * 0.3 * (1 - k);
              mood = 'sad'; clip = k > 0.15 && k < 0.85;
              if (k > 0.85) clip = true;
            } else {
              lift = BASE + p.pull / (p.big ? 1.7 : 1) * 44 - p.sink * 64;
              rot = Math.sin(t * 34 + p.seed) * 0.08 * p.wig;
              x += Math.sin(t * 40) * 2.5 * p.wig * (p.held ? 1 : 0.5);
              if (p.pull > 0.25) mood = 'o';
            }
            if (p.flash > 0) {
              const gl = ctx.createRadialGradient(x, p.y - 40, 4, x, p.y - 40, 70);
              gl.addColorStop(0, `rgba(255,250,170,${0.55 + Math.sin(t * 8) * 0.25})`); gl.addColorStop(1, 'rgba(255,250,170,0)');
              ctx.fillStyle = gl; circle(x, p.y - 40, 70);
              if (Math.sin(t * 8 + p.seed) > 0.6) star(x + Math.sin(t * 3 + p.seed) * 30, p.y - 70 + Math.cos(t * 4) * 10, 6, '#fff6a8', 4);
            }
            const sway = Math.sin(t * 1.6 + p.seed) * 0.06 + (p.held ? Math.sin(t * 30) * 0.08 : 0);
            if (clip) { ctx.save(); ctx.beginPath(); ctx.rect(x - 160, 0, 320, p.y + 1); ctx.clip(); }
            veg(p.kind, x, p.y - lift, s, rot, t, { sway, nib: p.nib, mood });
            if (clip) ctx.restore();
            // the soil lip in front of the stem
            ctx.fillStyle = OL; ellipse(p.x, p.y + 3, 26, 8);
            ctx.fillStyle = SOIL_L; ellipse(p.x, p.y + 3, 24, 6);
            ctx.fillStyle = '#a8784e'; ellipse(p.x - 6, p.y + 1, 10, 2.5);
            if (p.held) {  // pull meter: a ring around the grab point
              const need = p.big ? 1.7 : 1, k = clamp(p.pull / need, 0, 1);
              ctx.lineCap = 'round';
              ctx.strokeStyle = 'rgba(40,20,60,.45)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(p.x, p.y + 28, 16, 0, Math.PI * 2); ctx.stroke();
              ctx.strokeStyle = mix('#ffcf3a', '#5cd860', k); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, p.y + 28, 16, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
            }
          }
          if (g.useKeys && g.cursor === i && g.mode === 'play') {
            ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 30;
            rrect(p.x - 52, p.y - 100, 104, 122, 18, null, '#fff', 3.5); ctx.setLineDash([]);
          }
          if (g.mole && g.mole.i === i) mole(p.x + g.mole.side * 52, p.y + 6, g.mole.rise, t, g.mole.st, g.mole.t);
        });
        if (g.worm && (g.worm.y > 400) === (row === 1)) worm(g.worm.x, g.worm.y, Math.min(1, g.worm.t * 3, (3 - g.worm.t) * 3), t);
      }
      // ---- soil crumbs
      for (const cb of g.crumbs) { ctx.globalAlpha = clamp(cb.life * 2, 0, 1); ctx.fillStyle = OL; circle(cb.x, cb.y, cb.r + 1.2); ctx.fillStyle = SOIL_L; circle(cb.x, cb.y, cb.r); }
      ctx.globalAlpha = 1;
      // ---- Mrs. Pickett with her basket
      const hop = Math.sin(g.pickHop * Math.PI) * 16;
      drawCritter('Mrs. Pickett', 62, 474 - hop, 0.8, 1);
      basket(BASKET.x, BASKET.y, 0, g.basketB, false);
      g.pile.forEach((k, j) => {
        const px = BASKET.x - 44 + (j % 5) * 22, py = BASKET.y - 36 - Math.floor(j / 5) * 14 - (j % 2) * 5;
        veg(k, px, py, 0.5, -0.5 + (j % 5) * 0.25, t, { mood: 'happy', sway: Math.sin(t * 2 + j) * 0.05 });
      });
      basket(BASKET.x, BASKET.y, g.pile.length, g.basketB, true);
      // speech bubble
      if (g.msgT > 0 && g.msg) {
        ctx.font = `700 16px ${FONT}`;
        const bw = Math.max(110, ctx.measureText(g.msg).width + 28), bx = 12, by = 116;
        ctx.globalAlpha = clamp(g.msgT * 3, 0, 1);
        rrect(bx, by, bw, 38, 16, '#fff', OL, 2.5);
        ctx.fillStyle = '#fff'; tri(bx + 30, by + 36, bx + 50, by + 36, bx + 36, by + 50);
        ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx + 30, by + 37); ctx.lineTo(bx + 36, by + 50); ctx.lineTo(bx + 50, by + 37); ctx.stroke();
        text(g.msg, bx + bw / 2, by + 19, 16, '#7a3a8a', 'center', 700);
        ctx.globalAlpha = 1;
      }
      // ---- flying veggies, the crow, feathers, butterflies
      for (const f of g.flyers) veg(f.k, f.x, f.y, f.s * 0.8, f.rot, t, { mood: 'happy' });
      if (g.crow) {
        const cr = g.crow, flying = cr.st !== 'peck';
        crow(cr.x, cr.y, cr.dir, flying ? t * 18 : 0, t, cr.st === 'peck', cr.carry);
        if (cr.st === 'peck' && Math.sin(t * 9) > 0.9) burst(cr.x + cr.dir * 30, cr.y + 20, 1, { colors: ['#6cc058'], spread: 40, up: 30, size: [2, 4] });
      }
      for (const fe of g.feathers) {
        ctx.save(); ctx.translate(fe.x, fe.y); ctx.rotate(fe.rot); ctx.globalAlpha = clamp(fe.life, 0, 1);
        inkEllipse(0, 0, 9, 3.5, 0, '#3c3660', 1); ctx.restore();
      }
      ctx.globalAlpha = 1;
      g.flies.forEach((f, i) => butterfly(f.x, f.y + Math.sin(t * 3 + i) * 10, t + i, f.col));
      bee(600 + Math.sin(t * 0.7) * 300, 300 + Math.sin(t * 2.3) * 40, t);
      // ---- the gardening glove follows the pointer over the patch
      if (g.mode === 'play' && !g.useKeys) {
        if (g.grab >= 0) { const p = g.plots[g.grab]; glove(p.x + 6, p.y - BASE - 10 - p.pull / (p.big ? 1.7 : 1) * 44 - 34, true, t); }
        else if (pointer.x > BED.x0 && pointer.y > 160) glove(pointer.x + 10, pointer.y + 6, false, t);
      }
      if (g.mode === 'trans') {
        const k = clamp((3.2 - g.transT) / 0.4, 0, 1);
        outlined(g.round >= ROUNDS ? 'All done!' : 'Basket full!', 590, 210 - (1 - easeBack(k)) * 40, 46, '#ffe680', 'center', OL);
      }
    },
  };

  restage('garden', {
    games: [['maze', 'petal', { what: 'petals' }], ['veggiepatchpull', 'berry', {}]],
    mid: [
      'N:Thank you, dear! Now, would you help me pick my veggies? Carrots, beets, radishes, all ready to pull!',
      "N:Here's my list. Pick them in just that order, and if the end is missing, keep the pattern going!",
      'N:Grab the leafy tops and give a good PULL! Oh, and shoo that greedy mole and that cheeky crow.',
      'A:excited:Pull, pull, POP! Let me at those veggies!',
    ],
  });
}
