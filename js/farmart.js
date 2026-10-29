'use strict';
// Storybook-style farm animal portraits for the Farm Facts cards.
// Each ANIMAL_ART[kind](t) draws one animal facing right, standing with its feet on y = 0,
// centred on x = 0 and fitting inside x -120..120, y -200..0. t is the clock for small motions.
const ANIMAL_ART = {};
const ANIMAL_KINDS = ['cow', 'sheep', 'goat', 'llama', 'horse', 'donkey', 'pig', 'rabbit', 'hen', 'duck', 'turkey'];
function drawAnimalArt(kind, x, y, s = 1, t = S.t) {
  if (!ANIMAL_ART[kind]) return false;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(40,30,20,.18)'; ellipse(0, 2, 96, 12);
  ANIMAL_ART[kind](t);
  ctx.restore();
  return true;
}
