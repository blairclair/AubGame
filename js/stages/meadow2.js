'use strict';
// Buttercup Meadow, game 2: Bug Detective. Meadow critters crawl onto a big sunny leaf one at a time.
// Aubrey looks through a magnifying glass, taps each leg to count it and taps each body part, then puts
// the critter on the right page of Flutter's Bug Book: an INSECT has 6 legs and 3 body parts
// (head, thorax, abdomen); spiders have 8 legs and 2 parts; some critters have lots of legs; some have none.
{
  const CX = 372, CY = 268;          // where critters stop on the big leaf
  const STAGE_B = 408;               // below this are the Bug Book pages
  const CLS = [
    { id: 'insect', name: 'Insect', hint: '6 legs, 3 parts', col: '#ff8fb8', mini: 'ladybird', ms: 0.36 },
    { id: 'spider', name: 'Spider family', hint: '8 legs, 2 parts', col: '#b48ae8', mini: 'spider', ms: 0.27 },
    { id: 'lots', name: 'Lots of legs', hint: 'more than 8 legs', col: '#ffad5a', mini: 'centipede', ms: 0.2 },
    { id: 'none', name: 'No legs', hint: '0 legs', col: '#6cc0f0', mini: 'snail', ms: 0.3 },
  ];
  const CARD = i => ({ x: 24 + i * 228, y: 416, w: 216, h: 112 });
  const LEG = '#4a3048', LEG_ON = '#ffcf3a';
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const dseg = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1);
    return Math.hypot(px - ax - dx * t, py - ay - dy * t);
  };

  // ---------------------------------------------------------------- critter shapes (local coords, facing +x)
  function insectLegs(xs, ay, L = 1, big = false) {
    const legs = [];
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = xs[i];
      let k, f;
      if (i === 0) { k = [x + 18 * L, ay + 24 * L]; f = [x + 40 * L, ay + 46 * L]; }
      else if (i === 1) { k = [x + 4 * L, ay + 36 * L]; f = [x - 8 * L, ay + 62 * L]; }
      else if (big) { k = [x - 4, ay + 36]; f = [x - 84, ay + 30]; }
      else { k = [x - 16 * L, ay + 32 * L]; f = [x - 48 * L, ay + 54 * L]; }
      legs.push({ a: [x, ay * sd], k: [k[0], k[1] * sd], f: [f[0], f[1] * sd], grp: (i % 2 === 0) === (sd > 0) ? 0 : 1, lw: big && i === 2 ? 7 : 4.6 });
    }
    return legs;
  }
  const antPair = (x, y, kx, ky, ex, ey) => [-1, 1].map(s => ({ a: [x, y * s], k: [kx, ky * s], f: [ex, ey * s] }));
  const part = (x, rx, ry, col, label) => ({ x, y: 0, rx, ry, col, label });

  const KINDS = {
    ladybird: { cls: 'insect', fact: 'A ladybird is an insect!', b: () => ({
      parts: [part(-6, 38, 35, '#ff4a3d', 'abdomen'), part(34, 12, 23, '#2a2230', 'thorax'), part(53, 12, 13, '#2a2230', 'head')],
      legs: insectLegs([38, 28, 18], 15, 0.88), ants: antPair(60, 6, 70, 14, 76, 24), eye: [56, 5, 4.5] }) },
    bee: { cls: 'insect', fact: 'A bee is an insect!', b: () => ({
      parts: [part(-28, 34, 25, '#ffcf3a', 'abdomen'), part(14, 20, 20, '#d39a4a', 'thorax'), part(46, 15, 15, '#3a2a2a', 'head')],
      legs: insectLegs([22, 14, 6], 14, 0.9), ants: antPair(56, 6, 68, 14, 80, 14), eye: [50, 7, 5.5],
      wings: [-1, 1].map(s => ({ x: -6, y: 30 * s, rx: 32, ry: 14, rot: 0.45 * s })) }) },
    ant: { cls: 'insect', fact: 'An ant is an insect!', b: () => ({
      parts: [part(-36, 28, 21, '#c8553a', 'abdomen'), part(4, 19, 10, '#b84a32', 'thorax'), part(42, 17, 16, '#c8553a', 'head')],
      legs: insectLegs([12, 4, -4], 7, 1.05), ants: antPair(56, 8, 70, 10, 84, 28), eye: [48, 8, 5] }) },
    grasshopper: { cls: 'insect', fact: 'A grasshopper is an insect!', b: () => ({
      parts: [part(-42, 50, 16, '#86d24e', 'abdomen'), part(20, 21, 17, '#62b23c', 'thorax'), part(54, 16, 14, '#86d24e', 'head')],
      legs: insectLegs([30, 20, 10], 13, 0.95, true), ants: antPair(64, 6, 92, 14, 122, 10), eye: [58, 8, 5.5] }) },
    beetle: { cls: 'insect', fact: 'A beetle is an insect!', b: () => ({
      parts: [part(-10, 38, 30, '#3cb27c', 'abdomen'), part(34, 13, 22, '#2f8f62', 'thorax'), part(53, 12, 12, '#256f4e', 'head')],
      legs: insectLegs([36, 26, 16], 15, 0.95), ants: antPair(60, 5, 70, 12, 78, 20), eye: [56, 5, 4.2] }) },
    spider: { cls: 'spider', fact: 'A spider is NOT an insect. Spiders have eight legs!', s: 1.1, b: () => {
      const legs = [];
      for (const sd of [-1, 1]) [30, 70, 112, 150].forEach((deg, i) => {
        const a = deg * Math.PI / 180, ax = 20 + Math.cos(a) * 12, ay = Math.sin(a) * 10;
        const ka = a - 0.24, fa = a + 0.14;
        legs.push({ a: [ax, ay * sd], k: [ax + Math.cos(ka) * 52, (ay + Math.sin(ka) * 52) * sd], f: [ax + Math.cos(fa) * 96, (ay + Math.sin(fa) * 96) * sd], grp: (i % 2) ^ (sd > 0 ? 1 : 0), lw: 4.6 });
      });
      return { parts: [part(-34, 34, 29, '#a8743e', 'abdomen'), part(20, 25, 21, '#7e5532', 'head and chest')], legs, ants: [], eye: [34, 7, 5] };
    } },
    woodlouse: { cls: 'lots', fact: 'A woodlouse has fourteen legs. It is related to crabs!', b: () => {
      const legs = [];
      for (const sd of [-1, 1]) for (let i = 0; i < 7; i++) { const x = 40 - i * 13; legs.push({ a: [x, 22 * sd], k: [x + 2, 38 * sd], f: [x - 5, 47 * sd], grp: (i % 2) ^ (sd > 0 ? 1 : 0), lw: 4 }); }
      return { parts: [part(56, 13, 18, '#737889'), part(0, 58, 34, '#959bad')], legs, ants: antPair(64, 8, 80, 20, 92, 34), eye: [60, 7, 4], plates: true };
    } },
    centipede: { cls: 'lots', fact: 'A centipede has lots and lots of legs. It is not an insect!', s: 1.08, b: () => {
      const legs = [], parts = [];
      for (let i = 14; i >= 0; i--) parts.push(part(96 - i * 14, 9, 11, i % 2 ? '#d8763a' : '#c4652c'));
      parts.push(part(110, 11, 11, '#b8572a'));
      for (const sd of [-1, 1]) for (let i = 0; i < 15; i++) {
        const x = 96 - i * 14, last = i === 14;
        legs.push({ a: [x, 7 * sd], k: last ? [x - 12, 16 * sd] : [x + 2, 22 * sd], f: last ? [x - 36, 22 * sd] : [x - 8, 32 * sd], grp: (i % 2) ^ (sd > 0 ? 1 : 0), lw: 3.2 });
      }
      return { parts, legs, ants: antPair(118, 4, 134, 14, 152, 30), eye: [114, 5, 3.6] };
    } },
    millipede: { cls: 'lots', fact: 'A millipede has even MORE legs than a centipede!', s: 1, b: () => {
      const legs = [], parts = [];
      for (let i = 15; i >= 0; i--) parts.push(part(100 - i * 13, 9, 11, i % 2 ? '#a0663e' : '#8a5634'));
      parts.push(part(112, 10, 11, '#7a4a2c'));
      for (const sd of [-1, 1]) for (let i = 0; i < 16; i++) for (const o of [-3.4, 3.4]) {
        const x = 100 - i * 13 + o;
        legs.push({ a: [x, 8 * sd], k: [x + 1, 19 * sd], f: [x - 3, 29 * sd], grp: (i % 2) ^ (sd > 0 ? 1 : 0), lw: 2.4 });
      }
      return { parts, legs, ants: antPair(118, 5, 126, 10, 132, 18), eye: [115, 5, 3.4] };
    } },
    snail: { cls: 'none', fact: 'A snail has no legs. It slides along on one big foot!', b: () => ({
      parts: [part(14, 80, 18, '#e2c79e')], legs: [], feel: antPair(80, 6, 102, 12, 118, 26).concat(antPair(88, 3, 98, 6, 106, 10)), shell: true }) },
    slug: { cls: 'none', fact: 'A slug has no legs. It slides along on slime!', s: 1.25, b: () => ({
      parts: [part(0, 96, 22, '#ee9440'), part(34, 32, 19, '#d97a2a')], legs: [], feel: antPair(84, 6, 106, 12, 122, 26).concat(antPair(90, 3, 100, 6, 108, 10)), slime: true }) },
    worm: { cls: 'none', fact: 'A worm has no legs. It wiggles through the soil!', s: 1.3, b: () => ({ parts: [], legs: [], worm: true }) },
  };

  // body region test in local coords (for worm, the wiggly tube)
  function onBody(c, lx, ly, pad = 6) {
    if (c.worm) return Math.abs(lx) < 120 && Math.abs(ly - wormY(lx, c.wph || 0)) < 14 + pad;
    if (c.shell && Math.hypot(lx + 8, ly) < 44 + pad) return true;
    return c.parts.some(p => ((lx - p.x) / (p.rx + pad)) ** 2 + ((ly - p.y) / (p.ry + pad)) ** 2 < 1);
  }
  const wormY = (x, ph) => Math.sin(x / 26 + ph) * 9;

  function strokeLeg(p, w, col) {
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.lineTo(p[4], p[5]);
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  const olw = lw => lw + Math.min(4.4, lw * 1.2);
  const legPts = (L, ph, mv) => {
    const o = mv ? Math.sin(ph + L.grp * Math.PI) * 7 : 0;
    return [L.a[0], L.a[1], L.k[0] + o * 0.5, L.k[1], L.f[0] + o, L.f[1]];
  };

  // draw a critter in local coords. o: { ph, mv, counted (Set of leg idx), partsOn (Set), t }
  function drawBug(kind, c, o = {}) {
    const ph = o.ph || 0, mv = !!o.mv, t = o.t ?? S.t, counted = o.counted, on = o.partsOn;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // soft shadow
    ctx.fillStyle = 'rgba(40,90,20,.22)'; ellipse(6, 10, c.worm ? 120 : 70, c.worm ? 18 : 40);
    if (c.slime) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-120, 2, 60, 12); }
    // legs: outline pass, then colour pass
    c.legs.forEach(L => strokeLeg(legPts(L, ph, mv), olw(L.lw), OL));
    c.legs.forEach((L, i) => {
      const p = legPts(L, ph, mv), lit = counted && counted.has(i);
      strokeLeg(p, L.lw, lit ? LEG_ON : LEG);
      ctx.fillStyle = lit ? '#fff3a0' : '#6a4a68'; circle(p[2], p[3], L.lw * 0.45);
    });
    // feelers / antennae
    const feelers = feel => { for (const pass of [0, 1]) for (const A of feel) {
      const wig = Math.sin(t * 3 + A.f[1]) * 2;
      ctx.beginPath(); ctx.moveTo(A.a[0], A.a[1]); ctx.quadraticCurveTo(A.k[0], A.k[1], A.f[0] + wig, A.f[1]);
      ctx.strokeStyle = pass ? (c.feel ? mix(c.parts[0].col, '#000000', 0.08) : LEG) : OL; ctx.lineWidth = pass ? (c.feel ? 4.2 : 2.6) : (c.feel ? 7 : 6); ctx.stroke();
      if (pass) { ctx.fillStyle = c.feel ? '#3a2a3a' : LEG; circle(A.f[0] + wig, A.f[1], c.feel ? 4.2 : 2.6); if (c.feel) { ctx.fillStyle = '#fff'; circle(A.f[0] + wig + 1, A.f[1] - 1.2, 1.4); } }
    } };
    feelers(c.ants || []);
    if (c.worm) drawWorm(c, ph, mv, t);
    // tail bits that sit under the body
    if (c.plates) for (const s of [-1, 1]) inkEllipse(-58, 10 * s, 9, 4, 0.4 * s, '#737889', 1.6);
    // body parts, back to front, each with its own outline so the segments are easy to count
    c.parts.forEach(p => {
      inkEllipse(p.x, p.y, p.rx, p.ry, 0, p.col, 2.4);
      if (on && on.has(p)) { ctx.fillStyle = 'rgba(255,240,140,.45)'; ellipse(p.x, p.y, p.rx, p.ry); }
    });
    decor(kind, c, t);
    if (c.feel) feelers(c.feel);
    if (c.wings) for (const wg of c.wings) {
      ctx.beginPath(); ctx.ellipse(wg.x, wg.y, wg.rx, wg.ry, wg.rot, 0, TAU);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(225,245,255,.62)'; ctx.fill();
      ctx.strokeStyle = 'rgba(120,160,200,.6)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(wg.x - Math.cos(wg.rot) * wg.rx * 0.8, wg.y - Math.sin(wg.rot) * wg.rx * 0.8); ctx.lineTo(wg.x + Math.cos(wg.rot) * wg.rx * 0.7, wg.y + Math.sin(wg.rot) * wg.rx * 0.7); ctx.stroke();
    }
    if (c.eye) {
      const [ex, ey, er] = c.eye;
      for (const s of [-1, 1]) {
        inkCircle(ex, ey * s, er, '#fff', 1.1);
        ctx.fillStyle = '#2a1a2a'; circle(ex + er * 0.35, ey * s, er * 0.55);
        ctx.fillStyle = '#fff'; circle(ex + er * 0.5, ey * s - er * 0.25, er * 0.2);
      }
    }
  }
  function drawWorm(c, ph, mv, t) {
    const wp = (c.wph = (mv ? ph * 0.5 : 0) + Math.sin(t * 1.5) * 0.3);
    const pts = []; for (let x = -112; x <= 112; x += 8) pts.push([x, wormY(x, wp), 12 - Math.max(0, Math.abs(x) - 80) * 0.12]);
    for (const p of pts) { ctx.fillStyle = OL; circle(p[0], p[1], p[2] + 2.4); }
    for (const p of pts) { ctx.fillStyle = p[0] > 34 && p[0] < 62 ? '#e57a86' : '#f7a3a8'; circle(p[0], p[1], p[2]); }
    ctx.strokeStyle = 'rgba(180,80,100,.45)'; ctx.lineWidth = 1.5;
    for (const p of pts) { ctx.beginPath(); ctx.moveTo(p[0], p[1] - p[2] + 2); ctx.lineTo(p[0], p[1] + p[2] - 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.5)'; for (const p of pts) circle(p[0] - 2, p[1] - p[2] * 0.45, 2);
    const hx = 104, hy = wormY(hx, wp);
    for (const s of [-1, 1]) { inkCircle(hx, hy + 5 * s, 3.8, '#fff', 1); ctx.fillStyle = '#2a1a2a'; circle(hx + 1.4, hy + 5 * s, 2); }
  }
  function decor(kind, c, t) {
    const P = c.parts;
    if (kind === 'ladybird') {
      ctx.save(); ctx.beginPath(); ctx.ellipse(P[0].x, 0, P[0].rx, P[0].ry, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = '#2a2230';
      for (const [x, y, r] of [[-4, 16, 7], [-4, -16, 7], [-28, 12, 6], [-28, -12, 6], [16, 21, 5.5], [16, -21, 5.5], [-40, 0, 4]]) circle(x, y, r);
      ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-46, 0); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-12, -20, 12, 6, -0.3);
      ctx.fillStyle = '#fff'; circle(37, 13, 4.5); circle(37, -13, 4.5);
    } else if (kind === 'bee') {
      ctx.save(); ctx.beginPath(); ctx.ellipse(P[0].x, 0, P[0].rx, P[0].ry, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = '#3a2a2a'; ctx.fillRect(-24, -30, 10, 60); ctx.fillRect(-46, -30, 10, 60);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,240,200,.55)'; for (let i = 0; i < 9; i++) circle(14 + Math.cos(i * 1.9) * 12, Math.sin(i * 1.9) * 12, 2.2);
      ink(P2('M-62,0 L-70,-3 L-70,3 Z'), '#3a2a2a', 1);
    } else if (kind === 'ant') {
      ctx.fillStyle = 'rgba(255,255,255,.4)'; for (const p of P) ellipse(p.x - p.rx * 0.2, -p.ry * 0.4, p.rx * 0.45, p.ry * 0.22);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(57, 5 * s); ctx.lineTo(64, 2 * s); ctx.stroke(); }
    } else if (kind === 'grasshopper') {
      inkEllipse(-26, 0, 46, 8, 0, '#5ea43a', 1.2);
      ctx.strokeStyle = 'rgba(40,90,20,.5)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-70 + i * 9, -12); ctx.lineTo(-70 + i * 9, 12); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(18, -8, 12, 4);
    } else if (kind === 'beetle') {
      ctx.strokeStyle = '#1f5a40'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-46, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(190,255,220,.45)'; ellipse(-12, -15, 18, 6, -0.2); ellipse(-12, 15, 18, 6, 0.2);
      ctx.fillStyle = 'rgba(200,120,255,.25)'; ellipse(-22, 0, 10, 24);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(62, 4 * s); ctx.quadraticCurveTo(68, 4 * s, 68, 0); ctx.stroke(); }
    } else if (kind === 'spider') {
      ctx.fillStyle = '#fff4dc';
      for (const [x, y, r] of [[-20, 0, 3.4], [-32, 0, 3.8], [-44, 0, 3.4], [-56, 0, 2.8], [-32, -11, 3], [-32, 11, 3], [-46, 13, 2.4], [-46, -13, 2.4]]) circle(x, y, r);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(12, -8, 9, 5);
      ctx.fillStyle = '#2a1a2a'; for (const [x, y] of [[40, 3], [40, -3], [38, 12], [38, -12]]) circle(x, y, 1.8);
    } else if (kind === 'woodlouse') {
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 58, 34, 0, 0, TAU); ctx.clip();
      ctx.strokeStyle = '#646a7a'; ctx.lineWidth = 2.2;
      for (let i = 0; i < 8; i++) { const x = 44 - i * 12.5; ctx.beginPath(); ctx.moveTo(x, -36); ctx.quadraticCurveTo(x + 8, 0, x, 36); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(0, -16, 40, 7);
      ctx.restore();
    } else if (kind === 'centipede' || kind === 'millipede') {
      ctx.fillStyle = 'rgba(255,255,255,.3)'; for (const p of P) ellipse(p.x, -p.ry * 0.45, p.rx * 0.6, 2.2);
    } else if (kind === 'snail') {
      inkCircle(-8, 0, 42, '#f0a85a', 2.4);
      ctx.strokeStyle = '#b8682a'; ctx.lineWidth = 3.4; ctx.beginPath();
      for (let a = 0; a < TAU * 2.6; a += 0.15) { const r = 36 - a * 2.1; ctx.lineTo(-8 + Math.cos(a + t * 0.2) * r, Math.sin(a + t * 0.2) * r); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-20, -22, 12, 6, -0.6);
    } else if (kind === 'slug') {
      ctx.strokeStyle = 'rgba(150,70,20,.5)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(34, 0, 28 - i * 6, 16 - i * 3.5, 0, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(150,70,20,.35)';
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-80 + i * 14, -14); ctx.lineTo(-74 + i * 14, 0); ctx.lineTo(-80 + i * 14, 14); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-20, -12, 50, 4);
    }
  }

  // ---------------------------------------------------------------- scenery bits
  function flutter(x, y, s, flap) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const k = 0.3 + 0.7 * Math.abs(Math.cos(flap * Math.PI));
    const up = P2('M2,-4 C10,-34 44,-40 46,-16 C47,-2 26,4 2,2 Z'), lo = P2('M2,2 C22,4 36,14 30,30 C24,42 6,30 2,8 Z');
    for (const pass of [0, 1]) for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * k, 1);
      if (pass === 0) { ctx.strokeStyle = OL; ctx.lineWidth = 4.4; ctx.stroke(up); ctx.stroke(lo); }
      else {
        ctx.fillStyle = '#ff8fc8'; ctx.fill(up); ctx.fillStyle = '#ffb3da'; ctx.fill(lo);
        ctx.fillStyle = '#ffd84a'; circle(28, -16, 7); circle(18, 18, 5);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(36, -24, 3);
      }
      ctx.restore();
    }
    inkEllipse(0, 2, 4.5, 17, 0, '#4a2a6a', 1.5);
    ctx.strokeStyle = '#4a2a6a'; ctx.lineWidth = 2;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(d * 6, -26, d * 11, -30); ctx.stroke(); ctx.fillStyle = '#4a2a6a'; circle(d * 11, -30, 2.6); }
    ctx.fillStyle = '#fff'; circle(-2, -9, 1.4); circle(2, -9, 1.4);
    ctx.restore();
  }
  function daisy(x, y, r) {
    const p = new Path2D();
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; p.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.55); p.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.3, r * 0.45, r * 0.16, a, 0, TAU); }
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(p); ctx.fillStyle = '#fff'; ctx.fill(p);
    inkEllipse(x, y, r * 0.3, r * 0.2, 0, '#ffc82a', 1.4);
  }
  function drawLeaf() {
    ctx.save(); ctx.translate(CX, CY + 6); ctx.rotate(-0.04);
    ctx.fillStyle = 'rgba(40,90,30,.18)'; ellipse(10, 18, 300, 112);
    const leaf = P2('M-318,0 C-240,-128 170,-150 312,-8 C180,128 -210,124 -318,0 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(leaf); ctx.stroke(P2('M-318,0 L-350,10'));
    const gr = ctx.createLinearGradient(0, -130, 0, 120);
    gr.addColorStop(0, '#d6f59a'); gr.addColorStop(1, '#a9e070');
    ctx.fillStyle = gr; ctx.fill(leaf);
    ctx.strokeStyle = '#8ccc58'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-318, 0); ctx.quadraticCurveTo(0, -12, 300, -8); ctx.stroke();
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 7; i++) {
      const x = -250 + i * 80;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, -6 + (i * 0.4)); ctx.quadraticCurveTo(x + 30, s * 40, x + 60, s * (90 - Math.abs(i - 3) * 12)); ctx.stroke(); }
    }
    // dappled sunlight
    ctx.fillStyle = 'rgba(255,255,220,.28)';
    for (let i = 0; i < 6; i++) ellipse(-220 + i * 90 + Math.sin(S.t * 0.6 + i) * 8, -40 + (i % 3) * 36, 34, 16);
    ctx.restore();
  }
  function drawBlade(b) {
    const sw = Math.sin(S.t * 1.3 + b.ph) * 10 + b.lean, root = 424, top = root - b.h;
    const p = P2(`M${b.x - b.w},${root} Q${b.x - b.w * 0.4 + sw * 0.4},${(root + top) / 2} ${b.x + sw},${top} Q${b.x + b.w * 0.6 + sw * 0.4},${(root + top) / 2} ${b.x + b.w},${root} Z`);
    ink(p, b.col, 1.6);
  }
  function drawLens(g, x, y) {
    const R = g.lensR;
    ctx.save(); ctx.translate(x, y);
    ctx.rotate(0.75); // handle points down-right
    rrect(R + 2, -11, 64, 22, 10, OL); rrect(R + 5, -8, 58, 16, 8, '#a8642e');
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(R + 10, -5, 48, 4);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, R + 6, 0, TAU); ctx.strokeStyle = OL; ctx.lineWidth = 15; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R + 6, 0, TAU); ctx.strokeStyle = '#ffc94a'; ctx.lineWidth = 8; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R - 12, Math.PI * 1.1, Math.PI * 1.45); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 6; ctx.stroke();
  }

  // ---------------------------------------------------------------- game logic
  const legWord = n => NUM_WORDS[n] || String(n);
  function sayStep(g, extra = '') {
    const c = g.crit;
    if (g.st === 'legs') g.say = c.legs.length ? (g.idx === 0 && g.tier === 1 ? 'Look through the magnifying glass. Tap each leg to count it!' : 'Count the legs! Tap each leg.') : 'Look closely with the glass. Can you find any legs?';
    else if (g.st === 'parts') g.say = 'Now tap each body part!';
    else if (g.st === 'file') g.say = `${extra}Which page of my Bug Book?`;
  }
  function nextCritter(g) {
    g.idx++;
    if (g.idx >= g.roster.length) {
      g.st = 'end'; g.endT = 4.2; g.crit = null;
      g.say = 'Case closed! And guess what? I have six legs and three body parts too. I\'m an insect!';
      speak(g.say); SFX.fanfare();
      return;
    }
    const kind = g.roster[g.idx], K = KINDS[kind];
    g.kind = kind; g.crit = K.b(); g.crit.cls = K.cls; g.crit.fact = K.fact;
    g.cs = K.s || 1.4; g.cx = -200; g.cy = CY; g.st = 'enter'; g.walk = 0;
    g.counted = new Set(); g.partsOn = new Set(); g.partOrder = []; g.look = 0; g.tries = 0; g.hintCard = -1; g.fill = 0; g.stepT = 0;
    g.say = 'Here comes a new critter!';
  }
  function toFile(g, extra) { g.st = 'file'; sayStep(g, extra); speak(g.say); }
  function finishLegs(g) {
    const c = g.crit, n = c.legs.length;
    if (c.cls === 'lots') { g.st = 'lotsfill'; g.fill = 0; return; }
    if (!n) { SFX.sparkle(); return toFile(g, 'No legs at all! '); }
    SFX.sparkle(); burst(g.cx, g.cy - 40, 14, { colors: ['#ffcf3a', '#fff6a8'] });
    floatText(g.cx, g.cy - 110, `${n} legs!`, '#fff', false, 30);
    g.st = 'parts'; sayStep(g); speak(`${cap(legWord(n))} legs! ${g.say}`);
  }
  // world <-> local for the critter on the leaf
  const toLocal = (g, x, y) => [(x - g.cx) / g.cs, (y - g.cy) / g.cs];
  const toWorld = (g, x, y) => [g.cx + x * g.cs, g.cy + y * g.cs];

  function tapStage(g, x, y) {
    const c = g.crit; if (!c) return;
    const [lx, ly] = toLocal(g, x, y);
    if (g.st === 'legs') {
      let best = -1, bd = 22 / g.cs;
      c.legs.forEach((L, i) => { const d = Math.min(dseg(lx, ly, L.a[0], L.a[1], L.k[0], L.k[1]), dseg(lx, ly, L.k[0], L.k[1], L.f[0], L.f[1])); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) {
        if (g.counted.has(best)) { SFX.blip(); g.wig = { i: best, t: 0.4 }; return; }
        g.counted.add(best); g.legNum[best] = g.counted.size;
        const n = g.counted.size, L = c.legs[best], [fx, fy] = toWorld(g, L.f[0], L.f[1]);
        tone(392 * Math.pow(2, Math.min(n, 12) / 12), 0.18, 'triangle', 0.1); SFX.pop();
        burst(fx, fy, 6, { colors: ['#ffcf3a', '#fff'], spread: 70, up: 30, size: [2, 5] });
        speak(legWord(n));
        if (n >= c.legs.length || (c.cls === 'lots' && n >= 8)) g.stepT = 0.55;
        return;
      }
      const feel = (c.ants || []).concat(c.feel || []);
      if (feel.some(A => Math.min(dseg(lx, ly, A.a[0], A.a[1], A.k[0], A.k[1]), dseg(lx, ly, A.k[0], A.k[1], A.f[0], A.f[1])) < 14)) {
        SFX.blip(); floatText(x, y - 30, c.feel ? 'Feelers!' : 'Antenna!', '#fff', false, 22);
        speak(c.feel ? 'Those are feelers, not legs!' : 'That\'s an antenna, not a leg. Insects smell with them!'); return;
      }
      if (c.wings && c.wings.some(w => Math.hypot(lx - w.x, ly - w.y) < w.rx * 0.8)) { SFX.blip(); floatText(x, y - 30, 'Wing!', '#fff', false, 22); speak('That\'s a wing, not a leg!'); return; }
      if (onBody(c, lx, ly)) {
        if (!c.legs.length) { g.look += 0.7; floatText(x, y - 30, 'Hmm...', '#fff', false, 20); }
        else { SFX.blip(); floatText(x, y - 30, 'Tap a LEG', '#fff', false, 20); }
      }
    } else if (g.st === 'parts') {
      const hit = c.parts.find(p => ((lx - p.x) / (p.rx + 8)) ** 2 + ((ly - p.y) / (p.ry + 8)) ** 2 < 1 && !g.partsOn.has(p))
        || c.parts.find(p => ((lx - p.x) / (p.rx + 8)) ** 2 + ((ly - p.y) / (p.ry + 8)) ** 2 < 1);
      if (!hit) { if (c.legs.some(L => dseg(lx, ly, L.k[0], L.k[1], L.f[0], L.f[1]) < 14)) { SFX.blip(); floatText(x, y - 30, 'Tap the BODY', '#fff', false, 20); } return; }
      if (g.partsOn.has(hit)) { SFX.blip(); return; }
      g.partsOn.add(hit); g.partOrder.push(hit);
      const n = g.partsOn.size;
      tone(523 * Math.pow(2, n * 4 / 12), 0.25, 'sine', 0.1); SFX.pick();
      burst(...toWorld(g, hit.x, 0), 10, { colors: ['#fff6a8', '#ffb3e0'], spread: 90, up: 40 });
      speak(`${cap(legWord(n))}. ${cap(hit.label)}!`);
      if (n >= c.parts.length) g.stepT = 0.8;
    }
  }
  function choose(g, i) {
    const c = g.crit, want = CLS.findIndex(k => k.id === c.cls);
    if (i === want) {
      const first = g.tries === 0;
      g.sum += first ? 1 : 0.2; g.st = 'filed'; g.fly = 0; g.flyTo = i;
      const r = CARD(i);
      SFX.sparkle(); burst(r.x + r.w / 2, r.y + 20, 22, { colors: [CLS[i].col, '#fff6a8', '#ffffff'] });
      floatText(r.x + r.w / 2, r.y - 10, first ? pick(['Yes!', 'Super sleuth!', 'Spot on!', 'Brilliant!']) : 'That\'s it!', '#fff', false, 26);
      const n = c.legs.length;
      const sum = c.cls === 'insect' ? 'Six legs and three body parts.' : c.cls === 'spider' ? 'Eight legs and two body parts.' : c.cls === 'lots' ? 'So many legs!' : 'No legs!';
      g.say = `${sum} ${c.fact}`; speak(g.say);
      g.cheer = 1.4;
      void n;
    } else {
      g.tries++; g.hintCard = want; g.shake[i] = 0.5;
      SFX.miss();
      const k = CLS[want];
      const desc = c.cls === 'lots' ? 'more than eight legs' : c.cls === 'none' ? 'no legs at all' : `${legWord(c.legs.length)} legs and ${legWord(c.parts.length)} body parts`;
      g.say = `Not that page. It has ${desc}. Try the ${k.name} page!`; speak(g.say);
    }
  }

  MG.bugdetective = {
    kind: 'learn', title: () => 'Bug Detective', icon: () => '🔍',
    how: () => 'Look through the magnifying glass. Tap each leg to count it, then tap each body part. Then put the critter on the right page of Flutter\'s Bug Book. An insect has 6 legs and 3 body parts!',
    init(g) {
      const t = g.tier - 1;
      const pools = [
        ['ladybird', ['spider', 'bee', 'snail', 'woodlouse']],
        ['ant', ['spider', 'beetle', 'worm', 'centipede', 'ladybird']],
        ['grasshopper', ['spider', 'ant', 'slug', 'millipede', 'bee', 'woodlouse']],
      ][t];
      Object.assign(g, {
        roster: [pools[0], ...shuffle(pools[1])], idx: -1, sum: 0, legNum: {},
        lensR: [86, 80, 74][t], zoom: [1.6, 1.65, 1.7][t], lx: CX, ly: CY, lensOn: false,
        stamps: [0, 0, 0, 0], shake: [0, 0, 0, 0], cheer: 0, flap: 0, endT: 0, wig: null,
        showHints: t < 2,
      });
      g.blades = Array.from({ length: [7, 10, 13][t] }, (_, i) => ({
        x: 110 + i * (540 / ([7, 10, 13][t] - 1)) + rand(-14, 14), h: rand(120, 175), w: rand(6, 9), ph: rand(0, 6), lean: rand(-14, 14),
        col: pick(['#5cc04a', '#6fd056', '#4fb03e', '#7ad65a']),
      }));
      nextCritter(g);
      g.score = 0; g.progress = `🔍 1 / ${g.roster.length}`;
    },
    start(g) { speak('Here comes a critter! Is it an insect? Let\'s find out!'); },
    update(g, dt) {
      g.flap += dt * (g.cheer > 0 ? 7 : 1.4); g.cheer = Math.max(0, g.cheer - dt);
      for (let i = 0; i < 4; i++) g.shake[i] = Math.max(0, g.shake[i] - dt);
      if (g.wig) { g.wig.t -= dt; if (g.wig.t <= 0) g.wig = null; }
      // lens: follows the mouse, or arrow keys
      const lf = goLeft(), rt = goRight(), up = keys.arrowup || keys.w, dn = goDown();
      if (lf || rt || up || dn) {
        g.lx = clamp(g.lx + ((rt ? 1 : 0) - (lf ? 1 : 0)) * 320 * dt, 20, W - 20);
        g.ly = clamp(g.ly + ((dn ? 1 : 0) - (up ? 1 : 0)) * 320 * dt, 70, STAGE_B - 4);
        g.usePointer = false; g.lpx = pointer.x; g.lpy = pointer.y; g.lensOn = true;
      } else if (pointerMoved(g) || pointer.clicked) { g.lx = pointer.x; g.ly = pointer.y; g.lensOn = pointer.y < STAGE_B && pointer.y > 62; }

      if (g.st === 'end') { g.endT -= dt; if (g.endT <= 0) g.done = true; return; }
      const c = g.crit;
      if (g.st === 'enter') {
        g.walk += dt * 14; g.cx = Math.min(CX, g.cx + 300 * dt);
        if (g.cx >= CX) { g.st = 'legs'; sayStep(g); speak(g.say); }
      } else if (g.st === 'legs' || g.st === 'parts') {
        if (pointer.clicked && pointer.y < STAGE_B && pointer.y > 62) tapStage(g, pointer.x, pointer.y);
        else if (pressed[' '] && g.lensOn) tapStage(g, g.lx, g.ly);
        if (g.st === 'legs' && !c.legs.length) {
          const [lx, ly] = toLocal(g, g.lx, g.ly);
          if (g.lensOn && Math.abs(lx) < 140 && Math.abs(ly) < 70) g.look += dt;
          g.lookT = (g.lookT || 0) + dt;
          if (g.look >= 1.6 || g.lookT > 7) { g.lookT = 0; finishLegs(g); }
        }
        if (g.stepT > 0 && (g.stepT -= dt) <= 0) {
          if (g.st === 'legs') finishLegs(g);
          else { SFX.sparkle(); burst(g.cx, g.cy, 16, { colors: ['#ff6fb5', '#fff6a8'] }); toFile(g, `${cap(legWord(c.legs.length))} legs and ${legWord(c.parts.length)} body parts! `); }
        }
      } else if (g.st === 'lotsfill') {
        g.fill += dt;
        if (g.fill > 0.05) {
          g.fill = 0;
          const i = c.legs.findIndex((_, k) => !g.counted.has(k));
          if (i >= 0) { g.counted.add(i); tone(600 + g.counted.size * 12, 0.04, 'triangle', 0.05); }
          else { SFX.sparkle(); floatText(g.cx, g.cy - 110, 'LOTS of legs!', '#fff', false, 32); burst(g.cx, g.cy, 20); toFile(g, 'Wow! More than eight! Lots and lots of legs! '); }
        }
      } else if (g.st === 'file') {
        let pickI = -1;
        if (pointer.clicked) for (let i = 0; i < 4; i++) if (inRect(CARD(i))) pickI = i;
        for (let i = 0; i < 4; i++) if (pressed[String(i + 1)]) pickI = i;
        if (pickI >= 0) choose(g, pickI);
      } else if (g.st === 'filed') {
        g.fly += dt / 0.9;
        if (g.fly >= 1 && !g.stamped) { g.stamped = true; g.stamps[g.flyTo]++; SFX.pop(); g.shake[g.flyTo] = 0.25; }
        if (g.fly >= 1.9) { g.stamped = false; g.legNum = {}; nextCritter(g); }
      }
      g.score = g.sum / g.roster.length;
      g.progress = `🔍 ${Math.min(g.idx + 1, g.roster.length)} / ${g.roster.length}`;
      // positions a bot (or test) can use
      if (g.crit) {
        g.hit = {
          legs: g.crit.legs.map(L => toWorld(g, L.k[0] + (L.f[0] - L.k[0]) * 0.6, L.k[1] + (L.f[1] - L.k[1]) * 0.6)),
          parts: g.crit.parts.map(p => toWorld(g, p.x, p.y)), body: [g.cx, g.cy],
          answer: CLS.findIndex(k => k.id === g.crit.cls),
        };
      }
    },
    draw(g) {
      const c = g.crit;
      // Flutter on her daisy, with her speech bubble
      const fx = 858;
      if (g.phase === 'play') {
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fx + 10, 430); ctx.quadraticCurveTo(fx - 12, 330, fx, 258);
      ctx.strokeStyle = OL; ctx.lineWidth = 10; ctx.stroke(); ctx.strokeStyle = '#5cc04a'; ctx.lineWidth = 5.5; ctx.stroke();
      inkAt(fx - 4, 350, -0.5, P2('M0,0 C10,-14 34,-14 42,0 C30,8 10,8 0,0 Z'), '#7ad65a', 1.6);
      daisy(fx, 256, 40);
      flutter(fx, 222 - (g.cheer > 0 ? Math.abs(Math.sin(g.cheer * 9)) * 14 : 0), 0.95, g.flap);
      // speech bubble
      const bx = 694, by = 66, bw = 252;
      const lines = wrap(g.say || '', bw - 26, 17);
      const bh = Math.max(64, 22 + lines.length * 22);
      ctx.beginPath(); ctx.moveTo(fx - 14, by + bh - 2); ctx.lineTo(fx - 2, by + bh + 22); ctx.lineTo(fx + 10, by + bh - 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fill();
      rrect(bx, by, bw, bh, 18, '#fff', OL, 3);
      ctx.fillStyle = '#fff'; ctx.fillRect(fx - 12, by + bh - 4, 20, 6);
      lines.forEach((l, i) => text(l, bx + bw / 2, by + 22 + i * 22, 17, '#5a2a6e', 'center', 600));
      }

      // the leaf stage and the critter
      const stage = lens => {
        drawLeaf();
        if (c && g.st !== 'filed') {
          ctx.save(); ctx.translate(g.cx, g.cy); ctx.scale(g.cs, g.cs);
          drawBug(g.kind, c, { ph: g.walk, mv: g.st === 'enter', counted: g.counted, partsOn: g.partsOn });
          ctx.restore();
          // number badges at the feet of counted legs
          c.legs.forEach((L, i) => {
            const n = g.legNum[i]; if (!n) return;
            const [x, y] = toWorld(g, L.f[0], L.f[1]);
            const wg = g.wig && g.wig.i === i ? Math.sin(S.t * 40) * 3 : 0;
            const r = c.legs.length > 14 ? 8 : 11;
            inkCircle(x + wg, y + Math.sign(L.f[1]) * (r + 3), r, '#ffcf3a', 1.3);
            text(String(n), x + wg, y + Math.sign(L.f[1]) * (r + 3), r * 1.35, '#5a2a6e', 'center', 700);
          });
          // body part tags (not inside the lens, where they'd hide the critter)
          if (!lens) g.partOrder.forEach((p, k) => {
            const [px, py] = toWorld(g, p.x, p.y), n = g.partOrder.indexOf(p) + 1;
            const pos = [...c.parts].sort((a, b) => b.x - a.x).indexOf(p), np = c.parts.length;
            const tx = CX + (np === 3 ? [130, 0, -130][pos] : [80, -80][pos]), ty = CY - 132 + (np === 3 && pos === 1 ? -6 : 10);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(tx, ty + 14); ctx.lineTo(px, py); ctx.stroke(); ctx.setLineDash([]);
            inkCircle(px, py, 12, '#ff6fb5', 1.4); text(String(n), px, py, 15, '#fff', 'center', 700);
            ctx.font = `700 17px ${FONT}`; const w = ctx.measureText(p.label).width + 24;
            rrect(tx - w / 2, ty - 15, w, 30, 15, '#ff6fb5', '#fff', 3);
            text(p.label, tx, ty, 17, '#fff', 'center', 700);
            void k;
          });
          if (g.st === 'parts' && g.showHints) c.parts.forEach(p => {
            if (g.partsOn.has(p)) return;
            const [px, py] = toWorld(g, p.x, p.y);
            ctx.globalAlpha = 0.45 + 0.35 * Math.sin(S.t * 5); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(px, py, p.rx * g.cs + 6, p.ry * g.cs + 6, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
          });
        }
        void lens;
      };
      stage(false);
      for (const b of g.blades) drawBlade(b);
      // magnifying glass: the meadow seen bigger and without the grass in the way
      if (g.lensOn && g.phase === 'play' && g.st !== 'end') {
        const x = g.lx, y = g.ly, R = g.lensR;
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
        ctx.translate(x, y); ctx.scale(g.zoom, g.zoom); ctx.translate(-x, -y);
        drawBackdrop(g.loc ? g.loc.bg : 'meadow');
        stage(true);
        ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
        const gl = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, 4, x, y, R);
        gl.addColorStop(0, 'rgba(255,255,255,.18)'); gl.addColorStop(1, 'rgba(180,220,255,.08)');
        ctx.fillStyle = gl; ctx.fillRect(x - R, y - R, R * 2, R * 2);
        ctx.restore();
        drawLens(g, x, y);
      }
      // counters
      if (c && g.st !== 'enter') {
        darkPanel(20, 68, 150, 40, 20);
        ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(36, 98); ctx.lineTo(46, 80); ctx.lineTo(58, 96); ctx.stroke();
        const lc = g.counted.size;
        text(`Legs: ${c.cls === 'lots' && g.st !== 'legs' ? 'lots!' : lc}`, 70, 88, 19, '#fff', 'left', 700);
        if (c.parts.length && c.cls !== 'lots' && (g.st === 'parts' || g.partsOn.size)) {
          darkPanel(180, 68, 150, 40, 20);
          inkCircle(198, 88, 7, '#ff6fb5', 1); inkCircle(212, 88, 6, '#ff6fb5', 1); inkCircle(224, 88, 5, '#ff6fb5', 1);
          text(`Parts: ${g.partsOn.size}`, 236, 88, 19, '#fff', 'left', 700);
        }
      }
      // Flutter's Bug Book pages
      for (let i = 0; i < 4; i++) {
        const r = CARD(i), k = CLS[i], live = g.st === 'file';
        const hov = live && inRect(r), hint = live && g.hintCard === i;
        const sx = g.shake[i] > 0 ? Math.sin(g.shake[i] * 50) * 6 : 0, lift = hov ? -4 : 0;
        ctx.save(); ctx.translate(sx, lift);
        if (hint) { ctx.shadowColor = '#fff6a8'; ctx.shadowBlur = 20 + Math.sin(S.t * 6) * 8; }
        rrect(r.x, r.y, r.w, r.h, 14, mix(k.col, '#fffaf0', 0.72), OL, 3.5);
        ctx.shadowBlur = 0;
        if (live) rrect(r.x + 3, r.y + 3, r.w - 6, r.h - 6, 12, null, hint ? '#fff' : 'rgba(255,255,255,.75)', hint ? 4 : 2);
        ctx.strokeStyle = mix(k.col, '#ffffff', 0.35); ctx.lineWidth = 1.5;
        for (let l = 0; l < 2; l++) { ctx.beginPath(); ctx.moveTo(r.x + 96, r.y + 70 + l * 30); ctx.lineTo(r.x + r.w - 12, r.y + 70 + l * 30); ctx.stroke(); }
        // spiral rings along the top
        for (let s = 0; s < 8; s++) { const x = r.x + 18 + s * 26; inkCircle(x, r.y + 2, 4, '#e8e0f0', 1); }
        ctx.save(); ctx.translate(r.x + 50, r.y + 62); ctx.scale(k.ms, k.ms);
        const mini = KINDS[k.mini].b();
        drawBug(k.mini, mini, { t: S.t });
        ctx.restore();
        text(k.name, r.x + 98, r.y + 34, k.name.length > 8 ? 16 : 19, '#5a2a6e', 'left', 700);
        if (g.showHints || g.hintCard === i) text(k.hint, r.x + 98, r.y + 58, 13, '#7a4a8e', 'left', 600);
        else text('? legs', r.x + 98, r.y + 58, 13, '#9a7aaa', 'left', 600);
        for (let s = 0; s < g.stamps[i]; s++) star(r.x + 106 + s * 20, r.y + 88, 8, '#ffc82a', 5);
        inkCircle(r.x + r.w - 18, r.y + 20, 11, live ? k.col : '#cbbcd6', 1.2);
        text(String(i + 1), r.x + r.w - 18, r.y + 20, 14, '#fff', 'center', 700);
        ctx.restore();
      }
      // the filed critter flies into its page
      if (c && g.st === 'filed' && g.fly < 1) {
        const r = CARD(g.flyTo), e = g.fly * g.fly * (3 - 2 * g.fly);
        const x = lerp(CX, r.x + r.w - 60, e), y = lerp(CY, r.y + 70, e) - Math.sin(e * Math.PI) * 60, s = lerp(g.cs, 0.22, e);
        ctx.save(); ctx.translate(x, y); ctx.rotate(e * 0.6); ctx.scale(s, s);
        drawBug(g.kind, c, { counted: g.counted, partsOn: g.partsOn });
        ctx.restore();
      }
    },
  };

  restage('meadow', {
    games: [['butterflycycle', 'petal', {}], ['bugdetective', 'petal', {}]],
    mid: [
      'N:You know all my secrets now! Next, I need a detective for my Bug Book.',
      'N:Lots of little critters live in my meadow. But which ones are INSECTS?',
      'N:Here is the clue: an insect has SIX legs and THREE body parts. Use my magnifying glass and count!',
      'A:focused:Six legs, three body parts. Detective Aubrey is on the case!',
    ],
    outro: [
      'N:My Bug Book is full! Every critter is on the right page. Take some petals. Every unicorn I know LOVES petals.',
      'A:surprised:How did you know about...? Never mind!',
    ],
  });
}
