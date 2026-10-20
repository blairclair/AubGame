'use strict';
// Inside the shed: the hub, bath & brush, cuddles, the style studio, and Mom's surprise visits.

const HUB_UNI = { x: 400, y: 494, s: 1.12 };

function drawShedInterior(dim = 0) {
  ctx.fillStyle = '#8a5c3b'; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 48) {
    ctx.fillStyle = (x / 48) % 2 ? '#93633f' : '#875a39'; ctx.fillRect(x, 0, 46, H);
    ctx.fillStyle = 'rgba(60,30,20,.35)'; ctx.fillRect(x + 46, 0, 2, H);
    ctx.fillStyle = 'rgba(60,30,20,.25)'; circle(x + 12, 100 + (x * 7) % 300, 3);
  }
  // window shows the time of day
  const sky = [['#9fdcff', '#e6f6ff'], ['#ffcf8a', '#ffe9c4'], ['#2a2a6a', '#5a4a8a']][S.slot ?? 0];
  const g = ctx.createLinearGradient(0, 70, 0, 190);
  g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
  inkRect(76, 64, 164, 128, '#5b3d26', 3, 6);
  ctx.fillStyle = g; ctx.fillRect(86, 74, 144, 108);
  if (S.slot === 2) { ctx.fillStyle = '#fff8d8'; circle(200, 102, 14); for (let i = 0; i < 6; i++) star(100 + i * 22, 90 + (i * 31) % 70, 2, '#fff'); }
  else { ctx.fillStyle = S.slot === 1 ? '#ff9a5a' : '#ffe36b'; circle(200, 104, 16); }
  ctx.fillStyle = '#5b3d26'; ctx.fillRect(155, 74, 6, 108); ctx.fillRect(86, 125, 144, 6);
  // fairy lights
  ctx.strokeStyle = '#3d2c22'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 30); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 30 + Math.sin(x / 80) * 14 + 10); ctx.stroke();
  for (let x = 20; x < W; x += 40) {
    const y = 30 + Math.sin(x / 80) * 14 + 16;
    const c = ['#ff8fc8', '#ffe36b', '#8ad4ff', '#a6f0b8'][(x / 40) % 4 | 0];
    ctx.fillStyle = c; ctx.globalAlpha = 0.25; circle(x, y, 12); ctx.globalAlpha = 1; circle(x, y, 5);
  }
  // shelf with jars
  inkRect(600, 176, 300, 12, '#6e4a30', 2.5, 3);
  [['#ffb3d6', '🌸'], ['#b8e6ff', '🐚'], ['#fff1a8', '⭐'], ['#d6c2ff', '💎'], ['#c8f0c0', '🌼']].forEach(([c, e], i) => {
    rrect(612 + i * 58, 128, 42, 48, 10, c, OL, 2.5);
    rrect(616 + i * 58, 122, 34, 10, 4, '#a07850', OL, 2);
    emoji(e, 633 + i * 58, 154, 22);
  });
  // rug and hay bed
  ctx.fillStyle = '#c2557f'; ellipse(HUB_UNI.x, 506, 300, 34);
  ctx.fillStyle = '#e07aa0'; ellipse(HUB_UNI.x, 504, 270, 26);
  ctx.fillStyle = '#e8c766'; ellipse(HUB_UNI.x - 160, 500, 120, 30);
  ctx.fillStyle = '#d4b04f'; for (let i = 0; i < 14; i++) ctx.fillRect(HUB_UNI.x - 260 + i * 15, 486 + (i * 7) % 14, 20, 3);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 516, W, 24);
  if (dim) { ctx.fillStyle = `rgba(20,10,30,${dim})`; ctx.fillRect(0, 0, W, H); }
}

