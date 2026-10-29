'use strict';
// Fairy Ring, game 2: Potion Pour. Capacity and measuring: pour moon-dew from the
// fairy jug and fill bottles to a line, full, half full, the same as / more than /
// less than Pixie's bottle, and a little / more / the most.
{
  const SHELF_Y = 432;
  const LIQ = [
    { name: 'Rose Dew', col: '#ff6fc8' }, { name: 'Mint Glow', col: '#4fe0b4' }, { name: 'Moon Water', col: '#6fbcff' },
    { name: 'Sun Honey', col: '#ffc93a' }, { name: 'Star Syrup', col: '#b07aff' },
  ];
  const PLANS = {
    1: ['line', 'full', 'line', 'same', 'more'],
    2: ['line', 'half', 'same', 'more', 'less'],
    3: ['half', 'same', 'between', 'less', 'order'],
  };
  const PROMPT = {
    line: ['Fill the bottle up to the gold line!', 'Fill it up to the gold line'],
    full: ['Fill the bottle all the way to the top. Make it full, but do not spill!', 'Make it FULL, no spills'],
    half: ['Make the bottle half full. Fill it half way up!', 'Make it HALF full'],
    same: ["Pour the same amount as Pixie's bottle. Make them equal!", "The SAME as Pixie's"],
    more: ["Pour more potion than Pixie's bottle has!", "MORE than Pixie's"],
    less: ["Pour less potion than Pixie's bottle, but not empty!", "LESS than Pixie's (not empty)"],
    between: ["Pour more than Pixie's bottle, but stay under the gold line!", "MORE than Pixie's, UNDER the line"],
    order: ['Fill the three bottles. A little, then more, then the most!', 'A little, more, the MOST'],
  };

  // bottle outline: straight body (level 0..1 = base..base-bh), short shoulders, neck
  const bottlePath = (x, base, bw, bh) => {
    const p = new Path2D(), hw = bw / 2, top = base - bh, nw = Math.max(16, bw * 0.2), sh = 18, nh = 26, r = 22;
    p.moveTo(x - nw, top - sh - nh);
    p.lineTo(x - nw, top - sh);
    p.quadraticCurveTo(x - hw, top - sh + 2, x - hw, top);
    p.lineTo(x - hw, base - r);
    p.quadraticCurveTo(x - hw, base, x - hw + r, base);
    p.lineTo(x + hw - r, base);
    p.quadraticCurveTo(x + hw, base, x + hw, base - r);
    p.lineTo(x + hw, top);
    p.quadraticCurveTo(x + hw, top - sh + 2, x + nw, top - sh);
    p.lineTo(x + nw, top - sh - nh);
    p.closePath();
    return p;
  };
  const mouthY = b => b.base - b.bh - 18 - 26;

  const drawBottle = (b, g, opts = {}) => {
    const { x, base, bw, bh } = b, hw = bw / 2, top = base - bh, path = bottlePath(x, base, bw, bh);
    // glow under the bottle
    const gl = ctx.createRadialGradient(x, base - 6, 4, x, base - 6, bw);
    gl.addColorStop(0, mix(b.col, '#ffffff', 0.3) + '88'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(x - bw, base - 50, bw * 2, 70);
    if (opts.sel) {
      ctx.save(); ctx.globalAlpha = 0.45 + 0.25 * Math.sin(S.t * 5);
      ctx.strokeStyle = '#fff7a0'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.stroke(path); ctx.restore();
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke(path);
    ctx.fillStyle = 'rgba(225,245,255,.55)'; ctx.fill(path);
    // liquid
    const lv = clamp(b.level, 0, 1);
    if (lv > 0.003) {
      const ly = base - lv * bh;
      ctx.save(); ctx.clip(path);
      const lg = ctx.createLinearGradient(0, ly, 0, base);
      lg.addColorStop(0, mix(b.col, '#ffffff', 0.35)); lg.addColorStop(1, mix(b.col, '#5a2a8a', 0.25));
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(x - hw - 4, base + 4);
      for (let i = 0; i <= 12; i++) {
        const px = x - hw - 4 + (bw + 8) * i / 12;
        ctx.lineTo(px, ly + Math.sin(S.t * 4 + i * 0.9 + x) * (b.pouring ? 2.6 : 1.1));
      }
      ctx.lineTo(x + hw + 4, base + 4); ctx.closePath(); ctx.fill();
      // surface shine
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(x, ly + 2, hw * 0.8, 3.5);
      // bubbles
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 6; i++) {
        const h = lv * bh, ph = ((S.t * (0.35 + i * 0.07) + i * 0.37) % 1);
        if (h < 14) break;
        circle(x - hw * 0.6 + ((i * 37) % (bw * 0.9)) * 0.7 + Math.sin(S.t * 3 + i) * 3, base - 6 - ph * (h - 10), 2 + (i % 3));
      }
      ctx.restore();
    }
    // glass shine
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    rrect(x - hw + 9, top + 12, 8, bh - 40, 4, 'rgba(255,255,255,.55)');
    circle(x - hw + 13, base - 18, 3.5);
    // the gold line
    if (opts.line != null) {
      const yy = base - opts.line * bh;
      ctx.save(); ctx.setLineDash([10, 6]); ctx.lineDashOffset = -S.t * 18;
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - hw - 14, yy); ctx.lineTo(x + hw + 14, yy); ctx.stroke();
      ctx.strokeStyle = opts.lineCol || '#ffd84a'; ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(x + hw + 22, yy); ctx.rotate(S.t * 1.5);
      ctx.fillStyle = OL; star(0, 0, 13, OL, 5); star(0, 0, 10, opts.lineCol || '#ffd84a', 5); ctx.restore();
      if (opts.lineLabel) outlined(opts.lineLabel, x - hw - 22, yy, 15, '#fff6a8', 'right');
    }
    // cork
    if (opts.cork) {
      const my = mouthY(b), nw = Math.max(16, bw * 0.2);
      rrect(x - nw - 3, my - 16, nw * 2 + 6, 22, 6, '#c98a4e', OL, 3);
      ctx.fillStyle = '#e8b07a'; rrect(x - nw + 2, my - 13, nw * 2 - 4, 5, 2, '#e8b07a');
      emoji('✨', x + nw + 10, my - 18, 18);
    }
    // spill drips
    if (b.spill > 0) {
      ctx.fillStyle = b.col;
      for (let i = 0; i < 3; i++) {
        const ph = (S.t * 0.8 + i / 3) % 1;
        ellipse(x + (i - 1) * (hw + 6) * 0.9 + (i === 1 ? hw + 4 : 0), mouthY(b) + 30 + ph * (bh - 10), 4, 7);
      }
      ctx.globalAlpha = 0.7; ellipse(x + hw * 0.6, base + 4, hw * 0.9, 6); ctx.globalAlpha = 1;
    }
    if (opts.tag) {
      const w = opts.tag.length * 9 + 26;
      rrect(x - w / 2, base + 26, w, 26, 13, opts.tagCol || '#9a6ae0', '#fff', 2.5);
      text(opts.tag, x, base + 39, 15, '#fff', 'center', 700);
    }
  };

  // the fairy jug: a round lilac pitcher with a flower lid; spout on the left
  const SPOUT = [-50, -20];
  const spoutTip = j => {
    const c = Math.cos(j.tilt), s = Math.sin(j.tilt);
    return [j.x + c * SPOUT[0] - s * SPOUT[1], j.y + s * SPOUT[0] + c * SPOUT[1]];
  };
  const drawJug = (j, col) => {
    ctx.save(); ctx.translate(j.x, j.y); ctx.rotate(j.tilt);
    const handle = new Path2D(); handle.ellipse(36, -2, 16, 20, 0, -Math.PI / 2, Math.PI / 2);
    ctx.strokeStyle = OL; ctx.lineWidth = 13; ctx.stroke(handle); ctx.strokeStyle = '#b48ae8'; ctx.lineWidth = 7; ctx.stroke(handle);
    const spout = P2('M -24 -18 L -52 -26 L -48 -16 L -22 2 Z');
    const body = new Path2D(); body.ellipse(0, 4, 36, 32, 0, 0, Math.PI * 2);
    const neck = new Path2D(); neck.roundRect(-22, -30, 44, 16, 6);
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineJoin = 'round';
    ctx.stroke(spout); ctx.stroke(body); ctx.stroke(neck);
    ctx.fillStyle = '#c8a4f4'; ctx.fill(spout); ctx.fill(neck);
    const bg = ctx.createRadialGradient(-10, -6, 4, 0, 4, 40);
    bg.addColorStop(0, '#efe0ff'); bg.addColorStop(1, '#b48ae8');
    ctx.fillStyle = bg; ctx.fill(body);
    // potion window band
    ctx.save(); ctx.clip(body);
    ctx.fillStyle = col; ctx.fillRect(-40, 10, 80, 8);
    ctx.fillStyle = '#ff9ad6'; ctx.fillRect(-40, 22, 80, 4);
    ctx.restore();
    ctx.fillStyle = '#fff'; ellipse(-14, -6, 7, 4, -0.5);
    // dots
    ctx.fillStyle = '#fff6a8'; circle(14, -4, 3); circle(20, 30, 2.5); circle(-6, 30, 2.5);
    // flower lid
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 + S.t * 0.6;
      inkCircle(Math.cos(a) * 9, -36 + Math.sin(a) * 6, 6, '#ff9ad6', 1.5, OL);
    }
    inkCircle(0, -36, 5, '#ffe36b', 1.5, OL);
    ctx.restore();
  };

  const drawShelf = () => {
    // two toadstool legs under a mossy bark shelf
    for (const lx of [210, 650]) {
      ink(P2(`M ${lx - 20} ${SHELF_Y + 20} Q ${lx - 26} ${SHELF_Y + 80} ${lx - 30} 540 L ${lx + 30} 540 Q ${lx + 26} ${SHELF_Y + 80} ${lx + 20} ${SHELF_Y + 20} Z`), '#fff4e2', 3);
      ctx.fillStyle = 'rgba(200,170,140,.4)'; ctx.fillRect(lx - 4, SHELF_Y + 30, 8, 100);
    }
    ink(P2(`M 150 ${SHELF_Y} L 720 ${SHELF_Y} Q 732 ${SHELF_Y + 12} 720 ${SHELF_Y + 24} L 150 ${SHELF_Y + 24} Q 138 ${SHELF_Y + 12} 150 ${SHELF_Y} Z`), '#a0683e', 3);
    ctx.fillStyle = '#c08550'; ctx.fillRect(152, SHELF_Y + 4, 566, 6);
    ctx.strokeStyle = 'rgba(90,50,30,.5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(170 + i * 64, SHELF_Y + 14); ctx.lineTo(205 + i * 64, SHELF_Y + 16); ctx.stroke(); }
    // moss and tiny mushrooms on the shelf
    ctx.fillStyle = '#6fd08a';
    for (let i = 0; i < 26; i++) ellipse(152 + i * 22, SHELF_Y + 1 + (i % 2), 13, 5);
    [[168, '#ff6f8a'], [712, '#8ac8ff']].forEach(([mx, c]) => {
      ink(P2(`M ${mx - 3} ${SHELF_Y} L ${mx - 3} ${SHELF_Y - 12} L ${mx + 3} ${SHELF_Y - 12} L ${mx + 3} ${SHELF_Y} Z`), '#fff4e2', 1.5);
      ink(P2(`M ${mx - 12} ${SHELF_Y - 11} Q ${mx} ${SHELF_Y - 30} ${mx + 12} ${SHELF_Y - 11} Z`), c, 1.5);
      ctx.fillStyle = '#fff'; circle(mx - 3, SHELF_Y - 18, 2); circle(mx + 5, SHELF_Y - 15, 1.6);
    });
  };

  const drawSpring = () => {
    // the dew cloud the jug rests on, with a bluebell dripping dew into it
    const x = 846, y = 284 + Math.sin(S.t * 1.6) * 3;
    const gl = ctx.createRadialGradient(x, y, 6, x, y, 110);
    gl.addColorStop(0, 'rgba(220,240,255,.6)'); gl.addColorStop(1, 'rgba(220,240,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(x - 120, y - 120, 240, 240);
    const puffs = [[-50, 6, 22], [-24, -6, 28], [6, -10, 30], [36, -4, 26], [58, 8, 20], [0, 12, 30], [-30, 14, 22], [32, 14, 22]];
    ctx.strokeStyle = OL; ctx.lineWidth = 6;
    puffs.forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.stroke(); });
    puffs.forEach(([dx, dy, r]) => { ctx.fillStyle = '#f4ecff'; circle(x + dx, y + dy, r); });
    ctx.fillStyle = '#dccdf6'; ellipse(x + 4, y + 22, 54, 9);
    ctx.fillStyle = '#ffffff'; circle(x - 26, y - 14, 9); circle(x + 4, y - 20, 7);
    for (let i = 0; i < 4; i++) star(x - 60 + i * 40 + Math.sin(S.t + i) * 4, y + 40 + ((S.t * 20 + i * 9) % 20), 4, '#fff6a8', 4);
    // bluebell above
    ctx.strokeStyle = '#3e9a5e'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 104, 60); ctx.quadraticCurveTo(x + 96, 120, x + 50, 140); ctx.stroke();
    inkAt(x + 46, 150, 0.3, P2('M -14 -10 Q 0 -22 14 -10 L 18 12 Q 10 6 6 14 Q 0 6 -6 14 Q -10 6 -18 12 Z'), '#7a9cff', 1.6);
    outlined('Dew Jug', x, y + 58, 16, '#fff');
  };

  MG.potionpour = {
    kind: 'learn', title: () => 'Potion Pour', icon: () => '🧪',
    how: g => g.tier === 1
      ? 'Make fairy potions! Drag the jug over a bottle, or hold your finger on the bottle, to pour. Let go to stop. Fill it just right, then cork it!'
      : 'Make fairy potions! Drag the jug over a bottle, or hold on the bottle, to pour. Let go to stop. Full, half, more, less or the same? Fill it just right, then cork it!',
    init(g) {
      const plan = PLANS[g.tier] || PLANS[1];
      Object.assign(g, {
        plan, round: 0, pts: [], tol: [0.065, 0.055, 0.05][g.tier - 1], rate: [0.2, 0.23, 0.26][g.tier - 1],
        jug: { x: 846, y: 240, tilt: 0, home: [846, 240] }, held: null, sel: 0, phase2: 'pour', judge: null, attempt: 1,
      });
      this.setup(g);
    },
    setup(g) {
      const kind = g.plan[g.round], liq = LIQ[(g.round + g.tier) % LIQ.length];
      g.kind = kind; g.liq = liq; g.attempt = 1; g.phase2 = 'pour'; g.judge = null; g.sel = 0;
      g.sample = null; g.line = null;
      const mk = (x, bw, bh) => ({ x, base: SHELF_Y, bw, bh, level: 0, col: liq.col, spill: 0, pouring: false });
      if (kind === 'order') g.bottles = [mk(380, 78, 150), mk(505, 78, 150), mk(630, 78, 150)];
      else g.bottles = [mk(['line', 'full', 'half'].includes(kind) ? 440 : 500, 100, 180)];
      if (kind === 'line') g.line = Math.round(rand(g.round ? 0.55 : 0.3, g.round ? 0.8 : 0.5) * 100) / 100;
      if (['same', 'more', 'less', 'between'].includes(kind)) {
        const lv = kind === 'same' ? rand(0.4, 0.7) : kind === 'more' ? rand(0.3, 0.55) : kind === 'between' ? rand(0.3, 0.45) : rand(0.45, 0.7);
        if (kind === 'between') g.line = Math.round((lv + 0.3) * 100) / 100;
        g.sample = { x: 270, base: SHELF_Y, bw: 100, bh: 180, level: lv, col: mix(liq.col, '#ffffff', 0.1), spill: 0 };
      }
      g.say = PROMPT[kind][0];
      g.progress = `Potion ${g.round + 1} of ${g.plan.length}`;
    },
    start(g) { speak(g.say); },
    // returns { pts 0..1, msg, hint }
    grade(g) {
      const b = g.bottles[0], lv = b.level, spilled = g.bottles.some(x => x.spill > 0), tol = g.tol;
      const near = (target, t) => {
        const e = Math.abs(lv - target);
        if (e <= t) return 1;
        if (e <= t * 2) return 0.6;
        return 0;
      };
      switch (g.kind) {
        case 'line': case 'half': {
          const target = g.kind === 'line' ? g.line : 0.5, p = spilled ? 0 : near(target, g.kind === 'half' ? tol + 0.02 : tol);
          const what = g.kind === 'line' ? 'the line' : 'half way';
          if (spilled) return { pts: 0, msg: 'Oops, it spilled! That was much too much.' };
          if (p === 1) return { pts: 1, msg: g.kind === 'line' ? 'Just right! Right on the line!' : 'Half full! Half way up. Perfect!' };
          if (p > 0) return { pts: p, msg: `So close! Just a tiny bit ${lv > target ? 'over' : 'under'} ${what}.` };
          return { pts: 0, msg: lv > target ? `Too much! That's over ${what}.` : `Not enough! That's under ${what}.` };
        }
        case 'full':
          if (spilled) return { pts: 0.6, msg: "It's full, but some spilled! Slow down near the top." };
          if (lv >= 0.93) return { pts: 1, msg: 'Full right to the top, and not one drop spilled!' };
          if (lv >= 0.85) return { pts: 0.6, msg: 'Nearly full! Just a little more next time.' };
          return { pts: 0, msg: 'Not full yet! Full means right up to the top.' };
        case 'same': {
          if (spilled) return { pts: 0, msg: 'Oops, it spilled! That was much more than Pixie has.' };
          const p = near(g.sample.level, tol + 0.01);
          if (p === 1) return { pts: 1, msg: "The same! Your bottle and Pixie's are equal!" };
          if (p > 0) return { pts: p, msg: 'Very close to the same!' };
          return { pts: 0, msg: lv > g.sample.level ? "Yours has MORE than Pixie's. Not the same." : "Yours has LESS than Pixie's. Not the same." };
        }
        case 'more':
          if (spilled) return { pts: 0, msg: 'More, but it spilled everywhere! Stop before the top.' };
          if (lv > g.sample.level + 0.06) return { pts: 1, msg: "Yes! Yours has MORE than Pixie's!" };
          if (lv > g.sample.level - 0.04) return { pts: 0, msg: "That looks about the same. MORE means higher than Pixie's!" };
          return { pts: 0, msg: "That's LESS than Pixie's. More means higher!" };
        case 'between':
          if (spilled) return { pts: 0, msg: 'Oops, it spilled! Stay under the gold line.' };
          if (lv > g.line + 0.01) return { pts: 0, msg: "That's more than Pixie's, but it went over the gold line!" };
          if (lv > g.sample.level + 0.05) return { pts: 1, msg: "Yes! More than Pixie's, and under the line!" };
          return { pts: 0, msg: "Not more than Pixie's yet. Go higher, but stay under the line!" };
        case 'less':
          if (lv < 0.04) return { pts: 0, msg: "That's empty! Pour a little bit. Less, but not empty." };
          if (lv < g.sample.level - 0.06) return { pts: 1, msg: "Yes! Yours has LESS than Pixie's!" };
          if (lv < g.sample.level + 0.04) return { pts: 0, msg: "That looks about the same. LESS means lower than Pixie's!" };
          return { pts: 0, msg: "That's MORE than Pixie's. Less means lower!" };
        case 'order': {
          const l = g.bottles.map(x => x.level);
          if (spilled) return { pts: 0, msg: 'Oops, one spilled! The most is not over the top.' };
          if (l[0] < 0.04) return { pts: 0, msg: 'The first bottle needs a little bit, not nothing!' };
          const ok1 = l[1] > l[0] + 0.07, ok2 = l[2] > l[1] + 0.07;
          if (ok1 && ok2) return { pts: 1, msg: 'A little, more, the most! Perfect!' };
          return { pts: ok1 || ok2 ? 0.3 : 0, msg: !ok1 ? 'The middle bottle needs MORE than the first one.' : 'The last bottle needs the MOST of all.' };
        }
      }
      return { pts: 0, msg: '' };
    },
    pourTarget(g) {
      // which bottle the jug is pouring into this frame (or null)
      if (g.phase2 !== 'pour') return null;
      if (g.held === 'jug') {
        for (let i = 0; i < g.bottles.length; i++) {
          const b = g.bottles[i], my = mouthY(b);
          if (Math.abs(pointer.x - (b.x + 40)) < 62 && pointer.y < my + 50 && pointer.y > my - 170) return i;
        }
        return null;
      }
      if (g.held === 'bottle') return g.sel;
      if (keys[' ']) return g.sel;
      return null;
    },
    update(g, dt, id) {
      const j = g.jug;
      if (!pointer.down) g.held = null;
      if (g.phase2 === 'pour') {
        if (pressed.arrowleft) g.sel = (g.sel + g.bottles.length - 1) % g.bottles.length;
        if (pressed.arrowright) g.sel = (g.sel + 1) % g.bottles.length;
        if (pointer.clicked && !id) {
          if (Math.hypot(pointer.x - j.x, pointer.y - j.y) < 62) { g.held = 'jug'; SFX.pick(); }
          else {
            const i = g.bottles.findIndex(b => Math.abs(pointer.x - b.x) < b.bw / 2 + 18 && pointer.y > mouthY(b) - 30 && pointer.y < b.base + 10);
            if (i >= 0) { g.held = 'bottle'; g.sel = i; }
          }
        }
        if (id === 'tip' && g.bottles.some(b => b.level > 0)) { g.phase2 = 'drain'; tone(500, 0.4, 'sine', 0.08, 0, 200); }
        if (id === 'cork' && g.bottles.some(b => b.level > 0.02)) {
          const r = this.grade(g);
          g.judge = { t: 0, ...r, pass: r.pts >= 0.6 };
          g.phase2 = 'judge';
          if (r.pts >= 1) { SFX.sparkle(); burst(g.bottles[0].x, 220, 24, { colors: [g.liq.col, '#fff6a8', '#ffffff'] }); }
          else if (r.pts >= 0.6) SFX.pop(); else SFX.miss();
          speak(r.msg + (r.pass || g.attempt > 1 ? '' : " Let's tip it out and try again!"));
        }
      }
      const tgt = this.pourTarget(g);
      if (tgt != null) g.sel = tgt;
      // move the jug
      let tx, ty, tilt = 0;
      if (tgt != null) { const b = g.bottles[tgt]; tx = b.x + 48; ty = mouthY(b) - 50; tilt = -0.95; }
      else if (g.held === 'jug') { tx = pointer.x; ty = pointer.y; }
      else [tx, ty] = j.home;
      const k = Math.min(1, dt * (g.held === 'jug' && tgt == null ? 24 : 12));
      j.x = lerp(j.x, tx, k); j.y = lerp(j.y, ty, k); j.tilt = lerp(j.tilt, tilt, Math.min(1, dt * 10));
      g.bottles.forEach(b => (b.pouring = false));
      if (tgt != null && j.tilt < -0.75 && Math.hypot(j.x - tx, j.y - ty) < 14) {
        const b = g.bottles[tgt];
        b.pouring = true;
        b.level += g.rate * dt * (b.bh === 180 ? 1 : 1.15);
        if (b.level > 1) { b.level = 1; if (!b.spill) { b.spill = 1; SFX.miss(); } }
        g.glug = (g.glug || 0) - dt;
        if (g.glug <= 0) { g.glug = 0.16; tone(300 + b.level * 500, 0.08, 'sine', 0.05); }
      }
      if (g.phase2 === 'drain') {
        let any = false;
        g.bottles.forEach(b => { b.level = Math.max(0, b.level - dt * 1.4); b.spill = 0; if (b.level > 0) any = true; });
        if (!any) g.phase2 = 'pour';
      }
      if (g.phase2 === 'judge') {
        const J = g.judge;
        J.t += dt;
        const wait = J.pass ? 2.6 : g.attempt > 1 ? 3.6 : 3.0;
        if (J.t > wait) {
          if (!J.pass && g.attempt === 1) {
            g.attempt = 2; g.judge = null; g.phase2 = 'drain';
          } else {
            g.pts.push(g.attempt === 1 ? J.pts : J.pts * 0.5);
            g.round++;
            if (g.round >= g.plan.length) g.done = true;
            else { this.setup(g); speak(g.say); }
          }
        }
      }
      g.score = g.pts.reduce((a, b) => a + b, 0) / g.plan.length;
    },
    draw(g) {
      drawShelf();
      drawSpring();
      // Pixie Dot keeps the sample bottle
      drawCritter('Pixie Dot', 82, 452, 0.62, 1);
      const J = g.judge, showAns = J && !J.pass && g.attempt > 1 && J.t > 0.6;
      if (g.sample) {
        drawBottle(g.sample, g, { cork: true, tag: "Pixie's", tagCol: '#ff6fb5' });
        // tier 1 helper: a faint guide from Pixie's level across
        if (g.kind === 'same' && (g.tier === 1 || showAns)) {
          const yy = SHELF_Y - g.sample.level * g.sample.bh;
          ctx.save(); ctx.setLineDash([4, 8]); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(g.sample.x + 56, yy); ctx.lineTo(g.bottles[0].x + 70, yy); ctx.stroke(); ctx.restore();
        }
      }
      const corked = J != null;
      g.bottles.forEach((b, i) => {
        const o = { sel: g.phase2 === 'pour' && i === g.sel && g.bottles.length > 1, cork: corked, tag: g.bottles.length > 1 ? ['a little', 'more', 'the most'][i] : 'Yours', tagCol: '#9a6ae0' };
        if (g.kind === 'line' || g.kind === 'between') { o.line = g.line; }
        if (g.kind === 'half' && showAns) { o.line = 0.5; o.lineLabel = 'half'; o.lineCol = '#7af0ff'; }
        if (g.kind === 'full' && showAns) { o.line = 1; o.lineLabel = 'full'; o.lineCol = '#7af0ff'; }
        drawBottle(b, g, o);
        if (showAns && ['more', 'less', 'between'].includes(g.kind)) {
          const up = g.kind !== 'less';
          emoji(up ? '⬆️' : '⬇️', b.x + 82, SHELF_Y - g.sample.level * g.sample.bh + (up ? -24 : 24), 30);
        }
      });
      if (g.kind === 'half' && !showAns) {
        // a little "half" picture: a circle half filled
        const x = g.bottles[0].x + 110, y = SHELF_Y - 120;
        inkCircle(x, y, 26, '#fff', 2, OL);
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI); ctx.fillStyle = g.liq.col; ctx.fill(); ctx.restore();
        ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.moveTo(x - 26, y); ctx.lineTo(x + 26, y); ctx.stroke();
        text('half', x, y + 44, 16, '#fff', 'center', 700);
      }
      // the pour stream
      const tgt = g.bottles.findIndex(b => b.pouring);
      if (tgt >= 0) {
        const b = g.bottles[tgt], [sx, sy] = spoutTip(g.jug), ey = b.base - b.level * b.bh;
        ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx - 4, sy + 14, b.x, Math.min(ey, sy + 30)); ctx.lineTo(b.x, ey); ctx.stroke();
        ctx.strokeStyle = g.liq.col; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const ph = (S.t * 2 + i / 4) % 1;
          star(b.x + Math.sin(S.t * 6 + i * 2) * 8, lerp(sy + 20, ey, ph), 4, '#fffbd0', 4);
        }
      }
      drawJug(g.jug, g.liq.col);
      // the order card
      const pr = J ? J.msg : PROMPT[g.kind][1];
      const pcol = J ? (J.pts >= 1 ? '#3a9a5a' : J.pts >= 0.6 ? '#c08a20' : '#d0507a') : '#5a2a6e';
      panel(250, 66, 460, 60, 20);
      emoji(J ? (J.pts >= 1 ? '🌟' : J.pts >= 0.6 ? '👍' : '💭') : '🧪', 284, 96, 30);
      const lines = wrap(pr, 380, 19, 700);
      if (lines.length === 1) text(pr, 484, 96, J ? 19 : 22, pcol, 'center', 700);
      else lines.slice(0, 2).forEach((l, i) => text(l, 484, 84 + i * 24, 17, pcol, 'center', 700));
      if (J && !J.pass && g.attempt === 1) outlined('Try again!', 480, 150, 22, '#fff6a8');
      // controls
      const canCork = g.phase2 === 'pour' && g.bottles.some(b => b.level > 0.02);
      button('tip', 750, 412, 190, 48, 'Tip out', { icon: '🫗', color: '#5fa8e0', on: g.phase2 === 'pour' && g.bottles.some(b => b.level > 0), key: 'T' });
      button('cork', 750, 470, 190, 56, 'Cork it!', { icon: '🍾', color: '#5fb87a', size: 21, on: canCork, key: 'Enter' });
      if (g.phase2 === 'pour' && g.round === 0 && g.bottles[0].level < 0.02 && g.attempt === 1) {
        // hint hand: drag the jug to the bottle
        const ph = (S.t * 0.6) % 1, b = g.bottles[0];
        emoji('👆', lerp(g.jug.home[0], b.x + 40, ph), lerp(g.jug.home[1] + 40, mouthY(b) - 10, ph), 34);
      }
    },
  };

  restage('fairyring', {
    games: [['fairywand', 'crystal', {}], ['potionpour', 'petal', {}]],
    mid: [
      "N:Sparkly spells! Now we need potions for the fairy feast. Pour the moon-dew from my jug, but carefully!",
      'A:focused:Up to the line, all the way full, or just half. Not too much and not too little!',
    ],
  });
}
