'use strict';
{
  // ===========================================================================
  // Swan Lake becomes THE ROYAL KINGDOM: a sunny fairytale town with a grand castle and its waving
  // flags, a tall clock tower (it matters at midnight!), a fountain in the town square, bunting,
  // colourful houses with coloured doors, and neat royal gardens of topiary and roses.
  // The host is Fairy Godmother Gwen, with silver hair, fluttering wings and a starry wand.
  //   game 1 (action) Royal Messenger: market day! Aubrey rides a pony through a packed, panning town
  //            square of wonderfully odd townsfolk (fish hats, hat towers, knights, jesters, wizards,
  //            dragon costumes, stilts, giants, beards, monocles, geese, pigs on leashes...) to find the
  //            one person in the corner picture (their hat and what they hold; plus one more look at
  //            tier 3) and hand over a ball invitation. 4 rounds; 50/75/100 people and more look-alikes
  //            by tier; a sparkle and edge-arrow hint after a while.
  //   game 2 (learn) Cinderella: a storybook Aubrey acts out as Cinderella, page by page: sweep the
  //            hearth, pick the lentils out of the ashes with the birds, answer the door to the royal
  //            invitation and fetch the stepsisters' things, wave the wand over the pumpkin, mice, rat
  //            and lizards in order, follow the prince's dance, run down the stairs counting the twelve
  //            chimes of midnight, and find whose foot the glass slipper fits. "What happens next?"
  //            questions before key beats and a picture retell at the end. Higher tiers add more
  //            pages and give fewer hints. (The classic Perrault tale.)
  // ===========================================================================
  const FRIEND = 'Fairy Godmother Gwen';
  const TAU = Math.PI * 2;
  const say = (g, s) => { g.say = s; speak(s); };
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const inkAll = (items, lw, line = OL) => {
    ctx.strokeStyle = line; ctx.lineWidth = lw * 2;
    for (const [p] of items) ctx.stroke(p);
    for (const [p, f] of items) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const seeded = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const softGlow = (x, y, r, rgb, a = 0.7) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // an invisible click target (for things we draw ourselves); keys work like button keys
  const hit = (id, x, y, w, h, key = null) => buttons.push({ id, x, y, w, h, on: true, key });
  const bubble = (x, y, str, col = '#5a2a6e', size = 17) => {
    ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(str).width + 26, h = size + 19;
    const bx = clamp(x, w / 2 + 60, W - w / 2 - 60);
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(bx - w / 2 - 2.5, y - h / 2 - 2.5, w + 5, h + 5, 20); ctx.fill(); tri(x - 10, y + h / 2 - 2, x + 10, y + h / 2 - 2, x + 2, y + h / 2 + 14);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(bx - w / 2, y - h / 2, w, h, 18); ctx.fill(); tri(x - 7, y + h / 2 - 4, x + 7, y + h / 2 - 4, x + 2, y + h / 2 + 10);
    text(str, bx, y, size, col, 'center', 700);
  };
  // little shape symbols used on doors, seals and flags
  const SHAPES = ['star', 'heart', 'moon', 'diamond'];
  const SHAPE_WORD = { star: 'star', heart: 'heart', moon: 'moon', diamond: 'diamond' };
  function symbol(kind, x, y, r, fill, lw = 1) {
    if (kind === 'star') vecStar(x, y, r, fill, lw);
    else if (kind === 'heart') { ink(P2(`M${x},${y + r * 0.85} C${x - r * 1.3},${y - r * 0.1} ${x - r * 0.75},${y - r * 1.1} ${x},${y - r * 0.4} C${x + r * 0.75},${y - r * 1.1} ${x + r * 1.3},${y - r * 0.1} ${x},${y + r * 0.85} Z`), fill, lw); }
    else if (kind === 'moon') ink(P2(`M${x + r * 0.3},${y - r} A${r},${r} 0 1 0 ${x + r * 0.3},${y + r} A${r * 0.75},${r * 0.75} 0 1 1 ${x + r * 0.3},${y - r} Z`), fill, lw);
    else if (kind === 'diamond') ink(P2(`M${x},${y - r} L${x + r * 0.75},${y} L${x},${y + r} L${x - r * 0.75},${y} Z`), fill, lw);
    else inkCircle(x, y, r * 0.8, fill, lw);
  }
  // a waving pennant flag on a pole top
  function flag(x, y, len, col, t, ph = 0, lw = 1) {
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - len * 0.75); ctx.stroke();
    const top = y - len * 0.75, w = len * 0.7, f = k => Math.sin(t * 5 + ph + k * 4) * len * 0.07 * k;
    ink(P2(`M${x},${top} C${x + w * 0.35},${top + f(0.35)} ${x + w * 0.7},${top + 2 + f(0.7)} ${x + w},${top + len * 0.13 + f(1)} C${x + w * 0.7},${top + len * 0.22 + f(0.7)} ${x + w * 0.35},${top + len * 0.26 + f(0.35)} ${x},${top + len * 0.3} Z`), col, lw);
  }

  // =============================================================================================
  // AUBREY IN COSTUME: her photo frames, with the dress recoloured (cinder rags, a gold-and-silver
  // ball gown, or a royal-blue messenger's tunic), plus a headscarf, a tiara or a feathered cap.
  // The face is never touched: we only recolour pink pixels below the face.
  // =============================================================================================
  const LOOKS = {
    rags: { pal: ['#5e4c40', '#9a8670', '#d2c4aa'] },
    gown: { pal: ['#b07a1a', '#f6cf5a', '#fffbe6'] },
    messenger: { pal: ['#22348a', '#3f62d8', '#a8c0ff'] },
  };
  const COST = {};
  function costumed(frame, look) {
    const key = frame + ':' + look;
    if (COST[key]) return COST[key];
    const im = IMG[frame], w = im.width, h = im.height;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    // the top of her head, and where it sits across
    let top = 0;
    find: for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (p[(y * w + i) * 4 + 3] > 140) { top = y; break find; }
    let sx = 0, n = 0, minX = w, maxX = 0;
    for (let y = top; y < top + 18; y++) for (let i = 0; i < w; i++) if (p[(y * w + i) * 4 + 3] > 140) { sx += i; n++; }
    const hx = n ? sx / n : w / 2;
    for (let i = 0; i < w; i++) if (p[((top + 12) * w + i) * 4 + 3] > 140) { minX = Math.min(minX, i); maxX = Math.max(maxX, i); }
    const hr = Math.max(12, Math.min(26, (maxX - minX) / 2 || 18));
    const spots = [];
    const pal = LOOKS[look] && LOOKS[look].pal.map(hexRgb);
    if (pal) {
      const r = seeded(7);
      for (let y = top + 44; y < h; y++) for (let i = 0; i < w; i++) {
        const k = (y * w + i) * 4;
        if (p[k + 3] < 20) continue;
        const R = p[k], G = p[k + 1], B = p[k + 2];
        if (!(B > G + 6 && R > 110 && R - G > 26)) continue;
        const L = clamp(((R + G + B) / 765 - 0.42) / 0.5, 0, 1);
        const [a, b2, kk] = L < 0.5 ? [pal[0], pal[1], L * 2] : [pal[1], pal[2], (L - 0.5) * 2];
        p[k] = lerp(a[0], b2[0], kk); p[k + 1] = lerp(a[1], b2[1], kk); p[k + 2] = lerp(a[2], b2[2], kk);
        if (r() < 0.004) spots.push([i, y]);
      }
      x.putImageData(d, 0, 0);
    }
    return (COST[key] = { c, top, hx, hr, spots });
  }
  // the costume extras, drawn in the sprite's own pixels
  function kerchief(hx, top, r, lw) {
    ink(P2(`M${hx - r * 1.05},${top + r * 0.62} C${hx - r * 1.1},${top - r * 0.25} ${hx + r * 1.1},${top - r * 0.25} ${hx + r * 1.05},${top + r * 0.62} C${hx + r * 0.5},${top + r * 0.36} ${hx - r * 0.5},${top + r * 0.36} ${hx - r * 1.05},${top + r * 0.62} Z`), '#a8784a', lw);
    ctx.fillStyle = '#c8986a'; for (const [a, b] of [[-0.5, 0.15], [0.1, 0.05], [0.6, 0.2]]) circle(hx + a * r, top + b * r, r * 0.08);
    // a patch and the knot
    inkRect(hx + r * 0.2, top - r * 0.02, r * 0.34, r * 0.26, '#8aa0b8', lw * 0.6, 1);
    inkCircle(hx - r * 1.0, top + r * 0.62, r * 0.17, '#a8784a', lw * 0.8);
  }
  function tiara(hx, top, r, lw, t) {
    const y = top + r * 0.18;
    ink(P2(`M${hx - r * 0.72},${y + r * 0.12} L${hx - r * 0.6},${y - r * 0.24} L${hx - r * 0.3},${y - r * 0.06} L${hx},${y - r * 0.5} L${hx + r * 0.3},${y - r * 0.06} L${hx + r * 0.6},${y - r * 0.24} L${hx + r * 0.72},${y + r * 0.12} Z`), '#ffd84a', lw);
    inkCircle(hx, y - r * 0.12, r * 0.12, '#8ad8ff', lw * 0.5);
    star(hx + r * 0.05, y - r * 0.5, r * (0.18 + 0.08 * Math.sin(t * 6)), '#ffffff');
  }
  function messengerCap(hx, top, r, lw, t) {
    ctx.save(); ctx.translate(hx, top + r * 0.4); ctx.rotate(-0.12);
    ink(P2(`M${r * 0.2},${-r * 0.3} C${r * 0.6},${-r * 1.2} ${r * 1.3},${-r * 1.5} ${r * 1.6},${-r * 1.4 + Math.sin(t * 4) * r * 0.08} C${r * 1.2},${-r * 1.05} ${r * 0.8},${-r * 0.55} ${r * 0.45},${-r * 0.2} Z`), '#ffffff', lw * 0.8);
    ink(P2(`M${-r * 0.95},${r * 0.05} C${-r * 0.95},${-r * 0.75} ${r * 0.95},${-r * 0.75} ${r * 0.95},${r * 0.05} Z`), '#d83a4a', lw);
    inkRect(-r, -r * 0.08, r * 2, r * 0.22, '#ffd84a', lw * 0.7, 2);
    ctx.restore();
  }
  function glassSlipper(x, y, sz, lw = 1, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const p = P2(`M${-sz},${sz * 0.25} C${-sz},${-sz * 0.2} ${-sz * 0.55},${-sz * 0.35} ${-sz * 0.1},${-sz * 0.2} C${sz * 0.3},${-sz * 0.05} ${sz * 0.7},${-sz * 0.45} ${sz},${-sz * 0.2} L${sz},${sz * 0.25} Z`);
    ink(p, 'rgba(200,240,255,.85)', lw, '#5a8ac0');
    ctx.strokeStyle = '#5a8ac0'; ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.moveTo(sz * 0.8, sz * 0.25); ctx.lineTo(sz * 0.8, sz * 0.6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(-sz * 0.45, 0, sz * 0.18, sz * 0.08, -0.3);
    star(sz * 0.2, -sz * 0.25, sz * 0.22, '#ffffff');
    ctx.restore();
  }
  // Aubrey in a costume look ('rags' | 'gown' | 'messenger' | null)
  function drawCinders(x, gy, frame, facing, look, lift = 0, s = AUB_SCALE, o = {}) {
    const C = costumed(frame, look), im = C.c, w = im.width * s, h = im.height * s, t = S.t;
    ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(x, gy - 2, 30 * s / AUB_SCALE * (1 - lift / 300), 6 * Math.min(1, s / 0.5));
    ctx.save(); ctx.translate(x, gy - lift);
    const native = AUB_NATIVE[frame];
    if (native && facing && native !== Math.sign(facing)) ctx.scale(-1, 1);
    if (o.spin != null) ctx.scale(Math.cos(o.spin) || 0.02, 1);
    ctx.drawImage(im, -w / 2, -h, w, h);
    ctx.scale(s, s); ctx.translate(-im.width / 2, -im.height);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const lw = Math.min(2.4, 1.1 / s);
    if (look === 'rags') kerchief(C.hx, C.top, C.hr, lw);
    if (look === 'gown') {
      tiara(C.hx, C.top, C.hr, lw, t);
      C.spots.forEach(([sx, sy], i) => { const k = Math.sin(t * 4 + i * 1.7); if (k > 0.2) star(sx, sy, 2.2 + k * 2.6, 'rgba(255,255,255,.95)'); });
      if (frame === 'idle_front' && o.slippers !== false) for (const [fx, fy] of AUB_FEET) { if (o.slippers === 'one' && fx > 50) continue; glassSlipper(fx, fy - 2, 10, lw * 0.7); }
    }
    if (look === 'messenger') messengerCap(C.hx, C.top, C.hr, lw, t);
    ctx.restore();
  }

  // =============================================================================================
  // STORYBOOK PEOPLE: the prince, the stepsisters and the royal herald, in a simple cartoon style
  // (about 200px tall at s=1, feet at the origin)
  // =============================================================================================
  const FOLK = {
    prince: { skin: '#f6d2b8', hair: '#6a3e22', style: 'short', coat: '#3a5ad8', trim: '#ffd84a', legs: '#ffffff', boots: '#3a2a3a', crown: true, sash: '#d83a5a' },
    herald: { skin: '#f0c8a8', hair: '#c8803a', style: 'short', coat: '#d83a4a', trim: '#ffd84a', legs: '#ffe8a0', boots: '#5a3a2a', plume: '#ffffff' },
    sisterA: { skin: '#f8d8c4', hair: '#e86a2a', style: 'curls', gown: '#9ad84a', trim: '#ff6fae', bow: '#ff6fae' },
    sisterB: { skin: '#f4d0bc', hair: '#3a2a4a', style: 'bun', gown: '#ff8ac0', trim: '#ffd84a', bow: '#c06ae0', tall: true },
    coachman: { skin: '#f0c8a8', hair: '#8a8aa0', style: 'short', coat: '#5a3a8a', trim: '#ffd84a', legs: '#ffffff', boots: '#2a1a2a', whiskers: true, tophat: true },
    footman: { skin: '#f0c8a8', hair: '#5a8a3a', style: 'short', coat: '#3a9a5a', trim: '#ffd84a', legs: '#ffffff', boots: '#2a1a2a' },
  };
  // pose: { walk: phase, arm: -1..1 (raise the front arm), bow: 0..1, spin: angle, mouth: 'smile'|'o'|'pout' }
  function folk(kind, x, gy, s = 1, dir = 1, pose = {}) {
    const F = FOLK[kind], t = S.t, tall = F.tall ? 1.12 : 1;
    ctx.save(); ctx.translate(x, gy); ctx.scale(s * dir, s);
    if (pose.spin != null) ctx.scale(Math.cos(pose.spin) || 0.02, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(0, 0, 42, 7);
    const wk = pose.walk != null ? Math.sin(pose.walk) : 0;
    const hy = -160 * tall;  // head centre
    if (F.gown) {
      // a big frilly gown
      const skirt = P2(`M-24,${-104 * tall} C-40,${-60 * tall} -66,-26 -70,-4 C-30,6 30,6 70,-4 C66,-26 40,${-60 * tall} 24,${-104 * tall} Z`);
      const body = P2(`M-22,${-136 * tall} C-24,${-118 * tall} -26,${-108 * tall} -24,${-100 * tall} L24,${-100 * tall} C26,${-108 * tall} 24,${-118 * tall} 22,${-136 * tall} Z`);
      inkAll([[skirt, F.gown], [body, F.gown]], 1.6);
      ctx.strokeStyle = F.trim; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-60 + i * 4, -18 - i * 18); ctx.quadraticCurveTo(0, -8 - i * 18, 60 - i * 4, -18 - i * 18); ctx.stroke(); }
      for (let i = 0; i < 9; i++) inkCircle(-62 + i * 15.5, -2, 6, F.trim, 0.6);
      bow(0, -102 * tall, 16, F.bow, 1);
    } else {
      // coat, trousers and boots, legs swinging when walking
      for (const k of [-1, 1]) {
        const sw = wk * k * 10;
        inkRect(-14 + k * 9 + sw * 0.5 - 6, -64, 13, 50, F.legs, 1.2, 4);
        inkEllipse(-8 + k * 9 + sw * 0.6, -8, 13, 8, 0, F.boots, 1.2);
      }
      const coat = P2('M-30,-136 C-34,-110 -38,-80 -38,-52 L38,-52 C38,-80 34,-110 30,-136 Z');
      ink(coat, F.coat, 1.6);
      ctx.fillStyle = F.trim; ctx.fillRect(-38, -60, 76, 6);
      for (let i = 0; i < 4; i++) inkCircle(0, -124 + i * 16, 3, F.trim, 0.5);
      if (F.sash) { ctx.save(); ctx.clip(coat); ctx.strokeStyle = F.sash; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-30, -136); ctx.lineTo(36, -60); ctx.stroke(); ctx.restore(); }
      // epaulettes
      for (const k of [-1, 1]) inkEllipse(k * 28, -134, 11, 6, 0, F.trim, 0.8);
    }
    // arms: the back one hangs, the front one can rise
    const shoulderY = -130 * tall;
    const armA = -(pose.arm || 0) * 2.2 + (pose.walk != null ? -wk * 0.4 : 0);
    for (const [k, a] of [[-1, 0.15 + (pose.walk != null ? wk * 0.4 : 0)], [1, armA - 0.15]]) {
      ctx.save(); ctx.translate(k * 24, shoulderY); ctx.rotate(-k * a);
      inkRect(-6, 0, 12, 44, F.gown ? F.skin : F.coat, 1.2, 6);
      inkCircle(0, 48, 7, F.skin, 1);
      ctx.restore();
    }
    // the head, bowed forward
    ctx.save(); ctx.translate(0, -136 * tall); ctx.rotate((pose.bow || 0) * 0.5); ctx.translate(0, 136 * tall);
    if (F.style === 'curls') puffCluster([[-24, hy - 10, 16], [24, hy - 10, 16], [-30, hy + 10, 13], [30, hy + 10, 13], [0, hy - 26, 18]], F.hair, 1.2, OL);
    if (F.style === 'bun') inkCircle(0, hy - 34, 15, F.hair, 1.2);
    inkCircle(0, hy, 28, F.skin, 1.4);
    if (F.style === 'short' || F.style === 'bun') ink(P2(`M-29,${hy + 2} C-32,${hy - 36} 32,${hy - 36} 29,${hy + 2} C20,${hy - 12} -10,${hy - 14} -29,${hy + 2} Z`), F.hair, 1.2);
    if (F.style === 'curls') puffCluster([[-14, hy - 22, 12], [6, hy - 26, 13], [22, hy - 18, 10]], F.hair, 1, OL);
    // face (looking to the front-right)
    ctx.fillStyle = '#2a1a2a'; ellipse(-6, hy, 3.4, 4.4); ellipse(13, hy, 3.4, 4.4);
    ctx.fillStyle = '#ffffff'; circle(-5, hy - 1.6, 1.2); circle(14, hy - 1.6, 1.2);
    ctx.fillStyle = 'rgba(255,120,140,.35)'; circle(-14, hy + 10, 5); circle(22, hy + 10, 5);
    const m = pose.mouth || 'smile';
    ctx.strokeStyle = '#7a2a3a'; ctx.lineWidth = 2.6;
    if (m === 'smile') { ctx.beginPath(); ctx.arc(4, hy + 9, 7, 0.3, Math.PI - 0.3); ctx.stroke(); }
    else if (m === 'o') inkEllipse(4, hy + 13, 4, 5, 0, '#7a2a3a', 0.6);
    else { ctx.beginPath(); ctx.arc(4, hy + 18, 7, Math.PI + 0.4, -0.4); ctx.stroke(); }
    if (F.whiskers) { ctx.strokeStyle = '#8a8aa0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, hy + 7); ctx.quadraticCurveTo(-12, hy + 2, -22, hy + 10); ctx.moveTo(4, hy + 7); ctx.quadraticCurveTo(20, hy + 2, 30, hy + 10); ctx.stroke(); }
    if (F.crown) ink(P2(`M-16,${hy - 26} L-18,${hy - 44} L-8,${hy - 34} L0,${hy - 48} L8,${hy - 34} L18,${hy - 44} L16,${hy - 26} Z`), '#ffd84a', 1);
    if (F.plume) { ink(P2(`M-26,${hy - 18} C-26,${hy - 42} 26,${hy - 42} 26,${hy - 18} Z`), F.coat, 1.1); ink(P2(`M8,${hy - 34} C14,${hy - 64} 34,${hy - 72} 44,${hy - 70 + Math.sin(t * 4) * 3} C34,${hy - 56} 22,${hy - 44} 14,${hy - 30} Z`), F.plume, 1); }
    if (F.tophat) { inkRect(-26, hy - 26, 52, 7, '#2a1a3a', 1.1, 3); inkRect(-17, hy - 58, 34, 34, '#2a1a3a', 1.1, 3); ctx.fillStyle = '#ffd84a'; ctx.fillRect(-17, hy - 34, 34, 5); }
    ctx.restore();
    ctx.restore();
  }

  // =============================================================================================
  // FAIRY GODMOTHER GWEN: silver curls in a bun, a little star crown, lavender gown and fairy wings
  // =============================================================================================
  CR_HATS.rk2stars = (r, L, sp, t) => {
    ink(P2(`M${-r * 0.5},${r * 0.12} L${-r * 0.42},${-r * 0.22} L${-r * 0.18},${-r * 0.02} L0,${-r * 0.4} L${r * 0.18},${-r * 0.02} L${r * 0.42},${-r * 0.22} L${r * 0.5},${r * 0.12} Z`), '#e8e8ff', 0.8, L);
    vecStar(0, -r * 0.52, r * (0.18 + 0.03 * Math.sin(t * 5)), '#ffe36b', 0.7);
  };
  CR_HOLD.rk2wand = (L, t) => {
    ctx.strokeStyle = L; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(16, -54); ctx.stroke();
    ctx.strokeStyle = '#f4f0ff'; ctx.lineWidth = 3.5; ctx.stroke();
    vecStar(18, -62, 13 + Math.sin(t * 7) * 2, '#ffe36b', 1);
    for (let i = 0; i < 4; i++) { const k = (t * 0.8 + i / 4) % 1; star(18 + Math.sin(i * 2.3 + t) * 16 * k, -62 + k * 40, 3.5 * (1 - k) + 1, 'rgba(255,250,200,.95)'); }
  };
  CHARACTERS[FRIEND] = {
    col: '#ffe0cc', bodyCol: '#b89cf0', armCol: '#b89cf0', handCol: '#ffe0cc', legCol: '#ffe0cc', feetCol: '#8a6ad8',
    hairCol: '#f4f0ff', hair: 'bun', frontHair: 'curly', bw: 40, bh: 72, hr: 38, ears: 'none', eyes: 'lashes', iris: '#7a5ae0', eyeSize: 1.05,
    mouth: 'smile', nose: 'button', noseCol: '#f0a090', blush: true, hat: 'rk2stars', hatTilt: 0, wings: 'fairy', float: true,
    shape: 'dress', dots: '#ffffff', hold: 'rk2wand', neckwear: 'pearls', seed: 3.3,
  };
  const gwen = (x, gy, s, dir = 1) => drawCritter(FRIEND, x, gy, s, dir);

  // =============================================================================================
  // BACKDROP: The Royal Kingdom
  // =============================================================================================
  const RK = (() => {
    const r = seeded(1697);
    return {
      cobbles: Array.from({ length: 70 }, () => [r() * W, 446 + r() * 92, 8 + r() * 10, r()]),
      roses: Array.from({ length: 26 }, () => [r(), r()]),
      far: Array.from({ length: 7 }, (_, i) => [60 + i * 140 + r() * 60, 236 + r() * 30, 0.5 + r() * 0.5]),
    };
  })();
  // the grand castle: (cx, by) is the middle of its base, s its size
  function castle(cx, by, s, t) {
    ctx.save(); ctx.translate(cx, by); ctx.scale(s, s); ctx.lineJoin = 'round';
    const stone = '#fbeef4', stone2 = '#f0dceb', roof = '#6a72e0', roof2 = '#ff7ab0';
    const cone = (x, top, hw, base, col) => ink(P2(`M${x - hw - 6},${base} L${x},${top} L${x + hw + 6},${base} Z`), col, 1.6);
    const tower = (x, top, hw, col = stone) => {
      ink(P2(`M${x - hw},0 L${x - hw},${top} L${x + hw},${top} L${x + hw},0 Z`), col, 1.6);
      ctx.fillStyle = 'rgba(160,120,170,.18)'; ctx.fillRect(x + hw * 0.35, top, hw * 0.65, -top);
    };
    // back towers
    for (const k of [-1, 1]) { tower(k * 92, -232, 22, stone2); cone(k * 92, -312, 22, -232, roof2); flag(k * 92, -312, 40, k < 0 ? '#ffd84a' : '#5adcff', t, k); }
    // the keep
    tower(0, -206, 62);
    cone(0, -300, 62, -206, roof);
    flag(0, -300, 54, '#ff4a6a', t, 0.5, 1.2);
    for (const k of [-1, 1]) { ink(P2(`M${k * 30 - 9},-150 C${k * 30 - 9},-170 ${k * 30 + 9},-170 ${k * 30 + 9},-150 L${k * 30 + 9},-128 L${k * 30 - 9},-128 Z`), '#5ab0ff', 1.1); }
    // the big round rose window
    inkCircle(0, -176, 15, '#ffb0d8', 1.2); ctx.strokeStyle = '#ff6fae'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(0, -176); ctx.lineTo(Math.cos(a) * 14, -176 + Math.sin(a) * 14); ctx.stroke(); }
    // the front wall, with crenellations and the gate
    const wall = new Path2D(); wall.moveTo(-150, 0); wall.lineTo(-150, -110);
    for (let i = 0; i < 15; i++) { const x = -150 + i * 20; wall.lineTo(x, -122); wall.lineTo(x + 10, -122); wall.lineTo(x + 10, -110); wall.lineTo(x + 20, -110); }
    wall.lineTo(150, 0); wall.closePath();
    ink(wall, stone, 1.6);
    ctx.strokeStyle = 'rgba(170,130,170,.35)'; ctx.lineWidth = 1.5;
    for (let row = 0; row < 5; row++) for (let i = 0; i < 8; i++) { const x = -150 + i * 40 + (row % 2) * 20, y = -100 + row * 20; ctx.strokeRect(x, y, 40, 20); }
    ink(P2('M-34,0 L-34,-58 C-34,-90 34,-90 34,-58 L34,0 Z'), '#7a4a3a', 1.6);
    ctx.strokeStyle = 'rgba(40,20,30,.6)'; ctx.lineWidth = 3; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 13, -76 + Math.abs(i) * 5); ctx.lineTo(i * 13, 0); ctx.stroke(); }
    // a banner each side of the gate
    for (const k of [-1, 1]) {
      const bx = k * 64;
      ink(P2(`M${bx - 12},-104 L${bx + 12},-104 L${bx + 12},-48 L${bx},-58 L${bx - 12},-48 Z`), k < 0 ? '#c03ad0' : '#3a7ae0', 1.1);
      vecStar(bx, -84, 7, '#ffd84a', 0.6);
    }
    // front corner towers with windows
    for (const k of [-1, 1]) {
      tower(k * 150, -178, 30);
      cone(k * 150, -262, 30, -178, roof);
      flag(k * 150, -262, 42, k < 0 ? '#5adc7a' : '#ff9a3a', t, 2 + k);
      for (let i = 0; i < 6; i++) { const x = k * 150 - 30 + i * 12; inkRect(x, -186, 8, 10, stone, 1, 1); }
      ink(P2(`M${k * 150 - 8},-120 C${k * 150 - 8},-136 ${k * 150 + 8},-136 ${k * 150 + 8},-120 L${k * 150 + 8},-100 L${k * 150 - 8},-100 Z`), '#5ab0ff', 1.1);
    }
    ctx.restore();
  }
  function clockTower(x, by, t, midnight = false) {
    // a tall stone tower with a big clock face and a bell in the belfry
    const w = 34;
    ink(P2(`M${x - w},${by} L${x - w + 4},${by - 250} L${x + w - 4},${by - 250} L${x + w},${by} Z`), '#f2e2c8', 1.6);
    ctx.strokeStyle = 'rgba(150,110,80,.3)'; ctx.lineWidth = 1.4;
    for (let y = by - 20; y > by - 250; y -= 18) { ctx.beginPath(); ctx.moveTo(x - w + 2, y); ctx.lineTo(x + w - 2, y); ctx.stroke(); }
    ink(P2(`M${x - w - 6},${by - 250} L${x + w + 6},${by - 250} L${x + w + 2},${by - 262} L${x - w - 2},${by - 262} Z`), '#d8c0a0', 1.2);
    // belfry with a swinging bell
    ink(P2(`M${x - 22},${by - 262} L${x - 22},${by - 296} C${x - 22},${by - 312} ${x + 22},${by - 312} ${x + 22},${by - 296} L${x + 22},${by - 262} Z`), '#5a3a5a', 1.2);
    ctx.save(); ctx.translate(x, by - 300); ctx.rotate(Math.sin(t * (midnight ? 9 : 1.5)) * (midnight ? 0.5 : 0.08));
    ink(P2('M-10,4 C-10,-6 10,-6 10,4 L13,22 L-13,22 Z'), '#ffcf3a', 1); ctx.restore();
    ink(P2(`M${x - w - 8},${by - 310} L${x},${by - 352} L${x + w + 8},${by - 310} Z`), '#5a62c8', 1.5);
    flag(x, by - 352, 28, '#ff4a6a', t, 3);
    // the clock
    const cy = by - 206, r = 27;
    inkCircle(x, cy, r + 5, '#ffcf3a', 1.4);
    inkCircle(x, cy, r, '#fffaf0', 1);
    ctx.fillStyle = '#5a3a5a';
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; circle(x + Math.sin(a) * r * 0.8, cy - Math.cos(a) * r * 0.8, i % 3 ? 1.6 : 2.8); }
    // close to midnight: the minute hand creeps round towards twelve
    const min = midnight ? 0 : 50 + (t * 0.35) % 10, hr = 11 + min / 60;
    ctx.strokeStyle = '#3a2a4a'; ctx.lineCap = 'round';
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + Math.sin(hr / 12 * TAU) * r * 0.5, cy - Math.cos(hr / 12 * TAU) * r * 0.5); ctx.stroke();
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + Math.sin(min / 60 * TAU) * r * 0.78, cy - Math.cos(min / 60 * TAU) * r * 0.78); ctx.stroke();
    inkCircle(x, cy, 3, '#ff4a6a', 0.6);
    // windows and the door
    inkRect(x - 9, by - 140, 18, 26, '#5ab0ff', 1, 9);
    inkRect(x - 9, by - 90, 18, 26, '#5ab0ff', 1, 9);
    ink(P2(`M${x - 14},${by} L${x - 14},${by - 30} C${x - 14},${by - 46} ${x + 14},${by - 46} ${x + 14},${by - 30} L${x + 14},${by} Z`), '#8a5a3a', 1.2);
  }
  // a town house with a coloured door, a shape plaque and flower boxes
  const DOORS = { red: '#ff4a5a', blue: '#3a8aff', yellow: '#ffcf2a', green: '#3ac86a', purple: '#a45ae8', orange: '#ff8a2a' };
  function townHouse(x, by, w, h, o, t) {
    const { wall = '#fff2d8', roof = '#e86a5a', door = 'red', shape = null, num = null, timber = true, glow = 0 } = o;
    if (glow) softGlow(x, by - h / 2, w * 0.95, '255,240,150', glow);
    ink(P2(`M${x - w / 2},${by} L${x - w / 2},${by - h} L${x + w / 2},${by - h} L${x + w / 2},${by} Z`), wall, 1.5);
    if (timber) {
      ctx.strokeStyle = '#a0704a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - w / 2, by - h * 0.55); ctx.lineTo(x + w / 2, by - h * 0.55);
      ctx.moveTo(x - w / 2 + 6, by - h); ctx.lineTo(x - w / 2 + 6, by); ctx.moveTo(x + w / 2 - 6, by - h); ctx.lineTo(x + w / 2 - 6, by);
      ctx.moveTo(x - w / 2 + 6, by - h); ctx.lineTo(x - w / 4, by - h * 0.55); ctx.moveTo(x + w / 2 - 6, by - h); ctx.lineTo(x + w / 4, by - h * 0.55); ctx.stroke();
    }
    // pointy roof and chimney
    inkRect(x + w * 0.22, by - h - h * 0.5, w * 0.12, h * 0.36, '#c8705a', 1.1, 2);
    ink(P2(`M${x - w / 2 - 10},${by - h + 4} L${x},${by - h - h * 0.55} L${x + w / 2 + 10},${by - h + 4} Z`), roof, 1.5);
    ctx.strokeStyle = 'rgba(90,30,40,.25)'; ctx.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) { const k = i / 4; ctx.beginPath(); ctx.moveTo(x - (w / 2 + 10) * k, by - h - h * 0.55 * (1 - k) + 4 * k); ctx.lineTo(x + (w / 2 + 10) * k, by - h - h * 0.55 * (1 - k) + 4 * k); ctx.stroke(); }
    // upstairs windows with flower boxes
    for (const k of [-1, 1]) {
      const wx = x + k * w * 0.24;
      inkRect(wx - 9, by - h * 0.86, 18, 18, '#bfe6ff', 1, 3);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(wx, by - h * 0.86); ctx.lineTo(wx, by - h * 0.86 + 18); ctx.stroke();
      inkRect(wx - 12, by - h * 0.86 + 18, 24, 6, '#8a5a3a', 1, 2);
      flower(wx - 6, by - h * 0.86 + 17, 3.5, '#ff6fae', '#ffd84a', 0.6); flower(wx + 6, by - h * 0.86 + 17, 3.5, '#ffd84a', '#ff9a3a', 0.6);
    }
    // the door, its plaque and a step
    const dw = Math.min(30, w * 0.34), dh = Math.min(50, h * 0.42);
    ink(P2(`M${x - dw / 2},${by} L${x - dw / 2},${by - dh + dw / 2} C${x - dw / 2},${by - dh - 2} ${x + dw / 2},${by - dh - 2} ${x + dw / 2},${by - dh + dw / 2} L${x + dw / 2},${by} Z`), DOORS[door] || door, 1.3);
    inkCircle(x + dw * 0.28, by - dh * 0.42, 2.2, '#ffd84a', 0.5);
    inkRect(x - dw / 2 - 5, by - 4, dw + 10, 6, '#c8b8a8', 1, 2);
    if (shape) { inkCircle(x, by - dh - 14, 11, '#ffffff', 1); symbol(shape, x, by - dh - 14, 7.5, DOORS[door] || '#ffd84a', 0.8); }
    if (num != null) { inkRect(x - 12, by - dh - 27, 24, 22, '#fffaf0', 1, 5); text(String(num), x, by - dh - 15.5, 16, '#3a2a5a', 'center', 800); }
  }
  function topiary(x, by, kind, s = 1) {
    ctx.save(); ctx.translate(x, by); ctx.scale(s, s);
    inkRect(-14, -18, 28, 18, '#d86a4a', 1.2, 3);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-2.5, -34, 5, 16);
    if (kind === 'ball') { inkCircle(0, -52, 22, '#3fae5a', 1.3); ctx.fillStyle = 'rgba(255,255,255,.18)'; circle(-7, -60, 8); }
    else if (kind === 'cone') { ink(P2('M-20,-30 L0,-92 L20,-30 Z'), '#3a9a52', 1.3); ctx.fillStyle = 'rgba(255,255,255,.15)'; tri(-4, -80, -14, -36, -4, -36); }
    else { for (const [y, r] of [[-44, 16], [-72, 12], [-94, 8]]) inkCircle(0, y, r, '#46b062', 1.2); }
    ctx.restore();
  }
  function fountain(x, by, t) {
    inkEllipse(x, by - 10, 74, 18, 0, '#d8d0ec', 1.5);
    ctx.fillStyle = '#7acfff'; ellipse(x, by - 13, 64, 12);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(x, by - 13, 14 + k * 46, 3 + k * 8, 0, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ink(P2(`M${x - 8},${by - 14} L${x - 6},${by - 58} L${x + 6},${by - 58} L${x + 8},${by - 14} Z`), '#e8e0f4', 1.2);
    inkEllipse(x, by - 58, 30, 8, 0, '#d8d0ec', 1.2);
    ctx.fillStyle = '#7acfff'; ellipse(x, by - 60, 24, 5);
    ink(P2(`M${x - 4},${by - 60} L${x - 3},${by - 84} L${x + 3},${by - 84} L${x + 4},${by - 60} Z`), '#e8e0f4', 1);
    // the water arcs, sparkling
    ctx.strokeStyle = 'rgba(160,220,255,.9)'; ctx.lineWidth = 3;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, by - 86); ctx.quadraticCurveTo(x + k * 22, by - 104, x + k * 26, by - 62); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + k * 18, by - 58); ctx.quadraticCurveTo(x + k * 46, by - 66, x + k * 52, by - 16); ctx.stroke(); }
    for (let i = 0; i < 6; i++) { const k = (t * 1.3 + i / 6) % 1, sd = i % 2 ? 1 : -1; ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(x + sd * (4 + k * 22), by - 92 + k * k * 30 - Math.sin(k * Math.PI) * 10, 2); }
  }
  function bunting(x0, y0, x1, y1, sag, t, n) {
    ctx.strokeStyle = 'rgba(90,60,90,.7)'; ctx.lineWidth = 1.5;
    const pt = k => [lerp(x0, x1, k), lerp(y0, y1, k) + Math.sin(k * Math.PI) * sag];
    ctx.beginPath(); for (let i = 0; i <= 20; i++) ctx.lineTo(...pt(i / 20)); ctx.stroke();
    const cols = ['#ff4a6a', '#ffd84a', '#3a8aff', '#3ac86a', '#c06ae0', '#ff9a3a'];
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n, [x, y] = pt(k), sw = Math.sin(t * 3 + i) * 2;
      ink(P2(`M${x - 6},${y} L${x + 6},${y} L${x + sw},${y + 14} Z`), cols[i % cols.length], 0.7);
    }
  }
  function pumpkin(x, by, r, lw = 1.2) {
    ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.moveTo(x, by - r * 1.5); ctx.quadraticCurveTo(x + r * 0.2, by - r * 1.9, x + r * 0.5, by - r * 1.95); ctx.stroke();
    for (const [dx, rx] of [[-0.55, 0.55], [0.55, 0.55], [0, 0.6]]) inkEllipse(x + dx * r, by - r * 0.75, rx * r, r * 0.75, 0, '#ff9a2a', lw);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ellipse(x - r * 0.15, by - r * 1.05, r * 0.15, r * 0.3, 0.2);
  }
  function mouse(x, by, s, dir = 1, t = 0, col = '#b8b0c4') {
    ctx.save(); ctx.translate(x, by); ctx.scale(s * dir, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(-30, -2 + Math.sin(t * 8) * 4, -36, -12); ctx.stroke();
    inkEllipse(0, -9, 16, 10, 0, col, 1);
    inkCircle(10, -18, 6, col, 1); inkCircle(10, -18, 3, '#ffb0c8', 0);
    ctx.fillStyle = '#1a0a14'; circle(15, -10, 1.8); circle(19, -8, 1.6);
    ctx.restore();
  }
  BACKDROPS.royalkingdom_rk2 = () => {
    const t = S.t;
    // a bright, fresh fairytale sky
    const sk = ctx.createLinearGradient(0, 0, 0, 380);
    sk.addColorStop(0, '#58b4f6'); sk.addColorStop(0.55, '#a6dcff'); sk.addColorStop(1, '#fff0dc');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    softGlow(842, 112, 120, '255,246,190', 0.75);
    inkCircle(842, 112, 32, '#ffe46a', 1.4, 'rgba(230,160,40,.8)');
    bdClouds(4, 'rgba(255,255,255,.92)', 92);
    // a rainbow behind the hills and a hot-air balloon drifting
    ctx.lineWidth = 7; ['#ff8a8a', '#ffc87a', '#fff08a', '#9ae89a', '#8acaff', '#c8a2ff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(250, 330, 200 - i * 7, Math.PI * 1.08, Math.PI * 1.55); ctx.stroke(); });
    ctx.globalAlpha = 1;
    { const bx = 330 + Math.sin(t * 0.15) * 40, by = 120 + Math.sin(t * 0.6) * 6; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 9, by + 10); ctx.lineTo(bx - 5, by + 24); ctx.moveTo(bx + 9, by + 10); ctx.lineTo(bx + 5, by + 24); ctx.stroke(); ink(P2(`M${bx},${by + 14} C${bx - 30},${by - 6} ${bx - 18},${by - 34} ${bx},${by - 34} C${bx + 18},${by - 34} ${bx + 30},${by - 6} ${bx},${by + 14} Z`), '#ff7ab0', 1); ctx.fillStyle = '#ffd84a'; ellipse(bx, by - 12, 5, 20); inkRect(bx - 6, by + 22, 12, 8, '#b8763a', 0.8, 2); }
    // far blue hills with little faraway towers
    bdHills('#b8c8f4', 262, 16, 0.006, 0.4);
    for (const [x, y, s] of RK.far) { ctx.fillStyle = '#9aaee8'; ctx.fillRect(x - 6 * s, y - 34 * s, 12 * s, 36 * s); tri(x - 9 * s, y - 34 * s, x, y - 52 * s, x + 9 * s, y - 34 * s); }
    bdHills('#9ad87a', 300, 14, 0.009, 1.7);
    // the castle on its green hill
    ctx.fillStyle = '#86cc68'; ctx.beginPath(); ctx.moveTo(300, 360); ctx.quadraticCurveTo(520, 270, 760, 360); ctx.fill();
    castle(520, 318, 0.74, t);
    // a winding path up to the castle gate
    ctx.fillStyle = '#f2dcb4'; ctx.beginPath(); ctx.moveTo(507, 318); ctx.lineTo(533, 318); ctx.quadraticCurveTo(560, 360, 520, 400); ctx.lineTo(470, 400); ctx.quadraticCurveTo(520, 360, 507, 318); ctx.fill();
    // the clock tower on the left
    clockTower(88, 418, t);
    // green lawns of the royal gardens
    bdHills('#7cc85e', 380, 6, 0.02, 0.6);
    // bunting across the square
    bunting(122, 214, 420, 268, 30, t, 13);
    bunting(640, 270, 958, 250, 24, t, 12);
    // the town houses on the right, with coloured doors (some royal invitations are coming!)
    townHouse(868, 404, 96, 120, { wall: '#fff2d8', roof: '#5a8ae0', door: 'red', shape: 'star' }, t);
    townHouse(780, 410, 84, 104, { wall: '#ffe2ec', roof: '#e86a5a', door: 'blue', shape: 'heart' }, t);
    townHouse(694, 414, 78, 92, { wall: '#e8f6e0', roof: '#c06ae0', door: 'yellow', shape: 'moon', timber: false }, t);
    townHouse(944, 412, 60, 92, { wall: '#fff6c8', roof: '#3ac86a', door: 'purple', shape: 'diamond', timber: false }, t);
    // the rose garden on the left: hedges, a rose arch and topiary
    ctx.fillStyle = '#4fae52'; rrect(140, 396, 250, 30, 14, '#4fae52', OL, 2.5);
    for (const [k, j] of RK.roses) flower(150 + k * 232, 400 + j * 18, 4.2, j < 0.5 ? '#ff4a6a' : '#ff9ac0', '#ffd84a', 0.6);
    {
      const ax = 204, ay = 400;
      ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(ax, ay - 40, 34, Math.PI, 0); ctx.moveTo(ax - 34, ay - 40); ctx.lineTo(ax - 34, ay); ctx.moveTo(ax + 34, ay - 40); ctx.lineTo(ax + 34, ay); ctx.stroke();
      ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 6; ctx.stroke();
      for (let i = 0; i <= 8; i++) { const a = Math.PI + i * Math.PI / 8; flower(ax + Math.cos(a) * 34, ay - 40 + Math.sin(a) * 34, 4.5, i % 2 ? '#ff4a6a' : '#ffffff', '#ffd84a', 0.6); }
    }
    topiary(160, 420, 'spiral', 0.9); topiary(300, 424, 'ball', 0.8); topiary(380, 428, 'cone', 0.75); topiary(620, 428, 'ball', 0.75);
    // the fountain in the town square
    fountain(476, 446, t);
    // a market stall with a striped awning
    {
      const sx = 600, sy = 438;
      inkRect(sx - 40, sy - 34, 80, 34, '#c8905a', 1.2, 3);
      for (const [px, c] of [[-26, '#ff4a5a'], [-10, '#ffd84a'], [6, '#7ad84a'], [22, '#ff9a2a']]) inkCircle(sx + px, sy - 38, 7, c, 0.8);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 40, sy - 34); ctx.lineTo(sx - 40, sy - 78); ctx.moveTo(sx + 40, sy - 34); ctx.lineTo(sx + 40, sy - 78); ctx.stroke();
      for (let i = 0; i < 6; i++) ink(P2(`M${sx - 48 + i * 16},${sy - 76} L${sx - 32 + i * 16},${sy - 76} L${sx - 32 + i * 16},${sy - 64} C${sx - 36 + i * 16},${sy - 58} ${sx - 44 + i * 16},${sy - 58} ${sx - 48 + i * 16},${sy - 64} Z`), i % 2 ? '#ffffff' : '#ff6fae', 0.8);
    }
    // the near cobbled square (walkable)
    const gg = ctx.createLinearGradient(0, 438, 0, H); gg.addColorStop(0, '#f2e2c8'); gg.addColorStop(1, '#e2cca8');
    ctx.fillStyle = gg; ctx.fillRect(0, 440, W, H - 440);
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 440); ctx.lineTo(W, 440); ctx.stroke();
    for (const [x, y, r, k] of RK.cobbles) { ctx.fillStyle = k < 0.5 ? 'rgba(180,150,120,.28)' : 'rgba(255,255,255,.35)'; ellipse(x, y, r, r * 0.42); }
    // a big gold star mosaic in the middle of the square
    ctx.save(); ctx.translate(484, 500); ctx.scale(1, 0.32); ctx.globalAlpha = 0.5; vecStar(0, 0, 60, '#ffd84a', 1.2); ctx.restore();
    // doves pecking, a pumpkin and a pot of flowers at the edges, and a little mouse that scurries past
    for (const [x, ph] of [[420, 0], [548, 2]]) { const b = Math.max(0, Math.sin(t * 3 + ph)) * 5; inkEllipse(x, 470, 12, 8, 0, '#ffffff', 1); inkCircle(x + 10, 463 + b, 6, '#ffffff', 1); ctx.fillStyle = '#ff9a3a'; tri(x + 15, 462 + b, x + 21, 464 + b, x + 15, 466 + b); ctx.fillStyle = '#2a1a2a'; circle(x + 12, 461 + b, 1.3); }
    pumpkin(54, 506, 26);
    pumpkin(100, 512, 15);
    { inkRect(898, 478, 46, 40, '#d86a4a', 1.3, 4); for (let i = 0; i < 5; i++) flower(904 + i * 9, 474 - (i % 2) * 8, 6, ['#ff4a6a', '#ffd84a', '#c06ae0', '#ff9ac0', '#ffffff'][i], '#ff9a3a', 0.7); }
    { const k = (t * 0.07) % 1; if (k < 0.5) mouse(-40 + k * 2 * (W + 80), 534, 0.75, 1, t); }
  };

  // =============================================================================================
  // GAME 1 (action): Royal Messenger. Market day in a busy town! Ride the pony through the crowd and
  // find the one person in the corner picture to hand them their invitation to the ball.
  // =============================================================================================
  const PW = [1300, 1650, 1950], PH = [880, 960, 1040], CROWD = [50, 75, 100], PAR = [28, 38, 48], HINT = [22, 30, 35];
  const SPEED = 300, SPR_W = 104, SPR_H = 196, SPR_FEET = 188, SPR_S = 1.5;
  const CARD = { x: 12, y: H - 176, w: 286, h: 164 };
  // the described features: what's on their head, what they're holding, and (tier 3) one more look
  const HATS = ['tophat', 'cap', 'beret', 'party', 'bonnet', 'sunhat', 'fishhat', 'tower', 'cake', 'pot', 'viking', 'propeller', 'chef', 'knight', 'jester', 'wizard', 'dragon'];
  const COSTUME = { knight: 'the knight in armour', jester: 'the jester', wizard: 'the wizard', dragon: 'the person in the dragon costume' };
  const HAT_NAME = { tophat: 'a top hat', cap: 'a cap', beret: 'a beret', party: 'a party hat', bonnet: 'a bonnet', sunhat: 'a big sun hat', fishhat: 'a fish hat', tower: 'a tower of three hats', cake: 'a cake hat', pot: 'a cooking pot on their head', viking: 'a horned helmet', propeller: 'a propeller hat', chef: "a chef's hat" };
  const HAT_SHORT = { tophat: 'top hat', cap: 'cap', beret: 'beret', party: 'party hat', bonnet: 'bonnet', sunhat: 'big sun hat', fishhat: 'fish hat', tower: 'tower of 3 hats', cake: 'cake hat', pot: 'pot on head', viking: 'horned helmet', propeller: 'propeller hat', chef: "chef's hat", knight: 'knight', jester: 'jester', wizard: 'wizard', dragon: 'dragon costume' };
  const HELD = ['loaf', 'flowers', 'balloon', 'fish', 'basket', 'lantern', 'goose', 'umbrella', 'lollipop', 'rod', 'pig', 'trumpet', 'juggle', 'teddy'];
  const HELD_NAME = { loaf: 'holding a loaf of bread', flowers: 'holding flowers', balloon: 'holding a balloon', fish: 'holding a fish', basket: 'holding a basket of apples', lantern: 'holding a lantern', goose: 'holding a goose', umbrella: 'holding an umbrella', lollipop: 'holding a giant lollipop', rod: 'holding a fishing rod', pig: 'walking a pig on a leash', trumpet: 'holding a trumpet', juggle: 'juggling balls', teddy: 'holding a teddy bear' };
  const LOOKS2 = ['beard', 'moustache', 'glasses', 'monocle', 'eyepatch', 'stripes', 'dots', 'cape', 'apron', 'rainbow', 'pigtails', 'beehive', 'bignose'];
  const LOOK_NAME = { beard: 'with a big beard', moustache: 'with a curly moustache', glasses: 'wearing glasses', monocle: 'wearing a monocle', eyepatch: 'with an eyepatch', stripes: 'in stripy clothes', dots: 'in spotty clothes', cape: 'wearing a cape', apron: 'wearing an apron', rainbow: 'with rainbow hair', pigtails: 'with pigtails', beehive: 'with a tall beehive hairdo', bignose: 'with a big nose' };
  const LOOK_SHORT = { beard: 'big beard', moustache: 'moustache', glasses: 'glasses', monocle: 'monocle', eyepatch: 'eyepatch', stripes: 'stripy clothes', dots: 'spotty clothes', cape: 'a cape', apron: 'an apron', rainbow: 'rainbow hair', pigtails: 'pigtails', beehive: 'beehive hair', bignose: 'big nose' };
  const BRIGHT = ['#ff4a5a', '#3a7aff', '#ffd23a', '#3ac86a', '#a45ae8', '#ff8a2a', '#ff6fc0', '#2ad0d0', '#8ad83a', '#ffffff', '#6a4ad8', '#e83a8a', '#ffb0d0', '#2a9a7a'];
  const SKINS = ['#ffe4d4', '#f8d0b8', '#f0c0a0', '#e0a880', '#c88a60', '#a86c48', '#8a5236', '#6a3e28', '#b8e0a0', '#c8c0f0'];
  const HAIRS = ['#6a3e22', '#e8c070', '#2a1a1a', '#d8682a', '#e8e8f0', '#ff6fc0', '#3a8aff', '#8a4ad8', '#3ac86a'];
  const who = tg => COSTUME[tg.hat] || `the person with ${HAT_NAME[tg.hat]}`;
  const describe = (tg, T) => `${who(tg)}, ${HELD_NAME[tg.item]}${T === 2 ? `, ${LOOK_NAME[tg.look]}` : ''}`;
  const cardLines = (tg, T) => [HAT_SHORT[tg.hat], HELD_NAME[tg.item].replace('holding ', '').replace('walking ', ''), ...(T === 2 ? [LOOK_SHORT[tg.look]] : [])];
  const bubbleW = (x, y, str, col) => {
    ctx.font = `700 16px ${FONT}`; const w = ctx.measureText(str).width + 24, h = 32;
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(x - w / 2 - 2.5, y - h - 2.5, w + 5, h + 5, 16); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, 14); ctx.fill(); tri(x - 6, y - 1, x + 6, y - 1, x, y + 9);
    text(str, x, y - h / 2, 16, col, 'center', 700);
  };
  // ---- one townsperson, drawn once into a little canvas (feet at the bottom middle) ----
  function heldItem(kind, x, y, gy) {
    if (kind === 'loaf') { inkEllipse(x, y, 16, 9, -0.3, '#d89a4a', 1.1); ctx.strokeStyle = '#a86a2a'; ctx.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 7 - 3, y - 5 - i * 2); ctx.lineTo(x + i * 7 + 3, y + 2 - i * 2); ctx.stroke(); } }
    else if (kind === 'flowers') { ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x - 5, y - 10); ctx.moveTo(x, y + 8); ctx.lineTo(x + 5, y - 10); ctx.moveTo(x, y + 8); ctx.lineTo(x, y - 14); ctx.stroke(); flower(x - 6, y - 12, 5, '#ff4a8a', '#ffd84a', 0.6); flower(x + 6, y - 12, 5, '#ffd84a', '#ff8a2a', 0.6); flower(x, y - 17, 5, '#ffffff', '#ffd84a', 0.6); }
    else if (kind === 'balloon') { ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 24, x + 2, y - 50); ctx.stroke(); inkEllipse(x + 2, y - 62, 12, 14, 0, '#ff5a8a', 1); ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(x - 2, y - 67, 3, 4); }
    else if (kind === 'fish') { ink(P2(`M${x - 14},${y} C${x - 8},${y - 8} ${x + 6},${y - 8} ${x + 10},${y} C${x + 6},${y + 8} ${x - 8},${y + 8} ${x - 14},${y} Z M${x + 8},${y} L${x + 18},${y - 7} L${x + 18},${y + 7} Z`), '#7ab0d8', 1); ctx.fillStyle = '#1a1a2a'; circle(x - 8, y - 1, 1.5); }
    else if (kind === 'basket') { ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 4, 10, Math.PI, 0); ctx.stroke(); for (const [dx, c] of [[-5, '#ff4a4a'], [4, '#7ad84a'], [0, '#ff4a4a']]) inkCircle(x + dx, y - 3 - (dx === 0 ? 4 : 0), 4.5, c, 0.6); ink(P2(`M${x - 12},${y - 2} L${x + 12},${y - 2} L${x + 9},${y + 10} L${x - 9},${y + 10} Z`), '#c8904a', 1); }
    else if (kind === 'lantern') { ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 4); ctx.stroke(); inkRect(x - 7, y + 4, 14, 18, '#ffe88a', 1, 4); ctx.fillStyle = '#ff9a2a'; ellipse(x, y + 13, 3, 5); inkRect(x - 8, y + 2, 16, 4, '#5a3a5a', 0.8, 2); }
    else if (kind === 'goose') { inkEllipse(x + 4, y + 4, 15, 10, 0.2, '#ffffff', 1); ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.quadraticCurveTo(x + 22, y - 12, x + 16, y - 22); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4.5; ctx.stroke(); inkCircle(x + 16, y - 24, 5, '#ffffff', 0.8); ctx.fillStyle = '#ff9a2a'; tri(x + 20, y - 26, x + 28, y - 23, x + 20, y - 21); ctx.fillStyle = '#1a1a2a'; circle(x + 17, y - 25, 1.2); }
    else if (kind === 'umbrella') { ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y - 52); ctx.stroke(); ink(P2(`M${x - 30},${y - 50} C${x - 26},${y - 80} ${x + 26},${y - 80} ${x + 30},${y - 50} C${x + 20},${y - 56} ${x + 10},${y - 56} ${x},${y - 50} C${x - 10},${y - 56} ${x - 20},${y - 56} ${x - 30},${y - 50} Z`), '#3a7aff', 1); ctx.fillStyle = '#ffd23a'; tri(x, y - 78, x - 9, y - 54, x + 9, y - 54); }
    else if (kind === 'lollipop') { ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y - 30); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); inkCircle(x, y - 46, 18, '#ff6fc0', 1); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 30; i++) { const a = i * 0.5, r = i * 0.55; ctx.lineTo(x + Math.cos(a) * r, y - 46 + Math.sin(a) * r); } ctx.stroke(); }
    else if (kind === 'rod') { ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 4, y + 6); ctx.lineTo(x + 30, y - 60); ctx.stroke(); ctx.strokeStyle = 'rgba(60,60,80,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 30, y - 60); ctx.lineTo(x + 36, y - 10); ctx.stroke(); ink(P2(`M${x + 30},${y - 6} C${x + 33},${y - 12} ${x + 40},${y - 12} ${x + 42},${y - 6} C${x + 40},${y} ${x + 33},${y} ${x + 30},${y - 6} Z`), '#ff9a2a', 0.7); }
    else if (kind === 'pig') { ctx.strokeStyle = '#d83a5a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, gy - 30, x + 22, gy - 18); ctx.stroke(); inkEllipse(x + 32, gy - 12, 14, 9, 0, '#ffb0c8', 1); inkCircle(x + 44, gy - 15, 7, '#ffb0c8', 0.9); inkEllipse(x + 50, gy - 14, 3, 3, 0, '#ff8aa8', 0.6); ctx.fillStyle = '#1a1a2a'; circle(x + 45, gy - 18, 1.2); ctx.strokeStyle = OL; ctx.lineWidth = 2; for (const lx of [26, 38]) { ctx.beginPath(); ctx.moveTo(x + lx, gy - 6); ctx.lineTo(x + lx, gy); ctx.stroke(); } }
    else if (kind === 'trumpet') { ink(P2(`M${x - 4},${y - 2} L${x + 16},${y - 6} L${x + 26},${y - 14} L${x + 26},${y + 6} L${x + 16},${y} L${x - 4},${y + 2} Z`), '#ffd23a', 1); }
    else if (kind === 'juggle') { for (let i = 0; i < 3; i++) inkCircle(x - 18 + i * 14, y - 30 - Math.sin(i * 1.5) * 12, 5, ['#ff4a5a', '#3a7aff', '#ffd23a'][i], 0.8); }
    else if (kind === 'teddy') { inkCircle(x - 5, y - 10, 3.5, '#c8874a', 0.6); inkCircle(x + 5, y - 10, 3.5, '#c8874a', 0.6); inkEllipse(x, y + 4, 8, 9, 0, '#c8874a', 0.9); inkCircle(x, y - 6, 6.5, '#c8874a', 0.9); ctx.fillStyle = '#1a1a1a'; circle(x - 2, y - 7, 1); circle(x + 2, y - 7, 1); }
  }
  function hatOn(sp, x, top, r) {
    const c = sp.hatHex, dk = mix(c, '#1a0830', 0.25), k = sp.hat;
    if (k === 'tophat') { inkRect(x - r * 1.1, top + r * 0.12, r * 2.2, r * 0.28, c, 1, 3); inkRect(x - r * 0.7, top - r * 1.1, r * 1.4, r * 1.25, c, 1, 2); ctx.fillStyle = dk; ctx.fillRect(x - r * 0.7, top - r * 0.12, r * 1.4, r * 0.22); }
    else if (k === 'cap') { ink(P2(`M${x - r},${top + r * 0.35} C${x - r},${top - r * 0.75} ${x + r},${top - r * 0.75} ${x + r},${top + r * 0.35} Z`), c, 1); ink(P2(`M${x + r * 0.6},${top + r * 0.3} L${x + r * 1.6},${top + r * 0.42} L${x + r * 0.6},${top + r * 0.55} Z`), dk, 1); }
    else if (k === 'beret') { inkEllipse(x - r * 0.15, top + r * 0.05, r * 1.2, r * 0.48, -0.15, c, 1); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * 0.1, top - r * 0.42); ctx.lineTo(x, top - r * 0.62); ctx.stroke(); }
    else if (k === 'party') { ink(P2(`M${x - r * 0.8},${top + r * 0.35} L${x + r * 0.1},${top - r * 1.9} L${x + r * 0.8},${top + r * 0.35} Z`), c, 1); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) circle(x - r * 0.25 + i * r * 0.2, top - r * 0.1 - i * r * 0.55, r * 0.14); inkCircle(x + r * 0.1, top - r * 1.95, r * 0.25, '#ffd23a', 0.6); }
    else if (k === 'bonnet') { ink(P2(`M${x - r * 1.15},${top + r * 0.9} C${x - r * 1.3},${top - r * 0.9} ${x + r * 1.3},${top - r * 0.9} ${x + r * 1.15},${top + r * 0.9} C${x + r * 0.8},${top + r * 0.1} ${x - r * 0.8},${top + r * 0.1} ${x - r * 1.15},${top + r * 0.9} Z`), c, 1); bow(x + r * 1.0, top + r * 0.95, r * 0.4, dk, 0.8); }
    else if (k === 'sunhat') { inkEllipse(x, top + r * 0.2, r * 2.0, r * 0.42, 0, c, 1); ink(P2(`M${x - r * 0.8},${top + r * 0.2} C${x - r * 0.8},${top - r * 0.8} ${x + r * 0.8},${top - r * 0.8} ${x + r * 0.8},${top + r * 0.2} Z`), c, 1); flower(x - r * 0.5, top, r * 0.25, '#ffffff', '#ffd84a', 0.5); }
    else if (k === 'fishhat') { ink(P2(`M${x - r * 1.3},${top - r * 0.2} C${x - r * 0.6},${top - r * 1.1} ${x + r * 0.6},${top - r * 1.1} ${x + r * 1.0},${top - r * 0.3} L${x + r * 1.7},${top - r * 0.9} L${x + r * 1.6},${top + r * 0.3} L${x + r * 1.0},${top - r * 0.1} C${x + r * 0.6},${top + r * 0.4} ${x - r * 0.6},${top + r * 0.4} ${x - r * 1.3},${top - r * 0.2} Z`), '#ff9a3a', 1); ctx.fillStyle = '#ffffff'; circle(x - r * 0.8, top - r * 0.35, r * 0.2); ctx.fillStyle = '#1a1a2a'; circle(x - r * 0.8, top - r * 0.35, r * 0.1); }
    else if (k === 'tower') { for (let i = 0; i < 3; i++) { const yy = top - i * r * 0.9, cc = [c, '#ffd23a', '#3ac86a'][i], w = r * (1.1 - i * 0.15); inkRect(x - w, yy + r * 0.12, w * 2, r * 0.25, cc, 1, 2); inkRect(x - w * 0.65, yy - r * 0.55, w * 1.3, r * 0.7, cc, 1, 2); } }
    else if (k === 'cake') { inkRect(x - r * 0.95, top - r * 0.7, r * 1.9, r, '#ffe0b0', 1, 3); ink(P2(`M${x - r * 0.95},${top - r * 0.55} C${x - r * 0.5},${top - r * 0.2} ${x},${top - r * 0.6} ${x + r * 0.3},${top - r * 0.3} C${x + r * 0.6},${top - r * 0.1} ${x + r * 0.9},${top - r * 0.5} ${x + r * 0.95},${top - r * 0.55} L${x + r * 0.95},${top - r * 0.75} L${x - r * 0.95},${top - r * 0.75} Z`), '#ff8ac0', 0.8); inkRect(x - r * 0.08, top - r * 1.35, r * 0.16, r * 0.6, '#5ab0ff', 0.6, 1); ctx.fillStyle = '#ffb83a'; ellipse(x, top - r * 1.48, r * 0.12, r * 0.2); ctx.fillStyle = '#ff3a3a'; circle(x - r * 0.5, top - r * 0.8, r * 0.14); circle(x + r * 0.5, top - r * 0.8, r * 0.14); }
    else if (k === 'pot') { ink(P2(`M${x - r * 0.95},${top + r * 0.35} L${x - r * 0.85},${top - r * 0.7} L${x + r * 0.85},${top - r * 0.7} L${x + r * 0.95},${top + r * 0.35} Z`), '#a8b0c8', 1); inkRect(x + r * 0.85, top - r * 0.4, r * 0.9, r * 0.22, '#3a3a4a', 0.8, 2); inkEllipse(x, top - r * 0.7, r * 0.85, r * 0.15, 0, '#c8d0e0', 0.7); }
    else if (k === 'viking') { ink(P2(`M${x - r},${top + r * 0.4} C${x - r},${top - r * 0.8} ${x + r},${top - r * 0.8} ${x + r},${top + r * 0.4} Z`), '#b8c0d0', 1); for (const s of [-1, 1]) ink(P2(`M${x + s * r * 0.8},${top - r * 0.1} C${x + s * r * 1.5},${top - r * 0.3} ${x + s * r * 1.7},${top - r * 1.0} ${x + s * r * 1.5},${top - r * 1.5} C${x + s * r * 1.3},${top - r * 0.9} ${x + s * r * 1.1},${top - r * 0.5} ${x + s * r * 0.75},${top + r * 0.2} Z`), '#fff4d8', 0.9); }
    else if (k === 'propeller') { ink(P2(`M${x - r},${top + r * 0.35} C${x - r},${top - r * 0.75} ${x + r},${top - r * 0.75} ${x + r},${top + r * 0.35} Z`), c, 1); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, top - r * 0.4); ctx.lineTo(x, top - r * 0.85); ctx.stroke(); inkEllipse(x - r * 0.55, top - r * 0.9, r * 0.55, r * 0.14, 0, '#ff4a5a', 0.6); inkEllipse(x + r * 0.55, top - r * 0.9, r * 0.55, r * 0.14, 0, '#3a7aff', 0.6); }
    else if (k === 'chef') { inkRect(x - r * 0.8, top - r * 0.3, r * 1.6, r * 0.6, '#ffffff', 1, 2); puffCluster([[x - r * 0.5, top - r * 0.7, r * 0.5], [x, top - r * 1.0, r * 0.6], [x + r * 0.5, top - r * 0.7, r * 0.5]], '#ffffff', 1, OL); }
    else if (k === 'knight') { ink(P2(`M${x - r * 1.05},${top + r * 1.4} L${x - r * 1.05},${top + r * 0.1} C${x - r * 1.05},${top - r * 0.9} ${x + r * 1.05},${top - r * 0.9} ${x + r * 1.05},${top + r * 0.1} L${x + r * 1.05},${top + r * 1.4} Z`), '#c8d0e0', 1.1); ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x - r * 0.75, top + r * 0.75, r * 1.5, r * 0.18); ink(P2(`M${x},${top - r * 0.6} C${x + r * 0.3},${top - r * 1.6} ${x + r * 1.2},${top - r * 1.6} ${x + r * 1.5},${top - r * 1.1} C${x + r},${top - r * 1.0} ${x + r * 0.4},${top - r * 0.8} ${x + r * 0.2},${top - r * 0.5} Z`), c, 0.9); }
    else if (k === 'jester') { for (const [s, cc] of [[-1, c], [1, '#ffd23a'], [0, '#3ac86a']]) { const ex = x + s * r * 1.4, ey = top - r * (s === 0 ? 1.4 : 0.6); ink(P2(`M${x - r * 0.8},${top + r * 0.3} Q${x + s * r * 0.6},${top - r * 1.0} ${ex},${ey} Q${x + s * r * 0.3},${top - r * 0.3} ${x + r * 0.8},${top + r * 0.3} Z`), cc, 0.9); inkCircle(ex, ey, r * 0.2, '#ffd23a', 0.6); } }
    else if (k === 'wizard') { ink(P2(`M${x - r * 1.5},${top + r * 0.35} C${x - r * 0.4},${top + r * 0.1} ${x + r * 0.4},${top + r * 0.1} ${x + r * 1.5},${top + r * 0.35} L${x + r * 0.6},${top + r * 0.1} L${x + r * 0.4},${top - r * 2.1} L${x - r * 0.6},${top + r * 0.1} Z`), '#4a3ab0', 1); vecStar(x - r * 0.05, top - r * 0.6, r * 0.25, '#ffe36b', 0.5); ctx.fillStyle = '#ffe36b'; circle(x + r * 0.2, top - r * 1.2, r * 0.1); }
    else if (k === 'dragon') { ink(P2(`M${x - r * 1.2},${top + r * 1.6} C${x - r * 1.4},${top - r * 0.6} ${x + r * 1.4},${top - r * 0.6} ${x + r * 1.2},${top + r * 1.6} L${x + r * 0.9},${top + r * 1.6} C${x + r * 0.9},${top + r * 0.2} ${x - r * 0.9},${top + r * 0.2} ${x - r * 0.9},${top + r * 1.6} Z`), '#5ac86a', 1); for (let i = 0; i < 4; i++) ink(P2(`M${x - r * 0.7 + i * r * 0.45},${top - r * 0.15 - Math.sin(i / 3 * Math.PI) * r * 0.25} l${r * 0.22},${-r * 0.5} l${r * 0.22},${r * 0.5} Z`), '#ff8a2a', 0.6); for (const s of [-1, 1]) { inkCircle(x + s * r * 0.45, top - r * 0.05, r * 0.24, '#ffffff', 0.6); ctx.fillStyle = '#1a1a2a'; circle(x + s * r * 0.45, top - r * 0.02, r * 0.1); } }
  }
  function personSprite(sp) {
    const c = document.createElement('canvas'); c.width = SPR_W * SPR_S; c.height = SPR_H * SPR_S;
    const old = ctx; ctx = c.getContext('2d');
    try {
      ctx.scale(SPR_S, SPR_S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const x = SPR_W / 2, gy = SPR_FEET, hs = sp.hs, ws = sp.ws, cl = sp.cloth, cl2 = sp.cloth2;
      const costume = sp.hat === 'knight' ? 'knight' : sp.hat === 'wizard' ? 'wizard' : sp.hat === 'jester' ? 'jester' : sp.hat === 'dragon' ? 'dragon' : null;
      const legH = (sp.stilts ? 54 : 24) * hs, torH = 38 * hs, tw = 14 * ws * Math.sqrt(hs), r = 12.5 * Math.pow(hs, 0.4);
      const waist = gy - legH, shoulder = waist - torH, hy = shoulder - r * 0.9;
      const body = costume === 'knight' ? '#c8d0e0' : costume === 'dragon' ? '#5ac86a' : costume === 'wizard' ? '#4a3ab0' : cl;
      // cape and dragon tail go behind
      if (sp.look === 'cape') ink(P2(`M${x - tw},${shoulder + 4} C${x - tw * 2},${waist} ${x - tw * 2.1},${gy - 10} ${x - tw * 1.6},${gy - 6} L${x + tw * 1.4},${gy - 6} C${x + tw * 1.8},${gy - 10} ${x + tw * 1.6},${waist} ${x + tw},${shoulder + 4} Z`), sp.capeHex, 1);
      if (costume === 'dragon') { ink(P2(`M${x - tw * 0.6},${waist} C${x - tw * 2.4},${waist + 4} ${x - tw * 2.6},${gy - 4} ${x - tw * 3.2},${gy - 18} L${x - tw * 2.2},${gy - 4} C${x - tw * 1.6},${gy} ${x - tw * 0.6},${gy - 8} ${x},${waist + 8} Z`), '#5ac86a', 1); }
      if (sp.look === 'pigtails' || sp.look === 'rainbow') {
        if (sp.look === 'pigtails') for (const s of [-1, 1]) { inkEllipse(x + s * r * 1.35, hy + r * 0.3, r * 0.42, r * 0.7, s * 0.4, sp.hairHex, 0.9); bow(x + s * r * 1.05, hy - r * 0.1, r * 0.3, '#ff4a8a', 0.6); }
        else { const rb = ['#ff4a5a', '#ff9a2a', '#ffd23a', '#3ac86a', '#3a7aff', '#a45ae8']; rb.forEach((cc, i) => inkRect(x - r * 1.15 + i * r * 0.38, hy - r * 0.2, r * 0.4, r * 2.1, cc, i ? 0 : 0.8, 3)); }
      }
      // legs (or stilts) and shoes
      if (sp.stilts) for (const s of [-1, 1]) { inkRect(x + s * 6 - 3, waist, 6, legH, '#b8763a', 1, 2); inkRect(x + s * 6 - 6, waist + 4, 12, 18, cl2, 1, 3); }
      else if (!sp.dress || costume === 'knight') for (const s of [-1, 1]) { inkRect(x + s * tw * 0.42 - 4.5, waist - 2, 9, legH, costume === 'knight' ? '#a8b0c0' : cl2, 1, 3); inkEllipse(x + s * tw * 0.45, gy - 3, 7.5, 4.5, 0, sp.shoe, 1); }
      else for (const s of [-1, 1]) { inkRect(x + s * 6 - 3, gy - 12, 6, 10, sp.skin, 0.8, 2); inkEllipse(x + s * 7, gy - 3, 7, 4, 0, sp.shoe, 1); }
      // the body: a dress/robe down to the knees, or a tunic
      const long = (sp.dress || costume === 'wizard') && costume !== 'knight';
      const bot = long ? (sp.stilts ? waist + 18 : gy - 8) : waist + 4;
      const bodyP = P2(`M${x - tw * 0.85},${shoulder} C${x - tw * 1.1},${shoulder + torH * 0.4} ${x - tw * (long ? 1.6 : 1.15)},${bot - 10} ${x - tw * (long ? 1.7 : 1.1)},${bot} L${x + tw * (long ? 1.7 : 1.1)},${bot} C${x + tw * (long ? 1.6 : 1.15)},${bot - 10} ${x + tw * 1.1},${shoulder + torH * 0.4} ${x + tw * 0.85},${shoulder} Z`);
      ink(bodyP, body, 1.2);
      ctx.save(); ctx.clip(bodyP);
      if (sp.look === 'stripes') { ctx.fillStyle = sp.patHex; for (let yy = shoulder; yy < bot; yy += 9) ctx.fillRect(x - 40, yy, 80, 4.5); }
      if (sp.look === 'dots') { ctx.fillStyle = sp.patHex; for (let yy = shoulder + 4; yy < bot; yy += 10) for (let xx = x - 36 + ((yy / 10) % 2) * 5; xx < x + 40; xx += 10) circle(xx, yy, 2.6); }
      if (costume === 'jester') { ctx.fillStyle = '#ffd23a'; ctx.fillRect(x, shoulder - 2, 40, bot - shoulder + 4); }
      if (costume === 'knight') { ctx.strokeStyle = 'rgba(90,90,120,.5)'; ctx.lineWidth = 1.5; for (let yy = shoulder + 8; yy < bot; yy += 8) { ctx.beginPath(); ctx.moveTo(x - 30, yy); ctx.lineTo(x + 30, yy); ctx.stroke(); } inkCircle(x, shoulder + torH * 0.45, 6, sp.hatHex, 0.8); }
      if (costume === 'dragon') { ctx.fillStyle = '#ffe08a'; ellipse(x, (shoulder + bot) / 2 + 4, tw * 0.7, torH * 0.45); }
      if (costume === 'wizard') { for (let i = 0; i < 6; i++) vecStar(x - tw + (i * 13) % (tw * 2), shoulder + 10 + i * 9, 3, '#ffe36b', 0.3); }
      ctx.restore();
      if (sp.look === 'apron') ink(P2(`M${x - tw * 0.6},${shoulder + torH * 0.35} L${x + tw * 0.6},${shoulder + torH * 0.35} L${x + tw * 0.8},${bot - 2} L${x - tw * 0.8},${bot - 2} Z`), '#ffffff', 0.9);
      if (!long && !costume) { ctx.fillStyle = mix(body, '#1a0830', 0.3); ctx.fillRect(x - tw * 1.1, waist - 4, tw * 2.2, 4); }
      // arms: back arm hangs, front arm holds the item
      const sleeve = costume === 'knight' ? '#c8d0e0' : costume === 'jester' ? '#ffd23a' : body;
      inkRect(x - tw - 7, shoulder + 2, 8, torH * 0.7, sleeve, 1, 4); inkCircle(x - tw - 3, shoulder + torH * 0.72 + 4, 4.5, costume === 'knight' ? '#a8b0c0' : sp.skin, 0.8);
      const hx = x + tw + 3, handY = shoulder + torH * 0.66;
      inkRect(x + tw - 1, shoulder + 2, 8, torH * 0.66, costume === 'jester' ? cl : sleeve, 1, 4); inkCircle(hx, handY + 2, 4.5, costume === 'knight' ? '#a8b0c0' : sp.skin, 0.8);
      heldItem(sp.item, hx + 3, handY + 2, gy);
      // the head
      if (sp.look === 'beehive') inkEllipse(x, hy - r * 1.6, r * 0.85, r * 1.3, 0, sp.hairHex, 1);
      inkCircle(x, hy, r, sp.skin, 1.1);
      if (costume !== 'knight' && costume !== 'dragon') {
        if (sp.look === 'rainbow') ink(P2(`M${x - r - 1},${hy + 1} C${x - r - 2},${hy - r - 4} ${x + r + 2},${hy - r - 4} ${x + r + 1},${hy + 1} C${x + 6},${hy - 7} ${x - 6},${hy - 7} ${x - r - 1},${hy + 1} Z`), '#ff6fc0', 0.9);
        else if (!sp.bald) ink(P2(`M${x - r - 1},${hy + 1} C${x - r - 2},${hy - r - 4} ${x + r + 2},${hy - r - 4} ${x + r + 1},${hy + 1} C${x + 6},${hy - 7} ${x - 6},${hy - 7} ${x - r - 1},${hy + 1} Z`), sp.hairHex, 0.9);
      }
      // face
      const ey = hy + r * 0.05, ex = r * 0.38;
      ctx.fillStyle = '#2a1a2a'; circle(x - ex, ey, 1.9); circle(x + ex, ey, 1.9);
      if (sp.freckles) { ctx.fillStyle = 'rgba(160,90,50,.6)'; for (const [a, b] of [[-0.55, 0.35], [-0.4, 0.45], [0.45, 0.4], [0.6, 0.3]]) circle(x + a * r, hy + b * r, 0.9); }
      if (sp.look === 'glasses') { ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1.6; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * ex, ey, 4, 0, TAU); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x - ex + 4, ey); ctx.lineTo(x + ex - 4, ey); ctx.stroke(); }
      if (sp.look === 'monocle') { ctx.strokeStyle = '#d8a020'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x + ex, ey, 4.5, 0, TAU); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + ex + 3, ey + 4); ctx.lineTo(x + ex + 6, ey + 16); ctx.stroke(); }
      if (sp.look === 'eyepatch') { ctx.fillStyle = '#1a1a2a'; ellipse(x - ex, ey, 4.2, 3.6); ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - r, ey - 5); ctx.lineTo(x + r, ey - 4); ctx.stroke(); }
      const nose = sp.look === 'bignose' ? r * 0.42 : r * 0.14;
      inkEllipse(x + 1, hy + r * 0.32, nose * 0.9, nose, 0, mix(sp.skin, '#ff6a6a', 0.25), 0.7);
      ctx.strokeStyle = '#8a3a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, hy + r * 0.62, 3.5, 0.3, Math.PI - 0.3); ctx.stroke();
      if (sp.look === 'moustache') ink(P2(`M${x},${hy + r * 0.52} C${x - 6},${hy + r * 0.38} ${x - 12},${hy + r * 0.62} ${x - 14},${hy + r * 0.3} C${x - 12},${hy + r * 0.85} ${x - 4},${hy + r * 0.7} ${x},${hy + r * 0.62} C${x + 4},${hy + r * 0.7} ${x + 12},${hy + r * 0.85} ${x + 14},${hy + r * 0.3} C${x + 12},${hy + r * 0.62} ${x + 6},${hy + r * 0.38} ${x},${hy + r * 0.52} Z`), sp.beardHex, 0.7);
      if (sp.look === 'beard') ink(P2(`M${x - r * 0.95},${hy + r * 0.2} C${x - r * 1.1},${hy + r * 2.6} ${x + r * 1.1},${hy + r * 2.6} ${x + r * 0.95},${hy + r * 0.2} C${x + r * 0.5},${hy + r * 0.6} ${x - r * 0.5},${hy + r * 0.6} ${x - r * 0.95},${hy + r * 0.2} Z`), sp.beardHex, 1);
      if (sp.look !== 'beard') { ctx.fillStyle = 'rgba(255,110,140,.3)'; circle(x - r * 0.62, hy + r * 0.42, 2.6); circle(x + r * 0.62, hy + r * 0.42, 2.6); }
      hatOn(sp, x, (sp.look === 'beehive' ? hy - r * 2.5 : hy - r) + 4, r);
    } finally { ctx = old; }
    const top = 38 * sp.hs + (sp.stilts ? 54 : 24) * sp.hs + 30 + 10;
    return { c, top, tw: 14 * sp.ws * Math.sqrt(sp.hs) };
  }
  // a random townsperson with the given described features
  function townsfolk(f) {
    const kind = pick(['kid', 'kid', 'normal', 'normal', 'normal', 'normal', 'round', 'skinny', 'tall', 'giant', 'stilts']);
    const hs = { kid: 0.68, normal: rand(0.9, 1.05), round: rand(0.85, 1), skinny: 1.05, tall: 1.18, giant: 1.32, stilts: 0.95 }[kind];
    const ws = { kid: 0.95, normal: rand(0.9, 1.1), round: 1.5, skinny: 0.72, tall: 0.95, giant: 1.25, stilts: 0.9 }[kind];
    const cloth = pick(BRIGHT);
    let pat; do pat = pick(BRIGHT); while (pat === cloth);
    return { ...f, hs, ws, stilts: kind === 'stilts', dress: Math.random() < 0.45, skin: pick(SKINS), hairHex: pick(HAIRS), beardHex: pick(['#6a3e22', '#e8e8f0', '#d8682a', '#2a1a1a', '#ff6fc0']), cloth, cloth2: pick(['#3a3a5a', '#5a4a3a', '#2a5a8a', '#8a2a4a', '#ffffff']), patHex: pat, capeHex: pick(BRIGHT), hatHex: pick(BRIGHT), shoe: pick(['#3a2a2a', '#d83a3a', '#3a3a8a', '#ffd23a']), freckles: Math.random() < 0.3, bald: Math.random() < 0.12 };
  }
  // ---- the town square: buildings along the top, cobbled squares and gardens ----
  function makeProps(ww, wh, round) {
    const r = seeded(500 + round * 77), out = [];
    const add = (kind, x, y, rr) => { if (!out.some(q => Math.hypot(q.x - x, q.y - y) < 150)) out.push({ kind, x, y, r: rr, col: Math.floor(r() * 6), roof: Math.floor(r() * 6) }); };
    for (let i = 0; i < 60 && out.length < ww / 150; i++) add(['stall', 'tree', 'fountain', 'stall', 'tree', 'well', 'flowers', 'cart'][Math.floor(r() * 8)], 80 + r() * (ww - 160), 320 + r() * (wh - 380), 60);
    return out;
  }
  const ROOFS = ['#e86a5a', '#5a8ae0', '#c06ae0', '#3ac86a', '#ff9a3a', '#e8a83a'];
  const WALLS = ['#fff2d8', '#ffe2ec', '#e8f6e0', '#fff6c8', '#e6eeff', '#f6e6ff'];
  function drawProp(p, t) {
    const { x, y } = p;
    if (p.kind === 'tree') { drawTree(x, y, 180, 60, p.col % 3); }
    else if (p.kind === 'fountain') fountain(x, y, t);
    else if (p.kind === 'well') { inkRect(x - 26, y - 30, 52, 30, '#c8c0d8', 1.3, 4); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 22, y - 30); ctx.lineTo(x - 22, y - 70); ctx.moveTo(x + 22, y - 30); ctx.lineTo(x + 22, y - 70); ctx.stroke(); ink(P2(`M${x - 34},${y - 66} L${x},${y - 92} L${x + 34},${y - 66} Z`), ROOFS[p.roof], 1.2); }
    else if (p.kind === 'flowers') { inkEllipse(x, y - 8, 52, 16, 0, '#6a4a2a', 1.2); for (let i = 0; i < 9; i++) flower(x - 40 + i * 10, y - 12 - (i % 2) * 6, 5.5, ['#ff4a6a', '#ffd84a', '#c06ae0', '#ffffff'][i % 4], '#ff9a3a', 0.6); }
    else if (p.kind === 'cart') { inkRect(x - 40, y - 40, 70, 26, '#c8905a', 1.3, 3); for (let i = 0; i < 5; i++) pumpkin(x - 30 + i * 13, y - 38, 7, 0.8); inkCircle(x - 22, y - 12, 12, '#9a6038', 1.2); inkCircle(x + 14, y - 12, 12, '#9a6038', 1.2); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 30, y - 28); ctx.lineTo(x + 56, y - 20); ctx.stroke(); }
    else {
      // a market stall with a striped awning and its goods
      const cols = [['#ff4a5a', '#ffd84a', '#7ad84a'], ['#ff9a2a', '#ffffff', '#ff6fae'], ['#c06ae0', '#5ab0ff', '#ffd84a']][p.col % 3];
      inkRect(x - 46, y - 36, 92, 36, '#c8905a', 1.3, 3);
      for (let i = 0; i < 6; i++) inkCircle(x - 34 + i * 14, y - 40, 7, cols[i % 3], 0.8);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 46, y - 36); ctx.lineTo(x - 46, y - 92); ctx.moveTo(x + 46, y - 36); ctx.lineTo(x + 46, y - 92); ctx.stroke();
      for (let i = 0; i < 6; i++) ink(P2(`M${x - 54 + i * 18},${y - 92} L${x - 36 + i * 18},${y - 92} L${x - 36 + i * 18},${y - 78} C${x - 40 + i * 18},${y - 72} ${x - 50 + i * 18},${y - 72} ${x - 54 + i * 18},${y - 78} Z`), i % 2 ? '#ffffff' : ROOFS[p.roof], 0.8);
    }
  }
  function drawTown(g, cx, cy, t) {
    const ww = g.ww, wh = g.wh;
    // the sky and the palace at the top of the town
    const sk = ctx.createLinearGradient(0, 0, 0, 240); sk.addColorStop(0, '#5cb4f6'); sk.addColorStop(1, '#fff0dc');
    ctx.fillStyle = sk; ctx.fillRect(cx - 10, Math.min(cy, 0) - 10, W + 20, 260);
    ctx.fillStyle = '#9ad87a'; ctx.beginPath(); ctx.moveTo(cx - 10, 250); for (let x = cx - 10; x <= cx + W + 20; x += 20) ctx.lineTo(x, 200 - Math.sin(x * 0.006) * 20); ctx.lineTo(cx + W + 20, 250); ctx.fill();
    if (Math.abs(ww / 2 - (cx + W / 2)) < 900) castle(ww / 2, 214, 0.62, t);
    // the ground: grass with big cobbled squares
    const gg = ctx.createLinearGradient(0, 230, 0, wh); gg.addColorStop(0, '#90d470'); gg.addColorStop(1, '#78c058');
    ctx.fillStyle = gg; ctx.fillRect(cx - 10, 230, W + 20, wh - 230 + 10);
    ctx.fillStyle = '#f2e2c8';
    for (let i = 0; i * 520 < ww + 520; i++) { const x = 200 + i * 520; if (x < cx - 400 || x > cx + W + 400) continue; ellipse(x, 300 + (wh - 300) * (i % 2 ? 0.62 : 0.4), 300, 150); }
    ctx.fillRect(cx - 10, wh - 140, W + 20, 140);
    ctx.fillRect(cx - 10, 250, W + 20, 60);
    ctx.fillStyle = 'rgba(180,150,120,.22)';
    for (let gx = Math.floor((cx - 40) / 60) * 60; gx < cx + W + 40; gx += 60) for (let gyy = Math.floor(Math.max(cy, 240) / 40) * 40; gyy < cy + H + 40; gyy += 40) { if (((gx * 7 + gyy * 13) % 5) < 2) ellipse(gx + ((gyy / 40) % 2) * 30, gyy, 16, 6); }
    // houses along the top of the square
    for (let i = 0; i * 140 < ww; i++) {
      const x = 70 + i * 140;
      if (Math.abs(x - ww / 2) < 200 || x < cx - 120 || x > cx + W + 120) continue;
      townHouse(x, 272, 104, 110 + (i * 37) % 30, { wall: WALLS[i % 6], roof: ROOFS[(i * 5) % 6], door: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'][i % 6] }, t);
    }
    bunting(Math.max(cx - 20, 0), 190, Math.min(cx + W + 20, ww), 200, 20, t, 26);
  }
  function drawPony(x, gy, ph, lift, s = 1, look = 'messenger', o = {}) {
    const y = gy - lift;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const air = lift > 2, col = o.col || '#fff6ee', mane = o.mane || '#ff7ab0';
    // the shadow stays on the ground
    ctx.fillStyle = 'rgba(40,20,60,.22)'; ellipse(0, lift / s, 54 * (1 - lift / 400), 8);
    // tail
    ink(P2(`M-48,-66 C-70,-70 ${-82 + Math.sin(ph) * 4},-44 ${-76 + Math.sin(ph) * 6},-22 C-66,-36 -60,-50 -46,-56 Z`), mane, 1.2);
    // legs: a gallop, or tucked up while jumping
    const legs = [[-34, 0], [-22, 1.6], [26, 3.1], [38, 4.7]];
    for (const [lx, p] of legs) {
      const a = air ? (lx < 0 ? 0.7 : -0.7) : Math.sin(ph + p) * 0.55, bend = air ? 0.9 : Math.max(0, Math.sin(ph + p + 1)) * 0.8;
      ctx.save(); ctx.translate(lx, -50); ctx.rotate(a);
      ctx.strokeStyle = OL; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 24); ctx.lineTo(Math.sin(bend) * 12 * (lx < 0 ? -1 : 1), 24 + Math.cos(bend) * 22); ctx.stroke();
      ctx.strokeStyle = lx === -22 || lx === 38 ? mix(col, '#c8b8b0', 0.4) : col; ctx.lineWidth = 8; ctx.stroke();
      inkRect(Math.sin(bend) * 12 * (lx < 0 ? -1 : 1) - 6, 22 + Math.cos(bend) * 22, 12, 7, '#a07ad0', 0.8, 2);
      ctx.restore();
    }
    // body, neck and head in one outline
    const body = P2('M-52,-62 C-56,-86 -20,-92 10,-88 C34,-86 52,-84 56,-66 C58,-50 40,-42 10,-42 C-24,-42 -50,-44 -52,-62 Z');
    const neck = P2('M30,-80 C36,-104 48,-122 60,-128 L78,-112 C66,-100 58,-84 54,-66 Z');
    const head = P2('M56,-132 C64,-140 84,-136 96,-118 C102,-108 98,-100 88,-100 C80,-100 72,-104 64,-106 C56,-110 52,-122 56,-132 Z');
    inkAll([[body, col], [neck, col], [head, col]], 1.4);
    inkEllipse(66, -136, 5, 9, -0.3, col, 1);
    ctx.fillStyle = '#ffd0e0'; ellipse(94, -108, 5, 4);
    ctx.fillStyle = '#2a1a2a'; circle(76, -122, 3.4); ctx.fillStyle = '#fff'; circle(77, -123.5, 1.2);
    // the mane flows back
    ink(P2(`M54,-136 C42,-130 34,-112 26,-92 C${36 + Math.sin(ph) * 3},-96 40,-104 46,-112 C${44},-104 48,-96 52,-90 C54,-108 58,-122 62,-132 Z`), mane, 1);
    // the royal blanket with gold trim and a little crown, and a satchel of scrolls
    ink(P2('M-30,-86 C-12,-92 12,-92 26,-86 L30,-52 C8,-46 -14,-46 -34,-52 Z'), '#6a4ad8', 1.2);
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-33, -55); ctx.quadraticCurveTo(-2, -48, 29, -55); ctx.stroke();
    vecStar(-2, -66, 6, '#ffd84a', 0.6);
    inkRect(-50, -82, 22, 24, '#b8763a', 1, 4);
    for (let i = 0; i < 3; i++) inkRect(-48 + i * 6, -92 + (i % 2) * 3, 5, 14, '#fff6dc', 0.6, 2);
    ctx.restore();
    // Aubrey rides in the saddle (her legs hidden behind the blanket), with one leg down the pony's side
    const sy = y - 84 * s;
    if (o.rider !== false) {
      ctx.save(); ctx.beginPath(); ctx.rect(x - 60 * s, sy - 140 * s, 120 * s, 140 * s + 8 * s); ctx.clip();
      drawCinders(x - 2 * s, sy + 60 * s, 'idle_front', 1, look, 0, 0.44 * s);
      ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ink(P2('M-8,-80 C-4,-66 -2,-58 2,-52 L10,-52 C8,-60 6,-70 6,-80 Z'), '#f4f0f4', 1);
      inkEllipse(5, -50, 8, 5, 0, '#5a3a5a', 1);
      ctx.restore();
    }
  }
  function scrollRoll(x, y, s, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    inkRect(-14, -6, 28, 12, '#fff6dc', 1.2, 3); inkCircle(-14, 0, 6, '#f0dcb0', 1); inkCircle(14, 0, 6, '#f0dcb0', 1);
    inkCircle(0, 0, 4.5, '#d83a4a', 0.8); ctx.strokeStyle = '#d83a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(-5, 10); ctx.moveTo(3, 4); ctx.lineTo(5, 10); ctx.stroke();
    ctx.restore();
  }
  MG.rk2messenger = {
    kind: 'action', title: () => 'Royal Messenger', icon: () => '📜',
    how: () => 'The town is busy with market day! Ride the royal pony with the ARROW keys (or tap where to go). Find the person in the corner picture, then tap them or press SPACE to hand over their invitation. 4 invitations to deliver!',
    init(g) {
      const T = g.tier - 1;
      Object.assign(g, { T, round: 0, rounds: 4, res: [], wrongAll: 0, used: [], hx: 0, hy: 0, face: 1, ph: 0, dest: null, fly: null, cheer: -1, endT: -1, bubbles: [] });
      this.newRound(g, true);
    },
    start(g) { speak(g.say); },
    // ---- the crowd ----
    newRound(g, first) {
      const T = g.T, ww = PW[T], wh = PH[T];
      g.ww = ww; g.wh = wh;
      // pick a target that hasn't been used yet (a different look every round)
      let tg;
      do tg = { hat: pick(HATS), item: pick(HELD), look: pick(LOOKS2) };
      while (g.used.some(u => u.hat === tg.hat || u.item === tg.item));
      g.used.push(tg);
      const keys = T === 2 ? ['hat', 'item', 'look'] : ['hat', 'item'];
      const shared = p => keys.filter(k => p[k] === tg[k]).length;
      const rp = () => ({ hat: pick(HATS), item: pick(HELD), look: pick(LOOKS2) });
      const crowd = [];
      // look-alikes share some (never all) of the described features
      const nLook = [5, 12, 22][T], share = [[1, 1], [1, 1], [1, 2]][T];
      for (let i = 0; i < nLook; i++) {
        let p; do { p = rp(); const s = randInt(share[0], share[1]); shuffle(keys.slice()).slice(0, s).forEach(k => { p[k] = tg[k]; }); } while (shared(p) >= keys.length || shared(p) < share[0]);
        crowd.push(p);
      }
      // everyone else: tier 1 shares nothing with the target (easy to rule out); higher tiers share at most one feature
      while (crowd.length < CROWD[T] - 1) { const p = rp(); if (shared(p) <= (T === 0 ? 0 : 1) && shared(p) < keys.length) crowd.push(p); }
      crowd.push({ ...tg, target: true });
      // pack them into the square (they may overlap a little in depth), away from the props
      const props = makeProps(ww, wh, g.round);
      const spots = [];
      for (const p of shuffle(crowd)) {
        let x, y, k = 0;
        const gap = p.target ? 70 : 46;
        do { x = rand(60, ww - 60); y = rand(300, wh - 30); k++; }
        while (k < 300 && (spots.some(s => Math.hypot(s.x - x, (s.y - y) * 1.7) < (s.spec.target ? 70 : gap)) || props.some(q => Math.abs(q.x - x) < q.r && Math.abs(q.y - y) < 40) || (p.target && Math.hypot(x - ww / 2, y - (wh - 70)) < 360)));
        const spec = townsfolk(p);
        const spr = personSprite(spec);
        spots.push({ x, y, spec, img: spr.c, top: spr.top, tw: spr.tw, ph: rand(0, 6), anim: randInt(0, 4), sp: rand(0.8, 1.6), wx: rand(-1, 1), say: 0, hop: 0 });
      }
      g.people = spots; g.props = props;
      g.animals = Array.from({ length: [8, 12, 16][T] }, () => ({ x: rand(60, ww - 60), y: rand(300, wh - 40), e: pick(['🐕', '🐈', '🐓', '🦆', '🐑', '🐐', '🐖', '🦃']), ph: rand(0, 6) }));
      g.tg = tg; g.keys = keys; g.rt = 0; g.wrong = 0; g.hinted = false; g.cheer = -1; g.fly = null; g.dest = null;
      g.hx = ww / 2; g.hy = wh - 60; g.camX = clamp(g.hx - W / 2, 0, ww - W); g.camY = clamp(g.hy - H / 2 - 40, 0, wh - H);
      g.desc = describe(tg, T);
      g.say = `${first ? '' : 'Next invitation! '}Find ${g.desc}!`;
      if (!first) speak(g.say);
      g.progress = `📜 Invitation ${g.round + 1} of ${g.rounds}`;
    },
    near(g, maxD) {
      let best = null, bd = maxD;
      for (const p of g.people) { const d = Math.hypot(p.x - g.hx, (p.y - g.hy) * 1.3); if (d < bd) { bd = d; best = p; } }
      return best;
    },
    deliver(g, p) {
      if (g.fly || g.cheer >= 0 || p.say > 0 || g.cool > 0) return;
      g.fly = { p, t: 0 }; tone(700, 0.12, 'triangle', 0.08, 0, 1100);
    },
    land(g, p) {
      if (p.spec.target) {
        g.cheer = 0; p.hop = 1.6; SFX.hit(); SFX.sparkle();
        burst(p.x - g.camX, p.y - g.camY - 60, 22, { colors: ['#ff6fae', '#ffd84a', '#ffffff'] });
        p.say = 2.2; p.line = pick(['For me? Hooray!', 'A royal ball! Thank you!', 'Oh, how wonderful!']);
        speak(p.line);
        const par = PAR[g.T], tf = g.rt <= par ? 1 : clamp(1 - (g.rt - par) / (par * 3), 0.6, 1);
        g.res[g.round] = clamp((g.hinted ? 0.6 : 1) * tf - 0.15 * g.wrong, 0.2, 1);
        this.score(g);
      } else {
        g.wrong++; g.wrongAll++; p.say = 1.6; g.cool = 0.8; p.line = pick(['Not me!', 'Not me, sorry!', 'Hmm, not me!']); SFX.miss();
        say(g, `${p.line} Look again: find ${g.desc}.`);
      }
    },
    score(g) { let s = 0; for (let i = 0; i < g.rounds; i++) s += g.res[i] || 0; g.score = s / g.rounds; },
    update(g, dt) {
      g.rt += dt; g.ph += dt; g.cool = Math.max(0, (g.cool || 0) - dt);
      for (const p of g.people) { p.say = Math.max(0, p.say - dt); p.hop = Math.max(0, p.hop - dt); }
      if (g.cheer >= 0) {
        g.cheer += dt;
        if (g.cheer > 2.2) { g.round++; if (g.round >= g.rounds) { g.done = true; return; } this.newRound(g, false); }
        return;
      }
      if (!g.hinted && g.rt > HINT[g.T]) { g.hinted = true; say(g, `Here's a hint! Follow the sparkly arrow to ${g.desc}.`); }
      // steering: arrow keys, or tap / hold where to ride (tap a person to ride over and hand it to them)
      let vx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), vy = (goDown() ? 1 : 0) - ((keys.arrowup || keys.w) ? 1 : 0);
      const wpx = pointer.x + g.camX, wpy = pointer.y + g.camY;
      const onUI = inRect(CARD) || pointer.y < 62;
      if (pointer.clicked && !onUI) {
        const p = g.people.filter(p => Math.abs(wpx - p.x) < Math.max(24, p.tw + 8) && wpy < p.y + 6 && wpy > p.y - p.top).sort((a, c) => Math.hypot(wpx - a.x, wpy - a.y + a.top / 2) - Math.hypot(wpx - c.x, wpy - c.y + c.top / 2))[0];
        g.dest = p ? { p } : { x: wpx, y: wpy };
        g.usePointer = true;
      } else if (pointer.down && g.dest && !g.dest.p && !onUI) g.dest = { x: wpx, y: wpy };
      if (vx || vy) g.dest = null;
      if (g.dest) {
        const tx = g.dest.p ? g.dest.p.x - Math.sign(g.dest.p.x - g.hx || 1) * 56 : g.dest.x, ty = g.dest.p ? g.dest.p.y + 4 : g.dest.y;
        const dx = tx - g.hx, dy = ty - g.hy, d = Math.hypot(dx, dy);
        if (g.dest.p && Math.hypot(g.dest.p.x - g.hx, (g.dest.p.y - g.hy) * 1.3) < 76) { this.deliver(g, g.dest.p); g.dest = null; }
        else if (d < 6) g.dest = null;
        else { vx = dx / d; vy = dy / d; }
      }
      const m = Math.hypot(vx, vy);
      if (m > 0) { g.hx += vx / m * SPEED * dt; g.hy += vy / m * SPEED * dt; if (Math.abs(vx) > 0.2) g.face = Math.sign(vx); g.moving = true; } else g.moving = false;
      g.hx = clamp(g.hx, 50, g.ww - 50); g.hy = clamp(g.hy, 270, g.wh - 20);
      if (pressed[' '] || pressed.enter || pressed.e) {
        const p = this.near(g, 110);
        if (p) this.deliver(g, p); else floatText(g.hx - g.camX, g.hy - g.camY - 160, 'Ride up close to someone!', '#ffffff', false, 18);
      }
      if (g.fly) { g.fly.t += dt / 0.45; if (g.fly.t >= 1) { const p = g.fly.p; g.fly = null; this.land(g, p); } }
      // the camera follows the pony
      g.camX = lerp(g.camX, clamp(g.hx - W / 2, 0, g.ww - W), Math.min(1, dt * 5));
      g.camY = lerp(g.camY, clamp(g.hy - H / 2 - 40, 0, g.wh - H), Math.min(1, dt * 5));
      this.score(g);
    },
    draw(g) {
      const t = S.t, cx = g.camX, cy = g.camY;
      ctx.save(); ctx.translate(-cx, -cy);
      drawTown(g, cx, cy, t);
      // everything that stands on the ground, back to front
      const list = [];
      for (const p of g.props) if (p.x > cx - 160 && p.x < cx + W + 160 && p.y > cy - 40 && p.y < cy + H + 260) list.push([p.y, () => drawProp(p, t)]);
      for (const a of g.animals) { const ax = a.x + Math.sin(t * 0.4 + a.ph) * 30; list.push([a.y, () => emoji(a.e, ax, a.y - 12 - Math.abs(Math.sin(t * 4 + a.ph)) * 3, 26)]); }
      for (const p of g.people) {
        if (p.x < cx - 60 || p.x > cx + W + 60 || p.y < cy - 20 || p.y > cy + H + 140) continue;
        list.push([p.y, () => {
          // little idle animations: sway, bob, wiggle, bounce or shuffle
          const q = t * p.sp + p.ph, a = p.anim;
          const sway = a === 0 ? Math.sin(q * 1.2) * 5 : a === 4 ? Math.sin(q * 0.6) * 12 : 0;
          const hop = (p.hop > 0 ? Math.abs(Math.sin(p.hop * 9)) * 16 : 0) + (a === 1 ? Math.abs(Math.sin(q * 2.2)) * 3 : a === 3 ? Math.max(0, Math.sin(q * 1.5) - 0.8) * 30 : 0);
          const rot = a === 2 ? Math.sin(q * 3) * 0.07 : a === 0 ? Math.sin(q * 1.2) * 0.03 : 0;
          ctx.fillStyle = 'rgba(40,20,60,.18)'; ellipse(p.x + sway, p.y, 20, 5);
          if (rot) { ctx.save(); ctx.translate(p.x + sway, p.y); ctx.rotate(rot); ctx.drawImage(p.img, -SPR_W / 2, -SPR_FEET - hop, SPR_W, SPR_H); ctx.restore(); }
          else ctx.drawImage(p.img, p.x + sway - SPR_W / 2, p.y - SPR_FEET - hop, SPR_W, SPR_H);
        }]);
      }
      list.push([g.hy + 1, () => {
        ctx.save(); ctx.translate(g.hx, 0); ctx.scale(g.face, 1);
        drawPony(0, g.hy, g.moving ? g.ph * 14 : 0, 0, 0.72, 'messenger');
        ctx.restore();
      }]);
      list.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
      // who SPACE would hand the invitation to
      const nr = g.cheer < 0 && !g.fly ? this.near(g, 110) : null;
      if (nr) { ctx.strokeStyle = `rgba(255,255,255,${0.7 + 0.3 * Math.sin(t * 6)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(nr.x, nr.y, 26, 8, 0, 0, TAU); ctx.stroke(); text('📜?', nr.x, nr.y - nr.top - 14, 18, '#fff', 'center', 800); }
      // the hint sparkle over the right person
      const tgP = g.people.find(p => p.spec.target);
      if (g.hinted && g.cheer < 0) { softGlow(tgP.x, tgP.y - 50, 70, '255,240,150', 0.5 + 0.2 * Math.sin(t * 6)); for (let i = 0; i < 4; i++) { const a = t * 3 + i * TAU / 4; star(tgP.x + Math.cos(a) * 40, tgP.y - 60 + Math.sin(a) * 40, 6, '#fff6a8'); } }
      if (g.fly) {
        const p = g.fly.p, k = g.fly.t, x = lerp(g.hx, p.x, k), y = lerp(g.hy - 120, p.y - 70, k) - Math.sin(k * Math.PI) * 60;
        scrollRoll(x, y, 1, k * 9);
      }
      for (const p of g.people) if (p.say > 0) bubbleW(p.x, p.y - p.top - 10, p.line, p.spec.target ? '#c03a7a' : '#5a2a6e');
      ctx.restore();
      // edge arrow to the target when the hint is on and they're off-screen
      if (g.hinted && g.cheer < 0) {
        const sx = tgP.x - cx, sy = tgP.y - 50 - cy;
        if (sx < 0 || sx > W || sy < 60 || sy > H) {
          const ax = clamp(sx, 40, W - 40), ay = clamp(sy, 100, H - 40), a = Math.atan2(sy - ay, sx - ax);
          ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ink(P2('M22,0 L-12,-16 L-4,0 L-12,16 Z'), '#ffd84a', 1.4); ctx.restore();
        }
      }
      // the corner card: who to find
      rrect(CARD.x, CARD.y, CARD.w, CARD.h, 18, '#fff8e6', '#c9a070', 3);
      rrect(CARD.x + 10, CARD.y + 10, 96, CARD.h - 20, 12, '#e8f4ff', '#c9a8e0', 2);
      { const k = Math.min(1.1, (CARD.h - 24) / (tgP.top + 30)), bx = CARD.x + 58, by = CARD.y + CARD.h - 16;
        ctx.save(); ctx.beginPath(); ctx.roundRect(CARD.x + 10, CARD.y + 10, 96, CARD.h - 20, 12); ctx.clip();
        ctx.drawImage(tgP.img, bx - SPR_W * k / 2, by - SPR_FEET * k, SPR_W * k, SPR_H * k); ctx.restore(); }
      text('Find:', CARD.x + 116, CARD.y + 24, 16, '#9a6a3a', 'left', 800);
      { let yy = CARD.y + 48; for (const line of cardLines(g.tg, g.T)) for (const l of wrap('• ' + line, 160, 15, 700)) { text(l, CARD.x + 116, yy, 15, '#5a2a6e', 'left', 700); yy += 19; } }
      if (g.cheer >= 0) { outlined(g.round + 1 >= g.rounds ? 'All delivered!' : 'Delivered!', W / 2, 140, 40, '#ffd84a', 'center', '#7a3a6a'); }
      if (g.rt < 5 && g.cheer < 0) { rrect(W / 2 - 250, 70, 500, 38, 19, 'rgba(48,24,72,.78)'); text('Arrow keys to ride. Tap someone or press SPACE to deliver!', W / 2, 89, 16, '#fff6a8', 'center', 700); }
    },
  };

  // =============================================================================================
  // GAME 2 (learn): Cinderella, a storybook Aubrey acts out
  // =============================================================================================
  const PIC = { x: 54, y: 82, w: 852, h: 350 };
  const FLOOR = 412;   // where people stand in the pictures
  const CS = (() => {
    const r = seeded(1812);
    return {
      stars: Array.from({ length: 60 }, () => [PIC.x + r() * PIC.w, PIC.y + r() * 220, 0.6 + r() * 1.6, r() * 6]),
      blocks: Array.from({ length: 40 }, () => [r(), r()]),
      grass: Array.from({ length: 40 }, () => [PIC.x + r() * PIC.w, 372 + r() * 60]),
    };
  })();
  const picSky = (c0, c1, y1 = 360) => { const g = ctx.createLinearGradient(0, PIC.y, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(PIC.x - 40, PIC.y - 40, PIC.w + 80, PIC.h + 80); };
  const nightStars = t => { for (const [x, y, r, ph] of CS.stars) { ctx.fillStyle = `rgba(255,250,220,${0.5 + 0.5 * Math.sin(t * 2 + ph)})`; circle(x, y, r); } };
  function fire(x, y, s, t) {
    for (let i = 0; i < 5; i++) {
      const f = 1 + Math.sin(t * 9 + i * 1.7) * 0.18, dx = (i - 2) * 13 * s, h = (i === 2 ? 64 : i % 2 ? 46 : 34) * s * f;
      ink(P2(`M${x + dx - 13 * s},${y} C${x + dx - 16 * s},${y - h * 0.5} ${x + dx - 2 * s},${y - h * 0.8} ${x + dx + Math.sin(t * 6 + i) * 3 * s},${y - h} C${x + dx + 6 * s},${y - h * 0.6} ${x + dx + 16 * s},${y - h * 0.4} ${x + dx + 13 * s},${y} Z`), ['#ff6a2a', '#ff9a2a', '#ffd84a', '#ff9a2a', '#ff6a2a'][i], 0.8);
    }
  }
  function ashPile(x, y, k, t) {
    if (k <= 0.02) return;
    const r = 30 * (0.35 + 0.65 * k);
    ctx.fillStyle = `rgba(110,100,110,${0.35 + 0.5 * k})`; ellipse(x, y, r * 1.5, r * 0.5);
    ctx.fillStyle = `rgba(150,140,150,${0.4 + 0.5 * k})`; ellipse(x - 6, y - 4, r, r * 0.34);
    ctx.fillStyle = `rgba(90,80,90,${0.5 * k})`; for (let i = 0; i < 5; i++) circle(x - r + i * r * 0.5, y + Math.sin(i * 2.1) * 4, 2.2);
  }
  // ---- the scenes (drawn in screen space inside the picture) ----
  const SCENES_CN = {
    kitchen(st, t) {
      // warm stone walls
      ctx.fillStyle = '#e6d2b4'; ctx.fillRect(PIC.x - 10, PIC.y - 10, PIC.w + 20, 300);
      ctx.strokeStyle = 'rgba(160,120,90,.35)'; ctx.lineWidth = 2;
      for (let row = 0; row < 9; row++) for (let i = 0; i < 12; i++) { const x = PIC.x + i * 80 + (row % 2) * 40 - 40, y = PIC.y + row * 32; ctx.strokeRect(x, y, 80, 32); }
      // the window with a view of the faraway palace
      inkRect(610, 112, 150, 130, '#a8dcff', 1.6, 8);
      ctx.save(); ctx.beginPath(); ctx.rect(612, 114, 146, 126); ctx.clip();
      ctx.fillStyle = '#86cc68'; ellipse(690, 250, 110, 40); castle(686, 226, 0.22, t);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(650 + Math.sin(t * 0.3) * 10, 136, 22, 8);
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(685, 112); ctx.lineTo(685, 242); ctx.moveTo(610, 177); ctx.lineTo(760, 177); ctx.stroke();
      for (const k of [-1, 1]) ink(P2(`M${685 + k * 92},104 C${685 + k * 70},140 ${685 + k * 84},210 ${685 + k * 64},252 L${685 + k * 100},252 L${685 + k * 100},104 Z`), '#e86a7a', 1.2);
      inkRect(596, 240, 178, 10, '#b8763a', 1.2, 3);
      // shelves of jars and plates
      inkRect(790, 190, 112, 8, '#9a6038', 1.2, 2); inkRect(790, 252, 112, 8, '#9a6038', 1.2, 2);
      for (const [x, c] of [[804, '#ff9a8a'], [828, '#8ad0ff'], [852, '#ffe08a'], [878, '#b8e08a']]) { inkRect(x - 9, 168, 18, 22, c, 1, 4); inkRect(x - 7, 163, 14, 6, '#c8905a', 0.8, 2); }
      for (const x of [808, 846, 884]) inkCircle(x, 236, 15, '#ffffff', 1), inkCircle(x, 236, 9, '#8ab8ff', 0.6);
      // the big hearth
      ink(P2('M110,362 L110,170 L400,170 L400,362 Z'), '#c4b4c8', 1.8);
      ctx.strokeStyle = 'rgba(110,90,120,.35)'; ctx.lineWidth = 2; for (let r = 0; r < 6; r++) for (let i = 0; i < 5; i++) ctx.strokeRect(110 + i * 58 + (r % 2) * 29 - 29, 170 + r * 32, 58, 32);
      inkRect(96, 152, 318, 22, '#9a6038', 1.6, 4);
      ink(P2('M160,362 L160,262 C160,214 350,214 350,262 L350,362 Z'), '#3a2030', 1.6);
      // pot on a hook and the fire
      ctx.strokeStyle = '#2a1a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(255, 226); ctx.lineTo(255, 272); ctx.stroke();
      inkEllipse(255, 292, 34, 24, 0, '#2a2a3a', 1.2); inkRect(220, 268, 70, 8, '#3a3a4a', 1, 3);
      inkRect(205, 348, 100, 12, '#7a4a2a', 1.2, 5);
      fire(255, 352, 0.8, t);
      softGlow(255, 330, 90, '255,170,60', 0.35);
      // things on the mantel
      for (const x of [140, 370]) { inkRect(x - 5, 128, 10, 24, '#fff6e0', 1, 2); ctx.fillStyle = '#ffb83a'; ellipse(x, 122 + Math.sin(t * 8 + x) * 1, 3, 6); }
      inkCircle(255, 136, 14, '#ffd84a', 1.1); inkCircle(255, 136, 10, '#fffaf0', 0.6);
      // a mouse hole with a mouse peeking out
      ink(P2('M846,362 L846,344 C846,330 872,330 872,344 L872,362 Z'), '#3a2030', 1.1);
      if (st.peek !== false && Math.sin(t * 0.9) > 0) mouse(858, 362, 0.55, -1, t);
      // the wooden floor
      const fl = ctx.createLinearGradient(0, 360, 0, 440); fl.addColorStop(0, '#d49a62'); fl.addColorStop(1, '#b87a48');
      ctx.fillStyle = fl; ctx.fillRect(PIC.x - 10, 360, PIC.w + 20, 90);
      ctx.strokeStyle = 'rgba(110,60,30,.4)'; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(PIC.x, 378 + i * 18); ctx.lineTo(PIC.x + PIC.w, 378 + i * 18); ctx.stroke(); }
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(PIC.x - 10, 361); ctx.lineTo(PIC.x + PIC.w + 10, 361); ctx.stroke();
      // a stool and the broom, if Aubrey isn't using it
      inkRect(470, 336, 54, 10, '#b8763a', 1.2, 3); for (const x of [476, 512]) inkRect(x, 344, 6, 30, '#9a6038', 1, 2);
      if (st.broom !== false) broom(560, 372, -0.2, 0.9);
    },
    hall(st, t) {
      // the stepfamily's fancy hall: striped wallpaper, portraits, a grand door
      ctx.fillStyle = '#f8d4e0'; ctx.fillRect(PIC.x - 10, PIC.y - 10, PIC.w + 20, 300);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; for (let x = PIC.x; x < PIC.x + PIC.w; x += 36) ctx.fillRect(x, PIC.y, 14, 290);
      ctx.fillStyle = '#e8a8c0'; ctx.fillRect(PIC.x - 10, 300, PIC.w + 20, 62);
      ctx.strokeStyle = '#c8789a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(PIC.x, 300); ctx.lineTo(PIC.x + PIC.w, 300); ctx.stroke();
      // the stepsisters' portraits (looking very pleased with themselves)
      for (const [x, k] of [[200, 'sisterA'], [330, 'sisterB']]) {
        inkRect(x - 44, 112, 88, 104, '#ffd84a', 1.6, 6); inkRect(x - 34, 122, 68, 84, '#fff6e8', 1, 3);
        ctx.save(); ctx.beginPath(); ctx.rect(x - 34, 122, 68, 84); ctx.clip(); folk(k, x, 268, 0.62, 1, { mouth: 'smile' }); ctx.restore();
      }
      // a mirror and a vase of flowers on a little table
      inkEllipse(520, 170, 36, 50, 0, '#ffd84a', 1.4); inkEllipse(520, 170, 28, 42, 0, '#d8f0ff', 0.8);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(510, 150, 6, 16, 0.3);
      inkRect(480, 300, 80, 10, '#b8763a', 1.2, 3); for (const x of [488, 546]) inkRect(x, 308, 6, 54, '#9a6038', 1, 2);
      inkRect(508, 270, 24, 30, '#8ad0ff', 1.1, 8); for (const [dx, c] of [[-10, '#ff4a6a'], [0, '#ffd84a'], [10, '#c06ae0']]) flower(520 + dx, 262 - Math.abs(dx) * 0.4, 7, c, '#ff9a3a', 0.8);
      // the grand front door
      const open = st.door || 0;
      ink(P2('M716,362 L716,200 C716,140 846,140 846,200 L846,362 Z'), '#ffe8a8', 1.8);
      ctx.save(); ctx.clip(P2('M726,362 L726,204 C726,154 836,154 836,204 L836,362 Z'));
      const sky = ctx.createLinearGradient(0, 150, 0, 362); sky.addColorStop(0, '#8ad0ff'); sky.addColorStop(1, '#d8f4c8'); ctx.fillStyle = sky; ctx.fillRect(726, 150, 110, 212);
      ctx.fillStyle = '#86cc68'; ctx.fillRect(726, 320, 110, 42);
      if (st.herald) folk('herald', 781 - (1 - st.herald) * 60, 400, 0.78, -1, { arm: st.heraldArm || 0, mouth: 'o' });
      // the door swings open (narrows to the side)
      const dw = 110 * (1 - open * 0.82);
      ink(P2(`M726,362 L726,204 C726,154 ${726 + dw},154 ${726 + dw},204 L${726 + dw},362 Z`), '#9a5a3a', 1.4);
      if (open < 0.6) { ctx.strokeStyle = 'rgba(60,30,20,.4)'; ctx.lineWidth = 2; for (const k of [0.25, 0.5, 0.75]) { ctx.beginPath(); ctx.moveTo(726 + dw * k, 190); ctx.lineTo(726 + dw * k, 360); ctx.stroke(); } inkCircle(726 + dw * 0.82, 280, 7, '#ffd84a', 1); }
      ctx.restore();
      if (st.knock) { for (let i = 0; i < 2; i++) { const k = (t * 1.6 + i * 0.5) % 1; ctx.globalAlpha = 1 - k; outlined('KNOCK!', 781 + (i ? 30 : -30), 180 - k * 40, 20 + k * 6, '#fff6a8', 'center', '#7a4a2a'); } ctx.globalAlpha = 1; }
      // the grand staircase on the left
      for (let i = 0; i < 6; i++) inkRect(PIC.x - 10, 362 - (i + 1) * 30, 120 - i * 16, 30, i % 2 ? '#f4e6ee' : '#ead6e2', 1.2, 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(150, 362); ctx.lineTo(60, 180); ctx.stroke(); ctx.strokeStyle = '#c8905a'; ctx.lineWidth = 3; ctx.stroke();
      // the floor: polished boards and a red rug
      const fl = ctx.createLinearGradient(0, 360, 0, 440); fl.addColorStop(0, '#c8905a'); fl.addColorStop(1, '#a87040');
      ctx.fillStyle = fl; ctx.fillRect(PIC.x - 10, 360, PIC.w + 20, 90);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(PIC.x - 10, 361); ctx.lineTo(PIC.x + PIC.w + 10, 361); ctx.stroke();
      ink(P2('M250,372 L700,372 L760,440 L190,440 Z'), '#d83a5a', 1.2);
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(262, 380); ctx.lineTo(690, 380); ctx.lineTo(738, 436); ctx.lineTo(212, 436); ctx.closePath(); ctx.stroke();
    },
    garden(st, t) {
      // night in the back garden, under the moon and stars
      picSky('#1c2468', '#5a4aa8', 380);
      nightStars(t);
      softGlow(790, 140, 70, '255,250,210', 0.5); inkCircle(790, 140, 30, '#fff8d8', 1.2, 'rgba(200,190,140,.8)');
      ctx.fillStyle = 'rgba(220,210,170,.5)'; circle(780, 132, 6); circle(800, 150, 4);
      // the cottage, with one lit window
      ink(P2('M40,362 L40,190 L120,140 L200,190 L200,362 Z'), '#4a3a6a', 1.6);
      inkRect(96, 222, 40, 40, '#ffd87a', 1.2, 4); softGlow(116, 242, 50, '255,220,120', 0.4);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(116, 222); ctx.lineTo(116, 262); ctx.moveTo(96, 242); ctx.lineTo(136, 242); ctx.stroke();
      // far hills and the palace glowing on the hill
      ctx.fillStyle = '#3a3a8a'; ctx.beginPath(); ctx.moveTo(200, 362); ctx.quadraticCurveTo(520, 250, 920, 330); ctx.lineTo(920, 362); ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.9; castle(560, 296, 0.24, t); ctx.restore();
      softGlow(560, 270, 60, '255,220,150', 0.3);
      // the garden ground, a fence and leafy pumpkin vines
      ctx.fillStyle = '#2f6a4a'; ctx.fillRect(PIC.x - 10, 352, PIC.w + 20, 100);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(PIC.x - 10, 353); ctx.lineTo(PIC.x + PIC.w + 10, 353); ctx.stroke();
      for (let i = 0; i < 18; i++) { const x = 210 + i * 40; inkRect(x, 316, 12, 40, '#c8b8d8', 1, 3); }
      inkRect(204, 326, 720, 6, '#b8a8c8', 0.8, 2);
      for (const [x, y] of CS.grass) { ctx.strokeStyle = '#3f8a5a'; ctx.lineWidth = 2; ctx.beginPath(); for (const d of [-3, 0, 3]) { ctx.moveTo(x + d, y); ctx.lineTo(x + d * 1.6, y - 8); } ctx.stroke(); }
      for (const [x, y, r] of [[300, 392, 18], [350, 380, 14], [460, 396, 16], [252, 404, 12]]) inkEllipse(x, y, r * 1.3, r * 0.7, 0.3, '#3f9a4a', 1);
      // a watering can and some stones (the lizards like it here)
      ink(P2('M800,404 L796,370 L842,370 L838,404 Z'), '#8ab8d8', 1.2); ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(842, 380); ctx.lineTo(866, 360); ctx.stroke(); ctx.strokeStyle = '#8ab8d8'; ctx.lineWidth = 2; ctx.stroke();
      for (const [x, y] of [[760, 418], [880, 414]]) inkEllipse(x, y, 16, 9, 0, '#8a8aa8', 1);
      // fireflies
      for (let i = 0; i < 7; i++) { const x = 260 + i * 90 + Math.sin(t * 0.7 + i * 2) * 30, y = 270 + Math.sin(t * 1.1 + i) * 30; ctx.fillStyle = `rgba(255,250,150,${0.4 + 0.4 * Math.sin(t * 4 + i)})`; circle(x, y, 3); }
    },
    ball(st, t) {
      // the palace ballroom: tall windows, chandeliers, a shiny chequered floor
      ctx.fillStyle = '#ecd4f4'; ctx.fillRect(PIC.x - 10, PIC.y - 10, PIC.w + 20, 300);
      for (const wx of [170, 480, 790]) {
        ink(P2(`M${wx - 54},300 L${wx - 54},170 C${wx - 54},110 ${wx + 54},110 ${wx + 54},170 L${wx + 54},300 Z`), '#ffd84a', 1.6);
        ctx.save(); ctx.clip(P2(`M${wx - 46},296 L${wx - 46},172 C${wx - 46},118 ${wx + 46},118 ${wx + 46},172 L${wx + 46},296 Z`));
        const g = ctx.createLinearGradient(0, 120, 0, 300); g.addColorStop(0, '#1c2468'); g.addColorStop(1, '#6a4ab0'); ctx.fillStyle = g; ctx.fillRect(wx - 50, 110, 100, 200);
        for (let i = 0; i < 8; i++) { ctx.fillStyle = '#fff8d0'; circle(wx - 40 + (i * 37) % 80, 130 + (i * 53) % 140, 1.4); }
        // fireworks over the palace gardens
        const k = (t * 0.45 + wx * 0.01) % 1, fx = wx + Math.sin(wx) * 18, fy = 170 + Math.cos(wx) * 20;
        for (let i = 0; i < 10; i++) { const a = i * TAU / 10; ctx.fillStyle = ['#ff6fae', '#ffd84a', '#8ad8ff'][Math.floor(wx / 300) % 3]; ctx.globalAlpha = 1 - k; circle(fx + Math.cos(a) * k * 30, fy + Math.sin(a) * k * 30 + k * k * 10, 2.5); }
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, 120); ctx.lineTo(wx, 298); ctx.moveTo(wx - 46, 210); ctx.lineTo(wx + 46, 210); ctx.stroke();
      }
      // pillars between the windows, with garlands
      for (const px of [325, 635]) { inkRect(px - 18, 100, 36, 200, '#fff6fa', 1.4, 3); inkRect(px - 24, 96, 48, 14, '#ffd84a', 1.2, 3); inkRect(px - 24, 290, 48, 12, '#ffd84a', 1.2, 3); }
      for (const [a, b] of [[54, 307], [343, 617], [653, 906]]) { ctx.strokeStyle = '#5aae6a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a, 104); ctx.quadraticCurveTo((a + b) / 2, 140, b, 104); ctx.stroke(); for (let i = 1; i < 4; i++) { const k = i / 4; flower(lerp(a, b, k), 104 + Math.sin(k * Math.PI) * 18, 5, '#ff8ac0', '#ffd84a', 0.6); } }
      // chandeliers
      for (const cx of [325, 635]) {
        ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, PIC.y); ctx.lineTo(cx, 128); ctx.stroke();
        inkEllipse(cx, 134, 40, 9, 0, '#ffd84a', 1.2);
        for (let i = 0; i < 5; i++) { const x = cx - 32 + i * 16; inkRect(x - 2.5, 116, 5, 14, '#fffaf0', 0.6, 1); ctx.fillStyle = '#ffb83a'; ellipse(x, 111 + Math.sin(t * 9 + i) * 0.8, 2.5, 4.5); }
        softGlow(cx, 124, 60, '255,230,160', 0.35);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(200,240,255,.9)'; ellipse(cx - 24 + i * 16, 148, 3, 5); }
      }
      // the chequered marble floor, in perspective
      ctx.fillStyle = '#fff6fa'; ctx.fillRect(PIC.x - 10, 300, PIC.w + 20, 150);
      ctx.save(); ctx.beginPath(); ctx.rect(PIC.x - 10, 300, PIC.w + 20, 150); ctx.clip();
      const row = y => 300 + (y * y) * 4;
      for (let r = 0; r < 10; r++) {
        const y0 = row(r), y1 = row(r + 1);
        for (let i = -12; i < 12; i++) {
          if ((i + r) % 2) continue;
          const sp0 = 44 + r * 10, sp1 = 44 + (r + 1) * 10;
          ctx.fillStyle = 'rgba(176,140,210,.45)'; ctx.beginPath();
          ctx.moveTo(480 + i * sp0, y0); ctx.lineTo(480 + (i + 1) * sp0, y0); ctx.lineTo(480 + (i + 1) * sp1, y1); ctx.lineTo(480 + i * sp1, y1); ctx.fill();
        }
      }
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(PIC.x - 10, 300); ctx.lineTo(PIC.x + PIC.w + 10, 300); ctx.stroke();
      // guests watching from the sides
      for (const [x, c, d] of [[96, '#ff9a5a', 1], [140, '#5ab0ff', 1], [820, '#9ad84a', -1], [866, '#ffd84a', -1]]) {
        ink(P2(`M${x - 22},340 C${x - 16},300 ${x - 10},290 ${x},288 C${x + 10},290 ${x + 16},300 ${x + 22},340 Z`), c, 1.1);
        inkCircle(x, 276, 12, '#f6d2b8', 1); ctx.fillStyle = '#2a1a2a'; circle(x + d * 4, 275, 1.6);
      }
    },
    stairs(st, t) {
      // the palace steps at midnight, the clock tower glowing
      picSky('#141a50', '#4a3a98', 400);
      nightStars(t);
      // palace wall and the door at the top
      ink(P2('M40,240 L40,90 L250,90 L250,240 Z'), '#e8dcf4', 1.6);
      ink(P2('M110,240 L110,160 C110,120 180,120 180,160 L180,240 Z'), '#ffe08a', 1.4);
      softGlow(145, 200, 80, '255,220,140', 0.4);
      for (let i = 0; i < 6; i++) inkRect(44 + i * 34, 80, 22, 14, '#e8dcf4', 1, 1);
      // the clock tower with the big clock at midnight
      const cx = 790, cy = 176;
      ink(P2(`M${cx - 66},440 L${cx - 60},120 L${cx + 60},120 L${cx + 66},440 Z`), '#d8cce8', 1.6);
      ink(P2(`M${cx - 74},122 L${cx},70 L${cx + 74},122 Z`), '#5a62c8', 1.5);
      const ring = st.ring || 0;
      if (ring > 0) softGlow(cx, cy, 120, '255,240,160', 0.6 * ring);
      inkCircle(cx, cy, 52, '#ffcf3a', 1.6); inkCircle(cx, cy, 45, '#fffaf0', 1.2);
      ctx.fillStyle = '#5a3a5a'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; circle(cx + Math.sin(a) * 37, cy - Math.cos(a) * 37, i % 3 ? 2.5 : 4.5); }
      ctx.strokeStyle = '#3a2a4a'; ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 26); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 2, cy - 38); ctx.stroke();
      inkCircle(cx, cy, 5, '#ff4a6a', 0.8);
      for (let i = 0; i < 3; i++) if (ring > 0) { const k = 1 - ring + i * 0.2; ctx.strokeStyle = `rgba(255,240,170,${Math.max(0, ring - i * 0.25)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 56 + k * 40, 0, TAU); ctx.stroke(); }
      // the twelve steps, down from the palace door
      for (let i = STEPS - 1; i >= 0; i--) {
        const [sx, sy] = stepPos(i);
        ink(P2(`M${sx - 34},${sy} L${sx + 34},${sy} L${sx + 34},440 L${sx - 34},440 Z`), i % 2 ? '#f0e8f8' : '#e6dcf2', 1.3);
        ctx.fillStyle = 'rgba(120,100,160,.18)'; ctx.fillRect(sx - 34, sy + 2, 68, 8);
      }
      // the bottom of the stairs, and the coach (or the pumpkin) waiting
      ctx.fillStyle = '#2f5a4a'; ctx.fillRect(PIC.x - 10, 424, PIC.w + 20, 30);
      if (st.slipper != null) { const [sx, sy] = stepPos(st.slipper); glassSlipper(sx, sy - 6, 14, 1.2, -0.2); softGlow(sx, sy - 6, 26, '220,240,255', 0.5); }
      if (st.pumpkin) pumpkin(690, 432, 26);
    },
  };
  const STEPS = 12;
  const stepPos = i => [146 + i * 46, 236 + i * 15.5];
  function broom(x, y, rot, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -110); ctx.lineTo(0, -16); ctx.stroke(); ctx.strokeStyle = '#c8905a'; ctx.lineWidth = 4; ctx.stroke();
    ink(P2('M-6,-22 L6,-22 L18,4 L-18,4 Z'), '#e8c86a', 1.1);
    ctx.strokeStyle = 'rgba(150,110,40,.6)'; ctx.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 2, -18); ctx.lineTo(i * 6, 2); ctx.stroke(); }
    ctx.restore();
  }
  // a little white dove (the birds who help Cinderella)
  function dove(x, y, s, flap, dir = 1, carry = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const f = Math.sin(flap) * 0.6;
    ink(P2(`M-4,-2 C-14,${-22 - f * 20} -34,${-26 - f * 22} -40,${-18 - f * 26} C-28,-8 -16,-2 -4,2 Z`), '#f4f4ff', 1);
    inkEllipse(0, 0, 18, 10, 0, '#ffffff', 1.1);
    inkCircle(16, -6, 7, '#ffffff', 1);
    ctx.fillStyle = '#ffa23a'; tri(22, -7, 29, -5, 22, -3);
    ctx.fillStyle = '#2a1a2a'; circle(18, -8, 1.5);
    ink(P2('M-16,0 L-28,-4 L-26,6 Z'), '#f4f4ff', 0.8);
    if (carry) inkEllipse(27, -2, 4.5, 3, 0.3, '#c8803a', 0.6);
    ctx.restore();
  }
  function lentil(x, y, r, col = '#d08a3a') { inkEllipse(x, y, r, r * 0.68, 0.4, col, 0.8); ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(x - r * 0.3, y - r * 0.2, r * 0.3, r * 0.15, 0.4); }
  function pebble(x, y, r) { ink(P2(`M${x - r},${y} C${x - r},${y - r * 0.9} ${x - r * 0.1},${y - r} ${x + r * 0.4},${y - r * 0.7} C${x + r * 1.1},${y - r * 0.4} ${x + r},${y + r * 0.6} ${x + r * 0.2},${y + r * 0.7} C${x - r * 0.6},${y + r * 0.8} ${x - r},${y + r * 0.5} ${x - r},${y} Z`), '#9a96a6', 0.8); ctx.fillStyle = 'rgba(255,255,255,.3)'; circle(x - r * 0.3, y - r * 0.35, r * 0.22); }
  function lizard(x, y, s, dir = 1, t = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-30, 4 + Math.sin(t * 5) * 4, -40, -2); ctx.stroke(); ctx.strokeStyle = '#6ad06a'; ctx.lineWidth = 5; ctx.stroke();
    inkEllipse(0, -2, 18, 7, 0, '#6ad06a', 1); inkEllipse(18, -4, 8, 6, 0, '#6ad06a', 1);
    ctx.fillStyle = '#2a1a2a'; circle(21, -6, 1.6);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; for (const lx of [-8, 8]) { ctx.beginPath(); ctx.moveTo(lx, 2); ctx.lineTo(lx - 3, 9); ctx.stroke(); }
    ctx.restore();
  }
  function rat(x, y, s, dir = 1, t = 0) {
    mouse(x, y, s * 1.5, dir, t, '#8a7a7a');
    ctx.save(); ctx.translate(x + dir * 22 * s, y - 28 * s); ctx.fillStyle = '#2a1a2a'; ctx.restore();
  }
  // the golden pumpkin coach
  function coach(x, by, s, t, k = 1) {
    ctx.save(); ctx.translate(x, by); ctx.scale(s * k, s * (0.6 + 0.4 * k));
    for (const wx of [-62, 62]) { inkCircle(wx, -26, 26, '#ffd84a', 1.4); inkCircle(wx, -26, 8, '#ffb83a', 1); ctx.strokeStyle = '#c8901a'; ctx.lineWidth = 2.5; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t; ctx.beginPath(); ctx.moveTo(wx, -26); ctx.lineTo(wx + Math.cos(a) * 22, -26 + Math.sin(a) * 22); ctx.stroke(); } }
    const body = P2('M-92,-52 C-100,-120 -50,-160 0,-160 C50,-160 100,-120 92,-52 C70,-40 -70,-40 -92,-52 Z');
    ink(body, '#ff9a2a', 1.8);
    ctx.save(); ctx.clip(body); ctx.strokeStyle = '#e8781a'; ctx.lineWidth = 3; for (const dx of [-50, -18, 18, 50]) { ctx.beginPath(); ctx.moveTo(dx * 0.4, -160); ctx.quadraticCurveTo(dx * 1.4, -100, dx * 0.9, -40); ctx.stroke(); } ctx.restore();
    ink(P2('M-28,-58 L-28,-112 C-28,-130 28,-130 28,-112 L28,-58 Z'), '#ffd84a', 1.3);
    inkRect(-18, -114, 36, 34, '#bfe6ff', 1, 10);
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-92, -52); ctx.quadraticCurveTo(0, -36, 92, -52); ctx.stroke();
    ink(P2('M-10,-160 C-6,-176 6,-176 10,-160 Z'), '#4a8a3a', 1);
    vecStar(0, -180, 12, '#ffd84a', 1.1);
    star(-50 + Math.sin(t * 3) * 6, -130, 6, '#ffffff'); star(56, -96 + Math.sin(t * 4) * 5, 5, '#ffffff');
    ctx.restore();
  }

  // --- the open storybook ------------------------------------------------------------------------
  function drawBook(pageR) {
    ctx.fillStyle = 'rgba(40,20,50,.35)'; ctx.fillRect(0, 0, W, H);
    rrect(18, 64, W - 36, 468, 18, '#5a3a9a');
    ctx.strokeStyle = 'rgba(255,220,160,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(26, 72, W - 52, 452, 14); ctx.stroke();
    for (let i = 3; i >= 0; i--) { ctx.fillStyle = i % 2 ? '#efe2c0' : '#f8eed4'; ctx.beginPath(); ctx.roundRect(30 + i, 70 + i, W - 60 - i * 2, 456 - i, 10); ctx.fill(); }
    const pg = ctx.createLinearGradient(30, 0, W - 30, 0);
    pg.addColorStop(0, '#f6ead0'); pg.addColorStop(0.46, '#fff9ea'); pg.addColorStop(0.5, '#e8d8b4'); pg.addColorStop(0.54, '#fff9ea'); pg.addColorStop(1, '#f6ead0');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(34, 70, W - 68, 452, 10); ctx.fill();
    if (pageR) text(pageR, W - 44, 512, 12, 'rgba(120,90,70,.7)', 'right', 600);
  }
  function picFrame(draw) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(PIC.x, PIC.y, PIC.w, PIC.h, 14); ctx.clip();
    draw();
    const v = ctx.createRadialGradient(W / 2, PIC.y + PIC.h / 2, PIC.h * 0.45, W / 2, PIC.y + PIC.h / 2, PIC.w * 0.62);
    v.addColorStop(0, 'rgba(255,248,230,0)'); v.addColorStop(1, 'rgba(255,248,230,.5)');
    ctx.fillStyle = v; ctx.fillRect(PIC.x, PIC.y, PIC.w, PIC.h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(91,63,115,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(PIC.x, PIC.y, PIC.w, PIC.h, 14); ctx.stroke();
  }
  function caption(str) {
    let size = 19, lines = wrap(str, 812, size, 600);
    if (lines.length > 3) { size = 16.5; lines = wrap(str, 830, size, 600); }
    const lh = size * 1.3, y0 = 476 - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => text(l, W / 2, y0 + i * lh, size, '#4a2a5a', 'center', 600));
  }
  const aubAt = (x, gy, frame, facing, look, o = {}) => drawCinders(x, gy, frame, facing, look, o.lift || 0, o.s || 0.5, o);
  const glowAt = (x, y, r) => softGlow(x, y, r, '255,240,150', 0.45 + 0.25 * Math.sin(S.t * 6));
  const inPic = () => inRect(PIC);

  // --- story pages --------------------------------------------------------------------------------
  const PILES = [[160, 396], [262, 418], [352, 398], [430, 424], [214, 430], [392, 432]];
  const ITEMS = [['👒', 'hat', 'HAT'], ['🧤', 'gloves', 'GLOVES'], ['👠', 'shoes', 'SHOES'], ['🎀', 'ribbon', 'RIBBON'], ['👜', 'bag', 'BAG'], ['💍', 'ring', 'RING']];
  const MOVES = { L: ['👈', 'Step left', 'arrowleft', '1'], R: ['👉', 'Step right', 'arrowright', '2'], T: ['💫', 'Twirl', 'arrowup', '3'], C: ['🙇', 'Curtsy', 'arrowdown', '4'] };
  const bong = () => { tone(196, 1.2, 'sine', 0.16); tone(392, 0.9, 'sine', 0.06); tone(588, 0.6, 'triangle', 0.03); };
  const BEATS = {
    sweep: {
      w: 0.7, page: 'Beginning',
      enter(g, b) {
        b.piles = PILES.slice(0, 3 + g.tier).map(([x, y]) => ({ x, y, k: 1 }));
        Object.assign(b, { ax: 520, lp: null, time: 0, puff: 0 });
        g.cap = 'Once upon a time, a kind girl named Cinderella had to do ALL the chores for her stepmother and two stepsisters. Aubrey is Cinderella! Rub the broom over the ashes to sweep the hearth.';
        g.act = 'Hold and rub over the ashes!';
      },
      update(g, b, dt) {
        const act = g.ph === 'act';
        let bx = null, by = null;
        if (act) {
          b.time += dt;
          if (pointer.down && inPic()) {
            bx = pointer.x; by = pointer.y;
            const moved = b.lp ? Math.hypot(pointer.x - b.lp[0], pointer.y - b.lp[1]) : 0;
            for (const p of b.piles) if (p.k > 0 && Math.abs(p.x - bx) < 56 && Math.abs(p.y - by) < 40) { p.k -= moved * 0.0065; if (moved > 2 && (b.puff -= dt) <= 0) { b.puff = 0.12; burst(p.x, p.y - 6, 3, { colors: ['#b8b0c0', '#d8d0d8'], up: 40, spread: 60 }); SFX.scrub(); } }
            b.lp = [pointer.x, pointer.y];
            b.ax += clamp(bx - 50 - b.ax, -300 * dt, 300 * dt);
          } else b.lp = null;
          if (goLeft()) b.ax -= 220 * dt; if (goRight()) b.ax += 220 * dt;
          if (keys[' ']) for (const p of b.piles) if (p.k > 0 && Math.abs(p.x - (b.ax + 40)) < 60) { p.k -= dt * 1.1; if ((b.puff -= dt) <= 0) { b.puff = 0.15; burst(p.x, p.y - 6, 3, { colors: ['#b8b0c0'], up: 40, spread: 60 }); SFX.scrub(); } }
          b.ax = clamp(b.ax, 120, 760);
          const left = b.piles.reduce((s, p) => s + Math.max(0, p.k), 0);
          if (left <= 0.001) g.finish(b.time < 35 ? 1 : 0.8, 'Swish, swish! The hearth was clean. But Cinderella was always covered in cinders and ashes, and THAT is how she got her name.');
          else if (b.time > 70) g.finish(0.6 * (1 - left / b.piles.length), 'That will do! Cinderella was always covered in cinders and ashes, and THAT is how she got her name.');
          b.hint = b.time > 6;
        }
        b.bx = bx; b.by = by;
      },
      draw(g, b, t) {
        SCENES_CN.kitchen({ broom: false }, t);
        for (const p of b.piles) { ashPile(p.x, p.y, p.k, t); if (b.hint && p.k > 0 && g.tier === 1) glowAt(p.x, p.y, 40); }
        const sweeping = b.bx != null;
        aubAt(b.ax, FLOOR, 'idle_front', 1, 'rags');
        broom(sweeping ? b.bx : b.ax + 36, sweeping ? b.by + 6 : FLOOR, sweeping ? Math.sin(S.t * 18) * 0.3 : -0.15, 0.8);
      },
      bot(g, b, f) { const p = b.piles.find(p => p.k > 0); return p ? { down: [p.x + Math.sin(f * 0.7) * 34, p.y] } : null; },
    },
    lentils: {
      w: 1, page: 'Beginning',
      enter(g, b) {
        const n = [6, 8, 10][g.tier - 1], m = [5, 8, 11][g.tier - 1], items = [];
        for (let i = 0; i < n + m && items.length < n + m; i++) {
          for (let k = 0; k < 60; k++) { const x = rand(140, 560), y = rand(372, 426); if (items.every(o => Math.hypot(o.x - x, o.y - y) > 30)) { items.push({ x, y, lentil: i < n, taken: false, wig: 0, r: g.tier === 3 ? 8 : 9.5, col: pick(['#d08a3a', '#c86a2a', '#7aa83a']) }); break; } }
        }
        Object.assign(b, { items, n: items.filter(o => o.lentil).length, inBowl: 0, birds: [], miss: 0 });
        g.cap = 'Her mean stepmother tipped a bowl of lentils into the ashes. "Pick them ALL out!" Cinderella called her friends, the birds. Tap each lentil and a bird will carry it to the bowl. Not the grey pebbles!';
        g.act = 'Tap the lentils!';
      },
      update(g, b, dt) {
        for (const o of b.items) o.wig = Math.max(0, o.wig - dt);
        for (const d of b.birds) {
          d.k += dt / 0.6;
          if (d.k >= 1 && d.leg < 2) { d.leg++; d.k = 0; if (d.leg === 2) { b.inBowl++; SFX.pop(); floatText(650, 350, String(b.inBowl), '#fff6a8', false, 26); if (g.tier === 1) speak(NUM_WORDS[b.inBowl] || String(b.inBowl)); } }
        }
        b.birds = b.birds.filter(d => d.leg < 2 || d.k < 1);
        if (g.ph === 'act' && pointer.clicked && inPic()) {
          const o = b.items.filter(o => !o.taken && Math.hypot(o.x - pointer.x, o.y - pointer.y) < 24).sort((a, c) => Math.hypot(a.x - pointer.x, a.y - pointer.y) - Math.hypot(c.x - pointer.x, c.y - pointer.y))[0];
          if (o && o.lentil) { o.taken = true; b.birds.push({ o, leg: 0, k: 0, from: [rand(640, 760), 140] }); tone(1200, 0.08, 'sine', 0.08); }
          else if (o) { o.wig = 0.5; b.miss++; SFX.miss(); say(g, 'That is a grey ash pebble! Look for the lentils.'); }
        }
        if (g.ph === 'act' && b.inBowl >= b.n) g.finish(1 - 0.08 * b.miss, `${NUM_WORDS[b.n] ? NUM_WORDS[b.n][0].toUpperCase() + NUM_WORDS[b.n].slice(1) : b.n} lentils, all in the bowl! "Thank you, little birds!" said Cinderella.`);
      },
      draw(g, b, t) {
        SCENES_CN.kitchen({}, t);
        ctx.fillStyle = 'rgba(120,110,120,.55)'; ellipse(350, 400, 240, 40);
        for (const o of b.items) if (!o.taken) { const dx = o.wig ? Math.sin(o.wig * 50) * 3 : 0; if (o.lentil) lentil(o.x + dx, o.y, o.r, o.col); else pebble(o.x + dx, o.y, o.r + 1); }
        // the bowl
        ink(P2('M600,398 C600,428 700,428 700,398 Z'), '#c8905a', 1.4); inkEllipse(650, 398, 50, 9, 0, '#e8b878', 1.2);
        for (let i = 0; i < Math.min(b.inBowl, 12); i++) lentil(624 + (i % 6) * 10, 396 - Math.floor(i / 6) * 4, 5, '#d08a3a');
        rrect(608, 432 - 70, 84, 26, 13, 'rgba(255,250,235,.92)', '#c9a8e0', 2); text(`${b.inBowl} / ${b.n}`, 650, 375, 15, '#5a2a6e', 'center', 800);
        aubAt(760, FLOOR, 'crouch', -1, 'rags');
        for (const d of b.birds) {
          const [x0, y0] = d.leg === 0 ? d.from : d.leg === 1 ? [d.o.x, d.o.y - 10] : [650, 386];
          const [x1, y1] = d.leg === 0 ? [d.o.x, d.o.y - 10] : d.leg === 1 ? [650, 386] : [d.from[0] + 100, 100];
          const k = ease(d.k);
          dove(lerp(x0, x1, k), lerp(y0, y1, k) - Math.sin(k * Math.PI) * 30, 0.8, S.t * 20, x1 > x0 ? 1 : -1, d.leg === 1);
        }
        if (g.tier === 1 && g.bt > 6) for (const o of b.items) if (!o.taken && o.lentil) { glowAt(o.x, o.y, 22); break; }
      },
      bot(g, b, f, good) { const bad = !good && b.miss < 3; const o = b.items.find(o => !o.taken && (bad ? !o.lentil : o.lentil)); return o ? { click: [o.x, o.y] } : null; },
    },
    invite: {
      w: 1, page: 'Beginning',
      enter(g, b) {
        const reqs = shuffle(ITEMS.map((_, i) => i)).slice(0, [2, 3, 4][g.tier - 1]);
        Object.assign(b, { stage: 0, st: 0, door: 0, herald: 0, reqs, ri: 0, miss: 0, sx: -120, got: [[], []], shake: {} });
        g.cap = 'Knock, knock! Somebody is at the door. Tap the door to open it!';
        g.act = 'Tap the door!';
      },
      setStage(g, b, s, cap, act) { b.stage = s; b.st = 0; if (cap) { g.cap = cap; say(g, cap); } g.act = act || null; },
      ask(g, b) { const [, , big] = ITEMS[b.reqs[b.ri]]; const who = b.ri % 2 ? 'the other stepsister' : 'a stepsister'; say(g, `"My ${big}! Hurry up, Cinderella!" shouts ${who}. Tap the ${ITEMS[b.reqs[b.ri]][1]}!`); g.cap = g.say; },
      update(g, b, dt) {
        b.st += dt; for (const k in b.shake) if ((b.shake[k] -= dt) <= 0) delete b.shake[k];
        if (b.stage >= 1) b.door = Math.min(1, b.door + dt * 2);
        if (b.stage >= 1 && b.stage < 4) b.herald = Math.min(1, b.herald + dt * 1.5);
        if (b.stage >= 4) b.herald = Math.max(0, b.herald - dt * 2);
        if (b.stage >= 3) b.sx = Math.min(b.stage >= 5 ? 1200 : 300, b.sx + dt * (b.stage >= 5 ? 360 : 500));
        if (g.ph !== 'act') return;
        const c = pointer.clicked;
        if (b.stage === 0 && c && inRect({ x: 700, y: 140, w: 160, h: 230 })) { SFX.click(); this.setStage(g, b, 1, 'A royal herald! "An invitation from the palace, for everyone in this house!" Tap the red seal to open it.', 'Tap the red seal!'); }
        else if (b.stage === 1 && c && b.st > 0.6 && Math.hypot(pointer.x - 480, pointer.y - 236) < 46) { SFX.sparkle(); this.setStage(g, b, 2, '"The King and Queen invite everyone in the kingdom to a ROYAL BALL, tonight at the palace!"'); }
        else if (b.stage === 2 && b.st > 4) { this.setStage(g, b, 3); g.act = 'Tap what she asks for!'; this.ask(g, b); }
        else if (b.stage === 3 && c && b.cards && b.sx >= 300) {
          const i = b.cards.findIndex(r => inRect(r));
          if (i >= 0) {
            if (i === b.reqs[b.ri]) {
              SFX.hit(); burst(b.cards[i].x + 50, b.cards[i].y + 40, 12); b.got[b.ri % 2].push(ITEMS[i][0]); b.ri++;
              if (b.ri >= b.reqs.length) { this.setStage(g, b, 4); say(g, '"Off to the ball!" The stepsisters rushed out of the door, and left Cinderella behind.'); b.st = 0; }
              else this.ask(g, b);
            } else { b.miss++; b.shake[i] = 0.5; SFX.miss(); say(g, `No, no! Not the ${ITEMS[i][1]}! My ${ITEMS[b.reqs[b.ri]][2]}!`); }
          }
        } else if (b.stage === 4 && b.st > 0.6) { b.stage = 5; b.st = 0; }
        else if (b.stage === 5 && b.st > 1.4) g.finish(1 - 0.15 * b.miss, '"Off to the ball!" The stepsisters rushed away in their fancy clothes. "Can I come too?" asked Cinderella. "YOU? In those rags? No!" they laughed.');
        b.knock = b.stage === 0 && (b.st % 1.6) < 0.05;
        if (b.knock) { tone(160, 0.08, 'square', 0.06); tone(160, 0.08, 'square', 0.06, 0.18); }
      },
      draw(g, b, t) {
        SCENES_CN.hall({ door: ease(b.door), herald: ease(b.herald), heraldArm: b.stage >= 1 ? 0.6 : 0, knock: b.stage === 0 && g.ph === 'act' }, t);
        if (b.stage === 0 && g.tier === 1 && g.bt > 4) glowAt(781, 260, 90);
        // the stepsisters dash in
        if (b.stage >= 3) {
          const hop = Math.abs(Math.sin(t * 8)) * 6;
          for (const [k, kind, dx] of [[0, 'sisterA', 0], [1, 'sisterB', 110]]) {
            const x = b.sx + dx;
            folk(kind, x, FLOOR - hop * (k ? 0 : 1), 0.62, 1, { arm: 0.5, mouth: 'o', walk: b.stage >= 5 ? t * 12 : null });
            b.got[k].forEach((e, i) => emoji(e, x - 40 + i * 24, 300 - (k ? 20 : 0), 22));
          }
          if (b.stage === 3 && g.ph === 'act') bubble(b.sx + (b.ri % 2 ? 110 : 0), 236, `My ${ITEMS[b.reqs[b.ri]][2]}!`);
        }
        aubAt(560, FLOOR, 'idle_front', 1, 'rags');
      },
      over(g, b) {
        if (b.stage === 1 || b.stage === 2) {
          const open = b.stage === 2 ? ease(b.st * 2) : 0, h = 40 + open * 150;
          rrect(300, 236 - h / 2, 360, h, 10, '#fff6dc', '#c9a070', 3);
          inkCircle(300, 236, 14, '#f0dcb0', 1.2); inkCircle(660, 236, 14, '#f0dcb0', 1.2);
          if (b.stage === 1) { inkCircle(480, 236, 24, '#d83a4a', 1.4); vecStar(480, 236, 11, '#ffb0b8', 0.8); if (g.tier < 3 && b.st > 3) glowAt(480, 236, 50); }
          else if (open > 0.8) {
            outlined('You are invited to', 480, 186, 22, '#d83a7a', 'center', '#fff');
            outlined('THE ROYAL BALL', 480, 222, 34, '#ffd84a', 'center', '#7a4a2a');
            text('Tonight at the palace!', 480, 260, 20, '#5a2a6e', 'center', 700);
            emoji('👑', 480, 296, 30);
          }
        }
        if (b.stage === 3) {
          b.cards = ITEMS.map((_, i) => ({ x: 114 + i * 124, y: PIC.y + 14, w: 112, h: 78 }));
          b.cards.forEach((r, i) => {
            const dx = b.shake[i] ? Math.sin(b.shake[i] * 50) * 6 : 0, done = b.reqs.indexOf(i) >= 0 && b.reqs.indexOf(i) < b.ri;
            ctx.globalAlpha = done ? 0.35 : 1;
            rrect(r.x + dx, r.y, r.w, r.h, 14, '#fffaf0', '#8a5a9a', 3);
            emoji(ITEMS[i][0], r.x + r.w / 2 + dx, r.y + 32, 34);
            text(ITEMS[i][1], r.x + r.w / 2 + dx, r.y + 64, 14, '#5a2a6e', 'center', 700);
            ctx.globalAlpha = 1;
          });
        } else b.cards = null;
      },
      bot(g, b, f, good) {
        if (b.stage === 0) return { click: [781, 260] };
        if (b.stage === 1 && b.st > 0.8) return { click: [480, 236] };
        if (b.stage === 3 && b.cards && f % 20 === 0) { const want = b.reqs[b.ri], i = !good && b.miss < 2 ? (want + 1) % 6 : want; return { click: [b.cards[i].x + 50, b.cards[i].y + 40] }; }
        return null;
      },
    },
    magic: {
      w: 1.2, page: 'Middle',
      enter(g, b) {
        const T = g.tier - 1, nm = [2, 4, 6][T], nl = [0, 0, 2][T];
        const list = [{ k: 'pumpkin', x: 400, y: 404 }];
        for (let i = 0; i < nm; i++) list.push({ k: 'mouse', x: 532 + i * 28, y: 420, i });
        if (T >= 1) list.push({ k: 'rat', x: 720, y: 420 });
        for (let i = 0; i < nl; i++) list.push({ k: 'lizard', x: 760 + i * 74, y: 418, i });
        list.push({ k: 'dress', x: 190, y: 360 });
        Object.assign(b, { list, ni: 0, miss: 0, nm, nl, spin: -1 });
        list.forEach(o => { o.done = false; o.k2 = 0; });
        g.cap = `Then, with a twinkle, Cinderella's Fairy Godmother appeared! "You SHALL go to the ball!" Use the magic wand, in order: the pumpkin, then the ${nm} mice${T >= 1 ? ', then the rat' : ''}${nl ? ', then the lizards' : ''}, and last of all, Cinderella herself!`;
        g.act = 'Tap with the wand, in order!';
      },
      name: o => ({ pumpkin: 'the pumpkin', mouse: 'a mouse', rat: 'the rat', lizard: 'a lizard', dress: 'Cinderella herself' })[o.k],
      update(g, b, dt) {
        for (const o of b.list) if (o.done) o.k2 = Math.min(1, o.k2 + dt * 1.6);
        if (b.spin >= 0) { b.spin += dt; if (b.spin > 1.3 && g.ph === 'act') g.finish(1 - 0.12 * b.miss, '"Glass slippers, too!" Cinderella was dressed in a gown of gold and silver. "But remember," said her Fairy Godmother, "the magic ends at MIDNIGHT!"'); }
        if (g.ph !== 'act' || !pointer.clicked || !inPic() || b.spin >= 0) return;
        const hitR = o => o.k === 'dress' ? inRect({ x: 150, y: 290, w: 80, h: 130 }) : Math.hypot(pointer.x - o.x, pointer.y - (o.y - 14)) < (o.k === 'pumpkin' ? 46 : 24);
        const o = b.list.find(o => !o.done && hitR(o));
        if (!o) return;
        const next = b.list[b.ni];
        if (o === next || (o.k === next.k && o.k !== 'dress')) {
          // any mouse is fine when a mouse is next (swap so the counting stays in order)
          if (o !== next) { const a = b.list.indexOf(o); [b.list[a], b.list[b.ni]] = [b.list[b.ni], b.list[a]]; }
          o.done = true; b.ni++; SFX.sparkle(); burst(o.x, o.y - 20, 18, { colors: ['#fff6a8', '#ffd84a', '#ffffff', '#c6a2ff'] });
          const cnt = b.list.slice(0, b.ni).filter(q => q.k === o.k).length;
          if (o.k === 'mouse' || o.k === 'lizard') floatText(o.x, o.y - 50, String(cnt), '#fff6a8', false, 26);
          if (o.k === 'dress') { b.spin = 0; SFX.fanfare(); }
          else speak(o.k === 'pumpkin' ? 'Swish! A golden coach!' : o.k === 'mouse' ? (NUM_WORDS[cnt] || String(cnt)) + '! A white horse!' : o.k === 'rat' ? 'A coachman with fine whiskers!' : 'A footman!');
        } else { b.miss++; SFX.miss(); burst(pointer.x, pointer.y, 5, { colors: ['#b8b0c0'] }); say(g, `Fizzle! Not yet. Next, tap ${this.name(next)}.`); }
      },
      draw(g, b, t) {
        SCENES_CN.garden({}, t);
        const T = g.tier - 1, next = b.list[b.ni], glowNext = g.ph === 'act' && next && (T === 0 || (T === 1 && b.miss > 0));
        const by = k => b.list.filter(o => o.k === k);
        const pk = by('pumpkin')[0];
        // horses, hitched in pairs in front of the coach
        by('mouse').forEach((o, i) => { if (o.done) drawPony(560 + Math.floor(i / 2) * 52 + (i % 2) * 14, 398 + (i % 2) * 8, t * 2 + i, 0, 0.36 * ease(o.k2 * 1.4), null, { rider: false, col: '#ffffff', mane: '#ffd84a' }); });
        if (pk.done) coach(440, 418, 0.72, t, ease(pk.k2)); else pumpkin(pk.x, pk.y + 4, 40);
        for (const o of b.list) {
          if (o.done && o.k === 'rat') folk('coachman', 452, 300, 0.3 * ease(o.k2), 1);
          if (o.done && o.k === 'lizard') folk('footman', 340 - o.i * 30, 418, 0.32 * ease(o.k2), 1);
          if (!o.done && o.k === 'mouse') mouse(o.x, o.y, 0.8, -1, t + o.i);
          if (!o.done && o.k === 'rat') rat(o.x, o.y, 0.8, -1, t);
          if (!o.done && o.k === 'lizard') lizard(o.x, o.y, 0.7, -1, t + o.i);
          if (glowNext && !o.done && o.k === next.k && o.k !== 'dress') glowAt(o.x, o.y - 14, o.k === 'pumpkin' ? 70 : 34);
        }
        if (glowNext && next.k === 'dress') glowAt(190, 360, 70);
        const gown = b.spin >= 0.5;
        aubAt(190, FLOOR, b.spin >= 0 && b.spin < 1 ? 'twirl' : 'idle_front', 1, gown ? 'gown' : 'rags', { spin: b.spin >= 0 && b.spin < 1 ? b.spin * TAU * 2 : null });
        if (b.spin >= 0 && b.spin < 1) for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + b.spin * 8; star(190 + Math.cos(a) * 60, 350 + Math.sin(a) * 50, 6, '#fff6a8'); }
        gwen(290, FLOOR + 4, 0.52, -1);
        // the wand follows the pointer
        if (g.ph === 'act' && inPic()) { ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(pointer.x + 26, pointer.y + 40); ctx.lineTo(pointer.x, pointer.y); ctx.stroke(); ctx.strokeStyle = '#f4f0ff'; ctx.lineWidth = 3; ctx.stroke(); vecStar(pointer.x, pointer.y, 11, '#ffe36b', 1); }
      },
      over(g, b) {
        // the spell list, in order
        const parts = [['🎃', 1, 'pumpkin']], T = g.tier - 1;
        parts.push(['🐭', b.nm, 'mouse']); if (T >= 1) parts.push(['🐀', 1, 'rat']); if (b.nl) parts.push(['🦎', b.nl, 'lizard']); parts.push(['👗', 1, 'dress']);
        const w = parts.length * 92, x0 = W / 2 - w / 2 + 120, y = PIC.y + 12;
        rrect(x0 - 8, y, w + 16, 52, 16, 'rgba(255,250,235,.95)', '#c9a8e0', 2);
        parts.forEach(([e, n, k], i) => {
          const x = x0 + i * 92 + 46, done = b.list.filter(o => o.k === k && o.done).length;
          ctx.globalAlpha = done >= n ? 0.4 : 1;
          emoji(e, x - (n > 1 ? 14 : 0), y + 26, 28);
          if (n > 1) text(`${done}/${n}`, x + 20, y + 27, 14, '#5a2a6e', 'center', 800);
          ctx.globalAlpha = 1;
          if (done >= n) text('✓', x + 22, y + 12, 16, '#3a9a5a', 'center', 800);
          if (i < parts.length - 1) text('➜', x + 46, y + 26, 16, '#c9a8e0', 'center', 800);
        });
      },
      bot(g, b, f, good) {
        if (f % 15) return null;
        const next = b.list[b.ni]; if (!next || b.spin >= 0) return null;
        if (!good && b.miss < 2) { const o = b.list[b.list.length - 1]; return { click: [190, 360] }; }
        return next.k === 'dress' ? { click: [190, 360] } : { click: [next.x, next.y - 14] };
      },
    },
    dance: {
      w: 1.2, page: 'Middle',
      enter(g, b) {
        const lens = [[2, 3, 3], [3, 4, 4], [3, 4, 5, 5]][g.tier - 1];
        Object.assign(b, { lens, r: 0, seq: [], mode: 'show', si: 0, mt: 0, miss: 0, wrongHere: 0, pm: null, am: null, ak: 1, pk: 1, sp: [0.95, 0.8, 0.66][g.tier - 1] });
        this.grow(b);
        g.cap = 'At the ball, the prince asked Cinderella to dance! Watch his steps, then copy them: tap the moves, or use the arrow keys.';
        g.act = null;
      },
      grow(b) { while (b.seq.length < b.lens[b.r]) { let m; do m = pick(Object.keys(MOVES)); while (m === b.seq[b.seq.length - 1]); b.seq.push(m); } b.mode = 'show'; b.si = 0; b.mt = -0.6; b.ui = 0; b.wrongHere = 0; },
      update(g, b, dt, id) {
        b.pk = Math.min(1, b.pk + dt / b.sp); b.ak = Math.min(1, b.ak + dt / 0.5);
        if (g.ph !== 'act') return;
        if (b.mode === 'show') {
          b.mt += dt;
          if (b.mt >= 0 && b.pm === null) { b.pm = b.seq[b.si]; b.pk = 0; tone([392, 494, 587, 659][b.si % 4], 0.3, 'triangle', 0.08); }
          if (b.mt >= b.sp) { b.mt = 0; b.pm = null; b.si++; if (b.si >= b.seq.length) { b.mode = 'copy'; b.ui = 0; say(g, 'Your turn!'); } }
          g.act = 'Watch the prince...';
          return;
        }
        g.act = 'Your turn! Copy his steps.';
        let m = null;
        for (const [k, [, , key, num]] of Object.entries(MOVES)) if (pressed[key] || id === 'mv:' + k || pressed[num]) m = k;
        if (!m) return;
        b.am = m; b.ak = 0;
        if (m === b.seq[b.ui]) {
          tone([392, 494, 587, 659][b.ui % 4], 0.3, 'triangle', 0.08); b.ui++;
          if (b.ui >= b.seq.length) {
            SFX.hit(); burst(480, 250, 14);
            b.r++;
            if (b.r >= b.lens.length) g.finish(1 - 0.12 * b.miss, 'They danced and danced, and the prince could not stop smiling. Who was this mysterious princess? Nobody knew!');
            else { floatText(480, 200, 'Lovely!', '#fff6a8', false, 28); this.grow(b); b.mt = -1.2; }
          }
        } else {
          b.miss++; b.wrongHere++; SFX.miss(); say(g, 'Oops! Watch the prince again.');
          b.mode = 'show'; b.si = 0; b.mt = -1; b.pm = null;
        }
      },
      pose(m, k) {
        const s = Math.sin(k * Math.PI);
        return { dx: m === 'L' ? -36 * s : m === 'R' ? 36 * s : 0, spin: m === 'T' && k < 1 ? k * TAU : null, bow: m === 'C' ? s : 0 };
      },
      draw(g, b, t) {
        SCENES_CN.ball({}, t);
        const GYd = 340;
        const pp = this.pose(b.pm, b.pk);
        folk('prince', 590 + pp.dx, GYd, 0.62, -1, { spin: pp.spin, bow: pp.bow, arm: b.pm ? 0.4 : 0 });
        if (b.mode === 'show' && b.pm && g.ph === 'act') bubble(590, 160, `${MOVES[b.pm][0]} ${MOVES[b.pm][1]}!`);
        const ap = this.pose(b.am, b.ak), moving = b.am && b.ak < 1;
        const frame = !moving ? 'idle_front' : b.am === 'T' ? 'twirl' : b.am === 'C' ? (b.ak > 0.2 && b.ak < 0.8 ? 'crouch' : 'idle_front') : 'run2';
        aubAt(370 + ap.dx, GYd, frame, b.am === 'L' ? -1 : 1, 'gown', { spin: b.am === 'T' && moving ? b.ak * TAU : null, s: 0.52 });
        // music notes
        for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i / 3) % 1; ctx.globalAlpha = 1 - k; text('♪', 480 + Math.sin(k * 6 + i) * 30, 260 - k * 100, 22, '#c06ae0', 'center', 800); ctx.globalAlpha = 1; }
        if (b.mode === 'copy' && g.ph === 'act') { for (let i = 0; i < b.seq.length; i++) inkCircle(480 - (b.seq.length - 1) * 12 + i * 24, 206, 7, i < b.ui ? '#5adc7a' : '#ffffff', 1); }
      },
      over(g, b) {
        if (g.ph !== 'act') return;
        const keys4 = Object.keys(MOVES), w = 160, gap = 16, x0 = W / 2 - (4 * w + 3 * gap) / 2, y = PIC.y + PIC.h - 78;
        const hint = b.mode === 'copy' && b.wrongHere >= [1, 2, 99][g.tier - 1] ? b.seq[b.ui] : null;
        keys4.forEach((k, i) => {
          const x = x0 + i * (w + gap);
          if (hint === k) glowAt(x + w / 2, y + 32, 90);
          button('mv:' + k, x, y, w, 64, MOVES[k][1], { icon: MOVES[k][0], color: b.mode === 'copy' ? '#b06ae0' : '#b9aac4', size: 17, on: b.mode === 'copy' });
        });
      },
      bot(g, b, f, good) {
        if (b.mode !== 'copy' || f % 12) return null;
        let m = b.seq[b.ui];
        if (!good && b.miss < 3 && Math.random() < 0.5) m = Object.keys(MOVES).find(k => k !== m);
        return { key: MOVES[m][3] };
      },
    },
    midnight: {
      w: 1.2, page: 'Middle',
      enter(g, b) {
        Object.assign(b, { chimes: 0, timer: 1.6, P: [1.2, 1.05, 0.92][g.tier - 1], step: 0, good: 0, lastChime: 9, hop: 1, slipAt: randInt(7, 9), slipper: null, ring: 0, sub: 'run', wrong: 0, opts: null, shake: {} });
        g.cap = 'Oh no! The clock is striking MIDNIGHT! Run down the stairs: tap (or press SPACE) once for every BONG, and count the chimes!';
        g.act = 'Tap on every BONG!';
      },
      update(g, b, dt, id) {
        b.ring = Math.max(0, b.ring - dt * 1.4); b.hop = Math.min(1, b.hop + dt * 4); b.lastChime += dt;
        for (const k in b.shake) if ((b.shake[k] -= dt) <= 0) delete b.shake[k];
        if (g.ph !== 'act') return;
        if (b.sub === 'run') {
          b.timer -= dt;
          if (b.timer <= 0) {
            if (b.chimes < 12) {
              if (b.step < b.chimes) this.down(g, b);   // she didn't tap: she still runs on
              b.chimes++; b.timer = b.P; b.ring = 1; b.lastChime = 0; bong();
              if (g.tier === 1) floatText(790, 120, String(b.chimes), '#fff6a8', false, 30);
            } else {
              while (b.step < 12) this.down(g, b);
              b.sub = 'count'; b.opts = shuffle([[6, 12, 3], [10, 12, 11], [11, 12, 13]][g.tier - 1]);
              say(g, 'The magic is over! How many times did the clock chime?'); g.cap = g.say; g.act = null;
            }
          }
          if ((pointer.clicked && inPic()) || pressed[' ']) {
            if (b.step < b.chimes) { if (b.lastChime < 0.75) b.good++; this.down(g, b); }
            else floatText(300, 200, 'Wait for the BONG!', '#ffffff', false, 18);
          }
        } else if (b.sub === 'count' && id && id.startsWith('cnt:')) {
          const v = +id.slice(4);
          if (v === 12) { SFX.hit(); g.finish(0.5 * b.good / 12 + 0.5 * (b.wrong === 0 ? 1 : 0.4), 'Twelve! At the twelfth chime, the magic ended. But on the stairs lay one little glass slipper...'); }
          else { b.wrong++; b.shake[v] = 0.5; SFX.miss(); say(g, 'Not quite. At midnight, the clock chimes once for every hour. Midnight is twelve o\'clock!'); }
        }
      },
      down(g, b) {
        b.step++; b.hop = 0; tone(500 + b.step * 30, 0.06, 'triangle', 0.06);
        if (b.step === b.slipAt) { b.slipper = b.step - 1; floatText(stepPos(b.step - 1)[0], stepPos(b.step - 1)[1] - 90, 'Oh! Her slipper!', '#bfe8ff', false, 20); }
      },
      draw(g, b, t) {
        SCENES_CN.stairs({ ring: b.ring, slipper: b.slipper, pumpkin: b.chimes >= 12 && b.timer <= 0 || b.sub === 'count' }, t);
        const [x0, y0] = b.step === 0 ? [96, 236] : stepPos(b.step - 2 + 1);
        const [px, py] = b.step <= 1 ? [96, 236] : stepPos(b.step - 2);
        const k = ease(b.hop), x = lerp(px, x0, k), y = lerp(py, y0, k);
        const over = b.sub === 'count' || g.ph !== 'act';
        aubAt(x, y, b.hop < 1 ? 'run3' : over ? 'idle_front' : 'run1', 1, over ? 'rags' : 'gown', { s: 0.42, lift: Math.sin(k * Math.PI) * 14, slippers: false });
        if (g.tier === 2 && b.sub === 'run') for (let i = 0; i < b.chimes; i++) inkCircle(700 + (i % 6) * 20, 262 + Math.floor(i / 6) * 20, 7, '#ffd84a', 1);
        if (g.tier === 1 && b.chimes > 0 && b.sub === 'run') outlined(`BONG ${b.chimes}!`, 790, 262, 24, '#fff6a8', 'center', '#5a3a7a');
      },
      over(g, b) {
        if (b.sub !== 'count' || g.ph !== 'act') return;
        b.opts.forEach((v, i) => {
          const x = W / 2 - 230 + i * 160 + (b.shake[v] ? Math.sin(b.shake[v] * 50) * 6 : 0);
          button('cnt:' + v, x, 300, 140, 70, String(v), { icon: '🕛', color: '#9a6ae0', size: 28, key: String(i + 1) });
        });
      },
      bot(g, b, f, good) {
        if (b.sub === 'run') return b.step < b.chimes && b.lastChime > 0.1 && (good || Math.random() < 0.02) ? { key: ' ' } : null;
        if (b.sub === 'count' && f % 20 === 0) { const v = good || b.wrong ? 12 : b.opts.find(v => v !== 12); return { key: String(b.opts.indexOf(v) + 1) }; }
        return null;
      },
    },
    fit: {
      w: 1, page: 'End',
      enter(g, b) {
        const L = [[118, 100], [92, 80], [80, 72]][g.tier - 1];
        b.cands = shuffle([{ who: 'sisterA', L: L[0] }, { who: 'sisterB', L: L[1] }, { who: 'aub', L: 64 }]);
        Object.assign(b, { wrong: 0, fly: -1, pick: null, shake: {}, fitT: -1 });
        g.cap = 'The prince\'s herald came to every house with the glass slipper. Whose foot is the right size? Tap the foot the slipper will fit!';
        g.act = 'Tap the right foot!';
      },
      rect: i => ({ x: 170 + i * 220, y: 140, w: 190, h: 270 }),
      update(g, b, dt) {
        for (const k in b.shake) if ((b.shake[k] -= dt) <= 0) delete b.shake[k];
        if (b.fly >= 0) {
          b.fly += dt;
          if (b.fly > 0.6 && b.pick != null && b.fitT < 0) {
            const c = b.cands[b.pick];
            if (c.who === 'aub') { b.fitT = 0; SFX.fanfare(); burst(this.rect(b.pick).x + 95, 360, 24); }
            else { b.wrong++; b.shake[b.pick] = 0.6; SFX.miss(); say(g, `Squeeeeze! That foot is much too BIG for the little slipper.`); b.fly = -1; b.pick = null; }
          }
        }
        if (b.fitT >= 0) { b.fitT += dt; if (b.fitT > 1.4 && g.ph === 'act') g.finish(1 - 0.3 * b.wrong, 'It fit PERFECTLY! Then Cinderella took the OTHER glass slipper out of her pocket. The prince was overjoyed, and they lived happily ever after!'); }
        if (g.ph === 'act' && pointer.clicked && b.fly < 0) {
          const i = b.cands.findIndex((_, i) => inRect(this.rect(i)));
          if (i >= 0) { b.pick = i; b.fly = 0; tone(800, 0.1, 'sine', 0.08); }
        }
      },
      draw(g, b, t) {
        SCENES_CN.hall({ door: 1 }, t);
        folk('herald', 100, FLOOR, 0.6, 1, { arm: 0.5 });
        const showLen = g.tier < 3 || b.wrong > 0;
        b.cands.forEach((c, i) => {
          const r = this.rect(i), cx = r.x + r.w / 2 + (b.shake[i] ? Math.sin(b.shake[i] * 40) * 6 : 0);
          rrect(r.x, r.y, r.w, r.h, 16, 'rgba(255,250,240,.82)', '#c9a8e0', 3);
          if (c.who === 'aub') aubAt(cx, 300, 'idle_front', 1, b.fitT > 0.6 ? 'gown' : 'rags', { s: 0.6, slippers: false });
          else folk(c.who, cx, 300, 0.7, 1, { mouth: b.shake[i] ? 'o' : 'smile' });
          // her bare foot, drawn to size
          const fy = 352, L = c.L, fw = L * 0.36;
          ink(P2(`M${cx - L / 2},${fy} C${cx - L / 2},${fy - fw * 0.6} ${cx - L * 0.1},${fy - fw * 0.55} ${cx + L * 0.2},${fy - fw * 0.5} C${cx + L / 2},${fy - fw * 0.5} ${cx + L / 2},${fy + fw * 0.5} ${cx + L * 0.2},${fy + fw * 0.5} C${cx - L * 0.1},${fy + fw * 0.55} ${cx - L / 2},${fy + fw * 0.6} ${cx - L / 2},${fy} Z`), '#f6d2b8', 1.2);
          for (let k = 0; k < 5; k++) inkCircle(cx + L / 2 + 3 - k * 0.5, fy - fw * 0.42 + k * fw * 0.21, 3.2 - k * 0.3, '#f6d2b8', 0.6);
          if (showLen) { ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(90,140,200,.8)'; ctx.lineWidth = 2; ctx.strokeRect(cx - 32, fy + 22, 64, 10); ctx.restore(); text('slipper', cx, fy + 44, 11, 'rgba(90,140,200,.9)', 'center', 700); }
          if (b.fitT >= 0 && b.pick === i) glassSlipper(cx, fy, 32, 1.4);
        });
        // the slipper on its velvet cushion (or flying to a foot)
        if (b.fitT < 0) {
          const k = b.fly >= 0 ? ease(b.fly / 0.6) : 0, tx = b.pick != null ? this.rect(b.pick).x + 95 : 180, x = lerp(180, tx, k), y = lerp(330, 352, k) - Math.sin(k * Math.PI) * 80;
          if (k < 0.05) inkEllipse(180, 346, 40, 12, 0, '#c03a6a', 1.2);
          glassSlipper(x, y, 32, 1.4); softGlow(x, y, 40, '220,240,255', 0.4);
        }
      },
      bot(g, b, f, good) {
        if (b.fly >= 0 || f % 20) return null;
        const i = !good && b.wrong < 2 ? b.cands.findIndex(c => c.who !== 'aub') : b.cands.findIndex(c => c.who === 'aub');
        const r = this.rect(i); return { click: [r.x + r.w / 2, r.y + 150] };
      },
    },
  };

  // --- "what happens next?" pages ------------------------------------------------------------------
  const Q = {
    fairy: {
      ask: 'The stepsisters went off to the ball. Cinderella sat all alone in the garden, crying. What do you think happens next?',
      opts: [['✨', 'Her Fairy Godmother appears!', true], ['🧹', 'She sweeps the floor all night', false], ['🐉', 'A dragon flies by', false]],
      hint: 'Hmm. Somebody kind and magical is coming to help. Who could it be?',
      after: 'With a twinkle and a sparkle, her Fairy Godmother appeared! "Dry your tears, my dear. You SHALL go to the ball!"',
      draw: t => { SCENES_CN.garden({}, t); aubAt(200, FLOOR, 'crouch', 1, 'rags'); for (let i = 0; i < 2; i++) { const k = (t * 0.8 + i / 2) % 1; ctx.fillStyle = `rgba(140,200,255,${1 - k})`; ellipse(214 + i * 8, 330 + k * 30, 2.5, 4); } },
    },
    rule: {
      ask: '"Have a wonderful time!" says Fairy Godmother Gwen. "But you MUST leave before the clock strikes..." What time?',
      opts: [['🕛', 'Twelve o\'clock, midnight', true], ['🌅', 'Six in the morning', false], ['🍽️', 'Dinner time', false]],
      hint: 'Remember the big clock tower? The magic ends at MIDNIGHT, when it strikes twelve!',
      after: '"...TWELVE! At midnight, your coach turns back into a pumpkin, and your gown turns back into rags!" And off Cinderella went to the ball.',
      draw: t => { SCENES_CN.garden({}, t); coach(470, 418, 0.72, t); for (let i = 0; i < 4; i++) drawPony(600 + Math.floor(i / 2) * 52 + (i % 2) * 14, 398 + (i % 2) * 8, t * 2 + i, 0, 0.36, null, { rider: false, col: '#ffffff', mane: '#ffd84a' }); aubAt(200, FLOOR, 'idle_front', 1, 'gown'); gwen(300, FLOOR + 4, 0.52, -1); },
    },
    slipper: {
      ask: 'The prince found a little glass slipper on the palace stairs. What do you think he will do?',
      opts: [['👠', 'Look for the girl whose foot it fits', true], ['🗑️', 'Throw it away', false], ['🍵', 'Drink tea out of it', false]],
      hint: 'He wants to find the girl he danced with. How could the slipper help?',
      after: 'Yes! The prince sent his herald to every house in the kingdom, to try the slipper on every girl\'s foot.',
      draw: t => { SCENES_CN.stairs({ slipper: null }, t); folk('prince', 420, 375, 0.6, 1, { arm: 0.8, mouth: 'o' }); glassSlipper(452, 280, 16, 1.2, -0.3); softGlow(452, 280, 30, '220,240,255', 0.6); },
    },
    why: {
      ask: 'Think back. WHY did Cinderella run away from the ball at midnight?',
      opts: [['🪄', 'The magic would end at midnight', true], ['😴', 'She was sleepy', false], ['🍰', 'She wanted cake at home', false]],
      hint: 'What did her Fairy Godmother warn her about? What happens at midnight?',
      after: 'That\'s it! The magic only lasted until midnight. That was the CAUSE, and running away was what she did about it.',
      draw: t => { SCENES_CN.stairs({ ring: 0.5 + 0.5 * Math.sin(t * 3), slipper: 7 }, t); aubAt(stepPos(9)[0], stepPos(9)[1], 'run2', 1, 'gown', { s: 0.42, slippers: false }); },
    },
  };
  const QS = [0.3, 0];
  const quizBeat = (key, page) => ({
    w: 1, page, quiz: true,
    enter(g, b) {
      const q = Q[key];
      b.opts = shuffle(q.opts.map(([icon, label, ok]) => ({ icon, label, ok, out: false, shake: 0 })));
      b.wrong = 0; b.q = q;
      g.cap = q.ask; g.act = null;
    },
    update(g, b, dt, id) {
      b.opts.forEach(o => { o.shake = Math.max(0, o.shake - dt); });
      if (g.ph === 'act' && id && id.startsWith('opt:')) {
        const o = b.opts[+id.slice(4)];
        if (o && !o.out) {
          if (o.ok) { SFX.hit(); burst(o.r.x + o.r.w / 2, o.r.y + o.r.h / 2, 18); g.finish(b.wrong === 0 ? 1 : QS[Math.min(1, b.wrong - 1)], b.q.after); }
          else { b.wrong++; o.out = true; o.shake = 0.5; SFX.miss(); say(g, b.q.hint); }
        }
      }
    },
    draw(g, b, t) { b.q.draw(t); },
    over(g, b) {
      if (g.ph !== 'act') return;
      const n = b.opts.length, w = 252, gap = 18, x0 = W / 2 - (n * w + (n - 1) * gap) / 2, y = PIC.y + PIC.h - 112;
      const hintAt = [1, 2, 99][g.tier - 1];
      b.opts.forEach((o, i) => {
        const x = x0 + i * (w + gap) + (o.shake ? Math.sin(o.shake * 50) * 6 : 0);
        o.r = { x, y, w, h: 100 };
        const glow = !o.out && o.ok && b.wrong >= hintAt;
        if (glow) softGlow(x + w / 2, y + 50, 170, '255,240,150', 0.55 + 0.25 * Math.sin(S.t * 6));
        ctx.save(); ctx.globalAlpha = o.out ? 0.45 : 1;
        ctx.shadowColor = 'rgba(60,30,60,.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
        rrect(x, y, w, 100, 16, '#fffaf0', glow ? '#ffc23a' : '#8a5a9a', glow ? 5 : 3);
        ctx.restore();
        ctx.save(); ctx.globalAlpha = o.out ? 0.45 : 1;
        emoji(o.icon, x + 40, y + 50, 40);
        const lines = wrap(o.label, w - 86, 16, 700);
        lines.forEach((l, k) => text(l, x + 74, y + 50 + (k - (lines.length - 1) / 2) * 20, 16, '#4a2a5a', 'left', 700));
        text(String(i + 1), x + w - 14, y + 16, 13, 'rgba(120,90,140,.7)', 'right', 800);
        if (o.out) { ctx.strokeStyle = '#d04a5a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 22, y + 30); ctx.lineTo(x + 58, y + 70); ctx.moveTo(x + 58, y + 30); ctx.lineTo(x + 22, y + 70); ctx.stroke(); }
        ctx.restore();
        if (!o.out) hit(`opt:${i}`, x, y, w, 100, String(i + 1));
      });
    },
    bot(g, b, f, good) { if (f % 20) return null; const i = b.opts.findIndex(o => !o.out && (good || b.wrong >= 1 ? o.ok : !o.ok)); return i >= 0 ? { key: String(i + 1) } : null; },
  });
  BEATS.q_fairy = quizBeat('fairy', 'Middle');
  BEATS.q_rule = quizBeat('rule', 'Middle');
  BEATS.q_slipper = quizBeat('slipper', 'End');
  BEATS.q_why = quizBeat('why', 'End');

  // --- the retell: pictures of Aubrey's own adventure, put in order ---------------------------
  const MOMENTS = {
    chores: { fx: 300, label: 'Sweeping the cinders', draw: t => { SCENES_CN.kitchen({ broom: false }, t); ashPile(300, 410, 0.7, t); aubAt(250, FLOOR, 'idle_front', 1, 'rags'); broom(296, FLOOR, -0.3, 0.8); } },
    magic: { fx: 330, label: 'The Fairy Godmother\'s magic', draw: t => { SCENES_CN.garden({}, t); coach(440, 418, 0.72, t); aubAt(220, FLOOR, 'idle_front', 1, 'gown'); gwen(310, FLOOR + 4, 0.52, -1); } },
    ball: { fx: 480, label: 'Dancing with the prince', draw: t => { SCENES_CN.ball({}, t); folk('prince', 560, 380, 0.7, -1, { arm: 0.4 }); aubAt(400, 380, 'twirl', 1, 'gown', { s: 0.55 }); } },
    midnight: { fx: 520, label: 'BONG! Midnight!', draw: t => { SCENES_CN.stairs({ ring: 0.8, slipper: 6 }, t); aubAt(stepPos(9)[0], stepPos(9)[1], 'run2', 1, 'gown', { s: 0.42, slippers: false }); } },
    fit: { fx: 480, label: 'The slipper fits!', draw: t => { SCENES_CN.hall({ door: 1 }, t); folk('prince', 600, FLOOR, 0.66, -1, { arm: 0.5 }); aubAt(440, FLOOR, 'idle_front', 1, 'gown', { s: 0.56 }); } },
  };
  function drawMoment(id, x, y, w, h) {
    const m = MOMENTS[id], s = h / PIC.h;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
    ctx.translate(x + w / 2 - m.fx * s, y - PIC.y * s); ctx.scale(s, s);
    m.draw(S.t);
    ctx.restore();
  }
  BEATS.retell = {
    w: 2, retell: true, page: 'The End',
    enter(g, b) {
      const ids = g.tier === 1 ? ['chores', 'magic', 'fit'] : g.tier === 2 ? ['chores', 'magic', 'ball', 'fit'] : ['chores', 'magic', 'midnight', 'fit'];
      let order; do { order = shuffle(ids.map((_, i) => i)); } while (order.every((c, i) => c === i));
      Object.assign(b, { ids, order, placed: ids.map(() => false), wrong: 0, wrongHere: 0, drag: null, shake: {}, fly: {} });
      b.labels = ids.length === 3 ? ['First', 'Next', 'Last'] : ['First', 'Next', 'Then', 'Last'];
      g.cap = 'Now YOU tell the story! Drag the pictures of your adventure into order. What happened first, next, and last?';
      g.act = null;
    },
    rects(b) {
      const n = b.ids.length, w = n === 3 ? 236 : 190, h = Math.round(w * 0.63), gap = n === 3 ? 34 : 20, x0 = W / 2 - (n * w + (n - 1) * gap) / 2;
      return { slots: b.ids.map((_, i) => ({ x: x0 + i * (w + gap), y: 112, w, h })), cards: b.ids.map((_, i) => ({ x: x0 + i * (w + gap), y: 300, w, h })) };
    },
    place(g, b, card, slot) {
      const R = this.rects(b);
      if (b.order[card] === slot) {
        b.placed[slot] = true; b.fly[slot] = 0; b.wrongHere = 0; SFX.hit();
        burst(R.slots[slot].x + R.slots[slot].w / 2, R.slots[slot].y + R.slots[slot].h / 2, 14);
        speak(MOMENTS[b.ids[slot]].label);
        if (b.placed.every(Boolean)) { SFX.fanfare(); g.finish(Math.max(0, 1 - 0.25 * b.wrong), 'The end! You told the whole story of Cinderella, in the right order: beginning, middle and end!'); }
      } else {
        b.wrong++; b.wrongHere++; b.shake[card] = 0.45; SFX.miss();
        say(g, slot === 0 ? 'Hmm, did that happen first? Think back to the very beginning.' : 'Hmm, not yet. What happened just after that?');
      }
    },
    update(g, b, dt, id) {
      for (const k in b.shake) if ((b.shake[k] -= dt) <= 0) delete b.shake[k];
      for (const k in b.fly) b.fly[k] += dt;
      if (g.ph !== 'act') return;
      const R = this.rects(b), next = b.placed.indexOf(false);
      const free = c => !b.placed[b.order[c]];
      if (id && id.startsWith('card:')) { const c = +id.slice(5); if (free(c) && !b.drag) this.place(g, b, c, next); return; }
      if (pointer.clicked && !b.drag) { const c = R.cards.findIndex((r, i) => free(i) && inRect(r)); if (c >= 0) b.drag = { c, x0: pointer.x, y0: pointer.y, moved: false }; }
      if (b.drag) {
        if (Math.hypot(pointer.x - b.drag.x0, pointer.y - b.drag.y0) > 10) b.drag.moved = true;
        if (!pointer.down) {
          const d = b.drag; b.drag = null;
          if (!d.moved) this.place(g, b, d.c, next);
          else { const s = R.slots.findIndex(r => inRect(r)); if (s >= 0 && !b.placed[s]) this.place(g, b, d.c, s); }
        }
      }
    },
    over(g, b) {
      const R = this.rects(b), hintAt = [1, 2, 99][g.tier - 1], next = b.placed.indexOf(false);
      outlined('Tell it again!', W / 2, 92, 24, '#ff8ac0', 'center', '#5a2a6e');
      R.slots.forEach((r, i) => {
        rrect(r.x, r.y, r.w, r.h, 12, b.placed[i] ? '#ffffff' : 'rgba(255,240,215,.9)', '#c9a8e0', 3);
        if (!b.placed[i]) { ctx.save(); ctx.setLineDash([8, 6]); rrect(r.x + 8, r.y + 8, r.w - 16, r.h - 16, 8, null, 'rgba(180,140,200,.7)', 2); ctx.restore(); outlined(String(i + 1), r.x + r.w / 2, r.y + r.h / 2, 44, 'rgba(255,255,255,.95)', 'center', '#c9a8e0'); }
        text(b.labels[i], r.x + r.w / 2, r.y + r.h + 18, 17, '#7a4a8a', 'center', 800);
      });
      for (let i = 0; i < R.slots.length - 1; i++) { const a = R.slots[i], c = R.slots[i + 1]; text('➜', (a.x + a.w + c.x) / 2, a.y + a.h / 2, 20, '#c9a8e0', 'center', 800); }
      b.order.forEach((pos, c) => {
        const r = R.cards[c];
        if (b.placed[pos]) {
          const to = R.slots[pos], k = clamp((b.fly[pos] ?? 1) / 0.4, 0, 1), e = k * k * (3 - 2 * k);
          const x = lerp(r.x, to.x, e), y = lerp(r.y, to.y, e) - Math.sin(e * Math.PI) * 30;
          rrect(x - 4, y - 4, to.w + 8, to.h + 8, 14, '#ffc23a');
          drawMoment(b.ids[pos], x, y, to.w, to.h);
          return;
        }
        if (b.drag && b.drag.c === c && b.drag.moved) return;
        const dx = b.shake[c] ? Math.sin(b.shake[c] * 50) * 7 : 0, glow = b.wrongHere >= hintAt && pos === next;
        if (glow) softGlow(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.8, '255,240,150', 0.6 + 0.2 * Math.sin(S.t * 6));
        rrect(r.x + dx - 5, r.y - 5, r.w + 10, r.h + 10, 14, glow ? '#ffc23a' : '#8a5a9a');
        drawMoment(b.ids[pos], r.x + dx, r.y, r.w, r.h);
        text(String(c + 1), r.x + r.w - 6 + dx, r.y + 10, 14, '#ffffff', 'right', 800);
        hit(`card:${c}`, -100, -100, 1, 1, String(c + 1));
      });
      if (b.drag && b.drag.moved) {
        const r = R.cards[b.drag.c], over = R.slots.find(s => inRect(s));
        if (over) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.strokeRect(over.x - 4, over.y - 4, over.w + 8, over.h + 8); ctx.setLineDash([]); }
        rrect(pointer.x - r.w / 2 - 5, pointer.y - r.h / 2 - 5, r.w + 10, r.h + 10, 14, '#ff8ac0');
        drawMoment(b.ids[b.order[b.drag.c]], pointer.x - r.w / 2, pointer.y - r.h / 2, r.w, r.h);
      }
    },
    bot(g, b, f, good) {
      if (f % 20) return null;
      const next = b.placed.indexOf(false); if (next < 0) return null;
      let c = b.order.findIndex(p => p === next);
      if (!good && b.wrong < 2) c = b.order.findIndex(p => !b.placed[p] && p !== next);
      return c >= 0 ? { key: String(c + 1) } : null;
    },
  };

  MG.rk2cinderella = {
    kind: 'learn', title: () => 'Cinderella', icon: () => '👠', beats: BEATS,
    how: () => "Fairy Godmother Gwen's favourite story, and YOU are Cinderella! Act out each page, guess what happens next, then tell the story again in order.",
    init(g) {
      const ids = ['sweep', 'lentils', 'invite', 'q_fairy', 'magic'];
      if (g.tier >= 2) ids.push('q_rule');
      ids.push('dance', 'midnight', 'q_slipper', 'fit');
      if (g.tier >= 3) ids.push('q_why');
      ids.push('retell');
      Object.assign(g, { beats: ids.map(id => ({ id })), bi: -1, ph: 'act', bt: 0, res: [], turn: 1 });
      g.finish = (score, after) => {
        if (g.ph !== 'act') return;
        g.res[g.bi] = clamp(score, 0, 1); g.ph = 'after'; g.bt = 0; g.cap = after; say(g, after); g.act = null;
        MG.rk2cinderella.score(g);
      };
      this.next(g, true);
    },
    start(g) { speak(g.say); },
    next(g, first) {
      if (g.bi + 1 >= g.beats.length) { g.done = true; return; }
      g.bi++;
      const b = g.beats[g.bi], def = BEATS[b.id];
      g.ph = 'act'; g.bt = 0; g.act = null; g.turn = first ? 1 : 0;
      def.enter(g, b);
      g.say = g.cap;
      if (!first) speak(g.say);
      g.progress = `Page ${g.bi + 1} of ${g.beats.length}`;
    },
    score(g) {
      let got = 0, all = 0;
      g.beats.forEach((b, i) => { const w = BEATS[b.id].w; all += w; got += (g.res[i] || 0) * w; });
      g.score = got / all;
    },
    update(g, dt, id) {
      const b = g.beats[g.bi], def = BEATS[b.id];
      g.bt += dt; g.turn = Math.min(1, g.turn + dt / 0.55);
      if (g.turn < 1) return;
      if (id === 'nextpage' && g.ph === 'after') { SFX.pick(); this.next(g); return; }
      def.update(g, b, dt, id);
      this.score(g);
    },
    draw(g) {
      const b = g.beats[g.bi], def = BEATS[b.id], t = S.t;
      drawBook(`${g.bi + 1}`);
      if (!def.retell) {
        picFrame(() => def.draw(g, b, t));
        if (def.page) {
          ctx.font = `800 14px ${FONT}`; const w = ctx.measureText(def.page).width + 28;
          rrect(PIC.x + 10, PIC.y + 10, w, 28, 14, 'rgba(255,250,235,.92)', '#c9a8e0', 2);
          text(def.page, PIC.x + 10 + w / 2, PIC.y + 24, 14, '#8a4a9a', 'center', 800);
        }
      }
      if (def.over) def.over(g, b);
      if (g.act && g.ph === 'act' && !def.retell) {
        ctx.font = `700 18px ${FONT}`; const w = ctx.measureText(g.act).width + 60;
        const y = b.id === 'invite' && b.stage === 3 || b.id === 'magic' ? PIC.y + 72 : PIC.y + 10;
        rrect(W / 2 - w / 2, y, w, 36, 18, 'rgba(48,24,72,.78)');
        text('👆 ' + g.act, W / 2, y + 18, 18, '#fff6a8', 'center', 700);
      }
      caption(g.cap);
      if (g.ph === 'after' && g.bt > 1.2) {
        const last = g.bi === g.beats.length - 1;
        button('nextpage', W - 236, PIC.y + PIC.h - 58, 170, 48, last ? 'The End ★' : 'Next page ▶', { color: '#5fb87a', size: 18, key: 'Enter' });
      }
      if (g.turn < 1) {
        const k = ease(g.turn), x = W / 2 + Math.cos(k * Math.PI) * (W / 2 - 34);
        const L = Math.min(x, W / 2), R = Math.max(x, W / 2);
        const pg = ctx.createLinearGradient(L, 0, R, 0);
        pg.addColorStop(0, '#fff9ea'); pg.addColorStop(1, '#e8d8b4');
        ctx.fillStyle = pg; ctx.fillRect(L, 70, R - L, 452);
        ctx.strokeStyle = 'rgba(120,90,70,.4)'; ctx.lineWidth = 2; ctx.strokeRect(L, 70, R - L, 452);
      }
    },
  };

  restage('swanlake', {
    name: 'The Royal Kingdom', icon: '👑', bg: 'royalkingdom_rk2',
    npc: { name: FRIEND, icon: '🧚' },
    games: [['rk2messenger', 'feather', {}], ['rk2cinderella', 'shell', {}]],
    intro: [
      '*:Flags flutter on a grand castle. A fountain splashes in the town square, and a tall clock tower ticks... tick, tock.',
      "N:Hello, my dear! I'm Fairy Godmother Gwen. The King and Queen are holding a ROYAL BALL tonight!",
      'N:Somebody must deliver the invitations. Hop on the royal pony and find everyone who needs one!',
      'A:excited:A royal messenger? On a pony? Yes please!',
    ],
    mid: [
      'N:Splendid riding! Now, all this talk of balls reminds me of my very favourite story: Cinderella.',
      "N:And today, YOU will be Cinderella! Sweep the cinders, meet a little magic, and dance till midnight. Guess what happens next, then tell it back to me.",
      'A:laughing:A sparkly gown AND glass slippers? I love this story!',
    ],
    outro: [
      'N:And they lived happily ever after! You told it beautifully, beginning, middle and end.',
      'N:Take some feathers from the royal hats, and pearly shells from the palace fountain. Be home before midnight!',
      'A:happy:Thank you, Fairy Godmother Gwen! Bye, Royal Kingdom!',
    ],
  });
}
