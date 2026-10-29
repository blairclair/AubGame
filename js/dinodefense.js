'use strict';
// The dinosaur route's finale (in place of the talent show): Aubrey leads the baby dino through a jungle
// canyon maze to his mama and papa, while "baby-snatcher" dinosaurs try to grab him. Nobody gets hurt:
// shooed dinos get startled, dizzy, sticky or sleepy, or stomp off with a "Hmph!". Supplies gathered on the
// earlier days (what's left in S.mats plus whatever went into crafted items) unlock special abilities on keys 1..n.
// Finishes by calling dinoDefenseDone({ reunited, abilities, charmed, time, snatches }).
{
  const C = 150, T = 34, COLS = 16, ROWS = 9, WW = COLS * C, WH = ROWS * C, M = 110;
  const BN = 1, BE = 2, BS = 4, BW = 8;
  const DIRS = [[BN, 0, -1, BS], [BE, 1, 0, BW], [BS, 0, 1, BN], [BW, -1, 0, BE]];
  const AUB_SPD = 205, AUB_S = 0.4, AUB_R = 14, HELP_AT = 120, BABY_S = 0.95;
  const BABY_PAL = { body: '#7fd88a', dark: '#5fbf70', belly: '#fff3d0', plate: '#ff8a80', plateDark: '#f06a68' };
  const DD_MAMA = { body: '#74cf86', dark: '#55b46a', belly: '#fff0cc', plate: '#ff8fa8', plateDark: '#ee6f8e' };
  const DD_PAPA = { body: '#62bf8a', dark: '#46a170', belly: '#f6ecc4', plate: '#ffa060', plateDark: '#ee7f40' };

  // the dinos who want the baby: grump = how many shoos before they give up
  const KIND = {
    raptor: { name: 'Sneaky Raptor', grump: 4, spd: 148, r: 16, h: 64, s: 0.85, snatch: true,
      pal: { body: '#b79cf2', dark: '#8f70d8', belly: '#f6eaff', stripe: '#7d5cc8', crest: '#ff8fc8' } },
    compy: { name: 'Compy', grump: 1, spd: 138, r: 11, h: 40, s: 0.5, snatch: true,
      pal: { body: '#c4e04c', dark: '#9ec030', belly: '#fbf7c8', stripe: '#ff9a3a', crest: '#ff9a3a' } },
    ptero: { name: 'Pterodactyl', grump: 2, spd: 200, r: 18, h: 34, s: 0.9, snatch: true, fly: true },
    dilo: { name: 'Spitty Dilophosaurus', grump: 3, spd: 55, r: 16, h: 74, s: 0.85,
      pal: { body: '#56c8bc', dark: '#36a89e', belly: '#e8fff6', stripe: '#2e8f88', crest: '#ff6f9f', frill: '#ffd36b' } },
    trex: { name: 'Grumpy T-Rex', grump: 16, spd: 0, r: 46, h: 128, s: 0.82 },
  };
  // where along the route each little group waits
  const WAVES = [
    [0.1, ['compy', 'compy', 'compy']],
    [0.2, ['raptor']],
    [0.29, ['dilo']],
    [0.37, ['ptero']],
    [0.45, ['compy', 'compy', 'raptor']],
    [0.58, ['trex']],
    [0.66, ['raptor', 'compy']],
    [0.74, ['dilo', 'compy', 'compy']],
    [0.82, ['ptero', 'raptor']],
    [0.9, ['raptor', 'compy']],
  ];
  const BYE = { sleep: 'Zzz... hmph.', happy: 'Bye-bye!', eat: 'Yum! Bye!', tangle: 'Hmph!' };
  const WORDS = { startle: ['Eek!', 'Yikes!', 'Oops!', 'Eep!'] };

  // ---------------------------------------------------------------------------------------------
  // Special abilities. One per material type gathered; level 1-3 by how many of that type.
  // ---------------------------------------------------------------------------------------------
  const ABIL = {
    roar:     { name: 'Little Roar',    cd: 6,  col: '#5fbf70', what: 'Baby does his biggest "RAWR!"' },
    feather:  { name: 'Whoosh Gust',    cd: 6,  col: '#7fb8ff', what: 'A big wind blows dinos away' },
    petal:    { name: 'Petal Flurry',   cd: 9,  col: '#ff8fc8', what: 'Swirly petals get dinos all mixed up' },
    ribbon:   { name: 'Ribbon Lasso',   cd: 7,  col: '#ff6fa8', what: 'Lasso a dino, or pull Baby back' },
    berry:    { name: 'Berry Snack',    cd: 10, col: '#7b6cf0', what: 'Toss berries, and dinos stop to munch' },
    shell:    { name: 'Shell Horn',     cd: 9,  col: '#f0a070', what: 'A loud TOOT sends dinos running' },
    crystal:  { name: 'Sparkle Shield', cd: 12, col: '#6fd6f0', what: 'A sparkly bubble keeps Baby safe' },
    silk:     { name: 'Silk Net',       cd: 7,  col: '#b08ae0', what: 'Throw a soft net over a dino' },
    honey:    { name: 'Honey Trap',     cd: 9,  col: '#f0b030', what: 'A sticky puddle for dinos to get stuck in' },
    stardust: { name: 'Star Burst',     cd: 10, col: '#f6c838', what: 'Stars make every dino dizzy' },
    rainbow:  { name: 'Rainbow Beam',   cd: 10, col: '#ff7a7a', what: 'Dinos get too happy to be naughty' },
    moonbeam: { name: 'Sleepy Lullaby', cd: 12, col: '#6a6ad8', what: 'A soft song sends dinos to sleep' },
    ember:    { name: 'Warm Flash',     cd: 10, col: '#ff8a3a', what: 'A bright, warm flash startles everyone' },
  };
  const abIcon = id => id === 'roar' ? '🦖' : (MATS[id]?.icon || '✨');

  // how many of each material she gathered over the days: still in the bag, plus whatever went into crafted things
  function gathered() {
    const n = {};
    for (const k of MAT_ORDER) n[k] = Math.max(0, +(S.mats?.[k]) || 0);
    if (S.gathered) for (const k of MAT_ORDER) n[k] = Math.max(n[k], +S.gathered[k] || 0);
    else for (const id in S.owned || {}) {
      const it = ITEM[id];
      if (!S.owned[id] || !it || !it.cost) continue;
      for (const [k, c] of Object.entries(it.cost)) if (k in n) n[k] += c;
    }
    return n;
  }
  function pickAbilities() {
    const n = gathered(), total = MAT_ORDER.reduce((s, k) => s + n[k], 0);
    const slots = total === 0 ? 1 : total < 8 ? 2 : total < 20 ? 3 : total < 40 ? 4 : total < 70 ? 5 : 6;
    const types = MAT_ORDER.filter(k => n[k] > 0 && ABIL[k])
      .sort((a, b) => n[b] - n[a] || MATS[b].tier - MATS[a].tier).slice(0, slots);
    const list = [{ id: 'roar', lvl: 1 + (total >= 30) + (total >= 60), n: 0, baby: true }];
    for (const k of types) list.push({ id: k, n: n[k], lvl: n[k] >= 8 ? 3 : n[k] >= 4 ? 2 : 1 });
    if (list.length < 2) list.push({ id: 'feather', n: 0, lvl: 1, gift: true });
    for (const a of list) a.cd = 0;
    return { total, list };
  }

  // ---------------------------------------------------------------------------------------------
  // The maze: a seeded depth-first maze (same every time) with a few loops and a clearing at each end
  // ---------------------------------------------------------------------------------------------
  let seed = 1;
  const srand = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const sr = (a, b) => a + srand() * (b - a);
  const spick = a => a[Math.floor(srand() * a.length)];
  let MAZE = null;
  function buildMaze() {
    seed = 95; // picked for a nice long winding route (49 cells)
    const walls = Array.from({ length: ROWS }, () => Array(COLS).fill(15));
    const seen = walls.map(r => r.map(() => false));
    const stack = [[0, ROWS - 1]]; seen[ROWS - 1][0] = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const opts = DIRS.filter(([, dx, dy]) => seen[y + dy]?.[x + dx] === false);
      if (!opts.length) { stack.pop(); continue; }
      const [bit, dx, dy, back] = spick(opts);
      walls[y][x] &= ~bit; walls[y + dy][x + dx] &= ~back; seen[y + dy][x + dx] = true;
      stack.push([x + dx, y + dy]);
    }
    const open = (x, y, bit) => { const d = DIRS.find(q => q[0] === bit); walls[y][x] &= ~bit; walls[y + d[2]][x + d[1]] &= ~d[3]; };
    for (let i = 0; i < 8; i++) open(Math.floor(sr(0, COLS - 1)), Math.floor(sr(0, ROWS)), BE);
    for (let i = 0; i < 4; i++) open(Math.floor(sr(0, COLS)), Math.floor(sr(0, ROWS - 1)), BS);
    // the nest clearing (top right, 2x2) and a little start clearing (bottom left)
    open(COLS - 2, 0, BE); open(COLS - 2, 1, BE); open(COLS - 2, 0, BS); open(COLS - 1, 0, BS);
    open(0, ROWS - 1, BE);
    const rects = [];
    const add = (x, y, w, h, border) => rects.push({ x, y, w, h, border });
    add(-M, -M, WW + 2 * M, M + T / 2, true); add(-M, WH - T / 2, WW + 2 * M, M + T / 2, true);
    add(-M, -M, M + T / 2, WH + 2 * M, true); add(WW - T / 2, -M, M + T / 2, WH + 2 * M, true);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (x < COLS - 1 && walls[y][x] & BE) add((x + 1) * C - T / 2, y * C - T / 2, T, C + T);
      if (y < ROWS - 1 && walls[y][x] & BS) add(x * C - T / 2, (y + 1) * C - T / 2, C + T, T);
    }
    return { walls, rects };
  }
  function bfs(sx, sy) {
    const w = MAZE.walls, d = w.map(r => r.map(() => 1e9)), q = [[sx, sy]];
    d[sy][sx] = 0;
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      for (const [bit, dx, dy] of DIRS) if (!(w[y][x] & bit) && d[y + dy][x + dx] > d[y][x] + 1) { d[y + dy][x + dx] = d[y][x] + 1; q.push([x + dx, y + dy]); }
    }
    return d;
  }
  const cellOf = (x, y) => [clamp(Math.floor(x / C), 0, COLS - 1), clamp(Math.floor(y / C), 0, ROWS - 1)];
  const ctr = (cx, cy) => [(cx + 0.5) * C, (cy + 0.5) * C];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // the next point to head for, to get from (x, y) toward (tx, ty) through the maze, given the
  // distance field from the target's cell: aim through the doorway into the next cell
  function navPoint(field, x, y, tx, ty) {
    const [cx, cy] = cellOf(x, y), [gx, gy] = cellOf(tx, ty);
    if (cx === gx && cy === gy) return [tx, ty];
    let best = null, bd = field[cy][cx];
    for (const [bit, dx, dy] of DIRS) if (!(MAZE.walls[cy][cx] & bit) && field[cy + dy][cx + dx] < bd) { bd = field[cy + dy][cx + dx]; best = [dx, dy]; }
    if (!best) return [tx, ty];
    const [ax, ay] = ctr(cx, cy);
    return [ax + best[0] * (C / 2 + 22), ay + best[1] * (C / 2 + 22)];
  }
  function navAway(field, x, y) {
    const [cx, cy] = cellOf(x, y);
    let best = null, bd = field[cy][cx];
    for (const [bit, dx, dy] of DIRS) if (!(MAZE.walls[cy][cx] & bit) && field[cy + dy][cx + dx] > bd) { bd = field[cy + dy][cx + dx]; best = [dx, dy]; }
    if (!best) return null;
    const [ax, ay] = ctr(cx, cy);
    return [ax + best[0] * (C / 2 + 22), ay + best[1] * (C / 2 + 22)];
  }
  // push a round thing out of the canyon walls
  function collide(o, r) {
    for (const w of MAZE.rects) {
      if (o.x + r <= w.x || o.x - r >= w.x + w.w || o.y + r <= w.y || o.y - r >= w.y + w.h) continue;
      const l = o.x + r - w.x, rt = w.x + w.w - (o.x - r), t = o.y + r - w.y, b = w.y + w.h - (o.y - r);
      const m = Math.min(l, rt, t, b);
      if (m === l) o.x -= l; else if (m === rt) o.x += rt; else if (m === t) o.y -= t; else o.y += b;
    }
  }
  function stepTo(o, tx, ty, spd, dt, r, solid = true) {
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
    if (d < 0.5) return 0;
    const s = Math.min(d, spd * dt);
    o.x += dx / d * s; o.y += dy / d * s;
    if (Math.abs(dx) > 2) o.face = Math.sign(dx);
    if (solid) collide(o, r);
    return s;
  }
  const inWall = (x, y) => MAZE.rects.some(w => x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h);
  function lineClear(a, b) {
    const d = dist(a, b), n = Math.ceil(d / 14);
    for (let i = 1; i < n; i++) if (inWall(lerp(a.x, b.x, i / n), lerp(a.y, b.y, i / n))) return false;
    return true;
  }

  // ---------------------------------------------------------------------------------------------
  // A run
  // ---------------------------------------------------------------------------------------------
  let g = null;
  function newRun() {
    if (!MAZE) MAZE = buildMaze();
    const start = [0, ROWS - 1], goal = [COLS - 1, 0];
    const fieldG = bfs(...goal);
    const route = [start];
    for (let [x, y] = start; fieldG[y][x] > 0;) {
      const nx = DIRS.filter(([b]) => !(MAZE.walls[y][x] & b)).map(([, dx, dy]) => [x + dx, y + dy]).find(([a, b]) => fieldG[b][a] === fieldG[y][x] - 1);
      [x, y] = nx; route.push(nx);
    }
    const onRoute = new Set(route.map(([x, y]) => x + ',' + y));
    const ab = pickAbilities();
    const [sx, sy] = ctr(...start);
    const nest = { x: WW - C, y: C };
    seed = 99;
    const dinos = [];
    for (const [f, kinds] of WAVES) {
      let [cx, cy] = route[Math.round(f * (route.length - 1))];
      kinds.forEach((kind, i) => {
        let [x, y] = ctr(cx, cy);
        if (kind === 'dilo') {
          // a spitter likes to sit in a side passage, just off the path
          const side = DIRS.filter(([b]) => !(MAZE.walls[cy][cx] & b)).map(([, dx, dy]) => [cx + dx, cy + dy]).find(([a, b]) => !onRoute.has(a + ',' + b));
          if (side) [x, y] = ctr(...side);
        }
        if (kind !== 'trex') { x += sr(-28, 28) + i * 8; y += sr(-28, 28); }
        const K = KIND[kind];
        dinos.push({ kind, K, x, y, r: K.r, grump: K.grump, state: 'idle', st: null, t: sr(0, 5), face: -1, hitCd: 0, cool: 0,
          spit: 1.5 + i, frill: 0, z: K.fly ? 60 : 0, ang: sr(0, 6), swT: 2.5, rt: 0, bt: 0 });
      });
    }
    return {
      state: 'intro', t: 0, wt: 0, ab, dinos, route, fieldG, nest, startD: fieldG[sy / C | 0][0],
      aub: { x: sx, y: sy, face: 1, dir: [1, 0], moving: false, goo: 0, kx: 0, ky: 0, swing: 0, swingCd: 0, step: 0 },
      baby: { x: sx - 40, y: sy, face: 1, held: null, hop: 0 },
      trail: [{ x: sx, y: sy }, { x: sx - 60, y: sy }],
      fieldA: bfs(...start), fieldB: bfs(...start), aCell: '', bCell: '', tap: null, tapField: null, uiPress: false,
      mama: { x: nest.x - 40, y: nest.y + 20, face: -1 }, papa: { x: nest.x + 50, y: nest.y - 10, face: -1 },
      help: false, safeT: 0, shieldT: 0, petalT: 0, flash: 0, shake: 0,
      fx: [], puddles: [], baits: [], goos: [], parts: [], texts: [], msg: null, ui: [],
      charmed: 0, snatches: 0, cam: { x: 0, y: H }, said: false, bot: null,
    };
  }

  const say1 = (text, t = 3) => { g.msg = { text, t }; };
  function wtext(x, y, str, col = '#fff', size = 20) { g.texts.push({ x, y, str, col, size, life: 1.4 }); }
  function wburst(x, y, n, colors, o = {}) {
    for (let i = 0; i < n; i++) g.parts.push({ x, y, vx: rand(-1, 1) * (o.spread || 140), vy: rand(-1, 0.4) * (o.spread || 140) - (o.up ?? 60),
      life: rand(0.5, 1.1), col: colors[i % colors.length], size: rand(3, 6), kind: o.kind || 'star', grav: o.grav ?? 160 });
  }
  const live = e => !e.gone && e.state !== 'leave';
  const canSnatch = () => !g.baby.held && g.safeT <= 0 && g.shieldT <= 0 && g.state === 'play';

  function wake(e) {
    if (e.state !== 'idle') return;
    e.state = e.kind === 'trex' ? 'block' : 'chase';
    e.cool = 0.6;
    if (e.kind === 'trex') { say1('A big grumpy T-Rex is blocking the way! Shoo him till he gives up.', 4); speak('A grumpy T-Rex is blocking the way! Keep shooing him until he gives up.'); }
    else { wtext(e.x, e.y - e.K.h * e.K.s - 10, '!', '#ffe36b', 30); SFX.alert(); }
  }
  function leave(e, word = 'Hmph!') {
    if (e.state === 'leave') return;
    if (g.baby.held === e) dropBaby(e);
    e.state = 'leave'; e.lt = 0; e.st = null; g.charmed++;
    const a = Math.atan2(e.y - g.aub.y, e.x - g.aub.x);
    e.vx = Math.cos(a); e.vy = Math.sin(a); e.face = Math.sign(e.vx) || 1;
    wtext(e.x, e.y - e.K.h * e.K.s - 6, word, '#ffd0f0', e.kind === 'trex' ? 30 : 22);
    tone(330, 0.12, 'triangle', 0.07, 0, 220); tone(260, 0.16, 'triangle', 0.06, 0.12, 180);
    if (e.kind === 'trex') { say1('The T-Rex stomped off for a nap. The way is clear!', 3.5); speak('The T-Rex stomped off. The way is clear!'); }
  }
  function dropBaby(e) {
    const b = g.baby;
    b.held = null; b.ret = true; g.safeT = 2.5;
    b.x = e.x; b.y = e.y + 4;
  }
  function rescue(e, how = 'bonk') {
    if (g.baby.held !== e) return;
    dropBaby(e);
    wburst(e.x, e.y - 30, 14, ['#ff8fc8', '#ffe36b', '#fff'], { kind: 'heart' });
    wtext(e.x, e.y - 70, how === 'wriggle' ? 'He wriggled free!' : 'Got him back!', '#fff6a8', 24);
    SFX.sparkle();
    say1(how === 'wriggle' ? 'Baby wriggled free and ran back to you!' : 'You got him back!', 2.5);
    leave(e, 'Hmph!');
  }
  function snatch(e) {
    g.baby.held = e; e.state = 'carry'; e.ct = 0; e.st = null; g.snatches++;
    SFX.alert();
    wtext(g.baby.x, g.baby.y - 50, 'Help!', '#ffb3b3', 26);
    const what = e.kind === 'ptero' ? 'pterodactyl' : e.kind === 'compy' ? 'little compy' : 'raptor';
    say1(`Oh no! The ${what} grabbed Baby! Catch it and bonk it!`, 3.5);
    speak(`Oh no! Catch that ${what}!`);
  }
  // a shoo, a roar or a special ability lands on a dino
  function hit(e, dmg, st, dur, word) {
    if (!live(e)) return;
    if (e.state === 'carry') return rescue(e);
    wake(e);
    e.grump -= dmg;
    if (e.kind === 'trex') {
      if (st === 'startle' || st === 'flee' || st === 'blown') { st = 'wobble'; dur = 0.6; }
      if (word === 'Eek!' || WORDS.startle.includes(word)) word = 'Grr!';
    }
    if (e.kind === 'ptero') { e.low = false; e.swT = 3; }
    e.hitCd = 0.5; e.cool = 1.2;
    if (e.grump <= 0) return leave(e, BYE[st] || 'Hmph!');
    e.st = st ? { k: st, t: dur, dur } : null;
    if (word) wtext(e.x + rand(-10, 10), e.y - e.K.h * e.K.s - (e.kind === 'trex' ? 70 : 8), word, '#fff', 20);
  }
  function area(x, y, rad, dmg, st, dur, word) {
    let n = 0;
    for (const e of g.dinos) if (live(e) && Math.hypot(e.x - x, e.y - y) < rad + e.r) { hit(e, dmg, st, dur, typeof word === 'function' ? word() : word); n++; }
    return n;
  }
  function nearest(x, y, rad) {
    let best = null, bd = rad;
    for (const e of g.dinos) {
      if (!live(e) || e.state === 'idle' && e.kind !== 'trex') continue;
      const d = Math.hypot(e.x - x, e.y - y) - (g.baby.held === e ? 200 : 0);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  const ring = (x, y, r, col, dur = 0.5, w = 8) => g.fx.push({ k: 'ring', x, y, r, col, t: 0, dur, w });

  function shoo() {
    const A = g.aub;
    if (A.swingCd > 0) return;
    A.swing = 0.32; A.swingCd = 0.38;
    noise(0.12, 0.05); tone(500, 0.12, 'triangle', 0.05, 0, 900);
    let n = 0;
    for (const e of g.dinos) {
      if (!live(e) || (e.kind === 'ptero' && !e.low && e.state !== 'carry' && !e.st)) continue;
      if (dist(e, A) < 112 + e.r || (e.state === 'carry' && dist(e, A) < 140)) { hit(e, 1, 'startle', 1.1, pick(WORDS.startle)); n++; }
    }
    if (n) SFX.pop();
  }
  function useAbility(i) {
    const a = g.ab.list[i];
    if (!a || a.cd > 0) return;
    const A = g.aub, B = g.baby, l = a.lvl;
    const def = ABIL[a.id];
    let used = true;
    switch (a.id) {
      case 'roar':
        ring(B.x, B.y - 20, 150 + 25 * l, '#a6f0b8'); wtext(B.x, B.y - 60, 'RAWR!', '#a6f0b8', 26);
        tone(300, 0.25, 'sawtooth', 0.06, 0, 520); tone(420, 0.2, 'square', 0.04, 0.05, 260);
        area(B.x, B.y, 150 + 25 * l, 1, 'startle', 1.3, () => pick(WORDS.startle));
        break;
      case 'feather':
        g.fx.push({ k: 'gust', x: A.x, y: A.y - 20, t: 0, dur: 0.6, r: 210 + 30 * l });
        noise(0.4, 0.06);
        area(A.x, A.y, 210 + 30 * l, 1 + (l >= 3), 'blown', 1.3 + 0.3 * l, 'Whoa!');
        break;
      case 'petal':
        g.petalT = 3.5 + l; SFX.sparkle();
        break;
      case 'ribbon': {
        const e = nearest(A.x, A.y, 320 + 30 * l);
        if (!e) { used = false; break; }
        g.fx.push({ k: 'lasso', x: A.x, y: A.y - 45, e, t: 0, dur: 0.5 });
        tone(700, 0.2, 'triangle', 0.06, 0, 1100);
        if (g.baby.held === e) rescue(e); else hit(e, 1 + l, 'tangle', 1.6 + 0.5 * l, 'Lassoed!');
        break;
      }
      case 'berry': {
        const b = { x: A.x + A.dir[0] * 110, y: A.y + A.dir[1] * 110, t: 5 + l };
        collide(b, 16);
        g.baits.push(b); g.fx.push({ k: 'toss', x0: A.x, y0: A.y - 40, x: b.x, y: b.y, t: 0, dur: 0.4 });
        SFX.pop();
        for (const e of g.dinos) if (live(e) && dist(e, b) < 360 + 40 * l) { e.bait = b; hit(e, 1 + l, 'eat', 3.5 + l, 'Yum!'); }
        break;
      }
      case 'shell':
        ring(A.x, A.y - 30, 290 + 40 * l, '#ffd6a8', 0.7, 12); wtext(A.x, A.y - 100, 'TOOOT!', '#ffd6a8', 28);
        tone(220, 0.6, 'sawtooth', 0.07, 0, 330); tone(330, 0.5, 'square', 0.03, 0.05);
        area(A.x, A.y, 290 + 40 * l, 1, 'flee', 2.4 + 0.5 * l, 'Yikes!');
        break;
      case 'crystal':
        g.shieldT = 4 + 2 * l; SFX.sparkle();
        break;
      case 'silk': {
        const e = nearest(A.x, A.y, 330 + 30 * l);
        if (!e) { used = false; break; }
        g.fx.push({ k: 'net', x: A.x, y: A.y - 40, e, t: 0, dur: 0.35 });
        tone(600, 0.15, 'triangle', 0.06, 0, 300);
        hit(e, 2 + l, 'tangle', 3 + l, 'Tangled!');
        break;
      }
      case 'honey':
        g.puddles.push({ x: B.x, y: B.y, r: 60 + 12 * l, t: 7 + 2 * l, l, hit: new Set() });
        tone(200, 0.3, 'sine', 0.08, 0, 120);
        break;
      case 'stardust':
        ring(A.x, A.y - 30, 200 + 30 * l, '#fff3a0', 0.6, 10);
        wburst(A.x, A.y - 40, 26, ['#fff3a0', '#ffe36b', '#fff']);
        SFX.sparkle();
        area(A.x, A.y, 200 + 30 * l, 2, 'stun', 2.2 + 0.8 * l, 'Dizzy!');
        break;
      case 'rainbow': {
        const [dx, dy] = A.dir;
        let len = 40;
        while (len < 380 + 60 * l && !inWall(A.x + dx * len, A.y - 20 + dy * len)) len += 10; // stops at the canyon wall
        g.fx.push({ k: 'beam', x: A.x, y: A.y - 40, dx, dy, len, t: 0, dur: 0.8 });
        [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.3, 'sine', 0.06, k * 0.05));
        for (const e of g.dinos) {
          if (!live(e)) continue;
          const px = e.x - A.x, py = e.y - A.y, along = px * dx + py * dy, side = Math.abs(px * dy - py * dx);
          if (along > -20 && along < len && side < 50 + e.r) hit(e, 2 + l, 'happy', 1.4, 'Wheee!');
        }
        break;
      }
      case 'moonbeam':
        g.fx.push({ k: 'notes', x: A.x, y: A.y - 50, t: 0, dur: 1.6 });
        ring(A.x, A.y - 30, 230 + 30 * l, '#c8c0ff', 1, 10);
        [523, 659, 587, 523].forEach((f, k) => tone(f, 0.4, 'sine', 0.06, k * 0.3));
        area(A.x, A.y, 230 + 30 * l, 1 + l, 'sleep', 3.5 + 1.5 * l, 'Zzz...');
        break;
      case 'ember':
        g.flash = 0.5; ring(A.x, A.y - 30, 240 + 30 * l, '#ffb070', 0.5, 14);
        tone(880, 0.3, 'triangle', 0.06, 0, 440);
        area(A.x, A.y, 240 + 30 * l, 2, 'startle', 2 + 0.4 * l, 'Too bright!');
        break;
    }
    if (!used) { wtext(A.x, A.y - 110, 'No dino nearby', '#fff', 16); return; }
    a.cd = def.cd * (1 - 0.15 * (l - 1));
    a.flash = 0.4;
  }

  // ---------------------------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------------------------
  function play(dt) {
    const A = g.aub, B = g.baby;
    g.t += dt;
    for (const a of g.ab.list) { a.cd = Math.max(0, a.cd - dt); a.flash = Math.max(0, (a.flash || 0) - dt); }
    g.safeT -= dt; g.shieldT -= dt; g.petalT -= dt; g.flash -= dt; g.shake -= dt;
    A.swing -= dt; A.swingCd -= dt; A.goo -= dt;
    if (g.msg && (g.msg.t -= dt) <= 0) g.msg = null;

    // --- input: on-screen buttons, keys, tap-to-move
    if (pointer.clicked) {
      const ui = g.ui.find(u => Math.hypot(pointer.x - u.x, pointer.y - u.y) < u.r || (u.w && inRect(u)));
      g.uiPress = !!ui || pointer.y > H - 100 && pointer.x < 180 || pointer.x > W - 150 && pointer.y < 90;
      if (ui) { if (ui.id === 'shoo') shoo(); else useAbility(ui.id); }
      else if (!g.uiPress) {
        const wx = pointer.x + g.cam.x, wy = pointer.y + g.cam.y;
        const e = g.dinos.find(d => live(d) && Math.hypot(d.x - wx, d.y - d.K.h * d.K.s * 0.4 - wy) < 50 && dist(d, A) < 170);
        if (e) shoo();
        else setTap(wx, wy);
      }
    } else if (pointer.down && !g.uiPress) setTap(pointer.x + g.cam.x, pointer.y + g.cam.y);
    if (!pointer.down) g.uiPress = false;
    if (pressed[' '] || pressed.e || pressed.enter) shoo();
    g.ab.list.forEach((a, i) => { if (pressed[String(i + 1)]) useAbility(i); });

    let mx = 0, my = 0;
    if (goLeft()) mx--; if (goRight()) mx++; if (keys.arrowup || keys.w) my--; if (goDown()) my++;
    if (mx || my) g.tap = null;
    else if (g.tap) {
      const [tx, ty] = navPoint(g.tapField, A.x, A.y, g.tap.x, g.tap.y);
      const d = Math.hypot(tx - A.x, ty - A.y);
      if (d < 6) { if (tx === g.tap.x && ty === g.tap.y) g.tap = null; } else { mx = (tx - A.x) / d; my = (ty - A.y) / d; }
    }
    const ml = Math.hypot(mx, my);
    A.moving = ml > 0;
    if (ml) {
      mx /= ml; my /= ml; A.dir = [mx, my];
      if (Math.abs(mx) > 0.2) A.face = Math.sign(mx);
      const sp = AUB_SPD * (A.goo > 0 ? 0.45 : 1) * dt;
      A.x += mx * sp; A.y += my * sp;
      A.step += dt;
    }
    if (A.kx || A.ky) { A.x += A.kx * dt; A.y += A.ky * dt; A.kx *= Math.pow(0.02, dt); A.ky *= Math.pow(0.02, dt); if (Math.hypot(A.kx, A.ky) < 5) A.kx = A.ky = 0; }
    for (const e of g.dinos) if (e.kind === 'trex' && live(e)) {
      const d = dist(A, e), min = e.r + AUB_R;
      if (d < min) { const k = (min - d) / (d || 1); A.x += (A.x - e.x) * k; A.y += (A.y - e.y) * k; }
    }
    collide(A, AUB_R);

    // distance fields from Aubrey's and the baby's cells, for chasing and fleeing
    const ac = cellOf(A.x, A.y).join(), bc = cellOf(B.x, B.y).join();
    if (ac !== g.aCell) { g.aCell = ac; g.fieldA = bfs(...cellOf(A.x, A.y)); }
    if (bc !== g.bCell) { g.bCell = bc; g.fieldB = bfs(...cellOf(B.x, B.y)); }

    // --- the baby trots behind on his leash
    const last = g.trail[0];
    if (Math.hypot(A.x - last.x, A.y - last.y) > 4) { g.trail.unshift({ x: A.x, y: A.y }); if (g.trail.length > 40) g.trail.pop(); }
    let want = g.trail[g.trail.length - 1], acc = 0;
    for (let i = 1; i < g.trail.length; i++) {
      acc += Math.hypot(g.trail[i].x - g.trail[i - 1].x, g.trail[i].y - g.trail[i - 1].y);
      if (acc >= 44) { want = g.trail[i]; break; }
    }
    if (!B.held) {
      const d = Math.hypot(want.x - B.x, want.y - B.y);
      if (B.ret && d > 50) stepTo(B, want.x, want.y, 330, dt, 10, false);
      else { B.ret = false; const ox = B.x; B.x = lerp(B.x, want.x, Math.min(1, dt * 9)); B.y = lerp(B.y, want.y, Math.min(1, dt * 9)); if (Math.abs(B.x - ox) > 0.3) B.face = Math.sign(B.x - ox); }
      B.hop = d > 8 || A.moving ? B.hop + dt : 0;
    } else {
      const e = B.held;
      B.x = e.x; B.y = e.y + (e.kind === 'ptero' ? 2 : 3); B.face = e.face; B.hop += dt * 2;
    }

    // --- dinos
    for (const e of g.dinos) if (!e.gone) updDino(e, dt);
    g.dinos = g.dinos.filter(e => !e.gone);

    // honey puddles, berry baits, spit goo
    for (const p of g.puddles) {
      p.t -= dt;
      for (const e of g.dinos) if (live(e) && !p.hit.has(e) && !e.K.fly && Math.hypot(e.x - p.x, e.y - p.y) < p.r) { p.hit.add(e); hit(e, 1 + (p.l > 1), 'sticky', 2.5 + p.l, 'Sticky!'); }
    }
    g.puddles = g.puddles.filter(p => p.t > 0);
    for (const b of g.baits) b.t -= dt;
    g.baits = g.baits.filter(b => b.t > 0);
    for (const o of g.goos) {
      o.x += o.vx * dt; o.y += o.vy * dt; o.t += dt;
      if (Math.hypot(o.x - A.x, o.y - (A.y - 20)) < 24 && g.shieldT <= 0) {
        o.done = true; A.goo = 1.6; wtext(A.x, A.y - 100, 'Sticky goo!', '#b8ff9a', 20); tone(160, 0.2, 'sine', 0.08, 0, 90);
        wburst(o.x, o.y, 10, ['#9ce86a', '#c8ff9a'], { spread: 80 });
      } else if (inWall(o.x, o.y + 20) || o.t > 2.5 || (g.shieldT > 0 && Math.hypot(o.x - A.x, o.y - A.y + 20) < 80)) { o.done = true; wburst(o.x, o.y, 6, ['#9ce86a', '#c8ff9a'], { spread: 60 }); }
    }
    g.goos = g.goos.filter(o => !o.done);
    if (g.petalT > 0) for (const e of g.dinos) if (live(e) && e.hitCd <= 0 && dist(e, A) < 140 + e.r) hit(e, 1, 'confuse', 1.8, '???');
    if (g.shieldT > 0) for (const e of g.dinos) if (live(e) && e.hitCd <= 0 && e.kind !== 'trex' && (dist(e, A) < 70 || dist(e, B) < 60)) { hit(e, 1, 'startle', 1.2, 'Boing!'); SFX.pop(); }

    // --- help: if it's taking a long time, mama and papa hear him and come looking
    if (!g.help && (g.t > HELP_AT || g.snatches >= 8 && g.t > 70)) {
      g.help = true;
      say1('Listen! Mama and Papa heard him calling. They are coming to find you!', 5);
      speak('Listen! Mama and Papa heard him calling. They are coming!');
      tone(180, 0.6, 'sawtooth', 0.06, 0, 140); tone(220, 0.6, 'sawtooth', 0.05, 0.5, 170);
    }
    const P = g.mama;
    if (g.help) {
      const [tx, ty] = navPoint(g.fieldA, P.x, P.y, A.x, A.y);
      if (dist(P, A) > 110) stepTo(P, tx, ty, 150, dt, 30);
      P.walk = true;
      const Q = g.papa, bx = P.x - P.face * 60, by = P.y - 12;
      stepTo(Q, bx, by, 160, dt, 30, false); Q.walk = true;
      for (const e of g.dinos) if (live(e) && dist(e, P) < 260) { if (g.baby.held === e) rescue(e); else if (e.state !== 'idle' || dist(e, P) < 150) leave(e, 'Eek! A big mama!'); }
    }
    if (dist(A, P) < 150 && !B.held) win();

    // effects
    for (const f of g.fx) f.t += dt;
    g.fx = g.fx.filter(f => f.t < f.dur);
    camera(dt);
  }
  function setTap(wx, wy) {
    wx = clamp(wx, 20, WW - 20); wy = clamp(wy + 10, 20, WH - 20);
    const c = cellOf(wx, wy);
    if (!g.tap || g.tap.c !== c.join()) g.tapField = bfs(...c);
    g.tap = { x: wx, y: wy, c: c.join() };
  }
  function camera(dt) {
    const A = g.aub;
    const tx = clamp(A.x - W / 2, -60, WW + 60 - W), ty = clamp(A.y - 40 - H / 2, -80, WH + 100 - H);
    const k = Math.min(1, dt * 6);
    g.cam.x = lerp(g.cam.x, tx, k); g.cam.y = lerp(g.cam.y, ty, k);
  }

  function updDino(e, dt) {
    const A = g.aub, B = g.baby, K = e.K;
    e.t += dt; e.hitCd -= dt; e.cool -= dt;
    if (e.kind === 'trex' && e.state === 'block') e.bt += dt;
    e.moving = false;
    if (e.state === 'leave') {
      e.lt += dt;
      const sp = e.kind === 'trex' ? 70 : 230;
      e.x += e.vx * sp * dt; e.y += e.vy * sp * dt; e.moving = true;
      if (K.fly) e.z += 80 * dt;
      if (e.lt > (e.kind === 'trex' ? 2.2 : 1.4)) e.gone = true;
      return;
    }
    if (K.fly) e.z = lerp(e.z, (e.state === 'chase' && !e.st && !e.low) || e.state === 'idle' ? 60 : e.state === 'carry' ? 58 : 16, Math.min(1, dt * 4));
    if (e.st) {
      e.st.t -= dt;
      statusMove(e, dt);
      if (e.st.t <= 0) { e.st = null; if (e.grump <= 0) leave(e, e.kind === 'trex' ? 'HMPH!' : 'Hmph!'); }
      return;
    }
    if (e.state === 'idle') {
      if (dist(e, A) < (e.kind === 'trex' ? 330 : 400) && (K.fly || lineClear(e, A) || dist(e, A) < 220)) wake(e);
      return;
    }
    if (e.state === 'carry') {
      e.ct += dt;
      if (e.ct > 0.6 && dist(e, A) < 52 + e.r) return rescue(e); // a short head start, so a snatch is a little chase
      if (e.ct < 3) {
        if (K.fly) {
          const a = Math.atan2(e.y - A.y, e.x - A.x);
          const sp = e.ct < 1.5 ? 120 : 70;
          e.x = clamp(e.x + Math.cos(a) * sp * dt, 50, WW - 50); e.y = clamp(e.y + Math.sin(a) * sp * dt, 50, WH - 50);
          e.face = Math.sign(Math.cos(a)) || 1; e.moving = true;
        } else {
          const p = navAway(g.fieldA, e.x, e.y);
          if (p) { stepTo(e, p[0], p[1], e.ct < 1.5 ? 175 : K.spd * 0.7, dt, e.r); e.moving = true; }
        }
      } else if (e.ct > 11) rescue(e, 'wriggle');
      return;
    }
    if (e.kind === 'trex') return trexUpdate(e, dt);
    if (e.kind === 'dilo') return diloUpdate(e, dt);
    if (e.kind === 'ptero') return pteroUpdate(e, dt);
    // raptors and compies: sneak up on the baby
    const [tx, ty] = navPoint(g.fieldB, e.x, e.y, B.x, B.y);
    const slow = e.cool > 0 ? 0.55 : 1;
    stepTo(e, tx, ty, K.spd * slow, dt, e.r); e.moving = true;
    if (e.cool <= 0 && canSnatch() && dist(e, B) < e.r + 14) snatch(e);
  }
  function statusMove(e, dt) {
    const A = g.aub, k = e.st.k;
    if ((k === 'startle' || k === 'flee' || k === 'blown') && e.kind !== 'trex') {
      const sp = { startle: 210, flee: 250, blown: 380 * Math.min(1, e.st.t / e.st.dur + 0.2) }[k];
      const a = Math.atan2(e.y - A.y, e.x - A.x);
      const tx = e.x + Math.cos(a) * 50, ty = e.y + Math.sin(a) * 50;
      stepTo(e, tx, ty, sp, dt, e.r, !e.K.fly); e.face = -Math.sign(Math.cos(a)) || e.face; e.moving = true;
      if (e.K.fly) { e.x = clamp(e.x, 40, WW - 40); e.y = clamp(e.y, 40, WH - 40); }
    } else if (k === 'confuse') {
      if (!e.wd || Math.random() < dt * 2) e.wd = rand(0, Math.PI * 2);
      stepTo(e, e.x + Math.cos(e.wd) * 30, e.y + Math.sin(e.wd) * 30, 70, dt, e.r, !e.K.fly); e.moving = true;
    } else if (k === 'eat' && e.bait && e.kind !== 'trex') {
      if (dist(e, e.bait) > 20 + e.r) { stepTo(e, e.bait.x, e.bait.y, 160, dt, e.r, !e.K.fly); e.moving = true; }
    }
  }
  function trexUpdate(e, dt) {
    const A = g.aub;
    e.face = A.x < e.x ? -1 : 1;
    e.rt -= dt;
    if (e.rt <= 0 && dist(A, e) < 175) {
      e.rt = 3; e.roar = 0.8; g.shake = 0.4;
      const a = Math.atan2(A.y - e.y, A.x - e.x);
      A.kx = Math.cos(a) * 420; A.ky = Math.sin(a) * 420;
      wtext(e.x + e.face * 40, e.y - 140, 'ROAR!', '#ffb070', 30);
      tone(110, 0.5, 'sawtooth', 0.08, 0, 70); noise(0.4, 0.05);
    }
    e.roar = Math.max(0, (e.roar || 0) - dt);
    if (e.bt > 45) { wtext(e.x, e.y - 150, '*yaaawn*', '#fff', 24); leave(e, 'Too sleepy...'); }
  }
  function diloUpdate(e, dt) {
    const A = g.aub, d = dist(e, A);
    e.face = A.x < e.x ? -1 : 1;
    if (d > 300) { const [tx, ty] = navPoint(g.fieldA, e.x, e.y, A.x, A.y); stepTo(e, tx, ty, e.K.spd, dt, e.r); e.moving = true; }
    else if (d < 110) { const p = navAway(g.fieldA, e.x, e.y); if (p) { stepTo(e, p[0], p[1], 70, dt, e.r); e.moving = true; } }
    e.spit -= dt;
    const see = d < 400 && lineClear({ x: e.x, y: e.y - 20 }, { x: A.x, y: A.y - 20 });
    e.frill = lerp(e.frill, see && e.spit < 0.7 ? 1 : 0, Math.min(1, dt * 8));
    if (e.spit <= 0) {
      if (see) {
        const sx = e.x + e.face * 26, sy = e.y - 52, a = Math.atan2(A.y - 30 - sy, A.x - sx);
        g.goos.push({ x: sx, y: sy, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, t: 0 });
        tone(300, 0.12, 'sine', 0.07, 0, 120);
        wtext(sx, sy - 20, 'Ptoo!', '#c8ff9a', 18);
      }
      e.spit = see ? 2.6 : 0.5;
    }
  }
  function pteroUpdate(e, dt) {
    const A = g.aub, B = g.baby;
    if (e.state === 'chase') {
      e.ang += dt * 1.1;
      const tx = clamp(A.x + Math.cos(e.ang) * 200, 50, WW - 50), ty = clamp(A.y + Math.sin(e.ang) * 130, 50, WH - 50);
      stepTo(e, tx, ty, 210, dt, e.r, false); e.moving = true;
      e.swT -= dt;
      if (e.swT <= 0 && e.cool <= 0) {
        e.state = 'swoop'; e.low = true; e.tx = B.x; e.ty = B.y; e.sw = 0;
        tone(900, 0.4, 'sine', 0.05, 0, 400); wtext(e.x, e.y - 80, 'Swoop!', '#ffd6a8', 18);
      }
    } else if (e.state === 'swoop') {
      e.sw += dt;
      const moved = stepTo(e, e.tx, e.ty, 300, dt, e.r, false); e.moving = true;
      if (canSnatch() && dist(e, B) < 34) return snatch(e);
      if (moved < 0.5 || e.sw > 2) { e.state = 'chase'; e.low = false; e.swT = 4.5; }
    }
  }
  function win() {
    g.state = 'win'; g.wt = 0;
    g.result = { reunited: true, abilities: g.ab.list.map(a => a.id), charmed: g.charmed, time: Math.round(g.t), snatches: g.snatches };
    for (const e of g.dinos) if (live(e)) leave(e, 'Hmph!');
    SFX.fanfare();
  }
  function finish() {
    const r = g.result;
    if (typeof dinoDefenseDone === 'function') dinoDefenseDone(r); else setScene('title');
  }

  // ---------------------------------------------------------------------------------------------
  // Art: the scenery (painted once), the dinos, the effects
  // ---------------------------------------------------------------------------------------------
  let BG = null;
  function paintBG() {
    const c = document.createElement('canvas');
    c.width = Math.ceil((WW + 2 * M) * DPR); c.height = Math.ceil((WH + 2 * M) * DPR);
    const old = ctx; ctx = c.getContext('2d');
    try {
      ctx.setTransform(DPR, 0, 0, DPR, M * DPR, M * DPR);
      seed = 4242;
      // the jungle beyond the canyon, then the canyon floor
      ctx.fillStyle = '#2f6e3f'; ctx.fillRect(-M, -M, WW + 2 * M, WH + 2 * M);
      const fg = ctx.createLinearGradient(0, 0, WW, WH);
      fg.addColorStop(0, '#eedc9e'); fg.addColorStop(0.5, '#e8d08e'); fg.addColorStop(1, '#e3c27e');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, WW, WH);
      for (let i = 0; i < 170; i++) {
        ctx.fillStyle = spick(['rgba(140,200,90,.33)', 'rgba(110,180,80,.28)', 'rgba(205,165,105,.3)', 'rgba(255,240,190,.35)']);
        ellipse(sr(0, WW), sr(0, WH), sr(20, 70), sr(12, 36), sr(0, 3));
      }
      // the nest clearing glows with soft grass
      const ng = ctx.createRadialGradient(WW - C, C, 10, WW - C, C, 200);
      ng.addColorStop(0, 'rgba(170,230,120,.85)'); ng.addColorStop(1, 'rgba(170,230,120,0)');
      ctx.fillStyle = ng; ctx.fillRect(WW - 2 * C - 60, -40, 2 * C + 100, 2 * C + 100);
      // pebbles, grass tufts, little flowers, old footprints, a fossil or two
      for (let i = 0; i < 260; i++) {
        const x = sr(0, WW), y = sr(0, WH), r = sr(2, 5);
        ctx.fillStyle = spick(['#c9a878', '#b89a74', '#d8c09a', '#a8a090']); ellipse(x, y, r * 1.3, r);
        ctx.fillStyle = 'rgba(255,255,255,.45)'; circle(x - r * 0.4, y - r * 0.4, r * 0.35);
      }
      ctx.lineCap = 'round';
      for (let i = 0; i < 300; i++) {
        const x = sr(0, WW), y = sr(0, WH), h = sr(6, 13);
        ctx.strokeStyle = spick(['#6ab04c', '#86c45a', '#5a9c40']); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 4, y - h * 0.7); ctx.lineTo(x, y); ctx.lineTo(x + 4, y - h * 0.8); ctx.moveTo(x, y); ctx.lineTo(x + 0.5, y - h); ctx.stroke();
      }
      for (let i = 0; i < 120; i++) {
        const x = sr(0, WW), y = sr(0, WH), col = spick(['#ff8fc8', '#ffe36b', '#ffffff', '#c9a6ff', '#ff9a6a']);
        ctx.fillStyle = col;
        for (let k = 0; k < 5; k++) circle(x + Math.cos(k * 1.257) * 3.2, y + Math.sin(k * 1.257) * 3.2, 2.4);
        ctx.fillStyle = '#ffd23a'; circle(x, y, 1.8);
      }
      for (let i = 0; i < 14; i++) {
        const x = sr(60, WW - 60), y = sr(60, WH - 60), a = sr(0, 6);
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(150,110,70,.28)';
        for (let s = 0; s < 3; s++) { const sx = s * 34, sy = (s % 2) * 18; ellipse(sx, sy, 8, 6); for (const t of [-0.6, 0, 0.6]) ellipse(sx + Math.cos(t) * 11, sy + Math.sin(t) * 11, 3, 5, t); }
        ctx.restore();
      }
      for (let i = 0; i < 5; i++) {
        const x = sr(80, WW - 80), y = sr(80, WH - 80);
        ctx.strokeStyle = 'rgba(160,130,90,.55)'; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let a = 0; a < 12; a += 0.3) ctx.lineTo(x + Math.cos(a) * a * 1.1, y + Math.sin(a) * a * 1.1);
        ctx.stroke();
      }
      // the nest
      const nx = WW - C, ny = C + 10;
      ctx.fillStyle = 'rgba(80,50,20,.25)'; ellipse(nx, ny + 10, 92, 42);
      inkEllipse(nx, ny, 86, 40, 0, '#b07a44', 3, OL);
      ctx.fillStyle = '#d9b07a'; ellipse(nx, ny - 4, 64, 25);
      ctx.strokeStyle = '#8a5a2c'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 40; i++) { const a = sr(0, 6.28), r = sr(64, 84); ctx.beginPath(); ctx.moveTo(nx + Math.cos(a) * r * 0.8, ny + Math.sin(a) * r * 0.38); ctx.lineTo(nx + Math.cos(a + 0.35) * r, ny + Math.sin(a + 0.35) * r * 0.46); ctx.stroke(); }
      for (const [ex, ey] of [[-24, -8], [14, -12], [30, 2]]) { inkEllipse(nx + ex, ny + ey, 11, 8, 0.3, '#fff6e6', 1.5, OL); ctx.fillStyle = '#9fe0a8'; circle(nx + ex - 3, ny + ey - 2, 2); }
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * 6.28, x = nx + Math.cos(a) * 130, y = ny + Math.sin(a) * 70;
        ctx.fillStyle = spick(['#ff8fc8', '#ffe36b', '#ff9a6a', '#c9a6ff']);
        for (let k = 0; k < 5; k++) circle(x + Math.cos(k * 1.257) * 5, y + Math.sin(k * 1.257) * 5, 4);
        ctx.fillStyle = '#fff3a0'; circle(x, y, 3);
      }
      // canyon walls: rock ridges topped with jungle (all outlines first, then the fills)
      const rocks = MAZE.rects.filter(r => !r.border);
      ctx.fillStyle = 'rgba(70,40,20,.22)';
      for (const r of rocks) { ctx.beginPath(); ctx.roundRect(r.x + 4, r.y + 12, r.w, r.h, 14); ctx.fill(); }
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineJoin = 'round';
      for (const r of rocks) { ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 14); ctx.stroke(); }
      for (const r of rocks) { ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 14); ctx.fillStyle = '#c4804f'; ctx.fill(); }
      for (const r of rocks) rrect(r.x + 4, r.y + 3, r.w - 8, r.h - 13, 11, '#e2a66c');
      ctx.strokeStyle = 'rgba(150,90,50,.5)'; ctx.lineWidth = 2;
      for (const r of rocks) for (let i = 0; i < Math.max(r.w, r.h) / 40; i++) {
        const along = r.w > r.h, p = sr(10, Math.max(r.w, r.h) - 20), q = sr(8, 22);
        ctx.beginPath();
        if (along) { ctx.moveTo(r.x + p, r.y + q); ctx.lineTo(r.x + p + 14, r.y + q + 2); } else { ctx.moveTo(r.x + q, r.y + p); ctx.lineTo(r.x + q + 2, r.y + p + 14); }
        ctx.stroke();
      }
      // jungle on the ridges and the thick jungle around the edge
      const clumps = [];
      for (const r of rocks) {
        const along = r.w > r.h, len = along ? r.w : r.h;
        for (let p = 16; p < len - 10; p += sr(18, 30)) {
          if (srand() < 0.35) continue;
          const x = along ? r.x + p : r.x + r.w / 2 + sr(-6, 6), y = along ? r.y + r.h / 2 + sr(-8, 4) : r.y + p;
          clumps.push({ x, y, r: sr(11, 17), c: spick(['#4fb35a', '#3f9a4c', '#62c46a', '#58ab52']), fl: srand() < 0.18 });
        }
      }
      for (let x = -M; x < WW + M; x += 34) for (const y of [-M / 2 - 10, -14, WH + 14, WH + M / 2 + 10]) clumps.push({ x: x + sr(-8, 8), y: y + sr(-10, 10), r: sr(22, 34), c: spick(['#3f9a4c', '#2f8a44', '#4fa858', '#367f3e']), fl: srand() < 0.12 });
      for (let y = -M; y < WH + M; y += 34) for (const x of [-M / 2 - 10, -14, WW + 14, WW + M / 2 + 10]) clumps.push({ x: x + sr(-10, 10), y: y + sr(-8, 8), r: sr(22, 34), c: spick(['#3f9a4c', '#2f8a44', '#4fa858', '#367f3e']), fl: srand() < 0.12 });
      ctx.strokeStyle = OL; ctx.lineWidth = 5;
      for (const k of clumps) { ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, 7); ctx.stroke(); }
      for (const k of clumps) { ctx.fillStyle = k.c; circle(k.x, k.y, k.r); }
      for (const k of clumps) {
        ctx.fillStyle = 'rgba(255,255,255,.18)'; circle(k.x - k.r * 0.3, k.y - k.r * 0.35, k.r * 0.45);
        ctx.strokeStyle = 'rgba(30,90,40,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(k.x - k.r * 0.5, k.y + k.r * 0.1); ctx.quadraticCurveTo(k.x, k.y - k.r * 0.3, k.x + k.r * 0.5, k.y + k.r * 0.2); ctx.stroke();
        if (k.fl) { ctx.fillStyle = spick(['#ff6fa8', '#ffe36b', '#ff9a4a']); for (let i = 0; i < 5; i++) circle(k.x + Math.cos(i * 1.257) * 4, k.y + Math.sin(i * 1.257) * 4, 3.2); ctx.fillStyle = '#fff'; circle(k.x, k.y, 2); }
      }
      // a few palm trees poking up from the edge
      for (let i = 0; i < 18; i++) {
        const side = i % 4, p = sr(0.05, 0.95);
        const x = side === 0 ? p * WW : side === 1 ? p * WW : side === 2 ? -M / 2 : WW + M / 2;
        const y = side === 0 ? -M / 2 : side === 1 ? WH + M / 2 : p * WH;
        palm(x, y, sr(30, 44));
      }
    } finally { ctx = old; }
    return c;
  }
  function palm(x, y, r) {
    const fronds = 7;
    const leaf = a => { const p = new Path2D(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a - 0.3) * r, y + Math.sin(a - 0.3) * r, x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5); p.quadraticCurveTo(x + Math.cos(a + 0.3) * r, y + Math.sin(a + 0.3) * r, x, y); return p; };
    const ps = Array.from({ length: fronds }, (_, i) => leaf(i / fronds * 6.28 + sr(-0.2, 0.2)));
    ctx.strokeStyle = OL; ctx.lineWidth = 4; for (const p of ps) ctx.stroke(p);
    ps.forEach((p, i) => { ctx.fillStyle = i % 2 ? '#5cc060' : '#48a850'; ctx.fill(p); });
    inkCircle(x, y, 6, '#a0703c', 2, OL);
  }

  // outline every shape first, then fill them, so overlapping parts read as one body
  const E2 = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; };
  function body(parts, lw) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of parts) ctx.stroke(p);
    for (const [p, f] of parts) { ctx.fillStyle = f; ctx.fill(p); }
  }
  function eye(x, y, r, look = 1, mood) {
    if (mood === 'sleep') { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.45; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0.2, Math.PI - 0.2); ctx.stroke(); return; }
    if (mood === 'dizzy') { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.35; ctx.beginPath(); for (let a = 0; a < 9; a += 0.5) ctx.lineTo(x + Math.cos(a + S.t * 8) * a * r * 0.11, y + Math.sin(a + S.t * 8) * a * r * 0.11); ctx.stroke(); return; }
    if (mood === 'happy') { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.45; ctx.beginPath(); ctx.arc(x, y + r * 0.3, r * 0.75, Math.PI + 0.3, -0.3); ctx.stroke(); return; }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OL; ctx.lineWidth = r * 0.3;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.85, r, 0, 0, 7); ctx.stroke(); ctx.fill();
    const pr = mood === 'shock' ? r * 0.35 : r * 0.58;
    ctx.fillStyle = '#2a1840'; circle(x + look * r * 0.18, y + r * 0.08, pr);
    ctx.fillStyle = '#fff'; circle(x + look * r * 0.18 - pr * 0.35, y - pr * 0.3, pr * 0.38);
  }

  // the baby (and his mama and papa): chubby mint stegosaurus, facing right, origin at his feet
  function stego(x, y, s, o = {}) {
    const pal = o.pal || BABY_PAL, f = o.facing || 1, t = (o.t ?? S.t), walk = o.walk;
    const bob = walk ? Math.abs(Math.sin(t * 13)) * 3 : Math.sin(t * 2.5) * 0.7;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,30,20,.2)'; ellipse(0, 0, 25 * s, 6 * s);
    ctx.translate(0, -(o.lift || 0) - bob * s); ctx.scale(s * f, s);
    const lw = Math.min(1.6, 1.3 / s * 1.15), sw = walk ? Math.sin(t * 13) * 3 : 0;
    const plate = (px, py, h, tilt) => { const p = new Path2D(); p.moveTo(px - 6, py + 4); p.quadraticCurveTo(px - 5 + tilt, py - h * 0.7, px + tilt, py - h); p.quadraticCurveTo(px + 5 + tilt, py - h * 0.6, px + 6, py + 4); p.closePath(); return p; };
    const parts = [
      [plate(-15, -27, 10, -3), pal.plate], [plate(-4, -31, 13, -1), pal.plate], [plate(7, -30, 11, 2), pal.plate],
      [new Path2D('M-16,-20 C-28,-22 -37,-15 -43,-6 C-34,-5 -24,-7 -13,-10 Z'), pal.body],
      [E2(-12 + sw, -5, 6.5, 6), pal.dark], [E2(5 - sw, -5, 6.5, 6), pal.dark],
      [E2(-4, -17, 20, 14), pal.body],
      [E2(14, -29, 13.5, 13), pal.body], [E2(23, -24, 7.5, 6.5), pal.body],
    ];
    body(parts, lw);
    ctx.fillStyle = pal.belly; ellipse(2, -11.5, 12, 7.5);
    ctx.fillStyle = pal.dark; circle(-10, -22, 2.4); circle(-1, -26, 2); circle(-15, -14, 1.8);
    ctx.fillStyle = pal.plateDark; for (const [px, py] of [[-15, -30], [-4, -36], [7, -34]]) circle(px, py, 1.8);
    eye(17, -32, 5.6, 1, o.mood);
    if (o.lashes) { ctx.strokeStyle = OL; ctx.lineWidth = 1.2; for (const a of [-2.2, -1.8, -1.4]) { ctx.beginPath(); ctx.moveTo(17 + Math.cos(a) * 5.5, -32 + Math.sin(a) * 6.5); ctx.lineTo(17 + Math.cos(a) * 9, -32 + Math.sin(a) * 9.5); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,130,150,.55)'; ellipse(21, -24, 3.6, 2.4);
    ctx.fillStyle = OL; circle(28, -26, 1);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.3; ctx.beginPath();
    if (o.mood === 'shock') ctx.ellipse(24, -20, 2.2, 2.8, 0, 0, 7); else ctx.arc(23, -22.5, 3.2, 0.3, Math.PI - 0.5);
    ctx.stroke();
    if (o.flower) { ctx.fillStyle = '#ff6fa8'; for (let i = 0; i < 5; i++) circle(9 + Math.cos(i * 1.257) * 3.4, -42 + Math.sin(i * 1.257) * 3.4, 2.8); ctx.fillStyle = '#ffe36b'; circle(9, -42, 2); }
    if (o.leaf) { inkAt(10, -42, -0.5, LEAF_S, '#6ccf6a', 0.8); }
    ctx.restore();
  }
  const LEAF_S = P2('M0,0 C4,-6 12,-6 16,0 C12,6 4,6 0,0 Z');
  // helper A's baby (js/pet.js) when it's loaded: s = 1 there is unicorn-sized, so he's drawn small here
  const A_MOOD = { shock: 'scared', happy: 'joy', sleep: 'sleepy' };
  function babyArt(x, y, o = {}) {
    if (typeof drawBabyDino === 'function') {
      const look = typeof dinoLook === 'function' ? dinoLook() : null;
      drawBabyDino(x, y - (o.lift || 0), 0.21, look, { facing: o.facing, mood: A_MOOD[o.mood] || o.mood, moving: o.walk, t: o.t });
    } else stego(x, y, BABY_S, o);
  }
  function parentArt(p, papa) {
    const mood = g.state === 'win' ? 'happy' : undefined, walk = p.walk && g.state === 'play';
    if (typeof drawBabyDino === 'function') {
      const pal = papa ? (typeof PAPA_PAL !== 'undefined' ? PAPA_PAL : DD_PAPA) : (typeof MAMA_PAL !== 'undefined' ? MAMA_PAL : DD_MAMA);
      drawBabyDino(p.x, p.y, papa ? 0.6 : 0.54, {}, { facing: p.face, grown: true, palette: pal, mood: mood ? 'joy' : undefined, moving: walk, t: S.t + (papa ? 1 : 0) });
    } else stego(p.x, p.y, papa ? 2.6 : 2.3, { pal: papa ? DD_PAPA : DD_MAMA, facing: p.face, walk, lashes: !papa, flower: !papa, leaf: papa, mood });
  }
  // raptors, compies and dilophosaurs share a body plan: lean two-legged dinos, facing right
  function biped(x, y, s, o) {
    const pal = o.pal, f = o.facing || 1, t = o.t, walk = o.walk, m = o.mood;
    const sw = walk ? Math.sin(t * 15) * 6 : 0, bob = walk ? Math.abs(Math.cos(t * 15)) * 2.5 : Math.sin(t * 3) * 0.6;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,30,20,.2)'; ellipse(0, 0, 26 * s, 6 * s);
    ctx.translate(0, -(o.lift || 0)); ctx.scale(s * f, s);
    if (o.wob) ctx.rotate(Math.sin(t * 25) * 0.08);
    ctx.translate(0, -bob);
    const lw = 1.4 / s * 1.1;
    if (o.frill > 0.05) {
      const fr = 6 + o.frill * 15;
      ctx.save(); ctx.translate(26, -56);
      ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.beginPath(); ctx.arc(0, 0, fr, 0, 7); ctx.stroke();
      ctx.fillStyle = pal.frill; ctx.fill();
      ctx.strokeStyle = pal.crest; ctx.lineWidth = 2; for (let a = 0; a < 6.28; a += 0.6) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * fr * 0.9, Math.sin(a) * fr * 0.9); ctx.stroke(); }
      ctx.restore();
    }
    const leg = (dx, k) => new Path2D(`M${dx - 5},-24 L${dx - 6 + k},-3 L${dx + 5 + k},-1 L${dx + 3 + k},-5 L${dx + 3},-24 Z`);
    const parts = [
      [new Path2D('M-14,-40 C-34,-46 -52,-52 -66,-52 C-52,-42 -36,-31 -12,-28 Z'), pal.body],
      [leg(-4, -sw), pal.dark],
      [new Path2D('M10,-40 C14,-50 17,-56 21,-60 L30,-54 C24,-48 21,-41 18,-32 Z'), pal.body],
      [E2(0, -34, 22, 12.5, -0.12), pal.body],
      [E2(-3, -28, 9, 11, 0.25), pal.body],
      [leg(2, sw), pal.body],
      [E2(28, -58, 12, 8.5, -0.1), pal.body], [E2(38, -55, 9.5, 5.5, 0.08), pal.body],
    ];
    if (o.crests) parts.unshift([E2(25, -69, 3, 8, -0.3), pal.crest], [E2(32, -68, 3, 7, 0.1), pal.crest]);
    body(parts, lw);
    ctx.fillStyle = pal.belly; ellipse(5, -27, 13, 4.8, -0.1);
    ctx.strokeStyle = pal.stripe; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (const sx of [-12, -4, 4]) { ctx.beginPath(); ctx.moveTo(sx, -45); ctx.lineTo(sx + 3, -38); ctx.stroke(); }
    if (!o.crests) { ctx.fillStyle = pal.crest; for (const [cx, cy, r] of [[22, -66, 3.5], [27, -67, 3], [18, -63, 2.6]]) circle(cx, cy, r); }
    // little arm
    ctx.strokeStyle = OL; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(13, -31); ctx.quadraticCurveTo(19, -27, 22, -23); ctx.stroke();
    ctx.strokeStyle = pal.body; ctx.lineWidth = 1.6; ctx.stroke();
    eye(31, -60, 4.2, 1, m === 'startle' ? 'shock' : m);
    if (m === 'sneaky' || m === 'grump') {
      // a cheeky half-shut lid and a raised brow
      ctx.fillStyle = pal.body; ctx.beginPath(); ctx.ellipse(31, -61.5, 4.2, 3, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(26.5, -61.5); ctx.lineTo(35.5, -61.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, m === 'grump' ? -68 : -66); ctx.lineTo(36, m === 'grump' ? -64 : -67); ctx.stroke();
    }
    ctx.fillStyle = OL; circle(45, -57, 1);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath();
    if (m === 'startle' || m === 'shock') ctx.ellipse(41, -52, 2.5, 3, 0, 0, 7);
    else if (m === 'happy' || m === 'eat') ctx.arc(40, -54, 4, 0.2, Math.PI - 0.2);
    else { ctx.moveTo(34, -52); ctx.quadraticCurveTo(40, -50, 46, -54); }
    ctx.stroke();
    if (m !== 'happy') { ctx.fillStyle = '#fff'; tri(37, -51.5, 39, -51.2, 38, -49.2); tri(41, -51.5, 43, -51.8, 42, -49.6); }
    ctx.restore();
  }
  function ptero(x, y, z, s, o) {
    const f = o.facing || 1, t = o.t, flap = Math.sin(t * (o.fast ? 16 : 7));
    ctx.fillStyle = 'rgba(40,30,20,.18)'; ellipse(x, y, 34 * s * (1 - z / 260), 7 * s);
    ctx.save(); ctx.translate(x, y - z - 30 * s); ctx.scale(s * f, s);
    if (o.wob) ctx.rotate(Math.sin(t * 25) * 0.1);
    const lw = 1.5;
    const wing = (d) => { const tip = -26 * flap * d; const p = new Path2D(); p.moveTo(-6, -4); p.quadraticCurveTo(-20, -18 + tip * 0.5, -46, -6 + tip); p.quadraticCurveTo(-30, 0 + tip * 0.3, -18, 2); p.quadraticCurveTo(-10, 4, 4, 2); p.closePath(); return p; };
    body([[wing(-0.6), '#e88a5a']], lw);
    const parts = [
      [new Path2D('M8,-14 L-10,-28 L12,-20 Z'), '#ff9a6a'],
      [E2(0, -2, 16, 7.5, -0.1), '#ffb27a'],
      [E2(15, -12, 8, 6.5), '#ffb27a'],
      [new Path2D('M19,-14 L44,-8 L19,-7 Z'), '#ffd36b'],
      [wing(1), '#ff9a6a'],
    ];
    body(parts, lw);
    eye(16, -14, 3.6, 1, o.mood === 'startle' ? 'shock' : o.mood);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, 5); ctx.lineTo(-6, 11); ctx.moveTo(2, 5); ctx.lineTo(1, 11); ctx.stroke();
    ctx.restore();
  }
  function trex(x, y, s, o) {
    const f = o.facing || 1, t = o.t, m = o.mood, walk = o.walk;
    const sw = walk ? Math.sin(t * 8) * 6 : 0, breathe = Math.sin(t * 2) * 1.5, roar = o.roar || 0;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,30,20,.24)'; ellipse(0, 0, 60 * s, 13 * s);
    ctx.translate(0, -(o.lift || 0)); ctx.scale(s * f, s);
    if (o.wob) ctx.rotate(Math.sin(t * 22) * 0.04);
    if (m === 'sleep') { ctx.translate(0, 26); ctx.rotate(-0.05); }
    const lw = 1.9;
    const jaw = roar > 0 ? 0.35 : 0;
    const parts = [
      [new Path2D('M-30,-74 C-60,-82 -92,-76 -114,-62 C-92,-56 -60,-50 -30,-48 Z'), '#e8964a'],
      [E2(10 - sw, -10, 15, 7), '#d07a30'], [E2(4, -34, 15, 22, -0.1), '#d07a30'],
      [E2(-4, -68 + breathe, 40, 32, -0.2), '#f0a050'],
      [E2(-18 + sw, -10, 16, 7), '#f0a050'], [E2(-16, -38, 18, 25, 0.15), '#f0a050'],
      [new Path2D(`M16,-92 C${30},${-90 + jaw * 30} 64,${-86 + jaw * 40} 70,${-80 + jaw * 44} C60,${-70 + jaw * 40} 30,${-72 + jaw * 20} 14,-80 Z`), '#f0a050'],
      [E2(40, -106, 32, 20, -0.08), '#f0a050'],
      [E2(30, -62, 8, 4.5, 0.7), '#f0a050'],
    ];
    body(parts, lw);
    ctx.fillStyle = '#fff1d6'; ellipse(8, -56 + breathe, 22, 18, -0.2);
    ctx.strokeStyle = '#c8702a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [sx, sy] of [[-30, -86], [-16, -94], [0, -96], [24, -122], [40, -125]]) { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4, sy + 9); ctx.stroke(); }
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) tri(36 + i * 8, -88, 40 + i * 8, -88, 38 + i * 8, -83);
    if (roar > 0) { ctx.fillStyle = '#c84a5a'; ellipse(46, -80, 16, 5 + roar * 6); }
    eye(48, -110, 6.5, 1, m === 'sleep' ? 'sleep' : m === 'dizzy' ? 'dizzy' : m === 'happy' ? 'happy' : undefined);
    if (!m || m === 'grump') { ctx.strokeStyle = OL; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(38, -122); ctx.lineTo(58, -116); ctx.stroke(); }
    ctx.fillStyle = OL; circle(68, -110, 1.8);
    ctx.restore();
  }

  const MOODS = { startle: 'startle', flee: 'startle', blown: 'startle', stun: 'dizzy', sleep: 'sleep', sticky: 'grump', tangle: 'grump', confuse: 'dizzy', eat: 'eat', happy: 'happy', wobble: 'grump' };
  function drawDino(e) {
    const K = e.K, st = e.st?.k, mood = st ? MOODS[st] : e.state === 'carry' ? 'happy' : e.kind === 'trex' ? 'grump' : 'sneaky';
    const o = { facing: e.face, t: e.t, walk: e.moving, mood, wob: st === 'wobble' || st === 'tangle' || st === 'sticky' };
    if (e.state === 'leave') ctx.globalAlpha = clamp(1 - e.lt / (e.kind === 'trex' ? 2.2 : 1.4), 0, 1);
    if (st === 'happy') o.lift = Math.abs(Math.sin(e.t * 9)) * 10;
    if (e.kind === 'ptero') {
      // a carried baby dangles under its feet
      if (g.baby.held === e) { ctx.fillStyle = 'rgba(40,30,20,.15)'; ellipse(e.x, e.y + 4, 18, 5); babyArt(e.x + e.face * 2, e.y - e.z + 30, { facing: e.face, mood: 'shock', walk: true, t: e.t }); }
      ptero(e.x, e.y, e.z, K.s, { ...o, fast: e.state === 'swoop' || e.state === 'carry' });
    } else if (e.kind === 'trex') trex(e.x, e.y, K.s, { ...o, roar: e.roar, mood: st === 'sleep' ? 'sleep' : st === 'stun' || st === 'confuse' ? 'dizzy' : st === 'happy' || st === 'eat' ? 'happy' : 'grump' });
    else {
      if (g.baby.held === e) babyArt(e.x - e.face * 4, e.y + 4, { facing: e.face, mood: 'shock', walk: true, t: e.t, lift: 14 });
      biped(e.x, e.y, K.s, { ...o, pal: K.pal, crests: e.kind === 'dilo', frill: e.frill || 0 });
    }
    ctx.globalAlpha = 1;
    // what's happening to it, floating over its head
    const hx = e.x, hy = e.y - (e.z || 0) - K.h * K.s - 12;
    if (st === 'stun' || st === 'confuse') for (let i = 0; i < 3; i++) { const a = e.t * 5 + i * 2.1; star(hx + Math.cos(a) * 16, hy + Math.sin(a) * 5, 6, st === 'stun' ? '#ffe36b' : '#ff8fc8', 5); }
    if (st === 'confuse') outlined('?', hx, hy - 14, 18, '#fff');
    if (st === 'sleep') { const k = (e.t * 0.8) % 1; ctx.globalAlpha = 1 - k; outlined('z', hx + 10 + k * 12, hy - k * 22, 14 + k * 8, '#fff'); ctx.globalAlpha = 1; }
    if (st === 'sticky') { ctx.fillStyle = 'rgba(240,170,40,.75)'; ellipse(e.x, e.y - 2, 26 * K.s + 8, 9); for (let i = -1; i <= 1; i++) ellipse(e.x + i * 10, e.y - 8 - Math.abs(Math.sin(e.t * 2 + i)) * 8, 3, 6); }
    if (st === 'tangle') {
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5;
      const r = 22 * K.s + 10, cy = e.y - K.h * K.s * 0.5;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(e.x + i * r / 3 - r * 0.5, cy - r); ctx.lineTo(e.x + i * r / 3 + r * 0.5, cy + r); ctx.moveTo(e.x + i * r / 3 + r * 0.5, cy - r); ctx.lineTo(e.x + i * r / 3 - r * 0.5, cy + r); ctx.stroke(); }
    }
    if (st === 'happy') heart(hx, hy - 10 - Math.sin(e.t * 6) * 4, 16, '#ff6fa8');
    if (st === 'startle' || st === 'flee' || st === 'blown') { ctx.fillStyle = '#9ad8ff'; ellipse(hx + 14, hy + 12, 3, 5); }
    // the T-Rex's grumpy meter
    if (e.kind === 'trex' && live(e) && e.state !== 'idle') {
      const w = 110, x = e.x - w / 2, y = e.y - K.h * K.s - 46;
      rrect(x - 4, y - 4, w + 8, 22, 11, 'rgba(48,24,72,.8)');
      rrect(x, y, w * clamp(e.grump / K.grump, 0, 1), 14, 7, '#ff7a5a');
      text('Grumpy', e.x, y + 7, 11, '#fff', 'center', 700);
    }
  }

  function drawAub() {
    const A = g.aub;
    const frame = A.swing > 0 ? 'cast' : A.moving ? ['run1', 'run2', 'run3', 'run4', 'run5'][Math.floor(A.step * 11) % 5] : 'idle_front';
    if (g.shieldT > 0) {
      const a = Math.min(1, g.shieldT) * (0.7 + 0.15 * Math.sin(S.t * 8));
      ctx.globalAlpha = a;
      const sg = ctx.createRadialGradient(A.x, A.y - 40, 20, A.x, A.y - 40, 80);
      sg.addColorStop(0, 'rgba(200,245,255,.05)'); sg.addColorStop(0.8, 'rgba(160,230,255,.3)'); sg.addColorStop(1, 'rgba(220,250,255,.75)');
      ctx.fillStyle = sg; circle(A.x, A.y - 40, 80);
      ctx.globalAlpha = 1;
    }
    drawAubrey(A.x, A.y + 10, frame, A.face, 0, AUB_S);
    if (A.goo > 0) { ctx.fillStyle = 'rgba(150,230,100,.7)'; ellipse(A.x, A.y + 8, 22, 7); for (const dx of [-12, 0, 12]) ellipse(A.x + dx, A.y + 2, 4, 7); }
    if (A.swing > 0) {
      // a big swishy leaf
      const k = 1 - A.swing / 0.32, a = (-1.3 + k * 2.6) * A.face;
      ctx.save(); ctx.translate(A.x + A.face * 12, A.y - 52); ctx.rotate(a + (A.face < 0 ? Math.PI : 0));
      ctx.scale(1, A.face);
      ink(BIG_LEAF, '#5cc060', 1.6);
      ctx.strokeStyle = '#3a8a40'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(52, 0); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(A.x, A.y - 40, 70, A.face > 0 ? -1.3 : Math.PI - 1.3, A.face > 0 ? -1.3 + k * 2.6 : Math.PI - 1.3 + k * 2.6); ctx.stroke();
    }
  }
  const BIG_LEAF = P2('M0,0 C8,-16 30,-22 56,-2 C30,18 8,14 0,0 Z');

  function drawLeash() {
    const A = g.aub, B = g.baby;
    if (B.held || g.state === 'win') return;
    const hx = A.x + A.face * 14, hy = A.y - 42, bx = B.x + B.face * 10, by = B.y - 22;
    ctx.strokeStyle = '#ff6fa8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + bx) / 2, Math.max(hy, by) + 18, bx, by); ctx.stroke();
    ctx.fillStyle = '#ff6fa8'; circle(bx, by, 3);
  }

  function drawWorld() {
    const A = g.aub, B = g.baby;
    if (!BG) BG = paintBG();
    ctx.drawImage(BG, -M, -M, WW + 2 * M, WH + 2 * M);
    // sunny dapples
    for (let i = 0; i < 26; i++) {
      const x = (i * 397) % WW, y = (i * 233) % WH;
      ctx.fillStyle = `rgba(255,250,210,${0.12 + 0.08 * Math.sin(S.t * 1.3 + i)})`; ellipse(x, y, 34, 18);
    }
    // glowing paw prints show the way to mama and papa
    if (g.state === 'play') {
      let [cx, cy] = cellOf(A.x, A.y);
      const pts = [[A.x, A.y]];
      for (let k = 0; k < 4 && g.fieldG[cy][cx] > 0; k++) {
        const n = DIRS.find(([b, dx, dy]) => !(MAZE.walls[cy][cx] & b) && g.fieldG[cy + dy][cx + dx] === g.fieldG[cy][cx] - 1);
        cx += n[1]; cy += n[2]; pts.push(ctr(cx, cy));
      }
      let along = 0;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
        for (let s = 40; s < d; s += 42) {
          along++;
          if (along < 2) continue;
          const side = along % 2 ? 7 : -7, px = x0 + Math.cos(a) * s - Math.sin(a) * side, py = y0 + Math.sin(a) * s + Math.cos(a) * side;
          ctx.globalAlpha = (0.35 + 0.35 * Math.max(0, Math.sin(S.t * 4 - along * 0.5))) * clamp(1.4 - along / 12, 0.2, 1);
          ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
          ctx.fillStyle = '#fffbe0'; ellipse(0, 2, 5, 6);
          for (const t of [-0.5, 0, 0.5]) ellipse(Math.sin(t) * 7, -6 + Math.abs(t) * 3, 2.2, 3);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }
    // honey, berries, tap marker
    for (const p of g.puddles) {
      ctx.globalAlpha = Math.min(1, p.t);
      ctx.fillStyle = '#f0b030'; ellipse(p.x, p.y, p.r, p.r * 0.55);
      ctx.fillStyle = '#ffd36b'; ellipse(p.x - p.r * 0.2, p.y - p.r * 0.12, p.r * 0.55, p.r * 0.25);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(p.x - p.r * 0.35, p.y - p.r * 0.2, p.r * 0.15, p.r * 0.07);
      ctx.globalAlpha = 1;
    }
    for (const b of g.baits) for (let i = 0; i < 6; i++) { inkCircle(b.x + Math.cos(i * 1.05) * 10, b.y + Math.sin(i * 1.05) * 6, 5.5, i % 2 ? '#6a5ae0' : '#4e8af0', 1, OL); }
    if (g.tap) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(g.tap.x, g.tap.y, 14 + Math.sin(S.t * 8) * 3, 7, 0, 0, 7); ctx.stroke(); }
    if (g.petalT > 0) {
      for (let i = 0; i < 18; i++) {
        const a = S.t * 3 + i * 0.35, r = 70 + (i % 3) * 30;
        ctx.save(); ctx.translate(A.x + Math.cos(a) * r, A.y - 20 + Math.sin(a) * r * 0.55); ctx.rotate(a * 2);
        ctx.globalAlpha = Math.min(1, g.petalT); ctx.fillStyle = ['#ff8fc8', '#ffc0dc', '#fff'][i % 3]; ellipse(0, 0, 6, 3.5); ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    // everybody standing, back to front
    const list = [];
    for (const e of g.dinos) if (!e.K.fly) list.push({ y: e.y, f: () => drawDino(e) });
    list.push({ y: A.y, f: drawAub });
    if (!B.held) list.push({ y: B.y, f: () => babyArt(B.x, B.y, { facing: B.face, walk: B.hop > 0, t: S.t, mood: g.state === 'win' ? 'happy' : undefined, lift: g.state === 'win' ? Math.abs(Math.sin(g.wt * 8)) * 12 : 0 }) });
    const P = g.mama, Q = g.papa;
    list.push({ y: P.y, f: () => parentArt(P, false) });
    list.push({ y: Q.y, f: () => parentArt(Q, true) });
    list.sort((a, b) => a.y - b.y);
    drawLeash();
    for (const it of list) it.f();
    for (const e of g.dinos) if (e.K.fly) drawDino(e);
    // goo, effects, sparkles, words
    for (const o of g.goos) { inkCircle(o.x, o.y, 7, '#9ce86a', 1.2, OL); ctx.fillStyle = '#d8ffb8'; circle(o.x - 2, o.y - 2, 2.4); }
    for (const fx of g.fx) drawFxItem(fx);
    for (const p of g.parts) {
      ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
      if (p.kind === 'heart') heart(p.x, p.y, p.size * 3, p.col); else star(p.x, p.y, p.size, p.col);
    }
    ctx.globalAlpha = 1;
    for (const t of g.texts) { ctx.globalAlpha = clamp(t.life, 0, 1); outlined(t.str, t.x, t.y, t.size, t.col); }
    ctx.globalAlpha = 1;
  }
  function drawFxItem(f) {
    const k = f.t / f.dur;
    ctx.globalAlpha = 1 - k;
    if (f.k === 'ring') { ctx.strokeStyle = f.col; ctx.lineWidth = f.w * (1 - k) + 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * easeOut(k), f.r * easeOut(k) * 0.6, 0, 0, 7); ctx.stroke(); }
    else if (f.k === 'gust') {
      ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 4;
      for (let i = 0; i < 10; i++) { const a = i * 0.628 + k, r = f.r * easeOut(k); ctx.beginPath(); ctx.arc(f.x, f.y, r * (0.6 + (i % 3) * 0.15), a, a + 0.6); ctx.stroke(); }
    } else if (f.k === 'beam') {
      const len = f.len * Math.min(1, k * 4);
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(Math.atan2(f.dy, f.dx));
      ['#ff6b6b', '#ffa94d', '#ffe36b', '#69db7c', '#4dabf7', '#9775fa'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, -30 + i * 10, len, 10); });
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(0, -6, len, 12);
      ctx.restore();
    } else if (f.k === 'notes') {
      for (let i = 0; i < 6; i++) { const a = i * 1.05, r = 40 + k * 140; outlined(i % 2 ? '♪' : '♫', f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6 - k * 30, 24, '#d8d0ff'); }
    } else if (f.k === 'net' || f.k === 'lasso') {
      const e = f.e, tx = e.x, ty = e.y - (e.z || 0) - e.K.h * e.K.s * 0.5, kk = Math.min(1, k * 2.5);
      const x = lerp(f.x, tx, kk), y = lerp(f.y, ty, kk);
      ctx.globalAlpha = 1;
      if (f.k === 'lasso') { ctx.strokeStyle = '#ff6fa8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(g.aub.x, g.aub.y - 45); ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, 18, 10, S.t * 6, 0, 7); ctx.stroke(); }
      else { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - 18, y + i * 7); ctx.lineTo(x + 18, y + i * 7); ctx.moveTo(x + i * 7, y - 18); ctx.lineTo(x + i * 7, y + 18); ctx.stroke(); } }
    } else if (f.k === 'toss') {
      ctx.globalAlpha = 1;
      const x = lerp(f.x0, f.x, k), y = lerp(f.y0, f.y, k) - Math.sin(k * Math.PI) * 50;
      inkCircle(x, y, 6, '#6a5ae0', 1, OL);
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------------------------------------
  // HUD: progress, mini-map, the shoo button and ability buttons with cooldown rings
  // ---------------------------------------------------------------------------------------------
  function drawHUD() {
    const A = g.aub;
    g.ui = [];
    darkPanel(12, 10, 318, 50, 16);
    text('🦕 Take Baby home to Mama & Papa!', 26, 26, 15, '#fff', 'left', 700);
    const [cx, cy] = cellOf(A.x, A.y), prog = clamp(1 - g.fieldG[cy][cx] / g.startD, 0, 1);
    bar(26, 41, 210, 10, prog * 100, '#7fd88a', 'rgba(255,255,255,.2)');
    text(`Shooed: ${g.charmed}`, 248, 46, 12, '#ffd1ec', 'left', 600);
    // mini-map
    const mc = 10, mw = COLS * mc, mh = ROWS * mc, mx = W - mw - 18, my = 12;
    rrect(mx - 6, my - 4, mw + 12, mh + 10, 10, 'rgba(48,24,72,.82)');
    ctx.fillStyle = '#e8d08e'; ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const w = MAZE.walls[y][x];
      if (w & BE) { ctx.moveTo(mx + (x + 1) * mc, my + y * mc); ctx.lineTo(mx + (x + 1) * mc, my + (y + 1) * mc); }
      if (w & BS) { ctx.moveTo(mx + x * mc, my + (y + 1) * mc); ctx.lineTo(mx + (x + 1) * mc, my + (y + 1) * mc); }
    }
    ctx.stroke(); ctx.strokeRect(mx, my, mw, mh);
    const mp = (x, y) => [mx + x / C * mc, my + y / C * mc];
    heart(...mp(g.mama.x + 40, g.mama.y - 30), 12, '#ff4f8f');
    for (const e of g.dinos) if (live(e) && e.state !== 'idle') { ctx.fillStyle = e.kind === 'trex' ? '#ff7a3a' : '#9a70e0'; circle(...mp(e.x, e.y), e.kind === 'trex' ? 3.5 : 2); }
    const [ax, ay] = mp(A.x, A.y);
    ctx.fillStyle = '#fff'; circle(ax, ay, 4.5); ctx.fillStyle = '#ff6fb5'; circle(ax, ay, 3.2);
    // mama and papa, if they're off the screen: an arrow at the edge pointing their way
    const sx = g.mama.x - g.cam.x, sy = g.mama.y - 50 - g.cam.y;
    if (sx < 30 || sx > W - 30 || sy < 70 || sy > H - 100) {
      const ex = clamp(sx, 60, W - 60), ey = clamp(sy, 150, H - 130), a = Math.atan2(sy - ey, sx - ex);
      rrect(ex - 46, ey - 26, 92, 52, 20, 'rgba(255,248,252,.92)', '#ff8fc8', 3);
      emoji('🦕', ex - 18, ey - 2, 26); heart(ex + 16, ey - 12, 18, '#ff4f8f');
      text('Mama', ex + 16, ey + 14, 11, '#c2407e', 'center', 700);
      ctx.fillStyle = '#ff6fb5'; ctx.save(); ctx.translate(ex + Math.cos(a) * 54, ey + Math.sin(a) * 36); ctx.rotate(a); tri(10, 0, -6, -9, -6, 9); ctx.restore();
    }
    // message banner
    if (g.msg) {
      const lines = wrap(g.msg.text, 520, 18, 700), h = 16 + lines.length * 24;
      ctx.globalAlpha = clamp(g.msg.t * 2, 0, 1);
      panel(W / 2 - 280, 72, 560, h, 16);
      lines.forEach((l, i) => text(l, W / 2, 72 + 20 + i * 24, 18, '#5a2a6e', 'center', 700));
      ctx.globalAlpha = 1;
    }
    if (g.baby.held) {
      if (Math.sin(S.t * 8) > 0) outlined('Catch the snatcher!', W / 2, g.msg ? 150 : 96, 24, '#ffb3b3');
      // and if he's been carried off the screen, an arrow points the way
      const e = g.baby.held, bx = e.x - g.cam.x, by = e.y - (e.z || 0) - 30 - g.cam.y;
      if (bx < 20 || bx > W - 20 || by < 70 || by > H - 110) {
        const ex = clamp(bx, 70, W - 70), ey = clamp(by, 190, H - 150), a = Math.atan2(by - ey, bx - ex);
        const pul = 1 + 0.08 * Math.sin(S.t * 10);
        ctx.save(); ctx.translate(ex, ey); ctx.scale(pul, pul);
        rrect(-46, -26, 92, 52, 20, 'rgba(255,240,240,.95)', '#ff6f6f', 3);
        emoji('🦕', -18, -2, 26); text('Baby!', 18, 0, 15, '#d04050', 'center', 700);
        ctx.fillStyle = '#ff6f6f'; ctx.translate(Math.cos(a) * 56, Math.sin(a) * 38); ctx.rotate(a); tri(12, 0, -6, -10, -6, 10);
        ctx.restore();
      }
    }
    // shoo
    const sb = { id: 'shoo', x: 14, y: H - 96, w: 124, h: 80 };
    const hov = inRect(sb);
    rrect(sb.x, sb.y, sb.w, sb.h, 22, A.swing > 0 ? '#8fdc7a' : hov ? '#7ed06a' : '#62b85a', '#fff', 3);
    emoji('🍃', sb.x + 34, sb.y + 38, 34);
    text('Shoo!', sb.x + 86, sb.y + 32, 20, '#fff', 'center', 700);
    text('Space', sb.x + 86, sb.y + 56, 12, 'rgba(255,255,255,.85)', 'center', 600);
    g.ui.push(sb);
    // abilities
    g.ab.list.forEach((a, i) => {
      const def = ABIL[a.id], x = 186 + i * 76, y = H - 56, r = 32;
      g.ui.push({ id: i, x, y, r });
      const ready = a.cd <= 0;
      ctx.save(); ctx.shadowColor = 'rgba(40,10,60,.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      ctx.fillStyle = ready ? def.col : mix(def.col, '#6a5a7a', 0.6); circle(x, y, r); ctx.restore();
      if (a.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${a.flash * 1.5})`; circle(x, y, r); }
      ctx.strokeStyle = ready ? '#fff' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      emoji(abIcon(a.id), x, y - 2, 30);
      if (!ready) {
        const k = a.cd / (def.cd * (1 - 0.15 * (a.lvl - 1)));
        ctx.fillStyle = 'rgba(40,20,60,.55)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r + 4, -Math.PI / 2 + k * Math.PI * 2, Math.PI * 1.5); ctx.stroke();
      } else if (Math.sin(S.t * 3 + i) > 0.6) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 7); ctx.stroke(); }
      inkCircle(x - r + 6, y - r + 6, 10, '#fff', 1, OL);
      text(String(i + 1), x - r + 6, y - r + 7, 13, '#5a2a6e', 'center', 700);
      for (let s = 0; s < a.lvl; s++) star(x - (a.lvl - 1) * 7 + s * 14, y + r + 2, 6, '#ffe36b', 5);
    });
  }

  function drawIntro() {
    ctx.fillStyle = 'rgba(30,14,50,.55)'; ctx.fillRect(0, 0, W, H);
    const list = g.ab.list, rows = list.length + 1, rh = rows > 6 ? 38 : 44;
    const h = 132 + rows * rh + 66, x = 150, y = Math.max(14, (H - h) / 2), w = 660;
    panel(x, y, w, h, 22);
    outlined('Race to Mama & Papa!', W / 2, y + 34, 32, '#7fd88a', 'center', '#2e5a36');
    const n = g.ab.total;
    const intro = n === 0 ? "You didn't find many supplies, but you still have some tricks:"
      : `You gathered ${n} supplies, so you can use:`;
    text('Sneaky dinos want to snatch Baby! Shoo them away and follow the glowing paw prints.', W / 2, y + 70, 16, '#5a2a6e', 'center', 500);
    text(intro, W / 2, y + 98, 18, '#c2407e', 'center', 700);
    let ry = y + 132;
    const row = (key, icon, name, what, lvl, col) => {
      rrect(x + 30, ry - rh / 2 + 3, w - 60, rh - 6, 12, mix(col, '#ffffff', 0.78));
      inkCircle(x + 56, ry, 13, '#fff', 1, OL); text(key, x + 56, ry + 1, key.length > 2 ? 9 : 14, '#5a2a6e', 'center', 700);
      emoji(icon, x + 94, ry, 26);
      text(name, x + 118, ry, 18, '#3a2050', 'left', 700);
      text(what, x + 290, ry, 14, '#5a4a7a', 'left', 500);
      for (let s = 0; s < lvl; s++) star(x + w - 90 + s * 18, ry, 7, '#f0b020', 5);
      ry += rh;
    };
    row('Spc', '🍃', 'Shoo!', 'Swish your big leaf at nearby dinos', 0, '#62b85a');
    list.forEach((a, i) => row(String(i + 1), abIcon(a.id), ABIL[a.id].name, a.gift ? 'You found a feather in your pocket!' : ABIL[a.id].what, a.lvl, ABIL[a.id].col));
    buttons = [];
    button('go', W / 2 - 100, y + h - 58, 200, 48, "Let's go! 🦕", { color: '#5fbf70', size: 20 });
  }
  function introSpeech() {
    const names = g.ab.list.map(a => ABIL[a.id].name);
    const last = names.pop();
    const lst = names.length ? `${names.join(', ')} and ${last}` : last;
    return g.ab.total === 0
      ? `Sneaky dinosaurs want to snatch the baby! You didn't find many supplies, but you can still use ${lst}. Follow the glowing paw prints to his mama and papa!`
      : `Sneaky dinosaurs want to snatch the baby! You gathered ${g.ab.total} supplies, so you can use ${lst}. Follow the glowing paw prints to his mama and papa!`;
  }

  // a simple test bot (DEV only): 'good' heads for mama and papa and fights, 'shoo' only shoos now and then,
  // 'walk' never fights, 'passive' does nothing
  function botInput(mode) {
    for (const k of ['arrowleft', 'arrowright', 'arrowup', 'arrowdown']) keys[k] = false;
    if (mode === 'passive' || g.state !== 'play') return;
    const A = g.aub, B = g.baby;
    let tx, ty;
    if (B.held) [tx, ty] = navPoint(g.fieldBot = bfs(...cellOf(B.held.x, B.held.y)), A.x, A.y, B.held.x, B.held.y);
    else [tx, ty] = navPoint(g.fieldG, A.x, A.y, g.mama.x, g.mama.y);
    const near = g.dinos.filter(e => live(e) && e.state !== 'idle' && dist(e, A) < 220);
    const trexNear = near.some(e => e.kind === 'trex' && dist(e, A) < 200);
    if (!(trexNear && dist(A, near.find(e => e.kind === 'trex')) < 110)) {
      if (tx - A.x > 6) keys.arrowright = true; else if (tx - A.x < -6) keys.arrowleft = true;
      if (ty - A.y > 6) keys.arrowdown = true; else if (ty - A.y < -6) keys.arrowup = true;
    }
    if (mode === 'walk') return;
    if (near.some(e => dist(e, A) < 120 || dist(e, B) < 90) && (mode === 'good' || Math.random() < 0.08)) pressed[' '] = true;
    if (near.length && mode === 'good') { const i = g.ab.list.findIndex(a => a.cd <= 0); if (i >= 0 && (near.length > 1 || trexNear || Math.random() < 0.02)) pressed[String(i + 1)] = true; }
  }

  SCENES.dinodefense = {
    enter() {
      g = newRun(); this.g = g;
      camera(1);
      SFX.alert();
      speak(introSpeech());
    },
    botInput,
    update(dt) {
      for (const p of g.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; }
      g.parts = g.parts.filter(p => p.life > 0);
      for (const t of g.texts) { t.life -= dt; t.y -= 34 * dt; }
      g.texts = g.texts.filter(t => t.life > 0);
      if (g.state === 'intro') {
        if (clickedButton() === 'go' || advancePressed()) {
          g.state = 'play';
          speak('Go! Press Space to shoo the dinos, and the number keys for your special tricks.');
        }
        return;
      }
      if (g.state === 'play') return play(dt);
      if (g.state === 'win') {
        g.wt += dt;
        const B = g.baby, P = g.mama, A = g.aub;
        A.moving = false; A.swing = 0;
        // he scampers over to his mama
        const tx = P.x + P.face * 85, ty = P.y + 22;
        if (Math.hypot(tx - B.x, ty - B.y) > 4) stepTo(B, tx, ty, 200, dt, 10, false);
        B.face = -P.face; B.hop += dt;
        for (const e of g.dinos) if (!e.gone) updDino(e, dt);
        g.dinos = g.dinos.filter(e => !e.gone);
        if (Math.random() < dt * 5) wburst(rand(P.x - 60, P.x + 120), P.y - rand(40, 120), 3, ['#ff8fc8', '#ffb3d6', '#fff'], { kind: 'heart', spread: 60 });
        camera(dt);
        if (g.wt > 1.8 && !g.said) {
          g.said = true;
          say([
            ['aubrey', 'laughing', "We made it! Look, it's your mama and papa!"],
            ['narrator', null, 'The baby dino runs straight into the biggest, happiest dinosaur snuggle ever.'],
          ], finish);
        }
      }
    },
    draw() {
      buttons = [];
      ctx.fillStyle = '#2f6e3f'; ctx.fillRect(0, 0, W, H);
      ctx.save();
      const sh = g.shake > 0 ? rand(-5, 5) * g.shake : 0;
      ctx.translate(-Math.round(g.cam.x) + sh, -Math.round(g.cam.y));
      drawWorld();
      ctx.restore();
      if (g.flash > 0) { ctx.fillStyle = `rgba(255,236,190,${g.flash * 1.4})`; ctx.fillRect(0, 0, W, H); }
      if (g.state === 'intro') return drawIntro();
      if (g.state === 'play') drawHUD();
      if (g.state === 'win') {
        const k = Math.min(1, g.wt * 2);
        outlined('We made it!', W / 2, H - 70 - (1 - k) * 40, 54, '#ffe36b');
      }
    },
  };
}
