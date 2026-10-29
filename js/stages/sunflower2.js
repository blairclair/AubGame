'use strict';
// Sunflower Field game 2: the Sunflower Maze (learn). A three-quarter view that follows Aubrey
// through a field of sunflowers taller than she is, so she only sees the paths right around her.
// Clue cards send her from landmark to landmark ("Go NORTH, then EAST to the pumpkin patch").
// Every sunflower faces the sun in the EAST; a compass rose and wooden signposts back that up.
// Lookout towers give a short bird's-eye peek at the maze nearby. Seeds mark where she has been.
{
  // tiles: odd columns/rows are paths (wide and deep), even ones are rows of sunflowers (narrow).
  // Paths are deeper than the flowers are tall, so a row of flowers in front never hides the path behind it.
  const WW = 56, PW = 120, WH = 48, PH = 128, PX = WW + PW, PY = WH + PH, FOOT = 46;
  const colX = tx => Math.floor(tx / 2) * PX + (tx % 2 ? WW : 0), colW = tx => (tx % 2 ? PW : WW);
  const rowY = ty => Math.floor(ty / 2) * PY + (ty % 2 ? WH : 0), rowH = ty => (ty % 2 ? PH : WH);
  const DIRS = [
    { k: 'N', dx: 0, dy: -1, bit: 1, back: 4 }, { k: 'E', dx: 1, dy: 0, bit: 2, back: 8 },
    { k: 'S', dx: 0, dy: 1, bit: 4, back: 1 }, { k: 'W', dx: -1, dy: 0, bit: 8, back: 2 },
  ];
  const DIR = Object.fromEntries(DIRS.map(d => [d.k, d]));
  const WORD = { N: 'NORTH', E: 'EAST', S: 'SOUTH', W: 'WEST' };
  const WORD1 = { N: 'UP', E: 'RIGHT', S: 'DOWN', W: 'LEFT' };
  const ARROW = { N: '⬆️', E: '➡️', S: '⬇️', W: '⬅️' };
  const DCOL = { N: '#3a8ef0', E: '#ff8a1a', S: '#22a866', W: '#b052e0' };
  const LM = {
    scarecrow: 'the scarecrow', tractor: 'the tractor', well: 'the well',
    hive: 'the bee hive', pumpkins: 'the pumpkin patch', picnic: "Scamper's picnic", gate: 'the farm gate',
  };
  const word = (g, k) => (g.tier === 1 ? WORD1 : WORD)[k];
  const key = (x, y) => x + ',' + y;

  // ------------------------------------------------------------------ sprites
  // like sprite(), but not cached: each maze paints its own ground
  function paintOnce(w, h, ox, oy, fn) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * DPR); c.height = Math.ceil(h * DPR);
    const g = c.getContext('2d');
    g.scale(DPR, DPR); g.translate(ox, oy); g.lineJoin = 'round'; g.lineCap = 'round';
    const screen = ctx; ctx = g;
    try { fn(); } finally { ctx = screen; }
    return { c, w, h, ox, oy };
  }
  // a sunflower head turned three-quarters to face the sun on the right
  const headSprite = v => sprite('sfm_head' + v, 76, 76, 38, 38, () => {
    const r = 26, sx = 0.78, cols = [['#ffd21f', '#ffb000'], ['#ffc61a', '#ff9a1a'], ['#ffe04a', '#ffc21f']][v];
    // green sepals peeking out behind, on the shady (west) side
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * 0.55 + i * 0.16;
      ctx.save(); ctx.translate(Math.cos(a) * r * 0.85 * sx - 3, Math.sin(a) * r * 0.85); ctx.rotate(a);
      inkEllipse(0, 0, 9, 4, 0, '#5aa83a', 1.2); ctx.restore();
    }
    const petals = (rr, w, n, off) => {
      const p = new Path2D();
      for (let i = 0; i < n; i++) {
        const a = off + i * Math.PI * 2 / n;
        const pp = new Path2D(); pp.ellipse(Math.cos(a) * rr * sx, Math.sin(a) * rr, rr * 0.5 * (0.7 + 0.3 * Math.abs(Math.sin(a))), w, a, 0, Math.PI * 2);
        p.addPath(pp);
      }
      return p;
    };
    const back = petals(r * 0.78, 6.2, 13, 0.24), front = petals(r * 0.7, 5.6, 13, 0);
    ctx.strokeStyle = OL; ctx.lineWidth = 3.2; ctx.stroke(back); ctx.fillStyle = cols[1]; ctx.fill(back);
    ctx.stroke(front); ctx.fillStyle = cols[0]; ctx.fill(front);
    // the seedy middle, nudged east because the flower looks toward the sun
    const g = ctx.createRadialGradient(4, -3, 1, 4, 0, 15);
    g.addColorStop(0, '#9a5a28'); g.addColorStop(1, '#4a2410');
    inkEllipse(4, 0, 12.5, 14.5, 0, g, 1.4);
    ctx.fillStyle = 'rgba(255,214,120,.55)';
    for (let i = 0; i < 16; i++) { const a = i * 2.4, d = Math.sqrt(i / 16) * 10; circle(4 + Math.cos(a) * d * 0.85, Math.sin(a) * d, 1.1); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(0, -7, 4, 2.5, -0.4);
  });
  // a sunflower seen from high above (for the lookout map)
  const topSprite = () => sprite('sfm_top', 30, 30, 15, 15, () => {
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; ctx.fillStyle = i % 2 ? '#ffb000' : '#ffd21f'; ellipse(Math.cos(a) * 8, Math.sin(a) * 8, 6, 3.2, a); }
    ctx.fillStyle = '#6a3414'; circle(0, 0, 6);
  });
  // the far field above the tall flowers: a sea of sunflower heads and big leaves, tiled
  let canopyPat = null;
  const canopy = () => {
    if (canopyPat) return canopyPat;
    const s = sprite('sfm_canopy', 240, 180, 0, 0, () => {
      ctx.fillStyle = '#356b22'; ctx.fillRect(0, 0, 240, 180);
      const R = (i => () => { i = (i * 16807) % 2147483647; return i / 2147483647; })(7);
      for (let i = 0; i < 26; i++) {
        const x = R() * 240, y = R() * 180;
        for (const ox of [-240, 0, 240]) for (const oy of [-180, 0, 180]) { ctx.fillStyle = i % 2 ? '#2d5c1c' : '#427c2a'; ellipse(x + ox, y + oy, 30, 13, R() * 3); }
      }
      for (let row = 0; row < 4; row++) for (let i = 0; i < 5; i++) {
        const x = i * 48 + (row % 2) * 24 + 12, y = row * 45 + 20, sc = 0.62 + ((i * 7 + row * 3) % 5) * 0.05;
        for (const ox of [-240, 0, 240]) for (const oy of [-180, 0, 180]) {
          ctx.save(); ctx.translate(x + ox, y + oy); ctx.scale(sc, sc); blit(headSprite((i + row) % 3), 0, 0); ctx.restore();
        }
      }
      // in shadow and far away: darker and softer than the flowers close by
      ctx.fillStyle = 'rgba(28,60,16,.42)'; ctx.fillRect(0, 0, 240, 180);
    });
    canopyPat = { s };
    return canopyPat;
  };

  // ------------------------------------------------------------------ landmarks (drawn standing at x, gy)
  function drawLandmark(k, x, gy, s = 1, t = S.t) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(40,30,10,.25)'; ellipse(0, 0, 40, 9);
    if (k === 'scarecrow') {
      inkRect(-4, -96, 8, 96, '#9a6a3a', 1.6, 2);
      inkRect(-38, -70, 76, 8, '#9a6a3a', 1.6, 3);
      const sw = Math.sin(t * 2) * 2;
      ink(P2(`M-24,-72 L24,-72 L20,-28 L-20,-28 Z`), '#e8504a', 1.6);
      ctx.strokeStyle = 'rgba(120,20,30,.5)'; ctx.lineWidth = 2;
      for (const xx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(xx, -72); ctx.lineTo(xx * 0.85, -28); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-22, -52); ctx.lineTo(22, -52); ctx.stroke();
      for (const sx of [-1, 1]) { ctx.fillStyle = '#ffd84a'; tri(sx * 38, -72, sx * (46 + sw), -60, sx * 36, -62); }
      ctx.fillStyle = '#ffd84a'; tri(-14, -28, -8, -16, -2, -28); tri(2, -28, 8, -15, 14, -28);
      inkCircle(0, -86, 15, '#f2d6a0', 1.6);
      ctx.fillStyle = OL; circle(-5, -88, 2); circle(5, -88, 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -84, 6, 0.3, Math.PI - 0.3); ctx.stroke();
      ink(P2('M-26,-96 Q0,-104 26,-96 L18,-99 Q14,-122 0,-120 Q-14,-122 -18,-99 Z'), '#c8963a', 1.6);
      ctx.fillStyle = '#e8504a'; ctx.fillRect(-16, -103, 32, 4);
    } else if (k === 'tractor') {
      emoji('🚜', 0, -38, 80);
    } else if (k === 'well') {
      inkRect(-30, -96, 6, 60, '#8a5a32', 1.4, 2); inkRect(24, -96, 6, 60, '#8a5a32', 1.4, 2);
      ink(P2('M-42,-92 L0,-118 L42,-92 Z'), '#d0503a', 1.8);
      ctx.strokeStyle = '#8a7060'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -94); ctx.lineTo(0, -66); ctx.stroke();
      inkRect(-7, -68, 14, 12, '#a8784a', 1.2, 2);
      ink(P2('M-34,-36 L-34,-4 Q0,8 34,-4 L34,-36 Z'), '#b8b0b8', 1.8);
      ctx.strokeStyle = 'rgba(90,70,110,.45)'; ctx.lineWidth = 1.5;
      for (const yy of [-26, -15]) { ctx.beginPath(); ctx.moveTo(-34, yy); ctx.quadraticCurveTo(0, yy + 10, 34, yy); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-24 + i * 16, -24 + (i % 2) * 11); ctx.lineTo(-24 + i * 16, -14 + (i % 2) * 11); ctx.stroke(); }
      inkEllipse(0, -36, 34, 9, 0, '#d8d0d8', 1.8);
      ctx.fillStyle = '#3a6ab0'; ellipse(0, -35, 27, 6);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-8, -36, 7, 1.6);
    } else if (k === 'hive') {
      inkRect(-30, -12, 60, 12, '#8a5a32', 1.4, 2);
      for (let i = 0; i < 5; i++) { const w = 30 - i * 4.5 - (i > 2 ? (i - 2) * 3 : 0); inkEllipse(0, -20 - i * 12, w, 9, 0, i % 2 ? '#e8b440' : '#f4c856', 1.5); }
      inkEllipse(0, -80, 8, 6, 0, '#e8b440', 1.4);
      inkEllipse(0, -20, 8, 7, 0, '#4a2a18', 1.2);
      for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; emoji('🐝', Math.cos(a) * 34, -60 + Math.sin(a * 1.3) * 20, 16); }
    } else if (k === 'pumpkins') {
      ctx.strokeStyle = '#3f8a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-44, -6); ctx.bezierCurveTo(-20, -20, 10, 6, 44, -10); ctx.stroke();
      inkEllipse(-34, -14, 10, 6, 0.5, '#5ab03a', 1.1); inkEllipse(36, -16, 10, 6, -0.5, '#5ab03a', 1.1);
      const pump = (px, py, r) => {
        for (const o of [-0.55, 0.55, 0]) inkEllipse(px + o * r, py - r * 0.8, r * (o ? 0.6 : 0.62), r * 0.8, 0, o ? '#f07a1a' : '#ff9a2a', 1.4);
        inkRect(px - 2.5, py - r * 1.75, 5, r * 0.32, '#5a7a2a', 1.1, 2);
      };
      pump(-18, -4, 18); pump(20, -2, 22); pump(0, 6, 14);
    } else if (k === 'picnic') {
      ctx.save(); ctx.scale(1, 0.42);
      inkEllipse(0, -18, 50, 40, 0, '#ffffff', 1.8);
      ctx.beginPath(); ctx.ellipse(0, -18, 50, 40, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#ff5a6e';
      for (let i = -6; i < 6; i++) for (let j = -5; j < 5; j++) if ((i + j) % 2 === 0) ctx.fillRect(i * 12, -18 + j * 12, 12, 12);
      ctx.restore();
      emoji('🧺', -16, -22, 30); emoji('🍎', 16, -12, 16); emoji('🥪', 26, -4, 16);
      drawCritter('Scamper Squirrel', 36, -2, 0.42, -1);
    } else if (k === 'gate') {
      for (const px of [-40, 40]) inkRect(px - 5, -62, 10, 62, '#9a6a3a', 1.6, 2);
      for (const yy of [-50, -30]) inkRect(-36, yy, 72, 8, '#c8945a', 1.4, 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-35, -24); ctx.lineTo(35, -46); ctx.stroke();
      ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 4; ctx.stroke();
      inkRect(-30, -86, 60, 22, '#f4e0b0', 1.4, 4);
      text('START', 0, -75, 13, '#7a4a2a', 'center', 800);
    }
    ctx.restore();
  }
  // a wooden lookout tower with a ladder (Aubrey stands on top at height LOOK_H when she climbs)
  const LOOK_H = 104;
  function drawLookout(x, gy, glow) {
    if (glow) { const gr = ctx.createRadialGradient(x, gy - 50, 4, x, gy - 50, 80); gr.addColorStop(0, 'rgba(255,240,150,.55)'); gr.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 80, gy - 130, 160, 160); }
    ctx.fillStyle = 'rgba(40,30,10,.25)'; ellipse(x, gy, 40, 9);
    ctx.strokeStyle = OL; ctx.lineWidth = 7;
    const legs = [[-30, -22], [30, 22]];
    for (const [b, tp] of legs) { ctx.beginPath(); ctx.moveTo(x + b, gy); ctx.lineTo(x + tp, gy - LOOK_H); ctx.stroke(); }
    ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 4;
    for (const [b, tp] of legs) { ctx.beginPath(); ctx.moveTo(x + b, gy); ctx.lineTo(x + tp, gy - LOOK_H); ctx.stroke(); }
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 27, gy - 14); ctx.lineTo(x + 24, gy - 70); ctx.moveTo(x + 27, gy - 14); ctx.lineTo(x - 24, gy - 70); ctx.stroke();
    // ladder up the front
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 9, gy + 4); ctx.lineTo(x - 7, gy - LOOK_H); ctx.moveTo(x + 9, gy + 4); ctx.lineTo(x + 7, gy - LOOK_H); ctx.stroke();
    ctx.strokeStyle = '#d8a060'; ctx.lineWidth = 2.5; ctx.stroke();
    for (let i = 0; i < 7; i++) { const yy = gy - 6 - i * 15; ctx.strokeStyle = '#d8a060'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 8, yy); ctx.lineTo(x + 8, yy); ctx.stroke(); }
    inkRect(x - 32, gy - LOOK_H - 6, 64, 10, '#c8884a', 1.6, 3);
    // a railing and a little flag
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 30, gy - LOOK_H - 6); ctx.lineTo(x - 30, gy - LOOK_H - 26); ctx.lineTo(x + 30, gy - LOOK_H - 26); ctx.lineTo(x + 30, gy - LOOK_H - 6); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 30, gy - LOOK_H - 26); ctx.lineTo(x + 30, gy - LOOK_H - 56); ctx.stroke();
    const fl = Math.sin(S.t * 5) * 3;
    ink(P2(`M${x + 30},${gy - LOOK_H - 56} Q${x + 44},${gy - LOOK_H - 52 + fl} ${x + 54},${gy - LOOK_H - 50} L${x + 30},${gy - LOOK_H - 42} Z`), '#ff5a8a', 1.2);
  }
  // a wooden signpost: N points up the path, E points toward the sun
  function drawSignpost(x, gy, tier) {
    ctx.fillStyle = 'rgba(40,30,10,.22)'; ellipse(x, gy, 14, 4);
    inkRect(x - 3.5, gy - 66, 7, 66, '#9a6a3a', 1.4, 2);
    ink(P2(`M${x - 13},${gy - 60} L${x - 13},${gy - 80} L${x},${gy - 92} L${x + 13},${gy - 80} L${x + 13},${gy - 60} Z`), '#e8c080', 1.4);
    text(tier === 1 ? '⬆' : 'N', x, gy - 74, 13, '#5a3a1a', 'center', 800);
    ink(P2(`M${x + 2},${gy - 54} L${x + 30},${gy - 54} L${x + 40},${gy - 46} L${x + 30},${gy - 38} L${x + 2},${gy - 38} Z`), '#e8c080', 1.4);
    text(tier === 1 ? '☀' : 'E', x + 20, gy - 46, 12, '#5a3a1a', 'center', 800);
  }
  function drawSunflower(f, x, gy, alpha) {
    if (alpha < 1) ctx.globalAlpha = alpha;
    const sway = Math.sin(S.t * 1.3 + f.ph) * 3, nod = Math.sin(S.t * 1.7 + f.ph * 1.3) * 0.09;
    const hx = x + sway, hy = gy - f.h;
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x - 4, gy - f.h * 0.5, hx - 2, hy + 6);
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = '#4f9a32'; ctx.lineWidth = 4; ctx.stroke();
    for (const [ly, side] of [[0.22, -1], [0.42, 1], [0.62, -1]]) {
      const lx = x - 2 + sway * ly, yy = gy - f.h * ly;
      ctx.save(); ctx.translate(lx, yy); ctx.rotate(side * 0.6 + Math.sin(S.t * 2 + f.ph + ly * 5) * 0.08); ctx.scale(side, 1);
      ink(P2('M0,0 C8,-12 24,-12 30,-2 C22,6 8,6 0,0 Z'), side > 0 ? '#5cb23a' : '#4a9a2e', 1.2);
      ctx.restore();
    }
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(nod + 0.12); ctx.scale(f.r / 26, f.r / 26);
    blit(headSprite(f.v), 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ the maze and its clue trail
  function carve(cols, rows) {
    const walls = Array.from({ length: rows }, () => Array(cols).fill(15)), seen = walls.map(r => r.map(() => false));
    const stack = [[0, 0]]; seen[0][0] = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const d = shuffle(DIRS.slice()).find(d => seen[y + d.dy]?.[x + d.dx] === false);
      if (!d) { stack.pop(); continue; }
      walls[y][x] &= ~d.bit; walls[y + d.dy][x + d.dx] &= ~d.back; seen[y + d.dy][x + d.dx] = true;
      stack.push([x + d.dx, y + d.dy]);
    }
    // a few loops, so a wrong turn can usually be undone a different way
    for (let i = 0; i < cols * rows * 0.1; i++) {
      const x = randInt(0, cols - 1), y = randInt(0, rows - 1), d = pick(DIRS);
      if (walls[y + d.dy]?.[x + d.dx] !== undefined) { walls[y][x] &= ~d.bit; walls[y + d.dy][x + d.dx] &= ~d.back; }
    }
    return walls;
  }
  const openWall = (walls, x, y, d) => { walls[y][x] &= ~d.bit; walls[y + d.dy][x + d.dx] &= ~d.back; };
  function bfs(g, tx, ty) {
    const dist = g.walls.map(r => r.map(() => 1e9)), q = [[tx, ty]]; dist[ty][tx] = 0;
    while (q.length) {
      const [x, y] = q.shift();
      for (const d of DIRS) if (!(g.walls[y][x] & d.bit) && dist[y + d.dy][x + d.dx] > dist[y][x] + 1) { dist[y + d.dy][x + d.dx] = dist[y][x] + 1; q.push([x + d.dx, y + d.dy]); }
    }
    return dist;
  }
  // pick the landmarks: each one lies in one clear direction (tier 1-2) or two (tier 3) from the last
  function planTrail(g) {
    const { cols, rows, tier } = g, n = [3, 4, 5][tier - 1];
    for (let tries = 0; tries < 2000; tries++) {
      const start = { x: 0, y: rows - 1 }, stops = [], used = [start];
      let cur = start, ok = true;
      for (let i = 0; i < n; i++) {
        const two = tier === 3 || (tier === 2 && i === n - 1);
        const cand = [];
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const dx = x - cur.x, dy = y - cur.y, m = Math.abs(dx) + Math.abs(dy);
          if (two ? (!dx || !dy || m < 4 || m > 8) : ((dx && dy) || m < 3 || m > (tier === 1 ? 5 : 6))) continue;
          if (used.some(u => Math.max(Math.abs(u.x - x), Math.abs(u.y - y)) < 2)) continue;
          cand.push({ x, y });
        }
        if (!cand.length) { ok = false; break; }
        // tier 1 prefers left/right legs: that's the lesson
        const lr = tier === 1 ? cand.filter(c => c.y === cur.y) : [];
        const nx = pick(lr.length && Math.random() < 0.75 ? lr : cand);
        const dx = nx.x - cur.x, dy = nx.y - cur.y, h = dx > 0 ? 'E' : 'W', v = dy > 0 ? 'S' : 'N';
        const dirs = !dx ? [v] : !dy ? [h] : (Math.random() < 0.5 ? [h, v] : [v, h]);
        stops.push({ ...nx, dirs, from: cur });
        used.push(nx); cur = nx;
      }
      if (ok) return { start, stops };
    }
    return null;
  }

  MG.sunflowercompass = {
    kind: 'learn', title: () => 'The Sunflower Maze', icon: () => '🧭',
    how: g => g.tier === 1
      ? 'The sunflowers are taller than you! Read the clue card: go LEFT or RIGHT, UP or DOWN, to find each place on the list. Climb the lookout towers to peek over the flowers.'
      : 'The sunflowers are taller than you! Every sunflower looks at the sun, and the sun is in the EAST. Follow the clue card with NORTH, EAST, SOUTH and WEST to find each place on the list. Climb a lookout tower to peek over the top.',
    init(g) {
      const [cols, rows] = [[7, 5], [9, 6], [11, 7]][g.tier - 1];
      Object.assign(g, { cols, rows });
      let plan = null;
      while (!plan) { g.walls = carve(cols, rows); plan = planTrail(g); }
      // dig the clue's way through, so "go NORTH, then EAST" is always a real, shortest path
      const route = [];
      for (const s of plan.stops) {
        let x = s.from.x, y = s.from.y;
        for (const k of s.dirs) {
          const d = DIR[k], tx = k === 'E' || k === 'W' ? s.x : x, ty = k === 'N' || k === 'S' ? s.y : y;
          while (x !== tx || y !== ty) { openWall(g.walls, x, y, d); x += d.dx; y += d.dy; route.push({ x, y }); }
        }
      }
      const kinds = shuffle(['scarecrow', 'tractor', 'well', 'hive', 'pumpkins']).slice(0, plan.stops.length - 1).concat('picnic');
      plan.stops.forEach((s, i) => { s.k = kinds[i]; s.found = false; s.wrong = 0; s.time = 0; s.nag = {}; });
      g.start = plan.start; g.stops = plan.stops;
      // lookout towers: spread out, away from the landmarks
      const taken = [g.start, ...g.stops];
      g.looks = [];
      const nLook = [3, 2, 1][g.tier - 1];
      for (let i = 0; i < nLook; i++) {
        let best = null, bestD = -1;
        for (let k = 0; k < 60; k++) {
          // most towers stand on the clue trail itself, so she passes them on the way
          const c = k < 40 && route.length ? { ...pick(route) } : { x: randInt(0, cols - 1), y: randInt(0, rows - 1) };
          if (taken.some(u => u.x === c.x && u.y === c.y)) continue;
          const dd = Math.min(...taken.map(u => Math.abs(u.x - c.x) + Math.abs(u.y - c.y))) + (k < 40 ? 3 : 0);
          if (dd > bestD) { bestD = dd; best = c; }
        }
        if (best) { best.used = false; g.looks.push(best); taken.push(best); }
      }
      // signposts at a few crossroads
      g.signs = [];
      const cross = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const opens = DIRS.filter(d => !(g.walls[y][x] & d.bit)).length;
        if (opens >= 3 && !taken.some(u => u.x === x && u.y === y)) cross.push({ x, y });
      }
      g.signs = shuffle(cross).slice(0, 2 + g.tier);
      // the tile grid: walls (true) and paths, and the sunflowers growing on every wall tile
      const TX = cols * 2 + 1, TY = rows * 2 + 1;
      const blk = Array.from({ length: TY }, () => Array(TX).fill(true));
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        blk[2 * y + 1][2 * x + 1] = false;
        if (!(g.walls[y][x] & 2)) blk[2 * y + 1][2 * x + 2] = false;
        if (!(g.walls[y][x] & 4)) blk[2 * y + 2][2 * x + 1] = false;
      }
      blk[2 * g.start.y + 1][0] = false; // the gate in from the west
      const flowers = [];
      for (let ty = -2; ty < TY + 4; ty++) for (let tx = -3; tx < TX + 3; tx++) {
        if (ty >= 0 && ty < TY && tx >= 0 && tx < TX && !blk[ty][tx]) continue;
        if (tx < 0 && ty === 2 * g.start.y + 1) continue;
        // one flower every ~50px across a tile; a wall standing in a path row gets a little column of them
        const w = colW(tx), h = rowH(ty), nx = Math.max(1, Math.round(w / 52)), ny = ty % 2 ? 3 : 1;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) flowers.push({
          x: colX(tx) + w * (i + 0.5) / nx + rand(-5, 5) + (j % 2 ? 6 : -6) * (nx === 1 ? 1 : 0),
          y: rowY(ty) + (ny === 1 ? WH * 0.8 : h * (j + 0.7) / ny) + rand(-3, 3),
          h: rand(104, 120), r: rand(21, 25), v: randInt(0, 2), ph: rand(0, 6.28),
        });
      }
      Object.assign(g, {
        TX, TY, blk, flowers, wW: colX(TX), wH: rowY(TY),
        cx: g.start.x, cy: g.start.y, px: g.start.x, py: g.start.y, facing: 1, moving: false,
        leg: 0, legT: 0, wrongStreak: false, wrong: 0, seen: new Set([key(g.start.x, g.start.y)]), trail: [],
        look: null, msgT: 0, idleT: 0, finishT: 0, legScores: [],
        timeLeft: [150, 180, 210][g.tier - 1], ground: null, fog: null,
      });
      g.trail.push([g.start.x, g.start.y]);
      this.newLeg(g);
      const [wx, wy] = this.world(g.px, g.py);
      g.cam = { x: wx - W / 2, y: wy - 330 };
    },
    start(g) { speak(g.say); },
    world(cx, cy) { return [cx * PX + WW + PW / 2, cy * PY + WH + FOOT]; },
    clue(g, s) {
      const ws = s.dirs.map(k => word(g, k));
      return `Go ${ws.join(', then ')}, to ${LM[s.k]}!`;
    },
    newLeg(g) {
      const s = g.stops[g.leg];
      g.dist = bfs(g, s.x, s.y);
      g.legT = 0; g.wrongStreak = false;
      const from = g.leg === 0 ? 'Start at the farm gate. ' : '';
      g.say = from + this.clue(g, s);
      g.cardPop = 1;
    },
    // which way gets closer to the next landmark from here (the clue's own order first)
    helpDir(g) {
      const s = g.stops[g.leg], here = g.dist[g.cy][g.cx];
      const ok = DIRS.filter(d => !(g.walls[g.cy][g.cx] & d.bit) && g.dist[g.cy + d.dy][g.cx + d.dx] < here).map(d => d.k);
      return s.dirs.find(k => ok.includes(k)) || ok[0];
    },
    hint(g) {
      const s = g.stops[g.leg], k = this.helpDir(g);
      if (!k) return;
      let extra = '';
      if (g.tier > 1) extra = { E: ' East is where the sunflowers are looking!', W: ' West is behind the sunflowers\' heads.', N: ' North is up.', S: ' South is down.' }[k];
      g.say = `Oops! That way goes away from ${LM[s.k]}. Try ${word(g, k)}!${extra}`;
      speak(g.say);
      g.hintDir = k; g.hintT = 3;
    },
    step(g, d) {
      const before = g.dist[g.cy][g.cx];
      g.cx += d.dx; g.cy += d.dy;
      if (d.dx) g.facing = d.dx;
      const after = g.dist[g.cy][g.cx];
      if (after > before) {
        if (!g.wrongStreak) { g.wrongStreak = true; g.wrong++; g.stops[g.leg].wrong++; SFX.miss(); this.hint(g); }
      } else if (g.wrongStreak) { g.wrongStreak = false; g.say = this.clue(g, g.stops[g.leg]); }
      const k = key(g.cx, g.cy);
      if (!g.seen.has(k)) g.seen.add(k);
      g.trail.push([g.cx, g.cy]);
      if (g.trail.length > 400) g.trail.shift();
    },
    arrive(g) {
      const s = g.stops[g.leg];
      if (g.cx === s.x && g.cy === s.y) {
        s.found = true;
        const par = 6 + 0.6 * (Math.abs(s.x - s.from.x) + Math.abs(s.y - s.from.y));
        s.score = clamp(1 - 0.2 * s.wrong - 0.02 * Math.max(0, g.legT - par), 0.25, 1);
        g.legScores.push(s.score);
        SFX.hit(); SFX.sparkle();
        const [wx, wy] = this.world(s.x, s.y);
        burst(wx - g.cam.x, wy - g.cam.y - 50, 26);
        floatText(wx - g.cam.x, wy - g.cam.y - 120, 'You found it!', '#fff6a8', false, 28);
        g.leg++;
        if (g.leg >= g.stops.length) { g.finishT = 2.2; speak(`Hooray! You found ${LM[s.k]}! You followed every clue!`); g.say = 'You did it!'; return; }
        this.newLeg(g);
        speak(`Yes, ${LM[s.k]}! Next clue: ${this.clue(g, g.stops[g.leg])}`);
        return;
      }
      // a landmark from later on the list
      const other = g.stops.find(o => !o.found && o.x === g.cx && o.y === g.cy);
      if (other && !s.nag[other.k]) { s.nag[other.k] = 1; speak(`That's ${LM[other.k]}! But first, find ${LM[s.k]}.`); }
      // a lookout tower: climb it the first time automatically
      const lk = g.looks.find(l => l.x === g.cx && l.y === g.cy);
      if (lk && !lk.used) this.climb(g, lk);
    },
    climb(g, lk) {
      lk.used = true;
      g.look = { t: 0, dur: 4.5, x: lk.x, y: lk.y };
      SFX.jump(); speak(`Up the lookout! Now you can see over the sunflowers. Where is ${LM[g.stops[g.leg].k]}?`);
    },
    update(g, dt, id) {
      if (g.finishT > 0) { g.finishT -= dt; if (g.finishT <= 0) g.done = true; this.camera(g, dt); return; }
      g.cardPop = Math.max(0, (g.cardPop || 0) - dt * 2);
      g.hintT = Math.max(0, (g.hintT || 0) - dt);
      if (g.look) {
        g.look.t += dt;
        if (g.look.t >= g.look.dur || (g.look.t > 0.8 && (id === 'sfm_down' || pressed[' '] || pressed.enter))) { g.look = null; SFX.jump(); speak(g.say); }
        this.camera(g, dt);
        return;
      }
      g.timeLeft -= dt; g.legT += dt;
      const onLook = g.looks.find(l => l.x === g.cx && l.y === g.cy);
      if (onLook && !g.moving && (id === 'sfm_climb' || pressed[' '])) { this.climb(g, onLook); return; }
      const spd = 2.5 * dt;
      g.px += clamp(g.cx - g.px, -spd, spd); g.py += clamp(g.cy - g.py, -spd, spd);
      const was = g.moving;
      g.moving = g.px !== g.cx || g.py !== g.cy;
      if (was && !g.moving) this.arrive(g);
      if (!g.moving && !g.look && g.finishT <= 0) {
        let want = [];
        if (goLeft()) want.push(DIR.W); else if (goRight()) want.push(DIR.E);
        if (keys.arrowup || keys.w) want.push(DIR.N); else if (goDown()) want.push(DIR.S);
        if (!want.length && pointer.down && pointer.y > 62 && !(pointer.x > W - 140 && pointer.y > H - 140) && !buttons.some(b => inRect(b))) {
          // lead her with a finger: head toward the pointer, the longer way first
          const [wx, wy] = this.world(g.cx, g.cy), dx = (pointer.x + g.cam.x - wx) / PX, dy = (pointer.y + g.cam.y - (wy - 30)) / PY;
          const hd = Math.abs(dx) > 0.45 ? DIR[dx > 0 ? 'E' : 'W'] : null, vd = Math.abs(dy) > 0.45 ? DIR[dy > 0 ? 'S' : 'N'] : null;
          want = (Math.abs(dx) >= Math.abs(dy) ? [hd, vd] : [vd, hd]).filter(Boolean);
        }
        const d = want.find(d => !(g.walls[g.cy][g.cx] & d.bit));
        if (d) { this.step(g, d); g.idleT = 0; g.moving = true; }
        else if (!want.length) {
          g.idleT += dt;
          if (g.idleT > 9) { g.idleT = 0; speak(g.say); }
        }
      }
      this.camera(g, dt);
      g.progress = `Found: ${g.leg} / ${g.stops.length}`;
      g.score = g.legScores.reduce((a, b) => a + b, 0) / g.stops.length;
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
    },
    camera(g, dt) {
      const [wx, wy] = this.world(g.px, g.py);
      const tx = wx - W / 2, ty = wy - 330;
      g.cam.x = lerp(g.cam.x, tx, Math.min(1, dt * 6)); g.cam.y = lerp(g.cam.y, ty, Math.min(1, dt * 6));
    },

    // ---------------------------------------------------------------- drawing
    paintGround(g) {
      const pad = 2 * PX, w = g.wW + pad * 2, h = g.wH + pad * 2;
      return paintOnce(w, h, pad, pad, () => {
        ctx.fillStyle = '#4c7a26'; ctx.fillRect(-pad, -pad, w, h);
        let seed = g.cols * 31 + g.rows; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < w * h / 900; i++) { ctx.fillStyle = ['#426c20', '#5a8a2e', '#6a4a26'][i % 3]; ellipse(-pad + R() * w, -pad + R() * h, 7 + R() * 8, 3 + R() * 3, R() * 3); }
        // the trodden dirt paths: dark edge first, then the dirt, so they read as one track
        const paths = [];
        for (let y = 0; y < g.TY; y++) for (let x = 0; x < g.TX; x++) if (!g.blk[y][x]) paths.push([x, y]);
        for (let x = -3; x < 0; x++) paths.push([x, 2 * g.start.y + 1]);
        for (const [pass, col, grow] of [[0, '#8a6a3a', 7], [1, '#d6aa6a', 0], [2, '#e6c088', -14]]) {
          ctx.fillStyle = col;
          for (const [x, y] of paths) { ctx.beginPath(); ctx.roundRect(colX(x) - grow, rowY(y) - grow * 0.75, colW(x) + grow * 2, rowH(y) + grow * 1.5, pass === 2 ? 16 : 12); ctx.fill(); }
        }
        // pebbles, footprints, grass tufts on the edges
        for (const [x, y] of paths) {
          for (let i = 0; i < 3; i++) { ctx.fillStyle = R() < 0.5 ? '#c49a62' : '#f0d4a4'; ellipse(colX(x) + R() * colW(x), rowY(y) + R() * rowH(y), 2 + R() * 2.5, 1.5 + R()); }
          if (R() < 0.35) { ctx.fillStyle = 'rgba(120,80,40,.3)'; const fx = colX(x) + 20 + R() * 40, fy = rowY(y) + 18 + R() * 40; ellipse(fx, fy, 4, 2.5); ellipse(fx + 10, fy + 5, 4, 2.5); }
        }
        ctx.strokeStyle = '#7cc04a'; ctx.lineWidth = 2;
        for (let y = 0; y < g.TY; y++) for (let x = 0; x < g.TX; x++) if (g.blk[y][x]) for (let i = 0; i < 4; i++) {
          const bx = colX(x) + R() * colW(x), by = rowY(y) + rowH(y) * (0.3 + R() * 0.7);
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 3, by - 8); ctx.moveTo(bx, by); ctx.lineTo(bx + 3, by - 9); ctx.stroke();
        }
      });
    },
    draw(g) {
      const cam = g.cam, cx0 = cam.x, cy0 = cam.y;
      if (!g.ground) g.ground = this.paintGround(g);
      // the sky is gold, low in the east: fill, then the ground
      ctx.fillStyle = '#3f6c20'; ctx.fillRect(0, 0, W, H);
      blit(g.ground, -cx0, -cy0);
      // dappled sunlight drifting on the ground
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) {
        const x = ((i * 173 + S.t * 9 * (1 + i % 3)) % (W + 200)) - 100, y = 80 + ((i * 97) % 460) + Math.sin(S.t * 0.7 + i) * 10;
        const r = 26 + (i % 4) * 9;
        const gr = ctx.createRadialGradient(x, y, 1, x, y, r);
        gr.addColorStop(0, 'rgba(255,220,120,.22)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
        ctx.fillStyle = gr; ellipse(x, y, r, r * 0.55);
      }
      ctx.restore();
      // the seed trail: where Aubrey has already walked
      ctx.fillStyle = '#5a3a1e';
      for (let i = 1; i < g.trail.length; i++) {
        const [ax, ay] = this.world(...g.trail[i - 1]), [bx, by] = this.world(...g.trail[i]);
        for (let k = 0; k < 4; k++) {
          const t = (k + 0.5) / 4, x = lerp(ax, bx, t) - cx0 + ((i * 7 + k * 13) % 9) - 4, y = lerp(ay, by, t) - cy0 + ((i * 5 + k * 11) % 7) - 3 + 6;
          if (x > -10 && x < W + 10 && y > -10 && y < H + 10) { ctx.fillStyle = '#5a3a1e'; ellipse(x, y, 2.6, 1.6, k); ctx.fillStyle = '#f2e2c0'; ellipse(x + 0.6, y - 0.4, 1, 0.6, k); }
        }
      }
      // everything that stands up, sorted back to front
      const items = [], [ax, ay] = this.world(g.px, g.py), asx = ax - cx0, asy = ay - cy0;
      for (const f of g.flowers) { const x = f.x - cx0, y = f.y - cy0; if (x > -40 && x < W + 40 && y > 40 && y < H + 170) items.push({ y, f, x }); }
      const vis = (x, y) => x > -120 && x < W + 120 && y > 0 && y < H + 160;
      for (const s of g.stops) { const [x, y] = this.world(s.x, s.y); if (vis(x - cx0, y - cy0)) items.push({ y: y - cy0 - 2, lm: s.k, x: x - cx0 }); }
      { const [x, y] = this.world(g.start.x, g.start.y); if (vis(x - cx0 - 40, y - cy0)) items.push({ y: y - cy0 - 20, lm: 'gate', x: x - cx0 - 58 }); }
      for (const l of g.looks) { const [x, y] = this.world(l.x, l.y); if (vis(x - cx0, y - cy0)) items.push({ y: y - cy0 - 6, look: l, x: x - cx0 }); }
      for (const s of g.signs) { const [x, y] = this.world(s.x, s.y); if (vis(x - cx0, y - cy0)) items.push({ y: y - cy0 - 36, sign: 1, x: x - cx0 - 44 }); }
      items.push({ y: asy, aub: 1 });
      items.sort((a, b) => a.y - b.y);
      const climbing = g.look ? Math.min(1, g.look.t / 0.6) * (g.look.t > g.look.dur - 0.5 ? (g.look.dur - g.look.t) / 0.5 : 1) : 0;
      for (const it of items) {
        if (it.f) {
          // flowers just in front of Aubrey go see-through so she never gets lost behind them
          const near = it.y > asy && it.y - asy < it.f.h + 30 && Math.abs(it.x - asx) < 46 + (it.y - asy) * 0.15;
          drawSunflower(it.f, it.x, it.y, near ? 0.33 : 1);
        } else if (it.lm) drawLandmark(it.lm, it.x, it.y, 0.9);
        else if (it.look) drawLookout(it.x, it.y, !it.look.used);
        else if (it.sign) drawSignpost(it.x, it.y, g.tier);
        else if (it.aub) {
          // a sunny spot under her feet so she's easy to find
          const sg = ctx.createRadialGradient(asx, asy, 1, asx, asy, 46);
          sg.addColorStop(0, 'rgba(255,250,200,.85)'); sg.addColorStop(1, 'rgba(255,250,200,0)');
          ctx.fillStyle = sg; ellipse(asx, asy, 46, 18);
          const frame = g.moving ? `run${1 + (Math.floor(g.t * 11) % 5)}` : 'idle_front';
          drawAubrey(asx, asy, climbing > 0 ? 'idle_front' : frame, g.facing, climbing * LOOK_H, 0.36);
        }
      }
      // the far field closes in: beyond a few steps it's all sunflower heads and leaves
      this.drawFog(g, asx, asy - 40 - climbing * LOOK_H);
      // golden light from the east, and the sun itself low on the right
      const lg = ctx.createLinearGradient(W, 0, W * 0.45, 0);
      lg.addColorStop(0, 'rgba(255,200,80,.32)'); lg.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 60, W, H - 60);
      this.drawSun(g);
      // bees and butterflies around Aubrey
      for (let i = 0; i < 4; i++) {
        const a = S.t * (0.8 + i * 0.2) + i * 1.7, x = asx + Math.cos(a) * (70 + i * 14), y = asy - 80 - climbing * LOOK_H + Math.sin(a * 1.6) * 34;
        emoji(i % 2 ? '🦋' : '🐝', x, y, i % 2 ? 22 : 16);
      }
      this.drawHud(g, asx);
      if (g.look) this.drawLookMap(g);
    },
    drawFog(g, fx, fy) {
      if (!g.fog) { g.fog = document.createElement('canvas'); g.fog.width = W * DPR; g.fog.height = H * DPR; g.fogC = g.fog.getContext('2d'); }
      const c = g.fogC, cp = canopy(), sw = cp.s.w, sh = cp.s.h;
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.clearRect(0, 0, W, H);
      const ox = -((g.cam.x * 0.92) % sw + sw) % sw, oy = -((g.cam.y * 0.92) % sh + sh) % sh;
      for (let x = ox; x < W; x += sw) for (let y = oy; y < H; y += sh) c.drawImage(cp.s.c, x, y, sw, sh);
      // a soft window around Aubrey: wider than tall, bigger on the easy tier and up a lookout
      const R0 = [200, 185, 175][g.tier - 1] + (g.look ? 60 : 0), R1 = R0 + 80;
      c.globalCompositeOperation = 'destination-out';
      c.save(); c.translate(fx, fy); c.scale(1.25, 1);
      const gr = c.createRadialGradient(0, 0, 0, 0, 0, R1);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(R0 / R1, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr; c.fillRect(-R1, -R1, R1 * 2, R1 * 2);
      c.restore();
      ctx.drawImage(g.fog, 0, 0, W, H);
      // a soft shadow ring where the tall flowers close in
      const sg = ctx.createRadialGradient(fx, fy, R0 * 0.8, fx, fy, R1 + 30);
      sg.addColorStop(0, 'rgba(30,50,10,0)'); sg.addColorStop(1, 'rgba(30,50,10,.25)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    },
    drawSun(g) {
      const x = W - 34, y = 150, p = Math.sin(S.t * 2) * 0.5 + 0.5;
      const gr = ctx.createRadialGradient(x, y, 10, x, y, 120);
      gr.addColorStop(0, 'rgba(255,240,150,.85)'); gr.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 130, y - 120, 260, 240);
      ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 0.2);
      ctx.fillStyle = '#ffcf3a';
      for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); tri(-6, -40 - p * 4, 6, -40 - p * 4, 0, -56 - p * 6); }
      ctx.restore();
      inkCircle(x, y, 34, '#ffe14a', 2);
      ctx.fillStyle = '#5a3a1a'; circle(x - 10, y - 4, 3); circle(x + 4, y - 4, 3);
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x - 3, y + 4, 9, 0.3, Math.PI - 0.3); ctx.stroke();
      outlined(g.tier === 1 ? 'RIGHT' : 'EAST', x - 20, y + 52, 15, '#fff3a0', 'center');
    },
    drawCompass(g, x, y, r) {
      inkCircle(x, y, r, 'rgba(255,248,230,.95)', 2);
      ctx.strokeStyle = 'rgba(91,63,115,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r - 8, 0, Math.PI * 2); ctx.stroke();
      const need = g.hintT > 0 ? g.hintDir : null;
      for (const d of DIRS) {
        const a = Math.atan2(d.dy, d.dx), hot = need === d.k, L = r - 12;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ink(P2(`M0,-7 L${L},0 L0,7 Z`), hot ? '#ffd21f' : DCOL[d.k], 1.2);
        ctx.restore();
        const lx = x + d.dx * (r + 14), ly = y + d.dy * (r + 14);
        if (hot) { ctx.fillStyle = 'rgba(255,240,120,.8)'; circle(lx, ly, 14 + Math.sin(S.t * 10) * 2); }
        outlined(g.tier === 1 ? { N: 'UP', E: 'R', S: 'DOWN', W: 'L' }[d.k] : d.k, lx, ly, g.tier === 1 && (d.k === 'N' || d.k === 'S') ? 12 : 17, DCOL[d.k] === '#22a866' ? '#bff5d6' : mix(DCOL[d.k], '#ffffff', 0.55), 'center');
      }
      inkCircle(x, y, 6, '#ffd21f', 1.2);
    },
    drawHud(g, asx) {
      // the clue card
      const s = g.stops[Math.min(g.leg, g.stops.length - 1)], pop = 1 + (g.cardPop || 0) * 0.08;
      ctx.save(); ctx.translate(W / 2 - 60, 92); ctx.scale(pop, pop);
      const cw = 560, x0 = -cw / 2;
      rrect(x0 + 4, -24, cw, 54, 16, 'rgba(60,30,10,.25)');
      rrect(x0, -28, cw, 54, 16, '#fff6dc', '#c89a5a', 3);
      // pin
      ctx.fillStyle = '#e8504a'; circle(x0 + 14, -14, 5);
      if (g.leg < g.stops.length) {
        let x = x0 + 30;
        ctx.font = `700 22px ${FONT}`;
        text('Go', x, 0, 22, '#5a3a1a', 'left', 700); x += ctx.measureText('Go ').width;
        s.dirs.forEach((k, i) => {
          const wd = word(g, k);
          ctx.font = `700 22px ${FONT}`; const ww = ctx.measureText(wd).width;
          const hot = g.hintT > 0 && g.hintDir === k;
          rrect(x - 4, -18, ww + 40, 36, 12, hot ? '#ffe46a' : mix(DCOL[k], '#ffffff', 0.78), DCOL[k], 2);
          text(wd, x + 4, 0, 22, mix(DCOL[k], '#000000', 0.25), 'left', 800);
          emoji(ARROW[k], x + ww + 20, 0, 20);
          x += ww + 46;
          if (i < s.dirs.length - 1) { text('then', x, 0, 20, '#5a3a1a', 'left', 600); x += 48; }
        });
        text('to', x, 0, 22, '#5a3a1a', 'left', 700); x += 30;
        ctx.save(); ctx.beginPath(); ctx.roundRect(x, -24, 46, 46, 10); ctx.fillStyle = '#e8f6d8'; ctx.fill(); ctx.clip();
        drawLandmark(s.k, x + 23, 18, s.k === 'picnic' ? 0.4 : 0.36); ctx.restore();
        text(LM[s.k].replace("Scamper's ", '').replace('the ', ''), x + 54, 0, 20, '#5a3a1a', 'left', 700);
      } else text('You found them all!', 0, 0, 24, '#5a3a1a', 'center', 800);
      ctx.restore();
      // the landmark list, in order, along the bottom left
      const n = g.stops.length, bw = 62;
      darkPanel(10, H - 84, n * (bw + 8) + 12, 76, 16);
      g.stops.forEach((st, i) => {
        const x = 18 + i * (bw + 8), y = H - 78, cur = i === g.leg;
        rrect(x, y, bw, 64, 12, st.found ? '#d8f5c0' : cur ? '#fff6c8' : 'rgba(255,255,255,.75)', cur ? '#ffb000' : 'rgba(255,255,255,.9)', cur ? 4 : 2);
        ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, bw, 64, 12); ctx.clip();
        if (!st.found && !cur) ctx.globalAlpha = 0.55;
        drawLandmark(st.k, x + bw / 2, y + 58, st.k === 'picnic' ? 0.5 : 0.46);
        ctx.restore(); ctx.globalAlpha = 1;
        outlined(String(i + 1), x + 10, y + 12, 14, '#fff', 'center');
        if (st.found) emoji('✅', x + bw - 12, y + 12, 18);
      });
      // compass rose, bottom right
      this.drawCompass(g, W - 76, H - 78, 44);
      // on a lookout: a button to climb it again
      if (!g.look && !g.moving && g.finishT <= 0 && g.looks.some(l => l.x === g.cx && l.y === g.cy)) button('sfm_climb', asx - 70, 130, 140, 46, 'Climb up!', { color: '#c8884a', icon: '🪜', size: 18 });
    },
    // the bird's-eye view from the top of a lookout: the maze close by, from above
    drawLookMap(g) {
      const L = g.look, R = [3, 3, 2][g.tier - 1], a = Math.min(1, L.t / 0.5) * Math.min(1, (L.dur - L.t) / 0.4);
      const x0c = clamp(L.x - R, 0, Math.max(0, g.cols - (2 * R + 1))), y0c = clamp(L.y - R, 0, Math.max(0, g.rows - (2 * R + 1)));
      const nc = Math.min(g.cols, 2 * R + 1), nr = Math.min(g.rows, 2 * R + 1);
      const t = Math.min(26, Math.floor(360 / (2 * nr + 1)), Math.floor(560 / (2 * nc + 1))), mw = (2 * nc + 1) * t, mh = (2 * nr + 1) * t;
      const mx = Math.round(W / 2 - mw / 2), my = Math.round(140 + (330 - mh) / 2);
      ctx.save(); ctx.globalAlpha = a;
      panel(mx - 44, my - 62, mw + 88, mh + 112, 20);
      text('From up here you can see the paths!', W / 2, my - 44, 18, '#5a2a6e', 'center', 700);
      ctx.save(); ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 8); ctx.clip();
      ctx.fillStyle = '#4c7a26'; ctx.fillRect(mx, my, mw, mh);
      const tx0 = x0c * 2, ty0 = y0c * 2;
      for (let ty = 0; ty < 2 * nr + 1; ty++) for (let tx = 0; tx < 2 * nc + 1; tx++) {
        const wall = g.blk[ty0 + ty]?.[tx0 + tx] ?? true, x = mx + tx * t, y = my + ty * t;
        if (!wall) { ctx.fillStyle = '#e2b878'; ctx.fillRect(x - 1, y - 1, t + 2, t + 2); }
      }
      for (let ty = 0; ty < 2 * nr + 1; ty++) for (let tx = 0; tx < 2 * nc + 1; tx++) {
        const wall = g.blk[ty0 + ty]?.[tx0 + tx] ?? true;
        if (wall) blit(topSprite(), mx + tx * t + t / 2, my + ty * t + t / 2, t / 26);
      }
      const at = (cx, cy) => [mx + (2 * (cx - x0c) + 1.5) * t, my + (2 * (cy - y0c) + 1.5) * t];
      const inView = (cx, cy) => cx >= x0c && cx < x0c + nc && cy >= y0c && cy < y0c + nr;
      // seeds she's dropped
      ctx.fillStyle = '#6a3a1a';
      for (const [cx, cy] of g.trail) if (inView(cx, cy)) { const [x, y] = at(cx, cy); circle(x, y, 2.5); }
      g.stops.forEach((s, i) => {
        if (!inView(s.x, s.y)) return;
        const [x, y] = at(s.x, s.y);
        if (i === g.leg) { ctx.fillStyle = `rgba(255,240,120,${0.5 + 0.4 * Math.sin(S.t * 8)})`; circle(x, y, t * 1.1); }
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, t * 0.9, 0, Math.PI * 2); ctx.fillStyle = '#fffbe8'; ctx.fill(); ctx.clip();
        drawLandmark(s.k, x, y + t * 0.75, t / 60); ctx.restore();
      });
      const [axp, ayp] = at(g.cx, g.cy);
      ctx.fillStyle = '#ff6fb5'; inkCircle(axp, ayp, t * 0.5, '#ff6fb5', 1.5);
      text('A', axp, ayp + 1, t * 0.6, '#fff', 'center', 800);
      ctx.restore();
      // the next landmark is off the edge: an arrow points the way
      const s = g.stops[g.leg];
      if (s && !inView(s.x, s.y)) {
        const [sx, sy] = at(s.x, s.y), ang = Math.atan2(sy - ayp, sx - axp);
        const k = Math.min((mw / 2 - 22) / Math.max(1e-6, Math.abs(Math.cos(ang))), (mh / 2 - 22) / Math.max(1e-6, Math.abs(Math.sin(ang))));
        const ex = mx + mw / 2 + Math.cos(ang) * k, ey = my + mh / 2 + Math.sin(ang) * k, bob = Math.sin(S.t * 6) * 3;
        inkCircle(ex - Math.cos(ang) * 22, ey - Math.sin(ang) * 22, 17, '#fffbe8', 1.4);
        ctx.save(); ctx.beginPath(); ctx.arc(ex - Math.cos(ang) * 22, ey - Math.sin(ang) * 22, 16, 0, Math.PI * 2); ctx.clip();
        drawLandmark(s.k, ex - Math.cos(ang) * 22, ey - Math.sin(ang) * 22 + 13, 0.3); ctx.restore();
        ctx.save(); ctx.translate(ex + Math.cos(ang) * bob, ey + Math.sin(ang) * bob); ctx.rotate(ang); ink(P2('M-10,-11 L12,0 L-10,11 Z'), '#ffb000', 1.4); ctx.restore();
      }
      // compass letters round the edge
      for (const d of DIRS) {
        const lx = mx + mw / 2 + d.dx * (mw / 2 + 24), ly = my + mh / 2 + d.dy * (mh / 2 + 14);
        outlined(g.tier === 1 ? WORD1[d.k] : d.k, lx, ly, g.tier === 1 ? 13 : 18, mix(DCOL[d.k], '#ffffff', 0.5), 'center');
      }
      const w = mw * (1 - L.t / L.dur);
      rrect(mx, my + mh + 30, mw, 8, 4, 'rgba(120,90,150,.25)'); rrect(mx, my + mh + 30, Math.max(8, w), 8, 4, '#ffb000');
      ctx.restore();
      if (L.t > 0.8) button('sfm_down', W / 2 - 70, Math.min(H - 48, my + mh + 52), 140, 40, 'Climb down', { color: '#9a6ae0', size: 16 });
    },
  };

  restage('sunflowers', {
    games: [['seedbreakout', 'honey', {}], ['sunflowercompass', 'petal', {}]],
    mid: ['N:Chitter! The bees are so happy! Now come and find my picnic in the middle of the Sunflower Maze.',
      "N:The sunflowers are taller than you, so you can only see a little way. Follow my clue cards from place to place!",
      'N:Here\'s a squirrel secret: every sunflower looks at the sun, and the sun is in the EAST. Climb a lookout to peek over the top!',
      'A:determined:North, east, south, west. I won\'t get lost!'],
    outro: ['N:Fastest human I ever met — and the best at directions! Take some honey and petals.',
      'A:happy:Thanks, Scamper! The sunflowers showed me the way!'],
  });
}
