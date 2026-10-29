'use strict';
// Duck Pond art: the pond backdrop, silly rubber ducks, the things they hide behind, and real duck species.

// --- rubber ducks ---------------------------------------------------------------------------
// drawn facing right with the bottom of the body at (0, 0); head centre (16, -62), radius 24
const RD_BODY = new Path2D('M-50,-54 Q-44,-38 -30,-40 C-6,-46 30,-44 44,-30 C54,-16 44,0 20,0 L-26,0 C-50,0 -58,-22 -50,-54 Z');
const RD_WING = new Path2D('M-24,-30 C-12,-40 10,-38 16,-26 C4,-16 -14,-18 -24,-30 Z');
const RD_BEAK = new Path2D('M34,-66 C46,-72 60,-68 62,-58 C54,-50 40,-52 34,-56 Z');
const RD_HEAD = new Path2D(); RD_HEAD.arc(16, -62, 24, 0, Math.PI * 2);
function rdEye(shut = false) {
  if (shut) { ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(22, -68, 5, Math.PI, 0); ctx.stroke(); return; }
  inkCircle(22, -68, 6, '#fff', 1); ctx.fillStyle = '#2a1a3a'; circle(23.5, -67.5, 3.6); ctx.fillStyle = '#fff'; circle(22.5, -69, 1.3);
}
function rdSpots(col, pts, r) { ctx.save(); ctx.clip(RD_BODY); ctx.fillStyle = col; for (const [x, y] of pts) circle(x, y, r); ctx.restore(); }
function rdHat(path, fill) { ink(P2(path), fill, 2); }
// [name, body colour, beak colour, extras drawn on top, extras drawn behind]
const RUBBER_DUCKS = {
  pirate: ['Pirate Duck', '#ffd83a', '#ff9a2a', () => {
    ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-6, -74); ctx.lineTo(38, -60); ctx.stroke();
    ctx.fillStyle = '#2a1a3a'; ellipse(23, -67, 8, 7);
    rdHat('M-12,-76 C-4,-104 36,-104 44,-76 C30,-82 4,-82 -12,-76 Z', '#2a1a3a');
    ctx.fillStyle = '#fff'; circle(16, -90, 4.5); ctx.fillRect(14, -87, 4, 3);
  }],
  astronaut: ['Astronaut Duck', '#f4f6fb', '#ff9a2a', () => {
    inkRect(-20, -30, 16, 12, '#ff5f7e', 1.5, 3);
    ctx.fillStyle = 'rgba(190,235,255,.35)'; circle(18, -62, 36);
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(18, -62, 36, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#d8e0ec'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(18, -62, 28, 3.6, 4.4); ctx.stroke();
  }],
  unicorn: ['Unicorn Duck', '#fff0fb', '#ffb05a', () => {
    PG_RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ellipse(-6 + i * 2, -78 + i * 7, 9, 5, -0.6); });
    ink(P2('M10,-84 L22,-120 L26,-82 Z'), '#ffd83a', 2);
    ctx.strokeStyle = '#e0a020'; ctx.lineWidth = 2; for (const y of [-92, -100, -108]) { ctx.beginPath(); ctx.moveTo(13, y + 2); ctx.lineTo(24, y - 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,120,180,.5)'; circle(30, -56, 5);
  }],
  dino: ['Dino Duck', '#7fd35a', '#ff9a2a', () => rdSpots('#5fb84a', [[-20, -14], [6, -20], [26, -10]], 6), () => {
    for (const [x, y, a] of [[10, -84, -0.15], [-4, -78, -0.7], [-18, -40, -0.15], [-34, -40, -0.35], [-48, -50, -1.1]]) inkAt(x, y, a, P2('M-9,4 L0,-14 L9,4 Z'), '#ff8a3a', 1.5);
  }],
  robot: ['Robot Duck', '#b8c4d4', '#ffb84a', () => {
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, -84); ctx.lineTo(10, -102); ctx.stroke();
    inkCircle(10, -104, 5, '#ff5f7e', 1.5);
    rdSpots('#7a8aa0', [[-30, -32], [-18, -8], [8, -8], [30, -14], [34, -32]], 2.5);
    inkRect(-8, -28, 20, 14, '#8ad4ff', 1.5, 2);
  }],
  disco: ['Disco Duck', '#c46aff', '#ff9a2a', () => {
    rdSpots('#ffffff', [[-30, -30], [-10, -14], [10, -34], [24, -12], [-36, -12], [36, -26]], 2.5);
    ink(P2('M6,-72 L28,-72 L26,-62 L10,-62 Z M30,-72 L44,-70 L42,-62 L32,-62 Z'), '#ff4fb5', 1.5);
    star(-34, -70, 8, '#fff6a8', 4); star(46, -94, 6, '#fff6a8', 4);
  }],
  chef: ['Chef Duck', '#ffd83a', '#ff9a2a', () => {
    ink(P2('M-2,-80 L32,-80 L32,-92 C46,-96 44,-116 30,-112 C30,-126 6,-126 6,-112 C-8,-116 -12,-96 -2,-92 Z'), '#ffffff', 2);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(36, -52); ctx.quadraticCurveTo(28, -44, 22, -52); ctx.moveTo(36, -52); ctx.quadraticCurveTo(46, -42, 52, -50); ctx.stroke();
  }],
  wizard: ['Wizard Duck', '#5a8aff', '#ffb05a', () => {
    ink(P2('M28,-54 C36,-34 26,-20 20,-12 C14,-24 8,-38 14,-52 Z'), '#ffffff', 1.5);
    ink(P2('M-14,-78 C4,-84 34,-84 46,-78 L22,-130 Z'), '#7a3ad0', 2);
    star(18, -102, 6, '#ffe24a', 5); star(6, -88, 4, '#ffe24a', 5);
  }],
  cow: ['Cow Duck', '#ffffff', '#ff9ab0', () => {
    rdSpots('#2a1a3a', [[-30, -30], [6, -14], [28, -34]], 10);
    ink(P2('M0,-82 C-6,-92 -2,-98 4,-94 L8,-84 Z M28,-84 L32,-96 C36,-100 40,-94 36,-84 Z'), '#e8e0d0', 1.5);
    ctx.fillStyle = '#2a1a3a'; ellipse(4, -58, 6, 8, 0.4);
  }],
  watermelon: ['Watermelon Duck', '#ff6a7a', '#ff9a2a', () => {
    ctx.save(); ctx.clip(RD_BODY); ctx.fillStyle = '#5ac84a'; ctx.fillRect(-60, -10, 120, 12); ctx.fillStyle = '#d8f5c0'; ctx.fillRect(-60, -14, 120, 4); ctx.restore();
    ctx.fillStyle = '#2a1a3a'; for (const [x, y] of [[-30, -32], [-14, -22], [4, -30], [22, -22], [-36, -18], [34, -30], [4, -86], [-2, -54]]) ellipse(x, y, 2.4, 4, 0.3);
  }],
  ghost: ['Ghost Duck', 'rgba(244,240,255,.82)', '#d8c8ff', () => {
    ctx.fillStyle = 'rgba(255,170,210,.6)'; circle(32, -56, 5);
    ctx.fillStyle = 'rgba(160,140,220,.7)'; ellipse(-6, -26, 8, 10);
  }],
  viking: ['Viking Duck', '#ffd83a', '#ff9a2a', () => {
    ink(P2('M-10,-74 C-14,-80 -26,-82 -30,-100 C-18,-94 -8,-90 -4,-82 Z M38,-82 C44,-88 52,-90 58,-104 C62,-90 54,-80 44,-74 Z'), '#fff6e0', 1.5);
    ink(P2('M-8,-74 C-4,-98 36,-98 42,-74 Z'), '#b8c4d4', 2);
    ctx.fillStyle = '#8a96a8'; ctx.fillRect(-8, -78, 50, 5);
    ink(P2('M-6,-60 C-14,-50 -14,-36 -8,-28 C-2,-36 -2,-50 -2,-58 Z'), '#ff8a3a', 1.5);
  }],
  ballerina: ['Ballerina Duck', '#ffc8e0', '#ff9a2a', () => {
    ctx.save(); ctx.translate(0, -16);
    for (let i = 0; i < 9; i++) ink(P2(`M${-44 + i * 11},0 L${-50 + i * 11},14 L${-38 + i * 11},14 Z`), '#ff8ac8', 1);
    ctx.restore();
    ink(P2('M2,-82 L8,-96 L14,-86 L20,-100 L26,-86 L32,-96 L36,-82 Z'), '#ffe24a', 1.5);
    ctx.fillStyle = '#ff4f9a'; circle(20, -92, 3);
  }],
  tiger: ['Tiger Duck', '#ffa53a', '#ffd83a', () => {
    ctx.save(); ctx.clip(RD_BODY); ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 5;
    for (const x of [-34, -16, 2, 20, 36]) { ctx.beginPath(); ctx.moveTo(x, -50); ctx.quadraticCurveTo(x + 8, -30, x, -16); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.clip(RD_HEAD); ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 4;
    for (const x of [4, 14]) { ctx.beginPath(); ctx.moveTo(x, -90); ctx.lineTo(x + 3, -78); ctx.stroke(); }
    ctx.restore();
  }],
  king: ['King Duck', '#ffcf3a', '#ff7a2a', () => {
    ink(P2('M-2,-80 L-4,-104 L6,-92 L16,-108 L26,-92 L36,-104 L34,-80 Z'), '#ffe24a', 2);
    for (const [x, c] of [[6, '#ff4f6a'], [16, '#4fa8ff'], [26, '#5adc7a']]) { ctx.fillStyle = c; circle(x, -86, 3); }
    star(-30, -44, 6, '#fffbe0', 4); star(30, -20, 5, '#fffbe0', 4);
  }],
  cactus: ['Cactus Duck', '#5fbf6a', '#ffb05a', () => {
    ctx.strokeStyle = '#fff6d8'; ctx.lineWidth = 1.5;
    for (const [x, y] of [[-34, -34], [-20, -20], [-4, -36], [12, -16], [30, -28], [2, -82], [-2, -64], [-30, -50]]) { ctx.beginPath(); ctx.moveTo(x - 4, y - 3); ctx.lineTo(x + 4, y + 3); ctx.moveTo(x + 4, y - 3); ctx.lineTo(x - 4, y + 3); ctx.stroke(); }
    flower(12, -88, 8, '#ff6fae', '#ffd84a', 1.2);
  }],
};
// kind: a RUBBER_DUCKS key. Facing right unless flip.
function drawRubberDuck(kind, x, y, s = 1, flip = false) {
  const [, body, beak, extra, behind] = RUBBER_DUCKS[kind];
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  behind?.();
  // one outline round body and head together, then the fills, so they read as one shape
  ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(RD_BODY); ctx.stroke(RD_HEAD);
  ctx.fillStyle = body; ctx.fill(RD_BODY); ctx.fill(RD_HEAD);
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(6, -76, 9, 5, -0.5);
  ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fill(RD_WING);
  ctx.strokeStyle = 'rgba(91,63,115,.5)'; ctx.lineWidth = 2; ctx.stroke(RD_WING);
  ink(RD_BEAK, beak, 2);
  rdEye(kind === 'ghost');
  extra();
  ctx.restore();
}
function squeak() { tone(1300, 0.09, 'square', 0.05, 0, 1900); tone(1800, 0.12, 'square', 0.05, 0.1, 1200); }

