'use strict';
// Sunny Playground, game 1: Playground Race. A hand-controlled obstacle course: Aubrey runs and jumps
// (arrows/WASD + Space, or hold a finger where she should go and tap above her to jump) across the
// playground while Maya races along her own lane. Stations: monkey bars (grab, swing, let go at the
// right moment), bobbing tires over a slippery sprinkler pool, a wobbly plank bridge, a trampoline with
// a high route, a climbing wall with crumbly and slippery holds, and a big slide with a rolling ball.
// Falls never hurt, they only cost time (soft wood chips, puddles, sand); ribbons reward good runs.
{
  const TAU = Math.PI * 2;
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
  const SKIN = '#f4cdb6';
  const HW = 16, BH = 104;            // Aubrey's collision box: half width and height (feet at p.y)
  const G = 2100;
  const pE = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
  const pR = (x, y, w, h, r = 4) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
  // outline every shape first, then fill them all, so overlapping parts read as one solid thing
  function inkAll(pairs, lw = 2.5) {
    ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of pairs) ctx.stroke(p);
    for (const [p, f] of pairs) { ctx.fillStyle = f; ctx.fill(p); }
  }
  // poles and rails: each [points, colour, width] — all outlines, then all colours, so joints merge
  function tubes(...list) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const pass of [0, 1]) for (const [pts, col, w] of list) {
      ctx.strokeStyle = pass ? col : OL; ctx.lineWidth = pass ? w : w + 5;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
  }
  function glow(x, y, r, rgb = '255,240,140', a = 0.75) {
    const gr = ctx.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Aubrey's photo sprite without the ground shadow (she is often in the air here)
  function aub(x, feetY, frame, facing, s) {
    const im = IMG[frame]; if (!im) return;
    const w = im.width * s, h = im.height * s;
    ctx.save(); ctx.translate(x, feetY);
    const native = { jump: -1, cast: -1, run1: 1, run2: 1, run3: 1, run4: 1, run5: 1 }[frame];
    if (native && facing && native !== Math.sign(facing)) ctx.scale(-1, 1);
    ctx.drawImage(im, -w / 2, -h, w, h);
    ctx.restore();
  }
  const shadow = (x, y, rx) => { ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(x, y, rx, rx * 0.22); };
  const runFrame = t => `run${1 + (Math.floor(t * 12) % 5)}`;
  function arm(x0, y0, x1, y1) { tubes([[[x0, y0], [x1, y1]], SKIN, 7]); inkCircle(x1, y1, 5.5, SKIN, 1.5); }

  // --- a ribbon bow, the prize ---------------------------------------------------------------
  const BOW = {
    l: P2('M0,0 C-8,-14 -24,-15 -24,-4 C-24,7 -9,6 0,0 Z'), r: P2('M0,0 C8,-14 24,-15 24,-4 C24,7 9,6 0,0 Z'),
    tl: P2('M-2,1 L-12,24 L-6,21 L-3,27 L3,3 Z'), tr: P2('M2,1 L12,24 L6,21 L3,27 L-3,3 Z'),
  };
  function bow(x, y, s, col = '#ff4f9a', rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const dk = mix(col, '#5b3f73', 0.28);
    inkAll([[BOW.tl, dk], [BOW.tr, dk], [BOW.l, col], [BOW.r, col], [pE(0, 0, 5.5, 5.5), dk]], 1.7);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-15, -6, 5, 2.6, -0.4); ellipse(15, -6, 5, 2.6, 0.4);
    ctx.restore();
  }
  const RIBCOL = ['#ff4f9a', '#ffa020', '#3a9aff', '#9c6cff', '#2fb860'];

  // --- the course ----------------------------------------------------------------------------
  const TT = 330, BY = 205, R = 112;           // tower tops, monkey-bar height, hand-to-feet length
  const WALL = { x0: 3300, x1: 3540, top: 232 };
  const SL = { x0: 3650, x1: 4150, y0: 238, y1: GY - 12 };
  const slideY = x => SL.y0 + (SL.y1 - SL.y0) * (1 - Math.cos(Math.PI * clamp((x - SL.x0) / (SL.x1 - SL.x0), 0, 1))) / 2;
  const FINISH = 4320, WORLD_W = 4560;
  const ZONES = { pit: [650, 1120], pool: [1300, 1900], bridge: [2140, 2700], wall: [3260, 3540] };
  const inZone = (x, z) => x > ZONES[z][0] && x < ZONES[z][1];
  const STATIONS = [
    { x: 0, name: 'Go!', icon: 'go', tip: '' },
    { x: 520, name: 'Monkey bars', icon: 'bars', tip: 'Monkey bars! Climb the ladder, jump up and grab a bar. Swing, then jump to let go and catch the next one!' },
    { x: 1240, name: 'Tire pool', icon: 'tire', tip: 'Bouncy tires! Hop from tire to tire. The sprinkler puddle is slippery!' },
    { x: 1980, name: 'Wobbly bridge', icon: 'bridge', tip: 'Wobbly bridge! The planks fall if you stand still. Keep moving!' },
    { x: 2740, name: 'Trampoline', icon: 'tramp', tip: 'Trampoline! Press jump as you land for a super bounce up high!' },
    { x: 3220, name: 'Climbing wall', icon: 'wall', tip: 'Climbing wall! Press up, or tap a hold, to climb. Cracked holds crumble and wet ones are slippery!' },
    { x: 3560, name: 'Big slide', icon: 'slide', tip: 'Big slide! Jump over the ball and grab the ribbons!' },
    { x: FINISH, name: 'Finish', icon: 'flag', tip: '' },
  ];

  function buildLevel(g) {
    const t = g.tier;
    const L = {
      solids: [
        { x: 560, y: TT, w: 90, h: GY - TT, kind: 'tower' },
        { x: 2000, y: GY - 40, w: 60, h: 40, kind: 'step' }, { x: 2060, y: GY - 80, w: 70, h: 80, kind: 'step' },
        { x: WALL.x1, y: WALL.top, w: 110, h: GY - WALL.top, kind: 'tower' },
      ],
      plats: [], ladders: [
        { x: 538, y: TT, w: 26, h: GY - TT, top: [585, TT] },
      ],
      bars: [], ribbons: [], balls: [], spawners: [],
      tramp: { x: 2940, w: 130, y: GY - 30, squash: 0 },
      holds: [],
    };
    // monkey bars: wider gaps at higher tiers
    const gap = [0, 106, 118, 132][t];
    for (let x = 700; x < 1080; x += gap) L.bars.push({ x, y: BY });
    // the far tower stands just past the last bar (its ladder is the way out of the wood chips)
    const tx = L.bars[L.bars.length - 1].x + 62; ZONES.pit[1] = tx;
    L.solids.push({ x: tx, y: TT, w: 110, h: GY - TT, kind: 'tower' });
    L.ladders.push({ x: tx - 24, y: TT, w: 26, h: GY - TT, top: [tx + 30, TT] });
    // bobbing tires over the sprinkler pool
    [1350, 1470, 1590, 1710, 1830].forEach((x, i) => L.plats.push({ kind: 'tire', x: x - 34, w: 68, y0: GY - 62, y: GY - 62, amp: [0, 12, 20, 28][t], spd: 2 + t * 0.35, ph: i * 1.4, col: ['#ff6fae', '#ffd23a', '#40b0ff', '#3fc060', '#9c6cff'][i] }));
    // wobbly planks: they shake and drop if you stand on one too long, then come back
    const pg = [0, 26, 38, 50][t];
    let px = 2140;
    for (; px + 76 <= 2630; px += 76 + pg) L.plats.push({ kind: 'plank', x: px, w: 76, y0: GY - 112, y: GY - 112, st: 0, fallT: [0, 1.15, 0.85, 0.6][t], vy: 0, gone: 0 });
    // a solid landing at plank height, then steps down
    const ex = px; ZONES.bridge[1] = ex;
    L.solids.push({ x: ex, y: GY - 112, w: 70, h: 112, kind: 'step' }, { x: ex + 70, y: GY - 56, w: 60, h: 56, kind: 'step' });
    // the high treehouse deck after the trampoline, and the deck on top of the climbing wall
    L.plats.push({ kind: 'deck', x: 3090, w: 190, y: 215, y0: 215 });
    L.plats.push({ kind: 'walltop', x: WALL.x0, w: WALL.x1 - WALL.x0, y: WALL.top, y0: WALL.top });
    // climbing holds in rows; every row keeps at least one good hold
    const bad = [[0, 0], [0.15, 0.1], [0.22, 0.15], [0.3, 0.2]][t];
    for (let r = 0, y = GY - 82; y > WALL.top + 10; r++, y -= 48) {
      const xs = r % 2 ? [3340, 3420, 3500] : [3370, 3450];
      const good = randInt(0, xs.length - 1);
      xs.forEach((x, i) => {
        const k = Math.random(), kind = i === good ? 'ok' : k < bad[0] ? 'crumbly' : k < bad[0] + bad[1] ? 'slippery' : 'ok';
        L.holds.push({ x: x + rand(-12, 12), y: y + rand(-8, 8), kind, col: pick(['#ff4a5a', '#3a8aff', '#ffd23a', '#3fc060', '#a066ff', '#ff9a2a']), shape: pick(['circle', 'star', 'heart', 'tri', 'blob']), gone: 0, hold: 0 });
      });
    }
    // ribbons: a few on the ground, most on the harder (higher) routes
    const rib = (x, y) => L.ribbons.push({ x, y, col: RIBCOL[L.ribbons.length % RIBCOL.length], got: false, ph: Math.random() * 6 });
    rib(330, GY - 175); rib(450, GY - 175);
    rib(605, TT - 50);
    for (let i = 0; i < L.bars.length - 1; i++) rib((L.bars[i].x + L.bars[i + 1].x) / 2, BY + 85);
    rib(tx + 60, TT - 50);
    rib(1470, GY - 110); rib(1590, GY - 220); rib(1710, GY - 110);
    L.plats.filter(p => p.kind === 'plank').forEach((p, i) => { if (i % 2 === 0) rib(p.x + p.w / 2, p.y0 - 55); });
    rib(3005, 205);
    rib(3130, 180); rib(3190, 180); rib(3250, 180);
    rib(3400, 330); rib(3460, 285);
    rib(3600, WALL.top - 50);
    rib(SL.x0 + 120, slideY(SL.x0 + 120) - 40); rib(SL.x0 + 250, slideY(SL.x0 + 250) - 160); rib(SL.x0 + 380, slideY(SL.x0 + 380) - 160);
    rib(4230, GY - 180);
    // kids kicking balls along the ground in three places
    const v = [0, 170, 220, 270][t], per = [0, 3.4, 2.9, 2.4][t];
    L.spawners.push({ x0: 120, x1: 520, per, v, t: 1.2 }, { x0: 2150, x1: ex - 12, per: per * 1.1, v, t: 1.8 }, { x0: 3240, x1: 3290, per: 99, v, t: 99 });
    return L;
  }

  // =========================================================================================
  MG.pgobstaclerace = {
    kind: 'action',
    title: () => 'Playground Race!',
    icon: () => '🏃‍♀️',
    how: () => 'Race Maya across the playground! Use the arrow keys and SPACE to jump. Or hold your finger where Aubrey should run, and tap above her to jump. Grab the ribbons!',
    init(g) {
      const t = g.tier, L = buildLevel(g);
      g.pr = {
        L, t: 0, cam: 0,
        p: { x: 90, y: GY, vx: 0, vy: 0, face: 1, mode: 'run', grounded: true, on: null, from: 'ground', coyote: 0, jbuf: 0, stun: 0, inv: 0, grabCD: 0, lastBar: null, th: 0, om: 0, bar: null, hold: null, tw: null, slip: 0, ladder: null, squash: 0 },
        jv: [0, 800, 780, 760][t], assist: [0, 230, 180, 140][t], grabR: [0, 40, 35, 30][t], reach: 150, crumbleT: [0, 1.5, 1.1, 0.8][t],
        mayaT: [0, 42, 36, 31][t], ribbons: 0, mishaps: 0, flying: [], msg: null, station: 0, won: null, fin: 0, done: false, finAt: 0,
        wallT: 0, rope: false, slideBall: false, hint: 5.5, cap: 170,
      };
      g.say = 'Run with the arrow keys, jump with SPACE. Race Maya to the finish!';
      g.progress = 'Go!';
    },
    start(g) { speak('Ready, set, GO!'); tone(523, 0.15, 'square', 0.05); tone(523, 0.15, 'square', 0.05, 0.3); tone(1047, 0.35, 'square', 0.06, 0.6); },
    mayaX(o) { const u = clamp(o.t / o.mayaT, 0, 1); return FINISH * (u + 0.025 * Math.sin(u * 23) * (1 - u)); },

    // ---- input: keys, or one pointer (hold = run toward it, tap above Aubrey = jump / climb up) ----
    input(g, o) {
      const p = o.p, sx = p.x - o.cam;
      let ax = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0);
      if (!ax && pointer.down && pointer.y > 110) { const dx = pointer.x - sx; if (Math.abs(dx) > 26) ax = Math.sign(dx); }
      const tapUp = pointer.clicked && pointer.y > 110 && pointer.y < p.y - 60;
      const jump = jumpPressed() || tapUp;
      const jumpHeld = keys[' '] || keys.arrowup || keys.w || (pointer.down && pointer.y < p.y - 60 && pointer.y > 110);
      const up = keys.arrowup || keys.w;
      const down = pressed.arrowdown || pressed.s;
      return { ax, jump, jumpHeld, up, down, tap: pointer.clicked && pointer.y > 110 ? [pointer.x + o.cam, pointer.y] : null };
    },

    update(g, dt) {
      const o = g.pr;
      if (o.mode === 'finish' || o.done) { this.finishUpdate(g, o, dt); return; }
      o.t += dt; o.hint = Math.max(0, o.hint - dt);
      const inp = this.input(g, o);
      const n = dt > 0.02 ? 2 : 1;
      for (let i = 0; i < n; i++) this.step(g, o, dt / n, inp, i === 0);
      this.world(g, o, dt);
      // camera follows Aubrey; the backdrop scrolls with it
      o.cam = lerp(o.cam, clamp(o.p.x - 330, 0, WORLD_W - W), Math.min(1, dt * 6));
      // which station are we at?
      let s = 0; STATIONS.forEach((st, i) => { if (o.p.x >= st.x) s = i; });
      if (s > o.station && s < STATIONS.length - 1) {
        o.station = s; const st = STATIONS[s];
        g.say = st.tip; speak(st.tip); g.progress = st.name;
        o.msg = { str: st.name + '!', t: 2, good: true };
      }
      if (o.p.x >= FINISH) this.finish(g, o);
      else if (o.t > o.cap) this.finish(g, o);
      o.flying.forEach(f => { f.t += dt; }); o.flying = o.flying.filter(f => f.t < 0.8);
      if (o.msg) { o.msg.t -= dt; if (o.msg.t <= 0) o.msg = null; }
      this.score(g, o);
    },
    score(g, o) {
      const tot = o.L.ribbons.length, clean = clamp(1 - 0.14 * o.mishaps, 0, 1);
      // ribbons (about 85% of them counts as all) and clean running, with a small bonus for beating Maya
      g.score = (0.4 * Math.min(1, o.ribbons / (0.8 * tot)) + 0.6 * clean) * (o.won === false ? 0.9 : 1);
    },
    mishap(g, o, str, w = 1) {
      o.mishaps += w; SFX.miss(); (o.mlog = o.mlog || []).push(`${str}@${Math.round(o.p.x)}`);
      floatText(o.p.x - o.cam, o.p.y - 130, str, '#ffd0e0', false, 22);
    },

    // one physics step
    step(g, o, dt, inp, first) {
      const p = o.p, L = o.L;
      p.stun = Math.max(0, p.stun - dt); p.inv = Math.max(0, p.inv - dt); p.grabCD = Math.max(0, p.grabCD - dt);
      p.squash = Math.max(0, p.squash - dt * 4);
      if (first && inp.jump) p.jbuf = 0.14; else p.jbuf = Math.max(0, p.jbuf - dt);
      const jump = first && inp.jump;

      if (p.mode === 'ladder') {
        // climbing a ladder is automatic: it just takes a moment
        p.y -= 230 * dt; p.x = lerp(p.x, p.ladder.x + p.ladder.w / 2, 0.3);
        if (Math.floor(o.t * 6) !== Math.floor((o.t - dt) * 6)) SFX.step();
        if (p.y <= p.ladder.top[1]) { p.x = p.ladder.top[0]; p.y = p.ladder.top[1]; p.vx = 0; p.vy = 0; p.mode = 'run'; p.grounded = true; p.from = 'solid'; }
        return;
      }
      if (p.mode === 'hang') {
        // a pendulum: hold left/right to pump, jump to let go (you keep the swing's speed)
        const b = p.bar;
        const acc = -11 * Math.sin(p.th) - 0.5 * p.om + inp.ax * 7;
        p.om += acc * dt; p.th = clamp(p.th + p.om * dt, -1.25, 1.25);
        if (Math.abs(p.th) >= 1.25) p.om *= -0.3;
        p.x = b.x + Math.sin(p.th) * R; p.y = b.y + Math.cos(p.th) * R; p.face = inp.ax || p.face;
        if (Math.sign(p.om) !== Math.sign(p.lastOm || 0) && Math.abs(p.th) > 0.3) tone(300 + Math.abs(p.th) * 300, 0.12, 'sine', 0.03);
        p.lastOm = p.om;
        if (jump || inp.down) {
          p.mode = 'run'; p.from = 'bar'; p.lastBar = b; p.grabCD = 0.3; p.airTop = p.y;
          if (jump) {
            p.vx = p.om * R * Math.cos(p.th); p.vy = -p.om * R * Math.sin(p.th) - 340;
            // a little help for small players, but only when she's really swinging that way
            if (inp.ax > 0 && p.om > 0.3) p.vx = Math.max(p.vx, o.assist); if (inp.ax < 0 && p.om < -0.3) p.vx = Math.min(p.vx, -o.assist);
            SFX.jump();
          } else { p.vx = 0; p.vy = 0; }
        }
        return;
      }
      if (p.mode === 'climb') { this.climbStep(g, o, dt, inp, jump); return; }

      // ---------- running / jumping ----------
      const onSlide = p.on === 'slide';
      const pool = p.grounded && p.on === 'ground' && inZone(p.x, 'pool');
      const chips = p.grounded && p.on === 'ground' && inZone(p.x, 'pit');
      const max = onSlide ? 480 : pool ? 190 : chips ? 120 : 300;
      const ax = p.stun > 0 ? 0 : inp.ax;
      if (ax) p.face = ax;
      if (onSlide) p.vx = Math.min(480, Math.max(160, p.vx + 700 * dt));
      else {
        const accel = !p.grounded ? 1500 : pool ? 520 : 2600, fric = !p.grounded ? 400 : pool ? 180 : 2800;
        if (ax) p.vx = clamp(p.vx + ax * accel * dt, -max, max);
        else p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx), fric * dt);
        if (Math.abs(p.vx) > max) p.vx = lerp(p.vx, Math.sign(p.vx) * max, Math.min(1, dt * 6));
      }
      // jump (with a little grace after leaving an edge, and a short buffer before landing)
      if (p.grounded) p.coyote = 0.1; else p.coyote = Math.max(0, p.coyote - dt);
      if (p.jbuf > 0 && p.coyote > 0 && p.stun <= 0) {
        // on the climbing wall, jump grabs a hold instead
        if (!(inZone(p.x, 'wall') && this.tryGrab(g, o))) {
          p.vy = -o.jv; p.grounded = false; p.coyote = 0; p.jbuf = 0; p.from = (p.on && p.on.kind) || p.on || 'ground'; p.airTop = p.y; p.on = null;
          SFX.jump(); if (p.from === 'plank' || p.from === 'tire') burst(p.x - o.cam, p.y, 4, { colors: ['#fff'], spread: 40, up: 10, size: [2, 3] });
        } else return;
      }
      if (!p.grounded && inp.up && inZone(p.x, 'wall') && this.tryGrab(g, o)) return;
      if (p.grounded && first && inp.up && inZone(p.x, 'wall') && this.tryGrab(g, o)) return;
      p.vy += G * dt;
      p.vy = Math.min(p.vy, 1200);
      // carried by a bobbing tire / sinking plank
      if (p.grounded && p.on && p.on.dy) p.y += p.on.dy;

      // move x
      p.x += p.vx * dt; p.blocked = false;
      for (const s of L.solids) if (p.x + HW > s.x && p.x - HW < s.x + s.w && p.y > s.y + 0.5 && p.y - BH < s.y + s.h) {
        // nearly over the top? she pulls herself up onto it (kind to small players)
        if (p.y - s.y < 46 && p.vy > -200) { p.y = s.y; p.vy = 0; p.grounded = true; p.on = s; SFX.step(); continue; }
        if (p.vx > 0 || p.x < s.x + s.w / 2) p.x = s.x - HW; else p.x = s.x + s.w + HW;
        p.vx = 0; p.blocked = true;
      }
      p.x = Math.max(HW + 4, p.x);
      // move y
      const prevY = p.y, wasGrounded = p.grounded;
      p.y += p.vy * dt;
      p.grounded = false; let on = null;
      for (const s of L.solids) if (p.x + HW > s.x && p.x - HW < s.x + s.w && p.y > s.y && p.y - BH < s.y + s.h) {
        if (p.vy >= 0 && prevY <= s.y + 2) { p.y = s.y; p.vy = 0; p.grounded = true; on = s; }
        else if (p.vy < 0) { p.y = s.y + s.h + BH; p.vy = 0; }
      }
      if (p.vy >= 0 && !on) for (const pl of L.plats) {
        if (pl.gone) continue;
        const top = pl.y, ptop = pl.y - (pl.dy || 0);
        if (p.x + 10 > pl.x && p.x - 10 < pl.x + pl.w && prevY <= ptop + 3 && p.y >= top) { p.y = top; p.vy = 0; p.grounded = true; on = pl; break; }
      }
      // the trampoline: landing bounces you, and a jump right at the landing is a SUPER bounce
      const tr = L.tramp;
      if (!on && p.vy >= 0 && p.x > tr.x && p.x < tr.x + tr.w && prevY <= tr.y + 3 && p.y >= tr.y) {
        const big = p.jbuf > 0 || inp.jumpHeld;
        p.y = tr.y; p.vy = big ? -1270 : -900; p.from = 'tramp'; p.airTop = p.y; tr.squash = 1;
        tone(big ? 220 : 180, 0.35, 'sine', 0.12, 0, big ? 900 : 520);
        if (big) { floatText(p.x - o.cam, p.y - 140, 'SUPER BOUNCE!', '#fff6a8', false, 24); burst(p.x - o.cam, p.y, 12); }
        p.jbuf = 0; return;
      }
      // stepping onto the trampoline from the ground bounces you too
      if (wasGrounded && p.on === 'ground' && p.x > tr.x + 6 && p.x < tr.x + tr.w - 6 && p.vy >= 0) { p.vy = -900; p.from = 'tramp'; p.airTop = p.y; tr.squash = 0.7; tone(180, 0.3, 'sine', 0.1, 0, 480); return; }
      // the slide
      if (!on && p.x > SL.x0 && p.x < SL.x1 && p.vy >= 0 && prevY <= slideY(p.x - p.vx * dt) + 6 && p.y >= slideY(p.x) - 1) { p.y = slideY(p.x); p.vy = 0; p.grounded = true; on = 'slide'; }
      else if (wasGrounded && p.on === 'slide' && p.vy >= 0 && p.x > SL.x0 && p.x < SL.x1) { p.y = slideY(p.x); p.vy = 0; p.grounded = true; on = 'slide'; }
      if (!on && p.y >= GY) { p.y = GY; p.vy = 0; p.grounded = true; on = 'ground'; }
      if (!wasGrounded && !p.grounded) p.airTop = Math.min(p.airTop ?? p.y, p.y);
      // landing
      if (p.grounded && !wasGrounded) {
        SFX.step();
        if (on === 'ground' && p.from !== 'ground' && p.from !== 'tramp' && p.from !== 'deck') {
          if (inZone(p.x, 'pit')) { p.landed = true; this.mishap(g, o, 'Oops! Soft wood chips!'); burst(p.x - o.cam, GY, 14, { colors: ['#b07a4a', '#d8a870', '#8a5a34'], spread: 90, up: 40, size: [3, 5] }); }
          else if (inZone(p.x, 'pool')) { p.landed = true; this.mishap(g, o, 'Splash!'); noise(0.3, 0.06); burst(p.x - o.cam, GY, 16, { colors: ['#bfe8ff', '#ffffff', '#7fcfff'], spread: 110, up: 90, size: [3, 6] }); }
          else if (inZone(p.x, 'bridge') && p.from === 'plank') { this.mishap(g, o, 'Whoops! Keep going!'); burst(p.x - o.cam, GY, 10, { colors: ['#f5dfa8', '#fff'], spread: 70, up: 30 }); }
          else if (inZone(p.x, 'wall') && p.from === 'wall') { this.mishap(g, o, 'Oof! Try again!'); burst(p.x - o.cam, GY, 10, { colors: ['#f5dfa8', '#fff'], spread: 70, up: 30 }); }
        }
        if (p.from === 'tramp' && on && on.kind === 'deck') { SFX.hit(); }
        p.from = on && on.kind ? on.kind : on === 'slide' ? 'slide' : 'ground';
        if (on === 'slide') tone(900, 0.9, 'sine', 0.05, 0, 300);
      }
      if (p.grounded) p.from = on && on.kind ? on.kind : on === 'slide' ? 'slide' : 'ground';
      p.on = on;
      const wet = p.grounded && on === 'ground' && (inZone(p.x, 'pit') ? 'pit' : inZone(p.x, 'pool') ? 'pool' : null);
      if (wet && p.wet !== wet) { if (!p.landed) this.mishap(g, o, wet === 'pit' ? 'Into the wood chips!' : 'Splish splash!'); p.wet = wet; }
      if (!wet && p.grounded) p.wet = null;
      p.landed = false;
      // monkey bars: in the air, a hand near a bar grabs it
      if (!p.grounded && p.grabCD <= 0) {
        for (const b of L.bars) {
          if (b === p.lastBar && p.grabCD > -0.2) continue;
          const hx = p.x + p.face * 6, hy = p.y - 108;
          // she catches a bar that passes between her hands and her waist
          if (Math.abs(hx - b.x) < o.grabR * 0.7 && hy < b.y + o.grabR * 0.6 && p.y > b.y + 50) {
            p.mode = 'hang'; p.bar = b; p.th = clamp(Math.asin(clamp((p.x - b.x) / R, -0.95, 0.95)), -1, 1);
            p.om = clamp(p.vx / R, -4, 4); p.vx = 0; p.vy = 0; p.lastOm = p.om;
            SFX.pick(); tone(660, 0.1, 'triangle', 0.08);
            return;
          }
        }
      }
      if (p.grabCD <= 0 && p.lastBar && p.grounded) p.lastBar = null;
      // ladders (on the towers) climb themselves when you walk into them
      if (p.grounded && on === 'ground') for (const l of L.ladders) if (p.x + HW > l.x && p.x - HW < l.x + l.w) { p.mode = 'ladder'; p.ladder = l; p.vx = 0; break; }
      if (o.rope && p.grounded && on === 'ground' && p.x > WALL.x1 - 40) { p.mode = 'ladder'; p.ladder = { x: WALL.x1 - 26, w: 26, top: [WALL.x1 + 30, WALL.top] }; p.vx = 0; }
    },

    // ---- climbing wall ----
    tryGrab(g, o) {
      const p = o.p, hy = p.y - 100;
      let best = null, bd = 1e9;
      for (const h of o.L.holds) { if (h.gone) continue; const d = Math.hypot(h.x - p.x, h.y - hy); if (d < o.reach && d < bd) { bd = d; best = h; } }
      if (!best) return false;
      p.mode = 'climb'; p.hold = null; p.tw = { fx: p.x, fy: p.y, h: best, k: 0 }; p.vx = 0; p.vy = 0; p.jbuf = 0;
      return true;
    },
    climbStep(g, o, dt, inp, jump) {
      const p = o.p;
      if (p.tw) {
        p.tw.k = Math.min(1, p.tw.k + dt / 0.22);
        const h = p.tw.h, k = ease(p.tw.k);
        p.x = lerp(p.tw.fx, h.x - 4, k); p.y = lerp(p.tw.fy, h.y + 100, k);
        if (p.tw.k >= 1) {
          if (h.top) { p.mode = 'run'; p.x = h.x; p.y = WALL.top; p.grounded = true; p.on = o.L.plats.find(q => q.kind === 'walltop'); p.from = 'walltop'; SFX.hit(); burst(p.x - o.cam, p.y - 40, 14); p.tw = null; return; }
          p.hold = h; h.hold = 0; p.slip = 0; p.tw = null;
          tone(523 + (GY - h.y) * 1.2, 0.1, 'triangle', 0.08);
        }
        return;
      }
      const h = p.hold;
      if (!h) { p.mode = 'run'; return; }
      h.hold += dt;
      let fall = false;
      if (h.kind === 'crumbly' && h.hold > o.crumbleT) { h.gone = 4; fall = true; floatText(h.x - o.cam, h.y - 30, 'Crumble!', '#e0c0a0', false, 18); noise(0.3, 0.05); burst(h.x - o.cam, h.y, 10, { colors: ['#b8a090', '#8a7060'], spread: 60, up: 10 }); }
      if (h.kind === 'slippery') { p.slip += dt * 40; if (p.slip > 46) { fall = true; floatText(h.x - o.cam, h.y - 30, 'Slippy!', '#bfe8ff', false, 18); } }
      p.x = h.x - 4; p.y = h.y + 100 + p.slip;
      if (fall || inp.down) { p.mode = 'run'; p.from = 'wall'; p.hold = null; p.vy = 0; p.grounded = false; p.airTop = p.y; return; }
      // pick the next hold: up (with left/right to lean that way), or sideways, or tap one
      let dir = null;
      if (jump || pressed.arrowup || pressed.w) dir = [inp.ax, -1];
      else if (pressed.arrowleft || pressed.a) dir = [-1, 0];
      else if (pressed.arrowright || pressed.d) dir = [1, 0];
      let target = null;
      const cands = o.L.holds.filter(q => !q.gone && q !== h);
      if (inp.tap) {
        const [tx, ty] = inp.tap;
        const q = cands.find(q => Math.hypot(q.x - tx, q.y - ty) < 40);
        if (q && Math.hypot(q.x - h.x, q.y - h.y) < o.reach) target = q;
        else if (!q && ty < p.y - 60) dir = [Math.sign(tx - p.x) * (Math.abs(tx - p.x) > 60 ? 1 : 0), -1];
      }
      if (!target && dir) {
        if (dir[1] < 0 && h.y < WALL.top + 80) target = { x: clamp(h.x, WALL.x0 + 20, WALL.x1 - 10), y: WALL.top - 100, top: true };
        else {
          let bs = 1e9;
          for (const q of cands) {
            const dx = q.x - h.x, dy = q.y - h.y, d = Math.hypot(dx, dy);
            if (d > o.reach) continue;
            if (dir[1] < 0 && dy > -25) continue;
            if (dir[1] === 0 && (dx * dir[0] < 25 || Math.abs(dy) > 70)) continue;
            let sc = d + (dir[1] < 0 ? Math.abs(dx) * 0.6 : 0);
            if (dir[1] < 0 && dir[0] && dx * dir[0] < 0) sc += 200;
            if (sc < bs) { bs = sc; target = q; }
          }
        }
        if (!target && dir) { p.nudge = 0.3; }
      }
      if (target) { p.tw = { fx: p.x, fy: p.y, h: target, k: 0 }; p.hold = null; SFX.step(); }
    },

    // ---- moving things: tires, planks, balls, ribbons, holds, Maya ----
    world(g, o, dt) {
      const L = o.L, p = o.p;
      for (const pl of L.plats) {
        const before = pl.y;
        if (pl.kind === 'tire') pl.y = pl.y0 + Math.sin(o.t * pl.spd + pl.ph) * pl.amp;
        if (pl.kind === 'plank') {
          if (pl.gone) { pl.gone -= dt; pl.y += (pl.vy += G * 0.6 * dt) * dt; if (pl.gone <= 0) { pl.gone = 0; pl.y = pl.y0; pl.vy = 0; pl.st = 0; } }
          else if (p.on === pl && p.mode === 'run') {
            pl.st += dt;
            if (pl.st > pl.fallT) { pl.gone = 2.6; p.on = null; p.grounded = false; p.from = 'plank'; p.airTop = p.y; tone(160, 0.3, 'sawtooth', 0.04, 0, 90); }
          } else pl.st = Math.max(0, pl.st - dt * 0.6);
        }
        pl.dy = pl.y - before;
      }
      L.tramp.squash = Math.max(0, L.tramp.squash - dt * 3);
      for (const h of L.holds) if (h.gone) { h.gone -= dt; if (h.gone <= 0) h.gone = 0; }
      // balls
      for (const s of L.spawners) {
        s.t -= dt;
        if (s.t <= 0 && Math.abs(p.x - (s.x0 + s.x1) / 2) < 700) { s.t = s.per * rand(0.8, 1.2); L.balls.push({ x: s.x1, y: GY, v: -s.v * rand(0.85, 1.1), r: 20, rot: 0, x0: s.x0 - 40, col: pick(['#ff5f7e', '#40b0ff', '#ffd23a']), hop: 0 }); }
      }
      if (!o.slideBall && p.x > WALL.x1 && p.y <= WALL.top + 2) { o.slideBall = true; L.balls.push({ x: SL.x0 + 180, y: slideY(SL.x0 + 180), v: 210, r: 22, rot: 0, slide: true, x0: -1, x1: WORLD_W, col: '#ff8a3a', hop: 0 }); }
      for (const b of L.balls) {
        b.x += b.v * dt; b.rot += b.v * dt / b.r;
        b.y = b.slide && b.x < SL.x1 ? slideY(b.x) : GY;
        if (b.slide && b.x > SL.x0) b.v = Math.min(b.v + 160 * dt, b.x < SL.x1 ? 330 : 260);
        b.hop = Math.abs(Math.sin(b.x * 0.03)) * 6;
        const by = b.y - b.r - b.hop;
        if (p.inv <= 0 && p.mode === 'run' && Math.abs(b.x - p.x) < b.r + HW - 2 && p.y > by - b.r + 6 && p.y - BH < by + b.r) {
          p.inv = 1.3; p.stun = 0.5; p.vx = -Math.sign(b.x - p.x || 1) * 220; p.vy = -380; p.grounded = false; p.from = 'ball'; p.on = null;
          this.mishap(g, o, 'Bonk!', 0.6); tone(260, 0.2, 'square', 0.05, 0, 140);
        }
      }
      L.balls = L.balls.filter(b => (b.v < 0 ? b.x > b.x0 : b.x < (b.x1 || WORLD_W)));
      // ribbons
      for (const r of L.ribbons) {
        if (r.got) continue;
        if (Math.abs(r.x - p.x) < HW + 18 && r.y > p.y - BH - 16 && r.y < p.y + 10) {
          r.got = true; o.ribbons++;
          o.flying.push({ x: r.x - o.cam, y: r.y, t: 0, col: r.col });
          SFX.pick(); burst(r.x - o.cam, r.y, 10, { colors: ['#ff8fc8', '#fff6a8', '#ffffff'], spread: 90, up: 60 });
          tone(880 + (o.ribbons % 5) * 110, 0.12, 'triangle', 0.07, 0.05);
        }
      }
      // stuck at the climbing wall for a while? a rope ladder drops down to help
      if (inZone(p.x, 'wall') || p.mode === 'climb') o.wallT += dt;
      if (!o.rope && o.wallT > [0, 14, 18, 22][g.tier] && p.x < WALL.x1 + 4) { o.rope = true; o.msg = { str: 'Maya threw down a rope ladder!', t: 2.5, good: true }; speak('Here, use the rope ladder!'); }
      // lead changes
      const lead = p.x - this.mayaX(o) > 60 ? 1 : this.mayaX(o) - p.x > 60 ? -1 : o.lead || 0;
      if (lead !== (o.lead || 0) && o.t > 2) { o.msg = { str: lead > 0 ? "You're in front!" : "Maya's ahead! Hurry!", t: 1.6, good: lead > 0 }; }
      o.lead = lead;
    },

    finish(g, o) {
      o.mode = 'finish'; o.fin = 0;
      o.won = o.p.x >= FINISH && o.t < o.mayaT;
      SFX.fanfare();
      for (let i = 0; i < 3; i++) burst(FINISH - o.cam - 40 + i * 50, 260, 16, { kind: 'emoji', colors: ['🎉', '🎊', '🎀', '⭐'], spread: 220, up: 160, size: [3, 5] });
      speak(o.won ? 'You win! You beat Maya!' : 'Maya won the race! Great running!');
      g.progress = 'Finish!';
      this.score(g, o);
    },
    finishUpdate(g, o, dt) {
      o.fin += dt; o.t += dt;
      const p = o.p;
      if (p.x < FINISH + 40 && o.p.x >= FINISH - 400) { p.x += 200 * dt; }
      if (p.mode !== 'run') { p.mode = 'run'; }
      if (p.y < GY && p.on !== 'slide') { p.y = Math.min(GY, p.y + 300 * dt); }
      o.cam = lerp(o.cam, clamp(p.x - 330, 0, WORLD_W - W), Math.min(1, dt * 6));
      o.flying.forEach(f => { f.t += dt; }); o.flying = o.flying.filter(f => f.t < 0.8);
      if (o.fin > 3) g.done = true;
      this.score(g, o);
    },

    // =========================================================================================
    // drawing
    // =========================================================================================
    draw(g) {
      const o = g.pr, cam = Math.round(o.cam), p = o.p;
      BACKDROPS.playground(cam);
      ctx.fillStyle = 'rgba(255,250,255,.22)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(-cam, 0);
      // Maya's own lane, behind everything
      const mx = Math.min(this.mayaX(o), FINISH + 60);
      if (g.phase !== 'result' && mx > cam - 80 && mx < cam + W + 80) {
        const hop = Math.abs(Math.sin(o.t * 11)) * 10;
        ctx.save(); ctx.globalAlpha = 0.95; drawCritter('Maya', mx, GY - 36 - hop, 0.36, 1); ctx.restore();
      }
      this.drawCourse(g, o, cam);
      this.drawAubrey(g, o);
      ctx.restore();
      if (g.phase === 'result') return;
      this.drawStrip(g, o);
      this.drawHints(g, o);
      if (o.mode === 'finish') {
        panel(W / 2 - 200, 170, 400, 92, 24);
        outlined(o.won ? 'YOU WIN!' : o.p.x >= FINISH ? 'Maya wins!' : "Time's up!", W / 2, 204, 36, o.won ? '#ff6fb5' : '#ff9a3a', 'center', '#fff');
        text(o.won ? 'You beat Maya to the finish!' : 'Great running! Try again to beat her!', W / 2, 240, 18, '#5a2a6e', 'center', 600);
      }
    },
    drawHints(g, o) {
      const p = o.p, ctxHint = (p.mode === 'hang' && o.station === 1) || p.mode === 'climb' || (p.mode === 'run' && inZone(p.x, 'wall') && p.grounded);
      if (o.hint > 0 && o.mode !== 'finish' && !ctxHint) {
        ctx.globalAlpha = clamp(o.hint, 0, 1);
        darkPanel(W / 2 - 300, H - 66, 600, 50, 20);
        text('← → run    SPACE jump    or: hold your finger where to go, tap above Aubrey to jump', W / 2, H - 41, 15, '#fff', 'center', 600);
        ctx.globalAlpha = 1;
      }
      if (p.mode === 'hang' && o.station === 1) {
        darkPanel(W / 2 - 190, H - 60, 380, 44, 20);
        text('Hold → to swing … then JUMP to let go!', W / 2, H - 38, 17, '#fff', 'center', 700);
      }
      if (p.mode === 'climb') {
        darkPanel(W / 2 - 210, H - 60, 420, 44, 20);
        text('⬆ climb   ← → move   or tap a hold', W / 2, H - 38, 17, '#fff', 'center', 700);
      } else if (p.mode === 'run' && inZone(p.x, 'wall') && p.grounded) {
        darkPanel(W / 2 - 190, H - 60, 380, 44, 20);
        text('Press ⬆ or JUMP to grab the wall!', W / 2, H - 38, 17, '#fff', 'center', 700);
      }
    },

    drawCourse(g, o, cam) {
      const L = o.L, vis = (x0, x1) => x1 > cam - 40 && x0 < cam + W + 40;
      // --- start line
      if (vis(40, 140)) { tubes([[[60, GY], [60, GY - 120]], '#fff', 5]); ink(P2(`M60,${GY - 120} L108,${GY - 106} L60,${GY - 92} Z`), '#5fd38a', 2); outlined('START', 60, GY + 22, 16, '#fff'); }
      // --- kids kicking balls
      for (const s of L.spawners) if (s.per < 50 && vis(s.x1 - 30, s.x1 + 60)) { drawCritter('Leo', s.x1 + 40, GY - 4, 0.3, -1) || emoji('🧒', s.x1 + 40, GY - 30, 48); }
      // --- monkey bars: towers, ladders, wood-chip pit
      if (vis(520, 1240)) {
        ctx.fillStyle = '#c98a4a'; ctx.beginPath(); ctx.roundRect(640, GY - 8, ZONES.pit[1] - 630, 40, 10); ctx.fill();
        ctx.fillStyle = '#a86a34'; for (let i = 0; i < 40; i++) { const x = 650 + (i * 53) % (ZONES.pit[1] - 660), y = GY + (i * 17) % 22; ellipse(x, y, 6, 3, i); }
        const towers = L.solids.filter(s => s.kind === 'tower' && s.x < 1300);
        for (const s of towers) this.tower(s, ['#ff6fae', '#40b0ff'][s.x < 1000 ? 0 : 1]);
        for (const l of L.ladders) this.ladder(l.x, l.y, l.w, l.h);
        const x0 = L.bars[0].x - 46, x1 = L.bars[L.bars.length - 1].x + 46, D = [14, -16];
        tubes([[[x0 + D[0], BY + D[1]], [x1 + D[0], BY + D[1]]], '#2f8fe0', 9]);
        tubes([[[x0, BY + 6], [x0, TT]], '#ff5f7e', 9], [[[x1, BY + 6], [x1, TT]], '#ff5f7e', 9],
          ...L.bars.map(b => [[[b.x, BY], [b.x + D[0], BY + D[1]]], '#ffd83a', 8]), [[[x0, BY], [x1, BY]], '#40b0ff', 10]);
      }
      // --- sprinkler pool with bobbing tires
      if (vis(1260, 1940)) {
        const [a, b] = ZONES.pool;
        ctx.fillStyle = '#8fd8ff'; ctx.beginPath(); ctx.roundRect(a, GY - 10, b - a, 50, 14); ctx.fill();
        ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) { const x = a + 30 + i * 50 + Math.sin(o.t * 2 + i) * 8; ctx.beginPath(); ctx.moveTo(x, GY + 2); ctx.quadraticCurveTo(x + 10, GY - 2, x + 20, GY + 2); ctx.stroke(); }
        // the sprinkler, spraying arcs of water
        const sx = 1600; inkRect(sx - 8, GY - 30, 16, 26, '#3fc060', 2, 4); inkCircle(sx, GY - 32, 8, '#ffd83a', 1.6);
        ctx.fillStyle = 'rgba(160,220,255,.8)';
        for (let i = 0; i < 14; i++) { const k = ((o.t * 0.8 + i / 14) % 1), dir = i % 2 ? 1 : -1, sp = 0.5 + (i % 3) * 0.25; circle(sx + dir * k * 140 * sp, GY - 32 - Math.sin(k * Math.PI) * 120 * sp, 3.2); }
        for (const pl of L.plats) if (pl.kind === 'tire') this.tire(pl.x + pl.w / 2, pl.y + 10, pl.col);
      }
      // --- wobbly bridge
      if (vis(1980, 2840)) {
        const planks = L.plats.filter(q => q.kind === 'plank');
        const xa = planks[0].x - 10, xb = planks[planks.length - 1].x + planks[planks.length - 1].w + 10;
        for (const s of L.solids) if (s.kind === 'step') inkAll([[pR(s.x, s.y, s.w, s.h + 4, 5), '#c98a4a']], 2.2);
        tubes([[[xa, GY - 210], [xa, GY - 100]], '#9a6a44', 8], [[[xb, GY - 210], [xb, GY - 100]], '#9a6a44', 8]);
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(xa, GY - 200); ctx.quadraticCurveTo((xa + xb) / 2, GY - 140, xb, GY - 200); ctx.stroke();
        for (const pl of planks) {
          const shake = pl.st > pl.fallT * 0.4 && !pl.gone ? Math.sin(o.t * 50) * 2.5 * (pl.st / pl.fallT) : 0;
          const cx = pl.x + pl.w / 2, ry = GY - 200 + 60 * (1 - ((cx - (xa + xb) / 2) / ((xb - xa) / 2)) ** 2);
          if (!pl.gone) { ctx.strokeStyle = 'rgba(138,106,74,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, ry); ctx.lineTo(cx + shake, pl.y); ctx.stroke(); }
          ctx.globalAlpha = pl.gone ? clamp(pl.gone - 1.8, 0, 1) : 1;
          inkAll([[pR(pl.x + shake, pl.y, pl.w, 14, 5), pl.st > pl.fallT * 0.4 ? '#e8a060' : '#d89a5a']], 2);
          ctx.fillStyle = 'rgba(120,70,30,.3)'; ctx.fillRect(pl.x + shake + 22, pl.y + 3, 2, 8); ctx.fillRect(pl.x + shake + 50, pl.y + 3, 2, 8);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#f5dfa8'; ctx.beginPath(); ctx.roundRect(xa, GY - 4, xb - xa, 26, 10); ctx.fill();
      }
      // --- trampoline and the high treehouse deck
      if (vis(2840, 3260)) {
        // the trampoline: splayed legs, a stretchy black mat that sags when you land, and a padded rim
        const tr = L.tramp, sq = tr.squash * 14, cx = tr.x + tr.w / 2;
        tubes([[[tr.x + 4, GY], [tr.x + 16, tr.y + 6], [tr.x + 30, GY]], '#5a4a9a', 6], [[[tr.x + tr.w - 4, GY], [tr.x + tr.w - 16, tr.y + 6], [tr.x + tr.w - 30, GY]], '#5a4a9a', 6]);
        ctx.strokeStyle = '#9aa0b0'; ctx.lineWidth = 2;
        for (let i = 0; i <= 8; i++) { const x = tr.x + 8 + i * (tr.w - 16) / 8, k = 1 - ((x - cx) / (tr.w / 2)) ** 2; ctx.beginPath(); ctx.moveTo(x, tr.y + 2); ctx.lineTo(x, tr.y + 6 + sq * k); ctx.stroke(); }
        inkAll([[P2(`M${tr.x + 8},${tr.y + 4} Q${cx},${tr.y + 10 + sq * 2} ${tr.x + tr.w - 8},${tr.y + 4} Q${cx},${tr.y + 16 + sq * 2} ${tr.x + 8},${tr.y + 4} Z`), '#2a2438']], 1.6);
        inkAll([[pR(tr.x - 10, tr.y - 6, 26, 12, 6), '#40b0ff'], [pR(tr.x + tr.w - 16, tr.y - 6, 26, 12, 6), '#40b0ff']], 2);
        if (o.p.x < tr.x + tr.w && o.p.x > tr.x - 300 && tr.squash < 0.1) { const yy = tr.y - 30 + Math.sin(o.t * 6) * 5; ctx.fillStyle = '#fff'; outlined('BOING!', cx, yy - 10, 16, '#ffd83a'); }
        const d = L.plats.find(q => q.kind === 'deck');
        tubes([[[d.x + 14, GY], [d.x + 14, d.y]], '#9a6a44', 10], [[[d.x + d.w - 14, GY], [d.x + d.w - 14, d.y]], '#9a6a44', 10]);
        inkAll([[pR(d.x - 6, d.y, d.w + 12, 18, 6), '#d89a5a'], [P2(`M${d.x - 14},${d.y - 70} L${d.x + d.w / 2},${d.y - 112} L${d.x + d.w + 14},${d.y - 70} Z`), '#ff6fae']], 2.4);
        tubes([[[d.x + 4, d.y], [d.x + 4, d.y - 72]], '#9a6a44', 6], [[[d.x + d.w - 4, d.y], [d.x + d.w - 4, d.y - 72]], '#9a6a44', 6]);
      }
      // --- climbing wall, slide tower and slide
      if (vis(3260, 4200)) {
        inkAll([[pR(WALL.x0, WALL.top, WALL.x1 - WALL.x0, GY - WALL.top + 2, 8), '#ffb877']], 2.5);
        ctx.fillStyle = '#ff9a5a'; ctx.fillRect(WALL.x0 + 3, WALL.top + 3, WALL.x1 - WALL.x0 - 6, 12);
        ctx.strokeStyle = 'rgba(150,80,40,.25)'; ctx.lineWidth = 2;
        for (let y = WALL.top + 60; y < GY; y += 54) { ctx.beginPath(); ctx.moveTo(WALL.x0 + 4, y); ctx.lineTo(WALL.x1 - 4, y); ctx.stroke(); }
        for (const h of L.holds) this.hold(h, o);
        const tw = L.solids.find(s => s.kind === 'tower' && s.x === WALL.x1);
        this.tower(tw, '#9c6cff');
        if (o.rope) { this.ladder(WALL.x1 - 26, WALL.top, 26, GY - WALL.top, '#e8c08a'); }
        // the slide
        const pts = []; for (let x = SL.x0 - 6; x <= SL.x1 + 30; x += 14) pts.push([x, x > SL.x1 ? SL.y1 : slideY(x)]);
        tubes([pts.map(([x, y]) => [x, y + 12]), '#c4407a', 22]);
        tubes([pts.map(([x, y]) => [x, y + 6]), '#ff6fb5', 16]);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 2) : ctx.moveTo(x, y + 2))); ctx.stroke();
        for (const x of [SL.x0 + 160, SL.x0 + 330]) tubes([[[x, slideY(x) + 18], [x, GY]], '#ff5f7e', 8]);
      }
      // --- finish arch
      if (vis(FINISH - 60, FINISH + 120)) {
        const fx = FINISH;
        tubes([[[fx - 50, GY], [fx - 50, 300]], '#ff5f7e', 10], [[[fx + 50, GY], [fx + 50, 300]], '#ff5f7e', 10]);
        inkAll([[pR(fx - 66, 268, 132, 40, 8), '#fff']], 2.5);
        ctx.save(); ctx.beginPath(); ctx.roundRect(fx - 66, 268, 132, 40, 8); ctx.clip();
        for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { ctx.fillStyle = '#3d2c4a'; ctx.fillRect(fx - 66 + i * 10, 268 + j * 10, 10, 10); }
        ctx.restore();
        outlined('FINISH', fx, 288, 20, '#ffd83a');
      }
      // --- ribbons and balls
      for (const r of L.ribbons) if (!r.got && vis(r.x - 20, r.x + 20)) { glow(r.x, r.y, 34, '255,220,240', 0.6); bow(r.x, r.y + Math.sin(o.t * 3 + r.ph) * 4, 0.82, r.col, Math.sin(o.t * 2 + r.ph) * 0.15); }
      for (const b of L.balls) if (vis(b.x - 30, b.x + 30)) this.ball(b);
    },
    tower(s, roof) {
      inkAll([[pR(s.x, s.y, s.w, s.h + 4, 4), '#ffe7b0'], [P2(`M${s.x - 12},${s.y - 54} L${s.x + s.w / 2},${s.y - 96} L${s.x + s.w + 12},${s.y - 54} Z`), roof]], 2.5);
      tubes([[[s.x + 6, s.y], [s.x + 6, s.y - 56]], '#ffd83a', 6], [[[s.x + s.w - 6, s.y], [s.x + s.w - 6, s.y - 56]], '#ffd83a', 6]);
      inkAll([[pR(s.x - 4, s.y - 8, s.w + 8, 14, 5), '#40b0ff']], 2);
      ctx.fillStyle = 'rgba(200,140,80,.25)'; for (let y = s.y + 30; y < s.y + s.h; y += 30) ctx.fillRect(s.x + 4, y, s.w - 8, 3);
      inkCircle(s.x + s.w / 2, s.y + 50, 16, '#bfe6ff', 2);
    },
    ladder(x, y, w, h, col = '#ffd83a') {
      const list = [[[[x, y + h], [x, y - 6]], '#ff5f7e', 6], [[[x + w, y + h], [x + w, y - 6]], '#ff5f7e', 6]];
      for (let yy = y + 18; yy < y + h; yy += 26) list.push([[[x, yy], [x + w, yy]], col, 5]);
      tubes(...list);
    },
    tire(x, y, col) {
      const rx = 40, ry = 15;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = 'rgba(40,60,120,.18)'; ellipse(0, 22, rx + 6, 6);
      inkAll([[pE(0, 2, rx, ry + 6), '#3a3448']], 2.2);
      ctx.fillStyle = col; ellipse(0, -2, rx - 4, ry + 1);
      ctx.fillStyle = '#4a3a3a'; ellipse(0, -1, rx * 0.5, ry * 0.42);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-rx * 0.45, -ry * 0.55, rx * 0.25, 3);
      ctx.strokeStyle = 'rgba(60,40,70,.35)'; ctx.lineWidth = 2;
      for (let a = 0; a < TAU; a += TAU / 12) { const c = Math.cos(a), s = Math.sin(a); ctx.beginPath(); ctx.moveTo(c * rx * 0.62, s * ry * 0.62); ctx.lineTo(c * rx * 0.88, s * ry * 0.88); ctx.stroke(); }
      ctx.restore();
    },
    hold(h, o) {
      if (h.gone) return;
      const SH = {
        circle: () => pE(0, 0, 18, 18),
        star: () => { const q = new Path2D(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 21, a = i * Math.PI / 5 - Math.PI / 2; q.lineTo(Math.cos(a) * r, Math.sin(a) * r + 2); } q.closePath(); return q; },
        heart: () => P2('M0,16 C-22,3 -22,-16 -9,-16 C-3,-16 0,-11 0,-8 C0,-11 3,-16 9,-16 C22,-16 22,3 0,16 Z'),
        tri: () => P2('M0,-19 C3,-19 20,13 19,16 C17,19 -17,19 -19,16 C-20,13 -3,-19 0,-19 Z'),
        blob: () => P2('M-17,-4 C-19,-17 -1,-20 7,-16 C20,-10 20,7 11,14 C3,20 -16,16 -17,-4 Z'),
      };
      const sh = h.kind === 'slippery' ? '#7fd0ff' : h.kind === 'crumbly' ? '#b8a090' : h.col;
      const held = o.p.hold === h, wob = held && h.kind === 'crumbly' ? Math.sin(o.t * 40) * 2 * (h.hold / o.crumbleT) : 0;
      ctx.save(); ctx.translate(h.x + wob, h.y);
      inkAll([[SH[h.shape](), sh]], 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-6, -7, 5, 3, -0.5);
      if (h.kind === 'crumbly') { ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-1, -2); ctx.lineTo(-5, 4); ctx.moveTo(4, -8); ctx.lineTo(8, 2); ctx.stroke(); }
      if (h.kind === 'slippery') { ctx.fillStyle = '#bfe8ff'; const d = (o.t * 30) % 20; ellipse(5, 10 + d, 2.5, 4); ellipse(-7, 6 + ((d + 9) % 20), 2, 3); }
      ctx.restore();
    },
    ball(b) {
      const y = b.y - b.r - b.hop;
      ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(b.x, b.y + 2, b.r, 4);
      ctx.save(); ctx.translate(b.x, y); ctx.rotate(b.rot);
      inkCircle(0, 0, b.r, b.col, 2.2);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, b.r * 0.35, b.r - 1, 0, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(b.x - b.r * 0.35, y - b.r * 0.4, b.r * 0.25, b.r * 0.15, -0.5);
    },

    drawAubrey(g, o) {
      const p = o.p, s = 0.5, t = o.t;
      if (o.mode === 'finish' && p.x >= FINISH + 30) { shadow(p.x, GY + 2, 22); aub(p.x, GY + 2 - Math.abs(Math.sin(t * 6)) * 14, 'twirl', 1, 0.52); return; }
      if (p.inv > 0 && Math.sin(t * 30) > 0.3 && p.inv < 1.1) ctx.globalAlpha = 0.5;
      if (p.mode === 'hang') {
        const b = p.bar, hh = IMG.jump.height * 0.56;
        // arms up to the bar from behind her shoulders, then her body hanging and swinging
        const sx = b.x + Math.sin(p.th) * (R - hh * 0.42), sy = b.y + Math.cos(p.th) * (R - hh * 0.42);
        arm(sx - 7, sy, b.x - 7, b.y + 2); arm(sx + 7, sy, b.x + 7, b.y + 2);
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(-p.th); aub(0, R + 6, 'jump', p.face, 0.56); ctx.restore();
      } else if (p.mode === 'climb' || p.mode === 'ladder') {
        const top = p.y - IMG.idle_back.height * s;
        aub(p.x, p.y + 2, 'idle_back', 1, s);
        const h = p.hold || (p.tw && p.tw.h);
        if (h && !h.top) arm(p.x + 8, top + 32, h.x, h.y);
        if (p.mode === 'ladder') { arm(p.x - 9, top + 32, p.x - 10, top + 6 + Math.sin(t * 12) * 6); arm(p.x + 9, top + 32, p.x + 10, top + 6 - Math.sin(t * 12) * 6); }
      } else {
        const ground = p.on === 'slide' ? slideY(p.x) : p.grounded ? p.y : GY;
        shadow(p.x, Math.min(GY, ground) + 2, p.grounded ? 22 : 16);
        if (p.on === 'slide') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(0.35); aub(0, 6, 'jump', 1, s); ctx.restore();
        } else {
          const frame = p.stun > 0 ? 'crouch' : !p.grounded ? 'jump' : Math.abs(p.vx) > 40 ? runFrame(t) : 'idle_front';
          aub(p.x, p.y + 3, frame, p.face, frame === 'crouch' ? 0.46 : s);
        }
      }
      ctx.globalAlpha = 1;
    },

    // progress strip: both racers' faces along a little map of the course
    drawStrip(g, o) {
      const x0 = 160, x1 = 744, y = 82;
      darkPanel(x0 - 34, 62, x1 - x0 + 68, 44, 22);
      const px = x => x0 + (x1 - x0) * clamp(x / FINISH, 0, 1);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px(0), y); ctx.lineTo(px(FINISH), y); ctx.stroke();
      STATIONS.slice(1).forEach(st => this.stripIcon(st.icon, px(st.x + 60), y));
      const bob = v => Math.abs(Math.sin(S.t * 10 + v)) * 3;
      const mx = px(this.mayaX(o)), my = y + 2 - bob(1);
      ctx.save(); ctx.beginPath(); ctx.arc(mx, my, 17, 0, TAU); ctx.clip();
      drawCritterPortrait('Maya', mx - 24, my - 22, 48, 54); ctx.restore();
      ctx.strokeStyle = '#ff9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx, my, 17, 0, TAU); ctx.stroke();
      const ax = px(o.p.x), ay = y - 2 - bob(0);
      ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, 18, 0, TAU); ctx.fillStyle = '#ffd6ea'; ctx.fill(); ctx.clip();
      ctx.drawImage(IMG.face_happy, ax - 19, ay - 20, 38, 42); ctx.restore();
      ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, 18, 0, TAU); ctx.stroke();
      // ribbon counter
      darkPanel(12, 62, 104, 44, 22);
      bow(40, 82, 0.62, '#ff4f9a');
      text(`× ${o.ribbons}`, 62, 84, 20, '#fff', 'left', 700);
      if (o.msg) {
        ctx.globalAlpha = clamp(o.msg.t * 2, 0, 1);
        outlined(o.msg.str, W / 2, 132, 26, o.msg.good ? '#9dffb0' : '#ffd0a0');
        ctx.globalAlpha = 1;
      }
      o.flying.forEach(f => { const k = ease(Math.min(1, f.t / 0.8)); bow(lerp(f.x, 40, k), lerp(f.y, 82, k) - Math.sin(k * Math.PI) * 60, 0.8 - 0.2 * k, f.col, k * 6); });
    },
    stripIcon(kind, x, y) {
      ctx.save(); ctx.translate(x, y);
      if (kind === 'bars') tubes([[[-11, 8], [-11, -8], [11, -8], [11, 8]], '#40b0ff', 3]);
      else if (kind === 'tire') { inkEllipse(0, 2, 11, 6, 0, '#ffd23a', 1.4); ctx.fillStyle = '#4a3a3a'; ellipse(0, 2, 5, 2.5); }
      else if (kind === 'bridge') { ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(0, 6, 12, -6); ctx.stroke(); inkRect(-10, 2, 8, 4, '#d89a5a', 1, 1); inkRect(2, 2, 8, 4, '#d89a5a', 1, 1); }
      else if (kind === 'tramp') { tubes([[[-10, 8], [-8, 0], [8, 0], [10, 8]], '#5a4a7a', 3]); ctx.fillStyle = '#40b0ff'; circle(0, -8, 3); }
      else if (kind === 'wall') { inkRect(-9, -9, 18, 18, '#ffb877', 1.4, 3); ctx.fillStyle = '#ff4a5a'; circle(-3, -3, 2.5); ctx.fillStyle = '#3a8aff'; circle(4, 3, 2.5); }
      else if (kind === 'slide') tubes([[[-10, -8], [-2, -6], [4, 4], [11, 8]], '#ff6fb5', 4]);
      else emoji('🏁', 0, 0, 20);
      ctx.restore();
    },
  };

  restage('playground', {
    games: [['pgobstaclerace', 'ribbon', {}], ['seesaw', 'berry', {}]],
    intro: [
      "N:Aubrey! I made an obstacle course! Monkey bars, bouncy tires, a wobbly bridge, a trampoline AND the climbing wall!",
      "N:Race you to the finish line! Grab all the ribbons you can on the way.",
      "A:determined:Ready, set... you're ON, Maya!",
    ],
  });
}
