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

function newGame(pet = 'unicorn') {
  const deck = {};
  for (const t of [1, 2, 3]) deck[t] = shuffle(LOCATIONS.filter(l => l.tier === t).map(l => l.id));
  return {
    t: 0, day: 1, visitsToday: 0, deck, log: [],
    pet, // 'unicorn' | 'dino' — chosen on the title screen; saves without it are unicorn games
    hero: HERO.id, // who the player is (js/hero.js), also chosen on the title screen
    name: pet === 'dino' ? 'Sprout' : 'Sparkle',
    equip: { mane: 'natural', style: 'flowing', head: null, neck: null, back: null, tail: null, hooves: null, dhead: null, dneck: null, dback: null, dtail: null, dfeet: null },
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
// --- the secret pet: a unicorn, or a baby dinosaur (js/pet.js) ---------------------------------
const isDino = () => !!S && S.pet === 'dino';
const petSlots = () => (isDino() ? DINO_SLOTS : SLOTS);
function dinoLook(extra = {}) {
  const v = slot => (S.equip?.[slot] ? (ITEM[S.equip[slot]]?.value || S.equip[slot]) : null);
  return { head: v('dhead'), neck: v('dneck'), back: v('dback'), tail: v('dtail'), feet: v('dfeet'), ...extra };
}
const petLook = (extra = {}) => (isDino() ? dinoLook(extra) : uniLook(extra));
// how many dino things she has made (the journey kit)
const dinoKit = () => WARDROBE.filter(i => i.pet === 'dino' && S.owned[i.id]);
// on the dino route, story and place dialog that was written for the unicorn is gently rewritten
const PET_SWAPS = [
  // whole lines first, where a word swap would read oddly (the show, the rivals, a "magical" pet)
  [/Every unicorn I know LOVES petals\./g, 'Little dinosaurs LOVE munching petals!'],
  [/A friend of gnomes is a friend of unicorns\./g, 'A friend of gnomes is a friend of little dinosaurs.'],
  [/Wait — you know about unicorns\?/g, 'Wait — you know about my dinosaur?!'],
  [/Moon-silk, for a moon-bright unicorn\./g, 'Moon-silk, to keep a little dino snug on the long way home.'],
  [/Your unicorn is going to sparkle like a comet\. Go win that show!/g, 'Your baby dino will glow like a comet, all the way home!'],
  [/Stardust AND moonbeams\. Go win that show!/g, 'Stardust AND moonbeams. Get your little dino home safe!'],
  [/^Like a fashion show!$/g, 'Like playing dress-up!'],
  // Marina is a rival in the unicorn's show; on the dino route she is just a friendly mermaid
  [/^A mermaid is sitting on a rock\. It's Marina[ ,—–-]+one of the other contestants!$/g, "A mermaid is sitting on a rock, humming to the moon. It's Marina!"],
  [/^You're in the show too\? A fair show is a good show\. /g, "Hello! I've never seen you at my lake before. "],
  [/^You're competing too\? Then I'll help you\. A fair show is a good show\. /g, "Hello! I've never seen you at my lake before. "],
  [/^You're\.\.\. nice\?$/g, 'Can I really ride in your boat?'],
  [/^See you at the show\. May the best creature win!$/g, 'Come back and race me again soon!'],
  [/^Good luck, Marina!$/g, 'I will! Bye, Marina!'],
  [/could stay forever/g, 'could get home to his mama'],
  [/Good luck at the show!/g, 'Good luck on the journey home!'],
  [/Go win that show!/g, 'Get him home safe!'],
  [/You know about the show\?!/g, 'You know about our secret journey?!'],
  [/May the best creature win!/g, 'Safe travels, little one!'],
  [/\bat the show\b/g, 'on the journey'],
  [/\bunicorns\b/gi, 'baby dinos'],
  [/\bunicorn\b/gi, 'baby dino'],
  [/\bmanes\b/gi, 'spikes'],
  [/\bmane\b/gi, 'spikes'],
  [/\bhooves\b/gi, 'feet'],
  [/\bhoofprints?\b/gi, m => (m.endsWith('s') ? 'footprints' : 'footprint')],
  [/\bhoof\b/gi, 'foot'],
  [/\bwhinnies\b/gi, 'happy squeaks'],
  [/\bwhinny\b/gi, 'happy squeak'],
  [/\bneighs?\b/gi, 'squeak'],
];
// extra place lines on the dino route, slipped in `at` lines from the end of that part
const DINO_PLACE_ADD = {
  honeytree: { outro: { at: 2, lines: [
    "A:thinking:Lofty, have you ever seen a little green dino with pink spikes? His name is {N}, and he's lost. He wants his mama.",
    "N:Oh, the poor little one! His family must live at the far end of the valley, across the big river of dinosaurs. It's a long way, so bring lots of supplies!",
  ] } },
};
function placeLines(place, part) {
  const lines = place[part], add = isDino() && DINO_PLACE_ADD[place.id]?.[part];
  if (!add) return lines;
  const at = Math.max(0, lines.length - add.at);
  return [...lines.slice(0, at), ...add.lines, ...lines.slice(at)];
}
function petText(str) {
  if (!isDino() || typeof str !== 'string') return str;
  for (const [re, to] of PET_SWAPS) {
    str = str.replace(re, m => {
      const out = typeof to === 'function' ? to(m) : to;
      return m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out;
    });
  }
  return str;
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
const SPEAKERS = { mamadino: 'Mama Dino', papadino: 'Papa Dino', aubrey: 'Aubrey', mom: 'Mom', ranger: 'Ranger Rosa', neighbor: 'Mrs. Pickett', fairy: 'Fairy Fizzlewick', narrator: '' };
function say(lines, done) {
  // the dino route swaps unicorn words in story/place lines (petText is a no-op for the unicorn)
  // the hero's name and {her|his} words are filled in up front, so the typewriter never shows half a token
  dlg = { lines: lines.filter(Boolean).map(l => [l[0], l[1], heroText(isDino() ? petText(l[2]) : l[2]), l[3]]), i: 0, chars: 0, done };
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
  else if (who === 'mamadino' || who === 'papadino') {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#fff2c8'); g.addColorStop(1, '#c8f0c0');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const s = 0.85;
    drawBabyDino(x + 54 - 68 * s, y + 66 + 157 * s, s, {}, { grown: true, mood: 'joy', palette: who === 'mamadino' ? MAMA_PAL : PAPA_PAL });
  } else if (who === 'unicorn' || who === 'dino') {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffe3f3'); g.addColorStop(1, '#e8d6ff');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (isDino()) { const s = 0.8; drawBabyDino(x + 54 - 76 * s, y + 70 + 165 * s, s, dinoLook(), { mood: face || undefined }); }
    else { const s = 1.05; drawUnicorn(x + 50 - 92 * s, y + 66 + 176 * s, s, uniLook(), { mood: face || undefined }); }
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
    const name = who === 'unicorn' || who === 'dino' ? S.name : (SPEAKERS[who] ?? who);
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
  box.querySelector('h2').textContent = isDino() ? 'What will you name him?' : 'What will you name her?';
  box.querySelector('button').textContent = isDino() ? "That's his name!" : "That's her name!";
  input.value = S.name;
  setTimeout(() => { input.focus(); input.select(); }, 30);
  form.onsubmit = e => {
    e.preventDefault();
    S.name = input.value.trim().slice(0, 14) || (isDino() ? 'Sprout' : 'Sparkle');
    box.hidden = true;
    form.onsubmit = null;
    done();
  };
}
