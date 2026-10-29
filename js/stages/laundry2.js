'use strict';
{
  // ===========================================================================
  // Laundry Day, game 1: Sock Pattern Studio (learn: copying, repeating patterns, spotting errors).
  // Mom's dryer got so hot it faded the stripes off the socks. Aubrey paints them back:
  //  - COPY:  paint the bare sock so it matches its twin, stripe for stripe.
  //  - NEXT:  a stripy sock starts a repeating pattern (AB, AAB, ABC, AABB...); finish it.
  //  - FIX:   (tier 2+) one stripe breaks the pattern; tap it to wash it off, then repaint it.
  // Pick a paint pot (tap it or press its number), then tap a stripe. Every colour has its own
  // note, so a finished pattern also plays as a little tune. Finished socks roll into sock balls
  // and bounce into Mom's basket.
  // ===========================================================================
  const PAINTS = [
    { name: 'pink', c: '#ff7eb6', m: 'heart', f: 523 },
    { name: 'blue', c: '#4fa8f5', m: 'dot', f: 659 },
    { name: 'yellow', c: '#ffd23f', m: 'star', f: 784 },
    { name: 'green', c: '#5fca62', m: 'zig', f: 880 },
    { name: 'purple', c: '#a77bff', m: 'wave', f: 1047 },
  ];
  const UNITS = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1], AABC: [0, 0, 1, 2], ABCD: [0, 1, 2, 3] };
  const PLANS = {
    1: [['copy', 4], ['next', 'AB'], ['copy', 5], ['next', 'AAB'], ['next', 'ABC']],
    2: [['next', 'AB'], ['copy', 5], ['next', 'ABB'], ['fix', 'ABC'], ['next', 'AABB']],
    3: [['next', 'ABC'], ['copy', 6], ['next', 'AABC'], ['fix', 'AABB'], ['next', 'ABCD']],
  };
  const MAT = { x: 232, y: 66, w: 496, h: 368 };
  const SX = 250, HH = 50, CUFF = 28, LEG = 380;
  const DRYER = { x: 28, y: 214, w: 176, h: 248, cx: 116, cy: 352 };
  const BASKET_X = 806, BASKET_Y = GY + 8;
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

  const scrubSfx = () => { noise(0.35, 0.05); [0, 0.08, 0.16].forEach(w => tone(rand(1200, 1800), 0.06, 'sine', 0.05, w, 2400)); };
  const splatSfx = () => { tone(240, 0.18, 'triangle', 0.08, 0, 120); noise(0.12, 0.03); };
  const plopSfx = () => { tone(300, 0.08, 'sine', 0.1, 0, 520); };

  // --- art -------------------------------------------------------------------------------
  // a little white motif that says which paint a stripe is (shape + colour, so it reads either way)
  function motif(m, x, y, s, col) {
    ctx.fillStyle = col; ctx.strokeStyle = col;
    if (m === 'heart') heart(x, y - s * 0.45, s * 1.25, col);
    else if (m === 'dot') circle(x, y, s * 0.42);
    else if (m === 'star') star(x, y, s * 0.62, col, 5);
    else {
      ctx.lineWidth = Math.max(2, s * 0.2); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      if (m === 'zig') { ctx.moveTo(x - s * 0.5, y + s * 0.2); ctx.lineTo(x - s * 0.17, y - s * 0.25); ctx.lineTo(x + s * 0.17, y + s * 0.25); ctx.lineTo(x + s * 0.5, y - s * 0.2); }
      else { ctx.moveTo(x - s * 0.5, y); ctx.bezierCurveTo(x - s * 0.3, y - s * 0.45, x - s * 0.1, y - s * 0.45, x, y); ctx.bezierCurveTo(x + s * 0.1, y + s * 0.45, x + s * 0.3, y + s * 0.45, x + s * 0.5, y); }
      ctx.stroke();
    }
  }
  // the sock outline: cuff on the left, leg lying flat, foot turning down (fd = 1) or up (fd = -1)
  const sockPaths = {};
  function sockPath(fd) {
    if (sockPaths[fd]) return sockPaths[fd];
    const xe = CUFF + LEG, Y = v => v * fd;
    return (sockPaths[fd] = new Path2D(`M 0 ${Y(-HH)} L ${xe} ${Y(-HH)} C ${xe + 45} ${Y(-HH)} ${xe + 60} ${Y(-HH + 22)} ${xe + 60} ${Y(8)}
      L ${xe + 60} ${Y(72)} C ${xe + 60} ${Y(110)} ${xe - 50} ${Y(110)} ${xe - 50} ${Y(72)} L ${xe - 50} ${Y(HH)} L 0 ${Y(HH)} Z`));
  }
  const bandX = (sk, i) => CUFF + i * sk.bw;
  // one sock at (x, cy) = middle of its cuff edge. o: { s: scale, lit: stripes lit by the tune, hover }
  function drawSock(g, sk, x, cy, o = {}) {
    const s = o.s ?? 1, p = sockPath(sk.fd), xe = CUFF + LEG;
    ctx.save(); ctx.translate(x, cy); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(80,40,90,.16)'; ctx.save(); ctx.translate(5, 7); ctx.fill(p); ctx.restore();
    ink(p, '#fffaf1', 3, OL);
    ctx.save(); ctx.clip(p);
    // foot: cream with a heel and toe in the sock's accent colour
    ctx.fillStyle = sk.accent; ctx.fillRect(xe - 60, -130, 140, 260);
    ctx.fillStyle = sk.heel;
    circle(xe + 30, -16 * sk.fd, 40);
    ctx.fillRect(xe - 60, sk.fd > 0 ? 80 : -130, 140, 50);
    ctx.strokeStyle = 'rgba(61,44,74,.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xe - 54, 80 * sk.fd); ctx.lineTo(xe + 64, 80 * sk.fd); ctx.stroke();
    // cuff with ribs
    ctx.fillStyle = '#f1ecff'; ctx.fillRect(-2, -HH - 2, CUFF + 2, HH * 2 + 4);
    ctx.strokeStyle = 'rgba(120,90,170,.35)'; ctx.lineWidth = 2;
    for (let yy = -HH + 8; yy < HH; yy += 9) { ctx.beginPath(); ctx.moveTo(3, yy); ctx.lineTo(CUFF - 3, yy); ctx.stroke(); }
    // stripes
    sk.bands.forEach((b, i) => {
      const bx = bandX(sk, i), bw = sk.bw;
      if (b.col >= 0) {
        const P = PAINTS[b.col], k = ease(b.anim);
        ctx.fillStyle = P.c; ctx.fillRect(bx, -HH - 2, bw + 0.5, (HH * 2 + 4) * k);
        ctx.save(); ctx.beginPath(); ctx.rect(bx, -HH - 2, bw, (HH * 2 + 4) * k); ctx.clip();
        const mc = mix(P.c, '#ffffff', 0.62), ms = Math.min(18, bw * 0.42);
        for (let r = 0; r < 3; r++) motif(P.m, bx + bw / 2, -HH + 18 + r * 32, ms, mc);
        ctx.restore();
      } else {
        const next = b === o.next;
        ctx.fillStyle = next ? `rgba(255,240,150,${0.45 + Math.sin(S.t * 6) * 0.25})` : '#fffdf8';
        ctx.fillRect(bx, -HH, bw, HH * 2);
        ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(150,110,190,.7)'; ctx.lineWidth = 2;
        ctx.strokeRect(bx + 5, -HH + 6, bw - 10, HH * 2 - 12); ctx.setLineDash([]);
        if (sk.kind === 'next') text('?', bx + bw / 2, 2, Math.min(30, bw * 0.7), 'rgba(150,110,190,.75)', 'center', 800);
      }
      if (b.wrong > 0) {
        // the wrong paint slides off the stripe and drips away
        const P = PAINTS[b.wcol], a = b.wrong / 0.8, dy = (1 - a) * 40;
        ctx.globalAlpha = a; ctx.fillStyle = P.c;
        ctx.fillRect(bx, -HH + dy, bw, HH * 2);
        for (let d = 0; d < 3; d++) ellipse(bx + bw * (0.22 + d * 0.28), HH + dy - 2 + (d % 2) * 10, 6, 10 + (d % 2) * 5);
        ctx.globalAlpha = 1;
      }
      if (o.lit !== undefined && i <= o.lit) {
        const pulse = Math.max(0, 1 - (o.lit - i) * 0.35);
        ctx.fillStyle = `rgba(255,255,255,${0.5 * pulse})`; ctx.fillRect(bx, -HH, bw, HH * 2);
      }
      if (o.hover === i) { ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 6; ctx.strokeRect(bx + 3, -HH + 3, bw - 6, HH * 2 - 6); }
      // knit seams between stripes
      if (i > 0) { ctx.strokeStyle = 'rgba(61,44,74,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, -HH); ctx.lineTo(bx, HH); ctx.stroke(); }
    });
    // soft roundness and knit texture
    const gr = ctx.createLinearGradient(0, -HH, 0, HH);
    gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(0.3, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(60,30,90,0)'); gr.addColorStop(1, 'rgba(60,30,90,.14)');
    ctx.fillStyle = gr; ctx.fillRect(0, -HH, xe, HH * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1;
    for (let yy = -HH + 6; yy < HH; yy += 7) { ctx.beginPath(); ctx.moveTo(CUFF, yy); ctx.lineTo(xe, yy); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(p);
    ctx.beginPath(); ctx.moveTo(CUFF, -HH); ctx.lineTo(CUFF, HH); ctx.stroke();
    ctx.restore();
  }
  // a finished pair rolled into a sock ball
  function drawBall(x, y, r, cols, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    inkCircle(0, 0, r, '#fffaf1', 2.5, OL);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
    const w = (r * 2) / cols.length;
    cols.forEach((c, i) => { ctx.fillStyle = PAINTS[c].c; ctx.fillRect(-r + i * w, -r, w + 0.5, r * 2); });
    ctx.fillStyle = 'rgba(60,30,90,.16)'; ellipse(r * 0.3, r * 0.45, r, r * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-r * 0.35, -r * 0.45, r * 0.35, r * 0.18, -0.5);
    ctx.restore();
    // the folded-over cuff band
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -r * 1.2, r * 1.05, 0.95, Math.PI - 0.95); ctx.stroke();
    ctx.restore();
  }
  function drawDryer(g) {
    const d = DRYER, jig = g.rs === 'in' && g.rt < 0.5 ? Math.sin(S.t * 50) * 2.5 : 0;
    ctx.fillStyle = 'rgba(60,30,60,.22)'; ellipse(d.cx, d.y + d.h + 4, 96, 9);
    // folded towels on top
    [['#ffc2dc', 0], ['#bfe6ff', -18], ['#fff0a6', -36]].forEach(([c, dy], i) => inkRect(d.x + 22 + i * 4, d.y - 18 + dy, 108 - i * 8, 18, c, 2.5, 7));
    ctx.save(); ctx.translate(jig, 0);
    inkRect(d.x, d.y, d.w, d.h, '#c4f0e2', 3, 20);
    inkRect(d.x + 10, d.y + 10, d.w - 20, 40, '#a6e2d0', 2, 10);
    inkCircle(d.x + 36, d.y + 30, 12, '#fff6d8', 1.5, OL);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(d.x + 36, d.y + 30);
    ctx.lineTo(d.x + 36 + Math.cos(S.t * 2) * 9, d.y + 30 + Math.sin(S.t * 2) * 9); ctx.stroke();
    inkCircle(d.x + 76, d.y + 30, 7, '#ff9cc8', 1.5, OL); inkCircle(d.x + 100, d.y + 30, 7, '#ffe066', 1.5, OL);
    ctx.fillStyle = Math.sin(S.t * 5) > 0 ? '#7cff9a' : '#3fbf60'; circle(d.x + d.w - 28, d.y + 30, 6);
    // door with sock balls tumbling inside
    inkCircle(d.cx, d.cy, 64, '#e4e9f3', 2.5, OL);
    ctx.save(); ctx.beginPath(); ctx.arc(d.cx, d.cy, 50, 0, Math.PI * 2); ctx.clip();
    const gl = ctx.createLinearGradient(0, d.cy - 50, 0, d.cy + 50);
    gl.addColorStop(0, '#f2e6ff'); gl.addColorStop(1, '#c6b2ec'); ctx.fillStyle = gl; ctx.fillRect(d.cx - 52, d.cy - 52, 104, 104);
    const spin = S.t * (g.rs === 'in' ? 7 : 1.6);
    for (let k = 0; k < 4; k++) {
      const a = spin + k * 1.57;
      drawBall(d.cx + Math.cos(a) * 24, d.cy + 12 + Math.sin(a) * 18, 14, [k % g.pal, (k + 1) % g.pal], a);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(d.cx, d.cy, 42, -2.6, -1.7); ctx.stroke();
    inkRect(d.cx + 56, d.cy - 12, 10, 24, '#b7bfd2', 1.5, 4);
    inkRect(d.x + 16, d.y + d.h - 4, 24, 10, '#8fb8aa', 1.5, 3); inkRect(d.x + d.w - 40, d.y + d.h - 4, 24, 10, '#8fb8aa', 1.5, 3);
    ctx.restore();
    for (const p of g.puffs) { ctx.globalAlpha = clamp(p.life, 0, 1) * 0.85; ctx.fillStyle = '#ffffff'; circle(p.x, p.y, p.r); ctx.globalAlpha = 1; }
  }
  function drawBasket(g) {
    const x = BASKET_X, y = BASKET_Y;
    inkEllipse(x, y - 64, 84, 18, 0, '#9a6738', 2.5, OL);
    ctx.fillStyle = '#7b4f2a'; ellipse(x, y - 62, 76, 13);
    const spots = [[-40, -70], [0, -74], [40, -70], [-20, -92], [20, -92], [0, -112]];
    g.balls.forEach((b, i) => { const sp = spots[i % 6]; drawBall(x + sp[0], y + sp[1] - (b.hop || 0), 22, b.cols, sp[0] * 0.01); });
    const p = new Path2D(`M ${x - 84} ${y - 64} Q ${x - 80} ${y + 2} ${x - 60} ${y + 6} L ${x + 60} ${y + 6} Q ${x + 80} ${y + 2} ${x + 84} ${y - 64} Q ${x} ${y - 40} ${x - 84} ${y - 64} Z`);
    ctx.fillStyle = 'rgba(60,30,40,.22)'; ellipse(x, y + 6, 80, 8);
    ink(p, '#d39a5a', 2.6, OL);
    ctx.save(); ctx.clip(p); ctx.strokeStyle = 'rgba(120,70,30,.5)'; ctx.lineWidth = 3;
    for (let r = 0; r < 5; r++) for (let xx = x - 90 + (r % 2) * 12; xx < x + 90; xx += 24) { ctx.beginPath(); ctx.ellipse(xx, y - 48 + r * 12, 10, 4.5, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    ctx.lineWidth = 8; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(x - 84, y - 64); ctx.quadraticCurveTo(x, y - 40, x + 84, y - 64); ctx.stroke();
    ctx.lineWidth = 4.5; ctx.strokeStyle = '#e8b878'; ctx.stroke();
  }
  function drawPot(g, k) {
    const r = M.potRect(g, k), P = PAINTS[k], sel = g.sel === k, hint = g.hintPot === k;
    const cx = r.x + r.w / 2, lift = sel ? 10 : hint ? Math.abs(Math.sin(S.t * 7)) * 12 : (g.potBob[k] || 0) * 10;
    const top = 470 - lift;
    ctx.fillStyle = 'rgba(60,30,60,.25)'; ellipse(cx, 528, 36, 6);
    if (sel || hint) {
      const gr = ctx.createRadialGradient(cx, top + 20, 6, cx, top + 20, 62);
      gr.addColorStop(0, hint ? 'rgba(255,246,168,.95)' : 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(cx - 64, top - 44, 128, 120);
    }
    // the tin
    const body = new Path2D(`M ${cx - 34} ${top} L ${cx + 34} ${top} L ${cx + 31} ${top + 52} Q ${cx} ${top + 58} ${cx - 31} ${top + 52} Z`);
    ink(body, '#e9eef7', 2.5, OL);
    ctx.save(); ctx.clip(body);
    ctx.fillStyle = P.c; ctx.fillRect(cx - 40, top + 14, 80, 30);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(cx - 26, top + 2, 6, 60);
    ctx.restore();
    motif(P.m, cx - 23, top + 29, 13, '#ffffff');
    text(P.name, cx + 7, top + 29, 13, OL, 'center', 800);
    // the paint inside, bulging over the rim with a drip
    inkEllipse(cx, top, 35, 10, 0, '#cfd6e6', 2, OL);
    ctx.fillStyle = P.c; ellipse(cx, top, 29, 7);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(cx - 10, top - 2, 9, 2.5);
    ctx.fillStyle = P.c; ctx.beginPath(); ctx.roundRect(cx + 16, top + 2, 7, 14, 4); ctx.fill();
    // number badge
    inkCircle(cx - 30, top - 12, 11, '#ffffff', 1.5, OL);
    text(String(k + 1), cx - 30, top - 11, 14, OL, 'center', 800);
    if (sel) drawBrush(cx + 6, top - 6, P.c, 0.75);
  }
  // a paintbrush whose wet tip is at (x, y)
  function drawBrush(x, y, col, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.65); ctx.scale(s, s);
    inkRect(-5, -78, 10, 50, '#d99a5c', 2, 4);
    inkRect(-7, -32, 14, 14, '#c9cedb', 2, 2);
    ink(new Path2D('M -7 -18 L 7 -18 Q 8 -6 0 4 Q -8 -6 -7 -18 Z'), col, 2, OL);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-2, -74, 3, 40);
    ctx.restore();
  }
  function drawBubble(g) {
    if (!g.bub) return;
    const x = 734, y = 70, w = 214, lines = wrap(g.bub, w - 26, 17, 600), h = 22 + lines.length * 22;
    const pop = Math.min(1, g.bubT * 6);
    ctx.save(); ctx.translate(x + w * 0.7, y + h); ctx.scale(0.8 + pop * 0.2, 0.8 + pop * 0.2); ctx.translate(-x - w * 0.7, -y - h);
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.moveTo(x + w * 0.62, y + h - 2); ctx.lineTo(x + w * 0.7, y + h + 20); ctx.lineTo(x + w * 0.8, y + h - 2);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    lines.forEach((l, i) => text(l, x + w / 2, y + 22 + i * 22, 17, '#5a2a6e', 'center', 600));
    ctx.restore();
  }

  // --- the game -------------------------------------------------------------------------
  function makeRound(g, [kind, arg]) {
    const pal = g.pal, colours = shuffle([...Array(pal).keys()]);
    const band = (tgt, given) => ({ tgt, col: given ? tgt : -1, given, anim: 1, wrong: 0, wcol: 0, miss: 0 });
    let socks, unit = null, show = 0;
    if (kind === 'copy') {
      const seq = [];
      for (let i = 0; i < arg; i++) { let c; do c = randInt(0, pal - 1); while (c === seq[i - 1] || (i === arg - 1 && new Set([...seq, c]).size < 2)); seq.push(c); }
      socks = [{ fd: -1, cy: 176, sample: true, bands: seq.map(c => band(c, true)) }, { fd: 1, cy: 306, bands: seq.map(c => band(c, false)) }];
    } else {
      unit = UNITS[arg].map(i => colours[i]);
      show = unit.length * 2;
      const nb = kind === 'fix' ? Math.min(10, show + unit.length) : Math.min(10, show + (unit.length === 2 ? 4 : 3));
      const seq = Array.from({ length: nb }, (_, i) => unit[i % unit.length]);
      const bands = seq.map((c, i) => band(c, kind === 'fix' || i < show));
      if (kind === 'fix') {
        const bi = randInt(unit.length + 1, nb - 1), b = bands[bi];
        const all = [...Array(pal).keys()].filter(c => c !== b.tgt), odd = all.filter(c => c !== seq[bi - 1] && c !== seq[bi + 1]);
        b.bad = true; b.col = pick(odd.length ? odd : all);
      }
      socks = [{ fd: 1, cy: 232, bands }];
    }
    for (const sk of socks) { sk.kind = kind; sk.bw = LEG / sk.bands.length; sk.accent = mix(PAINTS[sk.bands[0].tgt].c, '#ffffff', 0.55); sk.heel = PAINTS[sk.bands[sk.bands.length - 1].tgt].c; }
    return { kind, socks, unit, show, work: socks[socks.length - 1], found: false, misses: 0 };
  }
  const roundSay = (g, R) => {
    if (R.kind === 'copy') return ['Paint the bottom sock so it matches its twin on top!', 'Make the bottom sock match the top one!'];
    if (R.kind === 'fix') return ['Uh oh! One stripe breaks the pattern. Tap it to wash it off, then paint it right!', 'One stripe is wrong! Tap it to wash it off.'];
    const names = R.work.bands.slice(0, R.show).map(b => PAINTS[b.tgt].name);
    return [`${cap(names.join(', '))}... What comes next? Finish the pattern!`, 'What comes next? Finish the pattern!'];
  };
  function startRound(g) {
    const R = g.R = makeRound(g, g.plan[g.round]);
    g.rs = 'in'; g.rt = 0; g.hintPot = -1;
    const [say, bub] = roundSay(g, R);
    g.say = say; setBub(g, bub);
    for (let i = 0; i < 8; i++) g.puffs.push({ x: DRYER.cx + rand(-30, 40), y: DRYER.cy + rand(-30, 30), vx: rand(20, 120), vy: rand(-60, 10), r: rand(6, 14), life: rand(0.6, 1) });
    tone(330, 0.25, 'sine', 0.06, 0, 660); plopSfx();
    g.progress = `Sock ${g.round + 1} of ${g.plan.length}`;
  }
  const setBub = (g, s) => { if (g.bub !== s) g.bubT = 0; g.bub = s; };
  const nextBlank = R => R.work.bands.find(b => b.col < 0 && b.wrong <= 0);
  const sockDone = R => R.work.bands.every(b => b.col === b.tgt && b.wrong <= 0 && !b.bad);
  function patternWords(R, n) { return R.work.bands.slice(0, n).map(b => PAINTS[b.tgt].name).join(', '); }

  function paintBand(g, b, i) {
    const R = g.R, P = PAINTS[g.sel], bx = SX + bandX(R.work, i) + R.work.bw / 2, by = R.work.cy;
    if (g.sel === b.tgt) {
      b.col = g.sel; b.anim = 0;
      if (b.miss === 0) g.good++;
      tone(P.f, 0.3, 'triangle', 0.09); tone(P.f * 2, 0.2, 'sine', 0.03, 0.03);
      burst(bx, by, 10, { colors: [P.c, '#ffffff', '#fff6a8'], spread: 90, up: 60 });
      if (g.hintPot === b.tgt) g.hintPot = -1;
      setBub(g, pick(['Yes!', 'Perfect!', 'That fits!', 'Lovely!', 'You got it!']));
    } else {
      b.wrong = 0.8; b.wcol = g.sel; b.miss++; R.misses++; g.bad++;
      splatSfx();
      floatText(bx, by - 70, 'Oops!', '#ff6fb5', false, 22);
      if (b.miss >= 2) {
        g.hintPot = b.tgt;
        const msg = R.kind === 'copy' ? `Look at the top sock. This one is ${PAINTS[b.tgt].name}!` : `${cap(patternWords(R, i))}... next is ${PAINTS[b.tgt].name}!`;
        setBub(g, `This stripe needs ${PAINTS[b.tgt].name}!`); speak(msg);
      } else setBub(g, R.kind === 'copy' ? 'Hmm, look at the twin sock again!' : 'Hmm, say the pattern out loud!');
    }
  }

  MG.sockpatterns = {
    kind: 'learn', title: () => 'Sock Pattern Studio', icon: () => '🧦',
    how: g => `The hot dryer faded the socks! Pick a paint pot, then tap a stripe to paint it. Copy the twin socks and finish each pattern${g.tier > 1 ? ', and fix the stripe that breaks it' : ''}.`,
    potRect(g, k) { const cx = 480 + (k - (g.pal - 1) / 2) * 98; return { x: cx - 44, y: 430, w: 88, h: 106 }; },
    bandRect(g, i) { const sk = g.R.work; return { x: SX + bandX(sk, i), y: sk.cy - HH - 8, w: sk.bw, h: HH * 2 + 16 }; },
    init(g) {
      Object.assign(g, {
        pal: g.tier + 2, plan: PLANS[clamp(g.tier, 1, 3)], round: 0, sel: -1, hintPot: -1, potBob: [], good: 0, bad: 0,
        balls: [], puffs: [], bub: '', bubT: 0, rs: 'in', rt: 0, endT: 0,
      });
      g.total = 0;
      for (const p of g.plan) g.total += p[0] === 'copy' ? p[1] : p[0] === 'fix' ? 2 : 0;
      // count the stripes to paint in each "next" round the same way makeRound builds them
      for (const p of g.plan) if (p[0] === 'next') { const L = UNITS[p[1]].length; g.total += Math.min(10, L * 2 + (L === 2 ? 4 : 3)) - L * 2; }
      startRound(g);
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.rt += dt; g.bubT += dt;
      for (const p of g.puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.r += dt * 8; }
      g.puffs = g.puffs.filter(p => p.life > 0);
      g.potBob = g.potBob.map(v => Math.max(0, v - dt * 3));
      for (const b of g.balls) if (b.hop) { b.vy += 1400 * dt; b.hop -= b.vy * dt; if (b.hop <= 0) { b.hop = 0; b.vy = 0; } }
      const R = g.R;
      for (const sk of R.socks) for (const b of sk.bands) { b.anim = Math.min(1, b.anim + dt * 4); if (b.wrong > 0) { b.wrong -= dt; if (b.wrong <= 0) b.wrong = 0; } }
      g.score = clamp(g.good / (g.total + g.bad * 0.25), 0, 1);
      if (g.rs === 'in') { if (g.rt > 0.75) { g.rs = 'paint'; g.rt = 0; } return; }
      if (g.rs === 'done') {
        const lit = Math.floor(g.rt / 0.16);
        if (lit !== g.lastLit && lit < R.work.bands.length) { g.lastLit = lit; burst(SX + bandX(R.work, lit) + R.work.bw / 2, R.work.cy - 40, 3, { colors: [PAINTS[R.work.bands[lit].tgt].c, '#fff'], spread: 50, up: 60 }); }
        if (g.rt > R.work.bands.length * 0.16 + 0.7) { g.rs = 'roll'; g.rt = 0; tone(500, 0.3, 'sine', 0.06, 0, 900); }
        return;
      }
      if (g.rs === 'roll') {
        if (g.rt > 0.8) {
          const cols = []; for (const b of R.work.bands) if (cols[cols.length - 1] !== b.tgt && cols.length < 4) cols.push(b.tgt);
          g.balls.push({ cols, hop: 30, vy: -300 });
          plopSfx(); burst(BASKET_X, BASKET_Y - 90, 14);
          g.round++;
          if (g.round >= g.plan.length) { g.rs = 'end'; g.rt = 0; SFX.sparkle(); setBub(g, 'All our socks are fixed! Thank you!'); speak('All our socks are fixed! Thank you, sweetie!'); }
          else startRound(g);
        }
        return;
      }
      if (g.rs === 'end') { if (g.rt > 1.6) g.done = true; return; }

      // --- painting ---
      for (let k = 0; k < g.pal; k++) {
        if (pressed[String(k + 1)]) {
          g.sel = k; g.potBob[k] = 1; SFX.blip(); if (g.hintPot === -2) g.hintPot = -1;
          const b = nextBlank(R);
          if (b) paintBand(g, b, R.work.bands.indexOf(b));
        }
      }
      if (pointer.clicked) {
        let hit = false;
        for (let k = 0; k < g.pal; k++) if (inRect(M.potRect(g, k))) {
          hit = true; g.sel = k; g.potBob[k] = 1; if (g.hintPot === -2) g.hintPot = -1; tone(PAINTS[k].f, 0.12, 'sine', 0.06); SFX.blip();
          if (R.kind !== 'fix' || R.found) setBub(g, `${cap(PAINTS[k].name)}! Now tap a stripe.`);
        }
        if (!hit) R.work.bands.forEach((b, i) => {
          if (hit || !inRect(M.bandRect(g, i))) return;
          hit = true;
          const bx = SX + bandX(R.work, i) + R.work.bw / 2;
          if (b.bad) {
            // wash the wrong stripe off with a burst of suds
            b.bad = false; b.given = false; b.col = -1; R.found = true;
            if (R.misses === 0) g.good++;
            scrubSfx(); burst(bx, R.work.cy, 18, { colors: ['#ffffff', '#d8f0ff', '#e9e0ff'], spread: 120, up: 40, size: [5, 11] });
            setBub(g, 'You found it! Now paint it the right colour.');
            speak('You found it! Now paint it the right colour.');
          } else if (b.col >= 0) {
            if (R.kind === 'fix') {
              R.misses++; g.bad++; b.wrong = 0; SFX.miss();
              floatText(bx, R.work.cy - 70, 'That one fits!', '#ffffff', false, 18);
              setBub(g, 'That stripe fits the pattern. Find the one that does not!');
            }
          } else if (b.wrong > 0) { /* still dripping */ } else if (g.sel < 0) {
            setBub(g, 'Tap a paint pot first!'); SFX.miss(); g.hintPot = -2;
          } else paintBand(g, b, i);
        });
      }
      if (sockDone(R)) {
        g.rs = 'done'; g.rt = 0; g.lastLit = -1; g.hintPot = -1;
        R.work.bands.forEach((b, i) => tone(PAINTS[b.tgt].f, 0.24, 'triangle', 0.07, i * 0.16));
        const praise = R.kind === 'copy' ? 'A perfect match!' : R.kind === 'fix' ? 'Fixed! The pattern works again!' : 'You finished the pattern!';
        setBub(g, praise);
        speak(R.kind === 'copy' ? praise : `${cap(patternWords(R, R.work.bands.length))}! ${praise}`);
      }
    },
    draw(g) {
      const R = g.R;
      // the craft mat
      ctx.save(); ctx.shadowColor = 'rgba(60,20,80,.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
      rrect(MAT.x, MAT.y, MAT.w, MAT.h, 22, '#ffd9ec'); ctx.restore();
      rrect(MAT.x, MAT.y, MAT.w, MAT.h, 22, null, OL, 3);
      rrect(MAT.x + 9, MAT.y + 9, MAT.w - 18, MAT.h - 18, 15, '#fffaf2', '#f2b8d6', 2);
      ctx.save(); ctx.beginPath(); ctx.roundRect(MAT.x + 9, MAT.y + 9, MAT.w - 18, MAT.h - 18, 15); ctx.clip();
      ctx.strokeStyle = 'rgba(240,170,205,.35)'; ctx.lineWidth = 1.5;
      for (let x = MAT.x + 30; x < MAT.x + MAT.w; x += 30) { ctx.beginPath(); ctx.moveTo(x, MAT.y); ctx.lineTo(x, MAT.y + MAT.h); ctx.stroke(); }
      for (let y = MAT.y + 30; y < MAT.y + MAT.h; y += 30) { ctx.beginPath(); ctx.moveTo(MAT.x, y); ctx.lineTo(MAT.x + MAT.w, y); ctx.stroke(); }
      ctx.restore();
      for (let k = 0; k < 6; k++) { ctx.fillStyle = PAINTS[k % 5].c; circle(MAT.x + 22 + k * 10, MAT.y + MAT.h - 4, 3); }

      // the socks
      const hoverI = g.rs === 'paint' ? R.work.bands.findIndex((b, i) => b.col < 0 && inRect(M.bandRect(g, i))) : -1;
      const nb = g.rs === 'paint' ? nextBlank(R) : null;
      R.socks.forEach(sk => {
        let x = SX, cy = sk.cy, s = 1;
        if (g.rs === 'in') {
          const t = ease(g.rt / 0.75);
          x = lerp(DRYER.cx - 40, SX, t); cy = lerp(DRYER.cy, sk.cy, t) - Math.sin(t * Math.PI) * 60; s = lerp(0.15, 1, t);
        } else if (g.rs === 'roll') {
          const t = clamp(g.rt / 0.8, 0, 1);
          x = lerp(SX, BASKET_X - 30, t * t); cy = lerp(sk.cy, BASKET_Y - 100, t * t) - Math.sin(t * Math.PI) * 80; s = lerp(1, 0.08, t);
        }
        if (g.rs === 'roll' && g.rt > 0.55) return;
        const lit = g.rs === 'done' && sk === R.work ? Math.floor(g.rt / 0.16) : undefined;
        drawSock(g, sk, x, cy, { s, lit, hover: sk === R.work ? hoverI : -1, next: sk === R.work && R.kind === 'next' ? nb : null });
      });
      if (g.rs === 'roll' && g.rt > 0.45) {
        const t = clamp(g.rt / 0.8, 0, 1), cols = [...new Set(R.work.bands.map(b => b.tgt))].slice(0, 4);
        drawBall(lerp(SX + 200, BASKET_X, t * t), lerp(R.work.cy, BASKET_Y - 90, t * t) - Math.sin(t * Math.PI) * 80, 22, cols, g.rt * 8);
      }
      if (g.rs === 'paint' || g.rs === 'done') {
        const W0 = R.work;
        // copy rounds: little arrows link each stripe to its twin
        if (R.kind === 'copy') {
          const top = R.socks[0].cy + HH + 4, bot = W0.cy - HH - 4;
          W0.bands.forEach((b, i) => {
            const x = SX + bandX(W0, i) + W0.bw / 2, done = b.col === b.tgt;
            ctx.strokeStyle = done ? PAINTS[b.tgt].c : 'rgba(150,110,190,.6)'; ctx.lineWidth = 3; ctx.setLineDash([4, 5]);
            ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot - 6); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = ctx.strokeStyle; tri(x - 6, bot - 8, x + 6, bot - 8, x, bot);
          });
        }
        // pattern rounds: brackets under each repeating chunk (always on tier 1, after a slip otherwise)
        if (R.unit && (g.tier === 1 || R.misses > 0 || g.rs === 'done')) {
          const L = R.unit.length, upto = g.rs === 'done' ? W0.bands.length : R.show;
          for (let u = 0; u * L + L <= upto; u++) {
            const x1 = SX + bandX(W0, u * L) + 5, x2 = SX + bandX(W0, u * L + L) - 5;
            if (x2 > SX + CUFF + LEG - 52) break;
            const y = W0.cy + HH + 12;
            ctx.strokeStyle = u % 2 ? '#c49be8' : '#ff9cc8'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x1, y - 6); ctx.quadraticCurveTo(x1, y + 4, (x1 + x2) / 2, y + 6); ctx.quadraticCurveTo(x2, y + 4, x2, y - 6); ctx.stroke();
          }
        }
      }

      drawDryer(g);
      // the scene draws Mom itself on the results panel
      if (g.phase === 'play') drawPerson('mom', 888, GY + 16, -1, 0, false, 0.74);
      drawBasket(g);
      if (g.phase === 'play') drawBubble(g);
      for (let k = 0; k < g.pal; k++) drawPot(g, k);
      if (g.hintPot === -2) { ctx.globalAlpha = 0.5 + Math.sin(S.t * 8) * 0.3; outlined('Pick a paint!', 480, 420, 20, '#fff6a8', 'center'); ctx.globalAlpha = 1; }
      // the brush follows the pointer over the socks
      if (g.sel >= 0 && pointer.x > MAT.x && pointer.x < MAT.x + MAT.w && pointer.y > MAT.y && pointer.y < MAT.y + MAT.h - 10 && g.rs === 'paint') drawBrush(pointer.x, pointer.y, PAINTS[g.sel].c, 0.9);
      if (g.rs === 'end') outlined(g.score >= 0.5 ? 'Sock superstar!' : 'All done!', 480, 250, 44, '#ff6fb5', 'center', '#fff');
    },
  };
  const M = MG.sockpatterns;

  restage('laundry', {
    games: [['sockpatterns', 'ribbon', {}], ['outfits', 'ribbon', {}]],
    intro: [
      'N:Oh no, Aubrey! The dryer got so hot, it faded the stripes right off our socks!',
      "N:Let's paint them back. Copy each sock's twin, and figure out what comes next in every pattern!",
      'A:excited:Pink, blue, pink, blue... I love patterns!',
    ],
  });
}
