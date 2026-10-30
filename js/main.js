'use strict';
// Main loop and start-up.

const nameBox = document.getElementById('nameBox');

function update(dt) {
  S.t += dt;
  updateFx(dt);
  if (pressed.r) { readAloud = !readAloud; if (!readAloud && window.speechSynthesis) speechSynthesis.cancel(); }
  if (!nameBox.hidden) return;
  if (dlg) return updateDialog(dt);
  SCENES[scene].update?.(dt);
}
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  SCENES[scene].draw();
  if (dlg) drawDialog();
  if (scene !== 'loading') text(`R: read aloud ${readAloud ? 'on' : 'off'}  ·  M: sound ${muted ? 'off' : 'on'}`, W - 14, H - 8, 11, 'rgba(255,255,255,.75)', 'right', 500);
}
let last = performance.now();
function frame(now) {
  // schedule first so one bad frame can't stop the game for good
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    update(dt);
    render();
  } finally {
    pressed = {};
    pointer.clicked = false;
  }
}

// ?jump=<where> skips ahead while iterating, e.g. ?jump=stages (the stage picker), ?jump=map, ?jump=place&id=volcano, ?jump=game&type=count&tier=2
// add &pet=dino to any jump for the baby-dinosaur route; the dino* jumps set it themselves; &hero=levi plays as Levi
function debugJump(where, q = new URLSearchParams(location.search)) {
  if (q.get('hero')) useHero(q.get('hero'));
  const pet = where.startsWith('dino') || q.get('pet') === 'dino' ? 'dino' : 'unicorn';
  S = newGame(pet);
  S.shine = 100;
  for (const k of MAT_ORDER) S.mats[k] = +(q.get('mats') ?? 4);
  saveCheckpoint();
  const go = {
    explore: () => startWorld('explore'),
    follow: () => startWorld('follow'),
    shownight: () => { S.day = SHOW_DAY; startWorld('shownight'); },
    kingdom: () => { S.day = SHOW_DAY; setScene('kingdom'); },
    map: () => setScene('map'),
    place: () => setScene('location', { id: q.get('id') || 'garden' }),
    game: () => {
      const type = q.get('type') || 'count';
      const place = LOCATIONS.find(l => l.games.some(g => g.type === type)) || LOCATIONS[0];
      setScene('minigame', { game: place.games.find(g => g.type === type), tier: +(q.get('tier') || place.tier), loc: place, onDone: () => setScene('map') });
      const m = SCENES.minigame;
      if (q.get('play')) { m.g.phase = 'play'; m.impl.start?.(m.g); }
    },
    craft: () => setScene('style', { mode: 'craft', onDone: () => setScene('night') }),
    hide: () => setScene('hide', () => setScene('map')),
    show: () => { S.day = SHOW_DAY; Object.assign(S.equip, { mane: 'gold', style: 'curly', head: 'tiara', neck: 'necklace', back: 'wings', tail: 'goldcuff', hooves: 'hoof_gold' }); setScene('show'); },
    night: () => setScene('night'),
    end: () => setScene('end'),
    stages: () => setScene('stages'),
    // the pet picker and the baby-dinosaur route
    pick: () => setScene('title'),
    dinofind: () => startWorld('explore'),
    dinofollow: () => startWorld('follow'),
    dinonight: () => { S.day = +(q.get('day') || 2); dinoDressed(q); setScene('dinonight', { onDone: bedtime }); },
    dinohide: () => { S.day = 2; dinoDressed(q); setScene('hide', () => setScene('dinonight', { onDone: bedtime })); },
    dinocraft: () => setScene('style', { mode: 'craft', onDone: () => setScene('map') }),
    dinosleep: () => { dinoDressed(q); setScene('night'); },
    dinohop: () => { S.day = SHOW_DAY; dinoDressed(q); setScene(SCENES.dinohop ? 'dinohop' : 'map'); },
    dinodefense: () => { S.day = SHOW_DAY; dinoDressed(q); setScene(SCENES.dinodefense ? 'dinodefense' : 'map'); },
    dinoend: () => { S.day = SHOW_DAY; dinoDressed(q); setScene('dinoend', { reunited: q.get('lost') ? false : true }); },
  }[where];
  (go || (() => setScene('map')))();
  if (scene === 'world' && q.get('x')) WS.a.x = +q.get('x');
}

// a few dino things already made, for testing (&bare=1 to skip)
function dinoDressed(q) {
  if (q.get('bare')) return;
  for (const id of ['d_beanie', 'd_scarf', 'd_backpack', 'd_tailbow', 'd_boots']) { S.owned[id] = true; S.equip[ITEM[id].slot] = id; }
}

setScene('loading');
requestAnimationFrame(frame);
Promise.all([loadImages(), document.fonts?.ready]).catch(err => {
  console.error(err);
  alert(`${err.message}\n\nRun a local server in this folder (e.g. "python3 -m http.server") and open it from there.`);
  throw err;
}).then(() => {
  const jump = new URLSearchParams(location.search).get('jump');
  if (jump) debugJump(jump);
  else setScene('title');
});
