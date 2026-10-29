'use strict';
// Sunny Playground, game 1: Playground Race. Aubrey races Maya through four playground stations, each
// its own little action: monkey bars (tap Left/Right in turn), tire hop (hop into the tire that lights
// up), swing jump (let go at the top of the swing to fly into the sand) and the climbing wall (grab the
// colour Maya calls out), then whooshes down the big slide to the finish line. Ribbons on the way reward
// clean moves; a race strip at the top shows who is ahead.
{
  const TAU = Math.PI * 2;
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
  const TR = 1.3;                     // seconds of running between stations
  const SKIN = '#f4cdb6';
  const pE = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
  const pR = (x, y, w, h, r = 4) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
  // outline every shape first, then fill them all, so overlapping parts read as one solid thing
  function inkAll(pairs, lw = 2.5) {
    ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of pairs) ctx.stroke(p);
    for (const [p, f] of pairs) { ctx.fillStyle = f; ctx.fill(p); }
  }
  // poles and rails: [points, colour, width] — all outlines, then all colours, so joints merge
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
  function arm(x0, y0, x1, y1) {
    tubes([[[x0, y0], [x1, y1]], SKIN, 7]);
    inkCircle(x1, y1, 5.5, SKIN, 1.5);
  }

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
  // a won ribbon flies up to the counter
  function grabRibbon(o, x, y, n = 1) {
    for (let i = 0; i < n; i++) o.flying.push({ x, y, t: -i * 0.15, col: RIBCOL[(o.ribbons + i) % RIBCOL.length] });
    o.ribbons += n;
    SFX.pick(); burst(x, y, 10, { colors: ['#ff8fc8', '#fff6a8', '#ffffff'], spread: 90, up: 60 });
    floatText(x, y - 30, n > 1 ? `+${n} ribbons!` : '+1 ribbon!', '#ff6fb5', false, 22);
  }

  // =========================================================================================
  // Station 1: monkey bars — tap Left, Right, Left... to swing hand over hand
  // =========================================================================================
  const BAR_Y = 226;
  const BARS = {
    name: 'Monkey bars',
    say: 'Monkey bars! Tap the glowing hand. Left, right, left, right!',
    init(g) {
      const n = [0, 6, 7, 8][g.tier];
      const xs = [...Array(n)].map((_, i) => lerp(270, 690, i / (n - 1)));
      return { n, xs, r: 0, mv: 1, want: 'R', buf: null, wob: 0, miss: 0, clean: true, rib: new Set(xs.map((_, i) => i).filter(i => i % 2 === 1)), ribTot: Math.floor(n / 2), got: 0, grab: 0, drop: -1, t: 0, idle: 0, lost: [] };
    },
    start: [270, GY], end: st => [st.xs[st.n - 1] + 40, GY],
    frac: st => (st.drop >= 0 ? 1 : clamp((st.r - 1 + st.mv) / (st.n - 1), 0, 1)),
    quality: st => clamp(1 - 0.2 * st.miss, 0, 1) * 0.75 + 0.25 * st.got / st.ribTot,
    update(g, st, dt, id, o) {
      st.t += dt; st.wob = Math.max(0, st.wob - dt); st.idle += dt;
      st.lost.forEach(l => { l.t += dt; });
      if (st.grab < 1) { st.grab = Math.min(1, st.grab + dt / 0.35); return false; }
      if (st.drop >= 0) { st.drop += dt / 0.5; if (st.drop >= 1) { SFX.step(); return true; } return false; }
      if (st.mv < 1) {
        st.mv = Math.min(1, st.mv + dt / 0.3);
        if (st.mv >= 1) this.arrive(st, o);
      }
      const h = id === 'pgL' || pressed.arrowleft || pressed.a ? 'L' : id === 'pgR' || pressed.arrowright || pressed.d ? 'R' : null;
      if (h && st.mv < 1) { if (st.mv > 0.35) st.buf = h; } else if (h) this.hand(st, h);
      else if (st.buf && st.mv >= 1 && st.drop < 0) { const b = st.buf; st.buf = null; this.hand(st, b); }
      return false;
    },
    hand(st, h) {
      if (st.wob > 0 || st.drop >= 0) return;
      if (h === st.want) {
        st.r++; st.mv = 0; st.want = h === 'L' ? 'R' : 'L'; st.idle = 0;
        tone([523, 587, 659, 698, 784, 880, 988, 1047][st.r % 8], 0.14, 'triangle', 0.09); SFX.jump();
      } else {
        st.miss++; st.wob = 0.8; st.clean = false; st.idle = 0;
        SFX.miss(); floatText(W / 2, 170, 'Other hand!', '#ffb0c4', false, 26);
      }
    },
    arrive(st, o) {
      const x = st.xs[st.r];
      if (st.rib.has(st.r)) {
        st.rib.delete(st.r);
        if (st.clean) { st.got++; grabRibbon(o, x + 8, BAR_Y - 24); }
        else { st.lost.push({ x: x + 8, y: BAR_Y - 24, t: 0 }); floatText(x, BAR_Y - 60, 'Oops, it blew away!', '#fff', false, 18); }
      }
      st.clean = true;
      if (st.r === st.n - 1) { st.drop = 0; SFX.jump(); burst(x, BAR_Y, 14); }
    },
    rig(g, st) {
      const L = st.xs[0] - 50, R = st.xs[st.n - 1] + 50, top = BAR_Y - 34, D = [16, -18];
      shadow((L + R) / 2, GY + 4, (R - L) / 2 + 40);
      const list = [];
      // the back half of each ladder, then the back rail
      for (const x of [L, R]) for (const dx of [-22, 22]) list.push([[[x + dx + D[0], GY - 14], [x + dx + D[0], top + D[1]]], '#e0486a', 9]);
      list.push([[[L - 22 + D[0], BAR_Y + D[1]], [R + 22 + D[0], BAR_Y + D[1]]], '#2f8fe0', 10]);
      tubes(...list);
      const front = [];
      for (const x of [L, R]) {
        for (let y = GY - 40; y > BAR_Y + 10; y -= 42) front.push([[[x - 22, y], [x + 22, y]], '#ffd83a', 7]);
        for (const dx of [-22, 22]) front.push([[[x + dx, GY], [x + dx, top]], '#ff5f7e', 10]);
      }
      st.xs.forEach(x => front.push([[[x, BAR_Y], [x + D[0], BAR_Y + D[1]]], '#ffd83a', 8]));
      front.push([[[L - 22, BAR_Y], [R + 22, BAR_Y]], '#40b0ff', 10]);
      tubes(...front);
      for (const x of [L, R]) for (const dx of [-22, 22]) { inkCircle(x + dx, top, 7, '#ffd83a', 1.5); }
      // ribbons tied on every other bar
      for (const i of st.rib) bow(st.xs[i] + 8, BAR_Y - 24 + Math.sin(S.t * 3 + i) * 2, 0.8, RIBCOL[i % RIBCOL.length], Math.sin(S.t * 2 + i) * 0.15);
      st.lost.forEach(l => { if (l.t < 1.6) { ctx.globalAlpha = 1 - l.t / 1.6; bow(l.x + l.t * 90, l.y - l.t * 70 + Math.sin(l.t * 8) * 8, 0.8, '#c9a8d8', l.t * 3); ctx.globalAlpha = 1; } });
    },
    draw(g, st) {
      // hands on two bars; the back hand swings over to the next bar
      const xs = st.xs, r = st.r, k = ease(st.mv);
      let h1, h2, lift = 0;
      if (st.mv < 1) { h1 = xs[r - 1]; h2 = lerp(xs[Math.max(0, r - 2)], xs[r], k); lift = Math.sin(st.mv * Math.PI) * 26; }
      else { h1 = xs[Math.max(0, r - 1)]; h2 = xs[r]; }
      let bx = (h1 + h2) / 2, hy = BAR_Y + 4, drop = 0, frame = 'jump';
      if (st.drop >= 0) { bx = lerp(xs[st.n - 1], xs[st.n - 1] + 40, st.drop); drop = ease(st.drop); }
      const up = (1 - ease(st.grab)) * 100;
      const sway = Math.sin(st.mv * Math.PI) * 0.16 + Math.sin(st.t * 2.6) * 0.04 + (st.wob > 0 ? Math.sin(st.t * 40) * 0.12 : 0);
      const s = 0.62, h = IMG.jump.height * s;
      shadow(bx, GY + 2, 30);
      if (st.drop >= 0) {
        const fy = lerp(hy + h + 20, GY, drop);
        aub(bx, fy, drop > 0.85 ? 'crouch' : 'jump', 1, drop > 0.85 ? 0.55 : s);
        return;
      }
      const feet = hy + h + 24 + up;
      if (st.grab >= 1) {
        // arms go up from behind her shoulders (drawn first, so her body covers the joins); shoulders follow the sway
        const sy0 = feet - h * 0.6 - hy, sh = dx => [bx + Math.cos(sway) * dx + Math.sin(sway) * sy0, hy + Math.cos(sway) * sy0 - Math.sin(sway) * dx];
        const [s1x, s1y] = sh(-10), [s2x, s2y] = sh(10);
        arm(s1x, s1y, h1, BAR_Y + 2); arm(s2x, s2y, h2, BAR_Y + 2 - lift);
      }
      ctx.save(); ctx.translate(bx, hy); ctx.rotate(-sway); ctx.translate(-bx, -hy);
      aub(bx, feet, frame, 1, s);
      ctx.restore();
    },
    ui(g, st) {
      if (st.grab < 1 || st.drop >= 0) return;
      for (const [hid, x, lab, key] of [['pgL', 34, 'Left', '←'], ['pgR', W - 214, 'Right', '→']]) {
        const want = st.want === hid.slice(2) && !(g.tier === 3 && st.idle < 1.2 && st.r > 1);
        if (want) glow(x + 90, 484, 120, '255,240,120', 0.6 + 0.3 * Math.sin(S.t * 8));
        const bob = want ? Math.sin(S.t * 8) * 3 : 0;
        button(hid, x, 444 + bob, 180, 80, lab, { icon: '✋', color: want ? '#ff6fb5' : '#9a6ae0', size: 26 });
        text(key, x + 160, 470 + bob, 18, 'rgba(255,255,255,.8)', 'center', 700);
      }
    },
    mayaPose: f => [lerp(240, 720, f), GY],
  };

  // =========================================================================================
  // Station 2: tire run — hop into the tire that lights up (back row or front row)
  // =========================================================================================
  const TIRE_COLS = ['#ff6fae', '#ffd23a', '#40b0ff', '#3fc060', '#9c6cff', '#ff9a2a'];
  const ROW_Y = [GY - 34, GY + 26];
  const TIRES = {
    name: 'Tire hop',
    say: 'Tire hop! Hop into the tire that lights up. Tap it, or use the up and down arrows.',
    init(g) {
      const n = [0, 5, 6, 7][g.tier];
      const xs = [...Array(n)].map((_, i) => lerp(180, 700, i / (n - 1)));
      const lit = xs.map(() => randInt(0, 1));
      return { n, xs, lit, c: -1, hop: null, wob: 0, miss: 0, clean: true, rib: new Set(xs.map((_, i) => i).filter(i => i % 2 === 1)), ribTot: Math.floor(n / 2), got: 0, t: 0, jig: null, pos: [80, GY], done: false };
    },
    start: [80, GY], end: () => [790, GY],
    frac: st => clamp((st.c + 1 + (st.hop ? st.hop.k : 0)) / (st.n + 1), 0, 1),
    quality: st => clamp(1 - 0.2 * st.miss, 0, 1) * 0.75 + 0.25 * st.got / st.ribTot,
    update(g, st, dt, id, o) {
      st.t += dt; st.wob = Math.max(0, st.wob - dt);
      if (st.jig) { st.jig.t += dt; if (st.jig.t > 0.9) st.jig = null; }
      if (st.hop) {
        st.hop.k = Math.min(1, st.hop.k + dt / 0.34);
        if (st.hop.k >= 1) {
          st.pos = st.hop.to; st.hop = null; SFX.step(); tone(260, 0.12, 'sine', 0.1, 0, 520);
          burst(st.pos[0], st.pos[1], 6, { colors: ['#e8d8c0', '#fff'], spread: 50, up: 20, size: [2, 4] });
          if (st.finishing) return true;
          st.c++;
          if (st.rib.has(st.c)) { st.rib.delete(st.c); if (st.clean) { st.got++; grabRibbon(o, st.pos[0], st.pos[1] - 120); } }
          st.clean = true;
          if (st.c === st.n - 1) { st.finishing = true; st.hop = { from: st.pos, to: [790, GY], k: 0 }; SFX.jump(); }
        }
        return false;
      }
      if (st.wob > 0) return false;
      let row = id === 'pgU' || pressed.arrowup || pressed.w ? 0 : id === 'pgD' || pressed.arrowdown || pressed.s ? 1 : -1;
      const nx = st.c + 1;
      if (row < 0 && !id && pointer.clicked && nx < st.n) {
        const x = st.xs[nx];
        if (Math.abs(pointer.x - x) < 70 && pointer.y > ROW_Y[0] - 70 && pointer.y < H) row = pointer.y < (ROW_Y[0] + ROW_Y[1]) / 2 ? 0 : 1;
      }
      if (row < 0 || nx >= st.n) return false;
      if (row === st.lit[nx]) { st.hop = { from: st.pos, to: [st.xs[nx], ROW_Y[row]], k: 0 }; SFX.jump(); }
      else {
        st.miss++; st.clean = false; st.wob = 0.9; st.jig = { c: nx, row, t: 0 };
        SFX.miss(); tone(200, 0.25, 'sawtooth', 0.04, 0, 120);
        floatText(st.xs[nx], ROW_Y[row] - 70, 'Wobbly! Try the shiny one!', '#fff', false, 20);
      }
      return false;
    },
    tire(x, y, col, lit, jig, back) {
      const sc = back ? 0.88 : 1, rx = 46 * sc, ry = 18 * sc, j = jig ? Math.sin(jig * 50) * 5 * Math.max(0, 1 - jig / 0.6) : 0;
      if (lit) { glow(x, y, 80, '255,240,120', 0.75 + 0.2 * Math.sin(S.t * 8)); }
      ctx.save(); ctx.translate(x + j, y);
      inkAll([[pE(0, 2, rx, ry + 6), '#3a3448']], 2.2);
      ctx.fillStyle = lit ? mix(col, '#ffffff', 0.25) : col; ellipse(0, -2, rx - 4, ry + 1);
      ctx.fillStyle = '#4a3a3a'; ellipse(0, -1, rx * 0.5, ry * 0.42);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-rx * 0.45, -ry * 0.55, rx * 0.25, 3);
      ctx.strokeStyle = 'rgba(60,40,70,.35)'; ctx.lineWidth = 2;
      for (let a = 0; a < TAU; a += TAU / 12) { const c = Math.cos(a), s = Math.sin(a); ctx.beginPath(); ctx.moveTo(c * rx * 0.62, s * ry * 0.62); ctx.lineTo(c * rx * 0.88, s * ry * 0.88); ctx.stroke(); }
      ctx.restore();
    },
    rig(g, st) {
      // a sandy strip under the tires
      ctx.fillStyle = '#f5dfa8'; ctx.beginPath(); ctx.roundRect(st.xs[0] - 80, ROW_Y[0] - 26, st.xs[st.n - 1] - st.xs[0] + 160, ROW_Y[1] - ROW_Y[0] + 56, 30); ctx.fill();
      ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2.5; ctx.stroke();
      // the finish post of the tire run
      inkRect(752, GY - 120, 12, 120, '#ff5f7e', 2.5, 4);
      ink(P2(`M764,${GY - 118} L812,${GY - 104} L764,${GY - 90} Z`), '#ffd83a', 2);
    },
    idle(g, st) { this.tiresRow(g, st, 0); this.tiresRow(g, st, 1); },
    tiresRow(g, st, row) {
      st.xs.forEach((x, i) => {
        const lit = i === st.c + 1 && st.lit[i] === row && (g.tier < 3 || true);
        const jig = st.jig && st.jig.c === i && st.jig.row === row ? st.jig.t : 0;
        this.tire(x, ROW_Y[row], TIRE_COLS[(i * 2 + row) % TIRE_COLS.length], lit, jig, row === 0);
        if (st.rib.has(i) && st.lit[i] === row) bow(x, ROW_Y[row] - 36 + Math.sin(S.t * 3 + i) * 3, 0.75, RIBCOL[i % RIBCOL.length]);
        if (lit && !st.hop) {
          const ay = ROW_Y[row] - 74 + Math.sin(S.t * 7) * 6;
          inkAll([[P2(`M${x - 13},${ay - 16} L${x + 13},${ay - 16} L${x + 13},${ay} L${x + 22},${ay} L${x},${ay + 20} L${x - 22},${ay} L${x - 13},${ay} Z`), '#ffd83a']], 2);
        }
      });
    },
    draw(g, st) {
      let [x, y] = st.pos, lift = 0, frame = 'idle_front', s = 0.55, row = y < GY ? 0 : 1;
      if (st.hop) {
        const k = st.hop.k; x = lerp(st.hop.from[0], st.hop.to[0], k); y = lerp(st.hop.from[1], st.hop.to[1], k);
        lift = Math.sin(k * Math.PI) * 70; frame = 'jump'; row = 2;
      } else if (st.wob > 0) frame = 'crouch';
      const me = () => { shadow(x, y + 2, 24); aub(x, y - lift + 4, frame, 1, frame === 'crouch' ? 0.5 : s); };
      this.tiresRow(g, st, 0);
      if (row === 0) me();
      this.tiresRow(g, st, 1);
      if (row !== 0) me();
    },
    ui(g, st) {
      if (st.c >= st.n - 1) return;
      const nx = st.c + 1, want = st.lit[nx];
      button('pgU', W - 146, 290, 128, 76, 'Back', { icon: '⬆️', color: want === 0 ? '#ff6fb5' : '#9a6ae0', size: 20 });
      button('pgD', W - 146, 380, 128, 76, 'Front', { icon: '⬇️', color: want === 1 ? '#ff6fb5' : '#9a6ae0', size: 20 });
    },
    mayaPose: f => [lerp(100, 780, f), GY],
  };

  // =========================================================================================
  // Station 3: swing jump — the swing pumps higher; let go at the top to fly into the sand
  // =========================================================================================
  const PV = [430, 142], CH = 214, AMAX = 0.95, OMEGA = TAU / 2.3;
  const ZONES = [[600, 690, 1], [690, 790, 2], [790, 900, 3]];
  const SWING = {
    name: 'Swing jump',
    say: 'Swing jump! Wait until you are high, then tap JUMP at the very top to fly far!',
    init(g) { return { t: 0, A: 0.2, ph: 0, rel: null, land: -1, auto: 0, win: [0, 0.45, 0.37, 0.3][g.tier], got: 0, q: 0, swoosh: 0 }; },
    start: [PV[0], GY], end: st => [st.rel ? st.rel.to[0] : 700, GY],
    frac: st => (st.rel ? 0.6 + 0.4 * st.rel.k : Math.min(0.55, st.t / 6)),
    quality: st => Math.max(0.2, st.q),
    seat(st) { const th = st.A * Math.sin(st.ph); return [PV[0] + Math.sin(th) * CH, PV[1] + Math.cos(th) * CH, th]; },
    ready: st => st.A >= AMAX * 0.97,
    inWin(st) { const th = st.A * Math.sin(st.ph); return this.ready(st) && th > 0 && th / st.A > 1 - st.win; },
    update(g, st, dt, id, o) {
      st.t += dt;
      st.ph += OMEGA * dt;
      if (!st.rel) {
        st.A = Math.min(AMAX, st.A + dt * 0.2);
        const c = Math.cos(st.ph);
        if (Math.sign(c) !== Math.sign(st.swoosh) && st.A > 0.3) { tone(300 + st.A * 300, 0.25, 'sine', 0.035, 0, 200 + st.A * 500); }
        st.swoosh = c;
        if (this.ready(st)) st.auto += dt;
        const go = id === 'pgJ' || pressed[' '] || pressed.arrowup || pressed.w || (!id && pointer.clicked && pointer.y > 120 && pointer.x > 200 && pointer.x < 900);
        if (go || st.auto > 2.3 * 3.5) {
          const th = st.A * Math.sin(st.ph);
          let q = th > 0 ? clamp(1 - (1 - th / st.A) / st.win, 0, 1) * (st.A / AMAX) : 0;
          if (!go) q = 0.3;
          q = Math.max(0.06, q);
          const zone = q >= 0.7 ? 2 : q >= 0.35 ? 1 : 0;
          const [sx, sy] = this.seat(st);
          const lx = lerp(ZONES[zone][0] + 20, ZONES[zone][1] - 20, zone === 2 ? clamp((q - 0.7) / 0.3, 0, 1) : zone === 1 ? (q - 0.35) / 0.35 : q / 0.35);
          st.rel = { from: [sx, sy], to: [lx, GY], k: 0, apex: Math.min(sy, GY) - 90 - q * 120, zone };
          st.q = q;
          SFX.jump(); tone(500, 0.5, 'triangle', 0.07, 0, 1200);
          speak(['Wheee!', 'Wheee! Nice!', 'WHOOSH! Super jump!'][zone]);
        }
        return false;
      }
      // the empty swing slowly settles
      st.A = Math.max(0.05, st.A - dt * 0.12);
      if (st.rel.k < 1) {
        st.rel.k = Math.min(1, st.rel.k + dt / 1.05);
        if (st.rel.k >= 1) {
          st.land = 0; SFX.step(); noise(0.25, 0.05);
          burst(st.rel.to[0], GY - 4, 18, { colors: ['#f5dfa8', '#e8c88a', '#fff'], spread: 120, up: 40, size: [3, 6] });
          const n = ZONES[st.rel.zone][2]; st.got = n; grabRibbon(o, st.rel.to[0], GY - 150, n);
        }
        return false;
      }
      st.land += dt;
      return st.land > 1.1;
    },
    rig(g, st) {
      // sand pit with three landing zones, flags showing how many ribbons each one gives
      ctx.fillStyle = '#f5dfa8'; ctx.beginPath(); ctx.ellipse(750, GY + 10, 170, 34, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.ellipse(750, GY + 10, 168, 32, 0, 0, TAU); ctx.clip();
      ZONES.forEach(([a, b], i) => { ctx.fillStyle = ['rgba(255,190,120,.35)', 'rgba(255,140,190,.35)', 'rgba(170,130,255,.4)'][i]; ctx.fillRect(a, GY - 30, b - a, 80); });
      ctx.restore();
      ZONES.forEach(([a, b, n], i) => {
        const x = (a + b) / 2, top = GY - 70 - i * 18;
        tubes([[[x, GY + 4], [x, top]], '#fff', 4]);
        ink(P2(`M${x},${top} L${x + 44},${top + 12} L${x},${top + 24} Z`), ['#ffa040', '#ff5f9f', '#9c6cff'][i], 2);
        for (let j = 0; j < n; j++) bow(x - 12 + (j - (n - 1) / 2) * 20, top - 16 - Math.abs(Math.sin(S.t * 3 + j)) * 3, 0.5, RIBCOL[(i + j) % RIBCOL.length]);
      });
      // the A-frame swing set: back legs, top bar, front legs
      const L = PV[0] - 120, R = PV[0] + 120, T = PV[1] - 8;
      tubes([[[L - 70 + 12, GY - 10], [L + 12, T - 10], [L + 50 + 12, GY - 10]], '#7a4fd0', 11],
        [[[R - 50 + 12, GY - 10], [R + 12, T - 10], [R + 70 + 12, GY - 10]], '#7a4fd0', 11]);
      tubes([[[L - 10, T], [R + 24, T - 8]], '#40b0ff', 13]);
      tubes([[[L - 70, GY], [L, T], [L + 50, GY]], '#9c6cff', 12], [[[R - 50, GY], [R, T], [R + 70, GY]], '#9c6cff', 12]);
      inkCircle(L, T, 8, '#ffd83a', 1.5); inkCircle(R, T, 8, '#ffd83a', 1.5);
      // the target star at the top of the forward swing, so it's clear where to let go
      if (!st.rel) {
        const ta = AMAX * (1 - st.win / 3), sx = PV[0] + Math.sin(ta) * (CH + 30), sy = PV[1] + Math.cos(ta) * (CH + 30);
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; ctx.setLineDash([3, 10]);
        ctx.beginPath(); ctx.arc(PV[0], PV[1], CH + 30, Math.PI / 2 - AMAX, Math.PI / 2 + AMAX); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255,220,80,.85)'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(PV[0], PV[1], CH + 30, Math.PI / 2 - AMAX, Math.PI / 2 - AMAX * (1 - st.win)); ctx.stroke();
        const on = this.inWin(st);
        if (on) glow(sx, sy, 60, '255,240,120', 0.9);
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(S.t * (on ? 4 : 1));
        star(0, 0, on ? 24 : 17, OL, 5); star(0, 0, on ? 19 : 13, on ? '#ffe14a' : '#fff3b0', 5);
        ctx.restore();
      }
    },
    seatArt(th, rider) {
      // chains and seat swing around the top bar
      ctx.save(); ctx.translate(PV[0], PV[1]); ctx.rotate(-th);
      tubes([[[-20, 0], [-20, CH]], '#c8c0d8', 3], [[[20, -6], [20, CH]], '#c8c0d8', 3]);
      inkRect(-34, CH - 4, 68, 12, '#ff5f7e', 2.2, 6);
      if (rider) aub(0, CH + 46, 'jump', 1, 0.58);
      ctx.restore();
      inkCircle(PV[0] - 20, PV[1], 5, '#ffd83a', 1.2); inkCircle(PV[0] + 20, PV[1] - 6, 5, '#ffd83a', 1.2);
    },
    idle() { this.seatArt(0, false); },
    draw(g, st) {
      const [sx, sy, th] = this.seat(st);
      this.seatArt(th, !st.rel);
      if (!st.rel) { shadow(sx, GY + 4, 30); return; }
      const r = st.rel, k = r.k;
      const bz = (a, c, b) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * c + k * k * b;
      const x = bz(r.from[0], (r.from[0] + r.to[0]) / 2, r.to[0]), y = bz(r.from[1] + 40, r.apex, r.to[1]);
      shadow(x, GY + 4, 22 + k * 10);
      if (k < 1) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(k * Math.PI) * 0.4);
        aub(0, 40, 'jump', 1, 0.58); ctx.restore();
        if (k < 0.9) for (let i = 1; i < 5; i++) { ctx.fillStyle = `rgba(255,255,255,${0.5 - i * 0.1})`; circle(bz(r.from[0], (r.from[0] + r.to[0]) / 2, r.to[0]) - i * 16, y + 20 + i * 4, 8 - i); }
      } else aub(x, GY + 2, st.land < 0.3 ? 'crouch' : 'twirl', 1, st.land < 0.3 ? 0.5 : 0.52);
    },
    ui(g, st) {
      if (st.rel) return;
      const on = this.inWin(st), rd = this.ready(st);
      if (on) glow(W / 2 - 50, 486, 150, '255,240,120', 0.8);
      button('pgJ', W / 2 - 160, 446 + (on ? Math.sin(S.t * 12) * 3 : 0), 220, 80, rd ? 'JUMP!' : 'Swinging...', { icon: '🦘', color: on ? '#ff6fb5' : rd ? '#9a6ae0' : '#b9a6cc', size: 26, key: 'Space' });
    },
    mayaPose: f => [lerp(300, 760, f), GY],
  };

  // =========================================================================================
  // Station 4: climbing wall — grab the colour Maya calls out; then down the slide to the finish
  // =========================================================================================
  const HOLD_COLS = [['red', '#ff4a5a'], ['blue', '#3a8aff'], ['yellow', '#ffd23a'], ['green', '#3fc060'], ['purple', '#a066ff'], ['orange', '#ff9a2a']];
  const DECK_Y = 220, WALL_L = 290, WALL_R = 540, WALL_T = 118;
  const SHAPES = {
    circle: () => pE(0, 0, 25, 25),
    star: () => { const p = new Path2D(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 13 : 30, a = i * Math.PI / 5 - Math.PI / 2; p.lineTo(Math.cos(a) * r, Math.sin(a) * r + 3); } p.closePath(); return p; },
    heart: () => P2('M0,22 C-30,4 -30,-22 -13,-22 C-5,-22 0,-15 0,-11 C0,-15 5,-22 13,-22 C30,-22 30,4 0,22 Z'),
    tri: () => P2('M0,-26 C4,-26 28,18 26,22 C24,26 -24,26 -26,22 C-28,18 -4,-26 0,-26 Z'),
    blob: () => P2('M-24,-6 C-26,-24 -2,-28 10,-22 C28,-14 28,10 16,20 C4,28 -22,22 -24,-6 Z'),
  };
  const SLIDE = [[632, DECK_Y + 4], [724, DECK_Y + 16], [700, GY - 40], [806, GY - 14]];
  const slideAt = k => {
    const [a, b, c, d] = SLIDE, u = 1 - k;
    return [0, 1].map(i => u * u * u * a[i] + 3 * u * u * k * b[i] + 3 * u * k * k * c[i] + k * k * k * d[i]);
  };
  const WALL = {
    name: 'Climbing wall',
    say: 'Climbing wall! Listen to Maya, and grab the colour she calls out!',
    init(g) {
      const n = [0, 4, 5, 5][g.tier], m = [0, 3, 3, 4][g.tier], rise = (GY - DECK_Y) / n;
      const deco = [...Array(16)].map((_, i) => ({ x: rand(WALL_L + 22, WALL_R - 22), y: rand(WALL_T + 24, GY - 20), c: pick(HOLD_COLS)[1], s: pick(Object.keys(SHAPES)), r: rand(0, 6) }));
      const st = { n, m, rise, k: 0, x: 415, climb: null, row: [], miss: 0, clean: true, got: 0, ribTot: Math.floor(n / 2), t: 0, deco, used: [], wob: 0 };
      this.newRow(g, st);
      return st;
    },
    start: [415, GY], end: () => [890, GY],
    frac: st => clamp((st.k + (st.climb ? st.climb.k : 0)) / st.n, 0, 1),
    quality: st => clamp(1 - 0.2 * st.miss, 0, 1) * 0.75 + 0.25 * st.got / st.ribTot,
    feet: (st, k) => GY - k * st.rise,
    newRow(g, st) {
      const cols = shuffle(HOLD_COLS).slice(0, st.m), shapes = shuffle(Object.keys(SHAPES));
      const xs = st.m === 3 ? [345, 415, 485] : [330, 390, 450, 510];
      const y = this.feet(st, st.k) - 100;
      st.row = cols.map((c, i) => ({ x: xs[i], y: y + (i % 2) * 8, name: c[0], col: c[1], shape: shapes[i], shake: 0 }));
      st.want = randInt(0, st.m - 1);
      st.ribbon = st.k % 2 === 1;
      st.say = `Grab ${st.row[st.want].name}!`;
      g.say = `Maya says: grab the ${st.row[st.want].name} one!`;
    },
    begin(g, st) { speak(`${this.say} ${g.say}`); },
    update(g, st, dt, id, o) {
      st.t += dt; st.wob = Math.max(0, st.wob - dt);
      st.row.forEach(h => { h.shake = Math.max(0, h.shake - dt); });
      if (st.climb) {
        st.climb.k = Math.min(1, st.climb.k + dt / 0.42);
        if (st.climb.k >= 1) {
          st.k++; st.x = st.climb.tx; st.climb = null; SFX.step();
          if (st.k >= st.n) { SFX.hit(); burst(st.x, DECK_Y - 40, 20); return true; }
          this.newRow(g, st); speak(g.say);
        }
        return false;
      }
      if (st.wob > 0) return false;
      let i = ['1', '2', '3', '4'].slice(0, st.m).findIndex(k => pressed[k]);
      if (i < 0 && !id && pointer.clicked) i = st.row.findIndex(h => Math.hypot(pointer.x - h.x, pointer.y - h.y) < 40);
      if (i < 0) return false;
      const h = st.row[i];
      if (i === st.want) {
        st.used.push(h);
        if (st.ribbon) { if (st.clean) { st.got++; grabRibbon(o, h.x, h.y - 34); } }
        st.clean = true;
        st.climb = { k: 0, fx: st.x, tx: clamp(h.x, 340, 490) };
        tone(523 + st.k * 110, 0.14, 'triangle', 0.09); SFX.hit();
        burst(h.x, h.y, 8, { colors: [h.col, '#fff'], spread: 60, up: 30 });
      } else {
        st.miss++; st.clean = false; h.shake = 0.5; st.wob = 0.9;
        SFX.miss(); floatText(h.x, h.y - 44, `That's ${h.name}!`, h.col, false, 22);
        speak(`That's ${h.name}. Find ${st.row[st.want].name}!`);
      }
      return false;
    },
    hold(h, s = 1, rot = 0) {
      ctx.save(); ctx.translate(h.x + (h.shake ? Math.sin(h.shake * 60) * 4 : 0), h.y); ctx.rotate(rot); ctx.scale(s, s);
      inkAll([[SHAPES[h.shape || h.s](), h.col || h.c]], 2.2);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-8, -9, 7, 4, -0.5);
      ctx.fillStyle = 'rgba(60,40,80,.4)'; circle(2, 2, 3.5);
      ctx.restore();
    },
    rig(g, st, o) {
      // the tall climbing wall, with a little roofed tower beside it for the slide
      tubes([[[548, GY], [548, DECK_Y - 60]], '#ff5f7e', 12], [[[632, GY], [632, DECK_Y - 60]], '#ff5f7e', 12]);
      ink(P2(`M530,${DECK_Y - 56} L590,${DECK_Y - 104} L650,${DECK_Y - 56} Z`), '#ffd83a', 2.5);
      inkAll([[pR(536, DECK_Y, 108, 18, 6), '#40b0ff']], 2.5);
      tubes([[[548, DECK_Y - 2], [548, DECK_Y - 40]], '#ffd83a', 6]);
      // the wall: warm planks with lots of little decorative holds
      inkAll([[pR(WALL_L, WALL_T, WALL_R - WALL_L, GY - WALL_T + 2, 8), '#ffb877']], 2.5);
      ctx.fillStyle = '#ff9a5a'; ctx.fillRect(WALL_L + 3, WALL_T + 3, WALL_R - WALL_L - 6, 12);
      ctx.strokeStyle = 'rgba(150,80,40,.25)'; ctx.lineWidth = 2;
      for (let y = WALL_T + 56; y < GY; y += 44) { ctx.beginPath(); ctx.moveTo(WALL_L + 4, y); ctx.lineTo(WALL_R - 4, y); ctx.stroke(); }
      ctx.globalAlpha = 0.55; st.deco.forEach(d => this.hold(d, 0.42, d.r)); ctx.globalAlpha = 1;
      st.used.forEach(h => this.hold(h, 0.75));
      // the slide
      const pts = []; for (let k = 0; k <= 1.001; k += 0.05) pts.push(slideAt(k));
      tubes([pts.map(([x, y]) => [x + 6, y + 10]), "#c4407a", 22]);
      tubes([pts, "#ff6fb5", 18]);
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - 4) : ctx.moveTo(x, y - 4))); ctx.stroke();
      if (o) o.slideBows.forEach(b => { if (!b.got) { const [x, y] = slideAt(b.k); bow(x, y - 34 + Math.sin(S.t * 3 + b.k * 9) * 3, 0.7, b.col); } });
      // finish arch with a chequered banner
      tubes([[[846, GY], [846, 300]], '#ff5f7e', 10], [[[944, GY], [944, 300]], '#ff5f7e', 10]);
      inkAll([[pR(830, 268, 130, 40, 8), '#fff']], 2.5);
      ctx.save(); ctx.beginPath(); ctx.roundRect(830, 268, 130, 40, 8); ctx.clip();
      for (let i = 0; i < 13; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { ctx.fillStyle = '#3d2c4a'; ctx.fillRect(830 + i * 10, 268 + j * 10, 10, 10); }
      ctx.restore();
      outlined('FINISH', 895, 288, 20, '#ffd83a');
    },
    draw(g, st) {
      // Maya's call: who, and a big swatch of the colour so non-readers can match it
      if (st.k < st.n) {
        const h = st.row[st.want];
        panel(22, 150, 254, 116, 22);
        drawCritterPortrait('Maya', 34, 162, 72, 92);
        text('Maya says:', 116, 180, 16, '#9a7aaa', 'left', 700);
        outlined(h.name.toUpperCase() + '!', 176, 218, 26, h.col, 'center', OL);
        inkCircle(250, 218, 13, h.col, 2);
        if (st.ribbon && st.clean) bow(252, 170, 0.5, '#ff4f9a', 0.2);
        // the choices
        st.row.forEach((h2, i) => {
          if (st.climb && h2 !== st.row[st.want]) ctx.globalAlpha = 1 - st.climb.k;
          if (!st.climb) glow(h2.x, h2.y, 46, '255,255,255', 0.5);
          this.hold(h2, 1);
          if (!st.climb) { inkCircle(h2.x, h2.y + 36, 10, '#fff', 1.2); text(String(i + 1), h2.x, h2.y + 37, 14, OL, 'center', 700); }
          ctx.globalAlpha = 1;
        });
      }
      let x = st.x, feet = this.feet(st, st.k), frame = 'idle_back';
      if (st.climb) { const k = ease(st.climb.k); x = lerp(st.climb.fx, st.climb.tx, k); feet -= st.rise * k; }
      if (st.k >= st.n) frame = 'twirl';
      const s = 0.5, top = feet - IMG.idle_back.height * s;
      if (st.k < st.n) {
        // reaching up for the hold she's going for
        const reach = st.climb ? st.climb : null;
        const h = st.used[st.used.length - 1];
        aub(x, feet + 2, frame, 1, s);
        if (h && h.y < top + 30) arm(x + 10, top + 34, h.x, h.y);

      } else aub(x, feet + 2, frame, 1, 0.48);
    },
    ui() {},
    mayaPose: f => [lerp(200, 800, f), GY],
  };

  const STATIONS = [BARS, TIRES, SWING, WALL];
  const ICONS = ['bars', 'tire', 'swing', 'wall', 'flag'];

  // little hand-drawn station signs for the race strip
  function stripIcon(kind, x, y) {
    ctx.save(); ctx.translate(x, y);
    if (kind === 'bars') { tubes([[[-11, 8], [-11, -8], [11, -8], [11, 8]], '#40b0ff', 3]); }
    else if (kind === 'tire') { inkEllipse(0, 2, 11, 6, 0, '#ffd23a', 1.4); ctx.fillStyle = '#4a3a3a'; ellipse(0, 2, 5, 2.5); }
    else if (kind === 'swing') { tubes([[[-11, 9], [-5, -8], [5, -8], [11, 9]], '#9c6cff', 3]); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 4); ctx.stroke(); }
    else if (kind === 'wall') { inkRect(-9, -9, 18, 18, '#ffb877', 1.4, 3); ctx.fillStyle = '#ff4a5a'; circle(-3, -3, 2.5); ctx.fillStyle = '#3a8aff'; circle(4, 3, 2.5); }
    else emoji('🏁', 0, 0, 20);
    ctx.restore();
  }

  // Maya running alongside in the back lane
  function mayaRun(x, gy, t, s = 0.42, cheer = false) {
    const hop = cheer ? Math.abs(Math.sin(t * 7)) * 16 : Math.abs(Math.sin(t * 12)) * 8;
    ctx.save(); ctx.translate(x, gy - hop); ctx.rotate(cheer ? 0 : 0.08);
    drawCritter('Maya', 0, 0, s, 1);
    ctx.restore();
  }

  MG.pgobstaclerace = {
    kind: 'action', stations: STATIONS,
    title: () => 'Playground Race!',
    icon: () => '🏃‍♀️',
    how: () => 'Race Maya across the playground! Monkey bars, tire hop, swing jump and the climbing wall. Grab ribbons on the way!',
    init(g) {
      const t = g.tier;
      // Maya's own time at each station (a careful player beats her; a careless one doesn't)
      const md = [[0, 6, 7, 8][t] * (1.25 - 0.17 * t), [0, 5, 6, 7][t] * (1.3 - 0.18 * t), 7.6 - 0.7 * t, [0, 4, 5, 5][t] * (2.75 - 0.4 * t)];
      const segs = [...md.map(d => TR + d), 2.2];
      g.oc = {
        s: 0, mode: 'run', k: 0, from: [-40, GY], aT: 0, md, segs, mayaEnd: segs.reduce((a, b) => a + b, 0),
        q: [], ribbons: 0, flying: [], off: 0, st: null, prev: null, lead: 0, msg: null, won: null, fin: 0,
        slideBows: [0.25, 0.5, 0.75].map((k, i) => ({ k, col: RIBCOL[i + 1], got: false })),
      };
      g.oc.st = STATIONS[0].init(g);
      g.say = 'Ready, set, go! Race Maya to the finish!';
      g.progress = 'Station 1 of 4';
    },
    start(g) { speak('Ready, set, GO!'); tone(523, 0.15, 'square', 0.05); tone(523, 0.15, 'square', 0.05, 0.3); tone(1047, 0.35, 'square', 0.06, 0.6); },
    // progress along the course: 0..5 (each station: a run-in quarter, then the station itself)
    mayaProg(o, t) {
      let acc = 0;
      for (let i = 0; i < 5; i++) {
        const d = o.segs[i];
        if (t < acc + d) {
          const u = t - acc;
          if (i === 4) return 4 + u / d;
          return u < TR ? i + 0.25 * u / TR : i + 0.25 + 0.75 * (u - TR) / o.md[i];
        }
        acc += d;
      }
      return 5;
    },
    aubProg(o) {
      if (o.mode === 'run') return o.s + 0.25 * o.k;
      if (o.mode === 'play') return o.s + 0.25 + 0.75 * STATIONS[o.s].frac(o.st);
      if (o.mode === 'slide') return 4 + Math.min(1, o.k);
      return 5;
    },
    update(g, dt, id) {
      const o = g.oc;
      if (o.mode !== 'finish') o.aT += dt;
      o.flying.forEach(f => { f.t += dt; }); o.flying = o.flying.filter(f => f.t < 0.8);
      if (o.msg) { o.msg.t -= dt; if (o.msg.t <= 0) o.msg = null; }
      if (o.mode === 'run') {
        o.k = Math.min(1, o.k + dt / TR); o.off += dt * 560;
        if (Math.floor(o.k * 9) !== Math.floor((o.k - dt / TR) * 9)) SFX.step();
        if (o.k >= 1) {
          o.mode = 'play'; o.prev = null;
          const stn = STATIONS[o.s];
          if (stn.begin) stn.begin(g, o.st); else { g.say = stn.say; speak(stn.say); }
        }
      } else if (o.mode === 'play') {
        const stn = STATIONS[o.s];
        if (stn.update(g, o.st, dt, id, o)) {
          o.q[o.s] = stn.quality(o.st);
          if (o.s < 3) {
            o.from = stn.end(o.st); o.prev = { stn, st: o.st };
            o.s++; o.st = STATIONS[o.s].init(g); o.mode = 'run'; o.k = 0;
            g.progress = `Station ${o.s + 1} of 4`;
            floatText(W / 2, 200, pick(['Great!', 'Awesome!', 'Woohoo!', 'Next one!']), '#fff', false, 30);
          } else {
            o.mode = 'slide'; o.k = 0; g.say = 'Down the slide to the finish!'; speak('Down the big slide!');
            g.progress = 'To the finish!';
          }
        }
      } else if (o.mode === 'slide') {
        const before = o.k;
        o.k = Math.min(1, o.k + dt / 2.2);
        const sk = clamp((o.k - 0.18) / 0.55, 0, 1);
        if (before < 0.18 && o.k >= 0.18) tone(900, 1.1, 'sine', 0.06, 0, 300);
        for (const b of o.slideBows) if (!b.got && sk >= b.k) { b.got = true; const [x, y] = slideAt(b.k); grabRibbon(o, x, y - 34); }
        if (o.k >= 1) {
          o.mode = 'finish'; o.fin = 0;
          o.won = o.aT <= o.mayaEnd;
          o.mayaArrive = o.won ? o.mayaEnd - o.aT : 0;
          SFX.fanfare();
          for (let i = 0; i < 3; i++) burst(840 + i * 50, 260, 16, { kind: 'emoji', colors: ['🎉', '🎊', '🎀', '⭐'], spread: 220, up: 160, size: [3, 5] });
          speak(o.won ? 'You win! You beat Maya!' : 'Maya just won! What a close race!');
        }
      } else {
        o.fin += dt;
        if (o.fin > 3) g.done = true;
      }
      // who's ahead? a little call-out when the lead changes
      const ap = this.aubProg(o), mp = this.mayaProg(o, o.aT);
      const lead = ap - mp > 0.12 ? 1 : mp - ap > 0.12 ? -1 : o.lead;
      if (lead !== o.lead && o.mode !== 'finish') {
        if (o.lead !== 0 || lead === -1) o.msg = { str: lead > 0 ? "You're in front!" : "Maya's ahead! Hurry!", t: 1.8, good: lead > 0 };
        o.lead = lead;
      }
      const qs = [0, 1, 2, 3].map(i => o.q[i] || 0);
      // beating Maya is a bonus on top of how well each station went (so button-mashing can't win stars)
      g.score = qs.reduce((a, b) => a + b, 0) / 4 * (o.won === null ? 0.85 : o.won ? 1 : 0.9);
    },
    drawStrip(g, o) {
      const x0 = 160, x1 = 744, y = 82;
      darkPanel(x0 - 34, 62, x1 - x0 + 68, 44, 22);
      const px = p => x0 + (x1 - x0) * p / 5;
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px(0), y); ctx.lineTo(px(5), y); ctx.stroke();
      ICONS.forEach((k, i) => stripIcon(k, px(i === 4 ? 5 : i + 0.62), y));
      const ap = this.aubProg(o), mp = this.mayaProg(o, o.aT);
      // Maya's head, then Aubrey's (on top): little hops as they move
      const bob = v => Math.abs(Math.sin(S.t * 10 + v)) * 3;
      ctx.save(); ctx.beginPath(); ctx.arc(px(mp), y + 2 - bob(1), 17, 0, TAU); ctx.clip();
      drawCritterPortrait('Maya', px(mp) - 24, y - 20 - bob(1), 48, 54); ctx.restore();
      ctx.strokeStyle = '#ff9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px(mp), y + 2 - bob(1), 17, 0, TAU); ctx.stroke();
      const ax = px(ap), ay = y - 2 - bob(0);
      ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, 18, 0, TAU); ctx.fillStyle = '#ffd6ea'; ctx.fill(); ctx.clip();
      ctx.drawImage(IMG.face_happy, ax - 19, ay - 20, 38, 42); ctx.restore();
      ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, 18, 0, TAU); ctx.stroke();
      // ribbon counter
      darkPanel(12, 62, 104, 44, 22);
      bow(40, 82, 0.62, '#ff4f9a');
      text(`× ${o.ribbons}`, 62, 84, 20, '#fff', 'left', 700);
      if (o.msg) {
        ctx.globalAlpha = clamp(o.msg.t * 2, 0, 1);
        outlined(o.msg.str, W / 2, 128, 24, o.msg.good ? '#9dffb0' : '#ffd0a0');
        ctx.globalAlpha = 1;
      }
      // won ribbons zooming to the counter
      o.flying.forEach(f => { if (f.t < 0) return; const k = ease(Math.min(1, f.t / 0.8)); bow(lerp(f.x, 40, k), lerp(f.y, 82, k) - Math.sin(k * Math.PI) * 60, 0.8 - 0.2 * k, f.col, k * 6); });
    },
    draw(g) {
      const o = g.oc;
      BACKDROPS.playground(o.off);
      ctx.fillStyle = 'rgba(255,250,255,.3)'; ctx.fillRect(0, 0, W, H);
      if (o.mode === 'run') {
        const k = ease(o.k);
        if (o.prev) { ctx.save(); ctx.translate(-k * W, 0); o.prev.stn.rig(g, o.prev.st, o); o.prev.stn.idle?.(g, o.prev.st); ctx.restore(); }
        ctx.save(); ctx.translate((1 - k) * W, 0); STATIONS[o.s].rig(g, o.st, o); STATIONS[o.s].idle?.(g, o.st); ctx.restore();
        const to = STATIONS[o.s].start, ax = lerp(o.from[0], to[0], o.k), ay = lerp(o.from[1], to[1], o.k);
        // Maya runs in the back lane when she's close by
        const d = this.mayaProg(o, o.aT) - this.aubProg(o);
        if (Math.abs(d) < 0.8) mayaRun(ax + d * 420, GY - 26, S.t);
        shadow(ax, ay + 2, 24); aub(ax, ay + 4, runFrame(S.t), 1, 0.55);
      } else {
        const stn = STATIONS[o.s];
        stn.rig(g, o.st, o);
        if (g.phase === 'result') { shadow(890, GY + 2, 24); aub(890, GY + 4, 'twirl', 1, 0.55); return; } // the scene's own panel and Maya take over
        if (o.mode === 'play') { stn.draw(g, o.st); stn.ui(g, o.st); }
        else this.drawEnd(g, o);
      }
      this.drawStrip(g, o);
    },
    drawEnd(g, o) {
      // walk to the slide, whoosh down it, run under the finish arch
      const st = o.st;
      if (o.mode === 'slide') {
        const k = o.k;
        if (k < 0.18) { const u = k / 0.18; aub(lerp(st.x, 612, u), DECK_Y + 2 - Math.sin(u * Math.PI) * 50, 'jump', 1, 0.5); }
        else if (k < 0.73) {
          const u = (k - 0.18) / 0.55, [x, y] = slideAt(u), [x2, y2] = slideAt(Math.min(1, u + 0.02));
          ctx.save(); ctx.translate(x, y - 4); ctx.rotate(Math.atan2(y2 - y, x2 - x) * 0.5);
          aub(0, 10, 'jump', 1, 0.5); ctx.restore();
          ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 1; i < 4; i++) { const [tx, ty] = slideAt(Math.max(0, u - i * 0.04)); circle(tx, ty - 12, 7 - i * 1.5); }
        } else { const u = (k - 0.73) / 0.27, x = lerp(806, 890, u); shadow(x, GY + 2, 22); aub(x, GY + 4, runFrame(S.t), 1, 0.55); }
        const d = this.mayaProg(o, o.aT);
        if (d >= 5) mayaRun(780, GY - 6, S.t, 0.5, true);
        return;
      }
      // finish: both friends at the line
      const mx = o.won ? lerp(-60, 740, clamp((o.fin - 0.5) / 1.3, 0, 1)) : 770;
      if (o.won) mayaRun(mx, GY - 6, S.t, 0.5, mx >= 739);
      if (!o.won) mayaRun(740, GY - 6, S.t, 0.5, true);
      shadow(890, GY + 2, 24); aub(890, GY + 4 - Math.abs(Math.sin(S.t * 6)) * 14, 'twirl', 1, 0.55);
      panel(W / 2 - 230, 180, 380, 92, 24);
      outlined(o.won ? 'YOU WIN!' : 'Maya wins!', W / 2 - 40, 214, 36, o.won ? '#ff6fb5' : '#ff9a3a', 'center', '#fff');
      text(o.won ? 'You beat Maya to the finish!' : 'So close! Great racing!', W / 2 - 40, 250, 18, '#5a2a6e', 'center', 600);
    },
  };

  restage('playground', {
    games: [['pgobstaclerace', 'ribbon', {}], ['seesaw', 'berry', {}]],
    intro: [
      "N:Aubrey! I made an obstacle course! Monkey bars, tires, swings AND the climbing wall!",
      "N:Race you to the finish line! There are ribbons hidden all the way round.",
      "A:determined:Ready, set... you're ON, Maya!",
    ],
  });
}