function drawTopBar() {
  darkPanel(12, 12, 360, 46, 23);
  emoji(['☀️', '🌤️', '🌙'][S.slot], 36, 35, 24);
  text(`Day ${S.day} of ${SHOW_DAY} · ${SLOT_NAMES[S.slot]}`, 58, 35, 19, '#fff', 'left', 700);
  const left = daysLeft();
  text(left === 0 ? 'Show TONIGHT!' : `Show in ${left} day${left > 1 ? 's' : ''}`, 360, 35, 14, '#ffd1ec', 'right', 600);
  darkPanel(W - 210, 12, 198, 46, 23);
  text('Mom suspicion', W - 196, 35, 14, '#fff');
  for (let i = 0; i < 3; i++) {
    const on = i < S.strikes;
    ctx.globalAlpha = on ? 1 : 0.3;
    emoji('👀', W - 90 + i * 28, 35, 20);
  }
  ctx.globalAlpha = 1;
}
function drawStats(x, y) {
  darkPanel(x, y, 240, 178, 16);
  text(S.name, x + 16, y + 22, 21, '#ffd1ec', 'left', 700);
  [['✨', 'Shine', S.shine, '#8ad4ff'], ['💗', 'Happy', S.happy, '#ff7fd0'], ['💃', 'Poise', S.poise, '#ffd36b']].forEach(([ic, lbl, v, col], i) => {
    const yy = y + 54 + i * 32;
    emoji(ic, x + 26, yy, 18);
    text(lbl, x + 42, yy, 15, '#fff', 'left', 500);
    bar(x + 98, yy - 7, 124, 14, v, col, 'rgba(255,255,255,.18)');
  });
  const m = themeMatchCount();
  emoji(theme().icon, x + 26, y + 152, 18);
  text(`${theme().name}: ${m}/7 match`, x + 42, y + 152, 15, m >= 6 ? '#9ff0b8' : '#fff', 'left', 600);
}
function drawMats(x, y, w, rows = 1) {
  const perRow = Math.ceil(MAT_ORDER.length / rows);
  darkPanel(x, y - (rows - 1) * 32, w, 40 + (rows - 1) * 32, 14);
  const step = (w - 20) / perRow;
  MAT_ORDER.forEach((k, i) => {
    const cx = x + 22 + (i % perRow) * step, cy = y + 20 - (rows - 1 - Math.floor(i / perRow)) * 32;
    ctx.globalAlpha = S.mats[k] ? 1 : 0.4;
    emoji(MATS[k].icon, cx, cy, 20);
    text(String(S.mats[k]), cx + 13, cy + 2, 14, '#fff', 'left', 700);
  });
  ctx.globalAlpha = 1;
}
function hubTip() {
  if (S.day === SHOW_DAY && S.slot === 1) return 'Last chance to get ready — the show is tonight!';
  if (S.happy < 30) return `${S.name} is grumpy. Unhappy unicorns get NOISY — and Mom might come check.`;
  if (S.shine < 40) return `${S.name} is pretty muddy. A bath & brush will make her shine.`;
  if (themeMatchCount() < 3) {
    const want = WARDROBE.find(i => i.tags.includes(S.theme) && !S.owned[i.id] && i.cost && !canAfford(i.cost));
    return want ? `Tip: the ${want.name} fits the ${theme().name} theme. It needs ${costText(want.cost)}.` : 'Visit the Style Studio to dress her up for the theme!';
  }
  if (S.poise < 50) return 'Practice the runway walk so she struts her stuff on show night.';
  return `${S.name} is looking wonderful! Keep it up.`;
}

