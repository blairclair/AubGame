'use strict';
// Game state, scenes, checkpoints, and the dialog system.

let S = { t: 0 };
let checkpoint = null;
let scene = 'loading';
const SCENES = {};

function setScene(name, data) {
  scene = name;
  buttons = [];
  SCENES[name].enter?.(data);
}

function newGame() {
  const deck = {};
  for (const t of [1, 2, 3]) deck[t] = shuffle(LOCATIONS.filter(l => l.tier === t).map(l => l.id));
  return {
    t: 0, day: 1, visitsToday: 0, deck, log: [],
    name: 'Sparkle',
    equip: { mane: 'natural', style: 'flowing', head: null, neck: null, back: null, tail: null, hooves: null },
    owned: Object.fromEntries(WARDROBE.filter(i => i.free).map(i => [i.id, true])),
    mats: Object.fromEntries(MAT_ORDER.map(k => [k, 0])),
    shine: 8,
  };
}
const saveCheckpoint = () => { checkpoint = structuredClone(S); };
const restoreCheckpoint = () => { S = structuredClone(checkpoint); };

function uniLook(extra = {}) {
  const v = slot => { const id = S.equip[slot]; return id ? (ITEM[id].value || id) : null; };
  return { mane: v('mane'), style: v('style'), head: v('head'), neck: v('neck'), back: v('back'), tail: v('tail'), hooves: v('hooves'), shine: S.shine, ...extra };
}
const outfitScore = () => SLOTS.reduce((sum, s) => sum + (S.equip[s.id] ? ITEM[S.equip[s.id]].pts : 0), 0);
const canAfford = cost => Object.entries(cost).every(([k, n]) => S.mats[k] >= n);
function pay(cost) { for (const [k, n] of Object.entries(cost)) S.mats[k] -= n; }
const costText = cost => Object.entries(cost).map(([k, n]) => `${MATS[k].icon}${n}`).join(' ');
const daysLeft = () => SHOW_DAY - S.day;

// ---------------------------------------------------------------------------
// Dialog: an overlay over whatever scene is showing
// lines: [speaker, face, text, onShow?]
// ---------------------------------------------------------------------------
let dlg = null;
const SPEAKERS = { aubrey: 'Aubrey', mom: 'Mom', ranger: 'Ranger Rosa', neighbor: 'Mrs. Pickett', fairy: 'Fairy Fizzlewick', narrator: '' };
function say(lines, done) {
  dlg = { lines: lines.filter(Boolean), i: 0, chars: 0, done };
  showLine();
}
function showLine() {
  const line = dlg.lines[dlg.i];
  line[3]?.();
  speak(line[2]);
}
function updateDialog(dt) {
  const line = dlg.lines[dlg.i];
  dlg.chars += dt * 65;
  if (advancePressed() || pointer.clicked) {
    if (dlg.chars < line[2].length) { dlg.chars = line[2].length; return; }
    dlg.i++; dlg.chars = 0; SFX.blip();
    if (dlg.i >= dlg.lines.length) {
      const done = dlg.done; dlg = null;
      if (window.speechSynthesis) speechSynthesis.cancel();
      done?.();
    } else showLine();
  }
}
function drawPortrait(who, face, x, y) {
  const w = 108, h = 120;
  rrect(x - 3, y - 3, w + 6, h + 6, 15, '#ff8fc8');
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
  if (who === 'aubrey') ctx.drawImage(IMG[`face_${face || 'neutral'}`], x, y, w, h);
  else if (who === 'unicorn') {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffe3f3'); g.addColorStop(1, '#e8d6ff');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const s = 1.05;
    drawUnicorn(x + 50 - 92 * s, y + 66 + 176 * s, s, uniLook(), { mood: face || undefined });
  } else if (who === 'mom' || who === 'ranger' || who === 'neighbor') drawPersonPortrait(who, x, y, w, h, face === 'shock');
  else if (!drawCritterPortrait(who, x, y, w, h)) {
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 5, x + w / 2, y + h / 2, 80);
    g.addColorStop(0, '#fff8d8'); g.addColorStop(1, '#d8c2ff');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    emoji(face || '🧚', x + w / 2, y + h / 2 + 4 + Math.sin(S.t * 3) * 3, 70);
  }
  ctx.restore();
}
function drawDialog() {
  const [who, face, str] = dlg.lines[dlg.i];
  if (who === 'fairy') {
    // Fairy Fizzlewick flutters on screen while she talks
    const fx = 720 + Math.sin(S.t * 1.3) * 40, fy = 250 + Math.sin(S.t * 2.6) * 14;
    const g = ctx.createRadialGradient(fx, fy, 4, fx, fy, 70);
    g.addColorStop(0, 'rgba(255,250,210,.7)'); g.addColorStop(1, 'rgba(255,250,210,0)');
    ctx.fillStyle = g; ctx.fillRect(fx - 70, fy - 70, 140, 140);
    emoji('🧚', fx, fy, 64);
    if (Math.random() < 0.3) burst(fx + rand(-20, 20), fy + 20, 1, { spread: 30, up: -20, size: [2, 4] });
  }
  const shown = str.slice(0, Math.floor(dlg.chars));
  const x = 20, y = 14, w = W - 40, h = 150;
  panel(x, y, w, h, 20);
  let tx = x + 26;
  if (who !== 'narrator') {
    drawPortrait(who, face, x + 16, y + 15);
    tx = x + 146;
    const name = who === 'unicorn' ? S.name : (SPEAKERS[who] ?? who);
    text(name, tx, y + 28, 20, '#c2407e', 'left', 700);
  }
  const italic = who === 'narrator';
  const lines = wrap(shown, w - (tx - x) - 30, 19);
  ctx.font = `${italic ? 'italic ' : ''}500 19px ${FONT}`;
  ctx.fillStyle = italic ? '#5a4a7a' : '#3a2050';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const top = italic ? y + 32 : y + 58;
  lines.forEach((l, i) => ctx.fillText(l, tx, top + i * 25));
  if (dlg.chars >= str.length) {
    const bob = Math.sin(S.t * 6) * 3;
    ctx.fillStyle = '#ff6fb5';
    tri(x + w - 36, y + h - 26 + bob, x + w - 18, y + h - 26 + bob, x + w - 27, y + h - 15 + bob);
  }
}

// name entry uses a real text box
function askName(done) {
  const box = document.getElementById('nameBox'), form = document.getElementById('nameForm'), input = document.getElementById('nameInput');
  box.hidden = false;
  input.value = S.name;
  setTimeout(() => { input.focus(); input.select(); }, 30);
  form.onsubmit = e => {
    e.preventDefault();
    S.name = input.value.trim().slice(0, 14) || 'Sparkle';
    box.hidden = true;
    form.onsubmit = null;
    done();
  };
}
