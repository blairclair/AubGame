'use strict';
// Farm Facts animal portraits (see js/farmart.js for the drawing contract)
// Animals in this file: cow, sheep, goat, llama.
{
  const LW = 3;                 // outline half-width (ink() strokes lw*2)
  const PI = Math.PI;
  const EYE_DARK = '#2a1d33';

  // stroke every outline first, then fill every shape, so overlapping parts read as one mass
  const mass = (parts, lw = LW) => {
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of parts) ctx.stroke(p);
    for (const [p, f] of parts) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const vgrad = (y0, y1, stops) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  };
  const rgrad = (x, y, r0, r1, stops) => {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  };
  const clipDo = (path, fn) => { ctx.save(); ctx.clip(path); fn(); ctx.restore(); };
  const ellP = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, PI * 2); return p; };
  // a smooth, slightly lumpy blob (for coat patches)
  const blob = (cx, cy, rx, ry, seed, n = 7) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2, k = 1 + 0.22 * Math.sin(seed * 3.1 + i * 2.3);
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    const p = new Path2D();
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[n - 1], pts[0]); p.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { const b = pts[i], c = mid(pts[i], pts[(i + 1) % n]); p.quadraticCurveTo(b[0], b[1], c[0], c[1]); }
    p.closePath(); return p;
  };
  // a tapered leg from (x, top) down to bot, with a soft knee bulge
  const legP = (x, top, bot, wTop, wBot, knee = 0.55, kneeW = 0) => {
    const ky = top + (bot - top) * knee, kw = (wTop + wBot) / 2 + kneeW;
    const p = new Path2D();
    p.moveTo(x - wTop / 2, top);
    p.quadraticCurveTo(x - kw / 2 - 1, ky, x - wBot / 2, bot - 2);
    p.quadraticCurveTo(x, bot + 1.5, x + wBot / 2, bot - 2);
    p.quadraticCurveTo(x + kw / 2 + 1, ky, x + wTop / 2, top);
    p.closePath(); return p;
  };
  const hoofP = (x, bot, w, h) => { const p = new Path2D(); p.roundRect(x - w / 2, bot - h, w, h, [w * 0.3, w * 0.3, 2, 2]); return p; };
  const line = (pts, w, col = OL) => {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 4) ctx.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  };
  // 0 = open, 1 = shut; a quick blink every few seconds
  const blink = (t, off = 0, per = 4.3) => { const u = (t + off) % per; return u < 0.16 ? Math.sin(u / 0.16 * PI) : 0; };
  // a big friendly eye: white, dark iris looking forward, catchlights; lid comes down when blinking
  const eye = (x, y, r, t, off, lid, opt = {}) => {
    const b = blink(t, off);
    const rx = r * (opt.sx || 0.9);
    if (b > 0.55) { // shut: a soft downward curve
      line([x - rx, y - r * 0.1, x, y + r * 0.55, x + rx, y - r * 0.1], 2.6);
    } else {
    inkEllipse(x, y, rx, r, opt.rot || 0, '#ffffff', 1.4);
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, r, opt.rot || 0, 0, PI * 2); ctx.clip();
    const ix = x + r * 0.22, iy = y + r * 0.08;
    if (opt.goat) {
      ctx.fillStyle = rgrad(ix, iy, 1, r * 0.8, ['#ffe08a', '#e0a030']); ellipse(ix - r * 0.1, iy, r * 0.66, r * 0.72);
      ctx.fillStyle = EYE_DARK; ctx.beginPath(); ctx.roundRect(ix - r * 0.62, iy - r * 0.22, r * 1.04, r * 0.44, r * 0.2); ctx.fill();
    } else {
      ctx.fillStyle = rgrad(ix, iy + r * 0.2, 1, r * 0.8, [opt.iris || '#6b4a32', EYE_DARK]); ellipse(ix, iy, r * 0.68, r * 0.76);
      ctx.fillStyle = EYE_DARK; ellipse(ix, iy, r * 0.36, r * 0.42);
    }
    ctx.fillStyle = '#ffffff'; circle(ix + r * 0.22, iy - r * 0.32, r * 0.24); circle(ix - r * 0.25, iy + r * 0.3, r * 0.1);
    if (b > 0.02) { // eyelid
      ctx.fillStyle = lid; ctx.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4 * b);
      line([x - rx, y - r + 2 * r * b * 0.98, x, y - r + 2 * r * b + r * 0.25 * b, x + rx, y - r + 2 * r * b * 0.98], 2.2);
    }
    ctx.restore();
    }
    if (opt.lash) { ctx.strokeStyle = OL; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const a = -PI / 2 - 0.15 + i * 0.4; line([x + Math.cos(a) * rx, y + Math.sin(a) * r, x + Math.cos(a) * (rx + 2), y + Math.sin(a) * (r + 3), x + Math.cos(a) * (rx + 5), y + Math.sin(a) * (r + 5)], 2); } }
    else line([x - rx * 0.9, y - r * 1.25, x, y - r * 1.55, x + rx * 0.9, y - r * 1.3], 2.2); // brow
  };
  const cheek = (x, y, r) => { ctx.fillStyle = 'rgba(255,120,140,.35)'; ellipse(x, y, r, r * 0.6); };
  // soft shading laid over a filled shape: light along the top, shade underneath
  const shade = (paths, y0, y1, hi = 0.45, lo = 0.28, tint = '90,60,120') => {
    paths.forEach((p, i) => {
      ctx.save(); ctx.clip(p);
      for (let j = 0; j < i; j++) { const ex = new Path2D(); ex.rect(-400, -400, 800, 800); ex.addPath(paths[j]); ctx.clip(ex, 'evenodd'); }
      ctx.fillStyle = vgrad(y0, y1, [`rgba(255,255,255,${hi})`, 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', `rgba(${tint},${lo})`]);
      ctx.fillRect(-140, y0 - 10, 280, y1 - y0 + 20);
      ctx.restore();
    });
  };

  // ======================= COW (Holstein) =======================
  ANIMAL_ART.cow = t => {
    ctx.save(); ctx.translate(-2, 0); ctx.scale(0.93, 0.93);
    const WHITE = '#fdfbf7', BLACK = '#2f2836', FAR = '#cfc6d6', PINK = '#ffb3c1';
    const sw = Math.sin(t * 1.6) * 0.16 + Math.sin(t * 0.7) * 0.05;
    // tail (behind the body)
    ctx.save(); ctx.translate(-80, -114); ctx.rotate(sw);
    line([0, 0, -14, 22, -10, 62], 9); line([0, 0, -14, 22, -10, 62], 4.5, WHITE);
    ink(blob(-10, 70, 7, 11, 2, 6), BLACK, 2.2);
    ctx.restore();
    // far legs
    const farLegs = [legP(-36, -82, -4, 21, 16), legP(54, -80, -4, 19, 15)];
    mass(farLegs.map(p => [p, FAR]));
    mass([[hoofP(-36, -3, 17, 10), '#4a3f50'], [hoofP(54, -3, 16, 10), '#4a3f50']], 2.4);
    // udder
    inkEllipse(-20, -58, 18, 13, 0, PINK, LW);
    ctx.fillStyle = '#ff8fa6'; [-30, -20, -10].forEach(x => { inkEllipse(x, -45, 3, 5, 0, '#ff9fb2', 1.6); });
    // body mass
    const body = P2('M-84,-106 C-88,-134 -58,-140 -40,-140 C-30,-146 -14,-142 0,-138 C20,-136 34,-146 52,-140 C70,-134 74,-110 68,-90 C62,-70 40,-62 10,-62 C-20,-62 -46,-60 -66,-66 C-82,-72 -82,-90 -84,-106 Z');
    const neck = P2('M40,-136 C54,-148 78,-150 92,-138 L96,-104 C88,-94 82,-84 72,-78 C62,-76 52,-80 46,-84 Z');
    const nlF = legP(38, -84, 0, 22, 17, 0.55, 2), nlB = legP(-54, -94, 0, 32, 17, 0.5, 3);
    const parts = [body, neck, nlF, nlB];
    mass(parts.map(p => [p, WHITE]));
    // patches
    const patches = [blob(-44, -116, 24, 19, 1), blob(8, -98, 19, 15, 4), blob(50, -128, 15, 12, 7), blob(-64, -74, 14, 12, 3), blob(40, -66, 10, 14, 5), blob(-54, -24, 9, 8, 6)];
    for (const p of [body, neck, nlB, nlF]) clipDo(p, () => { ctx.fillStyle = BLACK; for (const q of patches) ctx.fill(q); });
    shade([body, neck], -146, -60, 0.6, 0.3);
    shade([nlF, nlB], -90, 0, 0.0, 0.25);
    // a few fur flicks and belly crease
    mass([[hoofP(38, 0, 18, 11), '#5a4a5e'], [hoofP(-54, 0, 18, 11), '#5a4a5e']], 2.4);
    [38, -54].forEach(x => line([x, -10, x + 0.5, -6, x, -1], 1.8));
    // ---- head ----
    const ear = (x, y, rot, s, flick) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot + flick); ctx.scale(s, s);
      const e = P2('M0,0 C6,-9 20,-11 27,-4 C22,3 10,7 0,4 Z');
      ink(e, WHITE, LW / s);
      ctx.fillStyle = PINK; ctx.fill(P2('M5,0 C9,-5 18,-6 22,-3 C18,1 10,3 5,2 Z'));
      ctx.restore();
    };
    const flick = blink(t, 1.7, 5.1) * 0.35;
    // horns
    mass([[P2('M80,-160 C76,-172 74,-178 78,-184 C84,-178 88,-170 88,-162 Z'), '#f4e2b8'], [P2('M104,-160 C106,-171 110,-177 116,-180 C116,-172 112,-164 110,-158 Z'), '#e8d2a2']], 2.4);
    ear(77, -148, PI + 0.45, 1, -flick);
    ear(113, -150, -0.45, 0.85, flick * 0.5);
    ctx.save(); ctx.translate(77, -148); ctx.rotate(PI + 0.45 - flick); inkRect(11, 1, 7, 9, '#ffd23f', 1.4, 2); ctx.restore(); // ear tag
    const head = P2('M75,-152 C74,-174 117,-175 117,-152 C117,-140 112,-128 108,-114 L86,-114 C80,-128 75,-140 75,-152 Z');
    ink(head, WHITE, LW);
    clipDo(head, () => { ctx.fillStyle = BLACK; ctx.fill(blob(84, -150, 13, 16, 9)); ctx.fill(blob(116, -160, 10, 10, 2)); });
    shade([head], -172, -110, 0.6, 0.2);
    // forehead tuft
    line([88, -166, 92, -172, 96, -166, 98, -172, 102, -166], 2.4);
    cheek(85, -124, 5); cheek(111, -125, 4.5);
    const chew = Math.sin(t * 6) * 0.8;
    const muz = ellP(97, -108, 23, 16);
    ctx.fillStyle = rgrad(92, -114, 2, 26, ['#ffd3dc', PINK, '#f39aad']);
    ctx.strokeStyle = OL; ctx.lineWidth = LW * 2; ctx.stroke(muz); ctx.fill(muz);
    inkEllipse(89, -110, 3.4, 4.6, 0.3, '#b65a78', 1.2); inkEllipse(106, -110, 3.2, 4.4, -0.3, '#b65a78', 1.2);
    line([86, -99 + chew * 0.3, 97, -94 + chew, 108, -99 + chew * 0.3], 2.4);
    eye(87, -136, 8, t, 0, WHITE); eye(108, -137, 7, t, 0, WHITE);
        ctx.restore();
  };

  // a cloud of overlapping wool puffs: outline all, fill all, then curl texture on each
  const woolCloud = (puffs, y0, y1, base, line = OL) => {
    ctx.strokeStyle = line; ctx.lineWidth = LW * 2;
    for (const [x, y, r] of puffs) { ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.stroke(); }
    ctx.fillStyle = vgrad(y0, y1, [mix(base, '#ffffff', 0.6), base, mix(base, '#8a6e94', 0.28)]);
    for (const [x, y, r] of puffs) { ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.fill(); }
  };
  const woolCurls = (puffs, base) => {
    ctx.lineWidth = 1.8;
    for (const [x, y, r, skip] of puffs) {
      if (skip) continue;
      ctx.strokeStyle = mix(base, '#7a5a8a', 0.35);
      ctx.beginPath(); ctx.arc(x + r * 0.1, y + r * 0.05, r * 0.55, 0.2, 1.9); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.5, 3.6, 4.6); ctx.stroke();
    }
  };

  // ======================= SHEEP =======================
  ANIMAL_ART.sheep = t => {
    ctx.save(); ctx.translate(-4, 0);
    const WOOL = '#f6efe0', FACE = '#4a3e4e', FACE_LT = '#6c5d70', LEG = '#4a4050', LEG_FAR = '#352d3c', DARKLINE = '#2a1f30';
    const breathe = Math.sin(t * 2.2) * 0.8;
    // legs
    const far = [legP(-30, -66, -4, 13, 10), legP(54, -66, -4, 13, 10)];
    mass(far.map(p => [p, LEG_FAR]), LW);
    mass([[hoofP(-30, -3, 12, 8), '#231b28'], [hoofP(54, -3, 12, 8), '#231b28']], 2.2);
    const near = [legP(-52, -70, 0, 15, 11), legP(36, -70, 0, 15, 11)];
    mass(near.map(p => [p, LEG]), LW);
    shade(near, -70, 0, 0.25, 0.15);
    mass([[hoofP(-52, 0, 13, 9), '#2a2230'], [hoofP(36, 0, 13, 9), '#2a2230']], 2.2);
    // tail puff
    const tw = Math.sin(t * 3.1) * 2.5;
    // the fleece
    const puffs = [];
    const cx = -10, cy = -104 - breathe, rx = 70, ry = 38;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * PI * 2, r = 20 + 4 * Math.sin(i * 2.7);
      puffs.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry * (Math.sin(a) > 0 ? 0.95 : 1.05), r]);
    }
    puffs.push([-84, -112 + tw * 0.3 - breathe, 11]);
    const inner = [[-40, -116, 26], [-6, -122, 28], [28, -112, 26], [-30, -90, 26], [8, -90, 28], [40, -96, 22], [-58, -100, 22]];
    inner.forEach(p => { p[1] -= breathe; });
    woolCloud(puffs.concat(inner), -150, -60, WOOL);
    for (const [x, y, r] of puffs.concat(inner)) { ctx.fillStyle = vgrad(-150, -60, [mix(WOOL, '#ffffff', 0.6), WOOL, mix(WOOL, '#8a6e94', 0.28)]); circle(x, y, r); }
    // re-lay the outer ring's outer edge texture on top of inner puffs (front-most puffs)
    woolCurls(inner, WOOL);
    woolCurls(puffs.filter(([x, y]) => y > cy - 10), WOOL);
    // ---- head ----
    ctx.save(); ctx.translate(78, -112 - breathe * 0.5); ctx.rotate(0.12 + Math.sin(t * 0.9) * 0.03);
    const flick = blink(t, 2.2, 5.3) * 0.3;
    const earP = P2('M0,0 C-8,-8 -24,-8 -30,0 C-24,8 -8,8 0,4 Z');
    const inEar = P2('M-4,1 C-10,-3 -20,-3 -25,1 C-20,5 -10,5 -4,3 Z');
    ctx.save(); ctx.translate(-12, -10); ctx.rotate(0.35 + flick); ink(earP, FACE, LW, DARKLINE); ctx.fillStyle = '#d98a9e'; ctx.fill(inEar); ctx.restore();
    ctx.save(); ctx.translate(20, -14); ctx.rotate(PI - 0.45 - flick * 0.5); ctx.scale(0.8, 0.8); ink(earP, FACE, LW / 0.8, DARKLINE); ctx.fillStyle = '#d98a9e'; ctx.fill(inEar); ctx.restore();
    const head = P2('M-18,-12 C-14,-28 16,-30 24,-16 C32,-4 38,12 34,22 C30,32 14,34 4,30 C-8,26 -22,8 -18,-12 Z');
    ink(head, FACE, LW, DARKLINE);
    clipDo(head, () => {
      ctx.fillStyle = rgrad(4, -12, 2, 30, ['rgba(255,255,255,.22)', 'rgba(255,255,255,0)']); ctx.fill(head);
      ctx.fillStyle = FACE_LT; ellipse(22, 20, 15, 11, -0.3);
    });
    // wool topknot
    const top = [[-10, -22, 9], [0, -28, 10], [12, -27, 9], [21, -20, 7], [-16, -14, 7]];
    woolCloud(top, -40, -10, WOOL);
    woolCurls(top.slice(0, 3), WOOL);
    eye(0, -4, 7.5, t, 0.6, FACE, { iris: '#7a5233' });
    eye(20, -6, 6.5, t, 0.6, FACE, { iris: '#7a5233' });
    // nose & mouth
    ctx.fillStyle = '#2a1f30'; ellipse(27, 14, 4.5, 3, -0.4);
    line([27, 16, 26, 20, 24, 23], 2, '#e8d8e8');
    line([16, 24, 22, 28, 30, 22], 2.2, '#e8d8e8');
    cheek(6, 10, 5);
    ctx.restore();
    ctx.restore();
  };

  // ======================= GOAT =======================
  ANIMAL_ART.goat = t => {
    ctx.save(); ctx.translate(-4, 0); ctx.scale(0.95, 0.95);
    const COAT = '#b07446', COAT_FAR = '#8a5838', CREAM = '#f6e8cf', DARK = '#4a3238', HORN = '#c9bba8';
    // tail (little and upright, flicks)
    ctx.save(); ctx.translate(-76, -124); ctx.rotate(-0.5 + Math.max(0, Math.sin(t * 4)) * 0.4);
    ink(P2('M0,4 C-2,-8 2,-18 8,-22 C10,-12 8,-2 6,6 Z'), COAT, LW); ctx.fillStyle = DARK; ctx.fill(P2('M3,-6 C3,-12 5,-17 8,-20 C9,-13 8,-8 7,-4 Z'));
    ctx.restore();
    // far legs
    const far = [legP(-40, -100, -4, 18, 9, 0.5, 1), legP(54, -92, -4, 15, 9, 0.6)];
    mass(far.map(p => [p, COAT_FAR]));
    for (const p of far) clipDo(p, () => { ctx.fillStyle = '#3a262c'; ctx.fillRect(-60, -36, 130, 40); });
    mass([[hoofP(-42, -3, 11, 8), '#2e2026'], [hoofP(54, -3, 11, 8), '#2e2026']], 2.2);
    // body, neck, near legs
    const body = P2('M-80,-114 C-82,-132 -50,-136 -14,-134 C14,-132 40,-138 56,-128 C68,-118 68,-96 58,-84 C44,-74 16,-78 -10,-82 C-36,-86 -54,-88 -66,-92 C-76,-96 -80,-104 -80,-114 Z');
    const neck = P2('M34,-128 C44,-146 58,-160 72,-166 L94,-150 C88,-132 78,-112 62,-92 C52,-86 40,-92 34,-104 Z');
    const nlF = legP(40, -96, 0, 17, 10, 0.6, 1), nlB = P2('M-74,-108 C-78,-86 -70,-66 -64,-52 C-62,-38 -64,-20 -64,-1 L-52,-1 C-52,-20 -50,-38 -50,-54 C-46,-74 -40,-92 -44,-108 Z');
    mass([body, neck, nlF, nlB].map(p => [p, COAT]));
    clipDo(body, () => { ctx.fillStyle = CREAM; ctx.fill(blob(-14, -80, 58, 14, 3, 8)); });
    for (const p of [nlF, nlB]) clipDo(p, () => { ctx.fillStyle = DARK; ctx.fill(P2('M-80,-38 Q-50,-44 -20,-38 L-20,4 L-80,4 Z M20,-36 Q40,-42 70,-36 L70,4 L20,4 Z')); });
    // dark stripe down the back
    shade([body, neck], -172, -76, 0.35, 0.32);
    shade([nlF, nlB], -104, 0, 0.0, 0.2);
    // short-coat flicks
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(91,50,40,.45)';
    [[-60, -112], [-40, -104], [20, -110], [-4, -120], [48, -146]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 4, y + 3, x + 7, y + 2); ctx.stroke(); });
    mass([[hoofP(40, 0, 12, 9), '#2e2026'], [hoofP(-58, 0, 13, 9), '#2e2026']], 2.2);
    [40, -58].forEach(x => line([x, -8, x + 0.5, -5, x, -1], 1.6, '#6a5060'));
    // ---- head ----
    ctx.save(); ctx.translate(82, -164); ctx.scale(1.1, 1.1);
    const chew = Math.sin(t * 7) * 1.2;
    // horns curve up and back
    const horn = P2('M-6,-16 C-8,-30 -16,-42 -30,-46 C-22,-40 -18,-30 -18,-14 Z');
    ctx.save(); ctx.translate(12, -2); ink(horn, mix(HORN, '#6a5a6a', 0.25), LW); ctx.restore();
    ink(horn, HORN, LW);
    ctx.strokeStyle = 'rgba(91,63,115,.45)'; ctx.lineWidth = 1.6;
    [[-10, -24, -18, -24], [-12, -32, -20, -34], [-17, -39, -24, -42]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
    // ears stick out sideways (far one peeks out behind the head)
    const flick = blink(t, 3.1, 4.7) * 0.4;
    ctx.save(); ctx.translate(18, -16); ctx.rotate(-0.5 + flick * 0.4); ink(P2('M0,-4 C8,-8 18,-6 24,0 C18,4 8,4 0,3 Z'), COAT_FAR, LW); ctx.restore();
    ctx.save(); ctx.translate(-10, -6); ctx.rotate(PI - 0.3 - flick);
    ink(P2('M0,-4 C10,-10 24,-8 32,0 C24,6 10,6 0,4 Z'), COAT, LW); ctx.fillStyle = '#e8a0a8'; ctx.fill(P2('M4,-2 C11,-6 21,-5 26,0 C20,3 11,3 4,2 Z'));
    ctx.restore();
    // beard
    ink(P2('M12,16 C10,28 12,38 16,46 C20,38 26,28 26,18 Z'), '#5a3e40', LW);
    const head = P2('M-16,-8 C-14,-24 10,-26 20,-16 C28,-8 36,4 38,12 C40,20 32,24 24,22 C10,20 -4,14 -12,6 C-18,0 -18,-4 -16,-8 Z');
    ink(head, COAT, LW);
    clipDo(head, () => {
      ctx.fillStyle = CREAM;
      ctx.fill(P2('M2,-22 C6,-10 14,4 26,10 L40,8 L40,30 L10,30 C14,18 4,4 -6,-20 Z'));
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(4, -16, 14, 6, -0.3);
      ctx.fillStyle = '#e9b8a8'; ellipse(32, 14, 9, 8, 0.4);
    });
    // nostril & mouth
    ctx.fillStyle = '#4a2a38'; ellipse(35, 9, 2, 3, 0.5);
    line([22, 19 + chew * 0.3, 28, 21 + chew * 0.5, 34, 18], 2);
    eye(1, -6, 7.5, t, 1.4, COAT, { goat: true, sx: 1 });
    eye(19, -8, 6.2, t, 1.4, COAT, { goat: true, sx: 1 });
    cheek(6, 4, 5);
    ctx.restore();
    ctx.restore();
  };

  // ======================= LLAMA =======================
  ANIMAL_ART.llama = t => {
    ctx.save(); ctx.translate(-10, 0); ctx.scale(0.84, 0.84);
    const FLEECE = '#e6bf8a', FAR = '#c09060', FACE = '#f2dcba', TOE = '#5a4246';
    const sway = Math.sin(t * 1.1) * 1.5;
    // tail
    ctx.save(); ctx.translate(-82, -120); ctx.rotate(-0.3 + Math.sin(t * 2.4) * 0.12);
    woolCloud([[-6, 4, 8], [-10, 14, 7], [-4, 10, 7]], -10, 20, FLEECE); ctx.restore();
    // far legs
    const toes = (x, y, col) => mass([[ellP(x - 3, y - 5, 7, 5.5), col], [ellP(x + 6, y - 5, 7, 5.5), col]], 2.2);
    const far = [legP(-36, -80, -8, 18, 11, 0.5), legP(44, -80, -8, 16, 11, 0.5)];
    mass(far.map(p => [p, FAR]));
    toes(-36, -3, '#3e2c30'); toes(44, -3, '#3e2c30');
    // body + neck + near legs with fluffy scalloped edges
    const body = P2('M-84,-104 C-86,-128 -50,-134 -10,-132 C20,-132 44,-128 50,-108 C54,-90 40,-76 10,-76 C-20,-76 -60,-74 -76,-84 C-82,-88 -84,-96 -84,-104 Z');
    const neck = P2(`M22,-126 C30,-148 ${40 + sway * 0.3},-176 ${50 + sway},-194 L${82 + sway},-186 C74,-166 66,-140 56,-100 C48,-88 30,-90 24,-100 Z`);
    const nlF = legP(30, -86, 0, 18, 11, 0.5), nlB = legP(-56, -88, 0, 22, 11, 0.5, 2);
    const fluff = [];
    for (let i = 0; i < 9; i++) fluff.push([-78 + i * 15, -80 + Math.sin(i * 1.9) * 2, 9]);
    for (let i = 0; i < 6; i++) { const y = -108 - i * 13; fluff.push([58 + (-100 - y) / 86 * 24 + sway * (i / 6) + 2, y, 7]); }
    for (let i = 0; i < 4; i++) { const y = -136 - i * 13; fluff.push([22 + (-126 - y) / 68 * 26 + sway * (i / 5) - 2, y, 6]); }
    fluff.push([-52, -64, 10], [-60, -62, 9], [30, -66, 9], [24, -64, 8]); // fleecy thighs/shoulders
    ctx.strokeStyle = OL; ctx.lineWidth = LW * 2;
    for (const [x, y, r] of fluff) { ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.stroke(); }
    for (const p of [body, neck, nlF, nlB]) ctx.stroke(p);
    const g = vgrad(-215, -60, [mix(FLEECE, '#ffffff', 0.45), FLEECE, mix(FLEECE, '#8a5a6a', 0.25)]);
    ctx.fillStyle = g;
    for (const p of [body, neck, nlF, nlB]) ctx.fill(p);
    for (const [x, y, r] of fluff) { ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.fill(); }
    shade([nlF, nlB], -80, 0, 0, 0.18);
    // fleece tufts
    ctx.lineWidth = 1.8; ctx.strokeStyle = mix(FLEECE, '#7a4a5a', 0.4);
    [[-70, -110], [-50, -96], [-20, -80], [10, -82], [36, -118], [42, -140], [50, -162], [-74, -92], [-64, -124]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0.3, 2.6); ctx.stroke(); });
    toes(30, 0, TOE); toes(-56, 0, TOE);
    // woven blanket with tassels
    const blanket = P2('M-48,-130 C-30,-136 0,-136 18,-130 C20,-116 20,-104 18,-92 C-4,-88 -28,-88 -50,-92 C-52,-104 -51,-118 -48,-130 Z');
    const stripes = ['#e8445a', '#ffc83d', '#2bb3a3', '#ff8fc8', '#7a5ad8'];
    ink(blanket, stripes[0], LW);
    clipDo(blanket, () => {
      for (let i = 0; i < 9; i++) {
        const y = -136 + i * 5.5;
        ctx.fillStyle = stripes[i % 5]; ctx.fillRect(-60, y, 90, 5.5);
      }
      ctx.fillStyle = '#ffffff';
      for (let x = -48; x < 20; x += 8) tri(x, -112, x + 4, -116, x + 8, -112), tri(x, -112, x + 4, -108, x + 8, -112);
      ctx.fillStyle = vgrad(-136, -88, ['rgba(255,255,255,.3)', 'rgba(255,255,255,0)', 'rgba(60,20,60,.25)']); ctx.fillRect(-60, -140, 90, 60);
    });
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const x = -44 + i * 12, sw = Math.sin(t * 2 + i) * 1.5;
      line([x, -91, x + sw * 0.5, -86, x + sw, -80], 4.5);
      line([x, -91, x + sw * 0.5, -86, x + sw, -80], 2.2, stripes[(i + 2) % 5]);
      inkCircle(x + sw, -78, 3.2, stripes[(i + 1) % 5], 1.3);
    }
    // ---- head ----
    ctx.save(); ctx.translate(70 + sway, -194); ctx.rotate(0.05);
    const flick = blink(t, 2.6, 4.9) * 0.25;
    const ear = P2('M0,2 C-9,-10 -8,-28 6,-38 C11,-28 11,-12 8,2 Z');
    const earIn = P2('M2,-2 C-3,-12 -2,-24 5,-31 C7,-22 7,-10 5,-2 Z');
    ctx.save(); ctx.translate(-10, -10); ctx.rotate(-0.25 - flick); ink(ear, FACE, LW); ctx.fillStyle = '#e9a0a8'; ctx.fill(earIn);
    inkCircle(4, -3, 3.5, '#ff8fc8', 1.2); ctx.restore();
    ctx.save(); ctx.translate(8, -12); ctx.rotate(0.22 + flick * 0.5); ctx.scale(0.88, 0.88); ink(ear, mix(FACE, '#b08070', 0.25), LW / 0.88); ctx.fillStyle = '#d98a98'; ctx.fill(earIn);
    inkCircle(4, -3, 3.5, '#2bb3a3', 1.2 / 0.88); ctx.restore();
    const head = P2('M-18,-6 C-18,-20 4,-26 16,-18 C24,-12 30,-6 38,-2 C46,2 46,14 38,16 C28,18 12,18 0,14 C-12,10 -18,4 -18,-6 Z');
    ink(head, FACE, LW);
    clipDo(head, () => {
      ctx.fillStyle = vgrad(-24, 18, ['rgba(255,255,255,.4)', 'rgba(255,255,255,0)', 'rgba(160,100,90,.25)']); ctx.fill(head);
    });
    // forehead fringe
    woolCloud([[-12, -16, 6], [-4, -20, 7], [6, -20, 6]], -28, -12, FLEECE);
    // muzzle: split lip, nostril slit, smug little smile
    ctx.fillStyle = '#4a2a38'; ctx.fill(P2('M38,1 C40,-1 42,0 42,2 C41,3 39,3 38,1 Z'));
    line([40, 9, 38, 12, 34, 13], 2);
    line([40, 9, 42, 12, 44, 12], 2);
    line([24, 14, 30, 15, 34, 13], 2);
    eye(4, -6, 8, t, 2.1, FACE, { lash: true, iris: '#5a3a2a' });
    eye(22, -6, 6.3, t, 2.1, FACE, { lash: true, iris: '#5a3a2a' });
    cheek(10, 6, 5);
    ctx.restore();
    ctx.restore();
  };
}