// --- things to hide behind (each drawn with its bottom centre at (0, 0)) ----------------------
function reedBlades(blades) {
  for (const [x, h, lean] of blades) {
    const tx = x + lean * h;
    ink(P2(`M${x - 6},0 Q${x - 4},${-h * 0.6} ${tx},${-h} Q${x + 4},${-h * 0.6} ${x + 6},0 Z`), x % 12 ? '#4fae4a' : '#68c25a', 1.5);
  }
}
// drawn behind the ducks, for things they hide among rather than behind
const HIDER_BACKS = {
  reeds() {
    reedBlades([[-44, 96, -0.25], [-30, 128, -0.1], [-18, 110, 0.12], [6, 118, 0.2], [30, 104, 0.25], [42, 124, 0.1], [0, 92, -0.2]]);
    for (const [x, h] of [[-24, 120], [8, 146], [30, 116]]) {
      ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -h); ctx.stroke();
      inkRect(x - 6, -h + 4, 12, 28, '#8a5a3a', 1.5, 6);
    }
  },
};
const HIDERS = {
  bush(v) { blit(bushSprite(v % 3), 0, 0, 0.7); },
  rock() {
    ink(P2('M-56,0 C-62,-28 -32,-56 0,-54 C32,-56 60,-32 56,0 Z'), '#a9a4b8', 2.5);
    ctx.fillStyle = '#c8c4d4'; ellipse(-14, -40, 22, 8, -0.2);
    ctx.fillStyle = '#6fbf5a'; ellipse(26, -46, 18, 6, 0.4); ellipse(-40, -10, 10, 5);
  },
  reeds() { reedBlades([[-38, 80, 0.3], [-6, 136, -0.05], [18, 132, 0.02], [36, 84, -0.3]]); },
  lily() {
    inkEllipse(0, -6, 64, 16, 0, '#4fbf5f', 2);
    ctx.fillStyle = '#3fa64f'; tri(0, -6, 60, -14, 62, -2);
    for (const a of [-1.2, -0.6, 0, 0.6, 1.2]) {
      inkAt(0, -12, a, P2('M0,0 C-16,-14 -10,-40 0,-50 C10,-40 16,-14 0,0 Z'), '#ff9acb', 1.5);
    }
    inkAt(0, -12, -0.3, P2('M0,0 C-10,-12 -6,-30 0,-38 C6,-30 10,-12 0,0 Z'), '#ffc8e4', 1.2);
    inkAt(0, -12, 0.3, P2('M0,0 C-10,-12 -6,-30 0,-38 C6,-30 10,-12 0,0 Z'), '#ffc8e4', 1.2);
    inkCircle(0, -18, 6, '#ffd84a', 1);
  },
  log() {
    ink(P2('M-84,-44 L84,-44 L84,0 L-84,0 C-94,0 -94,-44 -84,-44 Z'), '#a0683a', 2.5);
    ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2.5;
    for (const [x0, y] of [[-70, -32], [-30, -14], [10, -30], [-50, -20], [40, -16]]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 34, y); ctx.stroke(); }
    inkEllipse(84, -22, 14, 22, 0, '#c99a5a', 2);
    ctx.fillStyle = '#3a2418'; ctx.fill(HIDER_HOLES.log);
    ctx.fillStyle = '#6fbf5a'; ellipse(-40, -44, 18, 5); ellipse(30, -44, 10, 4);
    emoji('🍄', -60, -52, 18);
  },
  stump() {
    ink(P2('M-36,0 C-48,0 -52,-6 -40,-10 L-34,-58 L34,-58 L40,-10 C52,-6 48,0 36,0 Z'), '#a0683a', 2.5);
    inkEllipse(0, -58, 34, 10, 0, '#e0b878', 2);
    ctx.strokeStyle = '#b8884a'; ctx.lineWidth = 1.5; for (const r of [6, 14, 22]) { ctx.beginPath(); ctx.ellipse(0, -58, r, r * 0.28, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2.5; for (const x of [-20, 4, 22]) { ctx.beginPath(); ctx.moveTo(x, -44); ctx.lineTo(x + 2, -14); ctx.stroke(); }
  },
  bucket() {
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -56, 30, Math.PI, 0); ctx.stroke();
    ink(P2('M-34,-56 L34,-56 L26,0 L-26,0 Z'), '#4fa8ff', 2.5);
    inkRect(-36, -60, 72, 9, '#8ad4ff', 2, 4);
    ctx.fillStyle = '#ffd83a'; star(0, -28, 10, '#ffd83a', 5);
  },
  pot() {
    for (const [x, h, c] of [[-18, 128, '#ff6fae'], [14, 146, '#ffd83a'], [30, 110, '#c6a2ff']]) {
      ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x * 0.4, -40); ctx.quadraticCurveTo(x, -h * 0.6, x, -h); ctx.stroke();
      flower(x, -h, 13, c, '#ff9a2a', 1.4);
    }
    for (const [x, y, a] of [[-24, -70, -0.8], [24, -84, 0.7], [-10, -98, -0.5], [28, -60, 0.9], [-30, -50, -1.1]]) inkAt(x, y, a, P2('M0,0 C-10,-10 -10,-26 0,-34 C10,-26 10,-10 0,0 Z'), '#5ac84a', 1.5);
    ink(P2('M-36,-46 L36,-46 L28,0 L-28,0 Z'), '#d8743a', 2.5);
    inkRect(-40, -50, 80, 12, '#e88a4a', 2, 3);
  },
  mushroom() {
    inkRect(30, -36, 16, 36, '#fff6e0', 2, 5);
    inkEllipse(38, -38, 28, 14, 0, '#ff5f6a', 2);
    ink(P2('M-14,0 C-16,-30 -12,-50 -10,-66 L10,-66 C12,-50 16,-30 14,0 Z'), '#fff6e0', 2.5);
    ink(P2('M-54,-62 C-50,-96 50,-96 54,-62 C30,-56 -30,-56 -54,-62 Z'), '#ff4f5a', 2.5);
    ctx.fillStyle = '#fff'; for (const [x, y, r] of [[-28, -74, 7], [6, -84, 8], [32, -70, 6], [-8, -66, 4], [30, -42, 4], [44, -38, 3]]) circle(x, y, r);
  },
  basket() {
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, -44, 34, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#c98a4a'; ctx.lineWidth = 4; ctx.stroke();
    ink(P2('M-46,-44 L46,-44 L40,0 L-40,0 Z'), '#d8a060', 2.5);
    ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 2;
    for (let y = -34; y < 0; y += 10) { ctx.beginPath(); ctx.moveTo(-44, y); ctx.lineTo(44, y); ctx.stroke(); }
    ink(P2('M-46,-44 L-10,-44 L-16,-30 L-40,-30 Z'), '#ff6f7e', 1.5);
    ctx.fillStyle = '#fff'; for (const x of [-38, -26]) ctx.fillRect(x, -42, 6, 5);
  },
  duckhouse() {
    inkRect(-6, -54, 12, 54, '#a0683a', 2, 2);
    inkRect(-40, -58, 80, 8, '#c98a4a', 2, 2);
    inkRect(-34, -108, 68, 52, '#ffe08a', 2.5, 3);
    ink(P2('M-46,-104 L0,-142 L46,-104 Z'), '#ff6f6a', 2.5);
    ctx.fillStyle = '#3a2418'; ctx.fill(HIDER_HOLES.duckhouse);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(HIDER_HOLES.duckhouse);
  },
  boat() {
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-40, -30); ctx.lineTo(-90, 6); ctx.stroke();
    ctx.strokeStyle = '#c98a4a'; ctx.lineWidth = 4; ctx.stroke();
    ink(P2('M-86,-38 L86,-38 C80,-10 60,0 40,0 L-40,0 C-60,0 -80,-10 -86,-38 Z'), '#ff8a5a', 2.5);
    inkRect(-88, -42, 176, 8, '#fff6e0', 2, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-70, -24, 140, 5);
  },
  cloud() {
    ctx.fillStyle = 'rgba(255,255,255,.98)';
    for (const [x, y, r] of [[-56, -24, 28], [-24, -46, 36], [18, -50, 40], [56, -28, 30], [0, -20, 34]]) circle(x, y, r);
    ctx.fillRect(-60, -24, 120, 24);
    ctx.fillStyle = 'rgba(210,230,255,.6)'; ellipse(0, -4, 72, 8);
  },
};
// openings a duck can peek out of (drawn in front, clipped to the hole)
const HIDER_HOLES = { log: P2('M84,-22 m-9,0 a9,17 0 1,0 18,0 a9,17 0 1,0 -18,0'), duckhouse: P2('M-14,-56 L-14,-76 A14,14 0 0,1 14,-76 L14,-56 Z') };
// where ducks hide behind each thing: duck offset (x, y), scale, flip, how easy (0 obvious, 1 medium, 2 tricky), click spot [x, y, r], in = drawn in the hole
const HIDE_PEEKS = {
  bush: [{ x: 66, y: 2, s: 0.7, d: 0, hit: [80, -32, 32] }, { x: -8, y: -64, s: 0.6, f: 1, d: 1, hit: [-20, -100, 20] }, { x: -76, y: 0, s: 0.6, d: 2, hit: [-96, -22, 18] }],
  rock: [{ x: 54, y: 0, s: 0.65, d: 0, hit: [66, -30, 30] }, { x: 10, y: -38, s: 0.55, d: 1, hit: [20, -70, 18] }, { x: -30, y: -40, s: 0.35, f: 1, d: 2, hit: [-36, -60, 14] }],
  reeds: [{ x: 56, y: 0, s: 0.7, d: 0, hit: [68, -32, 30] }, { x: 0, y: 0, s: 0.72, d: 1, hit: [6, -36, 30] }, { x: -16, y: -4, s: 0.42, f: 1, d: 2, hit: [-22, -24, 18] }],
  lily: [{ x: 44, y: -8, s: 0.6, d: 0, hit: [54, -34, 28] }, { x: -4, y: -6, s: 0.62, d: 1, hit: [6, -46, 18] }, { x: -40, y: -10, s: 0.34, f: 1, d: 2, hit: [-44, -26, 14] }],
  log: [{ x: 104, y: 0, s: 0.65, d: 0, hit: [116, -30, 28] }, { x: -24, y: -12, s: 0.6, d: 1, hit: [-14, -52, 20] }, { x: 82, y: -6, s: 0.34, d: 2, in: 1, hit: [86, -24, 16] }],
  stump: [{ x: 46, y: 0, s: 0.6, d: 0, hit: [58, -28, 28] }, { x: -4, y: -46, s: 0.5, d: 1, hit: [6, -78, 18] }, { x: -46, y: 0, s: 0.55, d: 2, hit: [-62, -24, 16] }],
  bucket: [{ x: 42, y: 0, s: 0.6, d: 0, hit: [54, -28, 28] }, { x: 0, y: -28, s: 0.55, d: 1, hit: [10, -64, 18] }, { x: -4, y: -36, s: 0.42, f: 1, d: 2, hit: [-8, -64, 14] }],
  pot: [{ x: 44, y: 0, s: 0.6, d: 0, hit: [56, -28, 28] }, { x: -8, y: -36, s: 0.55, d: 1, hit: [0, -70, 18] }, { x: 4, y: -96, s: 0.3, f: 1, d: 2, hit: [0, -114, 13] }],
  mushroom: [{ x: -24, y: 0, s: 0.6, f: 1, d: 0, hit: [-32, -28, 28] }, { x: -12, y: -84, s: 0.48, d: 1, hit: [-4, -114, 18] }, { x: 38, y: -2, s: 0.28, f: 1, d: 2, hit: [36, -18, 13] }],
  basket: [{ x: 54, y: 0, s: 0.6, d: 0, hit: [66, -28, 28] }, { x: 4, y: -28, s: 0.52, d: 1, hit: [14, -62, 18] }, { x: 26, y: -36, s: 0.34, f: 1, d: 2, hit: [22, -58, 13] }],
  duckhouse: [{ x: 50, y: 0, s: 0.58, d: 0, hit: [60, -28, 28] }, { x: -2, y: -54, s: 0.42, d: 1, in: 1, hit: [2, -72, 16] }, { x: -26, y: -112, s: 0.28, f: 1, d: 2, hit: [-28, -130, 13] }],
  boat: [{ x: 14, y: -24, s: 0.62, d: 0, hit: [24, -60, 26] }, { x: -44, y: -26, s: 0.48, f: 1, d: 1, hit: [-50, -56, 18] }, { x: 84, y: 4, s: 0.36, f: 1, d: 2, hit: [96, -14, 14] }],
  cloud: [{ x: 22, y: -64, s: 0.55, d: 0, hit: [30, -96, 28] }, { x: -30, y: -40, s: 0.5, f: 1, d: 1, hit: [-38, -76, 18] }, { x: 70, y: -16, s: 0.34, d: 2, hit: [88, -30, 14] }],
};
function drawHider(kind, x, y, sc, v = 0, back = false) {
  if (back && !HIDER_BACKS[kind]) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  (back ? HIDER_BACKS : HIDERS)[kind](v);
  ctx.restore();
}

