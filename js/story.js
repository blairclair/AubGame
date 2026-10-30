'use strict';
// Story flow: title, nights, the fashion show, and the ending.

function startGame(pet = 'unicorn') {
  S = newGame(pet);
  parts.length = 0; floats.length = 0;
  startWorld('explore');
  saveCheckpoint();
  say([
    ['aubrey', 'excited', 'What a perfect day for exploring the woods behind our house!'],
    ['aubrey', 'silly', 'Mom says not to go too far... but "too far" is kind of a matter of opinion.'],
    ['narrator', null, 'Walk with the arrow keys. Jump with the up arrow or Space. Head right, into the woods!'],
  ]);
}
// after the last day: bounce up through the Fairy Kingdom to the show (js/kingdom.js);
// on the dino route, set off on the journey home instead: Dino Hop (js/dinohop.js), then the maze (js/dinodefense.js)
function showTime() {
  if (!isDino()) return setScene('kingdom');
  say([
    ['narrator', null, `Morning comes. The supplies are all packed, and ${S.name} is wide awake and wiggly.`],
    ['aubrey', 'determined', `Today's the day, ${S.name}. We're taking you HOME!`],
    ['dino', 'joy', '*an excited little squeak*'],
    ['narrator', null, `The path to Dinosaur Valley goes over a river of big, friendly dinosaurs. Aubrey puts ${S.name} on {her|his} back and gets ready to hop!`],
  ], () => setScene(SCENES.dinohop ? 'dinohop' : SCENES.dinodefense ? 'dinodefense' : 'dinoend'));
}

// --- night ---------------------------------------------------------------------------
SCENES.night = {
  enter() {
    S.day++; S.visitsToday = 0;
    saveCheckpoint();
    speak(`Goodnight, ${S.name}. ${this.countdown()}`);
  },
  countdown() {
    const left = daysLeft() + 1;
    if (isDino()) return left === 1 ? `Tomorrow we take ${S.name} HOME!` : `${left} more days of gathering supplies. Then the big journey home!`;
    return left === 1 ? 'Tomorrow is SHOW DAY!' : `${left} more days of adventures until the show.`;
  },
  update() { if (clickedButton() === 'next' || advancePressed()) setScene('map'); },
  draw() {
    buttons = [];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1840'); g.addColorStop(1, '#4a3a7a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    bdStars(70);
    bdMoon(800, 90, '#1e1c48');
    ctx.fillStyle = '#2a2a50'; ellipse(W / 2, H + 40, 700, 140);
    if (isDino()) { drawShedInterior(0.55); drawDinoTucked(330, 480, 1.0); }
    else drawUnicorn(330, 470, 1.0, uniLook(), { facing: 1, pose: 'sit', mood: 'sleep', glow: 0.5 });
    outlined('z', 470 + Math.sin(S.t * 2) * 6, 250 - (S.t * 20) % 40, 26, '#fff');
    outlined('Z', 490 + Math.sin(S.t * 2 + 1) * 6, 215 - (S.t * 20) % 40, 34, '#fff');
    panel(560, 130, 370, 280, 22);
    outlined(`Day ${S.day - 1} is over`, 745, 168, 30, '#ff6fb5', 'center', '#fff');
    const lines = isDino() ? [
      `${S.name} is curled up in his nest under his quilt, dreaming of his mama.`,
      `Things made for the journey: ${dinoKit().length}`,
      this.countdown(),
    ] : [
      `${S.name} curls up in the hay, wearing her new things, and dreams sparkly dreams.`,
      `Show score so far: ${outfitScore()}`,
      this.countdown(),
    ];
    let y = 210;
    for (const l of lines) for (const w of wrap(l, 330, 17)) { text(w, 745, y, 17, '#5a2a6e', 'center', 500); y += 26; }
    button('next', 655, 350, 180, 48, 'Good morning! ☀️', { color: '#9a6ae0', size: 17 });
  },
};

