'use strict';
// Moonlight Lake, game 2: Opposite Lake (replaces Mirror Match).
// Marina's magic lake always shows the OPPOSITE of what sits on the magic rock.
// Aubrey walks the moonlit shore, picks things up with Space and puts the right one on the rock.
// Some rounds she tows a toy boat instead, and its reflection sails the opposite way.
{
  const glow = (x, y, r, rgb, a = 0.6) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const line = (pts, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };

  // ---------- the things (each drawn centred on 0,0, about 60px tall at s=1) ----------
  const frog = (happy, awake = true) => {
    INK = OL;
    inkEllipse(0, 10, 30, 20, 0, '#5cc85a', 2);
    inkCircle(-14, -10, 10, '#5cc85a', 2); inkCircle(14, -10, 10, '#5cc85a', 2);
    ctx.fillStyle = '#5cc85a'; ellipse(0, 4, 26, 14);
    ctx.fillStyle = '#c8f0a0'; ellipse(0, 16, 18, 9);
    if (awake) {
      inkCircle(-14, -11, 6, '#fff', 1); inkCircle(14, -11, 6, '#fff', 1);
      ctx.fillStyle = OL; circle(-13, -10, 3); circle(15, -10, 3);
    } else {
      line([[-19, -10], [-14, -7], [-9, -10]], OL, 2.5); line([[9, -10], [14, -7], [19, -10]], OL, 2.5);
      const k = (S.t * 0.8) % 1;
      ctx.globalAlpha = 1 - k; outlined('z', 26 + k * 10, -26 - k * 18, 14 + k * 6, '#cfe0ff'); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath();
    if (happy) ctx.arc(0, 2, 12, 0.25, Math.PI - 0.25); else ctx.arc(0, 18, 10, Math.PI + 0.45, -0.45);
    ctx.stroke();
    if (!happy) { ctx.fillStyle = '#7ac8ff'; ellipse(-20, 2 + ((S.t * 14) % 10), 3, 5); }
    if (happy) { ctx.fillStyle = 'rgba(255,120,160,.5)'; circle(-22, 4, 4); circle(22, 4, 4); }
  };
  const mug = hot => {
    INK = OL;
    const col = hot ? '#ff7a5a' : '#6ab4f0';
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(22, 8, 10, -1.3, 1.3); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
    inkRect(-20, -14, 40, 42, col, 2, 7);
    ctx.fillStyle = hot ? '#8a4a2a' : '#d8f0ff'; ellipse(0, -14, 18, 4);
    if (hot) {
      for (let i = 0; i < 3; i++) {
        const k = (S.t * 0.7 + i / 3) % 1;
        ctx.globalAlpha = 0.9 * (1 - k);
        line([[-10 + i * 10, -18 - k * 30], [-14 + i * 10 + Math.sin(S.t * 3 + i) * 5, -28 - k * 30], [-10 + i * 10, -38 - k * 30]], '#ffffff', 3);
      }
      ctx.globalAlpha = 1;
    } else {
      inkRect(-14, -24, 12, 12, '#eaf8ff', 1.2, 2); inkRect(2, -22, 12, 12, '#eaf8ff', 1.2, 2);
      emoji('❄️', 0, 8, 18);
    }
  };
  const bucket = full => {
    INK = OL;
    ink(P2('M-24,-16 L24,-16 L18,26 L-18,26 Z'), '#ff9a3a', 2);
    ctx.fillStyle = '#d87a2a'; ctx.fillRect(-21, 4, 41, 5);
    ctx.fillStyle = full ? '#4aa8f0' : '#5a3a2a'; ellipse(0, -16, 22, 5);
    if (full) {
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(-6, -17, 8, 1.6);
      ctx.fillStyle = '#4aa8f0'; ellipse(24, -6 + ((S.t * 30) % 22), 3, 4.5);
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -16, 22, Math.PI, 0); ctx.stroke();
  };
  const clam = open => {
    INK = OL;
    if (open) {
      inkEllipse(0, 4, 30, 30, 0, '#ffb8d8', 2);
      ink(P2('M-30,10 C-30,-30 30,-30 30,10 C10,14 -10,14 -30,10 Z'), '#ffd0e4', 2);
      ink(P2('M-30,12 C-28,30 28,30 30,12 C10,16 -10,16 -30,12 Z'), '#ffb8d8', 2);
      glow(0, 10, 18, '255,255,255', 0.8); inkCircle(0, 10, 7, '#fffaf0', 1.2);
      ctx.strokeStyle = 'rgba(200,80,140,.45)'; ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 4, 6); ctx.lineTo(i * 12, -16); ctx.stroke(); }
    } else {
      ink(P2('M-32,8 C-30,-22 30,-22 32,8 C12,14 -12,14 -32,8 Z'), '#ffb8d8', 2);
      ink(P2('M-32,8 C-26,24 26,24 32,8 C12,14 -12,14 -32,8 Z'), '#f598c0', 2);
      ctx.strokeStyle = 'rgba(200,80,140,.45)'; ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 4, 8); ctx.lineTo(i * 11, -12); ctx.stroke(); }
    }
  };
  const towel = wet => {
    line([[-34, -22], [34, -22]], OL, 3);
    INK = OL;
    const col = wet ? '#6a7ad8' : '#ff9ad0';
    ink(P2(wet ? 'M-22,-22 L22,-22 L20,22 C10,28 -10,28 -20,22 Z' : 'M-24,-22 L24,-22 L24,20 L-24,20 Z'), col, 2);
    ctx.fillStyle = wet ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.55)'; ctx.fillRect(-20, -4, 40, 5); ctx.fillRect(-20, 8, 40, 3);
    inkRect(-6, -27, 12, 9, '#ffe08a', 1, 2);
    if (wet) { ctx.fillStyle = '#7ac8ff'; for (let i = 0; i < 3; i++) ellipse(-12 + i * 12, 30 + ((S.t * 40 + i * 9) % 18), 3, 4.5); }
    else for (let i = 0; i < 2; i++) star(-14 + i * 30, 30 + Math.sin(S.t * 4 + i) * 2, 6, '#fff6a8');
  };
  const bowl = inside => {
    INK = OL;
    const bx = inside ? 0 : -8;
    inkRect(bx - 18, 22, 36, 6, '#b89070', 1.5, 3);
    ctx.globalAlpha = 0.8; inkCircle(bx, 0, 24, 'rgba(200,235,255,.55)', 2); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(80,160,240,.5)'; ctx.beginPath(); ctx.arc(bx, 0, 22, 0.2, Math.PI - 0.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(bx - 10, -10, 4, 7, 0.5);
    if (inside) emoji('🐠', Math.sin(S.t * 2) * 5, 6, 24);
    else { const hop = Math.abs(Math.sin(S.t * 4)) * 8; ctx.save(); ctx.translate(26, 14 - hop); ctx.rotate(-0.4); emoji('🐠', 0, 0, 24); ctx.restore(); }
  };
  const cairn = tall => {
    INK = OL;
    const stones = tall ? [[0, 20, 22, 9], [2, 4, 18, 8], [-1, -10, 15, 7], [1, -22, 11, 6], [0, -32, 8, 5]] : [[0, 20, 22, 9]];
    for (const [x, y, rx, ry] of stones) inkEllipse(x, y, rx, ry, 0, '#a0aac8', 1.5);
  };
  const arrow = up => {
    ctx.save(); if (!up) ctx.scale(1, -1);
    INK = OL; ink(P2('M0,-30 L24,-4 L10,-4 L10,28 L-10,28 L-10,-4 L-24,-4 Z'), '#ffd23a', 2);
    ctx.restore();
  };
  const lantern = on => {
    INK = OL;
    if (on) glow(0, 4, 50, '255,210,120', 0.8);
    inkRect(-3, -34, 6, 10, '#4a3a5a', 1, 2);
    inkRect(-16, -26, 32, 6, '#4a3a5a', 1.5, 2);
    inkRect(-13, -20, 26, 36, on ? '#ffe08a' : '#4a4a6a', 2, 6);
    inkRect(-16, 16, 32, 6, '#4a3a5a', 1.5, 2);
    if (on) { ctx.fillStyle = '#ff9a3a'; ellipse(0, 2 + Math.sin(S.t * 8), 4, 8); ctx.fillStyle = '#fff6c0'; ellipse(0, 4, 2, 4); }
  };
  const em = (ch, size = 50, extra) => () => { if (extra) extra(); emoji(ch, 0, 0, size); };
  const speedLines = () => { for (let i = 0; i < 3; i++) line([[36 + ((S.t * 60 + i * 9) % 14), -8 + i * 10], [50 + ((S.t * 60 + i * 9) % 14), -8 + i * 10]], 'rgba(255,255,255,.85)', 3); };
  const soundWaves = () => { ctx.strokeStyle = 'rgba(255,240,160,.9)'; ctx.lineWidth = 3; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(-16, 0, 30 + i * 10 + Math.sin(S.t * 8) * 2, -0.6, 0.6); ctx.stroke(); } };

  // a, b = the two opposite words; ph = how Marina says each; d = draw each
  const OL_THINGS = {
    frog: { a: 'happy', b: 'sad', ph: ['a HAPPY frog', 'a SAD frog'], d: [() => frog(true), () => frog(false)] },
    fish: { a: 'big', b: 'small', ph: ['a BIG fish', 'a SMALL fish'], d: [em('🐟', 62), em('🐟', 26)] },
    mug: { a: 'hot', b: 'cold', ph: ['a HOT drink', 'a COLD drink'], d: [() => mug(true), () => mug(false)] },
    pet: { a: 'fast', b: 'slow', ph: ['a FAST bunny', 'a SLOW turtle'], d: [em('🐇', 50, speedLines), em('🐢', 50)] },
    bucket: { a: 'full', b: 'empty', ph: ['a FULL bucket', 'an EMPTY bucket'], d: [() => bucket(true), () => bucket(false)] },
    clam: { a: 'open', b: 'closed', ph: ['an OPEN shell', 'a CLOSED shell'], d: [() => clam(true), () => clam(false)] },
    sky: { a: 'day', b: 'night', ph: ['the DAY sun', 'the NIGHT moon'], d: [em('☀️', 54), em('🌙', 50)] },
    arrow: { a: 'up', b: 'down', ph: ['an arrow pointing UP', 'an arrow pointing DOWN'], d: [() => arrow(true), () => arrow(false)] },
    towel: { a: 'wet', b: 'dry', ph: ['a WET towel', 'a DRY towel'], d: [() => towel(true), () => towel(false)] },
    horn: { a: 'loud', b: 'quiet', ph: ['something LOUD', 'something QUIET'], d: [em('📢', 48, soundWaves), em('🤫', 48)] },
    bowl: { a: 'in', b: 'out', ph: ['a fish IN its bowl', 'a fish OUT of its bowl'], d: [() => bowl(true), () => bowl(false)] },
    cairn: { a: 'tall', b: 'short', ph: ['a TALL stone tower', 'a SHORT stone tower'], d: [() => cairn(true), () => cairn(false)] },
    feather: { a: 'light', b: 'heavy', ph: ['something LIGHT', 'something HEAVY'], d: [em('🪶', 48), em('🪨', 48)] },
    sleepy: { a: 'awake', b: 'asleep', ph: ['an AWAKE frog', 'an ASLEEP frog'], d: [() => frog(true, true), () => frog(true, false)] },
    lantern: { a: 'on', b: 'off', ph: ['a lantern that is ON', 'a lantern that is OFF'], d: [() => lantern(true), () => lantern(false)] },
  };
  const OL_POOL = {
    1: ['frog', 'fish', 'mug', 'pet', 'bucket', 'clam', 'sky', 'arrow'],
    2: ['frog', 'fish', 'mug', 'pet', 'bucket', 'clam', 'sky', 'arrow', 'towel', 'horn', 'bowl', 'cairn'],
    3: ['mug', 'pet', 'bucket', 'clam', 'towel', 'horn', 'bowl', 'cairn', 'feather', 'sleepy', 'lantern', 'sky'],
  };
  // i = put a thing on the magic rock, b = tow the toy boat
  const OL_ROUNDS = { 1: 'iibii', 2: 'iibiib', 3: 'ibiibii' };
  const OL_SLOTS = { 3: [170, 320, 710], 4: [130, 290, 660, 810], 5: [90, 215, 340, 640, 790] };
  const GYA = 528, AS = 0.6, ITEM_Y = 462, ROCK = 480, REF = { x: 480, y: 342, r: 54 };
  const cap = w => w[0].toUpperCase() + w.slice(1);
  const drawThing = (k, st, x, y, s = 1, alpha = 1) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
    OL_THINGS[k].d[st]();
    ctx.restore(); ctx.globalAlpha = 1;
  };
  // the reflection, drawn into a little canvas and then wobbled in strips like water
  const refCv = document.createElement('canvas'); refCv.width = refCv.height = 140;
  const drawWobbly = (fn, x, y, flip = false) => {
    const main = ctx, c = refCv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 140, 140);
    ctx = c; ctx.save(); ctx.translate(70, 70); if (flip) ctx.scale(1, -1); fn(); ctx.restore(); ctx = main;
    ctx.save(); ctx.globalAlpha = 0.88;
    for (let sy = 0; sy < 140; sy += 4) ctx.drawImage(refCv, 0, sy, 140, 4, x - 70 + Math.sin(S.t * 3 + sy * 0.12) * 2.5, y - 70 + sy, 140, 4);
    ctx.restore();
  };
  const toyBoat = () => {
    INK = OL;
    ink(P2('M-30,0 L30,0 L22,14 L-22,14 Z'), '#ff6fb5', 2);
    inkRect(-2, -40, 4, 40, '#8a6a5a', 1, 1);
    ink(P2('M2,-38 L26,-6 L2,-6 Z'), '#fff8e8', 1.5);
    ink(P2('M-2,-30 L-20,-6 L-2,-6 Z'), '#ffd23a', 1.5);
    ctx.fillStyle = '#fff'; circle(-12, 7, 2.5); circle(0, 7, 2.5); circle(12, 7, 2.5);
  };
  const lily = (x, y, r, lit) => {
    if (lit) glow(x, y, r * 2.4, '255,240,140', 0.55 + 0.25 * Math.sin(S.t * 4));
    INK = OL;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0.3, Math.PI * 2 - 0.05); ctx.lineTo(x, y); ctx.closePath();
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#4ab87a'; ctx.fill();
    if (lit) { emoji('⭐', x, y - 12, 22); }
  };

  MG.oppositelake = {
    kind: 'learn', title: () => 'Opposite Lake', icon: () => '🌗',
    how: g => `Marina's magic lake always shows the OPPOSITE! Walk with the arrow keys and press Space to pick things up. Put the opposite thing on the magic rock.${g.tier > 1 ? ' Sometimes you tow a toy boat, and its reflection sails the other way!' : ' Then tow a toy boat, and see which way its reflection sails!'}`,
    init(g) {
      const plan = OL_ROUNDS[g.tier].split('');
      const things = shuffle(OL_POOL[g.tier].slice());
      Object.assign(g, { plan, things, round: 0, total: 0, ax: ROCK, facing: 1, walk: null, carry: -1, run: 0, state: 'play', t2: 0, mist: 0, hop: 0, msg: '', boatX: ROCK, sides: shuffle([-1, 1, -1, 1]) });
      this.next(g);
    },
    start(g) { speak(g.say); },
    revealAt: g => (g.tier === 1 ? 2 : 3),
    next(g) {
      g.mist = 0; g.state = 'play'; g.carry = -1; g.walk = null; g.placed = -1; g.ripple = 0;
      g.progress = `Round ${g.round + 1} of ${g.plan.length}`;
      if (g.plan[g.round] === 'b') {
        g.kind = 'boat';
        const side = g.sides[g.round % g.sides.length];
        g.tx = ROCK + side * pick(g.tier === 1 ? [240, 280] : [180, 230, 290]);
        g.boatX = g.ax;
        g.say = `Sail the REFLECTION boat to the glowing lily on the ${side < 0 ? 'LEFT' : 'RIGHT'}. In the magic lake, it goes the opposite way! Then press Space.`;
        g.msg = `Get the reflection boat to the ⭐ lily, then press Space!`;
      } else {
        g.kind = 'item';
        const k = g.things.shift(), rs = randInt(0, 1), n = g.tier + 2;
        g.k = k; g.rs = rs; g.ans = 1 - rs;
        const others = shuffle(g.things.slice()).slice(0, n - 2).map(o => ({ k: o, st: randInt(0, 1) }));
        const list = shuffle([{ k, st: g.ans }, { k, st: rs }, ...others]);
        g.items = list.map((it, i) => ({ ...it, home: OL_SLOTS[n][i], x: OL_SLOTS[n][i], y: ITEM_Y, at: 'home', shake: 0 }));
        g.answer = g.items.findIndex(it => it.k === k && it.st === g.ans);
        const T = OL_THINGS[k];
        g.say = `The lake shows ${T.ph[rs].toLowerCase()}. The lake always shows the opposite! Put the opposite on the magic rock.`;
        g.msg = `The lake shows ${T.ph[rs]}. Put the OPPOSITE on the rock!`;
      }
      if (g.phase === 'play') speak(g.say);
    },
    nearItem(g) {
      let best = -1, bd = 56;
      g.items.forEach((it, i) => { const d = Math.abs(it.home - g.ax); if (it.at === 'home' && d < bd) { bd = d; best = i; } });
      return best;
    },
    act(g) {
      if (g.kind === 'boat') return this.ring(g);
      if (g.carry >= 0) {
        const it = g.items[g.carry];
        if (Math.abs(g.ax - ROCK) < 70) { it.at = 'rock'; g.placed = g.carry; g.carry = -1; g.state = 'check'; g.t2 = 0.8; g.ripple = 1; SFX.pop(); tone(520, 0.5, 'sine', 0.08, 0, 880); }
        else { it.at = 'home'; g.carry = -1; SFX.click(); }
        return;
      }
      const i = this.nearItem(g);
      if (i >= 0) { g.carry = i; g.items[i].at = 'held'; SFX.pick(); }
      else if (Math.abs(g.ax - ROCK) < 70) speak('Find the opposite on the shore first, then bring it here!');
    },
    ring(g) {
      const rx = W - g.boatX, side = g.tx < ROCK ? 'left' : 'right';
      if (Math.abs(rx - g.tx) < (g.tier === 3 ? 34 : 42)) {
        g.total += [1, 0.6, 0.35, 0.2][Math.min(g.mist, 3)];
        g.state = 'yay'; g.t2 = 3; g.hop = 1; SFX.sparkle(); burst(g.tx, REF.y, 26);
        const me = side === 'left' ? 'RIGHT' : 'LEFT';
        speak(`Yes! You went ${me}, and the reflection went ${side.toUpperCase()}. Left and right are opposites! And look, it's upside down. Up and down are opposites too!`);
        g.msg = `${cap(me.toLowerCase())} and ${side} are opposites!`;
      } else {
        g.mist++; SFX.miss();
        const wentToward = Math.abs(g.boatX - g.tx) < 60;
        speak(g.mist >= this.revealAt(g) ? 'Take your boat to the sparkly spot, then press Space!' : wentToward ? 'Oh! Your boat is by the lily, but the REFLECTION went the other way! Walk the opposite way.' : 'Not there yet. Watch the reflection boat in the water.');
      }
    },
    update(g, dt, id) {
      g.hop = Math.max(0, g.hop - dt * 1.5); g.ripple = Math.max(0, g.ripple - dt * 0.7);
      if (g.items) for (const it of g.items) it.shake = Math.max(0, it.shake - dt);
      if (g.state !== 'play' && g.kind === 'item') {
        // Aubrey steps off the rock so everyone can see what she put there
        const to = ROCK - 120, d = to - g.ax;
        if (Math.abs(d) > 4) { g.ax += Math.sign(d) * Math.min(Math.abs(d), 260 * dt); g.facing = 1; g.run += dt * 10; } else g.run = 0;
      }
      if (g.state === 'yay') {
        g.t2 -= dt;
        if (g.t2 <= 0) { g.round++; if (g.round >= g.plan.length) { g.score = g.total / g.plan.length; g.done = true; return; } this.next(g); }
        return;
      }
      if (g.state === 'check') {
        g.t2 -= dt;
        if (g.t2 <= 0) this.judge(g);
        return;
      }
      // walking: arrows, or click somewhere to walk there
      const kb = goLeft() || goRight();
      if (kb) g.walk = null;
      if (id === 'ring') { g.walk = null; this.act(g); return; }
      if (pointer.clicked && pointer.y > 120 && !id) {
        const px = pointer.x;
        if (g.kind === 'item') {
          const hit = g.items.findIndex(it => it.at === 'home' && Math.abs(px - it.home) < 46 && Math.abs(pointer.y - it.y) < 60);
          const onRock = Math.abs(px - ROCK) < 70 && (pointer.y > 420 || Math.hypot(px - REF.x, pointer.y - REF.y) < REF.r + 10);
          if (hit >= 0) { if (g.carry >= 0) { g.items[g.carry].at = 'home'; g.carry = -1; } g.walk = { x: g.items[hit].home, act: true }; }
          else if (onRock && g.carry >= 0) g.walk = { x: ROCK, act: true };
          else g.walk = { x: px, act: false };
        } else g.walk = { x: px, act: false };
      }
      let vx = 0;
      if (goLeft()) vx = -1; else if (goRight()) vx = 1;
      else if (g.walk) { const d = g.walk.x - g.ax; if (Math.abs(d) < 6) { g.ax = g.walk.x; const a = g.walk.act; g.walk = null; if (a) this.act(g); } else vx = Math.sign(d); }
      g.ax = clamp(g.ax + vx * 300 * dt, 50, 840);
      if (vx) { g.facing = vx; g.run += dt * 10; } else g.run = 0;
      if (g.kind === 'boat') g.boatX = lerp(g.boatX, clamp(g.ax + g.facing * 40, 60, 900), Math.min(1, dt * 3));
      if (pressed[' '] || pressed.enter) { g.walk = null; this.act(g); }
      g.score = g.total / g.plan.length;
    },
    judge(g) {
      const it = g.items[g.placed], T = OL_THINGS[g.k], w = [T.a, T.b];
      if (g.placed === g.answer) {
        g.total += [1, 0.6, 0.35, 0.2][Math.min(g.mist, 3)];
        g.state = 'yay'; g.t2 = 2.8; g.hop = 1; SFX.sparkle(); burst(REF.x, REF.y, 28);
        speak(`${cap(w[g.ans])} and ${w[g.rs]} are opposites!`);
        g.msg = `${cap(w[g.ans])} and ${w[g.rs]} are opposites!`;
        return;
      }
      g.mist++; it.at = 'home'; it.shake = 0.6; g.state = 'play'; g.placed = -1; SFX.miss();
      const reveal = g.mist >= this.revealAt(g) ? ' Look for the sparkles!' : '';
      if (it.k === g.k) speak(`That one is ${w[g.rs]} too. That's the SAME! The lake needs the opposite of ${w[g.rs]}.${reveal}`);
      else speak(`Hmm, the lake is showing ${T.ph[g.rs].toLowerCase()}. Find the opposite one!${reveal}`);
    },
    draw(g) {
      // Marina on her rock
      drawCritter('Marina the Mermaid', 896, 414, 0.64, -1);
      // prompt banner
      panel(120, 66, 640, 50, 20);
      const lines = wrap(g.msg, 610, 21);
      lines.slice(0, 2).forEach((l, i) => text(l, 440, 91 + (i - (lines.length > 1 ? 0.5 : 0)) * 22, lines.length > 1 ? 18 : 21, '#5a2a6e', 'center', 700));
      if (g.kind === 'item') this.drawItems(g); else this.drawBoat(g);
      // Aubrey
      const frame = g.run ? `run${1 + (Math.floor(g.run) % 5)}` : 'idle_front';
      drawAubrey(g.ax, GYA, frame, g.facing, g.hop ? Math.sin(g.hop * Math.PI) * 26 : 0, AS);
      if (g.kind === 'item' && g.carry >= 0) {
        const it = g.items[g.carry];
        drawThing(it.k, it.st, g.ax + g.facing * 40, GYA - 66 + Math.sin(S.t * 6) * 2, 0.75);
      }
      if (g.kind === 'boat') {
        // the string from Aubrey's hand to the boat
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(g.ax + g.facing * 16, GYA - 64); ctx.quadraticCurveTo((g.ax + g.boatX) / 2, 440, g.boatX, 430); ctx.stroke();
      }
    },
    magicRock(g) {
      const on = g.kind === 'item';
      glow(ROCK, 476, 70, '170,140,255', 0.35 + 0.15 * Math.sin(S.t * 3));
      INK = OL;
      inkEllipse(ROCK, 482, 52, 15, 0, '#8a7ac0', 2);
      ctx.fillStyle = '#a898e0'; ellipse(ROCK - 4, 478, 42, 8);
      for (let i = 0; i < 5; i++) star(ROCK - 32 + i * 16, 482 + (i % 2) * 3, 3 + Math.sin(S.t * 4 + i) * 1.2, '#e8dcff');
      if (on && g.state === 'play' && g.carry >= 0 && Math.abs(g.ax - ROCK) > 70) outlined('⬇', ROCK, 438 + Math.sin(S.t * 5) * 4, 22, '#fff6a8');
    },
    refPool(g, fill) {
      const { x, y, r } = REF, yay = g.state === 'yay';
      glow(x, y, r * 1.8, yay ? '255,240,160' : '160,190,255', 0.45);
      ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, r * 1.25, r, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = vgradL(y - r, y + r, '#5a6ad8', '#24307a'); ctx.fillRect(x - r * 1.3, y - r, r * 2.6, r * 2);
      fill();
      ctx.strokeStyle = 'rgba(220,235,255,.45)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const yy = y - 30 + i * 20, xx = x - 50 + ((i * 37 + S.t * 18) % 90); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 10, yy - 3, xx + 20, yy); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = yay ? '#ffe08a' : 'rgba(210,225,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, r * 1.25, r, 0, 0, Math.PI * 2); ctx.stroke();
      if (g.ripple > 0) { ctx.strokeStyle = `rgba(255,255,255,${g.ripple})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, r * (2.4 - g.ripple), r * (1.9 - g.ripple * 0.8), 0, 0, Math.PI * 2); ctx.stroke(); }
    },
    drawItems(g) {
      const T = OL_THINGS[g.k], w = [T.a, T.b], yay = g.state === 'yay';
      // the reflection Marina's lake is showing
      this.refPool(g, () => drawWobbly(() => { ctx.scale(1.25, 1.25); OL_THINGS[g.k].d[g.rs](); }, REF.x, REF.y + 4));
      if (g.tier < 3 || yay) outlined(w[g.rs].toUpperCase(), REF.x, REF.y - REF.r - 16, 20, '#cfe0ff');
      this.magicRock(g);
      const reveal = g.mist >= this.revealAt(g);
      g.items.forEach((it, i) => {
        if (it.at === 'held') return;
        const onRock = it.at === 'rock', x = (onRock ? ROCK : it.home) + Math.sin(it.shake * 40) * it.shake * 14, y = onRock ? 450 : it.y;
        if (!onRock) { ctx.fillStyle = 'rgba(20,30,60,.35)'; ellipse(x, y + 30, 30, 6); }
        if (reveal && i === g.answer && !onRock) { glow(x, y, 60, '255,240,140', 0.6 + 0.2 * Math.sin(S.t * 6)); for (let k = 0; k < 4; k++) star(x + Math.cos(S.t * 2 + k * 1.57) * 40, y + Math.sin(S.t * 2 + k * 1.57) * 30, 6, '#fff6a8'); }
        drawThing(it.k, it.st, x, y, 1);
        if ((g.tier === 1 || yay) && !onRock) outlined(OL_THINGS[it.k][it.st ? 'b' : 'a'], x, y - 44, 15, '#fff');
        if (onRock && yay) outlined(w[g.ans].toUpperCase(), ROCK, 508, 20, '#fff6a8');
      });
      if (yay) {
        ctx.strokeStyle = 'rgba(255,246,168,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(REF.x + 72, REF.y + 10); ctx.quadraticCurveTo(REF.x + 120, 410, REF.x + 50, 452); ctx.stroke();
        outlined('opposites!', REF.x + 140, REF.y - 6, 18, '#fff6a8');
      }
      if (g.state === 'play' && g.carry < 0) {
        const n = this.nearItem(g);
        if (n >= 0) outlined('Space', g.items[n].home, ITEM_Y + 46, 14, '#fff6a8');
      }
    },
    drawBoat(g) {
      const rx = W - g.boatX, yay = g.state === 'yay';
      // a sparkly mirror line down the middle of the lake
      for (let y = 312; y < 440; y += 12) { ctx.fillStyle = `rgba(220,230,255,${0.25 + 0.25 * Math.sin(S.t * 4 + y * 0.1)})`; ctx.fillRect(478, y, 4, 6); }
      lily(g.tx, 350, 30, true);
      if (g.mist >= this.revealAt(g) && !yay) {
        const gx = W - g.tx;
        glow(gx, 440, 50, '255,240,140', 0.6 + 0.2 * Math.sin(S.t * 6));
        outlined('Boat here!', gx, 404, 16, '#fff6a8'); outlined('⬇', gx, 424, 20, '#fff6a8');
      }
      this.magicRock(g);
      // the reflection boat: the other way round, and upside down
      ctx.save(); ctx.globalAlpha = 0.85;
      drawWobbly(() => { ctx.scale(-1, 1); toyBoat(); }, rx, 340, true);
      ctx.restore();
      // the real toy boat bobbing by the shore
      ctx.save(); ctx.translate(g.boatX, 424 + Math.sin(S.t * 3) * 2); ctx.scale(g.facing < 0 ? -1 : 1, 1); toyBoat(); ctx.restore();
      if (yay) { burst(g.tx, 340, 1); outlined(g.msg, W / 2, 290, 24, '#fff6a8'); }
      button('ring', 800, 470, 140, 56, 'Here!', { icon: '🔔', color: '#9a6ae0', size: 18, on: g.state === 'play' });
    },
  };

  restage('moonlake', {
    games: [['rowrace', 'moonbeam', {}], ['oppositelake', 'crystal', {}]],
    mid: [
      "N:What a race! Now come and see my secret. This lake is MAGIC.",
      "N:Whatever you put on the magic rock, the lake shows the OPPOSITE! Put a happy frog there and a sad frog shows in the water.",
      'A:thinking:So if the lake shows a sad frog... the real one is happy!',
      "N:You've got it! Find the opposites on the shore, and tow my toy boat too. Watch which way its reflection goes!",
    ],
  });
}
