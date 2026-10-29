'use strict';
{
  // =====================================================================================
  // PIP'S BAKERY, game 1: the bakery counter. Customers walk in with a picture order.
  // Grab ready treats off the display trays, and decorate custom cupcakes at the little
  // decorating station (frosting colour + toppings), then hand the box over before the
  // customer gets tired of waiting.
  // =====================================================================================
  const BC_TREATS = {
    pinkdonut: { one: 'pink donut', many: 'pink donuts' },
    cookie: { one: 'cookie', many: 'cookies' },
    croissant: { one: 'croissant', many: 'croissants' },
    chocdonut: { one: 'chocolate donut', many: 'chocolate donuts' },
    muffin: { one: 'blueberry muffin', many: 'blueberry muffins' },
    cakeslice: { one: 'slice of cake', many: 'slices of cake' },
  };
  const BC_KINDS = { 1: ['pinkdonut', 'cookie', 'croissant'], 2: ['pinkdonut', 'chocdonut', 'cookie', 'croissant'], 3: ['pinkdonut', 'chocdonut', 'cookie', 'croissant', 'muffin', 'cakeslice'] };
  // custom cupcakes: which frostings and toppings each tier offers, and how many toppings an order asks for
  const BC_FROST = { pink: '#ffb3d6', blue: '#9ad8ff', yellow: '#ffe27a', chocolate: '#a8683e' };
  const BC_FROSTS = { 1: ['pink', 'blue', 'yellow'], 2: ['pink', 'blue', 'yellow', 'chocolate'], 3: ['pink', 'blue', 'yellow', 'chocolate'] };
  // every base gets a colour coat (frosting, glaze, icing or drizzle) and its own toppings
  const BC_BASES = {
    cupcake: { coat: 'Frosting', tops: ['sprinkles', 'cherry', 'star'] },
    donut: { coat: 'Glaze', tops: ['sprinkles', 'candy', 'drizzle'] },
    cookie: { coat: 'Icing', tops: ['sprinkles', 'chips', 'heart'] },
    croissant: { coat: 'Drizzle', tops: ['sugar', 'almonds', 'jam'] },
  };
  const BC_BASE_TIER = { 1: ['cupcake', 'donut'], 2: ['cupcake', 'donut', 'cookie'], 3: ['cupcake', 'donut', 'cookie', 'croissant'] };
  const BC_TOP_WORD = { sprinkles: 'sprinkles', cherry: 'a cherry', star: 'a star', candy: 'candies', drizzle: 'a white drizzle', chips: 'chocolate chips', heart: 'a heart', sugar: 'powdered sugar', almonds: 'almonds', jam: 'jam' };
  const BC_TOP_SHORT = { sugar: 'sugar', chips: 'choc chips', drizzle: 'drizzle' };
  const BC_CUSTOMERS = ['Penny the Pig', 'Millie Mouse', 'Hazel Hedgehog', 'Scamper Squirrel', 'Otto the Otter', 'Bramble the Bear', 'Pengu the Penguin', 'Fergus the Frog', 'Ruby Robin', 'Granny Owl', 'Tilly the Turtle', 'Mama Duck'];
  const BC_SPRINK = ['#ffffff', '#5fd0ff', '#ffe14a', '#7ae08a', '#c69aff', '#ff6f9a'];
  const BC_BOX = { x: 604, y: 188, w: 196, h: 108 }; // the open cake box on the counter
  const BC_JAR = [876, 298];                          // the tip jar, under the Give button
  const BC_STAND = 236;                               // where a customer stops at the counter
  const BC_COUNTER = 298;
  const BC_WRAP = 0.9;

  // a decorated treat that looks exactly like a ready-made one counts as that one
  const ccKey = (base, frost, tops) => {
    const t = tops.slice().sort().join('+');
    if (base === 'donut' && frost === 'pink' && t === 'sprinkles') return 'pinkdonut';
    if (base === 'donut' && frost === 'chocolate' && t === 'drizzle') return 'chocdonut';
    return `cc:${base}:${frost}:${t}`;
  };
  const ccParse = k => { const [, base, frost, t] = k.split(':'); return { base, frost, tops: t ? t.split('+') : [] }; };
  const andList = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '');

  // --- a cupcake to decorate: plain baked top, then frosting (grows in), then toppings ------
  const popOf = popT => k => 1 + Math.sin(Math.min(1, (popT[k] || 0) / 0.3) * Math.PI) * 0.5;
  // a scatter of sprinkles inside an ellipse, avoiding a hole in the middle if asked
  function sprinkleScatter(rx, ry, cy, hole, n, seed) {
    const R = rng(seed);
    for (let i = 0, made = 0; made < n && i < n * 6; i++) {
      const a = R() * TAU, r = Math.sqrt(R()), sx = Math.cos(a) * rx * r, sy = cy + Math.sin(a) * ry * r;
      if (hole && (sx * sx) / (hole[0] * hole[0]) + ((sy - hole[2]) ** 2) / (hole[1] * hole[1]) < 1) continue;
      made++;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(R() * 6); ctx.fillStyle = BC_SPRINK[made % BC_SPRINK.length]; ctx.fillRect(-4.5, -1.8, 9, 3.6); ctx.restore();
    }
  }
  function popAt(p, x, y, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(p, p); ctx.translate(-x, -y); fn(); ctx.restore(); }
  function croissantShape() {
    // five puffy segments in a crescent: outline them all first, then fill, so it reads as one roll
    const seg = [[-36, 12, 13, 17, -1.0], [-20, -2, 16, 22, -0.5], [0, -8, 18, 26, 0], [20, -2, 16, 22, 0.5], [36, 12, 13, 17, 1.0]];
    ctx.strokeStyle = OL; ctx.lineWidth = 5;
    for (const [sx, sy, rx, ry, r] of seg) { ctx.beginPath(); ctx.ellipse(sx, sy, rx, ry, r, 0, TAU); ctx.stroke(); }
    seg.forEach(([sx, sy, rx, ry, r], i) => { ctx.fillStyle = i === 2 ? '#f4b45a' : i % 2 ? '#eea24a' : '#e8943e'; ctx.beginPath(); ctx.ellipse(sx, sy, rx, ry, r, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = 'rgba(150,80,30,.55)'; ctx.lineWidth = 2;
    for (const [sx, sy, rx, ry, r] of seg.slice(1, 4)) { ctx.beginPath(); ctx.ellipse(sx, sy, rx, ry, r, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,240,200,.6)'; for (const [sx, sy, , ry, r] of seg.slice(1, 4)) ellipse(sx - 4, sy - ry * 0.45, 5, 8, r);
  }
  // an outlined line: ink first, colour on top, so drizzles read clearly on anything
  function inkLine(pts, col, w) {
    for (const [c, lw] of [[OL, w + 3], [col, w]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
  }
  function drawDonutC(frost, tops, grow, pop) {
    inkEllipse(0, 6, 44, 32, 0, '#e8a860', 2.4);
    ctx.fillStyle = 'rgba(255,230,180,.55)'; ellipse(-20, 22, 12, 4, 0.2);
    if (frost && grow > 0) {
      const c = BC_FROST[frost], k = 0.4 + grow * 0.6;
      ctx.save(); ctx.scale(k, k);
      // glaze with little drips running down the sides
      ink(P2('M-38,0 C-42,-22 -20,-30 0,-30 C20,-30 42,-22 38,0 C37,8 33,8 31,16 C29,26 22,26 21,16 C20,10 14,14 10,18 C6,22 0,24 -4,20 C-8,16 -13,17 -17,23 C-21,30 -28,28 -27,19 C-28,12 -36,10 -38,0 Z'), c, 2.2);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-20, -16, 11, 5, -0.4); ellipse(24, -18, 4, 2, 0.5); ellipse(25, 16, 2, 4);
      ctx.restore();
    }
    inkEllipse(0, -2, 12, 8, 0, '#c8844a', 2); ctx.fillStyle = '#a8683a'; ellipse(0, 0, 8, 4);
    if (!frost || grow < 1) return;
    if (tops.includes('sprinkles')) popAt(pop('sprinkles'), 0, -6, () => sprinkleScatter(32, 20, -6, [17, 12, -2], 16, 11));
    if (tops.includes('drizzle')) popAt(pop('drizzle'), 0, -6, () => inkLine([[-34, -8], [-24, -24], [-16, 6], [-6, -28], [6, 12], [14, -28], [24, 6], [32, -16]], '#fffaf0', 3.5));
    if (tops.includes('candy')) popAt(pop('candy'), 0, -6, () => {
      for (const [cx, cy, col] of [[-26, -10, '#ff5a6a'], [-14, -22, '#5fd0ff'], [14, -22, '#ffe14a'], [27, -8, '#7ae08a'], [20, 8, '#c69aff'], [-20, 8, '#ff9a3a'], [0, 14, '#ff6fb5']]) {
        inkCircle(cx, cy, 5.5, col, 1.2); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(cx - 2, cy - 2, 1.6);
      }
    });
  }
  function drawCookieC(frost, tops, grow, pop) {
    inkCircle(0, 0, 38, '#e8b868', 2.4);
    ctx.strokeStyle = 'rgba(160,100,40,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-32, 14); ctx.lineTo(-27, 18); ctx.moveTo(28, -18); ctx.lineTo(33, -12); ctx.stroke();
    if (frost && grow > 0) {
      const c = BC_FROST[frost], k = 0.3 + grow * 0.7, p = new Path2D();
      for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, r = (30 + Math.sin(a * 7) * 2) * k; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(r, 0); }
      p.closePath(); ink(p, c, 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-12 * k, -14 * k, 10 * k, 4 * k, -0.5);
    }
    if (!frost || grow < 1) return;
    if (tops.includes('sprinkles')) popAt(pop('sprinkles'), 0, 0, () => sprinkleScatter(24, 24, 0, tops.includes('heart') ? [12, 12, -2] : null, 14, 21));
    if (tops.includes('chips')) popAt(pop('chips'), 0, 0, () => {
      for (const [cx, cy, r] of [[-16, -12, 0.4], [8, -18, -0.3], [18, 2, 0.8], [-6, 14, 0.1], [-20, 8, -0.6], [12, 18, 0.5]]) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(r); ink(P2('M0,-6 C5,0 5,5 0,5 C-5,5 -5,0 0,-6 Z'), '#5a3020', 1); ctx.restore(); }
    });
    if (tops.includes('heart')) popAt(pop('heart'), 0, 0, () => { heart(0, -15, 40, OL); heart(0, -12.5, 34, '#ffffff'); heart(0, -10, 27, '#ff4a7a'); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(-6, -5, 2.5); });
  }
  function drawCroissantC(frost, tops, grow, pop) {
    if (tops.includes('jam') && frost && grow >= 1) popAt(pop('jam'), 0, 10, () => {
      // jam squishing out of both ends of the roll
      for (const sx of [-1, 1]) { inkEllipse(sx * 46, 18, 8, 6, sx * 0.6, '#e8243a', 1.4); }
    });
    croissantShape();
    if (frost && grow > 0) {
      const pts = [[-40, 6], [-30, -16], [-20, 8], [-8, -26], [4, 4], [16, -26], [26, 6], [38, -12]];
      inkLine(pts.slice(0, Math.max(2, Math.ceil(pts.length * grow))), BC_FROST[frost], 4);
    }
    if (!frost || grow < 1) return;
    if (tops.includes('jam')) popAt(pop('jam'), 0, -30, () => { inkEllipse(0, -30, 9, 6, 0, '#e8243a', 1.4); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(-3, -32, 2); });
    if (tops.includes('almonds')) popAt(pop('almonds'), 0, -10, () => {
      for (const [ax, ay, r] of [[-28, -4, 0.6], [-14, -20, -0.4], [10, -24, 0.3], [26, -6, -0.7], [0, -10, 1.2], [-20, 6, 2]]) { ctx.save(); ctx.translate(ax, ay); ctx.rotate(r); inkEllipse(0, 0, 7, 3.6, 0, '#f4e0b8', 1.1); ctx.strokeStyle = 'rgba(160,110,50,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke(); ctx.restore(); }
    });
    if (tops.includes('sugar')) popAt(pop('sugar'), 0, -10, () => {
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(-18, -12, 12, 6, -0.4); ellipse(4, -22, 14, 6); ellipse(22, -10, 10, 5, 0.5);
      const R = rng(7); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) circle(-38 + R() * 76, -30 + R() * 34, 1.3 + R());
    });
  }
  function drawCustom(base, frost, tops, x, y, s = 1, grow = 1, popT = {}) {
    if (base !== 'cupcake') {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ({ donut: drawDonutC, cookie: drawCookieC, croissant: drawCroissantC })[base](frost, tops, grow, popOf(popT));
      ctx.restore(); return;
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ink(P2('M-28,40 L-34,4 L34,4 L28,40 Z'), '#fff0f6', 2.2);
    ctx.strokeStyle = '#ffb3d0'; ctx.lineWidth = 2.4; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 9, 7); ctx.lineTo(i * 7.6, 38); ctx.stroke(); }
    ink(P2('M-36,6 C-38,-22 38,-22 36,6 Z'), '#e8b070', 2.2);
    ctx.fillStyle = 'rgba(255,230,180,.6)'; ellipse(-12, -6, 12, 4, -0.2);
    if (frost && grow > 0) {
      const c = BC_FROST[frost];
      ctx.save(); ctx.translate(0, 8); ctx.scale(0.4 + grow * 0.6, grow); ctx.translate(0, -8);
      ink(P2('M-38,6 C-46,-8 -30,-18 -24,-14 C-28,-32 -6,-38 0,-30 C6,-44 28,-36 22,-18 C34,-20 44,-6 38,6 C20,12 -20,12 -38,6 Z'), c, 2.2);
      ctx.strokeStyle = mix(c, '#ffffff', 0.45); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26, -2); ctx.quadraticCurveTo(0, 4, 28, -4); ctx.moveTo(-12, -20); ctx.quadraticCurveTo(2, -14, 14, -22); ctx.stroke();
      ctx.restore();
      if (grow >= 1) {
        const pop = k => 1 + Math.sin(Math.min(1, (popT[k] || 0) / 0.3) * Math.PI) * 0.5;
        if (tops.includes('sprinkles')) {
          ctx.save(); ctx.translate(0, -12); ctx.scale(pop('sprinkles'), pop('sprinkles')); ctx.translate(0, 12);
          [[-26, -2, 0.4], [-16, -18, -0.6], [10, -24, 0.9], [24, -12, -0.3], [18, 2, 0.6], [-30, -10, 1.2], [-6, -4, 0.2], [0, -18, 1.4], [30, 0, 2], [-12, 2, 2.4], [8, -8, -1]].forEach(([sx, sy, r], i) => {
            ctx.save(); ctx.translate(sx, sy); ctx.rotate(r); ctx.fillStyle = BC_SPRINK[i % BC_SPRINK.length]; ctx.fillRect(-4.5, -1.8, 9, 3.6); ctx.restore();
          });
          ctx.restore();
        }
        const both = tops.includes('cherry') && tops.includes('star');
        if (tops.includes('star')) {
          const [sx, sy] = both ? [-20, -24] : [0, -40], p = pop('star');
          ctx.save(); ctx.translate(sx, sy); ctx.scale(p, p); ctx.rotate(Math.sin(S.t * 2) * 0.08); vecStar(0, 0, 13, '#ffd23a', 2); ctx.restore();
        }
        if (tops.includes('cherry')) {
          const p = pop('cherry');
          ctx.save(); ctx.translate(4, -38); ctx.scale(p, p);
          ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, -4); ctx.quadraticCurveTo(6, -16, 14, -18); ctx.stroke();
          inkCircle(0, 0, 9, '#ff2f4a', 2); ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(-3, -3, 2.6);
          ctx.restore();
        }
      }
    }
    ctx.restore();
  }

  // --- hand-drawn treats, centred on (x, y), about 90px across at s = 1 -------------------
  function drawTreat(k, x, y, s = 1) {
    if (k.startsWith('cc:')) { const c = ccParse(k); return drawCustom(c.base, c.frost, c.tops, x, y, s); }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (k === 'pinkdonut' || k === 'chocdonut') {
      const pink = k === 'pinkdonut';
      inkEllipse(0, 6, 44, 32, 0, '#e8a860', 2.4);
      ink(P2('M-38,0 C-42,-22 -20,-30 0,-30 C20,-30 42,-22 38,0 C36,10 30,6 26,14 C20,22 12,12 4,20 C-6,26 -10,14 -20,18 C-30,20 -34,10 -38,0 Z'), pink ? '#ff8fc0' : '#7a4a2a', 2.2);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-20, -16, 10, 5, -0.4);
      inkEllipse(0, -2, 12, 8, 0, '#c8844a', 2);
      ctx.fillStyle = '#a8683a'; ellipse(0, 0, 8, 4);
      if (pink) {
        [[-26, -8, 0.4], [-14, -22, -0.6], [12, -22, 0.9], [26, -10, -0.3], [20, 4, 0.6], [-22, 6, -0.9], [-4, 12, 0.2], [2, -20, 1.4], [30, -18, 2]].forEach(([sx, sy, r], i) => {
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(r); ctx.fillStyle = BC_SPRINK[i % 5]; ctx.fillRect(-4, -1.6, 8, 3.2); ctx.restore();
        });
      } else {
        ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(-30, -6); ctx.lineTo(-18, -22); ctx.lineTo(-10, 8); ctx.moveTo(10, -24); ctx.lineTo(18, 10); ctx.lineTo(30, -12); ctx.stroke();
      }
    } else if (k === 'cookie') {
      inkCircle(0, 0, 38, '#e8b868', 2.4);
      ctx.fillStyle = '#f4cc84'; ellipse(-8, -10, 20, 14, -0.4);
      ctx.fillStyle = '#5a3020';
      for (const [cx, cy, r] of [[-18, -12, 5], [6, -20, 4.5], [20, -2, 5.5], [-6, 4, 5], [-22, 14, 4], [12, 18, 5], [24, -20, 3.5]]) ellipse(cx, cy, r, r * 0.8, cx * 0.1);
      ctx.strokeStyle = 'rgba(160,100,40,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, -2); ctx.lineTo(-24, 2); ctx.moveTo(26, 14); ctx.lineTo(30, 8); ctx.stroke();
    } else if (k === 'croissant') {
      croissantShape();
    } else if (k === 'muffin') {
      ink(P2('M-30,40 L-36,4 L36,4 L30,40 Z'), '#c6a2ff', 2.2);
      ctx.strokeStyle = '#9a7ae0'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 9.5, 7); ctx.lineTo(i * 8, 38); ctx.stroke(); }
      ink(P2('M-42,8 C-50,-26 -22,-42 0,-40 C22,-42 50,-26 42,8 C22,14 -22,14 -42,8 Z'), '#d8984e', 2.2);
      ctx.fillStyle = 'rgba(255,230,180,.55)'; ellipse(-14, -24, 14, 7, -0.3);
      for (const [bx, by] of [[-24, -6], [-6, -26], [14, -14], [28, -2], [-2, 2], [20, -30], [-28, -20]]) { inkCircle(bx, by, 5.5, '#4a5ad0', 1.2); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(bx - 2, by - 2, 1.5); }
    } else if (k === 'cakeslice') {
      // a wedge of strawberry layer cake, seen from the side
      ink(P2('M-40,30 L40,30 L40,-10 L-40,-24 Z'), '#fff4e0', 2.2);
      ctx.fillStyle = '#ff8fb8'; ctx.fillRect(-38, 2, 76, 8); ctx.fillRect(-38, -12, 76, 5);
      ctx.fillStyle = '#f8e0b0'; ctx.fillRect(-38, 16, 76, 12);
      ink(P2('M-44,-24 C-30,-30 30,-18 44,-10 L44,-4 C30,-10 -30,-20 -44,-18 Z'), '#ffd0e4', 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.strokeRect(-40, -18, 80, 48);
      inkCircle(18, -24, 8, '#ff3a5a', 1.8); ctx.fillStyle = '#ffe0a0'; for (const [dx, dy] of [[-3, -2], [2, 2], [-1, 3]]) circle(18 + dx, -24 + dy, 1.2);
      ctx.fillStyle = '#5ab84a'; tri(14, -32, 22, -32, 18, -28);
    }
    ctx.restore();
  }
  // the cake box: open with its lid up, or closing and getting its ribbon (k 0..1)
  function closedBox(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkRect(-34, -40, 68, 40, '#ffd0e6', 2.2, 4);
    inkRect(-38, -48, 76, 12, '#ff9ac8', 2, 4);
    ctx.fillStyle = '#ff5fa2'; ctx.fillRect(-5, -48, 10, 48);
    ink(P2('M0,-48 C-18,-66 -26,-50 -4,-46 Z M0,-48 C18,-66 26,-50 4,-46 Z'), '#ff5fa2', 1.6);
    ctx.restore();
  }
  function coin(x, y, r = 10) {
    inkCircle(x, y, r, '#ffc83a', 1.6); ctx.fillStyle = '#ffe58a'; circle(x - r * 0.2, y - r * 0.2, r * 0.6);
    star(x, y, r * 0.55, '#e8a020', 5);
  }
  function bow(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ink(P2('M0,0 C-26,-24 -34,4 -4,4 Z M0,0 C26,-24 34,4 4,4 Z'), '#ff5fa2', 1.6);
    ink(P2('M-3,2 L-12,22 L-4,18 Z M3,2 L12,22 L4,18 Z'), '#ff5fa2', 1.2);
    inkCircle(0, 1, 5, '#ff8fc0', 1.4);
    ctx.restore();
  }

  const bcName = (k, n) => {
    if (k.startsWith('cc:')) {
      const c = ccParse(k), tops = c.tops.map(t => BC_TOP_WORD[t]);
      if (c.base === 'croissant') return `croissant with ${andList([`${c.frost} drizzle`].concat(tops))}`;
      return `${c.frost}${{ cupcake: '', donut: ' glazed', cookie: ' iced' }[c.base]} ${c.base} with ${andList(tops)}`;
    }
    return n === 1 ? BC_TREATS[k].one : BC_TREATS[k].many;
  };
  const bcSay = order => andList(order.map(o => `${NUM_WORDS[o.n]} ${bcName(o.k, o.n)}`)) + ', please!';
  const bcCap = s => s[0].toUpperCase() + s.slice(1);
  const bcCount = (g, k) => g.box.filter(b => b.k === k).length;

  // the decorating station takes over the display case while it's open
  const DS = { y: 326, h: 182, cake: [128, 470], btnX: 836 };

  MG.pipcounter = {
    kind: 'action', title: () => 'Bakery Counter', icon: () => '🧁',
    how: () => "Customers are coming in! Tap treats to put them in the box. If they want a special treat, tap Decorate and make it just like the picture. Then hand the box over before they get tired of waiting!",
    init(g) {
      const kinds = BC_KINDS[g.tier].concat('deco'), n = kinds.length;
      const gap = 10, tw = Math.min(190, (W - 36 - gap * (n - 1)) / n), x0 = (W - (tw * n + gap * (n - 1))) / 2;
      g.trays = kinds.map((k, i) => ({ k, x: x0 + i * (tw + gap), y: 334, w: tw, h: 166, bump: 0 }));
      // the station's piping bags and topping jars
      g.bags = BC_FROSTS[g.tier].map((c, i) => ({ c, x: 254 + i * 80, y: 352, w: 72, h: 148, sq: 0 }));
      g.baseTabs = BC_BASE_TIER[g.tier].map((b, i) => ({ b, x: 22 + i * 53, y: 332, w: 49, h: 46 }));
      this.setJars(g, 'cupcake');
      const total = [5, 6, 7][g.tier - 1];
      Object.assign(g, {
        total, served: 0, wrong: 0, missed: 0, ci: 0, box: [], msg: '', msgT: 0, endT: 0, bcState: 'walkin', coins: 0, flyCoins: [], hearts: [], wrapT: 0,
        deco: null, decoOpen: false, who: shuffle(BC_CUSTOMERS.slice()).slice(0, total),
      });
      g.say = 'Here comes a customer!';
      this.next(g);
    },
    makeOrder(g) {
      const kinds = BC_KINDS[g.tier];
      // the second customer always wants a special treat, so every game shows the station
      const custom = g.ci === 1 || (g.ci > 1 && Math.random() < [0.5, 0.55, 0.65][g.tier - 1]);
      let [maxTypes, maxEach, minTotal, maxTotal] = [[2, 2, 1, 3], [2, 3, 2, 4], [3, 3, 3, 5]][g.tier - 1];
      if (custom) { maxTypes--; maxTotal--; minTotal = Math.max(0, minTotal - 1); }
      let order = null;
      for (let tries = 0; tries < 60 && !order; tries++) {
        const types = g.ci === 0 ? 1 : randInt(custom ? (g.tier === 1 ? 0 : 1) : Math.min(2, maxTypes), maxTypes);
        const o = shuffle(kinds.slice()).slice(0, types).map(k => ({ k, n: randInt(1, maxEach) }));
        const sum = o.reduce((a, x) => a + x.n, 0);
        if (sum <= maxTotal && (sum >= minTotal || g.ci === 0)) order = o;
      }
      order = order || [{ k: kinds[0], n: 1 }];
      if (custom) {
        let k = null;
        // tier 1 is mostly cupcakes and donuts; tier 3 uses all four bases with two toppings
        while (!k || !k.startsWith('cc:')) {
          const base = pick(BC_BASE_TIER[g.tier]);
          k = ccKey(base, pick(BC_FROSTS[g.tier]), shuffle(this.topsFor(g, base)).slice(0, g.tier === 3 ? 2 : 1));
        }
        order.unshift({ k, n: 1, custom: true });
      }
      return order;
    },
    next(g) {
      g.decoOpen = false; g.deco = null;
      if (g.ci >= g.total) { g.bcState = 'end'; g.endT = 1.6; g.cust = null; return; }
      const order = this.makeOrder(g), items = order.reduce((a, o) => a + o.n, 0), customs = order.filter(o => o.custom).length;
      const max = [30, 24, 19][g.tier - 1] + items * [2, 1.5, 1.2][g.tier - 1] + customs * [12, 10, 9][g.tier - 1];
      g.cust = { name: g.who[g.ci], x: -90, dir: 1, order, max, patience: max, happy: false, walk: 0, huff: 0 };
      g.box = []; g.bcState = 'walkin';
    },
    msg(g, s, sayIt = true) { g.msg = s; g.msgT = 2.4; if (sayIt) speak(s); },
    put(g, k, fx, fy) {
      if (g.box.length >= 6) { SFX.miss(); this.msg(g, 'The box is full!'); return false; }
      g.box.push({ k, fly: 0.35, fx, fy });
      if (g.tier === 1 && !g.cust.order.some(o => o.k === k)) {
        // little ones get a nudge right away if they put in something that isn't on the order
        this.msg(g, `Hmm, ${g.cust.name.split(' ')[0]} didn't ask for that one.`);
      }
      return true;
    },
    add(g, tr) {
      tr.bump = 0.25;
      if (tr.k === 'deco') {
        const want = g.cust.order.find(o => o.custom && bcCount(g, o.k) < o.n);
        g.decoOpen = true; g.deco = g.deco || this.newDeco(g, want ? ccParse(want.k).base : 'cupcake'); SFX.click(); return;
      }
      if (this.put(g, tr.k, tr.x + tr.w / 2, tr.y + 70)) SFX.pop();
    },
    slot(i) {
      // front row first (lower), then the back row
      const col = i % 3, row = Math.floor(i / 3);
      return [BC_BOX.x + 38 + col * 60 + row * 14, BC_BOX.y + 62 - row * 24];
    },
    give(g) {
      const c = g.cust;
      const extra = g.box.find(b => !c.order.some(o => o.k === b.k));
      const short = c.order.find(o => bcCount(g, o.k) < o.n), over = c.order.find(o => bcCount(g, o.k) > o.n);
      if (!extra && !short && !over) {
        g.served++; g.decoOpen = false;
        const quick = c.patience > c.max * 0.5;
        c.happy = true; c.quick = quick; g.bcState = 'wrap'; g.wrapT = BC_WRAP;
        tone(660, 0.12, 'triangle', 0.08); tone(880, 0.16, 'triangle', 0.07, 0.12);
        speak(pick(['Yummy, thank you!', 'Perfect, thank you!', 'Hooray, just right!', 'Thank you, Aubrey!']));
        return;
      }
      g.wrong++; SFX.miss();
      c.patience = Math.max(1.5, c.patience - c.max * 0.15); c.huff = 0.6;
      if (extra) this.msg(g, `I didn't ask for a ${bcName(extra.k, 1)}!`);
      else if (short) this.msg(g, `I need ${NUM_WORDS[short.n]} ${bcName(short.k, short.n)}!`);
      else this.msg(g, `Too many! Just ${NUM_WORDS[over.n]} ${bcName(over.k, over.n)}, please.`);
    },
    topsFor(g, base) { return BC_BASES[base].tops.slice(0, g.tier === 1 ? 2 : 3); },
    setJars(g, base) { g.jars = this.topsFor(g, base).map((t, i) => ({ t, x: 588 + i * 80, y: 352, w: 72, h: 148, sq: 0 })); },
    newDeco(g, base) { this.setJars(g, base); return { base, frost: null, tops: [], grow: 0, popT: {} }; },
    // the decorating station: pick a base, a colour coat, add toppings, then box it
    decoInput(g, id) {
      const d = g.deco;
      if (pointer.clicked) {
        const bag = g.bags.find(b => inRect(b)), jar = g.jars.find(j => inRect(j)), tab = g.baseTabs.find(t => inRect(t));
        if (tab) { if (tab.b !== d.base) { g.deco = this.newDeco(g, tab.b); SFX.click(); } }
        else if (bag) {
          bag.sq = 0.3; d.frost = bag.c; d.grow = 0; d.tops = []; d.popT = {};
          tone(300, 0.35, 'sine', 0.08, 0, 700);
        } else if (jar) {
          jar.sq = 0.3;
          if (!d.frost) { SFX.miss(); this.msg(g, `Pick a ${BC_BASES[d.base].coat.toLowerCase()} colour first!`); }
          else if (d.tops.includes(jar.t)) { d.tops = d.tops.filter(t => t !== jar.t); SFX.blip(); }
          else { d.tops.push(jar.t); d.popT[jar.t] = 0.3; SFX.pop(); burst(DS.cake[0], DS.cake[1] - 70, 6, { spread: 80, up: 60 }); }
        }
      }
      if (id === 'bc:dreset') { g.deco = this.newDeco(g, d.base); SFX.blip(); }
      if (id === 'bc:dback') g.decoOpen = false;
      if (id === 'bc:dbox') {
        if (!d.frost) { SFX.miss(); this.msg(g, `Pick a ${BC_BASES[d.base].coat.toLowerCase()} colour first!`); }
        else if (this.put(g, ccKey(d.base, d.frost, d.tops), DS.cake[0], DS.cake[1] - 30)) {
          SFX.sparkle(); g.deco = null; g.decoOpen = false;
        }
      }
    },
    update(g, dt, id) {
      g.msgT -= dt;
      for (const b of g.box) b.fly = Math.max(0, b.fly - dt);
      for (const tr of g.trays) tr.bump = Math.max(0, tr.bump - dt);
      for (const b of g.bags.concat(g.jars)) b.sq = Math.max(0, b.sq - dt);
      if (g.deco) { g.deco.grow = Math.min(1, g.deco.grow + dt / 0.4); for (const k in g.deco.popT) g.deco.popT[k] = Math.max(0, g.deco.popT[k] - dt); }
      // tip coins fly to the jar; hearts float up
      for (const f of g.flyCoins) { f.t += dt; if (f.t >= 0.65 && !f.landed) { f.landed = true; g.coins++; tone(1300 + (g.coins % 5) * 120, 0.08, 'triangle', 0.07); } }
      g.flyCoins = g.flyCoins.filter(f => f.t < 0.75);
      for (const h of g.hearts) { h.t += dt; h.y -= 60 * dt; }
      g.hearts = g.hearts.filter(h => h.t < 1.4);
      const c = g.cust;
      if (c) { c.walk += dt; c.huff = Math.max(0, c.huff - dt); }
      if (g.bcState === 'end') { if ((g.endT -= dt) <= 0) g.done = true; }
      else if (g.bcState === 'walkin') {
        c.x += 280 * dt;
        if (c.x >= BC_STAND) { c.x = BC_STAND; g.bcState = 'order'; g.say = bcSay(c.order); speak(g.say); }
      } else if (g.bcState === 'order') {
        c.patience -= dt;
        if (g.decoOpen) this.decoInput(g, id);
        else {
          if (pointer.clicked) { const tr = g.trays.find(t => inRect(t)); if (tr) this.add(g, tr); }
          g.trays.forEach((tr, i) => { if (pressed[String(i + 1)]) this.add(g, tr); });
        }
        if (pointer.clicked) {
          const bi = g.box.findIndex((b, i) => { const [sx, sy] = this.slot(i); return Math.abs(pointer.x - sx) < 30 && Math.abs(pointer.y - sy) < 28; });
          if (bi >= 0) { g.box.splice(bi, 1); SFX.blip(); }
        }
        if ((pressed.backspace || pressed.delete) && g.box.length) { g.box.pop(); SFX.blip(); }
        if (id === 'bc:give' || (pressed.enter && g.box.length)) this.give(g);
        if (g.bcState === 'order' && c.patience <= 0) {
          g.missed++; g.bcState = 'leave'; c.happy = false; g.decoOpen = false; SFX.fail();
          floatText(c.x + 60, 190, 'Too slow...', '#ffb0c4', false, 24);
          speak('Oh no! They got tired of waiting.');
        }
      } else if (g.bcState === 'wrap') {
        // the lid comes down and the ribbon gets tied, then the customer takes it and pays
        if ((g.wrapT -= dt) <= 0) {
          g.box = []; g.bcState = 'leave';
          SFX.sparkle(); burst(c.x, 180, 22, { colors: ['#ffb3e0', '#fff6a8', '#ff6fb5'] });
          floatText(c.x + 60, 190, c.quick ? 'Super speedy!' : 'Yum!', '#fff6a8', false, 26);
          for (let i = 0; i < (c.quick ? 3 : 2); i++) g.flyCoins.push({ x0: c.x + 20, y0: 200, t: -i * 0.15 });
          for (let i = 0; i < 5; i++) g.hearts.push({ x: c.x + rand(-40, 40), y: 170 + rand(-10, 20), t: -i * 0.12, col: pick(['#ff6fb5', '#ff9ac8', '#ffb3d0']) });
        }
      } else if (g.bcState === 'leave') {
        c.dir = -1; c.x -= 300 * dt;
        if (c.x < -110) { g.ci++; this.next(g); if (g.cust) g.say = 'Here comes the next customer!'; }
      }
      g.progress = `Served ${g.served} of ${g.total}`;
      g.score = clamp(g.served / g.total - 0.04 * g.wrong, 0, 1);
    },

    // --------------------------------------------------------------------------- drawing
    drawLamp(x, len) {
      const sw = Math.sin(S.t * 1.3 + x) * 0.05;
      ctx.save(); ctx.translate(x, 58); ctx.rotate(sw);
      const gl = ctx.createRadialGradient(0, len + 14, 4, 0, len + 30, 110);
      gl.addColorStop(0, 'rgba(255,240,170,.55)'); gl.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = gl; circle(0, len + 30, 110);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
      ink(P2(`M-24,${len + 22} C-24,${len - 2} 24,${len - 2} 24,${len + 22} Z`), '#5fb8a0', 2);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(-10, len + 8, 4, 8, 0.4);
      inkCircle(0, len + 24, 6, '#fff6a8', 1.2);
      ctx.restore();
    },
    drawRoom(g) {
      // striped wallpaper with a wooden wainscot
      ctx.fillStyle = '#ffe9f0'; ctx.fillRect(0, 60, W, BC_COUNTER - 60);
      ctx.fillStyle = '#ffdbe8'; for (let x = 0; x < W; x += 52) ctx.fillRect(x, 60, 26, BC_COUNTER - 60);
      for (let y = 120; y < 230; y += 52) for (let x = (y / 52) % 2 ? 39 : 13; x < W; x += 52) heart(x, y, 9, 'rgba(255,140,170,.28)');
      ctx.fillStyle = '#e8b890'; ctx.fillRect(0, 236, W, BC_COUNTER - 236);
      ctx.fillStyle = '#c98a5a'; ctx.fillRect(0, 230, W, 7);
      ctx.strokeStyle = 'rgba(122,74,40,.35)'; ctx.lineWidth = 2; for (let x = 10; x < W; x += 70) ctx.strokeRect(x, 244, 52, 48);
      // bunting
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 64); ctx.quadraticCurveTo(W / 2, 88, W, 64); ctx.stroke();
      for (let i = 0; i < 20; i++) {
        const x = 12 + i * 49, y = 64 + Math.sin((x / W) * Math.PI) * 12, sw = Math.sin(S.t * 2 + i) * 2;
        ink(P2(`M${x - 12},${y} L${x + 12},${y} L${x + sw},${y + 20} Z`), ['#ff8fc0', '#ffd23a', '#8ad4ff', '#9ce08a', '#c6a2ff'][i % 5], 1.4);
      }
      // the door: open to a sunny street
      inkRect(18, 104, 150, 196, '#a8683a', 2.5, 6);
      ctx.fillStyle = '#bfe8ff'; ctx.fillRect(30, 116, 126, 184);
      ctx.fillStyle = '#9ce08a'; ctx.fillRect(30, 250, 126, 50);
      ctx.fillStyle = '#7acc6a'; ellipse(60, 252, 30, 12); ellipse(130, 254, 34, 12);
      ctx.fillStyle = '#ffffff'; const cx = 40 + ((S.t * 8) % 150); ellipse(cx, 150, 22, 9); ellipse(cx + 18, 144, 16, 9);
      ctx.fillStyle = '#ffd23a'; circle(140, 134, 10);
      ink(P2('M30,116 L68,128 L68,300 L30,300 Z'), '#ffb3d0', 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(38, 140, 6, 100);
      inkCircle(60, 214, 4, '#ffd23a', 1.2);
      inkRect(88, 120, 56, 22, '#fff8ec', 1.6, 4); text('OPEN', 116, 131, 12, '#d0407a', 'center', 800);
      // bread shelf behind the box
      inkRect(604, 158, 200, 10, '#a0683a', 2, 3);
      for (const x of [616, 792]) { ctx.fillStyle = '#8a5a3a'; tri(x - 8, 168, x + 8, 168, x, 182); }
      for (const [x, k] of [[630, 0], [676, 1], [724, 0], [772, 1]]) {
        if (k) { inkEllipse(x, 144, 22, 14, 0, '#d89048', 1.8); ctx.strokeStyle = 'rgba(255,230,180,.8)'; ctx.lineWidth = 2; for (const d of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(x + d - 4, 138); ctx.lineTo(x + d + 4, 150); ctx.stroke(); } }
        else { inkRect(x - 18, 126, 36, 32, '#e8a860', 1.8, 12); ctx.fillStyle = 'rgba(255,240,200,.6)'; ellipse(x - 4, 134, 9, 4); }
      }
      // the chalkboard menu
      inkRect(832, 92, 116, 92, '#a0683a', 2.5, 6);
      rrect(840, 100, 100, 76, 3, '#2f4a42');
      text('MENU', 890, 112, 13, '#ffffff', 'center', 800);
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(852, 121); ctx.lineTo(928, 121); ctx.stroke();
      ctx.strokeStyle = '#ffb3d0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(858, 138, 7, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(858, 160, 7, 0, TAU); ctx.stroke();
      text('donuts', 872, 138, 11, '#ffb3d0', 'left', 700); text('cupcakes', 872, 160, 11, '#c8f0b0', 'left', 700);
      ctx.fillStyle = '#fff'; ctx.fillRect(900, 178, 14, 4);
      this.drawLamp(270, 28); this.drawLamp(704, 34);
    },
    drawCounter(g) {
      // the wooden counter top with grain, and the glass display case below it
      inkRect(-10, BC_COUNTER, W + 20, 22, '#c98a5a', 2.5, 4);
      ctx.strokeStyle = 'rgba(120,70,30,.35)'; ctx.lineWidth = 1.5;
      for (const [y, o] of [[305, 0], [311, 40], [316, 90]]) { ctx.beginPath(); for (let x = -10; x <= W + 10; x += 20) ctx.lineTo(x, y + Math.sin((x + o) / 60) * 1.6); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(0, BC_COUNTER + 3, W, 3);
      inkRect(-10, BC_COUNTER + 22, W + 20, H - BC_COUNTER, '#e0a878', 2.5, 0);
      ctx.strokeStyle = 'rgba(122,74,40,.3)'; ctx.lineWidth = 2; for (let x = 40; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 512); ctx.lineTo(x, H); ctx.stroke(); }
      inkRect(4, 322, W - 8, 192, 'rgba(225,245,255,.7)', 2.5, 12);
      inkRect(4, 318, W - 8, 8, '#e8c060', 1.8, 4);
    },
    drawGlass() {
      // soft diagonal reflections across the case glass
      ctx.save(); ctx.beginPath(); ctx.roundRect(4, 322, W - 8, 192, 12); ctx.clip();
      const sh = (Math.sin(S.t * 0.7) + 1) * 0.04;
      ctx.fillStyle = `rgba(255,255,255,${0.16 + sh})`;
      for (const x of [60, 420, 760]) { ctx.beginPath(); ctx.moveTo(x, 322); ctx.lineTo(x + 30, 322); ctx.lineTo(x - 50, 514); ctx.lineTo(x - 80, 514); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = `rgba(255,255,255,${0.1 + sh})`;
      for (const x of [110, 470, 810]) { ctx.beginPath(); ctx.moveTo(x, 322); ctx.lineTo(x + 10, 322); ctx.lineTo(x - 70, 514); ctx.lineTo(x - 80, 514); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    },
    drawTrays(g) {
      g.trays.forEach((tr, i) => {
        const deco = tr.k === 'deco';
        const hover = g.bcState === 'order' && inRect(tr), lift = tr.bump > 0 ? -Math.sin(tr.bump / 0.25 * Math.PI) * 8 : hover ? -3 : 0;
        // the decorate tray glows when the order wants a special treat
        const want = deco && g.bcState === 'order' && g.cust?.order.some(o => o.custom && bcCount(g, o.k) < o.n);
        if (want) { ctx.save(); ctx.shadowColor = '#ff6fb5'; ctx.shadowBlur = 14 + Math.sin(S.t * 6) * 8; rrect(tr.x, tr.y + lift, tr.w, tr.h, 18, '#ffffff'); ctx.restore(); }
        rrect(tr.x, tr.y + lift, tr.w, tr.h, 18, deco ? (hover ? '#f6eaff' : '#efe0ff') : hover ? '#fffdf4' : '#fff6ea', OL, 2.5);
        const cx = tr.x + tr.w / 2, cy = tr.y + 76 + lift;
        if (deco) {
          drawCustom('donut', null, [], cx - 22, cy + 8, 0.5); drawCustom('cupcake', null, [], cx - 2, cy - 6, 0.66);
          // a little piping bag leaning in
          ctx.save(); ctx.translate(cx + 30, cy - 30); ctx.rotate(0.6 + Math.sin(S.t * 3) * 0.08);
          ink(P2('M-12,-26 L12,-26 L3,18 L-3,18 Z'), '#ff9ac8', 1.6); inkRect(-13, -32, 26, 8, '#ffffff', 1.4, 3); ctx.restore();
          text('Decorate', cx, tr.y + 128 + lift, 16, '#7a3aa0', 'center', 800);
          text('a treat', cx, tr.y + 146 + lift, 13, '#7a3aa0', 'center', 700);
        } else {
          ctx.fillStyle = '#ffffff'; for (let a = 0; a < 16; a++) circle(cx + Math.cos(a / 16 * TAU) * 46, cy + Math.sin(a / 16 * TAU) * 22, 9);
          ellipse(cx, cy, 46, 22);
          drawTreat(tr.k, cx - 14, cy - 12, 0.6);
          drawTreat(tr.k, cx + 14, cy - 6, 0.7);
          const lines = wrap(bcCap(BC_TREATS[tr.k].one), tr.w - 14, 16, 800);
          lines.forEach((l, j) => text(l, cx, tr.y + 132 + lift + (j - (lines.length - 1) / 2) * 18, 16, '#5a2a6e', 'center', 800));
        }
        inkCircle(tr.x + 18, tr.y + 18 + lift, 12, deco ? '#9a6ae0' : '#ff6fb5', 1.4); text(String(i + 1), tr.x + 18, tr.y + 18 + lift, 13, '#fff', 'center', 800);
      });
    },
    drawStation(g) {
      const d = g.deco;
      rrect(10, DS.y, W - 20, DS.h, 14, '#eafaf2', OL, 2.5);
      ctx.fillStyle = 'rgba(160,220,190,.35)'; for (let x = 20; x < W - 20; x += 36) ctx.fillRect(x, DS.y + 4, 16, DS.h - 8);
      // the cupcake on its spinning stand
      const [kx, ky] = DS.cake;
      inkEllipse(kx, ky + 26, 82, 14, 0, '#ffffff', 2);
      ctx.strokeStyle = 'rgba(255,140,190,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -S.t * 20; ctx.beginPath(); ctx.ellipse(kx, ky + 26, 70, 9, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      drawCustom(d.base, d.frost, d.tops, kx, ky - 26, 1.12, d.grow, d.popT);
      // the base tabs: which treat are we decorating?
      for (const t of g.baseTabs) {
        const on = d.base === t.b;
        rrect(t.x, t.y, t.w, t.h, 10, on ? '#fff6c8' : 'rgba(255,255,255,.8)', on ? '#ff6fb5' : OL, on ? 3.5 : 1.8);
        drawCustom(t.b, null, [], t.x + t.w / 2, t.y + t.h / 2 + (t.b === 'cupcake' ? 0 : 3), 0.38);
      }
      // piping bags
      text(BC_BASES[d.base].coat, 254 + g.bags.length * 40 - 4, DS.y + 14, 14, '#2f7a5a', 'center', 800);
      for (const b of g.bags) {
        const on = d.frost === b.c, hov = inRect(b), sq = b.sq > 0 ? Math.sin(b.sq / 0.3 * Math.PI) : 0;
        rrect(b.x, b.y, b.w, b.h, 14, on ? '#fff6c8' : hov ? '#ffffff' : 'rgba(255,255,255,.75)', on ? '#ff6fb5' : OL, on ? 4 : 2);
        ctx.save(); ctx.translate(b.x + b.w / 2, b.y + 62); ctx.scale(1 + sq * 0.15, 1 - sq * 0.12);
        ink(P2('M-24,-36 L24,-36 L6,30 L-6,30 Z'), BC_FROST[b.c], 2);
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-10, -16, 4, 12, 0.2);
        inkRect(-26, -46, 52, 12, '#ffffff', 1.6, 4);
        ink(P2('M-6,30 L6,30 L0,42 Z'), '#d8d8e8', 1.4);
        ctx.restore();
        text(bcCap(b.c === 'chocolate' ? 'choco' : b.c), b.x + b.w / 2, b.y + b.h - 22, 14, '#5a2a6e', 'center', 800);
      }
      // topping jars
      text('Toppings', 588 + g.jars.length * 40 - 4, DS.y + 14, 14, '#2f7a5a', 'center', 800);
      for (const j of g.jars) {
        const on = d.tops.includes(j.t), hov = inRect(j), sq = j.sq > 0 ? Math.sin(j.sq / 0.3 * Math.PI) : 0;
        rrect(j.x, j.y, j.w, j.h, 14, on ? '#fff6c8' : hov ? '#ffffff' : 'rgba(255,255,255,.75)', on ? '#ff6fb5' : OL, on ? 4 : 2);
        const jx = j.x + j.w / 2, jy = j.y + 20 - sq * 6;
        inkRect(jx - 26, jy + 6, 52, 64, 'rgba(230,245,255,.85)', 2, 10);
        inkRect(jx - 29, jy - 2, 58, 12, '#ff8fb8', 1.6, 4);
        if (j.t === 'sprinkles') { for (let i = 0; i < 18; i++) { ctx.save(); ctx.translate(jx - 18 + (i * 13) % 36, jy + 26 + (i * 7) % 40); ctx.rotate(i); ctx.fillStyle = BC_SPRINK[i % 6]; ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); } }
        else if (j.t === 'cherry') { for (const [dx, dy] of [[-10, 52], [10, 54], [0, 36], [-12, 30], [12, 32]]) { inkCircle(jx + dx, jy + dy, 8, '#ff2f4a', 1.2); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(jx + dx - 3, jy + dy - 3, 2); } }
        else if (j.t === 'star') for (const [dx, dy] of [[-10, 52], [10, 50], [0, 32]]) vecStar(jx + dx, jy + dy, 10, '#ffd23a', 1.4);
        else if (j.t === 'candy') { [[-12, 54, '#ff5a6a'], [0, 56, '#5fd0ff'], [12, 54, '#ffe14a'], [-6, 42, '#7ae08a'], [8, 42, '#c69aff'], [0, 30, '#ff9a3a']].forEach(([dx, dy, col]) => inkCircle(jx + dx, jy + dy, 6, col, 1.1)); }
        else if (j.t === 'drizzle') { rrect(jx - 23, jy + 34, 46, 34, 8, '#fffaf0'); inkLine([[jx - 18, jy + 30], [jx - 8, jy + 18], [jx, jy + 30], [jx + 8, jy + 18], [jx + 18, jy + 30]], '#fffaf0', 3); }
        else if (j.t === 'chips') { for (let i = 0; i < 9; i++) { ctx.save(); ctx.translate(jx - 14 + (i % 3) * 14, jy + 58 - Math.floor(i / 3) * 13); ink(P2('M0,-6 C5,0 5,5 0,5 C-5,5 -5,0 0,-6 Z'), '#5a3020', 1); ctx.restore(); } }
        else if (j.t === 'heart') { for (const [dx, dy, sz] of [[-10, 40, 20], [10, 44, 18], [0, 22, 22]]) heart(jx + dx, jy + dy, sz, '#ff4a7a'); }
        else if (j.t === 'sugar') { ink(P2(`M${jx - 22},${jy + 68} C${jx - 18},${jy + 40} ${jx + 18},${jy + 40} ${jx + 22},${jy + 68} Z`), '#ffffff', 1.2); ctx.fillStyle = 'rgba(200,200,220,.6)'; for (let i = 0; i < 8; i++) circle(jx - 14 + (i * 9) % 28, jy + 50 + (i * 5) % 16, 1.2); }
        else if (j.t === 'almonds') { for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(jx - 14 + (i % 3) * 14, jy + 58 - Math.floor(i / 3) * 12); ctx.rotate(i * 0.9); inkEllipse(0, 0, 7, 3.6, 0, '#f4e0b8', 1.1); ctx.restore(); } }
        else if (j.t === 'jam') { rrect(jx - 23, jy + 26, 46, 42, 8, '#e8243a'); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(jx - 18, jy + 30, 5, 30); }
        text(bcCap(BC_TOP_SHORT[j.t] || j.t), jx, j.y + j.h - 22, 14, '#5a2a6e', 'center', 800);
        if (on) text('✅', j.x + j.w - 12, j.y + 12, 16, '#000', 'center');
      }
      button('bc:dbox', DS.btnX, 336, 108, 74, 'Box it!', { on: !!d.frost, color: '#5fb87a', size: 20 });
      button('bc:dreset', DS.btnX, 418, 108, 40, 'Start over', { color: '#ff9a3a', size: 15 });
      button('bc:dback', DS.btnX, 464, 108, 40, 'Back', { color: '#9a6ae0', size: 15 });
    },
    drawBox(g) {
      const B = BC_BOX;
      const wrapping = g.bcState === 'wrap', k = wrapping ? 1 - g.wrapT / BC_WRAP : 0;
      // the lid stands open behind the box, and swings shut while wrapping
      const lidK = clamp(k / 0.45, 0, 1);
      if (lidK < 1) ink(P2(`M${B.x},${B.y + 30} L${B.x + 16},${B.y - 30 * (1 - lidK)} L${B.x + B.w - 16},${B.y - 30 * (1 - lidK)} L${B.x + B.w},${B.y + 30} Z`), '#ffb3d6', 2);
      inkRect(B.x, B.y + 26, B.w, B.h - 26, '#f4b8d0', 2.5, 4);
      ctx.fillStyle = '#e8a0c0'; ctx.fillRect(B.x + 3, B.y + 29, B.w - 6, 10);
      // back row first so the front row sits in front of it
      g.box.map((b, i) => [b, i]).sort((a, b) => (b[1] >= 3) - (a[1] >= 3)).forEach(([b, i]) => {
        const [sx, sy] = this.slot(i), f = b.fly / 0.35;
        const x = lerp(sx, b.fx, f), y = lerp(sy, b.fy, f) - Math.sin(f * Math.PI) * 90;
        drawTreat(b.k, x, y, 0.5);
      });
      inkRect(B.x - 4, B.y + B.h - 28, B.w + 8, 28, '#ffd0e6', 2.5, 4);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(B.x + 4, B.y + B.h - 24, B.w - 8, 4);
      ctx.fillStyle = '#ff9ac8'; ctx.fillRect(B.x + B.w / 2 - 6, B.y + B.h - 27, 12, 26);
      if (lidK > 0) {
        // the lid comes down over the treats, then a ribbon wraps round and a bow pops on
        const ly = lerp(B.y - 40, B.y + 22, lidK);
        inkRect(B.x - 6, ly, B.w + 12, (B.y + B.h) - ly, '#ffd0e6', 2.5, 6);
        inkRect(B.x - 10, ly - 4, B.w + 20, 16, '#ff9ac8', 2.2, 5);
        const rk = clamp((k - 0.45) / 0.3, 0, 1);
        if (rk > 0) {
          ctx.fillStyle = '#ff5fa2';
          ctx.fillRect(B.x + B.w / 2 - 7, ly - 4, 14, ((B.y + B.h) - ly + 4) * rk);
          ctx.fillRect(B.x + B.w / 2 - (B.w / 2 + 6) * rk, ly + 30, (B.w + 12) * rk, 12);
        }
        const bk = clamp((k - 0.75) / 0.25, 0, 1);
        if (bk > 0) bow(B.x + B.w / 2, ly - 4, 1.4 * (bk < 1 ? 0.6 + Math.sin(bk * Math.PI) * 0.6 + bk * 0.4 : 1));
      }
    },
    drawJar(g) {
      const [x, y] = BC_JAR;
      ink(P2(`M${x - 24},${y} L${x - 26},${y - 34} C${x - 26},${y - 40} ${x + 26},${y - 40} ${x + 26},${y - 34} L${x + 24},${y} Z`), 'rgba(230,245,255,.85)', 2);
      for (let i = 0; i < Math.min(g.coins, 12); i++) coin(x - 14 + (i % 3) * 14, y - 8 - Math.floor(i / 3) * 7, 7);
      inkRect(x - 22, y - 44, 44, 9, '#a0683a', 1.6, 3);
      text(`TIPS ${g.coins}`, x, y - 52, 11, '#8a4a2a', 'center', 800);
      for (const f of g.flyCoins) {
        if (f.t < 0) continue;
        const k = Math.min(1, f.t / 0.65);
        coin(lerp(f.x0, x, k), lerp(f.y0, y - 30, k) - Math.sin(k * Math.PI) * 120, 10);
      }
    },
    draw(g) {
      this.drawRoom(g);
      const c = g.cust;
      // the customer, behind the counter
      if (c) {
        const bob = g.bcState === 'walkin' || g.bcState === 'leave' ? Math.abs(Math.sin(c.walk * 11)) * 8 : 0;
        const shake = c.huff > 0 ? Math.sin(c.huff * 60) * 5 : 0;
        if (!drawCritter(c.name, c.x + shake, 316 - bob, 0.82, c.dir)) emoji('🐰', c.x, 220, 90);
        if (g.bcState === 'leave' && c.happy) closedBox(c.x + 34 * c.dir, BC_COUNTER - 4 - bob, 0.8);
      }
      this.drawCounter(g);
      if (g.decoOpen && g.deco) this.drawStation(g);
      else { this.drawTrays(g); this.drawGlass(); }
      this.drawBox(g);
      this.drawJar(g);
      button('bc:give', 814, 176, 132, 58, 'Give!', { on: g.bcState === 'order' && g.box.length > 0, icon: '🎁', color: '#5fb87a', size: 24 });
      if (c && g.bcState === 'order') this.drawOrder(g, c);
      if (g.msgT > 0 && c) {
        const lines = wrap(g.msg, 262, 16, 800), my = 66 + 30 + c.order.length * 46 + 34 + 6;
        rrect(316, my, 276, lines.length * 20 + 12, 12, 'rgba(255,248,252,.97)', '#ff6fb5', 3);
        lines.forEach((l, i) => text(l, 454, my + 16 + i * 20, 16, '#c0306a', 'center', 800));
      }
      for (const h of g.hearts) { if (h.t < 0) continue; ctx.globalAlpha = clamp(1.4 - h.t, 0, 1); heart(h.x + Math.sin(h.t * 6) * 8, h.y, 22, h.col); }
      ctx.globalAlpha = 1;
      if (g.bcState === 'end') outlined('All the customers are happy!', W / 2, 190, 34, '#fff6a8');
    },
    drawOrder(g, c) {
      const bx = 316, by = 66, bw = 276, rows = c.order.length, bh = 30 + rows * 46 + 34;
      // a soft shadow, the tail to the customer, then the bubble with a name tab
      ctx.save(); ctx.shadowColor = 'rgba(90,40,110,.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3; rrect(bx, by, bw, bh, 20, '#ffffff'); ctx.restore();
      ink(P2(`M${bx + 6},${by + bh - 40} L${c.x + 44},${by + bh + 14} L${bx + 14},${by + bh - 14} Z`), '#ffffff', 2);
      rrect(bx, by, bw, bh, 20, '#ffffff', OL, 2.5);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + 3, by + bh - 40, 16, 28);
      ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, 26, [20, 20, 0, 0]); ctx.clip();
      ctx.fillStyle = '#ffe0ee'; ctx.fillRect(bx, by, bw, 26);
      ctx.fillStyle = '#ffd0e4'; for (let x = bx; x < bx + bw; x += 20) ctx.fillRect(x, by, 10, 26);
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, by + 26); ctx.lineTo(bx + bw, by + 26); ctx.stroke();
      text(`${c.name.split(' ')[0]}'s order`, bx + bw / 2, by + 14, 14, '#a0306a', 'center', 800);
      c.order.forEach((o, i) => {
        const y = by + 52 + i * 46;
        if (o.custom) rrect(bx + 8, y - 22, bw - 16, 44, 12, '#f6eaff');
        outlined(String(o.n), bx + 28, y, 32, '#ff6fb5', 'center', '#5a2a6e');
        // tier 1: one picture per treat to count; higher tiers: one picture and the name
        const pics = g.tier === 1 && !o.custom ? o.n : 1;
        for (let p = 0; p < pics; p++) drawTreat(o.k, bx + 78 + p * 50, y + (o.custom ? 6 : 2), o.custom ? 0.5 : 0.44);
        if (o.custom) {
          const cc = ccParse(o.k);
          text(`Decorate a ${cc.base}:`, bx + 110, y - 9, 12, '#7a3aa0', 'left', 800);
          text(`${cc.frost === 'chocolate' ? 'choco' : cc.frost} + ${cc.tops.map(t => BC_TOP_SHORT[t] || t).join(' + ')}`, bx + 110, y + 9, 13, '#5a2a6e', 'left', 800);
        } else if (g.tier > 1) text(bcName(o.k, o.n), bx + 110, y, 15, '#5a2a6e', 'left', 800);
        if (g.tier === 1 && bcCount(g, o.k) === o.n) text('✅', bx + bw - 24, y, 20, '#000', 'center');
      });
      // patience: a bar that drains from green to red, and a face that gets grumpier
      const k = clamp(c.patience / c.max, 0, 1), col = k > 0.5 ? '#5fc87a' : k > 0.25 ? '#ffc23a' : '#ff5a6a';
      const py = by + bh - 24;
      rrect(bx + 44, py - 8, bw - 60, 16, 8, '#f0e4f4', OL, 1.5);
      rrect(bx + 46, py - 6, (bw - 64) * k, 12, 6, col);
      emoji(k > 0.5 ? '😊' : k > 0.25 ? '😐' : '😟', bx + 24, py, 22);
    },
  };

  restage('bakery', {
    games: [['pipcounter', 'ribbon', {}], ['bakewithpip', 'berry', {}]],
    intro: [
      "N:Oh, Aubrey, thank goodness! It's party day, and the whole village is lining up at my counter!",
      'N:Fill each box with the treats they ask for. And if someone wants a special treat, decorate it just like their picture!',
      'A:determined:I got this!',
    ],
  });
}
