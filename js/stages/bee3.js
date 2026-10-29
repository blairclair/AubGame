'use strict';
{
  // ===========================================================================
  // Balloon Festival, game 2 (learn): Launch Chart. A first taste of BAR CHARTS (data handling).
  // Gusty the Goose keeps a Launch Chart: one block for every balloon of each colour.
  //   'count' rounds: balloons wait on the launch field. Count each colour (tap balloons to tick
  //            them off) and tap the chart to build a bar for each colour.
  //   'order' rounds: Gusty's chart is the order. Read it and put out just the right balloons
  //            (tap a colour to inflate one, tap a balloon on the field to let it down).
  //   'fix'   rounds (tier 2+): a muddled chart. Count, and fix the bars that are wrong.
  // Press Launch to check. Right first time = a full point, right second time = half.
  // Tier 1: three colours, up to 4 each. Tier 2: up to 5, zero bars can appear. Tier 3: four colours, up to 6.
  // ===========================================================================
  const TWO_PI = Math.PI * 2;
  const say = (g, s) => { g.say = s; speak(s); };
  const COLS = [
    { name: 'red', c: '#ff5a64' },
    { name: 'blue', c: '#3aa4ff' },
    { name: 'yellow', c: '#ffd02e' },
    { name: 'green', c: '#4cc85a' },
  ];
  const cap = s => s[0].toUpperCase() + s.slice(1);

  // --- a little hot-air balloon (envelope, ropes, wicker basket) --------------------------------
  const halfW = v => (v <= 0 ? Math.sqrt(Math.max(0, 1 - v * v)) : 1 - 0.68 * Math.pow(Math.min(1, v), 1.6));
  const gu = (i, n) => lerp(-1 + 2 * i / n, Math.sin(-Math.PI / 2 + Math.PI * i / n), 0.6);
  function envPath(cx, cy, r, u0 = -1, u1 = 1, v0 = -1, v1 = 1) {
    const p = new Path2D(), N = 22;
    for (let i = 0; i <= N; i++) { const v = lerp(v0, v1, i / N); p.lineTo(cx + u1 * halfW(v) * r, cy + v * r); }
    for (let i = N; i >= 0; i--) { const v = lerp(v0, v1, i / N); p.lineTo(cx + u0 * halfW(v) * r, cy + v * r); }
    p.closePath();
    return p;
  }
  // (cx, by) = middle of the basket bottom
  function balloon(cx, by, r, col, o = {}) {
    const cy = by - 2.04 * r, lw = Math.max(1, r * 0.05);
    const bt = cy + 1.72 * r, bw = 0.6 * r;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.2, r * 0.05);
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + k * 0.27 * r, cy + 1.08 * r); ctx.lineTo(cx + k * bw * 0.46, bt); ctx.stroke(); }
    if (o.flame) {
      const fy = cy + 1.4 * r, fh = r * (0.4 + 0.3 * Math.sin(S.t * 31));
      ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(cx - r * 0.12, fy); ctx.quadraticCurveTo(cx, fy - fh * 1.3, cx + r * 0.12, fy); ctx.fill();
      ctx.fillStyle = '#ffe36b'; ctx.beginPath(); ctx.moveTo(cx - r * 0.06, fy); ctx.quadraticCurveTo(cx, fy - fh * 0.8, cx + r * 0.06, fy); ctx.fill();
    }
    const bp = P2(`M${cx - bw / 2},${bt} L${cx + bw / 2},${bt} L${cx + bw * 0.42},${by} L${cx - bw * 0.42},${by} Z`);
    ink(bp, '#d8984a', lw);
    ctx.strokeStyle = 'rgba(140,80,30,.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - bw * 0.45, (bt + by) / 2); ctx.lineTo(cx + bw * 0.45, (bt + by) / 2); ctx.stroke();
    ink(P2(`M${cx - 0.33 * r},${cy + 0.96 * r} L${cx + 0.33 * r},${cy + 0.96 * r} L${cx + 0.27 * r},${cy + 1.1 * r} L${cx - 0.27 * r},${cy + 1.1 * r} Z`), '#f0dcb8', lw * 0.8);
    const env = envPath(cx, cy, r);
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2.2; ctx.stroke(env);
    const light = mix(col, '#ffffff', 0.42), n = 8;
    for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? light : col; ctx.fill(envPath(cx, cy, r, gu(i, n), gu(i + 1, n))); }
    ctx.fillStyle = col; ctx.fill(envPath(cx, cy, r, -1, 1, -1, -0.72));
    ctx.fillStyle = '#ffffff'; ctx.fill(envPath(cx, cy, r, -1, 1, 0.34, 0.5));
    ctx.save(); ctx.clip(env);
    const hl = ctx.createRadialGradient(cx - r * 0.42, cy - r * 0.45, r * 0.05, cx - r * 0.42, cy - r * 0.45, r * 0.85);
    hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(50,20,80,.16)'; ctx.fillRect(cx + r * 0.35, cy - r, r, r * 2.1);
    ctx.restore();
    ctx.restore();
    if (o.tick) {
      inkCircle(cx + r * 0.62, cy - r * 0.62, r * 0.42, '#ffffff', 1.4);
      ctx.strokeStyle = '#2aa84a'; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx + r * 0.42, cy - r * 0.62); ctx.lineTo(cx + r * 0.56, cy - r * 0.46); ctx.lineTo(cx + r * 0.84, cy - r * 0.82); ctx.stroke();
    }
  }

  // --- layout ------------------------------------------------------------------------------------
  const FIELD = { x: 22, y: 68, w: 510, h: 386 };
  const SLOT_C = 7, SLOT_R = 4, BR = 21;
  const slotPos = i => [FIELD.x + 48 + (i % SLOT_C) * 69, FIELD.y + 96 + Math.floor(i / SLOT_C) * 92];
  const BOARD = { x: 548, y: 68, w: 392, h: 386 };
  const GRID_BOT = 372;
  const lay = g => {
    const gx0 = BOARD.x + 50, gw = BOARD.w - 66, cw = gw / g.n, ch = Math.min(46, 250 / g.M);
    return { gx0, cw, ch, top: GRID_BOT - ch * g.M };
  };
  const LAUNCH = { x: 762, y: 466, w: 176, h: 62 };

  const counts = g => { const k = Array(g.n).fill(0); for (const s of g.field) if (s) k[s.c]++; return k; };

  function newRound(g) {
    const kind = g.plan[g.round];
    g.kind = kind; g.tries = 0; g.state = 'play'; g.lt = 0; g.flash = null; g.reveal = false; g.won = false; g.sel = -1;
    g.pop = Array(g.n).fill(0);
    // the true number of each colour: never all the same, at most one zero bar (none on tier 1)
    let truth;
    for (;;) {
      truth = Array.from({ length: g.n }, () => randInt(g.lo, g.M));
      if (new Set(truth).size > 1 && truth.filter(v => v === 0).length <= 1 && truth.reduce((a, b) => a + b, 0) <= SLOT_C * SLOT_R) break;
    }
    g.truth = truth;
    g.field = Array(SLOT_C * SLOT_R).fill(null);
    if (kind === 'order') {
      g.h = [...truth];
      say(g, g.round < 2 ? "This is Gusty's order. Read the chart, and put out just the right balloons! Tap a colour to blow one up." : "A new order! Read the chart and put out just the right balloons.");
    } else {
      // balloons scattered over the field in a muddle of colours
      const list = shuffle(truth.flatMap((v, c) => Array(v).fill(c)));
      const slots = shuffle(g.field.map((_, i) => i)).slice(0, list.length);
      list.forEach((c, k) => { g.field[slots[k]] = { c, dx: rand(-7, 7), t: 1, tick: false }; });
      if (kind === 'count') {
        g.h = Array(g.n).fill(0);
        const names = COLS.slice(0, g.n).map(c => c.name);
        say(g, g.round < 1 ? `Count the ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} balloons. Then tap the chart to build a bar for each colour: one block for each balloon!` : 'Count each colour, and build its bar on the chart!');
      } else {
        g.h = [...truth];
        const bad = shuffle(g.h.map((_, i) => i)).slice(0, g.tier === 3 ? 2 : 1);
        for (const c of bad) { let v; do v = clamp(truth[c] + pick([-2, -1, 1, 2]), 0, g.M); while (v === truth[c]); g.h[c] = v; }
        say(g, 'Oh no! Someone muddled the chart. Count the balloons, and fix the bars that are wrong.');
      }
    }
    g.progress = `Launch ${g.round + 1} of ${g.rounds}`;
  }

  function check(g) {
    const have = g.kind === 'order' ? counts(g) : g.h;
    const want = g.kind === 'order' ? g.h : g.truth;
    const wrong = want.map((v, c) => (have[c] !== v ? c : -1)).filter(c => c >= 0);
    g.tries++;
    if (!wrong.length) {
      g.pts += g.tries === 1 ? 1 : 0.5;
      SFX.fanfare(); burst(BOARD.x + BOARD.w / 2, 200, 22);
      const mx = Math.max(...want), top = want.map((v, c) => (v === mx ? c : -1)).filter(c => c >= 0);
      const most = top.length === 1 ? ` The tallest bar shows ${COLS[top[0]].name} has the most!` : '';
      say(g, `Perfect!${most} Up, up and away!`);
      g.won = true;
      g.cheer = g.tries === 1 ? 'Perfect chart!' : 'You fixed it!';
      return launch(g);
    }
    g.flash = { cols: wrong, t: 1.4 };
    SFX.miss();
    const c0 = COLS[wrong[0]].name;
    if (g.tries === 1) {
      if (g.kind === 'order') {
        const k = have[wrong[0]] - want[wrong[0]];
        say(g, `Not quite! Look at the ${c0} bar again. ${k > 0 ? `That's too many ${c0} balloons.` : `We need more ${c0} balloons.`}`);
      } else say(g, `Not quite! Count the ${c0} balloons again, one at a time.`);
      return;
    }
    // second miss: show the right answer, then launch anyway
    say(g, g.kind === 'order' ? `Here are the right balloons for the chart. One balloon for every block!` : `Here is the right chart. One block for every balloon!`);
    g.reveal = true; g.flash = null;
    if (g.kind === 'order') {
      g.field = Array(SLOT_C * SLOT_R).fill(null);
      let i = 0;
      g.h.forEach((v, c) => { for (let k = 0; k < v; k++) g.field[i++] = { c, dx: 0, t: 0, tick: false }; });
    } else g.h = [...g.truth];
    g.state = 'reveal'; g.lt = 0;
  }
  function launch(g) {
    g.state = 'launch'; g.lt = 0;
    let k = 0;
    // balloons lift off one colour at a time, so the bars and the sky tell the same story
    for (let c = 0; c < g.n; c++) for (const s of g.field) if (s && s.c === c) s.delay = 0.35 + 0.16 * k++;
    g.launchEnd = 0.35 + 0.16 * k + 1.9;
    tone(220, 0.5, 'sawtooth', 0.04, 0, 330);
  }

  function addBalloon(g, c) {
    const i = g.field.indexOf(null);
    if (i < 0) { SFX.miss(); return; }
    g.field[i] = { c, dx: 0, t: 0, tick: false };
    g.last = i;
    tone(300 + 60 * c, 0.18, 'sine', 0.06, 0, 520 + 60 * c);
  }

  MG.launchchart = {
    kind: 'learn',
    title: () => 'Launch Chart',
    icon: () => '📊',
    how: () => "Gusty's Launch Chart has one block for every balloon. Count the balloons and build the bars, or read the bars and put out the balloons. Then press Launch!",
    init(g) {
      const T = g.tier;
      g.plan = { 1: ['count', 'order', 'count', 'order'], 2: ['count', 'order', 'fix', 'count', 'order'], 3: ['count', 'order', 'fix', 'count', 'fix', 'order'] }[T];
      g.rounds = g.plan.length; g.round = 0; g.pts = 0; g.score = 0;
      g.n = T === 1 ? 3 : T === 2 ? 3 : 4;
      g.M = [4, 5, 6][T - 1]; g.lo = T === 1 ? 1 : 0;
      newRound(g);
    },
    start(g) { say(g, g.say); },
    update(g, dt, id) {
      g.score = g.pts / g.rounds;
      for (let c = 0; c < g.n; c++) g.pop[c] = Math.max(0, g.pop[c] - dt * 3);
      for (const s of g.field) if (s) s.t = Math.min(1, s.t + dt * 4);
      if (g.flash) { g.flash.t -= dt; if (g.flash.t <= 0) g.flash = null; }
      if (g.state === 'reveal') { g.lt += dt; if (g.lt > 2.6) launch(g); return; }
      if (g.state === 'launch') {
        g.lt += dt;
        if (g.lt > g.launchEnd) {
          g.round++;
          if (g.round >= g.rounds) { g.score = g.pts / g.rounds; g.done = true; return; }
          newRound(g);
        }
        return;
      }
      if (id === 'launch') return check(g);
      if (g.kind === 'order') {
        for (let c = 0; c < g.n; c++) if (id === 'add' + c) return addBalloon(g, c);
        if (pressed.backspace && g.last != null && g.field[g.last]) { g.field[g.last] = null; g.last = null; SFX.pop(); return; }
      } else {
        // keyboard: number picks a bar, up/down grows or shrinks it
        for (let c = 0; c < g.n; c++) if (pressed[String(c + 1)]) g.sel = c;
        if (g.sel >= 0 && (pressed.arrowup || pressed.arrowdown)) {
          const v = clamp(g.h[g.sel] + (pressed.arrowup ? 1 : -1), 0, g.M);
          if (v !== g.h[g.sel]) { g.h[g.sel] = v; g.pop[g.sel] = 1; tone(330 + v * 50, 0.12, 'triangle', 0.07); }
        }
      }
      if (!pointer.clicked) return;
      const px = pointer.x, py = pointer.y;
      // the field: tick balloons off while counting, or let a balloon down in an order round
      for (let i = 0; i < g.field.length; i++) {
        const s = g.field[i]; if (!s) continue;
        const [x, by] = slotPos(i), cx = x + s.dx, cy = by - 2.04 * BR;
        if (Math.abs(px - cx) < BR + 3 && py > cy - BR - 3 && py < by + 3) {
          if (g.kind === 'order') { g.field[i] = null; SFX.pop(); burst(cx, cy, 6, { colors: [COLS[s.c].c, '#ffffff'] }); }
          else { s.tick = !s.tick; tone(s.tick ? 660 : 440, 0.1, 'sine', 0.06); }
          return;
        }
      }
      // the chart: tap a row to build the bar up to it; tap the top block to take it off
      if (g.kind !== 'order') {
        const L = lay(g);
        if (px > L.gx0 && px < L.gx0 + L.cw * g.n && py > L.top - 6 && py < GRID_BOT + 4) {
          const c = Math.floor((px - L.gx0) / L.cw);
          const row = clamp(Math.ceil((GRID_BOT - py) / L.ch), 1, g.M);
          const v = g.h[c] === row ? row - 1 : row;
          g.h[c] = v; g.pop[c] = 1; g.sel = -1;
          tone(330 + v * 50, 0.12, 'triangle', 0.07);
        }
      }
    },
    draw(g) {
      const t = S.t;
      // ---- the launch field ----
      ctx.save();
      ctx.shadowColor = 'rgba(30,10,50,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      rrect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 22, '#6cc45a');
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.roundRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 22); ctx.clip();
      const gg = ctx.createLinearGradient(0, FIELD.y, 0, FIELD.y + FIELD.h);
      gg.addColorStop(0, '#9ade7c'); gg.addColorStop(1, '#5cb44c');
      ctx.fillStyle = gg; ctx.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
      ctx.fillStyle = 'rgba(255,255,255,.09)';
      for (let i = 0; i < 8; i++) if (i % 2) ctx.fillRect(FIELD.x + i * 66, FIELD.y, 66, FIELD.h);
      for (let i = 0; i < 18; i++) { const x = FIELD.x + 20 + ((i * 97) % 480), y = FIELD.y + 30 + ((i * 61) % 340); ctx.fillStyle = ['#ffffff', '#ffd84a', '#ff9ad0'][i % 3]; circle(x, y, 2.5); }
      ctx.restore();
      rrect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 22, null, '#ffffff', 4);
      rrect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 22, null, OL, 1.5);
      // launch pads
      for (let i = 0; i < g.field.length; i++) {
        const [x, by] = slotPos(i);
        ctx.fillStyle = 'rgba(60,110,40,.35)'; ellipse(x, by + 2, 24, 7);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, by + 2, 20, 5.5, 0, 0, TWO_PI); ctx.stroke();
      }
      // balloons (rising away in a launch)
      for (let i = 0; i < g.field.length; i++) {
        const s = g.field[i]; if (!s) continue;
        const [x, by] = slotPos(i);
        let lift = 0, flame = false;
        if (g.state === 'launch') { const k = Math.max(0, g.lt - s.delay); lift = k * k * 170 + k * 40; flame = k > 0 || g.lt > s.delay - 0.3; }
        const bob = lift ? 0 : Math.sin(t * 2 + i) * 1.5;
        const sc = 0.4 + 0.6 * s.t;
        const vis = clamp((by - lift - 3 * BR - 40) / 90, 0, 1);
        if (!vis) continue;
        ctx.globalAlpha = vis;
        ctx.save(); ctx.translate(x + s.dx + Math.sin(lift * 0.01 + i) * lift * 0.04, by - lift + bob); ctx.scale(sc, sc);
        balloon(0, 0, BR, COLS[s.c].c, { flame, tick: s.tick && !lift });
        ctx.restore(); ctx.globalAlpha = 1;
      }
      // ---- Gusty's Launch Chart ----
      const L = lay(g), B = BOARD;
      ctx.save(); ctx.shadowColor = 'rgba(30,10,50,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      rrect(B.x, B.y, B.w, B.h, 20, '#c88a4a'); ctx.restore();
      rrect(B.x, B.y, B.w, B.h, 20, null, OL, 2);
      rrect(B.x + 9, B.y + 9, B.w - 18, B.h - 18, 14, '#fffaf0', OL, 1.5);
      for (const [nx, ny] of [[B.x + 20, B.y + 20], [B.x + B.w - 20, B.y + 20]]) inkCircle(nx, ny, 5, '#ffd83a', 1);
      // (the board's title steps aside while the 'Perfect chart!' cheer is showing, so they never overlap)
      if (!(g.state === 'launch' && g.won)) outlined(g.kind === 'order' ? "Gusty's Order" : 'Launch Chart', B.x + B.w / 2, B.y + 32, 22, g.kind === 'order' ? '#ffd83a' : '#ff8ac8', 'center');
      // grid lines and the number scale
      for (let r = 0; r <= g.M; r++) {
        const y = GRID_BOT - r * L.ch;
        ctx.strokeStyle = r ? 'rgba(120,90,150,.22)' : OL; ctx.lineWidth = r ? 1.5 : 3;
        ctx.beginPath(); ctx.moveTo(L.gx0 - 6, y); ctx.lineTo(L.gx0 + L.cw * g.n, y); ctx.stroke();
        if (r) text(String(r), L.gx0 - 18, y + L.ch / 2, 17, '#7a5a9a', 'center', 700);
      }
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L.gx0 - 6, L.top - 8); ctx.lineTo(L.gx0 - 6, GRID_BOT); ctx.stroke();
      const hov = g.kind !== 'order' && g.state === 'play' && pointer.x > L.gx0 && pointer.x < L.gx0 + L.cw * g.n && pointer.y > L.top - 6 && pointer.y < GRID_BOT + 4;
      for (let c = 0; c < g.n; c++) {
        const col = COLS[c].c, x = L.gx0 + c * L.cw, bw = L.cw - 18;
        const bad = g.flash && g.flash.cols.includes(c);
        const shake = bad ? Math.sin(t * 40) * 4 * Math.min(1, g.flash.t) : 0;
        if (g.sel === c && g.state === 'play') rrect(x + 3, L.top - 6, L.cw - 6, GRID_BOT - L.top + 8, 10, 'rgba(255,216,58,.25)', '#ffb428', 2.5);
        if (hov && Math.floor((pointer.x - L.gx0) / L.cw) === c) {
          const row = clamp(Math.ceil((GRID_BOT - pointer.y) / L.ch), 1, g.M);
          ctx.setLineDash([5, 4]); rrect(x + 9, GRID_BOT - row * L.ch + 3, bw, row * L.ch - 5, 7, null, mix(col, '#5a2a6e', 0.3), 2); ctx.setLineDash([]);
        }
        for (let k = 0; k < g.h[c]; k++) {
          const top = k === g.h[c] - 1, p = top ? g.pop[c] : 0;
          const by = GRID_BOT - k * L.ch - 2, bh = L.ch - 5;
          const sx = 1 + p * 0.18;
          const bx = x + 9 + shake - (bw * (sx - 1)) / 2;
          inkRect(bx, by - bh * sx, bw * sx, bh * sx, col, 2.2, 7);
          ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.roundRect(bx + 5, by - bh * sx + 4, bw * sx * 0.35, 6, 3); ctx.fill();
          // a tiny balloon stamp on every block
          ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(bx + bw * sx / 2, by - bh * sx / 2 - 2, 6, 7);
          ctx.fillRect(bx + bw * sx / 2 - 2, by - bh * sx / 2 + 5, 4, 4);
        }
        if (bad) {
          rrect(x + 3 + shake, L.top - 4, L.cw - 6, GRID_BOT - L.top + 8, 10, `rgba(255,60,80,${0.1 + 0.08 * Math.sin(t * 12)})`, '#e8304a', 3);
          text('✗', x + L.cw / 2, L.top - 18, 24, '#e8304a', 'center', 800);
        }
        if (g.state === 'launch' && g.won) text('✓', x + L.cw / 2, GRID_BOT - g.h[c] * L.ch - 16, 22, '#2aa84a', 'center', 800);
        // the bar's label: a little balloon and its colour name, with the number of blocks
        balloon(x + L.cw / 2 - 16, GRID_BOT + 48, 12, col, {});
        text(String(g.h[c]), x + L.cw / 2 + 14, GRID_BOT + 26, 22, OL, 'center', 800);
        text(cap(COLS[c].name), x + L.cw / 2, GRID_BOT + 62, 13, '#7a5a9a', 'center', 700);
      }
      // ---- bottom strip: Aubrey, the colour buttons or a hint, and the Launch button ----
      drawAubrey(52, 538, g.state === 'launch' ? 'jump' : 'idle_front', 1, g.state === 'launch' ? Math.abs(Math.sin(t * 6)) * 10 : 0, 0.4);
      const play = g.state === 'play';
      if (g.kind === 'order') {
        for (let c = 0; c < g.n; c++) {
          const bx = 100 + c * 92;
          button('add' + c, bx, 466, 84, 62, '', { color: mix(COLS[c].c, '#5a2a6e', 0.12), on: play, key: String(c + 1) });
          balloon(bx + 28, 520, 13, COLS[c].c, {});
          text('+1', bx + 60, 497, 20, '#ffffff', 'center', 800);
        }
        darkPanel(100 + g.n * 92, 466, LAUNCH.x - 110 - g.n * 92, 62, 18);
        const tip = wrap('Tap a colour to add one. Tap a balloon to let it down.', LAUNCH.x - 136 - g.n * 92, 14);
        tip.slice(0, 3).forEach((l, i) => text(l, 112 + g.n * 92, 497 + (i - (Math.min(3, tip.length) - 1) / 2) * 17, 14, '#ffffff', 'left', 600));
      } else if (g.state !== 'reveal') {
        darkPanel(100, 466, LAUNCH.x - 110, 62, 18);
        const tip = g.kind === 'fix' ? 'Count each colour. Fix the bars that are wrong!' : 'Count each colour. Tap the chart to build its bar!';
        text(tip, 116, 487, 17, '#ffffff', 'left', 700);
        text('Tap a balloon to tick it off while you count.', 116, 510, 14, 'rgba(255,255,255,.8)', 'left', 500);
      }
      if (g.state === 'reveal') {
        rrect(100, 466, LAUNCH.x - 110, 62, 18, '#fff4c8', '#ffb428', 3);
        text(g.kind === 'order' ? 'Look! One balloon for every block.' : 'Look! One block for every balloon.', 100 + (LAUNCH.x - 110) / 2, 497, 20, '#5a2a6e', 'center', 700);
      }
      if (g.state === 'launch' && g.won) {
        const k = Math.min(1, g.lt * 3);
        ctx.save(); ctx.translate(BOARD.x + BOARD.w / 2, 205); ctx.scale(k, k); ctx.rotate(-0.05);
        outlined(g.cheer, 0, 0, 36, '#ffd83a', 'center'); ctx.restore();
      }
      button('launch', LAUNCH.x, LAUNCH.y, LAUNCH.w, LAUNCH.h, 'Launch!', { color: '#ff7a3a', icon: '🔥', size: 22, on: play, key: 'Enter' });
    },
  };

  restage('beemeadow', {
    games: [['balloonpicnic', 'honey', {}], ['launchchart', 'petal', {}]],
    mid: [
      "N:Splendid flying! Now it's time for the Great Launch, and every balloon must go on my Launch Chart. Honk!",
      'N:A bar chart is a counting picture. One block for every balloon, so the tallest bar shows the colour with the most!',
      'A:thinking:One block for every balloon... I can count them up and stack them up!',
    ],
  });
}
