'use strict';
// Bramble Berry Patch: Berry Cart Dash (ride the cart, grab the berries on Bramble's pie recipe)
// and Picnic Shares (share treats fairly between hungry friends: division as sharing).
{
  const PI = Math.PI;
  // outline every path first, then fill them, so overlapping pieces read as one shape
  const inkGroup = (list, lw) => {
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of list) ctx.stroke(p);
    for (const [p, f] of list) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const glow = (x, y, r, col, a = 1) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = a; ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1;
  };
  const elP = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
  // repeat fn across the screen for a layer that scrolls at `off`
  const scrollTile = (off, period, fn) => { const s = ((off % period) + period) % period; for (let x = -s - period; x < W + period; x += period) fn(x, Math.round((x + off) / period)); };
  const say = (g, str, force) => { if (force || !(g.talkT > 0)) { speak(str); g.talkT = 2.4; } };
  const bubble = (x, y, str, col = '#5a2a6e', bg = '#ffffff') => {
    ctx.font = `800 17px ${FONT}`; const w = ctx.measureText(str).width + 24;
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(x - w / 2 - 2, y - 18, w + 4, 36, 18); ctx.fill(); tri(x - 9, y + 14, x + 9, y + 14, x - 2, y + 30);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 16, w, 32, 16); ctx.fill(); tri(x - 6, y + 12, x + 6, y + 12, x - 1, y + 26);
    text(str, x, y, 17, col, 'center', 800);
  };
  const butterfly = (x, y, t, col) => {
    const k = 0.35 + 0.65 * Math.abs(Math.sin(t * 9));
    for (const d of [-1, 1]) { ctx.fillStyle = OL; ellipse(x + d * 8 * k, y - 4, 10 * k + 1.5, 8.5); ctx.fillStyle = col; ellipse(x + d * 8 * k, y - 4, 10 * k, 7); ctx.fillStyle = mix(col, '#ffffff', 0.4); ellipse(x + d * 6 * k, y + 5, 6 * k, 5); }
    ctx.fillStyle = OL; ellipse(x, y, 2.5, 8);
  };

  // =========================================================================
  // berries (and other picnic treats), all hand drawn
  // =========================================================================
  const KINDS = {
    blue: { name: 'blueberry', many: 'blueberries', col: '#3f55d8' },
    straw: { name: 'strawberry', many: 'strawberries', col: '#ff3a4e' },
    red: { name: 'raspberry', many: 'raspberries', col: '#e8264a' },
    black: { name: 'blackberry', many: 'blackberries', col: '#3a1c4e' },
  };
  const DRUPE = [];
  for (let row = -2; row <= 2; row++) for (let c = -2; c <= 2; c++) {
    const x = (c + (row % 2 ? 0.5 : 0)) * 0.42, y = row * 0.38;
    if (x * x + y * y < 0.78) DRUPE.push([x, y]);
  }
  const strawPath = P2('M0,-0.72 C0.9,-1.05 1.18,0.05 0,1.05 C-1.18,0.05 -0.9,-1.05 0,-0.72 Z');
  function drawBerry(kind, x, y, r, col = KINDS[kind].col, shine = 1) {
    if (kind === 'blue') {
      inkCircle(x, y, r, col, 1.6);
      ctx.fillStyle = mix(col, '#1a1040', 0.25); ellipse(x + r * 0.2, y + r * 0.25, r * 0.7, r * 0.55);
      ctx.fillStyle = col; circle(x - r * 0.1, y - r * 0.1, r * 0.72);
      star(x, y - r * 0.62, r * 0.36, mix(col, '#1a1030', 0.5), 5);
      ctx.fillStyle = `rgba(255,255,255,${0.55 * shine})`; ellipse(x - r * 0.4, y - r * 0.3, r * 0.22, r * 0.14, -0.6);
      return;
    }
    if (kind === 'straw') {
      ctx.save(); ctx.translate(x, y); ctx.scale(r, r);
      ctx.strokeStyle = OL; ctx.lineWidth = 3.2 / r; ctx.stroke(strawPath); ctx.fillStyle = col; ctx.fill(strawPath);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-0.38, -0.3, 0.2, 0.32, -0.4);
      ctx.fillStyle = '#ffe680';
      for (const [sx, sy] of [[-0.45, -0.2], [0, -0.3], [0.45, -0.2], [-0.25, 0.2], [0.25, 0.2], [0, 0.55], [-0.55, 0.2], [0.55, 0.2]]) ellipse(sx, sy, 0.06, 0.09);
      ctx.restore();
      star(x, y - r * 0.82, r * 0.55, '#4fae3a', 5);
      return;
    }
    const k = kind === 'black' ? 0.34 : 0.37, stretch = kind === 'red' ? 1.12 : 1.02;
    ctx.strokeStyle = OL; ctx.lineWidth = 3.2;
    for (const [dx, dy] of DRUPE) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r * stretch, r * k, 0, TAU); ctx.stroke(); }
    const dark = mix(col, '#1a1030', 0.3);
    for (const [dx, dy] of DRUPE) { ctx.fillStyle = dark; circle(x + dx * r, y + dy * r * stretch, r * k); }
    for (const [dx, dy] of DRUPE) { ctx.fillStyle = col; circle(x + dx * r - r * 0.04, y + dy * r * stretch - r * 0.05, r * k * 0.82); }
    ctx.fillStyle = `rgba(255,255,255,${(kind === 'black' ? 0.7 : 0.5) * shine})`;
    for (const [dx, dy] of DRUPE) circle(x + dx * r - r * k * 0.35, y + dy * r * stretch - r * k * 0.4, r * k * 0.24);
    star(x, y - r * 0.92, r * 0.42, '#4f9a3a', 5);
  }

  // =========================================================================
  // 1. BERRY CART DASH: ride the cart down the bramble path and grab what Bramble's pie recipe needs
  // =========================================================================
  const LANES = [356, 420, 484], LSC = [0.84, 0.92, 1], CART_X = 210;
  const laneY = f => lerp(LANES[Math.floor(f)], LANES[Math.min(2, Math.floor(f) + 1)], f % 1);
  const laneS = f => lerp(LSC[Math.floor(f)], LSC[Math.min(2, Math.floor(f) + 1)], f % 1);
  const RECIPES = [
    [['blue', 4], ['straw', 3]],
    [['blue', 4], ['straw', 3], ['red', 2]],
    [['red', 3], ['black', 3], ['blue', 3]],
  ];
  const DISTRACT = [['red'], ['black'], ['straw']];

  function drawThornArch(x, gy, s) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); ctx.lineCap = 'round';
    for (const [x0, cx, x1, top] of [[-42, -10, 40, -100], [-34, 20, 44, -84]]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(cx, top * 2 + 40, x1, 0); ctx.stroke();
    }
    for (const [x0, cx, x1, top, col] of [[-42, -10, 40, -100, '#8a4a62'], [-34, 20, 44, -84, '#a05a72']]) {
      ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(cx, top * 2 + 40, x1, 0); ctx.stroke();
      for (let k = 0.08; k < 1; k += 0.11) {
        const t = k, px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, py = 2 * (1 - t) * t * (top * 2 + 40);
        ctx.fillStyle = OL; tri(px - 5, py - 2, px + 5, py - 2, px + (k < 0.5 ? -4 : 4), py - 15);
        ctx.fillStyle = '#ff6a7a'; tri(px - 3, py - 3, px + 3, py - 3, px + (k < 0.5 ? -3 : 3), py - 12);
      }
    }
    for (const [lx, ly, a] of [[-30, -52, -0.6], [26, -58, 0.5], [-4, -88, -0.2]]) { ctx.save(); ctx.translate(lx, ly); ctx.rotate(a); inkEllipse(0, 0, 12, 6, 0, '#5ab85a', 1.2); ctx.restore(); }
    ctx.restore();
  }
  function drawMud(x, gy, s, t) {
    inkEllipse(x, gy - 4 * s, 60 * s, 16 * s, 0, '#7a5232', 1.6);
    ctx.fillStyle = '#94683e'; ellipse(x - 6 * s, gy - 7 * s, 44 * s, 9 * s);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(x - 22 * s, gy - 9 * s, 12 * s, 3 * s);
    for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; ctx.strokeStyle = `rgba(80,50,30,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - 20 * s + i * 20 * s, gy - 6 * s, (2 + k * 5) * s, PI, 0); ctx.stroke(); }
  }
  function drawRaccoon(x, gy, s, t, carry, flee) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s * (flee ? -1 : 1), s);
    const step = Math.sin(t * 16);
    ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(4, 0, 40, 7);
    ctx.fillStyle = '#3a3a48'; for (const [lx, ph] of [[-12, 1], [-2, -1], [16, -1], [26, 1]]) { ctx.fillRect(lx - 4, -16 + ph * step * 3, 8, 16 - ph * step * 3); }
    const tail = elP(40, -36, 26, 11, -0.6), body = elP(8, -28, 32, 20), head = elP(-26, -44, 19, 17);
    const e1 = P2('M-40,-54 L-36,-72 L-26,-58 Z'), e2 = P2('M-22,-58 L-14,-74 L-8,-56 Z');
    inkGroup([[tail, '#9a9aa8'], [body, '#9a9aa8'], [head, '#b0b0bc'], [e1, '#9a9aa8'], [e2, '#9a9aa8']], 1.6);
    ctx.save(); ctx.clip(tail); ctx.fillStyle = '#3a3a48'; for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(26 + i * 11, -28 - i * 7); ctx.rotate(-0.6); ctx.fillRect(-3, -14, 6, 28); ctx.restore(); } ctx.restore();
    ctx.fillStyle = '#e8e8f0'; ellipse(-34, -38, 11, 8);
    ctx.fillStyle = '#3a3a48'; ellipse(-27, -48, 16, 6.5);
    ctx.fillStyle = '#fff'; circle(-33, -48, 3.6); circle(-21, -48, 3.6); ctx.fillStyle = '#1a0a20'; circle(-34, -48, 2); circle(-22, -48, 2);
    ctx.fillStyle = '#1a0a20'; circle(-43, -40, 3.2);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-35, -35, 4, 0.2, PI - 0.2); ctx.stroke();
    if (carry) drawBerry(carry, -40, -78, 13);
    ctx.restore();
  }
  function drawBerrySprig(x, gy, s, kind, t) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    glow(0, -58, 46, 'rgba(255,255,230,.9)', 0.6);
    inkGroup([[elP(-14, -10, 22, 16), '#3f9a4a'], [elP(12, -12, 24, 18), '#3f9a4a'], [elP(0, -22, 18, 14), '#3f9a4a']], 1.5);
    ctx.fillStyle = '#5ab85a'; ellipse(-8, -18, 9, 6); ellipse(14, -20, 8, 5);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(4, -26); ctx.quadraticCurveTo(-12, -66, 0, -78); ctx.stroke();
    ctx.strokeStyle = '#4f9a3a'; ctx.lineWidth = 2.5; ctx.stroke();
    const sw = Math.sin(t * 3 + x * 0.01) * 3;
    drawBerry(kind, sw, -54, 20);
    ctx.restore();
  }
  function drawCart(x, gy, s, lift, roll, load, wob) {
    ctx.fillStyle = 'rgba(40,20,60,.22)'; ellipse(x, gy, 70 * s * (1 - lift / 260), 9 * s);
    ctx.save(); ctx.translate(x, gy - lift); ctx.rotate(wob); ctx.scale(s, s);
    drawAubrey(-6, -36, 'idle_front', 1, 0, 0.38);
    // the berries already picked, piled in the back of the cart
    load.slice(-10).forEach((k, i) => drawBerry(k, -46 + (i % 5) * 9 + (i >= 5 ? 50 : 0), -60 - (i % 2) * 6, 9));
    const body = P2('M-66,-58 L66,-58 L56,-14 L-56,-14 Z');
    ink(body, '#c8864a', 2);
    ctx.save(); ctx.clip(body); ctx.strokeStyle = 'rgba(110,60,30,.45)'; ctx.lineWidth = 2;
    for (const y of [-44, -30]) { ctx.beginPath(); ctx.moveTo(-70, y); ctx.lineTo(70, y); ctx.stroke(); }
    ctx.restore();
    inkRect(-70, -64, 140, 10, '#e8aa66', 2, 5);
    inkCircle(0, -36, 13, '#fff4e0', 1.4); drawBerry('straw', 0, -35, 8);
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(56, -30); ctx.lineTo(88, -40); ctx.stroke();
    ctx.strokeStyle = '#a06a3a'; ctx.lineWidth = 3.5; ctx.stroke();
    for (const wx of [-36, 36]) {
      inkCircle(wx, -12, 16, '#9a6a3e', 1.8);
      ctx.strokeStyle = '#6a4224'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { const a = roll + i * PI / 3; ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * 13, -12 - Math.sin(a) * 13); ctx.lineTo(wx + Math.cos(a) * 13, -12 + Math.sin(a) * 13); ctx.stroke(); }
      inkCircle(wx, -12, 4, '#ffd27a', 1);
    }
    ctx.restore();
  }
  function drawPie(x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkEllipse(0, 6, 64, 20, 0, '#e8e0f8', 2);
    inkEllipse(0, 0, 54, 16, 0, '#e8a850', 2);
    ctx.fillStyle = '#8a2a6a'; ellipse(0, -1, 44, 11);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -1, 44, 11, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = '#f0c070'; ctx.lineWidth = 5; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 13 - 10, -14); ctx.lineTo(i * 13 + 10, 14); ctx.moveTo(i * 13 + 10, -14); ctx.lineTo(i * 13 - 10, 14); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20 + i * 20, -16 - k * 50); ctx.quadraticCurveTo(-10 + i * 20, -26 - k * 50, -20 + i * 20, -36 - k * 50); ctx.stroke(); }
    ctx.restore();
  }

  MG.berrycartdash = {
    kind: 'action', title: () => 'Berry Cart Dash', icon: () => '🛒',
    how: g => `Ride the berry cart! Press UP or DOWN, or tap a lane, to switch lanes. Press SPACE, or tap the cart, to jump. Grab the berries on Bramble's pie recipe. Dodge the thorns and mud${g.tier > 1 ? ', and jump over the sneaky raccoon' : ''}!`,
    init(g) {
      const t = g.tier - 1;
      g.recipe = RECIPES[t].map(([kind, need]) => ({ kind, need, have: 0, bounce: 0 }));
      g.total = g.recipe.reduce((a, r) => a + r.need, 0);
      Object.assign(g, { lane: 2, ly: 2, jump: 0, dist: 0, v: 0, speed: [170, 200, 235][t], gap: [1.2, 1.02, 0.88][t], spawnT: 1.4,
        items: [], slow: 0, wob: 0, hits: 0, extras: 0, stolen: 0, load: [], timeLeft: [75, 75, 80][t], end: 0, talkT: 0, rows: 0,
        say: 'Grab the berries on the recipe card! Switch lanes to dodge the thorns.' });
    },
    start(g) {
      const list = g.recipe.map(r => `${NUM_WORDS[r.need]} ${KINDS[r.kind].many}`);
      speak(`Bramble's pie needs ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}. Let's go!`);
    },
    spawnRow(g) {
      const t = g.tier, x = W + 70;
      g.rows++;
      const lanes = shuffle([0, 1, 2]);
      const obsChance = g.rows < 3 ? 0 : [0.6, 0.7, 0.8][t - 1];
      const nObs = Math.random() < obsChance ? (t === 3 && Math.random() < 0.3 ? 2 : 1) : 0;
      for (let i = 0; i < nObs; i++) {
        const r = Math.random(), coonOK = t > 1 || g.rows > 8;
        const type = coonOK && r < (t === 1 ? 0.15 : 0.25) ? 'coon' : r < 0.62 ? 'thorn' : 'mud';
        g.items.push({ type, lane: lanes[i], x: x + (type === 'coon' ? 30 : 0) });
      }
      if (Math.random() < 0.9) {
        const need = g.recipe.filter(r => r.have < r.need);
        const done = g.recipe.filter(r => r.have >= r.need).map(r => r.kind);
        let kind;
        if (need.length && Math.random() < 0.6) {
          const bag = need.flatMap(r => Array(r.need - r.have).fill(r.kind));
          kind = pick(bag);
        } else if (nObs < 2) kind = pick([...DISTRACT[t - 1], ...done]);
        // never block the only free lane with a berry Bramble doesn't need
        if (!kind) return;
        g.items.push({ type: 'berry', kind, lane: lanes[nObs], x: x + rand(-20, 40) });
      }
    },
    update(g, dt) {
      g.talkT -= dt; g.slow = Math.max(0, g.slow - dt); g.wob = Math.max(0, g.wob - dt);
      for (const r of g.recipe) r.bounce = Math.max(0, r.bounce - dt);
      if (g.end) {
        g.end += dt; g.v = Math.max(0, g.v - 260 * dt); g.dist += g.v * dt;
        for (const it of g.items) it.x -= g.v * dt;
        g.ly = lerp(g.ly, g.lane, Math.min(1, dt * 12));
        if (g.end > 3.6) g.done = true;
        return;
      }
      g.timeLeft -= dt;
      // steering: arrows, W/S, or tap a lane (tap your own lane, or the cart, to jump)
      if (pressed.arrowup || pressed.w) g.lane = Math.max(0, g.lane - 1);
      if (pressed.arrowdown || pressed.s) g.lane = Math.min(2, g.lane + 1);
      let jump = pressed[' '];
      if (pointer.clicked && pointer.y > 300) {
        const cy = laneY(g.ly) - 40;
        if (Math.abs(pointer.x - CART_X) < 80 && Math.abs(pointer.y - cy) < 70) jump = true;
        else {
          const l = LANES.reduce((b, y, i) => (Math.abs(pointer.y - 18 - y) < Math.abs(pointer.y - 18 - LANES[b]) ? i : b), 0);
          if (l === g.lane) jump = true; else g.lane = l;
        }
      }
      if (jump && g.jump <= 0) { g.jump = 0.01; SFX.jump(); }
      if (g.jump > 0) { g.jump += dt; if (g.jump > 0.72) g.jump = 0; }
      g.ly = lerp(g.ly, g.lane, Math.min(1, dt * 12));
      const lift = g.jump > 0 ? Math.sin(PI * g.jump / 0.72) * 80 : 0;
      // rolling along
      const target = g.speed * (1 + Math.min(0.25, g.t / 200)) * (g.slow > 0 ? 0.45 : 1);
      g.v = lerp(g.v, target, Math.min(1, dt * 3));
      g.dist += g.v * dt;
      if ((g.spawnT -= dt * g.v / g.speed) <= 0) { this.spawnRow(g); g.spawnT = g.gap; }
      for (const it of g.items) {
        it.x -= g.v * dt + (it.type === 'coon' && !it.flee ? 70 * dt : 0);
        if (it.flee) { it.x += 260 * dt; it.fy = (it.fy || 0) - 120 * dt; }
        if (it.used || it.lane !== g.lane || Math.abs(g.ly - g.lane) > 0.5) continue;
        const dx = it.x - CART_X;
        if (it.type === 'berry' && Math.abs(dx) < 52) this.grab(g, it);
        else if (it.type === 'thorn' && Math.abs(dx) < 46) {
          it.used = true; g.hits++; g.slow = 0.8; g.wob = 0.6; SFX.miss(); burst(CART_X + 40, laneY(g.ly) - 60, 10, { colors: ['#5ab85a', '#8a4a62'] });
          floatText(CART_X, laneY(g.ly) - 140, 'Ouch, thorns!', '#ffb0c4', false, 24); say(g, pick(['Ouch! Switch lanes to miss the thorns!', 'Prickly! Go around the thorns!']));
        } else if (it.type === 'mud' && Math.abs(dx) < 44) {
          it.used = true;
          if (lift > 30) { floatText(CART_X, laneY(g.ly) - 150, 'Jumped it!', '#fff6a8', false, 22); SFX.hit(); continue; }
          g.hits++; g.slow = 1.6; g.wob = 0.4; noise(0.25, 0.06); burst(CART_X, laneY(g.ly), 14, { colors: ['#7a5232', '#94683e'], up: 120 });
          floatText(CART_X, laneY(g.ly) - 140, 'Squelch! Mud!', '#e8c8a0', false, 24); say(g, 'Squelch! Mud makes you slow. Jump over it!');
        } else if (it.type === 'coon' && Math.abs(dx) < 46) {
          it.used = true;
          if (lift > 30) { floatText(CART_X, laneY(g.ly) - 150, 'Hop!', '#fff6a8', false, 26); SFX.hit(); say(g, 'Hop! You jumped right over the raccoon!'); continue; }
          g.hits++; g.wob = 0.5; SFX.miss();
          const got = g.recipe.filter(r => r.have > 0);
          if (got.length) {
            const r = pick(got); r.have--; r.bounce = 0.6; g.stolen++; it.carry = r.kind; const li = g.load.lastIndexOf(r.kind); if (li >= 0) g.load.splice(li, 1);
            say(g, `Hey! The raccoon took a ${KINDS[r.kind].name}! Jump over him next time!`, true);
          } else say(g, 'Bump! Jump over the raccoon!');
          it.flee = true;
        }
      }
      g.items = g.items.filter(it => it.x > -120 && it.x < W + 300);
      const have = g.recipe.reduce((a, r) => a + Math.min(r.have, r.need), 0);
      g.progress = `Berries ${have} of ${g.total}`;
      g.score = clamp(have / g.total - g.hits * 0.05 - g.extras * 0.05, 0, 1);
      if (have >= g.total) {
        g.end = 0.01; g.items = g.items.filter(it => it.x < CART_X); SFX.fanfare();
        speak('That is everything for the pie! Time to bake!');
      } else if (g.timeLeft <= 0) g.done = true;
    },
    grab(g, it) {
      it.used = true; it.gone = true;
      const r = g.recipe.find(q => q.kind === it.kind), y = laneY(g.ly) - 70;
      if (r && r.have < r.need) {
        r.have++; r.bounce = 0.6; g.load.push(it.kind); SFX.pop(); tone(660 + r.have * 90, 0.12, 'triangle', 0.07, 0.05);
        burst(CART_X, y, 16, { colors: [KINDS[it.kind].col, '#ffffff', '#fff6a8'], spread: 200 });
        floatText(CART_X + 40, y - 70, '+1', '#fff6a8', false, 30);
        if (r.have === r.need) { SFX.sparkle(); say(g, `That's all the ${KINDS[r.kind].many}!`, true); }
      } else {
        g.extras++; SFX.blip(); burst(CART_X, y, 8, { colors: [KINDS[it.kind].col] });
        floatText(CART_X + 30, y - 30, 'Not needed', '#ffd0e0', false, 20);
        say(g, r ? `Bramble has enough ${KINDS[it.kind].many}!` : `Bramble doesn't need ${KINDS[it.kind].many}. Look at the recipe!`);
      }
    },
    draw(g) {
      const d = g.dist;
      // rolling hills and bramble hedges behind the path
      ctx.fillStyle = '#a2d98c'; ctx.beginPath(); ctx.moveTo(0, 340);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 268 + Math.sin((x + d * 0.2) * 0.007) * 22 + Math.sin((x + d * 0.2) * 0.019) * 8);
      ctx.lineTo(W, 340); ctx.fill();
      ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 268 + Math.sin((x + d * 0.2) * 0.007) * 22 + Math.sin((x + d * 0.2) * 0.019) * 8);
      ctx.stroke();
      scrollTile(d * 0.6, 210, (x, i) => {
        const h = 1 + (Math.abs(i) % 3) * 0.12;
        inkGroup([[elP(x, 312, 46 * h, 34 * h), '#3f9a4a'], [elP(x + 44, 300, 52 * h, 44 * h), '#3f9a4a'], [elP(x + 92, 314, 44 * h, 30 * h), '#3f9a4a']], 1.6);
        ctx.fillStyle = '#56b45a'; ellipse(x + 30, 284, 22, 14); ellipse(x - 10, 300, 16, 10);
        for (let k = 0; k < 6; k++) { const bx = x + (k * 29) % 120 - 10, by = 290 + (k * 13) % 30; ctx.fillStyle = OL; circle(bx, by, 5); ctx.fillStyle = ['#3f55d8', '#e8264a', '#3a1c4e'][(k + i) % 3]; circle(bx, by, 4); }
        flower(x + 70, 280, 5, '#fff', '#ffd84a', 1);
      });
      // the dirt path with wheel ruts
      ctx.fillStyle = '#e6c088'; ctx.fillRect(0, 322, W, 196);
      ctx.fillStyle = '#d8ae72'; ctx.fillRect(0, 322, W, 8);
      ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 322); ctx.lineTo(W, 322); ctx.stroke();
      ctx.setLineDash([26, 22]); ctx.lineDashOffset = d % 48; ctx.strokeStyle = 'rgba(150,100,50,.4)'; ctx.lineWidth = 4;
      for (const y of [388, 452]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.setLineDash([]);
      scrollTile(d, 150, (x, i) => { ctx.fillStyle = 'rgba(150,110,70,.5)'; ellipse(x + (i * 37) % 60, 340 + (Math.abs(i) * 53) % 160, 6, 3); });
      // lane hint arrows for tapping
      // hazards, berries and the cart, back lane first
      for (let l = 0; l < 3; l++) {
        for (const it of g.items) {
          if (it.lane !== l || it.gone) continue;
          const gy = LANES[l], s = LSC[l];
          if (it.type === 'berry') drawBerrySprig(it.x, gy, s * 1.05, it.kind, S.t);
          else if (it.type === 'thorn') drawThornArch(it.x, gy, s);
          else if (it.type === 'mud') drawMud(it.x, gy, s, S.t);
          else if (it.type === 'coon' && !it.flee) drawRaccoon(it.x, gy, s, S.t, null, false);
        }
        if (Math.round(g.ly) === l) {
          const lift = g.jump > 0 ? Math.sin(PI * g.jump / 0.72) * 80 : 0;
          drawCart(CART_X, laneY(g.ly), laneS(g.ly), lift, -d / 16, g.load, g.wob > 0 ? Math.sin(g.wob * 40) * 0.06 : 0);
        }
      }
      for (const it of g.items) if (it.flee) drawRaccoon(it.x, LANES[it.lane] + it.fy, LSC[it.lane], S.t, it.carry, true);
      // front grass strip
      ctx.fillStyle = '#7fcc66'; ctx.fillRect(0, 512, W, 28);
      ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 512); ctx.lineTo(W, 512); ctx.stroke();
      scrollTile(d * 1.1, 90, (x, i) => flower(x, 526, 6, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][((i % 4) + 4) % 4], '#ffd84a', 1.2));
      for (let i = 0; i < 3; i++) {
        const x = ((i * 330 - d * 0.4 + S.t * 40) % (W + 120) + W + 120) % (W + 120) - 60;
        butterfly(x, 170 + i * 34 + Math.sin(S.t * 2 + i) * 18, S.t + i, ['#ffb0e0', '#ffd84a', '#9ad0ff'][i]);
      }
      // Bramble's recipe card
      const n = g.recipe.length, cw = 96 + n * 112, cx = W / 2 - cw / 2;
      panel(cx, 62, cw, 70, 20);
      drawCritterPortrait('Bramble the Bear', cx + 8, 68, 58, 58);
      text('Pie', cx + 37, 120, 11, '#9a7aaa', 'center', 800);
      g.recipe.forEach((r, i) => {
        const x = cx + 92 + i * 112, done = r.have >= r.need, b = 1 + Math.sin(r.bounce * 14) * r.bounce * 0.4;
        ctx.save(); ctx.translate(x + 20, 97); ctx.scale(b, b);
        drawBerry(r.kind, 0, 0, 19);
        ctx.restore();
        text(`${r.have}/${r.need}`, x + 46, 98, 24, done ? '#3aa04a' : '#5a2a6e', 'left', 800);
        if (done) { inkCircle(x + 36, 78, 11, '#5adc7a', 1.2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 31, 78); ctx.lineTo(x + 35, 82); ctx.lineTo(x + 42, 73); ctx.stroke(); }
      });
      if (g.t < 6 && !g.end) { rrect(W / 2 - 230, 140, 460, 34, 17, 'rgba(48,24,72,.78)'); text('⬆ ⬇ or tap a lane to steer · SPACE or tap the cart to jump', W / 2, 157, 15, '#fff6a8', 'center', 700); }
      // the pie-baking finale
      if (g.end > 0.6) {
        const k = easeOut(clamp((g.end - 0.6) / 0.8, 0, 1)), bx = lerp(1150, 832, k);
        inkRect(bx - 150, 410, 130, 20, '#b8804a', 2, 6); inkRect(bx - 140, 430, 14, 50, '#9a6a3e', 1.5, 3); inkRect(bx - 44, 430, 14, 50, '#9a6a3e', 1.5, 3);
        if (g.phase !== 'result') drawCritter('Bramble the Bear', bx + 40, GY + 40, 0.72, -1); // same spot the results screen draws him
        if (g.end > 1.6) {
          const p = easeOut(clamp((g.end - 1.6) / 0.4, 0, 1));
          drawPie(bx - 85, 400, p * 1.1, S.t);
          if (g.end < 1.7) burst(bx - 85, 380, 20, { kind: 'heart', colors: ['#ff6fae', '#ffd84a', '#8a2a6a'] });
          outlined('Berry Pie!', W / 2, 220, 56 + Math.sin(S.t * 6) * 3, '#ff6fb5', 'center', '#fff');
        }
      }
    },
  };

  // =========================================================================
  // 2. PICNIC SHARES: hungry friends at a picnic; share the treats so everyone gets the same
  // =========================================================================
  const PALS = [['Bramble the Bear', 'Bramble', 0.6], ['Hazel Hedgehog', 'Hazel', 0.76], ['Scamper Squirrel', 'Scamper', 0.72], ['Millie Mouse', 'Millie', 0.8], ['Penny the Pig', 'Penny', 0.66]];
  const TREATS = {
    berry: { one: 'berry', many: 'berries' }, cookie: { one: 'cookie', many: 'cookies' },
    honey: { one: 'honey drop', many: 'honey drops' }, pie: { one: 'slice of pie', many: 'slices of pie' },
  };
  const FEET = 318, PLATE = 354, BOWL = { x: 480, y: 482 }, BIRD = { x: 92, y: 420 };
  function drawTreat(type, x, y, r, i = 0, rot = 0) {
    if (type === 'berry') { const k = i % 3 === 2 ? 'straw' : i % 2 ? 'red' : 'blue'; drawBerry(k, x, y, r); return; }
    if (type === 'cookie') {
      inkCircle(x, y, r, '#e0a860', 1.5);
      ctx.fillStyle = '#eab878'; circle(x - r * 0.15, y - r * 0.15, r * 0.7);
      ctx.fillStyle = '#5a3020'; for (const [a, b] of [[-0.4, -0.3], [0.35, -0.2], [0, 0.35], [-0.3, 0.4], [0.45, 0.35]]) circle(x + a * r, y + b * r, r * 0.13);
      return;
    }
    if (type === 'honey') {
      ctx.save(); ctx.translate(x, y); ctx.scale(r / 10, r / 10);
      const p = P2('M0,-12 C4,-6 10,0 10,4 C10,10 5,13 0,13 C-5,13 -10,10 -10,4 C-10,0 -4,-6 0,-12 Z');
      ink(p, '#ffbf2a', 1.5 * 10 / r); ctx.fillStyle = '#ffe07a'; ellipse(-3, 3, 3, 5, 0.3); ctx.fillStyle = '#fff'; circle(-4, 0, 1.6);
      ctx.restore();
      return;
    }
    // a wedge of berry pie
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(r / 14, r / 14);
    const w = P2('M0,10 L-14,-10 Q0,-16 14,-10 Z');
    ink(w, '#f0c070', 1.5 * 14 / r);
    ctx.fillStyle = '#8a2a6a'; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-10, -7); ctx.quadraticCurveTo(0, -11, 10, -7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f0c070'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(6, -2); ctx.moveTo(0, 4); ctx.lineTo(0, -9); ctx.stroke();
    ctx.restore();
  }
  // where each treat sits in a friend's pile: two wide and stacking up, so piles are easy to compare by height
  const pileSpot = j => [((j % 3) - 1) * 26, -Math.floor(j / 3) * 18];

  function drawBird(x, y, t, fed) {
    ctx.save(); ctx.translate(x, y);
    const hop = fed > 0 ? Math.abs(Math.sin(t * 14)) * 8 : 0;
    ctx.translate(0, -hop);
    inkGroup([[elP(0, 0, 22, 18), '#7ab8f0'], [elP(-14, -16, 13, 12), '#7ab8f0'], [P2('M14,-4 L34,-14 L30,4 Z'), '#5a90d0']], 1.5);
    ctx.fillStyle = '#fff4e0'; ellipse(-4, 6, 13, 10);
    ctx.fillStyle = OL; tri(-26, -18, -36, -14, -26, -12);
    ctx.fillStyle = '#ffb83a'; tri(-26, -17, -34, -14, -26, -13);
    ctx.fillStyle = '#1a0a20'; circle(-17, -19, 2.6); ctx.fillStyle = '#fff'; circle(-18, -20, 1);
    ctx.fillStyle = '#ff9ac0'; circle(-10, -11, 3);
    ctx.restore();
  }
  function drawPicnic(g) {
    // a big shady tree, then the gingham blanket in perspective
    drawTree(30, 300, 300, 70, 0, 0);
    drawTree(940, 300, 260, 60, 2, 0);
    const top = 268, blanket = P2(`M110,${top} L850,${top} L960,540 L0,540 Z`);
    ctx.save(); ctx.translate(4, 6); ctx.fillStyle = 'rgba(40,20,60,.15)'; ctx.fill(blanket); ctx.restore();
    ink(blanket, '#fffaf6', 2);
    ctx.save(); ctx.clip(blanket);
    ctx.fillStyle = 'rgba(232,58,90,.28)';
    for (let i = 0; i < 18; i += 2) { const a = 110 + i * 740 / 18, b = 110 + (i + 1) * 740 / 18, c = (i + 1) * W / 18, e = i * W / 18; ctx.beginPath(); ctx.moveTo(a, top); ctx.lineTo(b, top); ctx.lineTo(c, H); ctx.lineTo(e, H); ctx.fill(); }
    for (let j = 0; j < 10; j += 2) { const y0 = top + (H - top) * Math.pow(j / 10, 1.3), y1 = top + (H - top) * Math.pow((j + 1) / 10, 1.3); ctx.fillRect(0, y0, W, y1 - y0); }
    ctx.restore();
    // picnic basket (the bird perches on it), lemonade
    const bx = BIRD.x, by = BIRD.y + 30;
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(bx, by, 44, PI * 1.05, PI * 1.95); ctx.stroke(); ctx.strokeStyle = '#c8904a'; ctx.lineWidth = 5; ctx.stroke();
    inkRect(bx - 56, by, 112, 66, '#d8a050', 2, 10);
    ctx.strokeStyle = 'rgba(130,80,30,.5)'; ctx.lineWidth = 2; for (let y = by + 12; y < by + 64; y += 12) { ctx.beginPath(); ctx.moveTo(bx - 52, y); ctx.lineTo(bx + 52, y); ctx.stroke(); }
    inkRect(bx - 60, by - 6, 120, 12, '#e8b866', 2, 6);
    const jx = 880, jy = 500;
    inkRect(jx - 26, jy - 66, 52, 70, 'rgba(255,240,140,.9)', 2, 14);
    ctx.fillStyle = '#fff6c0'; ctx.fillRect(jx - 20, jy - 56, 8, 48);
    inkCircle(jx + 2, jy - 70, 9, '#ffe066', 1.2); ctx.fillStyle = '#9ad46a'; ellipse(jx - 10, jy - 72, 8, 4, -0.5);
    inkRect(jx + 34, jy - 32, 26, 36, 'rgba(255,240,160,.9)', 2, 6);
    for (let i = 0; i < 3; i++) {
      const x = ((i * 310 + S.t * 50) % (W + 100)) - 50;
      butterfly(x, 120 + i * 40 + Math.sin(S.t * 2.2 + i * 2) * 20, S.t + i, ['#ffb0e0', '#ffd84a', '#9ad0ff'][i]);
    }
  }

  MG.berryfairshare = {
    kind: 'learn', title: () => 'Picnic Shares', icon: () => '🧺',
    how: g => (g.tier === 3
      ? 'Share the treats so every friend gets the SAME. Tap a friend, or drag a treat to them. If some are left over and cannot be shared fairly, give them to the little bird!'
      : 'Share the treats so every friend gets the SAME. Tap a friend, or drag a treat to them, or press DEAL to give one to everybody. Then say how many each friend got!'),
    init(g) {
      Object.assign(g, { rounds: [5, 5, 6][g.tier - 1], round: 0, credit: 0, fx: [], last: '', talkT: 0, guestRounds: [[2], [1, 3], [3]][g.tier - 1] });
      this.newRound(g);
    },
    start(g) { speak(g.say); },
    newRound(g) {
      const t = g.tier, guest = g.guestRounds.includes(g.round);
      let n, k, r = 0, total, guard = 0;
      if (guest) { [n, total] = t === 3 ? pick([[2, 9], [3, 12]]) : g.round < 3 ? [2, 6] : [3, 12]; k = Math.floor(total / n); r = total % n; }
      else {
        do {
          n = g.round === 0 ? 2 : randInt(2, t === 1 ? 3 : 4);
          k = randInt(2, t === 1 ? 4 : 5);
          while (n * k > [9, 12, 14][t - 1]) k--;
          r = t === 3 && g.round % 2 === 1 ? randInt(1, n - 1) : 0;
        } while (`${n},${k},${r}` === g.last && guard++ < 20);
        total = n * k + r;
      }
      g.last = `${n},${k},${r}`;
      const treat = ['berry', 'cookie', 'pie', 'honey'][g.round % 4];
      Object.assign(g, { n, k, rem: r, total, treat, guest, bowl: total, plates: Array(5).fill(0), bird: 0, hasBird: t === 3, st: 'share', miss: 0, askMiss: 0, warn: 0, low: [],
        checked: false, guestIn: false, deal: [], dealT: 0, drag: null, choices: null, wait: 0, hop: Array(5).fill(0), px: [], fed: 0,
        canDeal: t === 1 || (t === 2 && g.round < 2) });
      this.layout(g, true);
      g.say = `Share ${NUM_WORDS[total]} ${TREATS[treat].many} with ${NUM_WORDS[n]} friends. Everyone gets the same!` + (g.hasBird ? ' Leftovers go to the bird.' : '');
      if (g.round > 0) say(g, g.say, true);
    },
    layout(g, snap) {
      const xs = [...Array(g.n).keys()].map(i => 170 + (640 / g.n) * (i + 0.5));
      g.tx = xs; if (snap) g.px = [...xs];
      while (g.px.length < g.n) g.px.push(1060);
    },
    give(g, dest, from) {
      if (g.bowl <= 0) return;
      g.bowl--;
      const idx = g.total - g.bowl - 1;
      if (dest === 'bird') g.bird++; else { g.plates[dest]++; g.hop[dest] = 0.5; }
      const [fx, fy] = from || [BOWL.x, BOWL.y - 30];
      g.fx.push({ i: idx, x0: fx, y0: fy, dest, t: 0, dur: 0.38 });
      g.checked = false; SFX.pop();
    },
    takeBack(g, dest) {
      if (dest === 'bird' ? g.bird <= 0 : g.plates[dest] <= 0) return;
      if (dest === 'bird') g.bird--; else g.plates[dest]--;
      g.bowl++; g.checked = false; SFX.blip();
    },
    destXY(g, dest, j) {
      if (dest === 'bird') return [BIRD.x, BIRD.y];
      if (dest === 'bowl') return [BOWL.x, BOWL.y - 30];
      const [dx, dy] = pileSpot(j); return [g.px[dest] + dx, PLATE - 4 + dy];
    },
    check(g) {
      g.checked = true;
      const pl = g.plates.slice(0, g.n), max = Math.max(...pl), min = Math.min(...pl);
      if (max !== min) {
        g.miss++; g.warn = 3.5; g.low = pl.map((v, i) => (v < max ? i : -1)).filter(i => i >= 0); SFX.miss();
        const a = PALS[pl.indexOf(max)][1], b = PALS[pl.indexOf(min)][1];
        if (g.hasBird && max - min === 1) say(g, `Hey! ${a} got one more than ${b}! When treats can't be shared fairly, give the extras to the bird.`, true);
        else say(g, `Hey! No fair! ${a} has ${NUM_WORDS[max]}, but ${b} only has ${NUM_WORDS[min]}. Take some back and share again.`, true);
        return;
      }
      if (g.bird >= g.n) {
        g.miss++; g.warn = 3.5; g.low = pl.map((_, i) => i); SFX.miss();
        say(g, `The bird has ${NUM_WORDS[g.bird]}! That is enough to give every friend one more!`, true);
        return;
      }
      if (g.guest) {
        // fair! but here comes a surprise guest, so everything goes back in the bowl to share again
        g.st = 'guest'; g.wait = 3.2; g.guest = false; SFX.sparkle();
        say(g, `Fair! Oh, look! ${PALS[g.n][1]} wants to join the picnic! Now we have to share again.`, true);
        return;
      }
      g.st = 'ask'; SFX.sparkle();
      const set = new Set([g.k]);
      for (const dd of shuffle([1, -1, 2])) if (set.size < 3 && g.k + dd >= 1) set.add(g.k + dd);
      g.choices = shuffle([...set]);
      g.say = `Fair! How many ${TREATS[g.treat].many} does each friend get?`;
      say(g, g.bird ? `Fair! And ${NUM_WORDS[g.bird]} for the bird. How many does each friend get?` : g.say, true);
    },
    answer(g, v) {
      if (v === g.k) {
        g.credit += Math.max(0.25, 1 - g.miss * 0.35 - g.askMiss * 0.35);
        g.st = 'feast'; g.wait = 2.6; SFX.fanfare();
        for (let i = 0; i < g.n; i++) burst(g.px[i], PLATE - 40, 10, { kind: 'heart', colors: ['#ff6fae', '#ffd84a'] });
        say(g, `Yes! ${NUM_WORDS[g.total - g.bird]} shared by ${NUM_WORDS[g.n]} is ${NUM_WORDS[g.k]} each. Yum!`, true);
      } else { g.askMiss++; SFX.miss(); say(g, 'Not quite. Count the treats in just one pile!', true); }
    },
    update(g, dt, id) {
      g.warn = Math.max(0, g.warn - dt); g.talkT -= dt; g.fed = Math.max(0, g.fed - dt);
      g.hop = g.hop.map(h => Math.max(0, h - dt));
      for (let i = 0; i < g.n; i++) g.px[i] = lerp(g.px[i], g.tx[i], Math.min(1, dt * 4));
      for (const f of g.fx) { f.t += dt; if (f.t >= f.dur) { f.gone = true; if (f.dest === 'bird') g.fed = 0.6; } }
      g.fx = g.fx.filter(f => !f.gone);
      if (g.st === 'feast') {
        if (Math.floor(g.wait * 6) !== Math.floor((g.wait - dt) * 6)) tone(rand(200, 320), 0.06, 'triangle', 0.06);
        if ((g.wait -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.newRound(g); }
      } else if (g.st === 'guest') {
        g.wait -= dt;
        if (g.wait < 2.2 && !g.guestIn) { g.guestIn = true; g.n++; this.layout(g, false); } // only one guest per round
        if (g.wait < 1.0 && g.bowl < g.total) {
          // everything flies back to the bowl
          for (let i = 0; i < g.n; i++) for (let j = 0; j < g.plates[i]; j++) { const [x, y] = this.destXY(g, i, j); g.fx.push({ i: j, x0: x, y0: y, dest: 'bowl', t: 0, dur: 0.45 }); }
          g.plates.fill(0); g.bird = 0; g.bowl = g.total; SFX.jump();
        }
        if (g.wait <= 0) {
          g.st = 'share'; g.checked = false; g.k = Math.floor(g.total / g.n); g.rem = g.total % g.n;
          g.say = `Now share ${NUM_WORDS[g.total]} ${TREATS[g.treat].many} with ${NUM_WORDS[g.n]} friends!`; say(g, g.say, true);
        }
      } else if (g.st === 'ask') {
        const i = id?.startsWith('ans') ? +id.slice(3) : -1;
        if (i >= 0) this.answer(g, g.choices[i]);
      } else {
        // dealing round-robin: one for you, one for you...
        if (g.deal.length) {
          if ((g.dealT -= dt) <= 0) { const i = g.deal.shift(); if (g.bowl > 0) { this.give(g, i); tone(520 + i * 120, 0.1, 'triangle', 0.06); } g.dealT = 0.22; }
        } else if (id === 'deal') {
          if (g.bowl >= g.n) { g.deal = [...Array(g.n).keys()]; g.dealT = 0; say(g, 'One for you, one for you...'); }
          else say(g, g.hasBird ? 'Not enough for everybody! Give the leftovers to the bird.' : 'Not enough for everybody to get one more!', true);
        } else if (id?.startsWith('back')) this.takeBack(g, id === 'backbird' ? 'bird' : +id.slice(4));
        else {
          let dest = null;
          for (let i = 0; i < g.n; i++) if (pressed[String(i + 1)]) dest = i;
          if (g.hasBird && (pressed.b || pressed['0'])) dest = 'bird';
          const friendAt = (x, y) => { for (let i = 0; i < g.n; i++) if (Math.abs(x - g.px[i]) < 320 / g.n && y > 150 && y < PLATE + 46) return i; return g.hasBird && Math.hypot(x - BIRD.x, y - BIRD.y - 20) < 70 ? 'bird' : null; };
          if (pointer.clicked && !id) {
            if (Math.hypot(pointer.x - BOWL.x, pointer.y - BOWL.y) < 110 && g.bowl > 0) g.drag = { x: pointer.x, y: pointer.y, sx: pointer.x, sy: pointer.y };
            else dest = friendAt(pointer.x, pointer.y);
          }
          if (g.drag) {
            g.drag.x = pointer.x; g.drag.y = pointer.y;
            if (!pointer.down) {
              const f = friendAt(pointer.x, pointer.y);
              if (f !== null) this.give(g, f, [pointer.x, pointer.y]);
              else if (Math.hypot(pointer.x - g.drag.sx, pointer.y - g.drag.sy) < 12) say(g, 'Drag a treat to a friend, or tap a friend!');
              g.drag = null;
            }
          }
          if (dest !== null) this.give(g, dest);
        }
        if (g.bowl === 0 && !g.fx.length && !g.deal.length && !g.checked) this.check(g);
      }
      g.progress = `Picnic ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.credit / g.rounds;
    },
    draw(g) {
      drawPicnic(g);
      const pl = g.plates, flying = d => g.fx.filter(f => f.dest === d).length;
      // the friends, each with a plate and a pile in front of them
      const feast = g.st === 'feast' ? clamp(1 - (g.wait - 0.4) / 2, 0, 1) : 0;
      for (let i = 0; i < g.n; i++) {
        const [name, short, s] = PALS[i], x = g.px[i];
        const pout = g.warn > 0 && g.low.includes(i), happy = g.st === 'ask' || g.st === 'feast';
        const hop = happy ? Math.abs(Math.sin(S.t * 7 + i)) * 12 : Math.abs(Math.sin(g.hop[i] * 12)) * g.hop[i] * 22;
        const lean = happy ? Math.sin(S.t * 7 + i) * 0.1 : pout ? Math.sin(S.t * 30) * 0.04 : Math.sin(S.t * 2 + i) * 0.04;
        ctx.save(); ctx.translate(x, FEET - hop); ctx.rotate(lean); ctx.translate(-x, -FEET);
        drawCritter(name, x, FEET, s, x < W / 2 ? 1 : -1);
        ctx.restore();
        inkEllipse(x, PLATE + 6, 56, 18, 0, '#ffffff', 1.8);
        ctx.strokeStyle = '#8ad0f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, PLATE + 6, 42, 12, 0, 0, TAU); ctx.stroke();
        const shown = Math.round((pl[i] - flying(i)) * (1 - feast));
        for (let j = 0; j < shown; j++) { const [dx, dy] = pileSpot(j); drawTreat(g.treat, x + dx, PLATE - 4 + dy, 13, j, (j % 3 - 1) * 0.3); }
        if (pout) { ctx.strokeStyle = `rgba(255,50,80,${0.6 + 0.4 * Math.sin(S.t * 10)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, PLATE + 6, 60, 24, 0, 0, TAU); ctx.stroke(); bubble(x, 140, pick2(i, ['Hey!', 'No fair!', 'Me too!'])); }
        else if (g.st === 'guest' && g.guestIn && i === g.n - 1) bubble(x, 140, 'Can I join?', '#c0306a');
        else if (happy) bubble(x, 140, g.st === 'feast' ? 'Yum!' : 'Fair!', '#3a9a4a');
        else if (g.st === 'share' && pl[i] === 0 && g.bowl > 0 && Math.sin(S.t * 1.5 + i * 2) > 0.7) bubble(x, 150, 'Me?', '#7a4a90');
        rrect(x - 50, PLATE + 30, 100, 26, 13, 'rgba(48,24,72,.78)');
        text(`${short}: ${pl[i] - flying(i)}`, x, PLATE + 43, 15, '#fff', 'center', 700);
        if (g.st === 'share' && pl[i] > 0 && !g.deal.length) button(`back${i}`, x + 40, PLATE - 24, 40, 36, '↩', { color: '#9a6ae0', size: 18 });
      }
      // the little bird takes leftovers (tier 3)
      if (g.hasBird) {
        drawBird(BIRD.x, BIRD.y, S.t, g.fed);
        for (let j = 0; j < g.bird - flying('bird'); j++) drawTreat(g.treat, BIRD.x - 30 + j * 20, BIRD.y + 46, 10, j);
        if (g.st === 'share') { rrect(BIRD.x - 50, BIRD.y - 64, 100, 24, 12, 'rgba(48,24,72,.78)'); text(`Leftovers: ${g.bird}`, BIRD.x, BIRD.y - 52, 13, '#fff', 'center', 700); }
        if (g.st === 'share' && g.bird > 0) button('backbird', BIRD.x + 36, BIRD.y - 30, 40, 36, '↩', { color: '#9a6ae0', size: 18 });
      }
      // the bowl (or pie dish) of treats still to share
      if (g.st !== 'ask' && g.st !== 'feast') {
        const bx = BOWL.x, by = BOWL.y, left = g.bowl - (g.drag ? 1 : 0);
        if (g.treat === 'pie') {
          inkEllipse(bx, by - 4, 92, 34, 0, '#e8e0f8', 2); ctx.fillStyle = '#d8cce8'; ellipse(bx, by - 8, 78, 26);
          for (let j = 0; j < left; j++) { const a = (j / g.total) * TAU - PI / 2 + PI / g.total; drawTreat('pie', bx + Math.cos(a) * 44, by - 8 + Math.sin(a) * 15, 17, j, a + PI / 2); }
        } else {
          ctx.fillStyle = '#9a5a2e'; ellipse(bx, by - 30, 98, 14);
          for (let j = 0; j < left; j++) { const row = Math.floor(j / 6), c = j % 6, inRow = Math.min(6, left - row * 6); drawTreat(g.treat, bx + (c - (inRow - 1) / 2) * 28, by - 30 - row * 18, 14, j); }
          const bowl = P2(`M${bx - 104},${by - 30} L${bx + 104},${by - 30} Q${bx + 96},${by + 40} ${bx},${by + 42} Q${bx - 96},${by + 40} ${bx - 104},${by - 30} Z`);
          ink(bowl, '#c8844a', 2.2);
          ctx.strokeStyle = 'rgba(255,230,190,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx - 84, by - 14); ctx.quadraticCurveTo(bx, by - 2, bx + 84, by - 14); ctx.stroke();
        }
        rrect(bx - 64, by + 12, 128, 28, 14, 'rgba(48,24,72,.78)');
        text(g.bowl ? `${g.bowl} to share` : 'All shared!', bx, by + 26, 17, '#fff', 'center', 800);
        if (g.canDeal && g.st === 'share') button('deal', 650, 452, 150, 60, 'Deal!', { icon: '🤲', color: '#ff9a3a', size: 22, sub: 'one each' });
      }
      // flying treats arc through the air
      for (const f of g.fx) {
        const k = easeOut(clamp(f.t / f.dur, 0, 1));
        const j = f.dest === 'bowl' || f.dest === 'bird' ? 0 : pl[f.dest] - 1;
        const [x1, y1] = this.destXY(g, f.dest, j);
        drawTreat(g.treat, lerp(f.x0, x1, k), lerp(f.y0, y1, k) - Math.sin(k * PI) * 90, 14 * (1 + Math.sin(k * PI) * 0.3), f.i);
      }
      if (g.drag) drawTreat(g.treat, g.drag.x, g.drag.y, 17, g.total - g.bowl);
      // the prompt
      const prompt = g.st === 'ask' ? `How many ${TREATS[g.treat].many} does EACH friend get?`
        : g.st === 'feast' ? `${g.k} each. Fair and square!`
          : g.st === 'guest' ? 'Surprise! A new friend is here!' : `Share ${g.total} ${TREATS[g.treat].many}. Everyone gets the SAME!`;
      panel(W / 2 - 300, 62, 600, 46, 20); text(prompt, W / 2, 85, 21, '#5a2a6e', 'center', 700);
      if (g.st === 'ask') {
        panel(W / 2 - 250, 410, 500, 116, 24);
        g.choices.forEach((v, i) => {
          const b = button(`ans${i}`, W / 2 - 226 + i * 156, 422, 140, 92, '', { color: ['#5fb87a', '#4fa8e0', '#ff9a3a'][i], key: String(i + 1) });
          outlined(String(v), b.x + 46, b.y + 46, 46, '#fff');
          drawTreat(g.treat, b.x + 100, b.y + 46, 16, 0);
        });
      }
      if (g.tier === 1 && g.round === 0 && g.st === 'share' && g.bowl === g.total && !g.fx.length) { rrect(W / 2 - 230, 116, 460, 32, 16, 'rgba(48,24,72,.78)'); text('Tap a friend to give them one, or press Deal!', W / 2, 132, 16, '#fff6a8', 'center', 700); }
    },
  };
  const pick2 = (i, arr) => arr[i % arr.length];

  restage('berrypatch', {
    games: [['berrycartdash', 'berry', {}], ['berryfairshare', 'berry', {}]],
    intro: ['*:A big, fluffy bear is sitting in the berry patch, holding a recipe card.', "N:I want to bake my famous berry pie! But the berries grow all along the bramble path, and the thorns are SO prickly.", 'N:Hop in my berry cart and grab just the berries on my recipe. And watch out for that cheeky raccoon!', "A:excited:Berry cart, here I come!"],
    mid: ['N:Mmm, pie! My friends are coming to the picnic, and they are SO hungry.', 'N:Can you share the treats out so everybody gets the SAME? No grumpy tummies!', 'A:thinking:One for you, one for you... round and round!'],
    outro: ['N:Everybody got the same, so everybody is happy! Take some berries for your journey.', "A:laughing:Bears are SO much nicer than I thought!"],
  });
}
