'use strict';
// Buttercup Meadow, game 2: Pollen Pals. Fly Flutter from an open flower (pick up its pollen)
// to a closed bud of the SAME colour so it blooms. Dodge Spindle the dangling spider and ride out gusty winds.
{
  const PP_COLS = [
    { n: 'pink', c: '#ff7ab8' }, { n: 'yellow', c: '#ffd23a' }, { n: 'blue', c: '#5aaeff' },
    { n: 'purple', c: '#a978ff' },
  ];
  const PP_SLOTS = 13, PP_X0 = 78, PP_DX = (W - 2 * PP_X0) / (PP_SLOTS - 1);
  const PP_TOUCH = 54;            // how close Flutter has to get to a flower (big and forgiving)
  const PP_TOPY = 92, PP_BOTY = 446;
  const cap = s => s[0].toUpperCase() + s.slice(1);

  // Flutter, facing the viewer; flap 0..1 squeezes the wings; dust = carried pollen colour
  function ppButterfly(x, y, s, flap, dust, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const k = 0.25 + 0.75 * Math.abs(Math.cos(flap * Math.PI));
    const col = '#ff8fc8', spot = dust || '#ffd84a';
    const up = P2('M2,-4 C10,-34 44,-40 46,-16 C47,-2 26,4 2,2 Z'), lo = P2('M2,2 C22,4 36,14 30,30 C24,42 6,30 2,8 Z');
    // outline every wing first, then fill, so the four wings read as one shape
    for (const pass of [0, 1]) for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * k, 1);
      if (pass === 0) { ctx.strokeStyle = OL; ctx.lineWidth = 4.4; ctx.stroke(up); ctx.stroke(lo); }
      else {
        ctx.fillStyle = col; ctx.fill(up); ctx.fillStyle = mix(col, '#ffffff', 0.25); ctx.fill(lo);
        ctx.fillStyle = spot; circle(28, -16, dust ? 9 : 7); circle(18, 18, dust ? 6.5 : 5);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(36, -24, 3);
      }
      ctx.restore();
    }
    inkEllipse(0, 2, 4.5, 17, 0, '#4a2a6a', 1.5);
    ctx.strokeStyle = '#4a2a6a'; ctx.lineWidth = 2;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(d * 6, -26, d * 11, -30); ctx.stroke(); ctx.fillStyle = '#4a2a6a'; circle(d * 11, -30, 2.6); }
    // a little face so she reads as Flutter
    ctx.fillStyle = '#fff'; circle(-2, -9, 1.4); circle(2, -9, 1.4);
    if (dust) { // a fuzzy ball of pollen held under her tummy
      inkCircle(0, 24, 8, dust, 1.4);
      ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(-2.5, 21.5, 2.2); circle(3, 26, 1.4);
    }
    ctx.restore();
  }

  function ppStem(x, hx, hy, leafSide, grow = 1) {
    const gy = GY + 6, ty = gy + (hy - gy) * grow, tx = x + (hx - x) * grow;
    ctx.lineCap = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x + leafSide * 10, (gy + ty) / 2, tx, ty); };
    path(); ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.stroke();
    path(); ctx.strokeStyle = '#5cc04a'; ctx.lineWidth = 4.5; ctx.stroke();
    if (grow > 0.35) {
      const ly = gy + (ty - gy) * 0.35, lk = Math.min(1, (grow - 0.35) * 2);
      inkAt(x + leafSide * 2, ly, leafSide * -0.6, P2(`M0,0 C${leafSide * 10},${-14 * lk} ${leafSide * 30 * lk},${-12 * lk} ${leafSide * 36 * lk},0 C${leafSide * 24 * lk},${8 * lk} ${leafSide * 8},${6 * lk} 0,0 Z`), '#7ad65a', 1.6);
    }
  }
  // an open flower: petals outlined first then filled, golden middle with sparkly pollen grains
  function ppFlower(x, y, r, c, open = 1, glow = 0) {
    if (glow > 0) {
      const gr = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 1.9);
      gr.addColorStop(0, `rgba(255,255,220,${0.55 * glow})`); gr.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
    }
    const p = new Path2D(), n = 6, pr = r * (0.35 + 0.65 * open);
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n + S.t * 0.15;
      const px = x + Math.cos(a) * pr * 0.58, py = y + Math.sin(a) * pr * 0.58;
      p.moveTo(px + Math.cos(a) * pr * 0.48, py + Math.sin(a) * pr * 0.48);
      p.ellipse(px, py, pr * 0.48, pr * 0.34, a, 0, TAU);
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(p);
    ctx.fillStyle = c; ctx.fill(p);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < n; i++) { const a = i * TAU / n + S.t * 0.15; ellipse(x + Math.cos(a) * pr * 0.62, y + Math.sin(a) * pr * 0.62, pr * 0.2, pr * 0.1, a); }
    inkCircle(x, y, r * 0.36, '#ffb320', 1.6);
    ctx.fillStyle = mix(c, '#ffffff', 0.2);
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + S.t * 2; circle(x + Math.cos(a) * r * 0.18, y + Math.sin(a) * r * 0.18 - Math.abs(Math.sin(S.t * 4 + i)) * 2, 2.6); }
  }
  // a closed bud of colour c; want 0..1 = Flutter carries this colour (it bobs and glows)
  function ppBud(x, y, r, c, want, shake) {
    const bob = want ? Math.sin(S.t * 7) * 3 : 0, sx = shake > 0 ? Math.sin(shake * 60) * 5 * shake : 0;
    ctx.save(); ctx.translate(x + sx, y + bob);
    if (want) {
      ctx.setLineDash([7, 6]); ctx.lineDashOffset = -S.t * 30;
      ctx.beginPath(); ctx.arc(0, 0, r * 1.45 + Math.sin(S.t * 6) * 3, 0, TAU);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]);
    }
    const s = r / 30;
    ctx.scale(s, s);
    const bud = P2('M0,-34 C20,-22 24,4 0,18 C-24,4 -20,-22 0,-34 Z');
    const sep = P2('M-20,6 C-14,22 14,22 20,6 C12,12 4,10 0,18 C-4,10 -12,12 -20,6 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 4.4; ctx.stroke(bud); ctx.stroke(sep);
    ctx.fillStyle = c; ctx.fill(bud);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-7, -12, 4, 11, 0.3);
    ctx.strokeStyle = mix(c, OL, 0.45); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(5, -8, 0, 14); ctx.stroke();
    ctx.fillStyle = '#5cc04a'; ctx.fill(sep);
    ctx.restore();
  }
  function ppSpider(x, y, wig) {
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 58); ctx.lineTo(x, y - 14); ctx.stroke();
    ctx.lineCap = 'round';
    for (const pass of [0, 1]) for (const d of [-1, 1]) for (let i = 0; i < 4; i++) {
      const a = -0.7 + i * 0.45, w = Math.sin(wig * 8 + i) * 3;
      ctx.beginPath(); ctx.moveTo(x + d * 8, y + 2);
      ctx.quadraticCurveTo(x + d * 24, y - 14 + i * 8 + w, x + d * (30 + Math.cos(a) * 4), y + 4 + i * 7 - w);
      ctx.strokeStyle = pass ? '#6a4a8a' : OL; ctx.lineWidth = pass ? 3 : 6.5; ctx.stroke();
    }
    inkEllipse(x, y + 2, 18, 16, 0, '#6a4a8a', 1.8);
    inkCircle(x, y - 12, 11, '#7d5aa0', 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(x - 6, y - 4, 6, 4, -0.5);
    for (const d of [-1, 1]) { ctx.fillStyle = '#fff'; circle(x + d * 4.5, y - 13, 4.2); ctx.fillStyle = '#2a1a3a'; circle(x + d * 4.5, y - 12, 2.2); }
    ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y - 8, 3.5, 0.3, Math.PI - 0.3); ctx.stroke();
  }
  function ppWeb(x, y, r) {
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
    for (const k of [0.35, 0.65, 0.95]) {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) { const a = i * TAU / 8; ctx.lineTo(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k); }
      ctx.stroke();
    }
  }

  const ppHead = (g, s) => [s.x + Math.sin(S.t * 1.4 + s.i) * 4 + g.wind * 0.13, s.hy + Math.sin(S.t * 1.1 + s.i * 2) * 3];
  const ppActive = g => g.slots.filter(s => s.st === 'bud' || s.st === 'sprout');

  function ppSpawnBud(g, asBud) {
    const empty = g.slots.filter(s => s.st === 'empty');
    if (!empty.length || g.created >= g.target) return;
    // don't sprout right under Flutter; keep the bud colours varied
    const far = empty.filter(s => Math.abs(s.x - g.bx) > 120);
    const s = pick(far.length ? far : empty);
    const used = ppActive(g).map(b => b.c);
    const fresh = g.cols.filter(c => !used.includes(c));
    s.c = pick(fresh.length ? fresh : g.cols);
    s.st = asBud ? 'bud' : 'sprout'; s.grow = asBud ? 1 : 0; s.shake = 0;
    g.created++;
  }
  function ppSetSay(g) {
    if (g.carry == null) {
      const want = [...new Set(ppActive(g).map(s => s.c))];
      g.say = want.length ? `Get some ${PP_COLS[want[0]].n} pollen from a ${PP_COLS[want[0]].n} flower.` : 'Wait for a new bud to grow!';
    } else g.say = `${cap(PP_COLS[g.carry].n)} pollen! Take it to a ${PP_COLS[g.carry].n} bud.`;
  }

  MG.flutterpollen = {
    kind: 'action', title: () => 'Pollen Pals', icon: () => '🦋',
    how: () => 'Steer Flutter with the mouse or the arrow keys. Touch a flower to get its pollen, then fly to a bud of the SAME colour to make it bloom! Dodge the spider.',
    init(g) {
      const t = g.tier - 1;
      const nc = [3, 4, 4][t];
      Object.assign(g, {
        cols: shuffle([...Array(nc).keys()]), target: [6, 8, 9][t], activeN: [2, 3, 3][t], timeLeft: [70, 62, 56][t],
        bx: W / 2, by: 200, vx: 0, vy: 0, carry: null, bloomed: 0, created: 0, stuck: 0, safe: 0, hits: 0, wrong: 0,
        wind: 0, windDir: 1, windT: [9, 7, 5.5][t], windWarn: 0, windLeft: 0, windPow: [70, 120, 165][t],
        leaves: [], trail: [], spawnT: 0, endT: 0, touching: null, flap: 0, tilt: 0,
      });
      g.slots = Array.from({ length: PP_SLOTS }, (_, i) => ({
        i, x: PP_X0 + i * PP_DX, hy: i % 2 ? 236 + (i * 37 % 3) * 14 : 352 - (i * 53 % 3) * 12,
        st: 'empty', c: 0, grow: 0, open: 0, shake: 0, side: i % 3 === 1 ? -1 : 1,
      }));
      // one open flower of each colour, spread out across the meadow
      const srcIdx = nc === 3 ? [1, 6, 11] : [0, 4, 8, 12];
      srcIdx.forEach((si, k) => Object.assign(g.slots[si], { st: 'open', c: g.cols[k], open: 1, grow: 1 }));
      for (let k = 0; k < g.activeN; k++) ppSpawnBud(g, true);
      // spiders: Spindle drops down on her thread and climbs back up
      const sp = [[0.8], [1.05], [1.0, 1.3]][t];
      g.spiders = sp.map((spd, k) => ({ x: k ? 720 : 300, depth: [240, 290, 320][t] - k * 30, spd, ph: k * 2.2, rest: 0, tx: k ? 720 : 300 }));
      ppSetSay(g);
    },
    start(g) { speak('Touch a flower to get pollen, then find a bud of the same colour!'); },
    update(g, dt) {
      g.timeLeft -= dt; g.safe = Math.max(0, g.safe - dt); g.flap += dt * (g.stuck > 0 ? 6 : 3.2);
      if (g.endT > 0) { g.endT -= dt; if (g.endT <= 0) g.done = true; }
      else if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }

      // gusty wind: a warning first, then a push to one side
      if (g.windLeft > 0) { g.windLeft -= dt; g.wind = lerp(g.wind, g.windDir * g.windPow, Math.min(1, dt * 3)); }
      else {
        g.wind = lerp(g.wind, 0, Math.min(1, dt * 2.5));
        if (g.windWarn > 0) { g.windWarn -= dt; if (g.windWarn <= 0) g.windLeft = 2.4; }
        else if ((g.windT -= dt) <= 0) { g.windT = [9, 7, 5.5][g.tier - 1] + rand(0, 2); g.windDir = pick([-1, 1]); g.windWarn = 1.4; tone(300, 0.8, 'sine', 0.05, 0, 520); }
      }
      if (Math.abs(g.wind) > 30 && Math.random() < dt * 14) g.leaves.push({ x: g.wind > 0 ? -20 : W + 20, y: rand(90, 440), ph: rand(0, 6), kind: pick(['leaf', 'seed', 'petal']) });
      for (const l of g.leaves) { l.x += (g.wind * 2.6 + Math.sign(g.wind || 1) * 40) * dt; l.y += Math.sin(S.t * 3 + l.ph) * 40 * dt; l.ph += dt; }
      g.leaves = g.leaves.filter(l => l.x > -40 && l.x < W + 40 && l.ph < 12);

      // steering: mouse (Flutter flies toward the pointer) or arrows
      const up = keys.arrowup || keys.w, dn = goDown(), lf = goLeft(), rt = goRight();
      let dx = 0, dy = 0;
      if (lf || rt || up || dn) { dx = (rt ? 1 : 0) - (lf ? 1 : 0); dy = (dn ? 1 : 0) - (up ? 1 : 0); const m = Math.hypot(dx, dy) || 1; dx = dx / m * 330; dy = dy / m * 330; g.usePointer = false; g.lpx = pointer.x; g.lpy = pointer.y; }
      else if (pointerMoved(g)) {
        const tx = clamp(pointer.x, 40, W - 40), ty = clamp(pointer.y, PP_TOPY, PP_BOTY);
        dx = (tx - g.bx) * 5; dy = (ty - g.by) * 5; const m = Math.hypot(dx, dy);
        if (m > 360) { dx *= 360 / m; dy *= 360 / m; }
      }
      const gain = g.stuck > 0 ? 0 : Math.abs(g.wind) > 30 ? 2.2 : 6;
      g.vx += (dx - g.vx) * Math.min(1, dt * gain); g.vy += (dy - g.vy) * Math.min(1, dt * gain);
      if (g.stuck > 0) { g.stuck -= dt; g.vx *= 0.8; g.vy *= 0.8; }
      g.bx = clamp(g.bx + (g.vx + (g.stuck > 0 ? 0 : g.wind)) * dt, 40, W - 40);
      g.by = clamp(g.by + g.vy * dt + Math.sin(S.t * 5) * 8 * dt, PP_TOPY, PP_BOTY);
      g.tilt = lerp(g.tilt, clamp((g.vx + g.wind) / 900, -0.35, 0.35), Math.min(1, dt * 6));
      if (g.carry != null && Math.random() < dt * 20) g.trail.push({ x: g.bx + rand(-6, 6), y: g.by + 24, life: 0.8 });
      for (const p of g.trail) { p.life -= dt; p.y += 18 * dt; }
      g.trail = g.trail.filter(p => p.life > 0);

      // spiders
      for (const sp of g.spiders) {
        if (sp.rest > 0) { sp.rest -= dt; sp.x = lerp(sp.x, sp.tx, Math.min(1, dt * 3)); continue; }
        const before = sp.ph % TAU; sp.ph += dt * sp.spd;
        if (sp.ph % TAU < before) { sp.rest = rand(0.8, 1.8); sp.ph = Math.ceil(sp.ph / TAU) * TAU; sp.tx = clamp(lerp(g.bx, rand(80, W - 80), 0.5), 80, W - 80); }
        sp.y = 74 + sp.depth * (0.5 - 0.5 * Math.cos(sp.ph));
        if (g.stuck <= 0 && g.safe <= 0 && g.endT <= 0 && Math.hypot(g.bx - sp.x, g.by - sp.y) < 40) {
          g.stuck = 1.1; g.safe = 2.4; g.hits++; g.vy = 0; g.vx = 0;
          if (g.carry != null) { burst(g.bx, g.by + 20, 10, { colors: [PP_COLS[g.carry].c] }); g.carry = null; ppSetSay(g); }
          SFX.miss(); floatText(g.bx, g.by - 50, 'Sticky web!', '#fff', false, 22);
          speak('Oops! A sticky web. Wiggle free!');
        }
      }
      for (const sp of g.spiders) if (sp.rest > 0) sp.y = 74;

      // flowers, buds and sprouts
      let touching = null;
      for (const s of g.slots) {
        s.shake = Math.max(0, s.shake - dt * 1.5);
        if (s.st === 'sprout') { s.grow += dt / 1.3; if (s.grow >= 1) { s.grow = 1; s.st = 'bud'; SFX.blip(); ppSetSay(g); } }
        if (s.st === 'bloom') { s.open += dt / 0.55; if (s.open >= 1) { s.open = 1; s.st = 'open'; } }
        if (s.st === 'empty' || s.st === 'sprout') continue;
        const [hx, hy] = ppHead(g, s);
        if (Math.hypot(g.bx - hx, g.by - hy) < PP_TOUCH) touching = s;
      }
      if (touching && g.stuck <= 0 && g.endT <= 0) {
        const s = touching, first = g.touching !== s;
        if ((s.st === 'open' || s.st === 'bloom') && g.carry == null && ppActive(g).some(b => b.c === s.c)) {
          g.carry = s.c; SFX.pick(); ppSetSay(g); speak(g.say);
          burst(...ppHead(g, s), 8, { colors: [PP_COLS[s.c].c, '#fff6a8'] });
        } else if (s.st === 'bud' && g.carry === s.c) {
          s.st = 'bloom'; s.open = 0; g.carry = null; g.bloomed++;
          const [hx, hy] = ppHead(g, s);
          SFX.sparkle(); burst(hx, hy, 22, { colors: [PP_COLS[s.c].c, '#fff6a8', '#ffffff'] });
          floatText(hx, hy - 50, pick(['It bloomed!', 'Hooray!', 'Beautiful!', 'Pretty!']), '#fff', false, 24);
          if (g.bloomed >= g.target) { g.endT = 1.1; speak('You did it! The whole meadow is blooming!'); }
          else { g.spawnT = 0.7; ppSetSay(g); speak(pick(['It bloomed!', 'Hooray!', 'Beautiful!']) + ' ' + g.say); }
        } else if (s.st === 'bud' && first) {
          s.shake = 1; SFX.blip();
          if (g.carry != null) { g.wrong++; speak(`This bud wants ${PP_COLS[s.c].n} pollen.`); }
          else speak(`Get ${PP_COLS[s.c].n} pollen first!`);
        }
      }
      g.touching = touching;
      if (g.spawnT > 0 && (g.spawnT -= dt) <= 0) while (ppActive(g).length < g.activeN && g.created < g.target) ppSpawnBud(g, false);
      g.score = g.bloomed / g.target;
      g.progress = `🌸 ${g.bloomed} / ${g.target} blooms`;
    },
    draw(g) {
      // a soft grassy strip so the stems have somewhere to stand
      ctx.fillStyle = 'rgba(90,180,70,.35)'; ctx.fillRect(0, GY - 4, W, H - GY + 4);
      for (const s of g.slots) {
        if (s.st === 'empty') {
          ctx.fillStyle = 'rgba(122,80,52,.45)'; ellipse(s.x, GY + 8, 16, 5);
          continue;
        }
        const [hx, hy] = ppHead(g, s), c = PP_COLS[s.c].c;
        if (s.st === 'sprout') {
          ctx.fillStyle = 'rgba(122,80,52,.55)'; ellipse(s.x, GY + 8, 18, 6);
          ppStem(s.x, hx, hy, s.side, s.grow * 0.85);
          const ty = GY + 6 + (hy - GY - 6) * s.grow * 0.85, tx = s.x + (hx - s.x) * s.grow * 0.85;
          inkCircle(tx, ty, 5 + 6 * s.grow, mix('#7ad65a', c, s.grow * 0.6), 1.4);
          continue;
        }
        ppStem(s.x, hx, hy, s.side);
        if (s.st === 'bud') ppBud(hx, hy, 30, c, g.carry === s.c, s.shake);
        else {
          if (s.st === 'bloom') ppBud(hx, hy + s.open * 6, 30 * (1 - s.open * 0.6), c, false, 0);
          ppFlower(hx, hy, 32, c, s.st === 'bloom' ? s.open : 1, g.carry == null && ppActive(g).some(b => b.c === s.c) ? 0.6 + Math.sin(S.t * 4 + s.i) * 0.3 : 0);
        }
      }
      // wind leaves and seeds
      for (const l of g.leaves) {
        ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.ph * 3);
        if (l.kind === 'leaf') ink(P2('M-9,0 C-4,-6 4,-6 9,0 C4,6 -4,6 -9,0 Z'), '#8ad65a', 1);
        else if (l.kind === 'petal') ink(P2('M-6,0 C-3,-5 3,-5 6,0 C3,5 -3,5 -6,0 Z'), '#ffd0e4', 1);
        else { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.stroke(); } }
        ctx.restore();
      }
      if (Math.abs(g.wind) > 30) {
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = 0; i < 7; i++) {
          const y = 110 + i * 50, x = ((S.t * g.wind * 3 + i * 173) % (W + 200) + W + 200) % (W + 200) - 100;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 40 * Math.sign(g.wind), y - 8, x + 80 * Math.sign(g.wind), y); ctx.stroke();
        }
      }
      // spiders
      for (const sp of g.spiders) ppSpider(sp.x, sp.y ?? 74, S.t + sp.ph);
      // pollen trail and Flutter
      for (const p of g.trail) { ctx.globalAlpha = p.life; ctx.fillStyle = PP_COLS[g.carry ?? 0].c; circle(p.x, p.y, 3); }
      ctx.globalAlpha = 1;
      const blink = g.safe > 0 && g.stuck <= 0 && Math.sin(S.t * 30) > 0.3;
      if (!blink) ppButterfly(g.bx + (g.stuck > 0 ? Math.sin(S.t * 40) * 3 : 0), g.by, 0.95, g.flap, g.carry != null ? PP_COLS[g.carry].c : null, g.tilt);
      if (g.stuck > 0) ppWeb(g.bx, g.by, 48);
      // what to do next, in a pill under the header
      if (g.windWarn > 0) {
        outlined(g.windDir > 0 ? 'Whoosh! Wind coming  ➡️' : '⬅️  Whoosh! Wind coming', W / 2, 88, 26, '#bfe8ff');
      } else if (g.phase === 'play') {
        const msg = g.carry != null ? `Take ${PP_COLS[g.carry].n} pollen to a ${PP_COLS[g.carry].n} bud!` : 'Touch a flower to get pollen!';
        ctx.font = `700 18px ${FONT}`; const w = Math.min(600, ctx.measureText(msg).width + 80);
        darkPanel(W / 2 - w / 2, 66, w, 38, 19);
        if (g.carry != null) inkCircle(W / 2 - w / 2 + 22, 85, 9, PP_COLS[g.carry].c, 1.2);
        else emoji('🌼', W / 2 - w / 2 + 22, 85, 18);
        text(msg, W / 2 + 12, 85, 18, '#fff', 'center', 700);
      }
    },
  };

  restage('meadow', {
    games: [['butterflycycle', 'petal', {}], ['flutterpollen', 'petal', {}]],
    mid: [
      'N:You know all my secrets now! Now I need a helper for my most important job.',
      'N:I carry pollen from flower to flower. That makes brand new flowers bloom!',
      'N:Pink pollen goes to a pink bud, blue goes to blue. And watch out for Spindle the spider!',
      'A:determined:Match the colours and dodge the spider. Let\'s fly, Flutter!',
    ],
  });
}
