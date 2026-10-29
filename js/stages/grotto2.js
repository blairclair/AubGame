'use strict';
// Mermaid Grotto, game 2: Squid Quest. Aubrey is a squid carrying Olive's lost pearl home through
// a reef full of grumpy (never scary) sea creatures. Space squirts ink: inked creatures go "Blub?!",
// spin around confused, then float off or fall asleep. Sea facts pop up as she meets each creature.
{
  const SQ = { TOP: 70, FLOOR: 478, R: 26, MAXV: 290, ACC: 1500, GAP: 150 };
  const hsh = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

  // ---- squid Aubrey ------------------------------------------------------------------------
  // same limb technique as the octopus Aubrey in b7.js: a curve sampled as shrinking circles,
  // outlined first and filled second so it reads as one limb
  const limb = (pts, w0, w1, col, sucker, club = 0) => {
    const [[ax, ay], [cx, cy], [bx, by]] = pts, N = 30, dots = [];
    for (let i = 0; i <= N; i++) { const k = i / N, u = 1 - k; dots.push([u * u * ax + 2 * u * k * cx + k * k * bx, u * u * ay + 2 * u * k * cy + k * k * by, lerp(w0, w1, k)]); }
    ctx.fillStyle = OL; for (const [x, y, r] of dots) circle(x, y, r + 1.5);
    if (club) circle(bx, by, club + 1.5);
    ctx.fillStyle = col; for (const [x, y, r] of dots) circle(x, y, r);
    if (club) circle(bx, by, club);
    ctx.fillStyle = sucker; for (let i = 6; i < N - 2; i += 6) { const [x, y, r] = dots[i]; circle(x, y + r * 0.3, r * 0.36); }
    if (club) { circle(bx - club * 0.3, by, club * 0.35); circle(bx + club * 0.35, by + club * 0.2, club * 0.3); }
  };
  const SQUID = { col: '#ff8452', dark: '#e0603a', spot: '#c8452a', suck: '#ffd6bf', fin: '#ffa66e' };
  // x, waist: where her top half meets the squid; vx, vy: her swim speed (the limbs stream behind)
  const drawSquidAubrey = (x, waist, t, vx, vy, pearl, dizzy) => {
    const s = 0.56, im = IMG.idle_front, h = im.height * s, c = SQUID;
    const tvx = clamp(vx / 300, -1, 1), tvy = clamp(vy / 300, -1, 1);
    const tilt = clamp(vx / 900, -0.3, 0.3) + (dizzy ? Math.sin(t * 14) * 0.18 : 0);
    ctx.save(); ctx.translate(x, waist); ctx.rotate(tilt);
    const top = -h / 2, flap = Math.sin(t * 6) * 6;
    // the pointed squid mantle behind her head (her face and hair are drawn over it), with two flapping fins near the tip
    for (const sd of [-1, 1]) ink(P2(`M${sd * 9},${top - 36} C${sd * 30},${top - 42 + flap} ${sd * 48},${top - 32 + flap} ${sd * 52},${top - 12 + flap} C${sd * 36},${top - 10} ${sd * 22},${top - 12} ${sd * 14},${top - 8} Z`), c.fin, 1.4);
    ink(P2(`M-28,${top + 24} C-31,${top - 6} -17,${top - 40} 0,${top - 62} C17,${top - 40} 31,${top - 6} 28,${top + 24} Z`), c.col, 1.6);
    ctx.fillStyle = c.spot; for (const [sx, sy, r] of [[-9, -46, 3.4], [8, -40, 3], [-2, -30, 2.4], [11, -54, 2], [-14, -28, 2.2]]) circle(sx, top + sy + 4, r);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-8, top - 34, 3.5, 10, 0.3);
    // eight arms trailing behind and below
    const k = 1.25, P = pts => pts.map(([px, py]) => [px * k, py * k]);
    for (const off of [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5]) {
      const wig = Math.sin(t * 4 + off * 1.7) * 5;
      limb(P([[off * 4.5, 2], [off * 11 - tvx * 22, 28 - tvy * 10], [off * 14 - tvx * 48 + wig, 52 - Math.abs(tvx) * 14 - tvy * 18 - Math.abs(off) * 3]]), 7.5, 2.2, c.col, c.suck);
    }
    // the two long feeding tentacles, with little clubs on the ends: one holds the pearl
    const wig2 = Math.sin(t * 3) * 7;
    limb(P([[-6, 4], [-20 - tvx * 30, 48], [-14 - tvx * 70 + wig2, 84 - Math.abs(tvx) * 20]]), 5.5, 2.8, c.dark, c.suck, 7);
    const px = 44, py = -6 + Math.sin(t * 2.4) * 3;
    if (pearl) limb([[10, 4], [52, 36], [px, py + 11]], 5.5, 3.2, c.dark, c.suck, 7);
    else limb(P([[6, 4], [24 - tvx * 30, 50], [18 - tvx * 66 - wig2, 82 - Math.abs(tvx) * 20]]), 5.5, 2.8, c.dark, c.suck, 7);
    // her own top half
    ctx.save(); ctx.beginPath(); ctx.rect(-80, -h - 10 + h / 2, 160, h / 2 + 12); ctx.clip();
    drawAubrey(0, h / 2, 'idle_front', 1, 0, s);
    ctx.restore();
    // a squid collar where the arms join her
    ctx.fillStyle = OL; for (let k = -2; k <= 2; k++) circle(k * 9, 3, 8.6);
    ctx.fillStyle = c.col; for (let k = -2; k <= 2; k++) circle(k * 9, 3, 7);
    ctx.fillStyle = c.suck; for (let k = -2; k <= 2; k++) circle(k * 9, 5, 2);
    if (pearl) drawPearl(px, py, 12);
    ctx.restore();
    if (dizzy) for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; star(x + Math.cos(a) * 34, waist - h / 2 - 14 + Math.sin(a) * 7, 6, '#ffe46a', 5); }
  };
  const drawPearl = (x, y, r) => {
    const gr = ctx.createRadialGradient(x, y, 2, x, y, r * 3);
    gr.addColorStop(0, 'rgba(255,250,220,.7)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    const sh = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r);
    sh.addColorStop(0, '#ffffff'); sh.addColorStop(0.6, '#f4ecff'); sh.addColorStop(1, '#d6c4f0');
    inkCircle(x, y, r, sh, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.95)'; circle(x - r * 0.35, y - r * 0.38, r * 0.25);
  };

  // ---- the sea creatures -------------------------------------------------------------------
  const eyes = (x, y, gap, r, look, grump, daze, t) => {
    for (const sd of [-1, 1]) {
      inkCircle(x + sd * gap, y, r, '#fff', 1);
      if (daze) {
        ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let a = 0; a < 9; a += 0.3) { const rr = a / 9 * r * 0.8; ctx.lineTo(x + sd * gap + Math.cos(a + t * 8) * rr, y + Math.sin(a + t * 8) * rr); }
        ctx.stroke();
      } else { ctx.fillStyle = OL; circle(x + sd * gap + look * r * 0.35, y + r * 0.1, r * 0.5); ctx.fillStyle = '#fff'; circle(x + sd * gap + look * r * 0.35 - r * 0.15, y - r * 0.12, r * 0.18); }
      if (grump && !daze) { ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x + sd * gap - sd * r * 0.9, y - r * 1.3); ctx.lineTo(x + sd * gap + sd * r * 0.9, y - r * 0.9); ctx.stroke(); }
    }
  };
  const sleepyEyes = (x, y, gap, r) => { ctx.strokeStyle = OL; ctx.lineWidth = 2; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sd * gap, y, r * 0.7, 0.2, Math.PI - 0.2); ctx.stroke(); } };
  const mouth = (x, y, w, happy) => { ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); if (happy) ctx.arc(x, y - w * 0.3, w * 0.6, 0.3, Math.PI - 0.3); else ctx.arc(x, y + w * 0.5, w * 0.5, Math.PI + 0.5, -0.5); ctx.stroke(); };
  // the cartoon ink splat a creature wears after it's inked
  const splat = (x, y, r, seed) => {
    ctx.fillStyle = 'rgba(40,24,70,.86)';
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, rr = r * (0.7 + 0.35 * hsh(seed + i)); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
    ctx.fill();
    for (let i = 0; i < 4; i++) { const a = hsh(seed + i * 3) * 6.28; circle(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 0.95, r * 0.14 + hsh(seed + i) * 3); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(x - r * 0.3, y - r * 0.3, r * 0.2, r * 0.1, -0.5);
  };
  const zzz = (x, y, t) => { for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - k; outlined('z', x + k * 22 + i * 3, y - k * 40, 14 + i * 4, '#fff'); } ctx.globalAlpha = 1; };

  const drawCrab = (e, t) => {
    const { x, y } = e, sleep = e.state === 'asleep', daze = e.state === 'dazed', pinch = sleep ? 0 : Math.abs(Math.sin(t * 7 + e.ph)) * 0.6;
    ctx.strokeStyle = OL; ctx.lineWidth = 3;
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const st = sleep ? 0 : Math.sin(t * 14 + k + sd) * 3; ctx.beginPath(); ctx.moveTo(x + sd * 14, y + 4 + k * 3); ctx.lineTo(x + sd * (26 + k * 3), y + 8 + st); ctx.lineTo(x + sd * (30 + k * 4), y + 18); ctx.stroke(); }
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(x + sd * 30, y - 12); ctx.scale(sd, 1);
      inkEllipse(0, 0, 11, 9, 0, '#ff5a4a', 1.4);
      ctx.save(); ctx.rotate(-pinch); ink(P2('M2,-4 C10,-14 18,-12 18,-4 L6,-2 Z'), '#ff7a5a', 1.2); ctx.restore();
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + sd * 16, y - 2); ctx.lineTo(x + sd * 26, y - 8); ctx.stroke();
    }
    for (const sd of [-1, 1]) { ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + sd * 6, y - 10); ctx.lineTo(x + sd * 8, y - 22); ctx.stroke(); }
    inkEllipse(x, y, 22, 14, 0, '#ff6a4a', 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(x - 6, y - 6, 8, 3, -0.2);
    if (sleep) sleepyEyes(x, y - 24, 8, 6); else eyes(x, y - 24, 8, 6, e.look || 0, true, daze, t);
    mouth(x, y + 3, 8, sleep);
  };
  const drawPuffer = (e, t) => {
    const { x, y } = e, r = e.r, daze = e.state === 'dazed';
    // spikes all round, then the round body
    ctx.fillStyle = OL;
    const n = 16;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + t * 0.2; tri(x + Math.cos(a - 0.12) * r * 0.92, y + Math.sin(a - 0.12) * r * 0.92, x + Math.cos(a + 0.12) * r * 0.92, y + Math.sin(a + 0.12) * r * 0.92, x + Math.cos(a) * (r + 9 + r * 0.06), y + Math.sin(a) * (r + 9 + r * 0.06)); }
    ctx.fillStyle = '#ffc44a';
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + t * 0.2; tri(x + Math.cos(a - 0.08) * r * 0.9, y + Math.sin(a - 0.08) * r * 0.9, x + Math.cos(a + 0.08) * r * 0.9, y + Math.sin(a + 0.08) * r * 0.9, x + Math.cos(a) * (r + 6 + r * 0.05), y + Math.sin(a) * (r + 6 + r * 0.05)); }
    ink(P2(`M${x + r * 0.9},${y} L${x + r * 1.3},${y - r * 0.35 + Math.sin(t * 8) * 4} L${x + r * 1.3},${y + r * 0.35 - Math.sin(t * 8) * 4} Z`), '#ffa63a', 1.4);
    const sh = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
    sh.addColorStop(0, '#fff2a0'); sh.addColorStop(0.7, '#ffd23f'); sh.addColorStop(1, '#f0a830');
    inkCircle(x, y, r, sh, 1.8);
    ctx.fillStyle = '#fff6d8'; ellipse(x, y + r * 0.45, r * 0.6, r * 0.35);
    ctx.fillStyle = 'rgba(200,140,40,.5)'; for (let i = 0; i < 6; i++) circle(x - r * 0.5 + hsh(i) * r, y - r * 0.6 + hsh(i + 4) * r * 0.5, r * 0.06);
    eyes(x - r * 0.2, y - r * 0.15, r * 0.3, r * 0.2, -1, true, daze, t);
    // puffed cheeks and a little pout
    ctx.fillStyle = 'rgba(255,120,120,.4)'; circle(x - r * 0.62, y + r * 0.15, r * 0.14); circle(x + r * 0.22, y + r * 0.15, r * 0.14);
    ctx.fillStyle = OL; ellipse(x - r * 0.2, y + r * 0.22, r * 0.09, r * 0.07);
  };
  const drawJelly = (e, t) => {
    const { x, y } = e, daze = e.state === 'dazed';
    ctx.strokeStyle = 'rgba(255,150,220,.85)'; ctx.lineWidth = 3;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 8, y + 6); for (let j = 1; j <= 6; j++) ctx.lineTo(x + k * 8 + Math.sin(t * 4 + j + k) * 4, y + 6 + j * 8); ctx.stroke(); }
    const sq = 1 + Math.sin(t * 3 + e.ph) * 0.06;
    ink(P2(`M${x - 28 * sq},${y + 6} C${x - 30 * sq},${y - 30} ${x + 30 * sq},${y - 30} ${x + 28 * sq},${y + 6} C${x + 18},${y + 12} ${x + 10},${y + 2} ${x},${y + 8} C${x - 10},${y + 2} ${x - 18},${y + 12} ${x - 28 * sq},${y + 6} Z`), 'rgba(255,160,225,.9)', 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(x - 12, y - 14, 7, 4, -0.5);
    eyes(x, y - 6, 8, 4.5, 0, false, daze, t);
    mouth(x, y + 2, 6, true);
  };
  const drawLobster = (e, t) => {
    const { x, y } = e, f = e.face || -1, sleep = e.state === 'asleep', daze = e.state === 'dazed';
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    // tail fan behind, then the body, then the big claws in front
    ink(P2('M-30,0 L-46,-12 L-50,0 L-46,12 Z'), '#e8503a', 1.4);
    for (let k = 0; k < 3; k++) inkEllipse(-22 + k * 7, 0, 9, 11 - k, 0, '#f25a42', 1.3);
    inkEllipse(6, 0, 20, 15, 0, '#ff6a4a', 1.6);
    ctx.strokeStyle = OL; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, -10); ctx.quadraticCurveTo(46, -40, 70, -30 + Math.sin(t * 3) * 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -12); ctx.quadraticCurveTo(36, -46, 52, -48 + Math.sin(t * 3 + 1) * 4); ctx.stroke();
    const snap = sleep ? 0 : Math.abs(Math.sin(t * 6)) * 0.5;
    for (const [cy, sc] of [[-14, 1], [14, 0.9]]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(16, cy * 0.4); ctx.lineTo(30, cy); ctx.stroke();
      ctx.save(); ctx.translate(38, cy); ctx.scale(sc, sc);
      inkEllipse(0, 0, 13, 10, 0, '#ff5a40', 1.4);
      ctx.save(); ctx.rotate(-snap); ink(P2('M6,-4 C16,-14 26,-10 26,-2 L10,0 Z'), '#ff7a5a', 1.2); ctx.restore();
      ctx.save(); ctx.rotate(snap); ink(P2('M6,4 C16,12 24,10 24,4 L10,1 Z'), '#ff7a5a', 1.2); ctx.restore();
      ctx.restore();
    }
    ctx.restore();
    if (sleep) sleepyEyes(x + f * 10, y - 8, 6, 5); else eyes(x + f * 10, y - 8, 6, 5, f, true, daze, t);
    mouth(x + f * 12, y + 6, 6, sleep);
  };
  // eels live in a rock: dir -1 pokes up out of the sea floor, +1 pokes down from a ledge above
  const eelTip = e => [e.x, e.base + e.dir * e.out * 170];
  const drawEel = (e, t) => {
    const [, ty] = eelTip(e), len = Math.abs(ty - e.base);
    if (len > 6) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const k = i / 16; pts.push([e.x + Math.sin(t * 5 + k * 5) * 8 * k, e.base + e.dir * len * k]); }
      ctx.fillStyle = OL; for (const [px, py] of pts) circle(px, py, 13.5);
      ctx.fillStyle = '#5fc06a'; for (const [px, py] of pts) circle(px, py, 12);
      ctx.fillStyle = '#ffe48a'; for (const [px, py] of pts) circle(px + 5, py, 4);
      const [hx, hy] = pts[16];
      inkEllipse(hx, hy, 16, 15, 0, '#6ad078', 1.5);
      ctx.fillStyle = 'rgba(30,80,40,.35)'; for (let i = 2; i < 15; i += 3) circle(pts[i][0] - 4, pts[i][1], 2.4);
      if (e.state === 'asleep') sleepyEyes(hx, hy - e.dir * 3, 6, 5); else eyes(hx, hy - e.dir * 3, 6, 5, 0, true, e.state === 'dazed', t);
      mouth(hx, hy + 8 * (e.dir < 0 ? 1 : 0.4), 6, false);
    }
    // the rock it lives in, drawn over its tail
    const ry = e.base, rw = 46;
    ink(P2(`M${e.x - rw},${ry - e.dir * 30} C${e.x - rw - 6},${ry} ${e.x - rw + 4},${ry + e.dir * 8} ${e.x - 20},${ry} L${e.x + 20},${ry} C${e.x + rw - 4},${ry + e.dir * 8} ${e.x + rw + 6},${ry} ${e.x + rw},${ry - e.dir * 30} Z`), '#7a6ab8', 1.6);
    ctx.fillStyle = '#2a2050'; ellipse(e.x, ry, 18, 6);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ellipse(e.x - 24, ry - e.dir * 16, 8, 4, 0.3);
  };
  const DRAW = { crab: drawCrab, puffer: drawPuffer, jelly: drawJelly, lobster: drawLobster, eel: drawEel };

  // ---- scenery -----------------------------------------------------------------------------
  const kelp = (x, gy, h, col, ph) => {
    ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, gy);
    for (let i = 1; i <= 10; i++) ctx.lineTo(x + Math.sin(S.t * 1.2 + ph + i * 0.5) * i * 1.4, gy - h * i / 10);
    ctx.stroke(); ctx.fillStyle = col;
    for (let i = 2; i <= 9; i += 2) { const lx = x + Math.sin(S.t * 1.2 + ph + i * 0.5) * i * 1.4, ly = gy - h * i / 10; ellipse(lx + (i % 4 ? 8 : -8), ly, 10, 4, i % 4 ? 0.5 : -0.5); }
    ctx.lineCap = 'butt';
  };
  const coral = (x, gy, sc, col) => {
    ctx.strokeStyle = OL; ctx.lineWidth = 11 * sc; ctx.lineCap = 'round';
    const br = [[0, 0, 0, -46], [0, -24, -20, -48], [0, -30, 18, -58], [-10, -36, -24, -62], [9, -42, 4, -70]];
    for (const [a, b, c, d] of br) { ctx.beginPath(); ctx.moveTo(x + a * sc, gy + b * sc); ctx.lineTo(x + c * sc, gy + d * sc); ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = 7.5 * sc;
    for (const [a, b, c, d] of br) { ctx.beginPath(); ctx.moveTo(x + a * sc, gy + b * sc); ctx.lineTo(x + c * sc, gy + d * sc); ctx.stroke(); }
    ctx.lineCap = 'butt';
  };
  const anem = (x, gy, col) => {
    for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * 0.32 + Math.sin(S.t * 2 + i) * 0.1; ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, gy - 8); ctx.lineTo(x + Math.cos(a) * 24, gy - 8 + Math.sin(a) * 24); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 4.5; ctx.stroke(); }
    ctx.lineCap = 'butt'; inkEllipse(x, gy - 4, 14, 8, 0, mix(col, '#7a3a8a', 0.3), 1.3);
  };
  const seaStar = (x, y, r, col) => { star(x, y, r + 2, OL, 5); star(x, y, r, col, 5); };
  const rockCol = (x, y0, y1, w, seed) => {
    ink(P2(`M${x - w / 2},${y0} L${x + w / 2},${y0} C${x + w / 2 + 8},${lerp(y0, y1, 0.4)} ${x + w / 2 - 6},${lerp(y0, y1, 0.7)} ${x + w / 2 + 4},${y1} L${x - w / 2 - 4},${y1} C${x - w / 2 + 6},${lerp(y0, y1, 0.7)} ${x - w / 2 - 8},${lerp(y0, y1, 0.4)} ${x - w / 2},${y0} Z`), '#7a6ab8', 2);
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x - w / 2 + 6, y0, 10, y1 - y0);
    ctx.fillStyle = 'rgba(40,30,90,.25)'; for (let i = 0; i < 5; i++) ellipse(x - w * 0.3 + hsh(seed + i) * w * 0.6, lerp(y0 + 10, y1 - 10, hsh(seed + i + 9)), 6 + hsh(seed + i) * 6, 4);
  };

  // the level is a row of little "beats" from left to right
  const PLAN = {
    1: ['crab', 'jelly', 'gate', 'eelup', 'crab', 'jelly', 'lobster'],
    2: ['crab', 'jelly', 'gate', 'eelup', 'crab2', 'jellies', 'lobster', 'eeldown', 'gate', 'crab'],
    3: ['crab', 'jellies', 'gate', 'eelup', 'crab2', 'lobster', 'jellies', 'eeldown', 'gate', 'crab2', 'eelup', 'lobster'],
  };
  const FACTS = {
    swim: 'Squids swim by squirting water out of their bodies, like a jet!',
    ink: 'Squids squirt ink to make a dark cloud and zoom away!',
    crab: 'Crabs walk sideways! Scuttle, scuttle!',
    jelly: 'Jellyfish have no brain and no bones. They just drift along!',
    puffer: 'Pufferfish puff up big so they look too big to eat!',
    eel: 'Eels love to hide in rocky holes and peek out.',
    lobster: 'Lobsters can grow back a claw if they lose one!',
    hearts: 'Squids have three hearts!',
    arms: 'A squid has eight arms and two long tentacles. That makes ten!',
  };

  MG.squidquest = {
    kind: 'learn', title: () => 'Squid Quest', icon: () => '🦑',
    how: () => "Aubrey is a squid! Bring Olive's lost pearl home. Swim with the arrow keys, or tap where to go. Press space, or tap a sea creature, to squirt ink at it. Inked creatures get confused and leave you alone!",
    init(g) {
      const plan = PLAN[g.tier], step = 330, L = 520 + plan.length * step + 520;
      const en = [], rocks = [];
      const lobSp = [85, 110, 135][g.tier - 1], crabSp = [55, 75, 95][g.tier - 1];
      plan.forEach((p, i) => {
        const x = 560 + i * step, j = hsh(i + g.tier * 7);
        const crab = cx => en.push({ type: 'crab', x: cx, x0: cx, y: SQ.FLOOR - 16, gy: SQ.FLOOR - 16, vy: 0, r: 24, sp: crabSp * (j > 0.5 ? 1 : -1), hop: 0, ph: j * 6 });
        const jelly = (jx, jy) => en.push({ type: 'jelly', x: jx, x0: jx, y: jy, y0: jy, r: 26, ph: hsh(jx) * 6 });
        if (p === 'crab') crab(x);
        if (p === 'crab2') { crab(x - 80); crab(x + 90); }
        if (p === 'jelly') jelly(x, 250 + j * 80);
        if (p === 'jellies') { jelly(x - 90, 190 + j * 40); jelly(x + 90, 330 - j * 40); }
        if (p === 'eelup') en.push({ type: 'eel', x, base: SQ.FLOOR - 4, dir: -1, out: 0, cyc: j * 3, r: 15 });
        if (p === 'eeldown') { en.push({ type: 'eel', x, base: SQ.TOP + 44, dir: 1, out: 0, cyc: j * 3, r: 15 }); }
        if (p === 'lobster') en.push({ type: 'lobster', x: x + 60, x0: x + 60, y: SQ.FLOOR - 40, y0: SQ.FLOOR - 40, r: 30, sp: lobSp, face: -1 });
        if (p === 'gate') {
          const gy = 220 + j * 120;
          rocks.push({ x, gy, y0: SQ.TOP - 20, y1: gy - SQ.GAP / 2, w: 90 }, { x, gy, y0: gy + SQ.GAP / 2, y1: SQ.FLOOR + 20, w: 90 });
          en.push({ type: 'puffer', x, y: gy, r: 22, r0: 22, rBig: SQ.GAP / 2 + 6, puff: 0 });
        }
      });
      for (const e of en) Object.assign(e, { state: 'ok', st: 0, spin: 0, alpha: 1, seed: Math.random() * 99 });
      Object.assign(g, {
        L, en, rocks, a: { x: 150, y: 260, vx: 0, vy: 0, fx: 1, fy: 0, dizzy: 0, inv: 0, dart: 0 }, cam: 0,
        pearl: { held: true, x: 0, y: 0, vy: 0, cool: 0 }, inkN: 4, inkMax: 4, inkT: 0, blobs: [], clouds: [],
        bumps: 0, hits: 0, inks: 0, pops: [], home: L - 300, delivered: 0, seen: {}, factQ: [], fact: null, factsShown: 0,
        target: null, pearlDrops: 0, noPearlSaid: 0, par: L / 260 + 1.5 * plan.filter(p => p === 'gate').length + 2,
      });
      g.say = "Bring the pearl to Olive! Swim with the arrows. Press space to squirt ink!";
    },
    start(g) { speak(g.say); this.fact(g, 'swim', 3.5); },
    fact(g, key, delay = 0) { if (g.seen[key]) return; g.seen[key] = 1; g.factQ.push({ key, delay }); },
    bump(g, e, stun, dropAlways) {
      const a = g.a, ang = Math.atan2(a.y - e.y, a.x - e.x);
      a.vx = Math.cos(ang) * 380; a.vy = Math.sin(ang) * 380 - 60;
      a.dizzy = stun; a.inv = 1.5; g.bumps++; g.target = null;
      SFX.miss(); tone(300, 0.2, 'sine', 0.07, 0, 160);
      g.pops.push({ x: a.x, y: a.y - 70, str: pick(['Oof!', 'Bonk!', 'Whoa!', 'Eek!']), life: 1.2, col: '#ffe46a' });
      if (g.pearl.held && (dropAlways || g.bumps % 2 === 0)) {
        Object.assign(g.pearl, { held: false, x: a.x + 30, y: a.y, vx: -Math.cos(ang) * 120, vy: -80, cool: 0.8 });
        g.pearlDrops++;
        g.pops.push({ x: a.x + 30, y: a.y - 40, str: 'Oops! The pearl!', life: 1.6, col: '#fff' });
        if (g.pearlDrops === 1) speak('Oops, you dropped the pearl! Swim back and grab it.');
      }
    },
    squirt(g, dx, dy) {
      const a = g.a;
      if (g.inkN < 1) { SFX.blip(); return; }
      const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      g.inkN--; g.inks++;
      g.blobs.push({ x: a.x + dx * 30, y: a.y + 10 + dy * 30, vx: dx * 600 + a.vx * 0.3, vy: dy * 600 + a.vy * 0.3, life: 0.6, r: 12 });
      a.vx -= dx * 140; a.vy -= dy * 140; // a little jet recoil
      tone(220, 0.16, 'sine', 0.09, 0, 90); noise(0.1, 0.03);
      this.fact(g, 'ink');
    },
    update(g, dt, id) {
      g.pops = g.pops || [];
      const a = g.a, t = g.t;
      a.dizzy = Math.max(0, a.dizzy - dt); a.inv = Math.max(0, a.inv - dt); a.dart = Math.max(0, a.dart - dt);
      // the ink meter refills drop by drop
      if (g.inkN < g.inkMax && (g.inkT += dt) > 0.9) { g.inkT = 0; g.inkN++; }
      // --- input ---
      let ix = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), iy = ((keys.arrowdown || keys.s) ? 1 : 0) - ((keys.arrowup || keys.w) ? 1 : 0);
      if (ix || iy) g.target = null;
      if (pointer.clicked && pointer.y > 62 && !id && !g.delivered) {
        const wx = pointer.x + g.cam, wy = pointer.y;
        const near = g.en.find(e => e.state === 'ok' && Math.hypot(this.ex(e) - wx, this.ey(e) - wy) < (e.type === 'puffer' ? e.r : e.r) + 34);
        if (near) this.squirt(g, this.ex(near) - a.x, this.ey(near) - (a.y + 10));
        else if (Math.hypot(wx - a.x, wy - a.y) < 40) this.squirt(g, a.fx, a.fy);
        else g.target = [wx, wy];
      } else if (pointer.down && g.target && pointer.y > 62) g.target = [pointer.x + g.cam, pointer.y];
      if (g.target) {
        const dx = g.target[0] - a.x, dy = g.target[1] - a.y, d = Math.hypot(dx, dy);
        if (d < 18 && !pointer.down) g.target = null; else if (d > 8) { ix = dx / d; iy = dy / d; }
      }
      if (a.dizzy > 0 || g.delivered) { ix = 0; iy = 0; }
      const il = Math.hypot(ix, iy);
      if (il) {
        ix /= il; iy /= il; a.fx = ix; a.fy = iy;
        a.vx += ix * SQ.ACC * dt; a.vy += iy * SQ.ACC * dt;
      }
      // a fresh press of a direction is a jet dart
      const fresh = pressed.arrowleft || pressed.arrowright || pressed.arrowup || pressed.arrowdown || pressed.a || pressed.d || pressed.w || pressed.s;
      if (fresh && il && a.dart <= 0 && a.dizzy <= 0) {
        a.vx += ix * 200; a.vy += iy * 200; a.dart = 0.35;
        tone(500, 0.1, 'sine', 0.05, 0, 900);
        burst(a.x - ix * 30, a.y + 40, 5, { kind: 'bubble', world: true, spread: 50, up: 20, size: [2, 4] });
      }
      if (pressed[' '] && !g.delivered && a.dizzy <= 0) this.squirt(g, a.fx, a.fy);
      const sp = Math.hypot(a.vx, a.vy), mx = SQ.MAXV + (a.dart > 0 ? 160 : 0) + (a.inv > 1.1 ? 200 : 0);
      if (sp > mx) { a.vx *= mx / sp; a.vy *= mx / sp; }
      const drag = Math.exp(-(il ? 1.2 : 1.9) * dt); a.vx *= drag; a.vy *= drag;
      a.x += a.vx * dt; a.y += a.vy * dt;
      a.x = clamp(a.x, 50, g.L - 110); a.y = clamp(a.y, SQ.TOP + 95, SQ.FLOOR - 64);
      if (a.y <= SQ.TOP + 95 || a.y >= SQ.FLOOR - 64) a.vy *= 0.5;
      // rocks are solid: slide out of them (swimming into a rock face nudges her toward the gap)
      for (const r of g.rocks) {
        const cx = clamp(a.x, r.x - r.w / 2, r.x + r.w / 2), cy = clamp(a.y, r.y0, r.y1), dx = a.x - cx, dy = a.y - cy, d = Math.hypot(dx, dy);
        if (d < SQ.R) {
          if (d > 0.01) { a.x = cx + dx / d * SQ.R; a.y = cy + dy / d * SQ.R; if (Math.abs(dx) > Math.abs(dy)) { a.vx *= -0.3; a.vy += Math.sign(r.gy - a.y) * 900 * dt; } else a.vy *= -0.3; }
          else { a.x = a.x < r.x ? r.x - r.w / 2 - SQ.R : r.x + r.w / 2 + SQ.R; a.vx = 0; }
        }
      }
      if (Math.hypot(a.vx, a.vy) > 120 && Math.random() < dt * 8) burst(a.x - a.vx * 0.12, a.y + 40, 1, { kind: 'bubble', world: true, spread: 20, up: 20, size: [2, 3] });
      g.cam = clamp(a.x - 330, 0, g.L - W);

      // --- ink blobs ---
      for (const b of g.blobs) {
        // kind ink: it curves gently toward a creature it's nearly pointing at
        let best = null, bd = 230;
        for (const e of g.en) { if (e.state !== 'ok') continue; const dx = this.ex(e) - b.x, dy = this.ey(e) - b.y, d = Math.hypot(dx, dy); if (d < bd && dx * b.vx + dy * b.vy > 0) { bd = d; best = [dx / d, dy / d]; } }
        if (best) { const v = Math.hypot(b.vx, b.vy); b.vx += best[0] * v * 4 * dt; b.vy += best[1] * v * 4 * dt; const v2 = Math.hypot(b.vx, b.vy); b.vx *= v / v2; b.vy *= v / v2; }
        b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.exp(-1.5 * dt); b.vy *= Math.exp(-1.5 * dt); b.life -= dt; b.r += 14 * dt;
        if (Math.random() < dt * 30) g.clouds.push({ x: b.x, y: b.y, r: rand(5, 10), life: 0.8, max: 0.8 });
        for (const e of g.en) {
          if (e.state !== 'ok' || b.life <= 0) continue;
          if (Math.hypot(this.ex(e) - b.x, this.ey(e) - b.y) < e.r + b.r + 4) { b.life = 0; this.inked(g, e); }
        }
        if (b.life <= 0) for (let i = 0; i < 8; i++) g.clouds.push({ x: b.x + rand(-16, 16), y: b.y + rand(-16, 16), r: rand(10, 20), life: 1.2, max: 1.2 });
      }
      g.blobs = g.blobs.filter(b => b.life > 0);
      for (const c of g.clouds) { c.life -= dt; c.r += 10 * dt; }
      g.clouds = g.clouds.filter(c => c.life > 0);

      // --- creatures ---
      for (const e of g.en) {
        e.st += dt;
        if (e.state === 'dazed') { e.spin += dt * 9; if (e.st > 1.3) { e.state = e.after; e.st = 0; } }
        if (e.state === 'away') { e.y -= 60 * dt; e.x += 40 * dt; e.alpha = Math.max(0, e.alpha - dt * 0.5); e.spin += dt * 2; }
        if (e.state === 'asleep') { e.spin *= Math.exp(-6 * dt); if (e.type !== 'eel' && e.gyS != null) e.y = Math.min(e.gyS, e.y + 70 * dt); }
        if (e.type === 'eel') {
          if (e.state === 'ok') { e.cyc = (e.cyc + dt) % 3.4; const c = e.cyc; e.out = c < 1.5 ? 0 : c < 1.8 ? (c - 1.5) / 0.3 : c < 3.1 ? 1 : 1 - (c - 3.1) / 0.3; }
          else if (e.state !== 'dazed') e.out = Math.max(0.12, e.out - dt * 2);
        }
        if (e.state !== 'ok') continue;
        const near = Math.abs(e.x - a.x) < 480;
        if (near) this.fact(g, e.type);
        if (e.type === 'crab') {
          e.x += e.sp * dt; if (Math.abs(e.x - e.x0) > 100) { e.sp = -e.sp; e.x = e.x0 + Math.sign(e.x - e.x0) * 100; }
          e.look = Math.sign(a.x - e.x);
          // crabs hop up to pinch when she swims over them
          e.hop -= dt;
          if (e.y >= e.gy && Math.abs(a.x - e.x) < 80 && a.y > 200 && e.hop <= 0) { e.vy = -430; e.hop = 1.6; }
          e.vy += 760 * dt; e.y = Math.min(e.gy, e.y + e.vy * dt);
        }
        if (e.type === 'jelly') { e.y = e.y0 + Math.sin(t * 0.9 + e.ph) * 80; e.x = e.x0 + Math.sin(t * 0.5 + e.ph) * 30; }
        if (e.type === 'lobster') {
          const chase = Math.abs(a.x - e.x) < 380 && Math.abs(a.x - e.x0) < 560 && a.inv <= 0.2;
          const tx = chase ? a.x : e.x0, ty = chase ? a.y + 20 : e.y0, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
          if (d > 4) { const v = chase ? e.sp : 70; e.x += dx / d * v * dt; e.y += dy / d * v * dt; }
          e.y = clamp(e.y, SQ.TOP + 60, SQ.FLOOR - 30);
          if (Math.abs(dx) > 6) e.face = Math.sign(dx);
          if (chase && !e.grr) { e.grr = 1; g.pops.push({ x: e.x, y: e.y - 50, str: 'Grrr! My reef!', life: 1.6, col: '#ffb0a0' }); }
        }
        if (e.type === 'puffer') {
          const want = Math.abs(a.x - e.x) < 320 ? 1 : 0;
          if (want && !e.puff) { SFX.pop(); tone(200, 0.3, 'sine', 0.06, 0, 500); }
          e.puff = clamp(e.puff + (want ? 4 : -1) * dt, 0, 1);
          e.r = lerp(e.r0, e.rBig, e.puff);
        }
        // touching a creature: puffers are a squishy wall, the rest give a gentle bonk
        if (e.type === 'eel') {
          const [, ty] = eelTip(e), lo = Math.min(ty, e.base), hi = Math.max(ty, e.base);
          if (e.out > 0.3 && Math.abs(a.x - e.x) < SQ.R + e.r && a.y + 10 > lo - SQ.R && a.y - 10 < hi + SQ.R && a.inv <= 0) this.bump(g, { x: e.x, y: ty }, 0.6, false);
          continue;
        }
        const d = Math.hypot(a.x - e.x, a.y + 10 - e.y);
        if (e.type === 'puffer') {
          if (d < e.r + SQ.R) {
            const nx = (a.x - e.x) / (d || 1), ny = (a.y + 10 - e.y) / (d || 1);
            a.x = e.x + nx * (e.r + SQ.R); a.y = e.y - 10 + ny * (e.r + SQ.R);
            a.vx = nx * 260; a.vy = ny * 260; tone(160, 0.15, 'sine', 0.06, 0, 320);
            if (!e.bonked) { e.bonked = 1; g.bumps++; g.pops.push({ x: e.x, y: e.y - e.r - 20, str: 'Boing! Squirt ink at me!', life: 1.8, col: '#fff' }); speak('Boing! The pufferfish is blocking the way. Squirt ink at it!'); }
          }
        } else if (d < e.r + SQ.R - 4 && a.inv <= 0) this.bump(g, e, e.type === 'jelly' ? 1.1 : 0.55, e.type === 'lobster');
      }

      // --- the pearl ---
      const p = g.pearl;
      if (!p.held) {
        p.cool -= dt; p.vx *= Math.exp(-2 * dt); p.vy += (30 - p.vy) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.y = Math.min(p.y, SQ.FLOOR - 26); p.x = clamp(p.x, 60, g.L - 120);
        for (const r of g.rocks) if (Math.abs(p.x - r.x) < r.w / 2 + 16 && p.y > r.y0 - 16 && p.y < r.y1 + 16) { p.x = p.x < r.x ? r.x - r.w / 2 - 16 : r.x + r.w / 2 + 16; p.vx = 0; }
        if (!p.home && p.cool <= 0 && Math.hypot(a.x + 20 - p.x, a.y + 10 - p.y) < 50) { p.held = true; SFX.sparkle(); g.pops.push({ x: a.x, y: a.y - 70, str: 'Got it!', life: 1.2, col: '#fff6a8' }); }
      }
      // --- reaching Olive ---
      if (!g.delivered && a.x > g.home - 110) {
        if (p.held) {
          g.delivered = 0.001; p.held = false; Object.assign(p, { x: g.home + 34, y: SQ.FLOOR - 40, vx: 0, vy: 0, home: true });
          SFX.fanfare(); burst(g.home - g.cam, 380, 30, { colors: ['#fff6a8', '#ffb3e0', '#ffffff'] });
          g.factQ = []; g.fact = null; speak(`Hooray! Olive's pearl is home! ${FACTS.arms}`); g.fact = { key: 'arms', txt: FACTS.arms, life: 5 };
        } else if (t - g.noPearlSaid > 5) { g.noPearlSaid = t; speak('Olive says: where is my pearl? Go back and get it!'); g.pops.push({ x: g.home, y: 250, str: 'Where is my pearl?', life: 2, col: '#fff' }); }
      }
      if (p.home) p.y = SQ.FLOOR - 40;
      if (g.delivered && (g.delivered += dt) > 3) g.done = true;
      // halfway: one more squid fact
      if (a.x > g.L / 2) this.fact(g, 'hearts');
      // --- fact banners, one at a time ---
      if (g.fact) { if ((g.fact.life -= dt) <= 0) g.fact = null; }
      else if (g.factQ.length && (g.factQ[0].delay -= dt) <= 0) {
        const f = g.factQ.shift(); g.fact = { key: f.key, txt: FACTS[f.key], life: 4.6 }; g.factsShown++;
        speak(g.fact.txt); SFX.sparkle();
      }
      for (const q of g.pops) { q.life -= dt; q.y -= 24 * dt; }
      g.pops = g.pops.filter(q => q.life > 0);

      const prog = clamp((a.x - 150) / (g.home - 260), 0, 1);
      g.progress = g.delivered ? 'Pearl home! 🎉' : `To Olive: ${Math.round(prog * 100)}%${p.held ? '' : '  (get the pearl!)'}`;
      const slow = clamp((t - g.par) / g.par, 0, 1) * 0.4;
      const skill = clamp(1 - g.bumps * 0.08 - slow, 0.35, 1);
      g.score = g.delivered ? skill : skill * 0.5 * prog;
    },
    ex: e => e.x,
    ey: e => e.type === 'eel' ? (e.base + eelTip(e)[1]) / 2 + e.dir * 40 : e.y,
    inked(g, e) {
      e.state = 'dazed'; e.st = 0; g.hits++;
      e.after = e.type === 'jelly' || e.type === 'puffer' ? 'away' : 'asleep';
      if (e.type === 'crab') e.gyS = e.gy; if (e.type === 'lobster') e.gyS = SQ.FLOOR - 30;
      if (e.type === 'eel') e.inkY = this.ey(e);
      SFX.pop(); tone(700, 0.25, 'sine', 0.06, 0.05, 260);
      g.pops.push({ x: this.ex(e), y: this.ey(e) - e.r - 24, str: pick(['Blub?!', 'Blub?!', 'Huh?!', 'Blub blub?!']), life: 1.5, col: '#fff' });
      burst(this.ex(e), this.ey(e), 10, { colors: ['#3a2a5a', '#5a3a8a', '#2a1a4a'], world: true, spread: 90, up: 20 });
      for (let i = 0; i < 6; i++) g.clouds.push({ x: this.ex(e) + rand(-20, 20), y: this.ey(e) + rand(-20, 20), r: rand(12, 22), life: 1.2, max: 1.2 });
      if (e.type === 'puffer' && !g.puffSaid) { g.puffSaid = 1; speak('Blub?! The pufferfish floats away. The way is open!'); }
    },
    draw(g) {
      const cam = g.cam, t = S.t, a = g.a;
      // open water, with light from above
      const sea = ctx.createLinearGradient(0, 0, 0, H);
      sea.addColorStop(0, '#3ed6e6'); sea.addColorStop(0.5, '#1a8acc'); sea.addColorStop(1, '#1a4a9a');
      ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = `rgba(230,255,255,${0.06 + 0.04 * Math.sin(t * 0.8 + i * 1.7)})`;
        const x = ((i * 170 - cam * 0.15) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 140, SQ.FLOOR); ctx.lineTo(x - 10, SQ.FLOOR); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.16)'; for (let i = 0; i < 12; i++) ellipse(((i * 97 - cam * 0.1) % W + W) % W, 6 + (i % 3) * 6, 40, 3);
      // far reef silhouettes (slow parallax)
      ctx.fillStyle = 'rgba(40,90,170,.55)';
      for (let i = -1; i < 9; i++) {
        const span = 260, base = Math.floor(cam * 0.3 / span) + i, x = base * span - cam * 0.3;
        const h = 90 + hsh(base) * 120;
        ctx.beginPath(); ctx.moveTo(x - 30, SQ.FLOOR); ctx.quadraticCurveTo(x + 40, SQ.FLOOR - h * 1.4, x + 130, SQ.FLOOR - h); ctx.quadraticCurveTo(x + 220, SQ.FLOOR - h * 0.6, x + span + 30, SQ.FLOOR); ctx.fill();
      }
      // mid kelp forest
      for (let i = -1; i < 12; i++) {
        const span = 110, base = Math.floor(cam * 0.6 / span) + i, x = base * span - cam * 0.6 + hsh(base + 50) * 40;
        kelp(x, SQ.FLOOR, 130 + hsh(base + 3) * 150, hsh(base) > 0.5 ? 'rgba(47,154,138,.8)' : 'rgba(63,174,122,.8)', base);
      }
      // the sandy floor (moves with the world)
      ctx.fillStyle = '#f2d89a';
      ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 40; x += 40) ctx.lineTo(x, SQ.FLOOR - 6 + Math.sin((x + cam) * 0.012) * 8); ctx.lineTo(W, H); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); for (let x = 0; x <= W + 40; x += 40) ctx.lineTo(x, SQ.FLOOR - 6 + Math.sin((x + cam) * 0.012) * 8); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,160,90,.5)'; ctx.lineWidth = 2;
      // world-space props, only the ones on screen
      const from = Math.floor(cam / 120) - 1, to = Math.floor((cam + W) / 120) + 1;
      for (let i = from; i <= to; i++) {
        const x = i * 120 + hsh(i) * 60 - cam, k = hsh(i + 17);
        ctx.strokeStyle = 'rgba(200,160,90,.5)'; ctx.beginPath(); ctx.moveTo(x, SQ.FLOOR + 30 + k * 30); ctx.quadraticCurveTo(x + 20, SQ.FLOOR + 24 + k * 30, x + 40, SQ.FLOOR + 30 + k * 30); ctx.stroke();
        if (k < 0.3) coral(x + 30, SQ.FLOOR + 4, 0.7 + k, ['#ff8a5a', '#ff6fb5', '#b07aff', '#ffb43a'][i & 3]);
        else if (k < 0.5) anem(x + 20, SQ.FLOOR + 4, ['#ff9acb', '#7fe0ff', '#ffd23f'][(i >>> 0) % 3]);
        else if (k < 0.65) seaStar(x, SQ.FLOOR + 40, 10, ['#ff8a5a', '#ffd23f', '#ff6fb5'][(i >>> 0) % 3]);
        else if (k < 0.8) inkEllipse(x, SQ.FLOOR + 44, 9, 6, 0, ['#d8c8b0', '#c8b8e0', '#e8d8c0'][(i >>> 0) % 3], 1);
      }
      // Olive's home at the end: a glowing grotto door and her big open clam
      const hx = g.home - cam;
      if (hx > -300 && hx < W + 300) {
        const gl = ctx.createRadialGradient(hx + 60, SQ.FLOOR - 140, 10, hx + 60, SQ.FLOOR - 140, 220);
        gl.addColorStop(0, 'rgba(255,240,170,.75)'); gl.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = gl; ctx.fillRect(hx - 200, SQ.FLOOR - 380, 520, 380);
        ink(P2(`M${hx - 10},${SQ.FLOOR + 6} L${hx - 10},${SQ.FLOOR - 200} C${hx - 10},${SQ.FLOOR - 330} ${hx + 230},${SQ.FLOOR - 330} ${hx + 230},${SQ.FLOOR - 200} L${hx + 230},${SQ.FLOOR + 6} L${hx + 190},${SQ.FLOOR + 6} L${hx + 190},${SQ.FLOOR - 200} C${hx + 190},${SQ.FLOOR - 280} ${hx + 30},${SQ.FLOOR - 280} ${hx + 30},${SQ.FLOOR - 200} L${hx + 30},${SQ.FLOOR + 6} Z`), '#8a7ac8', 2);
        ctx.fillStyle = 'rgba(255,248,200,.5)'; ctx.beginPath(); ctx.moveTo(hx + 30, SQ.FLOOR + 6); ctx.lineTo(hx + 30, SQ.FLOOR - 200); ctx.bezierCurveTo(hx + 30, SQ.FLOOR - 280, hx + 190, SQ.FLOOR - 280, hx + 190, SQ.FLOOR - 200); ctx.lineTo(hx + 190, SQ.FLOOR + 6); ctx.fill();
        for (let i = 0; i < 7; i++) { const ang = Math.PI + i / 6 * Math.PI; inkCircle(hx + 110 + Math.cos(ang) * 120, SQ.FLOOR - 200 + Math.sin(ang) * 110, 7, ['#ff9acb', '#7fe0ff', '#ffd23f', '#b07aff'][i % 4], 1); }
        // the clam, open and waiting for its pearl
        ink(P2(`M${hx + 12},${SQ.FLOOR - 30} C${hx + 14},${SQ.FLOOR - 80} ${hx + 84},${SQ.FLOOR - 80} ${hx + 86},${SQ.FLOOR - 34} Z`), '#ffb8d8', 1.6);
        ink(P2(`M${hx + 6},${SQ.FLOOR - 28} C${hx + 20},${SQ.FLOOR + 6} ${hx + 80},${SQ.FLOOR + 6} ${hx + 92},${SQ.FLOOR - 28} Z`), '#ff9ac8', 1.6);
        ctx.strokeStyle = 'rgba(160,60,110,.5)'; ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(hx + 49, SQ.FLOOR - 34); ctx.lineTo(hx + 49 + k * 14, SQ.FLOOR - 70); ctx.stroke(); }
        drawCritter('Olive the Octopus', hx + 150, SQ.FLOOR + 22, 0.36, -1);
      }
      // rock gates
      for (const r of g.rocks) if (r.x - cam > -100 && r.x - cam < W + 100) {
        rockCol(r.x - cam, r.y0, r.y1, r.w, r.x);
        const tipY = r.y0 < SQ.TOP ? r.y1 : r.y0;
        if (r.y0 < SQ.TOP) seaStar(r.x - cam + 18, r.y1 - 24, 9, '#ffd23f'); else { anem(r.x - cam - 14, tipY + 6, '#ff9acb'); }
      }
      // creatures
      for (const e of g.en) {
        const ex = e.x - cam;
        if (ex < -150 || ex > W + 150 || e.alpha <= 0) continue;
        ctx.save(); ctx.globalAlpha = e.alpha;
        const cy = e.type === 'eel' ? e.base : e.y;
        if (e.spin && e.type !== 'eel') { ctx.translate(ex, cy); ctx.rotate(e.spin); ctx.translate(-ex, -cy); }
        DRAW[e.type]({ ...e, x: ex }, t);
        if (e.state !== 'ok') {
          const sx = ex, sy = e.type === 'eel' ? eelTip(e)[1] : e.y;
          splat(sx + (e.type === 'puffer' ? e.r * 0.3 : 6), sy + (e.type === 'jelly' ? -10 : 2), Math.min(e.r, 30) * 0.75, e.seed);
        }
        ctx.restore();
        if (e.state === 'dazed') for (let i = 0; i < 3; i++) { const an = t * 6 + i * 2.1, sy = e.type === 'eel' ? eelTip(e)[1] : e.y; star(ex + Math.cos(an) * (e.r + 6), sy - e.r - 8 + Math.sin(an) * 6, 6, '#ffe46a', 5); }
        if (e.state === 'asleep') zzz(ex + 20, (e.type === 'eel' ? eelTip(e)[1] : e.y) - 30, t + e.seed);
        // a little hint over a puffed-up puffer
        if (e.type === 'puffer' && e.state === 'ok' && e.puff > 0.9 && Math.abs(a.x - e.x) < 260) outlined('Ink me!', ex, e.y - e.r - 24 + Math.sin(t * 4) * 3, 18, '#fff6a8');
      }
      // ink clouds and blobs
      for (const c of g.clouds) { ctx.fillStyle = `rgba(36,22,64,${0.55 * c.life / c.max})`; circle(c.x - cam, c.y, c.r); }
      for (const b of g.blobs) { inkCircle(b.x - cam, b.y, b.r, '#2e1d50', 1.2); ctx.fillStyle = 'rgba(255,255,255,.4)'; circle(b.x - cam - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.25); }
      // the dropped pearl, with a bobbing arrow so it's easy to find
      const p = g.pearl;
      if (!p.held) {
        drawPearl(p.x - cam, p.y, 11);
        if (!p.home) {
          const px = clamp(p.x - cam, 40, W - 40);
          outlined('▼', px, p.y - 34 + Math.sin(t * 5) * 4, 22, '#fff6a8');
          if (p.x - cam < 20) outlined('◀ pearl', 70, 300, 20, '#fff6a8');
        }
      }
      // Aubrey the squid (blinking while she can't be bumped)
      if (!(a.inv > 0 && a.inv < 1.3 && Math.floor(a.inv * 10) % 2)) drawSquidAubrey(a.x - cam, a.y + 22, t, a.vx, a.vy, g.pearl.held, a.dizzy > 0);
      drawFx(true, cam);
      for (const q of g.pops) { ctx.globalAlpha = clamp(q.life, 0, 1); outlined(q.str, q.x - cam, q.y, 22, q.col); }
      ctx.globalAlpha = 1;
      // tap target marker
      if (g.target) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.target[0] - cam, g.target[1], 10 + Math.sin(t * 8) * 2, 0, 6.3); ctx.stroke(); }
      // the ink meter
      darkPanel(14, H - 54, 196, 42, 18);
      text('Ink', 30, H - 33, 16, '#fff', 'left', 700);
      for (let i = 0; i < g.inkMax; i++) {
        const x = 78 + i * 34, y = H - 33, full = i < g.inkN, part = i === g.inkN ? g.inkT / 0.9 : 0;
        ink(P2(`M${x},${y - 13} C${x + 11},${y - 1} ${x + 10},${y + 11} ${x},${y + 11} C${x - 10},${y + 11} ${x - 11},${y - 1} ${x},${y - 13} Z`), full ? '#3a2266' : 'rgba(255,255,255,.18)', 1.2, '#e8dcff');
        if (part > 0) { ctx.fillStyle = 'rgba(90,60,150,.8)'; circle(x, y + 4, 6 * part); }
      }
      // sea fact banner
      if (g.fact) {
        ctx.globalAlpha = clamp(g.fact.life * 2, 0, 1);
        panel(W / 2 - 330, 64, 660, 54, 20);
        emoji(g.fact.key === 'swim' || g.fact.key === 'ink' || g.fact.key === 'hearts' || g.fact.key === 'arms' ? '🦑' : { crab: '🦀', jelly: '🪼', puffer: '🐡', eel: '🐍', lobster: '🦞' }[g.fact.key], W / 2 - 296, 91, 28);
        text('Sea fact!', W / 2 - 270, 80, 14, '#e0603a', 'left', 800);
        const lines = wrap(g.fact.txt, 560, 18);
        lines.forEach((ln, i) => text(ln, W / 2 - 270, 100 + i * 18 - (lines.length - 1) * 6, 18, '#5a2a6e', 'left', 700));
        ctx.globalAlpha = 1;
      }
    },
  };

  restage('grotto', {
    games: [['bubbleshot', 'moonbeam', {}], ['squidquest', 'silk', {}]],
    mid: [
      "N:Glub! Oh no, I lost my best pearl, and the grumpy reef critters won't let anyone bring it home! Would you be a squid and swim it back to me? Squirt ink if they get in your way!",
      'A:excited:I can be a squid! Squirt, squirt, zoom!',
    ],
  });
}
