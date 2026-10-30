'use strict';
// Shooting Star Hill, game 2 reworked: Star Hopscotch. A chalk hopscotch path of numbered stars;
// Aubrey hops the skip-count pattern (2s, 5s, 10s) and the player aims her hop onto the missing number.
{
  const tryScore = wrongs => [1, 0.5, 0.2, 0][Math.min(3, wrongs)];
  const STEP_WORD = { 2: 'twos', 5: 'fives', 10: 'tens' };
  const glow = (x, y, r, rgb, a = 0.6) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // a chubby five-point star path (round enough to hold a two-digit number)
  const starPath = (x, y, r, inner = 0.6, wob = 0) => {
    const p = new Path2D();
    for (let i = 0; i < 10; i++) {
      const rr = (i % 2 ? r * inner : r) * (1 + Math.sin(i * 2.3 + wob) * 0.03), a = i * Math.PI / 5 - Math.PI / 2;
      p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    p.closePath(); return p;
  };
  // the step size picks how far apart the stars sit, so a whole hop always fits on screen
  const SPACING = { 2: 80, 5: 70, 10: 62 };
  const X0 = 70, AUB_S = 0.5;
  const starY = i => 372 + Math.sin(i * 0.8) * 26 + (i % 2 ? 8 : -8);
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

  MG.starhopscotch = {
    kind: 'learn', title: () => 'Star Hopscotch', icon: () => '⭐',
    how: () => 'Aubrey hops along the star path counting by twos, fives or tens. Aim {her|his} hop at the missing number with the arrows or by tapping a star, then press Hop!',
    init(g) {
      const rounds = [5, 6, 6][g.tier - 1];
      Object.assign(g, { round: 0, rounds, total: 0, fx: 0, parts: [] });
      this.next(g);
    },
    start(g) { speak(g.say); },
    next(g) {
      const steps = g.tier === 1 ? [2, 5, 2, 5, 10] : [2, 5, 10, 2, 5, 10];
      const step = steps[g.round % steps.length];
      const seq = Array.from({ length: 5 }, (_, i) => (i + 1) * step);
      const miss = g.tier === 1 ? randInt(3, 4) : g.tier === 2 ? randInt(1, 4) : randInt(0, 4);
      const sp = SPACING[step], N = step * 5;
      Object.assign(g, {
        step, seq, miss, sp, N, answer: seq[miss], at: 0, lit: [0], arcs: [], wrongs: 0, reveal: false,
        queue: seq.slice(0, miss), state: 'auto', wait: 0.7, hop: null, marker: 1, rep: 0, idle: 0,
        bubble: null, wobble: 0, cam: 0, cheer: 0, sparkle: 0,
      });
      g.say = `Count by ${STEP_WORD[step]}! ${seq.map((v, i) => (i === miss ? 'hmm' : v)).join(', ')}. Hop Aubrey to the missing number!`;
      if (g.phase === 'play') speak(g.say);
    },
    sx: (g, i) => X0 + i * g.sp,
    from: g => (g.miss ? g.seq[g.miss - 1] : 0),
    startHop(g, to, kind) {
      const n = Math.abs(to - g.at);
      g.hop = { a: g.at, b: to, k: 0, dur: Math.min(0.95, 0.5 + n * 0.035), h: Math.min(150, 60 + n * 9), kind, pre: 0.12 };
      g.state = 'hop'; SFX.jump();
    },
    land(g) {
      const { b, kind } = g.hop, x = this.sx(g, b), y = starY(b);
      g.at = b; g.hop = null;
      if (kind === 'auto' || kind === 'rest') {
        const idx = g.seq.indexOf(b);
        if (!g.lit.includes(b)) g.lit.push(b);
        g.arcs.push({ a: idx ? g.seq[idx - 1] : 0, b, col: kind === 'rest' ? '#ffe14a' : '#fff6a8' });
        tone(kind === 'rest' ? 523 * Math.pow(1.122, idx + 1) : 392 * Math.pow(1.122, idx), 0.2, 'triangle', 0.07);
        burst(x - g.cam, y, kind === 'rest' ? 14 : 8);
        g.state = kind; g.wait = kind === 'rest' ? 0.12 : 0.25;
      } else if (kind === 'try') {
        if (b === g.answer) {
          g.total += tryScore(g.wrongs);
          if (!g.lit.includes(b)) g.lit.push(b);
          g.arcs.push({ a: this.from(g), b, col: '#7ff0a0' });
          SFX.sparkle(); burst(x - g.cam, y, 28); g.sparkle = 1.4; g.cheer = 2.5;
          [0, 0.1, 0.2].forEach((d, i) => tone([784, 988, 1175][i], 0.25, 'sine', 0.06, d));
          floatText(x - g.cam, y - 120, `${b}!`, '#7ff0a0', false, 30);
          speak(`Yes! ${g.seq.join(', ')}!`);
          g.queue = g.seq.slice(g.miss + 1); g.state = 'rest'; g.wait = 0.55;
        } else {
          g.wrongs++; SFX.miss(); g.wobble = 1.5;
          g.bubble = { i: b, t: 2.4 };
          speak(`That's ${b}! Count on by ${g.step} from ${this.from(g)}.`);
          g.state = 'wrong';
        }
      } else { // hopped back after a miss
        g.marker = g.at + 1;
        g.state = 'aim'; g.idle = 0;
        if (g.wrongs >= 3 && !g.reveal) {
          g.reveal = true; g.marker = g.answer; g.sparkle = 3;
          speak(`It's ${g.answer}! Count by ${STEP_WORD[g.step]}: ${g.seq.slice(0, g.miss + 1).join(', ')}. Hop to ${g.answer}!`);
        }
      }
    },
    update(g, dt, id) {
      g.fx += dt; g.cheer = Math.max(0, g.cheer - dt); g.sparkle = Math.max(0, g.sparkle - dt);
      if (g.bubble && (g.bubble.t -= dt) <= 0) g.bubble = null;
      const from = this.from(g);
      if (g.state === 'auto' || g.state === 'rest') {
        if ((g.wait -= dt) <= 0) {
          if (g.queue.length) this.startHop(g, g.queue.shift(), g.state);
          else if (g.state === 'auto') { g.state = 'aim'; g.marker = from + 1; g.idle = 0; }
          else { g.state = 'yay'; g.wait = 1.8; }
        }
      } else if (g.state === 'aim') {
        g.idle += dt;
        let mv = 0;
        const L = keys.arrowleft || keys.a, R = keys.arrowright || keys.d;
        if (pressed.arrowleft || pressed.a || id === 'left') { mv = -1; g.rep = 0.38; }
        else if (pressed.arrowright || pressed.d || id === 'right') { mv = 1; g.rep = 0.38; }
        else if (L || R) { if ((g.rep -= dt) <= 0) { mv = R ? 1 : -1; g.rep = 0.09; } }
        let go = pressed[' '] || pressed.enter || id === 'hop';
        if (pointer.clicked && !id) {
          for (let i = from + 1; i <= g.N; i++) {
            if (Math.hypot(pointer.x - (this.sx(g, i) - g.cam), pointer.y - starY(i)) < g.sp * 0.55) {
              if (i === g.marker) go = true; else { g.marker = i; SFX.blip(); g.idle = 0; }
              break;
            }
          }
        }
        if (mv) {
          const m = clamp(g.marker + mv, from + 1, g.N);
          if (m !== g.marker) { g.marker = m; tone(440 + (m - from) * 30, 0.06, 'sine', 0.05); }
          g.idle = 0;
        }
        if (g.reveal && g.idle > 5) { g.marker = g.answer; go = true; }
        if (go) this.startHop(g, g.marker, 'try');
      } else if (g.state === 'hop') {
        const h = g.hop;
        if (h.pre > 0) h.pre -= dt;
        else if ((h.k += dt / h.dur) >= 1) { h.k = 1; this.land(g); }
      } else if (g.state === 'wrong') {
        if ((g.wobble -= dt) <= 0) { g.wobble = 0; this.startHop(g, from, 'back'); }
      } else if (g.state === 'yay') {
        if ((g.wait -= dt) <= 0) {
          g.round++;
          if (g.round >= g.rounds) g.done = true; else this.next(g);
        }
      }
      // the camera follows Aubrey (and keeps the aimed star in view)
      const ax = this.aubX(g), worldW = X0 * 2 + g.N * g.sp;
      let target = g.state === 'aim' ? (ax + this.sx(g, g.marker)) / 2 - W / 2 : ax - W * 0.38;
      target = clamp(target, 0, Math.max(0, worldW - W));
      g.cam += (target - g.cam) * Math.min(1, dt * 4);
      g.progress = `Hop ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    aubX(g) {
      if (!g.hop) return this.sx(g, g.at);
      return lerp(this.sx(g, g.hop.a), this.sx(g, g.hop.b), ease(g.hop.k));
    },
    drawStar(g, i, x) {
      const y = starY(i), r = g.sp * 0.45, lit = g.lit.includes(i);
      const aim = g.state === 'aim' && i === g.marker, ans = g.sparkle > 0 && i === g.answer && g.lit.includes(i) === false;
      const seen = g.reveal && i === g.answer;
      if (lit) glow(x, y, r * 2.2, i === g.answer ? '150,255,180' : '255,235,140', 0.55 + 0.1 * Math.sin(S.t * 3 + i));
      if (aim) glow(x, y, r * 2.4, '255,210,90', 0.65 + 0.15 * Math.sin(S.t * 6));
      if (seen || ans) glow(x, y, r * 2.6, '160,255,200', 0.5 + 0.3 * Math.sin(S.t * 8));
      const p = starPath(x, y, r, 0.6, i);
      ctx.fillStyle = lit ? (i === g.answer ? '#8ff0b0' : '#ffe56a') : aim ? 'rgba(255,214,110,.55)' : 'rgba(40,30,100,.55)';
      ctx.fill(p);
      // chalk outline: two slightly offset wobbly strokes read as hand-drawn chalk
      ctx.lineJoin = 'round';
      ctx.strokeStyle = lit ? 'rgba(255,255,255,.95)' : 'rgba(245,245,255,.85)'; ctx.lineWidth = 3.2; ctx.stroke(p);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
      ctx.stroke(starPath(x + 1.5, y - 1, r * 1.04, 0.6, i + 3));
      const big = String(i).length > 1 ? 21 : 24;
      text(String(i), x, y + 3, big, lit ? '#5a2a6e' : '#ffffff', 'center', 800);
      if (seen || ans) for (let k = 0; k < 4; k++) { const a = S.t * 2 + k * TAU / 4; star(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, 5, '#eaffef', 4); }
    },
    draw(g) {
      ctx.fillStyle = 'rgba(10,8,40,.28)'; ctx.fillRect(0, 0, W, H);
      const cam = g.cam, from = this.from(g);
      const vis = i => { const x = this.sx(g, i) - cam; return x > -60 && x < W + 60; };
      // chalk trail between the stars
      ctx.save(); ctx.setLineDash([10, 9]); ctx.strokeStyle = 'rgba(230,230,255,.35)'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= g.N; i++) { const x = this.sx(g, i) - cam, y = starY(i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      outlined('START', this.sx(g, 0) - cam, starY(0) + 50, 15, '#fff6a8');
      outlined('HOME', this.sx(g, g.N) - cam, starY(g.N) + 50, 15, '#fff6a8');
      // hop arcs already made, each with its +step label
      for (const a of g.arcs) {
        const x0 = this.sx(g, a.a) - cam, x1 = this.sx(g, a.b) - cam, y0 = starY(a.a) - 30, y1 = starY(a.b) - 30;
        if (Math.max(x0, x1) < -40 || Math.min(x0, x1) > W + 40) continue;
        const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 60;
        ctx.strokeStyle = a.col; ctx.globalAlpha = 0.8; ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my - 30, x1, y1); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        outlined(`+${a.b - a.a}`, mx, my - 6, 18, a.col);
      }
      for (let i = 0; i <= g.N; i++) if (vis(i)) this.drawStar(g, i, this.sx(g, i) - cam);
      // counting help while aiming: +1, +2 ... from Aubrey's star to the marker, and a dotted preview arc
      if (g.state === 'aim') {
        const n = g.marker - from;
        for (let k = 1; k <= n; k++) {
          const x = this.sx(g, from + k) - cam, y = starY(from + k) + g.sp * 0.45 + 14;
          ctx.fillStyle = k === n ? '#ffd23a' : 'rgba(255,246,168,.9)'; circle(x, y, 4);
          text(`+${k}`, x, y + 14, 13, k === n ? '#ffd23a' : '#fff6c8', 'center', 700);
        }
        const x0 = this.sx(g, from) - cam, x1 = this.sx(g, g.marker) - cam, y0 = starY(from) - 70, y1 = starY(g.marker) - 34;
        const h = Math.min(150, 60 + n * 9);
        ctx.save(); ctx.setLineDash([4, 8]); ctx.lineDashOffset = -S.t * 30; ctx.strokeStyle = 'rgba(255,214,90,.9)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - h, x1, y1); ctx.stroke(); ctx.restore();
        const bob = Math.sin(S.t * 5) * 4;
        ctx.fillStyle = '#ffd23a'; tri(x1 - 11, y1 - 22 + bob, x1 + 11, y1 - 22 + bob, x1, y1 - 8 + bob);
        outlined(`+${n}`, x1, y1 - 36 + bob, 22, '#ffd23a');
      }
      // Aubrey
      const ax = this.aubX(g) - cam;
      if (g.hop) {
        const h = g.hop, back = h.b < h.a, k = ease(h.k);
        const gy = lerp(starY(h.a), starY(h.b), k) + 10, lift = h.pre > 0 ? 0 : Math.sin(Math.PI * h.k) * h.h;
        drawAubrey(ax, gy, h.pre > 0 ? 'crouch' : 'jump', back ? -1 : 1, lift, AUB_S);
      } else {
        const gy = starY(g.at) + 10;
        if (g.wobble > 0) {
          ctx.save(); ctx.translate(ax, gy); ctx.rotate(Math.sin(g.wobble * 18) * 0.18 * Math.min(1, g.wobble));
          drawAubrey(0, 0, 'idle_front', 1, 0, AUB_S); ctx.restore();
        } else drawAubrey(ax, gy, g.cheer > 0 ? 'twirl' : 'idle_front', 1, 0, AUB_S);
      }
      // the wrong star says its own number
      if (g.bubble) {
        const bx = this.sx(g, g.bubble.i) - cam, by = starY(g.bubble.i) - 150;
        const msg = `That's ${g.bubble.i}!`;
        panel(bx - 80, by - 26, 160, 50, 20);
        ctx.fillStyle = '#fff'; tri(bx - 10, by + 22, bx + 10, by + 22, bx + 22, by + 40);
        text(msg, bx, by, 24, '#e0457a', 'center', 800);
      }
      // the pattern at the top
      panel(W / 2 - 300, 66, 600, 64, 22);
      outlined(`Count by ${g.step}s!`, W / 2 - 200, 98, 24, '#ffb13a', 'center', '#fff');
      g.seq.forEach((v, i) => {
        const x = W / 2 - 60 + i * 76, y = 98, gap = i === g.miss, solved = g.lit.includes(v) && (!gap || g.state === 'rest' || g.state === 'yay');
        if (gap && !solved) {
          const p = 1 + Math.sin(S.t * 5) * 0.06;
          inkCircle(x, y, 23 * p, '#ffe14a', 2); text('?', x, y + 2, 26, '#5a2a6e', 'center', 800);
        } else {
          inkCircle(x, y, 23, gap ? '#7ff0a0' : g.lit.includes(v) ? '#fff6a8' : '#f0e8ff', 2);
          text(String(v), x, y + 2, 22, '#5a2a6e', 'center', 800);
        }
        if (i < 4) text(',', x + 34, y + 8, 22, '#9a7aaa', 'center', 800);
      });
      // Twinkle cheers from the corner
      drawCritter('Twinkle the Star', 900, 236 - (g.cheer > 0 ? Math.abs(Math.sin(S.t * 10)) * 16 : 0), 0.5, -1);
      // controls
      const aim = g.state === 'aim';
      button('left', W / 2 - 200, 474, 90, 56, '◀', { on: aim, color: '#4fa8e0', size: 26 });
      button('hop', W / 2 - 95, 474, 190, 56, 'Hop!', { on: aim, color: g.reveal ? '#3fbf6a' : '#ff6fb5', size: 26 });
      button('right', W / 2 + 110, 474, 90, 56, '▶', { on: aim, color: '#4fa8e0', size: 26 });
      if (aim && g.reveal) outlined(`Hop to ${g.answer}!`, W / 2, 452, 20, '#9fffbf');
    },
  };

  restage('shootingstar', {
    games: [['starsling', 'stardust', {}], ['starhopscotch', 'crystal', {}]],
    mid: ["N:You did it! Now come and play star hopscotch with me! We hop along the stars counting by twos, fives and tens, and you aim each hop onto the missing number!", 'A:excited:Two, four, six... hop, hop, hop! I can do that!'],
  });
}
