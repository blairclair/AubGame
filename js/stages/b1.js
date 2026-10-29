'use strict';
// Batch 1 stages: Buttercup Meadow, Seashell Beach, Pip's Bakery, Kite Hill, Gnome Village,
// Sunny Side Farm. Each gets a new backdrop and two new minigames.
{
  // ---------------------------------------------------------------- shared little helpers
  const CARD_COLS = ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a', '#ff9a3a'];
  const numKey = n => ['1', '2', '3', '4', '5', '6', '7', '8', '9'].slice(0, n).findIndex(k => pressed[k]);
  const pickId = (id, prefix) => (id && id.startsWith(prefix) ? +id.slice(prefix.length) : -1);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  // a static painting cached once into an offscreen canvas the size of the screen
  const still = (key, paint) => blit(sprite(key, W, H, 0, 0, paint), 0, 0);
  const shakeX = (g, i) => (g.shake && g.shake[i] ? Math.sin(g.shake[i] * 50) * 7 : 0);
  const tickShake = (g, dt) => { for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k]; };
  const chime = i => tone(523 * Math.pow(2, (i % 12) / 12), 0.18, 'triangle', 0.08);
  function sway(x, y, h, lean, col, lw = 3) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.2, y - h * 0.55, x + lean, y - h); ctx.stroke();
  }

  // =====================================================================================
  // 1. BUTTERCUP MEADOW
  // =====================================================================================
  // a butterfly facing the viewer; flap 0..1 squeezes the wings
  function drawButterfly(x, y, s, flap, col = '#ff8fc8', col2 = '#ffd84a', rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const k = 0.25 + 0.75 * Math.abs(Math.cos(flap * Math.PI));
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * k, 1);
      const up = P2('M2,-4 C10,-34 44,-40 46,-16 C47,-2 26,4 2,2 Z'), lo = P2('M2,2 C22,4 36,14 30,30 C24,42 6,30 2,8 Z');
      ink(up, col, 2.2); ink(lo, mix(col, '#ffffff', 0.25), 2.2);
      ctx.fillStyle = col2; circle(28, -16, 7); circle(18, 18, 5);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(36, -24, 3);
      ctx.restore();
    }
    inkEllipse(0, 2, 4.5, 17, 0, '#4a2a6a', 1.5);
    ctx.strokeStyle = '#4a2a6a'; ctx.lineWidth = 2;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(d * 6, -26, d * 11, -30); ctx.stroke(); ctx.fillStyle = '#4a2a6a'; circle(d * 11, -30, 2.6); }
    ctx.restore();
  }
  function bee(x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(220,240,255,.85)'; ellipse(-3, -8, 6, 9, -0.4 + Math.sin(S.t * 50) * 0.3); ellipse(4, -8, 6, 9, 0.4 - Math.sin(S.t * 50) * 0.3);
    inkEllipse(0, 0, 10, 7, 0, '#ffd23a', 1.2);
    ctx.fillStyle = '#3a2a2a'; ctx.fillRect(-3, -6, 3, 12); ctx.fillRect(4, -5, 2.5, 10);
    ctx.restore();
  }
  function daisy(x, y, r) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10; ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.45, r * 0.18, a); }
    ctx.fillStyle = '#ffc61a'; circle(x, y, r * 0.3);
  }
  function poppy(x, y, r) { ctx.fillStyle = '#ff4a4a'; for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.4; circle(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.6); } ctx.fillStyle = '#2a1a2a'; circle(x, y, r * 0.25); }
  function lavender(x, y, h) {
    sway(x, y, h, 2, '#5aa04a', 2);
    ctx.fillStyle = '#9a6ae0'; for (let i = 0; i < 6; i++) ellipse(x + 1.5, y - h + i * 4, 3, 2.4);
  }
  function meadowStatic() {
    bdSky('#4cc2ff', '#eafcff');
    const R = rng(11);
    // far hills with a line of little trees
    bdHills('#bfe9a4', 262, 22, 0.006, 1);
    for (const [x, h, t] of [[200, 92, 1], [262, 70, 0], [470, 84, 2], [610, 100, 0], [700, 76, 1], [900, 96, 2]]) drawTree(x, 270, h, 26, t, 0);
    bdHills('#a7e08c', 300, 16, 0.009, 3);
    // patches of colour where the wildflowers grow thick
    for (let i = 0; i < 26; i++) {
      const x = R() * W, y = 300 + R() * 60, c = ['#ffb3d9', '#fff08a', '#d8b8ff', '#ffffff', '#ffc08a'][i % 5];
      ctx.fillStyle = c; ctx.globalAlpha = 0.55; ellipse(x, y, 40 + R() * 40, 6 + R() * 5); ctx.globalAlpha = 1;
      ctx.fillStyle = mix(c, '#ff5fa0', 0.3); for (let k = 0; k < 8; k++) circle(x + (R() - 0.5) * 70, y + (R() - 0.5) * 8, 1.6);
    }
    const mg = ctx.createLinearGradient(0, 320, 0, H);
    mg.addColorStop(0, '#8fdc72'); mg.addColorStop(1, '#6cc457');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 338 + Math.sin(x * 0.012) * 8);
    ctx.lineTo(W, H); ctx.fill();
    // the big old oak and a birdhouse post
    drawTree(78, 436, 330, 84, 0, 0);
    inkRect(850, 330, 10, 110, '#a0683a', 2, 2);
    inkRect(828, 296, 54, 44, '#ffb0c8', 2.5, 4);
    ink(P2('M820,300 L855,270 L890,300 Z'), '#7a5ac8', 2.5);
    inkCircle(855, 318, 8, '#4a2a3a', 1.5);
    inkRect(850, 328, 10, 4, '#a0683a', 1, 1);
    // rustic fence at the back right
    for (let x = 640; x < 960; x += 44) inkRect(x, 352, 9, 54, '#d8b080', 1.8, 2);
    ctx.fillStyle = '#c99a68'; ctx.fillRect(630, 364, 330, 6); ctx.fillRect(630, 386, 330, 6);
    // drifts of wildflowers through the middle of the meadow
    for (let i = 0; i < 170; i++) {
      const x = R() * W, y = 350 + R() * 92, sz = 3 + (y - 350) / 18 + R() * 2, k = i % 6;
      grassBlades(x - 4, x + 4, y + 4, R, ['#5ab44a', '#4aa03e'], 4, 10, 0.5);
      if (k === 0) daisy(x, y, sz); else if (k === 1) poppy(x, y, sz * 0.8); else if (k === 2) lavender(x, y + 6, sz * 3);
      else tinyFlower(x, y, sz * 0.8, ['#ffd23a', '#ff8fc8', '#ffffff', '#c6a2ff'][k - 2] || '#ffd23a');
    }
    // the near grass where everyone stands: soft and walkable, just a sprinkle of buttercups
    const ng = ctx.createLinearGradient(0, 440, 0, H);
    ng.addColorStop(0, '#7fd064'); ng.addColorStop(1, '#68bf52');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 446);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 442 + Math.sin(x * 0.05) * 3);
    ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#8ad870'; for (let i = 0; i < 50; i++) ellipse(R() * W, 455 + R() * 85, 12, 3);
    for (let i = 0; i < 26; i++) tinyFlower(R() * W, 452 + R() * 86, 4, ['#ffd23a', '#ffffff', '#ff9ac8'][i % 3]);
    grassBlades(0, W, 446, R, ['#5ab44a', '#4fa83f', '#76c95a'], 4, 12, 0.35);
  }
  BACKDROPS.meadow_bg = () => {
    still('b1_meadow', meadowStatic);
    bdSunburst(846, 112);
    bdClouds(4, 'rgba(255,255,255,.92)', 82);
    // tall foreground flowers nodding in the breeze at the edges
    for (const [x, h, c, ph] of [[18, 150, '#ff6fae', 0], [44, 116, '#ffd23a', 1], [930, 140, '#c6a2ff', 2], [904, 104, '#ff9a5a', 3], [952, 96, '#ffffff', 4]]) {
      const lean = Math.sin(S.t * 1.4 + ph) * 8;
      sway(x, H, h, lean, '#3f9a3a', 3.5);
      ctx.fillStyle = '#4fae4a'; ellipse(x + lean * 0.3 - 8, H - h * 0.45, 10, 4, -0.5);
      flower(x + lean, H - h, 14, c, '#ffd84a', 1.5);
    }
    // butterflies and bees on their rounds, seeds drifting
    [[300, 200, 0, '#ff8fc8'], [620, 250, 2, '#8ad4ff'], [520, 380, 4, '#ffd84a'], [160, 330, 5, '#c6a2ff']].forEach(([x, y, ph, c]) =>
      drawButterfly(x + Math.sin(S.t * 0.5 + ph) * 90, y + Math.sin(S.t * 1.7 + ph) * 26, 0.34, S.t * 3 + ph, c, '#fff6a8'));
    bee(420 + Math.sin(S.t * 0.9) * 120, 330 + Math.sin(S.t * 3.1) * 14, 0.9);
    bee(760 + Math.sin(S.t * 1.2 + 2) * 70, 400 + Math.sin(S.t * 2.6) * 12, 0.8);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 9; i++) {
      const x = ((i * 157 + S.t * 22) % (W + 40)) - 20, y = 120 + (i * 53) % 220 + Math.sin(S.t * 2 + i) * 10;
      circle(x, y, 2.2); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 7); ctx.stroke();
    }
  };

  // --- little plant pieces (also used by the gnome village) ----------------------------
  function leafShape(x, y, rx, ry, rot, col = '#5ac85a') {
    inkEllipse(x, y, rx, ry, rot, col, 1.8);
    ctx.strokeStyle = mix(col, '#1a4a1a', 0.35); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(rot) * rx * 0.9, y - Math.sin(rot) * rx * 0.9); ctx.lineTo(x + Math.cos(rot) * rx * 0.9, y + Math.sin(rot) * rx * 0.9); ctx.stroke();
  }
  function stem(x, y0, y1, leaves) {
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.strokeStyle = '#4fae4a'; ctx.lineWidth = 4; ctx.stroke();
    for (const [ly, d] of leaves) leafShape(x + d * 16, ly, 16, 7, d * -0.5, '#5ac85a');
  }
  // --- butterfly life cycle: live every stage of a monarch's life, then a chicken's, and close each circle ----
  const BC_TOP = 122;                       // the play area starts under the prompt strip
  const BC_CYC = [
    { name: 'Butterfly', who: 'a monarch butterfly', steps: [['egg', 'Egg', '#f0a030'], ['eat', 'Caterpillar', '#4fb04a'], ['spin', 'Chrysalis', '#26a888'], ['emerge', 'Butterfly', '#ff7a1a']],
      loop: 'Egg, caterpillar, chrysalis, butterfly. Then the butterfly lays a new egg, and round it goes again. That is a life cycle!' },
    { name: 'Chicken', who: 'a chicken', steps: [['warm', 'Egg', '#d08a3a'], ['hatch', 'Hatching', '#f0a030'], ['chick', 'Chick', '#d8a800'], ['hen', 'Hen', '#e0503a']],
      loop: 'Egg, hatching, chick, hen. Then the hen lays a new egg, and round it goes again. That is a life cycle too!' },
  ];
  const BC_LOSS = 0.05;                     // score lost per mistake
  const bcT = (g, a) => a[g.tier - 1];      // pick a value by tier
  const bcLocal = (x, y, rot, px, py) => { const dx = px - x, dy = py - y, c = Math.cos(rot), s = Math.sin(rot); return [dx * c + dy * s, -dx * s + dy * c]; };
  const bcWorld = (x, y, rot, lx, ly) => [x + lx * Math.cos(rot) - ly * Math.sin(rot), y + lx * Math.sin(rot) + ly * Math.cos(rot)];
  const bcC = (x, y, rx, ry = rx, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
  // outline every shape first, then fill them, so overlapping parts read as one body
  function bcInk(list, lw = 2.2) {
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.lineJoin = 'round';
    for (const [p] of list) ctx.stroke(p);
    for (const [p, f] of list) { ctx.fillStyle = f; ctx.fill(p); }
  }
  function bcLeafP(len, wid) {
    const p = new Path2D(); p.moveTo(0, 0);
    p.bezierCurveTo(len * 0.25, -wid * 1.3, len * 0.75, -wid * 1.1, len, 0);
    p.bezierCurveTo(len * 0.75, wid * 1.1, len * 0.25, wid * 1.3, 0, 0); p.closePath(); return p;
  }
  // a milkweed leaf growing from its stalk end (x, y); turn 0..1 rolls it over to the pale, fuzzy underside
  function bcLeaf(x, y, len, wid, rot, turn = 0, col = '#4fb84a') {
    const k = Math.cos(turn * Math.PI), under = k < 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, Math.max(0.08, Math.abs(k)));
    ink(bcLeafP(len, wid), under ? '#b9de92' : col, 2);
    ctx.strokeStyle = under ? '#eaf8d6' : mix(col, '#eaffd0', 0.5); ctx.lineCap = 'round';
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(len * 0.93, 0); ctx.stroke();
    ctx.lineWidth = 1.6;
    for (let i = 1; i < 6; i++) {
      const vx = len * i / 6.6, w = wid * 0.8 * Math.sin((i / 6.6 + 0.12) * Math.PI);
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(vx, 0); ctx.quadraticCurveTo(vx + len * 0.07, d * w * 0.55, vx + len * 0.15, d * w); ctx.stroke(); }
    }
    if (under) { ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 16; i++) circle(len * (0.12 + (i * 0.37) % 0.78), wid * (((i * 0.61) % 1.1) - 0.55), 1.4); }
    ctx.restore();
  }
  // the monarch's egg: a tiny cream football with ridges down its sides
  function bcTinyEgg(x, y, s) {
    inkEllipse(x, y, 5 * s, 7.5 * s, 0, '#fff4c4', Math.max(1, s * 0.45));
    ctx.strokeStyle = 'rgba(190,150,80,.75)'; ctx.lineWidth = Math.max(1, s * 0.45);
    for (const d of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.moveTo(x + d * 4 * s, y - 6.5 * s); ctx.quadraticCurveTo(x + d * 7 * s, y, x + d * 4.5 * s, y + 6.8 * s); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(x - 2 * s, y - 2.5 * s, 1.2 * s, 2.4 * s);
  }
  // a monarch from the front; wing 0..1 unfolds crumpled wings, wet 0..1 makes them dark and shiny
  const BC_UPW = P2('M2,-4 C10,-38 48,-46 52,-20 C54,-6 30,4 2,2 Z'), BC_LOW = P2('M2,2 C24,4 40,14 33,32 C27,45 6,33 2,8 Z');
  function bcMonarch(x, y, s, flap, rot = 0, wing = 1, wet = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const k = 0.22 + 0.78 * Math.abs(Math.cos(flap * Math.PI));
    const orange = mix('#ff8a1a', '#b85a20', wet * 0.6);
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * k * (0.3 + 0.7 * wing), 0.42 + 0.58 * wing);
      if (wing < 1) ctx.rotate((1 - wing) * 0.6);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke(BC_UPW); ctx.stroke(BC_LOW);
      ctx.fillStyle = '#2a1622'; ctx.fill(BC_UPW); ctx.fill(BC_LOW);
      for (const [p, cx, cy] of [[BC_UPW, 22, -18], [BC_LOW, 16, 16]]) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(0.74, 0.72); ctx.translate(-cx, -cy); ctx.fillStyle = orange; ctx.fill(p); ctx.restore();
      }
      ctx.strokeStyle = '#2a1622'; ctx.lineWidth = 1.6;
      for (const [ex, ey] of [[46, -30], [36, -37], [24, -37], [44, -16]]) { ctx.beginPath(); ctx.moveTo(4, -2); ctx.quadraticCurveTo((4 + ex) / 2, ey * 0.35, ex, ey); ctx.stroke(); }
      for (const [ex, ey] of [[29, 28], [19, 33], [33, 16]]) { ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(ex, ey); ctx.stroke(); }
      ctx.fillStyle = '#fff';
      for (const [dx, dy] of [[50, -22], [49, -30], [43, -38], [33, -42], [22, -41], [35, 33], [27, 40], [37, 22]]) circle(dx, dy, 1.6);
      ctx.restore();
    }
    bcInk([[bcC(0, 4, 4.6, 18), '#2a1622'], [bcC(0, -14, 5.6), '#2a1622']], 1.4);
    ctx.fillStyle = '#fff'; for (const dy of [0, 8]) { circle(-1.6, dy, 1.1); circle(1.6, dy + 3, 1.1); }
    ctx.strokeStyle = '#2a1622'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 2, -18); ctx.quadraticCurveTo(d * 7, -30, d * 12, -34); ctx.stroke(); ctx.fillStyle = '#2a1622'; circle(d * 12, -34, 2.6); }
    if (wet > 0.02) { ctx.globalAlpha = wet * 0.7; ctx.fillStyle = '#ffffff'; for (const d of [-1, 1]) { ellipse(d * 24 * k * (0.3 + 0.7 * wing), -16, 3, 9, d * 0.5); circle(d * 18 * k, 18, 2.5); } ctx.globalAlpha = 1; }
    ctx.restore();
  }
  // follow a trail back from the head to place the body segments
  function bcBody(trail, n, gap, dir, hx, hy) {
    const pts = [[hx, hy]]; let need = gap, px = hx, py = hy;
    for (let i = trail.length - 1; i >= 0 && pts.length < n; i--) {
      const [tx, ty] = trail[i]; let d = Math.hypot(tx - px, ty - py);
      while (d >= need && pts.length < n) { const f = need / d; px += (tx - px) * f; py += (ty - py) * f; pts.push([px, py]); d = Math.hypot(tx - px, ty - py); need = gap; }
      need -= d; px = tx; py = ty;
    }
    while (pts.length < n) { const l = pts[pts.length - 1]; pts.push([l[0] - Math.cos(dir) * gap, l[1] - Math.sin(dir) * gap]); }
    return pts;
  }
  // a monarch caterpillar: yellow, black and white bands, black feelers at both ends; pts[0] is the head
  function bcCaterpillar(pts, r, chew = 0, alpha = 1) {
    const n = pts.length; if (n < 2) return;
    const rs = pts.map((p, i) => r * (i === 0 ? 1 : 1 - (i / n) * 0.3));
    ctx.save(); ctx.globalAlpha = alpha;
    const feelers = (p, q, len, wig) => {
      const a = Math.atan2(p[1] - q[1], p[0] - q[0]);
      ctx.strokeStyle = '#231a28'; ctx.lineWidth = Math.max(2, r * 0.2); ctx.lineCap = 'round';
      for (const d of [-0.55, 0.55]) {
        const ex = p[0] + Math.cos(a + d) * len, ey = p[1] + Math.sin(a + d) * len;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo((p[0] + ex) / 2 + Math.sin(S.t * 5 + d) * wig, (p[1] + ey) / 2 - len * 0.25, ex, ey); ctx.stroke();
      }
    };
    feelers(pts[0], pts[1], r * 1.9, 3); feelers(pts[n - 1], pts[n - 2], r * 1.4, 2);
    ctx.fillStyle = OL; for (let i = 0; i < n; i++) circle(pts[i][0], pts[i][1], rs[i] + Math.max(2.4, r * 0.16));
    for (let i = n - 1; i >= 1; i--) {
      ctx.fillStyle = ['#ffd23a', '#2a2030', '#f8f6ec'][i % 3]; circle(pts[i][0], pts[i][1], rs[i]);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(pts[i][0] - rs[i] * 0.3, pts[i][1] - rs[i] * 0.35, rs[i] * 0.3);
    }
    const [hx, hy] = pts[0], a = Math.atan2(hy - pts[1][1], hx - pts[1][0]);
    ctx.fillStyle = '#2a2030'; circle(hx, hy, r);
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = r * 0.18;
    ctx.beginPath(); ctx.arc(hx, hy, r * 0.62, a - 1.1, a + 1.1); ctx.stroke();
    const ex = hx + Math.cos(a) * r * 0.35, ey = hy + Math.sin(a) * r * 0.35;
    for (const d of [-1, 1]) {
      const ox = ex + Math.cos(a + d * 1.4) * r * 0.42, oy = ey + Math.sin(a + d * 1.4) * r * 0.42;
      ctx.fillStyle = '#fff'; circle(ox, oy, r * 0.24); ctx.fillStyle = '#231a28'; circle(ox + Math.cos(a) * r * 0.08, oy + Math.sin(a) * r * 0.08, r * 0.12);
    }
    if (chew > 0) { ctx.fillStyle = '#ff9ab0'; circle(hx + Math.cos(a) * r * 0.85, hy + Math.sin(a) * r * 0.85, r * (0.14 + 0.12 * Math.abs(Math.sin(S.t * 30)))); }
    ctx.restore();
  }
  // a chrysalis hanging from (x, top); clear 0..1 shows the folded orange wings, empty draws the split shell
  const BC_CHRYS = P2('M0,10 C26,18 32,58 22,86 C16,104 6,112 0,114 C-6,112 -16,104 -22,86 C-32,58 -26,18 0,10 Z');
  function bcChrysalis(x, top, s, { col = '#5ad6a0', clear = 0, wob = 0, cracks = 0, gold = 1, empty = false } = {}) {
    ctx.save(); ctx.translate(x, top); ctx.rotate(wob); ctx.scale(s, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 14); ctx.stroke();
    ctx.strokeStyle = '#2a2030'; ctx.lineWidth = 2.5; ctx.stroke();
    if (empty) {
      ctx.globalAlpha = 0.75; ink(BC_CHRYS, 'rgba(235,245,240,.85)', 1.6); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(-9, 50, 4, 16, 0.1);
      ctx.restore(); return;
    }
    ink(BC_CHRYS, mix(col, '#2c2030', clear * 0.7), 2);
    if (clear > 0) {
      ctx.save(); ctx.clip(BC_CHRYS); ctx.globalAlpha = clear;
      for (const d of [-1, 1]) {
        ctx.save(); ctx.scale(d, 1);
        ink(P2('M2,24 C-20,36 -24,78 -6,104 L4,100 C-6,78 -6,46 6,30 Z'), '#ff8a1a', 1.2);
        ctx.strokeStyle = '#2a1622'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(-12, 70); ctx.moveTo(-2, 40); ctx.lineTo(-4, 92); ctx.stroke();
        ctx.fillStyle = '#fff'; for (const dy of [44, 62, 80]) circle(-17, dy, 1.6);
        ctx.restore();
      }
      ctx.restore();
    }
    if (gold > 0) {
      ctx.globalAlpha = gold; ctx.fillStyle = '#ffd23a';
      for (let i = 0; i < 9; i++) { const f = i / 8; circle(-20 + f * 40, 38 + Math.sin(f * Math.PI) * 6, 2.2); }
      ctx.strokeStyle = '#2a2030'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-20, 40); ctx.quadraticCurveTo(0, 50, 20, 40); ctx.stroke();
      for (const [dx, dy] of [[-12, 22], [12, 22], [-8, 98], [8, 98], [0, 104]]) circle(dx, dy, 2.4);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-10, 60, 4, 18, 0.1);
    ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2.5;
    for (let i = 0; i < cracks; i++) { const y0 = 92 - i * 16; ctx.beginPath(); ctx.moveTo(-14, y0); ctx.lineTo(-5, y0 - 7); ctx.lineTo(2, y0 + 2); ctx.lineTo(10, y0 - 6); ctx.lineTo(15, y0); ctx.stroke(); }
    ctx.restore();
  }
  function bcBranch(y) {
    ctx.strokeStyle = OL; ctx.lineWidth = 20; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-20, y + 14); ctx.quadraticCurveTo(480, y - 16, W + 20, y + 10); ctx.stroke();
    ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 15; ctx.stroke();
    ctx.strokeStyle = '#c08850'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, y + 8); ctx.quadraticCurveTo(480, y - 22, W - 40, y + 2); ctx.stroke();
    for (const [x, d, r] of [[150, 1, 0.5], [300, -1, 2.6], [690, 1, 0.4], [840, -1, 2.7]]) bcLeaf(x, y + d * 4, 90, 26, r, 0, '#4fb84a');
  }
  function bcMilkFlowers(x, y, r) {
    ctx.fillStyle = OL; circle(x, y, r + 2);
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4, d = r * 0.75 * Math.sqrt((i + 0.5) / 16);
      flower(x + Math.cos(a) * d, y + Math.sin(a) * d - 2, r * 0.32, i % 3 ? '#ff8ac0' : '#ffb0d6', '#fff0f6', 1);
    }
  }
  // --- the chicken's things ---
  function bcEggPath(rx, ry) {
    const p = new Path2D(); p.moveTo(0, -ry);
    p.bezierCurveTo(rx * 0.72, -ry, rx, -ry * 0.2, rx, ry * 0.25); p.bezierCurveTo(rx, ry * 0.78, rx * 0.56, ry, 0, ry);
    p.bezierCurveTo(-rx * 0.56, ry, -rx, ry * 0.78, -rx, ry * 0.25); p.bezierCurveTo(-rx, -ry * 0.2, -rx * 0.72, -ry, 0, -ry);
    p.closePath(); return p;
  }
  // a hen's egg; roll turns it (a little heart drawn on one side shows it turning)
  function bcHenEgg(x, y, rx, ry, tilt = 0, roll = null) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    const p = bcEggPath(rx, ry); ink(p, '#f4e2c6', 2.2);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(160,110,60,.25)'; for (let i = 0; i < 12; i++) circle(Math.sin(i * 2.3) * rx * 0.7, Math.cos(i * 1.7) * ry * 0.7, 1.6 + (i % 3));
    ctx.fillStyle = 'rgba(190,140,90,.25)'; ellipse(rx * 0.25, ry * 0.4, rx * 0.8, ry * 0.6);
    if (roll !== null && Math.cos(roll) > 0) { ctx.save(); ctx.translate(Math.sin(roll) * rx * 0.62, 0); ctx.scale(Math.cos(roll), 1); heart(0, -ry * 0.14, rx * 0.5, '#ff6fa0'); ctx.restore(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ellipse(-rx * 0.4, -ry * 0.45, rx * 0.12, ry * 0.2, 0.3);
    ctx.restore();
  }
  function bcNestBack(x, y, w) { inkEllipse(x, y, w / 2, w * 0.2, 0, '#c99a50', 2); ctx.fillStyle = '#8a6030'; ellipse(x, y - 2, w * 0.4, w * 0.13); }
  function bcNestFront(x, y, w) {
    const p = new Path2D(); p.ellipse(x, y, w / 2, w * 0.2, 0, 0, Math.PI); p.ellipse(x, y + w * 0.06, w * 0.42, w * 0.12, 0, Math.PI, 0, true); p.closePath();
    ink(p, '#e0b860', 2);
    ctx.strokeStyle = '#a87a30'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const f = i / 15, a = 0.15 + f * (Math.PI - 0.3), sx = x + Math.cos(a) * w * 0.46, sy = y + Math.sin(a) * w * 0.16; ctx.beginPath(); ctx.moveTo(sx - 12, sy - 4 + (i % 3) * 2); ctx.lineTo(sx + 12, sy + 3 - (i % 2) * 4); ctx.stroke(); }
  }
  function bcStraw(x, y, rot = 0, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    bcInk([[bcC(0, 0, 40, 15), '#f0cc60']], 2);
    ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const yy = -11 + i * 2.8; ctx.beginPath(); ctx.moveTo(-36 + (i % 3) * 3, yy); ctx.lineTo(36 - (i % 2) * 5, yy + 1); ctx.stroke(); }
    ctx.strokeStyle = '#ffeaa0'; for (const [a, b] of [[-46, -6], [44, 4], [-42, 8], [46, -8]]) { ctx.beginPath(); ctx.moveTo(a * 0.75, b * 0.8); ctx.lineTo(a, b); ctx.stroke(); }
    inkRect(-5, -16, 10, 32, '#e05a5a', 1.2, 3);
    ctx.restore();
  }
  // a hen standing at (x, y) feet; sit 0..1 settles her down, peck 0..1 dips her head
  function bcHen(x, y, s, dir = 1, sit = 0, peck = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const by = -50 + sit * 26, hx = 32 + peck * 16, hy = by - 36 + peck * 34;
    if (sit < 0.95) {
      ctx.globalAlpha = 1 - sit; ctx.lineCap = 'round';
      for (const d of [-9, 9]) {
        ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(d, -24); ctx.lineTo(d + 2, 0); ctx.lineTo(d + 12, 2); ctx.stroke();
        ctx.strokeStyle = '#ffb030'; ctx.lineWidth = 3.5; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    const tail = P2(`M-34,${by - 6} C-64,${by - 58} -76,${by - 30} -68,${by - 12} C-62,${by} -48,${by + 12} -30,${by + 14} Z`);
    const comb = new Path2D(); for (const [cx, cy, r] of [[-8, -14, 6], [0, -17, 7], [8, -14, 6]]) comb.ellipse(hx + cx, hy + cy, r, r, 0, 0, TAU);
    bcInk([[tail, '#8a3a1a'], [comb, '#ff3a3a'], [bcC(hx + 9, hy + 14, 5, 8), '#ff3a3a'], [bcC(0, by, 46, 33), '#c8642a'], [bcC(hx, hy, 18), '#c8642a']], 2.2);
    ctx.fillStyle = '#c8642a'; ellipse(hx - 10, hy + 16, 14, 16, 0.4);
    ctx.fillStyle = '#e8925a'; ellipse(22, by + 6, 20, 20);
    ink(P2(`M-26,${by - 10} C-4,${by - 22} 18,${by - 6} 14,${by + 8} C8,${by + 22} -18,${by + 20} -30,${by + 8} Z`), '#a84a1e', 1.4);
    ctx.strokeStyle = '#7a3010'; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-14 + i * 10, by + 6, 6, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.strokeStyle = '#6a2a10'; for (const k of [0, 1]) { ctx.beginPath(); ctx.moveTo(-40, by - 6 + k * 10); ctx.quadraticCurveTo(-56, by - 30 + k * 8, -64, by - 22 + k * 10); ctx.stroke(); }
    ink(P2(`M${hx + 15},${hy - 4} L${hx + 30},${hy + 1} L${hx + 15},${hy + 6} Z`), '#ffc23a', 1.2);
    ctx.fillStyle = '#fff'; circle(hx + 5, hy - 4, 4.5); ctx.fillStyle = '#231a28'; circle(hx + 6, hy - 4, 2.6);
    ctx.restore();
  }
  // a chick (grow 0) that turns into a young hen with feathers and a comb (grow 1)
  function bcChick(x, y, s, grow = 0, dir = 1, peck = 0, wet = 0) {
    ctx.save(); ctx.translate(x, y); const sc = s * (1 + grow * 0.6); ctx.scale(sc * dir, sc);
    const body = mix(mix('#ffe04a', '#e09040', grow * 0.85), '#c8a020', wet * 0.5);
    ctx.lineCap = 'round';
    for (const d of [-5, 5]) { ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(d, -10); ctx.lineTo(d + 1, 0); ctx.lineTo(d + 7, 1); ctx.stroke(); ctx.strokeStyle = '#ff9a2a'; ctx.lineWidth = 2.4; ctx.stroke(); }
    const hx = 13 + peck * 8, hy = -36 + peck * 18;
    const list = [[bcC(0, -22, 20, 17), body], [bcC(hx, hy, 12), body]];
    if (grow > 0.3) list.unshift([P2('M-16,-28 C-30,-46 -34,-36 -32,-26 C-30,-18 -24,-14 -14,-14 Z'), mix(body, '#8a3a1a', 0.5)]);
    if (grow > 0.4) { const c = new Path2D(), k = (grow - 0.4) / 0.6; for (const [cx, r] of [[-4, 3], [1, 4], [6, 3]]) c.ellipse(hx + cx, hy - 11, r * k + 0.5, r * k + 0.5, 0, 0, TAU); list.unshift([c, '#ff3a3a']); }
    bcInk(list, 1.8);
    if (grow < 0.7 && wet < 0.5) { ctx.globalAlpha = 1 - grow / 0.7; ctx.fillStyle = body; for (let i = 0; i < 10; i++) { const a = -2.6 + i * 0.5; circle(Math.cos(a) * 20, -22 + Math.sin(a) * 17, 3.2); } ctx.globalAlpha = 1; }
    ink(P2('M-12,-24 C-2,-30 10,-24 6,-16 C0,-10 -10,-12 -14,-18 Z'), mix(body, '#c86a1a', 0.35 + grow * 0.3), 1.2);
    ink(P2(`M${hx + 10},${hy - 3} L${hx + 20},${hy + 1} L${hx + 10},${hy + 4} Z`), '#ff9a2a', 1);
    ctx.fillStyle = '#231a28'; circle(hx + 4, hy - 3, 2.4); ctx.fillStyle = '#fff'; circle(hx + 4.8, hy - 3.8, 0.9);
    ctx.fillStyle = 'rgba(255,140,160,.5)'; circle(hx + 1, hy + 3, 2.6);
    ctx.restore();
  }
  function bcSeed(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ink(P2('M0,-9 C7,-8 8,2 5,7 C2,10 -2,10 -5,7 C-8,2 -7,-8 0,-9 Z'), '#ffc21a', 1.4); ctx.fillStyle = '#fff0a0'; ellipse(0, 4, 2.6, 3.2); ctx.restore(); }
  function bcPebble(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); inkEllipse(0, 0, 12, 9, 0.2, '#9a96a8', 1.4); ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-4, -3, 4, 2.4, 0.3); ctx.fillStyle = 'rgba(60,50,80,.25)'; circle(4, 3, 2); ctx.restore(); }
  function bcCoopBg() {
    for (let x = 0; x < W; x += 48) {
      ctx.fillStyle = (x / 48) % 2 ? '#c45c38' : '#d06a42'; ctx.fillRect(x, 0, 48, 400);
      ctx.fillStyle = 'rgba(80,20,10,.35)'; ctx.fillRect(x, 0, 3, 400);
      ctx.fillStyle = 'rgba(90,30,10,.3)'; ellipse(x + 20 + (x * 7) % 14, 120 + (x * 13) % 220, 4, 6);
    }
    ctx.fillStyle = '#a84a2a'; ctx.fillRect(0, 108, W, 12); ctx.fillRect(0, 300, W, 12);
    // a window onto the sunny meadow
    rrect(92, 136, 176, 136, 10, OL);
    ctx.save(); ctx.beginPath(); ctx.rect(98, 142, 164, 124); ctx.clip();
    const sky = ctx.createLinearGradient(0, 142, 0, 266); sky.addColorStop(0, '#6cc8ff'); sky.addColorStop(1, '#d8f4ff'); ctx.fillStyle = sky; ctx.fillRect(98, 142, 164, 124);
    ctx.fillStyle = '#ffd84a'; circle(228, 172, 16);
    ctx.fillStyle = '#9adc7a'; ellipse(150, 268, 110, 40); ctx.fillStyle = '#7cc862'; ellipse(250, 274, 90, 34);
    ctx.fillStyle = '#fff'; ellipse(140, 176, 22, 9); ellipse(158, 170, 14, 9);
    ctx.restore();
    ctx.fillStyle = '#f6e6c8'; ctx.fillRect(176, 142, 8, 124); ctx.fillRect(98, 200, 164, 8);
    rrect(84, 268, 192, 14, 5, '#f6e6c8', OL, 2.5);
    tinyFlower(120, 262, 8, '#ff8ac0'); tinyFlower(150, 260, 7, '#ffd23a'); tinyFlower(240, 262, 8, '#ffffff');
    // a roost bar and a hanging feed sack
    inkRect(600, 210, 300, 14, '#a0683a', 2, 6); for (const x of [620, 880]) inkRect(x - 5, 222, 10, 80, '#8a5a30', 1.8, 3);
    ink(P2('M760,140 C790,136 812,150 812,190 C812,240 800,262 760,262 C720,262 708,240 708,190 C708,150 730,136 760,140 Z'), '#e8d0a0', 2.5);
    text('FEED', 760, 210, 20, '#a06a3a', 'center', 800);
    // a straw floor
    const fl = ctx.createLinearGradient(0, 380, 0, H); fl.addColorStop(0, '#e8c468'); fl.addColorStop(1, '#d6a848');
    ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 392);
    for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 388 + Math.sin(x * 0.07) * 5); ctx.lineTo(W, H); ctx.fill();
    const R = rng(31); ctx.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = R() * W, y = 392 + R() * 150, a = R() * Math.PI, l = 8 + R() * 12;
      ctx.strokeStyle = ['#f6dc8a', '#c8963a', '#fff0b0'][i % 3]; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y - Math.sin(a) * l * 0.3); ctx.stroke();
    }
    for (const [x, y] of [[-30, 360], [910, 350]]) { inkRect(x, y, 110, 60, '#f0cc60', 2.5, 10); ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 6, y + k * 15); ctx.lineTo(x + 104, y + k * 15); ctx.stroke(); } }
  }
  function bcLeafyBg() {
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#c8f2a8'); gr.addColorStop(1, '#86d468');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const R = rng(77);
    ctx.globalAlpha = 0.13;
    for (let i = 0; i < 14; i++) bcLeaf(R() * W, 80 + R() * H, 120 + R() * 110, 36 + R() * 26, R() * TAU, 0, ['#5fbf4a', '#8ad86a', '#4aa83e'][i % 3]);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 30; i++) { const x = R() * W, y = 130 + R() * 400, r = 2 + R() * 4; ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(x, y, r); ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(x - r * 0.3, y - r * 0.3, r * 0.35); }
    for (let i = 0; i < 12; i++) tinyFlower(R() * W, 140 + R() * 390, 5, ['#ff9ac8', '#ffffff', '#ffd23a'][i % 3]);
  }
  // a little picture of each step for the circle cards (fits about 130 x 80)
  const BC_PICS = [
    [
      (x, y) => { bcLeaf(x - 62, y + 6, 124, 30, -0.08, 1); bcTinyEgg(x + 6, y + 4, 2.4); },
      (x, y) => { bcLeaf(x - 62, y + 22, 124, 18, 0, 0); bcCaterpillar([0, 1, 2, 3, 4, 5, 6].map(i => [x + 40 - i * 13, y + 6 - Math.sin(i * 0.9 + S.t * 3) * 4]), 8.5); },
      (x, y) => { ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x - 60, y - 34); ctx.lineTo(x + 60, y - 38); ctx.stroke(); ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 6; ctx.stroke(); bcChrysalis(x, y - 34, 0.66); },
      (x, y) => bcMonarch(x, y + 8, 1.15, 0.1 + Math.sin(S.t * 2) * 0.1),
    ],
    [
      (x, y) => { bcNestBack(x, y + 26, 120); bcHenEgg(x, y, 22, 28); bcNestFront(x, y + 26, 120); },
      (x, y) => {
        bcNestBack(x, y + 30, 120);
        ctx.save(); ctx.beginPath(); ctx.rect(x - 60, y - 6, 120, 80); ctx.clip(); bcHenEgg(x, y + 4, 26, 32); ctx.restore();
        bcChick(x, y + 14, 0.9); ctx.save(); ctx.beginPath(); ctx.rect(x - 60, y + 2, 120, 80); ctx.clip(); bcHenEgg(x, y + 4, 26, 32); ctx.restore();
        bcNestFront(x, y + 30, 120);
      },
      (x, y) => { ctx.fillStyle = 'rgba(150,110,40,.25)'; ellipse(x, y + 34, 34, 7); bcChick(x - 4, y + 34, 1.15); },
      (x, y) => { ctx.fillStyle = 'rgba(150,110,40,.25)'; ellipse(x, y + 40, 44, 8); bcHen(x - 4, y + 40, 0.72); },
    ],
  ];
  const BC_SPOTS = [[390, 186], [606, 330], [390, 470], [174, 330]], BC_CW = 160, BC_CH = 100;
  const BC_CX = 390, BC_CY = 328, BC_RX = 216, BC_RY = 142;

  MG.butterflycycle = {
    kind: 'learn', title: () => 'Butterfly & Chicken Life Cycles', icon: () => '🐛',
    how: () => 'Help a butterfly grow up, one step at a time! Then help a chicken grow up too.',
    init(g) {
      Object.assign(g, { err: 0, round: 0, si: 0, hold: null, flash: 0, tip: '', shake: {} });
      this.begin(g, 0, 0);
    },
    start(g) { speak(g.say); },
    later(g, t, fn) { g.hold = { t, fn }; },
    oops(g, x, y, msg, w = 1) { g.err += w; SFX.miss(); floatText(x, y, msg, '#ffd6d6', false, 22); speak(msg); },
    yay(g, x, y, msg, n = 16) { SFX.hit(); burst(x, y, n); if (msg) floatText(x, y - 24, msg, '#fff6a8', false, 26); },
    tell(g, say, tip) { g.say = say; if (tip) g.tip = tip; speak(say); },
    begin(g, round, si) {
      Object.assign(g, { round, si, hold: null, s: {}, flash: 1.6, shake: {} });
      g.st = si < 4 ? BC_CYC[round].steps[si][0] : 'recap';
      this['in_' + g.st](g, g.s);
      if (g.phase === 'play') speak(g.say);
    },
    next(g) {
      if (g.si < 4) this.begin(g, g.round, g.si + 1);
      else if (g.round === 0) this.begin(g, 1, 0);
      else g.done = true;
    },
    update(g, dt, id) {
      g.flash = Math.max(0, g.flash - dt);
      tickShake(g, dt);
      this['up_' + g.st](g, g.s, dt, !g.hold, id);
      if (g.hold && (g.hold.t -= dt) <= 0) { const f = g.hold.fn; g.hold = null; f(); }
      const c = BC_CYC[g.round];
      g.progress = `${c.name}: ${g.si < 4 ? c.steps[g.si][1] : 'Circle'}`;
      g.score = clamp(1 - g.err * BC_LOSS, 0, 1);
    },
    draw(g) {
      if (g.round === 1) still('bc_coop', bcCoopBg);
      this['dr_' + g.st](g, g.s);
      // the prompt strip: which step this is, and what to do
      const c = BC_CYC[g.round], step = g.si < 4 ? c.steps[g.si] : [0, 'Circle!', '#9a6ae0'];
      panel(16, 64, 928, 52, 18);
      rrect(24, 71, 168, 38, 14, step[2]);
      text(g.si < 4 ? `${g.si + 1}. ${step[1]}` : step[1], 108, 90, 20, '#fff', 'center', 800);
      text(g.tip, 206, 90, 19, '#5a2a6e', 'left', 700);
      if (g.flash > 0 && g.si < 4) { ctx.globalAlpha = Math.min(1, g.flash * 1.4); outlined(step[1] + '!', W / 2, 176 - (1.6 - g.flash) * 12, 56, '#fff6a8'); ctx.globalAlpha = 1; }
    },

    // ============ ROUND 1: the monarch butterfly ============
    // ---- 1. egg: watch the mother land, peel back her leaf, tap the egg to hatch it
    in_egg(g, s) {
      const ys = g.tier === 1 ? [262, 404] : [222, 328, 432];
      s.leaves = [];
      ys.forEach((y, r) => [-1, 1].forEach(side => s.leaves.push({ x: 480 + side * 6, y, rot: side > 0 ? -0.3 - r * 0.05 : Math.PI + 0.3 + r * 0.05, len: 178 - r * 10, wid: 44, turn: 0, open: false, back: 0 })));
      Object.assign(s, { egg: randInt(0, s.leaves.length - 1), mum: 0, sub: 'look', wrong: 0, cracks: 0, hatch: 0, wob: 0 });
      g.say = 'Egg! A mother monarch lays a tiny egg under a milkweed leaf. Watch where she lands, then tap that leaf to peel it back!';
      g.tip = 'Watch where the butterfly lands, then peel back that leaf!';
    },
    inLeaf(l, px, py, pad) {
      const [lx, ly] = bcLocal(l.x, l.y, l.rot, px, py);
      return lx > -pad && lx < l.len + pad && Math.abs(ly) < l.wid * Math.sin(clamp(lx / l.len, 0.05, 0.95) * Math.PI) + pad;
    },
    eggPos(l) { return bcWorld(l.x, l.y, l.rot, l.len * 0.6, 10); },
    // where the mother butterfly is: flying in, resting on the egg leaf, then flying off
    mumPos(s) {
      const l = s.leaves[s.egg], [lx, ly] = bcWorld(l.x, l.y, l.rot, l.len * 0.62, -l.wid * 0.35), t = s.mum;
      if (t < 2.4) { const f = t / 2.4, e = f * f * (3 - 2 * f); return [lerp(-60, lx, e), lerp(170, ly - 26, e) + Math.sin(f * 9) * 30 * (1 - f), 1]; }
      if (t < 4.6) return [lx, ly - 26, 0.25];
      const f = (t - 4.6) / 2; return [lerp(lx, W + 90, f), lerp(ly - 26, 150, f) + Math.sin(f * 8) * 20, 1];
    },
    up_egg(g, s, dt, live) {
      s.mum += dt; s.wob = Math.max(0, s.wob - dt);
      if (s.sub === 'look' && s.mum > 6.6 + bcT(g, [2.5, 4, 7])) s.mum = 0;   // she comes back if the egg is still hidden
      for (const l of s.leaves) {
        l.turn = clamp(l.turn + (l.open ? 1 : -1) * dt * 2.4, 0, 1);
        if (l.back > 0 && (l.back -= dt) <= 0) l.open = false;
      }
      if (s.sub === 'look' && live && pointer.clicked) {
        const i = s.leaves.findIndex(l => !l.open && l.turn === 0 && this.inLeaf(l, pointer.x, pointer.y, bcT(g, [22, 14, 8])));
        if (i >= 0) {
          const l = s.leaves[i], [cx, cy] = bcWorld(l.x, l.y, l.rot, l.len * 0.55, 0);
          l.open = true; tone(520, 0.18, 'triangle', 0.06, 0, 900); noise(0.08, 0.02);
          if (i === s.egg) {
            s.sub = 'found'; const [ex, ey] = this.eggPos(l);
            this.later(g, 0.5, () => { this.yay(g, ex, ey, 'An egg!'); this.later(g, 1.1, () => { s.sub = 'zoom'; this.tell(g, 'You found it! The egg is as small as a pinhead. Tap it to help the caterpillar hatch!', 'Tap the egg to help it hatch!'); }); });
          } else {
            l.back = 1.1;
            if (s.mum < 2.4) floatText(cx, cy, 'Watch the butterfly first!', '#fff', false, 20);
            else { s.wrong++; this.oops(g, cx, cy, 'No egg here. Where did she land?'); }
          }
        }
      } else if (s.sub === 'zoom' && live && pointer.clicked && Math.hypot(pointer.x - 480, pointer.y - 330) < bcT(g, [120, 100, 80])) {
        s.cracks++; s.wob = 0.35; SFX.pop(); burst(480, 300, 6, { colors: ['#fff4c4', '#ffffff'] });
        if (s.cracks >= 3) {
          s.sub = 'hatch'; s.hatch = 0;
          this.tell(g, "It hatched! The tiny caterpillar's very first meal is its own eggshell. Munch, munch!", 'Munch, munch!');
          this.later(g, 3.6, () => this.next(g));
        }
      }
      if (s.sub === 'hatch') { const k = Math.floor(s.hatch * 6); s.hatch += dt; if (s.hatch > 1 && Math.floor(s.hatch * 6) !== k) tone(260 + rand(0, 60), 0.05, 'square', 0.025); }
    },
    dr_egg(g, s) {
      const gr = ctx.createRadialGradient(480, 330, 40, 480, 330, 440); gr.addColorStop(0, 'rgba(255,255,236,.7)'); gr.addColorStop(1, 'rgba(255,255,236,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, BC_TOP, W, H - BC_TOP);
      ctx.lineCap = 'round';
      ctx.strokeStyle = OL; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(480, H + 10); ctx.quadraticCurveTo(472, 330, 480, 170); ctx.stroke();
      ctx.strokeStyle = '#6cbf4a'; ctx.lineWidth = 12; ctx.stroke();
      ctx.strokeStyle = '#9ade7a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(476, H); ctx.quadraticCurveTo(470, 330, 477, 180); ctx.stroke();
      bcMilkFlowers(480, 160, 34);
      for (const [i, l] of s.leaves.entries()) {
        const sh = g.shake[i] ? Math.sin(g.shake[i] * 50) * 4 : 0;
        bcLeaf(l.x, l.y + sh, l.len, l.wid, l.rot, l.turn);
        if (i === s.egg && l.turn > 0.6) { const [ex, ey] = this.eggPos(l); ctx.globalAlpha = (l.turn - 0.6) / 0.4; bcTinyEgg(ex, ey, 1.4); ctx.globalAlpha = 1; if (s.sub === 'found') { ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex, ey, 18 + Math.sin(S.t * 8) * 3, 0, TAU); ctx.stroke(); } }
      }
      // a little sparkle on the right leaf if the egg has been hard to find
      if (s.sub === 'look' && (g.tier === 1 ? s.wrong >= 2 : s.wrong >= 4)) { const l = s.leaves[s.egg], [cx, cy] = bcWorld(l.x, l.y, l.rot, l.len * 0.6, 0); star(cx, cy - 4, 10 + Math.sin(S.t * 6) * 4, '#fff6a8', 4); }
      if (s.mum < 6.6) { const [mx, my, fl] = this.mumPos(s); bcMonarch(mx, my, 0.9, S.t * (fl > 0.5 ? 3.2 : 0.8)); }
      if (s.sub === 'zoom' || s.sub === 'hatch') {
        // the magnifying glass shows the egg up close
        ctx.fillStyle = 'rgba(40,20,60,.25)'; ctx.fillRect(0, BC_TOP, W, H - BC_TOP);
        ctx.strokeStyle = OL; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(570, 420); ctx.lineTo(650, 500); ctx.stroke(); ctx.strokeStyle = '#9a6ae0'; ctx.lineWidth = 18; ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.arc(480, 330, 130, 0, TAU); ctx.clip();
        ctx.fillStyle = '#c4e4a0'; ctx.fillRect(340, 190, 280, 280);
        ctx.strokeStyle = '#e4f6cc'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(340, 420); ctx.quadraticCurveTo(480, 400, 620, 440); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 40; i++) circle(350 + (i * 73) % 260, 200 + (i * 41) % 260, 2);
        const eat = clamp((s.hatch - 1.1) / 2, 0, 1), wob = Math.sin(s.wob * 40) * 0.08;
        ctx.save(); ctx.translate(480, 330); ctx.rotate(wob); ctx.scale(1 - eat * 0.8, 1 - eat * 0.8);
        if (eat < 0.95) bcTinyEgg(0, 0, 6.4);
        ctx.strokeStyle = '#a07a3a'; ctx.lineWidth = 3;
        for (let i = 0; i < Math.min(3, s.cracks); i++) { const y0 = -20 + i * 14; ctx.beginPath(); ctx.moveTo(-26, y0); ctx.lineTo(-10, y0 + 8); ctx.lineTo(0, y0 - 4); ctx.lineTo(12, y0 + 6); ctx.lineTo(28, y0 - 2); ctx.stroke(); }
        ctx.restore();
        if (s.sub === 'hatch') {
          let pts;
          if (s.hatch < 1.1) { const out = s.hatch / 1.1, hx = 470 - 72 * out, hy = 300 + 40 * out, a = Math.atan2(330 - hy, 480 - hx); pts = [0, 1, 2, 3, 4, 5].map(i => [hx + Math.cos(a) * i * 15, hy + Math.sin(a) * i * 15]); }
          else { const hx = 466 - 30 * (1 - eat); pts = [0, 1, 2, 3, 4, 5].map(i => [hx - i * 15, 340 + Math.sin(i * 1.3 + S.t * 6) * 2]); }
          bcCaterpillar(pts, 11, s.hatch > 1.1 && eat < 1 ? 1 : 0);
        }
        ctx.restore();
        ctx.strokeStyle = OL; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(480, 330, 132, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#c6a2ff'; ctx.lineWidth = 11; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(480, 330, 112, 3.6, 4.4); ctx.stroke();
        if (s.sub === 'zoom') outlined(['Tap!', 'Tap again!', 'One more!'][s.cracks] || '', 480, 486, 30, '#fff6a8');
      }
    },

    // ---- 2. caterpillar: steer it to munch milkweed, grow and molt, and hide from the bird
    in_eat(g, s) {
      Object.assign(s, { x: 480, y: 330, dir: 0, trail: [], bites: 0, need: bcT(g, [12, 16, 20]), chew: 0, wob: 0, molts: [], food: [], bad: [], respawn: [],
        bird: null, birds: bcT(g, [1, 2, 3]), birdNo: 0, badCd: 0, molted: 0, done: false });
      s.shade = [{ x: 190, y: 290 }, { x: 770, y: 420 }];
      s.slots = [[350, 205], [620, 210], [330, 440], [570, 470], [830, 230], [130, 470], [470, 330], [700, 330]];
      for (let i = 0; i < 3; i++) this.addFood(s, false);
      for (let i = 1; i < g.tier; i++) this.addFood(s, true);
      g.say = 'Caterpillar! It eats milkweed leaves and grows bigger and bigger. Steer it to munch!' + (g.tier > 1 ? ' Only milkweed, not the orange leaves!' : '');
      g.tip = g.tier > 1 ? 'Steer to munch milkweed. Not the orange leaves!' : 'Steer the caterpillar to munch the leaves!';
    },
    addFood(s, bad) {
      const used = [...s.food, ...s.bad].map(l => l.slot);
      const free = s.slots.map((p, i) => i).filter(i => !used.includes(i) && Math.hypot(s.slots[i][0] - s.x, s.slots[i][1] - s.y) > 150);
      const slot = free.length ? pick(free) : pick(s.slots.map((p, i) => i).filter(i => !used.includes(i)));
      if (slot === undefined) return;
      const [cx, cy] = s.slots[slot], rot = rand(-0.5, 0.5) + (Math.random() < 0.5 ? Math.PI : 0), len = 140, wid = 44;
      const [bx, by] = bcWorld(cx, cy, rot, -len / 2, 0);
      const l = { slot, cx, cy, bx, by, rot, len, wid, grow: 0 };
      if (bad) s.bad.push(l);
      else { l.bites = [[0.28, -0.42], [0.28, 0.42], [0.55, -0.52], [0.55, 0.52], [0.8, -0.32], [0.8, 0.32]].map(([f, w]) => ({ lx: f * len, ly: w * wid, w: bcWorld(bx, by, rot, f * len, w * wid), eaten: false })); s.food.push(l); }
    },
    up_eat(g, s, dt, live) {
      s.chew = Math.max(0, s.chew - dt); s.wob = Math.max(0, s.wob - dt); s.badCd = Math.max(0, s.badCd - dt);
      for (const l of [...s.food, ...s.bad]) l.grow = Math.min(1, l.grow + dt * 2.5);
      for (const m of s.molts) m.t -= dt; s.molts = s.molts.filter(m => m.t > 0);
      for (const r of s.respawn) r.t -= dt; while (s.respawn.length && s.respawn[0].t <= 0) { s.respawn.shift(); this.addFood(s, false); }
      const r = 17 + 9 * Math.min(1, s.bites / s.need);
      // steering
      let tx = s.x, ty = s.y;
      if (pointerMoved(g)) { tx = pointer.x; ty = pointer.y; }
      const kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (kx || ky) { tx = s.x + kx * 100; ty = s.y + ky * 100; }
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      s.mv = live && d > 5 && s.wob <= 0;
      if (s.mv) {
        const sp = Math.min(d * 6, 150 + g.tier * 10) * dt;
        s.dir = Math.atan2(dy, dx); s.x += dx / d * sp; s.y += dy / d * sp;
        s.x = clamp(s.x, 30, W - 30); s.y = clamp(s.y, BC_TOP + 24, H - 24);
        s.trail.push([s.x, s.y]); if (s.trail.length > 500) s.trail.splice(0, 100);
      }
      if (live && !s.done) {
        // munch any milkweed under its mouth
        if (s.chew <= 0) for (const l of s.food) {
          if (l.grow < 1) continue;
          const b = l.bites.find(b => !b.eaten && Math.hypot(b.w[0] - s.x, b.w[1] - s.y) < 20 + r * 0.7);
          if (!b) continue;
          b.eaten = true; s.bites++; s.chew = 0.2;
          tone(300 + s.bites * 12, 0.07, 'square', 0.035); burst(b.w[0], b.w[1], 5, { colors: ['#5ac85a', '#9ae87a'], spread: 60, up: 30, size: [2, 4] });
          if (l.bites.every(b => b.eaten)) { s.food.splice(s.food.indexOf(l), 1); s.respawn.push({ t: 0.6 }); }
          if (s.molted < 2 && s.bites >= Math.round(s.need * (s.molted + 1) / 3)) {
            s.molted++; s.molts.push({ pts: bcBody(s.trail, 5 + Math.round(5 * s.bites / s.need), r * 1.1, s.dir, s.x, s.y), r, t: 1.8 });
            SFX.sparkle(); floatText(s.x, s.y - 40, 'It molted!', '#fff6a8', false, 24);
            if (!s.bird) this.tell(g, 'It molts! It wiggles out of its old, tight skin so it can keep growing.');
          }
          break;
        }
        // orange leaves are not food for a monarch caterpillar
        for (const l of s.bad) {
          if (s.badCd > 0 || Math.hypot(l.cx - s.x, l.cy - s.y) > 52 + r * 0.5) continue;
          s.badCd = 2; s.wob = 0.4; const a = Math.atan2(s.y - l.cy, s.x - l.cx); s.x += Math.cos(a) * 40; s.y += Math.sin(a) * 40;
          this.oops(g, l.cx, l.cy - 40, 'Yuck! Monarch caterpillars only eat milkweed!');
        }
        // a hungry bird comes now and then
        if (!s.bird && s.birdNo < s.birds && s.bites >= Math.floor(s.need * (s.birdNo + 1) / (s.birds + 1))) {
          s.bird = { t: 0, warn: bcT(g, [4.2, 3.4, 2.8]), dir: pick([-1, 1]), checked: false, pass: bcT(g, [2.2, 1.9, 1.6]) };
          SFX.alert(); this.tell(g, 'A bird is coming! Hide under a big leaf!');
        }
        if (s.done === false && s.bites >= s.need && !s.bird) {
          s.done = true; this.yay(g, s.x, s.y, 'So big!', 24);
          this.tell(g, 'What a big, fat caterpillar! Now it is ready for its next step.');
          this.later(g, 2.8, () => this.next(g));
        }
      }
      if (s.bird) {
        const b = s.bird; b.t += dt;
        const f = (b.t - b.warn) / b.pass;
        b.x = b.dir > 0 ? lerp(-260, W + 260, f) : lerp(W + 260, -260, f);
        if (f > 0 && !b.checked && (b.dir > 0 ? b.x > s.x : b.x < s.x)) {
          b.checked = true;
          if (s.shade.some(h => Math.hypot(h.x - s.x, h.y - s.y) < bcT(g, [95, 85, 72]))) { this.yay(g, s.x, s.y - 30, 'Safe!'); speak('Phew! Safe under the leaf.'); }
          else { s.wob = 0.6; this.oops(g, s.x, s.y - 40, 'The bird spotted you! Hide under a leaf next time.'); }
        }
        if (f >= 1) { s.bird = null; s.birdNo++; if (live) this.tell(g, 'The bird flew away. Keep munching!'); }
      }
    },
    dr_eat(g, s) {
      still('bc_leafy', bcLeafyBg);
      // a soft light pool so the leaves and the caterpillar stand out from the leafy wall
      const lg = ctx.createRadialGradient(480, 330, 80, 480, 330, 560); lg.addColorStop(0, 'rgba(255,255,236,.45)'); lg.addColorStop(1, 'rgba(60,110,50,.18)');
      ctx.fillStyle = lg; ctx.fillRect(0, BC_TOP, W, H - BC_TOP);
      const r = 17 + 9 * Math.min(1, s.bites / s.need), n = 6 + Math.round(4 * Math.min(1, s.bites / s.need));
      for (const l of s.bad) {
        ctx.save(); ctx.globalAlpha = l.grow; ctx.translate(l.cx, l.cy); ctx.rotate(l.rot);
        const lobes = [[-50, 0, 18], [-28, -20, 20], [-28, 20, 20], [0, -26, 22], [0, 26, 22], [28, -20, 20], [28, 20, 20], [50, 0, 18], [0, 0, 30]];
        bcInk(lobes.map(([x, y, rr]) => [bcC(x, y, rr * 0.9 + 2, rr * 0.8 + 2), '#f08a3a']), 2);
        ctx.strokeStyle = '#c05a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-62, 0); ctx.lineTo(56, 0); ctx.stroke();
        ctx.restore();
      }
      for (const l of s.food) {
        ctx.save();
        for (const b of l.bites) if (b.eaten) { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(b.w[0], b.w[1], 20, 0, TAU); ctx.clip('evenodd'); }
        ctx.globalAlpha = l.grow; bcLeaf(l.bx, l.by, l.len, l.wid, l.rot, 0, '#56c04a');
        ctx.translate(l.bx, l.by); ctx.rotate(l.rot); ctx.clip(bcLeafP(l.len, l.wid));
        ctx.strokeStyle = OL; ctx.lineWidth = 4; for (const b of l.bites) if (b.eaten) { ctx.beginPath(); ctx.arc(b.lx, b.ly, 20, 0, TAU); ctx.stroke(); }
        ctx.restore();
      }
      for (const m of s.molts) { ctx.save(); ctx.globalAlpha = Math.min(1, m.t) * 0.55; ctx.fillStyle = OL; for (const p of m.pts) circle(p[0] - 14, p[1] + 10, m.r + 2); ctx.fillStyle = '#e8e2c8'; for (const p of m.pts) circle(p[0] - 14, p[1] + 10, m.r); ctx.restore(); }
      const wob = s.wob > 0 ? Math.sin(s.wob * 40) * 4 : 0;
      // the caterpillar is the star: a glow under it, a ring round its head, and a little crawl bounce
      const body = bcBody(s.trail, n, r * 1.05, s.dir, s.x + wob, s.y).map(([x, y], i) => [x, y - Math.abs(Math.sin(S.t * 9 - i * 0.8)) * (s.mv ? 4 : 1)]);
      ctx.fillStyle = 'rgba(255,255,220,.5)'; for (const [x, y] of body) circle(x, y + 4, r * 1.7);
      ctx.fillStyle = 'rgba(40,60,20,.25)'; for (const [x, y] of body) ellipse(x + 3, y + r * 0.8, r, r * 0.45);
      ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(body[0][0], body[0][1], r * 1.6 + Math.sin(S.t * 6) * 3, 0, TAU); ctx.stroke();
      bcCaterpillar(body, r, s.chew > 0 ? 1 : 0);
      // the big shady leaves to hide under
      for (const h of s.shade) {
        ctx.save(); ctx.globalAlpha = 0.72; bcLeaf(h.x - 120, h.y + 26, 240, 66, -0.2, 0, '#3f9a3e'); ctx.restore();
        if (s.bird && !s.bird.checked) { ctx.setLineDash([10, 8]); ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(h.x, h.y, bcT(g, [95, 85, 72]) + Math.sin(S.t * 8) * 4, 0, TAU); ctx.stroke(); ctx.setLineDash([]); outlined('Hide here!', h.x, h.y - 96, 22, '#fff6a8'); }
      }
      if (s.bird) {
        const b = s.bird;
        if (b.t < b.warn) {
          const ex = b.dir > 0 ? 70 : W - 70, pulse = 1 + Math.sin(S.t * 10) * 0.08;
          ctx.save(); ctx.translate(ex, 300); ctx.scale(pulse, pulse);
          inkCircle(0, 0, 46, '#ff6a6a', 3); emoji('🐦', 0, -4, 46); outlined('!', 30, -30, 34, '#fff6a8');
          ctx.restore();
          outlined(`${Math.ceil(b.warn - b.t)}`, ex, 368, 30, '#fff');
        }
        ctx.save(); ctx.translate(b.x ?? -400, 320); ctx.scale(2.6 * b.dir, 2.6); ctx.fillStyle = 'rgba(30,20,50,.32)';
        ctx.fill(P2('M-90,0 C-60,-22 -30,-16 -10,-5 C-6,-18 6,-18 10,-5 C30,-16 60,-22 90,0 C60,-6 30,2 10,10 C6,26 -6,26 -10,10 C-30,2 -60,-6 -90,0 Z'));
        ctx.restore();
      }
      // how much it has munched
      rrect(320, 506, 320, 22, 11, 'rgba(48,24,72,.6)');
      rrect(324, 510, Math.max(14, 312 * Math.min(1, s.bites / s.need)), 14, 7, '#9ae84a');
      text(`Munches: ${Math.min(s.bites, s.need)} / ${s.need}`, 480, 517, 13, '#fff', 'center', 800);
    },

    // ---- 3. chrysalis: carry it up to the twig, it hangs in a J, then rub round and round to wrap it
    in_spin(g, s) {
      Object.assign(s, { sub: 'climb', x: 300, y: 470, home: [300, 470], drag: false, j: 0, acc: 0, la: null, p: 0, q: 0, turns: bcT(g, [3, 4, 5]), sparks: [] });
      g.say = 'Chrysalis! First the caterpillar hangs upside down in a J shape. Drag it up to the twig!';
      g.tip = 'Drag the caterpillar up to the silk on the twig!';
    },
    jPts(jt) {
      let x = 480, y = 172, h = Math.PI / 2; const pts = [[x, y]];
      for (let i = 1; i < 10; i++) { if (i > 5) h -= jt * 0.46; x += Math.cos(h) * 21; y += Math.sin(h) * 21; pts.push([x, y]); }
      return pts.reverse();
    },
    up_spin(g, s, dt, live) {
      const pad = [480, 172];
      if (s.sub === 'climb' && live) {
        if (pointer.clicked && Math.hypot(pointer.x - s.x, pointer.y - s.y) < 100) s.drag = true;
        if (s.drag && pointer.down) { s.x = pointer.x; s.y = clamp(pointer.y, BC_TOP + 20, H - 20); }
        else if (s.drag) {
          s.drag = false;
          if (Math.hypot(s.x - pad[0], s.y - pad[1] - 20) < bcT(g, [120, 95, 75])) this.attach(g, s);
          else { floatText(s.x, s.y - 30, 'Up to the twig!', '#fff', false, 20); }
        }
        if (!s.drag) { s.x = lerp(s.x, s.home[0], Math.min(1, dt * 4)); s.y = lerp(s.y, s.home[1], Math.min(1, dt * 4)); }
        if (pressed[' '] || pressed.enter || pressed.arrowup) this.attach(g, s);
      } else if (s.sub === 'j') {
        s.j = Math.min(1, s.j + dt / 1.3);
        if (s.j >= 1) { s.sub = 'wrap'; this.tell(g, 'Now rub round and round, to wrap it up in a chrysalis!', 'Rub round and round the caterpillar!'); }
      } else if (s.sub === 'wrap' && live) {
        const dx = pointer.x - 480, dy = pointer.y - 280, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        const [lo, hi] = bcT(g, [[30, 270], [45, 230], [60, 200]]), inBand = d > lo && d < hi;
        if (s.la !== null && inBand) { let da = a - s.la; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; if (Math.abs(da) < 0.9) { s.acc += Math.abs(da); if (Math.abs(da) > 0.02 && Math.random() < 0.5) s.sparks.push({ x: pointer.x, y: pointer.y, t: 0.6 }); } }
        s.la = inBand ? a : null;
        if (keys.arrowleft || keys.arrowright || keys[' ']) s.acc += 5 * dt;
        s.p = Math.min(1, s.acc / (s.turns * TAU));
        const q = Math.floor(s.p * s.turns * 4);
        if (q > s.q) { s.q = q; chime(q); }
        if (s.p >= 1) {
          s.sub = 'done'; SFX.sparkle(); burst(480, 280, 30, { colors: ['#ffd23a', '#5ad6a0', '#ffffff'] });
          this.tell(g, 'A chrysalis! Inside it, the caterpillar is changing into a butterfly.', 'Shh... something amazing is happening inside!');
          this.later(g, 3.6, () => this.next(g));
        }
      }
      for (const p of s.sparks) p.t -= dt; s.sparks = s.sparks.filter(p => p.t > 0);
    },
    attach(g, s) { s.sub = 'j'; s.drag = false; SFX.pick(); this.yay(g, 480, 180, 'Hang on!', 10); speak('It holds on tight with a silk pad, and curls into a J.'); },
    dr_spin(g, s) {
      ctx.fillStyle = 'rgba(255,255,240,.25)'; ctx.fillRect(0, BC_TOP, W, H - BC_TOP);
      bcBranch(150);
      // the silk pad
      ctx.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) circle(474 + i * 2.5, 168 + (i % 2) * 3, 5);
      if (s.sub === 'climb') {
        const pr = bcT(g, [120, 95, 75]);
        ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(480, 192, pr * 0.6 + Math.sin(S.t * 5) * 4, 0, TAU); ctx.stroke();
        if (!s.drag) { ctx.beginPath(); ctx.moveTo(s.x + 30, s.y - 40); ctx.quadraticCurveTo(380, 260, 470, 220); ctx.stroke(); }
        ctx.setLineDash([]);
        const pts = s.drag ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => [s.x + Math.sin(i * 0.7 + S.t * 6) * 4, s.y + i * 20]) : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => [s.x + 90 - i * 21, s.y - Math.abs(Math.sin(i * 0.6 + S.t * 4)) * 6]);
        bcCaterpillar(pts, 19);
        if (!s.drag) outlined('Drag me up!', s.x, s.y - 52, 22, '#fff6a8');
        return;
      }
      const p = s.sub === 'j' ? 0 : s.p;
      if (p < 1) bcCaterpillar(this.jPts(s.sub === 'j' ? s.j : 1), 19 - p * 4, 0, 1 - p * 0.6);
      if (p > 0) {
        // the chrysalis wraps up from the bottom, changing colour as it goes
        const top = 172, h = 1.7 * 114, cut = top + h * (1 - p) + 4;
        ctx.save(); ctx.beginPath(); ctx.rect(380, cut, 200, 300); ctx.clip();
        bcChrysalis(480, top, 1.7, { col: mix('#d8e070', '#5ad6a0', p), gold: s.sub === 'done' ? 1 : 0 });
        ctx.restore();
        if (p < 1) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(480, cut + i * 6, 46, 7, Math.sin(S.t * 6 + i) * 0.15, 0, TAU); ctx.stroke(); } }
      }
      if (s.sub === 'wrap') {
        ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(480, 280, 150, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = OL; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(480, 280, 150, -Math.PI / 2, -Math.PI / 2 + TAU * s.p); ctx.stroke();
        ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 9; ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const a = S.t * 1.2 + i * Math.PI / 2, x = 480 + Math.cos(a) * 150, y = 280 + Math.sin(a) * 150;
          inkAt(x, y, a + Math.PI / 2, P2('M-10,-9 L10,0 L-10,9 Z'), '#fff6a8', 1.6);
        }
        outlined('Rub round and round!', 480, 470, 26, '#fff6a8');
      }
      for (const sp of s.sparks) { ctx.globalAlpha = sp.t / 0.6; star(sp.x, sp.y, 7, '#ffffff', 4); }
      ctx.globalAlpha = 1;
    },

    // ---- 4. butterfly: cheer the wiggling chrysalis, pump the new wings, let them dry, fly to a flower
    in_emerge(g, s) {
      Object.assign(s, { sub: 'clear', clear: 0, wig: 0, wigT: 1.4, cracks: 0, need: bcT(g, [3, 4, 4]), out: 0, wing: 0.12, pumps: 0, pneed: bcT(g, [6, 8, 10]),
        last: 0, pulse: 0, padHit: [0, 0], dry: 0, bx: 480, by: 392, sip: 0, webCd: 0, flowerI: 0 });
      const far = shuffle([0, 3]);
      s.targets = g.tier === 1 ? [far[0]] : far;
      s.flowers = [[150, 418, '#ff6fae'], [360, 450, '#c6a2ff'], [600, 450, '#ffd23a'], [810, 418, '#ff9a5a']];
      g.say = 'Butterfly! Days later, the chrysalis turns clear, and you can see orange wings inside! Tap it when it wiggles to cheer it on!';
      g.tip = 'Tap the chrysalis when it wiggles!';
    },
    up_emerge(g, s, dt, live) {
      s.pulse = Math.max(0, s.pulse - dt * 2.5); s.webCd = Math.max(0, s.webCd - dt);
      s.padHit = s.padHit.map(v => Math.max(0, v - dt * 3));
      if (s.sub === 'clear' || s.sub === 'crack') {
        s.clear = Math.min(1, s.clear + dt / 1.4);
        if (s.clear >= 1) s.sub = 'crack';
        if (s.wig > 0) s.wig = Math.max(0, s.wig - dt);
        else if ((s.wigT -= dt) <= 0) { s.wig = bcT(g, [1.5, 1.1, 0.85]); s.wigT = rand(0.9, 1.7); tone(330, 0.1, 'triangle', 0.05); }
        if (live && pointer.clicked && Math.hypot(pointer.x - 480, pointer.y - 272) < bcT(g, [100, 82, 66])) {
          if (s.wig > 0) {
            s.cracks++; s.wig = 0; s.wigT = rand(0.7, 1.4); SFX.pop(); this.yay(g, 480, 260, ['Go!', 'Push!', 'Almost!', 'Yes!'][s.cracks - 1] || 'Yes!', 10);
            if (s.cracks >= s.need) {
              s.sub = 'out'; s.out = 0;
              this.tell(g, 'Out comes the butterfly! Its new wings are wet and crumpled. Tap left, right, left, right, to pump them open!', 'Tap LEFT, then RIGHT, to pump the wings open!');
            }
          } else if (g.tier === 1) floatText(pointer.x, pointer.y - 20, 'Wait for the wiggle!', '#fff', false, 20);
          else this.oops(g, pointer.x, pointer.y - 20, 'Wait for the wiggle!');
        }
      } else if (s.sub === 'out') {
        s.out = Math.min(1, s.out + dt / 1.4);
        if (s.out >= 1) s.sub = 'pump';
      } else if (s.sub === 'pump' && live) {
        let side = 0;
        if (pointer.clicked && pointer.y > BC_TOP) side = pointer.x < 480 ? -1 : 1;
        if (pressed.arrowleft || pressed.a) side = -1;
        if (pressed.arrowright || pressed.d) side = 1;
        if (side) {
          s.padHit[side < 0 ? 0 : 1] = 1;
          if (side !== s.last) {
            s.last = side; s.pumps++; s.pulse = 1; s.wing = 0.12 + 0.88 * s.pumps / s.pneed; chime(s.pumps * 2);
            if (s.pumps >= s.pneed) {
              s.sub = 'dry'; s.dry = 0; SFX.sparkle(); burst(480, 380, 20);
              this.tell(g, 'Big wings! Now they dry in the warm sun. A butterfly cannot fly until its wings are dry.', 'Wait for the wings to dry...');
            }
          } else this.oops(g, pointer.y > BC_TOP && pointer.clicked ? pointer.x : 480, 300, side < 0 ? 'Now tap the right side!' : 'Now tap the left side!', g.tier === 1 ? 0.5 : 1);
        }
      } else if (s.sub === 'dry') {
        s.dry = Math.min(1, s.dry + dt / 2.6);
        if (s.dry >= 1) { s.sub = 'fly'; this.tell(g, 'Its wings are dry! Fly the butterfly to the glowing flower for a sip of nectar.', 'Fly the butterfly to the glowing flower!'); }
      } else if (s.sub === 'fly' && live) {
        let tx = s.bx, ty = s.by;
        if (pointerMoved(g)) { tx = pointer.x; ty = pointer.y; }
        const kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        if (kx || ky) { tx = s.bx + kx * 100; ty = s.by + ky * 100; }
        const dx = tx - s.bx, dy = ty - s.by, d = Math.hypot(dx, dy);
        if (d > 4 && s.sip <= 0) { const sp = Math.min(d * 6, 290) * dt; s.bx += dx / d * sp; s.by += dy / d * sp; s.vx = dx / d; }
        s.bx = clamp(s.bx, 30, W - 30); s.by = clamp(s.by, BC_TOP + 30, H - 30);
        const web = this.webPos(g, s);
        if (web && s.webCd <= 0 && Math.hypot(web[0] - s.bx, web[1] - s.by) < 62) {
          s.webCd = 1.5; s.by = web[1] - 110; this.oops(g, web[0], web[1] - 70, 'Watch out for the sticky web!');
        }
        if (s.sip > 0) {
          s.sip -= dt;
          if (s.sip <= 0) {
            s.flowerI++;
            if (s.flowerI >= s.targets.length) {
              s.sub = 'done';
              this.tell(g, 'Yum, nectar! Soon she will lay eggs of her own, and the life cycle starts all over again!', 'She will lay eggs of her own!');
              this.later(g, 4.2, () => this.next(g));
            } else this.tell(g, 'Yum! Now fly to the next glowing flower!');
          }
        } else {
          const f = s.flowers[s.targets[s.flowerI]];
          if (Math.hypot(f[0] - s.bx, f[1] - s.by) < bcT(g, [72, 60, 50])) { s.sip = 1.1; s.bx = f[0]; s.by = f[1] - 16; this.yay(g, f[0], f[1] - 40, 'Sip!', 18); }
        }
      }
    },
    webPos(g, s) {
      if (g.tier === 1 || s.flowerI >= s.targets.length) return null;
      const f = s.flowers[s.targets[s.flowerI]];
      return [(f[0] + 480) / 2, 360];
    },
    dr_emerge(g, s) {
      ctx.fillStyle = 'rgba(255,255,240,.25)'; ctx.fillRect(0, BC_TOP, W, H - BC_TOP);
      bcBranch(150);
      ctx.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) circle(474 + i * 2.5, 168 + (i % 2) * 3, 5);
      const sun = s.sub === 'dry' ? s.dry : 0;
      if (sun > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, Math.sin(sun * Math.PI) * 2); bdSunburst(820, 210); ctx.restore(); }
      if (s.sub === 'clear' || s.sub === 'crack') {
        const wob = s.wig > 0 ? Math.sin(S.t * 34) * 0.12 : Math.sin(S.t * 1.5) * 0.02;
        bcChrysalis(480, 172, 1.7, { clear: s.clear, wob, cracks: s.cracks });
        if (s.wig > 0) { outlined('NOW!', 600, 260, 34, '#fff6a8'); for (const d of [-1, 1]) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(480, 272, 96, d > 0 ? -0.5 : Math.PI - 0.5, d > 0 ? 0.5 : Math.PI + 0.5); ctx.stroke(); } }
        else outlined('Wait for the wiggle...', 480, 470, 22, '#fff');
        return;
      }
      bcChrysalis(480, 172, 1.7, { empty: true });
      const flap = 0.3 - s.pulse * 0.3;   // wings half up at rest; each pump opens them wide
      if (s.sub === 'out') { ctx.save(); ctx.globalAlpha = s.out; bcMonarch(480, lerp(320, 392, s.out), 1.6, 0.3, 0, 0.12, 1); ctx.restore(); }
      else if (s.sub === 'pump' || s.sub === 'dry') {
        const fl = s.sub === 'dry' ? 0.15 + Math.sin(S.t * 2) * 0.15 : flap;
        bcMonarch(480, 392, 1.6, fl, 0, s.wing, s.sub === 'dry' ? 1 - s.dry : 1);
        if (s.sub === 'dry') { for (let i = 0; i < 3; i++) { const t = (S.t * 0.8 + i / 3) % 1; ctx.globalAlpha = 1 - t; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(420 + i * 60, 360 - t * 60); ctx.quadraticCurveTo(430 + i * 60, 350 - t * 60, 420 + i * 60, 340 - t * 60); ctx.stroke(); } ctx.globalAlpha = 1; }
        if (s.sub === 'pump') {
          for (const [i, side] of [[0, -1], [1, 1]]) {
            const x = 480 + side * 270, want = s.last !== side, glow = s.padHit[i];
            rrect(x - 90, 300, 180, 150, 28, want ? 'rgba(255,246,168,.55)' : 'rgba(255,255,255,.25)', glow ? '#fff' : 'rgba(255,255,255,.7)', 4 + glow * 4);
            inkAt(x, 360, side > 0 ? 0 : Math.PI, P2('M-34,-12 L6,-12 L6,-30 L38,0 L6,30 L6,12 L-34,12 Z'), want ? '#ffd84a' : '#d8c8e0', 2);
            text(side < 0 ? 'Left' : 'Right', x, 422, 22, '#5a2a6e', 'center', 800);
          }
          rrect(400, 506, 160, 20, 10, 'rgba(48,24,72,.6)'); rrect(404, 510, Math.max(12, 152 * s.pumps / s.pneed), 12, 6, '#ffb03a');
        }
        return;
      }
      // flying: the flowers wait below
      for (const [i, [x, y, c]] of s.flowers.entries()) {
        const target = s.sub === 'fly' && s.targets[s.flowerI] === i, sw = Math.sin(S.t * 1.5 + i) * 4;
        sway(x, H + 4, H - y + 4, sw, OL, 9); sway(x, H + 4, H - y + 4, sw, '#4fae4a', 5);
        bcLeaf(x + sw * 0.3, y + 50, 50, 14, -0.6, 0); bcLeaf(x + sw * 0.3, y + 70, 50, 14, Math.PI + 0.6, 0);
        if (target) { const gl = ctx.createRadialGradient(x + sw, y, 6, x + sw, y, 80); gl.addColorStop(0, 'rgba(255,250,180,.9)'); gl.addColorStop(1, 'rgba(255,250,180,0)'); ctx.fillStyle = gl; ctx.fillRect(x - 90, y - 90, 180, 180); }
        flower(x + sw, y, 34, c, '#ffd84a', 2.2);
        if (target) outlined('Here!', x + sw, y - 56 + Math.sin(S.t * 5) * 4, 22, '#fff6a8');
      }
      const web = this.webPos(g, s);
      if (web) {
        const [wx, wy] = web; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wx, BC_TOP); ctx.lineTo(wx, wy - 54); ctx.stroke();
        for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * 56, wy + Math.sin(a) * 56); ctx.stroke(); }
        for (let k = 1; k <= 3; k++) { ctx.beginPath(); for (let i = 0; i <= 8; i++) { const a = i * TAU / 8, rr = k * 17; ctx.lineTo(wx + Math.cos(a) * rr, wy + Math.sin(a) * rr); } ctx.stroke(); }
        inkCircle(wx, wy, 9, '#3a2a4a', 1.4); ctx.fillStyle = '#fff'; circle(wx - 3, wy - 2, 2.2); circle(wx + 3, wy - 2, 2.2);
      }
      bcMonarch(s.bx, s.by, 1.0, S.t * (s.sip > 0 ? 0.8 : 3.4), (s.vx || 0) * 0.2);
    },

    // ============ ROUND 2: the chicken ============
    // ---- 1. egg: the hen keeps it warm, and you roll it the way the arrow shows, day after day
    in_warm(g, s) {
      Object.assign(s, { want: pick([-1, 1]), turns: 0, need: bcT(g, [4, 5, 6]), days: 0, roll: 0, rollTo: 0, drag: null, tilt: 0, henX: 760, sitT: 0, sit: 0, wob: 0, ready: false });
      g.say = 'Egg! A mother hen keeps her egg warm and turns it every day, for 21 days. Roll the egg the way the arrow points!';
      g.tip = 'Drag the egg the way the arrow points!';
    },
    turnEgg(g, s, dir) {
      if (dir === s.want) {
        s.turns++; s.rollTo += dir * Math.PI; s.days = Math.round(21 * s.turns / s.need);
        this.yay(g, 480, 330, `Day ${s.days}!`, 10); s.sitT = 1.5;
        if (s.turns >= s.need) {
          s.ready = true;
          this.later(g, 1.9, () => { this.tell(g, 'Day 21! Peep, peep! The chick inside is ready to hatch.', 'Peep, peep!'); this.later(g, 2.6, () => this.next(g)); });
        } else s.want = Math.random() < 0.6 ? -s.want : s.want;
      } else { s.wob = 0.5; this.oops(g, 480, 320, 'Oops, the other way! Follow the arrow.'); }
    },
    up_warm(g, s, dt, live) {
      s.wob = Math.max(0, s.wob - dt); s.sitT = Math.max(0, s.sitT - dt);
      s.roll = lerp(s.roll, s.rollTo, Math.min(1, dt * 6));
      s.henX = lerp(s.henX, s.sitT > 0 ? 480 : 760, Math.min(1, dt * 5));
      s.sit = clamp(s.sit + (s.sitT > 0 && Math.abs(s.henX - 480) < 30 ? 1 : -1) * dt * 4, 0, 1);
      const free = live && !s.ready && s.sitT <= 0 && s.sit < 0.05 && Math.abs(s.henX - 760) < 40;
      if (!free) { s.drag = null; s.tilt = lerp(s.tilt, 0, Math.min(1, dt * 8)); return; }
      if (pointer.clicked && Math.hypot(pointer.x - 480, pointer.y - 398) < bcT(g, [100, 85, 70])) s.drag = { x0: pointer.x };
      if (s.drag && pointer.down) {
        const dx = pointer.x - s.drag.x0; s.tilt = clamp(dx / 300, -0.3, 0.3);
        if (Math.abs(dx) > bcT(g, [40, 55, 70])) { s.drag = null; this.turnEgg(g, s, Math.sign(dx)); }
      } else { s.drag = null; s.tilt = lerp(s.tilt, 0, Math.min(1, dt * 8)); }
      if (pressed.arrowleft || pressed.a) this.turnEgg(g, s, -1);
      else if (pressed.arrowright || pressed.d) this.turnEgg(g, s, 1);
    },
    dr_warm(g, s) {
      bcNestBack(480, 446, 220);
      const wob = s.wob > 0 ? Math.sin(s.wob * 40) * 0.1 : 0;
      bcHenEgg(480, 398, 46, 58, s.tilt + wob, s.roll);
      bcNestFront(480, 446, 220);
      bcHen(s.henX, 476 - s.sit * 16, 1.3, -1, s.sit);
      if (s.sit > 0.7) { for (let i = 0; i < 3; i++) { const t = (S.t * 0.7 + i / 3) % 1; ctx.globalAlpha = 1 - t; heart(440 + i * 40, 330 - t * 60, 20, '#ff8ab0'); } ctx.globalAlpha = 1; outlined('Warm!', 480, 270, 26, '#fff6a8'); }
      const free = !s.ready && s.sitT <= 0 && s.sit < 0.05;
      if (free) {
        const a = s.want, y = 290, pul = 1 + Math.sin(S.t * 6) * 0.08;
        ctx.save(); ctx.translate(480 + a * (20 + Math.sin(S.t * 6) * 8), y); ctx.scale(a * pul, pul);
        ink(P2('M-60,-14 L20,-14 L20,-36 L66,0 L20,36 L20,14 L-60,14 Z'), '#ffd84a', 2.4);
        ctx.restore();
        outlined(a < 0 ? 'Roll it LEFT' : 'Roll it RIGHT', 480, 236, 26, '#fff');
      }
      // the calendar: 21 days of keeping warm
      panel(30, 300, 220, 150, 18);
      text(`Day ${s.days} of 21`, 140, 328, 22, '#5a2a6e', 'center', 800);
      for (let i = 0; i < 21; i++) { const x = 56 + (i % 7) * 28, y = 362 + Math.floor(i / 7) * 28; inkCircle(x, y, 10, i < s.days ? '#ffb03a' : '#fff4e0', 1.2); }
      // a peek inside the egg: the chick is growing
      const f = s.days / 21, cx = 800, cy = 220;
      panel(cx - 86, cy - 86, 172, 196, 20);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 70, 0, TAU); ctx.clip();
      const gl = ctx.createRadialGradient(cx, cy, 10, cx, cy, 80); gl.addColorStop(0, '#ffe2a0'); gl.addColorStop(1, '#e08a3a'); ctx.fillStyle = gl; ctx.fillRect(cx - 80, cy - 80, 160, 160);
      ctx.globalAlpha = 0.5; bcHenEgg(cx, cy, 50, 64); ctx.globalAlpha = 1;
      if (f < 0.25) { ctx.fillStyle = '#e04a3a'; circle(cx, cy, 5 + f * 20); ctx.strokeStyle = '#e04a3a'; ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a = i; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 30, cx + Math.cos(a + 0.4) * 36, cy + Math.sin(a + 0.4) * 40); ctx.stroke(); } }
      else { ctx.globalAlpha = 0.85; bcChick(cx - 4, cy + 30, 0.4 + f * 1.1, 0, 1, 0.6, 0.5); ctx.globalAlpha = 1; }
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, TAU); ctx.stroke();
      text('Inside the egg', cx, cy + 94, 16, '#5a2a6e', 'center', 800);
    },

    // ---- 2. hatching: the chick pecks a ring round its shell; tap each glowing spot
    in_hatch(g, s) {
      const n = bcT(g, [5, 6, 8]);
      s.spots = Array.from({ length: n }, (_, i) => { const f = i / (n - 1); return [480 - 80 + 160 * f, 296 + Math.sin(f * Math.PI) * 18]; });
      Object.assign(s, { cur: 0, peck: 0, pop: 0, sub: 'peck', fluff: 0, wob: 0 });
      g.say = 'Hatching! The chick pecks a ring around its shell with a tiny egg tooth. Tap each glowing spot to help it peck!';
      g.tip = 'Tap each glowing spot to help the chick peck out!';
    },
    up_hatch(g, s, dt, live) {
      s.peck = Math.max(0, s.peck - dt); s.wob = Math.max(0, s.wob - dt);
      if (s.sub === 'pop') { s.pop = Math.min(1, s.pop + dt / 0.9); if (s.pop >= 1) s.fluff = Math.min(1, s.fluff + dt / 2.2); return; }
      if (!live || !pointer.clicked) return;
      const [sx, sy] = s.spots[s.cur];
      if (Math.hypot(pointer.x - sx, pointer.y - sy) < bcT(g, [44, 32, 21])) {
        s.cur++; s.peck = 0.45; s.wob = 0.3; tone(1300, 0.08, 'sine', 0.08, 0, 1800); tone(1500, 0.08, 'sine', 0.06, 0.1, 2000); burst(sx, sy, 6, { colors: ['#fff4e0', '#ffffff'], spread: 70, up: 40 });
        if (s.cur >= s.spots.length) {
          s.sub = 'pop'; SFX.sparkle(); this.yay(g, 480, 240, 'Peep!', 24);
          this.tell(g, 'Hello, chick! It is wet at first. Soon it dries off, all soft and fluffy.', 'Hello, little chick!');
          this.later(g, 4, () => this.next(g));
        }
      } else if (Math.hypot(pointer.x - 480, pointer.y - 340) < 170) this.oops(g, pointer.x, pointer.y - 20, 'Tap the glowing spot!', g.tier === 1 ? 0.5 : 1);
    },
    zig(s) {
      const p = [[480 - 120, s.spots[0][1] + 10]];
      s.spots.forEach(([x, y], i) => { p.push([x, y]); if (i < s.spots.length - 1) p.push([(x + s.spots[i + 1][0]) / 2, (y + s.spots[i + 1][1]) / 2 + (i % 2 ? -9 : 9)]); });
      p.push([480 + 120, s.spots[s.spots.length - 1][1] + 10]);
      return p;
    },
    dr_hatch(g, s) {
      bcNestBack(480, 470, 320);
      const ex = 480, ey = 340, rx = 96, ry = 120, wob = s.wob > 0 ? Math.sin(s.wob * 50) * 0.04 : Math.sin(S.t * 3) * 0.01;
      const zig = this.zig(s);
      const half = top => { const p = new Path2D(); p.moveTo(zig[0][0], top ? 0 : H); for (const [x, y] of zig) p.lineTo(x, y); p.lineTo(zig[zig.length - 1][0], top ? 0 : H); p.closePath(); return p; };
      if (s.sub === 'pop') {
        bcChick(480, 345, 2.3, 0, 1, 0, 1 - s.fluff);
        ctx.save(); ctx.clip(half(false)); bcHenEgg(ex, ey, rx, ry); ctx.restore();
        bcNestFront(480, 470, 320);
        ctx.save(); ctx.translate(s.pop * 210, -s.pop * 90 + s.pop * s.pop * 150); ctx.rotate(s.pop * 0.9);
        ctx.save(); ctx.clip(half(true)); bcHenEgg(ex, ey, rx, ry); ctx.restore(); ctx.restore();
        if (s.fluff > 0.6) outlined('Fluffy!', 480, 230, 30, '#fff6a8');
        return;
      }
      bcHenEgg(ex, ey, rx, ry, wob);
      bcNestFront(480, 470, 320);
      ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
      if (s.cur > 0) { ctx.beginPath(); zig.slice(1, 2 * s.cur).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
      s.spots.forEach(([x, y], i) => {
        if (i < s.cur) return;
        if (i === s.cur) { const r = bcT(g, [26, 21, 16]) + Math.sin(S.t * 8) * 3; ctx.fillStyle = 'rgba(255,240,140,.7)'; circle(x, y, r); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(120,90,60,.3)'; circle(x, y, 5); }
      });
      if (s.peck > 0 && s.cur > 0) { const [x, y] = s.spots[s.cur - 1]; ink(P2(`M${x - 7},${y + 2} L${x},${y - 12} L${x + 7},${y + 2} Z`), '#ffb030', 1.2); }
    },

    // ---- 3. chick: tap seeds (not pebbles) to feed the chick, and watch it grow feathers
    in_chick(g, s) {
      Object.assign(s, { x: 480, y: 480, dir: 1, target: null, grow: 0, eaten: 0, need: bcT(g, [8, 10, 12]), peck: 0, items: [], half: false, done: false });
      for (let i = 0; i < 4; i++) this.addItem(s, 'seed');
      for (let i = 0; i < bcT(g, [1, 2, 3]); i++) this.addItem(s, 'pebble');
      g.say = 'Chick! The fluffy chick pecks up seeds and grows bigger. Tap the seeds to feed it, but not the pebbles!';
      g.tip = 'Tap the yellow seeds to feed the chick. Not the pebbles!';
    },
    addItem(s, kind) {
      for (let k = 0; k < 40; k++) {
        const x = rand(110, 850), y = rand(408, 518);
        if (Math.hypot(x - s.x, y - s.y) < 110 || s.items.some(it => Math.hypot(it.x - x, it.y - y) < 76)) continue;
        s.items.push({ kind, x, y, drop: 0, wob: 0 }); return;
      }
    },
    up_chick(g, s, dt, live) {
      s.peck = Math.max(0, s.peck - dt);
      for (const it of s.items) { it.drop = Math.min(1, it.drop + dt * 3); it.wob = Math.max(0, it.wob - dt); }
      if (live && !s.done && pointer.clicked) {
        const r = bcT(g, [48, 40, 32]);
        const it = s.items.filter(it => Math.hypot(it.x - pointer.x, it.y - pointer.y) < r).sort((a, b) => Math.hypot(a.x - pointer.x, a.y - pointer.y) - Math.hypot(b.x - pointer.x, b.y - pointer.y))[0];
        if (it && it.kind === 'seed') { s.target = it; tone(1400, 0.06, 'sine', 0.06, 0, 1700); }
        else if (it) { it.wob = 0.5; this.oops(g, it.x, it.y - 30, 'That is a pebble! Chicks eat seeds.'); }
      }
      if (s.target && s.peck <= 0) {
        const t = s.target, dx = t.x - s.x, dy = t.y + 6 - s.y, d = Math.hypot(dx, dy);
        if (Math.abs(dx) > 2) s.dir = Math.sign(dx);
        if (d > 24) { const sp = Math.min(d * 8, 300) * dt; s.x += dx / d * sp; s.y += dy / d * sp; }
        else {
          s.peck = 0.35; s.items.splice(s.items.indexOf(t), 1); s.target = null; s.eaten++; s.grow = s.eaten / s.need;
          chime(s.eaten * 2); burst(t.x, t.y, 6, { colors: ['#ffd23a', '#fff0a0'], spread: 60, up: 40, size: [2, 4] }); floatText(t.x, t.y - 40, 'Yum!', '#fff6a8', false, 20);
          if (s.items.filter(i => i.kind === 'seed').length + s.eaten < s.need) this.addItem(s, 'seed');
          if (!s.half && s.eaten >= Math.ceil(s.need / 2)) { s.half = true; SFX.sparkle(); this.tell(g, 'Look! Its fluffy down is changing into real feathers, and a little red comb is growing!'); }
          if (s.eaten >= s.need) {
            s.done = true; this.yay(g, s.x, s.y - 80, 'All grown up!', 24);
            this.tell(g, 'The chick ate and grew, and grew, and now it is a grown-up hen!', 'All grown up!');
            this.later(g, 3.4, () => this.next(g));
          }
        }
      }
    },
    dr_chick(g, s) {
      for (const it of s.items) {
        const y = it.y - (1 - it.drop) * 200, wob = it.wob > 0 ? Math.sin(it.wob * 40) * 5 : 0;
        ctx.fillStyle = 'rgba(120,80,30,.25)'; ellipse(it.x, it.y + 9, 12, 4);
        if (it.kind === 'seed') { bcSeed(it.x + wob, y, 1.5); if (s.target === it) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(it.x, it.y, 24, 0, TAU); ctx.stroke(); } }
        else bcPebble(it.x + wob, y, 1.6);
      }
      ctx.fillStyle = 'rgba(120,80,30,.25)'; ellipse(s.x, s.y + 2, 30 + s.grow * 20, 7);
      bcChick(s.x, s.y, 1.7, s.grow, s.dir, s.peck > 0 ? 1 : 0);
      rrect(380, 506, 200, 22, 11, 'rgba(48,24,72,.6)'); rrect(384, 510, Math.max(14, 192 * s.grow), 14, 7, '#ffd23a');
      text(`Seeds: ${s.eaten} / ${s.need}`, 480, 517, 13, '#5a2a1a', 'center', 800);
    },

    // ---- 4. hen: drag straw into her nest box; she sits and lays a brand new egg
    in_hen(g, s) {
      const n = bcT(g, [3, 4, 5]), spots = [[150, 470], [300, 500], [690, 500], [840, 470], [230, 410]];
      Object.assign(s, { need: n, filled: 0, drag: null, sub: 'nest', henX: 810, henDir: -1, sit: 0, layT: 0, egg: false });
      s.straws = spots.slice(0, n).map(([x, y]) => ({ x, y, rot: rand(-0.4, 0.4), in: false }));
      g.say = 'Hen! The chick grew up into a hen. She needs a cosy nest to lay her egg. Drag the straw into the nest box!';
      g.tip = 'Drag the straw into the nest box!';
    },
    boxHit(g, x, y) { const p = bcT(g, [55, 38, 24]); return x > 480 - 120 - p && x < 480 + 120 + p && y > 360 - p && y < 470 + p; },
    up_hen(g, s, dt, live) {
      if (s.sub === 'nest' && live) {
        if (pointer.clicked && !s.drag) s.drag = s.straws.find(st => !st.in && Math.hypot(st.x - pointer.x, st.y - pointer.y) < 56) || null;
        if (s.drag && pointer.down) { s.drag.x = pointer.x; s.drag.y = pointer.y; }
        else if (s.drag) {
          const st = s.drag; s.drag = null;
          if (this.boxHit(g, st.x, st.y)) {
            st.in = true; s.filled++; SFX.pick(); noise(0.1, 0.03); this.yay(g, 480, 380, s.filled < s.need ? 'Cosy!' : 'All done!', 10);
            if (s.filled >= s.need) { s.sub = 'lay'; s.layT = 0; this.tell(g, 'What a cosy nest! Here comes the hen.', 'Here comes the hen...'); }
          } else { st.y = clamp(st.y, 330, 515); floatText(st.x, st.y - 30, 'Into the box!', '#fff', false, 20); }
        }
      } else if (s.sub === 'lay') {
        s.layT += dt; const t = s.layT;
        if (t < 1.4) { s.henX = lerp(810, 480, t / 1.4); s.henDir = -1; }
        else if (t < 3.2) { s.sit = Math.min(1, s.sit + dt * 4); if (t - dt < 2 && t >= 2) { tone(500, 0.12, 'square', 0.05); tone(620, 0.16, 'square', 0.05, 0.14); floatText(560, 280, 'Bawk bawk!', '#fff', false, 26); } }
        else if (t < 4.6) { s.egg = true; s.sit = Math.max(0, s.sit - dt * 4); s.henX = lerp(480, 720, (t - 3.2) / 1.4); s.henDir = 1; }
        else { s.sub = 'egg'; s.henDir = -1; this.tell(g, 'She laid an egg! Tap the brand new egg.', 'Tap the new egg!'); }
      } else if (s.sub === 'egg' && live && pointer.clicked && Math.hypot(pointer.x - 480, pointer.y - 384) < bcT(g, [80, 70, 60])) {
        s.sub = 'done'; this.yay(g, 480, 360, 'A new egg!', 30); SFX.sparkle();
        this.tell(g, 'A new egg, and the life cycle starts all over again!', 'Round and round it goes!');
        this.later(g, 3.4, () => this.next(g));
      }
    },
    dr_hen(g, s) {
      // the nest box: back, straw inside, the hen, then the front board
      inkRect(360, 340, 240, 70, '#7a4a2a', 2.5, 6);
      const lvl = s.filled / s.need;
      if (lvl > 0) { ctx.fillStyle = '#f0cc60'; ctx.beginPath(); ctx.ellipse(480, 410 - lvl * 24, 112, 14 + lvl * 10, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; for (let i = 0; i < 10 * lvl; i++) { ctx.beginPath(); ctx.moveTo(380 + i * 22, 404 - lvl * 26); ctx.lineTo(396 + i * 22, 398 - lvl * 30); ctx.stroke(); } }
      if (s.egg) bcHenEgg(480, 384, 22, 28);
      if (s.sub === 'lay' || s.sub === 'egg' || s.sub === 'done' || s.sub === 'nest') bcHen(s.henX, 470 - s.sit * 40, 1.25, s.henDir, s.sit);
      inkRect(354, 404, 252, 76, '#c8844a', 2.5, 8);
      ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 3; for (const y of [428, 454]) { ctx.beginPath(); ctx.moveTo(362, y); ctx.lineTo(598, y); ctx.stroke(); }
      text('NEST', 480, 442, 22, '#fff4e0', 'center', 800);
      if (s.sub === 'nest') { ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; rrect(346, 326, 268, 164, 14, null, 'rgba(255,255,255,.8)', 3); ctx.setLineDash([]); }
      if (s.sub === 'egg') { ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(480, 384, 40 + Math.sin(S.t * 6) * 4, 0, TAU); ctx.stroke(); }
      for (const st of s.straws) if (!st.in) bcStraw(st.x, st.y, st.rot, s.drag === st ? 1.15 : 1);
      text(`Straw: ${s.filled} / ${s.need}`, 480, 506, 18, '#5a2a1a', 'center', 800);
    },

    // ============ the circle: tap the steps in order, then watch it loop ============
    in_recap(g, s) {
      const c = BC_CYC[g.round];
      Object.assign(s, { cards: shuffle([0, 1, 2, 3]).map((step, i) => ({ step, x: 780, y: 128 + i * 102, at: -1 })), placed: 0, loop: -1, bounce: [0, 0, 0, 0], lastSpot: -1 });
      g.say = `Now close the circle! Tap the ${c.name.toLowerCase()}'s life steps in order. What comes first?`;
      g.tip = 'Tap the steps in order to make the circle!';
    },
    up_recap(g, s, dt, live, id) {
      const c = BC_CYC[g.round];
      for (const cd of s.cards) if (cd.at >= 0) { const [sx, sy] = BC_SPOTS[cd.at]; cd.x = lerp(cd.x, sx - BC_CW / 2, Math.min(1, dt * 9)); cd.y = lerp(cd.y, sy - BC_CH / 2, Math.min(1, dt * 9)); }
      s.bounce = s.bounce.map(b => Math.max(0, b - dt * 2.5));
      if (s.loop >= 0) {
        s.loop += dt;
        const spot = Math.floor(((s.loop * 1.4) / (TAU / 4)) % 4);
        if (spot !== s.lastSpot) { s.lastSpot = spot; s.bounce[spot] = 1; chime(spot * 3); }
        if (id === 'bcnext' || s.loop > 8.5) this.next(g);
        return;
      }
      if (!live) return;
      const i = pickId(id, 'bcr:');
      if (i < 0) return;
      const cd = s.cards[i];
      if (cd.at >= 0) return;
      if (cd.step === s.placed) {
        cd.at = s.placed++; SFX.pick(); chime(cd.step * 3);
        if (s.placed === 4) { s.loop = 0; SFX.sparkle(); burst(BC_CX, BC_CY, 30); this.tell(g, c.loop, 'It goes round and round. A life cycle!'); }
        else speak(`${c.steps[cd.step][1]}! What comes next?`);
      } else {
        g.shake[i] = 0.45;
        this.oops(g, cd.x + BC_CW / 2, cd.y, s.placed ? `What comes right after the ${c.steps[s.placed - 1][1].toLowerCase()}?` : 'What comes first of all?');
      }
    },
    recapCard(g, step, x, y, col) {
      const c = BC_CYC[g.round];
      rrect(x + 6, y + 6, BC_CW - 12, BC_CH - 34, 10, '#fffaf2');
      ctx.save(); ctx.beginPath(); ctx.roundRect(x + 6, y + 6, BC_CW - 12, BC_CH - 34, 10); ctx.clip();
      ctx.translate(x + BC_CW / 2, y + 40); ctx.scale(0.62, 0.62); BC_PICS[g.round][step](0, 0); ctx.restore();
      text(c.steps[step][1], x + BC_CW / 2, y + BC_CH - 15, 18, '#fff', 'center', 800);
    },
    dr_recap(g, s) {
      const c = BC_CYC[g.round];
      ctx.fillStyle = 'rgba(255,248,252,.35)'; ctx.fillRect(0, BC_TOP, W, H - BC_TOP);
      // arrows round the circle; the last one leads back to the start
      const ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
      for (let i = 0; i < 4; i++) {
        const lit = s.placed > i + 1 || (i === 3 && s.loop >= 0) || (s.placed === 4);
        const a0 = ang[i] + 0.5, a1 = ang[i] + Math.PI / 2 - 0.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(BC_CX, BC_CY, BC_RX, BC_RY, 0, a0, a1); ctx.stroke();
        ctx.strokeStyle = lit ? (i === 3 ? '#ff8ac0' : '#ffd84a') : '#e8dcef'; ctx.lineWidth = 7; ctx.stroke();
        const hx = BC_CX + Math.cos(a1) * BC_RX, hy = BC_CY + Math.sin(a1) * BC_RY, ta = Math.atan2(Math.cos(a1) * BC_RY, -Math.sin(a1) * BC_RX);
        inkAt(hx, hy, ta, P2('M-6,-14 L16,0 L-6,14 Z'), lit ? (i === 3 ? '#ff8ac0' : '#ffd84a') : '#e8dcef', 2);
      }
      if (s.loop >= 0) {
        const a = -Math.PI / 2 + s.loop * 1.4;
        for (let k = 0; k < 8; k++) { const b = a - k * 0.07; ctx.globalAlpha = 1 - k / 8; star(BC_CX + Math.cos(b) * BC_RX, BC_CY + Math.sin(b) * BC_RY, 12 - k, '#fff6a8', 4); }
        ctx.globalAlpha = 1;
      }
      // the creature in the middle of its own circle
      if (g.round === 0) bcMonarch(BC_CX, BC_CY - 4, 0.7, S.t * 2); else bcHen(BC_CX + 4, BC_CY + 36, 0.62, 1, 0, Math.max(0, Math.sin(S.t * 3)) * 0.4);
      outlined(s.loop >= 0 ? 'Life cycle!' : `${c.name}`, BC_CX, BC_CY + 56, 22, '#fff6a8');
      for (let i = 0; i < 4; i++) {
        const [sx, sy] = BC_SPOTS[i];
        rrect(sx - BC_CW / 2, sy - BC_CH / 2, BC_CW, BC_CH, 14, 'rgba(255,255,255,.6)', 'rgba(91,63,115,.4)', 3);
        if (i >= s.placed) outlined(String(i + 1), sx, sy, 40, 'rgba(255,255,255,.95)', 'center', 'rgba(91,63,115,.35)');
      }
      s.cards.forEach((cd, i) => {
        const col = c.steps[cd.step][2];
        if (cd.at >= 0) {
          const b = s.bounce[cd.at], sc = 1 + Math.sin(b * Math.PI) * 0.12;
          ctx.save(); ctx.translate(cd.x + BC_CW / 2, cd.y + BC_CH / 2); ctx.scale(sc, sc); ctx.translate(-cd.x - BC_CW / 2, -cd.y - BC_CH / 2);
          rrect(cd.x, cd.y, BC_CW, BC_CH, 14, col, 'rgba(255,255,255,.9)', 3); this.recapCard(g, cd.step, cd.x, cd.y, col); ctx.restore();
        } else {
          const x = cd.x + shakeX(g, i);
          button(`bcr:${i}`, x, cd.y, BC_CW, BC_CH - 6, '', { color: CARD_COLS[i], on: s.loop < 0 && !g.hold, key: String(i + 1) });
          this.recapCard(g, cd.step, x, cd.y - 3, col);
        }
      });
      if (s.loop > 1.5 && !g.done) button('bcnext', 780, 450, 160, 56, g.round === 0 ? 'Next ▶' : 'Done ▶', { color: '#5fb87a', size: 22 });
    },
  };

  // --- garden helper: choose three plants, grow them in buckets, and look after them by hand ------------
  // each plant: name, card emoji, petal colour, centre colour, bloom shape
  const GARDEN_PLANTS = {
    sunflower: ['sunflower', '🌻', '#ffd23a', '#8a5030', 'ray'],
    tulip: ['tulip', '🌷', '#ff5f8a', '#ff5f8a', 'cup'],
    rose: ['rose', '🌹', '#e8364a', '#b81e34', 'rose'],
    daisy: ['daisy', '🌼', '#ffffff', '#ffc61a', 'ray'],
    lavender: ['lavender', '🪻', '#9a6ae0', '#7a4ac0', 'spike'],
    strawberry: ['strawberry', '🍓', '#ffffff', '#ffd23a', 'berry'],
  };
  const GARDEN_TOOLS = [['soil', '🟫', 'Soil'], ['seed', '🌰', 'Seeds'], ['water', '💧', 'Water'], ['snip', '✂️', 'Snip'], ['hand', '🧤', 'Hand'], ['look', '🔍', 'Look']];
  // every job: the tool it takes (sun takes none: drag the cloud), its bubble icon, and what is said when it turns up
  const GARDEN_NEEDS = {
    soil: { tool: 'soil', icon: '🟫', say: p => `Drag the soil sack from the shelf to the ${p} bucket and hold it there. Let go right at the line!` },
    seed: { tool: 'seed', icon: '🌰', say: p => `Drag a seed from the shelf and drop it on the ${p} soil. Then keep pressing Push to press it down until it's deep enough!` },
    water: { tool: 'water', icon: '💧', say: p => `The ${p} is thirsty! Drag the watering can over, and stop at the line.` },
    sun: { tool: null, icon: '☀️', say: p => `A cloud is hiding the sun! Drag the cloud away from the ${p}.` },
    snip: { tool: 'snip', icon: '✂️', say: p => `The ${p} has dry brown leaves. Take the scissors and trace along each dotted cutting line!` },
    bugs: { tool: 'hand', icon: '🐛', say: p => `Bugs are crawling on the ${p}! Take the glove, grab each bug and pull it away.` },
    weeds: { tool: 'hand', icon: '🌿', say: p => `Weeds are growing in the ${p} bucket. Take the glove, grab each weed and pull it up!` },
    look: { tool: 'look', icon: '❓', say: p => `The ${p} looks a bit sad. Drag the magnifying glass over it to find out why.` },
  };
  const GB_X = [200, 480, 760], GB_BOT = 452, GB_H = 88, GB_TOP_W = 60, GB_BOT_W = 44, GB_COLS = ['#4fa8ff', '#ff8ac0', '#ffc83a'];
  const GP_TALL = 170, SOIL_LINE = 0.78, LINE_TOL = 0.07;
  const gpBase = p => GB_BOT - GB_H * Math.max(p.soil, 0.05);
  const gpHeight = p => 16 + Math.min(1, p.grow) * GP_TALL;
  // a point on the stem, f = 0 at the soil to 1 at the top (the stem bends when the plant droops)
  const gpStem = (p, f) => [p.x + Math.sin(f * 1.4) * p.droop * 40, gpBase(p) - gpHeight(p) * f];
  const bucketW = f => lerp(GB_BOT_W, GB_TOP_W, f);
  function drawBucket(p, i) {
    const x = p.x, top = GB_BOT - GB_H, col = GB_COLS[i];
    // the inside, the soil heaped in it, then a see-through front so the level shows
    inkEllipse(x, top, GB_TOP_W, 12, 0, mix(col, '#1a2a4a', 0.55), 2);
    if (p.soil > 0) {
      const y = GB_BOT - GB_H * p.soil, w = bucketW(p.soil);
      ctx.fillStyle = p.wet > 0 ? mix('#7a5034', '#3a2414', p.wet) : '#7a5034';
      ctx.beginPath(); ctx.moveTo(x - GB_BOT_W, GB_BOT); ctx.lineTo(x - w, y); ctx.lineTo(x + w, y); ctx.lineTo(x + GB_BOT_W, GB_BOT); ctx.fill();
      inkEllipse(x, y, w, 9, 0, p.wet > 0 ? mix('#9a6a44', '#4a2c18', p.wet) : '#9a6a44', 1);
    }
    const front = P2(`M${x - GB_TOP_W},${top} L${x - GB_BOT_W},${GB_BOT} C${x - 20},${GB_BOT + 10} ${x + 20},${GB_BOT + 10} ${x + GB_BOT_W},${GB_BOT} L${x + GB_TOP_W},${top} C${x + 20},${top + 12} ${x - 20},${top + 12} ${x - GB_TOP_W},${top} Z`);
    ctx.globalAlpha = 0.32; ctx.fillStyle = col; ctx.fill(front); ctx.globalAlpha = 1;
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(front);
    ctx.strokeStyle = mix(col, '#ffffff', 0.4); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, top, GB_TOP_W, 12, 0, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, top - 4, GB_TOP_W - 6, Math.PI + 0.2, -0.2); ctx.stroke();
  }
  // a dashed line to stop at, with an arrow (y in screen pixels)
  function fillLine(x0, x1, y, col = '#ff4a6a') {
    ctx.setLineDash([7, 5]); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]);
    ink(P2(`M${x1 + 4},${y} L${x1 + 16},${y - 7} L${x1 + 16},${y + 7} Z`), col, 1);
  }
  function drawGardenPlant(p) {
    const [, , petal, mid, shape] = GARDEN_PLANTS[p.kind];
    if (!p.seeded) return;
    const base = gpBase(p);
    if (p.grow <= 0.02) { ink(P2(`M${p.x},${base - 10} C${p.x + 8},${base - 4} ${p.x + 6},${base + 4} ${p.x},${base + 4} C${p.x - 6},${base + 4} ${p.x - 8},${base - 4} ${p.x},${base - 10} Z`), '#c8904a', 1.2); return; }
    const sway = Math.sin(S.t * 1.6 + p.x) * 0.03, top = gpStem(p, 1), green = mix('#5ac85a', '#b8a050', p.droop);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x, base);
    for (let f = 0.1; f <= 1.001; f += 0.1) { const [x, y] = gpStem(p, f); ctx.lineTo(x + sway * f * 60, y); }
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = green; ctx.lineWidth = 5; ctx.stroke();
    // a pair of leaves for every bit of growth
    const pairs = Math.min(4, 1 + Math.floor(p.grow * 5));
    for (let i = 0; i < pairs; i++) {
      const f = 0.18 + i * 0.18; if (f > 0.85) break;
      const [x, y] = gpStem(p, f), s = 0.6 + Math.min(1, p.grow) * 0.5;
      for (const d of [-1, 1]) inkAt(x + sway * f * 60, y, d * (1.1 + p.droop * 0.6), P2(`M0,0 C${-8 * s},${-10 * s} ${-6 * s},${-26 * s} 0,${-34 * s} C${6 * s},${-26 * s} ${8 * s},${-10 * s} 0,0 Z`), green, 1.4);
    }
    const tx = top[0] + sway * 60, ty = top[1];
    if (p.grow < 0.7) return;
    if (p.grow < 1) {
      // a bud that swells as the plant gets closer to blooming
      const r = 6 + (p.grow - 0.7) * 30;
      ink(P2(`M${tx},${ty - r * 2} C${tx + r},${ty - r} ${tx + r},${ty} ${tx},${ty + 2} C${tx - r},${ty} ${tx - r},${ty - r} ${tx},${ty - r * 2} Z`), petal === '#ffffff' ? '#e8f0e0' : petal, 1.5);
      ctx.fillStyle = '#5ac85a'; tri(tx - r * 0.8, ty - r * 0.3, tx + r * 0.8, ty - r * 0.3, tx, ty + 3);
      return;
    }
    // in full bloom
    const b = 1 + Math.sin(S.t * 2 + p.x) * 0.03;
    ctx.save(); ctx.translate(tx, ty - 14); ctx.scale(b, b);
    if (shape === 'ray') {
      const n = p.kind === 'sunflower' ? 14 : 12, R = p.kind === 'sunflower' ? 30 : 24;
      for (let i = 0; i < n; i++) { const a = i * TAU / n; inkEllipse(Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66, R * 0.5, R * 0.2, a, petal, 1.2); }
      inkCircle(0, 0, R * 0.42, mid, 1.4);
    } else if (shape === 'cup') {
      ink(P2('M-20,-6 C-22,-30 -10,-34 -6,-26 C-2,-38 2,-38 6,-26 C10,-34 22,-30 20,-6 C16,10 -16,10 -20,-6 Z'), petal, 2);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-8, -10, 4, 10);
    } else if (shape === 'rose') {
      inkCircle(0, 0, 22, petal, 2);
      ctx.strokeStyle = mid; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let a = 0; a < TAU * 2.2; a += 0.2) { const r = 3 + a * 2.6; a ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); }
      ctx.stroke();
    } else if (shape === 'spike') {
      for (let i = 0; i < 9; i++) inkEllipse(Math.sin(i * 2.3) * 4, 10 - i * 7, 7, 5, 0, i % 2 ? petal : mid, 1);
    } else {
      // strawberry: white flowers and red berries hanging off the top
      for (const [dx, dy] of [[-16, -4], [14, -10]]) { for (let i = 0; i < 5; i++) { const a = i * TAU / 5; inkCircle(dx + Math.cos(a) * 6, dy + Math.sin(a) * 6, 5, '#fff', 0.8); } ctx.fillStyle = mid; circle(dx, dy, 3.5); }
      for (const [dx, dy] of [[-4, 18], [22, 14]]) { ink(P2(`M${dx - 9},${dy - 6} C${dx - 10},${dy + 8} ${dx},${dy + 16} ${dx},${dy + 16} C${dx},${dy + 16} ${dx + 10},${dy + 8} ${dx + 9},${dy - 6} Z`), '#ff3a4a', 1.4); ctx.fillStyle = '#5ac85a'; tri(dx - 7, dy - 6, dx + 7, dy - 6, dx, dy - 12); }
    }
    ctx.restore();
  }
  // where the things to grab sit: brown leaves and bugs on the stem, weeds in the soil, the cloud above
  const leafAt = (p, it) => { const [x, y] = gpStem(p, it.f); return [x + it.side * 44, y]; };
  // the dotted cutting line for a dry leaf: a wavy line down past the leaf's stalk, as points to trace in order
  const cutPath = (p, it) => { const [x, y] = gpStem(p, it.f), pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([x + it.side * (22 + Math.sin(t * TAU) * 10), y - 40 + 80 * t]); } return pts; };
  const GARDEN_ACCS = ['🎀', '🕶️', '👑', '🎩', '🦋', '🐞', '✨', '🌈', '🐝', '💖'];
  const bugAt = (p, it) => { const [x, y] = gpStem(p, it.f); return [x + it.side * 12, y]; };
  const weedAt = (p, it) => [p.x + it.dx, gpBase(p) - 4];
  const cloudAt = (p, n) => [p.x + n.drag, gpBase(p) - gpHeight(p) - 70];
  const GT_SHELF = 472, SEED_DEPTH = 0.62;
  // the tools, drawn big enough to carry around
  function drawGardenTool(k, x, y, s, pouring) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
    if (k === 'water') {
      ctx.rotate(pouring ? 0.5 : 0);
      ink(P2('M-16,-12 L16,-12 L14,16 L-14,16 Z M14,-2 L36,-20 L40,-14 L16,6 Z'), '#4fa8e0', 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-4, -12, 11, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-10, -6, 4, 16);
    } else if (k === 'soil') {
      ctx.rotate(pouring ? 1.2 : 0);
      ink(P2('M-18,-18 C-8,-24 8,-24 18,-18 L20,18 C8,22 -8,22 -20,18 Z'), '#d8b878', 2);
      ctx.fillStyle = '#7a5034'; ellipse(0, -18, 14, 4);
      text('SOIL', 0, 2, 10, '#7a5034', 'center', 800);
    } else emoji({ seed: '🌰', snip: '✂️', hand: '🧤', look: '🔍' }[k], 0, 0, 34);
    ctx.restore();
  }
  MG.gardenhelper = {
    slotX: i => W / 2 - 340 + i * 136,
    kind: 'action', title: () => 'Garden Helper', icon: () => '🪴',
    how: () => 'Pick three plants and grow them in buckets! Drag tools from the shelf to fill each bucket with soil up to the line, plant the seed and water it. Then keep watch, and use the right tool to give each plant what it needs.',
    init(g) {
      Object.assign(g, { state: 'choose', chosen: [], plants: [], carry: null, cueT: 0, helped: 0, missed: 0, spills: 0, msg: '', msgT: 0, grab: null, wasDown: false, lx: 0, ly: 0 });
      g.say = 'Choose three plants for your garden!';
    },
    start(g) { speak(g.say); },
    cue(g, p, kind, wait) {
      const items = [];
      if (kind === 'snip') for (const f of shuffle([0.3, 0.55, 0.78]).slice(0, g.tier === 1 ? 2 : 3).sort()) items.push({ f, side: pick([-1, 1]), at: 0 });
      if (kind === 'bugs') for (let i = 0; i < (g.tier === 1 ? 2 : 3); i++) items.push({ f: rand(0.2, 0.8), side: pick([-1, 1]), dir: pick([-1, 1]) });
      if (kind === 'weeds') for (const dx of shuffle([-34, 34]).slice(0, g.tier === 1 ? 1 : 2)) items.push({ dx, pull: 0 });
      // the line to stop at: soil always fills to the same mark, water to a mark that changes
      const line = kind === 'soil' ? SOIL_LINE : kind === 'water' ? rand(0.45, 0.85) : 0;
      p.need = { kind, t: wait, max: wait, items, line, level: kind === 'soil' ? p.soil : 0, hold: 0, drag: 0 };
      if (kind === 'water') p.wet = 0;
      speak(GARDEN_NEEDS[kind].say(GARDEN_PLANTS[p.kind][0]));
    },
    // a job done well: the plant perks up and grows (planting jobs just move on to the next step)
    helped(g, p, perfect = true) {
      const kind = p.need.kind;
      p.need = null; p.droop = 0; g.helped++;
      SFX.sparkle(); burst(p.x, gpBase(p) - gpHeight(p) * 0.6, 18);
      if (kind === 'soil') { floatText(p.x, GB_BOT - GB_H - 30, 'Just right!', '#fff6a8', false, 24); return this.cue(g, p, 'seed', 0); }
      if (kind === 'seed') { p.seeded = true; p.grow = 0.01; floatText(p.x, GB_BOT - GB_H - 30, 'Planted!', '#fff6a8', false, 24); return this.cue(g, p, 'water', 0); }
      p.grow = Math.min(1, p.grow + (perfect ? 0.2 : 0.14));
      if (g.state === 'plant' && g.plants.every(q => q.seeded && q.grow > 0.02 && !q.need)) { g.state = 'grow'; g.cueT = 1.2; g.say = 'Now look after your plants! Watch for what each one needs.'; speak(g.say); }
      if (p.grow >= 1) { floatText(p.x, gpStem(p, 1)[1] - 50, 'In bloom!', '#fff6a8', false, 26); speak(`The ${GARDEN_PLANTS[p.kind][0]} is blooming!`); }
      else floatText(p.x, gpStem(p, 1)[1] - 40, perfect ? 'Growing!' : 'Good!', '#c8ffb0', false, 22);
    },
    msg(g, s) { g.msg = s; g.msgT = 1.8; },
    // just for fun: drag accessories from the tray onto the flowers (drag one off again to take it away)
    decorate(g, id) {
      const down = pointer.down, pressedNow = down && !g.wasDown;
      if (id === 'deco:done') { g.done = true; return; }
      if (pressedNow && !id) {
        const k = GARDEN_ACCS.findIndex((a, i) => Math.abs(pointer.x - this.accX(i)) < 36 && pointer.y > GT_SHELF);
        if (k >= 0) { g.carry = GARDEN_ACCS[k]; SFX.click(); }
        else for (const p of g.plants) {
          const [fx, fy] = this.flowerAt(p), i = (p.acc || []).findIndex(a => Math.hypot(pointer.x - (fx + a.dx), pointer.y - (fy + a.dy)) < 22);
          if (i >= 0) { g.carry = p.acc.splice(i, 1)[0].e; SFX.click(); break; }
        }
      }
      if (!down && g.carry) {
        const p = g.plants.find(p => { const [fx, fy] = this.flowerAt(p); return Math.hypot(pointer.x - fx, pointer.y - fy) < 110; });
        if (p) { const [fx, fy] = this.flowerAt(p); (p.acc = p.acc || []).push({ e: g.carry, dx: clamp(pointer.x - fx, -80, 80), dy: clamp(pointer.y - fy, -90, 120) }); SFX.pick(); burst(pointer.x, pointer.y, 8); }
        g.carry = null;
      }
      g.wasDown = down;
      g.progress = 'Decorate!';
    },
    flowerAt: p => { const [x, y] = gpStem(p, 1); return [x, y - 14]; },
    accX: i => W / 2 - 360 + i * 80,
    // pouring soil or water: the level rises while held; let go at the line (too far spills)
    pour(g, p, n, dt, holding) {
      const rate = (n.kind === 'soil' ? 0.42 : 0.5) * (1 + (g.tier - 1) * 0.2);
      if (holding) {
        n.level += rate * dt;
        if (n.kind === 'soil') p.soil = n.level; else p.wet = Math.min(1, n.level / n.line);
        if (Math.random() < 0.5) n.kind === 'soil' ? tone(rand(90, 160), 0.04, 'triangle', 0.03) : tone(rand(1800, 2600), 0.03, 'sine', 0.02);
        if (n.level > n.line + LINE_TOL + 0.08) return this.spill(g, p, n);
      } else if (n.held) {
        n.held = false;
        if (Math.abs(n.level - n.line) <= LINE_TOL) return this.helped(g, p, Math.abs(n.level - n.line) <= LINE_TOL * 0.5 || n.kind === 'soil');
        if (n.level > n.line) return this.spill(g, p, n);
        this.msg(g, 'A little more!');
      }
      if (holding) n.held = true;
    },
    spill(g, p, n) {
      g.spills++; n.held = false; SFX.miss();
      n.level = Math.max(0, n.line - rand(0.2, 0.32));
      if (n.kind === 'soil') p.soil = n.level; else p.wet = n.level / n.line;
      this.msg(g, n.kind === 'soil' ? 'Too much! It spilled over. Try again!' : 'Too much water! Some ran out. Try again!');
      burst(p.x, GB_BOT - GB_H, 14, { colors: n.kind === 'soil' ? ['#7a5034', '#9a6a44'] : ['#7ad0ff', '#bfe6ff'] });
    },
    update(g, dt, id) {
      g.msgT -= dt;
      if (g.state === 'choose') {
        const kinds = Object.keys(GARDEN_PLANTS);
        const i = id?.startsWith('gp:') ? +id.slice(3) : ['1', '2', '3', '4', '5', '6'].findIndex(k => pressed[k]);
        if (i >= 0) {
          const k = kinds[i], at = g.chosen.indexOf(k);
          if (at >= 0) g.chosen.splice(at, 1); else if (g.chosen.length < 3) { g.chosen.push(k); SFX.pick(); }
        }
        if ((id === 'gp:go' || pressed.enter) && g.chosen.length === 3) {
          g.plants = g.chosen.map((kind, j) => ({ kind, x: GB_X[j], soil: 0, wet: 0, seeded: false, grow: 0, droop: 0, need: null }));
          Object.assign(g, { state: 'plant', timeLeft: [130, 120, 110][g.tier - 1] });
          for (const p of g.plants) this.cue(g, p, 'soil', 0);
          g.say = 'Fill each bucket with soil. Drag the soil sack from the shelf, hold it over a bucket, and let go right at the red line!';
          speak(g.say);
        }
        g.progress = `Chosen ${g.chosen.length} of 3`;
        return;
      }
      if (g.state === 'bloomed') {
        if (id === 'deco:yes') { g.state = 'decorate'; g.say = 'Drag fun things onto your flowers! Press Done when they look just right.'; speak(g.say); }
        if (id === 'deco:no') g.done = true;
        return;
      }
      if (g.state === 'decorate') return this.decorate(g, id);
      g.timeLeft -= dt;
      // new jobs turn up while the plants grow
      if (g.state === 'grow') {
        const busy = g.plants.filter(p => p.need).length, most = g.tier === 1 ? 1 : 2;
        const free = g.plants.filter(p => !p.need && p.grow < 1);
        if ((g.cueT -= dt) <= 0 && busy < most && free.length) {
          this.cue(g, pick(free), pick(['water', 'sun', 'snip', 'bugs', 'weeds', 'look']), [14, 12, 10][g.tier - 1]);
          g.cueT = [2.6, 2, 1.6][g.tier - 1];
        }
      }
      for (const p of g.plants) {
        const n = p.need;
        if (!n || !n.max) { if (!n) p.droop = Math.max(0, p.droop - dt); continue; }
        // a job left too long: the plant wilts and loses a little growth (not while you're in the middle of it)
        if (!n.held && g.grab?.p !== p) n.t -= dt;
        p.droop = Math.min(1, p.droop + dt * 0.06);
        if (n.t <= 0) {
          p.need = null; p.wet = 0; p.grow = Math.max(0.03, p.grow - 0.08); p.droop = 0.8; g.missed++; SFX.miss();
          floatText(p.x, gpStem(p, 1)[1] - 30, 'Wilted...', '#ffb0c4', false, 22);
        }
        // bugs keep crawling up and down the stem
        if (n?.kind === 'bugs') for (const it of n.items) if (g.grab?.it !== it) { it.f += it.dir * dt * 0.12; if (it.f > 0.9 || it.f < 0.15) it.dir *= -1; }
      }
      // the bucket under the pointer
      const over = g.plants.find(p => Math.abs(pointer.x - p.x) < 95 && pointer.y > gpStem(p, 1)[1] - 110 && pointer.y < GB_BOT + 20);
      const down = pointer.down, pressedNow = down && !g.wasDown, moved = Math.hypot(pointer.x - g.lx, pointer.y - g.ly);
      // tools come off the shelf by pressing on one and dragging; letting go puts it back
      if (pressedNow) { const k = GARDEN_TOOLS.findIndex((t, i) => Math.abs(pointer.x - this.slotX(i)) < 60 && pointer.y > GT_SHELF - 8); if (k >= 0) { g.carry = GARDEN_TOOLS[k][0]; SFX.click(); } }
      if (!down && g.carry) {
        const n = over?.need, want = n && GARDEN_NEEDS[n.kind].tool;
        if (want && want !== g.carry) { this.msg(g, `Try the ${GARDEN_TOOLS.find(t => t[0] === want)[2].toLowerCase()}!`); SFX.blip(); }
        else if (n?.kind === 'seed' && !n.placed) { n.placed = true; n.depth = 0; SFX.pop(); this.msg(g, 'Now keep pressing Push!'); }
        g.carry = null;
      }
      // each push presses a dropped seed a little deeper; it's planted once it reaches the green band
      const pushI = id?.startsWith('push:') ? +id.slice(5) : pressed[' '] ? g.plants.findIndex(p => p.need?.kind === 'seed' && p.need.placed) : -1;
      const pushP = g.plants[pushI];
      if (pushP?.need?.kind === 'seed' && pushP.need.placed) {
        const n = pushP.need;
        n.depth = Math.min(1, n.depth + 0.11); n.bump = 0.15; tone(160 - n.depth * 40, 0.08, 'triangle', 0.09);
        if (n.depth >= SEED_DEPTH) this.helped(g, pushP);
      }
      // holding jobs: pouring soil or water, pushing a seed in, looking closely
      for (const p of g.plants) {
        const n = p.need; if (!n) continue;
        const right = g.carry === GARDEN_NEEDS[n.kind].tool, holding = down && over === p && right && !g.grab;
        if (n.kind === 'soil' || n.kind === 'water') this.pour(g, p, n, dt, holding);
        else if (n.kind === 'look') {
          if (holding) { n.hold += dt / 1.2; n.held = true; } else { n.hold = Math.max(0, n.hold - dt); n.held = false; }
          if (n.hold >= 1) {
            { floatText(p.x, gpStem(p, 1)[1] - 40, 'Aha!', '#fff6a8', false, 24); p.grow = Math.min(0.99, p.grow + 0.05); this.cue(g, p, pick(['water', 'snip', 'bugs', 'weeds']), n.max); }
          }
        }
      }
      // grabbing: press on a cloud to drag it, or bring the glove to a bug or weed to take hold of it
      if (down && !g.grab && over?.need) {
        const p = over, n = p.need, near = (pt, r) => Math.hypot(pointer.x - pt[0], pointer.y - pt[1]) < r;
        if (n.kind === 'sun' && pressedNow && !g.carry && near(cloudAt(p, n), 75)) g.grab = { p, kind: 'sun', x0: pointer.x - n.drag };
        else if (n.kind === 'bugs' && g.carry === 'hand') { const it = n.items.find(it => near(bugAt(p, it), 24)); if (it) { g.grab = { p, kind: 'bugs', it }; SFX.click(); } }
        else if (n.kind === 'weeds' && g.carry === 'hand') { const it = n.items.find(it => near(weedAt(p, it), 30) || near([weedAt(p, it)[0], weedAt(p, it)[1] - 30], 28)); if (it) { g.grab = { p, kind: 'weeds', it, y0: pointer.y }; SFX.click(); } }
      }
      const gr = g.grab;
      if (gr) {
        const n = gr.p.need;
        if (!n || n.kind !== gr.kind) g.grab = null;
        else if (gr.kind === 'sun') {
          // drag the cloud far enough to one side and it drifts off
          n.drag = pointer.x - gr.x0;
          if (Math.abs(n.drag) > 150) { g.grab = null; tone(300, 0.3, 'sine', 0.06, 0, 120); this.helped(g, gr.p); }
          else if (!down) { g.grab = null; n.drag = 0; this.msg(g, 'Drag it further away!'); }
        } else if (gr.kind === 'bugs') {
          // pull the bug well away from the plant to flick it off
          gr.it.hx = pointer.x; gr.it.hy = pointer.y;
          const [sx, sy] = gpStem(gr.p, gr.it.f);
          if (Math.hypot(pointer.x - sx, pointer.y - sy) > 90) { n.items.splice(n.items.indexOf(gr.it), 1); g.grab = null; SFX.pop(); floatText(pointer.x, pointer.y, 'Shoo!', '#fff', false, 20); if (!n.items.length) this.helped(g, gr.p); }
          else if (!down) { g.grab = null; delete gr.it.hx; this.msg(g, 'Pull it further away!'); }
        } else {
          // tug the weed upward until its roots pop out
          gr.it.pull = clamp((gr.y0 - pointer.y) / 70, 0, 1);
          if (Math.random() < 0.3 && gr.it.pull > 0.1) tone(140 + gr.it.pull * 200, 0.05, 'sawtooth', 0.02);
          if (gr.it.pull >= 1) { n.items.splice(n.items.indexOf(gr.it), 1); g.grab = null; SFX.pop(); burst(weedAt(gr.p, gr.it)[0], gpBase(gr.p) - 50, 10, { colors: ['#7a5034', '#6a9a2a'] }); if (!n.items.length) this.helped(g, gr.p); }
          else if (!down) { g.grab = null; gr.it.pull = 0; this.msg(g, 'Pull harder! Drag it up.'); }
        }
      }
      // snipping: trace the first leaf's dotted line with the scissors, from the start dot to the end
      if (down && over?.need?.kind === 'snip' && g.carry === 'snip') {
        const p = over, n = p.need, it = n.items[0], pts = cutPath(p, it);
        for (let j = 3; j >= 1; j--) {
          const q = pts[Math.min(pts.length - 1, it.at + j)];
          if (it.at + j < pts.length && Math.hypot(pointer.x - q[0], pointer.y - q[1]) < 20) { it.at += j; if (it.at % 3 === 0) tone(1300 + it.at * 20, 0.04, 'square', 0.03); break; }
        }
        if (it.at === 0 && Math.hypot(pointer.x - pts[0][0], pointer.y - pts[0][1]) > 20 && pointer.clicked) this.msg(g, 'Start at the green dot!');
        if (it.at >= pts.length - 1) {
          const [lx, ly] = leafAt(p, it);
          n.items.shift(); tone(1500, 0.06, 'square', 0.05); burst(lx, ly, 10, { colors: ['#b8a050', '#8a6a30'] });
          floatText(lx, ly - 10, 'Snip!', '#fff', false, 20);
          if (!n.items.length) this.helped(g, p);
        }
      }
      g.wasDown = down; g.lx = pointer.x; g.ly = pointer.y;
      const bloom = g.plants.filter(p => p.grow >= 1).length;
      g.progress = g.state === 'plant' ? `Planted ${g.plants.filter(p => p.seeded).length} of 3` : `Blooming ${bloom} of 3`;
      // growth counts most; wilting and spills take a little off
      const grow = g.plants.reduce((a, p) => a + Math.min(1, p.grow), 0) / 3;
      g.score = clamp(grow - 0.04 * g.missed - 0.015 * g.spills, 0, 1);
      if (bloom === 3 && !g.plants.some(p => p.need)) {
        Object.assign(g, { state: 'bloomed', timeLeft: null, carry: null });
        g.say = 'All your flowers are blooming! Would you like to decorate them?'; speak(g.say); SFX.fanfare();
      } else if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      if (g.state === 'choose') {
        panel(W / 2 - 330, 72, 660, 52, 20);
        text('Choose 3 plants for your garden!', W / 2, 98, 22, '#5a2a6e', 'center', 700);
        Object.entries(GARDEN_PLANTS).forEach(([k, [name, icon]], i) => {
          const x = W / 2 - 3 * 150 + 10 + i * 150, y = 180, on = g.chosen.includes(k);
          button(`gp:${i}`, x, y, 130, 170, '', { color: on ? '#ffb84a' : CARD_COLS[i % CARD_COLS.length], key: String(i + 1) });
          emoji(icon, x + 65, y + 70, 64);
          text(name, x + 65, y + 140, 18, '#fff', 'center', 700);
          if (on) { inkCircle(x + 112, y + 18, 15, '#5fb87a', 1.5); text('✓', x + 112, y + 19, 18, '#fff', 'center', 800); }
        });
        button('gp:go', W / 2 - 110, 400, 220, 60, g.chosen.length === 3 ? 'Plant them!' : `Pick ${3 - g.chosen.length} more`, { color: '#5fb87a', size: 22, on: g.chosen.length === 3 });
        return;
      }
      // a little garden patch for the buckets to sit on
      ctx.fillStyle = 'rgba(122,80,52,.35)'; ellipse(W / 2, GB_BOT + 6, 400, 18);
      g.plants.forEach((p, i) => {
        const n = p.need;
        drawBucket(p, i);
        // the stop line for soil (on the bucket) and water (on a gauge beside it)
        if (n?.kind === 'soil') fillLine(p.x - bucketW(SOIL_LINE) - 6, p.x + bucketW(SOIL_LINE) + 6, GB_BOT - GB_H * SOIL_LINE);
        if (n?.kind === 'water') {
          const gx = p.x + GB_TOP_W + 22, gy0 = GB_BOT, gh = GB_H;
          rrect(gx - 9, gy0 - gh, 18, gh, 8, 'rgba(255,255,255,.85)', OL, 2);
          rrect(gx - 6, gy0 - gh * Math.min(1, n.level), 12, gh * Math.min(1, n.level), 6, '#4fa8ff');
          fillLine(gx - 14, gx + 14, gy0 - gh * n.line);
          emoji('💧', gx, gy0 - gh - 16, 18);
        }
        // weeds come up through the soil, stretching as they're pulled
        if (n?.kind === 'weeds') for (const it of n.items) {
          const [wx, wy] = weedAt(p, it), up = it.pull * 40;
          if (up > 2) { ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 2; for (const d of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(wx, wy - up); ctx.lineTo(wx + d, wy - up + 14 + up * 0.4); ctx.stroke(); } }
          for (const a of [-1.1, -0.4, 0.4, 1.1]) inkAt(wx, wy - up, a, P2('M0,0 L-6,-10 L-2,-12 L-7,-22 L-1,-24 L-4,-34 L0,-40 L4,-34 L1,-24 L7,-22 L2,-12 L6,-10 Z'), '#6a9a2a', 1.3);
          ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wx, wy - up); ctx.lineTo(wx + 2, wy - up - 40); ctx.stroke(); ctx.strokeStyle = '#7aaa3a'; ctx.lineWidth = 2.5; ctx.stroke();
          inkCircle(wx + 2, wy - up - 42, 8, '#ffd23a', 1.3);
        }
        drawGardenPlant(p);
        if (n?.kind === 'snip') n.items.forEach((it, i) => {
          const [x, y] = leafAt(p, it), [sx, sy] = gpStem(p, it.f);
          ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke();
          inkAt(x, y, it.side * 1.3, P2('M0,10 C-9,0 -8,-14 0,-22 C8,-14 9,0 0,10 Z'), '#b8904a', 1.4);
          if (i) return;
          // only the first leaf shows its dotted line: done part solid, the rest dashed, a green dot to start at
          const pts = cutPath(p, it);
          ctx.lineCap = 'round'; ctx.setLineDash([2, 8]);
          ctx.beginPath(); pts.slice(it.at).forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
          ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke(); ctx.setLineDash([]);
          if (it.at > 0) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 6; ctx.beginPath(); pts.slice(0, it.at + 1).forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); }
          inkCircle(pts[0][0], pts[0][1], 7, it.at ? '#ffd84a' : '#5fb87a', 1.2);
          star(pts[16][0], pts[16][1], 8, '#fff6a8', 5);
        });
        if (n?.kind === 'bugs') for (const it of n.items) { const [x, y] = it.hx != null && g.grab?.it === it ? [it.hx, it.hy] : bugAt(p, it); emoji('🐛', x, y, 26); }
        if (n?.kind === 'sun') {
          const [cx, cy] = cloudAt(p, n);
          ctx.fillStyle = `rgba(40,60,90,${0.2 * (1 - Math.abs(n.drag) / 150)})`; ctx.fillRect(cx - 70, cy, 140, GB_BOT - cy);
          ctx.fillStyle = '#eef2fa'; for (const [dx, dy, r] of [[-34, 6, 24], [0, -6, 32], [34, 6, 24], [0, 12, 26]]) circle(cx + dx, cy + dy, r);
          ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy + 4, 62, 34, 0, 0, TAU); ctx.stroke();
          if (!g.grab) outlined('⟷', cx, cy + 4, 26, '#7a8aa8', 'center', '#fff');
        }
        if (n?.kind === 'look') { outlined('?', p.x + 34, gpStem(p, 0.6)[1], 40, '#fff6a8'); if (n.hold > 0) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, gpStem(p, 0.5)[1], 46, -Math.PI / 2, -Math.PI / 2 + TAU * n.hold); ctx.stroke(); } }
        if (n?.kind === 'seed' && n.placed) {
          // the seed sinks into the soil; the gauge beside the bucket shows how deep, with the right depth in green
          const sy = gpBase(p) - 6 + n.depth * 52, gx = p.x + GB_TOP_W + 22, gy0 = gpBase(p), gh = 56;
          n.bump = Math.max(0, (n.bump || 0) - 1 / 60);
          ctx.save(); ctx.beginPath(); ctx.rect(p.x - 70, sy - 40, 140, 80); ctx.clip();
          inkEllipse(p.x, sy - n.bump * 20, 9, 12, 0.3, '#c8904a', 1.3);
          ctx.restore();
          if (n.depth > 0) { ctx.strokeStyle = 'rgba(58,36,20,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, gy0); ctx.lineTo(p.x, sy - 10); ctx.stroke(); }
          rrect(gx - 9, gy0, 18, gh, 8, 'rgba(255,255,255,.85)', OL, 2);
          rrect(gx - 9, gy0 + gh * (SEED_DEPTH - 0.02), 18, gh * 0.16, 4, '#3fbf6a', OL, 1.5);
          inkCircle(gx, gy0 + gh * Math.min(1, n.depth), 6, '#c8904a', 1.2);
          if (g.state === 'plant') button(`push:${g.plants.indexOf(p)}`, p.x - 50, GB_BOT - GB_H - 54, 100, 40, 'Push!', { color: '#5fb87a', size: 18 });
        }
        // the job bubble, with a ring that runs down once the plant is growing (a dropped seed shows its Push button instead)
        if (n && !(n.kind === 'seed' && n.placed)) {
          const by = Math.max(150, Math.min(GB_BOT - GB_H - 44, gpStem(p, 1)[1] - (n.kind === 'sun' ? 140 : 66)));
          inkCircle(p.x, by, 26, '#fffaf2', 2);
          if (n.max) { ctx.strokeStyle = n.t / n.max < 0.3 ? '#ff5a6a' : '#5fb87a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p.x, by, 30, -Math.PI / 2, -Math.PI / 2 + TAU * n.t / n.max); ctx.stroke(); }
          emoji(GARDEN_NEEDS[n.kind].icon, p.x, by, 28);
        }
        outlined(GARDEN_PLANTS[p.kind][0], p.x, GB_BOT - 14, 15, '#fff');
        if (p.acc) { const [fx, fy] = this.flowerAt(p); for (const a of p.acc) emoji(a.e, fx + a.dx, fy + a.dy + Math.sin(S.t * 2 + a.dx) * 2, 34); }
      });
      if (g.state === 'bloomed') {
        panel(W / 2 - 260, 130, 520, 150, 22);
        outlined('All three are blooming!', W / 2, 168, 28, '#ff6fb5', 'center', '#fff');
        text('Want to give them some fun accessories?', W / 2, 204, 18, '#5a2a6e', 'center', 600);
        button('deco:yes', W / 2 - 230, 222, 220, 46, 'Decorate!', { icon: '🎀', color: '#ff6fb5', size: 18 });
        button('deco:no', W / 2 + 10, 222, 220, 46, "I'm done", { icon: '✅', color: '#5fb87a', size: 18 });
        return;
      }
      if (g.state === 'decorate') {
        inkRect(W / 2 - 410, GT_SHELF, 820, 62, '#ffd1e6', 2.5, 10);
        GARDEN_ACCS.forEach((a, i) => { const x = this.accX(i); rrect(x - 34, GT_SHELF + 6, 68, 50, 12, 'rgba(255,255,255,.6)'); emoji(a, x, GT_SHELF + 31, 34); });
        button('deco:done', W - 150, 76, 130, 46, 'Done!', { icon: '✅', color: '#5fb87a', size: 18 });
        if (g.carry) emoji(g.carry, pointer.x, pointer.y, 40);
        return;
      }
      // the tool being carried follows the pointer (pouring when it's over a bucket that wants it)
      if (g.carry && g.state !== 'choose') {
        const over = g.plants.find(p => Math.abs(pointer.x - p.x) < 95 && pointer.y > gpStem(p, 1)[1] - 110 && pointer.y < GB_BOT + 20);
        const pouring = over?.need && GARDEN_NEEDS[over.need.kind].tool === g.carry && (g.carry === 'soil' || g.carry === 'water');
        // while pouring, the spout (or the sack's mouth) sits right at the pointer and the stream falls from there
        if (!pouring) drawGardenTool(g.carry, pointer.x + 22, pointer.y - 26, 1.1, false);
        else {
          ctx.fillStyle = g.carry === 'soil' ? '#7a5034' : '#7ad0ff';
          for (let i = 0; i < 7; i++) circle(pointer.x + Math.sin(i * 2.7) * 5, pointer.y + ((S.t * 280 + i * 15) % 50), 3);
          if (g.carry === 'water') drawGardenTool('water', pointer.x - 48, pointer.y - 5, 1.1, true);
          else drawGardenTool('soil', pointer.x - 20, pointer.y + 4, 1.1, true);
        }
      }
      if (g.msgT > 0) outlined(g.msg, W / 2, 150, 24, '#ffd0dc');
      // the wooden tool shelf: press a tool and drag it out
      inkRect(W / 2 - 410, GT_SHELF, 820, 62, '#c98a4a', 2.5, 10);
      ctx.fillStyle = 'rgba(122,80,52,.35)'; for (let x = W / 2 - 400; x < W / 2 + 400; x += 40) ctx.fillRect(x, GT_SHELF + 8, 2, 46);
      GARDEN_TOOLS.forEach(([k, , label], i) => {
        const x = this.slotX(i), hover = !pointer.down && Math.abs(pointer.x - x) < 60 && pointer.y > GT_SHELF - 8;
        rrect(x - 56, GT_SHELF + 4, 112, 54, 12, hover ? 'rgba(255,246,168,.55)' : 'rgba(255,255,255,.25)');
        if (g.carry === k) { ctx.setLineDash([5, 4]); rrect(x - 50, GT_SHELF + 8, 100, 46, 10, null, 'rgba(255,255,255,.8)', 2); ctx.setLineDash([]); }
        else drawGardenTool(k, x - 18, GT_SHELF + 31, 0.85, false);
        text(label, x + 24, GT_SHELF + 31, 15, '#fff', 'center', 800);
      });
    },
  };

  restage('meadow', {
    bg: 'meadow_bg',
    games: [['butterflycycle', 'petal'], ['gardenhelper', 'petal']],
    intro: ["N:Psst! Want to know a secret? I wasn't ALWAYS a butterfly!", "A:surprised:You weren't?", "N:Nope! I started as a teeny tiny egg. Will you help me grow up, one step at a time? Then we'll visit the hens next door!"],
    mid: ["N:You know all my secrets now! Butterflies need flowers to visit, you know.", "N:Will you grow a little bucket garden for us? Pick three plants and take good care of them!", "A:excited:I'll be the best gardener ever!"],
    outro: ['N:The whole meadow is blooming! Take some petals. Every unicorn I know LOVES petals.', "A:surprised:How did you know about...? Never mind!"],
  });

  // =====================================================================================
  // 2. SEASHELL BEACH
  // =====================================================================================
  // sea things for both beach games; r is roughly the half-size
  function seaThing(kind, x, y, r, col = '#ffb3c8', rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(r / 30, r / 30);
    const lw = 2.2;
    if (kind === 'scallop') {
      ink(P2('M0,26 L-30,-4 C-30,-26 -14,-34 0,-34 C14,-34 30,-26 30,-4 Z'), col, lw);
      ink(P2('M-8,22 L-16,30 L16,30 L8,22 Z'), mix(col, '#7a3a5a', 0.15), lw * 0.8);
      ctx.strokeStyle = mix(col, '#7a3a5a', 0.35); ctx.lineWidth = 2.4;
      for (const k of [-0.75, -0.4, 0, 0.4, 0.75]) { ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(k * 28, -28 + Math.abs(k) * 12); ctx.stroke(); }
    } else if (kind === 'spiral') {
      ink(P2('M-26,8 C-30,-20 -6,-34 14,-24 C32,-14 30,12 14,20 L22,28 L-4,26 C-16,24 -24,18 -26,8 Z'), col, lw);
      ctx.strokeStyle = mix(col, '#5a2a4a', 0.4); ctx.lineWidth = 2.6; ctx.beginPath();
      for (let a = 0; a < 12; a += 0.2) { const rr = 22 - a * 1.7; ctx.lineTo(2 + Math.cos(a) * rr, -4 + Math.sin(a) * rr); }
      ctx.stroke();
    } else if (kind === 'star') {
      const p = new Path2D();
      for (let i = 0; i <= 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? 13 : 32; p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      p.closePath();
      ctx.lineJoin = 'round'; ink(p, col, lw);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; circle(Math.cos(a) * 16, Math.sin(a) * 16, 2.6); circle(Math.cos(a) * 24, Math.sin(a) * 24, 1.8); }
    } else if (kind === 'dollar') {
      inkCircle(0, 0, 28, col, lw);
      ctx.fillStyle = mix(col, '#7a5a3a', 0.25);
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; ellipse(Math.cos(a) * 12, Math.sin(a) * 12, 10, 3.5, a); }
      circle(0, 0, 3);
    } else if (kind === 'fish') {
      ink(P2('M-30,0 L-44,-16 L-42,16 Z'), mix(col, '#ffffff', 0.2), lw);
      inkEllipse(0, 0, 30, 18, 0, col, lw);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-4, 5, 16, 6);
      ctx.fillStyle = '#fff'; circle(14, -4, 6); ctx.fillStyle = '#2a1a2a'; circle(16, -4, 3);
    }
    ctx.restore();
  }
  // Captain-Pinch-style crab, facing the viewer; walk animates the legs
  function drawCrab(x, y, s, walk = 0, col = '#ff6a4a', up = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(60,30,40,.18)'; ellipse(0, 18, 40, 8);
    ctx.strokeStyle = OL; ctx.lineCap = 'round';
    for (const d of [-1, 1]) for (let i = 0; i < 3; i++) {
      const k = Math.sin(walk * 12 + i * 2 + (d > 0 ? 1 : 0)) * 4;
      ctx.lineWidth = 7; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(d * 18, 4 + i * 4); ctx.lineTo(d * (34 + i * 3), 6 + i * 5 + k); ctx.lineTo(d * (40 + i * 3), 18 + i * 2 + k); ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = mix(col, '#7a2010', 0.15); ctx.stroke();
    }
    for (const d of [-1, 1]) {
      const lift = up * 16 + Math.sin(walk * 6 + d) * 3;
      ctx.lineWidth = 8; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(d * 22, -6); ctx.lineTo(d * 36, -20 - lift); ctx.stroke();
      ctx.lineWidth = 4.5; ctx.strokeStyle = col; ctx.stroke();
      ink(P2(`M${d * 36},${-14 - lift} C${d * 24},${-30 - lift} ${d * 34},${-48 - lift} ${d * 48},${-44 - lift} L${d * 40},${-32 - lift} L${d * 52},${-30 - lift} C${d * 54},${-20 - lift} ${d * 46},${-12 - lift} ${d * 36},${-14 - lift} Z`), col, 2);
    }
    inkEllipse(0, 0, 30, 20, 0, col, 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-8, -8, 12, 5, -0.2);
    for (const d of [-1, 1]) {
      ctx.lineWidth = 5; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(d * 8, -14); ctx.lineTo(d * 11, -28); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
      inkCircle(d * 11, -32, 8, '#ffffff', 1.5); ctx.fillStyle = '#2a1a2a'; circle(d * 11 + Math.sin(walk * 3) * 2, -31, 3.6);
    }
    ctx.strokeStyle = '#7a2a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -2, 7, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = '#ff9aa8'; ellipse(-16, 2, 4, 2.5); ellipse(16, 2, 4, 2.5);
    ctx.restore();
  }
  function umbrella(x, y, h, c1, c2, tilt = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h); ctx.stroke();
    ctx.strokeStyle = '#f4f0f8'; ctx.lineWidth = 3; ctx.stroke();
    const top = -h, R = 78;
    ctx.beginPath(); ctx.moveTo(-R, top + 22); ctx.quadraticCurveTo(0, top - 50, R, top + 22); ctx.closePath();
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? c1 : c2; ctx.beginPath(); ctx.moveTo(0, top - 30); ctx.lineTo(-R + i * R / 3, top + 30); ctx.lineTo(-R + (i + 1) * R / 3, top + 30); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? c1 : c2; ctx.beginPath(); ctx.arc(-R + R / 6 + i * R / 3, top + 22, R / 6, 0, Math.PI); ctx.fill(); }
    inkCircle(0, top - 26, 5, c2, 1.5);
    ctx.restore();
  }
  const shoreY = x => 392 + Math.sin(x * 0.01) * 6;
  function beachBack() {
    bdSky('#44c4ff', '#fff2d6');
    // far island with tiny palms
    ink(P2('M520,252 C540,226 600,222 640,236 C660,240 680,246 690,252 Z'), '#8ac87a', 1.5);
    const sg = ctx.createLinearGradient(0, 250, 0, 400);
    sg.addColorStop(0, '#2f9ad8'); sg.addColorStop(0.5, '#3ec2e6'); sg.addColorStop(1, '#7ee6e8');
    ctx.fillStyle = sg; ctx.fillRect(0, 250, W, 160);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(0, 249, W, 2);
  }
  function beachFront() {
    // the lighthouse on its rocks
    for (const [x, y, rx, ry, c] of [[800, 352, 70, 34, '#9a8aa8'], [880, 340, 70, 44, '#8a7a9a'], [940, 356, 50, 30, '#a89ab4'], [840, 370, 60, 22, '#b4a8c0']]) inkEllipse(x, y, rx, ry, 0, c, 2);
    ctx.fillStyle = '#5ab86a'; ellipse(870, 306, 50, 10);
    const lx = 868;
    ink(P2(`M${lx - 34},320 L${lx - 22},132 L${lx + 22},132 L${lx + 34},320 Z`), '#ffffff', 2.5);
    ctx.save(); ctx.clip(P2(`M${lx - 34},320 L${lx - 22},132 L${lx + 22},132 L${lx + 34},320 Z`));
    ctx.fillStyle = '#ff5a5a'; for (const y of [150, 220, 290]) ctx.fillRect(lx - 40, y, 80, 34);
    ctx.restore();
    inkRect(lx - 8, 290, 16, 30, '#7a5a8a', 2, 7);
    inkRect(lx - 30, 122, 60, 12, '#4a4a6a', 2, 3);
    inkRect(lx - 20, 92, 40, 30, '#fff2a8', 2.5, 4);
    ink(P2(`M${lx - 26},94 L${lx},70 L${lx + 26},94 Z`), '#ff5a5a', 2.5);
    // the pier on stilts, reaching out into the sea
    for (let x = 20; x < 360; x += 48) { inkRect(x, 300, 10, 82, '#8a5a3a', 2, 2); ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(x + 5, 380, 12, 3); }
    inkRect(-10, 288, 370, 16, '#c99060', 2.5, 3);
    ctx.strokeStyle = '#a06c40'; ctx.lineWidth = 1.5; for (let x = 10; x < 360; x += 18) { ctx.beginPath(); ctx.moveTo(x, 289); ctx.lineTo(x, 303); ctx.stroke(); }
    for (let x = 0; x <= 350; x += 70) inkRect(x, 262, 7, 28, '#a06c40', 1.6, 2);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 268); ctx.lineTo(356, 268); ctx.stroke();
    inkRect(300, 226, 6, 40, '#5a5a7a', 1.5, 2); inkCircle(303, 222, 8, '#fff6a8', 1.5);
    emoji('🎣', 230, 268, 26);
    // sand: dry at the back, damp near the water
    const sd = ctx.createLinearGradient(0, 390, 0, H);
    sd.addColorStop(0, '#e8c888'); sd.addColorStop(0.18, '#f6dfa6'); sd.addColorStop(1, '#fbe8b8');
    ctx.fillStyle = sd; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, shoreY(x));
    ctx.lineTo(W, H); ctx.fill();
    const R = rng(7);
    ctx.fillStyle = 'rgba(200,160,100,.35)'; for (let i = 0; i < 140; i++) circle(R() * W, 410 + R() * 130, 1 + R() * 1.4);
    // tide pools with their little residents
    for (const [x, y, rx] of [[440, 420, 54], [600, 434, 40]]) {
      inkEllipse(x, y, rx + 8, 13, 0, '#b8a8b8', 1.5);
      const tg = ctx.createLinearGradient(0, y - 10, 0, y + 10); tg.addColorStop(0, '#9ae8f0'); tg.addColorStop(1, '#4ac0e0');
      ctx.fillStyle = tg; ellipse(x, y, rx, 9);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(x - rx * 0.4, y - 3, rx * 0.3, 2);
    }
    seaThing('star', 424, 420, 9, '#ff7a5a', 0.3); seaThing('star', 610, 432, 7, '#c06ae0', -0.2);
    // umbrellas, towels, a bucket and spade, a sandcastle, shells
    umbrella(96, 450, 170, '#ff5f7e', '#ffffff', -0.08);
    inkRect(30, 452, 120, 26, '#5fb8f0', 2, 6); ctx.fillStyle = '#ffffff'; for (let x = 40; x < 150; x += 24) ctx.fillRect(x, 454, 10, 22);
    umbrella(560, 404, 120, '#ffd23a', '#40b0ff', 0.06);
    inkRect(510, 404, 92, 18, '#ff9ac8', 1.8, 5);
    seaThing('spiral', 340, 460, 9, '#ffd0a8', 0.4); seaThing('scallop', 660, 500, 10, '#ffb3c8'); seaThing('dollar', 160, 520, 9, '#f0e0c8');
    seaThing('scallop', 820, 470, 8, '#c8b8ff', 0.5);
    // sandcastle with a flag
    const cx = 900;
    inkRect(cx - 42, 448, 84, 46, '#e8c070', 2.5, 4);
    for (const dx of [-42, 22]) { inkRect(cx + dx, 420, 20, 74, '#e8c070', 2.5, 3); for (let i = 0; i < 3; i++) inkRect(cx + dx + i * 7, 414, 5, 8, '#e8c070', 1.5, 1); }
    inkRect(cx - 9, 470, 18, 24, '#b88a4a', 2, 9);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 32, 414); ctx.lineTo(cx - 32, 388); ctx.stroke();
    ctx.fillStyle = '#ff5f7e'; tri(cx - 32, 388, cx - 12, 394, cx - 32, 400);
    inkRect(756, 500, 28, 26, '#40b0ff', 2, 4); inkRect(752, 496, 36, 7, '#2a8ad8', 1.5, 3);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(800, 520); ctx.lineTo(820, 488); ctx.stroke(); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.stroke();
    ink(P2('M816,486 L830,470 L838,480 L824,494 Z'), '#ffd23a', 1.5);
  }
  BACKDROPS.beach_bg = () => {
    still('b1_beach_back', beachBack);
    bdSunburst(150, 104);
    bdClouds(3, 'rgba(255,255,255,.92)', 92);
    // a sailboat on the horizon and sparkles on the sea
    const bx = ((S.t * 10) % (W + 200)) - 100;
    ink(P2(`M${bx - 22},246 L${bx + 22},246 L${bx + 14},256 L${bx - 14},256 Z`), '#ffffff', 1.5);
    ink(P2(`M${bx},244 L${bx},210 L${bx + 18},242 Z`), '#ff8fc8', 1.5); ink(P2(`M${bx - 2},244 L${bx - 2},216 L${bx - 16},242 Z`), '#fff6a8', 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const x = (i * 131 + S.t * 14) % W, y = 268 + (i * 37) % 110; ctx.globalAlpha = 0.4 + 0.4 * Math.sin(S.t * 3 + i); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 4, x + 20, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // the lighthouse lamp sweeps round
    const a = Math.sin(S.t * 0.9);
    const bl = 300 * Math.abs(a) + 40, bg = ctx.createLinearGradient(868, 0, 868 - bl * Math.sign(a || 1), 0);
    bg.addColorStop(0, 'rgba(255,250,190,.55)'); bg.addColorStop(1, 'rgba(255,250,190,0)');
    ctx.fillStyle = bg; tri(868, 107, 868 - bl * Math.sign(a || 1), 84, 868 - bl * Math.sign(a || 1), 124);
    still('b1_beach_front', beachFront);
    ctx.fillStyle = `rgba(255,240,120,${0.5 + 0.3 * Math.sin(S.t * 4)})`; circle(868, 107, 14);
    // waves washing up the sand
    for (let k = 0; k < 2; k++) {
      const off = Math.sin(S.t * 1.1 + k * 2.2) * 9 + k * 10;
      ctx.fillStyle = k ? 'rgba(255,255,255,.55)' : 'rgba(126,230,232,.75)';
      ctx.beginPath(); ctx.moveTo(360, shoreY(360) - 6);
      for (let x = 360; x <= 780; x += 12) ctx.lineTo(x, shoreY(x) + off + Math.sin(x * 0.06 + S.t * 2) * 3);
      ctx.lineTo(780, shoreY(780) - 6); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, shoreY(x) - 2 + Math.sin(x * 0.05 + S.t * 2.4) * 2);
    ctx.stroke();
    // seagulls
    ctx.strokeStyle = '#4a3a5a'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const x = ((S.t * (26 + i * 6) + i * 320) % (W + 100)) - 50, y = 150 + i * 30 + Math.sin(S.t * 2 + i) * 8, f = Math.sin(S.t * 6 + i) * 5;
      ctx.beginPath(); ctx.moveTo(x - 14, y - f); ctx.quadraticCurveTo(x - 6, y - 8, x, y); ctx.quadraticCurveTo(x + 6, y - 8, x + 14, y - f); ctx.stroke();
    }
  };

  // --- wave dash: dash out for shells when the tide goes out, back before the wave -----
  const WD_DRY = 250, WD_IN = 300, WD_OUT = 830;
  MG.wavedash = {
    kind: 'action', title: () => 'Wave Dash', icon: () => '🌊',
    how: () => 'When the water goes out, scuttle out and grab the shells! Then hurry back to your bucket before the big wave rolls in. The waves get faster every time, and a sneaky purple crab keeps moving shells around. Bump into him to make him drop one! Move with the mouse or the arrow keys.',
    init(g) {
      Object.assign(g, { waves: [5, 6, 6][g.tier - 1], wave: 0, wl: WD_IN, st: 'high', st_t: 1.2, shells: [], carry: [], banked: 0, spawned: 0, cx: 150, cy: 300, walk: 0, tumble: 0, lost: [], caught: 0, rival: { x: W - 40, y: 300, st: 'hide', walk: 0, pause: 0, shell: null } });
      g.say = 'Grab shells when the water goes out. Run back to the bucket before the wave!';
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.st_t -= dt;
      const faster = Math.max(0, g.wave - 1), low = Math.max(1.8, [4.6, 3.9, 3.2][g.tier - 1] - faster * 0.45);
      if (g.st === 'high' && g.st_t <= 0) {
        if (g.wave >= g.waves) { g.done = true; return; }
        g.st = 'out'; g.st_t = 1.4; g.wave++;
        if (g.wave > 1) floatText(W / 2 + 80, 150, 'Faster waves!', '#ffd0dc', false, 28);
        Object.assign(g.rival, { x: g.wl + 30, y: rand(160, 460), st: 'seek', pause: 0.2, shell: null });
        const n = [6, 6, 7][g.tier - 1];
        for (let i = 0; i < n; i++) {
          let x, y, tries = 0;
          do { x = rand(370, WD_OUT - 50); y = rand(130, 490); } while (tries++ < 30 && g.shells.some(s => Math.hypot(s.x - x, s.y - y) < 70));
          g.shells.push({ x, y, kind: pick(['scallop', 'spiral', 'star', 'dollar']), col: pick(['#ffb3c8', '#ffd0a8', '#c8b8ff', '#ffe08a', '#9ae0ff']), rot: rand(-0.5, 0.5), pop: 0 });
          g.spawned++;
        }
      } else if (g.st === 'out') {
        g.wl = lerp(WD_IN, WD_OUT, easeOut(1 - Math.max(0, g.st_t) / 1.4));
        if (g.st_t <= 0) { g.st = 'low'; g.st_t = low; }
      } else if (g.st === 'low' && g.st_t <= 0) {
        g.st = 'warn'; g.st_t = g.warnDur = Math.max(0.9, 1.5 - faster * 0.12); SFX.alert();
        if (g.wave <= 2) speak('Wave coming! Run back!');
      } else if (g.st === 'warn' && g.st_t <= 0) {
        g.st = 'in'; g.st_t = Math.max(0.6, [1.5, 1.25, 1.05][g.tier - 1] * (1 - faster * 0.09)); g.inDur = g.st_t; noise(0.8, 0.05);
      } else if (g.st === 'in') {
        g.wl = lerp(WD_OUT, WD_IN, 1 - Math.max(0, g.st_t) / g.inDur);
        if (g.st_t <= 0) { g.st = 'high'; g.st_t = 1.3; g.wl = WD_IN; }
      }
      // the crab scuttles sideways (it can only go so fast, even after the mouse)
      if (g.tumble > 0) {
        g.tumble -= dt; g.cx = lerp(g.cx, 150, Math.min(1, dt * 4)); g.cy = lerp(g.cy, 320, Math.min(1, dt * 4));
      } else {
        const ox = g.cx, oy = g.cy, sp = 330;
        const ax = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ay = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        if (ax || ay) { g.cx += ax * sp * dt; g.cy += ay * sp * dt; g.usePointer = false; }
        else if (pointerMoved(g)) {
          const dx = pointer.x - g.cx, dy = pointer.y - g.cy, d = Math.hypot(dx, dy);
          if (d > 4) { const m = Math.min(d, sp * dt); g.cx += dx / d * m; g.cy += dy / d * m; }
        }
        g.cx = clamp(g.cx, 50, W - 50); g.cy = clamp(g.cy, 120, 495);
        if (Math.hypot(g.cx - ox, g.cy - oy) > 0.5) g.walk += dt;
        // picking up shells
        for (const s of g.shells) if (!s.got && !s.held && Math.hypot(s.x - g.cx, s.y - g.cy) < 52) { s.got = true; g.carry.push(s); SFX.pick(); floatText(s.x, s.y - 30, '+1', '#fff6a8', false, 22); }
        // back at the bucket: the shells are safe
        if (g.cx < WD_DRY && g.carry.length) {
          g.banked += g.carry.length; chime(g.banked); burst(110, 430, 10);
          floatText(110, 380, `${g.carry.length === 1 ? 'One' : cap(NUM_WORDS[g.carry.length])} safe!`, '#fff6a8', false, 24);
          g.carry = [];
        }
        // caught by the wave: tumble back, and the shells you carried wash away
        if (g.st === 'in' && g.wl < g.cx + 10 && g.cx > WD_IN - 20) {
          g.tumble = 0.9; g.caught++; SFX.fail(); floatText(g.cx, g.cy - 50, 'Whoosh!', '#fff', false, 30);
          for (const s of g.carry) g.lost.push({ x: g.cx, y: g.cy, kind: s.kind, col: s.col, vx: rand(80, 200), vy: rand(-80, 80), life: 1.4 });
          g.carry = [];
        }
      }
      this.rival(g, dt);
      // shells the wave reaches get washed away
      for (const s of g.shells) if (!s.got && g.st === 'in' && g.wl < s.x) { s.got = true; g.lost.push({ x: s.x, y: s.y, kind: s.kind, col: s.col, vx: rand(60, 140), vy: rand(-30, 30), life: 1 }); }
      g.shells = g.shells.filter(s => !s.got);
      for (const l of g.lost) { l.x += l.vx * dt; l.y += l.vy * dt; l.life -= dt; }
      g.lost = g.lost.filter(l => l.life > 0);
      g.progress = `Wave ${Math.max(1, g.wave)} of ${g.waves}`;
      g.score = g.spawned ? clamp(g.banked / g.spawned * 1.1, 0, 1) : 0;
    },
    // the sneaky crab: picks up one shell at a time, carries it off and drops it somewhere else
    rival(g, dt) {
      const r = g.rival, sp = [175, 205, 235][g.tier - 1];
      const walkTo = (x, y) => { const dx = x - r.x, dy = y - r.y, d = Math.hypot(dx, dy); if (d > 2) { const m = Math.min(d, sp * dt); r.x += dx / d * m; r.y += dy / d * m; r.walk += dt; } return d < 8; };
      const drop = () => { if (r.shell) { r.shell.held = false; r.shell.x = r.x; r.shell.y = r.y + 10; r.shell = null; } };
      // when the wave is coming he lets go and hurries back into the sea
      if (g.st !== 'out' && g.st !== 'low') { drop(); r.st = 'hide'; walkTo(W - 30, r.y); return; }
      if ((r.pause -= dt) > 0) return;
      // bumped by Aubrey's crab: he drops what he's carrying
      if (r.shell && Math.hypot(r.x - g.cx, r.y - g.cy) < 56 && g.tumble <= 0) {
        drop(); r.pause = 1.2; r.st = 'seek'; SFX.hit(); floatText(r.x, r.y - 50, 'Hey!', '#e8d0ff', false, 24);
        return;
      }
      if (r.st === 'seek') {
        // go for a shell the player isn't right next to
        if (!r.target || r.target.got || r.target.held || !g.shells.includes(r.target)) {
          const free = g.shells.filter(s => !s.got && !s.held && Math.hypot(s.x - g.cx, s.y - g.cy) > 90);
          r.target = free.length ? pick(free) : null;
          if (!r.target) { walkTo(r.x + Math.sin(S.t) * 20, r.y); return; }
        }
        if (walkTo(r.target.x, r.target.y)) {
          r.shell = r.target; r.shell.held = true; r.target = null; r.st = 'carry'; r.pause = 0.3; tone(500, 0.08, 'triangle', 0.05);
          let x, y, tries = 0;
          do { x = rand(WD_DRY + 120, Math.max(WD_DRY + 160, g.wl - 60)); y = rand(140, 480); } while (tries++ < 20 && Math.hypot(x - r.x, y - r.y) < 160);
          r.dest = [x, y];
        }
      } else if (r.st === 'carry') {
        r.shell.x = r.x; r.shell.y = r.y - 50;
        if (walkTo(...r.dest)) { drop(); r.st = 'seek'; r.pause = 0.7; tone(380, 0.08, 'triangle', 0.05); }
      }
    },
    draw(g) {
      // looking down on the beach: dry sand, wet sand, then the sea rolling in from the right
      const sd = ctx.createLinearGradient(0, 0, W, 0);
      sd.addColorStop(0, '#fbe6b0'); sd.addColorStop(0.3, '#f4d898'); sd.addColorStop(1, '#d8b878');
      ctx.fillStyle = sd; ctx.fillRect(0, 64, W, H - 64);
      ctx.fillStyle = 'rgba(160,120,70,.25)'; ctx.fillRect(WD_IN - 10, 64, W, H - 64);
      ctx.fillStyle = 'rgba(200,160,100,.4)'; for (let i = 0; i < 90; i++) circle((i * 211) % W, 70 + (i * 97) % 470, 1.6);
      // the towel, umbrella shade and bucket: the safe place
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, 64, WD_DRY, H - 64);
      ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(WD_DRY, 70); ctx.lineTo(WD_DRY, H); ctx.stroke(); ctx.setLineDash([]);
      inkRect(30, 380, 160, 110, '#5fb8f0', 2.5, 10); ctx.fillStyle = '#fff'; for (let y = 392; y < 486; y += 26) ctx.fillRect(34, y, 152, 10);
      inkRect(80, 410, 60, 54, '#ff6fae', 2.5, 8); inkRect(74, 404, 72, 12, '#ff3f8a', 2, 5);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(110, 410, 32, Math.PI, 0); ctx.stroke();
      outlined(String(g.banked), 110, 440, 30, '#fff');
      outlined('SAFE', 110, 100, 26, '#5fb8f0', 'center', '#fff');
      text('Bring shells here!', 125, 130, 15, '#5a2a6e', 'center', 700);
      // shells on the wet sand
      for (const s of g.shells) if (!s.held) { ctx.fillStyle = 'rgba(255,255,255,.4)'; circle(s.x, s.y, 30 + Math.sin(S.t * 4 + s.x) * 3); seaThing(s.kind, s.x, s.y, 22, s.col, s.rot); }
      // the sneaky purple crab (drawn before the sea, so he disappears under the water)
      const r = g.rival;
      drawCrab(r.x, r.y, 0.95, r.walk, '#9a6ae0', r.shell ? 1 : 0);
      if (r.shell) seaThing(r.shell.kind, r.x, r.y - 54, 16, r.shell.col);
      // the sea, with a frothy edge
      const wl = g.wl, swell = g.st === 'warn' ? 1 - g.st_t / g.warnDur : 0;
      const edge = y => wl + Math.sin(y * 0.04 + S.t * 3) * 10 + Math.sin(y * 0.11 - S.t * 2) * 5;
      const sg = ctx.createLinearGradient(wl, 0, W, 0);
      sg.addColorStop(0, '#7ee6e8'); sg.addColorStop(0.4, '#3ec2e6'); sg.addColorStop(1, '#2a8ad0');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(W, 64);
      for (let y = 64; y <= H; y += 10) ctx.lineTo(edge(y), y);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 8; ctx.beginPath();
      for (let y = 64; y <= H; y += 10) ctx.lineTo(edge(y) - 2, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let y = 70; y < H; y += 26) circle(edge(y) - 8 + Math.sin(y + S.t * 5) * 4, y, 4);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) { const y = 80 + (i * 53) % 450, x = wl + 40 + ((i * 97 + S.t * 30) % Math.max(40, W - wl - 40)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y); ctx.stroke(); }
      // the wave building up out at sea, then rushing in
      if (g.st === 'warn' || g.st === 'in') {
        const wx = g.st === 'warn' ? W - 40 - swell * 60 : wl + 50;
        ctx.fillStyle = 'rgba(42,138,208,.9)'; ctx.beginPath(); ctx.moveTo(W, 64);
        for (let y = 64; y <= H; y += 10) ctx.lineTo(wx + Math.sin(y * 0.05 + S.t * 6) * 12, y);
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.beginPath();
        for (let y = 64; y <= H; y += 10) ctx.lineTo(wx + Math.sin(y * 0.05 + S.t * 6) * 12 - 4, y);
        ctx.stroke();
        if (g.st === 'warn') { const p = 1 + Math.sin(S.t * 14) * 0.08; outlined('WAVE COMING!', W / 2 + 60, 110, 40 * p, '#ff5f7e', 'center', '#fff'); outlined('⬅ Run back!', W / 2 + 60, 156, 26, '#fff'); }
      } else if (g.st === 'low') outlined(g.st_t < 1.5 ? 'Hurry back soon...' : 'Grab the shells!', W / 2 + 80, 100, 28, '#fff');
      for (const l of g.lost) { ctx.globalAlpha = clamp(l.life, 0, 1); seaThing(l.kind, l.x, l.y, 18, l.col, l.life * 4); }
      ctx.globalAlpha = 1;
      // the crab, with the shells it's carrying held up high
      const spin = g.tumble > 0 ? g.tumble * 9 : 0;
      ctx.save(); ctx.translate(g.cx, g.cy); ctx.rotate(spin);
      drawCrab(0, 0, 1.15, g.walk, '#ff6a4a', g.carry.length ? 1 : 0);
      g.carry.forEach((s, i) => seaThing(s.kind, -20 + (i % 3) * 20, -66 - Math.floor(i / 3) * 18, 13, s.col));
      ctx.restore();
    },
  };

  // --- pirate ship parts: find the parts of Captain Pinch's ship and learn what each one is for ---------
  // key: name, what it's for, how hard (1 = early on), and where to tap
  const SHIP_PARTS = {
    sail: ['sail', 'catches the wind to push the ship across the sea', 1],
    mast: ['mast', 'is the tall pole that holds up the sails', 1],
    crowsnest: ["crow's nest", 'is the lookout basket up high, for spotting land far away', 2],
    flag: ['pirate flag', 'shows everyone that this is a pirate ship', 1],
    anchor: ['anchor', 'is dropped to the sea floor to stop the ship from drifting away', 1],
    helm: ["ship's wheel", 'is what the captain turns to steer the ship', 1],
    cannon: ['cannon', 'fires big booms to scare off other ships', 2],
    hull: ['hull', 'is the body of the ship that floats on the water', 2],
    porthole: ['porthole', 'is a little round window to see outside', 2],
    ladder: ['rope ladder', 'is for climbing up the mast', 2],
  };
  const PS_MAST = 330, PS_DECK = 318;
  // what part of the ship is at (x, y)? (the little parts are checked first)
  function shipPartAt(x, y) {
    const near = (cx, cy, r) => Math.hypot(x - cx, y - cy) < r;
    if ([200, 260, 320].some(px => near(px, 366, 18))) return 'porthole';
    if ([440, 505].some(px => near(px, 356, 22))) return 'cannon';
    if (near(86, 396, 34)) return 'anchor';
    if (near(540, 262, 30)) return 'helm';
    if (near(PS_MAST, 112, 28)) return 'crowsnest';
    if (x > PS_MAST + 2 && x < PS_MAST + 78 && y > 58 && y < 96) return 'flag';
    // the ladder: close to the line from the rail up to the crow's nest
    const ax = 462, ay = PS_DECK, bx = PS_MAST + 18, by = 132, k = clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1);
    if (Math.hypot(ax + (bx - ax) * k - x, ay + (by - ay) * k - y) < 16) return 'ladder';
    if (Math.abs(x - PS_MAST) < 12 && y > 92 && y < PS_DECK) return 'mast';
    if (x > PS_MAST - 76 && x < PS_MAST + 76 && y > 148 && y < 292) return 'sail';
    if (x > 60 && x < 610 && y > PS_DECK && y < 430) return 'hull';
    return null;
  }
  function drawPirateShip(glow) {
    // out on the open sea, with a little island far away
    const sea = ctx.createLinearGradient(0, 236, 0, H);
    sea.addColorStop(0, '#5ad0f0'); sea.addColorStop(1, '#2a8ad0');
    ctx.fillStyle = sea; ctx.fillRect(0, 236, W, H - 236);
    inkEllipse(560, 240, 70, 14, 0, '#f4d898', 1.5); ctx.fillStyle = '#5ac85a'; ellipse(560, 230, 34, 12);
    ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(580, 236); ctx.quadraticCurveTo(586, 210, 596, 196); ctx.stroke(); emoji('🌴', 600, 196, 34);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) { const x = (i * 157 + S.t * 18) % W, y = 260 + (i * 41) % 260; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y); ctx.stroke(); }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bob = Math.sin(S.t * 1.4) * 3;
    ctx.save(); ctx.translate(0, bob);
    // the flag flying from the top of the mast
    const wave = Math.sin(S.t * 4) * 4;
    ink(P2(`M${PS_MAST + 2},60 C${PS_MAST + 30},${56 + wave} ${PS_MAST + 50},${64 - wave} ${PS_MAST + 76},${60 + wave} L${PS_MAST + 76},${94 + wave} C${PS_MAST + 50},${98 - wave} ${PS_MAST + 30},${90 + wave} ${PS_MAST + 2},94 Z`), '#2a1a2a', 2);
    emoji('☠️', PS_MAST + 40, 77, 24);
    // the big sail (behind the mast), puffed out by the wind
    ink(P2(`M${PS_MAST - 72},150 L${PS_MAST + 72},150 C${PS_MAST + 86},210 ${PS_MAST + 86},250 ${PS_MAST + 74},292 L${PS_MAST - 74},292 C${PS_MAST - 62},250 ${PS_MAST - 62},210 ${PS_MAST - 72},150 Z`), '#fffaf0', 2.5);
    ctx.strokeStyle = 'rgba(200,170,130,.5)'; ctx.lineWidth = 2; for (const dx of [-36, 0, 36]) { ctx.beginPath(); ctx.moveTo(PS_MAST + dx, 152); ctx.quadraticCurveTo(PS_MAST + dx + 10, 220, PS_MAST + dx, 290); ctx.stroke(); }
    ctx.fillStyle = '#ff5f7e'; ctx.fillRect(PS_MAST - 74, 200, 152, 14);
    // a little jib sail at the front
    ink(P2(`M${PS_MAST - 20},140 L120,${PS_DECK - 6} L${PS_MAST - 20},${PS_DECK - 6} Z`), '#f4ecdc', 2);
    // the mast and its cross-beams (in front of the sail)
    inkRect(PS_MAST - 8, 60, 16, PS_DECK - 60, '#8a5a34', 2.5, 4);
    for (const y of [148, 290]) inkRect(PS_MAST - 80, y - 4, 160, 9, '#8a5a34', 2, 4);
    // the crow's nest basket
    ink(P2(`M${PS_MAST - 30},104 L${PS_MAST + 30},104 L${PS_MAST + 24},130 L${PS_MAST - 24},130 Z`), '#a8703a', 2.5);
    ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 2; for (let x = PS_MAST - 22; x <= PS_MAST + 22; x += 11) { ctx.beginPath(); ctx.moveTo(x, 106); ctx.lineTo(x, 128); ctx.stroke(); }
    // the rope ladder from the rail up to the crow's nest
    const ax = 462, ay = PS_DECK, bx = PS_MAST + 18, by = 132;
    ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 3;
    for (const o of [-7, 7]) { ctx.beginPath(); ctx.moveTo(ax + o, ay); ctx.lineTo(bx + o, by); ctx.stroke(); }
    for (let k = 0.08; k < 1; k += 0.1) { const x = lerp(ax, bx, k), y = lerp(ay, by, k); ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.stroke(); }
    // the raised deck at the back with the ship's wheel
    inkRect(470, 276, 150, PS_DECK - 276, '#9a6a3a', 2.5, 4);
    inkRect(520, 262, 8, 30, '#6a4424', 1.5, 2);
    ctx.save(); ctx.translate(540, 262); ctx.rotate(Math.sin(S.t * 0.7) * 0.4);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.stroke(); }
    ctx.strokeStyle = '#c8904a'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 29, Math.sin(a) * 29); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 4; ctx.stroke();
    inkCircle(0, 0, 6, '#ffd23a', 1.2);
    ctx.restore();
    // the hull, with planks, a gold stripe, portholes and cannons
    const hull = P2(`M56,${PS_DECK} L620,${PS_DECK - 30} C628,${PS_DECK + 40} 600,420 540,432 L150,432 C100,422 70,380 56,${PS_DECK} Z`);
    ink(hull, '#a0683a', 3);
    ctx.save(); ctx.clip(hull);
    ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 2; for (let y = PS_DECK + 16; y < 432; y += 20) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(640, y - 14); ctx.stroke(); }
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(40, PS_DECK + 22); ctx.lineTo(640, PS_DECK - 10); ctx.lineTo(640, PS_DECK - 2); ctx.lineTo(40, PS_DECK + 30); ctx.fill();
    ctx.restore();
    for (const px of [200, 260, 320]) { inkCircle(px, 366, 14, '#9ad8ff', 2); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(px - 4, 362, 4); }
    for (const px of [440, 505]) { inkRect(px - 18, 342, 36, 28, '#3a2418', 2, 4); inkRect(px - 4, 348, 30, 16, '#4a4a5a', 2, 6); }
    // the anchor hanging off the front on its chain
    ctx.strokeStyle = '#6a6a7a'; ctx.lineWidth = 4; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(78, PS_DECK + 6); ctx.lineTo(86, 372); ctx.stroke(); ctx.setLineDash([]);
    ink(P2('M86,370 L86,414 M66,404 C70,420 102,420 106,404'), '#8a8a9a', 2.5);
    ctx.strokeStyle = '#9a9aaa'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(86, 372); ctx.lineTo(86, 414); ctx.moveTo(66, 404); ctx.quadraticCurveTo(86, 428, 106, 404); ctx.moveTo(74, 382); ctx.lineTo(98, 382); ctx.stroke();
    inkCircle(86, 368, 5, '#9a9aaa', 1.2);
    // a glowing outline round the part being asked about (or just found)
    if (glow) {
      const pulse = 0.6 + 0.4 * Math.sin(S.t * 6);
      ctx.strokeStyle = `rgba(255,232,90,${pulse})`; ctx.lineWidth = 6; ctx.setLineDash([]);
      const ring = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); };
      ({
        sail: () => ctx.strokeRect(PS_MAST - 82, 144, 170, 154),
        mast: () => ctx.strokeRect(PS_MAST - 13, 56, 26, PS_DECK - 56),
        crowsnest: () => ring(PS_MAST, 117, 38),
        flag: () => ctx.strokeRect(PS_MAST - 2, 52, 84, 50),
        anchor: () => ring(86, 396, 38),
        helm: () => ring(540, 262, 40),
        cannon: () => { ring(440, 356, 28); ring(505, 356, 28); },
        hull: () => ctx.stroke(hull),
        porthole: () => { for (const px of [200, 260, 320]) ring(px, 366, 20); },
        ladder: () => { ctx.lineWidth = 26; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.globalAlpha = 1; },
      })[glow]();
    }
    ctx.restore();
    // the sea lapping at the hull
    ctx.fillStyle = 'rgba(62,194,230,.85)'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= 640; x += 16) ctx.lineTo(x, 418 + Math.sin(x * 0.04 + S.t * 2) * 5);
    ctx.lineTo(640, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x <= 640; x += 16) ctx.lineTo(x, 418 + Math.sin(x * 0.04 + S.t * 2) * 5);
    ctx.stroke();
  }
  MG.pirateparts = {
    kind: 'learn', title: () => 'Pirate Ship Parts', icon: () => '🏴‍☠️',
    how: () => "Ahoy! Learn the parts of Captain Pinch's pirate ship. Tap the part he asks for, or pick what a glowing part is used for!",
    init(g) {
      const pool = Object.keys(SHIP_PARTS).filter(k => g.tier > 1 || SHIP_PARTS[k][2] === 1 || Math.random() < 0.5);
      // rounds swap between "find the part", "what is it for?" and (later) "which part would you use to...?"
      const kinds = g.tier === 1 ? ['find', 'use'] : ['find', 'use', 'which'];
      const parts = shuffle(pool).slice(0, [6, 7, 8][g.tier - 1]);
      Object.assign(g, { qs: parts.map((p, i) => ({ part: p, kind: kinds[i % kinds.length] })), round: 0, total: 0, shake: {} });
      g.rounds = g.qs.length;
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const q = g.qs[g.round], [name, use] = SHIP_PARTS[q.part];
      Object.assign(g, { q, tries: 0, state: 'ask', t2: 0, tapped: null, wrong: [] });
      if (q.kind === 'use') {
        // three things a part could be for: the right one and two from other parts
        const others = shuffle(Object.keys(SHIP_PARTS).filter(k => k !== q.part)).slice(0, 2);
        g.choices = shuffle([q.part, ...others]);
        g.say = `What is the ${name} used for?`;
      } else if (q.kind === 'find') g.say = `Can you find the ${name}? Tap it on the ship!`;
      else g.say = `Which part of the ship ${use}? Tap it!`;
      if (g.phase === 'play') speak(g.say);
    },
    right(g) {
      const [name, use] = SHIP_PARTS[g.q.part];
      g.total += [1, 0.5, 0.2, 0][Math.min(3, g.tries)];
      g.state = 'yay'; g.t2 = 3; g.tapped = g.q.part;
      SFX.sparkle(); burst(780, 160, 22);
      speak(`Aye! The ${name} ${use}.`);
    },
    wrongPart(g, k) {
      g.tries++; SFX.miss();
      if (k) { g.tapped = k; const [n2, u2] = SHIP_PARTS[k]; speak(`Arr, that's the ${n2}! It ${u2}. Try again!`); g.flash = 1.8; }
    },
    update(g, dt, id) {
      for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
      g.flash = Math.max(0, (g.flash || 0) - dt);
      if (g.state === 'ask') {
        if (g.q.kind === 'use') {
          const i = id?.startsWith('pp:') ? +id.slice(3) : ['1', '2', '3'].findIndex(k => pressed[k]);
          if (i >= 0 && !g.wrong.includes(i)) {
            if (g.choices[i] === g.q.part) this.right(g);
            else { g.wrong.push(i); g.shake[i] = 0.4; g.tries++; SFX.miss(); speak(`Not quite! That's what the ${SHIP_PARTS[g.choices[i]][0]} does. Try again!`); }
          }
        } else if (pointer.clicked && !id && pointer.x < 640) {
          const k = shipPartAt(pointer.x, pointer.y - Math.sin(S.t * 1.4) * 3);
          if (k === g.q.part) this.right(g);
          else if (k) this.wrongPart(g, k);
        }
      } else if ((g.t2 -= dt) <= 0) {
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      g.progress = `Question ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      // the ship: the part being asked about glows on "what is it for?" rounds, and any part tapped glows too
      const glow = g.state === 'yay' ? g.q.part : g.q.kind === 'use' ? g.q.part : g.flash > 0 ? g.tapped : null;
      drawPirateShip(glow);
      if (g.flash > 0 && g.tapped && g.state === 'ask') outlined(SHIP_PARTS[g.tapped][0], 330, 448, 22, '#fff');
      // Captain Pinch's question board
      const [name, use] = SHIP_PARTS[g.q.part];
      panel(650, 70, 296, 400, 22);
      emoji('🦀', 700, 112, 44);
      text('Captain Pinch asks:', 730, 104, 15, '#9a7aaa', 'left', 700);
      let lines;
      if (g.q.kind === 'find') { lines = wrap(`Find the ${name}!`, 260, 26); lines.forEach((l, i) => outlined(l, 798, 160 + i * 34, 26, '#ff6fb5', 'center', '#fff')); }
      else if (g.q.kind === 'which') { text('Which part of the ship...', 798, 150, 17, '#5a2a6e', 'center', 700); wrap(`...${use}?`, 260, 19).forEach((l, i) => text(l, 798, 182 + i * 26, 19, '#5a2a6e', 'center', 600)); }
      else {
        outlined(`The ${name}...`, 798, 150, 24, '#ff6fb5', 'center', '#fff');
        text('What is it used for?', 798, 182, 16, '#5a2a6e', 'center', 700);
        g.choices.forEach((k, i) => {
          const y = 204 + i * 84, used = g.wrong.includes(i), x = 664 + (g.shake[i] ? Math.sin(g.shake[i] * 50) * 6 : 0);
          const ok = g.state === 'yay' && k === g.q.part;
          button(`pp:${i}`, x, y, 268, 74, '', { color: ok ? '#ffb84a' : used ? '#c9bcd4' : ['#4fa8e0', '#9a6ae0', '#3fbf6a'][i], on: g.state === 'ask' && !used, key: String(i + 1) });
          const u = SHIP_PARTS[k][1].replace(/^is /, '');
          wrap(cap(u), 236, 15).slice(0, 3).forEach((l, j, a) => text(l, x + 134, y + 37 + (j - (a.length - 1) / 2) * 18, 15, '#fff', 'center', 700));
        });
      }
      if (g.state === 'yay') {
        if (g.q.kind !== 'use') wrap(`Aye! The ${name} ${use}.`, 260, 17).forEach((l, i) => text(l, 798, 330 + i * 24, 17, '#3f9a5a', 'center', 700));
        outlined('Aye aye!', 330, 448, 30, '#fff6a8');
      } else if (g.q.kind !== 'use') text('Tap the ship!', 798, 440, 16, '#9a7aaa', 'center', 700);
    },
  };

  restage('beach', {
    bg: 'beach_bg',
    games: [['wavedash', 'shell'], ['pirateparts', 'ribbon']],
    intro: ['N:Ahoy, matey! The tide is going out, and that means SHELLS!', 'N:Dash out and grab them — but scuttle back before the big wave rolls in!', 'A:excited:Aye aye, Captain!'],
    mid: ["N:What a haul! Now, every good pirate knows their ship, matey.", "N:Come aboard me ship, and learn what every part is for!", 'A:excited:Arr! I mean... aye aye, Captain!'],
    outro: ['N:A fine sailor you are! Take these shells, and a ribbon from my old flag.', 'A:happy:Thank you, Captain Pinch!'],
  });

  // =====================================================================================
  // 3. PIP'S BAKERY
  // =====================================================================================
  const FROSTS = { pink: '#ff9ac8', blue: '#8ad4ff', yellow: '#ffe27a', chocolate: '#9a6040' };
  const SPRINKLE_COLS = ['#ff5f7e', '#40b0ff', '#ffd23a', '#5adc7a', '#ffffff', '#c06ae0'];
  // a cupcake standing on (x, y); frost is a FROSTS key or null; tops lists toppings
  function drawCupcake(x, y, s, frost, tops = [], liner = '#ffb3d0') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ink(P2('M-30,0 L-36,-38 L36,-38 L30,0 Z'), liner, 2.2);
    ctx.strokeStyle = mix(liner, '#7a3a5a', 0.3); ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 9.5, -36); ctx.lineTo(i * 8, -2); ctx.stroke(); }
    ink(P2('M-38,-38 C-38,-62 38,-62 38,-38 Z'), '#e8b070', 2.2);
    if (frost) {
      const c = FROSTS[frost];
      const fr = P2('M-42,-38 C-48,-52 -34,-60 -28,-58 C-34,-74 -10,-80 -4,-72 C0,-92 22,-90 22,-74 C34,-78 44,-62 36,-54 C48,-50 46,-38 38,-36 C20,-30 -24,-30 -42,-38 Z');
      ink(fr, c, 2.2);
      ctx.strokeStyle = mix(c, '#ffffff', 0.45); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-30, -48); ctx.quadraticCurveTo(0, -40, 30, -50); ctx.moveTo(-14, -64); ctx.quadraticCurveTo(4, -58, 16, -66); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-16, -60, 6, 3, -0.4);
    }
    const top = frost ? -84 : -58;
    if (tops.includes('sprinkles')) {
      const R = rng(5);
      for (let i = 0; i < 16; i++) {
        const a = R() * Math.PI, rr = 10 + R() * 26;
        ctx.save(); ctx.translate(Math.cos(a) * rr * (R() < 0.5 ? -1 : 1), top + 30 + Math.sin(a) * 10 - R() * 18); ctx.rotate(R() * 3);
        ctx.fillStyle = SPRINKLE_COLS[i % SPRINKLE_COLS.length]; ctx.fillRect(-4, -1.6, 8, 3.2); ctx.restore();
      }
    }
    if (tops.includes('star')) vecStar(tops.includes('cherry') ? -20 : 0, tops.includes('cherry') ? top + 18 : top - 6, 13, '#ffd23a', 2);
    if (tops.includes('cherry')) {
      ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, top - 8); ctx.quadraticCurveTo(6, top - 24, 14, top - 26); ctx.stroke();
      inkCircle(0, top, 11, '#ff2f4a', 2); ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(-4, top - 4, 3);
    }
    ctx.restore();
  }
  function hangingTool(kind, x, y) {
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 6); ctx.stroke();
    if (kind === 'whisk') {
      inkRect(x - 4, y + 4, 8, 36, '#c89060', 1.6, 3);
      ctx.strokeStyle = '#8a8aa8'; ctx.lineWidth = 2;
      for (const w of [-14, -7, 0, 7, 14]) { ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.quadraticCurveTo(x + w * 1.6, y + 70, x, y + 86); ctx.stroke(); }
    } else if (kind === 'ladle') {
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 64); ctx.stroke();
      ctx.strokeStyle = '#d8d8e8'; ctx.lineWidth = 3; ctx.stroke();
      inkEllipse(x, y + 72, 16, 12, 0, '#d8d8e8', 1.8);
    } else if (kind === 'spatula') {
      inkRect(x - 4, y + 4, 8, 40, '#ff8fb8', 1.6, 3); inkRect(x - 12, y + 42, 24, 34, '#ffd0e0', 1.8, 5);
      ctx.fillStyle = 'rgba(91,63,115,.4)'; for (const dx of [-5, 0, 5]) ctx.fillRect(x + dx - 1, y + 50, 2, 18);
    } else if (kind === 'pan') {
      inkRect(x - 4, y + 4, 8, 30, '#4a3a5a', 1.6, 3); inkCircle(x, y + 60, 26, '#e8945a', 2); ctx.fillStyle = '#c8743a'; circle(x, y + 60, 18);
    } else if (kind === 'spoon') {
      inkRect(x - 3, y + 4, 6, 44, '#d8a868', 1.4, 3); inkEllipse(x, y + 58, 10, 14, 0, '#d8a868', 1.6);
    }
  }
  function jar(x, y, w, h, fill, label) {
    inkRect(x, y, w, h, 'rgba(230,245,255,.75)', 2, 8);
    ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x + 3, y + h * 0.3, w - 6, h * 0.7 - 3, 6); ctx.fill();
    inkRect(x - 3, y - 8, w + 6, 10, '#ff8fb8', 1.8, 3);
    if (label) { inkRect(x + 5, y + h * 0.42, w - 10, 16, '#fff8ec', 1.2, 3); text(label, x + w / 2, y + h * 0.42 + 8, 9, '#8a4a6a', 'center', 800); }
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + 5, y + 4, 4, h - 10);
  }
  function bakeryStatic() {
    // wallpaper: warm stripes with tiny hearts
    ctx.fillStyle = '#ffe2d2'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd4c4'; for (let x = 0; x < W; x += 56) ctx.fillRect(x, 0, 28, 440);
    for (let y = 80; y < 440; y += 60) for (let x = (y / 60) % 2 ? 42 : 14; x < W; x += 56) heart(x, y, 9, 'rgba(255,140,170,.35)');
    // dado rail and wainscot
    ctx.fillStyle = '#c98a5a'; ctx.fillRect(0, 300, W, 10);
    ctx.fillStyle = '#e8b890'; ctx.fillRect(0, 310, W, 130);
    ctx.strokeStyle = 'rgba(122,74,40,.4)'; ctx.lineWidth = 2; for (let x = 20; x < W; x += 80) { ctx.strokeRect(x, 324, 60, 100); }
    // the brick oven with a copper hood
    ink(P2('M10,440 L10,190 C10,150 230,150 230,190 L230,440 Z'), '#d0705a', 2.5);
    ctx.strokeStyle = 'rgba(122,40,30,.45)'; ctx.lineWidth = 2;
    for (let y = 196; y < 440; y += 20) { ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(226, y); ctx.stroke(); for (let x = 14 + ((y / 20) % 2) * 20; x < 226; x += 40) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 20); ctx.stroke(); } }
    ink(P2('M0,190 L60,96 L180,96 L240,190 Z'), '#e8945a', 2.5);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(70, 104, 12, 80);
    inkRect(56, 60, 128, 40, '#d8844a', 2.5, 4);
    ink(P2('M50,410 L50,300 C50,244 190,244 190,300 L190,410 Z'), '#3a1a1a', 2.5);
    inkRect(30, 410, 180, 16, '#a8584a', 2, 3);
    // chalkboard menu
    inkRect(300, 68, 244, 130, '#8a5a3a', 3, 8);
    rrect(308, 76, 228, 114, 4, '#2f4a42');
    ctx.font = `700 18px ${FONT}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('~ MENU ~', 422, 90);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(330, 101); ctx.lineTo(514, 101); ctx.stroke();
    [['Cupcakes', '#ffb3d0'], ['Cookies', '#ffe08a'], ['Pies', '#b8e8ff'], ['Muffins', '#c8f0b0']].forEach(([w, c], i) => {
      text(w, 324 + (i % 2) * 112, 120 + Math.floor(i / 2) * 26, 15, c, 'left', 600);
    });
    for (let k = 0; k < 5; k++) heart(366 + k * 28, 166, 12, ['#ffb3d0', '#ffe08a', '#b8e8ff', '#c8f0b0', '#e0c8ff'][k]);
    inkRect(318, 190, 208, 7, '#a0683a', 1.5, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(470, 185, 14, 5); ctx.fillStyle = '#ff9ac8'; ctx.fillRect(490, 185, 10, 5);
    // rail of hanging utensils
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(580, 82); ctx.lineTo(940, 82); ctx.stroke();
    ctx.strokeStyle = '#d8a050'; ctx.lineWidth = 4; ctx.stroke();
    [['whisk', 610], ['ladle', 660], ['pan', 718], ['spatula', 780], ['spoon', 826], ['whisk', 870], ['ladle', 918]].forEach(([k, x]) => hangingTool(k, x, 88));
    // shelf of jars and a cake stand
    inkRect(580, 196, 360, 12, '#a0683a', 2.5, 3);
    for (const x of [600, 900]) { ctx.fillStyle = '#8a5a3a'; tri(x, 208, x + 20, 208, x + 10, 228); }
    jar(592, 150, 40, 46, '#ffffff', 'FLOUR'); jar(640, 158, 36, 38, '#f4f0ff', 'SUGAR');
    jar(684, 162, 30, 34, '#ff9ac8'); jar(720, 162, 30, 34, '#8ad4ff'); jar(756, 162, 30, 34, '#ffe27a');
    ctx.fillStyle = 'rgba(255,255,255,.9)'; for (const x of [690, 726, 762]) for (let k = 0; k < 6; k++) ctx.fillRect(x + (k * 7) % 20, 176 + (k * 5) % 16, 4, 2);
    inkRect(800, 186, 70, 8, '#fff4fb', 2, 3); inkRect(830, 166, 10, 22, '#fff4fb', 1.6, 2);
    drawCupcake(835, 166, 0.42, 'pink', ['cherry']);
    // the glass display case on the counter, full of treats
    inkRect(250, 300, 700, 140, '#c98a5a', 3, 6);
    ctx.fillStyle = '#b07040'; for (let x = 270; x < 940; x += 70) ctx.fillRect(x, 330, 4, 100);
    inkRect(240, 290, 720, 16, '#f4e0c8', 2.5, 4);
    inkRect(300, 200, 400, 92, 'rgba(210,240,255,.55)', 2.5, 10);
    inkRect(304, 252, 392, 6, '#ffffff', 1.5, 2);
    // top shelf: cupcakes; bottom: croissants, donuts, cookies
    ['pink', 'blue', 'yellow', 'chocolate', 'pink'].forEach((f, i) => drawCupcake(336 + i * 52, 250, 0.42, f, [['sprinkles'], ['cherry'], ['star'], ['sprinkles'], ['cherry']][i], ['#ffb3d0', '#b8e0ff', '#c8f0b0', '#ffe08a', '#e0c8ff'][i]));
    emoji('🥐', 600, 230, 34); emoji('🍰', 652, 230, 32);
    for (let i = 0; i < 4; i++) emoji(['🍩', '🍪', '🥐', '🍩'][i], 340 + i * 54, 274, 26);
    emoji('🥧', 560, 274, 30); emoji('🍪', 612, 276, 24); emoji('🧁', 660, 274, 28);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(320, 206); ctx.lineTo(350, 206); ctx.lineTo(320, 280); ctx.closePath(); ctx.fill();
    // cash register and a big cake on a stand
    inkRect(760, 236, 110, 56, '#ff8fb8', 2.5, 8); inkRect(778, 214, 74, 26, '#ffd0e0', 2, 4);
    rrect(786, 220, 58, 14, 3, '#5a8a6a'); text('$ 2', 815, 227, 10, '#d8ffd8', 'center', 800);
    for (let i = 0; i < 6; i++) inkRect(772 + (i % 3) * 22, 246 + Math.floor(i / 3) * 18, 18, 12, '#fff4fb', 1.2, 3);
    inkRect(886, 270, 52, 8, '#fff4fb', 2, 3); inkRect(906, 278, 12, 14, '#fff4fb', 1.6, 2);
    inkRect(890, 230, 44, 40, '#ffd0e0', 2, 8); inkRect(890, 230, 44, 12, '#ffffff', 1.5, 6); inkCircle(912, 224, 6, '#ff2f4a', 1.5);
    // checkerboard floor
    for (let y = 440; y < H; y += 25) for (let x = 0; x < W; x += 40) { ctx.fillStyle = ((x / 40 + (y - 440) / 25) % 2) ? '#fff4ea' : '#ffc8d8'; ctx.fillRect(x, y, 40, 25); }
    ctx.fillStyle = 'rgba(91,63,115,.3)'; ctx.fillRect(0, 438, W, 4);
    // a little rug where everyone stands
    ctx.fillStyle = 'rgba(160,110,200,.18)'; ellipse(480, 500, 380, 30);
  }
  BACKDROPS.bakery_bg = () => {
    still('b1_bakery', bakeryStatic);
    // the fire glows and flickers, bread bakes, steam curls up
    const f = Math.sin(S.t * 9) * 0.5 + Math.sin(S.t * 13) * 0.5;
    const fg = ctx.createRadialGradient(120, 390, 6, 120, 380, 80);
    fg.addColorStop(0, '#fff6a8'); fg.addColorStop(0.4, '#ffb03a'); fg.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = fg; ellipse(120, 384, 66 + f * 4, 40 + f * 6);
    for (let i = 0; i < 4; i++) { const fx = 80 + i * 26; ctx.fillStyle = i % 2 ? '#ffd23a' : '#ff7a2a'; ctx.beginPath(); ctx.moveTo(fx - 12, 408); ctx.quadraticCurveTo(fx - 8, 380 - Math.sin(S.t * 10 + i) * 10, fx, 362 - Math.sin(S.t * 8 + i * 2) * 12); ctx.quadraticCurveTo(fx + 8, 380, fx + 12, 408); ctx.fill(); }
    inkRect(70, 330, 100, 8, '#8a8aa8', 1.5, 2);
    for (const x of [86, 120, 154]) inkEllipse(x, 322, 16, 9, 0, '#e8a860', 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const k = (S.t * 0.4 + i / 3) % 1, x = 100 + i * 20, y = 60 - k * 40;
      ctx.globalAlpha = (1 - k) * 0.7; ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.bezierCurveTo(x - 12, y + 26, x + 12, y + 14, x, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // two pendant lamps with a warm glow
    for (const x of [266, 560]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 40); ctx.stroke();
      const gl = ctx.createRadialGradient(x, 62, 4, x, 70, 90); gl.addColorStop(0, `rgba(255,240,170,${0.55 + f * 0.04})`); gl.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = gl; circle(x, 70, 90);
      ink(P2(`M${x - 26},62 C${x - 26},38 ${x + 26},38 ${x + 26},62 Z`), '#5fb8a0', 2);
      inkCircle(x, 64, 7, '#fff6a8', 1.2);
    }
  };

  // --- frosting rush: decorate each cupcake to match its order before it rolls away ----
  const FR_CUSTOMERS = ['🐰', '🐻', '🐱', '🐶', '🦊', '🐼', '🐨', '🐸', '🐷', '🐭'];
  // --- cupcake factory: press each machine just as a cupcake rolls under it --------------------------
  // [key, label, icon, x on the belt]; the oven between batter and frosting bakes on its own
  const CF_STATIONS = [['batter', 'Batter', '🥣', 170], ['frost', 'Frosting', '🍦', 470], ['sprinkles', 'Sprinkles', '✨', 590], ['cherry', 'Cherry', '🍒', 710], ['box', 'Box it', '📦', 830]];
  const CF_BELT = 352, CF_OVEN = [250, 390];
  // a cupcake at any stage: an empty liner, raw batter, baked, then frosted and topped, maybe boxed
  function drawFactoryCake(c, x, y) {
    if (c.boxed) {
      ink(P2(`M${x - 40},${y} L${x - 40},${y - 70} L${x + 40},${y - 70} L${x + 40},${y} Z`), '#ffd0e6', 2.2);
      ink(P2(`M${x - 44},${y - 70} L${x},${y - 84} L${x + 44},${y - 70} Z`), '#ff9ac8', 2);
      inkRect(x - 6, y - 70, 12, 70, '#ff6fb5', 1.2, 1);
      return;
    }
    if (c.frosted) return drawCupcake(x, y, 0.95, c.frost, [c.has.sprinkles && 'sprinkles', c.has.cherry && 'cherry'].filter(Boolean));
    ctx.save(); ctx.translate(x, y); ctx.scale(0.95, 0.95);
    ink(P2('M-30,0 L-36,-38 L36,-38 L30,0 Z'), '#ffb3d0', 2.2);
    ctx.strokeStyle = '#d888a8'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 9.5, -36); ctx.lineTo(i * 8, -2); ctx.stroke(); }
    if (c.baked) ink(P2('M-38,-38 C-38,-62 38,-62 38,-38 Z'), '#e8b070', 2.2);
    else if (c.batter) ink(P2('M-34,-38 C-30,-48 30,-48 34,-38 Z'), '#fff0c8', 2);
    ctx.restore();
  }
  MG.cupcakefactory = {
    kind: 'action', title: () => 'Cupcake Factory', icon: () => '🧁',
    how: () => "Cupcakes roll along the factory belt! Press each machine just as a cupcake is under it: Batter, then the oven bakes it, then Frosting. Read each cupcake's order tag: only add sprinkles or a cherry if it asks! Then box it. Use the buttons or keys 1 to 5.",
    init(g) {
      const total = [6, 8, 10][g.tier - 1], cakes = [];
      for (let i = 0; i < total; i++) {
        // every order wants frosting; sprinkles and a cherry are up to the customer
        const want = { sprinkles: Math.random() < 0.55, cherry: Math.random() < 0.55 };
        cakes.push({ x: -60 - i * [1000, 760, 560][g.tier - 1], frost: pick(Object.keys(FROSTS)), want, has: {}, batter: false, baked: false, frosted: false, boxed: false, oops: false, done: false, who: pick(FR_CUSTOMERS) });
      }
      Object.assign(g, { cakes, total, good: 0, misses: 0, speed: [56, 62, 74][g.tier - 1], anim: {}, finished: 0 });
      g.say = 'Press each machine just as a cupcake is under it!';
    },
    start(g) { speak(g.say); },
    press(g, k) {
      const [, label, , sx] = CF_STATIONS.find(s => s[0] === k), win = [40, 34, 28][g.tier - 1];
      g.anim[k] = 0.35;
      const c = g.cakes.find(c => !c.done && Math.abs(c.x - sx) < win);
      const splat = s => { g.misses++; SFX.miss(); floatText(sx, CF_BELT - 130, s, '#ffb0c4', false, 22); };
      if (!c) return splat(g.cakes.some(c => !c.done && c.x < sx && c.x > sx - 120) ? 'Too early!' : 'Too late!');
      const good = s => { SFX.pop(); floatText(sx, CF_BELT - 130, Math.abs(c.x - sx) < 8 ? 'Perfect!' : s, '#fff6a8', false, 22); };
      if (k === 'batter') { if (c.batter) return splat('Already full!'); c.batter = true; good('Batter!'); }
      else if (k === 'frost') { if (!c.baked || c.frosted) return splat(c.frosted ? 'Already frosted!' : 'Not baked!'); c.frosted = true; good('Swirl!'); }
      else if (k === 'box') { if (c.boxed) return; c.boxed = true; good('Boxed!'); }
      else {
        // toppings only stick to frosting, and only if the order asks for them
        if (!c.frosted || c.has[k]) return splat(c.frosted ? 'Already on!' : 'Frost it first!');
        c.has[k] = true;
        if (!c.want[k]) { c.oops = true; SFX.miss(); floatText(sx, CF_BELT - 130, `No ${label.toLowerCase()}!`, '#ffb0c4', false, 22); }
        else good(k === 'cherry' ? 'Cherry!' : 'Sprinkle!');
      }
    },
    update(g, dt, id) {
      for (const k in g.anim) g.anim[k] = Math.max(0, g.anim[k] - dt);
      const k = id?.startsWith('cf:') ? id.slice(3) : CF_STATIONS[['1', '2', '3', '4', '5'].findIndex(k => pressed[k])]?.[0];
      if (k) this.press(g, k);
      // the belt speeds up a little as the orders pile up
      const v = g.speed * (1 + g.finished * 0.02);
      for (const c of g.cakes) {
        if (c.done) continue;
        c.x += v * dt;
        if (c.batter && c.x > CF_OVEN[1] - 20) c.baked = true;
        if (c.x > W + 40) {
          // the order is checked at the end of the line
          c.done = true; g.finished++;
          const ok = c.batter && c.frosted && c.boxed && !c.oops && ['sprinkles', 'cherry'].every(t => !!c.has[t] === c.want[t]);
          if (ok) { g.good++; chime(g.good); floatText(W - 70, CF_BELT - 160, `${c.who} Yum!`, '#c8ffb0', false, 24); }
          else { SFX.fail(); floatText(W - 70, CF_BELT - 160, `${c.who} Oh no!`, '#ffb0c4', false, 24); }
        }
      }
      g.progress = `Cupcakes ${g.good} of ${g.total}`;
      g.score = clamp(g.good / g.total - 0.015 * g.misses, 0, 1);
      if (g.finished >= g.total) g.done = true;
    },
    draw(g) {
      // a tidy factory wall behind the line, with a pipe feeding all the machines
      ctx.fillStyle = '#fde6f0'; ctx.fillRect(0, 60, W, CF_BELT - 60);
      ctx.fillStyle = '#f8d4e4'; for (let x = 0; x < W; x += 48) ctx.fillRect(x, 60, 22, CF_BELT - 60);
      ctx.fillStyle = '#f4e4d4'; ctx.fillRect(0, CF_BELT + 26, W, H - CF_BELT - 26);
      ctx.fillStyle = 'rgba(200,170,150,.35)'; for (let x = 0; x < W; x += 60) ctx.fillRect(x, CF_BELT + 26, 2, H);
      inkRect(-10, 92, W + 20, 16, '#c8c8d8', 2, 8);
      // the belt
      inkRect(-10, CF_BELT, W + 20, 26, '#8a8aa8', 2.5, 6);
      ctx.fillStyle = '#6a6a88'; for (let x = -((S.t * g.speed) % 40); x < W; x += 40) ctx.fillRect(x, CF_BELT + 6, 18, 14);
      for (let x = 30; x < W; x += 120) inkCircle(x, CF_BELT + 34, 10, '#c8c8d8', 2);
      // the machines above the belt, each over a dashed "press now" zone
      for (const [k, label, icon, sx] of CF_STATIONS) {
        const a = g.anim[k] || 0, drop = a > 0 ? Math.sin(a / 0.35 * Math.PI) * 18 : 0;
        ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.strokeRect(sx - 30, CF_BELT - 120, 60, 118); ctx.setLineDash([]);
        inkRect(sx - 36, 120, 72, 70, ['#ff9ac8', '#8ad4ff', '#ffd23a', '#ff6f7e', '#c6a2ff'][CF_STATIONS.findIndex(s => s[0] === k)], 2.5, 10);
        emoji(icon, sx, 150, 30);
        inkRect(sx - 10, 190 + drop, 20, 34, '#d8d8e8', 2, 4);
        ink(P2(`M${sx - 14},${224 + drop} L${sx + 14},${224 + drop} L${sx},${242 + drop} Z`), '#b8b8c8', 1.8);
        if (a > 0.1 && k !== 'box') { ctx.fillStyle = k === 'batter' ? '#fff0c8' : k === 'frost' ? '#ffd0e6' : k === 'cherry' ? '#ff2f4a' : '#ffd23a'; for (let i = 0; i < 4; i++) circle(sx + (i - 1.5) * 4, 250 + drop + i * 10 * (1 - a), 4); }
        outlined(label, sx, 132 - 22, 15, '#fff');
      }
      // the oven tunnel
      inkRect(CF_OVEN[0], 214, CF_OVEN[1] - CF_OVEN[0], CF_BELT - 214 + 4, '#c8644a', 2.5, 12);
      inkRect(CF_OVEN[0] + 16, 236, CF_OVEN[1] - CF_OVEN[0] - 32, CF_BELT - 246, `rgba(255,${150 + Math.sin(S.t * 6) * 30},60,.85)`, 2, 8);
      text('OVEN', (CF_OVEN[0] + CF_OVEN[1]) / 2, 226, 14, '#fff', 'center', 800);
      // the cupcakes, each with its order tag hanging under the belt
      for (const c of g.cakes) {
        if (c.done || c.x < -50) continue;
        const inOven = c.x > CF_OVEN[0] + 10 && c.x < CF_OVEN[1] - 10;
        if (!inOven) drawFactoryCake(c, c.x, CF_BELT);
        // the order tag: a picture of the cupcake they want, and the order written out
        rrect(c.x - 58, CF_BELT + 30, 116, 62, 10, '#fffaf2', OL, 1.8);
        ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.x, CF_BELT + 26); ctx.lineTo(c.x, CF_BELT + 30); ctx.stroke();
        drawCupcake(c.x - 34, CF_BELT + 86, 0.5, c.frost, [c.want.sprinkles && 'sprinkles', c.want.cherry && 'cherry'].filter(Boolean));
        const lines = [cap(c.frost)].concat(c.want.sprinkles ? ['+ sprinkles'] : [], c.want.cherry ? ['+ cherry'] : [], !c.want.sprinkles && !c.want.cherry ? ['no toppings'] : []);
        lines.forEach((l, i) => text(l, c.x + 22, CF_BELT + 61 + (i - (lines.length - 1) / 2) * 15, 12, i ? '#5a2a6e' : mix(FROSTS[c.frost], '#3a1a3a', 0.45), 'center', 800));
      }
      // the big buttons for the machines
      CF_STATIONS.forEach(([k, label, icon, sx], i) => button(`cf:${k}`, sx - 52, 462, 104, 56, label, { icon, color: ['#ff6fb5', '#4fa8e0', '#e8a830', '#ff5f7e', '#9a6ae0'][i], size: 14, key: String(i + 1) }));
    },
  };

  // --- bake with Pip: pick a recipe card, then do every step by hand at Pip's kitchen counter --------------
  // the bowl sits in the middle of the counter, Pip's recipe card on the left and the oven on the right.
  // steps: add (drag a scoop/spoon/butter in), crack (knock an egg on the rim), pour (hold until the line),
  // mash, stir (circles), shake, fill (hold batter on each circle), scoop, roll, cut, spread (rub), top
  // (place toppings to match a pattern), bake (slide in, take out at golden) and flip.
  const BW_MAIN = [490, 372, 1], BW_SIDE = [330, 400, 0.72];   // bowl rim centre and size
  const BW_PX = 590, BW_PY = 410, BW_FY = 318;                               // where the tray, pan or dough sits
  const BW_SRC = [318, 420];                                    // where ingredients wait to be picked up
  const BW_TOPS = {
    pep: 'pepperoni', mush: 'mushroom', olive: 'olive', berry: 'blueberry', straw: 'strawberry', banana: 'banana slice',
    cherry: 'cherry', star: 'sugar star', sprk: 'sprinkles', gum: 'gumdrop', mint: 'mint candy', choc: 'chocolate button',
  };
  const BW_FRAC = { 0.25: ['¼', 'a quarter of a'], 0.5: ['½', 'half a'], 0.75: ['¾', 'three quarters of a'], 1: ['1', 'one'] };
  // steps: k = kind, n = amount per tier, t = first tier that has the step
  const BW_RECIPES = [
    { key: 'cupcakes', name: 'Cupcakes', batter: '#ffe2a0', raw: '#fff0b8', gold: '#e8a860', piece: 'tin', frost: '#ff9ac8',
      steps: [{ k: 'crack', n: [1, 2, 2] }, { k: 'pour', ing: 'milk', t: 2 }, { k: 'add', ing: 'flour', n: [2, 2, 3] }, { k: 'add', ing: 'sugar', n: [1, 2, 2], t: 3 },
        { k: 'stir', n: [3, 3, 4] }, { k: 'fill', n: [4, 6, 6] }, { k: 'bake' }, { k: 'spread', ing: 'frosting' }, { k: 'top', tops: ['cherry', 'star', 'sprk'] }] },
    { key: 'pancakes', name: 'Pancakes', batter: '#f8dc9c', raw: '#f8e6b0', gold: '#dc9a48', piece: 'griddle',
      steps: [{ k: 'crack', n: [1, 2, 2] }, { k: 'pour', ing: 'milk' }, { k: 'add', ing: 'flour', n: [2, 2, 3] }, { k: 'add', ing: 'sugar', n: [1, 1, 2], t: 3 },
        { k: 'stir', n: [3, 3, 4] }, { k: 'fill', n: [2, 3, 3] }, { k: 'flip' }, { k: 'top', tops: ['berry', 'straw', 'banana'], n: [3, 5, 7] }] },
    { key: 'cookies', name: 'Chocolate Chip Cookies', short: 'Cookies', batter: '#f0cc90', raw: '#f2d49a', gold: '#d89a50', piece: 'tray', dough: true,
      steps: [{ k: 'add', ing: 'butter' }, { k: 'add', ing: 'sugar', n: [1, 2, 3] }, { k: 'crack', n: [1, 1, 2], t: 2 }, { k: 'add', ing: 'flour', n: [2, 2, 3] },
        { k: 'stir', n: [3, 3, 4] }, { k: 'shake', ing: 'chips' }, { k: 'scoop', n: [4, 6, 6] }, { k: 'bake' }] },
    { key: 'pizza', name: 'Pizza', batter: '#f6e6c0', raw: '#f6e2b8', gold: '#e4aa58', piece: 'pizza', dough: true,
      steps: [{ k: 'add', ing: 'flour', n: [2, 2, 3] }, { k: 'pour', ing: 'water', t: 2 }, { k: 'stir', n: [3, 3, 4] }, { k: 'roll' },
        { k: 'spread', ing: 'sauce' }, { k: 'shake', ing: 'cheese' }, { k: 'top', tops: ['pep', 'mush', 'olive'], n: [4, 6, 8] }, { k: 'bake' }] },
    { key: 'ginger', name: 'Gingerbread Friends', short: 'Gingerbread', batter: '#c88a50', raw: '#cf9258', gold: '#a8642c', piece: 'sheet', dough: true,
      steps: [{ k: 'add', ing: 'butter', t: 2 }, { k: 'add', ing: 'sugar', n: [1, 2, 2] }, { k: 'add', ing: 'flour', n: [2, 2, 3] }, { k: 'crack', n: [1, 1, 1], t: 3 },
        { k: 'stir', n: [3, 3, 4] }, { k: 'roll' }, { k: 'cut', n: [3, 4, 5] }, { k: 'bake' }, { k: 'top', tops: ['gum', 'mint', 'choc'], n: [3, 4, 5] }] },
    { key: 'banana', name: 'Banana Bread', batter: '#e8c48a', raw: '#ecd09a', gold: '#b8783a', piece: 'loaf',
      steps: [{ k: 'mash', n: [5, 7, 9] }, { k: 'crack', n: [1, 2, 2] }, { k: 'add', ing: 'sugar', n: [1, 2, 2] }, { k: 'add', ing: 'flour', n: [2, 2, 3], t: 2 },
        { k: 'stir', n: [3, 3, 4] }, { k: 'fill', n: [1, 1, 1] }, { k: 'top', tops: ['banana'], n: [3, 4, 5], t: 2 }, { k: 'bake' }] },
  ];
  const bwName = r => r.short || r.name;
  const bwStackTop = p => 50 - (Math.max(3, p.spots0 || 3) - 1) * 22 - 4;
  // a short tip in a white pill just under the instruction banner
  function bwTip(str) {
    ctx.font = `800 17px ${FONT}`; const w = ctx.measureText(str).width + 36;
    rrect(592 - w / 2, 118, w, 32, 16, 'rgba(255,255,255,.92)', OL, 1.5);
    text(str, 592, 134, 17, '#5a2a6e', 'center', 800);
  }
  const bwPl = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
  const bwPlW = (n, one, many = one + 's') => `${NUM_WORDS[n] || n} ${n === 1 ? one : many}`;
  function bwStepText(r, s) {
    const n = s.n;
    switch (s.k) {
      case 'crack': return `Crack ${bwPl(n, 'egg')}`;
      case 'pour': return `Pour ${BW_FRAC[s.frac][0]} cup of ${s.ing}`;
      case 'add': return s.ing === 'butter' ? 'Add the butter' : s.ing === 'flour' ? `Add ${bwPl(n, 'scoop')} of flour` : `Add ${bwPl(n, 'spoon')} of sugar`;
      case 'mash': return 'Mash the bananas';
      case 'stir': return r.dough ? `Mix the dough ${bwPl(n, 'time')}` : `Stir ${bwPl(n, 'time')}`;
      case 'fill': return r.piece === 'tin' ? `Fill ${n} cupcake cups` : r.piece === 'griddle' ? `Pour ${bwPl(n, 'pancake')}` : 'Pour into the loaf pan';
      case 'scoop': return `Scoop ${bwPl(n, 'cookie')}`;
      case 'shake': return s.ing === 'chips' ? 'Shake in the chips' : 'Sprinkle on the cheese';
      case 'roll': return 'Roll out the dough';
      case 'cut': return `Cut ${n} gingerbread friends`;
      case 'spread': return s.ing === 'sauce' ? 'Spread the tomato sauce' : 'Frost the cupcakes';
      case 'top': return s.kinds.length > 1 ? 'Toppings in a pattern' : `Add ${bwPl(n, BW_TOPS[s.kinds[0]], BW_TOPS[s.kinds[0]] === 'cherry' ? 'cherries' : undefined)}`;
      case 'bake': return 'Bake until golden';
      case 'flip': return `Flip the ${bwPl(n, 'pancake')}`;
    }
    return '';
  }
  function bwStepSay(r, s) {
    switch (s.k) {
      case 'crack': return `Crack ${bwPlW(s.n, 'egg')}! Pick up an egg and knock it down hard on the edge of the bowl. Two knocks crack it!`;
      case 'pour': return `Pour ${BW_FRAC[s.frac][1]} cup of ${s.ing}! Hold down to pour. Let go when the line turns green!`;
      case 'add': return s.ing === 'butter' ? 'Add the butter! Drag it into the bowl.' : `Add ${bwPlW(s.n, s.ing === 'flour' ? 'scoop' : 'spoon')} of ${s.ing}! Drag each one into the bowl.`;
      case 'mash': return 'Mash the bananas! Tap them again and again to squish them.';
      case 'stir': return 'Stir! Hold down in the bowl and go round and round.';
      case 'fill': return r.piece === 'griddle' ? 'Pour the pancakes! Hold down on each circle. Let go when it turns green!' : 'Pour in the batter! Hold down on each circle. Let go when it turns green!';
      case 'scoop': return 'Scoop the cookies! Drag dough from the bowl onto each circle on the tray.';
      case 'shake': return s.ing === 'chips' ? 'Grab the bag of chocolate chips and shake it over the bowl!' : 'Grab the cheese and shake it all over the pizza!';
      case 'roll': return 'Roll out the dough! Hold the rolling pin and roll it back and forth.';
      case 'cut': return 'Drag the cutter onto each dotted shape!';
      case 'spread': return s.ing === 'sauce' ? 'Spread the sauce! Hold down and rub all over the pizza.' : 'Frost the cupcakes! Hold down and rub over every cupcake.';
      case 'top': return s.kinds.length > 1 ? 'Drag each topping onto the circle with the same picture.' + (s.hidden ? ' For the question marks, keep the pattern going!' : '') : `Drag a ${BW_TOPS[s.kinds[0]]} onto each circle!`;
      case 'bake': return 'Slide it into the oven! Take it out when the arrow is on the golden star.';
      case 'flip': return 'Watch the bubbles! Press Flip when the arrow is on the green.';
    }
    return '';
  }
  const bwBakeCol = (r, b) => (b <= 0.66 ? mix(r.raw, r.gold, b / 0.66) : b <= 0.84 ? r.gold : mix(r.gold, '#5a3418', (b - 0.84) / 0.3));

  // ------------------------------------------------------------------ the kitchen (painted once)
  function bwKitchen() {
    const R = rng(77);
    // tiled wall: soft cream subway tiles
    const wg = ctx.createLinearGradient(0, 0, 0, 330); wg.addColorStop(0, '#ffeedd'); wg.addColorStop(1, '#ffe2c6');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, 330);
    for (let y = 0, row = 0; y < 330; y += 26, row++) for (let x = (row % 2) * -26; x < W; x += 52) {
      rrect(x + 2, y + 2, 48, 22, 5, mix('#fff8ee', '#ffe6cc', R() * 0.6));
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 6, y + 5, 20, 3);
    }
    // a strip of painted tiles with little hearts and flowers
    for (let x = 0; x < W; x += 52) { rrect(x + 2, 290, 48, 26, 4, x % 104 ? '#bfe6f0' : '#ffd0de'); x % 104 ? flower(x + 26, 303, 7, '#ffffff', '#ffd84a', 0.6) : heart(x + 26, 297, 16, '#ff7aa8'); }
    // the window: blue sky, hills and a sun, checked curtains and a sill with pots
    const wx = 300, wy = 126, ww = 230, wh = 150;
    inkRect(wx - 10, wy - 10, ww + 20, wh + 20, '#c98a5a', 3, 10);
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#7ccfff'); sky.addColorStop(1, '#d8f4ff');
    ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    ctx.fillStyle = '#fff6a8'; circle(wx + 176, wy + 40, 22); ctx.fillStyle = 'rgba(255,246,168,.35)'; circle(wx + 176, wy + 40, 36);
    ctx.fillStyle = '#ffffff'; for (const [cx, cy, s] of [[wx + 50, wy + 34, 1], [wx + 120, wy + 60, 0.7]]) { circle(cx, cy, 14 * s); circle(cx + 16 * s, cy - 6 * s, 16 * s); circle(cx + 34 * s, cy, 13 * s); ctx.fillRect(cx, cy, 34 * s, 13 * s); }
    ctx.fillStyle = '#8edc7a'; ellipse(wx + 60, wy + wh + 20, 140, 60); ctx.fillStyle = '#6cc860'; ellipse(wx + 200, wy + wh + 30, 120, 62);
    for (const [tx, ty] of [[wx + 40, wy + 108], [wx + 190, wy + 112]]) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(tx - 3, ty, 6, 20); ctx.fillStyle = '#3fae5a'; circle(tx, ty - 4, 16); ctx.fillStyle = '#ff5f7e'; circle(tx - 6, ty - 8, 3); circle(tx + 6, ty, 3); }
    ctx.restore();
    ctx.strokeStyle = '#c98a5a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, ww, wh);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.moveTo(wx + 10, wy + 10); ctx.lineTo(wx + 40, wy + 10); ctx.lineTo(wx + 10, wy + 60); ctx.closePath(); ctx.fill();
    // gingham curtains
    for (const side of [-1, 1]) {
      const cx = side < 0 ? wx - 14 : wx + ww + 14;
      const p = P2(side < 0 ? `M${cx - 14},${wy - 18} L${cx + 46},${wy - 18} C${cx + 30},${wy + 50} ${cx + 10},${wy + 80} ${cx + 22},${wy + 100} C${cx + 30},${wy + 130} ${cx + 10},${wy + 160} ${cx - 4},${wy + 172} L${cx - 14},${wy + 172} Z`
        : `M${cx + 14},${wy - 18} L${cx - 46},${wy - 18} C${cx - 30},${wy + 50} ${cx - 10},${wy + 80} ${cx - 22},${wy + 100} C${cx - 30},${wy + 130} ${cx - 10},${wy + 160} ${cx + 4},${wy + 172} L${cx + 14},${wy + 172} Z`);
      ink(p, '#ffc0d4', 2);
      ctx.save(); ctx.clip(p); ctx.fillStyle = 'rgba(255,111,160,.35)';
      for (let i = -60; i < 60; i += 12) { ctx.fillRect(cx + i, wy - 20, 6, 200); } for (let j = wy - 20; j < wy + 180; j += 12) ctx.fillRect(cx - 60, j, 120, 6);
      ctx.restore();
      inkRect(cx - (side < 0 ? -6 : 22), wy + 92, 16, 10, '#ff6fa0', 1.5, 4);
    }
    inkRect(wx - 30, wy - 26, ww + 60, 12, '#c98a5a', 2, 5);
    // sill with two pots of herbs
    inkRect(wx - 20, wy + wh + 8, ww + 40, 12, '#e0a878', 2, 4);
    for (const [px, c] of [[wx + 40, '#ff8a6a'], [wx + 190, '#6ab0ff']]) {
      for (let i = -2; i <= 2; i++) inkEllipse(px + i * 7, wy + wh - 14 - Math.abs(i) * -3, 6, 13, i * 0.3, '#5cc85a', 1);
      ink(P2(`M${px - 16},${wy + wh - 6} L${px + 16},${wy + wh - 6} L${px + 12},${wy + wh + 10} L${px - 12},${wy + wh + 10} Z`), c, 1.8);
    }
    // utensil rail and a shelf of jars
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(566, 124); ctx.lineTo(752, 124); ctx.stroke();
    ctx.strokeStyle = '#e0a850'; ctx.lineWidth = 4; ctx.stroke();
    [['whisk', 590], ['ladle', 636], ['spatula', 684], ['spoon', 728]].forEach(([k, x]) => hangingTool(k, x, 130));
    inkRect(560, 262, 196, 10, '#c98a5a', 2.2, 3);
    jar(572, 222, 34, 40, '#ffffff', 'FLOUR'); jar(614, 228, 30, 34, '#ff9ac8'); jar(652, 226, 30, 36, '#ffe27a'); jar(690, 230, 26, 32, '#8ad4ff');
    inkCircle(735, 248, 14, '#ff8a3a', 1.6); ctx.fillStyle = '#5cc85a'; ellipse(735, 232, 4, 7);
    // the oven: copper hood above a mint range with a window door
    ink(P2('M778,118 L940,118 L958,214 L760,214 Z'), '#e8945a', 2.5);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(796, 124, 10, 84);
    inkRect(770, 208, 180, 14, '#c8743a', 2, 4);
    inkRect(772, 300, 176, 248, '#8edcc4', 3, 12);
    inkRect(764, 294, 192, 16, '#5a6a7a', 2.5, 5);
    for (const bx of [810, 900]) { inkEllipse(bx, 300, 26, 5, 0, '#3a4a5a', 1.2); }
    inkRect(782, 316, 156, 34, '#c8f0e4', 2, 8);
    for (const kx of [800, 826, 896, 922]) { inkCircle(kx, 333, 8, '#ffffff', 1.5); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(kx, 333); ctx.lineTo(kx, 326); ctx.stroke(); }
    inkCircle(860, 333, 12, '#fff8e0', 1.6); ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(860, 333); ctx.lineTo(860, 325); ctx.moveTo(860, 333); ctx.lineTo(866, 336); ctx.stroke();
    inkRect(790, 362, 140, 10, '#d8d8e8', 2, 5);
    inkRect(784, 380, 152, 116, '#6ac8ac', 2.5, 12);
    inkRect(796, 392, 128, 92, '#3a2a3a', 2, 8);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(800, 396); ctx.lineTo(830, 396); ctx.lineTo(800, 440); ctx.closePath(); ctx.fill();
    // the counter: a marble top with grey veins and a warm wooden front
    const cg = ctx.createLinearGradient(0, 322, 0, 506); cg.addColorStop(0, '#f6f2f0'); cg.addColorStop(1, '#ffffff');
    ctx.fillStyle = cg; ctx.fillRect(0, 322, 772, 186);
    ctx.strokeStyle = 'rgba(160,150,170,.35)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const x = R() * 772, y = 330 + R() * 170; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 40, y + R() * 30 - 15, x + 80, y + R() * 30 - 10, x + 140, y + R() * 20 - 10); ctx.stroke(); }
    ctx.fillStyle = 'rgba(90,60,110,.18)'; ctx.fillRect(0, 322, 772, 6);
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 322); ctx.lineTo(772, 322); ctx.stroke();
    inkRect(-4, 506, 778, 40, '#d89a64', 2.5, 0);
    ctx.strokeStyle = 'rgba(122,70,30,.35)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 10; i++) { const y = 512 + i * 3.4; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x < 772; x += 40) ctx.quadraticCurveTo(x + 20, y + (R() - 0.5) * 4, x + 40, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(0, 508, 772, 3);
    // a crock of wooden spoons in the corner by the oven
    for (const [a, c] of [[-0.3, '#d8a868'], [0.05, '#c89058'], [0.32, '#e0b878']]) inkAt(748, 300, a, P2('M-3,0 L-3,-56 C-10,-58 -10,-76 0,-78 C10,-76 10,-58 3,-56 L3,0 Z'), c, 1.4);
    ink(P2('M730,296 L766,296 L762,336 L734,336 Z'), '#ffb3c8', 2);
    ctx.fillStyle = '#ffffff'; circle(748, 316, 5);
  }

  // ------------------------------------------------------------------ ingredient and tool art
  function bwEgg(x, y, s, crack = 0, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const eg = ctx.createRadialGradient(-7, -10, 2, 0, 0, 30); eg.addColorStop(0, '#ffffff'); eg.addColorStop(1, '#f2dcc0');
    ink(P2('M0,-28 C16,-28 22,-6 22,6 C22,20 12,28 0,28 C-12,28 -22,20 -22,6 C-22,-6 -16,-28 0,-28 Z'), eg, 2);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(-8, -12, 4, 8, 0.3);
    ctx.fillStyle = 'rgba(200,150,100,.35)'; circle(8, 8, 1.6); circle(-4, 14, 1.2); circle(12, -4, 1.2);
    if (crack) { ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, 4); ctx.lineTo(-8, -2); ctx.lineTo(0, 7); ctx.lineTo(8, -1); ctx.lineTo(18, 5); if (crack > 1) { ctx.moveTo(0, 7); ctx.lineTo(-2, 16); } ctx.stroke(); }
    ctx.restore();
  }
  function bwCarton(x, y, n) {
    ink(P2(`M${x - 66},${y - 10} L${x + 66},${y - 10} L${x + 58},${y + 30} L${x - 58},${y + 30} Z`), '#d8c0a0', 2);
    ctx.strokeStyle = 'rgba(122,90,60,.4)'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 22, y - 8); ctx.lineTo(x + i * 20, y + 28); ctx.stroke(); }
    for (let i = 0; i < Math.min(n, 3); i++) bwEgg(x - 40 + i * 40, y - 20, 0.72);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#c8ac88'; ellipse(x - 50 + i * 33, y - 8, 14, 5); }
    for (let i = 0; i < Math.min(n, 3); i++) { ctx.fillStyle = 'rgba(255,255,255,.0)'; }
  }
  function bwSack(x, y, s, label = 'FLOUR') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ink(P2('M-40,40 C-48,10 -44,-26 -36,-40 C-20,-34 20,-34 36,-40 C44,-26 48,10 40,40 C20,46 -20,46 -40,40 Z'), '#f0e2c4', 2.2);
    ctx.fillStyle = '#fffdf6'; ellipse(0, -38, 34, 9); ctx.fillStyle = '#ffffff'; ellipse(-6, -42, 18, 6);
    ctx.strokeStyle = 'rgba(160,120,70,.35)'; ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 14, -28); ctx.quadraticCurveTo(i * 16, 8, i * 14, 40); ctx.stroke(); }
    rrect(-28, -6, 56, 22, 5, '#ffffff', OL, 1.5); text(label, 0, 5, 12, '#a06a3a', 'center', 800);
    ctx.strokeStyle = '#e0b050'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(0, 20); for (const d of [-1, 1]) { ctx.moveTo(0, 30); ctx.lineTo(d * 6, 24); ctx.moveTo(0, 24); ctx.lineTo(d * 6, 19); } ctx.stroke();
    ctx.restore();
  }
  function bwSugarJar(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkRect(-34, -36, 68, 76, 'rgba(225,242,255,.85)', 2.2, 14);
    ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.roundRect(-30, -10, 60, 46, 10); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) circle(-24 + (i * 17) % 48, -6 + (i * 11) % 38, 1.5);
    inkRect(-38, -48, 76, 14, '#ff8fb8', 1.8, 5); inkCircle(0, -52, 6, '#ff6fa0', 1.5);
    rrect(-24, 4, 48, 18, 4, '#ffffff', OL, 1.4); text('SUGAR', 0, 13, 11, '#c0508a', 'center', 800);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-28, -30, 5, 56);
    ctx.restore();
  }
  function bwButterDish(x, y, s, has = true) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkEllipse(0, 18, 58, 16, 0, '#ffffff', 2); ctx.fillStyle = '#d8eef8'; ellipse(0, 16, 44, 10);
    if (has) bwButter(0, 6, 1);
    ctx.restore();
  }
  function bwButter(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ink(P2('M-30,-8 L18,-8 L30,-16 L30,4 L18,14 L-30,14 Z'), '#ffe27a', 1.8);
    ctx.fillStyle = '#fff2a8'; ctx.beginPath(); ctx.moveTo(-30, -8); ctx.lineTo(18, -8); ctx.lineTo(30, -16); ctx.lineTo(-18, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f0c840'; ctx.beginPath(); ctx.moveTo(18, -8); ctx.lineTo(30, -16); ctx.lineTo(30, 4); ctx.lineTo(18, 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-30, -8); ctx.lineTo(-18, -16); ctx.lineTo(30, -16); ctx.moveTo(18, -8); ctx.lineTo(18, 14); ctx.stroke();
    ctx.restore();
  }
  // a pitcher of milk or water, tilted by rot (spout on the left)
  function bwJug(x, y, rot, liquid, label) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(38, -4, 22, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = '#e8f4ff'; ctx.lineWidth = 7; ctx.stroke();
    const body = P2('M-34,-52 L-50,-62 L-30,-38 C-38,0 -40,30 -34,46 C-20,54 20,54 34,46 C40,30 38,-10 30,-52 Z');
    ink(body, 'rgba(232,246,255,.95)', 2.2);
    ctx.save(); ctx.clip(body); ctx.fillStyle = liquid; ctx.fillRect(-60, -16, 120, 80); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-60, -16, 120, 4); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(-24, -40, 6, 70);
    rrect(-20, 4, 42, 18, 5, '#ffffff', OL, 1.4); text(label, 1, 13, 11, liquid === '#ffffff' ? '#4f78a0' : '#2f88c0', 'center', 800);
    ctx.restore();
  }
  // a glass measuring cup standing on (x, y); level and line are 0..1 of a cup; marks shows the fractions
  function bwCup(x, y, level, line, liquid, good, marks) {
    const h = 120, top = y - h, ful = h * 0.86;
    ctx.strokeStyle = OL; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(x + 42, y - 64, 22, -1.3, 1.3); ctx.stroke();
    ctx.strokeStyle = '#e8f4ff'; ctx.lineWidth = 6; ctx.stroke();
    const body = P2(`M${x - 44},${top} L${x + 44},${top} L${x + 40},${y - 4} C${x + 38},${y + 2} ${x - 38},${y + 2} ${x - 40},${y - 4} Z`);
    ink(body, 'rgba(228,244,255,.8)', 2.2);
    ctx.save(); ctx.clip(body);
    const lh = ful * Math.min(1.25, level);
    if (lh > 0) { ctx.fillStyle = liquid; ctx.fillRect(x - 50, y - lh, 100, lh + 4); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - 50, y - lh, 100, 3); }
    ctx.restore();
    for (const m of marks) {
      const ly = y - ful * m, main = m === line;
      ctx.strokeStyle = main ? (good ? '#2fbf5a' : '#ff4a6a') : 'rgba(91,63,115,.5)'; ctx.lineWidth = main ? 4 : 2;
      ctx.setLineDash(main ? [7, 4] : []); ctx.beginPath(); ctx.moveTo(x - (main ? 48 : 40), ly); ctx.lineTo(x + (main ? 48 : 10), ly); ctx.stroke(); ctx.setLineDash([]);
      text(BW_FRAC[m][0], x - 54, ly, main ? 18 : 13, main ? (good ? '#1f9a48' : '#e0305a') : '#8a7a9a', 'right', 800);
      if (main) vecStar(x + 58, ly, 9, good ? '#7ae08a' : '#ffd23a', 1.4);
    }
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - 36, top + 8, 5, h - 20);
  }
  function bwBag(x, y, rot, kind) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const choc = kind === 'chips';
    ink(P2('M-26,-34 L26,-34 L30,34 C10,40 -10,40 -30,34 Z'), choc ? '#9a5a3a' : '#ffd84a', 2.2);
    ctx.fillStyle = choc ? '#b8784a' : '#fff0a0'; ctx.fillRect(-26, -34, 52, 8);
    if (choc) { ctx.fillStyle = '#4a2a1a'; for (const [a, b] of [[-10, 6], [6, 0], [10, 16], [-6, 20]]) { ctx.beginPath(); ctx.moveTo(a - 5, b + 4); ctx.quadraticCurveTo(a, b - 8, a + 5, b + 4); ctx.closePath(); ctx.fill(); } text('CHIPS', 0, -14, 10, '#fff', 'center', 800); }
    else { ctx.fillStyle = '#ffb030'; for (let i = 0; i < 8; i++) ctx.fillRect(-18 + (i * 13) % 36, -2 + (i * 7) % 26, 9, 3); text('CHEESE', 0, -14, 9, '#a05a10', 'center', 800); }
    ctx.restore();
  }
  function bwBanana(x, y, s, rot, squash = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * (1 + squash * 0.5), s * (1 - squash * 0.6));
    ink(P2('M-36,-6 C-20,14 20,14 36,-6 C38,-10 34,-12 32,-9 C16,4 -16,4 -32,-9 C-36,-12 -40,-10 -36,-6 Z'), '#ffe04a', 2);
    ctx.fillStyle = '#6a4a2a'; circle(37, -8, 2.5); circle(-37, -8, 2.5);
    ctx.restore();
  }
  function bwScoopTool(x, y, load, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    inkRect(18, -6, 44, 12, '#ff8fb8', 1.6, 6);
    ink(P2('M-26,-8 L20,-8 L20,8 C10,22 -18,22 -26,8 Z'), '#d8dce8', 2);
    if (load) { ctx.fillStyle = load; ellipse(-3, -8, 22, 10); ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(-8, -12, 8, 3); }
    ctx.restore();
  }
  function bwSpoonTool(x, y, load, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    inkRect(12, -4, 56, 8, '#d8a868', 1.4, 4);
    inkEllipse(0, 0, 16, 11, 0, '#d8a868', 1.6);
    if (load) { ctx.fillStyle = load; ellipse(0, -2, 12, 7); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) circle(-6 + i * 4, -3 + (i % 2) * 2, 1.2); }
    ctx.restore();
  }
  function bwPin(x, y, w) {
    inkRect(x - w / 2 - 34, y - 7, 36, 14, '#c88a50', 1.8, 7); inkRect(x + w / 2 - 2, y - 7, 36, 14, '#c88a50', 1.8, 7);
    inkRect(x - w / 2, y - 16, w, 32, '#f0c890', 2.2, 14);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x - w / 2 + 8, y - 11, w - 16, 5);
    ctx.fillStyle = 'rgba(160,100,50,.25)'; ctx.fillRect(x - w / 2 + 8, y + 6, w - 16, 4);
  }
  const BW_MAN = P2('M0,-34 C9,-34 13,-28 13,-21 C13,-16 11,-13 8,-11 L22,-10 C28,-9 28,-1 22,0 L11,1 L12,10 L18,26 C20,32 13,35 10,30 L0,15 L-10,30 C-13,35 -20,32 -18,26 L-12,10 L-11,1 L-22,0 C-28,-1 -28,-9 -22,-10 L-8,-11 C-11,-13 -13,-16 -13,-21 C-13,-28 -9,-34 0,-34 Z');
  function bwMan(x, y, s, col, iced) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ink(BW_MAN, col, 1.8);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ellipse(-4, -26, 5, 3, -0.4);
    if (iced) {
      ctx.fillStyle = '#ffffff'; circle(-4, -23, 1.8); circle(4, -23, 1.8);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, -19, 4, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.beginPath(); for (const d of [-1, 1]) { ctx.moveTo(d * 16, -9); ctx.quadraticCurveTo(d * 18, -5, d * 16, -1); ctx.moveTo(d * 9, 22); ctx.quadraticCurveTo(d * 13, 24, d * 15, 22); } ctx.stroke();
    }
    ctx.restore();
  }
  function bwCutter(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.stroke(BW_MAN); ctx.strokeStyle = '#d8dce8'; ctx.lineWidth = 5; ctx.stroke(BW_MAN);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke(BW_MAN);
    ctx.restore();
  }
  function bwTopping(kind, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    switch (kind) {
      case 'pep': inkCircle(0, 0, 13, '#e0403a', 1.6); ctx.fillStyle = '#b02a2a'; for (const [a, b] of [[-5, -4], [5, -2], [-1, 6], [6, 6]]) circle(a, b, 2); ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-5, -7, 4, 2); break;
      case 'mush': ink(P2('M-13,0 C-13,-14 13,-14 13,0 C9,2 6,1 5,0 L5,10 C3,13 -3,13 -5,10 L-5,0 C-6,1 -9,2 -13,0 Z'), '#f4e6d0', 1.5); ctx.fillStyle = '#c8a07a'; ellipse(0, -6, 9, 4); break;
      case 'olive': ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 9, 3.6, 4.6); ctx.stroke(); break;
      case 'basil': inkEllipse(0, 0, 13, 7, 0.6, '#3fae4a', 1.4); break;
      case 'berry': inkCircle(0, 0, 10, '#4a5ad8', 1.6); ctx.fillStyle = '#2a2a7a'; star(0, -3, 4, '#2a2a7a', 5); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(-4, -4, 2.4); break;
      case 'straw': ink(P2('M0,14 C-14,6 -14,-8 -8,-10 C-4,-11 -2,-9 0,-8 C2,-9 4,-11 8,-10 C14,-8 14,6 0,14 Z'), '#ff4a5a', 1.6); ctx.fillStyle = '#fff6a8'; for (const [a, b] of [[-5, -3], [4, -2], [0, 4], [-3, 8], [6, 5]]) circle(a, b, 1.2); ctx.fillStyle = '#3fae4a'; tri(-8, -10, 8, -10, 0, -4); break;
      case 'banana': inkCircle(0, 0, 12, '#fff2b0', 1.5); ctx.fillStyle = '#f0e090'; circle(0, 0, 8); ctx.fillStyle = '#8a6a3a'; for (let i = 0; i < 3; i++) circle(Math.cos(i * 2.1) * 3, Math.sin(i * 2.1) * 3, 1.2); break;
      case 'cherry': ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(2, -8); ctx.quadraticCurveTo(6, -20, 13, -21); ctx.stroke(); inkCircle(0, 0, 11, '#ff2f4a', 1.6); ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(-4, -4, 3); break;
      case 'star': vecStar(0, 0, 13, '#ffd23a', 1.4); break;
      case 'sprk': for (let i = 0; i < 7; i++) { ctx.save(); ctx.rotate(i * 0.9); ctx.fillStyle = SPRINKLE_COLS[i % SPRINKLE_COLS.length]; ctx.fillRect(4 + (i % 3) * 3, -1.6, 7, 3.2); ctx.restore(); } ctx.fillStyle = SPRINKLE_COLS[2]; ctx.fillRect(-3, -1.5, 6, 3); break;
      case 'gum': ink(P2('M-11,6 C-12,-12 12,-12 11,6 Z'), '#ff4a7a', 1.5); ctx.fillStyle = '#ffffff'; for (const [a, b] of [[-4, -3], [3, -5], [5, 1], [-2, 2]]) circle(a, b, 1.1); break;
      case 'mint': inkCircle(0, 0, 10, '#ffffff', 1.5); ctx.fillStyle = '#3fbf6a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 9, i * Math.PI / 2, i * Math.PI / 2 + 0.8); ctx.closePath(); ctx.fill(); } break;
      case 'choc': inkCircle(0, 0, 10, '#7a4a2a', 1.5); ctx.fillStyle = '#9a6040'; circle(-2, -2, 6); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) circle(Math.cos(i * 1.3) * 5, Math.sin(i * 1.3) * 5, 1); break;
    }
    ctx.restore();
  }
  // the bin a topping waits in
  function bwBin(x, y, kind, hot) {
    if (hot) { ctx.fillStyle = 'rgba(255,240,140,.6)'; circle(x, y, 40); }
    inkEllipse(x, y + 6, 34, 20, 0, '#ffffff', 2); ctx.fillStyle = '#e8f0f8'; ellipse(x, y + 2, 28, 13);
    for (const [a, b] of [[-12, 2], [10, 4], [0, -4]]) bwTopping(kind, x + a, y + b, 0.75);
  }
  function bwSteam(x, y, n, w = 20, a = 0.6) {
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const k = (S.t * 0.6 + i / n) % 1, sx = x + (i - (n - 1) / 2) * w, sy = y - k * 50;
      ctx.globalAlpha = (1 - k) * a; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx - 10, sy - 12, sx + 10, sy - 22, sx, sy - 34); ctx.stroke();
    }
    ctx.restore();
  }
  function bwSparkles(x, y, w, h, n) {
    for (let i = 0; i < n; i++) {
      const ph = (S.t * 1.3 + i * 0.37) % 1, sx = x + ((i * 97) % w) - w / 2, sy = y + ((i * 61) % h) - h / 2;
      ctx.globalAlpha = Math.sin(ph * Math.PI); star(sx, sy, 6 + (i % 3) * 3, i % 2 ? '#fff6a8' : '#ffffff', 4);
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ the bowl and the workpieces
  function bwBowl(g, x, y, s) {
    const rx = 128 * s, ry = 30 * s, d = 104 * s, r = g.rec;
    const body = P2(`M${x - rx},${y} C${x - rx},${y + d * 0.92} ${x - rx * 0.4},${y + d} ${x},${y + d} C${x + rx * 0.4},${y + d} ${x + rx},${y + d * 0.92} ${x + rx},${y} Z`);
    ctx.fillStyle = 'rgba(90,60,110,.18)'; ellipse(x, y + d + 4, rx * 0.8, 10 * s);
    // outline the body, the rim and the foot together, then fill them
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(body); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
    const bg = ctx.createLinearGradient(x - rx, 0, x + rx, 0); bg.addColorStop(0, '#9ad8ff'); bg.addColorStop(0.45, '#6ac0f4'); bg.addColorStop(1, '#3f9ad8');
    ctx.fillStyle = bg; ctx.fill(body);
    ctx.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36; circle(x + Math.sin(a) * rx * 0.8, y + d * 0.5 + Math.cos(a) * 6 * s, 5 * s); }
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(x - rx * 0.6, y + d * 0.4, 9 * s, 24 * s, 0.4);
    ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    // inside: whatever has gone in so far
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx - 6 * s, ry - 4 * s, 0, 0, TAU); ctx.clip();
    const ig = ctx.createLinearGradient(0, y - ry, 0, y + ry); ig.addColorStop(0, '#9ccbe8'); ig.addColorStop(1, '#e4f4ff');
    ctx.fillStyle = ig; ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    const items = g.bowl, n = items.length, m = g.mix;
    if (n) {
      const lvl = Math.min(1, n / 6), cy = y + ry * (0.75 - lvl * 0.4);
      const base = mix('#fff4e2', r.batter, m);
      ctx.fillStyle = mix(base, '#c09060', 0.18); ellipse(x, cy + 3 * s, rx * (0.58 + lvl * 0.34), ry * (0.6 + lvl * 0.25));
      ctx.fillStyle = base; ellipse(x, cy, rx * (0.56 + lvl * 0.34), ry * (0.55 + lvl * 0.25));
      ctx.globalAlpha = 1 - m;
      items.forEach((it, i) => bwBowlItem(it, x + Math.cos(i * 2.4) * rx * 0.42, cy + Math.sin(i * 2.4) * ry * 0.3, s, g));
      ctx.globalAlpha = 1;
      if (m > 0) {
        // a creamy swirl that turns as you stir
        ctx.globalAlpha = 0.5 + m * 0.5;
        for (const [c, off, lw] of [[mix(r.batter, '#a86a30', 0.35), 0, 4], [mix(r.batter, '#ffffff', 0.6), 1.6, 3]]) {
          ctx.strokeStyle = c; ctx.lineWidth = lw * s; ctx.beginPath();
          for (let k = 0; k < 40; k++) { const a = g.swirl + off + k * 0.32, rr = k / 40; const px = x + Math.cos(a) * rx * 0.62 * rr, py = cy + Math.sin(a) * ry * 0.5 * rr; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (items.includes('chips')) { ctx.fillStyle = '#4a2a1a'; for (let i = 0; i < 14; i++) circle(x + Math.cos(i * 2.2 + g.swirl * 0.3) * rx * 0.6 * ((i * 7) % 10) / 10, cy + Math.sin(i * 2.2 + g.swirl * 0.3) * ry * 0.45, 3 * s); }
      }
    }
    ctx.restore();
    // dough recipes become a soft ball once they're mixed
    if (r.dough && m >= 1 && g.bowl.length) {
      const by = y + 2 * s;
      inkEllipse(x, by - 6 * s, 72 * s, 30 * s, 0, r.batter, 2 * s);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(x - 20 * s, by - 18 * s, 26 * s, 8 * s, -0.1);
      if (items.includes('chips')) { ctx.fillStyle = '#4a2a1a'; for (let i = 0; i < 9; i++) circle(x - 50 * s + ((i * 37) % 100) * s, by - 16 * s + ((i * 13) % 22) * s, 3 * s); }
    }
    // the front lip of the rim sits over everything inside
    ctx.strokeStyle = OL; ctx.lineWidth = 9 * s; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.strokeStyle = '#7ccaf8'; ctx.lineWidth = 5 * s; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, rx - 1, ry - 1, 0, Math.PI + 0.3, Math.PI + 1.2); ctx.stroke();
  }
  function bwBowlItem(it, x, y, s, g) {
    switch (it) {
      case 'egg': ctx.fillStyle = 'rgba(255,255,255,.95)'; ellipse(x, y, 20 * s, 9 * s, 0.2); ctx.fillStyle = '#ffc21a'; circle(x + 2 * s, y - 1, 7 * s); ctx.fillStyle = '#fff2a0'; circle(x, y - 3 * s, 2.4 * s); break;
      case 'flour': ctx.fillStyle = '#ffffff'; ellipse(x, y, 26 * s, 11 * s); ctx.fillStyle = '#f2ecdf'; ellipse(x + 6 * s, y + 3 * s, 14 * s, 5 * s); break;
      case 'sugar': ctx.fillStyle = '#fffdf6'; ellipse(x, y, 18 * s, 8 * s); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) circle(x - 10 * s + i * 5 * s, y - 2 + (i % 2) * 3, 1.3); break;
      case 'milk': ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(x, y, 34 * s, 12 * s); break;
      case 'water': ctx.fillStyle = 'rgba(160,215,255,.8)'; ellipse(x, y, 34 * s, 12 * s); break;
      case 'butter': ctx.fillStyle = '#ffe27a'; ctx.fillRect(x - 14 * s, y - 8 * s, 28 * s, 14 * s); ctx.fillStyle = '#fff2a8'; ctx.fillRect(x - 14 * s, y - 8 * s, 28 * s, 4 * s); break;
      case 'chips': ctx.fillStyle = '#4a2a1a'; for (let i = 0; i < 10; i++) circle(x - 22 * s + (i * 11) % 44 * s, y - 6 * s + (i * 7) % 12 * s, 3 * s); break;
      case 'banana': { const sq = g.mash || 0; if (sq < 1) { bwBanana(x - 20 * s, y - 2, 0.8 * s, 0.2, sq); bwBanana(x + 24 * s, y + 2, 0.8 * s, -0.3, sq); } ctx.fillStyle = `rgba(255,232,140,${sq})`; ellipse(x, y, 46 * s, 14 * s); ctx.fillStyle = `rgba(160,120,60,${sq * 0.5})`; for (let i = 0; i < 6; i++) circle(x - 30 * s + i * 12 * s, y + (i % 2) * 4, 2); break; }
    }
  }
  // a piece of work (tin, griddle, tray, pizza, dough sheet, loaf pan or pancake stack), drawn at (x, y) scale s
  function bwPiece(g, p, x, y, s) {
    const r = g.rec, bk = p.bake || 0, col = bwBakeCol(r, bk);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (p.kind === 'tin') {
      inkRect(-158, -104, 316, 208, '#c4cad8', 2.5, 16); inkRect(-148, -94, 296, 188, '#d8dde8', 1.5, 12);
      p.spots.forEach((sp, i) => {
        inkCircle(sp.x, sp.y, 38, '#9aa0b4', 1.5);
        inkCircle(sp.x, sp.y, 34, '#ffb3d0', 1.5);
        ctx.strokeStyle = '#e888b0'; ctx.lineWidth = 2; for (let k = 0; k < 14; k++) { const a = k * TAU / 14; ctx.beginPath(); ctx.moveTo(sp.x + Math.cos(a) * 24, sp.y + Math.sin(a) * 24); ctx.lineTo(sp.x + Math.cos(a) * 34, sp.y + Math.sin(a) * 34); ctx.stroke(); }
        if (sp.f > 0) {
          if (bk > 0.05) { inkCircle(sp.x, sp.y, 26 + Math.min(bk, 0.8) * 10, col, 1.5); ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(sp.x - 8, sp.y - 10, 10, 5, -0.4); }
          else { ctx.fillStyle = r.batter; circle(sp.x, sp.y, 30 * Math.min(1.2, sp.f)); ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(sp.x - 6, sp.y - 6, 8 * sp.f, 4 * sp.f); }
        }
        if (sp.frosted) bwFrostSwirl(sp.x, sp.y, r.frost);
        if (sp.top) bwTopping(sp.top, sp.x, sp.y - 4, 1);
      });
      if (p.dabs) bwDabs(p, r.frost);
    } else if (p.kind === 'griddle' || p.kind === 'pan') {
      ctx.strokeStyle = OL; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(110, 60); ctx.lineTo(150, 100); ctx.stroke(); ctx.strokeStyle = '#ff8a6a'; ctx.lineWidth = 16; ctx.stroke();
      inkCircle(0, 0, 132, '#4a4a5a', 3); ctx.fillStyle = '#5c5c6e'; circle(0, 0, 118); ctx.fillStyle = 'rgba(255,255,255,.12)'; ellipse(-50, -60, 40, 14, -0.6);
      p.spots.forEach((sp, i) => {
        if (!(sp.f > 0)) return;
        const rr = 46 * Math.min(1.25, sp.f), c = sp.flipped ? bwBakeCol(r, sp.cook) : mix(r.batter, r.gold, Math.min(1, sp.cook || 0) * 0.35);
        const fl = sp.flipT > 0 ? Math.sin(sp.flipT / 0.6 * Math.PI) : 0;
        ctx.save(); ctx.translate(sp.x, sp.y - fl * 70); ctx.scale(1, 1 - fl * 0.85);
        inkCircle(0, 0, rr, c, 1.6);
        if (sp.flipped) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(-12, -14, 16, 7, -0.4); }
        else if ((sp.cook || 0) > 0.3) { ctx.fillStyle = 'rgba(255,255,255,.65)'; const nb = Math.floor(sp.cook * 12); for (let k = 0; k < nb; k++) circle(Math.cos(k * 2.4) * rr * 0.6 * ((k % 4) + 1) / 4, Math.sin(k * 2.4) * rr * 0.6 * ((k % 4) + 1) / 4, 2.6); }
        ctx.restore();
      });
    } else if (p.kind === 'stack') {
      inkEllipse(0, 64, 190, 40, 0, '#ffffff', 2.5); ctx.fillStyle = '#e8f2fa'; ellipse(0, 62, 150, 28);
      const n = Math.max(3, p.spots0 || 3);
      for (let i = 0; i < n; i++) { const yy = 50 - i * 22; inkEllipse(0, yy, 136 - i * 2, 32, 0, bwBakeCol(r, 0.72 + (i % 2) * 0.06), 1.6); ctx.fillStyle = '#fff0c8'; ellipse(0, yy - 5, 126 - i * 2, 25); }
      const ty = bwStackTop(p);
      ctx.fillStyle = r.gold; ellipse(0, ty, 126 - (n - 1) * 2, 25); ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(-50, ty - 10, 30, 6, -0.1);
      // syrup drips and a pat of butter
      ctx.fillStyle = 'rgba(190,100,30,.8)'; ellipse(0, ty + 2, 96, 17); for (const dx of [-88, -34, 30, 86]) { ctx.beginPath(); ctx.roundRect(dx - 6, ty + 6, 12, 26 + (Math.abs(dx) % 3) * 6, 6); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-30, ty - 2, 20, 4);
      inkRect(-16, ty - 14, 32, 16, '#ffe27a', 1.4, 3);
      p.spots.forEach(sp => sp.top && bwTopping(sp.top, sp.x, sp.y, 0.9));
    } else if (p.kind === 'tray') {
      if (!p.noTray) { inkRect(-160, -100, 320, 200, '#b8bccc', 2.5, 14); inkRect(-150, -90, 300, 180, '#cfd3de', 1.5, 10); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-140, -84, 280, 6); }
      p.spots.forEach(sp => {
        if (!sp.done) return;
        if (r.key === 'ginger') { bwMan(sp.x, sp.y, 1.25, col, bk > 0.5); if (sp.top) { bwTopping(sp.top, sp.x, sp.y - 4, 0.55); } if (sp.top2) bwTopping(sp.top2, sp.x, sp.y + 10, 0.55); return; }
        const rr = 26 + Math.min(bk, 0.8) * 10;
        inkCircle(sp.x, sp.y, rr, col, 1.5); ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(sp.x - 8, sp.y - 9, 9, 4, -0.4);
        if (bk > 0.4) { ctx.strokeStyle = mix(col, '#5a3418', 0.3); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sp.x - 10, sp.y + 4); ctx.lineTo(sp.x - 2, sp.y - 2); ctx.lineTo(sp.x + 8, sp.y + 6); ctx.stroke(); }
        ctx.fillStyle = '#4a2a1a'; for (let k = 0; k < 5; k++) { const a = k * 1.9 + sp.x; ctx.beginPath(); ctx.ellipse(sp.x + Math.cos(a) * rr * 0.55, sp.y + Math.sin(a) * rr * 0.55, 3.4, 2.6, a, 0, TAU); ctx.fill(); }
      });
    } else if (p.kind === 'pizza') {
      const R = 40 + (p.roll ?? 1) * 58;
      inkCircle(0, 6, R + 12, '#c4cad8', 2.5);
      inkCircle(0, 0, R, col, 2);
      ctx.fillStyle = mix(col, '#ffffff', 0.25); ctx.beginPath(); ctx.arc(0, 0, R - 4, 0, TAU); ctx.arc(0, 0, R - 14, 0, TAU, true); ctx.fill();
      if (p.dabs) bwDabs(p, '#e8453a');
      if (p.cheese) for (const [cx, cy, a] of p.cheese) {
        if (bk > 0.4) { ctx.fillStyle = mix('#fff2a0', '#ffc850', Math.min(1, bk)); ctx.globalAlpha = 0.85; ellipse(cx, cy, 6, 4.5, a); ctx.globalAlpha = 1; }
        else { ctx.fillStyle = '#ffe680'; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.fillRect(-6, -1.5, 12, 3); ctx.restore(); }
      }
      if (p.roll != null && p.roll < 1) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-R * 0.3, -R * 0.35, R * 0.35, R * 0.15, -0.5); }
      p.spots.forEach(sp => sp.top && bwTopping(sp.top, sp.x, sp.y, 1));
      if (bk > 0.5) { ctx.fillStyle = 'rgba(160,80,30,.25)'; for (let k = 0; k < 10; k++) circle(Math.cos(k * 1.7) * (R - 8), Math.sin(k * 1.7) * (R - 8), 3); }
    } else if (p.kind === 'sheet') {
      const w = 90 + (p.roll ?? 1) * 220, h = 60 + (p.roll ?? 1) * 120;
      ink(P2(`M${-w / 2 + 20},${-h / 2} C${-w / 4},${-h / 2 - 8} ${w / 4},${-h / 2 + 6} ${w / 2 - 20},${-h / 2} C${w / 2 + 6},${-h / 2 + 10} ${w / 2 + 4},${h / 2 - 10} ${w / 2 - 18},${h / 2} C${w / 4},${h / 2 + 8} ${-w / 4},${h / 2 - 6} ${-w / 2 + 18},${h / 2} C${-w / 2 - 6},${h / 2 - 12} ${-w / 2 - 4},${-h / 2 + 12} ${-w / 2 + 20},${-h / 2} Z`), r.raw, 2);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(-w * 0.2, -h * 0.25, w * 0.2, h * 0.08, -0.2);
      p.spots.forEach(sp => { if (sp.done) { ctx.fillStyle = mix(r.raw, '#5a3418', 0.35); ctx.save(); ctx.translate(sp.x, sp.y + 2); ctx.scale(1.3, 1.3); ctx.fill(BW_MAN); ctx.restore(); bwMan(sp.x, sp.y, 1.25, r.raw, false); } });
    } else if (p.kind === 'loaf') {
      ink(P2('M-120,-50 L120,-50 L104,60 L-104,60 Z'), '#c4cad8', 2.5);
      ctx.fillStyle = '#9aa0b4'; ctx.beginPath(); ctx.moveTo(-110, -42); ctx.lineTo(110, -42); ctx.lineTo(96, 52); ctx.lineTo(-96, 52); ctx.closePath(); ctx.fill();
      const sp = p.spots[0], f = Math.min(1.25, sp.f || 0);
      if (bk > 0.05) {
        ink(P2(`M-108,${-30} C-100,${-80 - bk * 10} 100,${-80 - bk * 10} 108,-30 L96,52 L-96,52 Z`), col, 2);
        ctx.strokeStyle = mix(col, '#5a3418', 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-60, -52); ctx.quadraticCurveTo(0, -66, 60, -52); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(-50, -58, 30, 7, -0.1);
      } else if (f > 0) {
        const top = 52 - 94 * f;
        ctx.fillStyle = r.batter; ctx.beginPath(); ctx.moveTo(-96 - 14 * (1 - f), 52); ctx.lineTo(-108 + 14 * (1 - f) * 0, top); ctx.lineTo(108, top); ctx.lineTo(96, 52); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-90, top + 3, 60, 4);
      }
      p.tops?.forEach(t => bwTopping(t.k, t.x, t.y + (bk > 0.05 ? -14 : 0), 1));
    }
    ctx.restore();
  }
  function bwDabs(p, c) {
    ctx.save(); ctx.beginPath(); for (const [cx, cy, cr] of p.areas) { ctx.moveTo(cx + cr, cy); ctx.arc(cx, cy, cr, 0, TAU); } ctx.clip();
    ctx.fillStyle = c; for (const d of p.dabs) if (d.on) circle(d.x, d.y, 12.5);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; for (const d of p.dabs) if (d.on && (d.x * 7 + d.y * 3) % 5 < 1) ellipse(d.x - 3, d.y - 3, 4, 2, -0.5);
    ctx.restore();
  }
  function bwFrostSwirl(x, y, c) {
    ink(P2(`M${x - 30},${y + 4} C${x - 36},${y - 14} ${x - 18},${y - 26} ${x},${y - 24} C${x + 22},${y - 26} ${x + 36},${y - 10} ${x + 30},${y + 6} C${x + 18},${y + 20} ${x - 18},${y + 20} ${x - 30},${y + 4} Z`), c, 1.6);
    ctx.strokeStyle = mix(c, '#ffffff', 0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 2, 16, 0.4, Math.PI * 1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 2, y - 4, 7, 2, Math.PI * 2.6); ctx.stroke();
  }
  // the finished dish, for the recipe cards and the big reveal (p = the real piece, or null for the picture)
  function bwDish(r, x, y, s, p) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = { rec: r };
    if (r.key === 'cupcakes') {
      inkEllipse(0, 70, 150, 24, 0, '#ffffff', 2.5); inkRect(-14, 70, 28, 36, '#ffffff', 2, 4); inkEllipse(0, 106, 60, 12, 0, '#ffffff', 2);
      const tops = p ? p.spots.map(sp => sp.top) : ['cherry', 'star', 'sprk'];
      const map = { cherry: ['cherry'], star: ['star'], sprk: ['sprinkles'] };
      [[-80, 66, 'blue', 0], [80, 66, 'yellow', 2], [0, 70, 'pink', 1]].forEach(([dx, dy, f, i]) => drawCupcake(dx, dy, 1.05, p ? 'pink' : f, map[tops[i % tops.length]] || ['cherry'], ['#b8e0ff', '#ffb3d0', '#c8f0b0'][i]));
    } else if (r.key === 'pancakes') {
      const pp = p || { kind: 'stack', spots0: 4, spots: [{ x: -60, y: -26, top: 'berry' }, { x: 0, y: -14, top: 'straw' }, { x: 60, y: -26, top: 'banana' }] };
      bwPiece(g, pp, 0, 10, 0.9);
    } else if (r.key === 'cookies') {
      inkEllipse(0, 20, 150, 74, 0, '#ffffff', 2.5); ctx.fillStyle = '#e8f2fa'; ellipse(0, 18, 120, 56);
      bwPiece(g, { kind: 'tray', bake: 0.8, spots: [[-70, 0], [0, -20], [70, 0], [-36, 36], [36, 36]].map(([a, b]) => ({ x: a, y: b, done: true })), noTray: true }, 0, 0, 1);
    } else if (r.key === 'pizza') {
      let pp = p;
      if (!pp) {
        pp = { kind: 'pizza', bake: 0.8, roll: 1, areas: [[0, 0, 84]], dabs: [], cheese: Array.from({ length: 40 }, (_, i) => [Math.cos(i * 2.4) * (i % 10) * 8, Math.sin(i * 2.4) * (i % 10) * 8, i]),
          spots: Array.from({ length: 6 }, (_, i) => ({ x: Math.cos(i * TAU / 6) * 56, y: Math.sin(i * TAU / 6) * 56, top: ['pep', 'mush'][i % 2] })) };
        for (let a = -84; a <= 84; a += 12) for (let b = -84; b <= 84; b += 12) pp.dabs.push({ x: a, y: b, on: true });
      }
      inkRect(100, -16, 70, 32, '#d89a64', 2.5, 14); inkCircle(0, 0, 124, '#d89a64', 2.5);
      ctx.strokeStyle = 'rgba(122,70,30,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 116, 0, TAU); ctx.stroke(); ctx.fillStyle = '#ffffff'; circle(152, 0, 6);
      bwPiece(g, pp, 0, 0, 1);
    } else if (r.key === 'ginger') {
      inkEllipse(0, 30, 150, 60, 0, '#ffffff', 2.5); ctx.fillStyle = '#e8f2fa'; ellipse(0, 28, 120, 44);
      const tops = p ? p.spots.filter(sp => sp.done).map(sp => [sp.top, sp.top2]) : [['gum', 'mint'], ['mint', 'choc'], ['choc', 'gum']];
      [[-66, 10], [66, 10], [0, 0]].forEach(([dx, dy], i) => { bwMan(dx, dy, 1.7, bwBakeCol(r, p ? p.bake : 0.8), true); const t = tops[i % Math.max(1, tops.length)] || []; if (t[0]) bwTopping(t[0], dx, dy - 6, 0.7); if (t[1]) bwTopping(t[1], dx, dy + 12, 0.7); });
    } else if (r.key === 'banana') {
      inkRect(-150, 40, 300, 26, '#d89a64', 2.5, 10);
      const c = bwBakeCol(r, p ? p.bake : 0.8);
      ink(P2('M-110,44 L-110,-10 C-104,-56 70,-60 80,-10 L80,44 Z'), c, 2.2);
      ctx.fillStyle = mix(c, '#ffffff', 0.25); ctx.fillRect(-104, -4, 6, 44);
      ctx.strokeStyle = mix(c, '#5a3418', 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-70, -36); ctx.quadraticCurveTo(-20, -48, 40, -36); ctx.stroke();
      for (const [sx, sy, k] of [[-60, -40], [-10, -46], [40, -38]]) bwTopping('banana', sx, sy, 0.9);
      // two cut slices leaning in front, showing the soft inside
      for (const [dx, rot] of [[108, 0.18], [136, 0.32]]) {
        ctx.save(); ctx.translate(dx, 40); ctx.rotate(rot);
        ink(P2('M-26,0 L-26,-46 C-24,-66 24,-66 26,-46 L26,0 Z'), c, 1.8);
        ctx.fillStyle = '#f2d8a0'; ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(-20, -44); ctx.bezierCurveTo(-18, -58, 18, -58, 20, -44); ctx.lineTo(20, -4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(150,100,50,.5)'; for (let k = 0; k < 7; k++) circle(-12 + (k * 9) % 26, -38 + (k * 13) % 30, 1.6);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  MG.bakewithpip = {
    kind: 'learn', title: () => 'Bake with Pip', icon: () => '👩‍🍳',
    how: () => "Pick a recipe, then follow Pip's recipe card! Crack, pour, stir, roll and bake with your own hands.",
    init(g) {
      Object.assign(g, { mode: 'pick', hover: -1, steps: [], si: 0, quality: [], bowl: [], mix: 0, swirl: 0, mash: 0, piece: null, wasDown: false, lx: 0, ly: 0, msg: '', msgT: 0, idle: 0, pause: 0, revealT: 0 });
      g.say = 'Which treat shall we bake? Tap a recipe card!';
      g.progress = 'Pick a recipe';
    },
    start(g) { speak(g.say); },
    choose(g, i) {
      const r = BW_RECIPES[i];
      g.rec = r;
      g.steps = r.steps.filter(s => g.tier >= (s.t || 1)).map(s => {
        const st = { ...s, n: s.n ? s.n[g.tier - 1] : 1 };
        if (s.k === 'pour') st.frac = g.tier === 1 ? 1 : pick(g.tier === 2 ? [0.5, 1] : [0.25, 0.5, 0.75]);
        if (s.k === 'flip') st.n = (r.steps.find(q => q.k === 'fill').n || [3])[g.tier - 1];
        if (s.k === 'top') { st.kinds = s.tops.slice(0, Math.min(s.tops.length, g.tier)); st.n = s.n ? s.n[g.tier - 1] : 0; st.hidden = g.tier >= 3 && st.kinds.length > 1; }
        return st;
      });
      g.mode = 'chosen'; g.pause = 1.3; g.chosen = i;
      SFX.sparkle(); burst(160 + (i % 3) * 320, 210 + Math.floor(i / 3) * 196, 20);
      speak(`${r.name}! Yum! Let's bake.`);
    },
    // set up the step at g.si
    begin(g) {
      const r = g.rec, s = g.steps[g.si];
      const st = g.st = { k: s.k, s, n: s.n, count: 0, miss: 0, carry: false, anim: 0, level: 0, meter: 0, angle: null, turns: 0, bar: 0, held: false, knocks: 0, done: false };
      const k = s.k;
      // where the bowl sits: centre stage for mixing, off to the side when filling a tray, put away otherwise
      g.bowlAt = ['add', 'crack', 'pour', 'mash', 'stir', 'shake'].includes(k) && !(k === 'shake' && s.ing === 'cheese') ? BW_MAIN : ['fill', 'scoop'].includes(k) ? BW_SIDE : null;
      st.from = BW_SRC; st.to = [BW_MAIN[0], BW_MAIN[1] - 10];
      if (k === 'mash' && !g.bowl.includes('banana')) g.bowl.push('banana');
      if ((k === 'fill' || k === 'scoop') && !g.piece) g.piece = this.makePiece(g, s.n);
      if (k === 'roll') g.piece = { kind: r.piece === 'pizza' ? 'pizza' : 'sheet', roll: 0, spots: [], bake: 0 };
      const p = g.piece;
      if (k === 'fill' || k === 'scoop') { st.from = [BW_SIDE[0], BW_SIDE[1]]; st.to = [BW_PX + p.spots[0].x, BW_PY + p.spots[0].y]; }
      if (k === 'cut') {
        const xs = { 3: [-90, 0, 90], 4: [-111, -37, 37, 111], 5: [-120, -60, 0, 60, 120] }[s.n];
        p.spots = xs.map((x, i) => ({ x, y: s.n === 5 ? (i % 2 ? 26 : -26) : 0, done: false }));
        st.from = [BW_SRC[0] - 10, BW_SRC[1] + 10]; st.to = [BW_PX + p.spots[0].x, BW_PY + p.spots[0].y];
      }
      if (k === 'spread') {
        p.areas = r.piece === 'pizza' ? [[0, 0, 84]] : p.spots.map(sp => [sp.x, sp.y, 28]);
        p.dabs = [];
        for (const [cx, cy, cr] of p.areas) for (let a = -cr; a <= cr; a += 12) for (let b = -cr; b <= cr; b += 12) if (a * a + b * b <= cr * cr * 0.92) p.dabs.push({ x: cx + a, y: cy + b, on: false, area: p.areas.findIndex(q => q[0] === cx && q[1] === cy) });
        st.need = [0.82, 0.88, 0.9][g.tier - 1];
        st.from = [BW_PX + p.areas[0][0] - 30, BW_PY + p.areas[0][1]]; st.to = [BW_PX + p.areas[0][0] + 30, BW_PY + p.areas[0][1]];
      }
      if (k === 'shake' && s.ing === 'cheese') { p.cheese = p.cheese || []; st.to = [BW_PX, BW_PY]; }
      if (k === 'top') {
        if (r.piece === 'griddle') { g.piece = { kind: 'stack', spots0: g.piece.spots.length, spots: [], bake: 0.8 }; }
        const q = g.piece; let pts;
        if (q.kind === 'tin') pts = q.spots.map(sp => [sp.x, sp.y]);
        else if (q.kind === 'stack') { const ty = bwStackTop(q), gap = Math.min(60, 216 / Math.max(1, s.n - 1)); pts = Array.from({ length: s.n }, (_, i) => [(i - (s.n - 1) / 2) * gap, ty + (s.n > 3 ? (i % 2 ? 10 : -10) : 0)]); }
        else if (q.kind === 'pizza') pts = Array.from({ length: s.n }, (_, i) => [Math.cos(i * TAU / s.n - 1.2) * 56, Math.sin(i * TAU / s.n - 1.2) * 56]);
        else if (q.kind === 'tray') { pts = []; q.spots.forEach(sp => { pts.push([sp.x, sp.y - 4]); }); q.spots.forEach(sp => { pts.push([sp.x, sp.y + 10]); }); pts = pts.slice(0, s.n); }
        else pts = Array.from({ length: s.n }, (_, i) => [(i - (s.n - 1) / 2) * 44, -38]);
        st.n = pts.length;
        st.spots = pts.map(([x, y], i) => ({ x, y, want: s.kinds[i % s.kinds.length], hide: s.hidden && i >= pts.length - 2, done: false }));
        st.bins = s.kinds.map((kk, i) => ({ k: kk, x: 300, y: 300 + i * 78 - (s.kinds.length - 1) * 30 }));
        st.from = [st.bins[0].x, st.bins[0].y]; st.to = [BW_PX + st.spots[0].x, BW_PY + st.spots[0].y];
      }
      if (k === 'bake') { st.phase = 'slide'; st.px = BW_PX; st.speed = 1 / [5, 4.4, 3.8][g.tier - 1]; st.lo = [0.62, 0.66, 0.68][g.tier - 1]; st.hi = [0.86, 0.84, 0.82][g.tier - 1]; st.from = [BW_PX, BW_PY]; st.to = [760, BW_PY]; }
      if (k === 'flip') { st.cur = 0; st.speed = 1 / [3.6, 3.2, 2.8][g.tier - 1]; st.lo = [0.6, 0.64, 0.66][g.tier - 1]; st.hi = [0.86, 0.84, 0.82][g.tier - 1]; st.n = p.spots.length; }
      if (k === 'pour') { st.line = s.frac; st.marks = g.tier === 1 ? [1] : g.tier === 2 ? [0.5, 1] : [0.25, 0.5, 0.75, 1]; st.tol = [0.1, 0.08, 0.065][g.tier - 1]; }
      if (k === 'shake') { st.from = BW_SRC; if (s.ing !== 'cheese') st.to = [BW_MAIN[0], BW_MAIN[1] - 20]; }
      if (k === 'mash' || k === 'stir') st.from = st.to = [BW_MAIN[0], BW_MAIN[1] + 6];
      if (k === 'pour') st.from = st.to = [400, 236];
      if (k === 'roll') { st.from = [BW_PX - 80, BW_PY - 10]; st.to = [BW_PX + 80, BW_PY - 10]; }
      if (k === 'flip') st.from = st.to = [BW_PX - 20, 500];
      g.say = bwStepSay(r, s);
      g.idle = 0;
      speak(g.say);
    },
    makePiece(g, n) {
      const kind = g.rec.piece;
      let spots;
      if (kind === 'tin') spots = (n <= 4 ? [[-62, -46], [62, -46], [-62, 46], [62, 46]] : [[-100, -46], [0, -46], [100, -46], [-100, 46], [0, 46], [100, 46]]).slice(0, n);
      else if (kind === 'griddle') spots = n <= 2 ? [[-56, 0], [56, 0]] : [[-56, -40], [56, -40], [0, 52]];
      else if (kind === 'tray') spots = (n <= 4 ? [[-62, -42], [62, -42], [-62, 42], [62, 42]] : [[-100, -42], [0, -42], [100, -42], [-100, 42], [0, 42], [100, 42]]).slice(0, n);
      else spots = [[0, 0]];
      return { kind, bake: 0, spots: spots.map(([x, y]) => ({ x, y, f: 0, done: false, cook: 0 })) };
    },
    msg(g, s, sayIt) { g.msg = s; g.msgT = 1.8; if (sayIt) speak(s); },
    // one more of this step is done; when all are done, the step is ticked off the card
    tick(g) {
      const st = g.st; st.count++;
      if (st.count < st.n) { chime(st.count + 3); return; }
      st.done = true;
      g.quality.push(Math.max(0.35, 1 - st.miss * 0.25));
      SFX.sparkle(); burst(BW_PX - 60, 220, 16);
      floatText(BW_PX - 60, 200, ['Yum!', 'Great!', 'Perfect!', 'Well done!'][g.si % 4], '#fff6a8', false, 28);
      g.si++;
      if (g.si >= g.steps.length) { g.mode = 'reveal'; g.revealT = 0; g.say = `Hooray! You made ${g.rec.name}!`; setTimeout(() => speak(`Hooray! You made ${g.rec.name}! Pip says: you're a super baker!`), 900); return; }
      g.pause = 1.0;
    },
    update(g, dt, id) {
      g.msgT -= dt;
      const down = pointer.down, pressedNow = down && !g.wasDown, released = !down && g.wasDown;
      const mv = Math.hypot(pointer.x - g.lx, pointer.y - g.ly);
      g.idle = down || mv > 1 ? 0 : g.idle + dt;
      try {
        if (g.mode === 'pick') {
          // the recipe cards: hover reads a name aloud, tapping (or a number key) picks it
          let h = -1;
          BW_RECIPES.forEach((r, i) => { const x = 22 + (i % 3) * 312, y = 112 + Math.floor(i / 3) * 210; if (pointer.x > x && pointer.x < x + 292 && pointer.y > y && pointer.y < y + 196) h = i; });
          if (h !== g.hover && h >= 0 && mv > 0) speak(BW_RECIPES[h].name);
          g.hover = h;
          const key = numKey(6);
          if (pointer.clicked && h >= 0) this.choose(g, h); else if (key >= 0) this.choose(g, key);
          return;
        }
        if (g.mode === 'chosen') { if ((g.pause -= dt) <= 0) { g.mode = 'steps'; g.pause = 0; this.begin(g); } return; }
        if (g.mode === 'reveal') { g.revealT += dt; if (g.revealT > 0.3 && g.revealT % 0.5 < dt) burst(rand(300, 660), rand(150, 300), 8, { colors: ['#ff6fb5', '#ffd23a', '#7ae0ff', '#9aff8a'] }); if (g.revealT > 4.2) g.done = true; return; }
        g.swirl += dt * 0.3;
        if (g.pause > 0) { if ((g.pause -= dt) <= 0) this.begin(g); return; }
        this.step(g, dt, id, down, pressedNow, released);
      } finally {
        g.wasDown = down; g.lx = pointer.x; g.ly = pointer.y;
        if (g.rec) g.progress = g.mode === 'reveal' ? 'Ta-da!' : `Step ${Math.min(g.si + 1, g.steps.length)} of ${g.steps.length}`;
        if (g.steps.length) g.score = g.quality.reduce((a, q) => a + q, 0) / g.steps.length;
      }
    },
    step(g, dt, id, down, pressedNow, released) {
      const st = g.st, k = st.k, s = st.s, r = g.rec, p = g.piece, P = pointer;
      const near = (x, y, rad) => Math.hypot(P.x - x, P.y - y) < rad;
      const [bx, by, bs] = g.bowlAt || BW_MAIN;
      const inBowl = Math.abs(P.x - bx) < 140 * bs && P.y > by - 110 * bs && P.y < by + 100 * bs;
      st.anim = Math.max(0, st.anim - dt);
      if (st.then) { if ((st.wait -= dt) <= 0) { const f = st.then; st.then = null; f(); } return; }
      st.shake = Math.max(0, (st.shake || 0) - dt);
      if (k === 'crack') {
        // knock the egg down onto the bowl's rim: two good knocks crack it open (it must be moving down fast)
        if (pressedNow && near(BW_SRC[0], BW_SRC[1] - 10, 80)) { st.carry = true; st.knocks = 0; SFX.pick(); }
        if (st.carry && down) {
          const rimY = by - 2, onRim = Math.abs(P.x - bx) < 125 && Math.abs(P.y - rimY) < 20;
          const speed = (P.y - g.ly) / Math.max(dt, 0.001);
          if (onRim && !st.onRim && speed > [110, 140, 160][g.tier - 1]) {
            st.knocks++; tone(1000 + st.knocks * 200, 0.05, 'square', 0.06); st.shake = 0.25;
            if (st.knocks >= 2) { st.carry = false; st.anim = st.wait = 0.75; st.then = () => this.tick(g); st.ax = P.x; g.bowl.push('egg'); floatText(P.x, rimY - 70, 'Crack!', '#fff6a8', false, 26); SFX.pop(); }
          }
          st.onRim = onRim;
        }
        if (released && st.carry) {
          // letting go far from the carton drops the egg: splat (a gentle penalty)
          st.carry = false;
          if (Math.hypot(pointer.x - BW_SRC[0], pointer.y - BW_SRC[1]) > 110) { st.miss++; SFX.miss(); this.msg(g, 'Splat! Knock it DOWN on the edge.', true); }
          else this.msg(g, st.knocks ? 'Knock it on the rim again!' : 'Knock the egg DOWN on the bowl\'s edge!');
        }
      } else if (k === 'add') {
        if (pressedNow && near(BW_SRC[0], BW_SRC[1], 80)) { st.carry = true; SFX.pick(); }
        if (released && st.carry) {
          st.carry = false;
          if (inBowl) {
            st.anim = st.wait = 0.45; st.then = () => this.tick(g); g.bowl.push(s.ing); SFX.pop();
            if (s.ing === 'flour') burst(bx, by - 20, 18, { colors: ['#ffffff', '#fff8ec', '#f4f0f0'], spread: 90, up: 60, size: [4, 9] });
            else burst(bx, by - 10, 8, { colors: s.ing === 'butter' ? ['#ffe27a', '#fff2a8'] : ['#ffffff', '#fff6a8'], spread: 60, up: 40 });
          } else if (Math.hypot(pointer.x - BW_SRC[0], pointer.y - BW_SRC[1]) > 110) { st.miss++; SFX.miss(); this.msg(g, 'Oops, it spilled! Drop it in the bowl.', true); }
          else this.msg(g, 'Drop it in the bowl!');
        }
      } else if (k === 'pour') {
        // hold down to tip the jug; the measuring cup fills; let go on the line; then it tips into the bowl
        st.tilt = lerp(st.tilt || 0, down && P.x > 236 ? 1 : 0, Math.min(1, dt * 10));
        if (down && P.x > 236) {
          if (st.tilt > 0.7) { st.level += dt * 0.36; st.held = true; if (Math.random() < 0.3) tone(rand(300, 420), 0.05, 'sine', 0.025); }
          if (st.level > st.line + 0.2) { st.level = 0; st.held = false; st.miss++; SFX.miss(); this.msg(g, 'Oops, it spilled! Try again.', true); }
        } else if (st.held) {
          st.held = false;
          if (Math.abs(st.level - st.line) <= st.tol) { st.anim = st.wait = 1.0; st.then = () => { g.bowl.push(s.ing); SFX.pop(); st.level = 0; this.tick(g); }; floatText(318, 300, 'Just right!', '#bfffc8', false, 24); SFX.hit(); }
          else if (st.level > st.line) { st.level = 0; st.miss++; SFX.miss(); this.msg(g, 'Too much! Try again.', true); }
          else this.msg(g, 'A little more! Hold again.');
        }
      } else if (k === 'mash') {
        if (pressedNow && inBowl) { st.press = 0.18; g.mash = Math.min(1, (st.count + 1) / st.n); tone(220 + st.count * 30, 0.08, 'triangle', 0.08); burst(P.x, P.y + 10, 5, { colors: ['#ffe680', '#fff2b0'], spread: 70, up: 40 }); this.tick(g); }
        st.press = Math.max(0, (st.press || 0) - dt);
      } else if (k === 'stir') {
        // count how far round the bowl the spoon has gone
        const cy = by + 6;
        if (down && Math.hypot(P.x - bx, (P.y - cy) * 2.2) < 150) {
          const a = Math.atan2((P.y - cy) * 2.2, P.x - bx);
          if (st.angle != null) { let d = a - st.angle; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; d = clamp(d, -1.2, 1.2); st.turns += Math.abs(d) / TAU; g.swirl += d; }
          st.angle = a;
          g.mix = Math.min(1, st.turns / st.n);
          if (Math.floor(st.turns) > st.count) { tone(500 + st.count * 60, 0.1, 'triangle', 0.06); this.tick(g); }
        } else st.angle = null;
      } else if (k === 'shake') {
        const cheese = s.ing === 'cheese';
        if (pressedNow && near(BW_SRC[0], BW_SRC[1], 80)) { st.carry = true; SFX.pick(); }
        if (!down) st.carry = false;
        const over = cheese ? near(BW_PX, BW_PY, 130) : inBowl;
        if (st.carry && over) {
          const d = Math.min(60, Math.hypot(P.x - g.lx, P.y - g.ly));
          st.meter += d / [700, 800, 900][g.tier - 1];
          if (d > 2 && Math.random() < 0.5) tone(rand(1200, 2000), 0.03, 'triangle', 0.03);
          if (cheese && d > 2 && p.cheese.length < 160) for (let i = 0; i < 2; i++) { const a = rand(0, TAU), rr = Math.random() * 30; let cx = P.x - BW_PX + Math.cos(a) * rr, cy = P.y + 30 - BW_PY + Math.sin(a) * rr; const d = Math.hypot(cx, cy); if (d > 84) { cx *= 84 / d; cy *= 84 / d; } p.cheese.push([cx, cy, rand(0, 3)]); }
        }
        if (st.meter >= 1) { st.carry = false; if (!cheese) g.bowl.push('chips'); else for (let i = 0; i < 40; i++) { const a = rand(0, TAU), rr = Math.sqrt(Math.random()) * 84; p.cheese.push([Math.cos(a) * rr, Math.sin(a) * rr, rand(0, 3)]); } this.tick(g); }
      } else if (k === 'fill') {
        // hold the batter on each circle: it spreads, and you let go once the ring turns green
        const sp = st.pouring || p.spots.find(q => !q.done && near(BW_PX + q.x, BW_PY + q.y, p.kind === 'loaf' ? 110 : 50));
        const rate = p.kind === 'loaf' ? 0.42 : p.kind === 'griddle' ? 0.55 : 0.62;
        if (down && sp && !sp.done) {
          st.pouring = sp; sp.f += dt * rate;
          if (Math.random() < 0.4) tone(rand(200, 300), 0.04, 'sine', 0.03);
          if (sp.f > 1.2) { sp.f = 0; st.miss++; st.pouring = null; SFX.miss(); this.msg(g, 'Too much! It spilled over. Try again!', true); }
        } else if (!down && st.pouring) {
          const q = st.pouring; st.pouring = null;
          if (q.f >= 0.78 && q.f <= 1.08) { q.done = true; SFX.pop(); this.tick(g); }
          else if (q.f < 0.78) this.msg(g, 'Keep pouring until it turns green!');
          else { q.f = 0; st.miss++; SFX.miss(); this.msg(g, 'Too much! Try again!', true); }
        }
      } else if (k === 'scoop' || k === 'cut') {
        // pick up dough (or the cutter) and drop it on a dashed shape
        const fx = k === 'scoop' ? BW_SIDE[0] : st.from[0], fy = k === 'scoop' ? BW_SIDE[1] : st.from[1];
        if (pressedNow && near(fx, fy, 85)) { st.carry = true; SFX.pick(); }
        if (released && st.carry) {
          st.carry = false;
          const q = p.spots.find(q => !q.done && near(BW_PX + q.x, BW_PY + q.y, 46));
          if (q) { q.done = true; st.anim = 0.35; st.ax = BW_PX + q.x; st.ay = BW_PY + q.y; SFX.pop(); if (k === 'cut') burst(st.ax, st.ay, 8, { colors: ['#ffffff', '#f8ecd8'], spread: 60, up: 30 }); this.tick(g); }
          else if (Math.hypot(pointer.x - st.from[0], pointer.y - st.from[1]) > 110) { st.miss++; SFX.miss(); this.msg(g, k === 'scoop' ? 'Oops! Put it on a dashed circle.' : 'Oops! Press it on a dotted shape.', true); }
          else this.msg(g, k === 'scoop' ? 'Put it on a dashed circle!' : 'Press it on a dotted shape!');
        }
        if (k === 'cut' && st.done) {
          // the cut friends go onto a baking tray
          g.piece = { kind: 'tray', bake: 0, spots: p.spots.map(q => ({ x: q.x, y: q.y, done: true })) };
        }
      } else if (k === 'roll') {
        if (pressedNow && near(BW_PX, BW_PY, 170)) st.carry = true;
        if (!down) st.carry = false;
        if (st.carry) {
          const dx = Math.min(80, Math.abs(P.x - g.lx));
          st.meter += dx / [900, 1100, 1300][g.tier - 1];
          if (dx > 3 && Math.random() < 0.3) tone(rand(90, 140), 0.06, 'triangle', 0.05);
          if (dx > 6 && Math.random() < 0.15) burst(P.x, P.y + 14, 2, { colors: ['#ffffff'], spread: 40, up: 10, size: [2, 4] });
        }
        p.roll = Math.min(1, st.meter);
        if (st.meter >= 1) { st.carry = false; this.tick(g); }
      } else if (k === 'spread') {
        if (down) {
          let any = false;
          for (const d of p.dabs) if (!d.on && Math.hypot(BW_PX + d.x - P.x, BW_PY + d.y - P.y) < 30) { d.on = true; any = true; }
          if (any && Math.random() < 0.5) SFX.scrub();
          if (p.kind === 'tin') p.spots.forEach((sp, i) => { if (!sp.frosted) { const ds = p.dabs.filter(d => d.area === i); if (ds.filter(d => d.on).length >= ds.length * 0.8) { sp.frosted = true; chime(i + 4); burst(BW_PX + sp.x, BW_PY + sp.y, 6); } } });
        }
        st.cover = p.dabs.filter(d => d.on).length / p.dabs.length;
        if (st.cover >= st.need && (p.kind !== 'tin' || p.spots.every(sp => sp.frosted))) { p.dabs.forEach(d => (d.on = true)); p.spots.forEach(sp => (sp.frosted = true)); if (p.kind === 'tin') p.dabs = null; this.tick(g); }
      } else if (k === 'top') {
        if (pressedNow) { const b = st.bins.find(b => near(b.x, b.y, 44)); if (b) { st.carry = b.k; SFX.pick(); } }
        if (released && st.carry) {
          const kk = st.carry; st.carry = false;
          let q = null, best = 40; for (const c of st.spots) { const d = Math.hypot(BW_PX + c.x - P.x, BW_PY + c.y - P.y); if (!c.done && d < best) { best = d; q = c; } }
          if (!q) this.msg(g, 'Put it on a circle!');
          else if (q.want !== kk) { st.miss++; SFX.miss(); st.wrong = { q, t: 0.5 }; this.msg(g, `That spot needs a ${BW_TOPS[q.want]}!`, true); }
          else {
            q.done = true; SFX.pop(); burst(BW_PX + q.x, BW_PY + q.y, 6);
            const pc = g.piece;
            if (pc.kind === 'tin') pc.spots.find(sp => sp.x === q.x && sp.y === q.y).top = kk;
            else if (pc.kind === 'tray') { const sp = pc.spots.find(sp => sp.x === q.x); if (q.y < sp.y) sp.top = kk; else sp.top2 = kk; }
            else if (pc.kind === 'loaf') (pc.tops = pc.tops || []).push({ k: kk, x: q.x, y: q.y });
            else pc.spots.push({ x: q.x, y: q.y, top: kk });
            this.tick(g);
          }
        }
        if (st.wrong && (st.wrong.t -= dt) <= 0) st.wrong = null;
      } else if (k === 'bake') {
        if (st.phase === 'slide') {
          // drag the tray right into the oven (or just tap the oven)
          if (pressedNow && near(st.px, BW_PY, 150)) { st.carry = true; st.gx = P.x - st.px; }
          if (pressedNow && P.x > 772 && P.y > 290) { st.phase = 'in'; st.t = 0; }
          if (st.carry && down) st.px = Math.max(BW_PX, P.x - st.gx);
          if (!down && st.carry) { st.carry = false; if (st.px < 700) this.msg(g, 'Slide it all the way into the oven!'); }
          if (!st.carry) st.px = lerp(st.px, BW_PX, Math.min(1, dt * 8));
          if (st.px >= 700) { st.phase = 'in'; st.t = 0; st.carry = false; tone(160, 0.25, 'triangle', 0.08, 0, 90); }
        } else if (st.phase === 'in') {
          st.t += dt; st.px = lerp(st.px, 880, Math.min(1, dt * 6));
          if (st.t > 0.5) { st.phase = 'bake'; speak('Now watch it bake! Take it out on the golden star.'); }
        } else if (st.phase === 'bake') {
          st.bar += dt * st.speed; p.bake = st.bar;
          if (Math.random() < dt * 3) tone(rand(80, 110), 0.2, 'sine', 0.02);
          if (id === 'bk:go' || pressed[' '] || pressed.enter || (pointer.clicked && P.x > 772 && P.y > 290) || st.bar >= 1.12) {
            if (st.bar >= st.lo && st.bar <= st.hi) { SFX.hit(); floatText(BW_PX - 60, 200, 'Golden!', '#fff6a8', false, 34); }
            else { st.miss++; SFX.miss(); floatText(BW_PX - 60, 200, st.bar < st.lo ? 'A bit gooey!' : 'A bit too brown!', '#ffd0dc', false, 28); }
            p.bake = clamp(st.bar, 0.45, 1.02); st.phase = 'out'; st.t = 0;
          }
        } else if (st.phase === 'out') {
          st.t += dt; st.px = lerp(st.px, BW_PX, Math.min(1, dt * 5));
          if (st.t > 0.9) { st.phase = 'done'; this.tick(g); }
        }
      } else if (k === 'flip') {
        // the pancake cooks; tap Flip (or the pancake) when the arrow is in the green
        p.spots.forEach(q => { if (q.flipT > 0) q.flipT -= dt; });
        const q = p.spots[st.cur];
        if (!q) return;
        if (!q.flipped) {
          q.cook = (q.cook || 0) + dt * st.speed;
          if (Math.random() < dt * 4) tone(rand(700, 1100), 0.03, 'sine', 0.02);
          if (id === 'bk:go' || pressed[' '] || pressed.enter || (pointer.clicked && near(BW_PX + q.x * 0.8, BW_FY + q.y * 0.8, 50)) || q.cook >= 1.1) {
            if (q.cook >= st.lo && q.cook <= st.hi) { SFX.hit(); floatText(BW_PX + q.x * 0.8, BW_FY - 60 + q.y * 0.8, 'Flip!', '#fff6a8', false, 30); }
            else { st.miss++; SFX.miss(); floatText(BW_PX + q.x * 0.8, BW_FY - 60 + q.y * 0.8, q.cook < st.lo ? 'Too soon!' : 'A bit brown!', '#ffd0dc', false, 26); }
            q.cook = clamp(q.cook, 0.5, 1.0); q.flipped = true; q.flipT = 0.6; st.cur++; tone(600, 0.15, 'triangle', 0.07, 0, 900);
            this.tick(g);
          }
        }
      }
    },
    // the read-aloud card on the left: each step ticks off as it's done
    card(g) {
      const r = g.rec;
      ctx.save(); ctx.shadowColor = 'rgba(60,30,40,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      rrect(14, 66, 212, 372, 14, '#fffaf0'); ctx.restore();
      rrect(14, 66, 212, 372, 14, null, OL, 2.5);
      ctx.strokeStyle = 'rgba(255,140,170,.25)'; ctx.lineWidth = 1; for (let y = 146; y < 430; y += 32) { ctx.beginPath(); ctx.moveTo(24, y + 16); ctx.lineTo(216, y + 16); ctx.stroke(); }
      rrect(90, 58, 60, 16, 3, 'rgba(255,200,120,.7)');
      ctx.save(); ctx.beginPath(); ctx.rect(18, 70, 66, 64); ctx.clip(); bwDish(r, 52, 104, 0.24, null); ctx.restore();
      wrap(r.name, 130, 17, 800).slice(0, 2).forEach((l, i, a) => text(l, 88, 102 + (i - (a.length - 1) / 2) * 19, 17, '#8a3a5a', 'left', 800));
      ctx.strokeStyle = '#ff9ac0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(26, 138); ctx.lineTo(214, 138); ctx.stroke();
      g.steps.forEach((s, i) => {
        const y = 160 + i * 32, now = i === g.si && g.mode === 'steps', done = i < g.si || g.mode === 'reveal';
        if (now) { rrect(20, y - 14, 200, 28, 8, '#fff1a8'); vecStar(20, y, 7, '#ff6fb5', 1); }
        if (done) { inkCircle(38, y, 9, '#5fc87a', 1.2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(33, y); ctx.lineTo(37, y + 4); ctx.lineTo(44, y - 4); ctx.stroke(); }
        else text(`${i + 1}`, 38, y, 15, now ? '#ff4a8a' : '#a090b0', 'center', 800);
        const t = bwStepText(r, s);
        const sz = wrap(t, 166, 14, 700).length > 1 ? 12 : 14;
        text(t, 54, y, sz, now ? '#5a2a6e' : done ? '#9ac8a0' : '#8a7a9a', 'left', now ? 800 : 600);
        if (done) { ctx.strokeStyle = 'rgba(120,180,130,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(54, y + 1); ctx.lineTo(54 + Math.min(166, ctx.measureText(t).width), y + 1); ctx.stroke(); }
      });
    },
    // a little pointing hand shows what to do when the child waits a while
    hint(g) {
      const st = g.st;
      if (!st || g.idle < 2.2 || st.carry || g.pause > 0 || !st.from) return;
      if (st.k === 'bake' && st.phase !== 'slide') { if (st.phase === 'bake' && st.bar >= st.lo && st.bar <= st.hi) { ctx.globalAlpha = 0.85; emoji('👆', BW_PX - 30, 540 - Math.abs(Math.sin(S.t * 6)) * 12, 40); ctx.globalAlpha = 1; } return; }
      const t = (g.idle * 0.7) % 1.4, k = Math.min(1, t), [fx, fy] = st.from, [tx, ty] = st.to || st.from;
      const x = lerp(fx, tx, k), y = lerp(fy, ty, k) + (st.k === 'mash' ? Math.abs(Math.sin(g.idle * 6)) * -16 : 0);
      ctx.globalAlpha = 0.85; emoji('👆', x + 8, y + 26, 40); ctx.globalAlpha = 1;
    },
    draw(g) {
      still('bwp_kitchen', bwKitchen);
      if (g.mode === 'pick' || g.mode === 'chosen') return this.drawPick(g);
      const r = g.rec, st = g.st, P = pointer;
      // oven glows when baking
      const baking = st && st.k === 'bake' && st.phase !== 'slide' && g.mode === 'steps';
      if (baking) { const gl = ctx.createRadialGradient(860, 438, 6, 860, 438, 90); gl.addColorStop(0, `rgba(255,190,80,${0.75 + Math.sin(S.t * 8) * 0.1})`); gl.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gl; rrect(796, 392, 128, 92, 8, gl); bwSteam(860, 200, 3, 22, 0.5); }
      this.card(g);
      drawCritter('Baker Pip', 118, 548 + (g.mode === 'reveal' ? -Math.abs(Math.sin(S.t * 7)) * 10 : 0), 0.52, 1);
      if (g.mode === 'reveal') return this.drawReveal(g);
      // the instruction banner
      const s = g.steps[g.si] || g.steps[g.steps.length - 1];
      ctx.save(); ctx.shadowColor = 'rgba(60,30,40,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; rrect(240, 64, 704, 46, 16, 'rgba(255,255,255,.95)'); ctx.restore();
      rrect(240, 64, 704, 46, 16, null, OL, 2);
      text(bwStepText(r, s), 592, 87, 24, '#5a2a6e', 'center', 800);
      if (st && st.n > 1 && !['stir', 'mash', 'top'].includes(st.k)) for (let i = 0; i < st.n; i++) inkCircle(930 - (st.n - 1 - i) * 18, 87, 6, i < st.count ? '#5fc87a' : '#ffffff', 1.2);
      if (g.pause > 0) {
        if (g.bowlAt) bwBowl(g, ...g.bowlAt);
        if (g.piece) bwPiece(g, g.piece, BW_PX, st.k === 'flip' ? BW_FY : BW_PY, st.k === 'flip' ? 0.8 : 1);
        if (g.piece && (st.k === 'bake' || st.k === 'flip')) bwSteam(BW_PX, BW_PY - 90, 4, 40, 0.8);
        if (g.msgT > 0) outlined(g.msg, 592, 178, 26, '#ffd0dc');
        return;
      }
      this.drawStep(g);
      this.hint(g);
      if (g.msgT > 0) outlined(g.msg, 592, 178, 26, '#ffd0dc');
    },
    drawStep(g) {
      const st = g.st, k = st.k, s = st.s, r = g.rec, p = g.piece, P = pointer;
      const b = g.bowlAt;
      // tools and ingredients that sit behind the bowl
      if (k === 'pour') {
        const tip = st.anim > 0;
        bwJug(400, 236, -(st.tilt || 0) * 1.25, s.ing === 'milk' ? '#ffffff' : '#a8dcff', s.ing === 'milk' ? 'MILK' : 'WATER');
        if (st.held && P.down && (st.tilt || 0) > 0.7) {
          const c = s.ing === 'milk' ? '#ffffff' : '#a8dcff', topY = 470 - 120 * 0.86 * Math.min(1.2, st.level);
          ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(338, 222); ctx.quadraticCurveTo(326, 260, 322, topY); ctx.stroke();
          ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.stroke();
        }
        if (!tip) bwCup(318, 470, st.level, st.line, s.ing === 'milk' ? '#ffffff' : '#a8dcff', Math.abs(st.level - st.line) <= st.tol, st.marks);
      }
      if (b) bwBowl(g, ...b);
      if (k === 'pour' && st.anim > 0) {
        // the measuring cup lifts and tips into the bowl
        const t = 1 - st.anim, x = lerp(318, b[0] - 40, Math.min(1, t * 2)), y = lerp(470, b[1] - 50, Math.min(1, t * 2)), rot = Math.min(1, Math.max(0, t * 2 - 0.6)) * 1.6;
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); bwCup(0, 0, st.level * (1 - Math.max(0, t - 0.5) * 2), st.line, s.ing === 'milk' ? '#ffffff' : '#a8dcff', true, []); ctx.restore();
        if (t > 0.55) { ctx.fillStyle = s.ing === 'milk' ? '#ffffff' : '#a8dcff'; ctx.fillRect(x + 30, y - 20, 10, b[1] - y + 20); }
      }
      if (k === 'crack') {
        bwCarton(BW_SRC[0], BW_SRC[1] + 10, st.n - st.count - (st.carry || st.anim > 0 ? 1 : 0));
        // the dashed rim shows where to knock
        ctx.setLineDash([10, 7]); ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(b[0], b[1], 136, 36, 0, Math.PI, TAU); ctx.stroke(); ctx.setLineDash([]);
        if (st.anim > 0) {
          const o = (0.75 - st.anim) * 50, ex = st.ax, ey = b[1] - 50;
          inkAt(ex - 10 - o * 0.5, ey - o * 0.2, -0.5 - o * 0.02, P2('M0,-24 C-16,-22 -20,6 0,10 L4,-2 L-2,-8 L4,-14 Z'), '#fffaf0', 1.6);
          inkAt(ex + 10 + o * 0.5, ey - o * 0.2, 0.5 + o * 0.02, P2('M0,-24 C16,-22 20,6 0,10 L-4,-2 L2,-8 L-4,-14 Z'), '#fffaf0', 1.6);
          ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(ex, ey + 8 + o * 1.2, 10, 8 + o * 0.2); ctx.fillStyle = '#ffc21a'; circle(ex, ey + 10 + o * 1.4, 8);
        } else if (st.carry) {
          const j = st.shake > 0 ? Math.sin(st.shake * 80) * 4 : 0;
          bwEgg(P.x + j, P.y - 24, 1, st.knocks);
        } else text('Grab an egg!', BW_SRC[0], BW_SRC[1] + 64, 16, '#5a2a6e', 'center', 800);
      } else if (k === 'add') {
        const ing = s.ing, load = ing === 'flour' ? '#ffffff' : '#fffaf2';
        if (ing === 'flour') bwSack(BW_SRC[0], BW_SRC[1], 1.05); else if (ing === 'sugar') bwSugarJar(BW_SRC[0], BW_SRC[1], 1.05); else bwButterDish(BW_SRC[0], BW_SRC[1] + 10, 1, !st.carry && st.anim <= 0);
        if (st.carry) { if (ing === 'flour') bwScoopTool(P.x, P.y, load, -0.2); else if (ing === 'sugar') bwSpoonTool(P.x, P.y, load, -0.3); else bwButter(P.x, P.y, 1.1); }
        else text(ing === 'butter' ? 'Drag the butter!' : 'Drag a ' + (ing === 'flour' ? 'scoop!' : 'spoonful!'), BW_SRC[0], BW_SRC[1] + 70, 16, '#5a2a6e', 'center', 800);
        if (st.anim > 0) { const k2 = 1 - st.anim / 0.45; if (ing === 'butter') bwButter(b[0], b[1] - 30 + k2 * 30, 1); else { ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(b[0], b[1] - 30 - k2 * 30, 20 + k2 * 30); } }
      } else if (k === 'mash') {
        const pr = st.press > 0 ? 1 : 0, mx = P.x, my = P.y + pr * 14;
        if (Math.abs(P.x - b[0]) < 160 && P.y > 200) {
          inkRect(mx - 5, my - 110, 10, 80, '#d8a868', 1.6, 4); inkRect(mx - 9, my - 128, 18, 26, '#ff8fb8', 1.6, 7);
          ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(mx - 30, my); ctx.quadraticCurveTo(mx, my - 40, mx + 30, my); ctx.stroke();
          ctx.strokeStyle = '#d8dce8'; ctx.lineWidth = 4; ctx.stroke(); inkRect(mx - 34, my - 3, 68, 8, '#d8dce8', 1.6, 4);
        }
        rrect(b[0] - 90, 488, 180, 14, 7, 'rgba(255,255,255,.85)', OL, 1.5); rrect(b[0] - 90, 488, 180 * (st.count / st.n), 14, 7, '#ffd23a');
        if (!P.down) bwTip('Tap the bananas to squish them!');
      } else if (k === 'stir') {
        ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,111,181,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(b[0], b[1] + 4, 80, 18, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        const a = S.t * 3; ctx.fillStyle = '#ff6fb5'; tri(b[0] + Math.cos(a) * 80 - 6, b[1] + 4 + Math.sin(a) * 18 - 6, b[0] + Math.cos(a) * 80 + 6, b[1] + 4 + Math.sin(a) * 18, b[0] + Math.cos(a) * 80 - 6, b[1] + 4 + Math.sin(a) * 18 + 6);
        // the wooden spoon follows the pointer while stirring, or rests in the bowl
        const sx = P.down && st.angle != null ? P.x : b[0] + 60, sy = P.down && st.angle != null ? P.y : b[1] - 4;
        inkAt(sx, sy, 0.25, P2('M-5,0 L-5,-110 L5,-110 L5,0 C14,4 14,26 0,28 C-14,26 -14,4 -5,0 Z'), '#d8a868', 1.6);
        if (g.mix > 0.2 && P.down) burst(sx, sy - 4, 1, { colors: [r.batter], spread: 40, up: 30, size: [2, 4] });
        for (let i = 0; i < st.n; i++) { const done = i < st.count; inkCircle(b[0] - (st.n - 1) * 16 + i * 32, 494, 11, done ? '#5fc87a' : '#ffffff', 1.4); if (!done && i === st.count) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(b[0] - (st.n - 1) * 16 + i * 32, 494); ctx.arc(b[0] - (st.n - 1) * 16 + i * 32, 494, 9, -Math.PI / 2, -Math.PI / 2 + TAU * (st.turns % 1)); ctx.fill(); } }
      } else if (k === 'shake') {
        const cheese = s.ing === 'cheese';
        if (cheese) bwPiece(g, p, BW_PX, BW_PY, 1);
        const x = st.carry ? P.x : BW_SRC[0], y = st.carry ? P.y : BW_SRC[1];
        bwBag(x, y, st.carry ? Math.PI * 0.85 + Math.sin(S.t * 22) * 0.35 : 0, s.ing);
        if (st.carry && Math.hypot(P.x - g.lx, P.y - g.ly) > 2) { for (let i = 0; i < 5; i++) { if (cheese) { ctx.fillStyle = '#ffe680'; ctx.fillRect(P.x + rand(-16, 16), P.y + rand(20, 60), 8, 3); } else { ctx.fillStyle = '#4a2a1a'; circle(P.x + rand(-14, 14), P.y + rand(20, 60), 3); } } }
        const mx = cheese ? BW_PX : b[0];
        rrect(mx - 90, 506 - (cheese ? 0 : 6), 180, 14, 7, 'rgba(255,255,255,.85)', OL, 1.5); rrect(mx - 90, 506 - (cheese ? 0 : 6), 180 * Math.min(1, st.meter), 14, 7, cheese ? '#ffd23a' : '#8a4a2a');
        if (!st.carry) text('Grab the bag and shake!', BW_SRC[0], BW_SRC[1] + 64, 15, '#5a2a6e', 'center', 800);
      } else if (k === 'fill' || k === 'scoop') {
        bwPiece(g, p, BW_PX, BW_PY, 1);
        const R0 = p.kind === 'griddle' ? 46 : p.kind === 'loaf' ? 0 : 30;
        for (const q of p.spots) {
          if (q.done) continue;
          const x = BW_PX + q.x, y = BW_PY + q.y;
          if (k === 'fill') {
            const good = q.f >= 0.78 && q.f <= 1.08;
            if (p.kind === 'loaf') {
              const ly = BW_PY + 52 - 94 * 0.9;
              ctx.setLineDash([8, 6]); ctx.strokeStyle = good ? '#2fbf5a' : '#ff4a6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(BW_PX - 112, ly); ctx.lineTo(BW_PX + 112, ly); ctx.stroke(); ctx.setLineDash([]);
              vecStar(BW_PX + 128, ly, 10, good ? '#7ae08a' : '#ffd23a', 1.4);
            } else {
              ctx.setLineDash([6, 5]); ctx.strokeStyle = good ? '#2fbf5a' : '#ffffff'; ctx.lineWidth = good ? 5 : 3; ctx.beginPath(); ctx.arc(x, y, R0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
            }
          } else { ctx.setLineDash([6, 5]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 28, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        }
        if (k === 'fill') {
          // a jug of batter: it tips and pours wherever you hold it
          const pouring = P.down && st.pouring;
          const jx = P.down ? P.x + 40 : BW_SIDE[0] + 4, jy = P.down ? P.y - 86 : BW_SIDE[1] - 70;
          if (pouring) { ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(jx - 40, jy + 10); ctx.quadraticCurveTo(P.x - 4, P.y - 30, P.x, P.y); ctx.stroke(); ctx.strokeStyle = r.batter; ctx.lineWidth = 8; ctx.stroke(); }
          bwJug(jx, jy, pouring ? -1.0 : P.down ? -0.3 : 0, r.batter, 'BATTER');
          if (!P.down) text('Hold on a circle!', BW_PX, BW_PY + 120, 16, '#5a2a6e', 'center', 800);
        } else {
          if (st.carry) { inkCircle(P.x, P.y, 22, r.batter, 1.6); ctx.fillStyle = '#4a2a1a'; for (let i = 0; i < 4; i++) circle(P.x - 9 + i * 6, P.y - 6 + (i % 2) * 9, 2.6); ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(P.x - 7, P.y - 8, 7, 3); }
          else text('Drag dough to the tray!', BW_SIDE[0], BW_SIDE[1] + 100, 15, '#5a2a6e', 'center', 800);
        }
      } else if (k === 'roll') {
        bwPiece(g, p, BW_PX, BW_PY, 1);
        const px = st.carry ? P.x : BW_PX, py = st.carry ? P.y : BW_PY - 10;
        bwPin(clamp(px, 330, 760), py, 150);
        rrect(BW_PX - 90, 510, 180, 14, 7, 'rgba(255,255,255,.85)', OL, 1.5); rrect(BW_PX - 90, 510, 180 * Math.min(1, st.meter), 14, 7, '#e0a860');
        if (!st.carry) bwTip('Hold the rolling pin and roll it back and forth!');
      } else if (k === 'cut') {
        bwPiece(g, p, BW_PX, BW_PY, 1);
        for (const q of p.spots) if (!q.done) { ctx.save(); ctx.translate(BW_PX + q.x, BW_PY + q.y); ctx.scale(1.25, 1.25); ctx.setLineDash([4, 4]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke(BW_MAN); ctx.setLineDash([]); ctx.restore(); }
        if (st.carry) bwCutter(P.x, P.y, 1.3); else { bwCutter(st.from[0], st.from[1], 1.3); text('Drag the cutter!', st.from[0], st.from[1] + 64, 15, '#5a2a6e', 'center', 800); }
        if (st.anim > 0) { ctx.globalAlpha = st.anim / 0.35; bwCutter(st.ax, st.ay - 10 * (1 - st.anim / 0.35), 1.3); ctx.globalAlpha = 1; }
      } else if (k === 'spread') {
        // a little dish of sauce (or frosting) beside the work, and the tool you rub with
        inkEllipse(BW_SRC[0], BW_SRC[1] + 20, 50, 20, 0, '#ffffff', 2); ctx.fillStyle = s.ing === 'sauce' ? '#e8453a' : r.frost; ellipse(BW_SRC[0], BW_SRC[1] + 16, 38, 12);
        bwPiece(g, p, BW_PX, BW_PY, 1);
        if (p.areas) for (const [cx, cy, cr] of p.areas) { ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(BW_PX + cx, BW_PY + cy, cr, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        if (P.down) {
          if (s.ing === 'sauce') { inkAt(P.x, P.y, 0.4, P2('M-4,-10 L-4,-90 L4,-90 L4,-10 Z'), '#d8d8e8', 1.4); inkEllipse(P.x, P.y, 20, 12, 0, '#e8453a', 1.6); }
          else { inkAt(P.x, P.y, -0.5, P2('M-8,0 L-8,-60 C-8,-68 8,-68 8,-60 L8,0 Z'), '#e8eef8', 1.4); inkAt(P.x, P.y, -0.5, P2('M-5,0 L-5,40 L5,40 L5,0 Z'), '#ff8fb8', 1.2); }
        }
        const c = st.cover || 0;
        rrect(BW_PX - 90, 510, 180, 14, 7, 'rgba(255,255,255,.85)', OL, 1.5); rrect(BW_PX - 90, 510, 180 * Math.min(1, c / st.need), 14, 7, s.ing === 'sauce' ? '#e8453a' : r.frost);
        if (!P.down) bwTip('Hold down and rub all over!');
      } else if (k === 'top') {
        bwPiece(g, g.piece, BW_PX, BW_PY, 1);
        for (const q of st.spots) {
          if (q.done) continue;
          const x = BW_PX + q.x, y = BW_PY + q.y, wrong = st.wrong && st.wrong.q === q;
          ctx.fillStyle = wrong ? 'rgba(255,90,120,.5)' : 'rgba(255,255,255,.55)'; circle(x, y, 18);
          ctx.setLineDash([4, 4]); ctx.strokeStyle = wrong ? '#ff4a6a' : '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          if (q.hide) text('?', x, y + 1, 20, '#9a4ae0', 'center', 800);
          else if (s.kinds.length > 1) { ctx.globalAlpha = 0.5; bwTopping(q.want, x, y, 0.8); ctx.globalAlpha = 1; }
        }
        st.bins.forEach(bn => bwBin(bn.x, bn.y, bn.k, st.carry === bn.k));
        if (st.carry) bwTopping(st.carry, P.x, P.y, 1.25);
        else text('Drag ➜', 300, st.bins[st.bins.length - 1].y + 52, 15, '#5a2a6e', 'center', 800);
      } else if (k === 'bake') {
        this.drawBake(g);
      } else if (k === 'flip') {
        bwPiece(g, p, BW_PX, BW_FY, 0.8);
        const q = p.spots[st.cur];
        if (q) {
          ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 4; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(BW_PX + q.x * 0.8, BW_FY + q.y * 0.8, 44, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          this.gauge(g, q.cook || 0, st.lo, st.hi, 'pan');
          // a spatula waiting beside the pancake
          inkAt(BW_PX + q.x * 0.8 + 62, BW_FY - 10 + q.y * 0.8, -0.6, P2('M-14,-20 L14,-20 L12,14 L-12,14 Z M-3,14 L-3,70 L3,70 L3,14 Z'), '#d8dce8', 1.4);
          button('bk:go', BW_PX - 90, 486, 180, 46, 'Flip!', { color: '#ff6fb5', size: 22 });
        }
      }
    },
    // the doneness gauge: pale, golden star, too brown
    gauge(g, v, lo, hi, kind) {
      const x = BW_PX - 170, y = 456, w = 340;
      rrect(x, y - 10, w, 20, 10, '#ffffff', OL, 2);
      const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, g.rec.raw); gr.addColorStop(lo, g.rec.gold); gr.addColorStop(hi, g.rec.gold); gr.addColorStop(1, '#6a3a1a');
      rrect(x + 3, y - 7, w - 6, 14, 7, gr);
      rrect(x + w * lo, y - 12, w * (hi - lo), 24, 8, null, '#2fbf5a', 4);
      vecStar(x + w * (lo + hi) / 2, y - 24, 11, '#ffd23a', 1.4);
      const ax = x + w * clamp(v, 0, 1);
      ctx.fillStyle = OL; tri(ax - 10, y + 22, ax + 10, y + 22, ax, y + 6); ctx.fillStyle = '#ff6fb5'; tri(ax - 7, y + 20, ax + 7, y + 20, ax, y + 9);
    },
    drawBake(g) {
      const st = g.st, p = g.piece;
      if (st.phase === 'slide' || st.phase === 'in' || st.phase === 'out' || st.phase === 'done') {
        // the tray on the counter, sliding toward (or back out of) the oven
        ctx.save(); if (st.phase !== 'slide') { ctx.beginPath(); ctx.rect(0, 0, 772, H); ctx.clip(); }
        bwPiece(g, p, st.px, BW_PY, 1);
        ctx.restore();
        if (st.phase === 'slide') { const k = (S.t * 1.5) % 1; ctx.globalAlpha = 0.9; for (let i = 0; i < 3; i++) { const ax = st.px + 170 + i * 26 + k * 10; ctx.fillStyle = OL; tri(ax - 2, BW_PY - 20, ax - 2, BW_PY + 20, ax + 20, BW_PY); ctx.fillStyle = '#ff6fb5'; tri(ax + 1, BW_PY - 14, ax + 1, BW_PY + 14, ax + 15, BW_PY); } ctx.globalAlpha = 1; }
        if (st.phase === 'out' || st.phase === 'done') { bwSteam(st.px, BW_PY - 80, 4, 40, 0.8); }
        if (st.phase === 'slide' && !st.carry) bwTip('Drag the tray into the oven!');
        return;
      }
      // baking: a big look through the oven door
      const cx = BW_PX - 40, cy = 270;
      inkRect(cx - 222, cy - 140, 444, 270, '#8edcc4', 3, 18);
      inkRect(cx - 206, cy - 118, 412, 214, '#3a2228', 2.5, 12);
      const gl = ctx.createRadialGradient(cx, cy + 40, 10, cx, cy, 240); gl.addColorStop(0, `rgba(255,200,90,${0.85 + Math.sin(S.t * 7) * 0.08})`); gl.addColorStop(1, 'rgba(180,60,30,.4)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.roundRect(cx - 200, cy - 112, 400, 202, 10); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(cx - 200, cy - 112, 400, 202, 10); ctx.clip();
      ctx.strokeStyle = '#a8a0b0'; ctx.lineWidth = 3; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 44, cy + 50); ctx.lineTo(cx + i * 44 + 10, cy + 80); ctx.stroke(); }
      bwPiece(g, p, cx, cy + 6, 0.62);
      ctx.strokeStyle = `rgba(255,${80 + Math.sin(S.t * 5) * 40},40,.9)`; ctx.lineWidth = 6; ctx.beginPath(); for (let x = cx - 190; x < cx + 190; x += 30) { ctx.moveTo(x, cy + 86); ctx.quadraticCurveTo(x + 15, cy + 74, x + 30, cy + 86); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(cx - 190, cy - 112); ctx.lineTo(cx - 120, cy - 112); ctx.lineTo(cx - 200, cy); ctx.closePath(); ctx.fill();
      ctx.restore();
      bwSteam(cx, cy - 40, 3, 60, 0.35 + st.bar * 0.3);
      inkRect(cx - 120, cy - 134, 240, 12, '#d8d8e8', 1.6, 6);
      this.gauge(g, st.bar, st.lo, st.hi, 'oven');
      button('bk:go', BW_PX - 130, 486, 180, 46, 'Take it out!', { color: '#ff6fb5', size: 22 });
    },
    drawPick(g) {
      ctx.fillStyle = 'rgba(255,240,230,.55)'; ctx.fillRect(0, 60, W, H - 60);
      outlined('Pick a recipe to bake with Pip!', W / 2, 88, 28, '#ff6fb5', 'center', '#fff');
      BW_RECIPES.forEach((r, i) => {
        const x = 22 + (i % 3) * 312, y = 112 + Math.floor(i / 3) * 210, w = 292, h = 196;
        const hov = g.hover === i && g.mode === 'pick', chosen = g.mode === 'chosen' && g.chosen === i;
        if (g.mode === 'chosen' && !chosen) ctx.globalAlpha = 0.35;
        const lift = hov ? -4 : chosen ? -6 - Math.abs(Math.sin(S.t * 8)) * 4 : 0;
        ctx.save(); ctx.shadowColor = 'rgba(80,30,60,.35)'; ctx.shadowBlur = hov || chosen ? 16 : 8; ctx.shadowOffsetY = 4;
        rrect(x, y + lift, w, h, 18, '#fffaf2'); ctx.restore();
        rrect(x, y + lift, w, h, 18, null, chosen ? '#ffd23a' : hov ? '#ff6fb5' : OL, chosen || hov ? 5 : 2.5);
        rrect(x + 8, y + 8 + lift, w - 16, 132, 12, ['#ffe4ee', '#fff2d0', '#f0e4d8', '#ffe8d8', '#f4e2d0', '#fff6d0'][i]);
        ctx.save(); ctx.beginPath(); ctx.roundRect(x + 8, y + 8 + lift, w - 16, 132, 12); ctx.clip();
        bwDish(r, x + w / 2, y + 78 + lift, r.key === 'pancakes' ? 0.62 : r.key === 'pizza' ? 0.5 : 0.6, null);
        ctx.restore();
        rrect(x + 10, y + 12 + lift, 30, 30, 15, '#ff6fb5'); text(`${i + 1}`, x + 25, y + 27 + lift, 17, '#fff', 'center', 800);
        text(r.name, x + w / 2, y + 166 + lift, r.name.length > 16 ? 20 : 24, '#8a3a5a', 'center', 800);
        ctx.globalAlpha = 1;
        if (chosen) bwSparkles(x + w / 2, y + 90, w, h, 10);
      });
    },
    drawReveal(g) {
      const r = g.rec, t = g.revealT, k = Math.min(1, t / 0.6), cx = 560, cy = 300;
      // sunburst behind the finished dish
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(S.t * 0.3);
      ctx.globalAlpha = 0.55 * k;
      for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#fff2a8' : '#ffd0e0'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 420, i * TAU / 16, (i + 1) * TAU / 16); ctx.closePath(); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
      const gl = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200); gl.addColorStop(0, 'rgba(255,255,255,.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; circle(cx, cy, 200);
      const sc = (r.key === 'pizza' ? 1.4 : 1.35) * (0.4 + 0.6 * k) * (1 + Math.sin(S.t * 3) * 0.02);
      bwDish(r, cx, cy + 10, sc, r.key === 'cookies' ? null : g.piece);
      bwSteam(cx, cy - 90 * sc, 4, 40, 0.7);
      bwSparkles(cx, cy, 460, 300, 16);
      outlined(`You made ${r.name}!`, cx, 108, r.name.length > 16 ? 32 : 38, '#ff6fb5', 'center', '#fff');
      // Pip cheers from the side
      ctx.save(); ctx.translate(0, 0);
      rrect(220, 440, 236, 44, 18, '#ffffff', OL, 2); ctx.fillStyle = '#ffffff'; tri(232, 470, 250, 470, 214, 494);
      text('Super baker! Yum!', 338, 462, 18, '#8a3a5a', 'center', 800);
      ctx.restore();
      const stars = Math.round(g.score * 3);
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < stars ? 1 : 0.25; vecStar(cx - 60 + i * 60, 488, 20, '#ffd23a', 2); }
      ctx.globalAlpha = 1;
    },
  };

  restage('bakery', {
    bg: 'bakery_bg',
    games: [['cupcakefactory', 'ribbon'], ['bakewithpip', 'berry']],
    intro: ["N:Oh, Aubrey, thank goodness! The party orders are piling up and my cupcake factory needs a helper!", 'N:Press each machine just as a cupcake rolls under it, and read the order tags!', 'A:determined:I got this!'],
    mid: ['N:Phew! Now let\'s bake something together, from scratch!', "N:I'll give you my recipe card. Read it carefully and do each step just right.", 'A:excited:I love baking!'],
    outro: ['N:You saved the party! Take these cake ribbons and blueberries.', 'A:happy:Yum, thank you!'],
  });

  // =====================================================================================
  // 4. KITE HILL
  // =====================================================================================
  const KITE_COLS = ['#ff5f7e', '#ffd23a', '#40b0ff', '#5adc7a', '#9c6cff', '#ff9a3a'];
  // a diamond kite whose top is at (x, y); tail streams behind (to the left by default)
  function drawKite(x, y, s, cols, t, rot = 0, tailDir = -1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    // tail: a wavy string with bows
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 96);
    const pts = [];
    for (let i = 1; i <= 24; i++) { const k = i / 24, px = tailDir * k * 40 + Math.sin(t * 6 - k * 7) * 12 * k, py = 96 + k * 110; ctx.lineTo(px, py); if (i % 6 === 0) pts.push([px, py]); }
    ctx.stroke();
    pts.forEach(([px, py], i) => bow(px, py, 9, cols[(i + 1) % cols.length], 1.4, Math.sin(t * 5 + i) * 0.4));
    const quads = [[0, 0, 40, 34, 0, 34], [0, 0, -40, 34, 0, 34], [0, 96, 40, 34, 0, 34], [0, 96, -40, 34, 0, 34]];
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(40, 34); ctx.lineTo(0, 96); ctx.lineTo(-40, 34); ctx.closePath(); ctx.stroke();
    quads.forEach(([ax, ay, bx2, by2, cx2, cy2], i) => { ctx.fillStyle = cols[i % cols.length]; tri(ax, ay, bx2, by2, cx2, cy2); });
    ctx.strokeStyle = 'rgba(91,63,115,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 96); ctx.moveTo(-40, 34); ctx.lineTo(40, 34); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; tri(0, 4, -32, 34, -6, 34);
    ctx.restore();
  }
  function boxKite(x, y, s, c1, c2) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(0.2);
    for (const dy of [0, 44]) { inkRect(-22, dy, 44, 22, c1, 2, 2); ctx.fillStyle = c2; ctx.fillRect(-8, dy + 2, 16, 18); }
    ctx.strokeStyle = OL; ctx.lineWidth = 2; for (const dx of [-22, 22]) { ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, 66); ctx.stroke(); }
    ctx.restore();
  }
  function fishKite(x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const w = Math.sin(t * 5) * 8;
    ink(P2(`M0,0 C20,-26 70,-24 96,${-6 + w} L118,${-20 + w} L112,${4 + w} L120,${26 + w} L96,${12 + w} C70,26 20,26 0,0 Z`), '#ff7a5a', 2);
    ctx.fillStyle = '#ffd23a'; for (const k of [30, 54, 78]) ellipse(k, Math.sin(t * 5 + k) * 2, 6, 14);
    inkCircle(14, -2, 6, '#fff', 1.2); ctx.fillStyle = '#2a1a2a'; circle(15, -2, 3);
    ctx.restore();
  }
  function windmill(x, y, t, s = 0.8) {
    // tower (base at y), cap, and four lattice sails turning
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); x = 0; y = 0;
    ink(P2(`M${x - 40},${y} L${x - 26},${y - 150} L${x + 26},${y - 150} L${x + 40},${y} Z`), '#fff4e8', 2.5);
    ctx.fillStyle = '#f0dcc8'; for (let k = 1; k < 6; k++) ctx.fillRect(x - 40 + k * 2.5, y - k * 26, 80 - k * 5, 3);
    inkRect(x - 12, y - 40, 24, 40, '#c98a5a', 2, 12); inkCircle(x, y - 100, 10, '#bfe6ff', 2);
    ink(P2(`M${x - 34},${y - 148} C${x - 30},${y - 190} ${x + 30},${y - 190} ${x + 34},${y - 148} Z`), '#d0505a', 2.5);
    const hx = x, hy = y - 160;
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + i * Math.PI / 2;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(a);
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -104); ctx.stroke();
      ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 3; ctx.stroke();
      inkRect(2, -104, 22, 80, 'rgba(255,255,255,.85)', 1.8, 2);
      ctx.strokeStyle = 'rgba(160,104,58,.7)'; ctx.lineWidth = 1.5; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(2, -104 + k * 16); ctx.lineTo(24, -104 + k * 16); ctx.stroke(); }
      ctx.restore();
    }
    inkCircle(hx, hy, 8, '#ffd23a', 2);
    ctx.restore();
  }
  const hillY = x => (x < 640 ? 410 - Math.sin((x / 640) * Math.PI / 2) * 190 : 220 + ((x - 640) / 320) ** 1.6 * 110);
  function kiteStatic() {
    bdSky('#2fb0ff', '#dff6ff');
    bdHills('#b8e4c8', 300, 26, 0.006, 0.5);
    for (const [x, h] of [[90, 60], [140, 74], [360, 56], [420, 70], [900, 64]]) drawTree(x, 312, h, 20, 2, 0);
    bdHills('#9ed88a', 360, 18, 0.009, 2.5);
    // the big hill
    const hg = ctx.createLinearGradient(0, 220, 0, H);
    hg.addColorStop(0, '#7ad35a'); hg.addColorStop(1, '#4fae46');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, hillY(x));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,90,40,.4)'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, hillY(x)); ctx.stroke();
    // mowing stripes and a winding path up to the windmill
    ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * 180, H); ctx.lineTo(i * 180 + 90, H); ctx.lineTo(560 + i * 30, hillY(560 + i * 30) + 10); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(470, 450); ctx.bezierCurveTo(620, 420, 520, 330, 700, 300); ctx.stroke();
    ctx.strokeStyle = 'rgba(91,63,115,.15)'; ctx.lineWidth = 2; ctx.stroke();
    const R = rng(21);
    for (let i = 0; i < 90; i++) { const x = R() * W, y = hillY(x) + 20 + R() * (H - hillY(x) - 20); tinyFlower(x, y, 2.5 + (y - 220) / 110, ['#ffffff', '#ffd23a', '#ff9ac8', '#c6a2ff'][i % 4]); }
    // the near grass and a picnic blanket
    ctx.fillStyle = '#6cc457'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 446); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 444 + Math.sin(x * 0.04) * 3); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#7ad064'; for (let i = 0; i < 40; i++) ellipse(R() * W, 456 + R() * 80, 14, 3);
    ctx.save(); ctx.translate(470, 474); ctx.transform(1, 0, -0.5, 0.5, 0, 0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = (i + j) % 2 ? '#ff5f7e' : '#ffffff'; ctx.fillRect(i * 30, j * 30, 30, 30); }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.strokeRect(0, 0, 120, 120);
    ctx.restore();
    emoji('🧺', 492, 486, 34);
  }
  BACKDROPS.kitehill_bg = () => {
    still('b1_kite', kiteStatic);
    bdSunburst(120, 104);
    // fast clouds and swooshes of wind
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    for (let i = 0; i < 4; i++) { const cx = ((i * 290 + S.t * 30) % (W + 300)) - 150, cy = 80 + (i % 2) * 50; ellipse(cx, cy, 60, 18); ellipse(cx + 30, cy - 12, 36, 18); ellipse(cx - 34, cy + 2, 30, 13); }
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const k = (S.t * 0.5 + i / 6) % 1, x = k * (W + 300) - 150, y = 130 + (i * 67) % 200;
      ctx.globalAlpha = Math.sin(k * Math.PI); ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 40, y - 10, x + 70, y + 10, x + 110, y); ctx.arc(x + 110, y - 10, 10, Math.PI / 2, -Math.PI / 2, true); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    windmill(770, 300, S.t);
    // kites high up, each on a string down to a tiny flyer on the hill
    const kites = [[200, 120, 0.6, [KITE_COLS[0], KITE_COLS[1]], 470], [420, 92, 0.5, [KITE_COLS[2], KITE_COLS[3]], 540], [560, 170, 0.45, [KITE_COLS[4], KITE_COLS[1]], 610], [900, 120, 0.5, [KITE_COLS[3], KITE_COLS[5]], 880]];
    kites.forEach(([x, y, s, cols, gx], i) => {
      const kx = x + Math.sin(S.t * 0.8 + i * 2) * 16, ky = y + Math.sin(S.t * 1.3 + i) * 10, gy = hillY(gx);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(kx, ky + 34 * s); ctx.quadraticCurveTo((kx + gx) / 2 + 30, (ky + gy) / 2 + 40, gx, gy - 14); ctx.stroke();
      drawKite(kx, ky, s, cols, S.t + i, Math.sin(S.t * 1.1 + i) * 0.15);
      inkCircle(gx, gy - 18, 4, '#ffd0b0', 1); ink(P2(`M${gx - 5},${gy} L${gx},${gy - 14} L${gx + 5},${gy} Z`), KITE_COLS[(i + 2) % 6], 1);
    });
    const bkx = 330 + Math.sin(S.t * 0.9) * 10, bky = 200 + Math.sin(S.t * 1.6) * 8;
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bkx, bky + 60); ctx.lineTo(380, hillY(380) - 14); ctx.stroke();
    boxKite(bkx, bky, 0.7, '#ff9ac8', '#fff6a8');
    const fkx = 660 + Math.sin(S.t * 0.7) * 14, fky = 110 + Math.sin(S.t * 1.2) * 8;
    ctx.beginPath(); ctx.moveTo(fkx, fky); ctx.lineTo(700, hillY(700) - 14); ctx.stroke();
    fishKite(fkx, fky, 0.55, S.t);
    // grass along the crest bends in the wind, and leaves tumble past
    ctx.lineCap = 'round';
    for (let x = 6; x < W; x += 14) {
      const y = hillY(x), b = Math.sin(S.t * 3 + x * 0.05) * 4 + 6;
      ctx.strokeStyle = (x / 14) % 2 ? '#5ab84a' : '#8ad86a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.quadraticCurveTo(x + b * 0.4, y - 6, x + b, y - 12); ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const k = (S.t * 0.25 + i / 5) % 1, x = k * (W + 100) - 50, y = 200 + (i * 71) % 200 + Math.sin(S.t * 3 + i) * 20;
      ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 4 + i); ctx.fillStyle = ['#ffb03a', '#ff7a5a', '#8ad86a'][i % 3]; ellipse(0, 0, 7, 3.5); ctx.restore();
    }
  };

  // --- kite flyer: steer up and down, catch only ribbons of the asked colour, dodge bees ----
  const KF_X = 280;
  const KF_NAMES = ['pink', 'yellow', 'blue', 'green', 'purple', 'orange']; // matches KITE_COLS
  const KF_PHASE = 12;
  function drawBee(x, y, t, ph) {
    const f = Math.sin(t * 40 + ph) * 0.5;
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = 0.85;
    inkEllipse(4, -14, 11, 7 + f * 3, -0.5, '#eaf6ff', 1.6); inkEllipse(-6, -15, 10, 6 + f * 3, 0.5, '#eaf6ff', 1.6);
    ctx.globalAlpha = 1;
    inkEllipse(0, 0, 19, 13, 0, '#ffd23a', 2.4);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-4, -14, 6, 28); ctx.fillRect(8, -14, 5, 28); ctx.restore();
    ctx.fillStyle = '#3a2a1a'; tri(18, -3, 18, 3, 26, 0);
    inkCircle(-17, -1, 8, '#3a2a1a', 2);
    ctx.fillStyle = '#fff'; circle(-20, -3, 3); ctx.fillStyle = '#000'; circle(-21, -3, 1.6);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-19, -8); ctx.lineTo(-24, -16); ctx.moveTo(-15, -8); ctx.lineTo(-16, -17); ctx.stroke();
    ctx.restore();
  }
  MG.kiteflyer = {
    kind: 'action', title: () => 'Kite Flyer', icon: () => '🪁',
    how: () => 'Move the mouse up and down, or use the up and down arrows, to steer the kite. Only catch the ribbons in the colour at the top! Dodge the buzzy bees.',
    init(g) {
      const cols = shuffle([0, 1, 2, 3, 4, 5]).slice(0, [3, 4, 5][g.tier - 1]);
      const order = shuffle(cols.slice());
      Object.assign(g, { timeLeft: KF_PHASE * 3, ky: 260, kv: 0, gust: 0, gv: 0, scroll: 0, items: [], gusts: [], spawnT: 0.5, gustT: 4, beeT: 2.5,
        got: 0, ribbons: 0, wrong: 0, hits: 0, inv: 0, tilt: 0, cols, order, cround: 0, flash: 0 });
      g.target = order[0];
      g.say = `Catch the ${KF_NAMES[g.target]} ribbons! Dodge the bees!`;
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.timeLeft -= dt; g.inv = Math.max(0, g.inv - dt); g.flash = Math.max(0, g.flash - dt);
      const sp = [140, 170, 200][g.tier - 1];
      g.scroll += sp * dt;
      // a new colour every KF_PHASE seconds
      const ph = Math.min(2, Math.floor((KF_PHASE * 3 - g.timeLeft) / KF_PHASE));
      if (ph !== g.cround) {
        g.cround = ph; g.target = g.order[ph % g.order.length]; g.flash = 2;
        g.say = `Now catch the ${KF_NAMES[g.target]} ribbons!`; speak(g.say); SFX.sparkle();
      }
      // steering: pointer y, or held arrows
      const oy = g.ky;
      const ay = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (ay) { g.ky += ay * 300 * dt; g.usePointer = false; }
      else if (pointerMoved(g)) g.ky = lerp(g.ky, pointer.y, Math.min(1, dt * 7));
      g.ky = clamp(g.ky, 100, 430);
      // gentle gusts nudge the kite, then it settles back
      g.gv += (-g.gust * 18 - g.gv * 5) * dt; g.gust += g.gv * dt;
      const y = clamp(g.ky + g.gust, 90, 450);
      g.tilt = lerp(g.tilt, clamp((g.ky - oy) / dt / 600, -0.4, 0.4) + g.gv * 0.002, Math.min(1, dt * 6));
      if ((g.gustT -= dt) <= 0) { g.gustT = rand(4, 6); g.gusts.push({ x: W + 60, y: rand(150, 420), dir: pick([-1, 1]), hit: false }); }
      for (const gu of g.gusts) {
        gu.x -= sp * 1.4 * dt;
        if (!gu.hit && Math.abs(gu.x - KF_X) < 30 && Math.abs(gu.y - y) < 90) { gu.hit = true; g.gv += gu.dir * (130 + g.tier * 30); tone(300, 0.4, 'sine', 0.06, 0, gu.dir < 0 ? 600 : 160); }
      }
      g.gusts = g.gusts.filter(gu => gu.x > -100);
      // ribbons in a mix of colours float in from the right; about half are the one to catch
      if ((g.spawnT -= dt) <= 0) {
        g.spawnT = rand(0.6, 0.95);
        const want = Math.random() < 0.5, others = g.cols.filter(c => c !== g.target);
        const c = want ? g.target : pick(others);
        let yy = rand(160, 420);
        for (let k = 0; k < 4 && g.items.some(it => it.x > W - 40 && Math.abs(it.y - yy) < 70); k++) yy = rand(160, 420);
        g.items.push({ kind: 'ribbon', x: W + 40, y: yy, ph: rand(0, 6), c });
      }
      // bees buzz in, wobbling; on harder levels they drift toward the kite
      if ((g.beeT -= dt) <= 0) {
        g.beeT = rand(1.8, 2.8) - g.tier * 0.3;
        g.items.push({ kind: 'bee', x: W + 40, y: rand(160, 420), ph: rand(0, 6), vx: rand(50, 90) });
      }
      for (const it of g.items) {
        it.x -= (sp + (it.vx || 0)) * dt;
        if (it.kind === 'bee') {
          if (g.tier > 1 && it.x > KF_X + 60) it.y += clamp(y + 40 - it.y, -1, 1) * (g.tier - 1) * 18 * dt;
          it.yy = it.y + Math.sin(g.t * 4 + it.ph) * 20;
        } else it.yy = it.y + Math.sin(g.t * 3 + it.ph) * 6;
        if (it.gone) continue;
        const d = Math.hypot(it.x - KF_X, it.yy - (y + 40));
        // the asked colour is easy to grab; others only count if you fly right through them
        if (it.kind === 'ribbon' && d < (it.c === g.target ? 52 : 32)) {
          it.gone = true;
          if (it.c === g.target) { g.got++; SFX.pick(); chime(g.got); burst(it.x, it.yy, 10, { colors: [KITE_COLS[it.c], '#fff6a8'] }); }
          else { g.wrong++; SFX.miss(); floatText(it.x, it.yy - 30, `That's ${KF_NAMES[it.c]}!`, '#fff', false, 24); }
        }
        if (it.kind === 'bee' && d < 40 && g.inv <= 0) {
          g.hits++; g.inv = 1.4; SFX.miss(); g.gv += 200; it.gone = true;
          floatText(KF_X, y - 20, 'Bzzz! Look out!', '#fff', false, 24);
        }
      }
      // count the target ribbons that drift past (caught or not) so missing them costs stars
      for (const it of g.items) if (it.kind === 'ribbon' && it.c === g.target && !it.counted && (it.gone || it.x < KF_X - 60)) { it.counted = true; g.ribbons++; }
      g.items = g.items.filter(it => it.x > -120 && !it.gone);
      g.y = y;
      g.progress = `🎀 ${g.got} ribbons`;
      g.score = g.ribbons ? clamp(g.got / g.ribbons * 1.25 - g.wrong * 0.04 - g.hits * 0.06, 0, 1) : 0;
      if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      // a scrolling sky over the hills
      const sk = ctx.createLinearGradient(0, 60, 0, H);
      sk.addColorStop(0, '#2fb0ff'); sk.addColorStop(1, '#e8f8ff');
      ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 5; i++) { const cx = ((i * 260 - g.scroll * 0.3) % (W + 300) + W + 300) % (W + 300) - 150, cy = 110 + (i * 83) % 260; ellipse(cx, cy, 64, 20); ellipse(cx + 30, cy - 12, 40, 20); ellipse(cx - 36, cy + 3, 32, 14); }
      ctx.fillStyle = '#b8e4c8'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 440 - Math.sin((x + g.scroll * 0.2) * 0.008) * 30); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = '#8ad070'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 490 - Math.sin((x + g.scroll * 0.5) * 0.011 + 2) * 16); ctx.lineTo(W, H); ctx.fill();
      // gusts: swirly bands of wind with an arrow showing which way they'll push
      for (const gu of g.gusts) {
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let k = -1; k <= 1; k++) { const yy = gu.y + k * 30; ctx.beginPath(); ctx.moveTo(gu.x - 50, yy); ctx.bezierCurveTo(gu.x - 20, yy - 14, gu.x + 10, yy + 14, gu.x + 50, yy); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.95)'; const ay = gu.y + gu.dir * 54;
        tri(gu.x - 14, ay - gu.dir * 14, gu.x + 14, ay - gu.dir * 14, gu.x, ay + gu.dir * 6);
      }
      for (const it of g.items) {
        if (it.kind === 'ribbon') { ctx.fillStyle = 'rgba(255,255,255,.5)'; circle(it.x, it.yy, 28); bow(it.x, it.yy, 22, KITE_COLS[it.c], 2, Math.sin(g.t * 2 + it.ph) * 0.3); }
        else drawBee(it.x, it.yy, g.t, it.ph);
      }
      // the kite and its string down to Leo, off the bottom of the screen
      const y = g.y ?? g.ky;
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(KF_X, y + 40); ctx.quadraticCurveTo(KF_X - 120, (y + H) / 2 + 60, 40, H + 10); ctx.stroke();
      ctx.globalAlpha = g.inv > 0 && Math.floor(g.t * 12) % 2 ? 0.45 : 1;
      drawKite(KF_X, y, 0.95, ['#ff5f7e', '#ffd23a', '#40b0ff', '#5adc7a'], g.t, g.tilt);
      ctx.globalAlpha = 1;
      // which colour to catch: a big sign under the header, pulsing when it changes
      const col = KITE_COLS[g.target], pulse = 1 + (g.flash > 0 ? Math.sin(g.flash * 12) * 0.06 : 0);
      ctx.save(); ctx.translate(W / 2, 96); ctx.scale(pulse, pulse);
      rrect(-215, -28, 430, 56, 28, '#fffdf4', OL, 3);
      ctx.fillStyle = col; circle(-180, 0, 22); bow(-180, 0, 18, col, 2);
      text('Catch', -148, 1, 26, '#4a3a5a', 'left', 800);
      outlined(KF_NAMES[g.target].toUpperCase(), 48, 1, 32, col, 'center');
      ctx.fillStyle = col; circle(180, 0, 22); bow(180, 0, 18, col, 2);
      ctx.restore();
    },
  };

  // --- symmetry kite: paint the empty half to mirror the painted half -------------------
  // the kite is an n×n grid squashed into a diamond; tile (i, j) mirrors (j, i)
  const SK = { cx: 380, cy: 268, hw: 200, hh: 196 };
  const skPoint = (u, v) => [SK.cx + (u - v) * SK.hw, SK.cy - SK.hh + (u + v) * SK.hh];
  const skUV = (x, y) => { const a = (x - SK.cx) / SK.hw, b = (y - SK.cy + SK.hh) / SK.hh; return [(a + b) / 2, (b - a) / 2]; };
  const SK_PAL = ['#ff5f7e', '#40b0ff', '#ffd23a', '#5adc7a'];
  const SK_NAMES = ['pink', 'blue', 'yellow', 'green'];
  MG.symkite = {
    kind: 'learn', title: () => 'Symmetry Kite', icon: () => '🪁',
    how: () => "Leo's kite is only half painted! Pick a colour, then tap the empty tiles so the right side matches the left side, like a mirror.",
    init(g) { Object.assign(g, { round: 0, rounds: 3, total: 0, sel: 0, flash: null }); this.next(g); },
    start(g) { speak(g.say); },
    next(g) {
      const n = [4, 5, 6][g.tier - 1], k = [2, 3, 4][g.tier - 1];
      const col = {};
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i <= j) col[`${i},${j}`] = randInt(0, k - 1);
      // make sure every colour shows up on the painted half
      const left = Object.keys(col).filter(c => { const [i, j] = c.split(',').map(Number); return i < j; });
      shuffle(left).slice(0, k).forEach((c, idx) => { col[c] = idx; });
      const paint = {};
      Object.assign(g, { n, k, col, paint, misses: 0, state: 'pick', t2: 0, lift: 0 });
      g.say = 'Make the right side match the left side, like a mirror!';
      if (g.phase === 'play') speak(g.say);
    },
    target(g, i, j) { return g.col[`${j},${i}`]; },
    cellAt(g, x, y) {
      const [u, v] = skUV(x, y);
      if (u < 0 || v < 0 || u >= 1 || v >= 1) return null;
      return [Math.floor(u * g.n), Math.floor(v * g.n)];
    },
    update(g, dt, id) {
      if (g.flash) { g.flash.t -= dt; if (g.flash.t <= 0) g.flash = null; }
      const key = numKey(g.k);
      if (key >= 0) { g.sel = key; SFX.click(); }
      const pc = id ? pickId(id, 'col:') : -1;
      if (pc >= 0) g.sel = pc;
      if (g.state === 'pick' && pointer.clicked && !id) {
        const c = this.cellAt(g, pointer.x, pointer.y);
        if (c) {
          const [i, j] = c;
          if (i <= j) { g.flash = { i, j, t: 0.8, side: true }; SFX.blip(); speak('Paint the empty side!'); }
          else if (g.paint[`${i},${j}`] === undefined) {
            if (this.target(g, i, j) === g.sel) {
              g.paint[`${i},${j}`] = g.sel; SFX.pop(); chime(Object.keys(g.paint).length * 2);
              const [x, y] = skPoint((i + 0.5) / g.n, (j + 0.5) / g.n); burst(x, y, 8, { colors: [SK_PAL[g.sel], '#fff'] });
              const need = g.n * (g.n - 1) / 2;
              if (Object.keys(g.paint).length === need) {
                g.state = 'fly'; g.t2 = 2.6; SFX.sparkle(); g.total += Math.max(0, 1 - g.misses * 0.15);
                speak(pick(['A perfect mirror!', 'Both sides match!', 'Beautiful! It flies!']));
              }
            } else {
              g.misses++; SFX.miss(); g.flash = { i: j, j: i, t: 1.2, wrong: [i, j] };
              speak(`Look at the matching tile on the other side. It's ${SK_NAMES[this.target(g, i, j)]}!`);
            }
          }
        }
      }
      if (g.state === 'fly') {
        g.t2 -= dt; g.lift += dt;
        if (g.t2 <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      }
      g.progress = `Kite ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      const lift = g.state === 'fly' ? -easeOut(Math.min(1, g.lift / 1.2)) * 40 + Math.sin(S.t * 3) * 6 : 0;
      ctx.save(); ctx.translate(0, lift);
      // tail and the cross spars behind
      const by = SK.cy + SK.hh;
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(SK.cx, by);
      for (let i = 1; i <= 12; i++) ctx.lineTo(SK.cx + Math.sin(S.t * 4 - i * 0.6) * 10 - i * 4, by + i * 6);
      ctx.stroke();
      // tiles
      const hover = g.state === 'pick' ? this.cellAt(g, pointer.x, pointer.y - lift) : null;
      for (let i = 0; i < g.n; i++) for (let j = 0; j < g.n; j++) {
        const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([u, v]) => skPoint(u / g.n, v / g.n));
        const p = new Path2D(); c.forEach(([x, y], k) => (k ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath();
        const given = i <= j, painted = g.paint[`${i},${j}`];
        const fill = given ? SK_PAL[g.col[`${i},${j}`]] : painted !== undefined ? SK_PAL[painted] : '#fffaf2';
        ctx.fillStyle = fill; ctx.fill(p);
        ctx.strokeStyle = 'rgba(91,63,115,.55)'; ctx.lineWidth = 2; ctx.stroke(p);
        if (!given && painted === undefined) {
          ctx.fillStyle = 'rgba(200,180,220,.5)'; const [x, y] = skPoint((i + 0.5) / g.n, (j + 0.5) / g.n); circle(x, y, 4);
        }
        if (hover && hover[0] === i && hover[1] === j && !given && painted === undefined) { ctx.fillStyle = mix(SK_PAL[g.sel], '#ffffff', 0.55); ctx.fill(p); }
      }
      // the outline, the spars, and the mirror line down the middle
      const T = skPoint(0, 0), Rr = skPoint(1, 0), B = skPoint(1, 1), L = skPoint(0, 1);
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(...T); ctx.lineTo(...Rr); ctx.lineTo(...B); ctx.lineTo(...L); ctx.closePath(); ctx.stroke();
      ctx.setLineDash([10, 8]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...T); ctx.lineTo(...B); ctx.stroke(); ctx.setLineDash([]);
      // the hovered tile's mirror twin glows, and mistakes point at it
      const twin = hover && hover[0] > hover[1] ? [hover[1], hover[0]] : null;
      const glow = g.flash && !g.flash.side ? [g.flash.i, g.flash.j] : twin;
      if (glow) {
        const c = [[glow[0], glow[1]], [glow[0] + 1, glow[1]], [glow[0] + 1, glow[1] + 1], [glow[0], glow[1] + 1]].map(([u, v]) => skPoint(u / g.n, v / g.n));
        ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 5 + Math.sin(S.t * 8) * 2; ctx.beginPath(); c.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
      }
      if (g.flash && g.flash.wrong) {
        const [x, y] = skPoint((g.flash.wrong[0] + 0.5) / g.n, (g.flash.wrong[1] + 0.5) / g.n);
        outlined('✗', x, y, 30, '#ff5f7e', 'center', '#fff');
      }
      ctx.restore();
      text('painted side', SK.cx - SK.hw * 0.62, SK.cy + SK.hh * 0.62 + lift, 17, '#4a2a5e', 'center', 700);
      text('your side', SK.cx + SK.hw * 0.62, SK.cy + SK.hh * 0.62 + lift, 17, '#4a2a5e', 'center', 700);
      // the paint pots
      panel(660, 80, 270, 72 + g.k * 92, 22);
      text('Pick a colour', 795, 108, 20, '#5a2a6e', 'center', 700);
      for (let c = 0; c < g.k; c++) {
        const y = 132 + c * 92, on = g.sel === c;
        button(`col:${c}`, 680, y, 230, 80, SK_NAMES[c], { color: SK_PAL[c] === '#ffd23a' ? '#e8b820' : SK_PAL[c], key: String(c + 1), size: 22 });
        inkCircle(720, y + 40, 22, SK_PAL[c], 2);
        if (on) { ctx.strokeStyle = '#4a2a5e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(674, y - 6, 242, 92, 18); ctx.stroke(); emoji('🖌️', 892, y + 40, 30); }
      }
      if (g.state === 'fly') outlined('It matches!', SK.cx, 100, 34, '#fff6a8');
    },
  };

  restage('kitehill', {
    bg: 'kitehill_bg',
    games: [['kiteflyer', 'ribbon'], ['symkite', 'ribbon']],
    intro: ["N:The wind is PERFECT for kites today! Want to fly mine?", "N:Catch the ribbons in the colour I call out — and watch out for the buzzy bees!", 'A:excited:Let me try!'],
    mid: ["N:Uh-oh, my new kite is only half painted. I want both sides to match, like a mirror!", 'A:thinking:Like a butterfly! Same on both sides.'],
    outro: ['N:Now it flies even better! Take some kite-tail ribbons. They flutter so pretty!', 'A:happy:Thanks, Leo!'],
  });

  // =====================================================================================
  // 5. GNOME VILLAGE
  // =====================================================================================
  function toadstoolHouse(x, gy, s, cap, spots = '#ffffff', glow = 1) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    // stem house with a round door, window and a flower box
    ink(P2('M-50,0 C-56,-60 -46,-110 -40,-130 L40,-130 C46,-110 56,-60 50,0 Z'), '#fff2dc', 2.5);
    ctx.fillStyle = 'rgba(200,150,110,.25)'; ctx.beginPath(); ctx.moveTo(20, -126); ctx.quadraticCurveTo(44, -60, 40, 0); ctx.lineTo(50, 0); ctx.quadraticCurveTo(54, -60, 40, -128); ctx.fill();
    ink(P2('M-18,0 L-18,-40 C-18,-62 18,-62 18,-40 L18,0 Z'), '#b0703a', 2);
    ctx.strokeStyle = 'rgba(90,40,20,.45)'; ctx.lineWidth = 1.5; for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(dx, -4); ctx.lineTo(dx, -50); ctx.stroke(); }
    inkCircle(10, -24, 3, '#ffd23a', 1);
    inkCircle(-26, -88, 15, `rgba(255,${210 + glow * 20},120,1)`, 2); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-41, -88); ctx.lineTo(-11, -88); ctx.moveTo(-26, -103); ctx.lineTo(-26, -73); ctx.stroke();
    inkRect(-44, -70, 36, 9, '#a0683a', 1.5, 2); for (let i = 0; i < 4; i++) tinyFlower(-40 + i * 9, -74, 4, ['#ff6fae', '#ffd23a', '#c6a2ff', '#ffffff'][i]);
    inkCircle(26, -98, 10, `rgba(255,${210 + glow * 20},120,1)`, 1.8);
    // the cap with its spots
    const capP = P2('M-96,-118 C-92,-200 92,-200 96,-118 C60,-104 -60,-104 -96,-118 Z');
    ink(capP, cap, 3);
    ctx.save(); ctx.clip(capP);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(-30, -178, 40, 14, -0.2);
    ctx.fillStyle = spots; for (const [sx, sy, r] of [[-56, -140, 13], [-14, -168, 16], [34, -150, 12], [66, -128, 9], [-80, -122, 7], [10, -126, 8], [52, -176, 8]]) circle(sx, sy, r);
    ctx.restore();
    ctx.fillStyle = 'rgba(91,63,115,.25)'; ellipse(0, -112, 80, 6);
    ctx.restore();
  }
  function lantern(x, y, t, ph, col = '#ffb03a') {
    const f = 0.75 + Math.sin(t * 7 + ph) * 0.12 + Math.sin(t * 11 + ph) * 0.08;
    const gl = ctx.createRadialGradient(x, y + 8, 2, x, y + 8, 40); gl.addColorStop(0, `rgba(255,220,120,${0.6 * f})`); gl.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = gl; circle(x, y + 8, 40);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 2); ctx.stroke();
    inkRect(x - 7, y - 3, 14, 4, '#5a4a5a', 1, 1);
    inkEllipse(x, y + 9, 9, 11, 0, mix(col, '#fff6c0', f - 0.5), 1.4);
    inkRect(x - 6, y + 19, 12, 3, '#5a4a5a', 1, 1);
  }
  function fern(x, y, s, col = '#3fa04a') {
    ctx.strokeStyle = col; ctx.lineCap = 'round';
    for (const a of [-1.2, -0.7, -0.25, 0.25, 0.7, 1.2]) {
      const ex = x + Math.sin(a) * 60 * s, ey = y - Math.cos(a) * 54 * s;
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.sin(a) * 30 * s, y - 50 * s, ex, ey); ctx.stroke();
      ctx.lineWidth = 2; for (let k = 0.3; k < 1; k += 0.14) { const px = lerp(x, ex, k), py = lerp(y - 30 * s * k, ey, k); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 6 * s, py - 6 * s); ctx.moveTo(px, py); ctx.lineTo(px + 6 * s, py - 6 * s); ctx.stroke(); }
    }
  }
  function tinyShroom(x, y, s, cap = '#ff5f6a') { inkRect(x - 3 * s, y - 10 * s, 6 * s, 10 * s, '#fff6e0', 1, 2); inkEllipse(x, y - 10 * s, 10 * s, 6 * s, 0, cap, 1.2); ctx.fillStyle = '#fff'; circle(x - 3 * s, y - 12 * s, 1.6 * s); circle(x + 4 * s, y - 11 * s, 1.2 * s); }
  function rootDoor(x, y, s) {
    ink(P2(`M${x - 14 * s},${y} L${x - 14 * s},${y - 22 * s} C${x - 14 * s},${y - 36 * s} ${x + 14 * s},${y - 36 * s} ${x + 14 * s},${y - 22 * s} L${x + 14 * s},${y} Z`), '#5fb8f0', 1.6);
    inkCircle(x + 7 * s, y - 12 * s, 2 * s, '#ffd23a', 0.8);
    inkRect(x - 18 * s, y, 36 * s, 4 * s, '#a89ab4', 1, 1);
  }
  function gnomeStatic() {
    // light filtering down through the canopy
    bdSky('#9fdcc0', '#fff4c8');
    ctx.fillStyle = 'rgba(80,150,90,.35)'; for (let i = 0; i < 12; i++) ellipse(i * 90 + 30, 50 + (i % 3) * 14, 90, 40);
    // far trees, soft and pale
    for (let i = 0; i < 9; i++) { const x = 40 + i * 115; ctx.fillStyle = 'rgba(90,140,110,.45)'; ctx.fillRect(x - 12, 90, 24, 260); ctx.fillStyle = 'rgba(110,170,120,.4)'; ellipse(x, 100, 80, 50); }
    bdHills('#a8d890', 330, 14, 0.01, 1);
    const fg = ctx.createLinearGradient(0, 320, 0, H); fg.addColorStop(0, '#8ccf6a'); fg.addColorStop(1, '#5aa850');
    ctx.fillStyle = fg; ctx.fillRect(0, 330, W, H - 330);
    // two great trunks with tiny doors among their roots
    for (const [x, w] of [[90, 120], [880, 110]]) {
      ink(P2(`M${x - w / 2 - 30},${GY - 30} C${x - w / 2},${GY - 60} ${x - w / 2 + 8},${GY - 160} ${x - w / 2 + 14},0 L${x + w / 2 - 14},0 C${x + w / 2 - 8},${GY - 160} ${x + w / 2},${GY - 60} ${x + w / 2 + 30},${GY - 30} Z`), '#8a5a3a', 3);
      ctx.strokeStyle = 'rgba(60,30,15,.4)'; ctx.lineWidth = 3;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 18, GY - 60); ctx.bezierCurveTo(x + k * 14, 300, x + k * 20, 200, x + k * 16, 0); ctx.stroke(); }
      ctx.fillStyle = '#5ab84a'; ellipse(x - 20, 230, 22, 8); ellipse(x + 26, 330, 16, 6);
    }
    rootDoor(70, GY - 46, 1.4); inkCircle(110, 300, 9, '#ffe9a0', 1.5);
    rootDoor(900, GY - 48, 1.2); inkRect(864, 360, 22, 6, '#a0683a', 1.2, 1);
    // winding stepping-stone path up to the village
    const R = rng(33);
    for (let i = 0; i < 16; i++) { const k = i / 15, x = 480 + Math.sin(k * 5) * 120 * (1 - k * 0.5), y = 520 - k * 190; inkEllipse(x, y, 26 - k * 14, 10 - k * 5, 0, ['#d8d0e0', '#c8c0d4', '#e8e0ec'][i % 3], 1.4); }
    // toadstool houses: far ones first
    toadstoolHouse(330, 340, 0.62, '#4f8fe8');
    toadstoolHouse(660, 336, 0.7, '#ff9a3a', '#fff6c0');
    toadstoolHouse(480, 320, 0.5, '#c06ae0');
    toadstoolHouse(240, 420, 0.9, '#ff4a4a');
    toadstoolHouse(760, 424, 0.95, '#ff5f9a');
    // a little well and a signpost
    inkRect(560, 380, 56, 30, '#c8c0d4', 2, 4); ctx.fillStyle = '#9a90a8'; for (let x = 564; x < 612; x += 12) ctx.fillRect(x, 384, 8, 4);
    for (const dx of [562, 606]) inkRect(dx, 340, 6, 42, '#8a5a3a', 1.5, 1);
    ink(P2('M550,344 L588,320 L626,344 Z'), '#c06ae0', 2);
    inkRect(400, 410, 6, 40, '#8a5a3a', 1.5, 1); inkRect(372, 404, 62, 18, '#c99060', 1.5, 3); text('Gnomes ➜', 403, 413, 11, '#5a2a1a', 'center', 800);
    // ferns, tiny mushrooms and flowers everywhere
    for (const [x, y, s] of [[170, 440, 0.8], [330, 450, 0.6], [600, 446, 0.7], [960, 430, 0.9], [20, 470, 0.9], [440, 360, 0.4], [700, 360, 0.45]]) fern(x, y, s);
    for (let i = 0; i < 30; i++) tinyShroom(R() * W, 350 + R() * 100, 0.6 + R() * 0.6, ['#ff5f6a', '#ffb03a', '#c06ae0'][i % 3]);
    // the mossy ground where everyone stands
    ctx.fillStyle = '#6cbc56'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 452); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 450 + Math.sin(x * 0.05) * 3); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#7ccb62'; for (let i = 0; i < 40; i++) ellipse(R() * W, 462 + R() * 76, 14, 3);
    for (let i = 0; i < 4; i++) { const k = i / 3; inkEllipse(480 + Math.sin(k * 2) * 40, 530 - k * 60, 34, 11, 0, '#d8d0e0', 1.4); }
    for (let i = 0; i < 20; i++) tinyFlower(R() * W, 460 + R() * 76, 3.5, ['#ffffff', '#ffd23a', '#ff9ac8'][i % 3]);
  }
  BACKDROPS.gnomes_bg = () => {
    still('b1_gnomes', gnomeStatic);
    // sunbeams, lanterns on a string, fireflies, chimney smoke
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(255,250,200,${0.12 + 0.06 * Math.sin(S.t * 0.8 + i)})`;
      ctx.beginPath(); ctx.moveTo(180 + i * 190, 60); ctx.lineTo(240 + i * 190, 60); ctx.lineTo(330 + i * 190, 440); ctx.lineTo(250 + i * 190, 440); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = '#5a4a5a'; ctx.lineWidth = 1.5;
    for (const [x0, x1, y] of [[150, 470, 200], [490, 830, 196]]) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 70, x1, y); ctx.stroke();
      for (let k = 1; k < 6; k++) { const t = k / 6, x = lerp(x0, x1, t), yy = y + 70 * 2 * t * (1 - t); lantern(x, yy + 8, S.t, k + x0, ['#ffb03a', '#ff6fae', '#7ad0ff', '#c6a2ff', '#ffd23a'][k % 5]); }
    }
    for (const [x, y] of [[300, 300], [660, 290]]) for (let i = 0; i < 3; i++) {
      const k = (S.t * 0.35 + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; circle(x + Math.sin(S.t + i) * 8 + k * 10, y - k * 70, 6 + k * 8);
    }
    for (let i = 0; i < 14; i++) {
      const x = (i * 97 + Math.sin(S.t * 0.6 + i) * 40 + W) % W, y = 240 + (i * 53) % 200 + Math.sin(S.t * 1.3 + i * 2) * 16, a = 0.5 + 0.5 * Math.sin(S.t * 4 + i * 1.7);
      ctx.fillStyle = `rgba(255,250,150,${0.3 * a})`; circle(x, y, 8); ctx.fillStyle = `rgba(255,255,200,${a})`; circle(x, y, 2.5);
    }
  };

  // --- mushroom hop: bounce up a tower of springy mushrooms ------------------------------
  const MH_CAPS = ['#ff4a4a', '#4f8fe8', '#c06ae0', '#ff9a3a', '#ff5f9a'];
  function springShroom(x, y, w, cap, squash) {
    // cap top is at y; the stem hangs below
    const sq = 1 - squash * 0.25;
    inkRect(x - w * 0.16, y, w * 0.32, 46, '#fff2dc', 2, 6);
    ctx.save(); ctx.translate(x, y + 8); ctx.scale(1 + squash * 0.15, sq);
    const p = P2(`M${-w / 2},0 C${-w / 2},${-w * 0.42} ${w / 2},${-w * 0.42} ${w / 2},0 C${w / 4},6 ${-w / 4},6 ${-w / 2},0 Z`);
    ink(p, cap, 2.5);
    ctx.save(); ctx.clip(p); ctx.fillStyle = 'rgba(255,255,255,.9)'; for (const [sx, sy, r] of [[-0.25, -0.18, 0.08], [0.1, -0.26, 0.1], [0.3, -0.1, 0.06], [-0.05, -0.08, 0.05]]) circle(sx * w, sy * w, r * w); ctx.restore();
    ctx.restore();
  }
  MG.mushhop = {
    kind: 'action', title: () => 'Mushroom Hop', icon: () => '🍄',
    how: () => 'Boing! Aubrey bounces on the springy mushrooms. Steer left and right with the mouse or the arrow keys to bounce all the way to the top, and grab the berries on the way!',
    init(g) {
      const n = [16, 20, 24][g.tier - 1], plats = [{ x: W / 2, y: 0, w: W, ground: true }];
      let px = W / 2, y = 0;
      for (let i = 1; i <= n; i++) {
        y -= rand(108, 128 + g.tier * 6);
        const w = i === n ? 200 : rand(120, 150) - g.tier * 10;
        px = i === n ? W / 2 : clamp(px + rand(110, 250) * pick([-1, 1]), 110, W - 110);
        plats.push({ x: px, y, w, cap: i === n ? '#ffd23a' : pick(MH_CAPS), squash: 0, move: g.tier > 1 && i > 3 && i < n && Math.random() < 0.15 * g.tier ? rand(40, 80) : 0, ph: rand(0, 6), x0: px, top: i === n, gold: i < n && i % 7 === 6 });
      }
      const berries = [];
      for (let i = 1; i < n; i++) if (Math.random() < 0.7) { const a = plats[i], b = plats[i + 1]; berries.push({ x: lerp(a.x, b.x, 0.5) + rand(-40, 40), y: lerp(a.y, b.y, 0.5) - 30, got: false }); }
      Object.assign(g, { plats, berries, n, px: W / 2, py: 0, vy: -760, cam: -360, last: 0, best: 0, got: 0, falls: 0, timeLeft: [60, 60, 55][g.tier - 1], facing: 1, win: 0, top: plats[n].y });
      g.say = 'Bounce to the top! Steer left and right.';
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      if (g.win > 0) { g.win += dt; if (g.win > 2) g.done = true; return; }
      g.timeLeft -= dt;
      for (const p of g.plats) { p.squash = Math.max(0, p.squash - dt * 4); if (p.move) p.x = p.x0 + Math.sin(g.t * 1.4 + p.ph) * p.move; }
      // steering
      const ox = g.px, ax = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0);
      if (ax) { g.px += ax * 340 * dt; g.usePointer = false; }
      else if (pointerMoved(g) || g.usePointer) { const d = pointer.x - g.px; g.px += clamp(d, -420 * dt, 420 * dt); }
      g.px = clamp(g.px, 30, W - 30);
      if (Math.abs(g.px - ox) > 0.5) g.facing = Math.sign(g.px - ox);
      // bounce physics: land only while falling
      const prevY = g.py;
      g.vy += 1500 * dt; g.py += g.vy * dt;
      if (g.vy > 0) for (const p of g.plats) {
        if (prevY <= p.y && g.py >= p.y && Math.abs(g.px - p.x) < p.w / 2 + 12) {
          g.py = p.y; g.vy = p.gold ? -1020 : -790; p.squash = 1;
          tone(p.gold ? 420 : 300, 0.22, 'sine', 0.1, 0, p.gold ? 1300 : 900);
          const idx = g.plats.indexOf(p);
          g.last = idx; g.best = Math.max(g.best, idx);
          if (p.top) { g.win = 0.01; g.vy = 0; SFX.fanfare(); burst(g.px, 240, 40); speak('You made it to the top!'); }
          break;
        }
      }
      // berries along the way
      for (const b of g.berries) if (!b.got && Math.hypot(b.x - g.px, b.y - (g.py - 40)) < 46) { b.got = true; g.got++; SFX.pick(); burst(b.x, b.y - g.cam, 8, { colors: ['#5a6ae8', '#ff5f7e', '#fff6a8'] }); }
      // the camera only ever climbs; falling out the bottom gets you carried back up
      g.cam = Math.min(g.cam, g.py - 330);
      if (g.py - g.cam > H + 80) {
        const p = g.plats[g.last]; g.falls++;
        g.px = p.x; g.py = p.y; g.vy = -790; g.cam = p.y - 400; p.squash = 1;
        tone(600, 0.3, 'sine', 0.06, 0, 300); speak('Whoops! A leaf caught you!');
        floatText(g.px, 200, 'Whoops!', '#fff', false, 28);
      }
      const frac = g.best / g.n;
      g.progress = `🫐 ${g.got}   ⬆ ${Math.round(frac * 100)}%`;
      g.score = clamp(frac * 0.65 + (g.berries.length ? g.got / g.berries.length : 1) * 0.35 + (g.win ? 0.1 : 0) - Math.min(0.2, g.falls * 0.03), 0, 1);
      if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      // the sky changes as you climb: woods, then treetops, then open sky
      const k = clamp(-g.cam / -g.top, 0, 1);
      const sk = ctx.createLinearGradient(0, 0, 0, H);
      sk.addColorStop(0, mix('#9fdcc0', '#5ab8ff', k)); sk.addColorStop(1, mix('#e8f4c8', '#fff0f8', k));
      ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
      // tree trunks up the sides, scrolling slower than the mushrooms
      const par = -g.cam * 0.5;
      for (const x of [40, 920]) {
        ctx.fillStyle = 'rgba(138,90,58,.55)'; ctx.fillRect(x - 30, 0, 60, H);
        ctx.fillStyle = 'rgba(80,160,90,.6)';
        for (let i = -1; i < 6; i++) { const y = ((i * 140 + par) % 840 + 840) % 840 - 150; ellipse(x + (x < W / 2 ? 40 : -40), y, 60, 30); }
      }
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 4; i++) { const y = ((i * 190 - g.cam * 0.3) % 760 + 760) % 760 - 100; ellipse(200 + i * 190, y, 50 * k, 16 * k); }
      for (let i = 0; i < 10; i++) { const y = ((i * 71 - g.cam * 0.7) % 600 + 600) % 600 - 30, x = (i * 113 + Math.sin(S.t + i) * 30) % W; ctx.fillStyle = `rgba(255,255,160,${0.6 * (1 - k)})`; circle(x, y, 3); }
      ctx.save(); ctx.translate(0, -g.cam);
      for (const p of g.plats) {
        if (p.y - g.cam < -80 || p.y - g.cam > H + 80) continue;
        if (p.ground) { ctx.fillStyle = '#6cbc56'; ctx.fillRect(0, p.y + 8, W, 200); ctx.fillStyle = '#8ccf6a'; ctx.fillRect(0, p.y + 4, W, 10); for (let x = 20; x < W; x += 90) tinyShroom(x, p.y + 10, 1.4, MH_CAPS[(x / 90 | 0) % 5]); continue; }
        if (p.gold) { ctx.fillStyle = 'rgba(255,240,120,.4)'; circle(p.x, p.y, p.w * 0.6 + Math.sin(S.t * 5) * 4); }
        springShroom(p.x, p.y, p.w, p.cap, p.squash);
        if (p.top) { toadstoolHouse(p.x + 120, p.y + 2, 0.5, '#ffd23a', '#ff6fae'); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - 60, p.y - 40); ctx.lineTo(p.x - 60, p.y - 120); ctx.stroke(); ctx.fillStyle = '#ff5f7e'; tri(p.x - 60, p.y - 120, p.x - 20, p.y - 108, p.x - 60, p.y - 96); outlined('TOP!', p.x, p.y - 70, 28, '#fff6a8'); }
      }
      for (const b of g.berries) if (!b.got) { ctx.fillStyle = 'rgba(255,255,220,.5)'; circle(b.x, b.y + Math.sin(S.t * 3 + b.x) * 4, 22); emoji('🫐', b.x, b.y + Math.sin(S.t * 3 + b.x) * 4, 30); }
      // Aubrey: crouched as she lands, jumping on the way up
      const frame = g.win ? 'twirl' : g.vy < -300 ? 'jump' : g.vy > 200 ? 'jump' : 'crouch';
      drawAubrey(g.px, g.py + 4, frame, g.facing, 0, 0.36);
      ctx.restore();
      // a height meter up the right side
      darkPanel(W - 44, 80, 28, 400, 14);
      const f = g.best / g.n;
      rrect(W - 38, 86 + 388 * (1 - f), 16, 388 * f, 8, '#ffd23a');
      emoji('🏠', W - 30, 72, 22); emoji('👧', W - 30, 86 + 388 * (1 - clamp((-g.py) / -g.top, 0, 1)), 18);
      if (g.win) outlined('You made it!', W / 2, 200, 44, '#fff6a8');
    },
  };

  // --- gnome door keys: match the numeral on the door to the key with that many dots -----
  // Little doors sit in the roots of a giant tree. Drag a key off the jangly ring to the keyhole (or
  // tap it), twist it round to push up the lock pins, and the door creaks open on something to count.
  // Key faces: dots (tier 1); ten-frames, fingers or tally marks (tier 2); sums like 2+3 or a full
  // ten-frame and some more (tier 3). A wrong key jams, and Gnorbert counts its dots out loud.
  const GKD = { x: 480, top: 104, base: 326, hw: 76, kx: 480, ky: 284, ringY: 352, ringRx: 340, ringRy: 20, gx: 862, gy: 362, tx: 646, ty: 262 };
  const GK_KEYS = [{ rim: '#ffd84a', dark: '#e0a828', dot: '#ff4f7a' }, { rim: '#e4eaf4', dark: '#a8b4c8', dot: '#3a8ff0' }, { rim: '#f4a868', dark: '#c8783a', dot: '#8c5cf0' }, { rim: '#ffbcd4', dark: '#e088a8', dot: '#2fae5a' }];
  const GK_DOORS = ['#5fb8f0', '#ff8fb8', '#5adc7a', '#c06ae0', '#ff9a3a', '#4fc8c0'];
  const GK_CAPS = ['#ff4a4a', '#c06ae0', '#ff9a3a', '#4f8fe8', '#ff5f9a'];
  const GK_ROOMS = [
    { id: 'tea', one: 'ladybug', many: 'ladybugs', tail: ' at the tea party' },
    { id: 'glow', one: 'glowing mushroom', many: 'glowing mushrooms', tail: '' },
    { id: 'hog', one: 'acorn', many: 'acorns', tail: ' for the sleepy hedgehog' },
    { id: 'dinner', one: 'gnome', many: 'gnomes', tail: ' at dinner' },
    { id: 'fly', one: 'firefly', many: 'fireflies', tail: ' glowing in the dark' },
  ];
  const GK_DIE = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const gkEase = k => k * k * (3 - 2 * k);
  const gkWords = (from, to) => { const w = []; for (let i = from; i <= to; i++) w.push(NUM_WORDS[i]); return w.join(', '); };
  const gkJingle = n => { for (let i = 0; i < n; i++) tone(rand(2200, 3400), 0.07, 'triangle', 0.035, i * 0.05 + rand(0, 0.02)); };
  const gkClunk = () => { tone(140, 0.18, 'square', 0.07, 0, 70); tone(70, 0.3, 'triangle', 0.12, 0.04); };
  const gkTick = () => { tone(1800, 0.03, 'square', 0.04); tone(900, 0.05, 'triangle', 0.07, 0.02); };
  const gkCreak = () => { tone(150, 0.9, 'sawtooth', 0.03, 0, 300); tone(210, 0.7, 'sawtooth', 0.02, 0.25, 130); };
  const gkKnock = () => { tone(160, 0.08, 'triangle', 0.16); tone(150, 0.08, 'triangle', 0.16, 0.18); };
  // how a key shows its number
  function gkRep(v, tier) {
    if (tier === 1) return { kind: 'dots', v };
    if (tier === 2) return { kind: pick(v <= 6 ? ['frame', 'fingers', 'tally', 'dots'] : ['frame', 'fingers', 'tally']), v };
    if (v > 10) return { kind: 'framex', v };
    if (v >= 2 && Math.random() < 0.7) { const a = randInt(Math.max(1, v - 5), Math.min(5, v - 1)); return { kind: 'sum', v, a, b: v - a }; }
    return { kind: 'frame', v };
  }
  const gkUnitName = rep => (rep.kind === 'tally' ? 'marks' : rep.kind === 'fingers' ? 'fingers' : 'dots');
  // the things to count on a key face, in counting order, in key-face coordinates
  function gkUnits(rep) {
    const v = rep.v, u = [];
    if (rep.kind === 'dots') for (const [a, b] of GK_DIE[v]) u.push([a * 15, b * 15]);
    else if (rep.kind === 'frame') for (let i = 0; i < v; i++) u.push([(i % 5 - 2) * 13, (Math.floor(i / 5) - 0.5) * 13]);
    else if (rep.kind === 'framex') for (let i = 0; i < v; i++) { const j = i % 10; u.push([(j % 5 - 2) * 11, (Math.floor(j / 5) - 0.5) * 11 + (i < 10 ? -13 : 13)]); }
    else if (rep.kind === 'sum') { for (const [n, cx] of [[rep.a, -19], [rep.b, 19]]) for (const [a, b] of GK_DIE[n]) u.push([cx + a * 8.6, 12 + b * 8.6]); }
    else if (rep.kind === 'tally') {
      const gs = Math.ceil(v / 5);
      for (let gi = 0; gi < gs; gi++) { const gx = gs === 1 ? 0 : (gi ? 17 : -17), c = Math.min(5, v - gi * 5); for (let m = 0; m < Math.min(c, 4); m++) u.push([gx - 10.5 + m * 7, -20]); if (c === 5) u.push([gx + 15, -11]); }
    } else if (rep.kind === 'fingers') {
      const hs = v > 5 ? 2 : 1;
      for (let h = 0; h < hs; h++) { const hx = hs === 1 ? 0 : (h ? 16 : -16), m = hs === 1 || h ? 1 : -1, c = Math.min(5, v - h * 5); for (let i = 0; i < Math.min(c, 4); i++) u.push([hx - 9 + i * 6, -20]); if (c === 5) u.push([hx + 18 * m, -1]); }
    }
    return u;
  }
  function gkRepDraw(rep, col, hi, t) {
    const u = gkUnits(rep), kd = rep.kind;
    for (let i = 0; i < Math.min(hi, u.length); i++) { const cur = i === hi - 1; ctx.fillStyle = cur ? 'rgba(255,200,40,.9)' : 'rgba(255,226,110,.7)'; circle(u[i][0], u[i][1], cur ? 11 + Math.sin(t * 12) * 2 : 8.5); }
    if (kd === 'frame' || kd === 'framex') {
      const c = kd === 'frame' ? 13 : 11;
      for (const oy of kd === 'frame' ? [0] : [-13, 13]) {
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-2.5 * c, oy - c, 5 * c, 2 * c);
        ctx.strokeStyle = 'rgba(91,63,115,.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let i = 1; i < 5; i++) { ctx.moveTo(-2.5 * c + i * c, oy - c); ctx.lineTo(-2.5 * c + i * c, oy + c); }
        ctx.moveTo(-2.5 * c, oy); ctx.lineTo(2.5 * c, oy); ctx.stroke();
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.strokeRect(-2.5 * c, oy - c, 5 * c, 2 * c);
      }
      for (const [x, y] of u) inkCircle(x, y, c * 0.36, col, 0.8);
    } else if (kd === 'dots') for (const [x, y] of u) inkCircle(x, y, 7, col, 1);
    else if (kd === 'sum') {
      text(`${rep.a}+${rep.b}`, 0, -17, 23, '#4a2a5e', 'center', 800);
      u.forEach(([x, y], i) => inkCircle(x, y, 3.4, i < rep.a ? '#ff4f7a' : '#3a8ff0', 0.7));
    } else if (kd === 'tally') {
      const gs = Math.ceil(rep.v / 5); ctx.lineCap = 'round';
      for (let gi = 0; gi < gs; gi++) {
        const gx = gs === 1 ? 0 : (gi ? 17 : -17), c = Math.min(5, rep.v - gi * 5), p = new Path2D();
        for (let m = 0; m < Math.min(c, 4); m++) { const x = gx - 10.5 + m * 7; p.moveTo(x + (m % 2 ? 1 : -1), -14); p.lineTo(x, 14); }
        if (c === 5) { p.moveTo(gx - 15, 9); p.lineTo(gx + 15, -9); }
        ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(p); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(p);
      }
    } else if (kd === 'fingers') {
      const hs = rep.v > 5 ? 2 : 1, skin = '#ffd2b0';
      for (let h = 0; h < hs; h++) {
        const hx = hs === 1 ? 0 : (h ? 16 : -16), m = hs === 1 || h ? 1 : -1, c = Math.min(5, rep.v - h * 5);
        for (let i = 0; i < 4; i++) { const up = i < c; inkRect(hx - 11.8 + i * 6, up ? -24 : -7, 5.6, up ? 26 : 9, skin, 1.3, 2.8); }
        ctx.save(); ctx.translate(hx + 10 * m, 7); ctx.rotate(m * 0.85); inkRect(-3, c === 5 ? -13 : -5, 6, c === 5 ? 15 : 7, skin, 1.3, 3); ctx.restore();
        inkRect(hx - 13, -3, 26, 21, skin, 1.4, 8);
        ctx.fillStyle = 'rgba(220,140,120,.35)'; ellipse(hx, 9, 7, 4);
      }
    }
    // counted ones get a bright ring on top
    for (let i = 0; i < Math.min(hi, u.length); i++) { const cur = i === hi - 1; ctx.strokeStyle = cur ? '#ff9a00' : '#ffc83a'; ctx.lineWidth = cur ? 3.5 : 2.5; ctx.beginPath(); ctx.arc(u[i][0], u[i][1], (kd === 'dots' ? 3 : 0) + (cur ? 9 + Math.sin(t * 12) * 1.5 : 7.5), 0, TAU); ctx.stroke(); }
  }
  // the key's round head: a scalloped ring, outlined first and filled after so the bumps read as one shape
  const GK_BOW = (() => { const p = new Path2D(); p.arc(0, 0, 45, 0, TAU); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + TAU / 16, x = Math.cos(a) * 46, y = Math.sin(a) * 46; p.moveTo(x + 9, y); p.arc(x, y, 9, 0, TAU); } return p; })();
  // a key with its head centred on (x, y); o.loop draws the ring loop on top, o.shaft (0..1) how much of the shaft shows
  function drawGKey(kk, x, y, rot, s, o = {}) {
    const pal = GK_KEYS[kk.pal], sh = o.shaft ?? 1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round';
    if (o.lift) { ctx.fillStyle = 'rgba(40,20,60,.18)'; ellipse(10, 70, 46, 12); }
    if (sh > 0) {
      const L = 54 * sh, e = 44 + L;
      if (sh > 0.6) { ink(P2(`M6,${e - 24} L20,${e - 24} L20,${e - 15} L14,${e - 15} L14,${e - 9} L20,${e - 9} L20,${e} L6,${e} Z`), pal.dark, 1.6); }
      inkRect(-7, 40, 14, L + 4, pal.dark, 2.4, 5);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-4, 46, 3, L - 4);
    }
    inkRect(-12, 40, 24, 9, pal.rim, 2, 3);
    if (o.loop) { ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, -57, 9, 0, TAU); ctx.stroke(); ctx.strokeStyle = pal.rim; ctx.lineWidth = 4.5; ctx.stroke(); inkRect(-5, -52, 10, 9, pal.rim, 1.6, 2); }
    ink(GK_BOW, pal.rim, 2.6);
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 42, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
    inkCircle(0, 0, 39, '#fffaf0', 2);
    gkRepDraw(kk.rep, pal.dot, o.hi || 0, o.t || 0);
    if (o.glint != null && o.glint < 1) {
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 55, 0, TAU); ctx.clip();
      const gx = -70 + o.glint * 140; ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.moveTo(gx - 8, -60); ctx.lineTo(gx + 6, -60); ctx.lineTo(gx + 26, 60); ctx.lineTo(gx + 12, 60); ctx.closePath(); ctx.fill(); ctx.restore();
      if (o.glint > 0.4 && o.glint < 0.7) star(30, -34, 9, '#ffffff', 4);
    }
    if (o.dim) { ctx.fillStyle = 'rgba(120,110,140,.55)'; circle(0, 0, 56); emoji('✖️', 0, 0, 30); }
    ctx.restore();
  }
  function gkDoorPath(inset = 0) {
    const { x, top, base, hw } = GKD, w = hw + inset, cy = top + hw;
    return P2(`M${x - w},${base} L${x - w},${cy} A${w},${w} 0 0 1 ${x + w},${cy} L${x + w},${base} Z`);
  }
  function gkGroundStatic() {
    const R = rng(71);
    const fg = ctx.createLinearGradient(0, 330, 0, H); fg.addColorStop(0, '#7ccb5e'); fg.addColorStop(1, '#4f9a46');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 346); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 344 + Math.sin(x * 0.04) * 3); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = 'rgba(160,230,120,.4)'; for (let i = 0; i < 46; i++) ellipse(R() * W, 360 + R() * 180, 16 + R() * 10, 3);
    for (let i = 0; i < 26; i++) tinyFlower(R() * W, 372 + R() * 160, 3.5, ['#ffffff', '#ffd23a', '#ff9ac8', '#c6a2ff'][i % 4]);
    for (let i = 0; i < 12; i++) { const x = R() * W, y = 380 + R() * 150; inkEllipse(x, y, 7 + R() * 5, 4 + R() * 2, 0, ['#c8c0d4', '#d8d0e0'][i % 2], 1.2); }
    for (const [x, y, s] of [[30, 470, 0.9], [940, 480, 0.85], [130, 530, 0.7], [840, 540, 0.7]]) fern(x, y, s);
    for (const [x, y, s, c] of [[70, 420, 1.6, '#ff5f6a'], [92, 428, 1.1, '#ffb03a'], [900, 416, 1.5, '#c06ae0'], [880, 426, 1, '#ff5f6a'], [40, 520, 1.3, '#ffb03a']]) tinyShroom(x, y, s, c);
  }
  function gkTreeStatic() {
    const { x, base, hw } = GKD, R = rng(19);
    const trunk = P2('M250,0 L710,0 C704,110 716,210 770,268 C820,318 880,336 958,350 L958,358 L2,358 L2,350 C80,336 140,318 190,268 C244,210 256,110 250,0 Z');
    ink(trunk, '#9a6a44', 3);
    ctx.save(); ctx.clip(trunk);
    const tg = ctx.createLinearGradient(190, 0, 770, 0); tg.addColorStop(0, 'rgba(255,220,170,.22)'); tg.addColorStop(0.45, 'rgba(255,220,170,0)'); tg.addColorStop(1, 'rgba(40,20,10,.22)');
    ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 360);
    // bark grain that splays out into the roots
    for (let i = -12; i <= 12; i++) {
      const x0 = 480 + i * 21;
      for (const [col, lw, off] of [['rgba(70,35,15,.3)', 2.6, 0], ['rgba(255,225,180,.13)', 2, 5]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        for (let y = 0; y <= 360; y += 8) { const k = (y / 356) ** 2.2, xx = x0 + off + (x0 - 480) * k * 1.9 + Math.sin(y * 0.035 + i * 1.7) * 4; if (y === 0) ctx.moveTo(xx, y); else ctx.lineTo(xx, y); }
        ctx.stroke();
      }
    }
    for (const [kx, ky, rx, ry] of [[296, 110, 9, 15], [664, 64, 8, 13], [700, 300, 11, 7], [228, 300, 10, 6], [560, 40, 6, 10]]) { inkEllipse(kx, ky, rx, ry, 0, '#7a4a2a', 1.6); ctx.strokeStyle = 'rgba(40,20,10,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(kx, ky, rx * 0.5, ry * 0.5, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    // two big roots curling down either side of the door
    for (const d of [-1, 1]) {
      const X = v => 480 + d * (v - 480);
      const root = P2(`M${X(150)},358 C${X(200)},300 ${X(300)},282 ${X(352)},236 C${X(372)},220 ${X(398)},232 ${X(392)},258 C${X(384)},302 ${X(310)},334 ${X(270)},358 Z`);
      ink(root, '#a8774c', 2.6);
      ctx.save(); ctx.clip(root); ctx.strokeStyle = 'rgba(70,35,15,.3)'; ctx.lineWidth = 2.4;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(X(372 - k * 4), 240 + k * 6); ctx.bezierCurveTo(X(340 - k * 10), 290 + k * 6, X(260 - k * 10), 310 + k * 8, X(180 + k * 30), 360); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#5ab84a'; ellipse(X(360), 238, 18, 6, d * 0.5); ellipse(X(250), 300, 22, 6, d * 0.4); ctx.fillStyle = '#7ad05a'; ellipse(X(356), 235, 9, 3, d * 0.5);
    }
    // moss along the top of the roots, and a few clinging mushrooms
    for (let i = 0; i < 18; i++) { const px = 20 + R() * 920, py = 338 + R() * 12; ctx.fillStyle = ['#5ab84a', '#6cc85a'][i % 2]; ellipse(px, py, 14 + R() * 10, 5); }
    for (const [mx, my, s, c] of [[214, 300, 1.3, '#ff5f6a'], [230, 304, 0.9, '#ffb03a'], [748, 300, 1.2, '#c06ae0'], [190, 338, 1, '#ff9a3a'], [790, 336, 1.4, '#ff5f6a'], [808, 340, 0.9, '#ffd23a']]) tinyShroom(mx, my, s, c);
    // the doorway: a dark hollow ringed with mossy stones
    ink(gkDoorPath(4), '#2a1828', 2);
    const stones = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI + i * Math.PI / 10; stones.push([x + Math.cos(a) * (hw + 11), GKD.top + hw + Math.sin(a) * (hw + 11), a + Math.PI / 2]); }
    for (let y = GKD.top + hw + 22; y < base - 4; y += 24) for (const d of [-1, 1]) stones.push([x + d * (hw + 11), y, 0]);
    stones.forEach(([sx, sy, a], i) => { ctx.save(); ctx.translate(sx, sy); ctx.rotate(a); inkRect(-11, -9, 22, 18, ['#cfc6d8', '#bdb4c8', '#dcd4e4'][i % 3], 2, 6); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-7, -6, 8, 3); ctx.restore(); });
    for (const [mx, my] of [[x - 80, GKD.top + 52], [x + 88, GKD.top + 120], [x - 90, base - 30]]) { ctx.fillStyle = '#5ab84a'; ellipse(mx, my, 10, 5); }
    // a stone doorstep with two stepping stones
    inkRect(x - 100, base - 2, 200, 14, '#c8c0d4', 2.4, 6); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 92, base + 1, 120, 3);
    inkEllipse(x - 30, base + 22, 26, 7, 0, '#d8d0e0', 1.6); inkEllipse(x + 34, base + 26, 22, 6, 0, '#cfc6d8', 1.6);
    // window frames, a flower box, the lantern bracket and the crooked chimney
    inkCircle(318, 176, 29, '#7a4a2a', 2.6); inkCircle(318, 176, 22, '#3a2030', 1.5);
    inkRect(286, 206, 64, 14, '#c0703a', 2, 3); for (let i = 0; i < 6; i++) tinyFlower(292 + i * 10.5, 203, 5, ['#ff6fae', '#ffd23a', '#c6a2ff', '#ffffff', '#ff9a3a', '#7ad0ff'][i]);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = '#4aa040'; ellipse(290 + i * 11, 207, 5, 3, i); }
    inkCircle(632, 150, 18, '#7a4a2a', 2.2); inkCircle(632, 150, 12, '#3a2030', 1.2);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(362, 214); ctx.lineTo(380, 214); ctx.lineTo(380, 224); ctx.stroke(); ctx.strokeStyle = '#5a4a5a'; ctx.lineWidth = 2.5; ctx.stroke();
    ink(P2('M732,262 C730,240 738,226 736,206 L752,204 C754,224 746,240 750,262 Z'), '#c86a4a', 2.2);
    inkRect(728, 194, 30, 12, '#a8504a', 2, 3);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(738, 212, 3, 40);
  }
  function gkIvy(x, y0, len, t, ph) {
    const sw = Math.sin(t * 1.3 + ph) * 7, cx = x + sw * 0.3, cy = y0 + len * 0.5, ex = x + sw, ey = y0 + len;
    ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.strokeStyle = OL; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 2.2; ctx.stroke();
    for (let k = 0.12, j = 0; k <= 1.001; k += 0.13, j++) {
      const px = (1 - k) * (1 - k) * x + 2 * k * (1 - k) * cx + k * k * ex, py = (1 - k) * (1 - k) * y0 + 2 * k * (1 - k) * cy + k * k * ey, d = j % 2 ? 1 : -1;
      inkEllipse(px + d * 7, py, 7, 4.5, d * 0.6 + Math.sin(t * 2 + j) * 0.12, j % 3 ? '#5ab84a' : '#7ad05a', 1.2);
    }
  }
  function gkAwning(col) {
    const x = GKD.x, y = 70;
    ctx.fillStyle = 'rgba(40,20,30,.25)'; ellipse(x, y + 52, 110, 8);
    const p = P2(`M${x - 124},${y + 40} C${x - 118},${y - 26} ${x + 118},${y - 26} ${x + 124},${y + 40} C${x + 70},${y + 54} ${x - 70},${y + 54} ${x - 124},${y + 40} Z`);
    ink(p, col, 3);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ellipse(x - 40, y + 4, 54, 12, -0.15);
    ctx.fillStyle = '#ffffff'; for (const [sx, sy, r] of [[-84, 26, 11], [-40, 8, 13], [6, 0, 10], [50, 12, 14], [92, 30, 9], [-8, 30, 7], [28, 34, 6]]) circle(x + sx, y + sy, r);
    ctx.fillStyle = mix(col, '#ffe8d8', 0.55); ctx.fillRect(x - 130, y + 40, 260, 20);
    ctx.strokeStyle = 'rgba(120,60,60,.35)'; ctx.lineWidth = 1.5; for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(x + i * 11, y + 41); ctx.lineTo(x + i * 11.5, y + 52); ctx.stroke(); }
    ctx.restore();
  }
  function gkLeaf(g, k) {
    // the door itself: painted planks, iron straps, the number plaque, a knocker and the keyhole
    const { x, top, base, hw } = GKD, door = gkDoorPath(0), col = k.door;
    ink(door, col, 3);
    ctx.save(); ctx.clip(door);
    ctx.strokeStyle = mix(col, '#2a1a30', 0.35); ctx.lineWidth = 3; for (const d of [-38, 0, 38]) { ctx.beginPath(); ctx.moveTo(x + d, top); ctx.lineTo(x + d, base); ctx.stroke(); }
    ctx.strokeStyle = mix(col, '#2a1a30', 0.18); ctx.lineWidth = 1.5;
    for (let p = 0; p < 4; p++) for (let j = 0; j < 3; j++) { const px = x - 57 + p * 38 + j * 9 - 9; ctx.beginPath(); ctx.moveTo(px, top + 10); for (let y = top + 10; y <= base; y += 12) ctx.lineTo(px + Math.sin(y * 0.06 + p * 2 + j) * 2.5, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x - hw, top, 18, base - top);
    ctx.fillStyle = 'rgba(40,20,40,.18)'; ctx.fillRect(x + hw - 14, top, 14, base - top);
    for (const sy of [212, 304]) { inkRect(x - hw - 4, sy, hw * 2 + 8, 10, '#5a4a5e', 1.6, 2); ctx.fillStyle = '#c8c0d4'; for (let i = 0; i < 6; i++) circle(x - hw + 8 + i * 27, sy + 5, 2); }
    ctx.restore();
    ink(P2(`M${x - hw - 4},206 L${x - hw + 30},210 L${x - hw - 4},228 Z`), '#5a4a5e', 1.6);
    // the plaque with the door's number
    const sw = Math.sin(k.t * 2) * 0.03;
    ctx.save(); ctx.translate(x, 132); ctx.rotate(sw);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, 8); ctx.lineTo(0, -6); ctx.lineTo(30, 8); ctx.stroke(); inkCircle(0, -6, 3, '#ffd84a', 1);
    inkRect(-48, 8, 96, 66, '#fff6dc', 3, 16);
    ctx.strokeStyle = 'rgba(200,150,90,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-42, 14, 84, 54, 12); ctx.stroke();
    outlined(String(k.n), 0, 42, k.n >= 10 ? 50 : 56, '#e8403a');
    ctx.restore();
    // knocker: a brass ring that swings when knocked
    const ka = Math.sin(k.t * 20) * (k.knock > 0 ? k.knock : 0) * 1.2;
    inkCircle(x, 222, 5, '#e8b830', 1.4);
    ctx.save(); ctx.translate(x, 222); ctx.rotate(ka); ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 12, 10, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore();
    // the keyhole plate; it glows while a key is being dragged near it
    if (k.near) { const gl = ctx.createRadialGradient(x, GKD.ky, 4, x, GKD.ky, 60); gl.addColorStop(0, `rgba(255,240,140,${0.5 + 0.3 * Math.sin(k.t * 10)})`); gl.addColorStop(1, 'rgba(255,240,140,0)'); ctx.fillStyle = gl; circle(x, GKD.ky, 60); }
    inkEllipse(x, GKD.ky, 19, 31, 0, '#e8b830', 2); ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(x - 7, GKD.ky - 14, 4, 9);
    ctx.fillStyle = '#1a0e1a'; circle(x, GKD.ky - 6, 6.5); tri(x - 5, GKD.ky - 4, x + 5, GKD.ky - 4, x, GKD.ky + 16);
    ctx.fillStyle = '#c8c0d4'; for (const dy of [-24, 24]) circle(x, GKD.ky + dy, 2);
    // the sliding bolt on the latch side
    const bolt = k.st === 'unlock' ? 1 - gkEase(clamp(k.st_t / 0.4, 0, 1)) : ['open', 'reveal', 'cheer'].includes(k.st) ? 0 : 1;
    inkRect(x + hw - 30, 254, 26, 12, '#5a4a5e', 1.6, 3); inkRect(x + hw - 22 + bolt * 16, 257, 18, 6, '#c8c0d4', 1.2, 2);
  }
  // inside each door, something to count
  function gkItemPos(n, i) {
    const rows = Math.ceil(n / 5), r = Math.floor(i / 5), c = i % 5, inRow = Math.min(5, n - r * 5);
    return [GKD.x + (c - (inRow - 1) / 2) * 28, 216 - (rows - 1) * 17 + r * 34];
  }
  function gkItem(id, x, y, s, t, i) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (id === 'tea') {
      inkCircle(0, -9, 5.5, '#2a1a2a', 1.2); inkEllipse(0, 1, 11, 10, 0, '#ff3a3a', 1.4);
      ctx.strokeStyle = '#2a1a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 11); ctx.stroke();
      ctx.fillStyle = '#2a1a2a'; for (const [dx, dy] of [[-5, -1], [5, -1], [-5, 6], [5, 6]]) circle(dx, dy, 2);
      ctx.fillStyle = '#fff'; circle(-2.4, -11, 1.4); circle(2.4, -11, 1.4);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-5, -3, 3, 2, -0.5);
    } else if (id === 'glow') {
      const col = ['#7af0ff', '#ff8af0', '#b6ff6a', '#ffd86a'][i % 4], f = 0.7 + 0.3 * Math.sin(t * 3 + i);
      const gl = ctx.createRadialGradient(0, -4, 1, 0, -4, 22); gl.addColorStop(0, mix(col, '#ffffff', 0.3) + 'cc'); gl.addColorStop(1, col + '00');
      ctx.globalAlpha = f; ctx.fillStyle = gl; circle(0, -4, 22); ctx.globalAlpha = 1;
      inkRect(-3, -4, 6, 13, '#f4f0ff', 1.2, 2);
      ink(P2('M-11,-3 C-11,-15 11,-15 11,-3 C5,-1 -5,-1 -11,-3 Z'), col, 1.4);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(-4, -8, 1.8); circle(4, -7, 1.3);
    } else if (id === 'hog') {
      ink(P2('M-1,-9 L1,-14'), '#5a3a20', 1.4);
      inkEllipse(0, 3, 7.5, 9, 0, '#d89a50', 1.4); ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-3, 2, 2, 4);
      inkEllipse(0, -5, 9.5, 5.5, 0, '#8a5a30', 1.4); ctx.strokeStyle = 'rgba(40,20,10,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(6, -5); ctx.stroke();
    } else if (id === 'dinner') {
      ink(P2(`M-8,-6 L${1 + Math.sin(t * 2 + i) * 2},-24 L8,-6 Z`), ['#ff3f3f', '#4a7ae0', '#3fbf6a', '#ffb03a'][i % 4], 1.3);
      inkCircle(0, -1, 7, '#ffd0b0', 1.2);
      ink(P2('M-7,1 C-6,12 6,12 7,1 C3,4 -3,4 -7,1 Z'), '#ffffff', 1.1);
      ctx.fillStyle = '#ff8a8a'; circle(0, 1, 2.4); ctx.fillStyle = '#2a1a2a'; circle(-3, -3, 1.2); circle(3, -3, 1.2);
    } else {
      const f = 0.55 + 0.45 * Math.sin(t * 4 + i * 1.9);
      const gl = ctx.createRadialGradient(0, 2, 1, 0, 2, 18); gl.addColorStop(0, `rgba(255,250,140,${0.9 * f})`); gl.addColorStop(1, 'rgba(255,250,140,0)');
      ctx.fillStyle = gl; circle(0, 2, 18);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(-5, -4, 5, 3, -0.5 + Math.sin(t * 30 + i) * 0.3); ellipse(5, -4, 5, 3, 0.5 - Math.sin(t * 30 + i) * 0.3);
      inkEllipse(0, 0, 3.5, 6, 0, '#5a4a3a', 1); ctx.fillStyle = mix('#c8c060', '#fffaa0', f); circle(0, 4, 3.6);
    }
    ctx.restore();
  }
  function gkRoom(k) {
    const { x, top, base } = GKD, t = k.t, id = k.room.id;
    ctx.save(); ctx.clip(gkDoorPath(0));
    const dark = id === 'glow' || id === 'fly';
    const bg = ctx.createLinearGradient(0, top, 0, base);
    bg.addColorStop(0, { tea: '#ffeab8', glow: '#2c2a5e', hog: '#ffd9a8', dinner: '#ffe2c4', fly: '#24305e' }[id]); bg.addColorStop(1, { tea: '#ffd090', glow: '#1a1838', hog: '#f0b878', dinner: '#ffc898', fly: '#141c3a' }[id]);
    ctx.fillStyle = bg; ctx.fillRect(x - 90, top - 10, 180, base - top + 20);
    if (id === 'tea') { ctx.fillStyle = 'rgba(255,130,170,.25)'; for (let i = -4; i <= 4; i++) ctx.fillRect(x + i * 20 - 4, top, 8, base - top); }
    if (id === 'dinner') { ctx.fillStyle = 'rgba(200,100,80,.15)'; for (let i = 0; i < 9; i++) for (let j = 0; j < 12; j++) if ((i + j) % 2) ctx.fillRect(x - 90 + i * 20, top + j * 20, 20, 20); }
    if (dark) { ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 14; i++) circle(x - 70 + (i * 37) % 140, top + 20 + (i * 53) % 190 + Math.sin(t + i) * 4, 1.2); }
    if (id === 'fly') { inkCircle(x + 46, top + 54, 14, '#6a80c0', 1.5); ctx.fillStyle = '#fff6c0'; circle(x + 50, top + 52, 7); ctx.fillStyle = '#6a80c0'; circle(x + 46, top + 50, 6); }
    // floor
    ctx.fillStyle = dark ? '#3a3466' : '#c88a50'; ctx.fillRect(x - 90, base - 26, 180, 30);
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1.5; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 22, base - 26); ctx.lineTo(x + i * 30, base); ctx.stroke(); }
    // the furniture for each room
    if (id === 'tea') {
      inkRect(x - 6, base - 34, 12, 20, '#c88a50', 1.5, 2);
      inkEllipse(x, base - 36, 62, 9, 0, '#ffffff', 1.8); ctx.fillStyle = '#ff9ac8'; for (let i = -5; i <= 5; i++) circle(x + i * 11, base - 30, 3);
      inkCircle(x + 34, base - 46, 7, '#7ad0ff', 1.3); inkRect(x + 40, base - 48, 7, 3, '#7ad0ff', 1, 1); inkRect(x + 31, base - 56, 6, 4, '#7ad0ff', 1, 1);
      inkRect(x - 42, base - 46, 9, 8, '#ffffff', 1.2, 2); inkRect(x - 22, base - 46, 9, 8, '#ffffff', 1.2, 2);
    } else if (id === 'hog') {
      for (const r of [0, 1, 2]) if (r < Math.ceil(k.n / 5)) inkRect(x - 74, gkItemPos(k.n, r * 5)[1] + 9, 148, 6, '#a0683a', 1.4, 2);
      inkRect(x - 62, base - 30, 124, 18, '#8a5a3a', 1.8, 4); inkRect(x - 58, base - 40, 116, 14, '#7ab8f0', 1.6, 6);
      inkEllipse(x - 44, base - 40, 14, 7, 0, '#ffffff', 1.4);
      ctx.save(); ctx.translate(x - 8, base - 44);
      ink(P2('M-26,4 C-28,-14 -10,-22 6,-18 C14,-16 22,-8 22,4 Z'), '#8a6040', 1.6);
      ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 1.5; for (let i = 0; i < 7; i++) { const a = Math.PI + 0.3 + i * 0.36; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 19); ctx.stroke(); }
      inkEllipse(24, 0, 8, 6, 0.2, '#e8c8a0', 1.3); ctx.fillStyle = '#2a1a1a'; circle(31, -1, 2); ctx.strokeStyle = '#2a1a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(22, -2, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 3; i++) { const z = (t * 0.5 + i / 3) % 1; ctx.globalAlpha = 1 - z; text('z', x + 30 + z * 18, base - 56 - z * 40, 10 + z * 8, '#5a6ab0', 'center', 800); } ctx.globalAlpha = 1;
    } else if (id === 'dinner') {
      inkRect(x - 66, base - 40, 132, 10, '#a0683a', 1.8, 3); inkRect(x - 58, base - 30, 6, 16, '#8a5a3a', 1.2, 1); inkRect(x + 52, base - 30, 6, 16, '#8a5a3a', 1.2, 1);
      inkEllipse(x, base - 44, 16, 6, 0, '#ffffff', 1.4); ctx.fillStyle = '#ff8a3a'; ellipse(x, base - 46, 11, 3);
      for (let i = 0; i < 3; i++) { const z = (t * 0.6 + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - z)})`; circle(x - 4 + i * 4 + Math.sin(t * 2 + i) * 3, base - 52 - z * 20, 2 + z * 3); }
      inkCircle(x - 40, base - 44, 5, '#ff4a5a', 1.1); inkCircle(x + 40, base - 44, 5, '#7a4ad0', 1.1);
    } else if (id === 'glow') {
      for (const [mx, s, c] of [[-56, 1.4, '#7af0ff'], [58, 1.2, '#ff8af0'], [-30, 0.9, '#b6ff6a']]) tinyShroom(x + mx, base - 24, s, c);
    } else {
      inkRect(x - 52, base - 40, 30, 16, '#8a6a5a', 1.4, 3); inkRect(x + 22, base - 40, 30, 16, '#8a6a5a', 1.4, 3);
    }
    // the things to count pop in one by one
    for (let i = 0; i < k.shown; i++) {
      const [ix, iy] = gkItemPos(k.n, i), age = k.t - (k.appear[i] ?? k.t), pop = age < 0.3 ? easeOut(age / 0.3) * (1 + 0.3 * Math.sin(age / 0.3 * Math.PI)) : 1;
      gkItem(id, ix, iy + Math.sin(t * 3 + i) * 1.5, pop * (k.n > 10 ? 0.95 : 1.1), t, i);
    }
    // warm light spilling out
    ctx.fillStyle = dark ? 'rgba(140,120,255,.08)' : 'rgba(255,230,140,.12)'; ctx.fillRect(x - 90, top, 180, base - top);
    ctx.restore();
  }
  // a peek inside the lock: the pins pop up to the line one at a time as the key turns
  function gkTumbler(k) {
    const { tx: x, ty: y } = GKD;
    ctx.fillStyle = 'rgba(40,20,60,.2)'; circle(x + 3, y + 5, 50);
    inkCircle(x, y, 48, '#e8b830', 3); inkCircle(x, y, 39, '#3a2a40', 2);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, 39, 0, TAU); ctx.clip();
    ctx.fillStyle = '#b8bccc'; ctx.fillRect(x - 40, y - 40, 80, 40); ctx.fillStyle = '#ffcf4a'; ctx.fillRect(x - 40, y, 80, 40);
    for (let i = 0; i < 4; i++) {
      const px = x - 21 + i * 14, set = i < k.pins, off = set ? 0 : [8, -6, 10, -4][i];
      const pop = set && k.pinT[i] != null ? Math.max(0, 1 - (k.t - k.pinT[i]) / 0.3) : 0;
      ctx.fillStyle = '#2a1a30'; ctx.fillRect(px - 5, y - 36, 10, 66);
      ctx.strokeStyle = '#e0e0ea'; ctx.lineWidth = 1.5; ctx.beginPath(); const s0 = y - 36, s1 = y - 20 + off - pop * 4; for (let j = 0; j <= 6; j++) ctx.lineTo(px + (j % 2 ? 3 : -3), s0 + (s1 - s0) * j / 6); ctx.stroke();
      inkRect(px - 4, y - 20 + off - pop * 4, 8, 20, '#eef0f8', 1, 2);
      inkRect(px - 4, y + off - pop * 4, 8, 22 - off, '#ff9a5a', 1, 2);
      if (set) { ctx.fillStyle = `rgba(120,255,140,${0.5 + pop * 0.5})`; circle(px, y, 3); }
    }
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  function gkBubble(x, y, str, size = 30) {
    ctx.font = `800 ${size}px ${FONT}`;
    const w = Math.max(64, ctx.measureText(str).width + 30), h = size + 24;
    ctx.save(); ctx.shadowColor = 'rgba(40,20,60,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    rrect(x - w / 2, y - h / 2, w, h, 18, '#ffffff'); ctx.restore();
    rrect(x - w / 2, y - h / 2, w, h, 18, null, OL, 2.5);
    ink(P2(`M${x + 4},${y + h / 2 - 1} L${x + 24},${y + h / 2 + 16} L${x + 22},${y + h / 2 - 1} Z`), '#ffffff', 1.2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 6, y + h / 2 - 4, 15, 4);
    text(str, x, y + 1, size, '#5a2a6e', 'center', 800);
  }
  MG.gnomekeys = {
    kind: 'learn', title: () => 'Gnome Door Keys', icon: () => '🗝️',
    how: g => (g.tier === 1
      ? "Each gnome door has a number on it. Find the key with that many dots, drag it to the keyhole, and twist it round to open the door!"
      : g.tier === 2
        ? "Each gnome door has a number. The keys show numbers with ten-frames, fingers and tally marks. Drag the right key to the keyhole and twist it round!"
        : "Each gnome door has a number. Some keys show sums, like 2 + 3, or a full ten-frame and some more. Find the key that makes the door's number!"),
    init(g) {
      g.gk = { t: 0, round: 0, rounds: 6, total: 0, used: [], roomOff: randInt(0, 4), doorOff: randInt(0, 5), lpx: pointer.x, lpy: pointer.y, jt: 0, mood: 'idle', mood_t: 0, knock: 0, bump: 0, near: false, appear: [], pinT: [] };
      this.gkRound(g);
      Object.assign(g.gk, { st: 'pick', slide: 0 });
      g.progress = `Door 1 of ${g.gk.rounds}`;
    },
    start(g) { speak(g.say); },
    gkRound(g) {
      const k = g.gk, [lo, hi] = [[1, 5], [1, 10], [4, 15]][g.tier - 1];
      let n; do n = randInt(lo, hi); while (k.used.includes(n) && k.used.length < hi - lo + 1);
      k.used.push(n);
      const vals = new Set([n]), top = [6, 10, 15][g.tier - 1];
      for (const c of shuffle([n - 1, n + 1, n - 2, n + 2, n + 3, n - 3, n + 4, n - 4])) { if (vals.size >= 4) break; if (c >= 1 && c <= top) vals.add(c); }
      k.keys = shuffle([...vals]).map((v, i) => ({ v, rep: gkRep(v, g.tier), a: rand(-0.5, 0.5), va: rand(-2, 2), tried: false, pal: i }));
      Object.assign(k, { n, tries: 0, st: 'arrive', st_t: 0, slide: 1, room: GK_ROOMS[(k.roomOff + k.round) % GK_ROOMS.length], door: GK_DOORS[(k.round + k.doorOff) % GK_DOORS.length], cap: GK_CAPS[k.round % GK_CAPS.length], open: 0, turn: 0, goal: 0, pins: 0, pinT: [], act: -1, drag: null, hi: 0, shown: 0, appear: [], lang: null, hinted: false });
      const w = NUM_WORDS[n];
      g.say = g.tier === 1 ? `This door says ${w}. Find the key with ${w} dots, and drag it to the keyhole!`
        : g.tier === 2 ? 'What number is on the door? Find the key that shows that many, and drag it to the keyhole!'
          : 'What number is on the door? Find the key that makes that number!';
      if (k.round > 0) { speak(g.say); gkJingle(4); }
    },
    keyX(g, i) { return GKD.x - 1.5 * 172 + i * 172; },
    // where a hanging key's head is right now (its loop pivots on the ring, and it swings)
    gkBow(g, i) {
      const k = g.gk, kk = k.keys[i], px = this.keyX(g, i), py = GKD.ringY + GKD.ringRy * Math.sqrt(Math.max(0, 1 - ((px - GKD.x) / GKD.ringRx) ** 2)) + k.slide * 220;
      return { x: px - Math.sin(kk.a) * 58, y: py + Math.cos(kk.a) * 58, rot: kk.a };
    },
    gkHit(g) {
      const k = g.gk;
      for (let i = 0; i < k.keys.length; i++) {
        if (k.keys[i].tried || i === k.act) continue;
        const b = this.gkBow(g, i);
        if (Math.hypot(pointer.x - b.x, pointer.y - b.y) < 58 || (Math.abs(pointer.x - b.x) < 22 && pointer.y > b.y && pointer.y < b.y + 104)) return i;
      }
      return -1;
    },
    gkSet(k, st) { k.st = st; k.st_t = 0; },
    gkMood(k, m) { k.mood = m; k.mood_t = 0; },
    gkLaunch(g, i, x, y, rot) {
      const k = g.gk, b = this.gkBow(g, i);
      k.act = i; k.f0 = { x: x ?? b.x, y: y ?? b.y, rot: rot ?? b.rot };
      Object.assign(k, { ax: k.f0.x, ay: k.f0.y, arot: k.f0.rot, as: 1, ash: 1 });
      this.gkSet(k, 'fly'); SFX.pick(); gkJingle(3);
      for (const kk of k.keys) kk.va += rand(-2.5, 2.5);
    },
    update(g, dt, id) {
      const k = g.gk; k.t += dt; k.st_t += dt; k.mood_t += dt; k.jt -= dt; k.knock = Math.max(0, k.knock - dt); k.bump = Math.max(0, k.bump - dt);
      const mvx = pointer.x - k.lpx; k.lpx = pointer.x; k.lpy = pointer.y;
      for (const kk of k.keys) { kk.va += (-kk.a * 26 - kk.va * 2.2) * dt; kk.a = clamp(kk.a + kk.va * dt, -1.1, 1.1); }
      const kx = GKD.kx, ky = GKD.ky, key = k.keys[k.act];
      k.near = false;
      if (k.st === 'arrive') {
        k.slide = 1 - easeOut(clamp(k.st_t / 0.8, 0, 1));
        if (k.st_t >= 0.8) { k.slide = 0; this.gkSet(k, 'pick'); }
      } else if (k.st === 'pick') {
        const hv = this.gkHit(g);
        if (hv >= 0 && !k.drag && Math.abs(mvx) > 1) { k.keys[hv].va += clamp(mvx * 0.03, -1.2, 1.2); if (k.jt <= 0) { gkJingle(1); k.jt = 0.2; } }
        if (pointer.clicked && !k.drag && Math.hypot(pointer.x - kx, pointer.y - 234) < 22) { gkKnock(); k.knock = 0.6; speak(g.say); this.gkMood(k, 'happy'); }
        else if (pointer.clicked && !k.drag && hv >= 0) {
          const b = this.gkBow(g, hv);
          k.drag = { i: hv, ox: pointer.x - b.x, oy: pointer.y - b.y, sx: pointer.x, sy: pointer.y, x: b.x, y: b.y, rot: b.rot, moved: false };
          k.act = hv; gkJingle(2); for (const kk of k.keys) kk.va += rand(-1.5, 1.5);
        }
        if (k.drag) {
          const d = k.drag;
          if (Math.hypot(pointer.x - d.sx, pointer.y - d.sy) > 14) d.moved = true;
          d.x = pointer.x - d.ox; d.y = pointer.y - d.oy; d.rot = lerp(d.rot, clamp(-mvx * 0.04, -0.6, 0.6), 0.2);
          k.near = d.moved && Math.hypot(d.x - kx, d.y - ky) < 110;
          if (!pointer.down) {
            k.drag = null;
            if (!d.moved || Math.hypot(d.x - kx, d.y - ky) < 110) this.gkLaunch(g, d.i, d.moved ? d.x : null, d.moved ? d.y : null, d.moved ? d.rot : null);
            else { k.act = -1; k.keys[d.i].va += 4; gkJingle(2); }
          }
        } else { const i = numKey(k.keys.length); if (i >= 0 && !k.keys[i].tried) this.gkLaunch(g, i); }
      } else if (k.st === 'fly') {
        const e = easeOut(clamp(k.st_t / 0.45, 0, 1));
        k.ax = lerp(k.f0.x, kx, e); k.ay = lerp(k.f0.y, ky, e) - Math.sin(e * Math.PI) * 40;
        k.as = lerp(1, 0.75, e); k.ash = 1 - clamp((k.st_t - 0.25) / 0.2, 0, 1); k.arot = lerp(k.f0.rot, 0, e);
        if (k.st_t >= 0.5) {
          k.tries++; key.tried = true;
          const w = NUM_WORDS[k.n];
          if (key.v === k.n) {
            k.total += [1, 0.2, 0, 0][k.tries - 1] ?? 0;
            this.gkSet(k, 'turn'); this.gkMood(k, 'happy'); SFX.sparkle(); burst(kx, ky, 18, { colors: ['#fff6a8', '#ffd84a', '#ffffff'] });
            const how = key.rep.kind === 'sum' ? `${cap(NUM_WORDS[key.rep.a])} and ${NUM_WORDS[key.rep.b]} make ${w}! ` : key.rep.kind === 'framex' ? `Ten and ${NUM_WORDS[k.n - 10]} make ${w}! ` : `${cap(w)}! `;
            speak(`Yes! ${how}Now twist the key round and round!`);
          } else {
            this.gkSet(k, 'jam'); this.gkMood(k, 'oops'); gkClunk(); floatText(kx + 60, ky - 40, 'Clunk!', '#ffd0a0', false, 26);
            const r = key.rep, list = r.kind === 'framex' ? `ten, ${gkWords(11, r.v)}` : gkWords(1, r.v);
            const needs = g.tier === 1 || k.tries > 1 ? `But the door says ${w}.` : 'The door needs a different number.';
            speak(`Clunk! That key won't turn. Let's count the ${gkUnitName(r)}: ${list}. ${cap(NUM_WORDS[r.v])}! ${needs}`);
          }
        }
      } else if (k.st === 'jam') {
        k.arot = Math.sin(k.st_t * 30) * 0.3 * Math.max(0, 1 - k.st_t / 0.8);
        if (k.st_t > 1.7) { this.gkSet(k, 'count'); this.gkMood(k, 'count'); k.hi = 0; }
      } else if (k.st === 'count') {
        // a full ten-frame is counted as "ten" in one go, then Gnorbert counts on
        const r = key.rep, steps = r.kind === 'framex' ? r.v - 9 : r.v, iv = 0.5, s = Math.min(steps, Math.floor(k.st_t / iv) + 1), hi = r.kind === 'framex' ? s + 9 : s;
        if (hi !== k.hi) { k.hi = hi; chime(hi - 1); k.bump = 0.25; }
        if (k.st_t > steps * iv + 1) { this.gkSet(k, 'back'); k.hi = 0; }
      } else if (k.st === 'back') {
        const b = this.gkBow(g, k.act), e = easeOut(clamp(k.st_t / 0.45, 0, 1));
        k.ax = lerp(kx, b.x, e); k.ay = lerp(ky, b.y, e) - Math.sin(e * Math.PI) * 50; k.as = lerp(1.15, 1, e); k.ash = clamp((k.st_t - 0.05) / 0.25, 0, 1); k.arot = lerp(0, b.rot, e);
        if (k.st_t >= 0.45) { k.keys[k.act].va += 3; k.act = -1; gkJingle(3); this.gkSet(k, 'pick'); this.gkMood(k, 'idle'); }
      } else if (k.st === 'turn') {
        // drag round and round the keyhole (or tap the key / press space) to turn it; a pin clicks up every quarter turn
        const q = TAU / 4, dx = pointer.x - kx, dy = pointer.y - ky, dist = Math.hypot(dx, dy);
        if (pointer.down && dist > 14 && dist < 220) {
          const ang = Math.atan2(dy, dx);
          if (k.lang != null) { let d = ang - k.lang; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; if (Math.abs(d) < 0.9) { k.turn = Math.min(TAU, k.turn + Math.abs(d)); k.goal = Math.max(k.goal, k.turn); } }
          k.lang = ang;
        } else k.lang = null;
        if ((pointer.clicked && dist < 80) || pressed.arrowright || pressed.arrowleft || pressed[' '] || pressed.enter) k.goal = Math.min(TAU, (Math.floor(k.goal / q + 1e-6) + 1) * q);
        if (k.turn < k.goal) k.turn = Math.min(k.goal, k.turn + dt * 7);
        k.arot = k.turn;
        while (k.pins < 4 && k.turn >= (k.pins + 1) * q - 0.02) { k.pinT[k.pins] = k.t; k.pins++; gkTick(); burst(GKD.tx, GKD.ty, 6, { colors: ['#fff6a8', '#9affb0'], spread: 60, up: 40 }); }
        if (!k.hinted && k.st_t > 7 && k.pins === 0) { k.hinted = true; speak('Tap the key, or drag your finger round and round it!'); }
        if (k.pins >= 4) { this.gkSet(k, 'unlock'); tone(220, 0.08, 'square', 0.06); tone(520, 0.2, 'triangle', 0.09, 0.07); }
      } else if (k.st === 'unlock') {
        if (k.st_t > 0.55) { this.gkSet(k, 'open'); gkCreak(); }
      } else if (k.st === 'open') {
        k.open = gkEase(clamp(k.st_t / 1.0, 0, 1));
        if (k.st_t >= 1.0) {
          this.gkSet(k, 'reveal'); this.gkMood(k, 'count'); k.open = 1;
          const r = k.room, w = NUM_WORDS[k.n];
          speak(`${cap(gkWords(1, k.n))}. ${cap(w)} ${k.n === 1 ? r.one : r.many}${r.tail}!`);
        }
      } else if (k.st === 'reveal') {
        const iv = k.n <= 10 ? 0.5 : 0.42, s = k.st_t < 0.2 ? 0 : Math.min(k.n, Math.floor((k.st_t - 0.2) / iv) + 1);
        while (k.shown < s) { const [ix, iy] = gkItemPos(k.n, k.shown); k.appear[k.shown] = k.t; k.shown++; chime(k.shown - 1); floatText(ix, iy - 22, String(k.shown), '#fff6a8', false, 20); k.bump = 0.25; }
        if (k.st_t > 0.2 + k.n * iv + 0.6) { this.gkSet(k, 'cheer'); this.gkMood(k, 'cheer'); SFX.sparkle(); burst(GKD.x, 200, 30); burst(GKD.gx, GKD.gy - 120, 14, { kind: 'heart', colors: ['#ff6fb5', '#ff9ac8'] }); }
      } else if (k.st === 'cheer') {
        if (id === 'gknext' || pressed.enter || pressed[' '] || k.st_t > 3.6) {
          k.round++;
          if (k.round >= k.rounds) g.done = true; else this.gkRound(g);
        }
      }
      g.progress = `Door ${Math.min(k.round + 1, k.rounds)} of ${k.rounds}`;
      g.score = k.total / k.rounds;
    },
    draw(g) {
      const k = g.gk, t = k.t, { x, base } = GKD;
      const shake = k.st === 'jam' && k.st_t < 0.6 ? Math.sin(k.st_t * 46) * 5 * (1 - k.st_t / 0.6) : 0;
      still('gk_ground', gkGroundStatic);
      ctx.save(); ctx.translate(k.slide * 760, 0);
      still('gk_tree', gkTreeStatic);
      // a warm flickering window (someone moving about inside), an attic window, ivy, chimney smoke and a lantern
      const f = 0.8 + 0.1 * Math.sin(t * 5) + 0.08 * Math.sin(t * 13);
      for (const [wx, wy, r] of [[318, 176, 22], [632, 150, 12]]) {
        const gl = ctx.createRadialGradient(wx, wy, 2, wx, wy, r * 2.6); gl.addColorStop(0, `rgba(255,210,110,${0.45 * f})`); gl.addColorStop(1, 'rgba(255,210,110,0)'); ctx.fillStyle = gl; circle(wx, wy, r * 2.6);
        inkCircle(wx, wy, r, mix('#ffb04a', '#fff2a0', f - 0.55), 1.4);
        if (r > 15) { ctx.fillStyle = 'rgba(90,50,40,.5)'; const sx = wx + Math.sin(t * 0.7) * 8; ellipse(sx, wy + 10, 6, 9); circle(sx, wy - 2, 5); }
        ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = r > 15 ? 4 : 3; ctx.beginPath(); ctx.moveTo(wx - r, wy); ctx.lineTo(wx + r, wy); ctx.moveTo(wx, wy - r); ctx.lineTo(wx, wy + r); ctx.stroke();
      }
      for (const [ix, len, ph] of [[270, 130, 0], [292, 84, 2], [668, 150, 1], [690, 96, 3]]) gkIvy(ix, 0, len, t, ph);
      for (let i = 0; i < 4; i++) { const z = (t * 0.32 + i / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - z)})`; circle(744 + Math.sin(t * 1.2 + i * 2) * 6 + z * 18, 190 - z * 110, 6 + z * 12); }
      lantern(380, 226, t, 1, '#ffb03a');
      gkAwning(k.cap);
      ctx.translate(shake, 0);
      if (k.open > 0) gkRoom(k);
      // the door swings on its left hinge; the key in the lock swings with it
      ctx.save();
      const hinge = x - GKD.hw, sx = 1 - k.open * 0.86;
      ctx.translate(hinge, 0); ctx.scale(sx, 1); ctx.translate(-hinge, 0);
      gkLeaf(g, k);
      const inLock = k.act >= 0 && ['jam', 'count', 'turn', 'unlock', 'open', 'reveal', 'cheer'].includes(k.st);
      // a jammed key grows big so everyone can count it together
      const ls = k.st === 'count' ? 1.15 : k.st === 'jam' ? lerp(0.75, 1.15, gkEase(clamp((k.st_t - 0.9) / 0.5, 0, 1))) : 0.75;
      if (inLock) drawGKey(k.keys[k.act], GKD.kx, GKD.ky, k.arot, ls, { shaft: 0, hi: k.hi, t });
      if (k.open > 0) { ctx.fillStyle = `rgba(30,15,30,${0.4 * k.open})`; ctx.fill(gkDoorPath(0)); }
      ctx.restore();
      ctx.restore();
      // Gnorbert watches from the root and reacts
      const m = k.mood, mt = k.mood_t, gx = GKD.gx, gy = GKD.gy;
      let hop = 0, rot = 0;
      if (m === 'cheer') hop = Math.abs(Math.sin(mt * 9)) * 18;
      else if (m === 'happy') hop = mt < 0.5 ? Math.sin(mt / 0.5 * Math.PI) * 14 : 0;
      else if (m === 'oops') rot = Math.sin(mt * 16) * 0.12 * Math.max(0, 1 - mt / 1.2);
      else if (m === 'count') hop = k.bump > 0 ? Math.sin(k.bump / 0.25 * Math.PI) * 8 : 0;
      else rot = Math.sin(t * 1.5) * 0.04;
      // (once the game is over the results screen draws its own Gnorbert)
      if (!g.done) { ctx.save(); ctx.translate(gx, gy - hop); ctx.rotate(rot); drawCritter('Gnorbert the Gnome', 0, 0, 0.86, -1); ctx.restore(); }
      const bubble = m === 'cheer' ? 'Hooray!' : m === 'oops' && k.st === 'jam' ? 'Oops!' : (k.st === 'count' && k.hi) ? String(k.hi) : (k.st === 'reveal' && k.shown) ? String(k.shown) : k.st === 'turn' ? 'Twist!' : k.st === 'pick' && !k.drag ? '?' : '';
      if (bubble && !g.done) gkBubble(gx - 44, gy - 226, bubble, bubble.length > 2 ? 22 : 34);
      // the big jangly key ring: back of the ring, the keys hanging on it, then the front of the ring
      const ry = GKD.ringY + k.slide * 220;
      const ringArc = (a0, a1) => { ctx.beginPath(); ctx.ellipse(x, ry, GKD.ringRx, GKD.ringRy, 0, a0, a1); ctx.strokeStyle = OL; ctx.lineWidth = 10; ctx.stroke(); ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 5.5; ctx.stroke(); ctx.strokeStyle = 'rgba(255,248,180,.8)'; ctx.lineWidth = 1.6; ctx.stroke(); };
      ringArc(Math.PI, TAU);
      const hv = k.st === 'pick' && !k.drag ? this.gkHit(g) : -1;
      k.keys.forEach((kk, i) => {
        if (i === k.act) return;
        const b = this.gkBow(g, i), gl = (t * 0.45 + i * 0.29) % 2.4;
        drawGKey(kk, b.x, b.y, b.rot, i === hv ? 1.06 : 1, { loop: true, glint: kk.tried ? null : gl, dim: kk.tried, t });
        if (!kk.tried) text(String(i + 1), b.x + 44, b.y + 50, 15, 'rgba(255,255,255,.85)', 'center', 800);
      });
      ringArc(0, Math.PI);
      star(x - 250 + Math.sin(t * 0.8) * 30, ry + 14, 6 + Math.sin(t * 5) * 2, '#ffffff', 4);
      // first door: show where keys go
      if (k.round === 0 && k.tries === 0 && k.st === 'pick' && !k.drag) {
        const p = (t * 0.7) % 1;
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4; ctx.setLineDash([10, 9]); ctx.lineDashOffset = -t * 30;
        ctx.beginPath(); ctx.moveTo(x, 410); ctx.lineTo(x, 326); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        ctx.fillStyle = 'rgba(255,255,255,.9)'; tri(x - 12, 330, x + 12, 330, x, 314);
        ctx.globalAlpha = Math.sin(p * Math.PI); emoji('👆', x + 18, lerp(430, 320, p), 34); ctx.globalAlpha = 1;
      }
      // a key on the move: dragged, flying to the lock or springing back to the ring
      if (k.drag) drawGKey(k.keys[k.drag.i], k.drag.x, k.drag.y, k.drag.rot, 1.08, { lift: true, t });
      else if (k.st === 'fly' || k.st === 'back') drawGKey(k.keys[k.act], k.ax, k.ay, k.arot, k.as, { shaft: k.ash, t });
      // twisting: how far it has turned, an arrow circling the keyhole, and the lock pins
      if (k.st === 'turn' || k.st === 'unlock') {
        const kx = GKD.kx, ky = GKD.ky;
        ctx.strokeStyle = 'rgba(40,20,60,.35)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(kx, ky, 56, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(kx, ky, 56, -Math.PI / 2, -Math.PI / 2 + k.turn); ctx.stroke();
        for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + i * TAU / 4; inkCircle(kx + Math.cos(a) * 56, ky + Math.sin(a) * 56, 5, i < k.pins ? '#9affb0' : '#ffffff', 1.2); }
        if (k.st === 'turn') {
          const a = -Math.PI / 2 + k.turn + 0.5 + (t * 2.2) % 1.2;
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(kx, ky, 74, a - 0.9, a); ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.save(); ctx.translate(kx + Math.cos(a) * 74, ky + Math.sin(a) * 74); ctx.rotate(a + Math.PI / 2); tri(-9, -7, 9, 0, -9, 7); ctx.restore();
          if (k.turn < 0.3) emoji('👆', kx + Math.cos(a) * 84, ky + Math.sin(a) * 84 + 10, 30);
        }
        gkTumbler(k);
      }
      // a short reading line for grown-ups and early readers
      const tip = k.st === 'pick' ? (g.tier === 1 ? `Find the key with ${k.n} dot${k.n > 1 ? 's' : ''}!` : `Which key shows ${k.n}?`) : k.st === 'turn' ? 'Twist the key round!' : k.st === 'count' ? 'Count with Gnorbert!' : k.st === 'reveal' || k.st === 'cheer' ? `${k.n} ${k.n === 1 ? k.room.one : k.room.many}!` : '';
      if (tip) { ctx.font = `700 17px ${FONT}`; const tw = ctx.measureText(tip).width + 30; rrect(16, 66, tw, 34, 17, 'rgba(60,30,70,.75)'); text(tip, 16 + tw / 2, 83, 17, '#fff', 'center', 700); }
      if (k.st === 'cheer' && !g.done) button('gknext', W - 200, 64, 184, 48, 'Next door', { icon: '🚪', color: '#5fb87a', size: 20 });
    },
  };

  restage('gnomes', {
    bg: 'gnomes_bg',
    games: [['mushhop', 'berry'], ['gnomekeys', 'petal']],
    intro: ["*:Tiny doors are hidden in the tree roots. A gnome peeks out!", "N:Hello, big friend! My berries are stuck at the top of the mushroom tower.", "N:The mushrooms are springy — boing, boing! Can you bounce all the way up?", 'A:laughing:Boing! Here I go!'],
    mid: ['N:Hooray! Now, I have a jangly bunch of keys and I forget which one opens which door.', 'N:Each door has a number. Find the key with that many dots!', 'A:thinking:Let me count carefully...'],
    outro: ["N:A friend of gnomes is a friend of unicorns. Take these berries and petals!", "A:surprised:Wait — you know about unicorns?", "N:Gnomes know EVERYTHING. Shhh!"],
  });

  // =====================================================================================
  // 6. SUNNY SIDE FARM
  // =====================================================================================
  // farm animals standing on (x, y), facing right; babies are smaller with bigger heads
  function legs(xs, top, len, w, col, hoof) {
    for (const lx of xs) { inkRect(lx - w / 2, top, w, len, col, 1.8, w / 2.4); if (hoof) { ctx.fillStyle = hoof; ctx.beginPath(); ctx.roundRect(lx - w / 2, top + len - w * 0.7, w, w * 0.7, 2); ctx.fill(); } }
  }
  function eye(x, y, r) { ctx.fillStyle = '#2a1a2a'; circle(x, y, r); ctx.fillStyle = '#fff'; circle(x + r * 0.35, y - r * 0.35, r * 0.4); }
  const FARM = {
    cow(baby) {
      const L = baby ? 30 : 34, bw = baby ? 82 : 118, bh = baby ? 50 : 66, by = -L - bh / 2 + 6, hr = baby ? 26 : 25;
      legs([-bw * 0.32, bw * 0.22], -L - 8, L + 8, 13, '#e8e4ec', '#4a3a3a');
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-bw / 2 + 4, by - 10); ctx.quadraticCurveTo(-bw / 2 - 14, by + 10, -bw / 2 - 10, by + 30); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      inkEllipse(-bw / 2 - 10, by + 34, 5, 8, 0, '#4a3a3a', 1);
      const body = new Path2D(); body.ellipse(0, by, bw / 2, bh / 2, 0, 0, TAU);
      ink(body, '#ffffff', 2.2);
      ctx.save(); ctx.clip(body); ctx.fillStyle = '#3a2a3a'; for (const [sx, sy, r] of [[-0.25, -0.2, 0.2], [0.18, 0.1, 0.16], [-0.05, 0.35, 0.12], [0.38, -0.3, 0.1]]) ellipse(sx * bw, by + sy * bh, r * bw, r * bw * 0.7, sx); ctx.restore();
      if (!baby) inkEllipse(bw * 0.05, by + bh / 2 - 2, 12, 7, 0, '#ffb3c8', 1.4);
      legs([-bw * 0.22, bw * 0.32], -L - 8, L + 8, 13, '#ffffff', '#4a3a3a');
      const hx = bw / 2 + hr * 0.3, hy = by - bh * 0.35;
      for (const d of [-1, 1]) inkEllipse(hx + d * hr * 1.0, hy - hr * 0.55, hr * 0.42, hr * 0.2, d * 0.4, '#ffffff', 1.5);
      if (!baby) for (const d of [-1, 1]) ink(P2(`M${hx + d * hr * 0.45},${hy - hr * 0.8} C${hx + d * hr * 0.6},${hy - hr * 1.3} ${hx + d * hr * 0.85},${hy - hr * 1.3} ${hx + d * hr * 0.9},${hy - hr * 1.15} C${hx + d * hr * 0.75},${hy - hr * 1.05} ${hx + d * hr * 0.6},${hy - hr * 0.9} ${hx + d * hr * 0.6},${hy - hr * 0.7} Z`), '#f4e8c0', 1.2);
      inkEllipse(hx, hy, hr * 0.85, hr, 0, '#ffffff', 2);
      ctx.fillStyle = '#3a2a3a'; ellipse(hx - hr * 0.3, hy - hr * 0.55, hr * 0.32, hr * 0.26);
      inkEllipse(hx, hy + hr * 0.55, hr * 0.8, hr * 0.48, 0, '#ffb3c8', 1.6);
      ctx.fillStyle = '#c86a8a'; ellipse(hx - hr * 0.3, hy + hr * 0.55, 3, 4); ellipse(hx + hr * 0.3, hy + hr * 0.55, 3, 4);
      eye(hx - hr * 0.35, hy - hr * 0.1, 3.6); eye(hx + hr * 0.35, hy - hr * 0.1, 3.6);
    },
    sheep(baby) {
      const L = baby ? 24 : 28, bw = baby ? 66 : 100, bh = baby ? 44 : 60, by = -L - bh / 2 + 4, hr = baby ? 18 : 19;
      legs([-bw * 0.3, bw * 0.18], -L - 6, L + 6, 9, '#4a3a4a', '#2a1a2a');
      const puffs = [];
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; puffs.push([Math.cos(a) * bw * 0.42, by + Math.sin(a) * bh * 0.38, bh * 0.26]); }
      puffs.push([0, by, bh * 0.4]);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; for (const [px, py, r] of puffs) { ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; for (const [px, py, r] of puffs) circle(px, py, r);
      ctx.fillStyle = '#f0ecf4'; for (const [px, py, r] of puffs.slice(0, 7)) circle(px + 2, py + 3, r * 0.5);
      legs([-bw * 0.18, bw * 0.3], -L - 6, L + 6, 9, '#4a3a4a', '#2a1a2a');
      const hx = bw / 2 + 2, hy = by - bh * 0.2;
      for (const d of [-1, 1]) inkEllipse(hx + d * hr * 0.95, hy - hr * 0.25, hr * 0.5, hr * 0.22, d * 0.3, '#4a3a4a', 1.4);
      inkEllipse(hx, hy, hr * 0.8, hr, 0, '#4a3a4a', 2);
      for (let i = 0; i < 4; i++) inkCircle(hx - hr * 0.5 + i * hr * 0.33, hy - hr * 0.9, hr * 0.3, '#ffffff', 1);
      ctx.fillStyle = '#fff'; circle(hx - hr * 0.32, hy - hr * 0.1, 4); circle(hx + hr * 0.32, hy - hr * 0.1, 4);
      eye(hx - hr * 0.3, hy - hr * 0.08, 2.4); eye(hx + hr * 0.34, hy - hr * 0.08, 2.4);
      ctx.fillStyle = '#ff9ab0'; ellipse(hx, hy + hr * 0.55, 4, 3);
    },
    horse(baby) {
      const L = baby ? 46 : 46, bw = baby ? 70 : 110, bh = baby ? 40 : 56, by = -L - bh / 2 + 6, col = baby ? '#d8a070' : '#a8683a', dark = baby ? '#b07848' : '#5a3218';
      legs([-bw * 0.33, bw * 0.24], -L - 8, L + 8, baby ? 9 : 12, mix(col, '#000000', 0.12), '#3a2a2a');
      ctx.strokeStyle = OL; ctx.lineWidth = baby ? 10 : 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-bw / 2 + 6, by - 8); ctx.quadraticCurveTo(-bw / 2 - 24, by + 4, -bw / 2 - 16, by + (baby ? 18 : 40)); ctx.stroke();
      ctx.strokeStyle = dark; ctx.lineWidth = baby ? 6 : 10; ctx.stroke();
      inkEllipse(0, by, bw / 2, bh / 2, 0, col, 2.2);
      legs([-bw * 0.22, bw * 0.34], -L - 8, L + 8, baby ? 9 : 12, col, '#3a2a2a');
      // neck and long head
      const nx = bw * 0.38, ny = by - bh * 0.2, hx = nx + (baby ? 26 : 34), hy = ny - (baby ? 40 : 52);
      ink(P2(`M${nx - 14},${ny + 10} L${hx - 12},${hy - 2} L${hx + 10},${hy + 6} L${nx + 16},${ny + 14} Z`), col, 2);
      ctx.save(); ctx.translate(hx + 6, hy + 4); ctx.rotate(0.55);
      inkEllipse(0, 0, baby ? 14 : 15, baby ? 24 : 32, 0, col, 2);
      inkEllipse(0, baby ? 16 : 22, baby ? 12 : 13, baby ? 10 : 12, 0, mix(col, '#ffd8c0', 0.35), 1.6);
      ctx.fillStyle = '#3a2a2a'; circle(-4, baby ? 20 : 27, 2); circle(5, baby ? 20 : 27, 2);
      ctx.restore();
      inkEllipse(hx - 6, hy - (baby ? 18 : 24), 5, 10, -0.3, col, 1.4);
      eye(hx + 2, hy - 2, baby ? 3.6 : 3.2);
      // mane: long on mum, a fuzzy little crest on the foal
      ctx.fillStyle = dark; ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
      for (let i = 0; i < (baby ? 4 : 7); i++) { const k = i / (baby ? 4 : 7); const mx = lerp(hx - 10, nx - 12, k), my = lerp(hy - 8, ny + 6, k); ctx.beginPath(); ctx.ellipse(mx - 4, my, baby ? 5 : 8, baby ? 7 : 12, 0.6, 0, TAU); ctx.fill(); ctx.stroke(); }
    },
    pig(baby) {
      const L = baby ? 12 : 16, bw = baby ? 64 : 104, bh = baby ? 44 : 66, by = -L - bh / 2 + 6, hr = baby ? 22 : 26, col = baby ? '#ffc8d8' : '#ffa8c0';
      legs([-bw * 0.3, bw * 0.22], -L - 8, L + 8, 13, mix(col, '#c06080', 0.15), '#c06080');
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-bw / 2 - 6, by - 8, 6, 0, Math.PI * 1.6); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
      inkEllipse(0, by, bw / 2, bh / 2, 0, col, 2.2);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-bw * 0.1, by - bh * 0.22, bw * 0.25, bh * 0.12);
      legs([-bw * 0.2, bw * 0.3], -L - 8, L + 8, 13, col, '#c06080');
      const hx = bw / 2, hy = by - bh * 0.1;
      inkCircle(hx, hy, hr, col, 2);
      for (const d of [-1, 1]) ink(P2(`M${hx + d * hr * 0.3},${hy - hr * 0.8} L${hx + d * hr * 0.95},${hy - hr * 1.2} L${hx + d * hr * 0.9},${hy - hr * 0.4} Z`), mix(col, '#ff6f9a', 0.25), 1.4);
      inkEllipse(hx + hr * 0.15, hy + hr * 0.3, hr * 0.5, hr * 0.36, 0, '#ff8fb0', 1.6);
      ctx.fillStyle = '#c0507a'; ellipse(hx - hr * 0.05, hy + hr * 0.3, 2.6, 4); ellipse(hx + hr * 0.35, hy + hr * 0.3, 2.6, 4);
      eye(hx - hr * 0.35, hy - hr * 0.25, 3.2); eye(hx + hr * 0.45, hy - hr * 0.25, 3.2);
    },
    goat(baby) {
      const L = baby ? 30 : 34, bw = baby ? 60 : 92, bh = baby ? 36 : 50, by = -L - bh / 2 + 6, hr = baby ? 18 : 18, col = baby ? '#f4ece0' : '#e8dcc8';
      legs([-bw * 0.3, bw * 0.22], -L - 8, L + 8, 9, mix(col, '#7a6a5a', 0.15), '#5a4a3a');
      ink(P2(`M${-bw / 2 + 4},${by - 6} L${-bw / 2 - 8},${by - 22} L${-bw / 2 + 2},${by - 16} Z`), col, 1.4);
      inkEllipse(0, by, bw / 2, bh / 2, 0, col, 2.2);
      ctx.fillStyle = mix(col, '#a08060', 0.25); ellipse(-bw * 0.05, by - bh * 0.2, bw * 0.3, bh * 0.14);
      legs([-bw * 0.2, bw * 0.32], -L - 8, L + 8, 9, col, '#5a4a3a');
      const hx = bw / 2 + 4, hy = by - bh * 0.55;
      if (!baby) for (const d of [-1, 1]) { ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(hx + d * 5, hy - hr * 0.7); ctx.quadraticCurveTo(hx + d * 4 - 14, hy - hr * 1.9, hx - 22 + d * 3, hy - hr * 1.3); ctx.stroke(); ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 4; ctx.stroke(); }
      else for (const d of [-1, 1]) inkCircle(hx + d * 6, hy - hr * 0.85, 3.5, '#c8b898', 1);
      for (const d of [-1, 1]) inkEllipse(hx + d * hr * 0.95, hy - hr * 0.1, hr * 0.55, hr * 0.2, d * 0.7, col, 1.4);
      ink(P2(`M${hx - hr * 0.7},${hy - hr * 0.4} C${hx - hr * 0.7},${hy - hr * 1.1} ${hx + hr * 0.7},${hy - hr * 1.1} ${hx + hr * 0.7},${hy - hr * 0.4} L${hx + hr * 0.45},${hy + hr * 0.9} C${hx + hr * 0.2},${hy + hr * 1.2} ${hx - hr * 0.2},${hy + hr * 1.2} ${hx - hr * 0.45},${hy + hr * 0.9} Z`), col, 2);
      if (!baby) ink(P2(`M${hx - 6},${hy + hr * 1.0} L${hx + 6},${hy + hr * 1.0} L${hx},${hy + hr * 1.9} Z`), '#c8b898', 1.4);
      eye(hx - hr * 0.32, hy - hr * 0.25, 3); eye(hx + hr * 0.32, hy - hr * 0.25, 3);
      ctx.fillStyle = '#a07060'; ellipse(hx - 3, hy + hr * 0.75, 2, 2.5); ellipse(hx + 3, hy + hr * 0.75, 2, 2.5);
    },
    hen(baby) {
      if (baby) {
        legs([-6, 6], -10, 10, 3, '#ff9a2a');
        inkCircle(0, -26, 20, '#ffe14a', 2); inkCircle(14, -44, 13, '#ffe14a', 2);
        ctx.fillStyle = '#ffe14a'; circle(6, -36, 12);
        ink(P2('M-10,-30 C-6,-40 6,-38 4,-26 C-2,-22 -8,-24 -10,-30 Z'), '#ffd02a', 1.2);
        ink(P2('M25,-46 L34,-43 L25,-40 Z'), '#ff9a2a', 1.2); eye(18, -47, 2.6);
        return;
      }
      legs([-8, 8], -18, 18, 4, '#ff9a2a');
      ink(P2('M-34,-54 C-48,-80 -30,-92 -22,-74 C-24,-88 -6,-88 -12,-66 Z'), '#8a3a2a', 1.8);
      inkEllipse(-4, -40, 34, 26, 0, '#c8643a', 2.2);
      ink(P2('M-20,-44 C-10,-58 12,-52 10,-36 C0,-30 -14,-32 -20,-44 Z'), '#a84a2a', 1.6);
      inkCircle(24, -64, 16, '#c8643a', 2);
      ctx.fillStyle = '#c8643a'; ellipse(18, -52, 12, 10);
      ink(P2('M14,-78 C14,-90 20,-90 22,-82 C22,-92 30,-92 30,-82 C34,-88 38,-82 34,-76 Z'), '#ff3a3a', 1.4);
      ink(P2('M38,-66 L50,-62 L38,-58 Z'), '#ffb02a', 1.4);
      ink(P2('M36,-56 C40,-50 36,-44 32,-50 Z'), '#ff3a3a', 1.2);
      eye(30, -68, 3);
    },
    duck(baby) {
      if (baby) {
        legs([-6, 6], -10, 10, 3, '#ff9a2a');
        inkEllipse(-2, -24, 22, 15, 0, '#ffe14a', 2); inkCircle(14, -42, 13, '#ffe14a', 2);
        ctx.fillStyle = '#ffe14a'; ellipse(6, -32, 10, 10);
        ink(P2('M25,-42 C32,-44 38,-42 38,-38 C34,-35 28,-35 24,-37 Z'), '#ff9a2a', 1.2); eye(18, -45, 2.6);
        return;
      }
      legs([-8, 8], -14, 14, 4, '#ff9a2a');
      ink(P2('M-40,-40 L-52,-54 L-44,-36 Z'), '#ffffff', 1.6);
      inkEllipse(-6, -32, 38, 22, 0, '#ffffff', 2.2);
      ink(P2('M-26,-36 C-14,-48 10,-44 14,-30 C2,-22 -16,-24 -26,-36 Z'), '#eeeaf4', 1.4);
      ink(P2('M18,-40 C22,-56 20,-66 26,-72 L38,-66 C32,-56 32,-46 30,-36 Z'), '#ffffff', 1.8);
      inkCircle(30, -72, 15, '#ffffff', 2); ctx.fillStyle = '#fff'; ellipse(26, -58, 9, 10);
      ink(P2('M40,-74 C50,-76 60,-72 60,-66 C52,-62 44,-63 40,-66 Z'), '#ff9a2a', 1.4);
      eye(34, -76, 3);
    },
  };
  function drawFarmAnimal(kind, x, y, s = 1, baby = false, dir = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,20,60,.18)'; ellipse(0, 0, 50, 7);
    FARM[kind](baby);
    ctx.restore();
  }
  function drawDog(x, y, s, t, dir = 1, run = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(0, 0, 40, 6);
    const k = Math.sin(t * 18) * 6 * run;
    legs([-22 - k * 0.5, 16 + k * 0.5], -22, 22, 8, '#3a2a2a', '#ffffff');
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-28, -36); ctx.quadraticCurveTo(-46, -46 + Math.sin(t * 14) * 6, -44, -60 + Math.sin(t * 14) * 6); ctx.stroke(); ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 6; ctx.stroke();
    inkEllipse(-4, -34, 34, 16, 0, '#3a2a2a', 2);
    ctx.fillStyle = '#ffffff'; ellipse(4, -26, 22, 9);
    legs([-14 + k * 0.5, 24 - k * 0.5], -22, 22, 8, '#3a2a2a', '#ffffff');
    inkCircle(30, -50, 15, '#3a2a2a', 2);
    ctx.fillStyle = '#ffffff'; ellipse(36, -44, 10, 8); ellipse(28, -50, 3, 9);
    inkEllipse(44, -46, 6, 4, 0, '#2a1a1a', 1);
    ink(P2('M18,-60 L22,-74 L30,-62 Z'), '#3a2a2a', 1.4);
    eye(34, -54, 2.6);
    ctx.fillStyle = '#ff6f8a'; ellipse(40, -38, 4, 5);
    inkRect(18, -42, 12, 5, '#ff3f6a', 1, 2);
    ctx.restore();
  }
  function farmStatic() {
    bdSky('#4cc0ff', '#fff6dc');
    // patchwork fields on the far hills
    bdHills('#b8e09a', 268, 22, 0.005, 1);
    const R = rng(44);
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 268 - Math.sin(x * 0.005 + 1) * 22 - Math.sin(x * 0.0115 + 1) * 9); ctx.lineTo(W, H); ctx.clip();
    const patch = ['#d8e870', '#9ed870', '#f0d070', '#7cc860', '#c8e090', '#e8c080'];
    for (let i = 0; i < 9; i++) { ctx.fillStyle = patch[i % 6]; ctx.beginPath(); ctx.moveTo(i * 120 - 40, 400); ctx.lineTo(i * 120 + 90, 400); ctx.lineTo(i * 120 + 150, 200); ctx.lineTo(i * 120 + 10, 200); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(91,63,115,.15)'; ctx.lineWidth = 1.5; for (let y = 250; y < 330; y += 9) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
    for (const [x, h] of [[60, 70], [300, 60], [940, 74]]) drawTree(x, 290, h, 20, 0, 0);
    // middle meadow
    const mg = ctx.createLinearGradient(0, 300, 0, H); mg.addColorStop(0, '#8fd468'); mg.addColorStop(1, '#6cc050');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 316 + Math.sin(x * 0.01) * 6); ctx.lineTo(W, H); ctx.fill();
    // the silo, then the big red barn
    inkRect(816, 150, 74, 230, '#c8c8d8', 2.5, 4);
    ctx.fillStyle = '#b0b0c4'; for (let y = 170; y < 380; y += 26) ctx.fillRect(818, y, 70, 4);
    ink(P2('M812,152 C812,104 894,104 894,152 Z'), '#8a9ab8', 2.5);
    const bx = 560, bw = 240, top = 200;
    ink(P2(`M${bx},380 L${bx},${top + 40} L${bx + 30},${top - 10} L${bx + bw / 2},${top - 50} L${bx + bw - 30},${top - 10} L${bx + bw},${top + 40} L${bx + bw},380 Z`), '#d0443a', 3);
    ctx.save(); ctx.clip(P2(`M${bx},380 L${bx},${top + 40} L${bx + 30},${top - 10} L${bx + bw / 2},${top - 50} L${bx + bw - 30},${top - 10} L${bx + bw},${top + 40} L${bx + bw},380 Z`));
    ctx.strokeStyle = 'rgba(120,20,20,.3)'; ctx.lineWidth = 2; for (let x = bx + 16; x < bx + bw; x += 16) { ctx.beginPath(); ctx.moveTo(x, top - 60); ctx.lineTo(x, 380); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(bx - 8, top + 46); ctx.lineTo(bx + 28, top - 14); ctx.lineTo(bx + bw / 2, top - 56); ctx.lineTo(bx + bw - 28, top - 14); ctx.lineTo(bx + bw + 8, top + 46); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.stroke();
    // hayloft with hay poking out, and the big X doors
    inkRect(bx + bw / 2 - 30, top, 60, 50, '#5a2a2a', 2.5, 3); ctx.fillStyle = '#f0c850'; ctx.fillRect(bx + bw / 2 - 26, top + 30, 52, 18);
    ctx.strokeStyle = '#d8a830'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(bx + bw / 2 - 24 + i * 6, top + 32); ctx.lineTo(bx + bw / 2 - 26 + i * 6 + (i % 3), top + 24); ctx.stroke(); }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(bx + bw / 2 - 30, top, 60, 50);
    for (const d of [-1, 1]) {
      const dx = bx + bw / 2 + (d < 0 ? -66 : 0);
      inkRect(dx, 280, 66, 100, '#b8342c', 2.5, 2);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.strokeRect(dx + 3, 283, 60, 94); ctx.beginPath(); ctx.moveTo(dx + 3, 283); ctx.lineTo(dx + 63, 377); ctx.moveTo(dx + 63, 283); ctx.lineTo(dx + 3, 377); ctx.stroke();
    }
    inkRect(bx + 20, 240, 36, 30, '#bfe6ff', 2, 3); inkRect(bx + bw - 56, 240, 36, 30, '#bfe6ff', 2, 3);
    for (const wx of [bx + 38, bx + bw - 38]) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, 240); ctx.lineTo(wx, 270); ctx.moveTo(wx - 18, 255); ctx.lineTo(wx + 18, 255); ctx.stroke(); }
    // weathervane rooster on the roof peak
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx + bw / 2, top - 56); ctx.lineTo(bx + bw / 2, top - 96); ctx.moveTo(bx + bw / 2 - 14, top - 76); ctx.lineTo(bx + bw / 2 + 14, top - 76); ctx.stroke();
    ink(P2(`M${bx + bw / 2 - 14},${top - 98} C${bx + bw / 2 - 10},${top - 112} ${bx + bw / 2 + 8},${top - 112} ${bx + bw / 2 + 14},${top - 104} L${bx + bw / 2 + 4},${top - 98} Z`), '#3a3a5a', 1.4);
    // crop field rows behind the fence on the left, with a scarecrow
    ctx.fillStyle = '#c8a060'; ctx.beginPath(); ctx.moveTo(240, 330); ctx.lineTo(540, 330); ctx.lineTo(560, 392); ctx.lineTo(220, 392); ctx.closePath(); ctx.fill();
    for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) { const x = 250 + i * 25 + r * 2, y = 340 + r * 15; ctx.fillStyle = '#4fae4a'; ellipse(x, y, 7, 4); ctx.fillStyle = '#7ad05a'; ellipse(x - 2, y - 3, 4, 3); }
    inkRect(380, 290, 6, 70, '#8a5a3a', 1.5, 1); inkRect(356, 300, 54, 6, '#8a5a3a', 1.5, 1);
    inkRect(370, 304, 26, 34, '#5a8ae0', 1.8, 4); inkCircle(383, 290, 11, '#f0d090', 1.6); ink(P2('M366,286 L400,286 L392,272 L374,272 Z'), '#c8a050', 1.4);
    // the duck pond with reeds
    inkEllipse(130, 412, 118, 30, 0, '#5ab8f0', 2.5);
    ctx.fillStyle = '#8ad8ff'; ellipse(110, 404, 80, 14); ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(90, 400, 40, 4);
    for (const [x, y] of [[24, 404], [236, 404]]) for (let i = -2; i <= 2; i++) { ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + i * 4, y); ctx.lineTo(x + i * 7, y - 40 - (i & 1) * 12); ctx.stroke(); }
    // hay bales, sunflowers, a wooden fence
    for (const [x, y] of [[300, 418], [352, 424]]) { inkEllipse(x, y, 30, 26, 0, '#f0c850', 2); ctx.strokeStyle = '#d0a030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.stroke(); }
    inkRect(826, 400, 70, 40, '#f0c850', 2, 4); ctx.strokeStyle = '#c89a30'; ctx.lineWidth = 2; for (const y of [412, 426]) { ctx.beginPath(); ctx.moveTo(828, y); ctx.lineTo(894, y); ctx.stroke(); }
    for (const [x, h] of [[520, 90], [545, 70], [930, 96]]) { stem(x, 440, 440 - h, [[440 - h * 0.4, 1]]); for (let i = 0; i < 10; i++) { const a = i * TAU / 10; ctx.fillStyle = '#ffd23a'; ellipse(x + Math.cos(a) * 11, 440 - h + Math.sin(a) * 11, 8, 4, a); } inkCircle(x, 440 - h, 7, '#8a5030', 1.2); }
    for (let x = 230; x < 560; x += 40) inkRect(x, 380, 8, 46, '#e8d0a8', 1.8, 2);
    ctx.fillStyle = '#d8b888'; ctx.fillRect(226, 390, 334, 6); ctx.fillRect(226, 408, 334, 6);
    // near ground: grass with a dirt track
    ctx.fillStyle = '#76c858'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 444); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 442 + Math.sin(x * 0.05) * 3); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#e0c890'; ctx.beginPath(); ctx.moveTo(380, H); ctx.quadraticCurveTo(470, 480, 680, 446); ctx.lineTo(740, 446); ctx.quadraticCurveTo(560, 490, 520, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#86d468'; for (let i = 0; i < 40; i++) ellipse(R() * W, 456 + R() * 80, 13, 3);
    for (let i = 0; i < 22; i++) tinyFlower(R() * W, 456 + R() * 80, 3.5, ['#ffffff', '#ffd23a', '#ff9ac8'][i % 3]);
  }
  function tractor(x, y, t) {
    const b = Math.abs(Math.sin(t * 8)) * 1.5;
    ctx.save(); ctx.translate(x, y - b);
    inkRect(-50, -60, 70, 34, '#ff5a3a', 2.5, 6);
    inkRect(-6, -104, 50, 50, '#ff5a3a', 2.5, 6); inkRect(2, -98, 34, 30, '#bfe6ff', 2, 4);
    inkRect(-34, -84, 8, 26, '#5a5a6a', 1.5, 2);
    ctx.restore();
    for (const [wx, r] of [[22, 34], [-40, 20]]) {
      ctx.save(); ctx.translate(x + wx, y - r); ctx.rotate(t * 2);
      inkCircle(0, 0, r, '#3a3a4a', 2.5); inkCircle(0, 0, r * 0.5, '#ffd23a', 2);
      ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
      ctx.restore();
    }
    for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; ctx.fillStyle = `rgba(200,200,210,${0.7 * (1 - k)})`; circle(x - 30 + k * -20, y - 92 - k * 50, 5 + k * 8); }
  }
  BACKDROPS.farm_bg = () => {
    still('b1_farm', farmStatic);
    bdSunburst(140, 104);
    bdClouds(3, 'rgba(255,255,255,.92)', 84);
    tractor(510, 444, S.t);
    // ducks bobbing on the pond, chickens pecking in the yard
    drawFarmAnimal('duck', 100 + Math.sin(S.t * 0.5) * 30, 414 + Math.sin(S.t * 2) * 2, 0.4, false, Math.cos(S.t * 0.5) > 0 ? 1 : -1);
    drawFarmAnimal('duck', 160 + Math.sin(S.t * 0.5 + 1) * 24, 418 + Math.sin(S.t * 2 + 1) * 2, 0.26, true, Math.cos(S.t * 0.5 + 1) > 0 ? 1 : -1);
    drawFarmAnimal('duck', 180 + Math.sin(S.t * 0.5 + 1.3) * 24, 420 + Math.sin(S.t * 2 + 2) * 2, 0.26, true, Math.cos(S.t * 0.5 + 1.3) > 0 ? 1 : -1);
    [[620, 430, 1], [700, 438, -1], [790, 434, 1]].forEach(([x, y, d], i) => {
      const peck = Math.max(0, Math.sin(S.t * 3 + i * 2)) ** 4;
      ctx.save(); ctx.translate(x, y); ctx.rotate(peck * 0.5 * d); drawFarmAnimal('hen', 0, 0, 0.42, false, d); ctx.restore();
    });
    drawFarmAnimal('hen', 664, 446, 0.5, true, 1); drawFarmAnimal('hen', 676, 448, 0.45, true, -1);
  };

  // --- sheep herding: be the sheepdog, steer the sheep into the pen --------------------
  const PEN = { x: 700, y: 92, w: 236, h: 436, g0: 240, g1: 390 };
  // things in the field that sheep and dog must go around: [kind, x, y, rx, ry] footprints
  // one layout per level; each adds sheep and obstacles, and the area in front of the gate stays clear
  const HERD_LEVELS = [
    { n: 3, obs: [['hay', 330, 230, 40, 24], ['pond', 380, 452, 96, 40]] },
    { n: 4, obs: [['pond', 250, 452, 96, 40], ['rock', 430, 180, 30, 18], ['log', 470, 360, 60, 16], ['hay', 210, 230, 40, 24]] },
    { n: 5, obs: [['pond', 330, 458, 96, 40], ['hay', 260, 210, 40, 24], ['rock', 480, 165, 30, 18], ['bush', 490, 400, 42, 24], ['log', 170, 385, 60, 16]] },
    { n: 6, obs: [['pond', 330, 458, 96, 40], ['hay', 260, 210, 40, 24], ['rock', 480, 165, 30, 18], ['bush', 490, 400, 42, 24], ['log', 170, 385, 60, 16], ['hay', 410, 300, 40, 24], ['rock', 600, 478, 30, 18], ['bush', 140, 175, 42, 24]] },
  ];
  const HERD_TOTAL = HERD_LEVELS.reduce((t, l) => t + l.n, 0);
  // push a point of radius m out of every obstacle footprint (ellipses), so it slides around them;
  // animals are drawn with their feet 18px below their position, so test the feet
  function herdPushOut(obs, o, m) {
    for (const [, ox, oy, rx, ry] of obs) {
      const ax = rx + m, ay = ry + m * 0.6, ex = (o.x - ox) / ax, ey = (o.y + 18 - oy) / ay, d = Math.hypot(ex, ey);
      if (d < 1) { const k = d > 0.001 ? 1 / d : 1; o.x = ox + (d > 0.001 ? ex : 1) * k * ax; o.y = oy + ey * k * ay - 18; }
    }
  }
  function drawHerdObstacle([kind, x, y, rx, ry], t) {
    if (kind === 'pond') {
      inkEllipse(x, y, rx + 8, ry + 6, 0, '#c8b070', 2.5);
      inkEllipse(x, y, rx, ry, 0, '#4ab8e8', 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 3; i++) { const k = (t * 0.3 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - 20 + i * 24, y - 4 + i * 6, 10 + k * 18, 4 + k * 7, 0, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
      inkEllipse(x + 46, y + 8, 16, 7, 0.2, '#5ac86a', 1.5); tinyFlower(x + 48, y + 6, 4, '#ff9ac8');
      for (let i = 0; i < 4; i++) { const cx = x - rx + 8 + i * 7; ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, y + 6); ctx.lineTo(cx - 3 + i * 2, y - 34 + i * 4); ctx.stroke(); ctx.strokeStyle = '#5aa84a'; ctx.lineWidth = 2; ctx.stroke(); inkEllipse(cx - 3 + i * 2, y - 36 + i * 4, 3, 7, 0, '#8a5a3a', 1.2); }
    } else if (kind === 'hay') {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ellipse(x, y + 2, rx + 4, ry * 0.5);
      inkRect(x - rx, y - 62, rx * 2, 62, '#f4cc5a', 2.5, 10);
      ctx.strokeStyle = 'rgba(190,140,40,.7)'; ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) { const sx = x - rx + 8 + i * (rx * 2 - 16) / 6; ctx.beginPath(); ctx.moveTo(sx, y - 56); ctx.lineTo(sx + 3, y - 6); ctx.stroke(); }
      ctx.strokeStyle = '#c0503a'; ctx.lineWidth = 3; for (const yy of [y - 44, y - 18]) { ctx.beginPath(); ctx.moveTo(x - rx, yy); ctx.lineTo(x + rx, yy); ctx.stroke(); }
      inkEllipse(x, y - 62, rx - 2, 9, 0, '#ffe08a', 2);
    } else if (kind === 'rock') {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ellipse(x, y + 2, rx + 4, ry * 0.5);
      ink(P2(`M${x - rx},${y + 4} Q${x - rx - 4},${y - 26} ${x - 8},${y - 36} Q${x + 14},${y - 42} ${x + rx - 2},${y - 18} Q${x + rx + 4},${y + 2} ${x + rx - 6},${y + 6} Z`), '#a8a8b8', 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(x - 8, y - 26, 10, 5);
      inkEllipse(x + 10, y - 8, 7, 3, 0.3, '#7ac85a', 1.2);
    } else if (kind === 'bush') {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ellipse(x, y + 2, rx + 4, ry * 0.5);
      const puffs = [[-24, -18, 22], [24, -18, 22], [0, -32, 26], [-10, -10, 20], [12, -8, 20]];
      for (const [dx, dy, r] of puffs) inkCircle(x + dx, y + dy, r + 1, OL, 0);
      for (const [dx, dy, r] of puffs) { ctx.fillStyle = '#4aa84a'; circle(x + dx, y + dy, r - 1.5); }
      ctx.fillStyle = '#6ac860'; circle(x - 6, y - 38, 10); circle(x + 20, y - 24, 8);
      for (const [dx, dy] of [[-20, -24], [14, -36], [26, -10], [-4, -12]]) { ctx.fillStyle = '#ff4a5a'; circle(x + dx, y + dy, 4); }
    } else if (kind === 'log') {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ellipse(x, y + 4, rx + 4, ry * 0.6);
      inkRect(x - rx, y - 26, rx * 2, 30, '#a0683a', 2.5, 14);
      ctx.strokeStyle = 'rgba(80,40,20,.45)'; ctx.lineWidth = 2; for (const yy of [y - 16, y - 6]) { ctx.beginPath(); ctx.moveTo(x - rx + 14, yy); ctx.lineTo(x + rx - 18, yy); ctx.stroke(); }
      inkEllipse(x + rx - 4, y - 11, 9, 15, 0, '#e8c088', 2); ctx.strokeStyle = '#b88850'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x + rx - 4, y - 11, 4, 8, 0, 0, TAU); ctx.stroke();
      inkEllipse(x - 20, y - 30, 10, 5, 0, '#5ac86a', 1.2);
    }
  }
  // the meadow, painted once: mown stripes, a hedge and trees along the top, a dirt track to the gate,
  // flower clumps, clover, mushrooms and the pen with its straw, trough and little shed
  function herdField() {
    const R = rng(9);
    const fg = ctx.createLinearGradient(0, 60, 0, H); fg.addColorStop(0, '#a6e47e'); fg.addColorStop(1, '#68be4c');
    ctx.fillStyle = fg; ctx.fillRect(0, 60, W, H - 60);
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    for (let i = -4; i < 14; i++) { ctx.beginPath(); ctx.moveTo(i * 90, 60); ctx.lineTo(i * 90 + 45, 60); ctx.lineTo(i * 90 + 45 + 240, H); ctx.lineTo(i * 90 + 240, H); ctx.fill(); }
    // trees and a hedge along the top edge
    for (let x = -20; x < W + 40; x += 70 + R() * 30) { const r = 30 + R() * 16; inkCircle(x, 70, r, ['#3e9a48', '#4aa850', '#358a40'][Math.floor(R() * 3)], 2.5); }
    for (let x = -10; x < W + 20; x += 26) inkCircle(x, 96 + Math.sin(x) * 2, 18, '#4fae4a', 2);
    for (let x = -10; x < W + 20; x += 26) { ctx.fillStyle = '#62c058'; circle(x - 4, 90, 9); }
    for (let i = 0; i < 18; i++) { ctx.fillStyle = ['#ff6a8a', '#fff', '#ffd23a'][i % 3]; circle(R() * W, 86 + R() * 20, 3); }
    // a worn dirt track from the left side to the pen gate
    const track = (lw, col) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, 330); ctx.bezierCurveTo(200, 250, 420, 380, PEN.x - 10, (PEN.g0 + PEN.g1) / 2); ctx.stroke(); };
    track(64, 'rgba(150,110,60,.35)'); track(48, '#dcc08a'); track(18, 'rgba(255,240,200,.35)');
    // grass tufts, clover, flower clumps and mushrooms
    for (let i = 0; i < 70; i++) { const x = R() * 680, y = 120 + R() * 410; grassBlades(x - 8, x + 8, y, R, ['#4aa43c', '#78cc58', '#5ab44a'], 6, 13, 0.7); }
    for (let i = 0; i < 14; i++) { const x = 20 + R() * 650, y = 130 + R() * 390; ctx.fillStyle = 'rgba(70,150,60,.45)'; for (let k = 0; k < 3; k++) circle(x + Math.cos(k * 2.1) * 5, y + Math.sin(k * 2.1) * 5, 5); }
    for (let i = 0; i < 16; i++) { const x = 20 + R() * 650, y = 130 + R() * 390, c = ['#ffffff', '#ffd23a', '#ff9ac8', '#b89cff'][i % 4]; for (let k = 0; k < 4; k++) tinyFlower(x + (R() - 0.5) * 26, y + (R() - 0.5) * 14, 3.5 + R() * 1.5, c); }
    for (const [x, y] of [[40, 470], [600, 140], [120, 140]]) { inkRect(x - 3, y - 10, 6, 10, '#fff6e8', 1.5, 2); ink(P2(`M${x - 10},${y - 9} Q${x},${y - 24} ${x + 10},${y - 9} Z`), '#ff5a4a', 1.5); ctx.fillStyle = '#fff'; circle(x - 3, y - 14, 1.8); circle(x + 4, y - 12, 1.4); }
    // the pen: straw floor, a little shed and a water trough
    ctx.fillStyle = '#f4dc90'; ctx.fillRect(PEN.x, PEN.y, PEN.w, PEN.h);
    ctx.strokeStyle = 'rgba(200,160,60,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 70; i++) { const x = PEN.x + R() * PEN.w, y = PEN.y + R() * PEN.h, a = R() * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 4); ctx.stroke(); }
    const sx = PEN.x + PEN.w - 92, sy = PEN.y + 6;
    inkRect(sx, sy + 34, 84, 56, '#d8504a', 2.5, 4); inkRect(sx + 28, sy + 56, 28, 34, '#7a3a2a', 2, 3);
    ink(P2(`M${sx - 8},${sy + 38} L${sx + 42},${sy + 4} L${sx + 92},${sy + 38} Z`), '#8a5a3a', 2.5);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx + 30, sy + 58); ctx.lineTo(sx + 54, sy + 88); ctx.moveTo(sx + 54, sy + 58); ctx.lineTo(sx + 30, sy + 88); ctx.stroke();
    inkRect(PEN.x + 30, PEN.y + PEN.h - 46, 96, 28, '#a0683a', 2.5, 6); inkRect(PEN.x + 36, PEN.y + PEN.h - 42, 84, 12, '#5ac0f0', 1.5, 4);
  }
  MG.sheepherd = {
    kind: 'action', title: () => 'Sheep Herding', icon: () => '🐑',
    how: () => `Herd the sheep, Aubrey! Move with the mouse or the arrow keys. Sheep run away from you, so get behind them and push them into the pen through the gate. There are 4 levels, and each one has more sheep and more things in the way!`,
    init(g) {
      Object.assign(g, { lvl: 0, pennedTotal: 0, between: 0, banner: '' });
      this.setup(g);
      g.say = 'Push the sheep into the pen!';
    },
    setup(g) {
      const L = HERD_LEVELS[g.lvl], obs = L.obs;
      const clear = (x, y) => obs.every(([, ox, oy, rx, ry]) => Math.hypot((x - ox) / (rx + 40), (y + 18 - oy) / (ry + 30)) > 1);
      const sheep = [];
      for (let i = 0; i < L.n; i++) {
        let x, y, k = 0;
        do { x = rand(160, 560); y = rand(170, 460); } while ((!clear(x, y) || sheep.some(s => Math.hypot(s.x - x, s.y - y) < 60)) && ++k < 120);
        sheep.push({ x, y, vx: 0, vy: 0, wt: 0, wx: 0, wy: 0, penned: false, dir: 1, baa: rand(2, 6) });
      }
      Object.assign(g, { sheep, obs, dx: 60, dy: 300, ddir: 1, run: 0, end: 0, n: L.n, timeLeft: [45, 55, 60, 70][g.lvl] - (g.tier - 1) * 5 });
    },
    start(g) { speak(g.say); },
    inPen: (x, y, m = 0) => x > PEN.x + m && x < PEN.x + PEN.w - m && y > PEN.y + m && y < PEN.y + PEN.h - m,
    update(g, dt) {
      if (g.between > 0) {
        if ((g.between -= dt) <= 0) { g.lvl++; this.setup(g); g.say = `Level ${g.lvl + 1}! ${g.n} sheep this time.`; speak(g.say); }
        return;
      }
      g.timeLeft -= dt;
      // the dog
      const ox = g.dx, oy = g.dy, sp = 380;
      const ax = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ay = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (ax || ay) { g.dx += ax * sp * dt; g.dy += ay * sp * dt; g.usePointer = false; }
      else if (pointerMoved(g) || g.usePointer) { const ddx = pointer.x - g.dx, ddy = pointer.y - g.dy, d = Math.hypot(ddx, ddy); if (d > 4) { const m = Math.min(d, sp * dt); g.dx += ddx / d * m; g.dy += ddy / d * m; } }
      g.dx = clamp(g.dx, 20, W - 20); g.dy = clamp(g.dy, 100, 525);
      const dp = { x: g.dx, y: g.dy }; herdPushOut(g.obs, dp, 16); g.dx = dp.x; g.dy = dp.y;
      const moved = Math.hypot(g.dx - ox, g.dy - oy);
      g.run = lerp(g.run, moved > 1 ? 1 : 0, Math.min(1, dt * 8));
      if (Math.abs(g.dx - ox) > 0.5) g.ddir = Math.sign(g.dx - ox);
      // the sheep: wander, flee the dog, keep a little apart
      for (const s of g.sheep) {
        let fx = 0, fy = 0;
        if ((s.wt -= dt) <= 0) { s.wt = rand(1.5, 3.5); const a = rand(0, TAU); s.wx = Math.cos(a) * 26; s.wy = Math.sin(a) * 26; }
        fx += s.wx; fy += s.wy;
        const ddx = s.x - g.dx, ddy = s.y - g.dy, d = Math.hypot(ddx, ddy), R = 170;
        if (d < R && d > 1) { const k = (1 - d / R) * 230 + 50; fx += ddx / d * k; fy += ddy / d * k; if ((s.baa -= dt * 3) <= 0) { s.baa = rand(3, 7); tone(rand(380, 460), 0.3, 'sawtooth', 0.03, 0, 330); } }
        for (const o of g.sheep) if (o !== s) { const ex = s.x - o.x, ey = s.y - o.y, e = Math.hypot(ex, ey); if (e < 50 && e > 0.1) { fx += ex / e * (50 - e) * 3; fy += ey / e * (50 - e) * 3; } }
        if (s.penned) { fx *= 0.4; fy *= 0.4; }
        // edges of the field nudge sheep back in, so they can't get pinned where the dog can't get behind them
        else { fx += Math.max(0, 90 - s.x) * 3 - Math.max(0, s.x - (PEN.x - 30)) * (s.y > PEN.g0 && s.y < PEN.g1 ? 0 : 3); fy += Math.max(0, 170 - s.y) * 3 - Math.max(0, s.y - 460) * 3; }
        s.vx = lerp(s.vx, fx, Math.min(1, dt * 4)); s.vy = lerp(s.vy, fy, Math.min(1, dt * 4));
        const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt, m = 22;
        if (s.penned) { s.x = clamp(nx, PEN.x + m + 10, PEN.x + PEN.w - m); s.y = clamp(ny, PEN.y + m + 10, PEN.y + PEN.h - m); }
        else {
          // the pen's walls: only the gate on its left side lets sheep in
          const wasIn = this.inPen(s.x, s.y, -m), isIn = this.inPen(nx, ny, -m);
          const viaGate = s.x <= PEN.x - m + 2 && ny > PEN.g0 + 8 && ny < PEN.g1 - 8;
          if (isIn && !wasIn && !viaGate) {
            if (!this.inPen(nx, s.y, -m)) s.x = nx; else if (!this.inPen(s.x, ny, -m)) s.y = ny;
          } else if (isIn && wasIn && !(ny > PEN.g0 + 8 && ny < PEN.g1 - 8) && s.x < PEN.x + m) { s.x = nx; }
          else { s.x = nx; s.y = ny; }
          herdPushOut(g.obs, s, 20);
          s.x = clamp(s.x, 30, W - 30); s.y = clamp(s.y, 110, 515);
          if (this.inPen(s.x, s.y, m + 6)) { s.penned = true; SFX.hit(); burst(s.x, s.y - 30, 14); floatText(s.x, s.y - 50, 'Baa!', '#fff6a8', false, 24); chime(g.sheep.filter(q => q.penned).length * 3); }
        }
        if (Math.abs(s.vx) > 8) s.dir = Math.sign(s.vx);
      }
      const penned = g.sheep.filter(s => s.penned).length;
      g.progress = `Level ${g.lvl + 1} of 4 · 🐑 ${penned} of ${g.n}`;
      g.score = (g.pennedTotal + penned) / HERD_TOTAL;
      const allIn = penned === g.n && (g.end += dt) > 1.2, outOfTime = g.timeLeft <= 0;
      if (allIn || outOfTime) {
        g.pennedTotal += penned; g.timeLeft = Math.max(0, g.timeLeft);
        if (g.lvl === HERD_LEVELS.length - 1) g.done = true;
        else {
          g.between = 2.4; g.banner = allIn ? `Level ${g.lvl + 1} done!` : "Time's up!";
          if (allIn) { SFX.fanfare(); burst(W / 2, 250, 30, { kind: 'star' }); } else SFX.miss();
          speak(allIn ? 'Great herding! On to the next field!' : "Time's up! Let's try the next field.");
        }
      }
    },
    draw(g) {
      still('b1_herd_field', herdField);
      for (const o of g.obs) if (o[0] === 'pond') drawHerdObstacle(o, S.t);
      // cloud shadows drift slowly over the field
      ctx.fillStyle = 'rgba(30,80,40,.08)';
      for (let i = 0; i < 3; i++) { const cx = ((S.t * 14 + i * 380) % (W + 400)) - 200, cy = 180 + i * 130; ellipse(cx, cy, 120, 46); ellipse(cx + 70, cy + 14, 80, 34); }
      // the pen: straw floor, fence all round, gate open on the left
      const rail = (x0, y0, x1, y1) => { ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = '#d8a868'; ctx.lineWidth = 7; ctx.stroke(); };
      ctx.lineCap = 'round';
      rail(PEN.x, PEN.y, PEN.x + PEN.w, PEN.y); rail(PEN.x + PEN.w, PEN.y, PEN.x + PEN.w, PEN.y + PEN.h); rail(PEN.x, PEN.y + PEN.h, PEN.x + PEN.w, PEN.y + PEN.h);
      rail(PEN.x, PEN.y, PEN.x, PEN.g0); rail(PEN.x, PEN.g1, PEN.x, PEN.y + PEN.h);
      for (const [x, y] of [[PEN.x, PEN.y], [PEN.x + PEN.w, PEN.y], [PEN.x + PEN.w, PEN.y + PEN.h], [PEN.x, PEN.y + PEN.h], [PEN.x, PEN.g0], [PEN.x, PEN.g1], [PEN.x + PEN.w / 2, PEN.y], [PEN.x + PEN.w / 2, PEN.y + PEN.h]]) inkCircle(x, y, 9, '#a0683a', 2);
      ctx.save(); ctx.translate(PEN.x, PEN.g0); ctx.rotate(-1.1); inkRect(-6, -6, 60, 12, '#e8c080', 2, 4); ctx.restore();
      // arrows pointing in through the gate
      for (let i = 0; i < 3; i++) { const k = (S.t * 0.8 + i / 3) % 1; ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8; ink(P2(`M${PEN.x - 120 + k * 90},${(PEN.g0 + PEN.g1) / 2 - 14} L${PEN.x - 96 + k * 90},${(PEN.g0 + PEN.g1) / 2} L${PEN.x - 120 + k * 90},${(PEN.g0 + PEN.g1) / 2 + 14} Z`), '#fff6a8', 1.5); }
      ctx.globalAlpha = 1;
      outlined('PEN', PEN.x + 62, PEN.y + 34, 26, '#fff', 'center', '#a0683a');
      // everyone, back to front
      const all = [...g.obs.filter(o => o[0] !== 'pond').map(o => ({ y: o[2] - 18, d: () => drawHerdObstacle(o, S.t) })), ...g.sheep.map(s => ({ y: s.y, d: () => drawFarmAnimal('sheep', s.x, s.y + 18, 0.5, false, s.dir) })), { y: g.dy, d: () => drawAubrey(g.dx, g.dy + 18, g.run > 0.3 ? `run${1 + (Math.floor(g.t * 11) % 5)}` : 'idle_front', g.ddir || 1, 0, 104 / IMG.idle_front.height) }];
      all.sort((a, b) => a.y - b.y).forEach(o => o.d());
      for (const s of g.sheep) if (s.penned) { ctx.fillStyle = '#ff5f7e'; heart(s.x + 14, s.y - 46 + Math.sin(S.t * 4 + s.x) * 3, 14, '#ff5f7e'); }
      // butterflies flit over the meadow
      for (let i = 0; i < 4; i++) {
        const bx = 120 + i * 150 + Math.sin(S.t * 0.6 + i * 2) * 70, by = 150 + ((i * 97) % 300) + Math.sin(S.t * 1.3 + i) * 30, f = Math.abs(Math.sin(S.t * 10 + i));
        const c = ['#ff9ac8', '#ffd23a', '#9cd0ff', '#c8a0ff'][i];
        inkEllipse(bx - 5 * f, by, 6 * f + 1, 5, -0.4, c, 1.2); inkEllipse(bx + 5 * f, by, 6 * f + 1, 5, 0.4, c, 1.2);
        ctx.fillStyle = OL; ellipse(bx, by, 1.6, 4.5);
      }
      // level dots, and the banner between levels
      for (let i = 0; i < HERD_LEVELS.length; i++) inkCircle(W / 2 - 39 + i * 26, 76, 8, i < g.lvl || (i === g.lvl && g.between > 0) ? '#ffd23a' : i === g.lvl ? '#fff' : 'rgba(255,255,255,.4)', 2);
      if (g.between > 0) {
        const k = Math.min(1, (2.4 - g.between) * 4);
        ctx.save(); ctx.translate(W / 2, 270); ctx.scale(k, k);
        rrect(-230, -70, 460, 140, 30, '#fffdf4', OL, 4);
        outlined(g.banner, 0, -18, 44, '#ff8a3a', 'center');
        text(`Next: ${HERD_LEVELS[g.lvl + 1].n} sheep!`, 0, 36, 26, '#4a3a5a', 'center', 800);
        ctx.restore();
      }
    },
  };

  // --- farm facts: Penny tells a fact, Aubrey catches the animal in the pen that it's about ----
  // each fact is [harder?, fact in the animal's voice, what we say after]. Every fact must fit only
  // ONE of these animals, because any of the others can be milling about in the pen.
  const FARM_FACTS = {
    cow: [[0, 'Most of the milk at the grocery store comes from me.', 'Cows give us most of the milk we drink.'],
      [0, 'A boy of my kind is called a bull, and my baby is a calf.', 'Boy cows are bulls, and babies are calves.'],
      [1, 'I can lick the inside of my own nose with my long tongue!', 'A cow\'s tongue is so long it can reach right up its nose!']],
    sheep: [[0, 'My baby is a lamb, and a boy of my kind is a ram.', 'Baby sheep are lambs, and boy sheep are rams.'],
      [0, 'If one of my flock walks off, the rest of us follow the leader!', 'Sheep stick together and follow the leader.'],
      [1, 'My wool has a special grease called lanolin that goes in hand cream.', 'Lanolin from sheep wool keeps hands soft!']],
    goat: [[0, 'My baby is called a kid, just like a human child!', 'Baby goats are called kids.'],
      [0, 'I am such a good climber, I can even climb up trees!', 'Some goats climb trees to munch the leaves.'],
      [1, 'I have a beard on my chin, and my horns curve backwards.', 'Lots of goats have chin beards and curvy horns.']],
    llama: [[0, 'When I get really grumpy, I spit!', 'Llamas spit when they are cross.'],
      [0, 'I come from the tall Andes mountains in South America.', 'Llamas live high in the Andes mountains.'],
      [1, 'My baby is called a cria, and I hum to talk to my friends.', 'Llamas hum to each other, and their babies are crias.']],
    horse: [[0, 'People measure how tall I am in hands, not feet!', 'Horses are measured in hands. One hand is about four inches.'],
      [0, 'I race around a racetrack with a jockey riding on my back.', 'Racehorses are ridden by jockeys.'],
      [1, 'A grown-up boy of my kind is called a stallion.', 'A grown-up boy horse is a stallion.']],
    donkey: [[0, 'I have extra-long ears, and I bray: hee-haw!', 'Donkeys bray hee-haw, and their long ears help them stay cool.'],
      [0, 'Another name for me is a burro.', 'Burro is another word for a donkey.'],
      [1, 'A girl of my kind is called a jenny, and a boy is a jack.', 'Girl donkeys are jennies, and boy donkeys are jacks.']],
    pig: [[0, 'I roll in mud to stay cool, because I can hardly sweat.', 'Pigs can\'t sweat much, so mud keeps them cool.'],
      [0, 'My nose is called a snout, and I dig in the dirt with it.', 'Pigs dig for food with their snouts.'],
      [1, 'I am one of the smartest farm animals, even smarter than a dog!', 'Pigs are super smart and can learn tricks.']],
    rabbit: [[0, 'My front teeth never stop growing, so I chew all day.', 'Rabbits chew hay to keep their teeth short.'],
      [0, 'I thump my big back feet to warn my friends about danger.', 'A rabbit thump means look out!'],
      [1, 'When I am happy, I jump and twist in the air. It is called a binky!', 'A happy rabbit does a binky!']],
    hen: [[0, 'A boy of my kind is called a rooster, and he crows in the morning.', 'Roosters crow cock-a-doodle-doo!'],
      [0, 'The red crown on top of my head is called a comb.', 'That floppy red crown is a comb.'],
      [1, 'My babies are called chicks, and I cluck to call them to food.', 'Mother hens cluck to show their chicks where the food is.']],
    duck: [[0, 'My oily feathers keep me dry, so water rolls right off me.', 'Oily feathers keep ducks dry.'],
      [0, 'I have webbed feet that work like flippers.', 'Webbed feet help ducks paddle.'],
      [1, 'I tip upside down in the pond to find food. It is called dabbling.', 'Ducks dabble with their tails in the air!']],
    turkey: [[0, 'A boy of my kind gobbles and fans his tail out like a big wheel.', 'Boy turkeys gobble and show off their tail fans.'],
      [0, 'The floppy red skin that hangs over my beak is called a snood.', 'That dangly bit over a turkey\'s beak is a snood.'],
      [1, 'My bare head can change colour to red, white or blue!', 'A turkey\'s head changes colour when it gets excited.']],
  };
  const FARM_KINDS = Object.keys(FARM_FACTS);
  // the pen: its fence line, the floor the animals' feet stay on, and the barn door they come and go by
  const FFP = { x0: 196, x1: 944, y0: 214, y1: 530, ax0: 252, ax1: 896, ay0: 282, ay1: 484, door: { x: 862, y: 250 } };
  // little animals are drawn a bit smaller, so the pen looks natural
  const FF_SC = { hen: 0.36, duck: 0.36, rabbit: 0.36, turkey: 0.4, pig: 0.42, sheep: 0.44, goat: 0.44, donkey: 0.46, cow: 0.48, horse: 0.48, llama: 0.48 };
  const ffSc = k => FF_SC[k] || 0.44;
  // how far apart two animals are, squashed so side-by-side counts more than front-to-back
  const ffGap = (a, b) => Math.hypot((a.x - b.x) / 100, (a.y - b.y) / 46);
  const ffFree = a => a.mode === 'walk' || a.mode === 'graze' || a.mode === 'flee' || a.mode === 'enter';
  function ffSpot(herd) {
    let x, y, k = 0;
    do { x = rand(FFP.ax0 + 20, FFP.ax1 - 20); y = rand(FFP.ay0 + 10, FFP.ay1 - 10); } while (herd.some(o => o.mode !== 'gone' && ffGap(o, { x, y }) < 1.15) && ++k < 80);
    return { x, y };
  }
  const ffAnimal = (k, x, y, mode = 'graze') => ({ k, x, y, vx: 0, vy: 0, dir: Math.random() < 0.5 ? 1 : -1, mode, mt: rand(0.5, 2.5), tx: x, ty: y, sp: rand(34, 56), ph: rand(0, 6), seed: rand(0, 9), bump: 0, line: '', lineT: 0, alpha: 1, fleeCD: 0 });
  // the field and pen, painted once: grass, hedge, straw floor, mud, trough, fence and the barn
  function ffPenPaint() {
    const R = rng(23);
    const fg = ctx.createLinearGradient(0, 60, 0, H); fg.addColorStop(0, '#a6e47e'); fg.addColorStop(1, '#6cc050');
    ctx.fillStyle = fg; ctx.fillRect(0, 60, W, H - 60);
    for (let x = -20; x < W + 40; x += 64 + R() * 30) inkCircle(x, 76, 28 + R() * 14, ['#3e9a48', '#4aa850', '#358a40'][Math.floor(R() * 3)], 2.5);
    for (let x = -10; x < W + 20; x += 26) inkCircle(x, 104, 17, '#4fae4a', 2);
    for (let x = -10; x < W + 20; x += 26) { ctx.fillStyle = '#62c058'; circle(x - 4, 98, 8); }
    for (let i = 0; i < 16; i++) { ctx.fillStyle = ['#ff6a8a', '#fff', '#ffd23a'][i % 3]; circle(R() * W, 94 + R() * 18, 3); }
    for (let i = 0; i < 26; i++) { const x = R() * 180, y = 130 + R() * 400; grassBlades(x - 8, x + 8, y, R, ['#4aa43c', '#78cc58', '#5ab44a'], 6, 13, 0.7); }
    for (let i = 0; i < 7; i++) { const x = 14 + R() * 160, y = 330 + R() * 190, c = ['#ffffff', '#ffd23a', '#ff9ac8', '#b89cff'][i % 4]; for (let k = 0; k < 4; k++) tinyFlower(x + (R() - 0.5) * 24, y + (R() - 0.5) * 12, 3.5 + R() * 1.5, c); }
    // straw floor with a darker edge, a scatter of straw and a few hay tufts
    ctx.fillStyle = '#e6c878'; ctx.fillRect(FFP.x0, FFP.y0, FFP.x1 - FFP.x0, FFP.y1 - FFP.y0);
    ctx.fillStyle = '#f4dc92'; ctx.fillRect(FFP.x0 + 10, FFP.y0 + 8, FFP.x1 - FFP.x0 - 20, FFP.y1 - FFP.y0 - 14);
    ctx.lineWidth = 2;
    for (let i = 0; i < 150; i++) { const x = FFP.x0 + 12 + R() * (FFP.x1 - FFP.x0 - 30), y = FFP.y0 + 12 + R() * (FFP.y1 - FFP.y0 - 20), a = R() * 3; ctx.strokeStyle = R() < 0.5 ? 'rgba(200,150,60,.55)' : 'rgba(255,240,180,.8)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 4); ctx.stroke(); }
    // the mud patch, lower left
    inkEllipse(330, 462, 78, 26, -0.05, '#8a5a3a', 2.5);
    ctx.fillStyle = '#a06a44'; ellipse(326, 458, 60, 17);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ellipse(300, 452, 20, 5); ellipse(352, 466, 12, 3);
    // a hay pile in the far right corner of the floor
    for (const [dx, dy, r] of [[-26, 2, 22], [0, -8, 26], [26, 2, 22]]) inkCircle(900 + dx, 500 + dy, r, '#f4cc5a', 2);
    ctx.strokeStyle = 'rgba(190,140,40,.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const x = 872 + R() * 56, y = 486 + R() * 26; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (R() - 0.5) * 16, y - 10); ctx.stroke(); }
    // the barn, behind the fence on the right, door open to the pen
    const bx = 796, by = 140, bw = 132, bh = 112, d = FFP.door;
    inkRect(bx, by, bw, bh, '#d8504a', 2.5, 4);
    ctx.strokeStyle = 'rgba(120,30,30,.35)'; ctx.lineWidth = 2; for (let x = bx + 14; x < bx + bw; x += 14) { ctx.beginPath(); ctx.moveTo(x, by + 4); ctx.lineTo(x, by + bh - 2); ctx.stroke(); }
    ink(P2(`M${bx - 12},${by + 6} L${bx + bw / 2},${by - 46} L${bx + bw + 12},${by + 6} Z`), '#8a5a3a', 2.5);
    inkRect(bx + bw / 2 - 16, by - 26, 32, 22, '#fff6e8', 2, 3); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(bx + bw / 2 - 1, by - 24, 2, 18); ctx.fillRect(bx + bw / 2 - 14, by - 16, 28, 2);
    inkRect(d.x - 34, by + 30, 68, bh - 30, '#3a2218', 2.5, 3);
    ctx.fillStyle = 'rgba(255,220,140,.18)'; ctx.fillRect(d.x - 30, by + bh - 24, 60, 22);
    // the trough along the back fence
    inkRect(470, 220, 130, 30, '#a0683a', 2.5, 6); inkRect(477, 224, 116, 12, '#5ac0f0', 1.5, 4);
    for (const x of [482, 588]) inkRect(x - 4, 246, 8, 12, '#7a4a2a', 1.5, 2);
    // back and left fence: posts and two rails
    const rail = (x0, y0, x1, y1, w = 9) => { ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = w + 5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = '#d8a868'; ctx.lineWidth = w; ctx.stroke(); };
    const post = (x, y, h) => inkRect(x - 6, y - h, 12, h + 4, '#b07840', 2, 3);
    for (const yy of [FFP.y0 - 30, FFP.y0 - 10]) rail(FFP.x0, yy, bx, yy);
    for (let x = FFP.x0; x <= bx; x += 75) post(x, FFP.y0, 50);
    for (const xx of [FFP.x0 - 4, FFP.x0 + 4]) rail(xx, FFP.y0 - 20, xx, FFP.y1 - 16, 6);
    for (let y = FFP.y0 + 60; y < FFP.y1 - 20; y += 80) post(FFP.x0, y, 46);
    rail(FFP.x1 - 4, FFP.y0 + 30, FFP.x1 - 4, FFP.y1 - 16, 6);
    // hay bales outside the pen, by Penny
    for (const [x, y, w] of [[18, 520, 120], [36, 470, 90]]) {
      inkRect(x, y - 44, w, 44, '#f4cc5a', 2.5, 8);
      ctx.strokeStyle = 'rgba(190,140,40,.7)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const sx = x + 8 + i * (w - 16) / 5; ctx.beginPath(); ctx.moveTo(sx, y - 40); ctx.lineTo(sx + 3, y - 4); ctx.stroke(); }
      ctx.strokeStyle = '#c0503a'; ctx.lineWidth = 3; for (const xx of [x + w * 0.3, x + w * 0.7]) { ctx.beginPath(); ctx.moveTo(xx, y - 44); ctx.lineTo(xx, y); ctx.stroke(); }
    }
  }
  // one pen animal: walking bob, grazing tilt, a bounce when it bumps, a hop of joy, a wriggle
  function ffDrawAnimal(a) {
    const s = ffSc(a.k), moving = Math.hypot(a.vx, a.vy) > 10;
    let lift = 0, rot = 0, sx = 0;
    if (a.mode === 'held') lift = 30 + Math.sin(S.t * 7) * 2;
    else if (a.mode === 'hop') lift = Math.abs(Math.sin(a.mt * 7)) * 26;
    else if (a.mode === 'wriggle') { lift = 18 * Math.max(0, a.mt / 0.7); rot = Math.sin(S.t * 34) * 0.16; sx = Math.sin(S.t * 40) * 4; }
    else if (moving) { lift = Math.abs(Math.sin(a.ph)) * 5; rot = Math.sin(a.ph) * 0.04; }
    else if (a.mode === 'graze') rot = 0.1 + Math.sin(S.t * 3 + a.seed) * 0.04;
    if (a.bump > 0) lift += Math.sin(a.bump / 0.3 * Math.PI) * 8;
    ctx.save(); ctx.globalAlpha = a.alpha;
    if (lift > 2) { ctx.fillStyle = 'rgba(40,30,20,.14)'; ellipse(a.x, a.y + 2, 90 * s, 10 * s); }
    ctx.translate(a.x + sx, a.y - lift); ctx.scale(a.dir, 1); ctx.rotate(rot);
    drawAnimalArt(a.k, 0, 0, s, S.t + a.seed);
    ctx.restore();
  }
  MG.farmfacts = {
    kind: 'learn', title: () => 'Farm Facts', icon: () => '🐮',
    how: () => 'Penny will tell you a farm fact. Listen, then find the animal it is about and catch it! Tap the animal, or walk up to it and press Space.',
    init(g) {
      const rounds = [6, 7, 8][g.tier - 1], nHard = [1, 3, 4][g.tier - 1], n = [4, 5, 6][g.tier - 1];
      const pool = shuffle(FARM_KINDS), herd = [];
      for (const k of pool.slice(0, n)) { const p = ffSpot(herd); herd.push(ffAnimal(k, p.x, p.y)); }
      Object.assign(g, { round: 0, rounds, nHard, total: 0, herd, spare: pool.slice(n), ax: 560, ay: 400, adir: 1, run: 0, aim: null, hug: null, talk: 0, ffyay: 0, ffHint: 0 });
      this.next(g);
    },
    start(g) { this.say(g, g.say); },
    // Penny speaks (read aloud, and her talking wobble lasts about as long as the words)
    say(g, str) { speak(str); g.talk = 0.5 + str.length * 0.062; },
    next(g) {
      const live = g.herd.filter(a => a.mode !== 'gone' && a.mode !== 'leave');
      const tgt = pick(live), hard = g.round >= g.rounds - g.nHard, fp = FARM_FACTS[tgt.k].filter(f => !!f[0] === hard);
      Object.assign(g, { k: tgt.k, tgt, fact: pick(fp.length ? fp : FARM_FACTS[tgt.k]), wrong: new Set(), ffstate: 'hunt', t2: 0, flees: 0 });
      g.say = `Listen to the fact! One animal says: ${g.fact[1]} Catch that animal!`;
      if (g.phase === 'play') this.say(g, g.say);
    },
    catchable: a => a.mode === 'walk' || a.mode === 'graze' || a.mode === 'flee' || a.mode === 'enter',
    reach: (g, a) => Math.hypot((a.x - g.ax) / 1.7, a.y - g.ay) < 50,
    // the animal under a point (its body sits above its feet)
    under(g, x, y) {
      let best = null, bd = 1;
      for (const a of g.herd) {
        if (!this.catchable(a)) continue;
        const s = ffSc(a.k) / 0.45, d = Math.hypot((x - a.x) / (66 * s), (y - (a.y - 40 * s)) / (58 * s));
        if (d < bd) { bd = d; best = a; }
      }
      return best;
    },
    grab(g, a) {
      g.hug = { a, t: 0 }; g.aim = null; a.mode = 'held'; a.vx = a.vy = 0;
      g.adir = Math.sign(a.x - g.ax) || g.adir; SFX.pop();
    },
    update(g, dt) {
      const pm = pointerMoved(g);
      g.talk = Math.max(0, g.talk - dt); g.ffyay = Math.max(0, g.ffyay - dt); g.ffHint = Math.max(0, g.ffHint - dt);
      const hunting = g.ffstate === 'hunt' && !g.hug;
      // Aubrey: arrow keys / WASD, or follow the pointer; tapping an animal sends her to catch it
      if (pointer.clicked && hunting) { const a = this.under(g, pointer.x, pointer.y); if (a) g.aim = a; }
      const ox = g.ax, oy = g.ay, sp = 300;
      const kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      const toward = (tx, ty, v) => { const dx = tx - g.ax, dy = ty - g.ay, d = Math.hypot(dx, dy); if (d > 4) { const m = Math.min(d, v * dt); g.ax += dx / d * m; g.ay += dy / d * m; } };
      if (g.hug) { /* holding still for the hug */ }
      else if (kx || ky) { g.ax += kx * sp * dt; g.ay += ky * sp * 0.8 * dt; g.usePointer = false; g.aim = null; }
      else if (g.aim && this.catchable(g.aim)) toward(g.aim.x - (Math.sign(g.aim.x - g.ax) || 1) * 60, g.aim.y, sp);
      else if (pm) toward(clamp(pointer.x, FFP.ax0 - 20, FFP.ax1 + 20), clamp(pointer.y, FFP.ay0, FFP.ay1), sp);
      g.ax = clamp(g.ax, FFP.ax0 - 20, FFP.ax1 + 20); g.ay = clamp(g.ay, FFP.ay0, FFP.ay1);
      const moved = Math.hypot(g.ax - ox, g.ay - oy);
      g.run = lerp(g.run, moved > 1 ? 1 : 0, Math.min(1, dt * 8));
      if (Math.abs(g.ax - ox) > 0.5) g.adir = Math.sign(g.ax - ox);
      // catching: reach the animal you tapped, or stand next to one and press Space
      if (hunting) {
        if (g.aim && !this.catchable(g.aim)) g.aim = null;
        if (g.aim && this.reach(g, g.aim)) this.grab(g, g.aim);
        else if (pressed[' '] || pressed.enter) {
          const near = g.herd.filter(a => this.catchable(a) && this.reach(g, a)).sort((a, b) => Math.hypot(a.x - g.ax, a.y - g.ay) - Math.hypot(b.x - g.ax, b.y - g.ay))[0];
          if (near) this.grab(g, near); else { g.ffHint = 1.4; SFX.blip(); }
        }
      }
      // the hug: a quick scoop, then the animal tells us if it's the right one
      if (g.hug) {
        const h = g.hug, a = h.a; h.t += dt;
        a.x = lerp(a.x, g.ax + g.adir * 30, Math.min(1, dt * 12)); a.y = lerp(a.y, g.ay + 4, Math.min(1, dt * 12)); a.dir = -g.adir;
        if (h.t > 0.6) {
          g.hug = null;
          if (a === g.tgt) {
            g.ffstate = 'yay'; g.ffyay = 1.2; g.total += [1, 0.3, 0][Math.min(2, g.wrong.size)];
            a.mode = 'hop'; a.mt = 1.6; SFX.sparkle(); burst(a.x, a.y - 60, 24, { kind: 'star' });
            this.say(g, `Yes, the ${a.k}! ${g.fact[2]}`); g.t2 = Math.max(3.4, g.talk);
          } else {
            g.wrong.add(a.k); a.mode = 'wriggle'; a.mt = 0.7; a.line = `Not me! I'm the ${a.k}!`; a.lineT = 2.4;
            SFX.miss(); speak(a.line);
          }
        }
      }
      // the herd
      const live = g.herd.filter(a => a.mode !== 'gone');
      for (const a of live) {
        a.mt -= dt; a.bump = Math.max(0, a.bump - dt); a.lineT = Math.max(0, a.lineT - dt); a.fleeCD = Math.max(0, a.fleeCD - dt);
        let fx = 0, fy = 0;
        if (a.mode === 'held') continue;
        if (a.mode === 'wriggle') { if (a.mt <= 0) { a.mode = 'flee'; a.mt = 0.7; a.fsp = 110; } continue; }
        if (a.mode === 'hop') { if (a.mt <= 0) { a.mode = 'leave'; } continue; }
        if (a.mode === 'leave' || a.mode === 'enter') {
          const tx = a.mode === 'leave' ? FFP.door.x : a.tx, ty = a.mode === 'leave' ? FFP.door.y : a.ty, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
          if (d < 8) { if (a.mode === 'leave') { a.alpha -= dt * 4; if (a.alpha <= 0) { a.mode = 'gone'; SFX.blip(); } } else { a.mode = 'graze'; a.mt = rand(0.6, 1.6); } }
          else { a.vx = dx / d * 95; a.vy = dy / d * 95; a.x += a.vx * dt; a.y += a.vy * dt; a.ph += dt * 11; }
          if (a.mode === 'enter' && a.y > FFP.ay0) a.alpha = Math.min(1, a.alpha + dt * 4);
          if (Math.abs(a.vx) > 6) a.dir = Math.sign(a.vx);
          continue;
        }
        // the right animal gets a little playful at higher tiers: it trots off when Aubrey comes close
        if (a === g.tgt && g.ffstate === 'hunt' && g.tier >= 2 && a.mode !== 'flee' && a.fleeCD <= 0 && g.flees < (g.tier === 2 ? 2 : 3) && Math.hypot((a.x - g.ax) / 1.5, a.y - g.ay) < 90) {
          a.mode = 'flee'; a.mt = 0.75; a.fsp = g.tier === 2 ? 115 : 140; a.fleeCD = 2.6; g.flees++; a.bump = 0.3; tone(660, 0.12, 'triangle', 0.06, 0, 880);
        }
        if (a.mode === 'graze') { if (a.mt <= 0) { const p = ffSpot(live.filter(o => o !== a)); a.mode = 'walk'; a.tx = p.x; a.ty = p.y; a.mt = rand(2.5, 4.5); a.sp = rand(34, 56); } }
        else if (a.mode === 'walk') {
          const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
          if (d < 10 || a.mt <= 0) { a.mode = 'graze'; a.mt = rand(1.2, 3.2); if (Math.random() < 0.3) a.dir *= -1; }
          else { fx += dx / d * a.sp; fy += dy / d * a.sp; }
        } else if (a.mode === 'flee') {
          // away from Aubrey, leaning back toward the middle so it never gets stuck in a corner
          const dx = a.x - g.ax, dy = (a.y - g.ay) * 1.4, d = Math.hypot(dx, dy) || 1, cx = (FFP.ax0 + FFP.ax1) / 2 - a.x, cy = (FFP.ay0 + FFP.ay1) / 2 - a.y;
          fx += (dx / d) * a.fsp + cx * 0.25; fy += (dy / d) * a.fsp * 0.7 + cy * 0.4;
          if (a.mt <= 0) { a.mode = 'graze'; a.mt = rand(0.8, 1.6); }
        }
        // keep a little apart; a close brush makes a small bump
        for (const o of live) if (o !== a && o.mode !== 'held') {
          const e = ffGap(a, o);
          if (e < 1 && e > 0.001) { const ex = a.x - o.x, ey = a.y - o.y, m = Math.hypot(ex, ey) || 1; fx += ex / m * (1 - e) * 260; fy += ey / m * (1 - e) * 170; if (e < 0.7 && a.bump <= 0 && a.mode === 'walk') { a.bump = 0.3; a.mode = 'graze'; a.mt = rand(0.5, 1.2); } }
        }
        a.vx = lerp(a.vx, fx, Math.min(1, dt * 5)); a.vy = lerp(a.vy, fy, Math.min(1, dt * 5));
        a.x = clamp(a.x + a.vx * dt, FFP.ax0, FFP.ax1); a.y = clamp(a.y + a.vy * dt, FFP.ay0, FFP.ay1);
        const v = Math.hypot(a.vx, a.vy); a.ph += dt * (6 + v * 0.06);
        if (Math.abs(a.vx) > 8) a.dir = Math.sign(a.vx);
      }
      // next fact once Penny has finished and the animal has gone into the barn
      if (g.ffstate === 'yay' && (g.t2 -= dt) <= 0 && g.tgt.mode === 'gone') {
        g.round++;
        if (g.round >= g.rounds) g.done = true;
        else {
          if (g.spare.length) { const p = ffSpot(g.herd); const a = ffAnimal(g.spare.shift(), FFP.door.x, FFP.door.y, 'enter'); a.tx = p.x; a.ty = p.y; a.alpha = 0; g.herd.push(a); }
          g.herd = g.herd.filter(a => a.mode !== 'gone');
          this.next(g);
        }
      }
      g.progress = `Fact ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      still('b1_ffpen', ffPenPaint);
      const t = S.t, d = FFP.door;
      // mud bubbles, trough ripples, the barn door swinging open when someone comes or goes
      for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8; ctx.strokeStyle = '#6a4228'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(290 + i * 34, 460 + (i % 2) * 6, 3 + k * 4, Math.PI, 0); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(490 + (t * 20) % 80, 230); ctx.lineTo(502 + (t * 20) % 80, 230); ctx.stroke();
      const busy = g.herd.some(a => a.mode === 'leave' || a.mode === 'enter' || (a.mode === 'hop' && a.mt < 0.5));
      g.ffDoor = lerp(g.ffDoor || 0, busy ? 1 : 0, 0.12);
      const dw = 34 * (1 - g.ffDoor);
      for (const s of [-1, 1]) {
        const x0 = d.x + s * 34, x1 = x0 - s * dw * (1 - g.ffDoor * 0.2) - s * g.ffDoor * -14;
        ink(P2(`M${x0},170 L${x1},${170 - g.ffDoor * 6} L${x1},${252 + g.ffDoor * 6} L${x0},252 Z`), '#e8645a', 2);
        if (dw > 10) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - s * 4, 176); ctx.lineTo(x1 + s * 4, 246); ctx.moveTo(x1 + s * 4, 176); ctx.lineTo(x0 - s * 4, 246); ctx.stroke(); }
      }
      // Penny by the fence, telling the fact
      const tk = g.talk > 0 ? Math.abs(Math.sin(t * 11)) : 0;
      ctx.save(); ctx.translate(98, 336); ctx.scale(1 + tk * 0.03, 1 - tk * 0.05); ctx.rotate(Math.sin(t * 5.5) * 0.03 * (g.talk > 0 ? 1 : 0));
      drawCritter('Penny the Pig', 0, 0, 0.82, 1);
      ctx.restore();
      if (g.talk > 0) for (let i = 0; i < 2; i++) { const k = (t * 1.6 + i / 2) % 1; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ff7aa8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(150, 250, 10 + k * 16, -0.7, 0.7); ctx.stroke(); }
      ctx.globalAlpha = 1;
      this.bubble(g);
      // rings under the animal Aubrey can catch right now, and the one the pointer is over
      const hunting = g.ffstate === 'hunt' && !g.hug, hov = hunting ? this.under(g, pointer.x, pointer.y) : null;
      for (const a of g.herd) if (hunting && this.catchable(a) && (a === hov || a === g.aim || this.reach(g, a))) {
        const s = ffSc(a.k);
        ctx.strokeStyle = `rgba(255,${a === hov || a === g.aim ? 240 : 255},${a === hov || a === g.aim ? 90 : 200},${0.7 + Math.sin(t * 6) * 0.25})`; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(a.x, a.y + 2, 100 * s, 20 * s, 0, 0, TAU); ctx.stroke();
      }
      // everyone, back to front (a held animal is drawn just in front of Aubrey)
      const ab = 158 / IMG.idle_front.height;
      const frame = g.hug ? (g.hug.t < 0.2 ? 'crouch' : 'idle_front') : g.ffyay > 0 ? 'twirl' : g.run > 0.3 ? `run${1 + (Math.floor(g.t * 11) % 5)}` : 'idle_front';
      // a soft glowing spot under Aubrey's feet, so the player is always easy to find
      const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
      gl.addColorStop(0, `rgba(255,250,170,${0.8 + Math.sin(t * 4) * 0.15})`); gl.addColorStop(0.55, 'rgba(255,240,140,.45)'); gl.addColorStop(1, 'rgba(255,240,140,0)');
      ctx.save(); ctx.translate(g.ax, g.ay + 4); ctx.scale(1, 0.34); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill(); ctx.restore();
      const aub = () => drawAubrey(g.ax, g.ay + 4, frame, g.adir || 1, 0, ab);
      const all = g.herd.filter(a => a.mode !== 'gone').map(a => ({ y: a.mode === 'held' ? g.ay + 1 : a.y, d: () => ffDrawAnimal(a) }));
      all.push({ y: g.ay, d: aub });
      all.sort((p, q) => p.y - q.y).forEach(o => o.d());
      // if an animal stands in front of her, show her through it as a see-through ghost
      if (g.herd.some(a => a.mode !== 'gone' && a.mode !== 'held' && a.y > g.ay && Math.abs(a.x - g.ax) < 110 * ffSc(a.k) / 0.45 + 20 && a.y - g.ay < 150)) { ctx.save(); ctx.globalAlpha = 0.6; aub(); ctx.restore(); }
      // name tags, hearts and what the animals say
      for (const a of g.herd) {
        if (a.mode === 'gone' || a.mode === 'held') continue;
        ctx.globalAlpha = a.alpha;
        ctx.font = `800 15px ${FONT}`; const tw = ctx.measureText(a.k).width + 16;
        rrect(a.x - tw / 2, a.y + 6, tw, 21, 10, 'rgba(255,253,244,.85)', 'rgba(160,104,58,.6)', 1.5);
        text(a.k, a.x, a.y + 17, 15, '#7a4a2a', 'center', 800);
        ctx.globalAlpha = 1;
        if (a.mode === 'hop') for (let i = 0; i < 3; i++) { const k = ((1.6 - a.mt) * 0.9 + i / 3) % 1; ctx.globalAlpha = 1 - k; const hx = a.x - 34 + i * 34, hy = a.y - 120 * ffSc(a.k) / 0.45 - k * 60; heart(hx, hy - 1.5, 34, OL); heart(hx, hy, 28, '#ff3a64'); }
        ctx.globalAlpha = 1;
        if (a.lineT > 0) {
          ctx.font = `800 19px ${FONT}`; const lw = ctx.measureText(a.line).width + 26, lx = clamp(a.x - lw / 2, FFP.x0 + 4, W - 8 - lw), ly = a.y - 140 * ffSc(a.k) / 0.45 - 30;
          ctx.globalAlpha = Math.min(1, a.lineT * 3);
          rrect(lx, ly, lw, 34, 17, '#fff', OL, 2.5);
          ctx.fillStyle = '#fff'; tri(a.x - 8, ly + 32, a.x + 8, ly + 32, a.x, ly + 44);
          text(a.line, lx + lw / 2, ly + 18, 19, '#c0405a', 'center', 800);
          ctx.globalAlpha = 1;
        }
      }
      // the front fence
      const rail = (y) => { ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(FFP.x0 - 4, y); ctx.lineTo(FFP.x1, y); ctx.stroke(); ctx.strokeStyle = '#d8a868'; ctx.lineWidth = 8; ctx.stroke(); };
      for (let x = FFP.x0; x <= FFP.x1; x += 75) inkRect(x - 6, 508, 12, 36, '#b07840', 2, 3);
      rail(520); rail(536);
      // a hint for small hands
      const hint = g.ffHint > 0 ? 'Get closer to an animal first!' : hunting ? 'Tap the animal to catch it!' : g.ffstate === 'yay' ? 'You caught it!' : '';
      if (hint) { rrect(10, 360, 172, 54, 16, 'rgba(255,253,244,.92)', '#d8b8c8', 2.5); wrap(hint, 150, 17, 800).forEach((l, i, L) => text(l, 96, 387 +(i - (L.length - 1) / 2) * 21, 17, g.ffHint > 0 ? '#c0405a' : '#5a2a6e', 'center', 800)); }
    },
    // Penny's speech bubble, its tail pointing down-left at her
    bubble(g) {
      const x = 186, y = 66, w = 596, h = 116, yay = g.ffstate === 'yay';
      rrect(x, y, w, h, 24, '#fffaf0', OL, 3);
      ctx.fillStyle = '#fffaf0'; tri(x + 2, y + h - 46, x + 2, y + h - 16, x - 34, y + h + 44);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + h - 46); ctx.lineTo(x - 34, y + h + 44); ctx.lineTo(x, y + h - 16); ctx.stroke();
      const body = yay ? g.fact[2] : `“${g.fact[1]}”`, head = yay ? `Yes, the ${g.k}!` : 'Listen to the fact! One animal says:';
      const sz = body.length > 64 ? 21 : 24, lines = wrap(body, w - 44, sz, 800);
      text(head, x + w / 2, y + 22, 17, yay ? '#2a8a4a' : '#a03a66', 'center', 800);
      const top = y + 22 + (h - 22) / 2 + 2;
      lines.forEach((l, i) => text(l, x + w / 2, top + (i - (lines.length - 1) / 2) * (sz + 6), sz, yay ? '#2a8a4a' : '#5a2a6e', 'center', 800));
    },
  };

  restage('farm', {
    bg: 'farm_bg',
    games: [['sheepherd', 'ribbon'], ['farmfacts', 'berry']],
    intro: ["N:Oink! Oh, Aubrey, the gate blew open and the sheep wandered out!", "N:Can you herd them back into the pen? Sheep run AWAY from you, so get behind them!", "A:determined:Here, sheepy sheepy!"],
    mid: ['N:Oink oink! All safe. Now, how well do you know the farm animals?', 'N:I\'ll tell you a fact, and you catch the animal in the pen that it\'s about!', 'A:thinking:I know lots of animal facts!'],
    outro: ['N:Everyone is home! You win the blue ribbon, and some berries from the farm stand.', 'A:laughing:Thank you, Penny!'],
  });
}