// --- the show ----------------------------------------------------------------------------
function startShow() { setScene('show'); }
function drawShowStage() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a1840'); g.addColorStop(1, '#5a3a8a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  bdStars(50);
  for (const x of [-30, 60, 900, 990]) { ctx.fillStyle = '#1c2a3a'; circle(x, 200, 110); ctx.fillRect(x - 20, 200, 40, 340); }
  for (const [x, c] of [[200, '255,200,240'], [480, '255,250,200'], [760, '200,230,255']]) {
    const sx = x + Math.sin(S.t * 0.8 + x) * 60;
    const lg = ctx.createLinearGradient(0, 0, 0, 500);
    lg.addColorStop(0, `rgba(${c},.35)`); lg.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x - 10, 0); ctx.lineTo(x + 10, 0); ctx.lineTo(sx + 110, 500); ctx.lineTo(sx - 110, 500); ctx.closePath(); ctx.fill();
  }
  for (const side of [-1, 1]) {
    const cx = side < 0 ? 0 : W;
    ctx.fillStyle = '#9a3a6a'; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx - side * 120, 0); ctx.quadraticCurveTo(cx - side * 60, 250, cx - side * 90, 520); ctx.lineTo(cx, 520); ctx.closePath(); ctx.fill();
  }
  for (let i = 0; i <= 16; i++) {
    const x = i * 60, y = 22 + Math.sin(i / 16 * Math.PI) * 26;
    ctx.fillStyle = ['#ff8fc8', '#ffe36b', '#8ad4ff', '#a6f0b8'][i % 4];
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 4 + i); circle(x, y, 6); ctx.globalAlpha = 1;
  }
  inkRect(60, 500, 840, 26, '#f3dcf7', 3, 8);
  ctx.fillStyle = '#ffb3d6'; ctx.fillRect(66, 506, 828, 6);
  ['🦉', '🐸', '🦔', '🐿️', '🦋', '🐉', '🧚', '🦄', '🐢', '🦊', '🐰', '🦌', '🧜‍♀️', '🐝'].forEach((c, i) => emoji(c, 40 + i * 68, 534 - Math.abs(Math.sin(S.t * 1.5 + i)) * 6, 36));
}
// --- the rival contestants strut the runway, dressed to dazzle ---------------------------
// each one's outfit: drawn around their emoji (which is ~120px, centred on (0,0)), behind or in front of it
const RIVAL_LOOKS = [
  { outfit: 'Velvet Cape · Top Hat · Monocle', glit: ['#c9a0ff', '#fff6a8'], back(t) {
      // a royal-purple velvet cape billowing out behind
      const f = Math.sin(t * 5) * 6;
      ink(P2(`M-30,-20 C-60,0 ${-78 + f},40 ${-70 + f},62 L50,62 C${56 - f},30 46,0 30,-20 Z`), '#7a3ab8', 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-40, 52, 86, 6);
    }, front(t) {
      // his head is up and to the left in the emoji
      ctx.save(); ctx.translate(-42, -36); ctx.rotate(-0.15);
      inkRect(-20, -6, 40, 7, '#2a1a3a', 2, 3); inkRect(-13, -34, 26, 30, '#2a1a3a', 2, 4); ctx.fillStyle = '#ff5f9a'; ctx.fillRect(-13, -14, 26, 5);
      ctx.restore();
      inkCircle(-50, -22, 7, 'rgba(255,255,255,.25)', 2, '#d4a020'); ctx.strokeStyle = '#d4a020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-44, -18); ctx.quadraticCurveTo(-38, -4, -42, 8); ctx.stroke();
      ink(P2('M-44,2 L-32,8 L-20,2 L-20,16 L-32,8 L-44,16 Z'), '#ff5f9a', 1.6); inkCircle(-32, 9, 3.5, '#ffd23f', 1);
    } },
  { outfit: 'Pearl Tiara · Shell Necklace · Bubble Scarf', glit: ['#8ad4ff', '#ffffff'], back(t) {
      // a shimmering sea-green scarf floating around her
      ctx.strokeStyle = 'rgba(120,230,210,.75)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI * 1.6 + 0.6, r = 62 + Math.sin(t * 3 + i * 0.6) * 6; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.6 + 10) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.6 + 10); }
      ctx.stroke();
    }, front(t) {
      // her head is up and to the right in the emoji
      for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) / 5 * Math.PI; inkCircle(21 + Math.cos(a) * 15, -66 + Math.sin(a) * 9, i === 2 ? 5 : 3.6, '#fffaf0', 1.2); }
      for (let i = 0; i < 6; i++) { const a = 0.4 + i / 5 * (Math.PI - 0.8); inkEllipse(18 + Math.cos(a) * 16, -34 + Math.sin(a) * 9, 3.6, 3, a, i % 2 ? '#ffb8d8' : '#ffe0a8', 1); }
      for (let i = 0; i < 4; i++) { const p = (t * 0.6 + i / 4) % 1; ctx.globalAlpha = 1 - p; inkCircle(40 + Math.sin(i + t) * 10, 20 - p * 120, 5 + i, 'rgba(200,240,255,.35)', 1.2, '#bfe8ff'); ctx.globalAlpha = 1; }
    } },
  { outfit: 'Jewelled Crown · Golden Cape · Ruby Necklace', glit: ['#ffd23f', '#ff8a3a'], back(t) {
      // a gold cape trimmed with spotty ermine
      const f = Math.sin(t * 4) * 5;
      ink(P2(`M-34,-24 C-70,0 ${-86 + f},40 ${-80 + f},66 L60,66 C${66 - f},34 52,0 34,-24 Z`), '#f0b020', 2.5);
      inkRect(-84, 58, 148, 12, '#ffffff', 2, 6); ctx.fillStyle = '#2a1a3a'; for (let i = 0; i < 9; i++) circle(-76 + i * 17, 64, 1.8);
    }, front(t) {
      // her head is on the left, about halfway down the emoji
      ctx.save(); ctx.translate(-34, -20); ctx.rotate(-0.2); ctx.scale(0.55, 0.55);
      ink(P2('M-30,0 L-24,-30 L-12,-12 L0,-38 L12,-12 L24,-30 L30,0 Z'), '#ffd23f', 3);
      for (const [x, y, c] of [[0, -22, '#ff3f6a'], [-20, -14, '#40b0ff'], [20, -14, '#3fdc7a']]) inkCircle(x, y, 5, c, 1.4);
      ctx.restore();
      for (const dx of [-5, 6]) { star(-22 + dx, -7, 6, '#ff6fb5', 5); star(-22 + dx, -7, 3.4, '#3a1a4a', 5); }
      ctx.strokeStyle = '#d4a020'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-6, 0, 14, 0.4, Math.PI - 0.4); ctx.stroke(); inkCircle(-6, 14, 5, '#e0204a', 1.2);
      for (let i = 0; i < 3; i++) { const p = (t * 0.9 + i / 3) % 1; ctx.globalAlpha = 1 - p; emoji('🔥', -50 + i * 50, 70 - p * 30, 14 + (1 - p) * 8); ctx.globalAlpha = 1; }
    } },
];
function drawRivalStrut(i, x, rt, k) {
  const r = RIVALS[i], look = RIVAL_LOOKS[i] || RIVAL_LOOKS[0], y = 400 - Math.abs(Math.sin(rt * 6)) * 10;
  // a spotlight follows them down the runway, and the crowd's cameras flash
  const lg = ctx.createLinearGradient(0, 70, 0, 500); lg.addColorStop(0, 'rgba(255,250,215,.1)'); lg.addColorStop(1, 'rgba(255,250,215,.42)');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x - 20, 70); ctx.lineTo(x + 20, 70); ctx.lineTo(x + 130, 500); ctx.lineTo(x - 130, 500); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,245,200,.45)'; ellipse(x, 488, 120, 16);
  for (let j = 0; j < 6; j++) { const p = (rt * 1.3 + j * 0.29) % 1; if (p < 0.1) { const fx = 80 + j * 160; const gr = ctx.createRadialGradient(fx, 500, 0, fx, 500, 50); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(fx - 50, 450, 100, 100); } }
  // glitter trail
  for (let j = 0; j < 10; j++) { const tx = x + 30 + j * 26, a = Math.max(0, 1 - j / 10); ctx.globalAlpha = a * 0.9; star(tx, 470 - (j % 3) * 18 + Math.sin(rt * 8 + j) * 6, 6 - j * 0.3, look.glit[j % 2], 4); }
  ctx.globalAlpha = 1;
  // strike a pose: a quick spin when they reach centre stage
  const spin = rt > 1.4 && rt < 2.0 ? Math.cos((rt - 1.4) / 0.6 * Math.PI * 2) : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(spin || 0.01, 1);
  look.back(rt);
  emoji(r.icon, 0, 0, 120);
  look.front(rt);
  ctx.restore();
  outlined(r.name, x, 196, 22, '#fff');
  text(look.outfit, x, 222, 14, '#ffe3f1', 'center', 600);
  if (rt > 1.6) outlined(`${r.score} points`, x, 252, 24, '#fff6a8');
}

