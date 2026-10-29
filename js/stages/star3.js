'use strict';
// Shooting Star Hill, game 1: Star Catcher (replaces Star Sling).
// Aubrey rides a shooting star with a star net. The stars that fell out of a real constellation
// flit about the sky like giggly fireflies; she swoops to catch each one and carries it back to its
// glowing empty spot. A finished constellation lights up, its picture (ladle, hunter, queen's chair,
// swan, lion) fades in and a true fact is read out. After three skies: a quick "Which one is ...?" name check.
{
  const glow = (x, y, r, rgb, a = 0.6) => {
    if (r <= 0) return;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const tryScore = w => [1, 0.5, 0.2, 0][Math.min(3, w)];
  const face = (x, y, s, mood) => {
    ctx.fillStyle = '#3d2c4a'; ctx.strokeStyle = '#3d2c4a'; ctx.lineCap = 'round';
    if (mood === 'sleepy') {
      ctx.lineWidth = 1.6 * s; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * 6 * s, y, 2.8 * s, 0.1, Math.PI - 0.1); ctx.stroke(); }
    } else { circle(x - 6 * s, y, 2.6 * s); circle(x + 6 * s, y, 2.6 * s); ctx.fillStyle = '#fff'; circle(x - 5.2 * s, y - 1 * s, 0.9 * s); circle(x + 6.8 * s, y - 1 * s, 0.9 * s); }
    ctx.lineWidth = 1.8 * s; ctx.beginPath();
    if (mood === 'wow') { ctx.fillStyle = '#3d2c4a'; ctx.ellipse(x, y + 6 * s, 2.4 * s, 3 * s, 0, 0, TAU); ctx.fill(); }
    else { ctx.arc(x, y + 3 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,120,160,.45)'; circle(x - 10 * s, y + 4 * s, 2.4 * s); circle(x + 10 * s, y + 4 * s, 2.4 * s);
  };

  // ------------------------------------------------------------------ the constellations
  // star positions are in pixels around the sky centre (SC_X, SC_Y); pic(a) draws the picture
  const SC_X = 480, SC_Y = 262;
  const ART_FILL = 'rgba(150,175,255,.22)', ART_LINE = 'rgba(225,232,255,.8)';
  const artStroke = (lw = 3) => { ctx.strokeStyle = ART_LINE; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
  const artShape = d => { const p = P2(d); ctx.fillStyle = ART_FILL; ctx.fill(p); artStroke(); ctx.stroke(p); };
  const CONS = {
    dipper: {
      name: 'the Big Dipper', short: 'Big Dipper', ask: 'the Big Dipper', hint: 'It looks like a giant spoon.',
      fact: "The Big Dipper looks like a giant ladle, and it's part of the Great Bear!",
      pts: [[-200, -40], [-130, -72], [-62, -60], [0, -28], [12, 46], [128, 64], [140, -30]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
      pic() {
        // a soup ladle: the bowl, then a long curved handle
        artShape('M-8,-40 C-14,40 4,92 60,96 C120,100 150,70 154,-40 C110,-50 30,-50 -8,-40 Z');
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ellipse(70, -36, 74, 10);
        const h = P2('M-4,-36 C-50,-70 -120,-90 -214,-44');
        ctx.strokeStyle = ART_LINE; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.stroke(h);
        ctx.strokeStyle = 'rgba(160,180,255,.55)'; ctx.lineWidth = 16; ctx.stroke(h);
        inkCircle(-214, -44, 9, 'rgba(160,180,255,.55)', 3, ART_LINE);
      },
    },
    orion: {
      name: 'Orion', short: 'Orion', hint: 'Look for the three stars in a row.',
      fact: 'Orion the hunter has three stars in a row for his belt!',
      pts: [[-4, -150], [-72, -100], [62, -90], [-26, 6], [0, -2], [26, -10], [-62, 116], [76, 106]],
      edges: [[0, 1], [0, 2], [1, 3], [2, 5], [3, 4], [4, 5], [3, 6], [5, 7]],
      pic() {
        // raised club arm, shield arm, tunic, legs, head
        artStroke(14); ctx.strokeStyle = 'rgba(160,180,255,.5)';
        ctx.beginPath(); ctx.moveTo(-72, -100); ctx.lineTo(-110, -146); ctx.lineTo(-100, -176); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(62, -90); ctx.lineTo(128, -84); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-40, 60); ctx.lineTo(-62, 116); ctx.moveTo(48, 54); ctx.lineTo(76, 106); ctx.stroke();
        artShape('M-108,-172 C-116,-192 -88,-206 -82,-188 L-94,-156 Z');
        artShape('M-80,-104 C-40,-120 40,-112 70,-96 L40,-8 C70,40 80,70 76,74 L-58,76 C-60,50 -50,20 -40,6 Z');
        ctx.fillStyle = 'rgba(255,230,160,.45)'; ctx.save(); ctx.translate(0, -2); ctx.rotate(-0.3); ctx.fillRect(-46, -8, 92, 16); ctx.restore();
        artShape('M128,-128 C162,-118 166,-46 128,-34 C112,-60 112,-104 128,-128 Z');
        inkCircle(-4, -152, 24, ART_FILL, 3, ART_LINE);
      },
    },
    cassiopeia: {
      name: 'Cassiopeia', short: 'Cassiopeia', hint: 'It makes a big W.',
      fact: 'Cassiopeia was a queen sitting on her chair, and her stars make a W shape!',
      pts: [[-160, -50], [-80, 40], [0, -16], [80, 50], [160, -56]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
      pic() {
        // a queen's throne: tall arched back, seat, legs, and a little crown on top
        artShape('M-120,40 L-120,-90 C-120,-150 120,-150 120,-90 L120,40 Z');
        artShape('M-176,30 L176,30 L160,70 L-160,70 Z');
        artStroke(10); ctx.strokeStyle = 'rgba(160,180,255,.5)';
        ctx.beginPath(); ctx.moveTo(-140, 70); ctx.lineTo(-146, 128); ctx.moveTo(140, 70); ctx.lineTo(146, 128); ctx.stroke();
        artShape('M-34,-138 L-40,-176 L-18,-158 L0,-186 L18,-158 L40,-176 L34,-138 Z');
      },
    },
    cygnus: {
      name: 'Cygnus the Swan', short: 'Cygnus', hint: 'It looks like a big cross.',
      fact: 'Cygnus the swan is also called the Northern Cross, because its stars make a cross!',
      pts: [[0, -146], [0, -40], [4, 44], [10, 130], [-84, -8], [-168, 34], [86, -56], [172, -44]],
      edges: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [1, 6], [6, 7]],
      pic() {
        // a swan flying down the sky: wings out wide, long neck, head at the bottom
        artShape('M-14,-40 C-60,-60 -150,-10 -186,40 C-140,30 -90,30 -14,10 Z');
        artShape('M14,-40 C70,-90 160,-70 190,-46 C140,-20 90,-6 14,10 Z');
        artShape('M0,-160 C-26,-150 -30,-120 -24,-96 C-34,-40 -20,20 0,30 C20,20 34,-40 24,-96 C30,-120 26,-150 0,-160 Z');
        ctx.strokeStyle = ART_LINE; ctx.lineWidth = 15; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(-6, 80, 10, 122); ctx.stroke();
        ctx.strokeStyle = 'rgba(160,180,255,.6)'; ctx.lineWidth = 9; ctx.stroke();
        inkEllipse(10, 132, 15, 12, 0.3, ART_FILL, 3, ART_LINE);
        ink(P2('M6,142 L14,166 L22,140 Z'), 'rgba(255,190,110,.75)', 2, ART_LINE);
      },
    },
    leo: {
      name: 'Leo the Lion', short: 'Leo', hint: 'Look for a backwards question mark.',
      fact: 'Leo the lion has a backwards question mark of stars for his head and mane!',
      pts: [[-84, 80], [-96, 20], [-74, -36], [-58, -92], [-96, -128], [-142, -106], [62, -40], [164, 12], [68, 24]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 8], [8, 0], [6, 8]],
      pic() {
        // a resting lion: body, legs, tail with a tuft, then a big round mane and face
        artShape('M-70,-30 C0,-60 120,-50 164,0 C180,30 160,60 130,60 L-60,80 C-100,70 -100,0 -70,-30 Z');
        artStroke(12); ctx.strokeStyle = 'rgba(160,180,255,.5)';
        ctx.beginPath(); ctx.moveTo(-60, 70); ctx.lineTo(-56, 116); ctx.moveTo(-20, 74); ctx.lineTo(-18, 118); ctx.moveTo(110, 60); ctx.lineTo(112, 112); ctx.moveTo(140, 56); ctx.lineTo(146, 108); ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = ART_LINE; ctx.beginPath(); ctx.moveTo(166, 10); ctx.quadraticCurveTo(210, 0, 204, -44); ctx.stroke();
        inkCircle(204, -50, 9, 'rgba(255,200,120,.5)', 2, ART_LINE);
        let m = ''; for (let i = 0; i <= 14; i++) { const a = (i / 14) * TAU, r = i % 2 ? 66 : 82; m += `${i ? 'L' : 'M'}${-90 + Math.cos(a) * r},${-62 + Math.sin(a) * r} `; }
        ctx.fillStyle = 'rgba(255,200,120,.28)'; ctx.fill(P2(m + 'Z')); artStroke(); ctx.stroke(P2(m + 'Z'));
        inkCircle(-90, -62, 46, ART_FILL, 3, ART_LINE);
        ctx.fillStyle = ART_LINE; circle(-106, -70, 4); circle(-74, -70, 4); ellipse(-90, -52, 7, 5);
      },
    },
  };
  const ALL = Object.keys(CONS);

  // a constellation as a small shape (for the name check): lines, then stars
  const miniShape = (c, cx, cy, k, lit = 1) => {
    ctx.strokeStyle = `rgba(255,246,190,${0.75 * lit})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const [a, b] of c.edges) { ctx.beginPath(); ctx.moveTo(cx + c.pts[a][0] * k, cy + c.pts[a][1] * k); ctx.lineTo(cx + c.pts[b][0] * k, cy + c.pts[b][1] * k); ctx.stroke(); }
    for (const [x, y] of c.pts) { glow(cx + x * k, cy + y * k, 14, '255,240,160', 0.6 * lit); vecStar(cx + x * k, cy + y * k, 7, '#ffe14a', 1); }
  };

  // ------------------------------------------------------------------ Aubrey on her shooting star
  const AS = 0.46;                                   // her sprite scale
  // where her net hoop is, from her body centre, for the way she faces
  const netPos = g => [g.x + g.facing * 58, g.y - 16];
  const drawRider = g => {
    const f = g.facing, feet = g.y + 40, sp = Math.hypot(g.vx, g.vy);
    // the shooting star's sparkly tail streams out behind her
    const tx = sp > 30 ? -g.vx / sp : -f, ty = sp > 30 ? -g.vy / sp : 0.25, L = 50 + Math.min(90, sp * 0.3);
    const gr = ctx.createLinearGradient(g.x, feet, g.x + tx * L, feet + ty * L);
    gr.addColorStop(0, 'rgba(255,240,170,.9)'); gr.addColorStop(0.5, 'rgba(255,150,220,.5)'); gr.addColorStop(1, 'rgba(160,140,255,0)');
    ctx.strokeStyle = gr; ctx.lineCap = 'round';
    for (const [o, w] of [[0, 16], [7, 6], [-7, 6]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(g.x - ty * o, feet + tx * o); ctx.lineTo(g.x + tx * L - ty * o * 1.6, feet + ty * L + tx * o * 1.6); ctx.stroke(); }
    for (let i = 0; i < 5; i++) { const k = ((S.t * 1.7 + i / 5) % 1); star(g.x + tx * L * k + Math.sin(i * 7 + S.t * 3) * 8, feet + ty * L * k + Math.cos(i * 5) * 8, 4 * (1 - k) + 1, '#fff8d0', 4); }
    glow(g.x, feet, 44, '255,240,170', 0.7);
    ctx.save(); ctx.translate(g.x, feet + 4); ctx.rotate(S.t * 1.5); vecStar(0, 0, 22, '#ffe14a', 2); ctx.restore();
    face(g.x, feet + 5, 0.55, 'happy');
    // Aubrey, reaching out with her star net
    const tilt = clamp(g.vx / 900, -0.18, 0.18);
    ctx.save(); ctx.translate(g.x, feet); ctx.rotate(tilt); ctx.translate(-g.x, -feet);
    const [nx, ny] = [g.x + f * 58, g.y - 16];
    // the handle, from her hand to the hoop
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(g.x + f * 20, g.y - 4); ctx.lineTo(nx - f * 22, ny + 4); ctx.stroke();
    ctx.strokeStyle = '#c98a56'; ctx.lineWidth = 3.5; ctx.stroke();
    drawAubrey(g.x, feet, 'cast', f, 0, AS);
    // the net: a mesh bag hanging off a pink hoop
    ctx.save();
    const bag = P2(`M${nx - 22},${ny} C${nx - 20},${ny + 30} ${nx + 6},${ny + 44} ${nx + 4 * f},${ny + 46} C${nx + 14},${ny + 36} ${nx + 22},${ny + 24} ${nx + 22},${ny} Z`);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill(bag); ctx.clip(bag);
    ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.2;
    for (let i = -40; i < 60; i += 8) { ctx.beginPath(); ctx.moveTo(nx - 30 + i, ny - 4); ctx.lineTo(nx - 30 + i + 40, ny + 50); ctx.moveTo(nx + 30 - i, ny - 4); ctx.lineTo(nx + 30 - i - 40, ny + 50); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; ctx.stroke(bag);
    inkEllipse(nx, ny, 23, 7, 0, null, 4.5, OL);
    inkEllipse(nx, ny, 23, 7, 0, null, 3, '#ff6fb5');
    ctx.restore();
  };
  const drawFallen = (s, t) => {
    const sl = s.sleepy > 0.5, r = 14 + Math.sin(t * 6 + s.ph) * 1.2;
    if (s.dart > 0) for (let i = 1; i <= 4; i++) glow(s.x - s.vx * i * 0.02, s.y - s.vy * i * 0.02, 12 - i * 2, '255,230,170', 0.35);
    glow(s.x, s.y, 34, '255,240,160', 0.5 + 0.25 * Math.sin(t * 5 + s.ph));
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.sin(t * 4 + s.ph) * 0.25 + (s.dart > 0 ? s.vx * 0.002 : 0));
    vecStar(0, 0, r, '#ffe14a', 1.5); face(0, 2, 0.48, sl ? 'sleepy' : s.dart > 0 ? 'wow' : 'happy');
    ctx.restore();
    if (sl) { text('z', s.x + 14, s.y - 18 - (t * 10 % 8), 13, 'rgba(230,235,255,.85)', 'center', 800); }
  };
  // a soft grumpy rain cloud that tickles the star out of her net
  const drawCloud = c => {
    const puffs = [[-30, 6, 22], [-10, -10, 26], [16, -12, 22], [34, 4, 18], [0, 10, 22]];
    ctx.strokeStyle = 'rgba(40,30,80,.75)'; ctx.lineWidth = 5;
    for (const [dx, dy, r] of puffs) { ctx.beginPath(); ctx.arc(c.x + dx, c.y + dy, r, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#8f8ab8'; for (const [dx, dy, r] of puffs) circle(c.x + dx, c.y + dy, r);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(c.x - 10, c.y - 16, 16, 6);
    ctx.fillStyle = '#3d2c4a'; circle(c.x - 10, c.y + 2, 2.6); circle(c.x + 10, c.y + 2, 2.6);
    ctx.strokeStyle = '#3d2c4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y + 14, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,200,255,.7)'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const k = (S.t * 1.5 + i / 4) % 1; ctx.beginPath(); ctx.moveTo(c.x - 24 + i * 16, c.y + 28 + k * 22); ctx.lineTo(c.x - 26 + i * 16, c.y + 34 + k * 22); ctx.stroke(); }
  };

  // ------------------------------------------------------------------ the game
  const BOX = { x0: 50, x1: 910, y0: 92, y1: 440 };
  const QCARD = { w: 250, h: 230, y: 92 };
  const qcardX = i => W / 2 - (3 * QCARD.w + 2 * 24) / 2 + i * (QCARD.w + 24);
  MG.starcatcher = {
    kind: 'action', title: () => 'Star Catcher', icon: () => '🌠',
    how: () => 'Fly your shooting star with the arrow keys or the mouse. Swoop to catch the runaway stars in your net, and carry each one back to its glowing spot!',
    init(g) {
      const set = g.tier === 1 ? shuffle(['dipper', 'orion', 'cassiopeia']) : shuffle(ALL).slice(0, 3);
      Object.assign(g, {
        set, round: 0, rounds: 3, state: 'chase', x: 150, y: 380, vx: 0, vy: 0, facing: 1, usePointer: false,
        catchScores: [], nameScores: [], drops: 0, bump: 0, st: 0,
        n: [3, 4, 5][g.tier - 1],
        P: { wander: [55, 75, 95][g.tier - 1], flee: [110, 140, 170][g.tier - 1], dart: [220, 280, 340][g.tier - 1], cool: [1.6, 1.1, 0.8][g.tier - 1], hide: g.tier === 3 },
      });
      this.setup(g);
    },
    start(g) { speak(g.say); },
    setup(g) {
      const c = CONS[g.set[g.round]];
      const fall = shuffle(c.pts.map((_, i) => i)).slice(0, Math.min(g.n, c.pts.length));
      g.spots = c.pts.map(([u, v], i) => ({ x: SC_X + u, y: SC_Y + v, empty: fall.includes(i), pop: 0 }));
      // the runaway stars burst out of their spots and scatter
      g.stars = fall.map(i => { const a = rand(0, TAU); return { x: g.spots[i].x, y: g.spots[i].y, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, tx: rand(BOX.x0, BOX.x1), ty: rand(BOX.y0, BOX.y1), dart: 0.6, cool: 0, age: 0, sleepy: 0, ph: rand(0, 6), state: 'free' }; });
      g.carry = null; g.flying = []; g.rt = 0; g.st = 0; g.state = 'chase';
      g.clouds = Array.from({ length: [0, 1, 2][g.tier - 1] }, (_, i) => ({ x: i ? 900 : 60, y: i ? 160 : 400, vx: (i ? -1 : 1) * rand(38, 52), ph: rand(0, 6) }));
      g.say = `Catch the runaway stars and put them back in ${c.name}!`;
      if (g.phase === 'play') { speak(g.say); SFX.sparkle(); }
    },
    fly(g, dt, tx, ty) {
      const sp = 340;
      let kx = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ky = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      let wx = 0, wy = 0;
      if (kx || ky) { const l = Math.hypot(kx, ky); wx = kx / l * sp; wy = ky / l * sp; g.usePointer = false; }
      else if (pointerMoved(g) || g.usePointer) {
        // steer so the net (not her middle) goes to the pointer
        const px = tx ?? pointer.x, py = ty ?? pointer.y;
        wx = clamp((px - g.facing * 58 - g.x) * 4, -sp, sp); wy = clamp((py + 16 - g.y) * 4, -sp, sp);
        if (Math.abs(px - g.x) > 70) g.facing = Math.sign(px - g.x);
      }
      // floaty: velocity eases toward what she wants
      const k = Math.min(1, dt * 3.2);
      g.vx = lerp(g.vx, wx, k); g.vy = lerp(g.vy, wy, k);
      g.x = clamp(g.x + g.vx * dt, 70, W - 70); g.y = clamp(g.y + g.vy * dt, 96, 470);
      if (!g.usePointer && Math.abs(g.vx) > 40) g.facing = Math.sign(g.vx);
    },
    update(g, dt, id) {
      g.bump = Math.max(0, g.bump - dt);
      for (const s of g.spots || []) s.pop = Math.max(0, s.pop - dt);
      if (g.state === 'chase') this.chase(g, dt);
      else if (g.state === 'shine') {
        g.st += dt; this.fly(g, dt * 0.3);
        if ((g.st > 2.2 && (id === 'next' || pressed[' '] || pressed.enter)) || g.st > 9) {
          g.round++;
          if (g.round < g.rounds) this.setup(g); else this.quizStart(g);
        }
      } else if (g.state === 'quiz' || g.state === 'qyay') this.quiz(g, dt, id);
      g.progress = g.state.startsWith('q') ? `Name check ${Math.min(g.q + 1, 3)} of 3` : `Sky ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}   ⭐ ${g.spots.filter(s => !s.empty).length - (CONS[g.set[g.round]].pts.length - g.n)}/${g.n}`;
      g.score = (0.65 * g.catchScores.reduce((a, b) => a + b, 0) + 0.35 * g.nameScores.reduce((a, b) => a + b, 0)) / 3;
    },
    chase(g, dt) {
      g.rt += dt;
      this.fly(g, dt);
      const [nx, ny] = netPos(g), P = g.P;
      // the runaway stars: wander like fireflies, and dart away when the net gets close
      for (const s of g.stars) {
        if (s.state !== 'free') continue;
        s.age += dt; s.dart -= dt; s.cool -= dt;
        // stars that have been chased a long time get sleepy and slow, so it's always finishable
        s.sleepy = clamp((s.age - 16) / 14, 0, 0.7);
        const d = Math.hypot(s.x - nx, s.y - ny), flee = P.flee * (1 - s.sleepy);
        if (d < flee && s.cool <= 0 && s.dart <= 0) {
          let ax = s.x - nx, ay = s.y - ny; const l = Math.hypot(ax, ay) || 1;
          // a sideways wiggle makes it sneaky, and keep away from the edges
          const side = (Math.random() < 0.5 ? -1 : 1) * (g.tier === 1 ? 0.3 : 0.7);
          { const ux = ax / l, uy = ay / l; ax = ux - uy * side; ay = uy + ux * side; }
          if (s.x < BOX.x0 + 70) ax = Math.abs(ax); if (s.x > BOX.x1 - 70) ax = -Math.abs(ax);
          if (s.y < BOX.y0 + 60) ay = Math.abs(ay); if (s.y > BOX.y1 - 60) ay = -Math.abs(ay);
          const l2 = Math.hypot(ax, ay) || 1, v = P.dart * (1 - s.sleepy);
          s.vx = ax / l2 * v; s.vy = ay / l2 * v; s.dart = 0.45; s.cool = P.cool + 0.45;
          tone(1100 + Math.random() * 400, 0.08, 'sine', 0.035, 0, 1700);
        }
        if (s.dart <= 0) {
          if (Math.hypot(s.tx - s.x, s.ty - s.y) < 30 || Math.random() < dt * 0.3) { s.tx = rand(BOX.x0, BOX.x1); s.ty = rand(BOX.y0, BOX.y1); }
          const l = Math.hypot(s.tx - s.x, s.ty - s.y) || 1, v = P.wander * (1 - s.sleepy);
          s.vx = lerp(s.vx, (s.tx - s.x) / l * v + Math.sin(g.rt * 3 + s.ph) * 30, Math.min(1, dt * 2));
          s.vy = lerp(s.vy, (s.ty - s.y) / l * v + Math.cos(g.rt * 2.4 + s.ph) * 30, Math.min(1, dt * 2));
        }
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < BOX.x0) { s.x = BOX.x0; s.vx = Math.abs(s.vx); } if (s.x > BOX.x1) { s.x = BOX.x1; s.vx = -Math.abs(s.vx); }
        if (s.y < BOX.y0) { s.y = BOX.y0; s.vy = Math.abs(s.vy); } if (s.y > BOX.y1) { s.y = BOX.y1; s.vy = -Math.abs(s.vy); }
        // swoop! caught in the net
        if (!g.carry && Math.hypot(s.x - nx, s.y - (ny + 14)) < 36) {
          s.state = 'carried'; g.carry = s; SFX.pop(); tone(880, 0.12, 'triangle', 0.06, 0, 1320);
          burst(s.x, s.y, 12, { colors: ['#fff6a8', '#ffe066', '#ffffff'] });
          floatText(s.x, s.y - 26, pick(['Got you!', 'Caught one!', 'Whee!']), '#fff6a8', false, 20);
          g.say = 'Carry the star back to a glowing empty spot!';
        }
      }
      // carrying: it rides in the net; drop it home on arrival, or with space when close
      if (g.carry) {
        const s = g.carry; s.x = nx; s.y = ny + 16;
        const open = g.spots.filter(p => p.empty && !p.claimed);
        let best = null, bd = 1e9;
        for (const p of open) { const d = Math.hypot(p.x - nx, p.y - (ny + 10)); if (d < bd) { bd = d; best = p; } }
        if (best && (bd < 42 || (pressed[' '] && bd < 90))) {
          best.claimed = true; g.flying.push({ s, p: best, t: 0, x0: s.x, y0: s.y });
          s.state = 'home'; g.carry = null;
          g.say = g.stars.some(t => t.state === 'free') ? `Catch the runaway stars and put them back in ${CONS[g.set[g.round]].name}!` : g.say;
        }
        // a grumpy cloud tickles the star out of the net
        for (const c of g.clouds) if (g.carry && g.bump <= 0 && Math.hypot(c.x - g.x, c.y - g.y) < 64) {
          const s2 = g.carry; g.carry = null; s2.state = 'free'; s2.dart = 0.6; s2.cool = 1.2;
          s2.vx = (s2.x - c.x) * 4; s2.vy = -200; g.drops++; g.bump = 1.5; SFX.miss();
          floatText(g.x, g.y - 60, 'Oops! The cloud tickled it!', '#ffd0f0', false, 20);
        }
      }
      for (const c of g.clouds) { c.x += c.vx * dt; c.y += Math.sin(g.rt + c.ph) * 10 * dt; if (c.x < 40 || c.x > W - 40) c.vx *= -1; }
      // stars zipping home into their spots
      for (const f of g.flying) {
        f.t += dt * 3.2; const k = easeOut(Math.min(1, f.t));
        f.s.x = lerp(f.x0, f.p.x, k); f.s.y = lerp(f.y0, f.p.y, k) - Math.sin(k * Math.PI) * 30;
        if (f.t >= 1 && f.p.empty) {
          f.p.empty = false; f.p.pop = 0.6; f.s.state = 'placed'; SFX.sparkle();
          burst(f.p.x, f.p.y, 20, { colors: ['#fff6a8', '#ffe066', '#ffffff'] });
          floatText(f.p.x, f.p.y - 30, pick(['Home!', 'Twinkle!', 'Shine!']), '#fff6a8', false, 22);
        }
      }
      g.flying = g.flying.filter(f => f.t < 1);
      if (!g.spots.some(p => p.empty)) this.complete(g);
    },
    complete(g) {
      const c = CONS[g.set[g.round]];
      // good play: about 4 seconds a star; slower is still fine, just fewer stars
      const par = 3 + 4 * g.n;
      g.catchScores.push(clamp(1 - (g.rt - par) / (par * 2.5), 0.35, 1));
      g.state = 'shine'; g.st = 0; g.carry = null;
      SFX.fanfare(); speak(`You fixed ${c.name}! ${c.fact}`);
      g.say = c.fact;
    },
    quizStart(g) {
      Object.assign(g, { state: 'quiz', q: 0, order: shuffle(g.set.slice()), x: W / 2, y: 430, vx: 0, vy: 0 });
      this.question(g);
    },
    question(g) {
      Object.assign(g, { cards: shuffle(g.set.slice()), tried: [], wrongs: 0, hover: [0, 0, 0], shake: [0, 0, 0], state: 'quiz', st: 0, x: W / 2, y: 440, vx: 0, vy: 0, facing: 1 });
      g.lpx = undefined; g.usePointer = false;
      g.say = `Name check! Which one is ${CONS[g.order[g.q]].ask || CONS[g.order[g.q]].short}?`;
      speak(g.say);
    },
    quiz(g, dt, id) {
      g.st += dt;
      this.fly(g, dt);
      g.shake = g.shake.map(v => Math.max(0, v - dt));
      if (g.state === 'qyay') {
        if (g.st > 2.6) { g.q++; if (g.q >= 3) g.done = true; else this.question(g); }
        return;
      }
      let pick_ = -1;
      if (id?.startsWith('qc:')) pick_ = +id.slice(3);
      for (let i = 0; i < 3; i++) if (pressed[String(i + 1)]) pick_ = i;
      // or fly the net into a card and hold it there
      const [nx, ny] = netPos(g);
      for (let i = 0; i < 3; i++) {
        const inside = nx > qcardX(i) && nx < qcardX(i) + QCARD.w && ny > QCARD.y && ny < QCARD.y + QCARD.h && !g.tried.includes(i);
        g.hover[i] = inside ? g.hover[i] + dt : 0;
        if (g.hover[i] > 0.8) { pick_ = i; g.hover[i] = 0; }
      }
      if (pick_ < 0 || g.tried.includes(pick_)) return;
      const want = g.order[g.q], got = g.cards[pick_];
      if (got === want) {
        g.nameScores.push(tryScore(g.wrongs)); g.state = 'qyay'; g.st = 0; g.right = pick_;
        SFX.hit(); burst(qcardX(pick_) + QCARD.w / 2, QCARD.y + QCARD.h / 2, 26);
        speak(`Yes! That's ${CONS[want].name}!`);
      } else {
        g.wrongs++; g.tried.push(pick_); g.shake[pick_] = 0.45; SFX.miss();
        speak(`That one is ${CONS[got].ask || CONS[got].short}. ${CONS[want].hint}`);
      }
    },
    draw(g) {
      ctx.fillStyle = 'rgba(10,8,40,.34)'; ctx.fillRect(0, 0, W, H);
      if (g.state === 'quiz' || g.state === 'qyay') return this.drawQuiz(g);
      const c = CONS[g.set[g.round]], shine = g.state === 'shine' ? g.st : 0;
      const [nx, ny] = netPos(g);
      // the picture fades in once every star is home
      if (shine > 0.8) {
        ctx.save(); ctx.globalAlpha = clamp((shine - 0.8) / 1.4, 0, 1); ctx.translate(SC_X, SC_Y); c.pic(); ctx.restore();
      }
      // constellation lines: lit between home stars, dashed toward empty spots (the shape outline)
      c.edges.forEach(([a, b], i) => {
        const A = g.spots[a], B = g.spots[b], lit = !A.empty && !B.empty;
        if (shine) {
          const k = clamp(shine * 2.2 - i * 0.18, 0, 1), x2 = lerp(A.x, B.x, k), y2 = lerp(A.y, B.y, k);
          ctx.strokeStyle = `rgba(255,246,190,${0.8 + 0.2 * Math.sin(S.t * 8 + i)})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x2, y2); ctx.stroke();
          if (k > 0 && k < 1) { glow(x2, y2, 22, '255,255,220', 0.9); star(x2, y2, 8, '#fff', 4); }
          return;
        }
        ctx.strokeStyle = lit ? 'rgba(255,246,190,.7)' : 'rgba(200,215,255,.42)'; ctx.lineWidth = lit ? 3.5 : 2.5; ctx.setLineDash(lit ? [] : [7, 8]);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
      });
      // home stars and empty ghost spots
      for (const p of g.spots) {
        if (!p.empty) {
          const pop = 1 + p.pop * 0.8;
          glow(p.x, p.y, 30 * pop + (shine ? 10 : 0), '255,240,160', 0.55);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(S.t * 2 + p.x) * 0.1); ctx.scale(pop, pop);
          vecStar(0, 0, 13, '#ffe14a', 1.4); face(0, 2, 0.45, 'happy'); ctx.restore();
          continue;
        }
        // tier 3: the ghost spot only shows when the net is near
        const near = Math.hypot(p.x - nx, p.y - ny), a = g.P.hide ? clamp(1 - (near - 90) / 90, 0, 1) : 1;
        if (a <= 0) continue;
        const pu = 1 + Math.sin(S.t * 4 + p.x) * 0.1;
        glow(p.x, p.y, 40, '160,200,255', 0.35 * a);
        ctx.strokeStyle = `rgba(220,235,255,${0.85 * a})`; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -S.t * 20;
        ctx.beginPath(); ctx.arc(p.x, p.y, 18 * pu, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.35 * a; vecStar(p.x, p.y, 11, '#dfe8ff', 0); ctx.globalAlpha = 1;
      }
      for (const cl of g.clouds) drawCloud(cl);
      for (const s of g.stars) if (s.state === 'free' || s.state === 'home') drawFallen(s, S.t);
      // a helping arrow from a carried star toward the nearest empty spot (not on tier 3)
      if (g.carry && !g.P.hide) {
        const open = g.spots.filter(p => p.empty && !p.claimed);
        const p = open.sort((a, b) => Math.hypot(a.x - nx, a.y - ny) - Math.hypot(b.x - nx, b.y - ny))[0];
        if (p && Math.hypot(p.x - nx, p.y - ny) > 80) {
          const a = Math.atan2(p.y - ny, p.x - nx), bx = nx + Math.cos(a) * 48, by = ny + 14 + Math.sin(a) * 48;
          ctx.save(); ctx.translate(bx, by); ctx.rotate(a); ctx.globalAlpha = 0.6 + 0.3 * Math.sin(S.t * 6);
          ctx.fillStyle = '#fff6a8'; tri(14, 0, -4, -9, -4, 9); ctx.restore();
        }
      }
      if (g.bump > 0 && Math.floor(g.bump * 10) % 2) ctx.globalAlpha = 0.6;
      drawRider(g);
      ctx.globalAlpha = 1;
      if (g.carry) drawFallen(g.carry, S.t);
      // which constellation this is
      if (!shine) {
        darkPanel(14, 476, 300, 50, 20);
        emoji('✨', 40, 501, 20);
        text(c.name, 60, 501, 20, '#fff6a8', 'left', 800);
        if (g.rt < 4 && g.round === 0 && !g.usePointer) outlined('Arrow keys or mouse to fly!', W / 2, 500, 22, '#fff6a8');
      } else {
        const a = clamp((shine - 1) / 0.6, 0, 1);
        ctx.globalAlpha = a;
        panel(W / 2 - 340, 432, 680, 92, 22);
        outlined(c.name[0].toUpperCase() + c.name.slice(1), W / 2, 456, 28, '#ff6fb5', 'center', '#fff');
        wrap(c.fact, 620, 19).forEach((l, i) => text(l, W / 2, 488 + i * 22, 19, '#5a2a6e', 'center', 600));
        ctx.globalAlpha = 1;
        if (shine > 2.2) button('next', W - 150, 446, 124, 52, 'Next ➜', { color: '#5fb87a', size: 18, key: ' ' });
      }
    },
    drawQuiz(g) {
      panel(W / 2 - 230, 344, 460, 58, 22);
      outlined(`Which one is ${CONS[g.order[Math.min(g.q, 2)]].ask || CONS[g.order[Math.min(g.q, 2)]].short}?`, W / 2, 373, 28, '#ff6fb5', 'center', '#fff');
      for (let i = 0; i < 3; i++) {
        const k = g.cards[i], x = qcardX(i) + (g.shake[i] ? Math.sin(g.shake[i] * 50) * 7 : 0), y = QCARD.y;
        const used = g.tried.includes(i), right = g.state === 'qyay' && g.right === i;
        button(`qc:${i}`, x, y, QCARD.w, QCARD.h, '', { color: right ? '#7a5ad0' : used ? '#4a4060' : '#2c2470', on: g.state === 'quiz' && !used, key: String(i + 1) });
        ctx.save(); ctx.beginPath(); ctx.rect(x + 4, y + 4, QCARD.w - 8, QCARD.h - 8); ctx.clip();
        const s = 0.52, cx = x + QCARD.w / 2, cy = y + QCARD.h / 2 - 4;
        if (right) { ctx.save(); ctx.globalAlpha = clamp(g.st / 0.8, 0, 1); ctx.translate(cx, cy); ctx.scale(s, s); CONS[k].pic(); ctx.restore(); }
        ctx.globalAlpha = used ? 0.35 : 1; miniShape(CONS[k], cx, cy, s); ctx.globalAlpha = 1;
        ctx.restore();
        if (g.hover[i] > 0) { ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x + QCARD.w - 26, y + 26, 14, -Math.PI / 2, -Math.PI / 2 + TAU * g.hover[i] / 0.8); ctx.stroke(); }
        if (right || used) outlined(CONS[k].short, x + QCARD.w / 2, y + QCARD.h - 22, 22, right ? '#fff6a8' : '#d8d0f0');
      }
      drawRider(g);
    },
  };

  restage('shootingstar', {
    games: [['starcatcher', 'stardust', {}], ['starhopscotch', 'crystal', {}]],
    intro: [
      '*:At the top of the hill, a tiny star has fallen and is crying.',
      'N:Boo-hoo! All my star friends tumbled out of the constellations. Now they are zooming around the sky, too giggly to go home!',
      'A:determined:Then I will catch them! I just need something to fly on...',
      'N:Hop on my shooting star, and take this star net. Swoop them up and carry each one back to its glowing spot!',
      'A:excited:Here I come, stars!',
    ],
  });
}
