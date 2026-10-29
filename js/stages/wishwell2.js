'use strict';
// The Wishing Well, game 2: Wish Market. Aubrey has a purse of coins and a shopping list, and walks the
// market street comparing prices. Some things are sold at only one stall; others at two or three stalls
// for different prices. Anything can be sold back (at a stall that sells it) for exactly what she paid.
{
  const TAU = Math.PI * 2;
  const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
  const glow = (x, y, r, col, a = 0.5) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // --- US coins (same look as the old Coin Count) -----------------------------------------
  // [value, radius, name, gradient colours, ink]
  const USC = { penny: [1, 26, 'penny', ['#f0b07a', '#b8642e'], '#5a2408'], nickel: [5, 31, 'nickel', ['#eef0f4', '#9ea4b0'], '#2e3442'], dime: [10, 23, 'dime', ['#f6f7fa', '#b0b6c2'], '#2e3442'] };
  const usCoin = (kind, x, y, s = 1) => {
    const [v, r0, , [c1, c2], col] = USC[kind], r = r0 * s;
    const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    inkCircle(x, y, r, gr, 1.5);
    if (kind === 'dime') {
      ctx.strokeStyle = 'rgba(60,60,80,.45)'; ctx.lineWidth = 1;
      for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
    }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, TAU); ctx.stroke();
    text(`${v}¢`, x, y + 1, Math.round(r * (v === 10 ? 0.74 : 0.86)), col, 'center', 800);
  };
  // the fewest coins that make n cents, using only the coin kinds allowed
  const coinsFor = (n, kinds) => {
    const out = [];
    for (const k of ['dime', 'nickel', 'penny']) { if (!kinds.includes(k)) continue; while (n >= USC[k][0]) { out.push(k); n -= USC[k][0]; } }
    return out;
  };
  const centWords = n => `${NUM_WORDS[n] ?? n} ${n === 1 ? 'cent' : 'cents'}`;

  // --- goods and stallkeepers --------------------------------------------------------------
  // [emoji, name, article]
  const GOODS = {
    apple: ['🍎', 'apple', 'an'], bread: ['🍞', 'bread', 'some'], ribbon: ['🎀', 'ribbon', 'a'], candle: ['🕯️', 'candle', 'a'],
    pot: ['🪴', 'flower pot', 'a'], carrot: ['🥕', 'carrot', 'a'], cheese: ['🧀', 'cheese', 'some'], honey: ['🍯', 'honey jar', 'a'],
    egg: ['🥚', 'egg', 'an'], yarn: ['🧶', 'yarn ball', 'a'], lemon: ['🍋', 'lemon', 'a'], sunflower: ['🌻', 'sunflower', 'a'],
    cupcake: ['🧁', 'cupcake', 'a'], pear: ['🍐', 'pear', 'a'], teddy: ['🧸', 'teddy bear', 'a'], cookie: ['🍪', 'cookie', 'a'],
    balloon: ['🎈', 'balloon', 'a'], milk: ['🥛', 'milk', 'some'],
  };
  const PAIRABLE = ['apple', 'egg', 'cookie', 'lemon', 'pear', 'carrot', 'cupcake'];
  const gName = (it, qty = 1) => qty > 1 ? `${NUM_WORDS[qty]} ${GOODS[it][1]}s` : `${GOODS[it][2]} ${GOODS[it][1]}`;
  // [critter, short name, awning colour, back cloth]
  const KEEPERS = [
    ['Penny the Pig', 'Penny', '#ff5fa2', '#ffe6f2'], ['Millie Mouse', 'Millie', '#3fbf6a', '#e6ffe8'],
    ['Hazel Hedgehog', 'Hazel', '#ff9a2a', '#fff2dc'], ['Scamper Squirrel', 'Scamper', '#e0403a', '#ffe8e0'],
    ['Granny Owl', 'Granny Owl', '#8a5ae0', '#f0eaff'], ['Otto the Otter', 'Otto', '#2a9ae0', '#e2f4ff'],
  ];
  const FROG = 'Wishbone the Frog', FROG_X = 62, AGY = 528, AS = 0.5;
  const AWN = 192, COUNTER = 372;
  const PURSE = [536, 66, 412, 66], LIST = [12, 66, 516, 66];

  // --- the market street backdrop ----------------------------------------------------------
  const drawMarket = t => {
    const sky = ctx.createLinearGradient(0, 0, 0, 440);
    sky.addColorStop(0, '#1a1650'); sky.addColorStop(0.45, '#4a3290'); sky.addColorStop(0.8, '#b0508a'); sky.addColorStop(1, '#ff9a6a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) star((i * 137 + 40) % W, 70 + (i * 53) % 110, 1.2 + (i % 3) * 0.8, `rgba(255,255,235,${0.25 + 0.6 * Math.abs(Math.sin(t * 0.7 + i))})`, 4);
    // far town: rooftops, a clock tower and lit windows
    ctx.fillStyle = '#3a2470';
    for (let i = 0; i < 11; i++) {
      const x = i * 92 - 20, h = 150 + (i * 37) % 70;
      ctx.fillRect(x, 440 - h, 80, h); tri(x - 8, 440 - h, x + 40, 440 - h - 34, x + 88, 440 - h);
    }
    ctx.fillRect(452, 180, 56, 260); tri(444, 180, 480, 130, 516, 180);
    inkCircle(480, 210, 18, '#fff3c0', 1.2); ctx.strokeStyle = OL; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(480, 210); ctx.lineTo(480, 198); ctx.moveTo(480, 210); ctx.lineTo(489, 213); ctx.stroke();
    for (let i = 0; i < 11; i++) for (let k = 0; k < 2; k++) {
      const x = i * 92 + 4 + k * 34, y = 440 - (150 + (i * 37) % 70) + 22;
      ctx.fillStyle = (i + k) % 3 ? 'rgba(255,214,120,.75)' : 'rgba(255,170,90,.5)'; ctx.fillRect(x, y, 12, 15);
    }
    // the wishing well at the end of the street, where Wishbone waits
    ink(P2('M18,440 L18,402 Q62,390 106,402 L106,440 Z'), '#9a94c0', 2.2);
    ctx.strokeStyle = 'rgba(60,40,90,.4)'; ctx.lineWidth = 1.5;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const y = 412 + r * 10, x = 22 + c * 22 + (r % 2) * 11; ctx.strokeRect(x, y, 20, 10); }
    inkRect(26, 330, 8, 70, '#8a5a3a', 1.6, 2); inkRect(90, 330, 8, 70, '#8a5a3a', 1.6, 2);
    ink(P2('M10,336 L62,300 L114,336 Z'), '#c0504a', 2.2);
    ctx.strokeStyle = '#e8d0a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(62, 340); ctx.lineTo(62, 372); ctx.stroke();
    inkRect(54, 372, 16, 14, '#b07a4a', 1.2, 3);
    // bunting strung across the street
    for (const [x0, x1] of [[110, 400], [400, 680], [680, 960]]) {
      const y0 = 150;
      ctx.strokeStyle = 'rgba(40,20,60,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 36, x1, y0); ctx.stroke();
      for (let i = 1; i < 10; i++) {
        const k = i / 10, x = lerp(x0, x1, k), y = y0 + 36 * 2 * k * (1 - k), c = ['#ff6fae', '#ffd84a', '#7fe0ff', '#9aff9a', '#c69aff'][(i + x0) % 5];
        const sw = Math.sin(t * 2 + i + x0) * 2;
        ctx.fillStyle = c; tri(x - 7, y, x + 7, y, x + sw, y + 15);
      }
    }
    // the cobbled street
    const pg = ctx.createLinearGradient(0, 440, 0, H); pg.addColorStop(0, '#8a6aa0'); pg.addColorStop(1, '#4e3a70');
    ctx.fillStyle = pg; ctx.fillRect(0, 440, W, H - 440);
    ctx.strokeStyle = 'rgba(30,20,60,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 442); ctx.lineTo(W, 442); ctx.stroke();
    ctx.strokeStyle = 'rgba(230,210,255,.22)'; ctx.lineWidth = 1.5;
    for (let j = 0; j < 6; j++) {
      const y = 452 + j * 15 + j * j, w = 34 + j * 6;
      for (let x = (j % 2) * w / 2 - w; x < W + w; x += w) { ctx.beginPath(); ctx.ellipse(x, y, w * 0.44, 5 + j * 0.8, 0, 0, TAU); ctx.stroke(); }
    }
    // fallen petals and dropped confetti on the cobbles
    for (let i = 0; i < 18; i++) { ctx.fillStyle = ['#ff9ac0', '#ffe36b', '#9ae8ff'][i % 3]; ellipse((i * 197) % W, 470 + (i * 61) % 60, 3, 1.6, i); }
  };

  // a market stall: posts, back cloth, keeper, counter with goods, striped awning and a sign
  const drawStall = (g, s, i, t) => {
    const L = s.cx - s.w / 2, R = s.cx + s.w / 2;
    glow(s.cx, 320, s.w * 0.7, '#ffd890', 0.25);
    inkRect(L + 6, AWN + 30, s.w - 12, COUNTER - AWN - 20, s.cloth, 2, 4);
    ctx.fillStyle = rgba(s.col, 0.18); for (let k = 0; k < 4; k++) ctx.fillRect(L + 14 + k * (s.w - 28) / 4, AWN + 34, (s.w - 28) / 8, COUNTER - AWN - 28);
    drawCritter(s.who, s.cx, COUNTER + 22, 0.6, i % 2 ? -1 : 1);
    inkRect(L, AWN + 10, 10, 448 - AWN - 10, '#8a5a3a', 2, 3); inkRect(R - 10, AWN + 10, 10, 448 - AWN - 10, '#8a5a3a', 2, 3);
    // counter
    inkRect(L - 4, COUNTER, s.w + 8, 76, '#c08a52', 2.5, 6);
    ctx.fillStyle = 'rgba(90,50,20,.25)'; for (let k = 1; k < 4; k++) ctx.fillRect(L, COUNTER + k * 19, s.w, 2);
    ctx.fillStyle = s.col; ctx.beginPath(); ctx.moveTo(L - 4, COUNTER + 4);
    for (let k = 0; k <= 8; k++) ctx.arc(L - 4 + (k + 0.5) * (s.w + 8) / 9, COUNTER + 4, (s.w + 8) / 18, 0, Math.PI, false);
    ctx.lineTo(R + 4, COUNTER + 4); ctx.fill();
    // goods on the counter, with price tags once she has looked inside
    const n = s.offers.length;
    s.offers.forEach((o, j) => {
      const x = s.cx + (j - (n - 1) / 2) * (s.w / n), [em] = GOODS[o.item];
      if (o.qty > 1) { emoji(em, x - 8, COUNTER - 12, 24); emoji(em, x + 8, COUNTER - 8, 24); } else emoji(em, x, COUNTER - 10, 28);
      if (s.seen) {
        const lab = o.qty > 1 ? `2 for ${o.price}¢` : `${o.price}¢`, tw = o.qty > 1 ? 50 : 34;
        rrect(x - tw / 2, COUNTER + 34, tw, 22, 6, o.onList ? '#fff6c8' : '#efe6f4', OL, 1.6);
        text(lab, x, COUNTER + 45, o.qty > 1 ? 12 : 15, o.onList ? '#5a2a6e' : '#9a8aa8', 'center', 800);
      }
    });
    // striped, scalloped awning
    const aw = new Path2D(), sc = 7, sr = (s.w + 20) / sc / 2;
    aw.moveTo(L - 10, AWN + 26); aw.lineTo(L - 4, AWN - 6); aw.lineTo(R + 4, AWN - 6); aw.lineTo(R + 10, AWN + 26);
    for (let k = sc - 1; k >= 0; k--) aw.arc(L - 10 + (k + 0.5) * sr * 2, AWN + 26, sr, 0, Math.PI, false);
    aw.closePath();
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(aw);
    ctx.save(); ctx.clip(aw); ctx.fillStyle = '#fffaf0'; ctx.fillRect(L - 12, AWN - 8, s.w + 24, 70);
    ctx.fillStyle = s.col; for (let k = 0; k < sc; k++) if (k % 2 === 0) ctx.fillRect(L - 10 + k * sr * 2, AWN - 8, sr * 2, 70);
    ctx.restore();
    // hanging lanterns
    for (const lx of [L + 4, R - 4]) { glow(lx, AWN + 50, 26, '#ffd060', 0.45 + 0.15 * Math.sin(t * 3 + lx)); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, AWN + 30); ctx.lineTo(lx, AWN + 42); ctx.stroke(); inkEllipse(lx, AWN + 50, 6, 8, 0, '#ffcf4a', 1); }
    // sign
    const sw = Math.max(70, s.short.length * 10 + 24);
    inkRect(s.cx - sw / 2, AWN - 30, sw, 24, '#7a4a2a', 2, 6);
    text(`${s.short}'s`, s.cx, AWN - 18, 15, '#fff2c8', 'center', 700);
    // gentle hints: a twinkle over the cheapest stall (tier 1), a bouncing arrow over the frog's tip
    if (g.tier === 1 && g.st === 'street' && g.cheapStalls.has(i)) star(s.cx + sw / 2 + 12, AWN - 22, 7 + Math.sin(t * 5) * 2, '#fff6a8', 4);
    if (g.hintStall === i && g.st !== 'deliver') outlined('⬇', s.cx, AWN - 52 + Math.sin(t * 6) * 5, 28, '#fff6a8');
  };

  // Aubrey's shopping basket, held low at her side so her face stays clear
  const basket = (x, y, items) => {
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y - 4, 13, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#d8a060'; ctx.lineWidth = 2.5; ctx.stroke();
    items.slice(-3).forEach((it, k) => emoji(GOODS[it][0], x - 9 + k * 9, y - 11 - (k % 2) * 3, 15));
    ink(P2(`M${x - 17},${y - 4} L${x + 17},${y - 4} L${x + 12},${y + 13} L${x - 12},${y + 13} Z`), '#d8a060', 1.4);
    ctx.strokeStyle = 'rgba(120,70,30,.6)'; ctx.lineWidth = 1.2;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x - 15, y + 1 + k * 4 + 4); ctx.lineTo(x + 15, y + 1 + k * 4 + 4); ctx.stroke(); }
  };

  MG.wishmarket = {
    kind: 'learn', title: () => 'Wish Market', icon: () => '🛒',
    how: () => 'Buy everything on the list! Walk to the stalls and compare the prices. Some stalls are cheaper. If you run short, sell something back.',
    init(g) {
      Object.assign(g, { round: 0, rounds: [3, 2, 2][g.tier - 1], scores: [], kinds: g.tier === 1 ? ['nickel', 'penny'] : ['dime', 'nickel', 'penny'], fly: [] });
      this.next(g);
    },
    start(g) { speak(g.say); },

    // --- one shopping trip ---
    gen(T) {
      const nItems = [3, 4, 5][T - 1], nStalls = [4, 5, 5][T - 1], nExcl = [1, 2, 2][T - 1];
      const C = [[2, 4], [4, 9], [5, 11]][T - 1], D = [[2, 4], [3, 5], [3, 6]][T - 1], X = [[3, 7], [5, 12], [6, 14]][T - 1];
      for (let tries = 0; tries < 400; tries++) {
        const sw = (W - 150) / nStalls;
        const stalls = shuffle(KEEPERS.slice()).slice(0, nStalls).map(([who, short, col, cloth], i) => ({ who, short, col, cloth, cx: 150 + sw * (i + 0.5), w: sw - 16, offers: [], seen: false }));
        const twoFor = T === 3 ? pick(PAIRABLE) : null;
        const items = shuffle(Object.keys(GOODS).filter(n => n !== twoFor)).slice(0, nItems - (twoFor ? 1 : 0));
        const excl = new Set(items.slice(0, nExcl));
        if (twoFor) items.push(twoFor);
        let cheap = 0, diff = 0, ok = true;
        const free = k => { const c = shuffle(stalls.map((s, i) => i).filter(i => stalls[i].offers.length < 2)); return c.length >= k ? c.slice(0, k).sort((a, b) => a - b) : null; };
        const put = (si, item, qty, price) => stalls[si].offers.push({ item, qty, price, onList: true });
        // expensive first (nearer the frog) most of the time, so the first stall isn't always the best buy
        const order = (a, b) => (Math.random() < 0.75 ? [a, b] : [b, a]);
        for (const it of items) {
          if (excl.has(it)) { const si = free(1); if (!si) { ok = false; break; } const p = randInt(...X); put(si[0], it, 1, p); cheap += p; }
          else if (it === twoFor) {
            const si = free(2); if (!si) { ok = false; break; }
            const one = randInt(4, 7), two = 2 * one - randInt(2, 3), [a, b] = order(si[0], si[1]);
            put(a, it, 1, one); put(b, it, 2, two); cheap += two; diff += 2 * one - two;
          } else {
            const si = free(T === 3 && Math.random() < 0.5 ? 3 : 2); if (!si) { ok = false; break; }
            const c = randInt(...C), e = c + randInt(...D), [a, b] = order(si[0], si[si.length - 1]);
            put(a, it, 1, e); put(b, it, 1, c); if (si.length === 3) put(si[1], it, 1, randInt(c + 1, e));
            cheap += c; diff += e - c;
          }
        }
        if (!ok) continue;
        const slack = randInt(...[[1, 2], [2, 4], [1, 3]][T - 1]);
        if (slack >= diff) continue; // buying every expensive one must leave too little for the rest
        const spare = shuffle(Object.keys(GOODS).filter(n => !items.includes(n)));
        for (const s of stalls) {
          while (s.offers.length < 2 || (s.offers.length < 3 && Math.random() < 0.3)) s.offers.push({ item: spare.pop(), qty: 1, price: randInt(...X), onList: false });
          s.offers = shuffle(s.offers);
        }
        const list = items.map(it => ({ item: it, qty: it === twoFor ? 2 : 1, excl: excl.has(it) }));
        return { stalls, list: shuffle(list), budget: cheap + slack, cheap };
      }
      throw new Error('wishmarket: could not build a market');
    },
    next(g) {
      const r = this.gen(g.tier);
      Object.assign(g, r, { money: r.budget, basket: [], sells: 0, hints: 0, st: 'street', open: -1, ax: 150, face: 1, walkT: 0, target: null, targetStall: -1,
        short: false, hintStall: -1, msg: null, frogSay: null, t2: 0, leftover: 0 });
      this.refreshHints(g);
      const names = g.list.map(l => gName(l.item, l.qty)), last = names.pop();
      g.say = `Buy ${names.join(', ')} and ${last}. You have ${centWords(g.money)}. Look for the cheapest stall!`;
      if (g.phase === 'play') speak(g.say);
    },

    // --- shopping helpers ---
    have(g, it) { return g.basket.filter(b => b.item === it).reduce((a, b) => a + b.qty, 0); },
    need(g, it) { return g.list.find(l => l.item === it).qty - this.have(g, it); },
    // the cheapest way to get what's still needed of an item: [stall index, offer]
    best(g, it) {
      const n = this.need(g, it); let out = null;
      g.stalls.forEach((s, si) => s.offers.forEach(o => {
        if (o.item !== it || o.qty > n) return;
        const per = o.price / o.qty;
        if (!out || per < out[2]) out = [si, o, per];
      }));
      return out;
    },
    cheapestPer(g, it) { let m = Infinity; for (const s of g.stalls) for (const o of s.offers) if (o.item === it) m = Math.min(m, o.price / o.qty); return m; },
    refreshHints(g) {
      g.cheapStalls = new Set();
      for (const l of g.list) if (!l.excl && this.need(g, l.item) > 0) { const b = this.best(g, l.item); if (b) g.cheapStalls.add(b[0]); }
    },
    say(g, str, frog = false) { g.msg = { str, t: 5, frog }; speak(str); },
    flyCoins(g, cents, fromXY, toXY) {
      coinsFor(cents, g.kinds).slice(0, 10).forEach((k, i) => g.fly.push({ k, from: fromXY, to: toXY, t: -i * 0.08 }));
    },
    pursePos() { return [PURSE[0] + 170, PURSE[1] + 40]; },
    open(g, si) {
      g.st = 'stall'; g.open = si; g.target = null; g.targetStall = -1; g.ax = g.stalls[si].cx;
      const s = g.stalls[si], first = !s.seen; s.seen = true;
      SFX.pop();
      if (first) speak(`${s.short}'s stall! ${s.offers.map(o => `${o.qty > 1 ? `Two ${GOODS[o.item][1]}s` : GOODS[o.item][1]}, ${o.qty > 1 ? 'for ' : ''}${centWords(o.price)}`).join('. ')}.`);
    },
    leave(g) { if (g.st === 'stall') { g.st = 'street'; g.open = -1; SFX.blip(); } },
    buy(g, j) {
      const s = g.stalls[g.open], o = s.offers[j], nm = GOODS[o.item][1];
      if (!o.onList) return this.say(g, `The ${nm} isn't on the list.`);
      const n = this.need(g, o.item);
      if (n <= 0) return this.say(g, `You already have the ${nm}${this.have(g, o.item) > 1 ? 's' : ''}!`);
      if (o.qty > n) return this.say(g, `You only need one more ${nm}. Sell yours back to get the 2 for ${o.price} cents deal!`);
      if (o.price > g.money) {
        g.short = true; SFX.miss();
        return this.say(g, 'Not enough coins! Maybe sell something back and find it cheaper?');
      }
      g.money -= o.price; g.basket.push({ item: o.item, qty: o.qty, price: o.price });
      this.flyCoins(g, o.price, this.pursePos(), [215, 300]);
      SFX.sparkle(); tone(1200, 0.06, 'triangle', 0.07); tone(1600, 0.08, 'sine', 0.05, 0.08);
      g.msg = null; g.short = false; g.hintStall = -1;
      this.refreshHints(g);
      if (g.list.every(l => this.need(g, l.item) <= 0)) {
        g.st = 'deliver'; g.t2 = 1.6;
        speak(`You got everything on the list! Bring your basket to Wishbone.`);
      } else speak(`${o.qty > 1 ? `Two ${nm}s` : `The ${nm}`}, for ${centWords(o.price)}. You have ${centWords(g.money)} left.`);
    },
    sell(g, j) {
      const o = g.stalls[g.open].offers[j];
      const mine = g.basket.filter(b => b.item === o.item).sort((a, b) => b.price - a.price)[0];
      if (!mine) return;
      g.basket.splice(g.basket.indexOf(mine), 1); g.money += mine.price; g.sells++;
      this.flyCoins(g, mine.price, [215, 300], this.pursePos());
      SFX.pop(); tone(900, 0.08, 'triangle', 0.06);
      this.refreshHints(g);
      this.say(g, `Sold back! You got your ${centWords(mine.price)} back. Now you have ${centWords(g.money)}.`);
    },
    hint(g) {
      g.hints++; g.short = false;
      // something bought too dear? sell it back and point at the cheaper stall
      const dear = g.basket.filter(b => b.price / b.qty > this.cheapestPer(g, b.item)).sort((a, b) => (b.price / b.qty - this.cheapestPer(g, b.item)) - (a.price / a.qty - this.cheapestPer(g, a.item)))[0];
      let str;
      if (dear) {
        const nm = GOODS[dear.item][1], have = this.have(g, dear.item);
        let si = -1, cp = Infinity;
        g.stalls.forEach((s, i) => s.offers.forEach(o => { if (o.item === dear.item && o.price / o.qty < cp) { cp = o.price / o.qty; si = i; } }));
        const o = g.stalls[si].offers.find(x => x.item === dear.item && x.price / x.qty === cp);
        g.hintStall = si;
        str = o.qty > 1 ? `Ribbit! Sell back your ${nm}${have > 1 ? 's' : ''}. ${g.stalls[si].short} sells two ${nm}s for ${centWords(o.price)}!`
          : `Ribbit! You paid ${centWords(dear.price)} for the ${nm}. ${g.stalls[si].short} sells it for ${centWords(o.price)}. Sell it back and buy it there!`;
      } else {
        const l = g.list.find(x => this.need(g, x.item) > 0), b = l && this.best(g, l.item);
        if (b) { g.hintStall = b[0]; str = `Ribbit! ${g.stalls[b[0]].short} has the ${GOODS[l.item][1]} for ${centWords(b[1].price)}.`; }
        else str = 'Ribbit! You have everything. Come and see me!';
      }
      this.say(g, str, true);
    },
    deliver(g) {
      g.st = 'yay'; g.t2 = 3.6; g.leftover = g.money;
      const over = g.budget - g.money - g.cheap;
      const r = clamp(1 - Math.min(0.4, 0.2 * g.sells) - 0.1 * g.hints - 0.04 * over, 0.35, 1);
      g.scores.push(r);
      SFX.fanfare(); burst(FROG_X + 30, 420, 30, { colors: ['#ffe36b', '#ffb3e0', '#b8e6ff'] });
      if (g.money > 0) { this.flyCoins(g, g.money, this.pursePos(), [FROG_X, 430]); floatText(FROG_X + 40, 360, `+${g.money}¢ left over!`, '#fff6a8', false, 24); }
      speak(g.money > 0 ? `Ribbit! You got everything! You have ${centWords(g.money)} left over!` : 'Ribbit! You got everything, and you spent every coin!');
    },

    update(g, dt, id) {
      for (const f of g.fly) f.t += dt;
      g.fly = g.fly.filter(f => f.t < 0.7);
      if (g.msg && (g.msg.t -= dt) <= 0) g.msg = null;
      if (g.st === 'yay') {
        if ((g.t2 -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      } else if (g.st === 'stall') {
        if (id?.startsWith('buy:')) this.buy(g, +id.slice(4));
        else if (id?.startsWith('sell:')) this.sell(g, +id.slice(5));
        else if (id === 'hint') this.hint(g);
        else if (id === 'leave' || pressed.escape || pressed.backspace || pressed.arrowdown || goLeft() || goRight()) this.leave(g);
      } else {
        // the street (also 'deliver': everything bought, walk back to the frog)
        if (g.st === 'deliver' && g.open >= 0) { if ((g.t2 -= dt) <= 0) { g.open = -1; g.target = 90; } }
        if (id === 'hint') this.hint(g);
        let vx = 0;
        if (g.open < 0) {
          if (goLeft()) vx = -1; else if (goRight()) vx = 1;
          if (vx) { g.target = null; g.targetStall = -1; }
          if (!id && pointer.clicked && pointer.y > 140) {
            const si = g.stalls.findIndex(s => Math.abs(pointer.x - s.cx) < s.w / 2 + 6 && pointer.y < 450);
            if (si >= 0 && g.st === 'street') { g.target = g.stalls[si].cx; g.targetStall = si; }
            else { g.target = pointer.x < 130 ? 90 : clamp(pointer.x, 40, 930); g.targetStall = -1; }
          }
          if (g.target != null) {
            const d = g.target - g.ax;
            if (Math.abs(d) < 6) {
              g.ax = g.target; g.target = null;
              if (g.targetStall >= 0) { this.open(g, g.targetStall); return this.post(g); }
            } else vx = Math.sign(d);
          }
          if (vx) { g.ax = clamp(g.ax + vx * 330 * dt, 40, 930); g.face = vx; g.walkT += dt; } else g.walkT = 0;
          const near = g.stalls.findIndex(s => Math.abs(g.ax - s.cx) < s.w / 2);
          if (g.st === 'street' && near >= 0 && (pressed[' '] || pressed.enter || pressed.arrowup)) this.open(g, near);
          if (g.st === 'deliver' && g.ax < 140) this.deliver(g);
        }
      }
      this.post(g);
    },
    post(g) {
      g.progress = `Trip ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.scores.reduce((a, b) => a + b, 0) / g.rounds;
    },

    // --- drawing ---
    draw(g) {
      const t = S.t;
      drawMarket(t);
      g.stalls.forEach((s, i) => drawStall(g, s, i, t));
      // Wishbone by the well
      drawCritter(FROG, FROG_X, 520, 0.5, 1);
      if (g.st === 'deliver' && g.open < 0) outlined('⬅ Bring it to Wishbone!', 300, 470 + Math.sin(t * 5) * 3, 22, '#fff6a8');
      // Aubrey
      const moving = g.walkT > 0, fr = moving ? `run${1 + Math.floor(g.walkT * 10) % 5}` : g.st === 'yay' ? 'twirl' : 'idle_front';
      const dir = moving ? g.face : 1;
      drawAubrey(g.ax, AGY, fr, g.face, moving ? Math.abs(Math.sin(g.walkT * 10)) * 3 : 0, AS);
      basket(g.ax + dir * 26, AGY - 46, g.basket.map(b => b.item));
      if (g.st === 'street' && g.open < 0) {
        const near = g.stalls.findIndex(s => Math.abs(g.ax - s.cx) < s.w / 2);
        if (near >= 0 && !moving) { rrect(g.ax - 74, AGY - 150, 148, 26, 13, 'rgba(48,24,72,.85)'); text('Space: look inside', g.ax, AGY - 137, 13, '#fff', 'center', 700); }
      }
      if (g.open >= 0) this.drawStallPanel(g, g.stalls[g.open], t);
      // street messages and the frog's tips
      if (g.open < 0 && g.msg) {
        const lines = wrap(g.msg.str, 560, 18);
        darkPanel(W / 2 - 300, 140, 600, 18 + lines.length * 24, 16);
        if (g.msg.frog) emoji('🐸', W / 2 - 274, 160, 24);
        lines.forEach((l, i) => text(l, W / 2 + (g.msg.frog ? 16 : 0), 152 + i * 24, 18, '#fff', 'center', 600));
      }
      if (g.open < 0 && g.short && g.st === 'street') button('hint', 12, 140, 170, 44, 'Ask Wishbone', { icon: '🐸', color: '#3fae7a', size: 15 });
      this.drawHud(g, t);
      // coins in flight
      for (const f of g.fly) {
        if (f.t < 0) continue;
        const k = Math.min(1, f.t / 0.55), x = lerp(f.from[0], f.to[0], k), y = lerp(f.from[1], f.to[1], k) - Math.sin(k * Math.PI) * 70;
        usCoin(f.k, x, y, 0.6);
      }
      if (g.st === 'yay') {
        panel(W / 2 - 230, 200, 460, 120, 24);
        outlined('All shopped!', W / 2, 238, 32, '#ff6fb5', 'center', '#fff');
        text(g.leftover > 0 ? `${g.leftover}¢ left over!` : 'Every coin spent!', W / 2, 286, 22, '#5a2a6e', 'center', 700);
      }
    },
    drawHud(g, t) {
      // shopping list
      const [lx, ly, lw, lh] = LIST;
      darkPanel(lx, ly, lw, lh, 18);
      text('List', lx + 14, ly + 33, 16, '#ffe9a8', 'left', 800);
      const sw = (lw - 60) / g.list.length;
      g.list.forEach((l, i) => {
        const x = lx + 60 + sw * (i + 0.5), got = this.need(g, l.item) <= 0, have = this.have(g, l.item);
        rrect(x - sw / 2 + 4, ly + 6, sw - 8, lh - 12, 12, got ? 'rgba(120,230,140,.35)' : 'rgba(255,255,255,.12)');
        emoji(GOODS[l.item][0], x - (l.qty > 1 ? 10 : 0), ly + 30, 30);
        if (l.qty > 1) text(`×${l.qty}`, x + 18, ly + 32, 16, '#fff', 'left', 800);
        if (got) { inkCircle(x + 22, ly + 16, 10, '#3fbf6a', 1); text('✓', x + 22, ly + 17, 14, '#fff', 'center', 800); }
        else if (have > 0) text(`${have}/${l.qty}`, x - sw / 2 + 22, ly + 16, 12, '#fff6a8', 'center', 800);
        const paid = g.basket.filter(b => b.item === l.item).reduce((a, b) => a + b.price, 0);
        if (paid) text(`paid ${paid}¢`, x, ly + 54, 12, '#d8ffd8', 'center', 700);
      });
      // purse: real coins plus the total
      const [px, py, pw, ph] = PURSE;
      darkPanel(px, py, pw, ph, 18);
      text('Purse', px + 14, py + 33, 16, '#ffe9a8', 'left', 800);
      const coins = coinsFor(g.money, g.kinds), sp = Math.min(30, 250 / Math.max(1, coins.length));
      coins.forEach((k, i) => usCoin(k, px + 88 + i * sp, py + 33, 0.58));
      if (!coins.length) text('empty', px + 88, py + 33, 15, 'rgba(255,255,255,.5)', 'left', 600);
      outlined(`${g.money}¢`, px + pw - 44, py + 34, 28, g.short ? '#ffb0b0' : '#fff6a8');
    },
    drawStallPanel(g, s, t) {
      panel(110, 140, 740, 328, 26);
      // the stallkeeper behind a little counter
      rrect(128, 156, 176, 296, 20, s.cloth, OL, 2.5);
      ctx.save(); ctx.beginPath(); ctx.roundRect(128, 156, 176, 296, 20); ctx.clip();
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fffaf0' : s.col; ctx.fillRect(128 + k * 176 / 6, 156, 176 / 6, 34); }
      drawCritter(s.who, 216, 420, 0.82, 1);
      ctx.restore();
      inkRect(128, 384, 176, 68, '#c08a52', 2.5, 10);
      text(`${s.short}'s`, 216, 418, 20, '#fff', 'center', 800);
      // the goods
      const n = s.offers.length, cw = 162, gap = 12, x0 = 322 + (3 - n) * (cw + gap) / 2;
      s.offers.forEach((o, j) => {
        const x = x0 + j * (cw + gap), [em, nm] = GOODS[o.item], need = o.onList ? this.need(g, o.item) : 0, have = o.onList ? this.have(g, o.item) : 0;
        rrect(x, 156, cw, 296, 18, o.onList ? '#fff8ec' : '#f2ecf4', OL, 2);
        if (o.qty > 1) { emoji(em, x + cw / 2 - 22, 210, 50); emoji(em, x + cw / 2 + 22, 214, 50); } else emoji(em, x + cw / 2, 212, 60);
        text(nm, x + cw / 2, 262, 18, '#5a2a6e', 'center', 700);
        // price tag
        const lab = o.qty > 1 ? `2 for ${o.price}¢` : `${o.price}¢`;
        ink(P2(`M${x + 34},${280} L${x + cw - 30},${280} L${x + cw - 30},${316} L${x + 34},${316} L${x + 20},${298} Z`), '#ffe36b', 1.4);
        inkCircle(x + 32, 298, 3, '#fff', 0.6);
        text(lab, x + cw / 2 + 6, 299, o.qty > 1 ? 20 : 26, '#5a2a6e', 'center', 800);
        if (!o.onList) text('Not on the list', x + cw / 2, 356, 16, '#9a8aa8', 'center', 700);
        else if (need > 0 && g.st === 'stall') button(`buy:${j}`, x + 14, 330, cw - 28, 52, `Buy ${o.price}¢`, { color: o.price > g.money ? '#d08aa0' : '#3fae7a', size: 19, key: String(j + 1) });
        else if (need <= 0) { inkCircle(x + cw / 2 - 40, 356, 12, '#3fbf6a', 1); text('Got it!', x + cw / 2 + 8, 356, 18, '#3a9a5a', 'center', 800); }
        if (o.onList && have > 0 && g.st === 'stall') {
          const paid = g.basket.filter(b => b.item === o.item).sort((a, b) => b.price - a.price)[0].price;
          button(`sell:${j}`, x + 14, 392, cw - 28, 46, `Sell back ${paid}¢`, { color: '#ff9a3a', size: 16 });
        }
      });
      // message strip under the stall
      if (g.st === 'stall') {
        rrect(110, 474, 740, 58, 20, 'rgba(48,24,72,.9)');
        const msg = g.msg ? g.msg.str : 'Tap Buy to buy. Want it cheaper? Visit the other stalls!';
        const lines = wrap(msg, g.short ? 420 : 520, 16);
        if (g.msg?.frog) emoji('🐸', 134, 503, 24);
        lines.slice(0, 2).forEach((l, i) => text(l, g.msg?.frog ? 152 : 130, 503 + (i - (Math.min(2, lines.length) - 1) / 2) * 20, 16, g.msg && !g.msg.frog ? '#ffd0a8' : '#fff', 'left', 600));
        if (g.short) button('hint', 590, 482, 120, 42, 'Hint', { icon: '🐸', color: '#3fae7a', size: 15 });
        button('leave', 722, 482, 118, 42, 'Leave', { color: '#9a6ae0', size: 16, key: 'Esc' });
      }
    },
  };

  restage('wishingwell', {
    games: [['wishfishing', 'stardust', {}], ['wishmarket', 'honey', {}]],
    mid: ['N:Ribbit! Now take those coins to the market. The same things cost different coins at different stalls.',
      'N:Look around before you buy, and bring back everything on my list!',
      "A:focused:I'll find the best price for everything!"],
  });
}
