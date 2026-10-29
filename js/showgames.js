'use strict';
// The show's TALENT ROUNDS: three quick games played on stage after the outfit is scored.
// Each is an MG type (same init/start/update/draw shape as js/minigames.js), but the show
// runs them itself so there are no material rewards: each round's g.score turns into bonus
// show points (1..TALENT_MAX), announced by a judge and added to the scorecard.

const TALENT_GAMES = ['showriddles', 'runwaypose', 'spotlightstrut'];
// up to 6 points a round (18 in all), at least 1 for trying. The outfit still matters most:
// the top rival has 80, so an outfit needs 63+ AND perfect talent to win, while a strong
// outfit (75+) wins with a so-so performance.
const TALENT_MAX = 6;
const talentPoints = score => clamp(Math.round(score * TALENT_MAX), 1, TALENT_MAX);
const SHOW_JUDGES = ['Grandpa Smolder', 'Granny Owl', 'Wizard Wendell'];
const SHOW_JUDGE_ICONS = ['🐉', '🦉', '🧙'];

{
  const CARD_COLS = ['#ff6fb5', '#4fa8e0', '#9a6ae0', '#3fbf6a'];
  const numKey = n => { for (let i = 0; i < n; i++) if (pressed[String(i + 1)]) return i; return -1; };
  const shakeX = (g, i) => (g.shake?.[i] ? Math.sin(g.shake[i] * 50) * 6 : 0);
  const tickShake = (g, dt) => { for (const k in g.shake) if ((g.shake[k] -= dt) <= 0) delete g.shake[k]; };
  const glow = (x, y, r, col) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const flash = k => { if (k > 0) { ctx.fillStyle = `rgba(255,255,255,${0.55 * k})`; ctx.fillRect(0, 0, W, H); } };
  // the unicorn's own colours, for sparkles
  const uniCols = () => (MANES[uniLook().mane] || MANES.natural).slice(0, 4);

  // the unicorn striking a pose. pose: twirl|jump|bow|sparkle, k: 0..1 through it
  function poseUnicorn(x, y, s, pose, k, o = {}) {
    const look = uniLook(), facing = o.facing || -1;
    ctx.save(); ctx.translate(x, y);
    const arc = Math.sin(Math.PI * clamp(k, 0, 1));
    if (pose === 'twirl') ctx.scale(Math.cos(k * Math.PI * 4) || 0.01, 1);
    if (pose === 'jump') ctx.translate(0, -arc * 110);
    if (pose === 'bow') { ctx.translate(-facing * 70 * s, 0); ctx.rotate(-facing * 0.22 * arc); ctx.translate(facing * 70 * s, 0); }
    if (pose === 'sparkle') { ctx.scale(1 + arc * 0.08, 1 + arc * 0.08); }
    drawUnicorn(0, 0, s, look, { facing, moving: o.moving, glow: o.glow ?? 0.8, mood: o.mood });
    ctx.restore();
  }

  // ===========================================================================================
  // 1. JUDGES' RIDDLES: the panel of judges each ask a picture riddle (fashion and magic themed)
  // ===========================================================================================
  const SHOW_RIDDLES = [
    ["I sit on top of a princess's head and sparkle with jewels. What am I?", ['👑', 'a crown'], [['🎩', 'a top hat'], ['🧦', 'a sock'], ['👟', 'a shoe']]],
    ['You look into me to see your fancy outfit. What am I?', ['🪞', 'a mirror'], [['🖼️', 'a picture'], ['🪟', 'a window'], ['📺', 'a TV']]],
    ['Wave me, say a magic word, and POOF! What am I?', ['🪄', 'a magic wand'], [['🥄', 'a spoon'], ['✏️', 'a pencil'], ['🥕', 'a carrot']]],
    ["I have one horn and a sparkly mane, and I'm the star of this show! What am I?", ['🦄', 'a unicorn'], [['🐴', 'a horse'], ['🦏', 'a rhino'], ['🐐', 'a goat']]],
    ['I am a big arch of colours you can see after the rain. What am I?', ['🌈', 'a rainbow'], [['☂️', 'an umbrella'], ['☀️', 'the sun'], ['🌙', 'the moon']]],
    ['I flap pretty wings, and I used to be a caterpillar. What am I?', ['🦋', 'a butterfly'], [['🐦', 'a bird'], ['🐝', 'a bee'], ['🐞', 'a ladybug']]],
    ['I twinkle high in the night sky. Make a wish on me! What am I?', ['⭐', 'a star'], [['☁️', 'a cloud'], ['💡', 'a light bulb'], ['🌻', 'a sunflower']]],
    ['I go around your finger, and I often have a gem on top. What am I?', ['💍', 'a ring'], [['🍩', 'a donut'], ['⌚', 'a watch'], ['🔔', 'a bell']]],
    ['You blow me up and tie me with a string, and I float at parties. What am I?', ['🎈', 'a balloon'], [['⚽', 'a ball'], ['🪁', 'a kite'], ['🎁', 'a present']]],
    ['I come in a pair, and dancers wear me on their feet. What am I?', ['🩰', 'ballet shoes'], [['🧤', 'gloves'], ['🎧', 'headphones'], ['👓', 'glasses']]],
    ['I have two round windows, and I sit on your nose. What am I?', ['👓', 'glasses'], [['🔭', 'a telescope'], ['🪞', 'a mirror'], ['👃', 'a nose']]],
    ['I have strings, and when you strum me I make music. What am I?', ['🎸', 'a guitar'], [['🥁', 'a drum'], ['🪁', 'a kite'], ['🎺', 'a trumpet']]],
    ['You tie me in your hair, or on top of a present. What am I?', ['🎀', 'a bow'], [['🧶', 'yarn'], ['🍬', 'a candy'], ['🦋', 'a butterfly']]],
  ];
  const RD_W = 190, RD_GAP = 26;
  MG.showriddles = {
    kind: 'learn', title: () => "Judges' Riddles", icon: () => '🐉',
    how: () => 'Each judge will ask you a riddle. Listen to the clues and tap the picture that answers it!',
    init(g) {
      Object.assign(g, { round: 0, rounds: 5, cards: 3, total: 0, shake: {}, order: shuffle(SHOW_RIDDLES.map((_, i) => i)) });
      this.next(g);
    },
    start(g) { g.live = true; speak(`${SHOW_JUDGES[g.judge]} asks: ${g.q}`); },
    next(g) {
      const [q, ans, wrongs] = SHOW_RIDDLES[g.order[g.round]];
      Object.assign(g, { q, ans, choices: shuffle([ans, ...shuffle(wrongs).slice(0, g.cards - 1)]), tried: [], rstate: 'pick', judge: g.round % 3 });
      g.say = q;
      if (g.live) speak(`${SHOW_JUDGES[g.judge]} asks: ${q}`);
    },
    cardX(g, i) { return W / 2 - (g.cards * RD_W + (g.cards - 1) * RD_GAP) / 2 + i * (RD_W + RD_GAP); },
    update(g, dt, id) {
      tickShake(g, dt);
      if (g.rstate === 'pick') {
        const k = numKey(g.cards), i = id?.startsWith('srd:') ? +id.slice(4) : k;
        if (i >= 0 && !g.tried.includes(i)) {
          g.tried.push(i);
          if (g.choices[i] === g.ans) {
            g.total += [1, 0.5, 0][g.tried.length - 1]; g.rstate = 'yay'; g.t2 = 2.3;
            SFX.hit(); burst(this.cardX(g, i) + RD_W / 2, 360, 24, { colors: uniCols() });
            floatText(this.cardX(g, i) + RD_W / 2, 300, g.tried.length === 1 ? 'Right!' : 'Got it!', '#fff6a8', false, 28);
            speak(`${pick(['Yes!', 'Clever!', 'Bravo!', 'You got it!'])} It's ${g.ans[1]}!`);
          } else { g.shake[i] = 0.4; SFX.miss(); speak(`Not ${g.choices[i][1]}. Listen again: ${g.q}`); }
        }
      } else if ((g.t2 -= dt) <= 0) { g.round++; if (g.round >= g.rounds) g.done = true; else this.next(g); }
      g.progress = `Riddle ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
      g.score = g.total / g.rounds;
    },
    draw(g) {
      ctx.fillStyle = 'rgba(20,10,40,.35)'; ctx.fillRect(0, 0, W, H);
      // the judges' table, the one asking glows and bobs
      const jx = [330, 480, 630];
      SHOW_JUDGES.forEach((n, i) => {
        const on = i === g.judge && g.rstate === 'pick';
        if (on) glow(jx[i], 140, 90, 'rgba(255,240,180,.55)');
        drawCritter(n, jx[i], 200 - (on ? Math.abs(Math.sin(S.t * 5)) * 6 : 0), 0.6, i === 0 ? 1 : i === 2 ? -1 : 1);
      });
      inkRect(240, 168, 480, 40, '#ff8fc8', 2.5, 10);
      ctx.fillStyle = '#ffb3d6'; for (let x = 252; x < 712; x += 40) ellipse(x + 20, 208, 20, 7);
      SHOW_JUDGE_ICONS.forEach((ic, i) => { rrect(jx[i] - 44, 176, 88, 24, 10, i === g.judge ? '#fff6a8' : '#fff0f8'); text(SHOW_JUDGES[i].split(' ').pop(), jx[i], 189, 13, '#7a2a6a', 'center', 700); });
      // the riddle in a speech bubble pointing at the judge
      const bx = 140, by = 222, bw = 680, bh = 82, lines = wrap(g.q, 620, 23, 700);
      ctx.fillStyle = '#fff8ee'; tri(jx[g.judge] - 16, by + 2, jx[g.judge] + 16, by + 2, jx[g.judge], by - 14);
      rrect(bx, by, bw, bh, 18, '#fff8ee', '#e0b0d8', 3);
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(jx[g.judge] - 14, by + 1, 28, 6);
      lines.forEach((l, i) => text(l, bx + bw / 2, by + bh / 2 + (i - (lines.length - 1) / 2) * 30, 23, '#6a2a5a', 'center', 700));
      // picture answers
      g.choices.forEach((c, i) => {
        const x = this.cardX(g, i) + shakeX(g, i), y = 316, used = g.tried.includes(i) && c !== g.ans, right = g.rstate === 'yay' && c === g.ans;
        button(`srd:${i}`, x, y, RD_W, 176, '', { color: right ? '#ffd23f' : used ? '#9a8aaa' : CARD_COLS[i], on: (g.rstate === 'pick' && !used) || right });
        rrect(x + 10, y + 10, RD_W - 20, 124, 14, used ? '#e8e0ee' : '#fff8ee');
        emoji(c[0], x + RD_W / 2, y + 72 + (right ? -Math.abs(Math.sin(S.t * 6)) * 10 : 0), 84);
        text(c[1].replace(/^(a|an|the) /, ''), x + RD_W / 2, y + 156, 20, '#fff', 'center', 700);
        text(String(i + 1), x + RD_W - 16, y + 156, 13, 'rgba(255,255,255,.6)', 'right', 700);
      });
      // Aubrey and the unicorn watch, thinking hard
      drawAubrey(84, 500, 'idle_front', 1, 0, 0.5);
      drawUnicorn(868, 500, 0.42, uniLook(), { facing: -1, glow: 0.6, mood: g.rstate === 'yay' ? 'joy' : undefined });
    },
  };

  // ===========================================================================================
  // 2. STRIKE A POSE: the crowd shouts a pose; hit it before the ring closes (late = PERFECT)
  // ===========================================================================================
  const POSES = [
    { id: 'twirl', icon: '🌀', name: 'Twirl', key: 'arrowleft', arrow: '←' },
    { id: 'jump', icon: '⬆️', name: 'Jump', key: 'arrowup', arrow: '↑' },
    { id: 'bow', icon: '🙇', name: 'Bow', key: 'arrowdown', arrow: '↓' },
    { id: 'sparkle', icon: '✨', name: 'Sparkle', key: 'arrowright', arrow: '→' },
  ];
  const POSE_BTN = [[22, 200], [22, 320], [778, 200], [778, 320]];
  MG.runwaypose = {
    kind: 'action', title: () => 'Strike a Pose', icon: () => '📸',
    how: () => 'The crowd will shout a pose. Tap that pose, or press its arrow key! Wait until the ring is small and golden for a PERFECT pose.',
    init(g) {
      Object.assign(g, { calls: 8, n: 0, total: 0, x: 480, dir: 1, walk: 0, pstate: 'gap', t2: 1.2, pose: null, pk: 0, flashK: 0, beat: 0, shake: {}, said: '' });
      g.say = 'Tap the pose the crowd shouts!';
      g.progress = `Pose 1 of ${g.calls}`;
    },
    call(g) {
      const prev = g.want;
      do g.want = pick(POSES); while (g.want === prev);
      g.dur = lerp(3.0, 2.2, g.n / (g.calls - 1)); g.k = 1; g.wrong = false; g.pstate = 'call';
      g.say = `${g.want.name}!`; speak(g.say); SFX.alert();
    },
    hit(g, credit, label, col) {
      g.total += credit; g.n++; g.pstate = 'pose'; g.pose = g.want.id; g.pk = 0; g.result = { label, col, t: 1.2 };
      if (credit > 0) { g.flashK = 1; SFX.sparkle(); burst(g.x, 360, credit >= 1 ? 30 : 16, { colors: uniCols() }); }
    },
    update(g, dt, id) {
      tickShake(g, dt);
      g.flashK = Math.max(0, g.flashK - dt * 3);
      if (g.result) g.result.t -= dt;
      // a little drum beat keeps the runway bouncy
      g.beat += dt; if (g.beat >= 0.5) { g.beat -= 0.5; tone(110, 0.08, 'triangle', 0.07); }
      if (g.pstate === 'gap' || g.pstate === 'pose') {
        // strut along the runway between poses
        if (g.pstate === 'gap') { g.x += g.dir * 110 * dt; g.walk += dt; if (g.x > 640) g.dir = -1; if (g.x < 320) g.dir = 1; }
        if (g.pstate === 'pose') g.pk += dt / 1.0;
        if (g.pstate === 'pose' && g.pk >= 1) { g.pstate = 'gap'; g.t2 = 0.7; g.pose = null; if (g.n >= g.calls) { g.done = true; } }
        if (g.pstate === 'gap' && !g.done && (g.t2 -= dt) <= 0) this.call(g);
      } else if (g.pstate === 'call') {
        g.k -= dt / g.dur;
        let p = -1;
        POSES.forEach((po, i) => { if (pressed[po.key] || pressed[String(i + 1)] || id === `pose:${i}`) p = i; });
        if (p >= 0) {
          if (POSES[p] === g.want) {
            const perfect = g.k < 0.42;
            this.hit(g, (perfect ? 1 : 0.75) * (g.wrong ? 0.6 : 1), perfect ? 'PERFECT!' : 'Nice!', perfect ? '#fff6a8' : '#bfe8ff');
            if (perfect) speak('Perfect!');
          } else if (!g.shake[p]) { g.shake[p] = 0.4; g.wrong = true; SFX.miss(); speak(`Oops! ${g.want.name}!`); }
        } else if (g.k <= 0) { this.hit(g, 0, 'Missed!', '#ffb0b0'); g.pose = null; g.pstate = 'pose'; SFX.miss(); }
      }
      g.progress = `Pose ${Math.min(g.n + 1, g.calls)} of ${g.calls}`;
      g.score = g.total / g.calls;
    },
    draw(g) {
      ctx.fillStyle = 'rgba(20,10,40,.25)'; ctx.fillRect(0, 0, W, H);
      // camera flashes twinkling in the crowd
      for (let i = 0; i < 10; i++) { const p = (S.t * 0.9 + i * 0.37) % 1; if (p < 0.08) { glow(60 + i * 92, 480 + (i % 2) * 20, 40, 'rgba(255,255,255,.9)'); emoji('📸', 60 + i * 92, 482, 22); } }
      // the crowd's shout
      if (g.pstate === 'call') {
        const cx = W / 2, cy = 165, k = clamp(g.k, 0, 1), gold = k < 0.42;
        rrect(cx - 170, 64, 340, 46, 23, 'rgba(48,24,72,.78)');
        outlined(`The crowd shouts: ${g.want.name.toUpperCase()}!`, cx, 87, 24, '#fff6a8');
        if (gold) glow(cx, cy + 40, 90, 'rgba(255,230,120,.6)');
        inkCircle(cx, cy + 40, 46, '#fff8ee', 2.5);
        emoji(g.want.icon, cx, cy + 40, 52);
        ctx.strokeStyle = gold ? '#ffd23f' : '#ff8fc8'; ctx.lineWidth = gold ? 9 : 6;
        ctx.beginPath(); ctx.arc(cx, cy + 40, 50 + 62 * k, 0, Math.PI * 2); ctx.stroke();
      }
      flash(g.flashK);
      if (g.result && g.result.t > 0) { ctx.globalAlpha = clamp(g.result.t * 2, 0, 1); outlined(g.result.label, W / 2, 150, 46, g.result.col); ctx.globalAlpha = 1; }
      // the unicorn on the runway
      const bob = g.pstate === 'gap' ? Math.abs(Math.sin(g.walk * 7)) * 5 : 0;
      ctx.fillStyle = 'rgba(30,10,40,.25)'; ellipse(g.x, 502, 90, 10);
      poseUnicorn(g.x, 500 - bob, 0.72, g.pose, g.pk, { facing: g.dir > 0 ? 1 : -1, moving: g.pstate === 'gap', mood: g.pose ? 'joy' : undefined });
      // pose buttons on both sides
      POSES.forEach((po, i) => {
        const [bx, by] = POSE_BTN[i], x = bx + shakeX(g, i);
        const hot = g.pstate === 'call' && po === g.want && g.k < 0.42;
        button(`pose:${i}`, x, by, 160, 100, '', { color: hot ? '#ffb81a' : CARD_COLS[i], on: g.pstate === 'call' });
        emoji(po.icon, x + 50, by + 50, 46);
        text(po.name, x + 112, by + 40, 20, '#fff', 'center', 700);
        text(po.arrow, x + 112, by + 70, 22, 'rgba(255,255,255,.8)', 'center', 700);
      });
    },
  };

  // ===========================================================================================
  // 3. SPOTLIGHT STRUT: keep the unicorn in the moving spotlight and catch the stars that fall in
  // ===========================================================================================
  MG.spotlightstrut = {
    kind: 'action', title: () => 'Spotlight Strut', icon: () => '🔦',
    how: () => 'The spotlight will move along the stage. Keep the unicorn in the light with the arrow keys or the mouse, and catch the falling stars!',
    init(g) {
      Object.assign(g, { timeLeft: 18, dur: 18, sx: 480, tx: 480, wait: 1.2, ux: 300, lit: 0, stars: [], spawn: 1.5, got: 0, made: 0, walk: 0, dir: 1, sparkT: 0 });
      g.say = 'Stay in the spotlight, and catch the stars!';
    },
    update(g, dt) {
      g.timeLeft -= dt;
      // the spotlight glides to a new spot, rests, and moves again
      if (g.wait > 0) g.wait -= dt;
      else {
        const d = g.tx - g.sx, step = Math.sign(d) * Math.min(Math.abs(d), 150 * dt);
        g.sx += step;
        if (Math.abs(g.tx - g.sx) < 1) { g.wait = rand(0.6, 1.3); do g.tx = rand(150, 810); while (Math.abs(g.tx - g.sx) < 180); }
      }
      // the unicorn
      const before = g.ux;
      if (goLeft()) g.ux -= 330 * dt;
      if (goRight()) g.ux += 330 * dt;
      if (pointerMoved(g) && !goLeft() && !goRight()) g.ux = lerp(g.ux, pointer.x, Math.min(1, dt * 8));
      g.ux = clamp(g.ux, 110, 850);
      const mv = g.ux - before;
      g.moving = Math.abs(mv) > 0.4; if (g.moving) { g.dir = Math.sign(mv); g.walk += dt; }
      g.inLight = Math.abs(g.ux - g.sx) < 85;
      if (g.inLight) { g.lit += dt; if ((g.sparkT -= dt) <= 0) { g.sparkT = 0.25; burst(g.ux + rand(-50, 50), rand(330, 440), 2, { colors: uniCols(), spread: 40, up: 60 }); } }
      // stars drop into the light
      if ((g.spawn -= dt) <= 0 && g.timeLeft > 1.5) {
        g.spawn = 1.7; g.made++;
        g.stars.push({ x: g.tx + rand(-40, 40), y: 60, col: pick(uniCols()), life: 3.6 });
      }
      for (const s of g.stars) {
        s.y = Math.min(400, s.y + 210 * dt); s.life -= dt;
        if (!s.got && s.y > 330 && Math.abs(s.x - g.ux) < 80) { s.got = true; g.got++; SFX.pop(); burst(s.x, s.y, 14, { colors: [s.col, '#fff'] }); floatText(s.x, s.y - 30, '+⭐', '#fff6a8', false, 22); }
      }
      g.stars = g.stars.filter(s => !s.got && s.life > 0);
      const lightPart = clamp(g.lit / ((g.dur - g.timeLeft) || 1e-6) * 1.1, 0, 1), starPart = g.made ? clamp(g.got / g.made, 0, 1) : 1;
      g.score = 0.7 * lightPart + 0.3 * starPart;
      g.progress = `In the light: ${Math.round(lightPart * 100)}%  ⭐ ${g.got}`;
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
    },
    draw(g) {
      ctx.fillStyle = 'rgba(8,4,24,.62)'; ctx.fillRect(0, 0, W, H);
      // the spotlight beam from the rigging
      const top = 96, src = 480 + (g.sx - 480) * 0.3;
      const lg = ctx.createLinearGradient(0, top, 0, 510);
      lg.addColorStop(0, 'rgba(255,250,215,.15)'); lg.addColorStop(1, 'rgba(255,250,215,.5)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(src - 16, top); ctx.lineTo(src + 16, top); ctx.lineTo(g.sx + 105, 500); ctx.lineTo(g.sx - 105, 500); ctx.closePath(); ctx.fill();
      ctx.fillStyle = g.inLight ? 'rgba(255,245,190,.75)' : 'rgba(255,245,190,.5)'; ellipse(g.sx, 502, 110, 16);
      inkRect(src - 26, top - 22, 52, 30, '#5a5a7a', 2, 8); ctx.fillStyle = '#fff6c8'; ellipse(src, top + 8, 18, 5);
      for (const s of g.stars) { glow(s.x, s.y, 34, 'rgba(255,255,220,.6)'); star(s.x, s.y, 18, s.col, 5); star(s.x, s.y, 8, '#fff', 5); }
      const bob = g.moving ? Math.abs(Math.sin(g.walk * 8)) * 5 : 0;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g.ux, 503, 80, 9);
      if (!g.inLight) ctx.globalAlpha = 0.65;
      drawUnicorn(g.ux, 500 - bob, 0.62, uniLook(), { facing: g.dir, moving: g.moving, glow: g.inLight ? 1 : 0.2, mood: g.inLight ? 'joy' : undefined });
      ctx.globalAlpha = 1;
      if (!g.inLight && g.timeLeft > 0) outlined(g.ux < g.sx ? 'Go right! →' : '← Go left!', g.ux, 250, 24, '#fff6a8');
    },
  };
}

// ---- running the rounds inside SCENES.show --------------------------------------------------
function startTalent(show) {
  show.talentI = -1;
  show.state = 'talentjudge';
  say([
    ['fairy', '🧚', `${show.total} points for that outfit! But wait... it's time for the TALENT ROUNDS!`, () => SFX.fanfare()],
    ['fairy', '🧚', `Our judges, Grandpa Smolder, Granny Owl and Wizard Wendell, will give up to ${TALENT_MAX} bonus points in each of three rounds!`],
  ], () => nextTalent(show));
}
function nextTalent(show) {
  show.talentI++;
  if (show.talentI >= TALENT_GAMES.length) return show.results();
  const type = TALENT_GAMES[show.talentI], impl = MG[type];
  const g = { type, skin: {}, mat: null, tier: 2, loc: null, t: 0, done: false, score: 0 };
  impl.init(g);
  Object.assign(show, { tg: g, timpl: impl, state: 'talent' });
  const judge = SHOW_JUDGES[show.talentI];
  say([[judge, null, `Talent round ${show.talentI + 1}: ${impl.title(g)}! ${impl.how(g)}`]], () => { impl.start?.(g); });
}
function talentUpdate(show, dt) {
  const g = show.tg, impl = show.timpl;
  const id = clickedButton();
  if (id === 'tsay') return speak(g.say || impl.how(g));
  g.t += dt;
  impl.update(g, dt, id);
  if (DEV && pressed['`']) { g.score = 1; g.done = true; }
  if (g.done) finishTalent(show);
}
function finishTalent(show) {
  const g = show.tg, impl = show.timpl;
  g.score = clamp(g.score, 0, 1);
  const pts = talentPoints(g.score), judge = SHOW_JUDGES[show.talentI];
  show.talentPts = (show.talentPts || 0) + pts;
  show.state = 'talentjudge';
  const say1 = pts >= 6 ? 'MAGNIFICENT! A perfect performance!' : pts >= 4 ? 'Wonderful! The crowd loved it!' : pts >= 2 ? 'Very nice! Good effort!' : 'A brave try! Every star counts.';
  say([[judge, null, `${say1} I give you ${pts} bonus ${pts === 1 ? 'point' : 'points'}!`, () => {
    show.shown.push({ name: `★ ${impl.title(g)}`, pts, col: '#ff9a3a' });
    show.total += pts; SFX.hit();
    burst(620, 360, 6 + pts * 4, { colors: ['#ffb81a', '#fff6a8', '#ff8fc8'] });
    floatText(620, 260, `+${pts}`, '#fff6a8', false, 40);
  }]], () => nextTalent(show));
}
function talentDraw(show) {
  const g = show.tg, impl = show.timpl;
  impl.draw(g);
  darkPanel(12, 12, 420, 44, 22);
  emoji(SHOW_JUDGE_ICONS[show.talentI], 34, 34, 20);
  text(`Round ${show.talentI + 1}: ${impl.title(g)}`, 54, 34, 18, '#fff', 'left', 700);
  if (g.timeLeft != null) {
    darkPanel(W - 132, 12, 120, 44, 22);
    emoji('⏱', W - 108, 34, 20);
    const t = Math.max(0, Math.ceil(g.timeLeft));
    text(`${t}s`, W - 88, 34, 19, t <= 5 ? '#ffb0b0' : '#fff', 'left', 700);
  }
  if (g.progress) { darkPanel(440, 12, 270, 44, 22); text(g.progress, 575, 34, 16, '#fff', 'center', 600); }
  button('tsay', W - 196, 10, 54, 48, '', { icon: '🔊', color: '#9a6ae0' });
}
// testing only: ?jump=show&talent=1 skips the rivals and outfit and starts the talent rounds
function skipToTalent(show, from = 1) {
  for (const sl of SLOTS) { const it = S.equip[sl.id] && ITEM[S.equip[sl.id]]; if (it && it.pts) { show.shown.push(it); show.total += it.pts; } }
  show.state = 'talentjudge';
  show.talentI = clamp(from, 1, TALENT_GAMES.length) - 2;
  nextTalent(show);
}