// --- hub ---------------------------------------------------------------------------
SCENES.salon = {
  enter() { this.joy = 0; },
  update(dt) {
    this.joy = Math.max(0, this.joy - dt);
    if (pressed.m) muted = !muted;
    const id = clickedButton();
    if (id === 'gather') { SFX.step(); return startWorld('gather'); }
    if (id === 'groom') return setScene('groom');
    if (id === 'runway') return startRunway('practice');
    if (id === 'cuddle') return setScene('cuddle');
    if (id === 'style') return setScene('style');
    if (pointer.clicked && Math.abs(pointer.x - (HUB_UNI.x + 30)) < 110 && pointer.y > 230 && pointer.y < 500) {
      this.joy = 0.8; SFX.pop();
      burst(pointer.x, pointer.y, 4, { kind: 'heart', colors: ['#ff6fb5', '#ff9ec7'], spread: 50, up: 40 });
    }
  },
  draw() {
    buttons = [];
    drawShedInterior();
    const mood = this.joy > 0 ? 'joy' : S.happy < 30 ? 'sad' : undefined;
    drawUnicorn(HUB_UNI.x, HUB_UNI.y, HUB_UNI.s, uniLook(), { facing: 1, mood, glow: S.shine / 140 });
    drawTopBar();
    drawStats(12, 70);
    const bx = W - 262, w = 248;
    darkPanel(bx - 8, 70, w + 16, 344, 18);
    text('What should we do?', bx + w / 2, 92, 16, '#ffd1ec', 'center', 700);
    button('gather', bx, 110, w, 54, 'Go gathering', { icon: '🧺', sub: 'find materials outside', key: '1', color: '#5fb87a' });
    button('groom', bx, 170, w, 54, 'Bath & brush', { icon: '🛁', sub: '+ Shine', key: '2', color: '#4fa8e0' });
    button('runway', bx, 230, w, 54, 'Runway practice', { icon: '💃', sub: '+ Poise', key: '3', color: '#e0a03f' });
    button('cuddle', bx, 290, w, 54, 'Cuddles & treats', { icon: '💗', sub: '+ Happy', key: '4', color: '#ff6fb5' });
    button('style', bx, 350, w, 54, 'Style Studio', { icon: '👗', sub: 'free — no time used!', key: '5', color: '#9a6ae0' });
    text('Each activity uses up the ' + SLOT_NAMES[S.slot].toLowerCase(), bx + w / 2, 428, 12, 'rgba(255,255,255,.8)', 'center', 500);
    drawMats(12, H - 52, 560);
    const tip = hubTip();
    ctx.font = `600 15px ${FONT}`;
    const tw = Math.min(560, ctx.measureText(tip).width + 50);
    rrect(12, H - 100, tw, 38, 19, 'rgba(255,248,252,.92)', '#e2c6f5', 2);
    emoji('🧚', 32, H - 81, 18);
    text(wrap(tip, 510, 15, 600)[0], 50, H - 81, 15, '#5a2a6e');
    drawFx(false);
  },
};

