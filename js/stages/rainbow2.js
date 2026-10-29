'use strict';
{
  // ===========================================================================
  // Rainbow's End, game 2 (learn) RAINBOW PAINTER: Seamus's rainbow has been washed white.
  // A rain cloud drifts along the top, dropping big drops of paint in every colour. Aubrey runs
  // left and right with her bucket and must catch the NEXT colour in rainbow order (red first,
  // red is the outside band). A wrong colour goes "splat!" (a short wobble and a small penalty).
  // With the right paint she runs to the foot of that band, which glows, and steps onto the
  // arch: Left/Right carries her up and over the curved band, and the band fills in behind her
  // with a wet paint trail and sparkles. At the far foot she hops off and catches the next colour.
  // After all seven, a grey storm cloud washes one band out: which colour is missing? Catch it
  // and paint it back. Then the finished rainbow glows and Seamus cheers.
  // Tier 1: slow drops, few decoys, "next colour" helper card always shown.
  // Tier 2: faster, card shown except in the missing-colour round. Tier 3: fastest, no card.
  // Controls: Left/Right or A/D (or hold the pointer to one side of Aubrey).
  // Score: 1, minus a little per wrong catch, minus a little for dawdling past a generous par.
  // ===========================================================================
  const ROY = [['red', '#ff4a4a'], ['orange', '#ff9a2a'], ['yellow', '#ffdf2a'], ['green', '#3fcf5a'], ['blue', '#3a9cff'], ['indigo', '#5a4ad0'], ['violet', '#b45ae6']];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const GROUND = 474;                 // Aubrey's feet on the meadow
  const CX = 470, CY = 610;           // the rainbow's centre (below the ground, so the feet slope)
  const R0 = 410, BW = 24;            // red band's middle radius, and each band's width
  const SC = 0.4;                     // Aubrey's sprite scale (about 90 px tall)
  const SPEED = 300;                  // run speed, on the meadow and along the arch
  const BINS = 40;                    // paint cells along each band
  const CATCH_Y = GROUND - 66;        // the bucket's mouth (held out beside her, so her face shows)
  const bucketX = g => g.x + g.bo;
  const XMIN = 30, XMAX = 860;
  const RUN = ['run1', 'run2', 'run3', 'run4', 'run5'];
  const TIERS = {
    1: { every: 1.15, fall: 140, need: 0.38, card: 'always', par: 95 },
    2: { every: 0.95, fall: 180, need: 0.32, card: 'notMissing', par: 90 },
    3: { every: 0.8, fall: 225, need: 0.27, card: 'never', par: 85 },
  };
  // a short fact after each band is painted
  const FACTS = [
    'Red is always on the outside of a rainbow!',
    'Orange comes after red.',
    'A rainbow comes when sunshine shines through raindrops!',
    'Green is in the middle of the rainbow.',
    'Roy G Biv helps you remember: red, orange, yellow, green, blue, indigo, violet!',
    'Indigo is a deep, dark blue.',
    'Violet is always on the inside!',
  ];

  const rOf = c => R0 - c * BW;
  const footA = c => Math.asin((CY - GROUND) / rOf(c));         // angle above the horizontal at the feet
  const aL = c => Math.PI + footA(c), aR = c => TAU - footA(c);  // left foot .. right foot
  const footX = (c, side) => CX + (side < 0 ? -1 : 1) * Math.sqrt(rOf(c) ** 2 - (CY - GROUND) ** 2);
  const glow = (x, y, r, rgb, a) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const vgrad = (y0, y1, stops) => { const gr = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };
  const puff = (x, y, s, fill, line) => {
    const puffs = [[-44, 6, 22], [-20, -12, 30], [12, -18, 30], [42, -2, 24], [0, 10, 26], [-56, 14, 14], [60, 12, 14]];
    ctx.strokeStyle = line; ctx.lineWidth = 4;
    for (const [dx, dy, r] of puffs) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = fill; for (const [dx, dy, r] of puffs) circle(x + dx * s, y + dy * s, r * s);
  };
  const clover = (x, y, r, col) => {
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; inkCircle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.52, col, 0.8, '#2a7a3a'); }
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; ctx.fillStyle = col; circle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.52); }
  };
  // a fat paint drop, point up
  const paintDrop = (x, y, s, col, alpha = 1) => {
    ctx.globalAlpha = alpha; INK = OL;
    ink(P2(`M${x},${y - 30 * s} C${x + 8 * s},${y - 16 * s} ${x + 20 * s},${y - 4 * s} ${x + 20 * s},${y + 8 * s} C${x + 20 * s},${y + 20 * s} ${x + 11 * s},${y + 28 * s} ${x},${y + 28 * s} C${x - 11 * s},${y + 28 * s} ${x - 20 * s},${y + 20 * s} ${x - 20 * s},${y + 8 * s} C${x - 20 * s},${y - 4 * s} ${x - 8 * s},${y - 16 * s} ${x},${y - 30 * s} Z`), col, 2.5);
    ctx.fillStyle = 'rgba(255,255,255,.65)'; ellipse(x - 8 * s, y + 6 * s, 4 * s, 8 * s, 0.3); circle(x - 6 * s, y - 6 * s, 2.5 * s);
    ctx.globalAlpha = 1;
  };
  const bucket = (x, y, col, tilt = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    INK = OL;
    ctx.strokeStyle = '#6a6a88'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -4, 22, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ink(P2('M-26,-6 L-20,30 C-8,35 8,35 20,30 L26,-6 Z'), '#cfe0f2', 2.5);
    ctx.fillStyle = '#ffffff99'; ctx.fillRect(-18, 2, 5, 22);
    inkEllipse(0, -6, 26, 7, 0, col || '#e8eef8', 2.5);
    if (col) { ctx.fillStyle = col; ellipse(14, 4, 5, 9); circle(14, 13, 5); }
    ctx.restore();
  };

  MG.rainbowpainter = {
    kind: 'learn', title: () => 'Rainbow Painter', icon: () => '🖌️',
    how: () => "The rain washed Seamus's rainbow white! Catch paint drops in rainbow order, red first. Then run along the rainbow to paint it. Use the arrow keys or the mouse.",
    init(g) {
      const T = TIERS[g.tier];
      Object.assign(g, {
        T, x: 140, facing: 1, bo: 36, state: 'catch', need: 0, painted: ROY.map(() => new Array(BINS).fill(true).map(() => false)),
        full: ROY.map(() => false), drops: [], spawnT: 0.8, sinceNeed: 0, cloudX: 300, cloudV: 70,
        a: 0, dirOn: 1, wrongs: 0, stun: 0, hop: 0, holding: null, washed: false, washT: 0, missing: -1,
        endT: 0, hint: 0, wet: [], idle: 0, moving: false, sparkT: 0,
      });
      g.say = 'Catch the red paint! Red comes first.';
      g.progress = 'Colours: 0 / 7';
    },
    start(g) { speak(g.say); },
    // which way the player wants to go: -1, 0 or 1
    steer(g, px) {
      let d = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0);
      if (!d && pointer.down && pointer.y > 70 && Math.abs(pointer.x - px) > 14) d = Math.sign(pointer.x - px);
      return d;
    },
    sayNeed(g) {
      const c = g.need;
      g.say = g.missing >= 0 && g.washed && c === g.missing
        ? 'Which colour is missing? Look at the colours on each side of the gap, and catch it!'
        : c === 0 ? 'Catch the red paint! Red comes first.' : `What comes after ${ROY[c - 1][0]}? Catch the ${ROY[c][0]} paint!`;
    },
    spawn(g) {
      const T = g.T, n = g.need;
      let c;
      if (Math.random() < T.need || g.sinceNeed >= 3) c = n;
      else do c = randInt(0, 6); while (c === n);
      g.sinceNeed = c === n ? 0 : g.sinceNeed + 1;
      const x = clamp(g.cloudX + rand(-50, 50), 50, XMAX - 10);
      g.drops.push({ x, y: 130, c, vy: g.T.fall * rand(0.9, 1.1), wob: rand(0, 6) });
    },
    update(g, dt) {
      const T = g.T;
      g.stun = Math.max(0, g.stun - dt); g.hint += dt; g.sparkT -= dt;
      if (g.state === 'wash') g.cloudX = lerp(g.cloudX, CX, Math.min(1, dt * 3));
      else g.cloudX += g.cloudV * dt;
      if (g.cloudX > 780) g.cloudV = -Math.abs(g.cloudV); if (g.cloudX < 110) g.cloudV = Math.abs(g.cloudV);
      // dawdling is only counted while she's meant to be doing something
      if (g.state !== 'finale' && g.state !== 'wash' && g.state !== 'hop') g.idle += dt;
      for (const w of g.wet) w.t -= dt;
      g.wet = g.wet.filter(w => w.t > 0);

      if (g.state === 'catch' || g.state === 'carry') {
        const d = g.stun > 0 ? 0 : this.steer(g, g.x);
        g.moving = !!d; if (d) g.facing = d;
        g.x = clamp(g.x + d * SPEED * dt, XMIN, XMAX);
        g.bo += (g.facing * 36 - g.bo) * Math.min(1, dt * 9);
      }
      if (g.state === 'catch') {
        g.spawnT -= dt;
        if (g.spawnT <= 0) { g.spawnT = T.every * rand(0.85, 1.15); this.spawn(g); }
      }
      // falling drops
      for (const p of g.drops) {
        p.y += p.vy * dt; p.wob += dt * 6;
        if (g.state === 'catch' && !p.gone && p.y > CATCH_Y - 10 && p.y < CATCH_Y + 26 && Math.abs(p.x - bucketX(g)) < (p.c === g.need ? 40 : 28) && g.stun <= 0) {
          p.gone = true;
          if (p.c === g.need) this.caught(g, p);
          else this.splat(g, p);
        }
        if (!p.gone && p.y > GROUND - 6) {
          p.gone = true; burst(p.x, GROUND - 4, 6, { colors: [ROY[p.c][1], '#ffffff'], spread: 90, up: 40 });
          g.wet.push({ x: p.x, c: p.c, t: 1.4 });
        }
      }
      g.drops = g.drops.filter(p => !p.gone);

      if (g.state === 'carry') {
        // step onto the arch at either foot of the band
        for (const side of [-1, 1]) {
          const fx = footX(g.need, side);
          if (Math.abs(g.x - fx) < 16) {
            g.state = 'paint'; g.a = side < 0 ? aL(g.need) + 0.001 : aR(g.need) - 0.001; g.dirOn = -side;
            SFX.jump(); speak(side < 0 ? 'Up you go! Run right to paint!' : 'Up you go! Run left to paint!');
            break;
          }
        }
      } else if (g.state === 'paint') {
        const c = g.need, r = rOf(c) + BW * 0.3, lo = aL(c), hi = aR(c);
        const px = CX + Math.cos(g.a) * r;
        const d = this.steer(g, px);
        g.moving = !!d; if (d) g.facing = d;
        const a0 = g.a;
        g.a = clamp(g.a + d * SPEED / r * dt, lo, hi);
        // paint the cells she has passed over
        const i0 = Math.floor((Math.min(a0, g.a) - lo) / (hi - lo) * BINS), i1 = Math.floor((Math.max(a0, g.a) - lo) / (hi - lo) * BINS);
        for (let i = clamp(i0, 0, BINS - 1); i <= clamp(i1, 0, BINS - 1); i++) {
          if (!g.painted[c][i]) {
            g.painted[c][i] = true;
            if (i % 3 === 0) tone(380 + c * 60 + i * 6, 0.07, 'triangle', 0.04);
          }
        }
        if (d && g.sparkT <= 0) {
          g.sparkT = 0.09;
          burst(CX + Math.cos(g.a) * rOf(c), CY + Math.sin(g.a) * rOf(c), 2, { colors: [ROY[c][1], '#ffffff', '#fff6a8'], spread: 50, up: 30, size: [2, 5] });
        }
        if (g.painted[c].every(Boolean)) this.bandDone(g);
      } else if (g.state === 'hop') {
        g.hop += dt;
        g.x = lerp(g.hopX0, g.hopX1, Math.min(1, g.hop / 0.5));
        if (g.hop >= 0.5) {
          g.hop = 0;
          if (g.full.every(Boolean)) {
            if (!g.washed) this.startWash(g); else this.startFinale(g);
          } else { g.state = 'catch'; this.sayNeed(g); speak(g.say); }
        }
      } else if (g.state === 'wash') {
        g.washT += dt;
        const m = g.missing;
        if (g.washT > 1 && g.full[m]) {
          g.full[m] = false; g.painted[m].fill(false); SFX.miss();
        }
        if (g.washT > 3.2) {
          g.state = 'catch'; g.need = m; g.washed = true; g.sinceNeed = 0; this.sayNeed(g); speak(g.say);
        }
      } else if (g.state === 'finale') {
        g.endT += dt;
        if (g.endT > 0.4 && g.endT - dt <= 0.4) burst(CX, CY - R0, 40, { colors: ROY.map(c => c[1]), spread: 300, up: 120 });
        if (g.endT > 4.2) g.done = true;
      }

      // score: wrong catches and dawdling past a generous par
      const late = Math.max(0, g.idle - T.par);
      g.score = clamp(1 - 0.08 * g.wrongs - Math.min(0.35, late * 0.006), 0.15, 1);
      g.progress = `Colours: ${g.full.filter(Boolean).length} / 7`;
    },
    caught(g, p) {
      const c = p.c;
      g.state = 'carry'; g.holding = c; SFX.pop(); tone(520 + c * 60, 0.25, 'triangle', 0.08);
      burst(bucketX(g), CATCH_Y, 14, { colors: [ROY[c][1], '#ffffff'], spread: 120, up: 60 });
      floatText(bucketX(g), CATCH_Y - 40, cap(ROY[c][0]) + '!', ROY[c][1], false, 26);
      // the other drops turn into sparkles
      for (const q of g.drops) if (!q.gone) { q.gone = true; burst(q.x, q.y, 5, { colors: [ROY[q.c][1], '#ffffff'], spread: 60, up: 20 }); }
      g.say = `Run to the glowing end of the ${ROY[c][0]} stripe and climb up!`;
      speak(`${cap(ROY[c][0])}! Run to the glowing ${ROY[c][0]} stripe!`);
    },
    splat(g, p) {
      g.wrongs++; g.stun = 0.6; SFX.miss();
      burst(bucketX(g), CATCH_Y, 14, { colors: [ROY[p.c][1], '#ffffff'], spread: 140, up: 40 });
      floatText(bucketX(g), CATCH_Y - 40, 'Splat!', '#ffffff', false, 26);
      g.wet.push({ x: g.x + rand(-20, 20), c: p.c, t: 1.4 });
      const n = g.need;
      let msg;
      if (g.washed && n === g.missing) msg = `Splat! Not ${ROY[p.c][0]}. ${g.wrongs > 2 ? `It's ${ROY[n][0]}!` : 'Look at the colours on each side of the gap.'}`;
      else if (n === 0) msg = `Splat! Not yet. Red comes first!`;
      else msg = `Splat! Not yet. ${cap(ROY[n][0])} comes after ${ROY[n - 1][0]}.`;
      speak(msg);
    },
    bandDone(g) {
      const c = g.need;
      g.full[c] = true; g.holding = null; SFX.sparkle();
      const endA = g.dirOn > 0 ? aR(c) : aL(c), r = rOf(c);
      burst(CX + Math.cos(endA) * r, CY + Math.sin(endA) * r, 18, { colors: [ROY[c][1], '#ffffff', '#fff6a8'] });
      g.hopX0 = CX + Math.cos(endA) * (r + BW * 0.3);
      g.hopX1 = clamp(g.hopX0 + g.dirOn * 50, XMIN, XMAX);
      g.x = g.hopX1; g.state = 'hop'; g.hop = 0; g.facing = g.dirOn;
      tone(660, 0.12, 'sine', 0.08); tone(880, 0.16, 'sine', 0.08, 0.1);
      if (g.washed) { speak(`Yes! ${cap(ROY[c][0])} goes between ${ROY[c - 1]?.[0] ?? 'the edge'} and ${ROY[c + 1]?.[0] ?? 'the edge'}!`); return; }
      speak(FACTS[c]);
      g.need = Math.min(6, c + 1); g.sinceNeed = 0;
    },
    startWash(g) {
      g.state = 'wash'; g.washT = 0; g.missing = randInt(1, 5);
      speak('Oh no! A rain cloud! It washed one colour away!');
    },
    startFinale(g) {
      g.state = 'finale'; g.endT = 0; g.x = clamp(g.x, 300, 640); g.facing = 1;
      SFX.fanfare();
      g.say = 'Red, orange, yellow, green, blue, indigo, violet! A perfect rainbow!';
      speak(g.say);
    },
    cardShown(g) {
      if (g.T.card === 'always') return true;
      if (g.T.card === 'never') return false;
      return !(g.washed && g.need === g.missing);
    },

    // ------------------------------------------------------------------ drawing
    scene(g) {
      // sky, with the sun low behind Aubrey (sunlight + raindrops = rainbow)
      ctx.fillStyle = vgrad(0, GROUND, ['#58b8f4', '#9cdcff', '#e6f7ff']); ctx.fillRect(0, 0, W, H);
      const sx = 900, sy = 150;
      glow(sx, sy, 160, '255,240,170', 0.6);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(S.t * 0.2);
      ctx.fillStyle = 'rgba(255,236,140,.35)'; for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); tri(-8, -44, 8, -44, 0, -84); }
      ctx.restore();
      inkCircle(sx, sy, 36, '#ffe066', 2.5, '#e0a020');
      ctx.fillStyle = '#5a3a2a'; circle(sx - 11, sy - 4, 3); circle(sx + 11, sy - 4, 3);
      ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx, sy + 4, 10, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,140,140,.5)'; circle(sx - 20, sy + 6, 5); circle(sx + 20, sy + 6, 5);
      // little far clouds
      for (const [x0, y, s, v] of [[60, 210, 0.45, 8], [640, 250, 0.4, 6], [380, 280, 0.35, 10]]) puff(((x0 + S.t * v) % (W + 160)) - 80, y, s, '#ffffff', 'rgba(120,150,210,.35)');
      // hills
      bdHills('#b6efa0', 352, 22, 0.006, 0.5);
      bdHills('#92e07e', 384, 16, 0.011, 2);
      ctx.fillStyle = 'rgba(60,150,70,.25)'; for (let i = 0; i < 26; i++) ellipse((i * 137) % W, 396 + (i * 17) % 34, 6, 3);
      // far toadstool and tree shapes
      for (const [x, s] of [[48, 1], [930, 0.8]]) {
        INK = OL; inkRect(x - 5 * s, 392 - 30 * s, 10 * s, 30 * s, '#fff2dc', 1.5, 3);
        ink(P2(`M${x - 22 * s},${392 - 26 * s} C${x - 20 * s},${392 - 52 * s} ${x + 20 * s},${392 - 52 * s} ${x + 22 * s},${392 - 26 * s} Z`), '#ff5a6a', 1.5);
        ctx.fillStyle = '#fff'; circle(x - 8 * s, 392 - 38 * s, 3 * s); circle(x + 8 * s, 392 - 36 * s, 2.5 * s);
      }
    },
    rainbow(g) {
      ctx.lineCap = 'butt';
      const glowOn = g.state === 'finale';
      if (glowOn) glow(CX, CY - R0 + 60, 420, '255,255,255', 0.55 + 0.15 * Math.sin(S.t * 4));
      // outline under every band, then pale empty bands
      for (let c = 0; c < 7; c++) { ctx.strokeStyle = OL; ctx.lineWidth = BW + 5; ctx.beginPath(); ctx.arc(CX, CY, rOf(c), aL(c), aR(c)); ctx.stroke(); }
      for (let c = 0; c < 7; c++) { ctx.strokeStyle = '#f6f1fb'; ctx.lineWidth = BW - 1; ctx.beginPath(); ctx.arc(CX, CY, rOf(c), aL(c), aR(c)); ctx.stroke(); }
      for (let c = 0; c < 7; c++) {
        const lo = aL(c), hi = aR(c), step = (hi - lo) / BINS, col = ROY[c][1];
        // washing out: the band fades
        let alpha = 1;
        if (g.state === 'wash' && c === g.missing && g.washT <= 1) alpha = 1 - g.washT;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = col; ctx.lineWidth = BW - 1;
        let run = -1;
        for (let i = 0; i <= BINS; i++) {
          const on = i < BINS && (g.full[c] || g.painted[c][i]);
          if (on && run < 0) run = i;
          if (!on && run >= 0) { ctx.beginPath(); ctx.arc(CX, CY, rOf(c), lo + run * step, lo + i * step + 0.002); ctx.stroke(); run = -1; }
        }
        ctx.globalAlpha = 1;
        // dashed guide on empty bands
        if (!g.full[c]) {
          ctx.strokeStyle = 'rgba(150,120,180,.45)'; ctx.lineWidth = 2; ctx.setLineDash([7, 7]);
          ctx.beginPath(); ctx.arc(CX, CY, rOf(c), lo, hi); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      // a glossy shine along the outside
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(CX, CY, R0 + BW / 2 - 5, aL(0), aR(0)); ctx.stroke();
      // the band being painted: a wet glint right behind Aubrey
      if (g.state === 'paint') {
        const c = g.need, r = rOf(c);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        const a1 = g.a - g.dirOn * 0.18;
        ctx.beginPath(); ctx.arc(CX, CY, r - 4, Math.min(a1, g.a), Math.max(a1, g.a)); ctx.stroke(); ctx.lineCap = 'butt';
      }
      // the gap after a wash: a pulsing question mark
      if (g.washed && !g.full[g.missing] || (g.state === 'wash' && g.washT > 1)) {
        const r = rOf(g.missing), p = 1 + Math.sin(S.t * 5) * 0.1;
        inkCircle(CX, CY - r, 15 * p, '#fff6a8', 2); text('?', CX, CY - r + 1, 20, '#5a2a6e', 'center', 800);
      }
      if (glowOn) for (let k = 0; k < 12; k++) { const t = (S.t * 0.25 + k / 12) % 1, c = k % 7, lo = aL(c), a = lo + t * (aR(c) - lo); star(CX + Math.cos(a) * rOf(c), CY + Math.sin(a) * rOf(c), 7 + 3 * Math.sin(S.t * 6 + k), '#ffffff', 4); }
    },
    meadow(g) {
      const m = P2(`M0,${H} L0,${GROUND - 10} C200,${GROUND - 18} 360,${GROUND - 4} 480,${GROUND - 8} C640,${GROUND - 14} 800,${GROUND - 4} ${W},${GROUND - 12} L${W},${H} Z`);
      ctx.fillStyle = vgrad(GROUND - 20, H, ['#6fd25e', '#4fbf4f', '#3aa844']); ctx.fill(m);
      ctx.strokeStyle = 'rgba(40,110,50,.5)'; ctx.lineWidth = 2.5; ctx.stroke(m);
      ctx.fillStyle = '#86de70'; for (let i = 0; i < 30; i++) ellipse((i * 211) % W, GROUND + 6 + (i * 37) % 56, 16, 4);
      for (let i = 0; i < 14; i++) clover(30 + i * 68 + (i % 2) * 14, GROUND + 14 + (i * 29) % 44, 7 + (i % 3) * 1.5, ['#3fae4a', '#4fc25a', '#36a040'][i % 3]);
      for (let i = 0; i < 8; i++) flower(70 + i * 120, GROUND + 30 + (i % 3) * 14, 6, ['#fff', '#ffd84a', '#ff9acb'][i % 3], '#ffd84a', 1);
      // paint puddles where drops landed
      for (const w of g.wet) { ctx.globalAlpha = Math.min(1, w.t); ctx.fillStyle = ROY[w.c][1]; ellipse(w.x, GROUND + 4, 18, 5); circle(w.x + 14, GROUND + 1, 3); circle(w.x - 16, GROUND + 6, 2.5); ctx.globalAlpha = 1; }
    },
    rainCloud(g) {
      const x = g.cloudX, y = 96 + Math.sin(S.t * 1.6) * 4;
      const storm = g.state === 'wash';
      const fill = storm ? '#9aa4b8' : '#ffffff';
      puff(x, y, 0.95, fill, storm ? 'rgba(60,70,100,.7)' : 'rgba(120,140,200,.6)');
      // a sleepy-happy face
      ctx.fillStyle = '#3d2c4a'; circle(x - 14, y + 2, 3); circle(x + 14, y + 2, 3);
      ctx.strokeStyle = '#3d2c4a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); if (storm) ctx.arc(x, y + 18, 7, Math.PI + 0.4, TAU - 0.4); else ctx.arc(x, y + 8, 7, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,140,160,.45)'; circle(x - 24, y + 10, 5); circle(x + 24, y + 10, 5);
      // little rainbow-coloured specks dripping from its belly while it rains paint
      if (g.state === 'catch') for (let i = 0; i < 5; i++) { const k = (S.t * 1.4 + i / 5) % 1; ctx.fillStyle = ROY[(i * 3) % 7][1]; circle(x - 40 + i * 20, y + 26 + k * 18, 2.5 * (1 - k)); }
      // the storm pours over the washed band
      if (storm) {
        ctx.strokeStyle = 'rgba(80,110,170,.6)'; ctx.lineWidth = 2;
        for (let i = 0; i < 26; i++) { const rx = x - 70 + (i * 37) % 140, ry = y + 30 + ((S.t * 420 + i * 53) % 240); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 12); ctx.stroke(); }
      }
    },
    aubrey(g) {
      const c = g.holding, bcol = c != null ? ROY[c][1] : null;
      if (g.state === 'paint') {
        const r = rOf(g.need) + BW * 0.3, x = CX + Math.cos(g.a) * r, y = CY + Math.sin(g.a) * r;
        ctx.save(); ctx.translate(x, y); ctx.rotate((g.a - Math.PI * 1.5) * 0.8);
        const fr = g.moving ? RUN[Math.floor(S.t * 12) % 5] : 'idle_front';
        drawAubrey(0, 0, fr, g.facing, g.moving ? Math.abs(Math.sin(S.t * 12)) * 3 : 0, SC);
        bucket(g.facing * 22, -54, bcol, g.facing * 0.5);
        // drips falling from the tipped bucket
        const k = (S.t * 3) % 1; ctx.fillStyle = bcol; circle(g.facing * 40, -50 + k * 30, 4 * (1 - k * 0.5));
        ctx.restore();
        return;
      }
      let lift = 0, fr;
      if (g.state === 'hop') { const k = Math.min(1, g.hop / 0.5); lift = Math.sin(k * Math.PI) * 50; fr = 'jump'; }
      else if (g.state === 'finale') { fr = Math.floor(S.t * 2) % 2 ? 'twirl' : 'idle_front'; lift = Math.abs(Math.sin(S.t * 5)) * 16; }
      else if (g.stun > 0) fr = 'crouch';
      else fr = g.moving ? RUN[Math.floor(S.t * 12) % 5] : 'idle_front';
      drawAubrey(g.x, GROUND, fr, g.facing, lift, SC);
      if (g.state !== 'finale') {
        // the bucket held out beside her (never over her face), catching drops
        const bx = bucketX(g), by = CATCH_Y + 6 - lift + (g.stun > 0 ? 10 : 0);
        ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(g.x + Math.sign(g.bo) * 8, GROUND - 60 - lift); ctx.lineTo(bx - Math.sign(g.bo) * 4, by - 24); ctx.stroke();
        ctx.strokeStyle = '#ffd8c0'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(g.x + Math.sign(g.bo) * 8, GROUND - 60 - lift); ctx.lineTo(bx - Math.sign(g.bo) * 4, by - 24); ctx.stroke();
        bucket(bx, by, g.state === 'hop' ? null : bcol, g.stun > 0 ? Math.sin(S.t * 30) * 0.2 : 0);
        if (g.stun > 0 && g.wet.length) { const w = g.wet[g.wet.length - 1]; ctx.fillStyle = ROY[w.c][1]; for (let i = 0; i < 5; i++) circle(bx - 24 + i * 12, by - 10 - Math.abs(Math.sin(i * 2.1)) * 12, 5); }
      }
    },
    draw(g) {
      this.scene(g);
      this.rainbow(g);
      this.meadow(g);
      // glowing feet of the band to paint
      if (g.state === 'carry') {
        const col = ROY[g.need][1];
        for (const side of [-1, 1]) {
          const fx = footX(g.need, side), b = Math.abs(Math.sin(S.t * 5)) * 10;
          glow(fx, GROUND - 6, 46, hexRgb(col).join(','), 0.8);
          inkEllipse(fx, GROUND + 2, 22, 7, 0, col, 2);
          INK = OL; ink(P2(`M${fx - 12},${GROUND - 60 - b} L${fx + 12},${GROUND - 60 - b} L${fx + 12},${GROUND - 40 - b} L${fx + 22},${GROUND - 40 - b} L${fx},${GROUND - 18 - b} L${fx - 22},${GROUND - 40 - b} L${fx - 12},${GROUND - 40 - b} Z`), col, 2.5);
        }
      }
      // Seamus by the far end, cheering at the finale
      const hop = g.state === 'finale' ? Math.abs(Math.sin(S.t * 7)) * 18 : 0;
      drawCritter('Seamus Shamrock', 912, GROUND + 4 - hop, 0.5, -1);
      if (g.state === 'finale' && g.endT > 0.6) {
        rrect(756, 230, 170, 48, 18, '#ffffff', OL, 2.5);
        ctx.fillStyle = '#ffffff'; tri(870, 276, 896, 276, 900, 296);
        text('Grand job!', 841, 254, 22, '#2a7a3a', 'center', 800);
      }
      // falling paint
      for (const p of g.drops) paintDrop(p.x + Math.sin(p.wob) * 2, p.y, 0.9, ROY[p.c][1]);
      this.rainCloud(g);
      this.aubrey(g);
      // "next colour" helper card
      if ((g.state === 'catch' || g.state === 'wash') && g.state !== 'finale') {
        rrect(12, 64, 214, 56, 18, 'rgba(255,255,255,.92)', OL, 2.5);
        if (g.state === 'wash') text('Uh oh! Rain!', 119, 92, 22, '#5a2a6e', 'center', 800);
        else if (this.cardShown(g)) {
          text('Catch:', 26, 92, 20, '#5a2a6e', 'left', 700);
          paintDrop(112, 92, 0.6, ROY[g.need][1]);
          outlined(ROY[g.need][0].toUpperCase(), 136, 92, 22, ROY[g.need][1], 'left', '#3d2c4a');
        } else text(g.washed && g.need === g.missing ? 'Which is missing?' : 'What comes next?', 119, 92, 19, '#5a2a6e', 'center', 800);
      } else if (g.state === 'carry' || g.state === 'paint') {
        rrect(12, 64, 214, 56, 18, 'rgba(255,255,255,.92)', OL, 2.5);
        text(g.state === 'carry' ? 'Climb the glowing' : 'Paint the', 119, 82, 17, '#5a2a6e', 'center', 700);
        outlined(`${ROY[g.need][0].toUpperCase()} stripe!`, 119, 104, 20, ROY[g.need][1], 'center', '#3d2c4a');
      }
    },
  };

  restage('rainbowend', {
    games: [['colourgates', 'rainbow', {}], ['rainbowpainter', 'honey', {}]],
    mid: [
      "N:Grand job! Oh no, look! The rain washed every colour off me rainbow!",
      "N:Catch the paint drops from me rain cloud, one colour at a time, in rainbow order. Red comes first, mind!",
      "N:Then run right up and over the rainbow to paint each stripe.",
      'A:excited:Red, orange, yellow... I\'ll paint it all!',
    ],
  });
}