SCENES.show = {
  enter() {
    Object.assign(this, { state: 'intro', rival: -1, rt: 0, shown: [], total: 0, mom: false, talentPts: 0 });
    const tq = DEV && new URLSearchParams(location.search).get('talent');
    if (tq) return skipToTalent(this, +tq || 1);
    say([
      ['fairy', '🧚', 'Welcome, welcome, magical creatures, to the MAGICAL CREATURES FASHION SHOW!', () => SFX.fanfare()],
      ['fairy', '🧚', 'The judges will add up the points for every piece of each outfit. The highest score may stay on Earth forever!'],
      ['aubrey', 'focused', 'Here come the other contestants... They look SO fancy.'],
    ], () => this.nextRival());
  },
  nextRival() {
    this.rival++;
    if (this.rival < RIVALS.length) { this.state = 'rival'; this.rt = 0; return; }
    this.state = 'ours';
    const lines = [['fairy', '🧚', `And our final contestant... AUBREY and ${S.name.toUpperCase()}!`, () => SFX.fanfare()]];
    // the judges score each piece of the outfit, one at a time
    for (const sl of SLOTS) {
      const it = S.equip[sl.id] && ITEM[S.equip[sl.id]];
      if (!it || !it.pts) continue;
      const wow = it.tier === 3 ? 'LEGENDARY! The crowd gasps!' : it.tier === 2 ? 'How fancy!' : 'Very sweet!';
      lines.push(['fairy', '🧚', `${sl.name}: the ${it.name}. ${wow} That's ${it.pts} points!`, () => {
        this.shown.push(it); this.total += it.pts; SFX.hit();
        burst(620, 360, it.tier * 8, { colors: [TIER_COLORS[it.tier], '#fff6a8'] });
      }]);
    }
    if (this.shown.length === 0 && lines.length === 1) lines.push(['fairy', '🧚', `Oh! ${S.name} came just as she is. Natural beauty... but no points, I'm afraid.`]);
    // then the talent rounds (js/showgames.js), which call results() when done
    say(lines, () => startTalent(this));
  },
  results() {
    this.state = 'results';
    const won = this.total > Math.max(...RIVALS.map(r => r.score));
    const place = 1 + RIVALS.filter(r => r.score >= this.total).length;
    if (won) {
      SFX.fanfare();
      for (let i = 0; i < 5; i++) burst(rand(200, 760), rand(100, 300), 25, { colors: ['#ff8fc8', '#ffe36b', '#8ad4ff', '#a6f0b8'] });
      say([
        ['fairy', '🧚', `${this.total} points! The winner of the Magical Creatures Fashion Show is... ${S.name.toUpperCase()}!`],
        ['aubrey', 'laughing', 'WE WON! WE WON!! You get to STAY!'],
        ['unicorn', 'joy', '*the happiest, sparkliest whinny in the whole world*'],
        ['fairy', '🧚', `By the power of Magic Law, ${S.name} may live on Earth forever. And grown-ups may now see her!`],
        ['mom', 'shock', 'AUBREY?!', () => { this.mom = true; }],
        ['aubrey', 'surprised', 'Mom?! What are you doing here?'],
        ['mom', null, "I followed you! I KNEW something was going on in that shed. The glitter. The 'lawnmower'..."],
        ['aubrey', 'determined', `Her name is ${S.name}. She won the show, so she's allowed to stay. Can she, Mom? PLEASE?`],
        ['mom', null, '...Well. Rules are rules. She can stay.'],
        ['mom', null, 'But YOU are cleaning up all that glitter, young {lady|man}.'],
        ['aubrey', 'laughing', 'DEAL!!!'],
      ], () => setScene('end'));
    } else {
      SFX.fail();
      say([
        ['fairy', '🧚', `${this.total} points — ${S.name} came in ${['', '1st', '2nd', '3rd', '4th'][place]} place! So very close...`],
        ['aubrey', 'sad', 'No... she has to go back?'],
        ['fairy', '🧚', "Oh, I can't bear it. I'll bend the rules and turn the clock back to this morning. Try the HARD places — that's where the legendary treasures are!"],
      ], () => { restoreCheckpoint(); setScene('map'); });
    }
  },
  update(dt) {
    if (this.state === 'talent') return talentUpdate(this, dt);
    if (this.state === 'rival') {
      this.rt += dt;
      if (this.rt > 1.6 && this.rt - dt <= 1.6) SFX.hit();
      if (this.rt > 4.6) this.nextRival();
    }
  },
  draw() {
    buttons = [];
    drawShowStage();
    if (this.state === 'talent') { talentDraw(this); drawFx(false); return; }
    if (this.state === 'rival') {
      const r = RIVALS[this.rival];
      const k = this.rt < 1.4 ? easeOut(this.rt / 1.4) : this.rt < 3.6 ? 1 : 1 + (this.rt - 3.6) / 1.0;
      const x = lerp(W + 100, 560, Math.min(1, k)) - Math.max(0, k - 1) * 700;
      drawRivalStrut(this.rival, x, this.rt, k);
    } else {
      drawUnicorn(620, 504, 0.95, uniLook(), { facing: -1, mood: this.state === 'results' ? 'joy' : undefined, glow: 0.8 });
      if (this.mom) drawPerson('mom', 860, 520, -1, 0, true, 0.85);
    }
    // running scorecard
    if (this.state !== 'rival' && this.state !== 'intro') {
      const rh = this.shown.length > 7 ? 25 : 30;
      darkPanel(24, 180, 300, 60 + Math.max(1, this.shown.length) * rh, 18);
      text('Judges\' scorecard', 40, 202, 15, '#ffd1ec', 'left', 700);
      this.shown.forEach((it, i) => {
        text(it.name, 40, 232 + i * rh, 15, '#fff', 'left', 500);
        rrect(256, 220 + i * rh, 52, 24, 12, it.col || TIER_COLORS[it.tier]);
        text(`+${it.pts}`, 282, 232 + i * rh, 14, '#fff', 'center', 700);
      });
      outlined(`Total: ${this.total}`, 174, 160, 28, '#fff6a8');
    }
    if (this.state === 'results') {
      const rows = [...RIVALS.map(r => ({ name: r.name, icon: r.icon, score: r.score })), { name: `${S.name} & Aubrey`, icon: '🦄', score: this.total, me: true }].sort((a, b) => b.score - a.score);
      // sits below the dialog box, which covers the top ~140px while the fairy announces the winner
      panel(W / 2 - 60, 146, 400, 196, 18);
      rows.forEach((row, i) => {
        const y = 176 + i * 44, x = W / 2 - 50;
        if (row.me) rrect(x, y - 18, 380, 36, 12, '#ffe3f1');
        text(`${i + 1}.`, x + 14, y, 18, '#5a2a6e', 'left', 700);
        emoji(row.icon, x + 50, y, 24);
        text(row.name, x + 72, y, 15, '#5a2a6e', 'left', row.me ? 700 : 500);
        text(String(row.score), x + 366, y, 18, '#c2407e', 'right', 700);
      });
    }
    drawFx(false);
  },
};

