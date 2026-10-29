'use strict';
{
  // ===========================================================================
  // Laundry Day, game 1: Laundry Rush, a three-stage laundry adventure.
  //  1. WASH:   muddy clothes pop out of the hamper; send each into the Whites or the Colours
  //             machine (tap the machine, drag, or use the arrow keys). Then the machines spin
  //             and bubbles pour out: pop them for a bonus.
  //  2. HANG:   peg the clean, wet clothes on the line. Gusts tug pieces loose: tap to save them.
  //             Matching socks side by side clip together, and dry pieces are safe.
  //  3. RESCUE: Biscuit the puppy runs off with a sock (chase him with Aubrey), a bird swoops
  //             for Mom's ribbon (tap to shoo it), then a rain cloud comes (tap the clothes
  //             into the basket before the rain).
  // ===========================================================================
  const POST_L = 70, POST_R = 890, LINE_TOP = 112, BASKET_X = 360, BASKET_Y = 462;
  const HAMPER_X = 480, CUR_Y = 300;
  const MACH = [{ x: 80, y: 250, w: 180, h: 228, white: true, name: 'Whites', body: '#f6f8ff' },
    { x: 700, y: 250, w: 180, h: 228, white: false, name: 'Colours', body: '#ffe0ef' }];
  MACH.forEach(m => { m.cx = m.x + m.w / 2; m.cy = m.y + 128; });
  const PAL = [['#ff8fc2', '#ffffff'], ['#7fd1ff', '#ffffff'], ['#ffd84a', '#ff8a3d'], ['#a8e07a', '#ffffff'],
    ['#c6a2ff', '#ffe066'], ['#ff7a7a', '#fff3c4'], ['#5fd0c0', '#fff6a8'], ['#ffb26b', '#7a4bc8']];
  const WHITE_TRIM = ['#cfe0f5', '#f3d2e2', '#d8ecd0', '#e6dcf5'];
  const PATS = ['stripes', 'dots', 'stars', 'hearts', 'plain'];
  const KINDS = ['shirt', 'dress', 'pants', 'towel', 'skirt'];
  const SHAPES = {
    shirt: 'M -22 0 Q 0 10 22 0 L 44 12 L 36 32 L 26 26 L 26 68 Q 0 74 -26 68 L -26 26 L -36 32 L -44 12 Z',
    dress: 'M -13 0 Q 0 9 13 0 L 18 3 L 16 24 L 40 72 Q 0 82 -40 72 L -16 24 L -18 3 Z',
    pants: 'M -26 0 L 26 0 L 31 74 Q 20 78 9 74 L 2 26 L -2 26 L -9 74 Q -20 78 -31 74 Z',
    towel: 'M -30 0 L 30 0 L 31 68 Q 0 72 -31 68 Z',
    skirt: 'M -22 0 L 22 0 L 38 54 Q 0 64 -38 54 Z',
    sock: 'M -11 0 L 11 0 L 11 36 Q 11 44 18 47 L 26 50 Q 35 55 30 63 Q 25 69 13 66 L -3 61 Q -12 57 -11 45 Z',
  };
  const PEGS = { shirt: [-18, 18], dress: [-15, 15], pants: [-20, 20], towel: [-22, 22], skirt: [-16, 16], sock: [0] };
  const NAMES = { shirt: 'shirt', dress: 'dress', pants: 'trousers', towel: 'towel', skirt: 'skirt', sock: 'sock' };
  const PEG_COLS = ['#ff9cc8', '#ffe066', '#8fd8ff', '#b6e88a'];
  const STAGES = [['🧼', 'Wash'], ['👕', 'Hang'], ['🐶', 'Rescue']];
  const pathCache = {};
  const shapePath = k => pathCache[k] || (pathCache[k] = new Path2D(SHAPES[k]));
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  const whoosh = () => { noise(0.7, 0.05); tone(260, 0.6, 'sawtooth', 0.025, 0, 120); };
  const pegClick = () => { tone(1500, 0.04, 'square', 0.04); tone(1100, 0.05, 'triangle', 0.05, 0.04); };
  const bark = () => { tone(520, 0.09, 'square', 0.05, 0, 360); tone(560, 0.1, 'square', 0.05, 0.16, 380); };
  const splash = () => { noise(0.25, 0.04); tone(300, 0.2, 'sine', 0.06, 0, 700); };
  const ding = () => { tone(1568, 0.5, 'sine', 0.08); tone(2093, 0.6, 'sine', 0.06, 0.12); };
  const tweet = () => { tone(2200, 0.06, 'sine', 0.05, 0, 3000); tone(2400, 0.07, 'sine', 0.05, 0.09, 3200); };

  // --- art -------------------------------------------------------------------------------
  // one piece of washing, hanging from (x, y) = the middle of its top edge
  function drawWash(p, x, y, ang, skew, s, wet, mud = 0) {
    const path = shapePath(p.kind);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.transform(1, 0, skew, 1, 0, 0); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const base = mix(p.col, '#4f5f9a', wet * 0.24), patc = mix(p.col2, '#9aa8d0', wet * 0.22);
    ink(path, base, 2.6 / s, OL);
    ctx.save(); ctx.clip(path);
    ctx.fillStyle = patc;
    if (p.pat === 'stripes') for (let yy = 8; yy < 90; yy += 14) ctx.fillRect(-50, yy, 100, 6);
    else if (p.pat === 'dots') for (let yy = 8; yy < 90; yy += 14) for (let xx = -48 + (yy % 28 ? 7 : 0); xx < 50; xx += 14) circle(xx, yy, 3.4);
    else if (p.pat === 'stars') for (let yy = 12; yy < 90; yy += 18) for (let xx = -44 + (yy % 36 ? 9 : 0); xx < 50; xx += 18) star(xx, yy, 5.5, patc, 5);
    else if (p.pat === 'hearts') for (let yy = 6; yy < 90; yy += 18) for (let xx = -44 + (yy % 36 ? 9 : 0); xx < 50; xx += 18) heart(xx, yy, 11, patc);
    else ctx.fillRect(-50, p.kind === 'sock' ? 0 : 56, 100, 8);
    if (p.kind === 'sock') { ctx.fillStyle = mix(p.col2, p.col, 0.3); ctx.fillRect(-14, 0, 28, 9); }
    if (mud > 0) {
      ctx.globalAlpha = mud;
      for (const b of p.mud) { ctx.fillStyle = '#8a5a34'; ellipse(b[0], b[1], b[2], b[2] * 0.8, b[0]); ctx.fillStyle = '#a7754a'; circle(b[0] - b[2] * 0.25, b[1] - b[2] * 0.2, b[2] * 0.4); }
      ctx.globalAlpha = 1;
    }
    const gr = ctx.createLinearGradient(0, 0, 0, 80);
    gr.addColorStop(0, 'rgba(60,30,90,.18)'); gr.addColorStop(0.25, 'rgba(60,30,90,0)'); gr.addColorStop(1, 'rgba(60,30,90,.12)');
    ctx.fillStyle = gr; ctx.fillRect(-50, -2, 100, 90);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-50, 0, 100, 4);
    ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 2 / s;
    if (p.kind === 'shirt') { ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(0, 13, 10, 4); ctx.stroke(); }
    if (p.kind === 'pants') { ctx.beginPath(); ctx.moveTo(-27, 9); ctx.lineTo(27, 9); ctx.stroke(); }
    if (p.kind === 'towel') { ctx.beginPath(); for (let xx = -26; xx <= 26; xx += 8) { ctx.moveTo(xx, 69); ctx.lineTo(xx, 76); } ctx.stroke(); }
    ctx.restore();
  }
  function drawPeg(x, y, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.roundRect(-4.5, -9, 9, 22, 4);
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-2.5, -6, 2, 14);
    ctx.fillStyle = '#c9b8d6'; ctx.fillRect(-5, -1, 10, 3);
    ctx.restore();
  }
  function drawPost(x) {
    inkRect(x - 9, LINE_TOP - 18, 18, GY + 18 - LINE_TOP, '#c98d55', 2.5, 5);
    inkRect(x - 26, LINE_TOP - 22, 52, 14, '#b07a46', 2.5, 5);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - 5, LINE_TOP - 6, 4, GY - LINE_TOP);
    ctx.fillStyle = 'rgba(90,50,30,.3)'; ellipse(x, GY + 16, 22, 6);
  }
  function drawBow(x, y, s = 1, col = '#ff5fa8') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const loopL = new Path2D('M 0 0 C -10 -16 -28 -14 -26 0 C -28 14 -10 16 0 0 Z');
    const loopR = new Path2D('M 0 0 C 10 -16 28 -14 26 0 C 28 14 10 16 0 0 Z');
    const tails = new Path2D('M -3 2 L -14 28 L -7 25 L -3 30 Z M 3 2 L 14 28 L 7 25 L 3 30 Z');
    for (const p of [tails, loopL, loopR]) { ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(p); }
    for (const p of [tails, loopL, loopR]) { ctx.fillStyle = col; ctx.fill(p); }
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-15, -4, 6, 3, -0.4); ellipse(15, -4, 6, 3, 0.4);
    inkCircle(0, 0, 6, mix(col, '#ffffff', 0.25), 2, OL);
    ctx.restore();
  }
  function drawBasket(x, y, contents = []) {
    inkEllipse(x, y - 52, 128, 26, 0, '#9a6738', 2.5, OL);
    ctx.fillStyle = '#7b4f2a'; ellipse(x, y - 50, 118, 20);
    contents.forEach((p, i) => drawWash(p, x - 70 + (i % 5) * 35, y - 92 + Math.floor(i / 5) * 8, (i % 3 - 1) * 0.25, 0, 0.75, 0));
    const p = new Path2D(`M ${x - 128} ${y - 52} Q ${x - 120} ${y + 18} ${x - 90} ${y + 22} L ${x + 90} ${y + 22} Q ${x + 120} ${y + 18} ${x + 128} ${y - 52} Q ${x} ${y - 22} ${x - 128} ${y - 52} Z`);
    ctx.fillStyle = 'rgba(60,30,40,.22)'; ellipse(x, y + 22, 120, 10);
    ink(p, '#d39a5a', 2.6, OL);
    ctx.save(); ctx.clip(p);
    ctx.strokeStyle = 'rgba(120,70,30,.5)'; ctx.lineWidth = 3;
    for (let r = 0; r < 5; r++) {
      const yy = y - 36 + r * 13;
      for (let xx = x - 130 + (r % 2) * 13; xx < x + 130; xx += 26) { ctx.beginPath(); ctx.ellipse(xx, yy, 11, 5, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
    ctx.lineWidth = 9; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(x - 128, y - 52); ctx.quadraticCurveTo(x, y - 22, x + 128, y - 52); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#e8b878'; ctx.stroke();
  }
  function drawHamper(x, gy, bounce) {
    const top = gy - 92 - bounce;
    ctx.fillStyle = 'rgba(60,30,40,.22)'; ellipse(x, gy + 4, 78, 10);
    const body = new Path2D(`M ${x - 70} ${top} L ${x + 70} ${top} L ${x + 60} ${gy} Q ${x} ${gy + 8} ${x - 60} ${gy} Z`);
    ink(body, '#e9cf9e', 2.6, OL);
    ctx.save(); ctx.clip(body); ctx.strokeStyle = 'rgba(150,100,50,.45)'; ctx.lineWidth = 3;
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * 12, top); ctx.lineTo(x + i * 10.5, gy + 6); ctx.stroke(); }
    for (let yy = top + 14; yy < gy; yy += 16) { ctx.beginPath(); ctx.moveTo(x - 80, yy); ctx.lineTo(x + 80, yy); ctx.stroke(); }
    ctx.restore();
    inkRect(x - 76, top - 10, 152, 16, '#d4b07a', 2.5, 8);
    // a muddy sleeve and sock hanging over the rim
    ctx.fillStyle = '#ffb3c1'; ctx.strokeStyle = OL; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x + 34, top - 6, 18, 40, 8); ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#8a5a34'; circle(x + 43, top + 26, 5);
  }
  function drawMachine(m, g, i) {
    const spin = g.spinT > 0, jig = spin ? Math.sin(S.t * 45 + i) * 1.8 : 0, sh = (g.shake[i] || 0) > 0 ? Math.sin(S.t * 60) * 5 : 0;
    const x = m.x + jig + sh, y = m.y, hot = g.stage === 0 && g.sub === 'sort' && (g.held ? inRect(m) : inRect(m) && !g.flyer);
    ctx.save();
    if (hot) { ctx.shadowColor = '#fff6a8'; ctx.shadowBlur = 24; }
    inkRect(x, y, m.w, m.h, m.body, 3, 18);
    ctx.restore();
    inkRect(x, y, m.w, m.h, m.body, 3, 18);
    inkRect(x + 8, y + 8, m.w - 16, 34, m.white ? '#dfe6f5' : '#ffc4df', 2, 10);
    inkCircle(x + 30, y + 25, 9, '#ffd84a', 1.5, OL);
    inkCircle(x + 56, y + 25, 9, '#8fd8ff', 1.5, OL);
    ctx.fillStyle = spin ? (Math.sin(S.t * 8) > 0 ? '#7cff9a' : '#3fbf60') : '#b9e8c4'; circle(x + m.w - 26, y + 25, 6);
    // label sign on top
    const ly = y - 34;
    rrect(x + 16, ly, m.w - 32, 34, 12, m.white ? '#ffffff' : '#ff6fb5', OL, 3);
    if (!m.white) { ['#ff7a7a', '#ffd84a', '#a8e07a', '#7fd1ff'].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(x + 24 + k * 8, ly + 6, 6, 22); }); }
    text(m.name, x + m.w / 2 + (m.white ? 0 : 12), ly + 17, 20, m.white ? '#5a2a6e' : '#fff', 'center', 800);
    // porthole
    const cx = m.cx + jig + sh, cy = m.cy;
    inkCircle(cx, cy, 64, '#cfd6e6', 2.5, OL);
    ctx.fillStyle = '#e9edf6'; circle(cx, cy, 56);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 48, 0, Math.PI * 2); ctx.clip();
    const gl = ctx.createLinearGradient(0, cy - 48, 0, cy + 48);
    gl.addColorStop(0, '#d9f2ff'); gl.addColorStop(1, '#8fcdf2'); ctx.fillStyle = gl; ctx.fillRect(cx - 50, cy - 50, 100, 100);
    const lvl = spin ? 6 : 30;
    ctx.fillStyle = 'rgba(90,170,230,.55)';
    ctx.beginPath(); ctx.moveTo(cx - 50, cy + 50);
    for (let k = -50; k <= 50; k += 5) ctx.lineTo(cx + k, cy + lvl + Math.sin(k / 8 + S.t * (spin ? 12 : 3)) * (spin ? 6 : 2));
    ctx.lineTo(cx + 50, cy + 50); ctx.fill();
    const loads = g.loads[i], rot = S.t * (spin ? 9 : 0.4);
    loads.forEach((c, k) => {
      const a = rot + k * (Math.PI * 2 / Math.max(3, loads.length)), r = spin ? 26 : 30;
      ctx.fillStyle = c; ctx.strokeStyle = OL; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * r * (spin ? 1 : 0.6), cy + (spin ? Math.sin(a) * r : 34 - k * 3), 14, 9, a, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    if (spin) for (let k = 0; k < 8; k++) { const a = -rot * 0.7 + k; ctx.fillStyle = 'rgba(255,255,255,.85)'; circle(cx + Math.cos(a) * 36, cy + Math.sin(a) * 36, 5 + (k % 3) * 2); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, 40, -2.6, -1.7); ctx.stroke();
    inkRect(cx + 54, cy - 12, 10, 24, '#b7bfd2', 1.5, 4);
    // feet
    inkRect(x + 16, y + m.h - 4, 22, 10, '#9a90a8', 1.5, 3); inkRect(x + m.w - 38, y + m.h - 4, 22, 10, '#9a90a8', 1.5, 3);
  }
  function drawBubble(b) {
    const r = b.r * (b.pop > 0 ? 1 + (0.2 - b.pop) * 3 : 1);
    ctx.globalAlpha = b.pop > 0 ? b.pop / 0.2 : 1;
    ctx.fillStyle = b.gold ? 'rgba(255,240,170,.35)' : 'rgba(225,245,255,.28)'; circle(b.x, b.y, r);
    const gr = ctx.createLinearGradient(b.x - r, b.y - r, b.x + r, b.y + r);
    if (b.gold) { ['#ff9cc8', '#ffe066', '#8fd8ff', '#b6e88a'].forEach((c, k) => gr.addColorStop(k / 3, c)); } else { gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#b8e0ff'); }
    ctx.strokeStyle = gr; ctx.lineWidth = b.gold ? 4 : 3; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(b.x - r * 0.38, b.y - r * 0.4, r * 0.25, r * 0.14, -0.7);
    if (b.gold) star(b.x, b.y, r * 0.35, '#fff6a8', 4);
    ctx.globalAlpha = 1;
  }
  // Biscuit the puppy, drawn facing right (dir 1), origin at his feet
  function drawBiscuit(x, gy, dir, run, sit, carry) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(dir, 1);
    ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(0, 0, 44, 8);
    const ph = S.t * 18, tail = Math.sin(S.t * (sit ? 14 : 22)) * 0.6;
    const fur = '#e8b26a', dark = '#9a5a2e', light = '#fbe3bb';
    const bob = run ? Math.abs(Math.sin(ph)) * 5 : 0;
    ctx.translate(0, -bob);
    if (sit) { ctx.translate(-6, 0); ctx.rotate(-0.32); }
    const legs = [[-24, 1], [-12, -1], [14, 1], [26, -1]].map(([lx, s]) => {
      const sw = run ? Math.sin(ph) * 9 * s : 0;
      const p = new Path2D(); p.roundRect(lx - 5 + sw * 0.4, -32, 11, 32 + (sit && lx < 0 ? -10 : 0), 5); return p;
    });
    const body = new Path2D(); body.ellipse(0, -40, 38, 21, 0, 0, Math.PI * 2);
    const head = new Path2D(); head.arc(36, -66, 21, 0, Math.PI * 2);
    const snout = new Path2D(); snout.ellipse(53, -58, 13, 9, 0.1, 0, Math.PI * 2);
    const tailP = new Path2D(); tailP.moveTo(-34, -48); tailP.quadraticCurveTo(-50, -60 - tail * 10, -48 + tail * 8, -78);
    // outline everything first, then fill, so he reads as one fluffy shape
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = OL;
    ctx.lineWidth = 13; ctx.stroke(tailP);
    ctx.lineWidth = 5; for (const p of [...legs, body, head, snout]) ctx.stroke(p);
    ctx.strokeStyle = fur; ctx.lineWidth = 7; ctx.stroke(tailP);
    ctx.fillStyle = mix(fur, dark, 0.25); for (const p of legs) ctx.fill(p);
    ctx.fillStyle = fur; ctx.fill(body); ctx.fill(head);
    ctx.fillStyle = light; ellipse(4, -32, 24, 10); ctx.fill(snout);
    ctx.fillStyle = dark; ellipse(-10, -50, 12, 8, 0.3);
    // ear flaps as he runs
    ctx.save(); ctx.translate(26, -78); ctx.rotate(0.5 + (run ? Math.sin(ph) * 0.35 : 0.1));
    ink(new Path2D('M 0 0 C -6 10 -8 26 -2 32 C 6 30 10 14 6 0 Z'), dark, 2.2, OL);
    ctx.restore();
    // collar and tag
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(36, -66, 22, 1.3, 2.6); ctx.stroke();
    ctx.strokeStyle = '#ff4f7a'; ctx.lineWidth = 5; ctx.stroke();
    inkCircle(28, -44, 5, '#ffd84a', 1.5, OL);
    // face
    inkCircle(65, -60, 5, '#3d2c4a', 1, OL);
    ctx.fillStyle = '#3d2c4a'; circle(42, -72, 4); ctx.fillStyle = '#fff'; circle(43.5, -73.5, 1.5);
    if (!carry) { ctx.fillStyle = '#ff7aa0'; ellipse(54, -48, 5, 7); }
    if (carry) drawWash(carry, 60, -58, 1.2, 0, 0.55, 0);
    ctx.restore();
  }
  function drawBird(x, y, dir, flap, carry) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    const body = new Path2D(); body.ellipse(0, 0, 22, 15, -0.1, 0, Math.PI * 2);
    const head = new Path2D(); head.arc(18, -10, 12, 0, Math.PI * 2);
    const tail = new Path2D('M -18 -2 L -36 -10 L -34 6 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round'; for (const p of [tail, body, head]) ctx.stroke(p);
    ctx.fillStyle = '#5aa8f0'; ctx.fill(tail); ctx.fill(body); ctx.fill(head);
    ctx.fillStyle = '#ffd9b0'; ellipse(4, 6, 13, 7);
    inkAt(30, -9, 0, new Path2D('M -2 -4 L 10 0 L -2 4 Z'), '#ffb347', 1.5);
    ctx.fillStyle = '#3d2c4a'; circle(21, -13, 2.6);
    inkAt(-2, -6, Math.sin(flap) * 0.8 - 0.4, new Path2D('M 0 0 C -6 -24 -26 -26 -24 -12 C -18 -4 -8 0 0 0 Z'), '#3f88d8', 2);
    if (carry) drawBow(26, 10, 0.55);
    ctx.restore();
  }
  function drawCloud(x, y, dark) {
    const puffs = [[-70, 6, 34], [-30, -14, 44], [20, -20, 50], [66, -2, 38], [100, 10, 28], [0, 16, 40]];
    ctx.strokeStyle = OL; ctx.lineWidth = 6;
    for (const [px, py, r] of puffs) { ctx.beginPath(); ctx.arc(x + px, y + py, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = mix('#c9d1e6', '#7a84a6', dark);
    for (const [px, py, r] of puffs) circle(x + px, y + py, r);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(x - 20, y - 30, 30, 10);
    ctx.fillStyle = '#3d2c4a'; circle(x - 14, y + 4, 4); circle(x + 18, y + 4, 4);
    ctx.strokeStyle = '#3d2c4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 2, y + 22, 9, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  }

  // --- the game -------------------------------------------------------------------------
  MG.laundryrush = {
    kind: 'action', title: () => 'Laundry Rush', icon: () => '🧺',
    how: () => 'Wash, hang and rescue the laundry! Tap the right machine for each muddy piece, pop bubbles, peg clothes on the line, chase Biscuit, and beat the rain!',
    init(g) {
      const tier = g.tier;
      const n2 = [5, 6, 7][tier - 1], n1 = [7, 8, 10][tier - 1], pairs = [1, 1, 2][tier - 1];
      const cols = shuffle(PAL.slice());
      const mk = (kind, white, pair = -1, c = null, pat = null) => {
        const [col, col2] = white ? ['#fbfbff', pick(WHITE_TRIM)] : c || pick(PAL);
        return { kind, white, col, col2, pat: pat || pick(PATS), pair, mud: Array.from({ length: 4 }, () => [rand(-20, 20), rand(12, 58), rand(6, 11)]) };
      };
      const hang = [];
      for (let i = 0; i < pairs; i++) {
        const white = i === 0 ? Math.random() < 0.5 : false, c = cols[i], pat = PATS[i % 4];
        hang.push(mk('sock', white, i, c, pat));
        const twin = { ...hang[hang.length - 1], mud: hang[hang.length - 1].mud.map(b => [-b[0], b[1], b[2]]) };
        hang.push(twin);
      }
      const kinds = shuffle(KINDS.slice());
      while (hang.length < n2) hang.push(mk(kinds[hang.length % kinds.length], hang.filter(p => p.white).length < 2 && Math.random() < 0.5));
      const extra = [];
      while (hang.length + extra.length < n1) extra.push(mk(pick(KINDS), Math.random() < 0.45));
      // make sure both machines get used
      const all = [...hang, ...extra];
      if (!all.some(p => p.white)) Object.assign(extra[0] || hang[hang.length - 1], { white: true, col: '#fbfbff', col2: pick(WHITE_TRIM) });
      if (all.every(p => p.white)) Object.assign(extra[0] || hang[hang.length - 1], { white: false, col: PAL[0][0], col2: PAL[0][1] });
      let order;
      for (let tries = 0; tries < 30; tries++) {
        order = shuffle(hang.slice());
        if (!order.some((p, i) => i && p.pair >= 0 && order[i - 1].pair === p.pair)) break;
      }
      g.hangList = order.map((p, i) => ({ ...p, st: 'basket', order: i, slot: -1, x: 0, y: 0, ang: 0, wet: 1, paired: false, tugT: 0, back: 0, dropT: 0 }));
      g.washQ = shuffle([...hang, ...extra]).map(p => ({ ...p }));
      g.n1 = g.washQ.length; g.n2 = n2;
      g.slots = Array.from({ length: n2 }, (_, i) => ({ x: 150 + i * 660 / (n2 - 1), piece: null }));
      g.scale = [1.12, 1, 0.92][tier - 1];
      Object.assign(g, {
        stage: 0, sub: 'sort', banner: 0, bannerText: '', cur: null, curPop: 0, flyer: null, held: null, armed: false, moved: 0,
        sorted: 0, wrong: 0, loads: [[], []], shake: [0, 0], spinT: 0, bubbles: [], bubT: 0, pops: 0, popGoal: [10, 12, 14][tier - 1],
        wind: 0, gustT: 0, gustIn: 2.2, warned: false, warnFlash: 0, everTug: false,
        tugTime: [2.0, 1.6, 1.3][tier - 1], gustEvery: [3.0, 2.6, 2.2][tier - 1], dryTime: [3.5, 4, 4.5][tier - 1],
        streaks: [], leaves: [], drops: [], lost: 0, saves: 0, pairsMade: 0, cheer: 0, stageT: 0,
        aub: { x: 150, y: GY + 16, tx: 150, ty: GY + 16, face: 1, dist: 0 },
        dog: null, dogDone: false, dogWon: false, bird: null, birdDone: false, birdWon: false, cloud: null, rainDone: false, rainSaved: 0, flyIn: [],
        endT: 0, sparkles: [],
      });
      this.nextPiece(g);
      g.say = 'Is it white, or colourful? Tap the right washing machine!';
    },
    start(g) { this.showBanner(g, 'Wash!', 'Whites or colours? Tap the right machine!'); },
    showBanner(g, title, sub) { g.banner = 1.8; g.bannerText = title; g.bannerSub = sub; g.say = sub; speak(`${title} ${sub}`); },
    nextPiece(g) { g.cur = g.washQ.shift() || null; g.curPop = 0; if (g.cur) SFX.jump(); },
    stageScore(g) {
      const s1 = 0.65 * clamp(1 - g.wrong / g.n1, 0, 1) * (g.sorted / g.n1) + 0.35 * Math.min(1, g.pops / g.popGoal);
      const s2 = g.stage >= 1 ? g.hangList.filter(p => p.st === 'hung' || p.st === 'tug' || p.st === 'back').length / g.n2 : 0;
      const s3 = ((g.dogWon ? 1 : 0) + (g.birdWon ? 1 : 0) + g.rainSaved / g.n2) / 3;
      return { s1, s2: g.stage >= 2 ? (g.n2 - g.lost) / g.n2 : s2, s3 };
    },

    // ---------------- stage 1: wash ----------------
    send(g, mi) {
      const p = g.cur, m = MACH[mi];
      g.cur = null; g.held = null;
      g.flyer = { p, mi, t: 0, fx: p.hx ?? HAMPER_X, fy: p.hy ?? CUR_Y, ok: p.white === m.white };
      SFX.jump();
    },
    updateWash(g, dt, id) {
      g.shake = g.shake.map(s => Math.max(0, s - dt));
      if (g.sub === 'sort') {
        if (g.cur) g.curPop = Math.min(1, g.curPop + dt * 4);
        const fl = g.flyer;
        if (fl) {
          fl.t += dt * 2.6;
          const m = MACH[fl.mi];
          if (fl.ok || fl.t < 0.6) {
            const k = Math.min(1, fl.t);
            fl.x = lerp(fl.fx, m.cx, k); fl.y = lerp(fl.fy - 30, m.cy - 30, k) - Math.sin(k * Math.PI) * 90;
          } else {
            const k = clamp((fl.t - 0.6) / 0.6, 0, 1);
            fl.x = lerp(lerp(fl.fx, m.cx, 0.6), fl.fx, k); fl.y = lerp(fl.fy - 90, fl.fy - 30, k) - Math.sin(k * Math.PI) * 50;
          }
          if (fl.ok && fl.t >= 1) {
            g.loads[fl.mi].push(fl.p.col === '#fbfbff' ? '#ffffff' : fl.p.col); g.sorted++; g.flyer = null;
            splash(); SFX.hit(); burst(m.cx, m.cy, 14, { colors: ['#ffffff', '#b8e6ff', '#dff4ff'] });
            floatText(m.cx, m.y - 50, pick(['Splash!', 'In it goes!', 'Yes!', 'Sploosh!']), '#fff6a8', false, 24);
            if (!g.cur) this.nextPiece(g);
          } else if (!fl.ok && fl.t >= 0.6 && !fl.bounced) {
            fl.bounced = true; g.wrong++; g.shake[fl.mi] = 0.4; SFX.miss();
            floatText(m.cx, m.y - 50, 'Oops!', '#ffd0e4', false, 26);
            speak(fl.p.white ? 'Oops! That one is white.' : 'Oops! That one is colourful.');
          } else if (!fl.ok && fl.t >= 1.2) {
            g.cur = fl.p; g.curPop = 1; g.flyer = null;
          }
        }
        if (g.cur && !g.flyer) {
          const p = g.cur;
          if (g.held) {
            if (pointer.down && !g.armed) g.moved += Math.hypot(pointer.x - p.hx, pointer.y - p.hy);
            p.hx = pointer.x; p.hy = pointer.y;
            const over = MACH.findIndex(m => inRect(m));
            if (!g.armed && !pointer.down) { if (over >= 0) this.send(g, over); else if (g.moved > 24) { g.held = null; p.hx = HAMPER_X; p.hy = CUR_Y; } else g.armed = true; }
            else if (g.armed && pointer.clicked) { if (over >= 0) this.send(g, over); else { g.held = null; p.hx = HAMPER_X; p.hy = CUR_Y; } }
          } else {
            p.hx = HAMPER_X; p.hy = CUR_Y;
            if (pressed.arrowleft || pressed.a || pressed['1']) this.send(g, 0);
            else if (pressed.arrowright || pressed.d || pressed['2']) this.send(g, 1);
            else if (pointer.clicked) {
              const mi = MACH.findIndex(m => inRect(m));
              if (mi >= 0) this.send(g, mi);
              else if (dist(pointer.x, pointer.y, HAMPER_X, CUR_Y + 34) < 64) { g.held = true; g.moved = 0; g.armed = false; SFX.click(); }
            }
          }
        }
        if (!g.cur && !g.flyer && g.sorted >= g.n1) {
          g.sub = 'spin'; g.spinT = [8, 7.5, 7][g.tier - 1];
          g.say = 'Pop the bubbles!'; speak('Now the machines are spinning. Pop the bubbles!');
          tone(200, 1.2, 'sawtooth', 0.02, 0, 400);
        }
      } else if (g.sub === 'spin') {
        g.spinT -= dt;
        if (Math.random() < 0.15) noise(0.05, 0.012);
        g.bubT -= dt;
        if (g.bubT <= 0 && g.spinT > 0.8) {
          g.bubT = rand(0.18, 0.32);
          const m = pick(MACH), fromTop = Math.random() < 0.4;
          g.bubbles.push({ x: fromTop ? rand(m.x + 20, m.x + m.w - 20) : m.cx + rand(-40, 40), y: fromTop ? m.y - 40 : m.cy - 40, r: rand(20, 34), vx: (m.white ? 1 : -1) * rand(20, 70), vy: -rand(45, 85), ph: rand(0, 6), gold: Math.random() < 0.16, pop: 0 });
        }
        if (pointer.clicked) {
          let best = null, bd = 1e9;
          for (const b of g.bubbles) if (!b.pop) { const d = dist(pointer.x, pointer.y, b.x, b.y); if (d < b.r + 14 && d < bd) { bd = d; best = b; } }
          if (best) {
            best.pop = 0.2; g.pops += best.gold ? 3 : 1; SFX.pop(); if (best.gold) SFX.sparkle();
            burst(best.x, best.y, best.gold ? 14 : 6, { colors: best.gold ? ['#ffe066', '#ff9cc8', '#8fd8ff'] : ['#ffffff', '#dff4ff'] });
            if (best.gold) floatText(best.x, best.y - 20, '+3', '#ffe066', false, 22);
          }
        }
        if (g.spinT <= 0 && g.bubbles.every(b => b.y < 70 || b.pop)) {
          ding(); SFX.sparkle();
          for (const m of MACH) burst(m.cx, m.cy, 24, { colors: ['#fff6a8', '#ffffff', '#ffb3e0'] });
          this.toHang(g);
        }
      }
      for (const b of g.bubbles) {
        if (b.pop) { b.pop -= dt; continue; }
        b.ph += dt * 3; b.x += (b.vx * 0.4 + Math.sin(b.ph) * 30) * dt; b.y += b.vy * dt;
        if (b.y < 70) b.pop = 0.2;
      }
      g.bubbles = g.bubbles.filter(b => !(b.pop < 0));
    },
    toHang(g) {
      g.stage = 1; g.sub = 'hang'; g.stageT = 0; g.bubbles = [];
      this.showBanner(g, 'Squeaky clean! ✨', 'Now drag the wet clothes up to the line. Tap any piece the wind tugs!');
    },

    // ---------------- stage 2: hang ----------------
    lineY(g, x) {
      const hung = g.slots.filter(s => s.piece).length;
      const u = (x - (POST_L + POST_R) / 2) / ((POST_R - POST_L) / 2);
      return LINE_TOP + (26 + hung * 3) * (1 - u * u) + Math.sin(S.t * 2.2 + x / 90) * (1.5 + g.wind * 5) * (1 - u * u);
    },
    basketShown(g) { return g.hangList.filter(p => p.st === 'basket').sort((a, b) => a.order - b.order).slice(0, 3); },
    basketSpot(g, i) { return { x: BASKET_X - 76 + i * 76, y: BASKET_Y - 128 + (i === 1 ? -10 : 0) }; },
    centre(g, p) { return { x: p.x - Math.sin(p.ang) * 34 * g.scale, y: p.y + Math.cos(p.ang) * 34 * g.scale }; },
    nearestFree(g, x) {
      let best = null, bd = 1e9;
      for (const s of g.slots) if (!s.piece && Math.abs(s.x - x) < bd) { bd = Math.abs(s.x - x); best = s; }
      return best;
    },
    pairMate(g, p, slot) {
      if (p.kind !== 'sock') return null;
      const i = g.slots.indexOf(slot);
      for (const j of [i - 1, i + 1]) {
        const q = g.slots[j]?.piece;
        if (q && q !== p && q.pair === p.pair && !q.paired && q.st === 'hung') return q;
      }
      return null;
    },
    makePair(g, p, slot) {
      const mate = this.pairMate(g, p, slot);
      if (!mate) return;
      p.paired = mate.paired = true; g.pairsMade++;
      SFX.sparkle(); burst((slot.x + mate.x) / 2, p.y + 20, 16, { colors: ['#ffb3e0', '#fff6a8', '#ffffff'] });
      floatText((slot.x + mate.x) / 2, p.y - 18, 'A pair! 💞', '#ff6fb5', false, 24);
      speak('A matching pair! The wind can\'t take those.');
    },
    hang(g, p, slot) {
      p.st = 'hung'; p.slot = g.slots.indexOf(slot); slot.piece = p; p.dropT = 0.35;
      p.x = slot.x; p.y = this.lineY(g, slot.x);
      pegClick(); SFX.pop();
      for (let i = 0; i < 8; i++) g.drops.push({ x: slot.x + rand(-26, 26), y: p.y + rand(20, 60), vx: rand(-40, 40), vy: rand(-80, 10), life: 0.8 });
      this.makePair(g, p, slot);
    },
    gust(g) {
      g.gustT = 1.4; g.warned = false; g.gustIn = g.gustEvery * rand(0.85, 1.15);
      const cand = shuffle(g.hangList.filter(p => p.st === 'hung' && !p.paired && p.wet > 0 && p.dropT <= 0));
      const k = g.tier === 1 ? 1 : g.tier === 2 ? (Math.random() < 0.35 ? 2 : 1) : 2;
      for (const p of cand.slice(0, k)) { p.st = 'tug'; p.tugT = g.tugTime; p.tug0 = g.tugTime; }
      if (cand.length && !g.everTug) { g.everTug = true; speak('Tap it before it blows away!'); }
    },
    updateHang(g, dt) {
      const anyHung = g.hangList.some(p => p.st !== 'basket' && p.st !== 'held');
      if (anyHung) {
        g.gustIn -= dt;
        if (g.gustIn <= 1.2 && !g.warned) { g.warned = true; g.warnFlash = 1.2; whoosh(); }
        if (g.gustIn <= 0) { this.gust(g); whoosh(); }
      }
      for (const p of g.hangList) {
        p.dropT = Math.max(0, p.dropT - dt);
        const slot = g.slots[p.slot];
        if (p.st === 'hung' || p.st === 'tug') {
          p.x = slot.x; p.y = this.lineY(g, slot.x);
          const was = p.wet;
          p.wet = Math.max(0, p.wet - dt / g.dryTime * (p.st === 'hung' ? 1 : 0.5));
          if (was > 0 && p.wet <= 0) { tone(1320, 0.12, 'sine', 0.05); burst(p.x, p.y + 34, 8, { colors: ['#fff6a8', '#ffffff'] }); floatText(p.x, p.y + 10, 'Dry!', '#fff', false, 18); }
          if (p.wet > 0.1 && Math.random() < dt * 3 * p.wet) g.drops.push({ x: p.x + rand(-18, 18), y: p.y + 66 * g.scale, vx: 0, vy: 20, life: 0.6 });
          if (p.st === 'hung') p.ang = Math.sin(S.t * 2 + p.slot) * 0.04 * (1 + g.wind * 2) - g.wind * 0.22 + (p.dropT > 0 ? Math.sin(p.dropT * 30) * p.dropT * 0.5 : 0);
          else {
            p.tugT -= dt;
            p.ang = -0.45 + Math.sin(S.t * 22 + p.slot) * 0.28;
            if (p.tugT <= 0) { p.st = 'fly'; slot.piece = null; p.slot = -1; p.vx = rand(105, 135) + g.tier * 25; p.vy = -rand(25, 55); p.spin = rand(1.5, 3); SFX.jump(); }
          }
        } else if (p.st === 'fly') {
          p.x += p.vx * dt; p.y += (p.vy + Math.sin(S.t * 3 + p.order) * 45) * dt; p.ang += p.spin * dt * Math.sin(S.t * 2 + p.order);
          if (p.x > W + 70 || p.y < -90) { p.st = 'lost'; g.lost++; SFX.fail(); floatText(W - 130, 160, `Bye-bye, ${NAMES[p.kind]}!`, '#ffd0e4', false, 22); }
        } else if (p.st === 'back') {
          const tgt = g.slots[p.slot];
          p.back = Math.min(1, p.back + dt * 2.2);
          const k = 1 - Math.pow(1 - p.back, 3);
          p.x = lerp(p.fx, tgt.x, k); p.y = lerp(p.fy, this.lineY(g, tgt.x), k) - Math.sin(k * Math.PI) * 50; p.ang = lerp(p.fa, 0, k);
          if (p.back >= 1) { p.st = 'hung'; p.dropT = 0.35; pegClick(); this.makePair(g, p, tgt); }
        }
      }
      // input: rescues first, then dragging from the basket
      const held = g.held;
      if (held) {
        if (pointer.down && !g.armed) g.moved += Math.hypot(pointer.x - held.x, pointer.y - held.y);
        held.x = pointer.x; held.y = pointer.y - 30;
        const drop = () => {
          g.held = null;
          const slot = pointer.y < 340 && this.nearestFree(g, pointer.x);
          if (slot) this.hang(g, held, slot);
          else { held.st = 'basket'; held.order = Math.min(...g.hangList.map(q => q.order)) - 1; SFX.blip(); }
        };
        if (!g.armed && !pointer.down) { if (g.moved > 24) drop(); else g.armed = true; }
        else if (g.armed && pointer.clicked) drop();
      } else if (pointer.clicked) {
        let best = null, bd = 1e9;
        for (const p of g.hangList) if (p.st === 'tug' || p.st === 'fly') {
          const c = this.centre(g, p), d = dist(pointer.x, pointer.y, c.x, c.y);
          if (d < (p.st === 'fly' ? 80 : 66) && d < bd) { bd = d; best = p; }
        }
        if (best) {
          g.saves++; g.cheer = 0.6; SFX.hit();
          const c = this.centre(g, best);
          burst(c.x, c.y, 14);
          if (best.st === 'tug') { best.st = 'hung'; best.dropT = 0.35; pegClick(); floatText(c.x, c.y - 40, 'Phew!', '#fff6a8', false, 24); }
          else {
            const slot = this.nearestFree(g, Math.min(best.x, 810));
            Object.assign(best, { st: 'back', back: 0, fx: best.x, fy: best.y, fa: best.ang % (Math.PI * 2), slot: g.slots.indexOf(slot) });
            slot.piece = best;
            floatText(c.x, c.y - 40, 'Caught it!', '#fff6a8', false, 24);
          }
        } else {
          const shown = this.basketShown(g);
          for (let i = shown.length - 1; i >= 0; i--) {
            const s = this.basketSpot(g, i);
            if (Math.abs(pointer.x - s.x) < 40 && pointer.y > s.y - 20 && pointer.y < s.y + 90) {
              const p = shown[i]; p.st = 'held'; g.held = p; g.moved = 0; g.armed = false; p.x = pointer.x; p.y = pointer.y - 30; p.ang = 0; SFX.click(); break;
            }
          }
        }
      }
      const busy = g.hangList.some(p => ['basket', 'held', 'tug', 'fly', 'back'].includes(p.st) || (p.st === 'hung' && p.wet > 0));
      if (!busy) {
        g.stage = 2; g.sub = 'dog'; g.stageT = 0; g.gustT = 0; g.warned = false; SFX.sparkle();
        this.showBanner(g, 'Uh-oh... Biscuit!', 'The puppy took a sock! Chase him: tap where Aubrey should run.');
        const sock = { kind: 'sock', col: '#ff8fc2', col2: '#ffffff', pat: 'stars', pair: -9 };
        g.dog = { x: W + 70, gy: GY + 30, dir: -1, wx: 620, wy: GY + 30, t: 0, pause: 0, playIn: 2.5, sock, mode: 'run', barkIn: 1 };
      }
    },

    // ---------------- stage 3: rescue ----------------
    updateRescue(g, dt) {
      const a = g.aub, tier = g.tier;
      // steering: arrow keys, or hold / tap the ground where Aubrey should run
      let kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (kx || ky) { a.tx = a.x + kx * 60; a.ty = a.y + ky * 40; }
      let consumed = false;
      // shoo the bird
      const b = g.bird;
      if (b && b.mode === 'swoop' && pointer.clicked && dist(pointer.x, pointer.y, b.x, b.y) < 70) {
        b.mode = 'shoo'; g.birdWon = true; g.birdDone = true; consumed = true; tweet(); SFX.hit(); burst(b.x, b.y, 12, { colors: ['#8fd8ff', '#ffffff'] });
        floatText(b.x, b.y - 30, 'Shoo, birdie!', '#fff6a8', false, 24);
      }
      // tap clothes into the basket before the rain
      const c = g.cloud;
      if (!consumed && c && c.mode === 'warn' && pointer.clicked) {
        let best = null, bd = 1e9;
        for (const p of g.hangList) if (p.st === 'hung') { const q = this.centre(g, p), d = dist(pointer.x, pointer.y, q.x, q.y); if (d < 60 && d < bd) { bd = d; best = p; } }
        if (best) {
          consumed = true; g.slots[best.slot].piece = null; best.st = 'toBasket'; best.fx = best.x; best.fy = best.y; best.back = 0;
          SFX.pop(); pegClick(); burst(best.x, best.y + 30, 8);
        }
      }
      if (!consumed && (pointer.clicked || pointer.down) && pointer.y > 300) { a.tx = clamp(pointer.x, 40, W - 40); a.ty = clamp(pointer.y + 30, GY - 10, GY + 50); }
      a.ty = clamp(a.ty, GY - 10, GY + 50); a.tx = clamp(a.tx, 40, W - 40);
      const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy), sp = 330 * dt;
      if (d > 2) { const k = Math.min(1, sp / d); a.x += dx * k; a.y += dy * k; a.dist += Math.min(d, sp); if (Math.abs(dx) > 2) a.face = Math.sign(dx); a.moving = true; } else a.moving = false;

      // Biscuit
      const dog = g.dog;
      if (dog) {
        dog.t += dt; dog.barkIn -= dt;
        if (dog.mode === 'run' || dog.mode === 'pause') {
          if (dog.barkIn <= 0) { dog.barkIn = rand(1.6, 2.6); bark(); floatText(dog.x + dog.dir * 40, dog.gy - 110, 'Woof!', '#fff', false, 20); }
          dog.playIn -= dt;
          if (dog.mode === 'pause') { dog.pause -= dt; if (dog.pause <= 0) dog.mode = 'run'; }
          else if (dog.playIn <= 0 && dog.x > 60 && dog.x < W - 60) { dog.mode = 'pause'; dog.pause = [1.1, 0.8, 0.6][tier - 1]; dog.playIn = rand(2.2, 3.2); }
          if (dog.mode === 'run') {
            const close = dist(dog.x, dog.gy, a.x, a.y) < 190, onScreen = dog.x > 0 && dog.x < W;
            if (dist(dog.x, dog.gy, dog.wx, dog.wy) < 12 || (close && onScreen && (!dog.flee || dist(dog.x, dog.gy, a.x, a.y) < 120))) {
              if (close) {
                const ux = (dog.x - a.x) || 1, uy = dog.gy - a.y, ul = Math.hypot(ux, uy) || 1;
                dog.wx = clamp(dog.x + ux / ul * 220 + rand(-60, 60), 70, W - 70); dog.wy = clamp(dog.gy + uy / ul * 60 + rand(-30, 30), GY, GY + 50);
                if (Math.abs(dog.wx - dog.x) < 80) { dog.wx = dog.x < W / 2 ? rand(W / 2 + 100, W - 80) : rand(80, W / 2 - 100); }
                dog.flee = 0.7;
              } else { dog.wx = a.x < W / 2 ? rand(W / 2 + 40, W - 90) : rand(90, W / 2 - 40); dog.wy = rand(GY, GY + 50); }
            }
            dog.flee = Math.max(0, (dog.flee || 0) - dt);
            const sp2 = [150, 175, 205][tier - 1] * (onScreen ? 1 : 1.5) * dt, ddx = dog.wx - dog.x, ddy = dog.wy - dog.gy, dd = Math.hypot(ddx, ddy) || 1;
            dog.x += ddx / dd * Math.min(sp2, dd); dog.gy += ddy / dd * Math.min(sp2, dd);
            if (Math.abs(ddx) > 2) dog.dir = Math.sign(ddx);
          }
          if (dog.x > 0 && dog.x < W && dist(dog.x, dog.gy, a.x, a.y) < 62) {
            dog.mode = 'sit'; g.dogWon = true; g.dogDone = true; g.cheer = 0.8; bark(); SFX.sparkle();
            burst(dog.x, dog.gy - 60, 18); floatText(dog.x, dog.gy - 130, 'Got the sock!', '#fff6a8', false, 26);
            speak('You got it back! Good boy, Biscuit.');
            dog.wx = 800; dog.wy = GY + 40;
          } else if (dog.t > [18, 15, 13][tier - 1]) {
            dog.mode = 'away'; g.dogDone = true; dog.wx = W + 120; SFX.fail(); speak('Biscuit ran off with the sock! Oh well.');
          }
        } else if (dog.mode === 'sit') {
          // trot to the corner and sit, wagging
          const ddx = dog.wx - dog.x, ddy = dog.wy - dog.gy, dd = Math.hypot(ddx, ddy);
          if (dd > 4) { dog.x += ddx / dd * 160 * dt; dog.gy += ddy / dd * 160 * dt; dog.dir = Math.sign(ddx) || 1; dog.trot = true; } else { dog.trot = false; dog.dir = -1; }
          if (Math.random() < dt * 0.3) { bark(); floatText(dog.x - 30, dog.gy - 100, 'Woof!', '#fff', false, 18); }
        } else if (dog.mode === 'away') { dog.x += 260 * dt; dog.dir = 1; }
      }
      // the bird, after (tier 1) or during (tier 2+) the chase
      if (!g.bird && ((tier === 1 && g.dogDone && g.stageT > 0) || (tier > 1 && g.stageT > 5) || g.dogDone)) {
        if (!g.birdWait) g.birdWait = tier === 1 ? 1.2 : 0.01;
        g.birdWait -= dt;
        if (g.birdWait <= 0) {
          const tx = POST_R - 40, ty = this.lineY(g, POST_R - 40) + 6;
          g.bird = { x: W + 40, y: 260, sx: W + 40, sy: 280, tx, ty, t: 0, dur: [4.5, 3.8, 3.0][tier - 1], mode: 'swoop', flap: 0 };
          tweet(); speak('A bird wants Mom\'s ribbon! Tap the bird!'); g.say = 'Tap the bird to shoo it away!';
        }
      }
      if (b) {
        b.flap += dt * 18;
        if (b.mode === 'swoop') {
          b.t += dt / b.dur;
          const k = Math.min(1, b.t);
          b.x = lerp(b.sx, b.tx + 30, k) + Math.sin(k * 9) * 40 * (1 - k); b.y = lerp(b.sy, b.ty, k) - Math.sin(k * Math.PI) * 50;
          if (k >= 1) { b.mode = 'steal'; g.birdDone = true; SFX.fail(); floatText(b.x, b.y - 30, 'Oh no, the ribbon!', '#ffd0e4', false, 22); }
        } else if (b.mode === 'shoo') { b.x += 380 * dt; b.y -= 260 * dt; }
        else if (b.mode === 'steal') { b.x -= 300 * dt; b.y -= 120 * dt; }
      }
      // the rain cloud, once the puppy and bird are dealt with (earlier at high tiers)
      if (!c && g.dogDone && g.birdDone && g.bird && (g.bird.x > W + 60 || g.bird.y < -60 || g.bird.x < -60 || tier > 1)) {
        g.cloud = { x: -180, mode: 'come', t: 0, warn: [7.5, 6.5, 5.5][tier - 1] + g.hangList.filter(p => p.st === 'hung').length * 0.25 };
        g.say = 'Rain is coming! Tap the clothes to put them in the basket!'; speak(g.say);
        tone(140, 0.8, 'sine', 0.06);
      }
      if (c) {
        c.t += dt;
        if (c.mode === 'come') { c.x = lerp(c.x, 480, Math.min(1, dt * 2.2)); if (c.t > 1.2) { c.mode = 'warn'; c.t = 0; } }
        else if (c.mode === 'warn') {
          const left = g.hangList.filter(p => p.st === 'hung').length;
          if (left === 0 && !g.flyIn.length && g.hangList.every(p => p.st !== 'toBasket')) { c.mode = 'done'; c.t = 0; g.rainDone = true; SFX.fanfare(); speak('All safe in the basket! Hooray!'); }
          else if (c.t >= c.warn) {
            c.mode = 'rain'; c.t = 0; noise(1.2, 0.05);
            for (const p of g.hangList) if (p.st === 'hung') { p.st = 'soaked'; p.wet = 1; }
            speak('Splish splash! Some clothes got wet.');
          }
        } else if (c.mode === 'rain') { if (c.t > 1.6) { c.mode = 'done'; c.t = 0; g.rainDone = true; } }
        else if (c.mode === 'done') { c.x += 160 * dt; }
      }
      for (const p of g.hangList) {
        if (p.st === 'toBasket') {
          p.back = Math.min(1, p.back + dt * 2.4);
          const k = p.back;
          p.x = lerp(p.fx, BASKET_X + rand(-3, 3), k); p.y = lerp(p.fy, BASKET_Y - 100, k) - Math.sin(k * Math.PI) * 80; p.ang += dt * 6;
          if (k >= 1) { p.st = 'inBasket'; g.rainSaved++; SFX.blip(); floatText(BASKET_X, BASKET_Y - 120, `${g.rainSaved}`, '#fff', false, 22); }
        } else if (p.st === 'hung' || p.st === 'soaked') {
          const slot = g.slots[p.slot]; p.x = slot.x; p.y = this.lineY(g, slot.x); p.ang = Math.sin(S.t * 2 + p.slot) * 0.05;
          if (p.st === 'soaked' && Math.random() < dt * 4) g.drops.push({ x: p.x + rand(-18, 18), y: p.y + 66 * g.scale, vx: 0, vy: 30, life: 0.6 });
        }
      }
      if (g.rainDone && g.dogDone && g.birdDone) { g.endT += dt; if (g.endT > 2) g.done = true; }
    },

    update(g, dt, id) {
      g.stageT += dt; g.cheer = Math.max(0, g.cheer - dt); g.warnFlash = Math.max(0, g.warnFlash - dt);
      const sc = this.stageScore(g);
      g.score = (sc.s1 + sc.s2 + sc.s3) / 3;
      g.progress = `Stage ${g.stage + 1} of 3: ${STAGES[g.stage][1]}`;
      // ambient wind, leaves, drips
      g.gustT = Math.max(0, g.gustT - dt);
      g.wind = lerp(g.wind, g.gustT > 0 ? 1 : g.warned ? 0.35 : 0.08, Math.min(1, dt * 4));
      if (Math.random() < dt * (1.5 + g.wind * 40)) g.streaks.push({ x: rand(-200, 300), y: rand(70, 400), len: rand(60, 160), v: rand(500, 800) * (0.4 + g.wind), life: rand(0.8, 1.4), a: 0 });
      if (Math.random() < dt * (0.4 + g.wind * 10)) g.leaves.push({ x: -20, y: rand(80, 380), vx: rand(160, 380), vy: rand(-40, 40), r: rand(0, 6), c: pick(['#7cc85a', '#ffb347', '#a8e07a', '#ff9cc8']) });
      for (const s of g.streaks) { s.x += s.v * dt; s.life -= dt; s.a += dt; }
      g.streaks = g.streaks.filter(s => s.life > 0 && s.x < W + 200);
      for (const l of g.leaves) { l.x += l.vx * dt; l.y += (l.vy + Math.sin(S.t * 5 + l.r) * 60) * dt; l.r += dt * 6; }
      g.leaves = g.leaves.filter(l => l.x < W + 30);
      for (const d of g.drops) { d.x += d.vx * dt; d.vy += 600 * dt; d.y += d.vy * dt; d.life -= dt; }
      g.drops = g.drops.filter(d => d.life > 0);
      if (g.banner > 0) { g.banner -= dt; if (g.stage === 2) this.updateRescueIdle(g, dt); return; }
      if (g.stage === 0) this.updateWash(g, dt, id);
      else if (g.stage === 1) this.updateHang(g, dt);
      else this.updateRescue(g, dt);
      if (g.t > 240) g.done = true;
    },
    updateRescueIdle(g, dt) {
      const dog = g.dog;
      if (dog && dog.x > W - 120) { dog.x -= 200 * dt; dog.dir = -1; }
    },

    // ---------------- drawing ----------------
    draw(g) {
      ctx.lineCap = 'round';
      for (const s of g.streaks) {
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.75, s.life) * Math.min(1, s.a * 4) * 0.8})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.bezierCurveTo(s.x + s.len * 0.3, s.y - 10, s.x + s.len * 0.7, s.y + 10, s.x + s.len, s.y);
        if (s.len > 120) ctx.arc(s.x + s.len, s.y - 10, 10, Math.PI / 2, -Math.PI, true);
        ctx.stroke();
      }
      // flower beds along the front of the yard
      for (let i = 0; i < 9; i++) { const fx = 40 + i * 110, fy = GY + 52 + (i % 2) * 8; ctx.fillStyle = '#5fae4a'; ellipse(fx, fy + 6, 26, 7); flower(fx - 10, fy, 7, ['#ff6fae', '#ffd84a', '#c6a2ff', '#fff'][i % 4], '#ffd84a', 1.2); flower(fx + 10, fy + 3, 6, ['#ffd84a', '#ff9cc8', '#7fd1ff', '#ff7a7a'][i % 4], '#fff6a8', 1.2); }
      if (g.stage === 2 && g.cloud) this.drawCloudLayer(g);
      drawPost(POST_L); drawPost(POST_R);
      ctx.beginPath();
      for (let x = POST_L; x <= POST_R; x += 10) { const y = this.lineY(g, x); x === POST_L ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#f4f0ff'; ctx.lineWidth = 2; ctx.stroke();
      // Mom's ribbon bow, tied near the right post
      const bird = g.bird;
      if (!(bird && (bird.mode === 'steal'))) drawBow(POST_R - 40, this.lineY(g, POST_R - 40) + 6 + Math.sin(S.t * 3) * 2, 0.8 + (bird && bird.mode === 'swoop' ? Math.sin(S.t * 12) * 0.06 : 0));
      if (g.stage === 0) this.drawWashStage(g);
      else this.drawLine(g);
      if (g.stage === 1) this.drawHangStage(g);
      if (g.stage === 2) this.drawRescueStage(g);
      for (const d of g.drops) { ctx.fillStyle = 'rgba(120,190,255,.85)'; ellipse(d.x, d.y, 2.6, 4); }
      for (const l of g.leaves) { ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.r); ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = l.c; ctx.fill(); ctx.restore(); }
      // stage tracker
      STAGES.forEach(([ic, name], i) => {
        const x = 330 + i * 110, y = 66, on = i === g.stage, done = i < g.stage;
        rrect(x, y, 100, 30, 15, on ? '#ff6fb5' : done ? '#5fb87a' : 'rgba(255,255,255,.85)', OL, 2.5);
        emoji(done ? '✅' : ic, x + 18, y + 15, 16);
        text(name, x + 60, y + 15, 15, on || done ? '#fff' : '#9a7aaa', 'center', 800);
      });
      if (g.banner > 0) {
        const a = Math.min(1, g.banner * 3, (1.8 - g.banner) * 5);
        ctx.globalAlpha = a;
        rrect(W / 2 - 300, 170, 600, 110, 24, 'rgba(255,248,252,.95)', '#e2c6f5', 4);
        outlined(g.bannerText, W / 2, 210, 36, '#ff6fb5', 'center', '#fff');
        const ls = wrap(g.bannerSub, 560, 18);
        ls.slice(0, 2).forEach((l, i) => text(l, W / 2, 246 + i * 22, 18, '#5a2a6e', 'center', 700));
        ctx.globalAlpha = 1;
      }
    },
    drawLine(g) {
      for (const p of g.hangList) {
        if (!['hung', 'tug', 'back', 'soaked'].includes(p.st)) continue;
        const skew = p.st === 'tug' ? Math.sin(S.t * 18 + p.slot) * 0.35 : -g.wind * 0.18 + Math.sin(S.t * 3 + p.slot) * 0.04;
        if (p.st === 'tug') { ctx.fillStyle = `rgba(255,90,120,${0.25 + Math.sin(S.t * 16) * 0.15})`; const c = this.centre(g, p); circle(c.x, c.y, 50); }
        drawWash(p, p.x, p.y, p.ang, skew, g.scale, p.wet);
        if (p.wet <= 0 && p.st === 'hung') { ctx.globalAlpha = 0.5 + Math.sin(S.t * 3 + p.slot) * 0.3; star(p.x + 20 * g.scale, p.y + 20, 6, '#fff6a8', 4); ctx.globalAlpha = 1; }
      }
      for (const p of g.hangList) {
        if (!['hung', 'tug', 'soaked'].includes(p.st)) continue;
        const pegs = PEGS[p.kind], col = PEG_COLS[p.order % 4];
        pegs.forEach((ox, i) => {
          const k = ox * g.scale;
          if (p.st === 'tug') {
            const loose = (1 - p.tugT / p.tug0) > 0.5 && i === pegs.length - 1 && pegs.length > 1;
            if (loose) drawPeg(p.x + k + 8, p.y - 10 - Math.sin(S.t * 20) * 3, col, 0.7);
            else drawPeg(p.x + k + Math.sin(S.t * 30) * 2, p.y + 2, col, Math.sin(S.t * 25) * 0.2);
          } else drawPeg(p.x + k * Math.cos(p.ang), p.y + 2 + k * Math.sin(p.ang), col, p.ang);
        });
        if (p.paired) {
          const mate = g.hangList.find(q => q !== p && q.pair === p.pair);
          if (mate && mate.slot > p.slot && mate.st === p.st) heart((p.x + mate.x) / 2, p.y + 26 + Math.sin(S.t * 3) * 2, 20, '#ff6fb5');
        }
      }
    },
    drawWashStage(g) {
      MACH.forEach((m, i) => drawMachine(m, g, i));
      const bounce = g.cur ? Math.max(0, Math.sin(g.curPop * Math.PI)) * 10 : 0;
      drawAubrey(330, GY + 16, g.sub === 'spin' ? 'twirl' : 'idle_front', 1);
      drawHamper(HAMPER_X, GY + 10, bounce);
      const p = g.cur;
      if (p && !g.flyer) {
        const k = g.curPop, x = p.hx ?? HAMPER_X, y = (p.hy ?? CUR_Y) - 30 + (1 - k) * 60;
        if (!g.held) { ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(x, y + 34, 58); }
        drawWash(p, x, y + (g.held ? 0 : Math.sin(S.t * 3) * 4), g.held ? 0 : Math.sin(S.t * 2) * 0.06, 0, 1.25 * (0.5 + k * 0.5), 0, 1);
        if (!g.held && g.sub === 'sort') {
          const w = Math.sin(S.t * 5) * 6;
          outlined('◀', MACH[0].x + MACH[0].w + 40 - w, CUR_Y + 10, 34, '#fff', 'center');
          outlined('▶', MACH[1].x - 40 + w, CUR_Y + 10, 34, '#fff', 'center');
          if (g.sorted < 2) outlined(p.white ? 'Is it white?' : 'Is it colourful?', HAMPER_X, CUR_Y - 66, 22, '#fff6a8', 'center');
        }
      }
      const fl = g.flyer;
      if (fl) drawWash(fl.p, fl.x, fl.y, fl.t * 6, 0, 1.1 * (fl.ok ? 1 - Math.max(0, fl.t - 0.7) : 1), 0, 1);
      for (const b of g.bubbles) drawBubble(b);
      if (g.sub === 'sort') { rrect(W / 2 - 70, 112, 140, 30, 15, 'rgba(48,24,72,.7)'); text(`Washed ${g.sorted} / ${g.n1}`, W / 2, 127, 16, '#fff', 'center', 700); }
      else { rrect(W / 2 - 110, 112, 220, 30, 15, 'rgba(48,24,72,.7)'); text(`Bubbles ${Math.min(g.pops, g.popGoal)} / ${g.popGoal}`, W / 2, 127, 16, '#fff', 'center', 700); }
    },
    drawHangStage(g) {
      if (g.held && pointer.y < 340) {
        const s = this.nearestFree(g, pointer.x);
        if (s) {
          const y = this.lineY(g, s.x);
          ctx.globalAlpha = 0.35 + Math.sin(S.t * 8) * 0.1; drawWash(g.held, s.x, y, 0, 0, g.scale, 0); ctx.globalAlpha = 1;
          const m = this.pairMate(g, g.held, s);
          if (m) emoji('💞', (s.x + m.x) / 2, y - 26 + Math.sin(S.t * 6) * 3, 24);
        }
      }
      for (const p of g.hangList) if (p.st === 'tug') { const c = this.centre(g, p); outlined('Tap!', c.x, c.y - 70 * g.scale - 10 + Math.sin(S.t * 10) * 4, 22, '#fff6a8', 'center'); }
      drawAubrey(150, GY + 16, g.cheer > 0 ? 'jump' : 'idle_front', 1, g.cheer > 0 ? Math.sin((0.6 - g.cheer) / 0.6 * Math.PI) * 30 : 0);
      const shown = this.basketShown(g);
      drawBasket(BASKET_X, BASKET_Y);
      // the shown pieces peek out over the rim, so draw the rim again over their bottoms
      shown.forEach((p, i) => {
        const s = this.basketSpot(g, i), hov = !g.held && Math.abs(pointer.x - s.x) < 40 && pointer.y > s.y - 20 && pointer.y < s.y + 90;
        drawWash(p, s.x, s.y + (hov ? -8 : 0) + Math.sin(S.t * 2 + i) * 2, (i - 1) * 0.12, 0, 0.9, 1);
      });
      ctx.save(); ctx.beginPath(); ctx.rect(0, BASKET_Y - 62, W, 200); ctx.clip(); drawBasket(BASKET_X, BASKET_Y); ctx.restore();
      const left = g.hangList.filter(p => p.st === 'basket').length;
      if (left) { rrect(BASKET_X - 26, BASKET_Y - 8, 52, 28, 14, 'rgba(255,248,252,.92)', OL, 2.5); text(`${left}`, BASKET_X, BASKET_Y + 6, 18, '#5a2a6e', 'center', 800); }
      if (!g.hangList.some(p => p.st !== 'basket') && !g.held) {
        const k = (S.t * 0.6) % 1, s = this.basketSpot(g, 1);
        ctx.globalAlpha = Math.sin(k * Math.PI); emoji('👆', lerp(s.x, 480, k) + 10, lerp(s.y + 30, this.lineY(g, 480) + 20, k) + 20, 40); ctx.globalAlpha = 1;
      }
      for (const p of g.hangList) if (p.st === 'fly') {
        const c = this.centre(g, p);
        ctx.fillStyle = `rgba(255,240,140,${0.3 + Math.sin(S.t * 14) * 0.15})`; circle(c.x, c.y, 56);
        drawWash(p, p.x, p.y, p.ang, Math.sin(S.t * 12) * 0.3, g.scale, p.wet);
        outlined('Catch it!', c.x, c.y - 66, 20, '#fff6a8', 'center');
      }
      if (g.held) { ctx.save(); ctx.shadowColor = 'rgba(40,20,60,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; drawWash(g.held, g.held.x, g.held.y, Math.sin(S.t * 4) * 0.06, 0, 1.05, 1); ctx.restore(); }
      if (g.warnFlash > 0 || g.gustT > 0) {
        ctx.globalAlpha = g.gustT > 0 ? 1 : Math.min(1, (1.2 - g.warnFlash) * 3);
        outlined(g.gustT > 0 ? 'WHOOOSH!' : 'Gust coming!', W / 2 + 240 + Math.sin(S.t * 10) * 4, 300, 30, '#dff4ff', 'center'); ctx.globalAlpha = 1;
      }
      const dry = g.hangList.filter(p => p.st === 'hung' && p.wet <= 0).length;
      if (dry < g.n2 - g.lost) { rrect(640, 470, 200, 34, 17, 'rgba(48,24,72,.7)'); text(`☀️ Dry ${dry} / ${g.n2 - g.lost}`, 740, 487, 17, '#fff', 'center', 700); }
    },
    // the rain cloud sits high, behind the line, so the clothes stay easy to see and tap
    drawCloudLayer(g) {
      const c = g.cloud;
      if (c.mode === 'rain') { ctx.fillStyle = 'rgba(60,70,110,.18)'; ctx.fillRect(0, 0, W, H); }
      ctx.save(); ctx.translate(c.x, 88); ctx.scale(0.8, 0.8);
      drawCloud(0, 0, c.mode === 'warn' ? 0.3 + Math.min(1, c.t / c.warn) * 0.6 : c.mode === 'rain' ? 1 : 0.3);
      ctx.restore();
    },
    drawRescueStage(g) {
      const c = g.cloud;
      if (c) {
        if (c.mode === 'rain') { ctx.strokeStyle = 'rgba(120,170,255,.8)'; ctx.lineWidth = 3; for (let i = 0; i < 70; i++) { const rx = (i * 53 + S.t * 90) % W, ry = (i * 97 + S.t * 700) % (H - 150) + 170; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 16); ctx.stroke(); } }
        if (c.mode === 'warn') {
          const left = c.warn - c.t;
          rrect(W / 2 - 160, 262, 320, 36, 18, 'rgba(48,24,72,.75)');
          text(`☔ Rain in ${Math.ceil(left)}... tap the clothes!`, W / 2, 280, 17, '#fff', 'center', 700);
        }
      }
      for (const p of g.hangList) if (p.st === 'hung' && c && c.mode === 'warn') { const q = this.centre(g, p); ctx.strokeStyle = `rgba(255,246,168,${0.5 + Math.sin(S.t * 8) * 0.3})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(q.x, q.y, 46, 0, Math.PI * 2); ctx.stroke(); }
      const inB = g.hangList.filter(p => p.st === 'inBasket');
      drawBasket(BASKET_X, BASKET_Y, inB);
      for (const p of g.hangList) if (p.st === 'toBasket') drawWash(p, p.x, p.y, p.ang, 0, g.scale * 0.9, 0);
      // Aubrey and Biscuit, nearest drawn last
      const a = g.aub, dog = g.dog;
      const actors = [{ y: a.y, f: () => {
        const fr = a.moving ? `run${1 + Math.floor(a.dist / 26) % 5}` : g.cheer > 0 ? 'jump' : 'idle_front';
        drawAubrey(a.x, a.y, fr, a.face, g.cheer > 0 && !a.moving ? Math.sin((0.8 - g.cheer) / 0.8 * Math.PI) * 30 : 0);
      } }];
      if (dog) actors.push({ y: dog.gy, f: () => {
        const run = dog.mode === 'run' || dog.mode === 'away' || dog.trot;
        drawBiscuit(dog.x, dog.gy, dog.dir, run, dog.mode === 'pause' || (dog.mode === 'sit' && !dog.trot), dog.mode === 'sit' ? null : dog.sock);
        if (dog.mode === 'pause' && dog.x > 0 && dog.x < W) outlined('Grab it!', dog.x, dog.gy - 120, 20, '#fff6a8', 'center');
        if (dog.mode === 'sit' && !dog.trot) drawWash(dog.sock, dog.x + 50, dog.gy - 26, 1.4, 0, 0.5, 0);
      } });
      actors.sort((p, q) => p.y - q.y).forEach(o => o.f());
      if (dog && (dog.mode === 'run' || dog.mode === 'pause') && g.banner <= 0 && dog.x > 0 && dog.x < W) {
        ctx.globalAlpha = 0.6 + Math.sin(S.t * 6) * 0.3; emoji('🧦', dog.x, dog.gy - 140 + Math.sin(S.t * 5) * 4, 26); ctx.globalAlpha = 1;
      }
      const b = g.bird;
      if (b && b.x > -80 && b.x < W + 80 && b.y > -80) {
        if (b.mode === 'swoop') { ctx.fillStyle = `rgba(255,240,140,${0.3 + Math.sin(S.t * 14) * 0.15})`; circle(b.x, b.y, 48); outlined('Tap!', b.x, b.y - 52, 20, '#fff6a8', 'center'); }
        drawBird(b.x, b.y, b.mode === 'shoo' ? 1 : -1, b.flap, b.mode === 'steal');
      }
      if (g.endT > 0) outlined(g.rainSaved === g.n2 - g.lost && g.dogWon && g.birdWon ? 'Laundry hero!' : 'All done!', W / 2, 300, 40, '#ff6fb5', 'center', '#fff');
    },
  };

  restage('laundry', {
    games: [['laundryrush', 'ribbon', {}], ['outfits', 'ribbon', {}]],
    intro: [
      "N:Aubrey, help! Everything got muddy, the wind is wild today, and Biscuit is in a silly mood!",
      "N:First, wash it: whites in one machine, colours in the other. Then hang it all on the line, before the wind or Biscuit gets it!",
      'A:determined:Laundry rescue, coming up!',
    ],
  });
}