// --- bath & brush ------------------------------------------------------------------
const GROOM_UNI = { x: 400, y: 494, s: 1.3 };
const MUD_SPOTS = [[-40, -95], [-15, -78], [10, -100], [35, -85], [-50, -70], [0, -62], [25, -62], [-42, -28], [30, -26], [50, -112], [-25, -108], [62, -132]];
const TANGLE_SPOTS = [[64, -178], [48, -146], [32, -116], [-74, -70], [-86, -42]];
SCENES.groom = {
  enter() {
    const n = clamp(Math.round((100 - S.shine) / 8), 3, MUD_SPOTS.length);
    const spots = [...MUD_SPOTS].sort(() => Math.random() - 0.5).slice(0, n).map(([x, y]) => ({ x, y, r: rand(9, 13), dirt: 1, kind: 'mud' }));
    for (const [x, y] of TANGLE_SPOTS) spots.push({ x, y, r: 11, dirt: 1, kind: 'tangle' });
    Object.assign(this, { spots, stage: 'scrub', px: pointer.x, py: pointer.y, wasDown: false, bubbles: [], popped: 0, rinseT: 0, spawnT: 0, start: S.shine, sfxT: 0 });
  },
  finish() {
    const cleanFrac = this.spots.filter(s => s.dirt <= 0).length / this.spots.length;
    const old = S.shine;
    S.shine = Math.min(100, Math.max(S.shine, Math.round(38 + 42 * cleanFrac + this.popped * 2)));
    S.happy = Math.min(100, S.happy + 6);
    SFX.fanfare();
    burst(GROOM_UNI.x, GROOM_UNI.y - 160, 40);
    this.stage = 'done';
    say([['unicorn', 'joy', '*happy, sparkly whinny*'], ['narrator', null, `${S.name} is squeaky clean! Shine ${old} → ${S.shine} ✨`]], () => afterActivity());
  },
  update(dt) {
    if (this.stage === 'done') return;
    const id = clickedButton();
    if (id === 'skip') return this.finish();
    const moved = Math.hypot(pointer.x - this.px, pointer.y - this.py);
    this.px = pointer.x; this.py = pointer.y;
    const dragging = pointer.down && this.wasDown;
    this.wasDown = pointer.down;
    const { x: ux, y: uy, s } = GROOM_UNI;
    if (this.stage === 'scrub') {
      if (!dragging || moved <= 0) return;
      this.sfxT -= dt;
      for (const m of this.spots) {
        if (m.dirt <= 0) continue;
        const sx = ux + m.x * s, sy = uy + m.y * s;
        if (Math.hypot(pointer.x - sx, pointer.y - sy) < m.r * s + 18) {
          m.dirt -= moved * (m.kind === 'mud' ? 0.0065 : 0.0045);
          if (this.sfxT <= 0) { SFX.scrub(); this.sfxT = 0.08; }
          if (Math.random() < 0.35) burst(pointer.x, pointer.y, 1, { kind: 'bubble', colors: ['#fff'], spread: 40, up: 20 });
          if (m.dirt <= 0) { SFX.pick(); burst(sx, sy, 10, { spread: 90, up: 40 }); }
        }
      }
      if (this.spots.every(m => m.dirt <= 0)) { this.stage = 'rinse'; SFX.sparkle(); }
    } else if (this.stage === 'rinse') {
      this.rinseT += dt; this.spawnT -= dt;
      if (this.spawnT <= 0 && this.rinseT < 6) {
        this.spawnT = 0.42;
        this.bubbles.push({ x: rand(200, 620), y: 520, r: rand(18, 30), vx: rand(-20, 20), ph: rand(0, 6) });
      }
      for (const b of this.bubbles) { b.y -= 70 * dt; b.x += Math.sin(S.t * 2 + b.ph) * 30 * dt + b.vx * dt; }
      if (pointer.clicked) {
        const hit = this.bubbles.find(b => Math.hypot(pointer.x - b.x, pointer.y - b.y) < b.r + 6);
        if (hit) { SFX.pop(); this.popped++; burst(hit.x, hit.y, 8, { colors: ['#fff', '#b8e6ff', '#ffb3e0'], spread: 80, up: 20 }); this.bubbles.splice(this.bubbles.indexOf(hit), 1); }
      }
      this.bubbles = this.bubbles.filter(b => b.y > -40);
      if (this.rinseT > 6 && !this.bubbles.length) this.finish();
    }
  },
  draw() {
    buttons = [];
    drawShedInterior();
    const { x, y, s } = GROOM_UNI;
    drawUnicorn(x, y, s, uniLook({ shine: this.stage === 'scrub' ? Math.max(S.shine, 20) : 90 }), { facing: 1, mud: this.stage === 'scrub' ? this.spots : undefined, mood: this.stage === 'scrub' ? 'sad' : 'joy' });
    const left = this.spots.filter(m => m.dirt > 0).length;
    const msg = this.stage === 'scrub' ? `Click & drag to scrub the mud and brush out tangles!  (${left} left)` : this.stage === 'rinse' ? `Rinse time! Pop the bubbles for extra sparkle!  (${this.popped} popped)` : '';
    if (msg) { darkPanel(W / 2 - 300, 14, 600, 44, 22); text(msg, W / 2, 36, 17, '#fff', 'center'); }
    for (const b of this.bubbles) {
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
      const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, b.x, b.y, b.r);
      g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(180,220,255,.15)');
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = 'rgba(255,200,240,.6)'; ellipse(b.x + b.r * 0.4, b.y + b.r * 0.3, b.r * 0.25, b.r * 0.12, -0.6);
    }
    if (this.stage !== 'done') button('skip', W - 190, H - 70, 170, 52, this.stage === 'rinse' ? 'Finish' : 'All done', { color: '#9a6ae0' });
    drawFx(false);
    if (this.stage === 'scrub') {
      ctx.save(); ctx.translate(pointer.x, pointer.y); ctx.rotate(-0.5 + (pointer.down ? Math.sin(S.t * 30) * 0.25 : 0));
      rrect(-8, 0, 16, 50, 6, '#c86ad8', OL, 2.5);
      rrect(-20, -28, 40, 30, 9, '#ff9ec7', OL, 2.5);
      ctx.fillStyle = '#fff'; for (let i = -15; i <= 15; i += 7.5) ctx.fillRect(i - 1.5, -38, 3, 11);
      ctx.restore();
    }
  },
};

