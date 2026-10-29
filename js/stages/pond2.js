'use strict';
{
  // ===========================================================================
  // Duck Pond, game 2: Duckling Parade. Swim Mama Duck round the pond and pick up her
  // lost ducklings IN NUMBER ORDER. Each one joins the line and paddles along exactly
  // where she swam. Don't bump the grumpy big ducks, or the last baby gets scared off!
  // Then lead the whole parade home to the nest and count them in.
  // ===========================================================================
  // where the swimmers can go: an oval inside the pond drawn by drawPond (waterline points)
  const PCX = 485, PCY = 370, PRX = 410, PRY = 64;
  const inPond = (x, y, k = 1) => {
    const nx = (x - PCX) / (PRX * k), ny = (y - PCY) / (PRY * k), d = Math.hypot(nx, ny);
    return d <= 1 ? [x, y] : [PCX + nx / d * PRX * k, PCY + ny / d * PRY * k];
  };
  const NEST = { x: 300, y: 466, reach: [300, 430] };
  const START = [140, 370];
  const GAP = 40;  // how far apart the ducklings paddle in the line

  // --- art --------------------------------------------------------------------------------
  // a fluffy duckling swimming on the waterline at (x, y), facing right unless flip
  function drawDuckling(x, y, s, flip, t, scared) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const body = new Path2D(); body.ellipse(-2, -10, 19, 12, 0, 0, Math.PI * 2);
    const tail = P2('M-18,-14 L-28,-22 L-24,-10 Z');
    const head = new Path2D(); head.arc(11, -28, 11, 0, Math.PI * 2);
    // outline all the parts first, then fill, so they read as one fluffy shape
    ctx.strokeStyle = OL; ctx.lineWidth = 4;
    for (const p of [tail, body, head]) ctx.stroke(p);
    ctx.fillStyle = '#ffd84a'; ctx.fill(tail);
    const bg = ctx.createLinearGradient(0, -24, 0, 2);
    bg.addColorStop(0, '#fff09a'); bg.addColorStop(1, '#ffc93a');
    ctx.fillStyle = bg; ctx.fill(body);
    ctx.fillStyle = '#ffe56a'; ctx.fill(head);
    // a tuft of fluff on top, the little wing and the bill
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, -38); ctx.quadraticCurveTo(6, -44, 11, -45); ctx.moveTo(12, -39); ctx.quadraticCurveTo(14, -45, 18, -43); ctx.stroke();
    const flap = Math.sin(t * 10) * (scared ? 4 : 1.2);
    ink(P2(`M-12,-14 C-6,${-22 - flap} 6,${-20 - flap} 8,-12 C0,-8 -8,-9 -12,-14 Z`), '#ffcf3a', 1.2);
    ink(P2('M19,-30 C26,-31 31,-28 31,-25 C27,-22 22,-22 19,-24 Z'), '#ff9a2a', 1.2);
    ctx.fillStyle = '#1a0a14'; circle(14, -31, 2.6);
    ctx.fillStyle = '#fff'; circle(13.2, -32, 0.9);
    ctx.fillStyle = 'rgba(255,120,150,.45)'; circle(10, -24, 3);
    if (scared) { ctx.fillStyle = '#8fd8ff'; ellipse(-2, -44, 2.5, 4); }
    ctx.restore();
  }
  // Mama Duck: a white duck with a pink bow and pearls, built from the pond ducks' shapes
  function drawMama(x, y, s, flip, t, wob) {
    const hx = 46, hy = -70, r = 21;
    const head = new Path2D(); head.arc(hx, hy, r, 0, Math.PI * 2);
    const neck = wdNeck(hx, hy), bill = wdBill(hx, hy, r);
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    if (wob) ctx.rotate(Math.sin(wob * 30) * 0.12);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 4.5;
    for (const p of [WD_TAIL, WD_BODY, neck, head]) ctx.stroke(p);
    ctx.fillStyle = '#f2eef8'; ctx.fill(WD_TAIL);
    ctx.fillStyle = wdShade('#ffffff', -54, 8); ctx.fill(WD_BODY);
    ink(WD_WING, wdShade('#f4f0fa', -50, -16), 1.5);
    ctx.strokeStyle = '#c8bcd8'; ctx.lineWidth = 2;
    for (const fx of [-44, -30, -16]) { ctx.beginPath(); ctx.arc(fx, -28, 9, 0.3, Math.PI - 0.3); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; ctx.fill(neck); ctx.fill(head);
    ink(bill, '#ffa53a', 1.5);
    // pearls round her neck
    for (let i = 0; i < 5; i++) inkCircle(30 + i * 6, -50 + Math.abs(i - 2) * -1.5 + i * 0.5, 3.4, '#fffaf0', 0.8);
    // eye with lashes
    ctx.fillStyle = '#1a1a22'; circle(hx + 5, hy - 4, 4.4);
    ctx.fillStyle = '#3a7ad0'; circle(hx + 5, hy - 4, 2.6);
    ctx.fillStyle = '#fff'; circle(hx + 3.8, hy - 5.6, 1.4);
    ctx.strokeStyle = OL; ctx.lineWidth = 2;
    for (const a of [-2.2, -1.8, -1.4]) { ctx.beginPath(); ctx.moveTo(hx + 5 + Math.cos(a) * 5, hy - 4 + Math.sin(a) * 5); ctx.lineTo(hx + 5 + Math.cos(a) * 9, hy - 4 + Math.sin(a) * 9); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,130,170,.5)'; circle(hx - 2, hy + 8, 5);
    // a big pink bow on her head
    ctx.save(); ctx.translate(hx - 8, hy - 20); ctx.rotate(-0.3);
    ink(P2('M0,0 L-16,-10 L-16,10 Z'), '#ff6fae', 1.5); ink(P2('M0,0 L16,-10 L16,10 Z'), '#ff6fae', 1.5);
    inkCircle(0, 0, 4.5, '#ff9ac8', 1.2);
    ctx.restore();
    ctx.restore();
  }
  // water lapping over a swimmer's tummy, with a ripple ring round it
  function swimWater(x, y, w, t, moving) {
    ctx.fillStyle = 'rgba(76,190,240,.6)'; ellipse(x, y + 4, w * 0.56, 7);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y + 1, w * 0.58 + Math.sin(t * 4) * 2, 5, 0, 0, Math.PI * 2); ctx.stroke();
    if (moving) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(x, y + 3, w * 0.8, 8, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  // a cosy straw nest on the near bank
  function drawNest(x, y, glow, t) {
    if (glow) {
      const gr = ctx.createRadialGradient(x, y - 10, 10, x, y - 10, 110);
      gr.addColorStop(0, `rgba(255,246,168,${0.55 + Math.sin(t * 5) * 0.2})`); gr.addColorStop(1, 'rgba(255,246,168,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 110, y - 120, 220, 220);
    }
    inkEllipse(x, y, 66, 20, 0, '#c99a4a', 2);
    ctx.fillStyle = '#8a5a2a'; ellipse(x, y - 4, 50, 11);
    ctx.fillStyle = '#f8f0e0'; ellipse(x - 30, y - 6, 8, 5, 0.4); ellipse(x + 34, y - 4, 7, 4, -0.3);
    ctx.strokeStyle = '#a07030'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI; ctx.beginPath(); ctx.moveTo(x - 64 + i * 11, y + 6 - Math.sin(a) * 4); ctx.lineTo(x - 52 + i * 11, y + 14 - Math.sin(a + 1) * 6); ctx.stroke(); }
    ctx.strokeStyle = '#e8c070'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(x - 54 + i * 13, y - 14); ctx.lineTo(x - 46 + i * 13, y - 6); ctx.stroke(); }
    // a little sign so it's clear this is home
    inkRect(x - 92, y - 40, 5, 40, '#a0683a', 1.2, 1);
    ctx.save(); ctx.translate(x - 89, y - 46); ctx.rotate(0.08);
    rrect(-30, -14, 60, 26, 7, '#fff3d8', OL, 2.5); text('HOME', 0, -1, 14, '#c0506e', 'center', 800);
    ctx.restore();
  }
  const badge = (x, y, n, state, t) => {
    // state: 'next' (the one to find, pulses), 'line' (in the parade), 'wait'
    const r = state === 'next' ? 17 + Math.sin(t * 6) * 1.5 : 15;
    inkCircle(x, y, r, state === 'next' ? '#fff6a8' : state === 'line' ? '#bff0c8' : '#ffffff', 1.6);
    text(String(n), x, y + 1, n > 9 ? 16 : 20, '#5a2a6e', 'center', 800);
  };

  MG.ducklingparade = {
    kind: 'learn', title: () => 'Duckling Parade', icon: () => '🐥',
    how: g => `Mama Duck's ducklings swam away! Steer her with the mouse or the arrow keys. Pick up the ducklings in order: ${g.nums.slice(0, 3).join(', ')}... They follow behind you! Don't bump the big grumpy ducks. Then swim home to the nest.`,
    init(g) {
      const tier = g.tier;
      const n = [5, 7, 6][tier - 1];
      g.nums = Array.from({ length: n }, (_, i) => (tier === 3 ? (i + 1) * 2 : i + 1));
      // place the ducklings spread out round the pond, away from where Mama starts
      const spots = [];
      for (let tries = 0; spots.length < n && tries < 4000; tries++) {
        const a = rand(0, Math.PI * 2), k = Math.sqrt(rand(0.15, 0.82));
        const x = PCX + Math.cos(a) * PRX * k, y = PCY + Math.sin(a) * PRY * k;
        if (Math.hypot(x - START[0], (y - START[1]) * 2) < 170) continue;
        if (spots.some(([sx, sy]) => Math.hypot(sx - x, (sy - y) * 2.2) < 110 - tries / 60)) continue;
        spots.push([x, y]);
      }
      g.lings = g.nums.map((num, i) => ({ num, x: spots[i][0], y: spots[i][1], hx: spots[i][0], hy: spots[i][1], ph: rand(0, 6), inLine: false, scared: 0, face: rand(0, 1) < 0.5, poke: 0, nest: null }));
      // grumpy grown-up ducks paddling back and forth across the pond
      const kinds = shuffle(Object.keys(DUCK_SPECIES));
      const lanes = [[[352, 0.5]], [[340, 0.3], [404, 0.75]], [[334, 0.2], [402, 0.7]]][tier - 1];
      const speed = [42, 58, 72][tier - 1];
      g.bigs = lanes.map(([y, f], i) => {
        const half = PRX * Math.sqrt(1 - ((y - PCY) / PRY) ** 2) * 0.86;
        return { kind: kinds[i], y, x0: PCX - half, x1: PCX + half, x: lerp(PCX - half, PCX + half, f), dir: i % 2 ? -1 : 1, v: speed * (1 + i * 0.15), cross: 0 };
      });
      Object.assign(g, {
        mx: START[0], my: START[1], face: false, wob: 0, safe: 0, trail: [{ x: START[0], y: START[1] }],
        line: [], next: 0, wrong: 0, bumps: 0, hints: 0, since: 0, hintOn: false,
        stage: 'collect', st: 0, timeLeft: [100, 110, 110][tier - 1], hop: 0,
      });
      g.say = this.sayNext(g);
    },
    sayNext(g) {
      if (g.next >= g.nums.length) return 'You have them all! Now swim home to the nest!';
      const n = g.nums[g.next];
      return g.next === 0 ? `Find duckling number ${n} first!` : `Now find number ${n}!`;
    },
    start(g) { speak(g.tier === 3 ? `Count by twos! ${g.say}` : g.say); },
    // a point `dist` back along the path Mama swam
    along(g, dist) {
      let d = 0;
      for (let i = 1; i < g.trail.length; i++) {
        const a = g.trail[i - 1], b = g.trail[i], seg = Math.hypot(b.x - a.x, b.y - a.y);
        if (d + seg >= dist) { const k = (dist - d) / seg; return [lerp(a.x, b.x, k), lerp(a.y, b.y, k)]; }
        d += seg;
      }
      const last = g.trail[g.trail.length - 1];
      return [last.x, last.y];
    },
    update(g, dt) {
      g.st += dt; g.wob = Math.max(0, g.wob - dt); g.safe = Math.max(0, g.safe - dt);
      if (g.stage !== 'count') g.timeLeft -= dt;
      g.since += dt;
      const N = g.nums.length;

      // --- Mama swims: toward the pointer, or with the arrows ---
      const px = g.mx, py = g.my, sp = 250;
      if (g.stage !== 'count') {
        const kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        if (kx || ky) { const l = Math.hypot(kx, ky); g.mx += kx / l * sp * dt; g.my += ky / l * sp * 0.6 * dt; g.usePointer = false; }
        else if (pointerMoved(g)) {
          const [tx, ty] = inPond(pointer.x, pointer.y + 20), dx = tx - g.mx, dy = ty - g.my, l = Math.hypot(dx, dy);
          if (l > 4) { const step = Math.min(l, sp * dt); g.mx += dx / l * step; g.my += dy / l * step; }
        }
        [g.mx, g.my] = inPond(g.mx, g.my);
        // the nest is on the bank: once she has every baby, let her paddle right up to it
        if (g.stage === 'home') { const [nx, ny] = NEST.reach; if (Math.hypot(g.mx - nx, g.my - ny) < 60) { g.stage = 'count'; g.hop = 0.5; speak("Home! Let's count them in!"); } }
      }
      const moved = Math.hypot(g.mx - px, g.my - py);
      if (Math.abs(g.mx - px) > 0.3) g.face = g.mx < px;
      g.mMoving = moved > 0.5;
      const head = g.trail[0];
      if (Math.hypot(g.mx - head.x, g.my - head.y) > 3) {
        g.trail.unshift({ x: g.mx, y: g.my });
        if (g.trail.length > 600) g.trail.length = 600;
      }

      // --- the parade follows in Mama's exact path ---
      g.line.forEach((d, i) => {
        const [tx, ty] = this.along(g, (i + 1) * GAP + 14);
        const ox = d.x;
        d.x = lerp(d.x, tx, Math.min(1, dt * 9)); d.y = lerp(d.y, ty, Math.min(1, dt * 9));
        if (Math.abs(d.x - ox) > 0.2) d.face = d.x < ox;
      });

      // --- big ducks paddle back and forth; bumping one scares the last duckling off ---
      for (const b of g.bigs) {
        b.x += b.dir * b.v * dt;
        if (b.x > b.x1) { b.x = b.x1; b.dir = -1; }
        if (b.x < b.x0) { b.x = b.x0; b.dir = 1; }
        b.cross = Math.max(0, b.cross - dt);
        if (g.stage !== 'count' && !g.safe && Math.hypot(b.x - g.mx, (b.y - g.my) * 1.5) < 62) {
          g.bumps++; g.safe = 2; g.wob = 0.6; b.cross = 1.2;
          const away = Math.sign(g.mx - b.x) || 1;
          [g.mx, g.my] = inPond(g.mx + away * 50, g.my + Math.sign(g.my - b.y) * 18);
          quack(); SFX.miss();
          const lost = g.line.pop();
          if (lost) {
            // the baby paddles off to somewhere new, and becomes the one to find again
            Object.assign(lost, { inLine: false, scared: 1.2 });
            const [hx, hy] = inPond(rand(PCX - PRX, PCX + PRX), rand(PCY - PRY, PCY + PRY), 0.8);
            lost.hx = hx; lost.hy = hy;
            g.next = g.nums.indexOf(lost.num); g.stage = 'collect';
            floatText(lost.x, lost.y - 70, 'Peep! Eek!', '#fff', false, 22);
            g.say = `Oh no! Number ${lost.num} got scared. Go get number ${lost.num} again!`;
            speak(`Quack! Grumpy duck! ${g.say}`);
          } else speak('Quack! Watch out for the big ducks!');
        }
      }

      // --- ducklings still out on the pond ---
      const wiggle = [0, 22, 34][g.tier - 1];
      for (const d of g.lings) {
        d.poke = Math.max(0, d.poke - dt); d.scared = Math.max(0, d.scared - dt);
        if (d.inLine || d.nest) continue;
        const ox = d.x;
        const [tx, ty] = inPond(d.hx + Math.cos(g.st * 0.5 + d.ph) * wiggle, d.hy + Math.sin(g.st * 0.7 + d.ph) * wiggle * 0.35);
        d.x = lerp(d.x, tx, Math.min(1, dt * (d.scared ? 2.5 : 3))); d.y = lerp(d.y, ty, Math.min(1, dt * 3));
        if (Math.abs(d.x - ox) > 0.15) d.face = d.x < ox;
        if (g.stage !== 'collect' || Math.hypot(d.x - g.mx, (d.y - g.my) * 1.4) > 52) continue;
        if (d.num === g.nums[g.next]) {
          d.inLine = true; g.line.push(d); g.next = g.line.length; g.since = 0; g.hintOn = false;
          tone(880 + g.line.length * 90, 0.08, 'triangle', 0.1); tone(1320 + g.line.length * 90, 0.1, 'triangle', 0.08, 0.08);
          burst(d.x, d.y - 30, 14); floatText(d.x, d.y - 74, `${d.num}!`, '#fff6a8', false, 30);
          if (g.next >= N) { g.stage = 'home'; g.say = this.sayNext(g); speak(`${d.num}! ${g.say}`); }
          else { g.say = this.sayNext(g); speak(`${d.num}! ${g.say}`); }
        } else if (!d.poke) {
          // the wrong baby: it peeps and scoots out of the way
          d.poke = 2.5; g.wrong++; SFX.miss();
          const away = Math.sign(d.x - g.mx) || 1;
          [d.hx, d.hy] = inPond(d.hx + away * 90, d.hy + rand(-20, 20), 0.85);
          floatText(d.x, d.y - 74, `I'm ${d.num}!`, '#ffd0e0', false, 22);
          speak(`Peep! I'm number ${d.num}. Find number ${g.nums[g.next]} first!`);
        }
      }

      // stuck for a while: sparkles show where the next baby is
      if (g.stage === 'collect' && !g.hintOn && g.since > 14) { g.hintOn = true; g.hints++; speak(g.say); }

      // --- home: the babies hop into the nest one by one while we count ---
      if (g.stage === 'count') {
        g.hop -= dt;
        const waiting = g.line.filter(d => !d.nest);
        if (g.hop <= 0 && waiting.length) {
          const d = waiting[0], k = g.line.indexOf(d);
          d.nest = { t: 0, sx: d.x, sy: d.y, tx: k < 4 ? NEST.x - 45 + k * 30 : NEST.x - 30 + (k - 4) * 30, ty: k < 4 ? NEST.y - 2 : NEST.y - 16 };
          tone(660 + k * 80, 0.12, 'triangle', 0.1); floatText(d.nest.tx, d.nest.ty - 60, String(d.num), '#fff6a8', false, 30);
          speak(String(d.num));
          g.hop = 0.75;
          if (waiting.length === 1) g.endT = 2.2;
        }
        for (const d of g.line) if (d.nest) d.nest.t = Math.min(1, d.nest.t + dt * 2.2);
        if (g.endT != null && (g.endT -= dt) <= 0) g.done = true;
        if (g.endT != null && g.endT < 1.6 && !g.cheered) { g.cheered = true; quack(); burst(NEST.x, NEST.y - 30, 30); speak(`${g.nums.join(', ')}! All home safe!`); }
      }

      const got = g.line.length;
      g.progress = g.stage === 'collect' ? `Ducklings: ${got} of ${N}` : g.stage === 'home' ? 'Swim to the nest!' : 'All home!';
      const care = clamp(1 - 0.02 * g.wrong - 0.08 * g.bumps - 0.05 * g.hints, 0.4, 1);
      const home = g.stage === 'count' ? 1 : 0.9;
      g.score = (got / N) * care * home;
      if (g.timeLeft <= 0 && g.stage !== 'count') { g.score = (got / N) * care * 0.7; g.done = true; }
    },
    draw(g) {
      const t = g.st, N = g.nums.length, want = g.nums[g.next];
      drawNest(NEST.x, NEST.y, g.stage === 'home', t);
      // everything on the water, back to front
      const things = [
        ...g.lings.filter(d => !d.nest).map(d => ({ y: d.y, f: () => {
          const bob = Math.sin(t * 3 + d.ph) * 1.5, sc = 1.15;
          if (!d.inLine && g.hintOn && d.num === want) {
            for (let k = 0; k < 3; k++) star(d.x + Math.cos(t * 3 + k * 2.1) * 46, d.y - 26 + Math.sin(t * 3 + k * 2.1) * 30, 8, '#fff6a8', 4);
          }
          drawDuckling(d.x, d.y + bob, sc, d.face, t + d.ph, d.scared > 0 || d.poke > 2);
          swimWater(d.x, d.y + bob, 44 * sc, t + d.ph, d.inLine && g.mMoving);
          badge(d.x + (d.face ? -4 : 4), d.y - 62, d.num, d.inLine ? 'line' : d.num === want && g.stage === 'collect' ? 'next' : 'wait', t);
        } })),
        ...g.bigs.map(b => ({ y: b.y, f: () => {
          const bob = Math.sin(t * 2 + b.y) * 1.5;
          drawDuckSpecies(b.kind, b.x, b.y + bob, 0.56, b.dir < 0);
          swimWater(b.x, b.y + bob, 80, t, true);
          if (b.cross) outlined('QUACK!', b.x, b.y - 92, 22, '#ff8a8a', 'center');
          else { ctx.globalAlpha = 0.85; emoji('💢', b.x + (b.dir < 0 ? -30 : 30), b.y - 78, 18); ctx.globalAlpha = 1; }
        } })),
        { y: g.my, f: () => {
          const bob = Math.sin(t * 2.5) * 1.5;
          if (g.safe && Math.floor(t * 10) % 2) ctx.globalAlpha = 0.5;
          drawMama(g.mx, g.my + bob, 0.6, g.face, t, g.wob);
          ctx.globalAlpha = 1;
          swimWater(g.mx, g.my + bob, 80, t, g.mMoving);
        } },
      ].sort((a, b) => a.y - b.y);
      for (const th of things) th.f();
      // babies hopping into the nest
      for (const d of g.lings.filter(d => d.nest).sort((a, b) => a.nest.ty - b.nest.ty)) {
        const k = d.nest.t, x = lerp(d.nest.sx, d.nest.tx, k), y = lerp(d.nest.sy, d.nest.ty, k) - Math.sin(k * Math.PI) * 60;
        drawDuckling(x, y, lerp(1.15, 0.8, k), k >= 1 ? false : d.nest.tx < d.nest.sx, t + d.ph, false);
      }
      // an arrow from Mama toward home once everyone is in the line
      if (g.stage === 'home') {
        const [nx, ny] = NEST.reach, a = Math.atan2(ny - 20 - g.my, nx - g.mx), d = Math.hypot(nx - g.mx, ny - g.my);
        if (d > 90) {
          const ax = g.mx + Math.cos(a) * 70, ay = g.my - 40 + Math.sin(a) * 40;
          ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
          ink(P2('M-18,-8 L4,-8 L4,-18 L24,0 L4,18 L4,8 L-18,8 Z'), '#fff6a8', 1.5);
          ctx.restore();
        }
      }

      // --- the number line along the top: which babies are home in the parade, and who's next ---
      const bw = 58, w = N * bw + 40, x0 = W / 2 - w / 2;
      panel(x0 - 60, 66, w + 120, 104, 20);
      if (g.stage === 'collect') {
        const lead = g.next === 0 ? 'Find duckling number' : 'Now find number';
        text(lead, W / 2 - 26, 94, 26, '#5a2a6e', 'right', 700);
        outlined(String(want), W / 2 - 4, 94, 36, '#ffb020', 'left');
        emoji('🐥', W / 2 + (want > 9 ? 56 : 40), 94, 28);
      } else outlined(g.stage === 'home' ? 'Swim home to the nest!' : g.cheered ? `${g.nums.join(', ')}... all home!` : "Let's count them in!", W / 2, 94, 28, '#5fd07a', 'center');
      g.nums.forEach((n, i) => {
        const x = x0 + 20 + i * bw + bw / 2, y = 140, inLine = i < g.line.length;
        const st = inLine ? 'line' : i === g.next && g.stage === 'collect' ? 'next' : 'wait';
        if (inLine) { drawDuckling(x - 4, y + 14, 0.62, false, t + i, false); text(String(n), x + 18, y - 6, 16, '#3a9a5a', 'center', 800); }
        else badge(x, y, n, st, t);
        if (i < N - 1) { ctx.fillStyle = 'rgba(90,42,110,.3)'; circle(x + bw / 2, y, 3); }
      });
    },
  };

  restage('duckpond', {
    games: [['hideduck', 'shell', {}], ['ducklingparade', 'petal', {}]],
    mid: ["N:You found them all! But oh, quack, now my real ducklings have paddled off all over the pond!", "N:Can you swim them back in order? One, two, three... They'll follow right behind you!", 'A:excited:Follow the leader, little ducklings!'],
  });
}
