'use strict';
{
  // ===========================================================================
  // Glittering Creek, game 1 (action) CRYSTAL MINE: behind Otto's waterfall is a secret mine.
  // Aubrey, in a miner's helmet with a headlamp and a pickaxe, digs down through a side-view
  // cave that scrolls as she goes deeper. Move into a block (or press Space / tap) to chip at it:
  // soft sand takes 1 tap, clay 2, hard stone 3, and dark bedrock can't be dug at all. Crystals
  // and geodes hide in the rock; chip them out, then climb back up and drop them in Otto's mine
  // cart to fill his order (e.g. 3 purple and 2 blue). Her bag only holds a few, so it takes trips.
  // Her headlamp lights a circle around her; beyond it, crystals only glimmer. Boulders wobble
  // and then fall if she digs out the block under them: step aside or get bonked (and drop a crystal).
  // Teaches: rock hardness (diamond is the hardest of all), and that deeper rock layers are older.
  // ===========================================================================
  const C = 64, COLS = 15, TOP = 150;      // cell size, columns, world y of row 0
  const CART_C = 1, START_C = 3;
  const SCALE = 0.3;                         // Aubrey's sprite scale
  const ROCK = {
    sand: { hp: 1, base: '#f2c879', hi: '#ffe2a8', lo: '#c99a4e', line: '#7a5228', name: 'Soft sand' },
    clay: { hp: 2, base: '#d9845a', hi: '#f0a77e', lo: '#a95a36', line: '#5e2a18', name: 'Clay' },
    stone: { hp: 3, base: '#8e95b8', hi: '#b8bedc', lo: '#636a92', line: '#2e3254', name: 'Hard stone' },
    bed: { hp: Infinity, base: '#3a3052', hi: '#54486e', lo: '#261e3a', line: '#120c22', name: 'Bedrock' },
  };
  const GEMS = {
    purple: { col: '#b57bff', glow: '200,150,255', word: 'purple' },
    blue: { col: '#4fb4ff', glow: '120,200,255', word: 'blue' },
    green: { col: '#3fe08a', glow: '120,255,180', word: 'green' },
    red: { col: '#ff4f72', glow: '255,120,150', word: 'red' },
    yellow: { col: '#ffd23a', glow: '255,230,120', word: 'yellow' },
    white: { col: '#eefcff', glow: '230,250,255', word: 'diamond' },
  };
  // how deep (as a fraction of the mine) each colour likes to hide
  const ZONE = { purple: [0.1, 0.75], yellow: [0.1, 0.65], blue: [0.3, 0.95], green: [0.4, 1], red: [0.55, 1], white: [0.78, 1] };

  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const twk = (x, y, r, a, col = '#ffffff') => { ctx.globalAlpha = clamp(a, 0, 1); star(x, y, r, col, 4); ctx.globalAlpha = 1; };
  const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

  // --- art ------------------------------------------------------------------------------------
  // one crystal prism standing on (x, y), pointing up (rot turns it)
  function prism(x, y, h, w, col, rot = 0, lw = 1.2) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const p = P2(`M${-w / 2},0 L${-w / 2},${-h * 0.7} L0,${-h} L${w / 2},${-h * 0.7} L${w / 2},0 Z`);
    ink(p, col, lw, '#2a1446');
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-w / 2, -h, w * 0.32, h);
    ctx.fillStyle = 'rgba(40,10,80,.18)'; ctx.fillRect(w * 0.16, -h, w, h);
    ctx.restore();
    ctx.restore();
  }
  // a cut diamond (brilliant shape) centred on (x, y)
  function diamond(x, y, s, lw = 1.2) {
    const p = P2(`M${x - s},${y - s * 0.3} L${x - s * 0.55},${y - s * 0.8} L${x + s * 0.55},${y - s * 0.8} L${x + s},${y - s * 0.3} L${x},${y + s} Z`);
    ink(p, '#eefcff', lw, '#2a1446');
    ctx.save(); ctx.clip(p);
    ctx.strokeStyle = 'rgba(120,170,220,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.3); ctx.lineTo(x + s, y - s * 0.3);
    ctx.moveTo(x - s * 0.3, y - s * 0.3); ctx.lineTo(x, y + s); ctx.lineTo(x + s * 0.3, y - s * 0.3);
    ctx.moveTo(x - s * 0.55, y - s * 0.8); ctx.lineTo(x - s * 0.3, y - s * 0.3); ctx.lineTo(x, y - s * 0.8); ctx.lineTo(x + s * 0.3, y - s * 0.3); ctx.lineTo(x + s * 0.55, y - s * 0.8);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,170,230,.35)'; ctx.fillRect(x + s * 0.1, y - s, s, s * 2);
    ctx.fillStyle = 'rgba(150,230,255,.35)'; ctx.fillRect(x - s, y - s, s * 0.6, s * 2);
    ctx.restore();
  }
  // a little gem icon of colour k centred on (x, y), size about s
  function gemIcon(k, x, y, s, rot = 0) {
    if (k === 'white') return diamond(x, y, s * 0.55, 1);
    prism(x, y + s * 0.5, s, s * 0.52, GEMS[k].col, rot, 1);
  }
  function glow(x, y, r, rgb, a) {
    const gr = ctx.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // a crystal cluster poking out of a rock block
  function cluster(k, cx, cy, t, seed) {
    glow(cx, cy, 34, GEMS[k].glow, 0.45 + 0.15 * Math.sin(t * 3 + seed * 9));
    if (k === 'white') { diamond(cx, cy + 2, 14); twk(cx + 8, cy - 8, 6, 0.5 + 0.5 * Math.sin(t * 5 + seed * 7)); return; }
    const col = GEMS[k].col, b = cy + 14;
    prism(cx - 10, b, 20, 10, col, -0.5); prism(cx + 10, b, 22, 10, col, 0.45); prism(cx, b, 30, 13, col, 0);
    twk(cx + 3, cy - 10, 5, 0.4 + 0.6 * Math.sin(t * 4 + seed * 11));
  }
  function pickaxe(x, y, ang, f) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(f, 1);
    ink(P2('M-2,4 L2,4 L3,-24 L-1,-24 Z'), '#b07a44', 1);
    ink(P2('M-13,-20 C-6,-28 8,-28 15,-20 L13,-18 C7,-23 -5,-23 -11,-18 Z'), '#c8d0e6', 1);
    ctx.restore();
  }
  function bat(x, y, t) {
    const sw = Math.sin(t * 1.5) * 0.08;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    ctx.strokeStyle = '#2a1446'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(-3, -6); ctx.moveTo(3, -12); ctx.lineTo(3, -6); ctx.stroke();
    ink(P2('M-12,-6 C-14,4 -6,12 0,14 C6,12 14,4 12,-6 C6,-2 -6,-2 -12,-6 Z'), '#7a5aa8', 1.1, '#2a1446');
    ink(P2('M-6,8 L-4,14 L-2,9 Z M6,8 L4,14 L2,9 Z'), '#7a5aa8', 0.8, '#2a1446');
    // upside-down face: eyes under the folded wings
    ctx.fillStyle = '#fff'; circle(-4, 7, 2.6); circle(4, 7, 2.6);
    ctx.fillStyle = '#2a1446'; circle(-4, 7.5, 1.3); circle(4, 7.5, 1.3);
    ctx.fillStyle = '#ff9ad0'; circle(-7, 4, 1.6); circle(7, 4, 1.6);
    ctx.restore();
  }

  // --- the mine -------------------------------------------------------------------------------
  const cellAt = (g, c, r) => (c < 0 || c >= COLS || r < 0 || r >= g.rows ? null : g.grid[r][c]);
  const boulderAt = (g, c, r) => g.boulders.find(b => b.state !== 'fall' && b.c === c && b.r === r);
  const rockAt = (g, c, r) => { const cl = cellAt(g, c, r); return !cl || cl.t != null; };
  const solid = (g, c, r) => rockAt(g, c, r) || !!boulderAt(g, c, r);
  const hpOf = cl => (cl.gem === 'white' ? 4 : cl.geode ? 3 : ROCK[cl.t].hp);
  const layerOf = (g, r) => (r <= 0 ? 'surface' : r <= g.L1 ? 'sand' : r <= g.L2 ? 'clay' : 'stone');

  function genMine(g) {
    const T = g.tier - 1, R = [14, 20, 26][T];
    g.R = R; g.rows = R + 2; g.L1 = Math.round(R * 0.3); g.L2 = Math.round(R * 0.62);
    const grid = [];
    for (let r = 0; r < g.rows; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        let t = null;
        if (r === g.rows - 1) t = 'bed';
        else if (r > 0) {
          const jr = r + (Math.random() < 0.3 ? randInt(-1, 1) : 0);
          t = jr <= g.L1 ? 'sand' : jr <= g.L2 ? 'clay' : 'stone';
          if (r > 1 && Math.random() < 0.06) t = pick(['sand', 'clay', 'stone']);
          if (r === 1) t = 'sand';
        }
        row.push({ t, dmg: 0, gem: null, geode: false, gcol: null, ladder: false, loose: [], cave: null, seed: Math.random(), hitT: 0 });
      }
      grid.push(row);
    }
    g.grid = grid;
    // bedrock ledges, more of them deeper down
    for (let i = 0; i < [3, 6, 9][T]; i++) {
      const r = randInt(g.L1 + 1, R), c0 = randInt(0, COLS - 3), len = randInt(2, 4);
      for (let c = c0; c < Math.min(COLS, c0 + len); c++) grid[r][c].t = 'bed';
      if (Math.random() < 0.3 && r > 2) grid[r - 1][c0].t = 'bed';
    }
    // little caverns: glow-worms, an underground pool, a sleepy bat
    const kinds = shuffle(['glow', 'pool', 'bat', 'glow']).slice(0, [3, 3, 4][T]);
    for (const kind of kinds) {
      const w = randInt(2, 3), h = kind === 'pool' ? 1 : randInt(1, 2), r = randInt(4, R - 1), c0 = randInt(1, COLS - 1 - w);
      for (let rr = r - h + 1; rr <= r; rr++) for (let c = c0; c < c0 + w; c++) { const cl = grid[rr][c]; cl.t = null; cl.cave = kind; cl.pool = kind === 'pool' && rr === r; }
      grid[r - h + 1][c0].batHere = kind === 'bat';
      for (let c = c0; c < c0 + w; c++) if (grid[r + 1][c].t == null) grid[r + 1][c].t = 'stone';
    }
    // crystals
    const order = g.order, spots = (k) => {
      const [a, b] = ZONE[k], lo = Math.max(2, Math.floor(a * R)), hi = Math.min(R, Math.ceil(b * R));
      for (let n = 0; n < 200; n++) {
        const r = randInt(lo, hi), c = randInt(0, COLS - 1), cl = grid[r][c];
        if (cl.t && cl.t !== 'bed' && !cl.gem && !cl.geode && !(r <= 2 && c <= 4)) return cl;
      }
      return null;
    };
    const place = (k, n) => { for (let i = 0; i < n; i++) { const cl = spots(k); if (cl) cl.gem = k; } };
    for (const o of order) place(o.k, o.need + [2, 2, 1][T] + (o.k === 'white' ? 1 : 0));
    const decoys = Object.keys(GEMS).filter(k => k !== 'white' && !order.some(o => o.k === k));
    for (const k of decoys) place(k, [5, 5, 5][T]);
    const geoCols = order.filter(o => o.k !== 'white').map(o => o.k);
    for (let i = 0; i < [2, 2, 3][T]; i++) { const cl = spots('purple'); if (cl) { cl.geode = true; cl.gcol = pick(geoCols); } }
    // loose boulders resting on rock
    g.boulders = [];
    for (let i = 0, n = 0; i < 300 && n < [3, 7, 11][T]; i++) {
      const r = randInt(2, R - 1), c = randInt(0, COLS - 1), cl = grid[r][c], below = grid[r + 1][c];
      if (!cl.t || cl.t === 'bed' || cl.gem || cl.geode || !below.t || (r <= 2 && c <= 5) || boulderAt(g, c, r - 1) || boulderAt(g, c, r + 1)) continue;
      cl.t = null; g.boulders.push({ c, r, y: r, state: 'rest', t: 0, seed: Math.random() }); n++;
    }
    // only keep crystals Aubrey can actually reach (bedrock and boulders block the way)
    const seen = new Set(['3,0']), q = [[START_C, 0]];
    while (q.length) {
      const [c, r] = q.shift();
      for (const [dc, dr] of Object.values(DIRS)) {
        const nc = c + dc, nr = r + dr, cl = cellAt(g, nc, nr), key = nc + ',' + nr;
        if (!cl || cl.t === 'bed' || boulderAt(g, nc, nr) || seen.has(key)) continue;
        seen.add(key); q.push([nc, nr]);
      }
    }
    const have = {};
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < COLS; c++) {
      const cl = grid[r][c];
      if (!seen.has(c + ',' + r)) { cl.gem = null; cl.geode = false; }
      if (cl.gem) have[cl.gem] = (have[cl.gem] || 0) + 1;
    }
    return order.every(o => (have[o.k] || 0) >= o.need + 1);
  }

  // --- the game -------------------------------------------------------------------------------
  MG.crystalmine = {
    kind: 'action', title: () => 'Crystal Mine', icon: () => '⛏️',
    how: g => `Dig with the arrow keys, or lead Aubrey with your finger. Space or a tap chips at rock. Sand takes 1 tap, clay 2, hard stone 3, and dark bedrock can't be dug! Chip out the crystals Otto wants and bring them up to his mine cart. Watch out for wobbly boulders!`,
    init(g) {
      const T = g.tier - 1;
      const pool = [['purple', 'blue', 'yellow', 'green'], ['purple', 'blue', 'yellow', 'green', 'red'], ['purple', 'blue', 'green', 'red', 'yellow']][T];
      const cols = shuffle(pool).slice(0, [2, 3, 3][T]);
      const needs = [[3, 2], [3, 2, 2], [3, 2, 2]][T];
      g.order = cols.map((k, i) => ({ k, need: needs[i], got: 0 }));
      if (T === 2) g.order.push({ k: 'white', need: 1, got: 0 });
      g.total = g.order.reduce((s, o) => s + o.need, 0);
      for (let i = 0; i < 30 && !genMine(g); i++);
      Object.assign(g, {
        timeLeft: [75, 90, 110][T], cap: [3, 4, 4][T], bag: [], wobbleT: [1.5, 1.2, 1.0][T], lamp: [215, 190, 170][T],
        a: { c: START_C, r: 0, x: START_C, y: 0, moving: false, mode: 'walk', fc: 0, fr: 0, tc: 0, tr: 0, p: 0 },
        facing: 1, dir: 'right', hitCd: 0, swing: 0, swingDir: 'right', stun: 0, cheer: 0,
        camY: 0, fx: [], cartGems: [], bonks: 0, lost: 0, extras: 0, deepest: 0, lastKey: null,
        said: {}, winT: 0,
        say: this.orderLine(g),
      });
    },
    orderLine(g) {
      const left = g.order.filter(o => o.got < o.need).map(o => `${NUM_WORDS[o.need - o.got]} ${GEMS[o.k].word}${o.k === 'white' ? '' : ''}`);
      if (!left.length) return 'The order is all done!';
      const list = left.length > 1 ? `${left.slice(0, -1).join(', ')} and ${left[left.length - 1]}` : left[0];
      return `Otto needs ${list} crystal${g.order.reduce((s, o) => s + Math.max(0, o.need - o.got), 0) > 1 ? 's' : ''}. Dig down and find them!`;
    },
    start(g) { speak(g.say); },
    sayOnce(g, key, s) { if (!g.said[key]) { g.said[key] = true; speak(s); } },

    // world <-> screen helpers
    wx: c => c * C + C / 2,
    wy: r => TOP + r * C,

    puff(g, x, y, col, n = 8, chips = 6) {
      for (let i = 0; i < n; i++) g.fx.push({ kind: 'dust', x: x + rand(-14, 14), y: y + rand(-14, 14), vx: rand(-40, 40), vy: rand(-50, 10), life: rand(0.5, 0.9), max: 0.9, size: rand(8, 15), col: 'rgba(230,210,190,' });
      for (let i = 0; i < chips; i++) g.fx.push({ kind: 'chip', x, y, vx: rand(-170, 170), vy: rand(-240, -60), life: rand(0.5, 0.9), max: 0.9, size: rand(3, 6.5), col, rot: rand(0, 6), vr: rand(-12, 12) });
    },
    sparkle(g, x, y, col, n = 10) {
      for (let i = 0; i < n; i++) g.fx.push({ kind: 'spark', x, y, vx: rand(-120, 120), vy: rand(-160, 20), life: rand(0.6, 1.1), max: 1.1, size: rand(4, 8), col });
    },

    giveGem(g, k, cl, x, y) {
      if (g.bag.length < g.cap) {
        g.bag.push(k); SFX.sparkle();
        tone([784, 988, 1175][g.bag.length % 3], 0.18, 'triangle', 0.05);
        floatText(x, y - g.camY - 20, k === 'white' ? 'A diamond!' : `+1 ${GEMS[k].word}`, GEMS[k].col, false, 20);
        this.sparkle(g, x, y, GEMS[k].col);
        const wanted = g.order.find(o => o.k === k);
        if (!wanted) this.sayOnce(g, 'decoy', `Pretty! But Otto didn't ask for ${GEMS[k].word}. Look at his order at the top.`);
        if (g.bag.length >= g.cap) this.sayOnce(g, 'full', 'Your bag is full! Climb back up and drop the crystals in the mine cart.');
      } else {
        cl.loose.push(k);
        floatText(x, y - g.camY - 20, 'Bag full!', '#ffd0e0', false, 18);
        this.sayOnce(g, 'full', 'Your bag is full! Climb back up and drop the crystals in the mine cart.');
      }
    },

    hit(g, c, r, dir) {
      const cl = cellAt(g, c, r);
      g.swing = 1; g.swingDir = dir;
      const x = this.wx(c), y = this.wy(r) + C / 2;
      if (!cl || cl.t === 'bed') {
        g.hitCd = 0.4; tone(1500, 0.07, 'square', 0.035); tone(1900, 0.06, 'square', 0.025, 0.05);
        if (cl) { cl.hitT = 0.25; this.sparkle(g, x - DIRS[dir][0] * 26, y - DIRS[dir][1] * 26, '#ffffff', 4); }
        this.sayOnce(g, 'bed', "Clink! That's bedrock, the oldest, hardest rock down here. Not even a pickaxe can break it. Go around!");
        return;
      }
      const hp = hpOf(cl);
      g.hitCd = 0.2; cl.dmg++; cl.hitT = 0.18;
      const rk = ROCK[cl.t];
      this.puff(g, x - DIRS[dir][0] * 22, y - DIRS[dir][1] * 22, rk.base, cl.dmg >= hp ? 9 : 4, cl.dmg >= hp ? 10 : 5);
      tone(cl.t === 'sand' ? 240 : cl.t === 'clay' ? 190 : 150, 0.08, 'triangle', 0.08, 0, cl.t === 'stone' ? 90 : 120);
      if (cl.gem === 'white') this.sayOnce(g, 'diamond', 'A diamond! Diamonds are the hardest thing in nature, so it takes four taps to chip one out.');
      else if (cl.geode) this.sayOnce(g, 'geode', 'A geode! It looks like a plain lumpy rock, but there are crystals hiding inside. Crack it open!');
      else if (hp === 2) this.sayOnce(g, 'clay', 'Clay is harder than sand. It takes two taps!');
      else if (hp === 3) this.sayOnce(g, 'stone', 'Hard stone! It takes three taps. Deep rock is the oldest rock of all.');
      if (cl.dmg >= hp) {
        const was = cl.t;
        cl.t = null; cl.dmg = 0;
        SFX.pop();
        if (was === 'sand') this.sayOnce(g, 'sand', 'Soft sand breaks with just one tap!');
        if (cl.gem) { const k = cl.gem; cl.gem = null; this.giveGem(g, k, cl, x, y); }
        if (cl.geode) {
          cl.geode = false; SFX.fanfare();
          this.sparkle(g, x, y, GEMS[cl.gcol].col, 18);
          floatText(x, y - g.camY - 46, 'Geode!', '#fff6a8', false, 22);
          this.giveGem(g, cl.gcol, cl, x, y); this.giveGem(g, cl.gcol, cl, x, y);
        }
      }
    },

    // try to go one step: dig if there's rock in the way, walk or climb if it's open
    tryStep(g, dir) {
      const a = g.a, [dc, dr] = DIRS[dir], c = a.c + dc, r = a.r + dr;
      g.dir = dir;
      if (dc) g.facing = dc;
      if (c < 0 || c >= COLS || r < 0) return;
      const b = boulderAt(g, c, r);
      if (b) { if (g.hitCd <= 0) { g.hitCd = 0.4; SFX.hit(); b.nudge = 0.3; this.sayOnce(g, 'boulder', "That boulder is too big to dig. Dig around it, but never under it!"); } return; }
      if (rockAt(g, c, r)) { if (g.hitCd <= 0) this.hit(g, c, r, dir); return; }
      // open: move. Going up or down leaves a rope ladder so she can always climb back.
      const here = g.grid[a.r][a.c], there = g.grid[r][c];
      if (dr) { here.ladder = true; there.ladder = true; }
      a.moving = true; a.fc = a.c; a.fr = a.r; a.tc = c; a.tr = r; a.p = 0; a.mode = dr < 0 ? 'climb' : dr > 0 ? 'down' : 'walk';
    },

    arrive(g) {
      const a = g.a, cl = g.grid[a.r][a.c];
      while (cl.loose.length && g.bag.length < g.cap) this.giveGem(g, cl.loose.shift(), { loose: [] }, this.wx(a.c), this.wy(a.r) + C / 2);
      if (a.r > g.deepest) {
        g.deepest = a.r;
        if (a.r === g.L1 + 1) this.sayOnce(g, 'layer2', 'We dug into the clay layer! The deeper we go, the older the rock is.');
        if (a.r === g.L2 + 1) this.sayOnce(g, 'layer3', 'Now we are in the hard stone layer. This rock is millions of years old!');
      }
      if (cl.cave === 'pool') { tone(500, 0.2, 'sine', 0.05, 0, 900); this.puff(g, this.wx(a.c), this.wy(a.r) + C - 8, '#8ae8ff', 0, 6); }
      if (cl.cave === 'bat') this.sayOnce(g, 'bat', 'Shh! A sleepy little bat lives down here.');
      if (a.r === 0 && a.c <= CART_C + 1 && g.bag.length) this.deliver(g);
    },

    deliver(g) {
      let good = 0, extra = 0;
      for (const k of g.bag) {
        const o = g.order.find(o => o.k === k);
        if (o && o.got < o.need) { o.got++; good++; } else { extra++; g.extras++; }
        g.cartGems.push({ k, t: 0, x: this.wx(g.a.c), y: this.wy(0) + 20, rot: rand(-0.5, 0.5), dx: rand(-14, 14) });
      }
      g.bag = []; g.cheer = 1;
      SFX.fanfare(); this.sparkle(g, this.wx(CART_C), this.wy(0) + 20, '#fff6a8', 16);
      const done = g.order.every(o => o.got >= o.need);
      g.say = this.orderLine(g);
      if (done) { g.winT = 1.6; speak('Ding ding! The cart is full. You filled the whole order, super miner!'); return; }
      const lead = good ? `Clink clank! ${good === 1 ? 'One' : NUM_WORDS[good][0].toUpperCase() + NUM_WORDS[good].slice(1)} for the order.` : "Those aren't on Otto's order.";
      speak(`${lead} ${g.say}`);
      if (extra && good) floatText(this.wx(CART_C), this.wy(0) - g.camY - 30, 'Extras for Otto!', '#fff', false, 16);
    },

    readDir(g) {
      for (const [k, d] of [['arrowleft', 'left'], ['a', 'left'], ['arrowright', 'right'], ['d', 'right'], ['arrowup', 'up'], ['w', 'up'], ['arrowdown', 'down'], ['s', 'down']]) if (pressed[k]) g.lastKey = [k, d];
      let kd = null;
      if (g.lastKey && keys[g.lastKey[0]]) kd = g.lastKey[1];
      else if (goLeft()) kd = 'left'; else if (goRight()) kd = 'right';
      else if (keys.arrowup || keys.w) kd = 'up'; else if (goDown()) kd = 'down';
      if (kd) { g.usePointer = false; return kd; }
      // or lead her with the mouse or a finger: she steps (and digs) toward the pointer
      const lead = pointerMoved(g) || g.usePointer || pointer.down;
      if (lead && pointer.y > 64) {
        const tc = Math.floor(pointer.x / C), tr = Math.floor((pointer.y + g.camY - TOP) / C), dc = tc - g.a.c, dr = tr - g.a.r;
        if (!dc && !dr) return null;
        const horiz = Math.abs(dc) > Math.abs(dr);
        let d = horiz ? (dc > 0 ? 'right' : 'left') : (dr > 0 ? 'down' : 'up');
        // blocked by bedrock or a boulder? try the other way round
        const [ddc, ddr] = DIRS[d], nc = g.a.c + ddc, nr = g.a.r + ddr, n = cellAt(g, nc, nr);
        if ((!n || n.t === 'bed' || boulderAt(g, nc, nr)) && (horiz ? dr : dc)) d = horiz ? (dr > 0 ? 'down' : 'up') : (dc > 0 ? 'right' : 'left');
        return d;
      }
      return null;
    },

    update(g, dt, id) {
      const a = g.a;
      g.timeLeft -= dt; g.hitCd -= dt; g.swing = Math.max(0, g.swing - dt * 5); g.stun = Math.max(0, g.stun - dt); g.cheer = Math.max(0, g.cheer - dt);
      for (const row of g.grid) for (const cl of row) if (cl.hitT > 0) cl.hitT -= dt;
      if (g.winT > 0) { g.winT -= dt; if (g.winT <= 0) g.done = true; }
      // move along
      if (a.moving) {
        const sp = a.mode === 'fall' ? 9 : a.mode === 'climb' ? 4.6 : 5.6;
        a.p = Math.min(1, a.p + sp * dt);
        a.x = lerp(a.fc, a.tc, a.p); a.y = lerp(a.fr, a.tr, a.p);
        if (a.p >= 1) { a.moving = false; a.c = a.tc; a.r = a.tr; a.x = a.c; a.y = a.r; this.arrive(g); }
      }
      if (!a.moving) {
        const here = g.grid[a.r][a.c], below = cellAt(g, a.c, a.r + 1);
        const dir = g.stun > 0 || g.winT > 0 ? null : this.readDir(g);
        const canFall = below && !solid(g, a.c, a.r + 1) && !here.ladder && !below.ladder;
        if (canFall && dir !== 'up') { a.moving = true; a.fc = a.c; a.fr = a.r; a.tc = a.c; a.tr = a.r + 1; a.p = 0; a.mode = 'fall'; }
        else if (dir) this.tryStep(g, dir);
        else if ((pressed[' '] || pointer.clicked) && g.stun <= 0 && g.winT <= 0) {
          // Space chips at the block she's facing; a tap on a block next to her chips that one
          let d = g.dir;
          if (pointer.clicked) {
            const tc = Math.floor(pointer.x / C), tr = Math.floor((pointer.y + g.camY - TOP) / C);
            d = Object.keys(DIRS).find(k => a.c + DIRS[k][0] === tc && a.r + DIRS[k][1] === tr) || null;
          }
          if (d) { const [dc, dr] = DIRS[d]; if (rockAt(g, a.c + dc, a.r + dr) && g.hitCd <= 0) this.hit(g, a.c + dc, a.r + dr, d); }
        }
      }
      // boulders: wobble when the block under them is dug out, then tumble down
      for (const b of g.boulders) {
        b.nudge = Math.max(0, (b.nudge || 0) - dt);
        if (b.state === 'rest') {
          if (!rockAt(g, b.c, b.r + 1) && !g.boulders.some(o => o !== b && o.c === b.c && Math.round(o.y) === b.r + 1)) {
            b.state = 'wobble'; b.t = g.wobbleT; tone(140, 0.3, 'sawtooth', 0.03); tone(120, 0.3, 'sawtooth', 0.03, 0.15);
            this.sayOnce(g, 'wobble', 'Uh oh, a wobbly boulder! Step out from under it!');
          }
        } else if (b.state === 'wobble') {
          b.t -= dt;
          if (b.t <= 0) { b.state = 'fall'; b.vy = 2; }
        } else if (b.state === 'fall') {
          b.vy = Math.min(10, b.vy + 22 * dt); b.y += b.vy * dt;
          // bonk!
          if (Math.abs(a.x - b.c) < 0.6 && b.y + 0.8 > a.y && b.y < a.y + 0.2) {
            g.bonks++; g.stun = 1.3; b.dead = true;
            this.puff(g, this.wx(b.c), this.wy(a.y) + 10, '#9a8aa8', 14, 14); SFX.miss(); tone(110, 0.3, 'square', 0.06, 0, 60);
            if (g.bag.length) { const k = g.bag.pop(); g.lost++; floatText(this.wx(a.x), this.wy(a.y) - g.camY - 30, `Bonk! The ${GEMS[k].word} crystal broke`, '#ffd0e0', false, 18); this.sparkle(g, this.wx(a.x), this.wy(a.y) + 20, GEMS[k].col, 8); }
            else floatText(this.wx(a.x), this.wy(a.y) - g.camY - 30, 'Bonk!', '#ffd0e0', false, 20);
            speak('Bonk! A falling boulder! When a rock wobbles, step out of the way.');
            continue;
          }
          const nr = Math.floor(b.y) + 1;
          if (rockAt(g, b.c, nr) || g.boulders.some(o => o !== b && !o.dead && o.state !== 'fall' && o.c === b.c && o.r === nr)) {
            b.y = nr - 1; b.r = nr - 1; b.state = 'rest'; b.vy = 0;
            this.puff(g, this.wx(b.c), this.wy(b.r) + C - 6, '#c8b8d8', 10, 0); tone(80, 0.25, 'sine', 0.12, 0, 50);
          }
        }
      }
      g.boulders = g.boulders.filter(b => !b.dead);
      // effects
      for (const p of g.fx) {
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.kind === 'chip') { p.vy += 700 * dt; p.rot += p.vr * dt; } else if (p.kind === 'spark') { p.vy += 120 * dt; } else { p.vx *= 0.94; p.vy *= 0.94; p.size += dt * 10; }
      }
      g.fx = g.fx.filter(p => p.life > 0);
      for (const cg of g.cartGems) cg.t = Math.min(1, cg.t + dt * 1.6);
      // camera follows her down the mine
      const target = clamp(this.wy(a.y) + C - 330, 0, TOP + g.rows * C - H);
      g.camY = lerp(g.camY, target, Math.min(1, dt * 6));
      if (g.bag.length >= g.cap && a.r > 0) g.say = 'Your bag is full! Climb back up to the mine cart.';
      g.progress = `Order: ${g.order.reduce((s, o) => s + o.got, 0)} of ${g.total}`;
      g.score = clamp(g.order.reduce((s, o) => s + Math.min(o.got, o.need), 0) / g.total, 0, 1);
      if (g.timeLeft <= 0) g.done = true;
    },

    // ---------------------------------------------------------------------------------------
    drawSurface(g, t, oy) {
      // the grotto behind the waterfall: daylight spills in from the left
      const y0 = -oy, y1 = TOP + C - oy;
      if (y1 < 0) return;
      const sg = ctx.createLinearGradient(0, y0, 0, y1);
      sg.addColorStop(0, '#3a6a8a'); sg.addColorStop(1, '#6f8fb0');
      ctx.fillStyle = sg; ctx.fillRect(0, y0, W, y1 - y0);
      // waterfall curtain at the far right with light through it
      const wf = ctx.createLinearGradient(820, 0, 960, 0); wf.addColorStop(0, 'rgba(160,230,255,0)'); wf.addColorStop(1, 'rgba(200,245,255,.85)');
      ctx.fillStyle = wf; ctx.fillRect(820, y0, 140, y1 - y0);
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) { const x = 870 + i * 12, ph = (t * 160 + i * 37) % 60; ctx.beginPath(); ctx.moveTo(x, y0 + ph); ctx.lineTo(x, y0 + ph + 40); ctx.moveTo(x, y0 + ph + 70); ctx.lineTo(x, y0 + ph + 110); ctx.stroke(); }
      // rocky ceiling with stalactites
      ctx.fillStyle = '#2c2450'; ctx.fillRect(0, y0, W, 64);
      for (let i = 0; i < 18; i++) {
        const x = 20 + i * 54 + (i % 3) * 8, h = 16 + ((i * 37) % 26);
        ink(P2(`M${x - 14},${y0 + 62} L${x + 14},${y0 + 62} L${x + 2},${y0 + 62 + h} Z`), i % 2 ? '#3a2f6a' : '#45387a', 1, '#1e1446');
        if (i % 4 === 1) { glow(x + 2, y0 + 66 + h, 10, '160,230,255', 0.6); }
      }
      // glow-worms
      for (let i = 0; i < 22; i++) { const x = (i * 97 + 30) % 900, y = y0 + 80 + (i * 29) % 50, k = 0.5 + 0.5 * Math.sin(t * 2 + i); ctx.fillStyle = `rgba(170,255,230,${k})`; circle(x, y, 1.8); }
      // wooden mine entrance beams
      const bx = 400;
      inkRect(bx - 6, y1 - 150, 14, 150, '#a0683a', 1.6, 3); inkRect(bx + 120, y1 - 150, 14, 150, '#a0683a', 1.6, 3);
      inkRect(bx - 18, y1 - 162, 164, 18, '#b8794a', 1.6, 4);
      text('MINE', bx + 64, y1 - 153, 14, '#ffe9b8', 'center', 800);
      // lantern
      ctx.strokeStyle = '#2a1446'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 64, y1 - 144); ctx.lineTo(bx + 64, y1 - 126); ctx.stroke();
      glow(bx + 64, y1 - 112, 40, '255,220,140', 0.6 + 0.1 * Math.sin(t * 7));
      inkRect(bx + 56, y1 - 124, 16, 20, '#ffd98a', 1.2, 4);
      // rails along the floor
      ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 5;
      for (let x = 6; x < 230; x += 20) { ctx.beginPath(); ctx.moveTo(x, y1 - 2); ctx.lineTo(x + 8, y1 - 2); ctx.stroke(); }
      ctx.strokeStyle = '#a8b0c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, y1 - 6); ctx.lineTo(230, y1 - 6); ctx.stroke();
      // Otto's order board
      const ox = 650, oy2 = y1 - 112;
      inkRect(ox + 60, oy2 + 40, 8, 72, '#8a5a32', 1.2, 2);
      inkRect(ox, oy2 - 4, 128, 52, '#c8945a', 1.6, 6);
      text("Otto's order", ox + 64, oy2 + 8, 12, '#4a2a14', 'center', 800);
      g.order.forEach((o, i) => { const x = ox + 64 + (i - (g.order.length - 1) / 2) * 30; gemIcon(o.k, x - 6, oy2 + 30, 14); text(`${o.need}`, x + 8, oy2 + 34, 12, '#4a2a14', 'left', 800); });
    },
    drawCart(g, t, oy) {
      const x = this.wx(CART_C), y = TOP + C - oy - 6;
      if (y < -60) return;
      // gems heaped in the cart (behind the front panel)
      g.cartGems.forEach((cg, i) => {
        const tx = x - 20 + (i % 6) * 8 + cg.dx * 0.2, ty = y - 40 - Math.floor(i / 6) * 7;
        const e = cg.t, gx = lerp(cg.x, tx, e), gy = lerp(cg.y - oy, ty, e) - Math.sin(e * Math.PI) * 60;
        gemIcon(cg.k, gx, gy - 6, 14, cg.rot);
      });
      ink(P2(`M${x - 34},${y - 40} L${x + 34},${y - 40} L${x + 28},${y - 8} L${x - 28},${y - 8} Z`), '#7a8aa8', 1.6, '#2a1446');
      ctx.fillStyle = '#5a6a88'; ctx.fillRect(x - 30, y - 30, 60, 4);
      for (const dx of [-18, 18]) { inkCircle(x + dx, y - 6, 8, '#3a3a52', 1.2, '#1a1430'); ctx.fillStyle = '#9aa0c0'; circle(x + dx, y - 6, 3); }
      if (g.bag.length && g.a.r > 0) {
        // a bobbing arrow: bring them here!
        const by = y - 70 + Math.sin(t * 5) * 5;
        ctx.fillStyle = '#fff59a'; tri(x - 10, by, x + 10, by, x, by + 14); ctx.fillRect(x - 4, by - 14, 8, 14);
      }
    },
    drawCell(g, cl, c, r, x, y, t) {
      if (!cl.t) return;
      const rk = ROCK[cl.t], sh = cl.hitT > 0 ? Math.sin(cl.hitT * 90) * 2.5 : 0;
      x += sh;
      const deep = clamp((r - 1) / g.R, 0, 1) * 0.22;
      rrect(x + 1, y + 1, C - 2, C - 2, 10, mix(rk.base, '#1a1030', deep), mix(rk.line, '#000', deep), 2);
      ctx.save(); ctx.beginPath(); ctx.roundRect(x + 2, y + 2, C - 4, C - 4, 9); ctx.clip();
      ctx.fillStyle = mix(rk.hi, '#1a1030', deep); ctx.fillRect(x, y, C, 7);
      ctx.fillStyle = mix(rk.lo, '#1a1030', deep); ctx.fillRect(x, y + C - 8, C, 8);
      const s = cl.seed;
      if (cl.t === 'sand') {
        ctx.fillStyle = mix(rk.lo, '#1a1030', deep);
        for (let i = 0; i < 9; i++) circle(x + 8 + hash(s, i) * (C - 16), y + 12 + hash(i, s) * (C - 24), 1.6 + hash(s + 1, i));
      } else if (cl.t === 'clay') {
        ctx.strokeStyle = mix(rk.hi, '#1a1030', deep); ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) { const yy = y + 20 + i * 20 + s * 6; ctx.beginPath(); ctx.moveTo(x + 8, yy); ctx.bezierCurveTo(x + 24, yy - 6, x + 40, yy + 6, x + C - 8, yy); ctx.stroke(); }
      } else if (cl.t === 'stone') {
        ctx.fillStyle = mix(rk.hi, '#1a1030', deep);
        ctx.beginPath(); ctx.moveTo(x + 10 + s * 10, y + 14); ctx.lineTo(x + 30 + s * 8, y + 10); ctx.lineTo(x + 26, y + 28); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = mix(rk.line, '#1a1030', deep); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 36, y + 30 + s * 8); ctx.lineTo(x + 46, y + 40); ctx.lineTo(x + 54, y + 38); ctx.stroke();
      } else {
        // bedrock: dark, heavy, with tiny glints
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
        for (let i = -1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 18, y + C); ctx.lineTo(x + i * 18 + C * 0.6, y); ctx.stroke(); }
        twk(x + 14 + s * 30, y + 18 + s * 20, 3, 0.3 + 0.3 * Math.sin(t * 2 + s * 20));
      }
      // cracks show how many taps it has taken
      if (cl.dmg > 0) {
        ctx.strokeStyle = 'rgba(30,10,40,.8)'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
        for (let i = 0; i < cl.dmg * 2; i++) {
          const ang = hash(s, i) * Math.PI * 2, cx = x + C / 2, cy = y + C / 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14 + 4); ctx.lineTo(cx + Math.cos(ang + 0.3) * 30, cy + Math.sin(ang + 0.3) * 30); ctx.stroke();
        }
      }
      ctx.restore();
      if (cl.geode) {
        inkEllipse(x + C / 2, y + C / 2 + 2, 22, 19, 0.2, '#a49cb0', 1.4, '#2a1446');
        ctx.fillStyle = '#8a8298'; ellipse(x + C / 2 + 6, y + C / 2 + 8, 12, 7, 0.2);
        ctx.strokeStyle = '#2a1446'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 18, y + 24); ctx.lineTo(x + 28, y + 32); ctx.lineTo(x + 34, y + 26); ctx.lineTo(x + 44, y + 36); ctx.stroke();
        glow(x + 32, y + 30, 14, '210,160,255', 0.5 + 0.3 * Math.sin(t * 3 + s * 10));
        twk(x + 30, y + 29, 5, 0.6 + 0.4 * Math.sin(t * 4 + s * 7), '#e8c8ff');
      }
      if (cl.gem) cluster(cl.gem, x + C / 2, y + C / 2 - 2, t, s);
    },
    drawOpen(g, cl, c, r, x, y, t) {
      // dug-out tunnel: the darker back wall
      if (r > 0) {
        ctx.fillStyle = 'rgba(20,10,30,.35)'; ctx.fillRect(x, y, C, C);
        ctx.fillStyle = 'rgba(255,255,255,.06)';
      } else ctx.fillStyle = 'rgba(0,0,0,0)';
      for (let i = 0; i < 4; i++) circle(x + 8 + hash(cl.seed, i) * (C - 16), y + 8 + hash(i, cl.seed) * (C - 16), 3 + hash(cl.seed, i + 4) * 3);
      if (cl.pool) {
        const wg = ctx.createLinearGradient(0, y + C * 0.55, 0, y + C); wg.addColorStop(0, 'rgba(110,220,250,.9)'); wg.addColorStop(1, 'rgba(40,120,200,.95)');
        ctx.fillStyle = wg; ctx.fillRect(x, y + C * 0.55, C, C * 0.45);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x, y + C * 0.55, C, 2);
        twk(x + 16 + Math.sin(t + c) * 10, y + C * 0.7, 4, 0.5 + 0.5 * Math.sin(t * 3 + c));
      }
      if (cl.cave === 'glow' && rockAt(g, c, r - 1)) {
        for (let i = 0; i < 3; i++) {
          const gx = x + 12 + i * 20, len = 10 + hash(cl.seed, i) * 18 + Math.sin(t * 1.5 + i) * 2;
          ctx.strokeStyle = 'rgba(200,255,240,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + len); ctx.stroke();
          glow(gx, y + len, 9, '150,255,220', 0.7); ctx.fillStyle = '#e8fff8'; circle(gx, y + len, 2);
        }
      }
      if (cl.batHere) bat(x + C / 2, y + 14, t);
      if (cl.ladder) {
        ctx.strokeStyle = '#c99a5a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.lineTo(x + 18, y + C); ctx.moveTo(x + C - 18, y); ctx.lineTo(x + C - 18, y + C); ctx.stroke();
        ctx.strokeStyle = '#e8c08a'; ctx.lineWidth = 3;
        for (let k = 0; k < 4; k++) { const yy = y + 8 + k * 16; ctx.beginPath(); ctx.moveTo(x + 18, yy); ctx.lineTo(x + C - 18, yy); ctx.stroke(); }
      }
      cl.loose.forEach((k, i) => gemIcon(k, x + 18 + i * 14, y + C - 14, 14, (i - 1) * 0.3));
    },
    drawBoulder(g, b, oy, t) {
      const x = this.wx(b.c) + (b.state === 'wobble' ? Math.sin(t * 40) * 3 : b.nudge > 0 ? Math.sin(t * 60) * 2 : 0), y = this.wy(b.y) - oy + C / 2 + 2;
      const rot = b.state === 'wobble' ? Math.sin(t * 30) * 0.12 : 0;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ellipse(0, 26, 24, 5);
      ink(P2('M-27,6 C-29,-14 -12,-27 4,-26 C20,-25 29,-12 28,4 C27,20 14,28 0,28 C-16,28 -26,20 -27,6 Z'), '#8a7e98', 1.6, '#2a1446');
      ctx.fillStyle = '#a89cb8'; ellipse(-8, -10, 12, 8, -0.4);
      ctx.fillStyle = '#6e6280'; ellipse(10, 14, 12, 7, 0.3);
      ctx.restore();
      if (b.state === 'wobble') {
        const by = y - 46 + Math.sin(t * 10) * 3;
        inkCircle(x, by, 13, '#ffd84a', 1.2, '#2a1446'); text('!', x, by + 1, 18, '#2a1446', 'center', 900);
        for (const dx of [-30, 30]) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + dx, y - 10); ctx.lineTo(x + dx * 1.3, y - 16); ctx.moveTo(x + dx, y + 2); ctx.lineTo(x + dx * 1.35, y + 2); ctx.stroke(); }
      }
    },
    drawAubreyMiner(g, oy, t) {
      const a = g.a, x = this.wx(a.x), feet = this.wy(a.y) + C - oy - 2;
      let frame = 'idle_front';
      if (g.cheer > 0 || g.winT > 0) frame = 'twirl';
      else if (a.moving && a.mode === 'fall') frame = 'jump';
      else if (a.moving && a.mode === 'climb') frame = 'idle_back';
      else if (a.moving) frame = `run${1 + Math.floor(t * 12) % 5}`;
      else if (g.swing > 0 && g.swingDir === 'down') frame = 'crouch';
      else if (g.swing > 0 || g.hitCd > -0.4) frame = 'run3';
      const s = frame === 'twirl' ? SCALE * 0.85 : SCALE, im = IMG[frame], f = g.facing;
      const lift = g.cheer > 0 ? Math.sin(g.cheer * Math.PI) * 10 : 0;
      drawAubrey(x, feet, frame, f, lift, s);
      // head position in this frame (side-on frames face right natively)
      const HEAD = { idle_front: 1.5, idle_back: 0, run1: 12.5, run2: 28.5, run3: 24, run4: 23, run5: 28.5, jump: -30, crouch: -7, twirl: 2 };
      const side = /run|jump|crouch/.test(frame);
      const hx = x + (HEAD[frame] || 0) * s * (side ? (frame === 'jump' || frame === 'crouch' ? -f : f) : 1), hy = feet - lift - im.height * s + 6;
      // pickaxe in her hand (behind the helmet), swinging when she chips
      const ph = g.swing, sd = g.swingDir;
      const base = sd === 'down' ? 1.9 : sd === 'up' ? -0.3 : 1.1;
      const ang = frame === 'idle_back' ? -0.4 : (ph > 0 ? lerp(-0.9, base, 1 - ph) : 0.35) * (sd === 'up' || sd === 'down' ? f : f);
      if (frame !== 'twirl') pickaxe(x + f * 9, feet - lift - im.height * s * 0.5, ang, f);
      // miner's helmet with a headlamp
      ctx.save(); ctx.translate(hx, hy);
      ink(P2('M-10,2 C-10,-10 10,-10 10,2 Z'), '#ffcf2e', 1.1, '#2a1446');
      ink(P2('M-13,1 L13,1 L13,4 L-13,4 Z'), '#f0a820', 0.9, '#2a1446');
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-4, -4, 3, 1.8, -0.5);
      if (frame !== 'idle_back') {
        const lx = side ? f * 8 : 0;
        glow(lx, -3, 16, '255,250,200', 0.8);
        inkCircle(lx, -3, 3.6, '#fffbe0', 0.9, '#2a1446');
      }
      ctx.restore();
      if (g.stun > 0) for (let i = 0; i < 3; i++) { const an = t * 6 + i * 2.1; star(hx + Math.cos(an) * 16, hy - 6 + Math.sin(an) * 5, 5, '#fff59a', 5); }
      return { hx, hy };
    },
    draw(g) {
      const t = S.t, oy = g.camY;
      // the underground: warm sandy browns near the top, deep violet and blue far down
      const wgr = ctx.createLinearGradient(0, TOP - oy, 0, TOP + g.rows * C - oy);
      wgr.addColorStop(0, '#6e4a36'); wgr.addColorStop(0.3, '#6a3a40'); wgr.addColorStop(0.62, '#3e3466'); wgr.addColorStop(1, '#1e1a44');
      ctx.fillStyle = wgr; ctx.fillRect(0, 0, W, H);
      this.drawSurface(g, t, oy);
      const r0 = Math.max(0, Math.floor((oy - TOP) / C)), r1 = Math.min(g.rows - 1, Math.ceil((oy + H - TOP) / C));
      for (let r = r0; r <= r1; r++) for (let c = 0; c < COLS; c++) {
        const cl = g.grid[r][c], x = c * C, y = TOP + r * C - oy;
        if (cl.t) this.drawCell(g, cl, c, r, x, y, t); else if (r > 0) this.drawOpen(g, cl, c, r, x, y, t);
        else if (cl.ladder) this.drawOpen(g, { ...cl, loose: [] }, c, r, x, y, t);
      }
      // grassy, mossy lip where the mine meets the grotto floor
      const gy = TOP + C - oy;
      if (gy > -10 && gy < H) for (let c = 0; c < COLS; c++) if (g.grid[1][c].t) {
        ctx.fillStyle = '#5ac87a'; ctx.fillRect(c * C, gy, C, 6);
        for (let k = 0; k < 5; k++) { const x = c * C + 6 + k * 12; ctx.fillStyle = k % 2 ? '#7ae08a' : '#4ab86a'; tri(x - 4, gy + 4, x + 4, gy + 4, x, gy - 6 - (k % 3) * 2); }
      }
      this.drawCart(g, t, oy);
      if (TOP + C - oy > 0) drawCritter('Otto the Otter', 30, TOP + C - oy, 0.38, 1);
      for (const b of g.boulders) this.drawBoulder(g, b, oy, t);
      const head = this.drawAubreyMiner(g, oy, t);
      // flying chips, dust puffs and sparkles
      for (const p of g.fx) {
        const k = clamp(p.life / p.max, 0, 1), x = p.x, y = p.y - oy;
        if (p.kind === 'dust') { ctx.fillStyle = p.col + (0.45 * k) + ')'; circle(x, y, p.size); }
        else if (p.kind === 'chip') { ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.globalAlpha = Math.min(1, k * 2); ink(P2(`M${-p.size},${-p.size * 0.6} L${p.size},${-p.size * 0.8} L${p.size * 0.6},${p.size} Z`), p.col, 0.6, '#2a1446'); ctx.restore(); ctx.globalAlpha = 1; }
        else twk(x, y, p.size, k, p.col);
      }
      // darkness beyond the headlamp
      this.drawDark(g, head, oy, t);
      this.drawHud(g, t);
    },
    drawDark(g, head, oy, t) {
      if (!this.dk) { this.dk = document.createElement('canvas'); this.dk.width = W; this.dk.height = H; }
      const d = this.dk.getContext('2d');
      d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H);
      const s0 = TOP + C * 1.2 - oy, s1 = TOP + C * 4 - oy, dark = [0.8, 0.85, 0.9][g.tier - 1];
      const lg = d.createLinearGradient(0, s0, 0, s1);
      lg.addColorStop(0, 'rgba(8,4,22,0)'); lg.addColorStop(1, `rgba(8,4,22,${dark})`);
      d.fillStyle = lg; d.fillRect(0, Math.max(0, s0), W, H);
      d.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r, a) => { const gr = d.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.fillRect(x - r, y - r, r * 2, r * 2); };
      const L = g.lamp * (1 + 0.02 * Math.sin(t * 9));
      hole(head.hx + g.facing * 26, head.hy + 18, L, 1);
      hole(head.hx, head.hy + 30, L * 0.6, 1);
      const r0 = Math.max(0, Math.floor((oy - TOP) / C)), r1 = Math.min(g.rows - 1, Math.ceil((oy + H - TOP) / C));
      for (let r = r0; r <= r1; r++) for (let c = 0; c < COLS; c++) {
        const cl = g.grid[r][c], x = c * C + C / 2, y = TOP + r * C - oy + C / 2;
        if (cl.cave === 'glow' && rockAt(g, c, r - 1)) hole(x, y - 10, 90, 0.75);
        if (cl.gem || cl.geode) hole(x, y, 26, 0.35 + 0.15 * Math.sin(t * 2.5 + cl.seed * 9));
      }
      ctx.drawImage(this.dk, 0, 0);
      // crystals glimmer through the dark
      for (let r = r0; r <= r1; r++) for (let c = 0; c < COLS; c++) {
        const cl = g.grid[r][c];
        if (!cl.gem && !cl.geode) continue;
        const x = c * C + C / 2, y = TOP + r * C - oy + C / 2, k = cl.gem || 'purple';
        twk(x + 6 * Math.sin(cl.seed * 9), y - 6, 6, 0.25 + 0.55 * Math.max(0, Math.sin(t * 2.2 + cl.seed * 40)), GEMS[k].col);
      }
    },
    drawHud(g, t) {
      // Otto's order, under the title
      const ow = 24 + g.order.length * 86;
      darkPanel(12, 64, ow, 46, 16);
      g.order.forEach((o, i) => {
        const x = 34 + i * 86, done = o.got >= o.need;
        gemIcon(o.k, x, 87, 22);
        text(`${o.got}/${o.need}`, x + 18, 88, 17, done ? '#9affb0' : '#fff', 'left', 800);
        if (done) text('✓', x + 62, 88, 16, '#9affb0', 'center', 900);
      });
      // the bag
      const bw = 26 + g.cap * 34;
      darkPanel(W - 12 - bw, 64, bw, 46, 16);
      emoji('🎒', W - bw + 6, 87, 22);
      for (let i = 0; i < g.cap; i++) {
        const x = W - bw + 38 + i * 34 - 6;
        rrect(x - 13, 74, 26, 26, 8, 'rgba(255,255,255,.12)', g.bag.length >= g.cap ? '#ffd84a' : 'rgba(255,255,255,.35)', 2);
        if (g.bag[i]) gemIcon(g.bag[i], x, 86, 18);
      }
      // what rock layer we're in, and how hard each rock is
      const lay = layerOf(g, g.a.r);
      const lbl = { surface: 'At the mine cart', sand: 'Sand layer: young rock', clay: 'Clay layer: older rock', stone: 'Stone layer: very old rock' }[lay];
      darkPanel(12, H - 52, 360, 40, 14);
      text(`⛏ ${g.a.r * 2} m deep`, 26, H - 32, 15, '#fff', 'left', 800);
      text(lbl, 140, H - 32, 14, '#ffe9b8', 'left', 600);
      darkPanel(W - 352, H - 52, 340, 40, 14);
      [['sand', '1'], ['clay', '2'], ['stone', '3'], ['bed', '✖']].forEach(([k, n], i) => {
        const x = W - 340 + i * 82, rk = ROCK[k];
        rrect(x, H - 44, 24, 24, 6, rk.base, rk.line, 2);
        text(n === '✖' ? 'never' : `${n} tap${n === '1' ? '' : 's'}`, x + 30, H - 32, 13, '#fff', 'left', 700);
      });
    },
  };

  restage('crystalcreek', {
    // Colour Mix is a paint game now, so the hand-over line talks about paint, not crystals in the water
    mid: ['N:Look at all those crystals! Now, crystals sparkle in every colour, and so can paint.',
      'N:Drag two colours into my mixing bowl and stir them round. What colour will you make?',
      'A:thinking:Like mixing paint! Red and yellow make...'],
    games: [['crystalmine', 'crystal', {}], ['colourmix', 'shell', {}]],
    intro: [
      "N:Psst, Aubrey! Behind my waterfall there's a secret crystal mine, and my mine cart is empty!",
      'A:excited:A real crystal mine? Can I dig for crystals?',
      "N:Here's a miner's helmet with a headlamp, and a little pickaxe. Dig down, chip the crystals out of the rock, and bring them up to my cart!",
      "N:Soft sand breaks with one tap, clay takes two, and hard stone takes three. But dark bedrock is too hard for anybody!",
      "N:And if a boulder starts to wobble, hop out of the way. Bonk!",
      'A:determined:Helmet on, lamp on. Let\'s go mining!',
    ],
  });
}