// --- cuddles & treats ----------------------------------------------------------------
const CUDDLE_SPOTS = [[72, -222, 'ear'], [102, -162, 'cheek'], [48, -132, 'neck'], [-10, -114, 'back'], [118, -152, 'nose'], [-35, -95, 'side']];
SCENES.cuddle = {
  enter() { Object.assign(this, { time: 12, target: null, nextT: 0.6, joy: 0, got: 0, ate: 0, done: false }); },
  update(dt) {
    if (this.done) return;
    this.time -= dt; this.nextT -= dt; this.joy = Math.max(0, this.joy - dt);
    const id = clickedButton();
    if (id === 'apple' && S.mats.apple > 0) {
      S.mats.apple--; this.ate++; S.happy = Math.min(100, S.happy + 10); this.joy = 1;
      SFX.pick(); burst(HUB_UNI.x + 130, HUB_UNI.y - 160, 6, { kind: 'heart', colors: ['#ff6fb5'], spread: 60, up: 40 });
      floatText(HUB_UNI.x + 120, HUB_UNI.y - 230, 'Crunch crunch! +10 💗', '#fff');
    }
    if (id === 'stop') this.time = 0;
    if (this.target) {
      this.target.life -= dt;
      const { x, y, s } = HUB_UNI, tx = x + this.target.x * s, ty = y + this.target.y * s;
      if (pointer.clicked && Math.hypot(pointer.x - tx, pointer.y - ty) < 40) {
        this.got++; S.happy = Math.min(100, S.happy + 4); this.joy = 0.7;
        tone(660 + this.got * 30, 0.15, 'sine', 0.08);
        burst(tx, ty, 7, { kind: 'heart', colors: ['#ff6fb5', '#ff9ec7'], spread: 70, up: 50 });
        floatText(tx, ty - 30, `Scratches! (${this.target.name})`, '#fff', false, 17);
        this.target = null; this.nextT = 0.35;
      } else if (this.target.life <= 0) { this.target = null; this.nextT = 0.3; }
    }
    if (!this.target && this.nextT <= 0 && this.time > 0) {
      const [x, y, name] = pick(CUDDLE_SPOTS);
      this.target = { x, y, name, life: 1.6 };
    }
    if (this.time <= 0) {
      this.done = true;
      say([['unicorn', 'joy', '*purrs like a very large, very sparkly kitten*'], ['narrator', null, `${S.name} feels so loved. Happy: ${Math.round(S.happy)} 💗`]], () => afterActivity());
    }
  },
  draw() {
    buttons = [];
    drawShedInterior();
    drawUnicorn(HUB_UNI.x, HUB_UNI.y, HUB_UNI.s, uniLook(), { facing: 1, mood: this.joy > 0 ? 'joy' : undefined, glow: 0.4 });
    darkPanel(W / 2 - 290, 14, 580, 44, 22);
    text(`Click the hearts to give ${S.name} scratches!  ⏱ ${Math.max(0, Math.ceil(this.time))}`, W / 2, 36, 17, '#fff', 'center');
    if (this.target) {
      const { x, y, s } = HUB_UNI, tx = x + this.target.x * s, ty = y + this.target.y * s;
      const p = 1 + Math.sin(S.t * 10) * 0.12;
      ctx.globalAlpha = clamp(this.target.life * 2, 0, 1);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tx, ty + 8, 30 * p, 0, Math.PI * 2); ctx.stroke();
      heart(tx, ty - 6, 34 * p, '#ff4f8b');
      ctx.globalAlpha = 1;
    }
    button('apple', W - 262, 300, 248, 56, `Give an apple (${S.mats.apple})`, { icon: '🍎', on: S.mats.apple > 0, color: '#e8413f', sub: '+10 Happy' });
    button('stop', W - 262, 366, 248, 48, 'Finish cuddles', { color: '#9a6ae0' });
    drawStats(12, 70);
    drawFx(false);
  },
};

