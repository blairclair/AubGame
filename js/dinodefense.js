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
    abilityFx(a.id, l);
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
  // Art: the scenery (painted once into an offscreen canvas), the dinos, the effects
  // ---------------------------------------------------------------------------------------------
  let BG = null, PONDS = [], CANOPY = [], DAPPLE = [], FLUTTER = [];
  const shade = (c, k = 0.3) => mix(c, '#1e2a1a', k), light = (c, k = 0.3) => mix(c, '#ffffff', k);
  // a soft round glow (cached radial gradient sprite, tinted by colour)
  const GLOWS = {};
  function glowSprite(col) {
    if (GLOWS[col]) return GLOWS[col];
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, col); gr.addColorStop(0.45, col.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.45) + ')')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return (GLOWS[col] = c);
  }
  function glow(x, y, r, col, ry = r) { ctx.drawImage(glowSprite(col), x - r, y - ry, r * 2, ry * 2); }

  // sandy paths, the canyon walls (a jungle hedge on an earth bank), ponds, the nest clearing
  function paintBG() {
    const c = document.createElement('canvas');
    c.width = Math.ceil((WW + 2 * M) * DPR); c.height = Math.ceil((WH + 2 * M) * DPR);
    const old = ctx; ctx = c.getContext('2d');
    try {
      ctx.setTransform(DPR, 0, 0, DPR, M * DPR, M * DPR);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      seed = 4242;
      // the jungle beyond the canyon, then a meadow floor
      ctx.fillStyle = '#2b6a3c'; ctx.fillRect(-M, -M, WW + 2 * M, WH + 2 * M);
      const fg = ctx.createLinearGradient(0, 0, WW, WH);
      fg.addColorStop(0, '#a9cf72'); fg.addColorStop(0.5, '#9fca6c'); fg.addColorStop(1, '#93c066');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, WW, WH);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = spick(['rgba(190,225,120,.35)', 'rgba(120,175,80,.28)', 'rgba(230,240,160,.25)']);
        ellipse(sr(0, WW), sr(0, WH), sr(30, 90), sr(16, 40), sr(0, 3));
      }
      // sandy paths: wobbly round blobs between connected cell centres, edge colour first, then the sand
      const segs = [];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const w = MAZE.walls[y][x], [ax, ay] = ctr(x, y);
        if (x < COLS - 1 && !(w & BE)) segs.push([ax, ay, ax + C, ay]);
        if (y < ROWS - 1 && !(w & BS)) segs.push([ax, ay, ax, ay + C]);
        segs.push([ax, ay, ax, ay]);
      }
      const blobs = [];
      for (const [x0, y0, x1, y1] of segs) {
        const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 13));
        for (let i = 0; i <= n; i++) blobs.push([lerp(x0, x1, i / n) + sr(-4, 4), lerp(y0, y1, i / n) + sr(-4, 4), sr(34, 41)]);
      }
      ctx.fillStyle = '#c9a874'; for (const [x, y, r] of blobs) circle(x, y + 2, r + 5);
      ctx.fillStyle = '#e2c68e'; for (const [x, y, r] of blobs) circle(x, y, r + 1);
      ctx.fillStyle = '#efd9a6'; for (const [x, y, r] of blobs) circle(x - 2, y - 2, r - 6);
      // sand speckle and ripples
      for (let i = 0; i < 1800; i++) {
        const x = sr(0, WW), y = sr(0, WH);
        ctx.fillStyle = spick(['rgba(170,130,80,.25)', 'rgba(255,250,230,.5)', 'rgba(150,110,70,.18)']); circle(x, y, sr(0.8, 1.8));
      }
      ctx.strokeStyle = 'rgba(190,150,95,.28)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 140; i++) { const [x, y] = spick(blobs); ctx.beginPath(); ctx.arc(x + sr(-20, 20), y + sr(-20, 20) + 30, 30, -2.1, -1.0); ctx.stroke(); }
      // the nest clearing glows warm and grassy
      const nx = WW - C, ny = C + 10;
      const ng = ctx.createRadialGradient(nx, ny, 10, nx, ny, 250);
      ng.addColorStop(0, 'rgba(255,236,160,.75)'); ng.addColorStop(0.5, 'rgba(200,236,130,.55)'); ng.addColorStop(1, 'rgba(170,230,120,0)');
      ctx.fillStyle = ng; ctx.fillRect(WW - 2 * C - 120, -60, 2 * C + 180, 2 * C + 180);
      // footprints of the dinos who live here (and one big T-Rex trail)
      for (let i = 0; i < 16; i++) {
        const [x, y] = spick(blobs), a = sr(0, 6), big = i < 3;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = big ? 'rgba(140,100,60,.22)' : 'rgba(150,110,70,.26)';
        const k = big ? 1.8 : 1;
        for (let s = 0; s < 4; s++) { const sx = s * 30 * k, sy = (s % 2 ? 9 : -9) * k; ellipse(sx, sy, 6 * k, 5 * k); for (const t of [-0.55, 0, 0.55]) ellipse(sx + Math.cos(t) * 10 * k, sy + Math.sin(t) * 10 * k, 2.4 * k, 4.4 * k, t); }
        ctx.restore();
      }
      // a fossil or two in the sand
      for (let i = 0; i < 6; i++) {
        const [x, y] = spick(blobs);
        ctx.strokeStyle = 'rgba(150,115,75,.5)'; ctx.lineWidth = 2.2; ctx.beginPath();
        for (let a = 0; a < 13; a += 0.25) ctx.lineTo(x + Math.cos(a) * a * 1.05, y + Math.sin(a) * a * 1.05);
        ctx.stroke();
        for (let a = 2; a < 13; a += 1.2) { ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * a * 0.8, y + Math.sin(a) * a * 0.8); ctx.lineTo(x + Math.cos(a) * a * 1.2, y + Math.sin(a) * a * 1.2); ctx.stroke(); }
      }
      // pebbles (outlined), mostly on the paths
      for (let i = 0; i < 300; i++) {
        const [bx, by] = spick(blobs), x = bx + sr(-30, 30), y = by + sr(-30, 30), r = sr(2, 4.6);
        ctx.fillStyle = 'rgba(80,50,30,.2)'; ellipse(x + 1, y + 1.5, r * 1.3, r * 0.9);
        inkEllipse(x, y, r * 1.3, r * 0.9, sr(0, 3), spick(['#d8c3a0', '#bfae98', '#c9b28a', '#a9a4a0', '#e6d3b0']), 0.6, 'rgba(91,63,115,.55)');
        ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(x - r * 0.4, y - r * 0.35, r * 0.35);
      }
      // where the walls are near (the grassy verges)
      const verge = (x, y) => !inWall(x, y) && (inWall(x + 30, y) || inWall(x - 30, y) || inWall(x, y + 30) || inWall(x, y - 30));
      const tuft = (x, y, h, cols) => {
        ctx.lineWidth = 2.2;
        for (let k = -2; k <= 2; k++) { ctx.strokeStyle = cols[(k + 2) % cols.length]; ctx.beginPath(); ctx.moveTo(x + k * 1.5, y); ctx.quadraticCurveTo(x + k * 3, y - h * 0.6, x + k * 4.2, y - h * (1 - Math.abs(k) * 0.15)); ctx.stroke(); }
      };
      for (let i = 0, n = 0; i < 6000 && n < 700; i++) {
        const x = sr(10, WW - 10), y = sr(10, WH - 10);
        if (!verge(x, y)) { if (srand() < 0.94 || inWall(x, y)) continue; }
        n++;
        tuft(x, y, sr(7, 14), spick([['#4f9a3c', '#6ab84c', '#84cc5a'], ['#5aa844', '#7cc456', '#3f8a34']]));
      }
      // little flowers along the verges
      for (let i = 0, n = 0; i < 6000 && n < 190; i++) {
        const x = sr(10, WW - 10), y = sr(10, WH - 10);
        if (!verge(x, y)) continue;
        n++;
        const col = spick(['#ff8fc8', '#ffe36b', '#ffffff', '#c9a6ff', '#ff9a6a', '#8fd0ff']);
        ctx.strokeStyle = '#4f9a3c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = 'rgba(91,63,115,.5)'; for (let k = 0; k < 5; k++) circle(x + Math.cos(k * 1.257) * 3.4, y + Math.sin(k * 1.257) * 3.4, 3);
        ctx.fillStyle = col; for (let k = 0; k < 5; k++) circle(x + Math.cos(k * 1.257) * 3.4, y + Math.sin(k * 1.257) * 3.4, 2.4);
        ctx.fillStyle = '#ffd23a'; circle(x, y, 1.8);
      }
      // little mushrooms at the foot of the walls
      for (let i = 0, n = 0; i < 4000 && n < 40; i++) {
        const x = sr(10, WW - 10), y = sr(10, WH - 10);
        if (!verge(x, y)) continue;
        n++;
        const col = spick(['#ff6f6f', '#f0a050', '#c9a6ff']);
        inkRect(x - 1.8, y - 6, 3.6, 7, '#fff6e6', 0.8);
        ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 4.5, 0, Math.PI, 0); ctx.closePath(); ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = col; ctx.fill();
        ctx.fillStyle = '#fff'; circle(x - 2, y - 8, 1.1); circle(x + 2.4, y - 7, 0.9);
      }
      // fallen leaves
      for (let i = 0; i < 220; i++) {
        const x = sr(0, WW), y = sr(0, WH);
        if (inWall(x, y)) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(sr(0, 6.28)); const s = sr(0.35, 0.6); ctx.scale(s, s);
        ink(LEAF_S, spick(['#e8b04a', '#d98a3a', '#9cc858', '#7ab648', '#c8a040', '#e07a50']), 1.6, 'rgba(91,63,115,.6)');
        ctx.strokeStyle = 'rgba(91,63,115,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(15, 0); ctx.stroke();
        ctx.restore();
      }
      // little ponds tucked into a few quiet dead ends (shallow: just for splashing and frogs)
      PONDS = [];
      const onRoute = new Set((g?.route || []).map(([x, y]) => x + ',' + y));
      for (let y = 0; y < ROWS && PONDS.length < 4; y++) for (let x = 0; x < COLS && PONDS.length < 4; x++) {
        const w = MAZE.walls[y][x], openSides = DIRS.filter(([b]) => !(w & b));
        if (openSides.length !== 1 || onRoute.has(x + ',' + y) || (x + y * 3) % 2) continue;
        if (x >= COLS - 2 && y <= 1 || x === 0 && y === ROWS - 1) continue;
        const [, dx, dy] = openSides[0], [cx, cy] = ctr(x, y);
        PONDS.push({ x: cx - dx * 26 + (dy ? 18 : 0), y: cy - dy * 24 + (dx ? 10 : 0), rx: 40, ry: 24 });
      }
      for (const p of PONDS) pondArt(p);
      // the nest: a big woven nest of twigs and soft leaves, with a ring of flowers
      ctx.fillStyle = 'rgba(70,40,15,.25)'; ellipse(nx + 6, ny + 16, 104, 48);
      for (let i = 0; i < 22; i++) {
        const a = i / 22 * 6.28, x = nx + Math.cos(a) * 150, y = ny + Math.sin(a) * 82;
        if (inWall(x, y)) continue;
        const col = spick(['#ff8fc8', '#ffe36b', '#ff9a6a', '#c9a6ff', '#ffffff']);
        ctx.fillStyle = 'rgba(91,63,115,.55)'; for (let k = 0; k < 5; k++) circle(x + Math.cos(k * 1.257) * 5.5, y + Math.sin(k * 1.257) * 5.5, 5);
        ctx.fillStyle = col; for (let k = 0; k < 5; k++) circle(x + Math.cos(k * 1.257) * 5.5, y + Math.sin(k * 1.257) * 5.5, 4.2);
        ctx.fillStyle = '#fff3a0'; circle(x, y, 3);
      }
      for (const [fx, fy, a] of [[-130, -40, -2.6], [120, -50, -0.5], [-120, 50, 2.6], [130, 45, 0.5]]) fern(nx + fx, ny + fy, a, 46, '#4fae55');
      inkEllipse(nx, ny, 94, 44, 0, '#a8723e', 3, OL);
      const nwG = ctx.createRadialGradient(nx, ny - 6, 10, nx, ny, 90);
      nwG.addColorStop(0, '#6a4426'); nwG.addColorStop(0.55, '#8a5a32'); nwG.addColorStop(0.8, '#b8834c'); nwG.addColorStop(1, '#c9945a');
      ctx.fillStyle = nwG; ellipse(nx, ny, 92, 42);
      ctx.fillStyle = '#e2c08a'; ellipse(nx, ny - 4, 66, 26);
      ctx.fillStyle = '#9fd46e'; for (let i = 0; i < 18; i++) { const a = sr(0, 6.28), r = sr(0, 52); ellipse(nx + Math.cos(a) * r, ny - 4 + Math.sin(a) * r * 0.4, 9, 4, a); }
      for (let i = 0; i < 70; i++) {
        const a = sr(0, 6.28), r = sr(68, 92);
        ctx.strokeStyle = spick(['#7a4a24', '#9a6434', '#c08a50', '#6a3e1e']); ctx.lineWidth = sr(2, 3.4);
        ctx.beginPath(); ctx.moveTo(nx + Math.cos(a) * r * 0.82, ny + Math.sin(a) * r * 0.38); ctx.quadraticCurveTo(nx + Math.cos(a + 0.2) * r, ny + Math.sin(a + 0.2) * r * 0.5, nx + Math.cos(a + 0.42) * r * 0.98, ny + Math.sin(a + 0.42) * r * 0.45); ctx.stroke();
      }
      for (const [ex, ey, r] of [[-30, -10, 0.3], [-6, -14, -0.2], [20, -8, 0.4]]) {
        inkEllipse(nx + ex, ny + ey, 12, 9, r, '#fff6e6', 1.5, OL);
        ctx.fillStyle = '#a8e0b0'; circle(nx + ex - 3, ny + ey - 2, 2.2); circle(nx + ex + 4, ny + ey + 2, 1.6);
        ctx.fillStyle = 'rgba(255,255,255,.8)'; ellipse(nx + ex - 4, ny + ey - 4, 3.5, 2, -0.4);
      }

      // --- the canyon walls: an earth bank with a jungle hedge on top -----------------------------
      const rocks = MAZE.rects.filter(r => !r.border);
      // where the trees stand (their shadows go on the ground first)
      CANOPY = [];
      const jn = new Set();
      for (const r of rocks) for (const [px, py] of [[r.x + T / 2, r.y + T / 2], [r.x + r.w - T / 2, r.y + r.h - T / 2]]) {
        const k = Math.round(px / C) + ',' + Math.round(py / C);
        if (jn.has(k)) continue; jn.add(k);
        if (srand() < 0.42 && inWall(Math.round(px / C) * C, Math.round(py / C) * C)) CANOPY.push({ x: Math.round(px / C) * C + sr(-6, 6), y: Math.round(py / C) * C - 14 + sr(-6, 6), v: spick([0, 0, 1, 1, 2]), s: sr(0.85, 1.1), ph: sr(0, 6) });
      }
      for (let x = 60; x < WW; x += sr(150, 240)) { CANOPY.push({ x, y: -40, v: spick([0, 1, 2]), s: sr(1, 1.25), ph: sr(0, 6) }); CANOPY.push({ x: x + 80, y: WH + 112, v: spick([0, 2]), s: sr(1, 1.3), ph: sr(0, 6) }); }
      for (let y = 60; y < WH; y += sr(150, 230)) { CANOPY.push({ x: -44, y, v: spick([0, 1, 2]), s: sr(1, 1.25), ph: sr(0, 6) }); CANOPY.push({ x: WW + 44, y: y + 70, v: spick([0, 1, 2]), s: sr(1, 1.25), ph: sr(0, 6) }); }
      ctx.fillStyle = 'rgba(30,50,20,.16)';
      for (const t of CANOPY) { ellipse(t.x + 22, t.y + 40, 52 * t.s, 30 * t.s); ellipse(t.x + 14, t.y + 34, 36 * t.s, 22 * t.s); }
      // soft contact shadows on the ground (south and east of each wall)
      for (const [a, o] of [[0.1, 16], [0.12, 10], [0.14, 5]]) {
        ctx.fillStyle = `rgba(40,30,20,${a})`;
        for (const r of rocks) { ctx.beginPath(); ctx.roundRect(r.x - 2, r.y + 8, r.w + o, r.h + o * 0.9, 14); ctx.fill(); }
      }
      // the earth bank (the "front face" that shows under the hedge)
      ctx.strokeStyle = OL; ctx.lineWidth = 5;
      for (const r of rocks) { ctx.beginPath(); ctx.roundRect(r.x + 2, r.y + 8, r.w - 4, r.h + 3, 10); ctx.stroke(); }
      for (const r of rocks) {
        const fg2 = ctx.createLinearGradient(0, r.y + r.h - 14, 0, r.y + r.h + 11);
        fg2.addColorStop(0, '#9a6a42'); fg2.addColorStop(0.5, '#7e5234'); fg2.addColorStop(1, '#5e3a24');
        ctx.beginPath(); ctx.roundRect(r.x + 2, r.y + 8, r.w - 4, r.h + 3, 10); ctx.fillStyle = fg2; ctx.fill();
      }
      for (const r of rocks) {
        // strata, little stones and roots in the bank
        const yb = r.y + r.h;
        ctx.strokeStyle = 'rgba(60,35,20,.4)'; ctx.lineWidth = 1.6;
        for (let x = r.x + 8; x < r.x + r.w - 10; x += sr(14, 26)) { ctx.beginPath(); ctx.moveTo(x, yb + 2 + sr(-2, 2)); ctx.lineTo(x + sr(8, 14), yb + 3 + sr(-2, 2)); ctx.stroke(); }
        for (let x = r.x + 10; x < r.x + r.w - 10; x += sr(18, 34)) { ctx.fillStyle = spick(['#b8946c', '#a88a6a', '#c4a27a']); ellipse(x, yb + sr(4, 8), sr(2.5, 4), sr(1.8, 2.6)); }
        ctx.strokeStyle = 'rgba(70,40,20,.55)'; ctx.lineWidth = 1.4;
        for (let x = r.x + 12; x < r.x + r.w - 12; x += sr(24, 46)) { ctx.beginPath(); ctx.moveTo(x, yb - 4); ctx.quadraticCurveTo(x + 4, yb + 3, x + sr(-3, 6), yb + 9); ctx.stroke(); }
      }
      // the hedge: leafy clumps, outlined together then filled together so each wall reads as one bush
      const clumps = [];
      const pal = [['#3f9a4c', '#57b35c'], ['#3a8f48', '#4fa858'], ['#45a050', '#62c46a'], ['#378a42', '#58ab52']];
      for (const r of rocks) {
        const along = r.w > r.h, len = along ? r.w : r.h;
        for (let p = 9; p < len - 6; p += sr(12, 17)) {
          const x = along ? r.x + p : r.x + r.w / 2 + sr(-3, 3), y = along ? r.y + r.h / 2 - 6 + sr(-3, 2) : r.y + p - 6;
          clumps.push({ x, y, r: sr(15, 19.5), c: spick(pal), fl: srand() < 0.14 });
        }
      }
      // the thick jungle round the edge (the stream runs along the bottom, between two banks)
      const edge = [];
      for (let x = -M; x < WW + M; x += 22) {
        edge.push({ x: x + sr(-5, 5), y: 2 + sr(-4, 4), r: sr(17, 23), c: spick(pal), fl: srand() < 0.1 });
        edge.push({ x: x + sr(-5, 5), y: WH + 4 + sr(-3, 3), r: sr(16, 21), c: spick(pal), fl: srand() < 0.1 });
        for (const y of [-34, -70, -100]) edge.push({ x: x + sr(-8, 8), y: y + sr(-8, 8), r: sr(24, 32), c: spick(pal), dk: true });
      }
      for (let y = -M; y < WH + M; y += 22) {
        edge.push({ x: 2 + sr(-4, 4), y: y + sr(-5, 5), r: sr(17, 23), c: spick(pal), fl: srand() < 0.1 });
        edge.push({ x: WW - 2 + sr(-4, 4), y: y + sr(-5, 5), r: sr(17, 23), c: spick(pal), fl: srand() < 0.1 });
        for (const x of [-34, -70, -100]) edge.push({ x: x + sr(-8, 8), y: y + sr(-8, 8), r: sr(24, 32), c: spick(pal), dk: true });
        for (const x of [WW + 34, WW + 70, WW + 100]) edge.push({ x: x + sr(-8, 8), y: y + sr(-8, 8), r: sr(24, 32), c: spick(pal), dk: true });
      }
      // far bank of the stream
      const far = [];
      for (let x = -M; x < WW + M; x += 24) for (const y of [WH + 84, WH + 112]) far.push({ x: x + sr(-6, 6), y: y + sr(-6, 6), r: sr(22, 30), c: spick(pal), dk: true });
      bushes(far);
      streamArt();
      // the top edge's bank shows under its hedge too
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-M, -M, WW + 2 * M, M + T / 2 + 10, 10); ctx.stroke();
      ctx.fillStyle = '#7e5234'; ctx.fillRect(-M, -M, WW + 2 * M, M + T / 2 + 10);
      ctx.fillStyle = '#5e3a24'; ctx.fillRect(-M, T / 2 + 2, WW + 2 * M, 8);
      bushes([...edge, ...clumps]);
      // ferns poking out of the hedge, and vines hanging over the bank
      for (const k of clumps) {
        if (srand() < 0.2) fern(k.x + sr(-6, 6), k.y + 4, spick([-2.6, -0.5, 2.5, 0.6, 1.57]), sr(20, 28), spick(['#5cbc5a', '#4aa850', '#6cc864']));
      }
      for (const r of rocks) if (r.w > r.h) for (let x = r.x + 14; x < r.x + r.w - 14; x += sr(26, 60)) {
        if (srand() < 0.5) continue;
        const L = sr(10, 20), y0 = r.y + r.h - 6;
        ctx.strokeStyle = '#3f8a3c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + 4, y0 + L * 0.5, x + sr(-2, 3), y0 + L); ctx.stroke();
        for (let k = 4; k < L; k += 6) { ctx.fillStyle = k % 12 < 6 ? '#5cbc5a' : '#4aa850'; ellipse(x + (k % 12 < 6 ? 3 : -3), y0 + k, 3.6, 2.2, k % 12 < 6 ? 0.5 : -0.5); }
        if (srand() < 0.3) { ctx.fillStyle = '#ff8fc8'; circle(x, y0 + L + 1, 2.6); }
      }
      // a few mossy boulders sitting on the walls
      for (const r of rocks) if (srand() < 0.25) {
        const x = r.x + sr(10, r.w - 10), y = r.y + sr(4, r.h - 14);
        inkEllipse(x, y, 11, 8, 0, '#b6aa9a', 1.6, OL); ctx.fillStyle = '#d4cabc'; ellipse(x - 2, y - 2, 7, 4.5);
        ctx.fillStyle = '#7cc456'; ellipse(x + 2, y - 6, 6, 2.6);
      }
    } finally { ctx = old; }
    return c;
  }
  // outline every clump, then fill (dark underside, lit top, highlight, leaf veins, a flower here and there)
  function bushes(list) {
    ctx.strokeStyle = OL; ctx.lineWidth = 5;
    for (const k of list) { ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, 7); ctx.stroke(); }
    for (const k of list) { ctx.fillStyle = shade(k.c[0], k.dk ? 0.35 : 0.15); circle(k.x, k.y, k.r); }
    for (const k of list) { ctx.fillStyle = k.dk ? shade(k.c[1], 0.25) : k.c[1]; circle(k.x - k.r * 0.12, k.y - k.r * 0.18, k.r * 0.8); }
    for (const k of list) {
      ctx.fillStyle = k.dk ? 'rgba(255,255,255,.07)' : 'rgba(255,255,230,.22)'; circle(k.x - k.r * 0.3, k.y - k.r * 0.4, k.r * 0.38);
      ctx.strokeStyle = 'rgba(25,80,35,.45)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(k.x - k.r * 0.5, k.y + k.r * 0.15); ctx.quadraticCurveTo(k.x, k.y - k.r * 0.25, k.x + k.r * 0.5, k.y + k.r * 0.25); ctx.stroke();
      if (k.fl) { ctx.fillStyle = spick(['#ff6fa8', '#ffe36b', '#ff9a4a', '#fff']); for (let i = 0; i < 5; i++) circle(k.x + Math.cos(i * 1.257) * 4, k.y + Math.sin(i * 1.257) * 4, 3.2); ctx.fillStyle = '#ffd23a'; circle(k.x, k.y, 2); }
    }
  }
  function fern(x, y, a, L, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const p = new Path2D();
    for (let i = 1; i < 8; i++) { const t = i / 8, w = (1 - t) * L * 0.32 + 2; p.ellipse(t * L, -w * 0.5, w * 0.62, 2.6, -0.7, 0, 7); p.ellipse(t * L, w * 0.5, w * 0.62, 2.6, 0.7, 0, 7); }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(p); ctx.fillStyle = col; ctx.fill(p);
    ctx.strokeStyle = shade(col, 0.35); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -3, L, 0); ctx.stroke();
    ctx.restore();
  }
  function pondArt(p) {
    const { x, y, rx, ry } = p;
    ctx.fillStyle = 'rgba(60,40,20,.2)'; ellipse(x + 2, y + 4, rx + 8, ry + 6);
    inkEllipse(x, y, rx + 5, ry + 4, 0, '#c9b08a', 2.2, OL);
    const wg = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    wg.addColorStop(0, '#5fb6d8'); wg.addColorStop(1, '#8fd6ec');
    ctx.fillStyle = wg; ellipse(x, y + 1, rx, ry);
    ctx.fillStyle = 'rgba(40,90,130,.25)'; ellipse(x, y - ry * 0.35, rx * 0.9, ry * 0.5);
    for (const [dx, dy, s] of [[-14, 4, 1], [16, -4, 0.8]]) {
      ctx.save(); ctx.translate(x + dx, y + dy);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 8 * s, 0.4, 6.0); ctx.closePath(); ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#6cc060'; ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ff9ccc'; for (let k = 0; k < 5; k++) circle(x - 14 + Math.cos(k * 1.257) * 2.6, y + 2 + Math.sin(k * 1.257) * 2.6, 2.2); ctx.fillStyle = '#ffe36b'; circle(x - 14, y + 2, 1.4);
    // reeds and stepping stones round the edge
    for (const [dx, h] of [[-rx - 2, 22], [-rx + 6, 16], [rx - 4, 20]]) {
      ctx.strokeStyle = '#4f9a3c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + dx, y + 2); ctx.lineTo(x + dx + 2, y - h); ctx.stroke();
      inkEllipse(x + dx + 2, y - h + 2, 2.4, 5.5, 0, '#8a5a32', 0.7);
    }
    for (const a of [0.6, 2.3, 3.6]) inkEllipse(x + Math.cos(a) * (rx + 4), y + Math.sin(a) * (ry + 3), 5.5, 3.6, 0, '#bdb3a4', 0.8);
  }
  function streamArt() {
    const y0 = WH + 30, pts = [];
    for (let x = -M; x <= WW + M; x += 30) pts.push([x, y0 + Math.sin(x * 0.012) * 6 + Math.sin(x * 0.031) * 3]);
    const band = (w) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineWidth = w; ctx.stroke(); };
    ctx.strokeStyle = OL; band(52); ctx.strokeStyle = '#c9b08a'; band(46); ctx.strokeStyle = '#4aa6cc'; band(36); ctx.strokeStyle = '#6cc4e4'; band(24);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    for (let x = -M; x < WW + M; x += sr(30, 70)) { const y = y0 + Math.sin(x * 0.012) * 6 + sr(-8, 8); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 3, x + 18, y); ctx.stroke(); }
    for (let x = -M; x < WW + M; x += sr(60, 140)) inkEllipse(x, y0 + sr(-10, 10), sr(6, 10), sr(4, 6), 0, '#bdb3a4', 1);
  }
  // tree crowns overhanging the walls (drawn over everyone, see drawCanopy)
  function crownSprite(v) {
    return sprite('dd_crown' + v, 150, 150, 75, 75, () => {
      const r = 50;
      if (v === 0) { // a palm
        const ps = [];
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * 6.28 + (i % 2) * 0.15, L = r * (i % 2 ? 1.25 : 1.4);
          const p = new Path2D(); p.moveTo(0, 0);
          p.quadraticCurveTo(Math.cos(a - 0.35) * L * 0.6, Math.sin(a - 0.35) * L * 0.6, Math.cos(a) * L, Math.sin(a) * L);
          p.quadraticCurveTo(Math.cos(a + 0.35) * L * 0.6, Math.sin(a + 0.35) * L * 0.6, 0, 0); ps.push([p, a, L]);
        }
        ctx.strokeStyle = OL; ctx.lineWidth = 4; for (const [p] of ps) ctx.stroke(p);
        ps.forEach(([p, a, L], i) => {
          ctx.fillStyle = i % 2 ? '#56b85c' : '#45a24f'; ctx.fill(p);
          ctx.strokeStyle = 'rgba(30,90,40,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * L * 0.92, Math.sin(a) * L * 0.92); ctx.stroke();
          ctx.strokeStyle = 'rgba(200,255,170,.35)'; ctx.lineWidth = 1;
          for (let k = 0.3; k < 0.9; k += 0.15) { const bx = Math.cos(a) * L * k, by = Math.sin(a) * L * k; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + 0.9) * 7, by + Math.sin(a + 0.9) * 7); ctx.stroke(); }
        });
        inkCircle(0, 0, 8, '#a0703c', 2, OL); ctx.fillStyle = '#c89050'; circle(-2, -2, 3.5);
        for (const [cx, cy] of [[6, 6], [-6, 7], [0, 10]]) inkCircle(cx, cy, 4.5, '#8a5a2c', 1, OL);
      } else if (v === 1) { // a cycad: lots of stiff, narrow, dark fronds
        const ps = [];
        for (let i = 0; i < 11; i++) {
          const a = i / 11 * 6.28, L = r * (i % 2 ? 1.0 : 1.15), n = { x: -Math.sin(a), y: Math.cos(a) };
          const p = new Path2D(); p.moveTo(0, 0);
          for (let k = 0.15; k <= 1.001; k += 0.1) { const w = (1 - k) * 11 + 2, bx = Math.cos(a) * L * k, by = Math.sin(a) * L * k; p.lineTo(bx + n.x * w, by + n.y * w); p.lineTo(bx + Math.cos(a) * 4 + n.x * 2, by + Math.sin(a) * 4 + n.y * 2); }
          p.lineTo(Math.cos(a) * L, Math.sin(a) * L);
          for (let k = 1; k >= 0.15; k -= 0.1) { const w = (1 - k) * 11 + 2, bx = Math.cos(a) * L * k, by = Math.sin(a) * L * k; p.lineTo(bx + Math.cos(a) * 4 - n.x * 2, by + Math.sin(a) * 4 - n.y * 2); p.lineTo(bx - n.x * w, by - n.y * w); }
          p.closePath(); ps.push([p, a, L]);
        }
        ctx.strokeStyle = OL; ctx.lineWidth = 3.5; for (const [p] of ps) ctx.stroke(p);
        ps.forEach(([p, a, L], i) => {
          ctx.fillStyle = i % 2 ? '#4a9e4c' : '#3a8a44'; ctx.fill(p);
          ctx.strokeStyle = 'rgba(200,255,170,.4)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * L * 0.95, Math.sin(a) * L * 0.95); ctx.stroke();
        });
        inkCircle(0, 0, 9, '#c89a50', 2, OL);
        ctx.fillStyle = '#e8b860'; for (let k = 0; k < 6; k++) circle(Math.cos(k) * 4, Math.sin(k) * 4, 2.4);
      } else { // a leafy tree crown
        const bl = [];
        for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; bl.push([Math.cos(a) * 30, Math.sin(a) * 26, 22]); }
        bl.push([0, 0, 30], [-8, -10, 20]);
        ctx.strokeStyle = OL; ctx.lineWidth = 5; for (const [x, y, rr] of bl) { ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.stroke(); }
        for (const [x, y, rr] of bl) { ctx.fillStyle = '#2f8a44'; circle(x, y, rr); }
        for (const [x, y, rr] of bl) { ctx.fillStyle = '#48a858'; circle(x - rr * 0.15, y - rr * 0.2, rr * 0.78); }
        for (const [x, y, rr] of bl) { ctx.fillStyle = 'rgba(255,255,220,.18)'; circle(x - rr * 0.3, y - rr * 0.4, rr * 0.36); }
        ctx.fillStyle = '#ff7a8a'; for (const [x, y] of [[-20, 10], [18, -16], [26, 14], [-4, 24], [-28, -14]]) { circle(x, y, 3.6); ctx.fillStyle = '#fff'; circle(x - 1, y - 1, 1.1); ctx.fillStyle = '#ff7a8a'; }
      }
    });
  }

  // outline every shape first, then fill them, so overlapping parts read as one body
  const E2 = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; };
  function body(parts, lw) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of parts) ctx.stroke(p);
    for (const [p, f] of parts) { ctx.fillStyle = f; ctx.fill(p); }
  }
  // soft round shading over a set of shapes: lit from the top left, darker underneath
  function shadeOver(paths, y0, y1, x0 = -80, x1 = 80) {
    const all = new Path2D(); for (const p of paths) all.addPath(p);
    ctx.save(); ctx.clip(all);
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(40,20,60,0)'); gr.addColorStop(1, 'rgba(40,20,60,.26)');
    ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
  }
  function eye(x, y, r, look = 1, mood) {
    if (mood === 'sleep') { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.45; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0.2, Math.PI - 0.2); ctx.stroke(); return; }
    if (mood === 'dizzy') {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.95, r * 1.05, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = r * 0.25; ctx.stroke();
      ctx.lineWidth = r * 0.3; ctx.beginPath(); for (let a = 0; a < 9; a += 0.5) ctx.lineTo(x + Math.cos(a + S.t * 8) * a * r * 0.1, y + Math.sin(a + S.t * 8) * a * r * 0.1); ctx.stroke(); return;
    }
    if (mood === 'happy' || mood === 'eat') { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.45; ctx.beginPath(); ctx.arc(x, y + r * 0.3, r * 0.75, Math.PI + 0.3, -0.3); ctx.stroke(); return; }
    const blink = !mood && ((S.t * 0.9 + x * 0.01) % 3.3) < 0.1;
    if (blink) { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.4; ctx.beginPath(); ctx.moveTo(x - r * 0.8, y); ctx.lineTo(x + r * 0.8, y); ctx.stroke(); return; }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OL; ctx.lineWidth = r * 0.3;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.85, r, 0, 0, 7); ctx.stroke(); ctx.fill();
    const pr = mood === 'shock' ? r * 0.34 : r * 0.6;
    ctx.fillStyle = mood === 'shock' ? '#2a1840' : '#3a2050'; circle(x + look * r * 0.2, y + r * 0.08, pr);
    if (mood !== 'shock') { ctx.fillStyle = 'rgba(140,90,200,.6)'; circle(x + look * r * 0.2, y + r * 0.3, pr * 0.55); }
    ctx.fillStyle = '#fff'; circle(x + look * r * 0.2 - pr * 0.35, y - pr * 0.3, pr * 0.4);
  }

  // the baby (and his mama and papa) when js/pet.js isn't loaded: chubby mint stegosaurus, facing right, origin at his feet
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
      drawBabyDino(x, y - (o.lift || 0), 0.21, look, { facing: o.facing, mood: A_MOOD[o.mood] || o.mood, moving: o.walk, t: o.t, glow: o.glow });
    } else stego(x, y, BABY_S, o);
  }
  // mama and papa: big and gentle, with a warm glow (brighter once they've found their baby)
  function parentArt(p, papa) {
    const win = g.state === 'win', mood = win ? 'happy' : undefined, walk = p.walk && g.state === 'play';
    const gl = win ? 0.9 + 0.1 * Math.sin(S.t * 3) : 0.45 + 0.1 * Math.sin(S.t * 2 + (papa ? 1 : 0));
    glow(p.x + p.face * 10, p.y - 60, 120, 'rgba(255,230,160,.45)', 90);
    if (typeof drawBabyDino === 'function') {
      const pal = papa ? (typeof PAPA_PAL !== 'undefined' ? PAPA_PAL : DD_PAPA) : (typeof MAMA_PAL !== 'undefined' ? MAMA_PAL : DD_MAMA);
      drawBabyDino(p.x, p.y, papa ? 0.6 : 0.54, {}, { facing: p.face, grown: true, palette: pal, mood: mood ? 'joy' : undefined, moving: walk, t: S.t + (papa ? 1 : 0), glow: gl });
    } else stego(p.x, p.y, papa ? 2.6 : 2.3, { pal: papa ? DD_PAPA : DD_MAMA, facing: p.face, walk, lashes: !papa, flower: !papa, leaf: papa, mood });
    // a flower crown for mama, a leaf for papa: little touches so they read as family
    const hx = p.x + p.face * (papa ? 30 : 27), hy = p.y - (papa ? 132 : 119) - (walk ? Math.abs(Math.sin(S.t * 11)) * 3 : 0);
    if (!papa) for (let i = 0; i < 3; i++) { const fx = hx + p.face * (i - 1) * 9, fy = hy + Math.abs(i - 1) * 3; ctx.fillStyle = OL; for (let k = 0; k < 5; k++) circle(fx + Math.cos(k * 1.257) * 3.4, fy + Math.sin(k * 1.257) * 3.4, 3.2); ctx.fillStyle = ['#ff8fc8', '#ffe36b', '#c9a6ff'][i]; for (let k = 0; k < 5; k++) circle(fx + Math.cos(k * 1.257) * 3.4, fy + Math.sin(k * 1.257) * 3.4, 2.6); ctx.fillStyle = '#fff3a0'; circle(fx, fy, 1.8); }
  }

  // raptors, compies and dilophosaurs share a body plan: lean two-legged dinos, facing right, origin at the feet
  function biped(x, y, s, o) {
    const pal = o.pal, f = o.facing || 1, t = o.t, walk = o.walk, m = o.mood, kind = o.kind;
    const spd = o.run ? 20 : 15, ph = t * spd;
    const bob = walk ? Math.abs(Math.cos(ph)) * 3 : Math.sin(t * 3) * 0.6;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,30,20,.22)'; ellipse(0, 0, 24 * s, 6 * s);
    ctx.translate(0, -(o.lift || 0)); ctx.scale(s * f, s);
    if (o.wob) ctx.rotate(Math.sin(t * 25) * 0.08);
    if (o.run) ctx.rotate(0.1);
    ctx.translate(0, -bob);
    const lw = Math.min(2.2, 1.4 / s * 1.1);
    if (o.frill > 0.05) {
      const fr = 6 + o.frill * 16;
      ctx.save(); ctx.translate(26, -56);
      const fp = new Path2D(); for (let a = 0; a <= 6.3; a += 0.42) { const rr = a % 0.84 < 0.42 ? fr : fr * 0.8; fp.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } fp.closePath();
      ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.stroke(fp); ctx.fillStyle = pal.frill; ctx.fill(fp);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(-fr * 0.3, -fr * 0.3, fr * 0.35);
      ctx.strokeStyle = pal.crest; ctx.lineWidth = 2; for (let a = 0; a < 6.28; a += 0.6) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); ctx.lineTo(Math.cos(a) * fr * 0.85, Math.sin(a) * fr * 0.85); ctx.stroke(); }
      ctx.restore();
    }
    // tail sways; legs swing, lifting the foot as it comes forward
    const sway = walk ? Math.sin(ph) * 0.1 : Math.sin(t * 2.2) * 0.07;
    const tail = new Path2D();
    tail.addPath(new Path2D('M-12,-42 C-30,-46 -50,-54 -68,-52 C-62,-48 -54,-42 -46,-38 C-34,-32 -22,-29 -10,-28 Z'),
      new DOMMatrix().translateSelf(-12, -36).rotateSelf(sway * 57.3).translateSelf(12, 36));
    const leg = (hx, p, lift) => {
      const fx = hx + 3 + (walk ? Math.sin(p) * 10 : 0), fy = walk ? -Math.max(0, Math.cos(p)) * lift : 0;
      const kx = (hx + fx) / 2 + 6, ky = -14 + fy * 0.4;
      return new Path2D(`M${hx - 7},-30 C${hx - 8},-20 ${kx - 4},${ky - 4} ${kx - 3},${ky} L${fx - 4},${fy - 4} L${fx - 6},${fy} L${fx + 9},${fy} C${fx + 10},${fy - 3} ${fx + 7},${fy - 4} ${fx + 4},${fy - 4} L${kx + 4},${ky - 2} C${kx + 6},${ky - 8} ${hx + 7},-22 ${hx + 6},-30 Z`);
    };
    const farLeg = leg(-6, ph + Math.PI, 6), nearLeg = leg(2, ph, 6);
    const torso = E2(0, -35, 22, 13, -0.12), thigh = E2(-2, -30, 9.5, 12, 0.25);
    const neck = new Path2D('M8,-42 C12,-52 16,-58 21,-62 L31,-55 C25,-49 22,-42 19,-33 Z');
    const head = E2(28, -60, 12.5, 9, -0.1), snout = E2(39, -56, 10, 6, 0.08);
    const farArm = new Path2D('M12,-34 C17,-30 20,-28 23,-26 L21,-23 C17,-25 13,-28 10,-30 Z');
    const parts = [[farArm, pal.dark], [tail, pal.body], [farLeg, pal.dark], [neck, pal.body], [torso, pal.body], [thigh, pal.body], [nearLeg, pal.body], [head, pal.body], [snout, pal.body]];
    if (kind === 'dilo') parts.unshift([new Path2D('M18,-64 C18,-76 26,-80 30,-76 C30,-72 28,-68 26,-64 Z'), pal.crest], [new Path2D('M26,-64 C28,-78 36,-80 39,-74 C38,-70 35,-66 32,-62 Z'), pal.crest]);
    if (kind === 'raptor') parts.unshift([new Path2D('M18,-66 C14,-74 18,-80 22,-76 C22,-82 28,-82 28,-74 C32,-78 36,-74 31,-68 Z'), pal.crest],
      [new Path2D('M-60,-54 C-70,-60 -76,-56 -72,-50 C-78,-48 -74,-42 -66,-46 Z'), pal.crest]);
    body(parts, lw);
    shadeOver([tail, torso, thigh, neck, head, snout], -72, -18, -80, 60);
    // belly, stripes and spots, kept inside the body
    ctx.save(); const bp = new Path2D(); bp.addPath(torso); bp.addPath(neck); bp.addPath(thigh); ctx.clip(bp);
    ctx.fillStyle = pal.belly; ellipse(8, -24, 18, 8, -0.12); ellipse(18, -40, 5, 10, -0.5);
    ctx.restore();
    ctx.save(); const sp = new Path2D(); sp.addPath(torso); sp.addPath(tail); ctx.clip(sp);
    ctx.strokeStyle = pal.stripe; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    for (const sx of [-30, -20, -10, 0, 9]) { ctx.beginPath(); ctx.moveTo(sx, -50); ctx.lineTo(sx + 3, -41); ctx.stroke(); }
    ctx.restore();
    if (kind === 'compy') { ctx.fillStyle = pal.stripe; for (const [sx, sy] of [[-8, -40], [2, -43], [-16, -38], [10, -39]]) circle(sx, sy, 1.8); }
    if (kind !== 'dilo' && kind !== 'raptor') { ctx.fillStyle = OL; for (const [cx, cy, r] of [[22, -66, 4.2], [27, -67.5, 3.6], [17.5, -63, 3.1]]) circle(cx, cy, r); ctx.fillStyle = pal.crest; for (const [cx, cy, r] of [[22, -66, 3.5], [27, -67.5, 3], [17.5, -63, 2.4]]) circle(cx, cy, r); }
    // near arm with little claws
    ctx.strokeStyle = OL; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(12, -32); ctx.quadraticCurveTo(19, -28 - (walk ? Math.sin(ph) * 2 : 0), 23, -23); ctx.stroke();
    ctx.strokeStyle = pal.body; ctx.lineWidth = 2.2; ctx.stroke();
    // the face
    const eM = m === 'startle' ? 'shock' : m === 'grump' || m === 'sneaky' ? undefined : m;
    eye(31, -62, 4.6, 1, eM);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
    if (m === 'sneaky') {
      ctx.fillStyle = pal.body; ctx.beginPath(); ctx.ellipse(31, -63.5, 4.4, 3.4, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(26.5, -63.5); ctx.lineTo(35.5, -63.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, -69); ctx.quadraticCurveTo(31, -71, 36, -68); ctx.stroke();
    } else if (m === 'grump') {
      ctx.fillStyle = pal.body; ctx.beginPath(); ctx.ellipse(31, -63, 4.4, 3.2, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(26, -70); ctx.lineTo(36, -65); ctx.stroke();
    } else if (m === 'startle') { ctx.beginPath(); ctx.moveTo(26, -70); ctx.quadraticCurveTo(31, -73, 36, -70); ctx.stroke(); }
    ctx.fillStyle = OL; circle(46, -59, 1.1);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.beginPath();
    if (m === 'startle') { ctx.fillStyle = '#c84a6a'; ctx.ellipse(42, -52.5, 3, 3.6, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    else if (m === 'happy') { ctx.arc(40, -55, 4.4, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else if (m === 'eat') { const ch = Math.sin(t * 14) * 1.5; ctx.ellipse(41, -53 + ch * 0.3, 3.5, 2 + Math.abs(ch), 0, 0, 7); ctx.fillStyle = '#c84a6a'; ctx.fill(); ctx.stroke(); }
    else if (m === 'grump') { ctx.moveTo(35, -51); ctx.quadraticCurveTo(41, -54, 47, -52); ctx.stroke(); }
    else { ctx.moveTo(33, -53); ctx.quadraticCurveTo(40, -50, 47, -56); ctx.stroke(); }
    if (m !== 'happy' && m !== 'startle' && m !== 'eat') { ctx.fillStyle = '#fff'; tri(37, -52.2, 39.4, -52, 38.2, -49.4); tri(42, -52.6, 44.2, -53, 43.2, -50.4); }
    if (m === 'happy' || m === 'eat' || m === 'sneaky') { ctx.fillStyle = 'rgba(255,120,150,.5)'; ellipse(32, -55, 3.6, 2.2); }
    ctx.restore();
  }
  function ptero(x, y, z, s, o) {
    const f = o.facing || 1, t = o.t, flap = Math.sin(t * (o.fast ? 16 : 7));
    ctx.fillStyle = 'rgba(40,30,20,.2)'; ellipse(x, y, 40 * s * (1 - z / 220), 8 * s * (1 - z / 260));
    ctx.save(); ctx.translate(x, y - z - 30 * s); ctx.scale(s * f, s);
    if (o.wob) ctx.rotate(Math.sin(t * 25) * 0.1);
    if (o.fast) ctx.rotate(0.12);
    const lw = 1.6;
    const wing = d => { const tip = -26 * flap * d; const p = new Path2D(); p.moveTo(-4, -6); p.quadraticCurveTo(-20, -22 + tip * 0.5, -52, -8 + tip); p.quadraticCurveTo(-40, -2 + tip * 0.5, -36, 2 + tip * 0.2); p.quadraticCurveTo(-26, -1, -18, 4); p.quadraticCurveTo(-8, 6, 6, 2); p.closePath(); return p; };
    const wf = wing(-0.6), wn = wing(1);
    body([[wf, '#d87a4c']], lw);
    const crest = new Path2D('M10,-16 C2,-26 -10,-32 -18,-32 C-10,-26 0,-20 8,-12 Z');
    const tor = E2(0, -2, 17, 8, -0.1), hd = E2(16, -13, 8.5, 7), beak = new Path2D('M20,-16 C30,-15 40,-11 47,-8 C38,-6 28,-6 20,-8 Z');
    const parts = [[crest, '#ff7a6a'], [tor, '#ffb27a'], [hd, '#ffb27a'], [beak, '#ffd36b'], [wn, '#ff9a6a']];
    body(parts, lw);
    shadeOver([tor, hd], -22, 8, -30, 40);
    // the wing's finger bone and membrane folds
    const tip = -26 * flap;
    ctx.save(); ctx.clip(wn);
    const wg = ctx.createLinearGradient(0, -20 + tip, 0, 6); wg.addColorStop(0, 'rgba(255,220,180,.35)'); wg.addColorStop(1, 'rgba(160,60,40,.25)');
    ctx.fillStyle = wg; ctx.fillRect(-60, -50, 70, 60);
    ctx.restore();
    ctx.strokeStyle = 'rgba(150,60,40,.55)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.quadraticCurveTo(-20, -22 + tip * 0.5, -50, -8 + tip); ctx.stroke();
    for (const k of [0.4, 0.65]) { ctx.beginPath(); ctx.moveTo(-52 * k, -10 * k + tip * k * 0.7); ctx.lineTo(-30 * k, 4); ctx.stroke(); }
    ctx.fillStyle = '#fff1d6'; ellipse(4, 2, 9, 3.5, -0.1);
    eye(17, -15, 3.8, 1, o.mood === 'startle' ? 'shock' : o.mood === 'grump' ? undefined : o.mood);
    if (o.mood === 'sneaky' || o.mood === 'grump') { ctx.fillStyle = '#ffb27a'; ctx.beginPath(); ctx.ellipse(17, -16, 3.8, 2.6, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(13, -16); ctx.lineTo(21, -16); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(160,100,30,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(22, -10.5); ctx.lineTo(44, -8.5); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, 5); ctx.lineTo(-6, 12); ctx.lineTo(-9, 13); ctx.moveTo(2, 5); ctx.lineTo(1, 12); ctx.lineTo(4, 13); ctx.stroke();
    ctx.restore();
  }
  function trex(x, y, s, o) {
    const f = o.facing || 1, t = o.t, m = o.mood, walk = o.walk;
    const ph = t * 8, sw = walk ? Math.sin(ph) * 6 : 0, breathe = Math.sin(t * 2) * 1.5, roar = o.roar || 0;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,30,20,.26)'; ellipse(0, 0, 62 * s, 14 * s);
    ctx.translate(0, -(o.lift || 0) - (walk ? Math.abs(Math.cos(ph)) * 3 : 0)); ctx.scale(s * f, s);
    if (o.wob) ctx.rotate(Math.sin(t * 22) * 0.04);
    if (m === 'sleep') { ctx.translate(0, 26); ctx.rotate(-0.05); }
    const lw = 2;
    const jaw = roar > 0 ? 0.35 + Math.sin(t * 30) * 0.05 : m === 'happy' ? 0.08 : 0;
    const sway = Math.sin(t * 1.6) * 0.06 + (walk ? Math.sin(ph) * 0.05 : 0);
    const tail = new Path2D();
    tail.addPath(new Path2D('M-30,-78 C-60,-86 -96,-80 -120,-62 C-110,-60 -96,-58 -84,-56 C-64,-52 -48,-48 -30,-46 Z'),
      new DOMMatrix().translateSelf(-30, -62).rotateSelf(sway * 57.3).translateSelf(30, 62));
    const footF = E2(10 - sw, -8, 17, 7.5), legF = E2(4, -34, 15, 22, -0.1);
    const torso = E2(-4, -68 + breathe, 42, 33, -0.2), footN = E2(-18 + sw, -8, 18, 7.5), thigh = E2(-16, -40, 20, 26, 0.15);
    const lowJaw = new Path2D(`M18,-92 C32,${-90 + jaw * 30} 64,${-86 + jaw * 40} 72,${-80 + jaw * 44} C62,${-70 + jaw * 40} 32,${-72 + jaw * 20} 14,-80 Z`);
    const hd = E2(40, -106, 34, 21, -0.08), brow = E2(44, -122, 12, 6, -0.2);
    const arm = new Path2D(`M28,-66 C36,${-62 + Math.sin(t * 5) * 2} 42,${-58 + Math.sin(t * 5) * 3} 44,${-52 + Math.sin(t * 5) * 3} L39,-52 C36,-56 32,-58 26,-60 Z`);
    const parts = [[tail, '#e8964a'], [footF, '#c86e28'], [legF, '#d07a30'], [torso, '#f0a050'], [footN, '#f0a050'], [thigh, '#f0a050'], [lowJaw, '#e8964a'], [hd, '#f0a050'], [brow, '#f0a050'], [arm, '#f0a050']];
    body(parts, lw);
    shadeOver([tail, torso, thigh, hd, brow], -132, -6, -130, 90);
    ctx.save(); ctx.clip(torso); ctx.fillStyle = '#fff1d6'; ellipse(14, -54 + breathe, 26, 20, -0.2);
    ctx.strokeStyle = 'rgba(200,150,100,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 8, -40 + i * 2); ctx.lineTo(4 + i * 8, -72 + i * 2); ctx.stroke(); }
    ctx.restore();
    ctx.save(); const sp = new Path2D(); sp.addPath(torso); sp.addPath(tail); sp.addPath(hd); ctx.clip(sp);
    ctx.strokeStyle = '#c8702a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const [sx, sy] of [[-70, -78], [-52, -84], [-34, -90], [-16, -98], [0, -100], [22, -126], [36, -128]]) { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 5, sy + 12); ctx.stroke(); }
    ctx.restore();
    // claws on the feet
    ctx.fillStyle = '#fff6e6'; for (const fx of [-6 + sw, 2 + sw, 10 + sw]) { ctx.beginPath(); ctx.arc(fx, -4, 2.8, 0, 7); ctx.fill(); }
    // teeth, a mouth that opens when he roars
    if (jaw > 0.05) { ctx.fillStyle = '#b8384a'; ctx.beginPath(); ctx.ellipse(48, -82 + jaw * 14, 18, 3 + jaw * 16, 0.1, 0, 7); ctx.fill(); ctx.fillStyle = '#ff8090'; ellipse(48, -78 + jaw * 20, 9, 3 + jaw * 5); }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OL; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(34 + i * 8, -88); ctx.lineTo(38 + i * 8, -88); ctx.lineTo(36 + i * 8, -82); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (jaw > 0.05) for (let i = 0; i < 4; i++) { const yy = -78 + jaw * 30 + i * 0.5; ctx.beginPath(); ctx.moveTo(36 + i * 8, yy); ctx.lineTo(40 + i * 8, yy); ctx.lineTo(38 + i * 8, yy - 5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    eye(50, -110, 7, 1, m === 'sleep' ? 'sleep' : m === 'dizzy' ? 'dizzy' : m === 'happy' ? 'happy' : roar > 0 ? 'shock' : undefined);
    if (!m || m === 'grump') { ctx.strokeStyle = OL; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(38, -124); ctx.lineTo(60, -116); ctx.stroke(); }
    if (m === 'happy') { ctx.fillStyle = 'rgba(255,120,140,.5)'; ellipse(56, -100, 7, 4); }
    ctx.fillStyle = OL; circle(70, -110, 2); circle(64, -112, 1.4);
    ctx.restore();
  }

  const MOODS = { startle: 'startle', flee: 'startle', blown: 'startle', stun: 'dizzy', sleep: 'sleep', sticky: 'grump', tangle: 'grump', confuse: 'dizzy', eat: 'eat', happy: 'happy', wobble: 'grump' };
  // little cartoon effects over a dino's head
  function zzz(x, y, t) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.7 + i / 3) % 1;
      ctx.globalAlpha = Math.sin(k * Math.PI);
      outlined('Z', x + 6 + k * 18 + Math.sin(k * 6) * 4, y - k * 30, 11 + k * 10, '#cfd8ff');
    }
    ctx.globalAlpha = 1;
  }
  function sweat(x, y, t) {
    for (const [dx, dy, a] of [[14, 0, 0.3], [-12, 4, -0.3]]) {
      const k = (t * 2 + dx) % 1;
      ctx.save(); ctx.translate(x + dx + Math.sign(dx) * k * 6, y + dy + k * 8); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(5, 1, 0, 4); ctx.quadraticCurveTo(-5, 1, 0, -6);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.stroke(); ctx.fillStyle = '#a8e0ff'; ctx.fill();
      ctx.fillStyle = '#fff'; circle(-1.2, 0, 1.2);
      ctx.restore();
    }
    // shock lines
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4;
    for (const a of [-2.4, -1.9, -1.4, -0.9]) { ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 18, y - 8 + Math.sin(a) * 14); ctx.lineTo(x + Math.cos(a) * 26, y - 8 + Math.sin(a) * 20); ctx.stroke(); }
  }
  function grumpCloud(x, y, t, a = 1) {
    ctx.globalAlpha = a;
    const p = new Path2D(); for (const [dx, dy, r] of [[-10, 0, 8], [0, -5, 10], [11, 0, 8], [0, 4, 8]]) p.ellipse(x + dx, y + dy, r, r * 0.85, 0, 0, 7);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(p); ctx.fillStyle = '#9a8fb0'; ctx.fill(p);
    ctx.strokeStyle = '#4a3a5a'; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let i = 0; i < 6; i++) ctx.lineTo(x - 9 + i * 3.6, y - 1 + (i % 2 ? -3 : 2) + Math.sin(t * 20 + i) * 0.6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function dust(x, y, t, n = 3, s = 1, dir = 1) {
    for (let i = 0; i < n; i++) {
      const k = (t * 3 + i / n) % 1;
      ctx.globalAlpha = 0.55 * (1 - k);
      ctx.fillStyle = '#f2e4c4'; circle(x - dir * (6 + k * 22) * s, y - 4 - k * 8 * s, (4 + k * 7) * s);
    }
    ctx.globalAlpha = 1;
  }
  function drawDino(e) {
    const K = e.K, st = e.st?.k, carrying = e.state === 'carry';
    const mood = st ? MOODS[st] : carrying ? 'sneaky' : e.state === 'leave' ? 'grump' : e.kind === 'trex' ? 'grump' : 'sneaky';
    const o = { facing: e.face, t: e.t, walk: e.moving, mood, wob: st === 'wobble' || st === 'tangle' || st === 'sticky', kind: e.kind, run: carrying || e.state === 'leave' };
    const fade = e.state === 'leave' ? clamp(1 - e.lt / (e.kind === 'trex' ? 2.2 : 1.4), 0, 1) : 1;
    if (st === 'happy') o.lift = Math.abs(Math.sin(e.t * 9)) * 10;
    // dust kicked up when running off (with the baby, or in a huff)
    if (e.moving && !K.fly && (o.run || st === 'flee' || st === 'blown')) dust(e.x, e.y, e.t, 3, e.kind === 'trex' ? 1.8 : K.s, e.face);
    ctx.globalAlpha = fade;
    if (st === 'sticky') {
      // standing in a honey puddle
      ctx.fillStyle = 'rgba(160,100,20,.45)'; ellipse(e.x, e.y + 1, 28 * K.s + 10, 9);
      ctx.fillStyle = '#f2b636'; ellipse(e.x, e.y - 1, 26 * K.s + 8, 7.5);
      ctx.fillStyle = 'rgba(255,240,170,.8)'; ellipse(e.x - 8, e.y - 3, 8, 2);
    }
    const carryBaby = lift => {
      ctx.save(); const bx = e.x - e.face * 3, by = e.y;
      ctx.translate(bx, by - lift); ctx.rotate(Math.sin(e.t * 16) * 0.22); ctx.translate(-bx, -(by - lift));
      babyArt(bx, by, { facing: -e.face, mood: 'shock', walk: true, t: e.t * 1.6, lift });
      ctx.restore();
      // he kicks and squirms
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2;
      for (const sgn of [-1, 1]) { const a = e.t * 9 + sgn; ctx.beginPath(); ctx.arc(bx + sgn * 30, by - lift - 22, 8, a, a + 1.4); ctx.stroke(); }
      sweat(bx, by - lift - 50, e.t);
    };
    if (e.kind === 'ptero') {
      // a carried baby dangles under its feet
      if (g.baby.held === e) { ctx.fillStyle = 'rgba(40,30,20,.15)'; ellipse(e.x, e.y + 4, 18, 5); }
      ptero(e.x, e.y, e.z, K.s, { ...o, fast: e.state === 'swoop' || carrying });
      if (g.baby.held === e) { ctx.save(); ctx.translate(e.x, e.y - e.z + 4); ctx.rotate(Math.sin(e.t * 12) * 0.2); babyArt(0, 34, { facing: -e.face, mood: 'shock', walk: true, t: e.t * 1.6 }); ctx.restore(); sweat(e.x, e.y - e.z - 4, e.t); }
      if (e.state === 'swoop') { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(e.x - e.face * (30 + i * 4), e.y - e.z - 40 + i * 10); ctx.lineTo(e.x - e.face * (60 + i * 8), e.y - e.z - 46 + i * 10); ctx.stroke(); } }
    } else if (e.kind === 'trex') trex(e.x, e.y, K.s, { ...o, roar: e.roar, mood: st === 'sleep' ? 'sleep' : st === 'stun' || st === 'confuse' ? 'dizzy' : st === 'happy' || st === 'eat' ? 'happy' : 'grump' });
    else {
      biped(e.x, e.y, K.s, { ...o, pal: K.pal, frill: e.frill || 0 });
      if (g.baby.held === e) carryBaby(e.kind === 'compy' ? 26 : 34 * K.s);
      if (carrying) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(e.x - e.face * (24 + i * 3), e.y - 30 + i * 9); ctx.lineTo(e.x - e.face * (48 + i * 6), e.y - 30 + i * 9); ctx.stroke(); } }
    }
    // what's happening to it, floating over its head
    const hx = e.x, hy = e.y - (e.z || 0) - K.h * K.s - 12, big = e.kind === 'trex';
    if (st === 'stun' || st === 'confuse') {
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(hx, hy, big ? 30 : 18, big ? 8 : 5, 0, 0, 7); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const a = e.t * 5 + i * 2.1, sx = hx + Math.cos(a) * (big ? 30 : 18), sy = hy + Math.sin(a) * (big ? 8 : 5);
        star(sx, sy, 8, OL, 5); star(sx, sy, 6.4, st === 'stun' ? '#ffe36b' : '#ff8fc8', 5);
      }
    }
    if (st === 'confuse') outlined('?', hx + 2 + Math.sin(e.t * 4) * 4, hy - 16, 20, '#fff');
    if (st === 'sleep') zzz(hx, hy, e.t);
    if (st === 'sticky') {
      const big2 = e.kind === 'trex' ? 2 : 1;
      for (let i = -1; i <= 1; i++) {
        const k = (e.t * 0.7 + i * 0.37 + 1) % 1, dx = e.x + i * 11 * K.s * big2, top = e.y - K.h * K.s * (i ? 0.38 : 0.5), len = 1 + k * 5 * big2;
        const blob = new Path2D(); blob.ellipse(dx, top, 7 * big2, 4 * big2, 0, 0, 7); blob.ellipse(dx + 2, top + len * 0.5 + 2, 1.8, len * 0.5 + 2, 0, 0, 7); blob.ellipse(dx + 2, top + len + 4, 2.4, 2.8, 0, 0, 7);
        ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.stroke(blob); ctx.fillStyle = '#f2b636'; ctx.fill(blob);
        ctx.fillStyle = 'rgba(255,250,200,.85)'; ellipse(dx - 2, top - 1.5, 2.4, 1.2); circle(dx + 1.4, top + len + 3, 0.9);
      }
    }
    if (st === 'tangle') {
      const r = 22 * K.s + 12, cy = e.y - (e.z || 0) - K.h * K.s * 0.5;
      ctx.save(); ctx.beginPath(); ctx.ellipse(e.x, cy, r, r * 1.05, 0, 0, 7); ctx.clip();
      ctx.strokeStyle = OL; ctx.lineWidth = 3.4;
      const mesh = () => { ctx.beginPath(); for (let i = -4; i <= 4; i++) { const w = Math.sin(e.t * 6 + i) * 2; ctx.moveTo(e.x + i * r / 3.2 - r + w, cy - r); ctx.quadraticCurveTo(e.x + i * r / 3.2, cy, e.x + i * r / 3.2 + r + w, cy + r); ctx.moveTo(e.x + i * r / 3.2 + r, cy - r); ctx.quadraticCurveTo(e.x + i * r / 3.2, cy, e.x + i * r / 3.2 - r, cy + r); } ctx.stroke(); };
      mesh(); ctx.strokeStyle = '#f4e8ff'; ctx.lineWidth = 1.6; mesh();
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, cy, r, r * 1.05, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#c9a6ff'; ctx.lineWidth = 1.8; ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3; inkCircle(e.x + Math.cos(a) * r, cy + Math.sin(a) * r * 1.05, 2.4, '#ff8fc8', 0.7); }
    }
    if (st === 'happy') for (let i = 0; i < 3; i++) { const k = (e.t * 0.9 + i / 3) % 1; ctx.globalAlpha = Math.sin(k * Math.PI); heart(hx - 14 + i * 14 + Math.sin(k * 8 + i) * 4, hy - k * 26, 13 + k * 5, OL); heart(hx - 14 + i * 14 + Math.sin(k * 8 + i) * 4, hy - k * 26 + 1, 10 + k * 5, ['#ff6fa8', '#ff9ccc', '#ff4f8f'][i]); }
    ctx.globalAlpha = 1;
    if (st === 'eat') { for (let i = 0; i < 3; i++) { const k = (e.t * 2 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#7b6cf0'; circle(hx + e.face * (14 + k * 10), hy + 18 + k * 14 - i * 3, 2.4); } ctx.globalAlpha = 1; }
    if (st === 'startle' || st === 'flee' || st === 'blown') sweat(hx, hy + 8, e.t);
    if (e.state === 'leave') grumpCloud(hx, hy - 6 - e.lt * 10, e.t, fade);
    // the T-Rex's grumpy meter
    if (e.kind === 'trex' && live(e) && e.state !== 'idle') {
      const w = 116, x = e.x - w / 2, y = e.y - K.h * K.s - 48, k = clamp(e.grump / K.grump, 0, 1);
      rrect(x - 26, y - 6, w + 32, 24, 12, 'rgba(48,24,72,.85)', '#fff', 2);
      rrect(x, y, w, 12, 6, 'rgba(255,255,255,.2)');
      const gb = ctx.createLinearGradient(x, 0, x + w, 0); gb.addColorStop(0, '#ffb05a'); gb.addColorStop(1, '#ff5a4a');
      if (k > 0) rrect(x, y, Math.max(12, w * k), 12, 6, gb);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; if (k > 0) rrect(x + 3, y + 2, Math.max(6, w * k - 6), 3, 1.5, 'rgba(255,255,255,.45)');
      emoji('😠', x - 13, y + 6, 15);
    }
  }

  // Aubrey: a soft shadow, a little walking bob, her leaf ready to swish
  function drawAub() {
    const A = g.aub;
    const frame = A.swing > 0 ? 'cast' : A.moving ? ['run1', 'run2', 'run3', 'run4', 'run5'][Math.floor(A.step * 11) % 5] : 'idle_front';
    const bob = A.moving ? Math.abs(Math.sin(A.step * 11)) * 3 : 0;
    ctx.fillStyle = 'rgba(40,20,60,.16)'; ellipse(A.x + 3, A.y + 10, 26, 8);
    if (g.shieldT > 0) shieldBubble(A, true);
    drawAubrey(A.x, A.y + 10, frame, A.face, bob, AUB_S);
    if (A.goo > 0) {
      ctx.globalAlpha = Math.min(1, A.goo * 2);
      ctx.fillStyle = OL; ellipse(A.x, A.y + 8, 24, 8.5); ctx.fillStyle = '#9ce86a'; ellipse(A.x, A.y + 8, 22, 7);
      ctx.fillStyle = '#c8ff9a'; ellipse(A.x - 6, A.y + 6, 7, 2.2);
      for (const dx of [-12, 0, 12]) { const k = (S.t * 1.5 + dx * 0.05) % 1; inkEllipse(A.x + dx, A.y - 4 + k * 8, 3.4, 5, 0, '#9ce86a', 0.8); }
      ctx.globalAlpha = 1;
    }
    if (A.swing > 0) {
      // a big swishy leaf, with a wind trail and a few torn bits of leaf
      const k = 1 - A.swing / 0.32, a0 = A.face > 0 ? -1.3 : Math.PI - 1.3, a = (-1.3 + k * 2.6) * A.face;
      const cx = A.x, cy = A.y - 40;
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(220,255,200,${0.5 * (1 - k) * (1 - i * 0.28)})`; ctx.lineWidth = 12 - i * 3;
        ctx.beginPath(); ctx.arc(cx, cy, 72 + i * 14, a0 + (A.face > 0 ? 0 : 0), a0 + (A.face > 0 ? k * 2.6 : k * 2.6)); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 70, a0, a0 + k * 2.6); ctx.stroke();
      ctx.save(); ctx.translate(A.x + A.face * 12, A.y - 52); ctx.rotate(a + (A.face < 0 ? Math.PI : 0));
      ctx.scale(1, A.face);
      ink(BIG_LEAF, '#5cc060', 1.8, OL);
      ctx.save(); ctx.clip(BIG_LEAF); ctx.fillStyle = 'rgba(255,255,220,.3)'; ellipse(26, -8, 26, 7); ctx.restore();
      ctx.strokeStyle = '#3a8a40'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(52, 0); for (let v = 12; v < 46; v += 10) { ctx.moveTo(v, 0); ctx.lineTo(v + 7, -7); ctx.moveTo(v, 0); ctx.lineTo(v + 7, 7); } ctx.stroke();
      ctx.restore();
    }
  }
  const BIG_LEAF = P2('M0,0 C8,-16 30,-22 56,-2 C30,18 8,14 0,0 Z');
  function shieldBubble(A, back) {
    const a = Math.min(1, g.shieldT) * (0.8 + 0.12 * Math.sin(S.t * 8)), x = A.x, y = A.y - 40, r = 80 + Math.sin(S.t * 3) * 3;
    ctx.globalAlpha = a;
    if (back) {
      const sg = ctx.createRadialGradient(x - 20, y - 26, 10, x, y, r);
      sg.addColorStop(0, 'rgba(255,255,255,.08)'); sg.addColorStop(0.75, 'rgba(160,230,255,.22)'); sg.addColorStop(0.95, 'rgba(200,170,255,.5)'); sg.addColorStop(1, 'rgba(255,255,255,.75)');
      ctx.fillStyle = sg; circle(x, y, r);
    } else {
      // a rainbow rim, a shine and a few sparkles drifting round
      ctx.lineWidth = 3;
      ['rgba(255,140,180,.55)', 'rgba(255,230,120,.5)', 'rgba(140,230,255,.6)'].forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x, y, r - i * 3, S.t * 0.8 + i, S.t * 0.8 + i + 4.4); ctx.stroke(); });
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r - 12, -2.6, -1.9); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(x - r * 0.5, y - r * 0.32, 4);
      for (let i = 0; i < 5; i++) { const q = S.t * 1.3 + i * 1.26; star(x + Math.cos(q) * r * 0.92, y + Math.sin(q) * r * 0.92, 5 + Math.sin(S.t * 6 + i) * 2, '#ffffff', 4); }
    }
    ctx.globalAlpha = 1;
  }

  // a pretty ribbon leash, sagging a little, with a bow at his collar
  function drawLeash() {
    const A = g.aub, B = g.baby;
    if (B.held || g.state === 'win') return;
    const hx = A.x + A.face * 14, hy = A.y - 42, bx = B.x + B.face * 10, by = B.y - 22;
    const d = Math.hypot(bx - hx, by - hy), sag = clamp(40 - d * 0.25, 4, 26);
    const mx = (hx + bx) / 2, my = Math.max(hy, by) + sag;
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
    ctx.strokeStyle = '#ff6fa8'; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,240,.9)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);
    // bow
    ctx.save(); ctx.translate(bx, by);
    const bow = new Path2D('M0,0 C-6,-7 -11,-5 -10,0 C-11,5 -6,7 0,0 Z M0,0 C6,-7 11,-5 10,0 C11,5 6,7 0,0 Z');
    ink(bow, '#ff6fa8', 1.2, OL); inkCircle(0, 0, 2.6, '#ff9ccc', 0.8);
    ctx.restore();
    inkCircle(hx, hy, 3, '#ff9ccc', 0.8);
  }

  // canopy crowns over the walls; they turn see-through when Aubrey or a snatcher is under them
  function drawCanopy(view) {
    const A = g.aub, B = g.baby;
    for (const t of CANOPY) {
      if (t.x < view.x - 90 || t.x > view.x + W + 90 || t.y < view.y - 90 || t.y > view.y + H + 90) continue;
      const near = Math.min(Math.hypot(t.x - A.x, t.y - A.y + 40), Math.hypot(t.x - B.x, t.y - B.y + 30), B.held ? Math.hypot(t.x - B.held.x, t.y - B.held.y + 30) : 1e9);
      ctx.globalAlpha = near < 110 ? 0.4 + 0.5 * clamp((near - 50) / 60, 0, 1) : 0.95;
      const sw = Math.sin(S.t * 0.9 + t.ph) * 0.04;
      ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(sw); blit(crownSprite(t.v), 0, 0, t.s); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  // gentle life in the jungle: sun dapples, butterflies (world), and the nest's warm glow
  function atmosphereWorld(view) {
    if (!DAPPLE.length) {
      seed = 777;
      for (let i = 0; i < 90; i++) DAPPLE.push({ x: sr(0, WW), y: sr(0, WH), r: sr(40, 80), ph: sr(0, 6) });
      for (let i = 0; i < 26; i++) FLUTTER.push({ x: sr(80, WW - 80), y: sr(80, WH - 80), ph: sr(0, 6), c: spick([['#ffb3e0', '#ff6fa8'], ['#fff3a0', '#f0b020'], ['#b8e6ff', '#5aa8ff'], ['#d8c4ff', '#9a70e0']]) });
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const d of DAPPLE) {
      if (d.x < view.x - 90 || d.x > view.x + W + 90 || d.y < view.y - 90 || d.y > view.y + H + 90) continue;
      const k = 0.65 + 0.35 * Math.sin(S.t * 0.8 + d.ph);
      glow(d.x + Math.sin(S.t * 0.5 + d.ph) * 8, d.y, d.r * k, 'rgba(255,240,180,.16)', d.r * 0.6 * k);
    }
    ctx.globalCompositeOperation = 'source-over';
    // the nest glows warm and golden, with motes floating up
    const nx = WW - C, ny = C;
    if (nx > view.x - 300 && ny < view.y + H + 300) {
      ctx.globalCompositeOperation = 'lighter';
      glow(nx, ny, 210 + Math.sin(S.t * 2) * 12, 'rgba(255,214,120,.22)', 140);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 14; i++) {
        const k = (S.t * 0.25 + i / 14) % 1, x = nx + Math.sin(i * 2.4) * 120 + Math.sin(S.t + i) * 8, y = ny + 50 - k * 160;
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9; star(x, y, 3 + (i % 3), i % 2 ? '#fff6b0' : '#ffd0e8', 4);
      }
      ctx.globalAlpha = 1;
    }
  }
  function butterflies(view) {
    for (const b of FLUTTER) {
      const x = b.x + Math.sin(S.t * 0.6 + b.ph) * 70 + Math.sin(S.t * 1.7 + b.ph) * 16, y = b.y + Math.cos(S.t * 0.45 + b.ph) * 50 - 30;
      if (x < view.x - 40 || x > view.x + W + 40 || y < view.y - 40 || y > view.y + H + 40) continue;
      const fl = Math.abs(Math.sin(S.t * 14 + b.ph)), dir = Math.cos(S.t * 0.6 + b.ph) > 0 ? 1 : -1;
      ctx.fillStyle = 'rgba(40,30,20,.12)'; ellipse(x, y + 40, 5, 2);
      ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
      for (const s of [-1, 1]) {
        ctx.save(); ctx.scale(s * (0.3 + 0.7 * fl), 1);
        const w = new Path2D('M0,0 C4,-10 12,-11 11,-3 C10,1 4,1 0,0 Z M0,0 C4,2 9,4 7,8 C5,10 1,6 0,0 Z');
        ink(w, b.c[0], 0.9, OL); ctx.fillStyle = b.c[1]; circle(7, -5, 1.8);
        ctx.restore();
      }
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 5); ctx.stroke();
      ctx.restore();
    }
  }
  // screen-space: drifting leaves and a soft vignette
  let VIG = null;
  function atmosphereScreen(warm) {
    for (let i = 0; i < 9; i++) {
      const k = (S.t * (0.05 + (i % 3) * 0.015) + i / 9) % 1;
      const x = ((i * 137) % W) + Math.sin(S.t * 1.2 + i) * 40 - k * 120 + 60, y = -20 + k * (H + 40);
      ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 1.5 + i); ctx.scale(0.6, 0.6 * Math.cos(S.t * 2 + i));
      ctx.globalAlpha = 0.85; ink(LEAF_S, ['#8ccf5a', '#e8b04a', '#6cbc50', '#f09a50'][i % 4], 1.4, OL);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (!VIG) {
      VIG = document.createElement('canvas'); VIG.width = W; VIG.height = H;
      const x = VIG.getContext('2d'), gr = x.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.68);
      gr.addColorStop(0, 'rgba(20,40,20,0)'); gr.addColorStop(1, 'rgba(20,40,20,.42)');
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
    }
    ctx.drawImage(VIG, 0, 0, W, H);
    if (warm) { ctx.fillStyle = `rgba(255,210,140,${0.12 * warm})`; ctx.fillRect(0, 0, W, H); }
  }

  function drawWorld() {
    const A = g.aub, B = g.baby;
    if (!BG) BG = paintBG();
    const view = { x: g.cam.x, y: g.cam.y };
    // only the part of the painted canyon that's on screen
    const sx = clamp(view.x - 20 + M, 0, WW + 2 * M), sy = clamp(view.y - 20 + M, 0, WH + 2 * M);
    const sw = Math.min(W + 40, WW + 2 * M - sx), sh = Math.min(H + 40, WH + 2 * M - sy);
    if (sw > 0 && sh > 0) ctx.drawImage(BG, sx * DPR, sy * DPR, sw * DPR, sh * DPR, sx - M, sy - M, sw, sh);
    // ponds glint
    for (const p of PONDS) for (let i = 0; i < 3; i++) { const k = Math.sin(S.t * 2 + i * 2 + p.x); if (k > 0.3) star(p.x - 16 + i * 14, p.y - 6 + (i % 2) * 8, 3 * k, '#fff', 4); }
    // the stream ripples
    if (view.y + H > WH) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; for (let x = Math.floor(view.x / 70) * 70 - 70; x < view.x + W + 70; x += 70) { const xx = x + (S.t * 30) % 70, yy = WH + 30 + Math.sin(xx * 0.012) * 6 + Math.sin(x) * 6; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 8, yy - 3, xx + 16, yy); ctx.stroke(); } }
    atmosphereWorld(view);
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
          const al = (0.35 + 0.45 * Math.max(0, Math.sin(S.t * 4 - along * 0.5))) * clamp(1.4 - along / 12, 0.2, 1);
          ctx.globalAlpha = al; glow(px, py, 20, 'rgba(255,240,150,.7)');
          ctx.globalAlpha = Math.min(1, al + 0.15);
          ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
          ctx.fillStyle = 'rgba(200,150,60,.6)'; ellipse(0, 3, 6.4, 7.4); for (const t of [-0.5, 0, 0.5]) ellipse(Math.sin(t) * 7, -6 + Math.abs(t) * 3, 3.2, 4);
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
      const wob = Math.sin(S.t * 3) * 2;
      ctx.fillStyle = 'rgba(160,100,20,.3)'; ellipse(p.x + 3, p.y + 5, p.r + 4, p.r * 0.55 + 4);
      const hp = new Path2D(); for (let i = 0; i <= 16; i++) { const a = i / 16 * 6.28, rr = p.r * (1 + Math.sin(a * 3 + p.x) * 0.08) + (i % 2 ? wob : 0); hp.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr * 0.55); } hp.closePath();
      ctx.strokeStyle = OL; ctx.lineWidth = 3.5; ctx.stroke(hp);
      const hg = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.2, 4, p.x, p.y, p.r);
      hg.addColorStop(0, '#ffe58a'); hg.addColorStop(0.6, '#f6b830'); hg.addColorStop(1, '#d88a18');
      ctx.fillStyle = hg; ctx.fill(hp);
      ctx.fillStyle = 'rgba(255,255,255,.65)'; ellipse(p.x - p.r * 0.35, p.y - p.r * 0.2, p.r * 0.2, p.r * 0.07, -0.2); circle(p.x - p.r * 0.1, p.y - p.r * 0.22, 2.5);
      for (let i = 0; i < 3; i++) { const k = (S.t * 0.7 + i / 3) % 1; ctx.strokeStyle = `rgba(255,240,180,${1 - k})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x + Math.cos(i * 2.1) * p.r * 0.5, p.y + Math.sin(i * 2.1) * p.r * 0.25, 2 + k * 4, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    for (const b of g.baits) {
      ctx.fillStyle = 'rgba(40,30,60,.2)'; ellipse(b.x + 2, b.y + 6, 20, 6);
      const pulse = 1 + Math.sin(S.t * 6) * 0.05;
      for (let i = 0; i < 6; i++) inkCircle(b.x + Math.cos(i * 1.05) * 10 * pulse, b.y + Math.sin(i * 1.05) * 6, 6, i % 2 ? '#6a5ae0' : '#4e8af0', 1, OL);
      inkCircle(b.x, b.y - 2, 6.4, '#8a6cf0', 1, OL);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 6; i++) circle(b.x + Math.cos(i * 1.05) * 10 - 2, b.y + Math.sin(i * 1.05) * 6 - 2, 1.6);
      inkAt(b.x + 2, b.y - 8, -0.8, LEAF_S, '#6ccf6a', 0.7);
    }
    if (g.tap) {
      const p = 1 + Math.sin(S.t * 8) * 0.15;
      ctx.strokeStyle = 'rgba(91,63,115,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(g.tap.x, g.tap.y, 15 * p, 7.5 * p, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
      star(g.tap.x, g.tap.y - 14 - Math.abs(Math.sin(S.t * 5)) * 6, 6, '#ffe36b', 4);
    }
    if (g.petalT > 0) {
      ctx.globalAlpha = Math.min(1, g.petalT) * 0.25; glow(A.x, A.y - 20, 170, 'rgba(255,170,220,.6)', 100); ctx.globalAlpha = 1;
      for (let i = 0; i < 26; i++) {
        const a = S.t * (2.6 + (i % 3) * 0.5) + i * 0.24, r = 60 + (i % 4) * 26 + Math.sin(S.t * 2 + i) * 8;
        ctx.save(); ctx.translate(A.x + Math.cos(a) * r, A.y - 20 + Math.sin(a) * r * 0.55 - (i % 5) * 6); ctx.rotate(a * 2 + i);
        ctx.globalAlpha = Math.min(1, g.petalT); ink(PETAL, ['#ff8fc8', '#ffc0dc', '#fff', '#ff6fa8'][i % 4], 0.8, OL); ctx.restore();
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
    if (g.shieldT > 0) shieldBubble(A, false);
    drawCanopy(view);
    butterflies(view);
    for (const e of g.dinos) if (e.K.fly) drawDino(e);
    // goo, effects, sparkles, words
    for (const o of g.goos) {
      ctx.fillStyle = 'rgba(156,232,106,.4)'; circle(o.x - o.vx * 0.04, o.y - o.vy * 0.04, 5); circle(o.x - o.vx * 0.08, o.y - o.vy * 0.08, 3.5);
      inkCircle(o.x, o.y, 7.5, '#9ce86a', 1.3, OL); ctx.fillStyle = '#d8ffb8'; circle(o.x - 2.4, o.y - 2.4, 2.6);
    }
    for (const fx of g.fx) drawFxItem(fx);
    for (const p of g.parts) {
      ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
      drawPart(p);
    }
    ctx.globalAlpha = 1;
    for (const t of g.texts) {
      const k = clamp(t.life, 0, 1), pop = 1 + Math.max(0, (t.life - 1.25)) * 3;
      ctx.globalAlpha = k; ctx.save(); ctx.translate(t.x, t.y); ctx.scale(pop, pop); outlined(t.str, 0, 0, t.size, t.col); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  const PETAL = P2('M0,-6 C5,-6 6,0 0,6 C-6,0 -5,-6 0,-6 Z');
  const NOTE = n => n % 2 ? '♪' : '♫';
  function drawPart(p) {
    const k = p.kind;
    if (k === 'heart') { heart(p.x, p.y - 1, p.size * 3 + 3, OL); heart(p.x, p.y, p.size * 3, p.col); }
    else if (k === 'leaf' || k === 'petal') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 9 + p.size); ink(k === 'leaf' ? LEAF_S : PETAL, p.col, 0.8, OL); ctx.restore(); }
    else if (k === 'note') outlined(NOTE(Math.round(p.size)), p.x, p.y, 18 + p.size * 2, p.col);
    else if (k === 'dot') { ctx.fillStyle = p.col; circle(p.x, p.y, p.size * 0.8); }
    else if (k === 'confetti') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 10); ctx.scale(1, Math.cos(p.life * 14)); ctx.fillStyle = p.col; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore(); }
    else { star(p.x, p.y, p.size + 1.6, 'rgba(91,63,115,.7)', 5); star(p.x, p.y, p.size, p.col, 5); }
  }
  // the effects for each special ability (visual only: called after the ability does its work)
  function abilityFx(id, l) {
    const A = g.aub, B = g.baby;
    const fxb = (x, y, n, cols, kind, o = {}) => wburst(x, y, n, cols, { kind, ...o });
    switch (id) {
      case 'roar': g.fx.push({ k: 'roar', x: B.x, y: B.y - 24, t: 0, dur: 0.7, r: 150 + 25 * l }); g.shake = Math.max(g.shake, 0.25); fxb(B.x, B.y - 30, 10, ['#a6f0b8', '#fff'], 'star', { spread: 160 }); break;
      case 'feather': g.shake = Math.max(g.shake, 0.18); fxb(A.x, A.y - 30, 16, ['#8ccf5a', '#e8b04a', '#6cbc50'], 'leaf', { spread: 280, up: 40, grav: 30 }); break;
      case 'petal': g.fx.push({ k: 'glowring', x: A.x, y: A.y - 20, t: 0, dur: 0.5, r: 150, col: 'rgba(255,170,220,.7)' }); fxb(A.x, A.y - 40, 22, ['#ff8fc8', '#ffc0dc', '#fff', '#ff6fa8'], 'petal', { spread: 200, grav: 40 }); break;
      case 'ribbon': fxb(A.x, A.y - 50, 8, ['#ff6fa8', '#ffd0e8'], 'heart', { spread: 80 }); break;
      case 'berry': fxb(A.x, A.y - 40, 6, ['#7b6cf0', '#4e8af0'], 'dot', { spread: 90 }); break;
      case 'shell': g.shake = Math.max(g.shake, 0.3); g.fx.push({ k: 'horn', x: A.x, y: A.y - 30, t: 0, dur: 0.8, r: 290 + 40 * l }); for (let i = 0; i < 6; i++) wburst(A.x, A.y - 60, 1, ['#ffd6a8', '#fff3a0'], { kind: 'note', spread: 200 }); break;
      case 'crystal': g.fx.push({ k: 'glowring', x: A.x, y: A.y - 40, t: 0, dur: 0.6, r: 110, col: 'rgba(160,230,255,.8)' }); fxb(A.x, A.y - 40, 18, ['#bff0ff', '#fff', '#d8c4ff'], 'star', { spread: 160 }); break;
      case 'honey': g.fx.push({ k: 'splat', x: B.x, y: B.y, t: 0, dur: 0.4, r: 60 + 12 * l }); fxb(B.x, B.y - 10, 10, ['#f6b830', '#ffe58a'], 'dot', { spread: 120, up: 120 }); break;
      case 'stardust': g.flash = Math.max(g.flash, 0.18); g.flashCol = '255,246,190'; g.shake = Math.max(g.shake, 0.2); g.fx.push({ k: 'glowring', x: A.x, y: A.y - 30, t: 0, dur: 0.6, r: 230, col: 'rgba(255,240,140,.7)' }); fxb(A.x, A.y - 40, 26, ['#ffe36b', '#fff', '#ffb3e0'], 'star', { spread: 300, up: 100 }); break;
      case 'rainbow': g.flash = Math.max(g.flash, 0.12); g.flashCol = '255,230,250'; break;
      case 'moonbeam': g.fx.push({ k: 'tint', t: 0, dur: 1.6, col: '70,60,160' }); for (let i = 0; i < 10; i++) wburst(A.x, A.y - 60, 1, ['#d8d0ff', '#fff', '#c8c0ff'], { kind: 'note', spread: 150, up: 90, grav: -20 }); break;
      case 'ember': g.flashCol = '255,236,190'; g.shake = Math.max(g.shake, 0.3); g.fx.push({ k: 'rays', x: A.x, y: A.y - 40, t: 0, dur: 0.6 }); fxb(A.x, A.y - 40, 20, ['#ffb070', '#ffe36b', '#fff'], 'star', { spread: 240 }); break;
    }
  }
  function drawFxItem(f) {
    const k = f.t / f.dur;
    ctx.globalAlpha = 1 - k;
    if (f.k === 'ring') {
      const r = f.r * easeOut(k);
      ctx.globalAlpha = (1 - k) * 0.22; ctx.fillStyle = f.col; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.6, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = 'rgba(91,63,115,.5)'; ctx.lineWidth = f.w * (1 - k) + 5; ctx.stroke();
      ctx.strokeStyle = f.col; ctx.lineWidth = f.w * (1 - k) + 2; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, r * 0.8, r * 0.48, 0, 0, 7); ctx.stroke();
      for (let i = 0; i < 10; i++) { const a = i * 0.628 + k; star(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6, 6 * (1 - k) + 2, '#fff', 4); }
    } else if (f.k === 'glowring') {
      ctx.globalCompositeOperation = 'lighter'; glow(f.x, f.y, f.r * (0.5 + easeOut(k) * 0.7), f.col, f.r * 0.7 * (0.5 + easeOut(k) * 0.7)); ctx.globalCompositeOperation = 'source-over';
    } else if (f.k === 'roar') {
      for (let i = 0; i < 3; i++) {
        const kk = clamp(k * 1.4 - i * 0.18, 0, 1); if (kk <= 0) continue;
        ctx.globalAlpha = 1 - kk; const r = 20 + f.r * easeOut(kk);
        ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(f.x, f.y, r, -0.7, 0.7); ctx.stroke(); ctx.beginPath(); ctx.arc(f.x, f.y, r, Math.PI - 0.7, Math.PI + 0.7); ctx.stroke();
        ctx.strokeStyle = '#a6f0b8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, r, -0.7, 0.7); ctx.stroke(); ctx.beginPath(); ctx.arc(f.x, f.y, r, Math.PI - 0.7, Math.PI + 0.7); ctx.stroke();
      }
    } else if (f.k === 'horn') {
      for (let i = 0; i < 4; i++) {
        const kk = clamp(k * 1.3 - i * 0.12, 0, 1); if (kk <= 0) continue;
        ctx.globalAlpha = (1 - kk) * 0.8; const r = 30 + f.r * easeOut(kk);
        ctx.strokeStyle = i % 2 ? '#fff3a0' : '#ffd6a8'; ctx.lineWidth = 6 * (1 - kk) + 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.6, 0, 0, 7); ctx.stroke();
      }
    } else if (f.k === 'rays') {
      ctx.globalCompositeOperation = 'lighter'; glow(f.x, f.y, 200 * (0.6 + k), 'rgba(255,180,100,.35)', 140 * (0.6 + k)); ctx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(k * 0.6);
      ctx.fillStyle = 'rgba(255,230,160,.35)';
      for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(260 * easeOut(k), -16); ctx.lineTo(260 * easeOut(k), 16); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    } else if (f.k === 'splat') {
      const r = f.r * easeOut(Math.min(1, k * 2));
      ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffe58a';
      for (let i = 0; i < 8; i++) { const a = i * 0.785; circle(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.55, 5 * (1 - k) + 2); }
    } else if (f.k === 'tint') {
      ctx.globalAlpha = 1; ctx.fillStyle = `rgba(${f.col},${0.22 * Math.sin(k * Math.PI)})`; ctx.fillRect(g.cam.x - 20, g.cam.y - 20, W + 40, H + 40);
      for (let i = 0; i < 12; i++) { const x = g.cam.x + (i * 173) % W, y = g.cam.y + (i * 97) % (H * 0.6) + 20; ctx.globalAlpha = Math.sin(k * Math.PI) * (0.5 + 0.5 * Math.sin(S.t * 6 + i)); star(x, y, 4, '#fff', 4); }
      ctx.globalAlpha = Math.sin(k * Math.PI); emoji('🌙', g.aub.x + 40, g.aub.y - 130 - k * 10, 34);
    } else if (f.k === 'gust') {
      const r = f.r * easeOut(k);
      for (let i = 0; i < 12; i++) {
        const a = i * 0.524 + k * 1.4, rr = r * (0.55 + (i % 3) * 0.17);
        ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(f.x, f.y, rr, a, a + 0.55); ctx.stroke();
        ctx.strokeStyle = i % 2 ? '#e8f6ff' : '#bfe3ff'; ctx.lineWidth = 3.5; ctx.stroke();
        // little curl at the tip
        const ex = f.x + Math.cos(a + 0.55) * rr, ey = f.y + Math.sin(a + 0.55) * rr;
        ctx.beginPath(); ctx.arc(ex - Math.cos(a) * 6, ey - Math.sin(a) * 6, 6, a + 0.55, a + 0.55 + 3.6); ctx.stroke();
      }
    } else if (f.k === 'beam') {
      const len = f.len * Math.min(1, k * 4), wob = Math.sin(S.t * 30) * 2;
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(Math.atan2(f.dy, f.dx));
      ctx.globalAlpha = (1 - k) * 0.5; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite('rgba(255,220,240,.6)'), -30, -70, len + 60, 140); ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.roundRect(0, -32 - wob, len, 64 + wob * 2, 32); ctx.save(); ctx.clip();
      ['#ff6b6b', '#ffa94d', '#ffe36b', '#69db7c', '#4dabf7', '#9775fa'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, -32 - wob + i * (64 + wob * 2) / 6, len, (64 + wob * 2) / 6 + 1); });
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(0, -7, len, 14);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.stroke();
      for (let i = 0; i < 8; i++) { const x = ((i * 53 + S.t * 400) % Math.max(1, len)); star(x, Math.sin(i * 2 + S.t * 9) * 22, 6, '#fff', 4); }
      // a little puffy cloud at each end
      for (const cx of [4, len]) { const cp = new Path2D(); for (const [dx, dy, r] of [[-12, 0, 13], [0, -8, 16], [13, 0, 13], [0, 8, 13]]) cp.ellipse(cx + dx, dy, r, r, 0, 0, 7); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(cp); ctx.fillStyle = '#fff'; ctx.fill(cp); }
      ctx.restore();
    } else if (f.k === 'notes') {
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + k * 0.8, r = 40 + k * 150; outlined(i % 2 ? '♪' : '♫', f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6 - k * 30 + Math.sin(S.t * 6 + i) * 5, 26, ['#d8d0ff', '#ffd0f0', '#c8f0ff'][i % 3]); }
    } else if (f.k === 'net' || f.k === 'lasso') {
      const e = f.e, tx = e.x, ty = e.y - (e.z || 0) - e.K.h * e.K.s * 0.5, kk = Math.min(1, k * 2.5);
      const x = lerp(f.x, tx, kk), y = lerp(f.y, ty, kk) - Math.sin(kk * Math.PI) * 40;
      ctx.globalAlpha = 1 - Math.max(0, k - 0.7) / 0.3;
      if (f.k === 'lasso') {
        const sx = g.aub.x, sy = g.aub.y - 45;
        ctx.lineCap = 'round';
        for (const [c, w] of [[OL, 6], ['#ff6fa8', 3.4]]) {
          ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + x) / 2, Math.min(sy, y) - 50, x, y); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(x, y, 20 - kk * 4, 11 - kk * 2, S.t * 6, 0, 7); ctx.stroke();
        }
        if (kk >= 1) fxStars(x, y, 4, '#ff9ccc');
      } else {
        const r = 10 + kk * 18;
        ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 4 * (1 - kk));
        const ln = () => { ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(-r, i * r / 2.5); ctx.quadraticCurveTo(0, i * r / 2.5 + 4, r, i * r / 2.5); ctx.moveTo(i * r / 2.5, -r); ctx.quadraticCurveTo(i * r / 2.5 + 4, 0, i * r / 2.5, r); } ctx.stroke(); };
        ctx.strokeStyle = OL; ctx.lineWidth = 3.4; ln(); ctx.strokeStyle = '#f4e8ff'; ctx.lineWidth = 1.6; ln();
        for (const [cx, cy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) inkCircle(cx, cy, 3, '#c9a6ff', 0.8);
        ctx.restore();
      }
    } else if (f.k === 'toss') {
      ctx.globalAlpha = 1;
      const x = lerp(f.x0, f.x, k), y = lerp(f.y0, f.y, k) - Math.sin(k * Math.PI) * 60;
      ctx.fillStyle = 'rgba(40,30,60,.2)'; ellipse(x, lerp(f.y0 + 40, f.y, k), 8, 3);
      for (let i = 0; i < 3; i++) inkCircle(x + (i - 1) * 6, y + (i % 2) * 4, 5.5, i % 2 ? '#6a5ae0' : '#4e8af0', 1, OL);
    }
    ctx.globalAlpha = 1;
  }
  function fxStars(x, y, n, col) { for (let i = 0; i < n; i++) { const a = S.t * 6 + i * 6.28 / n; star(x + Math.cos(a) * 22, y + Math.sin(a) * 12, 5, col, 4); } }

  // ---------------------------------------------------------------------------------------------
  // HUD: progress, mini-map, the shoo button and ability buttons with cooldown rings
  // ---------------------------------------------------------------------------------------------
  // a little round medallion with an icon
  function medal(x, y, r, col, icon, size, dim) {
    ctx.save(); ctx.shadowColor = 'rgba(40,10,60,.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.fillStyle = OL; circle(x, y, r + 3); ctx.restore();
    const c = dim ? mix(col, '#6a5a7a', 0.6) : col;
    const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r);
    gr.addColorStop(0, mix(c, '#ffffff', 0.45)); gr.addColorStop(0.7, c); gr.addColorStop(1, mix(c, '#2a1050', 0.25));
    ctx.fillStyle = gr; circle(x, y, r);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(x - r * 0.15, y - r * 0.55, r * 0.6, r * 0.25);
    if (icon) { if (dim) ctx.globalAlpha = 0.6; emoji(icon, x, y + 1, size); ctx.globalAlpha = 1; }
  }
  function keyBadge(x, y, k, r = 10) { inkCircle(x, y, r, '#fff', 1.2, OL); text(k, x, y + 1, k.length > 2 ? 9 : r + 3, '#5a2a6e', 'center', 700); }
  function drawHUD() {
    const A = g.aub;
    g.ui = [];
    // where we are, and how far there is to go
    rrect(12, 10, 318, 52, 18, 'rgba(48,24,72,.8)', 'rgba(255,255,255,.35)', 2);
    text('Take Baby home to Mama & Papa!', 24, 25, 15, '#fff', 'left', 700);
    const [cx, cy] = cellOf(A.x, A.y), prog = clamp(1 - g.fieldG[cy][cx] / g.startD, 0, 1);
    const bx = 26, by = 41, bw = 200, bh = 12;
    rrect(bx, by, bw, bh, 6, 'rgba(255,255,255,.18)');
    if (prog > 0) { const gb = ctx.createLinearGradient(bx, 0, bx + bw, 0); gb.addColorStop(0, '#7fd88a'); gb.addColorStop(1, '#ffe36b'); rrect(bx, by, Math.max(bh, bw * prog), bh, 6, gb); rrect(bx + 3, by + 2, Math.max(4, bw * prog - 6), 3, 1.5, 'rgba(255,255,255,.45)'); }
    for (let i = 1; i < 5; i++) { ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(bx + bw * i / 5, by + bh / 2, 1.5); }
    // the nest at the end, and Baby's head marking how far we've come
    inkEllipse(bx + bw + 12, by + 7, 11, 6, 0, '#b8834c', 1.2, OL); ctx.fillStyle = '#fff6e6'; ellipse(bx + bw + 10, by + 3, 4, 3); ellipse(bx + bw + 15, by + 3, 4, 3);
    const hx = bx + bw * prog, hy = by + bh / 2;
    inkCircle(hx, hy, 9, '#7fd88a', 1.2, OL); ctx.fillStyle = '#5fbf70'; circle(hx + 4, hy + 2, 3.6); ctx.fillStyle = OL; circle(hx + 1, hy - 2, 1.6); ctx.fillStyle = '#ff8a80'; tri(hx - 6, hy - 6, hx - 2, hy - 12, hx, hy - 7);
    // shooed count
    ctx.save(); ctx.translate(266, 46); ctx.rotate(-0.4); ink(LEAF_S, '#7ed06a', 1, OL); ctx.restore();
    text(String(g.charmed), 290, 46, 16, '#ffd1ec', 'left', 700);
    text('shooed', 290, 25, 11, 'rgba(255,209,236,.8)', 'left', 600);
    // mini-map: a rounded storybook frame, with the nest, Aubrey and Baby marked
    const mc = 10, mw = COLS * mc, mh = ROWS * mc, mx = W - mw - 20, my = 14;
    ctx.save(); ctx.shadowColor = 'rgba(30,10,50,.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    rrect(mx - 8, my - 7, mw + 16, mh + 14, 14, '#8a5a32'); ctx.restore();
    rrect(mx - 8, my - 7, mw + 16, mh + 14, 14, null, OL, 2.5);
    rrect(mx - 4, my - 3, mw + 8, mh + 6, 10, '#6a4426');
    ctx.save(); ctx.beginPath(); ctx.roundRect(mx - 2, my - 1, mw + 4, mh + 2, 8); ctx.clip();
    ctx.fillStyle = '#9fca6c'; ctx.fillRect(mx - 2, my - 1, mw + 4, mh + 2);
    ctx.fillStyle = '#efd9a6';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const w = MAZE.walls[y][x]; ctx.fillRect(mx + x * mc + 2, my + y * mc + 2, mc - 4, mc - 4);
      if (!(w & BE) && x < COLS - 1) ctx.fillRect(mx + x * mc + 6, my + y * mc + 2, mc, mc - 4);
      if (!(w & BS) && y < ROWS - 1) ctx.fillRect(mx + x * mc + 2, my + y * mc + 6, mc - 4, mc);
    }
    const mp = (x, y) => [mx + x / C * mc, my + y / C * mc];
    for (const e of g.dinos) if (live(e) && e.state !== 'idle') { const [ex, ey] = mp(e.x, e.y); ctx.fillStyle = OL; circle(ex, ey, e.kind === 'trex' ? 4.4 : 3); ctx.fillStyle = e.kind === 'trex' ? '#ff7a3a' : '#b08ae0'; circle(ex, ey, e.kind === 'trex' ? 3.4 : 2.1); }
    ctx.restore();
    // the nest, with a heart over it
    const [nx, ny] = mp(g.nest.x, g.nest.y);
    inkEllipse(nx, ny + 2, 8, 4.5, 0, '#b8834c', 1, OL); ctx.fillStyle = '#fff6e6'; circle(nx - 2, ny, 2); circle(nx + 2.5, ny, 2);
    heart(nx, ny - 13 - Math.abs(Math.sin(S.t * 3)) * 2, 12, '#ff4f8f');
    // Baby (red and pulsing if he's been grabbed) and Aubrey
    const bb = g.baby.held || g.baby, [bmx, bmy] = mp(bb.x, bb.y);
    if (g.baby.held) { ctx.strokeStyle = '#ff6f6f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bmx, bmy, 5 + (S.t * 8 % 4), 0, 7); ctx.stroke(); }
    inkCircle(bmx, bmy, 3.4, g.baby.held ? '#ff6f6f' : '#7fd88a', 0.9, OL);
    const [ax, ay] = mp(A.x, A.y);
    ctx.strokeStyle = `rgba(255,255,255,${0.8 - (S.t % 1) * 0.8})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(ax, ay, 4 + (S.t % 1) * 7, 0, 7); ctx.stroke();
    inkCircle(ax, ay, 4.4, '#ff6fb5', 1, '#fff');
    // mama and papa, if they're off the screen: a speech-bubble arrow at the edge pointing their way
    const sx = g.mama.x - g.cam.x, sy = g.mama.y - 50 - g.cam.y;
    if (sx < 30 || sx > W - 30 || sy < 70 || sy > H - 100) {
      const ex = clamp(sx, 60, W - 60), ey = clamp(sy, 150, H - 130), a = Math.atan2(sy - ey, sx - ex);
      edgeBubble(ex, ey, a, '#ff8fc8', 'rgba(255,248,252,.95)', 'Mama', '#c2407e', 1, true);
    }
    // message banner: a little storybook scroll
    if (g.msg) {
      const lines = wrap(g.msg.text, 520, 18, 700), h = 18 + lines.length * 24;
      ctx.globalAlpha = clamp(g.msg.t * 2, 0, 1);
      scroll(W / 2 - 280, 74, 560, h);
      lines.forEach((l, i) => text(l, W / 2, 74 + 21 + i * 24, 18, '#5a2a3e', 'center', 700));
      ctx.globalAlpha = 1;
    }
    if (g.baby.held) {
      const pul = 1 + 0.06 * Math.sin(S.t * 10);
      ctx.save(); ctx.translate(W / 2, g.msg ? 156 : 100); ctx.scale(pul, pul); outlined('Catch the snatcher!', 0, 0, 26, '#ffb3b3', 'center', '#7a1a3a'); ctx.restore();
      // and if he's been carried off the screen, an arrow points the way
      const e = g.baby.held, bx2 = e.x - g.cam.x, by2 = e.y - (e.z || 0) - 30 - g.cam.y;
      if (bx2 < 20 || bx2 > W - 20 || by2 < 70 || by2 > H - 110) {
        const ex = clamp(bx2, 70, W - 70), ey = clamp(by2, 190, H - 150), a = Math.atan2(by2 - ey, bx2 - ex);
        edgeBubble(ex, ey, a, '#ff6f6f', 'rgba(255,240,240,.97)', 'Baby!', '#d04050', 1 + 0.08 * Math.sin(S.t * 10), false);
      }
    }
    // shoo
    const sb = { id: 'shoo', x: 14, y: H - 96, w: 124, h: 80 };
    const hov = inRect(sb), on = A.swing > 0;
    ctx.save(); ctx.shadowColor = 'rgba(30,10,50,.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rrect(sb.x, sb.y, sb.w, sb.h, 26, OL); ctx.restore();
    const sg = ctx.createLinearGradient(0, sb.y, 0, sb.y + sb.h); sg.addColorStop(0, on ? '#b6f0a0' : hov ? '#9ae484' : '#8bdc76'); sg.addColorStop(1, on ? '#6ac25a' : '#4fa648');
    rrect(sb.x + 3, sb.y + 3, sb.w - 6, sb.h - 6, 23, sg);
    rrect(sb.x + 10, sb.y + 7, sb.w - 20, 14, 7, 'rgba(255,255,255,.3)');
    ctx.save(); ctx.translate(sb.x + 36, sb.y + 44); ctx.rotate(-0.6 + (on ? Math.sin(S.t * 30) * 0.4 : Math.sin(S.t * 2) * 0.08)); ctx.scale(0.75, 0.75); ctx.translate(-26, 0);
    ink(BIG_LEAF, '#5cc060', 2, OL); ctx.strokeStyle = '#3a8a40'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(52, 0); ctx.stroke(); ctx.restore();
    outlined('Shoo!', sb.x + 86, sb.y + 34, 22, '#fff', 'center', '#2e6a2e');
    rrect(sb.x + 62, sb.y + 50, 48, 18, 9, 'rgba(30,70,30,.35)');
    text('Space', sb.x + 86, sb.y + 59, 12, '#fff', 'center', 700);
    g.ui.push(sb);
    // abilities: round medallions, a cooldown ring that fills back up, the key number and star level
    g.ab.list.forEach((a, i) => {
      const def = ABIL[a.id], x = 186 + i * 76, y = H - 56, r = 32;
      g.ui.push({ id: i, x, y, r });
      const ready = a.cd <= 0, hv = Math.hypot(pointer.x - x, pointer.y - y) < r;
      if (ready) { const p = 0.5 + 0.5 * Math.sin(S.t * 3 + i); ctx.globalCompositeOperation = 'lighter'; glow(x, y, r + 14 + p * 4, `rgba(${def.col === '#fff' ? '255,255,255' : '255,240,200'},${0.25 + 0.15 * p})`); ctx.globalCompositeOperation = 'source-over'; }
      ctx.save(); if (hv && ready) { ctx.translate(x, y); ctx.scale(1.06, 1.06); ctx.translate(-x, -y); }
      medal(x, y, r, def.col, abIcon(a.id), 30, !ready);
      if (a.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${a.flash * 1.6})`; circle(x, y, r); ctx.strokeStyle = `rgba(255,255,255,${a.flash * 2})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r + 6 + (0.4 - a.flash) * 40, 0, 7); ctx.stroke(); }
      ctx.strokeStyle = ready ? '#fff' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      if (!ready) {
        const k = a.cd / (def.cd * (1 - 0.15 * (a.lvl - 1)));
        ctx.fillStyle = 'rgba(40,20,60,.32)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(40,20,60,.6)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(x, y, r + 5, -Math.PI / 2 + k * Math.PI * 2, Math.PI * 1.5); ctx.stroke();
        const ea = Math.PI * 1.5; inkCircle(x + Math.cos(ea) * (r + 5), y + Math.sin(ea) * (r + 5), 3, '#fff', 0.6);
        inkCircle(x + r - 5, y - r + 7, 10, '#5a3a7a', 1, '#fff'); text(String(Math.ceil(a.cd)), x + r - 5, y - r + 8, 13, '#fff', 'center', 700);
      }
      ctx.restore();
      keyBadge(x - r + 4, y - r + 4, String(i + 1), 11);
      // star level on a little ribbon
      if (a.lvl) {
        const rw = 12 + a.lvl * 13;
        rrect(x - rw / 2, y + r - 4, rw, 15, 7.5, 'rgba(48,24,72,.85)', 'rgba(255,255,255,.6)', 1.4);
        for (let s = 0; s < a.lvl; s++) star(x - (a.lvl - 1) * 6.5 + s * 13, y + r + 3.5, 6, '#ffe36b', 5);
      }
    });
  }
  function edgeBubble(ex, ey, a, line, fill, label, tcol, pul, mama) {
    ctx.save(); ctx.translate(ex, ey); ctx.scale(pul, pul);
    const ax = Math.cos(a) * 54, ay = Math.sin(a) * 36, bob = Math.sin(S.t * 6) * 3;
    ctx.save(); ctx.shadowColor = 'rgba(30,10,50,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    rrect(-48, -28, 96, 56, 22, fill); ctx.restore();
    rrect(-48, -28, 96, 56, 22, null, line, 3);
    ctx.save(); ctx.translate(ax + Math.cos(a) * bob, ay + Math.sin(a) * bob); ctx.rotate(a);
    ctx.fillStyle = OL; tri(15, 0, -7, -12, -7, 12); ctx.fillStyle = line; tri(11, 0, -5, -9, -5, 9); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-44, -24, 50, 48, 18); ctx.clip();
    if (typeof drawBabyDino === 'function') drawBabyDino(-20, 22, mama ? 0.17 : 0.16, mama ? {} : null, mama ? { grown: true, palette: typeof MAMA_PAL !== 'undefined' ? MAMA_PAL : DD_MAMA, facing: 1, t: S.t } : { mood: 'scared', facing: 1, t: S.t });
    else emoji('🦕', -18, -2, 26);
    ctx.restore();
    if (mama) heart(20, -14, 18, '#ff4f8f');
    text(label, mama ? 20 : 22, mama ? 12 : 0, mama ? 12 : 15, tcol, 'center', 700);
    ctx.restore();
  }
  // a cream parchment scroll with curled ends
  function scroll(x, y, w, h) {
    ctx.save(); ctx.shadowColor = 'rgba(30,10,50,.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    rrect(x, y, w, h, 12, '#fbf0d4'); ctx.restore();
    const pg = ctx.createLinearGradient(0, y, 0, y + h); pg.addColorStop(0, '#fff8e4'); pg.addColorStop(1, '#f4e2b8');
    rrect(x, y, w, h, 12, pg, '#b8885a', 2.5);
    rrect(x + 5, y + 5, w - 10, h - 10, 9, null, 'rgba(184,136,90,.4)', 1.2);
    for (const cx of [x, x + w]) { inkEllipse(cx, y + h / 2, 9, h / 2 + 3, 0, '#e8cf98', 1.2, '#b8885a'); ctx.fillStyle = '#d4b47a'; ellipse(cx, y + h / 2, 4, h / 2 - 2); }
  }

  // the intro card: a storybook page with the tricks laid out as medallions
  function drawIntro() {
    ctx.fillStyle = 'rgba(30,14,50,.5)'; ctx.fillRect(0, 0, W, H);
    const list = g.ab.list, items = [{ key: 'Spc', icon: null, name: 'Shoo!', what: 'Swish your big leaf at nearby dinos', lvl: 0, col: '#62b85a', leaf: true }]
      .concat(list.map((a, i) => ({ key: String(i + 1), icon: abIcon(a.id), name: ABIL[a.id].name, what: a.gift ? 'You found a feather in your pocket!' : ABIL[a.id].what, lvl: a.lvl, col: ABIL[a.id].col })));
    const cols = items.length > 4 ? 2 : 1, rows = Math.ceil(items.length / cols), rh = rows > 3 ? 58 : 64;
    const w = cols === 2 ? 800 : 560, h = 150 + rows * rh + 74, x = (W - w) / 2, y = Math.max(8, (H - h) / 2);
    // the page, with leafy corners
    ctx.save(); ctx.shadowColor = 'rgba(20,10,40,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    rrect(x, y, w, h, 24, '#f6e6c0'); ctx.restore();
    const pg = ctx.createLinearGradient(0, y, 0, y + h); pg.addColorStop(0, '#fffaea'); pg.addColorStop(1, '#f6e2b4');
    rrect(x, y, w, h, 24, pg, '#8a5a32', 4);
    rrect(x + 9, y + 9, w - 18, h - 18, 18, null, 'rgba(138,90,50,.35)', 2);
    ctx.setLineDash([2, 7]); rrect(x + 15, y + 15, w - 30, h - 30, 14, null, 'rgba(138,90,50,.35)', 2); ctx.setLineDash([]);
    for (const [cx, cy, a] of [[x + 8, y + 8, 0.8], [x + w - 8, y + 8, 2.35], [x + 8, y + h - 8, -0.8], [x + w - 8, y + h - 8, -2.35]]) {
      fern(cx, cy, a - 0.35, 40, '#5cbc5a'); fern(cx, cy, a + 0.35, 34, '#4aa850');
      ctx.fillStyle = OL; for (let k = 0; k < 5; k++) circle(cx + Math.cos(k * 1.257) * 5, cy + Math.sin(k * 1.257) * 5, 4.6); ctx.fillStyle = '#ff8fc8'; for (let k = 0; k < 5; k++) circle(cx + Math.cos(k * 1.257) * 5, cy + Math.sin(k * 1.257) * 5, 3.8); ctx.fillStyle = '#ffe36b'; circle(cx, cy, 3);
    }
    // a ribbon banner for the title, with the family peeking out
    const tw = 440, tx = W / 2 - tw / 2, ty = y - 4;
    for (const s of [-1, 1]) { ctx.fillStyle = '#3e9a4e'; const ex = W / 2 + s * (tw / 2 - 6); ctx.beginPath(); ctx.moveTo(ex, ty + 12); ctx.lineTo(ex + s * 44, ty + 14); ctx.lineTo(ex + s * 30, ty + 32); ctx.lineTo(ex + s * 44, ty + 50); ctx.lineTo(ex, ty + 50); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); }
    rrect(tx, ty, tw, 50, 14, '#5fbf70', OL, 3);
    rrect(tx + 6, ty + 5, tw - 12, 10, 5, 'rgba(255,255,255,.3)');
    outlined('Race to Mama & Papa!', W / 2, ty + 26, 30, '#fff8d0', 'center', '#2e5a36');
    if (typeof drawBabyDino === 'function') { drawBabyDino(tx - 10, ty + 54, 0.2, null, { facing: 1, t: S.t, mood: 'joy' }); drawBabyDino(tx + tw + 12, ty + 54, 0.2, null, { facing: -1, t: S.t + 1 }); }
    const n = g.ab.total;
    const intro = n === 0 ? "You didn't find many supplies, but you still have some tricks:" : `You gathered ${n} supplies, so you can use:`;
    text('Sneaky dinos want to snatch Baby! Shoo them away and follow the glowing paw prints.', W / 2, y + 74, 16, '#5a3a2a', 'center', 600);
    // a paw-print divider
    for (let i = -3; i <= 3; i++) { ctx.fillStyle = 'rgba(138,90,50,.35)'; const px = W / 2 + i * 22, py = y + 96 + (i % 2) * 3; ellipse(px, py + 2, 3.4, 4); for (const t of [-0.6, 0, 0.6]) ellipse(px + Math.sin(t) * 5, py - 4, 1.5, 2); }
    text(intro, W / 2, y + 118, 18, '#c2407e', 'center', 700);
    const cw = cols === 2 ? (w - 70) / 2 : w - 60;
    items.forEach((it, i) => {
      const c = cols === 2 ? i % 2 : 0, r = cols === 2 ? Math.floor(i / 2) : i;
      const cx = x + 30 + c * (cw + 10), cy = y + 146 + r * rh, ch = rh - 8;
      rrect(cx, cy, cw, ch, 16, mix(it.col, '#ffffff', 0.8), mix(it.col, '#8a5a32', 0.35), 2);
      const mx = cx + 34, my = cy + ch / 2;
      if (it.leaf) {
        medal(mx, my, 21, it.col, null, 0, false);
        ctx.save(); ctx.translate(mx - 14, my + 4); ctx.rotate(-0.5); ctx.scale(0.5, 0.5); ink(BIG_LEAF, '#7ed06a', 2.4, OL); ctx.restore();
      } else medal(mx, my, 21, it.col, it.icon, 24, false);
      keyBadge(mx - 18, my - 16, it.key, it.key.length > 2 ? 12 : 10);
      text(it.name, cx + 66, my - 10, 18, '#3a2050', 'left', 700);
      let fs = 13.5; const mw = cw - 76 - (it.lvl ? 54 : 0);
      for (; fs > 10; fs -= 0.5) { ctx.font = `500 ${fs}px ${FONT}`; if (ctx.measureText(it.what).width <= mw) break; }
      text(it.what, cx + 66, my + 11, fs, '#6a4a5a', 'left', 500);
      for (let s = 0; s < it.lvl; s++) { star(cx + cw - 52 + s * 16, my - 10, 8.4, OL, 5); star(cx + cw - 52 + s * 16, my - 10, 7, '#ffc830', 5); }
    });
    buttons = [];
    button('go', W / 2 - 110, y + h - 62, 220, 50, "Let's go! 🦕", { color: '#5fbf70', size: 22 });
    if (Math.sin(S.t * 4) > 0) star(W / 2 + 122, y + h - 54, 7, '#ffe36b', 4);
  }
  // the big finish: golden rays behind the family, confetti, hearts and a bouncy banner
  function drawWin() {
    const k = Math.min(1, g.wt * 2), P = g.mama;
    const px = P.x - g.cam.x + 40, py = P.y - g.cam.y - 70;
    ctx.save(); ctx.globalAlpha = 0.16 * k;
    ctx.translate(px, py); ctx.rotate(S.t * 0.2);
    ctx.fillStyle = '#fff3b0';
    for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI / 7); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(600, -40); ctx.lineTo(600, 40); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.globalAlpha = 1;
    // confetti raining down
    for (let i = 0; i < 70; i++) {
      const sp = 70 + (i * 37) % 60, t = g.wt * sp / 100 + (i * 0.137) % 1;
      const y = ((t % 1.3) - 0.1) * (H + 40) - 20, x = (i * 97.3) % W + Math.sin(g.wt * 2 + i) * 18;
      ctx.save(); ctx.translate(x, y); ctx.rotate(g.wt * 3 + i); ctx.scale(1, Math.cos(g.wt * 6 + i));
      ctx.fillStyle = ['#ff6fa8', '#ffe36b', '#7fd88a', '#6fc8ff', '#c9a6ff', '#ff9a6a'][i % 6]; ctx.fillRect(-5, -3, 10, 6);
      ctx.restore();
    }
    // the banner, letters bouncing in one at a time
    const str = 'We made it!', cy = H - 74, bw = 420;
    const s = easeOut(clamp(g.wt * 2.5, 0, 1));
    ctx.save(); ctx.translate(W / 2, cy); ctx.scale(s, s);
    for (const sg of [-1, 1]) { ctx.fillStyle = '#e0508a'; const ex = sg * (bw / 2 - 10); ctx.beginPath(); ctx.moveTo(ex, -22); ctx.lineTo(ex + sg * 54, -20); ctx.lineTo(ex + sg * 38, 4); ctx.lineTo(ex + sg * 54, 28); ctx.lineTo(ex, 28); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); }
    rrect(-bw / 2, -36, bw, 72, 20, '#ff6fa8', OL, 4);
    rrect(-bw / 2 + 8, -30, bw - 16, 14, 7, 'rgba(255,255,255,.3)');
    ctx.font = `700 50px ${FONT}`; let wsum = 0; const ws = [...str].map(ch => ctx.measureText(ch).width); wsum = ws.reduce((a, b) => a + b, 0);
    let lx = -wsum / 2;
    [...str].forEach((ch, i) => {
      const kk = clamp(g.wt * 3 - i * 0.12, 0, 1), jump = Math.max(0, Math.sin(g.wt * 5 - i * 0.5)) * 6 + (1 - easeOut(kk)) * 40;
      ctx.globalAlpha = kk; outlined(ch, lx + ws[i] / 2, 2 - jump, 50, '#fff6a8', 'center', '#7a1a4a'); lx += ws[i];
    });
    ctx.globalAlpha = 1;
    ctx.restore();
    for (let i = 0; i < 5; i++) { const a = g.wt * 1.5 + i * 1.256; star(W / 2 + Math.cos(a) * 250, cy + Math.sin(a) * 50, 8 + Math.sin(g.wt * 6 + i) * 3, '#ffe36b', 5); }
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
      ctx.fillStyle = '#2b6a3c'; ctx.fillRect(0, 0, W, H);
      ctx.save();
      const sh = g.state === 'play' && g.shake > 0 ? Math.min(g.shake, 0.5) * 9 : 0;
      ctx.translate(-Math.round(g.cam.x) + Math.sin(S.t * 71) * sh, -Math.round(g.cam.y) + Math.cos(S.t * 63) * sh * 0.6);
      drawWorld();
      ctx.restore();
      atmosphereScreen(g.state === 'win' ? Math.min(1, g.wt) : 0);
      if (g.state === 'play' && g.flash > 0) { ctx.fillStyle = `rgba(${g.flashCol || '255,236,190'},${Math.min(0.7, g.flash * 1.4)})`; ctx.fillRect(0, 0, W, H); }
      if (g.state === 'intro') return drawIntro();
      if (g.state === 'play') drawHUD();
      if (g.state === 'win') drawWin();
    },
  };
}
