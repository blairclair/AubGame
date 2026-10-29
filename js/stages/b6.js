'use strict';
// Batch 6: Crystal Caverns, Phoenix Peak, The Wishing Well, Aurora Glacier, Midnight Moon Garden.
{
  // ===========================================================================
  // shared little helpers
  // ===========================================================================
  const rgbOf = h => hexRgb(h).join(',');
  // soft round glow; col is '#rrggbb'
  const glow = (x, y, r, col, a = 0.5) => {
    const c = rgbOf(col), gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const numKey = n => { for (let i = 1; i <= n; i++) if (pressed[String(i)]) return i - 1; return -1; };
  const CARD = ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a'];
  const tickShake = (g, dt) => { for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k]; };
  const shakeX = (g, i) => (g.shake[i] ? Math.sin(g.shake[i] * 50) * 6 : 0);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const art = w => (/^[aeiou]/.test(w) ? 'an' : 'a');
  const line = (pts, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
  // an outlined stroke: dark ink first, colour on top, so it reads as one shape
  const inkLine = (pts, w, col, lw = 2) => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; line(pts, w + lw * 2, OL); line(pts, w, col); };
  const inkCurve = (path, w, col, lw = 2) => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = w + lw * 2; ctx.stroke(path); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(path); };
  // a little flickering flame, base at (x, y)
  const flame = (x, y, s, ph = 0, outer = '#ff7a2a', inner = '#ffe14a') => {
    const k = 1 + Math.sin(S.t * 9 + ph) * 0.12, sw = Math.sin(S.t * 6 + ph) * 3 * s;
    ink(P2(`M${x},${y} C${x - 11 * s},${y - 6 * s} ${x - 9 * s},${y - 24 * s} ${x + sw},${y - 40 * s * k} C${x + 9 * s},${y - 24 * s} ${x + 11 * s},${y - 6 * s} ${x},${y} Z`), outer, 1.2);
    ctx.fillStyle = inner; ctx.fill(P2(`M${x},${y - 2 * s} C${x - 5 * s},${y - 6 * s} ${x - 4 * s},${y - 15 * s} ${x + sw * 0.6},${y - 24 * s * k} C${x + 4 * s},${y - 15 * s} ${x + 5 * s},${y - 6 * s} ${x},${y - 2 * s} Z`));
  };
  // generic "tap the right card" round logic used by several learn games
  const pickRound = (g, id, n, prefix) => {
    const key = numKey(n);
    const i = id?.startsWith(prefix) ? +id.slice(prefix.length) : key;
    return i >= 0 && i < n && !g.tried.includes(i) ? i : -1;
  };

  // ===========================================================================
  // 1. CRYSTAL CAVERNS — Echo the Bat
  // ===========================================================================
  const CAVE = ['#ff5fa8', '#5fd0ff', '#b47aff', '#5ff0b0', '#ffd45f', '#ff8a5f'];
  // a six-sided crystal standing on (x, by), pointing up (rot turns it)
  const crystal = (x, by, h, w, col, rot = 0, lw = 1.6) => {
    const s = w / 2, sh = h * 0.76;
    ctx.save(); ctx.translate(x, by); ctx.rotate(rot);
    ink(P2(`M${-s},3 L${-s},${-sh} L0,${-h} L${s},${-sh} L${s},3 Z`), col, lw);
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fill(P2(`M${-s},3 L${-s},${-sh} L0,${-h} L${-s * 0.2},${-sh} L${-s * 0.2},3 Z`));
    ctx.fillStyle = 'rgba(40,0,70,.22)';
    ctx.fill(P2(`M${s * 0.35},3 L${s * 0.35},${-sh} L0,${-h} L${s},${-sh} L${s},3 Z`));
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(-s * 0.72, -sh + 4, Math.max(1.5, s * 0.2), sh * 0.5);
    ctx.restore();
  };
  // a fan of crystals growing from one spot, outer ones first
  const cluster = (x, by, h, cols, k = 0, n = 5) => {
    glow(x, by - h * 0.45, h * 0.95, cols[k % cols.length], 0.26 + 0.1 * Math.sin(S.t * 1.6 + k));
    const mid = (n - 1) / 2, order = [...Array(n).keys()].sort((a, b) => Math.abs(b - mid) - Math.abs(a - mid));
    for (const i of order) {
      const d = i - mid, f = 1 - Math.abs(d) / (mid + 1);
      crystal(x + d * h * 0.15, by, h * (0.42 + 0.58 * f), h * 0.2 * (0.7 + 0.3 * f), cols[(i + k) % cols.length], d * 0.27);
    }
  };
  const stalactite = (x, top, len, w, col) => {
    ink(P2(`M${x - w},${top} Q${x - w * 0.35},${top + len * 0.6} ${x},${top + len} Q${x + w * 0.35},${top + len * 0.6} ${x + w},${top} Z`), col, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,.13)'; tri(x - w * 0.7, top, x - w * 0.2, top, x - 1, top + len * 0.8);
  };
  const glowShroom = (x, y, s, col) => {
    glow(x, y - 14 * s, 38 * s, col, 0.38 + 0.15 * Math.sin(S.t * 2 + x));
    inkRect(x - 3 * s, y - 14 * s, 6 * s, 14 * s, '#f4eaff', 1.1, 3);
    ink(P2(`M${x - 14 * s},${y - 12 * s} Q${x},${y - 32 * s} ${x + 14 * s},${y - 12 * s} Z`), col, 1.1);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(x - 5 * s, y - 18 * s, 2.2 * s); circle(x + 5 * s, y - 20 * s, 1.6 * s); circle(x + 1, y - 14 * s, 1.4 * s);
  };
  // a cute bat; t drives the flapping
  const drawBat = (x, y, t, s = 1, dir = 1, body = '#7a5aaa', wing = '#53358a') => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const f = Math.sin(t * 14);
    const w = d => P2(`M0,-4 C${d * 18},${-22 - f * 12} ${d * 42},${-20 - f * 16} ${d * 54},${-6 - f * 14} C${d * 46},${-2 - f * 7} ${d * 42},${5 - f * 5} ${d * 34},${3 - f * 4} C${d * 30},${10 - f * 3} ${d * 22},${7} ${d * 15},${10} C${d * 10},${5} ${d * 6},${5} 0,${7} Z`);
    ink(w(-1), wing, 1.4); ink(w(1), wing, 1.4);
    ink(P2('M-12,-12 L-15,-30 L-3,-17 Z'), body, 1.4); ink(P2('M12,-12 L15,-30 L3,-17 Z'), body, 1.4);
    inkEllipse(0, 0, 16, 17, 0, body, 1.4);
    ctx.fillStyle = '#ff9ad0'; tri(-11, -14, -13, -25, -6, -16); tri(11, -14, 13, -25, 6, -16);
    ctx.fillStyle = mix(body, '#ffffff', 0.35); ellipse(0, 7, 9, 8);
    ctx.fillStyle = '#fff'; circle(-6, -4, 5); circle(6, -4, 5);
    ctx.fillStyle = '#2a1a3a'; circle(-5, -3, 2.6); circle(7, -3, 2.6);
    ctx.fillStyle = '#fff'; tri(-4, 5, -1, 5, -2.5, 9); tri(1, 5, 4, 5, 2.5, 9);
    ctx.fillStyle = 'rgba(255,120,170,.5)'; circle(-11, 3, 3); circle(11, 3, 3);
    ctx.restore();
  };

  BACKDROPS.crystalcave_bg = () => {
    const t = S.t;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#120a26'); sky.addColorStop(0.55, '#2b1754'); sky.addColorStop(1, '#3a2266');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // far cave wall: big soft rock bulges and coloured glow pockets
    ctx.fillStyle = '#231342'; for (let i = 0; i < 11; i++) ellipse((i * 157) % W, 170 + (i * 61) % 150, 130, 90);
    for (const [x, y, c, k] of [[170, 240, '#ff5fa8', 0], [500, 210, '#b47aff', 1], [800, 240, '#5fd0ff', 2]]) glow(x, y, 230, c, 0.24 + 0.07 * Math.sin(t + k));
    // distant crystals on the back ledge
    ctx.globalAlpha = 0.6;
    for (const [x, h, k] of [[140, 92, 1], [300, 66, 3], [470, 58, 5], [640, 84, 2], [790, 104, 4]]) cluster(x, 352, h, CAVE, k, 4);
    ctx.globalAlpha = 1;
    bdHills('#2f1b55', 362, 12, 0.014, 1.2);
    ctx.strokeStyle = 'rgba(190,150,255,.25)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const x = 60 + i * 170; line([[x, 372 + (i % 2) * 8], [x + 70, 378 + (i % 3) * 5]], 2, 'rgba(190,150,255,.2)'); }
    // the cave floor, with a lighter edge
    const floor = new Path2D(); floor.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) floor.lineTo(x, 420 + Math.sin(x * 0.02) * 6 + Math.sin(x * 0.051) * 4);
    floor.lineTo(W, H); floor.closePath();
    const fg = ctx.createLinearGradient(0, 410, 0, H); fg.addColorStop(0, '#4a3478'); fg.addColorStop(1, '#2e1f4e');
    ctx.fillStyle = fg; ctx.fill(floor); ctx.strokeStyle = 'rgba(200,170,255,.45)'; ctx.lineWidth = 3; ctx.stroke(floor);
    // the underground pool, glowing teal, with crystal reflections and ripples
    const pool = new Path2D(); pool.ellipse(480, 440, 232, 28, 0, 0, Math.PI * 2);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; inkEllipse(480 + Math.cos(a) * 238, 440 + Math.sin(a) * 31, 13, 6, 0, ['#6a5a90', '#5a4a80', '#7a6aa0'][i % 3], 1); }
    const pg = ctx.createLinearGradient(0, 412, 0, 470); pg.addColorStop(0, '#6ff4ff'); pg.addColorStop(0.5, '#2fb0e0'); pg.addColorStop(1, '#1a4a9a');
    ctx.fillStyle = pg; ctx.fill(pool);
    ctx.save(); ctx.clip(pool);
    glow(480, 440, 200, '#9ffcff', 0.35 + 0.1 * Math.sin(t * 1.3));
    [[330, '#ff5fa8'], [410, '#ffd45f'], [520, '#b47aff'], [610, '#5ff0b0']].forEach(([x, c], i) => { ctx.fillStyle = c; ctx.globalAlpha = 0.4; ellipse(x + Math.sin(t * 1.5 + i) * 4, 446, 10, 18); });
    ctx.globalAlpha = 1;
    for (const [x, ph] of [[380, 0], [540, 0.4], [470, 0.75]]) { const k = (t * 0.45 + ph) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, 442, 6 + k * 50, 2 + k * 8, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(190,250,255,.7)'; ctx.lineWidth = 2; ctx.stroke(pool);
    // small crystals round the pool and big clusters at the sides
    cluster(380, 426, 66, ['#ffd45f', '#ff8a5f', '#ff5fa8'], 0, 3);
    cluster(590, 422, 58, ['#5ff0b0', '#5fd0ff', '#b47aff'], 1, 3);
    cluster(820, 452, 118, ['#b47aff', '#ff5fa8', '#5fd0ff'], 2, 4);
    cluster(56, 476, 250, ['#ff5fa8', '#b47aff', '#5fd0ff'], 0, 5);
    cluster(906, 480, 272, ['#5fd0ff', '#5ff0b0', '#ffd45f'], 1, 5);
    // the ceiling and its stalactites, with drips
    ctx.fillStyle = '#0e0720'; ctx.beginPath(); ctx.moveTo(0, 0);
    for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 40 + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.083) * 5);
    ctx.lineTo(W, 0); ctx.fill();
    for (const [x, len, w] of [[110, 96, 18], [175, 60, 11], [300, 120, 22], [395, 70, 13], [520, 104, 20], [610, 64, 12], [700, 128, 24], [780, 76, 14], [870, 100, 18]]) {
      stalactite(x, 34, len, w, '#3d2864');
      const k = (t * 0.4 + x * 0.013) % 1, dy = 34 + len + k * k * 340;
      if (dy < 418) { ctx.fillStyle = 'rgba(160,230,255,.85)'; ellipse(x, dy, 2.5, 4); }
      ctx.fillStyle = `rgba(160,230,255,${0.5 + 0.4 * Math.sin(t * 2 + x)})`; circle(x, 34 + len - 2, 2.5);
    }
    // glowing mushrooms and tiny crystals scattered on the floor
    for (const [x, y, s, c] of [[150, 478, 1, '#5ff0b0'], [178, 490, 0.65, '#5fd0ff'], [352, 500, 0.9, '#ff8ad8'], [612, 508, 1, '#ffd45f'], [640, 498, 0.6, '#5ff0b0'], [846, 512, 1.1, '#ff5fa8'], [30, 528, 0.8, '#ffd45f'], [935, 530, 0.75, '#b47aff'], [470, 530, 0.7, '#5fd0ff']]) glowShroom(x, y, s, c);
    for (let i = 0; i < 12; i++) crystal(70 + i * 76 + (i % 3) * 9, 466 + (i * 37) % 64, 14 + (i % 3) * 5, 7, CAVE[i % CAVE.length], ((i % 5) - 2) * 0.2, 1);
    // floating light motes and far-off bats
    for (let i = 0; i < 26; i++) {
      const x = (i * 97 + Math.sin(t * 0.5 + i) * 24 + 2000) % W, y = H - ((t * 14 + i * 53) % (H - 90));
      glow(x, y, 9, CAVE[i % CAVE.length], 0.8); ctx.fillStyle = '#fff'; circle(x, y, 1.4);
    }
    for (let i = 0; i < 2; i++) drawBat(((t * 38 + i * 520) % (W + 200)) - 100, 120 + i * 50 + Math.sin(t * 2 + i) * 10, t + i, 0.35, 1, '#4a3270', '#33204f');
  };

  // Aubrey as a bat: her own 'jump' sprite (mirrored to fly right) with flapping membrane wings from
  // her back and pointy bat ears on her head, so she's still clearly Aubrey
  const AB_S = 0.36, AB_ROOT = [84, 70], AB_HEAD = [-30, 30]; // sprite px: wing root on her back; head centre from image centre/top
  const AB_WING = P2('M0,0 C8,-34 40,-58 78,-52 C72,-40 70,-30 72,-20 C62,-26 52,-24 46,-14 C40,-20 30,-18 24,-6 C18,-8 10,-4 0,6 Z');
  const batWing = (a, col, bone) => {
    ctx.save(); ctx.rotate(a);
    ink(AB_WING, col, 1.6);
    ctx.strokeStyle = bone; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (const [x, y] of [[78, -52], [72, -20], [46, -14], [24, -6]]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(x * 0.45, y * 0.75, x, y); ctx.stroke(); }
    inkCircle(78, -52, 2.6, bone, 0.8);
    ctx.restore();
  };
  const aubBat = (x, y, t, tilt = 0) => {
    const im = IMG.jump, w = im.width * AB_S, h = im.height * AB_S, f = Math.sin(t * 14);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(-1, 1);
    ctx.save(); ctx.translate(-w / 2 + AB_ROOT[0] * AB_S, -h / 2 + AB_ROOT[1] * AB_S);
    ctx.save(); ctx.scale(0.85, 0.9); batWing(-0.2 - f * 0.5, '#4a3080', '#2a1a4a'); ctx.restore();
    batWing(-0.4 - f * 0.6, '#7a5ac0', '#3a2560');
    ctx.restore();
    ctx.drawImage(im, -w / 2, -h / 2, w, h);
    // bat ears poking up out of her curls
    // small and set back on her curls (+x is behind her here) so they never cover her face
    const hx = AB_HEAD[0] * AB_S + 5, hy = -h / 2 + AB_HEAD[1] * AB_S - 6;
    for (const d of [-1, 1]) {
      const ex = hx + d * 4.5;
      ink(P2(`M${ex - 3.5},${hy + 3} L${ex + d * 2},${hy - 10} L${ex + 4},${hy + 2} Z`), '#7a5ac0', 1.1);
      ctx.fillStyle = '#ff9ad0'; tri(ex - 1.5, hy + 1.5, ex + d * 1.6, hy - 5.5, ex + 2, hy + 1.5);
    }
    ctx.restore();
  };
  // --- Echo Flight: squeak to light up a dark winding tunnel, steer the bat through -----------
  const EB_X = 220;
  MG.echoflight = {
    kind: 'action', title: () => 'Echo Flight', icon: () => '🦇',
    how: () => 'It is dark! Press Space or click to squeak and light up the walls. Aubrey is a bat! Steer her with the arrows or the mouse, and grab the crystals!',
    init(g) {
      const gap = [240, 210, 186][g.tier - 1], speed = [140, 160, 182][g.tier - 1], seg = 160;
      const len = speed * 40, n = Math.ceil((len + W + 400) / seg), lo = 72 + gap / 2, hi = H - 14 - gap / 2;
      const pts = []; let y = 300;
      for (let i = 0; i < n; i++) { if (i > 3) y = clamp(y + rand(-1, 1) * [88, 100, 114][g.tier - 1], lo, hi); pts.push(y); }
      Object.assign(g, { gap, speed, seg, len, pts, dist: 0, light: 1, ring: 0, cd: 0, bumps: 0, inv: 0, got: 0, gems: [], dark: 0 });
      g.by = this.mid(g, EB_X);
      for (let x = 760; x < len + EB_X - 60; x += rand(230, 290)) g.gems.push({ x, y: this.mid(g, x) + rand(-0.3, 0.3) * gap, col: pick(CAVE), got: false });
      g.say = 'Press Space or click to squeak! Steer with up and down.';
    },
    // the tunnel's centre line at world x
    mid(g, wx) {
      const f = wx / g.seg, i = Math.floor(f), k = f - i, n = g.pts.length - 1;
      return lerp(g.pts[clamp(i, 0, n)], g.pts[clamp(i + 1, 0, n)], (1 - Math.cos(k * Math.PI)) / 2);
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.dist = Math.min(g.len, g.dist + g.speed * dt);
      const wx = g.dist + EB_X, c = this.mid(g, wx), half = g.gap / 2, R = 20;
      let v = 0;
      if (keys.arrowup || keys.w) v -= 1;
      if (keys.arrowdown || keys.s) v += 1;
      if (v) g.by += v * 280 * dt;
      else if (pointerMoved(g)) g.by += clamp(pointer.y - g.by, -300 * dt, 300 * dt);
      g.cd -= dt; g.inv -= dt; g.ring += dt; g.dark += dt;
      g.light = Math.max(0, g.light - dt / 1.7);
      if ((pressed[' '] || pointer.clicked) && g.cd <= 0) {
        g.light = 1; g.ring = 0; g.cd = 0.3; g.dark = 0;
        tone(1700, 0.07, 'sine', 0.06, 0, 2500); tone(2300, 0.07, 'sine', 0.04, 0.09, 2900);
      }
      if (g.dark > 4 && !g.nag) { g.nag = true; speak('Squeak! Press Space to see the walls!'); }
      if (g.by - R < c - half || g.by + R > c + half) {
        if (g.inv <= 0) {
          g.bumps++; g.inv = 0.9; g.light = Math.max(g.light, 0.7); g.ring = 0; SFX.miss();
          floatText(EB_X, g.by - 44, 'Bonk!', '#ffb0c4', false, 22);
        }
        g.by = clamp(g.by, c - half + R, c + half - R);
      }
      for (const m of g.gems) {
        if (m.got || Math.abs(m.x - wx) > 30 || Math.abs(m.y - g.by) > 36) continue;
        m.got = true; g.got++; SFX.hit(); burst(EB_X + 10, m.y, 14, { colors: [m.col, '#ffffff', '#fff6a8'] });
      }
      g.progress = `Crystals: ${g.got} of ${g.gems.length}`;
      g.score = 0.6 * g.got / g.gems.length + 0.4 * Math.max(0, 1 - g.bumps / 6);
      if (g.dist >= g.len) g.done = true;
    },
    draw(g) {
      const half = g.gap / 2, L = g.light;
      ctx.fillStyle = '#0a0518'; ctx.fillRect(0, 0, W, H);
      const top = [], bot = [];
      for (let x = -10; x <= W + 10; x += 10) { const c = this.mid(g, g.dist + x); top.push([x, c - half]); bot.push([x, c + half]); }
      const air = new Path2D();
      top.forEach(([x, y], i) => (i ? air.lineTo(x, y) : air.moveTo(x, y)));
      for (let i = bot.length - 1; i >= 0; i--) air.lineTo(bot[i][0], bot[i][1]);
      air.closePath();
      ctx.fillStyle = `rgba(40,30,90,${0.25 + 0.3 * L})`; ctx.fill(air);
      // the exit glows ahead near the end
      const ex = g.len + EB_X + 120 - g.dist;
      if (ex < W + 260) { ctx.save(); ctx.clip(air); glow(ex, this.mid(g, g.len + EB_X + 120), 300, '#fff3b0', 0.85); ctx.restore(); }
      // rock walls: dark until the echo lights them
      const rock = mix('#1c1036', '#9a6ad8', L), lump = mix('#24163f', '#b88af0', L);
      for (const [pts, edge] of [[top, 0], [bot, H]]) {
        const p = new Path2D(); p.moveTo(pts[0][0], edge); pts.forEach(([x, y]) => p.lineTo(x, y)); p.lineTo(pts[pts.length - 1][0], edge); p.closePath();
        ctx.fillStyle = rock; ctx.fill(p);
        // lumpy rock along the wall, fixed to the world so it scrolls past
        ctx.save(); ctx.clip(p); ctx.fillStyle = lump;
        const sgn = edge ? 1 : -1, j0 = Math.floor(g.dist / 46);
        for (let j = j0 - 1; j < j0 + 23; j++) { const wx = j * 46, x = wx - g.dist, ey = this.mid(g, wx) + sgn * half; circle(x, ey + sgn * (16 + (j * 17) % 14), 22 + (j * 13) % 10); }
        ctx.fillStyle = mix('#140a28', '#6a4aa0', L);
        for (let j = j0 - 1; j < j0 + 23; j += 2) { const wx = j * 46 + 20, x = wx - g.dist, ey = this.mid(g, wx) + sgn * half; circle(x, ey + sgn * 62, 12 + (j * 7) % 8); }
        ctx.restore();
        ctx.strokeStyle = `rgba(150,225,255,${0.22 + 0.78 * L})`; ctx.lineWidth = 4;
        ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      }
      // crystals stuck in the walls
      const k0 = Math.floor(g.dist / 70);
      ctx.globalAlpha = 0.16 + 0.84 * L;
      for (let k = k0 - 1; k < k0 + 16; k++) {
        const wx = k * 70, x = wx - g.dist, c = this.mid(g, wx), up = k % 2 === 0, h = 18 + (k * 37) % 14;
        crystal(x, up ? c - half - 4 : c + half + 4, h, 11, CAVE[((k % 6) + 6) % 6], (up ? Math.PI : 0) + (((k * 7) % 5) - 2) * 0.15);
      }
      ctx.globalAlpha = 1;
      if (g.ring < 1.1) {
        ctx.lineWidth = 4;
        for (const d of [0, 0.14]) {
          const r = Math.max(0, g.ring - d) * 560;
          ctx.strokeStyle = `rgba(190,240,255,${Math.max(0, 1 - g.ring / 1.1) * 0.8})`;
          ctx.beginPath(); ctx.arc(EB_X, g.by, r, 0, Math.PI * 2); ctx.stroke();
        }
      }
      for (const m of g.gems) {
        const x = m.x - g.dist;
        if (m.got || x < -40 || x > W + 40) continue;
        const y = m.y + Math.sin(S.t * 3 + m.x) * 4;
        glow(x, y - 8, 44, m.col, 0.6);
        crystal(x - 7, y + 14, 36, 15, m.col, -0.22); crystal(x + 8, y + 14, 26, 12, mix(m.col, '#ffffff', 0.3), 0.3);
      }
      glow(EB_X, g.by, 95, '#b8a0ff', 0.28);
      if (g.inv <= 0 || Math.floor(g.inv * 12) % 2 === 0) aubBat(EB_X, g.by, S.t, 0.12 + Math.sin(S.t * 3) * 0.05);
      // how far to the way out
      const k = clamp(g.dist / g.len, 0, 1);
      rrect(300, H - 30, 360, 12, 6, 'rgba(255,255,255,.2)');
      rrect(300, H - 30, Math.max(12, 360 * k), 12, 6, '#8ad4ff');
      text('Way out', 672, H - 24, 14, '#fff6a8', 'left', 700);
      if (L < 0.12) outlined('Press SPACE or click to squeak!', W / 2, 96, 26, '#fff6a8');
    },
  };

  // --- Odd One Out: three things go together, tap the one that doesn't ------------------------
  const ODD_CATS = {
    fruit: ['fruit', [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes'], ['🍓', 'strawberry'], ['🍐', 'pear'], ['🍊', 'orange'], ['🍉', 'watermelon']]],
    animal: ['animal', [['🐶', 'dog'], ['🐱', 'cat'], ['🐰', 'bunny'], ['🐻', 'bear'], ['🐷', 'pig'], ['🐮', 'cow']]],
    clothes: ['thing to wear', [['👟', 'shoe'], ['🧦', 'sock'], ['👒', 'hat'], ['👗', 'dress'], ['🧤', 'glove'], ['👕', 'shirt']]],
    vehicle: ['thing that goes', [['🚗', 'car'], ['🚌', 'bus'], ['🚲', 'bike'], ['✈️', 'plane'], ['🚂', 'train'], ['⛵', 'boat']]],
    sea: ['sea creature', [['🐟', 'fish'], ['🐙', 'octopus'], ['🐬', 'dolphin'], ['🦀', 'crab'], ['🐳', 'whale']]],
    flower: ['flower', [['🌷', 'tulip'], ['🌻', 'sunflower'], ['🌹', 'rose'], ['🌼', 'daisy'], ['🌸', 'blossom']]],
    sweet: ['sweet treat', [['🍩', 'doughnut'], ['🧁', 'cupcake'], ['🍪', 'cookie'], ['🍭', 'lollipop']]],
    bug: ['bug', [['🐞', 'ladybug'], ['🐝', 'bee'], ['🦋', 'butterfly'], ['🐛', 'caterpillar'], ['🐜', 'ant']]],
    music: ['instrument', [['🎸', 'guitar'], ['🥁', 'drum'], ['🎺', 'trumpet'], ['🎻', 'violin'], ['🎹', 'piano']]],
  };
  // groups that overlap too much to be each other's odd one out (a fish IS an animal)
  const ODD_CLASH = [['animal', 'sea', 'bug'], ['fruit', 'sweet']];
  const ODD_COLS = [['pink', '#ff5fa8'], ['blue', '#4f8fff'], ['red', '#ff3b3b'], ['green', '#3fd47a'], ['yellow', '#ffd23f'], ['purple', '#a86aff']];
  const OD_W = 196, OD_H = 236, OD_Y = 196, odX = i => W / 2 - (4 * OD_W + 3 * 20) / 2 + i * (OD_W + 20);
  MG.oddoneout = {
    kind: 'learn', title: () => 'Odd One Out', icon: () => '🔍',
    how: () => 'Three of these go together, and one does not belong. Tap the odd one out! You can press 1, 2, 3 or 4 too.',
    init(g) {
      const kinds = g.tier === 1 ? ['cat', 'color', 'size', 'cat'] : ['cat', 'color', 'count', 'size', 'cat'];
      Object.assign(g, { round: 0, rounds: [6, 7, 8][g.tier - 1], total: 0, shake: {}, plan: ['cat'] });
      while (g.plan.length < g.rounds) g.plan.push(...shuffle(kinds.slice()));
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const kind = g.plan[g.round];
      let cards, odd, why;
      if (kind === 'cat') {
        const ks = Object.keys(ODD_CATS), a = pick(ks);
        const b = pick(ks.filter(k => k !== a && !ODD_CLASH.some(c => c.includes(a) && c.includes(k))));
        cards = shuffle(ODD_CATS[a][1].slice()).slice(0, 3).map(item => ({ item }));
        odd = { item: pick(ODD_CATS[b][1]) };
        why = `The ${odd.item[1]} is not ${art(ODD_CATS[a][0])} ${ODD_CATS[a][0]}!`;
      } else if (kind === 'color') {
        const [a, b] = shuffle(ODD_COLS.slice());
        cards = [0, 1, 2].map(() => ({ col: a[1], h: rand(0.85, 1) }));
        odd = { col: b[1], h: rand(0.85, 1) };
        why = `The ${b[0]} crystal is a different colour! The others are ${a[0]}.`;
      } else if (kind === 'size') {
        const col = pick(ODD_COLS)[1], big = Math.random() < 0.6;
        cards = [0, 1, 2].map(() => ({ col, h: big ? 1 : 0.45 }));
        odd = { col, h: big ? 0.45 : 1 };
        why = big ? 'That crystal is small. The others are big!' : 'That crystal is big. The others are small!';
      } else {
        const n = randInt(2, 4), m = n + (n === 2 ? 1 : n === 4 ? -1 : pick([-1, 1])), col = pick(ODD_COLS)[1];
        cards = [0, 1, 2].map(() => ({ col, n }));
        odd = { col, n: m };
        why = `That one has ${NUM_WORDS[m]} crystals. The others have ${NUM_WORDS[n]}!`;
      }
      odd.odd = true;
      cards.splice(randInt(0, 3), 0, odd);
      Object.assign(g, { kind, cards, why, tried: [], state: 'pick', t2: 0 });
      g.say = kind === 'count' ? 'Count the crystals. Which one does not belong?' : kind === 'cat' ? `Which one does not belong? ${cards.map(c => c.item[1]).join(', ')}.` : 'Look closely. Which one does not belong?';
      if (g.phase === 'play') speak(g.say);
    },
    update(g, dt, id) {
      tickShake(g, dt);
      if (g.state === 'pick') {
        const i = pickRound(g, id, 4, 'odd:');
        if (i >= 0) {
          g.tried.push(i);
          if (g.cards[i].odd) {
            g.total += [1, 0.5, 0.2, 0][g.tried.length - 1]; g.state = 'yay'; g.t2 = 2.6;
            SFX.sparkle(); burst(odX(i) + OD_W / 2, OD_Y + OD_H / 2, 26, { colors: CAVE });
            speak(`${pick(['Yes!', 'You got it!', 'Sharp eyes!'])} ${g.why}`);
          } else { g.shake[i] = 0.4; SFX.miss(); speak('That one belongs with the others. Look again!'); }
        }
      } else if ((g.t2 -= dt) <= 0) {
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      g.progress = `Puzzle ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    drawCard(g, c, cx, cy) {
      if (c.item) { emoji(c.item[0], cx, cy, 96); return; }
      if (c.n) {
        const sp = 46, x0 = cx - (c.n - 1) * sp / 2;
        for (let k = 0; k < c.n; k++) { glow(x0 + k * sp, cy, 34, c.col, 0.4); crystal(x0 + k * sp, cy + 36, 78, 30, c.col, ((k % 3) - 1) * 0.1); }
        return;
      }
      const h = 150 * c.h;
      glow(cx, cy + 70 - h / 2, h * 0.7, c.col, 0.5);
      crystal(cx, cy + 70, h, h * 0.4, c.col);
    },
    draw(g) {
      panel(W / 2 - 360, 70, 720, 104, 22);
      outlined('Which one does NOT belong?', W / 2, 106, 32, '#ff6fb5', 'center', '#fff');
      text(g.state === 'yay' ? g.why : g.kind === 'count' ? 'Count the crystals on each card.' : 'Three go together. Tap the odd one out!', W / 2, 148, 20, '#5a2a6e', 'center', 600);
      g.cards.forEach((c, i) => {
        const x = odX(i) + shakeX(g, i), used = g.tried.includes(i) && !c.odd, right = g.state === 'yay' && c.odd;
        // every card is the same colour, so the card itself is never the clue
        button(`odd:${i}`, x, OD_Y, OD_W, OD_H, '', { color: right ? '#ffd23f' : used ? '#c9bcd4' : '#8a64d8', on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
        rrect(x + 10, OD_Y + 10, OD_W - 20, OD_H - 20, 12, used ? 'rgba(80,60,100,.5)' : 'rgba(30,14,60,.82)');
        inkCircle(x + 26, OD_Y + 26, 13, '#fff6a8', 1.2); text(String(i + 1), x + 26, OD_Y + 27, 15, '#5a2a6e', 'center', 800);
        if (used) ctx.globalAlpha = 0.35;
        this.drawCard(g, c, x + OD_W / 2, OD_Y + OD_H / 2 - 6);
        ctx.globalAlpha = 1;
        if (c.item && (g.state === 'yay' || used)) text(c.item[1], x + OD_W / 2, OD_Y + OD_H - 26, 18, '#fff', 'center', 700);
        if (right) { ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 5; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -S.t * 30; rrect(x - 6, OD_Y - 6, OD_W + 12, OD_H + 12, 20, null, '#fff6a8', 5); ctx.setLineDash([]); }
      });
      drawCritter('Echo the Bat', W / 2, 520, 0.5, 1);
    },
  };

  restage('crystalcave', {
    bg: 'crystalcave_bg',
    games: [['echoflight', 'rainbow', {}], ['oddoneout', 'crystal', {}]],
    intro: ['*:Deep in the caverns, giant crystals glow every colour of the rainbow.',
      'N:Squeak! The way to the rainbow crystals is a pitch-dark tunnel. I see with my ears. I squeak, and the echo shows me the walls!',
      'A:excited:Can I try? Squeak, squeak!'],
    mid: ['N:You fly like a real bat! Now a cave puzzle. In every group, one thing does not belong. Can you spot it?', 'A:thinking:I have super sharp eyes!'],
    outro: ['N:Rainbow drops and crystals from the deepest cave. Squeak! Use them wisely.', 'A:happy:Thank you, Echo! Your echo is amazing!'],
  });

  // ===========================================================================
  // 2. PHOENIX PEAK — Blaze the Phoenix
  // ===========================================================================
  const sunsetCloud = (x, y, w, col) => {
    ctx.fillStyle = col; ellipse(x, y, w * 0.5, w * 0.13); ellipse(x - w * 0.18, y - w * 0.08, w * 0.2, w * 0.12); ellipse(x + w * 0.12, y - w * 0.1, w * 0.24, w * 0.14);
    ctx.fillStyle = 'rgba(255,240,180,.55)'; ellipse(x, y + w * 0.08, w * 0.42, w * 0.04);
  };
  BACKDROPS.phoenix_bg = () => {
    const t = S.t;
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, '#ff7a5c'); sky.addColorStop(0.35, '#ff9f58'); sky.addColorStop(0.7, '#ffc65e'); sky.addColorStop(1, '#ffeaa8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // the big low sun, with slow golden rays
    const sx = 700, sy = 262;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.04); ctx.fillStyle = 'rgba(255,248,200,.26)';
    for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI / 7); tri(0, 0, -64, -620, 64, -620); }
    ctx.restore();
    glow(sx, sy, 190, '#fff4b8', 0.85);
    ctx.fillStyle = '#fff1a0'; circle(sx, sy, 64); ctx.fillStyle = '#ffe070'; circle(sx, sy, 54);
    // warm clouds drifting
    for (const [x, y, w, c, sp] of [[150, 128, 190, 'rgba(255,170,160,.9)', 5], [430, 92, 140, 'rgba(255,200,170,.9)', 3], [820, 150, 210, 'rgba(255,150,140,.85)', 4], [620, 196, 160, 'rgba(255,214,170,.9)', 6], [280, 210, 130, 'rgba(255,190,150,.8)', 7]]) {
      sunsetCloud(((x + t * sp) % (W + 260)) - 130, y, w, c);
    }
    // far ranges
    bdHills('#d8786e', 342, 52, 0.006, 0.5);
    bdHills('#b85a62', 382, 34, 0.009, 2.1);
    // the peak, sunlit on the right, with lava streams
    const peak = P2('M140,470 L280,350 L350,318 L410,236 L462,178 L536,174 L580,214 L628,262 L690,330 L770,388 L860,470 Z');
    ink(peak, '#93403e', 2.5);
    ctx.save(); ctx.clip(peak);
    ctx.fillStyle = '#c45c46'; ctx.beginPath(); ctx.moveTo(500, 170); ctx.lineTo(880, 470); ctx.lineTo(560, 470); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,150,.25)'; ctx.beginPath(); ctx.moveTo(536, 174); ctx.lineTo(700, 330); ctx.lineTo(640, 330); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,20,30,.3)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const y = 240 + i * 38; ctx.beginPath(); ctx.moveTo(300 + i * 4, y + 30); ctx.quadraticCurveTo(500, y - 10, 760 - i * 6, y + 34); ctx.stroke(); }
    const pulse = 0.65 + 0.3 * Math.sin(t * 2.5);
    for (const pts of [[[488, 184], [470, 240], [494, 300], [452, 360], [470, 420], [430, 480]], [[528, 186], [560, 250], [540, 310], [600, 380], [590, 480]]]) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      line(pts, 16, `rgba(255,120,40,${0.35 * pulse})`); line(pts, 8, '#ff7a2a'); line(pts, 3, '#ffe14a');
    }
    ctx.restore();
    // the phoenix nest on top: twigs, a glowing golden egg and dancing flames
    glow(500, 160, 110, '#ffcf5a', 0.55 + 0.15 * Math.sin(t * 3));
    for (let i = 0; i < 6; i++) flame(462 + i * 15, 168, 0.75 + (i % 2) * 0.25, i * 1.7);
    inkEllipse(500, 132, 17, 22, 0, '#ffe36b', 1.5); ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(494, 124, 5, 8);
    inkEllipse(500, 168, 58, 16, 0, '#9a6232', 2);
    ctx.strokeStyle = '#6a3e1e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const x = 448 + i * 13; ctx.beginPath(); ctx.moveTo(x, 160 + (i % 2) * 6); ctx.lineTo(x + 22, 176 - (i % 3) * 4); ctx.stroke(); }
    ctx.strokeStyle = '#c8884a'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const x = 454 + i * 14; ctx.beginPath(); ctx.moveTo(x + 18, 160); ctx.lineTo(x - 4, 174); ctx.stroke(); }
    // a few far birds
    ctx.strokeStyle = 'rgba(120,40,60,.6)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { const x = (160 + i * 60 + t * 18) % (W + 100) - 50, y = 230 + i * 18 + Math.sin(t * 2 + i) * 6, f = Math.sin(t * 7 + i) * 4; ctx.beginPath(); ctx.moveTo(x - 9, y - f); ctx.quadraticCurveTo(x - 4, y - 6, x, y); ctx.quadraticCurveTo(x + 4, y - 6, x + 9, y - f); ctx.stroke(); }
    // warm rocky ground with glowing cracks, rocks and fire flowers
    const gr = new Path2D(); gr.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) gr.lineTo(x, 446 + Math.sin(x * 0.017) * 7 + Math.sin(x * 0.05) * 3);
    gr.lineTo(W, H); gr.closePath();
    const gg = ctx.createLinearGradient(0, 440, 0, H); gg.addColorStop(0, '#a4523e'); gg.addColorStop(1, '#6a2e2a');
    ctx.fillStyle = gg; ctx.fill(gr); ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.stroke(gr);
    ctx.lineCap = 'round';
    for (const pts of [[[60, 490], [90, 502], [120, 498], [150, 512]], [[380, 520], [410, 508], [450, 516]], [[560, 498], [600, 510], [630, 504]], [[830, 520], [870, 506], [900, 514], [940, 508]]]) { line(pts, 7, `rgba(255,120,40,${0.4 * pulse})`); line(pts, 2.5, '#ffb03a'); }
    for (const [x, y, rx] of [[30, 470, 26], [170, 464, 18], [610, 466, 20], [930, 472, 28], [420, 470, 14]]) { inkEllipse(x, y, rx, rx * 0.55, 0, '#8a4a3e', 1.5); ctx.fillStyle = 'rgba(255,220,180,.3)'; ellipse(x - rx * 0.3, y - rx * 0.2, rx * 0.4, rx * 0.18); }
    for (let i = 0; i < 9; i++) flower(40 + i * 108 + (i % 2) * 20, 488 + (i % 3) * 16, 8, ['#ff8a3a', '#ffd23f', '#ff5a5a'][i % 3], '#fff1a0', 1.2);
    // embers drifting up all over
    for (let i = 0; i < 40; i++) {
      const x = (i * 89 + Math.sin(t * 0.8 + i) * 30 + 1000) % W, y = GY - ((t * 32 + i * 41) % 420);
      glow(x, y, 8, i % 3 ? '#ff9a3a' : '#ffe14a', 0.9 * (y > 100 ? 1 : (y - 60) / 40));
    }
  };

  // --- Ember Pinball: flippers, glowing bumpers, collect the floating embers -------------------
  const PB_R = 11, PB_G = 520, PB_FL = 62;
  const PB_WALLS = (() => {
    const w = [[290, 400, 290, 160], [670, 160, 670, 400], [290, 400, 402, 470], [670, 400, 558, 470]];
    let px = 290, py = 160;
    for (let i = 1; i <= 18; i++) { const a = Math.PI + i / 18 * Math.PI, x = 480 + 190 * Math.cos(a), y = 160 + 92 * Math.sin(a); w.push([px, py, x, y]); px = x; py = y; }
    return w;
  })();
  const PB_FIELD = (() => {
    const p = new Path2D(); p.moveTo(290, 400); p.lineTo(290, 160); p.ellipse(480, 160, 190, 92, 0, Math.PI, 0); p.lineTo(670, 400); p.lineTo(558, 470); p.lineTo(558, 540); p.lineTo(402, 540); p.lineTo(402, 470); p.closePath(); return p;
  })();
  // push the ball out of a fat segment and bounce it; omega/cx/cy give a spinning flipper's surface speed
  const pbCollide = (b, ax, ay, bx, by, rad, e, omega = 0, cx = 0, cy = 0) => {
    const dx = bx - ax, dy = by - ay, k = clamp(((b.x - ax) * dx + (b.y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
    const qx = ax + dx * k, qy = ay + dy * k;
    let nx = b.x - qx, ny = b.y - qy;
    const d = Math.hypot(nx, ny), min = rad + PB_R;
    if (d >= min || d === 0) return false;
    nx /= d; ny /= d; b.x = qx + nx * min; b.y = qy + ny * min;
    const svx = -omega * (qy - cy), svy = omega * (qx - cx), vn = (b.vx - svx) * nx + (b.vy - svy) * ny;
    if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; }
    return true;
  };
  MG.emberpinball = {
    kind: 'action', title: () => 'Ember Pinball', icon: () => '🔥',
    how: () => 'Flip with the left and right arrows, or tap each side. Bounce the fireball up to hit the floating embers!',
    init(g) {
      const bumpers = [[410, 206, 26], [550, 206, 26], [480, 292, 28]];
      if (g.tier >= 2) bumpers.push([360, 310, 15], [600, 310, 15]);
      if (g.tier >= 3) bumpers.push([336, 190, 13], [624, 190, 13]);
      Object.assign(g, {
        timeLeft: 80, target: [5, 6, 8][g.tier - 1], got: 0, drains: 0, wait: 0.4, slow: 0,
        bumpers: bumpers.map(([x, y, r]) => ({ x, y, r, lit: 0 })),
        fl: [{ px: 404, py: 472, rest: 0.5, up: -0.42, a: 0.5, w: 0 }, { px: 556, py: 472, rest: Math.PI - 0.5, up: Math.PI + 0.42, a: Math.PI - 0.5, w: 0 }],
        ball: { x: 480, y: 100, vx: 0, vy: 0, live: false }, embers: [], spawnT: 0,
      });
      for (let i = 0; i < (g.tier === 1 ? 3 : 2); i++) g.embers.push(this.ember(g));
      g.say = 'Flip with the left and right arrows! Hit the embers!';
    },
    ember(g) {
      for (;;) {
        const x = rand(325, 635), y = rand(110, 336);
        if (y < 160 && ((x - 480) / 165) ** 2 + ((y - 160) / 74) ** 2 > 1) continue;
        if (g.bumpers.some(b => Math.hypot(b.x - x, b.y - y) < b.r + 40)) continue;
        if (g.embers?.some(e => Math.hypot(e.x - x, e.y - y) < 70)) continue;
        return { x, y, ph: rand(0, 6) };
      }
    },
    start(g) { speak(g.say); },
    // each new fireball rolls down an inlane onto a flipper, so it's the player's flip that sends it up
    launch(g) {
      const left = (g.side = !g.side);
      Object.assign(g.ball, { x: left ? 312 : 648, y: 382, vx: left ? 60 : -60, vy: 0, live: true }); SFX.jump();
    },
    update(g, dt) {
      g.timeLeft -= dt;
      const lHeld = !!(keys.arrowleft || keys.a || keys[' '] || keys.z || (pointer.down && pointer.x < 480));
      const rHeld = !!(keys.arrowright || keys.d || keys[' '] || keys.m || (pointer.down && pointer.x >= 480));
      if (lHeld && !g.lWas) tone(300, 0.06, 'square', 0.04, 0, 520);
      if (rHeld && !g.rWas) tone(320, 0.06, 'square', 0.04, 0, 560);
      g.lWas = lHeld; g.rWas = rHeld;
      const b = g.ball, N = 6, h = dt / N;
      for (let s = 0; s < N; s++) {
        g.fl.forEach((f, i) => {
          const held = i ? rHeld : lHeld, tgt = held ? f.up : f.rest, sp = (held ? 20 : 11) * h, old = f.a;
          f.a = old + clamp(tgt - old, -sp, sp); f.w = (f.a - old) / h;
        });
        if (!b.live) continue;
        b.vy += PB_G * h; b.x += b.vx * h; b.y += b.vy * h;
        for (const w of PB_WALLS) pbCollide(b, w[0], w[1], w[2], w[3], 3, 0.5);
        for (const f of g.fl) pbCollide(b, f.px, f.py, f.px + Math.cos(f.a) * PB_FL, f.py + Math.sin(f.a) * PB_FL, 8, 0.3, f.w, f.px, f.py);
        for (const bp of g.bumpers) {
          let nx = b.x - bp.x, ny = b.y - bp.y; const d = Math.hypot(nx, ny);
          if (d >= bp.r + PB_R || d === 0) continue;
          nx /= d; ny /= d; b.x = bp.x + nx * (bp.r + PB_R); b.y = bp.y + ny * (bp.r + PB_R);
          b.vx = nx * 540; b.vy = ny * 540;
          if (bp.lit <= 0.1) tone(660 + bp.r * 8, 0.1, 'triangle', 0.07, 0, 990);
          bp.lit = 0.35;
        }
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 880) { b.vx *= 880 / sp; b.vy *= 880 / sp; }
      }
      for (const bp of g.bumpers) bp.lit = Math.max(0, bp.lit - dt);
      if (b.live) {
        for (let i = g.embers.length - 1; i >= 0; i--) {
          const e = g.embers[i];
          if (Math.hypot(e.x - b.x, e.y - b.y) > PB_R + 22) continue;
          g.embers.splice(i, 1); g.got++; g.spawnT = 0.7;
          SFX.hit(); burst(e.x, e.y, 18, { colors: ['#ffe14a', '#ff8a3a', '#fff6a8'] }); floatText(e.x, e.y - 20, '+1', '#fff6a8', false, 24);
        }
        // a ball that sits still for a while gets a friendly puff of hot air
        // (judged by distance moved, since a ball cradled on a held flipper jitters but goes nowhere)
        if (!g.anchor || Math.hypot(b.x - g.anchor.x, b.y - g.anchor.y) > 30) { g.anchor = { x: b.x, y: b.y }; g.slow = 0; } else g.slow += dt;
        if (g.slow > 2) { b.vy = -420; b.vx = rand(-120, 120); g.slow = 0; g.anchor = null; }
        // never let it get juggled up top forever
        g.high = b.y < 200 ? (g.high || 0) + dt : 0;
        if (g.high > 4) { b.vx = pick([-1, 1]) * 320; b.vy = 120; g.high = 0; }
        if (b.y > H + 20) {
          b.live = false; g.wait = 1; g.drains++; SFX.miss();
          if (g.drains === 1) speak('Whoops! Here comes another fireball.');
        }
      } else if ((g.wait -= dt) <= 0) this.launch(g);
      if (g.embers.length < (g.tier === 1 ? 3 : 2) && (g.spawnT -= dt) <= 0) { g.embers.push(this.ember(g)); g.spawnT = 0.5; }
      g.progress = `Embers: ${g.got} of ${g.target}`;
      g.score = g.got / g.target;
      if (g.got >= g.target || g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      // side panels that show where to tap
      for (const [x, label, key, on] of [[150, 'Left flipper', '← key', g.lWas], [810, 'Right flipper', '→ key', g.rWas]]) {
        rrect(x - 110, 330, 220, 150, 22, on ? 'rgba(255,200,90,.55)' : 'rgba(80,20,30,.45)', 'rgba(255,240,200,.7)', 3);
        outlined(label, x, 380, 22, '#fff6a8');
        text(`tap this side or ${key}`, x, 420, 16, '#fff', 'center', 600);
      }
      // the table
      ctx.save(); ctx.shadowColor = 'rgba(60,10,20,.5)'; ctx.shadowBlur = 24;
      const tg = ctx.createLinearGradient(0, 66, 0, 540); tg.addColorStop(0, '#4a1530'); tg.addColorStop(1, '#22081c');
      ctx.fillStyle = tg; ctx.fill(PB_FIELD); ctx.restore();
      ctx.save(); ctx.clip(PB_FIELD);
      ctx.translate(480, 300); ctx.rotate(S.t * 0.05); ctx.fillStyle = 'rgba(255,170,80,.06)';
      for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); tri(0, 0, -40, -420, 40, -420); }
      ctx.restore();
      ctx.save(); ctx.clip(PB_FIELD);
      for (let i = 0; i < 5; i++) { const on = (Math.floor(S.t * 3) + i) % 5 === 0; ctx.fillStyle = on ? '#ffe14a' : 'rgba(255,200,90,.3)'; tri(480 - 10, 430 - i * 22, 480 + 10, 430 - i * 22, 480, 416 - i * 22); }
      ctx.restore();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const w of PB_WALLS) inkLine([[w[0], w[1]], [w[2], w[3]]], 6, '#ff9a3a', 2.5);
      for (const bp of g.bumpers) {
        if (bp.lit > 0) glow(bp.x, bp.y, bp.r * 2.6, '#ffe14a', bp.lit * 2.2);
        inkCircle(bp.x, bp.y, bp.r, bp.lit > 0 ? '#fff6c0' : '#ff6a3a', 2);
        inkCircle(bp.x, bp.y, bp.r * 0.62, bp.lit > 0 ? '#ffffff' : '#ffd84a', 1.2);
        star(bp.x, bp.y, bp.r * 0.45, bp.lit > 0 ? '#ffb03a' : '#fff1a0', 5);
      }
      for (const e of g.embers) {
        const y = e.y + Math.sin(S.t * 3 + e.ph) * 4;
        glow(e.x, y - 6, 34, '#ffb03a', 0.7);
        flame(e.x, y + 16, 1, e.ph);
      }
      for (const f of g.fl) {
        ctx.save(); ctx.translate(f.px, f.py); ctx.rotate(f.a);
        ink(P2(`M0,-11 L${PB_FL},-6 A6,6 0 0,1 ${PB_FL},6 L0,11 A11,11 0 0,1 0,-11 Z`), '#ffd23f', 2);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(4, -7, PB_FL - 12, 3);
        ctx.restore();
        inkCircle(f.px, f.py, 4, '#ff6a3a', 1);
      }
      const b = g.ball;
      if (b.live) {
        glow(b.x, b.y, 34, '#ffcf5a', 0.8);
        inkCircle(b.x, b.y, PB_R, '#ffef9a', 1.6);
        ctx.fillStyle = '#fff'; circle(b.x - 3, b.y - 4, 3.5);
      }
    },
  };

  // --- Sunbeam Mirrors: tap mirrors to turn them, bounce the sunbeam into the nest --------------
  MG.sunmirrors = {
    kind: 'learn', title: () => 'Sunbeam Mirrors', icon: () => '☀️',
    how: () => "Blaze's nest is cold! Tap a mirror to turn it, and bounce the sunbeam into the nest.",
    init(g) {
      const [C, R, M, D] = [[4, 3, 2, 1], [5, 4, 3, 1], [6, 4, 4, 2]][g.tier - 1];
      Object.assign(g, { C, R, M, D, cs: [96, 88, 82][g.tier - 1], round: 0, rounds: 3, total: 0, cur: [0, 0], kb: false });
      this.next(g);
    },
    start(g) { speak(g.say); },
    gen(g) {
      const { C, R, M } = g, inG = (c, r) => c >= 0 && r >= 0 && c < C && r < R, K = (c, r) => c + ',' + r;
      for (;;) {
        const r0 = randInt(0, R - 1), seen = new Set(), mir = [];
        let c = 0, r = r0, dx = 1, dy = 0, nest = null;
        for (let s = 0; s < 40 && !nest; s++) {
          seen.add(K(c, r));
          if (mir.length < M && Math.random() < 0.55) {
            const opts = [[dy, dx], [-dy, -dx]].filter(([a, b]) => inG(c + a, r + b) && !seen.has(K(c + a, r + b)));
            if (opts.length) {
              const [a, b] = pick(opts);
              mir.push({ c, r, o: a === -dy && b === -dx ? '/' : '\\' });
              dx = a; dy = b; c += dx; r += dy; continue;
            }
          }
          const nc = c + dx, nr = r + dy;
          if (!inG(nc, nr) || seen.has(K(nc, nr))) break;
          if (mir.length === M && (Math.random() < 0.5 || !inG(nc + dx, nr + dy) || seen.has(K(nc + dx, nr + dy)))) nest = [nc, nr];
          c = nc; r = nr;
        }
        if (nest) return { r0, mir, nest, seen };
      }
    },
    next(g) {
      const p = this.gen(g);
      g.cells = [...Array(g.R)].map(() => Array(g.C).fill(null));
      const ang = o => (o === '/' ? -Math.PI / 4 : Math.PI / 4);
      for (const m of p.mir) g.cells[m.r][m.c] = { o: m.o, good: m.o, path: true };
      const free = [];
      for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C; c++) if (!p.seen.has(c + ',' + r) && !(c === p.nest[0] && r === p.nest[1])) free.push([c, r]);
      shuffle(free).slice(0, g.D).forEach(([c, r]) => { g.cells[r][c] = { o: pick(['/', '\\']), decoy: true }; });
      Object.assign(g, { r0: p.r0, nest: p.nest });
      // scramble the path mirrors so the beam misses
      for (;;) {
        let wrong = 0;
        for (const m of p.mir) { const cell = g.cells[m.r][m.c]; cell.o = Math.random() < 0.65 ? (m.o === '/' ? '\\' : '/') : m.o; if (cell.o !== m.o) wrong++; }
        if (wrong >= Math.ceil(g.M / 2) && !this.trace(g).hit) { g.need = wrong; break; }
      }
      for (const row of g.cells) for (const m of row) if (m) { m.tgt = ang(m.o); m.ang = m.tgt; }
      Object.assign(g, { taps: 0, state: 'play', t2: 0, hint: 0 });
      g.say = g.round === 0 ? 'Tap the mirrors to turn them. Send the sunbeam into the nest!' : 'A new puzzle! Bounce the sunbeam into the nest.';
      if (g.phase === 'play') speak(g.say);
    },
    geom(g) { const w = g.C * g.cs, h = g.R * g.cs; return { x0: W / 2 - w / 2 + 40, y0: 312 - h / 2 + 10, w, h }; },
    // follow the beam from the sun; returns the points it passes and whether it reached the nest
    trace(g) {
      const { x0, y0 } = this.geom(g), cs = g.cs, cx = c => x0 + (c + 0.5) * cs, cy = r => y0 + (r + 0.5) * cs;
      let c = 0, r = g.r0, dx = 1, dy = 0;
      const pts = [[x0 - 48, cy(r)]];
      for (let k = 0; k < 80; k++) {
        if (c < 0 || r < 0 || c >= g.C || r >= g.R) { pts.push([cx(c - dx) + dx * (cs / 2 + 14), cy(r - dy) + dy * (cs / 2 + 14)]); return { pts, hit: false }; }
        if (c === g.nest[0] && r === g.nest[1]) { pts.push([cx(c), cy(r)]); return { pts, hit: true }; }
        const m = g.cells[r][c];
        if (m) { pts.push([cx(c), cy(r)]); [dx, dy] = m.o === '/' ? [-dy, -dx] : [dy, dx]; }
        c += dx; r += dy;
      }
      return { pts, hit: false };
    },
    turn(g, c, r) {
      const m = g.cells[r]?.[c];
      if (!m || g.state !== 'play') return;
      m.o = m.o === '/' ? '\\' : '/'; m.tgt += Math.PI / 2; g.taps++;
      tone(880, 0.06, 'triangle', 0.06); tone(1320, 0.05, 'sine', 0.04, 0.04);
      if (this.trace(g).hit) {
        const extra = g.taps - g.need;
        g.total += extra <= 1 ? 1 : extra <= 4 ? 0.75 : extra <= 8 ? 0.5 : 0.35;
        g.state = 'yay'; g.t2 = 2.4; SFX.fanfare();
        const { x0, y0 } = this.geom(g);
        burst(x0 + (g.nest[0] + 0.5) * g.cs, y0 + (g.nest[1] + 0.5) * g.cs, 30, { colors: ['#ffe14a', '#ff8a3a', '#fff6a8'] });
        speak(pick(['Toasty! The sunbeam reached the nest!', 'You did it! The nest is warm!', 'Hooray! Blaze is cosy now!']));
      }
    },
    update(g, dt, id) {
      for (const row of g.cells) for (const m of row) if (m) m.ang = lerp(m.ang, m.tgt, Math.min(1, dt * 14));
      if (g.state === 'play') {
        const { x0, y0 } = this.geom(g);
        if (pointer.clicked) {
          const c = Math.floor((pointer.x - x0) / g.cs), r = Math.floor((pointer.y - y0) / g.cs);
          if (c >= 0 && r >= 0 && c < g.C && r < g.R) { g.kb = false; this.turn(g, c, r); }
        }
        const mv = [['arrowleft', -1, 0], ['arrowright', 1, 0], ['arrowup', 0, -1], ['arrowdown', 0, 1]].find(([k]) => pressed[k]);
        if (mv) { g.kb = true; g.cur = [clamp(g.cur[0] + mv[1], 0, g.C - 1), clamp(g.cur[1] + mv[2], 0, g.R - 1)]; }
        if (pressed[' '] || pressed.enter) { g.kb = true; this.turn(g, g.cur[0], g.cur[1]); }
        g.hint += dt;
        if (g.hint > 20 && !g.hinted) { g.hinted = true; speak('Follow the sunbeam. Where does it go wrong? Turn that mirror!'); }
      } else if ((g.t2 -= dt) <= 0) {
        g.round++; g.hinted = false;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      g.progress = `Puzzle ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      const { x0, y0, w, h } = this.geom(g), cs = g.cs, yay = g.state === 'yay';
      panel(W / 2 - 330, 66, 660, 50, 20);
      text(yay ? 'Toasty! The nest is warm!' : 'Tap a mirror to turn it. Light up the nest!', W / 2, 91, 22, '#5a2a6e', 'center', 700);
      // the stone board
      inkRect(x0 - 12, y0 - 12, w + 24, h + 24, '#c98a5a', 3, 16);
      for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C; c++) {
        const x = x0 + c * cs, y = y0 + r * cs, hov = !yay && g.cells[r][c] && inRect({ x, y, w: cs, h: cs });
        rrect(x + 3, y + 3, cs - 6, cs - 6, 10, (r + c) % 2 ? '#f3d9a8' : '#ecc994');
        if (hov) rrect(x + 3, y + 3, cs - 6, cs - 6, 10, 'rgba(255,255,255,.45)');
      }
      // the sun
      const sy = y0 + (g.r0 + 0.5) * cs, sx = x0 - 60;
      glow(sx, sy, 70, '#fff1a0', 0.9);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(S.t * 0.6); ctx.fillStyle = '#ffb03a';
      for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); tri(-6, -26, 6, -26, 0, -40); }
      ctx.restore();
      inkCircle(sx, sy, 24, '#ffd23f', 2);
      ctx.fillStyle = OL; circle(sx - 8, sy - 3, 2.6); circle(sx + 8, sy - 3, 2.6);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy + 3, 7, 0.2, Math.PI - 0.2); ctx.stroke();
      // the nest
      const nx = x0 + (g.nest[0] + 0.5) * cs, ny = y0 + (g.nest[1] + 0.5) * cs;
      if (yay) { glow(nx, ny, cs, '#ffb03a', 0.9); for (let i = 0; i < 5; i++) flame(nx - 24 + i * 12, ny + 6, 0.8, i * 1.3); }
      inkEllipse(nx, ny - 6, 13, 17, 0, yay ? '#fff1a0' : '#e8dcc8', 1.4);
      inkEllipse(nx, ny + 10, cs * 0.36, cs * 0.13, 0, '#9a6232', 1.6);
      ctx.strokeStyle = '#6a3e1e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const x = nx - cs * 0.3 + i * cs * 0.13; ctx.beginPath(); ctx.moveTo(x, ny + 4); ctx.lineTo(x + 14, ny + 16); ctx.stroke(); }
      if (!yay) text('Nest', nx, ny + cs * 0.38, 13, '#7a3a1a', 'center', 700);
      // the beam
      const tr = this.trace(g);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      line(tr.pts, 16, 'rgba(255,230,120,.35)'); line(tr.pts, 6, '#ffe14a'); line(tr.pts, 2.5, '#ffffff');
      if (!tr.hit) { const [ex, ey] = tr.pts[tr.pts.length - 1]; star(ex, ey, 9 + Math.sin(S.t * 8) * 2, '#fff6a8', 4); }
      // sparkles running along the beam
      let total = 0; const segs = [];
      for (let i = 1; i < tr.pts.length; i++) { const l = Math.hypot(tr.pts[i][0] - tr.pts[i - 1][0], tr.pts[i][1] - tr.pts[i - 1][1]); segs.push(l); total += l; }
      for (let k = 0; k < 6; k++) {
        let d = ((S.t * 160 + k * total / 6) % total), i = 0;
        while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
        const [ax, ay] = tr.pts[i], [bx, by] = tr.pts[i + 1], f = segs[i] ? d / segs[i] : 0;
        star(lerp(ax, bx, f), lerp(ay, by, f), 5, '#fff', 4);
      }
      // the mirrors
      for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C; c++) {
        const m = g.cells[r][c];
        if (!m) continue;
        const x = x0 + (c + 0.5) * cs, y = y0 + (r + 0.5) * cs, L = cs * 0.4;
        inkCircle(x, y, 7, '#c98a5a', 1.2);
        ctx.save(); ctx.translate(x, y); ctx.rotate(m.ang);
        inkRect(-L, -7, L * 2, 14, '#ffd23f', 2, 6);
        const mg = ctx.createLinearGradient(0, -4, 0, 4); mg.addColorStop(0, '#ffffff'); mg.addColorStop(1, '#a8d8f0');
        ctx.fillStyle = mg; ctx.fillRect(-L + 5, -4, L * 2 - 10, 8);
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(-L * 0.6 + Math.sin(S.t * 2 + c) * L * 0.3, -4, 6, 8);
        ctx.restore();
      }
      if (g.kb && !yay) { ctx.setLineDash([8, 6]); rrect(x0 + g.cur[0] * cs + 2, y0 + g.cur[1] * cs + 2, cs - 4, cs - 4, 12, null, '#ff6fb5', 4); ctx.setLineDash([]); }
      drawCritter('Blaze the Phoenix', 110, 520, 0.6, 1);
    },
  };

  restage('phoenix', {
    bg: 'phoenix_bg',
    games: [['emberpinball', 'ember', {}], ['sunmirrors', 'feather', {}]],
    intro: ['*:A bird made of fire lands beside you. It is warm, but it does not burn.',
      'N:My embers are bouncing all over the peak! Flip my fireball with the flippers and catch every spark!',
      "A:excited:Ember pinball? Let's go!"],
    mid: ['N:Splendid! But now my nest has gone cold. Turn the mirrors so the sunbeam bounces right into it.', 'A:determined:Sunbeam, here I come!'],
    outro: ['N:My nest is toasty again! Take my embers and feathers. They never stop glowing.', "A:happy:They're so warm and sparkly! Thank you, Blaze!"],
  });

  // ===========================================================================
  // 3. THE WISHING WELL — Wishbone the Frog
  // ===========================================================================
  const cottage = (x, w, h, wall, roof, k) => {
    const by = 440, t = S.t;
    inkRect(x, by - h, w, h, wall, 2.5, 3);
    ctx.strokeStyle = 'rgba(60,30,60,.35)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, by - h * 0.55); ctx.lineTo(x + w, by - h * 0.55); ctx.stroke();
    inkRect(x + w * 0.7, by - h - w * 0.42, 16, 44, '#8a6a7a', 2, 2);
    ink(P2(`M${x - 14},${by - h} L${x + w / 2},${by - h - w * 0.5} L${x + w + 14},${by - h} Z`), roof, 2.5);
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) { const yy = by - h - w * 0.5 * (1 - i / 4); ctx.beginPath(); ctx.moveTo(x + w / 2 - (w / 2 + 14) * i / 4, yy); ctx.lineTo(x + w / 2 + (w / 2 + 14) * i / 4, yy); ctx.stroke(); }
    // glowing windows that flicker a little, and a door
    for (const [wx, wy] of [[x + w * 0.18, by - h + 18], [x + w * 0.58, by - h + 18], [x + w * 0.18, by - h * 0.45]]) {
      const lit = mix('#ffd86a', '#ffae4a', 0.5 + 0.5 * Math.sin(t * 2.3 + wx * 0.1 + k));
      glow(wx + w * 0.12, wy + 16, 44, '#ffcf6a', 0.35);
      inkRect(wx, wy, w * 0.24, 32, lit, 2, 3);
      ctx.fillStyle = OL; ctx.fillRect(wx + w * 0.12 - 1, wy, 2, 32); ctx.fillRect(wx, wy + 15, w * 0.24, 2);
      inkRect(wx - 3, wy + 32, w * 0.24 + 6, 8, '#a0683a', 1.5, 2);
      ctx.fillStyle = ['#ff6fae', '#ffd84a', '#fff'][k % 3]; for (let f = 0; f < 3; f++) circle(wx + 4 + f * (w * 0.08), wy + 32, 3);
    }
    inkRect(x + w * 0.58, by - h * 0.5 + 6, w * 0.26, h * 0.5 - 6, '#7a4a3a', 2, 6);
    ctx.fillStyle = '#ffd84a'; circle(x + w * 0.62, by - h * 0.25, 2.5);
  };
  const lampPost = (x, by, h = 150) => {
    glow(x, by - h - 14, 70, '#ffd27a', 0.55 + 0.08 * Math.sin(S.t * 3 + x));
    inkRect(x - 4, by - h, 8, h, '#3a3456', 1.5, 2);
    inkRect(x - 12, by - 8, 24, 10, '#3a3456', 1.5, 3);
    ink(P2(`M${x - 12},${by - h} L${x - 15},${by - h - 26} L${x + 15},${by - h - 26} L${x + 12},${by - h} Z`), '#ffe9a0', 1.5);
    ink(P2(`M${x - 18},${by - h - 26} L${x},${by - h - 40} L${x + 18},${by - h - 26} Z`), '#3a3456', 1.5);
  };
  const wishWell = (x, by) => {
    // sparkles rising out of the well
    for (let i = 0; i < 8; i++) { const k = (S.t * 0.4 + i / 8) % 1; star(x - 50 + (i * 37) % 100 + Math.sin(S.t + i) * 6, by - 76 - k * 120, 3 + (i % 3), `rgba(255,246,168,${1 - k})`, 4); }
    inkRect(x - 64, by - 196, 10, 130, '#8a5a3a', 2, 2); inkRect(x + 54, by - 196, 10, 130, '#8a5a3a', 2, 2);
    inkRect(x - 58, by - 168, 116, 9, '#a0683a', 1.6, 3);
    ctx.strokeStyle = '#d8c090'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, by - 160); ctx.lineTo(x, by - 112); ctx.stroke();
    inkRect(x - 14, by - 114, 28, 22, '#a0683a', 1.6, 3); ctx.fillStyle = '#6a7080'; ctx.fillRect(x - 14, by - 108, 28, 3);
    inkRect(x + 62, by - 172, 6, 22, '#6a7080', 1.2, 2); inkRect(x + 62, by - 152, 18, 6, '#6a7080', 1.2, 2);
    ink(P2(`M${x - 96},${by - 186} L${x},${by - 244} L${x + 96},${by - 186} L${x + 86},${by - 178} L${x},${by - 230} L${x - 86},${by - 178} Z`), '#c0504a', 2.5);
    ctx.fillStyle = '#d8706a'; ctx.beginPath(); ctx.moveTo(x - 80, by - 186); ctx.lineTo(x, by - 236); ctx.lineTo(x + 80, by - 186); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,30,40,.45)'; ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 80 + i * 18, by - 186 - i * 11); ctx.lineTo(x + 80 - i * 18, by - 186 - i * 11); ctx.stroke(); }
    // the stone drum
    inkRect(x - 72, by - 76, 144, 76, '#9a96b8', 2.5, 10);
    ctx.save(); ctx.beginPath(); ctx.roundRect(x - 72, by - 76, 144, 76, 10); ctx.clip();
    ctx.strokeStyle = 'rgba(60,50,90,.45)'; ctx.lineWidth = 2;
    for (let r = 0; r < 4; r++) { const y = by - 76 + r * 19; ctx.beginPath(); ctx.moveTo(x - 72, y); ctx.lineTo(x + 72, y); ctx.stroke(); for (let c = 0; c < 6; c++) { const bx = x - 72 + c * 28 + (r % 2) * 14; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + 19); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x - 72, by - 76, 144, 8);
    ctx.restore();
    inkEllipse(x, by - 76, 78, 14, 0, '#b8b4d4', 2.5);
    ctx.fillStyle = '#1a1840'; ellipse(x, by - 76, 62, 9);
    glow(x, by - 78, 60, '#8ad4ff', 0.4 + 0.15 * Math.sin(S.t * 2));
    // moss and a little frog-friendly lily
    ctx.fillStyle = '#5aa86a'; ellipse(x - 52, by - 66, 12, 4); ellipse(x + 40, by - 10, 14, 4);
  };
  const fountain = (x, by) => {
    inkEllipse(x, by - 18, 86, 20, 0, '#a8a4c8', 2.5);
    inkRect(x - 86, by - 18, 172, 18, '#a8a4c8', 2.5, 6);
    ctx.fillStyle = '#5fb8e8'; ellipse(x, by - 20, 74, 13);
    inkRect(x - 9, by - 82, 18, 64, '#b8b4d4', 2, 4);
    inkEllipse(x, by - 82, 40, 9, 0, '#b8b4d4', 2);
    ctx.fillStyle = '#7fd0f0'; ellipse(x, by - 83, 30, 5);
    // water arcs and drops
    ctx.strokeStyle = 'rgba(190,235,255,.8)'; ctx.lineWidth = 3;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, by - 104); ctx.quadraticCurveTo(x + d * 40, by - 128, x + d * 58, by - 26); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x, by - 86); ctx.lineTo(x, by - 112); ctx.stroke();
    for (let i = 0; i < 10; i++) { const k = (S.t * 0.9 + i / 10) % 1, d = i % 2 ? 1 : -1; ctx.fillStyle = 'rgba(220,245,255,.9)'; circle(x + d * k * 58, by - 104 - Math.sin(k * Math.PI) * 26 + k * 78, 2.2); }
    for (const [ph, rx] of [[0, 0], [0.5, 0]]) { const k = (S.t * 0.6 + ph) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x + rx, by - 20, 10 + k * 55, 2 + k * 8, 0, 0, Math.PI * 2); ctx.stroke(); }
  };
  BACKDROPS.wishwell_bg = () => {
    const t = S.t;
    const sky = ctx.createLinearGradient(0, 0, 0, 440);
    sky.addColorStop(0, '#0d103e'); sky.addColorStop(0.6, '#2c2a78'); sky.addColorStop(1, '#5a3f8e');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) star((i * 137) % W, 66 + (i * 71) % 220, 1.4 + (i % 3) * 0.9, `rgba(255,255,235,${0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + i))})`, 4);
    const sh = (t % 8) / 8;
    if (sh < 0.12) { const k = sh / 0.12, x = 160 + k * 300, y = 90 + k * 70; ctx.strokeStyle = `rgba(255,255,230,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 50, y - 12); ctx.stroke(); star(x, y, 5, '#fff', 4); }
    glow(840, 116, 110, '#fff2c0', 0.4);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(856, 106, 33, 0, Math.PI * 2); ctx.clip('evenodd'); ctx.fillStyle = '#fff6d0'; circle(840, 116, 38); ctx.restore();
    // far rooftops
    ctx.fillStyle = '#211f5a';
    for (let i = 0; i < 9; i++) { const x = i * 120 - 30, h = 210 + (i * 41) % 60; ctx.fillRect(x, 440 - h, 100, h); tri(x - 10, 440 - h, x + 50, 440 - h - 40, x + 110, 440 - h); ctx.fillStyle = 'rgba(255,210,120,.5)'; ctx.fillRect(x + 30, 460 - h, 12, 14); ctx.fillStyle = '#211f5a'; }
    // strings of fairy lights
    for (const [x0, y0, x1, y1] of [[0, 214, 330, 206], [330, 206, 640, 214], [640, 214, 960, 204]]) {
      ctx.strokeStyle = 'rgba(30,20,50,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 50, x1, y1); ctx.stroke();
      for (let i = 1; i < 12; i++) {
        const k = i / 12, x = lerp(x0, x1, k), y = lerp(y0, y1, k) + 50 * 2 * k * (1 - k), c = ['#ff6fae', '#ffd84a', '#7fe0ff', '#9aff9a'][i % 4];
        glow(x, y + 4, 12, c, 0.5 + 0.4 * Math.sin(t * 3 + i + x0));
        ctx.fillStyle = c; circle(x, y + 4, 3.5);
      }
    }
    // cottages round the square
    cottage(-30, 150, 190, '#e8b8d8', '#7a3a6a', 0);
    cottage(150, 130, 160, '#b8d0f0', '#3a4a8a', 1);
    cottage(300, 140, 200, '#f0dca0', '#8a4a3a', 2);
    cottage(620, 140, 180, '#c8e8c0', '#3a6a5a', 3);
    cottage(780, 130, 210, '#f0c0a8', '#8a3a4a', 4);
    cottage(910, 120, 160, '#d0c0f0', '#4a3a7a', 5);
    emoji('🐈‍⬛', 216, 216 + Math.sin(t) * 0.5, 26);
    // the cobbled square
    const pg = ctx.createLinearGradient(0, 430, 0, H); pg.addColorStop(0, '#6a6290'); pg.addColorStop(1, '#3e3862');
    ctx.fillStyle = pg; ctx.fillRect(0, 430, W, H - 430);
    ctx.strokeStyle = 'rgba(30,20,60,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 432); ctx.lineTo(W, 432); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,190,240,.25)'; ctx.lineWidth = 1.5;
    for (let j = 0; j < 7; j++) {
      const y = 440 + j * 14 + j * j * 1.2, w = 30 + j * 6;
      for (let x = (j % 2) * w / 2 - w; x < W + w; x += w) { ctx.beginPath(); ctx.ellipse(x, y, w * 0.44, 5 + j * 0.8, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(255,210,120,.12)'; ellipse(480, 470, 200, 26);
    fountain(110, 452);
    wishWell(480, 452);
    lampPost(360, 448); lampPost(610, 448); lampPost(900, 452, 160);
    // fireflies
    for (let i = 0; i < 12; i++) { const x = (i * 83 + Math.sin(t * 0.6 + i * 2) * 60 + 1000) % W, y = 300 + Math.sin(t * 0.9 + i) * 70 + (i % 3) * 30; glow(x, y, 10, '#d8ff8a', 0.5 + 0.5 * Math.sin(t * 4 + i)); }
  };

  // --- Wish Fishing: lower the bucket, scoop floating wish-coins, haul them up ---------------
  const WF = { L: 300, R: 660, top: 150, water: 500, x: 480, bank: 176 };
  const wishCoin = (x, y, s = 1, ph = 0) => {
    const sq = Math.abs(Math.cos(S.t * 2 + ph)) * 0.7 + 0.3;
    glow(x, y, 30 * s, '#ffe36b', 0.55);
    ctx.save(); ctx.translate(x, y); ctx.scale(sq, 1);
    inkCircle(0, 0, 15 * s, '#ffd23f', 1.6);
    inkCircle(0, 0, 10.5 * s, '#ffe98a', 0.8);
    star(0, 0, 8 * s, '#f0a020', 5);
    ctx.restore();
  };
  const spider = (x, y, t) => {
    ctx.strokeStyle = '#d8c0f0'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const d of [-1, 1]) for (let i = 0; i < 4; i++) {
      const a = (i - 1.5) * 0.45, wig = Math.sin(t * 10 + i) * 3;
      ctx.beginPath(); ctx.moveTo(x + d * 8, y); ctx.quadraticCurveTo(x + d * 20, y - 12 + i * 6 + wig, x + d * 26, y + a * 26 + 8); ctx.stroke();
    }
    glow(x, y, 34, '#c890ff', 0.3);
    inkCircle(x, y + 4, 13, '#9a5ac0', 1.5); inkCircle(x, y - 9, 9, '#b07ad0', 1.5);
    ctx.fillStyle = '#ffd84a'; circle(x - 4, y + 4, 2.5); circle(x + 4, y + 8, 2.5);
    ctx.fillStyle = '#fff'; circle(x - 4, y - 10, 3.4); circle(x + 4, y - 10, 3.4);
    ctx.fillStyle = '#1a1020'; circle(x - 3.5, y - 9.5, 1.8); circle(x + 4.5, y - 9.5, 1.8);
    ctx.fillStyle = '#ff9ad0'; circle(x, y + 6, 3);
  };
  MG.wishfishing = {
    kind: 'action', title: () => 'Wish Fishing', icon: () => '🪣',
    how: () => 'Move the bucket with the arrows or the mouse. Scoop up wish-coins, then pull the bucket to the top to wish! Dodge the bats and spiders.',
    init(g) {
      Object.assign(g, { timeLeft: 70, target: [8, 10, 12][g.tier - 1], banked: 0, held: 0, by: WF.top + 14, inv: 0, crank: 0, drops: [], jolt: 0 });
      g.coins = [214, 274, 334, 394, 454].map(y => this.coin(y));
      g.bats = shuffle([244, 304, 364, 424]).slice(0, Math.max(1, g.tier - 1)).map(y => ({ y, x: rand(WF.L + 40, WF.R - 40), vx: pick([-1, 1]) * rand(70, 95 + g.tier * 22), ph: rand(0, 6) }));
      g.spiders = [pick([360, 600])].map(x => ({ x, vx: pick([-1, 1]) * 24, ph: rand(0, 6), y: 300 }));
      g.say = 'Down to scoop, up to wish!';
    },
    coin(y) { return { y, x: rand(WF.L + 30, WF.R - 30), vx: pick([-1, 1]) * rand(45, 85), ph: rand(0, 6), gone: 0 }; },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.timeLeft -= dt; g.inv -= dt; g.jolt = Math.max(0, g.jolt - dt);
      const prev = g.by;
      let v = 0;
      if (keys.arrowup || keys.w) v -= 1;
      if (keys.arrowdown || keys.s) v += 1;
      if (v) g.by += v * 300 * dt;
      else if (pointerMoved(g)) g.by += clamp(pointer.y - 20 - g.by, -380 * dt, 380 * dt);
      g.by = clamp(g.by, WF.top + 6, 452);
      g.crank += (g.by - prev) * 0.06;
      const bx = WF.x, bcy = g.by + 22, t = S.t;
      for (const c of g.coins) {
        if (c.gone > 0) { if ((c.gone -= dt) <= 0) Object.assign(c, this.coin(c.y), { gone: 0 }); continue; }
        c.x += c.vx * dt;
        if (c.x < WF.L + 22 || c.x > WF.R - 22) { c.vx *= -1; c.x = clamp(c.x, WF.L + 22, WF.R - 22); }
        if (g.held < 3 && Math.abs(c.x - bx) < 44 && Math.abs(c.y - bcy) < 30) {
          g.held++; c.gone = 1.4; SFX.pop(); burst(c.x, c.y, 10, { colors: ['#ffe36b', '#fff6a8'] });
        }
      }
      const hit = () => {
        if (g.inv > 0) return;
        g.inv = 1.3; g.jolt = 0.4; SFX.miss();
        if (g.held > 0) { g.held--; g.drops.push({ x: bx, y: bcy, vy: -60 }); floatText(bx, bcy - 40, 'Oops!', '#ffb0c4', false, 22); }
        if (!g.warned) { g.warned = true; speak('Oh no! Keep the bucket away from the bats and spiders.'); }
      };
      for (const b of g.bats) {
        b.x += b.vx * dt;
        if (b.x < WF.L + 30 || b.x > WF.R - 30) { b.vx *= -1; b.x = clamp(b.x, WF.L + 30, WF.R - 30); }
        b.cy = b.y + Math.sin(t * 2.4 + b.ph) * 12;
        if (Math.abs(b.x - bx) < 54 && Math.abs(b.cy - bcy) < 32) hit();
      }
      for (const s of g.spiders) {
        s.x += s.vx * dt;
        if (s.x < WF.L + 40 || s.x > WF.R - 40) { s.vx *= -1; s.x = clamp(s.x, WF.L + 40, WF.R - 40); }
        s.y = 310 + Math.sin(t * 0.8 + s.ph) * 120;
        if (Math.abs(s.x - bx) < 48 && Math.abs(s.y - bcy) < 32) hit();
      }
      for (let i = g.drops.length - 1; i >= 0; i--) { const d = g.drops[i]; d.vy += 600 * dt; d.y += d.vy * dt; if (d.y > WF.water) { g.drops.splice(i, 1); burst(d.x, WF.water, 8, { colors: ['#8ad4ff', '#fff'] }); } }
      if (g.held > 0 && g.by <= WF.bank) {
        g.banked += g.held; SFX.sparkle(); burst(bx, g.by, 24, { colors: ['#ffe36b', '#ffb3e0', '#b8e6ff'] });
        floatText(bx, g.by - 30, g.held > 1 ? `${g.held} wishes!` : 'A wish!', '#fff6a8', false, 26);
        g.held = 0;
      }
      g.progress = `Wishes: ${g.banked} of ${g.target}`;
      g.score = g.banked / g.target;
      if (g.banked >= g.target || g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      const t = S.t, bx = WF.x + (g.jolt ? Math.sin(g.jolt * 60) * 6 : 0);
      // earth cross-section either side of the shaft
      const eg = ctx.createLinearGradient(0, WF.top, 0, H); eg.addColorStop(0, '#4a3048'); eg.addColorStop(1, '#22162e');
      ctx.fillStyle = eg; ctx.fillRect(0, WF.top, W, H - WF.top);
      ctx.fillStyle = '#5a8a5a'; ctx.fillRect(0, WF.top - 4, W, 10);
      for (let i = 0; i < 26; i++) { const x = (i * 131) % W, y = WF.top + 30 + (i * 67) % (H - WF.top - 40); if (x > WF.L - 50 && x < WF.R + 50) continue; inkEllipse(x, y, 9 + (i % 3) * 4, 6 + (i % 2) * 2, 0, ['#6a5068', '#5a4058', '#7a6078'][i % 3], 1); }
      ctx.strokeStyle = '#7a5a4a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const [x, d] of [[120, 1], [840, -1], [200, -1], [770, 1]]) { ctx.beginPath(); ctx.moveTo(x, WF.top + 4); ctx.bezierCurveTo(x + d * 20, WF.top + 50, x - d * 16, WF.top + 80, x + d * 10, WF.top + 120); ctx.stroke(); }
      emoji('🪱', 150, 430, 28); emoji('💎', 820, 470, 24); emoji('🦴', 110, 300, 26);
      // the shaft: dark and magical, with mossy brick walls
      const sg = ctx.createLinearGradient(0, WF.top, 0, H); sg.addColorStop(0, '#2a2e6a'); sg.addColorStop(1, '#0e1238');
      ctx.fillStyle = sg; ctx.fillRect(WF.L, WF.top, WF.R - WF.L, H - WF.top);
      for (let i = 0; i < 14; i++) star(WF.L + 20 + (i * 53) % (WF.R - WF.L - 40), WF.top + 30 + (i * 89) % 320, 2 + (i % 2), `rgba(200,230,255,${0.2 + 0.4 * Math.abs(Math.sin(t + i))})`, 4);
      for (const x0 of [WF.L - 34, WF.R]) {
        inkRect(x0, WF.top - 6, 34, H - WF.top + 10, '#8a86a8', 2, 0);
        ctx.strokeStyle = 'rgba(50,40,80,.5)'; ctx.lineWidth = 2;
        for (let y = WF.top + 16, r = 0; y < H; y += 24, r++) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 34, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 + (r % 2 ? 12 : 22), y); ctx.lineTo(x0 + (r % 2 ? 12 : 22), y + 24); ctx.stroke(); }
        ctx.fillStyle = '#5aa86a'; for (let i = 0; i < 6; i++) ellipse(x0 + 17 + Math.sin(i * 3) * 8, WF.top + 60 + i * 64, 10, 4);
      }
      // magic water at the bottom
      const wg = ctx.createLinearGradient(0, WF.water, 0, H); wg.addColorStop(0, '#5ad8ff'); wg.addColorStop(1, '#2a5ab0');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(WF.L, H);
      for (let x = WF.L; x <= WF.R; x += 12) ctx.lineTo(x, WF.water + Math.sin(x * 0.05 + t * 2) * 3);
      ctx.lineTo(WF.R, H); ctx.fill();
      for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(255,240,150,.7)'; circle(WF.L + 40 + i * 70 + Math.sin(t + i) * 8, WF.water + 18 + (i % 2) * 8, 3); }
      // the well top above ground: rim, posts, roof and winch
      inkRect(WF.L - 46, WF.top - 22, WF.R - WF.L + 92, 22, '#b8b4d4', 2.5, 6);
      inkRect(WF.L - 30, 92, 12, WF.top - 112, '#8a5a3a', 2, 2); inkRect(WF.R + 18, 92, 12, WF.top - 112, '#8a5a3a', 2, 2);
      ink(P2(`M${WF.L - 70},98 L${WF.x},62 L${WF.R + 70},98 Z`), '#c0504a', 2.5);
      inkRect(WF.L - 24, 104, WF.R - WF.L + 48, 12, '#a0683a', 1.6, 4);
      ctx.save(); ctx.translate(WF.R + 40, 110); ctx.rotate(g.crank); inkRect(-3, -3, 30, 6, '#6a7080', 1.2, 3); inkCircle(27, 0, 5, '#a0683a', 1.2); ctx.restore();
      // the rope and bucket
      ctx.strokeStyle = '#e8d0a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(WF.x, 112); ctx.lineTo(bx, g.by); ctx.stroke();
      ctx.strokeStyle = '#6a7080'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(bx, g.by + 8, 30, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      for (let i = 0; i < g.held; i++) wishCoin(bx - 18 + i * 18, g.by + 6, 0.7, i);
      ink(P2(`M${bx - 38},${g.by + 6} L${bx + 38},${g.by + 6} L${bx + 30},${g.by + 48} L${bx - 30},${g.by + 48} Z`), '#b07a4a', 2);
      ctx.fillStyle = '#6a7080'; ctx.fillRect(bx - 36, g.by + 14, 72, 4); ctx.fillRect(bx - 32, g.by + 38, 64, 4);
      if (g.held >= 3 && Math.floor(t * 3) % 2) outlined('Full! Pull it up!', bx, g.by + 72, 20, '#fff6a8');
      // floating wish-coins, bats and spiders
      for (const c of g.coins) if (c.gone <= 0) wishCoin(c.x, c.y + Math.sin(t * 2 + c.ph) * 5, 1, c.ph);
      for (const d of g.drops) wishCoin(d.x, d.y, 0.8);
      for (const b of g.bats) drawBat(b.x, b.cy ?? b.y, t + b.ph, 0.75, Math.sign(b.vx), '#5a3a7a', '#3a2258');
      for (const s of g.spiders) {
        ctx.strokeStyle = 'rgba(230,230,255,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s.x, WF.top); ctx.lineTo(s.x, s.y - 12); ctx.stroke();
        spider(s.x, s.y, t);
      }
      // hint near the top
      if (g.held > 0 && g.by > WF.bank + 40) { outlined('⬆', WF.x + 70, WF.top + 30 + Math.sin(t * 6) * 4, 26, '#fff6a8'); text('Pull up to wish!', WF.x + 92, WF.top + 30, 16, '#fff6a8', 'left', 700); }
      // the bucket's coin count, on the side
      darkPanel(WF.R + 60, 230, 200, 92, 18);
      text('In the bucket', WF.R + 160, 254, 16, '#fff', 'center', 700);
      for (let i = 0; i < 3; i++) { if (i < g.held) wishCoin(WF.R + 110 + i * 50, 292, 0.8, i); else { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(WF.R + 110 + i * 50, 292, 12, 0, Math.PI * 2); ctx.stroke(); } }
    },
  };

  // --- Coin Count: pennies, nickels and dimes; count them, then pay for a wish -----------------
  // [value, radius, name, gradient colours, ink]
  const USC = { penny: [1, 26, 'penny', ['#f0b07a', '#b8642e'], '#5a2408'], nickel: [5, 31, 'nickel', ['#eef0f4', '#9ea4b0'], '#2e3442'], dime: [10, 23, 'dime', ['#f6f7fa', '#b0b6c2'], '#2e3442'] };
  const usCoin = (kind, x, y, s = 1, label = false, labelCol = '#5a2a6e') => {
    const [v, r0, name, [c1, c2], col] = USC[kind], r = r0 * s;
    const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    inkCircle(x, y, r, gr, 1.5);
    if (kind === 'dime') {
      ctx.strokeStyle = 'rgba(60,60,80,.45)'; ctx.lineWidth = 1;
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
    }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.stroke();
    text(`${v}¢`, x, y + 1, Math.round(r * (v === 10 ? 0.74 : 0.86)), col, 'center', 800);
    if (label) text(name, x, y + r + 13 * s, Math.round(14 * s), labelCol, 'center', 700);
  };
  const coinSum = list => list.reduce((a, k) => a + USC[k][0], 0);
  const centWords = n => `${NUM_WORDS[n] ?? n} ${n === 1 ? 'cent' : 'cents'}`;
  MG.coincount = {
    kind: 'learn', title: () => 'Coin Count', icon: () => '🪙',
    how: () => 'A penny is one cent, a nickel is five cents, and a dime is ten cents. Count the coins and pay for a wish!',
    init(g) {
      Object.assign(g, { round: 0, rounds: 6, total: 0, shake: {}, kinds: g.tier === 1 ? ['penny', 'nickel'] : ['penny', 'nickel', 'dime'] });
      this.next(g);
    },
    start(g) { speak(g.say); },
    countSet(tier) {
      for (;;) {
        let d = 0, n = 0, p = 0;
        if (tier === 1) { n = randInt(0, 1); p = randInt(n ? 1 : 2, n ? 5 : 9); }
        else if (tier === 2) { d = randInt(0, 1); n = randInt(0, 2); p = randInt(1, 5); }
        else { d = randInt(1, 3); n = randInt(0, 2); p = randInt(0, 4); }
        const coins = [...Array(d).fill('dime'), ...Array(n).fill('nickel'), ...Array(p).fill('penny')], total = coinSum(coins);
        if (total >= 2 && coins.length <= 9 && coins.length >= 2) return coins;
      }
    },
    next(g) {
      const mode = g.round % 2 ? 'pay' : 'count';
      Object.assign(g, { mode, tried: [], state: 'pick', t2: 0, helped: false, overs: 0, over: false, pot: [] });
      if (mode === 'count') {
        g.coins = this.countSet(g.tier); g.answer = coinSum(g.coins);
        const opts = new Set([g.answer]);
        for (const c of shuffle([g.coins.length, g.answer + 1, g.answer - 1, g.answer + 5, g.answer - 5, g.answer + 10])) if (c > 0 && opts.size < 3) opts.add(c);
        g.choices = shuffle([...opts]);
        g.say = 'How much money is this? Count the coins!';
      } else {
        g.price = randInt(...[[3, 10], [7, 25], [12, 45]][g.tier - 1]);
        g.say = `This wish costs ${centWords(g.price)}. Tap the coins to pay exactly ${centWords(g.price)}.`;
      }
      if (g.phase === 'play') speak(g.say);
    },
    // where each coin of a counting pile sits
    pileX(g, i) { const n = g.coins.length, sp = Math.min(96, 760 / n); return W / 2 - (n - 1) * sp / 2 + i * sp; },
    potPos(g, i) { const per = 8, row = Math.floor(i / per), col = i % per; return [W / 2 - (per - 1) * 36 + col * 72, 300 + row * 66]; },
    update(g, dt, id) {
      tickShake(g, dt);
      if (g.state === 'yay') {
        if ((g.t2 -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      } else if (g.mode === 'count') {
        const i = pickRound(g, id, 3, 'amt:');
        if (i >= 0) {
          g.tried.push(i);
          if (g.choices[i] === g.answer) {
            g.total += [1, 0.5, 0.2][g.tried.length - 1]; g.state = 'yay'; g.t2 = 2.4; g.helped = true;
            SFX.sparkle(); burst(W / 2, 270, 24, { colors: ['#ffe36b', '#e8a066', '#dfe3ea'] });
            speak(`Yes! That's ${centWords(g.answer)}!`);
          } else {
            g.shake[i] = 0.4; SFX.miss(); g.helped = true;
            let run = 0; const steps = g.coins.map(k => (run += USC[k][0]));
            speak(`Let's count together. ${steps.map(n => NUM_WORDS[n] ?? n).join(', ')}.`);
          }
        }
      } else {
        const add = id?.startsWith('coin:') ? id.slice(5) : g.kinds[numKey(g.kinds.length)];
        if (add && g.pot.length < 16) { g.pot.push(add); tone(1200, 0.06, 'triangle', 0.07); tone(1600, 0.08, 'sine', 0.05, 0.05); }
        if (pointer.clicked) {
          const j = g.pot.findIndex((k, i) => { const [x, y] = this.potPos(g, i); return Math.hypot(pointer.x - x, pointer.y - y) < USC[k][1] * 1.2 + 4; });
          if (j >= 0) { g.pot.splice(j, 1); SFX.blip(); }
        }
        if ((id === 'undo' || pressed.backspace) && g.pot.length) { g.pot.pop(); SFX.blip(); }
        const sum = coinSum(g.pot);
        if (sum > g.price && !g.over) { g.over = true; g.overs++; SFX.miss(); speak(`Too much! That's ${centWords(sum)}. Tap a coin to take it back.`); }
        if (sum <= g.price) g.over = false;
        if (sum === g.price) {
          g.total += Math.max(0.3, 1 - 0.4 * g.overs); g.state = 'yay'; g.t2 = 2.4;
          SFX.fanfare(); burst(W / 2, 300, 30, { colors: ['#ffe36b', '#ffb3e0', '#b8e6ff'] });
          speak(`Perfect! ${centWords(g.price)} for a wish. Ribbit!`);
        }
      }
      g.progress = `Round ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      panel(W / 2 - 400, 66, 800, 82, 22);
      if (g.mode === 'count') outlined('How much money is this?', W / 2, 100, 30, '#ff6fb5', 'center', '#fff');
      else outlined(`This wish costs ${g.price}¢`, W / 2, 100, 30, '#ff6fb5', 'center', '#fff');
      text(g.state === 'yay' ? 'Well done!' : g.mode === 'count' ? 'Count the coins, then pick the answer.' : `Tap coins to pay exactly ${g.price}¢.`, W / 2, 132, 18, '#5a2a6e', 'center', 600);
      // the coin key
      darkPanel(W / 2 - 250, 156, 500, 52, 18);
      ['penny', 'nickel', 'dime'].forEach((k, i) => { const x = W / 2 - 170 + i * 170; usCoin(k, x - 40, 182, 0.62); text(`${USC[k][2]} = ${USC[k][0]}¢`, x - 18, 182, 17, '#fff', 'left', 700); });
      if (g.mode === 'count') {
        rrect(W / 2 - 420, 224, 840, 150, 24, 'rgba(60,28,90,.92)', 'rgba(255,230,255,.7)', 3);
        let run = 0;
        g.coins.forEach((k, i) => {
          const x = this.pileX(g, i), y = 300;
          usCoin(k, x, y, 1.45, true, '#fff'); run += USC[k][0];
          if (g.helped) { rrect(x - 24, 236, 48, 26, 13, '#fff6a8', OL, 2); text(`${run}¢`, x, 249, 16, '#5a2a6e', 'center', 800); }
        });
        g.choices.forEach((v, i) => {
          const x = W / 2 - 300 + i * 210 + shakeX(g, i), used = g.tried.includes(i) && v !== g.answer, right = g.state === 'yay' && v === g.answer;
          button(`amt:${i}`, x, 410, 180, 80, `${v}¢`, { color: right ? '#ffd23f' : used ? '#c9bcd4' : CARD[i], on: (g.state === 'pick' && !used) || right, size: 38, key: String(i + 1) });
        });
      } else {
        const sum = coinSum(g.pot);
        rrect(W / 2 - 330, 222, 660, 186, 26, 'rgba(24,32,90,.92)', 'rgba(180,220,255,.7)', 3);
        text('Wish jar', W / 2 - 310, 242, 16, '#b8e6ff', 'left', 700);
        outlined(`${sum}¢`, W / 2 + 270, 250, 30, sum > g.price ? '#ffb0b0' : sum === g.price ? '#b8ffb0' : '#fff6a8');
        if (!g.pot.length) text('Tap a coin below to drop it in!', W / 2, 320, 20, 'rgba(255,255,255,.7)', 'center', 600);
        g.pot.forEach((k, i) => { const [x, y] = this.potPos(g, i); usCoin(k, x, y, 1.15); });
        if (g.over) outlined('Too much! Tap a coin to take it back.', W / 2, 392, 20, '#ffb0b0');
        const n = g.kinds.length, bw = 170, x0 = W / 2 - (n * bw + (n - 1) * 20) / 2 - 60;
        g.kinds.forEach((k, i) => {
          const x = x0 + i * (bw + 20);
          button(`coin:${k}`, x, 420, bw, 96, '', { color: ['#e8955a', '#8a96b0', '#7a8aa8'][USC[k][0] === 1 ? 0 : USC[k][0] === 5 ? 1 : 2], on: g.state === 'pick', key: String(i + 1) });
          usCoin(k, x + 52, 466, 1.2);
          text(USC[k][2], x + 100, 456, 18, '#fff', 'left', 700);
          text(`${USC[k][0]}¢`, x + 100, 482, 18, '#fff', 'left', 700);
        });
        button('undo', x0 + n * (bw + 20), 436, 120, 64, 'Take back', { color: '#9a6ae0', on: g.state === 'pick' && g.pot.length > 0, size: 16 });
      }
    },
  };

  restage('wishingwell', {
    bg: 'wishwell_bg',
    games: [['wishfishing', 'stardust', {}], ['coincount', 'honey', {}]],
    intro: ['N:Ribbit. The wish-coins are floating deep down in my well. Lower the bucket and scoop them up!',
      'N:But watch out for the bats and the spiders down there. Ribbit!',
      'A:thinking:I know exactly what I will wish for...'],
    mid: ['N:Ribbit! In this town, wishes cost real coins. Pennies, nickels and dimes. Can you count them?', "A:focused:I'm good with money... I think!"],
    outro: ['N:Your wish smells like stardust. Take some, and a little honey too. Ribbit.', "A:winky:I wish {N} could stay forever... shh, don't tell!"],
  });

  // ===========================================================================
  // 4. AURORA GLACIER — Pengu the Penguin
  // ===========================================================================
  const penguin = (x, y, s = 1, t = 0, scarf = false, dir = 1) => {
    const bob = Math.sin(t * 6) * 2;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = 'rgba(30,40,80,.2)'; ellipse(0, 2, 22, 6);
    inkEllipse(-10, -2, 9, 5, 0, '#ffa22a', 1.2); inkEllipse(10, -2, 9, 5, 0, '#ffa22a', 1.2);
    ctx.translate(0, bob * 0.3);
    inkEllipse(0, -30, 22, 30, 0, '#2a2a4a', 1.6);
    inkEllipse(-22, -30 + bob, 6, 16, 0.3, '#2a2a4a', 1.2); inkEllipse(22, -30 - bob, 6, 16, -0.3, '#2a2a4a', 1.2);
    ctx.fillStyle = '#ffffff'; ellipse(0, -24, 15, 22);
    ctx.fillStyle = '#fff'; circle(-7, -44, 6); circle(7, -44, 6);
    ctx.fillStyle = '#1a1a2a'; circle(-6, -44, 3); circle(8, -44, 3);
    ink(P2('M-6,-38 L6,-38 L0,-30 Z'), '#ffa22a', 1);
    ctx.fillStyle = 'rgba(255,130,170,.5)'; circle(-12, -36, 3); circle(12, -36, 3);
    if (scarf) { inkRect(-18, -30, 36, 8, '#ff3f6a', 1.2, 4); inkRect(8, -26, 8, 16, '#ff3f6a', 1.2, 3); }
    ctx.restore();
  };
  const igloo = (x, by, r) => {
    ink(P2(`M${x - r},${by} A${r},${r} 0 0,1 ${x + r},${by} Z`), '#f4faff', 2.5);
    ctx.save(); ctx.beginPath(); ctx.arc(x, by, r, Math.PI, 0); ctx.clip();
    ctx.strokeStyle = 'rgba(120,160,210,.6)'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) { const y = by - r * i / 4; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke(); for (let k = -3; k <= 3; k++) { const bx = x + k * r / 3.2 + (i % 2) * r / 6.4; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + r / 4); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(160,200,240,.35)'; ctx.beginPath(); ctx.arc(x + r * 0.2, by, r, Math.PI * 1.5, 0); ctx.lineTo(x + r * 0.2, by); ctx.fill();
    ctx.restore();
    ink(P2(`M${x + r * 0.3},${by} L${x + r * 0.3},${by - r * 0.34} A${r * 0.24},${r * 0.24} 0 0,1 ${x + r * 0.78},${by - r * 0.34} L${x + r * 0.78},${by} Z`), '#f4faff', 2);
    ctx.fillStyle = '#2a3a6a'; ctx.beginPath(); ctx.moveTo(x + r * 0.38, by); ctx.lineTo(x + r * 0.38, by - r * 0.3); ctx.arc(x + r * 0.54, by - r * 0.3, r * 0.16, Math.PI, 0); ctx.lineTo(x + r * 0.7, by); ctx.fill();
    glow(x + r * 0.54, by - r * 0.15, r * 0.5, '#ffcf7a', 0.35);
  };
  const iceberg = (x, y, w, h, t, k) => {
    const b = Math.sin(t * 1.2 + k) * 2;
    ink(P2(`M${x - w / 2},${y + b} L${x - w * 0.3},${y - h * 0.6 + b} L${x - w * 0.05},${y - h + b} L${x + w * 0.2},${y - h * 0.7 + b} L${x + w * 0.42},${y - h * 0.35 + b} L${x + w / 2},${y + b} Z`), '#e8f6ff', 2);
    ctx.fillStyle = 'rgba(110,170,230,.45)'; ctx.beginPath(); ctx.moveTo(x - w * 0.05, y - h + b); ctx.lineTo(x + w * 0.2, y - h * 0.7 + b); ctx.lineTo(x + w * 0.42, y - h * 0.35 + b); ctx.lineTo(x + w / 2, y + b); ctx.lineTo(x + w * 0.05, y + b); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(160,220,255,.35)'; ellipse(x, y + 8 + b, w * 0.45, 5);
  };
  const aurora = (t, y0 = 100) => {
    [['#5fffb0', 0, 120], ['#5fd8ff', 1.7, 150], ['#ff7ad8', 3.4, 180], ['#a888ff', 5, 130]].forEach(([c, ph, base]) => {
      const rgb = rgbOf(c);
      for (let x = -10; x <= W + 10; x += 6) {
        const y = y0 + base - 100 + Math.sin(x * 0.006 + t * 0.35 + ph) * 34 + Math.sin(x * 0.017 + t * 0.6 + ph) * 12;
        const hgt = 70 + Math.sin(x * 0.03 + t + ph) * 26, a = 0.18 + 0.1 * Math.sin(x * 0.05 + t * 1.3 + ph);
        const gr = ctx.createLinearGradient(0, y, 0, y + hgt);
        gr.addColorStop(0, `rgba(${rgb},0)`); gr.addColorStop(0.35, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = gr; ctx.fillRect(x, y, 7, hgt);
      }
    });
  };
  BACKDROPS.glacier_bg = () => {
    const t = S.t;
    const sky = ctx.createLinearGradient(0, 0, 0, 380);
    sky.addColorStop(0, '#0a163a'); sky.addColorStop(0.6, '#1e3f78'); sky.addColorStop(1, '#5a8ac0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) star((i * 137) % W, 64 + (i * 71) % 200, 1.3 + (i % 3) * 0.8, `rgba(255,255,255,${0.3 + 0.7 * Math.abs(Math.sin(t * 0.7 + i))})`, 4);
    aurora(t);
    // icy mountains and the glacier wall
    ctx.fillStyle = '#bcd8f2';
    ctx.beginPath(); ctx.moveTo(0, 320); [[60, 230], [140, 270], [230, 200], [330, 262], [420, 214], [520, 280], [620, 206], [720, 256], [820, 196], [900, 250], [960, 226], [960, 320]].forEach(([x, y]) => ctx.lineTo(x, y)); ctx.fill();
    ctx.fillStyle = 'rgba(120,160,215,.45)';
    for (const [x, y] of [[230, 200], [420, 214], [620, 206], [820, 196]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70, y + 70); ctx.lineTo(x + 6, y + 110); ctx.closePath(); ctx.fill(); }
    const gw = ctx.createLinearGradient(0, 270, 0, 350); gw.addColorStop(0, '#e6f6ff'); gw.addColorStop(1, '#8cc4ec');
    ctx.fillStyle = gw; ctx.beginPath(); ctx.moveTo(0, 350);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 286 + ((x / 40) % 2) * 10 + Math.sin(x * 0.01) * 8);
    ctx.lineTo(W, 350); ctx.fill();
    ctx.strokeStyle = 'rgba(70,120,190,.45)'; ctx.lineWidth = 2;
    for (let x = 20; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 296 + (x % 3) * 4); ctx.lineTo(x + 8, 322); ctx.lineTo(x + 2, 348); ctx.stroke(); }
    // the dark sea with icebergs and aurora reflections
    const sg = ctx.createLinearGradient(0, 346, 0, 410); sg.addColorStop(0, '#2a5a98'); sg.addColorStop(1, '#173a70');
    ctx.fillStyle = sg; ctx.fillRect(0, 346, W, 70);
    for (let i = 0; i < 10; i++) { ctx.fillStyle = ['rgba(95,255,176,.18)', 'rgba(255,122,216,.15)'][i % 2]; ellipse((i * 103 + t * 10) % W, 362 + (i % 3) * 14, 40, 3); }
    iceberg(120, 380, 110, 70, t, 0); iceberg(380, 372, 70, 40, t, 1); iceberg(560, 384, 90, 56, t, 2);
    penguin(120, 352 + Math.sin(t * 1.2) * 2, 0.4, t, false, 1);
    // the ice arch on the right
    ink(P2('M740,410 C740,300 790,262 840,262 C890,262 940,300 940,410 L908,410 C908,330 880,300 840,300 C800,300 772,330 772,410 Z'), '#dff2ff', 2.5);
    ctx.fillStyle = 'rgba(120,170,230,.4)'; ctx.fill(P2('M908,410 C908,330 880,300 840,300 L840,262 C890,262 940,300 940,410 Z'));
    for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,255,255,.9)'; tri(780 + i * 34, 300 - (i % 2) * 12, 790 + i * 34, 300 - (i % 2) * 12, 785 + i * 34, 318); }
    // snow field
    const sn = ctx.createLinearGradient(0, 400, 0, H); sn.addColorStop(0, '#f6fbff'); sn.addColorStop(1, '#cfe4f6');
    ctx.fillStyle = sn; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 410 + Math.sin(x * 0.012) * 8 + Math.sin(x * 0.04) * 3);
    ctx.lineTo(W, H); ctx.fill();
    ctx.strokeStyle = 'rgba(110,150,200,.4)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 410 + Math.sin(x * 0.012) * 8 + Math.sin(x * 0.04) * 3);
    ctx.stroke();
    ctx.fillStyle = 'rgba(170,205,240,.45)'; for (const [x, y, w] of [[90, 470, 90], [420, 500, 120], [600, 470, 70], [880, 500, 100]]) ellipse(x, y, w, 8);
    igloo(80, 446, 62); igloo(560, 436, 40); igloo(890, 452, 56);
    penguin(400, 452, 0.55, t, false, 1); penguin(440, 460, 0.45, t + 1, false, -1); penguin(640, 446, 0.5, t + 2, true, -1); penguin(165, 470, 0.42, t + 3, false, 1);
    // little fish pile and a snowman
    emoji('🐟', 600, 480, 20); emoji('☃️', 840, 500, 40);
    // sparkles in the snow and gently falling snow
    for (let i = 0; i < 18; i++) star(40 + (i * 157) % 900, 430 + (i * 47) % 100, 3 + (i % 2) * 2, `rgba(255,255,255,${Math.max(0, Math.sin(t * 2 + i * 1.7))})`, 4);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 46; i++) { const x = (i * 131 + Math.sin(t + i) * 20 + 1000) % W, y = 64 + (t * 24 + i * 37) % (H - 64); circle(x, y, 1.5 + (i % 3) * 0.7); }
  };

  // --- Ice Floe Hop: frogger-style hops across drifting ice to reach the fish ---------------------
  MG.floehop = {
    kind: 'action', title: () => 'Ice Floe Hop', icon: () => '🐧',
    how: () => 'Hop Pengu across the water to the fish! Press up, or tap above Pengu, to hop. Only land on the ice!',
    init(g) {
      const n = [4, 5, 6][g.tier - 1], spd = [42, 56, 70][g.tier - 1], [l0, l1] = [[150, 200], [125, 175], [110, 150]][g.tier - 1];
      const laneH = (480 - 130) / n;
      g.lanes = [...Array(n)].map((_, i) => {
        const dir = i % 2 ? -1 : 1, v = dir * spd * rand(0.8, 1.35), floes = [];
        for (let x = rand(-100, 0); x < W + 260;) { const len = rand(l0, l1); floes.push({ x, len }); x += len + rand(80, 150 + g.tier * 15); }
        return { y: 480 - (i + 0.5) * laneH, v, floes, span: Math.max(W + 300, floes[floes.length - 1].x + floes[floes.length - 1].len + 100) };
      });
      Object.assign(g, { n, laneH, timeLeft: 80, target: [3, 4, 5][g.tier - 1], fish: 0, splashes: 0, row: 0, px: W / 2, hop: 0, from: null, to: null, splash: 0, cheer: 0, face: 1 });
      g.say = 'Hop on the ice floes! Up arrow to hop.';
    },
    start(g) { speak(g.say); },
    rowY(g, r) { return r === 0 ? 506 : r > g.n ? 98 : g.lanes[r - 1].y; },
    floeAt(g, r, x, margin = 8) { return r >= 1 && r <= g.n ? g.lanes[r - 1].floes.find(f => x > f.x - margin && x < f.x + f.len + margin) : null; },
    tryHop(g, dr, dx) {
      if (g.hop > 0 || g.splash > 0 || g.cheer > 0) return;
      const r = clamp(g.row + dr, 0, g.n + 1);
      if (r === g.row && !dx) return;
      g.from = [g.px, this.rowY(g, g.row)]; g.toRow = r; g.toX = clamp(g.px + dx, 30, W - 30); g.hop = 0.26;
      if (dx) g.face = Math.sign(dx);
      SFX.jump();
    },
    update(g, dt) {
      g.timeLeft -= dt;
      for (const L of g.lanes) for (const f of L.floes) {
        f.x += L.v * dt;
        if (L.v > 0 && f.x > W + 150) f.x -= L.span;
        if (L.v < 0 && f.x + f.len < -150) f.x += L.span;
      }
      if (g.cheer > 0) {
        if ((g.cheer -= dt) <= 0) { if (g.fish >= g.target) g.done = true; else { g.row = 0; g.px = clamp(g.px, 60, W - 60); } }
      } else if (g.splash > 0) {
        if ((g.splash -= dt) <= 0) { g.row = 0; g.px = clamp(g.px, 60, W - 60); }
      } else if (g.hop > 0) {
        g.hop -= dt;
        if (g.hop <= 0) {
          g.row = g.toRow; g.px = g.toX;
          if (g.row === g.n + 1) {
            g.fish++; g.cheer = 1.1; SFX.sparkle(); burst(g.px, 90, 24, { colors: ['#8ad4ff', '#fff6a8', '#ffb3e0'] });
            floatText(g.px, 70, 'Yum! A fish!', '#fff6a8', false, 24); speak(g.fish >= g.target ? 'Yum yum! All the fish!' : 'Yum! A fish! Go back for more!');
          } else if (g.row >= 1 && !this.floeAt(g, g.row, g.px)) this.dunk(g);
          else SFX.step();
        }
      } else {
        const ptr = pointer.clicked && pointer.y > 64;
        const py = this.rowY(g, g.row);
        if (jumpPressed() || (ptr && pointer.y < py - 34)) this.tryHop(g, 1, 0);
        else if (pressed.arrowdown || pressed.s || (ptr && pointer.y > py + 34)) this.tryHop(g, -1, 0);
        else if (pressed.arrowleft || pressed.a || (ptr && pointer.x < g.px)) this.tryHop(g, 0, -64);
        else if (pressed.arrowright || pressed.d || (ptr && pointer.x >= g.px)) this.tryHop(g, 0, 64);
      }
      // riding a floe carries Pengu along; drifting off the edge is a splash
      if (g.hop <= 0 && g.splash <= 0 && g.cheer <= 0 && g.row >= 1 && g.row <= g.n) {
        g.px += g.lanes[g.row - 1].v * dt;
        if (g.px < 18 || g.px > W - 18) this.dunk(g);
      }
      g.progress = `Fish: ${g.fish} of ${g.target}`;
      g.score = clamp(g.fish / g.target - 0.04 * g.splashes, 0, 1);
      if (g.timeLeft <= 0) g.done = true;
    },
    dunk(g) {
      g.splash = 0.9; g.splashes++; SFX.miss(); tone(200, 0.3, 'sine', 0.06, 0, 80);
      burst(g.px, this.rowY(g, g.row), 18, { colors: ['#8ad4ff', '#ffffff', '#5fb8e8'] });
      if (g.splashes === 1) speak('Splash! Brrr! Wait for a floe to come close, then hop.');
    },
    draw(g) {
      const t = S.t;
      const wg = ctx.createLinearGradient(0, 130, 0, 480); wg.addColorStop(0, '#2a6ab8'); wg.addColorStop(1, '#1a4a90');
      ctx.fillStyle = wg; ctx.fillRect(0, 128, W, 356);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
      g.lanes.forEach((L, i) => {
        for (let k = 0; k < 7; k++) { const x = ((k * 160 + t * L.v * 0.6) % (W + 80) + W + 80) % (W + 80) - 40, y = L.y + ((k * 13) % 20) - 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y); ctx.stroke(); }
        if (i) { ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.moveTo(0, L.y + g.laneH / 2); ctx.lineTo(W, L.y + g.laneH / 2); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; }
        text(L.v > 0 ? '›' : '‹', L.v > 0 ? W - 14 : 14, L.y, 26, 'rgba(255,255,255,.4)', 'center', 800);
      });
      for (const L of g.lanes) for (const f of L.floes) {
        if (f.x > W + 20 || f.x + f.len < -20) continue;
        const y = L.y, h = g.laneH * 0.62, bob = Math.sin(t * 2 + f.x * 0.01) * 1.5;
        ctx.fillStyle = 'rgba(10,30,70,.3)'; ellipse(f.x + f.len / 2, y + h / 2 + 4, f.len / 2, 6);
        ink(P2(`M${f.x + 10},${y - h / 2 + bob} L${f.x + f.len - 14},${y - h / 2 + 3 + bob} Q${f.x + f.len},${y + bob} ${f.x + f.len - 8},${y + h / 2 + bob} L${f.x + 12},${y + h / 2 - 2 + bob} Q${f.x},${y + bob} ${f.x + 10},${y - h / 2 + bob} Z`), '#f2faff', 2);
        ctx.fillStyle = 'rgba(140,190,240,.5)'; ctx.fillRect(f.x + 8, y + h / 2 - 8 + bob, f.len - 18, 6);
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(f.x + f.len * 0.3, y - h / 4 + bob, f.len * 0.14, 3);
      }
      // the two shores
      for (const [y0, y1] of [[64, 130], [480, H]]) {
        const sg = ctx.createLinearGradient(0, y0, 0, y1); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#d6e8f8');
        ctx.fillStyle = sg; ctx.fillRect(0, y0, W, y1 - y0);
        ctx.strokeStyle = 'rgba(90,130,190,.6)'; ctx.lineWidth = 3; ctx.beginPath();
        const ey = y0 === 64 ? y1 : y0;
        for (let x = 0; x <= W; x += 24) ctx.lineTo(x, ey + Math.sin(x * 0.08) * 3);
        ctx.stroke();
      }
      for (let i = 0; i < 10; i++) star(30 + i * 100, i % 2 ? 520 : 82, 4, `rgba(140,190,240,${0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`, 4);
      igloo(70, 540, 44); penguin(880, 530, 0.5, t, false, -1); emoji('🪣', 930, 516, 26);
      // fish jumping out of holes on the far shore
      for (let i = 0; i < 6; i++) {
        const x = 90 + i * 156, j = Math.max(0, Math.sin(t * 2.2 + i * 1.3));
        inkEllipse(x, 112, 26, 8, 0, '#2a5a98', 1.5);
        if (j > 0.05) emoji('🐟', x, 104 - j * 26, 30);
      }
      text('Fish!', 26, 82, 16, '#2a5a98', 'left', 800);
      // Pengu
      let x = g.px, y = this.rowY(g, g.row), s = 0.9, lift = 0;
      if (g.hop > 0) { const k = 1 - g.hop / 0.26, ty = this.rowY(g, g.toRow); x = lerp(g.from[0], g.toX, k); y = lerp(g.from[1], ty, k); lift = Math.sin(k * Math.PI) * 26; }
      if (g.splash > 0) {
        const k = 1 - g.splash / 0.9;
        ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 10, 20 + k * 40, 6 + k * 10, 0, 0, Math.PI * 2); ctx.stroke();
        if (k < 0.5) { ctx.save(); ctx.globalAlpha = 1 - k * 2; penguin(x, y + 10 + k * 40, s, t, true, g.face); ctx.restore(); }
        outlined('Splash!', x, y - 50, 24, '#b8e6ff');
      } else {
        ctx.fillStyle = 'rgba(10,30,70,.25)'; ellipse(x, y + 18, 22 - lift * 0.3, 6);
        penguin(x, y + 18 - lift, s, g.hop > 0 ? 0 : t, true, g.face);
      }
      if (g.cheer > 0) { emoji('🐟', x + 26, y - 40, 34); }
      if (g.row === 0 && g.hop <= 0 && g.splash <= 0 && g.cheer <= 0) outlined('⬆', x, y - 70 + Math.sin(t * 6) * 4, 28, '#fff6a8');
    },
  };

  // --- Thermometer: read the red line, hot or cold, match temperatures to pictures --------------
  // [emoji, words, °F]
  const T_PICS = [
    ['⛄', 'a snowman', 20], ['⛸️', 'ice skating', 20], ['🏂', 'snowboarding', 10], ['🧊', 'an ice cube', 30],
    ['🌷', 'a spring garden', 60], ['🪁', 'flying a kite', 60], ['☂️', 'a rainy day', 50],
    ['🏖️', 'the beach', 90], ['🌵', 'the hot desert', 110], ['☕', 'hot cocoa', 120], ['🍲', 'hot soup', 120],
  ];
  const band = T => (T <= 30 ? 0 : T <= 70 ? 1 : 2);
  // a thermometer with its tube from y0 (120°F) down to y0+h (0°F)
  const thermo = (x, y0, h, temp, step = 10, s = 1, icons = true) => {
    const tw = 22 * s, br = 24 * s, by = y0 + h + 22 * s, ty = T => y0 + h - (clamp(T, 0, 120) / 120) * h;
    inkRect(x - 58 * s, y0 - 34 * s, 116 * s, h + 92 * s, '#fffaf2', 2.5, 18 * s);
    ctx.fillStyle = 'rgba(80,160,255,.14)'; ctx.fillRect(x - 54 * s, ty(40), 108 * s, ty(0) - ty(40));
    ctx.fillStyle = 'rgba(255,90,60,.12)'; ctx.fillRect(x - 54 * s, ty(120), 108 * s, ty(80) - ty(120));
    for (let T = 0; T <= 120; T += 10) {
      const y = ty(T), major = T % step === 0;
      ctx.strokeStyle = OL; ctx.lineWidth = major ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(x + tw / 2 + 2, y); ctx.lineTo(x + tw / 2 + (major ? 16 : 9) * s, y); ctx.stroke();
      if (major) text(String(T), x - tw / 2 - 6 * s, y, Math.round(15 * s), '#5a2a6e', 'right', 700);
    }
    text('°F', x + 30 * s, y0 - 18 * s, Math.round(14 * s), '#5a2a6e', 'center', 700);
    inkRect(x - tw / 2, y0 - 8 * s, tw, h + 14 * s, '#eef6ff', 2, tw / 2);
    inkCircle(x, by, br, '#ff4a4a', 2);
    rrect(x - tw / 2 + 5 * s, ty(temp), tw - 10 * s, by - ty(temp), 5 * s, '#ff4a4a');
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x - tw / 2 + 6 * s, ty(temp) + 4, 3 * s, by - ty(temp) - 14 * s); circle(x - 8 * s, by - 8 * s, 6 * s);
    if (icons) { emoji('❄️', x + 40 * s, ty(15), Math.round(20 * s)); emoji('🔥', x + 40 * s, ty(110), Math.round(20 * s)); }
    return ty;
  };
  MG.thermoread = {
    kind: 'learn', title: () => 'Thermometer', icon: () => '🌡️',
    how: () => 'The red line goes up when it is hot and down when it is cold. Read the thermometer and answer!',
    init(g) {
      const plans = { 1: ['hotcold', 'pic', 'hotcold', 'read', 'thermo', 'pic'], 2: ['hotcold', 'read', 'pic', 'read', 'thermo', 'read', 'pic'], 3: ['read', 'pic', 'read', 'thermo', 'read', 'hotcold', 'read', 'thermo'] };
      Object.assign(g, { plan: plans[g.tier], round: 0, total: 0, shake: {}, step: g.tier === 3 ? 20 : 10 });
      g.rounds = g.plan.length;
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const kind = g.plan[g.round];
      Object.assign(g, { kind, tried: [], state: 'pick', t2: 0, shown: 0, missed: false });
      if (kind === 'hotcold') {
        g.T = pick([10, 20, 30, 90, 100, 110]); g.choices = ['cold', 'hot']; g.answer = g.T >= 80 ? 1 : 0;
        g.say = 'Look at the red line. Is it hot or cold?';
      } else if (kind === 'read') {
        g.T = randInt(1, 11) * 10;
        const opts = new Set([g.T]);
        for (const d of shuffle([-20, -10, 10, 20])) if (opts.size < 3 && g.T + d >= 0 && g.T + d <= 120) opts.add(g.T + d);
        g.choices = shuffle([...opts]); g.answer = g.choices.indexOf(g.T);
        g.say = 'What temperature is it? Look where the red line stops.';
      } else if (kind === 'pic') {
        const bands = shuffle([0, 1, 2]), picks = bands.map(b => pick(T_PICS.filter(p => band(p[2]) === b)));
        g.choices = picks; g.answer = 0; const right = picks[0]; g.T = right[2];
        g.choices = shuffle(picks); g.answer = g.choices.indexOf(right); g.pic = right;
        g.say = `It is ${NUM_WORDS[g.T] ?? g.T} degrees. Which picture matches?`;
        if (g.T >= 100) g.say = `It is ${g.T} degrees. Which picture matches?`;
      } else {
        g.pic = pick(T_PICS);
        const temps = [20, 60, 100]; temps[band(g.pic[2])] = g.pic[2];
        g.choices = shuffle(temps); g.answer = g.choices.indexOf(g.pic[2]);
        g.say = `Which thermometer matches ${g.pic[1]}?`;
      }
      if (g.phase === 'play') speak(g.say);
    },
    feel(T) { return T <= 30 ? 'cold' : T <= 70 ? 'nice and warm' : 'hot'; },
    update(g, dt, id) {
      tickShake(g, dt);
      g.shown = Math.min(1, g.shown + dt * 1.2);
      if (g.state === 'pick') {
        const n = g.choices.length, i = pickRound(g, id, n, 'th:');
        if (i >= 0) {
          g.tried.push(i);
          if (i === g.answer) {
            g.total += [1, 0.5, 0.2][g.tried.length - 1]; g.state = 'yay'; g.t2 = 2.6;
            SFX.sparkle(); burst(W / 2 + 160, 300, 24);
            const T = g.kind === 'thermo' ? g.pic[2] : g.T;
            const pic = g.kind === 'pic' || g.kind === 'thermo' ? g.pic : null;
            g.why = g.kind === 'read' ? `Yes! It is ${T} degrees.` : pic ? `${cap(pic[1])} is ${this.feel(T)}!` : `${T} degrees is ${T >= 80 ? 'hot! Phew!' : 'cold! Brrr!'}`;
            speak(g.why);
          } else {
            g.shake[i] = 0.4; SFX.miss(); g.missed = true;
            speak(g.kind === 'read' ? 'Not quite. Follow the red line across to the number.' : g.kind === 'hotcold' ? 'Look again. Is the red line down by the snowflake, or up by the fire?' : 'Not that one. Is it cold, warm, or hot?');
          }
        }
      } else if ((g.t2 -= dt) <= 0) {
        g.round++;
        if (g.round >= g.rounds) g.done = true; else this.next(g);
      }
      g.progress = `Round ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      const e = easeOut(g.shown), yay = g.state === 'yay';
      const q = { hotcold: 'Is it hot or cold?', read: 'What temperature is it?', pic: 'Which picture matches?', thermo: `Which thermometer matches ${g.pic?.[1]}?` }[g.kind];
      panel(W / 2 - 380, 66, 760, 76, 22);
      outlined(q, W / 2, 96, 28, '#ff6fb5', 'center', '#fff');
      text(yay ? g.why : g.kind === 'thermo' ? 'Cold is low, hot is high.' : 'The red line goes up when it gets hot.', W / 2, 126, 18, '#5a2a6e', 'center', 600);
      if (g.kind === 'thermo') {
        panel(80, 170, 260, 300, 24);
        emoji(g.pic[0], 210, 290, 130);
        text(cap(g.pic[1]), 210, 430, 22, '#5a2a6e', 'center', 700);
        g.choices.forEach((T, i) => {
          const x = 380 + i * 186 + shakeX(g, i), used = g.tried.includes(i) && i !== g.answer, right = yay && i === g.answer;
          button(`th:${i}`, x, 158, 168, 360, '', { color: right ? '#ffd23f' : used ? '#c9bcd4' : CARD[i], on: (g.state === 'pick' && !used) || right, key: String(i + 1) });
          thermo(x + 84, 206, 236, T * e, 20, 0.86, false);
        });
        return;
      }
      const ty = thermo(250, 196, 260, g.T * e, g.step, 1);
      if (g.missed || yay) {
        const y = ty(g.T);
        ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(240, y); ctx.stroke(); ctx.setLineDash([]);
        outlined('▶', 160 + Math.sin(S.t * 6) * 4, y, 22, '#ff6fb5');
      }
      const n = g.choices.length;
      g.choices.forEach((c, i) => {
        const used = g.tried.includes(i) && i !== g.answer, right = yay && i === g.answer, on = (g.state === 'pick' && !used) || right;
        const col = right ? '#ffd23f' : used ? '#c9bcd4' : null;
        if (g.kind === 'hotcold') {
          const x = 440 + i * 250 + shakeX(g, i);
          button(`th:${i}`, x, 210, 220, 240, '', { color: col || (i ? '#ff6a4a' : '#4fa8e0'), on, key: String(i + 1) });
          emoji(i ? '🔥' : '❄️', x + 110, 300, 96);
          outlined(i ? 'Hot' : 'Cold', x + 110, 400, 36, '#fff');
        } else if (g.kind === 'read') {
          const y = 180 + i * 104, x = 470 + shakeX(g, i);
          button(`th:${i}`, x, y, 380, 86, `${c}°F`, { color: col || CARD[i], on, size: 40, key: String(i + 1) });
        } else {
          const x = 410 + i * 180 + shakeX(g, i);
          button(`th:${i}`, x, 184, 164, 280, '', { color: col || CARD[i], on, key: String(i + 1) });
          rrect(x + 10, 194, 144, 200, 12, 'rgba(255,255,255,.88)');
          emoji(c[0], x + 82, 294, 92);
          const ln = wrap(cap(c[1]), 150, 17, 700);
          ln.forEach((l, k) => text(l, x + 82, 420 + k * 20 - (ln.length - 1) * 10, 17, '#fff', 'center', 700));
        }
      });
      if (n) drawCritter('Pengu the Penguin', 880, 530, 0.5, -1);
    },
  };

  restage('glacier', {
    bg: 'glacier_bg',
    games: [['floehop', 'rainbow', {}], ['thermoread', 'crystal', {}]],
    intro: ['N:Waddle waddle! The yummiest fish are on the far side of the water. Hop across the ice floes with me!',
      'N:Only hop when a floe is close. Splashing is c-c-cold!',
      'A:excited:Hop, hop, hop! Here I come!'],
    mid: ["N:Brrr! Is it cold or hot today? Let's read my thermometer together.", 'A:thinking:The red line goes up when it gets hot!'],
    outro: ['N:Aurora drops and ice crystals, just for you. Brrr-illiant!', "A:laughing:Thanks, Pengu! I'm warm all the way inside."],
  });

  // ===========================================================================
  // 5. MIDNIGHT MOON GARDEN — Hazel Hedgehog
  // ===========================================================================
  const moonflower = (x, y, r, ph = 0) => {
    const open = 0.75 + 0.25 * Math.sin(S.t * 1.2 + ph);
    glow(x, y, r * 2.6, '#cfe8ff', 0.45 + 0.15 * Math.sin(S.t * 2 + ph));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + ph;
      inkEllipse(x + Math.cos(a) * r * 0.62 * open, y + Math.sin(a) * r * 0.62 * open, r * 0.55, r * 0.32, a, '#f4f8ff', 1);
    }
    inkCircle(x, y, r * 0.3, '#ffe9a0', 1);
  };
  const topiary = (x, by, kind) => {
    inkRect(x - 22, by - 30, 44, 30, '#c8704a', 2, 4); inkRect(x - 26, by - 34, 52, 8, '#d8805a', 2, 3);
    inkRect(x - 4, by - 70, 8, 40, '#6a4a3a', 1.5, 2);
    const leaf = '#2f7a5a', hi = 'rgba(190,230,255,.25)';
    if (kind === 'ball') { inkCircle(x, by - 100, 40, leaf, 2); inkCircle(x, by - 158, 24, leaf, 2); ctx.fillStyle = hi; ellipse(x - 12, by - 114, 16, 10); ellipse(x - 6, by - 166, 9, 6); }
    else if (kind === 'cone') { for (let i = 0; i < 3; i++) { ink(P2(`M${x - 40 + i * 9},${by - 64 - i * 44} L${x},${by - 124 - i * 44} L${x + 40 - i * 9},${by - 64 - i * 44} Z`), leaf, 2); } ctx.fillStyle = hi; tri(x - 4, by - 196, x - 24, by - 156, x - 10, by - 156); }
    else { // a bunny
      inkCircle(x, by - 100, 38, leaf, 2); inkCircle(x + 22, by - 146, 22, leaf, 2);
      inkEllipse(x + 14, by - 182, 7, 22, -0.15, leaf, 2); inkEllipse(x + 32, by - 180, 7, 22, 0.25, leaf, 2);
      inkCircle(x - 38, by - 92, 12, '#3f9a6a', 1.5);
      ctx.fillStyle = hi; ellipse(x - 10, by - 116, 14, 9);
    }
  };
  const moth = (x, y, t, s = 1) => {
    const f = Math.abs(Math.sin(t * 16));
    ctx.fillStyle = 'rgba(240,230,255,.85)';
    ellipse(x - 7 * s, y - 2, 8 * s, 6 * s * (0.4 + f * 0.6), -0.4); ellipse(x + 7 * s, y - 2, 8 * s, 6 * s * (0.4 + f * 0.6), 0.4);
    ctx.fillStyle = '#8a7aa8'; ellipse(x, y, 2.5 * s, 6 * s);
  };
  const greenhouse = (x, by, w, h) => {
    glow(x + w / 2, by - h / 2, w * 0.8, '#9affc8', 0.35 + 0.08 * Math.sin(S.t * 1.5));
    const body = P2(`M${x},${by} L${x},${by - h} Q${x + w / 2},${by - h - w * 0.45} ${x + w},${by - h} L${x + w},${by} Z`);
    ctx.fillStyle = 'rgba(190,255,220,.5)'; ctx.fill(body);
    ctx.save(); ctx.clip(body);
    for (let i = 0; i < 5; i++) { const px = x + 20 + i * (w - 40) / 4; ctx.fillStyle = '#2f8a5a'; ellipse(px, by - 30, 18, 30); ctx.fillStyle = ['#ff8ad8', '#ffe36b', '#fff'][i % 3]; circle(px, by - 56, 5); }
    glow(x + w / 2, by - h * 0.6, w * 0.5, '#fff6c0', 0.5);
    ctx.restore();
    ctx.strokeStyle = '#e8f4ff'; ctx.lineWidth = 3; ctx.stroke(body);
    ctx.strokeStyle = 'rgba(232,244,255,.9)'; ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) { const px = x + i * w / 5; ctx.beginPath(); ctx.moveTo(px, by); ctx.lineTo(px, by - h - Math.sin(i / 5 * Math.PI) * w * 0.22); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x, by - h * 0.5); ctx.lineTo(x + w, by - h * 0.5); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(body);
  };
  BACKDROPS.moongarden_bg = () => {
    const t = S.t;
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#0c0a2e'); sky.addColorStop(0.6, '#281e60'); sky.addColorStop(1, '#4a3a84');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) star((i * 137) % W, 64 + (i * 71) % 230, 1.3 + (i % 3) * 0.8, `rgba(255,255,240,${0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + i))})`, 4);
    // a big silver full moon
    glow(700, 140, 150, '#e8f0ff', 0.45);
    inkCircle(700, 140, 56, '#f4f4ff', 1.5, '#c8c8ec');
    ctx.fillStyle = 'rgba(180,180,220,.45)'; circle(684, 126, 11); circle(718, 156, 8); circle(712, 120, 5); circle(686, 162, 6);
    // hedge wall with arches
    ctx.fillStyle = '#1f4a4a';
    ctx.beginPath(); ctx.moveTo(0, 420);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 300 + Math.sin(x * 0.2) * 5);
    ctx.lineTo(W, 420); ctx.fill();
    ctx.fillStyle = '#163838'; for (const x of [430, 840]) { ctx.beginPath(); ctx.moveTo(x - 40, 420); ctx.lineTo(x - 40, 350); ctx.arc(x, 350, 40, Math.PI, 0); ctx.lineTo(x + 40, 420); ctx.fill(); }
    ctx.fillStyle = 'rgba(190,230,255,.12)'; for (let i = 0; i < 30; i++) ellipse((i * 67) % W, 312 + (i * 23) % 80, 10, 5);
    // greenhouse, fountain and topiaries
    greenhouse(40, 420, 210, 120);
    topiary(350, 424, 'ball'); topiary(600, 424, 'cone'); topiary(870, 428, 'bunny');
    // the moon fountain
    const fx = 480, fy = 430;
    inkEllipse(fx, fy - 14, 76, 16, 0, '#b8c0dc', 2.5); inkRect(fx - 76, fy - 14, 152, 16, '#b8c0dc', 2.5, 6);
    ctx.fillStyle = '#8ab8e8'; ellipse(fx, fy - 16, 64, 10);
    inkRect(fx - 8, fy - 70, 16, 56, '#c8d0ec', 2, 3);
    inkEllipse(fx, fy - 70, 34, 8, 0, '#c8d0ec', 2);
    inkCircle(fx, fy - 94, 12, '#f4f4ff', 1.5); ctx.fillStyle = '#c8d0ec'; circle(fx + 6, fy - 98, 10);
    ctx.strokeStyle = 'rgba(220,240,255,.8)'; ctx.lineWidth = 2.5;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(fx + d * 28, fy - 72); ctx.quadraticCurveTo(fx + d * 50, fy - 80, fx + d * 56, fy - 18); ctx.stroke(); }
    for (let i = 0; i < 8; i++) { const k = (t * 0.8 + i / 8) % 1, d = i % 2 ? 1 : -1; ctx.fillStyle = 'rgba(230,245,255,.9)'; circle(fx + d * (28 + k * 28), fy - 74 - Math.sin(k * Math.PI) * 8 + k * 54, 2); }
    // the lawn and stepping stones
    const lg = ctx.createLinearGradient(0, 420, 0, H); lg.addColorStop(0, '#2a5a5a'); lg.addColorStop(1, '#1a3a44');
    ctx.fillStyle = lg; ctx.fillRect(0, 420, W, H - 420);
    ctx.strokeStyle = 'rgba(160,220,230,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 421); ctx.lineTo(W, 421); ctx.stroke();
    for (let i = 0; i < 9; i++) { const k = i / 8; inkEllipse(lerp(470, 490, k) + Math.sin(i * 1.7) * 30, 438 + k * 92, 22 + k * 18, 6 + k * 5, 0, '#8a90b0', 1.2); }
    ctx.strokeStyle = '#3f8a6a'; ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const x = (i * 97) % W, y = 440 + (i * 29) % 90; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 9); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 8); ctx.stroke(); }
    // silver moonflowers on little bushes
    for (const [x, y, ph] of [[40, 470, 0], [130, 492, 1], [370, 480, 2], [570, 486, 3], [630, 510, 4], [820, 478, 5], [915, 496, 6], [300, 520, 7]]) {
      inkEllipse(x, y + 10, 30, 14, 0, '#2a6a52', 1.5);
      moonflower(x - 10, y, 11, ph); moonflower(x + 12, y + 4, 9, ph + 2);
    }
    // moths round the moon flowers and lights, fireflies
    for (let i = 0; i < 5; i++) moth(140 + i * 180 + Math.sin(t * 0.9 + i * 2) * 40, 380 + Math.sin(t * 1.7 + i) * 30, t + i, 1);
    for (let i = 0; i < 14; i++) { const x = (i * 71 + Math.sin(t * 0.5 + i) * 50 + 1000) % W, y = 330 + Math.sin(t * 0.8 + i * 1.3) * 60 + (i % 4) * 25; glow(x, y, 10, '#e0ff9a', 0.4 + 0.4 * Math.sin(t * 3 + i)); }
  };

  // --- Hedgehog Roll: tilt the garden, collect moonflowers, drop into the burrow ----------------
  const HB = { x0: 110, y0: 78, x1: 850, y1: 526 };
  const HR = 18;
  const rectDist = (x, y, r) => Math.hypot(x - clamp(x, r.x, r.x + r.w), y - clamp(y, r.y, r.y + r.h));
  MG.hedgeroll = {
    kind: 'action', title: () => 'Hedgehog Roll', icon: () => '🦔',
    how: () => 'Tilt the garden with the arrows or the mouse to roll Hazel. Get every moonflower, then roll into the burrow. Miss the holes!',
    init(g) {
      const nH = [3, 5, 6][g.tier - 1], nF = [5, 6, 7][g.tier - 1], wx = [[480], [370, 600], [330, 630]][g.tier - 1];
      for (;;) {
        const start = { x: 168, y: rand(170, 440) }, home = { x: 796, y: rand(160, 450) };
        const flip = randInt(0, 1);
        const hedges = wx.map((x, i) => {
          const fromTop = (i + flip) % 2 === 0, h = rand(230, 270);
          return { x: x - 16, w: 32, y: fromTop ? HB.y0 : HB.y1 - h, h };
        });
        const holes = [], flowers = [];
        let tries = 0;
        while (holes.length < nH && tries++ < 3000) {
          const x = rand(HB.x0 + 50, HB.x1 - 50), y = rand(HB.y0 + 44, HB.y1 - 44);
          if (Math.hypot(x - start.x, y - start.y) < 120 || Math.hypot(x - home.x, y - home.y) < 100) continue;
          if (wx.some(w => Math.abs(x - w) < 100) || holes.some(h => Math.hypot(h.x - x, h.y - y) < 100)) continue;
          holes.push({ x, y, r: 27 });
        }
        while (flowers.length < nF && tries++ < 6000) {
          const x = rand(HB.x0 + 34, HB.x1 - 34), y = rand(HB.y0 + 34, HB.y1 - 34);
          if (holes.some(h => Math.hypot(h.x - x, h.y - y) < 76) || hedges.some(h => rectDist(x, y, h) < 36)) continue;
          if (Math.hypot(x - start.x, y - start.y) < 80 || Math.hypot(x - home.x, y - home.y) < 60 || flowers.some(f => Math.hypot(f.x - x, f.y - y) < 80)) continue;
          flowers.push({ x, y, got: false, ph: rand(0, 6) });
        }
        if (holes.length === nH && flowers.length === nF) { Object.assign(g, { start, home, hedges, holes, flowers }); break; }
      }
      Object.assign(g, { timeLeft: [70, 75, 80][g.tier - 1], bx: g.start.x, by: g.start.y, vx: 0, vy: 0, roll: 0, falls: 0, fall: 0, got: 0, homeT: 0, tx: 0, ty: 0, nag: 0 });
      g.say = 'Roll Hazel to the moonflowers, then into the burrow!';
    },
    start(g) { speak(g.say); },
    update(g, dt) {
      g.timeLeft -= dt; g.nag -= dt;
      let ax = 0, ay = 0, near = false;
      if (goLeft()) ax -= 1;
      if (goRight()) ax += 1;
      if (keys.arrowup || keys.w) ay -= 1;
      if (goDown()) ay += 1;
      if (ax || ay) { const d = Math.hypot(ax, ay); ax /= d; ay /= d; }
      else if (pointerMoved(g)) {
        const dx = pointer.x - g.bx, dy = pointer.y - g.by, d = Math.hypot(dx, dy);
        if (d > 8) { const k = Math.min(1, d / 150); ax = dx / d * k; ay = dy / d * k; }
        near = d < 70;
      }
      g.tx = lerp(g.tx, ax, Math.min(1, dt * 8)); g.ty = lerp(g.ty, ay, Math.min(1, dt * 8));
      if (g.homeT > 0) {
        g.bx = lerp(g.bx, g.home.x, Math.min(1, dt * 8)); g.by = lerp(g.by, g.home.y, Math.min(1, dt * 8));
        if ((g.homeT -= dt) <= 0) g.done = true;
      } else if (g.fall > 0) {
        g.bx = lerp(g.bx, g.fallAt.x, Math.min(1, dt * 10)); g.by = lerp(g.by, g.fallAt.y, Math.min(1, dt * 10));
        if ((g.fall -= dt) <= 0) { g.bx = g.start.x; g.by = g.start.y; g.vx = g.vy = 0; burst(g.bx, g.by, 12); }
      } else {
        g.vx += ax * 640 * dt; g.vy += ay * 640 * dt;
        const f = Math.exp(-(1.5 + (near ? 3 : 0)) * dt); g.vx *= f; g.vy *= f;
        const sp = Math.hypot(g.vx, g.vy); if (sp > 360) { g.vx *= 360 / sp; g.vy *= 360 / sp; }
        g.bx += g.vx * dt; g.by += g.vy * dt;
        g.roll += sp * dt / HR * Math.sign(g.vx || 1);
        if (g.bx < HB.x0 + HR) { g.bx = HB.x0 + HR; g.vx = Math.abs(g.vx) * 0.5; }
        if (g.bx > HB.x1 - HR) { g.bx = HB.x1 - HR; g.vx = -Math.abs(g.vx) * 0.5; }
        if (g.by < HB.y0 + HR) { g.by = HB.y0 + HR; g.vy = Math.abs(g.vy) * 0.5; }
        if (g.by > HB.y1 - HR) { g.by = HB.y1 - HR; g.vy = -Math.abs(g.vy) * 0.5; }
        for (const h of g.hedges) {
          const cx = clamp(g.bx, h.x, h.x + h.w), cy = clamp(g.by, h.y, h.y + h.h), dx = g.bx - cx, dy = g.by - cy, d = Math.hypot(dx, dy);
          if (d >= HR) continue;
          const nx = d ? dx / d : (g.bx < h.x + h.w / 2 ? -1 : 1), ny = d ? dy / d : 0;
          g.bx = cx + nx * HR; g.by = cy + ny * HR;
          const vn = g.vx * nx + g.vy * ny;
          if (vn < 0) { g.vx -= 1.5 * vn * nx; g.vy -= 1.5 * vn * ny; if (vn < -120) SFX.blip(); }
        }
        for (const fl of g.flowers) {
          if (fl.got || Math.hypot(fl.x - g.bx, fl.y - g.by) > HR + 18) continue;
          fl.got = true; g.got++; SFX.hit(); burst(fl.x, fl.y, 16, { colors: ['#f4f8ff', '#cfe8ff', '#fff6a8'] });
          if (g.got === g.flowers.length) { speak('All the moonflowers! Now roll into the burrow!'); SFX.sparkle(); }
        }
        const hole = g.holes.find(h => Math.hypot(h.x - g.bx, h.y - g.by) < h.r - 5);
        if (hole) {
          g.fall = 0.8; g.fallAt = hole; g.falls++; g.vx = g.vy = 0; SFX.miss(); tone(500, 0.5, 'sine', 0.06, 0, 120);
          if (g.falls === 1) speak('Oops! Down the hole. Roll around the holes!');
        }
        const dh = Math.hypot(g.home.x - g.bx, g.home.y - g.by);
        if (dh < 30) {
          if (g.got === g.flowers.length) { g.homeT = 1.3; g.home.done = true; SFX.fanfare(); burst(g.home.x, g.home.y, 30); speak('Home sweet home! Thank you!'); }
          else if (g.nag <= 0) { g.nag = 3; floatText(g.home.x, g.home.y - 50, 'Get all the flowers first!', '#fff6a8', false, 20); speak('Get all the moonflowers first!'); }
        }
      }
      g.progress = `Moonflowers: ${g.got} of ${g.flowers.length}`;
      g.score = clamp(0.65 * g.got / g.flowers.length + (g.home.done ? 0.35 : 0) - 0.06 * g.falls, 0, 1);
      if (g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      const t = S.t, ox = g.tx * 6, oy = g.ty * 6;
      // board shadow shifts as the garden tilts
      ctx.fillStyle = 'rgba(10,10,40,.45)'; ctx.beginPath(); ctx.roundRect(HB.x0 - 16 - ox, HB.y0 - 16 - oy + 8, HB.x1 - HB.x0 + 32, HB.y1 - HB.y0 + 32, 22); ctx.fill();
      inkRect(HB.x0 - 16, HB.y0 - 16, HB.x1 - HB.x0 + 32, HB.y1 - HB.y0 + 32, '#8a5a3a', 3, 22);
      ctx.fillStyle = '#a0683a'; ctx.fillRect(HB.x0 - 10, HB.y0 - 12, HB.x1 - HB.x0 + 20, 4);
      const lg = ctx.createLinearGradient(0, HB.y0, 0, HB.y1); lg.addColorStop(0, '#3a7a68'); lg.addColorStop(1, '#2a5e56');
      ctx.fillStyle = lg; ctx.fillRect(HB.x0, HB.y0, HB.x1 - HB.x0, HB.y1 - HB.y0);
      ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let x = HB.x0; x < HB.x1; x += 80) ctx.fillRect(x, HB.y0, 40, HB.y1 - HB.y0);
      ctx.strokeStyle = 'rgba(150,220,190,.35)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 60; i++) { const x = HB.x0 + 10 + (i * 97) % (HB.x1 - HB.x0 - 20), y = HB.y0 + 10 + (i * 53) % (HB.y1 - HB.y0 - 20); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 6); ctx.moveTo(x + 3, y); ctx.lineTo(x + 4, y - 5); ctx.stroke(); }
      // start pad
      ctx.strokeStyle = 'rgba(255,246,168,.5)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.start.x, g.start.y, 28, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // holes
      for (const h of g.holes) {
        inkEllipse(h.x, h.y, h.r + 6, h.r + 4, 0, '#6a4a3a', 1.5);
        const hg = ctx.createRadialGradient(h.x, h.y + 4, 2, h.x, h.y, h.r); hg.addColorStop(0, '#05030a'); hg.addColorStop(1, '#2a1a20');
        ctx.fillStyle = hg; circle(h.x, h.y, h.r);
      }
      // the burrow
      const all = g.got === g.flowers.length, hx = g.home.x, hy = g.home.y;
      if (all) glow(hx, hy, 70, '#fff3a0', 0.6 + 0.2 * Math.sin(t * 4));
      inkEllipse(hx, hy + 6, 46, 34, 0, '#8a5a3a', 2);
      ctx.fillStyle = '#6a4228'; ellipse(hx, hy + 14, 40, 22);
      inkEllipse(hx, hy + 2, 26, 20, 0, all ? '#2a1408' : '#4a2e1a', 1.5);
      if (!all) { inkRect(hx - 22, hy - 10, 44, 24, '#c8904a', 1.5, 4); text(`${g.flowers.length - g.got} 🌼`, hx, hy + 2, 15, '#5a2a0a', 'center', 800); }
      text('Burrow', hx, hy + 52, 15, '#fff6a8', 'center', 700);
      // hedges
      for (const h of g.hedges) {
        ctx.fillStyle = 'rgba(10,20,30,.35)'; ctx.fillRect(h.x + 6, h.y + 6, h.w, h.h);
        inkRect(h.x, h.y, h.w, h.h, '#2a6a3a', 2, 12);
        ctx.fillStyle = '#3a8a4a'; for (let y = h.y + 14; y < h.y + h.h - 6; y += 22) { circle(h.x + 10, y, 9); circle(h.x + h.w - 10, y + 11, 9); }
        ctx.fillStyle = 'rgba(200,255,220,.25)'; for (let y = h.y + 12; y < h.y + h.h; y += 30) circle(h.x + 9, y, 3);
      }
      for (const fl of g.flowers) if (!fl.got) moonflower(fl.x, fl.y + Math.sin(t * 2 + fl.ph) * 2, 15, fl.ph);
      // Hazel rolled up into a spiky ball
      let s = 1;
      if (g.fall > 0) s = g.fall / 0.8;
      if (g.homeT > 0) s = Math.max(0, g.homeT / 1.3);
      if (s > 0.02) {
        ctx.save(); ctx.translate(g.bx, g.by); ctx.scale(s, s);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ellipse(4, 14, 18, 7);
        ctx.rotate(g.roll);
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ink(P2(`M${Math.cos(a - 0.22) * 14},${Math.sin(a - 0.22) * 14} L${Math.cos(a) * 25},${Math.sin(a) * 25} L${Math.cos(a + 0.22) * 14},${Math.sin(a + 0.22) * 14} Z`), '#7a4a2a', 1); }
        inkCircle(0, 0, 17, '#a8704a', 1.5);
        ctx.rotate(-g.roll);
        inkCircle(0, 4, 10, '#f8e0c8', 1);
        ctx.fillStyle = '#2a1a0a'; circle(-4, 2, 2); circle(4, 2, 2); circle(0, 7, 2.4);
        ctx.fillStyle = 'rgba(255,120,150,.5)'; circle(-7, 7, 2.2); circle(7, 7, 2.2);
        ctx.restore();
      }
      // tilt arrow in the corner
      if (Math.hypot(g.tx, g.ty) > 0.1) {
        const cx = HB.x1 - 40, cy = HB.y0 + 34, a = Math.atan2(g.ty, g.tx);
        inkCircle(cx, cy, 22, 'rgba(255,255,255,.75)', 1.5);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ink(P2('M-12,-5 L4,-5 L4,-11 L15,0 L4,11 L4,5 L-12,5 Z'), '#ff6fb5', 1.2); ctx.restore();
      }
    },
  };

  // --- Plant Parts: drag the labels onto the plant diagram -----------------------------------------
  const PARTS = {
    flower: { col: '#ff6fb5', fact: 'The flower! It makes the seeds, and bees love to visit it.', q: 'Which part do bees love to visit?' },
    seeds: { col: '#c98a3a', fact: 'Seeds! Each seed can grow into a brand new plant.', q: 'Which part can grow into a new plant?' },
    leaves: { col: '#3fbf6a', fact: 'Leaves! They catch the sunlight to make food for the plant.', q: 'Which part catches the sunlight?' },
    stem: { col: '#7ab83a', fact: 'The stem! It holds the plant up tall and carries water to the leaves.', q: 'Which part holds the plant up tall?' },
    roots: { col: '#a0683a', fact: 'Roots! They grow under the ground and drink up water.', q: 'Which part drinks water from the soil?' },
  };
  // label slot centre and the spot on the plant it points to
  const PP_SLOTS = { flower: [790, 112, 640, 148], seeds: [830, 214, 728, 216], leaves: [810, 330, 690, 330], stem: [392, 252, 588, 268], roots: [392, 470, 560, 470] };
  const SL_W = 150, SL_H = 46, CH_W = 168, CH_H = 52;
  MG.plantparts = {
    kind: 'learn', title: () => 'Plant Parts', icon: () => '🌱',
    how: () => 'Every part of a plant has a job! Drag each word onto the right part, or tap a word and then its box.',
    init(g) {
      const parts = g.tier === 1 ? ['flower', 'leaves', 'stem', 'roots'] : ['flower', 'seeds', 'leaves', 'stem', 'roots'];
      const order = shuffle(parts.slice());
      g.chips = order.map((p, i) => ({ part: p, hx: 120, hy: 130 + i * 74, x: 120, y: 130 + i * 74, placed: false, miss: 0 }));
      Object.assign(g, { parts, placed: {}, pts: 0, nQuiz: [0, 2, 3][g.tier - 1], quiz: [], qi: 0, qtried: [], state: 'label', t2: 0, drag: null, sel: null, shake: {} });
      g.quiz = shuffle(parts.slice()).slice(0, g.nQuiz);
      g.say = 'Drag each word to the right part of the plant.';
    },
    start(g) { speak(g.say); },
    slotAt(g, x, y) { return g.parts.find(p => !g.placed[p] && Math.abs(x - PP_SLOTS[p][0]) < SL_W / 2 + 10 && Math.abs(y - PP_SLOTS[p][1]) < SL_H / 2 + 12); },
    drop(g, c, p) {
      g.sel = null;
      if (c.part === p) {
        c.placed = true; g.placed[p] = true; g.pts += [1, 0.6, 0.3][Math.min(2, c.miss)];
        SFX.hit(); burst(PP_SLOTS[p][0], PP_SLOTS[p][1], 18, { colors: [PARTS[p].col, '#fff6a8', '#ffffff'] });
        speak(PARTS[p].fact);
        if (g.parts.every(q => g.placed[q])) { g.state = 'wait'; g.t2 = 3.4; }
      } else {
        c.miss++; g.shake[c.part] = 0.4; SFX.miss();
        speak(`That box is not the ${c.part}. Try another one!`);
      }
    },
    update(g, dt, id) {
      tickShake(g, dt);
      for (const c of g.chips) {
        if (c === g.drag) continue;
        const [tx, ty] = c.placed ? PP_SLOTS[c.part] : [c.hx, c.hy];
        c.x = lerp(c.x, tx, Math.min(1, dt * 12)); c.y = lerp(c.y, ty, Math.min(1, dt * 12));
      }
      if (g.state === 'label') {
        const free = g.chips.filter(c => !c.placed);
        const k = numKey(g.chips.length);
        if (k >= 0 && !g.chips[k].placed) { g.sel = g.chips[k]; speak(g.sel.part); }
        if (pointer.clicked) {
          const c = free.find(c => Math.abs(pointer.x - c.x) < CH_W / 2 && Math.abs(pointer.y - c.y) < CH_H / 2);
          if (c) { g.drag = c; g.off = [c.x - pointer.x, c.y - pointer.y]; g.from = [pointer.x, pointer.y]; g.moved = false; if (g.sel !== c) speak(c.part); g.sel = c; }
          else if (g.sel) { const p = this.slotAt(g, pointer.x, pointer.y); if (p) this.drop(g, g.sel, p); }
        }
        if (g.drag) {
          if (pointer.down) {
            g.drag.x = pointer.x + g.off[0]; g.drag.y = pointer.y + g.off[1];
            if (Math.hypot(pointer.x - g.from[0], pointer.y - g.from[1]) > 12) g.moved = true;
          } else {
            const c = g.drag; g.drag = null;
            if (g.moved) { const p = this.slotAt(g, c.x, c.y) || this.slotAt(g, pointer.x, pointer.y); if (p) this.drop(g, c, p); else g.sel = null; }
          }
        }
      } else if (g.state === 'wait') {
        if ((g.t2 -= dt) <= 0) {
          if (g.nQuiz) { g.state = 'quiz'; g.qi = 0; g.qtried = []; g.say = PARTS[g.quiz[0]].q; speak(`Quiz time! ${g.say} Tap the label.`); }
          else g.done = true;
        }
      } else if (g.state === 'quiz') {
        const p = id?.startsWith('pp:') ? id.slice(3) : null;
        if (p && !g.qtried.includes(p)) {
          g.qtried.push(p);
          const ans = g.quiz[g.qi];
          if (p === ans) {
            g.pts += [1, 0.5, 0.2, 0, 0][g.qtried.length - 1]; SFX.sparkle(); burst(PP_SLOTS[p][0], PP_SLOTS[p][1], 20);
            speak(`Yes! The ${p}!`); g.state = 'qyay'; g.t2 = 1.8;
          } else { g.shake['q' + p] = 0.4; SFX.miss(); speak('Not that one. Try again!'); }
        }
      } else if (g.state === 'qyay') {
        if ((g.t2 -= dt) <= 0) {
          if (g.qi + 1 >= g.nQuiz) g.done = true;
          else { g.qi++; g.state = 'quiz'; g.qtried = []; g.say = PARTS[g.quiz[g.qi]].q; speak(g.say); }
        }
      }
      const n = g.parts.length + g.nQuiz;
      g.progress = g.state === 'quiz' || g.state === 'qyay' ? `Question ${g.qi + 1} of ${g.nQuiz}` : `Labels: ${g.parts.filter(p => g.placed[p]).length} of ${g.parts.length}`;
      g.score = g.pts / n;
    },
    drawPlant(g) {
      const t = S.t, cx = 590, soil = 410;
      // diagram card: night sky above, soil below
      ctx.save(); ctx.beginPath(); ctx.roundRect(250, 66, 696, 466, 24); ctx.clip();
      const sk = ctx.createLinearGradient(0, 66, 0, soil); sk.addColorStop(0, '#d8e8ff'); sk.addColorStop(1, '#f2f8ff');
      ctx.fillStyle = sk; ctx.fillRect(250, 66, 696, soil - 66);
      const sg = ctx.createLinearGradient(0, soil, 0, 532); sg.addColorStop(0, '#9a6a44'); sg.addColorStop(1, '#6a4428');
      ctx.fillStyle = sg; ctx.fillRect(250, soil, 696, 532 - soil);
      ctx.fillStyle = '#5aa84a'; ctx.fillRect(250, soil - 6, 696, 10);
      for (let i = 0; i < 18; i++) inkEllipse(270 + (i * 113) % 660, soil + 30 + (i * 47) % 90, 6 + (i % 3) * 2, 4, 0, ['#b88a64', '#8a5a3a', '#c8a07a'][i % 3], 1);
      emoji('🪱', 880, 500, 26); emoji('☀️', 300, 110, 44);
      ctx.restore();
      rrect(250, 66, 696, 466, 24, null, '#e2c6f5', 3);
      // roots
      ctx.strokeStyle = OL; ctx.lineCap = 'round';
      const roots = [[[cx, soil], [cx - 4, soil + 50], [cx - 30, soil + 90]], [[cx, soil], [cx + 10, soil + 46], [cx + 40, soil + 96]], [[cx - 4, soil + 50], [cx - 52, soil + 66]], [[cx + 10, soil + 46], [cx + 58, soil + 62]], [[cx, soil], [cx + 2, soil + 70], [cx - 6, soil + 106]]];
      for (const r of roots) inkLine(r, 5, '#e8c89a', 1.5);
      // stem
      const stem = P2(`M${cx},${soil} C${cx - 14},${soil - 90} ${cx + 18},${soil - 180} ${cx + 6},${soil - 250}`);
      inkCurve(stem, 10, '#5ab84a', 2);
      // leaves
      ink(P2(`M${cx - 2},${soil - 76} C${cx - 40},${soil - 120} ${cx - 90},${soil - 100} ${cx - 104},${soil - 70} C${cx - 70},${soil - 56} ${cx - 30},${soil - 58} ${cx - 2},${soil - 76} Z`), '#4fc86a', 1.6);
      ink(P2(`M${cx + 6},${soil - 120} C${cx + 40},${soil - 150} ${cx + 90},${soil - 112} ${cx + 100},${soil - 80} C${cx + 64},${soil - 72} ${cx + 30},${soil - 90} ${cx + 6},${soil - 120} Z`), '#3fb85a', 1.6);
      ctx.strokeStyle = 'rgba(30,90,40,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 2, soil - 76); ctx.quadraticCurveTo(cx - 50, soil - 90, cx - 100, soil - 72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 6, soil - 120); ctx.quadraticCurveTo(cx + 50, soil - 116, cx + 96, soil - 82); ctx.stroke();
      // seeds: a fluffy seed head on a side stem, with seeds floating away
      if (g.parts.includes('seeds')) {
        inkCurve(P2(`M${cx + 6},${soil - 180} Q${cx + 70},${soil - 190} ${cx + 132},${soil - 194}`), 5, '#5ab84a', 1.5);
        const sx = cx + 138, sy = soil - 194;
        ctx.strokeStyle = 'rgba(120,110,140,.7)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * 24, sy + Math.sin(a) * 24); ctx.stroke(); ctx.fillStyle = '#fff'; circle(sx + Math.cos(a) * 25, sy + Math.sin(a) * 25, 3); }
        inkCircle(sx, sy, 7, '#a0703a', 1.2);
        for (let i = 0; i < 3; i++) { const k = (t * 0.25 + i / 3) % 1, fx = sx + 6 + k * 26 + Math.sin(t * 2 + i) * 6, fy = sy - 16 - k * 46; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#8a7a9a'; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + 10); ctx.stroke(); ctx.fillStyle = '#fff'; circle(fx, fy, 4); ctx.fillStyle = '#a0703a'; ellipse(fx, fy + 11, 2, 3); ctx.globalAlpha = 1; }
      }
      // the flower
      const fx = cx + 6, fy = soil - 262;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.sin(t) * 0.05; inkEllipse(fx + Math.cos(a) * 26, fy + Math.sin(a) * 26, 22, 12, a, '#ff8ac4', 1.4); }
      inkCircle(fx, fy, 16, '#ffd23f', 1.5);
      ctx.fillStyle = '#e8a020'; for (let i = 0; i < 6; i++) circle(fx + Math.cos(i) * 7, fy + Math.sin(i * 1.3) * 7, 2);
      emoji('🐝', fx + 62 + Math.sin(t * 2) * 10, fy - 30 + Math.sin(t * 5) * 5, 24);
    },
    draw(g) {
      this.drawPlant(g);
      const quiz = g.state === 'quiz' || g.state === 'qyay';
      // the label boxes and their pointer lines
      for (const p of g.parts) {
        const [sx, sy, px, py] = PP_SLOTS[p], done = g.placed[p];
        ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx + (px < sx ? -SL_W / 2 : SL_W / 2), sy); ctx.lineTo(px, py); ctx.stroke();
        inkCircle(px, py, 5, '#fff6a8', 1.2);
        if (quiz) {
          const used = g.qtried.includes(p) && p !== g.quiz[g.qi], right = g.state === 'qyay' && p === g.quiz[g.qi];
          const dx = g.shake['q' + p] ? Math.sin(g.shake['q' + p] * 50) * 6 : 0;
          button(`pp:${p}`, sx - SL_W / 2 + dx, sy - SL_H / 2, SL_W, SL_H, p, { color: right ? '#ffd23f' : used ? '#c9bcd4' : PARTS[p].col, on: g.state === 'quiz' && !used || right, size: 22 });
        } else if (!done) {
          const hot = g.drag && this.slotAt(g, g.drag.x, g.drag.y) === p;
          rrect(sx - SL_W / 2, sy - SL_H / 2, SL_W, SL_H, 14, hot ? 'rgba(255,246,168,.95)' : 'rgba(255,255,255,.85)');
          ctx.setLineDash([7, 5]); rrect(sx - SL_W / 2, sy - SL_H / 2, SL_W, SL_H, 14, null, g.sel ? '#ff6fb5' : '#9a7aaa', 3); ctx.setLineDash([]);
          text('?', sx, sy, 22, '#9a7aaa', 'center', 800);
        }
      }
      if (!quiz) {
        darkPanel(22, 92, 196, 56 + g.chips.length * 74, 20);
        text('Words', 120, 106, 15, '#fff6a8', 'center', 700);
        const order = g.chips.filter(c => c !== g.drag).concat(g.drag ? [g.drag] : []);
        for (const c of order) {
          const x = c.x + (g.shake[c.part] ? Math.sin(g.shake[c.part] * 50) * 6 : 0), y = c.y, w = c.placed ? SL_W : CH_W, h = c.placed ? SL_H : CH_H;
          ctx.save(); if (c === g.drag) { ctx.shadowColor = 'rgba(40,10,60,.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; }
          rrect(x - w / 2, y - h / 2, w, h, 16, PARTS[c.part].col);
          ctx.restore();
          rrect(x - w / 2, y - h / 2, w, h, 16, null, g.sel === c ? '#fff6a8' : 'rgba(255,255,255,.9)', g.sel === c ? 5 : 2.5);
          outlined(c.part, x, y, 24, '#fff');
          if (!c.placed) text(String(g.chips.indexOf(c) + 1), x - w / 2 + 14, y, 12, 'rgba(255,255,255,.75)', 'center', 700);
        }
      } else {
        panel(22, 160, 210, 210, 20);
        const ln = wrap(PARTS[g.quiz[g.qi]].q, 180, 22, 700);
        ln.forEach((l, i) => text(l, 127, 220 + i * 30, 22, '#5a2a6e', 'center', 700));
        text('Tap the label!', 127, 340, 16, '#9a7aaa', 'center', 600);
      }
      if (g.state === 'wait') outlined('Great labelling!', 590, 300, 34, '#fff6a8');
    },
  };

  restage('moongarden', {
    bg: 'moongarden_bg',
    games: [['hedgeroll', 'moonbeam', {}], ['plantparts', 'silk', {}]],
    intro: ['*:This garden only blooms at midnight. Silver moonflowers glow in the dark.',
      'N:Hello! I roll up into a ball to get around. Tilt my garden to roll me to the moonflowers, then home to my burrow!',
      'A:excited:Roll, Hazel, roll!'],
    mid: ['N:Thank you! Now, can you help me label my plant chart? Every part of a plant has a job.', 'A:focused:Roots, stem, leaves... I know this!'],
    outro: ['N:Moonbeams and moth-silk, for the cleverest gardener. Sweet dreams!', 'A:happy:Goodnight, Hazel!'],
  });
}