// --- style studio (free) ---------------------------------------------------------------
SCENES.style = {
  enter() { this.tab = this.tab || 'mane'; this.shake = 0; this.joy = 0; },
  update(dt) {
    this.shake = Math.max(0, this.shake - dt); this.joy = Math.max(0, this.joy - dt);
    if (pressed.escape) return setScene('salon');
    const id = clickedButton();
    if (!id) return;
    if (id === 'done') return setScene('salon');
    if (id.startsWith('tab:')) { this.tab = id.slice(4); return; }
    if (id.startsWith('item:')) {
      const it = ITEM[id.slice(5)];
      if (S.owned[it.id]) {
        const optional = it.slot !== 'mane' && it.slot !== 'style';
        S.equip[it.slot] = S.equip[it.slot] === it.id && optional ? null : it.id;
        this.joy = 0.6;
      } else if (canAfford(it.cost)) {
        pay(it.cost); S.owned[it.id] = true; S.equip[it.slot] = it.id;
        SFX.sparkle(); this.joy = 1.2;
        burst(300, 300, 30);
        floatText(300, 160, `Made: ${it.name}!`, '#fff6a8', false, 24);
      } else {
        SFX.miss(); this.shake = 0.4;
        floatText(730, 480, `Need ${costText(it.cost)} — go gathering!`, '#ffd1ec', false, 17);
      }
    }
  },
  draw() {
    buttons = [];
    drawShedInterior(0.15);
    drawUnicorn(300, 492, 1.15, uniLook(), { facing: 1, mood: this.joy > 0 ? 'joy' : undefined, glow: 0.5 });
    darkPanel(12, 12, 300, 46, 23);
    emoji('👗', 36, 35, 22);
    text('Style Studio', 56, 35, 20, '#fff', 'left', 700);
    darkPanel(12, 66, 300, 40, 20);
    text(`${theme().icon} Theme: ${theme().name} — ${themeMatchCount()}/7 match`, 28, 86, 15, '#ffd1ec', 'left', 600);

    const px = 340, pw = W - px - 12;
    panel(px, 12, pw, H - 84, 18);
    SLOTS.forEach((sl, i) => {
      const tx = px + 10 + i * ((pw - 20) / 7), tw = (pw - 20) / 7 - 6, on = this.tab === sl.id;
      const b = { id: `tab:${sl.id}`, x: tx, y: 22, w: tw, h: 52, on: true, key: String(i + 1) };
      buttons.push(b);
      rrect(tx, 22, tw, 52, 12, on ? '#ff6fb5' : inRect(b) ? '#ffd1ec' : '#f3e6fb', on ? null : '#e2c6f5', 2);
      emoji(sl.icon, tx + tw / 2, 42, 22);
      if (slotMatches(sl.id)) { ctx.fillStyle = '#3fbf6a'; circle(tx + tw - 8, 28, 8); text('✓', tx + tw - 8, 28, 11, '#fff', 'center', 700); }
      text(sl.name.split(' ')[0], tx + tw / 2, 66, 11, on ? '#fff' : '#7a5a8a', 'center', 600);
    });
    const slot = SLOTS.find(s => s.id === this.tab);
    text(slot.name, px + 18, 96, 19, '#5a2a6e', 'left', 700);
    text(`${theme().icon} = matches the theme`, px + pw - 16, 96, 13, '#9a7aaa', 'right', 500);

    const items = WARDROBE.filter(i => i.slot === this.tab);
    const cw = (pw - 40) / 2, ch = 72;
    items.forEach((it, i) => {
      const cx = px + 14 + (i % 2) * (cw + 12), cy = 112 + Math.floor(i / 2) * (ch + 8);
      const owned = S.owned[it.id], worn = S.equip[it.slot] === it.id, afford = !owned && canAfford(it.cost);
      const b = { id: `item:${it.id}`, x: cx, y: cy, w: cw, h: ch, on: true };
      buttons.push(b);
      const hover = inRect(b);
      const shakeX = !owned && !afford && hover && this.shake > 0 ? Math.sin(S.t * 60) * 3 : 0;
      rrect(cx + shakeX, cy, cw, ch, 14, worn ? '#ffe3f1' : hover ? '#fbf3ff' : '#fff', worn ? '#ff6fb5' : '#e2c6f5', worn ? 3.5 : 2);
      const ix = cx + 34 + shakeX, iy = cy + ch / 2;
      if (it.slot === 'mane') {
        const pal = MANES[it.id];
        pal.forEach((c, j) => { const a = j / pal.length * Math.PI * 2; ctx.fillStyle = c; circle(ix + Math.cos(a) * 10, iy + Math.sin(a) * 10, 9); });
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, 21, 0, Math.PI * 2); ctx.stroke();
      } else if (it.slot === 'hooves') {
        rrect(ix - 16, iy - 14, 32, 28, 8, HOOF_COLORS[it.value], OL, 2.5);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(ix - 6, iy - 5, 4);
      } else emoji(it.icon, ix, iy, 30);
      if (!owned && !afford) { ctx.globalAlpha = 0.55; }
      text(it.name, cx + 64 + shakeX, cy + 22, 15, '#4a2060', 'left', 700);
      ctx.globalAlpha = 1;
      const tagStr = it.tags.map(t => THEMES[t].icon).join(' ');
      if (it.tags.includes(S.theme)) rrect(cx + cw - 34, cy + 8, 26, 22, 8, '#fff2a8');
      if (tagStr) { ctx.font = `14px ${EMOJI_FONT}`; ctx.textAlign = 'right'; ctx.fillText(tagStr, cx + cw - 10, cy + 20); }
      let status, col;
      if (worn) { status = 'Wearing ✓'; col = '#d0407e'; }
      else if (owned) { status = 'Click to wear'; col = '#7a5a8a'; }
      else if (afford) { status = `Craft: ${costText(it.cost)}`; col = '#2f9a55'; }
      else { status = `Need: ${costText(it.cost)}`; col = '#b07a90'; }
      text(status, cx + 64 + shakeX, cy + 50, 14, col, 'left', 600);
    });
    drawMats(12, H - 52, 316, 2);
    button('done', W - 212, H - 64, 200, 52, 'Done', { color: '#9a6ae0', key: 'Escape' });
    drawFx(false);
  },
};

