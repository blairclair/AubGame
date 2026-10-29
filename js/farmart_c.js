'use strict';
// Farm Facts animal portraits (see js/farmart.js for the drawing contract)
// Birds: hen (Rhode Island Red), duck (white Pekin), turkey (bronze). Wrapped in a block so helper names stay private.
{
  const PI = Math.PI;
  const P = s => new Path2D(s);
  const LW = 3;  // half the outline width (ink strokes are lw * 2)
  // a copy of path p moved/rotated (radians)/scaled into place
  const xf = (p, x = 0, y = 0, rot = 0, sx = 1, sy = sx) => {
    const q = new Path2D(); q.addPath(p, new DOMMatrix().translateSelf(x, y).rotateSelf(rot * 180 / PI).scaleSelf(sx, sy)); return q;
  };
  // a leaf-shaped feather of length len along +x
  const blade = (len, w, tipR = 0.5) => P(`M0,${-w * 0.25} C${len * 0.35},${-w * 0.55} ${len * 0.78},${-w * 0.55} ${len},${-w * tipR * 0.2} C${len * 0.8},${w * 0.5} ${len * 0.35},${w * 0.5} 0,${w * 0.25} Z`);
  // a long feather with a broad rounded end (turkey fan)
  const paddle = (len, w) => P(`M0,-3 C${len * 0.4},${-w * 0.3} ${len * 0.7},${-w * 0.5} ${len * 0.86},${-w * 0.5} C${len * 1.03},${-w * 0.45} ${len * 1.03},${w * 0.45} ${len * 0.86},${w * 0.5} C${len * 0.7},${w * 0.5} ${len * 0.4},${w * 0.3} 0,3 Z`);
  const lin = (x0, y0, x1, y1, ...cols) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); return g; };
  const rad = (x, y, r, stops) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); for (const [k, c] of stops) g.addColorStop(k, c); return g; };
  // outline every path first, then fill them in order, so overlapping parts read as one mass
  function mass(parts, lw = LW) {
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of parts) ctx.stroke(p);
    for (const [p, f] of parts) { ctx.fillStyle = f; ctx.fill(p); }
  }
  function inkP(p, fill, lw = LW) { ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.stroke(p); ctx.fillStyle = fill; ctx.fill(p); }
  function line(p, col, lw) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(p); }
  function clipped(p, fn) { ctx.save(); ctx.clip(p); fn(); ctx.restore(); }
  // rows of little U-shaped feather edges (texture), inside whatever clip is active
  function scallopRows(x0, y0, x1, y1, step, r, col, lw, skip) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    let row = 0;
    for (let y = y0; y <= y1; y += step * 0.72, row++) {
      for (let x = x0 + (row % 2) * step / 2; x <= x1; x += step) {
        if (skip && skip(x, y)) continue;
        ctx.beginPath(); ctx.arc(x, y, r, 0.18 * PI, 0.82 * PI); ctx.stroke();
      }
    }
  }
  // a soft blob of colour (shading) inside a clip
  function glow(x, y, rx, ry, col, a) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, col); g.addColorStop(1, col + '00');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  }
  // round cartoon eye with a catchlight; blinks every few seconds
  function birdEye(x, y, r, t, ph, iris) {
    const c = (t + ph) % 4.3, k = c < 0.2 ? Math.sin(c / 0.2 * PI) : 0;
    ctx.save(); ctx.translate(x, y);
    if (k > 0.7) {
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, -r * 0.35, r, 0.22 * PI, 0.78 * PI); ctx.stroke();
      ctx.restore(); return;
    }
    ctx.scale(1, 1 - k * 0.85);
    inkCircle(0, 0, r, '#ffffff', 1.5, OL);
    if (iris) { ctx.fillStyle = iris; circle(r * 0.2, 0, r * 0.74); }
    ctx.fillStyle = '#2a1830'; circle(r * 0.26, 0, r * (iris ? 0.44 : 0.64));
    ctx.fillStyle = '#ffffff'; circle(r * 0.44, -r * 0.3, r * 0.27); circle(r * 0.04, r * 0.3, r * 0.11);
    ctx.restore();
  }
  // a bird leg: thick stroked line with scale ticks
  function birdLeg(pts, col, w) {
    const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) p.lineTo(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    line(p, OL, w + LW * 2); line(p, col, w);
    return p;
  }
  // chicken / turkey foot: three toes forward, one back, toes drawn as strokes
  function claws(x, y, col, w, s = 1) {
    const p = new Path2D();
    for (const [dx, dy] of [[24, 3], [18, 5], [13, 1.5], [-10, 4]]) { p.moveTo(x, y); p.lineTo(x + dx * s, y + dy); }
    line(p, OL, w + LW * 2); line(p, col, w);
    ctx.fillStyle = mix(col, '#5a3020', 0.45);
    for (const [dx, dy] of [[24, 3], [18, 5], [13, 1.5]]) circle(x + dx * s + 2, y + dy, 1.6);
  }

  // ------------------------------------------------------------------- HEN --
  const HEN = {
    body: P('M40,-120 C72,-112 86,-84 74,-60 C62,-38 32,-30 2,-32 C-30,-34 -58,-44 -72,-64 C-82,-78 -84,-96 -76,-112 C-56,-126 -18,-124 8,-124 C22,-124 32,-123 40,-120 Z'),
    neck: P('M6,-122 C14,-142 26,-160 42,-170 L76,-160 C80,-140 76,-118 66,-98 C50,-92 22,-100 6,-122 Z'),
    head: P('M36,-158 C34,-176 48,-182 62,-182 C78,-182 88,-172 88,-158 C88,-144 78,-134 62,-134 C46,-134 37,-144 36,-158 Z'),
    comb: P('M42,-172 C38,-181 42,-188 49,-186 C48,-196 55,-200 60,-191 C62,-200 70,-200 71,-190 C75,-197 83,-194 81,-185 C88,-185 89,-176 82,-169 Z'),
    wattle: P('M76,-140 C83,-140 87,-132 86,-125 C85,-118 77,-117 75,-124 C73,-118 66,-119 66,-126 C66,-133 70,-139 76,-140 Z'),
    beak: P('M84,-162 C92,-163 99,-158 102,-151 C96,-150 90,-148 85,-145 Z'),
    hackle: P('M44,-170 C26,-158 14,-140 10,-120 L18,-112 L22,-104 L30,-110 L36,-99 L42,-108 L50,-97 L55,-107 L63,-98 L66,-110 C74,-126 78,-144 74,-160 Z'),
    wing: P('M42,-98 C16,-110 -26,-106 -52,-92 C-68,-82 -72,-66 -62,-58 C-40,-50 -2,-54 24,-64 C42,-72 50,-88 42,-98 Z'),
  };
  ANIMAL_ART.hen = t => {
    const bob = Math.sin(t * 2.2) * 1.6, tilt = Math.sin(t * 1.1) * 0.025;
    const sway = Math.sin(t * 1.6) * 0.03;
    const red = '#c4502c', redL = '#e27a46', redD = '#8a3220';
    // far leg and foot
    birdLeg([[-4, -40], [-6, -20], [-8, -6]], '#e8b52a', 7); claws(-8, -6, '#e8b52a', 5, 0.85);
    // tail: dark glossy feathers fanned up and back, with red coverts in front
    ctx.save(); ctx.translate(-58, -104); ctx.rotate(sway);
    const tail = [[-98, 78, 22], [-112, 82, 24], [-127, 76, 24], [-142, 68, 22], [-158, 56, 20]];
    for (const [a, len, w] of tail) {
      const p = xf(blade(len, w), 0, 0, a * PI / 180);
      inkP(p, lin(0, 0, Math.cos(a * PI / 180) * len, Math.sin(a * PI / 180) * len, '#5a2a22', '#3a2026', '#2a3a3a'), 2.6);
      ctx.strokeStyle = 'rgba(120,200,170,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8 * Math.cos(a * PI / 180), 8 * Math.sin(a * PI / 180)); ctx.lineTo(Math.cos(a * PI / 180) * len * 0.85, Math.sin(a * PI / 180) * len * 0.85); ctx.stroke();
    }
    for (const [a, len, w] of [[-118, 44, 20], [-138, 42, 18], [-155, 36, 16]]) {
      const p = xf(blade(len, w), 6, 4, a * PI / 180);
      inkP(p, lin(0, 0, Math.cos(a * PI / 180) * len, Math.sin(a * PI / 180) * len, red, redD), 2.2);
    }
    ctx.restore();
    // near leg goes behind the belly fluff
    birdLeg([[24, -40], [24, -20], [26, -6]], '#f4c430', 7.5);
    // the main mass: comb, wattles, body, neck and head outlined together
    const hx = 0, hy = bob;
    const H = (p) => xf(p, hx + 62, hy - 158, tilt, 1, 1);
    const at = p => xf(p, -62, 158); // head-local paths
    const comb = H(at(HEN.comb)), head = H(at(HEN.head));
    const wob = Math.sin(t * 3.1) * 0.08;
    const wattleP = H(xf(xf(HEN.wattle, -76, 140), 76 - 62, -140 + 158, wob));
    mass([[comb, lin(0, -200, 0, -170, '#ff5a5a', '#d8282e')], [wattleP, lin(0, -140, 0, -116, '#f04040', '#c41e2a')],
          [HEN.body, lin(0, -124, 0, -30, redL, red, redD)], [HEN.neck, lin(0, -170, 0, -100, '#e08a44', red)], [head, rad(70, -168, 40, [[0, '#e8904c'], [1, '#c45a2e']])]]);
    // feather shading and texture on the body
    clipped(HEN.body, () => {
      glow(0, -30, 90, 40, '#5a1a10', 0.5);
      glow(-10, -122, 80, 26, '#ffb070', 0.45);
      scallopRows(-80, -112, 80, -36, 15, 7, 'rgba(110,34,20,.45)', 1.8, (x, y) => x > 40 && y < -100);
    });
    // golden neck hackles over the shoulders
    const hack = xf(HEN.hackle, 0, hy * 0.5);
    ctx.fillStyle = lin(0, -170, 0, -98, '#f0a050', '#e0843a', '#c8642e'); ctx.fill(hack);
    clipped(hack, () => { ctx.strokeStyle = 'rgba(140,60,20,.45)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 6, -156 + i * 2 + hy); ctx.quadraticCurveTo(22 + i * 6, -126, 18 + i * 7, -104); ctx.stroke(); } });
    line(hack, OL, 2.4);
    // re-draw the head on top of the hackles (no outline seam with the neck)
    ctx.fillStyle = rad(70, -168 + hy, 40, [[0, '#e8904c'], [1, '#c45a2e']]); ctx.fill(head);
    // folded wing: long flight feathers fanned back, rounded coverts with a scalloped edge on top
    for (let i = 0; i < 5; i++) {
      const p = xf(blade(84 - i * 6, 20, 1), 26, -90 + i * 6, PI - 0.02 - i * 0.07);
      inkP(p, lin(30, 0, -60, 0, '#b8502a', i % 2 ? '#7a2c1a' : '#8e3620'), 2.2);
      line(xf(P('M6,0 L60,0'), 26, -90 + i * 6, PI - 0.02 - i * 0.07), 'rgba(255,190,140,.35)', 1.4);
    }
    const cov = new Path2D();
    cov.moveTo(50, -92); cov.bezierCurveTo(38, -110, -6, -112, -30, -100);
    for (let k = 0; k < 7; k++) { const x = -26 + k * 11.5, y = -92 + k * 2.6; cov.arc(x, y, 6.5, PI * 1.1, 0.05 * PI, true); }
    cov.bezierCurveTo(58, -76, 58, -86, 50, -92); cov.closePath();
    inkP(cov, lin(0, -110, 0, -80, '#e4864e', '#c0562c'), 2.4);
    clipped(cov, () => scallopRows(-24, -102, 50, -94, 10, 5, 'rgba(120,40,20,.5)', 1.5));
    // fluffy thighs over the near leg
    ctx.fillStyle = redD; ctx.beginPath(); ctx.arc(22, -38, 10, 0.05 * PI, 0.95 * PI); ctx.fill();
    // head details
    ctx.save(); ctx.translate(62, -158 + hy); ctx.rotate(tilt); ctx.translate(-62, 158);
    ctx.fillStyle = 'rgba(255,190,140,.35)'; ellipse(60, -170, 14, 6, -0.3);
    inkEllipse(58, -148, 4, 3.4, 0.3, '#e8303a', 1, OL);           // earlobe
    inkP(HEN.beak, lin(84, -162, 100, -148, '#ffd45a', '#e0a030'), 1.8);
    line(P('M86,-152 C91,-152 96,-151 100,-151'), 'rgba(120,70,20,.7)', 1.4);
    ctx.fillStyle = '#7a4a20'; circle(90, -157, 1.2);
    ctx.fillStyle = 'rgba(255,110,110,.5)'; ellipse(70, -146, 6, 3.5);
    birdEye(70, -159, 7.5, t, 0.3, '#f0a030');
    ctx.restore();
    // comb highlight
    ctx.save(); ctx.translate(62, -158 + hy); ctx.rotate(tilt); ctx.translate(-62, 158);
    ctx.fillStyle = 'rgba(255,180,180,.6)'; ellipse(56, -190, 3, 2); ellipse(67, -192, 3, 2);
    ctx.restore();
    // near foot
    claws(26, -6, '#f4c430', 5.5);
    ctx.strokeStyle = 'rgba(160,100,10,.7)'; ctx.lineWidth = 1.3;
    for (let y = -34; y < -10; y += 5) { ctx.beginPath(); ctx.moveTo(21, y); ctx.lineTo(28, y + 1); ctx.stroke(); }
  };

  // ------------------------------------------------------------------ DUCK --
  const DUCK = {
    body: P('M30,-128 C56,-124 74,-104 72,-78 C70,-50 46,-30 8,-28 C-30,-27 -62,-40 -80,-62 C-90,-74 -98,-92 -106,-110 C-86,-108 -66,-108 -52,-112 C-26,-122 6,-131 30,-128 Z'),
    neck: P('M14,-122 C18,-140 24,-156 32,-166 L78,-160 C74,-140 70,-120 66,-96 C50,-88 24,-100 14,-122 Z'),
    head: P('M26,-166 C24,-188 42,-198 58,-197 C76,-196 88,-186 88,-170 C88,-150 74,-140 56,-140 C38,-140 28,-150 26,-166 Z'),
    bill: P('M80,-172 C92,-176 106,-172 114,-166 C121,-161 120,-153 113,-152 C102,-150 90,-150 80,-151 C76,-158 76,-166 80,-172 Z'),
    wing: P('M46,-106 C20,-118 -30,-108 -66,-86 C-78,-78 -76,-66 -64,-64 C-34,-58 8,-60 34,-72 C50,-80 56,-98 46,-106 Z'),
  };
  // a webbed foot seen a little from above: ankle at (x, y), three toes fanned forward
  function webFoot(x, y, s, col) {
    const tips = [[28 * s, -9], [36 * s, 0], [22 * s, 8]].map(([dx, dy]) => [x + dx, y + dy]);
    const p = new Path2D(); p.moveTo(x - 1, y - 3);
    p.lineTo(tips[0][0], tips[0][1]);
    p.quadraticCurveTo(x + 24 * s, y - 4, tips[1][0], tips[1][1]);
    p.quadraticCurveTo(x + 20 * s, y + 0.5, tips[2][0], tips[2][1]);
    p.quadraticCurveTo(x + 6, y + 4, x - 3, y + 2);
    p.closePath();
    inkP(p, lin(x, y - 10, x, y + 5, mix(col, '#ffe0a0', 0.25), mix(col, '#c04000', 0.25)), 2.4);
    ctx.strokeStyle = mix(col, '#802000', 0.5); ctx.lineWidth = 1.8;
    for (const [tx, ty] of tips) { ctx.beginPath(); ctx.moveTo(x + 3, y - 1); ctx.lineTo(tx - 3, ty); ctx.stroke(); }
    ctx.fillStyle = mix(col, '#802000', 0.35); for (const [tx, ty] of tips) circle(tx + 0.5, ty, 2);
  }
  ANIMAL_ART.duck = t => {
    const bob = Math.sin(t * 2) * 1.8, wag = Math.sin(t * 3.4) * 0.06;
    const W1 = '#ffffff', W2 = '#f4ede0', W3 = '#ddd0bc', OR = '#ff9a2a';
    // the body is tipped up a little at the chest, Pekin-style
    const TIP = -0.16, tipOn = () => { ctx.translate(10, -80); ctx.rotate(TIP); ctx.translate(-10, 80); };
    const body = xf(xf(DUCK.body, -10, 80), 10, -80, TIP);
    // legs and webbed feet (far one first)
    birdLeg([[-2, -36], [-4, -14]], '#f08a1e', 7); webFoot(-6, -11, 0.85, '#f08a1e');
    birdLeg([[26, -36], [24, -14]], OR, 7.5);
    // the curly tail feather sits behind the body
    ctx.save(); tipOn(); ctx.translate(-96, -108); ctx.rotate(wag);
    const curl = P('M0,0 C-2,-14 6,-24 16,-22 C24,-20 24,-10 16,-9');
    line(curl, OL, 10); line(curl, W2, 4.5);
    ctx.restore();
    // body, neck, head, bill as one mass
    const hy = bob, tilt = Math.sin(t * 1.3) * 0.03;
    const H = p => xf(xf(p, -56, 168), 56, -168 + hy, tilt);
    const head = H(DUCK.head), bill = H(DUCK.bill);
    const neck = P(`M10,-124 C16,-140 24,-156 32,${-166 + hy} L78,${-160 + hy} C76,-140 74,-120 72,-100 C54,-90 24,-100 10,-124 Z`);
    mass([[bill, OR], [body, W1], [neck, W1], [head, W1]]);
    // soft shading: cream underside, bright back, feather texture
    ctx.save(); tipOn();
    clipped(DUCK.body, () => {
      ctx.fillStyle = lin(0, -130, 0, -28, W1, W2, W3); ctx.fillRect(-120, -140, 200, 120);
      glow(10, -28, 90, 34, '#c8b496', 0.55);
      glow(-30, -126, 70, 22, '#ffffff', 0.9);
      scallopRows(-10, -66, 70, -36, 13, 6, 'rgba(180,160,130,.45)', 1.6);
      ctx.strokeStyle = 'rgba(180,160,130,.5)'; ctx.lineWidth = 1.6;
      for (const k of [0, 1, 2]) { ctx.beginPath(); ctx.moveTo(-104 + k * 6, -106 + k * 4); ctx.quadraticCurveTo(-80, -86 + k * 4, -60 + k * 4, -78 + k * 6); ctx.stroke(); }
    });
    ctx.restore();
    clipped(neck, () => { glow(76, -104, 26, 36, '#d8c8b0', 0.45); });
    // repaint head over the neck shading
    ctx.fillStyle = rad(64, -184 + hy, 50, [[0, '#ffffff'], [0.7, W1], [1, W2]]); ctx.fill(head);
    // folded wing: long flight feathers crossing up over the tail, rounded coverts in front
    ctx.save(); tipOn();
    for (let i = 0; i < 4; i++) {
      const a = PI + 0.2 - i * 0.07, bx = 34 - i * 2, by = -96 + i * 7;
      const p = xf(blade(108 - i * 10, 22, 1), bx, by, a);
      inkP(p, lin(bx, by, bx - 100, by - 20, W1, W2, '#e2d6c2'), 2);
      line(xf(P('M10,0 L70,0'), bx, by, a), 'rgba(170,150,120,.5)', 1.4);
    }
    const cov = new Path2D();
    cov.moveTo(52, -96); cov.bezierCurveTo(38, -116, -10, -116, -38, -102);
    for (let k = 0; k < 7; k++) { const x = -34 + k * 12.5, y = -94 + k * 3; cov.arc(x, y, 7, PI * 1.1, 0.05 * PI, true); }
    cov.bezierCurveTo(62, -76, 62, -88, 52, -96); cov.closePath();
    inkP(cov, lin(0, -116, 0, -78, W1, W2), 2.2);
    clipped(cov, () => { scallopRows(-28, -106, 50, -96, 11, 5.5, 'rgba(170,150,120,.5)', 1.5); glow(10, -76, 60, 14, '#c8b496', 0.4); });
    ctx.restore();
    // head details
    ctx.save(); ctx.translate(56, -168 + hy); ctx.rotate(tilt); ctx.translate(-56, 168);
    ctx.fillStyle = lin(80, -176, 80, -150, '#ffc060', OR, '#e87010'); ctx.fill(DUCK.bill);
    ctx.fillStyle = 'rgba(255,240,200,.55)'; ellipse(98, -168, 10, 2.6, 0.12);
    ctx.fillStyle = '#e07818'; ellipse(116, -158, 3.2, 4.5, 0.3);                 // nail at the tip
    line(P('M82,-160 C92,-158 104,-158 117,-157'), '#b85a10', 2);                // mouth line
    line(P('M80,-160 C78,-158 77,-157 79,-155'), OL, 2);                           // smile corner
    ctx.fillStyle = '#b85a10'; ellipse(91, -167, 2.6, 1.3, 0.1);                   // nostril
    ctx.fillStyle = 'rgba(255,150,170,.45)'; ellipse(64, -154, 8, 4.5);
    birdEye(66, -174, 7.5, t, 1.7);
    ctx.restore();
    webFoot(22, -10, 1.25, OR);
  };

  // ---------------------------------------------------------------- TURKEY --
  const TURK = {
    body: P('M42,-112 C72,-100 80,-70 68,-48 C56,-28 26,-22 -4,-24 C-40,-26 -70,-40 -78,-66 C-84,-92 -62,-120 -26,-124 C0,-126 26,-120 42,-112 Z'),
    neck: P('M40,-112 C46,-126 50,-140 54,-150 L78,-148 C76,-132 72,-116 66,-100 C58,-94 46,-100 40,-112 Z'),
    head: P('M48,-156 C48,-172 60,-178 70,-177 C82,-176 90,-166 89,-154 C88,-142 80,-136 68,-136 C56,-137 48,-144 48,-156 Z'),
    beak: P('M86,-161 C94,-161 101,-156 104,-150 C97,-148 91,-147 86,-146 Z'),
    snood: P('M80,-168 C86,-172 91,-167 90,-160 C90,-152 96,-144 95,-136 C94,-129 87,-129 86,-135 C85,-143 81,-152 78,-160 Z'),
    wattle: P('M72,-144 C82,-144 86,-134 82,-124 C78,-114 70,-108 63,-114 C58,-120 62,-128 64,-136 C66,-141 68,-144 72,-144 Z'),
    wing: P('M36,-94 C6,-104 -38,-98 -62,-78 C-74,-64 -70,-46 -56,-42 C-30,-36 6,-42 26,-56 C42,-66 46,-84 36,-94 Z'),
  };
  ANIMAL_ART.turkey = t => {
    const puff = 1 + Math.sin(t * 1.4) * 0.012, bob = Math.sin(t * 2.1) * 1.4, wob = Math.sin(t * 3.3) * 0.12;
    const CX = -22, CY = -102, R = 96;
    // legs (behind everything but the fan)
    // the big fanned tail: banded feathers, side ones first, middle on top
    ctx.save(); ctx.translate(CX, CY); ctx.scale(puff, puff); ctx.translate(-CX, -CY);
    const fanFill = rad(CX, CY, R, [[0, '#6a4024'], [0.5, '#8a5630'], [0.66, '#9a6236'], [0.665, '#2e1c18'], [0.77, '#2e1c18'], [0.775, '#a8683a'], [0.83, '#b8743e'], [0.835, '#2e1c18'], [0.87, '#2e1c18'], [0.875, '#f0dcae'], [1, '#e4c48c']]);
    const N = 13, a0 = -PI - 0.12, a1 = -0.28;
    const order = [...Array(N).keys()].sort((i, j) => Math.abs(j - (N - 1) / 2) - Math.abs(i - (N - 1) / 2));
    for (const i of order) {
      const a = a0 + (a1 - a0) * i / (N - 1);
      const p = xf(paddle(R, 34), CX, CY, a);
      inkP(p, fanFill, 2.2);
      line(xf(P(`M14,0 L${R * 0.86},0`), CX, CY, a), 'rgba(250,230,190,.35)', 1.5);
    }
    // a row of shorter bronze coverts at the base of the fan
    for (let i = 0; i < 9; i++) {
      const a = -PI + 0.1 + (PI - 0.5) * i / 8;
      inkP(xf(paddle(54, 26), CX, CY + 6, a), lin(CX, CY, CX + Math.cos(a) * 56, CY + Math.sin(a) * 56, '#4a3020', '#7a4a28', '#c08850'), 2);
    }
    ctx.restore();
    // legs
    birdLeg([[-14, -30], [-16, -16], [-18, -6]], '#c98078', 7); claws(-18, -6, '#c98078', 5, 0.9);
    birdLeg([[16, -30], [18, -16], [20, -6]], '#e09a90', 7.5);
    // body, neck, head, snood and wattle as one mass
    const hy = bob;
    const HS = 1.15, H = p => xf(xf(p, -68, 140), 68, -140 + hy, 0, HS);
    const headOn = () => { ctx.translate(68, -140 + hy); ctx.scale(HS, HS); ctx.translate(-68, 140); };
    const sn = H(xf(xf(TURK.snood, -80, 168), 80, -168, wob)), wt = H(xf(xf(TURK.wattle, -72, 144), 72, -144, -wob * 0.6));
    const neck = P(`M38,-112 C46,-126 50,-140 54,${-150 + hy} L78,${-148 + hy} C76,-132 72,-116 66,-100 C58,-94 46,-100 38,-112 Z`);
    mass([[TURK.body, '#4a3020'], [neck, '#e05a5a'], [wt, '#d82a36'], [H(TURK.head), '#8cc4f0'], [sn, '#e0303c']]);
    // iridescent bronze breast feathers: rows of scallops, lower rows first so upper ones overlap
    clipped(TURK.body, () => {
      ctx.fillStyle = lin(0, -124, 0, -24, '#6a4628', '#4a3020', '#2e1e16'); ctx.fillRect(-90, -130, 170, 110);
      for (let row = 9; row >= 0; row--) {
        const y = -122 + row * 11;
        for (let x = -86 + (row % 2) * 8; x < 84; x += 16) {
          ctx.beginPath(); ctx.moveTo(x - 8, y - 10); ctx.lineTo(x - 8, y); ctx.arc(x, y, 8, PI, 0, true); ctx.lineTo(x + 8, y - 10); ctx.closePath();
          const sheen = 0.5 + 0.5 * Math.sin(x * 0.05 + row * 0.9);
          ctx.fillStyle = mix('#5a3a24', '#3a2a1e', row / 10); ctx.fill();
          ctx.beginPath(); ctx.arc(x, y, 6.5, 0.1 * PI, 0.9 * PI);
          ctx.strokeStyle = mix('#d89048', '#6ab08a', sheen * 0.7); ctx.lineWidth = 2.6; ctx.stroke();
          ctx.beginPath(); ctx.arc(x, y + 1, 8, 0.12 * PI, 0.88 * PI); ctx.strokeStyle = '#1e1410'; ctx.lineWidth = 1.2; ctx.stroke();
        }
      }
      glow(-20, -116, 70, 20, '#f0b070', 0.35);
      glow(0, -24, 90, 30, '#140c08', 0.5);
    });
    // drooping wing: barred flight feathers fanned back, bronze coverts with a scalloped edge on top
    for (let i = 0; i < 5; i++) {
      const bx = 30 - i * 3, by = -84 + i * 7, a = PI - 0.12 + i * 0.07, len = 92 - i * 8;
      const p = xf(paddle(len, 20), bx, by, a);
      inkP(p, '#3a2620', 2);
      ctx.save(); ctx.clip(p); ctx.fillStyle = '#f2e6d0';
      for (let k = 0; k < 7; k++) { const d = 22 + k * 10; ctx.save(); ctx.translate(bx + Math.cos(a) * d, by + Math.sin(a) * d); ctx.rotate(a); ctx.fillRect(-2.4, -12, 4.8, 24); ctx.restore(); }
      ctx.restore();
    }
    const cov = new Path2D(); cov.moveTo(48, -98); cov.bezierCurveTo(30, -112, -20, -112, -48, -94);
    for (let k = 0; k < 8; k++) cov.arc(-44 + k * 12.5, -88 + k * 2.6, 7, PI * 1.1, 0.05 * PI, true);
    cov.bezierCurveTo(62, -70, 60, -88, 48, -98); cov.closePath();
    inkP(cov, lin(0, -110, 0, -70, '#9a6438', '#5e3c24'), 2.2);
    clipped(cov, () => { scallopRows(-40, -100, 50, -90, 11, 5.5, 'rgba(240,180,110,.7)', 1.8); glow(-20, -106, 50, 10, '#ffd0a0', 0.4); });
    // black beard tuft hanging from the chest
    const sw = Math.sin(t * 2) * 1.5;
    const beard = P(`M70,-92 C76,-82 ${78 + sw},-68 ${77 + sw * 1.4},-54 C74,-58 72,-56 70,-60 C68,-56 66,-58 66,-62 C66,-74 66,-84 70,-92 Z`);
    inkP(beard, '#2a1a14', 1.4);
    line(P(`M70,-86 C72,-76 ${72 + sw},-66 ${72 + sw},-60`), '#5a4030', 1.2);
    // neck colour: red bumps low, blue toward the face
    clipped(neck, () => { ctx.fillStyle = lin(0, -150, 0, -110, '#8cc4f0', '#e88080', '#d84848'); ctx.fillRect(30, -160, 60, 70);
      ctx.fillStyle = '#c83040'; for (const [x, y] of [[50, -118], [58, -126], [66, -116], [62, -134], [70, -106], [54, -108]]) circle(x, y, 3); });
    ctx.fillStyle = lin(0, -144, 0, -110, '#ee3a44', '#c41e2c'); ctx.fill(wt);
    ctx.save(); headOn();
    ctx.fillStyle = rad(72, -166, 32, [[0, '#c8e6ff'], [0.6, '#8cc4f0'], [1, '#5a9ad8']]); ctx.fill(TURK.head);
    ctx.fillStyle = 'rgba(255,170,170,.7)'; ellipse(70, -128, 4, 3);
    inkP(TURK.beak, lin(86, -160, 102, -148, '#f2dfb0', '#c8a870'), 1.6);
    birdEye(73, -160, 7, t, 2.6);
    ctx.fillStyle = 'rgba(255,140,170,.55)'; ellipse(64, -148, 5, 3);
    ctx.restore();
    // the snood dangles over the beak, on top
    ctx.save(); headOn(); ctx.translate(80, -168); ctx.rotate(wob); ctx.translate(-80, 168);
    inkP(TURK.snood, lin(80, -168, 92, -130, '#ff5a64', '#d8202e'), 1.8);
    ctx.fillStyle = 'rgba(255,200,200,.6)'; ellipse(87, -160, 2, 4, -0.3);
    ctx.restore();
    claws(20, -6, '#e09a90', 5.5);
  };
}