// --- title & ending ---------------------------------------------------------------------
const TITLE_LOOK = { mane: 'rainbow', style: 'flowing', head: 'crown', neck: 'lei', back: 'wings', tail: 'tailflowers', hooves: 'pink', shine: 100 };
function dreamy(top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) star((i * 197) % W, (i * 89) % (H - 140), 2 + (i % 3), `rgba(255,255,255,${0.3 + 0.7 * Math.abs(Math.sin(S.t * 1.5 + i))})`);
}
SCENES.loading = { update() {}, draw() { dreamy('#3b1d6e', '#ff9ec7'); outlined('Loading...', W / 2, H / 2, 28, '#fff'); } };
// the title screen is also where you pick who you are (js/hero.js) and your secret pet
const PET_CHOICES = [
  { id: 'unicorn', label: 'A Unicorn', say: 'A sparkly unicorn!', x: 150 },
  { id: 'dino', label: 'A Baby Dinosaur', say: 'A baby dinosaur!', x: 510 },
];
const TITLE_DINO = { head: 'd_flowers', neck: 'd_bandana', back: null, tail: 'd_tailbow', feet: null };
const HERO_CARD = { w: 150, h: 172, y: 134, gap: 18 };
const heroCardX = i => (W - (HEROES.length * HERO_CARD.w + (HEROES.length - 1) * HERO_CARD.gap)) / 2 + i * (HERO_CARD.w + HERO_CARD.gap);
const PET_CARD = { w: 300, h: 176, y: 344 };
SCENES.title = {
  enter() {
    this.sel = this.sel ?? null; this.t = 0;
    speak("Aubrey's Secret Pet! Who are you? Tap a friend. Then pick your secret pet: press 1 for a unicorn, or 2 for a baby dinosaur.");
  },
  pickHero(i) {
    const h = HEROES[(i + HEROES.length) % HEROES.length];
    if (h === HERO) return;
    audioInit(); SFX.pick(); useHero(h.id); this.heroPop = 0;
    speak(`${h.name}!`);
  },
  choose(i) {
    const c = PET_CHOICES[i];
    audioInit(); SFX.sparkle();
    startGame(c.id);
  },
  update(dt) {
    this.t += dt; this.heroPop = (this.heroPop ?? 1) + dt;
    const id = clickedButton();
    if (id === 'stages') return setScene('stages');
    if (id?.startsWith('pet:')) return this.choose(+id.slice(4));
    if (id?.startsWith('hero:')) return this.pickHero(+id.slice(5));
    const hover = PET_CHOICES.findIndex(c => inRect({ x: c.x, y: PET_CARD.y, w: PET_CARD.w, h: PET_CARD.h }));
    if (hover >= 0 && hover !== this.hover) { this.sel = hover; }
    this.hover = hover;
    const hi = HEROES.indexOf(HERO);
    if (pressed.arrowleft || pressed.a) this.pickHero(hi - 1);
    if (pressed.arrowright || pressed.d) this.pickHero(hi + 1);
    const was = this.sel;
    if (pressed.arrowup || pressed.w) this.sel = 0;
    if (pressed.arrowdown || pressed.s) this.sel = 1;
    if (this.sel !== was && this.sel !== null) { SFX.click(); speak(PET_CHOICES[this.sel].say); }
    if ((advancePressed()) && this.sel !== null) return this.choose(this.sel);
    if (advancePressed()) { this.sel = 0; speak(PET_CHOICES[0].say); }
  },
  draw() {
    buttons = [];
    dreamy('#3b1d6e', '#ff9ec7');
    ctx.fillStyle = '#7fbf75'; ellipse(W / 2, H + 60, 720, 150);
    ctx.fillStyle = '#8fcf85'; ellipse(W / 2, H + 80, 640, 130);
    outlined(`${HERO.name}'s Secret Pet`, W / 2, 40, 44, '#fff');
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(S.t * 4);
    outlined('Who are you?', W / 2, 98, 22, '#fff6a8');
    ctx.globalAlpha = 1;
    // the four heroes: the one you are waves and bounces
    HEROES.forEach((h, i) => {
      const on = h === HERO, x = heroCardX(i), { w, h: ch, y } = HERO_CARD;
      const lift = on ? -6 - Math.abs(Math.sin(S.t * 3)) * 4 : 0;
      ctx.save();
      ctx.shadowColor = on ? 'rgba(255,240,150,.9)' : 'rgba(40,10,60,.4)'; ctx.shadowBlur = on ? 24 : 8; ctx.shadowOffsetY = 4;
      rrect(x, y + lift, w, ch, 20, h.card);
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.roundRect(x + 6, y + lift + 6, w - 12, ch - 44, 15); ctx.clip();
      const bg = ctx.createLinearGradient(0, y, 0, y + ch); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, h.card);
      ctx.fillStyle = bg; ctx.fillRect(x, y + lift, w, ch);
      const im = HERO_IMG[h.id][on ? 'twirl' : 'idle_front'], s = 118 / HERO_IMG[h.id].idle_front.height * (on ? 1 + 0.06 * Math.max(0, 1 - this.heroPop * 4) : 1);
      ctx.drawImage(im, x + w / 2 - im.width * s / 2, y + lift + ch - 42 - im.height * s, im.width * s, im.height * s);
      ctx.restore();
      rrect(x, y + lift, w, ch, 20, null, on ? '#ffd23f' : 'rgba(255,255,255,.9)', on ? 6 : 3);
      button(`hero:${i}`, x + 12, y + lift + ch - 38, w - 24, 32, heroOwnName(h), { color: on ? '#ff6fb5' : h.boy ? '#4fa8e0' : '#c86ae8', size: 17 });
    });
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(S.t * 4 + 1);
    outlined('Who will your secret pet be?', W / 2, 328, 22, '#fff6a8');
    ctx.globalAlpha = 1;
    PET_CHOICES.forEach((c, i) => {
      const on = this.sel === i, x = c.x, { y, w, h } = PET_CARD;
      const lift = on ? -6 - Math.abs(Math.sin(S.t * 3)) * 4 : 0;
      ctx.save();
      ctx.shadowColor = on ? 'rgba(255,240,150,.9)' : 'rgba(40,10,60,.4)'; ctx.shadowBlur = on ? 26 : 10; ctx.shadowOffsetY = 4;
      rrect(x, y + lift, w, h, 24, i ? '#e6fbe0' : '#fbe9ff');
      ctx.restore();
      rrect(x, y + lift, w, h, 24, null, on ? '#ffd23f' : 'rgba(255,255,255,.9)', on ? 6 : 4);
      ctx.save(); ctx.beginPath(); ctx.roundRect(x + 8, y + lift + 8, w - 16, h - 64, 18); ctx.clip();
      const bg = ctx.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, i ? '#c8f0ff' : '#ffe3f3'); bg.addColorStop(1, i ? '#a6e09a' : '#e8d6ff');
      ctx.fillStyle = bg; ctx.fillRect(x, y + lift, w, h);
      if (i) drawBabyDino(x + 150, y + lift + 104, 0.42, TITLE_DINO, { facing: 1, mood: on ? 'joy' : undefined, moving: on, glow: on ? 0.6 : 0, t: S.t });
      else drawUnicorn(x + 150, y + lift + 108, 0.37, TITLE_LOOK, { facing: 1, glow: on ? 0.9 : 0.4, mood: on ? 'joy' : undefined, moving: on, t: S.t });
      ctx.restore();
      button(`pet:${i}`, x + 24, y + lift + h - 50, w - 48, 42, c.label, { color: i ? '#3fae6a' : '#c86ae8', size: 19, key: String(i + 1) });
    });
    text('Tap a friend (or ← →), then tap a pet (or press 1 or 2)', 14, H - 8, 12, 'rgba(255,255,255,.85)', 'left', 600);
    if (DEV) button('stages', 14, 14, 140, 34, 'Pick a stage', { icon: '🧪', color: '#9a6ae0', size: 14 });
  },
};
// testing only (?dev): jump straight to any story stage or adventure place
const STAGE_JUMPS = [['explore', '🔍', 'Find unicorn'], ['follow', '🦄', 'Follow home'], ['map', '🗺️', 'Map'], ['craft', '✂️', 'Crafting'],
  ['hide', '🙈', 'Hide'], ['night', '🌙', 'Night'], ['kingdom', '🏰', 'Kingdom bounce'], ['show', '👑', 'Fashion show'], ['end', '🏆', 'The end'],
  ['pick', '🐾', 'Pet picker'], ['dinofind', '🦕', 'Dino: find'], ['dinonight', '🛖', 'Dino: shed night'], ['dinohide', '🙈', 'Dino: hide'], ['dinohop', '🦖', 'Dino Hop'],
  ['dinodefense', '🛡️', 'Dino defence'], ['dinoend', '💚', 'Dino: the end']];
