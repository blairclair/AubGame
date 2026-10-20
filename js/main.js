'use strict';
// Main loop and start-up.

const nameBox = document.getElementById('nameBox');

function update(dt) {
  S.t += dt;
  updateFx(dt);
  if (!nameBox.hidden) return;
  if (dlg) return updateDialog(dt);
  SCENES[scene].update?.(dt);
}
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  SCENES[scene].draw();
  if (dlg) drawDialog();
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

// ?jump=<scene> skips ahead while iterating, e.g. ?jump=style
function debugJump(where) {
  S = newGame();
  S.theme = new URLSearchParams(location.search).get('theme') || S.theme;
  for (const k of MAT_ORDER) S.mats[k] = 4;
  Object.assign(S, { shine: 55, happy: 60, poise: 40 });
  saveCheckpoint();
  const go = {
    explore: () => startWorld('explore'),
    follow: () => startWorld('follow'),
    gather: () => startWorld('gather'),
    evening: () => { S.slot = 2; startWorld('gather'); },
    shownight: () => { S.day = SHOW_DAY; S.slot = 2; startWorld('shownight'); },
    show: () => { S.day = SHOW_DAY; S.slot = 2; Object.assign(S.equip, { mane: 'pink', style: 'braid', head: 'crown', neck: 'lei', back: 'wings' }); setScene('show'); },
    runway: () => startRunway('practice'),
    hide: () => setScene('hide', () => setScene('salon')),
    night: () => setScene('night'),
    end: () => setScene('end'),
  }[where];
  if (go) go();
  else setScene(SCENES[where] ? where : 'salon');
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
