'use strict';
{
  // ===========================================================================
  // Glittering Creek, game 1 (action) CRYSTAL GARDEN: Otto's grotto has clear crystal basins of
  // salty creek water, each with a tiny seed crystal at the bottom. As the warm sunbeam dries the
  // water up, the salt is left behind and sticks to the crystal, one sparkly layer at a time.
  // Keep every basin growing: run Aubrey over and pour more salty water once the water drops
  // below the line (pour too soon and it splashes over and knocks a layer off). The sunbeam
  // slides across the cave, so the sunny basin dries (and grows) fastest.
  // Teaches: salt hides dissolved in water; when the water evaporates the salt is left behind
  // and builds crystals in layers; warmth makes water evaporate faster.
  // ===========================================================================
  const CG_COLS = ['#7fe8ff', '#ff8fd0', '#b892ff', '#8affc8', '#ffe36b', '#ffb07a'];
  const CG_TOP = 352, CG_BOT = 448, CG_HW = 58;  // basin rim y, floor y, half width
  const CG_LINE = 0.5;                            // pour when the water is below this
  const CG_SPLASH = 0.56;                         // pour above this and it overflows
  const CG_LAYERS = 5;                            // layers to a finished crystal
  const CG_AUB_GY = 508;

  const twk = (x, y, r, a, col = '#ffffff') => { ctx.globalAlpha = clamp(a, 0, 1); star(x, y, r, col, 4); ctx.globalAlpha = 1; };
  function gem(x, y, h, w, col, rot = 0, lw = 1.5) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const p = P2(`M${-w / 2},0 L${-w / 2},${-h * 0.72} L0,${-h} L${w / 2},${-h * 0.72} L${w / 2},0 Z`);
    ink(p, col, lw);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-w / 2, -h, w * 0.32, h);
    ctx.fillStyle = 'rgba(40,10,80,.15)'; ctx.fillRect(w * 0.18, -h, w, h);
    ctx.restore();
    ctx.restore();
  }
  function wallCluster(x, y, s, t, k = 0) {
    const gr = ctx.createRadialGradient(x, y - 24 * s, 3, x, y - 24 * s, 60 * s);
    gr.addColorStop(0, `rgba(200,240,255,${0.3 + 0.14 * Math.sin(t * 2 + x)})`); gr.addColorStop(1, 'rgba(200,240,255,0)');
    ctx.fillStyle = gr; circle(x, y - 24 * s, 60 * s);
    [[-18, 36, 14, -0.45], [18, 42, 14, 0.4], [-6, 58, 17, -0.12], [8, 48, 15, 0.16]].forEach(([dx, h, w, r], i) =>
      gem(x + dx * s, y, h * s, w * s, CG_COLS[(i + k) % CG_COLS.length], r, 1.2));
  }

  // --- the sunny crystal grotto -------------------------------------------------------------
  function drawCave(g, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2c2068'); bg.addColorStop(0.5, '#3f3c9a'); bg.addColorStop(1, '#4a5aa8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // far wall bands
    ctx.fillStyle = '#4b44a8';
    ctx.beginPath(); ctx.moveTo(0, 300); ctx.bezierCurveTo(160, 230, 320, 290, 480, 250); ctx.bezierCurveTo(640, 210, 800, 270, 960, 230); ctx.lineTo(960, 470); ctx.lineTo(0, 470); ctx.fill();
    ctx.fillStyle = '#5a52b8';
    ctx.beginPath(); ctx.moveTo(0, 360); ctx.bezierCurveTo(200, 320, 380, 352, 560, 322); ctx.bezierCurveTo(720, 300, 860, 336, 960, 318); ctx.lineTo(960, 470); ctx.lineTo(0, 470); ctx.fill();
    // strata lines
    ctx.strokeStyle = 'rgba(160,150,240,.25)'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 150 + i * 34); ctx.bezierCurveTo(300, 130 + i * 36, 640, 170 + i * 30, 960, 140 + i * 34); ctx.stroke(); }
    // glow-worms
    for (let i = 0; i < 40; i++) {
      const x = (i * 151 + 37) % 950, y = 74 + (i * 67) % 230, a = 0.4 + 0.5 * Math.sin(t * 1.8 + i * 1.7);
      ctx.fillStyle = `rgba(140,255,230,${a * 0.3})`; circle(x, y, 6); ctx.fillStyle = `rgba(220,255,245,${a})`; circle(x, y, 1.8);
    }
    // crystals set into the walls
    wallCluster(56, 300, 0.75, t, 0); wallCluster(338, 262, 0.5, t + 1, 2); wallCluster(616, 248, 0.55, t + 2, 4);
    wallCluster(902, 286, 0.7, t + 3, 1); wallCluster(470, 300, 0.4, t + 4, 3); wallCluster(770, 300, 0.42, t + 5, 5);
    // hanging vines with glowing flowers near the skylight
    for (let i = 0; i < 9; i++) {
      const x = 90 + i * 104 + (i % 2) * 20, len = 40 + ((i * 41) % 60), sw = Math.sin(t * 1.2 + i) * 4;
      ctx.strokeStyle = '#3f9a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 60); ctx.quadraticCurveTo(x + sw, 60 + len / 2, x + sw * 1.5, 60 + len); ctx.stroke();
      for (let j = 1; j <= 3; j++) { ctx.fillStyle = '#5ac87a'; ellipse(x + sw * j / 2 + (j % 2 ? 5 : -5), 60 + len * j / 3.3, 6, 3, j % 2 ? 0.5 : -0.5); }
      ctx.fillStyle = ['#ff9ad8', '#ffe36b', '#9ad8ff'][i % 3]; circle(x + sw * 1.5, 62 + len, 4.5);
      ctx.fillStyle = '#fff'; circle(x + sw * 1.5, 62 + len, 1.6);
    }
    // ceiling with stalactites
    ctx.fillStyle = '#231a5a'; ctx.fillRect(0, 54, W, 10);
    for (let i = 0; i < 20; i++) {
      const x = 12 + i * 49 + (i % 3) * 7, h = 18 + ((i * 37) % 34);
      ink(P2(`M${x - 12},62 L${x + 12},62 L${x + 2},${62 + h} Z`), i % 2 ? '#3a2f80' : '#43378e', 1.1, '#1e1446');
      if (i % 3 === 0) { ctx.fillStyle = `rgba(150,230,255,${0.5 + 0.4 * Math.sin(t * 3 + i)})`; circle(x + 2, 66 + h, 2.8); }
    }
    // the creek along the very front, with a little waterfall at the right
    const cr = P2('M0,512 C240,506 520,516 960,508 L960,540 L0,540 Z');
    const wg = ctx.createLinearGradient(0, 506, 0, 540); wg.addColorStop(0, '#6fdcef'); wg.addColorStop(1, '#3a9ad0');
    ctx.fillStyle = wg; ctx.fill(cr);
    ctx.strokeStyle = '#e0faff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 512); ctx.bezierCurveTo(240, 506, 520, 516, 960, 508); ctx.stroke();
    ctx.save(); ctx.clip(cr);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const x = ((i * 113 - t * 38) % 1000 + 1000) % 1000 - 20, y = 518 + (i * 13) % 20;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 4, x + 26, y); ctx.stroke();
    }
    for (let i = 0; i < 12; i++) twk((i * 83) % W, 520 + (i * 29) % 16, 4, Math.sin(t * 4 + i * 2.1));
    ctx.restore();
    // rocky floor where the basins sit
    const fl = ctx.createLinearGradient(0, 430, 0, 514); fl.addColorStop(0, '#b8a2e8'); fl.addColorStop(1, '#9a82d8');
    ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(0, 438); ctx.bezierCurveTo(240, 430, 600, 440, 960, 432); ctx.lineTo(960, 514); ctx.lineTo(0, 514); ctx.fill();
    for (let i = 0; i < 26; i++) inkEllipse((i * 137 + 20) % W, 476 + (i * 53) % 30, 5 + (i % 3) * 2, 3.5, 0, ['#e8e0f4', '#ffd8ec', '#d8f0ff', '#e0ffe8'][i % 4], 0.8);
  }

  // the sunbeam pouring through a crack in the roof; it slides slowly as the sun moves across the sky
  function drawBeam(g, t) {
    const bx = g.beamX, hw = g.beamHW;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const p = P2(`M${bx - 26 + (bx - 480) * 0.25},58 L${bx + 26 + (bx - 480) * 0.25},58 L${bx + hw},${CG_BOT + 4} L${bx - hw},${CG_BOT + 4} Z`);
    const lg = ctx.createLinearGradient(0, 58, 0, CG_BOT);
    lg.addColorStop(0, 'rgba(255,246,190,.55)'); lg.addColorStop(1, 'rgba(255,230,150,.18)');
    ctx.fillStyle = lg; ctx.fill(p);
    ctx.save(); ctx.clip(p);
    for (let i = 0; i < 22; i++) {
      const y = 70 + ((i * 47 + t * 26) % 380), x = bx + (bx - 480) * 0.25 * (1 - (y - 58) / 390) + Math.sin(i * 2.3 + t) * hw * 0.7 * ((y - 58) / 390 + 0.2);
      ctx.fillStyle = `rgba(255,250,220,${0.4 + 0.3 * Math.sin(t * 3 + i)})`; circle(x, y, 1.6 + (i % 3) * 0.6);
    }
    ctx.restore();
    // warm puddle of light on the floor
    const pg = ctx.createRadialGradient(bx, CG_BOT, 4, bx, CG_BOT, hw * 1.2);
    pg.addColorStop(0, 'rgba(255,240,170,.45)'); pg.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = pg; ellipse(bx, CG_BOT, hw * 1.2, 26);
    ctx.restore();
    // the crack of daylight in the roof, with a little sun peeking through
    const cx = bx + (bx - 480) * 0.25;
        const cg = ctx.createRadialGradient(cx, 60, 2, cx, 60, 60);
    cg.addColorStop(0, 'rgba(255,248,200,.9)'); cg.addColorStop(1, 'rgba(255,248,200,0)');
    ctx.fillStyle = cg; ellipse(cx, 64, 60, 18);
    ctx.fillStyle = '#ffffff'; ellipse(cx, 60, 22, 4);
  }

  // one clear crystal basin: water inside (falling as it dries), the crystal growing on the bottom
  function drawBasin(g, b, i, t) {
    const x = b.x, sh = 1 - b.sunK * 0.0;
    const bowl = P2(`M${x - CG_HW},${CG_TOP} C${x - CG_HW - 4},${CG_BOT - 18} ${x - CG_HW + 14},${CG_BOT} ${x},${CG_BOT} C${x + CG_HW - 14},${CG_BOT} ${x + CG_HW + 4},${CG_BOT - 18} ${x + CG_HW},${CG_TOP} Z`);
    // halo when it needs water
    const need = b.water < CG_LINE;
    if (need) {
      ctx.fillStyle = `rgba(140,230,255,${0.18 + 0.12 * Math.sin(t * 6 + i)})`; ellipse(x, CG_TOP + 40, CG_HW + 22, 66);
    }
    // the bowl glass (back)
    ctx.strokeStyle = '#2a1f66'; ctx.lineWidth = 5; ctx.stroke(bowl);
    ctx.fillStyle = 'rgba(210,235,255,.22)'; ctx.fill(bowl);
    ctx.save(); ctx.clip(bowl);
    // water
    const wy = CG_BOT - (CG_BOT - CG_TOP - 6) * b.water;
    const wgr = ctx.createLinearGradient(0, wy, 0, CG_BOT);
    wgr.addColorStop(0, 'rgba(110,220,240,.78)'); wgr.addColorStop(1, 'rgba(50,140,210,.85)');
    ctx.fillStyle = wgr; ctx.fillRect(x - CG_HW - 6, wy, CG_HW * 2 + 12, CG_BOT - wy + 4);
    // salt crust lines left on the glass as it dries
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
    for (let k = 1; k <= 3; k++) { const yy = CG_TOP + 10 + k * 18; if (yy < wy - 2) { ctx.beginPath(); ctx.moveTo(x - CG_HW, yy); ctx.lineTo(x + CG_HW, yy); ctx.stroke(); } }
    // the crystal: inner growth rings show each layer
    const size = b.layers + b.grow;
    const col = b.col, base = CG_BOT - 4;
    const hOf = s => 16 + s * 13, wOf = s => 9 + s * 5;
    for (let L = Math.floor(size); L >= 0; L--) {
      const s = L === Math.floor(size) ? size : L;
      if (s <= 0 && L > 0) continue;
      const c = mix(col, L % 2 ? '#ffffff' : '#c8b8ff', L === Math.floor(size) ? 0.05 : 0.25 + 0.05 * L);
      gem(x - wOf(s) * 0.62, base, hOf(s) * 0.62, wOf(s) * 0.6, c, -0.35, 1);
      gem(x + wOf(s) * 0.62, base, hOf(s) * 0.55, wOf(s) * 0.56, c, 0.38, 1);
      gem(x, base, hOf(s), wOf(s), c, 0, 1);
    }
    // water surface shine and ripples
    if (b.water > 0.02) {
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x - CG_HW, wy - 1, CG_HW * 2, 2.5);
      if (b.pourT > 0) for (let k = 0; k < 3; k++) { ctx.strokeStyle = `rgba(255,255,255,${0.6 - k * 0.18})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x - 26, wy + 2, 8 + ((t * 40 + k * 10) % 30), 3, 0, 0, Math.PI * 2); ctx.stroke(); }
    } else {
      // dry: little cracks in the salt crust
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - 40, CG_BOT - 8); ctx.lineTo(x - 28, CG_BOT - 4); ctx.lineTo(x - 20, CG_BOT - 9); ctx.moveTo(x + 22, CG_BOT - 7); ctx.lineTo(x + 34, CG_BOT - 3); ctx.lineTo(x + 42, CG_BOT - 8); ctx.stroke();
    }
    // salt sparkles drifting onto the crystal while the water dries
    if (b.water > 0.02 && b.evap > 0) {
      for (let k = 0; k < 6; k++) {
        const ph = (t * (0.6 + b.sunK) + k / 6 + i * 0.3) % 1, sx = x + Math.sin(k * 2.7 + i) * 40 * (1 - ph), sy = lerp(wy + 6, base - hOf(size) * 0.6, ph);
        twk(sx, sy, 3.5, Math.sin(ph * Math.PI) * (0.5 + b.sunK * 0.5));
      }
    }
    ctx.restore();
    // the pour line
    const ly = CG_BOT - (CG_BOT - CG_TOP - 6) * CG_LINE;
    ctx.strokeStyle = need ? '#fff59a' : 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x - CG_HW + 4, ly); ctx.lineTo(x + CG_HW - 4, ly); ctx.stroke(); ctx.setLineDash([]);
    // glass front shine and rim
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(x - CG_HW + 14, CG_TOP + 34, 6, 26, 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(230,248,255,.95)'; ctx.lineWidth = 2.5; ctx.stroke(bowl);
    inkEllipse(x, CG_TOP, CG_HW + 2, 7, 0, 'rgba(220,245,255,.55)', 1.2, '#2a1f66');
    // steam wisps when the sun warms it
    if (b.sunK > 0.2 && b.water > 0.02) {
      ctx.strokeStyle = `rgba(255,255,255,${0.45 * b.sunK})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.7 + k / 3) % 1, sx = x - 24 + k * 24, sy = CG_TOP - 4 - ph * 46;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        ctx.beginPath(); ctx.moveTo(sx, sy + 14); ctx.bezierCurveTo(sx + 8, sy + 8, sx - 8, sy + 4, sx, sy - 4); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // number tag and layer pips under the basin
    inkCircle(x - 42, CG_BOT + 14, 12, need ? '#ffd84a' : '#e8e0ff', 1.2, '#2a1f66');
    text(String(i + 1), x - 42, CG_BOT + 15, 15, '#2a1f66', 'center', 800);
    for (let k = 0; k < CG_LAYERS; k++) {
      const px = x - 20 + k * 15;
      inkCircle(px, CG_BOT + 14, 5.5, k < b.layers ? col : k === b.layers ? mix('#5a52b8', col, b.grow) : '#5a52b8', 1, '#2a1f66');
    }
    // thirsty / dry call-out
    if (need) {
      const by = CG_TOP - 40 + Math.sin(t * 4 + i) * 3;
      const lbl = b.water <= 0.02 ? 'Dry!' : 'Pour!';
      rrect(x - 34, by - 15, 68, 30, 15, b.water <= 0.02 ? '#ff9a6a' : '#ffffff', '#2a1f66', 2.5);
      text(lbl, x, by + 1, 16, b.water <= 0.02 ? '#ffffff' : '#2a6aa8', 'center', 800);
      ctx.fillStyle = b.water <= 0.02 ? '#ff9a6a' : '#ffffff'; tri(x - 7, by + 14, x + 7, by + 14, x, by + 23);
    }
    if (b.splashT > 0) {
      ctx.globalAlpha = clamp(b.splashT * 2, 0, 1);
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.35, r = (1 - b.splashT) * 70 + 10; inkCircle(x + Math.cos(a) * r, CG_TOP - 4 + Math.sin(a) * r * 0.8 + (1 - b.splashT) * 40, 5, '#9ae8ff', 0.8, '#2a6aa8'); }
      ctx.globalAlpha = 1;
    }
    if (b.popT > 0) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + t * 3; twk(x + Math.cos(a) * 52, CG_TOP + 30 + Math.sin(a) * 40, 7, b.popT, k % 2 ? '#ffffff' : col); }
  }

  // Aubrey's scallop-shell jug of salty creek water
  function drawJug(x, y, tilt) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    ink(P2('M-16,-18 C-20,0 -14,16 0,18 C14,16 20,0 16,-18 Z'), '#ffb3d8', 1.4);
    ctx.strokeStyle = 'rgba(200,80,140,.55)'; ctx.lineWidth = 1.5;
    for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(dx * 0.6, 16); ctx.lineTo(dx, -16); ctx.stroke(); }
    ink(P2('M16,-16 L26,-22 L24,-14 Z'), '#ffb3d8', 1.2);
    inkEllipse(0, -18, 16, 4, 0, '#6fdcef', 1.2);
    ctx.restore();
  }

  MG.crystalgarden = {
    kind: 'action', title: () => 'Crystal Garden', icon: () => '💎',
    how: () => "Creek water has salt hiding in it! When the sunshine dries the water up, the salt stays behind and grows the crystal, one layer at a time. When the water drops below the line, click that basin (or press its number) and Aubrey will pour more. Not too soon, or it splashes!",
    init(g) {
      const t = g.tier - 1, n = [3, 4, 5][t];
      const xs = [[190, 440, 690], [150, 340, 530, 720], [104, 264, 424, 584, 744]][t];
      Object.assign(g, {
        timeLeft: 70, goal: [4, 6, 8][t], grown: 0, splashes: 0, dries: 0,
        sunEvap: 1 / [6, 5, 4.4][t], shadeEvap: 1 / [32, 28, 24][t], perWater: 2.4,
        beamHW: [96, 84, 74][t], beamX: xs[0], beamPh: 0, beamPer: [26, 22, 18][t], xs,
        basins: xs.map((x, i) => ({ x, water: [0.92, 0.78, 1, 0.84, 0.7][i], layers: 0, grow: 0.15, col: CG_COLS[i % CG_COLS.length], sunK: 0, evap: 0, splashT: 0, popT: 0, pourT: 0, dryT: 0, warned: false })),
        ax: xs[0] - 80, tx: null, target: -1, pouring: -1, pourT: 0, facing: 1, cheer: 0, sad: 0, pile: [],
        said: {}, say: 'When the water drops below the line, pour more salty water!',
      });
    },
    start(g) { speak(g.say); },
    sayOnce(g, key, s) { if (!g.said[key]) { g.said[key] = true; g.say = s; speak(s); } },
    pickBasin(g, i) {
      if (i < 0 || i >= g.basins.length || g.pouring >= 0 || g.stun > 0) return;
      g.target = i; g.tx = clamp(g.basins[i].x - 82, 24, 860);
    },
    update(g, dt, id) {
      g.timeLeft -= dt; g.cheer = Math.max(0, g.cheer - dt); g.sad = Math.max(0, g.sad - dt); g.stun = Math.max(0, (g.stun || 0) - dt);
      // the sun moves, so the beam slides back and forth across the cave
      g.beamPh += dt / g.beamPer;
      const lo = g.xs[0] - 30, hi = g.xs[g.xs.length - 1] + 30;
      g.beamX = lerp(lo, hi, 0.5 - 0.5 * Math.cos(g.beamPh * Math.PI * 2));
      // choose a basin: click it, or press its number; or walk with the arrows and press Space
      for (let i = 0; i < g.basins.length; i++) if (pressed[String(i + 1)]) this.pickBasin(g, i);
      if (pointer.clicked) {
        const i = g.basins.findIndex(b => Math.abs(pointer.x - b.x) < CG_HW + 24 && pointer.y > CG_TOP - 64 && pointer.y < CG_BOT + 34);
        if (i >= 0) this.pickBasin(g, i);
      }
      if (g.pouring < 0) {
        if (goLeft() || goRight()) { g.tx = null; g.target = -1; g.ax += (goRight() ? 1 : -1) * 360 * dt; g.facing = goRight() ? 1 : -1; }
        if (pressed[' '] || pressed.arrowdown || pressed.arrowup || pressed.enter) {
          let best = -1, bd = 1e9; g.basins.forEach((b, i) => { const d = Math.abs(b.x - 82 - g.ax); if (d < bd) { bd = d; best = i; } });
          if (bd < 90) this.pickBasin(g, best);
        }
      }
      g.ax = clamp(g.ax, 24, 860);
      g.moving = false;
      if (g.tx != null && g.pouring < 0) {
        const d = g.tx - g.ax;
        if (Math.abs(d) > 4) { g.moving = true; g.facing = Math.sign(d); g.ax += Math.sign(d) * Math.min(Math.abs(d), 400 * dt); }
        else {
          g.ax = g.tx; g.tx = null;
          // arrived: pour!
          const b = g.basins[g.target];
          if (b.water > CG_SPLASH) {
            b.splashT = 1; g.splashes++; g.sad = 0.9; g.stun = 0.8; SFX.miss();
            burst(b.x, CG_TOP, 14, { colors: ['#9ae8ff', '#ffffff', '#6fdcef'] });
            b.grow = 0;
            if (b.layers > 0) { b.layers--; floatText(b.x, CG_TOP - 50, 'Splash! A layer broke off', '#ffd0e0', false, 18); }
            else { floatText(b.x, CG_TOP - 50, 'Splash! Too full', '#ffd0e0', false, 18); }
            b.water = 1;
            this.sayOnce(g, 'splash', 'Too full! Wait until the water drops below the line, then pour.');
          } else { g.pouring = g.target; g.pourT = 0; b.pourT = 0.55; tone(520, 0.4, 'sine', 0.05, 0, 300); }
          g.target = -1;
        }
      }
      if (g.pouring >= 0) {
        const b = g.basins[g.pouring];
        g.pourT += dt; b.water = Math.min(1, b.water + dt / 0.55);
        if (g.pourT >= 0.55) { b.water = 1; g.pouring = -1; SFX.blip(); }
      }
      // evaporation: the salt left behind grows each crystal
      for (const [i, b] of g.basins.entries()) {
        b.splashT = Math.max(0, b.splashT - dt * 1.4); b.popT = Math.max(0, b.popT - dt); b.pourT = Math.max(0, b.pourT - dt);
        const d = Math.abs(b.x - g.beamX);
        b.sunK = clamp(1 - (d - g.beamHW * 0.55) / (g.beamHW * 0.7), 0, 1);
        const rate = lerp(g.shadeEvap, g.sunEvap, b.sunK);
        const was = b.water;
        if (g.pouring !== i) b.water = Math.max(0, b.water - rate * dt);
        b.evap = was - b.water;
        if (b.water <= 0) {
          b.dryT += dt;
          if (b.dryT > 1.2) this.sayOnce(g, 'dry', `Basin ${NUM_WORDS[i + 1]} is all dry, so its crystal stopped growing. Pour more water in!`);
        } else b.dryT = 0;
        if (b.water < CG_LINE && !b.warned) { b.warned = true; tone(880, 0.12, 'triangle', 0.04); tone(1100, 0.12, 'triangle', 0.04, 0.1); }
        if (b.water >= CG_LINE) b.warned = false;
        b.grow += b.evap * g.perWater;
        while (b.grow >= 1) {
          b.grow -= 1; b.layers++;
          tone([523, 587, 659, 784, 880][Math.min(4, b.layers - 1)], 0.25, 'sine', 0.06);
          if (b.layers < CG_LAYERS) { SFX.sparkle(); floatText(b.x, CG_TOP - 52, `Layer ${b.layers}!`, b.col, false, 18); }
        }
        if (b.layers >= CG_LAYERS) {
          // finished! Otto takes it and a new tiny seed crystal goes in
          g.grown++; g.cheer = 1.1; b.popT = 1;
          g.pile.push({ col: b.col, x: b.x, y: CG_BOT - 30, t: 0 });
          SFX.fanfare(); burst(b.x, CG_TOP + 30, 26, { colors: [b.col, '#ffffff', '#fff6a8'] });
          floatText(b.x, CG_TOP - 56, 'A big crystal!', '#fff6a8', false, 22);
          if (g.grown === 1) speak('Your first big crystal! It grew from the salt in the water!');
          b.layers = 0; b.grow = 0.1; b.col = CG_COLS[(CG_COLS.indexOf(b.col) + g.basins.length) % CG_COLS.length];
        }
      }
      for (const p of g.pile) p.t = Math.min(1, p.t + dt * 1.2);
      if (g.sunHint == null && g.t > 14) { g.sunHint = true; this.sayOnce(g, 'sun', 'See the sunbeam? The sunny basin dries fastest, so its crystal grows fastest too!'); }
      g.progress = `Big crystals ${g.grown} of ${g.goal}`;
      g.score = clamp(g.grown / g.goal, 0, 1);
      if (g.grown >= g.goal || g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      const t = S.t;
      drawCave(g, t);
      drawBeam(g, t);
      g.basins.forEach((b, i) => drawBasin(g, b, i, t));
      // Otto on his rock with the finished crystals
      ink(P2('M830,486 C826,452 852,436 890,436 C930,436 956,452 958,486 Z'), '#8f7ccc', 1.6);
      ctx.fillStyle = '#5ac85a'; ellipse(872, 440, 26, 6);
      g.pile.forEach((p, k) => {
        const tx = 846 + (k % 5) * 24 - (k >= 5 ? -12 : 0), ty = 446 - Math.floor(k / 5) * 18;
        const e = p.t, x = lerp(p.x, tx, e), y = lerp(p.y, ty, e) - Math.sin(e * Math.PI) * 120;
        gem(x, y, 30, 14, p.col, (k % 3 - 1) * 0.25, 1.1);
      });
      drawCritter('Otto the Otter', 900, 448, 0.5, -1);
      // Aubrey and her jug
      const frame = g.moving ? `run${1 + Math.floor(t * 12) % 5}` : g.cheer > 0 ? 'twirl' : 'idle_front';
      const lift = g.cheer > 0 ? Math.sin(g.cheer / 1.1 * Math.PI) * 12 : 0;
      drawAubrey(g.ax, CG_AUB_GY, frame, g.facing, lift, 0.52);
      if (g.pouring >= 0) {
        const b = g.basins[g.pouring], jx = b.x - 46, jy = CG_TOP - 18, wy = CG_BOT - (CG_BOT - CG_TOP - 6) * b.water;
        ctx.strokeStyle = 'rgba(140,230,255,.9)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(jx + 22, jy - 4); ctx.quadraticCurveTo(jx + 34, jy + 10, jx + 30, wy); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5; ctx.stroke();
        drawJug(jx, jy, 0.9);
      } else drawJug(g.ax + 22 * (g.facing || 1), CG_AUB_GY - 58 - lift, 0.1 * (g.facing || 1));
      if (g.sad > 0) text('Oops!', g.ax, CG_AUB_GY - 140, 18, '#ffd0e0', 'center', 800);
      // little key: below the line = pour
      darkPanel(14, 66, 230, 40, 16);
      ctx.strokeStyle = '#fff59a'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(26, 86); ctx.lineTo(58, 86); ctx.stroke(); ctx.setLineDash([]);
      text('Below the line? Pour!', 66, 86.5, 14, '#fff', 'left', 700);
    },
  };

  restage('crystalcreek', {
    games: [['crystalgarden', 'crystal', {}], ['colourmix', 'shell', {}]],
    intro: [
      "N:Welcome to my crystal garden! Each clear basin has a teeny seed crystal at the bottom, sitting in salty creek water.",
      'A:surprised:Salty? But I can\'t see any salt in the water!',
      "N:It's dissolved, hiding in the water! When the warm sun dries the water up, the salt gets left behind and sticks to the crystal, one sparkly layer at a time.",
      "N:So keep my basins topped up! Pour more once the water drops below the line, but not too soon, or SPLASH!",
      'A:determined:I\'ll keep every basin growing until we have big, giant crystals!',
    ],
  });
}