SCENES.stages = {
  enter() { this.tier ??= 1; },
  update() {
    const id = clickedButton();
    if (!id) return;
    if (id === 'back') return setScene('title');
    if (id.startsWith('tier:')) { this.tier = +id.slice(5); return; }
    audioInit();
    if (id.startsWith('loc:')) debugJump('place', new URLSearchParams({ id: id.slice(4) }));
    else debugJump(id, new URLSearchParams());
  },
  draw() {
    buttons = [];
    dreamy('#3b1d6e', '#ff9ec7');
    outlined('Pick a stage', W / 2, 34, 30, '#fff');
    button('back', 14, 14, 90, 36, 'Back', { color: '#9a6ae0', size: 15 });
    STAGE_JUMPS.forEach(([id, icon, label], i) => button(id, 20 + (i % 6) * 155, 60 + Math.floor(i / 6) * 42, 148, 36, label, { icon, color: id.startsWith('dino') ? '#3fae6a' : '#4fa8e0', size: 13 }));
    [1, 2, 3].forEach(t => button(`tier:${t}`, W / 2 - 225 + (t - 1) * 154, 194, 142, 32, `Places ${'★'.repeat(t)}`, { color: t === this.tier ? '#ff6fb5' : '#c9a6d8', size: 14 }));
    LOCATIONS.filter(l => l.tier === this.tier).forEach((l, i) =>
      button(`loc:${l.id}`, 20 + (i % 4) * 232, 236 + Math.floor(i / 4) * 50, 224, 42, l.name, { icon: l.icon, size: 13 }));
  },
};
SCENES.end = {
  enter() { this.t = 0; },
  update(dt) {
    this.t += dt;
    if (Math.random() < dt * 3) burst(rand(100, W - 100), rand(60, 260), 20, { colors: ['#ff8fc8', '#ffe36b', '#8ad4ff', '#a6f0b8', '#fff'], spread: 120, up: 0 });
    if (this.t > 2 && (pointer.clicked || advancePressed())) setScene('title');
  },
  draw() {
    dreamy('#2a1d5e', '#ff9ec7');
    ctx.fillStyle = '#7fbf75'; ellipse(W / 2, H + 60, 760, 150);
    drawPerson('mom', 820, 516, -1, 0, false, 0.95);
    drawUnicorn(560, 506, 1.0, uniLook({ shine: 100 }), { facing: -1, mood: 'joy', glow: 1 });
    emoji('🏆', 540, 300 + Math.sin(S.t * 3) * 6, 54);
    const bounce = Math.abs(Math.sin(S.t * 3)) * 30;
    drawAubrey(270, 506, 'jump', 1, bounce, 0.8);
    outlined('The End', W / 2, 66, 58, '#ff6fb5');
    outlined(`${S.name} is home to stay — forever.`, W / 2, 122, 24, '#fff');
    if (this.t > 2) outlined('Thanks for playing! Click to play again.', W / 2, 162, 18, '#fff6a8');
    drawFx(false);
  },
};
