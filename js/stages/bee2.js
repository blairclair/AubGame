'use strict';
{
  // ===========================================================================
  // Buzzy Bee Meadow becomes the BALLOON FESTIVAL: a sunny field full of hot-air balloons, puffing
  // up on the grass and drifting across the sky, with striped tents, bunting and picnics.
  // The chief pilot is Gusty the Goose, in a leather flying cap with goggles and a red scarf.
  //   game 1 (action) Picnic Drop: fly Aubrey's hot-air balloon. Hold to fire the burner and rise,
  //            let go to cool and sink. Every height has its own wind, so you steer by changing
  //            height! Drop honey jars on little parachutes onto the picnic that is waiting.
  //            Tier 2+: three winds and a flock of geese to dodge. Tier 3: smaller blankets, more drift.
  //   game 2 (learn) Mirror Balloons: symmetry. Each new balloon has its left side painted. Drag
  //            paint onto the right side so it is the mirror twin of the left (in a mirror, things
  //            flip!). Finished balloons fire their burners and float off to join the festival.
  // ===========================================================================
  const FRIEND = 'Gusty the Goose';
  const TWO_PI = Math.PI * 2;
  const say = (g, s) => { g.say = s; speak(s); };
  // outline every shape first, then fill them all, so overlapping parts read as one shape
  const inkAll = (items, lw, line = OL) => {
    ctx.strokeStyle = line; ctx.lineWidth = lw * 2;
    for (const [p] of items) ctx.stroke(p);
    for (const [p, f] of items) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const bubble = (x, y, str, col = '#5a2a6e', size = 17) => {
    ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(str).width + 26, h = size + 19;
    const bx = clamp(x, w / 2 + 8, W - w / 2 - 8);
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(bx - w / 2 - 2.5, y - h / 2 - 2.5, w + 5, h + 5, 20); ctx.fill(); tri(x - 10, y + h / 2 - 2, x + 10, y + h / 2 - 2, x + 2, y + h / 2 + 14);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(bx - w / 2, y - h / 2, w, h, 18); ctx.fill(); tri(x - 7, y + h / 2 - 4, x + 7, y + h / 2 - 4, x + 2, y + h / 2 + 10);
    text(str, bx, y, size, col, 'center', 700);
  };

  // =============================================================================================
  // hot-air balloons: one shape kit shared by the backdrop and both games
  // =============================================================================================
  // half-width of the envelope (in units of r) at height v (-1 = the crown, 1 = the mouth)
  const halfW = v => (v <= 0 ? Math.sqrt(Math.max(0, 1 - v * v)) : 1 - 0.68 * Math.pow(Math.min(1, v), 1.6));
  // the i-th of n gore seams across the envelope; bend > 0 makes the outer gores narrower, like a sphere
  const gu = (i, n, bend = 0.6) => lerp(-1 + 2 * i / n, Math.sin(-Math.PI / 2 + Math.PI * i / n), bend);
  // a patch of the envelope between seams u0..u1 (across) and heights v0..v1 (down)
  function envPath(cx, cy, r, u0 = -1, u1 = 1, v0 = -1, v1 = 1) {
    const p = new Path2D(), N = 26;
    for (let i = 0; i <= N; i++) { const v = lerp(v0, v1, i / N); p.lineTo(cx + u1 * halfW(v) * r, cy + v * r); }
    for (let i = N; i >= 0; i--) { const v = lerp(v0, v1, i / N); p.lineTo(cx + u0 * halfW(v) * r, cy + v * r); }
    p.closePath();
    return p;
  }
  const RIG = { skirt: 1.1, burner: 1.42, top: 1.72, bot: 2.04, bw: 0.6 };
  // pat: { c: gore colours, n: gores, band, zig, cap, hearts }  or  { cell(i, j), cols, rows, uB, vB } for painting
  // o: { flame 0..1, rider(cx, basketBottom), noBasket }
  function drawHAB(cx, cy, r, pat, o = {}) {
    const t = S.t, lw = Math.max(0.9, r * 0.022);
    const sk = cy + RIG.skirt * r, bt = cy + RIG.top * r, bb = cy + RIG.bot * r, bw = RIG.bw * r;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (!o.noBasket) {
      // ropes from the mouth down to the basket
      ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.2, r * 0.03);
      for (const k of [-1, -0.4, 0.4, 1]) { ctx.beginPath(); ctx.moveTo(cx + k * 0.27 * r, sk - 1); ctx.lineTo(cx + k * bw * 0.46, bt); ctx.stroke(); }
      // the burner flame roaring up into the mouth
      const fl = o.flame || 0;
      if (fl > 0.02) {
        const fy = cy + RIG.burner * r, fh = r * (0.35 + 0.5 * fl) * (1 + 0.12 * Math.sin(t * 37) + 0.08 * Math.sin(t * 23)), fw = r * 0.13;
        const gr = ctx.createRadialGradient(cx, fy - fh * 0.5, 1, cx, fy - fh * 0.5, fh * 1.1);
        gr.addColorStop(0, `rgba(255,220,120,${0.55 * fl})`); gr.addColorStop(1, 'rgba(255,200,90,0)');
        ctx.fillStyle = gr; circle(cx, fy - fh * 0.5, fh * 1.1);
        ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(cx - fw, fy); ctx.quadraticCurveTo(cx - fw * 1.3, fy - fh * 0.5, cx + Math.sin(t * 19) * fw * 0.4, fy - fh); ctx.quadraticCurveTo(cx + fw * 1.3, fy - fh * 0.5, cx + fw, fy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffe36b'; ctx.beginPath(); ctx.moveTo(cx - fw * 0.5, fy); ctx.quadraticCurveTo(cx - fw * 0.6, fy - fh * 0.35, cx, fy - fh * 0.62); ctx.quadraticCurveTo(cx + fw * 0.6, fy - fh * 0.35, cx + fw * 0.5, fy); ctx.closePath(); ctx.fill();
      }
      // burner frame
      inkRect(cx - r * 0.13, cy + RIG.burner * r, r * 0.26, r * 0.09, '#9a9ab4', Math.max(1, lw * 1.4), 2);
      if (o.rider) o.rider(cx, bb, bt);
      // the wicker basket
      const bp = P2(`M${cx - bw / 2},${bt} L${cx + bw / 2},${bt} L${cx + bw * 0.43},${bb} C${cx + bw * 0.2},${bb + r * 0.03} ${cx - bw * 0.2},${bb + r * 0.03} ${cx - bw * 0.43},${bb} Z`);
      ink(bp, '#d8984a', lw * 1.2);
      ctx.save(); ctx.clip(bp);
      ctx.strokeStyle = 'rgba(140,80,30,.55)'; ctx.lineWidth = Math.max(1, r * 0.018);
      for (let k = 1; k < 4; k++) { const yy = bt + (bb - bt) * k / 4; ctx.beginPath(); ctx.moveTo(cx - bw, yy); ctx.lineTo(cx + bw, yy); ctx.stroke(); }
      for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(cx + k * bw * 0.14, bt); ctx.lineTo(cx + k * bw * 0.12, bb); ctx.stroke(); }
      ctx.restore();
      inkRect(cx - bw / 2 - r * 0.03, bt - r * 0.05, bw + r * 0.06, r * 0.09, '#9a5a2a', Math.max(1, lw * 1.4), Math.max(1, r * 0.03));
    }
    // the skirt round the mouth
    ink(P2(`M${cx - 0.33 * r},${cy + 0.97 * r} L${cx + 0.33 * r},${cy + 0.97 * r} L${cx + 0.27 * r},${sk} L${cx - 0.27 * r},${sk} Z`), pat.skirt || '#f0dcb8', lw);
    // the envelope: outline first, then the gores or painted cells
    const env = envPath(cx, cy, r);
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2.4; ctx.stroke(env);
    if (pat.cell) {
      for (let j = 0; j < pat.rows; j++) for (let i = 0; i < pat.cols; i++) {
        ctx.fillStyle = pat.cell(i, j) || '#f4f0f8';
        ctx.fill(envPath(cx, cy, r, pat.uB[i], pat.uB[i + 1], pat.vB[j], pat.vB[j + 1]));
      }
    } else {
      const n = pat.n || 8;
      for (let i = 0; i < n; i++) { ctx.fillStyle = pat.c[i % pat.c.length]; ctx.fill(envPath(cx, cy, r, gu(i, n), gu(i + 1, n))); }
      if (pat.cap) { ctx.fillStyle = pat.cap; ctx.fill(envPath(cx, cy, r, -1, 1, -1, -0.74)); }
      if (pat.band) { ctx.fillStyle = pat.band; ctx.fill(envPath(cx, cy, r, -1, 1, 0.3, 0.5)); }
      if (pat.zig) {
        ctx.save(); ctx.clip(env); ctx.fillStyle = pat.zig;
        const y0 = cy + 0.06 * r, h = 0.2 * r, step = r * 0.26;
        ctx.beginPath(); ctx.moveTo(cx - r, y0 + h);
        for (let x = -r, k = 0; x <= r + step; x += step / 2, k++) ctx.lineTo(cx + x, k % 2 ? y0 : y0 + h);
        ctx.lineTo(cx + r * 1.2, y0 + h + 6); ctx.lineTo(cx - r, y0 + h + 6); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      if (pat.hearts) for (const k of [-0.5, 0, 0.5]) heart(cx + k * r * 0.95, cy - 0.12 * r, r * 0.34 * (k ? 0.8 : 1), pat.hearts);
      // seams
      if (r > 14) {
        ctx.strokeStyle = 'rgba(60,30,80,.22)'; ctx.lineWidth = Math.max(0.8, r * 0.012);
        for (let i = 1; i < n; i++) { const u = gu(i, n); ctx.beginPath(); for (let k = 0; k <= 20; k++) { const v = -1 + 2 * k / 20; ctx.lineTo(cx + u * halfW(v) * r, cy + v * r); } ctx.stroke(); }
      }
    }
    // round, shiny shading
    ctx.save(); ctx.clip(env);
    const hl = ctx.createRadialGradient(cx - r * 0.42, cy - r * 0.45, r * 0.05, cx - r * 0.42, cy - r * 0.45, r * 0.85);
    hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const sh = ctx.createLinearGradient(cx, 0, cx + r, 0);
    sh.addColorStop(0, 'rgba(50,20,80,0)'); sh.addColorStop(1, 'rgba(50,20,80,.22)');
    ctx.fillStyle = sh; ctx.fillRect(cx, cy - r, r, r * 2.1);
    ctx.restore();
    ctx.restore();
  }
  const PAT = {
    sunny: { c: ['#ff5f7e', '#ffd83a'], n: 8 },
    sky: { c: ['#40b0ff', '#ffffff'], n: 10, band: '#ff5f7e' },
    berry: { c: ['#9c6cff', '#ff8ad0', '#ffd83a'], n: 9, cap: '#5adc7a' },
    lime: { c: ['#5adc7a', '#ffa040'], n: 8, zig: '#ffffff' },
    rainbow: { c: ['#ff5f7e', '#ffa040', '#ffd83a', '#5adc7a', '#40b0ff', '#9c6cff'], n: 12, band: '#ffffff', hearts: '#ff5f9a' },
    candy: { c: ['#ffffff', '#ff8ad0'], n: 10, zig: '#40b0ff', cap: '#ffd83a' },
  };

  // --- Gusty the Goose: a leather flying cap with goggles, and a toy hot-air balloon on a string --
  CR_HATS.bee2aviator = (r, L, sp, t) => {
    const cap = P2(`M${-r * 0.82},${r * 0.28} C${-r * 0.9},${-r * 0.7} ${r * 0.9},${-r * 0.7} ${r * 0.82},${r * 0.28} C${r * 0.4},${r * 0.12} ${-r * 0.4},${r * 0.12} ${-r * 0.82},${r * 0.28} Z`);
    const flapL = P2(`M${-r * 0.82},${r * 0.1} C${-r * 0.98},${r * 0.4} ${-r * 0.9},${r * 0.75} ${-r * 0.62},${r * 0.7} L${-r * 0.55},${r * 0.2} Z`);
    const strap = P2(`M${-r * 0.62},${-r * 0.12} C${-r * 0.2},${-r * 0.3} ${r * 0.2},${-r * 0.3} ${r * 0.66},${-r * 0.12} L${r * 0.66},${r * 0.02} C${r * 0.2},${-r * 0.16} ${-r * 0.2},${-r * 0.16} ${-r * 0.62},${r * 0.02} Z`);
    inkAll([[flapL, '#9a5a2a'], [cap, '#b8743a']], 1.1, L);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(-r * 0.3, -r * 0.32, r * 0.22, r * 0.08, -0.4);
    ink(strap, '#5a3a2a', 0.9, L);
    // goggles pushed up on the cap
    for (const gx of [-r * 0.12, r * 0.36]) {
      inkCircle(gx, -r * 0.08, r * 0.2, '#e8b830', 1, L);
      inkCircle(gx, -r * 0.08, r * 0.14, '#9ae0ff', 0.6, L);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(gx - r * 0.05, -r * 0.13, r * 0.04 + Math.sin(t * 2) * 0.5);
    }
  };
  CR_HOLD.bee2toyballoon = (L, t) => {
    const bx = 46 + Math.sin(t * 1.4) * 5, by = -84 + Math.sin(t * 1.9) * 4;
    ctx.strokeStyle = 'rgba(70,50,90,.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -30, bx, by + 2.04 * 17); ctx.stroke();
    drawHAB(bx, by, 17, PAT.rainbow, {});
  };
  CHARACTERS[FRIEND] = {
    col: '#c4c8d8', belly: '#ffffff', face: '#eef0f6', bw: 40, bh: 62, hr: 32, neck: 30, hx: 24, ears: 'none', nose: 'beak', beakCol: '#ff9a3a',
    mouth: 'none', eyes: 'big', iris: '#3a5ab0', arms: 'wing', feet: 'webbed', feetCol: '#ff9a3a', hat: 'bee2aviator', hatTilt: -0.08,
    neckwear: 'scarf', scarfCol: '#ff4a5a', hold: 'bee2toyballoon', tail: 'feathers', shape: 'pear', blush: true, seed: 4.1,
  };

  // =============================================================================================
  // festival props
  // =============================================================================================
  function drawTent(x, gy, w, h, a, b) {
    // a striped festival tent with a pennant on top
    const n = 6, top = gy - h, eave = gy - h * 0.55;
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top - 26); ctx.stroke();
    ink(P2(`M${x},${top - 26} L${x + 22},${top - 19} L${x},${top - 12} Z`), '#ff5f7e', 1);
    const body = P2(`M${x - w * 0.42},${eave} L${x + w * 0.42},${eave} L${x + w * 0.42},${gy} L${x - w * 0.42},${gy} Z`);
    const roof = P2(`M${x},${top} C${x + w * 0.2},${eave - h * 0.12} ${x + w * 0.4},${eave - 4} ${x + w * 0.52},${eave + 6} L${x - w * 0.52},${eave + 6} C${x - w * 0.4},${eave - 4} ${x - w * 0.2},${eave - h * 0.12} ${x},${top} Z`);
    inkAll([[body, a], [roof, a]], 1.3);
    ctx.save(); ctx.clip(body); ctx.fillStyle = b;
    for (let i = 0; i < n; i++) if (i % 2) ctx.fillRect(x - w * 0.42 + i * w * 0.84 / n, eave, w * 0.84 / n, h);
    ctx.restore();
    ctx.save(); ctx.clip(roof); ctx.fillStyle = b;
    for (let i = 0; i < n; i++) if (i % 2) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x - w * 0.52 + i * w * 1.04 / n, eave + 8); ctx.lineTo(x - w * 0.52 + (i + 1) * w * 1.04 / n, eave + 8); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // scalloped valance and a dark doorway
    for (let i = 0; i < 7; i++) inkCircle(x - w * 0.45 + i * w * 0.15, eave + 6, w * 0.075, i % 2 ? a : b, 0.8);
    ctx.fillStyle = '#4a2a5a'; ctx.beginPath(); ctx.moveTo(x - w * 0.14, gy); ctx.quadraticCurveTo(x, eave + 10, x + w * 0.14, gy); ctx.closePath(); ctx.fill();
  }
  function drawWindsock(x, gy, t) {
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - 150); ctx.stroke();
    ctx.strokeStyle = '#e8e4f0'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.translate(x, gy - 146); ctx.rotate(0.14 + Math.sin(t * 2.2) * 0.07);
    const sock = P2(`M0,-12 L64,-6 C66,-2 66,2 64,6 L0,12 Z`);
    ink(sock, '#ffffff', 1.2);
    ctx.save(); ctx.clip(sock); ctx.fillStyle = '#ff6a3a';
    for (let k = 0; k < 4; k += 2) ctx.fillRect(k * 16 + Math.sin(t * 6 + k) * 1.5, -14, 16, 28);
    ctx.restore();
    ctx.restore();
  }
  function drawPicnicBlanket(x, y, rx, ry, c1 = '#ff5f6a') {
    ctx.save();
    const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, TWO_PI);
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.stroke(p); ctx.fillStyle = '#ffffff'; ctx.fill(p);
    ctx.clip(p); ctx.fillStyle = c1; ctx.globalAlpha = 0.85;
    const s = rx / 4;
    for (let i = -5; i <= 5; i++) ctx.fillRect(x + i * s * 2 - s / 2, y - ry, s, ry * 2);
    for (let j = -3; j <= 3; j++) ctx.fillRect(x - rx, y + j * ry * 0.6 - ry * 0.15, rx * 2, ry * 0.3);
    ctx.restore();
  }
  function honeyJar(x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkAll([[P2('M-11,-14 L11,-14 C16,-6 15,10 0,11 C-15,10 -16,-6 -11,-14 Z'), '#ffb428'], [P2('M-12,-20 L12,-20 L12,-13 L-12,-13 Z'), '#ff6fae']], 1.1);
    ctx.fillStyle = '#ffd86a'; ellipse(-4, -3, 4, 6, 0.2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-7, -1, 14, 6); ctx.fillStyle = '#c06a10'; ctx.font = `800 6px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('HONEY', 0, 2.5);
    ctx.restore();
  }
  function bunting(x0, y0, x1, y1, sag, n, ph) {
    ctx.strokeStyle = 'rgba(80,60,100,.8)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1); ctx.stroke();
    const cols = ['#ff5f7e', '#ffd83a', '#40b0ff', '#5adc7a', '#9c6cff', '#ffa040'];
    for (let i = 1; i < n; i++) {
      const k = i / n, fx = lerp(x0, x1, k), fy = lerp(y0, y1, k) + sag * 4 * k * (1 - k);
      const sw = Math.sin(S.t * 3 + i + ph) * 2;
      ctx.fillStyle = OL; tri(fx - 9, fy - 1, fx + 9, fy - 1, fx + sw, fy + 19);
      ctx.fillStyle = cols[(i + ph) % cols.length]; tri(fx - 7, fy, fx + 7, fy, fx + sw, fy + 16);
    }
  }
  function grassTuft(x, y, s, col = '#5ab84a') {
    ctx.strokeStyle = col; ctx.lineWidth = 2.5 * s; ctx.lineCap = 'round';
    for (const a of [-0.5, -0.15, 0.2, 0.55]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + a * 10 * s, y - 8 * s, x + a * 18 * s, y - 14 * s); ctx.stroke(); }
  }

  // =============================================================================================
  // the backdrop
  // =============================================================================================
  const FAR = [[130, 156, 22, 'sunny', 7], [338, 108, 16, 'berry', 5], [612, 132, 27, 'sky', 6], [770, 96, 14, 'lime', 4], [905, 214, 19, 'candy', 8], [40, 262, 12, 'sky', 3], [566, 238, 11, 'sunny', 5], [250, 215, 9, 'lime', 4]];
  BACKDROPS.balloonfest_bee2 = () => {
    const t = S.t;
    bdSky('#55b8ff', '#ffe6c6');
    bdSunburst(872, 122);
    bdClouds(4, 'rgba(255,255,255,.85)', 96);
    // far lavender mountains with snowy tops
    ctx.fillStyle = '#c4b4ec'; ctx.beginPath(); ctx.moveTo(0, 360);
    for (const [x, y] of [[90, 270], [190, 320], [300, 250], [430, 330], [560, 262], [690, 318], [800, 258], [960, 330]]) ctx.lineTo(x, y);
    ctx.lineTo(W, 380); ctx.lineTo(0, 380); ctx.fill();
    ctx.fillStyle = '#f4f0ff';
    for (const [x, y] of [[90, 270], [300, 250], [560, 262], [800, 258]]) { ctx.beginPath(); ctx.moveTo(x - 22, y + 20); ctx.lineTo(x, y); ctx.lineTo(x + 22, y + 18); ctx.lineTo(x + 8, y + 14); ctx.lineTo(x - 4, y + 22); ctx.closePath(); ctx.fill(); }
    // balloons drifting far away (the furthest ones behind the hills)
    for (const [x0, y0, r, p, s] of FAR) {
      const x = ((x0 + t * s) % (W + 120)) - 60, y = y0 + Math.sin(t * 0.8 + x0) * 5;
      ctx.globalAlpha = r < 13 ? 0.75 : 1;
      drawHAB(x, y, r, PAT[p], { flame: Math.sin(t * 1.3 + x0) > 0.85 ? 0.8 : 0 });
      ctx.globalAlpha = 1;
    }
    bdHills('#a8dc8c', 360, 18, 0.007, 1);
    // little tents and trees along the far hill
    for (const [x, c1, c2] of [[60, '#ffd83a', '#ff8a3a'], [176, '#9cd0ff', '#ffffff'], [700, '#ffb0d8', '#ffffff'], [868, '#c8a8ff', '#ffd83a']]) drawTent(x, 372, 54, 44, c1, c2);
    for (const x of [120, 760, 930]) { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 3, 344, 6, 26); inkCircle(x, 338, 16, '#5ab85a', 1.2); }
    bdHills('#93d478', 404, 12, 0.012, 3);
    // the grass, with mowed stripes
    const gg = ctx.createLinearGradient(0, GY - 70, 0, H);
    gg.addColorStop(0, '#8ad470'); gg.addColorStop(1, '#5fb84e');
    ctx.fillStyle = gg; ctx.fillRect(0, 404, W, H - 404);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(i * 130 - 40, H); ctx.lineTo(i * 110 + 30, 404); ctx.lineTo(i * 110 + 80, 404); ctx.lineTo(i * 130 + 30, H); ctx.closePath(); if (i % 2) ctx.fill(); }
    // bunting on poles across the field
    for (const x of [150, 395, 565, 805]) { ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, GY - 6); ctx.lineTo(x, 262); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke(); inkCircle(x, 258, 6, '#ffd83a', 1); }
    bunting(150, 268, 395, 268, 12, 9, 0); bunting(565, 268, 805, 268, 12, 9, 3);
    // the big rainbow balloon, tied down and puffing up, in the middle of the field
    const puff = Math.max(0, Math.sin(t * 1.1)) ** 3;
    const cy = GY - 6 - RIG.bot * 80;
    ctx.strokeStyle = 'rgba(80,60,90,.7)'; ctx.lineWidth = 2;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(480 + k * 22, cy + RIG.top * 80); ctx.lineTo(480 + k * 120, GY + 6); ctx.stroke(); inkRect(480 + k * 120 - 3, GY - 2, 6, 12, '#8a5a3a', 1.5, 1); }
    drawHAB(480, cy + Math.sin(t * 1.6) * 2, 80, PAT.rainbow, { flame: puff });
    // a big tent on the left, a striped balloon on the right
    drawTent(78, GY - 2, 150, 150, '#ff5f7e', '#ffffff');
    drawHAB(890, GY - 4 - RIG.bot * 50 + Math.sin(t * 1.3 + 1) * 2, 50, PAT.candy, { flame: Math.max(0, Math.sin(t * 0.9 + 2)) ** 4 });
    drawWindsock(946, GY + 4, t);
    // party balloons tied to the tent
    for (const [dx, c, ph] of [[-62, '#ffd83a', 0], [-48, '#40b0ff', 1], [-74, '#ff8ad0', 2]]) {
      const bx = 78 + dx + Math.sin(t * 1.5 + ph) * 4, by = GY - 180 - ph * 14;
      ctx.strokeStyle = 'rgba(70,50,90,.6)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(78 - 55, GY - 70); ctx.lineTo(bx, by + 16); ctx.stroke();
      inkEllipse(bx, by, 12, 15, 0, c, 1.1); ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(bx - 4, by - 5, 3, 5, 0.3);
    }
    // a picnic in front, with a hamper, honey and flowers
    drawPicnicBlanket(482, GY + 40, 74, 15);
    inkRect(440, GY + 18, 34, 22, '#d8984a', 2, 4); ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(457, GY + 18, 12, Math.PI, 0); ctx.stroke();
    honeyJar(500, GY + 34, 1); honeyJar(522, GY + 38, 0.8);
    // flowers and grass tufts along the front
    for (let i = 0; i < 14; i++) {
      const x = 20 + i * 70 + (i % 3) * 9, y = GY + 52 + (i % 2) * 12;
      if (Math.abs(x - 250) < 50 || Math.abs(x - 720) < 50) continue; // keep Aubrey and the friend's spots clear
      if (i % 2) flower(x, y, 7, ['#ff6fae', '#ffffff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1.2); else grassTuft(x, y + 6, 1);
    }
  };

  // =============================================================================================
  // GAME 1 (action): Picnic Drop
  // =============================================================================================
  const BP = { r: 54, yMin: 112, spots: [228, 356, 484, 612, 740], blanketY: GY + 30, fall: 115 };
  BP.yMax = GY - 2 - RIG.bot * BP.r;
  const BP_DROP = { x: 802, y: 474, w: 146, h: 56 };
  const BP_FAM = [['🐰', '🐰'], ['🦔', '🦔'], ['🐿️', '🐿️'], ['🦊', '🦊'], ['🐻', '🐻']];
  const BP_BLANKET = ['#ff5f6a', '#40a8ff', '#5ac85a', '#a97cff', '#ffa040'];
  const bpBand = (g, y) => { const k = Math.floor((y - BP.yMin) / ((BP.yMax - BP.yMin) / g.bands.length)); return g.bands[clamp(k, 0, g.bands.length - 1)]; };
  const wrapX = x => (x > W + 50 ? x - (W + 100) : x < -50 ? x + W + 100 : x);
  const wrapD = (a, b) => { let d = Math.abs(a - b); return Math.min(d, W + 100 - d); };
  // follow a dropped jar down through the winds to where it lands
  function bpSim(g, x, y, vx, pts) {
    const dt = 1 / 30;
    for (let i = 0; i < 400 && y < BP.blanketY; i++) {
      vx += (bpBand(g, y).v * g.drift - vx) * Math.min(1, dt * 3);
      x = wrapX(x + vx * dt); y += BP.fall * dt;
      if (pts && i % 3 === 0) pts.push([x, y]);
    }
    return x;
  }
  function bpNextPicnic(g) {
    const free = BP.spots.map((_, i) => i).filter(i => !g.fed.includes(i) || g.fed.length >= BP.spots.length);
    let opts = free.filter(i => i !== g.want && wrapD(BP.spots[i], g.x) > 160);
    if (!opts.length) opts = free.filter(i => i !== g.want);
    if (!opts.length) opts = BP.spots.map((_, i) => i).filter(i => i !== g.want);
    g.want = pick(opts); g.wantT = 0;
    const fam = BP_FAM[g.want][0];
    say(g, `The ${{ '🐰': 'bunnies', '🦔': 'hedgehogs', '🐿️': 'squirrels', '🦊': 'foxes', '🐻': 'bears' }[fam]} want honey! Fly over their picnic and drop a jar.`);
  }
  MG.balloonpicnic = {
    kind: 'action',
    title: () => 'Picnic Drop',
    icon: () => '🍯',
    how: () => 'Fly the hot-air balloon! Hold the mouse (or the up arrow) to fire the burner and go UP. Let go to sink. Each height has its own wind, so go up or down to steer! Tap DROP (or press SPACE) to drop honey on the picnic.',
    init(g) {
      const T = g.tier, s = Math.random() < 0.5 ? 1 : -1;
      const winds = [[75, -75], [80, -65, 55], [95, -80, 62]][T - 1];
      g.bands = winds.map((v, i) => ({ v: v * s, i }));
      g.drift = [0.3, 0.45, 0.6][T - 1];
      g.tol = [60, 50, 42][T - 1];
      g.goal = 6; g.jars = g.goal + [4, 3, 3][T - 1];
      g.timeLeft = [100, 90, 85][T - 1];
      Object.assign(g, { x: 120, y: BP.yMax, vx: 0, vy: 0, burning: false, heat: 0, falling: [], fed: [], fedN: 0, want: -1, wantT: 0, cool: 0, endT: 0, wob: 0, geese: [], gooseT: 9, splats: [], hearts: [], roar: 0, bumped: 0 });
      g.progress = `Fed 0 of ${g.goal}  ·  🍯 ${g.jars}`;
    },
    start(g) { bpNextPicnic(g); },
    update(g, dt, id) {
      g.wantT += dt; g.cool -= dt; g.wob = Math.max(0, g.wob - dt);
      g.hearts.forEach(h => (h.t += dt)); g.hearts = g.hearts.filter(h => h.t < 1.4);
      g.splats.forEach(s => (s.t += dt)); g.splats = g.splats.filter(s => s.t < 1.6);
      if (g.endT > 0) { g.endT -= dt; g.heat = Math.max(0, g.heat - dt); if (g.endT <= 0) g.done = true; return; }
      g.timeLeft -= dt;
      // the burner: hold anywhere (except the DROP button) or hold the up arrow
      const overDrop = inRect(BP_DROP);
      g.burning = !!(keys.arrowup || keys.w || (pointer.down && !overDrop && pointer.y > 62));
      g.heat = clamp(g.heat + (g.burning ? dt * 4 : -dt * 3), 0, 1);
      if (g.burning) { g.roar -= dt; if (g.roar <= 0) { g.roar = 0.12; tone(rand(70, 90), 0.16, 'sawtooth', 0.03); } }
      const tv = g.burning ? -100 : 72;
      g.vy += (tv - g.vy) * Math.min(1, dt * 2.2);
      g.y += g.vy * dt;
      if (g.y < BP.yMin) { g.y = BP.yMin; g.vy = Math.max(0, g.vy); }
      if (g.y > BP.yMax) { if (g.vy > 50) SFX.step(); g.y = BP.yMax; g.vy = 0; }
      g.vx += (bpBand(g, g.y).v - g.vx) * Math.min(1, dt * 1.5);
      g.x = wrapX(g.x + g.vx * dt);
      // drop a jar
      if ((id === 'bp_drop' || pressed[' '] || pressed.enter) && g.cool <= 0) {
        if (g.jars > 0) {
          g.jars--; g.cool = 0.5; tone(520, 0.12, 'triangle', 0.07, 0, 300);
          g.falling.push({ x: g.x, y: g.y + RIG.bot * BP.r - 4, vx: g.vx * g.drift, t: 0 });
        } else floatText(g.x, g.y + 80, 'No jars left!', '#ff6a8a', false, 18);
      }
      // falling jars on their parachutes
      for (const j of g.falling) {
        j.t += dt;
        j.vx += (bpBand(g, j.y).v * g.drift - j.vx) * Math.min(1, dt * 3);
        j.x = wrapX(j.x + j.vx * dt); j.y += BP.fall * dt;
        if (j.y >= BP.blanketY) {
          j.gone = true;
          const hit = BP.spots.findIndex(sx => wrapD(sx, j.x) <= g.tol);
          if (!j.knocked && hit === g.want && hit >= 0) {
            g.fedN++; g.fed.push(hit); g.score = Math.min(1, g.fedN / g.goal);
            SFX.sparkle(); burst(BP.spots[hit], BP.blanketY - 10, 22, { kind: 'emoji', colors: ['💖', '🍯', '✨'], spread: 120, up: 120, size: [3, 5] });
            g.hearts.push({ x: BP.spots[hit], t: 0 });
            floatText(BP.spots[hit], BP.blanketY - 60, 'Yum! Thank you!', '#ffffff', false, 22);
            if (g.fedN >= g.goal) { g.endT = 2.6; say(g, 'Every picnic has honey! What a pilot!'); return; }
            bpNextPicnic(g);
          } else {
            g.splats.push({ x: j.x, t: 0 }); SFX.miss();
            if (!j.knocked) {
              if (hit >= 0 && g.fed.includes(hit)) say(g, 'That family has honey already! Find the waving picnic.');
              else say(g, `Missed! Watch the wind. Drop it a little ${((j.x < BP.spots[g.want]) !== (wrapD(j.x, BP.spots[g.want]) > W / 2)) ? 'later' : 'sooner'}.`);
            }
          }
        }
      }
      g.falling = g.falling.filter(j => !j.gone);
      // geese fly across one of the winds (tier 2 and 3): go up or down to dodge them
      if (g.tier >= 2) {
        g.gooseT -= dt;
        if (g.gooseT <= 0) {
          g.gooseT = rand(8, 11) - g.tier;
          const band = bpBand(g, g.y), nb = g.bands.length, bh = (BP.yMax - BP.yMin) / nb;
          const y = BP.yMin + (band.i + 0.5) * bh, dir = Math.random() < 0.5 ? 1 : -1;
          g.geese.push({ x: dir > 0 ? -160 : W + 160, y, dir, warn: 1.3, hitDone: false });
          tone(330, 0.12, 'square', 0.05); tone(300, 0.14, 'square', 0.05, 0.16);
        }
        for (const q of g.geese) {
          if (q.warn > 0) { q.warn -= dt; continue; }
          q.x += q.dir * 170 * dt;
          for (let k = 0; k < 3; k++) {
            const gx = q.x - q.dir * k * 34, gy = q.y + (k ? (k % 2 ? -18 : 18) : 0);
            if (!q.hitDone && Math.hypot(gx - g.x, gy - g.y) < BP.r + 10) {
              q.hitDone = true; g.vy = 150; g.wob = 1; g.bumped++;
              SFX.fail(); floatText(g.x, g.y - 70, 'HONK!', '#ffffff', false, 26);
              if (g.jars > 0) { g.jars--; g.falling.push({ x: g.x + 10, y: g.y + RIG.bot * BP.r - 4, vx: g.vx * 0.5, t: 0, knocked: true }); say(g, 'Honk! The geese bumped a jar out! Go up or down to dodge them.'); }
            }
          }
        }
        g.geese = g.geese.filter(q => q.x > -260 && q.x < W + 260);
      }
      g.score = Math.min(1, g.fedN / g.goal);
      g.progress = `Fed ${g.fedN} of ${g.goal}  ·  🍯 ${g.jars}`;
      if (g.timeLeft <= 0 || (g.jars <= 0 && !g.falling.length)) {
        g.endT = 2; say(g, g.fedN >= 3 ? 'Lovely flying! The picnics are happy.' : 'The balloon is out of honey. Good try!');
      }
    },
    draw(g) {
      const t = S.t, nb = g.bands.length, bh = (BP.yMax - BP.yMin) / nb;
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, GY);
      sky.addColorStop(0, '#5cbcff'); sky.addColorStop(1, '#ffe8cc');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      bdSunburst(880, 130);
      // other festival balloons, far away
      ctx.globalAlpha = 0.55;
      for (const [x0, y0, r, p] of [[90, 330, 13, 'berry'], [400, 300, 10, 'sky'], [690, 320, 15, 'lime'], [900, 290, 9, 'candy']]) drawHAB(((x0 + t * 4) % (W + 60)) - 30, y0 + Math.sin(t + x0) * 4, r, PAT[p], {});
      ctx.globalAlpha = 1;
      // far hills and the festival field
      ctx.fillStyle = '#c4b4ec'; ctx.beginPath(); ctx.moveTo(0, 420);
      for (const [x, y] of [[90, 360], [210, 400], [330, 350], [470, 398], [600, 356], [740, 400], [860, 352], [960, 390]]) ctx.lineTo(x, y);
      ctx.lineTo(W, 440); ctx.lineTo(0, 440); ctx.fill();
      bdHills('#a8dc8c', 432, 10, 0.009, 2);
      // the winds: one stripe per height, with streaks and little clouds blowing its way
      for (const b of g.bands) {
        const y0 = b.i === 0 ? 62 : BP.yMin + b.i * bh, y1 = b.i === nb - 1 ? 420 : BP.yMin + (b.i + 1) * bh;
        const here = bpBand(g, g.y) === b;
        ctx.fillStyle = b.v > 0 ? 'rgba(255,255,255,.13)' : 'rgba(120,90,220,.08)';
        if (here) ctx.fillStyle = b.v > 0 ? 'rgba(255,255,255,.24)' : 'rgba(120,90,220,.15)';
        ctx.fillRect(0, y0, W, y1 - y0);
        if (b.i > 0) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.setLineDash([10, 12]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke(); ctx.setLineDash([]); }
        const ym = BP.yMin + (b.i + 0.5) * bh;
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let k = 0; k < 7; k++) {
          const sx = ((k * 157 + t * b.v * 1.6) % (W + 200) + W + 200) % (W + 200) - 100, sy = ym - bh * 0.32 + (k * 37) % (bh * 0.64);
          const L = 34 + (k % 3) * 14, d = Math.sign(b.v);
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + L * d, sy); ctx.quadraticCurveTo(sx + (L + 10) * d, sy, sx + (L + 10) * d, sy - 7); ctx.stroke();
        }
        for (let k = 0; k < 2; k++) {
          const cx = ((k * 520 + 140 + t * b.v * 0.9) % (W + 240) + W + 240) % (W + 240) - 120, cyy = ym + (k ? 14 : -10);
          ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(cx, cyy, 40, 13); ellipse(cx + 18, cyy - 8, 24, 13); ellipse(cx - 20, cyy + 2, 20, 9);
        }
        // a wind sign on the edge, so you can always see which way this height blows
        const ax = b.v > 0 ? 40 : W - 40;
        rrect(ax - 30, ym - 17, 60, 34, 17, here ? '#ffffff' : 'rgba(255,255,255,.75)', OL, 2.5);
        ctx.save(); ctx.translate(ax, ym); ctx.scale(Math.sign(b.v), 1);
        ink(P2('M-18,-5 L4,-5 L4,-12 L19,0 L4,12 L4,5 L-18,5 Z'), here ? '#ff8a2a' : '#40a8ff', 1.1);
        ctx.restore();
      }
      // the ground and the picnics
      const gg = ctx.createLinearGradient(0, 440, 0, H);
      gg.addColorStop(0, '#8ad470'); gg.addColorStop(1, '#5fb84e');
      ctx.fillStyle = gg; ctx.fillRect(0, 440, W, H - 440);
      for (let i = 0; i < BP.spots.length; i++) {
        const x = BP.spots[i], want = i === g.want && g.endT <= 0, fed = g.fed.includes(i);
        if (want) {
          const pul = 1 + Math.sin(t * 6) * 0.06;
          ctx.strokeStyle = 'rgba(255,240,120,.9)'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
          ctx.beginPath(); ctx.ellipse(x, BP.blanketY, g.tol * pul, 20 * pul, 0, 0, TWO_PI); ctx.stroke(); ctx.setLineDash([]);
        }
        drawPicnicBlanket(x, BP.blanketY, 50, 14, BP_BLANKET[i]);
        const [a] = BP_FAM[i], hop = want ? Math.abs(Math.sin(t * 7)) * 8 : 0;
        emoji(a, x - 22, BP.blanketY - 14 - hop, 30); emoji(a, x + 22, BP.blanketY - 10 - (want ? Math.abs(Math.sin(t * 7 + 1.5)) * 8 : 0), 22);
        if (fed) { honeyJar(x + 2, BP.blanketY - 2, 0.9); }
        if (want) {
          const ay = BP.blanketY - 66 + Math.sin(t * 5) * 5;
          ink(P2(`M${x - 9},${ay - 16} L${x + 9},${ay - 16} L${x + 9},${ay} L${x + 17},${ay} L${x},${ay + 16} L${x - 17},${ay} L${x - 9},${ay} Z`), '#ffd83a', 1.3);
        }
      }
      for (const h of g.hearts) { ctx.globalAlpha = 1 - h.t / 1.4; heart(h.x, BP.blanketY - 50 - h.t * 40, 26, '#ff5f9a'); ctx.globalAlpha = 1; }
      for (const s of g.splats) {
        ctx.globalAlpha = 1 - s.t / 1.6; ctx.fillStyle = '#ffb428'; ellipse(s.x, BP.blanketY + 4, 18, 6); circle(s.x - 14, BP.blanketY - 2, 4); circle(s.x + 15, BP.blanketY, 3);
        honeyJar(s.x, BP.blanketY - 4, 0.8); ctx.globalAlpha = 1;
      }
      // where the jar will land: the whole path at tier 1, a guide line at tier 2
      if (g.endT <= 0 && g.tier <= 2) {
        const sy = g.y + RIG.bot * BP.r;
        if (g.tier === 1) {
          const pts = [], lx = bpSim(g, g.x, sy, g.vx * g.drift, pts);
          ctx.fillStyle = 'rgba(255,255,255,.85)';
          for (const [px, py] of pts) circle(px, py, 2.6);
          const good = g.want >= 0 && wrapD(lx, BP.spots[g.want]) <= g.tol;
          ctx.strokeStyle = good ? '#5adc7a' : 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(lx, BP.blanketY, 16, 6, 0, 0, TWO_PI); ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
          ctx.beginPath(); ctx.moveTo(g.x, sy + 4); ctx.lineTo(g.x, BP.blanketY - 10); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      // falling honey on parachutes
      for (const j of g.falling) {
        const sw = Math.sin(j.t * 4) * 0.15;
        ctx.save(); ctx.translate(j.x, j.y); ctx.rotate(sw);
        ctx.strokeStyle = 'rgba(70,50,90,.8)'; ctx.lineWidth = 1.2;
        for (const k of [-16, 0, 16]) { ctx.beginPath(); ctx.moveTo(k, -30); ctx.lineTo(k * 0.3, -14); ctx.stroke(); }
        ink(P2('M-20,-30 C-20,-54 20,-54 20,-30 C14,-34 8,-34 0,-30 C-8,-34 -14,-34 -20,-30 Z'), j.knocked ? '#c8c8d8' : '#ffffff', 1.1);
        ctx.fillStyle = '#ff5f7e'; ctx.beginPath(); ctx.moveTo(-6, -48); ctx.quadraticCurveTo(0, -52, 6, -48); ctx.lineTo(4, -33); ctx.lineTo(-4, -33); ctx.closePath(); ctx.fill();
        honeyJar(0, -2, 0.8);
        ctx.restore();
      }
      // geese
      for (const q of g.geese) {
        if (q.warn > 0) {
          const ex = q.dir > 0 ? 30 : W - 30;
          if (Math.sin(t * 16) > -0.3) { inkCircle(ex, q.y, 18, '#ffea5a', 1.2); text('!', ex, q.y + 1, 24, '#c0302a', 'center', 900); }
          continue;
        }
        for (let k = 0; k < 3; k++) {
          const gx = q.x - q.dir * k * 34, gy = q.y + (k ? (k % 2 ? -18 : 18) : 0), fl = Math.sin(t * 12 + k) * 0.6;
          ctx.save(); ctx.translate(gx, gy); ctx.scale(q.dir, 1);
          inkAll([[P2('M-16,0 C-12,-9 8,-9 12,-3 L22,-10 C26,-11 28,-8 26,-6 L16,2 C10,8 -10,8 -16,0 Z'), '#eef0f6']], 1.1);
          ctx.fillStyle = '#ff9a3a'; tri(26, -9, 33, -7, 26, -5);
          ctx.fillStyle = OL; circle(23, -8, 1.6);
          ctx.save(); ctx.rotate(fl); ink(P2('M-6,-2 C-12,-20 4,-26 6,-4 Z'), '#c4c8d8', 1); ctx.restore();
          ctx.restore();
        }
      }
      // Aubrey's balloon
      const bx = g.x + (g.wob ? Math.sin(g.wob * 30) * 6 * g.wob : 0);
      const drawB = x => drawHAB(x, g.y, BP.r, PAT.sunny, { flame: g.heat, rider: (cx, bb) => drawAubrey(cx, bb - 3, 'idle_front', 1, 0, 0.25) });
      drawB(bx);
      if (bx > W - 60) drawB(bx - (W + 100)); else if (bx < 60) drawB(bx + W + 100);
      // the burner hint and the DROP button
      const hb = { x: 10, y: 474, w: 158, h: 56 };
      rrect(hb.x, hb.y, hb.w, hb.h, 16, g.burning ? '#ff8a2a' : 'rgba(48,24,72,.7)', 'rgba(255,255,255,.85)', 2.5);
      emoji('🔥', hb.x + 28, hb.y + 28, g.burning ? 30 + Math.sin(t * 30) * 2 : 24);
      text(g.burning ? 'Going UP!' : 'Hold = UP', hb.x + 50, hb.y + 20, 16, '#fff', 'left', 800);
      text('let go = sink', hb.x + 50, hb.y + 40, 13, 'rgba(255,255,255,.85)', 'left', 600);
      button('bp_drop', BP_DROP.x, BP_DROP.y, BP_DROP.w, BP_DROP.h, 'DROP', { icon: '🍯', color: g.jars > 0 ? '#ff8a2a' : '#b9aac4', size: 20, key: 'Space' });
      if (g.endT > 0 && g.fedN >= g.goal) outlined('All the picnics have honey!', W / 2, 100, 32, '#ffe36b', 'center', '#5a2a6e');
    },
  };

  // =============================================================================================
  // GAME 2 (learn): Mirror Balloons (symmetry)
  // =============================================================================================
  const BM = { cx: 468, cy: 212, r: 116 };
  const PAINTS = [['red', '#ff5a5a'], ['yellow', '#ffd83a'], ['blue', '#40a8ff'], ['green', '#5adc7a'], ['purple', '#a97cff']];
  const potXY = (g, k) => [866, 112 + k * (g.ncol > 4 ? 76 : 88)];
  function bmCellPath(g, i, j, cy = BM.cy) { return envPath(BM.cx, cy, BM.r, g.uB[i], g.uB[i + 1], g.vB[j], g.vB[j + 1]); }
  function bmCentre(g, i, j, cy = BM.cy) {
    const v = lerp((g.vB[j] + g.vB[j + 1]) / 2, g.vB[j + 1], g.vB[j] < -0.9 ? 0.35 : 0), u = (g.uB[i] + g.uB[i + 1]) / 2;
    return [BM.cx + u * halfW(v) * BM.r, cy + v * BM.r];
  }
  // which right-hand cell is under (x, y)?
  function bmCellAt(g, x, y) {
    const v = (y - BM.cy) / BM.r;
    if (v < -1 || v > 1.06) return null;
    const hw = halfW(clamp(v, -1, 1));
    if (hw < 0.04) return null;
    let u = (x - BM.cx) / (hw * BM.r);
    if (u < -0.02 || u > 1.25) return null;
    u = clamp(u, 0, 0.999);
    let i = g.cols / 2; while (i < g.cols - 1 && u >= g.uB[i + 1]) i++;
    let j = 0; while (j < g.rows - 1 && v >= g.vB[j + 1]) j++;
    return { i, j };
  }
  function bmNew(g) {
    const C = g.cols, R = g.rows, half = C / 2, k = g.ncol;
    g.target = []; g.paint = [];
    for (let j = 0; j < R; j++) {
      let left;
      do {
        left = [];
        for (let i = 0; i < half; i++) { let c; do c = randInt(0, k - 1); while (i > 0 && c === left[i - 1]); left.push(c); }
      } while (left[0] === left[half - 1] || (j > 0 && left.join() === g.target[j - 1].slice(0, half).join()));
      g.target.push([...left, ...[...left].reverse()]);
      g.paint.push(g.target[j].map((c, i) => (i < half ? c : null)));
    }
    // tier 3: a couple of right-hand cells come already painted
    if (g.tier === 3) for (let n = 0; n < 2; n++) { const j = randInt(0, R - 1), i = randInt(half, C - 1); g.paint[j][i] = g.target[j][i]; }
    g.missed = g.paint.map(r => r.map(() => false));
    g.need = g.paint.reduce((s, r) => s + r.filter(c => c === null).length, 0);
    g.total += g.need;
    g.cur = bmFirstEmpty(g);
    g.enterT = 0; g.flyT = 0;
    say(g, g.ri === 0 ? 'Paint the right side so it matches the left side, like a mirror!' : `Balloon ${g.ri + 1}! Make both sides match, like a mirror.`);
  }
  const bmEmpties = g => { const out = []; for (let j = 0; j < g.rows; j++) for (let i = g.cols / 2; i < g.cols; i++) if (g.paint[j][i] === null) out.push({ i, j }); return out; };
  const bmFirstEmpty = g => bmEmpties(g)[0] || null;
  function bmPaint(g, cell, c) {
    if (!cell || g.paint[cell.j][cell.i] !== null || g.flyT > 0) return;
    const want = g.target[cell.j][cell.i], [x, y] = bmCentre(g, cell.i, cell.j);
    g.brushT = 0.35;
    if (c === want) {
      g.paint[cell.j][cell.i] = c;
      if (!g.missed[cell.j][cell.i]) g.good++;
      tone(523 + bmEmpties(g).length * 40, 0.12, 'triangle', 0.08); SFX.pop();
      burst(x, y, 12, { colors: [PAINTS[c][1], '#ffffff'] });
      g.cur = bmFirstEmpty(g);
      if (!g.cur) {
        g.flyT = 0.001; SFX.sparkle();
        say(g, pick(['Perfect! Both sides match, like a mirror! Up, up and away!', 'Symmetry! The two halves are mirror twins. Off it goes!', 'Beautiful! It is the same on both sides. Whoosh!']));
      }
    } else {
      g.missed[cell.j][cell.i] = true; g.wrong = { ...cell, c, t: 1 };
      SFX.miss();
      const twin = g.cols - 1 - cell.i, shifted = cell.i - g.cols / 2;
      const isShift = g.target[cell.j][shifted] === c && twin !== shifted;
      say(g, isShift ? 'Oops! In a mirror things FLIP. Look at its mirror twin: the glowing one, the same distance from the line.'
        : `Not ${PAINTS[c][0]}. Look at its mirror twin on the other side. The glowing one!`);
      g.twinT = 2.2; g.twinOf = cell;
    }
  }
  MG.balloonmirror = {
    kind: 'learn',
    title: () => 'Mirror Balloons',
    icon: () => '🎈',
    how: () => 'A festival balloon looks the same on both sides, like a mirror. That is SYMMETRY! Drag paint onto the right side so each piece matches its mirror twin on the left.',
    init(g) {
      const T = g.tier;
      g.cols = [6, 6, 8][T - 1]; g.rows = [1, 2, 2][T - 1]; g.ncol = [3, 4, 5][T - 1];
      g.uB = Array.from({ length: g.cols + 1 }, (_, i) => gu(i, g.cols, 0.3));
      g.vB = { 1: [-1, 1], 2: [-1, -0.08, 1] }[g.rows];
      g.rounds = 3; g.ri = 0; g.good = 0; g.total = 0;
      g.sel = 0; g.drag = null; g.wrong = null; g.twinT = 0; g.twinOf = null; g.brushT = 0; g.endT = 0; g.flown = [];
      g.progress = `Balloon 1 of ${g.rounds}`;
      bmNew(g); g.total = g.need; g.enterT = 1;
    },
    start(g) { say(g, g.say); },
    update(g, dt, id) {
      g.enterT = Math.min(1, g.enterT + dt * 1.4);
      g.twinT = Math.max(0, g.twinT - dt); g.brushT = Math.max(0, g.brushT - dt);
      if (g.wrong) { g.wrong.t -= dt * 0.8; if (g.wrong.t <= 0) g.wrong = null; }
      g.score = g.total ? g.good / g.total : 0;
      // finished balloons rise away, then the next one floats in
      if (g.endT > 0) { g.endT -= dt; if (g.endT <= 0) g.done = true; return; }
      if (g.flyT > 0) {
        g.flyT += dt;
        if (g.flyT > 2.3) {
          g.flown.push({ target: g.target.map(r => [...r]), x: [250, 690, 120][g.ri % 3], t0: S.t });
          g.ri++;
          if (g.ri >= g.rounds) { g.endT = 1.6; g.flyT = 0; g.score = g.good / g.total; say(g, 'Three mirror balloons! You are a symmetry star!'); return; }
          g.progress = `Balloon ${g.ri + 1} of ${g.rounds}`;
          bmNew(g);
        }
        return;
      }
      if (g.enterT < 1) return;
      // pick a colour: number keys or a paint pot
      for (let k = 0; k < g.ncol; k++) if (pressed[String(k + 1)]) { g.sel = k; SFX.click(); }
      // keyboard painting: arrows choose a piece, space or enter paints it
      const em = bmEmpties(g);
      if (em.length && (pressed.arrowleft || pressed.arrowright || pressed.arrowup || pressed.arrowdown)) {
        const ix = Math.max(0, em.findIndex(c => g.cur && c.i === g.cur.i && c.j === g.cur.j));
        g.cur = em[(ix + (pressed.arrowleft || pressed.arrowup ? em.length - 1 : 1)) % em.length]; SFX.blip();
      }
      if ((pressed[' '] || pressed.enter) && g.cur) bmPaint(g, g.cur, g.sel);
      g.hover = bmCellAt(g, pointer.x, pointer.y);
      if (pointer.clicked && !id) {
        let hitPot = -1;
        for (let k = 0; k < g.ncol; k++) { const [px, py] = potXY(g, k); if (Math.hypot(pointer.x - px, pointer.y - py) < 38) hitPot = k; }
        if (hitPot >= 0) { g.sel = hitPot; g.drag = { c: hitPot, x0: pointer.x, y0: pointer.y, moved: false }; SFX.click(); }
        else if (g.hover && g.paint[g.hover.j][g.hover.i] === null) bmPaint(g, g.hover, g.sel);
      }
      if (g.drag) {
        if (Math.hypot(pointer.x - g.drag.x0, pointer.y - g.drag.y0) > 14) g.drag.moved = true;
        if (!pointer.down) {
          if (g.drag.moved) { const c = bmCellAt(g, pointer.x, pointer.y); if (c) bmPaint(g, c, g.drag.c); }
          g.drag = null;
        }
      }
      if (g.hover && g.paint[g.hover.j][g.hover.i] === null) g.cur = g.hover;
    },
    draw(g) {
      const t = S.t;
      // a calm festival sky so the balloon stands out
      const sky = ctx.createLinearGradient(0, 0, 0, GY);
      sky.addColorStop(0, '#7cccff'); sky.addColorStop(1, '#fff0dc');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      bdClouds(3, 'rgba(255,255,255,.8)', 120);
      // balloons you already painted, floating in the distance
      for (const f of g.flown) {
        const x = f.x + Math.sin((t - f.t0) * 0.5) * 20, y = 150 + Math.sin((t - f.t0) * 0.9) * 8;
        drawHAB(x, y, 34, { cell: (i, j) => PAINTS[f.target[j][i]][1], cols: g.cols, rows: g.rows, uB: g.uB, vB: g.vB }, { flame: 0 });
      }
      ctx.globalAlpha = 0.5;
      for (const [x0, y0, r, p] of [[60, 300, 14, 'berry'], [300, 250, 10, 'sky'], [640, 330, 12, 'lime'], [760, 470, 0, 'sky']]) if (r) drawHAB(((x0 + t * 5) % (W + 60)) - 30, y0 + Math.sin(t + x0) * 4, r, PAT[p], {});
      ctx.globalAlpha = 1;
      bdHills('#a8dc8c', 420, 14, 0.008, 1);
      for (const [x, c1, c2] of [[60, '#ffd83a', '#ff8a3a'], [300, '#9cd0ff', '#ffffff'], [650, '#ffb0d8', '#ffffff']]) drawTent(x, 428, 54, 44, c1, c2);
      bunting(20, 70, 330, 74, 14, 10, 1);
      const gg = ctx.createLinearGradient(0, 430, 0, H);
      gg.addColorStop(0, '#8ad470'); gg.addColorStop(1, '#5fb84e');
      ctx.fillStyle = gg; ctx.fillRect(0, 440, W, H - 440);
      for (let i = 0; i < 12; i++) { const x = 270 + i * 46 + (i % 3) * 7, y = 470 + (i % 2) * 40 + (i % 3) * 8; if (i % 2) flower(x, y, 7, ['#ff6fae', '#ffffff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1.2); else grassTuft(x, y + 6, 1); }
      // the balloon being painted (it rises away when it's done, and the next one floats up)
      const rise = g.flyT > 0 ? Math.pow(Math.max(0, g.flyT - 0.5), 2) * 160 : 0;
      const cy = BM.cy + (1 - easeOut(g.enterT)) * 420 - rise;
      const active = g.flyT <= 0 && g.endT <= 0;
      // the tether ropes while on the ground
      if (rise < 5) { ctx.strokeStyle = 'rgba(80,60,90,.6)'; ctx.lineWidth = 2; for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(BM.cx + k * 30, cy + RIG.top * BM.r); ctx.lineTo(BM.cx + k * 130, GY + 30); ctx.stroke(); } }
      drawHAB(BM.cx, cy, BM.r, {
        cell: (i, j) => (g.paint[j][i] === null ? null : PAINTS[g.paint[j][i]][1]),
        cols: g.cols, rows: g.rows, uB: g.uB, vB: g.vB, skirt: '#f0dcb8',
      }, { flame: g.flyT > 0 ? 1 : 0.15 + 0.1 * Math.sin(t * 9) });
      // seams between the pieces, and a '?' on each piece still to paint
      ctx.save(); ctx.clip(envPath(BM.cx, cy, BM.r));
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5;
      for (let i = 1; i < g.cols; i++) { const u = g.uB[i]; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const v = -1 + 2 * k / 30; ctx.lineTo(BM.cx + u * halfW(v) * BM.r, cy + v * BM.r); } ctx.stroke(); }
      for (let j = 1; j < g.rows; j++) { const v = g.vB[j], hw = halfW(v) * BM.r; ctx.beginPath(); ctx.moveTo(BM.cx - hw, cy + v * BM.r); ctx.lineTo(BM.cx + hw, cy + v * BM.r); ctx.stroke(); }
      ctx.restore();
      if (active) {
        for (const c of bmEmpties(g)) {
          const [x, y] = bmCentre(g, c.i, c.j, cy);
          text('?', x, y, 26, 'rgba(120,90,150,.55)', 'center', 900);
        }
        // the piece you're about to paint, and (tiers 1-2, or after a mistake) its mirror twin
        const focus = g.drag && g.drag.moved ? bmCellAt(g, pointer.x, pointer.y) : (g.hover && g.paint[g.hover.j][g.hover.i] === null ? g.hover : g.cur);
        const showTwin = focus && g.paint[focus.j][focus.i] === null && (g.tier <= 2 || g.twinT > 0);
        if (focus && g.paint[focus.j][focus.i] === null) {
          ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.setLineDash([9, 6]); ctx.lineDashOffset = -t * 30;
          ctx.stroke(bmCellPath(g, focus.i, focus.j, cy)); ctx.restore();
        }
        const twinCell = g.twinT > 0 && g.twinOf ? g.twinOf : showTwin ? focus : null;
        if (twinCell) {
          const ti = g.cols - 1 - twinCell.i, glow = 0.6 + 0.4 * Math.sin(t * 8);
          { const tp = bmCellPath(g, ti, twinCell.j, cy); ctx.save(); ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 16; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9; ctx.stroke(tp); ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(255,40,150,${glow})`; ctx.lineWidth = 4; ctx.stroke(tp); ctx.restore(); }
          // a curved arrow from the twin across the mirror line
          const [x0, y0] = bmCentre(g, ti, twinCell.j, cy), [x1, y1] = bmCentre(g, twinCell.i, twinCell.j, cy);
          const my = Math.min(y0, y1) - 30 - Math.abs(x1 - x0) * 0.15;
          ctx.strokeStyle = 'rgba(90,42,110,.85)'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.moveTo(x0, y0 - 12); ctx.quadraticCurveTo((x0 + x1) / 2, my, x1, y1 - 12); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(90,42,110,.85)'; tri(x1 - 7, y1 - 22, x1 + 7, y1 - 22, x1, y1 - 10);
        }
        if (g.wrong) {
          const [x, y] = bmCentre(g, g.wrong.i, g.wrong.j, cy);
          ctx.globalAlpha = clamp(g.wrong.t * 2, 0, 1);
          ctx.fillStyle = PAINTS[g.wrong.c][1]; ctx.save(); ctx.clip(bmCellPath(g, g.wrong.i, g.wrong.j, cy)); ctx.fillRect(BM.cx - BM.r, cy - BM.r + (1 - g.wrong.t) * 120, BM.r * 2, BM.r * 2); ctx.restore();
          inkCircle(x, y, 17, '#ffffff', 1.2); text('✕', x, y + 1, 22, '#e0303a', 'center', 900);
          ctx.globalAlpha = 1;
        }
        // the mirror line
        ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.setLineDash([12, 9]); ctx.shadowColor = 'rgba(60,30,90,.6)'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.moveTo(BM.cx, cy - BM.r - 16); ctx.lineTo(BM.cx, cy + BM.r * 1.02); ctx.stroke(); ctx.restore();
        rrect(BM.cx - 58, cy - BM.r - 26, 116, 22, 11, 'rgba(90,42,110,.85)');
        text('🪞 mirror line', BM.cx, cy - BM.r - 15, 13, '#ffffff', 'center', 700);
      }
      // Aubrey, painting on the left
      drawAubrey(150, GY + 22, g.brushT > 0 ? 'cast' : 'idle_front', 1, 0, 0.66);
      if (active) bubble(150, GY - 180, g.drag ? 'Drop it on a piece!' : 'Match the twins!', '#5a2a6e', 16);
      // the paint pots
      for (let k = 0; k < g.ncol; k++) {
        const [px, py] = potXY(g, k), on = g.sel === k, lift = on ? -6 : 0;
        if (on) { ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(px, py + lift, 40); }
        ink(P2(`M${px - 26},${py - 14 + lift} L${px + 26},${py - 14 + lift} L${px + 22},${py + 26 + lift} C${px + 10},${py + 31 + lift} ${px - 10},${py + 31 + lift} ${px - 22},${py + 26 + lift} Z`), '#e8e4f0', 1.3);
        inkEllipse(px, py - 14 + lift, 26, 9, 0, PAINTS[k][1], 1.3);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(px - 9, py - 16 + lift, 7, 2.5);
        ctx.fillStyle = PAINTS[k][1]; ctx.beginPath(); ctx.moveTo(px - 18, py - 10 + lift); ctx.quadraticCurveTo(px - 20, py + 6 + lift, px - 14, py + 8 + lift); ctx.quadraticCurveTo(px - 10, py + 4 + lift, px - 10, py - 8 + lift); ctx.fill();
        text(String(k + 1), px + 4, py + 10 + lift, 17, '#5a2a6e', 'center', 800);
        text(PAINTS[k][0], px - 52, py + lift, 14, '#5a2a6e', 'right', 700);
      }
      // the paint blob you're dragging
      if (g.drag && g.drag.moved) {
        inkCircle(pointer.x, pointer.y, 18, PAINTS[g.drag.c][1], 1.4);
        ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(pointer.x - 6, pointer.y - 6, 5);
        emoji('🖌️', pointer.x + 20, pointer.y - 18, 26);
      }
      if (g.endT > 0) outlined('Symmetry star!', W / 2, 110, 40, '#ffe36b', 'center', '#5a2a6e');
    },
  };
  const easeOut = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);

  restage('beemeadow', {
    name: 'Balloon Festival', icon: '🎈', bg: 'balloonfest_bee2',
    npc: { name: FRIEND, icon: '🪿' },
    games: [['balloonpicnic', 'honey', {}], ['balloonmirror', 'petal', {}]],
    intro: [
      "*:Whoosh! Giant, rainbow balloons are puffing up all over the field. It's the Balloon Festival!",
      "N:Honk honk! Welcome, welcome! I'm Gusty the Goose, chief balloon pilot. The picnic families are hungry for honey!",
      'N:Hold to fire the burner. Hot air goes UP! Let go and it cools, and down you go. Every height has its own wind, so go up or down to steer.',
      'A:excited:I get to fly a REAL hot-air balloon? Up, up and away!',
    ],
    mid: [
      "N:Splendid flying! Now our new balloons need painting. A festival balloon looks the same on both sides, like a mirror. That's called SYMMETRY!",
      'N:Paint the right side so it is the mirror twin of the left. But watch out: in a mirror, things FLIP!',
      'A:thinking:Mirror twins... the piece next to the line matches the piece next to the line!',
    ],
    outro: [
      "N:Look at them all floating up together! The prettiest sky I've ever seen. Honk!",
      'N:Take some honey from the picnic hamper, and petals from our flower garlands. For your journey!',
      'A:laughing:Thank you, Gusty! That was sky-high fun!',
    ],
  });
}