// --- Mom's surprise visit: hide everything! ---------------------------------------------
const EVIDENCE_SPOTS = [[110, 236], [200, 250], [560, 230], [650, 260], [90, 420], [560, 470], [680, 440], [800, 470], [880, 300], [740, 240]];
SCENES.hide = {
  enter(onDone) {
    const n = 3 + Math.floor(S.day / 2);
    const icons = ['✨', '🎀', '🌸', '💎', '🪶', '⭐', '🐚', '🌼', '🫐'];
    const spots = [...EVIDENCE_SPOTS].sort(() => Math.random() - 0.5).slice(0, n);
    Object.assign(this, {
      onDone, time: 7.6 - S.day * 0.4, max: 7.6 - S.day * 0.4, tarp: false, result: null, stepT: 0, intro: 1.2,
      items: spots.map(([x, y]) => ({ x, y, icon: pick(icons), gone: false, fly: 0 })),
    });
    SFX.alert();
  },
  update(dt) {
    if (this.result) return;
    if (this.intro > 0) { this.intro -= dt; return; }
    this.time -= dt; this.stepT -= dt;
    if (this.stepT <= 0) { SFX.step(); this.stepT = Math.max(0.25, this.time / this.max * 0.6); }
    for (const it of this.items) if (it.gone) it.fly = Math.min(1, it.fly + dt * 3);
    if (pointer.clicked) {
      const it = this.items.find(i => !i.gone && Math.hypot(pointer.x - i.x, pointer.y - i.y) < 36);
      if (it) { it.gone = true; SFX.pick(); }
      else if (!this.tarp && Math.abs(pointer.x - (HUB_UNI.x + 20)) < 130 && pointer.y > 200 && pointer.y < 500) {
        this.tarp = true; SFX.hush(); burst(HUB_UNI.x, HUB_UNI.y - 120, 12, { colors: ['#9aa870', '#7a8a5a'] });
      }
    }
    const allDone = this.tarp && this.items.every(i => i.gone);
    if (allDone || this.time <= 0) {
      this.result = allDone ? 'ok' : 'fail';
      allDone ? momVisitOk(this.onDone) : momVisitFail(this.onDone);
    }
  },
  draw() {
    buttons = [];
    drawShedInterior();
    if (this.tarp) drawTarp(HUB_UNI.x + 20, HUB_UNI.y, 1.15);
    else drawUnicorn(HUB_UNI.x, HUB_UNI.y, HUB_UNI.s, uniLook(), { facing: 1, mood: 'wow' });
    // stash basket
    inkRect(850, 448, 90, 56, '#c99a5a', 3, 10);
    ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(850 + i * 18, 450); ctx.lineTo(850 + i * 18, 502); ctx.stroke(); }
    for (const it of this.items) {
      if (it.fly >= 1) continue;
      const k = easeOut(it.fly), x = lerp(it.x, 895, k), y = lerp(it.y, 470, k) - Math.sin(k * Math.PI) * 80;
      if (!it.gone) {
        ctx.fillStyle = `rgba(255,255,200,${0.4 + 0.3 * Math.sin(S.t * 8)})`; circle(x, y, 30);
      }
      emoji(it.icon, x, y, 36 * (1 - k * 0.5));
    }
    const left = this.items.filter(i => !i.gone).length;
    panel(W / 2 - 260, 14, 520, 92, 18);
    outlined("Mom's coming! Hide everything!", W / 2, 40, 24, '#ff6fb5', 'center', '#fff');
    text(`Click the sparkly evidence (${left} left)${this.tarp ? '' : ` and throw a tarp over ${S.name}!`}`, W / 2, 68, 14, '#5a2a6e', 'center', 600);
    bar(W / 2 - 230, 84, 460, 12, (this.time / this.max) * 100, this.time / this.max < 0.35 ? '#ff5a5a' : '#ffb15c');
    // Mom's silhouette approaching the window
    const k = 1 - clamp(this.time / this.max, 0, 1);
    ctx.save(); ctx.beginPath(); ctx.rect(86, 74, 144, 108); ctx.clip();
    ctx.fillStyle = 'rgba(40,20,60,.7)'; circle(110 + k * 60, 160 - k * 30, 20 + k * 14); ellipse(110 + k * 60, 210 - k * 30, 30 + k * 14, 40);
    ctx.restore();
    if (this.intro > 0) { ctx.fillStyle = `rgba(255,255,255,${this.intro * 0.4})`; ctx.fillRect(0, 0, W, H); outlined('Footsteps outside...!', W / 2, H / 2, 40, '#ffd23f'); }
    drawFx(false);
  },
};
function momVisitOk(onDone) {
  const visits = [
    [['mom', null, 'Aubrey? Oh, there you are! What are you doing out in the shed?'], ['aubrey', 'silly', 'Just... organising flowerpots!'], ['mom', null, "Well, aren't you a helper. ...Is that tarp breathing?"], ['aubrey', 'winky', "It's a very old lawnmower."], ['mom', null, "Hm! Okay, sweetie. Don't stay out too long."]],
    [['mom', null, 'Knock knock! I brought you a snack, honey.'], ['aubrey', 'happy', 'Thanks, Mom! Everything is totally normal in here!'], ['mom', null, 'I never said it wasn\'t... Okay! Love you!']],
    [['mom', null, 'Aubrey, have you seen my good ribbon? The pink one?'], ['aubrey', 'thinking', 'Nope! Never seen a ribbon in my life.'], ['mom', null, 'Hm. Must have been the wind.']],
  ];
  say([...pick(visits), ['narrator', null, 'Phew! The secret is safe.']], onDone);
}
function momVisitFail(onDone) {
  S.strikes++;
  if (S.strikes >= 3) {
    return say([
      ['mom', 'shock', "Aubrey... is that a UNICORN under that tarp?!"],
      ['fairy', '🧚', "Oh dear, oh dear. A grown-up has seen her. Magic Law says she must come home with me..."],
    ], () => setScene('gameover'));
  }
  const fails = [
    [['mom', 'shock', 'Aubrey, why is there GLITTER all over the floor? And is that a... hoofprint?'], ['aubrey', 'serious', "It's for a school project! About... horses. Sparkly horses."]],
    [['mom', 'shock', 'What was that whinnying sound?!'], ['aubrey', 'silly', 'That was me! Neigh! I\'m practising for drama class.']],
    [['mom', 'shock', 'Why does it smell like rainbows in here?'], ['aubrey', 'thinking', 'Air freshener?']],
  ];
  say([...pick(fails), ['mom', null, "Hmm. I'm keeping my eye on you, missy."], ['narrator', null, `Mom is getting suspicious! (${S.strikes} of 3)`]], onDone);
}

SCENES.gameover = {
  update() {
    if (clickedButton() !== 'retry') return;
    restoreCheckpoint();
    // a do-over shouldn't start one slip away from losing again
    S.strikes = Math.min(S.strikes, 1);
    setScene('salon');
  },
  draw() {
    buttons = [];
    drawShedInterior(0.55);
    panel(W / 2 - 280, 80, 560, 380, 24);
    ctx.drawImage(IMG.face_sad, W / 2 - 60, 104, 120, 134);
    outlined('Oh no — the secret is out!', W / 2, 270, 30, '#ff6fb5', 'center', '#fff');
    wrap(`Mom found ${S.name}! But Fairy Fizzlewick has one more trick: she can turn back time to the start of today.`, 460, 18).forEach((l, i) => text(l, W / 2, 314 + i * 26, 18, '#5a2a6e', 'center', 500));
    button('retry', W / 2 - 130, 380, 260, 56, `Try Day ${checkpoint.day} again`, { icon: '🧚', color: '#9a6ae0' });
  },
};
