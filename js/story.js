'use strict';
// Story flow: title, the days ticking by, the fashion show, and the ending.

function startGame() {
  S = newGame();
  parts.length = 0; floats.length = 0;
  startWorld('explore');
  saveCheckpoint();
  say([
    ['aubrey', 'excited', 'What a perfect day for exploring the woods behind our house!'],
    ['aubrey', 'silly', 'Mom says not to go too far... but "too far" is kind of a matter of opinion.'],
    ['narrator', null, 'Walk with ← → (or A / D). Jump with ↑ (or W / Space). Press E to do things. Head right, into the woods!'],
  ]);
}

// called when any time-using activity finishes
function afterActivity() {
  const forced = S.slot === 2 && !S.checkedToday && S.day < SHOW_DAY;
  const chance = 0.2 + (S.happy < 30 ? 0.4 : 0) + S.day * 0.03;
  if (S.day < SHOW_DAY && !S.checkedToday && (forced || Math.random() < chance)) {
    S.checkedToday = true;
    return setScene('hide', advanceTime);
  }
  advanceTime();
}
function advanceTime() {
  S.happy = Math.max(0, S.happy - 6);
  S.slot++;
  if (S.day === SHOW_DAY && S.slot === 2) return showTime();
  if (S.slot > 2) return setScene('night');
  setScene('salon');
}
function showTime() {
  setScene('salon');
  say([
    ['fairy', '🧚', `The moon is rising, Aubrey! It's time for the Magical Creatures Fashion Show!`, () => SFX.sparkle()],
    ['aubrey', 'determined', `You ready, ${S.name}? Let's go win you a forever home.`],
    ['fairy', '🧚', 'Lead her to the glade past the creek. And remember — not ONE grown-up can see her on the way!'],
  ], () => startWorld('shownight'));
}

// --- night ---------------------------------------------------------------------------
SCENES.night = {
  enter() {
    this.before = { shine: S.shine, happy: S.happy };
    S.shine = Math.max(0, S.shine - 20);
    S.happy = Math.max(0, S.happy - 8);
    S.day++; S.slot = 0;
    S.checkedToday = false; S.applesLeft = 3;
    saveCheckpoint();
  },
  update() { if (clickedButton() === 'next' || advancePressed()) setScene('salon'); },
  draw() {
    buttons = [];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1840'); g.addColorStop(1, '#4a3a7a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) star((i * 137) % W, (i * 71) % 300, 1.5 + (i % 3), `rgba(255,255,240,${0.3 + 0.7 * Math.abs(Math.sin(S.t + i))})`);
    ctx.fillStyle = '#fff8d8'; circle(800, 90, 40); ctx.fillStyle = '#1e1c48'; circle(782, 80, 36);
    ctx.fillStyle = '#2a2a50'; ellipse(W / 2, H + 40, 700, 140);
    drawUnicorn(330, 470, 1.0, uniLook(), { facing: 1, pose: 'sit', mood: 'sleep', glow: 0.5 });
    outlined('z', 470 + Math.sin(S.t * 2) * 6, 250 - (S.t * 20) % 40, 26, '#fff');
    outlined('Z', 490 + Math.sin(S.t * 2 + 1) * 6, 215 - (S.t * 20) % 40, 34, '#fff');
    panel(560, 130, 370, 280, 22);
    outlined(`Day ${S.day - 1} is over`, 745, 168, 30, '#ff6fb5', 'center', '#fff');
    const lines = [
      `${S.name} curls up in the hay and dreams sparkly dreams.`,
      `But she rolled around in the mud in her sleep...`,
      `✨ Shine ${this.before.shine} → ${S.shine}     💗 Happy ${Math.round(this.before.happy)} → ${Math.round(S.happy)}`,
      daysLeft() === 0 ? 'THE SHOW IS TONIGHT!' : `The show is in ${daysLeft()} day${daysLeft() > 1 ? 's' : ''}.`,
    ];
    let y = 210;
    for (const l of lines) for (const w of wrap(l, 330, 16)) { text(w, 745, y, 16, '#5a2a6e', 'center', 500); y += 24; }
    button('next', 655, 350, 180, 48, `Good morning! ☀️`, { color: '#9a6ae0', size: 17 });
  },
};

