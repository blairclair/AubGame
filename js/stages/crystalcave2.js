'use strict';
// Crystal Caverns, game 2: Crystal Bonk. Crystal balls hang from the cave roof on swinging
// strings. Echo calls a sorting rule ("Bonk the things that can FLY!") or asks for the odd one
// out, and Aubrey runs underneath and jumps to bonk the right balls with her head.
{
  // --- things to sort: emoji, name, tags ---------------------------------------------------
  const IT = (e, n, tags) => ({ e, n, tags: tags.split(' ') });
  const ITEMS = [
    IT('🐶', 'dog', 'animal alive mammal land'), IT('🐱', 'cat', 'animal alive mammal land small'),
    IT('🐮', 'cow', 'animal alive mammal land big'), IT('🐘', 'elephant', 'animal alive mammal land big'),
    IT('🐭', 'mouse', 'animal alive mammal land small'), IT('🐰', 'bunny', 'animal alive mammal land small'),
    IT('🦇', 'bat', 'animal alive mammal fly land'), IT('🐳', 'whale', 'animal alive mammal water big'),
    IT('🐬', 'dolphin', 'animal alive mammal water'), IT('🦒', 'giraffe', 'animal alive mammal land big'),
    IT('🐦', 'bird', 'animal alive bird fly land small'), IT('🦉', 'owl', 'animal alive bird fly land'),
    IT('🦜', 'parrot', 'animal alive bird fly land'), IT('🐧', 'penguin', 'animal alive bird'),
    IT('🦆', 'duck', 'animal alive bird fly'),
    IT('🐝', 'bee', 'animal alive insect fly land small'), IT('🦋', 'butterfly', 'animal alive insect fly land small'),
    IT('🐞', 'ladybug', 'animal alive insect fly land small'), IT('🐜', 'ant', 'animal alive insect land small'),
    IT('🐟', 'fish', 'animal alive fish water small'), IT('🐠', 'clownfish', 'animal alive fish water small'),
    IT('🦈', 'shark', 'animal alive fish water big'), IT('🐙', 'octopus', 'animal alive water'),
    IT('🦀', 'crab', 'animal alive water small'),
    IT('🌳', 'tree', 'alive plant big'), IT('🌻', 'sunflower', 'alive plant'), IT('🌷', 'tulip', 'alive plant small'), IT('🌵', 'cactus', 'alive plant'),
    IT('🍎', 'apple', 'food fruit'), IT('🍌', 'banana', 'food fruit'), IT('🍇', 'grapes', 'food fruit'),
    IT('🍓', 'strawberry', 'food fruit small'), IT('🍊', 'orange', 'food fruit'), IT('🍉', 'watermelon', 'food fruit'),
    IT('🥕', 'carrot', 'food veg'), IT('🥦', 'broccoli', 'food veg'), IT('🌽', 'corn', 'food veg'),
    IT('🚗', 'car', 'thing vehicle'), IT('🚌', 'bus', 'thing vehicle big'), IT('✈️', 'plane', 'thing vehicle fly big'),
    IT('🚂', 'train', 'thing vehicle big'), IT('⛵', 'boat', 'thing vehicle'), IT('🚁', 'helicopter', 'thing vehicle fly'),
    IT('🎈', 'balloon', 'thing toy fly'), IT('🪁', 'kite', 'thing toy fly'), IT('⚽', 'ball', 'thing toy'),
    IT('🧸', 'teddy bear', 'thing toy'), IT('🪨', 'rock', 'thing'), IT('🔑', 'key', 'thing small'),
    IT('👟', 'shoe', 'thing'), IT('🧦', 'sock', 'thing'), IT('🏠', 'house', 'thing big'), IT('⛰️', 'mountain', 'thing big'),
  ];
  const has = (it, t) => it.tags.includes(t);
  const art = w => (/^[aeiou]/.test(w) ? 'an' : 'a');

  // drawn crystal shapes, for the colour and shape rules
  const COLS = [['red', '#ff4a5a'], ['blue', '#4f8fff'], ['green', '#3fd47a'], ['yellow', '#ffd23f'], ['purple', '#b06aff']];
  const SHAPES = ['circle', 'triangle', 'square', 'star', 'heart'];
  const SHAPE_PL = { circle: 'circles', triangle: 'triangles', square: 'squares', star: 'stars', heart: 'hearts' };
  const gem = (c, s) => ({ gem: true, col: c, shape: s, n: `${c[0]} ${s}` });

  // --- sorting rules: who belongs, who can be used as a "no", and how Echo explains it -----
  // yes: the group (plural), no: what the odd one is
  const R = (id, tier, call, yes, no, test, dom) => ({ id, tier, call, yes, no, test, dom });
  const RULES = [
    R('animal', 1, 'Bonk the ANIMALS!', 'are animals', () => 'is not an animal', it => has(it, 'animal'), () => true),
    R('fly', 1, 'Bonk the things that can FLY!', 'can fly', () => "can't fly", it => has(it, 'fly'), it => !has(it, 'plant') && !has(it, 'food')),
    R('fruit', 1, 'Bonk the FRUIT!', 'are fruit', () => 'is not a fruit', it => has(it, 'fruit'), it => has(it, 'food') || has(it, 'toy') || has(it, 'animal')),
    R('alive', 2, 'Bonk the things that are ALIVE!', 'are alive. They grow', () => 'is not alive', it => has(it, 'alive'), it => !has(it, 'food')),
    R('water', 2, 'Bonk the animals that live in WATER!', 'live in water', () => 'lives on land', it => has(it, 'water'), it => has(it, 'water') || has(it, 'land')),
    R('big', 2, 'Bonk the BIG things!', 'are big', () => 'is small', it => has(it, 'big'), it => has(it, 'big') || has(it, 'small')),
    R('bird', 3, 'Bonk the BIRDS! They have feathers.', 'are birds', () => 'is not a bird', it => has(it, 'bird'), it => ['bird', 'mammal', 'insect', 'fish'].some(t => has(it, t))),
    R('mammal', 3, 'Bonk the MAMMALS! They have fur and drink milk.', 'are mammals', () => 'is not a mammal', it => has(it, 'mammal'), it => ['bird', 'mammal', 'insect', 'fish'].some(t => has(it, t))),
    R('insect', 3, 'Bonk the INSECTS! They have six legs.', 'are insects', () => 'is not an insect', it => has(it, 'insect'), it => ['bird', 'mammal', 'insect', 'fish'].some(t => has(it, t))),
    R('fish', 3, 'Bonk the FISH! They have fins and gills.', 'are fish', () => 'is not a fish', it => has(it, 'fish'), it => ['bird', 'mammal', 'insect', 'fish'].some(t => has(it, t))),
  ];

  // --- layout ---------------------------------------------------------------------------------
  const TOPY = 50, BY = 262, BR = 40, FEET = GY + 18, AS = 0.68, XMIN = 60, XMAX = 800;
  const SPEED = 290, JUMPV = 610, GRAV = 1700;
  const ballX = (g, i) => { const n = g.balls.length, sp = Math.min(140, 660 / Math.max(1, n - 1)); return 430 - (n - 1) * sp / 2 + i * sp; };
  const ballPos = (g, b) => {
    const ang = b.amp * Math.sin(S.t * b.w + b.ph) + b.kick;
    const L = BY - TOPY;
    return { x: b.ax + Math.sin(ang) * L, y: TOPY + Math.cos(ang) * L - b.bump - b.drop };
  };

  // --- art --------------------------------------------------------------------------------------
  const gemPath = (shape, r) => {
    if (shape === 'circle') { const p = new Path2D(); p.arc(0, 0, r, 0, Math.PI * 2); return p; }
    if (shape === 'triangle') return P2(`M0,${-r * 1.05} L${r * 1.05},${r * 0.75} L${-r * 1.05},${r * 0.75} Z`);
    if (shape === 'square') return P2(`M${-r * 0.85},${-r * 0.85} L${r * 0.85},${-r * 0.85} L${r * 0.85},${r * 0.85} L${-r * 0.85},${r * 0.85} Z`);
    if (shape === 'heart') return P2(`M0,${r * 0.95} C${-r * 1.3},${r * 0.1} ${-r * 1.0},${-r * 1.1} 0,${-r * 0.45} C${r * 1.0},${-r * 1.1} ${r * 1.3},${r * 0.1} 0,${r * 0.95} Z`);
    let d = '';
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.48 : r * 1.1, a = i * Math.PI / 5 - Math.PI / 2; d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr + r * 0.08).toFixed(1)} `; }
    return P2(d + 'Z');
  };
  const drawGem = (it, x, y, r) => {
    ctx.save(); ctx.translate(x, y);
    const p = gemPath(it.shape, r);
    ink(p, it.col[1], 1.6, '#2a1446');
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; tri(-r * 1.2, -r * 1.2, r * 0.3, -r * 1.2, -r * 1.2, r * 0.2);
    ctx.fillStyle = 'rgba(40,10,60,.18)'; tri(r * 1.2, r * 1.2, -r * 0.2, r * 1.2, r * 1.2, -r * 0.1);
    ctx.restore(); ctx.restore();
  };
  const glow = (x, y, r, col, a) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1;
  };
  // a crystal ball: a glassy bubble in a little crystal cap, with the thing to sort inside
  const drawBall = (g, b, i) => {
    const { x, y } = ballPos(g, b);
    const dim = b.wrong && !b.pop, hint = g.hint && b.good && !b.pop && g.state === 'play';
    // string from the roof
    ctx.strokeStyle = 'rgba(230,210,255,.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.ax, TOPY - 60); ctx.lineTo(x, y - BR - 8); ctx.stroke();
    if (b.pop) return;
    if (hint) glow(x, y, 90, 'rgba(255,240,140,.9)', 0.5 + 0.35 * Math.sin(S.t * 6));
    if (g.state === 'yay' && b.good) glow(x, y, 80, 'rgba(255,240,140,.9)', 0.6);
    ctx.globalAlpha = dim ? 0.45 : 1;
    inkCircle(x, y, BR, 'rgba(210,190,255,.35)', 1.6, '#2a1446');
    const gr = ctx.createRadialGradient(x - 12, y - 14, 4, x, y, BR);
    gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(0.5, 'rgba(200,170,255,.25)'); gr.addColorStop(1, 'rgba(120,80,200,.45)');
    ctx.fillStyle = gr; circle(x, y, BR - 1);
    if (b.it.gem) drawGem(b.it, x, y + 2, 22); else emoji(b.it.e, x, y + 2, 44);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(x - 17, y - 20, 9, 5, -0.6);
    // crystal cap
    ink(P2(`M${x - 14},${y - BR + 4} L${x - 8},${y - BR - 12} L${x},${y - BR - 6} L${x + 8},${y - BR - 14} L${x + 14},${y - BR + 4} Z`), '#c9a4ff', 1.2, '#2a1446');
    // number badge for the number keys
    inkCircle(x + BR - 6, y + BR - 8, 11, '#fff6a8', 1, '#2a1446');
    text(String(i + 1), x + BR - 6, y + BR - 7, 13, '#5a2a6e', 'center', 800);
    if (dim) { ctx.globalAlpha = 1; inkCircle(x - BR + 8, y + BR - 8, 11, '#8ee6a8', 1, '#2a1446'); text('✓', x - BR + 8, y + BR - 7, 14, '#1e5a30', 'center', 800); }
    ctx.globalAlpha = 1;
  };

  const startRound = (g) => {
    const kind = g.plan[g.round];
    const rules = RULES.filter(r => r.tier <= g.tier);
    let items = [], good = [], rule = null, call, why = '';
    const gemRound = Math.random() < (g.tier === 1 ? 0.45 : 0.3);
    if (kind === 'odd') {
      if (gemRound) {
        const byCol = Math.random() < 0.5, [c1, c2] = shuffle(COLS.slice()), [s1, s2] = shuffle(SHAPES.slice());
        const mixed = g.tier === 3; // tier 3: the other feature changes too, so only one feature gives a 3 and 1 split
        if (byCol) {
          const sh = mixed ? shuffle(SHAPES.slice()) : [s1, s1, s1, s1];
          items = [0, 1, 2].map(k => gem(c1, sh[k])); const odd = gem(c2, sh[3]);
          items.push(odd); good = [3];
          why = `The ${odd.n} is ${c2[0]}. The others are ${c1[0]}!`;
        } else {
          const cs = mixed ? shuffle(COLS.slice()) : [c1, c1, c1, c1];
          items = [0, 1, 2].map(k => gem(cs[k], s1)); const odd = gem(cs[3], s2);
          items.push(odd); good = [3];
          why = `The ${s2} is the odd one out. The others are ${SHAPE_PL[s1]}!`;
        }
      } else {
        rule = pick(rules.filter(r => r.tier >= Math.min(g.tier, 2) || Math.random() < 0.5));
        const pool = ITEMS.filter(rule.dom);
        const yes = shuffle(pool.filter(rule.test)).slice(0, 3), odd = pick(pool.filter(it => !rule.test(it)));
        items = [...yes, odd]; good = [3];
        why = `The ${odd.n} ${rule.no(odd)}. The others ${rule.yes}!`;
      }
      call = 'Bonk the one that does NOT belong!';
    } else {
      const n = [5, 6, 6][g.tier - 1], m = g.tier === 1 ? 2 : g.tier === 2 ? randInt(2, 3) : 3;
      if (gemRound) {
        const combo = g.tier === 3, c = pick(COLS), s = pick(SHAPES), seen = new Set();
        const ok = it => (combo ? it.col === c && it.shape === s : it.col === c);
        const yes = combo ? Array(m).fill(0).map(() => gem(c, s)) : shuffle(SHAPES.slice()).slice(0, m).map(sh => gem(c, sh));
        const no = [];
        while (no.length < n - m) {
          const it = combo ? (Math.random() < 0.5 ? gem(c, pick(SHAPES.filter(x => x !== s))) : gem(pick(COLS.filter(x => x !== c)), s)) : gem(pick(COLS.filter(x => x !== c)), pick(SHAPES));
          if (!ok(it) && !seen.has(it.n)) { seen.add(it.n); no.push(it); }
        }
        items = [...yes, ...no];
        call = combo ? `Bonk the ${c[0].toUpperCase()} ${SHAPE_PL[s].toUpperCase()}!` : `Bonk the ${c[0].toUpperCase()} crystals!`;
        why = combo ? `Those are all ${c[0]} ${SHAPE_PL[s]}!` : `Those are all ${c[0]}!`;
      } else {
        rule = pick(rules.filter(r => r.tier === g.tier || Math.random() < 0.4));
        const pool = ITEMS.filter(rule.dom);
        items = [...shuffle(pool.filter(rule.test)).slice(0, m), ...shuffle(pool.filter(it => !rule.test(it))).slice(0, n - m)];
        call = rule.call;
        why = `Yes! Those ${rule.yes}!`;
      }
    }
    // shuffle positions, keep track of the right ones
    const order = shuffle([...items.keys()]);
    const goodSet = kind === 'odd' ? new Set(good) : new Set(items.map((it, k) => k).filter(k => (rule ? rule.test(items[k]) : items[k].col === items[0].col && (g.tier < 3 || items[k].shape === items[0].shape))));
    g.balls = order.map(k => ({ it: items[k], good: goodSet.has(k), pop: false, wrong: false, amp: [0.03, 0.07, 0.11][g.tier - 1] * rand(0.8, 1.2), w: rand(1.4, 2.0) + g.tier * 0.3, ph: rand(0, 6.3), kick: 0, kv: 0, bump: 0, bv: 0, drop: 260 }));
    g.balls.forEach((b, i) => { b.ax = ballX(g, i); });
    Object.assign(g, { kind, call, why, need: g.balls.filter(b => b.good).length, got: 0, wrongs: 0, hint: false, state: 'play', stT: 0, target: -1 });
    g.say = kind === 'odd' ? 'Which one does not belong? Jump and bonk it!' : `${call.replace(/!$/, '')}. Jump and bonk them!`;
    g.progress = `Puzzle ${g.round + 1} of ${g.rounds}`;
    speak(g.say);
  };

  const finishRound = (g) => {
    const per = g.kind === 'odd' ? 0.35 : 0.25;
    g.scores.push(Math.max(0, 1 - per * g.wrongs));
    g.score = g.scores.reduce((a, b) => a + b, 0) / g.rounds + (g.rounds - g.scores.length) / g.rounds;
    g.state = 'yay'; g.stT = 0; g.cheer = 1.6;
    SFX.sparkle(); speak(g.why);
  };

  const bonk = (g, i) => {
    const b = g.balls[i], p = ballPos(g, b);
    b.bv = 260; b.kv += (g.a.x < p.x ? 1 : -1) * 0.45;
    if (b.good) {
      b.pop = true; g.got++; SFX.hit(); SFX.pop();
      burst(p.x, p.y, 22, { colors: ['#fff6a8', '#c9a4ff', '#8ad4ff', '#ffb3e0'] });
      g.flyers.push({ it: b.it, x: p.x, y: p.y, t: 0 });
      floatText(p.x, p.y - 50, g.kind === 'odd' ? 'Odd one out!' : 'Yes!', '#fff6a8', false, 24);
      if (g.got >= g.need) finishRound(g);
    } else if (!b.wrong) {
      b.wrong = true; g.wrongs++; SFX.miss(); tone(300, 0.18, 'triangle', 0.06, 0, 180);
      const msg = g.kind === 'odd' ? `The ${b.it.n} belongs with the others` : `Not the ${b.it.n}!`;
      floatText(p.x, p.y - 50, g.kind === 'odd' ? 'That one belongs!' : 'Not that one!', '#ffd0e0', false, 20);
      speak(msg);
      if (g.wrongs >= 2) g.hint = true;
    } else { tone(260, 0.1, 'triangle', 0.05); }
  };

  MG.crystalbonk = {
    kind: 'learn', title: () => 'Crystal Bonk', icon: () => '🔮',
    how: () => 'Crystal balls hang from the cave roof. Echo calls a rule. Jump and BONK the balls that match, or the odd one out! Tap a ball and Aubrey runs and jumps. Or walk with the arrows and jump with SPACE.',
    init(g) {
      g.rounds = [5, 6, 7][g.tier - 1];
      g.plan = [];
      for (let i = 0; i < g.rounds; i++) g.plan.push(i % 2 ? 'rule' : 'odd');
      Object.assign(g, { round: 0, scores: [], score: 1, a: { x: 120, y: 0, vy: 0, f: 1, moving: false, hitThisJump: false, wasAir: false }, flyers: [], cheer: 0, balls: [] });
      startRound(g);
    },
    start(g) { speak(g.say); },
    update(g, dt, id) {
      const a = g.a;
      g.stT += dt; g.cheer = Math.max(0, g.cheer - dt);
      for (const b of g.balls) {
        b.drop = Math.max(0, b.drop - dt * 520);
        b.kv += (-b.kick * 14 - b.kv * 2.2) * dt; b.kick += b.kv * dt;
        b.bv -= (b.bump * 90 + b.bv * 8) * dt; b.bump += b.bv * dt;
      }
      for (const f of g.flyers) f.t += dt;
      g.flyers = g.flyers.filter(f => f.t < 1);
      if (g.state === 'yay') {
        if (g.stT > 2.6) {
          g.round++;
          if (g.round >= g.rounds) { g.done = true; return; }
          startRound(g);
        }
      }
      // --- input: tap a ball (or press its number) to run under it and jump; tap the floor to walk there
      if (g.state === 'play') {
        let tgt = -1;
        if (pointer.clicked) {
          let best = -1, bd = 1e9;
          g.balls.forEach((b, i) => { if (b.pop) return; const p = ballPos(g, b), d = Math.hypot(pointer.x - p.x, pointer.y - p.y); if (d < BR + 22 && d < bd) { bd = d; best = i; } });
          if (best >= 0) tgt = best;
          else if (pointer.y > 330) { g.target = -1; g.walkTo = clamp(pointer.x, XMIN, XMAX); }
        }
        g.balls.forEach((b, i) => { if (pressed[String(i + 1)] && !b.pop) tgt = i; });
        if (tgt >= 0) { g.target = tgt; g.walkTo = null; }
      }
      if (g.target >= 0 && (g.state !== 'play' || g.balls[g.target].pop)) g.target = -1;
      let dir = 0;
      if (goLeft()) { dir = -1; g.target = -1; g.walkTo = null; }
      else if (goRight()) { dir = 1; g.target = -1; g.walkTo = null; }
      let wantX = null;
      if (g.target >= 0) wantX = clamp(ballPos(g, g.balls[g.target]).x, XMIN, XMAX);
      else if (g.walkTo != null) wantX = g.walkTo;
      if (wantX != null && !dir) {
        const d = wantX - a.x;
        if (Math.abs(d) > 4) dir = Math.sign(d);
        else if (g.walkTo != null) g.walkTo = null;
      }
      const sp = SPEED * (g.target >= 0 && wantX != null && Math.abs(wantX - a.x) < 20 ? 0.5 : 1);
      a.moving = dir !== 0 && a.y === 0;
      if (dir) { a.f = dir; a.x = clamp(a.x + dir * sp * dt, XMIN, XMAX); }
      const onGround = a.y === 0 && a.vy === 0;
      let jump = g.state === 'play' && onGround && jumpPressed();
      if (g.target >= 0 && onGround && wantX != null && Math.abs(wantX - a.x) < 14) jump = true;
      if (jump) { a.vy = JUMPV; a.hitThisJump = false; SFX.jump(); }
      if (a.y > 0 || a.vy !== 0) {
        a.vy -= GRAV * dt; a.y += a.vy * dt;
        if (a.y <= 0) { a.y = 0; a.vy = 0; if (!a.hitThisJump && g.target >= 0) { /* missed: try again next frame */ } }
      }
      // --- head bonks
      if (g.state === 'play' && a.y > 0 && !a.hitThisJump) {
        const im = IMG.jump, headY = FEET - a.y - (im.height - heroHead('jump').top) * AS + 6; // the top of her hair (heroHead)
        let best = -1, bd = 1e9;
        g.balls.forEach((b, i) => {
          if (b.pop) return;
          const p = ballPos(g, b), dx = Math.abs(p.x - a.x);
          if (dx < BR + 10 && headY < p.y + BR - 2 && dx < bd) { bd = dx; best = i; }
        });
        if (best >= 0) {
          a.hitThisJump = true; a.vy = Math.min(a.vy, -60);
          bonk(g, best);
          if (g.target === best) g.target = -1;
        }
      }
    },
    draw(g) {
      const a = g.a;
      // soft glow pools under each ball and dripping sparkles
      for (let k = 0; k < 14; k++) {
        const x = (k * 71 + 30) % 860 + 20, ph = (S.t * 0.35 + k * 0.37) % 1;
        ctx.globalAlpha = 0.7 * (1 - ph); star(x, 120 + ph * 300, 3 + (k % 3), ['#fff6a8', '#c9a4ff', '#8ad4ff'][k % 3]);
      }
      ctx.globalAlpha = 1;
      g.balls.forEach((b, i) => drawBall(g, b, i));
      // things flying out of popped balls over to Echo
      for (const f of g.flyers) {
        const k = f.t, x = lerp(f.x, 884, k), y = lerp(f.y, 410, k) - Math.sin(k * Math.PI) * 90;
        ctx.globalAlpha = 1 - k * 0.5;
        if (f.it.gem) drawGem(f.it, x, y, 18 * (1 - k * 0.4)); else emoji(f.it.e, x, y, 40 * (1 - k * 0.4));
        ctx.globalAlpha = 1;
      }
      // rule banner
      panel(W / 2 - 330, 66, 660, 82, 20);
      const odd = g.kind === 'odd';
      outlined(g.call, W / 2, 96, g.call.length > 34 ? 24 : 28, odd ? '#ff6fb5' : '#8a4ae0', 'center', '#fff');
      let sub;
      if (g.state === 'yay') sub = g.why;
      else if (odd) sub = g.hint ? 'Look for the glowing one!' : 'Three go together. One does not!';
      else sub = `Found ${g.got} of ${g.need}` + (g.hint ? '  (look for the glow!)' : '');
      text(sub, W / 2, 130, 19, '#5a2a6e', 'center', 700);
      // Echo the bat cheering from the floor
      const ey = GY + 22 + Math.sin(S.t * 2.4) * 3;
      if (g.flyers.length) glow(884, 420, 70, 'rgba(255,240,170,.9)', 0.5);
      drawCritter('Echo the Bat', 884, ey, 0.66, -1);
      // Aubrey
      let frame = 'idle_front';
      if (a.y > 0) frame = 'jump';
      else if (g.cheer > 0) frame = 'twirl';
      else if (a.moving) frame = `run${1 + Math.floor(S.t * 12) % 5}`;
      drawAubrey(a.x, FEET, frame, a.f, a.y, frame === 'twirl' ? AS * 0.9 : AS);
      if (g.target >= 0 && g.state === 'play') {
        const p = ballPos(g, g.balls[g.target]);
        ctx.strokeStyle = 'rgba(255,246,168,.9)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -S.t * 30;
        ctx.beginPath(); ctx.arc(p.x, p.y, BR + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
      if (g.round === 0 && g.state === 'play' && g.stT < 6) text('Tap a ball, or use ← → and SPACE', 430, 528, 15, '#fff6a8', 'center', 700);
    },
  };

  restage('crystalcave', {
    games: [['echoflight', 'rainbow', {}], ['crystalbonk', 'crystal', {}]],
    mid: ['N:You fly like a real bat! Now look up. Squeak! Crystal balls hang from the cave roof. I call a rule, and you jump up and BONK the balls that match. Sometimes you bonk the one that does not belong!',
      'A:determined:Boing! I can jump really high!'],
  });
}
