'use strict';
// Story flow: title, nights, the fashion show, and the ending.

function startGame() {
  S = newGame();
  parts.length = 0; floats.length = 0;
  startWorld('explore');
  saveCheckpoint();
  say([
    ['aubrey', 'excited', 'What a perfect day for exploring the woods behind our house!'],
    ['aubrey', 'silly', 'Mom says not to go too far... but "too far" is kind of a matter of opinion.'],
    ['narrator', null, 'Walk with the arrow keys. Jump with the up arrow or Space. Head right, into the woods!'],
  ]);
}
// after the last day: bounce up through the Fairy Kingdom to the show (js/kingdom.js)
function showTime() { setScene('kingdom'); }

// --- night ---------------------------------------------------------------------------
SCENES.night = {
  enter() {
    S.day++; S.visitsToday = 0;
    saveCheckpoint();
    speak(`Goodnight, ${S.name}. ${this.countdown()}`);
  },
  countdown() {
    const left = daysLeft() + 1;
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
    drawUnicorn(330, 470, 1.0, uniLook(), { facing: 1, pose: 'sit', mood: 'sleep', glow: 0.5 });
    outlined('z', 470 + Math.sin(S.t * 2) * 6, 250 - (S.t * 20) % 40, 26, '#fff');
    outlined('Z', 490 + Math.sin(S.t * 2 + 1) * 6, 215 - (S.t * 20) % 40, 34, '#fff');
    panel(560, 130, 370, 280, 22);
    outlined(`Day ${S.day - 1} is over`, 745, 168, 30, '#ff6fb5', 'center', '#fff');
    const lines = [
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
        ['mom', null, 'But YOU are cleaning up all that glitter, young lady.'],
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
      emoji(r.icon, x, 410 - Math.abs(Math.sin(this.rt * 6)) * 10, 120);
      outlined(r.name, x, 300, 22, '#fff');
      if (this.rt > 1.6) outlined(`${r.score} points`, x, 330, 22, '#fff6a8');
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
SCENES.title = {
  update() {
    if (clickedButton() === 'stages') return setScene('stages');
    if (advancePressed() || pointer.clicked) { audioInit(); startGame(); }
  },
  draw() {
    buttons = [];
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
    if (DEV) button('stages', 14, H - 52, 160, 38, 'Pick a stage', { icon: '🧪', color: '#9a6ae0', size: 15 });
  },
};
// testing only (?dev): jump straight to any story stage or adventure place
const STAGE_JUMPS = [['explore', '🔍', 'Find unicorn'], ['follow', '🦄', 'Follow home'], ['map', '🗺️', 'Map'], ['craft', '✂️', 'Crafting'],
  ['hide', '🙈', 'Hide'], ['night', '🌙', 'Night'], ['kingdom', '🏰', 'Kingdom bounce'], ['show', '👑', 'Fashion show'], ['end', '🏆', 'The end']];
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
    STAGE_JUMPS.forEach(([id, icon, label], i) => button(id, 20 + (i % 5) * 186, 64 + Math.floor(i / 5) * 46, 178, 38, label, { icon, color: '#4fa8e0', size: 14 }));
    [1, 2, 3].forEach(t => button(`tier:${t}`, W / 2 - 225 + (t - 1) * 154, 166, 142, 34, `Places ${'★'.repeat(t)}`, { color: t === this.tier ? '#ff6fb5' : '#c9a6d8', size: 14 }));
    LOCATIONS.filter(l => l.tier === this.tier).forEach((l, i) =>
      button(`loc:${l.id}`, 20 + (i % 4) * 232, 212 + Math.floor(i / 4) * 52, 224, 44, l.name, { icon: l.icon, size: 13 }));
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