// --- the pond backdrop ---------------------------------------------------------------------
const POND = P2('M44,336 C60,292 300,282 480,286 C700,290 918,296 926,346 C934,404 820,442 600,448 C400,454 140,452 72,424 C30,406 28,366 44,336 Z');
function bdSunburst(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 0.2);
  ctx.fillStyle = 'rgba(255,224,90,.45)'; for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); tri(-8, -50, 8, -50, 0, -78); }
  ctx.restore(); bdSun(x, y);
}
function pondLilyPad(x, y, r, bloom) {
  inkEllipse(x, y, r, r * 0.3, 0, '#5ac85a', 1.5);
  ctx.fillStyle = '#7fe0ff'; tri(x, y, x + r, y - r * 0.12, x + r, y + r * 0.12);
  if (bloom) flower(x - r * 0.2, y - 4, r * 0.32, bloom, '#ffd84a', 1);
}
function drawPond() {
  bdSky('#46c0ff', '#eafcff');
  bdSunburst(800, 96);
  bdClouds(4);
  // far hills, trees and the meadow round the pond
  bdHills('#a8e690', 236, 24, 0.007);
  for (const [x, h, t] of [[40, 150, 0], [180, 120, 1], [560, 110, 2], [700, 140, 0], [930, 160, 1]]) drawTree(x, 262, h, 40, t, 0);
  bdHills('#8ddc78', 268, 10, 0.013, 2);
  ctx.fillStyle = '#7fd36a'; ctx.fillRect(0, 262, W, H - 262);
  ctx.fillStyle = '#93de7c'; for (let i = 0; i < 40; i++) ellipse((i * 211) % W, 470 + (i * 37) % 70, 14, 4);
  // sandy bank, then the water with sky reflections, sparkles and ripples
  ctx.strokeStyle = '#f0dfa0'; ctx.lineWidth = 16; ctx.stroke(POND);
  ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.stroke(POND);
  const wg = ctx.createLinearGradient(0, 286, 0, 450);
  wg.addColorStop(0, '#8ae8ff'); wg.addColorStop(0.5, '#4cc4f0'); wg.addColorStop(1, '#2f98e0');
  ctx.fillStyle = wg; ctx.fill(POND);
  ctx.save(); ctx.clip(POND);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(240, 304, 140, 7); ellipse(620, 312, 180, 6);
  ctx.fillStyle = 'rgba(255,236,140,.55)'; for (let i = 0; i < 5; i++) ellipse(800 + Math.sin(S.t * 2 + i) * 8, 310 + i * 14, 34 - i * 5, 3);
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) { const x = (i * 113 + S.t * 12) % 900 + 40, y = 320 + (i * 41) % 110; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 4, x + 28, y); ctx.stroke(); }
  for (const [x, y, ph] of [[180, 400, 0], [560, 360, 1.3], [760, 420, 2.4]]) {
    const k = (S.t * 0.5 + ph) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(x, y, 8 + k * 40, 2 + k * 10, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  // lily pads, a frog and a turtle sunbathing
  for (const [x, y, r, b] of [[150, 340, 22, '#ff9acb'], [200, 356, 14, null], [600, 434, 20, '#fff'], [880, 360, 18, '#ff9acb'], [540, 306, 14, null], [740, 312, 16, '#ffe08a']]) pondLilyPad(x, y, r, b);
  emoji('🐸', 196, 344, 24);
  inkEllipse(900, 432, 30, 9, 0, '#8a7a6a', 1.5); emoji('🐢', 900, 418, 28);
  // little wooden dock on the far bank
  inkRect(380, 280, 86, 14, '#c98a4a', 2, 2);
  for (const x of [386, 456]) inkRect(x, 292, 6, 18, '#a0683a', 1.5, 1);
  ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 1.5; for (let x = 396; x < 466; x += 12) { ctx.beginPath(); ctx.moveTo(x, 281); ctx.lineTo(x, 293); ctx.stroke(); }
  // cattails at the pond edges and pebbles on the banks
  for (const [x, y] of [[50, 350], [64, 412], [930, 350], [912, 412]]) {
    for (let i = -2; i <= 2; i++) { ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + i * 5, y); ctx.lineTo(x + i * 8, y - 50 - (i & 1) * 14); ctx.stroke(); }
    inkRect(x - 3, y - 64, 7, 16, '#8a5a3a', 1, 4); inkRect(x + 10, y - 54, 7, 14, '#8a5a3a', 1, 4);
  }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; inkEllipse(480 + Math.cos(a) * 452, 368 + Math.sin(a) * 94, 7 + (i % 3) * 2, 4 + (i % 2) * 2, 0, ['#d8d0e0', '#c8c0d4', '#e8e0ec'][i % 3], 1); }
  // flowers, clover and tiny mushrooms in the grass
  for (let i = 0; i < 14; i++) flower(20 + i * 70 + (i % 2) * 20, 474 + (i % 3) * 22, 7, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff', '#ff9a5a'][i % 5], '#ffd84a', 1.2);
  for (const x of [130, 470, 790]) { inkRect(x - 2, GY + 30, 5, 10, '#fff6e0', 1, 2); inkEllipse(x, GY + 30, 9, 5, 0, '#ff5f6a', 1); }
  // a dragonfly zipping about and two butterflies
  const dx = 300 + Math.sin(S.t * 0.7) * 220, dy = 250 + Math.sin(S.t * 2.1) * 30;
  ctx.fillStyle = 'rgba(200,240,255,.8)'; ellipse(dx - 6, dy - 6, 10, 4, -0.6 + Math.sin(S.t * 40) * 0.3); ellipse(dx + 6, dy - 6, 10, 4, 0.6 - Math.sin(S.t * 40) * 0.3);
  ctx.strokeStyle = '#2a8ad8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(dx - 16, dy); ctx.lineTo(dx + 10, dy); ctx.stroke();
  emoji('🦋', 680 + Math.sin(S.t * 0.9) * 60, 220 + Math.sin(S.t * 2.6) * 18, 22);
  emoji('🦋', 120 + Math.sin(S.t * 1.1 + 2) * 50, 460 + Math.sin(S.t * 2.2) * 14, 18);
}

