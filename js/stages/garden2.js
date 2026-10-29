'use strict';
// Mrs. Pickett's Garden, game 2: Ladybug Lunch. Each ladybug needs an exact number of
// spots; every aphid she munches off the rose bush gives her one more (a golden aphid gives
// two). Pick bunches that ADD UP to the number (the number sentence builds as she eats),
// before she gets too hungry. Shoo the sneaky ant before it carries a bunch away!
{
  const SITES = [[235, 158], [440, 128], [650, 150], [850, 196], [300, 318], [540, 286], [770, 338]];
  const STEMS = SITES.map(([x, y], i) => [x + (i % 2 ? 40 : -30), 470, x + (i % 2 ? -10 : 20), (y + 470) / 2, x + 30, y + 6]);
  const qp = (s, f) => [(1 - f) ** 2 * s[0] + 2 * f * (1 - f) * s[2] + f * f * s[4], (1 - f) ** 2 * s[1] + 2 * f * (1 - f) * s[3] + f * f * s[5]];
  const ROSES = [[345, 214, 24, 0], [742, 236, 23, 1], [560, 196, 18, 2], [890, 300, 21, 0], [168, 382, 20, 3], [470, 398, 24, 4], [640, 412, 20, 1], [350, 420, 19, 2], [800, 430, 22, 4]];
  const ROSE_COLS = ['#ff4f7f', '#ff8fb5', '#ffd84a', '#ffffff', '#ff8a5a'];
  const HOTEL = { x: 78, y: 268 };
  // spot slots on the LEFT wing; the right wing mirrors them. Spots fill alternately so both wings grow.
  const SLOTS = [[-16, -14], [-29, 2], [-13, 4], [-24, 20], [-9, 24]];
  const slotPos = i => { const [x, y] = SLOTS[Math.floor(i / 2)]; return [i % 2 ? -x : x, y]; };
  const LEAF = P2('M0,0 C14,-22 46,-26 72,-4 C50,18 16,16 0,0 Z');
  const DEW = [[214, 432], [330, 452], [455, 428], [598, 446], [690, 430], [858, 442], [262, 470], [520, 470], [745, 465]];
  const CFG = [null,
    { rounds: 5, lo: 3, hi: 7, maxV: 4, bites: 2, badge: true, gold: 0, hunger: 40, antEvery: 15, antSpeed: 26 },
    { rounds: 5, lo: 4, hi: 9, maxV: 5, bites: 2, badge: false, gold: 0, hunger: 38, antEvery: 12, antSpeed: 32 },
    { rounds: 5, lo: 6, hi: 10, maxV: 5, bites: 3, badge: false, gold: 0.45, hunger: 40, antEvery: 9, antSpeed: 38 }];
  const MISS_COST = 0.6;  // a "too many" costs most of that ladybug's score

  // can some of these bunch values add up to exactly n?
  // can at most k of these bunch values add up to exactly n?
  const canMake = (vals, n, k = 99) => {
    if (n === 0) return true;
    if (k <= 0) return false;
    return vals.some((v, i) => v <= n && canMake(vals.filter((_, j) => j !== i), n - v, k - 1));
  };
  const bitesLeft = g => g.cfg.bites - g.parts.length;
  // is eating a bunch worth v right now a good bite? (fits, and the rest can still be made)
  const fits = (g, v) => v <= need(g) && need(g) - v <= g.cfg.maxV * (bitesLeft(g) - 1);
  const need = g => g.target - g.spots - g.queue;
  const live = q => q.n > 0 && q.shoo <= 0;
  // a bunch worth v spots: golden aphids (worth 2 each) at higher tiers when v is even
  function bunch(g, i, v, armed, grow = 0) {
    const gold = v % 2 === 0 && Math.random() < g.cfg.gold;
    return { n: gold ? v / 2 : v, gold, val: v, x: SITES[i][0], y: SITES[i][1], grow, wait: 0, shoo: 0, armed, eaten: false };
  }
  // a decoy: a value that can't be finished from here (too big, or nothing left pairs with it),
  // so a careless tap costs a miss while a child who adds it up never needs it
  function decoy(g, others, rem, bl) {
    const c = g.cfg;
    const dead = [];
    for (let v = 1; v <= c.maxV; v++) if (v > rem || (v !== rem && !canMake(others, rem - v, bl - 1))) dead.push(v);
    return dead.length ? pick(dead) : randInt(Math.ceil(c.maxV / 2), c.maxV);
  }
  function newBunch(g, i) {
    const c = g.cfg, rem = need(g);
    const others = g.bunches.filter((q, j) => j !== i && live(q)).map(q => q.val);
    const good = [];
    for (let s = 1; s <= c.maxV; s++) if (rem <= 0 || canMake([...others, s], rem, bitesLeft(g))) good.push(s);
    // when the target is already reachable, new bunches lean big, so careless picks overshoot
    const v = good.length ? (canMake(others, rem, bitesLeft(g)) ? (Math.random() < 0.7 ? decoy(g, others, rem, bitesLeft(g)) : pick(good)) : pick(good)) : Math.min(c.maxV, Math.max(1, rem));
    g.bunches[i] = bunch(g, i, v, false);
  }
  function newRound(g) {
    const c = g.cfg;
    g.target = randInt(c.lo, c.hi);
    Object.assign(g, { tap: null, spots: 0, queue: 0, fillT: 0, miss: 0, idle: 0, parts: [], hunger: c.hunger, hurried: false, ant: null, antT: c.antEvery * 0.6 });
    // place a guaranteed way to make the target, then fill the other leaves with bigger decoys
    const parts = [];
    let left = g.target;
    for (let k = c.bites; k > 0 && left > 0; k--) {
      // split the target into at most `bites` bunches, none bigger than maxV
      const s = k === 1 ? left : randInt(Math.max(1, left - c.maxV * (k - 1)), Math.min(c.maxV, left - 1));
      parts.push(s); left -= s;
    }
    const order = shuffle(SITES.map((_, i) => i));
    g.bunches = SITES.map(() => null);
    const placed = [];
    order.forEach((si, k) => {
      const v = k < parts.length ? parts[k] : decoy(g, placed, g.target, c.bites);
      placed.push(v);
      g.bunches[si] = bunch(g, si, v, true, k * -0.08);
    });
    Object.assign(g.bug, { x: HOTEL.x + 4, y: HOTEL.y + 10, vx: 0, vy: 0, st: 'enter', dest: null, aim: null, sc: 0.2, dizzy: 0, loop: 0 });
    g.say = `This ladybug needs ${NUM_WORDS[g.target]} spots, in ${NUM_WORDS[c.bites]} bites or less. Find aphids that add up to ${NUM_WORDS[g.target]}!`;
    g.progress = `Ladybug ${g.round + 1} of ${c.rounds}`;
  }
  // tapping near a bunch aims at that bunch; she flies over the others on the way
  function aimAt(g, x, y) {
    const b = g.bug;
    const near = g.bunches.filter(live).sort((p, q) => Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y))[0];
    b.aim = near && Math.hypot(near.x - x, near.y - y) < 70 ? near : null;
    b.dest = b.aim ? { x: b.aim.x, y: b.aim.y } : { x, y }; g.idle = 0;
  }
  const finishRound = (g, val) => {
    g.results.push(val); g.round++;
    g.score = g.results.reduce((a, v) => a + v, 0) / g.cfg.rounds;
  };

  // ------------------------------------------------------------------ art
  function rose(x, y, r, col, t, k, live_ = true) {
    if (live_) y += Math.sin(t * 1.6 + k) * 2;
    const dk = mix(col, '#a0204a', col === '#ffffff' ? 0.25 : 0.4), lt = mix(col, '#ffffff', 0.35);
    ctx.lineJoin = 'round';
    // sepals peek out under the flower
    for (let i = 0; i < 5; i++) { const a = i * 1.257 + k; inkEllipse(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, r * 0.42, r * 0.16, a, '#4fae46', 1); }
    for (let i = 0; i < 7; i++) { const a = i * 0.898 + k; inkEllipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.52, r * 0.42, a, mix(col, dk, 0.25), 1.1); }
    for (let i = 0; i < 5; i++) { const a = i * 1.257 + k + 0.6; inkEllipse(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, r * 0.42, r * 0.34, a, col, 1); }
    inkCircle(x, y, r * 0.36, lt, 1);
    ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.4, r * 0.08); ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.25) { const rr = r * 0.32 * (1 - a / (Math.PI * 4.3)); ctx.lineTo(x + Math.cos(a + k) * rr, y + Math.sin(a + k) * rr); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(x - r * 0.35, y - r * 0.45, r * 0.18, r * 0.09, -0.6);
  }
  // a glossy leaf with veins; ang tilts it, s scales it
  function glossyLeaf(x, y, ang, s = 1, eaten = false) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.translate(-36, 0);
    const gr = ctx.createLinearGradient(0, -20, 0, 14);
    gr.addColorStop(0, eaten ? '#d8e89a' : '#8ee070'); gr.addColorStop(1, eaten ? '#a8c060' : '#3f9a3a');
    ink(LEAF, gr, 1.5);
    ctx.strokeStyle = eaten ? '#8aa050' : '#2f7a2e'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(36, -4, 66, -4); ctx.stroke();
    ctx.lineWidth = 1.3;
    for (const vx of [18, 32, 46]) {
      ctx.beginPath(); ctx.moveTo(vx, -2); ctx.lineTo(vx + 9, -13); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vx, -2); ctx.lineTo(vx + 8, 8); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(26, -10, 12, 2.6, -0.2);
    if (eaten) {  // nibbled: little bite marks and crumbs
      ctx.fillStyle = '#a07a3a';
      for (const [cx, cy] of [[22, 3], [40, -2], [52, 4]]) circle(cx, cy, 1.6);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(46, -15, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    }
    ctx.restore();
  }
  function dew(x, y, r, t, k) {
    ctx.fillStyle = 'rgba(200,240,255,.85)'; circle(x, y, r);
    ctx.strokeStyle = 'rgba(90,150,200,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; circle(x - r * 0.35, y - r * 0.35, r * 0.35);
    const tw = Math.sin(t * 2.2 + k * 1.9);
    if (tw > 0.8) star(x + r * 0.2, y - r * 0.6, 4 + (tw - 0.8) * 25, 'rgba(255,255,255,.9)', 4);
  }
  function aphid(x, y, s, t, i, gold) {
    const wig = Math.sin(t * 10 + i * 1.7);
    ctx.save(); ctx.translate(x, y + Math.abs(Math.sin(t * 5 + i)) * -2); ctx.rotate(Math.sin(t * 2 + i) * 0.15 - 0.3 + i * 0.4); ctx.scale(s, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    for (const d of [-1, 1]) for (const k of [-4, 0, 4]) {
      ctx.beginPath(); ctx.moveTo(k, 2); ctx.lineTo(k + d * 2 + wig * 2 * d, 2 + d * 8); ctx.stroke();
    }
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(8, -2 * d); ctx.quadraticCurveTo(14, -7 * d, 17 + wig, -10 * d); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(-14, -6); ctx.moveTo(-9, 3); ctx.lineTo(-14, 6); ctx.stroke();  // little tail tubes
    inkEllipse(0, 0, 10.5, 8, 0, gold ? '#ffd23a' : '#9ee05a', 1.4);
    ctx.fillStyle = gold ? '#fff2a0' : '#d0f8a0'; ellipse(-2, -3.5, 5.5, 2.6);
    ctx.fillStyle = OL; circle(6, -2.5, 2); circle(6, 2.5, 2);
    ctx.fillStyle = '#fff'; circle(6.6, -3, 0.7); circle(6.6, 2, 0.7);
    ctx.restore();
    if (gold && Math.sin(t * 3 + i * 2) > 0.6) star(x + 9 * s, y - 10 * s, 5, '#fff8c0', 4);
  }
  function ant(x, y, ang, t, s, carry) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const d of [-1, 1]) for (const k of [-6, 0, 6]) {
      const w = Math.sin(t * 16 + k + (d > 0 ? Math.PI : 0)) * 4;
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + w, d * 7); ctx.lineTo(k + w * 1.3 - 2, d * 12); ctx.stroke();
    }
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(14, d * 2); ctx.quadraticCurveTo(20, d * 8, 25 + Math.sin(t * 8) * 1.5, d * 9); ctx.stroke(); }
    ctx.fillStyle = OL; ellipse(-12, 0, 10, 7.5); circle(1, 0, 6.5); circle(13, 0, 7.5);
    ctx.fillStyle = '#7a3a2a'; ellipse(-12, 0, 8, 5.8); circle(1, 0, 4.8); circle(13, 0, 6);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-14, -2.5, 3.5, 1.5); circle(12, -2.5, 1.6);
    ctx.fillStyle = '#fff'; circle(16, -2.5, 2.2); ctx.fillStyle = OL; circle(16.8, -2.5, 1.2);
    ctx.restore();
    if (carry) for (let k = 0; k < carry.n; k++) aphid(x - 4 + k * 9, y - 14 - k * 3, 0.75, t, k, carry.gold);
  }

  const paintSky = () => {
    const sk = ctx.createLinearGradient(0, 0, 0, 330);
    sk.addColorStop(0, '#8ed4ff'); sk.addColorStop(1, '#eaf8ff');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    // far hills and a soft hedge band
    ctx.fillStyle = '#bfe6b0'; ctx.beginPath(); ctx.moveTo(0, 300);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 270 + Math.sin(x / 140) * 22);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#9ed492'; ctx.beginPath(); ctx.moveTo(0, 330);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 318 + Math.sin(x / 90 + 1) * 14);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    // white trellis with climbing vines and tiny roses
    const ty = 236;
    ctx.strokeStyle = OL; ctx.lineWidth = 7;
    const lat = (col, lw) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      for (let x = -200; x < W + 200; x += 48) { ctx.moveTo(x, ty); ctx.lineTo(x + 180, ty + 180); ctx.moveTo(x + 180, ty); ctx.lineTo(x, ty + 180); }
      ctx.stroke();
    };
    ctx.save(); ctx.beginPath(); ctx.rect(120, ty, W - 120, 180); ctx.clip();
    lat(OL, 7); lat('#fff8ee', 3.5);
    ctx.restore();
    for (const px of [120, 330, 540, 750, 950]) inkRect(px - 6, ty - 14, 12, 200, '#fff8ee', 2.5, 3);
    inkRect(110, ty - 18, W - 100, 12, '#fff8ee', 2.5, 4);
    // vines along the trellis
    ctx.strokeStyle = '#4f9a42'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 120; x < W; x += 6) ctx.lineTo(x, ty + 6 + Math.sin(x / 36) * 10);
    ctx.stroke();
    for (let x = 140; x < W; x += 34) {
      const y = ty + 6 + Math.sin(x / 36) * 10;
      glossyLeaf(x, y + (x % 68 ? 8 : -8), x % 68 ? 0.6 : -0.6, 0.32);
      if (x % 102 < 34) rose(x + 10, y - 2, 9, ROSE_COLS[(x / 34 | 0) % ROSE_COLS.length], 0, x, false);
    }
    // a soft back hedge with scalloped top
    const hy = 372;
    ctx.fillStyle = OL; for (let x = 100; x < W + 40; x += 50) circle(x, hy, 38);
    ctx.fillStyle = '#5aa64e'; for (let x = 100; x < W + 40; x += 50) circle(x, hy, 35);
    ctx.fillStyle = '#6cba5c'; for (let x = 100; x < W + 40; x += 50) circle(x - 8, hy - 10, 18);
    ctx.fillStyle = '#5aa64e'; ctx.fillRect(60, hy, W, 120);
    // ground
    ctx.fillStyle = '#7cc864'; ctx.fillRect(0, 456, W, H);
  };
  const paintStems = () => {
    for (const pass of [0, 1, 2]) for (const s of STEMS) {
      ctx.strokeStyle = [OL, '#3f8a34', '#6cc058'][pass]; ctx.lineWidth = [11, 7, 2][pass]; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s[0] + (pass === 2 ? -2 : 0), s[1]); ctx.quadraticCurveTo(s[2] + (pass === 2 ? -2 : 0), s[3], s[4] + (pass === 2 ? -1 : 0), s[5]); ctx.stroke();
    }
    STEMS.forEach((s, i) => {
      for (const f of [0.3, 0.55, 0.78]) {
        const [px, py] = qp(s, f), d = f === 0.55 ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(px - 3, py); ctx.lineTo(px + d * 9, py - 4); ctx.lineTo(px + 3, py - 4); ctx.closePath();
        ctx.fillStyle = '#c0704a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
      }
      const [lx, ly] = qp(s, 0.45);
      glossyLeaf(lx + (i % 2 ? -26 : 26), ly, i % 2 ? Math.PI + 0.4 : -0.4, 0.55);
    });
  };
  const paintFront = () => {
    // two rows of bush blobs: a darker back row, then a brighter front row; outline first, fill second
    const back = [], front = [];
    for (let i = 0; i < 17; i++) back.push([170 + i * 48 + (i % 3) * 6, 436 + (i % 2) * 8, 38 + (i % 4) * 6]);
    for (let i = 0; i < 16; i++) front.push([150 + i * 52 + (i % 2) * 10, 480 + (i % 3) * 6, 40 + (i % 3) * 8]);
    for (const [row, base, top] of [[back, '#3f9a3a', '#55b24a'], [front, '#5cb84e', '#78d062']]) {
      ctx.fillStyle = OL; for (const [x, y, r] of row) circle(x, y, r + 3);
      ctx.fillStyle = base; for (const [x, y, r] of row) circle(x, y, r);
      ctx.fillStyle = top; for (const [x, y, r] of row) circle(x - r * 0.25, y - r * 0.3, r * 0.58);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; for (const [x, y, r] of row) circle(x - r * 0.38, y - r * 0.48, r * 0.2);
      if (row === back) for (let i = 0; i < row.length; i += 2) glossyLeaf(row[i][0] + 10, row[i][1] - row[i][2] + 6, -0.5 + (i % 4) * 0.3, 0.45);
    }
    // bug hotel: a little wooden house on a post, full of holes and sticks
    const { x, y } = HOTEL;
    inkRect(x - 7, y + 40, 14, GY - y - 24, '#a8784a', 3, 3);
    inkRect(x - 44, y - 30, 88, 74, '#c8925a', 3, 6);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x - 40, y - 26, 10, 66);
    ctx.beginPath(); ctx.moveTo(x - 56, y - 26); ctx.lineTo(x, y - 70); ctx.lineTo(x + 56, y - 26); ctx.closePath();
    ctx.fillStyle = '#e0604a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; tri(x - 40, y - 30, x, y - 62, x - 20, y - 30);
    for (const [hx, hy] of [[-24, -12], [0, -12], [24, -12], [-24, 26], [24, 26]]) {
      inkCircle(x + hx, y + hy, 10, '#e8c08a', 1.2);
      ctx.fillStyle = '#5a3a2a'; circle(x + hx, y + hy, 4);
    }
    inkCircle(x, y + 22, 15, '#3a2420', 1.5);
    rrect(x - 30, y + 48, 60, 18, 6, '#fff6e0', OL, 2);
    text('BUGS', x, y + 57, 12, '#7a4a2a', 'center', 800);
    // Mrs. Pickett's tea stump with a teapot and cup
    const sx = 178, sy = 470;
    inkRect(sx - 34, sy - 10, 68, 50, '#a8784a', 3, 6);
    inkEllipse(sx, sy - 10, 34, 9, 0, '#e8c08a', 1.5);
    ctx.strokeStyle = '#c09060'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx, sy - 10, 20, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(sx + 2, sy - 28); ctx.quadraticCurveTo(sx + 24, sy - 34, sx + 28, sy - 46); ctx.stroke();  // spout
    ctx.beginPath(); ctx.arc(sx - 22, sy - 26, 8, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();  // handle
    ctx.strokeStyle = '#6ab0e0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx + 2, sy - 28); ctx.quadraticCurveTo(sx + 24, sy - 34, sx + 28, sy - 46); ctx.stroke();
    inkEllipse(sx - 4, sy - 26, 18, 15, 0, '#8ac8f0', 1.5);
    inkEllipse(sx - 4, sy - 40, 10, 4, 0, '#6ab0e0', 1.2);
    inkCircle(sx - 4, sy - 45, 3.5, '#ff8fb5', 1);
    ctx.fillStyle = '#fff'; for (const [dx, dy] of [[-12, -26], [2, -20], [-6, -32]]) circle(sx - 4 + dx + 8, sy + dy, 2.6);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(sx - 12, sy - 31, 4, 2.2, -0.5);
    inkRect(sx + 14, sy - 26, 14, 14, '#fff6f0', 1.5, 3);  // tea cup
    ctx.fillStyle = '#ff8fb5'; circle(sx + 21, sy - 19, 2.5);
    // a green watering can by the bush
    const wx = 810, wy = 506;
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(wx - 24, wy - 16); ctx.lineTo(wx - 56, wy - 40); ctx.stroke();
    ctx.strokeStyle = '#5ab08a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(wx - 24, wy - 16); ctx.lineTo(wx - 56, wy - 40); ctx.stroke();
    inkEllipse(wx - 60, wy - 43, 9, 5, -0.6, '#7ac8a0', 1.5);
    ctx.strokeStyle = OL; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(wx, wy - 36, 18, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    inkRect(wx - 26, wy - 36, 52, 40, '#5ab08a', 3, 8);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(wx - 20, wy - 32, 8, 32);
    flower(wx + 4, wy - 16, 9, '#ffd0e0', '#ffd84a', 1.4);
  };

  // the ladybug from above, head up. n = slots shown, spots = filled count, open 0..1 = wings out
  function ladybug(x, y, s, n, spots, t, open, tilt, pop = -1, popT = 0, walk = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(40,20,60,.16)'; if (open < 0.5) ellipse(4, 42, 34, 8);
    if (open > 0) {  // see-through flying wings flutter behind the shell
      const f = Math.sin(t * 50) * 0.35;
      for (const d of [-1, 1]) {
        ctx.save(); ctx.globalAlpha = 0.65 * open;
        inkEllipse(d * 38, 10, 36, 15, d * (0.5 + f), '#eef8ff', 1.4);
        ctx.strokeStyle = 'rgba(120,150,200,.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(d * 8, 4); ctx.lineTo(d * 62, 10 + d * f * 20); ctx.stroke();
        ctx.restore();
      }
    }
    // legs: tuck up when flying, step in a walking rhythm when landed
    ctx.strokeStyle = OL; ctx.lineWidth = 3.5;
    for (const d of [-1, 1]) for (const [ly, k] of [[-8, 0], [6, 1], [20, 2]]) {
      const ph = (k + (d > 0 ? 1 : 0)) % 2 ? 0 : Math.PI;
      const w = open > 0 ? Math.sin(t * 6 + k) : Math.sin(t * (walk ? 16 : 3) + ph) * (walk ? 6 : 2);
      const reach = open > 0 ? 36 : 46;
      ctx.beginPath(); ctx.moveTo(d * 28, ly); ctx.lineTo(d * (reach - 6), ly + (k - 1) * 4 + w * 0.5); ctx.lineTo(d * reach, ly + (k - 1) * 9 + w); ctx.stroke();
    }
    ctx.lineWidth = 2.5;
    const bob = Math.sin(t * 5) * 3;
    for (const d of [-1, 1]) {
      const ex = d * 21 + Math.sin(t * 5 + d) * 2, ey = -64 + bob;
      ctx.beginPath(); ctx.moveTo(d * 6, -44); ctx.quadraticCurveTo(d * 10, -58, ex, ey); ctx.stroke();
      inkCircle(ex, ey, 3.8, '#2e2438', 0.8);
    }
    // outline head + shell together, then fill; the dark body shows where the wing cases part
    ctx.fillStyle = OL; circle(0, -32, 21); ellipse(0, 4, 41, 39);
    ctx.fillStyle = '#2e2438'; circle(0, -32, 18); ellipse(0, 4, 38, 36);
    const sp = open * 0.16;
    for (const d of [-1, 1]) {
      ctx.save(); ctx.translate(0, -26); ctx.rotate(d * sp); ctx.translate(0, 26);
      ctx.beginPath(); ctx.ellipse(0, 4, 38, 36, 0, d < 0 ? Math.PI / 2 : -Math.PI / 2, d < 0 ? Math.PI * 1.5 : Math.PI / 2); ctx.closePath();
      const gr = ctx.createRadialGradient(d * 14, -10, 4, 0, 6, 44);
      gr.addColorStop(0, '#ff7a6a'); gr.addColorStop(0.6, '#ee3a3a'); gr.addColorStop(1, '#c42a3a');
      ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    // spots: filled black (bouncing in), waiting ones dashed
    for (let i = 0; i < n; i++) {
      const [sx, sy] = slotPos(i);
      const d = sx < 0 ? -1 : 1, a = d * sp, c = Math.cos(a), si = Math.sin(a);
      const rx = sx * c - (sy + 26) * si, ry = sx * si + (sy + 26) * c - 26;
      if (i < spots) {
        const k = i === pop && popT < 0.4 ? 1 + Math.sin(popT / 0.4 * Math.PI) * 0.7 : 1;
        ctx.fillStyle = '#2e2438'; circle(rx, ry, 6.5 * k);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(rx - 2, ry - 2, 1.8);
      } else {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,240,240,.95)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // shiny shell highlight
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 4, 31, Math.PI * 1.12, Math.PI * 1.38); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(-26, -18, 2.6);
    // face
    for (const d of [-1, 1]) {
      ctx.fillStyle = '#fff'; circle(d * 7, -36, 6);
      ctx.fillStyle = OL; circle(d * 7 + 1, -35, 3.4);
      ctx.fillStyle = '#fff'; circle(d * 7 + 2.2, -37, 1.4);
      ctx.fillStyle = 'rgba(255,130,170,.8)'; ellipse(d * 12, -26, 4, 2.6);
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -28, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------------ game
  MG.ladybuglunch = {
    kind: 'learn', title: () => 'Ladybug Lunch', icon: () => '🐞',
    how: g => `Each ladybug needs just the right number of spots. Every aphid she eats gives her one spot${g.cfg.gold ? ', and golden aphids give two' : ''}! She only has room for ${NUM_WORDS[g.cfg.bites]} bites, so tap bunches that add up to her number before she gets hungry. Too many is a tummy ache! Tap the sneaky ant to shoo it.`,
    init(g) {
      g.cfg = CFG[g.tier] || CFG[1];
      Object.assign(g, { round: 0, results: [], bug: { x: 0, y: 0, vx: 0, vy: 0, sc: 1 }, clock: 0, msgT: 0, msg: '', pop: -1, popT: 9, cheer: 0, petals: [], crumbs: [] });
      for (let i = 0; i < 9; i++) g.petals.push({ x: rand(0, W), y: rand(60, 460), s: rand(0.6, 1.1), ph: rand(0, 6), col: pick(['#ffc0d4', '#ffe0a0', '#ffffff']) });
      newRound(g);
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      const c = g.cfg, b = g.bug;
      g.clock += dt; g.msgT = Math.max(0, g.msgT - dt); g.popT += dt; g.cheer = Math.max(0, g.cheer - dt);
      b.dizzy = Math.max(0, b.dizzy - dt);
      for (const p of g.petals) { p.y += dt * 18 * p.s; p.x += Math.sin(g.t + p.ph) * dt * 20; if (p.y > 470) { p.y = 70; p.x = rand(0, W); } }
      for (const k of g.crumbs) { k.x += k.vx * dt; k.y += k.vy * dt; k.vy += 500 * dt; k.life -= dt; }
      g.crumbs = g.crumbs.filter(k => k.life > 0);
      for (let i = 0; i < g.bunches.length; i++) {
        const q = g.bunches[i];
        if (q.n > 0) q.grow = Math.min(1, q.grow + dt * 2.5);
        if (q.shoo > 0) { q.shoo -= dt; if (q.shoo <= 0) q.n = 0; }
        const far = Math.hypot(b.x - q.x, b.y - q.y);
        // each bunch can be eaten once. An eaten leaf only regrows while she is well away from it,
        // and a regrown bunch only counts after she has left and come back on purpose.
        if (q.n === 0 && (q.wait -= dt) <= 0 && b.st === 'fly' && g.queue === 0 && far > 150 && g.ant?.i !== i) newBunch(g, i);
        if (q.n > 0 && !q.armed && far > 110) q.armed = true;
      }
      // feed queued spots in one at a time, bouncing onto the shell, so the child can count along
      if (g.queue > 0 && (g.fillT -= dt) <= 0) {
        g.queue--; g.spots++; g.fillT = 0.3; g.pop = g.spots - 1; g.popT = 0;
        tone(392 * Math.pow(2, (g.spots + 3) / 12), 0.16, 'triangle', 0.09);
        const [sx, sy] = slotPos(g.spots - 1);
        burst(b.x + sx * 1.25, b.y + sy * 1.25, 5, { colors: ['#2e2438', '#ff6a5a', '#fff'], spread: 70, up: 40, size: [2, 4] });
        floatText(b.x + sx, b.y + sy - 24, String(g.spots), '#fff', false, 22);
        if (g.queue === 0) {
          const sum = g.parts.length > 1 ? `${g.parts.map(v => NUM_WORDS[v]).join(' plus ')} makes ${NUM_WORDS[g.spots]}.` : `${NUM_WORDS[g.spots]}.`;
          if (g.spots === g.target) {
            b.st = 'home'; b.loop = 1.2; b.lx = b.x; b.ly = Math.max(150, b.y - 55); g.cheer = 1.8;
            SFX.sparkle(); burst(b.x, b.y, 28, { colors: ['#fff6a8', '#ff8fb5', '#ff5a5a', '#ffffff'] });
            speak(`${sum} Perfect! Home she goes!`);
          } else speak(`${sum} She needs ${NUM_WORDS[need(g)]} more, in ${NUM_WORDS[bitesLeft(g)]} ${bitesLeft(g) > 1 ? 'bites' : 'bite'}.`);
        }
      }
      // the sneaky ant climbs a stem to carry a bunch away; tap it to shoo it off
      if (b.st === 'fly' && !g.ant && (g.antT -= dt) <= 0) {
        const opts = g.bunches.map((q, i) => i).filter(i => live(g.bunches[i]) && g.bunches[i] !== b.aim && Math.hypot(b.x - g.bunches[i].x, b.y - g.bunches[i].y) > 140);
        if (opts.length) { g.ant = { i: pick(opts), f: 0, st: 'up', carry: null, vy: 0 }; SFX.blip(); }
        g.antT = c.antEvery * rand(0.8, 1.2);
      }
      const a = g.ant;
      if (a) {
        const s = STEMS[a.i], len = 380;
        if (a.st === 'up') {
          a.f += dt * c.antSpeed / len;
          if (a.f >= 1) {
            const q = g.bunches[a.i];
            if (live(q) && q !== b.aim && Math.hypot(b.x - q.x, b.y - q.y) > 60) {
              a.carry = { n: q.n, gold: q.gold, val: q.val }; q.n = 0; q.wait = 2.5;
              SFX.miss(); g.msg = 'The ant took them!'; g.msgT = 1.4; g.msgX = q.x; g.msgY = q.y - 30;
            }
            a.f = 1; a.st = 'down';
          }
        } else if (a.st === 'down') {
          a.f -= dt * c.antSpeed * 1.3 / len;
          if (a.f <= 0) g.ant = null;
        } else if (a.st === 'flee') {
          a.vy += 700 * dt; a.x += a.vx * dt; a.y += a.vy * dt; a.spin += dt * 12;
          if (a.y > H + 40) g.ant = null;
        }
        if (a.st !== 'flee') { const [x, y] = qp(s, a.f); a.x = x; a.y = y; }
      }
      // hunger: a gentle patience timer while she is waiting for lunch
      if (b.st === 'fly' && g.queue === 0) {
        g.hunger -= dt;
        if (g.hunger < 10 && !g.hurried) { g.hurried = true; speak('Hurry, she is getting hungry!'); }
        if (g.hunger <= 0) {
          b.st = 'home'; b.loop = 0; b.sad = true; g.ant = null;
          speak('Oh dear, she got too hungry and flew home for a nap.');
          g.msg = 'Too hungry!'; g.msgT = 1.8; g.msgX = null;
        }
      }
      if (b.st === 'enter') {
        b.sc = Math.min(1, b.sc + dt * 2); b.y -= dt * 60; b.x += dt * 120;
        if (pointer.clicked && pointer.y > 64) g.tap = { x: pointer.x, y: pointer.y };  // remember a tap made while she pops out
        if (b.sc >= 1) {
          b.st = 'fly'; b.sad = false; b.dest = { x: HOTEL.x + 120, y: HOTEL.y - 40 };
          if (g.tap) { aimAt(g, g.tap.x, g.tap.y); g.tap = null; }
        }
      } else if (b.st === 'fly' || b.st === 'home') {
        if (b.st === 'fly' && g.queue === 0 && b.dizzy <= 0) {
          g.idle += dt;
          if (pointer.clicked && pointer.y > 64) {
            if (a && a.st !== 'flee' && Math.hypot(pointer.x - a.x, pointer.y - a.y) < 40) {
              // shooed! if it was carrying aphids, they hop back onto their leaf
              a.st = 'flee'; a.vx = rand(-120, 120); a.vy = -260; a.spin = 0;
              SFX.pop(); floatText(a.x, a.y - 30, 'Shoo!', '#fff', false, 24);
              const q = g.bunches[a.i];
              if (a.carry && q.n === 0) Object.assign(q, { n: a.carry.n, gold: a.carry.gold, val: a.carry.val, grow: 0.3, shoo: 0, eaten: false, armed: false });
              a.carry = null; g.idle = 0;
            } else {
              aimAt(g, pointer.x, pointer.y);
            }
          }
          let kx = 0, ky = 0;
          if (goLeft()) kx--; if (goRight()) kx++; if (keys.arrowup || keys.w) ky--; if (goDown()) ky++;
          if (kx || ky) { b.dest = { x: b.x + kx * 60, y: b.y + ky * 60 }; b.aim = null; g.idle = 0; }
        }
        if (b.st === 'home' && b.loop > 0) {
          // a happy loop-the-loop before flying home
          b.loop -= dt;
          const f = 1 - Math.max(0, b.loop) / 1.2, A = f * Math.PI * 2;
          b.x = b.lx + Math.sin(A) * 55; b.y = b.ly + Math.cos(A) * 55; b.spin = -A;
          if (Math.random() < 0.5) burst(b.x, b.y + 20, 1, { colors: ['#fff6a8', '#ffb3e0'], spread: 30, up: 10 });
          if (b.loop <= 0) { b.spin = 0; b.dest = { x: HOTEL.x, y: HOTEL.y + 12 }; }
        } else {
          if (b.st === 'home') b.dest = { x: HOTEL.x, y: HOTEL.y + 12 };
          if (b.dest) {
            const dx = b.dest.x - b.x, dy = b.dest.y - b.y, d = Math.hypot(dx, dy);
            const sp = b.st === 'home' ? 320 : 380;
            if (d < 6) { b.vx *= 0.8; b.vy *= 0.8; if (b.st === 'fly') b.dest = null; }
            else { b.vx = lerp(b.vx, dx / d * Math.min(sp, d * 5), Math.min(1, dt * 8)); b.vy = lerp(b.vy, dy / d * Math.min(sp, d * 5), Math.min(1, dt * 8)); }
          } else { b.vx *= 0.85; b.vy *= 0.85; }
          b.x = clamp(b.x + b.vx * dt, 40, W - 40); b.y = clamp(b.y + b.vy * dt, 96, 440);
        }
        if (b.st === 'home') {
          if (b.loop <= 0 && Math.hypot(b.x - HOTEL.x, b.y - HOTEL.y - 12) < 18) {
            b.sc = Math.max(0, b.sc - dt * 3);
            if (b.sc <= 0) {
              finishRound(g, b.sad ? 0 : Math.max(0, 1 - g.miss * MISS_COST));
              if (g.round >= c.rounds) { g.done = true; return; }
              newRound(g); speak(g.say);
            }
          }
        } else if (g.queue === 0 && b.dizzy <= 0) {
          // touching a bunch: eat it, or "too many!"
          for (const q of g.bunches) {
            if (!live(q) || !q.armed || q.grow < 0.6 || Math.hypot(b.x - q.x, b.y - q.y) > 46) continue;
            // only land on the bunch she was sent to, or (steering by keys) one she stops on
            if (b.aim ? q !== b.aim : Math.hypot(b.vx, b.vy) > 90) continue;
            b.aim = null;
            if (fits(g, q.val)) {
              g.queue = q.val; g.fillT = 0.2; g.parts.push(q.val);
              for (let k = 0; k < q.n; k++) tone(1500 + k * 180, 0.07, 'sine', 0.06, k * 0.07, 2100 + k * 180);  // squeak!
              SFX.pop();
              for (let k = 0; k < 14; k++) g.crumbs.push({ x: q.x + rand(-14, 14), y: q.y + rand(-8, 8), vx: rand(-140, 140), vy: rand(-220, -60), life: rand(0.5, 0.9), col: pick(q.gold ? ['#ffd23a', '#fff2a0'] : ['#9ee05a', '#d0f8a0', '#5fbf4a']) });
              q.n = 0; q.eaten = true; q.wait = 1.4; b.dest = null;
            } else {
              g.miss++; q.shoo = 0.6; q.wait = 1.6; b.dizzy = 1.1; SFX.fail();
              const over = q.val > need(g);
              g.msg = over ? 'Too many!' : 'Not enough!'; g.msgT = 1.6; g.msgX = null;
              const away = Math.atan2(b.y - q.y, b.x - q.x);
              b.vx = Math.cos(away) * 420; b.vy = Math.sin(away) * 420; b.dest = null;
              speak(over ? `Oops, that's ${NUM_WORDS[q.val]}. Too many! She needs ${NUM_WORDS[need(g)]} more.`
                : `That's only ${NUM_WORDS[q.val]}. Not enough! She needs ${NUM_WORDS[need(g)]} more, in ${NUM_WORDS[bitesLeft(g)]} ${bitesLeft(g) > 1 ? 'bites' : 'bite'}.`);
            }
            break;
          }
        }
      }
      // hint: after a while, a bunch that fits glows
      g.hint = -1;
      if (b.st === 'fly' && g.idle > (g.tier === 1 ? 7 : 11)) {
        const rem = need(g), vals = g.bunches.map(q => (live(q) ? q.val : 0));
        g.hint = vals.indexOf(rem);
        if (g.hint < 0) g.hint = vals.findIndex((v, i) => v > 0 && fits(g, v) && canMake(vals.filter((_, j) => j !== i), rem - v, bitesLeft(g) - 1));
      }
      if (g.clock > 300) g.done = true;  // safety net so a stuck game still ends
    },
    draw(g) {
      const t = g.t, b = g.bug, c = g.cfg;
      blit(sprite('garden2_sky', W, H, 0, 0, paintSky), 0, 0);
      // soft sunlight rays from the top corner
      ctx.save(); ctx.translate(900, -20); ctx.rotate(Math.sin(t * 0.2) * 0.05);
      for (let i = 0; i < 7; i++) {
        const a0 = Math.PI * 0.55 + i * 0.12;
        ctx.fillStyle = `rgba(255,250,210,${0.1 + 0.05 * Math.sin(t * 0.8 + i)})`;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 900, a0, a0 + 0.05); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      blit(sprite('garden2_stems', W, H, 0, 0, paintStems), 0, 0);
      ROSES.slice(0, 4).forEach(([x, y, r, ci], k) => rose(x, y, r, ROSE_COLS[ci], t, k));
      for (const p of g.petals) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(t * 2 + p.ph)); ctx.fillStyle = p.col; ellipse(0, 0, 6 * p.s, 3.5 * p.s); ctx.restore(); }
      g.bunches.forEach((q, i) => {
        glossyLeaf(q.x + 2, q.y + 12, (i % 2 ? 0.25 : -0.2) + Math.sin(t * 1.3 + i) * 0.03, 1, q.n <= 0 && q.eaten);
        dew(q.x - 26, q.y + 10, 3.2, t, i);
        if (g.hint === i) {
          const gr = ctx.createRadialGradient(q.x, q.y, 4, q.x, q.y, 60);
          gr.addColorStop(0, `rgba(255,250,170,${0.5 + Math.sin(t * 6) * 0.25})`); gr.addColorStop(1, 'rgba(255,250,170,0)');
          ctx.fillStyle = gr; circle(q.x, q.y, 60);
        }
        if (q.n <= 0) return;
        const s = clamp(q.grow, 0, 1) * 1.35;
        for (let k = 0; k < q.n; k++) {
          let ax = q.x + (k - (q.n - 1) / 2) * 23, ay = q.y + (k % 2 ? -7 : 5);
          if (q.shoo > 0) { const f = 0.6 - q.shoo; ax += Math.cos(k * 2.1) * f * 260; ay += Math.sin(k * 2.1) * f * 200 - f * 80; }
          aphid(ax, ay, s, t, k, q.gold);
        }
        if (c.badge && q.shoo <= 0 && q.grow > 0.6) {
          inkCircle(q.x + 32, q.y - 26, 14, '#fffbe8', 1.2);
          text(String(q.val), q.x + 32, q.y - 25, 18, '#3f8a2a', 'center', 800);
        }
      });
      blit(sprite('garden2_front', W, H, 0, 0, paintFront), 0, 0);
      ROSES.slice(4).forEach(([x, y, r, ci], k) => rose(x, y, r, ROSE_COLS[ci], t, k + 4));
      DEW.forEach(([x, y], k) => dew(x, y, 3.5, t, k + 7));
      if (g.ant) {
        const a = g.ant, s = STEMS[a.i];
        const f2 = clamp(a.f + (a.st === 'down' ? -0.02 : 0.02), 0, 1), [nx, ny] = qp(s, f2);
        const ang = a.st === 'flee' ? a.spin : Math.atan2(ny - a.y, nx - a.x);  // faces the way it walks
        ant(a.x, a.y, ang, t, 1.6, a.carry);
        if (a.st === 'up') { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8); emoji('❗', a.x + 16, a.y - 30, 20); ctx.globalAlpha = 1; }
      }
      if (g.phase === 'play') drawCritter('Mrs. Pickett', 905, GY + 34, 0.55, -1);  // the scene draws her itself on the results panel
      for (const k of g.crumbs) { ctx.fillStyle = k.col; circle(k.x, k.y, 3.2); }
      // the ladybug
      const flying = b.st !== 'enter' && (Math.hypot(b.vx, b.vy) > 30 || b.st === 'home');
      const bob = flying ? Math.sin(t * 8) * 3 : 0;
      const tilt = b.st === 'home' && b.loop > 0 ? b.spin : clamp(b.vx / 900, -0.35, 0.35) + (b.dizzy > 0 ? Math.sin(t * 20) * 0.25 : 0);
      ladybug(b.x, b.y + bob, 1.25 * b.sc, g.target, g.spots, t, flying ? 1 : 0, tilt, g.pop, g.popT, g.queue > 0 ? 1 : 0);
      if (b.dizzy > 0) for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2.1; star(b.x + Math.cos(a) * 36, b.y - 60 + Math.sin(a) * 10, 8, '#ffe36b', 5); }
      if (g.msgT > 0) {
        const mx = g.msgX ?? b.x, my = g.msgX != null ? g.msgY : b.y - 96;
        outlined(g.msg, clamp(mx, 120, W - 120), my, 28, '#ff8a5a', 'center', '#fff');
      }
      if (g.cheer > 0) outlined('Perfect!', b.x, Math.max(80, b.y - 96 - (1.8 - g.cheer) * 20), 32, '#ff6fb5', 'center', '#fff');
      this.drawCounter(g);
    },
    // a number line of spots grouped by what she ate, the number sentence, and her hunger
    drawCounter(g) {
      const n = g.target, t = g.t;
      const pw = Math.max(380, n * 30 + 150), x0 = W / 2 - pw / 2, y0 = 458;
      darkPanel(x0, y0, pw, 76, 24);
      const lx = x0 + 22;
      let i = 0;
      g.parts.forEach((v, pi) => {
        rrect(lx + i * 30 - 3, y0 + 8, v * 30 - 4, 30, 15, pi % 2 ? 'rgba(255,210,120,.25)' : 'rgba(160,230,255,.22)');
        i += v;
      });
      for (let k = 0; k < n; k++) {
        const cx = lx + 12 + k * 30, cy = y0 + 23;
        if (k < g.spots) {
          const pk = k === g.pop && g.popT < 0.35 ? 1 + Math.sin(g.popT / 0.35 * Math.PI) * 0.4 : 1;
          inkCircle(cx, cy, 11 * pk, '#ee3a3a', 1.2, '#fff'); ctx.fillStyle = '#2e2438'; circle(cx, cy, 4 * pk);
        } else { ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      }
      // number sentence: 2 + 3 + ? = 7
      const rem = g.target - g.spots - g.queue;
      const bits = g.parts.map(String);
      if (rem > 0) for (let k = 0; k < Math.max(1, bitesLeft(g)); k++) bits.push('?');
      const sent = `${bits.join(' + ')} = ${g.target}`;
      ctx.font = `800 22px ${FONT}`;
      const sw = ctx.measureText(sent).width;
      let sx = lx + 2;
      bits.forEach((s, k) => {
        const col = s === '?' ? (Math.sin(t * 5) > 0 ? '#ffe36b' : '#fff3b0') : k % 2 ? '#ffd890' : '#b8ecff';
        text(s, sx, y0 + 56, 22, col, 'left', 800); ctx.font = `800 22px ${FONT}`; sx += ctx.measureText(s).width;
        if (k < bits.length - 1) { text(' + ', sx, y0 + 56, 22, '#fff', 'left', 800); ctx.font = `800 22px ${FONT}`; sx += ctx.measureText(' + ').width; }
      });
      text(` = ${g.target}`, sx, y0 + 56, 22, '#fff', 'left', 800);
      if (rem > 0 && g.parts.length) text(`(${rem} more)`, lx + sw + 14, y0 + 56, 16, '#ffe9a0', 'left', 700);
      // bites left: little leaf plates, dimmed once used
      for (let k = 0; k < g.cfg.bites; k++) {
        ctx.globalAlpha = k < g.parts.length ? 0.3 : 1;
        glossyLeaf(x0 + pw - 80, y0 + 16 + k * 20 + (g.cfg.bites === 2 ? 10 : 0), -0.1, 0.32);
        ctx.globalAlpha = 1;
      }
      // hunger: a leaf pie that shrinks while she waits
      const hx = x0 + pw - 36, hy = y0 + 38, f = clamp(g.hunger / g.cfg.hunger, 0, 1);
      inkCircle(hx, hy, 22, 'rgba(255,255,255,.15)', 1.2, '#fff');
      ctx.fillStyle = f > 0.5 ? '#7ad86a' : f > 0.25 ? '#ffc04a' : '#ff6a5a';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.arc(hx, hy, 20, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.closePath(); ctx.fill();
      ladybug(hx, hy + 2 + (f < 0.25 ? Math.sin(t * 20) * 1.5 : 0), 0.22, 0, 0, t, 0, 0);
    },
  };

  restage('garden', {
    games: [['maze', 'petal', { what: 'petals' }], ['ladybuglunch', 'berry', {}]],
    mid: [
      "N:Oh, thank you, dear! Now, see my roses? They're covered in tiny green aphids.",
      'N:My ladybugs gobble them up, and every aphid gives a ladybug one more spot!',
      'N:But each ladybug needs JUST the right number of spots. Not one too many! And watch out for that sneaky ant.',
      'A:thinking:So I pick aphids that add up... exactly. I can do that!',
    ],
  });
}
