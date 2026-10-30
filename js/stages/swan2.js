'use strict';
{
  // ===========================================================================
  // Swan Lake becomes TRIP-TRAP GORGE: a sunny mountain pass with snowy peaks, a rushing river in a
  // rocky gorge, and an old wooden plank bridge across it (a grumpy troll's eyes blink in the shadows
  // underneath). One side of the gorge is a bare, nibbled hill; the other is a lush green meadow.
  // The host is Nanny Gruff, grandma of the famous Billy Goats Gruff, in an alpine hat with an
  // edelweiss, carrying her big storybook.
  //   game 1 (action) Goat Leap: be a sure-footed mountain goat! Pull back and let go to leap up the
  //            crags, ledge by ledge, to ring the bell at the top. Land near the edelweiss to pick it.
  //            Tier 2+: swinging plank ledges. Tier 3: narrower ledges and a shorter aiming guide.
  //   game 2 (learn) The Three Billy Goats Gruff: a storybook Aubrey acts out, playing each Billy Goat
  //            in turn: munch the last grass, trip-trap over the bridge on the beat, trick the Troll,
  //            tiptoe past him while he dozes, then CHARGE as the Big Billy Goat. "What happens next?"
  //            questions before key beats, and a picture retell of her own adventure at the end.
  //            Higher tiers add more pages and give fewer hints.
  // ===========================================================================
  const FRIEND = 'Nanny Gruff';
  const TAU = Math.PI * 2;
  const say = (g, s) => { g.say = s; speak(s); };
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  // outline every shape first, then fill them all, so overlapping parts read as one shape
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
  const circP = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
  // an invisible click target (for things we draw ourselves); keys work like button keys
  const hit = (id, x, y, w, h, key = null) => buttons.push({ id, x, y, w, h, on: true, key });

  // =============================================================================================
  // small shared art: goat horns for Aubrey, story goats, edelweiss, fir trees, the Troll
  // =============================================================================================
  // horn length, horn base width (sprite pixels) and Aubrey's size for each Billy Goat she plays
  const ROLE = { little: [34, 11, 0.44], middle: [46, 13, 0.53], big: [64, 16, 0.64], leap: [34, 11, 0.5] };
  function horn(bx, by, dir, len, bw) {
    const N = 12, L = [], R = [];
    const c = [bx + dir * len * 0.05, by - len * 1.05], e = [bx + dir * len * 0.62, by - len * 0.72];
    for (let i = 0; i <= N; i++) {
      const k = i / N, a = (1 - k) * (1 - k), b = 2 * k * (1 - k), d = k * k;
      const x = a * bx + b * c[0] + d * e[0], y = a * by + b * c[1] + d * e[1];
      const tx = 2 * (1 - k) * (c[0] - bx) + 2 * k * (e[0] - c[0]), ty = 2 * (1 - k) * (c[1] - by) + 2 * k * (e[1] - c[1]);
      const n = Math.hypot(tx, ty) || 1, w = bw * (1 - k * 0.85) / 2;
      L.push([x - ty / n * w, y + tx / n * w]); R.push([x + ty / n * w, y - tx / n * w]);
    }
    const p = new Path2D(); p.moveTo(...L[0]); for (const q of L) p.lineTo(...q); for (const q of R.reverse()) p.lineTo(...q); p.closePath();
    return p;
  }
  function drawGoatGirl(x, gy, frame, facing, role = 'little', lift = 0) {
    const [len, bw, s] = ROLE[role];
    drawAubrey(x, gy, frame, facing, lift, s);
    // her head, measured from the photo (heroHead in js/hero.js), flipped the way drawAubrey flips it
    const im = IMG[frame], hd = heroHead(frame), nat = AUB_NATIVE[frame], fx = nat && facing && nat !== Math.sign(facing) ? -1 : 1;
    const hx = x + (hd.cx - im.width / 2) * s * fx, hy = gy - lift + (hd.top + (hd.cy - hd.top) * 0.55 - im.height) * s, sep = hd.r * s * 0.55;
    // floppy goat ears, then two ridged horns curling outwards
    for (const k of [-1, 1]) inkEllipse(hx + k * sep * 1.75, hy + 6 * s, 10 * s, 4.5 * s, k * 0.5, '#c8925a', 0.9);
    const hl = horn(hx - sep, hy, -1, len * s, bw * s), hr = horn(hx + sep, hy, 1, len * s, bw * s);
    inkAll([[hl, '#f4e2bc'], [hr, '#f4e2bc']], 1.1);
    ctx.strokeStyle = 'rgba(160,120,70,.55)'; ctx.lineWidth = 1.2;
    for (const [k, base] of [[-1, hx - sep], [1, hx + sep]]) for (let i = 1; i < 4; i++) {
      const yy = hy - len * s * 0.22 * i, xx = base + k * len * s * 0.06 * i * i;
      ctx.beginPath(); ctx.moveTo(xx - bw * s * 0.35, yy + 1); ctx.lineTo(xx + bw * s * 0.35, yy - 1); ctx.stroke();
    }
  }
  // a storybook goat (farm-art goat), facing dir
  function drawGoat(x, gy, s, dir = 1, bob = 0) {
    ctx.save(); ctx.translate(x, gy - bob); ctx.scale(dir, 1); drawAnimalArt('goat', 0, 0, s); ctx.restore();
  }
  function edelweiss(x, y, r, glow = false) {
    if (glow) softGlow(x, y, r * 3, '255,250,200', 0.8);
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#4a9a4a'; ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.beginPath(); ctx.moveTo(0, r * 0.4); ctx.lineTo(0, r * 1.6); ctx.stroke();
    const petals = [];
    for (let i = 0; i < 7; i++) { const a = i * TAU / 7 - Math.PI / 2; petals.push([P2(`M0,0 C${Math.cos(a - 0.4) * r * 0.7},${Math.sin(a - 0.4) * r * 0.7} ${Math.cos(a) * r * 1.1},${Math.sin(a) * r * 1.1} ${Math.cos(a) * r * 1.15},${Math.sin(a) * r * 1.15} C${Math.cos(a) * r * 1.1},${Math.sin(a) * r * 1.1} ${Math.cos(a + 0.4) * r * 0.7},${Math.sin(a + 0.4) * r * 0.7} 0,0 Z`), '#ffffff']); }
    inkAll(petals, Math.max(0.6, r * 0.08));
    ctx.fillStyle = '#e8f0e0'; for (let i = 0; i < 7; i++) { const a = i * TAU / 7 - Math.PI / 2; ellipse(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.14, r * 0.3, a + Math.PI / 2); }
    inkCircle(0, 0, r * 0.32, '#ffd84a', Math.max(0.5, r * 0.06));
    ctx.restore();
  }
  function fir(x, gy, h, col = '#3f9a5a') {
    const w = h * 0.42;
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - h * 0.04, gy - h * 0.16, h * 0.08, h * 0.16);
    const p = new Path2D();
    for (let i = 0; i < 3; i++) {
      const top = gy - h + i * h * 0.24, bot = gy - h * 0.12 - (2 - i) * h * 0.18, ww = w * (0.55 + i * 0.25);
      p.moveTo(x, top); p.lineTo(x + ww, bot); p.lineTo(x - ww, bot); p.closePath();
    }
    ink(p, col, Math.max(0.8, h * 0.012));
    ctx.fillStyle = 'rgba(255,255,255,.18)'; tri(x, gy - h + 4, x - w * 0.4, gy - h * 0.62, x - w * 0.1, gy - h * 0.62);
  }
  // the Troll: a big, mossy, grumpy (but not scary) fellow. (x, y) is the bottom of his chest.
  function drawTroll(x, y, s, mood, t, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bob = mood === 'sleep' ? Math.sin(t * 2) * 2 : 0, twitch = mood === 'warn' ? Math.sin(t * 30) * 0.25 : 0;
    const body = P2('M-80,6 C-88,-52 -52,-84 0,-84 C52,-84 88,-52 80,6 Z');
    const head = circP(0, -116 + bob, 56);
    const earL = P2(`M-48,${-128 + bob} L${-96},${-152 + bob - twitch * 40} L-54,${-100 + bob} Z`);
    const earR = P2(`M48,${-128 + bob} L${96},${-152 + bob + twitch * 40} L54,${-100 + bob} Z`);
    inkAll([[earL, '#86cc9a'], [earR, '#86cc9a'], [body, '#5aa878'], [head, '#86cc9a']], 1.8);
    ctx.fillStyle = '#e8a0a8'; tri(-56, -126 + bob, -82, -142 + bob, -58, -110 + bob); tri(56, -126 + bob, 82, -142 + bob, 58, -110 + bob);
    // a patched waistcoat
    ctx.save(); ctx.clip(body); ctx.fillStyle = '#b8743a'; ctx.fillRect(-92, -70, 52, 90); ctx.fillRect(40, -70, 52, 90);
    ctx.fillStyle = '#e0a84a'; ctx.fillRect(-74, -40, 20, 18); ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(-74, -40, 20, 18); ctx.setLineDash([]);
    ctx.restore();
    // mossy freckles and a tuft of orange hair
    ctx.fillStyle = 'rgba(60,130,90,.4)'; for (const [a, b, r] of [[-30, -90, 5], [-38, -104, 3.5], [36, -86, 4], [26, -150, 4]]) circle(a, b + bob, r);
    const tuft = (x, h, lean) => P2(`M${x - 13},${-160 + bob} C${x - 16},${-166 - h * 0.5 + bob} ${x + lean - 6},${-168 - h + bob} ${x + lean},${-170 - h + bob} C${x + lean - 2},${-164 - h * 0.6 + bob} ${x + 14},${-168 + bob} ${x + 13},${-158 + bob} Z`);
    inkAll([[tuft(-20, 16, -16), '#ee8a3a'], [tuft(18, 18, 18), '#ee8a3a'], [tuft(0, 30, 4), '#f49a48']], 1.1);
    // eyes
    const ex = [-24, 28], ey = -128 + bob;
    if (mood === 'sleep') {
      ctx.strokeStyle = OL; ctx.lineWidth = 4; for (const e of ex) { ctx.beginPath(); ctx.arc(e, ey, 9, 0.2, Math.PI - 0.2); ctx.stroke(); }
    } else if (mood === 'dizzy') {
      ctx.strokeStyle = OL; ctx.lineWidth = 3; for (const e of ex) { ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i * 0.5 + t * 6, r = i * 0.5; ctx.lineTo(e + Math.cos(a) * r, ey + Math.sin(a) * r); } ctx.stroke(); }
    } else {
      const big = mood === 'surprise' ? 14 : mood === 'peek' ? 12 : 11, look = mood === 'peek' ? -4 : -3;
      for (const e of ex) { inkCircle(e, ey, big, '#ffffff', 1.2); ctx.fillStyle = '#2a1a3a'; circle(e + look, ey + 1, mood === 'surprise' ? 3.5 : 5.5); ctx.fillStyle = '#fff'; circle(e + look - 1.5, ey - 1.5, 1.6); }
    }
    // bushy brows
    ctx.strokeStyle = '#3a6a4a'; ctx.lineWidth = 7;
    if (mood === 'grumpy') { ctx.beginPath(); ctx.moveTo(-42, -150 + bob); ctx.lineTo(-12, -140 + bob); ctx.moveTo(14, -142 + bob); ctx.lineTo(46, -152 + bob); ctx.stroke(); }
    else if (mood === 'peek' || mood === 'warn') { ctx.beginPath(); ctx.moveTo(-40, -146 + bob); ctx.lineTo(-10, -146 + bob); ctx.moveTo(14, -154 + bob); ctx.quadraticCurveTo(30, -164 + bob, 44, -152 + bob); ctx.stroke(); }
    else if (mood !== 'sleep') { ctx.beginPath(); ctx.moveTo(-40, -152 + bob); ctx.quadraticCurveTo(-24, -160 + bob, -10, -150 + bob); ctx.moveTo(14, -152 + bob); ctx.quadraticCurveTo(30, -162 + bob, 44, -152 + bob); ctx.stroke(); }
    // the big round nose
    inkEllipse(4, -104 + bob, 22, 17, 0, '#a4dcb0', 1.4);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-4, -110 + bob, 7, 4);
    // mouth
    if (mood === 'surprise' || mood === 'roar') {
      inkEllipse(2, -76 + bob, mood === 'roar' ? 22 : 12, mood === 'roar' ? 14 : 12, 0, '#7a2a4a', 1.2);
      if (mood === 'roar') { ctx.fillStyle = '#ffffff'; tri(-14, -88, -6, -88, -10, -80); tri(12, -88, 20, -88, 16, -80); }
    } else if (mood === 'sleep') {
      inkEllipse(4, -78 + bob, 6 + Math.sin(t * 2) * 2, 5 + Math.sin(t * 2) * 2, 0, '#7a2a4a', 1);
    } else if (mood === 'dizzy') {
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(-24 + i * 6, -76 + (i % 2 ? -4 : 4)); ctx.stroke();
    } else {
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-28, -72 + bob); ctx.quadraticCurveTo(2, -88 + bob, 32, -72 + bob); ctx.stroke();
      ink(P2(`M-14,${-81 + bob} L-8,${-94 + bob} L-3,${-83 + bob} Z`), '#ffffff', 0.8);
    }
    ctx.restore();
  }
  function trollHand(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const p = new Path2D();
    for (let i = 0; i < 4; i++) { p.moveTo(-15 + i * 10 + 6, -4); p.arc(-15 + i * 10, -4, 6, 0, TAU); }
    p.moveTo(18, -8); p.ellipse(0, -10, 18, 12, 0, 0, TAU);
    ink(p, '#86cc9a', 1.3);
    ctx.restore();
  }

  // --- Nanny Gruff: an alpine felt hat with an edelweiss and a feather, over two curly horns -------
  CR_HATS.sw2alpine = (r, L, sp, t) => {
    const hl = horn(-r * 0.42, r * 0.35, -1, r * 0.8, r * 0.26), hr = horn(r * 0.42, r * 0.35, 1, r * 0.8, r * 0.26);
    inkAll([[hl, '#f4e2bc'], [hr, '#f4e2bc']], 1, L);
    const brim = P2(`M${-r * 0.82},${r * 0.12} C${-r * 0.5},${-r * 0.06} ${r * 0.5},${-r * 0.06} ${r * 0.82},${r * 0.12} C${r * 0.5},${r * 0.24} ${-r * 0.5},${r * 0.24} ${-r * 0.82},${r * 0.12} Z`);
    const crown = P2(`M${-r * 0.48},${r * 0.06} C${-r * 0.5},${-r * 0.4} ${-r * 0.3},${-r * 0.62} 0,${-r * 0.52} C${r * 0.3},${-r * 0.62} ${r * 0.5},${-r * 0.4} ${r * 0.48},${r * 0.06} Z`);
    inkAll([[brim, '#3f8a5a'], [crown, '#4a9a66']], 1, L);
    ctx.fillStyle = '#d84a4a'; ctx.fillRect(-r * 0.47, -r * 0.08, r * 0.94, r * 0.12);
    // a jaunty feather
    ctx.save(); ctx.rotate(0.5 + Math.sin(t * 2) * 0.05);
    ink(P2(`M${r * 0.3},${-r * 0.1} C${r * 0.4},${-r * 0.7} ${r * 0.6},${-r * 0.95} ${r * 0.7},${-r * 1.0} C${r * 0.62},${-r * 0.6} ${r * 0.5},${-r * 0.3} ${r * 0.36},${-r * 0.06} Z`), '#ffb83a', 0.8, L);
    ctx.restore();
    edelweiss(-r * 0.26, -r * 0.04, r * 0.16);
  };
  CR_HOLD.sw2book = (L, t) => {
    ctx.save(); ctx.rotate(-0.15);
    const open = 0.5 + 0.5 * Math.sin(t * 1.2);
    ink(P2('M-30,-34 L0,-28 L30,-34 L30,4 L0,10 L-30,4 Z'), '#c0404a', 1, L);
    ink(P2('M-27,-31 L0,-25 L0,7 L-27,1 Z'), '#fff8e4', 0.7, L);
    ink(P2(`M27,-31 L0,-25 L0,7 L27,1 Z`), '#fff8e4', 0.7, L);
    ctx.strokeStyle = 'rgba(90,60,110,.4)'; ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-23, -20 + i * 6); ctx.lineTo(-5, -17 + i * 6); ctx.moveTo(5, -17 + i * 6); ctx.lineTo(23, -20 + i * 6); ctx.stroke(); }
    ctx.fillStyle = `rgba(255,240,150,${0.3 + 0.3 * open})`; star(12, -40 - open * 6, 5, '#ffe36b', 4);
    ctx.restore();
  };
  CHARACTERS[FRIEND] = {
    col: '#f4ece0', belly: '#ffffff', face: '#fbf6ee', bw: 40, bh: 66, hr: 38, ears: 'floppy', earCol: '#e8dcc8', earIn: '#ffc8c8',
    nose: 'muzzle', muzzle: '#fff4ea', mouth: 'smile', eyes: 'specs', frames: '#c8903a', eyeSize: 1.15, beard: '#ffffff', beardLen: 0.85,
    hat: 'sw2alpine', hatTilt: -0.05, hold: 'sw2book', shape: 'dress', bodyCol: '#d84a5a', armCol: '#f4ece0', handCol: '#e8dcc8',
    dots: '#ffffff', apron: '#ffffff', feetCol: '#6a5040', bigFeet: true, tail: 'stub', blush: true, seed: 2.7,
  };

  // =============================================================================================
  // BACKDROP: Trip-Trap Gorge
  // =============================================================================================
  const GZ = (() => {
    const r = seeded(4242);
    return {
      flowers: Array.from({ length: 34 }, () => [r() * W, 452 + r() * 82, r()]),
      stones: Array.from({ length: 9 }, (_, i) => [40 + i * 108 + r() * 40, 492 + r() * 30, 10 + r() * 10]),
      tufts: Array.from({ length: 26 }, () => [r() * W, 448 + r() * 88]),
      far: [[-20, 310], [50, 200], [120, 250], [230, 128], [340, 230], [430, 160], [520, 236], [640, 112], [740, 214], [850, 146], [990, 262]],
    };
  })();
  const G_DECK = 296;
  function gorgeBridge() {
    // the old plank bridge over the gorge, with rope rails
    const x0 = 318, x1 = 652, n = 14, pw = (x1 - x0) / n;
    ctx.strokeStyle = 'rgba(70,50,40,.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, G_DECK - 30); ctx.quadraticCurveTo((x0 + x1) / 2, G_DECK - 16, x1, G_DECK - 30); ctx.stroke();
    for (let i = 0; i < n; i++) inkRect(x0 + i * pw, G_DECK - 4 + Math.sin(i / (n - 1) * Math.PI) * 10, pw - 2, 9, i % 2 ? '#c8864a' : '#b8763a', 1, 2);
    ctx.strokeStyle = 'rgba(70,50,40,.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0, G_DECK - 24); ctx.quadraticCurveTo((x0 + x1) / 2, G_DECK - 6, x1, G_DECK - 24); ctx.stroke();
    for (const px of [x0, x1]) { inkRect(px - 5, G_DECK - 36, 10, 46, '#9a6038', 1.2, 3); }
    for (let i = 1; i < 6; i++) { const px = x0 + (x1 - x0) * i / 6, sag = Math.sin(i / 6 * Math.PI) * 11; ctx.strokeStyle = 'rgba(70,50,40,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, G_DECK - 24 + sag * 0.9); ctx.lineTo(px, G_DECK + sag); ctx.stroke(); }
  }
  BACKDROPS.gorge_sw2 = () => {
    const t = S.t;
    // bright alpine sky
    const sk = ctx.createLinearGradient(0, 0, 0, 330);
    sk.addColorStop(0, '#5cb0f2'); sk.addColorStop(0.6, '#a8dcff'); sk.addColorStop(1, '#eaf7ff');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    softGlow(116, 104, 120, '255,246,190', 0.8);
    inkCircle(116, 104, 34, '#ffe46a', 1.5, 'rgba(230,160,40,.8)');
    bdClouds(3, 'rgba(255,255,255,.92)', 96);
    // the far snowy range
    ctx.fillStyle = '#aab6ea'; ctx.beginPath(); ctx.moveTo(-20, 340);
    for (const [x, y] of GZ.far) ctx.lineTo(x, y);
    ctx.lineTo(990, 340); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let i = 1; i < GZ.far.length - 1; i++) {
      const [px, py] = GZ.far[i], [ax, ay] = GZ.far[i - 1], [bx, by] = GZ.far[i + 1];
      if (py > 220) continue;
      const k = 0.32, lx = lerp(px, ax, k), ly = lerp(py, ay, k), rx = lerp(px, bx, k), ry = lerp(py, by, k);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(rx, ry); ctx.lineTo(lerp(px, rx, 0.6), ry - 8); ctx.lineTo(px, ry + 4); ctx.lineTo(lerp(px, lx, 0.6), ly - 6); ctx.lineTo(lx, ly); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(120,140,210,.35)';
    for (let i = 1; i < GZ.far.length - 1; i++) { const [px, py] = GZ.far[i], [bx, by] = GZ.far[i + 1]; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.lineTo(px + 10, 330); ctx.closePath(); ctx.fill(); }
    // a little red cable car gliding between the peaks
    ctx.strokeStyle = 'rgba(60,50,80,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, 150); ctx.quadraticCurveTo(480, 200, 970, 132); ctx.stroke();
    {
      const k = (t * 0.025) % 1, x = -10 + 980 * k, y = (1 - k) * (1 - k) * 150 + 2 * k * (1 - k) * 200 + k * k * 132;
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 12); ctx.stroke();
      inkRect(x - 13, y + 12, 26, 20, '#ff5a5a', 1.2, 5); ctx.fillStyle = '#d8f0ff'; ctx.fillRect(x - 9, y + 16, 8, 7); ctx.fillRect(x + 1, y + 16, 8, 7);
    }
    // an eagle soaring
    { const ex = 600 + Math.cos(t * 0.35) * 150, ey = 128 + Math.sin(t * 0.7) * 16, f = Math.sin(t * 3) * 4; ctx.strokeStyle = '#5a3a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex - 18, ey - 4 + f); ctx.quadraticCurveTo(ex - 8, ey - 8, ex, ey); ctx.quadraticCurveTo(ex + 8, ey - 8, ex + 18, ey - 4 + f); ctx.stroke(); }
    // green alpine slopes (bare and nibbled on the left)
    bdHills('#8fcf72', 300, 18, 0.007, 1.2);
    bdHills('#7cc462', 334, 12, 0.012, 0.3);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 250, 300, 200); ctx.clip();
    const bare = ctx.createLinearGradient(0, 0, 300, 0); bare.addColorStop(0, '#d8b47a'); bare.addColorStop(0.75, '#d0ac74'); bare.addColorStop(1, 'rgba(208,172,116,0)');
    ctx.fillStyle = bare; ctx.beginPath(); ctx.moveTo(0, 460);
    for (let x = 0; x <= 300; x += 10) ctx.lineTo(x, 302 - Math.sin(x * 0.012 + 0.4) * 16);
    ctx.lineTo(300, 460); ctx.fill();
    ctx.strokeStyle = 'rgba(140,100,50,.55)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) { const x = 14 + i * 17, y = 318 + (i * 23) % 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 6); ctx.moveTo(x + 3, y); ctx.lineTo(x + 4, y - 5); ctx.stroke(); }
    ctx.restore();
    // two goats on the bare hill, looking hungrily across the gorge
    drawGoat(120, 330, 0.2, 1, Math.abs(Math.sin(t * 2)) * 1.5);
    drawGoat(205, 318, 0.16, 1);
    // the gorge: rocky walls and the rushing river
    // two jagged rock faces, with the river rushing between them
    const jag = (pts, seed) => { const r = seeded(seed), out = []; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [c, d] = pts[i + 1]; for (let k = 0; k < 4; k++) out.push([lerp(a, c, k / 4) + (r() - 0.5) * 10, lerp(b, d, k / 4) + (r() - 0.5) * 6]); } out.push(pts[pts.length - 1]); return out; };
    const inL = jag([[318, 296], [372, 336], [416, 390], [446, 452]], 7), inR = jag([[652, 296], [600, 334], [556, 390], [526, 452]], 9);
    const poly = pts => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
    const river = poly([...inL, ...[...inR].reverse()]);
    ctx.save(); ctx.clip(river);
    const rv = ctx.createLinearGradient(0, 296, 0, 452); rv.addColorStop(0, '#9adcf0'); rv.addColorStop(1, '#3a9ad8');
    ctx.fillStyle = rv; ctx.fillRect(300, 290, 370, 170);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 12; i++) { const k = ((t * 0.45 + i / 12) % 1), y = 300 + k * 150, x = 485 + Math.sin(i * 2.3) * (20 + k * 40); ctx.beginPath(); ctx.moveTo(x - 10 - k * 8, y); ctx.quadraticCurveTo(x, y - 4, x + 10 + k * 8, y); ctx.stroke(); }
    for (const [bx, by] of [[452, 380], [512, 420]]) { inkEllipse(bx, by, 12, 6, 0, '#a8a0b8', 0.8); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by + 2, 16 + Math.sin(t * 5 + bx) * 2, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.restore();
    const faceL = poly([[250, 300], ...inL, [330, 452], [300, 380]]), faceR = poly([[720, 300], ...inR, [640, 452], [672, 380]]);
    for (const [f, lit] of [[faceL, '#c8ae98'], [faceR, '#b09484']]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.stroke(f);
      const rg = ctx.createLinearGradient(0, 296, 0, 452); rg.addColorStop(0, lit); rg.addColorStop(1, mix(lit, '#5a3a5a', 0.3));
      ctx.fillStyle = rg; ctx.fill(f);
      ctx.save(); ctx.clip(f);
      ctx.strokeStyle = 'rgba(100,70,70,.4)'; ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) { const y = 318 + i * 20; ctx.beginPath(); ctx.moveTo(240, y); ctx.lineTo(740, y + (i % 2 ? 8 : -6)); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.16)'; for (let i = 0; i < 5; i++) { ellipse(300 + i * 26, 318 + i * 24, 16, 6, 0.5); ellipse(680 - i * 26, 318 + i * 24, 16, 6, -0.5); }
      ctx.fillStyle = '#5aae4a'; for (let i = 0; i < 4; i++) { ellipse(285 + i * 30, 330 + i * 26, 7, 3); ellipse(690 - i * 30, 334 + i * 26, 7, 3); }
      ctx.restore();
    }
    // the Troll's little cave in the rock, with two blinking eyes
    ink(P2('M348,366 C348,344 384,344 384,366 Z'), '#2a1a3a', 1); ctx.fillStyle = '#8a7a6a'; for (const [x, y] of [[346, 366], [356, 368], [376, 368], [386, 366]]) circle(x, y, 3.5);
    if ((t % 4.4) > 0.18) { ctx.fillStyle = '#ffe14a'; ellipse(360, 356, 3.2, 4); ellipse(372, 356, 3.2, 4); ctx.fillStyle = '#2a1a2a'; circle(361, 357, 1.6); circle(373, 357, 1.6); }
    else { ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(356, 357); ctx.lineTo(364, 357); ctx.moveTo(368, 357); ctx.lineTo(376, 357); ctx.stroke(); }
    gorgeBridge();
    // a sign on the bridge post
    ctx.save(); ctx.translate(300, 278); ctx.rotate(-0.06); inkRect(-34, -14, 68, 22, '#f2d8a8', 1, 4); text('TRIP-TRAP', 0, -3, 10, '#7a4a2a', 'center', 800); ctx.restore();
    // the chalet on the green side, with flower boxes and chimney smoke
    {
      const cx = 812, gy = 330;
      for (let i = 0; i < 4; i++) { const k = ((t * 0.25 + i / 4) % 1); ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; circle(cx + 34 + Math.sin(k * 6 + i) * 6 + k * 12, gy - 108 - k * 60, 6 + k * 10); }
      inkRect(cx + 28, gy - 100, 12, 26, '#a0604a', 1.2, 2);
      ink(P2(`M${cx - 54},${gy} L${cx - 54},${gy - 48} L${cx + 54},${gy - 48} L${cx + 54},${gy} Z`), '#e8b878', 1.3);
      ctx.strokeStyle = 'rgba(140,80,40,.5)'; ctx.lineWidth = 1.5; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - 54, gy - i * 10); ctx.lineTo(cx + 54, gy - i * 10); ctx.stroke(); }
      ink(P2(`M${cx - 70},${gy - 44} L${cx},${gy - 96} L${cx + 70},${gy - 44} L${cx + 60},${gy - 38} L${cx},${gy - 84} L${cx - 60},${gy - 38} Z`), '#c0503a', 1.3);
      ink(P2(`M${cx - 60},${gy - 38} L${cx},${gy - 84} L${cx + 60},${gy - 38} Z`), '#f4dcb0', 1);
      inkRect(cx - 10, gy - 30, 20, 30, '#8a5030', 1, 3);
      for (const wx of [cx - 38, cx + 22]) { inkRect(wx, gy - 38, 16, 14, '#bfe6ff', 1, 2); inkRect(wx - 3, gy - 22, 22, 6, '#7a4a2a', 1, 2); flower(wx + 3, gy - 25, 3.5, '#ff5f7e', '#ffd84a', 0.6); flower(wx + 13, gy - 25, 3.5, '#ff9ac0', '#ffd84a', 0.6); }
      inkCircle(cx, gy - 60, 7, '#fff4d0', 1);
    }
    // little goats grazing on the green side
    drawGoat(706, 336, 0.17, -1, Math.abs(Math.sin(t * 1.6 + 1)) * 1.2);
    drawGoat(916, 332, 0.15, -1);
    // fir trees at the edges
    for (const [x, gy, h, c] of [[24, 360, 96, '#3f9a5a'], [66, 372, 72, '#4aa866'], [700, 380, 64, '#3f9a5a'], [930, 368, 92, '#3a8c52'], [890, 382, 62, '#4aa866']]) fir(x, gy, h, c);
    // wildflowers on the green side
    for (let i = 0; i < 14; i++) { const x = 660 + (i * 53) % 300, y = 350 + (i * 29) % 80; flower(x, y, 4, ['#ff6fae', '#ffffff', '#ffd84a', '#7a8aff'][i % 4], '#ffd84a', 0.7); }
    // the near ground: an alpine path with flat stones and lots of flowers
    const gg = ctx.createLinearGradient(0, 440, 0, H); gg.addColorStop(0, '#98d870'); gg.addColorStop(1, '#78c058');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, 452);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 446 + Math.sin(x * 0.02) * 4);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 446 + Math.sin(x * 0.02) * 4); ctx.stroke();
    ctx.fillStyle = '#ead9b4'; ctx.beginPath(); ctx.moveTo(0, 494); ctx.quadraticCurveTo(480, 476, W, 496); ctx.lineTo(W, 522); ctx.quadraticCurveTo(480, 504, 0, 522); ctx.fill();
    for (const [x, y, r] of GZ.stones) inkEllipse(x, y, r * 1.6, r * 0.6, 0, '#cfc6d8', 0.9);
    for (const [x, y] of GZ.tufts) { ctx.strokeStyle = '#4f9e40'; ctx.lineWidth = 2; ctx.beginPath(); for (const d of [-4, 0, 4]) { ctx.moveTo(x + d, y); ctx.lineTo(x + d * 1.8, y - 9 - Math.abs(d)); } ctx.stroke(); }
    for (const [x, y, k] of GZ.flowers) {
      if (Math.abs(x - 250) < 50 || Math.abs(x - 720) < 60) continue;
      if (k < 0.3) edelweiss(x, y, 6);
      else if (k < 0.6) { ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, y); ctx.stroke(); ink(P2(`M${x - 5},${y} L${x - 6},${y - 10} L${x - 2},${y - 6} L${x},${y - 12} L${x + 2},${y - 6} L${x + 6},${y - 10} L${x + 5},${y} Z`), '#5a6aff', 0.7); }
      else flower(x, y, 5, k < 0.8 ? '#ff7aa8' : '#ffd84a', '#fff4a8', 0.8);
    }
    // a signpost and a milk churn by the path
    {
      const sx = 884;
      inkRect(sx - 5, 400, 10, 80, '#9a6038', 1.2, 3);
      ctx.save(); ctx.translate(sx, 414); ctx.rotate(-0.05);
      ink(P2('M-52,-14 L40,-14 L56,0 L40,14 L-52,14 Z'), '#f2d8a8', 1.2); text('Bridge', -6, 0, 13, '#7a4a2a', 'center', 800);
      ctx.restore();
      ctx.save(); ctx.translate(sx, 446); ctx.rotate(0.06);
      ink(P2('M52,-12 L-40,-12 L-56,0 L-40,12 L52,12 Z'), '#ffe0a8', 1.2); text('Peaks', 4, 0, 13, '#7a4a2a', 'center', 800);
      ctx.restore();
      const cx = 70, gy = 486;
      ink(P2(`M${cx - 16},${gy} L${cx - 18},${gy - 34} C${cx - 18},${gy - 46} ${cx - 8},${gy - 50} ${cx - 8},${gy - 58} L${cx + 8},${gy - 58} C${cx + 8},${gy - 50} ${cx + 18},${gy - 46} ${cx + 18},${gy - 34} L${cx + 16},${gy} Z`), '#c8d0e0', 1.2);
      inkRect(cx - 11, gy - 64, 22, 8, '#a8b0c8', 1, 3); ctx.fillStyle = '#5ab0e0'; ctx.fillRect(cx - 17, gy - 28, 34, 6);
      // a cowbell hanging off a little post
      inkRect(cx + 40, gy - 50, 6, 50, '#9a6038', 1, 2);
      ctx.save(); ctx.translate(cx + 43, gy - 46); ctx.rotate(Math.sin(t * 2.5) * 0.25);
      ink(P2('M-8,4 L8,4 L11,22 L-11,22 Z'), '#e8b830', 1); inkCircle(0, 23, 3, '#a87820', 0.6);
      ctx.restore();
    }
    // butterflies
    for (let i = 0; i < 2; i++) emoji('🦋', 420 + i * 260 + Math.sin(t * 0.8 + i * 2) * 60, 400 + Math.sin(t * 2.2 + i) * 14, 18);
  };

  // =============================================================================================
  // GAME 1 (action): Goat Leap. Pull back and let go to leap up the crags to the summit bell.
  // =============================================================================================
  const LP = { G: 1500, K: 4.6, VMAX: 980, dy: [100, 108, 114], n: [7, 9, 11], w: [176, 140, 112], time: [75, 70, 65], preview: [1.5, 0.75, 0.42] };
  const rockFace = (() => {
    // deterministic cracks and boulders, tiled every 400px of height
    const r = seeded(99);
    return Array.from({ length: 22 }, () => ({ x: 90 + r() * 780, y: r() * 400, w: 20 + r() * 50, a: r() * 0.6 - 0.3, k: r() }));
  })();
  MG.sw2leap = {
    kind: 'action', title: () => 'Goat Leap', icon: () => '🐐',
    how: g => `Be a mountain goat! Pull back and let go to leap from ledge to ledge, all the way up to the bell. Land near the edelweiss to pick it! (Or use the arrows to aim and SPACE to leap.)`,
    init(g) {
      const T = g.tier - 1, n = LP.n[T], r = Math.random;
      const ledges = [{ x: 480, y: 470, w: 900, ground: true }];
      let x = 300;
      for (let i = 1; i <= n; i++) {
        const top = i === n;
        if (top) x = 480;
        else {
          let nx; do { nx = x + (r() < 0.5 ? -1 : 1) * rand(130, 290); } while (nx < 170 || nx > 790);
          x = nx;
        }
        const move = !top && T >= 1 && i % (T === 1 ? 4 : 3) === 2 ? { amp: T === 1 ? 55 : 75, sp: T === 1 ? 1.1 : 1.5, ph: r() * 6 } : null;
        ledges.push({ x, y: 470 - i * LP.dy[T], w: top ? 300 : LP.w[T] * (move ? 1.1 : 1), move, top, flower: !top && i % 2 === 1 ? { dx: rand(-0.3, 0.3) } : null });
      }
      ledges.forEach(L => { L.cx = L.x; });
      Object.assign(g, {
        ledges, n, p: { x: 300, y: 470, vx: 0, vy: 0, air: false, face: 1 }, on: 0, best: 0, falls: 0, got: 0,
        flowersTotal: ledges.filter(L => L.flower).length, camY: 0, drag: null, kAng: -1.1, kPow: 0.7, kUsed: false,
        timeLeft: LP.time[T], jumps: 0, endT: 0, summit: false, G: LP.G, K: LP.K, VMAX: LP.VMAX,
      });
      g.say = 'Pull back, and let go to leap!';
      g.progress = `Ledge 0 of ${n}`;
    },
    start(g) { speak(g.say); },
    lx(g, L) { return L.move ? L.x + Math.sin(S.t * L.move.sp + L.move.ph) * L.move.amp : L.x; },
    launch(g, vx, vy) {
      const m = Math.hypot(vx, vy);
      if (m > g.VMAX) { vx *= g.VMAX / m; vy *= g.VMAX / m; }
      if (vy > -150) { say(g, 'Pull DOWN and back, then let go to leap UP!'); return; }
      Object.assign(g.p, { vx, vy, air: true, face: vx >= 0 ? 1 : -1 });
      g.jumps++; SFX.jump();
    },
    update(g, dt) {
      const p = g.p;
      for (const L of g.ledges) { const nx = this.lx(g, L); if (!p.air && L === g.ledges[g.on]) p.x += nx - L.cx; L.cx = nx; }
      if (g.summit) { g.endT += dt; if (g.endT > 2) g.done = true; this.score(g); return; }
      g.timeLeft -= dt;
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; this.score(g); return; }
      if (!p.air) {
        // aiming with the pointer: press anywhere, pull back, let go
        if (pointer.clicked && pointer.y > 64) g.drag = { x0: pointer.x, y0: pointer.y };
        if (g.drag && !pointer.down) {
          const dx = g.drag.x0 - pointer.x, dy = g.drag.y0 - pointer.y;
          g.drag = null;
          if (Math.hypot(dx, dy) > 18) this.launch(g, dx * g.K, dy * g.K);
        }
        // or with the keys
        if (keys.arrowleft || keys.a) { g.kAng -= dt * 1.4; g.kUsed = true; }
        if (keys.arrowright || keys.d) { g.kAng += dt * 1.4; g.kUsed = true; }
        if (keys.arrowup || keys.w) { g.kPow += dt * 0.6; g.kUsed = true; }
        if (keys.arrowdown || keys.s) { g.kPow -= dt * 0.6; g.kUsed = true; }
        g.kAng = clamp(g.kAng, -Math.PI + 0.25, -0.25); g.kPow = clamp(g.kPow, 0.35, 1);
        if (pressed[' '] && !g.drag) { g.kUsed = true; this.launch(g, Math.cos(g.kAng) * g.kPow * g.VMAX, Math.sin(g.kAng) * g.kPow * g.VMAX); }
      } else {
        const py = p.y;
        p.vy += g.G * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 34 || p.x > W - 34) { p.x = clamp(p.x, 34, W - 34); p.vx *= -0.4; }
        // pick edelweiss we fly past
        for (const L of g.ledges) if (L.flower && !L.got && Math.hypot(p.x - (L.cx + L.flower.dx * L.w), p.y - 30 - (L.y - 16)) < 40) this.pickFlower(g, L);
        if (p.vy > 0) {
          for (let i = 0; i < g.ledges.length; i++) {
            const L = g.ledges[i];
            if (py <= L.y + 1 && p.y >= L.y && Math.abs(p.x - L.cx) <= L.w / 2 + 8) {
              Object.assign(p, { y: L.y, vx: 0, vy: 0, air: false }); g.on = i; SFX.step(); tone(300, 0.08, 'triangle', 0.08);
              burst(p.x, L.y, 6, { colors: ['#e8dcc8', '#c8b8a0'], spread: 60, up: 30 });
              if (L.flower && !L.got && Math.abs(p.x - (L.cx + L.flower.dx * L.w)) < 44) this.pickFlower(g, L);
              if (i > g.best) { g.best = i; floatText(p.x, L.y - 130, i === g.n ? 'The top!' : ['Hop!', 'Leap!', 'Sure-footed!', 'Up, up!'][i % 4], '#fff6a8', false, 24); }
              if (L.top) { g.summit = true; SFX.fanfare(); [784, 988, 1175, 1568].forEach((f, k) => tone(f, 0.5, 'sine', 0.08, k * 0.18)); say(g, 'Ding dong! You reached the top!'); burst(W / 2, L.y - g.camY - 120, 30); }
              break;
            }
          }
          if (p.air && p.y > g.ledges[g.on].y + 330) {
            // tumbled off: back to the last ledge
            g.falls++; SFX.miss();
            const L = g.ledges[g.on];
            Object.assign(p, { x: L.cx, y: L.y, vx: 0, vy: 0, air: false });
            floatText(p.x, L.y - g.camY - 140, 'Oops! Try again', '#ffd0d0', false, 22);
          }
        }
      }
      // the camera keeps the ledge Aubrey stands on low on the screen, and follows her up when she flies high
      const want = Math.min(0, g.ledges[g.on].y - 410, p.y - 150);
      g.camY = lerp(g.camY, want, Math.min(1, dt * 4));
      g.progress = `Ledge ${g.best} of ${g.n}`;
      this.score(g);
    },
    pickFlower(g, L) {
      L.got = true; g.got++; SFX.sparkle();
      const fx = L.cx + L.flower.dx * L.w;
      burst(fx, L.y - 16 - g.camY, 14); floatText(fx, L.y - 60 - g.camY, 'Edelweiss!', '#ff6fae', false, 22);
    },
    score(g) { g.score = 0.8 * g.best / g.n + 0.2 * (g.flowersTotal ? g.got / g.flowersTotal : 1); },
    // where a leap with this velocity would go (for the dotted guide)
    path(g, vx, vy, secs) {
      const pts = [], m = Math.hypot(vx, vy);
      if (m > g.VMAX) { vx *= g.VMAX / m; vy *= g.VMAX / m; }
      let x = g.p.x, y = g.p.y;
      for (let s = 0; s < secs; s += 1 / 30) {
        const py = y; vy += g.G / 30; x += vx / 30; y += vy / 30;
        pts.push([x, y]);
        if (vy > 0 && g.ledges.some(L => py <= L.y && y >= L.y && Math.abs(x - L.cx) <= L.w / 2 + 8)) break;
      }
      return pts;
    },
    drawLedge(g, L, i) {
      const x = L.cx, y = L.y - g.camY, w = L.w;
      if (y < -60 || y > H + 80) return;
      if (L.ground) {
        const gg = ctx.createLinearGradient(0, y, 0, y + 80); gg.addColorStop(0, '#98d870'); gg.addColorStop(1, '#6ab050');
        ctx.fillStyle = gg; ctx.fillRect(0, y, W, H - y + 100);
        ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        for (let k = 0; k < 10; k++) flower(40 + k * 96, y + 20 + (k % 3) * 14, 5, ['#ff6fae', '#fff', '#ffd84a', '#7a8aff'][k % 4], '#ffd84a', 0.8);
        return;
      }
      if (L.move) {
        // a plank swing hanging on ropes from the crag above
        ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2.5;
        for (const k of [-0.4, 0.4]) { ctx.beginPath(); ctx.moveTo(x + k * w, y); ctx.lineTo(L.x + k * w * 0.4, y - 150); ctx.stroke(); }
        inkRect(x - w / 2, y - 2, w, 14, '#c8864a', 1.3, 5);
        ctx.strokeStyle = 'rgba(120,70,30,.5)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + k * w / 4, y); ctx.lineTo(x - w / 2 + k * w / 4, y + 10); ctx.stroke(); }
      } else {
        // a rocky crag with a grassy top
        const slab = P2(`M${x - w / 2 - 6},${y + 2} C${x - w / 2 - 8},${y + 18} ${x - w * 0.3},${y + 34} ${x - w * 0.1},${y + 42} C${x + w * 0.1},${y + 48} ${x + w * 0.35},${y + 30} ${x + w / 2 + 6},${y + 2} Z`);
        ink(slab, L.top ? '#c8b4a4' : '#bca490', 1.4);
        ctx.fillStyle = 'rgba(90,60,50,.25)'; ellipse(x + w * 0.12, y + 22, w * 0.22, 6, 0.1);
        ink(P2(`M${x - w / 2 - 8},${y + 4} C${x - w / 2 - 6},${y - 6} ${x + w / 2 + 6},${y - 6} ${x + w / 2 + 8},${y + 4} C${x + w / 4},${y + 9} ${x - w / 4},${y + 9} ${x - w / 2 - 8},${y + 4} Z`), '#7ccc5c', 1.2);
        ctx.strokeStyle = '#4f9e40'; ctx.lineWidth = 1.6;
        for (let k = 0; k < 5; k++) { const tx = x - w / 2 + 6 + k * (w - 12) / 4; ctx.beginPath(); ctx.moveTo(tx - 3, y); ctx.lineTo(tx - 4, y - 7); ctx.moveTo(tx + 2, y); ctx.lineTo(tx + 3, y - 6); ctx.stroke(); }
      }
      if (L.flower && !L.got) edelweiss(x + L.flower.dx * w, y - 16 + Math.sin(S.t * 3 + i) * 1.5, 9, true);
      if (L.top) {
        // the summit: a bell on a wooden frame and Nanny Gruff waiting
        const bx = x - 84;
        inkRect(bx - 44, y - 96, 8, 96, '#9a6038', 1.2, 2); inkRect(bx + 36, y - 96, 8, 96, '#9a6038', 1.2, 2); inkRect(bx - 50, y - 104, 100, 12, '#8a5030', 1.2, 4);
        ctx.save(); ctx.translate(bx, y - 92); ctx.rotate(g.summit ? Math.sin(S.t * 14) * 0.5 : Math.sin(S.t * 2) * 0.06);
        ink(P2('M-20,8 C-20,-10 20,-10 20,8 L26,40 L-26,40 Z'), '#ffd23a', 1.4); inkCircle(0, 42, 6, '#c89020', 1);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-8, 6, 4, 10, 0.2);
        ctx.restore();
        ctx.save(); ctx.translate(x - 158, y); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -80); ctx.stroke();
        ink(P2(`M0,-80 L40,${-70 + Math.sin(S.t * 5) * 3} L0,-58 Z`), '#ff5a5a', 1); ctx.restore();
        drawCritter(FRIEND, x + 104, y + 2, 0.55, -1);
      }
    },
    draw(g) {
      const cam = g.camY, t = S.t;
      // the sky deepens as you climb
      const hi = clamp(-cam / 1000, 0, 1);
      const sk = ctx.createLinearGradient(0, 0, 0, H);
      sk.addColorStop(0, mix('#6cbcf6', '#3a7ad8', hi)); sk.addColorStop(1, mix('#d8f0ff', '#a8d4ff', hi));
      ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
      // far snowy peaks drift down slowly as you climb (parallax)
      const py = 300 - cam * 0.12;
      ctx.fillStyle = '#aab6ea'; ctx.beginPath(); ctx.moveTo(-20, py + 300);
      for (const [x, y] of GZ.far) ctx.lineTo(x, py + (y - 300) * 1.2);
      ctx.lineTo(990, py + 300); ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 1; i < GZ.far.length - 1; i++) { const [x, y] = GZ.far[i]; if (y > 220) continue; const yy = py + (y - 300) * 1.2; tri(x, yy, x - 26, yy + 30, x + 26, yy + 30); }
      bdClouds(3, 'rgba(255,255,255,.85)', 120 - cam * 0.3 % 200);
      // the cliff face behind the ledges, scrolling with the climb
      ctx.save();
      const face = new Path2D(); face.moveTo(90, H + 10);
      for (let y = H + 10; y >= -10; y -= 20) face.lineTo(90 + Math.sin((y + cam) * 0.013) * 26 + Math.sin((y + cam) * 0.041) * 8, y);
      for (let y = -10; y <= H + 10; y += 20) face.lineTo(870 + Math.sin((y + cam) * 0.011 + 2) * 26 + Math.sin((y + cam) * 0.037) * 8, y);
      face.closePath();
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(face);
      const fg = ctx.createLinearGradient(90, 0, 870, 0); fg.addColorStop(0, '#c4aa94'); fg.addColorStop(0.5, '#dcc8b4'); fg.addColorStop(1, '#bca08a');
      ctx.fillStyle = fg; ctx.fill(face); ctx.clip(face);
      ctx.fillStyle = 'rgba(160,120,100,.25)';
      for (let k = -1; k < 3; k++) {
        const base = Math.floor(cam / 400) * 400 + k * 400;
        for (const c of rockFace) {
          const y = base + c.y - cam;
          if (y < -40 || y > H + 40) continue;
          if (c.k < 0.5) { ctx.strokeStyle = 'rgba(120,85,70,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x, y); ctx.lineTo(c.x + c.w * 0.4, y + c.w * 0.3); ctx.lineTo(c.x + c.w, y + c.w * 0.2 + c.a * 20); ctx.stroke(); }
          else if (c.k < 0.85) { ctx.fillStyle = 'rgba(150,110,95,.22)'; ellipse(c.x, y, c.w * 0.7, c.w * 0.35, c.a); }
          else { ctx.strokeStyle = '#4f9e40'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const d of [-3, 0, 3]) { ctx.moveTo(c.x + d, y); ctx.lineTo(c.x + d * 2, y - 8); } ctx.stroke(); flower(c.x, y - 9, 3, '#ff9ac0', '#ffd84a', 0.5); }
        }
      }
      ctx.restore();
      g.ledges.forEach((L, i) => this.drawLedge(g, L, i));
      // the aiming guide
      const p = g.p, sy = p.y - cam;
      let aim = null;
      if (!p.air && g.drag && pointer.down) {
        const dx = g.drag.x0 - pointer.x, dy = g.drag.y0 - pointer.y;
        if (Math.hypot(dx, dy) > 6) aim = [dx * g.K, dy * g.K];
        // the rubber band
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4; ctx.setLineDash([2, 8]); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(g.drag.x0, g.drag.y0); ctx.lineTo(pointer.x, pointer.y); ctx.stroke(); ctx.setLineDash([]);
        inkCircle(g.drag.x0, g.drag.y0, 8, '#ffffff', 1); inkCircle(pointer.x, pointer.y, 12, '#ff9ac0', 1.2);
      } else if (!p.air && g.kUsed) aim = [Math.cos(g.kAng) * g.kPow * g.VMAX, Math.sin(g.kAng) * g.kPow * g.VMAX];
      if (aim && aim[1] < -150) {
        const pts = this.path(g, aim[0], aim[1], LP.preview[g.tier - 1]);
        pts.forEach(([x, y], i) => { if (i % 2) return; const a = 1 - i / pts.length * 0.7; ctx.fillStyle = `rgba(255,255,255,${a})`; circle(x, y - cam - 40, 5); ctx.strokeStyle = `rgba(91,63,115,${a * 0.6})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - cam - 40, 5, 0, TAU); ctx.stroke(); });
      }
      // Aubrey the mountain goat
      const frame = p.air ? 'jump' : (aim ? 'crouch' : 'idle_front');
      const dir = p.air ? p.face : aim ? (aim[0] >= 0 ? 1 : -1) : 1;
      drawGoatGirl(p.x, sy + 2, frame, dir, 'leap');
      // a helping hand at the very start
      if (g.jumps === 0 && !g.drag) {
        const k = (t * 0.7) % 1, hx = p.x + 90 - ease(k) * 50, hy = sy - 60 + ease(k) * 70;
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.setLineDash([3, 7]); ctx.beginPath(); ctx.moveTo(p.x + 90, sy - 60); ctx.lineTo(hx, hy); ctx.stroke(); ctx.setLineDash([]);
        emoji('👆', hx + 8, hy + 14, 34);
        rrect(W / 2 - 210, 72, 420, 40, 20, 'rgba(48,24,72,.78)');
        text('Pull back, then let go to leap!', W / 2, 92, 19, '#fff6a8', 'center', 700);
      }
      // the climb meter
      rrect(W - 46, 90, 22, 330, 11, 'rgba(48,24,72,.45)');
      const k = g.best / g.n;
      rrect(W - 46, 90 + 330 * (1 - k), 22, 330 * k, 11, '#7ccc5c');
      emoji('🔔', W - 35, 78, 20); emoji('🐐', W - 35, 90 + 330 * (1 - k), 22);
      text(`🌼 ${g.got}/${g.flowersTotal}`, W - 70, 444, 16, '#ffffff', 'right', 700);
    },
  };

  // =============================================================================================
  // GAME 2 (learn): The Three Billy Goats Gruff, a storybook Aubrey acts out
  // =============================================================================================
  // the story world: a bare hill on the left, the river and plank bridge in the middle, a green meadow on the right
  const DECK = 300, BX0 = 430, BX1 = 1010, PLANK = 29;
  const PIC = { x: 54, y: 82, w: 852, h: 350 };
  const CAM = { hill: 0, bridge: 240, meadow: 640 };
  const hillY = x => 230 + 72 * Math.pow(clamp((x - 80) / 350, 0, 1), 2);
  const meadowY = x => 302 - 44 * Math.pow(clamp((x - 1000) / 420, 0, 1), 0.8);
  const plankX = i => BX0 + (i + 0.5) * PLANK;
  const groundY = x => (x < BX0 ? hillY(x) : x > BX1 ? meadowY(x) : DECK);
  const SW = (() => {
    const r = seeded(2024);
    return {
      flowers: Array.from({ length: 40 }, () => { const x = 1000 + r() * 480; return [x, meadowY(x) + 8 + r() * 120, r()]; }),
      stubble: Array.from({ length: 30 }, () => { const x = -60 + r() * 500; return [x, hillY(x) + 6 + r() * 100]; }),
      rocks: Array.from({ length: 8 }, () => [r() * 420, 330 + r() * 90, 6 + r() * 10]),
    };
  })();
  function storyWorld(st) {
    const t = S.t;
    // a watercolour sky with soft clouds and the mountains far away
    const sk = ctx.createLinearGradient(0, 60, 0, 330); sk.addColorStop(0, '#9ad4f8'); sk.addColorStop(1, '#fff3d6');
    ctx.fillStyle = sk; ctx.fillRect(-200, 0, 1900, 460);
    softGlow(1180, 120, 110, '255,240,170', 0.8); inkCircle(1180, 120, 30, '#ffe46a', 1.2, 'rgba(230,160,40,.7)');
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const [cx, cy] of [[120, 120], [520, 104], [880, 134], [1320, 100]]) { const x = cx + Math.sin(t * 0.2 + cx) * 10; ellipse(x, cy, 50, 16); ellipse(x + 28, cy - 10, 34, 18); ellipse(x - 30, cy + 2, 28, 12); }
    ctx.fillStyle = '#b8c4ee'; ctx.beginPath(); ctx.moveTo(-200, 300);
    for (const [x, y] of [[-100, 190], [80, 250], [240, 150], [420, 240], [600, 170], [780, 250], [960, 160], [1140, 236], [1320, 150], [1500, 230], [1700, 190]]) ctx.lineTo(x, y);
    ctx.lineTo(1700, 300); ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [x, y] of [[240, 150], [600, 170], [960, 160], [1320, 150]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 28, y + 26); ctx.lineTo(x + 12, y + 22); ctx.lineTo(x, y + 30); ctx.lineTo(x - 12, y + 22); ctx.lineTo(x - 28, y + 26); ctx.closePath(); ctx.fill(); }
    // the river
    const rv = ctx.createLinearGradient(0, 330, 0, 450); rv.addColorStop(0, '#8ad4f0'); rv.addColorStop(1, '#3a90d0');
    ctx.fillStyle = rv; ctx.fillRect(400, 330, 640, 130);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 14; i++) { const x = 420 + ((i * 97 + t * 40) % 600), y = 350 + (i * 31) % 80; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y); ctx.stroke(); }
    // the bare, nibbled hill
    const hill = new Path2D(); hill.moveTo(-220, 460); hill.lineTo(-220, hillY(-220));
    for (let x = -200; x <= 450; x += 10) hill.lineTo(x, hillY(x));
    hill.lineTo(470, 340); hill.lineTo(480, 460); hill.closePath();
    ink(hill, '#d8b47a', 1.5);
    ctx.save(); ctx.clip(hill);
    ctx.fillStyle = 'rgba(180,130,70,.25)'; for (const [x, y, r] of SW.rocks) ellipse(x, y, r * 3, r, 0.1);
    ctx.strokeStyle = 'rgba(150,105,55,.6)'; ctx.lineWidth = 1.6;
    for (const [x, y] of SW.stubble) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 6); ctx.moveTo(x + 3, y); ctx.lineTo(x + 4, y - 5); ctx.stroke(); }
    const rk = ctx.createLinearGradient(440, 0, 480, 0); rk.addColorStop(0, 'rgba(150,120,110,0)'); rk.addColorStop(1, 'rgba(150,120,110,.9)'); ctx.fillStyle = rk; ctx.fillRect(420, 290, 60, 170);
    ctx.restore();
    // the lush green meadow
    const mead = new Path2D(); mead.moveTo(990, 460); mead.lineTo(1000, 330); mead.lineTo(1000, meadowY(1000));
    for (let x = 1000; x <= 1720; x += 10) mead.lineTo(x, meadowY(x));
    mead.lineTo(1720, 460); mead.closePath();
    ink(mead, '#86d066', 1.5);
    ctx.save(); ctx.clip(mead);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) ellipse(1060 + i * 90, meadowY(1060 + i * 90) + 30 + (i % 2) * 30, 50, 12);
    for (const [x, y, k] of SW.flowers) { if (k < 0.5) { ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 2; ctx.beginPath(); for (const d of [-3, 0, 3]) { ctx.moveTo(x + d, y); ctx.lineTo(x + d * 2, y - 10); } ctx.stroke(); } else flower(x, y, 4.5, ['#ff6fae', '#ffffff', '#ffd84a', '#c6a2ff'][Math.floor(k * 8) % 4], '#ffd84a', 0.7); }
    ctx.restore();
    fir(1460, meadowY(1460) + 4, 120); fir(1400, meadowY(1400) + 6, 84, '#4aa866'); fir(-120, hillY(-120) + 6, 110, '#7a9a5a');
    // the bridge: stone piers, a shadow, the back rail, then the plank deck
    for (const px of [600, 860]) {
      inkRect(px - 24, DECK + 10, 48, 150, '#c4bcd4', 1.3, 6);
      ctx.strokeStyle = 'rgba(90,70,110,.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(px - 24, DECK + 30 + k * 20); ctx.lineTo(px + 24, DECK + 30 + k * 20); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, 352, 34 + Math.sin(t * 3 + px) * 3, 5, 0, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(40,30,80,.28)'; ctx.fillRect(BX0, DECK + 16, BX1 - BX0, 18);
    // the Troll's eyes in the shadows when he hides under the bridge
    const tr = st.troll;
    if (tr && tr.mode === 'bust' && tr.up < 0.05 && tr.mood !== 'sleep') {
      if ((t % 3.6) > 0.15) { ctx.fillStyle = '#ffe14a'; ellipse(tr.x - 9, DECK + 26, 5, 4); ellipse(tr.x + 9, DECK + 26, 5, 4); ctx.fillStyle = '#2a1a2a'; circle(tr.x - 10, DECK + 26, 2); circle(tr.x + 8, DECK + 26, 2); }
    }
    for (let x = BX0; x <= BX1; x += 116) inkRect(x - 4, DECK - 48, 8, 50, '#9a6038', 1, 2);
    ctx.strokeStyle = '#8a5030'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(BX0, DECK - 42); ctx.lineTo(BX1, DECK - 42); ctx.stroke();
    for (let i = 0; i < (BX1 - BX0) / PLANK; i++) {
      const glow = st.glowPlank === i;
      inkRect(BX0 + i * PLANK + 1, DECK - 5, PLANK - 3, 14, glow ? '#ffe46a' : (i % 2 ? '#c8864a' : '#b8763a'), 1, 3);
      if (!glow) { ctx.fillStyle = 'rgba(90,50,20,.4)'; circle(BX0 + i * PLANK + 6, DECK + 2, 1.4); circle(BX0 + i * PLANK + PLANK - 8, DECK + 2, 1.4); }
    }
    inkRect(BX0 - 6, DECK + 8, BX1 - BX0 + 12, 12, '#8a5a3a', 1.2, 4);
    // clover to munch, grass tufts to nibble
    for (const c of st.tufts || []) if (!c.gone) {
      const gy = c.y ?? hillY(c.x);
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const blades = [[-10, -18], [-4, -26], [2, -30], [8, -24], [13, -16]];
      ctx.beginPath(); for (const [dx, dy] of blades) { ctx.moveTo(c.x + dx * 0.4, gy); ctx.quadraticCurveTo(c.x + dx * 0.8, gy + dy * 0.5, c.x + dx + Math.sin(t * 3 + c.x) * 2, gy + dy); } ctx.stroke();
      ctx.strokeStyle = '#5ac84a'; ctx.lineWidth = 3; ctx.stroke();
      if (c.hint) softGlow(c.x, gy - 14, 34, '255,250,190', 0.45 + 0.25 * Math.sin(t * 6));
    }
    for (const c of st.clovers || []) if (!c.gone) {
      const pop = ease(c.age * 3);
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(pop, pop);
      ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
      for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * 0.9; heart(Math.cos(a) * 9, -22 + Math.sin(a) * 9 + 6, 14, '#5ac84a'); }
      inkCircle(0, -34, 9, '#ff9ac8', 1); ctx.fillStyle = '#ffd0e8'; circle(-2, -36, 3);
      ctx.restore();
    }
    // the actors: goats, Aubrey, then the front rail and the Troll
    for (const gt of st.goats || []) drawGoat(gt.x, gt.y ?? groundY(gt.x), gt.s, gt.dir ?? 1, gt.bob || 0);
    const a = st.aub;
    if (a) drawGoatGirl(a.x, (a.y ?? groundY(a.x)) + 2, a.frame || 'idle_front', a.facing ?? 1, a.role || 'little', a.lift || 0);
    ctx.strokeStyle = '#8a5030'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(BX0, DECK - 22); ctx.lineTo(BX1, DECK - 22); ctx.stroke();
    for (let x = BX0 + 58; x <= BX1; x += 116) inkRect(x - 3, DECK - 26, 6, 30, '#a86a40', 0.9, 2);
    if (tr) {
      if (tr.mode === 'bust' && tr.up > 0.01) {
        const s = 0.82, y = DECK + 25 + (1 - ease(tr.up)) * 190;
        ctx.save(); ctx.beginPath(); ctx.rect(tr.x - 200, 0, 400, DECK + 12); ctx.clip();
        drawTroll(tr.x, y, s, tr.mood, t);
        ctx.restore();
        if (tr.up > 0.5) { trollHand(tr.x - 66, DECK + 10, 0.9); trollHand(tr.x + 66, DECK + 10, 0.9); }
      } else if (tr.mode === 'fly') drawTroll(tr.fx, tr.fy, 0.7, 'surprise', t, tr.rot);
      else if (tr.mode === 'float') {
        const x = tr.fx, y = 400 + Math.sin(t * 2.5) * 3;
        ctx.save(); ctx.beginPath(); ctx.rect(x - 150, 0, 300, y + 18); ctx.clip(); drawTroll(x, y + 60, 0.5, 'dizzy', t, Math.sin(t * 2) * 0.1); ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; for (let k = 0; k < 2; k++) { const q = (t * 0.8 + k * 0.5) % 1; ctx.beginPath(); ctx.ellipse(x, y + 18, 40 + q * 40, 6 + q * 6, 0, 0, TAU); ctx.stroke(); }
      }
      if (tr.zzz) for (let k = 0; k < 3; k++) { const q = (t * 0.5 + k / 3) % 1; ctx.globalAlpha = Math.min(1, (1 - q) * 1.6); outlined('Z', tr.x + 30 + q * 50 + Math.sin(q * 8) * 8, DECK - 30 - q * 90, 22 + q * 18, '#ffffff', 'center', '#5a4a9a'); ctx.globalAlpha = 1; }
      if (tr.say) bubble(tr.x + (tr.sayDx || 0), DECK - 160, tr.say);
    }
    for (const f of st.fx || []) f(t);
  }
  const bubble = (x, y, str, col = '#3a5a3a', size = 17) => {
    ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(str).width + 26, h = size + 19;
    const bx = x;
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(bx - w / 2 - 2.5, y - h / 2 - 2.5, w + 5, h + 5, 20); ctx.fill(); tri(x - 10, y + h / 2 - 2, x + 10, y + h / 2 - 2, x + 2, y + h / 2 + 14);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(bx - w / 2, y - h / 2, w, h, 18); ctx.fill(); tri(x - 7, y + h / 2 - 4, x + 7, y + h / 2 - 4, x + 2, y + h / 2 + 10);
    text(str, bx, y, size, col, 'center', 700);
  };

  // --- the open storybook ---------------------------------------------------------------------
  function drawBook(pageL, pageR) {
    ctx.fillStyle = 'rgba(40,20,50,.35)'; ctx.fillRect(0, 0, W, H);
    rrect(18, 64, W - 36, 468, 18, '#8a3a4a');
    ctx.strokeStyle = 'rgba(255,220,160,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(26, 72, W - 52, 452, 14); ctx.stroke();
    // stacked page edges
    for (let i = 3; i >= 0; i--) { ctx.fillStyle = i % 2 ? '#efe2c0' : '#f8eed4'; ctx.beginPath(); ctx.roundRect(30 + i, 70 + i, W - 60 - i * 2, 456 - i, 10); ctx.fill(); }
    const pg = ctx.createLinearGradient(30, 0, W - 30, 0);
    pg.addColorStop(0, '#f6ead0'); pg.addColorStop(0.46, '#fff9ea'); pg.addColorStop(0.5, '#e8d8b4'); pg.addColorStop(0.54, '#fff9ea'); pg.addColorStop(1, '#f6ead0');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(34, 70, W - 68, 452, 10); ctx.fill();
    ctx.fillStyle = 'rgba(160,120,80,.08)'; for (let i = 0; i < 8; i++) ellipse(100 + i * 110, 470 + (i % 3) * 14, 50, 16, 0.2);
    if (pageL) text(pageL, 60, 510, 12, 'rgba(120,90,70,.7)', 'left', 600);
    if (pageR) text(pageR, W - 44, 512, 12, 'rgba(120,90,70,.7)', 'right', 600);
  }
  function picFrame(draw) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(PIC.x, PIC.y, PIC.w, PIC.h, 14); ctx.clip();
    draw();
    // a soft watercolour edge and the book's crease
    const v = ctx.createRadialGradient(W / 2, PIC.y + PIC.h / 2, PIC.h * 0.45, W / 2, PIC.y + PIC.h / 2, PIC.w * 0.62);
    v.addColorStop(0, 'rgba(255,248,230,0)'); v.addColorStop(1, 'rgba(255,248,230,.55)');
    ctx.fillStyle = v; ctx.fillRect(PIC.x, PIC.y, PIC.w, PIC.h);
    const cr = ctx.createLinearGradient(W / 2 - 22, 0, W / 2 + 22, 0);
    cr.addColorStop(0, 'rgba(120,80,40,0)'); cr.addColorStop(0.5, 'rgba(120,80,40,.22)'); cr.addColorStop(1, 'rgba(120,80,40,0)');
    ctx.fillStyle = cr; ctx.fillRect(W / 2 - 22, PIC.y, 44, PIC.h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(91,63,115,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(PIC.x, PIC.y, PIC.w, PIC.h, 14); ctx.stroke();
  }
  function caption(str) {
    let size = 19, lines = wrap(str, 812, size, 600);
    if (lines.length > 3) { size = 16.5; lines = wrap(str, 830, size, 600); }
    const lh = size * 1.3, y0 = 476 - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => text(l, W / 2, y0 + i * lh, size, '#4a2a5a', 'center', 600));
  }
  // retell thumbnails: the same story world, posed at one moment of Aubrey's adventure
  const MOMENTS = {
    hill: { fx: 230, label: 'All the grass is gone', st: () => ({ aub: { x: 300, frame: 'crouch', role: 'little' }, goats: [{ x: 110, s: 0.55 }, { x: 190, s: 0.42 }], troll: null }) },
    troll: { fx: 720, label: 'The Troll pops up', st: () => ({ aub: { x: 650, role: 'little', frame: 'idle_front' }, troll: { mode: 'bust', x: 780, up: 1, mood: 'roar' } }) },
    splash: { fx: 770, label: 'BUMP! SPLASH!', st: () => ({ aub: { x: 690, role: 'big', frame: 'run3' }, troll: { mode: 'fly', fx: 860, fy: 300, rot: 0.8 } }) },
    feast: { fx: 1180, label: 'Green grass at last', st: () => ({ aub: { x: 1090, role: 'little', frame: 'crouch' }, goats: [{ x: 1200, s: 0.42, dir: -1 }, { x: 1300, s: 0.55, dir: -1 }], clovers: [{ x: 1150, y: 360, age: 1 }, { x: 1240, y: 390, age: 1 }] }) },
  };
  function drawMoment(id, x, y, w, h) {
    const m = MOMENTS[id], s = w / 520;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
    ctx.translate(x - (m.fx - 260) * s, y - 110 * s); ctx.scale(s, s);
    storyWorld(m.st());
    if (id === 'splash') { ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 0; k < 7; k++) ellipse(900 + Math.cos(k) * 40, 360 - Math.abs(Math.sin(k * 1.7)) * 40, 8, 14, k); }
    ctx.restore();
  }

  // --- the pages of the story --------------------------------------------------------------------
  const Q = {
    go: {
      ask: 'Across the river, the grass is green and sweet. But to get there, you must cross a bridge. What should the goats do next?',
      opts: [['🌉', 'Cross the bridge to the green grass', true], ['🪨', 'Eat the rocks for dinner', false], ['😴', 'Go to sleep hungry', false]],
      hint: 'Hmm, would that fill their hungry tummies? Look at the green grass!',
      after: 'Yes! Their tummies were empty, SO they set off for the bridge. But under that bridge lived a grumpy old Troll...',
    },
    trick: {
      ask: '"I\'m going to GOBBLE you up!" roars the Troll. The Little Billy Goat must think fast. What should {she|he} say?',
      opts: [['🐐', '"Wait for my brother. He\'s much BIGGER!"', true], ['🍽️', '"Yes please, gobble me up!"', false], ['🐄', '"Moo! I\'m a cow!"', false]],
      hint: 'Hmm, would that keep the Little Billy Goat safe? Think about {her|his} big brothers!',
      after: '"Bigger, eh?" grumbled the Troll. "Then off you go!" And the Little Billy Goat trip-trapped over to the green grass.',
    },
    middle: {
      ask: '"WHO\'S that trip-trapping over MY bridge?" What will the Middle Billy Goat say to the Troll?',
      opts: [['🐐', '"Wait for my big brother. He\'s the BIGGEST!"', true], ['🫖', '"Let\'s have a tea party!"', false], ['🏠', '"I\'ll go home now."', false]],
      hint: 'Remember what the Little Billy Goat said? It worked!',
      after: '"Hmph! Then off you go!" said the Troll. And the Middle Billy Goat trotted over to the green grass too.',
    },
    predict: {
      ask: 'Here comes the BIG Billy Goat Gruff. STOMP, STOMP! He is very big and very strong. What do you think will happen next?',
      opts: [['💦', 'He bumps the Troll into the river', true], ['😋', 'The Troll gobbles him up', false], ['🏃', 'He runs away home', false]],
      hint: 'He is the BIGGEST, strongest goat of all. What could he do to the Troll?',
      after: "Let's find out! Turn the page...",
    },
    why: {
      ask: 'Think back to the beginning. WHY did the Billy Goats cross the bridge?',
      opts: [['🌾', 'All the grass on their hill was gone', true], ['🧌', 'The Troll asked them to come', false], ['🛁', 'They wanted a bath', false]],
      hint: 'Look back at the first page. What was on their hill?',
      after: "That's it! No grass on their hill was the CAUSE. Crossing the bridge was what they did about it.",
    },
  };
  const QS = [0.3, 0];   // the score for a question after one wrong try, then after more
  // who stands where: the goats Aubrey isn't playing right now are drawn as storybook goats
  const SIZE = { little: 0.36, middle: 0.45, big: 0.56 };
  const BEATS = {
    munch: {
      w: 0.5, cam: 'hill', page: 'Beginning',
      enter(g, b) {
        const xs = g.tier === 1 ? [300, 345, 385, 425] : [270, 310, 350, 390, 428];
        b.tufts = xs.map(x => ({ x, gone: false }));
        b.ax = 220; b.tx = null; b.eat = 0; b.miss = 0;
        g.cap = 'Once upon a time, three Billy Goats Gruff lived on a hill: a little one, a middle one and a BIG one. Aubrey is the Little Billy Goat! Tap the grass to munch it.';
        g.act = 'Tap the grass!';
      },
      update(g, b, dt) {
        if (g.ph === 'act') {
          if (pointer.clicked && b.tx == null) {
            const wx = pointer.x - PIC.x + CAM.hill;
            const tuft = b.tufts.filter(c => !c.gone).sort((a, c) => Math.abs(a.x - wx) - Math.abs(c.x - wx))[0];
            if (tuft && Math.abs(tuft.x - wx) < 60 && pointer.y > PIC.y + 120 && pointer.y < PIC.y + PIC.h) { b.tx = tuft; SFX.click(); }
            else if (inRect(PIC)) { b.miss++; SFX.blip(); }
          }
          if (b.tx) {
            const goal = b.tx.x - 26, d = goal - b.ax;
            if (Math.abs(d) > 3) b.ax += Math.sign(d) * Math.min(Math.abs(d), 220 * dt);
            else {
              b.eat += dt;
              if (b.eat > 0.5) {
                b.tx.gone = true; b.eat = 0; b.tx = null; SFX.pop(); tone(200, 0.1, 'triangle', 0.08);
                floatText(PIC.x + b.ax + 26 - CAM.hill, hillY(b.ax) - 40, 'munch!', '#7a4a2a', false, 22);
                if (b.tufts.every(c => c.gone)) g.finish(1 - 0.12 * b.miss, 'Munch, munch... now the grass is all gone! And the three goats are still hungry.');
              }
            }
          }
        }
        b.tufts.forEach(c => { c.hint = g.ph === 'act' && g.bt > 4 && !b.tx; });
        const walking = b.tx && Math.abs(b.tx.x - 26 - b.ax) > 3;
        g.st = {
          aub: { x: b.ax, role: 'little', frame: walking ? `run${1 + Math.floor(S.t * 10) % 5}` : (b.eat > 0 ? 'crouch' : 'idle_front'), facing: 1 },
          goats: [{ x: 70, s: SIZE.big, bob: 0 }, { x: 150 + Math.sin(S.t) * 4, s: SIZE.middle }], tufts: b.tufts, troll: null,
        };
      },
      bot(g, b) { const c = b.tufts.find(c => !c.gone); return c ? [PIC.x + c.x - CAM.hill, hillY(c.x) - 14] : null; },
    },
    triptrap: {
      w: 1, cam: 'bridge', page: 'Middle',
      enter(g, b) {
        Object.assign(b, { step: 0, need: 8, ring: 0, good: 0, miss: 0, hop: 1, per: [1.0, 0.85, 0.72][g.tier - 1], win: [0.2, 0.15, 0.11][g.tier - 1], pop: 0 });
        g.cap = 'Trip, trap! Trip, trap! The Little Billy Goat crosses first. Tap when the ring shrinks onto the glowing plank!';
        g.act = 'Tap on the beat!';
      },
      update(g, b, dt) {
        b.hop = Math.min(1, b.hop + dt * 4);
        if (g.ph === 'act' && b.step < b.need) {
          b.ring += dt / b.per;
          const tap = pressed[' '] || (pointer.clicked && inRect(PIC));
          if (tap) {
            const good = Math.abs(b.ring - 1) <= b.win;
            if (good) { b.good++; tone(b.step % 2 ? 330 : 262, 0.12, 'triangle', 0.12); floatText(PIC.x + plankX(b.step + 1) - CAM.bridge, DECK - 120, b.step % 2 ? 'trap!' : 'trip!', '#fff6a8', false, 24); }
            else { b.miss++; SFX.miss(); floatText(PIC.x + plankX(b.step + 1) - CAM.bridge, DECK - 120, 'wobble!', '#ffd0d0', false, 20); }
            b.step++; b.hop = 0; b.ring = 0;
            if (b.step >= b.need) {
              b.pop = 0.001; SFX.alert(); tone(110, 0.5, 'sawtooth', 0.06, 0.1, 80);
              g.finish(b.good / Math.max(1, b.good + b.miss), 'Up popped the Troll! "WHO\'S that trip-trapping over MY bridge?"');
            }
          } else if (b.ring > 1 + b.win) b.ring = 0;
        }
        if (b.pop > 0) b.pop = Math.min(1, b.pop + dt * 2.5);
        const x = lerp(plankX(b.step - 1), plankX(b.step), ease(b.hop * 1.2)) - (b.step === 0 ? 30 : 0);
        g.st = {
          aub: { x: b.step === 0 ? BX0 - 20 : x, role: 'little', frame: b.hop < 1 ? 'jump' : 'idle_front', lift: Math.sin(Math.min(1, b.hop) * Math.PI) * 18, facing: 1 },
          goats: [{ x: 262, s: SIZE.big }, { x: 340, s: SIZE.middle }],
          troll: { mode: 'bust', x: 790, up: b.pop, mood: b.pop > 0 ? 'roar' : 'grumpy', say: b.pop > 0.6 ? "WHO'S THAT?" : null },
          glowPlank: g.ph === 'act' && b.step < b.need ? b.step + 1 : null,
          fx: g.ph === 'act' && b.step < b.need ? [() => {
            const cx = plankX(b.step + 1), cy = DECK + 2, k = clamp(b.ring, 0, 1.3), r = 12 + Math.max(0, 1 - k) * 70;
            const on = Math.abs(b.ring - 1) <= b.win;
            ctx.strokeStyle = on ? '#5adc7a' : 'rgba(255,255,255,.95)'; ctx.lineWidth = on ? 6 : 4;
            ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.45, 0, 0, TAU); ctx.stroke();
            ctx.strokeStyle = 'rgba(91,63,115,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 12, 5.4, 0, 0, TAU); ctx.stroke();
          }] : [],
        };
      },
      botReady(g, b) { return Math.abs(b.ring - 1) < b.win * 0.5; },
    },
    sneak: {
      w: 1, cam: 'bridge', page: 'Middle',
      enter(g, b) {
        Object.assign(b, { x: BX0 + 10, goal: 690, ts: 'snore', tt: rand(1.8, 2.6), caught: 0, grace: 0, up: 0, pop: 0, walkT: 0 });
        g.cap = 'Costume change! Now Aubrey is the Middle Billy Goat. The Troll is snoozing under the bridge. HOLD to tiptoe across, and FREEZE when he peeks!';
        g.act = 'Hold to tiptoe. Freeze when he peeks!';
      },
      update(g, b, dt) {
        const T = g.tier - 1;
        if (g.ph === 'act') {
          b.tt -= dt;
          if (b.tt <= 0) {
            if (b.ts === 'snore') { b.ts = 'warn'; b.tt = [0.9, 0.7, 0.5][T]; tone(660, 0.1, 'square', 0.04); }
            else if (b.ts === 'warn') { b.ts = 'peek'; b.tt = rand(1.2, 1.8); }
            else { b.ts = 'snore'; b.tt = T === 2 ? rand(1.3, 2.4) : rand(1.7, 2.8); }
          }
          b.grace = Math.max(0, b.grace - dt);
          const hold = (pointer.down && inRect(PIC)) || keys[' '];
          if (hold && b.grace <= 0) {
            if (b.ts === 'peek') {
              b.caught++; b.grace = 1.1; b.x = Math.max(BX0 + 10, b.x - 80); SFX.miss();
              floatText(PIC.x + b.x - CAM.bridge, DECK - 130, 'Spotted! Back you go', '#ffd0d0', false, 20);
              if (b.caught >= 4) { b.ts = 'snore'; b.tt = 2.2; }
            } else { b.x += 62 * dt; b.walkT += dt; if (Math.floor(b.walkT * 4) !== Math.floor((b.walkT - dt) * 4)) tone(900, 0.03, 'sine', 0.03); }
          }
          if (b.x >= b.goal) {
            b.pop = 0.001; SFX.alert();
            g.finish(Math.max(0, 1 - 0.34 * b.caught), g.tier >= 3
              ? 'But the Troll woke up anyway! "WHO\'S that trip-trapping over MY bridge?"'
              : 'But the Troll woke up! "WHO\'S that?" "Wait for my big brother," said the Middle Billy Goat. "He\'s the BIGGEST!" "Hmph, off you go then!"');
          }
        }
        if (b.pop > 0) b.pop = Math.min(1, b.pop + dt * 2.5);
        if (g.ph === 'after' && g.tier < 3 && g.bt > 2.5) b.x = Math.min(1150, b.x + 140 * dt);
        const sink = g.ph === 'after' && g.tier < 3 && g.bt > 2.2;
        b.up = lerp(b.up, sink ? 0 : b.pop > 0 ? b.pop : b.ts === 'peek' ? 0.42 : b.ts === 'warn' ? 0.2 : 0.14 + Math.sin(S.t * 2) * 0.015, Math.min(1, dt * 8));
        const moving = g.ph === 'act' && ((pointer.down && inRect(PIC)) || keys[' ']) && b.grace <= 0 && b.ts !== 'peek';
        const crossing = g.ph === 'after' && b.x < 1150 && g.tier < 3 && g.bt > 2.5;
        g.st = {
          aub: { x: b.x, role: 'middle', frame: moving || crossing ? `run${1 + Math.floor(S.t * (crossing ? 10 : 5)) % 5}` : (b.grace > 0 ? 'crouch' : 'idle_front'), facing: 1 },
          goats: [{ x: 300, s: SIZE.big }, { x: 1060, s: SIZE.little, dir: -1 }],
          troll: { mode: 'bust', x: 790, up: b.up, mood: b.pop > 0 ? 'roar' : b.ts === 'snore' ? 'sleep' : b.ts === 'warn' ? 'warn' : 'peek', zzz: g.ph === 'act' && b.ts === 'snore', say: b.pop > 0.6 && g.bt < 2.5 ? "WHO'S THAT?" : (g.ph === 'act' && b.ts === 'warn' ? '...snort?' : null) },
          fx: g.ph === 'act' && b.ts === 'peek' ? [() => { outlined('FREEZE!', 790, DECK - 150, 30, '#ff6f6f', 'center', '#fff'); }] : [],
        };
      },
    },
    charge: {
      w: 1, cam: 'bridge', page: 'Middle',
      enter(g, b) {
        Object.assign(b, { m: 0, dirM: 1, hold: false, tries: 0, run: -1, fly: -1, ax: BX0 + 30, zone: [[0.66, 0.97], [0.72, 0.95], [0.78, 0.94]][g.tier - 1], sp: [0.85, 1.1, 1.35][g.tier - 1], msgT: 0 });
        g.cap = 'Costume change! Now Aubrey is the BIG Billy Goat Gruff! "WHO\'S THAT?" roars the Troll. "It\'s ME!" Hold to get ready, then let go in the gold to CHARGE!';
        g.act = 'Hold... let go in the gold!';
      },
      update(g, b, dt) {
        const t = S.t;
        if (g.ph === 'act' && b.run < 0) {
          const hold = (pointer.down && inRect(PIC)) || keys[' '];
          if (hold) {
            if (!b.hold) { b.hold = true; b.m = 0; b.dirM = 1; }
            b.m += b.dirM * dt * b.sp * 2;
            if (b.m >= 1) { b.m = 1; b.dirM = -1; } if (b.m <= 0) { b.m = 0; b.dirM = 1; }
            if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) tone(90 + b.m * 60, 0.08, 'triangle', 0.07);
          } else if (b.hold) {
            b.hold = false;
            if (b.m >= b.zone[0] && b.m <= b.zone[1]) { b.run = 0; tone(150, 0.3, 'sawtooth', 0.06, 0, 300); }
            else {
              b.tries++; SFX.miss(); b.msgT = 1.4;
              floatText(PIC.x + b.ax - CAM.bridge, DECK - 150, b.m < b.zone[0] ? 'Not enough oomph!' : 'Too wobbly!', '#ffd0d0', false, 22);
              if (b.tries >= 3) { b.run = 0; say(g, "Third time lucky! STOMP, STOMP, CHARGE!"); }
              else say(g, b.m < b.zone[0] ? 'Not enough oomph! Hold a bit longer.' : 'Too wobbly! Let go when the bar is in the gold.');
            }
            b.m = 0;
          }
        }
        if (b.run >= 0 && b.fly < 0) {
          b.run += dt; b.ax = lerp(BX0 + 30, 700, ease(b.run / 0.7));
          if (b.run >= 0.7) { b.fly = 0; SFX.hit(); tone(80, 0.4, 'square', 0.08); burst(PIC.x + 760 - CAM.bridge, DECK - 60, 18); }
        }
        if (b.fly >= 0) {
          const before = b.fly; b.fly += dt;
          if (before < 1.2 && b.fly >= 1.2) { noise(0.5, 0.08); burst(PIC.x + 900 - CAM.bridge, 370, 30, { colors: ['#ffffff', '#bfe8ff', '#8ad4f0'], up: 160 }); }
          if (g.ph === 'act' && b.fly > 1.6) g.finish([1, 0.6, 0.3, 0.2][Math.min(3, b.tries)], 'BUMP! SPLASH! The Troll tumbled into the river and floated far, far away. And he never grumped on that bridge again!');
        }
        b.msgT = Math.max(0, b.msgT - dt);
        let troll;
        if (b.fly < 0) troll = { mode: 'bust', x: 790, up: 1, mood: 'roar', say: g.bt < 3 ? "WHO'S THAT?" : null };
        else if (b.fly < 1.2) { const k = b.fly / 1.2; troll = { mode: 'fly', fx: lerp(790, 900, k), fy: DECK + 60 - Math.sin(k * Math.PI) * 190 + k * 60, rot: k * 5 }; }
        else troll = { mode: 'float', fx: 900 + (b.fly - 1.2) * 40 };
        const fx = [];
        if (g.ph === 'act' && b.run < 0) fx.push(() => {
          // the power bar beside Aubrey
          const x = b.ax - 110, y = DECK - 190, h = 150;
          rrect(x - 4, y - 4, 32, h + 8, 12, 'rgba(48,24,72,.75)');
          ctx.fillStyle = '#ffd23a'; ctx.fillRect(x, y + h * (1 - b.zone[1]), 24, h * (b.zone[1] - b.zone[0]));
          ctx.fillStyle = b.m >= b.zone[0] && b.m <= b.zone[1] ? '#5adc7a' : '#ff8ab8'; ctx.fillRect(x + 6, y + h * (1 - b.m), 12, h * b.m);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, y + h * (1 - b.zone[1]), 24, h * (b.zone[1] - b.zone[0]));
          text('⭐', x + 12, y - 18, 16, '#fff', 'center');
        });
        g.st = {
          aub: { x: b.ax, role: 'big', frame: b.run >= 0 && b.fly < 0 ? `run${1 + Math.floor(t * 12) % 5}` : (b.hold ? 'crouch' : 'idle_front'), facing: 1 },
          goats: [{ x: 1035, s: SIZE.little, dir: -1 }, { x: 1080, s: SIZE.middle, dir: -1 }],
          troll, fx,
        };
      },
    },
    feast: {
      w: 0.5, cam: 'meadow', page: 'End',
      enter(g, b) {
        Object.assign(b, { miss: 0, clovers: [], made: 0, need: g.tier === 1 ? 5 : 6, got: 0, next: 0.3 });
        g.cap = 'At last, the three Billy Goats Gruff reached the green meadow. Tap the sweet clover so they can munch!';
        g.act = 'Tap the clover!';
      },
      update(g, b, dt) {
        b.clovers.forEach(c => { c.age += dt; });
        if (g.ph === 'act') {
          b.next -= dt;
          if (b.next <= 0 && b.clovers.filter(c => !c.gone).length < 2 && b.made < b.need) {
            const x = rand(1000, 1440); b.clovers.push({ x, y: rand(Math.max(meadowY(x) + 46, 350), 420), age: 0, gone: false }); b.made++; b.next = 0.5;
          }
          if (pointer.clicked) {
            const wx = pointer.x - PIC.x + CAM.meadow;
            const c = b.clovers.find(c => !c.gone && Math.hypot(c.x - wx, c.y - 20 - pointer.y) < 44);
            if (c) { c.gone = true; b.got++; SFX.pop(); floatText(pointer.x, pointer.y - 30, 'yum!', '#ff6fae', false, 22); burst(pointer.x, pointer.y, 8, { colors: ['#5ac84a', '#ff9ac8'] }); }
            else if (inRect(PIC)) { b.miss++; SFX.blip(); }
          }
          if (b.got >= b.need) g.finish(1 - 0.12 * b.miss, 'They ate and ate until they were round and happy. Snip, snap, snout, this tale\'s told out!');
        }
        const chew = n => Math.abs(Math.sin(S.t * 6 + n)) * 2;
        g.st = { aub: { x: 1090, role: 'little', frame: b.got % 2 ? 'crouch' : 'idle_front', facing: 1 }, goats: [{ x: 1220, s: SIZE.middle, dir: -1, bob: chew(1) }, { x: 1340, s: SIZE.big, dir: -1, bob: chew(2) }], clovers: b.clovers };
      },
      bot(g, b) { const c = b.clovers.find(c => !c.gone && c.age > 0.3); return c ? [PIC.x + c.x - CAM.meadow, c.y - 20] : null; },
    },
  };
  // a "what happens next?" page: three picture cards over the scene
  const quizBeat = (key, cam, page, pose) => ({
    w: 1, cam, page, quiz: true,
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
      g.st = pose(g, b);
    },
    draw(g, b) {
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
  });
  BEATS.q_go = quizBeat('go', 'bridge', 'Beginning', () => ({ aub: { x: 405, role: 'little', facing: 1 }, goats: [{ x: 262, s: SIZE.big }, { x: 335, s: SIZE.middle }], troll: { mode: 'bust', x: 790, up: 0, mood: 'grumpy' } }));
  BEATS.q_trick = quizBeat('trick', 'bridge', 'Middle', (g, b) => {
    // after the right answer the Troll sinks down and the Little Billy Goat skips across
    const k = g.ph === 'after' ? clamp((g.bt - 2.2) / 2.2, 0, 1) : 0;
    const x = lerp(plankX(8), 1150, k);
    return {
      aub: { x, role: 'little', frame: k > 0 && k < 1 ? 'jump' : 'idle_front', lift: k > 0 && k < 1 ? Math.abs(Math.sin(k * 14)) * 14 : 0, facing: 1 },
      goats: [{ x: 262, s: SIZE.big }, { x: 340, s: SIZE.middle }],
      troll: { mode: 'bust', x: 790, up: g.ph === 'after' ? 1 - clamp((g.bt - 1.6) / 0.8, 0, 1) : 1, mood: g.ph === 'after' ? 'grumpy' : 'roar', say: g.ph === 'after' && g.bt < 1.6 ? 'Off you go!' : null },
    };
  });
  BEATS.q_middle = quizBeat('middle', 'bridge', 'Middle', g => {
    const k = g.ph === 'after' ? clamp((g.bt - 2.2) / 2.2, 0, 1) : 0;
    return {
      aub: { x: lerp(690, 1150, k), role: 'middle', frame: k > 0 && k < 1 ? `run${1 + Math.floor(S.t * 10) % 5}` : 'idle_front', facing: 1 },
      goats: [{ x: 300, s: SIZE.big }, { x: 1060, s: SIZE.little, dir: -1 }],
      troll: { mode: 'bust', x: 790, up: g.ph === 'after' ? 1 - clamp((g.bt - 1.6) / 0.8, 0, 1) : 1, mood: g.ph === 'after' ? 'grumpy' : 'roar', say: g.ph === 'after' && g.bt < 1.6 ? 'Hmph!' : null },
    };
  });
  BEATS.q_predict = quizBeat('predict', 'bridge', 'Middle', () => ({
    aub: { x: 1045, role: "middle", facing: -1 }, goats: [{ x: 470, s: SIZE.big, bob: Math.abs(Math.sin(S.t * 5)) * 4 }],
    troll: { mode: 'bust', x: 790, up: 0, mood: 'grumpy' },
  }));
  BEATS.q_why = quizBeat('why', 'hill', 'End', () => ({ aub: null, goats: [{ x: 140, s: SIZE.big }, { x: 240, s: SIZE.middle }, { x: 330, s: SIZE.little }], tufts: [] }));
  BEATS.retell = {
    w: 2, retell: true, page: 'The End',
    enter(g, b) {
      const ids = g.tier === 1 ? ['hill', 'troll', 'feast'] : ['hill', 'troll', 'splash', 'feast'];
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
      // card = index into b.order; its true story position is b.order[card]
      const R = this.rects(b);
      if (b.order[card] === slot) {
        b.placed[slot] = true; b.fly[slot] = 0; b.wrongHere = 0; SFX.hit();
        burst(R.slots[slot].x + R.slots[slot].w / 2, R.slots[slot].y + R.slots[slot].h / 2, 14);
        speak(MOMENTS[b.ids[slot]].label);
        if (b.placed.every(Boolean)) { SFX.fanfare(); g.finish(Math.max(0, 1 - 0.25 * b.wrong), 'The end! You told the whole story, in the right order: beginning, middle and end!'); }
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
      if (pointer.clicked && !b.drag) {
        const c = R.cards.findIndex((r, i) => free(i) && inRect(r));
        if (c >= 0) b.drag = { c, x0: pointer.x, y0: pointer.y, moved: false };
      }
      if (b.drag) {
        if (Math.hypot(pointer.x - b.drag.x0, pointer.y - b.drag.y0) > 10) b.drag.moved = true;
        if (!pointer.down) {
          const d = b.drag; b.drag = null;
          if (!d.moved) this.place(g, b, d.c, next);
          else { const s = R.slots.findIndex(r => inRect(r)); if (s >= 0 && !b.placed[s]) this.place(g, b, d.c, s); }
        }
      }
    },
    draw(g, b) {
      const R = this.rects(b), hintAt = [1, 2, 99][g.tier - 1], next = b.placed.indexOf(false);
      outlined('Tell it again!', W / 2, 92, 24, '#ff8ac0', 'center', '#5a2a6e');
      R.slots.forEach((r, i) => {
        rrect(r.x, r.y, r.w, r.h, 12, b.placed[i] ? '#ffffff' : 'rgba(255,240,215,.9)', '#c9a8e0', 3);
        if (!b.placed[i]) { ctx.save(); ctx.setLineDash([8, 6]); rrect(r.x + 8, r.y + 8, r.w - 16, r.h - 16, 8, null, 'rgba(180,140,200,.7)', 2); ctx.restore(); outlined(String(i + 1), r.x + r.w / 2, r.y + r.h / 2, 44, 'rgba(255,255,255,.95)', 'center', '#c9a8e0'); }
        text(b.labels[i], r.x + r.w / 2, r.y + r.h + 18, 17, '#7a4a8a', 'center', 800);
      });
      // the arrow row between the slots
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
        hit(`card:${c}`, -100, -100, 1, 1, String(c + 1));   // keys only: the pointer drags cards
      });
      if (b.drag && b.drag.moved) {
        const r = R.cards[b.drag.c], over = R.slots.find(s => inRect(s));
        if (over) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.strokeRect(over.x - 4, over.y - 4, over.w + 8, over.h + 8); ctx.setLineDash([]); }
        ctx.save(); ctx.shadowColor = 'rgba(40,20,60,.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
        rrect(pointer.x - r.w / 2 - 5, pointer.y - r.h / 2 - 5, r.w + 10, r.h + 10, 14, '#ff8ac0'); ctx.restore();
        drawMoment(b.ids[b.order[b.drag.c]], pointer.x - r.w / 2, pointer.y - r.h / 2, r.w, r.h);
      }
    },
  };

  MG.sw2gruff = {
    kind: 'learn', title: () => 'Three Billy Goats Gruff', icon: () => '📖',
    how: () => "Nanny Gruff's favourite story, and YOU are in it! Aubrey plays the Billy Goats Gruff. Act out each page, guess what happens next, then tell the story again in order.",
    init(g) {
      const ids = ['munch', 'q_go', 'triptrap', 'q_trick', 'sneak'];
      if (g.tier >= 3) ids.push('q_middle');
      if (g.tier >= 2) ids.push('q_predict');
      ids.push('charge', 'feast');
      if (g.tier >= 3) ids.push('q_why');
      ids.push('retell');
      Object.assign(g, { beats: ids.map(id => ({ id })), bi: -1, ph: 'act', bt: 0, res: [], turn: 1, cam: 0, st: {} });
      g.finish = (score, after) => {
        if (g.ph !== 'act') return;
        g.res[g.bi] = clamp(score, 0, 1); g.ph = 'after'; g.bt = 0; g.cap = after; say(g, after); g.act = null;
        MG.sw2gruff.score(g);
      };
      this.next(g, true);
    },
    start(g) { speak(g.say); },
    next(g, first) {
      if (g.bi + 1 >= g.beats.length) { g.done = true; return; }   // the last page stays open behind the results
      g.bi++;
      const b = g.beats[g.bi], def = BEATS[b.id];
      g.ph = 'act'; g.bt = 0; g.act = null; g.turn = first ? 1 : 0;
      def.enter(g, b);
      if (def.cam && first) g.cam = CAM[def.cam];
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
      if (def.cam) g.cam = lerp(g.cam, CAM[def.cam], Math.min(1, dt * 3));
      if (g.turn < 1) { const ph = g.ph; g.ph = 'turn'; def.update(g, b, 0, null); g.ph = ph; g.bt = 0; return; }
      if (id === 'nextpage' && g.ph === 'after') { SFX.pick(); this.next(g); return; }
      def.update(g, b, dt, id);
      this.score(g);
    },
    draw(g) {
      const b = g.beats[g.bi], def = BEATS[b.id];
      drawBook(null, `${g.bi + 1}`);
      if (def.retell) def.draw(g, b);
      else {
        picFrame(() => {
          ctx.save(); ctx.translate(PIC.x - g.cam, 0); storyWorld(g.st); ctx.restore();
        });
        if (def.page) {
          ctx.font = `800 14px ${FONT}`; const w = ctx.measureText(def.page).width + 28;
          rrect(PIC.x + 10, PIC.y + 10, w, 28, 14, 'rgba(255,250,235,.92)', '#c9a8e0', 2);
          text(def.page, PIC.x + 10 + w / 2, PIC.y + 24, 14, '#8a4a9a', 'center', 800);
        }
        if (def.draw) def.draw(g, b);
        if (g.act && g.ph === 'act') {
          ctx.font = `700 18px ${FONT}`; const w = ctx.measureText(g.act).width + 60;
          rrect(W / 2 - w / 2, PIC.y + 10, w, 36, 18, 'rgba(48,24,72,.78)');
          text('👆 ' + g.act, W / 2, PIC.y + 28, 18, '#fff6a8', 'center', 700);
        }
      }
      caption(g.cap);
      if (g.ph === 'after' && g.bt > 1.2) {
        const last = g.bi === g.beats.length - 1;
        button('nextpage', W - 236, PIC.y + PIC.h - 58, 170, 48, last ? 'The End ★' : 'Next page ▶', { color: '#5fb87a', size: 18, key: 'Enter' });
      }
      // the page turning over
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
    name: 'Trip-Trap Gorge', icon: '🐐', bg: 'gorge_sw2',
    npc: { name: FRIEND, icon: '🐐' },
    games: [['sw2leap', 'feather', {}], ['sw2gruff', 'shell', {}]],
    intro: [
      '*:Snowy peaks, a rushing river, and an old wooden bridge across a rocky gorge. Somewhere underneath, two yellow eyes blink...',
      "N:Well, hello, dearie! I'm Nanny Gruff. My grandsons are the famous Billy Goats Gruff!",
      'N:Every goat must be sure-footed. Pull back and let go to leap up the crags, and ring the bell at the very top!',
      'A:excited:I get to be a mountain goat? Boing, boing!',
    ],
    mid: [
      'N:What a climber! Now come and sit by me. This is my favourite storybook: The Three Billy Goats Gruff.',
      "N:And today, YOU are in the story, dearie. You'll play the Billy Goats! Guess what happens next, then tell it back to me.",
      'A:laughing:Trip, trap, trip, trap! I know this one!',
    ],
    outro: [
      'N:Snip, snap, snout, this tale\'s told out! You told it beautifully, beginning, middle and end.',
      'N:Take some eagle feathers from the crags, and river shells from under the bridge. Mind the Troll on your way!',
      'A:happy:Thank you, Nanny Gruff! Bye, Mister Troll!',
    ],
  });
}
