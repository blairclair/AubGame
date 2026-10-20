'use strict';
// Runway walk: a rhythm game. Press the arrow shown when it reaches the sparkle ring.

const DIRS = {
  left:  { key: ['arrowleft', 'a'],  glyph: '←', col: '#ff6fb5' },
  up:    { key: ['arrowup', 'w'],    glyph: '↑', col: '#ffc83d' },
  right: { key: ['arrowright', 'd'], glyph: '→', col: '#4fb8ec' },
  down:  { key: ['arrowdown', 's'],  glyph: '↓', col: '#5fc87a' },
};
const BPM = 100, BEAT = 60 / BPM, HIT_X = 150, NOTE_SPEED = 330, LANE_Y = 150;
const BASS = [131, 131, 165, 147, 175, 175, 165, 147];
const MELODY = [523, 587, 659, 784, 880, 784, 659, 587];

function makeSong(len) {
  const notes = [];
  let beat = 4;
  while (notes.length < len) {
    notes.push({ t: beat * BEAT, dir: pick(Object.keys(DIRS)), judged: null });
    beat += Math.random() < 0.3 && notes.length > 4 ? 0.5 : 1;
    if (Math.random() < 0.12) beat += 1;
  }
  return notes;
}
function startRunway(mode, onDone) {
  setScene('runway', { mode, onDone });
}

