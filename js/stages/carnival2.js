'use strict';
// Traveling Carnival: the High Striker replaces Juggling.
// Aubrey drags the big hammer back (a bigger swing = more force) and lets go to SLAM the pad.
// The puck flies up a numbered tower and stops at a number: a big swing goes high, a little one
// stays low. Ringmaster Rosie calls a number (or a sum on harder tiers) and Aubrey has to judge
// just how hard to swing so the puck stops right on it. Teaches force -> height, estimating,
// reading a number line, "too high / too low" and simple sums.
{
  const RAIN = ['#ff5f7e', '#ffa040', '#ffd83a', '#5adc7a', '#40b0ff', '#9c6cff'];
  const D2R = Math.PI / 180;
  // the tower: level L (0..10) sits at y = HS.y0 - L * HS.dy
  const HS = { x: 772, y0: 430, dy: 29.5, bellY: 104, ax: 540, rest: 60, back: -165, len: 104, maxL: 10.5, G: 30 };
  HS.hx = HS.ax + 39; HS.hy = GY - 103; // Aubrey's hand: the hammer pivots here
  const lvlY = L => HS.y0 - L * HS.dy;
  const powerOf = th => clamp((HS.rest - th) / (HS.rest - HS.back), 0, 1);
  const levelOf = f => f * HS.maxL;
  const angleFor = L => HS.rest - (L / HS.maxL) * (HS.rest - HS.back);
  const TRIES = [1, 0.6, 0.3, 0];

  // ------------------------------------------------------------------ art
  const bulbs = (pts, ph) => pts.forEach(([x, y], i) => {
    const on = (Math.floor(S.t * 6 + ph) + i) % 3 !== 0;
    inkCircle(x, y, 4.5, on ? RAIN[i % 6] : '#e8dcef', 1);
    if (on) { ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x - 1.3, y - 1.3, 1.6); }
  });
  const bunting = (x1, y1, x2, y2, sag, n, ph = 0) => {
    const pt = t => { const x = lerp(x1, x2, t), y = lerp(y1, y2, t) + Math.sin(t * Math.PI) * sag; return [x, y]; };
    ctx.strokeStyle = '#7a5a8a'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const [x, y] = pt(i / 20); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const [x, y] = pt((i + 0.5) / n), sw = Math.sin(S.t * 3 + i + ph) * 2;
      ctx.fillStyle = OL; tri(x - 11, y - 1, x + 11, y - 1, x + sw, y + 22);
      ctx.fillStyle = RAIN[i % 6]; tri(x - 9, y, x + 9, y, x + sw, y + 19);
    }
  };
  const rosette = (x, y, r, col, won) => {
    if (!won) { ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(x, y, r); ctx.strokeStyle = 'rgba(90,42,110,.7)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.setLineDash([]); return; }
    ink(P2(`M${x - 8},${y} L${x - 15},${y + r + 18} L${x - 8},${y + r + 12} L${x - 2},${y + r + 20} Z`), col, 1.2);
    ink(P2(`M${x + 8},${y} L${x + 15},${y + r + 18} L${x + 8},${y + r + 12} L${x + 2},${y + r + 20} Z`), col, 1.2);
    ctx.fillStyle = OL; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; circle(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, r * 0.36); }
    ctx.fillStyle = col; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; circle(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, r * 0.3); }
    inkCircle(x, y, r * 0.62, '#fff6d8', 1.2);
    star(x, y, r * 0.42, '#ffb020', 5);
  };
  const drawBell = (x, y, ring) => {
    const sw = Math.sin(S.t * 30) * ring * 0.35;
    ctx.save(); ctx.translate(x, y - 22); ctx.rotate(sw);
    if (ring > 0) { ctx.strokeStyle = `rgba(255,214,60,${ring})`; ctx.lineWidth = 4; for (const r of [44, 58]) { ctx.beginPath(); ctx.arc(0, 22, r + (1 - ring) * 30, -2.6, -0.5); ctx.stroke(); } }
    ink(P2('M-30,34 C-30,10 -22,-6 0,-8 C22,-6 30,10 30,34 L36,40 L-36,40 Z'), '#ffcc2e', 2);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-12, 10, 5, 13, 0.3);
    inkCircle(0, 44, 7, '#e09a10', 1.5);
    inkCircle(0, -12, 6, '#ffcc2e', 1.5);
    ctx.restore();
  };
  const drawHammer = (th, alpha = 1) => {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(HS.hx, HS.hy); ctx.rotate(th * D2R);
    ink(P2(`M-16,-5 L${HS.len - 10},-5 L${HS.len - 10},5 L-16,5 Z`), '#c98a4a', 2);
    ctx.fillStyle = '#ff5f7e'; ctx.fillRect(-14, -4, 26, 8);
    ink(P2(`M${HS.len - 16},-30 Q${HS.len - 16},-34 ${HS.len - 12},-34 L${HS.len + 16},-34 Q${HS.len + 20},-34 ${HS.len + 20},-30 L${HS.len + 20},30 Q${HS.len + 20},34 ${HS.len + 16},34 L${HS.len - 12},34 Q${HS.len - 16},34 ${HS.len - 16},30 Z`), '#e8364f', 2.2);
    ctx.fillStyle = '#ffd83a'; ctx.fillRect(HS.len - 15, -24, 34, 7); ctx.fillRect(HS.len - 15, 17, 34, 7);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(HS.len - 11, -12, 5, 24);
    ctx.restore();
  };
  const drawTower = (g) => {
    const x = HS.x, top = HS.bellY + 14, bot = GY - 6;
    // bulb-lined, tent-striped back board
    ctx.save();
    const board = P2(`M${x - 46},${bot} L${x - 34},${top} L${x + 34},${top} L${x + 46},${bot} Z`);
    ink(board, '#fff4fb', 2.2);
    ctx.clip(board);
    for (let i = -6; i < 7; i++) { ctx.fillStyle = i % 2 ? '#ff6f8f' : '#fff4fb'; ctx.beginPath(); ctx.moveTo(x + i * 16, top); ctx.lineTo(x + i * 16 + 16, top); ctx.lineTo(x + i * 22 + 22, bot); ctx.lineTo(x + i * 22, bot); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.stroke(board);
    // the rail the puck rides on
    inkRect(x - 7, top + 6, 14, bot - top - 20, '#d8c6e6', 2, 6);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - 3, top + 10, 3, bot - top - 30);
    // number lamps on the right, a ladder of ticks on the left
    for (let n = 1; n <= 10; n++) {
      const y = lvlY(n), lit = g.lit === n ? g.litT : 0, tgt = g.showAns && n === g.target;
      ctx.fillStyle = OL; ctx.fillRect(x - 40, y - 1.5, 26, 3);
      const col = lit > 0 ? (g.hit ? '#7cf09a' : '#ffd83a') : tgt ? '#fff6a8' : '#ffffff';
      if (lit > 0) { ctx.fillStyle = `rgba(255,240,140,${0.5 * lit})`; circle(x + 68, y, 26); }
      ink(P2(`M${x + 50},${y - 13} L${x + 86},${y - 13} Q${x + 92},${y - 13} ${x + 92},${y - 7} L${x + 92},${y + 7} Q${x + 92},${y + 13} ${x + 86},${y + 13} L${x + 50},${y + 13} Z`), col, 1.6);
      ctx.fillStyle = RAIN[(n - 1) % 6]; ctx.beginPath(); ctx.moveTo(x + 50, y - 13); ctx.lineTo(x + 38, y); ctx.lineTo(x + 50, y + 13); ctx.fill();
      text(String(n), x + 71, y + 1, 20, '#5a2a6e', 'center', 800);
      if (tgt) emoji('👈', x + 116, y, 26);
    }
    // bulbs down both edges
    const L = [], R = [];
    for (let i = 0; i < 13; i++) { const t = i / 12; L.push([lerp(x - 36, x - 47, t), lerp(top + 6, bot - 4, t)]); R.push([lerp(x + 36, x + 47, t), lerp(top + 6, bot - 4, t)]); }
    bulbs(L, 0); bulbs(R, 1);
    drawBell(x, HS.bellY, g.ring);
    // base and the strike pad
    inkRect(x - 64, bot - 8, 128, 30, '#9c6cff', 2.2, 6);
    text('HIGH STRIKER', x, bot + 7, 13, '#fff', 'center', 900);
    const press = g.padT > 0 ? 5 : 0;
    inkRect(HS.hx + 28, GY - 30, HS.x - HS.hx - 80, 12, '#7a4a2a', 2, 4);
    ink(P2(`M${HS.hx + 26},${GY - 31 + press} Q${HS.hx + 50},${GY - 44 + press} ${HS.hx + 76},${GY - 31 + press} Z`), '#ff5f7e', 1.8);
    // the puck
    const py = lvlY(g.puckL);
    ctx.fillStyle = 'rgba(255,240,140,.6)'; if (g.st === 'fly') circle(x, py, 22);
    inkRect(x - 18, py - 11, 36, 22, '#40b0ff', 2, 8);
    star(x, py, 7, '#fff6a8', 5);
  };

  // ------------------------------------------------------------------ prompts
  const plain = t => ({ t, big: String(t), say: `Ring it up to ${NUM_WORDS[t]}!` });
  const prompts = {
    more: () => { const n = randInt(2, 8); return { t: n + 1, big: `1 more than ${n}`, say: `Make it stop on one more than ${NUM_WORDS[n]}!` }; },
    less: () => { const n = randInt(3, 9); return { t: n - 1, big: `1 less than ${n}`, say: `Make it stop on one less than ${NUM_WORDS[n]}!` }; },
    add: () => { const a = randInt(1, 5), b = randInt(1, 9 - a); return { t: a + b, big: `${a} + ${b}`, say: `What is ${NUM_WORDS[a]} plus ${NUM_WORDS[b]}? Ring the answer!` }; },
    sub: () => { const a = randInt(5, 10), b = randInt(1, a - 2); return { t: a - b, big: `${a} − ${b}`, say: `What is ${NUM_WORDS[a]} take away ${NUM_WORDS[b]}? Ring the answer!` }; },
    dbl: () => { const n = randInt(2, 4); return { t: n * 2, big: `double ${n}`, say: `What is double ${NUM_WORDS[n]}? Ring the answer!` }; },
  };
  const PLAN = [
    ['bell', 'plain', 'plain', 'plain', 'plain'],
    ['bell', 'plain', 'more', 'add', 'plain', 'less'],
    ['bell', 'add', 'sub', 'dbl', 'add', 'sub'],
  ];

  MG.highstriker = {
    kind: 'action', title: () => 'High Striker', icon: () => '🔨',
    how: () => 'Pull the hammer back and let go to SMASH the pad! A big swing sends the puck up high. A little swing keeps it low. Make it stop on Rosie\'s number! (Keys: up and down to swing back, space to smash.)',
    init(g) {
      const plan = PLAN[g.tier - 1];
      const used = new Set([10]);
      g.qs = plan.map(k => {
        if (k === 'bell') return { t: 10, big: '10', say: 'First, ring the bell at the very top! Swing back as far as you can!', bell: true };
        let q, n = 0;
        do { q = k === 'plain' ? plain(randInt(2, 9)) : prompts[k](); } while ((used.has(q.t) || q.t < 2 || q.t > 9) && ++n < 40);
        used.add(q.t); return q;
      });
      Object.assign(g, { round: 0, rounds: g.qs.length, total: 0, won: [], th: HS.rest, drag: false, puckL: 0, ring: 0, padT: 0, lit: 0, litT: 0, last: null, endT: 0, msg: '', msgT: 0 });
      this.next(g, true);
    },
    start(g) { speak(g.say); },
    next(g, first) {
      const q = g.qs[g.round];
      Object.assign(g, { q, target: q.t, tries: 0, st: 'aim', stT: 0, th: HS.rest, drag: false, showAns: false, hit: false, lit: 0, msg: '' });
      g.say = q.say;
      if (!first) speak(g.say);
    },
    slam(g) {
      if (powerOf(g.th) < 0.03) { g.th = HS.rest; return; }
      g.st = 'swing'; g.stT = 0; g.drag = false;
      g.power = powerOf(g.th); g.swingFrom = g.th;
      tone(300, 0.18, 'sine', 0.06, 0, 700);
    },
    judge(g) {
      const r = clamp(Math.round(g.peakL), 1, 10);
      g.lit = r; g.litT = 1; g.reached = r;
      g.last = { th: g.swingFrom, r };
      if (r === g.target) {
        g.hit = true; g.total += TRIES[Math.min(g.tries, 3)]; g.won[g.round] = true;
        if (r === 10) { g.ring = 1; tone(1320, 0.8, 'triangle', 0.12); tone(1980, 0.6, 'sine', 0.06, 0.05); }
        SFX.fanfare(); burst(HS.x + 68, lvlY(r), 30);
        g.msg = r === 10 ? 'DING!' : `${r}! Yes!`;
        const sum = g.q.big !== String(r) ? `${g.q.big} is ${NUM_WORDS[r]}. ` : '';
        speak(r === 10 ? 'Ding ding! You rang the bell!' : `${sum}${pick(['Spot on!', 'Bullseye!', 'You did it!'])} It stopped on ${NUM_WORDS[r]}!`);
        g.st = 'yay'; g.stT = 0;
      } else {
        g.tries++; SFX.miss();
        const high = r > g.target, d = Math.abs(r - g.target);
        g.msg = high ? 'Too high!' : 'Too low!';
        if (g.tries >= 3) {
          g.showAns = true; g.st = 'yay'; g.stT = -1.2;
          speak(`It went up to ${NUM_WORDS[r]}. The answer was ${NUM_WORDS[g.target]}. Let's try the next one!`);
        } else {
          const more = g.tier > 1 ? ` That's ${NUM_WORDS[d]} too ${high ? 'many' : 'few'}.` : '';
          speak(high ? `${NUM_WORDS[r]}! Too high.${more} Swing a little smaller.` : `Only ${NUM_WORDS[r]}! Too low.${more} Swing a bit bigger!`);
          g.st = 'miss'; g.stT = 0;
        }
      }
      g.msgT = 1.8;
    },
    update(g, dt) {
      g.stT += dt; g.ring = Math.max(0, g.ring - dt * 0.6); g.padT -= dt; g.litT = Math.max(0, g.litT - dt * 0.35); g.msgT -= dt;
      if (g.st === 'aim') {
        if (pointer.clicked && pointer.y > 64) g.drag = true;
        if (g.drag) {
          let a = Math.atan2(pointer.y - HS.hy, pointer.x - HS.hx) / D2R;
          if (a > 100) a -= 360;
          const want = clamp(a, HS.back, HS.rest);
          g.th = pointer.clicked ? want : lerp(g.th, want, Math.min(1, dt * 25));
          if (!pointer.down) this.slam(g);
        } else {
          if (keys.arrowup || keys.arrowleft || keys.w) g.th = Math.max(HS.back, g.th - 110 * dt);
          if (keys.arrowdown || keys.arrowright || keys.s) g.th = Math.min(HS.rest, g.th + 110 * dt);
          if (pressed[' '] || pressed.enter) this.slam(g);
        }
      } else if (g.st === 'swing') {
        // the hammer whips down; faster for a bigger swing
        const T = 0.16;
        const k = clamp(g.stT / T, 0, 1);
        g.th = lerp(g.swingFrom, HS.rest, k * k);
        if (k >= 1) {
          g.st = 'fly'; g.stT = 0; g.padT = 0.2;
          g.peakL = levelOf(g.power); g.v0 = Math.sqrt(2 * HS.G * g.peakL); g.judged = false;
          SFX.hit(); tone(110 + g.power * 120, 0.2, 'square', 0.08); burst(HS.hx + 50, GY - 36, 10, { spread: 90, up: 40 });
        }
      } else if (g.st === 'fly') {
        const t = g.stT, tp = g.v0 / HS.G;
        g.puckL = Math.max(0, g.v0 * t - HS.G * t * t / 2);
        if (!g.judged && t >= tp) { g.judged = true; g.puckL = g.peakL; this.judge(g); }
      } else {
        // puck slides back down after a pause at the top
        const t = Math.max(0, g.stT - 0.5);
        g.puckL = Math.max(0, Math.min(10, g.peakL) - HS.G * t * t / 2);
        if (g.st === 'miss' && g.stT > 1.6) { g.st = 'aim'; g.stT = 0; g.th = HS.rest; g.drag = false; }
        if (g.st === 'yay' && g.stT > 2.1) {
          if (g.endT) { g.done = true; }
          else if (g.round + 1 >= g.rounds) { g.endT = 1; g.stT = 0.6; g.msg = 'Strongest at the fair!'; g.msgT = 2; speak('Ta-da! The strongest girl at the carnival!'); burst(W / 2, 200, 40); }
          else { g.round++; this.next(g); }
        }
      }
      if (g.st !== 'fly') g.puckL = Math.min(g.puckL, 10.2);
      g.progress = `Round ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      // the striker's own little patch of fair: a striped awning, bunting and a sandy stage
      ctx.fillStyle = 'rgba(255,248,236,.35)'; ctx.fillRect(0, 60, W, H - 60);
      bunting(10, 70, 640, 84, 26, 14);
      bunting(820, 84, 955, 70, 14, 4, 2);
      ink(P2('M420,470 L940,470 L955,528 L405,528 Z'), '#ffd0e4', 1.5);
      for (let i = 0; i < 9; i++) star(440 + i * 60, 500, 7, i % 2 ? '#fff6a8' : '#ffffff', 5);
      drawTower(g);

      // Rosie's sign: what to aim for
      const sx = 40, sy = 96, sw = 330, sh = 150;
      inkRect(sx + 40, sy + sh - 4, 12, GY - sy - sh + 4, '#c98a4a', 2, 3); inkRect(sx + sw - 52, sy + sh - 4, 12, GY - sy - sh + 4, '#c98a4a', 2, 3);
      inkRect(sx, sy, sw, sh, '#5a2a6e', 2.5, 18);
      rrect(sx + 10, sy + 10, sw - 20, sh - 20, 12, '#fff4fb');
      const bp = [];
      for (let i = 0; i <= 14; i++) bp.push([sx + 8 + i * (sw - 16) / 14, sy + 5]);
      for (let i = 0; i <= 14; i++) bp.push([sx + 8 + i * (sw - 16) / 14, sy + sh - 5]);
      bulbs(bp, 2);
      const q = g.q, done = g.st === 'yay' && g.hit;
      if (q.bell) {
        text('Ring the', sx + sw / 2, sy + 44, 26, '#5a2a6e', 'center', 800);
        outlined('BELL! 🔔', sx + sw / 2, sy + 96, 52, '#ffcc2e');
      } else {
        text(q.big.length > 2 ? 'Rosie asks…' : 'Stop it on', sx + sw / 2, sy + 40, 24, '#5a2a6e', 'center', 800);
        const big = done || g.showAns ? (q.big === String(q.t) ? q.big : `${q.big} = ${q.t}`) : q.big.length > 2 ? `${q.big} = ?` : q.big;
        outlined(big, sx + sw / 2, sy + 94, big.length > 9 ? 40 : 64, done ? '#7cf09a' : '#ffd83a');
      }
      // Rosie on her podium and the prize ribbons she hands out
      ink(P2('M140,470 L150,414 L260,414 L270,470 Z'), '#ff6f8f', 2);
      ctx.fillStyle = '#fff4fb'; for (let i = 0; i < 3; i++) ctx.fillRect(168 + i * 30, 416, 12, 52);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.strokeRect(150, 414, 110, 0);
      emoji('👩‍🎤', 205, 372, 84);
      emoji('📣', 262, 360, 36);
      for (let i = 0; i < g.rounds; i++) rosette(205 - (g.rounds - 1) * 22 + i * 44, 276, 17, RAIN[i % 6], g.won[i]);

      // the swing gauge: a rainbow arc showing how far back the hammer is
      if (g.st === 'aim') {
        ctx.lineWidth = 12; ctx.lineCap = 'round';
        for (let i = 0; i < 18; i++) {
          const a0 = HS.rest - i / 18 * (HS.rest - HS.back), a1 = HS.rest - (i + 1) / 18 * (HS.rest - HS.back);
          const on = a1 >= g.th - 0.1;
          ctx.strokeStyle = on ? mix('#5adc7a', '#ff5f7e', i / 17) : 'rgba(255,255,255,.45)';
          ctx.beginPath(); ctx.arc(HS.hx, HS.hy, HS.len + 30, a1 * D2R, a0 * D2R); ctx.stroke();
        }
        ctx.lineCap = 'butt';
        // last try's swing as a ghost, with where it got to
        if (g.last && g.tier < 3 && g.tries > 0) {
          drawHammer(g.last.th, 0.28);
          const a = g.last.th * D2R, gx = HS.hx + Math.cos(a) * (HS.len + 2), gy = HS.hy + Math.sin(a) * (HS.len + 2);
          inkCircle(gx, gy, 17, '#fff4fb', 1.2); text(String(g.last.r), gx, gy + 1, 18, '#5a2a6e', 'center', 800);
        }
      }
      // Aubrey and her hammer
      const twirl = g.endT > 0;
      if (twirl) { drawAubrey(HS.ax + 20, GY + 14, 'twirl', 1, Math.abs(Math.sin(S.t * 5)) * 10, 0.72); }
      else { drawAubrey(HS.ax, GY + 14, 'cast', 1, 0, 0.8); drawHammer(g.th); }
      if (g.st === 'aim' && !g.drag && g.th === HS.rest && g.stT > 1) {
        const k = (S.t * 0.8) % 1, a = (HS.rest - k * 150) * D2R;
        emoji('👆', HS.hx + Math.cos(a) * (HS.len + 10), HS.hy + Math.sin(a) * (HS.len + 10) + 14, 40);
        darkPanel(400, 72, 260, 40, 20); text('Pull the hammer back!', 530, 92, 18, '#fff', 'center', 700);
      }
      if (g.msgT > 0 && g.msg) {
        const col = g.hit || g.endT ? '#7cf09a' : '#ffb0c4';
        outlined(g.msg, g.endT ? W / 2 : 540, g.endT ? 210 : 150, g.endT ? 50 : 42, col);
        if (!g.hit && !g.endT && g.reached) emoji(g.msg === 'Too high!' ? '⬇️' : '⬆️', 540, 196, 34);
      }
    },
  };

  restage('carnival', {
    games: [['highstriker', 'ribbon', {}], ['lineupordinals', 'crystal', {}]],
    intro: ['*:Music, twinkly lights and the smell of popcorn! A carnival has come to town.',
      'N:Step right up! Oh dear, my strongman has the hiccups, and nobody is ringing the High Striker!',
      'N:Swing the big hammer! A BIG swing sends the puck up high, and a little swing keeps it low. Can you make it stop on my numbers?',
      'A:determined:Big swing, little swing... I can do it!'],
  });
}
