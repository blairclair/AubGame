'use strict';
// Batch 3: The Old Mill, Owl Hollow, Fairy Ring, Moth Meadow, Honey Tree Hill, Swan Lake.
{
  // =========================================================================
  // shared little helpers
  // =========================================================================
  const PI = Math.PI;
  const sq = (a, b) => Math.hypot(a, b);
  // outline every path first, then fill them, so overlapping pieces read as one shape
  const inkGroup = (list, lw) => {
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of list) ctx.stroke(p);
    for (const [p, f] of list) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const glow = (x, y, r, col, a = 1) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = a; ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1;
  };
  const sky3 = (a, b, c, mid = 0.5, bottom = GY) => {
    const gr = ctx.createLinearGradient(0, 0, 0, bottom);
    gr.addColorStop(0, a); gr.addColorStop(mid, b); gr.addColorStop(1, c);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  };
  const twinkles = (n, y0, y1, col = '255,255,240') => {
    for (let i = 0; i < n; i++) {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(S.t * 1.3 + i * 1.7));
      star((i * 139 + 23) % W, y0 + (i * 67) % (y1 - y0), 1.4 + (i % 3) * 0.9, `rgba(${col},${a})`);
    }
  };
  const grassTufts = (n, y0, y1, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = (i * 97 + 31) % W, y = y0 + (i * 53) % (y1 - y0);
      ctx.beginPath(); ctx.moveTo(x - 5, y - 6); ctx.lineTo(x, y); ctx.lineTo(x + 2, y - 9); ctx.moveTo(x, y); ctx.lineTo(x + 7, y - 5); ctx.stroke();
    }
  };
  const lantern = (x, y, s, col = '#ffd860', hang = 0) => {
    ctx.strokeStyle = '#3a2a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - hang); ctx.lineTo(x, y); ctx.stroke();
    glow(x, y + 16 * s, 46 * s, 'rgba(255,220,120,.75)', 0.75 + 0.25 * Math.sin(S.t * 3 + x));
    inkRect(x - 9 * s, y, 18 * s, 6 * s, '#5a3a5a', 1.5, 2);
    inkRect(x - 11 * s, y + 6 * s, 22 * s, 22 * s, col, 1.5, 6 * s);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(x - 4 * s, y + 13 * s, 3 * s, 5 * s);
    inkRect(x - 7 * s, y + 28 * s, 14 * s, 4 * s, '#5a3a5a', 1.5, 2);
  };
  // a firefly from the side: dark body, orange head shield, wing cases edged in yellow, see-through
  // flapping wings, and a glowing lantern tail (s = 1 is about 30px long)
  const drawFirefly = (x, y, s, t = S.t) => {
    const pulse = 0.55 + 0.45 * Math.sin(t * 5);
    glow(x - 11 * s, y + 4 * s, 26 * s, 'rgba(220,255,120,.95)', 0.45 + 0.55 * pulse);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // legs and feelers
    ctx.strokeStyle = '#3a2a3a'; ctx.lineWidth = 1.1;
    for (const lx of [-2, 3, 8]) { ctx.beginPath(); ctx.moveTo(lx, 4); ctx.lineTo(lx - 2, 9); ctx.lineTo(lx - 4, 10); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(14, -2); ctx.quadraticCurveTo(20, -10, 25, -9); ctx.moveTo(13, -1); ctx.quadraticCurveTo(21, -5, 26, -3); ctx.stroke();
    // see-through hind wings, buzzing
    const f = Math.sin(t * 46);
    ctx.fillStyle = 'rgba(235,245,255,.8)'; ctx.strokeStyle = 'rgba(140,160,210,.9)'; ctx.lineWidth = 1;
    for (const [rot, len] of [[-0.9 + f * 0.35, 15], [-0.55 + f * 0.3, 13]]) { ctx.save(); ctx.translate(2, -3); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(-len * 0.5, 0, len * 0.55, 4.2, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // the lantern tail, then the body and wing case
    const lg = ctx.createRadialGradient(-11, 3, 1, -11, 3, 8); lg.addColorStop(0, '#ffffe0'); lg.addColorStop(0.5, mix('#e8ff7a', '#ffffff', pulse * 0.4)); lg.addColorStop(1, '#b8e050');
    ctx.fillStyle = lg; ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(-11, 3, 7.5, 5.5, 0.15, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,170,40,.6)'; ctx.lineWidth = 0.9; for (const sx of [-14, -10]) { ctx.beginPath(); ctx.moveTo(sx, -1.5); ctx.lineTo(sx + 1, 7.5); ctx.stroke(); }
    ink(P2('M-5,-4 C2,-8 10,-6 13,-2 C10,3 2,6 -5,5 C-8,2 -8,-2 -5,-4 Z'), '#3a2e44', 1.4);
    ink(P2('M-6,-3 C0,-7 8,-6 11,-3 C6,-1 0,1 -6,1 Z'), '#4e3e5c', 1);
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 1); ctx.quadraticCurveTo(3, 0.5, 10, -2.5); ctx.stroke();
    // orange head shield with its dark spot, and the little head with a shiny eye
    ink(P2('M9,-6 C13,-8 17,-5 17,-1 C17,2 13,3 10,2 Z'), '#ff8a3a', 1.2);
    ctx.fillStyle = '#c0402a'; ellipse(13, -3.5, 2, 1.4);
    inkCircle(17, 1, 3, '#2a1e30', 1);
    ctx.fillStyle = '#ffffff'; circle(18, 0.2, 1.1);
    ctx.restore();
  };
  // a fuzzy moth, wings flapping (flap is an angle), facing the viewer; col is the wing colour, spot the eyespot
  const drawMoth = (x, y, s, flap, col = '#d8f0e0', spot = '#ff9ac0') => {
    const k = 0.4 + 0.6 * Math.abs(Math.cos(flap));
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const up = P2('M0,-3 C-8,-22 -26,-31 -38,-24 C-44,-19 -42,-12 -38,-9 C-40,-5 -36,-1 -32,-1 C-30,2 -20,3 0,2 Z');
    const lo = P2('M0,2 C-10,4 -22,9 -25,17 C-27,23 -23,28 -17,27 C-14,30 -9,28 -7,24 C-4,18 -1,10 0,6 Z');
    const dark = mix(col, '#5a3a6e', 0.35), light = mix(col, '#ffffff', 0.45);
    for (const d of [-1, 1]) {
      ctx.save(); ctx.scale(d * k, 1);
      inkGroup([[up, col], [lo, light]], 1.3);
      // wing markings: a darker band, a scalloped edge, an eyespot and a few freckles
      ctx.save(); ctx.clip(up);
      ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -18); ctx.quadraticCurveTo(-18, -8, -14, 2); ctx.stroke();
      ctx.fillStyle = mix(col, '#ffffff', 0.6); for (let i = 0; i < 5; i++) circle(-38 + i * 1.5, -22 + i * 5, 2.2);
      ctx.restore();
      inkCircle(-24, -14, 5.5, spot, 1); inkCircle(-24, -14, 2.6, '#3a2050', 0.6); ctx.fillStyle = '#ffffff'; circle(-23.2, -14.8, 1);
      ctx.fillStyle = dark; circle(-17, 18, 2.4); circle(-12, 22, 1.6);
      ctx.restore();
    }
    // fuzzy body and collar
    const fur = '#f4e6c8';
    ctx.fillStyle = OL; for (let i = 0; i < 5; i++) circle(0, -5 + i * 5, 5.2 - i * 0.6);
    ctx.fillStyle = fur; for (let i = 0; i < 5; i++) circle(0, -5 + i * 5, 4.2 - i * 0.6);
    ctx.strokeStyle = 'rgba(160,120,90,.5)'; ctx.lineWidth = 0.8; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-3.4 + i * 0.3, -3 + i * 5); ctx.lineTo(3.4 - i * 0.3, -3 + i * 5); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; for (const [fx, fy] of [[-4, -8], [0, -9.5], [4, -8], [-2, -7], [2, -7]]) circle(fx, fy, 2.2);
    // head with big eyes and a smile
    inkCircle(0, -11, 4.6, fur, 1);
    ctx.fillStyle = '#2a1a30'; circle(-2, -11.5, 1.5); circle(2, -11.5, 1.5); ctx.fillStyle = '#ffffff'; circle(-1.6, -12, 0.5); circle(2.4, -12, 0.5);
    ctx.strokeStyle = '#8a5a5a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -10, 1.4, 0.3, PI - 0.3); ctx.stroke();
    // feathery antennae
    for (const d of [-1, 1]) {
      ctx.strokeStyle = '#8a6a5a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(d * 1.5, -15); ctx.quadraticCurveTo(d * 6, -24, d * 11, -26); ctx.stroke();
      ctx.lineWidth = 0.8; for (let i = 1; i <= 4; i++) { const u = i / 5, ax = d * (1.5 + 9.5 * u), ay = -15 - 11 * u + u * u * 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + d * 2.5, ay - 2.5); ctx.moveTo(ax, ay); ctx.lineTo(ax - d * 1.5, ay - 3); ctx.stroke(); }
    }
    ctx.restore();
  };
  const drawSwan = (x, y, s, dir = 1, col = '#ffffff', neckBob = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.lineJoin = 'round';
    const body = P2('M-46,-8 C-50,-30 -18,-36 6,-32 C24,-30 36,-22 40,-8 C42,2 30,6 0,6 C-30,6 -44,2 -46,-8 Z');
    const tail = P2('M-40,-16 C-54,-24 -60,-34 -56,-42 C-46,-36 -36,-28 -30,-22 Z');
    const hy = -72 + neckBob;
    const neck = P2(`M18,-24 C30,-38 14,-54 20,${hy + 6} C24,${hy - 8} 46,${hy - 10} 50,${hy + 2} L42,${hy + 6} C38,${hy - 2} 30,${hy} 30,${hy + 10} C28,-52 42,-38 34,-20 Z`);
    const wing = P2('M-36,-20 C-24,-40 8,-38 22,-24 C10,-12 -14,-10 -36,-20 Z');
    const head = new Path2D(); head.arc(44, hy - 2, 9, 0, TAU);
    inkGroup([[tail, col], [body, col], [neck, col], [head, col]], 1.5);
    ink(wing, mix(col, '#e8e0f4', 0.6), 1.2);
    ctx.strokeStyle = 'rgba(140,120,180,.5)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-24 + i * 12, -26); ctx.quadraticCurveTo(-14 + i * 12, -22, -6 + i * 12, -16); ctx.stroke(); }
    ctx.fillStyle = '#ff8a3a'; tri(50, hy - 6, 66, hy, 50, hy + 3);
    ctx.fillStyle = '#2a2a3a'; tri(46, hy - 7, 53, hy - 4, 47, hy + 2); circle(45, hy - 4, 2);
    ctx.restore();
  };
  const reflection = (x, y, w, col, a = 0.3) => {
    ctx.fillStyle = col; ctx.globalAlpha = a;
    for (let i = 0; i < 4; i++) ellipse(x + Math.sin(S.t * 2 + i) * 3, y + i * 5, w * (1 - i * 0.18), 2.2);
    ctx.globalAlpha = 1;
  };
  const hexPath = (x, y, r) => { const p = new Path2D(); for (let i = 0; i < 6; i++) { const a = i * PI / 3 + PI / 6; p.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } p.closePath(); return p; };
  const honeycomb = (x, y, r, rows, t) => {
    const list = [];
    rows.forEach((n, ri) => { for (let i = 0; i < n; i++) list.push([hexPath(x + (i - (n - 1) / 2) * r * 1.74, y + ri * r * 1.5, r), ri % 2 ? '#ffc23a' : '#ffd860']); });
    inkGroup(list, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; for (const [p] of list.slice(0, 3)) { ctx.save(); ctx.clip(p); ctx.fillRect(x - 60, y - r, 120, r * 0.5); ctx.restore(); }
    // a honey drip that swells and falls
    const k = (t % 2.4) / 2.4, by = y + (rows.length - 1) * r * 1.5 + r;
    ctx.fillStyle = '#ffb81a';
    if (k < 0.6) ellipse(x, by + k * 10, 4 + k * 4, 5 + k * 10);
    else circle(x, by + 10 + (k - 0.6) * 260, 5);
  };
  const skep = (x, y, s) => {
    // a striped straw beehive dome, sitting with its base at y
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const dome = P2('M-34,0 C-38,-30 -24,-58 0,-60 C24,-58 38,-30 34,0 Z');
    ink(dome, '#f0b84a', 1.5);
    ctx.save(); ctx.clip(dome); ctx.strokeStyle = '#c88a2a'; ctx.lineWidth = 2.5;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 40, i * 11, 0, PI, TAU); ctx.stroke(); }
    ctx.restore();
    inkEllipse(0, -8, 8, 7, 0, '#5a3a2a', 1);
    ctx.restore();
  };
  const bee = (x, y, s, t) => {
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ellipse(x - 2 * s, y - 6 * s, 5 * s, 3 * s, -0.4 + Math.sin(t * 50) * 0.4); ellipse(x + 3 * s, y - 6 * s, 5 * s, 3 * s, 0.4);
    inkEllipse(x, y, 7 * s, 5 * s, 0, '#ffd23a', 1);
    ctx.fillStyle = '#3a2a3a'; ctx.fillRect(x - 2 * s, y - 4.5 * s, 2 * s, 9 * s); ctx.fillRect(x + 2.5 * s, y - 4 * s, 1.8 * s, 8 * s);
  };
  const birdV = (x, y, s) => {
    ctx.strokeStyle = 'rgba(70,50,90,.7)'; ctx.lineWidth = 2;
    const f = Math.sin(S.t * 8 + x) * 3;
    ctx.beginPath(); ctx.moveTo(x - 8 * s, y - f); ctx.quadraticCurveTo(x - 3 * s, y - 4 * s, x, y); ctx.quadraticCurveTo(x + 3 * s, y - 4 * s, x + 8 * s, y - f); ctx.stroke();
  };
  const sackShape = (w, h) => P2(`M${-w / 2 + 6},0 C${-w / 2 - 4},-2 ${-w / 2 - 4},${-h + 6} ${-w / 2 + 2},${-h + 4} L${-w / 2 - 6},${-h - 4} L${-w / 2 + 10},${-h + 1} C${-w / 4},${-h - 3} ${w / 4},${-h - 3} ${w / 2 - 10},${-h + 1} L${w / 2 + 6},${-h - 4} L${w / 2 - 2},${-h + 4} C${w / 2 + 4},${-h + 6} ${w / 2 + 4},-2 ${w / 2 - 6},0 Z`);
  // a flour sack lying down, bottom-centre at (x, y)
  const drawSack = (x, y, w = 96, h = 42, rot = 0, tint = '#f4e4c0') => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const p = sackShape(w, h);
    ink(p, tint, 1.5);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(160,110,60,.18)'; for (let i = -w / 2; i < w / 2; i += 10) ctx.fillRect(i, -h, 2, h);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-w / 2, -h, w, 7);
    ctx.restore();
    // a blue wheat stamp
    ctx.strokeStyle = '#4a7ad0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -h + 10); ctx.stroke();
    ctx.fillStyle = '#4a7ad0'; for (let i = 0; i < 3; i++) { ellipse(-4, -h + 14 + i * 6, 3, 1.8, -0.6); ellipse(4, -h + 14 + i * 6, 3, 1.8, 0.6); }
    ctx.restore();
  };
  const willow = (x, gy, s, dusk = 0) => {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    ink(P2('M-18,0 C-12,-60 -22,-120 -6,-170 L8,-170 C14,-120 8,-60 20,0 Z'), mix('#8a5a3a', '#3a2a4a', dusk), 1.5);
    const leaf = mix('#6ac25a', '#4a4a6a', dusk), leaf2 = mix('#8ad86a', '#6a5a7a', dusk);
    for (const [dx, dy, r] of [[-60, -170, 54], [50, -176, 58], [0, -206, 60], [-90, -140, 40], [90, -142, 42]]) inkCircle(dx, dy, r, leaf, 1.2);
    for (const [dx, dy, r] of [[-60, -170, 54], [50, -176, 58], [0, -206, 60], [-90, -140, 40], [90, -142, 42]]) { ctx.fillStyle = leaf; circle(dx, dy, r); }
    ctx.lineCap = 'round';
    for (let i = 0; i < 36; i++) {
      const sx = -124 + i * 7.1, sy = -160 + Math.abs(i - 18) * 2.5, len = 100 + ((i * 37) % 50), sw = Math.sin(S.t * 1.2 + i * 0.4) * 8;
      ctx.strokeStyle = i % 3 ? leaf : leaf2; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + sw * 0.5, sy + len * 0.5, sx + sw, sy + len); ctx.stroke();
    }
    ctx.restore();
  };
  // a tidy row of choice cards, centred
  const rowRect = (n, i, y, w, h, gap = 18) => ({ x: W / 2 - (n * w + (n - 1) * gap) / 2 + i * (w + gap), y, w, h });

  // =========================================================================
  // the quiz engine shared by the learning games
  // spec: title icon how rounds(g) make(g) -> {say, choices, answer, credit?, oneTry?}
  //       rect(g,i) drawQ(g) drawChoice(g,c,x,y,w,h,i,{wrong,right}) right(g) wrong(g,i) keyPick?(g)
  // =========================================================================
  const CHOICE_COLS = ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a'];
  const quiz = spec => ({
    kind: 'learn', title: spec.title, icon: spec.icon, how: spec.how,
    init(g) { Object.assign(g, { round: 0, rounds: spec.rounds(g), total: 0, fly: 0 }); spec.setup?.(g); this.next(g); },
    start(g) { speak(g.say); },
    next(g) {
      Object.assign(g, { tried: [], state: 'pick', t2: 0, shake: {}, credit: [1, 0.5, 0.2, 0], oneTry: false, fly: 0 }, spec.make(g));
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
      g.fly += dt;
      if (g.state === 'pick') {
        let i = id?.startsWith('qc:') ? +id.slice(3) : -1;
        if (i < 0 && spec.keyPick) i = spec.keyPick(g);
        if (i >= 0 && i < g.choices.length && !g.tried.includes(i)) {
          g.tried.push(i);
          const r = spec.rect(g, i);
          if (i === g.answer) {
            g.total += g.credit[g.tried.length - 1] ?? 0; g.state = 'yay'; g.t2 = spec.yay ?? 1.9; g.fly = 0;
            SFX.hit(); burst(r.x + r.w / 2, r.y + r.h / 2, 22); speak(spec.right(g));
          } else {
            g.shake[i] = 0.4; SFX.miss();
            if (g.oneTry) { g.state = 'show'; g.t2 = spec.show ?? 3.2; g.fly = 0; }
            speak(spec.wrong(g, i));
          }
        }
      } else if ((g.t2 -= dt) <= 0) {
        spec.after?.(g);
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      g.progress = `${spec.unit || 'Round'} ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      spec.drawQ(g);
      g.choices.forEach((c, i) => {
        const r = spec.rect(g, i), x = r.x + (g.shake[i] ? Math.sin(g.shake[i] * 50) * 6 : 0);
        const wrong = g.tried.includes(i) && i !== g.answer, right = g.state !== 'pick' && i === g.answer;
        button(`qc:${i}`, x, r.y, r.w, r.h, '', { color: right ? '#ffc23a' : wrong ? '#c9bcd4' : (spec.color?.(g, i) ?? CHOICE_COLS[i % 4]), on: (g.state === 'pick' && !wrong) || right, key: spec.noKeys ? null : String(i + 1) });
        spec.drawChoice(g, c, x, r.y, r.w, r.h, i, { wrong, right });
      });
      spec.drawTop?.(g);
    },
  });
  const qPanel = (title, sub, y = 70, h = 92) => {
    panel(W / 2 - 400, y, 800, h, 22);
    outlined(title, W / 2, y + (sub ? 32 : h / 2), 28, '#ff6fb5', 'center', '#fff');
    if (sub) text(sub, W / 2, y + 66, 19, '#7a4a90', 'center', 600);
  };
  const praise = () => pick(['Yes!', 'Well done!', 'You got it!', 'Brilliant!']);

  // =========================================================================
  // 1. THE OLD MILL — Millie Mouse
  // =========================================================================
  const millWheel = (x, y, r) => {
    const a = S.t * 0.8;
    ctx.lineCap = 'round';
    // paddles round the rim
    for (let i = 0; i < 16; i++) {
      const b = a + i * TAU / 16;
      ctx.save(); ctx.translate(x + Math.cos(b) * r, y + Math.sin(b) * r); ctx.rotate(b);
      inkRect(-4, -14, 26, 28, '#9a6a3e', 1.5, 3);
      ctx.restore();
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#b07a48'; ctx.lineWidth = 11; ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#c48a54'; ctx.lineWidth = 5; ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const b = a + i * TAU / 8;
      ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); ctx.stroke();
      ctx.strokeStyle = '#a8703e'; ctx.lineWidth = 5; ctx.stroke();
    }
    inkCircle(x, y, 16, '#6a4a3a', 1.5); inkCircle(x, y, 6, '#c0b0c8', 1);
  };
  BACKDROPS.mill_bg = () => {
    sky3('#56bfff', '#9fdcff', '#fff0c8', 0.45);
    bdSunburst(860, 104);
    bdClouds(3, 'rgba(255,255,255,.92)', 96);
    for (let i = 0; i < 4; i++) birdV(((i * 170 + S.t * 30) % (W + 100)) - 50, 120 + (i % 2) * 22, 1);
    // patchwork wheat fields on the far hills
    bdHills('#b4e48c', 262, 22, 0.006, 1);
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 262 - Math.sin(x * 0.006 + 1) * 22 - Math.sin(x * 0.0138 + 1) * 8.8);
    ctx.lineTo(W, H); ctx.clip();
    [[-40, 160, '#ffd860'], [120, 140, '#d8ec7a'], [260, 170, '#ffc84a'], [430, 150, '#a8dc78'], [580, 180, '#ffd860'], [760, 150, '#e8e070'], [900, 160, '#ffc84a']].forEach(([x, w, c]) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x + 30, 220); ctx.lineTo(x + w + 30, 220); ctx.lineTo(x + w, 330); ctx.fill();
      ctx.strokeStyle = 'rgba(140,100,40,.25)'; ctx.lineWidth = 1.5; for (let k = 10; k < w; k += 14) { ctx.beginPath(); ctx.moveTo(x + k, 330); ctx.lineTo(x + k + 30, 220); ctx.stroke(); }
    });
    ctx.restore();
    drawTree(40, 300, 120, 30, 0); drawTree(960, 296, 110, 30, 2);
    bdHills('#96d46c', 318, 10, 0.012, 3);
    ctx.fillStyle = '#86cc62'; ctx.fillRect(0, 316, W, H - 316);
    // wheat field swaying in the mid-ground
    for (let i = 0; i < 70; i++) {
      const x = (i * 23) % 420 - 10, base = 404 + (i % 3) * 4, sw = Math.sin(S.t * 1.6 + x * 0.03) * 5, top = base - 56 - (i * 13) % 18;
      ctx.strokeStyle = i % 2 ? '#d8a83a' : '#e8c050'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + sw * 0.4, (base + top) / 2, x + sw, top); ctx.stroke();
      ctx.fillStyle = '#f4c848'; ellipse(x + sw, top - 6, 3.5, 9, sw * 0.03);
    }
    // the millrace: a wooden flume on trestles that pours onto the wheel
    for (const tx of [240, 330, 410]) { inkRect(tx - 4, 232, 8, 180, '#8a5a34', 1.5, 2); ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx - 30, 410); ctx.lineTo(tx, 260); ctx.lineTo(tx + 30, 410); ctx.stroke(); }
    inkRect(150, 214, 360, 22, '#b07a48', 2, 3);
    ctx.fillStyle = '#7fd0f0'; ctx.fillRect(152, 214, 356, 7);
    inkRect(120, 200, 50, 210, '#a8a0b0', 2, 6);
    ctx.fillStyle = '#8e86a0'; for (let y = 214; y < 400; y += 26) { ctx.fillRect(124, y, 42, 3); }
    // water wheel, mill and the stream it turns
    millWheel(500, 320, 104);
    // the water falling onto the wheel
    ctx.strokeStyle = 'rgba(130,210,255,.85)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(505, 222); ctx.quadraticCurveTo(522, 230, 526, 260); ctx.stroke();
    for (let i = 0; i < 6; i++) { const k = (S.t * 1.5 + i / 6) % 1; ctx.fillStyle = `rgba(220,245,255,${1 - k})`; circle(520 + i * 4 + k * 20, 236 + k * 60, 3); }
    // the mill: stone walls, tiled roof, a hoist with a sack hanging, weathervane
    const wall = P2('M590,440 L590,190 L800,190 L800,440 Z');
    ink(wall, '#d8ccc0', 2);
    ctx.save(); ctx.clip(wall);
    for (let row = 0; row < 11; row++) for (let c = 0; c < 7; c++) {
      const sx = 592 + c * 32 + (row % 2) * 16 - 16, sy = 192 + row * 23;
      inkRect(sx, sy, 30, 21, ['#c8bcb0', '#e0d6cc', '#bfb2a8'][(row * 3 + c) % 3], 1, 6);
    }
    ctx.restore();
    ink(P2('M572,196 L695,96 L818,196 Z'), '#c0584a', 2);
    ctx.save(); ctx.clip(P2('M572,196 L695,96 L818,196 Z')); ctx.strokeStyle = 'rgba(90,30,40,.35)'; ctx.lineWidth = 2;
    for (let y = 110; y < 200; y += 14) { ctx.beginPath(); ctx.moveTo(560, y); ctx.lineTo(830, y); ctx.stroke(); }
    ctx.restore();
    inkRect(691, 70, 4, 28, '#5a4a5a', 1, 1);
    ctx.save(); ctx.translate(693, 74); ctx.rotate(Math.sin(S.t * 0.7) * 0.25); ink(P2('M-16,0 L10,-4 L16,0 L10,4 Z'), '#ffcf4a', 1); ctx.restore();
    // round window high up, a hoist door with a sack on a rope, big door, flower box
    inkCircle(695, 160, 16, '#8ad0ff', 1.5); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(679, 160); ctx.lineTo(711, 160); ctx.moveTo(695, 144); ctx.lineTo(695, 176); ctx.stroke();
    inkRect(740, 216, 40, 50, '#7a4a2e', 1.5, 3); inkRect(730, 206, 70, 8, '#6a4028', 1.5, 2);
    ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 2; const sw = Math.sin(S.t * 1.3) * 4;
    ctx.beginPath(); ctx.moveTo(792, 214); ctx.lineTo(792 + sw, 286); ctx.stroke();
    drawSack(792 + sw, 318, 40, 30, Math.PI / 2);
    inkRect(612, 248, 46, 44, '#8ad0ff', 2, 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(635, 250); ctx.lineTo(635, 290); ctx.moveTo(614, 270); ctx.lineTo(656, 270); ctx.stroke();
    inkRect(606, 292, 58, 12, '#a0683a', 1.5, 2); for (let i = 0; i < 4; i++) flower(614 + i * 14, 290, 6, ['#ff6fae', '#fff', '#ffd84a', '#ff9a5a'][i], '#ffd84a', 1);
    ink(P2('M670,440 L670,350 C670,320 720,320 720,350 L720,440 Z'), '#8a5634', 2);
    ctx.strokeStyle = 'rgba(60,30,20,.4)'; ctx.lineWidth = 2; for (const x of [682, 695, 708]) { ctx.beginPath(); ctx.moveTo(x, 335); ctx.lineTo(x, 440); ctx.stroke(); }
    inkCircle(711, 392, 3, '#ffd84a', 1);
    // ivy climbing the corner
    for (let i = 0; i < 14; i++) { const vy = 430 - i * 15; ctx.fillStyle = i % 2 ? '#4aa84a' : '#5cc05a'; ellipse(596 + Math.sin(i * 1.3) * 8, vy, 8, 5, 0.6); }
    // the stream from the wheel, and a little stone bridge
    const stream = P2('M0,404 C120,398 300,410 420,404 C470,402 560,400 600,412 C560,436 380,446 200,442 C120,440 40,446 0,446 Z');
    const sg = ctx.createLinearGradient(0, 400, 0, 446); sg.addColorStop(0, '#9ae4ff'); sg.addColorStop(1, '#3ea4e8');
    ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 3; ctx.stroke(stream); ctx.fillStyle = sg; ctx.fill(stream);
    ctx.save(); ctx.clip(stream); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const x = (i * 97 - S.t * 50) % 640; const xx = x < 0 ? x + 640 : x; ctx.beginPath(); ctx.moveTo(xx, 414 + (i % 3) * 9); ctx.lineTo(xx + 22, 414 + (i % 3) * 9); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 5; i++) { const k = (S.t * 2 + i / 5) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; circle(470 + i * 14, 416 - Math.sin(k * PI) * 18, 3); }
    // the flour cart and a pile of sacks
    inkRect(818, 392, 124, 34, '#b8804a', 2, 4);
    ctx.strokeStyle = 'rgba(80,40,20,.4)'; ctx.lineWidth = 2; for (let x = 840; x < 940; x += 22) { ctx.beginPath(); ctx.moveTo(x, 394); ctx.lineTo(x, 424); ctx.stroke(); }
    drawSack(852, 394, 60, 28); drawSack(910, 394, 60, 28, 0, '#efdcb4'); drawSack(880, 368, 60, 28);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(818, 418); ctx.lineTo(780, 434); ctx.stroke();
    inkCircle(850, 432, 18, '#9a6a3e', 1.5); inkCircle(850, 432, 5, '#5a3a2a', 1);
    inkCircle(918, 432, 18, '#9a6a3e', 1.5); inkCircle(918, 432, 5, '#5a3a2a', 1);
    // the near ground: grass, a dusty path, pebbles, flowers and a hen
    const gg = ctx.createLinearGradient(0, 446, 0, H); gg.addColorStop(0, '#8fd86a'); gg.addColorStop(1, '#74c256');
    ctx.fillStyle = gg; ctx.fillRect(0, 446, W, H - 446);
    ctx.fillStyle = '#ecd29a'; ctx.beginPath(); ctx.moveTo(0, 486); ctx.quadraticCurveTo(480, 468, W, 490); ctx.lineTo(W, 520); ctx.quadraticCurveTo(480, 500, 0, 522); ctx.fill();
    for (let i = 0; i < 18; i++) inkEllipse((i * 131 + 40) % W, 494 + (i * 17) % 22, 5 + (i % 3), 3, 0, ['#d8ccd8', '#c8bcc8', '#f0e8ec'][i % 3], 0.8);
    grassTufts(26, 452, 540, '#5aa848');
    for (let i = 0; i < 9; i++) flower(70 + i * 110 + (i % 2) * 30, 458 + (i % 3) * 30, 7, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1.2);
    emoji('🐔', 70 + Math.sin(S.t * 0.6) * 20, 470, 34);
    emoji('🦋', 380 + Math.sin(S.t * 0.8) * 60, 300 + Math.sin(S.t * 2.3) * 16, 20);
  };

  // --- Sack Stack: the crane swings flour sacks; drop each one to build a tall, steady tower ---------
  const SS = { w: 104, h: 42, base: 456, hook: 92 };
  MG.millsackstack = {
    kind: 'action', title: () => 'Sack Stack', icon: () => '🌾',
    how: () => 'The crane swings the flour sacks. Press SPACE or tap to drop each sack right on top of the tower. Build it tall and steady!',
    init(g) {
      const target = [7, 9, 11][g.tier - 1];
      Object.assign(g, { target, left: target + [5, 4, 3][g.tier - 1], tower: [], ph: rand(0, 6), fall: null, tumbles: [], respawn: 0, cam: 0, perfect: 0, wob: 0, endT: 0 });
      g.say = 'Drop the sack when it is right above the tower!';
    },
    start(g) { speak(g.say); },
    craneX(g) { return 480 + Math.sin(g.ph) * 230; },
    topX(g) { return g.tower.length ? g.tower[g.tower.length - 1] : 480; },
    update(g, dt) {
      const speed = [1.5, 1.9, 2.3][g.tier - 1] + g.tower.length * 0.04;
      g.ph += dt * speed;
      g.wob = Math.max(0, g.wob - dt);
      const camGoal = Math.max(0, (g.tower.length - 5) * SS.h);
      g.cam = lerp(g.cam, camGoal, Math.min(1, dt * 4));
      g.respawn = Math.max(0, g.respawn - dt);
      const ready = !g.fall && g.respawn <= 0 && g.left > 0 && g.tower.length < g.target;
      if (ready && (pressed[' '] || pressed.enter || pressed.arrowdown || pressed.s || pointer.clicked)) {
        g.fall = { x: this.craneX(g), y: SS.hook + 50 + SS.h, vy: 0 }; g.left--; SFX.jump();
      }
      if (g.fall) {
        const f = g.fall, topY = SS.base - g.tower.length * SS.h + g.cam;
        f.vy += 1500 * dt; f.y += f.vy * dt;
        if (f.y >= topY) {
          const dx = f.x - this.topX(g);
          if (Math.abs(dx) <= SS.w * 0.55) {
            const perfect = Math.abs(dx) < 12;
            g.tower.push(perfect ? this.topX(g) : f.x);
            if (perfect) { g.perfect++; SFX.sparkle(); floatText(f.x, topY - 50, 'Perfect!', '#fff6a8', false, 26); burst(f.x, topY - 20, 16); }
            else { SFX.pop(); floatText(f.x, topY - 50, pick(['Nice!', 'Good!', 'Steady!']), '#ffffff', false, 22); }
            g.wob = 0.5; g.fall = null; g.respawn = 0.35;
          } else {
            g.tumbles.push({ x: f.x, y: f.y, vx: Math.sign(dx) * 160, vy: -120, rot: 0, vr: Math.sign(dx) * 5 });
            SFX.miss(); floatText(f.x, topY - 40, 'Oops!', '#ffb0c4', false, 24);
            g.fall = null; g.respawn = 0.45;
          }
        }
      }
      for (const t of g.tumbles) { t.vy += 1200 * dt; t.x += t.vx * dt; t.y += t.vy * dt; t.rot += t.vr * dt; }
      g.tumbles = g.tumbles.filter(t => t.y < H + 100);
      const n = g.tower.length;
      g.score = n / g.target * (0.85 + 0.15 * (n ? g.perfect / n : 0));
      g.progress = `Tower ${n} of ${g.target}   ·   🌾 ${g.left} left`;
      if ((n >= g.target || (g.left <= 0 && !g.fall)) && !g.tumbles.length) {
        if (!g.endT && n >= g.target) { speak('What a tall tower!'); burst(this.topX(g), SS.base - n * SS.h + g.cam, 30); }
        g.endT += dt; if (g.endT > 1.2) g.done = true;
      }
    },
    draw(g) {
      // crane beam and trolley
      inkRect(110, 64, 740, 16, '#a8703e', 2, 4);
      ctx.fillStyle = 'rgba(80,40,20,.35)'; for (let x = 130; x < 840; x += 40) ctx.fillRect(x, 66, 3, 12);
      const cx = this.craneX(g), ready = !g.fall && g.respawn <= 0 && g.left > 0 && g.tower.length < g.target;
      inkRect(cx - 26, 74, 52, 18, '#5a6a8a', 2, 5);
      inkCircle(cx - 14, 92, 6, '#3a3a4a', 1); inkCircle(cx + 14, 92, 6, '#3a3a4a', 1);
      ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, 92); ctx.lineTo(cx, SS.hook + 40); ctx.stroke();
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, SS.hook + 46, 7, -0.3, PI + 0.3, true); ctx.stroke();
      if (ready) {
        // a dashed drop guide from the sack to the tower top
        const topY = SS.base - g.tower.length * SS.h + g.cam, over = Math.abs(cx - this.topX(g)) < 12;
        ctx.setLineDash([8, 8]); ctx.strokeStyle = over ? 'rgba(255,240,120,.95)' : 'rgba(255,255,255,.6)'; ctx.lineWidth = over ? 4 : 2.5;
        ctx.beginPath(); ctx.moveTo(cx, SS.hook + 52 + SS.h); ctx.lineTo(cx, topY - 4); ctx.stroke(); ctx.setLineDash([]);
        drawSack(cx, SS.hook + 50 + SS.h, SS.w, SS.h);
      }
      // the cart the tower stands on
      const by = SS.base + g.cam;
      if (by < H + 60) {
        inkRect(380, by, 200, 26, '#b8804a', 2.5, 4);
        inkCircle(410, by + 34, 18, '#9a6a3e', 2); inkCircle(550, by + 34, 18, '#9a6a3e', 2);
        inkCircle(410, by + 34, 5, '#5a3a2a', 1); inkCircle(550, by + 34, 5, '#5a3a2a', 1);
      }
      const wob = Math.sin(g.wob * 30) * g.wob * 0.03;
      g.tower.forEach((x, i) => {
        const y = SS.base - i * SS.h + g.cam;
        if (y - SS.h > H) return;
        ctx.save(); ctx.translate(480, SS.base + g.cam); ctx.rotate(wob * (i / Math.max(1, g.tower.length))); ctx.translate(-480, -(SS.base + g.cam));
        drawSack(x, y, SS.w, SS.h, 0, ['#f4e4c0', '#efdcb4', '#f8ead0'][i % 3]);
        ctx.restore();
      });
      if (g.fall) drawSack(g.fall.x, g.fall.y, SS.w, SS.h);
      for (const t of g.tumbles) drawSack(t.x, t.y, SS.w, SS.h, t.rot);
      // Millie cheers from the side
      drawCritter('Millie Mouse', 860, GY + 40, 0.62, -1);
    },
  };

  // --- Mill Clock: Aubrey runs across a giant clock face and drags the hands to the time Millie asks for ---
  // she grabs a hand by running onto the glowing handle at its tip; while she holds it the hand points at her,
  // and when she lets go (Space, a tap, or just standing still) it clicks to the nearest mark. Ring the bell to check.
  const timeName = (h, m) => (m === 0 ? `${h} o'clock` : m === 30 ? `half past ${h}` : m === 15 ? `quarter past ${h}` : `quarter to ${h % 12 + 1}`);
  const timeSay = (h, m) => (m === 0 ? `${NUM_WORDS[h]} o'clock` : m === 30 ? `half past ${NUM_WORDS[h]}` : m === 15 ? `quarter past ${NUM_WORDS[h]}` : `quarter to ${NUM_WORDS[h % 12 + 1]}`);
  const MC = { x: 480, y: 312, r: 206, mLen: 172, hLen: 112, ah: 84 };
  const mcAng = (x, y) => (Math.atan2(x - MC.x, -(y - MC.y)) + TAU) % TAU;          // 0 = straight up to 12
  const mcTip = (a, len) => [MC.x + Math.sin(a) * len, MC.y - Math.cos(a) * len];
  const angDiff = (a, b) => { let d = Math.abs(a - b) % TAU; return d > Math.PI ? TAU - d : d; };
  function mcFace(t) {
    // the big wooden mill clock lying on the mill floor, with gears turning around it
    for (const [gx, gy, r, sp] of [[120, 470, 70, 0.4], [60, 360, 44, -0.64], [850, 150, 64, -0.45], [900, 270, 40, 0.72], [830, 470, 54, 0.53]]) {
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * sp);
      for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * TAU / 12); inkRect(-r * 0.13, -r - 9, r * 0.26, 18, '#b88a4a', 1.5, 3); ctx.restore(); }
      inkCircle(0, 0, r, '#c89a58', 2); inkCircle(0, 0, r * 0.62, '#b08040', 1.5); inkCircle(0, 0, r * 0.18, '#7a5430', 1.5);
      ctx.restore();
    }
    inkCircle(MC.x, MC.y, MC.r + 22, '#a8703e', 3);
    ctx.strokeStyle = 'rgba(80,40,20,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(MC.x, MC.y, MC.r + 12, 0, TAU); ctx.stroke();
    const fg = ctx.createRadialGradient(MC.x - 60, MC.y - 70, 20, MC.x, MC.y, MC.r);
    fg.addColorStop(0, '#fffdf2'); fg.addColorStop(1, '#f6e8c8');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(MC.x, MC.y, MC.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 60; i++) {
      const a = i * TAU / 60, big = i % 5 === 0, r0 = MC.r * (big ? 0.86 : 0.91);
      ctx.strokeStyle = big ? '#5a3a6e' : 'rgba(90,58,110,.4)'; ctx.lineWidth = big ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(...mcTip(a, r0)); ctx.lineTo(...mcTip(a, MC.r * 0.97)); ctx.stroke();
    }
    for (let n = 1; n <= 12; n++) { const [nx, ny] = mcTip(n * TAU / 12, MC.r * 0.74); text(String(n), nx, ny, 34, '#5a2a6e', 'center', 800); }
  }
  function mcHand(a, len, w, col, glow, held, t) {
    const [tx, ty] = mcTip(a, len);
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = w + 6; ctx.beginPath(); ctx.moveTo(MC.x, MC.y); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    // the handle at the tip that Aubrey grabs
    if (glow) { ctx.fillStyle = `rgba(255,240,140,${0.35 + 0.25 * Math.sin(t * 6)})`; circle(tx, ty, 30); }
    inkCircle(tx, ty, held ? 17 : 15, held ? '#fff6a8' : col, 2);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(tx - 4, ty - 5, 4);
  }
  MG.millclock = {
    kind: 'learn', title: () => 'Mill Clock', icon: () => '🕰️',
    how: g => `Millie needs the giant mill clock set! Move Aubrey with the arrow keys or your finger. Run onto the round handle at the end of a hand to grab it, run round to move it, then let go with Space or a tap. The short blue hand shows the hour${g.tier > 1 ? ', the long red hand shows the minutes' : ''}. Ring the bell when it's right!`,
    init(g) {
      const rounds = [4, 5, 5][g.tier - 1], times = [];
      while (times.length < rounds) {
        const i = times.length, kinds = g.tier === 1 ? [0] : g.tier === 2 ? (i < 2 ? [0] : [0, 30]) : (i < 1 ? [0, 30] : [0, 30, 15, 45]);
        const t = [randInt(1, 12), pick(kinds)];
        if (!times.some(q => q[0] === t[0] && q[1] === t[1])) times.push(t);
      }
      Object.assign(g, { rounds, times, round: 0, total: 0, ax: MC.x, ay: MC.y + 120, vx: 0, vy: 0, face: 1, run: 0, held: null, still: 0, grabT: 0, state: 'set', t2: 0, tries: 0, hint: 0 });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      [g.h, g.m] = g.times[g.round];
      // start the hands somewhere wrong
      let mh; do mh = randInt(0, 11) * 5; while (mh === g.m);
      let hh; do hh = randInt(0, 23) / 2; while (Math.abs(hh - (g.h % 12 + g.m / 60)) < 1);
      Object.assign(g, { ma: mh * TAU / 60, ha: hh * TAU / 12, held: null, state: 'set', tries: 0, t2: 0 });
      g.say = `Set the clock to ${timeSay(g.h, g.m)}!`;
      if (g.phase === 'play') speak(g.say);
    },
    snap(g, which) {
      if (which === 'm') g.ma = Math.round(g.ma / (TAU / 12)) % 12 * (TAU / 12);           // minute hand clicks to every 5 minutes
      else g.ha = Math.round(g.ha / (TAU / 48)) % 48 * (TAU / 48);                          // hour hand clicks in quarter-hour steps
      tone(880, 0.05, 'square', 0.04); tone(660, 0.06, 'triangle', 0.05, 0.04);
    },
    check(g) {
      const wantM = g.m * TAU / 60, wantH = (g.h % 12 + g.m / 60) * TAU / 12;
      const okM = angDiff(g.ma, wantM) < 0.05, okH = angDiff(g.ha, wantH) < TAU / 48 + 0.02;
      g.tries++;
      if (okM && okH) {
        g.total += g.tries === 1 ? 1 : g.tries === 2 ? 0.5 : 0.2; g.state = 'yay'; g.t2 = 0;
        SFX.sparkle(); burst(MC.x, MC.y, 30, { colors: ['#fff6a8', '#ff9ac8', '#9ad8ff'] });
        for (let i = 0; i < (g.m === 0 ? g.h : 3); i++) tone(520, 0.35, 'sine', 0.07, 0.25 + i * 0.3);
        speak(`${praise()} It's ${timeSay(g.h, g.m)}!`);
      } else if (g.tries >= 3) {
        // after three tries Millie sets it herself and shows how it looks, so nobody gets stuck
        g.ma = wantM; g.ha = wantH; g.held = null; g.state = 'yay'; g.t2 = -1.2; SFX.blip();
        speak(`Let's set it together. For ${timeSay(g.h, g.m)}, the long hand points ${g.m === 0 ? 'to the twelve' : g.m === 30 ? 'to the six' : g.m === 15 ? 'to the three' : 'to the nine'}, and the short hand ${g.m === 0 ? `points to the ${NUM_WORDS[g.h]}` : 'is near the ' + NUM_WORDS[g.m === 45 ? g.h % 12 + 1 : g.h]}.`);
      } else if (g.tries >= 3) {
        // after three tries Millie sets it herself and shows how it looks, so nobody gets stuck
        g.ma = wantM; g.ha = wantH; g.held = null; g.state = 'yay'; g.t2 = -1.2; SFX.blip();
        speak(`Let's set it together. For ${timeSay(g.h, g.m)}, the long hand points ${g.m === 0 ? 'to the twelve' : g.m === 30 ? 'to the six' : g.m === 15 ? 'to the three' : 'to the nine'}, and the short hand ${g.m === 0 ? `points to the ${NUM_WORDS[g.h]}` : 'is near the ' + NUM_WORDS[g.m === 45 ? g.h % 12 + 1 : g.h]}.`);
      } else {
        SFX.miss(); g.hint = 3;
        const mWord = g.m === 0 ? 'straight up to the twelve' : g.m === 30 ? 'straight down to the six' : g.m === 15 ? 'to the three' : 'to the nine';
        if (!okM) speak(`Not yet! For ${timeSay(g.h, g.m)}, the long red hand points ${mWord}.`);
        else speak(g.m === 0 ? `The minutes are right! Now point the short blue hand at the ${NUM_WORDS[g.h]}.`
          : g.m === 30 ? `The minutes are right! At half past, the short blue hand sits halfway between the ${NUM_WORDS[g.h]} and the ${NUM_WORDS[g.h % 12 + 1]}.`
            : g.m === 15 ? `The minutes are right! At quarter past, the short hand is just a little past the ${NUM_WORDS[g.h]}.`
              : `The minutes are right! At quarter to, the short hand is nearly at the ${NUM_WORDS[g.h % 12 + 1]}.`);
      }
    },
    update(g, dt, id) {
      g.grabT = Math.max(0, g.grabT - dt); g.hint = Math.max(0, g.hint - dt);
      if (g.state === 'yay') {
        if ((g.t2 += dt) > 2.8) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
        g.progress = `Clock ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`; g.score = g.total / g.rounds; return;
      }
      if (id === 'mcbell' || pressed.enter) { if (g.held) { this.snap(g, g.held); g.held = null; } this.check(g); }
      // Aubrey runs about on the clock face
      const sp = 280, kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      const onBell = inRect({ x: W - 150, y: 448, w: 134, h: 74 });
      if (kx || ky) { g.vx = lerp(g.vx, kx * sp, dt * 8); g.vy = lerp(g.vy, ky * sp, dt * 8); }
      else if ((pointerMoved(g) || g.usePointer) && !onBell) { g.vx = clamp((pointer.x - g.ax) * 5, -sp, sp); g.vy = clamp((pointer.y - g.ay) * 5, -sp, sp); }
      else { g.vx *= 1 - dt * 6; g.vy *= 1 - dt * 6; }
      g.ax += g.vx * dt; g.ay += g.vy * dt;
      const dr = Math.hypot(g.ax - MC.x, g.ay - MC.y);
      if (dr > MC.r - 14) { g.ax = MC.x + (g.ax - MC.x) / dr * (MC.r - 14); g.ay = MC.y + (g.ay - MC.y) / dr * (MC.r - 14); }
      const moving = Math.hypot(g.vx, g.vy) > 40;
      if (Math.abs(g.vx) > 25) g.face = Math.sign(g.vx);
      g.run = moving ? g.run + dt : 0;
      g.still = moving ? 0 : g.still + dt;
      if (g.held) {
        // the hand follows her round the clock
        if (dr > 26) { const a = mcAng(g.ax, g.ay); if (g.held === 'm') g.ma = a; else g.ha = a; }
        const letGo = pressed[' '] || (pointer.clicked && !onBell) || g.still > 0.9;
        if (letGo && g.grabT <= 0) { this.snap(g, g.held); g.held = null; g.grabT = 0.6; }
      } else if (g.grabT <= 0) {
        // grab whichever handle she runs onto (the hour handle sits nearer the middle)
        for (const [w, a, len] of [['m', g.ma, MC.mLen], ['h', g.ha, MC.hLen]]) {
          const [tx, ty] = mcTip(a, len);
          if (Math.hypot(g.ax - tx, g.ay - ty) < 28) { g.held = w; g.grabT = 0.4; SFX.pick(); speak(w === 'm' ? 'The long minute hand!' : 'The short hour hand!'); break; }
        }
      }
      g.progress = `Clock ${g.round + 1} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      const t = S.t;
      mcFace(t);
      // where the hands should go, after a wrong try
      if (g.hint > 0) {
        ctx.globalAlpha = Math.min(1, g.hint) * 0.35;
        for (const [a, len] of [[g.m * TAU / 60, MC.mLen], [(g.h % 12 + g.m / 60) * TAU / 12, MC.hLen]]) { ctx.strokeStyle = '#7ad06a'; ctx.lineWidth = 12; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(MC.x, MC.y); ctx.lineTo(...mcTip(a, len)); ctx.stroke(); }
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      const setting = g.state === 'set';
      mcHand(g.ma, MC.mLen, 9, '#ff5f7e', setting && !g.held, g.held === 'm', t);
      mcHand(g.ha, MC.hLen, 15, '#4a6ae0', setting && !g.held, g.held === 'h', t);
      inkCircle(MC.x, MC.y, 13, '#ffd84a', 2);
      // Aubrey, pulling the hand she's holding
      const fr = g.state === 'yay' ? 'twirl' : g.run > 0 ? `run${1 + (Math.floor(g.run * 11) % 5)}` : 'idle_front';
      const hop = g.state === 'yay' ? Math.abs(Math.sin(g.t2 * 7)) * 12 : 0;
      ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(g.ax, g.ay + MC.ah * 0.5, 16, 4);
      drawAubrey(g.ax, g.ay + MC.ah * 0.5, fr, g.face, hop, MC.ah / IMG.idle_front.height);
      if (g.held) { const [tx, ty] = mcTip(g.held === 'm' ? g.ma : g.ha, g.held === 'm' ? MC.mLen : MC.hLen); ctx.strokeStyle = 'rgba(255,240,140,.8)'; ctx.lineWidth = 3; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(g.ax, g.ay - 4); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]); }
      // the time to set, and Millie
      const tw = 300;
      rrect(16, 68, tw, 92, 20, 'rgba(255,255,255,.94)', OL, 2);
      text('Set the clock to', 16 + tw / 2, 90, 16, '#9a6ab0', 'center', 700);
      outlined(timeName(g.h, g.m), 16 + tw / 2, 122, 28, '#ff6fb5', 'center', '#fff');
      text(`${g.h}:${String(g.m).padStart(2, '0')}`, 16 + tw / 2, 148, 15, '#5a2a6e', 'center', 800);
      drawCritter('Millie Mouse', 92, GY + 40, 0.6, 1);
      if (g.held) text(g.held === 'm' ? 'Holding the minute hand: let go with Space or a tap' : 'Holding the hour hand: let go with Space or a tap', MC.x, 524, 15, '#5a2a6e', 'center', 700);
      if (g.state === 'yay') outlined(timeName(g.h, g.m) + '!', MC.x, 92, 34, '#fff6a8');
      // the bell to ring when the clock is set
      if (g.state === 'set') button('mcbell', W - 150, 448, 134, 74, 'Ring!', { icon: '🔔', color: '#ffb03a', size: 22, key: 'Enter' });
    },
  };

  restage('mill', {
    bg: 'mill_bg',
    games: [['millsackstack', 'honey', {}], ['millclock', 'ribbon', {}]],
    intro: ['*:Splish, splash! The old mill wheel creaks round and round.', 'N:Squeak! The flour sacks must be stacked on the cart before the baker comes. Can you drop them nice and steady?', 'A:determined:A super tall tower, coming up!'],
    mid: ['N:Squeak squeak! The giant mill clock is all muddled, and the bread must go in the oven on time!', 'N:Can you run across the clock face and pull the hands to the right times?', 'A:determined:The short hand tells the hour...'],
    outro: ['N:Golden honey for your bread, and flour-sack ribbons for your unicorn!', 'A:happy:Thank you, Millie!'],
  });

  // =========================================================================
  // 2. OWL HOLLOW — Granny Owl
  // =========================================================================
  const bigTree = () => {
    const bark = '#7a5640', bark2 = '#5e4232';
    // branches reaching out (under the canopy) with lanterns on them
    ctx.lineCap = 'round';
    for (const [pts, w] of [[[560, 210, 700, 170, 860, 190], 20], [[520, 220, 400, 180, 300, 196], 18]]) {
      ctx.strokeStyle = OL; ctx.lineWidth = w + 5; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); ctx.stroke();
      ctx.strokeStyle = bark; ctx.lineWidth = w; ctx.stroke();
    }
    const trunk = P2('M470,452 C496,440 506,420 508,380 C512,320 500,260 520,200 L600,200 C616,260 604,320 610,380 C612,420 624,442 652,452 C620,456 600,446 590,440 C580,450 540,452 528,440 C516,450 490,456 470,452 Z');
    ink(trunk, bark, 2.5);
    ctx.save(); ctx.clip(trunk); ctx.strokeStyle = bark2; ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) { const x = 516 + i * 13; ctx.beginPath(); ctx.moveTo(x, 210); ctx.bezierCurveTo(x - 8, 290, x + 10, 350, x - 4, 450); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,200,140,.12)'; ctx.fillRect(500, 200, 30, 260);
    ctx.restore();
    // the owl hole with blinking eyes, and a little round door in the roots
    inkEllipse(560, 286, 34, 44, 0, '#5a3a2a', 2); ctx.fillStyle = '#1e1428'; ellipse(560, 290, 26, 36);
    const blink = (S.t % 4.2) < 0.15;
    if (!blink) { for (const d of [-10, 10]) { glow(560 + d, 284, 14, 'rgba(255,220,80,.8)'); ctx.fillStyle = '#ffd84a'; circle(560 + d, 284, 7); ctx.fillStyle = '#1e1428'; circle(560 + d + 1, 284, 3.5); } }
    else { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; for (const d of [-10, 10]) { ctx.beginPath(); ctx.moveTo(560 + d - 6, 284); ctx.lineTo(560 + d + 6, 284); ctx.stroke(); } }
    ink(P2('M540,444 L540,420 C540,404 566,404 566,420 L566,444 Z'), '#c06ae0', 1.5); inkCircle(560, 428, 2.5, '#ffd84a', 1);
    glow(553, 405, 10, 'rgba(255,230,140,.9)'); ctx.fillStyle = '#ffe9a0'; circle(553, 400, 3);
    // the canopy, dusky green with purple shadows
    const leaf = '#3e6a5e', leaf2 = '#4e7e68', sh = '#344e5a';
    const clumps = [[560, 150, 100], [440, 170, 70], [680, 168, 74], [370, 196, 48], [770, 196, 52], [500, 104, 64], [630, 104, 66]];
    for (const [x, y, r] of clumps) inkCircle(x, y, r, leaf, 2);
    for (const [x, y, r] of clumps) { ctx.fillStyle = leaf; circle(x, y, r); }
    for (const [x, y, r] of clumps) { ctx.fillStyle = sh; circle(x + r * 0.2, y + r * 0.3, r * 0.7); ctx.fillStyle = leaf2; circle(x - r * 0.25, y - r * 0.3, r * 0.5); }
    for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(160,220,170,.35)'; ellipse(380 + (i * 61) % 400, 90 + (i * 37) % 150, 7, 4, (i % 5) * 0.6); }
    // lanterns hanging from the branches
    for (const [x, y, len, c] of [[800, 186, 34, '#ffd860'], [700, 172, 54, '#ff9ac0'], [360, 190, 40, '#a6f0b8'], [430, 182, 60, '#ffd860']]) {
      const sw = Math.sin(S.t * 1.4 + x) * 0.06;
      ctx.save(); ctx.translate(x, y); ctx.rotate(sw); lantern(0, len, 1, c, len); ctx.restore();
    }
  };
  BACKDROPS.owlhollow_bg = () => {
    sky3('#2c2468', '#9a5aa8', '#ffb070', 0.55, 380);
    twinkles(26, 64, 220);
    // a pale crescent moon
    glow(150, 110, 70, 'rgba(255,240,200,.45)'); ctx.fillStyle = '#fff4d0'; circle(150, 110, 30); ctx.fillStyle = '#4a347a'; circle(138, 102, 26);
    // far hills and a line of dusky trees
    bdHills('#6a4a8a', 320, 26, 0.006, 0.5);
    for (const [x, h, t] of [[60, 200, 2], [200, 170, 0], [330, 150, 1], [780, 160, 2], [900, 210, 0]]) drawTree(x, 380, h, 50, t, 0.8);
    bdHills('#4e4078', 372, 14, 0.012, 2);
    // mossy hollow floor
    const gg = ctx.createLinearGradient(0, 380, 0, H); gg.addColorStop(0, '#3e6a5a'); gg.addColorStop(1, '#2e5048');
    ctx.fillStyle = gg; ctx.fillRect(0, 382, W, H - 382);
    ctx.fillStyle = 'rgba(160,220,170,.18)'; for (let i = 0; i < 30; i++) ellipse((i * 113) % W, 400 + (i * 29) % 130, 18, 5);
    // ferns
    const fern = (x, y, s, d) => {
      ctx.strokeStyle = '#4e9a6a'; ctx.lineWidth = 2.5;
      for (let k = -2; k <= 2; k++) {
        const a = -PI / 2 + k * 0.38 + Math.sin(S.t + x) * 0.04;
        const ex = x + Math.cos(a) * 56 * s, ey = y + Math.sin(a) * 56 * s;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + ex) / 2 + d * 8, (y + ey) / 2, ex, ey); ctx.stroke();
        ctx.fillStyle = '#5aae78'; for (let j = 1; j < 6; j++) { const t = j / 6; ellipse(lerp(x, ex, t), lerp(y, ey, t), 6 * s, 2.5 * s, a + 1.2); }
      }
    };
    fern(40, 420, 1, 1); fern(140, 410, 0.8, -1); fern(860, 416, 1, 1); fern(940, 430, 0.9, -1); fern(420, 446, 0.7, 1);
    bigTree();
    // a lantern post on the left and a string of lights to the tree
    inkRect(96, 300, 10, 150, '#5a4060', 1.5, 2);
    inkRect(86, 296, 30, 8, '#5a4060', 1.5, 2);
    lantern(101, 304, 1.2, '#ffd860', 0);
    ctx.strokeStyle = 'rgba(40,30,60,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(110, 300); ctx.quadraticCurveTo(300, 360, 498, 300); ctx.stroke();
    for (let i = 1; i < 12; i++) { const k = i / 12, x = lerp(110, 498, k), y = 300 + 60 * 2 * k * (1 - k) * 1.0; ctx.fillStyle = ['#ffd860', '#ff9ac0', '#a6f0b8', '#8ad4ff'][i % 4]; glow(x, y + 4, 10, 'rgba(255,240,170,.8)', 0.6 + 0.4 * Math.sin(S.t * 3 + i)); ctx.fillStyle = ['#ffd860', '#ff9ac0', '#a6f0b8', '#8ad4ff'][i % 4]; circle(x, y + 4, 4); }
    // glowing mushrooms and stones round the roots
    for (const [x, y, s, c] of [[460, 448, 1, '#ff9ac0'], [672, 446, 0.8, '#8ad4ff'], [690, 452, 0.6, '#ff9ac0'], [300, 456, 0.7, '#a6f0b8']]) {
      glow(x, y - 10 * s, 30 * s, 'rgba(255,200,240,.6)');
      inkRect(x - 3 * s, y - 12 * s, 6 * s, 12 * s, '#fff0e0', 1, 2); inkEllipse(x, y - 13 * s, 12 * s, 7 * s, 0, c, 1);
    }
    for (let i = 0; i < 10; i++) inkEllipse((i * 151 + 60) % W, 500 + (i * 13) % 30, 8 + (i % 3) * 2, 5, 0, '#6a7a8a', 0.8);
    grassTufts(22, 470, 540, '#5a9a6a');
    // fireflies drifting everywhere
    for (let i = 0; i < 26; i++) {
      const x = (i * 97 + Math.sin(S.t * 0.5 + i) * 40 + 30) % W, y = 120 + (i * 53) % 330 + Math.sin(S.t * 0.9 + i * 2) * 14;
      const a = 0.4 + 0.6 * Math.abs(Math.sin(S.t * 1.7 + i));
      glow(x, y, 14, 'rgba(230,255,120,.9)', a); ctx.fillStyle = `rgba(250,255,190,${a})`; circle(x, y, 2.4);
    }
  };

  // --- Owl Glide: a one-button glide through gaps between branches, collecting feathers -------------
  const OG_WING = P2('M-14,-6 C-30,-24 -58,-26 -68,-10 C-56,-8 -52,2 -42,6 C-32,10 -20,8 -14,4 Z');
  const drawFlyOwl = (x, y, s, flap, tilt, hurt) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
    if (hurt) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(S.t * 30);
    const wa = Math.sin(flap) * 0.6;
    for (const d of [-1, 1]) { ctx.save(); ctx.scale(d, 1); ctx.translate(-14, -2); ctx.rotate(-wa); ctx.translate(14, 2); ink(OG_WING, '#8a5a3a', 1.5); ctx.fillStyle = '#a8764a'; ellipse(-44, -6, 14, 5, 0.2); ctx.restore(); }
    ink(P2('M-12,-24 L-20,-42 L-4,-28 Z M12,-24 L20,-42 L4,-28 Z'), '#8a5a3a', 1.2);
    inkEllipse(0, 0, 25, 29, 0, '#a8764a', 1.8);
    ctx.fillStyle = '#f2dcb8'; ellipse(0, 10, 16, 16);
    ctx.strokeStyle = '#c89a6a'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 6 - 3, 6 + (i % 2) * 6); ctx.lineTo(-6 + i * 6, 9 + (i % 2) * 6); ctx.lineTo(-6 + i * 6 + 3, 6 + (i % 2) * 6); ctx.stroke(); }
    for (const d of [-1, 1]) { inkCircle(d * 10, -10, 11, '#f8ead0', 1); }
    for (const d of [-1, 1]) { ctx.fillStyle = '#ffc83a'; circle(d * 10, -10, 7); ctx.fillStyle = '#2a1a2a'; circle(d * 10 + 1, -10, 4); ctx.fillStyle = '#fff'; circle(d * 10 + 2.5, -12, 1.5); }
    ctx.fillStyle = '#ff9a3a'; tri(-4, -4, 4, -4, 0, 4);
    ctx.globalAlpha = 1; ctx.restore();
  };
  const branchCol = (x, y0, y1, fromTop) => {
    // a knobbly branch hanging down (fromTop) or a stump growing up, with leaves at its tip
    const w = 56, tip = fromTop ? y1 : y0;
    glow(x, tip, 70, 'rgba(255,220,150,.5)');
    inkRect(x - w / 2, y0, w, y1 - y0, '#b07a4a', 2.5, 10);
    ctx.fillStyle = 'rgba(255,230,190,.35)'; ctx.fillRect(x - w / 2 + 6, y0, 8, y1 - y0);
    ctx.save(); ctx.beginPath(); ctx.roundRect(x - w / 2, y0, w, y1 - y0, 10); ctx.clip();
    ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 3; for (const dx of [-14, 0, 14]) { ctx.beginPath(); ctx.moveTo(x + dx, y0); ctx.lineTo(x + dx + 4, y1); ctx.stroke(); }
    ctx.restore();
    for (const [dx, dy, r] of [[-26, 0, 18], [26, 4, 18], [0, fromTop ? 10 : -10, 22]]) inkCircle(x + dx, tip + dy, r, '#5fbf6a', 1.5);
    for (const [dx, dy, r] of [[-26, 0, 18], [26, 4, 18], [0, fromTop ? 10 : -10, 22]]) { ctx.fillStyle = '#5fbf6a'; circle(x + dx, tip + dy, r); ctx.fillStyle = '#86d88a'; circle(x + dx - 4, tip + dy - 5, r * 0.45); }
  };
  MG.owlglide = {
    kind: 'action', title: () => 'Owl Glide', icon: () => '🦉',
    how: () => 'Press SPACE or tap to flap! Glide through the gaps between the branches and catch the feathers.',
    init(g) {
      const gates = [8, 10, 12][g.tier - 1];
      Object.assign(g, { gates, made: 0, passed: 0, clean: 0, feathers: 0, y: 280, vy: 0, flap: 0, inv: 0, bumped: false, list: [], spawnT: 0.6, scroll: [160, 180, 200][g.tier - 1], gap: [210, 185, 165][g.tier - 1], endT: 0, x: 210 });
      g.say = 'Tap to flap! Fly through the gaps.';
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      if (jumpPressed() || pointer.clicked) { g.vy = -330; g.flap = 0; SFX.jump(); }
      g.flap += dt * (g.vy < 0 ? 18 : 6);
      g.vy = Math.min(g.vy + 880 * dt, 420); g.y += g.vy * dt;
      g.inv = Math.max(0, g.inv - dt);
      const bump = () => { if (g.inv > 0) return; g.inv = 1.1; g.bumped = true; SFX.miss(); floatText(g.x, g.y - 40, 'Bonk!', '#ffb0c4', false, 22); };
      if (g.y < 84) { g.y = 84; g.vy = Math.max(0, g.vy); }
      if (g.y > 480) { g.y = 480; g.vy = -260; bump(); }
      g.spawnT -= dt;
      if (g.spawnT <= 0 && g.made < g.gates) {
        g.made++; g.spawnT = [2.1, 1.9, 1.7][g.tier - 1];
        const c = rand(180 + g.gap * 0.15, 420 - g.gap * 0.15);
        g.list.push({ x: W + 50, c, got: false, done: false, fy: c + rand(-g.gap * 0.22, g.gap * 0.22) });
      }
      for (const b of g.list) {
        b.x -= g.scroll * dt;
        const top = b.c - g.gap / 2, bot = b.c + g.gap / 2;
        if (Math.abs(b.x - g.x) < 28 + 20 && (g.y - 20 < top || g.y + 20 > bot)) bump();
        if (!b.got && sq(b.x - g.x, b.fy - g.y) < 40) { b.got = true; g.feathers++; SFX.sparkle(); burst(b.x, b.fy, 12); }
        if (!b.done && b.x < g.x - 50) {
          b.done = true; g.passed++;
          if (!g.bumped) { g.clean++; floatText(g.x, g.y - 46, pick(['Whoosh!', 'Hoo-ray!', 'Great!']), '#fff6a8', false, 22); }
          g.bumped = false;
        }
      }
      g.list = g.list.filter(b => b.x > -80);
      g.progress = `Branches ${g.passed} of ${g.gates}   ·   🪶 ${g.feathers}`;
      g.score = 0.65 * g.clean / g.gates + 0.35 * g.feathers / g.gates;
      if (g.passed >= g.gates) { g.endT += dt; if (g.endT > 0.8) g.done = true; }
    },
    draw(g) {
      // dim the hollow a little so the branches stand out
      ctx.fillStyle = 'rgba(30,18,60,.38)'; ctx.fillRect(0, 0, W, H);
      for (const b of g.list) {
        const top = b.c - g.gap / 2, bot = b.c + g.gap / 2;
        branchCol(b.x, 52, top, true);
        branchCol(b.x, bot, 560, false);
        if (!b.got) { glowEmoji('🪶', b.x, b.fy + Math.sin(S.t * 3 + b.x * 0.01) * 5, 32, 'rgba(255,250,200,.8)'); }
      }
      drawFlyOwl(g.x, g.y, 1, g.flap, clamp(g.vy / 1400, -0.3, 0.35), g.inv > 0);
    },
  };

  // --- Night or Day?: sort the animals into the night basket or the day basket ---------------------
  const ND_ANIMALS = [
    ['owl', '🦉', 1, 'Owls hunt by moonlight.'], ['bat', '🦇', 1, 'Bats fly out when it gets dark.'],
    ['raccoon', '🦝', 1, 'Raccoons sneak about at night.'], ['hedgehog', '🦔', 1, 'Hedgehogs snuffle for bugs at night.'],
    ['badger', '🦡', 1, 'Badgers dig and sniff at night.'], ['firefly', 'firefly', 1, 'Fireflies glow in the dark.'],
    ['moth', 'moth', 1, 'Moths flutter round the moonlight.'],
    ['butterfly', '🦋', 0, 'Butterflies love the warm sunshine.'], ['bee', '🐝', 0, 'Bees visit flowers in the day.'],
    ['squirrel', '🐿️', 0, 'Squirrels gather nuts in the day.'], ['robin', '🐦', 0, 'Robins sing in the morning.'],
    ['rooster', '🐓', 0, 'Roosters crow when the sun comes up.'], ['ladybird', '🐞', 0, 'Ladybirds warm up in the sun.'],
    ['duck', '🦆', 0, 'Ducks paddle about in the day.'], ['sheep', '🐑', 0, 'Sheep munch grass all day long.'],
  ];
  const ndDraw = (a, x, y, size) => {
    if (a[1] === 'firefly') drawFirefly(x, y, size / 28);
    else if (a[1] === 'moth') drawMoth(x, y, size / 44, S.t * 8 + x);
    else emoji(a[1], x, y, size);
  };
  const ND_BASKET = i => ({ x: i ? 520 : 120, y: 318, w: 320, h: 200 });
  MG.owlnightday = quiz({
    title: () => 'Night or Day?', icon: () => '🌙', unit: 'Animal', noKeys: false, yay: 2.2, show: 3.4,
    how: () => 'Is the animal awake at night, like Granny Owl, or awake in the day? Tap the moon basket or the sun basket.',
    rounds: g => [8, 10, 12][g.tier - 1],
    setup(g) {
      const night = shuffle(ND_ANIMALS.filter(a => a[2])), day = shuffle(ND_ANIMALS.filter(a => !a[2]));
      const n = g.rounds, deck = [];
      for (let i = 0; i < n; i++) deck.push(i % 2 ? night[(i >> 1) % night.length] : day[(i >> 1) % day.length]);
      g.deck = shuffle(deck); g.sorted = [[], []];
    },
    make(g) {
      const a = g.deck[g.round];
      return { a, choices: ['night', 'day'], answer: a[2] ? 0 : 1, oneTry: true, credit: [1, 0], say: `Is the ${a[0]} awake at night, or in the day?` };
    },
    keyPick: g => (pressed.arrowleft ? 0 : pressed.arrowright ? 1 : -1),
    rect: (g, i) => ND_BASKET(i),
    color: (g, i) => (i ? '#ffa94a' : '#6a5ae0'),
    after(g) { g.sorted[g.answer].push(g.a); },
    drawQ(g) {
      // the animal on a card; it flies into its basket once answered
      const k = g.state === 'pick' ? 0 : clamp((g.fly - 0.35) / 0.6, 0, 1), e = k * k * (3 - 2 * k);
      const r = ND_BASKET(g.answer), tx = r.x + r.w / 2, ty = r.y + 110;
      if (g.state === 'pick' || k < 1) {
        const cx = lerp(W / 2, tx, e), cy = lerp(186, ty, e) - Math.sin(e * PI) * 60;
        if (k === 0) {
          panel(W / 2 - 160, 70, 320, 228, 26);
          outlined(g.a[0][0].toUpperCase() + g.a[0].slice(1), W / 2, 268, 30, '#ff6fb5', 'center', '#fff');
        }
        ndDraw(g.a, cx, cy + Math.sin(S.t * 3) * 4, lerp(110, 54, e));
      }
      if (g.state !== 'pick') {
        rrect(W / 2 - 300, 70, 600, 52, 24, 'rgba(48,24,72,.82)');
        text((g.state === 'yay' ? 'Yes! ' : 'Oh! ') + g.a[3], W / 2, 96, 21, '#fff6a8', 'center', 700);
      }
    },
    drawChoice(g, c, x, y, w, h, i) {
      // a woven basket under a moon or a sun, with the animals sorted so far
      const night = i === 0;
      ctx.fillStyle = night ? 'rgba(30,20,70,.55)' : 'rgba(255,240,180,.45)'; ctx.beginPath(); ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 12); ctx.fill();
      if (night) { for (let s = 0; s < 6; s++) star(x + 30 + (s * 53) % (w - 60), y + 26 + (s * 29) % 40, 3, '#fff6c8'); }
      emoji(night ? '🌙' : '☀️', x + 46, y + 44, 44);
      outlined(night ? 'Night' : 'Day', x + 82, y + 44, 28, '#fff', 'left', 'rgba(40,20,60,.7)');
      text(night ? 'awake at night' : 'awake in the day', x + 84, y + 72, 15, '#fff', 'left', 600);
      const bx = x + 40, bw = w - 80, by = y + 112;
      const list = g.sorted[i];
      list.forEach((a, j) => ndDraw(a, bx + 26 + (j % 6) * ((bw - 52) / 5), by - 4 + Math.floor(j / 6) * -24, 34));
      inkRect(bx, by, bw, 66, '#d8a050', 2, 12);
      ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, 66, 12); ctx.clip();
      ctx.strokeStyle = 'rgba(120,70,30,.5)'; ctx.lineWidth = 3;
      for (let yy = by + 12; yy < by + 66; yy += 14) { ctx.beginPath(); ctx.moveTo(bx, yy); ctx.lineTo(bx + bw, yy); ctx.stroke(); }
      for (let xx = bx + 10; xx < bx + bw; xx += 18) { ctx.beginPath(); ctx.moveTo(xx, by); ctx.lineTo(xx, by + 66); ctx.stroke(); }
      ctx.restore();
      text(night ? '1  or  ←' : '2  or  →', x + w / 2, by + 78, 13, 'rgba(255,255,255,.85)', 'center', 700);
    },
    right: g => `${praise()} ${g.a[3]}`,
    wrong: g => `Oh! The ${g.a[0]} is awake ${g.a[2] ? 'at night' : 'in the day'}. ${g.a[3]}`,
  });

  restage('owlhollow', {
    bg: 'owlhollow_bg',
    games: [['owlglide', 'feather', {}], ['owlnightday', 'feather', {}]],
    intro: ['*:The sky turns purple and orange. Fireflies blink on, one by one.', 'N:Hoo, hoo! A young visitor! My old wings are stiff tonight. Will you glide through the branches and gather my feathers?', 'A:excited:I get to fly like an owl!'],
    mid: ['N:Hoo! Splendid flying. Now tell me, little one: who is awake at night like me, and who is awake in the day?', 'A:thinking:Hmm, bats come out at night...'],
    outro: ['N:Take these feathers. Wisdom and softness, all in one.', 'A:happy:Goodnight, Granny Owl!'],
  });

  // =========================================================================
  // 3. FAIRY RING — Pixie Dot
  // =========================================================================
  const shroomHouse = (x, gy, s, cap = '#ff5f7e', lit = true) => {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    const stem = P2('M-34,0 C-38,-40 -32,-80 -26,-100 L26,-100 C32,-80 38,-40 34,0 Z');
    const capP = P2('M-80,-96 C-82,-150 -40,-186 0,-188 C40,-186 82,-150 80,-96 C50,-86 -50,-86 -80,-96 Z');
    inkGroup([[stem, '#fff2dc'], [capP, cap]], 1.6);
    ctx.save(); ctx.clip(capP); ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(-24, -160, 40, 16, -0.3); ctx.restore();
    ctx.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[-46, -128, 10], [-10, -160, 12], [30, -136, 11], [56, -112, 7], [-22, -112, 7], [8, -178, 6]]) circle(dx, dy, r);
    ink(P2('M-12,0 L-12,-30 C-12,-44 12,-44 12,-30 L12,0 Z'), '#c06ae0', 1.2); inkCircle(7, -18, 2, '#ffd84a', 0.8);
    for (const [dx, dy] of [[-22, -66], [18, -70]]) {
      if (lit) glow(dx, dy, 24, 'rgba(255,230,140,.85)', 0.8 + 0.2 * Math.sin(S.t * 2 + dx));
      inkCircle(dx, dy, 8, lit ? '#ffe9a0' : '#8ad0ff', 1); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(dx - 8, dy); ctx.lineTo(dx + 8, dy); ctx.stroke();
    }
    ctx.restore();
  };
  const glowShroom = (x, y, s, c) => {
    glow(x, y - 10 * s, 34 * s, c.replace('rgb', 'rgba').replace(')', ',.6)'), 0.6 + 0.3 * Math.sin(S.t * 2 + x * 0.05));
    inkRect(x - 4 * s, y - 14 * s, 8 * s, 14 * s, '#f8f0ff', 1, 3);
    inkEllipse(x, y - 15 * s, 15 * s, 9 * s, 0, c, 1);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(x - 5 * s, y - 18 * s, 2.2 * s); circle(x + 5 * s, y - 15 * s, 1.6 * s);
  };
  const bellFlower = (x, y, s, c) => {
    ctx.strokeStyle = '#4e9a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 4, y - 30 * s, x + 14 * s, y - 40 * s); ctx.stroke();
    glow(x + 14 * s, y - 32 * s, 20 * s, 'rgba(200,240,255,.8)', 0.6 + 0.4 * Math.sin(S.t * 2.4 + x));
    inkAt(x + 14 * s, y - 38 * s, 0.3, P2(`M${-7 * s},0 C${-8 * s},${8 * s} ${-4 * s},${12 * s} 0,${12 * s} C${4 * s},${12 * s} ${8 * s},${8 * s} ${7 * s},0 Z`), c, 1);
  };
  const FR = { x: 480, y: 404, rx: 250, ry: 40 };
  BACKDROPS.fairyring_bg = () => {
    sky3('#241f6a', '#6a42ae', '#e89ad8', 0.55, 400);
    twinkles(40, 62, 260);
    // soft aurora ribbons
    ['#7fffd0', '#ff9ae0', '#9ad0ff'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.globalAlpha = 0.18; ctx.lineWidth = 26;
      ctx.beginPath(); ctx.moveTo(-20, 130 + i * 24); ctx.bezierCurveTo(300, 70 + i * 26 + Math.sin(S.t * 0.6 + i) * 18, 640, 190 + i * 20, W + 20, 110 + i * 22); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    bdHills('#5a3e98', 312, 24, 0.007, 1);
    for (const [x, h, t] of [[30, 240, 1], [180, 200, 0], [330, 180, 2], [640, 190, 0], [790, 210, 1], [930, 250, 2]]) drawTree(x, 372, h, 60, t, 0.55);
    bdHills('#46407e', 366, 12, 0.012, 3);
    const gg = ctx.createLinearGradient(0, 370, 0, H); gg.addColorStop(0, '#3e7a6e'); gg.addColorStop(1, '#2e5e58');
    ctx.fillStyle = gg; ctx.fillRect(0, 372, W, H - 372);
    // mushroom houses: two near, two far away
    shroomHouse(300, 374, 0.42, '#8a6ae8'); shroomHouse(680, 372, 0.48, '#ff8ad0');
    shroomHouse(110, 446, 0.92, '#ff5f7e'); shroomHouse(860, 446, 0.86, '#5fb8ff');
    // tiny steps and a lantern on the near houses
    lantern(176, 362, 0.8, '#ffd860', 0); lantern(790, 366, 0.8, '#a6f0b8', 0);
    // the glowing fairy ring: back mushrooms, a pool of light, front mushrooms
    ctx.save(); ctx.scale(1, FR.ry / FR.rx);
    const iy = FR.y * FR.rx / FR.ry, inner = ctx.createRadialGradient(FR.x, iy, 10, FR.x, iy, FR.rx + 30);
    inner.addColorStop(0, 'rgba(230,255,240,.75)'); inner.addColorStop(0.7, 'rgba(170,255,210,.35)'); inner.addColorStop(1, 'rgba(160,255,200,0)');
    ctx.fillStyle = inner; circle(FR.x, iy, FR.rx + 30); ctx.restore();
    const cols = ['rgb(255,138,208)', 'rgb(138,212,255)', 'rgb(198,162,255)', 'rgb(166,240,184)', 'rgb(255,216,96)'];
    const ring = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + 0.1; ring.push([FR.x + Math.cos(a) * FR.rx, FR.y + Math.sin(a) * FR.ry, cols[i % 5], 1.3 + (i % 3) * 0.2]); }
    ring.filter(m => m[1] < FR.y).forEach(m => glowShroom(m[0], m[1], m[3] * 0.85, m[2]));
    for (let i = 0; i < 14; i++) {
      const k = (S.t * 0.25 + i / 14) % 1, x = FR.x + Math.sin(i * 2.3) * FR.rx * 0.8;
      star(x + Math.sin(S.t + i) * 8, FR.y - k * 200, 3 + (i % 3), `rgba(255,250,200,${(1 - k) * 0.9})`);
    }
    ring.filter(m => m[1] >= FR.y).forEach(m => glowShroom(m[0], m[1], m[3], m[2]));
    // glowing bell flowers and toadstools along the edges
    for (const [x, y, s, c] of [[20, 470, 1, '#9ad0ff'], [210, 462, 0.9, '#ff9ae0'], [330, 474, 0.8, '#c6a2ff'], [620, 470, 0.9, '#9ad0ff'], [800, 476, 1, '#ff9ae0'], [940, 466, 0.9, '#c6a2ff']]) bellFlower(x, y, s, c);
    for (let i = 0; i < 12; i++) { const x = (i * 83 + 20) % W, y = 490 + (i * 19) % 40; glow(x, y, 8, 'rgba(180,255,220,.9)', 0.4 + 0.4 * Math.sin(S.t * 2 + i)); }
    grassTufts(24, 472, 540, '#5aa88a');
    // little fairies flitting round the ring
    for (let i = 0; i < 4; i++) {
      const a = S.t * (0.5 + i * 0.12) + i * 1.6, fx = FR.x + Math.cos(a) * (FR.rx + 30), fy = 300 + Math.sin(a * 1.7) * 60 - i * 12;
      glow(fx, fy, 22, 'rgba(255,240,180,.9)');
      ctx.fillStyle = 'rgba(230,250,255,.85)'; ellipse(fx - 5, fy - 3, 6, 3.5, -0.6 + Math.sin(S.t * 30 + i) * 0.4); ellipse(fx + 5, fy - 3, 6, 3.5, 0.6);
      ctx.fillStyle = '#fff6c8'; circle(fx, fy, 3.5);
    }
  };

  // --- Wand Spells: trace the glowing shape with the wand before it fades -----------------------------
  const SPELL_SHAPES = {
    circle: () => Array.from({ length: 49 }, (_, i) => [Math.cos(-PI / 2 + i / 48 * TAU) * 0.9, Math.sin(-PI / 2 + i / 48 * TAU) * 0.9]),
    triangle: () => [[0, -0.95], [0.95, 0.75], [-0.95, 0.75], [0, -0.95]],
    square: () => [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8], [-0.8, -0.8]],
    heart: () => Array.from({ length: 61 }, (_, i) => { const t = i / 60 * TAU; return [16 * Math.sin(t) ** 3 / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.1]; }),
    wave: () => Array.from({ length: 41 }, (_, i) => { const x = -1 + i / 20; return [x, -Math.sin(x * PI * 1.5) * 0.45]; }),
    star: () => Array.from({ length: 6 }, (_, i) => { const a = -PI / 2 + i * 4 * PI / 5; return [Math.cos(a) * 0.95, Math.sin(a) * 0.95 + 0.08]; }),
    zigzag: () => [[-0.95, -0.6], [-0.5, 0.6], [0, -0.6], [0.5, 0.6], [0.95, -0.6]],
    spiral: () => Array.from({ length: 70 }, (_, i) => { const t = i / 69, a = t * 3.6 * PI; return [Math.cos(a) * (0.12 + 0.85 * t), Math.sin(a) * (0.12 + 0.85 * t)]; }),
    moon: () => [...Array.from({ length: 25 }, (_, i) => { const a = -PI / 2 - i / 24 * PI; return [Math.cos(a) * 0.9 + 0.1, Math.sin(a) * 0.9]; }),
      ...Array.from({ length: 25 }, (_, i) => { const a = PI / 2 - i / 24 * PI; return [Math.cos(a) * 0.62 - 0.12, Math.sin(a) * 0.9]; })],
  };
  const SPELL_NAMES = { circle: 'a circle', triangle: 'a triangle', square: 'a square', heart: 'a heart', wave: 'a wave', star: 'a star', zigzag: 'a zigzag', spiral: 'a spiral', moon: 'a moon' };
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
  MG.fairywand = {
    kind: 'action', title: () => 'Wand Spells', icon: () => '🪄',
    how: () => 'A magic shape glows in the air. Hold down and trace it with your wand, starting at the big star, before it fades! You can use the arrow keys too.',
    init(g) {
      const sets = [['circle', 'triangle', 'heart', 'wave', 'square'], ['circle', 'heart', 'star', 'zigzag', 'triangle', 'wave', 'square'], ['star', 'zigzag', 'spiral', 'moon', 'heart', 'triangle']];
      Object.assign(g, { rounds: 5, round: 0, total: 0, list: shuffle(sets[g.tier - 1]).slice(0, 5), tol: [42, 36, 30][g.tier - 1], wx: 0, wy: 0, trail: [], state: 'trace', t2: 0 });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const name = g.list[g.round], R = 165, cx = W / 2, cy = 310;
      g.shape = name; g.pts = resample(SPELL_SHAPES[name]().map(([x, y]) => [cx + x * R, cy + y * R]), 9);
      g.prog = 0; g.timeMax = [13, 11, 9][g.tier - 1] + (name === 'spiral' ? 2 : 0); g.time = g.timeMax; g.state = 'trace';
      g.wx = g.pts[0][0]; g.wy = g.pts[0][1] + 60;
      g.say = `Trace ${SPELL_NAMES[name]}! Start at the big star.`;
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt) {
      if (g.state === 'trace') {
        g.time -= dt;
        let tracing = false;
        const kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        if (kx || ky) { g.wx = clamp(g.wx + kx * 280 * dt, 0, W); g.wy = clamp(g.wy + ky * 280 * dt, 60, H); tracing = true; }
        else if (pointer.down) { g.wx = pointer.x; g.wy = pointer.y; tracing = true; }
        else if (pointerMoved(g)) { g.wx = pointer.x; g.wy = pointer.y; }
        if (tracing) {
          let best = g.prog;
          for (let j = g.prog + 1; j < Math.min(g.pts.length, g.prog + 12); j++) if (sq(g.pts[j][0] - g.wx, g.pts[j][1] - g.wy) < g.tol) best = j;
          if (best > g.prog) { if (Math.floor(best / 8) > Math.floor(g.prog / 8)) tone(700 + best * 6, 0.06, 'sine', 0.05); g.prog = best; }
          g.trail.push({ x: g.wx, y: g.wy, life: 0.5 });
        }
        if (g.prog >= g.pts.length - 3) {
          g.total += 1; g.state = 'cast'; g.t2 = 1.5; SFX.sparkle(); burst(W / 2, 310, 40);
          speak(pick(['Sparkle spell!', 'Magic!', 'Wonderful wand work!']));
        } else if (g.time <= 0) {
          g.total += 0.8 * g.prog / g.pts.length; g.state = 'fizzle'; g.t2 = 1.5; SFX.miss();
          speak('Oh, it faded away! Next spell.');
        }
      } else if ((g.t2 -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      for (const p of g.trail) p.life -= dt;
      g.trail = g.trail.filter(p => p.life > 0);
      g.progress = `Spell ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      const fade = g.state === 'trace' ? 0.3 + 0.7 * clamp(g.time / g.timeMax, 0, 1) : g.state === 'cast' ? 1 : 0.25;
      const path = () => { ctx.beginPath(); g.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // the faint glowing path, then the part already traced in gold
      ctx.save();
      ctx.globalAlpha = fade; ctx.shadowColor = '#ff9ae0'; ctx.shadowBlur = 24;
      path(); ctx.strokeStyle = 'rgba(255,200,250,.55)'; ctx.lineWidth = g.tol * 1.3; ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5; ctx.setLineDash([2, 14]); ctx.lineDashOffset = -S.t * 30; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      if (g.prog > 0 || g.state === 'cast') {
        ctx.save(); ctx.shadowColor = '#fff6a8'; ctx.shadowBlur = 20;
        ctx.beginPath(); const end = g.state === 'cast' ? g.pts.length : g.prog + 1; g.pts.slice(0, end).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 12; ctx.stroke(); ctx.strokeStyle = '#fffbe0'; ctx.lineWidth = 5; ctx.stroke();
        ctx.restore();
      }
      if (g.state === 'trace') {
        // the start star, and an arrow showing which way to go next
        const [sx, sy] = g.pts[0];
        if (g.prog === 0) { glow(sx, sy, 50, 'rgba(255,250,180,.9)'); star(sx, sy, 22 + Math.sin(S.t * 6) * 3, '#ffe36b', 5); text('Start', sx, sy - 36, 16, '#fff', 'center', 800); }
        const n = g.pts[Math.min(g.pts.length - 1, g.prog + 6)], c = g.pts[g.prog];
        const a = Math.atan2(n[1] - c[1], n[0] - c[0]);
        ctx.save(); ctx.translate(c[0] + Math.cos(a) * 30, c[1] + Math.sin(a) * 30); ctx.rotate(a);
        ctx.fillStyle = 'rgba(255,255,255,.9)'; tri(12, 0, -6, -9, -6, 9); ctx.restore();
        // how much magic is left before it fades
        rrect(W / 2 - 150, 508, 300, 16, 8, 'rgba(48,24,72,.6)');
        rrect(W / 2 - 150, 508, Math.max(16, 300 * g.time / g.timeMax), 16, 8, g.time < 3 ? '#ff8ab0' : '#ffd860');
        emoji('✨', W / 2 - 170, 516, 20);
      }
      if (g.state === 'cast') outlined('✨ Spell cast! ✨', W / 2, 110, 34, '#fff6a8');
      if (g.state === 'fizzle') outlined('It faded...', W / 2, 110, 30, '#ffd0e0');
      for (const p of g.trail) star(p.x + rand(-4, 4), p.y + rand(-4, 4), 3 + p.life * 6, `rgba(255,250,200,${p.life * 1.6})`);
      // the wand
      ctx.save(); ctx.translate(g.wx, g.wy); ctx.rotate(-0.6);
      inkRect(-4, 6, 8, 60, '#c06ae0', 1.5, 3); inkRect(-4, 52, 8, 14, '#ffd84a', 1.2, 3);
      ctx.restore();
      glow(g.wx, g.wy, 26, 'rgba(255,250,200,.9)'); star(g.wx, g.wy, 13, '#ffe36b', 5);
      drawCritter('Pixie Dot', 880, GY + 30, 0.55, -1);
    },
  };

  // --- Fairy Fractions: pick the cake shared fairly into halves, thirds or quarters ---------------
  const FR_PL = { 2: 'halves', 3: 'thirds', 4: 'quarters' }, FR_ONE = { 2: 'one half', 3: 'one third', 4: 'one quarter' };
  const UNEVEN = { 2: [0.68, 0.32], 3: [0.52, 0.3, 0.18], 4: [0.42, 0.28, 0.18, 0.12] };
  const even = n => Array(n).fill(1 / n);
  const drawCake = (c, cx, cy, size) => {
    const pink = '#ff7ab8', cream = '#ffe9b8';
    if (c.shape === 'pie') {
      const r = size;
      ctx.fillStyle = 'rgba(60,30,80,.2)'; ellipse(cx, cy + r * 0.12, r + 14, r * 0.95 + 14);
      inkCircle(cx, cy, r + 10, '#ffffff', 1.5);
      inkCircle(cx, cy, r, '#d89a58', 2);
      let a = -PI / 2;
      c.w.forEach((wt, i) => {
        const b = a + wt * TAU;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r - 7, a, b); ctx.closePath();
        ctx.fillStyle = c.shade.includes(i) ? pink : cream; ctx.fill();
        if (c.shade.includes(i)) { const m = (a + b) / 2; ctx.fillStyle = '#ff3f7a'; circle(cx + Math.cos(m) * r * 0.55, cy + Math.sin(m) * r * 0.55, 6); ctx.fillStyle = '#5fc86a'; ellipse(cx + Math.cos(m) * r * 0.55, cy + Math.sin(m) * r * 0.55 - 6, 3, 1.6); }
        a = b;
      });
      ctx.strokeStyle = OL; ctx.lineWidth = 3.5; a = -PI / 2;
      if (c.w.length > 1) c.w.forEach(wt => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); a += wt * TAU; });
      ctx.strokeStyle = 'rgba(160,90,40,.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    } else {
      const w = size * 2.2, h = size * 1.4, x = cx - w / 2, y = cy - h / 2;
      ctx.fillStyle = 'rgba(60,30,80,.2)'; rrect(x - 6, y + 8, w + 12, h + 8, 10, 'rgba(60,30,80,.2)');
      inkRect(x, y, w, h, '#f0c27a', 2.5, 8);
      let px = x;
      c.w.forEach((wt, i) => {
        const pw = wt * w;
        ctx.fillStyle = c.shade.includes(i) ? pink : cream; ctx.fillRect(px + 2, y + 2, pw - 2, h * 0.42);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(px + 2, y + h * 0.56, pw - 2, 6);
        if (c.shade.includes(i)) { ctx.fillStyle = '#ff3f7a'; circle(px + pw / 2, y + h * 0.22, 6); }
        px += pw;
      });
      ctx.strokeStyle = OL; ctx.lineWidth = 3.5; px = x;
      c.w.slice(0, -1).forEach(wt => { px += wt * w; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); });
    }
  };
  MG.fairyfractions = quiz({
    title: () => 'Fairy Fractions', icon: () => '🥧', unit: 'Cake',
    how: () => 'Fairies always share fairly, so every piece is the same size! Listen, then tap the right cake.',
    rounds: g => [5, 6, 7][g.tier - 1],
    make(g) {
      const ns = g.tier === 1 ? [2, 4] : [2, 3, 4], n = pick(ns), count = g.tier === 1 ? 3 : 4;
      const type = g.tier === 1 ? 'fair' : g.tier === 2 ? (g.round % 2 ? 'part' : 'fair') : (g.round % 3 === 0 ? 'fair' : 'part');
      const shape = pick(['pie', 'pie', 'bar']), others = [2, 3, 4].filter(m => m !== n);
      let right, pool;
      if (type === 'fair') {
        right = { w: even(n), shade: [] };
        pool = [{ w: UNEVEN[n], shade: [] }, ...others.map(m => ({ w: even(m), shade: [] })), { w: UNEVEN[pick(others)], shade: [] }];
      } else {
        right = { w: even(n), shade: [0] };
        pool = [{ w: UNEVEN[n], shade: [0] }, ...others.map(m => ({ w: even(m), shade: [0] }))];
        if (n > 2) pool.push({ w: even(n), shade: Array.from({ length: n - 1 }, (_, i) => i) });
        else pool.push({ w: even(3), shade: [0, 1] });
      }
      pool = [pool[0], ...shuffle(pool.slice(1))].slice(0, count - 1);
      const all = [right, ...pool].map(c => ({ ...c, shape })), choices = shuffle(all);
      right = all[0];
      const say = type === 'fair' ? `Share the cake fairly! Which cake is cut into ${FR_PL[n]}, ${NUM_WORDS[n]} equal pieces?`
        : `Which cake shows ${FR_ONE[n]}? One pink piece, out of ${NUM_WORDS[n]} equal pieces.`;
      return { n, type, choices, answer: choices.indexOf(right), say };
    },
    rect: (g, i) => rowRect(g.choices.length, i, 236, g.choices.length === 3 ? 240 : 196, 236),
    drawQ(g) {
      if (g.type === 'fair') qPanel(`Which cake is cut into ${FR_PL[g.n]}?`, `${g.n} equal pieces, so everyone gets the same!`);
      else qPanel(`Which cake shows ${FR_ONE[g.n]}?`, `1 pink piece out of ${g.n} equal pieces`);
      emoji('🧚', W / 2 - 360 + Math.sin(S.t * 2) * 4, 116, 36);
      for (let i = 0; i < g.n; i++) emoji('🧚', W / 2 + 330 - i * 22, 198 + Math.sin(S.t * 3 + i) * 4, 22);
    },
    drawChoice(g, c, x, y, w, h, i, { wrong }) {
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 14); ctx.fill();
      drawCake(c, x + w / 2, y + h / 2 + 4, Math.min(w, h) * 0.34);
      if (wrong) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 10, y + 10, w - 20, h - 20); }
    },
    right: g => (g.type === 'fair' ? `${praise()} ${NUM_WORDS[g.n][0].toUpperCase() + NUM_WORDS[g.n].slice(1)} equal pieces. That's ${FR_PL[g.n]}!` : `${praise()} That's ${FR_ONE[g.n]}!`),
    wrong: (g, i) => {
      const c = g.choices[i], fair = c.w.every(v => Math.abs(v - c.w[0]) < 0.01);
      if (!fair) return 'Oh no, those pieces are not the same size. That is not fair!';
      return `That cake has ${NUM_WORDS[c.w.length]} pieces. Count again!`;
    },
  });

  restage('fairyring', {
    bg: 'fairyring_bg',
    games: [['fairywand', 'crystal', {}], ['fairyfractions', 'petal', {}]],
    intro: ['*:A circle of mushrooms glows in the grass. Tiny music is playing.', 'N:A visitor! Quick, take my spare wand. Trace the glowing shapes before they fade, and the spell will work!', 'A:excited:I can do real magic?!'],
    mid: ["N:Sparkly spells! Now it's fairy tea time. Help me pick the cakes that are shared fairly, so every fairy gets the same."],
    outro: ['N:Fairy crystals and petals for you. Good luck at the show!', 'A:surprised:You know about the show?!'],
  });

  // =========================================================================
  // 4. MOTH MEADOW AT DUSK — Luna Moth
  // =========================================================================
  const moonFlower = (x, y, s, c, core) => {
    ctx.strokeStyle = '#3e7a5e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 30 * s); ctx.lineTo(x, y); ctx.stroke();
    glow(x, y, 28 * s, c === '#ffffff' ? 'rgba(255,255,230,.8)' : 'rgba(160,230,255,.8)', 0.55 + 0.35 * Math.sin(S.t * 1.8 + x));
    flower(x, y, 10 * s, c, core, 1);
  };
  BACKDROPS.mothmeadow_bg = () => {
    sky3('#1c2466', '#6a58b0', '#ffb08a', 0.6, 360);
    twinkles(46, 62, 240);
    // the big rising moon behind the hills
    glow(640, 300, 230, 'rgba(255,240,200,.45)');
    inkCircle(640, 300, 120, '#fff4cc', 1.5, 'rgba(255,230,180,.6)');
    ctx.fillStyle = 'rgba(230,210,170,.55)'; for (const [dx, dy, r] of [[-40, -50, 20], [30, -20, 14], [-10, 30, 24], [50, 40, 12], [-60, 10, 10]]) circle(640 + dx, 300 + dy, r);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(600, 240, 30, 12, -0.5);
    bdHills('#4a4488', 330, 22, 0.006, 0.4);
    // far tree silhouettes
    for (const [x, h] of [[90, 120], [190, 90], [880, 130], [800, 80]]) { ctx.fillStyle = '#3a3672'; circle(x, 340 - h, h * 0.4); ctx.fillRect(x - 5, 340 - h, 10, h); }
    bdHills('#3e5a6e', 382, 14, 0.011, 2);
    const gg = ctx.createLinearGradient(0, 380, 0, H); gg.addColorStop(0, '#3e6a62'); gg.addColorStop(1, '#2c4e50');
    ctx.fillStyle = gg; ctx.fillRect(0, 386, W, H - 386);
    // tall swaying meadow grass silhouettes
    ctx.lineCap = 'round';
    for (let i = 0; i < 80; i++) {
      const x = (i * 12.3) % W, base = 446 + (i % 4) * 3, top = base - 40 - (i * 17) % 34, sw = Math.sin(S.t * 1.2 + x * 0.02) * 6;
      ctx.strokeStyle = i % 2 ? '#4e8a76' : '#3e7466'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + sw * 0.4, (base + top) / 2, x + sw, top); ctx.stroke();
    }
    // glowing moonflowers and bluebells
    for (const [x, y, s, c, k] of [[40, 412, 1, '#ffffff', '#ffe36b'], [150, 404, 0.8, '#bfe8ff', '#ffffff'], [330, 414, 1.1, '#ffffff', '#ffe36b'], [420, 400, 0.7, '#bfe8ff', '#ffffff'], [560, 410, 0.9, '#ffffff', '#ffe36b'], [660, 404, 0.75, '#bfe8ff', '#ffffff'], [810, 412, 1, '#ffffff', '#ffe36b'], [930, 404, 0.8, '#bfe8ff', '#ffffff']]) moonFlower(x, y, s, c, k);
    // lantern posts with moths fluttering round them
    for (const [x, c] of [[110, '#ffd860'], [480, '#ff9ac0'], [880, '#a6f0b8']]) {
      inkRect(x - 4, 300, 8, 150, '#5a4a6a', 1.5, 2); inkRect(x - 22, 296, 44, 7, '#5a4a6a', 1.5, 2);
      lantern(x + 16, 303, 0.9, c, 0);
      for (let m = 0; m < 2; m++) {
        const a = S.t * (1.2 + m * 0.3) + m * 3 + x;
        drawMoth(x + 16 + Math.cos(a) * 40, 318 + Math.sin(a * 1.3) * 26, 0.38, S.t * 14 + m, m ? '#ffe0f0' : '#d8f0e0');
      }
    }
    // the near meadow path
    ctx.fillStyle = '#4a7a6c'; ctx.beginPath(); ctx.moveTo(0, 490); ctx.quadraticCurveTo(480, 470, W, 494); ctx.lineTo(W, 522); ctx.quadraticCurveTo(480, 502, 0, 524); ctx.fill();
    grassTufts(24, 452, 540, '#5a9a80');
    for (let i = 0; i < 8; i++) { const x = 60 + i * 120; ctx.fillStyle = 'rgba(200,240,255,.8)'; circle(x, 470 + (i % 3) * 18, 2.5); }
    // big moths crossing the moon and fireflies
    drawMoth(560 + Math.sin(S.t * 0.4) * 120, 220 + Math.sin(S.t * 1.1) * 20, 0.8, S.t * 10, '#c8f0d8', '#ff9ac0');
    drawMoth(260 + Math.sin(S.t * 0.5 + 2) * 90, 170 + Math.sin(S.t * 1.4) * 16, 0.55, S.t * 12 + 1, '#ffe0f0', '#8a7ae0');
    for (let i = 0; i < 18; i++) {
      const x = (i * 131 + Math.sin(S.t * 0.4 + i) * 30) % W, y = 200 + (i * 47) % 260 + Math.sin(S.t + i) * 10, a = 0.3 + 0.7 * Math.abs(Math.sin(S.t * 1.6 + i));
      glow(x, y, 12, 'rgba(230,255,140,.9)', a); ctx.fillStyle = `rgba(250,255,190,${a})`; circle(x, y, 2.2);
    }
  };

  // --- Glow Worm: steer the glowing caterpillar to the light orbs; don't bite your own tail ---------
  const GW = { cell: 40, cols: 22, rows: 11, x0: 40, y0: 82 };
  const gwX = c => GW.x0 + c * GW.cell + GW.cell / 2, gwY = r => GW.y0 + r * GW.cell + GW.cell / 2;
  const DIRS = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1] };
  MG.glowworm = {
    kind: 'action', title: () => 'Glow Worm', icon: () => '🐛',
    how: () => 'Steer the glow worm with the arrow keys, or hold your finger where you want him to go. Eat the light orbs to grow, but don\'t bite your own tail!',
    init(g) {
      Object.assign(g, { body: [[6, 5], [5, 5], [4, 5]], prev: null, dir: 'r', want: 'r', stepT: 0, step: [0.26, 0.21, 0.17][g.tier - 1], target: [8, 10, 12][g.tier - 1], eaten: 0, bites: 0, orbs: [], grow: 0, timeLeft: 70, endT: 0 });
      this.spawn(g); this.spawn(g);
      g.say = 'Eat the light orbs! Don\'t bite your tail.';
    },
    start(g) { speak(g.say); },
    spawn(g) {
      for (let t = 0; t < 200; t++) {
        const c = randInt(1, GW.cols - 2), r = randInt(1, GW.rows - 2);
        if (g.body.some(([a, b]) => a === c && b === r) || g.orbs.some(o => o.c === c && o.r === r)) continue;
        if (Math.abs(c - g.body[0][0]) + Math.abs(r - g.body[0][1]) < 3) continue;
        g.orbs.push({ c, r, hue: pick(['#ffe36b', '#9ad0ff', '#ff9ae0', '#a6f0b8']), t: 0 }); return;
      }
    },
    update(g, dt) {
      g.timeLeft -= dt;
      const rev = { r: 'l', l: 'r', u: 'd', d: 'u' };
      const ask = d => { if (d !== rev[g.dir]) g.want = d; };
      if (pressed.arrowleft || pressed.a) ask('l');
      if (pressed.arrowright || pressed.d) ask('r');
      if (pressed.arrowup || pressed.w) ask('u');
      if (pressed.arrowdown || pressed.s) ask('d');
      if (pointer.down || pointer.clicked) {
        const [hc, hr] = g.body[0], dx = pointer.x - gwX(hc), dy = pointer.y - gwY(hr);
        if (Math.abs(dx) > 24 || Math.abs(dy) > 24) {
          const horiz = dx > 0 ? 'r' : 'l', vert = dy > 0 ? 'd' : 'u';
          const first = Math.abs(dx) > Math.abs(dy) ? horiz : vert, second = first === horiz ? vert : horiz;
          if (first !== rev[g.dir]) g.want = first; else if (Math.abs(first === horiz ? dy : dx) > 24) g.want = second;
        }
      }
      for (const o of g.orbs) o.t += dt;
      g.stepT += dt;
      if (g.stepT >= g.step && g.eaten < g.target) {
        g.stepT -= g.step;
        g.dir = g.want;
        const [dc, dr] = DIRS[g.dir], [hc, hr] = g.body[0];
        const nc = (hc + dc + GW.cols) % GW.cols, nr = (hr + dr + GW.rows) % GW.rows;
        g.prev = g.body.map(p => [...p]);
        g.body.unshift([nc, nr]);
        if (g.grow > 0) g.grow--; else g.body.pop();
        const bit = g.body.findIndex(([a, b], i) => i > 0 && a === nc && b === nr);
        if (bit > 0) {
          g.body = g.body.slice(0, Math.max(3, bit)); g.prev = null; g.bites++;
          SFX.miss(); floatText(gwX(nc), gwY(nr) - 30, 'Ouch!', '#ffb0c4', false, 24); speak('Ouch! Don\'t bite your tail!');
        }
        const oi = g.orbs.findIndex(o => o.c === nc && o.r === nr);
        if (oi >= 0) {
          g.orbs.splice(oi, 1); g.eaten++; g.grow += 2;
          SFX.pop(); tone(660 + g.eaten * 40, 0.12, 'sine', 0.08); burst(gwX(nc), gwY(nr), 14, { colors: ['#fff6a8', '#e8ff7a', '#bfe8ff'] });
          if (g.eaten < g.target) this.spawn(g);
        }
      }
      g.progress = `Orbs ${g.eaten} of ${g.target}`;
      g.score = clamp(g.eaten / g.target - 0.08 * g.bites, 0, 1);
      if (g.eaten >= g.target) { if (!g.endT) speak('What a big bright glow worm!'); g.endT += dt; if (g.endT > 1.2) g.done = true; }
      if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      // the meadow play patch
      ctx.fillStyle = 'rgba(20,24,60,.42)'; ctx.beginPath(); ctx.roundRect(GW.x0 - 8, GW.y0 - 8, GW.cols * GW.cell + 16, GW.rows * GW.cell + 16, 22); ctx.fill();
      ctx.strokeStyle = 'rgba(200,230,255,.35)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = 'rgba(200,230,255,.10)';
      for (let c = 0; c < GW.cols; c++) for (let r = 0; r < GW.rows; r++) if ((c + r) % 2 === 0) ctx.fillRect(GW.x0 + c * GW.cell, GW.y0 + r * GW.cell, GW.cell, GW.cell);
      for (const o of g.orbs) {
        const x = gwX(o.c), y = gwY(o.r) + Math.sin(o.t * 3) * 3, r = 11 + Math.sin(o.t * 5) * 1.5;
        glow(x, y, 34, 'rgba(255,255,220,.9)', 0.7);
        inkCircle(x, y, r, o.hue, 1, 'rgba(255,255,255,.9)'); ctx.fillStyle = '#fff'; circle(x - 4, y - 4, 3.5);
      }
      // the glow worm, sliding smoothly between cells
      const k = clamp(g.stepT / g.step, 0, 1);
      const pos = g.body.map((p, i) => {
        // segment i slid from prev[i] into its cell this step (no sliding across a wrap)
        const from = g.prev?.[i];
        let x = gwX(p[0]), y = gwY(p[1]);
        if (from && Math.abs(from[0] - p[0]) + Math.abs(from[1] - p[1]) === 1) { x = lerp(gwX(from[0]), x, k); y = lerp(gwY(from[1]), y, k); }
        return [x, y];
      });
      for (let i = pos.length - 1; i >= 0; i--) {
        const [x, y] = pos[i], pulse = 0.5 + 0.5 * Math.sin(S.t * 6 - i * 0.6), r = i === 0 ? 22 : 20 - Math.min(5, i * 0.2);
        glow(x, y, r * 2.4, 'rgba(210,255,130,.8)', 0.35 + 0.35 * pulse);
        inkCircle(x, y, r, mix('#8ae860', '#e8ff7a', pulse), 1.5);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(x - r * 0.3, y - r * 0.35, r * 0.35);
      }
      const [hx, hy] = pos[0], [dc, dr] = DIRS[g.dir];
      ctx.strokeStyle = OL; ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        const ax = hx + dc * 10 + (dr ? s * 8 : 0), ay = hy + dr * 10 + (dc ? s * 8 : 0);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + dc * 12 + (dr ? s * 6 : 0), ay + dr * 12 + (dc ? s * 6 : 0) - (dc ? 6 : 0)); ctx.stroke();
        ctx.fillStyle = '#ff9ac0'; circle(ax + dc * 12 + (dr ? s * 6 : 0), ay + dr * 12 + (dc ? s * 6 : 0) - (dc ? 6 : 0), 3.5);
        const ex = hx + dc * 6 + (dr ? s * 7 : 0), ey = hy + dr * 6 + (dc ? s * 7 : 0);
        ctx.fillStyle = '#fff'; circle(ex, ey, 5); ctx.fillStyle = '#2a1a3a'; circle(ex + dc * 1.5, ey + dr * 1.5, 2.6);
      }
    },
  };

  // --- Moon Phases: name the moon shapes, then say what comes next ----------------------------------
  const PH_CYCLE = [0, 0.15, 0.25, 0.5, 0.75, 0.85];
  const phName = p => (p === 0 ? 'new' : p === 0.5 ? 'full' : p === 0.25 || p === 0.75 ? 'half' : 'crescent');
  const drawPhase = (x, y, r, p) => {
    glow(x, y, r * 1.7, 'rgba(255,240,190,.35)', p === 0 ? 0.2 : 0.8);
    inkCircle(x, y, r, '#3e3c70', 1.5, 'rgba(200,190,240,.8)');
    const k = Math.cos(p * TAU), rx = r * Math.abs(k), waxing = p < 0.5;
    if (p !== 0) {
      const lit = new Path2D();
      if (waxing) { lit.arc(x, y, r, -PI / 2, PI / 2); if (k > 0) lit.ellipse(x, y, rx, r, 0, PI / 2, -PI / 2, true); else lit.ellipse(x, y, rx, r, 0, PI / 2, 3 * PI / 2, false); }
      else { lit.arc(x, y, r, PI / 2, 3 * PI / 2); if (k > 0) lit.ellipse(x, y, rx, r, 0, 3 * PI / 2, PI / 2, true); else lit.ellipse(x, y, rx, r, 0, -PI / 2, PI / 2, false); }
      lit.closePath();
      ctx.fillStyle = '#fff4c4'; ctx.fill(lit);
      ctx.save(); ctx.clip(lit); ctx.fillStyle = 'rgba(220,200,150,.55)';
      for (const [dx, dy, cr] of [[-0.3, -0.35, 0.18], [0.35, -0.1, 0.12], [-0.05, 0.3, 0.2], [0.4, 0.4, 0.1], [-0.5, 0.15, 0.09]]) circle(x + dx * r, y + dy * r, cr * r);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(160,150,210,.35)'; for (const [dx, dy, cr] of [[-0.3, -0.35, 0.18], [-0.05, 0.3, 0.2]]) circle(x + dx * r, y + dy * r, cr * r);
    }
    ctx.strokeStyle = 'rgba(255,250,220,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  };
  const nightCard = (x, y, w, h) => {
    const gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#1e2466'); gr.addColorStop(1, '#4a3a8a');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x + 9, y + 9, w - 18, h - 18, 12); ctx.fill();
    for (let s = 0; s < 6; s++) star(x + 22 + (s * 47) % (w - 44), y + 22 + (s * 31) % (h - 44), 2, 'rgba(255,255,230,.7)');
  };
  MG.moonphases = quiz({
    title: () => 'Moon Phases', icon: () => '🌗', unit: 'Moon',
    how: g => (g.tier === 1 ? 'The moon changes shape! Listen to the name, then tap the right moon.'
      : 'The moon changes shape every night: new, crescent, half and full. Name the moon, or pick the moon that comes next!'),
    rounds: g => [5, 6, 7][g.tier - 1],
    make(g) {
      const type = g.tier === 1 ? 'id' : g.tier === 2 ? (g.round % 2 ? 'next' : 'id') : (g.round % 3 === 0 ? 'id' : 'next');
      if (type === 'id') {
        const opts = g.tier === 1 ? shuffle([0, 0.15, 0.5, 0.25]).slice(0, 3) : [0, pick([0.15, 0.85]), pick([0.25, 0.75]), 0.5];
        const choices = shuffle(opts), answer = randInt(0, choices.length - 1);
        return { type, choices, answer, say: `Which one is the ${phName(choices[answer])} moon?` };
      }
      const s = randInt(0, 5), seq = [0, 1, 2].map(i => PH_CYCLE[(s + i) % 6]), ans = PH_CYCLE[(s + 3) % 6];
      const names = new Set([phName(ans)]), wrong = [];
      for (const p of shuffle(PH_CYCLE)) if (!names.has(phName(p))) { names.add(phName(p)); wrong.push(p); }
      const choices = shuffle([ans, ...wrong.slice(0, 2)]);
      return { type, seq, choices, answer: choices.indexOf(ans), say: `${seq.map(p => `${phName(p)} moon`).join(', ')}. What comes next?` };
    },
    rect: (g, i) => (g.type === 'id' ? rowRect(g.choices.length, i, 220, g.choices.length === 3 ? 230 : 196, 250) : rowRect(3, i, 330, 196, 190)),
    drawQ(g) {
      if (g.type === 'id') {
        qPanel(`Which one is the ${phName(g.choices[g.answer])} moon?`, 'Tap the moon that matches.');
      } else {
        panel(W / 2 - 400, 64, 800, 252, 22);
        outlined('What comes next?', W / 2, 92, 28, '#ff6fb5', 'center', '#fff');
        const x0 = W / 2 - 210;
        g.seq.forEach((p, i) => {
          nightCard(x0 + i * 140 - 64, 116, 128, 128); drawPhase(x0 + i * 140, 180, 40, p);
          text(`${phName(p)}`, x0 + i * 140, 270, 17, '#5a2a6e', 'center', 700);
          ctx.fillStyle = '#c06ae0'; tri(x0 + i * 140 + 72, 172, x0 + i * 140 + 72, 188, x0 + i * 140 + 84, 180);
        });
        const qx = x0 + 3 * 140;
        rrect(qx - 64, 116, 128, 128, 16, g.state === 'pick' ? 'rgba(255,240,250,.9)' : 'rgba(30,30,90,.95)', '#ff9ae0', 3);
        if (g.state === 'pick') outlined('?', qx, 180, 60, '#ff6fb5', 'center', '#fff');
        else drawPhase(qx, 180, 40, g.choices[g.answer]);
      }
    },
    drawChoice(g, p, x, y, w, h, i, { wrong }) {
      nightCard(x, y, w, h);
      drawPhase(x + w / 2, y + h / 2 - 12, Math.min(w, h) * 0.27, p);
      if (g.state !== 'pick' || wrong || g.type === 'next') text(`${phName(p)} moon`, x + w / 2, y + h - 30, 18, '#fff', 'center', 700);
      if (wrong) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x + 9, y + 9, w - 18, h - 18); }
    },
    right: g => (g.type === 'id' ? `${praise()} That's the ${phName(g.choices[g.answer])} moon.` : `${praise()} Next comes the ${phName(g.choices[g.answer])} moon.`),
    wrong: (g, i) => (g.type === 'id' ? `That one is the ${phName(g.choices[i])} moon. Try again!` : 'Hmm, not that one. Look how the moon grows, then shrinks!'),
  });

  restage('mothmeadow', {
    bg: 'mothmeadow_bg',
    games: [['glowworm', 'silk', {}], ['moonphases', 'silk', {}]],
    intro: ['*:The big moon rises over the meadow. The flowers begin to glow.', "N:Oh, hello! My little glow worm wants to grow big and bright. Guide him to the light orbs, but don't let him bite his own tail!", 'A:laughing:A wiggly glow worm!'],
    mid: ['N:Look up at the moon! It changes shape every night. Can you name the moon shapes, and say which comes next?', 'A:focused:New, crescent, half, full...'],
    outro: ['N:Moon-silk, for a moon-bright unicorn.', 'A:happy:It shines just like the moon!'],
  });

  // =========================================================================
  // 5. HONEY TREE HILL — Bramble the Bear
  // =========================================================================
  BACKDROPS.honeytree_bg = () => {
    sky3('#3fb4ff', '#8fd8ff', '#fff4c8', 0.45, 380);
    bdSunburst(130, 104);
    bdClouds(4, 'rgba(255,255,255,.95)', 92);
    bdHills('#b8e890', 300, 20, 0.007, 2);
    for (const [x, h, t] of [[40, 120, 2], [880, 130, 0], [940, 100, 1]]) drawTree(x, 320, h, 40, t);
    // the big round hill
    ctx.fillStyle = '#8ed86a'; ctx.beginPath(); ctx.moveTo(-40, H); ctx.lineTo(-40, 420); ctx.bezierCurveTo(160, 300, 760, 290, 1000, 410); ctx.lineTo(1000, H); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-40, 420); ctx.bezierCurveTo(160, 300, 760, 290, 1000, 410); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 20; i++) ellipse(100 + (i * 87) % 760, 360 + (i * 23) % 70, 18, 5);
    // the honey tree: a great trunk and a huge round crown
    const trunk = P2('M420,366 C444,350 452,320 452,280 C452,240 440,210 420,190 L540,190 C520,210 508,240 508,280 C508,320 516,350 540,366 C500,372 460,372 420,366 Z');
    ink(trunk, '#9a6a42', 2.5);
    ctx.save(); ctx.clip(trunk); ctx.strokeStyle = '#7a5032'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(456 + i * 12, 190); ctx.bezierCurveTo(450 + i * 12, 260, 466 + i * 12, 300, 452 + i * 14, 370); ctx.stroke(); } ctx.restore();
    inkEllipse(480, 290, 14, 18, 0, '#5a3a2a', 1.5); ctx.fillStyle = '#ffb81a'; ellipse(480, 300, 9, 6);
    ctx.lineCap = 'round';
    for (const [x1, y1, x2, y2] of [[450, 210, 300, 196], [510, 210, 680, 190]]) { ctx.strokeStyle = OL; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = '#9a6a42'; ctx.lineWidth = 15; ctx.stroke(); }
    const crown = [[480, 130, 110], [350, 150, 80], [610, 146, 84], [270, 186, 52], [700, 184, 56], [420, 92, 66], [550, 90, 68]];
    for (const [x, y, r] of crown) inkCircle(x, y, r, '#4fbf5f', 2);
    for (const [x, y, r] of crown) { ctx.fillStyle = '#4fbf5f'; circle(x, y, r); }
    for (const [x, y, r] of crown) { ctx.fillStyle = '#3fa852'; circle(x + r * 0.25, y + r * 0.3, r * 0.65); ctx.fillStyle = '#6cd46a'; circle(x - r * 0.3, y - r * 0.3, r * 0.45); }
    for (let i = 0; i < 16; i++) flower(300 + (i * 67) % 380, 90 + (i * 41) % 130, 6, i % 2 ? '#fff' : '#ffd84a', '#ff9a3a', 1);
    // honeycombs hanging from the branches, dripping
    honeycomb(330, 214, 13, [3, 2, 1], S.t);
    honeycomb(640, 206, 14, [3, 2, 1], S.t + 1.1);
    honeycomb(560, 228, 10, [2, 1], S.t + 0.5);
    // a hive hanging on a rope, and two straw skeps on a bench
    ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(400, 204); ctx.lineTo(400, 232); ctx.stroke(); skep(400, 280, 0.75);
    const sneak = scene === 'minigame' && SCENES.minigame.g?.type === 'honeysneak';
    if (!sneak) {
      inkRect(740, 362, 140, 10, '#b8804a', 2, 3); inkRect(752, 372, 8, 30, '#9a6a3e', 1.5, 2); inkRect(860, 372, 8, 30, '#9a6a3e', 1.5, 2);
      skep(780, 362, 0.8); skep(845, 362, 0.7);
    }
    // the picnic on the hill: gingham blanket, basket, honey pot and sandwiches
    const blanket = P2('M70,404 L250,398 L282,436 L40,446 Z');
    ink(blanket, '#ffffff', 2);
    ctx.save(); ctx.clip(blanket); ctx.fillStyle = 'rgba(255,90,110,.55)';
    for (let x = 30; x < 300; x += 24) ctx.fillRect(x, 390, 12, 60);
    for (let y = 398; y < 450; y += 12) ctx.fillRect(30, y, 260, 6);
    ctx.restore();
    inkRect(96, 394, 52, 30, '#d8a050', 2, 6); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(122, 394, 20, PI, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,70,30,.5)'; ctx.lineWidth = 2; for (let x = 104; x < 148; x += 10) { ctx.beginPath(); ctx.moveTo(x, 396); ctx.lineTo(x, 422); ctx.stroke(); }
    emoji('🍯', 190, 412, 30); emoji('🥪', 236, 424, 24); emoji('🍓', 166, 430, 18);
    // bees buzzing round the tree
    if (!sneak) for (let i = 0; i < 7; i++) {
      const a = S.t * (0.8 + i * 0.1) + i * 0.9;
      bee(480 + Math.cos(a) * (180 + i * 18), 200 + Math.sin(a * 2) * 70, 1.1, S.t + i);
    }
    // sunflowers and clover on the near grass
    for (const [x, h] of [[900, 90], [940, 70], [24, 80]]) {
      ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x, 470 - h); ctx.stroke();
      ctx.fillStyle = '#4fae4a'; ellipse(x + 10, 470 - h * 0.45, 10, 4, -0.5);
      for (let p = 0; p < 12; p++) { const a = p / 12 * TAU + Math.sin(S.t) * 0.05; ctx.fillStyle = '#ffc83a'; ellipse(x + Math.cos(a) * 15, 470 - h + Math.sin(a) * 15, 9, 4, a); }
      inkCircle(x, 470 - h, 10, '#8a5a2a', 1.2);
    }
    ctx.fillStyle = '#7fcf5a'; ctx.fillRect(0, 456, W, H - 456);
    ctx.fillStyle = '#9ade70'; ctx.beginPath(); ctx.moveTo(0, 456); ctx.quadraticCurveTo(480, 444, W, 458); ctx.lineTo(W, 466); ctx.lineTo(0, 466); ctx.fill();
    grassTufts(26, 462, 540, '#5aae4a');
    for (let i = 0; i < 12; i++) flower(40 + i * 82 + (i % 2) * 20, 470 + (i % 3) * 24, 7, ['#ffd84a', '#fff', '#ff9ac0', '#c6a2ff'][i % 4], '#ff9a3a', 1.2);
    emoji('🐞', 610, 486, 18);
  };

  // --- Sneaky Bear: hold to tiptoe Bramble to the hives and back, and FREEZE when the guard bees wake ------
  const SB = { home: 170, hive: 742, gy: 506 };
  // a big guard bee sitting on a hive: asleep, peeking, or wide awake and watching
  function guardBee(x, y, s, mood, t, lookX) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const flap = mood === 'sleep' ? 0.1 : Math.sin(t * 50) * 0.35;
    ctx.fillStyle = 'rgba(220,240,255,.85)'; ellipse(-8, -22, 11, 16, -0.4 + flap); ellipse(8, -22, 11, 16, 0.4 - flap);
    ctx.strokeStyle = 'rgba(91,63,115,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(-8, -22, 11, 16, -0.4 + flap, 0, TAU); ctx.ellipse(8, -22, 11, 16, 0.4 - flap, 0, TAU); ctx.stroke();
    inkEllipse(0, 0, 24, 18, 0, '#ffd23a', 2);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 24, 18, 0, 0, TAU); ctx.clip(); ctx.fillStyle = '#3a2a2a'; ctx.fillRect(-12, -20, 7, 40); ctx.fillRect(2, -20, 7, 40); ctx.restore();
    inkCircle(-22, -6, 13, '#ffd23a', 2);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, -17); ctx.quadraticCurveTo(-30, -28, -36, -28); ctx.moveTo(-20, -18); ctx.quadraticCurveTo(-18, -30, -12, -31); ctx.stroke();
    if (mood === 'sleep') { ctx.beginPath(); ctx.arc(-27, -7, 3.5, 0.2, PI - 0.2); ctx.moveTo(-14, -7); ctx.arc(-17, -7, 3.5, 0.2, PI - 0.2); ctx.stroke(); }
    else {
      const big = mood === 'awake' ? 5 : 3.2, look = clamp((lookX - x) / 300, -1, 1) * 1.6;
      for (const ex of [-27, -17]) { ctx.fillStyle = '#ffffff'; circle(ex, -7, big); ctx.fillStyle = '#1a0a20'; circle(ex + look, -6, big * 0.55); }
      if (mood === 'awake') { ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-33, -16); ctx.lineTo(-24, -13); ctx.moveTo(-11, -16); ctx.lineTo(-20, -13); ctx.stroke(); }
    }
    ctx.restore();
  }
  MG.honeysneak = {
    kind: 'action', title: () => 'Sneaky Bear', icon: () => '🐻',
    how: () => 'HOLD the space bar, or hold down on the screen, to tiptoe. Get honey from the hives and bring it to the picnic. When the bees wake up, LET GO and freeze!',
    init(g) {
      const t = g.tier - 1;
      Object.assign(g, {
        timeLeft: [70, 80, 90][t], x: SB.home, carry: false, got: 0, target: [3, 4, 5][t], caught: 0, speed: [150, 160, 175][t],
        bee: 'sleep', beeT: rand(2.5, 3.5), warnLen: [1.1, 0.85, 0.65][t], fake: [0, 0.25, 0.35][t], hold: false, stun: 0, step: 0, end: 0, chase: 0,
        say: 'Tiptoe to the hives. Freeze when the bees wake up!',
      });
    },
    start(g) { speak(g.say); },
    wake(g) {
      // sleeping, then a warning peek, then awake and watching (or sometimes just back to sleep)
      if (g.bee === 'sleep') { g.bee = 'warn'; g.beeT = g.warnLen; g.isFake = Math.random() < g.fake; tone(220, g.warnLen, 'sawtooth', 0.03, 0, 420); }
      else if (g.bee === 'warn') {
        if (g.isFake) { g.bee = 'sleep'; g.beeT = rand(1.2, 2.4); floatText(SB.hive, 300, 'Zzz...', '#ffffff', false, 22); }
        else { g.bee = 'awake'; g.beeT = rand(1.5, 2.6); tone(300, 0.3, 'sawtooth', 0.04, 0, 320); }
      } else { g.bee = 'sleep'; g.beeT = rand(1.6, 3.4) - g.tier * 0.2; }
    },
    update(g, dt) {
      g.timeLeft -= dt; g.stun = Math.max(0, g.stun - dt); g.chase = Math.max(0, g.chase - dt);
      if (g.end) { g.end += dt; if (g.end > 1.4) g.done = true; return; }
      if ((g.beeT -= dt) <= 0) this.wake(g);
      g.hold = !!(keys[' '] || keys.arrowright || keys.arrowleft || keys.d || keys.a || pointer.down) && g.stun <= 0;
      if (g.hold) {
        const dir = g.carry ? -1 : 1;
        g.x = clamp(g.x + dir * g.speed * dt, SB.home, SB.hive);
        if ((g.step += dt) > 0.28) { g.step = 0; tone(g.carry ? 160 : 190, 0.05, 'sine', 0.025); }
        if (g.bee === 'awake') {
          // caught! the bees chase Bramble back and the honey drops
          g.caught++; g.stun = 1.2; g.chase = 1.2; SFX.miss();
          if (g.carry) { g.carry = false; floatText(g.x, SB.gy - 140, 'Oops, dropped it!', '#ffb0c4', false, 22); }
          g.x = clamp(g.x - dir * 140, SB.home, SB.hive);
          speak(pick(['Bzzz! They saw you! Freeze when they wake up!', 'Uh oh, caught! Wait till they sleep.', 'Bzzz! Stand still when their eyes are open!']));
        }
      }
      if (!g.carry && g.x >= SB.hive) { g.carry = true; SFX.pick(); floatText(SB.hive, SB.gy - 150, 'Got honey!', '#fff6a8', false, 24); }
      if (g.carry && g.x <= SB.home) {
        g.carry = false; g.got++; SFX.sparkle(); burst(SB.home, SB.gy - 90, 18, { kind: 'heart', colors: ['#ffd23a', '#ff9a3a'] });
        if (g.got >= g.target) { g.end = 0.01; speak('All the honey, and the bees never knew! Sneaky bear!'); }
        else speak(pick(['Yum! Back for more!', 'Sneaky! Another one!', 'Shh, go again!']));
      }
      g.progress = `Honey ${g.got} of ${g.target}`;
      g.score = clamp(g.got / g.target - g.caught * 0.06, 0, 1);
      if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      // the path, the picnic spot and the hive bench
      ctx.fillStyle = 'rgba(160,110,60,.35)'; ctx.beginPath(); ctx.ellipse((SB.home + SB.hive) / 2, SB.gy + 4, (SB.hive - SB.home) / 2 + 60, 14, 0, 0, TAU); ctx.fill();
      for (let x = SB.home + 30; x < SB.hive - 20; x += 46) { ctx.fillStyle = 'rgba(110,70,40,.35)'; ellipse(x, SB.gy + 4 + (x % 2 ? 2 : -2), 7, 4); }
      // honey brought home sits on the picnic blanket
      for (let i = 0; i < g.target; i++) {
        const x = 70 + i * 34, y = 452;
        if (i < g.got) honeycomb(x, y - 8, 8, [2, 1], S.t + i);
        else { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill(hexPath(x, y - 4, 12)); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(91,63,115,.6)'; ctx.lineWidth = 2; ctx.stroke(hexPath(x, y - 4, 12)); ctx.setLineDash([]); }
      }
      inkRect(SB.hive - 30, SB.gy - 70, 170, 12, '#b8804a', 2, 3); inkRect(SB.hive - 16, SB.gy - 58, 9, 60, '#9a6a3e', 1.5, 2); inkRect(SB.hive + 118, SB.gy - 58, 9, 60, '#9a6a3e', 1.5, 2);
      skep(SB.hive + 18, SB.gy - 70, 1.1); skep(SB.hive + 96, SB.gy - 70, 0.95);
      if (!g.carry) honeycomb(SB.hive + 56, SB.gy - 40, 9, [3, 2], S.t);
      // the guard bees on top of the hives
      const mood = g.bee, beeX = [SB.hive + 18, SB.hive + 96];
      beeX.forEach((x, i) => {
        if (g.chase > 0) { const k = 1 - g.chase / 1.2, bx = lerp(x, g.x + 30, Math.sin(k * PI)), by = lerp(SB.gy - 160, SB.gy - 140, k) + Math.sin(S.t * 20 + i) * 8; guardBee(bx + i * 30, by, 1, 'awake', S.t, g.x); }
        else guardBee(x, SB.gy - 150 - i * 4 + (mood === 'sleep' ? Math.sin(S.t * 2 + i) * 2 : 0), 1.15, mood, S.t + i, g.x);
      });
      if (mood === 'sleep') for (let i = 0; i < 3; i++) { const k = (S.t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - k; outlined('z', SB.hive + 40 + k * 40 + i * 6, SB.gy - 190 - k * 60, 16 + i * 6, '#ffffff'); ctx.globalAlpha = 1; }
      // Bramble, tiptoeing (with a honeycomb held up high when carrying)
      const walk = g.hold ? Math.sin(S.t * 14) : 0, dir = g.carry ? -1 : 1;
      ctx.save(); ctx.translate(g.x, SB.gy); ctx.rotate(walk * 0.05 + (g.stun > 0 ? Math.sin(S.t * 30) * 0.06 : 0)); ctx.translate(-g.x, -SB.gy);
      drawCritter('Bramble the Bear', g.x, SB.gy - Math.abs(walk) * 6, 0.62, dir);
      ctx.restore();
      if (g.carry) honeycomb(g.x, SB.gy - 150 - Math.abs(walk) * 6, 11, [3, 2, 1], S.t);
      // the big signal: sneak, careful, or FREEZE
      const sig = g.end ? null : mood === 'awake' || g.chase > 0 ? ['FREEZE!', '#ff5f7e', '✋'] : mood === 'warn' ? ['Careful...', '#ffb83a', '👀'] : ['Sneak!', '#5adc7a', '🐾'];
      if (sig) {
        panel(W / 2 - 130, 66, 260, 64, 20);
        emoji(sig[2], W / 2 - 86, 99, 34);
        outlined(sig[0], W / 2 + 22, 100, mood === 'awake' ? 38 + Math.sin(S.t * 16) * 2 : 34, sig[1]);
      }
      if (!g.got && !g.hold && mood !== 'awake' && g.x === SB.home && g.t < 5) { rrect(W / 2 - 150, 140, 300, 36, 18, 'rgba(48,24,72,.78)'); text('Hold to tiptoe!', W / 2, 158, 19, '#fff6a8', 'center', 700); }
    },
  };

  // --- More or Less: compare two groups or numbers; at tier 2–3 use > < = ------------------------
  const potGrid = (n, cx, cy, size) => {
    const cols = Math.min(5, n), rows = Math.ceil(n / 5), gap = size + 6;
    for (let i = 0; i < n; i++) emoji('🍯', cx + ((i % 5) - (cols - 1) / 2) * gap, cy + (Math.floor(i / 5) - (rows - 1) / 2) * gap + Math.sin(S.t * 2 + i) * 1.5, size);
  };
  const SIGNS = ['>', '<', '='], SIGN_SAY = { '>': 'is bigger than', '<': 'is smaller than', '=': 'is the same as' };
  MG.honeymoreless = quiz({
    title: () => 'More or Less', icon: () => '⚖️', unit: 'Question',
    how: g => (g.tier === 1 ? 'Look at the two sides. Tap the one with MORE, or the one with LESS!'
      : 'Look at the two sides and tap the one with more, or less. Then pick the sign: the big open mouth always faces the bigger number!'),
    rounds: g => [6, 7, 8][g.tier - 1],
    make(g) {
      const types = g.tier === 1 ? ['group', 'number'] : g.tier === 2 ? ['group', 'number', 'sign'] : ['number', 'sign', 'sign'];
      const type = types[g.round % types.length], max = [10, 10, 20][g.tier - 1];
      if (type === 'sign') {
        const a = randInt(1, max), b = Math.random() < 0.2 ? a : randInt(1, max);
        const ans = a > b ? 0 : a < b ? 1 : 2;
        return { type, a, b, choices: SIGNS, answer: ans, say: `${a} and ${b}. Which sign goes in the middle?` };
      }
      let a = randInt(1, max), b = randInt(1, max);
      while (b === a || Math.abs(a - b) > (g.tier === 1 ? 6 : 9)) b = randInt(1, max);
      const more = g.tier === 1 ? g.round % 3 !== 2 : Math.random() < 0.5;
      const ans = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1), what = type === 'group' ? 'honey pots' : 'number';
      const say = type === 'group' ? `Which side has ${more ? 'more' : 'less'} honey pots?` : `Which number is ${more ? 'bigger' : 'smaller'}?`;
      return { type, a, b, more, choices: [a, b], answer: ans, oneTry: true, credit: [1, 0], say, what };
    },
    keyPick: g => (g.type !== 'sign' ? (pressed.arrowleft ? 0 : pressed.arrowright ? 1 : -1) : -1),
    rect: (g, i) => (g.type === 'sign' ? rowRect(3, i, 392, 170, 122, 26) : { x: i ? 500 : 120, y: 168, w: 340, h: 336 }),
    drawQ(g) {
      if (g.type === 'sign') {
        qPanel('Which sign goes in the middle?', 'The big open mouth faces the bigger number!');
        panel(W / 2 - 300, 180, 600, 190, 26);
        for (const [n, x] of [[g.a, W / 2 - 170], [g.b, W / 2 + 170]]) { ink(hexPath(x, 275, 74), '#ffd860', 2); outlined(String(n), x, 278, 66, '#fff', 'center', '#c0701a'); }
        rrect(W / 2 - 50, 225, 100, 100, 18, g.state === 'pick' ? 'rgba(255,240,250,.9)' : '#fff6a8', '#ff9ae0', 3);
        outlined(g.state === 'pick' ? '?' : SIGNS[g.answer], W / 2, 278, 64, '#ff6fb5', 'center', '#fff');
        if (g.state !== 'pick') text(`${g.a} ${SIGN_SAY[SIGNS[g.answer]]} ${g.b}`, W / 2, 352, 18, '#7a4a90', 'center', 700);
      } else {
        const big = g.more ? 'MORE' : 'LESS';
        qPanel(g.type === 'group' ? `Which side has ${big}?` : `Which number is ${g.more ? 'BIGGER' : 'SMALLER'}?`, '', 70, 80);
      }
    },
    drawChoice(g, c, x, y, w, h, i, { wrong, right }) {
      if (g.type === 'sign') {
        outlined(c, x + w / 2, y + 46, 64, '#fff', 'center', 'rgba(60,20,80,.55)');
        text(SIGN_SAY[c], x + w / 2, y + 96, 15, '#fff', 'center', 700);
        return;
      }
      ctx.fillStyle = 'rgba(255,250,235,.9)'; ctx.beginPath(); ctx.roundRect(x + 12, y + 12, w - 24, h - 24, 16); ctx.fill();
      if (g.type === 'group') { potGrid(c, x + w / 2, y + h / 2 - 10, c > 10 ? 34 : 42); }
      else { ink(hexPath(x + w / 2, y + h / 2 - 10, 100), '#ffd860', 2.5); outlined(String(c), x + w / 2, y + h / 2 - 6, 96, '#fff', 'center', '#c0701a'); }
      if (g.state !== 'pick' || wrong) text(g.type === 'group' ? `${c} pots` : '', x + w / 2, y + h - 34, 22, '#7a4a20', 'center', 800);
      if (right) { emoji('🐻', x + w - 40, y + 40, 40); }
      text(i ? '2  or  →' : '1  or  ←', x + w / 2, y + h - 14, 12, 'rgba(120,80,40,.6)', 'center', 700);
    },
    noKeys: false,
    right: g => (g.type === 'sign' ? `${praise()} ${g.a} ${SIGN_SAY[SIGNS[g.answer]]} ${g.b}.` : g.type === 'group' ? `${praise()} ${g.choices[g.answer]} is ${g.more ? 'more' : 'less'} than ${g.choices[1 - g.answer]}.` : `${praise()} ${g.choices[g.answer]} is ${g.more ? 'bigger' : 'smaller'}.`),
    wrong: (g, i) => (g.type === 'sign' ? 'Not quite. Remember, the open mouth eats the bigger number!' : `Oh! ${g.choices[g.answer]} is ${g.more ? (g.type === 'group' ? 'more' : 'bigger') : (g.type === 'group' ? 'less' : 'smaller')} than ${g.choices[i]}.`),
  });

  restage('honeytree', {
    bg: 'honeytree_bg',
    games: [['honeysneak', 'honey', {}], ['honeymoreless', 'honey', {}]],
    intro: ["N:It's me again, Bramble! The bees made SO much honey, but the guard bees are very grumpy about sharing.", "N:Help me tiptoe over while they nap. When they wake up, FREEZE! Bees only see things that move.", 'A:laughing:Shh! Sneaky bear mode!'],
    mid: ['N:Mmm, so much honey! Now help me share. Who has more honey, and who has less?'],
    outro: ['N:Golden honey, the best in the woods. Thank you, friend!', 'A:happy:Save some for your tummy, Bramble!'],
  });

  // =========================================================================
  // 6. SWAN LAKE — Lady Swan
  // =========================================================================
  const gazebo = (x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkRect(-80, -12, 160, 14, '#f4ecf8', 1.6, 4);
    inkRect(-70, -20, 140, 10, '#e8dcf0', 1.4, 3);
    for (const cx of [-62, -22, 22, 62]) { inkRect(cx - 5, -110, 10, 92, '#ffffff', 1.4, 3); }
    ctx.strokeStyle = '#ff9ac0'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { const a = -62 + i * 42; ctx.beginPath(); ctx.moveTo(a, -100); ctx.quadraticCurveTo(a + 21, -84, a + 42, -100); ctx.stroke(); }
    ink(P2('M-92,-108 L92,-108 L80,-118 L-80,-118 Z'), '#ffffff', 1.4);
    ink(P2('M-84,-118 C-70,-160 -30,-186 0,-192 C30,-186 70,-160 84,-118 Z'), '#ff9ac0', 1.6);
    ctx.save(); ctx.clip(P2('M-84,-118 C-70,-160 -30,-186 0,-192 C30,-186 70,-160 84,-118 Z')); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3;
    for (const d of [-50, -20, 20, 50]) { ctx.beginPath(); ctx.moveTo(d * 1.6, -118); ctx.quadraticCurveTo(d * 0.5, -170, 0, -192); ctx.stroke(); }
    ctx.restore();
    inkRect(-3, -212, 6, 22, '#ffd84a', 1, 2); inkCircle(0, -214, 6, '#ffd84a', 1);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = ['#ffe36b', '#ff9ac0', '#a6f0b8'][i % 3]; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 3 + i); circle(-72 + i * 24, -112, 3.5); }
    ctx.globalAlpha = 1;
    ctx.restore();
  };
  const LAKE_TOP = 272, LAKE_BOT = 446;
  BACKDROPS.swanlake_bg = () => {
    sky3('#ff8ab8', '#ffc08a', '#ffe8a8', 0.55, LAKE_TOP);
    // the low golden sun and soft pink clouds
    glow(330, 236, 170, 'rgba(255,240,170,.7)');
    inkCircle(330, 236, 46, '#fff0a0', 1.5, 'rgba(255,200,120,.7)');
    bdClouds(4, 'rgba(255,220,235,.85)', 96);
    for (let i = 0; i < 3; i++) birdV(((i * 210 + S.t * 22) % (W + 100)) - 50, 150 + i * 16, 1.1);
    bdHills('#c48ab8', 262, 14, 0.008, 1);
    bdHills('#a87aae', 272, 8, 0.016, 2);
    // a soft, bumpy line of far trees along the shore
    ctx.fillStyle = '#9a72b0'; ctx.beginPath(); ctx.moveTo(0, LAKE_TOP);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, LAKE_TOP - 14 - Math.abs(Math.sin(x * 0.045)) * 12 - Math.sin(x * 0.013) * 5);
    ctx.lineTo(W, LAKE_TOP); ctx.fill();
    // the lake, mirroring the sky
    const wg = ctx.createLinearGradient(0, LAKE_TOP, 0, LAKE_BOT);
    wg.addColorStop(0, '#ffd2a8'); wg.addColorStop(0.35, '#d8a8d8'); wg.addColorStop(1, '#6aa0e0');
    ctx.fillStyle = wg; ctx.fillRect(0, LAKE_TOP, W, LAKE_BOT - LAKE_TOP);
    // the sun's shimmering path
    for (let i = 0; i < 14; i++) {
      const y = LAKE_TOP + 6 + i * 11, w = 50 - i * 2 + Math.sin(S.t * 2.5 + i) * 10;
      ctx.fillStyle = `rgba(255,245,190,${0.75 - i * 0.045})`; ellipse(330 + Math.sin(S.t * 1.5 + i * 1.3) * 6, y, Math.max(8, w), 2.5);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const x = (i * 97 + S.t * 10) % W, y = LAKE_TOP + 20 + (i * 37) % 150; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 3, x + 28, y); ctx.stroke(); }
    // the gazebo on its little island, with its reflection
    inkEllipse(740, 300, 120, 18, 0, '#9ad07a', 1.5);
    ctx.save(); ctx.translate(0, 600); ctx.scale(1, -1); ctx.globalAlpha = 0.22; gazebo(740, 300, 0.78); ctx.restore(); ctx.globalAlpha = 1;
    inkEllipse(740, 300, 120, 18, 0, '#9ad07a', 1.5);
    gazebo(740, 298, 0.78);
    for (const [x, c] of [[640, '#ff9ac0'], [840, '#fff']]) flower(x, 296, 6, c, '#ffd84a', 1);
    // swans gliding about, with reflections and ripples
    for (const [x0, y, s, sp, ph] of [[300, 338, 0.6, 18, 0], [520, 372, 0.75, 14, 2], [880, 350, 0.5, 10, 4]]) {
      const x = x0 + Math.sin(S.t * 0.15 + ph) * 60, dir = Math.cos(S.t * 0.15 + ph) >= 0 ? 1 : -1;
      reflection(x, y + 6, 46 * s, '#ffffff', 0.35);
      drawSwan(x, y, s, dir, '#ffffff', Math.sin(S.t * 1.5 + ph) * 2);
      const k = (S.t * 0.4 + ph) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x - dir * 30 * s, y + 4, 20 + k * 40, 3 + k * 6, 0, 0, TAU); ctx.stroke();
    }
    // lily pads with flowers
    for (const [x, y, r, b] of [[150, 404, 22, '#ff9acb'], [196, 420, 14, null], [440, 426, 18, '#fff'], [620, 412, 20, '#ff9acb'], [680, 432, 13, null], [860, 420, 18, '#ffe08a']]) {
      inkEllipse(x, y, r, r * 0.3, 0, '#5ac85a', 1.4); ctx.fillStyle = '#c0a8e0'; tri(x, y, x + r, y - r * 0.12, x + r, y + r * 0.12);
      if (b) flower(x - r * 0.2, y - 4, r * 0.34, b, '#ffd84a', 1);
    }
    // weeping willows on both banks
    willow(70, 452, 1.05); willow(900, 452, 0.95);
    // cattails at the edges
    for (const [x, y] of [[200, 450], [760, 452]]) {
      for (let i = -2; i <= 2; i++) { ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + i * 5, y); ctx.lineTo(x + i * 8 + Math.sin(S.t + i) * 2, y - 46 - (i & 1) * 12); ctx.stroke(); }
      inkRect(x - 3, y - 60, 7, 16, '#8a5a3a', 1, 4); inkRect(x + 10, y - 52, 7, 14, '#8a5a3a', 1, 4);
    }
    // the near bank: a stone edge, grass, flowers and a path
    ctx.fillStyle = '#e8dcec'; ctx.beginPath(); ctx.moveTo(0, LAKE_BOT - 4); ctx.quadraticCurveTo(480, LAKE_BOT - 14, W, LAKE_BOT - 4); ctx.lineTo(W, LAKE_BOT + 10); ctx.lineTo(0, LAKE_BOT + 10); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.stroke();
    const gg = ctx.createLinearGradient(0, LAKE_BOT + 8, 0, H); gg.addColorStop(0, '#9ad87a'); gg.addColorStop(1, '#7cc260');
    ctx.fillStyle = gg; ctx.fillRect(0, LAKE_BOT + 8, W, H - LAKE_BOT - 8);
    ctx.fillStyle = '#f2e2c4'; ctx.beginPath(); ctx.moveTo(0, 492); ctx.quadraticCurveTo(480, 474, W, 494); ctx.lineTo(W, 520); ctx.quadraticCurveTo(480, 502, 0, 522); ctx.fill();
    grassTufts(24, 458, 540, '#5aae4a');
    for (let i = 0; i < 12; i++) flower(30 + i * 82 + (i % 2) * 24, 466 + (i % 3) * 26, 7, ['#ff9acb', '#fff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1.2);
    emoji('🦋', 520 + Math.sin(S.t * 0.7) * 80, 240 + Math.sin(S.t * 2) * 16, 20);
  };

  // --- Ribbon Glide: steer the swan along the curving ribbon on the water ----------------------------
  MG.swanribbon = {
    kind: 'action', title: () => 'Ribbon Glide', icon: () => '🦢',
    how: () => 'A silky ribbon floats on the lake. Move the mouse, drag, or use the up and down arrows to keep the swan on the ribbon. Catch the sparkles!',
    init(g) {
      Object.assign(g, { y: 300, dist: 0, speed: [130, 150, 170][g.tier - 1], half: [44, 36, 30][g.tier - 1], amp: [80, 100, 115][g.tier - 1], timeLeft: 30, on: 0, total: 0, stars: [], got: 0, made: 0, nextStar: 400, x: 250, trail: [] });
      g.say = 'Keep the swan on the ribbon!';
    },
    start(g) { speak(g.say); },
    ribY(g, xw) { return 312 + g.amp * Math.sin(xw * 0.0052 + 0.6) + g.amp * 0.35 * Math.sin(xw * 0.0123 + 2); },
    update(g, dt) {
      g.timeLeft -= dt; g.dist += g.speed * dt;
      if (keys.arrowup || keys.w) g.y -= 280 * dt;
      if (keys.arrowdown || keys.s) g.y += 280 * dt;
      if ((pointerMoved(g) || pointer.down) && !keys.arrowup && !keys.arrowdown && !keys.w && !keys.s) g.y = lerp(g.y, pointer.y, Math.min(1, dt * 9));
      g.y = clamp(g.y, 120, 510);
      const on = Math.abs(g.y - this.ribY(g, g.dist + g.x)) < g.half + 6;
      g.total += dt; if (on) g.on += dt;
      g.onNow = on;
      if (on) g.trail.push({ x: g.x - 30, y: g.y + 4, life: 0.8 });
      for (const p of g.trail) { p.life -= dt; p.x -= g.speed * dt; }
      g.trail = g.trail.filter(p => p.life > 0);
      // sparkles sit on the ribbon ahead
      while (g.nextStar < g.dist + W + 60) { g.stars.push({ xw: g.nextStar, got: false }); g.made++; g.nextStar += rand(220, 300); }
      for (const s of g.stars) {
        const sx = s.xw - g.dist, sy = this.ribY(g, s.xw);
        if (!s.got && Math.abs(sx - g.x) < 34 && Math.abs(sy - g.y) < 40) { s.got = true; g.got++; SFX.sparkle(); burst(sx, sy, 12); }
      }
      g.stars = g.stars.filter(s => s.xw - g.dist > -60);
      const seen = Math.max(1, g.made - g.stars.filter(s => s.xw - g.dist > g.x).length);
      g.score = 0.8 * (g.on / Math.max(1, g.total)) + 0.2 * Math.min(1, g.got / seen);
      g.progress = `On the ribbon: ${Math.round(100 * g.on / Math.max(0.01, g.total))}%`;
      if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      // the satin ribbon across the water
      ctx.fillStyle = 'rgba(80,120,200,.18)'; ctx.fillRect(0, 100, W, 440);
      const top = [], bot = [];
      for (let x = -10; x <= W + 10; x += 12) { const y = this.ribY(g, g.dist + x); top.push([x, y - g.half]); bot.push([x, y + g.half]); }
      ctx.beginPath(); top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); [...bot].reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke();
      const rg = ctx.createLinearGradient(0, 0, W, 0); rg.addColorStop(0, '#ff7ab8'); rg.addColorStop(0.5, '#ffa0d0'); rg.addColorStop(1, '#c08aff');
      ctx.fillStyle = rg; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 6; ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 12) { const y = this.ribY(g, g.dist + x) - g.half * 0.35; x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.lineDashOffset = g.dist;
      ctx.beginPath(); for (let x = -10; x <= W + 10; x += 12) { const y = this.ribY(g, g.dist + x); x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.setLineDash([]);
      for (const s of g.stars) if (!s.got) { const sx = s.xw - g.dist, sy = this.ribY(g, s.xw); glow(sx, sy, 26, 'rgba(255,250,200,.9)'); star(sx, sy, 13 + Math.sin(S.t * 6 + s.xw) * 2, '#fff6a8', 5); }
      for (const p of g.trail) star(p.x, p.y, 3 + p.life * 4, `rgba(255,250,220,${p.life})`);
      // ripples behind and the swan herself
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(g.x - 40 - i * 18, g.y + 6 - i * 4); ctx.lineTo(g.x - 60 - i * 26, g.y + 2 - i * 8); ctx.moveTo(g.x - 40 - i * 18, g.y + 6 + i * 4); ctx.lineTo(g.x - 60 - i * 26, g.y + 10 + i * 8); ctx.stroke(); }
      if (g.onNow) glow(g.x, g.y - 20, 60, 'rgba(255,250,200,.7)');
      drawSwan(g.x, g.y + 4, 0.9, 1, '#ffffff', Math.sin(S.t * 2) * 2);
      emoji('👑', g.x + 40, g.y - 80, 18);
    },
  };

  // --- Story Order: put the Ugly Duckling pictures in order ---------------------------------------
  const drawUgly = (x, y, s, sad) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkGroup([[P2('M-22,-4 C-26,-22 -8,-26 6,-24 C18,-22 24,-12 22,-2 C18,6 -16,6 -22,-4 Z'), '#9a96a8'], [(() => { const p = new Path2D(); p.arc(14, -30, 11, 0, TAU); return p; })(), '#9a96a8']], 1.4);
    ctx.fillStyle = '#7a7690'; ellipse(-4, -12, 12, 6, -0.2);
    ctx.fillStyle = '#ff9a3a'; tri(22, -32, 34, -28, 22, -25);
    ctx.fillStyle = '#2a1a3a'; circle(17, -33, 2);
    if (sad) { ctx.fillStyle = '#8ad4ff'; ellipse(18, -26, 1.8, 3); }
    ctx.restore();
  };
  const STORY = [
    ['egg', "Mother Duck's eggs hatch, one by one."],
    ['tease', 'One duckling is big and grey. The others tease him.'],
    ['alone', 'He runs away, and is cold and alone all winter.'],
    ['swans', 'In spring, he sees beautiful swans on the lake.'],
    ['swan', 'He looks in the water. He is a swan too!'],
  ];
  const storyPanel = (id, x, y, w, h) => {
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
    const winter = id === 'alone';
    const sk = ctx.createLinearGradient(0, y, 0, y + h); sk.addColorStop(0, winter ? '#c8d8f0' : id === 'swan' ? '#ffd0e8' : '#bfe8ff'); sk.addColorStop(1, '#ffffff');
    ctx.fillStyle = sk; ctx.fillRect(x, y, w, h);
    const cx = x + w / 2, gy = y + h * 0.72;
    if (winter) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, gy - 6, w, h);
      for (let i = 0; i < 16; i++) { ctx.fillStyle = '#fff'; circle(x + (i * 37) % w, y + ((i * 23 + S.t * 20) % (h * 0.7)), 2.5); }
      ctx.fillStyle = '#7a5a4a'; ctx.fillRect(x + w * 0.15, gy - 50, 5, 46); ctx.fillRect(x + w * 0.85, gy - 40, 4, 36);
      drawUgly(cx, gy, 1.3, true); emoji('❄️', x + w - 26, y + 22, 20);
    } else {
      ctx.fillStyle = id === 'egg' ? '#9ad87a' : '#7ad0f0'; ctx.fillRect(x, gy - 4, w, h);
      if (id !== 'egg') { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 14 + i * 40, gy + 12 + (i % 2) * 8); ctx.lineTo(x + 34 + i * 40, gy + 12 + (i % 2) * 8); ctx.stroke(); } }
      if (id === 'egg') {
        inkEllipse(cx + 10, gy + 2, 52, 14, 0, '#b07a48', 1.4);
        emoji('🥚', cx + 24, gy - 10, 26); emoji('🐣', cx - 6, gy - 12, 28); emoji('🐣', cx + 46, gy - 8, 22);
        emoji('🦆', x + 30, gy - 18, 36);
      } else if (id === 'tease') {
        emoji('🐥', x + 28, gy - 12, 26); emoji('🐥', x + 56, gy - 8, 24); emoji('🐥', x + 40, gy - 30, 22);
        text('ha ha!', x + 48, y + 20, 13, '#a03a66', 'center', 800);
        drawUgly(x + w - 42, gy + 4, 1.1, true);
      } else if (id === 'swans') {
        flower(x + 18, gy - 8, 6, '#ff9acb', '#ffd84a', 1); flower(x + w - 18, gy - 6, 6, '#fff', '#ffd84a', 1);
        drawSwan(cx + 18, gy + 6, 0.45, -1); drawSwan(cx + 56, gy + 10, 0.38, -1);
        ctx.fillStyle = '#9ad87a'; ctx.fillRect(x, gy - 4, w * 0.3, h); drawUgly(x + 30, gy - 2, 0.9, false);
        text('!', x + 46, gy - 50, 20, '#ff5f7e', 'center', 800);
      } else {
        drawSwan(cx, gy + 4, 0.62, 1);
        ctx.save(); ctx.translate(0, (gy + 8) * 2); ctx.scale(1, -1); ctx.globalAlpha = 0.3; drawSwan(cx, gy + 4, 0.62, 1); ctx.restore(); ctx.globalAlpha = 1;
        for (let i = 0; i < 4; i++) star(cx - 50 + i * 34, y + 20 + (i % 2) * 14, 6 + Math.sin(S.t * 4 + i) * 2, '#ffe36b', 4);
      }
    }
    ctx.restore();
  };
  MG.swanstory = {
    kind: 'learn', title: () => 'Story Order', icon: () => '📖',
    how: g => `Lady Swan is telling the story of the Ugly Duckling, but the pictures got mixed up! Tap the pictures in order: what happens first, next, and last?`,
    init(g) {
      const ids = [['egg', 'tease', 'swan'], ['egg', 'tease', 'alone', 'swan'], ['egg', 'tease', 'alone', 'swans', 'swan']][g.tier - 1];
      const order = STORY.filter(s => ids.includes(s[0]));
      let cards; do { cards = shuffle(order.map((_, i) => i)); } while (cards.every((c, i) => c === i));
      Object.assign(g, { order, cards, placed: [], mistakes: 0, wrongHere: 0, shake: {}, fly: {}, endT: 0, rounds: order.length });
      this.prompt(g);
    },
    start(g) { speak(g.say); },
    prompt(g) {
      const k = g.placed.length;
      g.say = k === 0 ? 'What happens first? Tap the picture.' : k === g.order.length - 1 ? 'What happens at the end?' : 'What happens next?';
    },
    slot(g, i) { return rowRect(g.order.length, i, 108, g.order.length === 5 ? 170 : 196, 150, 14); },
    card(g, i) { return rowRect(g.order.length, i, 330, g.order.length === 5 ? 170 : 196, 150, 14); },
    update(g, dt, id) {
      for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
      for (const k in g.fly) g.fly[k] += dt;
      if (g.placed.length < g.order.length) {
        const i = id?.startsWith('story:') ? +id.slice(6) : -1;
        if (i >= 0 && !g.placed.includes(g.cards[i])) {
          const want = g.placed.length;
          if (g.cards[i] === want) {
            g.placed.push(want); g.fly[want] = 0; g.wrongHere = 0; SFX.hit();
            const s = this.slot(g, want); burst(s.x + s.w / 2, s.y + s.h / 2, 16);
            if (g.placed.length === g.order.length) { SFX.fanfare(); speak(`${g.order[want][1]} The end!`); }
            else { this.prompt(g); speak(`${g.order[want][1]} ${g.say}`); }
          } else {
            g.mistakes++; g.wrongHere++; g.shake[i] = 0.45; SFX.miss();
            speak(g.wrongHere >= 2 ? 'Look for the sparkly one!' : `Hmm, not yet. ${g.say}`);
          }
        }
      } else { g.endT += dt; if (g.endT > 2.6) g.done = true; }
      g.progress = `Pictures ${g.placed.length} of ${g.order.length}`;
      g.score = clamp(1 - g.mistakes * 0.2, 0, 1) * (g.placed.length / g.order.length);
    },
    draw(g) {
      panel(W / 2 - 300, 64, 600, 40, 18);
      text(g.placed.length < g.order.length ? g.say : 'The end! ✨', W / 2, 84, 20, '#5a2a6e', 'center', 700);
      g.order.forEach((s, i) => {
        const r = this.slot(g, i);
        rrect(r.x, r.y, r.w, r.h, 14, 'rgba(255,250,255,.55)', '#c9a8e0', 3);
        outlined(String(i + 1), r.x + r.w / 2, r.y + r.h / 2, 48, 'rgba(255,255,255,.9)', 'center', '#c9a8e0');
      });
      // cards still to place, then the placed ones (flying up into their slot)
      g.cards.forEach((c, i) => {
        const r = this.card(g, i), done = g.placed.includes(c);
        if (done) { rrect(r.x, r.y, r.w, r.h, 14, 'rgba(255,255,255,.25)', 'rgba(255,255,255,.5)', 2); return; }
        const x = r.x + (g.shake[i] ? Math.sin(g.shake[i] * 50) * 7 : 0), hint = g.wrongHere >= 2 && c === g.placed.length;
        button(`story:${i}`, x, r.y, r.w, r.h, '', { color: hint ? '#ffc23a' : CHOICE_COLS[i % 4], key: String(i + 1) });
        storyPanel(g.order[c][0], x + 8, r.y + 8, r.w - 16, r.h - 16);
        if (hint) for (let s = 0; s < 3; s++) star(x + r.w / 2 + Math.cos(S.t * 3 + s * 2.1) * (r.w / 2 + 6), r.y + r.h / 2 + Math.sin(S.t * 3 + s * 2.1) * (r.h / 2 + 6), 8, '#fff6a8', 4);
      });
      g.placed.forEach(c => {
        const from = this.card(g, g.cards.indexOf(c)), to = this.slot(g, c), k = clamp((g.fly[c] ?? 1) / 0.45, 0, 1), e = k * k * (3 - 2 * k);
        const x = lerp(from.x, to.x, e), y = lerp(from.y, to.y, e) - Math.sin(e * PI) * 40;
        rrect(x, y, to.w, to.h, 14, '#ffffff', '#ffc23a', 4);
        storyPanel(g.order[c][0], x + 8, y + 8, to.w - 16, to.h - 16);
        outlined(String(c + 1), x + 20, y + 20, 20, '#fff', 'center', '#ff6fb5');
      });
      if (g.placed.length) {
        const last = g.order[g.placed[g.placed.length - 1]][1], lines = wrap(last, 760, 20);
        rrect(W / 2 - 400, 490, 800, 40, 20, 'rgba(48,24,72,.78)');
        text(lines[0] + (lines.length > 1 ? '…' : ''), W / 2, 510, 20, '#fff6a8', 'center', 700);
      }
    },
  };

  restage('swanlake', {
    bg: 'swanlake_bg',
    games: [['swanribbon', 'feather', {}], ['swanstory', 'shell', {}]],
    intro: ['*:The lake glows gold in the evening sun. Swans glide past the little white gazebo.', 'N:Darling, every unicorn must learn grace. Follow the silk ribbon across the water, smooth and steady!', 'A:focused:Like a ballerina!'],
    mid: ['N:Exquisite! Now sit with me, darling. Do you know the story of the Ugly Duckling? The pictures are all mixed up.', 'A:thinking:I think I know this one...'],
    outro: ['N:A swan feather, and a shell from the lake. Remember: everyone shines in their own time.', 'A:happy:Thank you, Lady Swan!'],
  });
}
