'use strict';
// Tinker's Toy Shop: Domino Dash replaces the Claw Machine.
// Tinker Bot pushes the first domino; Aubrey races along under the shelf filling the gaps
// before the toppling wave gets there. A falling domino only knocks the next one over if
// that one is closer than the domino is tall, so gaps must be filled with close spacing.
{
  const RAIN = ['#ff5f7e', '#ffa040', '#ffd83a', '#5adc7a', '#40b0ff', '#9c6cff'];
  const DD = { sy: 318, w: 14, h: 58, x0: 112, step: 36, n: 21, toyX: 884, gy: 514, reach: 0.9 };
  DD.face = DD.toyX - 22; // where the end toy's trigger plate sits
  const reachDx = DD.w + DD.h * DD.reach; // centre-to-centre gap a domino can still knock over
  const TOYS = [
    { k: 'bell', name: 'bell', say: 'Ding ding! The bell rang!' },
    { k: 'jack', name: 'jack-in-the-box', say: 'POP! Out jumps the jack-in-the-box!' },
    { k: 'rocket', name: 'toy rocket', say: 'Whoosh! The rocket blasts off!' },
    { k: 'top', name: 'spinning top', say: 'Wheee! The top is spinning!' },
  ];

  // ---------------------------------------------------------------- drawing bits
  const drawDomino = (d, alpha = 1) => {
    // rotates about its bottom-right corner as it tips to the right
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(d.x + DD.w / 2, DD.sy); ctx.rotate(d.th);
    const s = d.pop == null ? 1 : 0.4 + 0.6 * d.pop;
    ctx.translate(-DD.w / 2, 0); ctx.scale(s, s); ctx.translate(-DD.w / 2, 0);
    inkRect(-DD.w / 2, -DD.h, DD.w, DD.h, d.col, 2.5, 3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-DD.w / 2 + 3, -DD.h + 3, 3, DD.h - 6);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(-DD.w / 2 + 2, -DD.h / 2 - 1, DD.w - 4, 2);
    circle(0, -DD.h * 0.75, 2.4); circle(0, -DD.h * 0.25, 2.4);
    ctx.restore();
  };
  const shelf = () => {
    // a long wooden shelf with brass brackets, and a felt runner for the dominoes
    for (const bx of [150, 400, 640, 870]) {
      ink(P2(`M${bx - 6},${DD.sy + 14} L${bx + 6},${DD.sy + 14} L${bx + 6},${DD.sy + 44} L${bx - 6},${DD.sy + 30} Z`), '#e8b84a', 1.2);
    }
    inkRect(30, DD.sy, 900, 16, '#c8844a', 2.5, 5);
    ctx.fillStyle = '#e2a464'; ctx.fillRect(34, DD.sy + 2, 892, 4);
    ctx.strokeStyle = 'rgba(120,70,40,.35)'; ctx.lineWidth = 1.5;
    for (let x = 90; x < 930; x += 120) { ctx.beginPath(); ctx.moveTo(x, DD.sy + 7); ctx.lineTo(x + 30, DD.sy + 7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,111,181,.55)'; ctx.fillRect(80, DD.sy - 3, 790, 3);
  };
  const backWall = () => {
    // a soft pegboard behind the run so the dominoes stand out from the busy shelves
    rrect(24, 150, 912, 178, 22, 'rgba(255,246,236,.9)', '#e9c79b', 3);
    ctx.fillStyle = 'rgba(200,150,110,.32)';
    for (let y = 166; y < 320; y += 22) for (let x = 44 + ((y / 22) % 2) * 11; x < 924; x += 22) circle(x, y, 2.2);
  };
  const toy = (g) => {
    const kind = g.toy.k, x = DD.toyX, y = DD.sy, on = g.toyT; // on: seconds since it was set off (or -1)
    // the trigger plate the last domino has to hit
    inkRect(DD.face - 2, y - 30, 8, 30, on >= 0 ? '#ffd83a' : '#ff8fc8', 2, 2);
    if (kind === 'bell') {
      inkRect(x - 4, y - 92, 8, 92, '#b07a4a', 2, 3); inkRect(x - 24, y - 96, 48, 8, '#b07a4a', 2, 3);
      const sw = on >= 0 ? Math.sin(on * 18) * Math.max(0, 1 - on / 1.6) * 0.6 : 0;
      ctx.save(); ctx.translate(x + 16, y - 88); ctx.rotate(sw);
      ink(P2('M-14,30 C-14,8 -8,2 0,2 C8,2 14,8 14,30 L18,36 L-18,36 Z'), '#ffd83a', 1.5);
      inkCircle(0, 38, 4, '#e8a83a', 1); ctx.restore();
      if (on >= 0 && on < 1.4) for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(255,190,60,${1 - on / 1.4})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 16, y - 60, 30 + i * 12 + on * 30, -0.9, 0.9); ctx.stroke(); }
    } else if (kind === 'jack') {
      const up = on >= 0 ? Math.min(1, on * 4) * (1 + Math.sin(on * 14) * 0.12 * Math.max(0, 1 - on)) : 0;
      if (up > 0) {
        ctx.strokeStyle = '#c0c8d8'; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i <= 8; i++) ctx.lineTo(x + (i % 2 ? 8 : -8), y - 40 - i * 7 * up);
        ctx.stroke();
        const hy = y - 40 - 56 * up;
        inkCircle(x, hy - 10, 16, '#fff0dc', 1.5); ctx.fillStyle = '#ff5f7e'; circle(x, hy - 8, 4);
        ctx.fillStyle = OL; circle(x - 6, hy - 14, 2); circle(x + 6, hy - 14, 2);
        ink(P2(`M${x - 16},${hy - 20} L${x},${hy - 46} L${x + 16},${hy - 20} Z`), '#40b0ff', 1.2);
      }
      inkRect(x - 26, y - 44, 52, 44, '#9c6cff', 2.5, 4); star(x, y - 22, 12, '#ffd83a', 5);
      ctx.save(); ctx.translate(x - 26, y - 44); ctx.rotate(-1.9 * Math.min(1, up * 2));
      inkRect(0, -6, 52, 6, '#ff8fc8', 2, 2); ctx.restore();
    } else if (kind === 'rocket') {
      inkRect(x - 26, y - 10, 52, 10, '#8a9ab8', 2, 3);
      const ry = on >= 0 ? -Math.pow(Math.max(0, on - 0.15), 2) * 420 : 0;
      ctx.save(); ctx.translate(x, y - 12 + ry + (on >= 0 && on < 0.15 ? Math.sin(on * 120) * 2 : 0));
      if (on >= 0) { const f = 18 + Math.sin(S.t * 40) * 6; ink(P2(`M-8,0 Q0,${f + 14} 8,0 Z`), '#ffa040', 1); ctx.fillStyle = '#ffd83a'; tri(-4, 0, 4, 0, 0, f); }
      ink(P2('M-14,0 L-22,8 L-14,-14 Z'), '#ff5f7e', 1.2); ink(P2('M14,0 L22,8 L14,-14 Z'), '#ff5f7e', 1.2);
      ink(P2('M-12,0 L-12,-44 C-12,-60 0,-72 0,-72 C0,-72 12,-60 12,-44 L12,0 Z'), '#f4f6ff', 1.5);
      inkCircle(0, -40, 6, '#40b0ff', 1); ctx.fillStyle = '#ff5f7e'; ctx.fillRect(-11, -12, 22, 5);
      ctx.restore();
    } else {
      const spin = on >= 0 ? on * 26 : 0, wob = on >= 0 ? Math.sin(on * 5) * 0.12 : 0.5;
      ctx.save(); ctx.translate(x + (on >= 0 ? Math.sin(on * 3) * 8 : 6), y); ctx.rotate(wob);
      ink(P2('M-26,-30 C-26,-40 26,-40 26,-30 L2,0 L-2,0 Z'), '#ffd83a', 1.5);
      for (let i = 0; i < 4; i++) { const a = spin + i * 1.57, sx = Math.sin(a) * 22; if (Math.cos(a) > 0) { ctx.fillStyle = RAIN[i]; ctx.fillRect(sx - 4, -34, 8, 10); } }
      inkRect(-3, -50, 6, 14, '#ff5f7e', 1.5, 2);
      ctx.restore();
    }
  };

  // ---------------------------------------------------------------- the game
  MG.dominodash = {
    kind: 'action', title: () => 'Domino Dash', icon: () => '🁢',
    how: () => 'Tinker Bot pushes the first domino! Tap the gaps to stand up new dominoes before the wave gets there. Keep them close: a domino can only reach as far as it is tall! Or move with the arrows and press SPACE.',
    init(g) {
      Object.assign(g, { rounds: [3, 4, 4][g.tier - 1], round: 0, total: 0, ax: 300, atx: null, aFrame: 'idle_front', aT: 0, face: 1, st: 'lead', stT: 0, msg: '' });
      g.say = 'Fill the gaps before the dominoes fall! Keep them close together.';
      this.setup(g);
    },
    start(g) { speak(g.say); },
    setup(g) {
      const T = g.tier, nGaps = [2, 3, 3][T - 1], sizes = [[2, 3], [2, 3, 4], [3, 4]][T - 1];
      // choose gap spans on the domino slots, never right at the start and never touching each other
      let gaps;
      for (let tries = 0; tries < 200; tries++) {
        gaps = []; let i = 3, ok = true;
        const ks = Array.from({ length: nGaps }, () => pick(sizes));
        const spare = DD.n - 2 - i - ks.reduce((a, b) => a + b, 0) - (nGaps - 1) * 2;
        if (spare < 0) { ok = false; continue; }
        let left = spare;
        for (const k of ks) { const skip = randInt(0, Math.min(left, 4)); left -= skip; i += skip; gaps.push([i, k]); i += k + 2; }
        if (ok && i <= DD.n - 1) break;
      }
      const missing = new Set(); gaps.forEach(([s, k]) => { for (let j = 0; j < k; j++) missing.add(s + j); });
      g.doms = [];
      for (let i = 0; i < DD.n; i++) if (!missing.has(i)) g.doms.push(this.mk(DD.x0 + i * DD.step, RAIN[i % 6], false));
      g.gaps = gaps.map(([s, k]) => ({ a: DD.x0 + (s - 1) * DD.step, b: DD.x0 + (s + k) * DD.step, k }));
      const need = gaps.reduce((a, [, k]) => a + k, 0);
      g.left = need + [1, 0, -1][T - 1];
      g.toy = TOYS[g.round % TOYS.length]; g.toyT = -1;
      g.st = 'lead'; g.stT = 0; g.wobble = 0; g.fail = null;
      g.K = [5, 9, 14][T - 1];
      g.lead = [3.5, 2.8, 2.2][T - 1];
    },
    mk(x, col, placed) { return { x, col, th: 0, om: 0, st: 'up', placed, pop: placed ? 0 : null }; },
    // next domino (or the toy) standing to the right of domino d
    nextOf(g, d) {
      let best = null;
      for (const o of g.doms) if (o.x > d.x && (!best || o.x < best.x)) best = o;
      return best;
    },
    // where the wave has got to: nothing can be placed left of this
    front(g) {
      let f = 0;
      for (const d of g.doms) if (d.st !== 'up') f = Math.max(f, d.x + DD.w / 2 + DD.h * Math.sin(Math.min(d.th, Math.PI / 2)));
      return f;
    },
    // can a domino go at x? returns 'ok', 'close', 'late' or 'none'
    check(g, x) {
      if (g.left <= 0) return 'none';
      if (x < this.front(g) + DD.w || x < DD.x0 + 10) return 'late';
      if (x > DD.face - DD.w) return 'close';
      for (const d of g.doms) if (Math.abs(d.x - x) < DD.w + 6) return 'close';
      return 'ok';
    },
    // will a domino at x be knocked over by its left neighbour? (for the green/red ghost)
    reaches(g, x) {
      let l = null;
      for (const d of g.doms) if (d.x < x && (!l || d.x > l.x)) l = d;
      return l ? { l, ok: x - l.x <= reachDx } : { l: null, ok: true };
    },
    place(g, x) {
      const c = this.check(g, x);
      if (c !== 'ok') {
        SFX.miss?.();
        if (c === 'none') floatText(x, DD.sy - 90, 'No dominoes left!', '#ffb0c4', false, 22);
        else if (c === 'late') floatText(x, DD.sy - 90, 'Too late!', '#ffb0c4', false, 22);
        return false;
      }
      const d = this.mk(x, RAIN[randInt(0, 5)], true);
      g.doms.push(d); g.left--;
      tone(660 + rand(-40, 40), 0.07, 'triangle', 0.08); tone(990, 0.06, 'sine', 0.05, 0.05);
      g.aFrame = 'cast'; g.aT = 0.25;
      return true;
    },
    update(g, dt, id) {
      g.stT += dt; g.aT -= dt;
      for (const d of g.doms) if (d.pop != null) d.pop = Math.min(1, d.pop + dt * 6);
      const playing = g.st === 'lead' || g.st === 'run';
      // --- Aubrey: tap the shelf to stand a domino there, or walk with the arrows and press space
      const inZone = pointer.y > 140 && pointer.y < 530 && pointer.x > 40 && pointer.x < 920;
      if (pointerMoved(g) && inZone) g.ghostX = pointer.x;
      let moving = false;
      if (goLeft() || goRight()) { g.usePointer = false; g.atx = null; const v = goRight() ? 1 : -1; g.ax += v * 380 * dt; g.face = v; moving = true; }
      if (playing && pointer.clicked && !id && inZone) {
        g.usePointer = true; g.ghostX = pointer.x;
        if (this.place(g, pointer.x)) g.atx = pointer.x;
        else g.atx = pointer.x;
      }
      if (playing && (pressed[' '] || pressed.arrowup || pressed.enter)) this.place(g, g.ax);
      if (g.atx != null) {
        const d = g.atx - g.ax;
        if (Math.abs(d) < 3) g.atx = null; else { g.ax += clamp(d, -620 * dt, 620 * dt); g.face = Math.sign(d); moving = true; }
      }
      g.ax = clamp(g.ax, 60, 900);
      if (g.aT <= 0) {
        if (g.st === 'win') g.aFrame = 'twirl';
        else if (moving) g.aFrame = 'run' + (1 + Math.floor(g.t * 12) % 5);
        else g.aFrame = 'idle_front';
      }

      // --- the toppling dominoes
      if (g.st === 'lead' && g.stT >= g.lead) {
        g.st = 'run'; g.stT = 0;
        const first = g.doms.reduce((a, b) => (a.x < b.x ? a : b));
        first.st = 'fall'; first.om = 2; tone(300, 0.12, 'square', 0.05); floatText(70, DD.sy - 120, 'BOOP!', '#fff6a8', false, 26);
      }
      if (g.st === 'run' || g.st === 'win' || g.st === 'stop') {
        // lean/fall from right to left so a leaning domino follows the one it rests on
        const order = [...g.doms].sort((a, b) => b.x - a.x);
        for (const d of order) {
          if (d.st === 'fall') {
            d.om += g.K * (Math.sin(d.th) + 0.25) * dt; d.th += d.om * dt;
            const nx = this.nextOf(g, d);
            const faceX = nx ? nx.x - DD.w / 2 : DD.face;
            const need = (faceX - (d.x + DD.w / 2)) / DD.h;
            if (need <= DD.reach && Math.sin(d.th) >= need) {
              d.st = 'lean'; d.need = need; d.on = nx;
              if (nx) { nx.st = 'fall'; nx.om = Math.max(1.5, d.om * 0.5); tone(500 + nx.x * 0.8, 0.05, 'triangle', 0.06); }
              else if (g.toyT < 0) {
                g.toyT = 0; g.st = 'win'; g.stT = 0; burst(DD.toyX, DD.sy - 60, 30);
                g.total += 1; speak(g.toy.say);
                if (g.toy.k === 'bell') [1319, 1568, 1319, 1568].forEach((f, i) => tone(f, 0.4, 'sine', 0.08, i * 0.18));
                else if (g.toy.k === 'jack') { tone(300, 0.1, 'square', 0.05, 0, 900); SFX.pop(); }
                else if (g.toy.k === 'rocket') tone(200, 1.2, 'sawtooth', 0.04, 0, 1200);
                else [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.06, i * 0.1));
              }
            } else if (d.th >= Math.PI / 2) {
              d.th = Math.PI / 2; d.st = 'flat';
              if (g.st === 'run') {
                // the chain has stopped: this domino fell into a gap that was too wide
                g.st = 'stop'; g.stT = 0; SFX.fail?.();
                const nxx = nx ? nx.x : DD.face;
                g.fail = { x: d.x + DD.w / 2 + DD.h / 2, gapTo: nxx };
                const fallen = g.doms.filter(o => o.st !== 'up').length;
                g.total += 0.35 * fallen / g.doms.length;
                speak(nx ? 'Oh no! Too far apart. A domino can only reach as far as it is tall.' : 'Oh no! It stopped.');
              }
            }
          }
          if (d.st === 'lean') {
            const base = Math.asin(clamp(d.need, 0, 1));
            const follow = d.on ? Math.min(d.on.th, Math.PI / 2) : 0.15 * Math.min(1, g.toyT * 3 + 0.01);
            d.th = Math.min(1.42, base + follow * (1 - d.need) * 0.9);
          }
        }
      }
      if (g.toyT >= 0) g.toyT += dt;
      if ((g.st === 'win' && g.stT > 2.4) || (g.st === 'stop' && g.stT > 2.8)) {
        g.round++;
        if (g.round >= g.rounds) { g.done = true; }
        else { this.setup(g); speak(`Run ${g.round + 1}! ${g.say}`); }
      }
      g.progress = `Run ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      backWall();
      // the instruction strip and the dominoes left in Aubrey's tray
      rrect(200, 68, 560, 68, 20, 'rgba(48,24,72,.93)');
      const lead = g.st === 'lead' ? Math.ceil(g.lead - g.stT) : 0;
      const head = g.st === 'lead' ? `Fill the gaps! Tinker pushes in ${lead}...` : g.st === 'run' ? 'Quick! Fill the gaps!' : g.st === 'win' ? `The ${g.toy.name} went off! BEEP BOOP!` : 'The chain stopped!';
      text(head, 480, 90, 20, '#fff', 'center', 700);
      text('Dominoes left:', 380, 116, 15, 'rgba(255,255,255,.85)', 'right', 600);
      for (let i = 0; i < Math.max(g.left, 0); i++) { const x = 396 + i * 16; inkRect(x, 106, 10, 20, RAIN[i % 6], 1.5, 2); ctx.fillStyle = '#fff'; circle(x + 5, 111, 1.4); circle(x + 5, 121, 1.4); }
      if (g.left <= 0) text('none', 396, 116, 15, '#ffb0c4', 'left', 700);

      // Tinker Bot at the start of the run, ready to push
      drawCritter('Tinker Bot', 64, DD.sy, 0.42, 1);
      if (g.st === 'lead') outlined(String(Math.ceil(g.lead - g.stT)), 64, DD.sy - 120, 30, '#fff6a8');
      shelf();
      toy(g);

      // ghost domino and its reach arc, so Aubrey can see whether the gap is small enough
      const playing = g.st === 'lead' || g.st === 'run';
      const gx = g.usePointer ? g.ghostX : g.ax;
      if (playing && gx != null) {
        const c = this.check(g, gx), r = this.reaches(g, gx);
        if (c === 'ok') {
          const good = r.ok;
          if (r.l) {
            // the arc the left neighbour's top sweeps as it falls
            const px = r.l.x + DD.w / 2;
            ctx.setLineDash([5, 6]); ctx.strokeStyle = good ? 'rgba(60,180,90,.85)' : 'rgba(240,80,100,.85)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(px, DD.sy, DD.h, -Math.PI / 2, -Math.PI / 2 + Math.asin(DD.reach)); ctx.stroke(); ctx.setLineDash([]);
          }
          ctx.save(); ctx.globalAlpha = 0.55;
          inkRect(gx - DD.w / 2, DD.sy - DD.h, DD.w, DD.h, good ? '#7ce89a' : '#ff8a9a', 2.5, 3); ctx.restore();
          if (!good) text('too far!', gx, DD.sy - DD.h - 14, 15, '#e0406a', 'center', 800);
        }
      }
      // dominoes: standing ones first, then fallen ones on top
      for (const d of g.doms) if (d.st === 'up') drawDomino(d);
      for (const d of g.doms) if (d.st !== 'up') drawDomino(d);
      // in the lead-in, little dashed brackets show where the gaps are
      if (g.st === 'lead' || g.st === 'run') {
        for (const gp of g.gaps) {
          const filled = g.doms.some(d => d.placed && d.x > gp.a && d.x < gp.b);
          if (filled) continue;
          ctx.strokeStyle = 'rgba(255,111,181,.8)'; ctx.lineWidth = 2.5; ctx.setLineDash([4, 5]);
          ctx.beginPath(); ctx.moveTo(gp.a + 12, DD.sy + 26); ctx.lineTo(gp.b - 12, DD.sy + 26); ctx.stroke(); ctx.setLineDash([]);
          text('gap', (gp.a + gp.b) / 2, DD.sy + 38, 13, '#c03a8a', 'center', 800);
        }
      }
      if (g.st === 'stop' && g.fail) {
        const fx = (g.fail.x + g.fail.gapTo) / 2;
        outlined('Too far apart!', clamp(fx, 120, 840), DD.sy - 110, 28, '#ffb0c4');
        emoji('👇', clamp(fx, 120, 840), DD.sy - 76, 30);
      }
      if (g.st === 'win') outlined('Hooray!', DD.toyX - 120, DD.sy - 120, 32, '#fff6a8');

      // Aubrey runs along the floor under the shelf
      drawAubrey(g.ax, DD.gy, g.aFrame, g.face, g.aFrame === 'twirl' ? Math.abs(Math.sin(g.t * 6)) * 8 : 0);
      text('Tap a gap to add a domino', 480, 528, 13, 'rgba(90,42,110,.75)', 'center', 700);
    },
  };

  restage('toyshop', {
    games: [['dominodash', 'crystal', {}], ['robotcode', 'ribbon', {}]],
    intro: ['*:Toys are stacked all the way to the ceiling, and a little train toots along the top shelf.',
      'N:BEEP BOOP. Welcome. To. Tinker\'s. Toy. Shop.',
      'N:I. Built. A. Domino. Run. To. Wake. Up. The. Toys. But. Some. Dominoes. Are. Missing.',
      'N:When. I. Push. The. Dominoes. Fall. Fill. The. Gaps. Fast. Too. Far. Apart. And. The. Chain. Stops.',
      "A:excited:A domino race! Let's make them fall all the way to the toy!"],
    mid: ['N:BEEP. Excellent. Toppling. Now. My. Toy. Robot. Is. Lost. On. The. Play. Mat.',
      'N:It. Only. Understands. Arrows. Plan. Every. Step. Then. Press. GO.',
      'A:thinking:Like giving it directions, one square at a time!'],
    outro: ['N:PROGRAM. COMPLETE. You. Are. A. Real. Coder. BOOP.',
      'N:Take. Glass. Crystals. And. Ribbons.',
      'A:laughing:Thank. You. Tinker. Bot!'],
  });
}