// --- real duck species (side view, swimming, waterline at y = 0, facing right) -----------------
// Each species has ONE big "look for" feature (its `look` clue), drawn large and bright so a young
// player can pick it out; `tags` name the features it shares, so Duck Spotter never offers two
// ducks that both fit the clue.
const WD_BODY = P2('M-62,-28 C-54,-52 -6,-56 28,-50 C58,-46 68,-24 62,-8 C54,8 -28,10 -50,2 C-62,-4 -68,-16 -62,-28 Z');
const WD_TAIL = P2('M-56,-30 L-86,-44 L-80,-34 L-88,-28 L-58,-14 Z');
const WD_WING = P2('M-52,-36 C-36,-50 6,-50 26,-38 C18,-22 -10,-16 -42,-20 C-52,-22 -58,-28 -52,-36 Z');
function wdNeck(hx, hy) { return P2(`M22,-46 C26,-58 ${hx - 18},${hy + 4} ${hx - 10},${hy + 12} L${hx + 12},${hy + 12} C${hx + 8},${hy + 24} 52,-48 58,-34 Z`); }
const wdBill = (hx, hy, r) => P2(`M${hx + r - 6},${hy - 2} C${hx + r + 8},${hy - 6} ${hx + r + 22},${hy - 2} ${hx + r + 24},${hy + 6} C${hx + r + 18},${hy + 12} ${hx + r + 4},${hy + 12} ${hx + r - 6},${hy + 9} Z`);
function wdHeadPath(hx, hy, r) { const p = new Path2D(); p.arc(hx, hy, r, 0, Math.PI * 2); return p; }
function clipped(path, fn) { ctx.save(); ctx.clip(path); fn(); ctx.restore(); }
// lit from above: lighter on top, a little darker underneath
function wdShade(col, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, mix(col, '#ffffff', 0.3)); g.addColorStop(1, mix(col, '#000000', 0.18));
  return g;
}
function stripe(w, col, pts) {
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
}
const DUCK_SPECIES = {
  mallard: { name: 'Mallard', look: 'a [green head]', lookColor: '#1fae52', tags: ['green-head', 'yellow-bill'], spot: [46, -70, 30],
    head: '#178a44', breast: '#8a4a2e', body: '#d6d9e0', back: '#9aa0aa', wing: '#8f949e', tail: '#2a2a32', bill: '#ffd23a',
    extra: () => {
      stripe(6, '#fff', [[31, -54], [45, -50], [59, -55]]);
      inkRect(-26, -36, 30, 10, '#3a5ae8', 1.5, 3);
      stripe(2, '#fff', [[-26, -37], [4, -37]]);
      ctx.strokeStyle = '#2a2a32'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(-72, -48, 5, 0, Math.PI * 1.7); ctx.stroke();
    } },
  wood: { name: 'Wood Duck', look: 'a [rainbow head]', lookColor: '#9a4ad8', tags: ['green-head', 'stripes', 'red-bill', 'crest'], spot: [36, -76, 40], span: [-88, 92, -104],
    head: '#1f8a5a', breast: '#8a3a3a', body: '#e0c48a', back: '#3a3a4a', wing: '#3a3a52', tail: '#2a2a3a', bill: '#ff4a3a', eye: '#ff2a2a', eyeR: 5.5,
    crestColor: '#7a3ac8',
    crest: (hx, hy) => P2(`M${hx + 6},${hy - 18} C${hx - 20},${hy - 34} ${hx - 58},${hy - 22} ${hx - 64},${hy + 8} C${hx - 46},${hy} ${hx - 30},${hy + 4} ${hx - 12},${hy + 6} Z`),
    extra: (hx, hy) => {
      clipped(wdHeadPath(hx, hy, 20), () => { ctx.fillStyle = '#3a6ae0'; ellipse(hx - 4, hy + 10, 22, 9); });
      stripe(4, '#fff', [[hx + 14, hy - 10], [hx - 6, hy - 20], [hx - 60, hy + 4]]);
      stripe(4, '#fff', [[hx + 6, hy + 2], [hx - 14, hy + 2], [hx - 34, hy + 10]]);
      stripe(4, '#fff', [[hx + 12, hy + 16], [hx - 2, hy + 18], [hx - 8, hy + 8]]);
      clipped(WD_BODY, () => { ctx.fillStyle = '#fff'; for (const [x, y] of [[40, -38], [50, -28], [36, -24], [46, -16], [56, -40]]) circle(x, y, 2.4); });
      stripe(4, '#fff', [[20, -46], [18, -8]]);
      ctx.fillStyle = '#ff8a2a'; circle(hx + 4, hy - 4, 7.5);
    } },
  mandarin: { name: 'Mandarin Duck', look: '[orange sails] on its back', lookColor: '#ff8a1a', tags: ['orange', 'stripes', 'red-bill', 'crest'], spot: [-6, -66, 32], span: [-88, 92, -100],
    head: '#3a6a5a', breast: '#6a3a7a', body: '#d09858', back: '#5a4a3a', wing: '#6a5a4a', tail: '#4a3a2a', bill: '#ff3a4a',
    behind: () => {
      for (const dx of [-24, -2]) ink(P2(`M${dx},-46 C${dx - 10},-74 ${dx + 4},-96 ${dx + 26},-94 C${dx + 24},-74 ${dx + 18},-58 ${dx + 14},-46 Z`), '#ff8a1a', 2);
      for (const dx of [-24, -2]) stripe(2, '#c85a0a', [[dx + 6, -50], [dx + 12, -86]]);
    },
    extra: (hx, hy) => {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(hx + 12, hy - 8); ctx.quadraticCurveTo(hx - 10, hy - 22, hx - 36, hy - 4); ctx.quadraticCurveTo(hx - 10, hy - 10, hx + 12, hy - 1); ctx.fill();
      for (let i = 0; i < 7; i++) inkAt(hx - 6 + i * 2, hy + 10, 2.0 + i * 0.15, P2('M0,-4 L28,0 L0,4 Z'), '#ff8a1a', 0.8);
      stripe(4, '#fff', [[28, -46], [26, -14]]); stripe(4, '#fff', [[36, -46], [34, -14]]);
    } },
  shoveler: { name: 'Shoveler', look: 'a giant [spoon bill]', lookColor: '#ff9a2a', tags: ['green-head', 'big-bill'], spot: [102, -68, 28], span: [-88, 122, -92],
    head: '#1f7a4a', breast: '#fafafa', body: '#c8642a', back: '#3a3a42', wing: '#6a90c8', tail: '#2a2a32', bill: '#2a2a32', eye: '#ffd23a', eyeR: 4.5,
    billPath: (hx, hy, r) => P2(`M${hx + r - 6},${hy - 6} C${hx + r + 14},${hy - 14} ${hx + r + 44},${hy - 12} ${hx + r + 54},${hy} C${hx + r + 52},${hy + 16} ${hx + r + 20},${hy + 14} ${hx + r - 6},${hy + 8} Z`),
    extra: () => { clipped(WD_BODY, () => { ctx.fillStyle = '#fafafa'; ctx.fillRect(-64, -30, 16, 40); }); } },
  merganser: { name: 'Hooded Merganser', look: 'a big [white fan] on its head', lookColor: '#ffffff', tags: ['white-head', 'crest'], spot: [30, -86, 40], span: [-88, 92, -120],
    head: '#22222a', breast: '#fafafa', body: '#c0682a', back: '#22222a', wing: '#3a3a44', tail: '#2a2a32', bill: '#22222a', eye: '#ffd23a', eyeR: 4.5,
    billPath: (hx, hy, r) => P2(`M${hx + r - 6},${hy - 2} L${hx + r + 26},${hy + 4} L${hx + r - 6},${hy + 8} Z`),
    crest: (hx, hy) => { const p = new Path2D(); p.ellipse(hx - 16, hy - 16, 40, 30, -0.2, 0, Math.PI * 2); return p; },
    extra: (hx, hy) => {
      ctx.fillStyle = '#fff'; ellipse(hx - 22, hy - 18, 30, 21, -0.2);
      stripe(4, '#22222a', [[30, -46], [32, -20]]); stripe(4, '#22222a', [[40, -46], [42, -20]]);
    } },
  pintail: { name: 'Pintail', look: 'a long, [pointy tail]', lookColor: '#ff6fb5', tags: ['long-tail', 'white-neck'], spot: [-108, -62, 28], span: [-138, 104, -124],
    head: '#6a4a32', neck: '#6a4a32', breast: '#fafafa', body: '#c4c8d0', back: '#7a7e88', wing: '#8a8e98', tail: '#2a2a32', bill: '#6a7a98', hx: 58, hy: -106, r: 17,
    tailPath: P2('M-56,-36 L-138,-82 L-124,-58 L-58,-12 Z'),
    extra: (hx, hy) => {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(hx - 4, hy + 10); ctx.quadraticCurveTo(hx - 10, hy + 34, 34, -46); ctx.lineTo(48, -42); ctx.quadraticCurveTo(hx + 2, hy + 30, hx + 6, hy + 12); ctx.fill();
    } },
  bufflehead: { name: 'Bufflehead', look: 'a big [white spot] on its head', lookColor: '#ffffff', tags: ['white-head'], spot: [32, -76, 30], size: 0.85, span: [-88, 98, -104],
    head: '#2a2a4a', breast: '#fafafa', body: '#fafafa', back: '#22222a', wing: '#2a2a32', tail: '#3a3a42', bill: '#8a90a0', hy: -76, r: 28,
    extra: (hx, hy) => {
      clipped(wdHeadPath(hx, hy, 28), () => {
        ctx.fillStyle = 'rgba(170,90,220,.5)'; ellipse(hx + 10, hy - 14, 14, 8);
        ctx.fillStyle = 'rgba(60,200,140,.4)'; ellipse(hx + 14, hy + 6, 12, 8);
        ctx.fillStyle = '#fff'; ellipse(hx - 16, hy - 2, 20, 17, 0.3);
      });
    } },
  ruddy: { name: 'Ruddy Duck', look: 'a bright [blue bill]', lookColor: '#2a9aff', tags: ['blue-bill', 'white-head', 'tail-up'], spot: [80, -66, 22], span: [-90, 96, -100],
    head: '#22222a', breast: '#b0482a', body: '#b0482a', back: '#8a3a22', wing: '#8a3a22', tail: '#3a2a22', bill: '#2a9aff',
    billPath: (hx, hy, r) => P2(`M${hx + r - 6},${hy - 6} C${hx + r + 10},${hy - 10} ${hx + r + 26},${hy - 4} ${hx + r + 28},${hy + 6} C${hx + r + 20},${hy + 14} ${hx + r + 4},${hy + 14} ${hx + r - 6},${hy + 10} Z`),
    tailPath: P2('M-54,-32 L-78,-96 L-56,-98 L-44,-36 Z'),
    extra: (hx, hy) => {
      clipped(wdHeadPath(hx, hy, 20), () => { ctx.fillStyle = '#fff'; ellipse(hx + 2, hy + 10, 19, 11); });
      for (const tx of [-72, -65, -58]) stripe(2, '#1a120e', [[-50, -38], [tx, -92]]);
    } },
  muscovy: { name: 'Muscovy Duck', look: 'a [bumpy red face]', lookColor: '#ff3a3a', tags: ['red-head'], spot: [52, -68, 26], size: 1.05,
    head: '#2a2a32', breast: '#2a2a32', body: '#2a2a32', back: '#1f6a52', wing: '#1f5a4a', tail: '#22222a', bill: '#f0b8a8',
    extra: (hx, hy) => {
      ctx.fillStyle = '#fafafa'; ellipse(-14, -26, 32, 9); ellipse(hx - 8, hy + 4, 8, 11);
      for (const [x, y, rr] of [[4, -4, 9], [12, 3, 7], [12, -10, 6], [-5, -2, 6], [17, 8, 5], [3, 8, 5], [-2, -12, 5]]) inkCircle(hx + x, hy + y, rr, '#ff3a3a', 0.8);
    } },
  harlequin: { name: 'Harlequin Duck', look: 'bold [white stripes]', lookColor: '#ffffff', tags: ['stripes', 'blue'], spot: [14, -36, 46],
    head: '#3a4a8a', breast: '#3a4a8a', body: '#c0582a', back: '#3a4a8a', wing: '#34407a', tail: '#2a2a3a', bill: '#3a3a4a',
    extra: (hx, hy) => {
      clipped(WD_BODY, () => { ctx.fillStyle = '#3a4a8a'; ctx.fillRect(20, -56, 50, 66); });
      ctx.fillStyle = '#fff'; ellipse(hx + 10, hy - 6, 5, 8, 0.3); circle(hx - 6, hy + 2, 5);
      stripe(5, '#fff', [[hx - 14, hy + 6], [hx - 9, hy + 16]]);
      stripe(5, '#fff', [[30, -50], [40, -34], [36, -16]]);
      stripe(5, '#fff', [[22, -48], [20, -10]]);
      stripe(5, '#fff', [[-40, -40], [-6, -42]]);
      stripe(5, '#fff', [[-34, -28], [-10, -30]]);
    } },
  canvasback: { name: 'Canvasback', look: 'a [red head]', lookColor: '#e0401e', tags: ['red-head'], spot: [52, -70, 30], span: [-88, 100, -94],
    head: '#b03a1e', breast: '#22222a', body: '#eceef2', back: '#dcdee4', wing: '#d0d2d8', tail: '#22222a', bill: '#22222a', eye: '#ff3a2a', eyeR: 4.5,
    headPath: (hx, hy) => P2(`M${hx - 16},${hy + 14} C${hx - 24},${hy - 8} ${hx - 12},${hy - 22} ${hx + 2},${hy - 20} C${hx + 12},${hy - 18} ${hx + 22},${hy - 8} ${hx + 30},${hy + 4} L${hx + 16},${hy + 16} Z`),
    billPath: (hx, hy) => P2(`M${hx + 26},${hy} L${hx + 52},${hy + 12} L${hx + 48},${hy + 17} L${hx + 16},${hy + 14} Z`) },
};
function drawDuckSpecies(id, x, y, s = 1, flip = false) {
  const d = DUCK_SPECIES[id];
  const hx = d.hx ?? 46, hy = d.hy ?? -70, r = d.r ?? 20;
  const head = d.headPath ? d.headPath(hx, hy) : wdHeadPath(hx, hy, r), neck = wdNeck(hx, hy), tail = d.tailPath || WD_TAIL;
  const crest = d.crest?.(hx, hy), bill = d.billPath ? d.billPath(hx, hy, r) : wdBill(hx, hy, r);
  ctx.save(); ctx.translate(x, y); ctx.scale((flip ? -s : s) * (d.size || 1), s * (d.size || 1));
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  d.behind?.(hx, hy);
  // outline everything first, then fill, so body, neck and head join without seams
  ctx.strokeStyle = OL; ctx.lineWidth = 4.5;
  for (const p of [tail, WD_BODY, neck, head, crest]) if (p) ctx.stroke(p);
  ctx.fillStyle = d.tail; ctx.fill(tail);
  ctx.fillStyle = wdShade(d.body, -54, 8); ctx.fill(WD_BODY);
  clipped(WD_BODY, () => {
    ctx.fillStyle = wdShade(d.breast, -54, 8); ellipse(50, -24, 26, 32);
    ctx.fillStyle = d.back; ellipse(-16, -52, 54, 12);
  });
  // folded wing, with the tips of the flight feathers at the back
  const wing = d.wing || d.back;
  ink(WD_WING, wdShade(wing, -50, -16), 1.5);
  ctx.strokeStyle = mix(wing, '#000000', 0.3); ctx.lineWidth = 2;
  for (const fx of [-44, -30, -16]) { ctx.beginPath(); ctx.arc(fx, -28, 9, 0.3, Math.PI - 0.3); ctx.stroke(); }
  if (crest) { ctx.fillStyle = d.crestColor || d.head; ctx.fill(crest); }
  ctx.fillStyle = d.neck || d.head; ctx.fill(neck);
  ctx.fillStyle = wdShade(d.head, hy - r, hy + r); ctx.fill(head);
  clipped(head, () => { ctx.fillStyle = 'rgba(255,255,255,.22)'; ellipse(hx - 4, hy - r * 0.45, r * 0.7, r * 0.35, -0.3); });
  ink(bill, d.bill, 1.5);
  d.extra?.(hx, hy);
  ctx.fillStyle = '#1a1a22'; circle(hx + 4, hy - 4, (d.eyeR || 3.6) + 1);
  ctx.fillStyle = d.eye || '#1a1a22'; circle(hx + 4, hy - 4, d.eyeR || 3.6);
  if (d.eye) { ctx.fillStyle = '#1a1a22'; circle(hx + 4, hy - 4, (d.eyeR || 3.6) * 0.45); }
  ctx.fillStyle = '#fff'; circle(hx + 2.8, hy - 5.4, 1.4);
  ctx.restore();
}
// draws a species as large as fits in a w×h box above a waterline centred at (cx, wy);
// returns where its look-for spot landed, as [x, y, radius] on screen
function drawDuckFit(id, cx, wy, w, h, bob = 0) {
  const d = DUCK_SPECIES[id], [l, r, t] = d.span || [-88, 92, -92], k = d.size || 1;
  const s = Math.min(w / ((r - l) * k), h / (-t * k)), x = cx - (l + r) / 2 * s * k;
  drawDuckSpecies(id, x, wy + bob, s);
  const [sx, sy, sr] = d.spot;
  return [x + sx * s * k, wy + bob + sy * s * k, sr * s * k];
}
// a little pond picture for one Duck Spotter card; the duck sits on the waterline, and the water
// is drawn over its belly afterwards (frontWater) so it looks like it's swimming
function pondCard(x, y, w, h) {
  const wy = y + h * 0.66;
  const sky = ctx.createLinearGradient(0, y, 0, wy);
  sky.addColorStop(0, '#bfeaff'); sky.addColorStop(1, '#eaf9ff');
  ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#9ad87a'; ellipse(x + w * 0.2, wy, w * 0.4, 16); ellipse(x + w * 0.85, wy, w * 0.35, 12);
  return wy;
}
function frontWater(x, y, w, h, wy, t) {
  const water = ctx.createLinearGradient(0, wy, 0, y + h);
  water.addColorStop(0, 'rgba(70,180,235,.92)'); water.addColorStop(1, 'rgba(40,130,210,.98)');
  ctx.fillStyle = water; ctx.fillRect(x, wy, w, y + h - wy);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); for (let i = 0; i <= w; i += 6) ctx.lineTo(x + i, wy + Math.sin(i / 14 + t * 2) * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
  for (const [fx, fy] of [[0.25, 0.4], [0.7, 0.65]]) { ctx.beginPath(); ctx.ellipse(x + w * fx, wy + (y + h - wy) * fy, w * 0.12, 3, 0, 0, Math.PI * 2); ctx.stroke(); }
}
function quack() { tone(330, 0.12, 'sawtooth', 0.06, 0, 230); tone(310, 0.14, 'sawtooth', 0.06, 0.16, 210); }
