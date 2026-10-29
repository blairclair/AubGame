'use strict';
{
  // ===========================================================================
  // Honey Tree Hill becomes DINO VALLEY: a sunny prehistoric valley with giant ferns, palm-like
  // cycads, a sleepy (friendly, far away) volcano puffing little clouds, a waterfall pool,
  // dinosaur nests, and a scientist's dig-site tent full of tools.
  // The friend is Lofty the Longneck, a gentle young brachiosaurus.
  //   game 1 (action) Longneck Lift: Aubrey rides on Lofty's head. Left/right walk Lofty along the
  //            valley, up/down raise and lower the long neck like a crane. Scoop the baby dinos off
  //            ledges and treetops and lower each one into the nest with its own picture. Giant
  //            dragonflies zip past: a bump makes the baby hop back home to its perch.
  //   game 2 (learn) Fossil Hunt: paleontology. Scrub the dirt off with small, gentle brush strokes
  //            (a pressure gauge shows how hard: too hard over a bone and it cracks). Then put the
  //            bones together on the skeleton outline, use the clues to name the dinosaur, and say
  //            whether it ate plants or meat. Ends with: birds are the dinosaurs' living relatives.
  // ===========================================================================
  const FRIEND = 'Lofty the Longneck';
  const TAU = Math.PI * 2;
  const say = (g, s) => { g.say = s; speak(s); };
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  // outline every shape first, then fill them all, so overlapping parts read as one shape
  const inkAll = (items, lw, line = OL) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = line; ctx.lineWidth = lw * 2;
    for (const [p] of items) ctx.stroke(p);
    for (const [p, f] of items) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const glow = (x, y, r, rgb, a) => {
    const gr = ctx.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const bubble = (x, y, str, col = '#4a2a5e', size = 17) => {
    ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(str).width + 26, h = size + 19;
    const bx = clamp(x, w / 2 + 8, W - w / 2 - 8);
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(bx - w / 2 - 2.5, y - h / 2 - 2.5, w + 5, h + 5, 20); ctx.fill(); tri(x - 10, y + h / 2 - 2, x + 10, y + h / 2 - 2, x + 2, y + h / 2 + 14);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(bx - w / 2, y - h / 2, w, h, 18); ctx.fill(); tri(x - 7, y + h / 2 - 4, x + 7, y + h / 2 - 4, x + 2, y + h / 2 + 10);
    text(str, bx, y, size, col, 'center', 700);
  };
  const ellP = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
  const cirP = (x, y, r) => ellP(x, y, r, r);
  // points along a quadratic curve
  const qpts = (x0, y0, cx, cy, x1, y1, n = 12) => {
    const out = [];
    for (let i = 0; i <= n; i++) { const k = i / n, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k; out.push([a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1]); }
    return out;
  };
  // a tapered tube along a centre line (necks, tails)
  function tubeP(pts, w0, w1) {
    const n = pts.length, Lt = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = lerp(w0, w1, i / (n - 1)) / 2;
      Lt.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); Rt.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    const p = new Path2D();
    Lt.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    for (let i = n - 1; i >= 0; i--) p.lineTo(Rt[i][0], Rt[i][1]);
    p.closePath();
    return p;
  }

  // =============================================================================================
  // Aubrey's explorer hat: a little khaki pith helmet, perched on her hair so her face shows.
  // HEAD = her head's x offset in each sprite frame (side-on frames face right natively).
  // =============================================================================================
  const HEAD = { idle_front: 1.5, idle_back: 0, run1: 12.5, run2: 28.5, run3: 24, run4: 23, run5: 28.5, jump: -30, crouch: -7, twirl: 2 };
  function aubreyExplorer(x, feet, frame, f, lift, s) {
    drawAubrey(x, feet, frame, f, lift, s);
    const im = IMG[frame]; if (!im) return null;
    // run frames flip to face f, jump faces left natively, crouch is never flipped
    const side = /run|jump/.test(frame);
    const hx = x + (HEAD[frame] || 0) * s * (side ? (frame === 'jump' ? -f : f) : 1);
    const hy = feet - lift - im.height * s + (frame === 'crouch' ? 4.6 : 4) * s / 0.3;
    explorerHat(hx, hy, s / 0.3 * 0.6, side ? f : 1);
    return { hx, hy };
  }
  function explorerHat(x, y, k, f = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k * f, k);
    ctx.lineJoin = 'round';
    ink(P2('M-14,3 C-14,0 14,0 14,3 C14,6 -14,6 -14,3 Z'), '#d9b878', 0.9);          // brim
    ink(P2('M-9,2 C-10,-10 10,-10 9,2 Z'), '#ecd49a', 0.9);                            // dome
    ctx.fillStyle = '#4f9a5a'; ctx.fillRect(-9.3, -1.6, 18.6, 3);                     // green band
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-3.5, -5, 3, 1.6, -0.5);
    inkCircle(0, -9, 1.6, '#c9a460', 0.5);                                           // little top button
    ctx.restore();
  }

  // =============================================================================================
  // Lofty the Longneck (a young brachiosaurus): facing right, feet at (x, gy). ang = neck angle up
  // from level, len = neck length; walk = stride phase. Returns the head's centre on screen.
  // =============================================================================================
  function drawLongneck(x, gy, s, dir, o = {}) {
    const t = o.t ?? S.t, ang = o.ang ?? 1.15, len = o.len ?? 105, col = o.col ?? '#6fcfa6', walk = o.walk ?? 0;
    const dark = mix(col, '#1a3a4a', 0.28), belly = mix(col, '#fffbe0', 0.6), spot = mix(col, '#1a6a5a', 0.25);
    const bob = o.walking ? Math.abs(Math.sin(walk)) * 3 : 0;
    ctx.save(); ctx.translate(x, gy); ctx.scale(dir * s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,20,60,.18)'; ellipse(-10, 0, 120, 9);
    const sx = 48, sy = -100 - bob;
    const hx = sx + Math.cos(ang) * len, hy = sy - Math.sin(ang) * len;
    const sw = o.walking ? 7 : 0, leg = (lx, ph, top) => {
      const fx = lx + Math.sin(walk + ph) * sw, lift = o.walking ? Math.max(0, Math.cos(walk + ph)) * 4 : 0;
      return P2(`M${lx - 14},${top} L${lx + 14},${top} L${fx + 13},${-6 - lift} C${fx + 14},${-lift} ${fx - 14},${-lift} ${fx - 14},${-6 - lift} Z`);
    };
    const sway = Math.sin(t * 1.6) * 6;
    const tail = tubeP(qpts(-70, -84 - bob, -140, -84 - bob, -182, -40 + sway, 14), 40, 5);
    const body = P2(`M-82,${-78 - bob} C-84,${-130 - bob} 56,${-140 - bob} 80,${-96 - bob} C92,${-62 - bob} 60,${-44 - bob} 0,${-44 - bob} C-58,${-44 - bob} -82,${-54 - bob} -82,${-78 - bob} Z`);
    const cpx = sx + (hx - sx) * 0.12, cpy = sy + (hy - sy) * (ang > 0.3 ? 0.78 : 0.5);
    const neck = tubeP(qpts(sx - 10, sy + 14, cpx, cpy, hx - 10, hy + 4, 14), 52, 22);
    const head = P2(`M${hx - 22},${hy + 4} C${hx - 24},${hy - 14} ${hx - 10},${hy - 27} ${hx + 4},${hy - 25} C${hx + 13},${hy - 24} ${hx + 16},${hy - 17} ${hx + 20},${hy - 13} C${hx + 34},${hy - 11} ${hx + 41},${hy} ${hx + 39},${hy + 8} C${hx + 37},${hy + 16} ${hx + 20},${hy + 18} ${hx},${hy + 16} C${hx - 14},${hy + 15} ${hx - 21},${hy + 11} ${hx - 22},${hy + 4} Z`);
    const items = [
      [leg(-36, Math.PI, -64 - bob), dark], [leg(62, 0, -64 - bob), dark],
      [tail, col], [body, col], [neck, col],
      [leg(-50, 0, -60 - bob), col], [leg(40, Math.PI, -60 - bob), col],
      [head, col],
    ];
    inkAll(items, 2.4);
    // belly, spots and toenails
    ctx.save(); ctx.clip(body);
    ctx.fillStyle = belly; ellipse(0, -44 - bob, 74, 20);
    ctx.fillStyle = spot; for (const [px, py, r] of [[-40, -110, 9], [-12, -122, 7], [20, -116, 10], [48, -104, 6], [-60, -92, 6]]) ellipse(px, py - bob, r, r * 0.7);
    ctx.restore();
    ctx.save(); ctx.clip(neck); ctx.fillStyle = spot;
    for (const k of [0.25, 0.5, 0.72]) { const [px, py] = qpts(sx - 10, sy + 14, cpx, cpy, hx - 10, hy + 4, 20)[Math.round(k * 20)]; ellipse(px - 6, py - 4, 6, 4); }
    ctx.restore();
    ctx.fillStyle = '#fff8e8';
    for (const lx of [-50, 40]) { const fx = lx + Math.sin(walk + (lx < 0 ? 0 : Math.PI)) * sw; for (const d of [-7, 1, 9]) ellipse(fx + d, -4, 3.2, 2.4); }
    // face
    const blink = o.blink ?? ((t + 1.3) % 4.2 < 0.13);
    ctx.fillStyle = 'rgba(255,110,150,.45)'; ellipse(hx + 20, hy + 5, 6, 4);
    ctx.fillStyle = spot; circle(hx + 6, hy - 20, 2.2);
    if (blink) { ctx.strokeStyle = OL; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(hx + 5, hy - 8, 6, 0.3, Math.PI - 0.3); ctx.stroke(); }
    else {
      inkCircle(hx + 5, hy - 8, 7.5, '#ffffff', 1.1);
      ctx.fillStyle = '#2a2040'; circle(hx + 8, hy - 7, 4.4);
      ctx.fillStyle = '#fff'; circle(hx + 9.5, hy - 9, 1.6);
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.beginPath();
    if (o.talk) { ctx.fillStyle = '#c0405a'; ellipse(hx + 26, hy + 9, 6, 3 + Math.abs(Math.sin(t * 14)) * 3); }
    else { ctx.arc(hx + 24, hy + 2, 9, 0.5, 1.9); ctx.stroke(); }
    if (o.hat) o.hat(hx, hy);
    ctx.restore();
    return { hx: x + dir * s * hx, hy: gy + s * hy, top: gy + s * (hy - 25) };
  }
  // Lofty as a storybook character: a custom critter body
  CR_FRAMES.dv3lofty = () => ({ F: { x: 92, y: -197, r: 26 }, top: -225 });
  CR_BODIES.dv3lofty = (sp, st) => {
    // a leafy fern sprig tucked behind one ear
    drawLongneck(0, 0, 1, 1, { t: st.t, talk: st.talk, blink: st.blink, ang: 1.15, len: 105, hat(hx, hy) {
      ctx.save(); ctx.translate(hx - 8, hy - 22); ctx.rotate(-0.6);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
      ctx.strokeStyle = '#5ab84a'; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 5; i++) { const y = -6 - i * 5; inkEllipse(-5, y, 5 - i * 0.6, 2.2, 0.5, '#7ad85a', 0.6); inkEllipse(5, y, 5 - i * 0.6, 2.2, -0.5, '#7ad85a', 0.6); }
      ctx.restore();
    } });
  };
  CHARACTERS[FRIEND] = { body: 'dv3lofty', col: '#6fcfa6', seed: 2.2 };

  // =============================================================================================
  // four dinosaurs (fleshed out), facing right with their feet at (x, gy)
  // =============================================================================================
  const DINO_COL = { tri: '#7cd36a', stego: '#f7b04a', trex: '#b48cff', brachio: '#5ab8ff' };
  const legP = (x, top, w, h = 0) => P2(`M${x - w / 2},${top} L${x + w / 2},${top} L${x + w / 2 - 1},${h - 6} C${x + w / 2},${h} ${x - w / 2},${h} ${x - w / 2 + 1},${h - 6} Z`);
  function dinoFace(ex, ey, er, mx, my, o, t) {
    const blink = o.blink ?? ((t * 0.9 + ex * 0.01) % 3.7 < 0.12);
    ctx.fillStyle = 'rgba(255,110,150,.45)'; ellipse(mx - 4, my - 4, er * 0.8, er * 0.5);
    if (blink) { ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(ex, ey, er * 0.8, 0.3, Math.PI - 0.3); ctx.stroke(); }
    else {
      inkCircle(ex, ey, er, '#ffffff', 1);
      ctx.fillStyle = '#2a2040'; circle(ex + er * 0.3, ey + er * 0.1, er * 0.6);
      ctx.fillStyle = '#fff'; circle(ex + er * 0.45, ey - er * 0.2, er * 0.22);
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my - 6, 7, 0.6, 1.9); ctx.stroke();
  }
  function drawDino(kind, x, gy, s, dir = 1, o = {}) {
    const t = o.t ?? S.t, col = o.col ?? DINO_COL[kind];
    if (kind === 'brachio') return drawLongneck(x, gy, s * 0.8, dir, { ang: 1.2, len: 110, col, t, blink: o.blink, walking: o.walking, walk: o.walk });
    const dark = mix(col, '#2a1a4a', 0.28), belly = mix(col, '#fffbe0', 0.55), spot = mix(col, '#2a1a4a', 0.15);
    const wk = o.walking ? (o.walk ?? t * 8) : 0, sw = o.walking ? 5 : 0, sway = Math.sin(t * 1.8 + x) * 3;
    ctx.save(); ctx.translate(x, gy); ctx.scale(dir * s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,20,60,.18)'; ellipse(-10, 0, 100, 8);
    const lg = (lx, ph, top, w) => legP(lx + Math.sin(wk + ph) * sw, top, w);
    if (kind === 'tri') {
      const body = P2('M-72,-52 C-74,-94 40,-100 66,-66 C76,-48 60,-28 30,-26 C-10,-24 -62,-26 -72,-52 Z');
      const frill = cirP(74, -74, 31);
      const scal = []; for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.42; scal.push([cirP(74 + Math.cos(a) * 31, -74 + Math.sin(a) * 31, 6), '#ff9a6a']); }
      const head = P2('M60,-70 C62,-90 92,-92 104,-74 C112,-64 120,-56 116,-46 C108,-41 96,-42 88,-44 C76,-44 62,-50 60,-70 Z');
      const hornF = P2('M80,-84 C84,-100 92,-112 100,-118 C98,-106 94,-94 90,-82 Z');
      const horn = P2('M88,-82 C94,-98 104,-110 114,-116 C110,-102 104,-90 98,-80 Z');
      const nose = P2('M104,-66 C108,-74 110,-80 112,-86 C116,-78 116,-70 112,-62 Z');
      inkAll([[lg(-34, Math.PI, -40, 22), dark], [lg(52, 0, -36, 20), dark], ...scal, [frill, '#ff9a6a'],
        [tubeP(qpts(-60, -58, -104, -54, -128, -26 + sway, 12), 34, 4), col], [body, col],
        [lg(-46, 0, -44, 24), col], [lg(36, Math.PI, -40, 22), col], [hornF, '#f4e6c8'], [head, col], [horn, '#fff4dc'], [nose, '#fff4dc']], 2.2);
      ctx.fillStyle = '#ffd0a8'; ctx.save(); ctx.clip(frill); circle(74, -74, 22); ctx.restore();
      ctx.save(); ctx.clip(body); ctx.fillStyle = belly; ellipse(0, -26, 66, 16); ctx.fillStyle = spot; for (const [px, py] of [[-30, -78], [0, -84], [-50, -64], [26, -78]]) ellipse(px, py, 7, 5); ctx.restore();
      dinoFace(90, -66, 6.5, 106, -48, o, t);
    } else if (kind === 'stego') {
      const plates = [];
      for (let i = 0; i < 7; i++) {
        const k = i / 6, px = -58 + k * 108, py = -60 - Math.sin(k * Math.PI) * 46, h = 16 + Math.sin(k * Math.PI) * 18, w = 11 + Math.sin(k * Math.PI) * 6, a = (k - 0.5) * 0.7;
        const c = Math.cos(a), sn = Math.sin(a), P = (u, v) => `${px + u * c - v * sn},${py + u * sn + v * c}`;
        plates.push([P2(`M${P(-w, 6)} L${P(-w * 0.8, -h * 0.5)} L${P(0, -h - 6)} L${P(w * 0.8, -h * 0.5)} L${P(w, 6)} Z`), i % 2 ? '#ff6a5a' : '#ff8a4a']);
      }
      const spikes = [[-118, -48, -0.9], [-126, -44, -0.5], [-132, -38, 2.4], [-136, -34, 2.8]].map(([sx2, sy2, a]) => [P2(`M${sx2 - 4},${sy2} L${sx2 + Math.cos(a - 1.57) * 22},${sy2 + Math.sin(a - 1.57) * 22} L${sx2 + 4},${sy2} Z`), '#fff4dc']);
      const body = P2('M-68,-56 C-68,-112 40,-114 62,-56 C66,-36 40,-28 10,-28 C-30,-28 -66,-34 -68,-56 Z');
      const head = P2('M76,-44 C80,-56 98,-56 106,-46 C112,-40 112,-30 104,-27 C96,-24 84,-25 78,-30 C74,-34 74,-40 76,-44 Z');
      inkAll([[lg(-34, Math.PI, -54, 24), dark], [lg(54, 0, -36, 18), dark], ...plates, ...spikes,
        [tubeP(qpts(-60, -58, -100, -56, -136, -38 + sway, 12), 34, 6), col], [body, col],
        [tubeP(qpts(50, -52, 66, -42, 84, -38, 8), 30, 20), col],
        [lg(-46, 0, -56, 26), col], [lg(44, Math.PI, -38, 20), col], [head, col]], 2.2);
      ctx.save(); ctx.clip(body); ctx.fillStyle = belly; ellipse(0, -28, 66, 16); ctx.fillStyle = spot; for (const [px, py] of [[-34, -80], [-6, -90], [22, -80], [-52, -64]]) ellipse(px, py, 7, 5); ctx.restore();
      dinoFace(92, -42, 5, 104, -28, o, t);
    } else if (kind === 'trex') {
      const legBack = tubeP([[-2, -64], [6, -40], [0, -14], [2, -6]], 24, 14);
      const body = ellP(-6, -82, 50, 32, -0.18);
      const thigh = ellP(-16, -60, 22, 27, 0.2);
      const shin = tubeP([[-12, -50], [-2, -26], [-8, -8]], 20, 14);
      const head = P2('M26,-118 C28,-142 70,-150 94,-134 C102,-128 104,-116 102,-106 L66,-102 C72,-98 92,-98 98,-90 C90,-80 62,-80 44,-88 C30,-94 24,-106 26,-118 Z');
      inkAll([[legBack, dark], [ellP(18, -3, 15, 6), dark],
        [tubeP(qpts(-34, -84, -96, -92, -146, -62 + sway, 12), 44, 6), col], [body, col],
        [tubeP(qpts(16, -100, 30, -110, 46, -110, 6), 40, 34), col], [head, col],
        [tubeP([[26, -78], [40, -70], [48, -74]], 9, 6), col],
        [thigh, col], [shin, col], [ellP(4, -5, 17, 7), col]], 2.2);
      ctx.save(); ctx.clip(body); ctx.fillStyle = belly; ellipse(8, -60, 40, 18); ctx.fillStyle = spot; for (const [px, py] of [[-30, -100], [-4, -108], [-46, -86]]) ellipse(px, py, 7, 5); ctx.restore();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OL; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const tx = 68 + i * 5.4; ctx.beginPath(); ctx.moveTo(tx, -102); ctx.lineTo(tx + 2.7, -96); ctx.lineTo(tx + 5.4, -102); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      dinoFace(66, -124, 7, 90, -114, o, t);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(58, -136); ctx.quadraticCurveTo(66, -140, 74, -135); ctx.stroke();
    }
    ctx.restore();
    return null;
  }

  // =============================================================================================
  // valley scenery shared by the backdrop and the games
  // =============================================================================================
  function cycad(x, gy, h, s = 1, t = S.t) {
    // a stout palm-like trunk with diamond scales, a crown of feathery fronds and a bright cone
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const trunk = P2(`M-16,0 C-14,${-h * 0.5} -12,${-h * 0.8} -10,${-h} L10,${-h} C12,${-h * 0.8} 14,${-h * 0.5} 16,0 Z`);
    ink(trunk, '#b07a4a', 2.2);
    ctx.save(); ctx.clip(trunk); ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 2;
    for (let y = -6; y > -h; y -= 12) { ctx.beginPath(); ctx.moveTo(-18, y); ctx.lineTo(0, y - 8); ctx.lineTo(18, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(-12, -h, 7, h);
    ctx.restore();
    const sway = Math.sin(t * 1.2 + x * 0.01) * 0.05;
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.36 + sway, len = 70 - Math.abs(i - 4) * 4;
      const ex = Math.cos(a) * len, ey = -h + Math.sin(a) * len * 0.75 + Math.abs(i - 4) * 9;
      const cx = Math.cos(a) * len * 0.5, cy = -h - 26 + Math.abs(i - 4) * 3;
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -h); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      const pts = qpts(0, -h, cx, cy, ex, ey, 10);
      for (let j = 1; j < pts.length; j++) {
        const [px, py] = pts[j], [qx, qy] = pts[j - 1], ang = Math.atan2(py - qy, px - qx), ll = 13 - j * 0.6;
        for (const sd of [-1, 1]) { ctx.strokeStyle = i % 2 ? '#3fa84a' : '#4cb850'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(ang + sd * 1.1) * ll, py + Math.sin(ang + sd * 1.1) * ll); ctx.stroke(); }
      }
      ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -h); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    }
    inkEllipse(0, -h - 4, 9, 13, 0, '#ff9a3a', 1.2);
    ctx.strokeStyle = '#d0702a'; ctx.lineWidth = 1.2; for (const d of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(-8, -h - 4 + d); ctx.lineTo(8, -h - 4 + d + 3); ctx.stroke(); }
    ctx.restore();
  }
  // a big fern clump; s scales it, lean tips it
  function fern(x, gy, s = 1, col = '#4cc35a', t = S.t) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); ctx.lineCap = 'round';
    const n = 7;
    for (const pass of [0, 1]) for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32 + Math.sin(t * 1.5 + i + x) * 0.03, len = 64 - Math.abs(i - 3) * 6;
      const ex = Math.cos(a) * len * 1.1, ey = Math.sin(a) * len + Math.abs(i - 3) * 8, cx = Math.cos(a) * len * 0.4, cy = Math.sin(a) * len * 0.9 - 10;
      const pts = qpts(0, 0, cx, cy, ex, ey, 9);
      ctx.strokeStyle = pass ? (i % 2 ? col : mix(col, '#ffffff', 0.15)) : OL;
      for (let j = 1; j < pts.length; j++) {
        const [px, py] = pts[j], [qx, qy] = pts[j - 1], ang = Math.atan2(py - qy, px - qx), ll = (11 - j) * 1.3;
        ctx.lineWidth = pass ? 4.5 : 7.5;
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(ang + sd * 1.2) * ll, py + Math.sin(ang + sd * 1.2) * ll); ctx.stroke(); }
      }
      ctx.lineWidth = pass ? 2.5 : 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    }
    // a curled fiddlehead
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -30, 12, -44); ctx.arc(16, -44, 4, Math.PI, Math.PI * 2.6); ctx.stroke();
    ctx.strokeStyle = '#8ae070'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  function nest(x, y, s, eggCol = '#fff4dc', eggs = 3, t = S.t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkEllipse(0, 0, 46, 15, 0, '#a8763e', 2);
    for (let i = 0; i < eggs; i++) {
      const ex = (i - (eggs - 1) / 2) * 22, wob = Math.sin(t * 3 + i * 2) * (i === 1 ? 0.08 : 0.02);
      ctx.save(); ctx.translate(ex, -8); ctx.rotate(wob);
      inkEllipse(0, 0, 11, 14, 0, eggCol, 1.2);
      ctx.fillStyle = mix(eggCol, '#7a5a3a', 0.3); circle(-3, -4, 2); circle(4, 2, 1.6); circle(-1, 6, 1.4);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(-4, -6, 3, 4, -0.4);
      ctx.restore();
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 2, 46, 13, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const a = 0.2 + i * 0.28; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 44, Math.sin(a) * 12); ctx.lineTo(Math.cos(a + 0.5) * 38, Math.sin(a + 0.5) * 14 + 4); ctx.stroke(); }
    ctx.strokeStyle = '#8a5a2a'; for (let i = 0; i < 8; i++) { const a = 0.3 + i * 0.36; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 8 + 3); ctx.lineTo(Math.cos(a + 0.4) * 46, Math.sin(a + 0.4) * 11); ctx.stroke(); }
    ctx.restore();
  }
  function volcano(x, base, t) {
    const v = P2(`M${x - 190},${base} C${x - 120},${base - 60} ${x - 50},${base - 150} ${x - 26},${base - 178} L${x + 26},${base - 178} C${x + 50},${base - 150} ${x + 120},${base - 60} ${x + 190},${base} Z`);
    ink(v, '#a07890', 2);
    ctx.save(); ctx.clip(v);
    ctx.fillStyle = '#b88ca2'; ctx.beginPath(); ctx.moveTo(x - 26, base - 178); ctx.quadraticCurveTo(x - 70, base - 80, x - 150, base); ctx.lineTo(x - 60, base); ctx.quadraticCurveTo(x - 30, base - 90, x - 8, base - 178); ctx.fill();
    ctx.fillStyle = '#8a6280'; ctx.beginPath(); ctx.moveTo(x + 20, base - 178); ctx.quadraticCurveTo(x + 70, base - 90, x + 160, base); ctx.lineTo(x + 190, base); ctx.lineTo(x + 26, base - 178); ctx.fill();
    // cooled, sleepy lava streaks and a warm glow in the crater
    ctx.strokeStyle = 'rgba(255,150,90,.75)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - 6, base - 176); ctx.quadraticCurveTo(x - 14, base - 140, x - 6, base - 112); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 10, base - 176); ctx.quadraticCurveTo(x + 22, base - 150, x + 18, base - 128); ctx.stroke();
    // a green skirt of trees round its foot
    ctx.fillStyle = '#7cc66a'; for (let i = 0; i < 14; i++) circle(x - 180 + i * 28, base - 6 - (i % 3) * 5, 18);
    ctx.restore();
    inkEllipse(x, base - 178, 26, 6, 0, '#ff9a4a', 1.4);
    glow(x, base - 180, 40, '255,170,90', 0.35 + 0.1 * Math.sin(t * 2));
    // little puffs of cloud drifting off (they fade before the calm top band)
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.12 + i / 5) % 1, px = x + k * 70 + Math.sin(k * 6 + i) * 8, py = base - 190 - k * 90;
      ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - k)})`; circle(px, py, 10 + k * 16); circle(px + 10 + k * 8, py + 4, 8 + k * 12);
    }
  }
  function pterosaur(x, y, s, t, ph = 0) {
    const f = Math.sin(t * 6 + ph) * 0.5;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(110,80,140,.75)';
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-18, -12 - f * 18, -34, -4 - f * 22); ctx.quadraticCurveTo(-18, 2, -4, 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(18, -12 - f * 18, 34, -4 - f * 22); ctx.quadraticCurveTo(18, 2, 4, 4); ctx.fill();
    ellipse(0, 2, 7, 4); ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(16, 2); ctx.lineTo(5, 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-10, -7); ctx.lineTo(0, 1); ctx.fill();
    ctx.restore();
  }
  // a far herd of longnecks on the hills: just soft silhouettes
  function farLongneck(x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col;
    ellipse(0, -30, 46, 20); ctx.fillRect(-34, -30, 12, 30); ctx.fillRect(22, -30, 12, 30);
    ctx.beginPath(); ctx.moveTo(-40, -36); ctx.quadraticCurveTo(-80, -30, -100, -6); ctx.lineTo(-96, -4); ctx.quadraticCurveTo(-70, -22, -38, -22); ctx.fill();
    ctx.beginPath(); ctx.moveTo(26, -44); ctx.quadraticCurveTo(46, -80, 56, -112); ctx.lineTo(70, -110); ctx.quadraticCurveTo(58, -76, 40, -30); ctx.fill();
    ellipse(66, -114, 14, 9);
    ctx.restore();
  }
  // sky, sun, volcano, far hills with grazing longneck silhouettes, flying pterosaurs
  function valleyFar(t, vx = 300) {
    bdSky('#62c8ff', '#fff2cc');
    bdSunburst(830, 104);
    bdClouds(3, 'rgba(255,255,255,.85)', 92);
    bdHills('#b8d8f0', 300, 26, 0.006, 1);
    volcano(vx, 318, t);
    bdHills('#a8dc9a', 330, 18, 0.009, 2.2);
    for (const [x, y, s] of [[560, 318, 0.32], [640, 322, 0.26], [130, 334, 0.22]]) farLongneck(x, y, s, 'rgba(90,140,120,.45)');
    for (let i = 0; i < 3; i++) pterosaur(((i * 340 + t * (24 + i * 6)) % (W + 200)) - 100, 120 + i * 34 + Math.sin(t + i) * 8, 0.8 - i * 0.12, t, i * 2);
  }
  function waterfall(x, top, bot, w, t) {
    const gr = ctx.createLinearGradient(0, top, 0, bot);
    gr.addColorStop(0, '#bff0ff'); gr.addColorStop(1, '#6ad0f8');
    ctx.fillStyle = gr; ctx.fillRect(x - w / 2, top, w, bot - top);
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const lx = x - w / 2 + 6 + i * (w - 12) / 5, off = (t * 160 + i * 37) % 60; for (let y = top + off - 60; y < bot; y += 60) { if (y + 26 < top) continue; ctx.beginPath(); ctx.moveTo(lx, Math.max(top, y)); ctx.lineTo(lx, Math.min(bot, y + 26)); ctx.stroke(); } }
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w / 2, bot); ctx.moveTo(x + w / 2, top); ctx.lineTo(x + w / 2, bot); ctx.stroke();
  }
  // a cliff of striped rock layers, top at y, covering x0..x1 down to bot
  function rockCliff(x0, x1, y, bot, mossy = true) {
    const p = P2(`M${x0},${bot} L${x0},${y + 18} C${x0 + 10},${y} ${x0 + 30},${y - 4} ${(x0 + x1) / 2},${y} C${x1 - 30},${y - 4} ${x1 - 10},${y + 4} ${x1},${y + 14} L${x1},${bot} Z`);
    ink(p, '#d79a6a', 2.4);
    ctx.save(); ctx.clip(p);
    const bands = ['#e8b484', '#c88458', '#e0a676', '#b8764e', '#d8986a'];
    for (let i = 0; i < 12; i++) { ctx.fillStyle = bands[i % 5]; ctx.beginPath(); const yy = y + 24 + i * 26; ctx.moveTo(x0, yy); ctx.quadraticCurveTo((x0 + x1) / 2, yy + 8 * Math.sin(i), x1, yy + 4); ctx.lineTo(x1, yy + 13); ctx.quadraticCurveTo((x0 + x1) / 2, yy + 20, x0, yy + 13); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0, y, 14, bot - y);
    if (mossy) { ctx.fillStyle = '#6ac85a'; ctx.beginPath(); ctx.moveTo(x0, y + 18); ctx.quadraticCurveTo(x0 + 30, y - 6, (x0 + x1) / 2, y); ctx.quadraticCurveTo(x1 - 20, y - 4, x1, y + 14); ctx.lineTo(x1, y + 26); ctx.quadraticCurveTo((x0 + x1) / 2, y + 16, x0, y + 30); ctx.fill(); }
    ctx.restore();
    if (mossy) { ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y + 30); ctx.quadraticCurveTo((x0 + x1) / 2, y + 16, x1, y + 26); ctx.stroke(); }
  }
  // the paleontologist's dig site: striped tent, tool rack, crate of bones and a roped-off dig square
  function digSite(x, gy, t) {
    // dig square with stakes and string, a bone peeking out
    ink(P2(`M${x + 70},${gy + 4} L${x + 190},${gy + 4} L${x + 172},${gy - 26} L${x + 88},${gy - 26} Z`), '#c89a64', 1.6);
    ctx.fillStyle = '#b08050'; ellipse(x + 130, gy - 10, 40, 8);
    ctx.save(); ctx.translate(x + 132, gy - 12); ctx.rotate(-0.2); ink(P2('M-16,-2 L16,-2 L16,2 L-16,2 Z'), '#fff4dc', 1); inkCircle(-17, -2, 3.5, '#fff4dc', 0.8); inkCircle(-17, 3, 3.5, '#fff4dc', 0.8); inkCircle(17, -2, 3.5, '#fff4dc', 0.8); inkCircle(17, 3, 3.5, '#fff4dc', 0.8); ctx.restore();
    for (const [sx, sy] of [[x + 70, gy + 4], [x + 190, gy + 4], [x + 172, gy - 26], [x + 88, gy - 26]]) inkRect(sx - 2, sy - 16, 4, 18, '#a0683a', 0.8, 1);
    ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 70, gy - 10); ctx.lineTo(x + 88, gy - 40); ctx.lineTo(x + 172, gy - 40); ctx.lineTo(x + 190, gy - 10); ctx.stroke();
    // tent
    const tent = P2(`M${x - 70},${gy} L${x},${gy - 112} L${x + 70},${gy} Z`);
    ink(tent, '#fff2d0', 2.4);
    ctx.save(); ctx.clip(tent); ctx.fillStyle = '#ff8a5a'; for (let i = -3; i <= 3; i += 2) { ctx.beginPath(); ctx.moveTo(x, gy - 112); ctx.lineTo(x + i * 20, gy); ctx.lineTo(x + (i + 1) * 20, gy); ctx.fill(); } ctx.restore();
    ink(P2(`M${x - 22},${gy} L${x},${gy - 66} L${x + 22},${gy} Z`), '#5a3a4a', 1.6);
    ink(P2(`M${x},${gy - 66} L${x + 22},${gy} L${x + 34},${gy} Z`), '#ffe7b0', 1.4);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, gy - 112); ctx.lineTo(x, gy - 140); ctx.stroke();
    const fl = Math.sin(t * 4) * 3;
    ink(P2(`M${x},${gy - 140} L${x + 22},${gy - 134 + fl} L${x},${gy - 126} Z`), '#5ac87a', 1);
    ctx.strokeStyle = 'rgba(91,63,115,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 70, gy); ctx.lineTo(x - 90, gy + 4); ctx.moveTo(x + 70, gy); ctx.lineTo(x + 90, gy + 4); ctx.stroke();
    // crate of bones and leaning tools
    inkRect(x - 128, gy - 30, 48, 30, '#c8904a', 1.6, 3);
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 128, gy - 15); ctx.lineTo(x - 80, gy - 15); ctx.stroke();
    for (const [bx, by, a] of [[-116, -34, -0.4], [-96, -36, 0.5]]) { ctx.save(); ctx.translate(x + bx, gy + by); ctx.rotate(a); inkRect(-10, -2, 20, 4, '#fff4dc', 0.8, 2); inkCircle(-10, 0, 3, '#fff4dc', 0.6); inkCircle(10, 0, 3, '#fff4dc', 0.6); ctx.restore(); }
    // shovel and a big brush leaning on the tent
    ctx.save(); ctx.translate(x + 58, gy); ctx.rotate(-0.25);
    inkRect(-2, -64, 4, 52, '#b07a4a', 0.8, 2); ink(P2('M-8,-14 L8,-14 L6,4 C3,8 -3,8 -6,4 Z'), '#c0c8d8', 1);
    ctx.restore();
    ctx.save(); ctx.translate(x - 58, gy); ctx.rotate(0.3);
    inkRect(-2, -54, 4, 40, '#e0a050', 0.8, 2); inkRect(-6, -16, 12, 16, '#7a5a3a', 0.9, 2);
    ctx.restore();
  }
  function footprint(x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.fillStyle = 'rgba(120,80,50,.28)';
    ellipse(0, 4, 7, 6); for (const d of [-0.5, 0, 0.5]) { ctx.save(); ctx.rotate(d); ellipse(0, -9, 3, 7); ctx.restore(); }
    ctx.restore();
  }

  // =============================================================================================
  // the location backdrop
  // =============================================================================================
  BACKDROPS.dinovalley3 = () => {
    const t = S.t;
    valleyFar(t, 300);
    // waterfall cliff on the right, pool below it
    rockCliff(770, 980, 168, 430);
    waterfall(852, 186, 404, 48, t);
    ink(ellP(852, 414, 112, 20), '#5ac4f0', 1.8);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(830, 410, 60, 5);
    for (let i = 0; i < 6; i++) { const k = (t * 0.8 + i / 6) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; circle(830 + i * 9, 404 - k * 18, 5 + k * 6); }
    fern(800, 176, 0.55, '#5ac85a', t); fern(930, 180, 0.5, '#4cb850', t);
    // midground meadow
    ctx.fillStyle = '#9ad86a'; ctx.beginPath(); ctx.moveTo(0, 360); ctx.quadraticCurveTo(300, 340, 600, 372); ctx.quadraticCurveTo(720, 380, 780, 390); ctx.lineTo(780, H); ctx.lineTo(0, H); ctx.fill();
    cycad(60, 400, 150, 0.9, t); cycad(640, 392, 120, 0.75, t); cycad(165, 384, 92, 0.6, t);
    digSite(440, 404, t);
    // the near ground: grass with a sandy trail and big three-toed footprints
    const gg = ctx.createLinearGradient(0, 410, 0, H);
    gg.addColorStop(0, '#8ccf5a'); gg.addColorStop(1, '#6ab848');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, 432); ctx.quadraticCurveTo(480, 412, W, 436); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 432); ctx.quadraticCurveTo(480, 412, W, 436); ctx.stroke();
    ctx.fillStyle = '#f2dca0'; ctx.beginPath(); ctx.moveTo(0, 478); ctx.quadraticCurveTo(480, 452, W, 480); ctx.lineTo(W, 512); ctx.quadraticCurveTo(480, 490, 0, 514); ctx.fill();
    for (let i = 0; i < 7; i++) footprint(330 + i * 62, 486 - Math.sin(i / 6 * Math.PI) * 10 + (i % 2) * 10, 1.1, Math.PI / 2);
    ctx.fillStyle = '#9ade6e'; for (let i = 0; i < 26; i++) ellipse((i * 211) % W, 444 + (i * 37) % 90, 12, 3.5);
    // flowers, pebbles and foreground ferns at the edges
    for (let i = 0; i < 9; i++) flower(30 + i * 112 + (i % 2) * 30, 450 + (i % 3) * 10, 6, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff', '#ff9a5a'][i % 5], '#ffd84a', 1);
    nest(92, 452, 0.85, '#ffe9b8', 3, t);
    nest(560, 440, 0.6, '#c8f0ff', 2, t);
    for (const [x, y] of [[420, 524], [560, 530], [880, 520], [140, 528]]) inkEllipse(x, y, 9, 5, 0, '#d8ccd4', 1);
    fern(18, 545, 0.95, '#3fae4f', t); fern(950, 548, 0.9, '#3fae4f', t);
    // a dragonfly zipping over the meadow
    const dx = 560 + Math.sin(t * 0.7) * 200, dy = 300 + Math.sin(t * 2.1) * 26;
    ctx.fillStyle = 'rgba(200,240,255,.8)'; ellipse(dx - 6, dy - 6, 12, 4, -0.6 + Math.sin(t * 40) * 0.3); ellipse(dx + 6, dy - 6, 12, 4, 0.6 - Math.sin(t * 40) * 0.3);
    ctx.strokeStyle = '#2a8ad8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(dx - 18, dy); ctx.lineTo(dx + 10, dy); ctx.stroke();
  };

  // =============================================================================================
  // GAME 1 (action) LONGNECK LIFT: Aubrey rides on Lofty's head. Left/right walk, up/down move
  // the long neck like a crane. Pick the baby dinos off high perches; lower each into its own nest.
  // =============================================================================================
  const LL = { feet: 478, s: 0.95, len: 218, aMin: -0.42, aMax: 1.42, xMin: 100, xMax: 860, nestY: 506 };
  const LL_SHOULDER = () => LL.feet - 100 * LL.s;
  // where babies wait: (x, y) = the baby's feet; the spot Aubrey must reach is just above them
  const LL_PERCHES = [
    { x: 64, y: 262, what: 'cliff' }, { x: 330, y: 194, what: 'cycad' }, { x: 906, y: 216, what: 'cliff' },
    { x: 604, y: 256, what: 'cycad' }, { x: 470, y: 352, what: 'rock' }, { x: 742, y: 478, what: 'ground' },
  ];
  const DINO_NAME = { tri: 'Triceratops', stego: 'Stegosaurus', trex: 'T. rex', brachio: 'Brachiosaurus' };
  const BABY_NAME = { tri: 'baby triceratops', stego: 'baby stegosaurus', trex: 'baby T. rex', brachio: 'baby longneck' };
  const babyDraw = (kind, x, feet, s, dir, o = {}) => drawDino(kind, x, feet, (kind === 'brachio' ? 0.2 : 0.24) * s, dir, o);
  const babyMid = b => ({ x: b.x, y: b.y - 16 });

  MG.dinolift = {
    kind: 'action', title: () => 'Longneck Lift', icon: () => '🦕',
    how: () => "Ride on Lofty's head! Left and right walk, up and down move his long neck. Scoop up each baby dino, then lower it into the nest with its picture. Dodge the giant dragonflies! (Or hold your finger where Aubrey should go.)",
    init(g) {
      const kinds = g.tier === 1 ? ['tri', 'stego', 'trex'] : ['tri', 'stego', 'trex', 'brachio'];
      const n = [3, 5, 6][g.tier - 1];
      const nestXs = kinds.length === 3 ? [190, 480, 770] : [150, 370, 590, 810];
      const order = shuffle(kinds.slice());
      const nests = order.map((k, i) => ({ kind: k, x: nestXs[i], y: LL.nestY, has: 0, wob: 0 }));
      const perches = shuffle(LL_PERCHES.slice()).slice(0, n);
      const babyKinds = shuffle([...kinds, ...shuffle(kinds.slice())].slice(0, n));
      const babies = perches.map((p, i) => ({ kind: babyKinds[i], home: p, x: p.x, y: p.y, state: 'wait', t: rand(0, 3), dir: p.x > 480 ? -1 : 1 }));
      const flies = [];
      for (let i = 0; i < [1, 2, 3][g.tier - 1]; i++) flies.push(this.newFly(g, i, true));
      Object.assign(g, {
        bx: 480, dir: 1, ang: 0.5, walk: 0, walking: false, nests, babies, flies, carry: null, homed: 0, total: n,
        wrong: 0, bumps: 0, stun: 0, inv: 0, cheer: 0, tgt: null, timeLeft: [80, 90, 100][g.tier - 1], endT: 0,
        nearWrong: null, wrongT: 0, msg: '', msgT: 0, fx: [], progress: `Babies home: 0 / ${n}`,
      });
      this.pose(g);
    },
    newFly(g, i, first) {
      const fromLeft = Math.random() < 0.5;
      return { x: fromLeft ? -60 - (first ? i * 300 : rand(0, 200)) : W + 60 + (first ? i * 300 : rand(0, 200)), y: rand(150, 400), vx: (fromLeft ? 1 : -1) * (60 + g.tier * 30 + rand(0, 25)), ph: rand(0, TAU), amp: rand(18, 40) };
    },
    start(g) { say(g, "Up, up, up! Scoop up a baby dino, then lower it into the nest with its picture."); },
    // head and Aubrey positions for the current pose
    pose(g) {
      const s = LL.s, sx = g.bx + g.dir * 48 * s, sy = LL_SHOULDER();
      g.hx = sx + g.dir * Math.cos(g.ang) * LL.len; g.hy = sy - Math.sin(g.ang) * LL.len;
      g.feetA = g.hy - 21 * s;                                // Aubrey's feet on Lofty's head
      g.ax = g.hx + g.dir * 2; g.ay = g.feetA - 34;            // Aubrey's middle
    },
    // the body x and facing that would put Aubrey's middle on (tx, ty)
    solve(g, tx, ty) {
      const sy = LL_SHOULDER(), hy = ty + 34 + 21 * LL.s;
      const a = clamp(Math.asin(clamp((sy - hy) / LL.len, -1, 1)), LL.aMin, LL.aMax);
      const reach = 48 * LL.s + Math.cos(a) * LL.len + 2;
      const opts = [[tx - reach, 1], [tx + reach, -1]].filter(([bx]) => bx >= LL.xMin - 1 && bx <= LL.xMax + 1);
      if (!opts.length) opts.push([clamp(tx - reach, LL.xMin, LL.xMax), 1]);
      opts.sort((p, q) => Math.abs(p[0] - g.bx) + (p[1] !== g.dir ? 30 : 0) - Math.abs(q[0] - g.bx) - (q[1] !== g.dir ? 30 : 0));
      return { bx: opts[0][0], dir: opts[0][1], ang: a };
    },
    update(g, dt) {
      if (g.endT > 0) { g.endT -= dt; g.cheer += dt; if (g.endT <= 0) g.done = true; this.tick(g, dt); return; }
      g.timeLeft -= dt;
      g.stun = Math.max(0, g.stun - dt); g.inv = Math.max(0, g.inv - dt); g.cheer = Math.max(0, g.cheer - dt); g.msgT -= dt;
      // controls: keys, or hold/tap where Aubrey should go
      let mx = 0, my = 0;
      if (goLeft()) mx -= 1; if (goRight()) mx += 1;
      if (keys.arrowup || keys.w) my += 1; if (goDown()) my -= 1;
      if (mx || my) g.tgt = null;
      if (pointer.clicked || (pointer.down && g.tgt)) { if (pointer.y > 64) g.tgt = { x: clamp(pointer.x, 0, W), y: clamp(pointer.y, 60, 470) }; }
      const before = g.bx;
      if (g.stun <= 0) {
        if (g.tgt) {
          const sol = this.solve(g, g.tgt.x, g.tgt.y);
          if (sol.dir !== g.dir && Math.abs(sol.bx - g.bx) > 4) g.dir = sol.dir;
          const d = sol.bx - g.bx; g.bx += clamp(d, -240 * dt, 240 * dt);
          const da = sol.ang - g.ang; g.ang += clamp(da, -1.7 * dt, 1.7 * dt);
          if (Math.abs(d) < 2 && Math.abs(da) < 0.01 && !pointer.down) g.tgt = null;
        } else {
          if (mx) { g.dir = mx; g.bx += mx * 230 * dt; }
          if (my) g.ang += my * 1.5 * dt;
        }
      }
      g.bx = clamp(g.bx, LL.xMin, LL.xMax); g.ang = clamp(g.ang, LL.aMin, LL.aMax);
      g.walking = Math.abs(g.bx - before) > 0.3;
      if (g.walking) { const w0 = g.walk; g.walk += dt * 9; if (Math.floor(w0 / Math.PI) !== Math.floor(g.walk / Math.PI)) tone(110, 0.08, 'triangle', 0.07); }
      this.pose(g);
      // pick up a waiting baby
      if (!g.carry) for (const b of g.babies) {
        if (b.state !== 'wait') continue;
        const m = babyMid(b);
        if (Math.hypot(m.x - g.ax, m.y - g.ay) < 58) {
          b.state = 'carry'; g.carry = b; SFX.pick(); g.cheer = 0.5;
          say(g, `Got the ${BABY_NAME[b.kind]}! Find the nest with its picture.`);
          break;
        }
      }
      // drop it in a nest
      let near = null;
      for (const n of g.nests) if (Math.hypot(n.x - g.hx, n.y - 18 - g.hy) < 72) near = n;
      if (g.carry && near) {
        if (near.kind === g.carry.kind) {
          const b = g.carry; g.carry = null; b.state = 'home'; b.nest = near; b.hop = 0; b.fromX = g.hx + g.dir * 20; b.fromY = g.feetA;
          near.has++; g.homed++; near.wob = 1; g.cheer = 1;
          SFX.sparkle(); burst(near.x, near.y - 20, 18);
          g.progress = `Babies home: ${g.homed} / ${g.total}`;
          if (g.homed >= g.total) { g.endT = 2.4; say(g, 'Every baby is home! Hooray!'); }
          else say(g, pick(['Home sweet home!', 'Snug in the nest!', 'Yay! Next baby!']));
        }
      }
      // a wrong nest only counts once she stops there for a moment, not when she sweeps past
      if (g.carry && near && near.kind !== g.carry.kind) {
        if (g.nearWrong !== near && (g.wrongT += dt) > 0.5) {
          g.nearWrong = near; g.wrongT = 0; g.wrong++; SFX.miss();
          g.msg = `Not my nest! I'm a ${BABY_NAME[g.carry.kind]}.`; g.msgT = 2.2;
          say(g, `That's the ${DINO_NAME[near.kind]} nest. Find the ${DINO_NAME[g.carry.kind]} nest!`);
        }
      } else { g.wrongT = 0; if (!near) g.nearWrong = null; }
      // giant dragonflies
      for (let i = 0; i < g.flies.length; i++) {
        const f = g.flies[i];
        f.x += f.vx * dt; f.ph += dt * 2;
        const fy = f.y + Math.sin(f.ph) * f.amp;
        if ((f.vx > 0 && f.x > W + 80) || (f.vx < 0 && f.x < -80)) { g.flies[i] = this.newFly(g, i, false); continue; }
        if (g.inv <= 0 && Math.hypot(f.x - g.ax, fy - g.ay) < 36) {
          g.bumps++; g.stun = 0.7; g.inv = 1.8; SFX.hit(); f.vx *= -1;
          if (g.carry && g.tier > 1) {
            const b = g.carry; g.carry = null; b.state = 'flyback'; b.hop = 0; b.fromX = g.hx; b.fromY = g.feetA;
            g.msg = 'Bzzz! The baby hopped back home!'; g.msgT = 2.2; say(g, 'Bzzz! Oh no, the baby got scared and hopped back. Dodge the dragonflies!');
          } else { g.msg = 'Bzzz! Watch out!'; g.msgT = 1.6; say(g, 'Bzzz! Watch out for the dragonflies!'); }
        }
      }
      this.tick(g, dt);
      g.score = clamp(g.homed / g.total - 0.05 * g.wrong - 0.04 * g.bumps, 0, 1);
      if (g.timeLeft <= 0 && g.endT <= 0) { g.timeLeft = 0; g.done = true; }
    },
    tick(g, dt) {
      for (const b of g.babies) {
        b.t += dt;
        if (b.state === 'home' || b.state === 'flyback') {
          b.hop = Math.min(1, b.hop + dt * 1.6);
          const tx = b.state === 'home' ? b.nest.x + (b.nest.has > 1 ? (b.slot ?? (b.slot = (b.nest.has - 1) % 3 - 1)) * 22 : 0) : b.home.x;
          const ty = b.state === 'home' ? b.nest.y - 6 : b.home.y;
          const k = ease(b.hop);
          b.x = lerp(b.fromX, tx, k); b.y = lerp(b.fromY, ty, k) - Math.sin(k * Math.PI) * 60;
          if (b.state === 'flyback' && b.hop >= 1) b.state = 'wait';
          if (b.state === 'home' && b.hop >= 1) b.state = 'nested';
        }
      }
      for (const n of g.nests) n.wob = Math.max(0, n.wob - dt * 1.5);
    },

    // ----- art -----
    drawWorld(g, t) {
      valleyFar(t, 240);
      // left cliff ledge and right cliff with the waterfall
      rockCliff(-20, 118, LL_PERCHES[0].y, 470);
      rockCliff(846, 980, LL_PERCHES[2].y, 470);
      waterfall(930, LL_PERCHES[2].y + 18, 452, 30, t);
      ctx.fillStyle = '#9ad86a'; ctx.beginPath(); ctx.moveTo(0, 400); ctx.quadraticCurveTo(480, 380, W, 404); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      cycad(LL_PERCHES[1].x, 452, 452 - LL_PERCHES[1].y - 2, 1, t);
      cycad(LL_PERCHES[3].x, 452, (452 - LL_PERCHES[3].y - 2) / 0.85, 0.85, t);
      // a big mossy boulder
      const r = LL_PERCHES[4];
      ink(P2(`M${r.x - 52},470 C${r.x - 60},${r.y + 40} ${r.x - 40},${r.y + 2} ${r.x - 4},${r.y} C${r.x + 34},${r.y - 2} ${r.x + 56},${r.y + 36} ${r.x + 54},470 Z`), '#a89cb4', 2.2);
      ctx.fillStyle = '#7ad06a'; ellipse(r.x - 6, r.y + 4, 34, 7);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(r.x - 24, r.y + 40, 10, 26, 0.2);
      // ground
      const gg = ctx.createLinearGradient(0, 452, 0, H);
      gg.addColorStop(0, '#8ccf5a'); gg.addColorStop(1, '#6ab848');
      ctx.fillStyle = gg; ctx.fillRect(0, 462, W, H - 462);
      ctx.strokeStyle = 'rgba(91,63,115,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 462); ctx.lineTo(W, 462); ctx.stroke();
      ctx.fillStyle = '#9ade6e'; for (let i = 0; i < 20; i++) ellipse((i * 211) % W, 474 + (i * 37) % 60, 12, 3.5);
      fern(LL_PERCHES[5].x + 40, 482, 0.6, '#4cc35a', t);
    },
    drawSign(n, t) {
      const x = n.x, y = n.y - 64;
      ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x, n.y - 10); ctx.stroke();
      ctx.strokeStyle = '#b07a4a'; ctx.lineWidth = 4; ctx.stroke();
      inkRect(x - 32, y - 26, 64, 40, '#fff6dc', 2, 8);
      ctx.fillStyle = DINO_COL[n.kind]; ctx.globalAlpha = 0.35; ctx.fillRect(x - 30, y - 24, 60, 8); ctx.globalAlpha = 1;
      babyDraw(n.kind, x + 2, y + 10, n.kind === 'brachio' ? 0.62 : 0.78, 1, { t, blink: false });
    },
    drawBaby(g, b, t, dir) {
      const hop = b.state === 'wait' ? Math.abs(Math.sin(b.t * 3)) * 3 : 0;
      babyDraw(b.kind, b.x, b.y - hop, 1, dir ?? b.dir, { t });
    },
    draw(g) {
      const t = S.t;
      this.drawWorld(g, t);
      // which thing to aim for glows
      const goal = g.carry ? g.nests.find(n => n.kind === g.carry.kind) : null;
      for (const n of g.nests) this.drawSign(n, t);
      for (const b of g.babies) if (b.state === 'wait') {
        glow(b.x, b.y - 16, 46, '255,240,150', 0.35 + 0.2 * Math.sin(t * 4 + b.t));
        this.drawBaby(g, b, t);
        if (!g.carry && Math.sin(b.t * 1.3) > 0.6) { ctx.fillStyle = '#fff'; inkCircle(b.x + 18, b.y - 50, 11, '#ffffff', 1); text('!', b.x + 18, b.y - 49, 15, '#ff5a7a', 'center', 900); }
      }
      // Lofty, with Aubrey riding on his head
      const lift = g.cheer > 0 ? Math.abs(Math.sin(g.cheer * 6)) * 6 : 0;
      drawLongneck(g.bx, LL.feet, LL.s, g.dir, { ang: g.ang, len: LL.len / LL.s, walk: g.walk, walking: g.walking, t, talk: g.cheer > 0.3 });
      if (g.inv > 0 && Math.floor(t * 10) % 2) ctx.globalAlpha = 0.55;
      aubreyExplorer(g.ax, g.feetA + 2, g.endT > 0 || g.cheer > 0.6 ? 'twirl' : 'idle_front', g.dir, lift, 0.3);
      ctx.globalAlpha = 1;
      if (g.carry) babyDraw(g.carry.kind, g.hx + g.dir * 26, g.feetA + 6, 0.9, g.dir, { t });
      if (g.stun > 0) for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; star(g.ax + Math.cos(a) * 18, g.ay - 40 + Math.sin(a) * 5, 5, '#fff59a', 5); }
      // nests in front, babies that made it home sit in them
      for (const n of g.nests) {
        if (goal === n) { glow(n.x, n.y - 10, 80, '255,240,150', 0.5 + 0.25 * Math.sin(t * 6)); }
        ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(Math.sin(n.wob * 20) * 0.06 * n.wob); ctx.translate(-n.x, -n.y);
        nest(n.x, n.y, 0.9, mix(DINO_COL[n.kind], '#ffffff', 0.6), 0, t);
        ctx.restore();
        ctx.strokeStyle = DINO_COL[n.kind]; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(n.x, n.y + 3, 46, 13, 0, 0.15, Math.PI - 0.15); ctx.stroke();
      }
      for (const b of g.babies) if (b.state === 'home' || b.state === 'nested' || b.state === 'flyback') {
        this.drawBaby(g, b, t, b.state === 'flyback' ? b.dir : 1);
        if (b.state === 'nested') { const k = (t + b.t) % 2; if (k < 1) { ctx.globalAlpha = 1 - k; heart(b.x + 10, b.y - 44 - k * 20, 14, '#ff6fae'); ctx.globalAlpha = 1; } }
      }
      // dragonflies
      for (const f of g.flies) this.drawFly(f.x, f.y + Math.sin(f.ph) * f.amp, Math.sign(f.vx), t);
      if (g.msgT > 0) bubble(clamp(g.ax, 150, W - 150), clamp(g.ay - 92, 90, 440), g.msg, '#4a2a5e', 17);
      if (g.endT > 0) outlined('Every baby is home!', W / 2, 250, 40, '#ffe36b', 'center', '#4a2a5e');
      if (g.t < 6 && !g.carry && g.homed === 0) { darkPanel(W / 2 - 230, 70, 460, 34, 17); text('⬅ ➡ walk    ⬆ ⬇ neck    or tap where to go', W / 2, 87, 15, '#fff', 'center', 600); }
    },
    drawFly(x, y, d, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
      const fl = Math.sin(t * 50) * 0.35;
      ctx.fillStyle = 'rgba(210,245,255,.75)'; ctx.strokeStyle = 'rgba(60,90,140,.6)'; ctx.lineWidth = 1.2;
      for (const [ox, a] of [[-2, -0.5 + fl], [6, -0.3 - fl], [-2, 0.5 - fl], [6, 0.3 + fl]]) { ctx.beginPath(); ctx.ellipse(ox, -4, 22, 6, a + (a < 0 ? -0.4 : 0.4) - (a < 0 ? 0 : 0.8), 0, TAU); ctx.fill(); ctx.stroke(); }
      ink(tubeP([[-36, 0], [-10, 0], [10, 0]], 5, 9), '#2a9ad8', 1.2);
      inkCircle(14, 0, 7, '#3ab0e8', 1.2);
      ctx.fillStyle = '#7a3a8a'; circle(17, -3, 3); ctx.fillStyle = '#fff'; circle(18, -4, 1);
      ctx.restore();
    },
  };

  // =============================================================================================
  // GAME 2 (learn) FOSSIL HUNT: brush gently, build the skeleton, name the dinosaur, plant or meat?
  // =============================================================================================
  // --- skeletons: 4 pieces each, drawn in the same coordinates as the fleshed-out dinos ---------
  const BONE = '#f3e6c8', BONE_HI = '#fffaee', SOCKET = '#6a5440';
  const numPts = str => { const n = str.match(/-?\d+(\.\d+)?/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; };
  const oL = (pts, w) => ({ k: 'l', pts, w });
  const oC = (x, y, r) => ({ k: 'c', x, y, r });
  const oE = (x, y, rx, ry, rot = 0) => ({ k: 'p', p: ellP(x, y, rx, ry, rot), pts: [[x - rx, y - ry], [x + rx, y + ry]] });
  const oP = svg => ({ k: 'p', p: P2(svg), pts: numPts(svg) });
  // a row of vertebrae: tapering bone segments with knobbly joints
  const chain = (pts, w0, w1, n = 8) => {
    const segs = [], dense = [];
    for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < n; j++) { const k = j / n; dense.push([lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]); }
    dense.push(pts[pts.length - 1]);
    const m = dense.length;
    for (let i = 0; i < m - 1; i++) segs.push(oL([dense[i], dense[i + 1]], lerp(w0, w1, i / (m - 1))));
    for (let i = 0; i < m; i += 2) segs.push(oC(dense[i][0], dense[i][1], lerp(w0, w1, i / (m - 1)) * 0.68));
    return segs;
  };
  const ribs = (spine, xs, bottom, w = 4.5) => xs.map(x => {
    let y = spine[0][1];
    for (let i = 0; i < spine.length - 1; i++) if (x >= spine[i][0] && x <= spine[i + 1][0]) y = lerp(spine[i][1], spine[i + 1][1], (x - spine[i][0]) / (spine[i + 1][0] - spine[i][0]));
    return oL([[x, y], [x + 6, lerp(y, bottom, 0.55)], [x + 2, bottom]], w);
  });
  const legBones = (pts, w) => [oL(pts, w), oE(pts[pts.length - 1][0] + 4, pts[pts.length - 1][1] + 1, w * 0.9, w * 0.42)];
  const sockets = (list) => c => { c.fillStyle = SOCKET; for (const [x, y, rx, ry] of list) { c.beginPath(); c.ellipse(x, y, rx, ry ?? rx, 0, 0, TAU); c.fill(); } };
  const teeth = (x0, y, n, step, h) => c => {
    c.fillStyle = '#ffffff'; c.strokeStyle = OL; c.lineWidth = 1.2;
    for (let i = 0; i < n; i++) { const tx = x0 + i * step; c.beginPath(); c.moveTo(tx, y); c.lineTo(tx + step / 2, y + h); c.lineTo(tx + step, y); c.closePath(); c.fill(); c.stroke(); }
  };
  const stegoPlates = () => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const k = i / 6, px = -58 + k * 108, py = -62 - Math.sin(k * Math.PI) * 40, h = 16 + Math.sin(k * Math.PI) * 18, w = 11 + Math.sin(k * Math.PI) * 6, a = (k - 0.5) * 0.7;
      const c = Math.cos(a), sn = Math.sin(a), P = (u, v) => `${(px + u * c - v * sn).toFixed(1)},${(py + u * sn + v * c).toFixed(1)}`;
      out.push(oP(`M${P(-w, 6)} L${P(-w * 0.8, -h * 0.5)} L${P(0, -h - 6)} L${P(w * 0.8, -h * 0.5)} L${P(w, 6)} Z`));
    }
    return out;
  };
  const stegoSpikes = () => [[-118, -48, -0.9], [-126, -44, -0.5], [-132, -38, 2.4], [-136, -34, 2.8]].map(([x, y, a]) => oP(`M${x - 4},${y} L${(x + Math.cos(a - 1.57) * 22).toFixed(1)},${(y + Math.sin(a - 1.57) * 22).toFixed(1)} L${x + 4},${y} Z`));
  const brHead = (hx, hy) => `M${hx - 22},${hy + 4} C${hx - 24},${hy - 14} ${hx - 10},${hy - 27} ${hx + 4},${hy - 25} C${hx + 13},${hy - 24} ${hx + 16},${hy - 17} ${hx + 20},${hy - 13} C${hx + 34},${hy - 11} ${hx + 41},${hy} ${hx + 39},${hy + 8} C${hx + 37},${hy + 16} ${hx + 20},${hy + 18} ${hx},${hy + 16} C${hx - 14},${hy + 15} ${hx - 21},${hy + 11} ${hx - 22},${hy + 4} Z`;
  const PIECE_NAME = { skull: 'skull', back: 'backbone', tail: 'tail', legs: 'legs' };
  const SK = {
    tri: { u: 1, pieces: {
      skull: { ops: [oE(74, -74, 30, 30), oP('M60,-70 C62,-90 92,-92 104,-74 C112,-64 120,-56 116,-46 C108,-41 96,-42 88,-44 C76,-44 62,-50 60,-70 Z'),
        oP('M80,-84 C84,-100 92,-112 100,-118 C98,-106 94,-94 90,-82 Z'), oP('M88,-82 C94,-98 104,-110 114,-116 C110,-102 104,-90 98,-80 Z'), oP('M104,-66 C108,-74 110,-80 112,-86 C116,-78 116,-70 112,-62 Z')],
        extra: sockets([[90, -66, 5.5, 6.5], [56, -86, 6, 5], [70, -97, 5, 4], [109, -55, 2.4]]) },
      back: { ops: [...ribs([[-60, -56], [-36, -74], [0, -82], [36, -74], [56, -62]], [-38, -24, -10, 4, 18, 32], -34), ...chain([[-60, -56], [-36, -74], [0, -82], [36, -74], [56, -62]], 10, 9, 3)] },
      tail: { ops: chain([[-62, -56], [-96, -48], [-120, -34], [-132, -24]], 9, 3, 3) },
      legs: { ops: [oE(-40, -54, 15, 9), ...legBones([[48, -48], [52, -26], [48, -6]], 9), ...legBones([[-34, -50], [-30, -28], [-36, -6]], 10), ...legBones([[36, -50], [40, -26], [36, -6]], 10), ...legBones([[-46, -52], [-42, -28], [-48, -6]], 11)] },
    } },
    stego: { u: 1, pieces: {
      skull: { ops: [oP('M76,-44 C80,-56 98,-56 106,-46 C112,-40 112,-30 104,-27 C96,-24 84,-25 78,-30 C74,-34 74,-40 76,-44 Z')], extra: sockets([[92, -42, 4.5], [104, -36, 1.8]]) },
      back: { ops: [...stegoPlates(), ...ribs([[-62, -58], [-40, -86], [-4, -98], [30, -86], [56, -58]], [-42, -28, -14, 0, 14, 28, 42], -32), ...chain([[-62, -58], [-40, -86], [-4, -98], [30, -86], [56, -58], [74, -44]], 10, 7, 3)] },
      tail: { ops: [...stegoSpikes(), ...chain([[-62, -58], [-100, -54], [-136, -38]], 9, 4, 4)] },
      legs: { ops: [oE(-40, -60, 15, 9), ...legBones([[54, -44], [56, -24], [54, -6]], 9), ...legBones([[-34, -60], [-28, -32], [-34, -6]], 11), ...legBones([[44, -46], [46, -24], [44, -6]], 10), ...legBones([[-46, -62], [-40, -32], [-46, -6]], 12)] },
    } },
    trex: { u: 1, pieces: {
      skull: { ops: [oP('M26,-118 C28,-142 70,-150 94,-134 C102,-128 104,-116 102,-106 L66,-102 C72,-98 92,-98 98,-90 C90,-80 62,-80 44,-88 C30,-94 24,-106 26,-118 Z')],
        extra: c => { teeth(66, -103, 6, 5.4, 7)(c); sockets([[60, -124, 8, 9], [80, -120, 7, 4], [96, -126, 2]])(c); c.strokeStyle = SOCKET; c.lineWidth = 2; c.beginPath(); c.moveTo(44, -96); c.lineTo(66, -102); c.stroke(); } },
      back: { ops: [oL([[24, -80], [36, -70], [44, -74]], 5), oL([[44, -74], [50, -70]], 3), oL([[44, -74], [49, -80]], 3),
        ...ribs([[-40, -82], [-20, -88], [6, -92], [22, -100]], [-6, 4, 14], -64), ...chain([[-40, -82], [-20, -88], [6, -92], [22, -100], [40, -106]], 10, 9, 3)] },
      tail: { ops: chain([[-40, -82], [-90, -86], [-146, -62]], 11, 3, 5) },
      legs: { ops: [oE(-14, -76, 19, 10), oL([[-2, -72], [10, -46], [2, -16], [18, -4]], 11), oL([[18, -4], [28, -2]], 5), oL([[-14, -74], [2, -48], [-8, -16], [10, -4]], 13), oL([[10, -4], [22, -2]], 5)] },
    } },
    brachio: { u: 0.8, pieces: {
      skull: { ops: [oP(brHead(88, -202))], extra: sockets([[93, -210, 6], [94, -224, 3], [118, -196, 2]]) },
      back: { ops: [...ribs([[-76, -82], [-40, -120], [10, -124], [48, -104]], [-56, -40, -24, -8, 8, 24, 38], -52, 5), ...chain([[-76, -82], [-40, -120], [10, -124], [48, -104]], 12, 11, 3), ...chain(qpts(48, -104, 53, -180, 72, -196, 4), 11, 7, 3)] },
      tail: { ops: chain([[-76, -82], [-130, -80], [-182, -42]], 11, 3, 5) },
      legs: { ops: [oE(-46, -76, 18, 11), ...legBones([[62, -82], [64, -40], [62, -6]], 13), ...legBones([[-36, -76], [-32, -38], [-36, -6]], 13), ...legBones([[46, -84], [50, -40], [48, -6]], 14), ...legBones([[-50, -76], [-46, -38], [-50, -6]], 14)] },
    } },
  };
  // bounding boxes (unit coordinates) of each piece and each whole skeleton
  for (const sk of Object.values(SK)) {
    let all = [Infinity, Infinity, -Infinity, -Infinity];
    for (const pc of Object.values(sk.pieces)) {
      const b = [Infinity, Infinity, -Infinity, -Infinity];
      for (const o of pc.ops) {
        const pts = o.k === 'l' ? o.pts : o.k === 'c' ? [[o.x - o.r, o.y - o.r], [o.x + o.r, o.y + o.r]] : o.pts, pad = o.k === 'l' ? o.w / 2 : 0;
        for (const [x, y] of pts) { b[0] = Math.min(b[0], x - pad); b[1] = Math.min(b[1], y - pad); b[2] = Math.max(b[2], x + pad); b[3] = Math.max(b[3], y + pad); }
      }
      pc.box = b; pc.cx = (b[0] + b[2]) / 2; pc.cy = (b[1] + b[3]) / 2; pc.w = b[2] - b[0]; pc.h = b[3] - b[1];
      all = [Math.min(all[0], b[0]), Math.min(all[1], b[1]), Math.max(all[2], b[2]), Math.max(all[3], b[3])];
    }
    sk.box = all; sk.cx = (all[0] + all[2]) / 2; sk.w = all[2] - all[0]; sk.h = -all[1];
  }
  // draw a piece's ops onto context c: mode 'n' (bone), 'ghost' (outline to fill in) or 'mask'
  function renderOps(c, ops, mode) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    const out = mode === 'ghost' ? 'rgba(120,80,50,.5)' : mode === 'mask' ? '#000' : OL;
    const fill = mode === 'ghost' ? 'rgba(255,248,230,.45)' : mode === 'mask' ? '#000' : BONE;
    for (const pass of [0, 1]) {
      c.strokeStyle = pass ? fill : out; c.fillStyle = pass ? fill : out;
      for (const o of ops) {
        if (o.k === 'l') { c.lineWidth = o.w + (pass ? 0 : 5); c.beginPath(); o.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
        else if (o.k === 'c') { c.beginPath(); c.arc(o.x, o.y, o.r + (pass ? 0 : 2.5), 0, TAU); c.fill(); }
        else if (pass) c.fill(o.p); else { c.lineWidth = 5; c.stroke(o.p); }
      }
      if (mode === 'mask') break;
    }
    if (mode === 'n') {
      c.strokeStyle = BONE_HI; c.globalAlpha = 0.8;
      for (const o of ops) if (o.k === 'l') { c.lineWidth = Math.max(1.2, o.w * 0.3); c.beginPath(); o.pts.forEach(([x, y], i) => (i ? c.lineTo(x - 1, y - 1) : c.moveTo(x - 1, y - 1))); c.stroke(); }
      c.globalAlpha = 1;
    }
  }
  // one piece centred on (x, y) at scale k (unit scale already folded in) and rotation rot
  function drawPiece(pc, x, y, k, rot = 0, mode = 'n', c = ctx, cracks = null) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.translate(-pc.cx, -pc.cy);
    renderOps(c, pc.ops, mode);
    if (mode === 'n') { pc.extra?.(c); if (cracks) { c.strokeStyle = '#7a4a2a'; c.lineWidth = 2 / k; for (const cr of cracks) { c.beginPath(); cr.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke(); } } }
    c.restore();
  }
  const PIECES = ['skull', 'back', 'tail', 'legs'];
  // a finished skeleton is drawn back to front: tail, backbone, legs, then the skull on top
  const drawOrder = g => ['tail', 'back', 'legs', 'skull'].map(id => g.pieces.find(p => p.id === id));
  const FD = { px: 210, py: 112, pw: 540, ph: 294, cell: 18, R: 34, crack: 1300 };
  FD.cols = Math.ceil(FD.pw / FD.cell); FD.rows = Math.ceil(FD.ph / FD.cell);
  const CLUE = {
    tri: 'It has three horns and a big frill around its head!',
    stego: 'It has big plates down its back, and spikes on its tail!',
    brachio: 'It has a very, very long neck!',
    trex: 'It has big sharp teeth and teeny tiny arms!',
  };
  const CLUE_PIECE = { tri: ['skull'], stego: ['back', 'tail'], brachio: ['back'], trex: ['skull', 'back'] };
  const DIET = { tri: 'plants', stego: 'plants', brachio: 'plants', trex: 'meat' };
  const DIET_FACT = {
    tri: 'Triceratops ate PLANTS! It munched ferns and leaves with its beak, and its horns kept it safe.',
    stego: 'Stegosaurus ate PLANTS! It nibbled low leaves, and swung its spiky tail to stay safe.',
    brachio: 'Brachiosaurus ate PLANTS! It stretched its long neck to eat leaves from the tops of tall trees, like a giraffe.',
    trex: 'T. rex ate MEAT! Meat-eaters have big sharp teeth for biting. Its teeth were as big as bananas!',
  };
  const ROUND_FACT = [
    'A fossil is a bone that slowly turned to stone, a long, long time ago.',
    'Dinosaurs lived long, long ago, way before there were any people.',
    'Scientists who dig up fossils are called paleontologists. That\'s you!',
    'Fossils are so old that the bones are as hard as rock.',
  ];

  MG.fossildig = {
    kind: 'learn', title: () => 'Fossil Hunt', icon: () => '🦴',
    how: () => 'Brush away the dirt with small, gentle scrubs. Brush too hard and the fossil cracks! Then put the bones together, and use the clues to find out which dinosaur it was.',
    init(g) {
      const kinds = g.tier === 1 ? shuffle(['tri', 'trex']) : g.tier === 2 ? shuffle(['tri', 'stego', 'trex']) : shuffle(['tri', 'stego', 'trex', 'brachio']);
      Object.assign(g, { kinds, r: 0, pts: 0, maxPts: kinds.length * 4 + 1, brush: { x: FD.px + FD.pw / 2, y: FD.py + FD.ph / 2 }, press: 0, crackCD: 0, cheer: 0, msg: '', msgT: 0, wasDown: false, fx: [] });
      this.setupRound(g);
    },
    start(g) { say(g, `Brush gently, like you're tickling it. ${ROUND_FACT[1]}`); },
    setupRound(g) {
      const kind = g.kinds[g.r], sk = SK[kind];
      g.kind = kind; g.st = 'brush'; g.stT = 0; g.cracks = 0; g.wrongDrops = 0; g.idTries = 0; g.dietTries = 0; g.sel = null; g.drag = null; g.choice = null; g.answered = false;
      g.progress = `Fossil ${g.r + 1} of ${g.kinds.length}`;
      // scatter the 4 pieces in the dig square, one per quarter
      const quads = shuffle([[0.27, 0.28], [0.73, 0.28], [0.27, 0.73], [0.73, 0.73]]);
      g.pieces = PIECES.map((id, i) => {
        const pc = sk.pieces[id], k = Math.min(1.35, 220 / pc.w, 112 / pc.h) * 1;
        const dig = { x: FD.px + FD.pw * quads[i][0] + rand(-14, 14), y: FD.py + FD.ph * quads[i][1] + rand(-8, 8), k: k * (sk.u === 1 ? 1 : 1), rot: rand(-0.35, 0.35) };
        return { id, pc, found: false, placed: false, cracks: [], dig, cur: { ...dig }, cells: [] };
      });
      // the ghost skeleton in the middle, and tray spots round the sides
      const kB = Math.min(1.75, 460 / (sk.w * sk.u), 290 / (sk.h * sk.u));
      g.sk = { x: 480 - sk.cx * sk.u * kB, gy: 432, k: kB * sk.u };
      const trays = [[112, 196], [848, 196], [112, 350], [848, 350]];
      g.pieces.forEach((p, i) => {
        p.home = { x: g.sk.x + p.pc.cx * g.sk.k, y: g.sk.gy + p.pc.cy * g.sk.k, k: g.sk.k };
        p.tray = { x: trays[i][0], y: trays[i][1], k: Math.min(1.1, 150 / p.pc.w, 112 / p.pc.h), rot: 0 };
      });
      this.makeDirt(g);
    },
    makeDirt(g) {
      const { pw, ph, cols, rows, cell } = FD;
      g.dirt = new Float32Array(cols * rows).fill(1);
      g.boneAt = new Int8Array(cols * rows).fill(-1);
      // which cells each bone lies under
      const mk = document.createElement('canvas'); mk.width = pw; mk.height = ph;
      const mc = mk.getContext('2d', { willReadFrequently: true });
      const best = new Float32Array(cols * rows);
      g.pieces.forEach((p, i) => {
        mc.clearRect(0, 0, pw, ph);
        drawPiece(p.pc, p.dig.x - FD.px, p.dig.y - FD.py, p.dig.k, p.dig.rot, 'mask', mc);
        const d = mc.getImageData(0, 0, pw, ph).data;
        const cnt = new Float32Array(cols * rows);
        for (let y = 0; y < ph; y += 2) for (let x = 0; x < pw; x += 2) if (d[(y * pw + x) * 4 + 3] > 100) cnt[Math.floor(y / cell) * cols + Math.floor(x / cell)]++;
        for (let c = 0; c < cols * rows; c++) { const cov = cnt[c] / ((cell / 2) * (cell / 2)); if (cov > 0.18 && cov > best[c]) { best[c] = cov; g.boneAt[c] = i; } }
      });
      g.pieces.forEach((p, i) => { p.cells = []; for (let c = 0; c < cols * rows; c++) if (g.boneAt[c] === i) p.cells.push(c); });
      // a tiny bit of each bone peeks out, so you know where to start
      for (const p of g.pieces) { const c0 = pick(p.cells); if (c0 == null) continue; const cx = c0 % cols, cy = Math.floor(c0 / cols); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < cols && y < rows) g.dirt[y * cols + x] = Math.min(g.dirt[y * cols + x], dx || dy ? 0.55 : 0.1); } }
      // the dirt itself: sandy browns, clods, pebbles and roots
      if (!this.tex) { this.tex = document.createElement('canvas'); this.tex.width = pw; this.tex.height = ph; this.comp = document.createElement('canvas'); this.comp.width = pw; this.comp.height = ph; this.mask = document.createElement('canvas'); this.mask.width = cols; this.mask.height = rows; }
      const c = this.tex.getContext('2d');
      const gr = c.createLinearGradient(0, 0, 0, ph); gr.addColorStop(0, '#b98457'); gr.addColorStop(1, '#a06e46');
      c.fillStyle = gr; c.fillRect(0, 0, pw, ph);
      for (let i = 0; i < 260; i++) { c.fillStyle = ['rgba(90,55,30,.25)', 'rgba(220,170,120,.3)', 'rgba(140,95,60,.35)'][i % 3]; c.beginPath(); c.ellipse(rand(0, pw), rand(0, ph), rand(4, 16), rand(3, 9), rand(0, 3), 0, TAU); c.fill(); }
      for (let i = 0; i < 40; i++) { const x = rand(0, pw), y = rand(0, ph), r = rand(3, 7); c.fillStyle = OL; c.beginPath(); c.ellipse(x, y, r + 1.5, r * 0.7 + 1.5, 0, 0, TAU); c.fill(); c.fillStyle = pick(['#cfc2b8', '#b8aaa0', '#e0d4c6']); c.beginPath(); c.ellipse(x, y, r, r * 0.7, 0, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(90,60,30,.5)'; c.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) { let x = rand(0, pw), y = rand(0, ph); c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += rand(-14, 14); y += rand(4, 14); c.lineTo(x, y); } c.stroke(); }
    },
    // --- update ---------------------------------------------------------------------------------
    update(g, dt, id) {
      g.stT += dt; g.msgT -= dt; g.cheer = Math.max(0, g.cheer - dt); g.crackCD -= dt;
      const released = g.wasDown && !pointer.down; g.wasDown = pointer.down;
      const st = g.st;
      if (st === 'brush') this.updBrush(g, dt);
      else if (st === 'lift') { const k = ease(g.stT / 1.2); for (const p of g.pieces) p.cur = { x: lerp(p.dig.x, p.tray.x, k), y: lerp(p.dig.y, p.tray.y, k), k: lerp(p.dig.k, p.tray.k, k), rot: lerp(p.dig.rot, 0, k) }; if (g.stT >= 1.2) { g.st = 'build'; g.stT = 0; say(g, 'Put the bones together! Drag each bone to its place on the skeleton.'); } }
      else if (st === 'build') this.updBuild(g, dt, released);
      else if (st === 'built') { if (g.stT > 1.4) this.toId(g); }
      else if (st === 'id') this.updId(g, dt, id);
      else if (st === 'diet') this.updDiet(g, dt, id);
      else if (st === 'bird') this.updBird(g, dt, id);
      else if (st === 'end') { if (g.stT > 3.2) g.done = true; }
      g.score = clamp(g.pts / g.maxPts, 0, 1);
    },
    cellAt(x, y) { const cx = Math.floor((x - FD.px) / FD.cell), cy = Math.floor((y - FD.py) / FD.cell); return cx >= 0 && cy >= 0 && cx < FD.cols && cy < FD.rows ? cy * FD.cols + cx : -1; },
    updBrush(g, dt) {
      const b = g.brush, ox = b.x, oy = b.y;
      let mx = 0, my = 0;
      if (goLeft()) mx--; if (goRight()) mx++; if (keys.arrowup || keys.w) my--; if (goDown()) my++;
      let brushing = false;
      if (mx || my) { b.x += mx * 300 * dt; b.y += my * 300 * dt; brushing = true; }
      else if (pointer.down || pointerMoved(g)) { b.x = pointer.x; b.y = pointer.y; brushing = pointer.down; }
      b.x = clamp(b.x, FD.px, FD.px + FD.pw); b.y = clamp(b.y, FD.py, FD.py + FD.ph);
      const dist = Math.hypot(b.x - ox, b.y - oy), speed = dist / Math.max(dt, 1 / 120);
      g.press = lerp(g.press, brushing ? speed / FD.crack : 0, Math.min(1, dt * 12));
      g.brushing = brushing && dist > 0.5;
      if (g.brushing) {
        const amt = Math.min(dist, 650 * dt) / 64;
        const { cols, rows, cell, R } = FD;
        const c0 = Math.floor((b.x - FD.px - R) / cell), c1 = Math.floor((b.x - FD.px + R) / cell), r0 = Math.floor((b.y - FD.py - R) / cell), r1 = Math.floor((b.y - FD.py + R) / cell);
        for (let r = Math.max(0, r0); r <= Math.min(rows - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(cols - 1, c1); c++) {
          const d = Math.hypot(FD.px + (c + 0.5) * cell - b.x, FD.py + (r + 0.5) * cell - b.y);
          if (d < R) g.dirt[r * cols + c] = Math.max(0, g.dirt[r * cols + c] - amt * (1 - d / R) * 1.4);
        }
        if (Math.random() < dt * 20) g.fx.push({ x: b.x + rand(-20, 20), y: b.y + rand(-10, 14), vx: rand(-60, 60), vy: rand(-90, -30), life: 0.6, max: 0.6, size: rand(2, 5) });
        if (Math.floor(g.t * 10) !== Math.floor((g.t - dt) * 10)) SFX.scrub();
        // too hard over a bone that's showing: crack!
        if (g.press > 1 && g.crackCD <= 0) {
          for (const [dx, dy] of [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12]]) {
            const ci = this.cellAt(b.x + dx, b.y + dy);
            if (ci >= 0 && g.boneAt[ci] >= 0 && g.dirt[ci] < 0.45) {
              const p = g.pieces[g.boneAt[ci]];
              // a zig-zag crack line, in the piece's own coordinates
              const lx = (b.x - p.dig.x), ly = (b.y - p.dig.y), cs = Math.cos(-p.dig.rot), sn = Math.sin(-p.dig.rot);
              const ux = (lx * cs - ly * sn) / p.dig.k + p.pc.cx, uy = (lx * sn + ly * cs) / p.dig.k + p.pc.cy;
              const cr = [[ux - 8, uy - 5]]; for (let j = 1; j <= 4; j++) cr.push([ux - 8 + j * 4, uy - 5 + (j % 2 ? 6 : 0) + j]);
              p.cracks.push(cr); g.cracks++; g.crackCD = 1.1;
              tone(220, 0.12, 'square', 0.06); tone(150, 0.18, 'sawtooth', 0.05, 0.05);
              g.msg = 'Crack! Gently, gently!'; g.msgT = 1.8; say(g, 'Crack! Too hard! Use small, gentle scrubs.');
              break;
            }
          }
        }
      }
      for (const f of g.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; f.life -= dt; }
      g.fx = g.fx.filter(f => f.life > 0);
      // found a whole bone?
      for (const p of g.pieces) {
        if (p.found || !p.cells.length) continue;
        let clear = 0; for (const c of p.cells) if (g.dirt[c] < 0.3) clear++;
        if (clear / p.cells.length >= 0.8) {
          p.found = true; g.cheer = 0.9; SFX.sparkle(); burst(p.dig.x, p.dig.y, 16);
          floatText(p.dig.x, p.dig.y - 30, `The ${PIECE_NAME[p.id]}!`, '#fff6a8', false, 24);
          const left = g.pieces.filter(q => !q.found).length;
          if (g.r === 0 && left === 3) say(g, `You found the ${PIECE_NAME[p.id]}! ${ROUND_FACT[0]}`);
          else say(g, left ? `The ${PIECE_NAME[p.id]}! ${NUM_WORDS[left] || left} more to find.` : 'You found every bone!');
        }
      }
      if (g.pieces.every(p => p.found)) {
        g.allT = (g.allT || 0) + dt;
        // clear the last crumbs away so the bones shine
        for (let i = 0; i < g.dirt.length; i++) g.dirt[i] = Math.max(0, g.dirt[i] - dt * 1.5);
        if (g.allT > 1.3) {
          g.allT = 0; g.st = 'lift'; g.stT = 0;
          g.pts += g.cracks === 0 ? 1 : g.cracks === 1 ? 0.6 : g.cracks === 2 ? 0.3 : 0;
        }
      }
    },
    pieceAt(g, x, y) {
      for (const p of g.pieces) if (!p.placed && Math.abs(x - p.cur.x) < Math.max(40, p.pc.w * p.cur.k / 2 + 10) && Math.abs(y - p.cur.y) < Math.max(36, p.pc.h * p.cur.k / 2 + 10)) return p;
      return null;
    },
    tryDrop(g, p, x, y) {
      const own = Math.hypot(x - p.home.x, y - p.home.y);
      let other = null, od = 1e9;
      for (const q of g.pieces) if (q !== p && !q.placed) { const d = Math.hypot(x - q.home.x, y - q.home.y); if (d < od) { od = d; other = q; } }
      if (own < 95 || (own < 140 && own <= od)) {
        p.placed = true; g.sel = null; SFX.hit(); burst(p.home.x, p.home.y, 12); g.cheer = 0.8;
        const left = g.pieces.filter(q => !q.placed).length;
        if (!left) { g.st = 'built'; g.stT = 0; g.pts += Math.max(0, 1 - 0.25 * g.wrongDrops); SFX.fanfare(); say(g, 'A whole skeleton! Wow!'); }
        else say(g, pick(['It fits!', 'Click! Just right.', 'Perfect!']));
      } else if (od < 95 || (x > 230 && x < 730 && y > 90 && y < 440)) {
        g.wrongDrops++; SFX.miss(); g.msg = 'Hmm, that bone goes somewhere else.'; g.msgT = 2;
        say(g, `Hmm, the ${PIECE_NAME[p.id]} doesn't go there. Look at the outline!`);
        p.back = 0.35; g.sel = null;
      }
    },
    updBuild(g, dt, released) {
      for (const p of g.pieces) {
        const tgt = p.placed ? { ...p.home, rot: 0 } : g.drag === p ? { x: pointer.x, y: pointer.y, k: p.tray.k * 1.08, rot: 0 } : p.tray;
        const f = g.drag === p ? 1 : Math.min(1, dt * 10);
        p.cur = { x: lerp(p.cur.x, tgt.x, f), y: lerp(p.cur.y, tgt.y, f), k: lerp(p.cur.k, tgt.k, Math.min(1, dt * 10)), rot: 0 };
      }
      // number keys pick up a bone and put it in place
      for (let i = 0; i < 4; i++) if (pressed[String(i + 1)]) { const p = g.pieces[i]; if (!p.placed) this.tryDrop(g, p, p.home.x, p.home.y); }
      if (pointer.clicked) {
        const p = this.pieceAt(g, pointer.x, pointer.y);
        if (p) { g.drag = p; g.dragX = pointer.x; g.dragY = pointer.y; SFX.pick(); }
        else if (g.sel) this.tryDrop(g, g.sel, pointer.x, pointer.y);
      }
      if (released && g.drag) {
        const p = g.drag; g.drag = null;
        if (Math.hypot(pointer.x - g.dragX, pointer.y - g.dragY) < 12) g.sel = g.sel === p ? null : p;   // a tap selects it
        else this.tryDrop(g, p, pointer.x, pointer.y);
      }
    },
    toId(g) {
      g.st = 'id'; g.stT = 0; g.cards = shuffle(['tri', 'stego', 'trex', 'brachio']).map(k => ({ kind: k, wrong: false, shake: 0 }));
      say(g, `Which dinosaur is it? Here's a clue. ${CLUE[g.kind]}`);
    },
    cardRect(i) { return { x: 524 + (i % 2) * 212, y: 96 + Math.floor(i / 2) * 166, w: 200, h: 156 }; },
    updId(g, dt, id) {
      for (const c of g.cards) c.shake = Math.max(0, c.shake - dt);
      let pickI = -1;
      for (let i = 0; i < 4; i++) if (id === `fd_card${i}` || pressed[String(i + 1)]) pickI = i;
      if (pickI < 0) return;
      const c = g.cards[pickI];
      if (c.wrong) return;
      g.idTries++;
      if (c.kind === g.kind) {
        g.pts += g.idTries === 1 ? 1 : g.idTries === 2 ? 0.5 : 0;
        SFX.sparkle(); burst(this.cardRect(pickI).x + 100, this.cardRect(pickI).y + 70, 20); g.cheer = 1;
        g.st = 'diet'; g.stT = 0; g.dietTries = 0; g.answered = false;
        say(g, `Yes! It's a ${DINO_NAME[g.kind]}! Now, what did a ${DINO_NAME[g.kind]} eat? Plants, or meat?`);
      } else {
        c.wrong = true; c.shake = 0.5; SFX.miss();
        say(g, `That's a ${DINO_NAME[c.kind]}. Not quite! Look at the clue again: ${CLUE[g.kind]}`);
      }
    },
    updDiet(g, dt, id) {
      if (!g.answered) {
        const ans = id === 'fd_plants' || pressed['1'] ? 'plants' : id === 'fd_meat' || pressed['2'] ? 'meat' : null;
        if (!ans) return;
        g.dietTries++;
        if (ans === DIET[g.kind]) {
          if (g.dietTries === 1) g.pts += 1;
          g.answered = true; g.stT = 0; SFX.sparkle(); g.cheer = 1; say(g, DIET_FACT[g.kind]);
        } else {
          SFX.miss(); g.msg = ans === 'meat' ? 'Hmm, look: no big sharp teeth!' : 'Hmm, look at those big sharp teeth!'; g.msgT = 2.5;
          say(g, ans === 'meat' ? `Hmm. Does a ${DINO_NAME[g.kind]} have big sharp teeth for biting meat? Try again!` : 'Look at those big sharp teeth! Teeth like that are for biting meat. Try again!');
        }
        return;
      }
      if (g.stT > 1 && (id === 'fd_next' || pressed[' '] || pressed.enter)) {
        g.r++;
        if (g.r < g.kinds.length) { this.setupRound(g); say(g, `Next fossil! ${ROUND_FACT[g.r] || ''}`); }
        else { g.st = 'bird'; g.stT = 0; g.birdTries = 0; g.birdWrong = {}; g.progress = 'Last question!'; say(g, 'Last question! Dinosaurs still have cousins alive today. Which animal is a dinosaur cousin?'); }
      }
    },
    updBird(g, dt, id) {
      const opts = ['fish', 'bird', 'frog'];
      let a = null;
      for (let i = 0; i < 3; i++) if (id === `fd_b${i}` || pressed[String(i + 1)]) a = opts[i];
      if (!a || g.birdWrong[a]) return;
      g.birdTries++;
      if (a === 'bird') {
        if (g.birdTries === 1) g.pts += 1;
        g.st = 'end'; g.stT = 0; SFX.fanfare(); burst(W / 2, 260, 30); g.cheer = 2;
        say(g, 'Yes! Birds are the dinosaurs\' cousins. A little chicken is a tiny relative of T. rex!');
      } else { g.birdWrong[a] = true; SFX.miss(); say(g, a === 'fish' ? 'Fish swim, but they aren\'t dinosaur cousins. Which one has feathers and lays eggs in a nest?' : 'Frogs aren\'t dinosaur cousins. Which one has feathers and lays eggs in a nest?'); }
    },

    // --- draw -------------------------------------------------------------------------------------
    drawAub(g, x, feet, frame, f, s) {
      const twirl = g.cheer > 0.25;
      aubreyExplorer(x, feet, twirl ? 'twirl' : frame, f, twirl ? Math.abs(Math.sin(g.cheer * 7)) * 8 : 0, twirl ? s * 0.88 : s);
    },
    draw(g) {
      const t = S.t;
      // a warm sandy dig-site ground fills the scene, with the valley peeking over the top
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 100); ctx.clip(); valleyFar(t, 240); ctx.restore();
      const gr = ctx.createLinearGradient(0, 80, 0, H); gr.addColorStop(0, '#f0d49a'); gr.addColorStop(1, '#e2b878');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 96); ctx.quadraticCurveTo(480, 76, W, 96); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.strokeStyle = 'rgba(91,63,115,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 96); ctx.quadraticCurveTo(480, 76, W, 96); ctx.stroke();
      ctx.fillStyle = 'rgba(190,140,90,.25)'; for (let i = 0; i < 30; i++) ellipse((i * 197) % W, 110 + (i * 71) % 420, 10 + (i % 4) * 4, 3);
      const st = g.st;
      if (st === 'brush' || st === 'lift') this.drawDig(g, t);
      if (st === 'lift' || st === 'build' || st === 'built') this.drawBuild(g, t);
      if (st === 'id') this.drawId(g, t);
      if (st === 'diet') this.drawDiet(g, t);
      if (st === 'bird' || st === 'end') this.drawBird(g, t);
      if (g.msgT > 0) bubble(W / 2, 462, g.msg, '#7a2a3e', 18);
    },
    drawDig(g, t) {
      const fade = g.st === 'lift' ? 1 - clamp(g.stT / 0.6, 0, 1) : 1;
      ctx.globalAlpha = fade;
      // wooden frame round the dig square, pale rock underneath
      inkRect(FD.px - 12, FD.py - 12, FD.pw + 24, FD.ph + 24, '#b07a4a', 2.4, 10);
      ctx.fillStyle = '#ead6aa'; ctx.fillRect(FD.px, FD.py, FD.pw, FD.ph);
      ctx.strokeStyle = 'rgba(180,140,90,.5)'; ctx.lineWidth = 2; for (let y = FD.py + 30; y < FD.py + FD.ph; y += 46) { ctx.beginPath(); ctx.moveTo(FD.px, y); ctx.quadraticCurveTo(FD.px + FD.pw / 2, y + 10, FD.px + FD.pw, y - 4); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (g.st === 'brush') {
        for (const p of g.pieces) {
          if (p.found) glow(p.dig.x, p.dig.y, 70, '255,240,150', 0.35 + 0.15 * Math.sin(t * 4));
          drawPiece(p.pc, p.dig.x, p.dig.y, p.dig.k, p.dig.rot, 'n', ctx, p.cracks);
        }
        // the dirt, with a soft edge wherever it's been brushed away
        const { cols, rows } = FD, mc = this.mask.getContext('2d'), id = mc.createImageData(cols, rows);
        for (let i = 0; i < cols * rows; i++) { id.data[i * 4 + 3] = Math.round(255 * clamp(g.dirt[i] * 1.25, 0, 1)); }
        mc.putImageData(id, 0, 0);
        const cc = this.comp.getContext('2d');
        cc.globalCompositeOperation = 'source-over'; cc.clearRect(0, 0, FD.pw, FD.ph); cc.drawImage(this.tex, 0, 0);
        cc.globalCompositeOperation = 'destination-in'; cc.imageSmoothingEnabled = true; cc.drawImage(this.mask, 0, 0, cols * FD.cell, rows * FD.cell);
        cc.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.comp, FD.px, FD.py);
      } else ctx.globalAlpha = fade;
      // dig grid strings
      ctx.strokeStyle = 'rgba(255,90,90,.75)'; ctx.lineWidth = 1.5;
      for (let i = 1; i < 4; i++) { const x = FD.px + FD.pw * i / 4; ctx.beginPath(); ctx.moveTo(x, FD.py - 8); ctx.lineTo(x, FD.py + FD.ph + 8); ctx.stroke(); }
      for (let i = 1; i < 3; i++) { const y = FD.py + FD.ph * i / 3; ctx.beginPath(); ctx.moveTo(FD.px - 8, y); ctx.lineTo(FD.px + FD.pw + 8, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (g.st !== 'brush') return;
      for (const f of g.fx) { ctx.fillStyle = `rgba(160,110,70,${0.7 * f.life / f.max})`; circle(f.x, f.y, f.size); }
      this.drawGauge(g, t);
      this.drawChecklist(g, t);
      // Aubrey kneels at the edge of the dig, following her brush
      this.drawAub(g, clamp(g.brush.x - 40, 240, 700), 536, 'crouch', 1, 0.6);
      this.drawBrush(g, t);
    },
    drawBrush(g, t) {
      const b = g.brush, wig = g.brushing ? Math.sin(t * 40) * 0.25 : 0;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(-0.7 + wig); ctx.lineJoin = 'round';
      inkRect(-4, -78, 8, 50, '#e0a050', 1.2, 3);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-2.5, -76, 2, 46);
      inkRect(-9, -32, 18, 12, '#c0c8d8', 1.2, 2);
      ink(P2('M-12,-21 L12,-21 L14,6 C6,9 -6,9 -14,6 Z'), '#7a5a3a', 1.2);
      ctx.strokeStyle = '#a0805a'; ctx.lineWidth = 1.2; for (let i = -10; i <= 10; i += 4) { ctx.beginPath(); ctx.moveTo(i, -18); ctx.lineTo(i * 1.15, 5); ctx.stroke(); }
      ctx.restore();
    },
    drawGauge(g, t) {
      const x = 44, y0 = 140, h = 230, p = clamp(g.press, 0, 1.3);
      darkPanel(x - 34, y0 - 34, 116, h + 92, 20);
      text('How hard?', x + 24, y0 - 16, 14, '#fff', 'center', 700);
      const segs = [[0, 0.6, '#5fd07a'], [0.6, 1, '#ffd23a'], [1, 1.3, '#ff5a6a']];
      for (const [a, bb, col] of segs) { const ya = y0 + h - (a / 1.3) * h, yb = y0 + h - (bb / 1.3) * h; ctx.fillStyle = col; ctx.fillRect(x, yb, 28, ya - yb); }
      rrect(x, y0, 28, h, 8, null, '#fff', 2.5);
      const ny = y0 + h - (p / 1.3) * h;
      ink(P2(`M${x - 12},${ny - 8} L${x - 2},${ny} L${x - 12},${ny + 8} Z`), '#ffffff', 1.2);
      emoji('🪶', x + 56, y0 + h - 20, 20); emoji('💥', x + 56, y0 + 16, 20);
      text(p > 1 ? 'Too hard!' : p > 0.6 ? 'Careful' : 'Gentle', x + 24, y0 + h + 22, 15, p > 1 ? '#ffb0b0' : p > 0.6 ? '#ffe9a0' : '#b8ffc8', 'center', 700);
      text(`Cracks: ${g.cracks}`, x + 24, y0 + h + 42, 13, '#fff', 'center', 600);
    },
    drawChecklist(g, t) {
      darkPanel(774, 106, 176, 200, 20);
      text('Bones found', 862, 128, 15, '#fff', 'center', 700);
      g.pieces.forEach((p, i) => {
        const y = 160 + i * 36;
        emoji(p.found ? '✅' : '🦴', 796, y, 20);
        text(PIECE_NAME[p.id], 816, y, 16, p.found ? '#b8ffc8' : '#fff', 'left', 600);
      });
    },
    drawBuild(g, t) {
      const lift = g.st === 'lift', a = lift ? clamp((g.stT - 0.5) / 0.7, 0, 1) : 1;
      // display board with the skeleton outline to fill in
      ctx.globalAlpha = a;
      inkRect(226, 92, 508, 352, '#fff4dc', 2.4, 18);
      ctx.fillStyle = 'rgba(240,210,160,.4)'; ctx.fillRect(240, 410, 480, 26);
      if (g.st !== 'lift') {
        for (const p of g.pieces) if (!p.placed) {
          const hl = g.sel === p || g.drag === p;
          if (hl) glow(p.home.x, p.home.y, 70, '255,230,120', 0.5);
          drawPiece(p.pc, p.home.x, p.home.y, p.home.k, 0, 'ghost');
        }
      }
      // tray boards
      for (const p of g.pieces) inkEllipse(p.tray.x, p.tray.y + 46, 78, 14, 0, '#c8945a', 1.6);
      ctx.globalAlpha = 1;
      g.pieces.forEach((p, i) => {
        if (p.placed) return;
        if (g.sel === p) glow(p.cur.x, p.cur.y, 70, '255,240,150', 0.6 + 0.2 * Math.sin(t * 6));
        drawPiece(p.pc, p.cur.x, p.cur.y, p.cur.k, p.cur.rot, 'n', ctx, p.cracks);
        if (g.st === 'build' && g.drag !== p) { inkCircle(p.tray.x - 70, p.tray.y - 44, 13, '#9a6ae0', 1); text(String(i + 1), p.tray.x - 70, p.tray.y - 43, 15, '#fff', 'center', 800); }
      });
      // the placed bones are drawn above, so a finished skeleton reads as one
      for (const p of drawOrder(g)) if (p.placed) drawPiece(p.pc, p.cur.x, p.cur.y, p.cur.k, 0, 'n', ctx, p.cracks);
      if (g.st === 'build' && g.stT < 5) { darkPanel(W / 2 - 200, 456, 400, 34, 17); text('Drag each bone onto its outline', W / 2, 473, 16, '#fff', 'center', 600); }
      if (g.st === 'built') outlined('A whole skeleton!', W / 2, 74, 30, '#ffe36b', 'center', '#4a2a5e');
      this.drawAub(g, 56, 536, 'idle_front', 1, 0.36);
    },
    // the finished skeleton, smaller, on the left (fading into the real dinosaur when named)
    drawSkeletonLeft(g, t, flesh = 0, hl = false) {
      const sk = SK[g.kind], k = Math.min(1.25, 300 / (sk.w * sk.u), 260 / (sk.h * sk.u)) * sk.u;
      const x = 262 - sk.cx * k, gy = 400;
      inkRect(52, 92, 420, 330, '#fff4dc', 2.4, 18);
      if (flesh < 1) {
        ctx.globalAlpha = 1 - flesh;
        for (const p of drawOrder(g)) {
          const px = x + p.pc.cx * k, py = gy + p.pc.cy * k;
          if (hl && CLUE_PIECE[g.kind].includes(p.id)) glow(px, py, 80, '255,220,100', 0.45 + 0.2 * Math.sin(t * 5));
          drawPiece(p.pc, px, py, k, 0, 'n', ctx, p.cracks);
        }
        ctx.globalAlpha = 1;
      }
      if (flesh > 0) { ctx.globalAlpha = flesh; drawDino(g.kind, x, gy, k / sk.u, 1, { t }); ctx.globalAlpha = 1; }
    },
    drawCardDino(kind, cx, cy, w, h, t) {
      const sk = SK[kind], s = Math.min(w / sk.w, h / sk.h) * 0.92;
      drawDino(kind, cx - sk.cx * sk.u * s, cy + sk.h * sk.u * s / 2, s, 1, { t });
    },
    drawId(g, t) {
      this.drawSkeletonLeft(g, t, 0, true);
      g.cards.forEach((c, i) => {
        const r = this.cardRect(i), sh = c.shake > 0 ? Math.sin(c.shake * 40) * 6 : 0;
        ctx.globalAlpha = c.wrong ? 0.4 : 1;
        button(`fd_card${i}`, r.x + sh, r.y, r.w, r.h, '', { color: c.wrong ? '#b9aac4' : '#ffffff', on: !c.wrong });
        rrect(r.x + 6 + sh, r.y + 6, r.w - 12, r.h - 12, 12, c.wrong ? '#e8e0ee' : '#fffaf0');
        this.drawCardDino(c.kind, r.x + r.w / 2 + sh, r.y + 66, 168, 92, t);
        text(DINO_NAME[c.kind], r.x + r.w / 2 + sh, r.y + r.h - 20, 17, '#4a2a5e', 'center', 700);
        inkCircle(r.x + 22 + sh, r.y + 22, 12, '#9a6ae0', 1); text(String(i + 1), r.x + 22 + sh, r.y + 23, 14, '#fff', 'center', 800);
        if (c.wrong) emoji('❌', r.x + r.w - 24, r.y + 24, 20);
        ctx.globalAlpha = 1;
      });
      darkPanel(112, 432, 820, 44, 22);
      emoji('🔍', 140, 454, 22);
      text(`Clue: ${CLUE[g.kind]}`, 162, 454, 18, '#fff', 'left', 700);
      this.drawAub(g, 56, 536, 'idle_front', 1, 0.36);
      outlined('Which dinosaur is it?', 262, 74, 24, '#ffe36b', 'center', '#4a2a5e');
    },
    drawDiet(g, t) {
      const f = clamp(g.stT / 1.2, 0, 1);
      this.drawSkeletonLeft(g, t, g.answered ? 1 : f);
      outlined(`It's a ${DINO_NAME[g.kind]}!`, 262, 74, 26, '#ffe36b', 'center', '#4a2a5e');
      panel(500, 96, 430, 330, 22);
      if (!g.answered) {
        text(`What did ${DINO_NAME[g.kind]} eat?`, 715, 140, 22, '#5a2a6e', 'center', 700);
        button('fd_plants', 524, 180, 180, 150, 'Plants', { color: '#5fb87a', size: 24, key: '1' });
        button('fd_meat', 726, 180, 180, 150, 'Meat', { color: '#e0705a', size: 24, key: '2' });
        emoji('🌿', 614, 212, 46); emoji('🍖', 816, 212, 46);
        text('Look at the teeth and the clues!', 715, 370, 16, '#9a7aaa', 'center', 600);
      } else {
        const plant = DIET[g.kind] === 'plants';
        emoji(plant ? '🌿' : '🍖', 715, 150, 52);
        outlined(plant ? 'A plant-eater!' : 'A meat-eater!', 715, 206, 28, plant ? '#7ae08a' : '#ff9a7a', 'center', '#4a2a5e');
        wrap(DIET_FACT[g.kind], 380, 18).forEach((l, i) => text(l, 715, 246 + i * 26, 18, '#5a2a6e', 'center', 600));
        if (g.stT > 1) button('fd_next', 615, 360, 200, 52, g.r + 1 < g.kinds.length ? 'Next fossil' : 'Last question', { color: '#9a6ae0', size: 20, icon: '▶️' });
      }
      this.drawAub(g, 56, 536, 'idle_front', 1, 0.36);
    },
    drawBird(g, t) {
      panel(110, 92, 740, 380, 26);
      if (g.st === 'bird') {
        outlined('Which animal is a cousin of the dinosaurs?', W / 2, 136, 26, '#ff6fb5', 'center', '#fff');
        [['🐟', 'Fish'], ['🐦', 'Bird'], ['🐸', 'Frog']].forEach(([e, name], i) => {
          const x = 170 + i * 216, wrong = g.birdWrong[['fish', 'bird', 'frog'][i]];
          ctx.globalAlpha = wrong ? 0.4 : 1;
          button(`fd_b${i}`, x, 176, 190, 190, '', { color: wrong ? '#b9aac4' : ['#40a8ff', '#ffb02a', '#5fb87a'][i], on: !wrong, key: String(i + 1) });
          emoji(e, x + 95, 248, 74);
          text(name, x + 95, 334, 24, '#fff', 'center', 700);
          ctx.globalAlpha = 1;
        });
        text('Hint: it has feathers, a beak, and lays eggs in a nest!', W / 2, 410, 18, '#9a7aaa', 'center', 600);
      } else {
        outlined('Birds are dinosaur cousins!', W / 2, 140, 32, '#ff6fb5', 'center', '#fff');
        emoji('🐔', W / 2 - 150, 260, 90); heart(W / 2 - 40, 240, 40, '#ff6fae');
        drawDino('trex', W / 2 + 120, 330, 1, -1, { t });
        text('A chicken is a tiny cousin of T. rex!', W / 2, 400, 22, '#5a2a6e', 'center', 700);
      }
      this.drawAub(g, 56, 536, 'idle_front', 1, 0.36);
    },
  };


  restage('honeytree', {
    name: 'Dino Valley', icon: '🦕', bg: 'dinovalley3',
    npc: { name: FRIEND, icon: '🦕' },
    games: [['dinolift', 'honey', {}], ['fossildig', 'honey', {}]],
    intro: [
      '*:Giant ferns sway, a waterfall splashes, and far away a sleepy volcano puffs little clouds. Welcome to Dino Valley!',
      "N:Hello down there! I'm Lofty the Longneck. I'm so glad you came! The baby dinos went exploring, climbed up high, and now they can't get down.",
      "N:Hop up on my head and I'll lift you way up high. Scoop up each baby and lower it into the nest with its picture. Watch out for the buzzy giant dragonflies!",
      'A:excited:I get to ride a real DINOSAUR? Lift me up, Lofty!',
    ],
    mid: [
      'N:Every baby is home, safe and snug! Now come and see the dig site. A scientist left her brushes here, and there are fossils hiding in the dirt!',
      'N:A fossil is a bone from long, long ago that slowly turned to stone. Brush very gently, put the bones together, and find out which dinosaur it was!',
      'A:focused:A real fossil hunter! Gentle, gentle...',
    ],
    outro: [
      'N:You found real dinosaur skeletons! And guess what? Birds are our cousins. Every little bird is a bit like a tiny dinosaur!',
      'N:The valley bees made this pot of golden honey for you, to say thank you. Come back and visit soon!',
      'A:laughing:Thank you, Lofty! Bye, Dino Valley! Rawr!',
    ],
  });
}