SCENES.runway = {
  enter({ mode, onDone }) {
    const notes = makeSong(mode === 'show' ? 30 : 22);
    const p = S.poise;
    Object.assign(this, {
      mode, onDone, notes, time: -0.8, beatDone: -1, combo: 0, best: 0, points: 0,
      perfect: 0.075 + p * 0.0004, good: 0.16 + p * 0.0006,
      end: notes[notes.length - 1].t + BEAT * 3, hop: 0, wobble: 0, joy: 0, finished: false, last: null,
    });
  },
  update(dt) {
    if (this.finished) return;
    this.time += dt;
    this.hop = Math.max(0, this.hop - dt * 4); this.wobble = Math.max(0, this.wobble - dt * 3); this.joy = Math.max(0, this.joy - dt);
    // backing track, scheduled a beat at a time
    const b = Math.floor((this.time + 0.1) / BEAT);
    if (b > this.beatDone && this.time + 0.1 < this.end) {
      this.beatDone = b;
      const when = b * BEAT - this.time;
      tone(BASS[b % 8], BEAT * 0.9, 'triangle', 0.09, when);
      tone(60, 0.12, 'sine', 0.2, when, 40);
      noise(0.04, 0.03, when + BEAT / 2);
      if (b % 4 === 2) noise(0.12, 0.05, when);
    }
    // which arrow did the player press?
    let dirPressed = null;
    for (const [d, def] of Object.entries(DIRS)) if (def.key.some(k => pressed[k])) dirPressed = d;
    const id = clickedButton();
    if (id?.startsWith('dir:')) dirPressed = id.slice(4);
    if (dirPressed) {
      const n = this.notes.find(n => !n.judged && Math.abs(n.t - this.time) < this.good);
      if (n) this.judge(n, n.dir !== dirPressed ? 'miss' : Math.abs(n.t - this.time) < this.perfect ? 'perfect' : 'good');
    }
    for (const n of this.notes) if (!n.judged && this.time - n.t > this.good) this.judge(n, 'miss');
    if (this.time > this.end) this.finish();
  },
  judge(n, how) {
    n.judged = how;
    const i = this.notes.indexOf(n);
    if (how === 'miss') {
      this.combo = 0; this.wobble = 1; SFX.miss();
      this.last = { how: 'Oops!', col: '#ffb0c4', t: 0.6 };
      return;
    }
    this.combo++; this.best = Math.max(this.best, this.combo);
    this.points += how === 'perfect' ? 100 : 65;
    this.hop = 1; this.joy = 0.5;
    tone(MELODY[i % 8] * (how === 'perfect' ? 2 : 1), 0.25, 'triangle', 0.09);
    burst(HIT_X, LANE_Y, how === 'perfect' ? 12 : 6, { colors: [DIRS[n.dir].col, '#fff'], spread: 100, up: 30 });
    const ux = this.uniX();
    if (how === 'perfect') burst(ux, 330, 6, { colors: ['#fff6a8', '#ffb3e0'], spread: 80, up: 60 });
    this.last = { how: how === 'perfect' ? 'Perfect!' : 'Good!', col: how === 'perfect' ? '#fff6a8' : '#b8e6ff', t: 0.6 };
  },
  uniX() { return lerp(220, 760, clamp(this.time / this.end, 0, 1)); },
  finish() {
    this.finished = true;
    const acc = this.points / (this.notes.length * 100);
    if (this.mode === 'show') return this.onDone(acc);
    const old = S.poise;
    S.poise = Math.min(100, Math.max(S.poise + 4, Math.round(acc * 100)));
    S.happy = Math.min(100, S.happy + 4);
    say([['narrator', null, `Runway practice: ${Math.round(acc * 100)}% — best combo ${this.best}! Poise ${old} → ${S.poise} 💃`]], () => afterActivity());
  },
  draw() {
    buttons = [];
    if (this.mode === 'show') drawShowStage(true);
    else {
      drawShedInterior(0.25);
      ctx.fillStyle = '#e07aa0'; ctx.fillRect(140, 470, 700, 34);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; for (let x = 150; x < 830; x += 40) ctx.fillRect(x, 484, 20, 4);
    }
    // the unicorn struts across
    const ux = this.uniX(), lift = Math.sin(this.hop * Math.PI) * 18;
    ctx.save(); ctx.translate(ux, 500 - lift); ctx.rotate(Math.sin(S.t * 30) * 0.05 * this.wobble);
    drawUnicorn(0, 0, 0.95, uniLook(), { facing: 1, moving: this.time > 0 && this.time < this.end - BEAT, mood: this.joy > 0 ? 'joy' : this.wobble > 0 ? 'wow' : undefined, glow: 0.5 });
    ctx.restore();

    // note lane
    panel(20, LANE_Y - 46, W - 40, 92, 46);
    const g = ctx.createRadialGradient(HIT_X, LANE_Y, 10, HIT_X, LANE_Y, 44);
    g.addColorStop(0, 'rgba(255,240,255,.9)'); g.addColorStop(1, 'rgba(255,200,240,.2)');
    ctx.fillStyle = g; circle(HIT_X, LANE_Y, 40);
    ctx.strokeStyle = '#ff8fc8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(HIT_X, LANE_Y, 36, 0, Math.PI * 2); ctx.stroke();
    for (let b = Math.ceil(this.time / BEAT); b * BEAT < this.time + 3; b++) {
      const x = HIT_X + (b * BEAT - this.time) * NOTE_SPEED;
      if (x < W - 30) { ctx.fillStyle = 'rgba(200,170,220,.5)'; ctx.fillRect(x - 1, LANE_Y - 30, 2, 60); }
    }
    for (const n of this.notes) {
      if (n.judged && n.judged !== 'miss') continue;
      const x = HIT_X + (n.t - this.time) * NOTE_SPEED;
      if (x > W - 40 || x < 30) continue;
      const d = DIRS[n.dir];
      ctx.globalAlpha = n.judged === 'miss' ? 0.3 : 1;
      rrect(x - 28, LANE_Y - 28, 56, 56, 16, d.col, '#fff', 3);
      outlined(d.glyph, x, LANE_Y + 1, 34, '#fff', 'center', mix(d.col, '#000000', 0.35));
      ctx.globalAlpha = 1;
    }
    if (this.last && this.last.t > 0) {
      this.last.t -= 1 / 60;
      outlined(this.last.how, HIT_X, LANE_Y - 64, 24, this.last.col);
    }
    if (this.combo > 2) outlined(`${this.combo} combo!`, W - 110, LANE_Y + 70, 20, '#fff6a8');
    if (this.time < 0.4) outlined(this.mode === 'show' ? 'Strut your stuff!' : 'Runway practice!', W / 2, 270, 36, '#fff');
    if (this.time < BEAT * 4 && this.time > 0) outlined(String(4 - Math.floor(this.time / BEAT)), W / 2, 320, 48, '#fff6a8');
    darkPanel(20, LANE_Y + 54, 440, 32, 16);
    text('Press the matching arrow key (or WASD) when it hits the ring', 34, LANE_Y + 70, 14, '#fff', 'left', 500);
    Object.entries(DIRS).forEach(([d, def], i) => {
      const b = { id: `dir:${d}`, x: W - 260 + i * 62, y: H - 76, w: 56, h: 56, on: true };
      buttons.push(b);
      rrect(b.x, b.y, b.w, b.h, 14, def.col, '#fff', 3);
      outlined(def.glyph, b.x + 28, b.y + 29, 30, '#fff', 'center', mix(def.col, '#000000', 0.35));
    });
    drawFx(false);
  },
};
