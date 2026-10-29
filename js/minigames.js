'use strict';
// Minigames. One scene runs them all: instructions -> play -> stars & materials.
// Each type gets (g.tier 1..3) for difficulty and (g.skin) for what things look like.

const MG = {};

function rewardFor(mat, score) {
  const max = { 1: 4, 2: 3, 3: 3 }[MATS[mat].tier];
  return Math.max(1, Math.round(1 + score * (max - 1)));
}
const starsFor = score => (score >= 0.85 ? 3 : score >= 0.5 ? 2 : 1);

SCENES.minigame = {
  // game: { type, mat, skin }, loc: the location (for its backdrop), onDone(score, amount)
  enter({ game, tier, loc, onDone }) {
    const impl = MG[game.type];
    this.g = { type: game.type, skin: game.skin, mat: game.mat, tier, loc, onDone, phase: 'ready', t: 0, done: false, score: 0 };
    this.impl = impl;
    impl.init(this.g);
    this.how = impl.how(this.g);
    speak(`${impl.title(this.g)}. ${this.how}`);
  },
  update(dt) {
    const g = this.g;
    const id = clickedButton();
    if (id === 'say') return speak(g.phase === 'play' && g.say ? g.say : this.how);
    if (g.phase === 'ready') {
      if (id === 'start' || pressed.enter || pressed[' ']) { g.phase = 'play'; SFX.click(); this.impl.start?.(g); }
      return;
    }
    if (g.phase === 'play') {
      g.t += dt;
      this.impl.update(g, dt, id);
      if (DEV && pressed['`']) { g.score = 1; g.done = true; }
      if (g.done) {
        g.score = clamp(g.score, 0, 1);
        g.amount = rewardFor(g.mat, g.score);
        S.mats[g.mat] += g.amount;
        g.phase = 'result';
        SFX.fanfare();
        burst(W / 2, 240, 30);
        const praise = ['Good try!', 'Great job!', 'AMAZING!'][starsFor(g.score) - 1];
        speak(`${praise} You got ${g.amount} ${MATS[g.mat].name}.`);
      }
      return;
    }
    if (id === 'continue' || pressed.enter || pressed[' ']) g.onDone(g.score, g.amount);
  },
  draw() {
    buttons = [];
    const g = this.g;
    drawBackdrop(g.loc.bg);
    ctx.fillStyle = 'rgba(255,250,255,.18)'; ctx.fillRect(0, 0, W, H);
    if (g.phase !== 'ready') this.impl.draw(g);
    // header
    darkPanel(12, 12, 420, 44, 22);
    emoji(this.impl.kind === 'learn' ? '🧠' : '⚡', 34, 34, 20);
    text(this.impl.title(g), 54, 34, 18, '#fff', 'left', 700);
    if (g.phase === 'play' && g.timeLeft != null) {
      darkPanel(W - 132, 12, 120, 44, 22);
      emoji('⏱', W - 108, 34, 20);
      const t = Math.max(0, Math.ceil(g.timeLeft));
      text(`${t}s`, W - 88, 34, 19, t <= 5 ? '#ffb0b0' : '#fff', 'left', 700);
    }
    if (g.phase === 'play' && g.progress) {
      darkPanel(440, 12, 200, 44, 22);
      text(g.progress, 540, 34, 16, '#fff', 'center', 600);
    }
    button('say', W - 196, 10, 54, 48, '', { icon: '🔊', color: '#9a6ae0' });
    // the place's character cheers Aubrey on beside the start and results panels
    if (g.phase !== 'play' && g.loc) drawCritter(g.loc.npc.name, 872, GY + 40, 0.72, -1);

    if (g.phase === 'ready') {
      // long instructions get smaller text and push the button (and the panel) down, so nothing overlaps
      const long = wrap(this.how, 520, 20).length > 3, sz = long ? 18 : 20, lh = long ? 24 : 28, up = long ? 16 : 0;
      const lines = wrap(this.how, long ? 540 : 520, sz);
      const winsY = 266 - up + (lines.length - 1) * lh + lh + 12, btnY = Math.max(378, winsY + 22);
      panel(W / 2 - 300, 100, 600, btnY + 72 - 100, 24);
      emoji(this.impl.icon(g), W / 2, 164 - up, long ? 54 : 64);
      outlined(this.impl.title(g), W / 2, 226 - up, 30, '#ff6fb5', 'center', '#fff');
      lines.forEach((l, i) => text(l, W / 2, 266 - up + i * lh, sz, '#5a2a6e', 'center', 500));
      const m = MATS[g.mat];
      text(`Wins: ${m.icon} ${m.name}  (${TIER_NAMES[m.tier]})`, W / 2, winsY, 16, '#9a7aaa', 'center', 600);
      button('start', W / 2 - 100, btnY, 200, 56, "Let's go!", { color: '#5fb87a', size: 22 });
    }
    if (g.phase === 'result') {
      panel(W / 2 - 240, 120, 480, 290, 24);
      const n = starsFor(g.score);
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = i < n ? 1 : 0.25;
        emoji('⭐', W / 2 - 80 + i * 80, 180 + (i === 1 ? -10 : 0), i === 1 ? 64 : 52);
      }
      ctx.globalAlpha = 1;
      outlined(['Good try!', 'Great job!', 'AMAZING!'][n - 1], W / 2, 250, 34, '#ff6fb5', 'center', '#fff');
      const m = MATS[g.mat];
      text(`You got ${g.amount} ${m.name}!`, W / 2, 294, 21, '#5a2a6e', 'center', 600);
      for (let i = 0; i < g.amount; i++) emoji(m.icon, W / 2 - (g.amount - 1) * 26 + i * 52, 334, 40);
      button('continue', W / 2 - 100, 370, 200, 54, 'Continue', { color: '#9a6ae0', size: 20 });
    }
    drawFx(false);
  },
};

// ===========================================================================
// ACTION GAMES
// ===========================================================================
function pointerMoved(g) {
  const moved = g.lpx !== undefined && (Math.abs(pointer.x - g.lpx) > 0.5 || Math.abs(pointer.y - g.lpy) > 0.5);
  g.lpx = pointer.x; g.lpy = pointer.y;
  if (moved) g.usePointer = true;
  return g.usePointer;
}
function glowEmoji(ch, x, y, size, glow = 'rgba(255,255,255,.6)') {
  const gr = ctx.createRadialGradient(x, y, 2, x, y, size * 0.75);
  gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr; ctx.fillRect(x - size, y - size, size * 2, size * 2);
  emoji(ch, x, y, size);
}

// --- catch: move Aubrey's basket to catch the good things, dodge the bad ---------------
MG.catch = {
  kind: 'action', title: g => `Catch the ${g.skin.what}!`, icon: g => g.skin.good[0],
  how: g => `Move with the arrow keys or the mouse. Catch the ${g.skin.what}, but not the ${g.skin.bad[0]}!`,
  init(g) { Object.assign(g, { x: W / 2, items: [], spawnT: 0, timeLeft: 22, caught: 0, bad: 0, good: 0, wob: 0, facing: 1 }); },
  update(g, dt) {
    g.timeLeft -= dt; g.wob = Math.max(0, g.wob - dt);
    const before = g.x;
    if (goLeft()) g.x -= 460 * dt;
    if (goRight()) g.x += 460 * dt;
    if (pointerMoved(g) && !goLeft() && !goRight()) g.x = lerp(g.x, pointer.x, Math.min(1, dt * 12));
    g.x = clamp(g.x, 60, W - 60);
    g.moving = Math.abs(g.x - before) > 0.5;
    if (g.moving) g.facing = Math.sign(g.x - before);
    g.spawnT -= dt;
    if (g.spawnT <= 0 && g.timeLeft > 1.2) {
      g.spawnT = 0.85 - g.tier * 0.12;
      const bad = Math.random() < 0.16 + g.tier * 0.07;
      if (!bad) g.good++;
      g.items.push({ x: rand(60, W - 60), y: 70, bad, ch: pick(bad ? g.skin.bad : g.skin.good), vy: 140 + g.tier * 45 + rand(0, 40), spin: rand(-2, 2) });
    }
    for (const it of g.items) { it.y += it.vy * dt; it.x += Math.sin(it.y / 40) * 30 * dt; }
    for (const it of g.items) {
      if (it.gone || it.y < 380 || it.y > 440 || Math.abs(it.x - g.x) > 55) continue;
      it.gone = true;
      if (it.bad) { g.bad++; g.wob = 0.5; SFX.miss(); floatText(g.x, 330, 'Oops!', '#ffb0c4'); }
      else { g.caught++; SFX.pick(); burst(it.x, 400, 6, { spread: 60, up: 40 }); }
    }
    g.items = g.items.filter(it => !it.gone && it.y < H + 40);
    g.progress = `Caught: ${g.caught}`;
    g.score = (g.caught - g.bad * 0.5) / Math.max(1, g.good * 0.8);
    if (g.timeLeft <= 0) g.done = true;
  },
  draw(g) {
    for (const it of g.items) glowEmoji(it.ch, it.x, it.y, 44, it.bad ? 'rgba(255,120,120,.4)' : 'rgba(255,255,255,.6)');
    const frame = g.moving ? `run${1 + (Math.floor(g.t * 11) % 5)}` : 'idle_front';
    ctx.save(); ctx.translate(Math.sin(g.wob * 40) * 6, 0);
    drawAubrey(g.x, GY + 40, frame, g.facing, 0, 0.62);
    emoji('🧺', g.x, 420, 64);
    ctx.restore();
  },
};

// --- maze: walk Aubrey through a giant hedge maze, picking up petals on the way to the sunflower ---
// walls are a bitmask per cell
const MZ_N = 1, MZ_E = 2, MZ_S = 4, MZ_W = 8;
const MZ_DIRS = [[MZ_N, 0, -1, MZ_S], [MZ_E, 1, 0, MZ_W], [MZ_S, 0, 1, MZ_N], [MZ_W, -1, 0, MZ_E]];
const MZ_PETAL_COLS = { '🌸': ['#ffb3d6', '#ff7fb8'], '🌺': ['#ff8a8a', '#e8455f'], '🌼': ['#ffe36b', '#ffb347'] };
// path of many circles (one sub-path each) so a whole hedge strokes/fills as a single mass
function mzCircles(list, dy = 0, k = 1) {
  ctx.beginPath();
  for (const [x, y, r] of list) { ctx.moveTo(x + r * k, y + dy); ctx.arc(x, y + dy, r * k, 0, TAU); }
}
// a round clipped topiary ball in a terracotta pot (garden border decoration)
function mzTopiary(x, y, s) {
  inkRect(x - 11 * s, y - 16 * s, 22 * s, 16 * s, '#d9774a', 2, 3 * s);
  ctx.fillStyle = '#b85c36'; ctx.fillRect(x - 11 * s, y - 16 * s, 22 * s, 4 * s);
  ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 16 * s); ctx.lineTo(x, y - 26 * s); ctx.stroke();
  inkCircle(x, y - 38 * s, 15 * s, '#4fae4f', 2.5);
  const gr = ctx.createRadialGradient(x - 5 * s, y - 44 * s, 2, x, y - 38 * s, 15 * s);
  gr.addColorStop(0, '#9be07a'); gr.addColorStop(1, '#3a8f45');
  ctx.fillStyle = gr; circle(x, y - 38 * s, 15 * s);
  ctx.fillStyle = '#ff7fb8'; circle(x + 6 * s, y - 33 * s, 2.5 * s); circle(x - 7 * s, y - 40 * s, 2.5 * s);
}
// paint the lawn, the gravel floor and the leafy hedges once into an offscreen canvas
function mzPaintStatic(g) {
  const { cell, ox, oy, cols, rows } = g, t = cell * 0.4, d = cell * 0.17, R = rng(cols * 97 + rows);
  const c = document.createElement('canvas');
  c.width = W * DPR; c.height = H * DPR;
  const cx = c.getContext('2d'); cx.scale(DPR, DPR); cx.lineJoin = 'round'; cx.lineCap = 'round';
  const screen = ctx; ctx = cx;
  try {
    const mw = cols * cell, mh = rows * cell, top = oy - 26;
    // mown lawn with stripes and a ragged grassy top edge
    ctx.fillStyle = '#8fd16a'; ctx.fillRect(0, top, W, H - top);
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    for (let x = 0; x < W; x += 64) ctx.fillRect(x, top, 32, H - top);
    grassBlades(0, W, top + 2, R, ['#7cc45a', '#9ad874', '#6bb04c'], 5, 12, 0.5);
    // a gravel path leading in to the entrance
    const ey = oy + cell / 2;
    rrect(-10, ey - cell * 0.32, ox + 10, cell * 0.64, 10, '#ecdcae', 'rgba(91,63,115,.35)', 2);
    // stone curb + gravel floor
    rrect(ox - 16, oy - 16, mw + 32, mh + 32, 20, '#d9cdb0', OL, 3);
    rrect(ox - 8, oy - 8, mw + 16, mh + 16, 14, '#efe1b6');
    ctx.fillStyle = '#efe1b6'; ctx.fillRect(ox - 18, ey - cell * 0.32 + 2, 14, cell * 0.64 - 4);
    for (let i = 0; i < mw * mh / 90; i++) {
      ctx.fillStyle = ['#d8c48e', '#fff6d8', '#c9b07a', '#e2cf9a'][Math.floor(R() * 4)];
      circle(ox - 6 + R() * (mw + 12), oy - 6 + R() * (mh + 12), 0.8 + R() * 1.6);
    }
    // flat stepping stones down the middle of every cell
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const X = ox + (x + 0.5) * cell + (R() - 0.5) * 3, Y = oy + (y + 0.62) * cell;
      ctx.fillStyle = 'rgba(120,90,60,.18)'; ellipse(X + 1, Y + 2, cell * 0.17, cell * 0.1);
      ctx.fillStyle = '#e4ddd0'; ellipse(X, Y, cell * 0.17, cell * 0.1, R() * 0.4 - 0.2);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(X - cell * 0.04, Y - cell * 0.03, cell * 0.08, cell * 0.035);
    }
    // the goal: a round paved patio ringed with flowers
    const gx = ox + (g.goal.x + 0.5) * cell, gy = oy + (g.goal.y + 0.5) * cell;
    inkEllipse(gx, gy + cell * 0.12, cell * 0.3, cell * 0.2, 0, '#f6e3c0', 1.5);
    for (let i = 0; i < 9; i++) {
      const a = i * TAU / 9;
      tinyFlower(gx + Math.cos(a) * cell * 0.3, gy + cell * 0.12 + Math.sin(a) * cell * 0.2, cell * 0.055, ['#ff8fc8', '#ffe36b', '#c9a6ff'][i % 3]);
    }
    // hedge segments → leafy clumps along each one
    const segs = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const w = g.walls[y][x], X = ox + x * cell, Y = oy + y * cell;
      if (w & MZ_N) segs.push([X, Y, X + cell, Y]);
      if (w & MZ_W && !(x === 0 && y === 0)) segs.push([X, Y, X, Y + cell]);
      if (y === rows - 1 && w & MZ_S) segs.push([X, Y + cell, X + cell, Y + cell]);
      if (x === cols - 1 && w & MZ_E) segs.push([X + cell, Y, X + cell, Y + cell]);
    }
    const clumps = [], n = Math.max(3, Math.round(cell / (t * 0.42)));
    for (const [x1, y1, x2, y2] of segs) for (let i = 0; i <= n; i++) {
      const k = i / n, j = (R() - 0.5) * t * 0.14;
      clumps.push([x1 + (x2 - x1) * k + (y1 === y2 ? 0 : j), y1 + (y2 - y1) * k + (y1 === y2 ? j : 0), t * (0.47 + R() * 0.1)]);
    }
    clumps.sort((a, b) => a[1] - b[1]);
    // soft shadow on the gravel, then outline the whole mass (top + side) before any fill
    ctx.fillStyle = 'rgba(70,90,40,.22)'; mzCircles(clumps.map(([x, y, r]) => [x + d * 0.5, y, r]), d * 1.5); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 5;
    mzCircles(clumps, 0); ctx.stroke(); mzCircles(clumps, d); ctx.stroke();
    // side face: darker, shaded toward the ground
    ctx.fillStyle = '#2f7d3c'; mzCircles(clumps, d); ctx.fill();
    ctx.fillStyle = 'rgba(20,60,30,.35)'; mzCircles(clumps, d + t * 0.18, 0.86); ctx.fill();
    // top face: one fill so the mass reads as one, then per-clump light from the top-left
    ctx.fillStyle = '#48a84c'; mzCircles(clumps, 0); ctx.fill();
    for (const [x, y, r] of clumps) {
      const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r);
      gr.addColorStop(0, 'rgba(190,240,140,.7)'); gr.addColorStop(0.6, 'rgba(110,200,95,.25)'); gr.addColorStop(1, 'rgba(110,200,95,0)');
      ctx.fillStyle = gr; circle(x, y, r * 0.95);
    }
    // little leaves for texture, on top and side
    for (const [x, y, r] of clumps) {
      for (let i = 0; i < 3; i++) {
        const a = R() * TAU, dd = R() * r * 0.7;
        ctx.fillStyle = R() < 0.6 ? 'rgba(220,255,170,.55)' : 'rgba(25,80,35,.35)';
        ellipse(x + Math.cos(a) * dd, y + Math.sin(a) * dd, r * 0.18, r * 0.09, R() * TAU);
      }
      ctx.fillStyle = 'rgba(25,70,35,.35)'; ellipse(x + (R() - 0.5) * r, y + d + r * 0.55, r * 0.12, r * 0.22, R() - 0.5);
    }
    // the odd flower or red berry cluster tucked into the hedge
    for (const [x, y, r] of clumps) {
      const q = R();
      if (q < 0.07) tinyFlower(x + (R() - 0.5) * r, y + (R() - 0.5) * r, r * 0.26, pick(['#ff8fc8', '#ffffff', '#c9a6ff', '#ffe36b']));
      else if (q < 0.11) for (let i = 0; i < 3; i++) inkCircle(x + (i - 1) * r * 0.16, y + (i === 1 ? -r * 0.14 : 0), r * 0.1, '#e8455f', 0.8);
    }
    // the garden beyond the maze: potted topiaries by the entrance, flowers along the edges
    mzTopiary(ox - 44, ey + cell * 0.32 + 44, 0.8);
    for (let y = ey + cell * 0.32 + 84; y < oy + mh; y += 46) { tulip(18 + R() * 10, y, 16, pick(['#ff7fb8', '#ffd84a', '#b98aff'])); tulip(46 + R() * 8, y + 20, 14, pick(['#ff7fb8', '#ff9b5a'])); }
    for (let y = oy + 20; y < oy + mh; y += 46) { tulip(W - 48 - R() * 8, y, 16, pick(['#ff7fb8', '#ffd84a', '#b98aff'])); tulip(W - 20 - R() * 8, y + 20, 14, pick(['#ff7fb8', '#ff9b5a'])); }
    for (let x = 20; x < W; x += 26) tinyFlower(x + R() * 8, oy + mh + 22 + R() * 4, 4.5, pick(['#ff8fc8', '#ffffff', '#ffe36b', '#c9a6ff']));
  } finally { ctx = screen; }
  return c;
}
// a big hand-drawn sunflower that sways gently
function mzSunflower(x, y, s, sway) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
  ctx.strokeStyle = OL; ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3 * s, -14 * s, 0, -30 * s); ctx.stroke();
  ctx.strokeStyle = '#4f9d3c'; ctx.lineWidth = 3.5 * s; ctx.stroke();
  inkEllipse(-8 * s, -12 * s, 8 * s, 3.5 * s, -0.5, '#5fb84a', 1.2 * s); inkEllipse(8 * s, -18 * s, 8 * s, 3.5 * s, 0.5, '#5fb84a', 1.2 * s);
  ctx.translate(0, -34 * s);
  ctx.strokeStyle = OL; ctx.lineWidth = 3 * s;
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 12 * s, Math.sin(a) * 12 * s, 8 * s, 4 * s, a, 0, TAU); ctx.stroke(); }
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.fillStyle = i % 2 ? '#ffc83d' : '#ffdb4d'; ellipse(Math.cos(a) * 12 * s, Math.sin(a) * 12 * s, 8 * s, 4 * s, a); }
  inkCircle(0, 0, 8 * s, '#8a5a2b', 1.2 * s);
  ctx.fillStyle = '#5e3a1a'; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; circle(Math.cos(a) * 4 * s, Math.sin(a) * 4 * s, 1.2 * s); }
  ctx.fillStyle = 'rgba(255,255,255,.4)'; circle(-3 * s, -3 * s, 2.2 * s);
  ctx.restore();
}
// a five-petal blossom pickup
function mzBlossom(x, y, r, [petal, deep], rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = OL; ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5; ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, r * 0.36, a, 0, TAU); ctx.stroke(); }
  for (let i = 0; i < 5; i++) {
    const a = i * TAU / 5, px = Math.cos(a) * r * 0.55, py = Math.sin(a) * r * 0.55;
    ctx.fillStyle = petal; ellipse(px, py, r * 0.5, r * 0.36, a);
    ctx.fillStyle = deep; ellipse(px * 0.55, py * 0.55, r * 0.2, r * 0.13, a);
  }
  inkCircle(0, 0, r * 0.22, '#ffe36b', 1);
  ctx.restore();
}
function mzButterfly(x, y, s, flap, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const w = 0.35 + 0.65 * Math.abs(Math.sin(flap));
  for (const sx of [-1, 1]) {
    inkEllipse(sx * 6 * w, -3, 6 * w, 5, sx * 0.4, col, 1);
    inkEllipse(sx * 5 * w, 4, 4.5 * w, 3.5, -sx * 0.4, lt(col, 0.3), 1);
  }
  inkEllipse(0, 0, 1.6, 6, 0, OL, 0.5);
  ctx.restore();
}
// Fuzzle: a round, fuzzy, big-eyed little monster. (x, gy) = feet; walk = waddle phase (0 standing); munch > 0 chomps
function mzMonster(x, gy, s, facing, walk, munch, t) {
  const body = '#7fd3c4', fur = '#62bfb0', R = 19;
  ctx.fillStyle = 'rgba(40,60,60,.25)'; ellipse(x, gy, 16 * s, 4.5 * s);
  ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
  const bob = walk ? Math.abs(Math.sin(walk)) * 2.5 : Math.sin(t * 2) * 0.8;
  // feet step in turn
  for (const sx of [-1, 1]) inkEllipse(sx * 8, -3 - (walk ? Math.max(0, Math.sin(walk + (sx > 0 ? Math.PI : 0))) * 3 : 0), 6, 4, 0, fur, 1.5);
  ctx.translate(0, -R - 3 - bob); ctx.rotate(walk ? Math.sin(walk) * 0.12 : 0);
  // tiny horns behind the fuzz
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sx * 6, -R + 3); ctx.quadraticCurveTo(sx * 9, -R - 7, sx * 12, -R - 6); ctx.quadraticCurveTo(sx * 11, -R + 1, sx * 12, -R + 5); ctx.closePath();
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#fff2c4'; ctx.fill();
  }
  // fuzzy body: outline every tuft and the core first, then fill them all
  const tufts = [];
  for (let i = 0; i < 18; i++) { const a = i * TAU / 18; tufts.push([Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92, 4.2 + (i % 2) * 1.2]); }
  ctx.strokeStyle = OL; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); for (const [tx, ty, tr] of tufts) { ctx.moveTo(tx + tr, ty); ctx.arc(tx, ty, tr, 0, TAU); } ctx.stroke();
  ctx.fillStyle = fur; ctx.beginPath(); for (const [tx, ty, tr] of tufts) { ctx.moveTo(tx + tr, ty); ctx.arc(tx, ty, tr, 0, TAU); } ctx.fill();
  const gr = ctx.createRadialGradient(-6, -8, 2, 0, 0, R);
  gr.addColorStop(0, '#c4f2e8'); gr.addColorStop(0.6, body); gr.addColorStop(1, fur);
  ctx.fillStyle = gr; circle(0, 0, R);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(0, 7, 11, 8);
  // big eyes looking where it's going, with a slow blink
  const blink = (t % 3.7) < 0.12, lx = facing * 1.5;
  for (const sx of [-1, 1]) {
    if (blink) { ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx * 7, -4, 4.5, 0.2, Math.PI - 0.2); ctx.stroke(); continue; }
    inkEllipse(sx * 7, -5, 6, 7, 0, '#ffffff', 1.2);
    ctx.fillStyle = '#3a2550'; circle(sx * 7 + lx, -4, 3.8);
    ctx.fillStyle = '#ffffff'; circle(sx * 7 + lx - 1.3, -5.6, 1.4); circle(sx * 7 + lx + 1.2, -2.6, 0.7);
  }
  ctx.fillStyle = 'rgba(255,130,170,.55)'; ellipse(-13, 3, 3.5, 2.2); ellipse(13, 3, 3.5, 2.2);
  if (munch > 0) {
    // chomp chomp, with petal crumbs flying
    const open = Math.abs(Math.sin(munch * 18)) * 5 + 1;
    inkEllipse(0, 8, 6, open, 0, '#7a2a4a', 1.2);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#ffb3d6', '#ffe36b', '#ff8a8a'][i]; circle(Math.sin(munch * 9 + i * 2) * 12, 6 - (0.9 - munch) * 22 - i * 3, 2); }
  } else {
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 6, 4.5, 0.25, Math.PI - 0.25); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-1.5, 9.8, 3, 2.4);
  }
  ctx.restore();
}
MG.maze = {
  kind: 'action', title: () => 'The Giant Hedge Maze', icon: () => '🌿',
  how: g => `Find your way to the big sunflower! Pick up the ${g.skin.what} on the way. Use the arrow keys, or hold the mouse where you want to go. Watch out for Fuzzle, the sleepy little monster! It wants the ${g.skin.what} too, so get them first. If it bumps you, you freeze for a moment.`,
  init(g) {
    const [cols, rows] = [[13, 7], [15, 8], [17, 9]][g.tier - 1];
    const cell = Math.min(Math.floor(820 / cols), Math.floor(440 / rows));
    const ox = Math.round(W / 2 - cols * cell / 2), oy = Math.round(74 + (452 - rows * cell) / 2);
    // carve a perfect maze with a depth-first walk
    const walls = Array.from({ length: rows }, () => Array(cols).fill(15)), seen = walls.map(r => r.map(() => false));
    const stack = [[0, 0]]; seen[0][0] = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const next = shuffle(MZ_DIRS).find(([, dx, dy]) => seen[y + dy]?.[x + dx] === false);
      if (!next) { stack.pop(); continue; }
      const [bit, dx, dy, back] = next;
      walls[y][x] &= ~bit; walls[y + dy][x + dx] &= ~back; seen[y + dy][x + dx] = true;
      stack.push([x + dx, y + dy]);
    }
    // a few extra openings so there's more than one way round
    for (let i = 0; i < cols * rows * 0.06; i++) {
      const x = randInt(0, cols - 2), y = randInt(0, rows - 1);
      walls[y][x] &= ~MZ_E; walls[y][x + 1] &= ~MZ_W;
    }
    // the sunflower goes on the cell farthest from the start; petals on far-flung cells
    const dist = walls.map(r => r.map(() => -1)), queue = [[0, 0]]; dist[0][0] = 0;
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const [bit, dx, dy] of MZ_DIRS) if (!(walls[y][x] & bit) && dist[y + dy][x + dx] < 0) { dist[y + dy][x + dx] = dist[y][x] + 1; queue.push([x + dx, y + dy]); }
    }
    const cells = dist.flatMap((r, y) => r.map((d, x) => ({ x, y, d })));
    const goal = cells.reduce((a, b) => (b.d > a.d ? b : a));
    const petals = shuffle(cells.filter(c => c.d > 3 && c !== goal)).slice(0, 4 + g.tier * 2).map(c => ({ x: c.x, y: c.y, got: false, ch: pick(['🌸', '🌺', '🌼']) }));
    // leafy bumps and the odd flower along the hedges, fixed so they don't flicker
    const deco = [];
    for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) {
      if (Math.random() < 0.16) deco.push({ x: ox + x * cell + rand(-4, 4), y: oy + y * cell + rand(-4, 4), c: pick(['#ff8fc8', '#ffe36b', '#ffffff', '#c9a6ff']) });
    }
    Object.assign(g, { cols, rows, cell, ox, oy, walls, goal, petals, deco, cx: 0, cy: 0, px: 0, py: 0, facing: 1, moving: false, got: 0,
      timeLeft: [70, 80, 90][g.tier - 1], reached: false, mzImg: null });
    // Fuzzle the monster: starts far from Aubrey (but not on the sunflower), wanders very slowly
    const maxd = goal.d, far = cells.filter(c => c.d >= maxd * 0.6 && c !== goal && !petals.some(p => p.x === c.x && p.y === c.y));
    const m0 = far.length ? pick(far) : goal;
    g.mon = { x: m0.x, y: m0.y, px: m0.x, py: m0.y, tx: m0.x, ty: m0.y, lx: -1, ly: -1, facing: -1,
      spd: [0.7, 0.85, 1.0][g.tier - 1], munch: 0, wait: 2 };
    g.frozen = 0; g.immune = 0; g.eaten = 0;
    g.say = `Get the ${g.skin.what} before Fuzzle the monster does, then go to the big sunflower! Don't let Fuzzle bump you.`;
  },
  open(g, x, y, bit) { return !(g.walls[y][x] & bit); },
  // Fuzzle waddles one cell at a time toward the nearest flower left (by maze path), eats it if first
  monster(g, dt) {
    const m = g.mon, at = (x, y) => [g.ox + (x + 0.5) * g.cell, g.oy + (y + 0.5) * g.cell];
    m.munch = Math.max(0, m.munch - dt);
    if (m.wait > 0) m.wait -= dt;
    else {
      const s = m.spd * dt;
      m.px += clamp(m.tx - m.px, -s, s); m.py += clamp(m.ty - m.py, -s, s);
      if (m.px === m.tx && m.py === m.ty) {
        m.x = m.tx; m.y = m.ty;
        const p = g.petals.find(q => !q.got && !q.eaten && q.x === m.x && q.y === m.y);
        if (p) {
          p.eaten = true; g.eaten++; m.munch = 0.9; m.wait = 0.9;
          tone(260, 0.09, 'square', 0.06, 0, 160); tone(240, 0.09, 'square', 0.06, 0.18, 150); tone(220, 0.1, 'square', 0.06, 0.36, 140);
          const [x, y] = at(m.x, m.y);
          floatText(x, y - g.cell * 0.6, 'Nom!', '#ffd0f0', false, 26);
        } else {
          // breadth-first search from Fuzzle's cell to the nearest remaining flower
          const prev = new Map([[m.x + ',' + m.y, null]]), q = [[m.x, m.y]];
          let hit = null;
          while (q.length && !hit) {
            const [x, y] = q.shift();
            if (g.petals.some(p2 => !p2.got && !p2.eaten && p2.x === x && p2.y === y)) { hit = [x, y]; break; }
            for (const [bit, dx, dy] of MZ_DIRS) if (!(g.walls[y][x] & bit) && !prev.has((x + dx) + ',' + (y + dy))) { prev.set((x + dx) + ',' + (y + dy), [x, y]); q.push([x + dx, y + dy]); }
          }
          let next = null;
          if (hit) { let k = hit; while (prev.get(k[0] + ',' + k[1]) && (prev.get(k[0] + ',' + k[1])[0] !== m.x || prev.get(k[0] + ',' + k[1])[1] !== m.y)) k = prev.get(k[0] + ',' + k[1]); next = (k[0] === m.x && k[1] === m.y) ? null : k; }
          if (!next) {
            // no flowers left: amble about, not turning straight back unless it's a dead end
            const opts = MZ_DIRS.filter(([bit]) => !(g.walls[m.y][m.x] & bit)).map(([, dx, dy]) => [m.x + dx, m.y + dy]);
            const fwd = opts.filter(([x, y]) => x !== m.lx || y !== m.ly);
            next = pick(fwd.length ? fwd : opts);
          }
          m.lx = m.x; m.ly = m.y; m.tx = next[0]; m.ty = next[1];
          if (m.tx !== m.x) m.facing = m.tx > m.x ? 1 : -1;
        }
      }
    }
    // a bump freezes Aubrey (not once she's home, and not again straight after thawing)
    if (!g.reached && !g.frozen && g.immune <= 0 && Math.hypot(g.px - m.px, g.py - m.py) < 0.6) {
      g.frozen = 3; SFX.miss(); tone(1400, 0.4, 'sine', 0.05, 0, 700);
      const [x, y] = at(g.px, g.py);
      floatText(x, Math.max(96, y - g.cell * 0.9), 'Brrr!', '#bfe9ff', false, 26);
      speak('Brrr! Fuzzle froze you! Wait a moment.');
    }
  },
  update(g, dt) {
    g.timeLeft -= dt;
    // glide toward the current cell, then take the next step
    const spd = 6 * dt;
    // frozen by Fuzzle: no gliding or steering until it thaws, then a short bump-proof spell
    if (g.frozen > 0) { g.frozen -= dt; if (g.frozen <= 0) { g.frozen = 0; g.immune = 2; SFX.sparkle(); } }
    else g.immune = Math.max(0, g.immune - dt);
    if (!g.frozen) { g.px += clamp(g.cx - g.px, -spd, spd); g.py += clamp(g.cy - g.py, -spd, spd); }
    g.moving = !g.frozen && (g.px !== g.cx || g.py !== g.cy);
    if (!g.moving && !g.reached && !g.frozen) {
      let want = [];
      if (goLeft()) want.push(MZ_DIRS[3]); else if (goRight()) want.push(MZ_DIRS[1]);
      if (keys.arrowup || keys.w) want.push(MZ_DIRS[0]); else if (goDown()) want.push(MZ_DIRS[2]);
      if (!want.length && pointer.down) {
        // head for the pointer: try the longer way first, then the other
        const dx = (pointer.x - g.ox) / g.cell - 0.5 - g.cx, dy = (pointer.y - g.oy) / g.cell - 0.5 - g.cy;
        const h = Math.abs(dx) > 0.5 ? MZ_DIRS[dx > 0 ? 1 : 3] : null, v = Math.abs(dy) > 0.5 ? MZ_DIRS[dy > 0 ? 2 : 0] : null;
        want = (Math.abs(dx) >= Math.abs(dy) ? [h, v] : [v, h]).filter(Boolean);
      }
      const step = want.find(([bit]) => this.open(g, g.cx, g.cy, bit));
      if (step) { g.cx += step[1]; g.cy += step[2]; if (step[1]) g.facing = step[1]; }
    }
    for (const p of g.petals) if (!p.got && !p.eaten && p.x === g.cx && p.y === g.cy && Math.hypot(g.px - g.cx, g.py - g.cy) < 0.4) {
      p.got = true; g.got++; SFX.pick();
      burst(g.ox + (p.x + 0.5) * g.cell, g.oy + (p.y + 0.5) * g.cell, 8, { spread: 50, up: 30 });
    }
    this.monster(g, dt);
    if (!g.reached && !g.moving && g.cx === g.goal.x && g.cy === g.goal.y) {
      g.reached = true; g.timeLeft = Math.min(g.timeLeft, 1.2); SFX.hit();
      burst(g.ox + (g.cx + 0.5) * g.cell, g.oy + (g.cy + 0.5) * g.cell, 24);
      floatText(W / 2, 120, 'You made it!', '#fff6a8', false, 30);
    }
    g.progress = `${g.skin.what[0].toUpperCase()}${g.skin.what.slice(1)}: ${g.got} / ${g.petals.length}`;
    g.score = (g.reached ? 0.5 : 0) + 0.5 * g.got / g.petals.length;
    if (g.timeLeft <= 0) g.done = true;
  },
  draw(g) {
    const { cell, ox, oy, cols, rows } = g;
    // lawn, gravel and hedges are static: painted once per maze, then just copied each frame
    if (!g.mzImg) g.mzImg = mzPaintStatic(g);
    ctx.drawImage(g.mzImg, 0, 0, W, H);
    const at = (x, y) => [ox + (x + 0.5) * cell, oy + (y + 0.5) * cell];
    // the goal: glowing patio, swaying sunflower, twinkles
    const [gx, gy] = at(g.goal.x, g.goal.y), pulse = 0.5 + 0.5 * Math.sin(S.t * 3);
    const gr = ctx.createRadialGradient(gx, gy, 2, gx, gy, cell * 0.9);
    gr.addColorStop(0, `rgba(255,240,130,${0.45 + pulse * 0.3})`); gr.addColorStop(1, 'rgba(255,240,130,0)');
    ctx.fillStyle = gr; ctx.fillRect(gx - cell, gy - cell, cell * 2, cell * 2);
    mzSunflower(gx, gy + cell * 0.3, cell / 52, Math.sin(S.t * 1.6) * 0.08);
    for (let i = 0; i < 3; i++) {
      const a = S.t * 0.8 + i * 2.1, tw = Math.max(0, Math.sin(S.t * 4 + i * 2));
      if (tw > 0.1) star(gx + Math.cos(a) * cell * 0.55, gy - cell * 0.2 + Math.sin(a) * cell * 0.4, cell * 0.09 * tw, '#fffbe0', 4);
    }
    // petals: shadow, soft glow, then a bobbing, slowly turning blossom
    for (const p of g.petals) if (!p.got && !p.eaten) {
      const [x, y] = at(p.x, p.y), bob = Math.sin(S.t * 3 + p.x + p.y) * 3, r = cell * 0.27;
      ctx.fillStyle = 'rgba(70,60,30,.2)'; ellipse(x, y + cell * 0.28, r * 0.8 - bob * 0.5, r * 0.25);
      const pg = ctx.createRadialGradient(x, y + bob, 1, x, y + bob, r * 1.7);
      pg.addColorStop(0, 'rgba(255,255,255,.75)'); pg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = pg; circle(x, y + bob, r * 1.7);
      mzBlossom(x, y + bob, r, MZ_PETAL_COLS[p.ch] || MZ_PETAL_COLS['🌸'], S.t * 0.6 + p.x);
    }
    // Aubrey, with a sunny spot under her feet so she's easy to find
    // feet sit on the gravel in the middle of the corridor: lower than this and they land on the hedge row below
    const [ax, ay] = at(g.px, g.py), foot = cell * 0.2;
    const sg = ctx.createRadialGradient(ax, ay + foot, 1, ax, ay + foot, cell * 0.42);
    sg.addColorStop(0, 'rgba(255,250,200,.9)'); sg.addColorStop(1, 'rgba(255,250,200,0)');
    ctx.fillStyle = sg; ellipse(ax, ay + foot, cell * 0.42, cell * 0.18);
    ctx.fillStyle = 'rgba(60,40,80,.25)'; ellipse(ax, ay + foot, cell * 0.18, cell * 0.06);
    const frame = g.moving ? `run${1 + (Math.floor(g.t * 11) % 5)}` : 'idle_front';
    const m = g.mon, [mx, my] = at(m.px, m.py), mStep = m.wait <= 0 && (m.px !== m.tx || m.py !== m.ty);
    const drawMon = () => mzMonster(mx, my + foot, cell / 52, m.facing, mStep ? g.t * 7 : 0, m.munch, g.t);
    if (my <= ay) drawMon();
    // blink while bump-proof after thawing
    if (!(g.immune > 0 && Math.sin(g.t * 30) > 0.3)) drawAubrey(ax, ay + foot, g.frozen ? 'idle_front' : frame, g.facing, 0, cell * 0.95 / IMG.idle_front.height);
    if (g.frozen) {
      // an ice block with swirling snowflakes and a big countdown
      const h = cell * 1.08, w = cell * 0.7, top = ay + foot + cell * 0.04 - h;
      ctx.globalAlpha = 0.55; rrect(ax - w / 2, top, w, h, 10, '#bfe9ff', OL, 2.5); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(ax - w * 0.36, top + 6, w * 0.1, h * 0.55); ctx.fillRect(ax - w * 0.2, top + 6, w * 0.05, h * 0.3);
      for (let i = 0; i < 4; i++) {
        const a = g.t * 2.5 + i * TAU / 4;
        star(ax + Math.cos(a) * cell * 0.55, top + cell * 0.2 + Math.sin(a) * cell * 0.18, cell * 0.08, '#ffffff', 6);
      }
      // countdown beside the ice (above it would hit the header when she's in the top row)
      const side = ax + w / 2 + cell * 0.35 > ox + cols * cell ? -1 : 1;
      outlined(String(Math.ceil(g.frozen)), ax + side * (w / 2 + cell * 0.3), top + h * 0.4, Math.max(26, cell * 0.55), '#bfe9ff');
    }
    if (my > ay) drawMon();
    // a couple of butterflies drifting over the hedges
    for (let i = 0; i < 3; i++) {
      const s = S.t * 0.25 + i * 2.3;
      const bx = ox + (0.5 + 0.45 * Math.sin(s * 1.3 + i)) * cols * cell, by = oy + (0.5 + 0.42 * Math.sin(s * 0.9 + i * 1.7)) * rows * cell;
      mzButterfly(bx, by, cell / 50, S.t * 9 + i, ['#ffb3d6', '#b98aff', '#ffd84a'][i]);
    }
  },
};

// --- pop: tap the good things as they pop up ----------------------------------------
MG.pop = {
  kind: 'action', title: g => `Tap the ${g.skin.what}!`, icon: g => g.skin.good[0],
  how: g => `Tap the ${g.skin.what} before they disappear. Don't tap the ${g.skin.bad[0]}!`,
  init(g) { Object.assign(g, { targets: [], spawnT: 0.3, timeLeft: 20, popped: 0, bad: 0, good: 0 }); },
  update(g, dt) {
    g.timeLeft -= dt; g.spawnT -= dt;
    if (g.spawnT <= 0 && g.timeLeft > 0.8) {
      g.spawnT = 0.72 - g.tier * 0.12;
      const bad = Math.random() < 0.18 + g.tier * 0.06;
      if (!bad) g.good++;
      let x, y, tries = 0;
      do { x = rand(90, W - 90); y = rand(150, 450); tries++; } while (tries < 20 && g.targets.some(t => Math.hypot(t.x - x, t.y - y) < 90));
      g.targets.push({ x, y, bad, ch: pick(bad ? g.skin.bad : g.skin.good), life: 1.9 - g.tier * 0.35, age: 0 });
    }
    for (const t of g.targets) { t.age += dt; }
    if (pointer.clicked) {
      const t = g.targets.find(t => Math.hypot(pointer.x - t.x, pointer.y - t.y) < 42);
      if (t) {
        t.gone = true;
        if (t.bad) { g.bad++; SFX.miss(); floatText(t.x, t.y - 40, 'Oops!', '#ffb0c4'); }
        else { g.popped++; SFX.pop(); burst(t.x, t.y, 10, { spread: 90, up: 30 }); }
      }
    }
    g.targets = g.targets.filter(t => !t.gone && t.age < t.life);
    g.progress = `Got: ${g.popped}`;
    g.score = (g.popped - g.bad * 0.5) / Math.max(1, g.good * 0.8);
    if (g.timeLeft <= 0) g.done = true;
  },
  draw(g) {
    for (const t of g.targets) {
      const k = t.age / t.life, s = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
      ctx.strokeStyle = t.bad ? 'rgba(255,120,120,.7)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(t.x, t.y, 40, -Math.PI / 2, -Math.PI / 2 + (1 - k) * Math.PI * 2); ctx.stroke();
      glowEmoji(t.ch, t.x, t.y, 56 * s, t.bad ? 'rgba(255,120,120,.35)' : 'rgba(255,255,220,.7)');
    }
  },
};

// --- runner: Aubrey runs; jump over obstacles and grab goodies ------------------------
MG.runner = {
  kind: 'action', title: g => `Run & grab ${g.skin.what}!`, icon: () => '🏃‍♀️',
  how: g => `Press Space, the up arrow, or click to jump! Jump over the ${g.skin.obstacles[0]} and grab the ${g.skin.what}.`,
  init(g) { Object.assign(g, { timeLeft: 24, y: 0, vy: 0, things: [], spawnT: 1, got: 0, hits: 0, good: 0, hurt: 0, off: 0 }); },
  update(g, dt) {
    g.timeLeft -= dt; g.hurt = Math.max(0, g.hurt - dt);
    const speed = 250 + g.tier * 55;
    g.off += speed * dt;
    if ((jumpPressed() || pointer.clicked) && g.y === 0) { g.vy = 640; SFX.jump(); }
    if (g.y > 0 || g.vy > 0) { g.y += g.vy * dt; g.vy -= 1800 * dt; if (g.y <= 0) { g.y = 0; g.vy = 0; } }
    g.spawnT -= dt;
    if (g.spawnT <= 0 && g.timeLeft > 1.5) {
      g.spawnT = rand(0.9, 1.5) - g.tier * 0.1;
      // balls bounce, so the jump has to be timed for when they're low
      if (Math.random() < 0.45) { const ch = pick(g.skin.obstacles); g.things.push({ x: W + 40, h: 0, bad: true, ch, bounce: ['⚽', '🏀', '🏐'].includes(ch), ph: rand(0, 6) }); }
      else { g.good++; g.things.push({ x: W + 40, h: pick([20, 90, 140]), bad: false, ch: pick(g.skin.good) }); }
    }
    for (const t of g.things) { t.x -= speed * dt; if (t.bounce) t.h = Math.abs(Math.sin(g.t * 5 + t.ph)) * 45; }
    for (const t of g.things) {
      if (t.gone || Math.abs(t.x - 200) > 36) continue;
      if (t.bad && g.y < t.h + 46 && !t.hit) { t.hit = true; g.hits++; g.hurt = 0.6; SFX.miss(); floatText(200, 300, 'Ouch!', '#ffb0c4'); }
      if (!t.bad && t.h >= g.y - 20 && t.h <= g.y + 120) { t.gone = true; g.got++; SFX.pick(); burst(t.x, GY - t.h - 20, 6, { spread: 60, up: 40 }); }
    }
    g.things = g.things.filter(t => !t.gone && t.x > -60);
    g.progress = `Got: ${g.got}`;
    g.score = g.got / Math.max(1, g.good * 0.8) - g.hits * 0.1;
    if (g.timeLeft <= 0) g.done = true;
  },
  draw(g) {
    // a scrolling backdrop runs past in layers; otherwise just the ground dashes move
    if (BACKDROPS[g.loc?.bg]?.scrolls) drawBackdrop(g.loc.bg, g.off);
    else { ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = -(g.off % 80); x < W; x += 80) ctx.fillRect(x, GY + 14, 40, 5); }
    for (const t of g.things) {
      if (t.bad) { if (t.bounce) { ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(t.x, GY - 2, 20 - t.h * 0.2, 5); } emoji(t.ch, t.x, GY - 22 - t.h, 50); }
      else glowEmoji(t.ch, t.x, GY - t.h - 20, 40);
    }
    ctx.globalAlpha = g.hurt > 0 && Math.sin(g.t * 40) > 0 ? 0.4 : 1;
    drawAubrey(200, GY, g.y > 0 ? 'jump' : `run${1 + (Math.floor(g.t * 12) % 5)}`, 1, g.y, 0.7);
    ctx.globalAlpha = 1;
  },
};

// --- flyer: fly up and down collecting things --------------------------------------------
MG.flyer = {
  kind: 'action', title: g => `Fly & collect ${g.skin.what}!`, icon: g => g.skin.player,
  how: g => `Move up and down with the arrow keys or the mouse. Collect the ${g.skin.what} and dodge the ${g.skin.bad[0]}!`,
  init(g) { Object.assign(g, { timeLeft: 22, y: H / 2, things: [], spawnT: 0.5, got: 0, hits: 0, good: 0, hurt: 0, trail: [] }); },
  update(g, dt) {
    g.timeLeft -= dt; g.hurt = Math.max(0, g.hurt - dt);
    if (keys.arrowup || keys.w) g.y -= 380 * dt;
    if (keys.arrowdown || keys.s) g.y += 380 * dt;
    if (pointerMoved(g) && !keys.arrowup && !keys.arrowdown && !keys.w && !keys.s) g.y = lerp(g.y, pointer.y, Math.min(1, dt * 10));
    g.y = clamp(g.y, 110, H - 50);
    const speed = 230 + g.tier * 55;
    g.spawnT -= dt;
    if (g.spawnT <= 0 && g.timeLeft > 1.2) {
      g.spawnT = 0.62 - g.tier * 0.07;
      const bad = Math.random() < 0.25 + g.tier * 0.05;
      if (!bad) g.good++;
      g.things.push({ x: W + 40, y: rand(120, H - 60), bad, ch: pick(bad ? g.skin.bad : g.skin.good), wob: rand(0, 6) });
    }
    for (const t of g.things) { t.x -= speed * dt; t.y += Math.sin(g.t * 3 + t.wob) * 30 * dt; }
    for (const t of g.things) {
      if (t.gone || Math.hypot(t.x - 190, t.y - g.y) > 44) continue;
      t.gone = true;
      if (t.bad) { g.hits++; g.hurt = 0.6; SFX.miss(); floatText(190, g.y - 50, 'Bonk!', '#ffb0c4'); }
      else { g.got++; SFX.pick(); burst(t.x, t.y, 6, { spread: 60, up: 20 }); }
    }
    g.things = g.things.filter(t => !t.gone && t.x > -60);
    g.trail.push({ x: 160, y: g.y }); if (g.trail.length > 14) g.trail.shift();
    for (const p of g.trail) p.x -= speed * dt * 0.6;
    g.progress = `Got: ${g.got}`;
    g.score = (g.got - g.hits * 0.5) / Math.max(1, g.good * 0.8);
    if (g.timeLeft <= 0) g.done = true;
  },
  draw(g) {
    g.trail.forEach((p, i) => star(p.x, p.y, 2 + i * 0.3, `rgba(255,250,200,${i / g.trail.length})`));
    for (const t of g.things) glowEmoji(t.ch, t.x, t.y, 46, t.bad ? 'rgba(80,80,120,.3)' : 'rgba(255,255,220,.7)');
    ctx.globalAlpha = g.hurt > 0 && Math.sin(g.t * 40) > 0 ? 0.4 : 1;
    ctx.save(); ctx.translate(190, g.y + Math.sin(g.t * 6) * 4); ctx.scale(-1, 1);
    emoji(g.skin.player, 0, 0, 66);
    ctx.restore();
    ctx.globalAlpha = 1;
  },
};

// --- timing: stop the swinging marker in the gold zone ---------------------------------
MG.timing = {
  kind: 'action', title: g => `${g.skin.verb}!`, icon: g => g.skin.icon,
  how: g => `Press Space or click when the marker is in the GOLD zone. ${g.skin.verb} 6 times!`,
  init(g) { Object.assign(g, { round: 0, rounds: 6, total: 0, pos: 0, dir: 1, wait: 0, last: null, fly: 0 }); this.newZone(g); },
  newZone(g) { g.zone = rand(0.25, 0.75); g.width = 0.24 - g.tier * 0.045; g.speed = 0.75 + g.tier * 0.3 + g.round * 0.04; },
  update(g, dt) {
    g.fly = Math.max(0, g.fly - dt);
    if (g.wait > 0) {
      g.wait -= dt;
      if (g.wait <= 0) { g.round++; if (g.round >= g.rounds) { g.done = true; return; } this.newZone(g); }
      return;
    }
    g.pos += g.dir * g.speed * dt;
    if (g.pos > 1) { g.pos = 1; g.dir = -1; } else if (g.pos < 0) { g.pos = 0; g.dir = 1; }
    if (jumpPressed() || pointer.clicked && !inRect({ x: W - 196, y: 10, w: 54, h: 48 })) {
      const d = Math.abs(g.pos - g.zone);
      const pts = d <= g.width / 2 ? 1 : d <= g.width ? 0.5 : 0;
      g.total += pts;
      g.last = pts === 1 ? 'Perfect!' : pts ? 'Close!' : 'Missed!';
      if (pts) { SFX.hit(); g.fly = 1; burst(W / 2, 260, pts === 1 ? 18 : 8); } else SFX.miss();
      g.wait = 0.9;
    }
    g.progress = `${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
    g.score = g.total / g.rounds;
  },
  draw(g) {
    const x0 = 180, w = 600, y = 400;
    const k = g.fly > 0 ? 1 - g.fly : 0;
    glowEmoji(g.skin.icon, W / 2 + k * 260, 250 - Math.sin(k * Math.PI) * 120, 90);
    rrect(x0, y, w, 34, 17, 'rgba(255,255,255,.85)', OL, 3);
    rrect(x0 + (g.zone - g.width) * w, y + 4, g.width * 2 * w, 26, 13, '#ffe9a8');
    rrect(x0 + (g.zone - g.width / 2) * w, y + 4, g.width * w, 26, 13, '#ffc83d');
    const mx = x0 + g.pos * w;
    ctx.fillStyle = '#ff5fa2'; tri(mx - 14, y - 22, mx + 14, y - 22, mx, y + 4);
    ctx.fillStyle = '#ff5fa2'; ctx.fillRect(mx - 2, y, 4, 34);
    if (g.wait > 0 && g.last) outlined(g.last, W / 2, 350, 34, g.last === 'Missed!' ? '#ffb0c4' : '#fff6a8');
  },
};

// --- skip: pull back to throw; a flat, fast throw skips, a steep one plops. Skip through the floating rings ---
const SKIP_WATER = GY - 58, SKIP_BANK = 880, SKIP_HAND = [150, 330], SKIP_G = 900;
function drawSkipStone(x, y, spin) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(spin); ctx.scale(1, 0.62);
  inkCircle(0, 0, 12, '#9aa3ad', 1.4, OL);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-4, -4, 5, 3);
  ctx.restore();
}
MG.skip = {
  kind: 'action', title: () => 'Skip the Stone!', icon: () => '🪨',
  how: () => 'Pull back and let go to throw, like a slingshot! Low and fast skips; too high just goes PLOP. Skip the stone through the glowing rings, but don\'t bonk the ducks! (Keys: up and down to aim, hold Space for power.)',
  init(g) {
    const t = g.tier - 1;
    Object.assign(g, {
      throws: [7, 8, 10][t], throwNo: 0, sets: 3, set: 0, perSet: [2, 3, 3][t], ringR: [36, 31, 28][t], steep: [0.95, 0.85, 0.78][t], preview: [1, 0.45, 0.2][t],
      got: 0, total: 0, phase2: 'aim', wait: 0, ripples: [], skips: 0, best: 0, crossed: 0,
      aimA: 0.12, power: 0.6, charge: 0, charging: false, drag: null, stone: null, ducks: [],
      say: 'Pull back and let go! Low and fast skips best.',
    });
    g.total = g.sets * g.perSet;
    for (let i = 0; i < [0, 1, 2][t]; i++) g.ducks.push({ x: 420 + i * 260, dir: i ? -1 : 1, sp: rand(26, 40), flap: 0, id: ['mallard', 'wood'][i] });
    this.newSet(g);
  },
  start(g) { speak(g.say); },
  newSet(g) {
    // rings spread out along the creek, further away in later sets
    const lo = 300 + g.set * 60, xs = [];
    while (xs.length < g.perSet) { const x = rand(lo, 830); if (xs.every(q => Math.abs(q - x) > 100)) xs.push(x); }
    g.rings = xs.sort((p, q) => p - q).map(x => ({ x, x0: x, ph: rand(0, 6), got: false, pop: 0 }));
  },
  // launch speed from aim angle (up from flat) and power 0..1
  vel(g) { const sp = 420 + g.power * 520; return [Math.cos(g.aimA) * sp, -Math.sin(g.aimA) * sp]; },
  throwStone(g) {
    const [vx, vy] = this.vel(g);
    g.stone = { x: SKIP_HAND[0], y: SKIP_HAND[1], vx, vy, spin: 0 };
    Object.assign(g, { phase2: 'fly', skips: 0, drag: null, charging: false, charge: 0 });
    SFX.jump();
  },
  endThrow(g, msg, col, sink = true) {
    g.best = Math.max(g.best, g.skips);
    g.phase2 = 'end'; g.wait = 1.4; g.sinkX = sink ? g.stone.x : null;
    floatText(W / 2, 150, msg, col, false, 30);
  },
  update(g, dt) {
    for (const r of g.ripples) r.t += dt;
    g.ripples = g.ripples.filter(r => r.t < 1.2);
    for (const r of g.rings) { r.pop = Math.max(0, r.pop - dt); if (g.tier > 1 && !r.got) r.x = r.x0 + Math.sin(S.t * 0.8 + r.ph) * (g.tier === 3 ? 50 : 28); }
    for (const d of g.ducks) {
      // ducks paddle back and forth but never sit on a ring, so every ring can be reached
      d.x += d.dir * d.sp * dt; d.flap = Math.max(0, d.flap - dt);
      if (d.x < 300 || d.x > 840 || g.rings.some(r => !r.got && Math.abs(r.x - d.x) < g.ringR + 44 && Math.sign(r.x - d.x) === d.dir)) d.dir *= -1;
      d.x = clamp(d.x, 300, 840);
    }
    if (g.phase2 === 'aim') {
      // the mouse: press, pull back (left and down), let go
      if (pointer.clicked && !inRect({ x: W - 196, y: 10, w: 54, h: 48 })) g.drag = { x: pointer.x, y: pointer.y };
      if (g.drag) {
        const dx = g.drag.x - pointer.x, dy = pointer.y - g.drag.y, len = Math.hypot(dx, dy);
        if (len > 8) { g.aimA = clamp(Math.atan2(dy, Math.max(dx, 1)), -0.15, 1.1); g.power = clamp(len / 220, 0, 1); }
        if (!pointer.down) { if (len > 20) this.throwStone(g); else g.drag = null; }
      }
      // the keys: up and down aim, hold Space to wind up, let go to throw
      if (keys.arrowup || keys.w) g.aimA = clamp(g.aimA + dt * 0.8, -0.15, 1.1);
      if (keys.arrowdown || keys.s) g.aimA = clamp(g.aimA - dt * 0.8, -0.15, 1.1);
      if (keys[' '] || keys.enter) { g.charging = true; g.charge += dt; g.power = 0.5 - 0.5 * Math.cos(g.charge * 2.6); }
      else if (g.charging) this.throwStone(g);
    } else if (g.phase2 === 'fly') {
      const st = g.stone;
      st.vy += SKIP_G * dt; st.x += st.vx * dt; st.y += st.vy * dt; st.spin += dt * 16;
      if (st.x >= SKIP_BANK) {
        g.crossed++; SFX.fanfare(); burst(SKIP_BANK, SKIP_WATER - 10, 24);
        return this.endThrow(g, g.skips ? `${g.skips} skip${g.skips > 1 ? 's' : ''}, all the way across!` : 'All the way across!', '#fff6a8', false);
      }
      if (st.y >= SKIP_WATER && st.vy > 0) {
        st.y = SKIP_WATER;
        g.ripples.push({ x: st.x, t: 0 });
        // landing right on a duck bonks it
        const bonk = g.ducks.find(d => Math.abs(st.x - d.x) < 34);
        if (bonk) { bonk.flap = 1.2; SFX.miss(); speak('Quack! Mind the ducks!'); return this.endThrow(g, 'Quack! Mind the ducks!', '#ffb0c4'); }
        const ratio = st.vy / st.vx;
        if (ratio > g.steep || st.vx < 150) {
          SFX.miss(); burst(st.x, SKIP_WATER, 8, { colors: ['#ffffff', '#bfe9ff'], spread: 40, up: 70 });
          const msg = g.skips ? `${g.skips} skip${g.skips > 1 ? 's' : ''}!` : ratio > g.steep ? 'Plop! Too high, throw it flatter!' : 'Plop! Throw it harder!';
          return this.endThrow(g, msg, '#ffffff');
        }
        g.skips++;
        st.vy = -st.vy * 0.62; st.vx *= 0.86;
        burst(st.x, SKIP_WATER, 7, { colors: ['#ffffff', '#bfe9ff', '#8fd3ff'], spread: 60, up: 60 });
        tone(480 + g.skips * 60, 0.1, 'sine', 0.12, 0, 820 + g.skips * 70);
        const ring = g.rings.find(r => !r.got && Math.abs(r.x - st.x) < g.ringR);
        if (ring) {
          ring.got = true; ring.pop = 0.8; g.got++; SFX.sparkle(); burst(ring.x, SKIP_WATER - 10, 18, { kind: 'star' });
          floatText(ring.x, SKIP_WATER - 60, 'Ring!', '#fff6a8', false, 26);
        } else floatText(st.x, SKIP_WATER - 40, `${g.skips}`, '#ffffff', false, 18);
      }
    } else if (g.phase2 === 'end') {
      g.wait -= dt;
      if (g.wait <= 0) {
        g.throwNo++;
        if (g.rings.every(r => r.got)) {
          g.set++;
          if (g.set < g.sets) { this.newSet(g); speak(pick(['New rings! Keep skipping!', 'More rings!', 'Here come more rings!'])); }
        }
        if (g.set >= g.sets || g.throwNo >= g.throws) g.done = true;
        else { g.phase2 = 'aim'; g.sinkX = null; g.stone = null; g.drag = null; }
      }
    }
    g.progress = `Rings ${g.got} of ${g.total} · Stones left: ${g.throws - g.throwNo}`;
    g.score = g.got / g.total;
  },
  // where a throw will go, for the dotted guide
  path(g, frac) {
    let [vx, vy] = this.vel(g), x = SKIP_HAND[0], y = SKIP_HAND[1];
    const pts = [], dt = 1 / 60;
    for (let i = 0; i < 200; i++) { vy += SKIP_G * dt; x += vx * dt; y += vy * dt; if (y >= SKIP_WATER) break; pts.push([x, y]); }
    return { pts: pts.slice(0, Math.max(3, Math.round(pts.length * frac))), skip: vy / vx <= g.steep && vx >= 150, land: x };
  },
  draw(g) {
    // banks: Aubrey's on the left, Tilly's on the right
    inkEllipse(40, SKIP_WATER + 18, 150, 44, 0, '#74c25e', 1.5, OL);
    inkEllipse(SKIP_BANK + 90, SKIP_WATER + 18, 140, 40, 0, '#74c25e', 1.5, OL);
    if (g.loc) drawCritter(g.loc.npc.name, SKIP_BANK + 40, SKIP_WATER + 6, 0.5, -1);
    // the rings floating on the creek
    for (const r of g.rings) {
      if (r.got && r.pop <= 0) continue;
      const k = r.got ? 1 + (0.8 - r.pop) * 1.5 : 1, rr = g.ringR * k;
      ctx.globalAlpha = r.got ? r.pop / 0.8 : 1;
      ctx.fillStyle = `rgba(255,240,140,${0.25 + Math.sin(S.t * 4 + r.ph) * 0.1})`; ellipse(r.x, SKIP_WATER + 2, rr, rr * 0.3);
      ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(r.x, SKIP_WATER + 2, rr, rr * 0.3, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = ['#ff7fb5', '#ffd23f', '#7fd8ff'][Math.round(r.x0) % 3]; ctx.lineWidth = 5.5; ctx.stroke();
      if (!r.got) star(r.x + Math.cos(S.t * 2 + r.ph) * rr, SKIP_WATER - 6 + Math.sin(S.t * 2 + r.ph) * 6, 6, '#fff6a8', 4);
      ctx.globalAlpha = 1;
    }
    for (const d of g.ducks) drawDuckSpecies(d.id, d.x - d.dir * 6, SKIP_WATER + 8 - (d.flap > 0 ? Math.abs(Math.sin(d.flap * 12)) * 16 : Math.sin(S.t * 3 + d.x) * 1.5), 0.36, d.dir < 0);
    drawAubrey(110, SKIP_WATER + 8, g.phase2 === 'aim' ? 'idle_front' : 'cast', 1, 0, 0.55);
    for (const r of g.ripples) {
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - r.t / 1.2)})`; ctx.lineWidth = 2.5;
      for (const k of [1, 0.6]) { ctx.beginPath(); ctx.ellipse(r.x, SKIP_WATER + 2, 10 + r.t * 60 * k, (10 + r.t * 60 * k) * 0.28, 0, 0, TAU); ctx.stroke(); }
    }
    if (g.phase2 === 'aim') {
      drawSkipStone(...SKIP_HAND, 0);
      const aiming = g.drag || g.charging;
      if (aiming || g.tier === 1) {
        // the dotted guide: green when it will skip, red when it will plop
        const p = this.path(g, g.preview), col = p.skip ? '#5adc7a' : '#ff6f8a';
        p.pts.forEach(([x, y], i) => { if (i % 4 === 0) { ctx.fillStyle = col; circle(x, y, 4.5); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke(); } });
      }
      // the power bar
      rrect(40, 230, 24, 120, 10, 'rgba(48,24,72,.6)');
      rrect(44, 346 - 112 * g.power, 16, 112 * g.power, 7, mix('#5adc7a', '#ffd23f', g.power));
      if (!aiming) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 4); outlined(g.throwNo ? 'Pull back and let go!' : 'Press, pull back, and let go!', W / 2, 150, 28, '#fff6a8'); ctx.globalAlpha = 1; }
      if (g.drag) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(g.drag.x, g.drag.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke(); ctx.setLineDash([]); }
    }
    if (g.phase2 === 'fly' || (g.phase2 === 'end' && g.sinkX == null && g.stone)) drawSkipStone(g.stone.x, Math.min(g.stone.y, SKIP_WATER), g.stone.spin);
    if (g.phase2 === 'end' && g.sinkX != null) {
      const k = clamp(1 - g.wait / 1.4, 0, 1);
      ctx.globalAlpha = 1 - k; drawSkipStone(g.sinkX, SKIP_WATER + 6 + k * 30, 0); ctx.globalAlpha = 1;
    }
    // stones left
    for (let i = 0; i < g.throws; i++) { ctx.globalAlpha = i < g.throws - g.throwNo ? 1 : 0.25; drawSkipStone(36 + i * 26, 506, 0); }
    ctx.globalAlpha = 1;
  },
};

// --- swim: dive into the creek, collect the stones, and bubble away the giant fish who grab them ---
function drawSwimmer(x, y, facing, t, hurt) {
  const im = IMG[`run${1 + (Math.floor(t * 8) % 5)}`], s = 0.42;
  ctx.save(); ctx.translate(x, y); ctx.scale(facing, 1); ctx.rotate(1.25);
  if (hurt > 0 && Math.sin(t * 40) > 0) ctx.globalAlpha = 0.45;
  ctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
  ctx.restore();
}
MG.swim = {
  kind: 'action', title: () => 'Rescue the Stones!', icon: () => '🐟',
  how: () => 'Swim with the arrow keys or the mouse and grab every stone! Press Space (or click) to blow bubbles. Puffer fish guard some stones (2 bubbles!), some fish carry stones in their mouths, and sneaky fish push stones away from you.',
  init(g) {
    const [nFree, nGuard, nCarry] = [[4, 3, 2], [5, 3, 3], [5, 4, 4]][g.tier - 1];
    // stones all over the creek, not bunched together or right where Aubrey starts
    const spots = [];
    for (let tries = 0; spots.length < nFree + nGuard && tries < 2000; tries++) {
      const bed = Math.random() < 0.45, x = rand(80, W - 80), y = bed ? rand(478, 500) : rand(150, 430);
      if (Math.hypot(x - W / 2, y - 220) > 150 && spots.every(p => Math.hypot(p.x - x, p.y - y) > 110)) spots.push({ x, y, ledge: !bed });
    }
    const stone = (x, y) => ({ x, y, vx: 0, vy: 0, floor: rand(478, 500), rest: true, got: false, lost: false, fish: null, guard: null });
    const stones = spots.map(p => stone(p.x, p.y)), fish = [];
    // the mossy rocks some stones start on; stones can land on them again after a push
    const rocks = spots.filter(p => p.ledge).map(p => ({ x: p.x, y: p.y + 14 }));
    const newFish = (kind, x, y, o = {}) => ({ kind, x, y, dir: 1, target: null, carry: null, bubbled: 0, hp: 1, hurt: 0, wob: rand(0, 6), ch: '🐠', ...o });
    // puffer fish circle the stone they guard, and lunge at Aubrey when she comes close
    shuffle(stones).slice(0, nGuard).forEach(st => { const f = newFish('guard', st.x + 60, st.y - 30, { ch: '🐡', hp: 2, post: st, ang: rand(0, 6) }); st.guard = f; fish.push(f); });
    // patrollers swim back and forth with a stone in their mouth
    for (let i = 0; i < nCarry; i++) {
      const y = 150 + (i + 0.5) * (300 / nCarry), st = stone(0, y), f = newFish('patrol', rand(120, W - 120), y, { ch: '🐟', dir: pick([-1, 1]), hp: g.tier === 3 ? 2 : 1, carry: st });
      st.fish = f; stones.push(st); fish.push(f);
    }
    // pushers play keep-away: they shove the loose stone nearest Aubrey away from her
    for (let i = 0; i < [2, 2, 3][g.tier - 1]; i++) fish.push(newFish('pusher', i % 2 ? W - 60 : 60, rand(200, 400), { ch: '🐟', dir: i % 2 ? -1 : 1 }));
    const weeds = Array.from({ length: 14 }, (_, i) => ({ x: i * 72 + rand(0, 40), h: rand(50, 110), c: pick(['#3fa66a', '#5fbf7a', '#2f8a5a']) }));
    Object.assign(g, { x: W / 2, y: 220, vx: 0, vy: 0, facing: 1, stones, rocks, weeds, fish, shots: [], spawnT: 6, cool: 0, hurt: 0, got: 0, lost: 0,
      timeLeft: [60, 65, 70][g.tier - 1] });
  },
  // a stone she can pick up: not taken, not in a mouth, and not guarded by a puffer that's still around
  takeable: s => !s.got && !s.lost && !s.fish && !(s.guard && !s.guard.bubbled),
  update(g, dt) {
    g.timeLeft -= dt; g.cool -= dt; g.hurt = Math.max(0, g.hurt - dt);
    // swimming: keys push her, the mouse leads her
    const sp = 280;
    let ax = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ay = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
    if (ax || ay) { g.vx = lerp(g.vx, ax * sp, dt * 6); g.vy = lerp(g.vy, ay * sp, dt * 6); }
    else if (pointerMoved(g) || g.usePointer) { g.vx = clamp((pointer.x - g.x) * 4, -sp, sp); g.vy = clamp((pointer.y - g.y) * 4, -sp, sp); }
    else { g.vx *= 1 - dt * 3; g.vy *= 1 - dt * 3; }
    g.x = clamp(g.x + g.vx * dt, 50, W - 50); g.y = clamp(g.y + g.vy * dt, 110, 500);
    if (Math.abs(g.vx) > 20) g.facing = Math.sign(g.vx);
    // bubbles
    const shoot = pressed[' '] || pressed.enter || (pointer.clicked && !inRect({ x: W - 196, y: 10, w: 54, h: 48 }));
    if (shoot && g.cool <= 0) { g.cool = 0.3; g.shots.push({ x: g.x + g.facing * 40, y: g.y - 6, vx: g.facing * 460, life: 1.3 }); SFX.pop(); }
    for (const b of g.shots) { b.x += b.vx * dt; b.y -= 20 * dt; b.life -= dt; }
    // thieves swim in now and then for a loose stone and carry it off
    g.spawnT -= dt;
    const free = () => g.stones.filter(s => this.takeable(s) && !g.fish.some(f => f.target === s));
    if (g.spawnT <= 0 && g.timeLeft > 3 && free().length) {
      g.spawnT = [6, 5, 4][g.tier - 1] + rand(-1, 1);
      const side = Math.random() < 0.5 ? -1 : 1;
      g.fish.push({ kind: 'thief', x: side < 0 ? -60 : W + 60, y: rand(180, 420), dir: -side, target: null, carry: null, bubbled: 0, hp: 1, hurt: 0, ch: '🐠', wob: rand(0, 6) });
    }
    const fspd = [70, 90, 110][g.tier - 1];
    for (const f of g.fish) {
      f.hurt = Math.max(0, f.hurt - dt);
      if (f.bubbled) { f.bubbled += dt; f.y -= 70 * dt; continue; }
      if (f.kind === 'guard') {
        // circle the stone; dart at Aubrey if she gets close, then drift back
        const st = f.post, near = Math.hypot(g.x - st.x, g.y - st.y) < 170;
        let tx, ty;
        if (near) { tx = g.x; ty = g.y; } else { f.ang += dt * 1.4; tx = st.x + Math.cos(f.ang) * 62; ty = st.y - 24 + Math.sin(f.ang) * 34; }
        const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1, v = (near ? 150 : 90) * dt;
        f.x += dx / d * Math.min(v, d); f.y += dy / d * Math.min(v, d);
        if (Math.abs(dx) > 2) f.dir = Math.sign(dx);
      } else if (f.kind === 'pusher') {
        // get between Aubrey and her nearest loose stone, then swim through it
        const near = g.stones.filter(st => this.takeable(st) && Math.hypot(st.x - g.x, st.y - g.y) < 300 && !g.fish.some(o => o !== f && !o.bubbled && o.lineUpOn === st))
          .sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y))[0];
        let tx, ty;
        if (near) {
          const nx = near.x - g.x, ny = near.y - g.y, nd = Math.hypot(nx, ny) || 1;
          const behind = Math.hypot(f.x - (near.x - nx / nd * 45), f.y - (near.y - ny / nd * 45)) < 30;
          f.lineUp = behind || (f.lineUp && f.lineUpOn === near);
          f.lineUpOn = near;
          [tx, ty] = f.lineUp ? [near.x + nx / nd * 60, near.y + ny / nd * 60] : [near.x - nx / nd * 45, near.y - ny / nd * 45];
          if (f.lineUp && Math.hypot(f.x - tx, f.y - ty) < 10) f.lineUp = false;
        } else { f.lineUp = false; f.ang = (f.ang || 0) + dt * 0.6; tx = W / 2 + Math.cos(f.ang) * 320; ty = 300 + Math.sin(f.ang * 1.7) * 120; }
        const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1, v = 120 * dt;
        f.x += dx / d * Math.min(v, d); f.y += dy / d * Math.min(v, d);
        if (Math.abs(dx) > 2) f.dir = Math.sign(dx);
      } else if (f.kind === 'patrol') {
        f.x += f.dir * fspd * 0.9 * dt; f.y += Math.sin(g.t * 2 + f.wob) * 25 * dt;
        if (f.x < 90) f.dir = 1; else if (f.x > W - 90) f.dir = -1;
      } else {
        if (!f.carry && (!f.target || !this.takeable(f.target))) {
          const opts = free();
          f.target = opts.length ? opts.reduce((a, b) => (Math.hypot(b.x - f.x, b.y - f.y) < Math.hypot(a.x - f.x, a.y - f.y) ? b : a)) : null;
        }
        if (f.carry) { f.x += f.dir * fspd * 1.6 * dt; f.y += Math.sin(g.t * 3 + f.wob) * 20 * dt; }
        else if (f.target) {
          const dx = f.target.x - f.x, dy = f.target.y - 14 - f.y, d = Math.hypot(dx, dy);
          f.dir = Math.sign(dx) || f.dir;
          f.x += dx / d * fspd * dt; f.y += dy / d * fspd * dt;
          if (d < 18) { f.carry = f.target; f.target.fish = f; f.target = null; f.dir = f.x < W / 2 ? -1 : 1; SFX.alert(); floatText(f.x, f.y - 50, 'Gulp!', '#ffb0c4'); }
        } else f.x += f.dir * fspd * dt;
        // got away with it
        if (f.carry && (f.x < -70 || f.x > W + 70)) { f.carry.lost = true; f.carry.fish = null; f.carry = null; g.lost++; f.gone = true; }
        if (!f.carry && (f.x < -90 || f.x > W + 90)) f.gone = true;
      }
      if (f.carry) { f.carry.x = f.x + f.dir * 44; f.carry.y = f.y + 16; }
      // bumping into Aubrey
      if (Math.hypot(f.x - g.x, f.y - g.y) < 62 && g.hurt <= 0) { g.hurt = 0.8; g.vx = Math.sign(g.x - f.x || 1) * 320; g.vy = Math.sign(g.y - f.y || 1) * 120; SFX.miss(); }
      for (const b of g.shots) if (b.life > 0 && Math.hypot(b.x - f.x, b.y - f.y) < 60) {
        b.life = 0;
        if (--f.hp > 0) { f.hurt = 0.5; f.x += Math.sign(b.vx) * 40; SFX.hit(); floatText(f.x, f.y - 60, 'One more!', '#fff6a8'); break; }
        f.bubbled = 0.01; SFX.sparkle(); floatText(f.x, f.y - 50, 'Bubbled!', '#bfe9ff');
        if (f.kind === 'guard') { f.post.guard = null; burst(f.post.x, f.post.y, 8); }
        // a bubbled fish lets go of the stone, which sinks to the creek bed
        if (f.carry) { const st = f.carry; st.fish = null; st.rest = false; st.vx = 0; st.vy = 0; f.carry = null; }
        break;
      }
    }
    // fish shove any loose stone they swim into (a guard leaves its own stone alone)
    for (const s of g.stones) {
      if (s.got || s.lost || s.fish) continue;
      for (const f of g.fish) {
        if (f.bubbled || f.post === s) continue;
        const dx = s.x - f.x, dy = s.y - f.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < 58) { s.vx = dx / d * 200; s.vy = dy / d * 120 - 30; s.rest = false; }
      }
      if (s.rest) continue;
      // sink, drift, and settle on a rock or the creek bed
      s.vy = Math.min(s.vy + 300 * dt, 150); s.vx *= 1 - dt * 1.5;
      const y0 = s.y;
      s.x = clamp(s.x + s.vx * dt, 40, W - 40); s.y += s.vy * dt;
      const rock = s.vy > 0 && g.rocks.find(r => Math.abs(s.x - r.x) < 32 && y0 <= r.y - 14 && s.y >= r.y - 14);
      if (rock) { s.y = rock.y - 14; s.vy = 0; s.vx = 0; s.rest = true; }
      else if (s.y >= s.floor) { s.y = s.floor; s.vy = 0; s.vx *= 1 - dt * 6; if (Math.abs(s.vx) < 5) s.rest = true; }
    }
    g.fish = g.fish.filter(f => !f.gone && f.bubbled < 2.5);
    g.shots = g.shots.filter(b => b.life > 0);
    for (const s of g.stones) if (this.takeable(s) && Math.hypot(s.x - g.x, s.y - g.y) < 46) {
      s.got = true; g.got++; SFX.pick(); burst(s.x, s.y, 10, { spread: 60, up: 40 });
    }
    const left = g.stones.filter(s => !s.got && !s.lost).length;
    g.progress = `Stones: ${g.got} / ${g.stones.length}`;
    g.score = g.got / g.stones.length;
    if (!left && g.timeLeft > 1) g.timeLeft = 1;
    if (g.timeLeft <= 0) g.done = true;
  },
  draw(g) {
    // underwater: deep water, light from the surface, sandy creek bed
    const sea = ctx.createLinearGradient(0, 60, 0, H);
    sea.addColorStop(0, '#7fd0f0'); sea.addColorStop(1, '#1f5fa8');
    ctx.fillStyle = sea; ctx.fillRect(0, 60, W, H - 60);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    for (let i = 0; i < 5; i++) { const x = (i * 220 + S.t * 12) % (W + 200) - 100; tri(x, 60, x + 70, 60, x + 160, H); }
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 64 + Math.sin(x * 0.03 + S.t * 2) * 3);
    ctx.stroke();
    for (const w of g.weeds) {
      ctx.strokeStyle = w.c; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w.x, 520);
      ctx.quadraticCurveTo(w.x + Math.sin(S.t * 1.5 + w.x) * 18, 520 - w.h / 2, w.x + Math.sin(S.t * 1.5 + w.x + 1) * 12, 520 - w.h); ctx.stroke();
    }
    ctx.fillStyle = '#e8d29a'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 505 + Math.sin(x * 0.02) * 8);
    ctx.lineTo(W, H); ctx.fill();
    for (const r of g.rocks) {
      inkEllipse(r.x, r.y, 38, 13, 0, '#8a7a66', 1.4, OL);
      ctx.fillStyle = '#5fbf7a'; ellipse(r.x - 10, r.y - 9, 16, 4); ellipse(r.x + 14, r.y - 8, 10, 3);
    }
    for (const s of g.stones) if (!s.got && !s.lost) {
      if (this.takeable(s)) { ctx.fillStyle = `rgba(255,250,200,${0.35 + 0.25 * Math.sin(S.t * 4 + s.x)})`; circle(s.x, s.y, 20); }
      drawSkipStone(s.x, s.y, 0);
    }
    for (const b of g.shots) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill(); }
    for (const f of g.fish) {
      ctx.save(); ctx.translate(f.x, f.y + Math.sin(g.t * 4 + f.wob) * 4);
      if (f.bubbled) ctx.globalAlpha = clamp(2.5 - f.bubbled, 0, 1);
      ctx.save(); ctx.scale(f.dir > 0 ? -1 : 1, 1); if (f.hurt > 0 && Math.sin(g.t * 40) > 0) ctx.globalAlpha = 0.4; emoji(f.ch, 0, 0, f.bubbled ? 70 : f.kind === 'guard' ? 132 : 118); ctx.restore();
      if (f.bubbled) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(200,240,255,.3)'; ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    drawSwimmer(g.x, g.y, g.facing, g.t, g.hurt);
  },
};

// --- rhythm: press the arrow when it reaches the ring (Aubrey dances!) ---------------------
const DIRS = {
  left:  { key: ['arrowleft', 'a'],  glyph: '←', col: '#ff6fb5' },
  up:    { key: ['arrowup', 'w'],    glyph: '↑', col: '#ffc83d' },
  right: { key: ['arrowright', 'd'], glyph: '→', col: '#4fb8ec' },
  down:  { key: ['arrowdown', 's'],  glyph: '↓', col: '#5fc87a' },
};
const BEAT = 0.6, HIT_X = 150, NOTE_SPEED = 300, LANE_Y = 150;
const BASS = [131, 131, 165, 147, 175, 175, 165, 147];
const MELODY = [523, 587, 659, 784, 880, 784, 659, 587];
MG.rhythm = {
  kind: 'action', title: g => g.skin.what, icon: () => '💃',
  how: () => 'Press the matching arrow key when the arrow reaches the pink ring. Or tap the arrow buttons!',
  init(g) {
    const dirs = g.tier === 1 ? ['left', 'right'] : Object.keys(DIRS);
    const notes = [];
    let beat = 4;
    while (notes.length < 10 + g.tier * 4) {
      notes.push({ t: beat * BEAT, dir: pick(dirs), judged: null });
      beat += g.tier > 1 && Math.random() < 0.25 ? 0.5 : g.tier === 1 ? 1.5 : 1;
    }
    Object.assign(g, { notes, time: -0.6, beatDone: -1, combo: 0, points: 0, pose: 'idle_front', poseT: 0, last: null, lastT: 0,
      end: notes[notes.length - 1].t + BEAT * 2, good: 0.2 - g.tier * 0.02, perfect: 0.09 - g.tier * 0.01 });
  },
  update(g, dt, id) {
    g.time += dt; g.poseT -= dt; g.lastT -= dt;
    const b = Math.floor((g.time + 0.1) / BEAT);
    if (b > g.beatDone && g.time + 0.1 < g.end) {
      g.beatDone = b;
      const when = b * BEAT - g.time;
      tone(BASS[b % 8], BEAT * 0.9, 'triangle', 0.08, when);
      tone(60, 0.12, 'sine', 0.18, when, 40);
      noise(0.04, 0.03, when + BEAT / 2);
    }
    let dir = null;
    for (const [d, def] of Object.entries(DIRS)) if (def.key.some(k => pressed[k])) dir = d;
    if (id?.startsWith('dir:')) dir = id.slice(4);
    if (dir) {
      const n = g.notes.find(n => !n.judged && Math.abs(n.t - g.time) < g.good);
      if (n) this.judge(g, n, n.dir !== dir ? 'miss' : Math.abs(n.t - g.time) < g.perfect ? 'perfect' : 'good');
    }
    for (const n of g.notes) if (!n.judged && g.time - n.t > g.good) this.judge(g, n, 'miss');
    g.progress = g.combo > 2 ? `${g.combo} in a row!` : '';
    g.score = g.points / (g.notes.length * 100);
    if (g.time > g.end) g.done = true;
  },
  judge(g, n, how) {
    n.judged = how;
    g.last = how === 'perfect' ? 'Perfect!' : how === 'good' ? 'Good!' : 'Oops!'; g.lastT = 0.6;
    if (how === 'miss') { g.combo = 0; SFX.miss(); return; }
    g.combo++;
    g.points += how === 'perfect' ? 100 : 70;
    g.pose = pick(['twirl', 'jump', 'cast']); g.poseT = 0.4;
    tone(MELODY[g.notes.indexOf(n) % 8] * (how === 'perfect' ? 2 : 1), 0.25, 'triangle', 0.08);
    burst(HIT_X, LANE_Y, how === 'perfect' ? 12 : 6, { colors: [DIRS[n.dir].col, '#fff'], spread: 100, up: 30 });
  },
  draw(g) {
    drawAubrey(W / 2, GY + 30, g.poseT > 0 ? g.pose : 'idle_front', 1, g.poseT > 0 && g.pose === 'jump' ? 20 : 0, 0.8);
    panel(20, LANE_Y - 46, W - 40, 92, 46);
    ctx.fillStyle = 'rgba(255,220,245,.8)'; circle(HIT_X, LANE_Y, 38);
    ctx.strokeStyle = '#ff8fc8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(HIT_X, LANE_Y, 36, 0, Math.PI * 2); ctx.stroke();
    for (const n of g.notes) {
      if (n.judged && n.judged !== 'miss') continue;
      const x = HIT_X + (n.t - g.time) * NOTE_SPEED;
      if (x > W - 40 || x < 30) continue;
      const d = DIRS[n.dir];
      ctx.globalAlpha = n.judged === 'miss' ? 0.3 : 1;
      rrect(x - 28, LANE_Y - 28, 56, 56, 16, d.col, '#fff', 3);
      outlined(d.glyph, x, LANE_Y + 1, 34, '#fff', 'center', mix(d.col, '#000000', 0.35));
      ctx.globalAlpha = 1;
    }
    if (g.lastT > 0) outlined(g.last, HIT_X, LANE_Y - 64, 24, g.last === 'Oops!' ? '#ffb0c4' : '#fff6a8');
    if (g.time < BEAT * 4 && g.time > 0) outlined(String(4 - Math.floor(g.time / BEAT)), W / 2, 260, 56, '#fff6a8');
    const dirs = g.tier === 1 ? ['left', 'right'] : Object.keys(DIRS);
    dirs.forEach((d, i) => {
      const def = DIRS[d], b = { id: `dir:${d}`, x: W - 130 - (dirs.length - 1 - i) * 66 - 66, y: H - 120, w: 58, h: 58, on: true };
      buttons.push(b);
      rrect(b.x, b.y, b.w, b.h, 14, def.col, '#fff', 3);
      outlined(def.glyph, b.x + 29, b.y + 30, 30, '#fff', 'center', mix(def.col, '#000000', 0.35));
    });
  },
};

// ===========================================================================
// LEARNING GAMES
// ===========================================================================

// --- memory: flip cards to find matching pairs ----------------------------------------------
// skin.set: emoji, or unicorn looks ({ mane, style, head, neck, back, tail, hooves, frame: head|full|sit, mood, facing, bg }).
// optional skin.back: card-back theme (book|unicorn|night|sea); skin.names: { emoji: 'name' } for read-aloud.
const MEM_THEMES = {
  book:    { back: ['#c8405e', '#7e1c3a'], trim: '#ffd36b', felt: '#3f8a5c', wood: '#9a6234', glow: '#ffe7a8', fx: ['#ffd36b', '#fff6c8', '#ff9ec7', '#b8f0c8'] },
  unicorn: { back: ['#ff8fca', '#a98cff'], trim: '#fff2a8', felt: '#8f6fd0', wood: '#c98a5a', glow: '#ffd8f0', fx: ['#fff6a8', '#ffb3e0', '#b8e6ff', '#d8b8ff'] },
  night:   { back: ['#5050b8', '#24206a'], trim: '#ffe48a', felt: '#2f3f7c', wood: '#6d4a8a', glow: '#c8d0ff', fx: ['#fff6a8', '#c8d0ff', '#ffffff', '#ffd8f0'] },
  sea:     { back: ['#3cc0e8', '#1e78b8'], trim: '#fff2d0', felt: '#3a9e98', wood: '#c4985e', glow: '#d0fff4', fx: ['#b8f0ff', '#ffffff', '#ffe0b0', '#9fe8d8'] },
};
const MEM_NAMES = { '🦄': 'unicorn', '🌈': 'rainbow', '⭐': 'star', '🌙': 'moon', '🍭': 'lollipop', '🎀': 'bow', '🧸': 'teddy bear', '🎈': 'balloon',
  '🦉': 'owl', '🍂': 'leaf', '🌰': 'acorn', '🐿️': 'squirrel', '🍄': 'mushroom', '🪶': 'feather', '🪀': 'yo-yo', '🪁': 'kite', '🎲': 'dice',
  '🧩': 'puzzle', '🚂': 'train', '🪆': 'doll', '🎨': 'paints', '🍀': 'clover', '🪙': 'coin', '🎩': 'top hat', '💎': 'gem', '🍯': 'honey',
  '🔥': 'fire', '☀️': 'sun', '🌋': 'volcano', '🌅': 'sunrise', '💛': 'yellow heart', '🧡': 'orange heart', '🐙': 'octopus', '🐠': 'fish',
  '🐚': 'shell', '🦀': 'crab', '🐡': 'puffer fish', '🪸': 'coral', '🐬': 'dolphin', '🦑': 'squid', '🌸': 'flower', '🍓': 'strawberry' };
const MEM_BOARD = { x: 16, y: 66, w: 772, h: 466 }, MEM_TRAY = { x: 800, y: 66, w: 144, h: 466 };
const MEM_PEEK = { x: 832, y: 424, w: 80, h: 100 };
const MEM_SLOTS = ['head', 'neck', 'back', 'tail'];
// where each accessory sits on a standing unicorn, in her own units (for the spot-the-difference taps and hint rings)
const MEM_ANCHOR = { head: [92, -214], neck: [64, -112], back: [-6, -122], tail: [-70, -92] };
const MEM_NOTES = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];
const memIsLook = ch => typeof ch === 'object';
const memLC = id => (ITEM[id]?.name || String(id)).toLowerCase();
const memWith = id => (/s$/.test(memLC(id)) ? memLC(id) : `a ${memLC(id)}`);
function memName(g, ch) {
  if (memIsLook(ch)) {
    const acc = ch.head || ch.neck || ch.back || ch.tail;
    return `${ITEM[ch.mane]?.name || 'Cotton Candy'} mane${acc ? ` with ${memWith(acc)}` : ''}!`;
  }
  const n = g.skin.names?.[ch] || MEM_NAMES[ch] || '';
  return n ? n[0].toUpperCase() + n.slice(1) + '!' : '';
}
function memThemeOf(g) {
  const bg = String(g.loc?.bg || ''), k = g.skin.back || (g.loc?.id === 'library' ? 'book'
    : /night|dusk|magic|cave|cloud|moon/.test(bg) ? 'night' : /pond|creek|beach|lake|sea|water/.test(bg) ? 'sea' : 'unicorn');
  return MEM_THEMES[k] ? k : 'unicorn';
}
// a tiny seeded random so painted patterns stay put
const memHash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// paint once into an offscreen canvas (2x for crispness); paint() draws around (ox, oy)
const memCache = new Map(), memIds = new WeakMap();
let memNextId = 1;
const memKey = ch => (memIsLook(ch) ? (memIds.get(ch) || (memIds.set(ch, memNextId++), memIds.get(ch))) : ch);
function memPaint(key, w, h, ox, oy, paint) {
  let c = memCache.get(key);
  if (c) return c;
  if (memCache.size > 160) memCache.clear();
  c = document.createElement('canvas'); c.width = Math.ceil(w * 2); c.height = Math.ceil(h * 2);
  const main = ctx, mainInk = INK;
  ctx = c.getContext('2d');
  try { ctx.scale(2, 2); ctx.translate(ox, oy); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; paint(); } finally { ctx = main; INK = mainInk; }
  memCache.set(key, c);
  return c;
}
function memHorn(x, y, s, col = '#ffd36b') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ink(P2('M-7,0 C-5,-10 -2,-20 0,-29 C2,-20 5,-10 7,0 C3,2.5 -3,2.5 -7,0 Z'), col, 1.3, OL);
  ctx.strokeStyle = mix(col, '#a05a00', 0.45); ctx.lineWidth = 1.2;
  for (const yy of [-5, -12, -19]) { const k = 1 + yy / 32; ctx.beginPath(); ctx.moveTo(-6 * k, yy + 2); ctx.lineTo(6 * k, yy - 2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(-2, -9, 1.2, 5, 0.15);
  ctx.restore();
}
function memOStar(x, y, r, col, pts = 5) { star(x, y, r + 1.6, OL, pts); star(x, y, r, col, pts); }
// the patterned back of a card, centred on (0, 0)
function memBackArt(th, w, h) {
  const T = MEM_THEMES[th], x = -w / 2, y = -h / 2, r = Math.min(12, w * 0.12), m = Math.min(w, h / 1.3);
  const gr = ctx.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, T.back[0]); gr.addColorStop(1, T.back[1]);
  rrect(x, y, w, h, r, gr, OL, 2.6);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + 1, y + 1, w - 2, h - 2, r); ctx.clip();
  if (th === 'book') {
    ctx.strokeStyle = 'rgba(255,215,140,.2)'; ctx.lineWidth = 1.2;
    for (let d = -h; d < w + h; d += 11) { ctx.beginPath(); ctx.moveTo(x + d, y); ctx.lineTo(x + d - h, y + h); ctx.moveTo(x + d - h, y); ctx.lineTo(x + d, y + h); ctx.stroke(); }
  } else if (th === 'sea') {
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2;
    for (let yy = y + 8; yy < y + h; yy += 13) { ctx.beginPath(); for (let xx = x; xx <= x + w; xx += 4) ctx.lineTo(xx, yy + Math.sin(xx * 0.25) * 2.5); ctx.stroke(); }
  } else {
    for (let i = 0; i < 26; i++) {
      const px = x + memHash(i) * w, py = y + memHash(i + 50) * h, s = 2 + memHash(i + 99) * 3;
      if (th === 'night' && i % 3) { ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(px, py, s * 0.4); } else star(px, py, s, 'rgba(255,255,255,.5)', 4);
    }
  }
  const sh = ctx.createLinearGradient(x, y, x + w * 0.7, y + h * 0.5);
  sh.addColorStop(0, 'rgba(255,255,255,.3)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
  ctx.restore();
  rrect(x + 5, y + 5, w - 10, h - 10, Math.max(3, r - 3), null, T.trim, 1.8);
  for (const [cx, cy] of [[x + 11, y + 11], [x + w - 11, y + 11], [x + 11, y + h - 11], [x + w - 11, y + h - 11]]) star(cx, cy, 4.5, T.trim, 4);
  // centre emblem
  const k = m / 100;
  ctx.save(); ctx.scale(k, k);
  if (th === 'book') {
    // a bookplate: cream oval, gold rim, an open book with a unicorn horn rising out of it
    inkEllipse(0, 0, 30, 38, 0, '#fff4dc', 1.6, OL);
    ctx.strokeStyle = '#d9a640'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 0, 25, 33, 0, 0, Math.PI * 2); ctx.stroke();
    ink(P2('M0,10 C-7,6 -14,6 -20,9 L-20,24 C-14,21 -7,21 0,25 Z'), '#ffffff', 1.2, OL);
    ink(P2('M0,10 C7,6 14,6 20,9 L20,24 C14,21 7,21 0,25 Z'), '#fff8ea', 1.2, OL);
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 1;
    for (const yy of [13, 17]) { ctx.beginPath(); ctx.moveTo(-16, yy); ctx.lineTo(-4, yy + 1.5); ctx.moveTo(16, yy); ctx.lineTo(4, yy + 1.5); ctx.stroke(); }
    memHorn(0, 6, 0.95);
    memOStar(-15, -18, 4, '#ffd36b'); memOStar(15, -12, 3, '#ff9ec7');
  } else if (th === 'night') {
    inkCircle(0, 0, 32, '#3a3a96', 1.6, OL);
    ctx.strokeStyle = T.trim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 27, 0, Math.PI * 2); ctx.stroke();
    inkCircle(-3, 0, 17, '#ffe48a', 1.4, OL); ctx.fillStyle = '#3a3a96'; circle(5, -5, 15);
    memOStar(12, 10, 5, '#ffffff'); memOStar(14, -14, 3, '#ffe48a');
  } else if (th === 'sea') {
    inkCircle(0, 0, 32, '#e8fbff', 1.6, OL);
    ink(P2('M0,20 C-20,18 -26,-2 -16,-14 C-8,-22 8,-22 16,-14 C26,-2 20,18 0,20 Z'), '#ffc8b0', 1.4, OL);
    ctx.strokeStyle = '#d9806a'; ctx.lineWidth = 1.4;
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) { ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(Math.sin(a) * 19, 16 - Math.cos(a) * 32); ctx.stroke(); }
  } else {
    // a sparkly medallion: rainbow arc and a golden horn
    inkCircle(0, 0, 32, '#fff0fa', 1.6, OL);
    ['#ff7fa8', '#ffc65a', '#7fe08a', '#7cc8ff', '#b892ff'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 16, 24 - i * 3.2, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    });
    memHorn(0, 14, 1.05); memOStar(-17, -14, 4, '#fff6a8'); memOStar(17, -8, 3.2, '#ffffff');
  }
  ctx.restore();
}
// the face of a card: a framed picture with a little name band underneath
function memFrontArt(g, ch, w, h, th) {
  const T = MEM_THEMES[th], x = -w / 2, y = -h / 2, r = Math.min(12, w * 0.12);
  rrect(x, y, w, h, r, '#fffaf3', OL, 2.6);
  rrect(x + 3.5, y + 3.5, w - 7, h - 7, Math.max(3, r - 2), null, mix(T.trim, '#c08a20', 0.35), 1.4);
  const wx = x + 7, wy = y + 7, ww = w - 14, wh = h - 14 - Math.round(h * 0.15);
  ctx.save(); ctx.beginPath(); ctx.roundRect(wx, wy, ww, wh, 8); ctx.clip();
  const bg = memIsLook(ch) ? (ch.bg || '#ffe0f0') : mix(T.back[0], '#ffffff', 0.8);
  const rg = ctx.createRadialGradient(0, wy + wh / 2, 4, 0, wy + wh / 2, wh * 0.75);
  rg.addColorStop(0, mix(bg, '#ffffff', 0.6)); rg.addColorStop(1, bg);
  ctx.fillStyle = rg; ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, wy + wh / 2); ctx.arc(0, wy + wh / 2, wh, i * 0.785, i * 0.785 + 0.3); ctx.fill(); }
  if (memIsLook(ch)) {
    const f = ch.facing || 1;
    const [div, cx, cy] = { head: [130, 92, -182], full: [330, 15, -105], sit: [290, 20, -95] }[ch.frame || 'head'];
    const s = ww / div;
    ctx.translate(0, wy + wh / 2);
    drawUnicorn(-cx * s * f, -cy * s, s, { shine: 100, ...ch }, { facing: f, pose: ch.frame === 'sit' ? 'sit' : 'stand', mood: ch.mood, t: 0 });
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(0, wy + wh / 2, ww * 0.36);
    emoji(ch, 0, wy + wh / 2 + 1, Math.min(ww, wh) * 0.62);
  }
  ctx.restore();
  rrect(wx, wy, ww, wh, 8, null, OL, 1.6);
  const by = (wy + wh + y + h - 4) / 2;
  if (memIsLook(ch)) {
    const icons = MEM_SLOTS.map(s => ch[s] && ITEM[ch[s]]?.icon).filter(Boolean).slice(0, 3);
    const pal = MANES[ch.mane] || MANES.natural;
    inkCircle(x + 14, by, 4.5, pal[0], 0.8, OL);
    icons.forEach((ic, i) => emoji(ic, x + 30 + i * 15, by, 11));
  } else {
    const n = (g.skin.names?.[ch] || MEM_NAMES[ch] || '');
    if (n) { let fs = Math.min(14, h * 0.11); ctx.font = `700 ${fs}px ${FONT}`; while (fs > 8 && ctx.measureText(n).width > w - 14) { fs -= 1; ctx.font = `700 ${fs}px ${FONT}`; } text(n, 0, by, fs, '#6a3a7e', 'center', 700); } else for (const dx of [-12, 0, 12]) heart(dx, by - 4, 9, T.back[0]);
  }
}
function memMagnifier(x, y, s, on = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.rotate(0.78); ink(P2('M-4.5,16 L4.5,16 L4.5,40 C4.5,44 -4.5,44 -4.5,40 Z'), on ? '#a0623a' : '#a89aa8', 1.4, OL); ctx.restore();
  inkCircle(0, 0, 18, on ? '#ffd36b' : '#cfc4d4', 1.5, OL);
  inkCircle(0, 0, 13, on ? '#d8f4ff' : '#eae6ee', 1.1, OL);
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(-5, -5, 4, 2.4, -0.7);
  ctx.restore();
}
// a little 4-point twinkle with an ink rim
function memTwinkle(x, y, r, col) { star(x, y, r + 1.4, 'rgba(91,63,115,.6)', 4); star(x, y, r, col, 4); }

MG.memory = {
  kind: 'learn', title: () => 'Memory Match', icon: g => (typeof g.skin.set[0] === 'string' ? g.skin.set[0] : '🦄'),
  how: g => `Tap two cards to flip them. Find all the matching pairs! Your magnifying glass can peek at one card.${g.tier >= 3 ? ' Watch out: swirly cards swap places!' : ''}`,
  init(g) {
    const pairs = Math.min(g.skin.set.length, [6, 7, 8][g.tier - 1]);
    const faces = shuffle(g.skin.set).slice(0, pairs);
    const cards = shuffle([...faces, ...faces]).map((ch, i) => ({ ch, slot: i, up: false, done: false, gone: false, flip: 0, hov: 0, peek: 0 }));
    const N = cards.length, gap = 14;
    // the biggest cards that fit the felt, rows centred
    let best = null;
    for (let cols = 3; cols <= 8; cols++) {
      const rows = Math.ceil(N / cols), w = Math.min(118, (712 - (cols - 1) * gap) / cols, (410 - (rows - 1) * gap) / rows / 1.3);
      if (!best || w > best.raw + 0.5) best = { cols, rows, raw: w, w: Math.floor(w), h: Math.floor(w * 1.3), gap };
    }
    Object.assign(g, { cards, pairs, open: [], moves: 0, found: 0, wait: 0, mmGrid: best, mmTheme: memThemeOf(g), mmLooks: faces.some(memIsLook),
      mmFx: [], mmTray: [], mmStreak: 0, mmBest: 0, mmPeeks: 1, mmArm: false, mmPrev: 0, mmSwap: null, mmSwaps: 0, mmSwapIn: 6,
      mmBonus: null, mmBonusLeft: 0, mmBonusOk: 0, mmEnd: 0, mmT: 0, mmTrail: 0 });
    g.mmBonusRounds = g.mmLooks && g.skin.set.every(memIsLook) ? (g.tier >= 3 ? 2 : 1) : 0;
    g.mmBonusLeft = g.mmBonusRounds;
    g.say = 'Find the matching pairs!';
  },
  start(g) {
    g.mmPrev = [2.6, 1.6, 0][g.tier - 1];
    if (g.mmPrev) speak('Look carefully! Remember where they are.');
  },
  layout(g, slot) {
    const { cols, rows, w, h, gap } = g.mmGrid, N = g.cards.length, row = Math.floor(slot / cols);
    const cnt = row === rows - 1 ? N - cols * (rows - 1) : cols;
    const x0 = 402 - (cnt * w + (cnt - 1) * gap) / 2, y0 = 301 - (rows * h + (rows - 1) * gap) / 2;
    return { x: x0 + (slot % cols) * (w + gap), y: y0 + row * (h + gap), w, h };
  },
  traySlot(i) { return { x: 843 + (i % 2) * 62, y: 142 + Math.floor(i / 2) * 72 }; },
  // where a card is drawn right now (it moves while swapping)
  cardPos(g, c) {
    const r = this.layout(g, c.slot);
    let x = r.x + r.w / 2, y = r.y + r.h / 2, rot = 0, glow = 0;
    const sw = g.mmSwap;
    if (sw && (sw.a === c || sw.b === c)) {
      const other = this.layout(g, (sw.a === c ? sw.b : sw.a).slot), ox = other.x + other.w / 2, oy = other.y + other.h / 2;
      if (sw.t < 1.3) { rot = Math.sin(sw.t * 24) * 0.07 * Math.min(1, sw.t * 2); glow = 0.6 + 0.4 * Math.sin(sw.t * 10); } else {
        const k = clamp((sw.t - 1.3) / 0.9, 0, 1), e = k * k * (3 - 2 * k), side = sw.a === c ? 1 : -1;
        const dx = ox - x, dy = oy - y, len = Math.hypot(dx, dy) || 1, bulge = Math.sin(e * Math.PI) * 60 * side;
        x = lerp(x, ox, e) - dy / len * bulge; y = lerp(y, oy, e) + dx / len * bulge;
        rot = Math.sin(e * Math.PI) * 0.5 * side; glow = 1;
      }
    }
    return { x, y, w: r.w, h: r.h, rot, glow };
  },
  clickable(g, c) {
    const sw = g.mmSwap;
    return !c.up && !c.done && !c.gone && c.peek <= 0 && !(sw && (sw.a === c || sw.b === c));
  },
  closeOpen(g) { for (const i of g.open) g.cards[i].up = false; g.open = []; g.wait = 0; },
  update(g, dt, id) {
    g.mmT += dt;
    const lookingAll = g.mmPrev > 0;
    for (const c of g.cards) {
      const target = c.up || c.done || c.peek > 0 || lookingAll ? 1 : 0;
      c.flip = clamp(c.flip + (target ? dt : -dt) * 4.5, 0, 1);
      if (c.peek > 0) c.peek -= dt;
      const r = this.layout(g, c.slot);
      c.hov = clamp(c.hov + (inRect(r) && this.clickable(g, c) && !lookingAll && !g.mmBonus ? dt : -dt) * 8, 0, 1);
    }
    this.updateFx(g, dt);
    if (g.mmSwap) {
      const sw = g.mmSwap; sw.t += dt;
      if (sw.t >= 1.3 && !sw.moved) { sw.moved = true; tone(300, 0.7, 'sine', 0.06, 0, 900); tone(450, 0.7, 'triangle', 0.03, 0.05, 1200); }
      if (sw.t > 1.3 && (g.mmTrail -= dt) <= 0) {
        g.mmTrail = 0.04;
        for (const c of [sw.a, sw.b]) { const p = this.cardPos(g, c); burst(p.x, p.y, 1, { colors: ['#e0c8ff', '#ffffff', '#ffb3e0'], spread: 30, up: 10, size: [2, 4] }); }
      }
      if (sw.t >= 2.2) { [sw.a.slot, sw.b.slot] = [sw.b.slot, sw.a.slot]; g.mmSwap = null; g.mmSwaps++; SFX.blip(); }
    }
    if (g.mmPrev > 0) {
      g.mmPrev -= dt;
      if (g.mmPrev <= 0) { SFX.sparkle(); speak('Now find the pairs!'); }
      this.status(g);
      return;
    }
    if (g.mmBonus) { this.updateBonus(g, dt, id); this.status(g); return; }
    if (g.wait > 0) { g.wait -= dt; if (g.wait <= 0) this.closeOpen(g); }

    const allFound = g.found === g.pairs;
    if (!allFound && g.mmPeeks > 0 && (id === 'mmpeek' || pressed.p)) {
      g.mmArm = !g.mmArm;
      if (g.mmArm) { speak('Tap a card to peek at it!'); tone(660, 0.12, 'triangle', 0.07); tone(990, 0.16, 'triangle', 0.06, 0.08); }
    } else if (pointer.clicked && !allFound) {
      const c = g.cards.find(c => this.clickable(g, c) && inRect(this.layout(g, c.slot)));
      if (c) this.tapCard(g, c);
      else if (g.mmArm && !inRect(MEM_PEEK)) g.mmArm = false;
    }
    // the swap twist: two face-down cards wobble, then swirl into each other's places
    if (g.tier >= 3 && !g.mmSwap && g.moves > 0 && g.mmSwaps < 3 && !allFound) {
      g.mmSwapIn -= dt;
      if (g.mmSwapIn <= 0 && !g.open.length && g.wait <= 0) {
        const pool = g.cards.filter(c => this.clickable(g, c) && c.flip < 0.05);
        if (pool.length >= 4) {
          const a = pick(pool), b = pick(pool.filter(c => c.ch !== a.ch));
          g.mmSwap = { a, b, t: 0 }; g.mmSwapIn = rand(9, 12);
          SFX.alert();
          if (!g.mmSwaps) speak('Whoa! Those two cards are swirling. Watch where they go!');
        } else g.mmSwapIn = 2;
      }
    }
    if (allFound && !g.mmFx.length && !g.mmSwap) {
      if (g.mmBonusLeft > 0) this.startBonus(g);
      else if ((g.mmEnd += dt) > 0.8) g.done = true;
    }
    this.status(g);
  },
  status(g) {
    g.progress = g.mmBonus ? `Bonus ${g.mmBonusRounds - g.mmBonusLeft + 1} / ${g.mmBonusRounds}` : `Pairs: ${g.found} / ${g.pairs}`;
    // a few extra flips are free, and so is one for every swap twist
    const free = Math.ceil(g.pairs / 3) + g.mmSwaps;
    const base = clamp(1 - Math.max(0, g.moves - g.pairs - free) / (g.pairs * 1.6), 0.25, 1);
    g.score = clamp(base + (g.mmBonusRounds ? 0.12 * g.mmBonusOk / g.mmBonusRounds : 0), 0, 1);
  },
  tapCard(g, c) {
    const i = g.cards.indexOf(c), name = memName(g, c.ch);
    if (g.mmArm) {
      g.mmArm = false; g.mmPeeks--; c.peek = 1.5;
      SFX.sparkle(); if (name) speak(name);
      const p = this.cardPos(g, c); burst(p.x, p.y, 8, { colors: ['#d8f4ff', '#ffffff', '#ffd36b'], spread: 70, up: 30 });
      return;
    }
    if (g.wait > 0) this.closeOpen(g);
    c.up = true; g.open.push(i);
    tone(500, 0.09, 'triangle', 0.06, 0, 820); noise(0.05, 0.015);
    if (g.open.length < 2) { if (name) speak(name); return; }
    g.moves++;
    const [a, b] = g.open.map(j => g.cards[j]);
    if (a.ch === b.ch) {
      a.done = b.done = true; g.found++; g.open = [];
      g.mmStreak++; g.mmBest = Math.max(g.mmBest, g.mmStreak);
      const n = MEM_NOTES[Math.min(MEM_NOTES.length - 3, g.mmStreak - 1)];
      tone(n, 0.25, 'triangle', 0.09); tone(n * 1.25, 0.25, 'triangle', 0.07, 0.09); tone(n * 1.5, 0.4, 'sine', 0.07, 0.18);
      const pa = this.cardPos(g, a), pb = this.cardPos(g, b);
      g.mmFx.push({ kind: memIsLook(a.ch) ? 'prance' : 'pop', a, b, pa, pb, t: 0, tray: g.mmTray.length, ch: a.ch,
        dir: (pa.x + pb.x) / 2 < 402 ? 1 : -1 });
      g.mmTray.push(null);
      if (g.mmStreak >= 2) floatText((pa.x + pb.x) / 2, Math.min(pa.y, pb.y) - 40, `${g.mmStreak} in a row!`, '#fff6a8', false, 24);
      speak(g.mmStreak >= 3 ? `Wow, ${g.mmStreak} in a row! ${name}` : `A match! ${name}`);
    } else {
      g.mmStreak = 0; g.wait = 1.2;
      if (name) speak(name);
      tone(330, 0.16, 'sine', 0.05, 0.35, 250);
    }
  },
  // matched pairs: unicorn looks merge and the unicorn prances off to the shelf; emoji pop and fly there
  updateFx(g, dt) {
    const T = MEM_THEMES[g.mmTheme];
    for (let i = g.mmFx.length - 1; i >= 0; i--) {
      const f = g.mmFx[i], t0 = f.t; f.t += dt;
      const mx = (f.pa.x + f.pb.x) / 2, my = (f.pa.y + f.pb.y) / 2, crossed = s => t0 < s && f.t >= s;
      if (f.kind === 'prance') {
        if (crossed(0.45)) { f.a.gone = f.b.gone = true; burst(mx, my, 22, { colors: T.fx }); SFX.sparkle(); }
        if (f.t > 0.45 && f.t < 3.1 && (f.trail = (f.trail || 0) - dt) <= 0) {
          f.trail = 0.05; const p = this.prancePos(g, f);
          burst(p.x - 20 * p.face, p.y - 30, 1, { colors: T.fx, spread: 30, up: 20, size: [2, 5] });
        }
        for (const s of [0.95, 1.35, 1.75]) if (crossed(s)) tone(700 + s * 300, 0.1, 'triangle', 0.05, 0, 1000 + s * 300);
        if (crossed(2.05)) { tone(880, 0.5, 'sine', 0.06, 0, 1760); const p = this.prancePos(g, f); burst(p.x, p.y - 50, 16, { colors: T.fx, spread: 110, up: 40 }); }
        if (f.t >= 3.15) { g.mmTray[f.tray] = f.ch; const s = this.traySlot(f.tray); burst(s.x, s.y, 10, { colors: T.fx, spread: 60, up: 30 }); SFX.pop(); g.mmFx.splice(i, 1); }
      } else {
        if (crossed(0.12)) {
          for (const p of [f.pa, f.pb]) { burst(p.x, p.y, 12, { colors: T.fx }); burst(p.x, p.y, 3, { colors: [f.ch], kind: 'emoji', spread: 90, up: 60, size: [3, 4] }); }
          SFX.pop();
        }
        if (crossed(0.35)) f.a.gone = f.b.gone = true;
        if (f.t >= 1.05) { g.mmTray[f.tray] = f.ch; const s = this.traySlot(f.tray); burst(s.x, s.y, 8, { colors: T.fx, spread: 50, up: 30 }); tone(1320, 0.12, 'sine', 0.06); g.mmFx.splice(i, 1); }
      }
    }
  },
  // the matched unicorn's path: pop out, hop across the felt, twirl, then float onto the shelf
  prancePos(g, f) {
    const mx = (f.pa.x + f.pb.x) / 2, my = (f.pa.y + f.pb.y) / 2 + f.pa.h * 0.35, t = f.t;
    const tx = clamp(mx + f.dir * 270, 110, 700), ty = clamp(my, 200, 470);
    if (t < 0.75) { const k = clamp((t - 0.45) / 0.3, 0, 1); return { x: mx, y: my - Math.sin(k * Math.PI) * 30, s: 0.12 + 0.3 * easeOut(k), face: f.dir, spin: 1, a: 1 }; }
    if (t < 2.05) {
      const k = (t - 0.75) / 1.3;
      return { x: lerp(mx, tx, k), y: lerp(my, ty, k) - Math.abs(Math.sin(k * Math.PI * 3)) * 38, s: 0.42, face: f.dir, spin: 1, a: 1, moving: true };
    }
    if (t < 2.55) { const k = (t - 2.05) / 0.5; return { x: tx, y: ty - Math.sin(k * Math.PI) * 26, s: 0.42, face: f.dir, spin: Math.cos(k * Math.PI * 2), a: 1 }; }
    const k = clamp((t - 2.55) / 0.6, 0, 1), e = k * k, sl = this.traySlot(f.tray);
    return { x: lerp(tx, sl.x, e), y: lerp(ty, sl.y + 26, e) - Math.sin(k * Math.PI) * 80, s: lerp(0.42, 0.14, e), face: 1, spin: 1, a: 1 - k * 0.5, moving: true };
  },
  startBonus(g) {
    const looks = g.skin.set.filter(memIsLook), of = s => WARDROBE.filter(i => i.slot === s).map(i => i.id);
    const base = { ...pick(looks), frame: 'full', facing: 1, mood: 'joy' };
    for (const s of shuffle(MEM_SLOTS)) if (!base[s] && MEM_SLOTS.filter(k => base[k]).length < 3) base[s] = pick(of(s));
    const used = MEM_SLOTS.filter(k => base[k]);
    const prev = g.mmBonusPrev, slot = pick(used.filter(s => s !== prev).length ? used.filter(s => s !== prev) : used);
    const right = { ...base, [slot]: pick(of(slot).filter(id => id !== base[slot])) };
    g.mmBonusPrev = slot;
    g.mmBonus = { left: base, right, slot, opts: shuffle(used), picked: null, t: 0, after: 0 };
    g.say = 'One thing is different on the second unicorn. Tap what is different!';
    SFX.sparkle();
    speak(`Bonus! Look at the two unicorns. ${g.say}`);
  },
  bonusSpot(i) { return { x: [220, 564][i], y: 394, s: 0.72 }; },
  updateBonus(g, dt, id) {
    const b = g.mmBonus; b.t += dt;
    if (b.picked == null) {
      let pickSlot = null;
      b.opts.forEach((s, i) => { if (id === `mmopt${i}`) pickSlot = s; });
      if (!pickSlot && pointer.clicked) {
        // tapping the accessory on either unicorn counts too
        for (let u = 0; u < 2 && !pickSlot; u++) {
          const sp = this.bonusSpot(u);
          for (const s of b.opts) { const [ax, ay] = MEM_ANCHOR[s]; if (Math.hypot(pointer.x - (sp.x + ax * sp.s), pointer.y - (sp.y + ay * sp.s)) < 34) { pickSlot = s; break; } }
        }
      }
      if (pickSlot) {
        b.picked = pickSlot; b.after = 2.6;
        const nm = ITEM[b.right[b.slot]].name, sp = this.bonusSpot(1), [ax, ay] = MEM_ANCHOR[b.slot];
        if (pickSlot === b.slot) {
          g.mmBonusOk++; SFX.sparkle(); burst(sp.x + ax * sp.s, sp.y + ay * sp.s, 24, { colors: MEM_THEMES[g.mmTheme].fx });
          speak(`Yes! The ${nm} is different! Sharp eyes!`);
        } else { SFX.miss(); speak(`Good looking! It was the ${nm}.`); }
      }
    } else if ((b.after -= dt) <= 0) { g.mmBonus = null; g.mmBonusLeft--; g.say = 'Find the matching pairs!'; }
  },
  draw(g) {
    const th = g.mmTheme, T = MEM_THEMES[th], { w, h } = g.mmGrid;
    // the table: wood rim, felt, stitching (painted once)
    ctx.save(); ctx.fillStyle = 'rgba(30,12,40,.3)'; ctx.beginPath(); ctx.roundRect(MEM_BOARD.x + 5, MEM_BOARD.y + 9, MEM_BOARD.w, MEM_BOARD.h, 26); ctx.fill(); ctx.restore();
    ctx.drawImage(memPaint(`table:${th}`, MEM_BOARD.w, MEM_BOARD.h, 0, 0, () => this.paintTable(th, MEM_BOARD.w, MEM_BOARD.h)), MEM_BOARD.x, MEM_BOARD.y, MEM_BOARD.w, MEM_BOARD.h);
    ctx.save(); ctx.fillStyle = 'rgba(30,12,40,.3)'; ctx.beginPath(); ctx.roundRect(MEM_TRAY.x + 4, MEM_TRAY.y + 8, MEM_TRAY.w, MEM_TRAY.h, 22); ctx.fill(); ctx.restore();
    ctx.drawImage(memPaint(`tray:${th}`, MEM_TRAY.w, MEM_TRAY.h, 0, 0, () => this.paintTray(th, MEM_TRAY.w, MEM_TRAY.h)), MEM_TRAY.x, MEM_TRAY.y, MEM_TRAY.w, MEM_TRAY.h);
    // empty places where pairs used to lie
    for (const c of g.cards) if (c.gone) {
      const r = this.layout(g, c.slot);
      ctx.setLineDash([6, 6]); rrect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 10, 'rgba(255,255,255,.06)', 'rgba(255,255,255,.28)', 2); ctx.setLineDash([]);
      memTwinkle(r.x + r.w / 2, r.y + r.h / 2, 5 + Math.sin(g.mmT * 3 + c.slot) * 1.5, 'rgba(255,255,255,.55)');
    }
    // cards: still ones first, moving or lifted ones on top
    const fxCards = new Set(g.mmFx.flatMap(f => [f.a, f.b]));
    const live = g.cards.filter(c => !c.gone && !fxCards.has(c));
    const busy = c => c.hov + Math.sin(c.flip * Math.PI) + (g.mmSwap && (g.mmSwap.a === c || g.mmSwap.b === c) ? 3 : 0);
    live.sort((a, b) => busy(a) - busy(b));
    for (const c of live) {
      const p = this.cardPos(g, c);
      let dx = 0;
      if (g.wait > 0 && g.wait < 0.8 && c.up && !c.done) dx = Math.sin(g.mmT * 40) * 3 * (g.wait / 0.8);
      this.drawCard(g, c.ch, p.x + dx, p.y, p.w, p.h, c.flip, { lift: c.hov, rot: p.rot, glow: p.glow || (c.peek > 0 ? 0.8 : 0) });
    }
    // the swirl telegraph between the two cards about to swap
    if (g.mmSwap) {
      const sw = g.mmSwap, pa = this.cardPos(g, sw.a), pb = this.cardPos(g, sw.b);
      if (sw.t < 1.3) {
        ctx.save(); ctx.globalAlpha = Math.min(1, sw.t * 3) * 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -g.mmT * 40;
        const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2, dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy) || 1;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.quadraticCurveTo(mx - dy / L * 60, my + dx / L * 60, pb.x, pb.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pb.x, pb.y); ctx.quadraticCurveTo(mx + dy / L * 60, my - dx / L * 60, pa.x, pa.y); ctx.stroke();
        ctx.restore();
        for (const p of [pa, pb]) emoji('🌀', p.x, p.y - p.h / 2 - 16, 26 + Math.sin(g.mmT * 12) * 3);
      }
    }
    // matched-pair animations
    for (const f of g.mmFx) this.drawFx(g, f);
    // the shelf of found pairs
    for (let i = 0; i < g.pairs; i++) {
      const s = this.traySlot(i), ch = g.mmTray[i];
      if (ch == null) { ctx.setLineDash([4, 4]); rrect(s.x - 26, s.y - 32, 52, 64, 8, 'rgba(255,255,255,.12)', 'rgba(255,240,210,.55)', 1.6); ctx.setLineDash([]); text('?', s.x, s.y, 20, 'rgba(255,240,210,.6)', 'center', 700); } else this.drawCard(g, ch, s.x, s.y, 52, 64, 1, { src: [w, h] });
    }
    // peek: a magnifying glass, once per round
    const pk = MEM_PEEK, on = g.mmPeeks > 0 && g.found < g.pairs && g.mmPrev <= 0 && !g.mmBonus;
    if (on) buttons.push({ id: 'mmpeek', x: pk.x, y: pk.y, w: pk.w, h: pk.h, on: true, key: null });
    const hovP = on && inRect(pk), bob = on ? Math.sin(g.mmT * 3) * 2 : 0;
    rrect(pk.x + 6, pk.y + 2, pk.w - 12, 64, 32, g.mmArm ? '#fff6a8' : hovP ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.28)', on ? OL : 'rgba(91,63,115,.4)', 2);
    memMagnifier(pk.x + pk.w / 2 - 4, pk.y + 30 + bob - (hovP ? 2 : 0), 0.8, on);
    text(g.mmPeeks > 0 ? (g.mmArm ? 'Tap a card' : 'Peek') : 'Used', pk.x + pk.w / 2, pk.y + 82, 15, on ? '#fff' : 'rgba(255,255,255,.55)', 'center', 700);
    if (g.mmArm) {
      memMagnifier(pointer.x + 6, pointer.y + 6, 0.9, true);
    }
    // the look-first moment at the start
    if (g.mmPrev > 0) {
      const k = g.mmPrev / [2.6, 1.6, 1][g.tier - 1];
      darkPanel(402 - 130, 76, 260, 40, 20);
      text('Look carefully! 👀', 402, 92, 18, '#fff', 'center', 700);
      rrect(402 - 100, 106, 200 * k, 5, 2.5, '#fff6a8');
    }
    if (g.mmStreak >= 2 && !g.mmBonus && !g.done) {
      darkPanel(30, 498, 150, 26, 13);
      text(`🔥 ${g.mmStreak} in a row!`, 105, 511, 14, '#fff6a8', 'center', 700);
    }
    if (g.mmBonus) this.drawBonus(g);
  },
  paintTable(th, w, h) {
    const T = MEM_THEMES[th];
    const wg = ctx.createLinearGradient(0, 0, 0, h); wg.addColorStop(0, mix(T.wood, '#ffffff', 0.2)); wg.addColorStop(1, mix(T.wood, '#2a1050', 0.22));
    rrect(1.5, 1.5, w - 3, h - 3, 26, wg, OL, 3);
    ctx.save(); ctx.beginPath(); ctx.roundRect(2, 2, w - 4, h - 4, 26); ctx.clip();
    ctx.strokeStyle = 'rgba(70,35,15,.22)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 18; i++) {
      const y = 5 + i * 26 + memHash(i) * 8;
      ctx.beginPath(); for (let x = 0; x <= w; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.012 + i) * 4); ctx.stroke();
    }
    ctx.restore();
    // felt
    const fx = 18, fy = 18, fw = w - 36, fh = h - 36;
    const fg = ctx.createRadialGradient(w / 2, h * 0.42, 40, w / 2, h / 2, w * 0.6);
    fg.addColorStop(0, mix(T.felt, '#ffffff', 0.16)); fg.addColorStop(1, mix(T.felt, '#1a0830', 0.3));
    rrect(fx, fy, fw, fh, 16, fg, mix(T.wood, '#2a1050', 0.5), 3);
    ctx.save(); ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, 16); ctx.clip();
    for (let i = 0; i < 500; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; ctx.fillRect(fx + memHash(i) * fw, fy + memHash(i + 777) * fh, 2, 2); }
    // a warm lamp glow across the felt
    const lg = ctx.createRadialGradient(fw * 0.25, 0, 10, fw * 0.25, 0, fw * 0.7);
    lg.addColorStop(0, `${T.glow}55`); lg.addColorStop(1, `${T.glow}00`);
    ctx.fillStyle = lg; ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(fx, fy, fw, 5);
    ctx.restore();
    ctx.setLineDash([7, 6]); rrect(fx + 8, fy + 8, fw - 16, fh - 16, 10, null, 'rgba(255,240,200,.5)', 2); ctx.setLineDash([]);
    for (const [x, y] of [[9, 9], [w - 9, 9], [9, h - 9], [w - 9, h - 9]]) { inkCircle(x, y, 4.5, T.trim, 1, OL); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(x - 1.5, y - 1.5, 1.4); }
    // little corner charms on the rim
    memTwinkle(w / 2 - 60, 9, 4, T.trim); memTwinkle(w / 2 + 60, 9, 4, T.trim); memTwinkle(w / 2, h - 9, 4, T.trim);
  },
  paintTray(th, w, h) {
    const T = MEM_THEMES[th], wood = mix(T.wood, '#2a1050', 0.15);
    const wg = ctx.createLinearGradient(0, 0, w, 0); wg.addColorStop(0, mix(wood, '#ffffff', 0.15)); wg.addColorStop(1, mix(wood, '#2a1050', 0.2));
    rrect(1.5, 1.5, w - 3, h - 3, 22, wg, OL, 3);
    rrect(10, 44, w - 20, 300, 12, mix(wood, '#1a0830', 0.35), mix(wood, '#2a1050', 0.5), 2);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(12, 46, w - 24, 5);
    for (let r = 0; r < 4; r++) { ctx.fillStyle = mix(wood, '#ffffff', 0.12); ctx.fillRect(12, 112 + r * 72 - 2, w - 24, 4); }
    // a little banner with the title
    ink(P2(`M14,10 L${w - 14},10 L${w - 22},24 L${w - 14},38 L14,38 L22,24 Z`), T.back[0], 1.3, OL);
    ctx.save(); outlined('Found', w / 2, 24, 17, '#fff', 'center', 'rgba(52,26,72,.8)'); ctx.restore();
    memTwinkle(26, 24, 4, T.trim); memTwinkle(w - 26, 24, 4, T.trim);
  },
  // one card. flip 0 = back up, 1 = face up; scale-x turn with lift, shadow and shading
  drawCard(g, ch, cx, cy, w, h, flip, { lift = 0, rot = 0, glow = 0, alpha = 1, scale = 1, src = null } = {}) {
    const th = g.mmTheme, e = flip * flip * (3 - 2 * flip), ang = e * Math.PI, sx = Math.abs(Math.cos(ang)), fl = Math.sin(ang);
    const up = e > 0.5, sc = scale * (1 + 0.1 * fl + 0.04 * lift), yy = cy - lift * 6 - fl * 12;
    const [pw, ph] = src || [w, h];
    const img = up ? memPaint(`f:${memKey(ch)}:${pw}x${ph}:${th}`, pw + 6, ph + 6, (pw + 6) / 2, (ph + 6) / 2, () => memFrontArt(g, ch, pw, ph, th))
      : memPaint(`b:${th}:${pw}x${ph}`, pw + 6, ph + 6, (pw + 6) / 2, (ph + 6) / 2, () => memBackArt(th, pw, ph));
    ctx.save(); ctx.globalAlpha = alpha;
    // shadow on the felt
    ctx.fillStyle = `rgba(20,8,30,${0.28 - 0.08 * (lift + fl) / 2})`;
    ctx.beginPath(); ctx.roundRect(cx - w * sc * Math.max(sx, 0.15) / 2 + 3 + (lift + fl) * 3, cy - h * sc / 2 + 5 + (lift + fl) * 7, w * sc * Math.max(sx, 0.15), h * sc, 10); ctx.fill();
    ctx.translate(cx, yy); ctx.rotate(rot); ctx.scale(Math.max(0.03, sx) * sc, sc);
    if (glow > 0) {
      ctx.save(); ctx.shadowColor = MEM_THEMES[th].glow; ctx.shadowBlur = 22 * glow; ctx.fillStyle = MEM_THEMES[th].glow;
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 12); ctx.fill(); ctx.restore();
    }
    ctx.drawImage(img, -w / 2 - 3 * w / pw, -h / 2 - 3 * h / ph, w + 6 * w / pw, h + 6 * h / ph);
    // turning shade, plus a gloss that sweeps across while it turns
    if (fl > 0.02) {
      ctx.fillStyle = `rgba(40,15,60,${(1 - sx) * 0.45})`; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 10); ctx.fill();
      const gx = (e < 0.5 ? -1 : 1) * (1 - sx) * w * 0.4;
      const gl = ctx.createLinearGradient(gx - w * 0.3, 0, gx + w * 0.3, 0);
      gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, `rgba(255,255,255,${0.35 * fl})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 10); ctx.fill();
    }
    ctx.restore();
  },
  drawFx(g, f) {
    const mx = (f.pa.x + f.pb.x) / 2, my = (f.pa.y + f.pb.y) / 2, { w, h } = f.pa;
    if (f.kind === 'prance') {
      if (f.t < 0.45) {
        // the two cards glide together and merge
        const k = easeOut(clamp(f.t / 0.45, 0, 1));
        for (const p of [f.pa, f.pb]) this.drawCard(g, f.ch, lerp(p.x, mx, k), lerp(p.y, my, k) - Math.sin(k * Math.PI) * 20, w, h, 1, { glow: k, scale: 1 + 0.15 * k });
        return;
      }
      if (f.t < 0.75) {
        const k = (f.t - 0.45) / 0.3;
        ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffffff'; circle(mx, my, w * (0.6 + k)); ctx.restore();
      }
      const p = this.prancePos(g, f);
      ctx.save(); ctx.globalAlpha = p.a;
      const gr = ctx.createRadialGradient(p.x, p.y - 260 * p.s * 0.5, 4, p.x, p.y - 260 * p.s * 0.5, 160 * p.s + 20);
      gr.addColorStop(0, 'rgba(255,250,220,.55)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = gr; ctx.fillRect(p.x - 200, p.y - 260, 400, 300);
      ctx.translate(p.x, p.y); ctx.scale(p.spin, 1);
      drawUnicorn(0, 0, p.s, { shine: 100, ...f.ch }, { facing: p.face, pose: 'stand', moving: p.moving, mood: 'joy', glow: 0.5, t: g.mmT });
      ctx.restore();
      // a ring of twinkles while she twirls
      if (f.t > 2.05 && f.t < 2.55) {
        for (let i = 0; i < 6; i++) { const a = g.mmT * 6 + i * Math.PI / 3; memTwinkle(p.x + Math.cos(a) * 70, p.y - 55 + Math.sin(a) * 26, 6, MEM_THEMES[g.mmTheme].fx[i % 4]); }
      }
      return;
    }
    // emoji: pop up, then both cards fly to the shelf, shrinking into one
    const sl = this.traySlot(f.tray);
    for (const p of [f.pa, f.pb]) {
      if (f.t < 0.35) {
        const k = f.t / 0.35, s = 1 + 0.22 * Math.sin(k * Math.PI);
        this.drawCard(g, f.ch, p.x, p.y, w, h, 1, { glow: 1, scale: s });
      } else {
        const k = clamp((f.t - 0.35) / 0.7, 0, 1), e = k * k;
        const x = lerp(p.x, sl.x, e), y = lerp(p.y, sl.y, e) - Math.sin(k * Math.PI) * 90;
        this.drawCard(g, f.ch, x, y, w, h, 1, { scale: lerp(1, 52 / w, e), rot: Math.sin(k * Math.PI) * 0.6 * (p === f.pa ? 1 : -1), glow: 0.5 });
      }
    }
  },
  drawBonus(g) {
    const b = g.mmBonus, T = MEM_THEMES[g.mmTheme];
    ctx.save(); ctx.fillStyle = 'rgba(20,8,30,.35)'; ctx.fillRect(MEM_BOARD.x + 18, MEM_BOARD.y + 18, MEM_BOARD.w - 36, MEM_BOARD.h - 36); ctx.restore();
    panel(56, 82, 692, 438, 22);
    outlined('Spot the difference!', 402, 112, 28, '#ff6fb5', 'center', '#fff');
    if (b.picked == null) text('One thing is different on unicorn 2. Tap it!', 402, 142, 16, '#7a4a8e', 'center', 600);
    for (let u = 0; u < 2; u++) {
      const sp = this.bonusSpot(u), look = u ? b.right : b.left;
      const fx = sp.x - 140, fy = 160;
      rrect(fx + 3, fy + 5, 300, 248, 16, 'rgba(40,15,60,.18)');
      rrect(fx, fy, 300, 248, 16, mix(look.bg || '#ffe0f0', '#ffffff', 0.3), OL, 2.6);
      rrect(fx + 6, fy + 6, 288, 236, 12, null, T.trim, 2);
      ctx.save(); ctx.beginPath(); ctx.roundRect(fx + 3, fy + 3, 294, 242, 14); ctx.clip();
      drawUnicorn(sp.x, sp.y, sp.s, { shine: 100, ...look }, { facing: 1, pose: 'stand', mood: look.mood, t: g.mmT });
      ctx.restore();
      inkCircle(fx + 22, fy + 22, 15, u ? '#ff8fc8' : '#9a6ae0', 1.3, OL);
      text(String(u + 1), fx + 22, fy + 23, 17, '#fff', 'center', 700);
      // after a while, or once answered, a ring shows where to look
      const [ax, ay] = MEM_ANCHOR[b.slot];
      const hint = b.picked != null ? 1 : clamp((b.t - 9) / 2, 0, 0.6);
      if (hint > 0) {
        ctx.save(); ctx.globalAlpha = hint; ctx.strokeStyle = b.picked === b.slot || b.picked == null ? '#ffd23f' : '#ff6f9f'; ctx.lineWidth = 4;
        ctx.setLineDash([7, 5]); ctx.lineDashOffset = -g.mmT * 30;
        ctx.beginPath(); ctx.arc(sp.x + ax * sp.s, sp.y + ay * sp.s, 30 + Math.sin(g.mmT * 6) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
    const bw = 196, gap = 16, x0 = 402 - (b.opts.length * bw + (b.opts.length - 1) * gap) / 2;
    b.opts.forEach((s, i) => {
      const it = ITEM[b.right[s]], right = b.picked != null && s === b.slot, wrong = b.picked === s && s !== b.slot;
      button(`mmopt${i}`, x0 + i * (bw + gap), 432, bw, 64, it.name, { on: true, icon: it.icon, color: right ? '#5fb87a' : wrong ? '#e07a9a' : '#9a6ae0', size: 16, key: String(i + 1) });
    });
    if (b.picked != null) outlined(b.picked === b.slot ? 'Sharp eyes! ✨' : `It was the ${ITEM[b.right[b.slot]].name}!`, 402, 143, 22, b.picked === b.slot ? '#fff6a8' : '#ffd0e0');
  },
};

// --- outfits: drag each piece of clothing onto the Aubrey wearing that kind of outfit ------
// Dress-up looks: core pieces are always used; at the top tier one random extra joins them.
const OF_CATS = [
  { name: 'Casual', classic: true, icon: '☀️', sky: ['#bfe9ff', '#d4f7c0'], deco: ['☀️', '🌳'], cheer: 'Comfy and cool, ready to play!', core: ['tee', 'skirt', 'sneakers'], extra: ['cap'] },
  { name: 'Fancy', classic: true, icon: '✨', sky: ['#d9b8ff', '#fff0c2'], deco: ['✨', '💎'], cheer: 'So fancy! A royal princess!', core: ['gown', 'tiara', 'heels'], extra: ['pearls'] },
  { name: 'Pajamas', classic: true, icon: '🌙', sky: ['#2b2f77', '#6a5acd'], deco: ['🌙', '⭐'], cheer: 'Cozy pajamas! Sweet dreams!', core: ['nightgown', 'nightcap', 'slippers'], extra: ['teddy'] },
  { name: 'Swimming', classic: true, icon: '🌊', sky: ['#7fd6ff', '#ffe6a8'], deco: ['🌊', '🐚'], cheer: 'Splish splash, ready to swim!', core: ['swimsuit', 'ring', 'flipflops'], extra: ['sunglasses'] },
  { name: 'Snow Day', classic: true, icon: '❄️', sky: ['#dceeff', '#ffffff'], deco: ['❄️', '⛄'], cheer: 'Warm and snuggly for the snow!', core: ['coat', 'beanie', 'boots'], extra: ['scarf'] },
  { name: 'Pirate', icon: '⚓', sky: ['#5ec8f0', '#f6e3a8'], deco: ['🦜', '🏝️'], cheer: 'Arr, a perfect pirate!', core: ['pirShirt', 'pirHat', 'pirBoots'], extra: ['pirPatch', 'pirHook'] },
  { name: 'Space Knight', icon: '🌟', sky: ['#1b1a4a', '#4b3a8a'], deco: ['🪐', '✨'], cheer: 'Whoosh! A brave space knight!', core: ['skRobe', 'skSaber', 'skBoots'], extra: ['skHood'] },
  { name: 'Scientist', icon: '🔬', sky: ['#d8f3ff', '#e2ffe0'], deco: ['🧪', '⚛️'], cheer: 'Bubble bubble! A super scientist!', core: ['sciCoat', 'sciGoggles', 'sciBeaker'], extra: ['sciTube'] },
  { name: 'Doctor', icon: '🩺', sky: ['#ffe0e6', '#e0f6ff'], deco: ['❤️', '💊'], cheer: 'Doctor Aubrey is ready to help!', core: ['docCoat', 'docBag', 'docClogs'], extra: ['docCap', 'docMirror'] },
  { name: 'Astronaut', icon: '🚀', sky: ['#0d1240', '#3a2b7a'], deco: ['🪐', '⭐'], cheer: 'Three, two, one, blast off!', core: ['asSuit', 'asHelmet', 'asBoots'], extra: ['asFlag'] },
  { name: 'Chef', icon: '🍳', sky: ['#fff3d6', '#ffd9c2'], deco: ['🥐', '🍰'], cheer: 'Yum yum! A cheerful chef!', core: ['chefJacket', 'chefHat', 'chefSpoon'], extra: ['chefMitt'] },
  { name: 'Firefighter', icon: '🚒', sky: ['#ffd1a8', '#ffefc2'], deco: ['🔥', '🧯'], cheer: 'Firefighter to the rescue!', core: ['ffCoat', 'ffHelmet', 'ffBoots'], extra: ['ffHose'] },
  { name: 'Ballerina', icon: '🩰', sky: ['#ffd6ec', '#fff0f7'], deco: ['🎀', '🌸'], cheer: 'Twirl! A beautiful ballerina!', core: ['balTutu', 'balShoes', 'balCrown'], extra: ['balBow'] },
  { name: 'Wizard', icon: '🔮', sky: ['#3b1f6e', '#7a4fc4'], deco: ['🌙', '✨'], cheer: 'Abracadabra, a wonderful wizard!', core: ['wizRobe', 'wizHat', 'wizWand'], extra: ['wizBeard'] },
  { name: 'Superhero', icon: '⚡', sky: ['#ff8a8a', '#ffe27a'], deco: ['💥', '⚡'], cheer: 'Super Aubrey saves the day!', core: ['shSuit', 'shCape', 'shBoots'], extra: ['shMask'] },
  { name: 'Cowgirl', icon: '🌵', sky: ['#ffcf8a', '#ffefc8'], deco: ['🌵', '⭐'], cheer: 'Yee-haw, a cool cowgirl!', core: ['cbVest', 'cbHat', 'cbBoots'], extra: ['cbBandana'] },
  { name: 'Mermaid', icon: '🧜', sky: ['#5fd4e8', '#2a7fc8'], deco: ['🐚', '🐠'], cheer: 'Splash! A magical mermaid!', core: ['mmTail', 'mmShells', 'mmCrown'], extra: ['mmTrident'] },
];
// looks that are easy to mix up: the top tier always puts one of these pairs side by side
const OF_ALIKE = [['Doctor', 'Scientist'], ['Pirate', 'Cowgirl'], ['Wizard', 'Pajamas'], ['Ballerina', 'Fancy'], ['Mermaid', 'Swimming'],
  ['Astronaut', 'Snow Day'], ['Space Knight', 'Wizard'], ['Firefighter', 'Superhero'], ['Chef', 'Doctor']];
const OF_OLD_NAMES = { tee: 'T-shirt', skirt: 'jean skirt', sneakers: 'sneakers', cap: 'cap', gown: 'ball gown', tiara: 'tiara', heels: 'sparkly shoes', pearls: 'pearls',
  nightgown: 'nightgown', nightcap: 'night cap', slippers: 'bunny slippers', teddy: 'teddy bear', swimsuit: 'swimsuit', ring: 'swim ring', flipflops: 'flip flops',
  sunglasses: 'sunglasses', coat: 'puffy coat', beanie: 'woolly hat', boots: 'snow boots', scarf: 'scarf' };

// art helpers, in the idle_front sprite's pixels (97 x 226): head x 30..72 y 0..46, eyes (42,27) (56,27),
// shoulders y 54, waist y 88, dress puff x 2..96 y 120..152, hands (17,138) (81,138), feet AUB_FEET
const ofLG = (y0, y1, c, x0 = 0, x1 = 0) => {
  const gr = ctx.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, mix(c, '#ffffff', 0.4)); gr.addColorStop(0.45, c); gr.addColorStop(1, mix(c, '#2a1050', 0.25));
  return gr;
};
function ofLine(pts, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
// a stroke with an ink outline under it (ropes, hooks, handles)
function ofRope(pts, col, w) { ofLine(pts, OL, w + 2.4); ofLine(pts, col, w); }
function ofShine(x, y, rx, ry, rot = 0, a = 0.5) { ctx.fillStyle = `rgba(255,255,255,${a})`; ellipse(x, y, rx, ry, rot); }
function ofClip(path, fn) { ctx.save(); ctx.clip(path); fn(); ctx.restore(); }
function ofStripes(path, col, y0, y1, step, w) { ofClip(path, () => { ctx.fillStyle = col; for (let y = y0; y < y1; y += step) ctx.fillRect(-20, y, 140, w); }); }
// outline every shape first, then fill them, so overlapping parts read as one piece
function ofInkAll(list, lw) {
  ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
  for (const [p] of list) ctx.stroke(p);
  for (const [p, f] of list) { ctx.fillStyle = f; ctx.fill(p); }
}
function ofOutlinedStar(x, y, r, col, pts = 5) { star(x, y, r + 1.8, OL, pts); star(x, y, r, col, pts); }
const OF_COAT = P2('M30,52 C40,58 58,58 68,52 L76,58 C90,96 101,128 101,176 C70,184 28,184 -3,176 C-3,128 8,96 22,58 Z');
const OF_ROBE = P2('M30,52 C40,58 58,58 68,52 L76,58 C92,100 104,150 106,212 C70,220 28,220 -8,212 C-6,150 6,100 22,58 Z');
const OF_TORSO = P2('M30,52 C40,58 58,58 68,52 L76,58 C82,72 80,84 76,94 L22,94 C18,84 16,72 22,58 Z');
const OF_SKIRT = P2('M26,88 L72,88 C84,108 98,130 101,152 C70,160 28,160 -3,152 C0,130 14,108 26,88 Z');
const OF_SLV = [P2('M25,57 C15,64 12,90 13,128 L28,128 C29,102 30,82 32,66 Z'), P2('M73,57 C83,64 86,90 85,128 L70,128 C69,102 68,82 66,66 Z')];
const OF_BELL = [P2('M25,57 C14,66 8,96 2,132 C10,136 22,136 30,130 C30,104 31,84 32,66 Z'), P2('M73,57 C84,66 90,96 96,132 C88,136 76,136 68,130 C68,104 67,84 66,66 Z')];
const ofSleeves = (lw, col, list = OF_SLV) => { for (const s of list) ink(s, ofLG(56, 134, col), lw); };
// a white coat (lab coat and doctor's coat share it: they are the look-alike pair)
function ofWhiteCoat(lw, shirt) {
  ink(OF_COAT, ofLG(50, 184, '#f4f8ff'), lw);
  ofClip(OF_COAT, () => { ctx.fillStyle = 'rgba(80,100,150,.12)'; ctx.fillRect(78, 40, 40, 160); ctx.fillRect(-10, 40, 16, 160); });
  ink(P2('M39,55 C44,58 54,58 59,55 L49,78 Z'), shirt, lw * 0.8);
  ink(P2('M37,54 L49,79 L43,84 L30,59 Z'), '#e4ecf8', lw * 0.8); ink(P2('M61,54 L49,79 L55,84 L68,59 Z'), '#e4ecf8', lw * 0.8);
  ofLine([[49, 80], [49, 180]], '#b8c4d8', 1.4);
  for (const y of [96, 118, 140]) inkCircle(53, y, 1.8, '#dfe6f2', lw * 0.4);
  rrect(12, 130, 20, 15, 3, '#eef3fb', OL, lw * 1.2); rrect(66, 130, 20, 15, 3, '#eef3fb', OL, lw * 1.2);
}
// boots: a tall shaft and a toe that points out
function ofBoot(x, y, lw, col, top = 18) {
  ink(P2(`M${x - 8},${y + 7} L${x - 8},${y - top} L${x + 7},${y - top} L${x + 7},${y - 4} C${x + 13},${y - 2} ${x + 13},${y + 7} ${x + 8},${y + 7} Z`), ofLG(y - top, y + 7, col), lw);
  ofShine(x - 4.5, y - top / 2, 1.4, top / 3, 0, 0.35);
}

const OF_WEAR = {
  // ---- Pirate: red and white stripes, brown vest, gold sash
  pirShirt: { layer: 0, sleeves: true, name: 'striped pirate shirt', box: [-4, 48, 102, 166], draw(lw) {
    const p = P2('M30,52 C40,58 58,58 68,52 L76,58 C88,96 100,124 101,156 L91,151 L83,163 L73,153 L62,164 L50,155 L38,164 L27,153 L17,163 L8,151 L-3,156 C-2,124 10,96 22,58 Z');
    ink(p, '#fffaf0', lw);
    ofStripes(p, '#e63946', 60, 170, 12, 6);
    ofClip(p, () => { ctx.fillStyle = 'rgba(42,16,80,.13)'; ctx.fillRect(76, 40, 40, 130); ctx.fillRect(-10, 40, 16, 130); });
    ink(P2('M24,58 L38,58 C40,80 40,100 38,122 L12,124 C12,100 16,76 24,58 Z'), ofLG(56, 124, '#7a4a2c'), lw);
    ink(P2('M74,58 L60,58 C58,80 58,100 60,122 L86,124 C86,100 82,76 74,58 Z'), ofLG(56, 124, '#7a4a2c'), lw);
    ink(P2('M70,100 L82,128 L73,131 L65,104 Z'), '#ffb627', lw);
    ink(P2('M16,92 C38,98 60,98 82,92 L83,104 C60,110 38,110 15,104 Z'), ofLG(92, 108, '#ffb627'), lw);
    inkCircle(68, 101, 4.5, '#ffb627', lw * 0.8);
    dots([[31, 70], [31, 84], [67, 70], [67, 84]], 1.6, '#ffd23f');
  }, over(lw) {
    for (const s of OF_SLV) { ink(s, '#fffaf0', lw); ofStripes(s, '#e63946', 62, 130, 12, 6); }
    fluff(13, 28, 129, 2.6, lw); fluff(70, 85, 129, 2.6, lw);
  } },
  pirHat: { layer: 1, name: 'pirate hat', box: [12, -24, 88, 18], draw(lw) {
    ink(P2('M14,8 C20,-6 32,-4 38,-14 C44,-24 56,-24 62,-14 C68,-4 80,-6 86,8 C72,18 28,18 14,8 Z'), ofLG(-24, 16, '#3a2d52'), lw);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(17, 9); ctx.quadraticCurveTo(50, 20, 83, 9); ctx.stroke();
    ofRope([[42, 0], [58, 10]], '#ffffff', 2.4); ofRope([[58, 0], [42, 10]], '#ffffff', 2.4);
    rrect(46.5, 0, 7, 5, 1.5, '#ffffff', OL, lw * 1.1); inkCircle(50, -4, 5.6, '#ffffff', lw * 0.6);
    dots([[47.8, -4.5], [52.2, -4.5]], 1.6, OL);
    ofShine(30, -2, 6, 2, -0.5, 0.25);
  } },
  pirBoots: { layer: 1, pair: true, name: 'pirate boots', box: [-4, -28, 34, 9], one(x, y, lw) {
    ofBoot(x, y, lw, '#3a2d52', 16);
    ink(P2(`M${x - 11},${y - 27} L${x + 10},${y - 27} L${x + 8},${y - 15} L${x - 9},${y - 15} Z`), ofLG(y - 27, y - 15, '#5a4a72'), lw);
    rrect(x - 4, y - 11, 8, 6, 1.5, '#ffd23f', OL, lw * 1.1);
  } },
  pirPatch: { layer: 1, name: 'eye patch', box: [28, 14, 72, 38], draw(lw) {
    ofRope([[30, 16], [44, 25], [70, 22]], '#1b1525', 1.4);
    ink(P2('M35,24 C35,19 50,19 50,25 C50,32 45,36 42,36 C38,35 35,30 35,24 Z'), '#1b1525', lw);
    ofShine(39, 24, 2.4, 1.4, 0, 0.45); star(43, 29, 2.2, '#ffd23f', 5);
  } },
  pirHook: { layer: 1, name: 'pirate hook', box: [68, 124, 100, 166], draw(lw) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(81, 144); ctx.lineTo(81, 154); ctx.arc(87, 154, 6, Math.PI, 0, true); ctx.lineTo(93, 149);
    ctx.strokeStyle = OL; ctx.lineWidth = 6.4; ctx.stroke(); ctx.strokeStyle = '#d8dee8'; ctx.lineWidth = 3.6; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    ink(P2('M71,128 L91,128 L89,145 L73,145 Z'), ofLG(128, 145, '#8a5a3c', 71, 91), lw);
    rrect(70, 126, 22, 5, 2, '#ffd23f', OL, lw * 1.1);
  } },
  // ---- Space Knight: hooded brown robe and a glowing star sword
  skRobe: { layer: 0, sleeves: true, name: 'knight robe', box: [-10, 48, 108, 222], draw(lw) {
    ink(OF_ROBE, ofLG(50, 220, '#9a6a44'), lw);
    ofClip(OF_ROBE, () => { ctx.strokeStyle = 'rgba(60,30,10,.3)'; ctx.lineWidth = 2; for (const x of [8, 20, 78, 90]) { ctx.beginPath(); ctx.moveTo(x + (x < 49 ? 10 : -10), 100); ctx.lineTo(x, 216); ctx.stroke(); } });
    ink(P2('M36,56 C42,60 56,60 62,56 L68,214 C56,218 42,218 30,214 Z'), ofLG(56, 216, '#f1e0bd'), lw);
    ofLine([[37, 58], [57, 88]], 'rgba(120,80,40,.55)', 1.6); ofLine([[61, 58], [43, 88]], 'rgba(120,80,40,.55)', 1.6);
    rrect(22, 86, 54, 10, 3, '#4a2e1c', OL, lw * 1.1);
    rrect(27, 92, 9, 11, 2, '#7a4a2c', OL, lw * 1.1); rrect(62, 92, 9, 11, 2, '#7a4a2c', OL, lw * 1.1);
    rrect(44, 84, 11, 14, 2, '#d8dee8', OL, lw * 1.1); ofShine(47, 88, 1.2, 3, 0, 0.8);
  }, over(lw) { ofSleeves(lw, '#9a6a44', OF_BELL); } },
  skSaber: { layer: 1, name: 'glowing star sword', box: [68, 28, 104, 152], draw(lw) {
    const f = 0.8 + 0.2 * Math.sin(S.t * 27);
    ctx.save(); ctx.lineCap = 'round';
    ctx.shadowColor = '#4dfcff'; ctx.shadowBlur = 16;
    ofLine([[82, 126], [95, 34]], `rgba(77,232,255,${0.5 * f})`, 10);
    ofLine([[82, 126], [95, 34]], '#7ff4ff', 6);
    ctx.shadowBlur = 0; ofLine([[82, 126], [95, 34]], '#ffffff', 2.6);
    ctx.restore();
    ctx.save(); ctx.translate(81, 138); ctx.rotate(0.14);
    ink(P2('M-4,-13 L4,-13 L4,13 L-4,13 Z'), ofLG(0, 0, '#c9d2e0', -4, 4), lw);
    for (const y of [-2, 3, 8]) rrect(-4, y, 8, 2.4, 1, '#3a2d52', null);
    rrect(-5, -14, 10, 4, 1.5, '#8a96aa', OL, lw * 1.1); inkCircle(0, -7, 1.6, '#ff4f6b', lw * 0.4);
    ctx.restore();
  } },
  skBoots: { layer: 1, pair: true, name: 'knight boots', box: [-4, -24, 34, 9], one(x, y, lw) {
    ofBoot(x, y, lw, '#5a3a24', 22);
    rrect(x - 9, y - 24, 17, 5, 2, '#7a4a2c', OL, lw * 1.1);
  } },
  skHood: { layer: 1, name: 'knight hood', box: [16, -12, 84, 62], draw(lw) {
    ink(P2('M18,62 C8,30 20,-11 50,-11 C80,-11 92,30 82,62 L71,58 C76,32 70,5 50,4 C30,5 24,32 29,58 Z'), ofLG(-10, 62, '#9a6a44', 18, 82), lw);
    ctx.strokeStyle = 'rgba(40,20,10,.35)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(31, 56); ctx.bezierCurveTo(26, 32, 31, 8, 50, 7); ctx.bezierCurveTo(69, 8, 74, 32, 69, 56); ctx.stroke();
    ofShine(26, 16, 2.6, 10, 0.4, 0.3);
  } },
  // ---- Scientist: lab coat with pens, goggles, a bubbling flask
  sciCoat: { layer: 0, sleeves: true, name: 'lab coat', box: [-4, 48, 102, 186], draw(lw) {
    ofWhiteCoat(lw, '#2ec4b6');
    for (const [x, c] of [[59, '#3a86ff'], [63, '#e63946'], [67, '#2ec46b']]) rrect(x - 1.5, 61, 3, 12, 1, c, OL, lw * 0.8);
    rrect(55, 68, 15, 13, 2, '#e4ecf8', OL, lw * 1.1);
    rrect(28, 68, 13, 8, 1.5, '#ffd23f', OL, lw * 0.8); ofLine([[30, 72], [39, 72]], '#a07800', 1);
    ctx.fillStyle = 'rgba(125,255,106,.75)'; ellipse(22, 160, 5, 3.5, 0.4); ellipse(28, 166, 2.5, 2);
    ctx.fillStyle = 'rgba(199,125,255,.75)'; ellipse(78, 112, 4, 3, -0.3); ellipse(84, 106, 2, 2);
  }, over(lw) { ofSleeves(lw, '#f4f8ff'); ofLine([[13, 122], [28, 122]], '#b8c4d8', 1.4); ofLine([[70, 122], [85, 122]], '#b8c4d8', 1.4); } },
  sciGoggles: { layer: 1, name: 'safety goggles', box: [26, 16, 74, 40], draw(lw) {
    rrect(26, 24, 48, 6, 3, '#ff8c42', OL, lw * 1.1);
    for (const x of [41.5, 57.5]) inkCircle(x, 27, 8.5, '#3ddc84', lw);
    rrect(47, 25, 6, 4, 1.5, '#3ddc84', null);
    for (const x of [41.5, 57.5]) { ctx.fillStyle = 'rgba(180,235,255,.85)'; circle(x, 27, 6); ofShine(x - 2.5, 24.5, 2, 1.3, -0.5, 0.9); }
  } },
  sciBeaker: { layer: 1, name: 'bubbling flask', box: [0, 76, 34, 152], draw(lw) {
    const p = P2('M13,104 L21,104 L21,118 L32,146 C33,150 31,152 28,152 L6,152 C3,152 1,150 2,146 L13,118 Z');
    ink(p, 'rgba(225,244,255,.92)', lw);
    ofClip(p, () => {
      ctx.fillStyle = '#7dff6a'; ctx.fillRect(0, 131, 40, 30); ctx.fillStyle = '#4fd63e'; ctx.fillRect(0, 131, 40, 3);
      for (let i = 0; i < 4; i++) { const k = (S.t * 0.9 + i / 4) % 1; ofShine(9 + i * 5, 150 - k * 18, 1.5, 1.5, 0, 0.8); }
    });
    ofShine(9, 138, 1.4, 6, 0.4, 0.6);
    rrect(11, 101, 12, 4, 1.5, '#e8f4ff', OL, lw * 1.1);
    for (let i = 0; i < 4; i++) { const k = (S.t * 0.7 + i / 4) % 1; inkCircle(17 + Math.sin(k * 6 + i) * 3, 99 - k * 20, 1.8 + k * 1.6, 'rgba(190,255,170,.95)', lw * 0.4); }
  } },
  sciTube: { layer: 1, name: 'test tube', box: [70, 98, 100, 150], draw(lw) {
    ctx.save(); ctx.translate(84, 124); ctx.rotate(0.3);
    const p = P2('M-4.5,-22 L4.5,-22 L4.5,13 C4.5,20 -4.5,20 -4.5,13 Z');
    ink(p, 'rgba(225,244,255,.92)', lw);
    ofClip(p, () => { ctx.fillStyle = '#ff5fa2'; ctx.fillRect(-6, -2, 12, 24); });
    ofShine(-2, -6, 1, 9, 0, 0.7);
    rrect(-5.5, -27, 11, 7, 2, '#c98a4b', OL, lw * 1.1);
    ctx.restore();
  } },
  // ---- Doctor: white coat with stethoscope, red cross bag
  docCoat: { layer: 0, sleeves: true, name: "doctor's coat", box: [-4, 48, 102, 186], draw(lw) {
    ofWhiteCoat(lw, '#5fb8f0');
    inkCircle(37, 76, 7, '#ffffff', lw * 0.7); ctx.fillStyle = '#e63946'; ctx.fillRect(35.2, 71, 3.6, 10); ctx.fillRect(32, 74.2, 10, 3.6);
    ctx.save(); ctx.lineCap = 'round';
    const tube = new Path2D();
    tube.moveTo(40, 55); tube.bezierCurveTo(36, 72, 42, 96, 53, 100); tube.moveTo(59, 55); tube.bezierCurveTo(64, 72, 63, 92, 53, 100);
    tube.moveTo(53, 100); tube.bezierCurveTo(53, 110, 63, 112, 63, 119);
    ctx.strokeStyle = OL; ctx.lineWidth = 4.6; ctx.stroke(tube); ctx.strokeStyle = '#3a86ff'; ctx.lineWidth = 2.6; ctx.stroke(tube);
    ctx.restore();
    inkCircle(63, 123, 5.2, '#c9d2e0', lw * 0.8); inkCircle(63, 123, 2.6, '#f4f8ff', lw * 0.4);
    dots([[40, 55], [59, 55]], 2, '#c9d2e0');
  }, over(lw) { ofSleeves(lw, '#f4f8ff'); } },
  docBag: { layer: 1, name: 'doctor bag', box: [64, 118, 106, 160], draw(lw) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(85, 133, 8, Math.PI, 0); ctx.strokeStyle = OL; ctx.lineWidth = 5.2; ctx.stroke(); ctx.strokeStyle = '#6b3f2a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    ink(P2('M68,132 L102,132 L105,158 L65,158 Z'), ofLG(132, 158, '#ffffff'), lw);
    rrect(66, 131, 38, 5, 2, '#e63946', OL, lw * 1.1);
    ctx.fillStyle = '#e63946'; ctx.fillRect(82.5, 139, 5, 15); ctx.fillRect(77.5, 144, 15, 5);
    ofShine(72, 146, 1.4, 7, 0, 0.6);
  } },
  docClogs: { layer: 1, pair: true, name: 'doctor clogs', box: [-4, -8, 34, 9], one(x, y, lw) {
    ink(P2(`M${x - 10},${y + 7} C${x - 11},${y - 2} ${x - 6},${y - 8} ${x},${y - 8} C${x + 6},${y - 8} ${x + 11},${y - 2} ${x + 10},${y + 7} Z`), ofLG(y - 8, y + 7, '#2ec4b6'), lw);
    dots([[x - 4, y - 3], [x, y - 5], [x + 4, y - 3], [x - 2, y], [x + 2, y]], 1.1, '#e8fffb');
    rrect(x - 10, y + 4, 20, 3.5, 1.5, '#1e8f84', null);
  } },
  docCap: { layer: 1, name: 'scrub cap', box: [22, -12, 84, 18], draw(lw) {
    ofRope([[72, 8], [80, 14]], '#2ec4b6', 2); ofRope([[72, 8], [83, 9]], '#2ec4b6', 2);
    ink(P2('M24,12 C20,-12 78,-12 74,12 C62,16 36,16 24,12 Z'), ofLG(-10, 14, '#2ec4b6'), lw);
    heart(36, -3, 8, '#ffffff'); heart(50, -6, 8, '#ff8fc8'); heart(63, -2, 7, '#ffffff'); heart(43, 4, 6, '#ff8fc8'); heart(58, 5, 6, '#ffffff');
  } },
  docMirror: { layer: 1, name: 'doctor head mirror', box: [24, -16, 76, 22], draw(lw) {
    ofRope([[27, 16], [36, 9], [49, 7], [62, 9], [71, 16]], '#3a2d52', 3);
    inkCircle(49, -3, 9.5, '#c9d2e0', lw); inkCircle(49, -3, 6.5, '#f4fbff', lw * 0.4);
    dots([[49, -3]], 1.6, OL); ofShine(46, -6, 2, 1.2, -0.6, 0.95);
  } },
  // ---- Astronaut: puffy space suit, bubble helmet, moon boots
  asSuit: { layer: 0, sleeves: true, name: 'space suit', box: [-6, 48, 104, 216], draw(lw) {
    const p = P2('M30,52 C40,58 58,58 68,52 L76,58 C90,96 102,128 101,158 C99,180 88,196 86,214 L58,214 C57,192 55,178 49,174 C43,178 41,192 40,214 L12,214 C10,196 -1,180 -3,158 C-4,128 8,96 22,58 Z');
    ink(p, ofLG(50, 214, '#f4f6fb'), lw);
    ofClip(p, () => { ctx.fillStyle = '#ff8c42'; ctx.fillRect(-10, 190, 120, 7); ctx.fillStyle = 'rgba(42,16,80,.10)'; ctx.fillRect(80, 40, 40, 200); ctx.fillRect(-10, 40, 14, 200); });
    rrect(14, 98, 70, 8, 3, '#c9d2e0', OL, lw * 1.1);
    inkEllipse(26, 168, 7, 5, 0, '#c9d2e0', lw * 0.6); inkEllipse(72, 168, 7, 5, 0, '#c9d2e0', lw * 0.6);
    rrect(36, 64, 27, 22, 3, '#6b7a99', OL, lw * 1.1);
    inkCircle(42, 70, 2.4, '#ff4f6b', lw * 0.3); inkCircle(49.5, 70, 2.4, '#ffd23f', lw * 0.3); inkCircle(57, 70, 2.4, '#3ddc84', lw * 0.3);
    rrect(39, 76, 21, 6, 1.5, '#7fe3ff', OL, lw * 0.6);
    rrect(23, 62, 10, 7, 1, '#3a86ff', OL, lw * 0.6); star(28, 65.5, 2.2, '#ffffff', 5);
  }, over(lw) {
    ofSleeves(lw, '#f4f6fb');
    rrect(12, 119, 17, 6, 2, '#ff8c42', OL, lw * 1.1); rrect(69, 119, 17, 6, 2, '#ff8c42', OL, lw * 1.1);
  } },
  asHelmet: { layer: 1, name: 'space helmet', box: [14, -10, 86, 64], draw(lw) {
    ctx.beginPath(); ctx.arc(49, 24, 33, 0, Math.PI * 2);
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.stroke(); ctx.fillStyle = 'rgba(190,230,255,.28)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(49, 24, 27, Math.PI * 1.08, Math.PI * 1.45); ctx.stroke();
    ofShine(70, 8, 2.4, 2.4, 0, 0.9);
    inkEllipse(49, 56, 25, 7, 0, ofLG(49, 63, '#c9d2e0'), lw);
    dots([[36, 56], [62, 56]], 1.6, '#ff8c42');
  } },
  asBoots: { layer: 1, pair: true, name: 'moon boots', box: [-6, -18, 36, 10], one(x, y, lw) {
    ink(P2(`M${x - 10},${y + 7} L${x - 9},${y - 16} L${x + 9},${y - 16} L${x + 10},${y - 2} C${x + 13},${y} ${x + 13},${y + 7} ${x + 10},${y + 7} Z`), ofLG(y - 16, y + 7, '#f4f6fb'), lw);
    rrect(x - 11, y + 4, 24, 5, 2, '#8a96aa', OL, lw * 1.1);
    rrect(x - 9, y - 9, 18, 4, 1.5, '#3a86ff', OL, lw * 0.8);
  } },
  asFlag: { layer: 1, name: 'space flag', box: [72, 76, 108, 150], draw(lw) {
    ofRope([[81, 148], [81, 80]], '#c9d2e0', 2.4);
    ink(P2('M82,80 L106,82 L104,100 L82,98 Z'), ofLG(80, 100, '#9b5de5'), lw);
    inkCircle(93, 90, 4.2, '#ffd23f', lw * 0.5);
    ctx.strokeStyle = '#ff8fc8'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(93, 90, 8, 2.4, -0.3, 0, Math.PI * 2); ctx.stroke();
    star(86, 85, 1.6, '#fff', 4); star(101, 96, 1.6, '#fff', 4);
  } },
  // ---- Chef: white jacket with gingham apron, puffy hat, wooden spoon
  chefJacket: { layer: 0, sleeves: true, name: 'chef jacket and apron', box: [-4, 46, 102, 186], draw(lw) {
    ink(OF_COAT, ofLG(50, 184, '#ffffff'), lw);
    const ap = P2('M28,96 L70,96 C80,120 90,150 92,176 C64,184 34,184 6,176 C8,150 18,120 28,96 Z');
    ink(ap, ofLG(96, 182, '#ff6b8a'), lw);
    ofClip(ap, () => { ctx.fillStyle = 'rgba(255,255,255,.45)'; for (let x = 0; x < 100; x += 8) ctx.fillRect(x, 96, 4, 90); for (let y = 96; y < 186; y += 8) ctx.fillRect(0, y, 100, 4); });
    rrect(36, 122, 26, 18, 4, '#ffffff', OL, lw * 1.1); heart(49, 127, 10, '#ff5fa2');
    for (const y of [64, 76, 88]) { inkCircle(40, y, 2.2, '#e63946', lw * 0.4); inkCircle(58, y, 2.2, '#e63946', lw * 0.4); }
    ink(P2('M33,50 C42,56 56,56 65,50 L63,58 C56,62 42,62 35,58 Z'), '#e63946', lw * 0.8);
    ink(P2('M49,58 L44,70 L54,70 Z'), '#e63946', lw * 0.8);
  }, over(lw) { ofSleeves(lw, '#ffffff'); ofLine([[13, 120], [28, 120]], '#e4ecf8', 3); ofLine([[70, 120], [85, 120]], '#e4ecf8', 3); } },
  chefHat: { layer: 1, name: 'chef hat', box: [20, -44, 78, 14], draw(lw) {
    const puffs = [[33, -14, 10], [65, -14, 10], [40, -28, 10], [58, -28, 10], [49, -22, 13]];
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [x, y, r] of puffs) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
    for (const [x, y, r] of puffs) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(160,170,210,.25)'; ellipse(63, -10, 6, 4); ellipse(49, -14, 9, 3);
    rrect(29, -6, 40, 16, 4, '#ffffff', OL, lw * 1.6);
    for (const x of [37, 45, 53, 61]) ofLine([[x, -3], [x, 7]], '#dde2f0', 1.4);
    ofShine(42, -32, 3, 2, -0.5, 0.9);
  } },
  chefSpoon: { layer: 1, name: 'wooden spoon', box: [0, 78, 28, 150], draw(lw) {
    ofRope([[18, 146], [12, 100]], '#d9a066', 3.2);
    inkEllipse(11, 92, 6.5, 9, -0.1, ofLG(84, 100, '#d9a066'), lw);
    inkCircle(11, 85, 4.4, '#ff8fc8', lw * 0.5); inkCircle(11, 81, 2.6, '#ff8fc8', lw * 0.4); dots([[13, 84]], 0.9, '#ffffff');
  } },
  chefMitt: { layer: 1, name: 'oven mitt', box: [62, 122, 96, 158], draw(lw) {
    const body = P2('M73,128 L90,128 L92,146 C92,155 73,155 72,146 Z'), thumb = P2('M74,134 C64,132 63,143 70,147 Z');
    ofInkAll([[thumb, '#e63946'], [body, '#e63946']], lw);
    ofClip(body, () => { ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let x = 70; x < 96; x += 6) ctx.fillRect(x, 124, 3, 34); for (let y = 128; y < 158; y += 6) ctx.fillRect(66, y, 30, 3); });
    rrect(71, 124, 21, 7, 3, '#ffffff', OL, lw * 1.1);
  } },
  // ---- Firefighter: yellow coat with shiny stripes, red helmet
  ffCoat: { layer: 0, sleeves: true, name: 'firefighter coat', box: [-4, 46, 102, 186], draw(lw) {
    ink(OF_COAT, ofLG(50, 184, '#f2b33d'), lw);
    ofClip(OF_COAT, () => { for (const y of [112, 158]) { ctx.fillStyle = '#d9ff4f'; ctx.fillRect(-10, y, 120, 9); ctx.fillStyle = '#eef2fa'; ctx.fillRect(-10, y + 2.5, 120, 4); } });
    ofLine([[49, 62], [49, 180]], '#b07a10', 1.6);
    for (const y of [70, 88, 132, 146]) rrect(45, y, 9, 4, 1.5, '#2b2240', null);
    ink(P2('M29,51 C40,60 58,60 69,51 L71,61 C58,67 40,67 27,61 Z'), '#5a3a24', lw * 0.8);
  }, over(lw) {
    ofSleeves(lw, '#f2b33d');
    for (const s of OF_SLV) ofClip(s, () => { ctx.fillStyle = '#d9ff4f'; ctx.fillRect(0, 108, 100, 7); ctx.fillStyle = '#eef2fa'; ctx.fillRect(0, 110, 100, 3); });
  } },
  ffHelmet: { layer: 1, name: 'fire helmet', box: [10, -20, 88, 20], draw(lw) {
    const dome = P2('M24,9 C22,-18 76,-18 74,9 Z'), brim = P2('M10,11 C26,3 72,3 88,11 C90,19 76,19 70,14 L28,14 C22,19 8,19 10,11 Z');
    ofInkAll([[brim, '#c42536'], [dome, ofLG(-18, 9, '#ef3b4b')]], lw);
    rrect(46, -17, 6, 24, 3, '#ffd23f', OL, lw * 1.1);
    ink(P2('M40,-4 L58,-4 L58,4 C58,10 49,13 49,13 C49,13 40,10 40,4 Z'), ofLG(-4, 13, '#ffd23f'), lw);
    text('1', 49, 3, 10, '#c42536', 'center', 800);
    ofShine(32, -6, 2.5, 6, 0.5, 0.45);
  } },
  ffBoots: { layer: 1, pair: true, name: 'fire boots', box: [-4, -22, 34, 9], one(x, y, lw) {
    ofBoot(x, y, lw, '#2b2240', 20);
    rrect(x - 8, y - 12, 15, 4, 1, '#ffd23f', OL, lw * 0.8); rrect(x - 10, y + 4, 22, 3.5, 1.5, '#c42536', null);
  } },
  ffHose: { layer: 1, name: 'fire hose', box: [62, 92, 112, 164], draw(lw) {
    ctx.save(); ctx.lineCap = 'round';
    const h = new Path2D(); h.moveTo(66, 162); h.bezierCurveTo(60, 146, 74, 140, 81, 138); h.bezierCurveTo(88, 134, 88, 122, 90, 116);
    ctx.strokeStyle = OL; ctx.lineWidth = 8; ctx.stroke(h); ctx.strokeStyle = '#e63946'; ctx.lineWidth = 5.2; ctx.stroke(h);
    ctx.restore();
    ctx.save(); ctx.translate(91, 112); ctx.rotate(0.35); ink(P2('M-4,6 L4,6 L3,-8 L-3,-8 Z'), ofLG(0, 0, '#ffb627', -4, 4), lw); ctx.restore();
    for (let i = 0; i < 5; i++) { const k = (S.t * 1.4 + i / 5) % 1; inkCircle(94 + k * 12, 102 - k * 10 + k * k * 14, 2.4 - k, '#7fd6ff', lw * 0.4); }
  } },
  // ---- Ballerina: leotard and fluffy tutu, ribbon shoes, flower crown
  balTutu: { layer: 0, name: 'tutu', box: [-12, 48, 110, 158], draw(lw) {
    ink(P2('M32,52 C40,58 58,58 66,52 L72,92 L26,92 Z'), ofLG(52, 92, '#ff8fc8'), lw);
    dots([[40, 66], [49, 72], [58, 66], [44, 80], [54, 80]], 1.3, '#fff6a8');
    const layers = [[49, 138, 57, 19], [49, 122, 61, 22]];
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [x, y, rx, ry] of layers) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
    layers.forEach(([x, y, rx, ry], i) => {
      ctx.fillStyle = ofLG(y - ry, y + ry, ['#ffb0d6', '#ffd0e8'][i]); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(49, 122, 61, 22, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
    for (let x = -6; x <= 104; x += 8) { ctx.beginPath(); ctx.moveTo(49 + (x - 49) * 0.35, 104); ctx.lineTo(x, 140); ctx.stroke(); }
    for (const [x, y] of [[12, 124], [30, 134], [70, 132], [88, 122], [49, 140], [20, 146], [80, 146]]) star(x, y, 2.6, '#ffffff', 4);
    rrect(26, 88, 46, 7, 3, '#ff5fa2', OL, lw * 1.1);
  } },
  balShoes: { layer: 1, pair: true, name: 'ballet shoes', box: [-4, -30, 34, 10], one(x, y, lw) {
    ofRope([[x - 6, y - 2], [x + 6, y - 14], [x - 6, y - 26]], '#ff8fc8', 1.6);
    ofRope([[x + 6, y - 2], [x - 6, y - 14], [x + 6, y - 26]], '#ff8fc8', 1.6);
    inkEllipse(x + 1, y + 3, 9, 5, 0, ofLG(y - 2, y + 8, '#ffb0d6'), lw);
    ofShine(x - 2, y + 1, 3, 1.4, 0, 0.7);
  } },
  balCrown: { layer: 1, name: 'flower crown', box: [24, -10, 76, 14], draw(lw) {
    const fl = []; for (let i = 0; i < 7; i++) fl.push([30 + i * 6.5, 5 - Math.sin(i / 6 * Math.PI) * 7, ['#ff8fc8', '#ffffff', '#ffd23f', '#c77dff'][i % 4]]);
    const petals = []; for (const [x, y, c] of fl) for (let k = 0; k < 5; k++) { const a = k * 1.2566; petals.push([x + Math.cos(a) * 2.8, y + Math.sin(a) * 2.8, c]); }
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 1.6; for (const [x, y] of petals) { ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.stroke(); }
    for (const [x, y, c] of petals) { ctx.fillStyle = c; circle(x, y, 2.6); }
    for (const [x, y, c] of fl) { ctx.fillStyle = c === '#ffd23f' ? '#ff8c42' : '#ffd23f'; circle(x, y, 1.6); }
  } },
  balBow: { layer: 1, name: 'satin hair bow', box: [50, -14, 88, 22], draw(lw) {
    const l = P2('M68,4 C58,-10 50,-4 52,6 C54,14 62,10 68,4 Z'), r = P2('M68,4 C78,-10 88,-4 86,6 C84,14 74,10 68,4 Z');
    const t = P2('M66,6 L60,20 L64,19 L67,8 Z M70,6 L76,20 L72,19 L69,8 Z');
    ofInkAll([[t, '#ff5fa2'], [l, ofLG(-8, 12, '#ff5fa2')], [r, ofLG(-8, 12, '#ff5fa2')]], lw);
    inkCircle(68, 4, 3.4, '#ff8fc8', lw * 0.6); ofShine(57, 0, 2, 3, 0.5, 0.6); ofShine(80, 0, 2, 3, -0.5, 0.6);
  } },
  // ---- Wizard: starry robe, pointy hat, glowing wand, silly beard
  wizRobe: { layer: 0, sleeves: true, name: 'wizard robe', box: [-10, 48, 108, 222], draw(lw) {
    ink(OF_ROBE, ofLG(50, 220, '#3d4ec8'), lw);
    ofClip(OF_ROBE, () => { ctx.fillStyle = '#ffd23f'; ctx.fillRect(-10, 205, 120, 6); ctx.fillRect(47, 56, 4, 160); });
    for (const [x, y, r] of [[22, 112, 4], [74, 96, 3.5], [30, 168, 4.5], [70, 150, 4], [14, 196, 3], [88, 190, 3.5], [40, 132, 2.6], [60, 186, 3]]) star(x, y, r, '#ffe36b', 5);
    ctx.fillStyle = '#fff6c2'; ctx.beginPath(); ctx.arc(80, 128, 6, 0.6, 5.7); ctx.arc(82.5, 128, 5, 5.4, 0.9, true); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 146, 5, 0.6, 5.7); ctx.arc(22, 146, 4, 5.4, 0.9, true); ctx.fill();
    ofRope([[22, 92], [49, 96], [76, 92]], '#ffd23f', 2.6); ofRope([[60, 95], [62, 116]], '#ffd23f', 2); inkCircle(62, 118, 2.6, '#ffd23f', lw * 0.5);
  }, over(lw) { ofSleeves(lw, '#3d4ec8', OF_BELL); ofRope([[3, 131], [29, 129]], '#ffd23f', 2); ofRope([[95, 131], [69, 129]], '#ffd23f', 2); } },
  wizHat: { layer: 1, name: 'wizard hat', box: [8, -62, 92, 16], draw(lw) {
    const brim = P2('M8,8 C20,0 78,0 90,8 C80,16 18,16 8,8 Z');
    const cone = P2('M24,8 C34,-8 40,-30 50,-48 C54,-56 64,-60 74,-52 C66,-52 60,-44 60,-34 C62,-14 70,-2 74,8 Z');
    ofInkAll([[brim, ofLG(2, 14, '#3d4ec8')], [cone, ofLG(-58, 8, '#4a5ad8', 24, 74)]], lw);
    rrect(26, 0, 48, 6, 2, '#ffd23f', OL, lw * 1.1);
    star(44, -14, 4.2, '#ffe36b', 5); star(55, -30, 3.2, '#ffe36b', 5); star(36, -4, 2.4, '#ffe36b', 5);
    ofOutlinedStar(74, -52, 4 + Math.sin(S.t * 5), '#fff6a8');
    ofShine(40, -20, 2, 9, 0.5, 0.25);
  } },
  wizWand: { layer: 1, name: 'magic wand', box: [70, 68, 112, 150], draw(lw) {
    ofRope([[81, 144], [94, 92]], '#6b3f2a', 3.2);
    ctx.save(); ctx.shadowColor = '#ffe36b'; ctx.shadowBlur = 14;
    ofOutlinedStar(96, 84, 9 + Math.sin(S.t * 6) * 1.2, '#ffe36b'); ctx.restore();
    ofShine(94, 81, 2, 1.4, -0.5, 0.9);
    for (let i = 0; i < 3; i++) star(96 + Math.cos(S.t * 3 + i * 2.1) * 13, 84 + Math.sin(S.t * 3 + i * 2.1) * 13, 2.6, '#ffffff', 4);
  } },
  wizBeard: { layer: 1, name: 'silly wizard beard', box: [26, 24, 72, 94], draw(lw) {
    ofLine([[33, 36], [30, 26]], '#c9d2e0', 1); ofLine([[65, 36], [68, 26]], '#c9d2e0', 1);
    ink(P2('M32,36 C28,50 32,66 38,76 C40,86 46,94 49,92 C52,94 58,86 60,76 C66,66 70,50 66,36 C62,44 56,46 49,44 C42,46 36,44 32,36 Z'), ofLG(36, 94, '#ffffff'), lw);
    ctx.strokeStyle = '#c9d2e0'; ctx.lineWidth = 1.2;
    for (const [x, y] of [[40, 56], [52, 62], [44, 72], [56, 50], [48, 82]]) { ctx.beginPath(); ctx.arc(x, y, 3, 0.3, 2.8); ctx.stroke(); }
    inkEllipse(43, 39, 7, 3.4, 0.2, '#ffffff', lw * 0.8); inkEllipse(55, 39, 7, 3.4, -0.2, '#ffffff', lw * 0.8);
  } },
  // ---- Superhero: blue suit, red cape, lightning emblem
  shSuit: { layer: 0, sleeves: true, name: 'super suit', box: [-4, 48, 102, 162], draw(lw) {
    ofInkAll([[OF_SKIRT, ofLG(88, 160, '#e63946')], [OF_TORSO, ofLG(52, 94, '#3a6cf0')]], lw);
    for (const [x, y] of [[14, 140], [36, 146], [62, 146], [84, 140], [49, 120], [28, 118], [70, 118]]) star(x, y, 3, '#ffd23f', 5);
    rrect(22, 86, 54, 8, 3, '#ffd23f', OL, lw * 1.1);
    ink(P2('M37,61 L61,61 L61,69 C61,77 49,84 49,84 C49,84 37,77 37,69 Z'), ofLG(61, 84, '#ffd23f'), lw);
    ink(P2('M52,63 L43,74 L49,74 L45,82 L56,69 L50,69 L54,63 Z'), '#e63946', lw * 0.6);
  }, over(lw) { ofSleeves(lw, '#3a6cf0'); rrect(12, 120, 17, 7, 2, '#ffd23f', OL, lw * 1.1); rrect(69, 120, 17, 7, 2, '#ffd23f', OL, lw * 1.1); } },
  shCape: { layer: 0, name: 'super cape', box: [-18, 50, 116, 206], draw(lw) {
    const w = Math.sin(S.t * 4) * 3;
    const l = P2(`M26,55 C12,80 -4,140 -14,${196 + w} C-6,${200 - w} 2,${194 + w} 10,${200 + w} C12,150 18,100 30,60 Z`);
    const r = P2(`M72,55 C86,80 102,140 112,${196 - w} C104,${200 + w} 96,${194 - w} 88,${200 - w} C86,150 80,100 68,60 Z`);
    ofInkAll([[l, ofLG(0, 0, '#e63946', -14, 30)], [r, ofLG(0, 0, '#e63946', 112, 68)]], lw);
    inkCircle(30, 58, 4, '#ffd23f', lw * 0.6); inkCircle(68, 58, 4, '#ffd23f', lw * 0.6);
  } },
  shBoots: { layer: 1, pair: true, name: 'super boots', box: [-4, -24, 34, 9], one(x, y, lw) {
    ofBoot(x, y, lw, '#e63946', 18);
    ink(P2(`M${x - 10},${y - 22} L${x + 9},${y - 22} L${x + 6},${y - 14} L${x - 0.5},${y - 18} L${x - 7},${y - 14} Z`), '#ffd23f', lw);
  } },
  shMask: { layer: 1, name: 'super mask', box: [22, 16, 76, 38], draw(lw) {
    const p = new Path2D('M28,25 C32,17 44,19 49,24 C54,19 66,17 70,25 C68,34 58,36 49,31 C40,36 30,34 28,25 Z');
    p.moveTo(46.5, 27); p.ellipse(42.5, 27, 4, 3, 0, 0, Math.PI * 2); p.moveTo(59.5, 27); p.ellipse(55.5, 27, 4, 3, 0, 0, Math.PI * 2);
    ink(P2('M28,25 L22,20 L24,30 Z M70,25 L76,20 L74,30 Z'), '#e63946', lw * 0.7);
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.stroke(p); ctx.fillStyle = '#e63946'; ctx.fill(p, 'evenodd');
    ofShine(36, 23, 3, 1.2, -0.3, 0.5);
  } },
  // ---- Cowgirl: plaid shirt, fringe vest and skirt, big hat
  cbVest: { layer: 0, sleeves: true, name: 'fringe vest', box: [-6, 48, 104, 168], draw(lw) {
    ofInkAll([[OF_SKIRT, ofLG(88, 160, '#d9a066')], [OF_TORSO, '#e63946']], lw);
    ofClip(OF_TORSO, () => { ctx.fillStyle = 'rgba(110,10,30,.35)'; for (let x = 18; x < 82; x += 9) ctx.fillRect(x, 50, 4, 50); for (let y = 58; y < 96; y += 9) ctx.fillRect(10, y, 80, 4); });
    ctx.save(); ctx.lineCap = 'round';
    for (let x = 0; x <= 98; x += 4.5) { const y = 152 + Math.sin(x / 98 * Math.PI) * 6; ofRope([[x, y], [x + 0.5, y + 10]], '#c98a4b', 1.6); }
    ctx.restore();
    ink(P2('M24,58 L38,58 C40,74 40,86 38,96 L16,98 C14,84 18,70 24,58 Z'), ofLG(56, 98, '#8a5a3c'), lw);
    ink(P2('M74,58 L60,58 C58,74 58,86 60,96 L82,98 C84,84 80,70 74,58 Z'), ofLG(56, 98, '#8a5a3c'), lw);
    ofOutlinedStar(29, 74, 5, '#e8eef8', 5);
    ctx.strokeStyle = '#8a5a3c'; ctx.setLineDash([2, 2]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, 112); ctx.quadraticCurveTo(49, 120, 84, 112); ctx.stroke(); ctx.setLineDash([]);
  }, over(lw) {
    for (const s of OF_SLV) { ink(s, '#e63946', lw); ofClip(s, () => { ctx.fillStyle = 'rgba(110,10,30,.35)'; for (let y = 60; y < 130; y += 9) ctx.fillRect(0, y, 100, 4); }); }
  } },
  cbHat: { layer: 1, name: 'cowgirl hat', box: [4, -28, 94, 16], draw(lw) {
    const brim = P2('M4,4 C10,14 30,12 49,12 C68,12 88,14 94,4 C90,-2 82,4 72,4 L26,4 C16,4 8,-2 4,4 Z');
    const crown = P2('M28,6 C26,-12 32,-26 41,-22 C45,-19 53,-19 57,-22 C66,-26 72,-12 70,6 Z');
    ofInkAll([[brim, ofLG(-2, 14, '#c98a4b')], [crown, ofLG(-26, 6, '#d99a58')]], lw);
    rrect(29, -5, 40, 7, 1, '#6b3f2a', null);
    ofOutlinedStar(49, -1.5, 4.4, '#e8eef8', 5);
    ofLine([[49, -19], [49, -9]], 'rgba(110,60,20,.45)', 1.4); ofShine(37, -12, 2.6, 6, 0.2, 0.35);
  } },
  cbBoots: { layer: 1, pair: true, name: 'cowgirl boots', box: [-4, -22, 40, 10], one(x, y, lw) {
    ink(P2(`M${x - 7},${y + 5} L${x - 8},${y - 20} L${x - 2},${y - 17} L${x + 6},${y - 20} L${x + 6},${y - 4} C${x + 12},${y - 2} ${x + 16},${y + 3} ${x + 16},${y + 5} Z`), ofLG(y - 20, y + 6, '#c98a4b'), lw);
    rrect(x - 8, y + 4, 6, 4, 1, '#6b3f2a', OL, lw * 0.8);
    star(x - 1, y - 10, 3.6, '#ffd23f', 5);
  } },
  cbBandana: { layer: 1, name: 'bandana', box: [26, 44, 72, 86], draw(lw) {
    ink(P2('M30,49 C40,57 58,57 68,49 L67,57 C60,64 54,72 49,82 C44,72 38,64 31,57 Z'), ofLG(49, 82, '#e63946'), lw);
    dots([[40, 60], [49, 64], [58, 60], [45, 72], [53, 72], [49, 78]], 1.3, '#ffffff');
    inkCircle(68, 52, 3, '#e63946', lw * 0.6);
  } },
  // ---- Mermaid: shimmering tail, shell top, sea crown
  mmTail: { layer: 0, name: 'mermaid tail', box: [-8, 80, 106, 228], draw(lw) {
    const p = P2('M28,84 L70,84 C86,108 101,130 101,150 C100,172 84,186 76,198 C88,204 100,212 106,226 C88,223 66,221 49,214 C32,221 10,223 -8,226 C-2,212 12,204 22,198 C14,186 -2,172 -3,150 C-3,130 12,108 28,84 Z');
    const gr = ctx.createLinearGradient(0, 84, 0, 226); gr.addColorStop(0, '#5ff0d8'); gr.addColorStop(0.5, '#2ec4b6'); gr.addColorStop(1, '#9b5de5');
    ink(p, gr, lw);
    ofClip(p, () => {
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.2;
      for (let y = 92, r = 0; y < 200; y += 8, r++) for (let x = -10 + (r % 2) * 5; x < 110; x += 10) { ctx.beginPath(); ctx.arc(x, y, 5, 0.2, Math.PI - 0.2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(42,16,80,.12)'; ctx.fillRect(80, 80, 40, 150);
    });
    for (const [a, b] of [[[49, 214], [14, 220]], [[49, 214], [84, 220]], [[49, 214], [30, 222]], [[49, 214], [68, 222]]]) ofLine([a, b], 'rgba(255,255,255,.5)', 1.2);
    for (let i = 0; i < 4; i++) star(20 + i * 20, 110 + ((i * 37 + S.t * 20) % 80), 2.6 + Math.sin(S.t * 4 + i), '#ffffff', 4);
    rrect(26, 82, 46, 6, 3, '#ffc2df', OL, lw * 1.1); dots([[33, 85], [41, 85], [49, 85], [57, 85], [65, 85]], 1.3, '#ffffff');
  } },
  mmShells: { layer: 1, name: 'seashell top', box: [28, 50, 70, 80], draw(lw) {
    ofLine([[34, 54], [41, 64]], OL, 2.6); ofLine([[64, 54], [57, 64]], OL, 2.6); ofLine([[34, 54], [41, 64]], '#ff8fc8', 1.2); ofLine([[64, 54], [57, 64]], '#ff8fc8', 1.2);
    for (const x of [41, 57]) {
      ink(P2(`M${x},${75} L${x - 9},${66} C${x - 7},${58} ${x + 7},${58} ${x + 9},${66} Z`), ofLG(58, 75, '#c77dff'), lw);
      for (const d of [-5, 0, 5]) ofLine([[x, 74], [x + d, 62]], 'rgba(255,255,255,.6)', 1);
    }
    inkCircle(49, 70, 2.4, '#ffffff', lw * 0.5);
  } },
  mmCrown: { layer: 1, name: 'sea crown', box: [26, -14, 74, 12], draw(lw) {
    for (let i = 0; i <= 8; i++) inkCircle(30 + i * 4.8, 6 - Math.sin(i / 8 * Math.PI) * 6, 1.8, '#fbf6ff', lw * 0.4);
    ofOutlinedStar(38, -2, 7, '#ff8c42', 5); dots([[38, -2]], 1.2, '#ffd9a0');
    ink(P2('M58,4 L50,-6 C52,-12 64,-12 66,-6 Z'), ofLG(-10, 4, '#ff8fc8'), lw);
    for (const d of [-4, 0, 4]) ofLine([[58, 3], [58 + d, -8]], 'rgba(255,255,255,.6)', 1);
  } },
  mmTrident: { layer: 1, name: 'golden trident', box: [66, 50, 98, 154], draw(lw) {
    ofRope([[81, 150], [81, 70]], '#ffd23f', 2.6);
    ink(P2('M71,72 L91,72 L91,60 L88,52 L86,68 L83,68 L81,50 L79,68 L76,68 L74,52 L71,60 Z'), ofLG(50, 72, '#ffd23f'), lw);
    inkCircle(81, 76, 2.6, '#5ff0d8', lw * 0.5);
  } },
};
const ofPiece = id => OF_WEAR[id] || CLOTHES[id];
const ofName = id => OF_WEAR[id]?.name || OF_OLD_NAMES[id] || id;
// Aubrey wearing a list of pieces (old CLOTHES or new OF_WEAR), same layering as drawDressedAubrey
// ghosts: pieces still to find, drawn as soft white silhouettes; snaps: {id: scale} for a piece popping into place
function ofDressed(x, gy, h, worn, lift = 0, ghosts = [], snaps = {}) {
  const im = IMG.idle_front, s = h / im.height, lw = 1.2 / s;
  drawAubrey(x, gy, 'idle_front', 1, lift, s);
  ctx.save(); ctx.translate(x - im.width * s / 2, gy - lift - h); ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // scale a piece about its own middle (or each foot) while it snaps on
  const sized = (id, c, fn) => {
    const k = snaps[id];
    if (!k || k === 1) return fn();
    ctx.save();
    const [cx, cy] = c.pair ? [0, 0] : [(c.box[0] + c.box[2]) / 2, (c.box[1] + c.box[3]) / 2];
    ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); fn(); ctx.restore();
  };
  const paint = (id, c) => (c.pair ? AUB_FEET.forEach(([fx, fy]) => {
    const k = snaps[id] || 1; ctx.save(); ctx.translate(fx, fy); ctx.scale(k, k); c.one(0, 0, lw); ctx.restore();
  }) : sized(id, c, () => c.draw(lw)));
  if (ghosts.length) {
    // dashed 'ghost' outlines of the pieces still to find (cached; drawn in sprite space)
    const gi = ofGhostImage(ghosts);
    ctx.save(); ctx.globalAlpha = 0.75 + 0.25 * Math.sin(S.t * 3);
    ctx.drawImage(gi, -OF_GPAD, -OF_GPAD, im.width + OF_GPAD * 2, im.height + OF_GPAD * 2);
    ctx.restore();
  }
  const items = worn.map(id => [id, ofPiece(id)]);
  for (const [id, c] of items) if (c.layer === 0) paint(id, c);
  if (items.some(([, c]) => c.layer === 0)) ctx.drawImage(aubArmsImage(), 0, 0);
  for (const [id, c] of items) if (c.over) sized(id, c, () => c.over(lw));
  for (const [id, c] of items) if (c.layer === 1) paint(id, c);
  ctx.restore();
}

// ghost outlines, rendered once per set of pieces into a canvas covering the sprite (plus a margin for hats and props)
const OF_GPAD = 70, ofGhostCache = new Map();
function ofGhostImage(ids) {
  const key = ids.join(',');
  if (ofGhostCache.has(key)) return ofGhostCache.get(key);
  if (ofGhostCache.size > 80) ofGhostCache.clear();
  const R = 3, im = IMG.idle_front, cw = (im.width + OF_GPAD * 2) * R, ch = (im.height + OF_GPAD * 2) * R;
  const mk = () => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };
  const a = mk(), b = mk(), out = mk(), main = ctx, lw = 1.2;
  ctx = a.getContext('2d');
  try {
    ctx.scale(R, R); ctx.translate(OF_GPAD, OF_GPAD); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const id of ids) { const c = ofPiece(id); if (c.pair) AUB_FEET.forEach(([fx, fy]) => c.one(fx, fy, lw)); else c.draw(lw); c.over?.(lw); }
  } finally { ctx = main; }
  const ax = a.getContext('2d'); ax.globalCompositeOperation = 'source-in'; ax.fillStyle = '#ffffff'; ax.fillRect(0, 0, cw, ch);
  // rim = silhouette grown by a few pixels, minus the silhouette, kept only on diagonal stripes so it reads as dashes
  const bx = b.getContext('2d'), d = 2.2 * R;
  for (let k = 0; k < 12; k++) bx.drawImage(a, Math.cos(k * Math.PI / 6) * d, Math.sin(k * Math.PI / 6) * d);
  bx.globalCompositeOperation = 'source-in'; bx.fillStyle = '#7a4fc4'; bx.fillRect(0, 0, cw, ch);
  bx.globalCompositeOperation = 'destination-out'; bx.drawImage(a, 0, 0);
  const T = 8 * R, st = document.createElement('canvas'); st.width = st.height = T;
  const sx = st.getContext('2d'); sx.strokeStyle = '#000'; sx.lineWidth = T * 0.36;
  for (const o of [-T, 0, T]) { sx.beginPath(); sx.moveTo(o, T); sx.lineTo(o + T, 0); sx.stroke(); }
  bx.globalCompositeOperation = 'destination-in'; bx.fillStyle = bx.createPattern(st, 'repeat'); bx.fillRect(0, 0, cw, ch);
  const ox = out.getContext('2d');
  ox.globalAlpha = 0.38; ox.drawImage(a, 0, 0); ox.globalAlpha = 1; ox.drawImage(b, 0, 0);
  ofGhostCache.set(key, out);
  return out;
}
// ---- each look gets its own little scene behind Aubrey: [scene, accent colour]
const OF_THEME = { Casual: ['park', '#4fae6a'], Fancy: ['castle', '#9b5de5'], Pajamas: ['bedroom', '#5b7fe0'], Swimming: ['beach', '#1ea8d8'], 'Snow Day': ['snow', '#4f8fd8'],
  Pirate: ['ship', '#8a5a3c'], 'Space Knight': ['nebula', '#7a4fc4'], Scientist: ['lab', '#1fa89b'], Doctor: ['hospital', '#e63946'], Astronaut: ['moon', '#3a6cf0'],
  Chef: ['kitchen', '#f07a2a'], Firefighter: ['firestation', '#c42536'], Ballerina: ['stage', '#ff5fa2'], Wizard: ['tower', '#5a32a0'], Superhero: ['city', '#e63946'],
  Cowgirl: ['ranch', '#c9783b'], Mermaid: ['reef', '#1a8fb4'] };
const ofFill = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const ofV = (y0, y1, a, b) => { const gr = ctx.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
function ofTwinkles(w, h, n, col = '#fff6c2') { for (let i = 0; i < n; i++) star((i * 97 + 13) % w, (i * 53 + 17) % (h * 0.6), 1.4 + (Math.sin(S.t * 3 + i * 1.7) + 1) * 1.3, col, 4); }
function ofMoon(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0.6, 5.7); ctx.arc(x + r * 0.45, y - r * 0.1, r * 0.8, 5.4, 0.9, true); ctx.fill(); }
function ofBubbles(w, h, n, x0 = 0) { for (let i = 0; i < n; i++) { const k = (S.t * 0.25 + i / n) % 1; inkCircle(x0 + (i * 71) % w + Math.sin(k * 9 + i) * 5, h - k * h, 2.5 + (i % 3), 'rgba(220,250,255,.6)', 0.6, 'rgba(255,255,255,.9)'); } }
// scenes draw in card space: (0,0) top-left, w x h, Aubrey's feet at y ≈ h - 18
const OF_SCENES = {
  park(w, h) {
    ofFill(ofV(0, h, '#8fd8ff', '#e8fbff'), 0, 0, w, h);
    ctx.fillStyle = 'rgba(255,236,120,.4)'; circle(236, 50, 36); inkCircle(236, 50, 21, '#ffe36b', 1.5);
    ctx.fillStyle = '#ffffff'; ellipse(58, 48, 28, 11); ellipse(80, 41, 18, 11); ellipse(150, 74, 20, 8);
    ctx.fillStyle = '#a6e88a'; ellipse(40, h + 10, 170, 90); ctx.fillStyle = '#84d466'; ellipse(270, h + 20, 180, 100);
    for (const [x, y, r] of [[36, 190, 30], [256, 204, 26]]) { inkRect(x - 5, y, 10, 70, '#8a5a3c', 1.5, 3); inkCircle(x, y - 6, r, '#5fbf5a', 1.5); ctx.fillStyle = '#86dc74'; circle(x - r * 0.3, y - r * 0.4 - 6, r * 0.45); }
    for (let i = 0; i < 10; i++) { ctx.fillStyle = ['#ff8fc8', '#ffffff', '#ffd23f'][i % 3]; circle(12 + i * 30, h - 30 + (i % 2) * 12, 3.5); }
  },
  castle(w, h) {
    ofFill(ofV(0, h, '#e9c6ff', '#fff0f8'), 0, 0, w, h); ofTwinkles(w, h, 10, '#ffffff');
    const stone = '#efe2fb';
    for (const [x, tw, ty] of [[14, 50, 110], [226, 50, 96]]) {
      inkRect(x, ty, tw, h - ty, stone, 1.5, 2);
      ctx.fillStyle = OL; tri(x - 6, ty + 1, x + tw + 6, ty + 1, x + tw / 2, ty - 46); ctx.fillStyle = '#ff8fc8'; tri(x - 3, ty - 1, x + tw + 3, ty - 1, x + tw / 2, ty - 42);
      ctx.fillStyle = '#ffd23f'; tri(x + tw / 2, ty - 58, x + tw / 2 + 16 + Math.sin(S.t * 4) * 3, ty - 52, x + tw / 2, ty - 46);
      rrect(x + tw / 2 - 7, ty + 26, 14, 20, [7, 7, 0, 0], '#7a4fc4', OL, 1.5);
    }
    inkRect(64, 150, 162, h - 150, '#e4d2f6', 1.5, 2);
    for (let x = 64; x < 226; x += 18) inkRect(x, 140, 10, 12, '#e4d2f6', 1.2, 1);
    ctx.fillStyle = 'rgba(122,79,196,.25)'; for (let y = 166; y < h; y += 16) for (let x = 70 + (y % 32 ? 8 : 0); x < 220; x += 30) ctx.fillRect(x, y, 14, 3);
  },
  bedroom(w, h) {
    ofFill(ofV(0, h, '#3b3f8f', '#5a4fb0'), 0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 14; y < h - 60; y += 28) for (let x = (y % 56 ? 14 : 0); x < w; x += 28) star(x, y, 4, 'rgba(255,255,255,.12)', 5);
    inkRect(182, 34, 86, 96, '#fff4d8', 1.5, 6); ofFill(ofV(40, 124, '#141448', '#3a2b7a'), 189, 41, 72, 82);
    ofMoon(212, 70, 13, '#fff6a8'); star(244, 56, 3.5, '#fff', 5); star(236, 100, 2.5, '#fff', 5); star(200, 106, 2.5, '#fff', 5);
    ofLine([[225, 41], [225, 123]], '#fff4d8', 4); ofLine([[189, 82], [261, 82]], '#fff4d8', 4);
    ink(P2('M176,28 C190,60 180,110 192,140 L172,140 L170,28 Z'), '#ff8fc8', 1.5); ink(P2('M274,28 C260,60 270,110 258,140 L278,140 L280,28 Z'), '#ff8fc8', 1.5);
    ofFill('#7a5ac8', 0, h - 52, w, 52); inkEllipse(145, h - 22, 110, 16, 0, '#ff8fc8', 1.2);
    // bedside table with a glowing lamp
    inkRect(14, h - 108, 54, 60, '#c98a4b', 2.5, 4); rrect(20, h - 92, 42, 14, 3, '#b07a40', OL, 1.5); inkCircle(41, h - 85, 2, '#ffd23f', 0.8);
    ctx.fillStyle = 'rgba(255,240,170,.4)'; circle(41, h - 150, 42);
    inkRect(38, h - 140, 6, 32, '#fff4d8', 2, 2); inkRect(28, h - 112, 26, 5, '#fff4d8', 2, 2);
    ink(P2(`M26,${h - 136} L56,${h - 136} L49,${h - 166} L33,${h - 166} Z`), ofLG(h - 166, h - 136, '#ffe36b'), 1.4);
  },
  beach(w, h) {
    ofFill(ofV(0, 170, '#7fd6ff', '#dff7ff'), 0, 0, w, 170);
    inkCircle(240, 48, 20, '#ffe36b', 1.5); ctx.fillStyle = '#fff'; ellipse(60, 52, 26, 10);
    ofFill(ofV(160, 240, '#3ec8ff', '#1e8fd0'), 0, 160, w, 80);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, 176 + r * 20 + Math.sin(x * 0.08 + S.t * 2 + r) * 3); ctx.stroke(); }
    ctx.fillStyle = '#ffe6a8'; ctx.beginPath(); ctx.moveTo(0, 236); for (let x = 0; x <= w; x += 10) ctx.lineTo(x, 232 + Math.sin(x * 0.05) * 4); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    ofLine([[44, 156], [52, 270]], OL, 5); ofLine([[44, 156], [52, 270]], '#ffffff', 2.4);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#ff5f7a'; ctx.beginPath(); ctx.moveTo(44, 150); ctx.arc(44, 150, 44, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.fill(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(44, 150, 44, Math.PI, 0); ctx.closePath(); ctx.stroke();
    star(250, h - 26, 8, '#ff8c42', 5); inkEllipse(230, h - 14, 6, 4, 0.3, '#ffc2df', 1);
  },
  snow(w, h) {
    ofFill(ofV(0, h, '#bcdcff', '#f2f8ff'), 0, 0, w, h);
    ctx.fillStyle = '#ffffff'; ellipse(40, h, 160, 100); ctx.fillStyle = '#eef6ff'; ellipse(270, h + 10, 170, 110);
    for (const [x, y, s] of [[34, 240, 1], [258, 228, 1.2], [230, 250, 0.7]]) {
      inkRect(x - 4 * s, y, 8 * s, 18 * s, '#8a5a3c', 1.2, 2);
      for (let k = 0; k < 3; k++) { const ty = y - k * 22 * s; ctx.fillStyle = OL; tri(x - (32 - k * 6) * s - 2, ty + 2, x + (32 - k * 6) * s + 2, ty + 2, x, ty - 34 * s - 2); ctx.fillStyle = '#2f9a5a'; tri(x - (32 - k * 6) * s, ty, x + (32 - k * 6) * s, ty, x, ty - 34 * s); ctx.fillStyle = '#ffffff'; tri(x - 8 * s, ty - 26 * s, x + 8 * s, ty - 26 * s, x, ty - 34 * s); }
    }
    for (let i = 0; i < 18; i++) { ctx.fillStyle = '#ffffff'; circle((i * 53 + Math.sin(S.t + i) * 8) % w, (S.t * 26 + i * 41) % h, 2 + (i % 3)); }
  },
  ship(w, h) {
    ofFill(ofV(0, 200, '#6fd0ff', '#dff6ff'), 0, 0, w, 200);
    ofFill(ofV(190, 240, '#2aa8e0', '#1a6fb0'), 0, 190, w, 60);
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, 204 + Math.sin(x * 0.1 + S.t * 2) * 3); ctx.stroke();
    ofLine([[252, 6], [252, 240]], OL, 10); ofLine([[252, 6], [252, 240]], '#8a5a3c', 6);
    ink(P2('M200,40 C214,70 214,120 200,150 L248,150 L248,40 Z'), ofV(40, 150, '#fffaf0', '#f0e2c4'), 1.5);
    ink(P2('M254,10 L284,14 L280,30 L254,28 Z'), '#2b2240', 1.2); ctx.fillStyle = '#fff'; circle(268, 19, 4); ctx.fillRect(266, 21, 4, 3);
    ofFill('#8a5a3c', 0, 236, w, 6);
    for (let x = 6; x < w; x += 24) inkRect(x, 216, 6, 26, '#a0683c', 1.2, 2);
    inkRect(-4, 210, w + 8, 8, '#7a4a2c', 1.5, 3);
    ofFill(ofV(242, h, '#c08050', '#8a5a3c'), 0, 242, w, h - 242);
    ctx.strokeStyle = 'rgba(70,35,15,.45)'; ctx.lineWidth = 1.5; for (let y = 254; y < h; y += 13) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ofLine([[40, 60], [46, 54], [52, 60]], OL, 2); ofLine([[64, 44], [70, 38], [76, 44]], OL, 2);
  },
  nebula(w, h) {
    ofFill(ofV(0, h, '#120c36', '#3a2470'), 0, 0, w, h);
    for (const [x, y, r, c] of [[70, 90, 90, 'rgba(255,95,190,.28)'], [230, 150, 100, 'rgba(80,200,255,.24)']]) { const gr = ctx.createRadialGradient(x, y, 4, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); }
    ofTwinkles(w, h, 22);
    inkCircle(56, 64, 26, ofLG(38, 90, '#ff9a5a'), 1.5);
    ctx.strokeStyle = '#ffd6a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(56, 64, 42, 9, -0.3, 0, Math.PI * 2); ctx.stroke();
    inkCircle(246, 40, 9, '#9fd3ff', 1.2);
    ofFill('#2a1d5a', 0, h - 40, w, 40); ctx.save(); ctx.shadowColor = '#4dfcff'; ctx.shadowBlur = 10; ofLine([[0, h - 40], [w, h - 40]], '#7ff4ff', 2.5); ctx.restore();
    for (let x = 20; x < w; x += 50) rrect(x, h - 30, 26, 6, 3, 'rgba(127,244,255,.35)', null);
  },
  lab(w, h) {
    ofFill(ofV(0, h, '#e2fbf4', '#c8efe6'), 0, 0, w, h);
    ctx.strokeStyle = 'rgba(31,168,155,.18)'; ctx.lineWidth = 1; for (let x = 0; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y < h; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    inkRect(22, 28, 64, 54, '#ffffff', 1.5, 4);
    ctx.strokeStyle = '#3a86ff'; ctx.lineWidth = 2; for (const a of [0, 1.05, 2.1]) { ctx.beginPath(); ctx.ellipse(54, 55, 22, 8, a, 0, Math.PI * 2); ctx.stroke(); } inkCircle(54, 55, 4, '#ff5f7a', 1);
    inkRect(184, 96, 96, 8, '#c98a4b', 1.5, 2);
    for (const [x, c] of [[198, '#ff5fa2'], [226, '#ffd23f'], [254, '#7d6aff']]) { ink(P2(`M${x - 4},70 L${x + 4},70 L${x + 4},80 L${x + 12},96 L${x - 12},96 L${x - 4},80 Z`), 'rgba(230,248,255,.9)', 1.2); ctx.fillStyle = c; tri(x - 10, 95, x + 10, 95, x, 84); }
    inkRect(-4, h - 56, w + 8, 14, '#c9d2e0', 1.5, 3); ofFill('#9aa8c0', 0, h - 42, w, 42);
    ink(P2(`M250,${h - 96} L262,${h - 96} L262,${h - 80} L276,${h - 58} L236,${h - 58} L250,${h - 80} Z`), 'rgba(230,248,255,.9)', 1.2);
    ctx.fillStyle = '#7dff6a'; tri(240, h - 59, 272, h - 59, 256, h - 72);
    for (let i = 0; i < 4; i++) { const k = (S.t * 0.8 + i / 4) % 1; inkCircle(256 + Math.sin(k * 7 + i) * 4, h - 100 - k * 40, 2 + k * 3, 'rgba(190,255,170,.9)', 0.6); }
  },
  hospital(w, h) {
    ofFill(ofV(0, h, '#e6f6ff', '#fafdff'), 0, 0, w, h);
    ofFill('#bfeee6', 0, 168, w, 12);
    inkCircle(232, 62, 32, '#ffffff', 1.5); ofFill('#e63946', 225, 40, 14, 44); ofFill('#e63946', 210, 55, 44, 14);
    inkRect(16, 36, 84, 58, '#1b2b3a', 1.5, 6);
    ctx.save(); ctx.shadowColor = '#5fff8a'; ctx.shadowBlur = 6; ctx.strokeStyle = '#5fff8a'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= 72; x += 2) { const p = ((x + S.t * 40) % 36); ctx.lineTo(22 + x, 66 - (p > 14 && p < 18 ? 16 : p > 18 && p < 21 ? -8 : 0)); } ctx.stroke(); ctx.restore();
    heart(84, 42, 10, '#ff5f7a');
    for (let x = 0; x < w; x += 24) for (let y = h - 46; y < h; y += 24) ofFill(((x + y) / 24) % 2 ? '#e8f0fa' : '#d4e2f2', x, y, 24, 24);
    inkRect(250, h - 82, 24, 26, '#ff8c42', 1.2, 4); for (const [dx, dy] of [[-10, -12], [10, -14], [0, -24]]) inkEllipse(262 + dx, h - 82 + dy, 8, 12, dx * 0.06, '#4fbf6a', 1);
  },
  moon(w, h) {
    ofFill(ofV(0, h, '#05082a', '#1d1b5a'), 0, 0, w, h); ofTwinkles(w, h, 24);
    inkCircle(234, 58, 26, ofLG(32, 84, '#3a86ff'), 1.5);
    ctx.fillStyle = '#4fdf7a'; ellipse(226, 52, 9, 6, 0.4); ellipse(244, 66, 7, 9, -0.3);
    const rk = Math.sin(S.t * 2) * 3;
    inkRect(34, 150 + rk, 22, 48, '#ffffff', 1.5, 8); ctx.fillStyle = OL; tri(30, 154 + rk, 60, 154 + rk, 45, 128 + rk); ctx.fillStyle = '#ff5f7a'; tri(33, 152 + rk, 57, 152 + rk, 45, 131 + rk);
    inkCircle(45, 168 + rk, 5, '#7fe3ff', 1); ctx.fillStyle = '#ffb627'; tri(38, 198 + rk, 52, 198 + rk, 45, 214 + rk + Math.sin(S.t * 20) * 3);
    ctx.fillStyle = '#c9cfe0'; ctx.beginPath(); ctx.moveTo(0, h - 50); ctx.quadraticCurveTo(w / 2, h - 80, w, h - 46); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    for (const [x, y, r] of [[40, h - 30, 14], [200, h - 40, 10], [260, h - 20, 16], [120, h - 14, 8]]) { ctx.fillStyle = '#a9b0c6'; ellipse(x, y, r, r * 0.35); }
  },
  kitchen(w, h) {
    ofFill('#fff1c9', 0, 0, w, h);
    for (let x = 0; x < w; x += 16) for (let y = 128; y < h - 60; y += 16) ofFill(((x + y) / 16) % 2 ? '#ffffff' : '#ffc2c8', x, y, 16, 16);
    inkRect(20, 70, 90, 8, '#c98a4b', 1.5, 2);
    for (const [x, c] of [[34, '#ff8fc8'], [60, '#ffd23f'], [88, '#7fd6ff']]) { inkRect(x - 8, 46, 16, 24, c, 1.2, 4); rrect(x - 9, 42, 18, 6, 2, '#c98a4b', OL, 1.5); }
    for (const [x, r] of [[200, 18], [250, 14]]) { ofLine([[x, 0], [x, 40]], OL, 2); inkRect(x - 3, 40, 6, 16, '#5b5f6e', 1, 2); inkCircle(x, 56 + r, r, '#5b5f6e', 1.5); ctx.fillStyle = '#7a7f90'; circle(x - r * 0.3, 56 + r * 0.7, r * 0.4); }
    inkRect(-4, h - 62, w + 8, 12, '#e8b878', 1.5, 3); ofFill(ofV(h - 50, h, '#c98a4b', '#9a6234'), 0, h - 50, w, 50);
    for (const x of [40, 140, 240]) inkRect(x - 26, h - 42, 52, 30, '#b07a40', 1.2, 4);
    for (let i = 0; i < 3; i++) { const k = (S.t * 0.5 + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; circle(30 + i * 10 + Math.sin(k * 6) * 4, h - 70 - k * 50, 6 + k * 6); }
  },
  firestation(w, h) {
    ofFill('#c8473a', 0, 0, w, h);
    ctx.fillStyle = 'rgba(90,20,15,.35)'; for (let y = 0; y < h; y += 14) { ctx.fillRect(0, y, w, 2); for (let x = (y % 28 ? 0 : 14); x < w; x += 28) ctx.fillRect(x, y, 2, 14); }
    inkRect(70, 26, 150, 28, '#ffd23f', 1.5, 6); text('FIRE STATION', 145, 41, 15, '#c42536', 'center', 800);
    ink(P2(`M40,${h} L40,110 C40,80 250,80 250,110 L250,${h} Z`), '#5b5f6e', 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; for (let y = 104; y < h; y += 14) { ctx.beginPath(); ctx.moveTo(42, y); ctx.lineTo(248, y); ctx.stroke(); }
    const on = Math.sin(S.t * 8) > 0;
    inkCircle(24, 90, 9, on ? '#ff3b3b' : '#7a1f1f', 1.2); inkCircle(266, 90, 9, on ? '#7a1f1f' : '#ff3b3b', 1.2);
    if (on) { ctx.fillStyle = 'rgba(255,80,80,.3)'; circle(24, 90, 20); } else { ctx.fillStyle = 'rgba(255,80,80,.3)'; circle(266, 90, 20); }
    ofFill('#8a8f9e', 0, h - 22, w, 22);
  },
  stage(w, h) {
    ofFill(ofV(0, h, '#4a1a5e', '#2a0f3a'), 0, 0, w, h);
    ctx.fillStyle = 'rgba(255,240,170,.22)'; ctx.beginPath(); ctx.moveTo(130, 0); ctx.lineTo(160, 0); ctx.lineTo(240, h - 30); ctx.lineTo(50, h - 30); ctx.fill();
    ofFill(ofV(h - 40, h, '#e0a060', '#a86a34'), 0, h - 40, w, 40);
    ctx.strokeStyle = 'rgba(90,50,20,.4)'; ctx.lineWidth = 1.2; for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, h - 40); ctx.lineTo(x - 12, h); ctx.stroke(); }
    ink(P2(`M0,0 L70,0 C60,60 50,150 64,${h - 40} C40,${h - 34} 20,${h - 34} 0,${h - 40} Z`), ofV(0, h, '#ff3b5c', '#a8122e'), 1.5);
    ink(P2(`M${w},0 L${w - 70},0 C${w - 60},60 ${w - 50},150 ${w - 64},${h - 40} C${w - 40},${h - 34} ${w - 20},${h - 34} ${w},${h - 40} Z`), ofV(0, h, '#ff3b5c', '#a8122e'), 1.5);
    ctx.strokeStyle = 'rgba(90,0,20,.35)'; ctx.lineWidth = 2; for (const x of [18, 40, w - 18, w - 40]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + (x < 145 ? 6 : -6), 140, x + (x < 145 ? 12 : -12), h - 40); ctx.stroke(); }
    for (let x = 0; x < w; x += 29) inkCircle(x + 14, 6, 15, '#ff3b5c', 1.2);
    ofFill('#ffd23f', 0, 18, w, 4);
    for (let i = 0; i < 3; i++) { const k = (S.t * 0.3 + i / 3) % 1; ctx.globalAlpha = 1 - k; text('♪', 90 + i * 50, 150 - k * 80, 22, '#ffd6ec', 'center', 700); ctx.globalAlpha = 1; }
  },
  tower(w, h) {
    ofFill(ofV(0, h, '#22104e', '#5a32a0'), 0, 0, w, h); ofTwinkles(w, h, 18);
    ofMoon(46, 52, 20, '#fff6c2');
    const wall = P2(`M168,${h} L168,96 L276,96 L276,${h} Z`);
    ink(wall, ofV(96, h, '#8a7ab8', '#5a4a88'), 1.5);
    ofClip(wall, () => { ctx.strokeStyle = 'rgba(30,15,60,.35)'; ctx.lineWidth = 1.5; for (let y = 96; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(168, y); ctx.lineTo(276, y); ctx.stroke(); for (let x = 168 + (y % 32 ? 12 : 0); x < 276; x += 24) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke(); } } });
    ctx.fillStyle = OL; tri(158, 100, 286, 100, 222, 10); ctx.fillStyle = '#3d4ec8'; tri(162, 97, 282, 97, 222, 15);
    star(222, 12, 6, '#ffe36b', 5);
    ctx.fillStyle = 'rgba(255,220,120,.35)'; circle(222, 150, 26);
    rrect(208, 132, 28, 36, [14, 14, 0, 0], '#ffd76a', OL, 2.5);
    for (let i = 0; i < 4; i++) star(20 + i * 36 + Math.sin(S.t * 2 + i) * 6, 120 + Math.cos(S.t * 2 + i) * 10 + i * 18, 3, '#ffe36b', 4);
    ofFill('#3a2470', 0, h - 26, w, 26);
  },
  city(w, h) {
    ofFill(ofV(0, h, '#ff8a7a', '#ffe08a'), 0, 0, w, h);
    for (const [x, bw, bh, c] of [[0, 44, 150, '#5a4fb0'], [40, 50, 200, '#3f3a8f'], [96, 36, 120, '#6a5acd'], [192, 46, 210, '#3f3a8f'], [236, 54, 160, '#5a4fb0']]) {
      inkRect(x, h - bh, bw, bh + 4, c, 1.5, 2);
      for (let y = h - bh + 12; y < h - 30; y += 18) for (let wx = x + 8; wx < x + bw - 8; wx += 12) ofFill((wx * 7 + y) % 5 ? '#ffe36b' : '#2b2a6a', wx, y, 6, 9);
    }
    const s = 1 + Math.sin(S.t * 5) * 0.08;
    ctx.save(); ctx.translate(232, 52); ctx.scale(s, s); star(0, 0, 34, OL, 10); star(0, 0, 31, '#ffe36b', 10); ctx.restore();
    text('POW!', 232, 53, 15, '#e63946', 'center', 900);
    ofFill('#5b5f6e', 0, h - 26, w, 26); for (let x = 10; x < w; x += 40) ofFill('#ffe36b', x, h - 14, 20, 3);
  },
  ranch(w, h) {
    ofFill(ofV(0, h, '#ffa86b', '#ffe7b8'), 0, 0, w, h);
    ctx.fillStyle = 'rgba(255,240,170,.5)'; circle(150, 150, 50); ctx.fillStyle = '#ffe36b'; circle(150, 150, 30);
    ink(P2('M-4,200 L-4,140 L60,140 L74,200 Z'), '#d9704a', 1.5); ink(P2('M200,200 L214,120 L290,120 L296,200 Z'), '#c95f3c', 1.5);
    ofFill(ofV(196, h, '#f0c27a', '#d99a58'), 0, 196, w, h - 196);
    for (const [x, y, s] of [[40, 250, 1], [258, 232, 0.8]]) {
      inkRect(x - 7 * s, y - 60 * s, 14 * s, 64 * s, '#4fae6a', 1.5, 7 * s);
      inkRect(x - 22 * s, y - 40 * s, 10 * s, 24 * s, '#4fae6a', 1.2, 5 * s); inkRect(x + 12 * s, y - 50 * s, 10 * s, 26 * s, '#4fae6a', 1.2, 5 * s);
      ofFill('#4fae6a', x - 14 * s, y - 22 * s, 10 * s, 6 * s); ofFill('#4fae6a', x + 6 * s, y - 30 * s, 10 * s, 6 * s);
      inkCircle(x, y - 62 * s, 4 * s, '#ff8fc8', 1);
    }
    inkRect(-4, 214, w + 8, 6, '#a0683c', 1.2, 2); inkRect(-4, 232, w + 8, 6, '#a0683c', 1.2, 2);
    for (let x = 10; x < w; x += 46) inkRect(x, 204, 8, 44, '#8a5a3c', 1.2, 2);
  },
  reef(w, h) {
    ofFill(ofV(0, h, '#5fe0f0', '#1a5fb4'), 0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; for (const x of [40, 120, 210]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 80, h); ctx.lineTo(x + 40, h); ctx.fill(); }
    ctx.fillStyle = '#f6dca0'; ctx.beginPath(); ctx.moveTo(0, h - 30); ctx.quadraticCurveTo(w / 2, h - 50, w, h - 30); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    for (const [x, c] of [[20, '#2f9a5a'], [36, '#4fbf6a'], [262, '#2f9a5a'], [276, '#4fbf6a']]) {
      ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, h - 30);
      for (let k = 1; k <= 8; k++) ctx.lineTo(x + Math.sin(S.t * 2 + k * 0.8 + x) * 6, h - 30 - k * 18);
      ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    }
    for (const [x, y, r] of [[230, h - 40, 14], [246, h - 52, 10], [60, h - 38, 12]]) inkCircle(x, y, r, '#ff7a9a', 1.2);
    const fx = (S.t * 30) % (w + 60) - 30;
    inkEllipse(fx, 70, 12, 7, 0, '#ffb627', 1.2); ctx.fillStyle = OL; tri(fx - 10, 70, fx - 20, 62, fx - 20, 78); ctx.fillStyle = '#ffb627'; tri(fx - 11, 70, fx - 18, 64, fx - 18, 76); dots([[fx + 6, 68]], 1.5, OL);
    ofBubbles(w, h, 8);
  },
};
// a ribbon banner with the look's name
function ofBanner(x, y, label, acc) {
  ctx.font = `800 19px ${FONT}`;
  const bw = ctx.measureText(label).width + 44, dk = mix(acc, '#2a1050', 0.35);
  for (const s of [-1, 1]) ink(P2(`M${x + s * (bw / 2 - 10)},${y - 8} L${x + s * (bw / 2 + 18)},${y - 8} L${x + s * (bw / 2 + 8)},${y + 4} L${x + s * (bw / 2 + 18)},${y + 16} L${x + s * (bw / 2 - 10)},${y + 16} Z`), dk, 1.5);
  rrect(x - bw / 2, y - 16, bw, 30, 8, ofLG(y - 16, y + 14, acc), OL, 3);
  ofLine([[x - bw / 2 + 6, y - 11], [x + bw / 2 - 6, y - 11]], 'rgba(255,255,255,.45)', 2);
  outlined(label, x, y - 1, 19, '#ffffff', 'center', 'rgba(52,26,72,.8)');
}
// one piece on its own, fitted into a size x size box centred on (x, y)
function ofDrawPiece(id, x, y, size) {
  const c = ofPiece(id), [x0, y0, x1, y1] = c.box, k = Math.min(size / (x1 - x0), size / (y1 - y0), 2.6);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lw = 1.3 / k;
  if (c.pair) { c.one(7, 0, lw); c.one(23, 0, lw); } else { c.draw(lw); c.over?.(lw); }
  ctx.restore();
}
// pick the looks for a game: one everyday look plus silly dress-up ones; the top tier adds a look-alike pair
function ofPickCats(tier, n) {
  const byName = nm => OF_CATS.find(c => c.name === nm);
  const alike = (a, b) => OF_ALIKE.some(([x, y]) => (x === a.name && y === b.name) || (x === b.name && y === a.name));
  const out = tier === 3 ? pick(OF_ALIKE).map(byName) : [];
  if (!out.some(c => c.classic)) out.push(pick(OF_CATS.filter(c => c.classic && (tier === 3 || !out.some(o => alike(o, c))))));
  for (const c of shuffle(OF_CATS.filter(c => !c.classic))) {
    if (out.length >= n) break;
    if (out.includes(c) || (tier === 1 && out.some(o => alike(o, c)))) continue;
    out.push(c);
  }
  // only three cards fit on screen at once: keep the look-alike pair among the first three
  return [...shuffle(out.slice(0, 3)), ...shuffle(out.slice(3))];
}
// laundry still waiting its turn on the line
function ofBasket(x, y, n) {
  inkCircle(x - 14, y - 30, 11, '#ff8fc8', 1.2); inkCircle(x + 10, y - 33, 13, '#7fd6ff', 1.2); inkCircle(x + 2, y - 26, 9, '#ffd23f', 1.2);
  const p = P2(`M${x - 36},${y - 24} L${x + 36},${y - 24} L${x + 27},${y + 26} L${x - 27},${y + 26} Z`);
  ink(p, ofLG(y - 24, y + 26, '#d9a066'), 1.5);
  ofClip(p, () => { ctx.strokeStyle = 'rgba(110,60,20,.45)'; ctx.lineWidth = 2; for (let yy = y - 14; yy < y + 26; yy += 10) { ctx.beginPath(); ctx.moveTo(x - 40, yy); ctx.lineTo(x + 40, yy); ctx.stroke(); } for (let xx = x - 30; xx < x + 36; xx += 12) { ctx.beginPath(); ctx.moveTo(xx, y - 24); ctx.lineTo(xx + (xx - x) * -0.15, y + 26); ctx.stroke(); } });
  rrect(x - 40, y - 30, 80, 11, 5, '#c98a4b', OL, 3);
  if (n) { inkCircle(x + 32, y - 44, 16, '#ff5fa2', 1.5); text(`+${n}`, x + 32, y - 44, 15, '#ffffff', 'center', 800); }
}
const OF_CW = 290, OF_CH = 300, OF_CT = 64, OF_GY = 346, OF_AH = 224, OF_LY = 392, OF_TY = 460, OF_TW = 104;
MG.outfits = {
  kind: 'learn', title: () => 'Fashion Sort', icon: () => '👗',
  how: () => 'Drag each piece of clothing onto the Aubrey wearing that kind of outfit! Pirates, doctors, wizards and more!',
  // up to three big themed cards at a time (the next look slides in when one is done);
  // the clothes hang big on one washing line, and the rest wait in the laundry basket
  init(g) {
    const n = [3, 4, 5][g.tier - 1], per = g.tier === 3 ? 4 : 3, k = Math.min(3, n);
    const cats = ofPickCats(g.tier, n);
    g.slotX = [...Array(k).keys()].map(j => W / 2 + (j - (k - 1) / 2) * 310);
    g.slots = [...Array(k).keys()]; g.queue = [...Array(n).keys()].slice(k);
    g.models = cats.map((c, i) => ({ c, name: c.name, cx: i < k ? g.slotX[i] : W + 220, bump: 0, shake: 0, done: false }));
    g.items = cats.flatMap((c, o) => [...c.core, ...shuffle(c.extra)].slice(0, per).map((id, idx) => ({ id, idx, o, on: false, st: 'wait', slot: -1, miss: 0, pop: 0, drop: 0, snap: 0, x: 0, y: 0 })));
    g.lineX = [...Array(7).keys()].map(j => W / 2 + 22 + (j - 3) * 114); g.line = Array(7).fill(null);
    Object.assign(g, { held: null, moved: 0, wrong: 0, placed: 0, show: 0, ofReveal: null });
    this.refill(g);
    g.say = this.how();
  },
  // hang pieces for the looks on screen in any empty spots on the line
  refill(g) {
    const pool = shuffle(g.items.filter(it => it.st === 'wait' && g.slots.includes(it.o)));
    for (let s = 0; s < g.line.length && pool.length; s++) if (!g.line[s]) { const it = pool.pop(); it.st = 'line'; it.slot = s; it.drop = 0.5; g.line[s] = it; }
  },
  // the model whose card a point is over, if any
  modelAt(g, x, y) { const mi = g.slots.find(i => Math.abs(x - g.models[i].cx) < OF_CW / 2 && y > OF_CT && y < OF_CT + OF_CH + 16); return mi ?? -1; },
  drop(g, it) {
    const mi = this.modelAt(g, pointer.x, pointer.y), m = g.models[mi];
    g.held = null;
    if (mi === it.o) {
      it.on = true; it.st = 'on'; g.line[it.slot] = null; it.snap = 0.4; g.placed++; m.bump = 0.45; SFX.pop(); this.refill(g);
      burst(pointer.x, pointer.y, 16, { colors: ['#fff6a8', '#ffb3e0', m.c.sky[0]] });
      // that look is finished: show it off in the spotlight
      if (g.items.every(i => i.o !== mi || i.on)) {
        m.done = true; g.ofReveal = { i: mi, t: 0, sp: 0 };
        SFX.sparkle(); tone(523, 0.12, 'triangle', 0.18); tone(784, 0.2, 'triangle', 0.18, 0.12);
        speak(m.c.cheer);
      }
    } else {
      if (m) {
        g.wrong++; it.miss++; m.shake = 0.45; SFX.miss();
        speak(it.miss >= 2 ? `Oops! The ${ofName(it.id)} goes with the ${g.models[it.o].name} look. Look for the glow!` : `Oops! The ${ofName(it.id)} doesn't go with ${m.name}. Try another one!`);
      }
      it.x = it.hx; it.y = it.hy;
    }
  },
  update(g, dt) {
    g.progress = `Dressed: ${g.placed} / ${g.items.length}`;
    for (const m of g.models) { m.bump = Math.max(0, m.bump - dt); m.shake = Math.max(0, m.shake - dt); }
    g.slots.forEach((mi, s) => { const m = g.models[mi]; m.cx += (g.slotX[s] - m.cx) * Math.min(1, dt * 7); });
    for (const it of g.items) {
      it.pop = Math.max(0, it.pop - dt); it.drop = Math.max(0, it.drop - dt); it.snap = Math.max(0, it.snap - dt);
      if (it.st === 'line' && it !== g.held) { it.x = g.lineX[it.slot]; it.y = OF_TY; }
    }
    const r = g.ofReveal;
    if (r) {
      r.t += dt; r.sp -= dt;
      if (r.sp <= 0) { r.sp = 0.22; burst(W / 2 + rand(-170, 170), rand(110, 420), 5, { colors: ['#fff6a8', '#ffb3e0', g.models[r.i].c.sky[0]] }); }
      if (r.t >= 2.8 || (r.t > 0.9 && pointer.clicked)) {
        g.ofReveal = null;
        if (g.placed === g.items.length) { g.show = 2.6; SFX.fanfare(); speak('Fashion show! Every outfit is just right!'); }
        else if (g.queue.length) {
          // the finished card makes way for the next look
          const s = g.slots.indexOf(r.i), next = g.queue.shift();
          g.slots[s] = next; g.models[next].cx = W + 220; this.refill(g);
          speak(`Next up: ${g.models[next].name}!`);
        }
      }
      return;
    }
    if (g.show > 0) { g.show -= dt; if (g.show <= 0) g.done = true; return; }
    const it = g.held;
    if (it) {
      if (pointer.down && !g.armed) g.moved += Math.hypot(pointer.x - it.x, pointer.y - it.y);
      it.x = pointer.x; it.y = pointer.y;
      // drag-and-release drops; a tap picks it up (armed) and the next tap puts it down
      if (!g.armed && !pointer.down) { if (g.moved > 24) this.drop(g, it); else g.armed = true; }
      else if (g.armed && pointer.clicked) this.drop(g, it);
    } else if (pointer.clicked) {
      const hit = g.line.find(i => i && Math.abs(pointer.x - i.x) < OF_TW / 2 && Math.abs(pointer.y - i.y) < OF_TW / 2 + 4);
      if (hit) { g.held = hit; g.moved = 0; g.armed = false; hit.pop = 0.35; SFX.click(); tone(660, 0.08, 'sine', 0.12, 0, 990); speak(ofName(hit.id)); }
    }
    g.score = clamp(1 - g.wrong / g.items.length, 0.25, 1);
  },
  draw(g) {
    const held = g.held, hov = held ? this.modelAt(g, pointer.x, pointer.y) : -1;
    g.slots.forEach(i => {
      const m = g.models[i], [scene, acc] = OF_THEME[m.name], bx = m.cx - OF_CW / 2, top = OF_CT;
      const hint = held && held.miss >= 2 && held.o === i;
      ctx.save(); ctx.translate(m.shake > 0 ? Math.sin(m.shake * 70) * 8 * m.shake / 0.45 : 0, 0);
      rrect(bx + 5, top + 8, OF_CW, OF_CH, 24, 'rgba(42,16,80,.28)', null);
      if (m.done || hint || hov === i) {
        ctx.save(); ctx.shadowColor = m.done || hint ? '#ffe36b' : '#ffffff'; ctx.shadowBlur = 26 + Math.sin(S.t * 5) * 8;
        rrect(bx, top, OF_CW, OF_CH, 24, '#ffffff', null); ctx.restore();
      }
      // the look's own little world
      ctx.save(); ctx.beginPath(); ctx.roundRect(bx, top, OF_CW, OF_CH, 24); ctx.clip(); ctx.translate(bx, top);
      OF_SCENES[scene](OF_CW, OF_CH);
      // a soft halo right behind Aubrey so she pops from even the busiest scene
      const sp = ctx.createRadialGradient(OF_CW / 2, OF_CH - 120, 20, OF_CW / 2, OF_CH - 120, 112);
      sp.addColorStop(0, m.done ? 'rgba(255,250,200,.8)' : 'rgba(255,255,255,.6)'); sp.addColorStop(0.6, m.done ? 'rgba(255,250,200,.4)' : 'rgba(255,255,255,.28)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sp; ctx.fillRect(0, 0, OF_CW, OF_CH);
      ctx.fillStyle = 'rgba(42,16,80,.25)'; ellipse(OF_CW / 2, OF_GY - OF_CT, 52, 9);
      ctx.restore();
      // a chunky frame in the look's colour, with gold studs
      rrect(bx, top, OF_CW, OF_CH, 24, null, OL, 11);
      rrect(bx, top, OF_CW, OF_CH, 24, null, m.done ? '#ffd23f' : hint ? `rgba(255,226,90,${0.6 + 0.4 * Math.sin(S.t * 8)})` : hov === i ? '#fff6a8' : acc, 7);
      rrect(bx + 7, top + 7, OF_CW - 14, OF_CH - 14, 18, null, 'rgba(255,255,255,.6)', 2);
      for (const [cx, cy] of [[bx + 11, top + 11], [bx + OF_CW - 11, top + 11], [bx + 11, top + OF_CH - 11], [bx + OF_CW - 11, top + OF_CH - 11]]) inkCircle(cx, cy, 5, '#ffd23f', 1.2);
      const lift = g.show > 0 ? Math.abs(Math.sin(S.t * 7 + i)) * 18 : Math.sin(m.bump / 0.45 * Math.PI) * 14;
      const mine = g.items.filter(it => it.o === i).sort((a, b) => a.idx - b.idx);
      const snaps = {}; for (const it of mine) if (it.snap > 0) snaps[it.id] = 1 + Math.sin(it.snap / 0.4 * Math.PI) * 0.35;
      ofDressed(m.cx, OF_GY, OF_AH, mine.filter(it => it.on).map(it => it.id), lift, [], snaps);
      if (m.done) for (let k = 0; k < 5; k++) {
        const a = S.t * 1.6 + k * Math.PI * 0.4;
        star(m.cx + Math.cos(a) * 110, top + 150 + Math.sin(a) * 100, 6 + Math.sin(S.t * 6 + k) * 2, '#fff6a8', 4);
      }
      // how many pieces found so far
      // slot badges: one plain numbered circle per piece still needed (no shapes or colours that give it away),
      // filled with a mini picture once that piece is on
      const found = mine.filter(it => it.on), n = mine.length, bw = n * 34 + 12, bxs = m.cx - bw / 2;
      rrect(bxs, top + 12, bw, 40, 20, 'rgba(255,255,255,.88)', OL, 2.5);
      for (let k = 0; k < n; k++) {
        const x = bxs + 23 + k * 34, y = top + 32, it = found[k];
        if (it) { inkCircle(x, y, 14, m.done ? '#fff3b0' : '#ffffff', 1.2); ofDrawPiece(it.id, x, y, 22); }
        else {
          ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = '#9a7aaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          text(String(k + 1), x, y + 1, 14, '#9a7aaa', 'center', 800);
        }
      }
      ofBanner(m.cx, top + OF_CH, m.name, acc);
      if (hint) {
        const ay = top + 84 + Math.sin(S.t * 8) * 6;
        ctx.fillStyle = OL; tri(m.cx - 18, ay - 22, m.cx + 18, ay - 22, m.cx, ay + 4);
        ctx.fillStyle = '#ffe36b'; tri(m.cx - 12, ay - 19, m.cx + 12, ay - 19, m.cx, ay - 2);
      }
      ctx.restore();
    });
    // one washing line with the clean clothes pegged on it, big; the rest wait in the basket
    const lx0 = 98, lx1 = W - 24, sag = x => OF_LY + Math.sin(clamp((x - lx0) / (lx1 - lx0), 0, 1) * Math.PI) * 10;
    for (const px of [lx0, lx1]) inkRect(px - 5, OF_LY - 10, 10, H - OF_LY + 14, '#c98a4b', 2.5, 3);
    ctx.beginPath(); ctx.moveTo(lx0, OF_LY); ctx.quadraticCurveTo((lx0 + lx1) / 2, OF_LY + 20, lx1, OF_LY);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#f6f0e2'; ctx.lineWidth = 2.5; ctx.stroke();
    ofBasket(50, 486, g.items.filter(it => it.st === 'wait').length);
    const tints = ['#fff0f8', '#eaf6ff', '#fff8e0', '#ecffef', '#f4ecff', '#fff0e6', '#e6fcff'];
    g.line.forEach((it, s) => {
      if (!it || it === held) return;
      const x = g.lineX[s], py = sag(x), dy = it.drop > 0 ? -Math.pow(it.drop / 0.5, 2) * 140 : 0;
      const near = !held && Math.abs(pointer.x - x) < OF_TW / 2 && Math.abs(pointer.y - OF_TY) < OF_TW / 2;
      ctx.save(); ctx.translate(x, py + dy); ctx.rotate(Math.sin(S.t * 2 + x * 0.05) * 0.04);
      if (near) ctx.scale(1.08, 1.08);
      const tw = OF_TW, ty = 8;
      rrect(-tw / 2 + 5, ty + 7, tw, tw, 18, 'rgba(42,16,80,.28)', null);
      rrect(-tw / 2, ty, tw, tw, 18, ofV(ty, ty + tw, '#ffffff', tints[s]), OL, 3);
      if (near) rrect(-tw / 2 + 4, ty + 4, tw - 8, tw - 8, 14, null, '#ffd23f', 4);
      ofDrawPiece(it.id, 0, ty + tw / 2, 90);
      for (const px of [-tw / 3, tw / 3]) { rrect(px - 4, -9, 8, 24, 3, '#e8b878', OL, 2); ctx.fillStyle = '#b07a40'; ctx.fillRect(px - 0.7, -6, 1.4, 18); }
      ctx.restore();
    });
    if (held) {
      const s = 1 + Math.sin(Math.min(1, held.pop / 0.35) * Math.PI) * 0.25;
      const gl = ctx.createRadialGradient(held.x, held.y, 4, held.x, held.y, 76);
      gl.addColorStop(0, 'rgba(255,250,190,.95)'); gl.addColorStop(1, 'rgba(255,250,190,0)');
      ctx.fillStyle = gl; circle(held.x, held.y, 76);
      ctx.save(); ctx.translate(held.x, held.y); ctx.rotate(Math.sin(S.t * 9) * 0.08); ctx.scale(s, s);
      ofDrawPiece(held.id, 0, 0, 110); ctx.restore();
      for (let k = 0; k < 4; k++) { const a = S.t * 4 + k * 1.57; star(held.x + Math.cos(a) * 62, held.y + Math.sin(a) * 62, 5, '#fff6a8', 4); }
    }
    if (g.ofReveal) this.reveal(g);
    if (g.show > 0) outlined('Fashion show!', W / 2, 92, 40, '#ff6fb5', 'center', '#fff');
  },
  // an outfit is finished: Aubrey twirls in the spotlight wearing it, with a cheer
  reveal(g) {
    const r = g.ofReveal, c = g.models[r.i].c, e = 1 - Math.pow(1 - Math.min(1, r.t / 0.35), 3);
    ctx.fillStyle = `rgba(30,12,50,${0.6 * e})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 266); ctx.rotate(S.t * 0.5); ctx.globalAlpha = 0.3 * e;
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? c.sky[0] : '#fff6a8';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 600, i * Math.PI / 8, (i + 0.55) * Math.PI / 8); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.save(); ctx.translate(W / 2, 266); ctx.scale(e, e); ctx.translate(-W / 2, -266);
    // the look's own scene, big, in a gold frame
    ctx.save(); ctx.beginPath(); ctx.roundRect(W / 2 - 160, 80, 320, 372, 26); ctx.clip(); ctx.translate(W / 2 - 160, 80);
    OF_SCENES[OF_THEME[c.name][0]](320, 372); ctx.restore();
    rrect(W / 2 - 160, 80, 320, 372, 26, null, OL, 12); rrect(W / 2 - 160, 80, 320, 372, 26, null, '#ffd23f', 7);
    const sp = ctx.createRadialGradient(W / 2, 300, 10, W / 2, 300, 170);
    sp.addColorStop(0, 'rgba(255,250,210,.6)'); sp.addColorStop(1, 'rgba(255,250,210,0)');
    ctx.fillStyle = sp; ctx.fillRect(W / 2 - 156, 84, 312, 364);
    ctx.fillStyle = 'rgba(42,16,80,.25)'; ellipse(W / 2, 430, 72, 10);
    const worn = g.items.filter(it => it.o === r.i).sort((a, b) => a.idx - b.idx).map(it => it.id);
    ofDressed(W / 2, 430, 270, worn, Math.abs(Math.sin(r.t * 5)) * 12);
    for (let k = 0; k < 8; k++) {
      const a = S.t * 1.4 + k * Math.PI / 4, rr = 128 + Math.sin(S.t * 3 + k) * 10;
      star(W / 2 + Math.cos(a) * rr, 270 + Math.sin(a) * rr * 1.2, 6 + Math.sin(S.t * 7 + k) * 2, ['#fff6a8', '#ffb3e0', '#b8e6ff'][k % 3], 4);
    }
    ofBanner(W / 2, 450, c.name, OF_THEME[c.name][1]);
    ctx.restore();
    outlined(c.cheer, W / 2, 496, 30 + Math.sin(Math.min(1, r.t / 0.5) * Math.PI) * 8, '#ffe36b', 'center');
  },
};

// --- seesaw: put things on our side, and take them off again, until the seesaw is level ----------
// [emoji, name, weight] — weights stay hidden; the tilt of the plank is the only clue
const SEESAW_THINGS = [['🎈', 'a balloon', 1], ['🧦', 'a sock', 1], ['🍎', 'an apple', 2], ['🥤', 'a juice', 2], ['🧸', 'a teddy bear', 3], ['⚽', 'a ball', 3],
  ['🪣', 'a bucket of sand', 4], ['📚', 'some books', 4], ['🎒', 'a backpack', 5], ['🍉', 'a watermelon', 6], ['🐶', 'a puppy', 7], ['🎃', 'a pumpkin', 8], ['🧱', 'a big brick', 9]];
const SS_X = W / 2, SS_Y = 340, SS_LEN = 300, SS_SIZE = 50;
const ssWeight = list => list.reduce((a, t) => a + t[2], 0);
// every group of up to `most` things from `pool` that weighs exactly `w`
function ssWays(pool, w, most) {
  const ways = [];
  const walk = (i, picked, sum) => {
    if (sum === w && picked.length) ways.push(picked);
    if (picked.length >= most || sum >= w) return;
    for (let j = i; j < pool.length; j++) walk(j + 1, [...picked, pool[j]], sum + pool[j][2]);
  };
  walk(0, [], 0);
  return ways;
}
MG.seesaw = {
  kind: 'learn', title: () => 'Balance the Seesaw', icon: () => '⚖️',
  how: () => "Put things on our side of the seesaw until it's perfectly level! Watch which way it tips, and tap something on our side to take it off.",
  init(g) { Object.assign(g, { round: 0, rounds: 5, total: 0, ang: 0, vel: 0, state: 'play', t2: 0, spots: [] }); this.next(g); },
  start(g) { speak(g.say); },
  next(g) {
    // Maya's side always starts with two or three things; the answer takes one or two things early on, up to three later
    const nLeft = g.round < 2 ? 2 : 3, most = g.round < 2 ? 2 : 3, fewest = g.round < 1 ? 1 : 2;
    for (;;) {
      const left = shuffle(SEESAW_THINGS).slice(0, nLeft);
      // nothing that's already on Maya's side is offered for ours
      const pool = shuffle(SEESAW_THINGS.filter(t => !left.some(l => l[0] === t[0])));
      const ways = ssWays(pool, ssWeight(left), most).filter(s => s.length >= fewest);
      if (!ways.length) continue;
      const answer = pick(ways), others = pool.filter(t => !answer.includes(t));
      const choices = shuffle([...answer, ...others.slice(0, 4 - answer.length)]);
      const best = Math.min(...ssWays(choices, ssWeight(left), 4).map(s => s.length));
      Object.assign(g, { left, choices, right: [], moves: 0, best, state: 'play' });
      break;
    }
    const names = g.left.map(t => t[1]);
    g.say = `Maya's side has ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}. Put things on our side until the seesaw is level!`;
    if (g.phase === 'play') speak(g.say);
  },
  update(g, dt, id) {
    // the plank swings toward the heavier side, further the bigger the difference, with a little wobble
    const L = ssWeight(g.left), R = ssWeight(g.right), target = clamp((R - L) * 0.03, -0.24, 0.24);
    g.vel += ((target - g.ang) * 40 - g.vel * 6) * dt; g.ang += g.vel * dt;
    if (g.state === 'play') {
      // tap a choice (or 1-4) to put it on or take it off; tapping a thing on the plank takes it off too
      let i = id?.startsWith('pick:') ? +id.slice(5) : ['1', '2', '3', '4'].findIndex(k => pressed[k]);
      if (i < 0 && pointer.clicked) { const s = g.spots.find(s => Math.hypot(pointer.x - s.x, pointer.y - s.y) < SS_SIZE * 0.6); if (s) i = g.choices.indexOf(s.t); }
      if (i >= 0) {
        const t = g.choices[i], k = g.right.indexOf(t);
        if (k >= 0) { g.right.splice(k, 1); tone(500, 0.12, 'triangle', 0.08, 0, 300); } else { g.right.push(t); SFX.pop(); }
        g.moves++;
      }
      // only a level seesaw finishes the round
      if (R === L && Math.abs(g.ang) < 0.02 && Math.abs(g.vel) < 0.1) {
        g.total += clamp(1 - 0.12 * Math.max(0, g.moves - g.best), 0.4, 1);
        g.state = 'yay'; g.t2 = 1.6;
        SFX.hit(); burst(SS_X, SS_Y - 80, 24); speak(pick(['Perfectly balanced!', 'Yes! Just right!', 'You did it!']));
      }
    } else if ((g.t2 -= dt) <= 0) {
      g.round++;
      if (g.round >= g.rounds) g.done = true; else this.next(g);
    }
    g.progress = `Round ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
    g.score = g.total / g.rounds;
  },
  draw(g) {
    panel(W / 2 - 330, 72, 660, 52, 20);
    text(g.state === 'yay' ? 'Balanced!' : 'Make the seesaw level!', W / 2, 98, 22, '#5a2a6e', 'center', 700);
    outlined("Maya's side", SS_X - SS_LEN + 110, 150, 20, '#fff');
    outlined('Our side', SS_X + SS_LEN - 110, 150, 20, '#fff');
    // stand and plank, with things sitting on it
    ink(P2(`M${SS_X - 46},${SS_Y + 70} L${SS_X},${SS_Y} L${SS_X + 46},${SS_Y + 70} Z`), '#ff5f7e', 2.5);
    const a = g.ang, at = (lx, ly) => [SS_X + Math.cos(a) * lx - Math.sin(a) * ly, SS_Y + Math.sin(a) * lx + Math.cos(a) * ly];
    ctx.save(); ctx.translate(SS_X, SS_Y); ctx.rotate(a);
    inkRect(-SS_LEN, -8, SS_LEN * 2, 16, '#40b0ff', 2.5, 8);
    inkRect(-SS_LEN + 6, -26, 12, 20, '#ffd83a', 2, 4); inkRect(SS_LEN - 18, -26, 12, 20, '#ffd83a', 2, 4);
    const gap = n => (n > 3 ? 64 : 80);
    g.left.forEach((t, i) => emoji(t[0], -SS_LEN + 56 + i * gap(g.left.length), -8 - SS_SIZE * 0.45, SS_SIZE));
    g.spots = g.right.map((t, i) => {
      const lx = SS_LEN - 56 - i * gap(g.right.length), ly = -8 - SS_SIZE * 0.45;
      emoji(t[0], lx, ly, SS_SIZE);
      const [x, y] = at(lx, ly);
      return { t, x, y };
    });
    ctx.restore();
    inkCircle(SS_X, SS_Y, 9, '#ffd83a', 2);
    // the four things to choose from: tap to put on, tap again to take off
    const bw = 190, gp = 16, x0 = W / 2 - (4 * bw + 3 * gp) / 2;
    g.choices.forEach((t, i) => {
      const x = x0 + i * (bw + gp), on = g.right.includes(t);
      button(`pick:${i}`, x, 446, bw, 78, '', { color: on ? '#b9a6cc' : ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a'][i], on: g.state === 'play', key: String(i + 1) });
      ctx.globalAlpha = on ? 0.45 : 1; emoji(t[0], x + 40, 485, 40); ctx.globalAlpha = 1;
      const name = t[1].replace(/^(a|an|some) /, '');
      text(name, x + 118, on ? 474 : 485, name.length > 11 ? 14 : 17, '#fff', 'center', 700);
      if (on) text('on the seesaw', x + 118, 496, 12, 'rgba(255,255,255,.9)', 'center', 600);
    });
  },
};

// --- duck hide & seek: silly rubber ducks peek out from behind things round the pond ---------
// [hider, x, y, scale, variant] — far bank, on the water, near bank, and one up in the sky
const HIDE_SLOTS = [['bush', 130, 292, 0.8, 0], ['stump', 300, 290, 0.9], ['bush', 640, 290, 0.75, 2], ['cloud', 470, 226, 0.9],
  ['reeds', 110, 404, 0.9], ['lily', 300, 368, 1], ['rock', 500, 340, 0.8], ['duckhouse', 660, 400, 0.9], ['boat', 820, 370, 0.8], ['log', 470, 434, 0.8],
  ['bucket', 70, 512, 1], ['pot', 240, 512, 1], ['mushroom', 420, 520, 1], ['basket', 610, 514, 1], ['bush', 850, 520, 0.85, 1]];
// hd…: the hand-drawn art for hide & seek. Hiding places keep the same outlines as HIDERS (so the
// peek spots and difficulty match) but get shading, texture and props, and are cached as sprites.
const HD_WATER = { lily: 66, rock: 62, boat: 90, duckhouse: 18, log: 94, reeds: 52 };   // base ripple width
const HD_LAND = { stump: 50, bush: 62, bucket: 34, pot: 36, mushroom: 54, basket: 48 };  // shadow width
const HD_FLOAT = { lily: 1, boat: 1 };
function hdLin(x0, y0, x1, y1, ...cols) {
  const gr = ctx.createLinearGradient(x0, y0, x1, y1);
  cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c));
  return gr;
}
// outline every overlapping shape first, then fill them all, so they read as one solid thing
function hdInk(pairs, lw = 2.5) {
  ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
  for (const [p] of pairs) ctx.stroke(p);
  for (const [p, f] of pairs) { ctx.fillStyle = f; ctx.fill(p); }
}
// segs: [x0,y0,x1,y1] straight or [x0,y0,cx,cy,x1,y1] curved
function hdLines(col, lw, segs) {
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
  for (const s of segs) { ctx.moveTo(s[0], s[1]); if (s.length === 4) ctx.lineTo(s[2], s[3]); else ctx.quadraticCurveTo(s[2], s[3], s[4], s[5]); }
  ctx.stroke();
}
function hdClip(path, fn) { ctx.save(); ctx.clip(path); fn(); ctx.restore(); }
function hdShroom(x, y, s, cap) {
  const stem = P2(`M${x - 3 * s},${y} L${x - 2.5 * s},${y - 9 * s} L${x + 2.5 * s},${y - 9 * s} L${x + 3 * s},${y} Z`);
  const top = P2(`M${x - 9 * s},${y - 8 * s} C${x - 8 * s},${y - 19 * s} ${x + 8 * s},${y - 19 * s} ${x + 9 * s},${y - 8 * s} Z`);
  hdInk([[stem, '#fff6e0'], [top, cap]], 1.1);
  ctx.fillStyle = '#fff'; circle(x - 3 * s, y - 12 * s, 1.7 * s); circle(x + 3.5 * s, y - 11 * s, 1.2 * s);
}
// tiny critters that live on the hiding places
function hdSnail(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(11, -13); ctx.moveTo(10, -6); ctx.lineTo(15, -11); ctx.stroke();
  hdInk([[P2('M-12,0 L12,0 C14,-6 10,-8 6,-6 L-10,-2 Z'), '#ffd8a8'], [P2('M-10,-2 a8,8 0 1,1 16,0 Z'), hdLin(-10, -10, 6, 0, '#ffb26a', '#e07a3a')]], 1);
  ctx.strokeStyle = 'rgba(120,50,20,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-2, -4, 3.5, 0, Math.PI * 1.6); ctx.stroke();
  ctx.fillStyle = OL; circle(11, -13, 1.3); circle(15, -11, 1.3);
  ctx.restore();
}
function hdLadybug(x, y, s, a = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  hdInk([[P2('M-3,-6 a3,3 0 1,1 6,0 a3,3 0 1,1 -6,0'), '#2a1a3a'], [P2('M-6,0 a6,6 0 1,1 12,0 a6,6 0 1,1 -12,0'), '#ff4f5a']], 1);
  ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.stroke();
  ctx.fillStyle = '#2a1a3a'; for (const [dx, dy] of [[-3, -1], [3, 1], [-2.5, 3], [3, -3]]) circle(dx, dy, 1.2);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(-2.5, -3, 1.2);
  ctx.restore();
}
function hdFrog(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  hdInk([[P2('M-12,0 C-14,-10 -6,-14 0,-14 C6,-14 14,-10 12,0 Z'), hdLin(0, -14, 0, 0, '#8ae06a', '#4fae4a')], [P2('M-9,-12 a4,4 0 1,1 8,0 a4,4 0 1,1 -8,0 M1,-12 a4,4 0 1,1 8,0 a4,4 0 1,1 -8,0'), '#8ae06a']], 1);
  ctx.fillStyle = '#fff'; circle(-5, -12, 2.6); circle(5, -12, 2.6); ctx.fillStyle = '#2a1a3a'; circle(-4.5, -12, 1.4); circle(5.5, -12, 1.4);
  ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -6, 4, 0.3, Math.PI - 0.3); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,150,.5)'; circle(-7, -5, 1.6); circle(7, -5, 1.6);
  ctx.restore();
}
const HD_HEART = P2('M0,4 C-8,-2 -8,-9 -3,-9 C-1,-9 0,-7 0,-6 C0,-7 1,-9 3,-9 C8,-9 8,-2 0,4 Z');
const HD_ART = {
  rock() {
    const big = P2('M-56,0 C-62,-28 -32,-56 0,-54 C32,-56 60,-32 56,0 Z'), small = P2('M-74,0 C-78,-14 -66,-24 -54,-20 C-46,-16 -44,-6 -46,0 Z');
    hdInk([[small, hdLin(-74, -22, -50, 0, '#d4cfe0', '#8f88a4')], [big, hdLin(-30, -56, 24, 2, '#dcd8ea', '#aca6be', '#837c98')]]);
    hdClip(big, () => { ctx.fillStyle = 'rgba(40,90,150,.28)'; ctx.fillRect(-70, -9, 140, 10); ctx.fillStyle = 'rgba(60,40,90,.12)'; ellipse(40, -18, 26, 30); });
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(-20, -42, 17, 5.5, -0.3); ellipse(-63, -15, 5, 2.4, -0.4);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(-30, -44, 2.4);
    hdLines('rgba(91,63,115,.5)', 2, [[8, -34, 18, -24, 14, -10], [17, -23, 28, -20]]);
    ink(P2('M8,-52 C20,-59 40,-51 48,-36 C43,-33 40,-40 35,-37 C31,-44 22,-41 17,-46 C12,-43 7,-47 8,-52 Z'), '#6fcf5a', 1.2);
    ctx.fillStyle = '#a4e684'; ellipse(26, -51, 8, 2.4, 0.3);
    flower(36, -47, 4, '#fff', '#ffd84a', 0.7); flower(-62, -19, 3.5, '#ffc8e4', '#ffd84a', 0.7);
  },
  stump() {
    const body = P2('M-36,0 C-48,0 -52,-6 -40,-10 L-34,-58 L34,-58 L40,-10 C52,-6 48,0 36,0 Z');
    const roots = P2('M-34,0 C-42,2 -50,3 -54,0 C-50,-5 -44,-7 -38,-7 Z M32,0 C42,2 54,3 58,0 C52,-6 44,-8 38,-8 Z');
    hdInk([[roots, '#8a5a32'], [body, hdLin(-44, 0, 44, 0, '#7a4a2a', '#b47844', '#a0683a', '#6a3e22')]]);
    hdLines('#5e361c', 2.5, [[-22, -50, -27, -30, -22, -10], [0, -52, -3, -30, 3, -8], [21, -50, 26, -30, 22, -12]]);
    hdLines('rgba(255,230,190,.35)', 2, [[-12, -48, -15, -30, -12, -14], [11, -48, 14, -30, 11, -18]]);
    inkEllipse(0, -58, 34, 10, 0, hdLin(0, -68, 0, -48, '#f6d8a0', '#d8ac6a'), 2);
    ctx.strokeStyle = '#b8884a'; ctx.lineWidth = 1.5; for (const r of [5, 12, 19, 26]) { ctx.beginPath(); ctx.ellipse(1, -58, r, r * 0.28, 0, 0, Math.PI * 2); ctx.stroke(); }
    hdLines('rgba(120,70,30,.5)', 1.5, [[2, -58, 22, -62]]);
    ctx.fillStyle = '#6fcf5a'; ellipse(-30, -6, 10, 4); ellipse(36, -4, 8, 3);
    inkAt(28, -62, 0.5, P2('M0,0 C-6,-6 -4,-14 0,-16 C4,-14 6,-6 0,0 Z'), '#7fd35a', 1);
    inkAt(30, -62, 1.4, P2('M0,0 C-4,-4 -3,-10 0,-11 C3,-10 4,-4 0,0 Z'), '#5fbf4a', 1);
    hdSnail(12, -20, 1);
  },
  log() {
    const body = P2('M-84,-44 L84,-44 L84,0 L-84,0 C-94,0 -94,-44 -84,-44 Z');
    ink(body, hdLin(0, -44, 0, 0, '#c8905a', '#a0683a', '#74462a'), 2.5);
    hdClip(body, () => { ctx.fillStyle = 'rgba(40,90,150,.3)'; ctx.fillRect(-100, -7, 200, 8); });
    hdLines('#6a3e22', 2.5, [[-74, -34, -56, -38, -38, -33], [-36, -15, -20, -19, -4, -14], [8, -31, 26, -35, 44, -30], [-58, -22, -50, -24, -42, -22], [36, -16, 50, -19, 64, -15]]);
    hdLines('rgba(255,230,190,.35)', 2, [[-70, -40, 60, -40]]);
    inkEllipse(84, -22, 14, 22, 0, hdLin(70, -44, 98, 0, '#f0cc8a', '#c99a5a'), 2);
    ctx.strokeStyle = '#a87a44'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(84, -22, 11.5, 19.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = hdLin(84, -40, 84, -4, '#1e1018', '#4a2c1e'); ctx.fill(HIDER_HOLES.log);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(HIDER_HOLES.log);
    ink(P2('M20,-44 C26,-51 52,-52 60,-44 C56,-40 52,-44 48,-40 C44,-44 36,-41 32,-44 C28,-41 22,-41 20,-44 Z'), '#6fcf5a', 1.1);
    hdShroom(-62, -44, 1.3, '#ff5f6a'); hdShroom(-50, -44, 0.85, '#ff9a5a');
    hdFrog(44, -44, 1.1);
  },
  bucket() {
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, -56, 30, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#e4ecf6'; ctx.lineWidth = 3; ctx.stroke();
    const body = P2('M-34,-56 L34,-56 L26,0 L-26,0 Z');
    ink(body, hdLin(-34, 0, 34, 0, '#2f7ad0', '#6fc0ff', '#4fa8ff', '#2a6cc0'), 2.5);
    hdClip(body, () => { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-20, -56, 6, 56); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-11, -56, 3, 56); });
    inkRect(-36, -60, 72, 9, hdLin(0, -60, 0, -51, '#d8f2ff', '#8ad4ff'), 2, 4);
    star(0, -27, 14, OL, 5); star(0, -27, 11, '#ffd83a', 5); star(-2, -30, 4, '#fff6a8', 5);
    for (const [x, y] of [[-30, -64], [24, -66]]) inkCircle(x, y, 2.5, '#fff', 0.6);
    ink(P2('M-46,0 C-50,-8 -42,-14 -36,-10 C-32,-6 -34,0 -38,0 Z'), '#ffd0e0', 1);
    hdLines('rgba(200,90,130,.6)', 1, [[-41, -1, -44, -9], [-38, -1, -39, -10]]);
  },
  pot() {
    for (const [x, h, c] of [[-18, 128, '#ff6fae'], [14, 146, '#ffd83a'], [30, 110, '#c6a2ff']]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x * 0.4, -40); ctx.quadraticCurveTo(x, -h * 0.6, x, -h); ctx.stroke();
      ctx.strokeStyle = '#4fae4a'; ctx.lineWidth = 3; ctx.stroke();
    }
    for (const [x, y, a] of [[-24, -70, -0.8], [24, -84, 0.7], [-10, -98, -0.5], [28, -60, 0.9], [-30, -50, -1.1]]) {
      inkAt(x, y, a, P2('M0,0 C-10,-10 -10,-26 0,-34 C10,-26 10,-10 0,0 Z'), hdLin(0, 0, 0, -34, '#3f9a3a', '#7fd35a'), 1.5);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); hdLines('rgba(255,255,255,.45)', 1.2, [[0, -3, 0, -28]]); ctx.restore();
    }
    for (const [x, h, c] of [[-18, 128, '#ff6fae'], [14, 146, '#ffd83a'], [30, 110, '#c6a2ff']]) {
      flower(x, -h, 13, c, '#ff9a2a', 1.4);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(x - 5, -h - 7, 2.5);
    }
    const body = P2('M-36,-46 L36,-46 L28,0 L-28,0 Z');
    ink(body, hdLin(-36, 0, 36, 0, '#b85a2a', '#f09456', '#d8743a', '#a84e22'), 2.5);
    ctx.fillStyle = 'rgba(80,30,10,.25)'; ctx.fillRect(-34, -38, 68, 4);
    ctx.save(); ctx.translate(0, -18); ctx.scale(1.3, 1.3); ink(HD_HEART, '#fff2e6', 1); ctx.restore();
    inkRect(-40, -50, 80, 12, hdLin(0, -50, 0, -38, '#ffb27a', '#e0803e'), 2, 3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-34, -48, 50, 3);
    hdLadybug(-26, -44, 0.8, -0.9);
  },
  mushroom() {
    const sStem = P2('M31,0 L33,-36 L43,-36 L45,0 Z'), sCap = P2('M10,-38 C12,-58 64,-58 66,-38 C50,-33 26,-33 10,-38 Z');
    hdInk([[sStem, hdLin(31, 0, 45, 0, '#fff6e0', '#e8d8b8')], [sCap, hdLin(38, -54, 38, -34, '#ff8a6a', '#e8404e')]], 2);
    ctx.fillStyle = '#fff'; for (const [x, y, r] of [[26, -44, 4], [44, -48, 4.5], [56, -41, 3]]) circle(x, y, r);
    const stem = P2('M-14,0 C-16,-30 -12,-50 -10,-66 L10,-66 C12,-50 16,-30 14,0 Z');
    const gill = P2('M-46,-61 C-30,-52 30,-52 46,-61 C30,-64 -30,-64 -46,-61 Z');
    const cap = P2('M-54,-62 C-50,-96 50,-96 54,-62 C30,-56 -30,-56 -54,-62 Z');
    hdInk([[stem, hdLin(-14, 0, 14, 0, '#e8d8b8', '#fffaf0', '#e0cca8')], [gill, '#f4dcb4'], [cap, hdLin(-20, -96, 10, -58, '#ff8a7a', '#ff4f5a', '#d8323e')]]);
    hdLines('rgba(160,110,60,.5)', 1, [[-30, -58, -26, -61], [-12, -57, -10, -61], [8, -57, 8, -61], [26, -58, 24, -61]]);
    ctx.fillStyle = '#fff'; for (const [x, y, r] of [[-28, -74, 7], [6, -84, 8], [32, -70, 6], [-8, -66, 4], [-44, -66, 3]]) circle(x, y, r);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-18, -86, 12, 4, -0.3);
    hdLadybug(22, -80, 1, 0.5);
  },
  basket() {
    ctx.strokeStyle = OL; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, -44, 34, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#c98a4a'; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.strokeStyle = '#e8b878'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    const body = P2('M-46,-44 L46,-44 L40,0 L-40,0 Z');
    ink(body, hdLin(-46, 0, 46, 0, '#c08040', '#e4b070', '#c88a4a'), 2.5);
    hdClip(body, () => {
      for (let r = 0, y = -40; y < 0; y += 8, r++) for (let x = -50 + (r % 2) * 8; x < 50; x += 16) rrect(x, y, 12, 5, 2.5, 'rgba(255,230,180,.55)');
      ctx.fillStyle = 'rgba(90,50,20,.22)'; ctx.fillRect(-50, -10, 100, 10);
    });
    ctx.lineCap = 'round'; inkRect(-48, -48, 96, 8, hdLin(0, -48, 0, -40, '#f0c080', '#c98a4a'), 2, 4);
    const cloth = P2('M-46,-44 L-8,-44 L-14,-28 L-22,-32 L-30,-26 L-40,-30 Z');
    ink(cloth, '#fff', 1.5);
    hdClip(cloth, () => { ctx.fillStyle = 'rgba(255,80,110,.55)'; for (let x = -46; x < -6; x += 8) ctx.fillRect(x, -46, 4, 22); for (let y = -44; y < -24; y += 8) ctx.fillRect(-48, y, 44, 4); });
    inkAt(30, -18, 0.6, P2('M0,0 C-4,-4 -3,-10 0,-11 C3,-10 4,-4 0,0 Z'), '#5fbf4a', 0.8);
    flower(22, -20, 6, '#ff6fae', '#ffd84a', 0.8);
  },
  duckhouse() {
    inkRect(-6, -54, 12, 54, hdLin(-6, 0, 6, 0, '#7a4a2a', '#b47844', '#7a4a2a'), 2, 2);
    inkRect(-40, -58, 80, 8, hdLin(0, -58, 0, -50, '#e0a868', '#a86a34'), 2, 2);
    const walls = P2('M-34,-108 L34,-108 L34,-56 L-34,-56 Z');
    ink(walls, hdLin(-34, 0, 34, 0, '#fff0b0', '#ffe08a', '#f0c860'), 2.5);
    hdClip(walls, () => { hdLines('rgba(180,130,40,.45)', 1.5, [[-34, -95, 34, -95], [-34, -82, 34, -82], [-34, -69, 34, -69]]); ctx.fillStyle = 'rgba(120,70,20,.15)'; ctx.fillRect(-34, -108, 68, 10); });
    const roof = P2('M-46,-104 L0,-142 L46,-104 Z');
    ink(roof, '#ff6f6a', 2.5);
    hdClip(roof, () => {
      ctx.fillStyle = '#e8504e';
      for (let r = 0, y = -126; y < -100; y += 9, r++) for (let x = -48 + (r % 2) * 7; x < 50; x += 14) { ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.35)'; tri(-6, -136, -34, -110, -26, -110);
    });
    ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(roof);
    ctx.fillStyle = hdLin(0, -90, 0, -56, '#1e1018', '#4a2c1e'); ctx.fill(HIDER_HOLES.duckhouse);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(HIDER_HOLES.duckhouse);
    ctx.save(); ctx.translate(0, -94); ink(HD_HEART, '#ff8ab8', 1); ctx.restore();
    inkCircle(24, -64, 2.5, '#a0683a', 1);
    for (const [x, y, a] of [[5, -14, 0.8], [-5, -26, -0.8], [5, -38, 0.7]]) inkAt(x, y, a, P2('M0,0 C-4,-4 -3,-10 0,-11 C3,-10 4,-4 0,0 Z'), '#5fbf4a', 0.8);
    flower(-6, -44, 4, '#fff', '#ffd84a', 0.7);
  },
  boat() {
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-40, -30); ctx.lineTo(-84, 2); ctx.stroke();
    ctx.strokeStyle = '#d89a5a'; ctx.lineWidth = 4; ctx.stroke();
    inkAt(-88, 5, -0.62, P2('M-14,-5 C-14,-9 10,-9 14,-4 L14,4 C10,9 -14,9 -14,5 Z'), '#e8a868', 1.4);
    const hull = P2('M-86,-38 L86,-38 C80,-10 60,0 40,0 L-40,0 C-60,0 -80,-10 -86,-38 Z');
    ink(hull, hdLin(0, -38, 0, 0, '#ffa070', '#ff7a4a', '#d8542e'), 2.5);
    hdClip(hull, () => {
      hdLines('rgba(150,50,20,.4)', 1.5, [[-86, -16, 86, -16], [-86, -8, 86, -8]]);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-90, -27, 180, 6);
      ctx.fillStyle = 'rgba(40,90,150,.3)'; ctx.fillRect(-90, -5, 180, 6);
    });
    inkRect(-88, -42, 176, 8, hdLin(0, -42, 0, -34, '#fffaf0', '#e8d8c0'), 2, 4);
    inkCircle(-52, -18, 7, '#fff', 1.2);
    ctx.strokeStyle = '#ff4f6a'; ctx.lineWidth = 3.4; ctx.beginPath(); for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { ctx.moveTo(-52 + Math.cos(a) * 6.5, -18 + Math.sin(a) * 6.5); ctx.arc(-52, -18, 6.5, a, a + 0.6); } ctx.stroke();
    ctx.fillStyle = hdLin(0, -18, 0, -11, '#2f98e0', '#1e70b8'); circle(-52, -18, 2.8);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(30, -32, 30, 2);
    text('QUACK', 26, -11, 9, 'rgba(255,246,230,.9)', 'center', 800);
  },
  cloud() {
    const puffs = [[-56, -24, 28], [-24, -46, 36], [18, -50, 40], [56, -28, 30], [0, -20, 34]];
    const shape = new Path2D(); for (const [x, y, r] of puffs) { shape.moveTo(x + r, y); shape.arc(x, y, r, 0, Math.PI * 2); } shape.rect(-60, -24, 120, 24);
    // a trimmed cloud-shaped topiary: trunk and a grassy mound down on the bank
    ink(P2('M-30,40 C-26,30 26,30 30,40 Z'), '#6fcf5a', 1.5);
    ink(P2('M-7,40 C-5,24 -6,10 -8,-6 L8,-6 C6,10 5,24 7,40 Z'), hdLin(-8, 0, 8, 0, '#7a4a2a', '#b47844', '#7a4a2a'), 2);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(shape);
    ctx.fillStyle = hdLin(0, -92, 0, 4, '#9ae47a', '#5fc25a', '#3f9a4a'); ctx.fill(shape, 'nonzero');
    hdClip(shape, () => {
      ctx.strokeStyle = 'rgba(30,100,40,.35)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 30; i++) { const x = -80 + (i * 37) % 160, y = -84 + (i * 23) % 84; ctx.beginPath(); ctx.arc(x, y, 6, 0.3, 2.6); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(-28, -64, 18, 7, -0.3); ellipse(14, -78, 20, 7, -0.1);
      ctx.fillStyle = 'rgba(30,80,40,.2)'; ctx.fillRect(-90, -10, 180, 14);
    });
    for (const [x, y, c] of [[-50, -36, '#fff'], [-20, -66, '#ffc8e4'], [10, -40, '#fff'], [34, -70, '#ffc8e4'], [56, -30, '#fff'], [-6, -82, '#fff'], [-38, -12, '#ffc8e4'], [24, -16, '#fff']]) flower(x, y, 5, c, '#ffd84a', 0.8);
    ctx.save(); ctx.translate(0, 6); ink(P2('M0,0 C-8,-7 -12,2 -10,5 C-7,7 -3,3 0,0 C3,3 7,7 10,5 C12,2 8,-7 0,0 Z'), '#ff6fae', 1); ctx.restore();
  },
  lily() {
    const pad = new Path2D(); pad.moveTo(0, -6); pad.ellipse(0, -6, 64, 16, 0, 0.22, Math.PI * 2 - 0.22); pad.closePath();
    ink(pad, hdLin(0, -22, 0, 10, '#7fdc6a', '#4fbf5f', '#2f9a4a'), 2);
    hdLines('rgba(30,110,50,.5)', 1.5, [[0, -6, -50, -12], [0, -6, -40, 4], [0, -6, 20, 8], [0, -6, -10, -20], [0, -6, 36, -18]]);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-30, -14, 18, 3, -0.1);
    const petal = P2('M0,0 C-16,-14 -10,-40 0,-50 C10,-40 16,-14 0,0 Z'), small = P2('M0,0 C-10,-12 -6,-30 0,-38 C6,-30 10,-12 0,0 Z');
    for (const a of [-1.2, -0.6, 0, 0.6, 1.2]) inkAt(0, -12, a, petal, hdLin(0, 0, 0, -50, '#ff6fae', '#ffb0d6', '#fff0f8'), 1.5);
    for (const a of [-0.3, 0.3]) inkAt(0, -12, a, small, hdLin(0, 0, 0, -38, '#ff9acb', '#fff4fa'), 1.2);
    inkCircle(0, -18, 6, '#ffd84a', 1);
    ctx.fillStyle = '#ff9a2a'; for (const a of [0, 2, 4]) circle(Math.cos(a) * 3, -18 + Math.sin(a) * 3, 1.3);
  },
};
// warm sun from the upper right: shade on the left of every prop, a golden glow on the right
function hdLight(w, h, ox, oy) {
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = hdLin(-110, 0, 110, 0, 'rgba(70,30,110,.24)', 'rgba(70,30,110,0)', 'rgba(255,214,120,.2)'); ctx.fillRect(-ox, -oy, w, h);
  ctx.fillStyle = hdLin(0, -150, 0, 10, 'rgba(255,244,210,.16)', 'rgba(255,244,210,0)'); ctx.fillRect(-ox, -oy, w, h);
  ctx.restore();
}
const HD_BOX = { cloud: [300, 270, 150, 200] };
const hdSprite = kind => {
  const [w, h, ox, oy] = HD_BOX[kind] || [300, 230, 150, 200];
  return sprite(`hd_${kind}`, w, h, ox, oy, () => { HD_ART[kind](); hdLight(w, h, ox, oy); });
};
// the cloud spot is a cloud-shaped topiary on a little trunk, planted on the far bank 40 below
const HD_FOOT = { cloud: 40 };
// static scene dressing over the backdrop: mowing stripes, tufts, paths, deep water and tree reflections
const hdScene = () => sprite('hd_scene', W, H, 0, 0, () => {
  const ground = new Path2D(); ground.rect(0, 262, W, H - 262); ground.addPath(POND);
  hdClip(ground, () => {
    ctx.clip(ground, 'evenodd');
    ctx.save(); ctx.translate(480, 400); ctx.rotate(-0.35);
    for (let i = -14; i < 14; i += 2) { ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(i * 46, -600, 46, 1200); }
    ctx.restore();
    ctx.fillStyle = hdLin(0, 262, 0, 330, 'rgba(200,235,255,.25)', 'rgba(200,235,255,0)'); ctx.fillRect(0, 262, W, 70);
  });
  // a sandy path from the front to the water's edge, and one from the dock up the hill
  for (const p of ['M500,540 C506,510 470,490 488,456 L520,454 C512,486 556,508 552,540 Z', 'M392,282 C380,270 356,262 350,248 L366,246 C374,258 404,268 414,280 Z']) {
    const path = P2(p); ctx.strokeStyle = 'rgba(160,120,70,.5)'; ctx.lineWidth = 3; ctx.stroke(path); ctx.fillStyle = hdLin(0, 450, 0, 540, '#f4e2b0', '#e8cf98'); ctx.fill(path);
  }
  ctx.fillStyle = 'rgba(160,130,90,.35)'; for (const [x, y, r] of [[504, 470, 3], [516, 492, 2.5], [522, 520, 3.5], [534, 506, 2], [498, 530, 2.5], [372, 258, 2]]) ellipse(x, y, r * 1.4, r);
  // deep water in the middle, bright shallows at the edge, trees mirrored on the far side
  hdClip(POND, () => {
    const deep = ctx.createRadialGradient(485, 392, 20, 485, 380, 420);
    deep.addColorStop(0, 'rgba(20,60,150,.32)'); deep.addColorStop(0.6, 'rgba(20,60,150,.12)'); deep.addColorStop(1, 'rgba(20,60,150,0)');
    ctx.save(); ctx.translate(485, 380); ctx.scale(1, 0.22); ctx.translate(-485, -380); ctx.fillStyle = deep; ctx.fillRect(0, -1200, W, 3000); ctx.restore();
    ctx.strokeStyle = 'rgba(190,250,255,.45)'; ctx.lineWidth = 26; ctx.stroke(POND);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6; ctx.stroke(POND);
    for (const [x, w, c] of [[40, 50, '#3f9a4a'], [180, 44, '#4fae4a'], [560, 42, '#3f9a4a'], [700, 50, '#4fae4a'], [930, 56, '#2f7a4a']]) {
      ctx.fillStyle = c; ctx.globalAlpha = 0.22; ellipse(x, 300, w, 14); ellipse(x - w * 0.4, 308, w * 0.5, 9); ctx.globalAlpha = 1;
    }
  });
  // grass tufts and little flowers filling the empty patches
  for (let i = 0; i < 46; i++) {
    const x = (i * 197 + 31) % 940 + 10, y = 270 + (i * 113) % 268;
    if (hdWet(x, y) || ((x - 485) / 470) ** 2 + ((y - 368) / 100) ** 2 < 1) continue;
    const s = 0.6 + (y - 270) / 268 * 0.7;
    ctx.strokeStyle = i % 2 ? '#4fae4a' : '#5fbf4a'; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round'; ctx.beginPath();
    for (const [dx, h] of [[-5, 10], [-1, 15], [3, 12], [7, 8]]) { ctx.moveTo(x + dx * s, y); ctx.quadraticCurveTo(x + dx * s, y - h * s * 0.6, x + (dx * 1.6) * s, y - h * s); }
    ctx.stroke();
    if (i % 3 === 0) flower(x + 9 * s, y - 6 * s, 4 * s, ['#fff', '#ff9acb', '#ffe24a', '#c6a2ff'][i % 4], '#ffd84a', 0.8);
  }
});
// the very front: grass and flowers framing the bottom corners, gently swaying
function hdFrame() {
  for (const [x0, dir] of [[0, 1], [W, -1]]) {
    ctx.save(); ctx.translate(x0, H + 4); ctx.scale(dir, 1);
    [[4, 70, 0.3], [14, 92, 0.12], [26, 64, 0.38], [8, 50, 0.6], [32, 44, 0.5]].forEach(([x, h, lean], k) => {
      const tx = x + (lean + Math.sin(S.t * 1.2 + k) * 0.04) * h;
      ink(P2(`M${x - 6},0 Q${x - 4},${-h * 0.6} ${tx},${-h} Q${x + 4},${-h * 0.6} ${x + 7},0 Z`), hdLin(x, 0, tx, -h, '#2f8a3a', k % 2 ? '#5fbf4a' : '#7fd35a'), 1.5);
    });
    flower(30, -64, 8, dir > 0 ? '#ff6fae' : '#ffe24a', '#ff9a2a', 1.1);
    ctx.restore();
  }
}
// boats, logs and rocks are mirrored in the water, with a wobble (ducks never are: no free clues)
function hdReflect(sp, x, y, sc) {
  const N = 14, band = sp.oy / N, db = band * sc * 0.55;
  ctx.save(); ctx.clip(POND); ctx.globalAlpha = 0.24;
  for (let k = 0; k < N; k++) {
    const wave = Math.sin(S.t * 3 + k * 0.9 + x) * 2.5 * (k / N + 0.3);
    ctx.drawImage(sp.c, 0, (sp.oy - (k + 1) * band) * DPR, sp.w * DPR, band * DPR, x - sp.ox * sc + wave, y + k * db, sp.w * sc, db + 0.5);
  }
  ctx.restore();
}
// soft beams from the sun and a gentle vignette, over the scene but under the UI
const hdVignette = () => sprite('hd_vig', W, H, 0, 0, () => {
  const v = ctx.createRadialGradient(W / 2, H / 2 + 20, 260, W / 2, H / 2, 620);
  v.addColorStop(0, 'rgba(50,20,70,0)'); v.addColorStop(1, 'rgba(50,20,70,.26)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
});
function hdRays() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 4; k++) {
    const a = 0.035 + 0.025 * Math.sin(S.t * 0.6 + k * 1.7), x = 830 - k * 120, w = 30 + k * 12;
    ctx.fillStyle = hdLin(x, 60, x - 360, 520, `rgba(255,236,170,${a})`, 'rgba(255,236,170,0)');
    ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x + w, 60); ctx.lineTo(x + w - 380, 540); ctx.lineTo(x - w * 2 - 380, 540); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  blit(hdVignette(), 0, 0);
}
// reeds and cattails, drawn live so they sway (bottom centre at 0,0)
function hdReeds(back, sw) {
  const blades = back ? [[-44, 96, -0.25], [-30, 128, -0.1], [-18, 110, 0.12], [6, 118, 0.2], [30, 104, 0.25], [42, 124, 0.1], [0, 92, -0.2]]
    : [[-38, 80, 0.3], [-6, 136, -0.05], [18, 132, 0.02], [36, 84, -0.3]];
  blades.forEach(([x, h, lean], i) => {
    const tx = x + (lean + sw * (0.7 + (i % 3) * 0.2)) * h;
    ink(P2(`M${x - 6},0 Q${x - 4},${-h * 0.6} ${tx},${-h} Q${x + 4},${-h * 0.6} ${x + 6},0 Z`), hdLin(x, 0, tx, -h, back ? '#2f7a34' : '#3f9a3a', i % 2 ? '#5fbf4a' : '#86d862'), 1.5);
    hdLines('rgba(255,255,255,.35)', 1.2, [[x, -6, x, -h * 0.6, tx, -h + 8]]);
  });
  if (!back) return;
  for (const [x, h] of [[-24, 120], [8, 146], [30, 116]]) {
    const tx = x + sw * h * 0.45;
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x, -h * 0.5, tx, -h); ctx.stroke();
    ctx.strokeStyle = '#4f9a3a'; ctx.lineWidth = 2.5; ctx.stroke();
    inkAt(tx, -h, sw * 0.5, P2('M-6,10 C-6,3 6,3 6,10 L6,28 C6,35 -6,35 -6,28 Z'), hdLin(-6, 0, 6, 0, '#a86a3a', '#8a5a32', '#5e361c'), 1.5);
    ctx.fillStyle = 'rgba(255,220,180,.4)'; ellipse(tx - 2, -h + 16, 1.6, 6);
  }
}
// a toy duck with a glossy, rounded finish on top of the costume
function hdDuck(kind, x, y, s, flip = false) {
  drawRubberDuck(kind, x, y, s, flip);
  if (kind === 'ghost') return;
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
  hdClip(RD_BODY, () => {
    ctx.fillStyle = hdLin(0, -46, 0, 0, 'rgba(255,255,255,0)', 'rgba(110,50,0,.24)'); ctx.fillRect(-60, -56, 120, 58);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-36, -40, 10, 3, 0.5);
  });
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(38, -30, 2.6, 7, 0.7); circle(-40, -46, 2);
  ctx.fillStyle = 'rgba(255,110,150,.35)'; circle(26, -54, 4.5);
  ctx.restore();
}
function hdDragonfly(x, y, ang, body, wing) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const f = Math.sin(S.t * 46) * 0.35;
  ctx.fillStyle = wing; ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 1;
  for (const [wx, sgn] of [[2, -1], [2, 1], [-4, -1], [-4, 1]]) { ctx.beginPath(); ctx.ellipse(wx, sgn * 9, 12, 4, sgn * (0.35 + f), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ink(P2('M-26,0 C-26,-2 2,-3 4,0 C2,3 -26,2 -26,0 Z'), body, 1);
  inkCircle(7, 0, 4.5, body, 1);
  ctx.fillStyle = '#2a1a3a'; circle(9, -2.5, 1.8); circle(9, 2.5, 1.8);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 4; i++) ctx.fillRect(-20 + i * 5, -1, 2, 2);
  ctx.restore();
}
// sparkles drifting on the pond, behind the hiding places
function hdShimmer() {
  ctx.save(); ctx.clip(POND);
  for (let i = 0; i < 16; i++) {
    const x = (i * 137 + S.t * (10 + (i % 3) * 4)) % 900 + 40, y = 300 + (i * 53) % 140, a = 0.5 + 0.5 * Math.sin(S.t * 2.6 + i * 1.7);
    ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`; ellipse(x, y, 10 + (i % 4) * 4, 1.6);
    if (i % 3 === 0) star(x + 6, y - 3, 3 + a * 3, `rgba(255,255,240,${a})`, 4);
  }
  ctx.restore();
}
// the toy tub the found ducks float in; empty spots show a faint duck shape
function hdTray(g, tx) {
  // a little wooden "duck parade" shelf hanging from the header on two ropes
  const n = g.ducks.length, x0 = tx(0) - 32, w = tx(n - 1) - tx(0) + 64, y = 64;
  ctx.lineCap = 'round';
  for (const rx of [x0 + 18, x0 + w - 18]) { ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(rx, 54); ctx.lineTo(rx, y + 6); ctx.stroke(); ctx.strokeStyle = '#e8c890'; ctx.lineWidth = 2.5; ctx.stroke(); }
  const board = new Path2D(); board.roundRect(x0 + 6, y, w - 12, 48, [10, 10, 0, 0]);
  const lip = new Path2D(); lip.roundRect(x0, y + 44, w, 13, 5);
  ctx.save(); ctx.shadowColor = 'rgba(30,10,50,.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; ctx.fillStyle = '#c98a4a'; ctx.fill(board); ctx.fill(lip); ctx.restore();
  hdInk([[board, hdLin(0, y, 0, y + 48, '#f6dcae', '#e8c08a')], [lip, hdLin(0, y + 44, 0, y + 57, '#d89a5a', '#a86a34')]], 1.5);
  hdClip(board, () => hdLines('rgba(170,110,60,.3)', 1.5, [[x0, y + 12, x0 + w / 2, y + 8, x0 + w, y + 13], [x0, y + 28, x0 + w / 2, y + 32, x0 + w, y + 27]]));
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x0 + 8, y + 46, w - 16, 2.5);
  for (const nx of [x0 + 8, x0 + w - 8]) inkCircle(nx, y + 50, 2.2, '#ffd84a', 0.6);
  g.ducks.forEach((d, i) => {
    if (d.found && d.ft >= 1.1) return;
    // an empty spot: a little arched cubby with a dotted duck outline waiting to be filled
    const cx = tx(i), cub = new Path2D(); cub.roundRect(cx - 21, y + 6, 42, 39, [18, 18, 3, 3]);
    ctx.fillStyle = 'rgba(150,90,40,.16)'; ctx.fill(cub);
    ctx.save(); ctx.translate(cx - 1, y + 43); ctx.scale(0.36, 0.36);
    ctx.setLineDash([7, 7]); ctx.strokeStyle = 'rgba(91,63,115,.45)'; ctx.lineWidth = 4; ctx.stroke(RD_BODY); ctx.stroke(RD_HEAD); ctx.setLineDash([]);
    ctx.restore();
    text('?', cx - 2, y + 25, 14, 'rgba(91,63,115,.45)', 'center', 800);
  });
}
// shenanigans helpers: is a point in the pond (rough ellipse), a sweat drop, a periscope
const hdWet = (x, y) => ((x - 485) / 445) ** 2 + ((y - 368) / 82) ** 2 < 1;
const HD_DROP = P2('M0,-10 C3,-4 7,0 7,4 C7,8 4,11 0,11 C-4,11 -7,8 -7,4 C-7,0 -3,-4 0,-10 Z');
function hdSweat(x, y, sz, a) {
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(x, y); ctx.scale(sz, sz);
  ink(HD_DROP, '#8ad8ff', 1.2); ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(-2.5, 3, 1.6, 3, -0.3);
  ctx.restore();
}
// pipe rising h px from the water at (x, y), lens facing dir
function hdPeriscope(x, y, h, dir) {
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.lineTo(x + dir * 12, y - h); ctx.stroke();
  ctx.strokeStyle = '#9aa8bc'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 1, y - 4); ctx.lineTo(x - 1, y - h + 4); ctx.stroke();
  inkEllipse(x + dir * 15, y - h, 3, 6, 0, '#8ad8ff', 1);
  ctx.fillStyle = '#fff'; circle(x + dir * 15, y - h - 2, 1.4);
  ctx.restore();
}
MG.hideduck = {
  kind: 'learn', title: () => 'Duck Hide & Seek', icon: () => '🦆',
  how: g => `${g.ducks.length} silly rubber ducks are hiding round the pond! Some are easy to spot and some are very sneaky. Click each duck to find it.`,
  init(g) {
    const n = [7, 9, 11][g.tier - 1], easy = Math.ceil(n * 0.4), medium = Math.round(n * 0.3);
    const kinds = shuffle(Object.keys(RUBBER_DUCKS));
    g.ducks = shuffle(HIDE_SLOTS.map((_, i) => i)).slice(0, n).map((slot, i) => {
      const d = i < easy ? 0 : i < easy + medium ? 1 : 2;
      return { slot, kind: kinds[i], peek: HIDE_PEEKS[HIDE_SLOTS[slot][0]].find(p => p.d === d), found: false, ft: 0 };
    });
    Object.assign(g, { timeLeft: [90, 85, 80][g.tier - 1], since: 0, hints: 0, hint: null, wiggle: {}, hdSplash: [], hdPuffs: [], hdNext: 2.5, hdRelocs: 0, hdLastDash: -99, hdGulp: 0 });
  },
  // where a duck's feet are when sitting in its hiding place: [x, y, scale]
  base(d) { const [, x, y, sc] = HIDE_SLOTS[d.slot]; return [x + d.peek.x * sc, y + d.peek.y * sc, d.peek.s * sc]; },
  // where a duck's click spot is on screen right now (follows its peeking, trembling or running)
  spot(d) {
    const [, x, y, sc] = HIDE_SLOTS[d.slot], [hx, hy, hr] = d.peek.hit, p = d.pose;
    if (p?.run) { const [rx, ry, rs] = p.run; return [rx + (p.flip ? -10 : 10) * rs, ry - 45 * rs, Math.max(22, 40 * rs)]; }
    return [x + hx * sc + (p?.dx || 0), y + hy * sc + (p?.dy || 0), hr * sc];
  },
  // every place a click finds this duck: its usual spot, where it is now, and a periscope tip
  hits(d) {
    const [, x, y, sc] = HIDE_SLOTS[d.slot], [hx, hy, hr] = d.peek.hit, out = [this.spot(d)];
    if (!d.pose?.run) out.push([x + hx * sc, y + hy * sc, hr * sc]);
    if (d.pose?.scope) out.push([d.pose.scope[0], d.pose.scope[1], 24]);
    return out;
  },
  // --- shenanigans: hidden ducks peek, giggle, sneeze, nap, raise periscopes, sweat when you're
  // close, and (rarely, with a warning) dash to a new hiding place. All are clues, never traps.
  pose(g, d) {
    const a = d.act, t = a?.t || 0, s = this.base(d)[2], p = { dx: 0, dy: 0, rot: 0, flip: !!d.peek.f };
    if (a?.type === 'peek') {
      const rise = t < 0.2 ? t / 0.2 : t < 1.3 ? 1 : Math.max(0, 1 - (t - 1.3) / 0.15);
      p.dy = -rise * 52 * s;
      if (t > 0.45 && t < 1.3 && Math.floor((t - 0.45) / 0.28) % 2 === 0) p.flip = !p.flip;   // looking around
    } else if (a?.type === 'sneeze') {
      if (t < 0.6) { p.dy = -(t / 0.6) * 16 * s; p.rot = -0.12 * t / 0.6; } else { const k = clamp((t - 0.6) / 0.6, 0, 1); p.dy = -(1 - k) * 22 * s; p.rot = 0.28 * (1 - k); }
    } else if (a?.type === 'giggle') { p.dx = Math.sin(t * 40) * 2; p.rot = Math.sin(t * 25) * 0.08; }
    else if (a?.type === 'sleep') { p.rot = Math.sin(t * 1.5) * 0.12; p.dy = Math.sin(t * 1.5) * 1.5; }
    else if (a?.type === 'periscope') {
      const [bx] = this.base(d), y0 = HIDE_SLOTS[d.slot][2], h = 110 * HIDE_SLOTS[d.slot][3] * Math.min(1, t / 0.4, (2.6 - t) / 0.3);
      p.scope = [bx, y0 - h, h, Math.floor(t / 0.6) % 2 ? -1 : 1];
    } else if (a?.type === 'dash') {
      if (t < 0.7) p.dx = Math.sin(t * 70) * 2.5;
      else {
        const [fx, fy, fs] = a.from, [tx, ty, ts] = a.toPos, k = clamp((t - 0.7) / a.dur, 0, 1), e = k * k * (3 - 2 * k);
        p.run = [lerp(fx, tx, e), lerp(fy, ty, e) - Math.abs(Math.sin(k * Math.PI * a.hops)) * 18, lerp(fs, ts, e)];
        p.flip = tx < fx; p.rot = Math.sin(k * Math.PI * a.hops * 2) * 0.18;
      }
    }
    p.dx += Math.sin(S.t * 55 + d.slot) * [2.2, 1.4, 0.8][g.tier - 1] * (d.nerv || 0);
    return p;
  },
  dashTo(d, slot) {
    const [kind, x, y, sc] = HIDE_SLOTS[slot], peek = HIDE_PEEKS[kind].find(p => p.d === d.peek.d);
    const from = this.base(d), toPos = [x + peek.x * sc, y + peek.y * sc, peek.s * sc], dist = Math.hypot(toPos[0] - from[0], toPos[1] - from[1]);
    d.act = { type: 'dash', t: 0, to: slot, peek, from, toPos, dur: clamp(dist / 360, 0.7, 1.8), hops: Math.max(2, Math.round(dist / 70)), puff: 0 };
  },
  startAct(g, left) {
    const far = (x, y, r) => Math.hypot(pointer.x - x, pointer.y - y) > r;
    const free = left.filter(d => { const [x, y] = this.spot(d); return far(x, y, 150); });
    if (!free.length) return;
    // relocations: capped, spaced out, never the hinted duck, never to/from a spot near the pointer
    const movers = free.filter(d => d !== g.hint && HIDE_SLOTS[d.slot][0] !== 'cloud' && !d.peek.in);
    const taken = new Set(left.map(d => d.slot).concat(left.filter(d => d.act?.to != null).map(d => d.act.to)));
    const empties = HIDE_SLOTS.map((s, i) => i).filter(i => !taken.has(i) && HIDE_SLOTS[i][0] !== 'cloud' && far(HIDE_SLOTS[i][1], HIDE_SLOTS[i][2] - 40, 160));
    if (g.hdRelocs < [2, 3, 3][g.tier - 1] && g.t - g.hdLastDash > 12 && g.t > 8 && movers.length && Math.random() < 0.3) {
      g.hdRelocs++; g.hdLastDash = g.t;
      if (movers.length > 1 && Math.random() < 0.35) { const [a, b] = shuffle(movers); const sa = a.slot; this.dashTo(a, b.slot); this.dashTo(b, sa); return; }
      if (empties.length) { this.dashTo(pick(movers), pick(empties)); return; }
      g.hdRelocs--;
    }
    const d = pick(free), kind = HIDE_SLOTS[d.slot][0], opts = [['giggle', 1.6], ['sleep', 1.1]];
    if (!d.peek.in) opts.push(['peek', 3]);
    if (['pot', 'bush', 'reeds', 'lily', 'mushroom', 'basket'].includes(kind)) opts.push(['sneeze', 1.5]);
    if (HD_WATER[kind] && kind !== 'duckhouse' && !d.peek.in) opts.push(['periscope', 1.6]);
    let r = Math.random() * opts.reduce((s, o) => s + o[1], 0);
    const type = opts.find(o => (r -= o[1]) < 0)?.[0] || 'peek';
    d.act = { type, t: 0, k: 0 };
    if (type === 'periscope') tone(400, 0.1, 'sine', 0.04, 0, 800);
  },
  endAct(g, d) { d.act = null; g.hdNext = Math.max(g.hdNext, rand(2.5, 5)); },
  shenanigans(g, dt) {
    const left = g.ducks.filter(d => !d.found), tier = g.tier - 1;
    g.hdGulp = Math.max(0, g.hdGulp - dt);
    for (const d of left) {
      // nervous sweat when the pointer gets close: a hot / cold clue (bigger and wider at tier 1)
      const [hx, hy] = this.spot(d), hot = Math.hypot(pointer.x - hx, pointer.y - hy) < [150, 115, 85][tier] && !d.pose?.run;
      d.nerv = clamp((d.nerv || 0) + (hot ? dt * 2.5 : -dt * 1.5), 0, 1);
      d.gulpCd = Math.max(0, (d.gulpCd || 0) - dt);
      if (d.nerv > 0.7 && !d.gulpCd && !g.hdGulp) { d.gulpCd = 5; g.hdGulp = 1.5; tone(320, 0.07, 'sine', 0.05, 0, 200); tone(240, 0.09, 'sine', 0.05, 0.09, 150); }
      const a = d.act;
      if (a) {
        a.t += dt;
        const [sx, sy] = this.spot(d);
        if (a.type === 'peek') { if (a.t >= 1.3 && !a.k) { a.k = 1; tone(1500, 0.06, 'square', 0.035, 0, 2300); } if (a.t > 1.5) this.endAct(g, d); }
        else if (a.type === 'giggle') {
          if (a.t >= a.k * 0.5 && a.k < 3) { a.k++; g.wiggle[d.slot] = 0.4; tone(1500 + a.k * 120, 0.06, 'sine', 0.04); tone(1800 + a.k * 120, 0.06, 'sine', 0.04, 0.1); }
          if (a.t > 1.6) this.endAct(g, d);
        } else if (a.type === 'sneeze') {
          if (a.t >= 0.6 && !a.k) {
            a.k = 1; g.wiggle[d.slot] = 0.4; floatText(sx, sy - 34, 'ACHOO!', '#fff6a8', false, 16);
            burst(sx, sy - 10, 12, { colors: ['#ffe24a', '#fff6a8', '#ffd0f0'], spread: 70, up: 50, size: [2, 4] });
            tone(900, 0.05, 'sawtooth', 0.03); tone(320, 0.16, 'sawtooth', 0.05, 0.05, 150);
          }
          if (a.t > 1.3) this.endAct(g, d);
        } else if (a.type === 'sleep') {
          if (a.t >= a.k * 1.5) { a.k++; tone(140, 0.4, 'sine', 0.025, 0, 110); }
          if (a.t > 4.5 || d.nerv > 0.5) { if (a.t <= 4.5) floatText(sx, sy - 30, '!', '#fff6a8', false, 18); this.endAct(g, d); }
        } else if (a.type === 'periscope') { if (a.t > 2.6) this.endAct(g, d); }
        else if (a.type === 'dash') {
          // the tell: it shakes with a "!" first; if Aubrey reaches for it now, it stays put
          if (a.t < 0.7) { g.wiggle[d.slot] = Math.max(g.wiggle[d.slot] || 0, 0.2); if (d.nerv > 0.2) this.endAct(g, d); }
          else {
            if (!a.k) { a.k = 1; tone(500, 0.25, 'square', 0.03, 0, 1300); }
            const [rx, ry] = d.pose?.run || this.base(d);
            if ((a.puff -= dt) <= 0) { a.puff = 0.07; g.hdPuffs.push({ x: rx, y: ry, t: 0, wet: hdWet(rx, ry) }); }
            if (a.t >= 0.7 + a.dur) {
              d.slot = a.to; d.peek = a.peek; g.hdPuffs.push({ x: a.toPos[0], y: a.toPos[1], t: 0, wet: hdWet(a.toPos[0], a.toPos[1]), big: 1 });
              tone(1200, 0.06, 'square', 0.03, 0, 1700); this.endAct(g, d);
            }
          }
        }
      }
      d.pose = this.pose(g, d);
    }
    for (const p of g.hdPuffs) p.t += dt;
    g.hdPuffs = g.hdPuffs.filter(p => p.t < 0.5);
    g.hdNext -= dt;
    if (g.hdNext <= 0 && left.length && !left.some(d => d.act)) { this.startAct(g, left); g.hdNext = rand(3, 5.5); }
  },
  // drawn over the hiding places: sweat drops, "!" before a dash, the dashing duck, giggles, Zzz, "ah..."
  drawShenanigans(g) {
    for (const p of g.hdPuffs) {
      const k = p.t / 0.5, r = (p.big ? 10 : 5) + k * (p.big ? 22 : 12);
      if (p.wet) { ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 1.4, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = `rgba(220,245,255,${0.8 * (1 - k)})`; circle(p.x - r * 0.6, p.y - k * 16, 2.5); circle(p.x + r * 0.5, p.y - k * 20, 2); }
      else { ctx.fillStyle = `rgba(240,228,200,${0.75 * (1 - k)})`; circle(p.x - r * 0.5, p.y - 4 - k * 8, r * 0.7); circle(p.x + r * 0.4, p.y - 6 - k * 10, r * 0.55); }
    }
    for (const d of g.ducks) {
      if (d.found) continue;
      const p = d.pose || {}, a = d.act, t = a?.t || 0;
      let [bx, by, s] = this.base(d);
      if (HD_FLOAT[HIDE_SLOTS[d.slot][0]]) by += Math.sin(S.t * 1.6 + d.slot) * 2;
      if (p.run) {
        // the dash: waddle-hop across with speed lines streaming behind
        const [rx, ry, rs] = p.run, dir = p.flip ? -1 : 1;
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (const [oy, len] of [[20, 26], [40, 34], [60, 22]]) { ctx.beginPath(); ctx.moveTo(rx - dir * (40 * rs + 8), ry - oy * rs); ctx.lineTo(rx - dir * (40 * rs + 8 + len), ry - oy * rs); ctx.stroke(); }
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(p.rot); hdDuck(d.kind, 0, 0, rs, p.flip); ctx.restore();
        outlined('!', rx + dir * 30 * rs, ry - 100 * rs, 20, '#fff6a8');
        continue;
      }
      const dir = p.flip ? -1 : 1, hx = bx + (p.dx || 0) + dir * 16 * s, hy = by + (p.dy || 0) - 62 * s;
      if (d.nerv > 0.05) {
        const drip = (S.t * 10) % 8;
        hdSweat(hx - dir * 26 * s, hy - 14 * s + drip, [1.3, 1.05, 0.8][g.tier - 1], d.nerv * (1 - drip / 10));
      }
      if (!a) continue;
      if (a.type === 'dash' && t < 0.7) outlined('!', hx, hy - 40 * s - Math.abs(Math.sin(t * 12)) * 6, 26, '#ff5f6a');
      else if (a.type === 'giggle') for (let j = 0; j < 3; j++) {
        const k = (t * 0.9 + j * 0.33) % 1; if (t + j * 0.33 > 1.6) continue;
        ctx.globalAlpha = 1 - k; outlined('hee', hx + (j - 1) * 22 + Math.sin(k * 9) * 4, hy - 30 * s - k * 40, 13, '#ffb3e0'); ctx.globalAlpha = 1;
      } else if (a.type === 'sleep') for (let j = 0; j < 3; j++) {
        const k = (t * 0.5 + j / 3) % 1;
        ctx.globalAlpha = Math.min(1, t) * (1 - k); outlined('z', hx + dir * (10 + k * 26), hy - 30 * s - k * 46, 11 + k * 12, '#c6b2ff'); ctx.globalAlpha = 1;
      } else if (a.type === 'sneeze' && t < 0.6) outlined(t < 0.3 ? 'ah...' : 'ah... ah...', hx, hy - 36 * s, 13, '#fff6a8');
    }
  },
  trayX(g, i) { return W / 2 + (i - (g.ducks.length - 1) / 2) * 54; },
  update(g, dt) {
    g.timeLeft -= dt; g.since += dt;
    g.ducks.forEach((d, i) => {
      if (!d.found) return;
      const was = d.ft; d.ft += dt;
      // plop! it lands in the toy tub
      if (was < 1.1 && d.ft >= 1.1) { tone(700, 0.08, 'sine', 0.05, 0, 1100); g.hdSplash.push({ x: this.trayX(g, i), y: 106, t: 0, w: 0.5 }); burst(this.trayX(g, i), 90, 6, { colors: ['#fff6a8', '#ffd83a'], spread: 50, up: 40, size: [2, 4] }); }
    });
    for (const s of g.hdSplash) s.t += dt;
    g.hdSplash = g.hdSplash.filter(s => s.t < 0.8);
    for (const k in g.wiggle) if ((g.wiggle[k] -= dt) <= 0) delete g.wiggle[k];
    this.shenanigans(g, dt);
    const left = g.ducks.filter(d => !d.found);
    // stuck for a while: a sparkle shows where the easiest duck left is
    if (!g.hint && g.since > 15 && left.length) { g.hint = left.reduce((a, b) => (b.peek.d < a.peek.d ? b : a)); g.hints++; }
    if (pointer.clicked) {
      const d = left.find(d => this.hits(d).some(([x, y, r]) => Math.hypot(pointer.x - x, pointer.y - y) < r + 10));
      if (d) {
        d.found = true; g.since = 0; if (g.hint === d) g.hint = null;
        const [x, y] = d.fpos = this.spot(d);
        d.act = null; d.nerv = 0;
        tone(420, 0.1, 'sine', 0.05, 0.12, 820);   // gasp! ...then a giggle
        for (let k = 0; k < 4; k++) tone(k % 2 ? 1100 : 900, 0.06, 'square', 0.03, 0.4 + k * 0.09);
        const wet = HD_WATER[HIDE_SLOTS[d.slot][0]];
        squeak(); burst(x, y, 18, { colors: ['#fff6a8', '#ffd83a', '#ffffff', '#ffb3e0'] });
        if (wet) { burst(x, y + 24, 10, { kind: 'bubble', spread: 70, up: 60, size: [2, 4] }); tone(500, 0.14, 'sine', 0.05, 0.05, 1300); }
        g.hdSplash.push({ x, y: y + 26, t: 0, w: 1 });
        floatText(x, y - 40, `${RUBBER_DUCKS[d.kind][0]}!`, '#fff6a8', false, 24);
        speak(`You found ${RUBBER_DUCKS[d.kind][0]}!`);
      } else {
        // a click on a hiding place with no duck there gives it a little shake
        const slot = HIDE_SLOTS.findIndex(([, x, y, sc]) => Math.abs(pointer.x - x) < 70 * sc && pointer.y < y + 6 && pointer.y > y - 130 * sc);
        if (slot >= 0) { g.wiggle[slot] = 0.4; SFX.blip(); burst(pointer.x, pointer.y, 5, { colors: ['#7fd35a', '#5fbf4a', '#c8f0a0'], spread: 60, up: 40, size: [2, 4] }); }
      }
    }
    g.progress = `Found ${g.ducks.length - left.length} of ${g.ducks.length}`;
    g.score = Math.max(0, (g.ducks.length - left.length) / g.ducks.length - 0.08 * g.hints);
    if (!left.length && g.ducks.every(d => d.ft > 1.1)) g.done = true;
    if (g.timeLeft <= 0) g.done = true;
  },
  draw(g) {
    blit(hdScene(), 0, 0);
    hdShimmer();
    // things in the water are mirrored in it
    for (const [kind, x, y0, sc] of HIDE_SLOTS) if (HD_WATER[kind] && kind !== 'reeds' && kind !== 'lily') hdReflect(hdSprite(kind), x, y0 + (HD_FLOAT[kind] ? Math.sin(S.t * 1.6) : 0) + 2, sc);
    // back to front: ducks still hiding go behind their hiding place (or inside its hole)
    const order = HIDE_SLOTS.map((s, i) => i).sort((a, b) => HIDE_SLOTS[a][2] - HIDE_SLOTS[b][2]);
    let hazed = false;
    for (const i of order) {
      const [kind, x, y0, sc, v] = HIDE_SLOTS[i], here = g.ducks.filter(d => d.slot === i && !d.found && !d.pose?.run);
      // a light haze over the far bank (once, after the far things are drawn) for depth
      if (!hazed && y0 >= 300) { hazed = true; ctx.fillStyle = hdLin(0, 130, 0, 310, 'rgba(225,240,255,0)', 'rgba(225,240,255,.12)', 'rgba(225,240,255,0)'); ctx.fillRect(0, 130, W, 180); }
      if (HD_FOOT[kind]) { ctx.fillStyle = 'rgba(40,100,40,.28)'; ellipse(x, y0 + HD_FOOT[kind] * sc, 34 * sc, 6 * sc); }
      const y = y0 + (HD_FLOAT[kind] ? Math.sin(S.t * 1.6 + i) * 2 : 0), sw = Math.sin(S.t * 1.3 + i) * 0.05;
      const wig = g.wiggle[i] ? Math.sin(g.wiggle[i] * 40) * 0.05 : 0;
      // grounding: a soft shadow on the grass, or ripples round things in the water
      if (HD_LAND[kind]) { ctx.fillStyle = 'rgba(40,100,40,.24)'; ellipse(x, y0 + 1, HD_LAND[kind] * sc, 8 * sc); }
      if (HD_WATER[kind]) {
        const rw = HD_WATER[kind] * sc;
        ctx.fillStyle = 'rgba(30,90,160,.18)'; ellipse(x, y0 + 2, rw, 7 * sc);
        for (let k = 0; k < 2; k++) {
          const p = (S.t * 0.4 + k * 0.5 + i * 0.13) % 1;
          ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - p)})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(x, y0 + 2, rw + p * 30 * sc, (6 + p * 8) * sc, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      const duck = d => {
        const p = d.pose || { dx: 0, dy: 0, rot: 0, flip: !!d.peek.f };
        ctx.save(); ctx.translate(x + d.peek.x * sc + p.dx, y + d.peek.y * sc + p.dy + Math.sin(S.t * 2 + i) * 1.5); ctx.rotate(p.rot);
        hdDuck(d.kind, 0, 0, d.peek.s * sc, p.flip); ctx.restore();
      };
      // a periscope pokes up from behind its hiding place
      for (const d of here) if (d.pose?.scope) {
        const [px, , h, dir] = d.pose.scope;
        hdPeriscope(px, y0 + 2, h, dir);
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, y0 + 2, 10 + Math.sin(S.t * 6) * 2, 3, 0, 0, Math.PI * 2); ctx.stroke();
      }
      const layer = fn => { ctx.save(); ctx.translate(x, y); ctx.rotate(wig); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; fn(); ctx.restore(); };
      if (kind === 'reeds') layer(() => { ctx.scale(sc, sc); hdReeds(true, sw); });
      here.filter(d => !d.peek.in).forEach(duck);
      layer(() => {
        if (kind === 'reeds') { ctx.scale(sc, sc); hdReeds(false, sw); } else if (kind === 'bush') drawHider(kind, 0, 0, sc, v); else blit(hdSprite(kind), 0, 0, sc);
      });
      for (const d of here.filter(d => d.peek.in)) {
        ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.clip(HIDER_HOLES[kind]); ctx.scale(1 / sc, 1 / sc); ctx.translate(-x, -y);
        duck(d); ctx.restore();
      }
    }
    if (g.hint) {
      const [x, y, r] = this.spot(g.hint), pulse = 0.5 + 0.5 * Math.sin(S.t * 5);
      ctx.strokeStyle = `rgba(255,246,168,${0.4 + 0.4 * pulse})`; ctx.lineWidth = 3; ctx.setLineDash([6, 8]); ctx.lineDashOffset = -S.t * 30;
      ctx.beginPath(); ctx.arc(x, y, r + 8 + pulse * 4, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      for (let k = 0; k < 3; k++) star(x + Math.cos(S.t * 3 + k * 2.1) * (r + 14), y + Math.sin(S.t * 3 + k * 2.1) * (r + 14), 7, '#fff6a8', 4);
    }
    this.drawShenanigans(g);
    // two dragonflies looping over the pond
    {
      const t = S.t, p1 = s => [250 + Math.sin(s * 0.5) * 170, 205 + Math.sin(s * 1.1) * 26], p2 = s => [760 + Math.cos(s * 0.6) * 120, 250 + Math.sin(s * 1.4) * 30];
      for (const [p, b, w] of [[p1, '#2a8ad8', 'rgba(200,240,255,.65)'], [p2, '#ff5f9a', 'rgba(255,225,240,.65)']]) {
        const [ax, ay] = p(t), [bx, by] = p(t + 0.05);
        hdDragonfly(ax, ay + Math.sin(t * 9) * 2, Math.atan2(by - ay, bx - ax), b, w);
      }
    }
    // splash rings where a duck popped out, and where it lands in the tub
    for (const s of g.hdSplash) {
      const k = s.t / 0.8;
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; ctx.lineWidth = 3;
      for (const m of [1, 0.6]) { ctx.beginPath(); ctx.ellipse(s.x, s.y, (14 + k * 50 * m) * s.w + 6, (4 + k * 12 * m) * s.w + 2, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (s.w === 1) for (let j = 0; j < 8; j++) {
        const a = j * Math.PI / 4, r0 = 30 + k * 30, r1 = r0 + 12 * (1 - k);
        ctx.strokeStyle = `rgba(255,236,120,${1 - k})`; ctx.beginPath(); ctx.moveTo(s.x + Math.cos(a) * r0, s.y - 30 + Math.sin(a) * r0); ctx.lineTo(s.x + Math.cos(a) * r1, s.y - 30 + Math.sin(a) * r1); ctx.stroke();
      }
    }
    // the tub of ducks found so far; a found duck pops up, bobs, then flies up to its place
    const tx = i => this.trayX(g, i);
    hdFrame(); hdRays();
    hdTray(g, tx);
    const flying = [];
    g.ducks.forEach((d, i) => {
      if (!d.found) return;
      if (d.ft >= 1.1) {
        // standing proudly on the shelf, with a little parade hop now and then
        const hop = Math.max(0, Math.sin(S.t * 2.2 - i * 0.7)) ** 8 * 5;
        ctx.fillStyle = 'rgba(90,50,20,.25)'; ellipse(tx(i), 108, 15, 2.5);
        hdDuck(d.kind, tx(i), 108 - hop, 0.4, false); return;
      }
      flying.push([d, i]);
    });
    for (const [d, i] of flying) {
      const [sx, sy] = d.fpos || this.spot(d), pop = clamp(d.ft / 0.5, 0, 1), fly = clamp((d.ft - 0.5) / 0.6, 0, 1), e = fly * fly * (3 - 2 * fly);
      const back = 1 + 2.70158 * Math.pow(pop - 1, 3) + 1.70158 * Math.pow(pop - 1, 2);   // ease-out-back pop
      const x = lerp(sx, tx(i), e), y = lerp(sy + 30 - back * 46 + Math.sin(d.ft * 16) * 3 * (1 - e), 108, e) - Math.sin(e * Math.PI) * 60;
      const s = lerp(0.66, 0.42, e), sq = Math.sin(pop * Math.PI * 2) * 0.16 * (1 - e);
      const glow = ctx.createRadialGradient(x, y - 30 * s, 2, x, y - 30 * s, 70 * s);
      glow.addColorStop(0, `rgba(255,246,168,${0.85 * (1 - e)})`); glow.addColorStop(1, 'rgba(255,246,168,0)');
      ctx.fillStyle = glow; circle(x, y - 30 * s, 70 * s);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(d.ft * 14) * 0.18 * (1 - e)); ctx.scale(1 + sq, 1 - sq);
      hdDuck(d.kind, 0, 0, s, false); ctx.restore();
      // the "you found me!" moment: a gasp, then a giggle
      if (d.ft < 0.35) outlined('!', x + 34 * s, y - 100 * s - d.ft * 20, 30, '#ff5f6a');
      else if (d.ft < 0.95) { ctx.globalAlpha = clamp((0.95 - d.ft) / 0.2, 0, 1); outlined('hee hee!', x, y - 96 * s - (d.ft - 0.35) * 30, 15, '#ffb3e0'); ctx.globalAlpha = 1; }
    }
  },
};

// --- duck spotter: one simple clue ("a green head"), tap the real duck that has it -------------
// clue text with the [key words] drawn big in their own colour, centred on x
function clueLine(str, x, y, size, col) {
  const parts = str.split(/[[\]]/);
  ctx.font = `700 ${size}px ${FONT}`;
  let cx = x - parts.reduce((w, p) => w + ctx.measureText(p).width, 0) / 2;
  parts.forEach((p, i) => {
    if (i % 2) outlined(p, cx, y, size, col, 'left'); else text(p, cx, y, size, '#5a2a6e', 'left', 700);
    ctx.font = `700 ${size}px ${FONT}`; cx += ctx.measureText(p).width;
  });
}
const plainClue = look => look.replace(/[[\]]/g, '');
MG.duckid = {
  kind: 'learn', title: () => 'Duck Spotter', icon: () => '🔍',
  how: () => 'Listen to the clue, then tap the duck that matches!',
  init(g) {
    Object.assign(g, { round: 0, rounds: [5, 6, 7][g.tier - 1], cards: g.tier === 1 ? 3 : 4, total: 0, order: shuffle(Object.keys(DUCK_SPECIES)), shake: {} });
    this.next(g);
  },
  start(g) { speak(g.say); },
  next(g) {
    const id = g.order[g.round % g.order.length], d = DUCK_SPECIES[id];
    // a wrong answer never shares the clue's feature, so only one duck can match
    const fits = k => DUCK_SPECIES[k].tags.some(t => d.tags.includes(t));
    const wrong = shuffle(Object.keys(DUCK_SPECIES).filter(k => k !== id && !fits(k))).slice(0, g.cards - 1);
    Object.assign(g, { id, choices: shuffle([id, ...wrong]), tried: [], state: 'pick', t2: 0 });
    g.say = `Find the duck with ${plainClue(d.look)}!`;
    if (g.phase === 'play') speak(g.say);
  },
  update(g, dt, id) {
    for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k];
    const d = DUCK_SPECIES[g.id];
    if (g.state === 'pick') {
      const key = ['1', '2', '3', '4'].slice(0, g.cards).findIndex(k => pressed[k]);
      const i = id?.startsWith('duck:') ? +id.slice(5) : key;
      if (i >= 0 && !g.tried.includes(i)) {
        g.tried.push(i);
        if (g.choices[i] === g.id) {
          g.total += [1, 0.5, 0.2, 0][g.tried.length - 1]; g.state = 'yay'; g.t2 = 2.4;
          quack(); burst(this.cardX(g, i) + this.cardW(g) / 2, 340, 24);
          speak(`${pick(['Yes!', 'You got it!', 'Great spotting!'])} That's a ${d.name}!`);
        } else {
          g.shake[i] = 0.4; SFX.miss();
          speak(`That one doesn't have ${plainClue(d.look)}. Look again!`);
        }
      }
    } else if ((g.t2 -= dt) <= 0) {
      g.round++;
      if (g.round >= g.rounds) g.done = true; else this.next(g);
    }
    g.progress = `Duck ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
    g.score = g.total / g.rounds;
  },
  cardW: g => (g.cards === 3 ? 272 : 212),
  cardX(g, i) { const w = this.cardW(g), gap = 18; return W / 2 - (g.cards * w + (g.cards - 1) * gap) / 2 + i * (w + gap); },
  draw(g) {
    const d = DUCK_SPECIES[g.id], missed = g.tried.length > 0 && g.state === 'pick';
    panel(W / 2 - 420, 66, 840, 120, 22);
    clueLine(`Find the duck with ${d.look}!`, W / 2, 108, 34, d.lookColor);
    text(g.state === 'yay' ? `Yes! That's a ${d.name}!` : missed ? 'Look for the shiny circle!' : 'Tap the duck that matches.', W / 2, 154, 20, '#8a5aa0', 'center', 600);
    const cw = this.cardW(g), ch = 272, y = 204;
    g.choices.forEach((k, i) => {
      const x = this.cardX(g, i) + (g.shake[i] ? Math.sin(g.shake[i] * 50) * 6 : 0);
      const used = g.tried.includes(i) && k !== g.id, right = g.state === 'yay' && k === g.id;
      button(`duck:${i}`, x, y, cw, ch, '', { color: right ? '#ffd23f' : used ? '#c9bcd4' : ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a'][i], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
      const ix = x + 9, iy = y + 9, iw = cw - 18, ih = ch - 18;
      ctx.save(); ctx.beginPath(); ctx.roundRect(ix, iy, iw, ih, 12); ctx.clip();
      const wy = pondCard(ix, iy, iw, ih);
      const [sx, sy, sr] = drawDuckFit(k, ix + iw / 2, wy, iw - 16, wy - iy - 12, Math.sin(S.t * 2 + i) * 2);
      frontWater(ix, iy, iw, ih, wy, S.t + i);
      if (used) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(ix, iy, iw, ih); }
      ctx.restore();
      // after a wrong tap, ring the right duck's clue feature so it's easy to find
      if (k === g.id && (missed || right)) {
        const pulse = 1 + Math.sin(S.t * 6) * 0.08;
        ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 6; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -S.t * 30;
        ctx.beginPath(); ctx.arc(sx, sy, sr * pulse + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        for (let s = 0; s < 3; s++) star(sx + Math.cos(S.t * 3 + s * 2.1) * (sr + 16), sy + Math.sin(S.t * 3 + s * 2.1) * (sr + 16), 8, '#fff6a8', 4);
      }
      if (used || right) { rrect(ix + 10, iy + ih - 40, iw - 20, 30, 15, 'rgba(48,24,72,.75)'); text(DUCK_SPECIES[k].name, ix + iw / 2, iy + ih - 25, 17, '#fff', 'center', 700); }
    });
  },
};

// --- shapes & colours: tap all the things that match --------------------------------------
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const COLORS = { red: '#ff5a5a', blue: '#4f8fe8', yellow: '#ffd23f', green: '#4fc86a', purple: '#a96ae8' };
function drawShape(kind, x, y, r, col) {
  ctx.fillStyle = col; ctx.strokeStyle = OL; ctx.lineWidth = 3;
  ctx.beginPath();
  if (kind === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  if (kind === 'square') ctx.roundRect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, 6);
  if (kind === 'triangle') { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r * 0.8); ctx.lineTo(x - r, y + r * 0.8); ctx.closePath(); }
  if (kind === 'star') for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  if (kind === 'heart') { ctx.moveTo(x, y + r * 0.8); ctx.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r * 0.8); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
}
MG.shapes = {
  kind: 'learn', title: g => `Find the ${g.skin.what}!`, icon: () => '🔷',
  how: () => "Listen carefully, then tap ALL the shapes that match. There are 3 rounds!",
  init(g) { Object.assign(g, { round: 0, rounds: 3, right: 0, wrong: 0, wait: 0 }); this.newRound(g); },
  start(g) { speak(g.prompt); },
  newRound(g) {
    const shape = pick(SHAPES), color = pick(Object.keys(COLORS));
    const rule = g.tier === 1 ? 'shape' : g.tier === 2 ? pick(['shape', 'color']) : 'both';
    const match = s => (rule !== 'color' ? s.shape === shape : true) && (rule !== 'shape' ? s.color === color : true);
    const n = 9 + g.tier * 2, items = [];
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) cells.push([150 + c * 132 + rand(-20, 20), 180 + r * 105 + rand(-12, 12)]);
    cells.sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      // the first few always match, so every round has something to find
      const s = i < 3 ? { shape, color } : { shape: pick(SHAPES), color: pick(Object.keys(COLORS)) };
      if (rule === 'shape' && i < 3) s.color = pick(Object.keys(COLORS));
      if (rule === 'color' && i < 3) s.shape = pick(SHAPES);
      items.push({ ...s, x: cells[i][0], y: cells[i][1], hit: false, shake: 0 });
    }
    for (const it of items) it.target = match(it);
    const plural = shape === 'heart' ? 'hearts' : `${shape}s`;
    g.prompt = rule === 'shape' ? `Tap all the ${plural.toUpperCase()}!` : rule === 'color' ? `Tap all the ${color.toUpperCase()} shapes!` : `Tap all the ${color.toUpperCase()} ${plural.toUpperCase()}!`;
    g.items = items;
    g.say = g.prompt;
    if (g.phase === 'play') speak(g.prompt);
  },
  update(g, dt) {
    for (const it of g.items) it.shake = Math.max(0, it.shake - dt);
    if (g.wait > 0) { g.wait -= dt; if (g.wait <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.newRound(g); } return; }
    if (pointer.clicked) {
      const it = g.items.find(it => !it.hit && Math.hypot(pointer.x - it.x, pointer.y - it.y) < 38);
      if (it) {
        if (it.target) { it.hit = true; g.right++; SFX.pop(); burst(it.x, it.y, 8); }
        else { g.wrong++; it.shake = 0.4; SFX.miss(); }
      }
    }
    if (g.items.filter(i => i.target).every(i => i.hit)) { g.wait = 0.9; SFX.hit(); floatText(W / 2, 140, 'You found them all!', '#fff6a8', false, 26); }
    g.progress = `Round ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
    g.score = g.right / Math.max(1, g.right + g.wrong * 0.7);
  },
  draw(g) {
    panel(W / 2 - 280, 70, 560, 52, 20);
    text(g.prompt, W / 2, 96, 22, '#5a2a6e', 'center', 700);
    for (const it of g.items) {
      if (it.hit) { star(it.x, it.y, 18, '#fff6a8', 5); continue; }
      drawShape(it.shape, it.x + Math.sin(it.shake * 50) * 6, it.y, 32, COLORS[it.color]);
    }
  },
};

// --- question games: count, add, letter, pattern, rhyme ---------------------------------------
const WORDS = [['🐝', 'BEE'], ['🐱', 'CAT'], ['🐶', 'DOG'], ['☀️', 'SUN'], ['🍎', 'APPLE'], ['🐟', 'FISH'], ['🎩', 'HAT'], ['🐷', 'PIG'],
  ['🦊', 'FOX'], ['🌙', 'MOON'], ['⭐', 'STAR'], ['🐸', 'FROG'], ['🍌', 'BANANA'], ['🚗', 'CAR'], ['🥚', 'EGG'], ['🦉', 'OWL'],
  ['🌳', 'TREE'], ['🐢', 'TURTLE'], ['⚽', 'BALL'], ['🪁', 'KITE'], ['🦁', 'LION'], ['🌈', 'RAINBOW'], ['🦆', 'DUCK'], ['🦓', 'ZEBRA'], ['🦄', 'UNICORN']];
const CVC = [['🐱', 'CAT'], ['🐶', 'DOG'], ['☀️', 'SUN'], ['🎩', 'HAT'], ['🐷', 'PIG'], ['🦊', 'FOX'], ['🚌', 'BUS'], ['🛏️', 'BED'],
  ['🐔', 'HEN'], ['🕸️', 'WEB'], ['📦', 'BOX'], ['🦇', 'BAT'], ['🪵', 'LOG'], ['🗺️', 'MAP'], ['🥜', 'NUT'], ['🐛', 'BUG']];
const RHYMES = [[['🐱', 'cat'], ['🎩', 'hat'], ['🦇', 'bat']], [['🐶', 'dog'], ['🐸', 'frog'], ['🪵', 'log']], [['🐝', 'bee'], ['🌳', 'tree'], ['🔑', 'key']],
  [['🌙', 'moon'], ['🥄', 'spoon']], [['⭐', 'star'], ['🚗', 'car'], ['🫙', 'jar']], [['🦊', 'fox'], ['📦', 'box'], ['🧦', 'socks']],
  [['🎂', 'cake'], ['🐍', 'snake']], [['🐻', 'bear'], ['🍐', 'pear'], ['🪑', 'chair']], [['🐭', 'mouse'], ['🏠', 'house']],
  [['🐐', 'goat'], ['⛵', 'boat'], ['🧥', 'coat']], [['🐟', 'fish'], ['🍽️', 'dish']], [['👑', 'king'], ['💍', 'ring']]];
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
// n of an emoji in rows of five (like a ten-frame) centred on (cx, cy); the ones from `crossFrom` on are crossed out
function drawGroup(ch, n, cx, cy, size, crossFrom = Infinity) {
  const gap = size + 4, cols = Math.min(5, n), rows = Math.ceil(n / 5);
  for (let i = 0; i < n; i++) {
    const x = cx + ((i % 5) - (cols - 1) / 2) * gap, y = cy + (Math.floor(i / 5) - (rows - 1) / 2) * gap;
    emoji(ch, x, y, size);
    if (i >= crossFrom) outlined('✕', x, y + 2, size, '#ff5a5a');
  }
}
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
function numberChoices(n) {
  const set = new Set([n]);
  for (const d of shuffle([1, -1, 2, -2])) { if (set.size >= 3) break; if (n + d >= 0) set.add(n + d); }
  return shuffle([...set]).map(v => ({ label: String(v), value: v }));
}
function scatter(n, x0, x1, y0, y1, cols = 7) {
  const rows = Math.max(3, Math.ceil(n / cols)), cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([lerp(x0, x1, (c + 0.5) / cols) + rand(-14, 14), lerp(y0, y1, (r + 0.5) / rows) + rand(-10, 10)]);
  return shuffle(cells).slice(0, n);
}
const QUIZ = {
  count(g) {
    // a skin can set its own range, e.g. { min: 5, max: 20 }
    const n = randInt(g.skin.min ?? 2, g.skin.max ?? [5, 8, 12][g.tier - 1]);
    const spots = scatter(n, 170, 790, 160, 360, n > 14 ? 8 : 7), size = n > 14 ? 38 : 46;
    // tapping one gives it a number, to help keep track of big counts
    const tapped = [];
    return { prompt: `How many ${g.skin.what}?`, say: `How many ${g.skin.what} can you count?`, choices: numberChoices(n), answer: n,
      tap(x, y) {
        const i = spots.findIndex(([sx, sy]) => Math.hypot(x - sx, y - sy) < size * 0.55);
        if (i < 0) return;
        const k = tapped.indexOf(i);
        if (k >= 0) tapped.splice(k, 1); else { tapped.push(i); SFX.pop(); }
      },
      draw: () => spots.forEach(([x, y], i) => {
        const yy = y + Math.sin(S.t * 2 + i) * 3, k = tapped.indexOf(i);
        emoji(g.skin.item, x, yy, size);
        if (k >= 0) { inkCircle(x + size * 0.38, yy - size * 0.38, 10, '#fff6a8', 1); text(String(k + 1), x + size * 0.38, yy - size * 0.38, 12, '#5a2a6e', 'center', 800); }
      }) };
  },
  add(g) {
    // a skin can raise the biggest sum ({ max: 20 }) and mix in some take-aways ({ mix: 0.4 })
    const sub = g.skin.sub || g.tier === 3 || Math.random() < (g.skin.mix || 0);
    let a, b, ans;
    if (sub) { a = randInt(g.skin.max ? 4 : 3, g.skin.max ? 10 : 9); b = randInt(1, a - 1); ans = a - b; }
    else if (g.skin.max) { ans = randInt(6, g.skin.max); a = randInt(2, ans - 2); b = ans - a; }
    else if (g.tier === 1) { a = randInt(1, 3); b = randInt(1, 2); ans = a + b; }
    else { a = randInt(1, 5); b = randInt(1, 5); ans = a + b; }
    const prompt = sub ? `${a} take away ${b} = ?` : `${a} + ${b} = ?`;
    return { prompt, say: sub ? `What is ${NUM_WORDS[a]} take away ${NUM_WORDS[b]}?` : `What is ${NUM_WORDS[a]} plus ${NUM_WORDS[b]}?`, choices: numberChoices(ans), answer: ans,
      draw: () => {
        // small sums in one row; bigger ones in rows of five so they fit and are easy to count
        if (Math.max(a, b) > 5 || (!sub && a + b > 9)) {
          if (sub) drawGroup(g.skin.item, a, W / 2, 250, 44, a - b);
          else { drawGroup(g.skin.item, a, W / 2 - 145, 250, 36); outlined('+', W / 2, 250, 44, '#fff'); drawGroup(g.skin.item, b, W / 2 + 145, 250, 36); }
          return;
        }
        const size = a + b > 9 ? 36 : 44, gap = size + 4;
        if (sub) {
          const x0 = W / 2 - (a - 1) * gap / 2;
          for (let i = 0; i < a; i++) { emoji(g.skin.item, x0 + i * gap, 260, size); if (i >= a - b) outlined('✕', x0 + i * gap, 262, size, '#ff5a5a'); }
        } else {
          const total = (a + b) * gap + 50, x0 = W / 2 - total / 2 + gap / 2;
          for (let i = 0; i < a; i++) emoji(g.skin.item, x0 + i * gap, 260, size);
          outlined('+', x0 + a * gap + 2, 260, 40, '#fff');
          for (let i = 0; i < b; i++) emoji(g.skin.item, x0 + a * gap + 50 + i * gap, 260, size);
        }
      } };
  },
  letter(g) {
    if (g.tier === 3) {
      const [ch, word] = pick(CVC);
      const vowels = shuffle(['A', 'E', 'I', 'O', 'U'].filter(v => v !== word[1])).slice(0, 2);
      return { prompt: `Which letter is missing?  ${word[0]} _ ${word[2]}`, say: `${word.toLowerCase()}. Which letter is missing?`, answer: word[1],
        choices: shuffle([word[1], ...vowels]).map(l => ({ label: l, value: l })), draw: () => emoji(ch, W / 2, 255, 96) };
    }
    // one letter hidden anywhere in the word for the first two words, then two; the word is never written out
    const [ch, word] = pick(WORDS);
    const blanks = shuffle([...Array(word.length).keys()]).slice(0, g.round < 2 ? 1 : 2).sort((a, b) => a - b);
    const q = { prompt: blanks.length > 1 ? 'Which letters are missing?' : 'Which letter is missing?', step: 0,
      ask() {
        const ans = word[blanks[this.step]];
        const others = shuffle('ABCDEFGHIKLMNOPRSTUWZ'.split('').filter(l => l !== ans)).slice(0, 2);
        this.answer = ans;
        this.choices = shuffle([ans, ...others]).map(l => ({ label: l, value: l }));
        this.say = this.step ? 'Now find the next missing letter!' : `${word.toLowerCase()}. Which letter is missing?`;
      },
      next() { if (++this.step >= blanks.length) return false; this.ask(); return true; },
      draw() {
        emoji(ch, W / 2 - 230, 255, 90);
        const gap = 58, x0 = W / 2 + 80 - (word.length - 1) * gap / 2;
        [...word].forEach((l, i) => {
          const x = x0 + i * gap, b = blanks.indexOf(i);
          if (b < 0 || b < this.step || (b === this.step && g.wait > 0)) return outlined(l, x, 258, 44, b < 0 ? '#fff' : '#fff6a8');
          const now = b === this.step;
          rrect(x - 24, 226, 48, 62, 12, now ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.4)', now ? '#ff6fb5' : '#e2c6f5', now ? 4 : 2);
          if (now) outlined('?', x, 260, 34, '#ff6fb5', 'center', '#fff');
        });
      } };
    q.ask();
    return q;
  },
  pattern(g) {
    const [A, B, C] = shuffle(g.skin.set);
    const seqs = { 1: [A, B, A, B, A, B, A], 2: [A, B, C, A, B, C, A], 3: pick([[A, A, B, B, A, A, B], [A, B, B, A, B, B, A]]) };
    const full = seqs[g.tier];
    const shown = full.slice(0, 6), ans = full[6];
    return { prompt: 'What comes next?', say: 'Look at the pattern. What comes next?', answer: ans,
      choices: shuffle([A, B, C]).map(e => ({ emoji: e, value: e })),
      draw: () => {
        shown.forEach((e, i) => emoji(e, 200 + i * 86, 260 + Math.sin(S.t * 3 + i) * 3, 52));
        rrect(200 + 6 * 86 - 34, 226, 68, 68, 16, 'rgba(255,255,255,.7)', '#ff8fc8', 3);
        outlined('?', 200 + 6 * 86, 262, 40, '#ff6fb5', 'center', '#fff');
      } };
  },
  rhyme() {
    const groups = shuffle(RHYMES);
    const grp = groups[0];
    const [target, ...rest] = shuffle(grp);
    const right = pick(rest);
    const wrongs = [groups[1][0], groups[2][0]];
    return { prompt: `What rhymes with "${target[1]}"?`, say: `Which word rhymes with ${target[1]}? ${shuffle([right, ...wrongs]).map(w => w[1]).join(', ')}?`, answer: right[1],
      choices: shuffle([right, ...wrongs]).map(([e, w]) => ({ emoji: e, label: w, value: w })),
      draw: () => { emoji(target[0], W / 2, 245, 90); outlined(target[1], W / 2, 315, 32, '#fff'); } };
  },
};
for (const [type, title, icon] of [['count', 'Counting', '🔢'], ['add', 'Number Fun', '➕'], ['letter', 'Letter Detective', '🔤'], ['pattern', 'Pattern Puzzle', '🧩'], ['rhyme', 'Rhyme Time', '🎵']]) {
  MG[type] = {
    kind: 'learn', title: () => title, icon: () => icon,
    how: () => 'Listen to the question, then tap the right answer. Press the speaker button to hear it again!',
    init(g) { Object.assign(g, { round: 0, rounds: 5, right: 0, asked: 0, wait: 0, picked: null }); this.next(g); },
    start(g) { speak(g.q.say); },
    next(g) { g.q = QUIZ[type](g); g.say = g.q.say; g.picked = null; if (g.phase === 'play') speak(g.q.say); },
    update(g, dt, id) {
      if (g.wait > 0) {
        g.wait -= dt;
        // a question with more than one blank keeps going until every blank is filled
        if (g.wait <= 0 && g.q.next?.()) { g.say = g.q.say; g.picked = null; speak(g.q.say); }
        else if (g.wait <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
        return;
      }
      const keyPick = ['1', '2', '3'].findIndex(k => pressed[k]);
      const choice = id?.startsWith('ans:') ? +id.slice(4) : keyPick >= 0 ? keyPick : -1;
      if (choice < 0 && !id && pointer.clicked) g.q.tap?.(pointer.x, pointer.y);
      if (choice >= 0 && choice < g.q.choices.length) {
        const c = g.q.choices[choice];
        g.picked = choice; g.asked++;
        if (c.value === g.q.answer) {
          g.right++; g.wait = 1.1; SFX.hit(); burst(W / 2, 260, 20);
          speak(pick(['Yes!', 'You got it!', 'Great job!', 'Correct!']));
        } else {
          g.wait = 2; SFX.miss();
          const right = g.q.choices.find(c => c.value === g.q.answer);
          speak(`Good try! The answer was ${right.label ?? ''}.`);
        }
      }
      g.progress = `Question ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.right / Math.max(g.asked, g.rounds);
    },
    draw(g) {
      panel(W / 2 - 330, 72, 660, 58, 22);
      text(g.q.prompt, W / 2, 101, 26, '#5a2a6e', 'center', 700);
      darkPanel(W / 2 - 330, 146, 660, 208, 24);
      g.q.draw();
      const n = g.q.choices.length, bw = 170, gap = 26, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
      g.q.choices.forEach((c, i) => {
        const x = x0 + i * (bw + gap), y = 372, isRight = c.value === g.q.answer;
        let color = ['#ff6fb5', '#4fa8e0', '#9a6ae0'][i];
        if (g.wait > 0) color = isRight ? '#3fbf6a' : i === g.picked ? '#c9a6b8' : '#c9bcd4';
        const b = button(`ans:${i}`, x, y, bw, 96, '', { color, on: g.wait <= 0, key: String(i + 1) });
        if (c.emoji) emoji(c.emoji, x + bw / 2, y + (c.label ? 36 : 48), c.label ? 40 : 52);
        if (c.label) outlined(c.label, x + bw / 2, y + (c.emoji ? 76 : 50), c.emoji ? 22 : 46, '#fff', 'center', 'rgba(60,20,80,.6)');
        if (g.wait > 0 && isRight) emoji('✅', b.x + bw - 14, y + 10, 26);
      });
    },
  };
}