// --- the show ----------------------------------------------------------------------------
function startShow() {
  setScene('show');
}
function drawShowStage(runway) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a1840'); g.addColorStop(1, '#5a3a8a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) star((i * 191) % W, (i * 53) % 220, 1.5 + (i % 3), `rgba(255,255,240,${0.3 + 0.7 * Math.abs(Math.sin(S.t * 1.3 + i))})`);
  for (const x of [-30, 60, 900, 990]) { ctx.fillStyle = '#1c2a3a'; circle(x, 200, 110); ctx.fillRect(x - 20, 200, 40, 340); }
  // spotlights
  for (const [x, c] of [[200, '255,200,240'], [480, '255,250,200'], [760, '200,230,255']]) {
    const sx = x + Math.sin(S.t * 0.8 + x) * 60;
    const lg = ctx.createLinearGradient(0, 0, 0, 500);
    lg.addColorStop(0, `rgba(${c},.35)`); lg.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x - 10, 0); ctx.lineTo(x + 10, 0); ctx.lineTo(sx + 110, 500); ctx.lineTo(sx - 110, 500); ctx.closePath(); ctx.fill();
  }
  // curtains & garland
  for (const side of [-1, 1]) {
    const cx = side < 0 ? 0 : W;
    ctx.fillStyle = '#9a3a6a'; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx - side * 120, 0); ctx.quadraticCurveTo(cx - side * 60, 250, cx - side * 90, 520); ctx.lineTo(cx, 520); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 3;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - side * i * 28, 0); ctx.quadraticCurveTo(cx - side * i * 18, 260, cx - side * i * 22, 520); ctx.stroke(); }
  }
  for (let i = 0; i <= 16; i++) {
    const x = i * 60, y = 22 + Math.sin(i / 16 * Math.PI) * 26;
    ctx.fillStyle = ['#ff8fc8', '#ffe36b', '#8ad4ff', '#a6f0b8'][i % 4];
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 4 + i); circle(x, y, 6); ctx.globalAlpha = 1;
  }
  // runway platform
  inkRect(60, 500, 840, 26, '#f3dcf7', 3, 8);
  ctx.fillStyle = '#ffb3d6'; ctx.fillRect(66, 506, 828, 6);
  // audience
  const crowd = ['🦉', '🐸', '🦔', '🐿️', '🦋', '🐉', '🧚', '🦄', '🐢', '🦊', '🐰', '🦌', '🧜‍♀️', '🐝'];
  crowd.forEach((c, i) => emoji(c, 40 + i * 68, 534 + Math.abs(Math.sin(S.t * (runway ? 3 : 1.5) + i)) * -6, 36));
}
function drawJudges(reveal, scores) {
  JUDGES.forEach((j, i) => {
    const x = 120 + i * 90, y = 300;
    emoji(j.icon, x, y, 50);
    if (scores && i < reveal) {
      rrect(x - 30, y - 92, 60, 48, 10, '#fff', OL, 3);
      text(scores[i].toFixed(1), x, y - 68, 22, '#c2407e', 'center', 700);
    }
  });
  inkRect(60, 324, 280, 26, '#7a4a8a', 3, 6);
  text('JUDGES', 200, 337, 14, '#fff', 'center', 700);
}
function scoreShow(acc) {
  const matches = themeMatchCount(), filled = filledCount();
  const r1 = x => Math.round(Math.min(10, x) * 10) / 10;
  return [r1(matches * 1.15 + filled * 0.35), r1(acc * 9 + S.happy / 100), r1(S.shine / 100 * 8 + S.poise / 100 * 2)];
}
SCENES.show = {
  enter(acc) {
    if (typeof acc === 'number') return this.judging(acc);
    Object.assign(this, { state: 'intro', rival: -1, rt: 0, scores: null, reveal: 0, mom: false });
    say([
      ['fairy', '🧚', 'Welcome, welcome, magical creatures, to the MAGICAL CREATURES FASHION SHOW!', () => SFX.fanfare()],
      ['fairy', '🧚', `Tonight's theme is ${theme().name.toUpperCase()}! ${theme().icon} Our winner earns the right to stay on Earth forever!`],
      ['aubrey', 'focused', `Here come the other contestants... They look SO fancy.`],
    ], () => this.nextRival());
  },
  nextRival() {
    this.rival++;
    if (this.rival < RIVALS.length) { this.state = 'rival'; this.rt = 0; return; }
    this.state = 'ready';
    say([
      ['fairy', '🧚', `And our final contestant... AUBREY and ${S.name.toUpperCase()}!`, () => SFX.fanfare()],
      ['aubrey', 'determined', `This is it, ${S.name}. Just like we practised. Show them how amazing you are!`],
    ], () => startRunway('show', acc => setScene('show', acc)));
  },
  judging(acc) {
    this.state = 'judging'; this.acc = acc; this.reveal = 0;
    this.scores = scoreShow(acc);
    const [a, b, c] = this.scores;
    const total = a + b + c;
    this.total = Math.round(total * 10) / 10;
    const m = themeMatchCount();
    const c1 = m >= 6 ? `Magnificent! Every piece says ${theme().name}!` : m >= 3 ? `Rather lovely, though I'd hoped for more ${theme().name}.` : `Hmm. I don't see much ${theme().name} here, dear.`;
    const c2 = acc > 0.85 ? 'What a STRUT! Divine, simply divine!' : acc > 0.6 ? 'A charming walk, with only a few wobbles.' : 'Oh my. She tripped over her own hooves, poor thing.';
    const c3 = S.shine > 80 ? "She sparkles brighter than a dragon's treasure hoard!" : S.shine > 50 ? 'A nice shine. Could use a bit more polish.' : 'Is that... MUD? On the runway?';
    say([
      ['Professor Hoot', '🦉', `${c1}  I give her a ${a.toFixed(1)}!`, () => { this.reveal = 1; SFX.hit(); }],
      ['Madame Glimmerwing', '🧚', `${c2}  ${b.toFixed(1)}!`, () => { this.reveal = 2; SFX.hit(); }],
      ['Lord Sparkscale', '🐲', `${c3}  ${c.toFixed(1)}!`, () => { this.reveal = 3; SFX.hit(); }],
      ['fairy', '🧚', `That's a total of ${this.total.toFixed(1)}!`],
    ], () => this.results());
  },
  results() {
    this.state = 'results';
    const won = this.total > Math.max(...RIVALS.map(r => r.score));
    const place = 1 + RIVALS.filter(r => r.score >= this.total).length;
    if (won) {
      SFX.fanfare();
      for (let i = 0; i < 5; i++) burst(rand(200, 760), rand(100, 300), 25, { colors: ['#ff8fc8', '#ffe36b', '#8ad4ff', '#a6f0b8'] });
      say([
        ['fairy', '🧚', `The winner of the Magical Creatures Fashion Show is... ${S.name.toUpperCase()}!`],
        ['aubrey', 'laughing', 'WE WON! WE WON!! You get to STAY!'],
        ['unicorn', 'joy', '*the happiest, sparkliest whinny in the whole world*'],
        ['fairy', '🧚', `By the power of Magic Law, ${S.name} may live on Earth forever. And grown-ups may now see her!`],
        ['mom', 'shock', 'AUBREY?!', () => { this.mom = true; }],
        ['aubrey', 'surprised', "Mom?! What are you doing here?"],
        ['mom', null, "I followed you! I KNEW something was going on in that shed. The glitter. The 'lawnmower'..."],
        ['mom', null, `Is she... yours?`],
        ['aubrey', 'determined', `Her name is ${S.name}. She won the show, so she's allowed to stay. Can she, Mom? PLEASE?`],
        ['mom', null, `...Well. Rules are rules. She can stay.`],
        ['mom', null, `But YOU are cleaning up all that glitter, young lady.`],
        ['aubrey', 'laughing', 'DEAL!!!'],
      ], () => setScene('end'));
    } else {
      SFX.fail();
      say([
        ['fairy', '🧚', `${S.name} came in ${['', '1st', '2nd', '3rd', '4th'][place]} place! So very close...`],
        ['aubrey', 'sad', "No... she has to go back?"],
        ['fairy', '🧚', `Oh, I can't bear it. I'll bend the rules just this once and turn the clock back to this morning. More shine, more style, more strut — you can do it!`],
      ], () => { restoreCheckpoint(); setScene('salon'); });
    }
  },
  update(dt) {
    if (this.state === 'rival') {
      this.rt += dt;
      if (this.rt > 5) this.nextRival();
      if (this.rt > 1.6 && this.rt - dt <= 1.6) SFX.hit();
    }
  },
  draw() {
    buttons = [];
    drawShowStage(false);
    const ranked = this.state === 'results';
    drawJudges(this.state === 'rival' && this.rt > 1.6 ? 3 : this.reveal, this.state === 'rival' && this.rt > 1.6 ? this.rivalCards() : this.scores);
    if (this.state === 'rival') {
      const r = RIVALS[this.rival];
      const k = this.rt < 1.4 ? easeOut(this.rt / 1.4) : this.rt < 3.8 ? 1 : 1 + (this.rt - 3.8) / 1.2;
      const x = lerp(W + 100, 620, Math.min(1, k)) - Math.max(0, k - 1) * 700;
      emoji(r.icon, x, 410 + Math.abs(Math.sin(this.rt * 6)) * -10, 120);
      outlined(r.name, x, 300, 22, '#fff');
      if (this.rt > 1.6) outlined(`Total: ${r.score.toFixed(1)}`, x, 330, 20, '#fff6a8');
    } else {
      drawUnicorn(620, 504, 0.95, uniLook(), { facing: -1, mood: this.state === 'results' ? 'joy' : undefined, glow: 0.8 });
      if (this.mom) drawPerson('mom', 860, 520, -1, 0, true, 0.85);
    }
    if (ranked) {
      const rows = [...RIVALS.map(r => ({ name: r.name, icon: r.icon, score: r.score })), { name: `${S.name} & Aubrey`, icon: '🦄', score: this.total, me: true }].sort((a, b) => b.score - a.score);
      panel(W / 2 - 200, 180, 400, 200, 18);
      rows.forEach((row, i) => {
        const y = 210 + i * 44;
        if (row.me) rrect(W / 2 - 190, y - 18, 380, 36, 12, '#ffe3f1');
        text(`${i + 1}.`, W / 2 - 176, y, 18, '#5a2a6e', 'left', 700);
        emoji(row.icon, W / 2 - 140, y, 24);
        text(row.name, W / 2 - 118, y, 16, '#5a2a6e', 'left', row.me ? 700 : 500);
        text(row.score.toFixed(1), W / 2 + 180, y, 18, '#c2407e', 'right', 700);
      });
    }
    drawFx(false);
  },
  rivalCards() {
    const s = RIVALS[this.rival].score;
    return [s / 3 + 0.3, s / 3 - 0.2, s / 3 - 0.1].map(v => Math.round(v * 10) / 10);
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
SCENES.title = {
  update() { if (advancePressed() || pointer.clicked) { audioInit(); startGame(); } },
  draw() {
    dreamy('#3b1d6e', '#ff9ec7');
    ctx.fillStyle = '#7fbf75'; ellipse(W / 2, H + 60, 720, 150);
    ctx.fillStyle = '#8fcf85'; ellipse(W / 2, H + 80, 640, 130);
    drawAubrey(250, 500, 'twirl', 1, 0, 0.82);
    drawUnicorn(670, 500, 1.05, TITLE_LOOK, { facing: -1, glow: 0.9, t: S.t });
    outlined('Aubrey', W / 2, 66, 60, '#fff');
    outlined('& the Secret Unicorn', W / 2, 122, 36, '#ffd1ec');
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 4);
    outlined('Click or press Space to begin', W / 2, 176, 22, '#fff6a8');
    ctx.globalAlpha = 1;
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
